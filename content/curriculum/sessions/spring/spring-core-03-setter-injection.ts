import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "JDK 21 interface·record·setter와 합성 configuration만으로 optional/default, required validation과 migration 경계를 준비합니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "setter 호출 전후 상태, freeze, atomic snapshot 교체, failure injection과 constructor migration을 실제 Java 객체로 실행합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "상태·호출 수·결과 category만 출력합니다. endpoint·account·credential과 원본 설정값은 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 Spring jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "예제는 setter의 객체 상태 비용을 고립해 보여 주며 실제 Spring property population, post-processing, proxy와 lifecycle을 대체하지 않습니다."] },
    experiments: [
      { change: "setter를 생략·중복 호출하거나 null/실패 collaborator를 넣고 start/use 순서를 바꿉니다.", prediction: "optional default가 없거나 required validation이 늦으면 불완전 상태가 business call까지 살아남습니다.", result: "configuration stage와 operational stage를 분리하고 stable failure category를 기록합니다." },
      { change: "singleton setter를 요청 중 교체하거나 constructor migration adapter를 제거합니다.", prediction: "동시 요청이 서로 다른 dependency generation을 보거나 legacy caller가 compile/runtime 실패합니다.", result: "immutable snapshot/atomic swap 또는 새 bean generation rollout과 compatibility usage evidence를 사용합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "setter-injection-lifecycle",
    title: "setter 주입을 생성 이후 property population 단계로 이해합니다",
    lead: "setter injection은 container가 먼저 객체를 만든 뒤 BeanDefinition의 property 또는 autowired method를 호출해 collaborator를 넣는 방식이므로 constructor injection과 유효 상태가 만들어지는 시점이 다릅니다.",
    explanations: [
      "기본 흐름은 instance 생성, property values 변환, setter/config method 호출, aware/post-processor, initialization callback, ready publication입니다. application이 initialization 전 instance를 직접 사용하지 않도록 container lifecycle 안에 둡니다.",
      "원본 MemberDAO는 no-arg 생성 가능한 객체에 DatabaseDev collaborator를 setter로 넣는 구조입니다. DatabaseDev에는 세 문자열 configuration property와 여섯 accessor가 있지만 실제 endpoint·account·credential 값은 이 자료에 복사하지 않습니다.",
      "setter 이름은 단순 편의 method가 아니라 writable bean property contract가 될 수 있습니다. parameter type, nullability, validation, 재호출 허용 여부와 side effect를 API 문서와 test에 명시합니다.",
      "Spring XML `<property ref=...>`와 `<property value=...>`, @Autowired setter/config method, @Bean code는 서로 다른 metadata source지만 최종적으로 object graph property를 채웁니다. source provenance를 startup evidence에 남깁니다.",
      "필수 collaborator를 setter로 두면 생성 직후 null 상태가 가능합니다. container가 traffic 전에 완성하더라도 plain `new`, deserialization, test와 proxy/custom lifecycle에서 그 중간 상태가 노출될 수 있음을 설계에 반영합니다.",
    ],
    concepts: [
      c("setter injection", "객체 생성 뒤 public/configuration method를 호출해 dependency 또는 값을 넣는 DI 방식입니다.", ["property population 단계에서 일어납니다.", "중간 상태가 존재할 수 있습니다."]),
      c("bean property", "getter/setter naming과 type으로 읽기·쓰기 가능한 객체 attribute contract입니다.", ["Spring이 값을 변환해 설정할 수 있습니다.", "field 자체와 구분합니다."]),
      c("property population", "instance 생성 후 BeanDefinition/autowiring metadata를 실제 setter/config method 호출로 적용하는 단계입니다.", ["initialization보다 앞섭니다.", "실패 시 bean을 publish하지 않습니다."]),
    ],
    codeExamples: [java("core03-optional-default", "기본 구현이 있는 진짜 선택 의존성", "Core03OptionalDefault.java", "setter가 호출되지 않아도 유효한 default를 사용하고 호출되면 명시 구현으로 바뀌는 객체를 실행합니다.", String.raw`import java.util.Objects;

public class Core03OptionalDefault {
  interface Audit { String decorate(String event); }
  static final class Processor {
    private Audit audit = event -> "default:" + event;
    private int setterCalls;
    void setAudit(Audit audit) {
      this.audit = Objects.requireNonNull(audit, "audit");
      setterCalls++;
    }
    String process(String event) { return audit.decorate(event); }
  }
  public static void main(String[] args) {
    Processor processor = new Processor();
    String before = processor.process("job");
    processor.setAudit(event -> "configured:" + event);
    String after = processor.process("job");
    System.out.println("before=" + before);
    System.out.println("after=" + after);
    System.out.println("setter-calls=" + processor.setterCalls);
    System.out.println("valid-before=true");
    System.out.println("valid-after=true");
  }
}`, "before=default:job\nafter=configured:job\nsetter-calls=1\nvalid-before=true\nvalid-after=true", ["local-database-dev", "local-member-dao", "spring-di", "spring-autowired", "spring-autowired-api", "java-objects", "java-optional"])],
    diagnostics: [d("bean은 생성되지만 setter가 호출되지 않아 첫 business call에서 null 오류가 납니다.", "필수 dependency를 optional property처럼 선언했고 initialization/ready gate에서 검증하지 않았습니다.", ["BeanDefinition property/autowired metadata", "setter invocation count", "initialization callback", "manual new call sites"], "필수 dependency는 constructor로 이동하거나 initialization 전에 명시 validation하고 실패 bean을 publish하지 않습니다.", "plain Java construction과 Spring context의 missing-property negative test를 둡니다.")],
    expertNotes: ["setter가 public이라는 이유만으로 runtime 관리 API로 노출하지 않습니다. configuration-only method임을 module visibility와 architecture rule로 제한합니다.", "property population 순서는 business dependency의 실행 순서가 아니므로 setter 안에서 collaborator를 즉시 호출하지 않습니다."],
  },
  {
    id: "required-vs-optional-dependency",
    title: "필수 의존성과 선택 의존성을 default·absence·failure 의미로 구분합니다",
    lead: "setter를 쓴다는 사실이 dependency를 선택적으로 만들지는 않으며, 선택 의존성은 주입이 없어도 객체가 완전히 유효하고 product behavior가 명확해야 합니다.",
    explanations: [
      "필수 collaborator는 모든 핵심 operation에 필요하고 누락 시 객체의 invariant가 성립하지 않습니다. constructor injection으로 요구조건을 드러내는 것이 기본이며 legacy/third-party 제약 때문에 setter를 쓰면 initialization fail-fast가 필요합니다.",
      "선택 collaborator는 no-op/default/fallback behavior가 class 안에 정의되어 있어 setter가 호출되지 않아도 안전합니다. absence와 implementation creation failure를 같은 '없음'으로 숨기지 않습니다.",
      "@Autowired(required=false), Optional, nullable parameter와 ObjectProvider는 lifecycle/cardinality가 다릅니다. non-required multi-arg method는 후보가 일부만 있는 경우의 호출 여부를 공식 문서와 context test로 확인합니다.",
      "선택 기능이 compliance logging, authorization 또는 transaction integrity를 담당한다면 실제로는 선택이 아닙니다. business 중요도와 object invariant를 다시 분류합니다.",
      "operational telemetry에는 dependency state를 default/configured/disabled/failed와 implementation logical id로 표시합니다. endpoint·credential·object toString을 출력하지 않습니다.",
    ],
    concepts: [
      c("optional dependency", "없어도 객체 invariant와 정의된 기본 behavior가 유지되는 collaborator입니다.", ["default/no-op를 가집니다.", "creation failure와 absence를 구분합니다."]),
      c("required dependency", "없으면 객체의 핵심 operation이 의미 있게 동작할 수 없는 collaborator입니다.", ["constructor를 우선합니다.", "누락 시 startup 실패합니다."]),
      c("no-op object", "interface contract를 지키면서 외부 효과 없이 안전한 기본 결과를 제공하는 구현입니다.", ["silent data loss가 없어야 합니다.", "관측 가능한 state를 둡니다."]),
    ],
    diagnostics: [d("optional notifier를 끄자 핵심 감사 기록이나 authorization까지 사라집니다.", "필수 control을 편의 기능으로 오분류하고 no-op fallback이 contract를 충족하는지 검토하지 않았습니다.", ["dependency-to-invariant matrix", "default behavior", "compliance/security requirements", "disabled-state telemetry"], "핵심 control은 required constructor port로 이동하고 진짜 선택 기능만 명시 no-op/default를 허용합니다.", "feature disable·candidate absence·creation failure를 각각 context/integration test합니다.")],
    expertNotes: ["Optional field 자체를 장기 mutable state로 두기보다 construction/configuration boundary에서 concrete default를 선택하는 편이 단순합니다.", "ObjectProvider는 lazy/iterable lookup도 가능하므로 단순 optional과 동일하게 사용하지 않습니다."],
  },
  {
    id: "temporal-coupling-invalid-state",
    title: "set 이후에만 호출 가능한 시간적 결합과 불완전 상태를 드러냅니다",
    lead: "`new Service(); setGateway(...); start(); use()`처럼 순서를 알아야만 안전한 API는 compiler가 보장하지 못하고 누락·중복·병렬 초기화에서 장애가 늦게 나타납니다.",
    explanations: [
      "temporal coupling은 같은 method들의 집합보다 호출 순서가 correctness를 결정하는 결합입니다. setter injection은 unconfigured→configured→initialized→operational state machine을 만들 수 있습니다.",
      "필수 setter를 유지해야 한다면 state enum과 initialize validation으로 ready 전 business method를 거부합니다. 하지만 상태 관리가 커질수록 constructor/factory/builder가 더 적절한지 재평가합니다.",
      "setter 중간에 side effect를 시작하지 않습니다. 여러 property 중 마지막이 무엇인지 BeanDefinition source에 따라 달라질 수 있어 partial configuration으로 thread/network registration이 일어날 수 있습니다.",
      "중복 setter 호출 정책을 reject, idempotent same-value 또는 controlled reconfigure 중 하나로 정합니다. 무조건 overwrite하면 resource leak와 split-brain dependency가 생깁니다.",
      "stack trace가 business method에서 null로 끝나지 않게 configuration path, missing logical property와 bean id를 startup error에 남깁니다. actual config value는 redaction합니다.",
    ],
    concepts: [
      c("temporal coupling", "API 호출 순서가 올바름을 결정하지만 type signature에는 충분히 드러나지 않는 결합입니다.", ["state machine으로 표현할 수 있습니다.", "constructor/factory로 줄입니다."]),
      c("invalid intermediate state", "객체는 존재하지만 필수 dependency/configuration이 아직 없어 operation할 수 없는 상태입니다.", ["publish하지 않습니다.", "startup에 실패시킵니다."]),
      c("initialization gate", "모든 required property와 invariant를 검증한 뒤에만 ready로 전환하는 단계입니다.", ["side effect를 분리합니다.", "failure category를 고정합니다."]),
    ],
    codeExamples: [java("core03-required-gate", "필수 setter 누락을 ready 전에 실패시키는 gate", "Core03RequiredGate.java", "setter 전 initialize 실패와 설정 후 ready/use 성공을 deterministic category로 검증합니다.", String.raw`import java.util.Objects;

public class Core03RequiredGate {
  interface Gateway { String load(); }
  static final class Repository {
    private Gateway gateway;
    private boolean ready;
    private int setterCalls;
    void setGateway(Gateway gateway) {
      if (ready) throw new IllegalStateException("already-ready");
      this.gateway = Objects.requireNonNull(gateway, "gateway");
      setterCalls++;
    }
    void initialize() {
      if (gateway == null) throw new IllegalStateException("CONFIG_MISSING");
      ready = true;
    }
    String query() {
      if (!ready) throw new IllegalStateException("NOT_READY");
      return gateway.load();
    }
  }
  public static void main(String[] args) {
    Repository repository = new Repository();
    String failure;
    try { repository.initialize(); failure = "none"; }
    catch (IllegalStateException expected) { failure = expected.getMessage(); }
    repository.setGateway(() -> "ok");
    repository.initialize();
    System.out.println("prestart=" + failure);
    System.out.println("ready=" + repository.ready);
    System.out.println("result=" + repository.query());
    System.out.println("setter-calls=" + repository.setterCalls);
  }
}`, "prestart=CONFIG_MISSING\nready=true\nresult=ok\nsetter-calls=1", ["spring-di", "spring-lifecycle", "spring-bean-wrapper", "java-objects"])],
    diagnostics: [d("bean은 context에 있지만 readiness 후에도 NOT_READY 또는 partial resource 오류가 납니다.", "initialization callback 전에 instance가 다른 registry/thread에 publish됐거나 setter가 side effect를 시작했습니다.", ["bean lifecycle/post-processors", "publication path", "setter/initialize event order", "resource/thread creation"], "setter는 값 저장·validation만 하고 모든 resource start를 initialization/lifecycle phase로 이동해 ready publication을 원자화합니다.", "event-order recorder와 partial setter/initialize failure test를 둡니다.")],
    expertNotes: ["afterPropertiesSet 같은 callback을 직접 application code에서 호출하지 않고 container lifecycle과 plain factory를 분리합니다.", "state guard는 legacy bridge일 수 있지만 새 domain component의 필수 dependency는 constructor invariant로 옮깁니다."],
  },
  {
    id: "setter-mutability-reconfiguration",
    title: "재설정 가능성과 단순 주입 편의를 구분하고 freeze 또는 generation 교체를 선택합니다",
    lead: "setter가 존재한다고 runtime hot reconfiguration을 자동 지원하는 것은 아니며 collaborator resource, cache와 in-flight operation까지 원자적으로 바꾸는 별도 protocol이 필요합니다.",
    explanations: [
      "configuration stage의 mutable builder와 operational object를 분리할 수 있습니다. 여러 setter로 값을 모은 뒤 validate/freeze하여 immutable snapshot이나 constructor object를 만들어 application에 publish합니다.",
      "같은 값 재호출은 idempotent하게 허용할 수 있지만 다른 값은 reject하거나 new generation을 생성합니다. equality만으로 endpoint credential/resource equivalence를 판단하지 않습니다.",
      "runtime reconfiguration은 prepare new collaborator, health/readiness, atomic route swap, in-flight drain, old close와 rollback 순서를 가집니다. field assignment 한 줄로 완료되지 않습니다.",
      "JMX나 관리 API로 setter를 노출할 때 authorization, audit, validation, rate limit와 rollback을 둡니다. secret-bearing property를 management response나 exception에 반환하지 않습니다.",
      "feature flag처럼 per-call 변하는 결정은 singleton setter로 바꾸기보다 immutable request context나 strategy/provider lookup으로 모델링합니다. global mutation이 tenant/request 사이를 누출하지 않게 합니다.",
    ],
    concepts: [
      c("freeze", "mutable configuration stage를 검증한 뒤 더 이상 변경되지 않는 operational snapshot으로 전환하는 단계입니다.", ["불완전 상태 publication을 막습니다.", "setter를 이후 거부합니다."]),
      c("configuration generation", "동시에 섞이지 않아야 하는 완전한 dependency/config snapshot version입니다.", ["새 generation을 warmup합니다.", "old를 drain합니다."]),
      c("hot reconfiguration", "실행 중 새 configuration/resource를 준비·검증·원자 전환·rollback하는 운영 protocol입니다.", ["setter assignment와 다릅니다.", "in-flight를 처리합니다."]),
    ],
    codeExamples: [java("core03-freeze-configuration", "setter stage를 immutable snapshot으로 freeze", "Core03FreezeConfiguration.java", "두 합성 property를 설정하고 snapshot을 만든 뒤 추가 mutation을 거부합니다.", String.raw`public class Core03FreezeConfiguration {
  record Snapshot(String region, int timeoutMillis) {}
  static final class StagedConfig {
    private String region;
    private int timeoutMillis;
    private boolean frozen;
    private int setterCalls;
    void setRegion(String region) { ensureMutable(); this.region = region; setterCalls++; }
    void setTimeoutMillis(int timeoutMillis) { ensureMutable(); this.timeoutMillis = timeoutMillis; setterCalls++; }
    Snapshot freeze() {
      if (region == null || region.isBlank() || timeoutMillis <= 0) throw new IllegalStateException("invalid-config");
      frozen = true;
      return new Snapshot(region, timeoutMillis);
    }
    private void ensureMutable() { if (frozen) throw new IllegalStateException("frozen"); }
  }
  public static void main(String[] args) {
    StagedConfig config = new StagedConfig();
    config.setRegion("region-a");
    config.setTimeoutMillis(250);
    Snapshot snapshot = config.freeze();
    boolean rejected;
    try { config.setTimeoutMillis(500); rejected = false; }
    catch (IllegalStateException expected) { rejected = true; }
    System.out.println("snapshot=" + snapshot.region() + ":" + snapshot.timeoutMillis());
    System.out.println("setter-calls=" + config.setterCalls);
    System.out.println("frozen=" + config.frozen);
    System.out.println("mutation-rejected=" + rejected);
    System.out.println("snapshot-type=record");
  }
}`, "snapshot=region-a:250\nsetter-calls=2\nfrozen=true\nmutation-rejected=true\nsnapshot-type=record", ["spring-di", "spring-environment", "java-properties", "java-objects"])],
    diagnostics: [d("운영 setter 변경 직후 일부 요청은 old, 일부는 new collaborator와 cache/resource를 섞어 사용합니다.", "field만 overwrite하고 new readiness, in-flight snapshot, old drain/close와 rollback을 설계하지 않았습니다.", ["configuration generation", "request snapshot id", "new/old resource state", "swap/drain event order"], "immutable generation을 먼저 준비·probe하고 atomic route swap 뒤 old in-flight를 drain/close하며 실패 시 route를 되돌립니다.", "concurrent swap fault test와 generation-tagged telemetry를 운영합니다.")],
    expertNotes: ["freeze 후 내부 List/Map이 mutable하면 진짜 immutable snapshot이 아니므로 defensive copy가 필요합니다.", "configuration 값 변경과 credential rotation은 겹칠 수 있지만 발급/revoke/usage-zero까지 포함한 별도 secret lifecycle을 갖습니다."],
  },
  {
    id: "concurrency-safe-publication",
    title: "singleton setter mutation의 가시성·원자성·일관성을 Java Memory Model로 검토합니다",
    lead: "singleton bean을 여러 요청 thread가 읽는 동안 plain field setter로 collaborator를 바꾸면 reference 가시성뿐 아니라 관련 여러 field와 resource state의 일관된 snapshot이 보장되지 않습니다.",
    explanations: [
      "Spring startup이 bean을 완성한 뒤 안전하게 publish하는 정상 경로와 runtime에 임의 setter를 호출하는 경로를 구분합니다. 초기 주입이 끝났다고 이후 mutable field가 자동 thread-safe해지는 것은 아닙니다.",
      "volatile/AtomicReference는 한 reference의 visibility와 atomic swap을 제공할 수 있지만 collaborator 내부 thread safety, 여러 설정 field의 묶음 consistency와 resource lifecycle은 별도입니다.",
      "한 operation은 시작할 때 dependency snapshot을 한 번 읽고 끝까지 사용합니다. 중간에 reference를 다시 읽어 old/new 구현을 한 transaction 안에서 섞지 않습니다.",
      "stateful collaborator를 singleton에 주입하면 request data가 섞일 수 있습니다. stateless/thread-safe contract, request/prototype scope proxy 또는 per-call object creation을 선택합니다.",
      "concurrency test는 barrier로 old/new batch, simultaneous calls, swap failure와 close race를 재현하고 counts, generation과 final resource state를 deterministic하게 assertion합니다.",
    ],
    concepts: [
      c("safe publication", "다른 thread가 객체의 완성된 초기 상태를 올바르게 볼 수 있게 happens-before 관계를 만드는 것입니다.", ["startup과 runtime mutation을 구분합니다.", "내부 thread safety를 보장하지 않습니다."]),
      c("atomic snapshot", "한 operation이 일관되게 사용할 immutable configuration/dependency 묶음을 한 번에 교체하는 방식입니다.", ["AtomicReference를 사용할 수 있습니다.", "lifecycle은 별도입니다."]),
      c("linearization point", "concurrent operation이 old 또는 new generation 중 하나에 속한다고 볼 수 있는 원자적 전환 시점입니다.", ["route swap에 필요합니다.", "telemetry에 generation을 남깁니다."]),
    ],
    codeExamples: [java("core03-atomic-strategy-swap", "concurrent batch 사이 atomic optional strategy 교체", "Core03AtomicSwap.java", "두 concurrent batch가 각각 하나의 immutable strategy generation을 사용하고 원자 교체 뒤 count가 보존됨을 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

public class Core03AtomicSwap {
  interface Policy { String apply(int value); }
  static final class Service {
    final AtomicReference<Policy> policy = new AtomicReference<>(value -> "v1:" + value);
    final AtomicInteger swaps = new AtomicInteger();
    String execute(int value) { Policy snapshot = policy.get(); return snapshot.apply(value); }
    void setPolicy(Policy next) { policy.set(next); swaps.incrementAndGet(); }
  }
  static List<String> batch(Service service, ExecutorService pool, int start) throws Exception {
    List<Future<String>> futures = new ArrayList<>();
    for (int i = start; i < start + 4; i++) { int value = i; futures.add(pool.submit(() -> service.execute(value))); }
    List<String> results = new ArrayList<>();
    for (Future<String> future : futures) results.add(future.get());
    return results;
  }
  public static void main(String[] args) throws Exception {
    Service service = new Service();
    try (ExecutorService pool = Executors.newFixedThreadPool(4)) {
      List<String> first = batch(service, pool, 0);
      service.setPolicy(value -> "v2:" + value);
      List<String> second = batch(service, pool, 4);
      System.out.println("v1=" + first.stream().filter(value -> value.startsWith("v1:")).count());
      System.out.println("v2=" + second.stream().filter(value -> value.startsWith("v2:")).count());
      System.out.println("calls=" + (first.size() + second.size()));
      System.out.println("swaps=" + service.swaps.get());
      System.out.println("mixed=" + (first.stream().anyMatch(value -> value.startsWith("v2:")) || second.stream().anyMatch(value -> value.startsWith("v1:"))));
    }
  }
}`, "v1=4\nv2=4\ncalls=8\nswaps=1\nmixed=false", ["spring-bean-scopes", "spring-object-provider", "java-atomic-reference", "java-executor-service", "java-memory-model"])],
    diagnostics: [d("설정 변경 부하에서 같은 operation이 old/new collaborator를 섞거나 stale reference를 오래 봅니다.", "plain mutable fields를 여러 번 읽고 synchronization/immutable snapshot 없이 runtime setter를 호출했습니다.", ["field volatility/atomicity", "operation snapshot point", "collaborator thread safety", "generation-tagged results"], "immutable dependency bundle을 AtomicReference로 한 번 읽고 교체하되 resource warmup/drain protocol을 추가합니다.", "barrier 기반 swap/close race와 high-concurrency invariant test를 둡니다.")],
    expertNotes: ["AtomicReference 예제는 reference 선택만 다루며 external client close와 in-flight ref counting을 자동 해결하지 않습니다.", "동적 strategy가 필요 없다면 startup 이후 setter를 막고 immutable singleton을 유지하는 것이 더 안전합니다."],
  },
  {
    id: "lifecycle-validation-side-effects",
    title: "setter validation과 resource start를 lifecycle 단계로 분리합니다",
    lead: "setter 안에서 network 연결, thread 시작과 registration을 수행하면 property 순서·재호출·부분 실패가 resource leak와 inconsistent bean을 만들기 때문에 setter는 가볍고 결정적이어야 합니다.",
    explanations: [
      "setter는 null/range/format 같은 local validation과 field 저장까지만 수행합니다. 여러 property 조합 invariant는 initialization callback 또는 factory validation에서 한 번 검사합니다.",
      "resource start는 모든 configuration이 준비된 뒤 lifecycle start에서 수행하고 readiness 성공 후 publish합니다. close/destroy는 started resource만 역순으로 idempotent하게 정리합니다.",
      "initialization 실패 시 이미 만든 temporary resource를 정리하고 bean을 registry에 남기지 않습니다. exception에는 stable category와 logical property만 두고 connection/credential value를 포함하지 않습니다.",
      "prototype/request bean과 singleton resource owner의 destroy semantics가 다릅니다. 누가 close를 호출하는지 scope matrix로 확인하고 setter를 통해 owner가 불명확한 resource를 넘기지 않습니다.",
      "AOP proxy가 적용되기 전 initialization self-call은 advice를 통과하지 않을 수 있습니다. setter/@PostConstruct에서 transactional/retry annotated method를 호출하지 않고 별도 startup collaborator로 분리합니다.",
    ],
    concepts: [
      c("local validation", "한 setter argument 자체의 null·range·format을 외부 side effect 없이 검사하는 단계입니다.", ["조합 validation과 구분합니다.", "결정적이어야 합니다."]),
      c("initialization callback", "property population 후 전체 invariant와 resource 준비를 수행하는 lifecycle 단계입니다.", ["실패하면 publish하지 않습니다.", "cleanup을 보장합니다."]),
      c("idempotent close", "여러 번 호출되거나 partial start 뒤에도 안전하게 남은 resource를 정리하는 종료 contract입니다.", ["started state를 추적합니다.", "예외를 aggregation합니다."]),
    ],
    diagnostics: [d("두 번째 setter에서 실패했는데 첫 setter가 연 connection/thread가 남습니다.", "setter마다 외부 side effect를 시작해 전체 property set의 transaction/cleanup 경계가 없습니다.", ["setter side effects", "initialization event order", "partial resources", "destroy invocation"], "setter는 local state만 저장하고 initialization에서 prepare/start, failure catch에서 reverse cleanup을 수행합니다.", "각 property 단계와 start 단계 failure injection으로 live resource/thread zero를 확인합니다.")],
    expertNotes: ["InitializingBean 구현은 Spring 결합을 만들 수 있어 @Bean factory 또는 plain lifecycle collaborator와 tradeoff를 비교합니다.", "health/readiness probe는 object non-null이 아니라 external resource와 required behavior의 실제 준비 상태를 검증합니다."],
  },
  {
    id: "configuration-secret-boundary",
    title: "문자열 setter를 typed configuration과 secret boundary로 바꿉니다",
    lead: "endpoint·account·credential을 각각 String setter로 노출하면 조합 invariant, source precedence와 redaction이 흩어지고 객체 toString/info method에서 비밀값이 쉽게 유출됩니다.",
    explanations: [
      "원본 DatabaseDev의 세 문자열 property는 setter mechanics를 보여 주지만 production에서는 endpoint reference, account identity와 credential handle을 서로 다른 sensitivity/lifecycle로 분류합니다. 실제 값은 공개 자료에 복사하지 않습니다.",
      "typed immutable configuration record는 required/optional, range, scheme, timeout과 environment/profile constraints를 한 번 검증합니다. 비밀값 자체보다 secret manager reference/provider를 주입하고 사용 시 최소 범위로 가져옵니다.",
      "property source precedence는 file, environment, system, test override와 secret store가 다를 수 있습니다. resolved key/source kind/checksum만 startup evidence로 남기고 resolved value를 log하지 않습니다.",
      "toString, Lombok-generated methods, exception, actuator/config endpoint와 debugger capture를 검토합니다. redaction은 마지막 문자열 치환보다 safe event allow-list와 non-secret view type으로 설계합니다.",
      "credential rotation은 setter overwrite가 아니라 새 credential 발급, dependent pool/client rollout, old revoke와 usage-zero 확인 과정입니다. connection pool generation과 transaction drain을 함께 처리합니다.",
    ],
    concepts: [
      c("typed configuration", "문자열 묶음을 domain-specific type·range·validation·sensitivity로 표현한 immutable 설정입니다.", ["조합 invariant를 검증합니다.", "business bean과 분리합니다."]),
      c("secret reference", "실제 비밀값 대신 승인된 secret store의 항목을 가리키는 opaque handle입니다.", ["값을 log하지 않습니다.", "access/rotation을 분리합니다."]),
      c("property provenance", "최종 configuration key가 어느 source/profile/version에서 해결됐는지 나타내는 lineage입니다.", ["value를 제외합니다.", "drift를 탐지합니다."]),
    ],
    diagnostics: [d("info/toString 또는 context failure log에 database endpoint·account·credential이 노출됩니다.", "raw String properties를 domain bean에 setter 주입하고 자동 serialization/logging과 redaction policy를 검토하지 않았습니다.", ["getters/toString/info methods", "property/error logs", "actuator/debug exports", "secret source/access audit"], "typed non-secret config와 secret provider를 분리하고 safe view/event allow-list로 교체하며 노출 credential을 회전합니다.", "synthetic canary secret로 logs/traces/artifacts zero-leak test를 둡니다.")],
    expertNotes: ["endpoint도 내부 topology를 드러낼 수 있어 공개 가능 정보로 자동 분류하지 않습니다.", "Properties는 convenient container지만 Object key/value와 mutable defaults chain 특성이 있어 typed config로 변환한 뒤 application에 전달합니다."],
  },
  {
    id: "proxy-third-party-and-reinjection",
    title: "setter가 필요한 third-party·proxy 경계와 application component 설계를 구분합니다",
    lead: "외부 class가 setter만 제공하거나 framework proxy가 property configuration을 요구하는 경우가 있어도 새 application service의 필수 dependency까지 setter로 설계할 이유는 아닙니다.",
    explanations: [
      "third-party mutable bean은 composition root의 adapter/factory 안에서 모든 setter를 호출하고 validate한 뒤 좁은 interface로 감쌉니다. 불완전 객체를 application graph에 직접 노출하지 않습니다.",
      "BeanWrapper와 conversion infrastructure는 writable property를 programmatically 설정할 수 있지만 typo/type conversion은 runtime 문제입니다. property descriptor inventory와 negative boot tests를 둡니다.",
      "AOP proxy는 target setter 호출을 intercept할 수 있지만 initialization timing과 self-invocation을 이해해야 합니다. setter advice로 보안·transaction invariant를 숨기지 않습니다.",
      "Spring bean 재주입/reconfiguration을 기대할 때 existing proxy/target identity, singleton caches와 client references가 실제로 바뀌는지 확인합니다. context refresh나 new generation이 더 안전할 수 있습니다.",
      "framework migration에서는 XML property, annotation setter와 @Bean factory가 같은 final object invariant를 만드는지 비교합니다. metadata source 교체와 object design 개선을 한 단계로 섞지 않고 rollback을 작게 유지합니다.",
    ],
    concepts: [
      c("composition adapter", "setter-only third-party object를 완전히 구성·검증한 뒤 application interface로 감싸는 경계입니다.", ["불완전 객체를 숨깁니다.", "lifecycle을 소유합니다."]),
      c("BeanWrapper", "JavaBeans property를 introspect·set하고 type conversion을 지원하는 Spring abstraction입니다.", ["runtime validation이 필요합니다.", "business service locator로 쓰지 않습니다."]),
      c("reinjection", "이미 존재하는 bean/target에 dependency를 다시 설정하는 동작입니다.", ["일반 startup DI와 다릅니다.", "proxy/resource identity를 검토합니다."]),
    ],
    diagnostics: [d("setter-only library를 여러 service가 직접 구성해 property 순서와 lifecycle이 서로 다릅니다.", "third-party construction을 composition root에 격리하지 않고 domain code에 흩뿌렸습니다.", ["new/set call sites", "property/value sources", "initialization/close owner", "adapter contract tests"], "한 factory/adapter가 모든 property, validation, start/close를 소유하고 application에는 immutable interface만 제공합니다.", "architecture test로 third-party concrete type 참조를 composition module에 제한합니다.")],
    expertNotes: ["proxy target을 runtime setter로 바꿔도 proxy advice와 cached method metadata가 기대대로 갱신되는지 지원 문서를 확인합니다.", "legacy XML 제거는 behavior-preserving wiring migration 후 object invariant 개선을 별도 change로 나누면 진단과 rollback이 쉽습니다."],
  },
  {
    id: "setter-testing-failure-injection",
    title: "호출 순서·누락·중복·실패 구현을 plain Java와 context test로 나눠 검증합니다",
    lead: "setter가 있는 class의 happy-path test만 작성하면 누가 언제 setter를 호출하는지, optional absence와 initialization failure가 어떻게 다뤄지는지 확인할 수 없습니다.",
    explanations: [
      "plain Java test는 no setter/default, required missing, one/multiple setter, null, invalid value와 use-before-ready를 빠르게 실행합니다. spy/fake로 setter count와 business collaborator calls를 분리합니다.",
      "context test는 XML property name/type conversion, @Autowired required/optional method, profile/qualifier 후보, post-processor/proxy와 lifecycle order를 실제 Spring 버전에서 검증합니다.",
      "failure implementation은 set 시 실패, initialize 시 실패, first call 실패, timeout과 close 실패를 구분합니다. setter가 exception을 던진 뒤 partial state가 남는지 확인합니다.",
      "concurrency test는 runtime setter를 지원할 때만 실행하고 old/new generation과 in-flight outcome을 deterministic barrier로 고정합니다. 단순 stress loop의 우연한 성공을 증거로 쓰지 않습니다.",
      "test output에는 logical dependency state, calls, categories와 cleanup count만 둡니다. 원본 DatabaseDev의 설정값이나 fake credential을 실제처럼 보이는 문자열로 만들지 않습니다.",
    ],
    concepts: [
      c("interaction spy", "setter/collaborator 호출 수·순서·argument category를 기록하는 test double입니다.", ["실제 값을 log하지 않습니다.", "state assertion과 함께 사용합니다."]),
      c("context contract test", "Spring이 property/candidate/proxy/lifecycle을 실제로 조립한 결과를 검증하는 테스트입니다.", ["unit test를 보완합니다.", "지원 profile matrix를 실행합니다."]),
      c("failure injection", "configuration·initialization·operation·close의 특정 단계에서 의도적 실패를 발생시키는 검증입니다.", ["partial state를 확인합니다.", "cleanup을 assertion합니다."]),
    ],
    diagnostics: [d("unit test는 통과하지만 특정 XML/profile에서 setter가 두 번 또는 전혀 호출되지 않습니다.", "manual happy-path만 검증하고 BeanDefinition merge, property conversion과 autowired post-processor를 실행하지 않았습니다.", ["unit/context test coverage", "bean/property definitions", "setter call recorder", "profile/candidate matrix"], "plain Java state matrix와 실제 Spring context event-order test를 분리해 모두 release gate에 둡니다.", "configuration source 변경마다 property/candidate/lifecycle snapshot을 비교합니다.")],
    expertNotes: ["mock framework 없이 작은 fake/spy로 object contract를 검증한 뒤 Spring TestContext는 wiring evidence에 집중합니다.", "exception message 전문 대신 stable type/category, bean path와 cleanup state를 assertion해 version wording 변화에 덜 취약하게 합니다."],
  },
  {
    id: "constructor-migration-path",
    title: "필수 setter를 constructor invariant로 단계적으로 migration합니다",
    lead: "모든 setter를 한 번에 지우면 XML, manual tests와 reflection framework가 동시에 깨질 수 있으므로 dependency classification과 compatibility adapter를 이용해 작은 단계로 이동합니다.",
    explanations: [
      "먼저 setter call sites와 required/optional/multiple/runtime-config 분류를 inventory합니다. optional default는 유지할 수 있고 required collaborator부터 constructor로 옮깁니다.",
      "새 constructor를 추가하고 composition root를 전환한 뒤 legacy setter/builder adapter가 완전한 constructor object만 만들게 합니다. incomplete adapter build는 fail-fast합니다.",
      "field를 final로 만들고 setter 제거 전에 XML/@Bean/tests/deserialization/serialization references와 proxy requirements를 검색합니다. compile failure는 hidden dependency를 찾는 migration evidence입니다.",
      "old/new graph를 같은 fake와 context corpus로 비교해 result, error, lifecycle와 concurrency가 동일한지 확인합니다. traffic canary에는 graph generation과 legacy path usage를 둡니다.",
      "rollback은 old artifact가 schema/config source와 호환되는지 기록합니다. legacy setter를 무기한 남기지 않고 usage zero, deadline과 removal test를 둡니다.",
    ],
    concepts: [
      c("compatibility builder", "legacy setter-style 호출을 모아 완전한 새 constructor object를 만드는 임시 adapter입니다.", ["incomplete build를 거부합니다.", "제거 deadline을 둡니다."]),
      c("graph migration", "dependency declaration과 composition metadata를 old object graph에서 new invariant graph로 단계적으로 옮기는 변경입니다.", ["behavior corpus를 비교합니다.", "canary/rollback을 둡니다."]),
      c("usage-zero gate", "legacy setter/adapter가 더 이상 호출되지 않음을 telemetry와 test로 확인한 제거 조건입니다.", ["bounded operation id를 씁니다.", "deadline과 owner가 필요합니다."]),
    ],
    codeExamples: [java("core03-constructor-migration", "legacy setter builder에서 constructor object로 이동", "Core03ConstructorMigration.java", "누락 build를 거부하고 legacy builder와 직접 constructor가 같은 결과를 내는지 검증합니다.", String.raw`import java.util.Objects;

public class Core03ConstructorMigration {
  interface Gateway { String call(int value); }
  static final class Service {
    private final Gateway gateway;
    Service(Gateway gateway) { this.gateway = Objects.requireNonNull(gateway, "gateway"); }
    String execute(int value) { return gateway.call(value); }
  }
  static final class LegacyBuilder {
    private Gateway gateway;
    private int setterCalls;
    void setGateway(Gateway gateway) { this.gateway = gateway; setterCalls++; }
    Service build() {
      if (gateway == null) throw new IllegalStateException("missing-gateway");
      return new Service(gateway);
    }
  }
  public static void main(String[] args) {
    boolean rejected;
    try { new LegacyBuilder().build(); rejected = false; }
    catch (IllegalStateException expected) { rejected = true; }
    Gateway fake = value -> "approved:" + value;
    LegacyBuilder legacy = new LegacyBuilder();
    legacy.setGateway(fake);
    String oldPath = legacy.build().execute(7);
    String newPath = new Service(fake).execute(7);
    System.out.println("incomplete-rejected=" + rejected);
    System.out.println("legacy=" + oldPath);
    System.out.println("constructor=" + newPath);
    System.out.println("equal=" + oldPath.equals(newPath));
    System.out.println("legacy-setters=" + legacy.setterCalls);
  }
}`, "incomplete-rejected=true\nlegacy=approved:7\nconstructor=approved:7\nequal=true\nlegacy-setters=1", ["local-member-dao", "spring-di", "spring-testing", "spring-proxying", "java-objects"])],
    diagnostics: [d("constructor migration 후 일부 profile/XML만 old setter를 요구하거나 proxy/call result가 달라집니다.", "call-site/resource inventory와 actual context behavior corpus 없이 signature만 변경했습니다.", ["legacy setter usage", "XML/@Bean/manual construction", "runtime proxy/type", "old/new result/error/lifecycle diff"], "compatibility builder로 composition을 먼저 전환하고 graph generation canary와 usage-zero 후 setter를 제거합니다.", "architecture no-setter rule과 supported profile context matrix를 migration gate에 둡니다.")],
    expertNotes: ["constructor로 옮기는 과정에서 optional runtime-reconfig dependency까지 억지로 고정하지 말고 provider/generation design을 따로 검토합니다.", "compatibility builder가 service locator로 성장하지 않게 target type 하나의 temporary composition concern으로 제한합니다."],
  },
  {
    id: "setter-operation-governance",
    title: "setter 사용을 관측·승인·폐기 가능한 운영 규칙으로 만듭니다",
    lead: "setter injection을 무조건 금지하거나 무분별하게 허용하는 대신 optional default, third-party configuration과 controlled reconfiguration 같은 승인 use case와 증거를 정의해야 합니다.",
    explanations: [
      "architecture rule은 required application collaborator는 constructor, optional은 valid default, third-party setter는 composition adapter, runtime reconfiguration은 explicit generation protocol로 구분합니다.",
      "graph manifest에는 bean logical id, writable properties, required/optional, source kind, setter count/order, frozen/ready state, scope와 implementation type을 둡니다. property value와 secret은 제외합니다.",
      "운영 metric은 configuration generation, default/configured state, rejected mutation, swap success/failure, active old generation과 cleanup outcome을 보여 줍니다. user request 값과 endpoint를 label로 쓰지 않습니다.",
      "incident runbook은 missing setter, duplicate call, partial initialization, stale generation, leaked resource와 secret exposure를 서로 다른 branch로 처리합니다. 단순 context restart가 unknown transaction/resource를 자동 해결하지 않습니다.",
      "Spring/JDK upgrade는 property descriptor, @Autowired optional method, post-processor order, proxy runtime type와 concurrency corpus를 다시 실행합니다. compile 성공과 context refresh 한 번만으로 승인하지 않습니다.",
    ],
    concepts: [
      c("setter policy", "setter use case별 required/default/reconfiguration/lifecycle/test 기준을 정한 architecture 규칙입니다.", ["blanket style rule보다 구체적입니다.", "exception expiry를 둡니다."]),
      c("graph manifest", "bean property edge·scope·state·source·generation을 값 없이 기록한 object graph evidence입니다.", ["secret을 제외합니다.", "old/new diff에 사용합니다."]),
      c("reconfiguration telemetry", "default/configured generation, swap/reject/drain/close outcome을 보여 주는 bounded 관측입니다.", ["raw values를 기록하지 않습니다.", "incident와 연결합니다."]),
    ],
    diagnostics: [d("어떤 bean이 runtime에 재설정됐는지, old resource가 닫혔는지 알 수 없습니다.", "setter invocation을 일반 method call로 취급해 generation, owner, audit와 cleanup evidence가 없습니다.", ["setter/reconfiguration entry points", "graph generation", "active old resources", "audit/cleanup status"], "setter를 configuration-only 또는 explicit reconfiguration service로 제한하고 generation-tagged swap/drain/close evidence를 남깁니다.", "unapproved reflective setter calls를 architecture/runtime audit로 차단합니다.")],
    expertNotes: ["graph manifest의 class name도 내부 구조 정보일 수 있어 공개 site에는 logical example만, 운영 artifact에는 최소 권한으로 둡니다.", "setter 제거율보다 invalid state, incident time-to-diagnose와 safe configuration rollout을 outcome metric으로 봅니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-database-dev", repository: "SPRING/SpringDI", path: "src/main/java/ex03/setter/DatabaseDev.java", usedFor: ["three string configuration properties and six accessor setter/getter progression"], evidence: "read-only scanner로 class, field/accessor 수와 credential-category terms만 확인했으며 endpoint·account·credential 값은 출력하거나 복사하지 않았습니다." },
  { id: "local-member-dao", repository: "SPRING/SpringDI", path: "src/main/java/ex03/setter/MemberDAO.java", usedFor: ["single DatabaseDev setter dependency and info-call progression"], evidence: "read-only scanner로 collaborator field와 setter/method structure만 확인했으며 출력되는 configuration 값은 복사하지 않았습니다." },
  { id: "spring-di", repository: "Spring Framework Reference", path: "Dependency Injection / Setter-based DI", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html", usedFor: ["setter lifecycle, optional guidance and constructor comparison"], evidence: "Spring 공식 dependency injection reference입니다." },
  { id: "spring-autowired", repository: "Spring Framework Reference", path: "Using @Autowired", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html", usedFor: ["setter/config method and optional dependency semantics"], evidence: "Spring 공식 autowiring reference입니다." },
  { id: "spring-autowired-api", repository: "Spring Framework Javadoc", path: "Autowired", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html", usedFor: ["required and multi-argument method contract"], evidence: "Spring 공식 Autowired API입니다." },
  { id: "spring-object-provider", repository: "Spring Framework Javadoc", path: "ObjectProvider", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html", usedFor: ["lazy/optional/provider boundary"], evidence: "Spring 공식 ObjectProvider API입니다." },
  { id: "spring-bean-scopes", repository: "Spring Framework Reference", path: "Bean Scopes", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", usedFor: ["singleton mutability and scoped collaborator boundaries"], evidence: "Spring 공식 bean scopes reference입니다." },
  { id: "spring-lifecycle", repository: "Spring Framework Reference", path: "Customizing the Nature of a Bean", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html", usedFor: ["initialization and destruction callbacks"], evidence: "Spring 공식 bean lifecycle reference입니다." },
  { id: "spring-environment", repository: "Spring Framework Reference", path: "Environment Abstraction", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/environment.html", usedFor: ["property sources, profiles and configuration provenance"], evidence: "Spring 공식 environment reference입니다." },
  { id: "spring-testing", repository: "Spring Framework Reference", path: "Testing", publicUrl: "https://docs.spring.io/spring-framework/reference/testing.html", usedFor: ["context configuration and lifecycle tests"], evidence: "Spring 공식 testing reference입니다." },
  { id: "spring-proxying", repository: "Spring Framework Reference", path: "Proxying Mechanisms", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", usedFor: ["proxy target and initialization/self-invocation boundary"], evidence: "Spring 공식 AOP proxy reference입니다." },
  { id: "spring-bean-wrapper", repository: "Spring Framework Javadoc", path: "BeanWrapper", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/BeanWrapper.html", usedFor: ["programmatic bean property setting"], evidence: "Spring 공식 BeanWrapper API입니다." },
  { id: "java-objects", repository: "Java SE 21 API", path: "Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["null guards and migration examples"], evidence: "Oracle JDK 공식 Objects API입니다." },
  { id: "java-optional", repository: "Java SE 21 API", path: "Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["optional dependency comparison"], evidence: "Oracle JDK 공식 Optional API입니다." },
  { id: "java-atomic-reference", repository: "Java SE 21 API", path: "AtomicReference", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html", usedFor: ["atomic configuration generation example"], evidence: "Oracle JDK 공식 AtomicReference API입니다." },
  { id: "java-executor-service", repository: "Java SE 21 API", path: "ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["concurrent invocation example"], evidence: "Oracle JDK 공식 ExecutorService API입니다." },
  { id: "java-properties", repository: "Java SE 21 API", path: "Properties", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Properties.html", usedFor: ["string configuration container comparison"], evidence: "Oracle JDK 공식 Properties API입니다." },
  { id: "java-memory-model", repository: "Java Language Specification 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["runtime setter visibility and safe publication"], evidence: "Oracle JLS 공식 happens-before specification입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-03-setter-injection", slug: "spring-core-03-setter-injection", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 3,
  title: "setter 주입과 선택 의존성의 비용", subtitle: "property population 문법을 넘어 optional default, invalid state, runtime mutation, concurrency, secret configuration과 constructor migration을 검증합니다.", level: "전문가", estimatedMinutes: 980,
  coreQuestion: "setter 주입이 정말 선택 가능한 dependency를 안전하게 구성하는지, 불완전 상태·재설정·동시성·lifecycle·secret 노출 비용을 어떻게 제한하고 필수 의존성을 constructor로 이동할까요?",
  summary: "SpringDI의 DatabaseDev와 MemberDAO를 read-only 안전 scanner로 확인해 세 문자열 configuration property, 여섯 accessor와 한 collaborator setter 구조만 사용했습니다. 실제 endpoint·account·credential과 info 출력값은 복사하지 않았습니다. setter lifecycle, required/optional/default, temporal coupling, freeze/generation reconfiguration, Java Memory Model과 atomic snapshot, lifecycle validation/resource side effects, typed config/secret boundary, third-party/proxy adapter, failure/context test, constructor migration과 운영 governance까지 초보 개념에서 전문가 설계로 확장합니다. 다섯 JDK 21 examples는 optional default, required initialization gate, immutable freeze, concurrent atomic swap과 compatibility constructor migration을 실제 실행합니다.",
  objectives: ["setter injection의 생성→property population→initialization lifecycle을 설명한다.", "required와 valid-default optional dependency를 구분한다.", "temporal coupling과 invalid intermediate state를 startup에 차단한다.", "configuration-stage mutation을 freeze하고 runtime change를 generation protocol로 설계한다.", "singleton setter mutation의 visibility·atomicity·thread safety를 검증한다.", "setter local validation과 resource lifecycle side effect를 분리한다.", "문자열 endpoint/account/credential을 typed config·secret provider로 전환한다.", "third-party/proxy setter와 application object design을 composition boundary로 격리한다.", "plain/context/failure/concurrency test를 계층화한다.", "required setter를 constructor invariant로 migration하고 usage-zero로 제거한다."],
  prerequisites: [{ title: "생성자 주입과 필수 의존성 불변성", reason: "constructor가 required dependency와 완전한 객체 상태를 어떻게 보장하는지 알아야 setter의 optional/reconfiguration tradeoff를 평가할 수 있습니다.", sessionSlug: "spring-core-02-constructor-injection" }],
  keywords: ["setter injection", "optional dependency", "temporal coupling", "mutable state", "property population", "initialization gate", "reconfiguration", "AtomicReference", "safe publication", "typed configuration", "secret hygiene", "constructor migration"], topics,
  lab: {
    title: "DatabaseDev/MemberDAO setter graph를 안전한 optional·configuration boundary로 재구성",
    scenario: "legacy setter bean이 endpoint/account/credential-like 문자열과 collaborator를 받은 뒤 info/business method를 실행하며 일부 setter는 필수이고 일부는 운영에서 바꾸고 싶어 합니다.",
    setup: ["원본 두 class는 read-only로 보존하고 field/accessor/setter count와 checksum만 기록합니다.", "JDK examples와 지원 Spring/JDK context project, synthetic values와 fake collaborators를 준비합니다.", "dependency/property별 required/optional/default, sensitivity, mutability, scope와 owner matrix를 만듭니다.", "raw configuration 없이 state/category/generation/call/cleanup만 기록하는 telemetry schema를 준비합니다."],
    steps: ["모든 setter call site와 property source를 inventory하고 required/optional/runtime-config를 분류합니다.", "진짜 optional에는 valid no-op/default를 두고 missing/creation failure를 구분합니다.", "required setter는 initialization gate로 fail-fast한 뒤 constructor migration 대상으로 표시합니다.", "setter side effect를 제거하고 전체 configuration validate/freeze와 resource lifecycle을 분리합니다.", "문자열 configuration을 typed non-secret snapshot과 secret provider reference로 바꿉니다.", "runtime reconfiguration은 new generation warmup→atomic swap→old drain/close로 구현합니다.", "plain Java에서 no/multiple/null/failure/use-before-ready를 실행합니다.", "Spring context에서 property conversion, optional method, proxy와 lifecycle order를 readback합니다.", "동시 swap/close와 partial initialization failure에서 resource zero를 검증합니다.", "constructor compatibility canary, legacy usage zero와 rollback 후 setter를 제거합니다."],
    expectedResult: ["optional setter가 없어도 객체는 유효하고 required setter 누락은 traffic 전에 실패합니다.", "다섯 Java examples의 stdout이 완전히 일치합니다.", "runtime change는 request별 일관된 generation을 사용하고 old resource가 drain/close됩니다.", "endpoint·account·credential 값이 source/docs/logs/traces에 새로 노출되지 않습니다.", "old/new constructor graph behavior가 같고 legacy setter usage zero가 증명됩니다."],
    cleanup: ["ephemeral contexts, synthetic configuration, generations와 traces를 run id로 제거합니다.", "temporary secret references, resource clients와 executor를 revoke/close합니다.", "active old generation/resource/thread가 0인지 확인합니다.", "원본 DatabaseDev/MemberDAO 파일은 변경하지 않습니다."],
    extensions: ["JMX 관리 setter를 authorization/audit/rollback이 있는 reconfiguration command로 바꿉니다.", "multi-property AtomicReference snapshot과 ref-counted resource drain을 구현합니다.", "Spring BeanWrapper/property descriptor manifest를 build artifact에서 자동 생성합니다.", "secret rotation과 pool/client generation canary를 통합합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 optional·required·freeze·swap·migration 상태를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "default가 valid한 이유를 설명합니다.", "required setter 누락이 ready 전에 실패함을 확인합니다.", "freeze 후 mutation 거부를 확인합니다.", "두 concurrent batch가 generation을 섞지 않음을 확인합니다.", "legacy builder와 constructor 결과가 같음을 확인합니다."], hints: ["setter가 호출되지 않은 상태도 public object state라는 점부터 적으세요."], expectedOutcome: "setter injection을 단순 문법이 아니라 state/lifecycle/concurrency contract로 설명합니다.", solutionOutline: ["create→populate→validate→freeze/start→operate→reconfigure/close 순서입니다."] },
    { difficulty: "응용", prompt: "원본 setter 구조를 production-safe configuration graph로 migration하세요.", requirements: ["원본 값 없이 provenance를 유지합니다.", "required/optional/default를 분류합니다.", "typed config와 secret provider를 둡니다.", "setter side effect를 lifecycle로 이동합니다.", "freeze와 runtime generation swap을 구분합니다.", "plain/context/failure/concurrency tests를 실행합니다.", "constructor compatibility path와 usage-zero를 둡니다.", "secret-free telemetry/rollback/cleanup을 포함합니다."], hints: ["필수 setter와 운영 중 바꾸려는 setter를 같은 migration으로 처리하지 마세요."], expectedOutcome: "불완전 상태·secret leak·runtime split-brain 없이 constructor/default/generation 경계가 완성됩니다.", solutionOutline: ["audit→classify→contain→freeze/swap→test→canary→remove 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring setter injection·reconfiguration 표준을 작성하세요.", requirements: ["승인 setter use cases를 정의합니다.", "required/optional/default 규칙을 둡니다.", "initialization/side-effect/close lifecycle을 정의합니다.", "scope/thread-safety/safe publication을 검토합니다.", "typed config/secret provenance를 둡니다.", "third-party adapter와 proxy boundary를 정의합니다.", "unit/context/fault/swap tests를 요구합니다.", "constructor migration, generation telemetry와 incident runbook을 포함합니다."], hints: ["'setter 금지'보다 허용 조건과 실패 증거를 구체적으로 적으세요."], expectedOutcome: "object creation부터 hot reconfiguration과 폐기까지 적용 가능한 setter governance가 완성됩니다.", solutionOutline: ["declare→populate→validate→publish→change→drain→migrate 순서입니다."] },
  ],
  nextSessions: ["spring-core-04-interface-strategy"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["DatabaseDev.java는 no-arg 생성 가능한 class, 세 String fields와 여섯 accessors가 확인됐으며 credential-category terms가 있어 실제 값과 method output은 복사하지 않았습니다.", "MemberDAO.java는 한 DatabaseDev collaborator field, setter와 info-style method가 확인됐지만 configuration 출력 내용은 복사하지 않았습니다.", "원본은 optional default, required gate, freeze/reconfiguration, concurrency, typed secret config, lifecycle cleanup과 constructor migration을 포함하지 않아 공식 Spring/JDK 문서와 synthetic examples로 보완했습니다.", "JDK examples는 Spring property population, BeanPostProcessor, AOP proxy와 scope lifecycle을 대체하지 않으므로 지원 version context tests가 필요합니다."] },
});

export default session;
