import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "browser-security-source-audit", title: "CSRF disable·CORS allowlist 원본을 threat assumption과 분리해 감사합니다",
    lead: "로컬 설정의 stateless, CSRF disable, credentialed CORS와 wildcard headers를 그대로 나열하지 않고 browser가 어떤 credential을 자동 첨부하는지와 state-changing endpoint를 함께 분석합니다.",
    mechanism: "학습 snapshot은 custom Authorization bearer filter를 사용하지만 CORS credentials도 허용합니다. 'JWT면 CSRF 위험이 없다'는 주석은 credential storage/transport, cookie refresh와 browser clients를 확인하지 않은 일반화이므로 production guarantee로 사용할 수 없습니다.",
    workflow: "원본 hash→credential 종류와 저장 위치→browser automatic attachment→allowed origins/methods/headers→state-changing routes→CSRF mechanism→response headers 순으로 값 없는 threat table을 만듭니다.",
    invariants: "실제 origin, token, secret, route와 사용자 값을 공개 자료에 복사하지 않고 CSRF와 CORS를 같은 기능으로 설명하지 않으며 disable 결정에는 문서화된 전제와 재검토 owner를 둡니다.",
    edgeCases: "access token header와 refresh cookie 혼합, form login, Basic/mTLS, WebSocket handshake, OAuth callback, logout, multipart와 legacy clients를 포함합니다.",
    failureModes: "stateless 또는 JSON이라는 이유만으로 CSRF를 끄거나 CORS를 서버 authorization으로 오해하면 browser가 자동 보낸 credential로 state change가 가능하거나 직접 HTTP clients가 정책을 우회합니다.",
    verification: "source/version hash, cookie attributes, storage sinks, request capture, cross-site form/fetch, preflight, state change와 response header를 실제 browser-compatible fixture에서 확인합니다.",
    operations: "credential mode, origin class, CSRF decision, preflight deny reason와 header policy revision을 bounded labels로 남기고 raw origin/token/cookie는 기록하지 않습니다.",
    concepts: [c("CSRF", "브라우저가 피해자의 credential을 자동 포함하는 성질을 이용해 공격 사이트가 의도하지 않은 state-changing request를 보내는 공격입니다.", ["CORS와 별개입니다.", "credential transport가 핵심입니다."]), c("CORS", "브라우저가 다른 origin의 script에 response를 노출할 수 있는지 서버 opt-in으로 결정하는 protocol입니다.", ["서버 authorization이 아닙니다.", "preflight가 있을 수 있습니다."]), c("threat assumption", "보안 설정의 타당성이 의존하는 credential, client와 endpoint 조건입니다.", ["검증 가능하게 기록합니다.", "변경 시 재평가합니다."])],
    codeExamples: [node("security05-source-assumptions", "browser-security assumption inventory", "Security05SourceAssumptions.mjs", "원본 관찰과 추가 검증이 필요한 threat assumptions를 분리합니다.", String.raw`const observations = [
  ["session-policy", "stateless", "observed"],
  ["csrf", "disabled", "observed"],
  ["cors-credentials", "allowed", "observed"],
  ["browser-credential-storage", "unknown", "verify"],
  ["refresh-cookie", "unknown", "verify"],
];
for (const row of observations) console.log(row.join("|"));`, "session-policy|stateless|observed\ncsrf|disabled|observed\ncors-credentials|allowed|observed\nbrowser-credential-storage|unknown|verify\nrefresh-cookie|unknown|verify", ["local-security-config", "local-build", "spring-csrf", "spring-cors"])],
  }),
  appliedTopic({
    id: "origin-site-credential-model", title: "origin·site·cookie scope와 automatic credential attachment를 구분합니다",
    lead: "scheme/host/port origin과 registrable-domain 기반 site가 서로 다른 판단에 쓰이고 cookie Domain/Path/Secure/SameSite와 Fetch credentials mode가 request 첨부를 결정합니다.",
    mechanism: "same-origin policy는 script의 cross-origin read를 제한하고 Fetch/CORS가 opt-in을 제공합니다. cookie는 origin이 아니라 domain/path/site 규칙을 따르므로 sibling subdomain, scheme 변화와 redirect에서 예상 밖으로 첨부될 수 있습니다.",
    workflow: "모든 credential을 header/cookie/client certificate로 분류하고 자동 첨부 여부, scope, expiry, rotation, XSS/CSRF 노출과 server validation을 표로 작성합니다.",
    invariants: "민감 cookie는 HTTPS/Secure/HttpOnly와 의도한 SameSite/Domain/Path를 사용하고 public suffix·untrusted sibling을 신뢰 경계로 포함하며 credential scope가 업무 scope보다 넓지 않습니다.",
    edgeCases: "localhost ports, http→https, subdomain takeover, redirect chain, iframe, top-level navigation, service worker, partitioned storage와 older browsers를 포함합니다.",
    failureModes: "same-origin과 same-site를 같은 것으로 취급하면 sibling origin 공격과 SameSite 예외를 놓치고, HttpOnly를 CSRF 방어로 오해하면 자동 첨부는 그대로 남습니다.",
    verification: "browser matrix에서 request Cookie/Origin/Sec-Fetch-Site, redirects, SameSite modes와 server-side state change를 capture하되 실제 credential은 synthetic canary만 사용합니다.",
    operations: "cookie policy version, cross-site request class, rejected credential scope와 user-agent capability class를 저카디널리티로 관찰합니다.",
    concepts: [c("origin", "scheme, host와 port가 모두 같은 보안 주체 단위입니다.", ["CORS와 DOM 접근에 사용됩니다.", "site와 다릅니다."]), c("site", "SameSite cookie 판단 등에 쓰이는 registrable domain과 scheme 중심의 범위입니다.", ["서로 다른 origin이 same-site일 수 있습니다.", "sibling trust를 검토합니다."]), c("automatic credential", "브라우저가 script가 credential 값을 읽지 않아도 조건에 따라 request에 첨부하는 cookie·HTTP auth 등입니다.", ["CSRF 전제입니다.", "scope를 최소화합니다."])],
    codeExamples: [node("security05-credential-risk", "CSRF precondition classifier", "Security05CredentialRisk.mjs", "credential 자동 첨부와 state change 여부로 CSRF 방어 요구를 분류합니다.", String.raw`const flows = [
  { name: "bearer-memory", automatic: false, changes: true },
  { name: "session-cookie", automatic: true, changes: true },
  { name: "public-read", automatic: true, changes: false },
  { name: "refresh-cookie", automatic: true, changes: true },
];
for (const flow of flows) console.log(flow.name + "|csrf-defense=" + (flow.automatic && flow.changes));`, "bearer-memory|csrf-defense=false\nsession-cookie|csrf-defense=true\npublic-read|csrf-defense=false\nrefresh-cookie|csrf-defense=true", ["fetch-standard", "cookie-bis", "owasp-csrf", "spring-csrf-features"])],
  }),
  appliedTopic({
    id: "csrf-threat-decision", title: "state-changing browser endpoint마다 CSRF 적용 여부를 결정합니다",
    lead: "application 전체에 'JWT라서 off' 같은 단일 문장을 적용하지 않고 각 endpoint가 browser에 노출되는지와 credential이 자동 첨부되는지를 기준으로 protection을 선택합니다.",
    mechanism: "unsafe method의 session/cookie/basic credential은 synchronizer token 또는 double-submit 계열, origin/site signals와 re-authentication을 조합합니다. custom bearer header가 오직 script memory에서 명시적으로 설정되는 API도 refresh/logout cookie 경계를 별도로 분석합니다.",
    workflow: "endpoint→state change→accepted content types→credential sources→browser reachability→token/origin/SameSite defenses→residual XSS risk를 threat register에 기록합니다.",
    invariants: "GET/HEAD/OPTIONS는 state를 변경하지 않고, CSRF token 검증 실패는 mutation 전에 종료되며 token이 URL/log/cache에 노출되지 않습니다.",
    edgeCases: "JSON form enctype, method override, GraphQL mutation, multipart upload, login/logout CSRF, OAuth callback, WebSocket와 idempotent retry를 포함합니다.",
    failureModes: "Content-Type이 JSON이면 form 공격이 불가능하다고 단정하거나 GET에 mutation을 두면 token/CORS 설정과 무관하게 취약한 흐름이 생깁니다.",
    verification: "cross-site form/simple request/preflighted fetch, missing/wrong/stale token, same-site sibling, XSS assumption과 mutation side-effect zero를 실행합니다.",
    operations: "CSRF reject reason, endpoint class, method와 token age bucket을 집계하고 token value와 raw body는 남기지 않습니다.",
    concepts: [c("unsafe method", "HTTP semantics상 state change를 일으킬 수 있어 CSRF 등 추가 보호가 필요한 method입니다.", ["GET/HEAD는 safe contract를 지켜야 합니다.", "멱등성과 별개입니다."]), c("synchronizer token", "server-side session에 기대 token을 저장하고 request token과 일치하는지 검증하는 CSRF 방어 방식입니다.", ["예측 불가능해야 합니다.", "URL에 넣지 않습니다."]), c("double-submit", "cookie와 별도 request 위치의 token 관계를 검증하는 stateless CSRF 패턴입니다.", ["서명·binding 설계를 검토합니다.", "cookie injection을 고려합니다."])],
  }),
  appliedTopic({
    id: "csrf-token-spa-lifecycle", title: "SPA의 deferred token·rotation·logout lifecycle을 명시합니다",
    lead: "페이지 최초 로드, 로그인 성공, session renewal와 logout에서 token이 언제 발급·노출·회전·폐기되는지 client/server 계약으로 만듭니다.",
    mechanism: "Spring Security의 CsrfTokenRepository와 request handler는 token 저장/노출 방식을 나누고 BREACH 완화와 SPA integration은 token 재조회 시점을 요구할 수 있습니다. client는 cookie/header 이름을 hard-code하기보다 bootstrap contract를 사용합니다.",
    workflow: "anonymous bootstrap→token fetch→unsafe request header→authentication success rotation→retry once→logout rotation/clear→multi-tab convergence를 state machine으로 구현합니다.",
    invariants: "token은 session/user boundary를 넘지 않고 인증 전후 fixation을 피하며 refresh failure에서 mutation을 자동 무한 retry하지 않습니다.",
    edgeCases: "두 탭, back-forward cache, expired session, race 두 mutation, service worker cache, offline queue, logout 다른 탭과 server restart를 포함합니다.",
    failureModes: "앱 시작 때 token 한 번만 읽어 영구 저장하면 authentication/logout 뒤 stale token과 fixation이 생기고 interceptor가 모든 실패를 refresh하면 retry storm이 발생합니다.",
    verification: "token repository/handler integration, auth transition rotation, concurrent requests, multi-tab/logout와 no-token-in-URL/log/analytics를 browser test합니다.",
    operations: "token bootstrap/rotation/reject counts, retry cap와 session-age bucket을 관찰하고 token fingerprint도 telemetry에 남기지 않습니다.",
    concepts: [c("CsrfTokenRepository", "기대 CSRF token을 생성·저장·조회하는 Spring Security 전략입니다.", ["session 또는 cookie 구현을 선택합니다.", "client contract와 맞춥니다."]), c("token rotation", "authentication/session 경계에서 기존 CSRF token을 폐기하고 새 token으로 바꾸는 과정입니다.", ["fixation을 줄입니다.", "client 재조회가 필요합니다."]), c("BREACH mitigation", "response compression과 reflection을 이용한 secret 추측 위험을 줄이는 token masking 등 완화입니다.", ["handler 동작과 함께 이해합니다.", "적용 범위를 검증합니다."])],
    codeExamples: [node("security05-token-machine", "SPA CSRF token lifecycle machine", "Security05TokenMachine.mjs", "bootstrap·login·mutation·logout에서 token epoch transition을 검증합니다.", String.raw`let state = { auth: false, epoch: 1, token: null };
function bootstrap() { state.token = "csrf-" + state.epoch; }
function login() { state.auth = true; state.epoch++; state.token = null; }
function logout() { state.auth = false; state.epoch++; state.token = null; }
bootstrap(); console.log("bootstrap|" + state.token);
login(); bootstrap(); console.log("login|" + state.token);
console.log("mutation|header=" + state.token);
logout(); console.log("logout|token=" + state.token);`, "bootstrap|csrf-1\nlogin|csrf-2\nmutation|header=csrf-2\nlogout|token=null", ["spring-csrf", "spring-csrf-spa", "owasp-csrf"])],
  }),
  appliedTopic({
    id: "defense-in-depth-origin-metadata", title: "SameSite·Origin/Referer·Fetch Metadata를 보조 방어로 겹칩니다",
    lead: "CSRF token을 대체하는 만능 header가 아니라 browser 지원과 privacy/proxy 조건이 다른 독립 신호를 fail-safe 정책으로 결합합니다.",
    mechanism: "SameSite는 cross-site cookie 첨부를 제한하고 Origin/Referer는 요청 출처 검증, Sec-Fetch-Site 등 Fetch Metadata는 navigation/resource context 분류에 쓰입니다. 모두 XSS나 same-site attacker를 단독으로 막지는 못합니다.",
    workflow: "primary token defense를 정한 뒤 exact trusted origin comparison, proxy-aware target reconstruction, Fetch Metadata allow rules와 legacy fallback을 endpoint class별로 작성합니다.",
    invariants: "suffix/substring origin 비교를 하지 않고 missing signal 처리와 trusted proxy 목록을 명시하며 destructive action은 단일 optional header에 의존하지 않습니다.",
    edgeCases: "privacy software가 Referer 제거, old browser, same-site sibling, reverse proxy host rewrite, non-browser client, redirect와 sandboxed iframe을 포함합니다.",
    failureModes: "Origin endsWith trusted-domain 같은 검사는 attacker subdomain에 우회되고, SameSite=Lax만으로 GET mutation이나 top-level navigation을 막을 수 없습니다.",
    verification: "exact origin corpus, missing/opaque/null origin, Fetch Metadata matrix, proxy headers, legacy client와 state-change zero를 테스트합니다.",
    operations: "signal present/missing/mismatch, client class와 policy fallback reason을 수집해 rollout 영향과 공격 변화를 구분합니다.",
    concepts: [c("SameSite", "cookie를 cross-site request에 첨부할 조건을 제한하는 cookie attribute입니다.", ["Strict/Lax/None 의미가 다릅니다.", "Secure 요구를 검토합니다."]), c("Origin validation", "request Origin을 canonical exact trusted origin 집합과 비교하는 보조 CSRF 방어입니다.", ["target origin도 정확히 계산합니다.", "missing policy를 정의합니다."]), c("Fetch Metadata", "브라우저가 request의 site·mode·destination 맥락을 전달하는 Sec-Fetch-* headers입니다.", ["보조 resource-isolation policy에 씁니다.", "legacy fallback이 필요합니다."])],
  }),
  appliedTopic({
    id: "cors-preflight-protocol", title: "CORS simple request와 preflight를 wire protocol로 추적합니다",
    lead: "브라우저가 언제 OPTIONS preflight를 보내는지, 어떤 Access-Control-* 응답을 검사하고 본 요청/response 노출을 허용하는지 단계별로 확인합니다.",
    mechanism: "Origin, method와 non-safelisted headers가 preflight 필요 여부를 결정하고 server는 requested method/headers를 policy와 비교합니다. CORS는 요청 자체의 server-side authorization을 대체하지 않으며 simple request는 preflight 없이 도착할 수 있습니다.",
    workflow: "origin→request method/headers/credentials→preflight 여부→OPTIONS authorization/filter order→allow-origin/method/header/credentials/max-age→actual response exposure를 capture합니다.",
    invariants: "preflight가 authentication보다 먼저 처리되고 deny origin에는 허용 header를 내지 않으며 actual endpoint는 CORS 결과와 무관하게 authentication/authorization/CSRF를 수행합니다.",
    edgeCases: "simple POST form, Authorization header, custom content type, redirect after preflight, 401 OPTIONS, CDN cache, null origin과 private-network access를 포함합니다.",
    failureModes: "OPTIONS를 일반 인증으로 막으면 정상 browser client가 실패하고, preflight가 있으니 CSRF가 막힌다고 믿으면 simple request 공격을 놓칩니다.",
    verification: "raw OPTIONS/actual exchange, allowed/denied origin-method-header combinations, Vary behavior, cache expiry와 direct curl bypass를 테스트합니다.",
    operations: "preflight allow/deny/latency/cache-hit, requested method/header class와 actual auth 결과를 correlation하되 raw arbitrary headers는 label로 쓰지 않습니다.",
    concepts: [c("preflight", "브라우저가 실제 cross-origin request 전에 OPTIONS로 method/header 허용 여부를 묻는 절차입니다.", ["항상 발생하지 않습니다.", "CORS filter order가 중요합니다."]), c("simple request", "Fetch/CORS safelisted 조건을 만족해 preflight 없이 전송될 수 있는 cross-origin request입니다.", ["서버에 도달할 수 있습니다.", "CSRF를 별도 방어합니다."]), c("Vary: Origin", "response가 Origin에 따라 달라질 때 shared cache가 origin별 variant를 구분하도록 하는 header입니다.", ["cache poisoning/leak을 줄입니다.", "동적 origin 응답에 필요합니다."])],
    codeExamples: [node("security05-cors-decision", "credentialed CORS preflight evaluator", "Security05CorsDecision.mjs", "exact origin/method/header allowlist로 preflight 결과를 결정합니다.", String.raw`const policy = { origins: new Set(["https://app.example"]), methods: new Set(["GET", "POST"]), headers: new Set(["authorization", "content-type"]), credentials: true };
const requests = [
  { origin: "https://app.example", method: "POST", headers: ["authorization", "content-type"] },
  { origin: "https://evil.example", method: "POST", headers: ["content-type"] },
  { origin: "https://app.example", method: "DELETE", headers: ["authorization"] },
];
for (const r of requests) { const allow = policy.origins.has(r.origin) && policy.methods.has(r.method) && r.headers.every(h => policy.headers.has(h)); console.log(r.origin + "|" + r.method + "|" + (allow ? "allow" : "deny")); }`, "https://app.example|POST|allow\nhttps://evil.example|POST|deny\nhttps://app.example|DELETE|deny", ["fetch-standard", "spring-cors", "spring-mvc-cors", "local-security-config"])],
  }),
  appliedTopic({
    id: "credentialed-cors-allowlist", title: "credentialed CORS를 exact origin allowlist와 환경별 provenance로 제한합니다",
    lead: "allowCredentials(true)는 browser credential 노출 범위를 넓히므로 wildcard나 사용자 제공 origin 반사 대신 배포 환경에서 소유·검증된 origin만 허용합니다.",
    mechanism: "credentials와 wildcard Allow-Origin은 함께 사용할 수 없고 server가 origin을 동적으로 echo할 때도 allowlist validation과 Vary가 필요합니다. allowed headers '*'는 요청 surface와 preflight cache를 넓히므로 실제 client contract로 축소합니다.",
    workflow: "origin ownership, HTTPS, environment, expiry와 owner를 configuration-as-code로 관리하고 methods/headers/exposed headers/max-age를 endpoint class별 최소화합니다.",
    invariants: "production에서 localhost/preview/wildcard가 허용되지 않고 origin parser는 canonical scheme/host/port exact match를 사용하며 credentials가 필요 없는 public API는 별도 policy를 씁니다.",
    edgeCases: "ephemeral preview, custom ports, internationalized host, trailing dot, uppercase, subdomain takeover, mobile WebView와 decommissioned domain을 포함합니다.",
    failureModes: "request Origin을 그대로 Allow-Origin에 반사하거나 suffix 비교를 쓰면 attacker origin이 credentialed response를 읽을 수 있습니다.",
    verification: "allowlist property tests, hostile origin corpus, config promotion/provenance, expired domain, cache variants와 browser credential read를 검증합니다.",
    operations: "origin class, config revision, deny reason, expired/unowned origin과 preflight volume을 관찰하고 raw arbitrary origin cardinality를 제한합니다.",
    concepts: [c("credentialed CORS", "cookie·HTTP auth 또는 credentials mode를 포함한 cross-origin response 공유입니다.", ["exact origin이 필요합니다.", "CSRF와 server auth를 별도 수행합니다."]), c("origin reflection", "request Origin을 검증 없이 Access-Control-Allow-Origin으로 되돌리는 취약한 구성입니다.", ["allowlist를 우회합니다.", "Vary만으로 해결되지 않습니다."]), c("configuration provenance", "어떤 owner와 review를 거쳐 어느 환경에 CORS origin이 배포됐는지 추적하는 정보입니다.", ["domain ownership과 expiry를 둡니다.", "rollback 가능해야 합니다."])],
  }),
  appliedTopic({
    id: "security-response-headers", title: "Spring 기본 보안 headers와 CSP를 application threat model에 맞게 검증합니다",
    lead: "기본값을 무조건 끄거나 header 이름만 추가하지 않고 HTTPS, content types, framing, executable resources와 third-party origins에 맞춰 browser enforcement를 설계합니다.",
    mechanism: "Spring Security defaults는 cache control, nosniff, HSTS(HTTPS response), frame options 등을 제공합니다. CSP는 script/style/connect/frame 등 resource sources를 제한하고 report-only에서 enforcement로 이동하며 nonce/hash lifecycle이 필요할 수 있습니다.",
    workflow: "response inventory→framework defaults capture→app requirements→CSP report-only→violation triage→nonce/hash integration→canary enforce→header regression test 순으로 적용합니다.",
    invariants: "HSTS는 HTTPS topology를 이해한 뒤 적용하고 민감 response는 적절히 no-store하며 CSP에 unsafe-inline/*를 편의상 넓히지 않고 모든 content type에 nosniff를 유지합니다.",
    edgeCases: "error responses, redirects, static/CDN assets, OAuth popup, embedded admin, download, service worker, third-party analytics와 old cached HTML을 포함합니다.",
    failureModes: "CSP를 한 번에 enforce해 production을 깨거나 report-only를 영구 방치하면 보호되지 않으며, reverse proxy가 headers를 중복/삭제하면 source config와 실제 response가 달라집니다.",
    verification: "raw HTTPS response, browser security panel/CSP reports, error/redirect/static paths, nonce uniqueness, proxy/CDN mutation과 rollback을 검증합니다.",
    operations: "header coverage, CSP violation directive/source class, nonce failure, proxy drift와 policy revision을 privacy-safe하게 집계합니다.",
    concepts: [c("security response header", "브라우저에게 framing, MIME sniffing, transport와 resource loading 보안 정책을 전달하는 HTTP header입니다.", ["실제 response에서 검증합니다.", "기본값과 custom을 구분합니다."]), c("Content Security Policy", "허용된 executable/resource source를 선언해 XSS와 injection 영향을 줄이는 browser 정책입니다.", ["report-only rollout을 활용합니다.", "XSS 방어의 한 층입니다."]), c("HSTS", "브라우저가 일정 기간 해당 host를 HTTPS로만 접속하게 하는 정책입니다.", ["HTTPS response에서 전달됩니다.", "subdomain/preload 영향을 검토합니다."])],
    codeExamples: [node("security05-header-gate", "security response-header coverage gate", "Security05HeaderGate.mjs", "response 종류별 필수 header presence와 CSP enforcement를 검증합니다.", String.raw`const responses = [
  { name: "api", headers: ["cache-control", "content-security-policy", "x-content-type-options", "strict-transport-security"] },
  { name: "error", headers: ["cache-control", "content-security-policy", "x-content-type-options", "strict-transport-security"] },
  { name: "static", headers: ["content-security-policy", "x-content-type-options", "strict-transport-security"] },
];
const required = ["content-security-policy", "x-content-type-options", "strict-transport-security"];
for (const r of responses) console.log(r.name + "|missing=" + (required.filter(h => !r.headers.includes(h)).join(",") || "none"));`, "api|missing=none\nerror|missing=none\nstatic|missing=none", ["spring-headers", "csp3", "owasp-headers", "rfc9110"])],
  }),
  appliedTopic({
    id: "browser-security-test-matrix", title: "실제 browser의 origin·cookie·preflight·header matrix를 자동화합니다",
    lead: "server unit test만으로 browser credential attachment와 response blocking을 증명할 수 없으므로 서로 다른 test origins와 HTTPS에서 end-to-end를 실행합니다.",
    mechanism: "unit은 policy parser, Spring integration은 filters/status/headers, browser E2E는 cookie/site/navigation/fetch/preflight/CSP enforcement, proxy test는 forwarded host와 header mutation을 증명합니다.",
    workflow: "trusted/untrusted/same-site sibling origins, credential modes, safe/unsafe methods, simple/preflighted content, valid/missing/stale CSRF와 response types를 pairwise matrix로 생성합니다.",
    invariants: "test가 production credentials/domains를 사용하지 않고 cross-site deny 뒤 state side effect가 0이며 browser console message만이 아니라 server DB/readback까지 확인합니다.",
    edgeCases: "browser versions, private mode, service worker, bfcache, third-party cookie policy, IPv6 localhost, proxy/CDN와 clock skew를 포함합니다.",
    failureModes: "MockMvc header presence만 확인하면 browser가 cookie를 언제 보내고 response를 언제 숨기는지, preflight cache와 CSP 실행을 놓칩니다.",
    verification: "raw protocol capture, browser context/storage isolation, synthetic server state readback, CSP violation sink, accessibility/error UX와 artifact secret scan을 실행합니다.",
    operations: "matrix coverage, browser-family failure, preflight/cache, CSRF deny side effect와 header drift를 release dashboard에 연결합니다.",
    concepts: [c("browser-origin fixture", "서로 다른 scheme/host/port를 실제로 제공해 origin/site policy를 재현하는 test 환경입니다.", ["hosts 파일 문자열 mock과 다릅니다.", "HTTPS를 포함합니다."]), c("state readback", "보안상 거부된 request 뒤 server-side resource가 변경되지 않았음을 trusted channel로 다시 조회하는 검증입니다.", ["status만 보지 않습니다.", "synthetic data를 씁니다."]), c("policy matrix coverage", "credential/origin/method/content/token/response 조합 중 자동화된 browser evidence가 있는 범위입니다.", ["위험 기반으로 관리합니다.", "browser version을 기록합니다."])],
  }),
  appliedTopic({
    id: "browser-security-rollout-recovery", title: "CORS·CSRF·CSP 변경을 report-only·canary·rollback으로 운영합니다",
    lead: "browser security policy는 frontend 배포, domains와 credentials에 강하게 결합되므로 old/new clients가 공존하는 compatibility window와 즉시 복구 가능한 policy artifact가 필요합니다.",
    mechanism: "CSP는 report-only, CORS는 shadow evaluator, CSRF는 endpoint cohort/compatibility token으로 차이를 측정하고 deny spike만이 아니라 unexpected allow와 mutation evidence를 guardrail로 둡니다.",
    workflow: "inventory→offline matrix→shadow/report-only→internal→small cohort→enforce→old-policy retirement 순으로 rollout하고 signed revision과 rollback procedure를 유지합니다.",
    invariants: "fallback이 wildcard/CSRF disable이 아니며 emergency 완화도 expiry/owner/scope를 갖고 rollback 후 stale preflight/CDN/browser caches를 고려합니다.",
    edgeCases: "old SPA cached HTML, rolling backends, preflight max-age, CDN header cache, provider callback, mobile WebView와 telemetry outage를 포함합니다.",
    failureModes: "장애 대응으로 전체 origin을 허용하거나 CSRF를 끄면 가용성 incident를 security incident로 확대하고 캐시 때문에 rollback이 즉시 보이지 않을 수 있습니다.",
    verification: "old/new differential, unexpected allow, state mutation canary, policy/cache revision readback, emergency expiry와 incident drill을 실행합니다.",
    operations: "CSRF/CORS/CSP policy revision skew, unexpected allow, deny/violation change, browser compatibility와 cache age에 owner/runbook을 연결합니다.",
    concepts: [c("report-only", "정책 위반을 보고하지만 browser가 resource를 차단하지 않는 관찰 단계입니다.", ["CSP migration에 사용합니다.", "영구 보호 상태가 아닙니다."]), c("compatibility window", "old/new frontend와 backend security contracts가 안전하게 공존하도록 유지하는 제한된 기간입니다.", ["종료 조건을 둡니다.", "fallback scope를 최소화합니다."]), c("emergency policy", "incident 중 최소 범위와 TTL로 임시 적용하는 보안 policy revision입니다.", ["wildcard를 기본으로 하지 않습니다.", "사후 review가 필요합니다."])],
    codeExamples: [node("security05-release-gate", "browser-security rollout gate", "Security05ReleaseGate.mjs", "CSRF side effect, CORS unexpected allow, CSP violations와 rollback evidence로 release를 판정합니다.", String.raw`const evidence = { csrfMutationAfterDeny: 0, corsUnexpectedAllow: 0, cspBlockingViolations: 0, browserMatrixPercent: 100, headerCoveragePercent: 100, rollbackVerified: true, secretFindings: 0 };
const pass = evidence.csrfMutationAfterDeny === 0 && evidence.corsUnexpectedAllow === 0 && evidence.cspBlockingViolations === 0 && evidence.browserMatrixPercent === 100 && evidence.headerCoveragePercent === 100 && evidence.rollbackVerified && evidence.secretFindings === 0;
for (const [key, value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "csrfMutationAfterDeny=0\ncorsUnexpectedAllow=0\ncspBlockingViolations=0\nbrowserMatrixPercent=100\nheaderCoveragePercent=100\nrollbackVerified=true\nsecretFindings=0\nrelease=pass", ["owasp-csrf", "owasp-cors", "owasp-headers", "spring-csrf", "spring-cors", "spring-headers"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-security-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["stateless/CSRF/CORS source snapshot", "credentialed CORS settings"], evidence: "2026-07-14 read-only sanitized audit: 106 lines, 6,013 bytes, SHA-256 B1051723C4FEE8FCBEC587B0A1CFCFA7A9EB0C461EBE59602DA980EF1D62CCD8. 실제 origins/routes/messages는 복사하지 않았습니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["Spring Boot 4.0.6/Java 21 source-version boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5." },
  { id: "spring-csrf", repository: "Spring Security reference", path: "servlet/exploits/csrf.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html", usedFor: ["Servlet CSRF configuration", "token repository/handler/lifecycle"], evidence: "Spring Security 공식 Servlet CSRF reference입니다." },
  { id: "spring-csrf-spa", repository: "Spring Security reference", path: "servlet/exploits/csrf.html#csrf-integration-javascript-spa", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa", usedFor: ["SPA token integration and rotation"], evidence: "Spring Security 공식 SPA CSRF integration section입니다." },
  { id: "spring-csrf-features", repository: "Spring Security reference", path: "features/exploits/csrf.html", publicUrl: "https://docs.spring.io/spring-security/reference/features/exploits/csrf.html", usedFor: ["CSRF threat and browser-client decision"], evidence: "Spring Security 공식 CSRF feature reference입니다." },
  { id: "spring-cors", repository: "Spring Security reference", path: "servlet/integrations/cors.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html", usedFor: ["CORS filter ordering", "UrlBasedCorsConfigurationSource integration"], evidence: "Spring Security 공식 CORS integration reference입니다." },
  { id: "spring-mvc-cors", repository: "Spring Framework reference", path: "web/webmvc-cors.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html", usedFor: ["Spring MVC CORS configuration semantics"], evidence: "Spring Framework 공식 Web MVC CORS reference입니다." },
  { id: "spring-headers", repository: "Spring Security reference", path: "servlet/exploits/headers.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/headers.html", usedFor: ["default security response headers", "header customization"], evidence: "Spring Security 공식 security headers reference입니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "fetch", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["origin/CORS/preflight/credentials protocol"], evidence: "WHATWG living Fetch standard입니다." },
  { id: "cookie-bis", repository: "IETF HTTP Working Group", path: "draft-ietf-httpbis-rfc6265bis", publicUrl: "https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis", usedFor: ["cookie scope and SameSite semantics"], evidence: "IETF HTTP state-management revision draft입니다; 적용 browser/runtime 지원은 별도 검증합니다." },
  { id: "csp3", repository: "W3C Content Security Policy Level 3", path: "TR/CSP3", publicUrl: "https://www.w3.org/TR/CSP3/", usedFor: ["CSP directives, report-only and enforcement"], evidence: "W3C CSP Level 3 specification입니다." },
  { id: "owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["CSRF defense in depth", "SameSite/origin/fetch-metadata guidance"], evidence: "OWASP 공식 CSRF prevention guidance입니다." },
  { id: "owasp-cors", repository: "OWASP Web Security Testing Guide", path: "Testing_Cross_Origin_Resource_Sharing", publicUrl: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing", usedFor: ["hostile CORS testing"], evidence: "OWASP 공식 CORS testing guidance입니다." },
  { id: "owasp-headers", repository: "OWASP Cheat Sheet Series", path: "HTTP_Headers_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html", usedFor: ["security response-header review"], evidence: "OWASP 공식 HTTP security headers guidance입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["safe/unsafe method and response semantics"], evidence: "HTTP Semantics 표준입니다." },
];

const session = createExpertSession({
  inventoryId: "sec-03-cors-csrf-stateless", slug: "security-05-csrf-cors-security-headers", courseId: "devops", moduleId: "security-filter-authentication", order: 5,
  title: "CSRF·CORS·security headers", subtitle: "browser credential 모델에서 CSRF token lifecycle, exact CORS preflight와 CSP/header rollout까지 실제 wire evidence로 검증합니다.",
  level: "고급", estimatedMinutes: 175,
  coreQuestion: "서로 다른 origin의 SPA와 API를 연결하면서 browser가 자동 첨부하는 credential의 CSRF 위험, response 공유를 위한 CORS와 실행 정책인 security headers를 어떻게 혼동 없이 설계할까요?",
  summary: "Spring Boot 4.0.6 학습 설정의 stateless·CSRF disable·credentialed CORS를 read-only·sanitized 감사하고, 'JWT면 CSRF가 없다'는 source comment를 credential storage/transport를 확인해야 하는 위험한 일반화로 명확히 교정합니다. 실제 origin, route와 token은 복사하지 않습니다. origin/site/cookie, endpoint별 CSRF 결정, SPA token rotation, SameSite/Origin/Fetch Metadata, preflight/exact credentialed allowlist, Spring 기본 headers와 CSP, real-browser matrix 및 report-only/canary/rollback을 Spring·WHATWG·IETF·W3C·OWASP 근거와 여섯 executable models로 연결합니다.",
  objectives: ["로컬 CSRF/CORS 설정의 전제와 gap을 감사한다.", "origin·site·cookie scope와 자동 credential을 구분한다.", "endpoint별 CSRF threat decision을 작성한다.", "SPA CSRF token 발급·rotation·logout lifecycle을 구현한다.", "SameSite·Origin·Fetch Metadata를 보조 방어로 적용한다.", "preflight/simple request wire protocol을 추적한다.", "credentialed CORS allowlist를 최소화한다.", "Spring headers와 CSP를 실제 response에서 검증한다.", "browser matrix와 policy rollout/rollback을 자동화한다."],
  prerequisites: [{ title: "request·method·resource 인가", reason: "CORS가 server authorization이 아니며 CSRF/CORS filter를 통과한 실제 endpoint도 principal-resource 정책을 수행해야 함을 이해해야 합니다.", sessionSlug: "security-04-request-method-authorization" }],
  keywords: ["CSRF", "CORS", "origin", "site", "SameSite", "CsrfTokenRepository", "preflight", "Access-Control-Allow-Origin", "CSP", "HSTS", "Fetch Metadata", "browser security"],
  topics,
  lab: { title: "서로 다른 HTTPS origins에서 CSRF·CORS·CSP를 end-to-end qualification하기", scenario: "원본 설정은 변경하지 않고 trusted/untrusted/same-site sibling origins, synthetic credentials와 disposable server state로 simple/preflighted requests, token rotation와 header policy rollout을 검증합니다.", setup: ["Java 21/Spring Security compatible fixture", "서로 다른 3개 HTTPS test origins", "실제 browser automation", "synthetic cookie/bearer credentials", "disposable mutation store", "proxy/CDN header emulator", "CSP report sink", "원본 2 files read-only"], steps: ["원본 hash와 CSRF/CORS assumptions를 redacted inventory로 만듭니다.", "cookie/header/client-certificate credential의 automatic attachment와 scope를 분류합니다.", "state-changing endpoint마다 CSRF token/origin/SameSite defenses를 결정합니다.", "SPA bootstrap/login/mutation/logout token rotation과 multi-tab을 구현합니다.", "trusted/untrusted/sibling origins에서 simple form과 fetch state-change zero를 검증합니다.", "preflight/actual CORS method/header/credential/Vary exchange를 raw capture합니다.", "exact origin ownership/config provenance와 hostile origin corpus를 시험합니다.", "Spring 기본 headers를 capture하고 CSP report-only→enforce canary를 실행합니다.", "browser versions, proxy/CDN/cache와 old/new frontend compatibility를 검증합니다.", "unexpected allow/deny/violation guardrail, rollback/readback과 원본 unchanged를 확인합니다."], expectedResult: ["CSRF disable/enable 결정이 credential와 endpoint별 검증 가능한 전제에 연결됩니다.", "untrusted cross-site request는 state를 변경하지 못하고 trusted SPA의 token lifecycle은 race/logout 뒤 수렴합니다.", "CORS는 exact 최소 allowlist로 동작하고 direct clients도 server auth를 우회하지 못합니다.", "error/static/API를 포함한 실제 HTTPS responses가 승인된 security header/CSP를 가집니다.", "policy rollback 뒤 preflight/CDN/browser caches까지 승인 revision으로 수렴합니다."], cleanup: ["synthetic cookies/tokens/state와 test origins/certificates를 폐기합니다.", "browser contexts, service workers, caches, report sinks와 proxy emulator를 종료합니다.", "captures/reports에서 credential·origin identifiers를 제거하고 retention에 따라 삭제합니다.", "원본 2 files hash/status unchanged를 확인합니다."], extensions: ["CHIPS/partitioned cookies와 browser privacy 변화 matrix를 추가합니다.", "OAuth redirect/login CSRF와 PKCE/state를 후속 세션과 통합합니다.", "CSP nonce/hash build pipeline과 Trusted Types를 qualification합니다.", "organization-wide CORS domain ownership/expiry scanner를 자동화합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node examples를 실행하고 실제 browser request/response와 대응시키세요.", requirements: ["stdout 완전 일치", "source assumptions", "credential risk", "token machine", "CORS decision", "header gate", "release gate"], hints: ["Node model은 browser cookie/site/preflight/CSP enforcement를 대체하지 않습니다."], expectedOutcome: "CSRF, CORS와 headers의 서로 다른 보안 경계와 증거를 설명합니다.", solutionOutline: ["audit→credential model→CSRF lifecycle→CORS wire→headers→operate 순서입니다."] },
    { difficulty: "응용", prompt: "cookie refresh와 bearer access token을 쓰는 SPA의 browser security contract를 설계하세요.", requirements: ["credential table", "CSRF endpoints", "token rotation", "exact CORS", "SameSite/origin", "CSP", "browser matrix", "rollback"], hints: ["access token header만 보고 refresh/logout cookie와 OAuth routes를 누락하지 마세요."], expectedOutcome: "cross-site 공격과 배포 호환성 실패를 함께 통제하는 설계가 완성됩니다.", solutionOutline: ["threat→protocol→enforce→browser evidence→rollout/recovery 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 browser security policy governance를 작성하세요.", requirements: ["domain ownership", "credential standards", "CSRF decision record", "CORS provenance", "header/CSP baseline", "testing", "telemetry privacy", "emergency policy"], hints: ["wildcard와 global disable을 장애 대응 기본값으로 두지 마세요."], expectedOutcome: "서비스별 frontend 차이를 허용하면서도 최소 보안 기준과 복구 절차를 공유합니다.", solutionOutline: ["inventory→baseline/exceptions→evidence→promotion→incident 순서입니다."] },
  ],
  nextSessions: ["security-06-authentication-exception-entrypoint"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["로컬 source의 실제 allowed origins, routes, response messages와 credential/token 값은 공개 content에 복사하지 않았습니다.", "source의 'JWT면 CSRF 위험 없음' 취지 주석은 credential storage/transport와 browser endpoint를 확인하지 않은 과도한 일반화로 표시했고 그대로 권고하지 않습니다.", "Spring Boot 4.0.6 managed dependencies와 current Spring Security reference의 세부 API는 실제 lockfile/runtime에서 다시 qualification해야 합니다.", "Node models는 actual browser site/cookie rules, Spring filters, reverse proxy/CDN와 CSP enforcement를 대체하지 않으므로 lab browser integration을 요구합니다."] },
});

export default session;
