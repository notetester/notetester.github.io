import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefs = [
  "local-app02-auth-store", "local-app02-login", "local-app02-package",
  "local-app03-http", "local-app03-auth-api", "local-app03-auth-store",
  "local-app03-login", "local-app03-package", "local-members-controller",
];

const officialRefs = [
  "react-external-store", "react-effects", "axios-interceptors", "zustand-persist",
  "fetch-standard", "html-webstorage", "html-broadcast-channel", "rfc9700",
  "rfc8725", "rfc7519", "rfc6750", "rfc6265", "rfc9110", "rfc9457",
  "owasp-html5", "owasp-session", "owasp-xss", "owasp-csrf", "owasp-logging",
  "owasp-rest", "w3c-csp3",
];

const topics = [
  appliedTopic({
    id: "sanitized-client-flow-audit", title: "두 React auth snapshot을 credential data-flow와 trust-boundary evidence로 감사합니다",
    lead: "store나 interceptor 파일이 있다는 사실을 안전한 인증 client의 증거로 과장하지 않고 credential이 발급되어 browser에 저장되고 header/body/cookie로 전송되며 갱신·폐기되는 모든 source와 sink를 값 없이 복원합니다.",
    mechanism: "초기 snapshot은 persisted Zustand store에 표시용 사용자와 로그인 boolean을 두며 실제 server credential이 없습니다. 다음 snapshot은 environment-based Axios instance, credentialed requests, browser-readable access/rotation credential bundle, request header injection, 401 response refresh single-flight, original-request replay와 store logout을 연결합니다. server snapshot은 refresh lookup·JWT validation·delete-then-save rotation과 logout deletion을 보여 주지만 안전한 cookie 또는 reuse-family, transactional rotation이 이미 구현됐다고 증명하지 않습니다.",
    workflow: "exact read-only fingerprints→credential 종류/issuer/verifier→JS·storage·cookie·header·body·log sinks→request/refresh/logout sequences→failure/concurrency boundaries→observed control/gap→current target contract 순서로 sanitized graph를 작성합니다.",
    invariants: "실제 storage key, route, member fields, provider, origin/domain, header/token/secret 값과 user data를 공개 content·example·trace에 복사하지 않고 source observation과 권장 target을 분리합니다.",
    edgeCases: "empty/corrupt storage, multiple app versions, duplicate interceptor registration, network loss, expired/invalid credential, concurrent 401, tab close, bfcache, server rotation race와 logout 중 refresh를 inventory합니다.",
    failureModes: "localStorage에 JSON이 있고 refresh가 한 번 성공했다는 이유로 production-ready라 하면 XSS theft, CSRF model, failed-waiter hang, unsafe replay, stale-tab resurrection과 secret logging을 놓칩니다.",
    verification: "local fingerprints, static source/sink counts, runtime synthetic credential canaries, network/log/storage captures, concurrency schedule와 original repositories unchanged를 확인합니다.",
    operations: "client version, auth state, credential age bucket, refresh outcome/reason, queue size와 correlation ID만 관찰하고 raw credential·identity·URL·payload는 금지합니다.",
    concepts: [
      c("credential data-flow", "credential이 issue·store·read·attach·validate·rotate·revoke되는 source와 sink의 연결입니다.", ["값이 아니라 경계를 추적합니다.", "log/trace도 sink입니다."]),
      c("trust boundary", "browser JavaScript, browser-managed cookie, network와 server verifier처럼 재검증이 필요한 신뢰 경계입니다.", ["storage 위치마다 위협이 다릅니다.", "client state는 server authority가 아닙니다."]),
      c("observed versus target", "로컬 코드에서 확인한 사실과 학습 세션이 제안하는 production contract를 분리한 표기입니다.", ["과장을 막습니다.", "migration backlog가 됩니다."]),
    ],
    codeExamples: [node("security12-source-audit", "redacted auth-client capability audit", "Security12SourceAudit.mjs", "관찰된 client/server capability와 gap을 실제 값 없이 출력합니다.", String.raw`const observed = {
  browserReadableCredentialBundle: true,
  requestInterceptor: true,
  responseInterceptor: true,
  singleFlightFlagAndQueue: true,
  retryMarker: true,
  substringRouteExclusion: true,
  originalRequestReplay: true,
  failedWaitersExplicitlyRejected: false,
  serverRotationAndLogoutDelete: true,
  rawCredentialLoggingRisk: true,
};
for (const key of Object.keys(observed).sort()) console.log(key + "=" + observed[key]);
console.log("actual-values-copied=false");`, "browserReadableCredentialBundle=true\nfailedWaitersExplicitlyRejected=false\noriginalRequestReplay=true\nrawCredentialLoggingRisk=true\nrequestInterceptor=true\nresponseInterceptor=true\nretryMarker=true\nserverRotationAndLogoutDelete=true\nsingleFlightFlagAndQueue=true\nsubstringRouteExclusion=true\nactual-values-copied=false", localRefs.concat(["owasp-html5", "owasp-logging", "rfc9700"]))],
  }),
  appliedTopic({
    id: "credential-storage-threat-model", title: "memory·Web Storage·HttpOnly cookie를 XSS·CSRF·reload·multi-tab tradeoff로 선택합니다",
    lead: "token은 localStorage가 편하다 또는 cookie가 무조건 안전하다는 단일 답 대신 access/refresh credential의 가치·수명·접근 주체·자동 전송과 공격자가 얻는 능력을 endpoint별로 비교합니다.",
    mechanism: "memory access credential은 reload와 tab마다 사라져 theft persistence를 줄이지만 bootstrap/refresh와 multi-tab convergence가 필요합니다. localStorage/sessionStorage는 JavaScript와 같은 origin의 XSS가 읽거나 바꿀 수 있고 localStorage는 browser restart 뒤에도 남습니다. HttpOnly cookie는 JavaScript read를 막지만 browser가 조건에 따라 자동 첨부하므로 SameSite, CSRF token, Origin/Fetch Metadata와 server-side session/rotation controls가 필요하며 active XSS가 사용자의 browser로 action을 수행하는 것까지 막지는 않습니다.",
    workflow: "credential별 confidentiality·replay value·lifetime·scope·automatic attachment·reload/offline UX를 표로 만들고 access는 short-lived memory, rotation credential은 Secure·HttpOnly·narrow cookie 같은 target을 검토하며 모든 자동-credential mutation에 CSRF policy를 설계합니다.",
    invariants: "browser storage encryption key를 같은 JavaScript bundle에 두고 confidentiality라고 주장하지 않고, UI 표시 state와 credential을 분리하며 refresh credential을 analytics, Redux/Zustand devtools, error object와 URL에 넣지 않습니다.",
    edgeCases: "reload, crash restore, shared computer, browser extension, subdomain compromise, third-party script, same-site cross-origin, cookie partitioning, private mode/storage denial과 server-rendered bootstrap을 포함합니다.",
    failureModes: "HttpOnly만 추가하면 CSRF와 session fixation/rotation을 놓치고, sessionStorage를 쓰면 XSS가 해결된다고 믿으면 같은 tab의 script theft를 놓치며, localStorage를 clear하는 것만으로 server credential은 폐기되지 않습니다.",
    verification: "XSS canary read/action tests, cross-site simple request와 CSRF state readback, reload/tab/browser restart, cookie attributes/scope, memory dump/log/trace scan와 server revoke를 검증합니다.",
    operations: "storage mode, credential age/rotation, CSRF deny와 logout/revoke latency를 집계하되 cookie/header/storage contents는 절대 수집하지 않습니다.",
    concepts: [
      c("JavaScript-readable storage", "same-origin script가 값을 읽고 수정할 수 있는 memory 또는 Web Storage 영역입니다.", ["XSS threat를 받습니다.", "persist 기간은 서로 다릅니다."]),
      c("automatic credential", "browser가 request 조건에 따라 application JavaScript가 직접 header를 만들지 않아도 첨부하는 credential입니다.", ["cookie가 대표적입니다.", "CSRF model이 필요합니다."]),
      c("credential split", "짧은 access capability와 더 강한 rotation capability를 서로 다른 수명·저장·전송 policy로 분리하는 설계입니다.", ["blast radius를 줄입니다.", "server rotation이 필요합니다."]),
    ],
    codeExamples: [node("security12-storage-decision", "credential storage threat decision matrix", "Security12StorageDecision.mjs", "각 storage mode의 JS read, persistence, automatic-send와 요구 controls를 비교합니다.", String.raw`const modes = [
  { name: "memory", jsReadable: true, persistent: false, automaticSend: false, controls: "xss+bootstrap" },
  { name: "web-storage", jsReadable: true, persistent: true, automaticSend: false, controls: "xss+short-life" },
  { name: "httponly-cookie", jsReadable: false, persistent: true, automaticSend: true, controls: "csrf+rotation" },
];
for (const x of modes) console.log(x.name + "|js=" + x.jsReadable + "|persist=" + x.persistent + "|auto=" + x.automaticSend + "|controls=" + x.controls);
console.log("universally-safe-mode=none");`, "memory|js=true|persist=false|auto=false|controls=xss+bootstrap\nweb-storage|js=true|persist=true|auto=false|controls=xss+short-life\nhttponly-cookie|js=false|persist=true|auto=true|controls=csrf+rotation\nuniversally-safe-mode=none", ["html-webstorage", "rfc6265", "owasp-html5", "owasp-session", "owasp-xss", "owasp-csrf"])],
  }),
  appliedTopic({
    id: "auth-state-machine-store", title: "credential이 아닌 auth lifecycle을 React/Zustand state machine으로 표현합니다",
    lead: "isLoggedIn boolean과 persisted user object가 server truth를 대신하지 않게 unknown·checking·authenticated·refreshing·anonymous·expired 상태와 auth epoch를 명시합니다.",
    mechanism: "React render는 store snapshot을 읽고 event는 reducer/action을 통해 transition합니다. browser API나 external store 구독은 useSyncExternalStore contract처럼 stable subscribe/getSnapshot을 제공하며 effect는 server/session bootstrap 같은 외부 동기화에만 사용합니다. UI store에는 최소 profile projection, status, epoch와 last-safe-reason만 두고 access/rotation credential은 component state/devtools/persist 대상에서 제외합니다.",
    workflow: "cold start→server session probe 또는 bounded refresh→authenticated/anonymous, request expiry→single-flight refreshing→success epoch advance 또는 terminal anonymous, logout→epoch advance·abort·clear UI 순서의 transition table을 작성합니다.",
    invariants: "authenticated는 server-confirmed evidence 뒤에만 설정하고 late async result는 captured epoch가 현재와 같을 때만 적용하며 storage event나 BroadcastChannel message 자체를 authentication evidence로 신뢰하지 않습니다.",
    edgeCases: "StrictMode development remount, duplicated bootstrap, SSR/hydration, offline unknown state, profile endpoint 403/404, identity switch, logout during refresh와 stale closure를 포함합니다.",
    failureModes: "persist middleware로 entire auth store를 serialize하면 credential/profile drift와 stale login flash가 생기고 boolean toggle만 쓰면 checking/expired/offline/revoked를 구분할 수 없습니다.",
    verification: "pure transition table, impossible transition/property tests, captured epoch race, reload/SSR snapshot consistency, external subscription cleanup와 secret serialization snapshot을 검사합니다.",
    operations: "state/transition/reason/epoch monotonicity와 duration만 관찰하고 profile·credential·storage payload는 기록하지 않습니다.",
    concepts: [
      c("auth epoch", "logout, identity change 또는 credential family 교체 때 증가하는 local session generation입니다.", ["late result를 무효화합니다.", "tab event ordering에 씁니다."]),
      c("unknown auth state", "client가 아직 server session truth를 확인하지 못한 상태입니다.", ["anonymous와 다릅니다.", "protected content를 낙관 표시하지 않습니다."]),
      c("external-store snapshot", "React가 일관되게 읽고 변경을 구독할 수 있는 immutable 또는 cached state view입니다.", ["stable subscribe가 필요합니다.", "credential을 포함하지 않습니다."]),
    ],
    codeExamples: [node("security12-auth-machine", "epoch-guarded auth state machine", "Security12AuthMachine.mjs", "logout 뒤 늦은 refresh 성공이 session을 되살리지 못하는 transition을 실행합니다.", String.raw`let state = { status: "unknown", epoch: 4 };
function apply(event) {
  if (event.capturedEpoch !== undefined && event.capturedEpoch !== state.epoch) return "ignored-stale";
  if (event.type === "BOOT_OK") state = { status: "authenticated", epoch: state.epoch };
  if (event.type === "EXPIRED") state = { status: "refreshing", epoch: state.epoch };
  if (event.type === "LOGOUT") state = { status: "anonymous", epoch: state.epoch + 1 };
  if (event.type === "REFRESH_OK") state = { status: "authenticated", epoch: state.epoch };
  return state.status + "@" + state.epoch;
}
console.log(apply({ type: "BOOT_OK" }));
console.log(apply({ type: "EXPIRED" }));
const captured = state.epoch;
console.log(apply({ type: "LOGOUT" }));
console.log(apply({ type: "REFRESH_OK", capturedEpoch: captured }));
console.log(state.status + "@" + state.epoch);`, "authenticated@4\nrefreshing@4\nanonymous@5\nignored-stale\nanonymous@5", ["local-app02-auth-store", "local-app03-auth-store", "local-app03-login", "react-external-store", "react-effects", "zustand-persist"])],
  }),
  appliedTopic({
    id: "request-interceptor-contract", title: "요청 interceptor를 explicit auth policy·AbortSignal·instance lifecycle로 제한합니다",
    lead: "모든 request에서 storage JSON을 읽고 URL substring으로 공개 경로를 제외하는 방식 대신 call site가 필요한 credential mode와 retry/idempotency policy를 명시하고 transport layer가 기계적으로 집행하게 합니다.",
    mechanism: "Axios interceptor는 instance의 request config를 변환하므로 registration/ejection lifecycle과 ordering이 중요합니다. auth-required, anonymous-only, cookie-session 같은 metadata를 request에 명시하고 credential provider에서 current in-memory access capability를 읽습니다. Fetch/Axios abort signal, content type/body ownership과 correlation을 보존하며 dedicated refresh client는 response interceptor recursion에서 분리합니다.",
    workflow: "한 production instance를 module scope에서 만들고 interceptor ID를 관리하며 request policy schema→credential attach→safe headers→abort/deadline→request dispatch 순서를 고정합니다. URL allow/deny는 parsed origin/path와 route registry로 검증하고 caller-supplied absolute URL을 거부합니다.",
    invariants: "credential을 public/cross-origin request에 붙이지 않고 config/log/error serialization에 raw header를 남기지 않으며 duplicate registration과 mutable shared defaults가 없고 caller AbortSignal을 덮지 않습니다.",
    edgeCases: "absolute URL, redirect, retry clone, FormData, streaming body, SSR without window, tests with multiple module instances, interceptor hot reload/ejection과 clock deadline을 포함합니다.",
    failureModes: "config.url.includes로 제외하면 비슷한 path나 query에 오판하고, component render/effect에서 interceptor를 반복 등록하면 request마다 header mutation과 refresh가 중복되며, global axios defaults는 unrelated origin에 credential을 보낼 수 있습니다.",
    verification: "origin/path property corpus, interceptor count, required/optional/none matrix, abort before/after dispatch, redacted config snapshot, cross-origin deny와 duplicate registration test를 실행합니다.",
    operations: "request class, credential attached boolean, abort/deadline/outcome과 interceptor revision만 기록하고 raw URL/query/header/body는 제외합니다.",
    concepts: [
      c("request auth policy", "request call site가 credential 필요 여부와 replay/idempotency 제약을 선언하는 typed metadata입니다.", ["URL substring보다 명확합니다.", "test matrix가 됩니다."]),
      c("dedicated refresh client", "일반 response interceptor를 거치지 않고 rotation endpoint만 호출하는 최소 HTTP instance입니다.", ["recursion을 막습니다.", "cookie/header policy를 분리합니다."]),
      c("interceptor lifecycle", "interceptor의 등록 순서, 단일성, ejection과 test/hot-reload cleanup 계약입니다.", ["중복 side effect를 막습니다.", "instance 경계가 중요합니다."]),
    ],
    codeExamples: [node("security12-request-policy", "explicit request credential policy", "Security12RequestPolicy.mjs", "synthetic request metadata와 origin classification으로 header attachment를 결정합니다.", String.raw`const ownOrigin = "https://app.invalid";
const requests = [
  { name: "public", url: "https://app.invalid/public", auth: "none" },
  { name: "protected", url: "https://app.invalid/private", auth: "required" },
  { name: "external", url: "https://outside.invalid/data", auth: "required" },
];
for (const req of requests) {
  const sameOrigin = new URL(req.url).origin === ownOrigin;
  const attach = sameOrigin && req.auth === "required";
  const decision = req.auth === "required" && !sameOrigin ? "block-origin" : attach ? "attach" : "omit";
  console.log(req.name + "=" + decision);
}
console.log("raw-credential-output=false");`, "public=omit\nprotected=attach\nexternal=block-origin\nraw-credential-output=false", ["local-app03-http", "local-app03-auth-api", "axios-interceptors", "fetch-standard", "owasp-html5", "owasp-rest"])],
  }),
  appliedTopic({
    id: "response-failure-classification", title: "401·403·network·expiry를 stable server signal로 분류하고 refresh 여부를 제한합니다",
    lead: "모든 401을 만료로 간주해 refresh하면 invalid/revoked/missing credential, account state, proxy failure와 refresh endpoint failure가 같은 loop로 합쳐지므로 status·challenge·problem type·request policy를 함께 판정합니다.",
    mechanism: "HTTP 401은 authentication challenge가 필요한 상태, 403은 credentials가 있어도 권한이 거부된 상태입니다. server는 RFC 9457 problem type/code와 적절한 challenge를 제공하고 client는 known-expired signal이며 refresh-eligible request일 때만 한 번 회복합니다. offline/timeout/5xx는 credential refresh로 치료하지 않고 bounded retry/degraded UX로 분기합니다.",
    workflow: "transport error→response presence→status→stable problem code/challenge→request auth policy→already retried/epoch→refresh|login|forbidden|offline|retry-later|fail-closed action 순서의 pure classifier를 구현합니다.",
    invariants: "403에서 refresh하지 않고 missing/invalid/revoked를 무한 회복하지 않으며 refresh call 자체, logout와 non-replayable mutation은 classifier가 자동 재실행하지 않습니다.",
    edgeCases: "proxy가 body를 바꾼 401, invalid JSON, captive portal, clock skew, account disabled, token audience mismatch, service outage, aborted request와 already committed mutation을 포함합니다.",
    failureModes: "status 하나만 보면 세부 원인을 잃고 server message 문자열을 parsing하면 locale/change에 깨지며 catch에서 강제 navigation하면 unsaved work와 accessibility announcement를 잃습니다.",
    verification: "status/problem/challenge corruption corpus, each action count, no-refresh cases, terminal state/focus/status UI, server contract tests와 production telemetry reason mapping을 검증합니다.",
    operations: "status, stable reason, request class, recovery action/outcome와 epoch만 낮은 cardinality로 기록하고 response body·stack·credential은 redaction합니다.",
    concepts: [
      c("challenge", "resource server가 401 response에서 필요한 authentication scheme과 failure 정보를 표현하는 HTTP metadata입니다.", ["status와 함께 봅니다.", "민감 detail은 제한합니다."]),
      c("refresh eligibility", "request와 failure가 credential rotation으로 안전하게 회복 가능한지를 판정하는 조건입니다.", ["known expiry만 허용합니다.", "replayability도 포함합니다."]),
      c("terminal auth failure", "자동 회복을 중단하고 local state를 clear한 뒤 명시적 재인증을 요구해야 하는 결과입니다.", ["revoked/reuse가 대표적입니다.", "loop를 막습니다."]),
    ],
    codeExamples: [node("security12-failure-classifier", "bounded authentication failure classifier", "Security12FailureClassifier.mjs", "synthetic response cases를 refresh, login, forbidden, offline과 retry-later로 분류합니다.", String.raw`function classify(x) {
  if (!x.hasResponse) return x.aborted ? "stop" : "offline";
  if (x.status === 403) return "forbidden";
  if (x.status >= 500) return "retry-later";
  if (x.status !== 401) return "fail";
  if (x.code === "credential_expired" && x.refreshEligible && !x.retried) return "refresh-once";
  return "login";
}
const cases = [
  { hasResponse: true, status: 401, code: "credential_expired", refreshEligible: true, retried: false },
  { hasResponse: true, status: 401, code: "credential_invalid", refreshEligible: true, retried: false },
  { hasResponse: true, status: 403 },
  { hasResponse: false, aborted: false },
  { hasResponse: true, status: 503 },
];
for (const x of cases) console.log(classify(x));`, "refresh-once\nlogin\nforbidden\noffline\nretry-later", ["local-app03-auth-api", "local-members-controller", "rfc6750", "rfc9110", "rfc9457"])],
  }),
  appliedTopic({
    id: "single-flight-refresh-coordinator", title: "refresh를 one promise·all-settled waiters·auth epoch로 직렬화합니다",
    lead: "boolean lock과 success callback 배열에서 한 단계 더 나아가 모든 401 caller가 같은 promise를 기다리고 성공과 실패 모두 정확히 settle되며 logout/identity switch 뒤 late success를 버리는 coordinator를 만듭니다.",
    mechanism: "module-scoped refreshPromise는 없을 때만 dedicated client로 rotation을 시작하고 모든 callers가 같은 promise를 await합니다. finally에서 current promise identity가 일치할 때만 slot을 비우고, failure는 모든 awaiters에 reject되며 terminal reason은 auth machine이 한 번 처리합니다. captured auth epoch와 AbortController는 logout·account switch·app teardown 뒤 result 적용과 replay를 막습니다.",
    workflow: "eligible failure→capture epoch→get-or-create promise→dedicated refresh request→server rotation response→epoch compare→memory credential replace→waiters resolve/replay 또는 reject/terminal logout→finally cleanup 순서를 trace합니다.",
    invariants: "동시에 refresh network call은 최대 하나이고 각 waiter는 exactly once resolve/reject되며 refresh 실패에서 queue가 영원히 pending되지 않고 old promise의 finally가 new promise를 지우지 않습니다.",
    edgeCases: "동일 tick 401 burst, refresh succeeds then logout, logout then response, first refresh failure and immediate retry, AbortError, StrictMode/test duplicated module, multiple tabs와 server reuse detection을 포함합니다.",
    failureModes: "success-only subscriber array는 refresh failure 때 promises를 hang시키고, isRefreshing을 먼저 false로 바꾸면 새 401이 old credential로 두 번째 rotation을 시작하며, late success가 logout state를 되살릴 수 있습니다.",
    verification: "deterministic deferred promises로 call count, resolve/reject count, queue zero, epoch mismatch, abort, retry-after-failure와 unhandled rejection를 검사하고 server rotation/readback과 함께 통합 검증합니다.",
    operations: "in-flight boolean, waiter count bucket, duration/outcome/reason와 epoch mismatch count만 관찰하고 response credential/error body는 기록하지 않습니다.",
    concepts: [
      c("single-flight", "같은 회복 작업이 동시에 요청될 때 하나의 실행 결과를 모든 caller가 공유하는 동시성 패턴입니다.", ["network rotation을 직렬화합니다.", "실패도 공유해야 합니다."]),
      c("waiter settlement", "공유 작업을 기다리는 모든 promise가 성공 또는 실패로 정확히 한 번 종료되는 불변식입니다.", ["hang을 막습니다.", "cleanup과 함께 검증합니다."]),
      c("generation guard", "async 시작 때 잡은 auth epoch와 완료 시 현재 epoch를 비교해 stale result를 무효화하는 장치입니다.", ["logout race를 막습니다.", "credential 값을 비교하지 않습니다."]),
    ],
    codeExamples: [node("security12-single-flight", "single-flight refresh success and failure settlement", "Security12SingleFlight.mjs", "세 caller가 한 rotation을 공유하고 실패 wave의 두 waiter가 모두 reject되는지 검증합니다.", String.raw`let calls = 0;
let pending;
let shouldFail = false;
async function rotate() {
  calls += 1;
  await Promise.resolve();
  if (shouldFail) throw new Error("rotation-failed");
  return "fresh";
}
function refresh() {
  if (!pending) {
    const current = rotate();
    pending = current.finally(() => {
      if (pending === wrapped) pending = undefined;
    });
    const wrapped = pending;
  }
  return pending;
}
const first = await Promise.all([refresh(), refresh(), refresh()]);
console.log("success-values=" + first.join(","));
console.log("calls-after-success=" + calls);
shouldFail = true;
const second = await Promise.allSettled([refresh(), refresh()]);
console.log("failure-status=" + second.map((x) => x.status).join(","));
console.log("calls-total=" + calls);
console.log("pending-cleared=" + (pending === undefined));`, "success-values=fresh,fresh,fresh\ncalls-after-success=1\nfailure-status=rejected,rejected\ncalls-total=2\npending-cleared=true", ["local-app03-auth-api", "axios-interceptors", "rfc9700"])],
  }),
  appliedTopic({
    id: "safe-request-replay", title: "request replay를 HTTP semantics·body repeatability·idempotency contract로 gate합니다",
    lead: "refresh 뒤 api(config)를 무조건 호출하면 이미 처리된 mutation을 중복 실행하거나 consumed body를 재사용할 수 있으므로 method만이 아니라 business idempotency와 server readback을 함께 판정합니다.",
    mechanism: "GET/HEAD 같은 safe method도 application side effects가 없어야 하며 PUT/DELETE의 idempotent semantics는 network duplicate가 항상 UX상 무해하다는 뜻이 아닙니다. POST mutation은 server가 scoped idempotency key와 canonical request fingerprint, retention, conflict behavior를 구현한 경우에만 자동 replay를 고려합니다. streaming/one-shot bodies, upload progress, AbortSignal과 optimistic state는 별도 복구가 필요합니다.",
    workflow: "original request에 replay policy, attempt, body factory와 idempotency key metadata를 부여하고 expiry recovery 뒤 epoch/abort를 확인합니다. safe read는 한 번 replay, approved mutation은 same key로 한 번 replay, unknown commit은 status/readback으로 합의하며 나머지는 사용자에게 안전한 재시도 선택을 제공합니다.",
    invariants: "자동 replay attempt는 bounded되고 refresh/logout endpoint는 replay하지 않으며 동일 business operation은 same idempotency identity를 유지하고 denied/aborted request가 side effect를 만들지 않습니다.",
    edgeCases: "response loss after server commit, multipart/file stream, non-seekable body, optimistic update, concurrent duplicate tabs, idempotency record expiry, key collision, 307/308 redirect와 clock deadline을 포함합니다.",
    failureModes: "_retry 하나만으로 모든 config를 재실행하면 payment/create/delete 같은 mutation이 중복될 수 있고 새 idempotency key를 만들면 dedup이 작동하지 않으며 client-only key는 server guarantee가 아닙니다.",
    verification: "method/body/policy property matrix, simulated commit-before-timeout, same/different fingerprint conflicts, exactly-once observable effect, abort, replay count와 post-recovery server readback을 검사합니다.",
    operations: "operation class, replay attempt/outcome, idempotency record result와 unknown-commit reconciliation만 기록하고 request body/key raw value는 제외합니다.",
    concepts: [
      c("replayability", "동일 request를 다시 전송해도 credential·body·business side effect 측면에서 허용되는 성질입니다.", ["HTTP method만으로 결정하지 않습니다.", "body factory가 필요할 수 있습니다."]),
      c("idempotency key contract", "server가 같은 operation identity와 canonical payload를 중복 처리하지 않도록 저장·비교하는 계약입니다.", ["scope/retention을 정합니다.", "client 문자열만으로 보장되지 않습니다."]),
      c("unknown commit", "client가 response를 못 받아 server mutation 적용 여부를 알 수 없는 상태입니다.", ["무조건 재전송하지 않습니다.", "조회/readback으로 합의합니다."]),
    ],
    codeExamples: [node("security12-replay-gate", "request replay policy gate", "Security12ReplayGate.mjs", "synthetic request의 method, repeatable body와 server idempotency 지원으로 replay를 판정합니다.", String.raw`function replayDecision(x) {
  if (x.attempt >= 1 || x.aborted) return "stop";
  if (["GET", "HEAD"].includes(x.method)) return "replay-once";
  if (!x.bodyRepeatable) return "manual-reconcile";
  if (x.idempotencyKey && x.serverDeduplicates) return "replay-same-key";
  return "manual-reconcile";
}
const cases = [
  { method: "GET", attempt: 0 },
  { method: "POST", attempt: 0, bodyRepeatable: true, idempotencyKey: true, serverDeduplicates: true },
  { method: "POST", attempt: 0, bodyRepeatable: false },
  { method: "DELETE", attempt: 1, bodyRepeatable: true },
];
for (const x of cases) console.log(replayDecision(x));`, "replay-once\nreplay-same-key\nmanual-reconcile\nstop", ["local-app03-auth-api", "fetch-standard", "rfc9110", "owasp-rest"])],
  }),
  appliedTopic({
    id: "xss-csrf-credential-transport", title: "XSS·CSRF를 함께 모델링해 memory access와 cookie rotation 경계를 방어합니다",
    lead: "client-readable credential을 cookie로 옮기는 migration이 XSS를 완전히 해결하거나 withCredentials 한 줄이 CSRF를 해결한다고 오해하지 않고 공격자가 읽기·전송·행동할 수 있는 능력을 각각 제한합니다.",
    mechanism: "HttpOnly는 script의 cookie value read를 차단하지만 browser는 matching request에 cookie를 자동 첨부합니다. Secure, narrow Domain/Path, SameSite와 short rotation lifetime을 사용하고 state-changing refresh/logout에는 synchronizer 또는 signed double-submit pattern, Origin/Fetch Metadata와 method/content-type 검사를 적용합니다. CSP와 context-aware output encoding, dependency governance는 XSS 가능성을 줄이며 active XSS가 수행하는 authenticated action은 server authorization와 reauthentication으로 제한합니다.",
    workflow: "access capability는 memory header, rotation capability는 browser-managed cookie target을 설계하고 bootstrap/refresh/logout endpoint별 credential/CSRF/CORS table을 만듭니다. separate HTTPS origins에서 cross-site form/fetch와 injected script canary를 실행하고 server state readback으로 deny 뒤 무변경을 증명합니다.",
    invariants: "CORS를 CSRF 방어로 계산하지 않고 SameSite만으로 모든 browser/client를 보호한다고 가정하지 않으며 CSRF token을 HttpOnly cookie와 같은 값/채널에만 두지 않고 credential을 URL 또는 HTML에 직렬화하지 않습니다.",
    edgeCases: "same-site sibling subdomain, top-level navigation, OAuth redirect, legacy browser/client, cookie expiry/partition, service worker, bfcache, CSP report-only와 third-party script compromise를 포함합니다.",
    failureModes: "cookie를 자동 전송하면서 CSRF를 끄면 refresh/logout/mutation이 cross-site로 실행될 수 있고, localStorage를 암호화해도 XSS가 key/API를 호출할 수 있으며, CSP만 믿으면 misconfiguration과 trusted-script gadget을 놓칩니다.",
    verification: "XSS source/sink tests, CSP violation/report, HttpOnly read denial, cookie scope/attributes, simple/preflight cross-site matrix, CSRF rotation/reuse, state readback와 token-free traces를 검증합니다.",
    operations: "CSP violation class, CSRF deny reason, cookie/session rotation과 suspicious action aggregate만 수집하며 DOM/input/cookie/header contents는 제외합니다.",
    concepts: [
      c("XSS credential theft", "untrusted script가 JavaScript-readable credential을 읽거나 application API를 대신 호출하는 공격 경로입니다.", ["HttpOnly는 read를 제한합니다.", "active action은 별도 제한합니다."]),
      c("CSRF", "browser가 자동 첨부하는 credential을 이용해 공격자가 의도하지 않은 state-changing request를 유도하는 공격입니다.", ["CORS와 다릅니다.", "server state로 검증합니다."]),
      c("credential transport table", "endpoint마다 header/cookie 자동 첨부, CSRF requirement, origin과 response exposure를 정리한 계약입니다.", ["migration 근거입니다.", "browser test로 검증합니다."]),
    ],
    codeExamples: [node("security12-browser-threat", "browser credential threat control matrix", "Security12BrowserThreat.mjs", "storage/transport 조합에 필요한 XSS·CSRF controls를 판정합니다.", String.raw`const surfaces = [
  { name: "memory-header", jsReadable: true, autoSent: false, xss: true, csrf: false },
  { name: "httponly-rotation-cookie", jsReadable: false, autoSent: true, xss: true, csrf: true },
  { name: "web-storage-bearer", jsReadable: true, autoSent: false, xss: true, csrf: false },
];
for (const x of surfaces) {
  const controls = [x.xss ? "xss" : null, x.csrf ? "csrf" : null].filter(Boolean).join("+");
  console.log(x.name + "|readable=" + x.jsReadable + "|auto=" + x.autoSent + "|controls=" + controls);
}
console.log("cors-equals-csrf-defense=false");`, "memory-header|readable=true|auto=false|controls=xss\nhttponly-rotation-cookie|readable=false|auto=true|controls=xss+csrf\nweb-storage-bearer|readable=true|auto=false|controls=xss\ncors-equals-csrf-defense=false", ["local-app03-http", "local-app03-auth-api", "rfc6265", "owasp-html5", "owasp-xss", "owasp-csrf", "w3c-csp3", "fetch-standard"])],
  }),
  appliedTopic({
    id: "multi-tab-offline-clock", title: "BroadcastChannel·storage events·offline·clock skew를 untrusted convergence hints로 처리합니다",
    lead: "한 tab의 logout/rotation이 다른 tab에 늦거나 순서가 바뀌어 도착하고 offline tab은 server revocation을 모를 수 있으므로 credential을 방송하지 않고 auth epoch와 server readback으로 수렴합니다.",
    mechanism: "BroadcastChannel은 same-origin browsing contexts 사이 ephemeral messages를 전달하고 Web Storage의 storage event는 다른 context의 변경을 알릴 수 있지만 어느 것도 server authentication evidence가 아닙니다. message에는 type, monotonic auth epoch, opaque event ID와 timestamp bucket만 두며 receiving tab은 schema/origin scope/epoch를 확인하고 credential을 clear한 뒤 server probe를 수행합니다. client clock의 JWT expiry decode는 UX preflight일 뿐 verifier 결정이 아닙니다.",
    workflow: "login/rotation/logout에서 server session generation을 얻고 local auth epoch를 증가시켜 event를 broadcast합니다. receiver는 higher epoch만 적용하고 pending requests를 abort하며 offline이면 locked/unknown 상태로 표시한 뒤 reconnect에서 bounded refresh 또는 session probe와 revoke readback을 실행합니다.",
    invariants: "token/profile/route를 channel payload나 storage event에 넣지 않고 lower/equal replay event가 state를 되살리지 않으며 offline에서 authenticated server truth를 영구 주장하지 않고 client clock으로 서명/만료 검증을 대신하지 않습니다.",
    edgeCases: "message reorder/duplicate/loss, tab sleep, bfcache restore, channel unavailable, storage cleared, incognito partition, clock forward/backward, service-worker update와 two-device concurrency를 포함합니다.",
    failureModes: "logout flag만 localStorage에 쓰면 삭제/재생/순서 race가 생기고 access credential을 tab끼리 방송하면 XSS/extension/log exposure가 넓어지며 navigator.onLine=true는 server reachability를 보장하지 않습니다.",
    verification: "deterministic event permutation, duplicate/lower epoch, offline/reconnect, clock skew, bfcache, tab crash와 server generation readback을 browser integration test로 실행합니다.",
    operations: "event type, epoch delta, convergence time, stale-event count와 reconnect outcome만 집계하고 channel/storage payload 원문은 저장하지 않습니다.",
    concepts: [
      c("convergence hint", "다른 context가 상태를 다시 확인해야 함을 알리지만 그 자체로 authority가 아닌 event입니다.", ["server readback이 필요합니다.", "credential을 담지 않습니다."]),
      c("monotonic epoch", "authentication lifecycle이 전진할 때만 증가하여 오래된 event/result를 거부하는 generation입니다.", ["순서 뒤바뀜을 흡수합니다.", "server generation과 연결할 수 있습니다."]),
      c("offline auth uncertainty", "server에 닿지 않아 revoke/expiry/account 상태를 확정할 수 없는 상태입니다.", ["unknown으로 표현합니다.", "sensitive mutation을 queue하지 않습니다."]),
    ],
    codeExamples: [node("security12-tab-convergence", "auth epoch multi-tab convergence model", "Security12TabConvergence.mjs", "순서가 뒤바뀐 synthetic logout/rotation events에서 두 tab이 높은 epoch로 수렴합니다.", String.raw`const tabs = { A: { epoch: 3, state: "authenticated" }, B: { epoch: 3, state: "authenticated" } };
function receive(tab, event) {
  if (event.epoch <= tab.epoch) return "ignored-stale";
  tab.epoch = event.epoch;
  tab.state = event.type === "logout" ? "anonymous" : "checking";
  return tab.state + "@" + tab.epoch;
}
const events = [{ type: "logout", epoch: 5 }, { type: "rotate", epoch: 4 }, { type: "logout", epoch: 5 }];
for (const event of events) console.log("B:" + receive(tabs.B, event));
console.log("A:" + receive(tabs.A, { type: "logout", epoch: 5 }));
console.log("converged=" + (tabs.A.epoch === tabs.B.epoch && tabs.A.state === tabs.B.state));
console.log("credential-in-events=false");`, "B:anonymous@5\nB:ignored-stale\nB:ignored-stale\nA:anonymous@5\nconverged=true\ncredential-in-events=false", ["react-external-store", "html-broadcast-channel", "html-webstorage", "rfc7519"])],
  }),
  appliedTopic({
    id: "client-qualification-migration", title: "storage migration·secret-safe observability·canary·rollback을 production gate로 묶습니다",
    lead: "browser-readable bundle에서 memory access와 server-managed rotation으로 옮기는 동안 old/new clients, storage leftovers와 server endpoint compatibility를 명시하고 evidence가 없으면 cutover하지 않습니다.",
    mechanism: "server가 cookie rotation, CSRF, revocation/readback와 stable problem contract를 먼저 지원하고 client는 versioned capability negotiation 뒤 target mode를 canary합니다. old storage는 credential 값을 읽어 migration하지 않고 server exchange 또는 forced reauthentication 후 제거하며 dual-write를 피합니다. telemetry와 test artifacts는 headers/storage/error payload를 default redact하고 synthetic canary secret으로 sink leakage를 검사합니다.",
    workflow: "source audit→target credential table→server backward-compatible deployment→new client shadow/no-credential logging→small canary→XSS/CSRF/concurrency/replay/offline tests→storage purge readback→ramp→old endpoint retirement 순서로 진행하고 rollback은 old compatible server와 forced reauth policy를 포함합니다.",
    invariants: "새 client가 raw old credential을 telemetry나 migration report에 복사하지 않고 canary failure에서 mixed-mode state를 정리하며 rollback이 이미 revoked/rotated credential을 되살리지 않습니다.",
    edgeCases: "long-lived tab, cached old bundle, service worker, failed cookie set, third-party cookie policy, app downgrade, partial region rollout, telemetry outage와 emergency logout-all을 포함합니다.",
    failureModes: "client를 먼저 바꾸면 server capability absence로 전체 logout이 발생하고 dual storage/write 기간을 길게 유지하면 attack surface가 합쳐지며 rollback에서 old refresh family를 다시 허용하면 theft containment가 무효화됩니다.",
    verification: "fresh profile/upgrade/downgrade, old/new matrix, secret canary sinks, storage empty readback, cookie/CSRF, refresh burst/replay, tab/offline, canary SLO와 rollback rehearsal을 검증합니다.",
    operations: "client/storage mode, migration stage, refresh/replay failure, stale epoch, secret-sink count와 rollback decision만 기록하고 actual credential·identity·domain은 제외합니다.",
    concepts: [
      c("credential-mode migration", "client와 server의 저장·전송 credential contract를 backward-compatible stages로 바꾸는 이행입니다.", ["server first를 검토합니다.", "old secret은 교환/재인증합니다."]),
      c("secret canary", "실제 credential이 아닌 탐지용 synthetic marker를 sink에 흘려 redaction 실패를 검증하는 값입니다.", ["artifact scan에 씁니다.", "production credential을 사용하지 않습니다."]),
      c("security rollback", "code version뿐 아니라 credential family, storage, cookie, CSRF와 server compatibility를 안전 상태로 되돌리는 절차입니다.", ["revoke를 되돌리지 않습니다.", "mixed clients를 고려합니다."]),
    ],
    codeExamples: [node("security12-readiness-gate", "React token-client production readiness gate", "Security12ReadinessGate.mjs", "storage, state, refresh, replay, browser, convergence, privacy와 rollback evidence를 판정합니다.", String.raw`const evidence = {
  sanitizedAudit: true,
  credentialSplit: true,
  epochStateMachine: true,
  explicitRequestPolicy: true,
  boundedFailureClassifier: true,
  allWaitersSettled: true,
  replayGate: true,
  xssAndCsrfQualified: true,
  tabOfflineConvergence: true,
  secretSafeArtifacts: true,
  rollbackRehearsed: true,
};
const missing = Object.keys(evidence).filter((key) => evidence[key] !== true);
console.log("evidence=" + Object.keys(evidence).length);
console.log("missing=" + (missing.join(",") || "none"));
console.log("actual-values-copied=false");
console.log("release=" + (missing.length === 0 ? "pass" : "block"));`, "evidence=11\nmissing=none\nactual-values-copied=false\nrelease=pass", localRefs.concat(officialRefs))],
  }),
];

const sources: SessionSource[] = [
  { id: "local-app02-auth-store", repository: "D:/dev/my-app02", path: "src/store/useAuthStore.jsx", usedFor: ["persisted display-auth learning baseline", "credential-free early store comparison"], evidence: "2026-07-14 read-only sanitized audit: 33 lines, 1,737 bytes, SHA-256 DA8F4C6AB40D340827A8205484AD98EC3693D4BF2073B922D5521E1734FE9653. 실제 storage key, identity/profile values는 복사하지 않았습니다." },
  { id: "local-app02-login", repository: "D:/dev/my-app02", path: "src/pages/LoginPage.jsx", usedFor: ["client-only login UI baseline", "auth boolean and navigation gap"], evidence: "2026-07-14 read-only sanitized audit: 34 lines, 1,183 bytes, SHA-256 23390A52C441A3B7B61020DD7DA3C1017C3F9541FCCCEF84BC7B6BD9345EA1E1. 실제 input, route와 identity values는 복사하지 않았습니다." },
  { id: "local-app02-package", repository: "D:/dev/my-app02", path: "package.json", usedFor: ["React/Zustand/router test snapshot provenance"], evidence: "2026-07-14 read-only sanitized audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. dependency metadata만 사용했습니다." },
  { id: "local-app03-http", repository: "D:/dev/my-app03", path: "src/api/Http.jsx", usedFor: ["environment-based Axios instance", "credentialed request current-state"], evidence: "2026-07-14 read-only sanitized audit: 18 lines, 872 bytes, SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987. 실제 base URL, domain와 header values는 복사하지 않았습니다." },
  { id: "local-app03-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["request/response interceptor and single-flight current-state", "storage, retry and failed-waiter gap"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 routes, storage key, credentials, user fields, domain와 response values는 복사하지 않았습니다." },
  { id: "local-app03-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["UI auth projection and logout storage removal", "auth epoch target gap"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. 실제 storage key와 identity values는 복사하지 않았습니다." },
  { id: "local-app03-login", repository: "D:/dev/my-app03", path: "src/pages/LoginPage.jsx", usedFor: ["server login and browser credential persistence flow", "loading/error/UI-state boundary"], evidence: "2026-07-14 read-only sanitized audit: 97 lines, 4,359 bytes, SHA-256 9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8. 실제 credential, member fields, route, user와 message values는 복사하지 않았습니다." },
  { id: "local-app03-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["React/Axios/Zustand/router snapshot provenance"], evidence: "2026-07-14 read-only sanitized audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. dependency metadata만 사용했습니다." },
  { id: "local-members-controller", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/controller/MembersController.java", usedFor: ["server issue/refresh/rotation/logout current-state", "client-server contract and credential logging risks"], evidence: "2026-07-14 read-only sanitized audit: 514 lines, 21,038 bytes, SHA-256 72F5F59FCF79C94CDA20546FA25634AE2C8C8F47C43953B45263E07CF3BB246D. 실제 routes, identities, providers, credentials, response messages와 logged values는 복사하지 않았습니다." },
  { id: "react-external-store", repository: "React official documentation", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["external store subscription and immutable snapshot contract"], evidence: "React 19.2 공식 현행 useSyncExternalStore 문서입니다." },
  { id: "react-effects", repository: "React official documentation", path: "learn/you-might-not-need-an-effect", publicUrl: "https://react.dev/learn/you-might-not-need-an-effect", usedFor: ["event/state derivation versus external synchronization"], evidence: "React 공식 Effect usage guidance입니다." },
  { id: "axios-interceptors", repository: "Axios official documentation", path: "docs/interceptors", publicUrl: "https://axios-http.com/docs/interceptors", usedFor: ["request/response interceptor registration and ejection"], evidence: "Axios 공식 interceptor 문서의 current redirect target까지 2026-07-14 확인했습니다." },
  { id: "zustand-persist", repository: "pmndrs Zustand official repository", path: "src/middleware/persist.ts", publicUrl: "https://github.com/pmndrs/zustand/blob/main/src/middleware/persist.ts", usedFor: ["persist middleware storage, partialization, migration and hydration behavior"], evidence: "Zustand 공식 repository의 current persist middleware source입니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "Fetch", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["credentials, origins, redirects, abort and response behavior"], evidence: "WHATWG Living Standard의 Fetch 규범입니다." },
  { id: "html-webstorage", repository: "WHATWG HTML Living Standard", path: "webstorage.html", publicUrl: "https://html.spec.whatwg.org/multipage/webstorage.html", usedFor: ["localStorage/sessionStorage scope and storage event"], evidence: "WHATWG HTML Living Standard의 Web Storage 규범입니다." },
  { id: "html-broadcast-channel", repository: "WHATWG HTML Living Standard", path: "web-messaging.html#broadcasting-to-other-browsing-contexts", publicUrl: "https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts", usedFor: ["BroadcastChannel same-origin messaging and lifecycle"], evidence: "WHATWG HTML Living Standard의 BroadcastChannel 규범입니다." },
  { id: "rfc9700", repository: "IETF RFC 9700", path: "rfc9700.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9700.html", usedFor: ["OAuth Security BCP, refresh rotation and replay protection"], evidence: "2025 Best Current Practice for OAuth 2.0 Security입니다." },
  { id: "rfc8725", repository: "IETF RFC 8725", path: "rfc8725.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc8725.html", usedFor: ["JWT validation and algorithm/claim best practices"], evidence: "JSON Web Token Best Current Practices입니다." },
  { id: "rfc7519", repository: "IETF RFC 7519", path: "rfc7519.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7519.html", usedFor: ["JWT claims and time semantics boundary"], evidence: "JSON Web Token 표준입니다." },
  { id: "rfc6750", repository: "IETF RFC 6750", path: "rfc6750.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6750.html", usedFor: ["Bearer use and WWW-Authenticate error contract"], evidence: "OAuth 2.0 Bearer Token Usage 표준입니다." },
  { id: "rfc6265", repository: "IETF RFC 6265", path: "rfc6265.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6265.html", usedFor: ["HTTP cookie storage, scope and attributes"], evidence: "HTTP State Management Mechanism 표준입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP safe/idempotent methods and authentication status semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["stable machine-readable authentication problem contract"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "owasp-html5", repository: "OWASP Cheat Sheet Series", path: "HTML5_Security_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", usedFor: ["Web Storage sensitive-data and messaging risks"], evidence: "OWASP 공식 HTML5 Security guidance입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session credential lifecycle and cookies"], evidence: "OWASP 공식 Session Management guidance입니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross_Site_Scripting_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["context-aware XSS prevention and browser credential exposure"], evidence: "OWASP 공식 XSS Prevention guidance입니다." },
  { id: "owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["cookie-backed endpoint CSRF controls"], evidence: "OWASP 공식 CSRF Prevention guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["credential-safe telemetry and artifact redaction"], evidence: "OWASP 공식 Logging guidance입니다." },
  { id: "owasp-rest", repository: "OWASP Cheat Sheet Series", path: "REST_Security_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html", usedFor: ["REST token validation, methods and security errors"], evidence: "OWASP 공식 REST Security guidance입니다." },
  { id: "w3c-csp3", repository: "W3C Content Security Policy Level 3", path: "CSP3", publicUrl: "https://www.w3.org/TR/CSP3/", usedFor: ["CSP delivery and browser enforcement"], evidence: "W3C Content Security Policy Level 3 specification입니다." },
];

const session = createExpertSession({
  inventoryId: "security-12-react-token-client", slug: "security-12-react-token-client", courseId: "devops", moduleId: "token-client-integration", order: 4,
  title: "React token client·storage·interceptor",
  subtitle: "browser credential threat model에서 epoch state, bounded single-flight refresh, safe replay, XSS/CSRF, multi-tab/offline convergence와 reversible migration까지 구현합니다.",
  level: "전문가", estimatedMinutes: 190,
  coreQuestion: "React client가 credential을 직접 다루면서도 XSS·CSRF·동시성·재실행·multi-tab·offline 위험을 숨기지 않고 server authority와 안전하게 수렴하려면 어떤 상태·저장·interceptor 계약이 필요할까요?",
  summary: "my-app02의 persisted display-auth learning stage와 my-app03의 Axios instance, browser-readable credential bundle, request/response interceptors, single-flight flag/subscriber queue, original-request replay, Zustand logout 및 server issue/rotation/logout flow를 아홉 files에서 read-only·sanitized audit했습니다. 실제 token/storage key/route/member/provider/domain/secret 값은 복사하지 않았습니다. current flow의 URL substring exclusion, failed refresh waiters 미정리, generic original-request replay와 raw credential logging risk를 숨기지 않고 memory·Web Storage·HttpOnly cookie tradeoff, epoch auth state, explicit request metadata, bounded failure classification, shared refresh promise, idempotency/reconciliation, XSS/CSRF, tab/offline/clock convergence와 secret-safe canary/rollback을 React·Axios·Zustand·WHATWG·IETF·OWASP·W3C 근거와 열 executable models로 확장합니다.",
  objectives: ["두 React auth snapshots와 server flow를 sanitized credential graph로 복원한다.", "memory·Web Storage·HttpOnly cookie의 XSS/CSRF/UX tradeoff를 결정한다.", "credential과 분리된 epoch 기반 auth state machine을 구현한다.", "explicit auth metadata와 origin을 사용하는 request interceptor를 설계한다.", "401·403·network·expiry를 stable server signals로 분류한다.", "single-flight refresh의 모든 waiters를 성공/실패로 settle한다.", "HTTP/idempotency/body contract로 request replay를 제한한다.", "memory/cookie target에서 XSS와 CSRF controls를 함께 검증한다.", "BroadcastChannel·offline·clock skew에서 server truth로 수렴한다.", "storage migration, secret-safe artifacts, canary와 rollback을 release gate로 묶는다."],
  prerequisites: [{ title: "refresh token rotation·reuse detection", reason: "rotation family, single-use refresh, replay/reuse detection, transactional replace와 revoke propagation을 알아야 React client의 single-flight·terminal failure·logout race를 server truth에 맞게 설계할 수 있습니다.", sessionSlug: "security-11-refresh-token-rotation" }],
  keywords: ["React auth", "Zustand", "Axios interceptor", "memory token", "Web Storage", "HttpOnly cookie", "XSS", "CSRF", "single-flight refresh", "auth epoch", "idempotency", "BroadcastChannel", "offline convergence", "secret redaction"],
  topics,
  lab: {
    title: "React credential client를 공격·동시성·offline·migration까지 qualification하기",
    scenario: "원본 세 repositories는 변경하지 않고 synthetic credentials, disposable auth server와 isolated HTTPS browser origins/tabs를 사용해 current browser-readable flow를 target memory-access/cookie-rotation architecture로 단계 이행합니다.",
    setup: ["Node.js current supported runtime", "React/Zustand client fixture and production-like build", "Axios general and dedicated refresh instances", "disposable auth/rotation/revocation server", "deterministic clock/deferred promise/AbortController harness", "three isolated HTTPS browser origins and multiple contexts", "CSP/CSRF/XSS synthetic canary tools", "redacted network/log/trace artifact sink", "원본 9 files read-only"],
    steps: ["원본 fingerprints와 observed credential source/sink/concurrency graph를 값 없이 기록합니다.", "credential별 memory/Web Storage/cookie threat table과 target split을 승인합니다.", "unknown/checking/authenticated/refreshing/anonymous 상태와 monotonic auth epoch를 구현합니다.", "explicit auth policy, parsed origin, interceptor lifecycle와 dedicated refresh instance를 구현합니다.", "status/challenge/problem/request policy 기반 failure classifier와 accessible terminal UI를 검증합니다.", "deferred promises로 one refresh call, all waiter settlement, abort와 logout epoch race를 시험합니다.", "safe read, repeatable body, server idempotency와 unknown-commit readback으로 replay를 gate합니다.", "separate origins에서 XSS theft/action, cookie CSRF, CSP와 deny-state readback을 실행합니다.", "BroadcastChannel/storage event reorder, offline/reconnect, bfcache와 clock skew에서 server truth로 수렴합니다.", "server-first migration, storage purge, secret canary scan, canary SLO와 rollback rehearsal을 완료합니다."],
    expectedResult: ["client UI state와 credentials가 분리되고 late refresh가 logout/identity switch를 되돌리지 못합니다.", "동시 expiry wave마다 rotation network call은 하나이며 성공/실패 모든 waiters가 bounded time에 settle됩니다.", "자동 replay는 safe/idempotent/repeatable operation만 한 번 실행하고 unknown mutation은 server readback으로 합의됩니다.", "XSS/CSRF tests가 storage·cookie assumptions를 실제 browser와 server state에서 검증하고 artifacts에는 credential이 없습니다.", "tabs와 offline client가 token을 교환하지 않고 auth epoch hint와 reconnect readback으로 logout/revoke truth에 수렴합니다.", "old browser-readable storage는 값을 복사하지 않고 exchange/re-auth 후 제거되며 canary/rollback이 revoke를 되살리지 않습니다."],
    cleanup: ["synthetic credentials/accounts/idempotency records와 disposable server data를 revoke·폐기합니다.", "Axios interceptors, timers, channels, storage listeners, browser contexts와 fault injectors를 종료합니다.", "browser storage/cookies/caches/service workers와 temporary builds를 제거합니다.", "traces/logs/screenshots를 secret scan/redaction 후 retention policy에 따라 삭제합니다.", "원본 9 files exact hash와 repository status unchanged를 확인합니다."],
    extensions: ["DPoP sender-constrained access credential을 browser key lifecycle과 함께 qualification합니다.", "BFF architecture와 direct SPA OAuth client의 CSRF/XSS/operation tradeoff를 비교합니다.", "WebAuthn step-up과 risk-based reauthentication을 sensitive mutation replay gate에 추가합니다.", "service worker와 long-lived tab mixed-version chaos test를 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node models를 실행하고 source audit에서 storage, state, request, failure, refresh, replay, browser, tab와 release evidence까지 대응시키세요.", requirements: ["stdout 완전 일치", "sanitized source audit", "storage matrix", "auth epoch", "request policy", "failure classifier", "single-flight settlement", "replay gate", "XSS/CSRF matrix", "tab convergence", "readiness gate"], hints: ["Node models는 실제 browser storage/cookies, React scheduling, Axios network, server rotation, XSS/CSRF와 multi-tab execution을 대체하지 않습니다."], expectedOutcome: "각 client 경계의 authority, race, attack capability, test fidelity와 운영 evidence를 설명합니다.", solutionOutline: ["audit→store/state→interceptors→refresh/replay→browser/convergence→migrate 순서입니다."] },
    { difficulty: "응용", prompt: "현재 browser-readable auth flow를 memory access·HttpOnly rotation cookie architecture로 단계 migration하세요.", requirements: ["server-first compatibility", "CSRF contract", "auth epoch", "dedicated refresh", "all-waiter rejection", "safe replay/idempotency", "tab/offline convergence", "secret-safe artifacts", "storage purge", "canary/rollback"], hints: ["HttpOnly cookie는 XSS 전체와 CSRF를 자동 해결하지 않으며 old/new dual write 기간을 최소화해야 합니다."], expectedOutcome: "old clients를 즉시 깨뜨리지 않으면서 값 유출과 concurrency/replay 위험을 줄이는 reversible migration이 완성됩니다.", solutionOutline: ["server controls→client shadow→canary→purge/readback→ramp/retire 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 React credential-client architecture standard를 작성하세요.", requirements: ["credential/storage table", "state/epoch", "request metadata", "failure catalog", "single-flight", "replay/idempotency", "XSS/CSRF", "tab/offline", "privacy telemetry", "migration/incident/rollback"], hints: ["framework/library 이름보다 hard invariants와 browser/server evidence를 중심으로 작성하세요."], expectedOutcome: "여러 React apps가 같은 bounded recovery, privacy와 server-authority convergence 기준을 공유합니다.", solutionOutline: ["threat model→contracts→tests→operations→migration/revalidation 순서입니다."] },
  ],
  nextSessions: ["security-13-logout-revocation"], sources,
  sourceCoverage: { filesRead: 9, filesUsed: 9, uncoveredNotes: ["my-app02의 persisted display-auth와 my-app03의 server credential/interceptor stage를 서로 다른 학습 snapshot으로 구분했습니다.", "실제 storage key, routes, member/user fields, provider, origin/domain, header/token/secret와 response values는 공개 content·examples·evidence에 복사하지 않았습니다.", "관찰된 browser-readable access/rotation credential pair, substring exclusion, generic config replay와 refresh failure waiter cleanup 부재를 production guarantee로 과장하지 않았습니다.", "client 및 server의 raw credential logging은 값 없이 credential disclosure risk로 분류했으며 실제 운영 노출 시 즉시 collection stop·revoke/rotate·sink purge/readback이 필요합니다.", "Node models는 actual React/Zustand/Axios/browser/cookie/crypto/server rotation과 revoke를 대체하지 않으므로 integration/browser lab evidence를 요구합니다."] },
});

export default session;
