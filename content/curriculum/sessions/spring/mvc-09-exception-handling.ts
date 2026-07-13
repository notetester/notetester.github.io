import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 21 exception types·records·collections로 domain/infrastructure failures와 HTTP response policy를 Spring jar 없이 모델링합니다." },
      { lines: "19-끝에서 6줄 전", explanation: "exception/cause matching, resolver order, transaction/file compensation과 public response redaction을 결정적인 상태 전이로 실행합니다." },
      { lines: "마지막 6줄", explanation: "status, stable code, retryability, selected resolver, cleanup state와 public detail처럼 안전한 evidence만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/Servlet/DB/filesystem/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "교육용 exception router는 실제 Spring HandlerExceptionResolver와 Servlet error dispatch를 대체하지 않습니다."] },
    experiments: [
      { change: "root/cause type, advice/resolver order, response committed state와 partial side effects를 바꿉니다.", prediction: "선택된 handler, status/retry와 cleanup 가능성이 서로 다른 evidence로 나타납니다.", result: "예상 taxonomy/trace와 실제 stdout을 비교합니다." },
      { change: "같은 failures를 MockMvc와 target Servlet container에서 실행합니다.", prediction: "binding/method validation, async wrappers, media negotiation와 container ERROR dispatch가 추가됩니다.", result: "status/headers/problem or view, resolver name, transaction/files, logs zero-leak을 readback합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "exception-taxonomy-boundary",
    title: "예외를 error page 한 장이 아니라 domain·client·dependency·bug taxonomy와 HTTP 계약으로 분류합니다",
    lead: "controller가 모든 실패를 문자열 view로 반환하면 status, retryability, rollback과 root cause가 사라지므로 lower layer가 의미 있는 exceptions/outcomes를 던지고 web adapter가 HTTP로 변환합니다.",
    explanations: [
      "원본 BoardController는 file/DB/password/detail flows에서 broad catch 또는 result/null 분기로 board/error view를 반환합니다. 이 세션은 구조적 progression만 사용하며 upload path, request values나 domain data는 복사하지 않습니다.",
      "invalid input/binding은 400 계열, resource absence는 404, version/uniqueness conflict는 409, authenticated-but-forbidden은 403, dependency unavailability는 503, unexpected bug는 500처럼 의미를 구분합니다. 실제 API policy를 문서화합니다.",
      "exception type은 layer contract입니다. SQLException/FileSystemException 같은 infrastructure detail을 controller까지 직접 전파하기보다 repository/storage adapter가 stable application exception과 safe metadata로 변환합니다.",
      "정상적인 not-found를 null/NPE로 발견하지 않고 Optional/result 또는 NotFoundException 같은 명시적 outcome을 사용합니다. 모든 business rejection을 exception으로 만들 필요는 없지만 HTTP adapter가 상태를 잃지 않아야 합니다.",
      "public response는 사용자가 할 수 있는 action과 stable code만 제공하고 root stack/message는 protected telemetry에 한 번 기록합니다. 같은 exception을 여러 layer에서 반복 error-log하지 않습니다.",
    ],
    concepts: [
      c("exception taxonomy", "failure를 client input, absence, authorization, conflict, dependency, rate/timeout와 unexpected bug 등 의미별로 분류한 체계입니다.", ["status/retry/owner를 연결합니다.", "implementation exception과 분리합니다."]),
      c("HTTP error contract", "failure category를 status, headers, representation, stable code와 retry policy로 공개하는 versioned 규칙입니다.", ["HTML/API representations를 지원할 수 있습니다.", "internal message를 노출하지 않습니다."]),
      c("exception translation", "lower-level vendor/infrastructure exception을 상위 layer가 이해하는 stable application category로 바꾸는 작업입니다.", ["cause/evidence를 내부 보존합니다.", "public secret/PII는 제거합니다."]),
    ],
    codeExamples: [java("mvc09-taxonomy", "application exception을 status·code·retry로 분류", "Mvc09Taxonomy.java", "명시적 application exception types를 public HTTP outcome으로 exhaustive하게 변환합니다.", String.raw`public class Mvc09Taxonomy {
  static class NotFound extends RuntimeException {}
  static class Conflict extends RuntimeException {}
  static class DependencyUnavailable extends RuntimeException {}
  record Error(int status, String code, boolean retryable) {}
  static Error classify(Throwable error) {
    if (error instanceof IllegalArgumentException) return new Error(400, "invalid-request", false);
    if (error instanceof NotFound) return new Error(404, "not-found", false);
    if (error instanceof Conflict) return new Error(409, "conflict", false);
    if (error instanceof DependencyUnavailable) return new Error(503, "dependency-unavailable", true);
    return new Error(500, "internal-error", false);
  }
  public static void main(String[] args) {
    System.out.println("invalid=" + classify(new IllegalArgumentException()));
    System.out.println("missing=" + classify(new NotFound()));
    System.out.println("conflict=" + classify(new Conflict()));
    System.out.println("dependency=" + classify(new DependencyUnavailable()));
    System.out.println("bug=" + classify(new NullPointerException()));
  }
}`, "invalid=Error[status=400, code=invalid-request, retryable=false]\nmissing=Error[status=404, code=not-found, retryable=false]\nconflict=Error[status=409, code=conflict, retryable=false]\ndependency=Error[status=503, code=dependency-unavailable, retryable=true]\nbug=Error[status=500, code=internal-error, retryable=false]", ["local-board-controller", "spring-exception-handler", "spring-error-responses", "rfc9110"])],
    diagnostics: [
      d("DB/file 실패도 200 error view로 반환됩니다.", "controller가 exception/status를 삼키고 일반 view name만 반환했습니다.", ["HTTP status", "controller branches", "exception translation", "transaction outcome", "selected view"], "failure taxonomy를 application exceptions/outcomes로 만들고 advice가 적절한 4xx/5xx+view/problem을 반환합니다.", "status/body/view contract tests와 downstream fault tests를 둡니다."),
      d("모든 RuntimeException이 400입니다.", "broad handler가 client 오류와 server bug를 구분하지 않습니다.", ["handler signature", "exception hierarchy", "resolver order", "root cause", "response"], "specific application exceptions를 우선 mapping하고 unknown은 generic 500으로 처리합니다.", "새 exception type unmapped/unknown negative tests를 둡니다."),
    ],
    expertNotes: ["status mapping은 예외 class 이름이 아니라 client가 요청을 수정할 수 있는지와 resource/dependency/server state 의미를 반영합니다.", "retryable=true도 method idempotency, Retry-After와 timeout-after-commit reconciliation 없이는 자동 재시도를 허용하지 않습니다."],
  },
  {
    id: "exceptionhandler-matching",
    title: "@ExceptionHandler의 root·cause·specificity와 rethrow semantics를 실제 chain으로 검증합니다",
    lead: "handler method는 선언한 exception types에 맞춰 top-level 또는 cause를 match할 수 있고 한 advice 안의 root match 우선, 여러 advice의 order가 결합되어 직관과 다른 선택이 생길 수 있습니다.",
    explanations: [
      "@ExceptionHandler는 method annotation value 또는 parameter exception type으로 대상 exceptions를 선언합니다. 가능한 한 구체적인 handler signature로 ambiguity와 wrong casts를 줄입니다.",
      "wrapper exception의 immediate/deep cause가 match될 수 있지만 전달되는 exception instance와 actual matching cause가 다를 수 있습니다. root/cause chain을 안전하게 순회하고 cycle/depth limit을 둡니다.",
      "같은 controller/advice 안에서는 root exception match가 cause match보다 선호될 수 있지만 여러 ordered advice 사이에서는 높은 priority advice의 cause match가 낮은 advice의 root match보다 먼저일 수 있습니다.",
      "handler가 현재 instance를 처리하지 않기로 하면 원래 exception을 다시 던져 remaining resolution chain에 맡길 수 있습니다. 새 wrapper를 만들면 original matching/evidence를 바꿀 수 있습니다.",
      "Exception.class catch-all은 마지막 fallback에만 두고 local controller handlers와 global advice의 ownership을 정합니다. feature-specific errors가 generic advice에 가려지지 않게 tests를 둡니다.",
    ],
    concepts: [
      c("root exception match", "HandlerExceptionResolver에 전달된 top-level exception type이 handler 선언과 맞는 경우입니다.", ["한 advice 내 cause match보다 우선할 수 있습니다.", "wrapper behavior를 테스트합니다."]),
      c("cause match", "top-level exception의 cause chain 안에 handler가 선언한 exception type이 있는 경우입니다.", ["advice order와 결합됩니다.", "actual matching cause를 안전하게 찾습니다."]),
      c("rethrow", "matched handler가 해당 instance 처리를 포기하고 원래 exception을 다시 전파해 뒤 resolver가 처리하도록 하는 동작입니다.", ["원본 instance를 유지합니다.", "partial response가 없어야 합니다."]),
    ],
    codeExamples: [java("mvc09-cause-chain", "wrapper에서 가장 구체적인 known cause 찾기", "Mvc09Causes.java", "bounded cause chain을 수집하고 wrapper 안의 NotFound를 stable category로 선택합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mvc09Causes {
  static class NotFound extends RuntimeException { NotFound(String message) { super(message); } }
  static List<String> chain(Throwable error) {
    List<String> names = new ArrayList<>();
    for (Throwable current = error; current != null && names.size() < 8; current = current.getCause()) names.add(current.getClass().getSimpleName());
    return List.copyOf(names);
  }
  static String category(Throwable error) {
    for (Throwable current = error; current != null; current = current.getCause()) if (current instanceof NotFound) return "not-found";
    return "internal-error";
  }
  public static void main(String[] args) {
    Throwable wrapped = new IllegalStateException("wrapper", new NotFound("internal detail"));
    System.out.println("chain=" + chain(wrapped));
    System.out.println("category=" + category(wrapped));
    System.out.println("public-message-from-cause=false");
  }
}`, "chain=[IllegalStateException, NotFound]\ncategory=not-found\npublic-message-from-cause=false", ["spring-exception-handler", "spring-controller-advice", "java-throwable", "java-list"])],
    diagnostics: [
      d("구체 handler 대신 generic advice가 처리합니다.", "advice order와 cause match가 낮은 advice의 root match보다 먼저 적용되었습니다.", ["advice order", "root/cause", "handler signatures", "selectors", "resolver trace"], "primary root mappings를 높은 priority advice에 배치하고 exact wrapper scenarios를 MockMvc test합니다.", "handler selection matrix를 framework upgrade corpus에 둡니다."),
      d("handler 안에서 cause를 잘못 cast합니다.", "매칭 annotation과 method parameter type/wrapper 전달 semantics를 혼동했습니다.", ["declared types", "actual argument class", "cause chain", "multi-match method", "stack"], "exception type별 구체 handlers로 분리하고 필요한 cause는 checked bounded traversal로 찾습니다.", "root/wrapped/deep/unknown cases를 unit+MVC test합니다."),
    ],
    expertNotes: ["cause traversal에서 raw message를 public response나 metric label로 사용하지 않습니다.", "CompletionException/ExecutionException 같은 async wrappers도 target runtime에서 actual resolver behavior를 검증합니다."],
  },
  {
    id: "controlleradvice-scope-order",
    title: "@ControllerAdvice의 selector·order·local-vs-global 범위를 module ownership으로 설계합니다",
    lead: "global advice는 모든 controllers에 적용될 수 있지만 basePackages, annotations, assignableTypes selectors와 ordering으로 HTML/API/module policies를 분리할 수 있습니다.",
    explanations: [
      "@ControllerAdvice는 component로 등록되고 @ExceptionHandler, @InitBinder, @ModelAttribute를 여러 controllers에 공유합니다. @RestControllerAdvice는 response body semantics를 합성합니다.",
      "controller-local @ExceptionHandler가 global advice보다 먼저 적용될 수 있어 one-off handler가 조직 error contract를 우회하지 않게 ownership과 justification을 둡니다.",
      "selectors는 runtime 판단 비용과 예상 범위를 갖습니다. package refactor/string selectors, annotation meta semantics와 proxy/controller type을 context manifest로 확인합니다.",
      "여러 advice는 @Order/Ordered/Priority semantics를 갖지만 범위가 중첩되면 같은 exception에 경쟁합니다. validation, domain, dependency와 fallback을 mutually understandable layers로 설계합니다.",
      "HTML controller advice와 REST advice는 produces/content negotiation 또는 scoped annotations/packages로 분리해 browser error view와 Problem Details가 서로 가리지 않게 합니다.",
    ],
    concepts: [
      c("@ControllerAdvice", "여러 controllers에 exception handling, binding와 model behavior를 공유하는 component stereotype입니다.", ["selectors로 범위를 좁힐 수 있습니다.", "local handler와 order를 검증합니다."]),
      c("@RestControllerAdvice", "@ControllerAdvice와 @ResponseBody를 합성해 handler 반환을 response body로 쓰는 stereotype입니다.", ["REST error에 적합합니다.", "HTML advice와 범위를 분리합니다."]),
      c("advice selector", "base package, controller annotation 또는 assignable type으로 advice 적용 대상을 제한하는 조건입니다.", ["module ownership을 표현합니다.", "refactor/proxy behavior를 테스트합니다."]),
    ],
    diagnostics: [
      d("HTML 요청이 JSON ProblemDetail을 받습니다.", "REST advice가 모든 @Controller에 무제한 적용되거나 media/range가 겹칩니다.", ["advice selectors", "controller stereotypes", "Accept/produces", "order", "selected handler"], "HTML/REST controller scope와 media-specific handlers를 명시하고 negotiation matrix를 테스트합니다.", "Accept combinations과 browser/API error corpus를 둡니다."),
      d("package 이동 후 advice가 적용되지 않습니다.", "string basePackages selector가 refactor와 drift했습니다.", ["selector metadata", "controller package", "basePackageClasses", "context manifest", "tests"], "type-safe marker class/annotation selector와 module context tests를 사용합니다.", "controller→advice coverage manifest와 missing fallback test를 둡니다."),
    ],
    expertNotes: ["advice 수를 늘려 exception hierarchy를 숨기지 말고 error taxonomy와 module owner가 먼저입니다.", "order value 자체보다 실제 exception matrix에서 selected handler를 assertion합니다."],
  },
  {
    id: "resolver-chain-response-state",
    title: "HandlerExceptionResolver chain과 response committed 상태를 알고 하나의 resolver만 응답을 소유하게 합니다",
    lead: "@ExceptionHandler는 DispatcherServlet의 resolver mechanism 위에서 동작하며 ExceptionHandlerExceptionResolver, ResponseStatusExceptionResolver, DefaultHandlerExceptionResolver 등이 order대로 기회를 가집니다.",
    explanations: [
      "resolver는 exception과 handler를 받아 ModelAndView 또는 resolved state를 반환할 수 있습니다. null은 다음 resolver에 위임하는 의미이고 empty ModelAndView와 response 직접 작성 semantics를 구분합니다.",
      "response headers/body 일부가 이미 commit된 뒤 exception이 나면 status/body를 안전하게 교체하기 어렵습니다. streaming/download/async endpoints는 error-before-commit과 mid-stream failure contract를 따로 둡니다.",
      "custom resolver가 모든 Throwable을 resolved로 표시하면 Spring defaults와 container error page가 작동하지 않고 빈 200이 될 수 있습니다. 처리한 category만 명시적으로 resolve합니다.",
      "resolver order는 framework defaults/custom advice/observability filters와 함께 versioned manifest로 남깁니다. 같은 exception을 두 handlers가 write/log하지 않게 합니다.",
      "controller method 밖 filter/security/Servlet initialization errors는 DispatcherServlet resolver에 도달하지 않을 수 있으므로 entry/security/container error boundary를 별도로 설계합니다.",
    ],
    concepts: [
      c("HandlerExceptionResolver", "handler execution 중 발생한 exception을 HTTP response 또는 ModelAndView로 해결하려는 DispatcherServlet strategy입니다.", ["order chain을 가집니다.", "미처리면 null로 위임합니다."]),
      c("resolved exception", "한 resolver가 response/view 처리 책임을 받아 뒤 chain으로 전파하지 않는 상태입니다.", ["status/body가 실제 설정되어야 합니다.", "cleanup/log owner를 명시합니다."]),
      c("committed response", "HTTP headers/status가 이미 client로 전송되어 일반적인 error response 교체가 불가능한 상태입니다.", ["streaming failure를 별도 처리합니다.", "double write를 피합니다."]),
    ],
    codeExamples: [java("mvc09-resolver-order", "ordered resolver chain에서 첫 지원 handler 선택", "Mvc09Resolvers.java", "domain/framework/fallback resolvers를 order로 정렬해 각 category의 단일 owner를 결정합니다.", String.raw`import java.util.Comparator;
import java.util.List;
import java.util.Set;

public class Mvc09Resolvers {
  record Resolver(String name, int order, Set<String> categories) {}
  static String resolve(List<Resolver> resolvers, String category) {
    return resolvers.stream().sorted(Comparator.comparingInt(Resolver::order)).filter(r -> r.categories().contains(category) || r.categories().contains("*")).map(Resolver::name).findFirst().orElse("unresolved");
  }
  public static void main(String[] args) {
    List<Resolver> chain = List.of(
      new Resolver("fallback", 100, Set.of("*")),
      new Resolver("domain", 10, Set.of("not-found", "conflict")),
      new Resolver("framework", 20, Set.of("binding", "method-not-allowed")));
    System.out.println("ordered=" + chain.stream().sorted(Comparator.comparingInt(Resolver::order)).map(Resolver::name).toList());
    System.out.println("not-found=" + resolve(chain, "not-found"));
    System.out.println("binding=" + resolve(chain, "binding"));
    System.out.println("unknown=" + resolve(chain, "unknown"));
  }
}`, "ordered=[domain, framework, fallback]\nnot-found=domain\nbinding=framework\nunknown=fallback", ["spring-resolver-reference", "spring-handler-exception-resolver", "spring-exception-resolver-api", "java-comparator", "java-list", "java-set"])],
    diagnostics: [
      d("exception 뒤 빈 200 response가 나갑니다.", "custom resolver가 exception을 resolved로 표시했지만 status/view/body를 설정하지 않았습니다.", ["resolver return", "response status/committed", "ModelAndView", "chain", "access log"], "처리한 category에 explicit status/representation을 쓰고 나머지는 null/rethrow로 위임합니다.", "resolver outcome/status mutation tests를 둡니다."),
      d("Cannot call sendError after response committed가 납니다.", "streaming/body write 뒤 exception을 일반 Problem response로 교체했습니다.", ["commit timestamp", "bytes sent", "streaming", "exception phase", "client protocol"], "validation/work를 commit 전에 완료하고 mid-stream failure는 close/trailer/protocol-specific contract로 처리합니다.", "before/mid/after-commit fault tests를 둡니다."),
    ],
    expertNotes: ["resolver trace에는 name/order/category/status만 기록하고 exception message/request values는 bounded protected logs에 제한합니다.", "Servlet container error page와 Boot ErrorController를 plain Spring MVC advice와 혼합해 설명하지 않습니다."],
  },
  {
    id: "http-status-headers-retry",
    title: "status·headers·retry/idempotency를 exception category와 HTTP semantics에 맞춥니다",
    lead: "error body만 맞아도 status/cache/auth/retry headers가 틀리면 browser, proxy와 client가 잘못 행동하므로 전체 response contract를 검증합니다.",
    explanations: [
      "400은 malformed/invalid request, 401은 authentication challenge, 403은 권한 거부, 404는 absence 또는 의도적 concealment, 409는 current-state conflict, 429는 rate limit, 503은 temporary unavailability 등 의미를 일관되게 적용합니다.",
      "WWW-Authenticate, Allow, Retry-After, Cache-Control, Vary와 Content-Type은 status와 representation에 따라 필요할 수 있습니다. exception handler가 framework default headers를 잃지 않게 합니다.",
      "503/429의 Retry-After가 있어도 unsafe/non-idempotent operation과 unknown commit outcome은 자동 재시도하면 안 됩니다. idempotency key와 reconciliation endpoint/state가 필요합니다.",
      "security상 resource 존재를 숨길 때 404를 사용할 수 있지만 audit에는 internal authorization category를 값 없이 남깁니다. endpoint별 enumeration threat model을 둡니다.",
      "error responses의 caching은 민감 details와 사용자별 authorization을 고려해 private/no-store를 적용하고 shared cache key/Vary를 검증합니다.",
    ],
    concepts: [
      c("Retry-After", "client가 재시도를 시도하기 전 기다릴 시간을 알리는 HTTP response header입니다.", ["429/503 등에 사용될 수 있습니다.", "idempotency/commit state를 대체하지 않습니다."]),
      c("idempotency", "같은 요청을 반복해도 의도한 observable effect가 한 번 수행한 것과 같은 성질입니다.", ["method 이름만으로 보장되지 않습니다.", "key/store/reconciliation을 설계합니다."]),
      c("unknown outcome", "timeout/disconnect 뒤 server-side commit/effect가 성공했는지 client가 확정할 수 없는 상태입니다.", ["blind retry를 피합니다.", "readback/idempotency로 reconcile합니다."]),
    ],
    diagnostics: [
      d("503을 받은 POST를 client가 재시도해 중복 생성됩니다.", "retryable transport status를 operation idempotency와 혼동했습니다.", ["method", "idempotency key", "commit timing", "retry policy", "duplicate constraints"], "non-idempotent writes에 durable idempotency/reconciliation을 제공하고 Retry-After만으로 자동 retry하지 않습니다.", "timeout-before/after-commit replay tests를 둡니다."),
      d("405 response에 Allow가 없습니다.", "generic advice가 framework default exception headers를 버렸습니다.", ["exception type", "ErrorResponse headers", "handler mapping", "response headers", "resolver"], "framework ErrorResponse/ResponseEntityExceptionHandler contract를 보존해 required headers를 복사/생성합니다.", "status별 required-header HTTP contract tests를 둡니다."),
    ],
    expertNotes: ["HTTP status는 UI 문구가 아니라 intermediaries와 generic clients가 해석하는 protocol contract입니다.", "Retry-After 값과 rate/dependency state를 high-cardinality labels로 기록하지 않고 bounded buckets를 사용합니다."],
  },
  {
    id: "html-api-representations",
    title: "HTML error view와 RFC 9457 API problem을 같은 taxonomy에서 서로 다른 representation으로 렌더링합니다",
    lead: "browser form은 복구 navigation과 accessible message가 필요하고 API는 machine-readable code/path가 필요하지만 status와 failure 의미는 같아야 합니다.",
    explanations: [
      "@ExceptionHandler는 produces 조건을 사용해 HTML/JSON handlers를 분리할 수 있습니다. Accept가 없거나 wildcard/quality values일 때 content negotiation 결과를 실제 clients와 테스트합니다.",
      "HTML error view에는 safe title, next action, correlation reference와 navigation을 제공하고 stack/message/path/request data를 model에 넣지 않습니다. status도 4xx/5xx로 설정합니다.",
      "API ProblemDetail은 RFC 9457 type/title/status/detail/instance와 stable extensions를 사용합니다. internal exception class와 message를 type/detail로 그대로 사용하지 않습니다.",
      "같은 error code registry가 HTML message key와 API code를 연결하되 translated message parsing을 client automation으로 쓰지 않습니다.",
      "static error page/container fallback, MVC view resolver와 response body advice 경계를 구분합니다. template/render exception은 원래 handler를 다시 호출하지 않고 minimal safe fallback을 둡니다.",
    ],
    concepts: [
      c("error representation", "동일 failure taxonomy를 HTML, application/problem+json 등 client가 요청한 media type으로 표현한 body입니다.", ["status 의미를 유지합니다.", "media negotiation을 검증합니다."]),
      c("ProblemDetail", "Spring이 RFC 9457 problem object를 표현하는 type으로 error responses에 사용할 수 있습니다.", ["stable problem type을 정의합니다.", "internal detail을 redaction합니다."]),
      c("minimal fallback", "primary error renderer 자체가 실패했을 때 사용할 dependency가 적고 비밀값 없는 최후 response입니다.", ["recursion을 막습니다.", "고정 safe content만 제공합니다."]),
    ],
    diagnostics: [
      d("API가 HTML error page를 받아 JSON parse에 실패합니다.", "Accept/produces와 advice scope 또는 container fallback이 API route와 맞지 않습니다.", ["Accept", "selected handler", "Content-Type", "advice selectors", "error origin"], "API controllers/advice에 problem media contract를 두고 negotiation/fallback을 HTTP tests로 검증합니다.", "Accept matrix와 container/MVC error paths를 둡니다."),
      d("error JSP가 다시 exception을 내 무한 error dispatch가 납니다.", "error view가 실패한 model/resource/dependency를 재사용하고 recursion guard가 없습니다.", ["dispatch type", "view exception", "model", "fallback", "loop count"], "minimal dependency-free error fallback과 dispatch recursion guard를 사용합니다.", "primary-view failure와 ERROR dispatch integration tests를 둡니다."),
    ],
    expertNotes: ["Problem type URI는 API version contract이며 실제로 document할 수 있는 stable URI/URN policy를 둡니다.", "HTML detail도 보안상 API보다 덜 민감한 것이 아니므로 동일 redaction classification을 적용합니다."],
  },
  {
    id: "validation-framework-errors",
    title: "binding·validation·media·method errors를 Spring ErrorResponse contract와 일관되게 통합합니다",
    lead: "application exceptions만 처리하면 MethodArgumentNotValidException, HandlerMethodValidationException, HttpMessageNotReadable과 method/media failures가 서로 다른 body/headers로 남습니다.",
    explanations: [
      "ResponseEntityExceptionHandler는 여러 Spring MVC exceptions와 ErrorResponseException을 처리해 RFC 9457 body를 만드는 @ControllerAdvice base로 사용할 수 있습니다. override 범위와 current version을 확인합니다.",
      "object validation과 method validation exceptions는 shape가 다를 수 있으므로 field/parameter/container result를 stable public path/code model로 normalize합니다.",
      "malformed JSON, type mismatch, missing parameter, unsupported media, unacceptable representation와 method not allowed를 모두 'validation'으로 부르지 않고 protocol/binding category로 분리합니다.",
      "framework ErrorResponse가 제공하는 status/headers/body를 custom handler가 덮을 때 Allow, Retry-After나 detail args/message resolution을 잃지 않게 합니다.",
      "rejected values, raw body, parameter values와 constraint messages를 자동 직렬화하지 않고 allow-listed error DTO로 mapping합니다.",
    ],
    concepts: [
      c("ErrorResponse", "Spring MVC exceptions가 status, headers와 ProblemDetail body를 제공하기 위한 contract입니다.", ["framework defaults를 보존합니다.", "message resolution을 지원합니다."]),
      c("ResponseEntityExceptionHandler", "표준 Spring MVC exceptions/ErrorResponse를 처리하도록 확장 가능한 @ControllerAdvice base class입니다.", ["current supported methods를 확인합니다.", "public normalizer를 집중합니다."]),
      c("protocol error", "HTTP method, media type, syntax와 required request structure가 맞지 않는 transport/application protocol failure입니다.", ["domain rejection과 분리합니다.", "status/headers semantics를 유지합니다."]),
    ],
    diagnostics: [
      d("validation error body가 endpoint마다 다릅니다.", "local handlers, global advice와 framework defaults가 각기 다른 DTO를 반환합니다.", ["exception types", "handler ownership", "ErrorResponse", "media", "schemas"], "하나의 stable public error normalizer와 representation adapters로 통합합니다.", "모든 framework/application exception contract snapshots를 둡니다."),
      d("MethodArgumentNotValid만 처리했더니 method constraints가 500입니다.", "HandlerMethodValidationException 경로를 누락했습니다.", ["controller signature", "direct constraints", "Spring version", "exception type", "advice"], "현재 Spring MVC validation reference에 따라 object/method exceptions를 모두 normalize합니다.", "두 validation paths와 BindingResult signature tests를 둡니다."),
    ],
    expertNotes: ["framework exception message text가 아니라 type/status/headers/result data를 입력으로 stable contract를 만듭니다.", "provider/Spring patch에서 violation order/message가 바뀌어도 code/path set contract를 유지합니다."],
  },
  {
    id: "transaction-file-compensation",
    title: "DB transaction과 파일·외부 side effect가 함께 실패할 때 보상·idempotency·reconciliation을 설계합니다",
    lead: "원본 upload→DB insert 흐름처럼 filesystem과 database를 한 try/catch에 넣으면 한쪽만 성공한 orphan/누락 state가 남을 수 있습니다.",
    explanations: [
      "DB transaction은 filesystem/object storage를 자동 rollback하지 않습니다. 임시 upload→DB record commit→finalize 또는 outbox/job 같은 staged state machine을 설계합니다.",
      "file 저장 후 DB 실패는 temp/final object 삭제 또는 orphan sweeper가 필요하고 DB 성공 후 response/network 실패는 idempotency/readback으로 outcome을 확인합니다.",
      "원본 exception을 error view로 바꾸기 전에 transaction이 rollback-only인지, file handle/temporary artifact가 정리됐는지 확인합니다. catch 후 정상 return으로 rollback을 막지 않습니다.",
      "compensation 자체도 실패할 수 있으므로 cleanup pending state, durable job, retry budget와 operator reconciliation dashboard를 둡니다.",
      "사용자 supplied filename/path를 error/log에 노출하지 않고 server-generated opaque object id와 safe extension/content validation을 사용합니다.",
    ],
    concepts: [
      c("compensation", "이미 완료된 외부 side effect를 business적으로 상쇄하거나 cleanup하는 후속 operation입니다.", ["DB rollback과 다릅니다.", "실패/retry/idempotency를 설계합니다."]),
      c("staged upload", "파일을 임시 상태에 저장하고 DB/scan 승인 뒤 final 위치/state로 전환하는 workflow입니다.", ["orphan cleanup을 지원합니다.", "opaque id를 사용합니다."]),
      c("reconciliation", "DB, file/object store와 client-visible state를 비교해 partial/unknown outcomes를 탐지·복구하는 절차입니다.", ["durable evidence를 사용합니다.", "blind retry를 피합니다."]),
    ],
    codeExamples: [java("mvc09-compensation", "파일 저장 후 DB 실패 보상 state machine", "Mvc09Compensation.java", "synthetic file/db operations에서 insert 실패 시 저장된 object를 삭제해 clean state로 돌아가는 events를 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mvc09Compensation {
  static final class UploadFlow {
    final List<String> events = new ArrayList<>();
    boolean fileStored;
    boolean dbCommitted;
    void execute(boolean dbSucceeds) {
      fileStored = true; events.add("file:stored");
      try {
        if (!dbSucceeds) throw new IllegalStateException("db failed");
        dbCommitted = true; events.add("db:committed");
      } catch (RuntimeException error) {
        events.add("db:failed");
        if (fileStored && !dbCommitted) { fileStored = false; events.add("file:deleted"); }
      }
    }
  }
  public static void main(String[] args) {
    UploadFlow flow = new UploadFlow();
    flow.execute(false);
    System.out.println("events=" + flow.events);
    System.out.println("file-stored=" + flow.fileStored);
    System.out.println("db-committed=" + flow.dbCommitted);
    System.out.println("clean=" + (!flow.fileStored && !flow.dbCommitted));
  }
}`, "events=[file:stored, db:failed, file:deleted]\nfile-stored=false\ndb-committed=false\nclean=true", ["local-board-controller", "spring-transactions", "spring-exception-handler", "java-list"])],
    diagnostics: [
      d("등록 실패 후 orphan 파일이 쌓입니다.", "filesystem write가 DB transaction 밖에서 성공했고 catch가 cleanup/reconciliation 없이 error view만 반환했습니다.", ["operation order", "transaction state", "temp/final objects", "cleanup errors", "orphan metrics"], "staged upload와 commit/finalize/compensation state machine을 구현합니다.", "각 단계 failure injection과 orphan sweeper integration tests를 둡니다."),
      d("catch 후 error return인데 DB 일부가 commit됩니다.", "exception을 삼켜 transaction rollback signal이 사라졌거나 transaction boundary 밖에서 writes를 수행했습니다.", ["@Transactional boundary", "caught exception", "rollback rules", "autocommit", "commit logs"], "service transaction에서 exception을 rollback category로 전파하고 web advice는 boundary 밖에서 response만 변환합니다.", "partial write/fault/rollback integration tests를 둡니다."),
    ],
    expertNotes: ["controller advice는 response 변환 경계이지 분산 transaction manager가 아닙니다.", "cleanup events에도 user filename/path, password, body와 storage credentials를 기록하지 않습니다."],
  },
  {
    id: "security-redaction-enumeration",
    title: "exception message·stack·resource existence·credentials를 public response와 logs에서 분리합니다",
    lead: "catch한 exception의 getMessage를 화면/JSON/log 여러 곳에 복사하면 path, SQL, host, user input, token과 내부 class가 확산될 수 있습니다.",
    explanations: [
      "public 500 detail은 generic safe 문구와 opaque correlation reference를 사용합니다. client가 고칠 수 있는 validation/domain errors만 allow-listed message arguments를 제공합니다.",
      "authentication 실패, password mismatch, email/account existence와 object ownership errors는 enumeration threat model에 따라 같은 public response를 사용할 수 있고 internal audit category는 별도로 남깁니다.",
      "stack trace는 protected error record에 한 번 기록하고 request body, Authorization/Cookie, password, upload filename/path와 DB statements/binds를 redaction합니다.",
      "exception message는 safe하지 않은 unstructured input입니다. log forging newlines/control characters와 format injection을 막고 structured fields를 allow-list합니다.",
      "correlation id는 사용자 supplied 값을 그대로 신뢰하지 않고 format/length를 검증하거나 server-generated id를 사용하며 metric labels로 무제한 사용하지 않습니다.",
    ],
    concepts: [
      c("information disclosure", "error response/log를 통해 내부 path, implementation, identity, data 또는 credentials가 노출되는 위험입니다.", ["message/stack/rejected values를 분류합니다.", "public/internal channels를 분리합니다."]),
      c("enumeration", "오류 차이로 account/resource 존재나 권한 상태를 추론하는 공격입니다.", ["status/message/timing을 위협 모델링합니다.", "audit evidence는 내부 보존합니다."]),
      c("correlation reference", "사용자 error와 protected server trace를 연결하는 opaque bounded identifier입니다.", ["비밀이 아닙니다.", "format/cardinality/retention을 관리합니다."]),
    ],
    codeExamples: [java("mvc09-redaction", "internal failure에서 safe public error 만들기", "Mvc09Redaction.java", "internal exception class/message와 무관하게 stable public detail과 correlation reference만 반환합니다.", String.raw`public class Mvc09Redaction {
  record PublicError(int status, String code, String detail, String reference, boolean internalMessageIncluded) {}
  static PublicError toPublic(Throwable error, String reference) {
    if (error == null) throw new IllegalArgumentException("error");
    return new PublicError(500, "internal-error", "request could not be completed", reference, false);
  }
  public static void main(String[] args) {
    Throwable internal = new IllegalStateException("synthetic internal storage detail");
    PublicError response = toPublic(internal, "R-000042");
    System.out.println("status=" + response.status());
    System.out.println("code=" + response.code());
    System.out.println("detail=" + response.detail());
    System.out.println("reference=" + response.reference());
    System.out.println("internal-message-included=" + response.internalMessageIncluded());
  }
}`, "status=500\ncode=internal-error\ndetail=request could not be completed\nreference=R-000042\ninternal-message-included=false", ["owasp-error-handling", "owasp-logging", "spring-problem-detail", "java-throwable"])],
    diagnostics: [
      d("500 response에 stack/path/SQL이 보입니다.", "exception/message/default error page를 직접 직렬화했습니다.", ["response body", "error view model", "ProblemDetail properties", "container page", "profiles"], "production에서는 explicit safe problem/view adapter와 generic 500 fallback을 사용합니다.", "credential/path/SQL-shaped canary로 browser/API/error-dispatch responses를 검사합니다."),
      d("없는 계정과 wrong password 응답이 다릅니다.", "authentication failure cause를 public status/message/timing으로 구체화했습니다.", ["responses", "timing", "status", "logs", "rate limits"], "public generic authentication failure를 사용하고 내부 audit category만 보호된 channel에 기록합니다.", "enumeration timing/status/body adversarial tests와 rate limit을 둡니다."),
    ],
    expertNotes: ["correlation reference로 사용자가 다른 request의 error record를 조회할 수 없도록 authorization/access를 적용합니다.", "exception class name도 architecture 정보를 노출할 수 있어 public error type/code는 별도 registry를 사용합니다."],
  },
  {
    id: "observability-log-once",
    title: "root cause·request phase·transaction outcome을 한 번 구조화해 기록하고 metrics/traces cardinality를 제한합니다",
    lead: "controller, service, repository와 advice가 모두 같은 stack을 error log하면 signal이 증폭되므로 최종 boundary가 correlation context와 outcome을 한 번 기록합니다.",
    explanations: [
      "protected error event에는 route template, method, status, stable category, exception type/fingerprint, phase, dependency, transaction/outcome와 reference를 넣고 raw path/query/body/headers/values는 제외합니다.",
      "expected client errors는 info/warn/error policy와 sampling을 분리해 noisy scans가 error budget을 오염시키지 않게 하고 unexpected 5xx는 stack/cause를 한 owner가 기록합니다.",
      "metrics labels는 status class, route template, stable category, dependency name과 retry outcome처럼 bounded values만 사용합니다. exception message, ids, filenames와 correlation id는 label로 쓰지 않습니다.",
      "trace에는 resolver/advice selected, handler/DB/storage phases와 response committed timing을 spans/events로 남겨 root cause와 client-visible status의 연결을 봅니다.",
      "alert는 5xx rate뿐 아니라 specific dependency unavailable, conflict spike, compensation pending/orphans와 resolver fallback unknown category를 포함합니다.",
    ],
    concepts: [
      c("log once", "같은 failure stack/root cause를 최종 handling boundary 한 곳에서 구조화해 한 번 기록하는 정책입니다.", ["중간 layer는 context를 exception에 추가합니다.", "중복 alert/noise를 줄입니다."]),
      c("exception fingerprint", "비밀값을 제외한 exception type과 stable stack locations/version으로 동일 failure를 묶는 bounded 식별입니다.", ["message/value를 제외합니다.", "release version과 연결합니다."]),
      c("error budget", "서비스 신뢰성 목표에서 허용되는 실패량을 측정·운영하는 budget입니다.", ["expected 4xx와 5xx를 구분합니다.", "dependency/compensation signals를 포함합니다."]),
    ],
    diagnostics: [
      d("한 요청 exception이 로그에 다섯 번 나옵니다.", "각 layer가 catch/log/rethrow하고 advice도 stack을 기록합니다.", ["same reference/fingerprint", "logger call sites", "catch blocks", "APM auto capture", "alerts"], "중간 layer는 의미 있는 translation/context만 추가하고 final boundary가 한 번 기록합니다.", "duplicate fingerprint/request count를 integration test/monitor합니다."),
      d("exception metric series가 폭증합니다.", "message, URL id, filename 또는 correlation id를 labels로 사용했습니다.", ["label keys/values", "series count", "raw path", "exception message", "retention"], "route template/stable category/status/dependency allow-list로 교체하고 details는 protected sampled logs로 이동합니다.", "cardinality budgets와 CI telemetry schema tests를 둡니다."),
    ],
    expertNotes: ["expected 404도 공격/route drift signal이 될 수 있어 aggregate bucket을 유지하되 raw paths는 저장하지 않습니다.", "stack fingerprint 알고리즘 변경도 dashboard continuity와 privacy를 고려해 versioning합니다."],
  },
  {
    id: "async-filter-container-boundaries",
    title: "async task·Filter/Security·Servlet ERROR dispatch처럼 DispatcherServlet advice 밖의 실패 경계를 다룹니다",
    lead: "@ControllerAdvice는 모든 process exception의 전역 catch가 아니며 controller invocation 전후와 다른 thread에서 발생한 errors는 다른 mechanisms가 처리할 수 있습니다.",
    explanations: [
      "Filter/security chain에서 authentication/authorization 또는 request parsing이 실패하면 controller advice가 호출되지 않을 수 있어 AuthenticationEntryPoint/AccessDeniedHandler와 filter error policy를 별도로 둡니다.",
      "Callable/DeferredResult/async dispatch exceptions는 wrapper/thread/context propagation과 timeout handlers를 가집니다. MDC/security/transaction context를 thread-local이라고 자동 가정하지 않습니다.",
      "@Async, executor와 event listener exception은 HTTP request가 이미 완료됐을 수 있어 API response가 아니라 job state/retry/dead-letter/alert contract가 필요합니다.",
      "unresolved exception과 sendError는 Servlet container ERROR dispatch/default error page로 갈 수 있습니다. dispatcher types, error-page mapping과 recursion을 target container에서 테스트합니다.",
      "JVM fatal errors, OutOfMemoryError와 process crash를 broad Throwable handler로 정상 response 처리하려 하지 않고 process/container restart와 crash diagnostics 정책을 둡니다.",
    ],
    concepts: [
      c("async dispatch", "request thread를 반환한 뒤 결과가 준비되면 Servlet container가 request를 다시 dispatch하는 비동기 처리 흐름입니다.", ["timeout/error path를 가집니다.", "context propagation을 검증합니다."]),
      c("ERROR dispatch", "Servlet error-page handling을 위해 container가 error attributes와 함께 수행하는 dispatch type입니다.", ["MVC resolver 이후 경로일 수 있습니다.", "filter/loop behavior를 테스트합니다."]),
      c("out-of-band failure", "원래 HTTP response 이후 background job/event/executor에서 발생해 별도 durable state와 alert가 필요한 failure입니다.", ["HTTP advice로 처리하지 않습니다.", "retry/idempotency/DLQ를 설계합니다."]),
    ],
    diagnostics: [
      d("security exception이 MVC problem schema와 다릅니다.", "Security filter boundary가 controller advice 전에 response를 소유합니다.", ["filter chain", "entry point/access denied handler", "status/headers", "Accept", "advice invocation"], "security handlers가 같은 public error registry/representation policy를 사용하도록 adapter를 둡니다.", "unauthenticated/forbidden HTML/API integration tests를 둡니다."),
      d("async timeout 후 response를 두 번 씁니다.", "normal completion과 timeout/error callbacks가 race하고 committed state/idempotence가 없습니다.", ["async state", "callbacks", "response committed", "cancellation", "executor task"], "single terminal state CAS/cancellation과 timeout-safe resolver를 사용합니다.", "completion-vs-timeout race tests와 resource cleanup을 둡니다."),
    ],
    expertNotes: ["모든 errors를 같은 JSON shape로 맞춰도 owner/phase를 내부 taxonomy에서 잃지 않습니다.", "Throwable catch-all이 VirtualMachineError/ThreadDeath까지 삼키지 않도록 boundary를 명확히 합니다."],
  },
  {
    id: "testing-version-runbook",
    title: "handler selection→HTTP contract→side-effect cleanup→container fallback을 failure injection corpus로 qualification합니다",
    lead: "예외 class unit test만으로 advice order, content negotiation, transaction rollback, async/filter/container error와 log hygiene를 증명할 수 없습니다.",
    explanations: [
      "unit tests는 exception classifier, cause traversal, public normalizer, retry/idempotency와 compensation state machine을 deterministic하게 검증합니다.",
      "MockMvc tests는 local/global advice selection, root/cause/wrapper, framework validation/method/media exceptions, HTML/API negotiation와 required headers를 검증합니다.",
      "integration tests는 transaction commit/rollback, DB constraint, file/object storage failure 단계, compensation/reconciliation과 unknown outcome을 실행합니다.",
      "target container/security/async tests는 filter exceptions, ERROR/FORWARD/ASYNC dispatch, committed streaming failure, default pages와 graceful shutdown을 검증합니다.",
      "upgrade gate는 Spring/JDK/Servlet/provider version에서 resolver/advice manifest, handler selection, ErrorResponse fields, message resolution와 zero-leak logs/responses를 differential test하고 rollback합니다.",
    ],
    concepts: [
      c("failure injection corpus", "각 phase에 exception, timeout, conflict와 partial side effect를 주입해 status·cleanup·observability를 검증하는 반복 집합입니다.", ["정상 path와 같은 중요도로 운영합니다.", "단계/commit state를 명시합니다."]),
      c("resolver manifest", "등록된 HandlerExceptionResolvers, advice selectors/order와 supported exception/media metadata를 비밀값 없이 기록한 evidence입니다.", ["upgrade drift를 비교합니다.", "actual selection tests와 결합합니다."]),
      c("error canary", "새 배포에서 synthetic safe failures를 발생시켜 public contract, resolver, logs, alerts와 cleanup이 동작하는지 확인하는 probe입니다.", ["실데이터를 사용하지 않습니다.", "rate/impact를 제한합니다."]),
    ],
    diagnostics: [
      d("MockMvc는 통과하지만 실제 container는 기본 stack page를 냅니다.", "unresolved/filter/ERROR dispatch와 deployed profile/container error mapping을 테스트하지 않았습니다.", ["container logs", "dispatch type", "advice/resolver", "profile", "error page"], "packaged artifact를 target container/security chain에서 fault-test하고 default pages를 안전하게 구성합니다.", "container matrix/error canary를 release gate로 둡니다."),
      d("upgrade 후 handler selection이 바뀝니다.", "advice order/root-cause/media/resolver defaults를 startup 성공만으로 검증했습니다.", ["versions", "resolver manifest", "selection cases", "ErrorResponse", "diff"], "full exception matrix를 old/new version에서 실행하고 intentional differences만 승인합니다.", "canary metrics와 artifact+config rollback 기준을 둡니다."),
    ],
    expertNotes: ["test assertions는 framework message wording보다 selected handler, status/headers, stable public code와 cleanup invariant를 우선합니다.", "synthetic error canary에도 secret-like data를 넣지 않고 zero-leak detector용 별도 non-secret marker만 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-board-controller", repository: "2026-springmvc01", path: "src/main/java/org/study/myproject01/board/controller/BoardController.java", usedFor: ["broad catch/error view, file+DB side-effect and result/null branch progression"], evidence: "원본을 read-only로 구조만 확인했으며 paths, request/domain values와 credentials는 복사하지 않았습니다." },
  { id: "spring-exception-handler", repository: "Spring Framework Reference", path: "Exceptions / @ExceptionHandler", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html", usedFor: ["exception mapping, root/cause, media, arguments and return values"], evidence: "Spring 공식 exception handler reference입니다." },
  { id: "spring-controller-advice", repository: "Spring Framework Reference", path: "Controller Advice", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html", usedFor: ["local/global advice and RestControllerAdvice semantics"], evidence: "Spring 공식 ControllerAdvice reference입니다." },
  { id: "spring-resolver-reference", repository: "Spring Framework Reference", path: "MVC Exceptions / HandlerExceptionResolver", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/exceptionhandlers.html", usedFor: ["resolver chain and container fallback"], evidence: "Spring 공식 exception resolver reference입니다." },
  { id: "spring-error-responses", repository: "Spring Framework Reference", path: "Error Responses", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["ErrorResponse, ProblemDetail and ResponseEntityExceptionHandler"], evidence: "Spring 공식 error response reference입니다." },
  { id: "spring-async", repository: "Spring Framework Reference", path: "Asynchronous Requests", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html", usedFor: ["async dispatch timeout/error boundary"], evidence: "Spring 공식 MVC async reference입니다." },
  { id: "spring-transactions", repository: "Spring Framework Reference", path: "Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["service rollback and exception propagation boundary"], evidence: "Spring 공식 transaction reference입니다." },
  { id: "spring-handler-exception-resolver", repository: "Spring Framework Javadoc", path: "HandlerExceptionResolver", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerExceptionResolver.html", usedFor: ["resolver return and order contract"], evidence: "Spring 공식 HandlerExceptionResolver API입니다." },
  { id: "spring-exception-resolver-api", repository: "Spring Framework Javadoc", path: "ExceptionHandlerExceptionResolver", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/ExceptionHandlerExceptionResolver.html", usedFor: ["@ExceptionHandler resolver implementation boundary"], evidence: "Spring 공식 ExceptionHandlerExceptionResolver API입니다." },
  { id: "spring-controller-advice-api", repository: "Spring Framework Javadoc", path: "ControllerAdvice", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ControllerAdvice.html", usedFor: ["selectors and order metadata"], evidence: "Spring 공식 ControllerAdvice API입니다." },
  { id: "spring-exception-handler-api", repository: "Spring Framework Javadoc", path: "ExceptionHandler", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ExceptionHandler.html", usedFor: ["exception types and produces mapping"], evidence: "Spring 공식 ExceptionHandler API입니다." },
  { id: "spring-response-entity-handler", repository: "Spring Framework Javadoc", path: "ResponseEntityExceptionHandler", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/ResponseEntityExceptionHandler.html", usedFor: ["standard MVC exception handling base"], evidence: "Spring 공식 ResponseEntityExceptionHandler API입니다." },
  { id: "spring-error-response", repository: "Spring Framework Javadoc", path: "ErrorResponse", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/ErrorResponse.html", usedFor: ["status, headers and body error contract"], evidence: "Spring 공식 ErrorResponse API입니다." },
  { id: "spring-problem-detail", repository: "Spring Framework Javadoc", path: "ProblemDetail", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ProblemDetail.html", usedFor: ["RFC 9457 problem representation"], evidence: "Spring 공식 ProblemDetail API입니다." },
  { id: "rfc9457", repository: "RFC Editor", path: "RFC 9457 Problem Details for HTTP APIs", publicUrl: "https://www.rfc-editor.org/info/rfc9457/", usedFor: ["problem details fields, extensions and security considerations"], evidence: "IETF/RFC Editor 공식 specification입니다." },
  { id: "rfc9110", repository: "RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/info/rfc9110/", usedFor: ["HTTP status, headers, method and retry semantics"], evidence: "IETF/RFC Editor 공식 HTTP semantics입니다." },
  { id: "jakarta-servlet-errors", repository: "Jakarta Servlet Specification", path: "Jakarta Servlet 6.1 Error Handling", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/", usedFor: ["ERROR dispatch and container error pages"], evidence: "Jakarta EE 공식 Servlet specification입니다." },
  { id: "owasp-error-handling", repository: "OWASP Cheat Sheet Series", path: "Error Handling Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["generic public errors and information disclosure defense"], evidence: "OWASP 공식 error handling guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["structured redaction, log injection and sensitive data"], evidence: "OWASP 공식 logging guidance입니다." },
  { id: "java-throwable", repository: "Java SE 21 API", path: "Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["cause chain and exception exact examples"], evidence: "Oracle JDK 공식 Throwable API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["cause/resolver/compensation event examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["resolver category sets"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "java-comparator", repository: "Java SE 21 API", path: "Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["deterministic resolver ordering"], evidence: "Oracle JDK 공식 Comparator API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-09-exception-handling", slug: "mvc-09-exception-handling", courseId: "spring", moduleId: "spring-mvc-request-response", order: 9,
  title: "@ControllerAdvice로 예외를 HTTP 계약으로 변환", subtitle: "catch/오류뷰를 넘어 taxonomy, root/cause/advice/resolver order, status/headers, HTML·ProblemDetail, transaction·file compensation, redaction과 async/container failures를 운영합니다.", level: "전문가", estimatedMinutes: 1140,
  coreQuestion: "controller/service/storage/DB/validation/async/container의 실패를 의미 있는 HTTP 계약으로 한 번만 변환하면서 rollback·보상·보안·관측·client retry를 어떻게 정확히 유지할까요?",
  summary: "2026-springmvc01 BoardController를 read-only로 확인해 broad catches, error view/result/null branches와 file+DB side-effect progression을 값·path 없이 보존했습니다. exception taxonomy/translation, @ExceptionHandler root/cause/rethrow, ControllerAdvice selectors/order, HandlerExceptionResolver/committed response, status/headers/retry/idempotency, HTML vs RFC 9457 problem representations, framework validation/ErrorResponse, DB+file compensation/reconciliation, redaction/enumeration, log-once telemetry, async/filter/container boundaries와 failure-injection/version runbook까지 확장합니다. 다섯 JDK 21 exact examples는 taxonomy, cause chain, resolver order, compensation과 safe public response를 실제 실행합니다.",
  objectives: ["client/domain/dependency/bug exceptions를 status/code/retry taxonomy로 분류한다.", "@ExceptionHandler root/cause/specificity/rethrow matching을 검증한다.", "ControllerAdvice selector/order와 local/global/HTML/REST ownership을 설계한다.", "HandlerExceptionResolver chain과 committed response를 안전하게 처리한다.", "status/required headers/idempotency/unknown outcome 의미를 보존한다.", "HTML error view와 RFC 9457 problem을 같은 taxonomy로 렌더링한다.", "Spring validation/media/method ErrorResponse paths를 통합한다.", "DB transaction과 file/external side effects를 compensation/reconciliation한다.", "message/stack/existence/credentials를 redaction하고 enumeration을 막는다.", "async/filter/container failures와 layered fault tests/observability/upgrade를 운영한다."],
  prerequisites: [{ title: "@ResponseBody, ResponseEntity와 상태·헤더 제어", reason: "status, headers, content negotiation과 response body ownership을 알아야 exception handler가 올바른 HTTP error contract를 구성할 수 있습니다.", sessionSlug: "mvc-08-responsebody-status-headers" }],
  keywords: ["@ExceptionHandler", "@ControllerAdvice", "@RestControllerAdvice", "HandlerExceptionResolver", "root cause", "exception translation", "HTTP status", "ErrorResponse", "ProblemDetail", "RFC 9457", "ResponseEntityExceptionHandler", "compensation", "idempotency", "redaction", "ERROR dispatch", "failure injection"], topics,
  lab: {
    title: "게시판 file·DB·password·detail failures를 production error boundary로 재구성하기",
    scenario: "controller가 broad catch/result/null branches로 같은 error view를 반환하고 file 저장과 DB transaction이 부분 성공할 수 있으며 HTML/API/security/async errors가 서로 다른 shape와 로그를 만듭니다.",
    setup: ["원본 controller는 read-only로 보존하고 catch/result/file+DB 구조만 inventory합니다.", "JDK 21 exact examples, supported Spring/Jakarta container, MockMvc와 disposable DB/object store를 준비합니다.", "failure taxonomy→status/headers/code/retry/representation/owner matrix와 resolver/advice manifest를 만듭니다.", "synthetic opaque ids/files/errors만 사용하고 paths, passwords, request/domain values와 credentials는 출력하지 않습니다."],
    steps: ["lower-level vendor errors를 stable application exceptions/outcomes로 translate합니다.", "root/cause/wrapper/local/global/advice order selection matrix를 실행합니다.", "validation/media/method/domain/dependency/unknown errors를 ErrorResponse normalizer에 연결합니다.", "HTML/JSON Accept matrix와 status/headers/problem/view/fallback을 검증합니다.", "파일 temp→DB commit→finalize/compensate와 orphan reconciliation을 fault-test합니다.", "timeout-before/after-commit, idempotency와 retry/Retry-After를 검증합니다.", "security/filter/async/stream committed/Servlet ERROR dispatch paths를 target container에서 실행합니다.", "public responses/error pages/logs/traces에 message/path/PII/credential zero-leak을 검사합니다.", "single-owner logging, bounded metrics, alerts와 compensation dashboards를 검증합니다.", "framework/container upgrade differential canary와 artifact+config rollback을 승인합니다."],
    expectedResult: ["각 failure는 의미에 맞는 status/headers/stable code/representation과 한 resolver owner를 가집니다.", "unknown bugs는 generic 500이고 stack/internal message는 public response에 없습니다.", "DB/file partial failure가 orphan/partial commit 없이 보상되거나 durable reconciliation state로 남습니다.", "HTML/API/security/async/container paths가 동일 taxonomy와 phase evidence를 유지합니다.", "logs/metrics/traces/responses에 request values, passwords, filenames/paths, SQL/credentials와 unbounded ids가 없습니다."],
    cleanup: ["disposable contexts/DB/storage, staged objects, compensation jobs와 synthetic traces를 제거합니다.", "pending compensation/reconciliation count가 0인지 readback합니다.", "temporary credentials/diagnostic/error-canary access를 revoke합니다.", "원본 2026-springmvc01 files는 변경하지 않습니다."],
    extensions: ["Spring Security entry point/access denied와 같은 problem registry를 공유합니다.", "streaming/SSE/download의 pre/mid/post-commit failure protocol을 확장합니다.", "outbox/saga와 object storage versioning으로 compensation durability를 높입니다.", "chaos/fault injection과 resolver selection differential suite를 CI/canary에 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 exception→resolver→HTTP→cleanup evidence를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "400/404/409/503/500 차이를 설명합니다.", "wrapper cause와 public message를 구분합니다.", "resolver order 선택을 설명합니다.", "DB 실패 뒤 file cleanup을 확인합니다.", "public response가 internal message를 제외함을 확인합니다."], hints: ["catch 위치보다 누가 failure를 의미 있게 분류하고 누가 response/cleanup을 소유하는지 먼저 적으세요."], expectedOutcome: "예외 처리를 catch 문이 아니라 protocol·transaction·security boundary로 설명합니다.", solutionOutline: ["throw/translate→resolve→render→rollback/compensate→observe 순서입니다."] },
    { difficulty: "응용", prompt: "원본 BoardController의 error branches를 ControllerAdvice와 compensation workflow로 migration하세요.", requirements: ["catch/result/null branches를 taxonomy화합니다.", "specific handlers/advice order를 설계합니다.", "HTML/API ErrorResponse를 통합합니다.", "required status/headers를 검증합니다.", "file+DB staged/compensation을 구현합니다.", "validation/security/async/container paths를 포함합니다.", "zero-leak/log-once telemetry를 적용합니다.", "fault corpus/canary/rollback을 작성합니다."], hints: ["원본 upload path나 BoardVO 실제 values를 예제/log에 복사하지 마세요."], expectedOutcome: "부분 성공·정보 노출 없이 재현 가능한 게시판 error boundary가 완성됩니다.", solutionOutline: ["safe audit→taxonomy→advice/resolvers→side-effect state machine→fault tests→canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC exception·error response·compensation 표준을 작성하세요.", requirements: ["exception taxonomy/translation을 정의합니다.", "handler/advice/resolver order/ownership을 둡니다.", "status/headers/retry/idempotency를 정의합니다.", "HTML/RFC9457/media fallback을 둡니다.", "framework/security/async/container paths를 포함합니다.", "transaction/external compensation/reconciliation을 요구합니다.", "redaction/log-once/cardinality policy를 둡니다.", "fault corpus, canary, upgrade와 rollback을 포함합니다."], hints: ["500 body 모양뿐 아니라 response commit 전후와 side effect commit 전후의 네 조합을 모두 설계하세요."], expectedOutcome: "root cause부터 client contract·복구·관측까지 일관된 error governance가 완성됩니다.", solutionOutline: ["classify→select→respond→recover→measure→qualify 순서입니다."] },
  ],
  nextSessions: ["crud-01-vo-dto-entity-boundaries"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["BoardController.java에서 broad catches2, direct error-view returns 여러 곳, file operations2와 DB service calls/result-null branches를 read-only 구조 audit했지만 paths, request/domain values와 credentials는 복사하지 않았습니다.", "원본의 exception messages/logging, transaction boundaries와 actual runtime outcomes는 실행하지 않고 structural progression으로만 사용했습니다.", "원본은 ControllerAdvice/resolver order, ErrorResponse/ProblemDetail, status/headers, security/async/container boundaries, compensation/reconciliation과 operation evidence를 충분히 다루지 않아 current Spring/Jakarta/RFC/OWASP/JDK 공식 자료와 synthetic examples로 보완했습니다.", "JDK models는 실제 Spring handler selection, transaction manager, filesystem/object store, Servlet error dispatch와 HTTP negotiation을 대체하지 않습니다."] },
});

export default session;
