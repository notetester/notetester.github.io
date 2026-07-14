import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const serverRefs = ["local-jwt-config", "local-jwt-util", "local-jwt-filter"];
const clientRefs = ["local-auth-store", "local-login-page", "local-http", "local-auth-api"];

const topics = [
  appliedTopic({
    id: "token-source-architecture-audit", title: "React storage·interceptor와 Spring JWT 발급·filter를 한 redacted sequence로 감사합니다",
    lead: "client 파일과 server filter를 따로 읽지 않고 login response→client storage/state→request attachment→server verification/context→401 refresh→retry/logout의 end-to-end path를 값 없이 복원합니다.",
    mechanism: "로컬 React snapshot은 localStorage, auth store, request/response interceptors, refresh/logout 흐름을 포함하고 server snapshot은 configured lifetimes, signing/validation과 custom filter를 포함합니다. token/header logging은 credential disclosure risk이며 source가 rotation family, issuer/audience/type, reuse detection을 모두 보장한다고 과장하지 않습니다.",
    workflow: "read-only hashes→credential kinds→storage/sinks→issuer/validator claims→request/refresh/logout transitions→concurrency→revocation→logs/artifacts를 sequence와 claim-boundary 표로 만듭니다.",
    invariants: "실제 token, signing secret/key, storage key, endpoint, subject, user/provider data와 response literal을 공개 content에 복사하지 않고 source observation·표준 requirement·target design을 분리합니다.",
    edgeCases: "cold reload, two tabs, multiple simultaneous 401, offline queue, clock skew, account disable, password change, key rotation, partial deployment와 browser crash를 포함합니다.",
    failureModes: "정상 login/refresh demo만 보면 XSS-readable storage, refresh replay/race, stale authority, log disclosure와 rollback divergence가 연결된 attack path로 보이지 않습니다.",
    verification: "source hashes, sanitized call graph, storage/network/log sinks, JWT header/claims policy, interceptor counts, refresh family state와 server readback을 actual compatible fixtures에서 대조합니다.",
    operations: "credential class, token/family epoch, stable failure/revoke reason, build/key/policy version을 bounded labels로 수집하고 raw credential/subject/resource는 기록하지 않습니다.",
    concepts: [c("token architecture", "issuer, credential representations, client storage/attachment, verifier, refresh/revoke와 incident paths의 전체 구조입니다.", ["client/server를 함께 봅니다.", "trust boundary를 표시합니다."]), c("claim boundary", "로컬 source에서 직접 관찰한 token 동작과 표준/강화 설계를 구분하는 경계입니다.", ["hash와 version을 기록합니다.", "없는 보장을 과장하지 않습니다."]), c("credential sink", "token/key가 복사·노출될 수 있는 storage, DOM, log, trace, error, analytics와 artifact 위치입니다.", ["data flow로 inventory합니다.", "값을 수집하지 않습니다."])],
    codeExamples: [node("security15-source-sequence", "redacted client-server token sequence", "Security15SourceSequence.mjs", "원본에서 관찰되는 storage/interceptor/filter 흐름과 추가 verification gaps를 값 없이 출력합니다.", String.raw`const sequence = [
  ["login", "client-api>store", "observed"],
  ["attach", "request-interceptor>server-filter", "observed"],
  ["refresh", "response-interceptor>server", "observed"],
  ["logout", "client-state>storage", "observed"],
  ["issuer-audience-type", "validator-policy", "verify"],
  ["refresh-family-reuse", "server-store", "verify"],
];
for (const row of sequence) console.log(row.join("|"));
console.log("credential-values-copied=false");`, "login|client-api>store|observed\nattach|request-interceptor>server-filter|observed\nrefresh|response-interceptor>server|observed\nlogout|client-state>storage|observed\nissuer-audience-type|validator-policy|verify\nrefresh-family-reuse|server-store|verify\ncredential-values-copied=false", clientRefs.concat(serverRefs, ["rfc7519", "rfc9700"]))],
  }),
  appliedTopic({
    id: "token-threat-model", title: "access·refresh·signing key를 서로 다른 assets와 attacker capabilities로 threat-model합니다",
    lead: "JWT라는 형식 하나로 묶지 않고 access bearer의 짧은 misuse window, refresh credential의 session-extension power와 signing key의 issuer-wide blast radius를 구분합니다.",
    mechanism: "attackers는 XSS, malicious extension, browser storage theft, network/proxy/log leak, database read/write, key compromise, token substitution/replay와 confused-deputy를 시도합니다. each credential의 confidentiality, integrity, audience, lifetime과 revoke properties가 다릅니다.",
    workflow: "asset→holder/sink→attacker access→abuse→blast radius→prevent/detect/respond controls→test/evidence→residual risk를 STRIDE-like table보다 구체적인 token misuse cases로 작성합니다.",
    invariants: "bearer credential possession을 identity 재검증으로 착각하지 않고 refresh/key는 access token보다 강한 protection을 가지며 client compromise와 server compromise를 별도 대응합니다.",
    edgeCases: "shared device, backup restore, browser sync, stolen DB snapshot, compromised signing instance, stale JWKS cache, insider, support bundle와 third-party SDK를 포함합니다.",
    failureModes: "모든 token을 같은 TTL/storage/log policy로 다루면 refresh/key compromise의 훨씬 큰 blast radius와 recovery complexity를 숨깁니다.",
    verification: "credential/sink inventory, abuse tree, synthetic theft/replay, key compromise drill, revoke/rotation propagation과 secret scans를 실행합니다.",
    operations: "credential class별 issuance/use/reuse/revoke, key age/rotation, sink finding, suspicious geography/device가 아닌 privacy-safe risk signals와 incident RTO를 관찰합니다.",
    concepts: [c("bearer token", "소유한 주체가 추가 proof 없이 사용할 수 있는 credential입니다.", ["유출 방지가 핵심입니다.", "sender-constrained token과 구분합니다."]), c("refresh credential", "새 access token을 얻어 session을 연장할 수 있는 장기 credential입니다.", ["rotation/reuse detection이 필요합니다.", "access token보다 강하게 보호합니다."]), c("signing-key blast radius", "signing key compromise가 위조 가능한 issuers/audiences/tokens와 기간에 미치는 영향 범위입니다.", ["key rotation과 incident plan을 둡니다.", "키 ID만으로 신뢰하지 않습니다."])],
    codeExamples: [node("security15-risk-score", "credential-specific risk classifier", "Security15RiskScore.mjs", "credential lifetime, replay power와 issuer scope로 protection tier를 구분합니다.", String.raw`const credentials = [
  { name: "access", lifetime: 5, sessionExtension: false, issuerScope: false },
  { name: "refresh", lifetime: 10080, sessionExtension: true, issuerScope: false },
  { name: "signing-key", lifetime: 43200, sessionExtension: true, issuerScope: true },
];
function tier(x) { const score = (x.lifetime > 60 ? 1 : 0) + (x.sessionExtension ? 2 : 0) + (x.issuerScope ? 4 : 0); return score >= 6 ? "critical" : score >= 3 ? "high" : "bounded"; }
for (const x of credentials) console.log(x.name + "|" + tier(x));`, "access|bounded\nrefresh|high\nsigning-key|critical", ["rfc8725", "rfc9700", "owasp-jwt", "nist-ssdf"])],
  }),
  appliedTopic({
    id: "issuer-validation-key-rollover", title: "alg·key selection과 iss·aud·typ·time claims를 allowlist validator로 고정합니다",
    lead: "decode가 성공하거나 signature가 valid하다는 사실만으로 token을 수락하지 않고 expected token profile과 request context를 함께 검증합니다.",
    mechanism: "JWS protected header의 alg/typ/kid는 untrusted input으로 parser/resource limits 뒤 allowlisted algorithm/key set에 사용합니다. signature 후 issuer, audience, subject shape, exp/nbf/iat와 optional jti/scope를 explicit requirements로 검증하고 access/refresh token types를 혼용하지 않습니다.",
    workflow: "token profile→allowed alg/key source→bounded parsing→signature→issuer/audience/type→time/skew→required claims/schema→account/revoke policy→principal/authorities mapping을 수행합니다.",
    invariants: "token-provided alg/key URL을 신뢰하지 않고 unknown kid는 bounded refresh 후 fail closed이며 access validator가 refresh/ID token을 받아들이지 않고 key rollover 중 old/new overlap과 retirement를 명시합니다.",
    edgeCases: "alg none/confusion, duplicate JSON members, oversized token, unknown/duplicate kid, stale JWKS, multiple audiences, wrong typ, clock rollback, far-future exp와 compromised key를 포함합니다.",
    failureModes: "library validateToken 한 호출의 default에 의존하면 issuer/audience/type/key source와 clock policy가 암묵적이 되어 token substitution과 cross-service replay가 남습니다.",
    verification: "malformed/header/claim corpus, known keys, wrong issuer/audience/type, boundary clocks, unknown kid/JWKS fault, rollover/retirement와 compromised-key revoke를 실행합니다.",
    operations: "validator profile/key version, stable reject reason, clock skew bucket, unknown kid refresh와 issuer/audience mismatch를 token 값 없이 집계합니다.",
    concepts: [c("JWT profile", "특정 용도의 token이 가져야 할 algorithm, issuer, audience, type, claims와 lifetime 규칙입니다.", ["access/refresh/ID token을 분리합니다.", "validator와 contract test에 고정합니다."]), c("algorithm allowlist", "token header가 아니라 verifier configuration이 허용하는 signature algorithms 집합입니다.", ["key type과 함께 검증합니다.", "none/confusion을 막습니다."]), c("key rollover", "old/new verification keys가 제한 기간 공존한 뒤 old key를 안전하게 retire하는 과정입니다.", ["kid/JWKS cache를 관리합니다.", "rollback/compromise 절차가 필요합니다."])],
    codeExamples: [node("security15-validator-profile", "access-token validation profile", "Security15ValidatorProfile.mjs", "synthetic header/claims를 allowlisted profile과 clock에서 검증합니다.", String.raw`const profile = { alg: "RS256", issuer: "https://issuer.example", audience: "api", type: "at+jwt", now: 1000, skew: 30 };
function validate(t) { if (t.alg !== profile.alg) return "alg"; if (t.iss !== profile.issuer) return "iss"; if (!t.aud.includes(profile.audience)) return "aud"; if (t.typ !== profile.type) return "typ"; if (t.exp < profile.now - profile.skew) return "exp"; if (t.nbf > profile.now + profile.skew) return "nbf"; return "ok"; }
const base = { alg: "RS256", iss: "https://issuer.example", aud: ["api"], typ: "at+jwt", exp: 1100, nbf: 900 };
for (const patch of [{}, { alg: "none" }, { aud: ["other"] }, { typ: "refresh+jwt" }, { exp: 900 }]) console.log(validate({ ...base, ...patch }));`, "ok\nalg\naud\ntyp\nexp", ["rfc7515", "rfc7519", "rfc8725", "rfc9068", "spring-resource-jwt", "local-jwt-config", "local-jwt-util"])],
  }),
  appliedTopic({
    id: "refresh-family-transaction", title: "refresh rotation을 atomic family state·reuse detection·concurrency transaction으로 만듭니다",
    lead: "refresh endpoint가 새 문자열을 반환하는 데서 끝내지 않고 old credential consume, new credential issue, family linkage와 concurrent retry를 하나의 durable transaction으로 처리합니다.",
    mechanism: "server는 raw refresh value 대신 digest/opaque identifier와 family/parent/status/issued/expiry/device/account epoch를 저장합니다. single-use old token의 second use는 benign race와 theft 가능성을 구분해 family revoke/step-up/incident를 수행합니다.",
    workflow: "validate binding/profile→lock/CAS current family member→check active/expiry/account→mark consumed→issue/store child→commit→response하고 retry idempotency와 failure recovery를 설계합니다.",
    invariants: "같은 refresh credential이 두 active children을 만들지 않고 raw credential이 DB/log에 없으며 family revoke는 모든 descendants와 access epoch에 반영되고 partial commit을 reconciliation합니다.",
    edgeCases: "two tabs simultaneous 401, lost response retry, DB timeout after consume, old server instance, clock skew, device clone, password change, logout-all과 backup restore를 포함합니다.",
    failureModes: "rotation을 stateless verify+issue로 구현하면 stolen old refresh의 재사용을 탐지하거나 차단할 server state가 없고 concurrency에서 token family가 fork됩니다.",
    verification: "parallel CAS, retry idempotency, crash points, reuse/family revoke, raw-sink scan, revoke readback와 store restore/reconciliation을 실행합니다.",
    operations: "family issue/consume/reuse/revoke, fork attempts, transaction latency/failure, revoke propagation와 reconciliation backlog를 bounded metrics로 관찰합니다.",
    concepts: [c("token family", "한 login/device에서 rotation으로 이어진 refresh credentials의 ancestry 집합입니다.", ["family 단위 revoke를 지원합니다.", "parent/child를 추적합니다."]), c("reuse detection", "이미 소비된 refresh credential이 다시 제시되는 사건을 탐지해 theft 가능성에 대응하는 control입니다.", ["race와 구분합니다.", "family를 revoke할 수 있습니다."]), c("atomic rotation", "old consume와 new child 저장이 하나의 transaction/CAS 결과로 성공하거나 실패하는 성질입니다.", ["fork를 막습니다.", "lost response recovery가 필요합니다."])],
    codeExamples: [node("security15-family-model", "atomic refresh-family rotation and reuse", "Security15FamilyModel.mjs", "synthetic family에서 rotate, second-use detection과 family revoke를 결정적으로 실행합니다.", String.raw`const family = { state: "active", current: "r1", consumed: new Set() };
function rotate(presented, child) { if (family.state !== "active") return "family-revoked"; if (family.consumed.has(presented)) { family.state = "revoked"; return "reuse-revoke"; } if (presented !== family.current) return "stale"; family.consumed.add(presented); family.current = child; return "issued:" + child; }
console.log(rotate("r1", "r2"));
console.log(rotate("r1", "r3"));
console.log(rotate("r2", "r4"));
console.log("family=" + family.state);`, "issued:r2\nreuse-revoke\nfamily-revoked\nfamily=revoked", ["rfc9700", "oauth-browser-bcp", "owasp-jwt", "local-jwt-util"])],
  }),
  appliedTopic({
    id: "react-token-state-machine", title: "React auth state를 storage가 아니라 auth epoch·single-flight refresh state machine으로 소유합니다",
    lead: "token 문자열과 user object를 여러 modules가 직접 읽고 쓰지 않고 bootstrap, anonymous, authenticated, refreshing, stale, loggingOut와 compromised states를 하나의 owner가 전환합니다.",
    mechanism: "access credential은 가능한 memory에 제한하고 reload restoration은 server-controlled session/refresh contract에서 수행합니다. request interceptor는 현재 epoch의 credential snapshot을 attach하고 response interceptor는 한 shared refresh promise와 bounded replay queue를 사용합니다.",
    workflow: "bootstrap once→validate restored session→set auth epoch→attach per request→classify 401→single-flight refresh→compare epoch→replay safe request or fail→logout increment epoch/abort/clear를 구현합니다.",
    invariants: "localStorage 값을 인증 truth로 신뢰하지 않고 refresh response가 logout/new-login epoch를 덮지 않으며 unsafe/non-idempotent request replay는 explicit policy/idempotency key 없이는 자동 실행하지 않습니다.",
    edgeCases: "StrictMode effect, component unmount, two Axios instances, multiple 401, refresh 401/5xx, offline, old tab, request cancellation, upload body와 clock skew를 포함합니다.",
    failureModes: "interceptor마다 refresh하면 stampede/family reuse가 발생하고 stale promise가 logout 뒤 token을 복구하거나 POST를 중복 replay할 수 있습니다.",
    verification: "auth reducer/model, actual React store/subscriptions, interceptor register/eject, concurrent deferred requests, epoch races, retry caps, storage/DOM/log scans와 browser reload를 실행합니다.",
    operations: "auth state/epoch transitions, refresh single-flight count, replay allow/deny reason, stale response drops와 interceptor listener leaks를 privacy-safe하게 관찰합니다.",
    concepts: [c("auth epoch", "login/logout/credential-family 전환마다 증가해 stale async 결과를 무효화하는 version입니다.", ["request/refresh와 함께 capture합니다.", "사용자 ID와 다릅니다."]), c("single-flight refresh", "동시에 발생한 여러 인증 실패가 하나의 in-flight refresh 결과를 공유하는 coordination입니다.", ["stampede를 막습니다.", "failure도 모두에게 전파합니다."]), c("safe replay policy", "인증 갱신 뒤 자동 재시도해도 되는 request를 method/idempotency/body/retry count로 제한하는 규칙입니다.", ["mutation은 명시적으로 설계합니다.", "중복 side effect를 막습니다."])],
    codeExamples: [node("security15-client-machine", "auth epoch and single-flight replay model", "Security15ClientMachine.mjs", "동시 401과 logout race에서 refresh 결과를 epoch로 제한합니다.", String.raw`let state = { epoch: 3, status: "authenticated", refreshes: 0 };
let shared = null;
function refresh(requestEpoch) { if (!shared) { state.refreshes++; shared = Promise.resolve({ epoch: requestEpoch, credential: "synthetic" }); } return shared; }
const captured = state.epoch;
const pending = [refresh(captured), refresh(captured), refresh(captured)];
state = { ...state, epoch: 4, status: "anonymous" };
const results = await Promise.all(pending);
const accepted = results.filter(x => x.epoch === state.epoch).length;
console.log("refreshes=" + state.refreshes);
console.log("accepted=" + accepted);
console.log("status=" + state.status);`, "refreshes=1\naccepted=0\nstatus=anonymous", ["react-effect", "axios-interceptors", "zustand-persist", "local-auth-store", "local-login-page", "local-auth-api"])],
  }),
  appliedTopic({
    id: "storage-browser-boundaries", title: "memory·Web Storage·HttpOnly cookie/BFF tradeoff를 XSS·CSRF threat로 결정합니다",
    lead: "편리한 persistence를 보안으로 포장하지 않고 JavaScript-readable storage는 XSS/extension threat, automatic cookie는 CSRF와 server session constraints를 만든다는 사실을 endpoint별로 평가합니다.",
    mechanism: "local/session storage는 same-origin script가 읽고 bearer가 오래 남을 수 있습니다. HttpOnly cookie는 script read를 줄이지만 browser가 자동 첨부하므로 Secure/SameSite/Domain/Path, CSRF와 server-side refresh/session controls가 필요합니다. BFF는 browser에 access token을 노출하지 않는 대안입니다.",
    workflow: "client types, XSS risk, reload requirement, backend topology와 revoke needs를 decision record에 넣고 access/refresh/CSRF credential을 별도 storage/transport로 배치합니다.",
    invariants: "storage key 난독화/encoding을 encryption으로 부르지 않고 tokens를 URL/DOM/Redux devtools/analytics/error에 두지 않으며 cookie scope와 CORS/CSRF를 함께 검증합니다.",
    edgeCases: "shared device, browser sync/backup, extension, iframe, sibling subdomain, service worker, bfcache, mobile WebView와 private browsing을 포함합니다.",
    failureModes: "localStorage bearer를 장기 유지하면 XSS theft window가 커지고 cookie migration에서 CSRF를 끄면 자동 credential request에 취약할 수 있습니다.",
    verification: "XSS-like sink corpus, storage/DOM/devtools/artifact scans, cookie/site/origin browser matrix, refresh/reload/logout와 BFF failure/rollback을 실행합니다.",
    operations: "storage strategy revision, credential exposure canaries, CSRF/CORS results, browser compatibility와 logout residue를 관찰합니다.",
    concepts: [c("JavaScript-readable storage", "same-origin script가 값을 읽을 수 있는 memory/Web Storage/indexed storage 등의 위치입니다.", ["XSS 영향에 노출됩니다.", "수명/복제를 검토합니다."]), c("HttpOnly cookie", "JavaScript document API에서 읽을 수 없도록 표시한 cookie입니다.", ["자동 request 첨부는 남습니다.", "CSRF/scope를 설계합니다."]), c("BFF", "browser 대신 same-origin backend가 OAuth/access tokens를 보관하고 API 요청을 중계하는 패턴입니다.", ["browser token 노출을 줄입니다.", "server session/CSRF/scale tradeoff가 있습니다."])],
    codeExamples: [node("security15-storage-decision", "browser credential storage decision table", "Security15StorageDecision.mjs", "storage별 script-readable/automatic-attachment threats와 required controls를 비교합니다.", String.raw`const options = [
  ["memory-access", true, false, "xss+short-lifetime"],
  ["web-storage-access", true, false, "xss+residue+avoid-long-lived"],
  ["httponly-refresh", false, true, "csrf+scope+rotation"],
  ["bff-session", false, true, "csrf+server-session"],
];
for (const row of options) console.log(row.join("|"));`, "memory-access|true|false|xss+short-lifetime\nweb-storage-access|true|false|xss+residue+avoid-long-lived\nhttponly-refresh|false|true|csrf+scope+rotation\nbff-session|false|true|csrf+server-session", ["html-webstorage", "owasp-html5", "owasp-session", "oauth-browser-bcp", "local-auth-store", "local-auth-api"])],
  }),
  appliedTopic({
    id: "logout-revoke-convergence", title: "logout을 client clear가 아니라 server revoke·multi-tab/device·cache convergence로 완성합니다",
    lead: "local storage와 UI state를 지웠다는 사실만으로 credential이 무효화되지 않으므로 refresh family/session, access window, pending requests와 모든 browser contexts를 함께 종료합니다.",
    mechanism: "logout current device는 server family/session revoke→readback→auth epoch increment→abort requests/refresh→memory/storage/cache clear→cross-tab signal→navigation 순서로 수행합니다. logout all/password/security incident는 account credential epoch와 other devices를 폐기합니다.",
    workflow: "idempotent logout command, server authoritative revoke, offline/pending fallback, BroadcastChannel/storage event without token payload, tab/device acknowledgements와 residue scan을 구현합니다.",
    invariants: "cross-tab message에 token을 넣지 않고 logout 후 stale refresh/response가 auth state를 복구하지 않으며 server revoke 실패를 성공으로 숨기지 않고 limited local containment와 retry guidance를 제공합니다.",
    edgeCases: "offline logout, closed tab, background/service worker, server 5xx, already revoked, multiple devices, cached protected data, browser history와 rolling server를 포함합니다.",
    failureModes: "client-only logout은 stolen refresh를 살려두고 다른 탭/worker의 interceptor가 새 access credential을 발급받아 화면이 다시 로그인 상태가 될 수 있습니다.",
    verification: "server revoke/readback, old refresh reuse, access expiry/revoke policy, pending races, multi-tab/device convergence, protected cache/storage/DOM residue와 retry idempotency를 실행합니다.",
    operations: "logout/revoke/readback latency, device/family count, stale response drops, tab convergence와 residue findings를 bounded metrics로 관찰합니다.",
    concepts: [c("logout convergence", "server credentials, client contexts, caches와 pending work가 모두 anonymous/revoked 상태로 수렴하는 성질입니다.", ["client clear보다 넓습니다.", "readback을 검증합니다."]), c("credential epoch", "account/device의 issued credentials가 어느 security generation에 속하는지 나타내는 server-side version입니다.", ["logout-all/revoke에 사용합니다.", "validator에서 확인합니다."]), c("cross-tab signal", "token 값 없이 auth epoch/logout event만 다른 browsing contexts에 전달하는 메시지입니다.", ["BroadcastChannel/storage event를 쓸 수 있습니다.", "sender도 local transition합니다."])],
    codeExamples: [node("security15-logout-convergence", "multi-context logout convergence model", "Security15LogoutConvergence.mjs", "server revoke와 세 tabs의 epoch/state/cache 수렴을 검증합니다.", String.raw`const server = { family: "active", epoch: 5 };
const tabs = [{ state: "auth", epoch: 5, cache: 3 }, { state: "auth", epoch: 5, cache: 2 }, { state: "auth", epoch: 5, cache: 1 }];
server.family = "revoked"; server.epoch++;
for (const tab of tabs) { tab.state = "anonymous"; tab.epoch = server.epoch; tab.cache = 0; }
console.log("server=" + server.family + "|epoch=" + server.epoch);
for (const [i,tab] of tabs.entries()) console.log("tab" + (i + 1) + "|" + tab.state + "|epoch=" + tab.epoch + "|cache=" + tab.cache);
console.log("converged=" + tabs.every(x => x.state === "anonymous" && x.epoch === server.epoch && x.cache === 0));`, "server=revoked|epoch=6\ntab1|anonymous|epoch=6|cache=0\ntab2|anonymous|epoch=6|cache=0\ntab3|anonymous|epoch=6|cache=0\nconverged=true", ["html-broadcast", "owasp-session", "rfc9700", "local-auth-store", "local-login-page"] )],
  }),
  appliedTopic({
    id: "token-qualification-matrix", title: "crypto profile·server family·React/browser를 attack/fault matrix로 함께 qualification합니다",
    lead: "token unit test만 통과하지 않고 malformed/substitution/replay/theft, concurrent refresh/logout, XSS/CSRF/storage와 key/DB/network failures를 end-to-end evidence에 연결합니다.",
    mechanism: "pure models는 claim/time/family, library tests는 signature/keys, Spring integration은 filters/context/status, transactional tests는 family/revoke, browser tests는 storage/interceptors/tabs, chaos tests는 partial failures와 rollback을 증명합니다.",
    workflow: "threat/control IDs→synthetic corpus→layered tests→expected public/internal results→state side effects→log/artifact scans→source/build/key/policy versions→recovery readback을 audit package로 만듭니다.",
    invariants: "test tokens/keys는 production 권한이 없고 denial/reuse 뒤 unintended child/mutation이 없으며 test double limitations와 actual crypto/browser evidence를 구분합니다.",
    edgeCases: "fuzzed JOSE, duplicate claims, unknown kid outage, two refresh transactions, lost response, offline/reload, logout race, old client/new server와 clock jump를 포함합니다.",
    failureModes: "decode/verify happy path만 검사하면 token substitution, family fork, retry loop와 browser credential exposure를 놓치고 scanner green이 business correctness를 증명하지 않습니다.",
    verification: "known-answer crypto, negative claims, concurrent DB CAS, Spring filter/problem, real browser origins/storage, secret sink scans, canary/rollback and incident drill을 실행합니다.",
    operations: "matrix/control coverage, unexpected accepts, family forks, client loops, sink findings, flaky/disabled tests와 evidence age를 release gate로 관리합니다.",
    concepts: [c("token qualification", "crypto, protocol, state, client/browser와 operation layers에서 token architecture의 불변식을 증명하는 과정입니다.", ["unit test보다 넓습니다.", "artifact/version을 기록합니다."]), c("substitution test", "다른 issuer/audience/type/context의 valid token을 현재 verifier가 잘못 수락하지 않는지 확인하는 test입니다.", ["signature valid만으로 충분하지 않음을 증명합니다.", "profile을 고정합니다."]), c("family-fork test", "동일 refresh parent가 concurrency/partial failure로 둘 이상의 active child를 만들지 않는지 확인하는 test입니다.", ["CAS/transaction을 검증합니다.", "reconciliation도 포함합니다."])],
    codeExamples: [node("security15-qualification-gate", "end-to-end token qualification gate", "Security15QualificationGate.mjs", "crypto/profile/family/client/browser/incident evidence로 release를 판정합니다.", String.raw`const evidence = { cryptoVectors: true, claimNegatives: 100, unexpectedAccepts: 0, familyForks: 0, reuseDetected: true, singleFlight: true, logoutConverged: true, browserLeaks: 0, logLeaks: 0, rollbackVerified: true };
const pass = evidence.cryptoVectors && evidence.claimNegatives === 100 && evidence.unexpectedAccepts === 0 && evidence.familyForks === 0 && evidence.reuseDetected && evidence.singleFlight && evidence.logoutConverged && evidence.browserLeaks === 0 && evidence.logLeaks === 0 && evidence.rollbackVerified;
for (const [key,value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "cryptoVectors=true\nclaimNegatives=100\nunexpectedAccepts=0\nfamilyForks=0\nreuseDetected=true\nsingleFlight=true\nlogoutConverged=true\nbrowserLeaks=0\nlogLeaks=0\nrollbackVerified=true\nrelease=pass", ["rfc7515", "rfc7519", "rfc8725", "rfc9068", "spring-resource-jwt", "owasp-jwt", "react-effect", "axios-interceptors"])],
  }),
  appliedTopic({
    id: "token-theft-incident", title: "token/key theft를 containment·family revoke·key rotation·sink purge·readback으로 복구합니다",
    lead: "source의 credential logging risk처럼 노출 가능성을 발견하면 문자열을 삭제하는 patch만 하지 않고 credential class, exposure window와 verifier/sink 전체에 대응합니다.",
    mechanism: "access theft는 bounded expiry/revoke/risk step-up, refresh theft는 family/account revoke와 device reauthentication, signing key theft는 new key promotion, compromised key/token invalidation과 issuer-wide review가 필요합니다. logs/APM/artifacts/backups도 별도 containment/purge 대상입니다.",
    workflow: "detect→stop collection/use→preserve redacted evidence→classify credential/key/scope→revoke families/epochs→rotate keys/secrets→restrict/purge sinks→deploy fix→old credential rejection→canary scan→readback/postmortem을 실행합니다.",
    invariants: "실제 credential을 ticket/chat에 붙이지 않고 key rotation overlap이 compromised key 수락을 불필요하게 연장하지 않으며 command success가 아니라 각 verifier/sink의 actual state를 확인합니다.",
    edgeCases: "unknown exposure window, immutable backups, multiple regions, stale JWKS, offline clients, rolling instances, third-party APM, refresh family fork와 malicious insider를 포함합니다.",
    failureModes: "로그 line만 제거하면 이미 노출된 access/refresh/key와 exported copies가 유효하며 key만 rotate하고 refresh families를 살리면 stolen session이 계속 연장될 수 있습니다.",
    verification: "synthetic canary detection, revoke/epoch/key propagation, old token/family/key rejection, sink access/purge, new leak scans, client recovery와 incident RTO/RPO를 실행합니다.",
    operations: "incident class/scope, containment/revoke/rotate/purge/readback durations, verifier/sink coverage와 overdue actions를 security SLO로 운영합니다.",
    concepts: [c("token theft incident", "bearer/refresh token 또는 signing material이 비인가 주체에게 노출·사용될 수 있는 보안 사건입니다.", ["credential class별 대응이 다릅니다.", "값은 증거에 복사하지 않습니다."]), c("family revoke", "특정 refresh ancestry와 descendants를 모두 폐기해 session 연장을 막는 조치입니다.", ["device/account epoch와 연결할 수 있습니다.", "readback합니다."]), c("key compromise recovery", "compromised signing key를 retire하고 새 key를 배포하며 affected tokens/verifiers/caches를 안전하게 수렴시키는 절차입니다.", ["JWKS/cache를 포함합니다.", "issuer-wide blast radius를 평가합니다."])],
    codeExamples: [node("security15-incident-gate", "token theft recovery readback gate", "Security15IncidentGate.mjs", "credential/key/sink incident가 실제로 containment와 recovery됐는지 판정합니다.", String.raw`const recovery = { collectionStopped: true, familiesRevoked: true, accountEpochAdvanced: true, signingKeyRotated: true, compromisedKeyRejected: true, oldRefreshRejected: true, sinkCoverage: 100, newLeaks: 0, clientsRecovered: true, readbackVerified: true };
const pass = Object.entries(recovery).every(([key,value]) => key === "sinkCoverage" ? value === 100 : key === "newLeaks" ? value === 0 : value === true);
for (const [key,value] of Object.entries(recovery)) console.log(key + "=" + value);
console.log("incident=" + (pass ? "recovered" : "open"));`, "collectionStopped=true\nfamiliesRevoked=true\naccountEpochAdvanced=true\nsigningKeyRotated=true\ncompromisedKeyRejected=true\noldRefreshRejected=true\nsinkCoverage=100\nnewLeaks=0\nclientsRecovered=true\nreadbackVerified=true\nincident=recovered", ["rfc9700", "owasp-logging", "nist-ssdf", "local-jwt-filter", "local-auth-api"])],
  }),
  appliedTopic({
    id: "token-migration-operations", title: "token profile·storage·rotation changes를 shadow·dual-read·canary·rollback으로 운영합니다",
    lead: "algorithm/key/claims, refresh store와 React storage/client contract를 한 번에 바꾸지 않고 old/new token families와 clients가 공존하는 제한된 compatibility window를 설계합니다.",
    mechanism: "verifier는 old/new profiles를 explicit key/policy version으로 읽되 new issuer는 target만 발급하고, refresh rows는 versioned adapter/shadow compare 후 migrate합니다. client는 capability/version handshake와 safe logout fallback을 가집니다.",
    workflow: "inventory→new profile/store/client offline tests→new keys publish→shadow validation→new issue cohort→refresh/client canary→old issue stop→old family drain/revoke→key retire→reconciliation을 수행합니다.",
    invariants: "compatibility가 alg/key/profile wildcard가 아니고 old/new token types를 혼용하지 않으며 rollback이 credential logs/storage residue/family forks를 되살리지 않습니다.",
    edgeCases: "old SPA cache, mobile client, long refresh TTL, stale JWKS, rolling issuers/verifiers, DB schema rollback, lost response, offline device와 telemetry outage를 포함합니다.",
    failureModes: "verifier를 permissive하게 만들어 migration하면 substitution/downgrade가 생기고 code rollback만 하면 already-issued tokens, refresh families, caches와 client state가 되돌아가지 않습니다.",
    verification: "old/new profile differential, issue/verify matrix, family/store parity, client compatibility, unexpected accepts/forks/leaks, rollback/revoke/key/cache readback와 final drain을 실행합니다.",
    operations: "issue/verify profile/key versions, client/family versions, shadow mismatch, unexpected accept/deny, refresh errors, drain/revoke and reconciliation backlog를 운영합니다.",
    concepts: [c("token compatibility window", "old/new issuers, verifiers, refresh store와 clients가 명시된 profiles로 안전하게 공존하는 제한 기간입니다.", ["종료 조건을 둡니다.", "wildcard validation이 아닙니다."]), c("shadow validation", "현재 verifier decision은 유지하며 새 profile의 accept/reject를 side-effect 없이 병렬 계산하는 단계입니다.", ["unexpected accept를 찾습니다.", "token 값을 log하지 않습니다."]), c("credential reconciliation", "partial migration/rollback 뒤 tokens, families, keys, client state와 server policies 차이를 탐지·수렴시키는 과정입니다.", ["code rollback과 별도입니다.", "authoritative store를 정합니다."])],
  }),
  appliedTopic({
    id: "token-capstone-handoff", title: "token architecture package와 on-call theft drill로 module을 완성합니다",
    lead: "JWT cheat sheet를 복사하는 대신 source-backed current/target diagrams, profiles, lifecycle state machines, client contracts, tests, dashboards와 incident runbooks를 독립 학습·운영 가능한 package로 만듭니다.",
    mechanism: "package에는 token profiles/key topology, refresh schema/transactions, React auth machine/storage decision, logout convergence, problem catalog, control-evidence matrix, migration/incident ADRs와 residual risks를 포함합니다.",
    workflow: "current source facts→target controls→gap/migration backlog→qualification evidence→canary readiness→incident/on-call drill→owner acceptance→evidence expiry/revalidation을 완료합니다.",
    invariants: "실제 keys/tokens/routes/storage keys/user data가 문서에 없고 각 claim은 source/standard/test revision을 가지며 known risk와 test-double limitations를 숨기지 않습니다.",
    edgeCases: "new client/provider, signing algorithm migration, multi-region issuer, account recovery, compliance retention, team ownership change와 emergency exception을 포함합니다.",
    failureModes: "architecture diagram만 남기고 family transaction, client race, secret sinks와 incident readback을 누락하면 token theft/rollout 때 안전한 판단을 재현할 수 없습니다.",
    verification: "independent walkthrough, profile/family/client/browser tests, artifact/secret/link scans, on-call theft/key compromise drill, rollback and residual-risk owner signoff를 실행합니다.",
    operations: "doc/evidence age, profile/key/family/client revision drift, drills, incident SLO, residual risks/exceptions와 owner coverage를 periodic review합니다.",
    concepts: [c("token architecture package", "profiles, keys, lifecycles, client/state, controls, tests, operations와 incidents를 묶은 versioned documentation입니다.", ["source/evidence와 연결합니다.", "credential 값은 제외합니다."]), c("token readiness review", "crypto·protocol·state·browser·operations evidence로 production readiness를 판정하는 review입니다.", ["hard invariants를 사용합니다.", "known risks를 승인합니다."]), c("theft drill", "synthetic token/key 노출을 가정해 detect, revoke/rotate, sink containment, client recovery와 readback을 연습하는 절차입니다.", ["production credential을 쓰지 않습니다.", "RTO를 측정합니다."])],
    codeExamples: [node("security15-capstone-gate", "access-refresh-client capstone gate", "Security15CapstoneGate.mjs", "profiles, family, client, browser, logout, incident와 operations evidence를 최종 판정합니다.", String.raw`const readiness = { profiles: true, keyRollover: true, refreshAtomic: true, reuseDetection: true, clientSingleFlight: true, storageDecision: true, logoutConvergence: true, browserMatrix: true, secretFindings: 0, incidentDrill: true, rollback: true, ownerHandoff: true };
const pass = Object.entries(readiness).every(([key,value]) => key === "secretFindings" ? value === 0 : value === true);
for (const [key,value] of Object.entries(readiness)) console.log(key + "=" + value);
console.log("capstone=" + (pass ? "pass" : "block"));`, "profiles=true\nkeyRollover=true\nrefreshAtomic=true\nreuseDetection=true\nclientSingleFlight=true\nstorageDecision=true\nlogoutConvergence=true\nbrowserMatrix=true\nsecretFindings=0\nincidentDrill=true\nrollback=true\nownerHandoff=true\ncapstone=pass", ["rfc8725", "rfc9700", "spring-resource-jwt", "owasp-jwt", "owasp-html5", "owasp-logging", "react-effect", "axios-interceptors", "nist-ssdf"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["client auth state/storage/logout snapshot"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. 실제 storage key/token/user 값은 복사하지 않았습니다." },
  { id: "local-login-page", repository: "D:/dev/my-app03", path: "src/pages/LoginPage.jsx", usedFor: ["login/bootstrap/refresh/logout UI lifecycle"], evidence: "2026-07-14 read-only sanitized audit: 97 lines, 4,359 bytes, SHA-256 9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8. 실제 routes/credentials/user/provider data는 복사하지 않았습니다." },
  { id: "local-http", repository: "D:/dev/my-app03", path: "src/api/Http.jsx", usedFor: ["HTTP client instance boundary"], evidence: "2026-07-14 read-only sanitized audit: 18 lines, 872 bytes, SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987. 실제 base URL/config values는 복사하지 않았습니다." },
  { id: "local-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["request/response interceptor", "refresh/retry/logout client flow"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 token/storage key/routes/messages는 복사하지 않았습니다." },
  { id: "local-jwt-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtConfig.java", usedFor: ["server key/lifetime configuration snapshot"], evidence: "2026-07-14 read-only sanitized audit: 24 lines, 689 bytes, SHA-256 018CA97DE544B68571CF48E58BB737BF259040A5E22E5768D69E43F91BD4B5DD. 실제 secret/key/lifetime values는 복사하지 않았습니다." },
  { id: "local-jwt-util", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtUtil.java", usedFor: ["server issue/validate/refresh snapshot"], evidence: "2026-07-14 read-only sanitized audit: 76 lines, 2,817 bytes, SHA-256 305E21E9D9E251BA7B402BB275C951BBC021F6FB270D6895926AF0CBEFB1AF1D. 실제 claims/secret/token values는 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["bearer extraction/context/failure snapshot", "credential logging incident"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. 실제 Authorization/token/subject는 복사하지 않았습니다." },
  { id: "rfc7515", repository: "IETF RFC 7515", path: "rfc7515.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7515.html", usedFor: ["JWS protected header/signature semantics"], evidence: "JSON Web Signature 표준입니다." },
  { id: "rfc7519", repository: "IETF RFC 7519", path: "rfc7519.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7519.html", usedFor: ["JWT claims/time/audience semantics"], evidence: "JSON Web Token 표준입니다." },
  { id: "rfc8725", repository: "IETF RFC 8725", path: "rfc8725.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc8725.html", usedFor: ["JWT security best current practices"], evidence: "JSON Web Token Best Current Practices입니다." },
  { id: "rfc9068", repository: "IETF RFC 9068", path: "rfc9068.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9068.html", usedFor: ["JWT access-token profile/type/claims"], evidence: "JWT Profile for OAuth 2.0 Access Tokens 표준입니다." },
  { id: "rfc9700", repository: "IETF RFC 9700", path: "rfc9700.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9700.html", usedFor: ["OAuth security BCP, refresh rotation/replay"], evidence: "Best Current Practice for OAuth 2.0 Security입니다." },
  { id: "spring-resource-jwt", repository: "Spring Security reference", path: "servlet/oauth2/resource-server/jwt.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html", usedFor: ["Spring JWT decoder/validator/JWK rotation"], evidence: "Spring Security 공식 resource-server JWT reference입니다." },
  { id: "oauth-browser-bcp", repository: "IETF OAuth Working Group", path: "draft-ietf-oauth-browser-based-apps", publicUrl: "https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps", usedFor: ["browser app token/storage/BFF threats"], evidence: "IETF browser-based apps draft입니다; 최종 publication과 deployment support를 적용 시 다시 확인합니다." },
  { id: "react-effect", repository: "React official documentation", path: "reference/react/useEffect", publicUrl: "https://react.dev/reference/react/useEffect", usedFor: ["auth bootstrap/interceptor lifecycle and cleanup"], evidence: "React 공식 useEffect API입니다." },
  { id: "axios-interceptors", repository: "Axios official documentation", path: "docs/interceptors", publicUrl: "https://axios-http.com/docs/interceptors", usedFor: ["request/response interceptor behavior"], evidence: "Axios 공식 interceptor reference입니다." },
  { id: "zustand-persist", repository: "Zustand official documentation", path: "reference/middlewares/persist", publicUrl: "https://zustand.docs.pmnd.rs/reference/middlewares/persist", usedFor: ["client persistence lifecycle and migration context"], evidence: "Zustand 공식 persist middleware reference입니다." },
  { id: "html-webstorage", repository: "WHATWG HTML Standard", path: "multipage/webstorage.html", publicUrl: "https://html.spec.whatwg.org/multipage/webstorage.html", usedFor: ["Web Storage semantics"], evidence: "WHATWG HTML Web Storage standard입니다." },
  { id: "html-broadcast", repository: "WHATWG HTML Standard", path: "multipage/web-messaging.html#broadcasting-to-other-browsing-contexts", publicUrl: "https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts", usedFor: ["BroadcastChannel cross-context semantics"], evidence: "WHATWG HTML BroadcastChannel standard입니다." },
  { id: "owasp-jwt", repository: "OWASP Cheat Sheet Series", path: "JSON_Web_Token_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html", usedFor: ["JWT threats, storage and defensive handling"], evidence: "OWASP 공식 JSON Web Token guidance입니다." },
  { id: "owasp-html5", repository: "OWASP Cheat Sheet Series", path: "HTML5_Security_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", usedFor: ["browser storage/client-side security"], evidence: "OWASP 공식 HTML5 security guidance입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session/logout/credential lifecycle"], evidence: "OWASP 공식 session management guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["credential-safe logging and incident sinks"], evidence: "OWASP 공식 logging guidance입니다." },
  { id: "nist-ssdf", repository: "NIST SP 800-218", path: "sp/800/218/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/218/final", usedFor: ["secure development evidence and incident response"], evidence: "NIST 공식 Secure Software Development Framework publication입니다." },
];

const session = createExpertSession({
  inventoryId: "security-15-token-security-capstone", slug: "security-15-token-security-capstone", courseId: "devops", moduleId: "token-client-integration", order: 7,
  title: "access·refresh·React token security capstone", subtitle: "JOSE profile·key rollover와 atomic refresh family에서 React single-flight, storage/logout, theft incident와 reversible migration까지 end-to-end로 통합합니다.",
  level: "전문가", estimatedMinutes: 245,
  coreQuestion: "access/refresh/signing credentials가 issuer, server state, React/browser와 운영 경계를 오갈 때 theft·replay·race·rollback에도 안전하고 복구 가능한 하나의 architecture로 어떻게 설계할까요?",
  summary: "my-app03 auth store/login/HTTP/Auth interceptors 4개와 Boot4 JWT config/util/filter 3개를 read-only·sanitized audit해 localStorage, interceptor refresh/logout, server issue/validation과 token logging risk를 값 없이 end-to-end sequence로 복원합니다. source에 issuer/audience/type, atomic refresh family/reuse detection과 robust revoke가 모두 있다고 과장하지 않습니다. JWT/JWS profiles와 key rollover, atomic refresh transaction, React auth epoch/single-flight/safe replay, memory/Web Storage/HttpOnly/BFF decision, logout multi-tab/device convergence, full qualification, token/key theft incident, shadow migration와 architecture handoff를 IETF·Spring·React·Axios·Zustand·WHATWG·OWASP·NIST 근거 및 열 개 executable models로 완성합니다.",
  objectives: ["client-server token source path와 claim gaps를 redacted audit한다.", "access/refresh/signing key threat와 blast radius를 분리한다.", "alg/key/iss/aud/typ/time allowlist validator와 rollover를 설계한다.", "refresh family를 atomic rotation/reuse detection으로 구현한다.", "React auth epoch와 single-flight/safe replay를 적용한다.", "memory/storage/cookie/BFF를 XSS·CSRF threat로 결정한다.", "server revoke와 multi-tab/device logout convergence를 검증한다.", "crypto/state/browser/incident qualification matrix를 만든다.", "token/key theft를 revoke/rotate/purge/readback한다.", "old/new profiles/store/clients를 shadow/canary/rollback한다."],
  prerequisites: [{ title: "token security testing·theft incident recovery", reason: "token theft/replay, client storage, logout/revoke와 incident evidence를 개별적으로 검증할 수 있어야 capstone에서 issuer, family, React/browser와 operations를 통합할 수 있습니다.", sessionSlug: "security-14-token-testing-incident" }],
  keywords: ["JWT BCP", "access token profile", "JWS", "key rollover", "refresh rotation", "token family", "reuse detection", "auth epoch", "single-flight", "safe replay", "Web Storage", "HttpOnly", "BFF", "logout convergence", "token theft", "credential reconciliation"],
  topics,
  lab: { title: "access·refresh·React token architecture를 theft·race·rollback까지 qualification하기", scenario: "원본은 변경하지 않고 synthetic keys/tokens/accounts/devices와 disposable issuer/resource server/refresh store/React browser origins에서 normal, attack, concurrency, incident와 migration을 재현합니다.", setup: ["Java 21/Spring Security/JWT compatible issuer-resource fixtures", "disposable transactional refresh-family store", "React/Axios/Zustand-compatible browser fixture", "3 HTTPS origins and multiple browser contexts", "deterministic clock/key server/fault injector", "synthetic nonfunctional credentials and secret canaries", "immutable audit/rollback artifacts", "원본 7 files read-only"], steps: ["원본 hashes와 client→interceptor→filter→refresh/logout sequence를 redacted합니다.", "access/refresh/key assets, sinks, attacker capabilities와 blast radius를 threat model합니다.", "allowed alg/key/issuer/audience/type/time claim profile와 malformed/substitution corpus를 구현합니다.", "key publish/overlap/unknown-kid/cache/retire/compromise rollover를 검증합니다.", "refresh digest/family/parent/status schema와 atomic consume+child issue, lost-response/reuse/family revoke를 fault-test합니다.", "React auth epoch/bootstrap/single-flight/safe replay/logout state machine을 concurrent requests와 검증합니다.", "memory/Web Storage/HttpOnly/BFF decision을 XSS/CSRF/browser storage/sink matrix에서 검증합니다.", "server revoke, multi-tab/device/logout-all, protected caches와 pending requests의 convergence/readback을 실행합니다.", "token/key theft를 stop/revoke/rotate/sink contain-purge/old reject/client recover/readback합니다.", "old/new profile/store/client shadow/canary/rollback/reconciliation과 independent handoff를 완료합니다."], expectedResult: ["validator가 signature뿐 아니라 expected key/issuer/audience/type/time/token profile을 fail closed로 검증합니다.", "parallel/lost/replayed refresh가 family fork를 만들지 않고 theft reuse가 family/account revoke로 이어집니다.", "React concurrent 401가 하나의 refresh만 만들고 logout/new login epoch 뒤 stale response/replay가 폐기됩니다.", "storage/cookie/BFF 선택의 XSS/CSRF assumptions가 browser evidence와 연결되고 logout 뒤 모든 contexts/caches가 수렴합니다.", "token/key/log theft를 verifier와 sink readback까지 복구하고 old/new migration을 unexpected accept 없이 되돌릴 수 있습니다."], cleanup: ["synthetic keys/tokens/families/accounts/devices와 database를 폐기합니다.", "browser contexts/origins, interceptors, requests, clocks, JWKS caches와 fault workers를 종료합니다.", "captures/logs/artifacts를 secret scan/redaction 후 retention policy에 따라 삭제합니다.", "원본 7 files hash/status unchanged를 확인합니다."], extensions: ["DPoP/mTLS sender-constrained access tokens를 threat/qualification matrix에 추가합니다.", "Spring OAuth2 Resource Server로 custom filter migration을 canary합니다.", "hardware-backed signing/key management와 multi-region rollover를 구현합니다.", "continuous refresh-family anomaly detection과 automated incident containment를 운영합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "열 개 Node models를 실행하고 source/profile/family/client/storage/logout/qualification/incident/capstone evidence에 대응시키세요.", requirements: ["stdout 완전 일치", "source sequence", "risk tiers", "validator profile", "family model", "client machine", "storage decision", "logout convergence", "qualification", "incident", "capstone"], hints: ["Node models는 actual JOSE crypto, Spring filters, DB transactions, browser storage와 network를 대체하지 않습니다."], expectedOutcome: "각 credential/state boundary의 invariant와 actual integration evidence gap을 설명합니다.", solutionOutline: ["audit/threat→validate/rotate→client/browser/logout→qualify/incident/migrate 순서입니다."] },
    { difficulty: "응용", prompt: "localStorage+ad-hoc refresh client를 atomic family+BFF 또는 memory access architecture로 단계 migration하세요.", requirements: ["source claim", "token profiles", "key rollover", "family transaction", "auth epoch/single-flight", "storage/CSRF", "logout/revoke", "incident", "shadow rollback"], hints: ["storage 변경만 하고 refresh family/replay/server revoke를 그대로 두지 마세요."], expectedOutcome: "old clients를 지원하면서 credential exposure/race와 rollback risk를 줄이는 migration이 완성됩니다.", solutionOutline: ["inventory→server authority→client seam→shadow/canary→drain/reconcile 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 token security production standard와 theft runbook을 작성하세요.", requirements: ["profiles/keys", "access/refresh lifecycle", "server state/revoke", "client/browser storage", "single-flight/replay", "logout", "testing/evidence", "incident/rollback", "ownership/revalidation"], hints: ["JWT algorithm checklist보다 credential data flow와 recovery readback을 중심으로 작성하세요."], expectedOutcome: "여러 service/client가 같은 profiles, hard invariants와 incident response 기준을 공유합니다.", solutionOutline: ["threat/profile→state/client controls→evidence gate→operations/incident 순서입니다."] },
  ],
  nextSessions: ["security-16-oauth-authorization-code-pkce"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["실제 tokens, signing secrets/keys, storage keys, endpoint/base URLs, claims/subjects/users/providers/messages는 공개 content/examples/evidence에 복사하지 않았습니다.", "로컬 client의 localStorage/interceptor/refresh/logout 구조와 server issue/filter 구조를 관찰했지만 issuer/audience/type validation, atomic refresh-family rotation/reuse detection와 complete revoke가 구현됐다고 과장하지 않습니다.", "JwtRequestFilter의 Authorization header/token logging behavior는 credential disclosure incident risk이며 운영 노출 가능성이 있다면 collection stop, revoke/rotate, sink containment/purge와 verifier readback이 필요합니다.", "Node models는 actual JOSE library/keys, Spring filter/provider, transactional refresh store, React/Axios/browser storage/network를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
