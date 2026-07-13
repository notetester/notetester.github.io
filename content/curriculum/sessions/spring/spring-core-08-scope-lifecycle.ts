import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "JDK 21 collection·Supplier·concurrency primitives로 BeanDefinition recipe와 scope/lifecycle owner의 최소 실행 모델을 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "singleton/prototype identity, provider lookup, deterministic race, ThreadLocal cleanup, init/destroy 또는 scoped target resolution을 실제 객체로 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "instance id/count, event order, stale context와 cleanup 상태만 출력하며 실제 Spring BeanFactory/web scope/proxy 동작은 integration matrix로 분리합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring jar·web container·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "mini scope model은 Spring singleton cache, prototype destruction gap, web/custom scope와 BeanPostProcessor/proxy 구현을 대체하지 않습니다."] },
    experiments: [
      { change: "동시 threads, context refresh/close, provider 호출 횟수, init failure와 cleanup 누락을 바꿉니다.", prediction: "scope identity와 owner가 명확하면 생성·공유·폐기·누수 evidence가 stable하게 달라집니다.", result: "created/active/destroyed counts, callback events, thread/request context와 residual resources를 비교합니다." },
      { change: "같은 graph를 실제 AnnotationConfigApplicationContext/WebApplicationContext에서 실행합니다.", prediction: "Spring lifecycle callbacks, scoped target/proxy, request activation과 destruction callbacks가 추가됩니다.", result: "BeanDefinition scope, runtime proxy/target identity, callback order와 close/leak evidence를 readback합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "scope-recipe-instance-owner",
    title: "Bean scope를 definition recipe·instance identity·destruction owner의 계약으로 봅니다",
    lead: "scope는 annotation 한 단어가 아니라 언제 같은 객체를 돌려주고 누가 언제 정리하는지를 정의하는 cache와 lifecycle 정책입니다.",
    explanations: [
      "선행 `spring-core-07-java-config`에서는 @Bean factory와 object graph를 만들었습니다. 이번 세션은 같은 BeanDefinition recipe가 lookup 시 어떤 instance identity를 반환하고, callback/resource cleanup을 어느 scope owner가 담당하는지 독립적으로 설명합니다.",
      "Spring BeanFactory의 singleton은 일반 GoF singleton과 달리 container별 bean name/definition에 대해 공유되는 instance입니다. 서로 다른 ApplicationContext, child context 또는 다른 bean name은 같은 class라도 다른 instance를 가질 수 있습니다.",
      "prototype은 매 getBean/create 요청마다 새 instance를 만들지만 container가 초기화 뒤 client에게 넘기면 전체 lifecycle 추적을 중단합니다. 짧은 수명이라는 보장이 아니라 생성 정책이며 destruction ownership을 caller가 가져갑니다.",
      "request/session/application/websocket/custom scopes는 scope별 conversation id와 storage/destruction callback을 가집니다. scope가 active하지 않은 thread에서 target lookup하면 명시적 오류가 나야 합니다.",
      "원본 application-context.xml은 prototype으로 선언된 한 bean과 scope를 생략한 여러 singleton definitions를 보여 줍니다. 실제 class/package/configuration-shaped values는 복사하지 않고 prototype-vs-default progression과 wiring 구조만 provenance로 사용합니다.",
    ],
    concepts: [
      c("bean scope", "BeanDefinition으로 만든 instance의 lookup identity, storage와 destruction boundary를 정하는 정책입니다.", ["singleton/prototype/web/custom 종류가 있습니다.", "container/context 경계를 가집니다."]),
      c("conversation id", "request/session/thread 같은 현재 scoped storage 단위를 식별하는 안정 id입니다.", ["raw user/session token과 분리합니다.", "scope diagnostics에 사용합니다."]),
      c("lifecycle owner", "instance의 init 성공 이후 사용·close/destroy callback과 실패 cleanup을 책임지는 component입니다.", ["scope마다 다릅니다.", "resource leak test를 둡니다."]),
    ],
    diagnostics: [
      d("같은 class인데 테스트/context마다 identity가 다릅니다.", "singleton을 JVM/class 전역 한 개라고 오해하고 context/bean-name 경계를 무시했습니다.", ["ApplicationContext ids/hierarchy", "bean names/aliases", "scope metadata", "runtime target identity"], "container+definition 기준 identity를 문서화하고 필요한 공유는 explicit owner/context hierarchy로 설계합니다.", "multi-context/child-context identity fixture와 graph manifest를 둡니다."),
      d("prototype이 알아서 폐기될 것으로 기대했지만 resource가 남습니다.", "prototype 생성 뒤 container가 destruction을 관리한다고 오해했습니다.", ["scope", "creation/hand-off owner", "destroy callbacks", "open threads/files/connections"], "prototype resource는 caller의 try-with-resources/factory lease가 close하거나 별도 registry owner가 수명 전체를 추적하게 합니다.", "prototype create/use/failure/close parity와 leak scan을 둡니다."),
    ],
    expertNotes: ["scope 선택은 memory 최적화가 아니라 identity·concurrency·ownership semantics의 설계 결정입니다.", "runtime class가 scoped proxy이면 proxy identity와 현재 target identity를 구분해 관측해야 합니다."],
  },
  {
    id: "singleton-identity-startup-context",
    title: "singleton cache·eager/lazy creation·context hierarchy를 구분합니다",
    lead: "singleton은 기본 scope이지만 생성 시점, child context visibility와 refresh failure cleanup까지 알아야 운영에서 한 개라는 말을 증명할 수 있습니다.",
    explanations: [
      "ApplicationContext는 일반적으로 non-lazy singleton을 refresh 중 pre-instantiate해 wiring/init failure를 첫 요청 전에 발견합니다. lazy singleton은 최초 lookup까지 생성이 늦어 startup 성공 뒤 request-time failure가 날 수 있습니다.",
      "BeanFactory singleton cache에는 완전히 초기화된 object와 circular dependency를 위한 early references 같은 내부 단계가 있을 수 있습니다. application은 partially initialized instance를 전역 static에 노출하지 않습니다.",
      "parent context bean은 child에서 보이지만 child bean은 parent에서 보이지 않고 같은 name의 child definition이 parent를 shadow할 수 있습니다. 웹 root/servlet contexts에서 중복 singleton과 resource가 생기지 않게 owner를 정합니다.",
      "context refresh가 중간 실패하면 이미 만들어진 singleton destruction과 external side effects cleanup을 확인합니다. constructor/init에서 global registration/thread 시작을 했다면 callback이 등록되기 전 실패에도 직접 정리해야 합니다.",
      "lazy는 startup latency를 줄이는 만능 knob가 아닙니다. critical bean은 fail-fast와 readiness가 중요하고 optional/heavy bean은 lazy provider·bulkhead와 first-use budget을 함께 설계합니다.",
    ],
    concepts: [
      c("singleton cache", "BeanFactory가 bean name별 공유 instance를 보관하고 lookup에 반환하는 container-local registry입니다.", ["context마다 별도입니다.", "완전 초기화 이후 사용합니다."]),
      c("eager singleton", "context refresh 중 미리 생성·wiring·initialization되는 기본 singleton입니다.", ["configuration failure를 fail-fast합니다.", "startup budget에 포함됩니다."]),
      c("lazy initialization", "최초 lookup/의존 요청까지 bean 생성을 늦추는 정책입니다.", ["실패를 runtime으로 옮길 수 있습니다.", "first-use latency를 측정합니다."]),
    ],
    codeExamples: [java("core08-scope-identity", "singleton과 prototype identity registry", "Core08ScopeIdentity.java", "동일 definition의 singleton lookup은 같은 id, prototype lookup은 새 id를 반환하는 최소 container를 실행합니다.", String.raw`import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

public class Core08ScopeIdentity {
  enum Scope { SINGLETON, PROTOTYPE }
  record Definition(Scope scope, Supplier<Bean> factory) {}
  record Bean(int id) {}
  static final class Container {
    final AtomicInteger ids = new AtomicInteger();
    final Map<String, Definition> definitions = new HashMap<>();
    final Map<String, Bean> singletons = new HashMap<>();
    void register(String name, Scope scope) {
      definitions.put(name, new Definition(scope, () -> new Bean(ids.incrementAndGet())));
    }
    Bean get(String name) {
      Definition definition = Objects.requireNonNull(definitions.get(name));
      return definition.scope() == Scope.SINGLETON
          ? singletons.computeIfAbsent(name, key -> definition.factory().get())
          : definition.factory().get();
    }
  }
  public static void main(String[] args) {
    Container container = new Container();
    container.register("catalog", Scope.SINGLETON);
    container.register("task", Scope.PROTOTYPE);
    Bean s1 = container.get("catalog");
    Bean s2 = container.get("catalog");
    Bean p1 = container.get("task");
    Bean p2 = container.get("task");
    System.out.println("singleton-ids=" + s1.id() + "," + s2.id());
    System.out.println("singleton-same=" + (s1 == s2));
    System.out.println("prototype-ids=" + p1.id() + "," + p2.id());
    System.out.println("prototype-same=" + (p1 == p2));
    System.out.println("created=" + container.ids.get());
  }
}`, "singleton-ids=1,1\nsingleton-same=true\nprototype-ids=2,3\nprototype-same=false\ncreated=3", ["local-application-context", "spring-scopes", "spring-bean-factory", "spring-configurable-bean-factory"] )],
    diagnostics: [
      d("startup은 성공했지만 첫 요청이 lazy bean init 오류로 실패합니다.", "critical dependency를 lazy로 미뤄 readiness/first-use test가 없습니다.", ["BeanDefinition lazy flag", "creation/init event", "readiness dependencies", "first-use latency/error"], "critical graph는 eager fail-fast하거나 readiness warmup에서 생성·검증하고 rollback budget을 둡니다.", "cold first request와 init failure deployment tests를 둡니다."),
      d("root와 servlet context에 같은 pool/client가 두 개 생깁니다.", "context hierarchy 양쪽에서 infrastructure definition/component scan이 중복됐습니다.", ["definition sources by context", "bean names/runtime ids", "component scan roots", "threads/connections"], "shared infrastructure는 root owner에 한 번 등록하고 child는 참조하며 duplicate definitions를 startup에 실패시킵니다.", "hierarchy graph/instance count와 shutdown close-count tests를 둡니다."),
    ],
    expertNotes: ["lazy와 prototype은 서로 독립 축이며 lazy prototype이라는 표현은 lookup 자체가 생성 시점이므로 소비 경로를 분석해야 합니다.", "singleton early reference/circular resolution에 기대는 graph보다 constructor DAG와 explicit provider가 더 안전합니다."],
  },
  {
    id: "singleton-thread-safety-state",
    title: "singleton 공유 identity와 thread safety를 분리합니다",
    lead: "Spring이 한 instance만 만든다는 사실은 그 객체의 mutable fields가 여러 요청에서 안전하다는 뜻이 아닙니다.",
    explanations: [
      "웹 application singleton service/controller/repository는 여러 request threads가 동시에 호출합니다. request별 parameter, current user, accumulator와 temporary buffer를 instance field에 저장하지 않고 method local/immutable command로 전달합니다.",
      "읽기 전용 immutable configuration과 thread-safe collaborators를 final fields로 주입하면 singleton이 natural fit입니다. mutable cache/counter는 concurrent collection/atomic/lock과 compound invariant를 명시합니다.",
      "volatile은 visibility/order를 제공하지만 read-modify-write를 원자화하지 않습니다. `count++`, check-then-act와 여러 fields invariant는 Atomic/lock/actor/DB transaction 등 적절한 serialization을 사용합니다.",
      "thread confinement에 기대면 async handoff, scheduler, virtual thread/reactive execution에서 깨질 수 있습니다. 값의 ownership을 explicit context parameter로 전달하고 concurrency model을 문서화합니다.",
      "race test는 확률적 sleep에 의존하지 않고 barrier/latch로 interleaving을 제어합니다. unsafe 구현이 항상 실패하고 safe 구현이 반복 통과하도록 final state와 intermediate events를 assert합니다.",
    ],
    concepts: [
      c("thread safety", "여러 threads가 동시에 호출해도 memory visibility, invariants와 결과가 정의된 concurrency contract를 지키는 성질입니다.", ["scope와 별도입니다.", "공유 mutable state를 분석합니다."]),
      c("request state", "한 요청/작업에만 속하고 다른 호출과 공유되면 안 되는 값입니다.", ["method parameter/local에 둡니다.", "request scope를 필요할 때 사용합니다."]),
      c("compound action", "read-check-update처럼 여러 memory operations가 하나의 원자적 의미를 가져야 하는 동작입니다.", ["volatile 하나로 해결되지 않습니다.", "lock/atomic abstraction을 사용합니다."]),
    ],
    codeExamples: [java("core08-thread-safety", "결정적 lost update와 AtomicInteger 비교", "Core08ThreadSafety.java", "barrier로 두 threads가 같은 snapshot을 읽게 해 unsafe singleton의 lost update를 재현하고 atomic counter와 비교합니다.", String.raw`import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Core08ThreadSafety {
  static final class UnsafeCounter {
    int value;
    final CyclicBarrier barrier = new CyclicBarrier(2);
    void increment() {
      int snapshot = value;
      try { barrier.await(); }
      catch (Exception e) { throw new RuntimeException(e); }
      value = snapshot + 1;
    }
  }
  public static void main(String[] args) throws Exception {
    UnsafeCounter unsafe = new UnsafeCounter();
    AtomicInteger safe = new AtomicInteger();
    try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
      Future<?> a = pool.submit(() -> { unsafe.increment(); safe.incrementAndGet(); });
      Future<?> b = pool.submit(() -> { unsafe.increment(); safe.incrementAndGet(); });
      a.get();
      b.get();
    }
    System.out.println("attempts=2");
    System.out.println("unsafe-final=" + unsafe.value);
    System.out.println("lost-updates=" + (2 - unsafe.value));
    System.out.println("atomic-final=" + safe.get());
    System.out.println("singleton-does-not-imply-thread-safe=true");
  }
}`, "attempts=2\nunsafe-final=1\nlost-updates=1\natomic-final=2\nsingleton-does-not-imply-thread-safe=true", ["spring-scopes", "java-thread-local"] )],
    diagnostics: [
      d("사용자/검색 조건이 다른 요청 결과에 섞입니다.", "singleton bean field에 request-specific mutable state를 저장했습니다.", ["mutable instance fields", "setter/use sites", "concurrent request ids", "async callbacks"], "request state를 immutable method arguments/locals로 이동하고 필요한 context는 scoped provider로 resolve합니다.", "barrier-based cross-request contamination test와 stateless architecture rule을 둡니다."),
      d("volatile counter가 부하에서 누락됩니다.", "read-modify-write compound action을 visibility만으로 해결했습니다.", ["bytecode/operation sequence", "atomicity requirements", "interleaving", "final vs expected count"], "AtomicInteger.incrementAndGet, lock 또는 external atomic store로 전체 invariant를 원자화합니다.", "deterministic interleaving과 high-contention invariant tests를 둡니다."),
    ],
    expertNotes: ["stateless singleton은 state가 전혀 없다는 뜻이 아니라 immutable dependencies만 보유하고 per-call state를 공유하지 않는다는 뜻입니다.", "Atomic types도 여러 variables 간 invariant와 check-then-act를 자동 보호하지 않습니다."],
  },
  {
    id: "prototype-lookup-destruction-owner",
    title: "prototype의 매 lookup 생성과 destruction gap을 caller ownership으로 해결합니다",
    lead: "prototype은 새 객체를 주지만 singleton에 한 번 주입하면 그 한 instance만 계속 쓰며, container close도 prototype destroy를 자동 호출하지 않습니다.",
    explanations: [
      "singleton constructor에 prototype을 직접 주입하면 singleton 생성 시점에 prototype 한 개가 resolve되어 field에 고정됩니다. 호출마다 새 instance가 필요하면 ObjectProvider, Provider, lookup method 또는 scoped proxy를 사용합니다.",
      "ObjectProvider.getObject는 필요 시 target을 resolve하고 getIfAvailable/getIfUnique/stream 같은 optional/multiple semantics를 가집니다. business code가 bean name service locator가 되지 않도록 typed narrow provider를 주입합니다.",
      "prototype이 file/socket/client/thread 같은 resource를 열면 consumer는 AutoCloseable lease로 즉시 닫거나 custom destruction registry가 active instances를 추적해야 합니다. @PreDestroy/destroyMethod만 기대하지 않습니다.",
      "생성 중 init이 실패한 prototype은 container handoff 전이므로 constructor/factory/init path가 이미 연 external resource를 정리해야 합니다. partially initialized object를 provider cache에 넣지 않습니다.",
      "prototype 남용은 allocation/GC와 hidden resource churn을 키웁니다. immutable cheap value object는 Spring bean일 필요가 없고 expensive client는 bounded pool/explicit factory lease가 더 적절할 수 있습니다.",
    ],
    concepts: [
      c("prototype scope", "container의 각 explicit creation/lookup 요청에 새 bean instance를 만드는 scope입니다.", ["자동 destroy 관리가 제한됩니다.", "injection 시점과 lookup을 구분합니다."]),
      c("ObjectProvider", "container가 typed dependency를 지연/optional/반복 resolve하게 하는 Spring provider abstraction입니다.", ["호출마다 lookup할 수 있습니다.", "service locator 범위를 제한합니다."]),
      c("destruction gap", "prototype handoff 뒤 container가 instance 수명과 destroy callback을 끝까지 추적하지 않는 lifecycle 공백입니다.", ["caller가 close합니다.", "custom registry를 둘 수 있습니다."]),
    ],
    codeExamples: [java("core08-prototype-provider", "singleton에서 prototype provider 사용", "Core08PrototypeProvider.java", "직접 주입된 work unit은 재사용되고 Supplier provider는 호출마다 새 unit을 만드는 identity 차이를 실행합니다.", String.raw`import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

public class Core08PrototypeProvider {
  record WorkUnit(int id) {}
  static final class DirectClient {
    final WorkUnit unit;
    DirectClient(WorkUnit unit) { this.unit = unit; }
    int call() { return unit.id(); }
  }
  static final class ProviderClient {
    final Supplier<WorkUnit> provider;
    ProviderClient(Supplier<WorkUnit> provider) { this.provider = provider; }
    int call() { return provider.get().id(); }
  }
  public static void main(String[] args) {
    AtomicInteger ids = new AtomicInteger();
    Supplier<WorkUnit> provider = () -> new WorkUnit(ids.incrementAndGet());
    DirectClient direct = new DirectClient(provider.get());
    ProviderClient dynamic = new ProviderClient(provider);
    System.out.println("direct=" + direct.call() + "," + direct.call());
    System.out.println("provider=" + dynamic.call() + "," + dynamic.call());
    System.out.println("created=" + ids.get());
    System.out.println("provider-per-call=true");
  }
}`, "direct=1,1\nprovider=2,3\ncreated=3\nprovider-per-call=true", ["spring-scopes", "spring-object-provider", "java-autocloseable"] )],
    diagnostics: [
      d("prototype을 선언했는데 singleton service에서 매번 같은 객체입니다.", "prototype을 provider가 아니라 singleton constructor에 직접 한 번 주입했습니다.", ["injection point/runtime identity", "provider/scoped proxy presence", "lookup timing", "singleton creation event"], "호출별 identity가 요구되면 typed ObjectProvider/factory로 resolve하고 owner가 close합니다.", "반복 호출 identity/count와 destroy parity tests를 둡니다."),
      d("prototype 생성량과 file/socket/thread가 계속 증가합니다.", "호출별 생성만 하고 caller close/destruction registry가 없습니다.", ["created vs closed counts", "active resources", "exception/cancel paths", "provider consumers"], "AutoCloseable lease+try-with-resources 또는 bounded pool/registry owner를 적용합니다.", "success/failure/cancel/timeouts의 created=closed invariant와 leak scanner를 둡니다."),
    ],
    expertNotes: ["provider는 scope mismatch를 해결하지만 호출 지점에서 lifecycle/latency/failure가 새로 발생함을 API에 드러내야 합니다.", "prototype이 항상 thread-safe한 것은 아니며 같은 prototype reference를 여러 threads에 넘기면 다시 공유됩니다."],
  },
  {
    id: "request-session-application-scopes",
    title: "request·session·application·websocket scope와 async 경계를 구분합니다",
    lead: "웹 scope는 HTTP/conversation lifecycle에 묶이므로 singleton dependency graph에 직접 넣을 때 proxy/provider와 context propagation이 필요합니다.",
    explanations: [
      "request scope는 한 HTTP request, session scope는 HTTP session, application scope는 ServletContext, websocket scope는 WebSocket session 단위 identity를 제공합니다. Spring singleton과 ServletContext attribute singleton은 경계가 다릅니다.",
      "web-aware ApplicationContext와 RequestContextListener/Filter/DispatcherServlet 등 request binding infrastructure가 있어야 web scope가 active합니다. CLI/background thread에서 lookup하면 scope-not-active 오류가 정상입니다.",
      "singleton이 request bean을 참조하려면 scoped proxy 또는 ObjectProvider로 현재 request target을 늦게 resolve합니다. proxy 자체는 singleton처럼 공유될 수 있지만 method 호출 target은 conversation마다 달라집니다.",
      "async servlet/task executor로 thread가 바뀌면 request attributes/security/MDC를 자동 복사한다고 가정하지 않습니다. 필요한 immutable context만 명시적으로 전달하고 request 종료 뒤 target 접근을 금지합니다.",
      "session bean은 메모리와 직렬화/cluster failover, concurrent tabs/requests와 logout destruction을 고려합니다. 큰 mutable object/connection을 session에 저장하지 않고 stable small state 또는 external store를 사용합니다.",
    ],
    concepts: [
      c("request scope", "하나의 HTTP request 안에서 같은 instance를 제공하고 종료 시 destruction callback을 실행하는 web scope입니다.", ["active request context가 필요합니다.", "async 수명을 주의합니다."]),
      c("session scope", "하나의 HTTP session conversation에 instance를 저장하는 web scope입니다.", ["동시 requests가 공유할 수 있습니다.", "memory/serialization/destruction을 설계합니다."]),
      c("scoped target", "현재 active conversation에서 proxy/provider가 resolve하는 실제 short-lived bean instance입니다.", ["proxy identity와 다릅니다.", "scope 종료 뒤 사용하지 않습니다."]),
    ],
    diagnostics: [
      d("background/scheduled task에서 request bean lookup이 실패합니다.", "HTTP request scope가 없는 thread에서 web-scoped target을 요구했습니다.", ["thread/task entry", "request attributes active", "provider call stack", "required context fields"], "web bean 자체를 넘기지 말고 필요한 immutable command/context를 task enqueue 시 복사합니다.", "request/non-request entry tests와 scope-not-active expected failure를 둡니다."),
      d("session scope인데 동시 탭 요청에서 field가 깨집니다.", "session instance가 여러 request threads에 공유되지만 thread safety를 고려하지 않았습니다.", ["session bean mutable fields", "concurrent requests", "serialization/replication", "logout/timeout callbacks"], "session state를 immutable/external atomic store로 이동하고 필요한 mutation을 synchronize/version합니다.", "same-session parallel request and timeout/logout cleanup tests를 둡니다."),
    ],
    expertNotes: ["request scoped bean은 request context를 편리하게 감쌀 뿐 domain API에 ambient context 의존을 퍼뜨리지 않게 합니다.", "reactive context는 ThreadLocal/web servlet request scope와 다른 모델이므로 별도 공식 integration을 사용해야 합니다."],
  },
  {
    id: "thread-scope-threadlocal-cleanup",
    title: "thread scope와 ThreadLocal을 executor 재사용·cleanup 관점에서 다룹니다",
    lead: "thread별 한 객체는 request별 한 객체가 아니며 pool thread가 재사용되면 이전 작업 context가 다음 사용자에게 누출될 수 있습니다.",
    explanations: [
      "SimpleThreadScope는 각 thread에 instance를 저장하지만 기본 등록되지 않으며 공식 Javadoc이 destruction callback 미지원 caveat를 갖습니다. custom registration 전에 conversation/cleanup 요구를 검토합니다.",
      "ThreadLocal 값은 thread가 살아 있고 reference가 남는 동안 유지될 수 있습니다. try/finally에서 remove하고 nested binding은 이전 값을 restore하는 lexical scope wrapper를 사용합니다.",
      "fixed pool에서 worker thread는 많은 requests/tasks를 순차 처리하므로 cleanup 누락은 stale tenant/user/request id와 memory leak을 만듭니다. task decorator/wrapper가 set→run→finally restore/remove를 보장합니다.",
      "InheritableThreadLocal은 thread creation 시점 복사 semantics이므로 executor pool의 per-task context propagation 해결책이 아닙니다. virtual threads도 context ownership과 lifetime을 명시해야 합니다.",
      "필수 business context는 method parameter/immutable command에 넣고 ThreadLocal은 tracing/security integration처럼 bounded infrastructure edge에 제한합니다. 값/toString을 debug log에 raw 출력하지 않습니다.",
    ],
    concepts: [
      c("thread scope", "현재 thread identity에 instance를 연결하는 custom scope입니다.", ["request scope와 다릅니다.", "thread pool cleanup을 설계합니다."]),
      c("ThreadLocal", "각 thread가 독립적으로 접근하는 값 slot을 제공하는 JDK abstraction입니다.", ["remove가 필요합니다.", "task propagation은 자동이 아닙니다."]),
      c("context leak", "끝난 작업의 tenant/user/request/resource 값이 재사용 thread나 후속 task에 남는 누출입니다.", ["보안/정확성 문제입니다.", "finally cleanup을 검증합니다."]),
    ],
    codeExamples: [java("core08-threadlocal-cleanup", "pool thread의 stale context와 remove", "Core08ThreadLocalCleanup.java", "단일 worker executor에서 cleanup 없는 값이 다음 task에 보이고 remove 뒤에는 사라지는 경로를 결정적으로 실행합니다.", String.raw`import java.util.concurrent.*;

public class Core08ThreadLocalCleanup {
  static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();
  public static void main(String[] args) throws Exception {
    try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
      executor.submit(() -> CONTEXT.set("request-A")).get();
      String leaked = executor.submit(CONTEXT::get).get();
      executor.submit(CONTEXT::remove).get();
      String clean = executor.submit(CONTEXT::get).get();
      String lexical = executor.submit(() -> {
        try {
          CONTEXT.set("request-B");
          return CONTEXT.get();
        } finally {
          CONTEXT.remove();
        }
      }).get();
      String after = executor.submit(CONTEXT::get).get();
      System.out.println("without-cleanup=" + leaked);
      System.out.println("after-remove=" + clean);
      System.out.println("lexical-value=" + lexical);
      System.out.println("after-finally=" + after);
    }
  }
}`, "without-cleanup=request-A\nafter-remove=null\nlexical-value=request-B\nafter-finally=null", ["spring-simple-thread-scope", "java-thread-local"] )],
    diagnostics: [
      d("다음 request log/권한에 이전 사용자 context가 나타납니다.", "executor worker ThreadLocal을 task 종료 후 remove/restore하지 않았습니다.", ["worker thread id", "set/get/remove paths", "task decorator", "exception/cancel branches"], "set→delegate→finally restore/remove wrapper를 중앙화하고 business context는 explicit parameter로 전달합니다.", "single-thread sequential cross-tenant test와 exception/cancel cleanup test를 둡니다."),
      d("thread-scoped bean의 resource가 shutdown까지 닫히지 않습니다.", "SimpleThreadScope destruction callback caveat와 pool thread lifetime을 무시했습니다.", ["scope implementation", "destruction callback support", "worker lifetime", "active resource registry"], "destruction-aware custom scope/explicit task lease를 사용하거나 resource를 thread scope에 두지 않습니다.", "pool reuse/shutdown에서 created=closed와 callback invocation tests를 둡니다."),
    ],
    expertNotes: ["ThreadLocal remove는 같은 worker에서 수행해야 하므로 submit한 caller thread에서 지워도 효과가 없습니다.", "context propagation library를 써도 허용 fields, capture timing, cleanup과 async cancellation을 contract로 검증해야 합니다."],
  },
  {
    id: "init-callback-order-readiness",
    title: "constructor→dependency injection→post-processing→init callback 순서를 readiness와 연결합니다",
    lead: "bean이 만들어졌다는 것과 외부 요청을 받을 준비가 됐다는 것은 다르며 여러 init callback을 섞으면 순서와 실패 ownership이 흐려집니다.",
    explanations: [
      "Spring lifecycle은 instance 생성, dependency population, aware callbacks, BeanPostProcessor before, @PostConstruct/InitializingBean/custom init 계열, BeanPostProcessor after/proxy 노출의 큰 흐름으로 이해합니다. 정확한 callback order는 현재 공식 reference와 실제 context test로 확인합니다.",
      "@PostConstruct 또는 @Bean initMethod/custom method는 business class의 Spring coupling을 줄일 수 있고 InitializingBean.afterPropertiesSet은 framework interface 결합을 만듭니다. 여러 mechanisms을 한 bean에 중복 사용하지 않습니다.",
      "constructor는 값의 local invariant만 확인하고 remote DB/network readiness에 장시간 block하지 않습니다. external dependency warmup은 bounded timeout, retry/admission과 application readiness lifecycle에서 관리합니다.",
      "init callback이 thread/pool/client를 시작한 뒤 다음 단계에서 실패하면 이미 열린 resource를 즉시 닫아야 합니다. destroy callback 등록만 믿지 말고 local try/finally/partial-state cleanup을 둡니다.",
      "init 성공 evidence에는 bean name/type, phase, duration, stable category와 non-secret configuration presence/version만 둡니다. endpoint/credential/bean toString을 기록하지 않습니다.",
    ],
    concepts: [
      c("initialization callback", "dependency 주입 뒤 bean이 invariant/resource 준비를 완료하도록 container가 호출하는 lifecycle method입니다.", ["@PostConstruct/initMethod/InitializingBean가 있습니다.", "실패 시 refresh를 중단할 수 있습니다."]),
      c("readiness", "application이 실제 traffic/use case를 안전하게 처리할 준비가 됐는지 나타내는 운영 상태입니다.", ["constructor 성공과 다릅니다.", "external dependency를 포함합니다."]),
      c("partial initialization", "init 단계 일부 resource/side effect는 성공했지만 이후 단계가 실패한 상태입니다.", ["즉시 cleanup합니다.", "객체를 publish하지 않습니다."]),
    ],
    diagnostics: [
      d("같은 bean init logic이 두 번 실행됩니다.", "@PostConstruct, afterPropertiesSet와 custom initMethod에 중복 side effect를 두었습니다.", ["all callback declarations", "event trace/count", "BeanPostProcessors", "context refresh/retry"], "하나의 idempotent init owner로 통합하고 callback count=1을 검증합니다.", "callback order/count snapshot과 refresh failure retry tests를 둡니다."),
      d("init 실패 뒤 background thread/socket이 남습니다.", "resource start 후 callback completion 전에 실패해 normal destroy path에 등록되지 않았습니다.", ["resource creation timeline", "failure point", "destroy registration", "live threads/descriptors"], "init local variables를 try/finally로 닫고 성공한 후에만 field/published state로 commit합니다.", "각 init line 뒤 fault injection과 zero-residual-resource assertion을 둡니다."),
    ],
    expertNotes: ["init method는 transaction처럼 prepare→validate→publish 단계를 나누면 partial failure cleanup이 쉬워집니다.", "context refresh thread를 무기한 block하는 readiness probe보다 bounded boot+explicit readiness state가 운영에 유리합니다."],
  },
  {
    id: "destroy-order-shutdown-partial-failure",
    title: "destroy callback·역순 의존 정리·graceful shutdown을 검증합니다",
    lead: "shutdown은 best-effort 한 메서드 호출이 아니라 traffic drain, in-flight completion, dependency 역순 close와 timeout/force 정책입니다.",
    explanations: [
      "singleton destruction은 context close에서 @PreDestroy/DisposableBean/custom destroyMethod 등의 계약으로 실행됩니다. prototype과 일부 custom/thread scopes는 자동 destruction이 다르므로 scope별 표가 필요합니다.",
      "consumer가 provider보다 먼저 닫혀야 하므로 dependency graph의 역순으로 cleanup합니다. executor task를 drain한 뒤 client/pool을 닫고 마지막에 underlying connection/resource를 종료합니다.",
      "destroy callback은 exception 하나로 나머지 cleanup이 건너뛰지 않게 각 resource close를 독립적으로 시도하고 failures를 aggregate합니다. secret/PII 없이 resource type/count/category를 기록합니다.",
      "SIGTERM/container stop에서는 readiness false→traffic drain→in-flight deadline→context close→resource absence readback 순서를 둡니다. grace period를 넘으면 어떤 작업이 중단/재처리되는지 명시합니다.",
      "JVM crash/kill -9에는 destroy callback이 실행되지 않습니다. correctness가 in-process close에만 의존하지 않게 DB transactions/leases/idempotency와 external resource TTL을 설계합니다.",
    ],
    concepts: [
      c("destruction callback", "scope/container 종료 때 bean resource를 정리하도록 호출되는 lifecycle method입니다.", ["@PreDestroy/destroyMethod/DisposableBean가 있습니다.", "scope별 보장을 확인합니다."]),
      c("reverse dependency order", "consumer/dependent를 먼저, 그 provider/resource를 나중에 닫는 cleanup 순서입니다.", ["in-flight 사용을 막습니다.", "graph로 검증합니다."]),
      c("graceful shutdown", "새 traffic 차단, 진행 중 작업 완료와 bounded resource close를 수행하는 종료 protocol입니다.", ["deadline/force policy를 둡니다.", "readiness와 연결합니다."]),
    ],
    codeExamples: [java("core08-lifecycle-events", "init failure와 역순 cleanup", "Core08LifecycleEvents.java", "두 resources를 순서대로 init하다 두 번째에서 실패하면 첫 번째만 즉시 역순 close되는 event contract를 실행합니다.", String.raw`import java.util.*;

public class Core08LifecycleEvents {
  static final class Resource implements AutoCloseable {
    final String name;
    final List<String> events;
    boolean initialized;
    Resource(String name, List<String> events) { this.name = name; this.events = events; }
    void init(boolean fail) {
      events.add("init:" + name);
      if (fail) throw new IllegalStateException("init-failed:" + name);
      initialized = true;
    }
    public void close() {
      if (initialized) {
        events.add("destroy:" + name);
        initialized = false;
      }
    }
  }
  public static void main(String[] args) {
    List<String> events = new ArrayList<>();
    Resource first = new Resource("client", events);
    Resource second = new Resource("worker", events);
    List<Resource> completed = new ArrayList<>();
    try {
      first.init(false); completed.add(first);
      second.init(true); completed.add(second);
    } catch (IllegalStateException failure) {
      events.add("failure:" + failure.getMessage());
      Collections.reverse(completed);
      completed.forEach(Resource::close);
    }
    System.out.println("events=" + events);
    System.out.println("client-active=" + first.initialized);
    System.out.println("worker-active=" + second.initialized);
    System.out.println("residual-resources=0");
  }
}`, "events=[init:client, init:worker, failure:init-failed:worker, destroy:client]\nclient-active=false\nworker-active=false\nresidual-resources=0", ["spring-bean-nature", "spring-initializing-bean", "spring-disposable-bean", "java-autocloseable"] )],
    diagnostics: [
      d("배포 종료 중 connection reset과 partial writes가 늘어납니다.", "traffic/in-flight drain 전에 context/pool을 즉시 닫았습니다.", ["readiness transition", "in-flight counts/deadline", "destroy event order", "transaction/connection errors"], "readiness off→drain→bounded completion→reverse close 순서를 적용하고 orchestration grace를 맞춥니다.", "SIGTERM load test와 in-flight outcome/retry reconciliation을 둡니다."),
      d("첫 destroy exception 뒤 다른 resources가 남습니다.", "cleanup loop가 fail-fast해 후속 close를 실행하지 않았습니다.", ["callback events", "suppressed/aggregate errors", "remaining threads/descriptors", "close idempotency"], "모든 close를 시도해 exceptions를 aggregate하고 최종 residual scan을 실행합니다.", "각 close failure injection과 remaining=0/known-escalation test를 둡니다."),
    ],
    expertNotes: ["destroy callback의 호출 여부와 실제 external resource가 해제됐는지는 별도 readback으로 증명합니다.", "shutdown deadline은 처리량/SLA와 재처리 semantics에 맞춰 측정하고 arbitrary fixed sleep을 피합니다."],
  },
  {
    id: "scoped-proxy-target-resolution",
    title: "scoped proxy의 공유 facade와 현재 target identity를 분리합니다",
    lead: "singleton에 request/prototype dependency를 주입할 때 proxy는 injection identity를 고정하고 호출 때 현재 scope target을 찾습니다.",
    explanations: [
      "scoped proxy는 target bean definition을 scoped target으로 두고 singleton-like proxy를 injection합니다. proxy method invocation이 현재 request/session/custom scope에서 실제 target을 resolve합니다.",
      "ScopedProxyMode.INTERFACES는 interface-based proxy, TARGET_CLASS는 class-based proxy를 요청합니다. final class/method, visibility, constructor/module/AOT와 type-based injection 제약을 actual runtime에서 검증합니다.",
      "proxy equals/hashCode/toString, serialization과 concrete class checks를 business logic에 사용하지 않습니다. target identity가 대화마다 달라지므로 cache key/collection membership을 stable domain id로 처리합니다.",
      "scope가 inactive하면 proxy injection 자체는 성공해도 method 호출에서 failure가 납니다. scheduled/background code가 proxy를 우연히 호출하지 않도록 API boundary와 expected failure tests를 둡니다.",
      "proxy/provider 중 provider는 lookup이 code에 명시되고 optional/multiple semantics에 유리하며 proxy는 collaborator interface를 자연스럽게 유지합니다. lifecycle, observability와 testability를 기준으로 선택합니다.",
    ],
    concepts: [
      c("scoped proxy", "긴 수명 consumer에 주입되어 호출마다 현재 short-lived scoped target으로 위임하는 proxy입니다.", ["proxy와 target identity가 다릅니다.", "active scope가 필요합니다."]),
      c("ScopedProxyMode", "scoped bean proxy를 NONE, INTERFACES, TARGET_CLASS 등으로 선택하는 annotation enum입니다.", ["type/final constraints가 다릅니다.", "runtime type을 검증합니다."]),
      c("target resolution", "proxy/provider가 현재 conversation storage에서 실제 bean instance를 찾아 method를 실행하는 과정입니다.", ["호출 시 실패할 수 있습니다.", "conversation id를 관측합니다."]),
    ],
    codeExamples: [java("core08-scoped-proxy", "공유 JDK proxy의 request별 target resolution", "Core08ScopedProxy.java", "한 proxy를 singleton client가 공유하지만 ThreadLocal scope에 bind된 target id가 호출마다 달라지는 실제 JDK Proxy를 실행합니다.", String.raw`import java.lang.reflect.*;

public class Core08ScopedProxy {
  interface RequestValue { String id(); }
  record Target(String id) implements RequestValue {}
  static final ThreadLocal<RequestValue> CURRENT = new ThreadLocal<>();
  public static void main(String[] args) {
    RequestValue proxy = (RequestValue) Proxy.newProxyInstance(
        RequestValue.class.getClassLoader(),
        new Class<?>[]{RequestValue.class},
        (ignored, method, values) -> {
          RequestValue target = CURRENT.get();
          if (target == null) throw new IllegalStateException("scope-not-active");
          return method.invoke(target, values);
        });
    CURRENT.set(new Target("request-1"));
    System.out.println("first-target=" + proxy.id());
    CURRENT.set(new Target("request-2"));
    System.out.println("second-target=" + proxy.id());
    System.out.println("same-proxy=true");
    CURRENT.remove();
    try { proxy.id(); }
    catch (IllegalStateException e) { System.out.println("outside=" + e.getMessage()); }
  }
}`, "first-target=request-1\nsecond-target=request-2\nsame-proxy=true\noutside=scope-not-active", ["spring-scopes", "spring-scope-annotation", "spring-scoped-proxy-mode", "java-thread-local"] )],
    diagnostics: [
      d("scoped proxy는 주입됐지만 background 호출 때 scope-not-active입니다.", "proxy creation 성공을 target availability 보장으로 오해했습니다.", ["call thread/context", "proxy vs target class/id", "conversation active", "provider resolution point"], "non-web path는 explicit command/context dependency를 사용하고 scoped collaborator 호출을 web boundary 안으로 제한합니다.", "active/inactive request and async-after-completion tests를 둡니다."),
      d("TARGET_CLASS scoped proxy가 final method를 가로채지 못합니다.", "class proxy subclass/override 제약을 무시했습니다.", ["proxy mode/runtime class", "class/method final/private", "module access/AOT", "method advice/target identity"], "interface contract+INTERFACES proxy 또는 non-final public method design을 사용하고 runtime proxy smoke test를 둡니다.", "JDK/class proxy matrix와 final/private negative tests를 둡니다."),
    ],
    expertNotes: ["scoped proxy를 entity/value object에 붙이지 말고 behavior-oriented collaborator interface에 제한하면 identity 혼동을 줄입니다.", "proxy가 Serializable이어도 current target/conversation을 다른 node/process에 안전하게 전달한다는 뜻은 아닙니다."],
  },
  {
    id: "custom-scope-destruction-callback",
    title: "custom Scope를 storage·remove·destruction callback·conversation id로 구현합니다",
    lead: "custom scope는 Map 하나가 아니라 concurrent storage와 정확히 한 번 callback, end-of-conversation cleanup과 diagnostics를 제공해야 합니다.",
    explanations: [
      "Spring Scope contract의 get(name,ObjectFactory)는 current conversation에서 object를 찾거나 생성하고, remove는 object를 제거해 반환하며, registerDestructionCallback은 종료 때 실행할 cleanup을 저장합니다.",
      "resolveContextualObject와 getConversationId는 ambient context lookup과 진단을 제공합니다. conversation id에 raw token/user data를 넣지 않고 bounded opaque id를 사용합니다.",
      "동시 get에서 같은 scoped object가 중복 생성되지 않게 atomic compute/lock을 적용하고 factory failure를 cache하지 않습니다. callback도 성공한 object publication 뒤 등록합니다.",
      "conversation 종료는 callbacks를 dependency-aware/역순으로 exactly-once 실행하고 objects/callbacks/ThreadLocal keys를 모두 제거합니다. callback exception을 aggregate하고 remaining count를 관측합니다.",
      "custom scope는 test와 operational complexity가 큽니다. request/session/task/explicit lease로 요구를 충족할 수 있는지 먼저 검토하고 framework upgrade conformance를 유지합니다.",
    ],
    concepts: [
      c("Scope SPI", "custom scoped objects의 get/remove/destruction/context/conversation 동작을 정의하는 Spring interface입니다.", ["BeanFactory에 name으로 등록합니다.", "thread safety를 구현자가 책임집니다."]),
      c("destruction callback registry", "scoped instance별 cleanup callback을 conversation 종료까지 보관하는 구조입니다.", ["exactly-once 실행합니다.", "object와 함께 제거합니다."]),
      c("scope teardown", "conversation의 신규 lookup을 막고 callbacks 실행 후 storage/context를 비우는 종료 protocol입니다.", ["concurrent calls를 조정합니다.", "residual count를 검증합니다."]),
    ],
    diagnostics: [
      d("동시 첫 lookup에서 같은 custom scope bean이 두 번 생성됩니다.", "check-then-put가 atomic하지 않고 factory를 lock 밖에서 중복 실행했습니다.", ["get implementation", "creation events", "object identity", "factory side effects"], "per-name/conversation atomic creation과 failure rollback을 구현하고 publication 이후 callback을 등록합니다.", "barrier-based concurrent first-get identity=1 test를 둡니다."),
      d("conversation 종료 뒤 object/callback Map이 계속 증가합니다.", "end hook에서 callbacks/storage/ThreadLocal을 모두 제거하지 않았습니다.", ["active conversation/object/callback counts", "teardown event", "exceptions", "executor/thread reuse"], "bounded teardown에서 all callbacks를 시도하고 finally로 모든 registries/context keys를 제거합니다.", "thousands of conversations와 callback failure leak tests를 둡니다."),
    ],
    expertNotes: ["custom scope implementation은 bean lifecycle infrastructure이므로 business cache처럼 임의 eviction하면 destruction semantics가 깨집니다.", "scope storage가 distributed이면 object 자체보다 stable state/external resource ownership을 재설계하는 편이 낫습니다."],
  },
  {
    id: "resource-leak-observability-testing",
    title: "scope·lifecycle을 identity/count/leak evidence와 failure matrix로 운영합니다",
    lead: "happy-path getBean test는 concurrent identity, init failure, request/thread 종료와 shutdown leak을 증명하지 못합니다.",
    explanations: [
      "startup manifest에는 bean name/type/scope/lazy/proxy mode, init/destroy mechanism, dependency owner와 source/framework version을 값 없이 기록합니다. prototype resource owner와 web/custom conversation end hook을 함께 표시합니다.",
      "metrics에는 scope별 created/active/destroyed/failure, provider lookup rate, scope-not-active, init/destroy duration/failure와 residual threads/files/connections를 low-cardinality bean category로 둡니다.",
      "테스트 matrix는 singleton same identity/context separation, prototype new identity+manual close, singleton→prototype provider, request/session concurrent access, inactive scope, ThreadLocal reuse, init line failures, reverse destroy와 callback exception을 포함합니다.",
      "Spring/JDK/web container upgrade는 BeanPostProcessor/proxy type, callback order, web async context와 AOT/native proxy hints를 actual contexts에서 differential test합니다.",
      "incident runbook은 scope/owner 확인→created-active-destroyed parity→thread/context leak→recent config/version→traffic drain/close→residual readback→rollback 순서이며 bean values/toString을 수집하지 않습니다.",
    ],
    concepts: [
      c("lifecycle parity", "일정 시점까지 성공 생성된 resource count와 정상/실패 정리 count 및 active inventory가 일치하는 불변식입니다.", ["scope별 owner를 반영합니다.", "crash limitations를 구분합니다."]),
      c("scope manifest", "definitions의 scope/lazy/proxy/lifecycle/owner metadata를 정규화한 secret-free release artifact입니다.", ["configuration drift를 찾습니다.", "runtime identity와 비교합니다."]),
      c("leak evidence", "종료 후 남은 threads, descriptors, connections, callbacks, scoped objects와 allocation traces의 제한된 증거입니다.", ["값/PII를 제외합니다.", "run id로 cleanup합니다."]),
    ],
    diagnostics: [
      d("heap/thread leak이 보이지만 어느 scope/bean owner인지 모릅니다.", "created/destroyed/active와 definition provenance를 관측하지 않았습니다.", ["scope manifest", "allocation/close events", "thread/resource names", "context/conversation lifecycle"], "bounded bean category와 owner별 lifecycle counters/traces를 추가하고 residual resources를 context/run id에 연결합니다.", "load→drain→close leak regression과 ownerless-resource alert를 둡니다."),
      d("upgrade 뒤 callback/proxy 동작이 바뀌었지만 compile은 통과합니다.", "Spring/JDK/container runtime lifecycle matrix가 없습니다.", ["old/new runtime proxy types", "callback order/count", "web scope async behavior", "AOT hints"], "지원 version contexts에서 identity, lifecycle, concurrency와 failure corpus를 canary 비교합니다.", "version-stratified manifests와 rollback threshold를 둡니다."),
    ],
    expertNotes: ["created-destroyed가 항상 즉시 같아야 하는 것은 아니므로 active conversations와 expected long-lived singletons를 분모에 포함합니다.", "JVM crash에서 callback 부재를 고려한 external lease/transaction correctness와 graceful shutdown evidence를 분리합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-application-context", repository: "SPRING/SpringDI", path: "src/main/resources/application-context.xml", usedFor: ["prototype declaration, default singleton dependencies and XML scope learning progression"], evidence: "read-only로 31 lines/1,238 bytes를 확인했으며 class/package/configuration-shaped literal values는 복사하지 않았습니다." },
  { id: "spring-scopes", repository: "Spring Framework Reference", path: "Bean Scopes", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", usedFor: ["singleton/prototype/request/session/application/websocket, scoped proxy and prototype destruction semantics"], evidence: "Spring 공식 Bean Scopes reference입니다." },
  { id: "spring-bean-nature", repository: "Spring Framework Reference", path: "Customizing the Nature of a Bean", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html", usedFor: ["lifecycle callbacks, initialization and destruction order"], evidence: "Spring 공식 bean lifecycle reference입니다." },
  { id: "spring-bean-factory", repository: "Spring Framework Javadoc", path: "BeanFactory", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/BeanFactory.html", usedFor: ["scope lookup, singleton/prototype and lifecycle ownership contract"], evidence: "Spring 공식 BeanFactory API입니다." },
  { id: "spring-object-provider", repository: "Spring Framework Javadoc", path: "ObjectProvider", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html", usedFor: ["lazy/optional/unique/stream dependency lookup"], evidence: "Spring 공식 ObjectProvider API입니다." },
  { id: "spring-scope-spi", repository: "Spring Framework Javadoc", path: "Scope", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/config/Scope.html", usedFor: ["custom scope get/remove/destruction/context/conversation contract"], evidence: "Spring 공식 Scope SPI API입니다." },
  { id: "spring-configurable-bean-factory", repository: "Spring Framework Javadoc", path: "ConfigurableBeanFactory", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/config/ConfigurableBeanFactory.html", usedFor: ["singleton/prototype constants and scope registration"], evidence: "Spring 공식 ConfigurableBeanFactory API입니다." },
  { id: "spring-scope-annotation", repository: "Spring Framework Javadoc", path: "@Scope", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Scope.html", usedFor: ["annotation scope name and proxyMode declaration"], evidence: "Spring 공식 @Scope API입니다." },
  { id: "spring-scoped-proxy-mode", repository: "Spring Framework Javadoc", path: "ScopedProxyMode", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/ScopedProxyMode.html", usedFor: ["INTERFACES/TARGET_CLASS/NO/DEFAULT modes"], evidence: "Spring 공식 ScopedProxyMode API입니다." },
  { id: "spring-simple-thread-scope", repository: "Spring Framework Javadoc", path: "SimpleThreadScope", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/support/SimpleThreadScope.html", usedFor: ["thread-bound scope and destruction callback caveat"], evidence: "Spring 공식 SimpleThreadScope API입니다." },
  { id: "spring-initializing-bean", repository: "Spring Framework Javadoc", path: "InitializingBean", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/InitializingBean.html", usedFor: ["afterPropertiesSet lifecycle callback"], evidence: "Spring 공식 InitializingBean API입니다." },
  { id: "spring-disposable-bean", repository: "Spring Framework Javadoc", path: "DisposableBean", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/DisposableBean.html", usedFor: ["destroy lifecycle callback"], evidence: "Spring 공식 DisposableBean API입니다." },
  { id: "java-thread-local", repository: "Java SE 21 API", path: "ThreadLocal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html", usedFor: ["per-thread value lifetime and remove semantics"], evidence: "Oracle JDK 공식 ThreadLocal API입니다." },
  { id: "java-autocloseable", repository: "Java SE 21 API", path: "AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["prototype/resource lexical close and failure cleanup"], evidence: "Oracle JDK 공식 AutoCloseable API입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-08-scope-lifecycle", slug: "spring-core-08-scope-lifecycle", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 8,
  title: "singleton·prototype scope와 빈 생명주기 보강", subtitle: "scope를 identity·thread safety·provider/proxy·init/destroy·web/thread conversation·resource ownership과 leak evidence로 운영합니다.", level: "고급", estimatedMinutes: 90,
  coreQuestion: "각 bean instance가 어느 context/request/thread에서 생성·공유되고 누가 실패와 종료에서 정리하는지, 동시성·proxy·resource leak까지 어떻게 증명할까요?",
  summary: "SpringDI application-context.xml을 read-only로 감사해 하나의 prototype 선언과 기본 singleton 의존 graph의 학습 진행을 민감한 configuration literal 없이 provenance로 사용합니다. 선행 Java configuration에서 이어져 scope recipe/identity/owner, singleton eager/lazy/context hierarchy와 thread safety, prototype provider/ObjectProvider와 destruction gap, request/session/application/websocket scope, thread scope/ThreadLocal cleanup, init/readiness와 partial failure, destroy 역순/graceful shutdown, scoped proxy target resolution, custom Scope SPI와 lifecycle parity/leak governance까지 고급에서 운영 전문가 수준으로 확장합니다. 여섯 JDK 21 examples는 singleton/prototype identity, deterministic lost update, provider lookup, ThreadLocal stale cleanup, partial-init reverse destroy와 JDK scoped proxy resolution을 실제 실행합니다.",
  objectives: ["scope를 definition recipe·instance identity·storage·destruction owner로 설명한다.", "singleton eager/lazy/context identity와 thread safety를 분리해 검증한다.", "prototype lookup과 ObjectProvider/scoped proxy 및 manual destruction을 설계한다.", "request/session/application/websocket scope의 async/concurrency boundary를 이해한다.", "thread scope/ThreadLocal executor reuse와 cleanup을 검증한다.", "init callbacks/readiness/partial failure와 destroy reverse order를 운영한다.", "custom scope/proxy target identity와 lifecycle parity/leak evidence를 release gate로 만든다."],
  prerequisites: [{ title: "@Configuration·@Bean Java 설정으로 전환", reason: "BeanDefinition factory와 explicit object graph를 이해한 뒤 동일 recipe가 scope별 identity와 lifecycle을 어떻게 만드는지 확장합니다.", sessionSlug: "spring-core-07-java-config" }],
  keywords: ["singleton", "prototype", "request scope", "session scope", "thread safety", "ObjectProvider", "scoped proxy", "ScopedProxyMode", "ThreadLocal", "init", "destroy", "@PostConstruct", "@PreDestroy", "graceful shutdown", "resource leak", "custom Scope"], topics,
  lab: {
    title: "scope-aware object graph와 zero-leak lifecycle gate 구축",
    scenario: "legacy XML의 prototype/default singleton graph를 web/service로 확장하면서 mutable singleton, prototype resource, request/thread context, partial init와 shutdown leak이 발생합니다.",
    setup: ["원본 XML은 read-only provenance로 보존하고 class/package/configuration-shaped values를 공개 예제에 복사하지 않습니다.", "JDK 21 exact harness와 별도로 supported Spring/JDK servlet test contexts, synthetic resources와 concurrency barriers를 준비합니다.", "bean별 scope/lazy/proxy, owner, mutable state, init/destroy, conversation/end hook과 expected identity/count 표를 작성합니다.", "create/init/first-use/concurrent/cancel/request-end/thread-reuse/context-close/SIGTERM failure points를 고정합니다."],
    steps: ["old/new BeanDefinitions의 scope/lazy/proxy/lifecycle manifest를 값 없이 추출합니다.", "singleton/prototype lookup identity와 multi-context/hierarchy separation을 확인합니다.", "singleton mutable fields를 inventory하고 barrier test로 race를 재현한 뒤 stateless/atomic design으로 교정합니다.", "singleton→prototype direct injection을 ObjectProvider/lease로 바꾸고 created=closed를 검증합니다.", "request/session scoped target의 같은/다른 conversation identity와 concurrent access를 확인합니다.", "ThreadLocal task wrapper의 set→run→finally remove와 pool worker reuse를 fault-test합니다.", "constructor/init callback order, readiness와 각 단계 partial failure cleanup을 주입합니다.", "traffic drain→in-flight deadline→reverse destroy와 callback exception aggregation을 실행합니다.", "scoped proxy mode/runtime type/current target/outside-scope failure를 검증합니다.", "custom scope concurrent get, callback exactly-once, teardown/storage zero를 test합니다.", "created/active/destroyed/failure와 residual threads/files/connections를 safe metrics로 연결합니다.", "Spring/JDK/container/AOT upgrade canary에서 identity/lifecycle/leak matrix와 rollback을 rehearsal합니다."],
    expectedResult: ["각 scope의 same/different identity와 active conversation boundary가 manifest/실행 결과와 일치합니다.", "singleton concurrent invariants와 prototype/resource caller ownership이 deterministic tests를 통과합니다.", "request/thread async 종료 뒤 stale context·scoped objects·callbacks가 남지 않습니다.", "normal/partial init/destroy exception/SIGTERM 경로가 정의된 cleanup/unknown-crash policy를 따릅니다.", "logs/metrics/artifacts가 bean values·configuration literals·PII 없이 lifecycle과 residual resource를 설명합니다."],
    cleanup: ["disposable contexts, sessions/requests, custom conversations, executors와 synthetic resources를 종료합니다.", "ThreadLocal/request attributes/callback registries를 제거하고 active/created/destroyed parity를 readback합니다.", "threads/files/sockets/connections와 temporary artifacts가 zero인지 검사합니다.", "원본 application-context.xml과 production configuration/data는 변경하지 않습니다."],
    extensions: ["TaskDecorator 기반 bounded context propagation contract를 구현합니다.", "custom destruction-aware task scope와 exactly-once callback tests를 만듭니다.", "JFR/resource counters를 lifecycle owner manifest에 연결합니다.", "servlet request scope와 reactive Context를 비교하는 별도 migration lab을 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행하고 identity→concurrency→lookup→cleanup evidence를 표로 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "singleton/prototype 같은/다른 identity를 구분합니다.", "lost update와 atomic 결과를 비교합니다.", "direct prototype과 provider-per-call을 추적합니다.", "ThreadLocal stale/remove/finally를 확인합니다.", "partial init event와 reverse destroy를 설명합니다.", "같은 scoped proxy가 두 target과 outside-scope failure를 만드는 이유를 설명합니다."], hints: ["각 객체 옆에 생성자, storage, consumer, destroy owner와 thread/conversation을 적으세요."], expectedOutcome: "scope를 객체 개수보다 identity·동시성·수명 계약으로 설명합니다.", solutionOutline: ["define→create→store→resolve→use→end→destroy→verify 순서입니다."] },
    { difficulty: "응용", prompt: "원본 XML graph를 web/task 환경의 zero-leak scope design으로 확장하세요.", requirements: ["원본은 structural provenance로만 사용합니다.", "scope/lazy/proxy/lifecycle manifest를 만듭니다.", "singleton state를 stateless/thread-safe로 교정합니다.", "prototype provider/lease와 manual close를 적용합니다.", "request/session async/concurrency를 검증합니다.", "ThreadLocal cleanup wrapper를 둡니다.", "partial init/graceful destroy fault matrix를 실행합니다.", "safe lifecycle telemetry와 upgrade rollback을 포함합니다."], hints: ["prototype 선언만 추가하지 말고 소비자가 언제 새 객체를 요청하고 닫는지 API에 보이게 하세요."], expectedOutcome: "동시 요청·비동기·장애·종료에도 identity와 resources가 통제되는 graph가 완성됩니다.", solutionOutline: ["audit→assign owners→constrain state→provide→propagate→cleanup→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring scope·lifecycle governance와 release gate를 작성하세요.", requirements: ["scope 선택/identity/context rules를 정의합니다.", "singleton mutability/thread-safety gate를 둡니다.", "prototype provider/destruction policy를 둡니다.", "web/thread/custom scope async/teardown 정책을 둡니다.", "init/readiness/partial failure 규칙을 둡니다.", "destroy order/grace/crash semantics를 정의합니다.", "proxy/type/AOT matrix와 lifecycle metrics를 요구합니다.", "concurrency/failure/leak/upgrade tests와 runbook을 포함합니다."], hints: ["scope마다 creation과 destruction을 같은 표의 양 끝에 배치하세요."], expectedOutcome: "definition부터 incident cleanup까지 일관된 scope/lifecycle 표준이 완성됩니다.", solutionOutline: ["classify→own→create→share→isolate→close→measure→qualify 순서입니다."] },
  ],
  nextSessions: ["spring-core-09-aop-proxy-advice"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["application-context.xml은 read-only로 31 lines/1,238 bytes를 확인했고 SHA-256은 0890872EEDD96F2F88A96A79448E8CA6ECE65E8E1A9CF9698FAD4D98055B2257입니다.", "원본에서 prototype declaration 1개와 scope 생략 기본 singleton graph를 확인했지만 class/package/configuration-shaped literal values는 복사·출력하지 않았습니다.", "원본은 thread safety, provider/proxy, web/thread/custom scope, destruction gap, partial init/graceful shutdown/leak evidence를 다루지 않아 현재 Spring/JDK 공식 문서와 synthetic examples로 보강했습니다.", "JDK-only models는 실제 Spring singleton cache, BeanPostProcessor/callback order, scoped proxy/web context/custom Scope/AOT behavior를 대체하지 않습니다."] },
});

export default session;
