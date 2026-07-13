import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-16", explanation: "JDK 21 type, interface와 constructor로 required/optional dependency contract를 외부 Spring jar 없이 드러냅니다." },
      { lines: "17-끝에서 5줄 전", explanation: "정상 구성과 누락·대체·동시 호출 경계를 실제 object graph로 실행합니다." },
      { lines: "마지막 5줄", explanation: "business outcome, failure category, collaborator calls와 final state처럼 deterministic evidence만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring jar·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["JDK source-file mode stdout은 예상 결과와 완전히 같아야 합니다.", "예제는 constructor contract를 고립해 학습하며 실제 Spring constructor resolution은 공식 문서와 context test로 확인합니다."] },
    experiments: [
      { change: "dependency를 null, fake, 두 구현 또는 실패 구현으로 바꿉니다.", prediction: "invalid graph는 생성 시점에 실패하고 business test는 context 없이 빠르게 실행됩니다.", result: "생성 가능 상태와 method outcome을 별도 표로 기록합니다." },
      { change: "같은 class를 XML, component scan과 @Bean으로 각각 등록합니다.", prediction: "동일 constructor invariant를 유지하되 candidate resolution과 definition provenance가 달라집니다.", result: "Spring context test에서 selected constructor, candidates와 runtime type을 readback합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "required-dependency-invariant",
    title: "필수 의존성을 constructor parameter로 만들어 불완전한 객체 생성을 막습니다",
    lead: "객체가 의미 있는 동작을 위해 반드시 필요한 collaborator는 생성 계약에 포함해 instance가 존재하는 모든 순간에 invariant가 성립하도록 합니다.",
    explanations: [
      "원본 Hotel은 Chef를 constructor로 받고 field에 보존합니다. 이 짧은 예제는 '호텔을 만든 뒤 나중에 요리사를 넣는다'는 중간 상태를 허용하지 않는 constructor injection의 핵심을 보여 줍니다.",
      "required dependency가 field injection이면 reflection 이후에야 값이 생기므로 plain Java construction에서 null 상태가 가능하고 class만 읽어서는 생성 요구조건이 보이지 않습니다. constructor signature는 compile-time API에 요구조건을 노출합니다.",
      "Spring container는 definition graph에서 constructor argument를 해결한 뒤 constructor를 호출합니다. 후보가 없거나 여러 개라 선택할 수 없으면 business traffic 전에 configuration failure로 처리하는 것이 좋습니다.",
      "Objects.requireNonNull 같은 guard는 Spring 대신 dependency를 찾는 기능이 아닙니다. 잘못된 manual construction과 명시적 null을 class 경계에서 즉시 거부해 stack trace가 원인과 가까워지게 합니다.",
      "필수성과 중요도는 다릅니다. 모든 infrastructure를 constructor에 넣기 전에 class가 실제로 그 책임을 소유하는지 검토하고, orchestration 밖의 관심사는 port나 별도 decorator로 분리합니다.",
    ],
    concepts: [
      c("required dependency", "객체의 정상 상태와 핵심 동작에 항상 필요한 collaborator입니다.", ["constructor parameter로 드러냅니다.", "누락 시 객체 생성을 실패시킵니다."]),
      c("class invariant", "public method 호출 전후에 항상 성립해야 하는 객체의 조건입니다.", ["constructor가 최초로 수립합니다.", "필수 dependency non-null도 한 예입니다."]),
      c("fail fast", "잘못된 configuration을 사용 지점보다 생성·검증 지점에서 즉시 실패시키는 원칙입니다.", ["원인 stack이 짧아집니다.", "traffic 전 context test와 연결합니다."]),
    ],
    codeExamples: [java("core02-required", "required dependency와 생성 시점 실패", "Core02Required.java", "final constructor dependency와 null guard를 실행해 정상 객체와 불완전 객체의 경계를 확인합니다.", String.raw`import java.util.Objects;

public class Core02Required {
  interface Gateway { String charge(int amount); }
  static final class PaymentService {
    private final Gateway gateway;
    PaymentService(Gateway gateway) { this.gateway = Objects.requireNonNull(gateway, "gateway"); }
    String pay(int amount) {
      if (amount <= 0) throw new IllegalArgumentException("amount");
      return gateway.charge(amount);
    }
  }
  public static void main(String[] args) {
    PaymentService service = new PaymentService(amount -> "approved:" + amount);
    System.out.println("pay=" + service.pay(42));
    try { new PaymentService(null); }
    catch (NullPointerException error) { System.out.println("missing=" + error.getMessage()); }
    try { service.pay(0); }
    catch (IllegalArgumentException error) { System.out.println("invalid=" + error.getMessage()); }
  }
}`, "pay=approved:42\nmissing=gateway\ninvalid=amount", ["local-hotel", "local-chef", "spring-constructor-di", "java-objects"])],
    diagnostics: [
      d("method 중간에서 dependency NullPointerException이 납니다.", "필수 collaborator를 field/setter로 늦게 주입하거나 manual construction이 누락했습니다.", ["constructor signature", "field injection", "manual new sites", "context candidates", "first null dereference"], "필수 dependency를 constructor+null guard로 옮기고 모든 composition root를 수정합니다.", "plain construction test와 context missing-bean negative test를 둡니다."),
      d("constructor가 스무 개 parameter를 요구합니다.", "필수성이 높아서가 아니라 class가 여러 변경 이유와 orchestration을 소유합니다.", ["parameter responsibility groups", "method usage", "co-change history", "module boundaries", "test setup"], "기능별 service/policy/adapter로 책임을 분리하고 의미 없는 parameter object 포장만 피합니다.", "constructor size 자체보다 cohesion/dependency fan-in architecture review를 둡니다."),
    ],
    expertNotes: ["constructor injection은 null 제거 도구이면서 architecture의 dependency 비용을 드러내는 압력입니다.", "'모든 parameter가 non-null'과 business 값 invariant는 서로 다른 guard와 오류 계약으로 관리합니다."],
  },
  {
    id: "final-reference-publication",
    title: "final reference로 재할당을 막되 immutability와 thread safety를 별도로 증명합니다",
    lead: "constructor에서 받은 collaborator를 final field에 보존하면 reference lifecycle이 명확해지지만 대상 객체의 내부 상태나 동시성 안전성이 자동 보장되지는 않습니다.",
    explanations: [
      "final field는 객체 생성 후 dependency reference가 다른 구현으로 바뀌지 않음을 compiler에 알립니다. configuration mutation을 business method와 경쟁시키지 않고 graph 변경은 새 context/object graph 배포로 수행합니다.",
      "reference가 final이어도 collaborator가 mutable collection이나 비 thread-safe client라면 singleton service의 동시 호출은 여전히 race가 납니다. injected type의 concurrency contract와 scope를 함께 검토합니다.",
      "Java Memory Model의 final-field semantics는 정상 constructor completion 뒤 publication에 도움을 주지만 constructor에서 this를 외부 listener/thread에 escape시키면 완전 초기화 보장을 훼손할 수 있습니다.",
      "immutable configuration snapshot을 주입하면 한 request 중 값이 바뀌지 않아 재현성이 높아집니다. live reload가 필요하면 versioned provider/snapshot을 operation 시작 시 한 번 읽는 경계를 둡니다.",
      "Spring singleton은 container당 object identity scope이지 자동 synchronization이 아닙니다. per-request mutable state를 local variable에 두고 shared collaborator의 thread-safety를 공식 contract와 load test로 확인합니다.",
    ],
    concepts: [
      c("final field", "constructor 이후 reference 재할당을 금지하는 Java field입니다.", ["dependency identity를 안정화합니다.", "referenced object의 deep immutability는 보장하지 않습니다."]),
      c("safe publication", "다른 thread가 완전히 초기화된 객체 상태를 보도록 reference를 공개하는 동시성 조건입니다.", ["container-managed creation은 도움이 됩니다.", "constructor this escape를 피합니다."]),
      c("thread safety", "여러 thread가 동시에 호출해도 invariant와 결과 계약이 보존되는 성질입니다.", ["scope와 mutable state를 함께 봅니다.", "final만으로 결론내리지 않습니다."]),
    ],
    codeExamples: [java("core02-concurrent-collaborator", "final dependency와 thread-safe shared state", "Core02Concurrent.java", "final service dependency로 AtomicInteger collaborator를 주입하고 100개 virtual-thread 호출의 결정적 최종 상태를 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class Core02Concurrent {
  interface Counter { void increment(); int value(); }
  static final class AtomicCounter implements Counter {
    private final AtomicInteger value = new AtomicInteger();
    public void increment() { value.incrementAndGet(); }
    public int value() { return value.get(); }
  }
  static final class RequestService {
    private final Counter counter;
    RequestService(Counter counter) { this.counter = counter; }
    void handle() { counter.increment(); }
  }
  public static void main(String[] args) throws Exception {
    Counter counter = new AtomicCounter();
    RequestService service = new RequestService(counter);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
      List<java.util.concurrent.Future<?>> futures = new ArrayList<>();
      for (int index = 0; index < 100; index++) futures.add(executor.submit(service::handle));
      for (var future : futures) future.get();
    }
    System.out.println("same-dependency=true");
    System.out.println("handled=" + counter.value());
  }
}`, "same-dependency=true\nhandled=100", ["spring-bean-scopes", "java-final-jls", "java-atomic-integer", "java-executors"])],
    diagnostics: [
      d("final dependency인데도 singleton에서 race가 납니다.", "reference만 final이고 collaborator 내부 mutable state가 thread-safe하지 않습니다.", ["collaborator contract", "scope", "mutable fields", "request state", "concurrent schedule"], "stateless/immutable 또는 synchronization·concurrent structure가 검증된 collaborator를 주입합니다.", "multi-thread invariant test와 documented concurrency contract를 둡니다."),
      d("설정 reload 중 한 요청에서 서로 다른 version 값이 섞입니다.", "각 method 단계가 mutable provider를 반복 조회합니다.", ["provider lookup count", "snapshot version", "operation boundary", "reload event", "logs"], "operation 시작에 immutable versioned snapshot을 한 번 얻어 전체 흐름에 전달합니다.", "mid-operation reload fault test와 version telemetry를 둡니다."),
    ],
    expertNotes: ["Spring singleton의 의미를 GoF singleton 또는 process-global과 혼동하지 않습니다.", "final은 좋은 기본값이지만 concurrency evidence를 대체하는 annotation이 아닙니다."],
  },
  {
    id: "constructor-selection",
    title: "단일·다중 constructor 선택 규칙과 factory method 경계를 명시적으로 관리합니다",
    lead: "constructor가 하나면 annotation 없이 주입할 수 있지만 여러 constructor와 optional 후보가 섞이면 resolution 규칙을 코드와 context test로 고정해야 합니다.",
    explanations: [
      "현대 Spring에서 bean class에 constructor가 하나면 @Autowired 없이도 그 constructor가 사용됩니다. framework annotation을 domain class에서 줄이고 pure Java construction을 유지할 수 있습니다.",
      "constructor가 여러 개일 때 required=true constructor는 최대 하나이며, 그렇지 않으면 만족 가능한 candidate와 argument 수를 바탕으로 선택됩니다. 암묵적 선택을 팀 규칙으로 믿기보다 하나의 명시적 primary constructor를 선호합니다.",
      "Java record의 canonical constructor도 dependency-bearing value holder에 쓸 수 있지만 service를 record로 만들 이유는 별도입니다. domain identity, framework proxy 가능성과 serialization 목적을 혼동하지 않습니다.",
      "static/instance factory method injection은 constructor와 비슷하게 arguments를 받지만 creation policy와 반환 type을 숨길 수 있습니다. resource ownership, caching과 subtype 선택을 factory contract에 명시합니다.",
      "Lombok-generated constructor를 쓰면 compile 결과와 annotation processing이 public API가 됩니다. generated signature, null annotations와 upgrade drift를 compile/context tests에서 확인합니다.",
    ],
    concepts: [
      c("constructor resolution", "container가 definition metadata와 후보 dependency를 이용해 호출할 constructor를 결정하는 과정입니다.", ["단일 constructor는 annotation 없이 주입 가능합니다.", "다중 후보는 ambiguity test가 필요합니다."]),
      c("canonical constructor", "record components 전체를 초기화하는 record의 기준 constructor입니다.", ["value carrier에 적합할 수 있습니다.", "service semantics는 별도 판단합니다."]),
      c("factory method", "constructor 호출을 감싸거나 다른 subtype/object를 반환하는 creation operation입니다.", ["argument injection을 받을 수 있습니다.", "ownership과 caching을 명시합니다."]),
    ],
    diagnostics: [
      d("constructor 추가 후 다른 constructor가 선택됩니다.", "다중 constructor resolution을 암묵적으로 두었고 만족 가능한 후보가 변했습니다.", ["constructors", "@Autowired required", "available beans", "parameter names/types", "selected signature"], "하나의 명시적 constructor로 통합하거나 factory methods를 용도별 bean definition으로 분리합니다.", "selected constructor와 graph를 context test에 고정합니다."),
      d("generated constructor가 production build에서 없습니다.", "annotation processor/plugin 설정이 IDE와 CI에서 다릅니다.", ["compiled bytecode", "processor config", "toolchain", "incremental build cache", "artifact"], "명시적 constructor 또는 고정된 annotation processing toolchain을 사용하고 clean CI compile을 gate로 둡니다.", "source가 아니라 배포 artifact signature를 smoke test합니다."),
    ],
    expertNotes: ["constructor overload는 domain creation use case에 의미가 있을 때만 두고 DI 편의를 위한 모호성을 만들지 않습니다.", "Spring의 현재 선택 규칙은 공식 지원 버전 문서로 확인하고 upgrade corpus에 포함합니다."],
  },
  {
    id: "candidate-qualifier-contract",
    title: "parameter type·generic·qualifier로 dependency 선택 근거를 refactor-safe하게 만듭니다",
    lead: "constructor가 명시적이어도 같은 interface 구현이 여러 개면 어느 collaborator를 주입할지 composition policy가 필요합니다.",
    explanations: [
      "type은 첫 번째 candidate filter입니다. 구현이 하나일 때는 단순하지만 email/sms notifier처럼 둘 이상이면 @Primary 또는 semantic @Qualifier로 의도를 선언합니다.",
      "parameter 이름 fallback에 의존하면 compiler parameter metadata와 refactor에 따라 behavior가 달라질 수 있습니다. qualifier 이름은 기술 bean id보다 business capability를 표현하고 custom qualifier annotation으로 오타를 줄입니다.",
      "generic type은 후보를 좁힐 수 있지만 type erasure, bridge/proxy와 factory method return declaration의 영향을 받습니다. public interface와 @Bean return type을 실제 주입 contract에 맞춥니다.",
      "여러 구현을 모두 필요로 하면 List/Map을 주입하고 순서·key semantics를 정의합니다. 하나를 선택해야 하는데 collection을 받은 뒤 임의 첫 항목을 고르는 것은 ambiguity를 숨깁니다.",
      "profile/condition으로 후보를 제거하는 경우 지원 environment matrix에서 정확히 하나가 남는지 검증합니다. production-only duplicate는 local happy path로 발견되지 않습니다.",
    ],
    concepts: [
      c("qualifier", "같은 type 후보 중 semantic subset 또는 특정 dependency를 지정하는 metadata입니다.", ["composition intent를 드러냅니다.", "custom annotation으로 type-safe하게 만들 수 있습니다."]),
      c("primary", "단일 의존성 resolution에서 여러 후보 중 기본 우선 후보를 표시합니다.", ["전역 기본값 역할입니다.", "지역별 의도에는 qualifier가 더 명확할 수 있습니다."]),
      c("candidate cardinality", "주입 지점에서 조건을 만족하는 bean 수가 0, 1 또는 N인 상태입니다.", ["required single은 정확히 1이어야 합니다.", "collection은 N의 의미와 order를 정의합니다."]),
    ],
    diagnostics: [
      d("두 구현 추가 후 NoUniqueBeanDefinitionException이 납니다.", "single constructor parameter에 type 후보가 여러 개지만 selection metadata가 없습니다.", ["candidate list", "primary", "qualifiers", "profiles", "generic types"], "composition root에서 primary/semantic qualifier 또는 explicit @Bean wiring으로 정책을 명시합니다.", "모든 profile matrix에서 candidate cardinality test를 둡니다."),
      d("parameter 이름 변경만 했는데 다른 bean이 주입됩니다.", "name fallback을 selection contract로 사용했습니다.", ["compiler -parameters", "parameter name", "bean ids", "qualifier metadata", "diff"], "명시적 semantic qualifier 또는 direct factory wiring으로 이름 refactor와 분리합니다.", "DI behavior가 source variable name에 의존하지 않는 architecture test를 둡니다."),
    ],
    expertNotes: ["@Primary가 많아지면 composition policy가 분산되므로 module configuration에서 선택을 집중합니다.", "qualifier는 hidden string이 아니라 지원해야 할 capability taxonomy의 일부입니다."],
  },
  {
    id: "optional-multiple-provider",
    title: "optional·multiple·lazy dependency를 서로 다른 API로 표현합니다",
    lead: "없어도 되는 capability, 여러 plugin, 늦게 얻어야 하는 instance는 모두 'nullable field'가 아니라 각 cardinality와 lifecycle에 맞는 contract를 가져야 합니다.",
    explanations: [
      "Optional<T> constructor parameter는 absence를 type에 드러내지만 core business invariant가 optional인지 다시 묻습니다. 항상 필요한 기능을 configuration 편의 때문에 Optional로 만들지 않습니다.",
      "List<T> 또는 Map<String,T> injection은 후보가 없어도 빈 collection으로 해결될 수 있습니다. zero plugin이 정상인지, 최소 하나가 필요한지 application-level validation을 추가합니다.",
      "ObjectProvider<T>는 availability, iteration과 lazy retrieval을 지원하지만 Spring API가 class로 전파됩니다. infrastructure composition adapter 안에 provider를 가두고 domain에는 목적별 interface/factory를 전달할 수 있습니다.",
      "@Nullable은 null contract를 표시할 수 있지만 call site가 분기를 잊기 쉽습니다. no-op implementation이 의미를 왜곡하지 않는 경우에만 Null Object를 선택하고 disabled telemetry를 남깁니다.",
      "optional dependency의 실패와 absence를 구분합니다. 설정되지 않음, 생성 실패, 일시적 remote failure를 모두 empty로 삼키면 운영 장애가 feature-off처럼 보입니다.",
    ],
    concepts: [
      c("optional dependency", "기능이 없어도 객체의 핵심 invariant가 유지되는 collaborator입니다.", ["absence behavior를 정의합니다.", "creation failure와 구분합니다."]),
      c("multi-element injection", "동일 contract의 0..N 후보를 array/list/map으로 받는 주입 형태입니다.", ["빈 collection 가능성을 검증합니다.", "order와 key를 명시합니다."]),
      c("ObjectProvider", "Spring container에서 dependency를 지연·optional·iteration 방식으로 얻는 provider interface입니다.", ["infrastructure 경계에 제한합니다.", "lookup failure semantics를 테스트합니다."]),
    ],
    codeExamples: [java("core02-optional-plugins", "0..N plugin을 빈 collection과 결정적 순서로 처리", "Core02Plugins.java", "optional plugin을 null 대신 immutable List로 주입하고 zero/two 후보 결과를 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Core02Plugins {
  interface Notifier { String name(); String send(String message); }
  record NamedNotifier(String name) implements Notifier {
    public String send(String message) { return name + ":" + message; }
  }
  static final class Publisher {
    private final List<Notifier> notifiers;
    Publisher(List<Notifier> notifiers) {
      this.notifiers = notifiers.stream().sorted(Comparator.comparing(Notifier::name)).toList();
    }
    List<String> publish(String message) {
      List<String> results = new ArrayList<>();
      for (Notifier notifier : notifiers) results.add(notifier.send(message));
      return List.copyOf(results);
    }
  }
  public static void main(String[] args) {
    System.out.println("none=" + new Publisher(List.of()).publish("ready"));
    Publisher two = new Publisher(List.of(new NamedNotifier("sms"), new NamedNotifier("email")));
    System.out.println("ordered=" + two.publish("ready"));
    System.out.println("count=" + two.publish("ready").size());
  }
}`, "none=[]\nordered=[email:ready, sms:ready]\ncount=2", ["spring-autowired", "spring-object-provider", "java-optional", "java-list"])],
    diagnostics: [
      d("필수 기능인데 Optional.empty로 조용히 비활성화됩니다.", "configuration 오류를 optional capability로 모델링했습니다.", ["business invariant", "absence policy", "startup validation", "feature flag", "telemetry"], "필수 dependency로 되돌리고 지원되는 feature-off만 별도 strategy/config contract로 표현합니다.", "required/disabled profile을 분리한 negative context tests를 둡니다."),
      d("plugin 실행 순서가 배포마다 달라집니다.", "collection injection order를 bean discovery 순서로 가정했습니다.", ["@Order/Ordered", "registry comparator", "definition order", "duplicate order", "runtime manifest"], "semantic priority와 tie-break key를 명시해 immutable ordered list를 만듭니다.", "순서 permutation test와 manifest readback을 둡니다."),
    ],
    expertNotes: ["optional type이 많다는 것은 product variant가 많거나 책임 경계가 흐리다는 신호일 수 있습니다.", "provider는 cycle을 숨기는 응급 도구가 아니라 실제 lookup/lifetime 요구가 있을 때 사용합니다."],
  },
  {
    id: "cycle-refactoring",
    title: "constructor cycle을 setter·lazy로 숨기지 않고 orchestration 책임을 재설계합니다",
    lead: "A가 B를 만들기 위해 필요하고 B도 A를 만들기 위해 필요하면 완전 초기화된 graph가 존재할 수 없으므로 책임 방향을 바꿔야 합니다.",
    explanations: [
      "Spring은 constructor injection만으로 서로를 요구하는 A↔B graph를 해결할 수 없고 BeanCurrentlyInCreationException 같은 creation failure로 드러냅니다. 이것은 container가 불편한 것이 아니라 object graph가 닫히지 않는다는 증거입니다.",
      "setter injection, @Lazy proxy 또는 context lookup으로 cycle을 통과시킬 수 있어도 어느 객체가 workflow를 소유하는지 모호하고 partially initialized access, transaction self-invocation과 테스트 복잡성이 남습니다.",
      "두 service가 서로 command를 호출한다면 상위 coordinator가 순서를 소유하게 하고 각 service는 port를 통해 한 방향 dependency만 가집니다. 공유 계산은 independent policy로 추출합니다.",
      "notification 때문에 cycle이 생겼다면 immutable domain event를 반환하고 application layer가 publisher를 호출하거나 transaction outbox를 기록합니다. callback과 durable event의 failure semantics를 구분합니다.",
      "legacy cycle을 즉시 제거하지 못하면 cycle path, 임시 lazy edge, risk, owner와 제거 기한을 registry에 남기고 새 edge를 architecture test로 금지합니다.",
    ],
    concepts: [
      c("constructor cycle", "constructor dependency path가 시작 bean으로 되돌아와 어느 instance도 먼저 완성할 수 없는 graph입니다.", ["startup에서 빠르게 드러납니다.", "책임 방향 재설계가 우선입니다."]),
      c("orchestrator", "여러 독립 service/port의 호출 순서와 transaction use case를 소유하는 상위 component입니다.", ["양방향 service 호출을 줄입니다.", "workflow failure contract를 집중합니다."]),
      c("dependency inversion", "고수준 policy가 구체 infrastructure 대신 자신이 필요로 하는 abstraction에 의존하도록 방향을 바꾸는 원리입니다.", ["graph를 architecture 방향에 맞춥니다.", "composition root가 implementation을 연결합니다."]),
    ],
    codeExamples: [java("core02-cycle-refactor", "양방향 service를 coordinator와 ports로 분리", "Core02Coordinator.java", "inventory와 payment가 서로를 호출하지 않고 OrderCoordinator가 transaction 순서를 소유하는 graph를 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Core02Coordinator {
  interface Inventory { void reserve(String item, List<String> events); }
  interface Payment { void charge(int amount, List<String> events); }
  static final class OrderCoordinator {
    private final Inventory inventory;
    private final Payment payment;
    OrderCoordinator(Inventory inventory, Payment payment) { this.inventory = inventory; this.payment = payment; }
    List<String> place(String item, int amount) {
      List<String> events = new ArrayList<>();
      inventory.reserve(item, events);
      payment.charge(amount, events);
      events.add("order:confirmed");
      return List.copyOf(events);
    }
  }
  public static void main(String[] args) {
    Inventory inventory = (item, events) -> events.add("reserve:" + item);
    Payment payment = (amount, events) -> events.add("charge:" + amount);
    OrderCoordinator coordinator = new OrderCoordinator(inventory, payment);
    System.out.println("events=" + coordinator.place("book", 30));
    System.out.println("cycle=false");
  }
}`, "events=[reserve:book, charge:30, order:confirmed]\ncycle=false", ["spring-constructor-di", "spring-autowired", "java-list"])],
    diagnostics: [
      d("BeanCurrentlyInCreationException이 발생합니다.", "constructor dependency graph에 A→B→A cycle이 있습니다.", ["full dependency path", "constructor parameters", "service call directions", "shared policy", "transaction owner"], "상위 orchestrator 또는 independent policy/event를 도입해 graph를 DAG로 만듭니다.", "module/bean dependency cycle test를 CI에 둡니다."),
      d("@Lazy를 붙인 뒤 특정 첫 호출에서만 실패합니다.", "cycle을 proxy로 지연했지만 target initialization·transaction/lifecycle 문제를 남겼습니다.", ["lazy edge", "proxy target creation", "first call", "self invocation", "init state"], "lazy를 migration shim으로 제한하고 책임 분리 후 edge를 제거합니다.", "first-use/failure/concurrent lazy tests와 제거 deadline을 둡니다."),
    ],
    expertNotes: ["모든 양방향 domain relationship이 object dependency cycle을 요구하지는 않습니다. identifier와 repository query로 경계를 유지할 수 있습니다.", "cycle path는 class list가 아니라 각 edge의 use-case reason과 함께 검토합니다."],
  },
  {
    id: "plain-java-testing",
    title: "Spring context 없이 fake를 직접 주입해 business contract를 빠르고 결정적으로 테스트합니다",
    lead: "constructor signature가 dependency API를 드러내므로 test가 reflection, private field mutation이나 container bootstrap 없이 object graph를 만들 수 있습니다.",
    explanations: [
      "fake는 실제 interface를 in-memory deterministic behavior로 구현하고 state를 readback할 수 있습니다. mock interaction 수보다 final outcome/invariant가 중요한 service test에 유용합니다.",
      "stub은 특정 입력에 정해진 응답을 주고 spy는 호출을 기록하며 mock은 기대 interaction을 검증합니다. 이름보다 무엇을 증명하고 무엇을 대체하지 못하는지 문서화합니다.",
      "constructor에 interface를 받는다고 좋은 testability가 자동 생기지 않습니다. interface가 거대한 infrastructure SDK를 그대로 노출하면 fake 작성과 실패 모델이 복잡하므로 use-case가 필요한 좁은 port를 정의합니다.",
      "unit test는 Spring의 candidate selection, proxy와 transaction을 검증하지 않습니다. context contract test와 target integration test를 증거 사다리의 다음 단계로 둡니다.",
      "test-only constructor나 package setter를 추가하지 않습니다. production object의 실제 invariant를 test에서도 그대로 사용하고 clock/id generator처럼 비결정적 source를 explicit dependency로 만듭니다.",
    ],
    concepts: [
      c("test double", "실제 collaborator 대신 테스트 목적에 맞게 사용하는 fake, stub, spy 또는 mock 객체입니다.", ["증명 목적에 맞게 선택합니다.", "실제 integration semantics는 대체하지 않습니다."]),
      c("fake", "작동 가능한 단순 구현으로 state와 outcome을 결정적으로 제공하는 test double입니다.", ["in-memory repository가 예입니다.", "운영 성능/transaction은 재현하지 않습니다."]),
      c("port", "application/core가 외부 capability에 요구하는 작은 interface contract입니다.", ["SDK 세부사항을 격리합니다.", "fake와 adapter가 같은 contract tests를 공유합니다."]),
    ],
    codeExamples: [java("core02-fake", "constructor에 fake를 직접 주입한 outcome test", "Core02Fake.java", "Spring context 없이 기록 가능한 fake discount port를 주입해 business 결과와 collaborator 입력을 함께 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Core02Fake {
  interface DiscountPolicy { int discountFor(int subtotal); }
  static final class RecordingDiscount implements DiscountPolicy {
    final List<Integer> calls = new ArrayList<>();
    public int discountFor(int subtotal) { calls.add(subtotal); return 10; }
  }
  static final class Checkout {
    private final DiscountPolicy policy;
    Checkout(DiscountPolicy policy) { this.policy = policy; }
    int total(int subtotal) {
      int total = subtotal - policy.discountFor(subtotal);
      if (total < 0) throw new IllegalStateException("negative total");
      return total;
    }
  }
  public static void main(String[] args) {
    RecordingDiscount fake = new RecordingDiscount();
    Checkout checkout = new Checkout(fake);
    System.out.println("total=" + checkout.total(100));
    System.out.println("calls=" + fake.calls);
    System.out.println("spring-context-used=false");
  }
}`, "total=90\ncalls=[100]\nspring-context-used=false", ["spring-constructor-di", "spring-testing", "java-list"])],
    diagnostics: [
      d("service unit test마다 Spring context가 필요합니다.", "field injection, context lookup 또는 framework type이 business class에 퍼졌습니다.", ["constructor", "ApplicationContext use", "private reflection", "annotations", "test duration"], "좁은 port를 constructor로 받고 plain Java fake로 graph를 구성합니다.", "core package의 Spring context dependency를 architecture test로 제한합니다."),
      d("mock test는 통과하지만 실제 결과가 틀립니다.", "내부 call 순서만 과도하게 고정하고 domain outcome·transaction을 검증하지 않았습니다.", ["assertions", "mock interactions", "final state", "contract tests", "integration coverage"], "outcome-oriented fake test와 실제 adapter contract/integration test를 추가합니다.", "interaction assertion에는 business reason을 요구합니다."),
    ],
    expertNotes: ["constructor injection의 가장 큰 이점 중 하나는 production composition과 test composition이 동일한 public API를 쓴다는 점입니다.", "fake가 실제 adapter와 다른 edge behavior를 갖지 않도록 shared contract tests를 운영합니다."],
  },
  {
    id: "constructor-cohesion",
    title: "constructor dependency 목록을 class cohesion과 architecture feedback으로 사용합니다",
    lead: "긴 constructor는 보기 싫은 문법이 아니라 한 class가 너무 많은 policy, I/O와 workflow를 아는지 조사하라는 설계 신호입니다.",
    explanations: [
      "parameter 수만 기계적으로 제한하면 FacadeDependencies 같은 bag object로 문제를 숨깁니다. 각 public method가 어떤 dependencies를 사용하는지 matrix를 그려 서로 겹치지 않는 cluster를 찾습니다.",
      "command와 query, orchestration과 calculation, domain policy와 infrastructure formatting을 분리하면 constructor가 자연스럽게 작아지고 테스트 setup도 목적별로 좁아집니다.",
      "여러 low-level values가 하나의 validated concept를 이룬다면 value object/config record로 묶을 수 있습니다. 서로 무관한 services를 편의를 위해 묶는 것은 cohesion이 아닙니다.",
      "decorator chain은 logging, metrics, retry 같은 cross-cutting behavior를 core service constructor에서 제거할 수 있지만 retry/transaction order와 proxy/self-invocation을 검증해야 합니다.",
      "dependency fan-in/out, module cycles, change coupling과 test fixture size를 함께 관찰합니다. constructor size 감소가 실제 변경 경계 개선으로 이어졌는지 확인합니다.",
    ],
    concepts: [
      c("cohesion", "한 class의 데이터와 behavior가 하나의 명확한 변경 이유에 함께 속하는 정도입니다.", ["method-dependency matrix로 검토합니다.", "높은 cohesion은 작은 graph로 이어집니다."]),
      c("dependency bag", "서로 무관한 dependencies를 한 wrapper에 넣어 constructor 길이만 숨긴 객체입니다.", ["명시성을 낮춥니다.", "실제 responsibility split을 대신하지 않습니다."]),
      c("decorator", "같은 interface를 구현하면서 기존 component 앞뒤에 behavior를 추가하는 객체입니다.", ["cross-cutting concern을 조합합니다.", "실행 order를 검증합니다."]),
    ],
    diagnostics: [
      d("Dependencies 객체 하나로 줄였지만 테스트가 더 어려워졌습니다.", "무관한 services를 service locator형 bag으로 묶었습니다.", ["bag members", "per-method usage", "mock setup", "module ownership", "change coupling"], "method usage cluster에 따라 class를 분리하고 의미 있는 value/config만 묶습니다.", "dependency bag/locator pattern을 architecture review에서 탐지합니다."),
      d("service 분리 뒤 transaction이 중간에 끊깁니다.", "responsibility split과 use-case transaction orchestration을 함께 분산했습니다.", ["transaction owner", "proxy boundary", "call direction", "failure rollback", "outbox"], "상위 application coordinator가 transaction/use case를 소유하고 하위 components는 명확한 ports로 둡니다.", "fault-injection transaction integration tests를 둡니다."),
    ],
    expertNotes: ["좋은 constructor는 class가 무엇을 알아야 하는지를 압축 없이 보여 주는 architecture 문서입니다.", "parameter count metric은 질문을 시작할 뿐 자동 refactor 규칙이 아닙니다."],
  },
  {
    id: "constructor-side-effects-lifecycle",
    title: "constructor는 invariant 수립에 집중하고 외부 I/O·thread 시작을 lifecycle 단계로 분리합니다",
    lead: "주입받은 dependency를 저장하고 입력을 검증하는 것은 constructor에 적합하지만 network 연결, migration과 background task는 실패·재시도·close가 있는 별도 operation입니다.",
    explanations: [
      "constructor에서 remote API를 호출하면 bean graph 생성이 network availability에 묶이고 timeout owner와 partial construction cleanup이 모호해집니다. client object 생성과 remote readiness probe를 분리합니다.",
      "this를 event bus나 thread에 constructor 중 등록하면 아직 완전 초기화되지 않은 instance가 호출될 수 있습니다. container lifecycle callback 이후 등록하고 destroy에서 반드시 해제합니다.",
      "validation도 local deterministic invariant와 external state 확인을 구분합니다. URL syntax/timeout range는 constructor에서 검사할 수 있지만 credential validity와 schema compatibility는 bounded startup probe입니다.",
      "초기화 failure가 발생하면 생성 완료된 upstream resources가 정리되는지 context-level test가 필요합니다. constructor 단위 test만으로 container rollback과 destroy behavior를 알 수 없습니다.",
      "lazy/prototype object의 side effect는 첫 호출 또는 반복 생성으로 이동합니다. creation count, resource budget과 ownership을 scope별로 측정합니다.",
    ],
    concepts: [
      c("constructor side effect", "object field 초기화 외에 network, file, thread 또는 global registry 상태를 변경하는 생성 중 작업입니다.", ["실패·cleanup을 복잡하게 합니다.", "명시적 lifecycle operation으로 분리합니다."]),
      c("this escape", "constructor가 끝나기 전에 현재 instance reference가 외부 code/thread에 공개되는 상태입니다.", ["부분 초기화 관측 위험이 있습니다.", "listener/thread 등록을 늦춥니다."]),
      c("startup probe", "필수 external capability가 요청 전에 준비되었는지 제한 시간과 안전한 query로 확인하는 operation입니다.", ["constructor와 분리합니다.", "readiness와 failure policy를 연결합니다."]),
    ],
    diagnostics: [
      d("context startup이 외부 API timeout에 매번 묶입니다.", "bean constructor가 network call을 수행합니다.", ["creation span", "constructor code", "DNS/connect timeout", "retry", "partial resources"], "constructor는 client/config만 만들고 bounded startup/readiness probe로 remote 확인을 이동합니다.", "network fault startup tests와 phase budgets를 둡니다."),
      d("startup 중 listener가 null field를 봅니다.", "constructor에서 this를 event bus/thread에 등록했습니다.", ["registration stack", "constructor completion", "callback thread", "field initialization order", "destroy deregistration"], "완전 초기화 이후 lifecycle callback에서 등록하고 close에서 해제합니다.", "early callback race와 shutdown deregistration tests를 둡니다."),
    ],
    expertNotes: ["constructor가 빨라야 한다는 말보다 deterministic하고 rollback-free한 local initialization이어야 한다는 기준이 더 정확합니다.", "외부 probe도 모든 dependency를 무조건 막지 말고 criticality와 degraded mode를 product contract로 정합니다."],
  },
  {
    id: "migration-observability",
    title: "field/setter injection을 constructor로 옮기며 graph·failure·운영 증거를 보존합니다",
    lead: "주입 방식 migration은 annotation 치환이 아니라 invalid state 제거, cycle 발견, candidate policy와 test architecture 개선 작업입니다.",
    explanations: [
      "먼저 각 injected field를 required, optional, multiple, provider/lifecycle로 분류합니다. required는 constructor, optional은 명시적 capability contract, mutable configuration은 versioned provider로 설계합니다.",
      "field를 final로 바꾸고 constructor를 추가하면 manual new call sites와 hidden tests가 compile error로 드러납니다. 이 실패를 우회하지 말고 모든 composition root를 의도적으로 수정합니다.",
      "migration 중 constructor cycle이 드러나면 setter로 되돌리지 않고 graph path와 orchestration owner를 분석합니다. 필요하면 작은 단계로 coordinator/port를 도입합니다.",
      "context test에서 selected constructor, candidate names/qualifiers, runtime proxy type와 required profile matrix를 확인합니다. unit test는 fake를 직접 주입하도록 reflection helper를 제거합니다.",
      "운영 telemetry에는 dependency object나 configuration value 전체가 아니라 bean name, constructor signature hash, candidate decision, graph failure category와 source version을 남깁니다.",
    ],
    concepts: [
      c("injection migration", "기존 hidden/mutable injection을 명시적 constructor dependency contract로 전환하는 과정입니다.", ["call sites를 compile-time에 드러냅니다.", "cycle/candidate policy를 함께 수정합니다."]),
      c("composition root", "application object graph의 concrete implementations와 configuration을 조립하는 최상위 경계입니다.", ["new와 framework wiring을 집중합니다.", "business code의 locator 접근을 막습니다."]),
      c("wiring evidence", "어떤 constructor와 후보가 선택됐고 graph가 왜 유효한지 보여 주는 비밀값 없는 검증 자료입니다.", ["context tests와 startup manifest에 남깁니다.", "runtime drift를 비교합니다."]),
    ],
    diagnostics: [
      d("constructor migration 후 수백 개 test가 깨집니다.", "tests가 reflection/partial object 또는 hidden default dependency에 의존했습니다.", ["failure clusters", "manual constructors", "reflection utilities", "default behavior", "fixture builders"], "production constructor를 사용하는 목적별 test builders/fakes로 바꾸고 invalid partial objects를 제거합니다.", "새 test가 field mutation을 쓰지 못하도록 정적 검사를 둡니다."),
      d("startup manifest가 credential 값을 포함합니다.", "constructor arguments를 진단하려고 object/value 전체를 직렬화했습니다.", ["manifest schema", "toString", "environment values", "APM attributes", "access/retention"], "type/name/qualifier/presence/version/hash만 allow-list하고 값은 기록하지 않습니다.", "secret-shaped canary zero-leak tests를 logs/traces/artifacts에 실행합니다."),
    ],
    expertNotes: ["constructor migration은 compile error를 이용해 hidden coupling을 inventory하는 좋은 기회입니다.", "완료 기준은 annotation 제거가 아니라 invalid state 부재와 context/unit/operation evidence입니다."],
  },
  {
    id: "qualification-runbook",
    title: "constructor graph를 unit→context→fault→canary 단계로 qualification합니다",
    lead: "객체 생성 성공만 확인하지 않고 missing/duplicate/cycle, collaborator failure, concurrency와 shutdown까지 증거 사다리로 검증합니다.",
    explanations: [
      "plain Java tests는 null guard, business invariant, fake outcomes와 class cohesion을 빠르게 검증합니다. 어떤 Spring annotation도 이 단계의 필수조건이 아닙니다.",
      "focused context tests는 single constructor selection, qualifier/primary, optional/list/provider, definition scope와 proxy wrapping을 확인합니다. 0/1/N candidate negative fixtures를 포함합니다.",
      "full application context는 profile/condition matrix, migrations, external client configuration과 lifecycle을 검증합니다. production artifact와 동일한 toolchain/classpath를 사용합니다.",
      "fault tests는 constructor/local validation, factory exception, remote startup probe, cycle, listener early call과 close failure를 주입해 최초 원인·cleanup·readiness 상태를 확인합니다.",
      "canary는 startup dependency graph hash, critical path duration, degraded capability, thread/pool state와 error category를 secret 없이 관측하고 threshold를 벗어나면 rollback합니다.",
    ],
    concepts: [
      c("graph qualification", "지원 configuration에서 object graph의 생성·resolution·lifecycle·failure 계약을 단계적으로 승인하는 과정입니다.", ["unit과 context evidence를 결합합니다.", "profile/upgrade마다 재실행합니다."]),
      c("negative context test", "dependency 누락·중복·cycle 같은 잘못된 graph가 기대한 category로 startup 실패하는지 확인하는 테스트입니다.", ["fail-fast를 증명합니다.", "message 전체 대신 stable category/path를 봅니다."]),
      c("canary graph hash", "비밀값을 제외한 definition/edge metadata를 정규화해 배포 간 object graph drift를 비교하는 fingerprint입니다.", ["의도적 변경만 승인합니다.", "값과 credential은 포함하지 않습니다."]),
    ],
    diagnostics: [
      d("context smoke는 통과하지만 특정 profile만 후보가 없습니다.", "지원 profile/condition 조합을 단일 기본 profile test가 대표한다고 가정했습니다.", ["profile matrix", "conditions", "candidate counts", "config sources", "artifact"], "지원 조합별 context contract를 parameterize하고 unsupported 조합은 명시적으로 거부합니다.", "configuration matrix를 release manifest와 CI gate에 연결합니다."),
      d("upgrade 후 proxy class가 바뀌어 cast가 실패합니다.", "injection point가 interface가 아닌 concrete implementation/proxy 내부에 결합했습니다.", ["runtime type", "injection type", "proxy strategy", "final class/method", "casts"], "application contract interface에 의존하고 proxy/advisor behavior를 integration test로 검증합니다.", "framework upgrade corpus에 runtime type와 no-concrete-cast checks를 둡니다."),
    ],
    expertNotes: ["context failure message wording은 버전별로 바뀔 수 있으므로 stable cause type, bean path와 invariant를 assertion합니다.", "graph hash가 같아도 collaborator external behavior는 달라질 수 있어 target integration/canary를 생략하지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-hotel", repository: "SPRING/SpringDI", path: "src/main/java/ex02/construct/Hotel.java", usedFor: ["Chef constructor dependency and stored collaborator progression"], evidence: "원본을 read-only로 확인했습니다." },
  { id: "local-chef", repository: "SPRING/SpringDI", path: "src/main/java/ex02/construct/Chef.java", usedFor: ["constructor-injected concrete collaborator starting point"], evidence: "원본을 read-only로 확인했습니다." },
  { id: "spring-constructor-di", repository: "Spring Framework Reference", path: "Dependency Injection / Constructor-based DI", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html", usedFor: ["constructor injection, resolution process and circular dependency behavior"], evidence: "Spring 공식 dependency injection reference입니다." },
  { id: "spring-autowired", repository: "Spring Framework Reference", path: "Using @Autowired", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html", usedFor: ["single/multiple constructors, optional and collection injection"], evidence: "Spring 공식 autowiring reference입니다." },
  { id: "spring-autowired-api", repository: "Spring Framework Javadoc", path: "Autowired", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html", usedFor: ["constructor required semantics"], evidence: "Spring 공식 Autowired API입니다." },
  { id: "spring-qualifier-api", repository: "Spring Framework Javadoc", path: "Qualifier", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Qualifier.html", usedFor: ["semantic candidate filtering"], evidence: "Spring 공식 Qualifier API입니다." },
  { id: "spring-primary-api", repository: "Spring Framework Javadoc", path: "Primary", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Primary.html", usedFor: ["default candidate selection"], evidence: "Spring 공식 Primary API입니다." },
  { id: "spring-object-provider", repository: "Spring Framework Javadoc", path: "ObjectProvider", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html", usedFor: ["lazy, optional and iterable dependency lookup"], evidence: "Spring 공식 ObjectProvider API입니다." },
  { id: "spring-bean-scopes", repository: "Spring Framework Reference", path: "Bean Scopes", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", usedFor: ["singleton/prototype identity and thread-safety boundaries"], evidence: "Spring 공식 scopes reference입니다." },
  { id: "spring-testing", repository: "Spring Framework Reference", path: "Testing", publicUrl: "https://docs.spring.io/spring-framework/reference/testing.html", usedFor: ["context integration tests and TestContext evidence"], evidence: "Spring 공식 testing reference입니다." },
  { id: "java-objects", repository: "Java SE 21 API", path: "Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["constructor null guard exact example"], evidence: "Oracle JDK 공식 Objects API입니다." },
  { id: "java-optional", repository: "Java SE 21 API", path: "Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["optional dependency modeling comparison"], evidence: "Oracle JDK 공식 Optional API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered plugin and coordinator event examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["thread-safe injected collaborator example"], evidence: "Oracle JDK 공식 AtomicInteger API입니다." },
  { id: "java-executors", repository: "Java SE 21 API", path: "Executors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html", usedFor: ["virtual-thread concurrent invocation example"], evidence: "Oracle JDK 공식 Executors API입니다." },
  { id: "java-final-jls", repository: "Java Language Specification 21", path: "17.5 final Field Semantics", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5", usedFor: ["final field publication boundary"], evidence: "Oracle JLS 공식 final field semantics입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-02-constructor-injection", slug: "spring-core-02-constructor-injection", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 2,
  title: "생성자 주입과 필수 의존성 불변성", subtitle: "final field 문법을 넘어 required/optional cardinality, constructor resolution, cycle refactor, concurrency, test doubles와 lifecycle qualification까지 연결합니다.", level: "전문가", estimatedMinutes: 980,
  coreQuestion: "constructor signature가 객체의 유효 상태와 architecture dependency를 정확히 드러내고, Spring의 후보 선택·lifecycle·동시성·실패 경로에서도 그 계약이 유지됨을 어떻게 증명할까요?",
  summary: "SpringDI의 Hotel과 Chef를 read-only로 확인해 constructor reference progression을 보존했습니다. required dependency와 class invariant, final reference와 thread safety, single/multiple constructor resolution, type/qualifier candidate policy, optional/list/provider cardinality, constructor cycle 책임 재설계, plain Java test doubles, cohesion feedback, side-effect/lifecycle 분리, field/setter migration과 unit→context→fault→canary qualification까지 확장합니다. 다섯 JDK 21 exact examples는 null guard, concurrent collaborator, 0..N plugins, coordinator DAG와 fake composition을 실제 실행합니다.",
  objectives: ["필수 dependency를 constructor invariant와 fail-fast contract로 표현한다.", "final reference, safe publication과 collaborator thread safety를 구분한다.", "단일·다중 constructor와 factory method resolution을 설명한다.", "type·generic·primary·qualifier로 0/1/N candidate를 결정한다.", "Optional·List·ObjectProvider의 cardinality와 lifecycle 차이를 선택한다.", "constructor cycle을 coordinator/port/event로 구조적으로 제거한다.", "plain Java fake와 context/integration test의 증거 범위를 구분한다.", "긴 constructor를 cohesion·transaction ownership 관점에서 리팩터링한다.", "constructor side effect와 external readiness/lifecycle을 분리한다.", "migration·관측·upgrade까지 constructor graph를 qualification한다."],
  prerequisites: [{ title: "IoC 컨테이너와 BeanDefinition 읽기", reason: "definition, dependency graph, candidate resolution과 context lifecycle을 알아야 constructor injection의 실제 bootstrap 결과를 해석할 수 있습니다.", sessionSlug: "spring-core-01-ioc-container-bean" }],
  keywords: ["constructor injection", "required dependency", "class invariant", "final field", "safe publication", "@Autowired", "@Qualifier", "@Primary", "ObjectProvider", "candidate cardinality", "circular dependency", "test double", "cohesion", "composition root", "startup probe"], topics,
  lab: {
    title: "Hotel/Chef 예제를 운영 가능한 constructor dependency graph로 확장하기",
    scenario: "작은 constructor example을 여러 notifier/payment/inventory 구현, optional plugins, concurrent requests와 startup/shutdown failure가 있는 application graph로 확장합니다.",
    setup: ["원본 Hotel/Chef는 read-only로 보존하고 class/constructor edge만 provenance로 사용합니다.", "JDK 21 examples와 지원 Spring/JDK context-test project를 준비합니다.", "dependency별 required/optional/multiple/lazy, scope, thread-safety와 owner matrix를 작성합니다.", "실제 credential/network 없이 synthetic fakes와 disposable external adapters를 사용합니다."],
    steps: ["모든 injected field/setter/context lookup을 inventory하고 required cardinality를 분류합니다.", "required dependencies를 final constructor parameters와 local validation으로 옮깁니다.", "candidate 0/1/N, primary/qualifier/generic/profile matrix를 negative-test합니다.", "optional/list/provider의 absence, creation failure와 order를 구분합니다.", "cycle path를 찾아 coordinator/port/event로 DAG를 재설계합니다.", "method-dependency matrix로 god constructor와 transaction owner를 분리합니다.", "constructor network/thread/global side effect를 lifecycle/startup probe로 이동합니다.", "plain Java fakes로 business outcomes와 concurrent invariant를 검증합니다.", "Spring context에서 selected constructor, proxy, candidate와 scope를 readback합니다.", "startup/failure/close canary와 secret-zero graph manifest를 승인합니다."],
    expectedResult: ["필수 dependency 누락과 중복 후보가 traffic 전에 명확한 path로 실패합니다.", "instance는 생성 직후 완전한 invariant를 가지며 final reference가 임의 교체되지 않습니다.", "constructor cycle과 service locator가 제거되고 graph가 단방향입니다.", "unit tests는 context 없이 실행되고 context tests는 wiring/proxy/lifecycle을 별도로 증명합니다.", "동시 요청·startup failure·shutdown에서 collaborator contract와 resource cleanup이 유지됩니다."],
    cleanup: ["disposable contexts, fake state, manifests와 synthetic telemetry를 run id로 제거합니다.", "context와 executor/client/pool을 닫고 remaining threads/resources absence를 확인합니다.", "temporary profiles/credentials/access를 revoke합니다.", "원본 SPRING/SpringDI files는 변경하지 않습니다."],
    extensions: ["custom qualifier annotation과 compile-time module dependency checks를 추가합니다.", "Kotlin primary constructor/nullability와 Java records를 비교합니다.", "AOT/native image에서 constructor reflection/metadata requirements를 검증합니다.", "graph hash와 deployment provenance를 release attestation에 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 required·concurrent·multiple·cycle-refactor 증거를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "null dependency가 생성 시 실패함을 설명합니다.", "final과 thread safety를 구분합니다.", "0 plugin과 ordered plugins를 설명합니다.", "coordinator graph가 cycle이 아닌 이유를 그립니다.", "각 example이 실제 Spring을 대체하지 않는 범위를 적습니다."], hints: ["annotation보다 object가 존재할 수 있는 상태와 dependency cardinality를 먼저 적으세요."], expectedOutcome: "constructor injection을 문법이 아니라 invariant·graph·concurrency contract로 설명합니다.", solutionOutline: ["class invariant→candidate→graph→lifecycle→evidence 순서입니다."] },
    { difficulty: "응용", prompt: "field/setter 주입 service를 constructor graph로 안전하게 migration하세요.", requirements: ["required/optional/multiple/provider를 분류합니다.", "final constructor와 manual call sites를 수정합니다.", "candidate/profile negative tests를 둡니다.", "cycle은 구조적으로 제거합니다.", "cohesion/transaction owner를 검토합니다.", "plain fake와 context tests를 분리합니다.", "startup/close failure를 주입합니다.", "secret-zero manifest와 rollback을 포함합니다."], hints: ["깨지는 compile/test는 hidden dependency inventory로 활용하세요."], expectedOutcome: "불완전 상태와 hidden wiring이 없는 testable object graph가 완성됩니다.", solutionOutline: ["inventory→classify→compile migration→cycle split→tests→canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring constructor injection·graph qualification 표준을 작성하세요.", requirements: ["required/optional cardinality 규칙을 둡니다.", "final/concurrency/scope contract를 정의합니다.", "constructor/qualifier/primary policy를 둡니다.", "cycle/provider/lazy 사용 gate를 둡니다.", "cohesion과 transaction orchestration review를 둡니다.", "constructor side-effect 금지와 lifecycle을 정의합니다.", "unit/context/fault/profile tests를 요구합니다.", "graph telemetry, secret hygiene와 upgrade rollback을 포함합니다."], hints: ["'생성자 주입 사용' 한 줄을 각 실패 경로의 검증 기준으로 확장하세요."], expectedOutcome: "object creation부터 운영 canary까지 적용 가능한 constructor governance가 완성됩니다.", solutionOutline: ["declare→resolve→construct→operate→close→qualify 순서입니다."] },
  ],
  nextSessions: ["spring-core-03-setter-injection"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["Hotel.java의 single Chef constructor dependency와 stored field, Chef.java의 simple behavior를 read-only로 확인했습니다.", "원본은 null guard, candidate ambiguity, optional/multiple/provider, cycle refactor, concurrency, test doubles와 lifecycle/operation evidence를 포함하지 않아 공식 Spring/JDK 문서와 synthetic examples로 보완했습니다.", "원본 class/package 이름은 provenance에만 사용하고 실제 application value·credential·host는 포함하지 않았습니다.", "JDK examples는 Spring container constructor selection, proxy, scope와 post-processing을 대체하지 않으므로 지원 버전 context tests가 필요합니다."] },
});

export default session;
