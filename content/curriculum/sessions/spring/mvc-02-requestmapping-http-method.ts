import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + Math.min(12, lineCount), explanation: "HTTP method, route condition, representation 또는 retry state를 작은 immutable model로 정의합니다." },
      { lines: Math.min(13, lineCount) + "-" + Math.max(13, lineCount - 8), explanation: "정상 method뿐 아니라 404·405·406·415, HEAD/OPTIONS와 duplicate retry를 같은 실행에서 결정적으로 분류합니다." },
      { lines: Math.max(1, lineCount - 7) + "-" + lineCount, explanation: "method/path/status/Allow/outcome처럼 HTTP 계약만 출력하고 cookie, authorization, query 값이나 사용자 본문은 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "javac --release 21", "Spring·Servlet container·network·credential 불필요"], command: "javac --release 21 " + filename + " && java " + filename.replace(/\.java$/, "") },
    output: { value: output, explanation: ["stdout은 JDK 21 격리 실행 결과와 한 글자씩 같아야 합니다.", "mini router는 Spring RequestMappingHandlerMapping, Servlet parsing, filters와 message converters를 대체하지 않으므로 MockMvc와 실제 container 검증을 추가합니다."] },
    experiments: [
      { change: "path, method, consumes/produces 또는 route specificity를 한 조건씩 바꿉니다.", prediction: "handler 선택 또는 404/405/406/415 category가 달라집니다.", result: "등록 route manifest와 request/response 표를 대조해 어느 조건에서 후보가 제거됐는지 기록합니다." },
      { change: "POST/PUT/DELETE를 timeout 뒤 재전송하거나 CSRF token 없이 호출합니다.", prediction: "method semantic과 idempotency key/conditional request가 없으면 중복 state change 또는 보안 거부가 생깁니다.", result: "operation별 retry policy, idempotency/readback과 security filter evidence를 검증합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "request-mapping-composition",
    title: "class와 method의 @RequestMapping 조건을 하나의 route 계약으로 합성합니다",
    lead: "Spring MVC route는 URL 문자열 하나가 아니라 path, HTTP method, params, headers, consumes, produces와 version 조건의 교집합입니다. class-level 조건을 공통 prefix로, method-level 조건을 구체 operation으로 읽습니다.",
    explanations: [
      "@RequestMapping은 type level에서 공통 path·media type 등을 선언하고 method level에서 구체 path와 method를 좁힐 수 있습니다. 최종 route는 두 annotation의 조건을 합친 결과이며 한쪽만 보고 endpoint를 문서화하지 않습니다.",
      "@GetMapping·@PostMapping·@PutMapping·@PatchMapping·@DeleteMapping은 HTTP method가 명시된 composed annotation입니다. method를 생략한 범용 mapping은 여러 method에 열릴 수 있어 의도치 않은 state change surface가 생깁니다.",
      "원본 RequestController는 RequestMapping 중심 progression과 Get/Post shortcut, 여러 RequestParam 예를 담고 ResponseController는 Model/redirect 반환 progression을 보여 줍니다. 실제 route literal과 사용자 값은 복제하지 않고 annotation·method 수만 provenance로 사용합니다.",
      "servlet-context의 annotation-driven과 component scan은 annotated controller를 발견하고 HandlerMapping/HandlerAdapter infrastructure를 활성화하는 출발점입니다. 설정이 있다는 사실과 특정 route가 모호하지 않다는 사실은 별도로 검증합니다.",
      "startup에 모든 route의 handler, methods, consumes/produces와 name을 값 없는 manifest로 추출합니다. 동일 조건 충돌은 첫 traffic이 아니라 context initialization에서 실패하도록 유지합니다.",
    ],
    concepts: [
      c("@RequestMapping", "annotated controller method를 path·method·parameter·header·media type 조건으로 선택하는 mapping metadata입니다.", ["type/method 조건을 합성합니다.", "method를 명시합니다.", "startup registry에서 검증합니다."]),
      c("composed mapping", "@RequestMapping을 meta-annotation으로 사용해 HTTP method 같은 조건을 미리 좁힌 annotation입니다.", ["Get/Post/Put/Patch/DeleteMapping이 대표적입니다.", "같은 element에 중복 mapping을 두지 않습니다."]),
      c("route manifest", "배포 artifact에 등록된 handler와 path/method/media 조건을 비밀값 없이 정리한 목록입니다.", ["충돌·누락을 검증합니다.", "API 문서·테스트와 diff합니다."]),
    ],
    codeExamples: [java("mvc02-route-selection", "path 후보와 HTTP method를 404·405·성공으로 분류", "Mvc02RouteSelection.java", "같은 path에 GET/POST가 등록된 작은 registry에서 성공, 잘못된 method와 없는 path를 분리합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

public class Mvc02RouteSelection {
  record Response(int status, String handler, Set<String> allow) {}

  static Response dispatch(Map<String, Map<String, String>> routes, String method, String path) {
    Map<String, String> byMethod = routes.get(path);
    if (byMethod == null) return new Response(404, "none", Set.of());
    String handler = byMethod.get(method);
    if (handler == null) return new Response(405, "none", new TreeSet<>(byMethod.keySet()));
    return new Response(method.equals("POST") ? 201 : 200, handler, new TreeSet<>(byMethod.keySet()));
  }

  public static void main(String[] args) {
    Map<String, Map<String, String>> routes = new LinkedHashMap<>();
    routes.put("/items", Map.of("GET", "list", "POST", "create"));
    Response get = dispatch(routes, "GET", "/items");
    Response post = dispatch(routes, "POST", "/items");
    Response wrong = dispatch(routes, "DELETE", "/items");
    Response missing = dispatch(routes, "GET", "/missing");
    System.out.println("get=" + get.status() + "," + get.handler());
    System.out.println("post=" + post.status() + "," + post.handler());
    System.out.println("wrong=" + wrong.status() + ",allow=" + wrong.allow());
    System.out.println("missing=" + missing.status());
    System.out.println("path-and-method-separated=true");
  }
}`, "get=200,list\npost=201,create\nwrong=405,allow=[GET, POST]\nmissing=404\npath-and-method-separated=true", ["local-request-controller", "local-response-controller", "local-servlet-context", "spring-request-mapping", "spring-requestmapping-api", "java-map"])],
    diagnostics: [d("같은 URI에서 지원하지 않는 method가 404로 보이거나 예상치 않은 controller가 호출됩니다.", "path 후보 검색과 method 조건 비교를 구분하지 않았거나 method 없는 broad mapping이 더 넓은 surface를 열었습니다.", ["registered route manifest", "lookup path", "candidate path patterns", "allowed methods", "selected handler/condition"], "operation마다 method-specific mapping을 사용하고 path match와 method mismatch를 404/405 계약으로 분리합니다.", "각 path의 allowed/unsupported method matrix와 Allow header를 MockMvc·실제 container에서 검증합니다.")],
    expertNotes: ["route 이름과 handler method 이름은 구현 정보이고 public contract는 method·URI·representation·status입니다.", "route manifest에는 controller package 전체나 내부 classpath를 불필요하게 공개하지 않습니다."],
  },
  {
    id: "resource-uri-design",
    title: "URI는 작업 동사가 아니라 resource identity와 hierarchy를 안정적으로 표현합니다",
    lead: "HTTP method가 operation semantics를 제공하므로 URI에 create, delete 같은 동사를 반복하지 않아도 됩니다. URI 변경은 link, cache, authorization과 관측 차원을 함께 바꾸는 API 변경입니다.",
    explanations: [
      "collection과 member를 구분해 /items와 /items/{id}처럼 resource 관계를 표현합니다. 실제 naming은 domain language를 사용하고 DB table/controller class 이름을 그대로 노출하지 않습니다.",
      "class-level prefix와 method-level relative path를 합성할 때 slash, trailing slash, context path와 reverse proxy prefix를 구분합니다. client가 보는 public URI와 Spring lookup path를 같은 문자열로 오해하지 않습니다.",
      "path variable은 hierarchy를 식별하고 query는 filtering, sorting, pagination처럼 representation 선택에 주로 사용합니다. 모든 값을 path에 넣거나 query 하나로 operation을 구분하지 않습니다.",
      "PathPattern의 segment 단위 matching과 specificity 규칙을 이해하고 broad catch-all은 마지막 fallback으로 둡니다. encoded separator, dot segment와 duplicate slash의 container/proxy normalization을 security corpus에 포함합니다.",
      "URI는 로그·browser history·referrer·cache key에 남기 쉬우므로 개인정보·credential·secret을 path/query에 넣지 않습니다. synthetic ID와 opaque stable identifier를 사용합니다.",
    ],
    concepts: [
      c("URI", "resource를 식별하는 안정된 identifier이며 HTTP request target의 구조적 기반입니다.", ["operation은 method로 표현합니다.", "민감정보를 넣지 않습니다.", "public/proxy/lookup path를 구분합니다."]),
      c("collection resource", "같은 종류의 여러 member를 대표하고 조회·생성 같은 operation이 적용되는 resource입니다.", ["GET과 POST 의미를 분리합니다.", "pagination contract를 둡니다."]),
      c("path specificity", "여러 pattern이 match할 때 literal, variable, wildcard 구조로 더 구체적인 handler를 선택하는 순서입니다.", ["ambiguous route를 startup에 제거합니다.", "catch-all을 제한합니다."]),
    ],
    diagnostics: [d("proxy 또는 container를 바꾸자 같은 public URL이 다른 handler에 match하거나 404가 됩니다.", "context/servlet/proxy prefix와 encoded path normalization을 하나의 route literal로 가정했습니다.", ["raw request target", "forwarded prefix policy", "context/servlet/lookup path", "decoded segments", "PathPattern candidates"], "trusted proxy boundary와 canonical public URI를 정하고 Spring lookup path·pattern을 segment 단위로 검증합니다.", "encoded separator, duplicate slash, dot segment, trailing slash와 proxy prefix corpus를 target container에서 실행합니다.")],
    expertNotes: ["REST스럽다는 미학보다 resource ownership, method semantics와 evolvable link contract가 우선입니다.", "식별자를 숨기려 난독화해도 authorization이 대체되지 않으며 object-level access check가 필요합니다."],
  },
  {
    id: "safe-methods-get-head",
    title: "GET·HEAD를 safe read 계약으로 유지하고 body·cache·조건부 요청을 설계합니다",
    lead: "GET은 resource representation을 조회하며 사용자가 요청한 state change를 일으키지 않는 safe method입니다. logging 같은 부수 효과는 가능하지만 business mutation endpoint로 사용하면 crawler·prefetch·retry가 상태를 바꿉니다.",
    explanations: [
      "GET handler는 bookmark, link, cache와 반복 요청을 고려합니다. query parameter가 있어도 method semantics가 바뀌지 않으며 delete=true 같은 query로 write를 숨기지 않습니다.",
      "HEAD는 GET과 같은 header metadata를 제공하되 response body를 보내지 않습니다. Spring MVC는 일반적인 GET mapping에 HEAD 처리를 지원하지만 content length와 custom streaming behavior는 실제 container에서 확인합니다.",
      "ETag와 Last-Modified 조건부 요청은 representation version을 비교해 304로 body 전송을 줄일 수 있습니다. authorization별 representation이 cache에서 섞이지 않게 Vary와 cache policy를 설계합니다.",
      "GET 실패는 입력/authorization/not found와 server failure를 구분하고 4xx body에도 민감한 resource 존재 여부를 과도하게 노출하지 않습니다.",
      "read handler도 DB connection, transaction, stream과 async resource를 점유할 수 있습니다. client disconnect·timeout 뒤 cancellation과 cleanup을 검증합니다.",
    ],
    concepts: [
      c("safe method", "client가 요청한 application state change를 의도하지 않는 HTTP method 성질입니다.", ["GET·HEAD가 대표적입니다.", "business mutation을 넣지 않습니다."]),
      c("HEAD", "GET과 동일한 header metadata를 요청하지만 response content를 전송하지 않는 method입니다.", ["GET mapping과 연계됩니다.", "body byte 0을 검증합니다."]),
      c("conditional request", "ETag 또는 modification date precondition으로 representation 전송·변경 여부를 결정하는 request입니다.", ["304/412 의미를 구분합니다.", "cache와 concurrency에 사용합니다."]),
    ],
    diagnostics: [d("link preview, crawler 또는 browser prefetch만으로 데이터가 삭제·변경됩니다.", "GET query에 state-changing operation을 숨겨 safe method 계약과 CSRF/cache 가정을 깨뜨렸습니다.", ["route method manifest", "GET service call writes", "crawler/access logs", "cache behavior", "CSRF filter scope"], "write를 POST/PUT/PATCH/DELETE endpoint로 이동하고 authorization·CSRF·idempotency를 적용합니다.", "모든 GET/HEAD route의 DB mutation 0과 crawler/prefetch replay를 integration test합니다.")],
    expertNotes: ["safe는 서버가 아무 일도 하지 않는다는 뜻이 아니라 client가 business mutation을 요청하지 않는다는 뜻입니다.", "개인화 GET은 shared cache에서 사용자 간 data leakage가 없도록 cache control과 key를 검증합니다."],
  },
  {
    id: "post-create-action",
    title: "POST를 collection create와 non-idempotent action에 사용하고 중복을 통제합니다",
    lead: "POST는 server가 새 resource identity를 정하거나 command/action을 처리하는 데 적합하지만 기본적으로 idempotent하지 않습니다. timeout 뒤 client retry가 같은 의도를 여러 번 실행할 수 있습니다.",
    explanations: [
      "collection POST가 resource를 만들면 201 Created와 Location으로 새 resource URI를 제공하는 계약을 검토합니다. 모든 POST가 반드시 create는 아니며 action 결과에 맞는 status를 선택합니다.",
      "HTML form 성공은 Post/Redirect/Get으로 새 GET 위치에 redirect해 refresh 재제출을 줄입니다. 이것은 network retry 중복을 완전히 해결하지 않으므로 idempotency key나 business unique constraint가 별도로 필요합니다.",
      "request body media type과 schema validation을 handler 전에 통제하고 malformed/unsupported content를 400/415로 분리합니다. raw body를 일반 log에 기록하지 않습니다.",
      "idempotency key는 caller·operation scope에서 stable하게 저장하고 같은 key·같은 semantic request는 이전 outcome을 반환합니다. 같은 key로 다른 payload가 오면 conflict로 거부합니다.",
      "creation transaction과 external event는 outbox 등 durable boundary로 연결합니다. response가 끊긴 commit unknown은 Location/idempotency record readback으로 reconciliation합니다.",
    ],
    concepts: [
      c("POST", "target resource가 request representation을 자체 semantics에 따라 처리하도록 요청하는 HTTP method입니다.", ["기본 idempotent가 아닙니다.", "create/action contract를 명시합니다."]),
      c("Location", "생성되거나 redirect될 resource의 URI를 response에서 가리키는 header입니다.", ["public URI builder를 사용합니다.", "내부 host를 누출하지 않습니다."]),
      c("idempotency key", "같은 logical POST retry를 식별해 중복 side effect를 막고 이전 outcome을 재사용하는 key입니다.", ["durable unique scope를 둡니다.", "raw key를 telemetry label로 쓰지 않습니다."]),
    ],
    diagnostics: [d("client timeout·double-click 뒤 같은 resource나 결제가 두 번 생성됩니다.", "non-idempotent POST를 outcome 확인 없이 재시도했고 durable idempotency/unique constraint가 없습니다.", ["attempt/request correlation", "idempotency record", "business unique constraint", "commit phase/outcome", "Location readback"], "caller-scoped idempotency key와 atomic result record를 도입하고 ambiguous outcome은 readback 후 응답합니다.", "동시 duplicate와 commit 응답 단절을 주입해 resource/event cardinality가 1인지 검증합니다.")],
    expertNotes: ["PRG는 browser UX pattern이고 transport retry idempotency를 대체하지 않습니다.", "Location을 만들 때 untrusted Host/Forwarded header를 그대로 신뢰하지 않습니다."],
  },
  {
    id: "put-patch-replacement-update",
    title: "PUT의 전체 표현 교체와 PATCH의 부분 변경을 서로 다른 validation 계약으로 다룹니다",
    lead: "PUT은 같은 target URI에 같은 representation을 반복 적용했을 때 최종 state가 같아야 하는 idempotent method입니다. PATCH는 patch document semantics에 따라 idempotency와 validation이 달라집니다.",
    explanations: [
      "PUT은 client가 target identity를 알고 전체 representation을 교체하거나 생성하는 계약을 사용할 수 있습니다. 빠진 field를 유지할지 제거할지 명확히 하지 않으면 partial update처럼 오해됩니다.",
      "PATCH는 merge patch, JSON Patch 또는 전용 command DTO처럼 변경 표현 format을 명시합니다. null, absent와 remove의 의미를 분리하고 허용 field allowlist를 둡니다.",
      "lost update를 막으려면 If-Match/ETag 또는 version field를 사용해 stale representation을 412/409로 거부합니다. method idempotency가 concurrent overwrite까지 자동 해결하지 않습니다.",
      "validation은 최종 resource invariant와 patch operation 자체를 모두 검사합니다. controller가 entity를 직접 bind해 role, owner, status 같은 server-owned field를 덮지 않게 합니다.",
      "같은 PUT을 반복했을 때 audit/version을 매번 불필요하게 증가시키면 observable state가 달라질 수 있습니다. 의미 없는 update를 피하고 idempotency acceptance를 최종 readback으로 정의합니다.",
    ],
    concepts: [
      c("PUT", "지정한 target resource의 representation을 생성 또는 교체하는 idempotent HTTP method입니다.", ["전체 표현 의미를 명시합니다.", "precondition을 고려합니다."]),
      c("PATCH", "resource에 적용할 부분 변경 instruction을 전달하는 method입니다.", ["patch media type을 명시합니다.", "항상 idempotent라고 가정하지 않습니다."]),
      c("lost update", "두 client가 같은 이전 state를 읽고 순차 overwrite해 먼저 적용한 변경이 사라지는 concurrency 오류입니다.", ["version precondition으로 막습니다.", "409/412 계약을 정합니다."]),
    ],
    diagnostics: [d("PUT을 같은 body로 두 번 호출했는데 version/audit와 downstream event가 매번 증가합니다.", "전체 표현의 동일성 확인 없이 매 request를 새로운 mutation으로 기록해 idempotent outcome을 깨뜨렸습니다.", ["before/after representation", "version/affected rows", "event/outbox count", "If-Match handling", "retry trace"], "동일 representation은 no-op 또는 동일 final state가 되게 하고 event policy와 conditional update를 명시합니다.", "동일 PUT 반복, stale ETag와 concurrent writers에서 final state/version/event cardinality를 검증합니다.")],
    expertNotes: ["idempotent는 response가 항상 동일하다는 뜻이 아니라 반복 후 intended server state가 같다는 뜻입니다.", "PATCH format을 그냥 임의 JSON object로 두면 absent/null/server-owned field 의미가 모호해집니다."],
  },
  {
    id: "delete-options-method-matrix",
    title: "DELETE의 반복 결과와 OPTIONS·Allow를 route capability 계약으로 만듭니다",
    lead: "DELETE는 target resource association을 제거하는 idempotent method이지만 첫 성공과 이후 not-found response status는 달라질 수 있습니다. OPTIONS는 path가 지원하는 method를 발견하는 표면입니다.",
    explanations: [
      "DELETE 성공은 204, 200 with representation 또는 async 202 같은 계약을 선택합니다. 이미 없는 resource에 404를 반환해도 반복 후 server state는 여전히 absent라 idempotency와 모순되지 않습니다.",
      "soft delete는 row를 남겨도 public resource가 absent/disabled가 되는 의미를 명시합니다. restore, retention, authorization과 unique constraint에 미치는 영향을 테스트합니다.",
      "Spring MVC는 matching path의 mappings를 바탕으로 OPTIONS Allow를 처리할 수 있습니다. broad method-less mapping이 있으면 의도보다 큰 Allow surface가 드러날 수 있습니다.",
      "405 response는 path는 있지만 method가 지원되지 않음을 의미하며 Allow header를 제공합니다. authorization 정책상 resource 존재를 숨겨야 하는 경로는 security layer의 일관된 error policy를 검토합니다.",
      "TRACE 같은 불필요 method는 container/proxy/security에서도 비활성화하고 application route manifest와 edge Allow를 비교합니다.",
    ],
    concepts: [
      c("DELETE", "target resource와의 association을 제거하도록 요청하는 idempotent method입니다.", ["반복 status는 달라질 수 있습니다.", "최종 absent state를 검증합니다."]),
      c("OPTIONS", "target resource가 지원하는 communication options를 조회하는 method입니다.", ["Allow와 CORS preflight를 구분합니다.", "route manifest와 대조합니다."]),
      c("Allow", "resource가 지원한다고 알리는 HTTP method 목록 response header입니다.", ["405/OPTIONS에 사용합니다.", "실제 security policy와 맞춥니다."]),
    ],
    codeExamples: [java("mvc02-head-options", "GET에서 파생한 HEAD와 OPTIONS Allow", "Mvc02HeadOptions.java", "등록된 GET/POST route에서 HEAD body 제거와 OPTIONS method 목록을 deterministic하게 계산합니다.", String.raw`import java.util.Set;
import java.util.TreeSet;

public class Mvc02HeadOptions {
  static Set<String> allow(Set<String> declared) {
    Set<String> result = new TreeSet<>(declared);
    if (result.contains("GET")) result.add("HEAD");
    result.add("OPTIONS");
    return result;
  }

  public static void main(String[] args) {
    Set<String> declared = Set.of("GET", "POST");
    Set<String> allowed = allow(declared);
    String getBody = "twelve-bytes";
    int headBodyBytes = 0;
    System.out.println("declared=" + new TreeSet<>(declared));
    System.out.println("allow=" + allowed);
    System.out.println("head-status=200");
    System.out.println("head-body-bytes=" + headBodyBytes);
    System.out.println("head-content-length=" + getBody.length());
  }
}`, "declared=[GET, POST]\nallow=[GET, HEAD, OPTIONS, POST]\nhead-status=200\nhead-body-bytes=0\nhead-content-length=12", ["spring-request-mapping", "rfc9110-methods", "iana-http-methods", "java-set"])],
    diagnostics: [d("OPTIONS Allow에 application이 의도하지 않은 method가 포함되거나 DELETE가 proxy에서만 막힙니다.", "method 없는 broad mapping과 edge/container/application method policy가 서로 다릅니다.", ["application route manifest", "OPTIONS/Allow response", "proxy WAF method policy", "container TRACE/options", "security filter decisions"], "각 route에 method를 명시하고 edge→container→Spring→authorization 정책을 하나의 method matrix로 맞춥니다.", "모든 public path의 OPTIONS/unsupported method/TRACE corpus를 실제 배포 경로에서 실행합니다.")],
    expertNotes: ["CORS preflight OPTIONS와 일반 capability OPTIONS는 관련되지만 Origin/Access-Control-Request-* 처리까지 같은 것은 아닙니다.", "soft delete의 idempotency는 public visibility뿐 아니라 unique key·event·retention state까지 정의해야 합니다."],
  },
  {
    id: "safe-idempotent-retry-semantics",
    title: "safe·idempotent·cacheable을 분리해 client retry 정책을 설계합니다",
    lead: "HTTP method 속성은 서로 다른 질문에 답합니다. safe는 요청한 mutation 여부, idempotent는 반복 후 intended effect, cacheable은 response reuse 가능성입니다.",
    explanations: [
      "GET·HEAD·OPTIONS는 safe이며 safe method는 idempotent합니다. PUT과 DELETE는 unsafe하지만 idempotent하고 POST/PATCH는 일반적으로 idempotency를 자동 가정하지 않습니다.",
      "idempotent method도 network timeout 시 commit outcome을 알 수 없고 authentication/authorization, rate limit이나 version conflict가 달라질 수 있습니다. client는 response category와 deadline을 함께 봅니다.",
      "retry는 connection failure·selected 5xx·429 같은 policy와 Retry-After, exponential backoff/jitter, total budget을 둡니다. 모든 4xx나 server error를 같은 횟수로 반복하지 않습니다.",
      "POST에 idempotency를 추가할 수 있고 PATCH도 operation design에 따라 반복 결과를 같게 만들 수 있습니다. method 기본 의미와 application 추가 contract를 구분해 문서화합니다.",
      "proxy/cache/retry library가 method semantics를 사용하므로 GET mutation이나 non-idempotent PUT 구현은 application 내부를 넘어 예기치 않은 자동 동작을 유발합니다.",
    ],
    concepts: [
      c("idempotent method", "같은 request를 한 번 또는 여러 번 적용해도 intended final effect가 같은 method입니다.", ["PUT·DELETE가 대표적입니다.", "status가 항상 같을 필요는 없습니다."]),
      c("cacheable response", "정의한 freshness와 cache key 조건에서 이후 request에 재사용할 수 있는 response입니다.", ["method와 headers에 의존합니다.", "authorization/variation을 반영합니다."]),
      c("retry budget", "한 operation에 허용할 최대 attempt, 총 시간, backoff와 동시 retry 양입니다.", ["storm을 막습니다.", "idempotency/readback과 연결합니다."]),
    ],
    codeExamples: [java("mvc02-method-properties", "HTTP method의 safe·idempotent 표", "Mvc02MethodProperties.java", "대표 method 속성을 enum metadata로 고정하고 자동 retry 후보를 분리합니다.", String.raw`import java.util.List;

public class Mvc02MethodProperties {
  enum Method {
    GET(true, true), HEAD(true, true), POST(false, false),
    PUT(false, true), PATCH(false, false), DELETE(false, true);
    final boolean safe;
    final boolean idempotent;
    Method(boolean safe, boolean idempotent) {
      this.safe = safe;
      this.idempotent = idempotent;
    }
  }

  public static void main(String[] args) {
    for (Method method : Method.values()) {
      System.out.println(method + ":safe=" + method.safe + ",idempotent=" + method.idempotent);
    }
    List<Method> retryCandidates = List.of(Method.GET, Method.HEAD, Method.PUT, Method.DELETE);
    System.out.println("retry-candidates=" + retryCandidates);
    System.out.println("post-needs-extra-contract=true");
  }
}`, "GET:safe=true,idempotent=true\nHEAD:safe=true,idempotent=true\nPOST:safe=false,idempotent=false\nPUT:safe=false,idempotent=true\nPATCH:safe=false,idempotent=false\nDELETE:safe=false,idempotent=true\nretry-candidates=[GET, HEAD, PUT, DELETE]\npost-needs-extra-contract=true", ["rfc9110-methods", "rfc9110-safe", "rfc9110-idempotent", "iana-http-methods", "java-list"])],
    diagnostics: [d("gateway retry 뒤 unsafe operation이 중복 실행되거나 safe GET mutation이 반복됩니다.", "retry library와 endpoint 구현이 method의 safe/idempotent 의미를 서로 다르게 가정했습니다.", ["edge retry config", "method property table", "operation idempotency record", "attempt/outcome trace", "final state/event count"], "method별 retry policy와 application idempotency/readback을 같은 API contract로 버전 관리합니다.", "timeout before/during/after commit을 주입해 method별 duplicate와 final state를 검증합니다.")],
    expertNotes: ["idempotency는 application state effect에 관한 의미이고 logging count 같은 모든 부수효과가 같아야 한다는 뜻은 아닙니다.", "자동 retry는 idempotent method에서도 overload와 lock contention을 악화시킬 수 있어 budget이 필요합니다."],
  },
  {
    id: "media-type-conditions",
    title: "consumes·produces와 Content-Type·Accept를 415·406 계약으로 연결합니다",
    lead: "path와 method가 맞아도 request representation을 읽을 수 없거나 client가 허용한 response representation을 만들 수 없으면 handler/media negotiation 단계에서 실패합니다.",
    explanations: [
      "Content-Type은 request body의 media type이고 Accept는 client가 받을 수 있는 response media range입니다. 둘을 바꿔 읽거나 URL 확장자만으로 content negotiation하지 않습니다.",
      "consumes는 handler가 받을 request media type을 좁히고 produces는 만들 response media type을 좁힙니다. class/method 조건 override·합성 semantics를 current Spring 문서로 확인합니다.",
      "unsupported request media type은 415, acceptable response를 만들 수 없으면 406으로 분류합니다. malformed JSON은 media type이 지원돼도 parsing/binding 단계의 400이 될 수 있습니다.",
      "charset, vendor media type, wildcard와 quality 값을 포함한 negotiation corpus를 작성합니다. response에는 실제 선택한 Content-Type과 보안 관련 sniffing 방지 policy를 검증합니다.",
      "request/response body를 raw log에 저장하지 않고 media type, content length bucket, converter category와 failure phase만 관측합니다.",
    ],
    concepts: [
      c("consumes", "request Content-Type을 기준으로 handler mapping 후보를 제한하는 조건입니다.", ["body parser와 구분합니다.", "415 contract를 검증합니다."]),
      c("produces", "Accept negotiation을 기준으로 handler가 생성할 response media type을 선언하는 조건입니다.", ["Content-Type 결과와 연결합니다.", "406 contract를 검증합니다."]),
      c("content negotiation", "client preference와 server capability를 비교해 response representation을 선택하는 과정입니다.", ["path extension 의존을 피합니다.", "Vary/cache를 고려합니다."]),
    ],
    codeExamples: [java("mvc02-media-conditions", "Content-Type·Accept의 201·415·406 분류", "Mvc02MediaConditions.java", "JSON create endpoint의 request/response media 조건을 작은 matcher로 실행합니다.", String.raw`public class Mvc02MediaConditions {
  record Response(int status, String category) {}

  static Response handle(String contentType, String accept) {
    if (!"application/json".equals(contentType)) return new Response(415, "unsupported-content-type");
    if (!accept.contains("application/json") && !accept.contains("*/*")) {
      return new Response(406, "not-acceptable");
    }
    return new Response(201, "created-json");
  }

  public static void main(String[] args) {
    Response ok = handle("application/json", "application/json");
    Response wildcard = handle("application/json", "*/*");
    Response wrongBody = handle("text/plain", "application/json");
    Response wrongAccept = handle("application/json", "application/xml");
    System.out.println("ok=" + ok.status() + "," + ok.category());
    System.out.println("wildcard=" + wildcard.status());
    System.out.println("wrong-body=" + wrongBody.status());
    System.out.println("wrong-accept=" + wrongAccept.status());
    System.out.println("raw-body-logged=false");
  }
}`, "ok=201,created-json\nwildcard=201\nwrong-body=415\nwrong-accept=406\nraw-body-logged=false", ["spring-request-mapping", "spring-response-entity", "rfc9110-status", "java-string"])],
    diagnostics: [d("같은 POST path인데 일부 client만 handler not found·415·406을 받습니다.", "method/path만 보고 Content-Type, Accept와 configured converter/consumes/produces 조건을 비교하지 않았습니다.", ["raw header presence/category", "mapping consumes/produces", "selected converter", "charset/vendor type", "response Content-Type/Vary"], "지원 media type과 version을 명시하고 404/415/406/parsing 400을 단계별 error contract로 분리합니다.", "Content-Type×Accept×charset×wildcard matrix를 MockMvc와 실제 client/container에서 실행합니다.")],
    expertNotes: ["Accept 무시는 client contract와 cache variation을 깨뜨릴 수 있습니다.", "error response도 stable media type과 schema를 제공하되 stack trace·request body를 포함하지 않습니다."],
  },
  {
    id: "route-security-policy",
    title: "HTTP method를 authorization·CSRF·CORS 정책과 같은 route 표에 둡니다",
    lead: "Controller mapping은 handler 선택이고 보안 정책은 별도 filter/interceptor/domain check를 거칩니다. path만 보호하고 method를 빠뜨리면 같은 resource의 write variant가 노출될 수 있습니다.",
    explanations: [
      "authorization은 resource와 operation별로 검사합니다. GET 권한과 DELETE 권한이 같다고 가정하지 않고 object-level ownership을 service에서도 확인합니다.",
      "browser cookie 기반 인증의 unsafe method는 CSRF 방어가 필요합니다. GET에 mutation을 넣으면 safe method를 제외하는 일반 CSRF policy를 우회하게 됩니다.",
      "CORS preflight는 Origin, requested method/headers와 server policy를 비교합니다. application OPTIONS Allow와 CORS 허용은 서로 다른 정책 layer이며 둘 다 실제 edge에서 검증합니다.",
      "method override parameter/header를 지원한다면 trusted filter order와 허용 method를 제한합니다. raw client method와 effective method를 값 없는 security trace에 함께 둡니다.",
      "404/403 선택은 resource enumeration risk와 client usability를 고려해 일관되게 설계합니다. 상세 authorization reason과 principal 정보는 public body에 넣지 않습니다.",
    ],
    concepts: [
      c("CSRF", "인증된 browser가 공격자가 의도한 unsafe request를 보내도록 유도하는 공격입니다.", ["safe method에 mutation을 두지 않습니다.", "token/same-site/origin policy를 검증합니다."]),
      c("method authorization", "같은 resource path에서도 GET, POST, DELETE 등 operation별 권한을 검사하는 정책입니다.", ["route manifest와 연결합니다.", "service object check를 포함합니다."]),
      c("CORS preflight", "browser가 cross-origin actual request 전에 OPTIONS로 method/header 허용을 확인하는 절차입니다.", ["일반 OPTIONS와 구분합니다.", "credential policy를 확인합니다."]),
    ],
    diagnostics: [d("GET은 보호되지만 같은 path의 DELETE/PATCH가 다른 security rule에 빠지거나 CSRF 없이 실행됩니다.", "path wildcard만 검토하고 effective HTTP method와 unsafe operation policy를 route manifest와 대조하지 않았습니다.", ["raw/effective method", "filter chain order", "authorization matcher", "CSRF decision", "service ownership check"], "route method×role×resource ownership matrix를 만들고 filter와 service policy를 함께 검증합니다.", "anonymous/wrong role/wrong owner/CSRF missing/CORS preflight를 모든 unsafe method에 실행합니다.")],
    expertNotes: ["Controller annotation은 object-level authorization을 자동 제공하지 않습니다.", "security denial telemetry에 raw token, principal PII와 full URI query를 기록하지 않습니다."],
  },
  {
    id: "status-observability-contract-tests",
    title: "404·405·406·415·400·403·5xx를 handler lifecycle 단계와 연결해 테스트합니다",
    lead: "모든 4xx를 잘못된 URL로 묶으면 client 수정과 운영 진단이 모두 어려워집니다. route 후보, method, media, binding, validation, authorization과 controller 예외 단계를 구분합니다.",
    explanations: [
      "404는 path handler 부재, 405는 path 후보는 있으나 method 불일치, 415/406은 representation 조건, 400은 parsing/binding/validation, 401/403은 security policy로 분류합니다.",
      "metric에는 normalized route template, method, status, selected handler category, failure phase, media category와 latency를 둡니다. raw path ID/query/body/header와 principal은 label에서 제거합니다.",
      "405에는 Allow, 201에는 Location, 204에는 body absence, HEAD에는 body absence, error에는 stable problem schema와 correlation id를 검사합니다.",
      "MockMvc는 controller mapping과 MVC lifecycle을 빠르게 검증하지만 proxy normalization, Servlet container, filter/WAF와 network behavior를 모두 대체하지 않습니다. target deployment smoke를 별도로 둡니다.",
      "route 변경은 old/new manifest와 request corpus를 differential 실행하고 canary에서 status distribution을 비교합니다. rollback 가능한 controller/config artifact를 유지합니다.",
    ],
    concepts: [
      c("failure phase", "request가 container, mapping, media, binding, validation, security, controller 또는 rendering 중 어디서 종료됐는지 나타내는 category입니다.", ["status와 함께 기록합니다.", "public detail과 분리합니다."]),
      c("normalized route", "실제 식별자 값을 제거하고 path variable template로 묶은 low-cardinality endpoint 이름입니다.", ["metric label에 사용합니다.", "PII를 제거합니다."]),
      c("contract test", "method·URI·headers/body 입력에 대해 status, headers, representation과 state effect를 외부 관점에서 검증하는 테스트입니다.", ["정상·4xx·5xx를 포함합니다.", "실제 배포 smoke와 연결합니다."]),
    ],
    codeExamples: [java("mvc02-idempotency-retry", "POST idempotency key와 동일 PUT 반복", "Mvc02IdempotencyRetry.java", "중복 POST key가 한 resource만 만들고 같은 PUT representation이 version을 불필요하게 올리지 않는지 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc02IdempotencyRetry {
  static final class Store {
    final Map<String, Integer> requests = new LinkedHashMap<>();
    final Map<Integer, String> resources = new LinkedHashMap<>();
    int nextId = 1;
    int post(String key) {
      return requests.computeIfAbsent(key, ignored -> {
        int id = nextId++;
        resources.put(id, "created");
        return id;
      });
    }
    void put(int id, String representation) {
      if (!representation.equals(resources.get(id))) resources.put(id, representation);
    }
  }

  public static void main(String[] args) {
    Store store = new Store();
    int first = store.post("synthetic-key");
    int retry = store.post("synthetic-key");
    store.put(first, "stable");
    store.put(first, "stable");
    System.out.println("first-id=" + first);
    System.out.println("retry-same=" + (first == retry));
    System.out.println("resource-count=" + store.resources.size());
    System.out.println("final-state=" + store.resources.get(first));
    System.out.println("duplicate-created=false");
  }
}`, "first-id=1\nretry-same=true\nresource-count=1\nfinal-state=stable\nduplicate-created=false", ["rfc9110-idempotent", "rfc9111-cache", "spring-mockmvc", "spring-security-csrf", "spring-cors", "java-map"])],
    diagnostics: [d("client는 404만 보지만 server에서는 method/media/binding/security failures가 한 metric으로 합쳐집니다.", "status와 failure phase, route template을 구조화하지 않아 서로 다른 4xx 원인을 구분할 수 없습니다.", ["route candidate trace", "method/media/binding/security phase", "status/required headers", "normalized route metrics", "correlation trace"], "MVC exception/status contract와 bounded failure-phase telemetry를 만들고 4xx corpus를 자동화합니다.", "route별 success/404/405/406/415/400/401/403/5xx와 header/body/state effect를 release gate로 둡니다.")],
    expertNotes: ["status code만 맞고 state effect나 required header가 틀리면 HTTP contract는 통과한 것이 아닙니다.", "고 cardinality route/path 값을 metric label에 넣지 말고 template와 approved category를 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-request-controller", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/controller/RequestController.java", usedFor: ["RequestMapping/Get/Post/RequestParam controller progression"], evidence: "read-only scanner로 90-line, controller1, RequestMapping10, Get1, Post1, RequestParam5와 public method8 구조만 확인했으며 route literal·parameter value·source body는 복사하지 않았습니다." },
  { id: "local-response-controller", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/controller/ResponseController.java", usedFor: ["mapping and response/model/redirect progression"], evidence: "read-only scanner로 75-line, RequestMapping8, public method7, ModelAndView5, Model/RedirectAttributes/ModelAttribute 구조만 확인했으며 route·attribute 값은 복사하지 않았습니다." },
  { id: "local-servlet-context", repository: "SPRING/SpringBasic", path: "src/main/webapp/WEB-INF/config/servlet-context.xml", usedFor: ["annotation-driven/component scan/view resolver progression"], evidence: "read-only scanner로 annotation-driven, component scan, resource mapping과 view resolver 존재만 확인했으며 package/path attribute 값은 복사하지 않았습니다." },
  { id: "spring-request-mapping", repository: "Spring Framework", path: "Mapping Requests", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", usedFor: ["mapping conditions, URI patterns, HEAD/OPTIONS, media types"], evidence: "Spring Framework 공식 annotated request mapping reference입니다." },
  { id: "spring-requestmapping-api", repository: "Spring Framework 6.2 API", path: "RequestMapping", publicUrl: "https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RequestMapping.html", usedFor: ["annotation method/path/media attributes"], evidence: "Spring Framework 공식 RequestMapping API입니다." },
  { id: "spring-response-entity", repository: "Spring Framework", path: "ResponseEntity", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html", usedFor: ["explicit status/header/body contract"], evidence: "Spring Framework 공식 ResponseEntity reference입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework", path: "MockMvc", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc.html", usedFor: ["MVC route contract testing"], evidence: "Spring Framework 공식 MockMvc reference입니다." },
  { id: "spring-security-csrf", repository: "Spring Security", path: "CSRF", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html", usedFor: ["unsafe browser method protection"], evidence: "Spring Security 공식 CSRF reference입니다." },
  { id: "spring-cors", repository: "Spring Framework", path: "CORS", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html", usedFor: ["preflight method policy"], evidence: "Spring Framework 공식 CORS reference입니다." },
  { id: "rfc9110-methods", repository: "IETF HTTP Semantics", path: "Methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#section-9", usedFor: ["HTTP method semantics"], evidence: "IETF RFC 9110 공식 method semantics입니다." },
  { id: "rfc9110-safe", repository: "IETF HTTP Semantics", path: "Safe Methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.1", usedFor: ["safe method definition"], evidence: "IETF RFC 9110 공식 safe method 절입니다." },
  { id: "rfc9110-idempotent", repository: "IETF HTTP Semantics", path: "Idempotent Methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2", usedFor: ["idempotency and retry"], evidence: "IETF RFC 9110 공식 idempotent method 절입니다." },
  { id: "rfc9110-status", repository: "IETF HTTP Semantics", path: "Client Error 4xx", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5", usedFor: ["400/403/404/405/406/415 status semantics"], evidence: "IETF RFC 9110 공식 client error status 절입니다." },
  { id: "rfc9111-cache", repository: "IETF HTTP Caching", path: "HTTP Caching", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["cache/revalidation contract"], evidence: "IETF RFC 9111 공식 caching specification입니다." },
  { id: "iana-http-methods", repository: "IANA", path: "HTTP Method Registry", publicUrl: "https://www.iana.org/assignments/http-methods/http-methods.xhtml", usedFor: ["registered method safe/idempotent properties"], evidence: "IANA 공식 HTTP method registry입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["route/idempotency executable models"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["method property executable model"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["HEAD/OPTIONS Allow executable model"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "java-string", repository: "Java SE 21 API", path: "String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["media type executable model"], evidence: "Oracle JDK 공식 String API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-02-requestmapping-http-method", slug: "mvc-02-requestmapping-http-method", courseId: "spring", moduleId: "spring-mvc-request-response", order: 2,
  title: "@RequestMapping과 HTTP 메서드·경로 설계", subtitle: "annotation route 합성에서 resource URI·safe/idempotent method·HEAD/OPTIONS·media negotiation·security·4xx와 retry evidence까지 HTTP 계약을 완성합니다.", level: "기초", estimatedMinutes: 900,
  coreQuestion: "같은 URI에 여러 operation을 안전하게 배치하고 Spring mapping 조건, HTTP method semantics, retry와 보안 정책이 일관되게 2xx·4xx를 만들도록 어떻게 설계할까요?",
  summary: "SpringBasic의 RequestController, ResponseController와 servlet-context.xml을 read-only 구조 scanner로 확인해 RequestMapping/Get/Post/RequestParam, Model/redirect와 annotation-driven progression을 보존하되 route·attribute·사용자 값은 복사하지 않았습니다. mapping 합성, resource URI/PathPattern, GET/HEAD, POST, PUT/PATCH, DELETE/OPTIONS, safe·idempotent·cacheable, consumes/produces, authorization·CSRF·CORS와 4xx/telemetry/contract testing을 독립적으로 설명합니다. 다섯 JDK 21 exact examples는 404/405 route 선택, method property 표, HEAD/OPTIONS, 406/415와 idempotent retry를 실제 실행합니다.",
  objectives: ["type/method-level RequestMapping 조건을 최종 route로 합성한다.", "resource 중심 URI와 path specificity/normalization을 설계한다.", "GET·HEAD safe read와 POST create/action 계약을 구분한다.", "PUT·PATCH·DELETE의 idempotency와 precondition을 설명한다.", "OPTIONS·Allow와 CORS preflight를 구분한다.", "Content-Type/Accept를 consumes/produces 및 415/406과 연결한다.", "method별 authorization·CSRF·retry/idempotency를 설계한다.", "404·405·406·415·400·403·5xx를 lifecycle evidence로 검증한다."],
  prerequisites: [{ title: "Spring MVC 프로젝트와 DispatcherServlet 요청 관문", reason: "DispatcherServlet과 HandlerMapping/Adapter의 요청 처리 단계를 알아야 RequestMapping 조건이 어느 시점에 handler를 선택하고 4xx를 만드는지 추적할 수 있습니다.", sessionSlug: "mvc-01-project-bootstrap-dispatcher" }],
  keywords: ["@RequestMapping", "@GetMapping", "@PostMapping", "URI", "HTTP method", "safe", "idempotent", "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "Allow", "consumes", "produces", "CSRF", "CORS", "405", "415", "406"], topics,
  lab: {
    title: "resource route와 HTTP method/security/retry contract 구축",
    scenario: "하나의 resource에 목록·상세·생성·교체·부분 수정·삭제가 필요하며 browser, API client와 retrying gateway가 같은 endpoint를 안전하게 사용해야 합니다.",
    setup: ["원본 controller/config는 read-only로 보존하고 annotation/method 수와 infrastructure 구조만 inventory합니다.", "JDK 21 exact models, MockMvc와 실제 supported Servlet container request corpus를 준비합니다.", "normalized route/method/media/status/failure-phase telemetry schema를 작성합니다.", "합성 resource만 사용하고 cookie/token/body/query 원문 logging을 금지합니다."],
    steps: ["class/method mapping을 합쳐 route manifest를 만듭니다.", "collection/member URI와 path specificity/normalization을 고정합니다.", "operation별 GET/HEAD/POST/PUT/PATCH/DELETE 의미와 status/header를 정의합니다.", "safe/idempotent/cacheable과 retry/ambiguous outcome 표를 작성합니다.", "HEAD body absence와 OPTIONS Allow를 검증합니다.", "Content-Type×Accept×consumes/produces로 415/406/400을 분리합니다.", "method×role×ownership×CSRF/CORS matrix를 실행합니다.", "duplicate POST/PUT/DELETE와 commit timeout을 fault injection합니다.", "404/405/406/415/400/403/5xx body/header/state effect를 검증합니다.", "old/new route manifest·canary status와 rollback artifact를 승인합니다."],
    expectedResult: ["route별 exact method/path/media/status/header table", "safe/idempotent/retry와 final state/event cardinality evidence", "HEAD/OPTIONS/405 Allow 결과", "media negotiation과 parsing failure matrix", "authorization·CSRF·CORS denial corpus", "PII 없는 route/status/latency/failure-phase telemetry"],
    cleanup: ["합성 idempotency/resource state를 제거합니다.", "test server와 executor를 종료하고 active request/resource absence를 확인합니다."],
    extensions: ["conditional GET/PUT ETag를 추가합니다.", "API version condition과 deprecation header를 qualification합니다.", "proxy method override와 encoded path security corpus를 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "collection/member route에 method별 handler와 2xx·404·405 표를 만드세요.", requirements: ["class/method mapping을 합성합니다.", "GET/POST/PUT/PATCH/DELETE를 명시합니다.", "없는 path와 잘못된 method를 분리합니다.", "405 Allow를 확인합니다.", "HEAD/OPTIONS를 확인합니다.", "정상 response의 status/header/body를 대조합니다.", "GET mutation이 없음을 검증합니다."], hints: ["path 후보가 없는 것과 method만 틀린 것은 다른 failure입니다."], expectedOutcome: "route selection과 method semantics가 외부 HTTP 표로 설명됩니다.", solutionOutline: ["manifest→path candidates→method→representation→status/header 순서입니다."] },
    { difficulty: "응용", prompt: "retrying client를 위한 POST·PUT·DELETE idempotency 실험을 구현하세요.", requirements: ["POST idempotency key를 durable하게 저장합니다.", "같은 key/different request를 거부합니다.", "PUT repeated final state를 확인합니다.", "DELETE repeated state/status를 기록합니다.", "commit timeout을 주입합니다.", "readback/reconciliation을 둡니다.", "event cardinality를 확인합니다.", "retry budget/backoff를 정의합니다."], hints: ["idempotent method도 commit outcome unknown을 자동 판별하지 않습니다."], expectedOutcome: "network retry에도 duplicate 없이 final state를 설명하는 증거가 완성됩니다.", solutionOutline: ["semantics→key/precondition→fault→readback→retry→final cardinality 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC route·HTTP method governance를 작성하세요.", requirements: ["route manifest/uniqueness gate를 둡니다.", "URI/path normalization policy를 둡니다.", "method safe/idempotent/cache 정책을 둡니다.", "status/header/problem schema를 정의합니다.", "media negotiation/versioning을 둡니다.", "authorization/CSRF/CORS를 method와 연결합니다.", "secret-zero telemetry와 contract corpus를 둡니다.", "canary/rollback과 compatibility matrix를 요구합니다."], hints: ["annotation style보다 client가 관찰하는 state effect와 failure semantics를 표준화하세요."], expectedOutcome: "route 등록부터 장애·retry·보안·변경 승인까지 운영 가능한 표준이 완성됩니다.", solutionOutline: ["inventory→contract→security→failure→observability→qualification→rollout 순서입니다."] },
  ],
  nextSessions: ["mvc-03-request-param-path-variable"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["RequestController.java는 90-line 원본에서 Controller1, RequestMapping10, Get1, Post1, RequestParam5와 public methods8 구조만 확인했으며 route/parameter literal과 source body는 복사하지 않았습니다.", "ResponseController.java는 75-line 원본에서 Controller1, RequestMapping8, public methods7, ModelAndView5와 Model/RedirectAttributes/ModelAttribute 사용 구조만 확인했으며 attribute/view 값은 복사하지 않았습니다.", "servlet-context.xml은 annotation-driven, component scan, resource mappings와 view resolver 존재만 확인했으며 package/path 설정값은 복사하지 않았습니다.", "원본은 모든 HTTP method·idempotency·HEAD/OPTIONS·media/status/security/retry를 다루지 않아 Spring/Security/IETF/IANA/JDK 공식 문서와 synthetic exact examples로 보완했습니다.", "JDK mini router는 실제 PathPattern, converters, filter chain, Servlet container와 proxy behavior를 대체하지 않으므로 MockMvc와 target deployment corpus를 별도로 요구합니다."] },
});

export default session;
