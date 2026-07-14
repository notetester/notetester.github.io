import type { SessionSource } from "../../types";
import { appliedTopic, concept, nodeExample } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const topics: ExpertTopic[] = [
  appliedTopic({
    id: "local-stateless-session-gap",
    title: "로컬 SecurityContext 사용과 session login 부재를 먼저 고정합니다",
    lead: "SecurityContextHolder를 읽고 쓴다는 사실은 authentication state 사용의 증거지만 그 state가 HTTP session에 저장된다는 증거는 아닙니다.",
    mechanism: "로컬 JWT request filter는 request에서 authentication을 구성해 SecurityContextHolder에 설정하고 controller는 현재 context의 Authentication을 읽는 구조를 보여 줍니다. 같은 SecurityConfig는 stateless session 정책을 선언하므로 조사 snapshot은 token-per-request 흐름이며 formLogin, HttpSessionSecurityContextRepository 또는 session authentication strategy 구현 증거가 아닙니다.",
    workflow: "filter write, controller read, session policy와 build declaration의 경로·line·byte·hash를 고정합니다. session login 학습 내용은 current official reference와 Javadoc에서 가져오고 local observation, official mechanism, synthetic lab result를 서로 다른 provenance label로 표시합니다.",
    invariants: "local source가 증명하지 않은 session persistence와 form login을 local project 기능으로 서술하지 않습니다. 실제 token, username, endpoint, origin, cookie와 session id는 공개 예제·출처 evidence·stdout에 복사하지 않습니다.",
    edgeCases: "다른 branch/profile에 session 설정이 있을 가능성, generated auto-configuration, test-only login, gateway session과 application session을 구분합니다. stateless라는 이름만으로 browser cookie나 request cache가 전혀 없다고 단정하지 않습니다.",
    failureModes: "SecurityContextHolder 사용을 session 사용으로 오인하면 request 종료 뒤 context persistence와 logout 설명이 잘못됩니다. 반대로 local session code가 없다는 이유로 official form login·repository lifecycle을 생략하면 다음 method authorization의 principal 생성 과정을 이해할 수 없습니다.",
    verification: "selected hash를 다시 계산하고 targeted search로 formLogin, session repository와 UserDetailsService 증거 범위를 기록합니다. supported-version disposable project에서는 실제 Set-Cookie·session id rotation·second request context restoration을 별도 검증합니다.",
    operations: "source snapshot, resolved dependencies, runtime session policy와 context repository topology를 release manifest에 남깁니다. local source가 바뀌면 문서 claim을 재검토하고 secret-shaped telemetry가 0인지 재검사합니다.",
    concepts: [
      concept("request-local context", "한 request 처리 중 SecurityContextHolder에서 접근하는 authentication state입니다.", ["지속 저장과 별도입니다.", "요청 종료 cleanup이 필요합니다."]),
      concept("session persistence", "request 사이에 SecurityContext를 repository와 HTTP session으로 복원·저장하는 메커니즘입니다.", ["명시된 policy가 필요합니다.", "stateless 흐름과 다릅니다."]),
      concept("provenance gap", "local evidence와 학습해야 할 공식 메커니즘 사이의 확인된 차이입니다.", ["추측으로 채우지 않습니다.", "synthetic lab로 보완합니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-evidence-gate", "stateless local evidence와 session official coverage 분리", "security03-evidence.mjs", "context read/write, stateless와 session login claim을 provenance 상태로 분류합니다.", `const claims = [
  { id: "context-write", local: true, official: true },
  { id: "context-read", local: true, official: true },
  { id: "stateless-policy", local: true, official: true },
  { id: "local-form-login", local: false, official: true },
  { id: "local-session-repository", local: false, official: true }
];
for (const claim of claims) {
  console.log(claim.id + "=" + (claim.local ? "OBSERVED" : "OFFICIAL-ONLY"));
}
console.log("copied-identifiers=0");`, "context-write=OBSERVED\ncontext-read=OBSERVED\nstateless-policy=OBSERVED\nlocal-form-login=OFFICIAL-ONLY\nlocal-session-repository=OFFICIAL-ONLY\ncopied-identifiers=0", ["local-security-current", "local-jwt-current", "local-members-controller", "local-security-mp1", "local-build-current", "spring-session-management"]),
    ],
    expertNotes: ["SecurityContextHolder는 저장소가 아니라 현재 실행 흐름의 접근 지점입니다.", "negative evidence는 선택한 경로·검색 pattern·시점 범위 안에서만 주장합니다."],
  }),
  appliedTopic({
    id: "form-login-request-flow",
    title: "form login을 page, credential POST와 success/failure 계약으로 나눕니다",
    lead: "login 화면을 보여 주는 GET과 credential을 검증하는 POST, 인증 후 이동은 서로 다른 보안·HTTP 계약입니다.",
    mechanism: "UsernamePasswordAuthenticationFilter 계열은 configured processing URL의 username/password request를 unauthenticated Authentication으로 만들고 AuthenticationManager에 전달합니다. 성공은 SecurityContext와 success handler, 실패는 context 정리와 failure handler로 이어지며 login page rendering 자체와 분리됩니다.",
    workflow: "GET login page, POST credential, CSRF token, parameter names·content type, success/failure response와 session cookie를 sequence로 적습니다. browser HTML redirect와 JSON API response를 별도 chain/entry point로 설계하고 TLS·cache-control·autocomplete/password manager UX를 검토합니다.",
    invariants: "credential POST는 TLS와 CSRF 정책을 통과하고 raw password를 URL·redirect·log에 남기지 않습니다. 성공 전에는 authenticated context가 없고 실패 시 session fixation rotation이나 success side effect가 발생하지 않습니다.",
    edgeCases: "duplicate submit, back button, expired CSRF/session, malformed content type, missing parameter, remember-me, already-authenticated user, login page redirect loop와 SPA fetch를 검사합니다.",
    failureModes: "GET query로 credential을 보내면 URL history·proxy log·referrer에 노출됩니다. API와 form handler를 섞어 실패 때 HTML 200을 반환하면 client parser와 retry가 망가지고 account enumeration 차이도 커집니다.",
    verification: "real browser/container test에서 GET page cache headers, POST request body, CSRF, status/redirect, Set-Cookie, second request principal과 failure secret-zero를 확인합니다. mocked authenticated principal만으로 login filter를 우회하지 않습니다.",
    operations: "login start/success/failure는 raw identifier 없이 channel·reason·latency로 집계합니다. redirect loop, CSRF reject, failure burst와 login page cache anomaly를 경보하고 safe maintenance entry point를 둡니다.",
    concepts: [
      concept("form login", "browser form의 username/password를 AuthenticationManager에 전달하고 성공·실패 handler로 번역하는 servlet 인증 흐름입니다.", ["page rendering과 POST processing을 구분합니다.", "CSRF와 TLS가 필요합니다."]),
      concept("UsernamePasswordAuthenticationFilter", "username/password request를 unauthenticated token으로 만들고 authentication manager에 위임하는 filter입니다.", ["processing URL과 parameters를 검증합니다.", "provider 자체는 아닙니다."]),
      concept("authentication handler", "성공 또는 실패 결과를 redirect·status·body와 후속 action으로 변환하는 전략입니다.", ["open redirect를 막습니다.", "credential을 출력하지 않습니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-form-flow", "form login 상태 전이", "security03-form-flow.mjs", "GET page와 POST credential 결과를 분리하고 성공할 때만 context·session 단계로 이동합니다.", `function submit(request) {
  const trace = ["FILTER"];
  if (request.method !== "POST") return trace.concat("PASS").join(">");
  if (!request.csrf) return trace.concat("CSRF_REJECT").join(">");
  trace.push("AUTH_MANAGER");
  if (!request.valid) return trace.concat("FAILURE_HANDLER").join(">");
  return trace.concat("CONTEXT", "SESSION_STRATEGY", "SUCCESS_HANDLER").join(">");
}
console.log("page=" + submit({ method: "GET" }));
console.log("missing-csrf=" + submit({ method: "POST", csrf: false }));
console.log("wrong=" + submit({ method: "POST", csrf: true, valid: false }));
console.log("valid=" + submit({ method: "POST", csrf: true, valid: true }));`, "page=FILTER>PASS\nmissing-csrf=FILTER>CSRF_REJECT\nwrong=FILTER>AUTH_MANAGER>FAILURE_HANDLER\nvalid=FILTER>AUTH_MANAGER>CONTEXT>SESSION_STRATEGY>SUCCESS_HANDLER", ["spring-form-login", "username-password-filter-api", "spring-authentication-architecture", "spring-csrf"]),
    ],
    expertNotes: ["processing filter anchor를 local JWT filter order에 사용해도 form login이 활성화됐다는 뜻은 아닙니다.", "credential parameter 이름을 바꾸는 것은 secrecy를 제공하지 않습니다."],
  }),
  appliedTopic({
    id: "authentication-state-transition",
    title: "unauthenticated token에서 authenticated Authentication까지 불변식을 추적합니다",
    lead: "Authentication 객체는 단순 사용자 DTO가 아니라 요청 credential, 검증 상태, principal과 authorities가 단계에 따라 달라지는 보안 상태입니다.",
    mechanism: "filter는 아직 검증되지 않은 token을 만들고 AuthenticationManager/ProviderManager가 지원 provider에 위임합니다. 성공 result는 authenticated=true, 검증된 principal과 authorities를 가지며 raw credentials는 지워져야 하고 실패는 context에 성공 state를 남기지 않습니다.",
    workflow: "RECEIVED→UNAUTHENTICATED→PROVIDER→AUTHENTICATED 또는 REJECTED 상태 machine을 작성합니다. 각 transition의 입력 owner, credential retention, events, exception translation과 side effect를 표로 고정합니다.",
    invariants: "client는 authenticated flag나 authorities를 스스로 만들 수 없고 trusted provider만 성공 token을 생성합니다. 실패·unsupported provider·disabled account에서 SecurityContext는 empty이며 raw credential은 response와 result에 없습니다.",
    edgeCases: "multiple providers, parent manager, anonymous authentication, remember-me, pre-auth, compromised credential check, event listener failure와 credential erasure가 cached principal에 미치는 영향을 검사합니다.",
    failureModes: "custom Authentication에서 setAuthenticated(true)를 public constructor로 허용하면 검증 우회가 됩니다. username/password token을 domain user와 혼용하면 JSON 직렬화나 persistence로 raw credential이 새어 나갈 수 있습니다.",
    verification: "provider supports/null/success/exception, authority origin과 erase를 parameterized test하고 context가 실패 후 empty인지 확인합니다. event consumer 오류가 authentication transaction을 의도치 않게 바꾸지 않는지도 fault test합니다.",
    operations: "state transition count와 failure reason을 provider·channel별로 관측하되 principal/credential은 제외합니다. impossible transition이나 authenticated result with credentials를 release blocker로 둡니다.",
    concepts: [
      concept("Authentication", "검증 전 credential 요청 또는 검증 후 principal·authorities를 표현하는 Spring Security 핵심 interface입니다.", ["단계에 따라 의미가 달라집니다.", "credential erasure가 필요합니다."]),
      concept("AuthenticationManager", "Authentication 요청을 검증하고 성공 result 또는 실패를 반환하는 계약입니다.", ["대개 ProviderManager가 구현합니다.", "context 저장과 분리됩니다."]),
      concept("trusted transition", "검증된 provider만 unauthenticated 요청을 authenticated result로 바꿀 수 있다는 불변식입니다.", ["client flag를 믿지 않습니다.", "audit evidence를 남깁니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-auth-state", "Authentication trusted transition 모델", "security03-auth-state.mjs", "provider가 지원하고 credential·account 상태가 모두 유효할 때만 authenticated result를 만듭니다.", `function authenticate(input) {
  const state = { authenticated: false, credentials: "PRESENT", authorities: [] };
  if (!input.providerSupports) return { code: "UNSUPPORTED", state };
  if (!input.credentialValid || !input.accountEnabled) {
    state.credentials = "ERASED";
    return { code: "REJECTED", state };
  }
  state.authenticated = true;
  state.credentials = "ERASED";
  state.authorities = input.authorities;
  return { code: "OK", state };
}
for (const input of [
  { providerSupports: true, credentialValid: true, accountEnabled: true, authorities: ["READ"] },
  { providerSupports: true, credentialValid: false, accountEnabled: true, authorities: ["READ"] },
  { providerSupports: false }
]) {
  const result = authenticate(input);
  console.log(result.code + "=" + result.state.authenticated + "/" + result.state.credentials + "/" + result.state.authorities.length);
}`, "OK=true/ERASED/1\nREJECTED=false/ERASED/0\nUNSUPPORTED=false/PRESENT/0", ["authentication-api", "spring-authentication-architecture", "dao-provider-api"]),
    ],
    expertNotes: ["unsupported pass-through에서도 outer boundary가 raw credential lifecycle을 끝내는지 확인합니다.", "Authentication의 isAuthenticated는 authorization 전에 trusted construction 경로를 검증해야 합니다."],
  }),
  appliedTopic({
    id: "securitycontextholder-lifecycle",
    title: "SecurityContextHolder의 strategy와 request cleanup을 정확히 다룹니다",
    lead: "SecurityContextHolder는 보통 현재 thread에서 context에 접근하게 하지만 thread pool·async·reactive 경계에서는 자동 전파를 가정할 수 없습니다.",
    mechanism: "SecurityContext는 현재 Authentication을 담고 SecurityContextHolderStrategy가 저장 방식과 접근을 결정합니다. servlet filter chain은 request 시작에 context를 준비하고 종료 시 반드시 clear해 pooled thread에서 다음 사용자에게 누출되지 않게 합니다.",
    workflow: "request A load→set/read→downstream→finally clear, 그 뒤 같은 worker의 request B가 empty에서 시작하는 timeline을 만듭니다. child task가 필요하면 DelegatingSecurityContext 계열 또는 명시적 snapshot을 최소 scope로 전달하고 작업 후 지웁니다.",
    invariants: "request 시작 전 stale Authentication이 없고 성공·exception·timeout 모든 path에서 context가 clear됩니다. mutable SecurityContext를 여러 concurrent tasks가 공유하지 않으며 전달된 authority는 task 실행 시점 freshness 정책을 가집니다.",
    edgeCases: "thread pool reuse, @Async, CompletableFuture, servlet async dispatch, virtual thread, scheduled/background job, nested impersonation, error dispatch와 test parallelism을 검사합니다.",
    failureModes: "InheritableThreadLocal을 무작정 켜면 pool thread와 child lifecycle에서 stale principal이 섞일 수 있습니다. finally clear가 빠지면 한 사용자의 권한이 다음 request에서 보이는 치명적 cross-user leak이 됩니다.",
    verification: "single worker에 서로 다른 synthetic identities를 연속·병렬 실행하고 B가 A를 절대 보지 않는지 assertion합니다. async propagation은 명시적 wrapper의 before/after/exception cleanup과 actual executor integration으로 검증합니다.",
    operations: "raw principal 대신 context-present, authentication category와 leak canary를 관측합니다. impossible cross-request correlation이 탐지되면 admission을 중단하고 affected worker/context scope를 폐기한 뒤 audit합니다.",
    concepts: [
      concept("SecurityContext", "현재 실행의 Authentication을 담는 보안 상태 container입니다.", ["session 자체가 아닙니다.", "mutable sharing을 주의합니다."]),
      concept("SecurityContextHolderStrategy", "SecurityContextHolder가 context를 저장·복원·clear하는 전략입니다.", ["thread model과 맞아야 합니다.", "global 변경은 위험합니다."]),
      concept("context leakage", "이전 request 또는 task의 Authentication이 다음 실행에 남는 격리 실패입니다.", ["finally cleanup이 핵심입니다.", "cross-user incident입니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-context-isolation", "pooled worker context cleanup", "security03-context.mjs", "request 종료 finally clear가 다음 request의 stale principal을 막는 과정을 실행합니다.", `let holder = null;
function request(name, fail) {
  if (holder !== null) throw new Error("stale context");
  holder = name;
  try {
    console.log("inside-" + name + "=" + holder);
    if (fail) throw new Error("synthetic");
  } catch {
    console.log("error-" + name + "=handled");
  } finally {
    holder = null;
  }
  console.log("after-" + name + "=" + holder);
}
request("alpha", true);
request("beta", false);`, "inside-alpha=alpha\nerror-alpha=handled\nafter-alpha=null\ninside-beta=beta\nafter-beta=null", ["security-context-api", "security-context-holder-api", "local-jwt-current", "local-members-controller"]),
    ],
    expertNotes: ["reactive stack은 Reactor context를 사용하므로 servlet ThreadLocal 설명을 그대로 적용하지 않습니다.", "scheduled job의 service identity는 사용자 context를 우연히 상속하지 않고 명시적으로 부여합니다."],
  }),
  appliedTopic({
    id: "securitycontextrepository-persistence",
    title: "SecurityContextRepository의 load·save·clear 책임을 request 사이에서 추적합니다",
    lead: "현재 request에서 Authentication을 holder에 넣는 것과 다음 request가 그것을 복원할 수 있게 repository에 저장하는 것은 별도 동작입니다.",
    mechanism: "SecurityContextRepository는 request에서 context를 load하고 response와 함께 save합니다. HttpSessionSecurityContextRepository는 HTTP session을 backing store로 사용할 수 있으며 session 생성 최소화, anonymous context와 equality 판단 같은 policy를 가집니다.",
    workflow: "request 1 repository load(empty)→authentication→context set→repository save→response cookie, request 2 cookie→session lookup→context load→authorization→clear 순서를 server/client 두 timeline으로 그립니다.",
    invariants: "인증 성공을 지속해야 할 flow는 response commit 전에 올바른 repository에 context를 저장합니다. 실패·logout·invalid session은 stale context를 복원하지 않고 session id만으로 Authentication을 만들지 않습니다.",
    edgeCases: "lazy/deferred load, session creation policy, response commit, redirect, concurrent request, session invalidation, serialization, classloader/version mismatch, distributed store outage와 cookie 없는 client를 검사합니다.",
    failureModes: "holder에 set만 하고 repository save를 빠뜨리면 현재 request는 로그인처럼 보이지만 다음 request는 anonymous입니다. 서로 다른 repository를 load/save에 사용하면 context가 사라지거나 예상하지 않은 session이 생성됩니다.",
    verification: "두 개의 실제 HTTP request를 cookie jar로 연결해 첫 save, second load, no-cookie isolation과 invalidation을 검사합니다. repository spy count와 response committed timing을 assertion하고 session content에 credential이 없는지 확인합니다.",
    operations: "context load/save/empty/failure, session creation과 store latency를 privacy-safe aggregate로 관측합니다. repository 변경은 serialization compatibility, rolling deployment와 rollback read/write matrix를 통과해야 합니다.",
    concepts: [
      concept("SecurityContextRepository", "request 사이 SecurityContext의 load와 save를 추상화하는 계약입니다.", ["holder와 역할이 다릅니다.", "명시적 save semantics를 확인합니다."]),
      concept("HttpSessionSecurityContextRepository", "HTTP session을 사용해 SecurityContext를 지속하는 repository 구현입니다.", ["session creation policy를 가집니다.", "raw credential을 저장하지 않습니다."]),
      concept("response commit boundary", "headers·status가 전송되어 session cookie나 redirect를 더 바꾸기 어려워지는 시점입니다.", ["save timing과 연결됩니다.", "wrapper behavior를 검증합니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-repository", "명시적 context save와 두 번째 request 복원", "security03-repository.mjs", "holder set만 한 경우와 repository까지 save한 경우의 다음 request 차이를 모델링합니다.", `const repository = new Map();
function login(sessionId, explicitSave) {
  const context = { principal: "synthetic", credentials: null };
  if (explicitSave) repository.set(sessionId, context);
  return "CURRENT_REQUEST_AUTHENTICATED";
}
function nextRequest(sessionId) {
  return repository.has(sessionId) ? "RESTORED" : "ANONYMOUS";
}
console.log("set-only=" + login("s1", false) + "/" + nextRequest("s1"));
console.log("saved=" + login("s2", true) + "/" + nextRequest("s2"));
console.log("credentials-stored=" + [...repository.values()].some((value) => value.credentials !== null));`, "set-only=CURRENT_REQUEST_AUTHENTICATED/ANONYMOUS\nsaved=CURRENT_REQUEST_AUTHENTICATED/RESTORED\ncredentials-stored=false", ["security-context-repository-api", "http-session-repository-api", "spring-session-management"]),
    ],
    expertNotes: ["실제 session id나 principal은 예제·telemetry에 출력하지 않습니다.", "repository save는 transaction commit과 동일하지 않으므로 failure order를 별도 설계합니다."],
  }),
  appliedTopic({
    id: "v5-v6-explicit-save",
    title: "Spring Security 5 자동 저장과 6/current explicit save 차이를 구분합니다",
    lead: "오래된 예제의 SecurityContextHolder set 한 줄이 현재 custom login에서도 다음 request persistence를 보장한다고 가정하면 조용한 로그인 소실이 생깁니다.",
    mechanism: "공식 session management 문서는 Spring Security 5 기본에서 SecurityContextPersistenceFilter가 context를 읽고 request 종료에 자동 저장하던 흐름과 Spring Security 6에서 SecurityContextHolderFilter가 읽기만 하며 custom persistence는 명시적 save가 필요해진 흐름을 구분합니다. 지원 version과 requireExplicitSave 설정을 실제 artifact에서 확인해야 합니다.",
    workflow: "migration 전에 runtime filter list, repository, custom authentication success path와 context save call을 inventory합니다. framework-managed form login과 custom controller/manual authentication을 분리하고 각 성공 path가 누가 save하는지 owner table로 만듭니다.",
    invariants: "지속되어야 하는 custom authentication은 현재 semantics에서 명시적 repository save evidence가 있고, stateless flow는 의도적으로 save하지 않습니다. old auto-save에 기대는 path와 new explicit path가 혼합되지 않습니다.",
    edgeCases: "saved request redirect, response commit, custom success handler, remember-me, switch user, test helper, mixed-version rolling deployment와 configuration flag override를 검사합니다.",
    failureModes: "migration 후 context를 holder에만 넣으면 current request는 성공하지만 redirect 다음 request는 401이 됩니다. 반대로 stateless API에서 무심코 session repository에 save하면 server state와 CSRF/logout threat model이 바뀝니다.",
    verification: "old/new supported artifact에서 동일 custom-login two-request corpus를 실행해 save count와 second request principal을 differential 비교합니다. framework-managed flow도 별도로 실행해 application이 중복 save하지 않는지 확인합니다.",
    operations: "explicit-save owner coverage와 second-request authentication synthetic probe를 release gate로 둡니다. migration canary에서 login-loop가 증가하면 save path·commit timing을 확인하고 이전 artifact로 rollback합니다.",
    concepts: [
      concept("SecurityContextPersistenceFilter", "과거 기본 흐름에서 context load와 request 종료 저장을 수행한 filter입니다.", ["Spring Security 5 설명과 연결됩니다.", "현재 구성은 runtime 확인이 필요합니다."]),
      concept("SecurityContextHolderFilter", "SecurityContext를 holder에 제공하지만 저장을 자동 수행하지 않는 filter입니다.", ["explicit save와 연결됩니다.", "repository owner를 명시합니다."]),
      concept("explicit save", "인증 상태를 다음 request에 유지하려는 code가 SecurityContextRepository.saveContext를 명시적으로 호출하는 계약입니다.", ["custom authentication에 중요합니다.", "stateless에서는 의도적으로 생략합니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-version-save", "v5·v6 persistence 의미 비교", "security03-version-save.mjs", "같은 holder set이 auto-save와 explicit-save 정책에서 다른 second-request 결과를 만드는 것을 실행합니다.", `function simulate(policy, applicationSaves) {
  let repository = false;
  const holder = true;
  if (policy === "V5_AUTO" && holder) repository = true;
  if (policy === "V6_EXPLICIT" && applicationSaves) repository = true;
  return repository ? "RESTORED" : "ANONYMOUS";
}
console.log("v5-set-only=" + simulate("V5_AUTO", false));
console.log("v6-set-only=" + simulate("V6_EXPLICIT", false));
console.log("v6-explicit=" + simulate("V6_EXPLICIT", true));
console.log("stateless-save=false");`, "v5-set-only=RESTORED\nv6-set-only=ANONYMOUS\nv6-explicit=RESTORED\nstateless-save=false", ["spring-session-management", "spring7-persistence", "security-context-holder-filter-api", "security-context-repository-api"]),
    ],
    expertNotes: ["version 숫자만 외우지 말고 runtime filter와 save owner를 readback합니다.", "framework-managed authentication filter가 save하는 흐름과 manual controller save 책임을 구분합니다."],
  }),
  appliedTopic({
    id: "session-lifecycle-fixation-cookie",
    title: "session 생성·id rotation·cookie와 invalidation lifecycle을 설계합니다",
    lead: "로그인 전후 같은 session id를 계속 쓰면 공격자가 미리 심은 id에 victim 인증을 결합하는 session fixation 위험이 생깁니다.",
    mechanism: "SessionAuthenticationStrategy는 successful authentication 시 session fixation protection, concurrent session control과 registration 같은 session 관련 처리를 수행합니다. container는 기존 session id 변경 또는 새 session 생성으로 인증 경계를 회전할 수 있고 cookie는 Secure·HttpOnly·SameSite와 scope를 가집니다.",
    workflow: "anonymous session optional creation→login success→id rotation→attributes migration policy→authenticated requests→expiry/logout invalidation을 상태 machine으로 작성합니다. old id rejection, cookie replacement와 distributed store key 변화를 실제 HTTP로 관찰합니다.",
    invariants: "로그인 성공 후 old unauthenticated session id로 protected context를 사용할 수 없고 새 id는 TLS에서만 전송됩니다. credential은 session에 저장되지 않고 불필요한 attributes와 fixation 공격자 값은 migration하지 않습니다.",
    edgeCases: "session 없이 login, existing cart/locale, multiple tabs, concurrent login POST, reverse proxy cookie rewrite, custom domain/path, cluster replication, session timeout과 clock skew를 검사합니다.",
    failureModes: "id rotation을 끄면 fixation이 가능하고, 전체 attribute를 무조건 migrate하면 공격자가 pre-auth session에 넣은 값이 authenticated state로 승격될 수 있습니다. Secure cookie 누락은 TLS 밖 전송 위험을 키웁니다.",
    verification: "attacker-known synthetic old id로 login한 뒤 response의 new cookie, old id rejection, selected attribute migration과 timeout/invalidation을 browser/container test합니다. cookie value는 로그에 남기지 않고 equality boolean만 기록합니다.",
    operations: "session created/rotated/expired/invalidated count와 fixation-strategy version을 aggregate로 관측합니다. cookie policy 변경은 browser/proxy matrix, canary와 rollback 시 old/new cookie compatibility를 포함합니다.",
    concepts: [
      concept("session fixation", "공격자가 알고 있는 session id를 victim이 인증 후에도 사용하게 해 authenticated session을 탈취하는 공격입니다.", ["로그인 성공 때 id를 회전합니다.", "old id를 거부합니다."]),
      concept("SessionAuthenticationStrategy", "인증 성공 시 fixation protection·concurrency·registration 같은 session 처리를 수행하는 전략입니다.", ["provider 검증과 별도입니다.", "순서와 failure를 검증합니다."]),
      concept("session cookie", "browser가 session id를 server에 전달하는 cookie입니다.", ["Secure·HttpOnly·SameSite·scope를 설정합니다.", "id를 telemetry에 기록하지 않습니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-session-rotation", "login 시 session id rotation", "security03-session-rotation.mjs", "인증 성공 전 old id를 폐기하고 허용된 attribute만 새 session으로 옮깁니다.", `const sessions = new Map([["old", { locale: "ko", untrusted: "drop" }]]);
function rotate(oldId, newId) {
  const old = sessions.get(oldId) || {};
  sessions.delete(oldId);
  sessions.set(newId, { locale: old.locale });
}
rotate("old", "new");
console.log("old-valid=" + sessions.has("old"));
console.log("new-valid=" + sessions.has("new"));
console.log("locale-migrated=" + (sessions.get("new").locale === "ko"));
console.log("untrusted-migrated=" + ("untrusted" in sessions.get("new")));`, "old-valid=false\nnew-valid=true\nlocale-migrated=true\nuntrusted-migrated=false", ["session-authentication-strategy-api", "spring-session-management", "owasp-session-management"]),
    ],
    expertNotes: ["실제 session id를 고정 문자열 예제처럼 다루지 않고 cryptographically strong container id를 사용합니다.", "attribute migration allow-list는 application별 threat model이 필요합니다."],
  }),
  appliedTopic({
    id: "request-cache-safe-redirect",
    title: "인증 전 request 저장과 성공 redirect를 안전한 local target으로 제한합니다",
    lead: "사용자를 원래 화면으로 돌려보내는 편의 기능은 저장할 request 범위와 redirect target을 검증하지 않으면 open redirect·민감 body 재전송 문제가 됩니다.",
    mechanism: "RequestCache는 인증이 필요한 request를 저장하고 success handler가 saved request를 사용할 수 있습니다. 보통 safe GET navigation만 저장하고 scheme-relative, absolute external URL, CRLF와 privileged method를 target으로 허용하지 않습니다.",
    workflow: "entry point 전 request capture, login, session rotation, target validation, consume-once redirect 순서를 정의합니다. public base URL과 proxy headers는 trusted configuration에서 만들고 client target parameter는 local path allow-list로 canonicalize합니다.",
    invariants: "redirect는 같은 application의 허용된 GET path로만 가고 credential POST·민감 body·authorization header를 저장하지 않습니다. saved request는 성공 또는 만료 뒤 한 번만 소비되고 다른 사용자/session에 공유되지 않습니다.",
    edgeCases: "double slash, encoded scheme separator, backslash, control character, host header poisoning, reverse proxy prefix, fragment, logout/login loop, multiple tabs와 expired saved request를 검사합니다.",
    failureModes: "returnUrl을 그대로 redirect하면 phishing open redirect가 되고 POST body를 replay하면 중복 결제·CSRF·secret leakage가 생깁니다. session rotation 때 cache ownership을 잃으면 정상 사용자는 엉뚱한 target으로 갑니다.",
    verification: "relative allowed path, absolute URL, scheme-relative, encoded/backslash, unsafe method와 stale target corpus를 실행합니다. actual response Location과 browser final origin, saved request consume count를 assertion합니다.",
    operations: "redirect accepted/rejected reason과 loop count를 target raw value 없이 집계합니다. proxy/base-url 변경 전에 safe-target corpus를 canary에서 실행하고 open redirect probe는 release blocker로 둡니다.",
    concepts: [
      concept("RequestCache", "인증 때문에 중단된 request를 저장해 성공 후 복원할 수 있게 하는 계약입니다.", ["저장 대상 최소화가 필요합니다.", "session owner와 연결합니다."]),
      concept("saved request", "entry point 전에 보존된 원래 navigation 정보입니다.", ["unsafe body를 보존하지 않습니다.", "single-use·expiry를 둡니다."]),
      concept("open redirect", "공격자가 지정한 외부 위치로 application이 사용자를 이동시키는 취약점입니다.", ["local allow-list로 막습니다.", "proxy header를 신뢰 경계로 다룹니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-safe-target", "saved request local redirect 검증", "security03-safe-target.mjs", "정상 local GET path만 허용하고 외부·scheme-relative·unsafe method를 거부합니다.", `const targets = [
  { name: "local", method: "GET", value: "/learn/security" },
  { name: "external", method: "GET", value: "https://evil.example" },
  { name: "scheme-relative", method: "GET", value: "//evil.example" },
  { name: "post", method: "POST", value: "/account/change" }
];
function safe(item) {
  return item.method === "GET" &&
    item.value.startsWith("/") &&
    !item.value.startsWith("//") &&
    !item.value.includes("\\\\");
}
for (const target of targets) console.log(target.name + "=" + (safe(target) ? "ALLOW" : "REJECT"));`, "local=ALLOW\nexternal=REJECT\nscheme-relative=REJECT\npost=REJECT", ["request-cache-api", "spring-form-login", "owasp-unvalidated-redirects"]),
    ],
    expertNotes: ["request cache를 끄는 stateless API와 browser navigation session을 분리합니다.", "host allow-list보다 local relative path 정책이 단순하고 안전한 경우가 많습니다."],
  }),
  appliedTopic({
    id: "logout-context-session",
    title: "logout에서 context·repository·session·cookie·remember-me를 함께 정리합니다",
    lead: "화면만 login 페이지로 이동하거나 browser state만 지우는 것은 server-side authenticated state를 무효화하지 못합니다.",
    mechanism: "Spring Security logout flow는 authentication과 SecurityContext를 비우고 repository에 empty context를 저장하거나 session을 invalidate하며 관련 cookie·remember-me state를 정리할 수 있습니다. browser credential이 자동 전송되는 logout POST는 CSRF 보호와 method contract를 가집니다.",
    workflow: "authenticated request→CSRF-validated logout→handler chain→context clear→repository save empty→session invalidate→cookie deletion→success response 순서를 정합니다. external token/revocation이 있다면 local logout과 결과 불명·retry를 별도 상태로 모델링합니다.",
    invariants: "logout 성공 뒤 같은 session cookie로 protected resource에 접근할 수 없고 pooled thread holder도 empty입니다. cookie 삭제는 생성 때와 같은 name/domain/path 속성을 사용하며 logout response는 secret과 user data를 cache하지 않습니다.",
    edgeCases: "multiple tabs, concurrent in-flight request, repeated logout, expired session, distributed store partition, remember-me, OAuth/OIDC provider logout, websocket와 browser back cache를 검사합니다.",
    failureModes: "SecurityContextHolder.clearContext만 호출하고 repository/session을 남기면 다음 request에서 context가 복원될 수 있습니다. GET logout을 허용하면 공격 site가 사용자를 강제 logout시키는 CSRF와 UX denial을 만들 수 있습니다.",
    verification: "logout 전/후 두 request, repeated logout idempotency, same cookie rejection, second node read와 cookie expiry를 실제 client로 검증합니다. raw session id는 출력하지 않고 validity boolean과 revocation version만 기록합니다.",
    operations: "logout start/success/partial/failure, session invalidation과 external revocation을 correlation합니다. partial failure는 bounded retry와 reconciliation queue를 쓰되 token 원문을 payload에 넣지 않습니다.",
    concepts: [
      concept("logout handler", "logout 과정에서 context, session, cookie 또는 token cleanup을 수행하는 단계입니다.", ["순서와 idempotency가 필요합니다.", "success response와 분리됩니다."]),
      concept("empty-context save", "repository가 다음 request에서 이전 Authentication을 복원하지 않도록 empty SecurityContext를 지속하는 동작입니다.", ["holder clear만으로 충분하지 않을 수 있습니다.", "session invalidation과 함께 검증합니다."]),
      concept("logout CSRF", "공격 site가 browser를 통해 사용자를 원치 않게 logout시키는 위협입니다.", ["unsafe POST와 token을 사용합니다.", "credential compromise와 다릅니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-logout", "logout cleanup 단계와 재사용 차단", "security03-logout.mjs", "holder, repository, session과 cookie가 모두 정리되어야 release gate를 통과합니다.", `const state = { holder: true, repository: true, session: true, cookie: true };
function logout(target) {
  target.holder = false;
  target.repository = false;
  target.session = false;
  target.cookie = false;
}
logout(state);
console.log("holder=" + state.holder);
console.log("repository=" + state.repository);
console.log("session=" + state.session);
console.log("cookie=" + state.cookie);
console.log("reusable=" + Object.values(state).some(Boolean));`, "holder=false\nrepository=false\nsession=false\ncookie=false\nreusable=false", ["spring-logout", "spring-session-management", "security-context-repository-api", "owasp-session-management", "spring-csrf"]),
    ],
    expertNotes: ["logout response 성공과 외부 revocation 완료를 동일 시점으로 가장하지 않습니다.", "browser cache와 service worker가 보호 화면을 다시 보여도 server authorization은 반드시 거부해야 합니다."],
  }),
  appliedTopic({
    id: "concurrent-distributed-session",
    title: "동시 session, 만료와 distributed repository consistency를 설계합니다",
    lead: "max sessions 숫자만 설정해도 login race, stale registry, node failure와 사용자에게 어떤 session이 만료되는지는 자동으로 해결되지 않습니다.",
    mechanism: "concurrent session control은 principal별 active session을 추적해 새 login을 막거나 기존 session을 expire하는 정책을 적용합니다. distributed deployment에서는 session store와 registry event consistency, principal equality와 cleanup이 실제 enforcement를 결정합니다.",
    workflow: "admission lock 또는 atomic register, active count, eviction policy, user notification, expired session handler와 cleanup을 상태 machine으로 만듭니다. node·region partition에서 fail-open/closed와 reconciliation owner를 정합니다.",
    invariants: "정책상 최대 active session 수를 race에서도 넘지 않고 expired/revoked session은 어떤 node에서도 protected action을 수행하지 못합니다. raw session id와 principal은 metric label·log에 남지 않습니다.",
    edgeCases: "동시 두 login, browser crash, TTL expiry, logout event loss, node restart, store partition, remember-me auto login, principal equals/hashCode 변화, admin revoke와 account disable을 검사합니다.",
    failureModes: "in-memory registry만 사용하면 다른 node session을 보지 못하고 max limit가 무력화됩니다. cleanup event를 놓치면 ghost session이 정상 login을 영구 차단하거나 stale active session을 허용합니다.",
    verification: "barrier로 동시 login을 실행해 atomic count를 검사하고 multi-node store fault, expiry, logout/revoke와 reconciliation을 테스트합니다. 최종 active set과 각 session의 protected request 결과를 함께 assertion합니다.",
    operations: "active/created/expired/revoked/reconciled session count와 store latency를 privacy-safe aggregate로 관측합니다. store outage mode에는 명시적 admission policy, 사용자 메시지, owner·expiry와 post-recovery scan이 필요합니다.",
    concepts: [
      concept("concurrent session control", "principal별 허용 active session 수와 초과 시 행동을 정하는 정책입니다.", ["race와 distributed store를 고려합니다.", "사용자 UX를 정의합니다."]),
      concept("session registry", "principal과 active/expired session 관계를 추적하는 component입니다.", ["store truth와 일치해야 합니다.", "cleanup·reconciliation이 필요합니다."]),
      concept("ghost session", "실제 사용 불가능하지만 registry에 active로 남거나 반대로 store에는 남고 registry에서 사라진 불일치입니다.", ["admission과 revocation을 깨뜨립니다.", "주기적으로 조정합니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-concurrent", "원자적 concurrent session admission", "security03-concurrent.mjs", "최대 두 session 정책에서 세 번째를 거부하고 revoke 후 다시 허용합니다.", `const active = new Set();
const maximum = 2;
function admit(id) {
  if (active.size >= maximum) return "REJECT";
  active.add(id);
  return "ALLOW";
}
console.log("first=" + admit("synthetic-1"));
console.log("second=" + admit("synthetic-2"));
console.log("third=" + admit("synthetic-3"));
active.delete("synthetic-1");
console.log("after-revoke=" + admit("synthetic-3"));
console.log("active=" + active.size);`, "first=ALLOW\nsecond=ALLOW\nthird=REJECT\nafter-revoke=ALLOW\nactive=2", ["spring-session-management", "session-authentication-strategy-api", "owasp-session-management"]),
    ],
    expertNotes: ["단일 Node Set 모델은 distributed atomicity를 증명하지 않습니다.", "maximum sessions는 보안과 사용자 기대·공유 기기·접근성 요구를 함께 검토합니다."],
  }),
  appliedTopic({
    id: "async-testing-observability-release",
    title: "session authentication을 async 격리·두 요청 test·관측·rollback으로 qualification합니다",
    lead: "로그인 POST 하나의 302만 검사하면 context save, id rotation, second request 복원, concurrent revoke와 thread cleanup을 놓칩니다.",
    mechanism: "검증은 pure state model, filter/provider integration, real container cookie jar, browser CSRF/redirect, multi-node session store, async executor와 production-like canary로 나뉩니다. provenance, filter/repository topology, cookie policy와 two-request evidence를 session manifest로 묶습니다.",
    workflow: "wrong password·missing CSRF·set-without-save·old id reuse·unsafe redirect·logout reuse·concurrent overflow·thread leak부터 실행하고 정상 login을 마지막에 확인합니다. current request와 second request 결과를 항상 한 test case로 연결합니다.",
    invariants: "성공 flow는 authenticated context를 의도한 repository에 저장하고 id를 회전하며 다음 request에서 복원합니다. 실패·logout·expired session·다른 worker에서는 context가 empty이고 credential/session id canary가 모든 exporter에서 0입니다.",
    edgeCases: "mixed Spring versions, rolling session serialization, response commit, async timeout, proxy cookie rewrite, browser cache, store failover, rollback artifact가 새 session data를 읽는 경우를 검사합니다.",
    failureModes: "MockMvc user helper는 실제 login filter·provider·repository를 우회할 수 있고 controller test의 principal mock은 context lifecycle을 증명하지 않습니다. session store happy path만 보면 node loss와 stale registry를 놓칩니다.",
    verification: "example stdout, targeted ESLint/TypeScript/content strict, all sourceRefs used, official URL live와 local line/byte/hash를 자동 검사합니다. actual supported Spring/browser/multi-node evidence는 synthetic Node model과 별도 보존합니다.",
    operations: "login→save→restore, rotation, logout/revoke, context leak, session-store latency와 canary를 release id로 correlation합니다. rollback trigger와 old/new serialization·cookie·repository compatibility를 rehearsal하고 불명 상태를 reconciliation합니다.",
    concepts: [
      concept("two-request proof", "첫 인증 request의 저장과 다음 request의 복원을 같은 fixture로 검증하는 증거입니다.", ["holder set만으로 대체할 수 없습니다.", "cookie jar를 포함합니다."]),
      concept("session manifest", "filter, repository, save owner, cookie, rotation, concurrency와 검증 결과를 release별로 기록한 artifact입니다.", ["비밀값을 포함하지 않습니다.", "rollback에 사용합니다."]),
      concept("context isolation probe", "서로 다른 request·worker·async task 사이 authentication leakage가 없는지 지속 확인하는 synthetic test입니다.", ["raw principal을 쓰지 않습니다.", "incident trigger가 됩니다."]),
    ],
    codeExamples: [
      nodeExample("sec03-release-gate", "session authentication release gate", "security03-release-gate.mjs", "second-request restore, rotation, logout, redirect, concurrency, context cleanup과 secret-zero가 모두 통과해야 승인합니다.", `const evidence = {
  secondRequestRestored: true,
  oldSessionRejected: true,
  logoutReuseRejected: true,
  unsafeRedirectsAccepted: 0,
  concurrentOverflow: 0,
  contextLeakCanaryHits: 0,
  secretCanaryHits: 0,
  rollbackCompatible: true
};
const approved = Object.entries(evidence).every(([key, value]) =>
  key.endsWith("Accepted") || key.endsWith("Overflow") || key.endsWith("Hits") ? value === 0 : value === true
);
console.log("release=" + (approved ? "APPROVED" : "BLOCKED"));
console.log("old-session-rejected=" + evidence.oldSessionRejected);
console.log("context-leaks=" + evidence.contextLeakCanaryHits);
console.log("secret-hits=" + evidence.secretCanaryHits);`, "release=APPROVED\nold-session-rejected=true\ncontext-leaks=0\nsecret-hits=0", ["spring-session-management", "spring7-persistence", "spring-form-login", "spring-logout", "security-context-api", "security-context-holder-api", "security-context-repository-api", "http-session-repository-api", "security-context-holder-filter-api", "username-password-filter-api", "session-authentication-strategy-api", "request-cache-api", "authentication-api", "dao-provider-api", "owasp-session-management", "owasp-unvalidated-redirects", "spring-csrf"]),
    ],
    expertNotes: ["content strict pass는 runtime session security qualification을 대체하지 않습니다.", "rollout 완료 뒤에도 synthetic two-request와 logout-reuse probe를 지속합니다."],
  }),
];

const sources: SessionSource[] = [
  { id: "local-security-current", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["stateless SecurityFilterChain and JWT filter placement snapshot"], evidence: "read-only: 106 lines, 6013 bytes, SHA-256 b1051723c4fee8fcbec587b0a1cfcfa7a9eb0c461ebe59602da980ef1d62ccd8; route/origin values were not copied." },
  { id: "local-jwt-current", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["request-local Authentication creation and SecurityContextHolder write snapshot"], evidence: "read-only: 94 lines, 4208 bytes, SHA-256 ea08d71d7a21293e92451b7867142ab1582b403664c4a26c3d47213fe9e432b2; token and identity values were not copied." },
  { id: "local-members-controller", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/controller/MembersController.java", usedFor: ["SecurityContextHolder Authentication read snapshot"], evidence: "read-only: 514 lines, 21038 bytes, SHA-256 72f5f59fcf79c94cda20546fa25634ae2c8c8f47c43953b45263e07cf3bb246d; endpoint and identity values were not copied." },
  { id: "local-security-mp1", repository: "springboot/MyProject01", path: "src/main/java/com/study/myproject01/config/SecurityConfig.java", usedFor: ["earlier stateless configuration comparison"], evidence: "read-only: 95 lines, 5358 bytes, SHA-256 eb9f60c8463b53f8c26a581cbb9deebc42d78835eb82a56e23212c4d91817f65." },
  { id: "local-build-current", repository: "2026-myproject04-cicd", path: "build.gradle", usedFor: ["Spring Boot plugin 4.0.6 and security starter declaration snapshot"], evidence: "read-only: 56 lines, 2047 bytes, SHA-256 cbf6cb4a2bde7b7c072c924f3c03e009ef7eee737314b1f4edb82fb77eb5c0a5; resolved Security patch was not inferred." },
  { id: "spring-session-management", repository: "Spring Security Reference", path: "Session Management", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html", usedFor: ["session persistence, v5/v6 explicit save, fixation and concurrency"], evidence: "Spring Security current official reference." },
  { id: "spring7-persistence", repository: "Spring Security 7.0 Reference", path: "SecurityContext Persistence", publicUrl: "https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/persistence.html", usedFor: ["versioned current-generation repository and explicit persistence explanation"], evidence: "Spring Security official versioned reference." },
  { id: "spring-form-login", repository: "Spring Security Reference", path: "Form Login", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/form.html", usedFor: ["username/password form flow and handlers"], evidence: "Spring Security current official reference." },
  { id: "spring-authentication-architecture", repository: "Spring Security Reference", path: "Authentication Architecture", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", usedFor: ["AuthenticationManager, ProviderManager and context flow"], evidence: "Spring Security current official reference." },
  { id: "spring-logout", repository: "Spring Security Reference", path: "Logout", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/logout.html", usedFor: ["logout handler chain, context and session cleanup"], evidence: "Spring Security current official reference." },
  { id: "spring-csrf", repository: "Spring Security Reference", path: "CSRF", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html", usedFor: ["login and logout CSRF protection"], evidence: "Spring Security current official reference." },
  { id: "authentication-api", repository: "Spring Security Javadoc", path: "Authentication", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/core/Authentication.html", usedFor: ["unauthenticated and authenticated token contract"], evidence: "Spring Security current official Javadoc." },
  { id: "security-context-api", repository: "Spring Security Javadoc", path: "SecurityContext", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/core/context/SecurityContext.html", usedFor: ["Authentication container contract"], evidence: "Spring Security current official Javadoc." },
  { id: "security-context-holder-api", repository: "Spring Security Javadoc", path: "SecurityContextHolder", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/core/context/SecurityContextHolder.html", usedFor: ["context strategy access and cleanup"], evidence: "Spring Security current official Javadoc." },
  { id: "security-context-repository-api", repository: "Spring Security Javadoc", path: "SecurityContextRepository", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/context/SecurityContextRepository.html", usedFor: ["load and save context contract"], evidence: "Spring Security current official Javadoc." },
  { id: "http-session-repository-api", repository: "Spring Security Javadoc", path: "HttpSessionSecurityContextRepository", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/context/HttpSessionSecurityContextRepository.html", usedFor: ["HTTP session-backed context persistence"], evidence: "Spring Security current official Javadoc." },
  { id: "security-context-holder-filter-api", repository: "Spring Security Javadoc", path: "SecurityContextHolderFilter", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/context/SecurityContextHolderFilter.html", usedFor: ["explicit-save generation filter semantics"], evidence: "Spring Security current official Javadoc." },
  { id: "username-password-filter-api", repository: "Spring Security Javadoc", path: "UsernamePasswordAuthenticationFilter", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/authentication/UsernamePasswordAuthenticationFilter.html", usedFor: ["form credential filter API contract"], evidence: "Spring Security current official Javadoc." },
  { id: "session-authentication-strategy-api", repository: "Spring Security Javadoc", path: "SessionAuthenticationStrategy", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/authentication/session/SessionAuthenticationStrategy.html", usedFor: ["session fixation and successful-authentication session processing"], evidence: "Spring Security current official Javadoc." },
  { id: "request-cache-api", repository: "Spring Security Javadoc", path: "RequestCache", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/savedrequest/RequestCache.html", usedFor: ["saved request load, save and removal contract"], evidence: "Spring Security current official Javadoc." },
  { id: "dao-provider-api", repository: "Spring Security Javadoc", path: "DaoAuthenticationProvider", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/authentication/dao/DaoAuthenticationProvider.html", usedFor: ["username/password provider transition"], evidence: "Spring Security current official Javadoc." },
  { id: "owasp-session-management", repository: "OWASP Cheat Sheet Series", path: "Session Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session id, cookie, fixation, expiry and logout defenses"], evidence: "OWASP primary defensive guidance." },
  { id: "owasp-unvalidated-redirects", repository: "OWASP Cheat Sheet Series", path: "Unvalidated Redirects and Forwards Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", usedFor: ["safe saved-request redirect validation"], evidence: "OWASP primary defensive guidance." },
];

const session = createExpertSession({
    inventoryId: "sec-04-authentication-authorization",
  slug: "security-03-session-login-authentication",
  courseId: "devops",
  moduleId: "security-filter-authentication",
  order: 3,
  title: "session login·Authentication과 SecurityContext",
  subtitle: "로컬 stateless SecurityContext 사용과 session-login gap을 정직하게 구분하고, form login부터 explicit context save, fixation 방어, safe redirect, logout, concurrency와 async 격리까지 두 요청 evidence로 증명합니다.",
  level: "전문가",
  estimatedMinutes: 1200,
  coreQuestion: "username/password 검증 결과를 한 request의 Authentication에서 안전한 session state로 저장·복원하고, 실패·logout·동시성·async·업그레이드에서도 다른 사용자에게 새거나 사라지지 않음을 어떻게 증명할까요?",
  summary: "로컬 SecurityConfig·JWT filter·MembersController를 read-only로 감사해 stateless request마다 SecurityContextHolder를 write/read하는 범위만 local evidence로 사용했습니다. 조사 snapshot에는 form login과 session repository 구현이 없음을 명시하고, 공식 current/versioned 문서로 form POST, trusted Authentication transition, holder cleanup, repository persistence, Spring Security 5 자동 저장과 6/current explicit save 차이, fixation/cookie, request cache, logout, concurrent distributed sessions와 two-request release governance를 상세히 보완합니다.",
  objectives: ["로컬 stateless context 증거와 session login 부재를 구분한다.", "form page·credential POST·success/failure handler를 분리한다.", "unauthenticated에서 trusted Authentication 전이를 증명한다.", "SecurityContextHolder strategy와 request cleanup을 검증한다.", "SecurityContextRepository load/save와 holder set을 구분한다.", "Spring Security 5와 6/current persistence 차이를 설명한다.", "session fixation·cookie·attribute migration을 방어한다.", "saved request와 redirect target을 안전하게 제한한다.", "logout에서 context·repository·session·cookie를 정리한다.", "동시·분산 session을 원자적으로 제한하고 조정한다.", "async 격리와 two-request evidence로 release를 qualification한다."],
  prerequisites: [{ title: "UserDetails·PasswordEncoder와 credential lifecycle", reason: "session에 저장할 Authentication이 어떤 lookup·provider·credential 검증을 거쳐 신뢰되는지 먼저 이해해야 합니다.", sessionSlug: "security-02-userdetails-password-encoder" }],
  keywords: ["form login", "Authentication", "SecurityContext", "SecurityContextHolder", "SecurityContextRepository", "HttpSessionSecurityContextRepository", "explicit save", "session fixation", "SessionAuthenticationStrategy", "RequestCache", "logout", "concurrent sessions", "context isolation"],
  topics,
  lab: {
    title: "Form login과 session persistence를 두 요청·회전·logout·동시성 corpus로 증명하기",
    scenario: "synthetic browser application에 username/password form login을 추가하고 custom authentication path도 current explicit-save 계약으로 다음 request까지 안전하게 유지해야 합니다.",
    setup: ["실제 identity·password·session id 대신 synthetic fixtures와 cookie jar를 사용합니다.", "지원 Spring Security version의 disposable servlet project를 준비합니다.", "local stateless source fingerprint와 official session implementation을 별도 provenance로 보존합니다.", "login·save·rotation·redirect·logout·concurrency·async matrix를 작성합니다."],
    steps: ["GET page와 CSRF-protected credential POST contract를 구현합니다.", "provider trusted transition과 credential erasure를 검증합니다.", "holder set/read/finally clear를 worker reuse에서 검사합니다.", "repository explicit save와 second-request restoration을 확인합니다.", "v5/v6/current migration corpus에서 save owner를 비교합니다.", "로그인 후 session id를 회전하고 old id와 untrusted attribute를 거부합니다.", "saved request를 same-application safe GET으로 제한합니다.", "logout 뒤 same cookie 재사용과 context 복원을 거부합니다.", "concurrent login과 distributed store failure를 fault test합니다.", "manifest, browser canary와 rollback compatibility를 승인합니다."],
    expectedResult: ["성공 login은 새 session id와 repository context로 다음 request에서 복원됩니다.", "실패·logout·old id·다른 worker에서는 context가 empty입니다.", "unsafe redirect와 CSRF 없는 login/logout이 거부됩니다.", "동시 session 수와 revoke가 모든 node에서 일관됩니다.", "credential·identity·session id canary가 모든 artifact와 telemetry에서 0건입니다."],
    cleanup: ["synthetic users, sessions, cookies, saved requests와 registry records를 run id로 제거합니다.", "browser cache·service worker·cookie jar를 비웁니다.", "temporary debug filters, session store와 async executor를 종료합니다.", "local source files와 provenance hashes는 변경하지 않습니다."],
    extensions: ["remember-me와 MFA step-up context freshness를 추가합니다.", "OIDC login과 local session/logout federation을 비교합니다.", "Spring Session backed multi-region chaos test를 확장합니다.", "reactive SecurityContext와 servlet holder 차이를 별도 세션으로 모델링합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열 개 Node 예제를 실행하고 login→Authentication→context→repository→session→logout 흐름을 두 요청 표로 작성하세요.", requirements: ["stdout을 완전히 대조합니다.", "local observed와 official-only를 구분합니다.", "holder set과 repository save를 구분합니다.", "v5/v6 차이를 설명합니다.", "old session id를 거부합니다.", "unsafe redirect를 거부합니다.", "logout cleanup을 모두 확인합니다.", "concurrent limit와 secret-zero를 설명합니다."], hints: ["현재 request success와 다음 request persistence를 반드시 다른 열로 두세요."], expectedOutcome: "session login을 저장·복원·폐기 상태 machine으로 설명합니다.", solutionOutline: ["submit→authenticate→set→save→rotate→restore→authorize→logout/expire 순서입니다."] },
    { difficulty: "응용", prompt: "실제 Spring Security disposable project에서 form login과 custom explicit-save login을 함께 qualification하세요.", requirements: ["resolved version/filter list를 기록합니다.", "wrong/CSRF failure를 검사합니다.", "two-request cookie jar test를 둡니다.", "session fixation rotation을 확인합니다.", "safe saved-request를 구현합니다.", "logout reuse를 거부합니다.", "multi-node concurrency를 fault test합니다.", "context/session secret canary 0을 확인합니다."], hints: ["framework-managed form login과 custom controller의 save owner를 구분하세요."], expectedOutcome: "업그레이드·실패·복구까지 검증된 session authentication artifact가 완성됩니다.", solutionOutline: ["provenance→flow→persistence→rotation→redirect→logout→concurrency→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 servlet session authentication 표준을 작성하세요.", requirements: ["version/save-owner 규칙을 둡니다.", "Authentication trusted transition을 정의합니다.", "holder strategy·async cleanup을 정의합니다.", "repository/session/cookie 정책을 둡니다.", "fixation·saved request 방어를 둡니다.", "logout/revocation을 정의합니다.", "distributed concurrency와 reconciliation을 둡니다.", "two-request canary·rollback을 포함합니다."], hints: ["로그인 성공 화면보다 old id·second request·logout reuse에서 설계를 시작하세요."], expectedOutcome: "서비스마다 반복 가능한 session login governance가 완성됩니다.", solutionOutline: ["authenticate→persist→isolate→expire→observe→recover 순서입니다."] },
  ],
  nextSessions: ["security-04-request-method-authorization"],
  sources,
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: ["선택한 local source는 JWT request filter의 SecurityContextHolder write, controller의 Authentication read와 stateless session policy를 보여 줍니다.", "조사 snapshot에서 formLogin, HttpSessionSecurityContextRepository, SecurityContextRepository, SessionAuthenticationStrategy와 session success handler 구현은 확인하지 못했습니다.", "local build declaration만으로 exact resolved Spring Security patch를 추론하지 않았고 v5/v6/current semantic은 official docs로 분리했습니다.", "실제 token, identity, endpoint, origin, cookie와 session id는 공개 자료에 복사하지 않았습니다.", "Node models는 actual servlet filter, browser cookie, Spring repository와 distributed session consistency를 대체하지 않습니다."],
  },
});

export default session;
