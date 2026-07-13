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
      { lines: `1-${first}`, explanation: "JDK 21 Proxy/InvocationHandler와 작은 Invocation·Advice 함수로 target, proxy, pointcut metadata와 interceptor chain을 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "before/proceed/return/throw/finally, ordered nesting, self-invocation bypass 또는 safe logging metadata를 실제 호출 경로로 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "raw args/result/credential 없이 method id, event order, propagated exception, interception count와 redaction evidence만 deterministic stdout으로 확인합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 reflection/collection", "Spring·AspectJ jar·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "JDK proxy/functional chain은 Spring Advisor/AspectJExpressionPointcut/CGLIB/transaction/async runtime을 대체하지 않습니다."] },
    experiments: [
      { change: "pointcut class/method, advisor order, proceed 0/2회, self-call, target exception과 sensitive argument를 바꿉니다.", prediction: "proxy boundary와 chain contract에 따라 interception/event/exception/redaction evidence가 안정적으로 달라집니다.", result: "matched methods, advice events, target calls, transaction outcome와 raw-value absence를 비교합니다." },
      { change: "같은 graph를 실제 Spring ProxyFactory/@EnableAspectJAutoProxy/@Transactional contexts에서 실행합니다.", prediction: "JDK/CGLIB runtime type, resolved advisors와 transaction interceptor가 공식 semantics로 결합됩니다.", result: "Advised inventory, pointcut match matrix, order, self-invocation, rollback, logs와 latency를 readback합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "aop-vocabulary-invocation-pipeline",
    title: "AOP를 target 앞의 proxy·advisor chain·method invocation pipeline으로 이해합니다",
    lead: "AOP는 로그 annotation을 붙이는 마법이 아니라 caller가 proxy를 호출할 때 matching interceptors가 target method execution을 감싸는 구조입니다.",
    explanations: [
      "선행 `spring-core-08-scope-lifecycle`에서 proxy facade와 scoped target identity를 구분했습니다. AOP proxy도 injection/lookup된 facade가 method call을 받아 pointcut-matched advice chain을 거쳐 target을 호출하지만 목적은 scope target resolution이 아니라 cross-cutting behavior 적용입니다.",
      "aspect는 여러 join points에 적용할 cross-cutting module, join point는 advice가 결합 가능한 실행 지점, pointcut은 join points를 선택하는 predicate, advice는 그 지점에서 실행할 behavior, target은 business object, proxy는 caller가 보는 advised object입니다.",
      "Spring AOP는 proxy 기반 method execution join points에 집중합니다. field access, constructor, private self call 같은 다른 join point까지 필요하면 AspectJ weaving 등 다른 도구/설계를 검토하고 Spring proxy와 혼동하지 않습니다.",
      "호출 pipeline은 caller→proxy method/type match→ordered interceptors→target invocation→return/throw unwind입니다. advice 하나가 예외를 삼키거나 proceed를 누락/중복하면 전체 business/transaction semantics가 바뀝니다.",
      "원본 LogAdvice.java와 aop-context.xml은 component-scanned aspect, auto-proxy와 broad service around advice를 보여 줍니다. package/pointcut literal을 복사하지 않고 구조를 provenance로 사용하며 raw args logging, Throwable swallow, stack trace와 wall-clock timing은 안전한 운영 contract로 교정합니다.",
    ],
    concepts: [
      c("aspect", "여러 business objects에 횡단 적용되는 pointcut과 advice의 module입니다.", ["logging/transaction/security 등이 있습니다.", "domain 의미를 숨기지 않습니다."]),
      c("join point", "advice가 결합될 수 있는 program execution 지점이며 Spring AOP에서는 주로 method execution입니다.", ["proxy boundary를 통과해야 합니다.", "AspectJ 전체 join point model과 구분합니다."]),
      c("advisor chain", "한 method invocation에 match되어 정해진 순서로 target을 둘러싸는 advice/interceptor 목록입니다.", ["inbound/outbound 순서를 가집니다.", "runtime inventory로 확인합니다."]),
    ],
    diagnostics: [
      d("annotation/pointcut은 있는데 advice가 실행되지 않습니다.", "caller가 proxy가 아닌 target/new/self reference를 호출하거나 pointcut signature가 match하지 않습니다.", ["injected runtime class", "target vs proxy identity", "method visibility/signature", "resolved advisors/pointcut match"], "container-managed proxy를 외부 boundary에서 호출하고 pointcut truth table/runtime advisor inventory를 검증합니다.", "positive/negative method invocation과 proxy-bypass architecture tests를 둡니다."),
      d("AOP 오류를 business method 오류와 구분하지 못합니다.", "proxy match, advice, target과 unwind stages를 하나의 stack trace로만 기록했습니다.", ["invocation stage/events", "advisor ids/order", "target method id", "cause/suppressed chain"], "match→before→proceed→target→return/throw→finally 단계와 stable category를 값 없이 기록합니다.", "각 advice/target 단계 failure injection과 exception identity assertions를 둡니다."),
    ],
    expertNotes: ["AOP를 적용하기 전에 cross-cutting concern이 정말 호출자에게 숨겨도 되는 invariant인지 판단합니다.", "runtime proxy/advisor graph가 source annotation보다 실제 실행 truth이므로 startup/canary에서 readback합니다."],
  },
  {
    id: "jdk-cglib-proxy-selection",
    title: "JDK dynamic proxy와 CGLIB class proxy의 type·final·module 제약을 비교합니다",
    lead: "proxy 방식은 injection type, 가로챌 수 있는 method와 equals/class checks를 바꾸므로 구현 detail로 숨길 수 없습니다.",
    explanations: [
      "Spring은 target이 interface를 구현하면 기본적으로 JDK dynamic proxy를 사용할 수 있고 interface가 없으면 CGLIB subclass proxy를 사용합니다. proxy-target-class 설정은 여러 auto-proxy facilities에 영향을 줄 수 있어 global runtime manifest에서 확인합니다.",
      "JDK proxy는 지정 interfaces를 구현하므로 concrete class로 cast/inject할 수 없습니다. consumer가 behavior interface에 의존하면 proxy mechanism 전환과 test double 설계가 쉬워집니다.",
      "CGLIB는 target class를 subclass하므로 final class는 proxy할 수 없고 final/private/invisible method는 override해 advice할 수 없습니다. module path 접근과 constructor semantics, AOT/native hints도 지원 matrix에서 검증합니다.",
      "Kotlin class/method의 기본 final, record/final classes와 sealed hierarchy는 class proxy 제약을 만듭니다. 무조건 all-open을 적용하기보다 interface boundary 또는 compile-time weaving 필요성을 평가합니다.",
      "`getClass`, instanceof, equals/hashCode/toString과 serialization에 proxy implementation을 business key로 쓰지 않습니다. runtime type과 ultimate target type은 diagnostic metadata로만 제한적으로 사용합니다.",
    ],
    concepts: [
      c("JDK dynamic proxy", "interfaces와 InvocationHandler를 기반으로 런타임 proxy class를 만드는 JDK mechanism입니다.", ["interface methods를 가로챕니다.", "concrete target type과 다릅니다."]),
      c("CGLIB proxy", "target class를 subclass하고 method override/interceptor로 호출을 가로채는 class-based proxy입니다.", ["final/private 제약이 있습니다.", "Spring에 repackaged되어 있습니다."]),
      c("proxy-target-class", "interface proxy 대신 class proxy를 요청하는 Spring auto-proxy configuration choice입니다.", ["여러 infrastructure advisors에 영향을 줄 수 있습니다.", "runtime type matrix를 검증합니다."]),
    ],
    codeExamples: [java("core09-jdk-proxy", "JDK Proxy의 before→target→after 호출", "Core09JdkProxy.java", "실제 java.lang.reflect.Proxy가 interface method를 InvocationHandler로 감싸고 target result/exception을 보존하는 기본 경로를 실행합니다.", String.raw`import java.lang.reflect.*;
import java.util.*;

public class Core09JdkProxy {
  interface Greeter { String greet(String name); }
  record Target() implements Greeter {
    public String greet(String name) { return "hello," + name; }
  }
  public static void main(String[] args) {
    List<String> events = new ArrayList<>();
    Greeter target = new Target();
    Greeter proxy = (Greeter) Proxy.newProxyInstance(
        Greeter.class.getClassLoader(), new Class<?>[]{Greeter.class},
        (ignored, method, values) -> {
          events.add("before:" + method.getName());
          try {
            Object result = method.invoke(target, values);
            events.add("after-returning:" + method.getName());
            return result;
          } catch (InvocationTargetException error) {
            throw error.getCause();
          } finally {
            events.add("finally:" + method.getName());
          }
        });
    String result = proxy.greet("learner");
    System.out.println("is-proxy=" + Proxy.isProxyClass(proxy.getClass()));
    System.out.println("interfaces=" + Arrays.toString(proxy.getClass().getInterfaces()));
    System.out.println("result=" + result);
    System.out.println("events=" + events);
  }
}`, "is-proxy=true\ninterfaces=[interface Core09JdkProxy$Greeter]\nresult=hello,learner\nevents=[before:greet, after-returning:greet, finally:greet]", ["spring-proxying", "spring-proxy-factory", "java-proxy", "java-invocation-handler"] )],
    diagnostics: [
      d("JDK proxy bean을 concrete implementation으로 주입/cast해 실패합니다.", "interface-based proxy runtime type을 target concrete class로 가정했습니다.", ["proxy class/interfaces", "injection point type", "proxyTargetClass setting", "advisor creator"], "consumer를 business interface에 의존시키거나 intentional class proxy를 선택하고 runtime type smoke test를 둡니다.", "JDK/CGLIB injection/type matrix와 no-concrete-cast architecture rule을 둡니다."),
      d("CGLIB proxy인데 final method에 transaction/log advice가 없습니다.", "subclass proxy가 override할 수 없는 class/method입니다.", ["class/method modifiers", "runtime proxy/target class", "pointcut match", "module/AOT access"], "interface/non-final public boundary로 refactor하거나 필요한 경우 AspectJ weaving을 명시적으로 검토합니다.", "final/private/package visibility negative tests와 startup warning gate를 둡니다."),
    ],
    expertNotes: ["proxy mechanism을 바꾸는 설정은 transaction/cache/security/async 등 모든 proxy-based concern의 type/coverage를 재검증해야 합니다.", "JDK Proxy의 Object methods도 InvocationHandler 경로를 탈 수 있어 safe toString/equals behavior를 test합니다."],
  },
  {
    id: "around-proceed-control-flow",
    title: "around advice의 proceed를 정확히 한 번 호출하고 return·throw를 보존합니다",
    lead: "around는 가장 강력하지만 target 실행 여부·횟수·args·return·exception을 모두 바꿀 수 있어 contract가 가장 엄격해야 합니다.",
    explanations: [
      "@Around advice는 ProceedingJoinPoint.proceed를 호출해야 target/다음 advice로 진행합니다. 일반 logging/timing advice는 exactly once를 호출하고 반환값을 그대로 돌려주며 Throwable을 그대로 재throw합니다.",
      "proceed를 호출하지 않으면 short-circuit/cache/security denial처럼 target이 실행되지 않습니다. 두 번 호출하면 write/외부 side effect가 중복될 수 있으므로 retry는 idempotency와 새 transaction policy를 가진 별도 resilience layer로 설계합니다.",
      "proceed(args)는 arguments를 바꿀 수 있지만 validation/coercion을 advice에 숨기면 method contract와 debugging이 어려워집니다. cross-cutting metadata 외 business input transformation은 explicit decorator/service에 둡니다.",
      "after-returning은 정상 반환에서만, after-throwing은 matching exception에서만, finally-style after는 두 경로 모두에서 실행됩니다. around try/catch/finally로 이 구분을 정확히 모델링합니다.",
      "원본 around advice는 Throwable을 catch하고 stack trace를 출력한 뒤 null을 반환하는 구조가 있어 target failure를 정상/NULL로 바꿀 수 있습니다. 교정된 advice는 safe event를 기록하고 원래 exception identity/cause를 보존합니다.",
    ],
    concepts: [
      c("ProceedingJoinPoint", "around advice가 현재 method invocation metadata에 접근하고 chain/target 실행을 계속하는 AspectJ interface입니다.", ["proceed가 실행 경계를 통제합니다.", "args/return/throw를 보존합니다."]),
      c("short-circuit", "advice가 proceed를 호출하지 않고 직접 result/exception을 반환해 target execution을 생략하는 동작입니다.", ["의도적 concern에만 사용합니다.", "target-call count를 검증합니다."]),
      c("exception transparency", "관측/측정 advice가 target exception type, cause, stack와 transaction rollback signal을 바꾸지 않는 성질입니다.", ["같은 Throwable을 재throw합니다.", "logging failure도 business exception을 덮지 않습니다."]),
    ],
    diagnostics: [
      d("target exception이 null result로 바뀌어 상위 계층 NPE/commit이 발생합니다.", "around catch가 Throwable을 삼키고 default/null을 반환했습니다.", ["around catch/return", "original exception", "transaction outcome", "caller null contract"], "safe after-throwing event 뒤 원 exception을 그대로 재throw하고 fallback은 explicit typed policy로 분리합니다.", "exception identity, rollback와 no-null-substitution tests를 둡니다."),
      d("한 API 호출이 DB write를 두 번 수행합니다.", "timing/retry around가 proceed를 두 번 호출했습니다.", ["target invocation count", "advice code/order", "retry policy", "idempotency keys"], "observability advice는 exactly-once proceed, retry는 idempotent operation과 새 attempt boundaries를 가진 전용 component로 이동합니다.", "proceed count spy와 side-effect duplicate fault tests를 둡니다."),
    ],
    expertNotes: ["around advice가 catch할 수 있다는 사실과 catch해야 한다는 뜻은 다릅니다.", "advice 자체의 logger/metric failure는 target result/exception을 덮지 않도록 bounded fail-safe policy를 둡니다."],
  },
  {
    id: "pointcut-design-match-surface",
    title: "pointcut을 package wildcard가 아니라 architecture와 annotation truth table로 설계합니다",
    lead: "너무 넓은 pointcut은 framework/internal methods와 민감 args를 잡고 너무 좁은 pointcut은 rename/new implementation에서 조용히 coverage를 잃습니다.",
    explanations: [
      "execution pointcut은 method signature pattern을, within은 declaring type scope를, this/target은 proxy/target type을, args/@annotation/@within 등은 runtime/static metadata를 선택합니다. 각 designator의 static/dynamic cost와 proxy semantics를 공식 reference에서 확인합니다.",
      "service package 전체 wildcard는 빠른 학습에는 좋지만 getter/toString/health/admin/batch 등 다른 sensitivity/latency methods까지 포함할 수 있습니다. explicit marker annotation 또는 architecture interface와 deny cases를 둡니다.",
      "annotation pointcut은 annotation이 interface, implementation, method 어디에 있고 상속/bridge/meta-annotation이 어떻게 보이는지 JDK/CGLIB matrix에서 검증합니다. source에 보인다는 사실만으로 runtime match를 가정하지 않습니다.",
      "pointcut expression을 작은 named pointcuts로 조합하고 positive/negative examples를 문서화합니다. rename/refactor 때 matched method inventory diff가 의도적 변경인지 review합니다.",
      "pointcut에 user-controlled regex/expression을 넣지 않습니다. configuration-controlled allow-list와 signed/versioned deployment artifact로 관리하고 actuator/log에 raw expression을 불필요하게 노출하지 않습니다.",
    ],
    concepts: [
      c("pointcut", "advice가 적용될 join points를 선택하는 predicate/expression입니다.", ["static/dynamic matching이 있습니다.", "truth table로 검증합니다."]),
      c("execution designator", "method execution signature를 return type, declaring type, name와 arguments pattern으로 선택하는 AspectJ pointcut 표현입니다.", ["Spring AOP 핵심 designator입니다.", "wildcard 범위를 검토합니다."]),
      c("match surface", "한 pointcut이 실제 runtime에서 포함/제외하는 methods와 their sensitivity/cost 집합입니다.", ["inventory diff를 만듭니다.", "positive/negative fixtures를 둡니다."]),
    ],
    codeExamples: [java("core09-pointcut", "architecture pointcut truth table", "Core09Pointcut.java", "synthetic method metadata에서 service package, public operation prefix와 explicit marker를 모두 만족해야 match하는 predicate를 실행합니다.", String.raw`import java.util.*;

public class Core09Pointcut {
  record MethodMeta(String packageName, String className, String methodName, boolean publicMethod, Set<String> annotations) {}
  static boolean matches(MethodMeta method) {
    boolean servicePackage = method.packageName().startsWith("app.catalog.service");
    boolean operation = method.methodName().startsWith("execute") || method.methodName().startsWith("find");
    return servicePackage && method.publicMethod() && operation && method.annotations().contains("ObservedOperation");
  }
  public static void main(String[] args) {
    List<MethodMeta> methods = List.of(
        new MethodMeta("app.catalog.service", "CatalogService", "findItem", true, Set.of("ObservedOperation")),
        new MethodMeta("app.catalog.service", "CatalogService", "toString", true, Set.of()),
        new MethodMeta("app.catalog.internal", "Helper", "executeTask", true, Set.of("ObservedOperation")),
        new MethodMeta("app.catalog.service", "CatalogService", "executeAdmin", false, Set.of("ObservedOperation")));
    for (MethodMeta method : methods) {
      System.out.println(method.className() + "." + method.methodName() + "=" + matches(method));
    }
    System.out.println("matched=" + methods.stream().filter(Core09Pointcut::matches).count());
  }
}`, "CatalogService.findItem=true\nCatalogService.toString=false\nHelper.executeTask=false\nCatalogService.executeAdmin=false\nmatched=1", ["spring-aop-pointcuts", "spring-ataspectj", "spring-aop-reference"] )],
    diagnostics: [
      d("pointcut이 framework/toString/health methods까지 적용돼 log/latency가 폭증합니다.", "broad package+wildcard에 architecture/annotation/negative exclusions가 없습니다.", ["matched method inventory", "top method/cardinality", "pointcut expression", "sensitivity/latency classes"], "marker annotation/interface+bounded execution pattern으로 surface를 좁히고 explicit negative fixtures를 둡니다.", "startup match count/manifest와 unexpected-new-match review gate를 둡니다."),
      d("새 implementation/rename 후 transaction/logging이 조용히 빠집니다.", "concrete class/package name pattern에 과도하게 결합하고 coverage diff를 검사하지 않았습니다.", ["old/new matched inventory", "interface/annotation placement", "runtime proxy type", "bridge/visibility"], "stable architecture contract/annotation pointcut으로 전환하고 required operations coverage를 fail-fast합니다.", "refactor differential and must-be-advised method tests를 둡니다."),
    ],
    expertNotes: ["pointcut은 architecture rule의 executable selector이므로 owner와 compatibility policy가 필요합니다.", "동적 args 기반 pointcut은 invocation마다 평가 비용과 data sensitivity가 있으므로 static matching을 우선합니다."],
  },
  {
    id: "advice-types-order-nesting",
    title: "before·after-returning·after-throwing·after·around와 advisor 순서를 stack으로 추적합니다",
    lead: "여러 advice는 flat list가 아니라 inbound에서 높은 우선순위가 먼저 들어가고 outbound에서 나중에 나오는 중첩 call stack입니다.",
    explanations: [
      "before는 target 전에, after returning은 정상 반환 후, after throwing은 예외 후, after/finally는 두 경로 모두, around는 전체를 감쌉니다. 한 concern에 필요한 최소 advice type을 선택합니다.",
      "@Order/Ordered의 낮은 숫자는 높은 precedence를 뜻하며 inbound에서 먼저, unwind에서 나중에 실행되는 stack model로 이해합니다. 같은 precedence나 같은 aspect 내부 advice order는 명시적 component/aspect 분리와 integration evidence로 불확실성을 제거합니다.",
      "security authorization은 transaction/resource allocation 전에 거부할 수 있고 tracing/metrics는 전체 transaction을 감쌀지 business method만 측정할지 목적에 따라 순서를 정합니다. order 값을 복사하지 말고 desired event diagram에서 결정합니다.",
      "cache와 transaction 순서는 cache hit가 transaction을 생략할지, commit 전 result가 cache에 publish될지에 영향을 줍니다. write cache update는 after-commit event와 연결하고 advice order만으로 durability를 가정하지 않습니다.",
      "모든 advice가 same logger/timer를 중복 기록하지 않게 concern별 single owner를 둡니다. nested proxy와 multiple auto-proxy creators가 합쳐진 최종 advisor chain을 runtime에서 확인합니다.",
    ],
    concepts: [
      c("advice", "pointcut이 선택한 method invocation에서 before/return/throw/finally/around 시점에 실행되는 behavior입니다.", ["최소 권한/control flow를 가집니다.", "exception/result를 보존합니다."]),
      c("precedence", "여러 advice가 invocation chain에 들어가고 빠져나오는 nesting 순서를 정하는 우선순위입니다.", ["@Order/Ordered로 표현할 수 있습니다.", "동일 order ambiguity를 피합니다."]),
      c("unwind", "target return/throw 뒤 interceptor call stack이 역순으로 빠져나오며 after logic을 실행하는 단계입니다.", ["outbound order가 inbound 반대입니다.", "finally cleanup을 보장합니다."]),
    ],
    codeExamples: [java("core09-advice-order", "중첩 around advice의 inbound·unwind 순서", "Core09AdviceOrder.java", "metrics 바깥, transaction 안쪽 chain을 함수로 구성해 정상 return의 before/after/finally 순서를 실행합니다.", String.raw`import java.util.*;

public class Core09AdviceOrder {
  interface Invocation { String proceed(); }
  static Invocation around(String name, List<String> events, Invocation next) {
    return () -> {
      events.add(name + ":before");
      try {
        String result = next.proceed();
        events.add(name + ":after-returning");
        return result;
      } catch (RuntimeException error) {
        events.add(name + ":after-throwing");
        throw error;
      } finally {
        events.add(name + ":finally");
      }
    };
  }
  public static void main(String[] args) {
    List<String> events = new ArrayList<>();
    Invocation target = () -> { events.add("target"); return "ok"; };
    Invocation transaction = around("transaction", events, target);
    Invocation metrics = around("metrics", events, transaction);
    String result = metrics.proceed();
    System.out.println("result=" + result);
    System.out.println("events=" + events);
    System.out.println("target-calls=" + events.stream().filter("target"::equals).count());
  }
}`, "result=ok\nevents=[metrics:before, transaction:before, target, transaction:after-returning, transaction:finally, metrics:after-returning, metrics:finally]\ntarget-calls=1", ["spring-aop-advice", "spring-order", "spring-advised"] )],
    diagnostics: [
      d("metrics가 transaction commit 시간을 포함하지 않거나 반대로 예상보다 깁니다.", "advisor nesting order와 측정 boundary가 목적과 다릅니다.", ["resolved advisor order", "event/span nesting", "transaction begin/commit", "timer start/stop"], "desired sequence diagram을 먼저 정하고 @Order/Ordered 및 separate aspects로 구현해 actual chain을 assert합니다.", "normal/throw/commit-failure event order golden tests를 둡니다."),
      d("동일 advice가 두 번 실행됩니다.", "aspect가 component scan+explicit bean으로 중복 등록되거나 multiple proxy layers가 생겼습니다.", ["aspect bean definitions", "Advised advisors", "proxy layers/runtime classes", "event counts"], "aspect registration owner를 하나로 통합하고 startup duplicate advisor/bean detection을 실패시킵니다.", "one invocation→one concern event count invariant를 둡니다."),
    ],
    expertNotes: ["order 숫자만 문서화하지 말고 inbound, target, commit, outbound event diagram을 유지합니다.", "transaction commit exception은 target 정상 반환 뒤 advice unwind 중 발생할 수 있으므로 after-returning 위치와 API outcome을 함께 검증합니다."],
  },
  {
    id: "self-invocation-proxy-boundary",
    title: "self-invocation이 proxy를 우회하는 이유와 구조적 해결책을 적용합니다",
    lead: "proxy를 통과한 outer method 안에서 `this.inner()`를 호출하면 이미 target 내부이므로 inner pointcut/advice가 다시 적용되지 않습니다.",
    explanations: [
      "external caller→proxy→target.outer 경로에서 target의 this는 proxy가 아니라 target object입니다. 따라서 target.outer가 this.inner를 호출하면 direct virtual call이며 proxy interceptor chain을 거치지 않습니다.",
      "self-invocation은 @Transactional propagation/new, @Cacheable, @Async, security와 custom advice 모두에 영향을 줄 수 있습니다. annotation이 inner에 보인다는 것과 runtime interception을 구분합니다.",
      "가장 좋은 해결은 advised operation을 별도 collaborator bean/interface로 분리해 external proxy call을 만들거나 transaction boundary를 public use-case method에 재배치하는 것입니다.",
      "self injection 또는 AopContext.currentProxy/exposeProxy는 target을 Spring AOP에 결합하고 recursion/test/ThreadLocal proxy exposure 문제를 만들 수 있어 최후의 선택으로 제한합니다. AspectJ weaving은 self-invocation을 다르게 처리하지만 deployment model이 바뀝니다.",
      "test는 method result만 보지 말고 advisor event count, transaction status/threads/cache hits와 self/external call matrix를 확인합니다. refactor 뒤 must-be-advised operation이 proxy path를 거치는 architecture test를 둡니다.",
    ],
    concepts: [
      c("self-invocation", "target method가 같은 object의 다른 method를 this/direct reference로 호출하는 경로입니다.", ["Spring proxy를 우회합니다.", "inner advice가 적용되지 않을 수 있습니다."]),
      c("external proxy call", "다른 object/caller가 injected proxy reference의 method를 호출해 advisor chain에 들어가는 경로입니다.", ["advice 적용의 기본 경계입니다.", "runtime identity를 검증합니다."]),
      c("AopContext", "현재 invocation proxy를 ThreadLocal 방식으로 노출/조회하는 Spring utility입니다.", ["exposeProxy가 필요합니다.", "application coupling 때문에 권장 해법이 아닙니다."]),
    ],
    codeExamples: [java("core09-self-invocation", "self-call의 proxy bypass", "Core09SelfInvocation.java", "JDK proxy에서 outer target이 inner를 직접 호출하면 interceptor count가 늘지 않고 external proxy.inner만 advice되는 경로를 실행합니다.", String.raw`import java.lang.reflect.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Core09SelfInvocation {
  interface Service { void outer(); void inner(); }
  static final class Target implements Service {
    final AtomicInteger innerCalls = new AtomicInteger();
    public void outer() { inner(); }
    public void inner() { innerCalls.incrementAndGet(); }
  }
  public static void main(String[] args) {
    Target target = new Target();
    AtomicInteger innerInterceptions = new AtomicInteger();
    Service proxy = (Service) Proxy.newProxyInstance(
        Service.class.getClassLoader(), new Class<?>[]{Service.class},
        (ignored, method, values) -> {
          if (method.getName().equals("inner")) innerInterceptions.incrementAndGet();
          try { return method.invoke(target, values); }
          catch (InvocationTargetException error) { throw error.getCause(); }
        });
    proxy.outer();
    System.out.println("after-outer-target-inner=" + target.innerCalls.get());
    System.out.println("after-outer-intercepted-inner=" + innerInterceptions.get());
    proxy.inner();
    System.out.println("after-external-target-inner=" + target.innerCalls.get());
    System.out.println("after-external-intercepted-inner=" + innerInterceptions.get());
    System.out.println("self-call-bypassed=true");
  }
}`, "after-outer-target-inner=1\nafter-outer-intercepted-inner=0\nafter-external-target-inner=2\nafter-external-intercepted-inner=1\nself-call-bypassed=true", ["spring-proxying", "spring-aop-context", "java-proxy"] )],
    diagnostics: [
      d("inner @Transactional/@Async/@Cacheable이 실행되지 않습니다.", "같은 target의 this.inner self-invocation이 proxy를 우회했습니다.", ["call graph", "proxy/target reference", "advisor events", "transaction/thread/cache state"], "inner operation을 별도 injected collaborator로 이동하거나 public use-case proxy boundary에 concern을 배치합니다.", "self vs external invocation state/count tests를 둡니다."),
      d("AopContext.currentProxy가 테스트/background에서 실패합니다.", "exposeProxy와 active proxied invocation ThreadLocal에 ambient하게 의존했습니다.", ["exposeProxy setting", "call entry/proxy", "thread/async handoff", "static utility use"], "explicit collaborator injection으로 refactor하고 currentProxy 사용을 architecture rule로 제한합니다.", "outside/async/nested proxy context negative tests를 둡니다."),
    ],
    expertNotes: ["self-invocation 문제는 annotation 위치보다 object boundary가 잘못됐다는 design signal일 수 있습니다.", "private method annotation을 public proxy boundary처럼 기대하지 말고 transaction/security invariant를 public use case에 둡니다."],
  },
  {
    id: "exceptions-transactions-rollback",
    title: "exception transparency와 transaction rollback을 advice chain 전체에서 보존합니다",
    lead: "logging advice가 예외를 삼키거나 다른 exception으로 덮으면 caller contract와 transaction rollback rule이 동시에 깨집니다.",
    explanations: [
      "Spring declarative transaction도 proxy advice/interceptor로 구현됩니다. target/advice exception이 transaction interceptor 밖으로 전파되어 rollback rules가 평가되고 commit/rollback outcome이 결정됩니다.",
      "기본 rollback rules와 checked/runtime/custom rollbackFor는 현재 official transaction reference에서 확인하고 business exception hierarchy와 일치시킵니다. logging advice는 이를 임의로 변환하지 않습니다.",
      "after-throwing logging은 exception class/stable code, method id와 correlation만 기록하고 message/stack/args는 민감 정보가 있을 수 있어 제한된 internal trace 정책을 적용합니다. 같은 Throwable을 재throw합니다.",
      "advice logger/metric exporter 자체가 실패하면 원 target exception을 덮지 않도록 secondary failure를 suppressed/internal event로 처리합니다. finally cleanup도 target result/exception을 바꾸지 않게 합니다.",
      "commit은 target method가 return한 뒤 transaction advice unwind에서 실패할 수 있습니다. API는 target return만으로 success response를 만들지 않고 proxy invocation 전체가 완료된 뒤 결과를 확정합니다.",
    ],
    concepts: [
      c("TransactionInterceptor", "method invocation 주변에서 transaction attributes를 읽고 begin/commit/rollback을 수행하는 Spring advice입니다.", ["proxy chain에 참여합니다.", "exception/return을 기준으로 outcome을 정합니다."]),
      c("rollback rule", "어떤 Throwable type이 transaction rollback을 유발하는지 정의한 transaction attribute 정책입니다.", ["기본과 custom rules를 구분합니다.", "exception translation과 맞춥니다."]),
      c("secondary advice failure", "logging/metrics/cleanup advice 자체가 target outcome 처리 중 실패한 상태입니다.", ["원 outcome을 덮지 않습니다.", "bounded escalation을 둡니다."]),
    ],
    codeExamples: [java("core09-exception", "around advice의 exception identity와 finally 보존", "Core09Exception.java", "실제 JDK proxy가 target IllegalStateException을 after-throwing/finally로 기록하고 같은 exception instance를 caller에 전달합니다.", String.raw`import java.lang.reflect.*;
import java.util.*;

public class Core09Exception {
  interface Operation { void run(); }
  public static void main(String[] args) {
    List<String> events = new ArrayList<>();
    IllegalStateException expected = new IllegalStateException("synthetic-target-failure");
    Operation target = () -> { events.add("target"); throw expected; };
    Operation proxy = (Operation) Proxy.newProxyInstance(
        Operation.class.getClassLoader(), new Class<?>[]{Operation.class},
        (ignored, method, values) -> {
          events.add("before");
          try {
            return method.invoke(target, values);
          } catch (InvocationTargetException error) {
            Throwable cause = error.getCause();
            events.add("after-throwing:" + cause.getClass().getSimpleName());
            throw cause;
          } finally {
            events.add("finally");
          }
        });
    try { proxy.run(); }
    catch (IllegalStateException actual) {
      System.out.println("same-exception=" + (actual == expected));
      System.out.println("type=" + actual.getClass().getSimpleName());
    }
    System.out.println("events=" + events);
    System.out.println("fallback-returned=false");
  }
}`, "same-exception=true\ntype=IllegalStateException\nevents=[before, target, after-throwing:IllegalStateException, finally]\nfallback-returned=false", ["spring-aop-advice", "spring-transaction-declarative", "spring-transaction-interceptor", "java-invocation-handler"] )],
    diagnostics: [
      d("business exception인데 transaction이 commit됩니다.", "outer advice가 exception을 catch해 normal/null return으로 바꿨거나 rollback rule 밖 type으로 변환했습니다.", ["advisor order", "original/final Throwable", "transaction rule/status", "commit/rollback events"], "observability advice는 exception transparent하게 재throw하고 business translation/rollback rules를 explicit boundary에 둡니다.", "target/advice/commit exceptions의 rollback state matrix를 둡니다."),
      d("logger failure가 target exception을 덮어 root cause가 사라집니다.", "catch/finally의 secondary operation이 throw해 primary Throwable을 교체했습니다.", ["primary/suppressed chain", "logger/appender errors", "finally path", "caller exception identity"], "logging/metrics를 bounded fail-safe로 감싸고 primary outcome을 보존하며 secondary failure를 제한 채널에 기록합니다.", "logger/exporter failure injection과 same-primary-exception assertions를 둡니다."),
    ],
    expertNotes: ["transaction rollback은 DB state의 한 단계이며 external side effect/outbox/idempotency를 별도 설계합니다.", "Throwable 전체를 무조건 catch하면 Error/cancellation semantics까지 왜곡할 수 있어 advice 목적에 맞는 최소 처리만 합니다."],
  },
  {
    id: "safe-logging-redaction-timing",
    title: "로깅 advice를 schema allow-list·redaction·correlation·단조 시간으로 만듭니다",
    lead: "method args/toString 전체 기록은 password·token·본문·파일·세션 객체를 유출하고 label cardinality와 serialization side effect를 만듭니다.",
    explanations: [
      "원본 advice는 target/signature/arguments를 직접 기록하는 학습 형태입니다. production에서는 method operation id, argument count/type/sensitivity categories, outcome/error code, duration bucket, trace/request id와 version만 허용합니다.",
      "@Sensitive/field classification 또는 operation schema에서 values를 DROP/HASH/TOKENIZE하되 password/token는 hash조차 correlation risk가 있어 보통 완전 제거합니다. DTO toString과 reflection deep serialization을 사용하지 않습니다.",
      "로그 parameterized formatting은 불필요한 string 생성에 도움을 주지만 이미 값을 전달하면 redaction이 되는 것은 아닙니다. redaction은 logger 호출 전 structured schema에서 강제하고 appender/APM/export도 동일 policy를 검증합니다.",
      "duration은 System.nanoTime 같은 monotonic source의 difference로 측정하고 wall-clock currentTimeMillis는 timestamp에 사용합니다. seconds 변환/rounding은 안정 bucket/histogram으로 하고 raw high-cardinality method signature를 label로 남기지 않습니다.",
      "correlation id도 외부 header를 그대로 신뢰/log label로 쓰지 않고 길이/charset을 검증하거나 server-generated trace id를 사용합니다. async boundary에는 approved fields만 명시적으로 전파하고 finally cleanup합니다.",
    ],
    concepts: [
      c("structured log schema", "허용된 field names/types/cardinality/sensitivity와 retention을 정의한 machine-readable logging contract입니다.", ["allow-list 방식입니다.", "advice와 exporters에 적용합니다."]),
      c("redaction", "민감 value가 log/metric/trace/error에 도달하지 않도록 drop/mask/tokenize하는 정책입니다.", ["source schema에서 적용합니다.", "secret은 완전 제거를 우선합니다."]),
      c("monotonic duration", "wall clock 조정과 무관하게 증가하는 clock difference로 측정한 elapsed time입니다.", ["System.nanoTime difference를 사용합니다.", "absolute timestamp가 아닙니다."]),
    ],
    codeExamples: [java("core09-safe-log", "값 없는 argument metadata와 redacted event", "Core09SafeLog.java", "sensitivity schema로 raw values를 버리고 method id, types/count, redacted count, outcome와 duration bucket만 출력합니다.", String.raw`import java.util.*;

public class Core09SafeLog {
  enum Sensitivity { PUBLIC, PRIVATE, SECRET }
  record Argument(String type, Sensitivity sensitivity) {}
  record Event(String operation, List<String> argumentTypes, int redacted, String outcome, String durationBucket) {}
  static Event event(String operation, List<Argument> arguments, String outcome) {
    List<String> types = arguments.stream().map(Argument::type).toList();
    int redacted = (int) arguments.stream().filter(argument -> argument.sensitivity() != Sensitivity.PUBLIC).count();
    return new Event(operation, types, redacted, outcome, "lt-10ms");
  }
  public static void main(String[] args) {
    Event event = event("catalog.create", List.of(
        new Argument("String", Sensitivity.PUBLIC),
        new Argument("Credential", Sensitivity.SECRET),
        new Argument("Profile", Sensitivity.PRIVATE)), "SUCCESS");
    System.out.println("operation=" + event.operation());
    System.out.println("argument-types=" + event.argumentTypes());
    System.out.println("argument-count=" + event.argumentTypes().size());
    System.out.println("redacted-count=" + event.redacted());
    System.out.println("outcome=" + event.outcome());
    System.out.println("duration=" + event.durationBucket());
    System.out.println("raw-values-present=false");
  }
}`, "operation=catalog.create\nargument-types=[String, Credential, Profile]\nargument-count=3\nredacted-count=2\noutcome=SUCCESS\nduration=lt-10ms\nraw-values-present=false", ["spring-aop-advice", "spring-order", "java-invocation-handler"] )],
    diagnostics: [
      d("AOP log에 password/token/본문이 노출됩니다.", "jp args/target/toString을 raw 기록하고 sensitivity schema가 없습니다.", ["advice/logger calls", "DTO toString", "APM attributes", "logs/backups/retention"], "raw argument/result logging을 중지하고 allow-listed operation/type/count/outcome schema로 교체하며 노출 secret을 rotate/삭제합니다.", "synthetic secret/PII canary와 end-to-end exporter zero-leak tests를 둡니다."),
      d("method signature/user id가 metric label이 되어 cardinality가 폭증합니다.", "unbounded args/signatures/correlation values를 tags로 사용했습니다.", ["unique label counts", "top series/memory", "tag schema", "raw external ids"], "stable operation enum, outcome/error class와 bounded buckets만 tags로 사용하고 IDs는 sampled trace fields로 제한합니다.", "cardinality budget/unit tests와 production alert를 둡니다."),
    ],
    expertNotes: ["redaction regex는 최후 방어이며 가장 안전한 설계는 민감 value를 advice가 처음부터 받거나 serialize하지 않는 것입니다.", "exception message와 class fields도 input/SQL/endpoint를 포함할 수 있어 stable error mapping이 필요합니다."],
  },
  {
    id: "async-reactive-context-boundaries",
    title: "@Async·future·reactive 반환에서 method return과 작업 완료를 구분합니다",
    lead: "동기 around advice가 method 호출 시간을 재도 비동기 작업은 return 후 다른 thread/context에서 실패하거나 완료할 수 있습니다.",
    explanations: [
      "@Async 역시 proxy 기반이므로 self-invocation과 public/proxy boundary를 고려합니다. proxy method는 Future/CompletionStage 또는 void를 빨리 반환하고 실제 work/exception은 executor thread에서 발생합니다.",
      "동기 around timer의 finally는 Future object 반환까지 측정할 뿐 작업 completion latency가 아닙니다. CompletionStage callback 또는 framework observability integration으로 success/error/cancel과 duration을 종료합니다.",
      "reactive Publisher는 subscription 때 실행될 수 있어 method return에서 logging/transaction scope를 끝내면 실제 signal과 다릅니다. Reactor Context/observation operator와 reactive transaction support를 사용하고 ThreadLocal을 그대로 가정하지 않습니다.",
      "MDC/security/request context propagation은 approved immutable fields를 capture하고 executor/task/reactive context에서 finally cleanup합니다. scoped proxy/request bean을 request 종료 뒤 async task로 넘기지 않습니다.",
      "cancellation, timeout, executor rejection과 application shutdown을 separate outcomes로 기록합니다. advice가 cancellation/interruption을 일반 ERROR로 삼키지 않고 protocol을 보존합니다.",
    ],
    concepts: [
      c("async completion", "proxy method가 반환한 handle의 작업이 이후 success/error/cancel로 끝나는 별도 lifecycle입니다.", ["method return과 다릅니다.", "completion hook에서 측정합니다."]),
      c("context propagation", "trace/security/tenant 등 승인된 context를 execution boundary 너머로 capture/restore/cleanup하는 과정입니다.", ["ThreadLocal 복사와 다를 수 있습니다.", "field allow-list를 둡니다."]),
      c("reactive subscription", "Publisher pipeline이 subscriber에 의해 시작되고 signals로 결과/오류/완료를 전달하는 실행 경계입니다.", ["method assembly return과 구분합니다.", "reactive-aware advice를 사용합니다."]),
    ],
    diagnostics: [
      d("AOP latency는 1ms인데 실제 async 작업은 수초 걸립니다.", "around가 Future 생성/submit까지만 측정하고 completion을 관측하지 않았습니다.", ["return type", "timer stop point", "completion callbacks", "queue/run latency"], "return handle에 success/error/cancel completion instrumentation을 붙이고 queue/run/total을 분리합니다.", "completed/failed/cancelled/rejected future timing tests를 둡니다."),
      d("async log/권한에 이전 request context가 섞입니다.", "ThreadLocal/MDC를 executor에서 restore/remove하지 않거나 request scoped target을 넘겼습니다.", ["capture/restore/remove", "executor thread reuse", "request lifetime", "approved context fields"], "immutable safe context snapshot과 task wrapper finally cleanup을 사용하고 request bean 대신 필요한 values만 전달합니다.", "single-worker cross-request exception/cancel propagation tests를 둡니다."),
    ],
    expertNotes: ["동기/async/reactive method는 같은 @Around source를 공유해도 execution completion semantics가 다릅니다.", "instrumentation callback도 backpressure/threading을 바꾸지 않도록 non-blocking/bounded하게 설계합니다."],
  },
  {
    id: "performance-overhead-cardinality",
    title: "proxy/advice overhead를 target latency·allocation·contention·cardinality와 함께 측정합니다",
    lead: "proxy 호출 비용만 nano benchmark하거나 AOP가 느리다고 추측하면 실제 logging I/O, reflection, serialization과 downstream latency를 놓칩니다.",
    explanations: [
      "baseline target, JDK proxy, CGLIB proxy와 full advice chain을 warmup된 benchmark에서 비교하고 throughput/p50/p99, allocations, lock/contention와 JIT profile을 봅니다. System.nanoTime loop 하나를 정밀 benchmark로 오해하지 않습니다.",
      "대부분의 I/O service에서는 proxy dispatch보다 argument serialization, stack trace, synchronous appender, metric high cardinality와 remote exporter가 더 큽니다. concern별 비용을 enable/disable differential로 분리합니다.",
      "pointcut dynamic match, reflection deep inspection와 annotations scan을 invocation마다 하지 않고 startup/static metadata를 cache합니다. cache는 classloader/AOT/redeploy lifetime과 memory를 고려합니다.",
      "sampling은 tail/error/security audit 요구를 고려합니다. 모든 successful high-QPS call의 verbose log를 줄이되 errors도 raw data를 기록하지 않고 stable event schema를 유지합니다.",
      "성능 최적화가 advice ordering, exception transparency와 redaction을 깨뜨리지 않게 functional/security tests를 같은 release gate에서 실행합니다.",
    ],
    concepts: [
      c("proxy overhead", "proxy dispatch, match, interceptor traversal과 reflection에 추가되는 호출 비용입니다.", ["target 비용과 분리합니다.", "runtime/JIT에 따라 측정합니다."]),
      c("instrumentation allocation", "logging/metrics/trace metadata를 만들며 호출마다 발생하는 임시 objects/strings/arrays입니다.", ["disabled path도 측정합니다.", "raw serialization을 피합니다."]),
      c("cardinality budget", "operation/tag/event key의 허용 unique 수와 storage/export 비용 상한입니다.", ["unbounded values를 금지합니다.", "release/운영 alert를 둡니다."]),
    ],
    diagnostics: [
      d("AOP 적용 뒤 CPU/GC/p99가 급증합니다.", "args/result toString, stack capture와 synchronous log/export가 hot path에 추가됐습니다.", ["allocation profile", "appender/export blocking", "pointcut match cost", "baseline/proxy/advice differential"], "structured metadata만 만들고 lazy formatting, bounded async export/sampling과 static match cache를 적용합니다.", "production-like benchmark/load와 allocation/p99/cardinality budgets를 둡니다."),
      d("benchmark 결과가 실행마다 크게 달라집니다.", "warmup/JIT/dead-code/clock/target I/O를 통제하지 않은 ad-hoc loop입니다.", ["benchmark harness/forks", "warmup", "result consumption", "environment/JDK/proxy versions"], "JMH 같은 검증된 harness와 multiple forks를 사용하고 production load telemetry로 교차 확인합니다.", "versioned benchmark config와 statistical regression threshold를 둡니다."),
    ],
    expertNotes: ["관측을 제거해 빠르게 만드는 것보다 필요한 evidence를 가장 낮은 비용/민감도로 만드는 것이 목표입니다.", "성능 수치는 hardware/JDK/Spring/pointcut/advice/logger 설정과 함께 versioned evidence로 보관합니다."],
  },
  {
    id: "aop-testing-observability-upgrade",
    title: "proxy/advisor inventory·failure matrix·canary로 AOP를 지속 검증합니다",
    lead: "context가 뜨고 annotation이 보이는 것만으로 실제 method coverage, order, rollback, redaction과 overhead는 증명되지 않습니다.",
    explanations: [
      "startup manifest에는 bean/proxy mechanism, target type, advisor ids/order, pointcut/annotation ids, required methods와 framework/JDK/config version을 값 없이 기록합니다. raw expression/package internals도 필요 최소로 제한합니다.",
      "unit test는 pointcut truth table, redactor, event state machine을 빠르게 검증하고 Spring context integration은 actual proxy type/Advised chain, external/self calls, normal/throw/commit와 async completion을 실행합니다.",
      "failure matrix는 pointcut mismatch, final/private, duplicate aspect, advice before/proceed/after failure, target exception, transaction commit failure, logger/export failure, cancellation와 scope/context leak을 포함합니다.",
      "security tests는 sensitive args/result/exception/MDC가 log/metric/trace/backup에 없는지 synthetic canary로 end-to-end 검증하고 노출 시 rotation/deletion/access incident path를 rehearsal합니다.",
      "Spring/AspectJ/JDK/logger/transaction manager upgrade는 matched surface, proxy type, order/events, rollback, latency/allocation와 artifacts를 canary 비교하고 threshold 위반 시 code+configuration을 rollback합니다.",
    ],
    concepts: [
      c("advisor manifest", "각 proxied bean/method에 적용되는 advisors, precedence와 mechanism을 정규화한 secret-free runtime artifact입니다.", ["source와 runtime drift를 찾습니다.", "upgrade diff로 사용합니다."]),
      c("AOP conformance matrix", "proxy/type/pointcut/order/return/throw/self/async/transaction/logging 조합별 기대 behavior입니다.", ["지원 versions에서 실행합니다.", "negative paths를 포함합니다."]),
      c("advice event state machine", "matched invocation이 before→target→return/throw→finally 및 transaction outcome으로 진행하는 허용 상태 전이입니다.", ["proceed count를 포함합니다.", "telemetry validation에 사용합니다."]),
    ],
    diagnostics: [
      d("새 release에서 일부 beans만 proxy/advisor가 사라졌습니다.", "auto-proxy configuration/component scan/pointcut refactor drift를 runtime manifest로 비교하지 않았습니다.", ["old/new advisor manifest", "bean definition sources", "proxy creator settings", "must-be-advised methods"], "required method→advisor coverage assertion과 startup manifest diff를 fail-fast/canary gate로 둡니다.", "rename/new implementation/config merge differential tests를 둡니다."),
      d("incident에 로그는 많지만 exception/transaction 순서를 알 수 없습니다.", "raw message 중심이고 stable event/operation/advisor/transaction outcome가 없습니다.", ["event schema/order", "trace correlation", "commit/rollback events", "raw-value leakage"], "bounded invocation/advisor stage와 transaction outcome events를 correlation하고 raw args/messages는 제외합니다.", "normal/throw/commit-failure golden trace와 incident query drill을 둡니다."),
    ],
    expertNotes: ["proxy/advisor manifest는 내부 architecture 정보이므로 접근 통제하면서도 배포 검증에 필요한 stable ids만 유지합니다.", "AOP test는 mock aspect method 호출보다 실제 caller→proxy→target invocation을 증명해야 합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-log-advice", repository: "SPRING/MyWeb", path: "src/main/java/com/team404/util/aop/LogAdvice.java", usedFor: ["annotation aspect, broad around advice, proceed/timing/logging/exception learning progression and production hardening gaps"], evidence: "read-only로 78 lines/2,019 bytes를 확인했으며 package/pointcut/arguments/stack 출력은 복사하지 않았습니다." },
  { id: "local-aop-context", repository: "SPRING/MyWeb", path: "src/main/webapp/WEB-INF/config/aop-context.xml", usedFor: ["auto-proxy enablement and aspect component registration progression"], evidence: "read-only로 15 lines/887 bytes를 확인했으며 package/schema literal은 예제에 복사하지 않았습니다." },
  { id: "spring-aop-reference", repository: "Spring Framework Reference", path: "Aspect Oriented Programming with Spring", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop.html", usedFor: ["AOP vocabulary, goals, proxy-based method execution and advice model"], evidence: "Spring 공식 AOP reference입니다." },
  { id: "spring-proxying", repository: "Spring Framework Reference", path: "Proxying Mechanisms", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", usedFor: ["JDK/CGLIB selection, final/private/module constraints and self invocation"], evidence: "Spring 공식 proxying reference입니다." },
  { id: "spring-ataspectj", repository: "Spring Framework Reference", path: "@AspectJ Support", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/ataspectj.html", usedFor: ["aspect enablement, declaration and auto-proxy support"], evidence: "Spring 공식 @AspectJ reference입니다." },
  { id: "spring-aop-pointcuts", repository: "Spring Framework Reference", path: "Declaring a Pointcut", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/pointcuts.html", usedFor: ["supported designators, execution expressions, annotation and matching semantics"], evidence: "Spring 공식 pointcut reference입니다." },
  { id: "spring-aop-advice", repository: "Spring Framework Reference", path: "Declaring Advice", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/advice.html", usedFor: ["before/after returning/throwing/after/around, proceed and order semantics"], evidence: "Spring 공식 advice reference입니다." },
  { id: "spring-transaction-declarative", repository: "Spring Framework Reference", path: "Declarative Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html", usedFor: ["proxy transaction implementation, rollback and self-invocation implications"], evidence: "Spring 공식 declarative transaction reference입니다." },
  { id: "spring-proxy-factory", repository: "Spring Framework Javadoc", path: "ProxyFactory", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/framework/ProxyFactory.html", usedFor: ["programmatic AOP proxy composition and target/interfaces"], evidence: "Spring 공식 ProxyFactory API입니다." },
  { id: "spring-aop-proxy", repository: "Spring Framework Javadoc", path: "AopProxy", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/framework/AopProxy.html", usedFor: ["AOP proxy creation contract"], evidence: "Spring 공식 AopProxy API입니다." },
  { id: "spring-advised", repository: "Spring Framework Javadoc", path: "Advised", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/framework/Advised.html", usedFor: ["runtime advisors/interfaces/frozen/target metadata inventory"], evidence: "Spring 공식 Advised API입니다." },
  { id: "spring-aop-context", repository: "Spring Framework Javadoc", path: "AopContext", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/framework/AopContext.html", usedFor: ["current proxy exposure and discouraged coupling caveat"], evidence: "Spring 공식 AopContext API입니다." },
  { id: "spring-order", repository: "Spring Framework Javadoc", path: "@Order", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html", usedFor: ["advice/aspect precedence metadata"], evidence: "Spring 공식 @Order API입니다." },
  { id: "spring-transaction-interceptor", repository: "Spring Framework Javadoc", path: "TransactionInterceptor", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/interceptor/TransactionInterceptor.html", usedFor: ["transaction advice and thread safety contract"], evidence: "Spring 공식 TransactionInterceptor API입니다." },
  { id: "spring-cglib-enhancer", repository: "Spring Framework Javadoc", path: "Enhancer", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/cglib/proxy/Enhancer.html", usedFor: ["class proxy generation and interception limitations"], evidence: "Spring 공식 repackaged CGLIB Enhancer API입니다." },
  { id: "java-proxy", repository: "Java SE 21 API", path: "java.lang.reflect.Proxy", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html", usedFor: ["JDK interface proxy class and Object method behavior"], evidence: "Oracle JDK 공식 Proxy API입니다." },
  { id: "java-invocation-handler", repository: "Java SE 21 API", path: "java.lang.reflect.InvocationHandler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/InvocationHandler.html", usedFor: ["JDK proxy invocation/return/throw contract"], evidence: "Oracle JDK 공식 InvocationHandler API입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-09-aop-proxy-advice", slug: "spring-core-09-aop-proxy-advice", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 9,
  title: "AOP 프록시와 로깅 Advice 실행 순서", subtitle: "JDK/CGLIB proxy·pointcut·ordered advice·self-invocation·transaction exception·safe logging·async/performance를 실제 호출 경로로 검증합니다.", level: "고급", estimatedMinutes: 95,
  coreQuestion: "어떤 caller/method가 어느 proxy와 advisor chain을 통과하고, 정상·예외·transaction·async 경로에서 순서·결과·redaction·성능 contract가 보존됨을 어떻게 증명할까요?",
  summary: "MyWeb의 LogAdvice.java와 aop-context.xml을 read-only로 감사해 auto-proxy, component-scanned aspect와 service around advice progression을 구조 provenance로 사용합니다. 기존 raw target/argument logging, Throwable swallow/stack trace와 wall-clock timing은 복사하지 않고 production-safe 원칙으로 교정합니다. AOP vocabulary/pipeline, JDK vs CGLIB type/final/module, around proceed/return/throw, architecture pointcut surface, advice types/order/transaction/cache nesting, self-invocation, exception transparency/rollback, structured redaction/monotonic timing, async/reactive completion, proxy/logging overhead/cardinality와 runtime manifest/failure/upgrade governance까지 초보에서 운영 전문가로 연결합니다. 여섯 JDK 21 examples는 실제 JDK proxy, pointcut truth table, advice nesting, self-call bypass, exception identity와 safe logging을 실행합니다.",
  objectives: ["aspect/join point/pointcut/advice/target/proxy/advisor chain을 호출 pipeline으로 설명한다.", "JDK/CGLIB proxy의 type/final/module/AOT와 injection 제약을 검증한다.", "around proceed exactly-once와 return/exception transparency를 지킨다.", "pointcut match surface와 positive/negative architecture truth table을 유지한다.", "advice types/order와 transaction/security/cache nesting을 event diagram으로 검증한다.", "self-invocation과 async/reactive completion boundary를 구조적으로 해결한다.", "raw values 없는 logging/redaction/timing과 performance/cardinality budgets를 운영한다.", "advisor manifest·failure matrix·upgrade canary로 runtime AOP coverage를 증명한다."],
  prerequisites: [{ title: "singleton·prototype scope와 빈 생명주기 보강", reason: "proxy facade/target identity와 bean lifecycle을 이해한 뒤 AOP proxy가 target method invocation을 감싸는 구조로 확장합니다.", sessionSlug: "spring-core-08-scope-lifecycle" }],
  keywords: ["AOP", "aspect", "join point", "pointcut", "advice", "around", "proxy", "JDK dynamic proxy", "CGLIB", "ProceedingJoinPoint", "@Order", "self-invocation", "TransactionInterceptor", "redaction", "System.nanoTime", "advisor manifest"], topics,
  lab: {
    title: "service AOP를 exception-transparent·transaction-aware·secret-zero advisor chain으로 재설계하기",
    scenario: "legacy broad around advice가 target/arguments를 raw log하고 Throwable을 삼키며, proxy type/order/self-call/transaction/async completion과 overhead evidence가 없습니다.",
    setup: ["두 원본은 read-only provenance로 보존하고 package/pointcut/argument/stack/config literals를 공개 예제에 복사하지 않습니다.", "JDK 21 exact harness와 별도로 supported Spring/AspectJ/JDK/logger/transaction test contexts, JDK/CGLIB target fixtures를 준비합니다.", "must/must-not-match methods, proxy mechanism, advisor order/events, sensitive fields, transaction and async outcomes 표를 작성합니다.", "normal/return/throw/commit/logger/advice/cancel/self/final/private/duplicate-aspect failure points를 고정합니다."],
    steps: ["container beans의 proxy/target type과 resolved advisor/order manifest를 값 없이 생성합니다.", "broad package wildcard를 marker annotation/interface와 positive/negative pointcut truth table로 제한합니다.", "JDK/CGLIB modes에서 injection/runtime type, final/private/visibility와 AOT hints를 검증합니다.", "around advice가 proceed exactly once, return과 same Throwable을 보존하는지 spy로 확인합니다.", "before/return/throw/finally와 transaction/security/metrics/cache desired event diagram을 만들고 actual order를 비교합니다.", "self/external inner calls의 advisor/transaction counts를 확인하고 separate collaborator로 refactor합니다.", "target/commit/advice/logger exceptions에서 primary outcome와 rollback을 fault-test합니다.", "raw args/result/message를 제거하고 operation/type/count/redacted/outcome/duration bucket schema와 canary scan을 적용합니다.", "CompletionStage/cancel/reject와 reactive signal completion을 type-aware instrumentation으로 검증합니다.", "baseline/JDK/CGLIB/full chain의 latency/allocation/contention/cardinality를 production-like benchmark/load로 측정합니다.", "canary에서 matched surface/order/rollback/log zero-leak/performance를 old/new version과 비교합니다.", "incident runbook으로 missing/duplicate advice, leak, rollback와 log exposure의 rollback/rotation/deletion을 rehearsal합니다."],
    expectedResult: ["required external calls만 정확히 한 proxy/advisor chain을 통과하고 excluded/final/self cases가 명시적 evidence를 가집니다.", "normal·target throw·commit failure에서 proceed/return/exception/rollback와 advice event order가 contract와 같습니다.", "self invocation은 제거되거나 명시된 weaving/proxy strategy로 test되고 async completion outcome이 실제 작업 종료와 일치합니다.", "logs/metrics/traces/artifacts에 raw argument/result/credential/PII가 없고 label cardinality가 budget 안입니다.", "proxy/advice overhead와 framework/logger upgrade가 canary thresholds를 만족하거나 안전하게 rollback됩니다."],
    cleanup: ["disposable Spring contexts, executors, test transactions/rows와 logger/exporter fixtures를 종료·삭제합니다.", "MDC/ThreadLocal/async callbacks를 cleanup하고 active spans/resources가 zero인지 확인합니다.", "synthetic secret/PII canary가 logs/traces/backups에 없는지 검사하고 test artifacts를 삭제합니다.", "원본 LogAdvice.java/aop-context.xml과 production data/configuration은 변경하지 않습니다."],
    extensions: ["advisor manifest와 must-be-advised architecture rule을 CI plugin으로 만듭니다.", "AspectJ weaving과 Spring proxy의 self/private/final coverage를 differential lab으로 비교합니다.", "Micrometer Observation/transaction/logging order와 async context propagation을 통합합니다.", "JMH proxy/advice benchmark와 production cardinality/p99 dashboard를 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행하고 caller→proxy→advice→target→unwind 증거를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "JDK proxy runtime interface와 before/return/finally를 추적합니다.", "pointcut 1 positive/3 negative를 설명합니다.", "metrics/transaction nested event 순서를 그립니다.", "outer self-call과 external inner interception count를 비교합니다.", "same exception identity와 fallback 없음/rollback 신호를 설명합니다.", "safe log에 raw values가 없고 redacted count가 맞는지 확인합니다."], hints: ["호출을 들어가는 방향과 return/throw로 나오는 방향을 서로 다른 화살표로 그리세요."], expectedOutcome: "AOP를 annotation 문법이 아니라 검증 가능한 proxy call stack으로 설명합니다.", solutionOutline: ["resolve proxy→match→order→proceed→target→unwind→observe 순서입니다."] },
    { difficulty: "응용", prompt: "원본 로깅 advice를 production-safe service advisor chain으로 교정하세요.", requirements: ["원본은 structural provenance로만 사용합니다.", "pointcut match surface와 exclusions를 inventory합니다.", "JDK/CGLIB/self/final matrix를 검증합니다.", "proceed/result/Throwable transparency를 적용합니다.", "transaction/metrics/security/cache order를 test합니다.", "structured redaction와 monotonic timing을 적용합니다.", "async completion과 context cleanup을 다룹니다.", "performance/cardinality/upgrade canary와 incident runbook을 포함합니다."], hints: ["catch해서 로그를 남기는 것과 exception을 처리 완료하는 것을 구분하세요."], expectedOutcome: "business/transaction semantics와 민감정보를 해치지 않는 관측 AOP가 완성됩니다.", solutionOutline: ["audit→narrow match→select proxy→preserve control flow→order→redact→measure→qualify 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring AOP/proxy/advice governance와 release gate를 작성하세요.", requirements: ["허용 concerns와 public proxy boundary를 정의합니다.", "JDK/CGLIB/final/AOT/interface 정책을 둡니다.", "pointcut surface/annotation/negative coverage를 둡니다.", "proceed/return/throw/self/async rules를 정의합니다.", "advisor order/transaction/cache/security event contract를 둡니다.", "logging redaction/cardinality/timing schema를 요구합니다.", "performance/failure/security/conformance matrix를 요구합니다.", "manifest/canary/rollback/incident 대응을 포함합니다."], hints: ["source annotation 목록보다 runtime advisor manifest와 normal/exception event trace를 승인 기준으로 삼으세요."], expectedOutcome: "AOP 선언부터 운영 사고/upgrade까지 일관된 proxy governance가 완성됩니다.", solutionOutline: ["classify→match→proxy→order→preserve→sanitize→measure→observe→rollback 순서입니다."] },
  ],
  nextSessions: ["mvc-01-project-bootstrap-dispatcher"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["LogAdvice.java는 read-only로 78 lines/2,019 bytes를 확인했고 SHA-256은 BF6CB82C43820667865B173FF28DD51756F43D3D155E453782A9D45A3981AEBE입니다.", "aop-context.xml은 read-only로 15 lines/887 bytes를 확인했고 SHA-256은 9C77D7CDB57F6EBC33B8920EC5923AFA47FBC4020AD790AEB7E2A5056DEC3ABC입니다.", "원본의 auto-proxy/component aspect/around progression만 사용했고 package/pointcut/args/stack/config literals와 raw target logging은 복사하지 않았습니다. Throwable swallow/null return과 wall-clock timing은 exception-transparent redacted monotonic contract로 교정했습니다.", "JDK-only examples는 실제 Spring Advisor/AspectJ expression/CGLIB/TransactionInterceptor/async/reactive/AOT behavior를 대체하지 않습니다."] },
});

export default session;
