import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 21 records·collections로 Spring autowiring의 candidate metadata를 작은 결정적 모델로 표현합니다." },
      { lines: "19-끝에서 5줄 전", explanation: "type 후보 집합을 qualifier, primary, order 또는 profile 조건으로 좁히며 0/1/N cardinality를 실행합니다." },
      { lines: "마지막 5줄", explanation: "선택된 canonical name, 후보 목록, 순서와 failure category만 출력해 구성값·객체 전체 dump를 피합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring jar·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "candidate model은 학습용이며 실제 Spring의 ResolvableType, proxy, FactoryBean과 injection algorithm을 대체하지 않습니다."] },
    experiments: [
      { change: "candidate, qualifier, primary, order와 profile 조합을 하나씩 바꿉니다.", prediction: "required single은 정확히 하나의 결정 근거가 있어야 하며 collection은 모든 적격 후보를 안정된 순서로 보존합니다.", result: "변경 전 예상 0/1/N과 실제 stdout을 비교합니다." },
      { change: "동일 구성을 실제 AnnotationConfigApplicationContext test로 옮깁니다.", prediction: "generic type, factory product와 proxy metadata가 추가 후보 판단에 개입합니다.", result: "bean names for type, runtime class와 selected qualifier를 readback합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "annotation-processing",
    title: "@Autowired를 reflection 마법이 아니라 등록된 post-processor의 injection metadata 처리로 이해합니다",
    lead: "annotation은 스스로 객체를 넣지 않으며 context가 annotation processor를 등록하고 bean definition·injection point·candidate metadata를 해석할 때 동작합니다.",
    explanations: [
      "원본 autowired-context.xml은 annotation-config를 활성화하고 같은 Document class의 doc1/doc2를 함께 등록해 type 자동 주입 충돌을 학습합니다. 이 세션은 두 후보 구조만 provenance로 사용합니다.",
      "AutowiredAnnotationBeanPostProcessor가 constructor, field, method injection metadata를 찾고 BeanFactory에 dependency resolution을 요청합니다. processor가 없는 수동 BeanFactory에서는 annotation이 있어도 기대한 처리가 일어나지 않을 수 있습니다.",
      "component scan은 후보 definition 발견이고 @Autowired는 이미 등록된 definitions 사이의 dependency resolution입니다. scanning package가 넓거나 좁은 문제와 injection candidate가 여러 개인 문제를 구분합니다.",
      "field injection은 생성 후 reflection 단계에서 적용되어 required contract와 plain Java construction을 숨깁니다. 단일 constructor injection을 기본으로 하고 setter/method는 실제 optional/reconfiguration 의미가 있을 때 선택합니다.",
      "annotation metadata는 runtime configuration의 일부이므로 framework/JDK/compiler upgrade에서 retention, parameter metadata, proxy와 AOT 처리를 context tests로 qualification합니다.",
    ],
    concepts: [
      c("injection point", "constructor parameter, field 또는 method parameter처럼 dependency가 공급되는 위치입니다.", ["required type과 qualifiers를 가집니다.", "0/1/N resolution contract를 가집니다."]),
      c("annotation processor", "annotation metadata를 읽어 injection/lifecycle/proxy behavior를 적용하는 container extension입니다.", ["등록되어야 동작합니다.", "phase와 order를 검증합니다."]),
      c("component scan", "지정 package의 component 후보를 찾아 BeanDefinition으로 등록하는 과정입니다.", ["injection과 다른 단계입니다.", "scan boundary와 duplicate를 관리합니다."]),
    ],
    codeExamples: [java("core06-candidate-pipeline", "type→qualifier→primary 후보 pipeline", "Core06Candidates.java", "type 후보가 세 개일 때 qualifier와 primary를 순서대로 적용해 단일 dependency를 결정합니다.", String.raw`import java.util.List;
import java.util.Set;

public class Core06Candidates {
  record Candidate(String name, Set<String> qualifiers, boolean primary) {}
  static Candidate resolve(List<Candidate> candidates, String qualifier) {
    List<Candidate> filtered = qualifier == null ? candidates : candidates.stream().filter(c -> c.qualifiers().contains(qualifier)).toList();
    if (filtered.size() == 1) return filtered.getFirst();
    List<Candidate> primary = filtered.stream().filter(Candidate::primary).toList();
    if (primary.size() == 1) return primary.getFirst();
    throw new IllegalStateException("candidates=" + filtered.stream().map(Candidate::name).toList());
  }
  public static void main(String[] args) {
    List<Candidate> all = List.of(
      new Candidate("email", Set.of("async"), true),
      new Candidate("sms", Set.of("urgent"), false),
      new Candidate("audit", Set.of("async"), false));
    System.out.println("urgent=" + resolve(all, "urgent").name());
    System.out.println("default=" + resolve(all, null).name());
    System.out.println("async=" + resolve(all, "async").name());
  }
}`, "urgent=sms\ndefault=email\nasync=email", ["local-autowired-context", "spring-autowired", "spring-autowired-api", "java-list", "java-set"])],
    diagnostics: [
      d("@Autowired field가 항상 null입니다.", "annotation processor가 등록되지 않은 수동 factory이거나 객체를 container 밖에서 new했습니다.", ["object creator", "context type", "registered post-processors", "bean definition", "injection metadata"], "객체를 composition root/container에서 생성하고 필요한 annotation processing을 공식 bootstrap 방식으로 등록합니다.", "plain construction과 context construction 경계를 architecture test로 구분합니다."),
      d("component scan을 늘렸더니 autowiring conflict가 생깁니다.", "새 package의 같은 interface 구현이 candidate set에 추가되었습니다.", ["scan roots", "new bean names", "type candidates", "qualifiers", "profiles"], "scan boundary를 module별로 제한하고 semantic qualifier/explicit configuration으로 선택 정책을 둡니다.", "scan manifest와 candidate-cardinality regression test를 둡니다."),
    ],
    expertNotes: ["annotation-config와 component-scan을 같은 기능으로 설명하면 definition discovery와 injection processing의 원인을 놓칩니다.", "annotation 편의보다 object graph가 어디서 등록되고 어떻게 선택되는지 추적 가능해야 합니다."],
  },
  {
    id: "required-constructor-method-field",
    title: "constructor·method·field injection의 상태·필수성·테스트 비용을 비교합니다",
    lead: "같은 @Autowired라도 injection point 종류에 따라 객체가 완전한 상태가 되는 시점과 재구성 가능성, reflection 의존성이 달라집니다.",
    explanations: [
      "단일 constructor는 @Autowired 없이도 선택될 수 있고 required dependencies를 final field에 보존할 수 있습니다. class API가 요구조건을 노출해 container 없는 unit test가 쉽습니다.",
      "method/setter injection은 객체 생성 후 호출되므로 optional capability나 legacy mutable property에 사용할 수 있지만 호출 전 invalid state와 반복 호출 의미를 정의해야 합니다.",
      "field injection은 code가 짧지만 hidden dependency, reflection mutation, final 사용 불가와 test setup 비용이 큽니다. 새 code의 기본값으로 삼지 않습니다.",
      "required=false, Optional, @Nullable과 collection injection은 각각 absence semantics가 다릅니다. 단순히 startup failure를 없애려고 필수 기능을 optional로 바꾸지 않습니다.",
      "여러 parameter를 가진 non-required method는 한 argument라도 만족되지 않을 때 method 전체가 호출되지 않을 수 있으므로 default state와 관측성을 공식 버전 문서로 확인합니다.",
    ],
    concepts: [
      c("required injection", "dependency가 해결되지 않으면 bean 생성이 실패해야 하는 injection contract입니다.", ["constructor argument는 기본적으로 required입니다.", "fail-fast startup과 연결합니다."]),
      c("method injection", "bean 생성 뒤 container가 dependency arguments를 가진 method를 호출하는 주입 방식입니다.", ["optional override에 쓸 수 있습니다.", "미호출/반복 호출 상태를 정의합니다."]),
      c("field injection", "container가 reflection으로 field에 dependency를 설정하는 방식입니다.", ["dependency API가 숨습니다.", "final·plain Java test에 불리합니다."]),
    ],
    diagnostics: [
      d("unit test가 private field reflection helper를 사용합니다.", "field injection이 production dependency contract를 숨겼습니다.", ["injected fields", "test utilities", "constructors", "null states", "context startup"], "required fields를 constructor parameters로 옮기고 fake를 public constructor에 직접 전달합니다.", "core/service classes의 field injection을 architecture rule로 금지합니다."),
      d("optional setter가 호출되지 않아 이전 값이 남습니다.", "non-required method injection의 미호출 semantics와 mutable default를 고려하지 않았습니다.", ["required flag", "all method parameters", "default field", "reuse/lifecycle", "configuration change"], "absence를 명시적 immutable strategy/Optional constructor contract로 만들거나 bean을 새로 구성합니다.", "dependency absent/present 두 context tests를 둡니다."),
    ],
    expertNotes: ["injection 방식은 스타일 논쟁이 아니라 instance invariant와 lifecycle contract 선택입니다.", "framework가 지원한다는 사실과 application architecture에 적합하다는 결론을 분리합니다."],
  },
  {
    id: "type-generic-resolution",
    title: "type과 generic metadata로 첫 후보 집합을 만들고 runtime proxy 한계를 검증합니다",
    lead: "autowiring은 단순 class 이름 비교가 아니라 assignability와 ResolvableType, factory product type, generic qualifier를 이용해 후보를 찾습니다.",
    explanations: [
      "injection interface에 assignable한 beans가 type 후보가 됩니다. concrete class에 의존하면 proxy 전략과 implementation 교체에 취약하므로 application port를 parameter type으로 사용합니다.",
      "Repository<Order>와 Repository<Customer>처럼 generic argument가 후보를 좁힐 수 있지만 @Bean method의 선언 return type이 너무 넓으면 container가 creation 전 정확한 type을 알기 어려울 수 있습니다.",
      "FactoryBean은 factory object와 product object의 조회 의미가 다르고 product type prediction이 candidate resolution에 영향을 줍니다. name prefix나 구현 세부사항을 business code에 누출하지 않습니다.",
      "JDK dynamic proxy는 interface 중심이고 class proxy는 subclass 가능성에 제약이 있습니다. runtime class equality/cast 대신 interface contract와 AopUtils 같은 공식 introspection 경계를 사용합니다.",
      "AOT/native image에서는 reflection과 generated metadata가 달라질 수 있으므로 동일 injection graph를 native integration test에서도 확인합니다.",
    ],
    concepts: [
      c("ResolvableType", "generic까지 포함한 Java type 정보를 Spring이 dependency resolution에 사용하는 abstraction입니다.", ["collection element와 generic interface를 표현합니다.", "factory return declaration이 중요합니다."]),
      c("FactoryBean", "container에서 다른 object를 생성해 product로 노출하는 factory contract입니다.", ["factory와 product 조회를 구분합니다.", "product type prediction을 검증합니다."]),
      c("proxy type", "AOP 등을 위해 target 앞에 생성된 runtime wrapper의 interface/class 형태입니다.", ["concrete cast를 피합니다.", "advisor와 target contract를 integration test합니다."]),
    ],
    codeExamples: [java("core06-generic-candidates", "generic token으로 같은 raw type 후보 좁히기", "Core06Generics.java", "교육용 raw type+generic token registry에서 Order와 Customer repository 후보를 분리합니다.", String.raw`import java.util.List;

public class Core06Generics {
  record Candidate(String name, Class<?> rawType, String genericType) {}
  interface Repository {}
  static Candidate resolve(List<Candidate> all, Class<?> raw, String generic) {
    List<Candidate> matches = all.stream().filter(c -> c.rawType() == raw && c.genericType().equals(generic)).toList();
    if (matches.size() != 1) throw new IllegalStateException("matches=" + matches.size());
    return matches.getFirst();
  }
  public static void main(String[] args) {
    List<Candidate> all = List.of(
      new Candidate("orderRepository", Repository.class, "Order"),
      new Candidate("customerRepository", Repository.class, "Customer"));
    System.out.println("order=" + resolve(all, Repository.class, "Order").name());
    System.out.println("customer=" + resolve(all, Repository.class, "Customer").name());
    try { resolve(all, Repository.class, "Invoice"); }
    catch (IllegalStateException error) { System.out.println("missing=" + error.getMessage()); }
  }
}`, "order=orderRepository\ncustomer=customerRepository\nmissing=matches=0", ["spring-autowired-qualifiers", "spring-resolvable-type", "spring-factory-bean", "java-list"])],
    diagnostics: [
      d("generic repository 후보가 0개로 보입니다.", "@Bean return type이나 proxy/factory metadata가 필요한 generic contract를 노출하지 않습니다.", ["injection ResolvableType", "factory method return", "runtime target", "bridge methods", "bean names for type"], "factory declaration을 application contract generic type으로 명확히 하고 context resolution test를 둡니다.", "generic 후보 manifest와 upgrade regression test를 유지합니다."),
      d("주입된 bean을 concrete class로 cast하다 실패합니다.", "runtime object가 JDK proxy이거나 다른 implementation으로 교체되었습니다.", ["injection point type", "runtime interfaces", "proxy strategy", "casts", "AOP advisors"], "interface port에 의존하고 implementation-specific operation은 별도 adapter contract로 분리합니다.", "no-concrete-cast static rule과 proxy integration tests를 둡니다."),
    ],
    expertNotes: ["type-safe injection도 @Bean return signature가 정보를 숨기면 runtime resolution이 약해집니다.", "proxy가 있다는 사실보다 어떤 interface behavior와 advisor order가 보존되는지가 검증 대상입니다."],
  },
  {
    id: "qualifier-semantics",
    title: "@Qualifier를 bean 이름 문자열이 아니라 capability 속성의 교집합으로 설계합니다",
    lead: "qualifier는 type 후보 집합을 semantic metadata로 좁히며 여러 qualifier가 있을 때 모든 요구조건을 만족하는 후보만 남아야 합니다.",
    explanations: [
      "@Qualifier(\"main\") 같은 문자열은 간단하지만 naming drift와 오타가 runtime에 나타납니다. @Region, @Channel 같은 custom qualifier annotation으로 허용 vocabulary와 attributes를 type에 가깝게 표현합니다.",
      "qualifier는 구현 class를 직접 지정하기보다 'primary-eu-payment', 'audit-only'처럼 consumer가 필요한 capability를 표현해야 port와 implementation 교체가 가능합니다.",
      "constructor parameter와 bean definition/factory method 양쪽 metadata가 일치해야 합니다. stereotype meta-annotation과 attribute alias를 사용할 때 retention/target과 equality semantics를 테스트합니다.",
      "collection injection에 qualifier를 붙이면 qualifier를 가진 모든 후보가 들어옵니다. 하나만 선택한다고 가정하지 않고 collection order·duplicate semantic key를 검증합니다.",
      "bean name은 fallback qualifier처럼 작동할 수 있지만 explicit qualifier가 더 명확합니다. source parameter 이름만 변경해 wiring이 바뀌지 않도록 compile metadata와 naming에 의존하지 않습니다.",
    ],
    concepts: [
      c("semantic qualifier", "implementation 이름이 아니라 consumer가 요구하는 capability/region/channel 같은 속성을 나타내는 후보 metadata입니다.", ["custom annotation으로 만들 수 있습니다.", "후보 filter로 동작합니다."]),
      c("meta-annotation", "다른 annotation의 의미를 조합해 domain-specific annotation을 만드는 annotation입니다.", ["Qualifier를 포함할 수 있습니다.", "target/retention/attributes를 검증합니다."]),
      c("qualifier intersection", "injection point가 요구한 qualifier 속성을 모두 만족하는 후보만 남기는 filter 의미입니다.", ["0/1/N을 다시 평가합니다.", "collection에는 N이 허용됩니다."]),
    ],
    codeExamples: [java("core06-qualifier-intersection", "region·channel qualifier 교집합", "Core06Qualifiers.java", "후보의 qualifier set에서 여러 요구 속성의 교집합을 계산해 정확한 구현을 고릅니다.", String.raw`import java.util.List;
import java.util.Set;

public class Core06Qualifiers {
  record Candidate(String name, Set<String> attributes) {}
  static List<String> matching(List<Candidate> all, Set<String> required) {
    return all.stream().filter(candidate -> candidate.attributes().containsAll(required)).map(Candidate::name).sorted().toList();
  }
  public static void main(String[] args) {
    List<Candidate> all = List.of(
      new Candidate("euEmail", Set.of("region:eu", "channel:email")),
      new Candidate("euSms", Set.of("region:eu", "channel:sms")),
      new Candidate("krEmail", Set.of("region:kr", "channel:email")));
    System.out.println("eu=" + matching(all, Set.of("region:eu")));
    System.out.println("eu-email=" + matching(all, Set.of("region:eu", "channel:email")));
    System.out.println("us=" + matching(all, Set.of("region:us")));
  }
}`, "eu=[euEmail, euSms]\neu-email=[euEmail]\nus=[]", ["spring-autowired-qualifiers", "spring-qualifier-api", "java-list", "java-set"])],
    diagnostics: [
      d("custom qualifier가 무시되고 모든 후보가 남습니다.", "annotation에 @Qualifier meta-annotation 또는 runtime retention/올바른 target이 없습니다.", ["annotation definition", "retention", "target", "bean-side metadata", "injection-side attributes"], "Spring 공식 qualifier meta-annotation 패턴으로 수정하고 0/1/N context test를 둡니다.", "custom qualifier contract test와 compiled annotation inspection을 둡니다."),
      d("qualifier string refactor 후 startup이 실패합니다.", "자유 문자열 vocabulary가 여러 module에 흩어졌습니다.", ["literal usage", "bean metadata", "configuration", "saved values", "deprecation"], "custom annotation/enum-like constants와 중앙 capability registry로 vocabulary를 관리합니다.", "unknown qualifier를 build/startup에 실패시키고 migration alias 기한을 둡니다."),
    ],
    expertNotes: ["qualifier가 concrete bean name과 1:1이면 implementation coupling을 숨긴 것인지 검토합니다.", "multiple semantic attributes가 복잡해지면 DI metadata가 아니라 explicit strategy registry/routing policy가 더 적합할 수 있습니다."],
  },
  {
    id: "primary-fallback-default",
    title: "@Primary·@Fallback·explicit wiring의 우선순위를 default policy로 관리합니다",
    lead: "여러 후보에서 primary는 기본 선택을 제공하고 fallback은 일반 후보가 없을 때만 고려되지만 consumer별 의도는 explicit qualifier/wiring이 더 명확할 수 있습니다.",
    explanations: [
      "@Primary는 single-valued dependency에서 여러 후보 중 우선 후보를 표시합니다. type 전체의 전역 default이므로 서로 다른 consumer가 다른 구현을 필요로 하면 qualifier가 적합합니다.",
      "current Spring의 @Fallback은 non-fallback 후보가 있으면 뒤로 물러나는 후보 범주를 표현합니다. 지원 framework 버전과 migration compatibility를 공식 API로 확인합니다.",
      "primary가 둘이면 다시 ambiguity이고 primary도 qualifier filter 밖의 후보를 선택하지 않습니다. 먼저 type/qualifier로 적격 집합을 만든 뒤 우선순위를 평가합니다.",
      "@Bean method parameter에 concrete bean을 직접 호출/전달하는 explicit Java configuration은 selection을 한 곳에 집중해 graph를 읽기 쉽게 할 수 있습니다.",
      "test에서 @Primary test double을 광범위하게 등록하면 production candidate conflict를 숨길 수 있습니다. test configuration도 실제 selection contract를 명시하고 negative tests를 유지합니다.",
    ],
    concepts: [
      c("primary candidate", "적격 후보가 여러 개일 때 single injection의 기본 우선 대상으로 표시된 bean입니다.", ["정확히 하나여야 합니다.", "qualifier filter 이후 적용됩니다."]),
      c("fallback candidate", "일반 적격 후보가 없을 때 고려되는 낮은 우선순위 후보입니다.", ["지원 버전을 확인합니다.", "비활성/오류를 숨기지 않습니다."]),
      c("explicit wiring", "composition configuration이 어떤 concrete candidates를 constructor/factory arguments로 연결할지 직접 선언하는 방식입니다.", ["선택을 중앙화합니다.", "profile variant를 명확히 테스트합니다."]),
    ],
    diagnostics: [
      d("primary를 붙였는데 qualifier injection에서 선택되지 않습니다.", "primary bean이 injection point의 qualifier를 만족하지 않습니다.", ["required qualifiers", "candidate qualifier metadata", "primary flags", "type", "profile"], "consumer qualifier를 만족하는 후보 안에서 정확히 하나의 primary/default를 두거나 explicit wiring합니다.", "resolution pipeline 단계별 candidate test를 둡니다."),
      d("test primary가 production 중복 후보 오류를 숨깁니다.", "test configuration이 전역 primary를 추가해 실제 graph cardinality를 바꿨습니다.", ["test beans", "primary flags", "production-only candidates", "profiles", "negative tests"], "production graph context test와 test-double graph를 분리하고 candidate manifest를 비교합니다.", "test override/primary 사용을 review gate로 관리합니다."),
    ],
    expertNotes: ["default implementation은 product policy이므로 code annotation 위치와 owner를 명시합니다.", "fallback이 생성 실패까지 조용히 대체하는지 여부를 명확히 구분하고 failure를 absence로 삼키지 않습니다."],
  },
  {
    id: "collection-order-map",
    title: "List·Set·Map 주입의 후보 집합, 순서와 key 계약을 명시합니다",
    lead: "multi-element injection은 ambiguity를 해결하는 우회가 아니라 모든 strategies/listeners/plugins를 조합하는 별도 contract입니다.",
    explanations: [
      "List<T>는 적격 후보를 모두 받고 Ordered/@Order semantics로 정렬될 수 있습니다. 동일 order의 tie-break가 business correctness에 영향을 주면 명시적 comparator와 stable key를 둡니다.",
      "Map<String,T>의 key는 일반적으로 bean name이며 domain routing key와 같다는 보장이 없습니다. 외부 channel code를 bean name으로 쓰지 말고 adapter registry를 만듭니다.",
      "Set은 uniqueness를 제공하지만 iteration order를 business flow로 가정하지 않습니다. equals/hashCode가 proxy와 identity에서 어떤 의미인지도 확인합니다.",
      "collection이 비어도 injection이 성공할 수 있으므로 최소 하나가 필요한 pipeline은 application validation을 둡니다. 모든 plugin이 disabled인 상태를 readiness failure 또는 supported no-op로 정의합니다.",
      "한 plugin 실패가 전체 chain을 중단할지, 격리할지, retry/compensate할지는 injection이 아닌 orchestration contract입니다. order와 failure policy를 함께 테스트합니다.",
    ],
    concepts: [
      c("multi-element dependency", "하나의 contract에 맞는 모든 후보를 collection/array/map으로 받는 dependency입니다.", ["0..N cardinality를 가집니다.", "order와 empty behavior를 정의합니다."]),
      c("Ordered", "Spring에서 여러 components의 상대 순서를 표현하는 contract입니다.", ["같은 order tie를 검토합니다.", "priority와 business route를 혼동하지 않습니다."]),
      c("bean-name map", "Map injection에서 bean names를 key로 하고 instances를 value로 받는 구조입니다.", ["internal names입니다.", "domain routing key와 adapter로 분리합니다."]),
    ],
    codeExamples: [java("core06-ordered-collection", "order와 name tie-break를 가진 plugin collection", "Core06Order.java", "order가 같은 후보도 name으로 안정화해 재실행 가능한 plugin chain을 만듭니다.", String.raw`import java.util.Comparator;
import java.util.List;

public class Core06Order {
  record Plugin(String name, int order) {}
  static List<String> ordered(List<Plugin> plugins) {
    return plugins.stream().sorted(Comparator.comparingInt(Plugin::order).thenComparing(Plugin::name)).map(Plugin::name).toList();
  }
  public static void main(String[] args) {
    List<Plugin> plugins = List.of(
      new Plugin("metrics", 20),
      new Plugin("authorize", 10),
      new Plugin("audit", 20));
    System.out.println("ordered=" + ordered(plugins));
    System.out.println("empty=" + ordered(List.of()));
    System.out.println("count=" + ordered(plugins).size());
  }
}`, "ordered=[authorize, audit, metrics]\nempty=[]\ncount=3", ["spring-autowired", "spring-order-api", "java-comparator", "java-list"])],
    diagnostics: [
      d("listener 실행 순서가 변경되어 결과가 달라집니다.", "같은 order 또는 discovery order를 stable business order로 가정했습니다.", ["order values", "ties", "bean names", "scan order", "runtime list"], "business priority와 deterministic tie-break를 explicit registry/comparator로 정의합니다.", "입력 permutation과 upgrade context tests를 둡니다."),
      d("Map key로 저장한 route가 bean rename 뒤 깨집니다.", "internal bean name을 external/domain identifier로 사용했습니다.", ["map keys", "saved route values", "aliases", "bean rename", "adapter"], "각 strategy가 stable domain key를 제공하게 하고 startup에 duplicate key를 검증합니다.", "bean name과 domain key 분리 architecture test를 둡니다."),
    ],
    expertNotes: ["collection injection은 plugin architecture의 시작일 뿐 versioning, isolation과 lifecycle까지 자동 제공하지 않습니다.", "@Order는 singleton startup creation order를 항상 보장하는 일반 lifecycle primitive가 아닙니다."],
  },
  {
    id: "optional-provider-lazy",
    title: "Optional·@Nullable·ObjectProvider로 absence와 lookup timing을 정확히 표현합니다",
    lead: "필요하지 않을 수 있는 dependency와 나중에 또는 반복해서 얻어야 하는 dependency는 서로 다른 실패·lifecycle contract를 가집니다.",
    explanations: [
      "Optional<T>는 단일 후보의 absence를 type에 표현하지만 candidate가 여러 개면 여전히 ambiguity입니다. optional은 '아무거나 하나'가 아닙니다.",
      "@Nullable은 null을 허용하지만 consumer가 매번 분기해야 하고 API nullness가 toolchain에 따라 검증되어야 합니다. Java Optional 또는 목적별 disabled strategy와 비교합니다.",
      "ObjectProvider는 getIfAvailable, getIfUnique, orderedStream과 lazy getObject를 제공하지만 lookup failure/creation exception을 absence로 오해하지 않습니다.",
      "provider는 prototype/request scope의 매번 새 instance 또는 lazy expensive object에 의미가 있지만 constructor cycle을 숨기는 기본 해법으로 사용하지 않습니다.",
      "optional feature의 상태는 configured=false, candidate-missing, disabled-by-policy, creation-failed와 runtime-unavailable을 구분해 관측합니다.",
    ],
    concepts: [
      c("getIfAvailable", "후보가 없으면 대체값/없음을 제공하고 후보가 있으면 bean을 얻는 ObjectProvider operation입니다.", ["creation failure를 별도 처리합니다.", "여러 후보 resolution 규칙을 확인합니다."]),
      c("getIfUnique", "정확히 하나의 명확한 후보가 있을 때만 제공하는 lookup operation입니다.", ["ambiguous를 null처럼 다룰 위험을 검토합니다.", "required contract에는 사용하지 않습니다."]),
      c("lookup timing", "dependency instance를 context refresh, bean creation 또는 method 호출 중 언제 resolve/create하는지의 계약입니다.", ["failure timing을 바꿉니다.", "scope/resource ownership과 연결합니다."]),
    ],
    diagnostics: [
      d("Optional.empty인데 실제로는 후보 생성이 실패했습니다.", "provider wrapper가 creation exception을 catch해 absence로 변환했습니다.", ["candidate definitions", "creation logs", "catch blocks", "feature state", "innermost cause"], "configured absence만 empty로 모델링하고 creation failure는 명시적 failure category로 전파합니다.", "missing/ambiguous/creation-failed negative tests를 분리합니다."),
      d("provider를 호출할 때마다 비싼 bean이 새로 생성됩니다.", "prototype/provider lookup timing과 expected reuse를 명시하지 않았습니다.", ["scope", "getObject call count", "creation spans", "resource close", "cache"], "lifetime 요구에 맞는 scope/factory/cache를 선택하고 caller ownership을 정의합니다.", "creation-count/resource-budget tests를 둡니다."),
    ],
    expertNotes: ["optional dependency는 product variant이고 provider는 lifetime abstraction이므로 같은 문제로 취급하지 않습니다.", "getIfUnique가 ambiguity를 조용히 empty로 만드는 behavior가 business policy와 맞는지 반드시 확인합니다."],
  },
  {
    id: "scan-profile-condition",
    title: "component scan·profile·condition을 candidate set 생성 정책으로 검증합니다",
    lead: "local에서는 하나인 후보가 production profile에서 둘이 되거나, test slice에서는 아예 없어지는 문제를 지원 configuration matrix로 잡습니다.",
    explanations: [
      "scan base package는 module boundary입니다. 최상위 package 전체를 무분별하게 scan하면 example/test/legacy 구현까지 candidate가 되고 accidental wiring이 생깁니다.",
      "@Profile과 @Conditional은 definition 등록 여부를 바꿉니다. condition report와 active environment를 함께 기록하고 string profile 조합을 product 지원 matrix로 제한합니다.",
      "기본 구현과 cloud/local variants가 있을 때 각 지원 조합에서 required injection은 정확히 하나, multi injection은 승인된 set인지 검증합니다.",
      "test slice는 의도적으로 일부 definitions를 제외하므로 missing dependency를 무조건 mock으로 덮지 않고 해당 slice 경계가 올바른지 확인합니다.",
      "scan/condition 결과는 build artifact/classpath에도 의존합니다. IDE와 CI jar contents 차이를 reproducible build와 artifact-level context smoke로 탐지합니다.",
    ],
    concepts: [
      c("profile", "environment 이름에 따라 bean definitions 등록을 조건화하는 Spring metadata입니다.", ["지원 조합을 제한합니다.", "비밀값과 구분합니다."]),
      c("condition", "classpath, property 또는 custom predicate에 따라 definition 등록 여부를 결정하는 contract입니다.", ["평가 근거를 관측합니다.", "fallback과 failure를 구분합니다."]),
      c("candidate manifest", "지원 환경에서 injection point별 적격 후보와 최종 선택 근거를 비밀값 없이 기록한 evidence입니다.", ["profile drift를 비교합니다.", "0/1/N invariant를 검증합니다."]),
    ],
    codeExamples: [java("core06-profile-matrix", "profile별 required candidate cardinality", "Core06Profiles.java", "local·prod·broken profile에서 활성 후보를 계산하고 exactly-one invariant를 실행합니다.", String.raw`import java.util.List;
import java.util.Set;

public class Core06Profiles {
  record Candidate(String name, Set<String> profiles) {}
  static String resolve(List<Candidate> all, String profile) {
    List<String> active = all.stream().filter(c -> c.profiles().contains(profile)).map(Candidate::name).sorted().toList();
    return active.size() == 1 ? "selected:" + active.getFirst() : "invalid:" + active;
  }
  public static void main(String[] args) {
    List<Candidate> all = List.of(
      new Candidate("localStore", Set.of("local")),
      new Candidate("cloudStore", Set.of("prod", "broken")),
      new Candidate("legacyStore", Set.of("broken")));
    System.out.println("local=" + resolve(all, "local"));
    System.out.println("prod=" + resolve(all, "prod"));
    System.out.println("broken=" + resolve(all, "broken"));
    System.out.println("test=" + resolve(all, "test"));
  }
}`, "local=selected:localStore\nprod=selected:cloudStore\nbroken=invalid:[cloudStore, legacyStore]\ntest=invalid:[]", ["spring-classpath-scan", "spring-profile-api", "spring-condition-api", "java-list", "java-set"])],
    diagnostics: [
      d("production에서만 후보가 둘입니다.", "profile/condition 조합이 두 implementation definitions를 동시에 활성화했습니다.", ["active profiles", "condition evaluation", "candidate manifest", "artifact classpath", "primary/qualifier"], "지원 matrix별 exactly-one test와 mutually exclusive conditions를 설계합니다.", "production artifact context smoke와 condition-report diff를 gate로 둡니다."),
      d("test slice에서 dependency가 없습니다.", "slice가 adapter/configuration을 제외했지만 service를 함께 로드했습니다.", ["slice annotations", "included configuration", "component scan", "imports", "test purpose"], "test 목적에 맞게 pure unit test, focused context import 또는 adapter slice를 선택합니다.", "mock 남용 대신 slice boundary contract를 문서화합니다."),
    ],
    expertNotes: ["profile은 무한 조합 feature flag system이 아니므로 지원 조합을 명시적으로 관리합니다.", "candidate manifest에는 property 값이 아니라 condition id, match boolean과 definition source만 남깁니다."],
  },
  {
    id: "errors-observability",
    title: "NoSuch·NoUnique·creation failure를 resolution 단계별로 분류하고 비밀값 없이 관측합니다",
    lead: "autowiring 오류는 후보가 0개, 여러 개, 선택 후 생성 실패인지에 따라 수정 방향이 완전히 다릅니다.",
    explanations: [
      "NoSuchBeanDefinition 계열은 type/qualifier/condition을 만족하는 definition이 없음을 의미합니다. scan 누락, profile, generic declaration과 optional 오해를 순서대로 확인합니다.",
      "NoUniqueBeanDefinition 계열은 적격 후보가 여러 개이고 single 선택 근거가 없음을 뜻합니다. 새 implementation 추가, duplicate @Bean와 test override를 조사합니다.",
      "UnsatisfiedDependency/BeanCreation wrapper 안에는 conversion, constructor exception 또는 downstream resource failure가 있을 수 있습니다. injection point와 innermost cause path를 함께 읽습니다.",
      "진단 로그에는 candidate names, types, qualifiers, primary/fallback, definition sources와 condition ids를 남길 수 있지만 bean toString, environment values와 constructor arguments 전체를 dump하지 않습니다.",
      "오류 message wording은 framework version에 따라 달라질 수 있으므로 tests는 stable exception category, injection point와 candidate set invariant를 assertion합니다.",
    ],
    concepts: [
      c("NoSuch candidate", "required injection point에 맞는 definition 후보가 0개인 resolution failure입니다.", ["scan/condition/type을 확인합니다.", "creation failure와 구분합니다."]),
      c("NoUnique candidate", "single injection point의 적격 후보가 둘 이상이고 선택 근거가 없는 failure입니다.", ["candidate set을 출력합니다.", "명시적 policy로 해결합니다."]),
      c("creation failure", "후보 selection 후 bean constructor/init/downstream 생성이 실패한 상태입니다.", ["innermost cause를 찾습니다.", "absence로 삼키지 않습니다."]),
    ],
    diagnostics: [
      d("NoSuchBeanDefinition인데 class는 존재합니다.", "class 존재와 BeanDefinition 등록/qualifier 적격성을 혼동했습니다.", ["definition names", "scan root", "profile/condition", "injection type", "qualifiers"], "등록 근거와 candidate filter를 단계별로 readback하고 누락된 configuration을 명시적으로 import합니다.", "artifact-level candidate manifest test를 둡니다."),
      d("진단을 위해 bean dump를 켜자 secret이 노출됩니다.", "candidate object와 environment를 전체 직렬화했습니다.", ["logs", "actuator endpoints", "toString", "APM attributes", "retention/access"], "name/type/qualifier/source/condition/status만 allow-list하고 values는 presence/hash로 처리합니다.", "secret-shaped canary zero-leak test를 logs/endpoints/traces에 실행합니다."),
    ],
    expertNotes: ["resolution failure와 selected bean creation failure를 같은 'DI 오류'로 묶지 않으면 runbook이 훨씬 빨라집니다.", "candidate 수는 low-cardinality metric으로 집계하되 bean names를 무제한 metric label로 만들지 않습니다."],
  },
  {
    id: "migration-qualification",
    title: "XML·field 자동주입을 explicit constructor·qualifier graph로 migration하고 upgrade를 qualification합니다",
    lead: "옛 context의 same-type collision을 숨기지 않고 required contract와 semantic selection을 명시한 뒤 old/new graph를 differential test합니다.",
    explanations: [
      "원본의 doc1/doc2처럼 같은 type 두 후보가 있으면 먼저 둘이 실제로 다른 capability인지 중복인지 판단합니다. 불필요한 duplicate는 제거하고 다른 역할이면 semantic qualifier를 부여합니다.",
      "field @Autowired를 constructor parameter로 옮기고 단일 constructor annotation을 생략할 수 있습니다. manual constructors/tests가 compile error로 드러나면 fake 또는 composition configuration을 의도적으로 추가합니다.",
      "XML id를 qualifier처럼 쓰던 code는 custom capability qualifier와 stable domain route로 분리합니다. 한시적 alias/qualifier migration에는 telemetry와 제거 기한을 둡니다.",
      "old/new context에서 injection point별 candidate set, selected canonical name, runtime interface/proxy, collection order와 optional state를 비교합니다.",
      "Spring upgrade는 context startup만 아니라 generic/qualifier/primary/fallback, provider, collection order, profile matrix와 negative errors를 corpus로 실행합니다.",
    ],
    concepts: [
      c("autowiring migration", "hidden/ambiguous injection을 explicit constructor와 semantic candidate policy로 바꾸는 과정입니다.", ["compile failure를 inventory로 사용합니다.", "old/new graph를 비교합니다."]),
      c("resolution corpus", "0/1/N, qualifier, primary, generic, optional, collection, profile과 proxy cases를 모은 반복 검증 집합입니다.", ["framework upgrade마다 실행합니다.", "negative cases를 포함합니다."]),
      c("selection provenance", "최종 candidate가 어떤 type/qualifier/priority/condition 근거로 선택되었는지의 evidence입니다.", ["비밀값 없이 기록합니다.", "incident와 rollback에 사용합니다."]),
    ],
    diagnostics: [
      d("XML id를 qualifier로 옮긴 뒤 외부 route가 깨집니다.", "internal bean identity와 domain/public key를 같은 문자열로 사용했습니다.", ["XML ids", "qualifier values", "stored/API keys", "aliases", "routing registry"], "domain key를 strategy contract로 분리하고 bean names/qualifiers는 composition 내부에 둡니다.", "rename migration과 domain-key compatibility tests를 둡니다."),
      d("Spring upgrade 후 getIfUnique 결과가 달라집니다.", "candidate/fallback/primary/generic semantics를 startup 성공만으로 검증했습니다.", ["framework versions", "candidate manifest", "provider calls", "fallback flags", "negative corpus"], "지원 버전 resolution corpus를 양쪽에서 실행해 intentional diff만 승인합니다.", "canary graph hash와 rollback 기준을 release gate에 둡니다."),
    ],
    expertNotes: ["자동주입을 없애는 것이 목표가 아니라 선택 근거가 명시적이고 검증 가능해야 합니다.", "legacy XML은 provenance로 남기되 current Spring semantics와 과거 강의 설명의 차이를 분명히 표시합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-autowired-context", repository: "SPRING/SpringDI", path: "src/main/resources/autowired-context.xml", usedFor: ["annotation-config activation and two same-type Document candidates"], evidence: "원본을 read-only로 확인했습니다." },
  { id: "local-document", repository: "SPRING/SpringDI", path: "src/main/java/ex06/autowired/Document.java", usedFor: ["same-type autowiring learning object"], evidence: "원본을 read-only로 확인하고 설명 문자열은 현대 resolution 규칙의 근거로 사용하지 않았습니다." },
  { id: "spring-autowired", repository: "Spring Framework Reference", path: "Using @Autowired", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html", usedFor: ["constructor, field, method, optional and collection injection semantics"], evidence: "Spring 공식 autowiring reference입니다." },
  { id: "spring-autowired-qualifiers", repository: "Spring Framework Reference", path: "Fine-tuning Annotation-based Autowiring with Qualifiers", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-qualifiers.html", usedFor: ["qualifier, primary, generics and custom qualifier semantics"], evidence: "Spring 공식 qualifier reference입니다." },
  { id: "spring-classpath-scan", repository: "Spring Framework Reference", path: "Classpath Scanning and Managed Components", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html", usedFor: ["component discovery and scan boundaries"], evidence: "Spring 공식 scanning reference입니다." },
  { id: "spring-autowired-api", repository: "Spring Framework Javadoc", path: "Autowired", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html", usedFor: ["required constructor/method/field API contract"], evidence: "Spring 공식 Autowired API입니다." },
  { id: "spring-qualifier-api", repository: "Spring Framework Javadoc", path: "Qualifier", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Qualifier.html", usedFor: ["custom qualifier meta-annotation contract"], evidence: "Spring 공식 Qualifier API입니다." },
  { id: "spring-primary-api", repository: "Spring Framework Javadoc", path: "Primary", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Primary.html", usedFor: ["primary candidate preference"], evidence: "Spring 공식 Primary API입니다." },
  { id: "spring-fallback-api", repository: "Spring Framework Javadoc", path: "Fallback", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Fallback.html", usedFor: ["fallback candidate semantics in supported Spring versions"], evidence: "Spring 공식 Fallback API입니다." },
  { id: "spring-object-provider", repository: "Spring Framework Javadoc", path: "ObjectProvider", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html", usedFor: ["optional, unique, lazy and ordered stream lookup"], evidence: "Spring 공식 ObjectProvider API입니다." },
  { id: "spring-resolvable-type", repository: "Spring Framework Javadoc", path: "ResolvableType", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/ResolvableType.html", usedFor: ["generic dependency type resolution"], evidence: "Spring 공식 ResolvableType API입니다." },
  { id: "spring-factory-bean", repository: "Spring Framework Javadoc", path: "FactoryBean", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/FactoryBean.html", usedFor: ["factory versus product type boundary"], evidence: "Spring 공식 FactoryBean API입니다." },
  { id: "spring-order-api", repository: "Spring Framework Javadoc", path: "Order", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html", usedFor: ["multi-element dependency ordering"], evidence: "Spring 공식 Order API입니다." },
  { id: "spring-profile-api", repository: "Spring Framework Javadoc", path: "Profile", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Profile.html", usedFor: ["profile candidate registration"], evidence: "Spring 공식 Profile API입니다." },
  { id: "spring-condition-api", repository: "Spring Framework Javadoc", path: "Conditional", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Conditional.html", usedFor: ["conditional candidate registration"], evidence: "Spring 공식 Conditional API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["candidate and ordered plugin examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["qualifier/profile attribute examples"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "java-comparator", repository: "Java SE 21 API", path: "Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["deterministic collection ordering"], evidence: "Oracle JDK 공식 Comparator API입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-06-autowired-qualifier", slug: "spring-core-06-autowired-qualifier", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 6,
  title: "@Autowired·@Qualifier와 후보 충돌 해결", subtitle: "annotation 처리부터 type·generic·qualifier·primary·collection·provider·profile 후보 알고리즘과 운영 진단까지 0/1/N 계약으로 증명합니다.", level: "전문가", estimatedMinutes: 1020,
  coreQuestion: "Spring이 injection point에 맞는 후보를 어떻게 발견·필터·우선순위화하며, 새 구현·profile·proxy·upgrade가 들어와도 선택 근거와 실패가 안전하고 재현 가능함을 어떻게 증명할까요?",
  summary: "SpringDI의 autowired-context.xml과 Document.java를 read-only로 확인해 annotation-config와 같은 type 두 후보 충돌 progression을 보존했습니다. annotation processing/discovery 구분, constructor/method/field required semantics, type/generic/proxy/FactoryBean resolution, semantic qualifier intersection, primary/fallback/explicit wiring, List/Map order/key, Optional/ObjectProvider timing, scan/profile/condition matrix, NoSuch/NoUnique/creation diagnostics와 XML migration/upgrade qualification까지 확장합니다. 다섯 JDK 21 exact examples는 candidate pipeline, generic token, qualifier intersection, deterministic collection과 profile cardinality를 실제 실행합니다.",
  objectives: ["annotation processor와 component discovery/injection 단계를 구분한다.", "constructor·method·field injection의 required/state/test 비용을 비교한다.", "type·generic·proxy·FactoryBean product 후보를 설명한다.", "semantic custom qualifier와 qualifier 교집합을 설계한다.", "primary·fallback·explicit wiring의 우선순위를 적용한다.", "collection/map injection의 empty/order/key/failure 계약을 검증한다.", "Optional·Nullable·ObjectProvider의 absence와 lookup timing을 구분한다.", "scan·profile·condition별 0/1/N candidate matrix를 검증한다.", "NoSuch·NoUnique·creation failure를 비밀값 없이 진단한다.", "legacy XML/field wiring과 framework upgrade를 resolution corpus로 qualification한다."],
  prerequisites: [{ title: "List·Map·Properties 컬렉션 주입", reason: "단일 dependency와 collection/configuration injection의 cardinality·order 차이를 이해해야 자동주입 후보 집합을 설계할 수 있습니다.", sessionSlug: "spring-core-05-collection-injection" }],
  keywords: ["@Autowired", "@Qualifier", "@Primary", "@Fallback", "candidate resolution", "component scan", "ResolvableType", "FactoryBean", "ObjectProvider", "collection injection", "@Profile", "@Conditional", "NoUniqueBeanDefinitionException", "NoSuchBeanDefinitionException", "selection provenance"], topics,
  lab: {
    title: "동일 type 두 후보를 semantic autowiring matrix로 재설계하기",
    scenario: "legacy XML에 같은 Document type과 annotation field wiring이 있고, email/sms/local/cloud variants와 test beans가 추가되면서 환경별 후보 충돌이 발생합니다.",
    setup: ["원본 context/Document는 read-only로 보존하고 bean names·types·annotation-config 구조만 inventory합니다.", "JDK 21 exact models와 지원 Spring/JDK disposable context project를 준비합니다.", "injection point별 required type/generic/qualifier/cardinality/order/profile matrix를 작성합니다.", "synthetic configuration만 사용하고 environment/property/bean values의 출력은 금지합니다."],
    steps: ["scan roots와 explicit definitions, annotation processors를 phase별 inventory합니다.", "field/method injection을 required constructor 또는 명시적 optional contract로 분류합니다.", "type/generic/FactoryBean/proxy 후보 set을 injection point별로 readback합니다.", "구현 이름 대신 region/channel/capability custom qualifiers를 설계합니다.", "primary/fallback과 explicit @Bean wiring을 적용하고 duplicate priority를 실패시킵니다.", "List/Map 후보의 empty/order/domain-key/failure policy를 검증합니다.", "Optional/provider의 missing/ambiguous/creation-failed/lazy/prototype를 분리합니다.", "지원 profile/condition/test slice matrix에서 0/1/N invariant를 실행합니다.", "NoSuch/NoUnique/creation faults의 path와 redacted evidence를 검증합니다.", "old/new candidate manifest와 framework upgrade resolution corpus를 canary/rollback 기준으로 승인합니다."],
    expectedResult: ["required single injection은 모든 지원 환경에서 정확히 하나의 설명 가능한 후보를 선택합니다.", "qualifier와 collection order는 implementation name/refactor/discovery 순서에 의존하지 않습니다.", "optional absence와 candidate creation failure가 서로 다른 상태로 관측됩니다.", "proxy/generic/factory product가 application interface contract로 안전하게 주입됩니다.", "로그·manifest·endpoint에 bean/property/credential 실제 값이 노출되지 않습니다."],
    cleanup: ["disposable contexts, candidate manifests와 synthetic profiles를 run id로 제거합니다.", "provider가 만든 prototype/resources와 context를 닫고 leak absence를 확인합니다.", "temporary diagnostic access/configuration을 revoke합니다.", "원본 SPRING/SpringDI files는 변경하지 않습니다."],
    extensions: ["custom qualifier annotation processor/linter로 vocabulary와 attributes를 검증합니다.", "AOT/native image에서 candidate metadata와 proxies를 qualification합니다.", "module별 scan/definition manifest를 architecture graph와 연결합니다.", "candidate drift와 framework patch differential suite를 CI에 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 type→qualifier→priority→cardinality 과정을 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "primary가 qualifier 밖 후보를 선택하지 않는 이유를 설명합니다.", "generic raw/type token을 구분합니다.", "qualifier intersection의 0/1/N을 기록합니다.", "collection tie-break를 설명합니다.", "profile별 missing/duplicate를 분류합니다."], hints: ["@Autowired라는 annotation보다 후보 집합이 각 단계에서 어떻게 줄어드는지 먼저 그리세요."], expectedOutcome: "자동주입을 결정 가능한 candidate resolution algorithm으로 설명합니다.", solutionOutline: ["discover→type→qualifier→priority→cardinality→create 순서입니다."] },
    { difficulty: "응용", prompt: "legacy same-type/field autowiring을 constructor+semantic qualifier 구조로 migration하세요.", requirements: ["scan/explicit definitions를 inventory합니다.", "required/optional/multiple을 분류합니다.", "same-type 후보의 business capability를 구분합니다.", "custom qualifier/primary policy를 적용합니다.", "generic/proxy/factory cases를 검증합니다.", "profile/slice matrix negative tests를 둡니다.", "secret-zero manifest를 확인합니다.", "old/new graph와 rollback을 비교합니다."], hints: ["doc1/doc2 같은 이름만 바꾸지 말고 둘이 왜 공존하는지 먼저 결정하세요."], expectedOutcome: "후보 추가·환경 변경에도 선택 근거가 흔들리지 않는 object graph가 완성됩니다.", solutionOutline: ["inventory→classify→qualify→matrix tests→differential canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring autowiring·candidate qualification 표준을 작성하세요.", requirements: ["scan/processor/injection phases를 정의합니다.", "constructor/field/method policy를 둡니다.", "type/generic/proxy/factory 규칙을 둡니다.", "qualifier/primary/fallback vocabulary를 관리합니다.", "collection/provider/cardinality/order 규칙을 둡니다.", "profile/condition/slice matrix를 요구합니다.", "NoSuch/NoUnique/creation runbook을 둡니다.", "secret-zero telemetry, upgrade corpus와 rollback을 포함합니다."], hints: ["정상 후보 하나뿐 아니라 0개·2개·생성 실패를 각각 승인 기준으로 만드세요."], expectedOutcome: "definition 발견부터 운영 incident까지 재현 가능한 autowiring governance가 완성됩니다.", solutionOutline: ["register→filter→select→instantiate→observe→qualify 순서입니다."] },
  ],
  nextSessions: ["spring-core-07-java-config"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["autowired-context.xml에서 annotation-config1과 같은 Document type definitions2를 read-only로 확인했습니다.", "Document.java의 공개 field 설명은 역사적 학습 문구로만 확인했고 @Resource/@Autowired의 현대 resolution 근거로 사용하지 않았습니다.", "원본은 generic, qualifier/primary/fallback, provider, collection order, profile/condition, proxy/factory와 운영 진단을 다루지 않아 현재 Spring/JDK 공식 문서와 synthetic examples로 보완했습니다.", "교육용 resolver examples는 실제 Spring candidate algorithm과 error types를 대체하지 않으므로 지원 version context tests가 필수입니다."] },
});

export default session;
