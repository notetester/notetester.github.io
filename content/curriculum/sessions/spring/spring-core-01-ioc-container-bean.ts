import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 21 표준 API만으로 작은 교육용 container model을 구성해 외부 jar·network·credential 없이 registry와 lifecycle 계약을 실행합니다." },
      { lines: "19-끝에서 5줄 전", explanation: "definition 등록, graph 검증, lookup, eager/lazy 생성 또는 reverse-order close를 결정적인 순서로 수행합니다." },
      { lines: "마지막 5줄", explanation: "identity·생성 순서·canonical name·cycle·close events처럼 재실행해 비교할 수 있는 증거만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서의 예상 결과와 완전히 같아야 합니다.", "mini container는 개념의 상태 전이를 드러내는 학습 모델이며 Spring Framework 구현·통합 테스트를 대체하지 않습니다."] },
    experiments: [
      { change: "definition 순서, scope, alias와 dependency edge를 바꿉니다.", prediction: "등록 순서와 생성 가능 순서는 다르며 cycle·ambiguous lookup·중복 이름이 각기 다른 단계에서 드러납니다.", result: "변경 전 예상 graph와 실제 stdout을 표로 비교합니다." },
      { change: "동일 시나리오를 실제 GenericApplicationContext integration test로 옮깁니다.", prediction: "실제 Spring은 post-processor, conversion, proxy와 event 단계가 추가됩니다.", result: "공식 API에서 definition metadata와 singleton identity, refresh/close outcome을 readback합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "ioc-control-inversion",
    title: "IoC를 객체 생성 편의가 아니라 제어권과 변경 이유의 역전으로 이해합니다",
    lead: "애플리케이션 객체가 협력자를 직접 찾고 조립하는 대신 외부 container가 구성 메타데이터를 읽어 object graph를 만들고 lifecycle을 통제합니다.",
    explanations: [
      "원본 application-context.xml은 prototype test, singleton chef, constructor-injected hotel과 setter-injected objects를 한 registry에 선언합니다. 이 세션은 bean id·class·scope·reference라는 구조만 읽고 설정에 보이는 접속값 형태는 공개 예제로 옮기지 않습니다.",
      "IoC는 'new를 쓰지 않는다'는 문법 규칙이 아닙니다. 도메인 객체 내부에서도 값 객체를 직접 만들 수 있습니다. 핵심은 바뀌는 infrastructure implementation 선택과 lifecycle 정책을 business behavior에서 분리하는 것입니다.",
      "Dependency Injection은 IoC의 한 형태입니다. 객체는 필요한 collaborator를 constructor, factory method argument 또는 property로 선언하고 container가 생성 시점에 공급합니다. 객체가 global context에서 getBean을 반복 호출하면 service locator 결합이 다시 생깁니다.",
      "container-managed object를 Spring bean이라 부르지만 객체의 Java 의미가 사라지는 것은 아닙니다. constructor invariant, thread safety, equals/hashCode, exception contract와 resource ownership은 여전히 class 설계 책임입니다.",
      "제어권을 넘긴 대가로 startup과 wiring이 간접화됩니다. 따라서 definition provenance, dependency graph, condition/profile, 실제 runtime type과 lifecycle event를 관측 가능하게 만들어야 장애 시 원인을 찾을 수 있습니다.",
    ],
    concepts: [
      c("Inversion of Control", "구현 선택·생성·조립·lifecycle의 제어권을 객체 밖의 container/configuration으로 이동하는 원리입니다.", ["business object는 협력자 계약에 집중합니다.", "composition root가 concrete graph를 결정합니다."]),
      c("Dependency Injection", "객체가 선언한 dependency를 외부 조립자가 공급하는 IoC 방식입니다.", ["constructor는 필수 의존성에 적합합니다.", "property/factory injection도 metadata로 표현할 수 있습니다."], "context lookup을 모든 class에 퍼뜨리면 DI의 명시성이 약해집니다."),
      c("bean", "Spring IoC container가 instantiate·assemble·manage하는 object입니다.", ["plain Java object와 같은 언어 규칙을 따릅니다.", "definition metadata와 runtime instance를 구분합니다."]),
    ],
    codeExamples: [java("core01-registry-singleton", "definition registry와 singleton identity", "Core01Registry.java", "definition과 instance cache를 분리한 mini registry를 실행해 같은 singleton을 두 번 조회해도 factory는 한 번만 실행되는지 확인합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;

public class Core01Registry {
  record Definition(String name, Supplier<Object> factory, boolean singleton) {}
  static final class Container {
    final Map<String, Definition> definitions = new LinkedHashMap<>();
    final Map<String, Object> singletons = new LinkedHashMap<>();
    void register(Definition definition) { definitions.put(definition.name(), definition); }
    Object get(String name) {
      Definition definition = definitions.get(name);
      if (definition == null) throw new IllegalArgumentException("unknown bean: " + name);
      if (!definition.singleton()) return definition.factory().get();
      return singletons.computeIfAbsent(name, ignored -> definition.factory().get());
    }
  }
  static final class GreetingService { String greet() { return "HELLO"; } }
  public static void main(String[] args) {
    Container context = new Container();
    context.register(new Definition("formatter", Object::new, true));
    context.register(new Definition("greetingService", GreetingService::new, true));
    Object first = context.get("greetingService");
    Object second = context.get("greetingService");
    System.out.println("definitions=" + context.definitions.keySet());
    System.out.println("same-singleton=" + (first == second));
    System.out.println("singletons=" + context.singletons.keySet());
    System.out.println("greeting=" + ((GreetingService) first).greet());
  }
}`, "definitions=[formatter, greetingService]\nsame-singleton=true\nsingletons=[greetingService]\ngreeting=HELLO", ["local-spring-context", "spring-ioc-introduction", "spring-bean-definition", "java-supplier", "java-map"])],
    diagnostics: [
      d("class를 수정했는데 실행 객체가 예전 구현입니다.", "configuration이 다른 bean definition을 등록했거나 stale context·profile을 사용합니다.", ["active context id", "definition resource", "bean name", "runtime class", "classpath/build output"], "실제 definition provenance와 runtime type을 readback하고 context를 명시적으로 재생성합니다.", "startup manifest에 name, resource, role, scope와 runtime type fingerprint를 남깁니다."),
      d("service가 Spring 없이 단위 테스트되지 않습니다.", "business method가 ApplicationContext를 직접 조회하는 service-locator 구조입니다.", ["getBean 호출", "static context holder", "constructor parameters", "test setup"], "필수 collaborator를 constructor parameter로 노출하고 composition root에서 주입합니다.", "architecture test로 domain/service package의 context 접근을 금지합니다."),
    ],
    expertNotes: ["DI는 dependency가 사라지는 기술이 아니라 dependency graph를 명시적으로 관리하는 기술입니다.", "container를 도입한 후 wiring failure가 runtime startup으로 이동하므로 context smoke test가 중요합니다."],
  },
  {
    id: "configuration-to-definition",
    title: "XML·annotation·Java configuration을 동일한 BeanDefinition 메타데이터 관점에서 읽습니다",
    lead: "configuration source의 표현은 달라도 container 내부에는 class, scope, constructor arguments, properties, lazy와 lifecycle metadata를 가진 definition이 등록됩니다.",
    explanations: [
      "XML <bean>은 class와 ref/value를 선언적으로 표현하고 Java configuration은 type-safe factory method를 제공합니다. component scanning은 classpath 후보를 발견해 definition으로 등록합니다. 어느 방식도 곧바로 runtime instance 그 자체는 아닙니다.",
      "BeanDefinition은 object recipe입니다. class 또는 factory metadata, constructor arguments, property values, scope, lazy flag, init/destroy callbacks, role와 source description을 담으며 singleton object identity는 별도 registry/cache가 관리합니다.",
      "definition name은 운영 계약입니다. explicit id가 없으면 naming strategy가 개입하고 alias가 추가될 수 있습니다. 이름을 문자열로 외부 API에 노출하기 전 type·qualifier 기반 의존성과 public contract를 구분합니다.",
      "definition overriding은 동일 이름을 조용히 교체해 환경별 drift를 만들 수 있습니다. 허용 정책, source order와 duplicate detection을 startup gate로 정하고 의도적 override에는 owner와 test를 둡니다.",
      "런타임에 live factory에 definition을 계속 추가하는 설계는 container reasoning과 concurrent access를 복잡하게 합니다. 동적 기능은 plugin registry나 child context 같은 명시적 경계로 격리하고 lifecycle을 운영합니다.",
    ],
    concepts: [
      c("BeanDefinition", "bean instance를 만드는 class/factory, dependencies, scope와 lifecycle metadata를 표현하는 recipe입니다.", ["definition과 object identity는 다릅니다.", "source description은 wiring 진단 근거입니다."]),
      c("configuration metadata", "XML, annotated class, Java factory method 등 container에 object graph 구성을 알려 주는 입력입니다.", ["표현을 혼합할 수 있습니다.", "등록 순서와 override 정책을 관리해야 합니다."]),
      c("alias", "하나의 canonical bean name에 연결되는 다른 조회 이름입니다.", ["migration compatibility에 쓸 수 있습니다.", "alias chain과 충돌을 검증합니다."]),
    ],
    codeExamples: [java("core01-definition-graph", "definition dependency graph와 cycle preflight", "Core01Graph.java", "instance 생성 전에 definition dependency graph를 위상 정렬하고 순환 참조는 경로로 보고하는 preflight를 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Core01Graph {
  static void visit(String node, Map<String, List<String>> graph, List<String> path, List<String> order) {
    if (order.contains(node)) return;
    int cycleAt = path.indexOf(node);
    if (cycleAt >= 0) throw new IllegalStateException(String.join(" -> ", path.subList(cycleAt, path.size())) + " -> " + node);
    path.add(node);
    for (String dependency : graph.getOrDefault(node, List.of())) visit(dependency, graph, path, order);
    path.remove(path.size() - 1);
    order.add(node);
  }
  static List<String> sort(Map<String, List<String>> graph) {
    List<String> order = new ArrayList<>();
    for (String node : graph.keySet()) visit(node, graph, new ArrayList<>(), order);
    return order;
  }
  public static void main(String[] args) {
    Map<String, List<String>> valid = new LinkedHashMap<>();
    valid.put("controller", List.of("service"));
    valid.put("service", List.of("repository"));
    valid.put("repository", List.of());
    System.out.println("creation-order=" + sort(valid));
    Map<String, List<String>> cyclic = new LinkedHashMap<>();
    cyclic.put("a", List.of("b"));
    cyclic.put("b", List.of("a"));
    try { sort(cyclic); } catch (IllegalStateException error) { System.out.println("cycle=" + error.getMessage()); }
  }
}`, "creation-order=[repository, service, controller]\ncycle=a -> b -> a", ["spring-bean-definition", "spring-dependencies", "spring-bean-definition-api", "java-list", "java-map"])],
    diagnostics: [
      d("같은 bean name이 환경마다 다른 class를 가리킵니다.", "여러 configuration source의 등록 순서와 overriding 정책이 다릅니다.", ["definition source", "resource load order", "allow override flag", "active profiles"], "중복 이름을 startup failure로 만들고 의도적 variant는 명시적 profile/qualifier로 분리합니다.", "definition manifest snapshot과 profile matrix test를 둡니다."),
      d("definition은 보이는데 getBean 시 class load가 실패합니다.", "metadata parse 때 class resolution을 미뤘거나 runtime classpath가 build와 다릅니다.", ["bean class name", "classloader", "artifact contents", "lazy flag", "first lookup trace"], "지원 classpath를 고정하고 startup smoke에서 주요 lazy bean까지 생성 검증합니다.", "reproducible artifact와 dependency lock/SBOM 검증을 둡니다."),
    ],
    expertNotes: ["definition diff는 배포 전 object graph drift를 찾는 강력한 evidence입니다.", "BeanDefinition을 application business API처럼 직접 수정하기보다 container extension point의 phase contract를 지킵니다."],
  },
  {
    id: "beanfactory-applicationcontext",
    title: "BeanFactory와 ApplicationContext의 책임·bootstrap 시점을 구분합니다",
    lead: "BeanFactory는 기본 configuration/creation contract를 제공하고 ApplicationContext는 events, resources, messages, AOP integration과 application lifecycle을 더한 완전한 상위 인터페이스입니다.",
    explanations: [
      "일반 애플리케이션은 ApplicationContext를 composition root로 사용합니다. BeanFactory를 직접 선택하는 특수 상황은 bootstrap cost와 extension execution 차이를 이해하고 증명해야 합니다.",
      "ApplicationContext refresh는 definition load만 뜻하지 않습니다. factory post-processing, bean post-processor registration, event infrastructure, lifecycle processor와 non-lazy singleton 생성 등 여러 phase를 실행합니다.",
      "context reference를 business object에 주입할 수 있지만 가능하다는 사실과 권장 architecture는 다릅니다. infrastructure adapter가 event/resource lookup을 사용하고 core domain은 명시적 port를 받도록 경계를 둡니다.",
      "getBean은 name, type 또는 name+type으로 조회할 수 있습니다. type lookup은 후보가 0개인지 여러 개인지와 FactoryBean product/runtime proxy type을 고려해야 하므로 생성자 자동 주입도 같은 ambiguity contract를 가집니다.",
      "context는 close 가능한 resource owner입니다. test·CLI·desktop·manual bootstrap에서는 try-with-resources 또는 명시적 close로 destroy callbacks와 background resources를 종료해야 합니다.",
    ],
    concepts: [
      c("BeanFactory", "bean definition 조회와 instance 생성·의존성 해결의 기본 contract입니다.", ["일반 코드에는 ApplicationContext가 보통 적합합니다.", "factory extension phase를 이해해야 합니다."]),
      c("ApplicationContext", "BeanFactory 기능에 events, resources, messages와 application lifecycle을 추가한 container interface입니다.", ["application composition root 역할을 합니다.", "ConfigurableApplicationContext는 refresh/close lifecycle을 노출합니다."]),
      c("refresh", "구성 입력을 실행 가능한 container state로 전환하는 다단계 bootstrap operation입니다.", ["post-processors가 instance보다 먼저 동작합니다.", "실패하면 partial resources 정리를 검증해야 합니다."]),
    ],
    diagnostics: [
      d("BeanFactory로 바꾸자 @Autowired·events가 예상과 다르게 동작합니다.", "ApplicationContext가 자동 등록·실행하던 extension과 infrastructure를 생략했습니다.", ["bootstrap API", "registered post-processors", "annotation processors", "event multicaster"], "ApplicationContext를 사용하거나 필요한 extension을 명시적으로 등록하고 phase별 integration test를 둡니다.", "bootstrap 방식별 feature matrix와 context contract test를 유지합니다."),
      d("테스트 종료 후 thread와 connection이 남습니다.", "수동으로 만든 ConfigurableApplicationContext를 close하지 않았습니다.", ["context owner", "AutoCloseable use", "destroy callbacks", "non-daemon threads"], "context를 try-with-resources로 소유하고 실패 bootstrap에서도 close를 호출합니다.", "resource leak test와 test framework context cache 정책을 문서화합니다."),
    ],
    expertNotes: ["framework integration tests에서는 context cache가 속도를 높이지만 mutable singleton state leakage를 숨길 수 있습니다.", "context 자체를 어디서 생성·닫는지가 애플리케이션의 최상위 resource ownership 계약입니다."],
  },
  {
    id: "names-types-aliases",
    title: "bean 이름·alias·type 후보를 결정적인 resolution 규칙으로 관리합니다",
    lead: "문자열 이름 조회와 type 자동 주입은 각각 collision, alias, generic/runtime type과 multiple candidate 문제를 가지므로 startup에 resolution evidence를 남깁니다.",
    explanations: [
      "하나의 definition은 canonical name과 여러 alias를 가질 수 있습니다. alias는 이전 이름 호환에 유용하지만 서로 순환하거나 기존 canonical name을 가리면 configuration error가 됩니다.",
      "type lookup은 구현 class뿐 아니라 interface, generic information, proxy와 FactoryBean product type의 영향을 받습니다. 개발 환경에 후보가 하나였다는 사실을 production profile에서도 가정하지 않습니다.",
      "@Primary는 여러 후보 중 기본값을 제공하고 @Qualifier는 semantic identity를 명시합니다. field variable name fallback에만 의존하면 refactor가 wiring behavior를 바꿀 수 있습니다.",
      "collection injection은 모든 후보를 받을 수 있지만 순서는 @Order/Ordered와 comparator semantics를 문서화해야 합니다. Map key가 bean name인지 domain key인지도 분리합니다.",
      "public plugin id, metric label과 bean name을 동일시하지 않습니다. 내부 configuration refactor가 외부 저장 데이터·API contract를 깨뜨리지 않도록 adapter registry를 둡니다.",
    ],
    concepts: [
      c("canonical name", "alias를 해석한 definition의 기준 이름입니다.", ["alias chain을 한 번 정규화합니다.", "로그와 manifest에는 canonical+requested name을 구분합니다."]),
      c("type candidate", "주입 지점의 요구 type에 assignable한 bean 후보입니다.", ["0/1/N cardinality가 있습니다.", "primary·qualifier·name으로 좁힐 수 있습니다."]),
      c("NoUniqueBeanDefinition", "type 후보가 여러 개인데 단일 선택 근거가 없을 때의 configuration failure 범주입니다.", ["startup에서 빠르게 발견합니다.", "임의 첫 후보 선택을 금지합니다."]),
    ],
    codeExamples: [java("core01-name-resolution", "canonical name과 type 후보 resolution", "Core01Names.java", "alias chain을 canonical name으로 정규화하고 type 후보가 여러 개일 때 명시적으로 실패하는 deterministic registry를 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Core01Names {
  static String canonical(String name, Map<String, String> aliases) {
    String current = name;
    for (int hops = 0; aliases.containsKey(current); hops++) {
      if (hops > aliases.size()) throw new IllegalStateException("alias cycle");
      current = aliases.get(current);
    }
    return current;
  }
  static String requireOne(List<String> candidates) {
    if (candidates.size() != 1) throw new IllegalStateException("expected one, candidates=" + candidates);
    return candidates.getFirst();
  }
  public static void main(String[] args) {
    Map<String, String> aliases = new LinkedHashMap<>();
    aliases.put("mailSender", "primaryNotifier");
    aliases.put("notifier", "mailSender");
    System.out.println("canonical=" + canonical("notifier", aliases));
    System.out.println("single=" + requireOne(List.of("primaryNotifier")));
    try { requireOne(List.of("emailNotifier", "smsNotifier")); }
    catch (IllegalStateException error) { System.out.println("ambiguous=" + error.getMessage()); }
  }
}`, "canonical=primaryNotifier\nsingle=primaryNotifier\nambiguous=expected one, candidates=[emailNotifier, smsNotifier]", ["spring-bean-definition", "spring-beanfactory-api", "spring-listable-beanfactory", "java-list", "java-map"])],
    diagnostics: [
      d("새 구현을 추가한 뒤 단일 주입이 실패합니다.", "interface type 후보가 둘 이상이 되었지만 primary/qualifier 정책이 없습니다.", ["candidate names", "qualifiers", "primary flags", "active profiles", "generic type"], "semantic qualifier 또는 명시적 strategy registry로 선택 기준을 코드화합니다.", "새 component 등록 시 candidate-cardinality architecture test를 실행합니다."),
      d("bean 이름 refactor 후 설정 일부만 깨집니다.", "SpEL, XML ref, string lookup 또는 외부 설정이 옛 canonical name을 사용합니다.", ["aliases", "getBean strings", "XML refs", "configuration properties", "saved plugin ids"], "한시적 alias와 deprecation telemetry를 두고 외부 contract는 별도 stable id로 분리합니다.", "string bean-name usage를 정적 검사하고 migration window를 운영합니다."),
    ],
    expertNotes: ["ambiguous resolution은 framework 불편이 아니라 composition 결정이 빠졌다는 architecture signal입니다.", "후보 목록과 최종 선택 근거를 raw object dump 없이 startup evidence로 남길 수 있습니다."],
  },
  {
    id: "refresh-eager-lazy",
    title: "refresh, eager singleton과 lazy creation을 startup·failure budget으로 설계합니다",
    lead: "기본 singleton pre-instantiation은 wiring failure를 startup에 모으지만 lazy initialization은 비용과 실패를 첫 요청으로 옮깁니다.",
    explanations: [
      "일반 ApplicationContext는 non-lazy singleton을 refresh 동안 생성합니다. constructor·property wiring과 init callback이 여기서 실패하면 애플리케이션이 traffic을 받기 전에 문제를 발견할 수 있습니다.",
      "lazy bean은 실제 조회되거나 non-lazy bean의 dependency가 될 때 생성됩니다. lazy annotation이 있어도 eager singleton이 필요로 하면 startup에 생성되므로 dependency graph를 함께 봐야 합니다.",
      "모든 bean을 lazy로 바꾸면 startup은 빨라 보이지만 첫 사용자 latency, 부분 기능 failure와 warming 경쟁이 생깁니다. cold path의 오류가 readiness 이후에 나타나는 운영 비용을 계산합니다.",
      "external connection 자체를 constructor에서 무조건 열면 context refresh가 외부 장애와 강하게 결합합니다. configuration 검증, pool object 생성, 실제 remote probe, readiness를 서로 다른 책임으로 설계합니다.",
      "startup budget은 총 시간만이 아니라 phase별 definition load, post-processing, singleton creation, migration/probe와 warmup duration을 기록해야 regression의 소유자를 찾을 수 있습니다.",
    ],
    concepts: [
      c("eager singleton", "context refresh 중 미리 생성되는 기본 singleton입니다.", ["wiring failure를 startup에 발견합니다.", "startup time과 resource 사용을 증가시킬 수 있습니다."]),
      c("lazy initialization", "첫 필요 시점까지 bean instance 생성을 미루는 정책입니다.", ["cold-path cost를 옮깁니다.", "eager dependency가 요구하면 즉시 생성됩니다."]),
      c("readiness", "프로세스가 실제 요청을 안전하게 처리할 준비가 되었는지 나타내는 운영 상태입니다.", ["context refreshed만으로 충분하지 않을 수 있습니다.", "critical lazy path를 synthetic probe로 검증합니다."]),
    ],
    codeExamples: [java("core01-eager-lazy", "eager refresh와 lazy 첫 조회", "Core01Lazy.java", "definition의 lazy flag에 따라 refresh와 첫 lookup에서 factory가 실행되는 순서를 정확히 출력합니다.", String.raw`import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

public class Core01Lazy {
  record Definition(boolean lazy, Supplier<String> factory) {}
  static final class Context {
    final Map<String, Definition> definitions = new LinkedHashMap<>();
    final Map<String, String> instances = new LinkedHashMap<>();
    final List<String> events = new ArrayList<>();
    void register(String name, Definition definition) { definitions.put(name, definition); }
    String get(String name) { return instances.computeIfAbsent(name, key -> { events.add("create:" + key); return definitions.get(key).factory().get(); }); }
    void refresh() { definitions.forEach((name, definition) -> { if (!definition.lazy()) get(name); }); events.add("refreshed"); }
  }
  public static void main(String[] args) {
    Context context = new Context();
    context.register("health", new Definition(false, () -> "ready"));
    context.register("report", new Definition(true, () -> "report"));
    context.refresh();
    System.out.println("after-refresh=" + context.events);
    System.out.println("report=" + context.get("report"));
    System.out.println("after-lookup=" + context.events);
  }
}`, "after-refresh=[create:health, refreshed]\nreport=report\nafter-lookup=[create:health, refreshed, create:report]", ["spring-container-overview", "spring-lazy-init", "spring-applicationcontext-api", "java-supplier", "java-map"])],
    diagnostics: [
      d("배포 직후 첫 요청만 수 초간 실패합니다.", "critical bean 또는 client가 lazy라 첫 요청에서 class load·configuration·connection failure가 발생합니다.", ["lazy definitions", "first-lookup trace", "readiness timing", "connection warmup", "cold latency"], "critical path를 startup/warmup probe에서 명시적으로 생성·검증하고 실패 시 readiness를 열지 않습니다.", "cold-start integration test와 phase latency budget을 둡니다."),
      d("startup이 갑자기 길어졌지만 어느 bean인지 모릅니다.", "singleton creation phase를 aggregate duration만 측정합니다.", ["bean creation spans", "factory/init durations", "dependency graph", "external calls", "class initialization"], "bean name을 bounded label로 한 phase spans를 추가하고 slowest critical path를 분석합니다.", "startup performance corpus와 threshold regression gate를 둡니다."),
    ],
    expertNotes: ["lazy는 성능 최적화 스위치가 아니라 failure timing을 변경하는 architecture 선택입니다.", "readiness는 container state와 critical business path synthetic evidence를 함께 봐야 합니다."],
  },
  {
    id: "dependency-graph-cycles",
    title: "의존 그래프를 방향·필수성·lifecycle edge로 그려 순환과 숨은 결합을 제거합니다",
    lead: "bean A가 B를 필요로 한다는 edge는 생성 순서뿐 아니라 failure propagation, scope compatibility와 변경 영향 범위를 결정합니다.",
    explanations: [
      "constructor cycle은 완전한 객체를 만들기 전에 서로를 요구하므로 design smell이 명확히 드러납니다. setter/lazy/provider로 cycle을 숨길 수 있어도 책임이 얽힌 원인이 해결되는 것은 아닙니다.",
      "순환은 보통 두 service가 서로의 orchestration을 소유하거나 domain event와 query dependency가 섞였다는 신호입니다. 공통 policy 추출, coordinator, event 또는 port 방향 재설계로 graph를 단방향화합니다.",
      "scope가 긴 singleton이 scope가 짧은 prototype/request object를 직접 보유하면 기대한 새 instance가 나오지 않거나 request context 밖에서 접근합니다. provider/scoped proxy도 lifetime 의미를 문서화해야 합니다.",
      "optional dependency는 edge가 없다는 뜻이 아닙니다. absence가 가능한 capability contract이며 enabled/disabled 두 graph를 모두 테스트해야 합니다.",
      "graph snapshot은 module boundary 위반과 새 cycle을 배포 전에 찾습니다. 단순 bean count보다 package/module owner, edge reason과 scope를 포함한 architecture evidence가 유용합니다.",
    ],
    concepts: [
      c("dependency graph", "bean을 node, 필요한 collaborator를 directed edge로 표현한 graph입니다.", ["생성 순서와 failure 영향도를 보여 줍니다.", "module boundary 검증에 사용합니다."]),
      c("circular dependency", "A에서 시작한 dependency path가 다시 A로 돌아오는 상태입니다.", ["constructor injection에서 빠르게 드러납니다.", "책임 재분리로 해결하는 것이 우선입니다."]),
      c("provider", "instance 조회 시점을 늦추거나 여러 instance를 얻는 간접 dependency contract입니다.", ["cycle 회피용 남용을 피합니다.", "lifetime과 absence/failure를 테스트합니다."]),
    ],
    diagnostics: [
      d("순환 참조를 lazy로 바꾸니 시작은 되지만 일부 method가 실패합니다.", "초기화되지 않은 graph 또는 proxy 경계로 design cycle을 지연시켰습니다.", ["cycle path", "first lazy invocation", "proxy target", "init callback", "transaction boundary"], "orchestration owner를 하나로 만들고 shared policy/port/event로 edge 방향을 재설계합니다.", "module dependency DAG와 constructor-cycle gate를 둡니다."),
      d("singleton 안의 prototype이 매 호출 같은 객체입니다.", "prototype을 singleton 생성 시 한 번 주입해 reference를 영구 보유했습니다.", ["scopes", "injection time", "provider/proxy", "expected lifetime", "concurrent use"], "필요 시점 provider 또는 명시적 factory를 주입하고 ownership/cleanup을 정의합니다.", "scope-pair contract test와 concurrency test를 둡니다."),
    ],
    expertNotes: ["cycle 허용 옵션을 켜는 것은 migration 임시 조치일 수 있지만 제거 owner와 기한이 필요합니다.", "graph edge에는 기술 type뿐 아니라 '왜 이 협력이 필요한가'라는 business reason을 기록합니다."],
  },
  {
    id: "postprocessor-phases",
    title: "BeanFactoryPostProcessor와 BeanPostProcessor의 phase를 definition과 instance 변환으로 분리합니다",
    lead: "container extension은 강력하지만 실행 phase를 혼동하면 bean 조기 생성, proxy 누락과 순서 의존이 생깁니다.",
    explanations: [
      "BeanFactoryPostProcessor는 일반 bean instance가 만들어지기 전에 definition metadata를 변경합니다. property placeholder와 configuration class processing 같은 기능이 이 계층에 있습니다.",
      "BeanPostProcessor는 각 bean instance의 initialization 전후에 개입해 annotation callbacks, dependency injection, validation과 proxy wrapping을 적용할 수 있습니다.",
      "post-processor를 programmatically 등록할 때는 autodetection과 ordering semantics가 다를 수 있습니다. PriorityOrdered, Ordered와 등록 순서를 문서와 실제 context test로 확인합니다.",
      "extension 내부에서 getBean을 너무 일찍 호출하면 해당 bean과 dependencies가 모든 post-processor 적용 전에 생성되어 proxy 대상에서 빠질 수 있습니다. startup warning의 최초 조기 조회자를 추적합니다.",
      "custom extension은 idempotent, bounded, deterministic해야 합니다. 외부 network 호출과 secret 출력, mutable global state를 bootstrap hook에 넣지 않고 입력·출력 definition diff를 검증합니다.",
    ],
    concepts: [
      c("BeanFactoryPostProcessor", "bean instance 생성 전 container configuration metadata를 변경하는 extension point입니다.", ["definition phase에서 동작합니다.", "application bean 조기 생성을 피합니다."]),
      c("BeanPostProcessor", "bean instance initialization 전후에 callback·wrapping을 적용하는 extension point입니다.", ["proxy를 반환할 수 있습니다.", "order와 early reference가 중요합니다."]),
      c("early bean creation", "정상 post-processing chain이 준비되기 전에 bean이 instance화되는 상태입니다.", ["proxy/annotation 처리가 빠질 수 있습니다.", "누가 조회했는지 trace가 필요합니다."]),
    ],
    diagnostics: [
      d("@Transactional 같은 proxy가 특정 bean에만 적용되지 않습니다.", "custom post-processor가 target을 너무 일찍 getBean해 정상 auto-proxy creator 전에 생성했습니다.", ["startup warnings", "creation stack", "processor order", "runtime class", "advisor list"], "extension이 definition/type metadata만 사용하도록 바꾸고 bean 조회를 정상 phase 이후로 미룹니다.", "proxy-required beans의 runtime type/advisor integration test를 둡니다."),
      d("환경마다 definition 값이 달라 재현되지 않습니다.", "post-processor가 unordered collection, current time 또는 remote state에 의존합니다.", ["processor input", "ordering", "environment snapshot", "remote calls", "definition diff"], "입력을 versioned configuration으로 고정하고 deterministic transformation과 fail-closed validation을 적용합니다.", "같은 입력의 definition manifest hash가 같은지 테스트합니다."),
    ],
    expertNotes: ["extension point는 framework 내부 phase contract에 참여하는 code이므로 일반 service보다 upgrade 검증 강도가 높아야 합니다.", "definition mutation 전후 diff에서 secret value는 hash/존재 여부로만 관측합니다."],
  },
  {
    id: "context-lifecycle-close",
    title: "context를 최상위 resource owner로 두고 정상·실패 종료를 역순으로 검증합니다",
    lead: "생성된 bean 중 thread, pool, client, file 또는 scheduler를 소유한 객체는 context close 시 dependency 역순으로 안전하게 정리되어야 합니다.",
    explanations: [
      "destroy callback은 graceful shutdown의 일부입니다. 더 이상 새 작업을 받지 않고 in-flight 작업을 제한 시간 안에 배출한 뒤 child resource를 닫고 최종 상태를 기록합니다.",
      "prototype bean의 전체 destruction lifecycle은 container가 자동 추적하지 않는 경우가 있으므로 creator/caller가 ownership을 가져야 합니다. scope별 create와 close 책임을 표로 만듭니다.",
      "JVM shutdown hook에만 의존하면 test나 embedded context 교체에서 resource가 남습니다. context owner가 명시적으로 close하고 shutdown hook은 process-level fallback으로 봅니다.",
      "destroy 중 한 bean의 오류가 뒤 resource 정리를 막지 않도록 각 callback outcome을 수집하고 계속 종료하되 최종 상태를 failure로 기록합니다.",
      "startup partial failure도 같은 cleanup 기준이 필요합니다. 생성 완료된 resources 목록을 역순으로 정리하고 pool/thread/port/file lock absence를 readback합니다.",
    ],
    concepts: [
      c("lifecycle owner", "resource의 생성, 사용 가능 기간과 종료를 책임지는 상위 component입니다.", ["ownership을 한 곳에 둡니다.", "partial construction도 정리합니다."]),
      c("destroy callback", "context shutdown 시 managed bean resource 정리를 요청하는 lifecycle hook입니다.", ["timeout과 exception 정책이 필요합니다.", "prototype ownership은 별도 확인합니다."]),
      c("graceful shutdown", "새 작업 수락을 중단하고 진행 중 작업과 resources를 제한 시간 안에 안전하게 종료하는 절차입니다.", ["dependency 역순을 지킵니다.", "forced termination 조건을 둡니다."]),
    ],
    codeExamples: [java("core01-context-close", "생성 순서와 reverse-order close", "Core01Lifecycle.java", "context가 생성 완료 resource를 기록하고 close 시 역순으로 종료하는 lifecycle ownership을 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Core01Lifecycle {
  static final class Resource implements AutoCloseable {
    final String name;
    final List<String> events;
    Resource(String name, List<String> events) { this.name = name; this.events = events; events.add("create:" + name); }
    public void close() { events.add("close:" + name); }
  }
  static final class Context implements AutoCloseable {
    final List<String> events = new ArrayList<>();
    final List<AutoCloseable> resources = new ArrayList<>();
    Resource create(String name) { Resource resource = new Resource(name, events); resources.add(resource); return resource; }
    public void close() throws Exception {
      for (int index = resources.size() - 1; index >= 0; index--) resources.get(index).close();
    }
  }
  public static void main(String[] args) throws Exception {
    Context context = new Context();
    context.create("pool");
    context.create("service");
    System.out.println("before-close=" + context.events);
    context.close();
    System.out.println("after-close=" + context.events);
  }
}`, "before-close=[create:pool, create:service]\nafter-close=[create:pool, create:service, close:service, close:pool]", ["spring-container-overview", "spring-applicationcontext-api", "java-autocloseable", "java-list"])],
    diagnostics: [
      d("재배포 때 port나 pool thread가 남아 새 process가 시작되지 않습니다.", "context close가 호출되지 않거나 destroy callback이 blocking/failing했습니다.", ["context owner", "shutdown events", "callback duration", "remaining threads", "open handles"], "명시적 close와 callback timeout/continue-on-error policy를 적용하고 absence를 readback합니다.", "restart/partial-start/failing-destroy integration tests를 둡니다."),
      d("prototype resource가 계속 누적됩니다.", "container가 prototype instance를 생성했지만 사용자가 close ownership을 맡지 않았습니다.", ["bean scope", "creator", "consumer lifetime", "AutoCloseable", "instance count"], "resource-bearing prototype을 explicit factory/lease API로 감싸 caller close를 강제합니다.", "leak test와 ownership annotation/API review를 둡니다."),
    ],
    expertNotes: ["'bean이 사라진다'와 OS/resource가 정리된다는 것은 다릅니다. 종료 후 외부 상태를 readback합니다.", "close order는 dependency graph의 역순이어야 downstream이 upstream resource를 종료 중 사용할 수 있습니다."],
  },
  {
    id: "hierarchy-resources-events",
    title: "context hierarchy·Resource·events를 application 경계로 사용하되 결합을 통제합니다",
    lead: "ApplicationContext의 추가 기능은 단순 lookup을 넘어 parent/child visibility, resource loading, messages와 event publication을 제공하지만 domain coupling을 숨기지 않아야 합니다.",
    explanations: [
      "parent/child context에서 child는 parent bean을 볼 수 있지만 parent는 child를 볼 수 없습니다. 동일 이름 shadowing과 web root/servlet context 차이를 manifest로 확인합니다.",
      "Resource abstraction은 classpath, file과 URL 위치를 같은 read contract로 다루지만 write/atomicity/security 의미까지 같게 만들지는 않습니다. production configuration source allow-list를 둡니다.",
      "application events는 한 context 안의 decoupled notification에 유용하지만 기본 synchronous listener는 publisher thread와 transaction에 영향을 줄 수 있습니다. delivery, ordering, exception과 retry를 명시합니다.",
      "cross-service durable integration은 in-memory event가 아니라 transaction outbox/message broker 같은 영속 경계를 사용합니다. event 이름이 같아도 delivery guarantee가 다릅니다.",
      "MessageSource는 locale별 message resolution을 제공하지만 domain error code와 사용자 문구를 분리합니다. 누락 key, fallback locale와 formatting argument를 테스트합니다.",
    ],
    concepts: [
      c("context hierarchy", "parent와 child ApplicationContext 사이의 한 방향 bean visibility 구조입니다.", ["child가 parent를 조회합니다.", "shadowing과 lifecycle owner를 관리합니다."]),
      c("Resource", "classpath/file/URL 등의 resource를 일관된 읽기 API로 표현하는 abstraction입니다.", ["위치별 보안·consistency는 다릅니다.", "configuration allow-list가 필요합니다."]),
      c("application event", "한 application context 안에서 publisher와 listener를 느슨하게 연결하는 notification입니다.", ["기본 delivery semantics를 확인합니다.", "durable integration event와 구분합니다."]),
    ],
    diagnostics: [
      d("parent에는 bean이 있는데 child에서 다른 객체가 주입됩니다.", "child가 같은 이름 definition으로 parent bean을 shadowing했습니다.", ["context id", "parent chain", "local definition names", "runtime identity", "source resource"], "중복 이름을 제거하거나 의도적 override를 qualifier와 contract test로 명시합니다.", "hierarchy별 definition manifest와 shadowing gate를 둡니다."),
      d("event listener 실패가 원래 요청을 rollback시킵니다.", "동기 listener가 publisher thread/transaction에서 exception을 던졌습니다.", ["multicaster", "listener thread", "transaction phase", "exception propagation", "retry"], "event 목적에 맞춰 transaction phase와 sync/async/durable delivery를 선택하고 실패 정책을 분리합니다.", "listener fault-injection과 duplicate/order tests를 둡니다."),
    ],
    expertNotes: ["context hierarchy는 module system 대체물이 아니므로 compile-time dependency와 runtime visibility를 함께 관리합니다.", "event payload에 entity, credential 또는 request object를 넣지 않고 최소 immutable contract를 사용합니다."],
  },
  {
    id: "container-observability-security",
    title: "definition·graph·lifecycle을 비밀값 없이 관측하고 container upgrade를 회귀 검증합니다",
    lead: "IoC 장애는 간접성 때문에 어렵지만 bean metadata, phase, dependency path와 runtime type을 bounded evidence로 남기면 재현 가능하게 진단할 수 있습니다.",
    explanations: [
      "startup report에는 context id, framework/JDK/artifact version, definition count, failed bean, dependency path, phase duration과 redacted configuration presence만 남깁니다. property value와 credentials를 dump하지 않습니다.",
      "Actuator나 diagnostic endpoint로 bean graph를 공개할 때 인증·인가·network·retention을 적용합니다. 내부 class/package 구조도 공격 표면 정보가 될 수 있으므로 production 노출을 최소화합니다.",
      "BeanCreationException의 긴 stack trace에서는 최상위 bean뿐 아니라 가장 안쪽 cause와 dependency path를 읽습니다. missing class, unsatisfied candidate, conversion, init와 external resource failure를 분류합니다.",
      "framework upgrade는 context가 뜬다는 것만 확인하지 않습니다. definition manifest, runtime proxy types, lifecycle/event ordering, configuration binding, AOP/transaction advisors와 shutdown leak corpus를 비교합니다.",
      "원본 XML 학습 자료는 현재 container 개념을 이해하는 provenance로 보존하되 새 production baseline은 지원되는 Spring/JDK 조합, Java configuration과 테스트 가능한 secret injection을 명시합니다.",
    ],
    concepts: [
      c("definition manifest", "bean name, source, class/factory, scope, lazy, role와 dependency를 비밀값 없이 기록한 startup artifact입니다.", ["배포 간 graph drift를 비교합니다.", "raw property values는 제외합니다."]),
      c("dependency path", "실패한 root bean에서 실제 원인 bean까지 이어지는 injection/creation edge 경로입니다.", ["최초 원인을 찾습니다.", "ownership과 rollback 범위를 정합니다."]),
      c("container qualification", "Spring/JDK/configuration 변경 후 graph·proxy·lifecycle·failure behavior가 승인 기준을 지키는지 검증하는 과정입니다.", ["happy path만 보지 않습니다.", "startup/shutdown과 adverse paths를 포함합니다."]),
    ],
    diagnostics: [
      d("BeanCreationException 로그가 길어 실제 원인을 못 찾습니다.", "상위 wrapper message만 보고 nested cause와 dependency path를 놓쳤습니다.", ["failed bean", "injection point", "innermost cause", "definition resource", "phase"], "exception chain을 phase/category로 구조화하고 최초 actionable cause와 path를 표시합니다.", "대표 missing/ambiguous/conversion/init/resource failures를 runbook corpus로 둡니다."),
      d("진단 endpoint에 DB URL·token이 노출됩니다.", "environment/property/bean dump를 편의를 위해 그대로 직렬화했습니다.", ["endpoint response", "sanitization", "access control", "APM export", "retention"], "allow-listed metadata와 존재 여부/hash만 공개하고 endpoint를 제한·감사합니다.", "credential-shaped canary로 logs/endpoints/traces/artifacts zero-leak test를 실행합니다."),
    ],
    expertNotes: ["좋은 container 관측성은 object.toString 전체가 아니라 name/type/phase/path/count/hash 같은 구조적 증거입니다.", "과거 XML을 삭제하기보다 provenance와 migration diff를 남기면 학습 흐름과 운영 기준을 동시에 설명할 수 있습니다."],
  },
  {
    id: "container-testing-migration",
    title: "mini model→context test→운영 canary의 증거 사다리로 IoC 구성을 검증합니다",
    lead: "단위 테스트는 객체 계약, context test는 wiring, 실제 배포 환경은 classpath·profile·lifecycle을 검증하므로 서로 대체하지 않습니다.",
    explanations: [
      "pure unit test에서는 constructor로 fake를 직접 주입해 business behavior와 required dependency를 빠르게 검증합니다. 이 테스트에 Spring context가 반드시 필요하지 않습니다.",
      "focused context test는 필요한 configuration slice만 로드해 definition name/type/scope, candidate selection, post-processing과 lifecycle을 확인합니다. 실패 메시지가 작고 명확해야 합니다.",
      "full context smoke는 production profile의 모든 required bean, migrations와 external client configuration을 검증하되 실제 비밀값을 fixture에 넣지 않고 ephemeral dependencies와 short-lived credentials를 사용합니다.",
      "XML→annotation/Java config migration은 한 번에 표현만 바꾸지 않습니다. old/new definition manifest와 runtime behavior를 비교하고 bean name/alias, scope, lazy, constructor/property, init/destroy를 항목별로 보존합니다.",
      "release canary는 startup phase budget, readiness critical paths, singleton identity, background thread/pool health와 graceful close를 확인합니다. rollback은 artifact와 configuration graph를 함께 되돌립니다.",
    ],
    concepts: [
      c("context test", "실제 Spring container를 띄워 configuration과 wiring contract를 검증하는 integration test입니다.", ["unit test와 목적이 다릅니다.", "profile·candidate·proxy·lifecycle을 확인합니다."]),
      c("configuration parity", "old/new configuration이 동일한 의도적 object graph와 behavior를 제공하는 상태입니다.", ["manifest diff와 behavior corpus로 증명합니다.", "의도적 차이는 승인합니다."]),
      c("evidence ladder", "작은 deterministic model에서 framework integration, target environment canary로 신뢰를 단계적으로 높이는 검증 구조입니다.", ["각 단계의 한계를 명시합니다.", "실패 위치를 좁힙니다."]),
    ],
    diagnostics: [
      d("unit test는 통과하지만 배포가 wiring 실패합니다.", "test가 object behavior만 검증하고 실제 configuration/profile/candidate graph를 로드하지 않았습니다.", ["test type", "loaded configuration", "profiles", "classpath", "definition manifest"], "focused+full context smoke를 추가하고 production-like artifact에서 실행합니다.", "configuration 변경 PR에 context contract tests를 필수화합니다."),
      d("XML을 Java config로 옮긴 뒤 prototype이 singleton이 됐습니다.", "class/factory만 비교하고 scope·lazy·lifecycle·alias metadata를 누락했습니다.", ["old/new manifests", "identity tests", "scope", "callbacks", "aliases"], "metadata checklist와 behavior corpus로 parity를 확인한 뒤 old path를 제거합니다.", "configuration migration template에 definition diff와 rollback을 포함합니다."),
    ],
    expertNotes: ["container를 사용하지 않는 unit test가 많을수록 DI가 명시적이고 business object가 framework-independent하다는 신호일 수 있습니다.", "full context 수가 많아 느리면 무작정 제거하지 말고 configuration slice와 shared cache의 isolation을 설계합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-spring-context", repository: "SPRING/SpringDI", path: "src/main/resources/application-context.xml", usedFor: ["XML bean ids, prototype scope, constructor/property references progression"], evidence: "원본을 read-only로 확인했고 접속정보 형태의 property values는 학습자료에 복사하지 않았습니다." },
  { id: "local-spring-test", repository: "SPRING/SpringDI", path: "src/main/java/ex01/SpringTest.java", usedFor: ["container-managed plain Java object starting point"], evidence: "단일 public method를 가진 원본 class를 read-only로 확인했습니다." },
  { id: "spring-ioc-introduction", repository: "Spring Framework Reference", path: "Introduction to the Spring IoC Container and Beans", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/introduction.html", usedFor: ["IoC, DI, bean, BeanFactory and ApplicationContext definitions"], evidence: "Spring 공식 reference입니다." },
  { id: "spring-container-overview", repository: "Spring Framework Reference", path: "Container Overview", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/basics.html", usedFor: ["configuration metadata and ApplicationContext bootstrap"], evidence: "Spring 공식 container overview입니다." },
  { id: "spring-bean-definition", repository: "Spring Framework Reference", path: "Bean Overview", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/definition.html", usedFor: ["BeanDefinition metadata, naming, aliasing and instantiation"], evidence: "Spring 공식 bean definition reference입니다." },
  { id: "spring-dependencies", repository: "Spring Framework Reference", path: "Dependencies", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies.html", usedFor: ["dependency injection graph and collaborators"], evidence: "Spring 공식 dependency reference입니다." },
  { id: "spring-lazy-init", repository: "Spring Framework Reference", path: "Lazy-initialized Beans", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-lazy-init.html", usedFor: ["eager singleton and lazy initialization timing"], evidence: "Spring 공식 lazy initialization reference입니다." },
  { id: "spring-extension-points", repository: "Spring Framework Reference", path: "Container Extension Points", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html", usedFor: ["BeanFactoryPostProcessor and BeanPostProcessor phases"], evidence: "Spring 공식 extension point reference입니다." },
  { id: "spring-applicationcontext-capabilities", repository: "Spring Framework Reference", path: "Additional Capabilities of the ApplicationContext", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html", usedFor: ["resources, events and messages"], evidence: "Spring 공식 ApplicationContext capabilities reference입니다." },
  { id: "spring-bean-definition-api", repository: "Spring Framework Javadoc", path: "BeanDefinition", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/config/BeanDefinition.html", usedFor: ["definition metadata API contract"], evidence: "Spring 공식 BeanDefinition API입니다." },
  { id: "spring-beanfactory-api", repository: "Spring Framework Javadoc", path: "BeanFactory", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/BeanFactory.html", usedFor: ["name and type lookup contract"], evidence: "Spring 공식 BeanFactory API입니다." },
  { id: "spring-listable-beanfactory", repository: "Spring Framework Javadoc", path: "ListableBeanFactory", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ListableBeanFactory.html", usedFor: ["definition and type candidate enumeration"], evidence: "Spring 공식 ListableBeanFactory API입니다." },
  { id: "spring-applicationcontext-api", repository: "Spring Framework Javadoc", path: "ConfigurableApplicationContext", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/ConfigurableApplicationContext.html", usedFor: ["refresh, close and context lifecycle"], evidence: "Spring 공식 ConfigurableApplicationContext API입니다." },
  { id: "java-supplier", repository: "Java SE 21 API", path: "Supplier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Supplier.html", usedFor: ["executable definition factory examples"], evidence: "Oracle JDK 공식 Supplier API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["ordered definition and alias registries"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["dependency order and lifecycle event examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-autocloseable", repository: "Java SE 21 API", path: "AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["context and resource close ownership"], evidence: "Oracle JDK 공식 AutoCloseable API입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-01-ioc-container-bean", slug: "spring-core-01-ioc-container-bean", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 1,
  title: "IoC 컨테이너와 BeanDefinition 읽기", subtitle: "객체 생성 설명을 넘어 definition registry·dependency graph·refresh·post-processing·singleton identity·close까지 container의 전체 상태 전이를 실행합니다.", level: "전문가", estimatedMinutes: 1000,
  coreQuestion: "XML·annotation·Java configuration이 어떻게 BeanDefinition과 dependency graph가 되고, ApplicationContext가 이를 안전한 runtime object graph로 생성·관측·종료하도록 어떻게 검증할까요?",
  summary: "SpringDI의 application-context.xml과 SpringTest.java를 read-only로 확인해 XML bean id, prototype, constructor/property ref progression을 provenance로 보존했습니다. IoC/DI의 제어권, configuration→BeanDefinition, BeanFactory/ApplicationContext, name/type/alias resolution, refresh와 eager/lazy, dependency cycle·scope, post-processor phases, hierarchy/resource/event, lifecycle close, 비밀값 없는 observability와 XML→Java config qualification까지 확장합니다. 다섯 JDK 21 exact examples는 mini registry singleton identity, graph order/cycle, alias/cardinality, eager/lazy timing과 reverse close를 실제 실행합니다.",
  objectives: ["IoC·DI·bean과 composition root를 객체 책임 관점에서 설명한다.", "XML·annotation·Java config를 BeanDefinition metadata로 읽는다.", "BeanFactory와 ApplicationContext의 기능·refresh·close 차이를 설명한다.", "name·alias·type 후보 resolution을 0/1/N cardinality로 검증한다.", "eager singleton과 lazy initialization의 failure timing을 설계한다.", "dependency graph cycle과 scope mismatch를 architecture 문제로 해결한다.", "factory/bean post-processor phase와 early creation 위험을 진단한다.", "context hierarchy·resources·events와 durable integration 경계를 구분한다.", "definition manifest·context tests·startup/shutdown canary로 upgrade를 검증한다."],
  prerequisites: [],
  keywords: ["IoC", "dependency injection", "ApplicationContext", "BeanFactory", "BeanDefinition", "bean registry", "singleton cache", "alias", "dependency graph", "refresh", "lazy initialization", "BeanPostProcessor", "context hierarchy", "destroy callback", "definition manifest"], topics,
  lab: {
    title: "XML 학습 context를 관측 가능한 production-grade object graph로 감사하기",
    scenario: "XML에 prototype, constructor/property injection과 여러 infrastructure-shaped properties가 섞여 있고, 새 Java configuration으로 옮기면서 identity·scope·lifecycle·failure behavior를 잃지 않아야 합니다.",
    setup: ["원본 XML/Java는 read-only로 보존하고 값이 아닌 bean id/class/scope/ref graph만 inventory합니다.", "JDK 21 exact examples와 지원 Spring/JDK 조합의 disposable integration project를 준비합니다.", "old/new definition manifest schema와 startup phase, readiness, close acceptance criteria를 작성합니다.", "credential-shaped canary는 synthetic value로만 사용하고 raw property/log export를 금지합니다."],
    steps: ["configuration source별 definition name/class/factory/scope/lazy/dependency/lifecycle를 추출합니다.", "dependency graph를 위상 정렬하고 constructor cycles·scope mismatch·optional edges를 검토합니다.", "name/alias/type lookup의 0/1/N 후보와 primary/qualifier 근거를 검증합니다.", "refresh phase별 post-processor, eager singleton과 external resource 접근을 trace합니다.", "critical lazy path를 readiness warmup에서 생성하고 실패 시 traffic을 차단합니다.", "runtime instance identity, proxy type, source definition과 singleton cache를 readback합니다.", "event/resource/hierarchy 사용을 domain port와 durable integration 경계로 분류합니다.", "normal/partial-start/failing-destroy에서 dependency 역순 close와 resource absence를 검증합니다.", "XML과 Java configuration의 definition manifest·behavior corpus를 비교합니다.", "startup/shutdown canary, secret-zero telemetry와 rollback artifact/config graph를 승인합니다."],
    expectedResult: ["definition과 runtime instance가 구분되고 singleton/prototype identity가 의도와 일치합니다.", "cycle·ambiguous candidate·duplicate name·scope mismatch가 traffic 전에 실패합니다.", "eager/lazy와 post-processor phase가 startup/readiness budget에 맞게 증명됩니다.", "close 뒤 thread/pool/handle이 남지 않고 partial failure도 역순 정리됩니다.", "로그·manifest·endpoint 어디에도 property secret/credential이 노출되지 않습니다."],
    cleanup: ["disposable contexts, generated manifests와 synthetic canary artifacts를 run id로 제거합니다.", "context를 명시적으로 close하고 remaining thread/handle/port absence를 readback합니다.", "temporary credential과 diagnostic endpoint access를 revoke합니다.", "원본 SPRING/SpringDI 자료는 변경하지 않습니다."],
    extensions: ["BeanDefinitionRegistryPostProcessor로 module boundary validator를 구현합니다.", "AOT/native image에서 dynamic registration과 reflection hint 경계를 비교합니다.", "context graph를 architecture test와 deployment provenance attestation으로 연결합니다.", "Spring Framework patch upgrade의 definition/proxy/lifecycle differential suite를 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 definition→graph→instance→close 상태 전이를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "definition과 singleton cache를 구분합니다.", "valid order와 cycle path를 설명합니다.", "canonical alias와 ambiguous type을 구분합니다.", "eager/lazy creation 시점을 설명합니다.", "reverse close가 필요한 이유를 설명합니다."], hints: ["Spring 용어를 외우기보다 각 단계의 입력·출력·owner를 먼저 기록하세요."], expectedOutcome: "외부 framework jar 없이도 container 핵심 상태 전이를 정확히 설명합니다.", solutionOutline: ["register→validate graph→refresh→resolve→use→close 순서입니다."] },
    { difficulty: "응용", prompt: "원본 application-context.xml의 구조를 안전하게 감사하고 Java configuration parity plan을 만드세요.", requirements: ["값을 출력하지 않는 definition inventory를 만듭니다.", "scope/constructor/property/ref graph를 추출합니다.", "cycle/name/type/scope risks를 검토합니다.", "old/new manifest와 identity/lifecycle tests를 작성합니다.", "post-processor와 proxy behavior를 검증합니다.", "startup/readiness/close failure를 주입합니다.", "secret-zero telemetry를 확인합니다.", "rollback 가능한 migration 순서를 작성합니다."], hints: ["class 이름만 같다고 configuration parity가 성립하지 않습니다."], expectedOutcome: "학습 XML의 의미를 보존하면서 지원 가능한 production configuration으로 이동합니다.", solutionOutline: ["safe inventory→graph→behavior corpus→parallel config→differential test→canary→retire 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring container 구성·관측·upgrade 표준을 작성하세요.", requirements: ["composition root와 context owner를 정의합니다.", "definition name/override/alias policy를 둡니다.", "candidate/cardinality/cycle/scope gate를 둡니다.", "post-processor phase/ordering 규칙을 정의합니다.", "eager/lazy/readiness budget을 둡니다.", "resource/event/hierarchy 경계를 정의합니다.", "manifest/exception/secret-zero observability를 둡니다.", "context tests, upgrade canary와 rollback을 요구합니다."], hints: ["container가 자동으로 해 주는 단계일수록 실패 증거와 owner를 명시하세요."], expectedOutcome: "구성 입력부터 종료·upgrade까지 재현 가능한 IoC governance가 완성됩니다.", solutionOutline: ["metadata→validation→bootstrap→runtime evidence→shutdown→qualification 순서입니다."] },
  ],
  nextSessions: ["spring-core-02-constructor-injection"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["application-context.xml에서 prototype1, constructor reference1, property reference1과 여러 bean definitions를 read-only로 확인했지만 property values는 공개 자료에 복사하지 않았습니다.", "SpringTest.java는 container가 관리할 수 있는 단순 Java object 출발점으로만 사용했습니다.", "원본은 definition internals, refresh/post-processors, graph cycle/scope, hierarchy/events, close/observability/upgrade를 설명하지 않아 Spring/JDK 공식 문서와 synthetic exact examples로 보완했습니다.", "mini container examples는 Spring 구현이 아니며 실제 BeanDefinition merging, proxy, conversion, scopes와 lifecycle behavior는 지원 버전 integration test로 확인해야 합니다."] },
});

export default session;
