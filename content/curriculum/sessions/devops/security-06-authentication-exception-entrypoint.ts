import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefs = ["local-security-config", "local-jwt-filter", "local-build"];

const topics = [
  appliedTopic({
    id: "security-failure-source-audit", title: "로컬 401 응답 경로와 token logging 위험을 값 없이 감사합니다",
    lead: "SecurityConfig의 inline AuthenticationEntryPoint와 custom JWT filter의 missing·invalid·expired credential branches가 어느 filter에서 response를 직접 commit하는지 복원합니다.",
    mechanism: "로컬 snapshot은 protected resource의 unauthenticated failure와 custom filter token failures를 각각 JSON 401로 작성하지만 AccessDeniedHandler는 명시하지 않습니다. JwtRequestFilter가 Authorization header와 token을 log하는 코드는 credential disclosure 위험이므로 공개 예제에 복사하지 않고 rotation·log purge가 필요한 finding으로 기록합니다.",
    workflow: "원본 hash→filter order→failure source→thrown/handled exception→context clearing→entry point/denied handler/direct write→status/media/schema/headers→logs 순으로 redacted decision graph를 만듭니다.",
    invariants: "실제 token, header, subject, route와 response message를 복사하지 않고 401과 403을 같은 오류로 합치지 않으며 response가 commit된 뒤 chain을 계속 진행하지 않습니다.",
    edgeCases: "missing/malformed/expired/invalid credential, authenticated insufficient authority, anonymous AccessDeniedException, committed response, async/error dispatch와 downstream exception을 포함합니다.",
    failureModes: "모든 보안 실패를 custom filter에서 직접 JSON으로 쓰면 ExceptionTranslationFilter와 handler contract를 우회해 schema/header/log/metrics가 분기마다 달라집니다.",
    verification: "source hashes, response commit/return, SecurityContext state, filter order, status/media/body/header와 no-token-in-log를 unit·MockMvc·raw HTTP에서 확인합니다.",
    operations: "failure source, stable code, auth state, credential kind와 policy revision만 기록하고 Authorization, token, exception stack의 secret-bearing values는 제거합니다.",
    concepts: [c("security failure source", "credential parser, AuthenticationManager, AuthorizationManager처럼 최초 실패를 만든 경계입니다.", ["response handler와 구분합니다.", "correlation을 유지합니다."]), c("response commit", "status/header/body가 전송되기 시작해 안전하게 다른 handler로 바꾸기 어려운 시점입니다.", ["한 owner만 응답합니다.", "commit 뒤 chain 진행을 막습니다."]), c("credential disclosure", "token·password·authorization header가 log, trace, error 또는 artifact로 노출되는 사고입니다.", ["값을 기록하지 않습니다.", "발견 시 rotation과 purge를 검토합니다."])],
    codeExamples: [node("security06-source-graph", "redacted security-failure source graph", "Security06SourceGraph.mjs", "로컬 failure branches를 credential 값 없이 response owner 기준으로 분류합니다.", String.raw`const paths = [
  ["missing-auth", "authorization", "entry-point", 401],
  ["invalid-token", "custom-filter", "direct-response", 401],
  ["expired-token", "custom-filter", "direct-response", 401],
  ["insufficient-authority", "authorization", "default-denied-handler", 403],
];
for (const row of paths) console.log(row.join("|"));
console.log("credential-values-copied=false");
console.log("credential-logging-risk=found");`, "missing-auth|authorization|entry-point|401\ninvalid-token|custom-filter|direct-response|401\nexpired-token|custom-filter|direct-response|401\ninsufficient-authority|authorization|default-denied-handler|403\ncredential-values-copied=false\ncredential-logging-risk=found", localRefs.concat(["spring-architecture"]))],
  }),
  appliedTopic({
    id: "exception-translation-flow", title: "ExceptionTranslationFilter의 catch·anonymous 판정·handler 분기를 추적합니다",
    lead: "보안 예외를 일반 controller exception resolver처럼 이해하지 않고 FilterChainProxy 안에서 downstream AuthenticationException/AccessDeniedException을 HTTP action으로 번역하는 bridge로 봅니다.",
    mechanism: "ExceptionTranslationFilter는 나머지 chain을 호출하다 예외를 잡고 AuthenticationException 또는 anonymous로 판단된 AccessDeniedException이면 context를 지우고 request cache 뒤 AuthenticationEntryPoint를 사용합니다. 인증된 principal의 AccessDeniedException이면 AccessDeniedHandler가 처리합니다.",
    workflow: "filter ordering diagram에서 exception translator와 authorization filter/custom filters 위치를 표시하고 exception class, trust resolver, request cache, response handler와 context cleanup을 sequence로 작성합니다.",
    invariants: "보안 결정 자체와 HTTP translation을 분리하고 unauthenticated/forbidden 분기가 일관되며 API에서는 의도하지 않은 session request cache나 redirect가 생기지 않습니다.",
    edgeCases: "anonymous authentication token, remember-me, request cache disabled/stateless, nested exception, async dispatch, handler 자체 실패와 already committed response를 포함합니다.",
    failureModes: "translator보다 앞 custom filter에서 예외를 던지거나 response를 쓰면 기본 translation이 적용되지 않고, anonymous를 authenticated로 잘못 판단하면 401/403 의미가 뒤바뀝니다.",
    verification: "실제 filter chain과 exception path, SecurityContext clear, request cache/session creation, selected handler와 one-response invariant를 integration test합니다.",
    operations: "translator branch, handler ID, context-cleared, request-cache use와 committed-before-handler를 stable metrics로 관찰합니다.",
    concepts: [c("ExceptionTranslationFilter", "Spring Security 예외를 인증 시작 또는 접근 거부 HTTP 처리로 연결하는 filter입니다.", ["결정을 내리는 filter는 아닙니다.", "downstream exception을 번역합니다."]), c("AuthenticationTrustResolver", "현재 Authentication이 anonymous/remember-me인지 분류해 예외 translation에 사용하는 전략입니다.", ["401/403 분기에 영향을 줍니다.", "실제 auth type을 검증합니다."]), c("RequestCache", "인증 전 요청을 저장해 성공 후 재실행할 수 있게 하는 전략입니다.", ["browser login에는 유용합니다.", "stateless API에서는 의도적으로 선택합니다."])],
    codeExamples: [node("security06-status-router", "security exception translation router", "Security06StatusRouter.mjs", "인증 상태와 exception 종류로 entry-point/denied-handler를 결정합니다.", String.raw`function route({ exception, authenticated }) {
  if (exception === "AuthenticationException" || !authenticated) return { handler: "entry-point", status: 401, clearContext: true };
  if (exception === "AccessDeniedException") return { handler: "access-denied", status: 403, clearContext: false };
  return { handler: "propagate", status: 500, clearContext: false };
}
const cases = [{ exception: "AuthenticationException", authenticated: false }, { exception: "AccessDeniedException", authenticated: false }, { exception: "AccessDeniedException", authenticated: true }];
for (const x of cases) { const y = route(x); console.log(x.exception + "|auth=" + x.authenticated + "|" + y.handler + "|" + y.status + "|clear=" + y.clearContext); }`, "AuthenticationException|auth=false|entry-point|401|clear=true\nAccessDeniedException|auth=false|entry-point|401|clear=true\nAccessDeniedException|auth=true|access-denied|403|clear=false", ["spring-architecture", "spring-exception-filter", "rfc9110"])],
  }),
  appliedTopic({
    id: "authentication-entrypoint-contract", title: "AuthenticationEntryPoint를 credential scheme별 시작 계약으로 만듭니다",
    lead: "entry point는 단순 JSON writer가 아니라 client가 인증을 시작하거나 credential을 갱신할 수 있게 status, WWW-Authenticate, problem type과 cache policy를 제공하는 계약입니다.",
    mechanism: "browser form login은 redirect, HTTP Basic/Bearer는 challenge header, API는 machine-readable 401 problem을 사용할 수 있습니다. DelegatingAuthenticationEntryPoint는 request matcher별 scheme을 선택하지만 ambiguity와 downgrade를 통제해야 합니다.",
    workflow: "client class와 protected surface를 inventory하고 scheme, status/redirect, WWW-Authenticate parameters, stable problem code, login/refresh action과 retry limit를 문서화합니다.",
    invariants: "401은 유효한 인증 credential이 없거나 받아들여지지 않았음을 표현하고 challenge에 secret/internal detail을 넣지 않으며 open redirect 없이 안전한 return target만 사용합니다.",
    edgeCases: "missing vs malformed vs expired bearer, multiple challenges, browser Accept HTML, XHR/fetch, disabled account, step-up authentication와 refresh exhausted를 포함합니다.",
    failureModes: "모든 401을 login page로 redirect하면 API client가 HTML을 JSON으로 파싱하고, expired 이유를 과도하게 상세히 노출하면 credential oracle과 client retry loop가 생깁니다.",
    verification: "status, WWW-Authenticate grammar, content type/problem schema, redirect allowlist, cache headers, refresh-once UX와 no-secret body/log를 테스트합니다.",
    operations: "entry-point ID, scheme, stable reason class, client class와 retry outcome을 관찰하고 credential/error detail은 배제합니다.",
    concepts: [c("AuthenticationEntryPoint", "인증이 필요한 요청에 client가 사용할 인증 시작 응답을 만드는 Spring Security 전략입니다.", ["ExceptionTranslationFilter가 호출합니다.", "scheme별 challenge를 제공합니다."]), c("WWW-Authenticate", "401 response에서 적용할 authentication scheme과 필요한 challenge parameters를 전달하는 HTTP header입니다.", ["Bearer/Basic semantics가 다릅니다.", "secret을 포함하지 않습니다."]), c("credential challenge", "client에게 어떤 인증 방식으로 다시 요청할지 알리는 protocol 응답입니다.", ["redirect와 API 문제 응답을 구분합니다.", "retry policy와 연결합니다."])],
    codeExamples: [node("security06-entrypoint-selector", "client surface entry-point selector", "Security06EntryPointSelector.mjs", "API, browser page와 management surface가 사용할 인증 시작 계약을 결정합니다.", String.raw`const rules = [
  { match: r => r.surface === "api", entry: "bearer-problem", status: 401 },
  { match: r => r.surface === "page", entry: "login-redirect", status: 302 },
  { match: () => true, entry: "deny-no-scheme", status: 401 },
];
for (const surface of ["api", "page", "management"]) { const rule = rules.find(x => x.match({ surface })); console.log(surface + "|" + rule.entry + "|" + rule.status); }`, "api|bearer-problem|401\npage|login-redirect|302\nmanagement|deny-no-scheme|401", ["spring-entrypoint", "spring-auth-architecture", "rfc6750", "rfc9110"])],
  }),
  appliedTopic({
    id: "access-denied-handler-contract", title: "AccessDeniedHandler로 authenticated forbidden 결과를 일관되게 처리합니다",
    lead: "인증은 되었지만 필요한 authority·resource relation을 만족하지 못한 경우를 재로그인 요구와 구분하고 side-effect 없는 403 problem으로 반환합니다.",
    mechanism: "AccessDeniedHandler는 ExceptionTranslationFilter가 인증된 principal의 AccessDeniedException을 처리할 때 호출합니다. BearerTokenAccessDeniedHandler 같은 구현은 OAuth semantics에 맞는 header를 제공할 수 있고 request-matcher delegation으로 surfaces를 나눌 수 있습니다.",
    workflow: "policy deny reason을 internal audit code와 public stable code로 분리하고 403 status, optional challenge scope, problem body, correlation와 support action을 중앙 handler에 매핑합니다.",
    invariants: "403이 credential refresh loop를 유발하지 않고 resource 존재·owner·policy internals를 노출하지 않으며 deny 전에 mutation이 없고 response schema가 다른 API errors와 호환됩니다.",
    edgeCases: "anonymous AccessDeniedException, stale authority, resource hidden-as-404 policy, insufficient OAuth scope, CSRF denied, method-security exception와 handler failure를 포함합니다.",
    failureModes: "403을 401로 반환하면 client가 불필요하게 refresh/login을 반복하고, raw exception message를 body로 보내면 policy와 resource metadata가 유출됩니다.",
    verification: "authenticated insufficient authority/resource, same response class for hidden resources, no refresh, side-effect zero, header/body redaction와 handler selection을 테스트합니다.",
    operations: "public deny code, internal policy reason, handler/surface와 side-effect check 결과를 분리 저장하고 subject/resource raw IDs를 metric label에 쓰지 않습니다.",
    concepts: [c("AccessDeniedHandler", "인증된 주체의 접근 거부를 HTTP response로 처리하는 Spring Security 전략입니다.", ["보통 403을 반환합니다.", "entry point와 역할이 다릅니다."]), c("forbidden", "server가 주체를 인식했지만 해당 resource/action을 허용하지 않는 HTTP 결과입니다.", ["재인증만으로 해결되지 않을 수 있습니다.", "정보 노출 정책을 정합니다."]), c("hidden resource policy", "권한 없는 resource의 존재 여부를 숨기기 위해 403 대신 일관된 404-like 결과를 선택하는 업무 정책입니다.", ["모든 경로에 일관돼야 합니다.", "내부 audit reason은 보존합니다."])],
  }),
  appliedTopic({
    id: "problem-details-schema", title: "RFC 9457 Problem Details로 security error schema를 versioned합니다",
    lead: "message 문자열 파싱을 없애고 type, title, status, detail, instance와 제한된 extension을 사용해 client가 안정된 code와 recovery action을 선택하게 합니다.",
    mechanism: "Problem Details는 HTTP 오류 표현 형식이지 내부 exception dump가 아닙니다. type URI는 problem class semantics를 설명하고 extension에는 stable code/correlation만 넣으며 stack, token, SQL과 PII를 제외합니다.",
    workflow: "401/403/CSRF/rate-limit 등 public problem catalog를 만들고 content negotiation, localization, backward compatibility와 unknown-code fallback을 client/server contract tests로 고정합니다.",
    invariants: "body status가 actual HTTP status와 일치하고 type/code 의미가 배포마다 바뀌지 않으며 detail은 사람용이므로 client control flow가 번역 message에 의존하지 않습니다.",
    edgeCases: "empty body, proxy-generated error, HTML Accept, invalid JSON, old client unknown extension, localization, trace ID missing과 batch sub-errors를 포함합니다.",
    failureModes: "success:false/message만 쓰거나 exception class를 type으로 노출하면 의미가 불안정하고 구현 정보가 새며 client가 locale 문장을 파싱하게 됩니다.",
    verification: "JSON Schema/contract tests, status-media-body consistency, catalog uniqueness, localization, unknown extension, sensitive-field scan와 proxy pass-through를 검증합니다.",
    operations: "problem type/code/status/surface/build와 correlation만 집계하고 detail/instance가 개인정보나 unbounded resource ID를 담지 않게 sampling/redaction합니다.",
    concepts: [c("Problem Details", "HTTP API 오류를 type/title/status/detail/instance와 extensions로 표현하는 IETF 표준 형식입니다.", ["RFC 9457을 따릅니다.", "exception dump가 아닙니다."]), c("problem type", "오류 종류의 의미와 문서를 식별하는 URI reference입니다.", ["안정된 semantics를 유지합니다.", "instance와 다릅니다."]), c("stable error code", "client control flow와 telemetry에 사용하는 버전된 machine-readable code입니다.", ["번역 message와 분리합니다.", "catalog로 관리합니다."])],
    codeExamples: [node("security06-problem-mapper", "security exception to Problem Details mapper", "Security06ProblemMapper.mjs", "내부 failure class를 제한된 public problem code/schema로 변환합니다.", String.raw`const catalog = {
  missing: { status: 401, type: "https://errors.example/auth-required", code: "AUTH_REQUIRED" },
  invalid: { status: 401, type: "https://errors.example/credential-rejected", code: "CREDENTIAL_REJECTED" },
  denied: { status: 403, type: "https://errors.example/access-denied", code: "ACCESS_DENIED" },
};
for (const key of Object.keys(catalog)) { const p = catalog[key]; console.log(key + "|" + p.status + "|" + p.code + "|" + p.type); }
console.log("internal-exception-exposed=false");`, "missing|401|AUTH_REQUIRED|https://errors.example/auth-required\ninvalid|401|CREDENTIAL_REJECTED|https://errors.example/credential-rejected\ndenied|403|ACCESS_DENIED|https://errors.example/access-denied\ninternal-exception-exposed=false", ["rfc9457", "spring-problem-detail", "owasp-error-handling"])],
  }),
  appliedTopic({
    id: "custom-filter-failure-delegation", title: "custom filter 실패를 중앙 handler로 위임하고 one-response invariant를 지킵니다",
    lead: "OncePerRequestFilter에서 각 catch가 JSON을 직접 작성하는 대신 credential parsing과 failure classification을 분리하고 configured AuthenticationEntryPoint 또는 resolver에 일관되게 위임합니다.",
    mechanism: "custom filter가 ExceptionTranslationFilter보다 앞에 있으면 던진 AuthenticationException이 translator에 잡히지 않을 수 있으므로 filter placement를 바꾸거나 failure handler/entry point를 명시적으로 호출합니다. response를 썼다면 즉시 return하고 context를 정리합니다.",
    workflow: "parse→validate/authenticate→set context only on success→delegate classified failure→return→finally cleanup의 template을 만들고 body/status/header writer는 중앙 component 하나가 소유하게 합니다.",
    invariants: "invalid credential로 SecurityContext를 부분 설정하지 않고 downstream chain은 성공에서 정확히 한 번만 호출되며 failure response도 정확히 한 번만 commit됩니다.",
    edgeCases: "validator timeout, malformed oversized header, expired token, key rotation, writer IOException, downstream already committed, async dispatch와 filter double-registration을 포함합니다.",
    failureModes: "catch에서 response를 쓰고 filterChain.doFilter를 계속 호출하면 double commit·controller execution이 생기고, 모든 Exception을 invalid token으로 숨기면 server outage를 client credential 문제로 오진합니다.",
    verification: "chain invocation/commit/context counts, classified exceptions, timeout/IO/downstream fault, error dispatch, one schema와 no credential logs를 unit/integration test합니다.",
    operations: "parser/authenticator/handler failure stage, stable credential reason, response committed와 chain count를 관찰하고 raw header/token은 절대 남기지 않습니다.",
    concepts: [c("failure delegation", "filter가 response 형식을 직접 만들지 않고 configured entry point/handler에 실패 처리를 맡기는 패턴입니다.", ["schema를 중앙화합니다.", "filter order를 고려합니다."]), c("one-response invariant", "하나의 request에는 정확히 한 component만 최종 HTTP response를 commit해야 한다는 규칙입니다.", ["double write를 방지합니다.", "chain count와 함께 검증합니다."]), c("failure classification", "expired, malformed, invalid, unavailable 같은 내부 원인을 public code와 retry policy로 제한해 분류하는 과정입니다.", ["모든 Exception을 credential 탓으로 돌리지 않습니다.", "세부값은 공개하지 않습니다."])],
    codeExamples: [node("security06-filter-state", "custom filter one-response state machine", "Security06FilterState.mjs", "success/failure에서 context, chain과 response commit 횟수를 검증합니다.", String.raw`function run(result) {
  const state = { context: false, chainCalls: 0, commits: 0 };
  if (result === "valid") { state.context = true; state.chainCalls++; }
  else { state.context = false; state.commits++; }
  return state;
}
for (const result of ["valid", "missing", "expired", "invalid"]) { const s = run(result); console.log(result + "|context=" + s.context + "|chain=" + s.chainCalls + "|commits=" + s.commits); }`, "valid|context=true|chain=1|commits=0\nmissing|context=false|chain=0|commits=1\nexpired|context=false|chain=0|commits=1\ninvalid|context=false|chain=0|commits=1", ["local-jwt-filter", "spring-exception-filter", "spring-entrypoint", "owasp-error-handling"])],
  }),
  appliedTopic({
    id: "surface-content-negotiation", title: "API·browser page·management surface의 오류 계약을 명시적으로 분리합니다",
    lead: "같은 security exception이라도 human browser는 안전한 login redirect, API는 Problem Details, management endpoint는 별도 scheme을 요구할 수 있어 request matcher 기반 delegation을 사용합니다.",
    mechanism: "Accept header 하나만 신뢰하면 */*와 browser navigation이 모호하므로 route/surface, authentication scheme와 explicit client contract를 우선하고 content negotiation을 보조로 사용합니다.",
    workflow: "surface registry에 matcher, scheme, 401 behavior, 403 behavior, media type, CORS/cache, return-target와 client recovery를 기록하고 overlap/first-match를 검증합니다.",
    invariants: "API가 login HTML을 200으로 받지 않고 browser redirect는 allowlisted local target만 사용하며 management failure가 public login surface로 downgrade되지 않습니다.",
    edgeCases: "Accept */*, fetch navigation, HTMX, file download, SSE, WebSocket handshake, proxy error page, OAuth callback와 locale를 포함합니다.",
    failureModes: "Accept includes text/html이면 redirect 같은 heuristic은 API tooling과 XHR을 잘못 분류하고 open redirect 또는 authentication downgrade를 만들 수 있습니다.",
    verification: "surface×Accept×credential matrix, handler first-match, media/status/schema, redirect target, CORS/cache와 actual client recovery를 테스트합니다.",
    operations: "surface/handler mismatch, HTML-to-API parse failure, redirect rejection와 fallback entry-point 사용을 관찰합니다.",
    concepts: [c("security surface", "같은 application 안에서 client·scheme·risk가 달라 별도 보안 오류 계약을 갖는 request 영역입니다.", ["API/page/management를 분리합니다.", "matcher로 명시합니다."]), c("content negotiation", "Accept와 server capability를 바탕으로 response representation을 선택하는 HTTP 메커니즘입니다.", ["security surface의 유일한 식별자로 쓰지 않습니다.", "406/415도 고려합니다."]), c("authentication downgrade", "강한 scheme이 필요한 surface가 더 약하거나 다른 login flow로 잘못 전환되는 문제입니다.", ["fallback을 fail closed로 둡니다.", "management를 격리합니다."])],
  }),
  appliedTopic({
    id: "security-error-privacy-logging", title: "오류 응답·log·trace에서 credential과 개인정보를 제거합니다",
    lead: "debug에 유용해 보이는 Authorization header, token, username, raw exception과 request body는 재사용 가능한 credential·PII일 수 있으므로 수집 전 단계에서 구조적으로 제외합니다.",
    mechanism: "application logger뿐 아니라 reverse proxy, APM, tracing baggage, exception reporter, test screenshots와 CI artifacts가 sensitive sinks입니다. allowlisted fields와 stable reason code를 사용하고 이미 노출됐다면 key rotation, session revoke, access 제한, purge와 incident review를 수행합니다.",
    workflow: "data-flow inventory→sensitive classification→structured logging schema allowlist→processor redaction→sink retention/access→canary secret scan→incident response를 모든 layers에 적용합니다.",
    invariants: "credential/token/password는 평문·hash·prefix 형태로도 필요 없으면 기록하지 않고 correlation ID는 인증 비밀과 독립적인 random identifier이며 public detail과 internal reason을 분리합니다.",
    edgeCases: "multiline/encoded headers, exception cause, debug profile, sampling tail, log export backup, support bundle, browser console와 test failure snapshot을 포함합니다.",
    failureModes: "logger message만 고쳐도 proxy/APM이 request headers를 자동 수집하면 노출이 계속되고, 일부 token 문자를 남기는 masking은 correlation과 brute-force oracle을 제공할 수 있습니다.",
    verification: "synthetic canary credentials로 source/runtime/log/trace/error/artifact scans, access/retention, purge drill와 rotation/revoke readback을 실행합니다.",
    operations: "redaction failures, sensitive canary detections, sink access, retention overdue와 rotation/revoke completion을 보안 incident SLO에 연결합니다.",
    concepts: [c("structured logging allowlist", "기록해도 되는 field만 schema로 명시하고 나머지는 기본 폐기하는 logging 방식입니다.", ["denylist보다 안전합니다.", "cardinality도 통제합니다."]), c("secret canary", "실제 credential이 아닌 식별 가능한 synthetic 값을 흘려 노출 sink를 탐지하는 test token입니다.", ["production 권한이 없어야 합니다.", "artifact scan과 연결합니다."]), c("credential incident response", "credential 노출을 발견했을 때 rotation/revoke, sink 제한·purge, 영향 분석과 재발 방지를 수행하는 절차입니다.", ["코드 수정만으로 끝나지 않습니다.", "readback을 검증합니다."])],
    codeExamples: [node("security06-redaction", "structured security-error log allowlist", "Security06Redaction.mjs", "raw event에서 허용된 bounded fields만 남겨 credential 노출을 차단합니다.", String.raw`const event = { code: "CREDENTIAL_REJECTED", status: 401, surface: "api", correlationId: "corr-7", authorization: "Bearer synthetic-secret", token: "synthetic-secret", stack: "internal" };
const allowed = ["code", "status", "surface", "correlationId"];
const safe = Object.fromEntries(allowed.map(key => [key, event[key]]));
for (const key of Object.keys(safe)) console.log(key + "=" + safe[key]);
console.log("sensitive-fields=" + Object.keys(event).filter(key => !allowed.includes(key)).length);`, "code=CREDENTIAL_REJECTED\nstatus=401\nsurface=api\ncorrelationId=corr-7\nsensitive-fields=3", ["owasp-logging", "owasp-error-handling", "local-jwt-filter"] )],
  }),
  appliedTopic({
    id: "security-error-test-matrix", title: "filter·handler·HTTP·client recovery를 하나의 failure matrix로 검증합니다",
    lead: "status 하나가 아니라 context, chain count, handler, headers, problem schema, side effect, logs와 client action을 failure source별로 묶어 검증합니다.",
    mechanism: "pure tests는 mapper/catalog, filter unit은 delegation/commit, MockMvc는 chain/entry point/handler, raw HTTP는 headers/media, browser/client tests는 refresh/login/forbidden UX와 retry limits를 증명합니다.",
    workflow: "missing/malformed/expired/invalid/revoked/unavailable credential와 anonymous/insufficient/object-denied/CSRF-denied를 surfaces·Accept·dispatch별로 생성합니다.",
    invariants: "각 case는 expected public status/code/headers, internal reason, context/chain/commit counts, DB side effects, log fields와 client recovery를 모두 선언합니다.",
    edgeCases: "concurrent refresh, handler IOException, response already committed, proxy rewrite, downstream 500, localization, unknown problem type와 rolling versions를 포함합니다.",
    failureModes: "MockMvc status만 assert하면 token log, double chain, missing challenge, invalid media type와 client infinite refresh를 놓칩니다.",
    verification: "matrix coverage, contract snapshot/schema, secret scan, no-side-effect, accessibility, retry cap, actual deployment proxy와 rollback parity를 실행합니다.",
    operations: "missing cases, handler/schema drift, retry loop, response commit anomalies와 log findings를 release gate에 연결합니다.",
    concepts: [c("failure matrix", "failure source·auth state·surface별 expected HTTP, side effect, log와 recovery를 적은 executable 표입니다.", ["positive/negative를 함께 둡니다.", "새 scheme 때 확장합니다."]), c("client recovery contract", "문제 code/status에 따라 refresh once, login, forbidden guidance 또는 retry-later를 선택하는 규칙입니다.", ["message를 파싱하지 않습니다.", "무한 retry를 막습니다."]), c("contract parity", "local/test/proxy/canary 환경이 같은 status/header/problem semantics를 반환하는 성질입니다.", ["artifact revision을 기록합니다.", "old/new를 differential합니다."])],
  }),
  appliedTopic({
    id: "security-error-operations-recovery", title: "오류 contract 변경과 credential incident를 canary·rollback으로 운영합니다",
    lead: "401/403 schema 변경은 frontend refresh/login flow와 monitoring에 직접 영향을 주므로 backward compatibility, old/new response differential과 incident runbook이 필요합니다.",
    mechanism: "new problem types/codes는 additive compatibility를 우선하고 old clients가 unknown type을 status 기반 fallback으로 처리하게 합니다. rollout은 shadow classification, internal/canary cohort, retry-loop/deny/error guardrails와 immutable rollback artifact를 사용합니다.",
    workflow: "catalog version→contract tests→shadow mapping→client compatibility→canary→promotion→old code retirement 순으로 배포하고 credential leak 발견 시 즉시 logging 차단, revoke/rotate, sink containment와 purge를 병행합니다.",
    invariants: "rollback이 raw exception/token logging을 되살리지 않고, telemetry outage는 permissive response로 바뀌지 않으며 incident 중 public message에 조사 정보를 노출하지 않습니다.",
    edgeCases: "old SPA cache, rolling nodes, CDN/proxy error cache, refresh endpoint outage, key rotation overlap, log export backup와 external support access를 포함합니다.",
    failureModes: "client와 동시에 breaking code를 배포하거나 status를 200으로 감싸면 caches/monitoring/retry가 오작동하고, leak 코드를 되돌리는 동안 이미 노출된 credential을 회수하지 않으면 사고가 지속됩니다.",
    verification: "old/new clients, problem catalog differential, retry/login/forbidden UX, secret scans, revoke/rotate/purge readback, canary thresholds와 rollback drill을 실행합니다.",
    operations: "401/403/problem distribution, refresh success/loop, handler failures, credential exposure SLO와 contract revision skew에 owner/runbook을 연결합니다.",
    concepts: [c("problem catalog version", "공개 problem type/code/status/recovery semantics의 호환 가능한 revision입니다.", ["client 계약과 함께 배포합니다.", "unknown fallback을 둡니다."]), c("retry loop guard", "같은 credential failure에서 refresh/login 요청이 무한 반복되지 않게 횟수·epoch·circuit을 제한하는 장치입니다.", ["401/403을 구분합니다.", "tab concurrency를 고려합니다."]), c("incident readback", "rotation/revoke/purge/rollback이 실제 각 sink와 server에서 적용됐는지 다시 조회해 확인하는 절차입니다.", ["명령 성공만 믿지 않습니다.", "증거를 보존합니다."])],
    codeExamples: [node("security06-release-gate", "security-error contract release gate", "Security06ReleaseGate.mjs", "status/schema/secret/client/rollback evidence로 변경 배포를 판정합니다.", String.raw`const evidence = { matrixCoverage: 100, wrongStatus: 0, doubleCommit: 0, mutationAfterDeny: 0, secretFindings: 0, clientRetryLoops: 0, proxyParity: true, rollbackVerified: true };
const pass = evidence.matrixCoverage === 100 && evidence.wrongStatus === 0 && evidence.doubleCommit === 0 && evidence.mutationAfterDeny === 0 && evidence.secretFindings === 0 && evidence.clientRetryLoops === 0 && evidence.proxyParity && evidence.rollbackVerified;
for (const [key, value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "matrixCoverage=100\nwrongStatus=0\ndoubleCommit=0\nmutationAfterDeny=0\nsecretFindings=0\nclientRetryLoops=0\nproxyParity=true\nrollbackVerified=true\nrelease=pass", ["rfc9457", "rfc6750", "spring-entrypoint", "spring-denied-handler", "owasp-logging"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-security-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["inline AuthenticationEntryPoint source path", "401 JSON response ownership", "filter/exception context"], evidence: "2026-07-14 read-only sanitized audit: 106 lines, 6,013 bytes, SHA-256 B1051723C4FEE8FCBEC587B0A1CFCFA7A9EB0C461EBE59602DA980EF1D62CCD8. 실제 routes/messages/origins는 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["direct invalid/expired response branches", "filter-chain return/context behavior", "credential logging risk"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. 실제 Authorization header/token/subject는 복사하지 않았습니다. header와 token을 log하는 source behavior는 credential disclosure finding으로 기록했습니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["Spring Boot 4.0.6/Java 21 source-version boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5." },
  { id: "spring-architecture", repository: "Spring Security reference", path: "servlet/architecture.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/architecture.html", usedFor: ["ExceptionTranslationFilter flow", "filter chain and security exception handling"], evidence: "Spring Security 공식 Servlet architecture reference입니다." },
  { id: "spring-auth-architecture", repository: "Spring Security reference", path: "servlet/authentication/architecture.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", usedFor: ["AuthenticationEntryPoint and authentication flow"], evidence: "Spring Security 공식 authentication architecture reference입니다." },
  { id: "spring-entrypoint", repository: "Spring Security API", path: "AuthenticationEntryPoint.html", publicUrl: "https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/web/AuthenticationEntryPoint.html", usedFor: ["AuthenticationEntryPoint contract"], evidence: "Spring Security 공식 AuthenticationEntryPoint API입니다." },
  { id: "spring-denied-handler", repository: "Spring Security API", path: "AccessDeniedHandler.html", publicUrl: "https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/web/access/AccessDeniedHandler.html", usedFor: ["AccessDeniedHandler contract"], evidence: "Spring Security 공식 AccessDeniedHandler API입니다." },
  { id: "spring-exception-filter", repository: "Spring Security API", path: "ExceptionTranslationFilter.html", publicUrl: "https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/web/access/ExceptionTranslationFilter.html", usedFor: ["exception translation implementation contract", "request cache/trust resolver"], evidence: "Spring Security 공식 ExceptionTranslationFilter API입니다." },
  { id: "spring-problem-detail", repository: "Spring Framework reference", path: "web/webmvc/mvc-ann-rest-exceptions.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["Spring MVC ProblemDetail/ErrorResponse integration"], evidence: "Spring Framework 공식 REST error response reference입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["401/403 and content-negotiation semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["Problem Details schema and type semantics"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "rfc6750", repository: "IETF RFC 6750", path: "rfc6750.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6750.html", usedFor: ["Bearer challenge and error semantics"], evidence: "OAuth 2.0 Bearer Token Usage 표준입니다." },
  { id: "owasp-error-handling", repository: "OWASP Cheat Sheet Series", path: "Error_Handling_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["safe error responses", "central handling and information exposure"], evidence: "OWASP 공식 error handling guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["credential-safe security logging", "incident monitoring"], evidence: "OWASP 공식 logging guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "security-06-authentication-exception-entrypoint", slug: "security-06-authentication-exception-entrypoint", courseId: "devops", moduleId: "security-filter-authentication", order: 6,
  title: "security 예외·EntryPoint·AccessDeniedHandler", subtitle: "filter failure에서 401/403 translation, RFC 9457 문제 응답, client recovery와 credential incident 대응까지 하나의 계약으로 만듭니다.",
  level: "고급", estimatedMinutes: 170,
  coreQuestion: "missing·invalid credential과 권한 거부를 올바른 401/403, challenge와 안전한 문제 응답으로 번역하면서 double response, token 노출과 client retry loop를 어떻게 막을까요?",
  summary: "Spring Boot 4.0.6 학습 프로젝트의 inline AuthenticationEntryPoint와 custom JWT filter failure branches를 read-only·sanitized 감사하고, filter가 Authorization header/token을 log하는 실제 credential disclosure 위험을 발견해 값은 복사하지 않은 채 rotation·revoke·log containment가 필요한 finding으로 명시합니다. ExceptionTranslationFilter, scheme별 entry point, AccessDeniedHandler, RFC 9457 catalog, custom-filter delegation, surface negotiation, structured logging, failure matrix와 canary/incident recovery를 Spring·IETF·OWASP 근거 및 일곱 executable models로 완성합니다.",
  objectives: ["로컬 401 경로와 credential logging 위험을 감사한다.", "ExceptionTranslationFilter의 anonymous/handler 분기를 추적한다.", "scheme/surface별 AuthenticationEntryPoint를 설계한다.", "authenticated deny를 AccessDeniedHandler로 일관되게 처리한다.", "RFC 9457 problem catalog를 version한다.", "custom filter failure를 중앙 handler에 위임한다.", "API/page/management content negotiation을 분리한다.", "log/trace/artifact에서 credentials를 제거한다.", "failure matrix와 client recovery를 검증한다.", "contract rollout과 credential incident를 복구한다."],
  prerequisites: [{ title: "CSRF·CORS·security headers", reason: "CSRF deny와 CORS/browser response contract도 security failure surface에 포함되며 headers/cache/media semantics를 유지해야 합니다.", sessionSlug: "security-05-csrf-cors-security-headers" }],
  keywords: ["ExceptionTranslationFilter", "AuthenticationEntryPoint", "AccessDeniedHandler", "401", "403", "WWW-Authenticate", "Problem Details", "RFC 9457", "filter delegation", "credential logging", "retry loop", "incident response"],
  topics,
  lab: { title: "security failure를 단일 problem contract와 복구 가능한 handler flow로 qualification하기", scenario: "원본 files는 변경하지 않고 synthetic credentials와 disposable Spring Security app/client에서 missing→invalid→expired→insufficient→object deny→handler fault를 filter부터 client recovery까지 재현합니다.", setup: ["Java 21/Spring Security compatible test fixture", "JUnit·MockMvc·raw HTTP client", "API/page/management surfaces", "synthetic nonfunctional credentials", "disposable mutation store", "structured log/trace sinks", "secret canary scanner", "원본 3 files read-only"], steps: ["원본 failure paths와 filter/handler ownership을 hash 기반 redacted graph로 만듭니다.", "ExceptionTranslationFilter, trust resolver, request cache와 context-clear sequence를 검증합니다.", "surface/scheme별 entry point와 401 challenge/problem contract를 구현합니다.", "authenticated insufficient/object deny를 403 handler와 side-effect zero로 검증합니다.", "RFC 9457 type/code catalog, JSON schema와 unknown-code client fallback을 작성합니다.", "custom filter를 classification→central failure delegation→return 구조로 바꾼 test fixture를 만듭니다.", "missing/malformed/expired/invalid/unavailable/denied/CSRF matrix를 status/header/body/context/chain/DB/log/client action까지 실행합니다.", "synthetic secret canary로 proxy/APM/log/trace/error/artifact sinks를 scan합니다.", "old/new clients와 proxy에서 canary rollout, retry-loop guard와 rollback을 rehearsal합니다.", "발견한 credential logging incident의 revoke/rotate/contain/purge/readback runbook과 원본 unchanged를 확인합니다."], expectedResult: ["unauthenticated failure는 올바른 401/challenge, authenticated deny는 403 또는 명시된 hidden-resource contract를 반환합니다.", "각 request는 chain/response가 정확히 한 번이고 deny 뒤 mutation이 없습니다.", "모든 surface가 versioned problem catalog와 안전한 client recovery를 사용합니다.", "Authorization/token/subject/stack과 개인정보가 response/log/trace/artifact에 남지 않습니다.", "breaking error-contract나 credential leak을 canary guardrail과 verified rollback/rotation으로 복구할 수 있습니다."], cleanup: ["synthetic credentials/users/resources와 mutation store를 폐기합니다.", "test contexts, clients, log/trace sinks, timers/caches와 proxy emulator를 종료합니다.", "canary artifacts를 scan한 뒤 retention policy에 따라 삭제합니다.", "원본 3 files hash/status unchanged를 확인합니다."], extensions: ["OAuth resource-server BearerTokenAuthenticationEntryPoint/AccessDeniedHandler와 scope challenge를 통합합니다.", "SSE/WebSocket handshake failure contract를 추가합니다.", "multi-region problem catalog/revision skew와 chaos test를 자동화합니다.", "SIEM credential-canary detection과 automated revoke workflow를 연동합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 Spring filter/handler/raw HTTP/client evidence에 대응시키세요.", requirements: ["stdout 완전 일치", "source graph", "status router", "entry-point selector", "problem mapper", "one-response state", "redaction", "release gate"], hints: ["Node state machine은 actual servlet response commit/filter order/request cache를 대체하지 않습니다."], expectedOutcome: "401/403 translation과 public/internal error separation, credential-safe evidence를 설명합니다.", solutionOutline: ["audit→translate→entry/deny→problem/delegate→privacy/test→operate 순서입니다."] },
    { difficulty: "응용", prompt: "직접 JSON을 쓰는 JWT filter를 중앙 problem/handler contract로 재설계하세요.", requirements: ["filter placement", "failure classification", "entry point delegation", "context cleanup", "one response", "401/403", "secret-safe logging", "client recovery", "fault tests"], hints: ["모든 Exception을 invalid token으로 바꾸거나 handler 호출 후 chain을 계속하지 마세요."], expectedOutcome: "실패 source와 HTTP representation이 분리되고 retry/incident 복구가 가능한 filter가 완성됩니다.", solutionOutline: ["map failure→delegate once→verify counts/schema/logs→roll out 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 security error governance와 credential incident playbook을 작성하세요.", requirements: ["surface/scheme catalog", "401/403 policy", "RFC 9457", "challenge", "redaction", "client fallback", "telemetry", "rotation/revoke/purge", "rollback"], hints: ["public problem detail과 내부 investigation data를 같은 payload에 넣지 마세요."], expectedOutcome: "서비스와 client가 일관된 오류 계약을 쓰고 credential 노출에 즉시 대응합니다.", solutionOutline: ["catalog→enforce→evidence→compatibility→incident readback 순서입니다."] },
  ],
  nextSessions: ["security-07-security-testing-audit"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["로컬 source의 실제 Authorization header/token/subject/routes/messages/origins는 공개 content와 output에 복사하지 않았습니다.", "JwtRequestFilter가 Authorization header와 token을 log하는 source behavior는 공개 저장소에 값 없이 credential disclosure finding으로 기록했으며 실제 운영 credential이 있었다면 즉시 revoke/rotate, log access containment와 purge/readback이 필요합니다.", "source에는 explicit AccessDeniedHandler가 보이지 않았으므로 default behavior 이상을 구현됐다고 과장하지 않습니다.", "Node models는 actual FilterChainProxy order, servlet response commit, request cache, proxy-generated errors와 client network behavior를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
