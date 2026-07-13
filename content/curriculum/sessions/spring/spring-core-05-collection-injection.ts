import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "JDK 21 List·Map·Properties 또는 immutable registry/snapshot type을 합성 데이터로 선언합니다. 외부 Spring jar와 원본 설정값은 사용하지 않습니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "copy·ordering·key validation·typed parsing·atomic generation 교체를 실행해 collection의 shape뿐 아니라 ownership과 lifecycle contract를 검증합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "크기·논리 key·순서·version·boolean invariant만 출력합니다. Properties 전체, credential, endpoint와 object identity는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 Spring jar·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "예제는 JDK collection ownership을 고립해 보여 주며 실제 Spring XML parsing, type conversion, candidate resolution, scopes와 proxy는 지원 version context test로 별도 검증합니다."] },
    experiments: [
      { change: "빈 collection, 중복 logical key/order, unknown key, malformed number 또는 mutable source 변경을 넣습니다.", prediction: "cardinality·uniqueness·conversion·ownership policy가 없으면 startup이 늦게 실패하거나 실행 중 graph가 조용히 바뀝니다.", result: "composition 단계에서 full-set validation하고 immutable typed snapshot만 publish합니다." },
      { change: "singleton registry에 scoped element를 직접 보관하거나 요청 중 List/Map을 in-place 수정합니다.", prediction: "scope가 고정되거나 iteration race, mixed generation과 close-during-use가 발생합니다.", result: "provider/lifecycle owner를 명시하고 완성된 새 generation을 atomic swap한 뒤 old를 drain합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "collection-injection-cardinality",
    title: "컬렉션 주입을 여러 값 문법이 아니라 cardinality 계약으로 이해합니다",
    lead: "List·Map·Properties를 주입한다는 것은 값이 여러 개라는 뜻을 넘어 후보가 0개일 때, 순서·중복·key·value type과 누가 collection을 변경할 수 있는지를 client API로 선언하는 일입니다.",
    explanations: [
      "원본 collection-context.xml은 read-only 구조 scan에서 bean 3, property 7, list 2, value 3, map 1, entry 2가 확인됐고 props/prop element는 0입니다. 따라서 Properties는 원본에 있다고 과장하지 않고 공식 Spring/JDK 문서로 확장합니다.",
      "원본 Customer는 List<String>, List<MemberVO>, Map<String,Object> property와 getter/setter를 가집니다. 이 구조는 homogeneous list와 heterogeneous map의 차이를 보여 주지만 element validation, immutable ownership과 ordering contract는 별도로 설계해야 합니다.",
      "단일 dependency는 정확히 하나를 요구할 수 있지만 collection dependency는 zero-to-many를 자연스럽게 표현합니다. 빈 collection이 valid no-op인지 configuration 누락인지 client invariant에서 결정하고 startup에 검증합니다.",
      "collection injection은 container 후보 collection과 XML literal collection을 구분해야 합니다. `List<Plugin>` autowiring은 matching beans를 모으고 `<list><value>...`는 explicit configured elements를 만들므로 provenance와 element lifecycle이 다릅니다.",
      "client는 collection concrete implementation에 기대지 않고 필요한 의미를 interface에 표현합니다. iteration order가 중요하면 List, key lookup이면 Map, configuration text compatibility면 Properties를 쓰되 domain에서는 typed immutable object로 좁힙니다.",
    ],
    concepts: [
      c("collection injection", "여러 collaborator 또는 설정 element를 List·Set·Map·Properties 등의 aggregate로 구성해 전달하는 DI입니다.", ["cardinality를 드러냅니다.", "순서·key·ownership 계약이 필요합니다."]),
      c("cardinality", "허용되는 dependency 개수가 0, 1 또는 N개인지 나타내는 계약입니다.", ["빈 값 의미를 정합니다.", "중복 허용 여부와 연결됩니다."]),
      c("provenance", "각 collection element가 어느 bean definition, XML entry, property source 또는 code에서 왔는지에 대한 출처입니다.", ["drift를 진단합니다.", "민감값은 기록하지 않습니다."]),
    ],
    diagnostics: [d("collection은 주입됐지만 비어 있어 기능이 조용히 아무 일도 하지 않습니다.", "zero candidates/empty literal을 valid no-op로 암묵 처리했고 최소 cardinality invariant를 선언하지 않았습니다.", ["injection source kind", "candidate/element count", "required minimum", "empty-state metric"], "client별 min/max cardinality를 정의하고 required collection은 graph construction/startup에 descriptive failure로 거부합니다.", "0/1/N context와 explicit empty XML/property fixture를 contract test에 둡니다.")],
    expertNotes: ["container가 non-null empty collection을 준다는 기대도 version/injection 방식별 공식 contract와 context test로 확인합니다.", "collection 전체를 한 dependency로 받는 순간 element 하나의 실패가 전체 ready를 막을지 degraded subset을 허용할지 정해야 합니다."],
  },
  {
    id: "list-order-duplicates-ownership",
    title: "List의 순서·중복·index 의미와 소유권을 명시합니다",
    lead: "List는 encounter order와 중복을 보존하므로 pipeline과 display sequence에 적합하지만 source가 mutable하고 setter가 reference를 그대로 저장하면 주입 뒤 외부 변경이 client 상태를 바꿀 수 있습니다.",
    explanations: [
      "List의 첫 번째, 마지막 또는 index가 business 의미를 가진다면 ordering source와 tie-break를 문서화합니다. XML 선언 순서, Spring @Order/Ordered와 application sort는 같은 것이 아니므로 실제 injected order를 readback합니다.",
      "같은 logical plugin이 두 번 있으면 pure transform은 반복될 수 있지만 charge/email 같은 side effect는 중복됩니다. element identity가 object reference인지 logical id인지 정의하고 startup uniqueness validation을 실행합니다.",
      "setter에서 받은 mutable List를 그대로 field에 저장하면 caller가 나중에 add/remove하여 invariant를 우회합니다. element가 immutable하거나 안전하게 소유되는지 확인한 뒤 `List.copyOf`로 structural snapshot을 만듭니다.",
      "unmodifiable view는 source 변경을 반영할 수 있고 immutable copy는 construction 시 content를 고정합니다. 둘을 구분해 config hot reload라면 새 list generation을 만들고, 고정 graph라면 defensive copy를 사용합니다.",
      "large list를 매 request copy하지 않습니다. composition/configuration boundary에서 한 번 validate/copy하고 request에서는 immutable reference를 읽습니다. version이 바뀌면 완성된 새 snapshot으로 교체합니다.",
    ],
    concepts: [
      c("encounter order", "List iteration에서 element를 만나는 정의된 순서입니다.", ["pipeline 결과에 영향을 줍니다.", "source와 tie-break를 기록합니다."]),
      c("defensive copy", "외부 mutable collection과 내부 상태의 alias를 끊기 위해 content를 새 소유 collection으로 복사하는 기법입니다.", ["구성 경계에서 수행합니다.", "element mutability는 별도입니다."]),
      c("unmodifiable collection", "consumer가 structural mutation method를 호출할 수 없게 한 collection입니다.", ["view는 source 변경을 반영할 수 있습니다.", "immutable element를 보장하지 않습니다."]),
    ],
    codeExamples: [java("core05-list-defensive-copy", "mutable source와 분리된 immutable List snapshot", "Core05ListDefensiveCopy.java", "source를 바꿔도 injected snapshot이 유지되고 직접 mutation도 거부되는지 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Core05ListDefensiveCopy {
  public static void main(String[] args) {
    List<String> source = new ArrayList<>(List.of("beta", "alpha"));
    List<String> injected = List.copyOf(source);
    source.add("gamma");
    boolean rejected;
    try { injected.add("delta"); rejected = false; }
    catch (UnsupportedOperationException expected) { rejected = true; }
    System.out.println("source=" + String.join(",", source));
    System.out.println("injected=" + String.join(",", injected));
    System.out.println("source-size=" + source.size());
    System.out.println("injected-size=" + injected.size());
    System.out.println("isolated=" + !source.equals(injected));
    System.out.println("mutation-rejected=" + rejected);
  }
}`, "source=beta,alpha,gamma\ninjected=beta,alpha\nsource-size=3\ninjected-size=2\nisolated=true\nmutation-rejected=true", ["local-customer", "spring-collection-properties", "spring-di", "java-list", "java-collections"])],
    diagnostics: [d("주입 직후에는 맞던 list가 다른 component의 add/remove 뒤 달라지거나 iteration 중 예외가 납니다.", "setter가 caller-owned mutable list를 alias했고 immutable snapshot/generation boundary가 없습니다.", ["field assignment와 copy 방식", "source mutation call sites", "unmodifiable view vs copy", "element mutability"], "configuration boundary에서 validate 후 List.copyOf 또는 깊은 immutable snapshot을 저장하고 runtime change는 새 generation으로 교체합니다.", "source-after-injection mutation test와 concurrent iteration stress test를 둡니다.")],
    expertNotes: ["List.copyOf는 null element를 허용하지 않으므로 null 정책을 명시하고 descriptive validation을 먼저 할 수 있습니다.", "깊은 불변성이 필요하면 list structure뿐 아니라 MemberVO 같은 mutable element도 immutable DTO/record로 변환합니다."],
  },
  {
    id: "map-key-registry-semantics",
    title: "Map을 bean 이름 집합과 domain registry로 구분합니다",
    lead: "Map은 key로 구현을 선택하기 좋지만 Spring이 `Map<String, T>`에 넣는 bean name과 application이 요구하는 protocol·region·mode key는 우연히 같아서는 안 되며 explicit translation과 validation이 필요합니다.",
    explanations: [
      "container candidate map의 String key는 보통 bean name semantics를 가지며 XML `<map><entry key=...>`는 명시 key/value 구성입니다. 둘은 provenance, refactor 안정성과 lifecycle이 다르므로 API 경계에서 구분합니다.",
      "외부 입력을 bean name으로 직접 조회하지 않습니다. 허용 domain key enum/value object로 parse하고 composition root가 bean metadata를 stable key로 변환해 immutable registry를 만듭니다.",
      "duplicate key는 Map construction 방식에 따라 overwrite되거나 exception이 날 수 있습니다. silent last-wins는 configuration 손실을 숨기므로 원본 entry sequence에서 duplicate를 먼저 탐지하고 provenance를 포함한 startup error로 실패합니다.",
      "unknown key policy는 reject, explicit default 또는 negotiated capability 중 하나입니다. default가 authorization, data region 또는 billing policy를 우회하지 않는지 검토하고 fallback 선택을 metric에 분리합니다.",
      "Map value가 Object처럼 heterogeneous하면 consumer가 cast와 instanceof를 반복해 compile-time contract를 잃습니다. 관련 설정은 typed record로 묶고 서로 다른 capability는 별도 typed registry로 분리합니다.",
    ],
    concepts: [
      c("strategy registry", "안정된 domain key에서 같은 value contract 구현으로 가는 검증된 Map입니다.", ["bean name과 분리합니다.", "unknown/duplicate 정책을 둡니다."]),
      c("bean-name map", "Spring이 matching beans를 String bean name key로 제공하는 candidate collection 형태입니다.", ["domain key가 아닙니다.", "모든 후보가 포함될 수 있습니다."]),
      c("key provenance", "registry key가 XML entry, annotation metadata 또는 code mapping 중 어디서 정의됐는지에 대한 evidence입니다.", ["중복을 진단합니다.", "값 대신 source logical id를 기록합니다."]),
    ],
    codeExamples: [java("core05-map-registry", "allowlisted key와 immutable strategy Map", "Core05MapRegistry.java", "두 strategy를 stable key로 조회하고 unknown key와 mutation을 명시적으로 거부합니다.", String.raw`import java.util.Map;
import java.util.TreeSet;

public class Core05MapRegistry {
  interface Strategy { String run(String input); }
  public static void main(String[] args) {
    Map<String, Strategy> registry = Map.of(
        "fast", input -> "fast:" + input,
        "safe", input -> "safe:" + input);
    String selected = registry.get("safe").run("job");
    boolean missingRejected;
    try {
      Strategy missing = registry.get("unknown");
      if (missing == null) throw new IllegalArgumentException("unknown-key");
      missingRejected = false;
    } catch (IllegalArgumentException expected) { missingRejected = true; }
    boolean immutable;
    try { registry.put("extra", input -> input); immutable = false; }
    catch (UnsupportedOperationException expected) { immutable = true; }
    System.out.println("keys=" + String.join(",", new TreeSet<>(registry.keySet())));
    System.out.println("selected=" + selected);
    System.out.println("missing-rejected=" + missingRejected);
    System.out.println("immutable=" + immutable);
    System.out.println("registered=" + registry.size());
  }
}`, "keys=fast,safe\nselected=safe:job\nmissing-rejected=true\nimmutable=true\nregistered=2", ["local-collection-xml", "spring-qualifier", "spring-primary", "java-map", "java-objects"])],
    diagnostics: [d("bean rename 뒤 registry key가 사라지거나 duplicate 설정이 조용히 이전 구현을 덮어씁니다.", "bean name을 public domain key로 사용했고 raw entry의 duplicate/provenance validation 전에 Map으로 축약했습니다.", ["candidate bean names", "domain key mapping", "raw duplicate entries", "unknown/default policy"], "stable explicit key metadata를 정의하고 raw sequence에서 duplicate를 거부한 뒤 immutable typed registry를 publish합니다.", "rename compatibility test, duplicate/unknown key negative test와 registry manifest diff를 둡니다.")],
    expertNotes: ["Map.copyOf의 iteration order를 표시 순서나 pipeline 순서로 가정하지 말고 필요하면 별도 ordered key list를 계약에 포함합니다.", "registry key cardinality는 bounded여야 하며 tenant/user id별 bean Map을 singleton에 만들지 않습니다."],
  },
  {
    id: "properties-typed-configuration",
    title: "Properties는 문자열 호환 경계로 제한하고 typed configuration으로 변환합니다",
    lead: "Properties는 String key/value configuration 교환에 유용하지만 domain service가 매번 `getProperty`와 parse를 수행하면 누락·오타·범위·secret 노출 오류가 실행 중까지 미뤄집니다.",
    explanations: [
      "java.util.Properties는 Hashtable을 확장하지만 `setProperty/getProperty`의 문자열 convention과 defaults chain을 가집니다. 비문자 key/value를 put하면 일부 operation에서 ClassCastException 같은 예상 밖 behavior가 생길 수 있어 typed wrapper가 필요합니다.",
      "composition boundary에서 required key, blank, enum, integer range, duration unit와 cross-field invariant를 한 번 검증하고 immutable record로 변환합니다. domain은 Properties가 아니라 `RetryPolicy`나 `FeatureConfig` 같은 type을 받습니다.",
      "Properties 전체 toString, entry iteration 또는 exception interpolation은 password/token/endpoint-like 값이 섞이면 유출 경로가 됩니다. 관측에는 key allowlist, source logical id, presence와 validation category만 남기고 실제 값은 redaction합니다.",
      "Spring Environment와 PropertySource는 우선순위가 있는 여러 source를 통합할 수 있습니다. 최종 값만 보지 말고 source kind/name, override 여부와 configuration generation을 secret-free manifest로 남겨 drift를 진단합니다.",
      "runtime reload는 mutable Properties object를 service들이 공유하는 방식이 아닙니다. 새 source set을 읽어 전체 typed config를 validate하고 immutable generation을 atomic publish한 뒤 request가 한 generation만 사용하게 합니다.",
    ],
    concepts: [
      c("Properties", "문자열 property key/value를 load·store·조회하기 위한 JDK configuration collection입니다.", ["domain type으로 변환합니다.", "전체 출력은 민감정보 위험이 있습니다."]),
      c("typed configuration", "문자열 source를 검증·변환해 단위·범위·필수값이 type과 invariant로 표현된 immutable 객체입니다.", ["startup에 실패합니다.", "domain parsing을 제거합니다."]),
      c("property precedence", "여러 PropertySource에서 같은 key가 있을 때 어느 source 값이 이기는지 정하는 순서입니다.", ["override provenance를 기록합니다.", "값은 노출하지 않습니다."]),
    ],
    codeExamples: [java("core05-properties-to-typed", "Properties를 검증된 immutable record로 변환", "Core05PropertiesToTyped.java", "세 synthetic property를 snapshot/parse하고 source 변경이 typed config를 바꾸지 않으며 raw object를 출력하지 않음을 확인합니다.", String.raw`import java.util.Properties;

public class Core05PropertiesToTyped {
  record Config(String mode, int retryLimit, int timeoutMillis) {}
  static Config parse(Properties properties) {
    String mode = properties.getProperty("feature.mode");
    int retry = Integer.parseInt(properties.getProperty("retry.limit"));
    int timeout = Integer.parseInt(properties.getProperty("timeout.ms"));
    if (mode == null || mode.isBlank() || retry < 0 || retry > 5 || timeout <= 0) {
      throw new IllegalArgumentException("invalid-config");
    }
    return new Config(mode, retry, timeout);
  }
  public static void main(String[] args) {
    Properties source = new Properties();
    source.setProperty("feature.mode", "training");
    source.setProperty("retry.limit", "3");
    source.setProperty("timeout.ms", "250");
    Properties snapshot = new Properties();
    snapshot.putAll(source);
    Config config = parse(snapshot);
    source.setProperty("retry.limit", "5");
    System.out.println("property-count=" + snapshot.size());
    System.out.println("mode=" + config.mode());
    System.out.println("retry=" + config.retryLimit());
    System.out.println("timeout-ms=" + config.timeoutMillis());
    System.out.println("source-isolated=" + (config.retryLimit() == 3));
    System.out.println("raw-properties-printed=false");
  }
}`, "property-count=3\nmode=training\nretry=3\ntimeout-ms=250\nsource-isolated=true\nraw-properties-printed=false", ["local-collection-xml", "local-customer", "spring-collection-properties", "spring-environment", "spring-conversion", "java-properties"])],
    diagnostics: [d("배포 후 첫 요청에서 숫자 parse 오류가 나거나 config dump에 credential-like 값이 노출됩니다.", "raw Properties를 domain까지 전달해 validation을 지연하고 전체 object를 log/exception에 포함했습니다.", ["parse call sites", "required/range/unit validation 시점", "Properties dump/log", "PropertySource precedence"], "startup/reload boundary에서 allowlisted keys를 typed immutable config로 변환하고 stable category만 기록하며 raw values를 출력하지 않습니다.", "malformed/missing/range/override와 log-redaction test를 CI에 둡니다.")],
    expertNotes: ["Properties defaults chain까지 snapshot해야 의미가 보존되는지 검토하고 단순 putAll이 모든 lookup behavior를 복제한다고 가정하지 않습니다.", "실제 secret은 typed String field로 복사하기보다 secret manager reference와 짧은 수명 handle을 사용하고 rotation lifecycle을 별도 관리합니다."],
  },
  {
    id: "xml-collection-conversion",
    title: "XML list·map·props 문법과 element type conversion을 분리해 검증합니다",
    lead: "Spring XML의 `<list>`, `<map>`, `<props>`는 object graph metadata이며 value/ref, target generic type, conversion service와 merge 설정에 따라 실제 element type과 소유 bean이 달라집니다.",
    explanations: [
      "`<value>`는 문자열 literal에서 target property/element type으로 변환될 수 있고 `<ref>`는 다른 bean instance edge를 만듭니다. 같은 화면 값처럼 보여도 lifecycle·scope와 identity가 다르므로 graph evidence를 구분합니다.",
      "generic setter `List<MemberVO>` 같은 target type은 conversion hint가 될 수 있지만 raw List/Object map은 compile/runtime cast risk를 키웁니다. supported Spring version에서 BeanDefinition와 actual injected element types를 readback합니다.",
      "`<map>` entry의 key/key-ref/value/value-ref 조합은 서로 다른 type과 lifecycle을 만듭니다. XML string key를 domain enum/value object로 변환한다면 unknown/duplicate/collision policy를 context test로 확인합니다.",
      "`<props>`의 prop entries는 Properties에 맞는 문자열 configuration을 표현하지만 local scanned XML에는 해당 elements가 없었습니다. 따라서 학습 example은 공식 contract 기반 보완이며 원본 behavior 증거로 표시하지 않습니다.",
      "parent/child collection merge를 사용하는 legacy XML은 append/override와 order가 복잡할 수 있습니다. 최종 graph를 source order 추측으로 설명하지 말고 loaded BeanDefinition/injected value를 supported version에서 확인합니다.",
    ],
    concepts: [
      c("value element", "XML literal을 target property type으로 변환해 넣는 collection element metadata입니다.", ["conversion이 적용됩니다.", "bean identity가 아닙니다."]),
      c("ref element", "다른 bean definition이 만든 instance를 collection element로 연결하는 metadata입니다.", ["scope와 lifecycle을 가집니다.", "value와 구분합니다."]),
      c("type conversion", "문자열 등 source value를 target generic/property type으로 바꾸는 Spring conversion 과정입니다.", ["실패는 startup에 드러내야 합니다.", "locale/unit을 명시합니다."]),
    ],
    diagnostics: [d("XML context는 로드되지만 collection element가 예상 class가 아니거나 raw cast에서 실패합니다.", "value/ref와 target generic type을 혼동했고 conversion result를 context에서 확인하지 않았습니다.", ["setter generic signature", "BeanDefinition value/ref metadata", "ConversionService", "actual element runtime types"], "typed property를 사용하고 supported version context에서 모든 element type, key와 conversion failure를 readback합니다.", "positive/negative XML fixtures와 raw collection 금지 architecture rule을 둡니다.")],
    expertNotes: ["XML namespace/schema validation 성공은 business key·cardinality·range validation까지 보장하지 않습니다.", "원본 XML을 modern annotation/code config로 옮길 때 선언 모양이 아니라 final object graph와 ordering behavior를 비교합니다."],
  },
  {
    id: "candidate-order-and-ties",
    title: "autowired List의 후보 집합과 deterministic order를 검증합니다",
    lead: "`List<Strategy>` autowiring은 matching beans를 모으는 편리한 확장점이지만 candidate 포함 조건, @Primary의 비역할, @Order/Ordered 동률과 proxy type까지 확인해야 pipeline이 재현 가능합니다.",
    explanations: [
      "@Primary는 단일값 candidate 선택을 돕지만 matching collection에서 나머지를 배제하는 filter가 아닙니다. 특정 subset이 필요하면 semantic qualifier나 explicit registry/configuration을 사용합니다.",
      "@Order와 Ordered는 priority metadata를 제공하지만 같은 값이면 완전한 business order가 정해졌다고 가정하지 않습니다. stable logical id tie-break 또는 duplicate priority rejection 중 요구사항에 맞는 정책을 둡니다.",
      "OrderComparator의 특수 source-aware behavior와 plain Comparator 결과를 혼동하지 않습니다. production이 container ordering을 쓰면 실제 injected order를 작은 context에서 검증하고 manifest에 기록합니다.",
      "proxy가 생겨도 annotation/order metadata가 어디서 읽히는지는 framework path와 version에 따라 확인이 필요합니다. runtime class 이름 기반 정렬을 쓰지 않고 logical metadata를 target definition에 명시합니다.",
      "새 implementation bean 하나를 추가하면 모든 collection consumer가 자동으로 받습니다. 확장 의도와 blast radius를 dependency graph로 review하고 opt-in qualifier나 explicit registration이 더 안전한지 결정합니다.",
    ],
    concepts: [
      c("candidate set", "type·qualifier·autowire eligibility를 만족해 collection injection에 포함되는 bean 집합입니다.", ["추가 bean이 자동 포함될 수 있습니다.", "consumer별 manifest가 필요합니다."]),
      c("@Order", "Spring이 여러 component/element의 priority를 비교하는 데 사용할 선언 metadata입니다.", ["동률의 완전 순서를 보장하지 않습니다.", "business dependency와 다릅니다."]),
      c("tie-break", "같은 primary priority를 가진 element 사이에서도 완전하고 안정된 순서를 만드는 두 번째 비교 규칙입니다.", ["logical id를 사용할 수 있습니다.", "shuffle test로 검증합니다."]),
    ],
    codeExamples: [java("core05-ordered-components", "priority와 logical name으로 완전 정렬", "Core05OrderedComponents.java", "등록 순서가 다른 세 component를 order와 name으로 정렬하고 중복 logical id가 없음을 확인합니다.", String.raw`import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

public class Core05OrderedComponents {
  record Component(int order, String name) {}
  public static void main(String[] args) {
    List<Component> registered = List.of(
        new Component(20, "normalize"),
        new Component(10, "validate"),
        new Component(20, "audit"));
    List<Component> ordered = registered.stream()
        .sorted(Comparator.comparingInt(Component::order).thenComparing(Component::name))
        .toList();
    String names = ordered.stream().map(Component::name).collect(Collectors.joining(","));
    boolean duplicates = new HashSet<>(ordered.stream().map(Component::name).toList()).size() != ordered.size();
    System.out.println("order=" + names);
    System.out.println("stages=" + ordered.size());
    System.out.println("duplicates=" + duplicates);
    System.out.println("stable-tie-break=" + names.equals("validate,audit,normalize"));
  }
}`, "order=validate,audit,normalize\nstages=3\nduplicates=false\nstable-tie-break=true", ["spring-autowired", "spring-order", "spring-ordered", "spring-order-comparator", "java-comparator", "java-list"])],
    diagnostics: [d("component scan 범위나 bean 추가 후 list order와 실행 결과가 환경별로 달라집니다.", "candidate set blast radius와 @Order 동률을 검토하지 않고 발견/등록 순서를 tie-break로 사용했습니다.", ["consumer별 candidate names", "qualifier/eligibility", "order 동률", "proxy/definition metadata"], "명시 subset과 완전 order 정책을 정의하고 logical-id tie-break 또는 duplicate priority failure를 적용합니다.", "등록 순서 shuffle test, 0/1/N context matrix와 graph manifest approval을 둡니다.")],
    expertNotes: ["priority 숫자 간격을 넓히는 것은 dependency graph를 표현하지 못하므로 stage precondition이 있으면 별도 validation합니다.", "모든 후보 자동 포함이 plugin feature라면 compatibility contract와 supply-chain 승인까지 등록 조건에 포함합니다."],
  },
  {
    id: "immutable-elements-and-deep-copy",
    title: "collection structure와 element의 깊은 불변성을 구분합니다",
    lead: "List.copyOf나 unmodifiableMap이 add/remove를 막아도 내부 MemberVO나 strategy가 mutable하면 consumer들이 같은 element를 통해 상태를 바꿀 수 있으므로 object graph 전체의 ownership을 검토해야 합니다.",
    explanations: [
      "shallow copy는 collection node만 새로 만들고 element reference는 공유합니다. element가 immutable value record면 충분할 수 있지만 setter가 많은 VO, array, Date와 mutable map을 품으면 deep conversion 또는 owner isolation이 필요합니다.",
      "deep copy를 serialization trick으로 구현하면 type fidelity, performance, secret duplication과 lifecycle resource를 손상할 수 있습니다. 필요한 field를 검증된 immutable DTO로 명시 변환하는 편이 audit하기 쉽습니다.",
      "strategy object는 value처럼 copy할 수 없는 resource/lifecycle을 가질 수 있습니다. collection 구조는 immutable로 고정하되 element thread safety와 close ownership을 별도 manifest에 기록합니다.",
      "equals/hashCode가 mutable field에 의존하는 element를 Set/Map key로 쓰면 mutation 후 lookup이 실패할 수 있습니다. stable immutable key를 분리하고 registry value의 상태 변경이 key identity를 바꾸지 않게 합니다.",
      "API가 collection을 반환할 때도 내부 mutable reference를 노출하지 않습니다. snapshot DTO, immutable view와 pagination/stream 중 consistency·memory budget에 맞는 형태를 선택합니다.",
    ],
    concepts: [
      c("shallow copy", "collection container는 복사하지만 element object reference는 공유하는 복사입니다.", ["구조 alias를 끊습니다.", "element mutation은 공유됩니다."]),
      c("deep immutability", "collection과 도달 가능한 element state가 construction 후 관찰 가능하게 변경되지 않는 성질입니다.", ["immutable record로 변환할 수 있습니다.", "resource object와 구분합니다."]),
      c("ownership", "collection structure, element와 element가 소유한 resource를 누가 변경·close할 수 있는지에 대한 책임입니다.", ["API boundary에 명시합니다.", "scope와 연결됩니다."]),
    ],
    diagnostics: [d("unmodifiable list인데도 한 consumer가 MemberVO field를 바꾸자 다른 consumer 결과가 달라집니다.", "collection 구조만 불변으로 만들고 mutable element reference와 owner를 공유했습니다.", ["element mutator/fields", "copy depth", "shared consumers/scopes", "equals/hashCode key usage"], "mutable VO를 immutable validated value로 변환하거나 owner별로 격리하고 resource element는 lifecycle-aware shared contract를 둡니다.", "element mutation alias test와 stable-key lookup regression을 추가합니다.")],
    expertNotes: ["불변성은 annotation 이름이 아니라 mutation API, reflection/array exposure와 collaborator behavior를 포함한 관찰 가능 성질입니다.", "큰 graph deep copy 비용을 피하려면 persistent immutable structure 또는 versioned snapshot을 검토하되 library semantics를 공식 문서로 검증합니다."],
  },
  {
    id: "empty-missing-duplicate-validation",
    title: "빈 값·누락·중복·부분 실패를 composition 단계에서 구분합니다",
    lead: "collection의 `null`, empty, missing bean, duplicate key/id와 element creation failure는 서로 다른 configuration 상태이며 모두 empty로 정규화하면 장애 원인과 product behavior가 사라집니다.",
    explanations: [
      "null collection은 API 자체가 absence를 허용한다는 의미가 되어 consumer마다 guard가 반복됩니다. 보통 non-null collection과 명시 min cardinality가 더 단순하지만 optional capability의 disabled/default state를 별도 type으로 표시할 수 있습니다.",
      "empty valid pipeline은 identity/no-op 결과를 정의해야 합니다. required validator list가 empty면 authorization/validation이 우회될 수 있으므로 기능 중요도에 따라 min=1 이상의 invariant를 둡니다.",
      "duplicate는 List에서 허용될 수 있고 Map에서는 key 충돌을 해결해야 합니다. object equality가 아니라 logical id, capability key 또는 semantic fingerprint 중 무엇이 중복 기준인지 정의합니다.",
      "element 하나 생성 실패 시 전체 startup을 막을지 healthy subset으로 degraded 운영할지 선택합니다. 핵심 security/payment stage는 fail-closed가 일반적이고 optional enrichment는 explicit degraded manifest와 alert로 제외할 수 있습니다.",
      "validation error는 source logical id, element index/key, expected type/range와 stable category를 포함하지만 actual secret/value 전체를 포함하지 않습니다. 여러 오류를 모아 한 번에 교정할지 첫 오류에 fail-fast할지도 설정 규모에 따라 정합니다.",
    ],
    concepts: [
      c("empty-state contract", "collection element가 0개일 때 operation 결과와 readiness를 정의한 규칙입니다.", ["no-op 또는 failure를 명시합니다.", "security-sensitive 기능은 fail-closed를 검토합니다."]),
      c("duplicate identity", "동일 element를 판단하는 stable logical id 또는 domain key 기준입니다.", ["reference equality와 다를 수 있습니다.", "source provenance와 함께 검증합니다."]),
      c("partial availability", "일부 element가 실패해도 검증된 subset으로 제한 운영하는 정책입니다.", ["필수 element는 제외하지 않습니다.", "degraded 상태를 표시합니다."]),
    ],
    diagnostics: [d("잘못된 element 하나가 모든 기능을 막거나 반대로 필수 validator가 빠졌는데도 ready가 됩니다.", "element criticality, minimum cardinality와 partial-availability policy가 하나의 generic collection rule로 처리됐습니다.", ["element criticality/owner", "min/max count", "creation failures", "degraded manifest/readiness"], "collection type별 required/optional element policy와 fail-open/closed 기준을 정의해 complete-set validation 후 publish합니다.", "missing/empty/duplicate/one-failed/many-failed fixture와 readiness assertion을 둡니다.")],
    expertNotes: ["오류를 모두 aggregate할 때도 untrusted value를 그대로 message에 넣지 않고 key/index와 category 중심으로 제한합니다.", "degraded subset은 정상 graph와 다른 generation이므로 cache key, audit와 rollback에서도 구분해야 합니다."],
  },
  {
    id: "scope-provider-lazy-elements",
    title: "collection 안 element의 scope·lazy creation과 close ownership을 보존합니다",
    lead: "singleton이 `List<Prototype>`을 직접 받거나 provider가 만든 instance를 오래 보관하면 기대 scope가 사라질 수 있어 collection 구조와 각 element instance lifecycle을 따로 모델링해야 합니다.",
    explanations: [
      "singleton consumer 생성 시 collection element가 resolve되면 prototype/scoped bean이 한 번 만들어져 사실상 오래 유지될 수 있습니다. 실제 매-operation creation이 필요하면 provider/factory collection을 주입하고 acquire/use/release protocol을 둡니다.",
      "ObjectProvider의 orderedStream은 후보를 lazy하게 다룰 수 있지만 stream iteration마다 creation/ordering/exception이 언제 발생하는지 official contract와 context에서 확인합니다. provider를 field에 둔 이유와 허용 lookup 빈도를 제한합니다.",
      "request/session scoped element는 scope 밖 thread, async callback 또는 singleton cache로 넘기지 않습니다. 필요한 immutable value snapshot만 전달하거나 scope-aware proxy/provider를 사용하고 종료 뒤 접근 negative test를 둡니다.",
      "prototype resource의 destruction은 container가 자동 소유하지 않을 수 있습니다. client가 AutoCloseable handle을 소유하거나 lifecycle manager가 모든 acquired element를 추적해 close하도록 설계합니다.",
      "lazy creation failure가 첫 customer request에 나타나면 readiness가 거짓 양성이 됩니다. 핵심 element는 startup warmup/validation하고 정말 optional·expensive한 element만 first-use failure와 fallback contract를 둡니다.",
    ],
    concepts: [
      c("provider collection", "element instance 자체 대신 필요할 때 생성/조회하는 provider들의 collection입니다.", ["scope를 보존할 수 있습니다.", "release ownership이 필요합니다."]),
      c("lazy resolution", "graph construction 시점이 아니라 조회/iteration 시점에 후보 또는 instance를 해소하는 방식입니다.", ["startup 비용을 늦춥니다.", "failure 시점도 늦어집니다."]),
      c("scope leakage", "짧은 scope의 instance/reference가 더 긴 scope나 비동기 경로에 남아 lifecycle 경계를 벗어난 상태입니다.", ["request data를 누출할 수 있습니다.", "provider/snapshot으로 막습니다."]),
    ],
    diagnostics: [d("prototype element가 요청마다 새로 만들어지지 않거나 request 종료 후 async task에서 scope 오류가 납니다.", "singleton collection에 actual scoped instance를 저장하고 acquire/release와 async 경계를 정의하지 않았습니다.", ["consumer/element scopes", "injection resolution time", "provider iteration", "async capture와 close ownership"], "provider/factory handle collection으로 scope를 보존하고 scope 안에서 acquire/use/release하며 async에는 immutable value만 전달합니다.", "instance identity count, out-of-scope access와 resource close context test를 둡니다.")],
    expertNotes: ["provider lookup이 숨은 per-element N+1 initialization을 만들 수 있으므로 creation cardinality와 latency를 측정합니다.", "lazy proxy의 runtime type/toString을 logical registry id로 사용하지 않습니다."],
  },
  {
    id: "concurrent-snapshot-reload",
    title: "collection hot reload를 immutable generation과 atomic publication으로 만듭니다",
    lead: "실행 중 List/Map/Properties를 갱신할 때 in-place add/remove/put을 하면 한 요청이 서로 다른 version의 element를 볼 수 있으므로 전체 graph를 새 snapshot으로 만든 뒤 원자적으로 교체해야 합니다.",
    explanations: [
      "reload pipeline은 source read, parse/convert, duplicate/cardinality/cross-field validation, element resource warmup, immutable snapshot construction, atomic publish, old drain/close 순서입니다. 중간 실패는 active generation을 바꾸지 않습니다.",
      "AtomicReference는 reference 하나의 visibility/atomic swap을 제공하지만 snapshot 내부가 mutable하면 안전하지 않습니다. List.copyOf, Map.copyOf와 immutable typed config로 도달 가능한 configuration state를 고정합니다.",
      "한 operation이 registry를 여러 번 읽지 않고 시작 시 snapshot local variable을 잡아 사용해야 generation consistency가 유지됩니다. 장기 operation에는 generation reference count 또는 lease를 붙여 old close 시점을 판단합니다.",
      "reload 요청이 겹치면 serialize, compare-and-set 또는 latest-wins 중 하나를 정하고 source version을 검증합니다. 느린 오래된 build가 나중에 publish되어 새 config를 되돌리는 stale-write를 막습니다.",
      "metric은 active/target generation, validation category, element count, swap/drain/close outcome과 age를 기록합니다. full key/value, Properties dump와 element object identity는 기록하지 않습니다.",
    ],
    concepts: [
      c("immutable generation", "List·Map·typed config가 한 version으로 완성·검증된 뒤 변경되지 않는 graph snapshot입니다.", ["요청별 일관성을 줍니다.", "old/new를 구분합니다."]),
      c("atomic publication", "consumer가 partial state가 아니라 old 또는 완성된 new snapshot 중 하나만 보도록 reference를 원자 교체하는 과정입니다.", ["visibility를 제공합니다.", "resource drain은 별도입니다."]),
      c("generation lease", "operation이 특정 snapshot 사용 중임을 추적해 old resource 폐기 시점을 안전하게 판단하는 소유권입니다.", ["in-flight를 보호합니다.", "반납 누락을 감시합니다."]),
    ],
    codeExamples: [java("core05-atomic-collection-generation", "두 immutable registry generation의 batch별 원자 교체", "Core05AtomicCollectionGeneration.java", "첫 batch가 version 1만, swap 뒤 batch가 version 2만 읽어 mixed generation이 없음을 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicReference;

public class Core05AtomicCollectionGeneration {
  record Snapshot(int version, List<String> stages, Map<String, Integer> limits) {}
  static List<Integer> readBatch(ExecutorService pool, AtomicReference<Snapshot> active) throws Exception {
    List<Future<Integer>> futures = new ArrayList<>();
    for (int index = 0; index < 4; index++) futures.add(pool.submit(() -> active.get().version()));
    List<Integer> versions = new ArrayList<>();
    for (Future<Integer> future : futures) versions.add(future.get());
    return versions;
  }
  static String labels(List<Integer> versions) {
    return versions.stream().map(value -> "v" + value).reduce((left, right) -> left + "," + right).orElse("");
  }
  public static void main(String[] args) throws Exception {
    AtomicReference<Snapshot> active = new AtomicReference<>(
        new Snapshot(1, List.of("validate"), Map.of("retry", 2)));
    ExecutorService pool = Executors.newFixedThreadPool(4);
    try {
      List<Integer> first = readBatch(pool, active);
      active.set(new Snapshot(2, List.of("validate", "audit"), Map.of("retry", 3)));
      List<Integer> second = readBatch(pool, active);
      boolean mixed = first.stream().anyMatch(value -> value != 1)
          || second.stream().anyMatch(value -> value != 2);
      System.out.println("batch1=" + labels(first));
      System.out.println("batch2=" + labels(second));
      System.out.println("swaps=1");
      System.out.println("mixed=" + mixed);
      System.out.println("active-version=" + active.get().version());
    } finally {
      pool.shutdown();
    }
  }
}`, "batch1=v1,v1,v1,v1\nbatch2=v2,v2,v2,v2\nswaps=1\nmixed=false\nactive-version=2", ["spring-autowired-api", "spring-object-provider", "spring-scopes", "spring-lifecycle", "spring-testing", "java-atomic-reference", "java-executor-service", "java-list", "java-map"])],
    diagnostics: [d("reload 중 일부 요청이 old order와 new Map 값을 섞어 보거나 old resource close 오류가 납니다.", "여러 mutable collection을 in-place로 바꾸고 request snapshot/lease와 drain protocol이 없습니다.", ["mutation operations", "snapshot capture 횟수", "active/target generations", "in-flight/close event order"], "전체 immutable snapshot을 validate/warmup해 atomic publish하고 operation별 generation lease가 0일 때 old resources를 close합니다.", "overlapping reload, partial build failure, long request와 close-during-use stress test를 둡니다.")],
    expertNotes: ["AtomicReference swap 성공은 semantic validation과 resource cleanup 성공을 뜻하지 않으므로 각각 상태와 metric을 둡니다.", "generation number만 증가시키지 말고 source revision/hash와 compare해 stale reload publish를 거부합니다."],
  },
  {
    id: "xml-to-java-config-migration",
    title: "XML collection을 Java config/annotation으로 옮길 때 graph behavior를 보존합니다",
    lead: "XML `<list>/<map>/<property>`를 List.of/Map.of나 component scan으로 단순 치환하면 order, duplicate, conversion, bean identity, scope와 parent merge 의미가 달라질 수 있어 final graph comparison이 필요합니다.",
    explanations: [
      "migration 전에 XML resource별 bean/property/list/map entry를 parse해 logical manifest를 만들고 actual context에서 final element type, order, identity, scope와 converted values의 category를 readback합니다. 실제 sensitive value는 export하지 않습니다.",
      "Java config에서는 method parameter로 bean edge를 명시하고 literal config는 typed configuration properties로 변환합니다. `Map<String,Object>`를 그대로 재현하기보다 consumer use를 조사해 typed records/registries로 분리합니다.",
      "component scan으로 자동 collection을 만들면 XML에 명시되지 않았던 같은-type bean까지 포함될 수 있습니다. candidate set이 exact인지 qualifier/explicit @Bean list로 제한할지 consumer별로 결정합니다.",
      "old/new context를 지원 profile과 candidate 0/1/N fixtures로 함께 띄워 graph manifest와 behavior corpus를 비교합니다. order가 같아도 element lifecycle/identity가 다르면 semantic difference로 분류합니다.",
      "rollout은 configuration generation, old/new graph diff, canary outcome과 rollback artifact를 연결합니다. XML을 바로 삭제하지 않고 stored deployment config와 external import reference가 0인지 증명한 뒤 제거합니다.",
    ],
    concepts: [
      c("graph equivalence", "old/new configuration이 client가 관찰하는 element set·order·type·identity·scope·behavior를 같은 의미로 만드는 성질입니다.", ["문법 동일성이 아닙니다.", "manifest와 corpus로 검증합니다."]),
      c("candidate expansion", "explicit list를 component scan/autowiring으로 바꿀 때 의도하지 않은 같은-type bean이 자동 포함되는 변화입니다.", ["blast radius를 만듭니다.", "qualifier로 제한할 수 있습니다."]),
      c("compatibility context", "old와 new graph를 같은 synthetic fixtures/profile에서 생성해 비교하는 migration 환경입니다.", ["production effect를 내지 않습니다.", "rollback evidence를 만듭니다."]),
    ],
    diagnostics: [d("XML을 annotation config로 옮긴 뒤 list에 bean이 더 들어오거나 order·element type이 바뀝니다.", "source syntax만 치환하고 explicit XML set과 scan candidate set, conversion/merge/scope 차이를 비교하지 않았습니다.", ["old final graph manifest", "new candidate set", "order/type/identity/scope diff", "external XML references"], "consumer별 exact graph equivalence를 정의하고 qualifier/explicit list와 typed conversion으로 diff를 해소한 뒤 canary합니다.", "old/new context matrix, behavior corpus와 legacy resource usage-zero를 removal gate에 둡니다.")],
    expertNotes: ["migration에서 자동화 비율보다 hidden graph behavior를 명시적으로 만드는 것이 우선입니다.", "XML 유지가 필요한 third-party bean은 adapter/composition module에 격리하고 application collection contract는 typed code로 유지할 수 있습니다."],
  },
  {
    id: "collection-operations-governance",
    title: "collection graph를 배포·관측·복구·폐기 가능한 운영 단위로 만듭니다",
    lead: "여러 element가 한 번에 주입되면 단일 bean 장애보다 blast radius와 조합 수가 커지므로 cardinality·order·key·source·scope·generation을 manifest와 bounded telemetry로 관리해야 합니다.",
    explanations: [
      "build/startup manifest에는 consumer logical id, collection kind, element count, ordered logical ids 또는 sorted key set, source kind, qualifier/order, scope와 contract/config version을 둡니다. raw property value와 credential은 제외합니다.",
      "배포 diff gate는 필수 element 제거, 새 자동 후보, key rename, order/priority change, scope change와 mutable→immutable ownership 변화를 분류합니다. 단순 count가 같아도 identity/order가 다르면 review합니다.",
      "metric은 generation, element count bucket, selection/outcome category, reload validation/swap/drain/close 결과를 제한된 label로 기록합니다. element마다 user/tenant-derived key를 label로 만들지 않습니다.",
      "incident runbook은 empty/missing, duplicate, wrong order/type, candidate expansion, scope leak, partial element failure, mixed generation과 cleanup leak를 나눕니다. 먼저 active manifest를 확보한 뒤 임의 element 삭제나 restart를 결정합니다.",
      "collection element 폐기는 call-site뿐 아니라 XML imports, profile/config server, plugin metadata, stored keys와 rollback artifact reference를 조사합니다. usage zero와 old generation resource zero 후 allowlist/schema에서 제거합니다.",
    ],
    concepts: [
      c("collection graph manifest", "consumer별 collection kind·element ids/keys·order·scope·source·generation을 값 없이 기록한 evidence입니다.", ["drift를 비교합니다.", "secret을 제외합니다."]),
      c("graph diff gate", "collection 후보·순서·key·scope 변화의 위험을 분류하고 배포 승인을 요구하는 검증 단계입니다.", ["자동 후보 추가를 탐지합니다.", "rollback과 연결합니다."]),
      c("zero-leak retirement", "legacy element/config를 제거한 뒤 active old generation, resource, thread와 reference가 0임을 증명하는 폐기 기준입니다.", ["usage zero와 다릅니다.", "운영 cleanup을 포함합니다."]),
    ],
    diagnostics: [d("장애 시 어떤 list order/key set과 configuration generation이 배포됐는지 알 수 없고 rollback 후 old element가 남습니다.", "collection graph manifest와 generation-tagged reload/drain/close evidence가 없습니다.", ["deployed manifest", "active/target generation", "ordered ids/key set", "old resources/threads/references"], "secret-free manifest를 artifact로 고정하고 canary·rollback마다 swap/drain/close 결과와 zero-leak를 확인합니다.", "CI graph diff approval과 post-deploy/post-rollback resource audit를 자동화합니다.")],
    expertNotes: ["public 학습 자료에는 합성 logical ids만 사용하고 실제 운영 graph artifact는 최소 권한·보존 기간을 적용합니다.", "element 수 증가를 확장성으로만 보지 말고 startup time, 조합 test, failure isolation과 ownership 비용을 capacity plan에 넣습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-collection-xml", repository: "SPRING/SpringDI", path: "src/main/resources/collection-context.xml", usedFor: ["three beans, seven properties, two lists, three values, one map and two entries progression"], evidence: "read-only structural scanner로 start-tag counts만 확인했으며 원본 값은 복사하지 않았고 props/prop elements는 0이었습니다." },
  { id: "local-customer", repository: "SPRING/SpringDI", path: "src/main/java/ex05/collection/Customer.java", usedFor: ["List<String>, List<MemberVO> and Map<String,Object> property progression"], evidence: "read-only scanner로 세 collection property의 generic shape와 accessor 구조만 확인했습니다." },
  { id: "spring-collection-properties", repository: "Spring Framework Reference", path: "Detailed Dependencies and Configuration / Collections", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-properties-detailed.html", usedFor: ["XML list, map, props, value/ref and collection merge semantics"], evidence: "Spring 공식 detailed property/collection reference입니다." },
  { id: "spring-di", repository: "Spring Framework Reference", path: "Dependency Injection", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html", usedFor: ["collection property and constructor composition"], evidence: "Spring 공식 dependency injection reference입니다." },
  { id: "spring-autowired", repository: "Spring Framework Reference", path: "Using @Autowired", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html", usedFor: ["array/list/map candidate injection"], evidence: "Spring 공식 autowiring reference입니다." },
  { id: "spring-autowired-api", repository: "Spring Framework Javadoc", path: "Autowired", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html", usedFor: ["required and multi-element injection contract"], evidence: "Spring 공식 Autowired API입니다." },
  { id: "spring-qualifier", repository: "Spring Framework Javadoc", path: "Qualifier", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Qualifier.html", usedFor: ["candidate subset filtering"], evidence: "Spring 공식 Qualifier API입니다." },
  { id: "spring-primary", repository: "Spring Framework Javadoc", path: "Primary", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Primary.html", usedFor: ["single-value preference versus collection candidates"], evidence: "Spring 공식 Primary API입니다." },
  { id: "spring-order", repository: "Spring Framework Javadoc", path: "Order", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html", usedFor: ["declarative element priority"], evidence: "Spring 공식 Order API입니다." },
  { id: "spring-ordered", repository: "Spring Framework Javadoc", path: "Ordered", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/Ordered.html", usedFor: ["programmatic collection priority"], evidence: "Spring 공식 Ordered API입니다." },
  { id: "spring-order-comparator", repository: "Spring Framework Javadoc", path: "OrderComparator", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/OrderComparator.html", usedFor: ["Spring-aware ordering comparison"], evidence: "Spring 공식 OrderComparator API입니다." },
  { id: "spring-object-provider", repository: "Spring Framework Javadoc", path: "ObjectProvider", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html", usedFor: ["lazy and ordered provider iteration"], evidence: "Spring 공식 ObjectProvider API입니다." },
  { id: "spring-environment", repository: "Spring Framework Reference", path: "Environment Abstraction", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/environment.html", usedFor: ["property source precedence and profiles"], evidence: "Spring 공식 environment reference입니다." },
  { id: "spring-conversion", repository: "Spring Framework Reference", path: "Spring Type Conversion", publicUrl: "https://docs.spring.io/spring-framework/reference/core/validation/convert.html", usedFor: ["string-to-target type conversion"], evidence: "Spring 공식 type conversion reference입니다." },
  { id: "spring-scopes", repository: "Spring Framework Reference", path: "Bean Scopes", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", usedFor: ["collection element scope and prototype boundary"], evidence: "Spring 공식 bean scopes reference입니다." },
  { id: "spring-lifecycle", repository: "Spring Framework Reference", path: "Customizing the Nature of a Bean", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html", usedFor: ["element initialization and destruction ownership"], evidence: "Spring 공식 bean lifecycle reference입니다." },
  { id: "spring-testing", repository: "Spring Framework Reference", path: "Testing", publicUrl: "https://docs.spring.io/spring-framework/reference/testing.html", usedFor: ["context candidate and migration tests"], evidence: "Spring 공식 testing reference입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered collection and immutable copy semantics"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["key registry and immutable map semantics"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-properties", repository: "Java SE 21 API", path: "Properties", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Properties.html", usedFor: ["string property and defaults semantics"], evidence: "Oracle JDK 공식 Properties API입니다." },
  { id: "java-collections", repository: "Java SE 21 API", path: "Collections", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html", usedFor: ["unmodifiable views versus copies"], evidence: "Oracle JDK 공식 Collections API입니다." },
  { id: "java-objects", repository: "Java SE 21 API", path: "Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["key/value null and invariant guards"], evidence: "Oracle JDK 공식 Objects API입니다." },
  { id: "java-comparator", repository: "Java SE 21 API", path: "Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["priority and stable tie-break"], evidence: "Oracle JDK 공식 Comparator API입니다." },
  { id: "java-atomic-reference", repository: "Java SE 21 API", path: "AtomicReference", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html", usedFor: ["atomic immutable collection generation publication"], evidence: "Oracle JDK 공식 AtomicReference API입니다." },
  { id: "java-executor-service", repository: "Java SE 21 API", path: "ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["concurrent snapshot read example"], evidence: "Oracle JDK 공식 ExecutorService API입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-05-collection-injection", slug: "spring-core-05-collection-injection", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 5,
  title: "List·Map·Properties 컬렉션 주입", subtitle: "XML collection과 Customer에서 출발해 cardinality, order, key, typed config, immutable ownership, scope, atomic reload와 migration을 운영 수준으로 검증합니다.", level: "전문가", estimatedMinutes: 980,
  coreQuestion: "여러 bean과 설정을 List·Map·Properties로 받을 때 빈 값·순서·중복·key·type·소유권·scope·reload를 어떻게 정의해야 부분 graph, race, secret 노출과 migration 손실을 막을 수 있을까요?",
  summary: "원본 collection-context.xml을 값 없이 read-only scan해 bean 3, property 7, list 2, value 3, map 1, entry 2와 props/prop 0을 확인했고, Customer의 List<String>, List<MemberVO>, Map<String,Object> property를 확인했습니다. Properties는 원본 증거가 아니라 공식 Spring/JDK 계약 기반 보완으로 명확히 구분합니다. collection cardinality, List order/duplicate/defensive copy, bean-name Map과 domain registry, Properties→typed config, XML value/ref/conversion, candidate order/tie, deep immutability, empty/missing/partial policy, scoped/provider element, atomic immutable generation reload, XML→Java config migration과 운영 governance를 초보부터 전문가 단계로 연결합니다. 다섯 JDK 21 examples는 immutable List, Map registry, typed Properties, deterministic ordering과 concurrent generation swap을 exact stdout으로 실행합니다.",
  objectives: ["collection injection의 source와 cardinality contract를 구분한다.", "List order·duplicate·ownership을 명시하고 defensive copy한다.", "bean-name Map과 stable domain registry를 분리한다.", "Properties를 validate해 typed immutable configuration으로 변환한다.", "XML value/ref/generic type conversion을 context에서 확인한다.", "collection candidates의 qualifier/order/tie를 deterministic하게 만든다.", "structure와 element의 깊은 불변성·resource ownership을 검토한다.", "empty/missing/duplicate/partial failure 정책을 startup에 검증한다.", "scoped/lazy element의 provider·close lifecycle을 보존한다.", "collection reload와 XML migration을 immutable graph generation으로 운영한다."],
  prerequisites: [{ title: "인터페이스로 구현 교체와 테스트 대역 만들기", reason: "같은 interface 구현 후보와 ordered strategy pipeline을 알아야 collection injection의 candidate set·key·ordering·scope 의미를 평가할 수 있습니다.", sessionSlug: "spring-core-04-interface-strategy" }],
  keywords: ["collection injection", "List", "Map", "Properties", "cardinality", "ordering", "duplicate key", "defensive copy", "typed configuration", "ObjectProvider", "scope", "AtomicReference", "graph migration"], topics,
  lab: {
    title: "collection-context/Customer graph를 typed immutable registry로 재구성",
    scenario: "legacy XML이 문자열 list, bean object list와 heterogeneous map을 setter로 주입하며 신규 plugin 자동 등록, typed configuration, runtime reload와 Java config migration을 요구합니다.",
    setup: ["원본 XML/Customer를 변경하지 않고 structural counts, generic property shapes와 checksum만 기록합니다.", "합성 value/key만 가진 JDK 21 examples와 지원 Spring version context fixture를 준비합니다.", "collection별 source, kind, min/max, order, duplicate/key, element type/scope/criticality와 owner matrix를 작성합니다.", "raw values 없이 ordered logical ids/key set, count, source, scope와 generation을 기록할 manifest를 준비합니다."],
    steps: ["XML literal과 autowired candidate collection을 구분해 provenance를 inventory합니다.", "각 consumer의 empty/missing/min/max와 partial failure policy를 정의합니다.", "List는 complete order/tie/duplicate를 검증하고 immutable structural snapshot을 만듭니다.", "Map bean names를 allowlisted domain keys로 변환하고 duplicate/unknown을 거부합니다.", "Properties와 string values를 typed immutable config로 parse하며 values는 redaction합니다.", "mutable MemberVO/Object values를 immutable typed values 또는 lifecycle-aware resources로 분류합니다.", "0/1/N candidates, value/ref, conversion, qualifier/order와 scoped provider를 context에서 readback합니다.", "새 graph를 build/warmup해 AtomicReference로 publish하고 operation별 generation을 고정합니다.", "old/new XML/Java context manifest와 behavior corpus를 비교해 canary/rollback합니다.", "old generation resource와 external XML reference가 0인지 확인한 뒤 legacy path를 제거합니다."],
    expectedResult: ["빈 값·중복·unknown key·conversion 실패가 traffic 전에 descriptive category로 실패합니다.", "다섯 Java example stdout이 문서와 완전히 일치합니다.", "각 request는 ordered ids, map keys와 typed config가 같은 generation인 snapshot만 봅니다.", "scoped/resource element가 lifecycle 밖으로 누출되지 않고 old generation이 drain/close됩니다.", "manifest/log에 원본 property value, endpoint와 credential이 새로 노출되지 않습니다."],
    cleanup: ["ephemeral contexts, synthetic properties, manifests와 captures를 run id로 제거합니다.", "provider-created instances, executor와 old generation resources를 drain/close합니다.", "active old generation, resource, thread와 temporary source reference가 0인지 확인합니다.", "원본 collection-context.xml과 Customer.java는 변경하지 않습니다."],
    extensions: ["BeanDefinition에서 secret-free collection graph manifest를 자동 생성합니다.", "configuration property metadata/schema로 duplicate·range·deprecated key를 build에 검증합니다.", "generation lease와 reference-counted resource collection을 구현합니다.", "XML→Java config semantic diff를 CI artifact로 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 List·Map·Properties·order·generation invariant를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "source mutation과 snapshot 차이를 설명합니다.", "unknown Map key가 거부됨을 확인합니다.", "Properties가 typed record로 변환됨을 설명합니다.", "priority 동률의 name tie-break를 확인합니다.", "두 batch에서 mixed generation이 없음을 확인합니다."], hints: ["collection structure와 element object의 불변성은 별도입니다."], expectedOutcome: "collection의 shape, ownership과 version behavior를 실행 결과로 설명합니다.", solutionOutline: ["copy→key→parse→order→publish 순서로 대조합니다."] },
    { difficulty: "응용", prompt: "원본 XML/Customer 구조를 production-safe typed collection graph로 변환하세요.", requirements: ["원본 value 없이 provenance를 유지합니다.", "min/max/empty/duplicate policy를 둡니다.", "List complete order와 Map stable key를 정의합니다.", "Object map을 typed values로 분리합니다.", "Properties를 typed/redacted config로 변환합니다.", "scoped/provider lifecycle을 검증합니다.", "atomic generation reload와 drain을 구현합니다.", "old/new context diff, canary와 rollback을 포함합니다."], hints: ["Properties는 원본에 없으므로 official 보완과 source evidence를 구분하세요."], expectedOutcome: "부분 상태·cast·secret leak·mixed generation 없는 collection composition이 완성됩니다.", solutionOutline: ["audit→classify→validate→freeze→wire→reload→migrate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring collection injection 및 configuration graph 표준을 작성하세요.", requirements: ["collection kind/cardinality 기준을 정의합니다.", "ordering/tie/duplicate/key 정책을 둡니다.", "value/ref/type conversion test를 요구합니다.", "typed config와 secret redaction을 포함합니다.", "structure/element ownership과 scope를 검토합니다.", "provider/lazy/close lifecycle을 정의합니다.", "immutable generation·reload·rollback protocol을 둡니다.", "manifest/diff/incident/retirement gate를 포함합니다."], hints: ["문법별 규칙보다 client가 요구하는 collection 불변식을 중심으로 작성하세요."], expectedOutcome: "collection 선언부터 무중단 변경과 legacy 폐기까지 적용 가능한 governance가 완성됩니다.", solutionOutline: ["declare→resolve→validate→publish→observe→replace→retire 순서입니다."] },
  ],
  nextSessions: ["spring-core-06-autowired-qualifier"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["collection-context.xml은 structural start-tag count만 사용했으며 bean 3, property 7, list 2, value 3, map 1, entry 2와 props/prop 0이 확인됐고 actual values는 복사하지 않았습니다.", "Customer.java는 List<String>, List<MemberVO>, Map<String,Object> property와 accessor 구조가 확인됐지만 immutable ownership, validation과 concurrency는 포함하지 않습니다.", "Properties는 local example에 없으므로 원본 evidence가 아니라 공식 Spring detailed collection/JDK Properties 문서와 synthetic example로 투명하게 보완했습니다.", "원본은 candidate ordering, deep immutability, empty/duplicate policy, scope/provider lifecycle, atomic reload, XML→Java migration과 운영 manifest를 포함하지 않아 공식 문서와 JDK examples로 확장했습니다.", "순수 Java examples는 Spring XML parser, ConversionService, autowire candidate resolver, proxy와 scope lifecycle을 대체하지 않으므로 지원 version context matrix가 필요합니다."] },
});

export default session;
