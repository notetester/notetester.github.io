import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuthRefs = ["local-jwt-flow", "local-feature-flow", "local-auth-api", "local-auth-store", "local-login", "local-register", "local-profile", "local-navbar", "local-app"];

const topics = [
  appliedTopic({
    id: "source-auth-journey-audit", title: "원본 회원가입·로그인·프로필·navigation을 redacted auth journey로 감사합니다",
    lead: "파일별 함수 목록을 넘어 anonymous→registering→authenticated→profile editing→expired/recovering→logged out의 client/server/data 흐름을 복원합니다.",
    mechanism: "my-app03는 Auth API, auth store, Login/Register/Profile pages, Navbar와 App routes를 연결하고 REACT integration 문서는 JWT end-to-end flow를 설명합니다. source에는 token/password/user-related logic이 많으므로 공개 자료에는 실제 값·route·payload를 복사하지 않습니다.",
    workflow: "source hash, form fields, validation, request, response/token/user storage, navigation, profile mutation, refresh/logout, UI visibility, error/log와 cleanup을 sequence/state graph로 기록하고 server guarantee는 별도 확인합니다.",
    invariants: "원본은 변경하지 않고 actual identifiers, password/token, profile, route, endpoint와 response examples를 공개 fixture에 복사하지 않으며 client observation과 security recommendation을 구분합니다.",
    edgeCases: "direct deep link, duplicate submit, invalid/expired token, refresh race, profile conflict, account switch, back button, multi-tab과 offline을 포함합니다.",
    failureModes: "Navbar 표시나 client store boolean을 인증/인가 증명으로 취급하면 tampered state로 보호 API에 접근할 수 있다고 오해하고 late requests가 logout 뒤 data를 되살릴 수 있습니다.",
    verification: "source/auth call graph, state transitions, sensitive sinks, direct API authorization, navigation history, resource cleanup와 original hashes를 확인합니다.",
    operations: "journey step, stable failure/recovery code, auth epoch, route template와 correlation을 privacy-safe하게 추적하고 credential compromise runbook과 연결합니다.",
    concepts: [c("auth journey", "등록·인증·세션 복구·profile·logout에 걸친 사용자와 system state sequence입니다.", ["client/server를 함께 봅니다.", "happy path만이 아닙니다."]), c("client auth state", "UI/navigation/request coordination을 위한 browser의 current session view입니다.", ["server 권한 증명이 아닙니다.", "epoch와 lifecycle이 필요합니다."]), c("redacted sequence", "credential·PII·route 값을 제거하고 actor/action/state/failure만 보존한 흐름 evidence입니다.", ["source hash와 연결합니다.", "사고 노출을 확대하지 않습니다."])],
    codeExamples: [node("react41-auth-source-journey", "redacted auth source journey inventory", "React41AuthSourceJourney.mjs", "실제 값 없이 source components와 state transitions를 연결합니다.", String.raw`const journey = [
  ["register", "form", "auth-api", "anonymous"],
  ["login", "form", "auth-api+store", "authenticated"],
  ["profile", "page", "auth-api+store", "authenticated"],
  ["refresh", "http-policy", "auth-api+store", "recovering"],
  ["logout", "nav+store", "auth-api+purge", "anonymous"],
];
for (const row of journey) console.log(row.join("|"));
console.log("actual-values-copied=false");`, "register|form|auth-api|anonymous\nlogin|form|auth-api+store|authenticated\nprofile|page|auth-api+store|authenticated\nrefresh|http-policy|auth-api+store|recovering\nlogout|nav+store|auth-api+purge|anonymous\nactual-values-copied=false", localAuthRefs.concat(["owasp-authentication", "rfc9700"]))],
  }),
  appliedTopic({
    id: "registration-validation-enumeration", title: "회원가입을 client usability·server validation·enumeration-safe result로 설계합니다",
    lead: "required와 confirm check만으로 끝내지 않고 canonical identity, duplicate race, password manager, terms/consent와 server field problems를 처리합니다.",
    mechanism: "client validation은 즉각적 도움을 주지만 server가 authoritative schema, normalization, uniqueness와 business rules를 transaction에서 재검증합니다. duplicate identifier response와 recovery는 account enumeration/abuse를 고려해 safe wording와 rate controls를 가집니다.",
    workflow: "label/instructions/autocomplete, client schema, submit state, server RFC 9457-style field problems, duplicate/general messages, successful next step와 sensitive form cleanup을 state machine으로 연결합니다.",
    invariants: "password/confirmation을 persist/log/analytics에 넣지 않고 client validation을 우회해도 server가 invalid/duplicate/forbidden fields를 거부하며 partial account/profile이 남지 않습니다.",
    edgeCases: "Unicode normalization, case-fold identity, paste/password manager, weak/compromised password policy, double click, network timeout after commit와 invitation/consent를 포함합니다.",
    failureModes: "regex만 강하게 하고 server 재검증을 빼거나 정확한 account existence를 무제한 노출하면 data integrity와 enumeration risk가 생깁니다.",
    verification: "client/server schema parity, bypass/direct API, Unicode/duplicate concurrency, field/global errors, keyboard/screen reader/autocomplete와 secret sink scan을 실행합니다.",
    operations: "registration success/failure class, duplicate/rate-limit, abandoned step와 server transaction outcome을 PII 없이 관찰하고 reconciliation tool을 둡니다.",
    concepts: [c("canonical identity", "사용자 식별 입력을 비교·저장하기 위해 정의한 normalization/case policy의 결과입니다.", ["display value와 분리할 수 있습니다.", "server가 authoritative합니다."]), c("field problem", "특정 form control에 연결할 수 있는 safe validation error code/message입니다.", ["raw exception이 아닙니다.", "접근성 association이 필요합니다."]), c("account enumeration", "response timing/message/status 차이로 account 존재 여부를 추측하는 공격·privacy leak입니다.", ["safe response와 rate controls를 둡니다.", "지원 UX와 균형을 맞춥니다."])],
    codeExamples: [node("react41-registration-validator", "synthetic registration validation model", "React41RegistrationValidator.mjs", "민감 값을 출력하지 않고 normalization·confirmation·field allowlist 결과만 분류합니다.", String.raw`function validate(input) {
  const fields = [];
  const identity = input.identity.trim().normalize("NFKC").toLowerCase();
  if (!identity) fields.push("identity.required");
  if (input.password.length < 12) fields.push("password.policy");
  if (input.password !== input.confirmation) fields.push("confirmation.mismatch");
  const extra = Object.keys(input).filter((k) => !["identity", "password", "confirmation"].includes(k));
  if (extra.length) fields.push("payload.forbidden-field");
  return { identityPresent: Boolean(identity), codes: fields.sort() };
}
console.log(JSON.stringify(validate({ identity: "  SYNTHETIC  ", password: "short", confirmation: "different", role: "admin" })));
console.log("credential-output=false");`, "{\"identityPresent\":true,\"codes\":[\"confirmation.mismatch\",\"password.policy\",\"payload.forbidden-field\"]}\ncredential-output=false", ["html-forms", "owasp-authentication", "rfc9457", "local-register"])],
  }),
  appliedTopic({
    id: "login-state-machine-generic-failure", title: "로그인을 explicit state machine·generic failure와 bounded recovery로 구현합니다",
    lead: "loading/error boolean 두 개 대신 editing→submitting→authenticated 또는 rejected/rate-limited/unavailable/recovery states를 정의합니다.",
    mechanism: "login command는 current form snapshot과 operation ID를 갖고 server는 credential을 검증해 session/tokens를 발급합니다. client는 response schema, auth epoch와 intended navigation을 확인한 뒤 atomic commit하며 invalid credentials는 account 존재를 과도하게 드러내지 않습니다.",
    workflow: "autocomplete/current-password, keyboard submit, duplicate suppression, request deadline, typed problem, generic safe message, rate-limit/recovery link와 successful session bootstrap을 연결합니다.",
    invariants: "submitting 중 다른 operation 결과가 current form을 덮지 않고 password가 state persistence/log/URL에 없으며 client role/user fields가 server authorization을 대신하지 않습니다.",
    edgeCases: "double submit, Enter/button race, timeout after success, MFA/step-up, password expiry, rate limit, offline, account disabled와 clock skew를 포함합니다.",
    failureModes: "raw server error와 status를 그대로 보여 주거나 성공 response 일부를 먼저 store하면 half-authenticated UI와 enumeration/secret logging이 생깁니다.",
    verification: "state transition table, late/duplicate responses, invalid/rate/offline/timeout, safe messaging/timing, password manager와 no-sensitive-sink tests를 실행합니다.",
    operations: "login result class, operation latency, retry/rate/step-up—not identity—를 관찰하고 credential stuffing detection과 support recovery를 연결합니다.",
    concepts: [c("login operation", "한 번의 credential 제출과 terminal outcome을 operation ID로 추적하는 단위입니다.", ["duplicate/late result를 막습니다.", "credential은 telemetry에서 제외합니다."]), c("generic auth failure", "account 존재·정확한 credential 원인을 불필요하게 드러내지 않는 safe 로그인 실패입니다.", ["support/recovery action을 제공합니다.", "server code와 분리합니다."]), c("atomic session commit", "validated credential/session/user/bootstrap state를 한 epoch transition으로 반영하는 동작입니다.", ["partial auth를 피합니다.", "rollback/purge가 가능합니다."])],
    codeExamples: [node("react41-login-machine", "login operation state model", "React41LoginMachine.mjs", "stale/duplicate result를 거부하며 current login만 atomic success로 전환합니다.", String.raw`let state = { phase: "editing", op: null, epoch: 3 };
function start(id) { if (state.phase === "submitting") return false; state = { ...state, phase: "submitting", op: id }; return true; }
function settle(id, outcome) { if (state.op !== id || state.phase !== "submitting") return "stale"; state = outcome === "success" ? { phase: "authenticated", op: null, epoch: state.epoch + 1 } : { ...state, phase: "rejected", op: null }; return state.phase; }
console.log("start=" + start("op2"));
console.log("duplicate-start=" + start("op3"));
console.log("old-result=" + settle("op1", "success"));
console.log("current-result=" + settle("op2", "success"));
console.log("epoch=" + state.epoch);`, "start=true\nduplicate-start=false\nold-result=stale\ncurrent-result=authenticated\nepoch=4", ["owasp-authentication", "rfc9700", "local-login", "local-auth-api", "local-auth-store"])],
  }),
  appliedTopic({
    id: "session-token-client-boundary", title: "cookie·access/refresh token과 client store의 역할을 threat model로 구분합니다",
    lead: "토큰을 어디에 저장할지 단일 문장으로 답하지 않고 XSS, CSRF, replay, rotation, browser lifetime와 architecture를 비교합니다.",
    mechanism: "bearer token은 소유 자체가 권한 사용으로 이어질 수 있어 audience/scope/expiry/signature 검증은 resource server가 수행합니다. browser는 HttpOnly/Secure/SameSite cookie session 또는 memory/storage token 전략의 위협과 operational constraints를 명시하고 refresh는 rotation/reuse detection과 연결합니다.",
    workflow: "actors/assets/trust boundaries를 그리고 credential type별 issuer/audience/lifetime/storage/transmission/refresh/revoke/rotation/log prohibition을 표로 만들어 client store에는 최소 UI/session metadata만 둡니다.",
    invariants: "JWT decode 결과나 persisted client role만으로 authorization하지 않고 reusable token을 URL/log/analytics/source map에 넣지 않으며 logout/compromise에서 server revocation과 client purge를 모두 수행합니다.",
    edgeCases: "XSS, CSRF, same-site subdomain, copied token, clock skew, tab crash, browser restore, stolen refresh, device/session list와 key rotation을 포함합니다.",
    failureModes: "localStorage가 편하다는 이유만으로 risk를 생략하거나 HttpOnly cookie면 모든 CSRF/XSS 영향이 사라진다고 생각하면 방어가 불완전합니다.",
    verification: "token tamper/expiry/audience/scope, XSS/CSRF threat tests, storage/log/bundle scan, rotation/reuse, revoke/logout와 direct API authorization을 실행합니다.",
    operations: "session/token issuance/refresh/reuse/revoke—not token value—, device/session IDs, anomalies와 key/version을 관찰하고 revoke-all/rotate incident runbook을 둡니다.",
    concepts: [c("bearer token", "제시하는 주체가 사용할 수 있어 탈취 방지가 핵심인 access credential입니다.", ["RFC 6750 위협을 고려합니다.", "server가 검증합니다."]), c("refresh rotation", "refresh 사용 시 새 credential을 발급하고 이전 것을 폐기·reuse 탐지하는 lifecycle입니다.", ["single-flight와 연결합니다.", "server state가 필요할 수 있습니다."]), c("session metadata", "client UI가 세션 상태를 표현하는 최소 non-secret 정보와 epoch입니다.", ["token 자체와 분리합니다.", "authorization 증명이 아닙니다."])],
  }),
  appliedTopic({
    id: "profile-read-update-concurrency", title: "프로필 조회·편집을 draft·server version·field authorization으로 관리합니다",
    lead: "auth store user object를 input에 직접 mutation하지 않고 confirmed profile, edit draft, pending operation과 server version을 분리합니다.",
    mechanism: "profile query는 authenticated subject의 current representation을 반환하고 update는 allowlisted editable fields와 version/ETag precondition을 보냅니다. server가 subject/resource/fields를 검증하고 canonical result를 반환하며 client는 atomic cache/store commit합니다.",
    workflow: "profile schema에서 display/read-only/editable/sensitive fields를 분류하고 draft start/cancel/submit, 422 field errors, 401/403, 409/412 conflict와 refresh/reconciliation을 정의합니다.",
    invariants: "client가 subject ID/role/admin fields를 바꿔도 server가 거부하고 conflict가 newer profile을 조용히 덮지 않으며 cancel/error가 confirmed profile을 변형하지 않습니다.",
    edgeCases: "name/email normalization, profile missing, concurrent tab/device update, account deletion, token subject mismatch, partial response와 avatar upload를 포함합니다.",
    failureModes: "{...user,...form} 전체를 server에 보내면 mass assignment가 생기고 optimistic store patch만 성공 처리하면 server canonicalization/version과 divergence합니다.",
    verification: "editable field allowlist, ID/role tamper, two-client conflict, draft cancel/error, schema/canonical response, focus/status와 cache/store parity를 실행합니다.",
    operations: "profile query/update outcome, field category—not value—, conflict/reconciliation, auth epoch와 schema version을 관찰합니다.",
    concepts: [c("confirmed profile", "server가 현재 세션 subject에 대해 반환한 validated profile snapshot입니다.", ["edit draft와 분리합니다.", "version을 가집니다."]), c("editable field allowlist", "현재 operation에서 client가 변경을 요청할 수 있고 server가 허용하는 fields 목록입니다.", ["mass assignment를 막습니다.", "role별로 달라질 수 있습니다."]), c("profile version", "concurrent update precondition과 conflict detection에 쓰는 server-issued version/ETag입니다.", ["client time과 다릅니다.", "reconciliation에 사용합니다."])],
    codeExamples: [node("react41-profile-update", "profile field allowlist and version model", "React41ProfileUpdate.mjs", "synthetic patch에서 forbidden fields와 stale version을 stable result로 분류합니다.", String.raw`const current = { version: 7, displayName: "old", role: "member" };
function update(baseVersion, patch) {
  const allowed = new Set(["displayName"]); const forbidden = Object.keys(patch).filter((k) => !allowed.has(k));
  if (forbidden.length) return "forbidden:" + forbidden.sort().join(",");
  if (baseVersion !== current.version) return "conflict";
  return "accepted:v" + (current.version + 1);
}
console.log(update(7, { displayName: "synthetic" }));
console.log(update(7, { role: "admin" }));
console.log(update(6, { displayName: "synthetic" }));`, "accepted:v8\nforbidden:role\nconflict", ["owasp-authorization", "rfc9110", "local-profile", "local-auth-api"])],
  }),
  appliedTopic({
    id: "safe-return-navigation-deep-link", title: "로그인 전 deep link와 return navigation을 open redirect 없이 복구합니다",
    lead: "항상 home으로 보내거나 query의 returnTo를 그대로 navigate하지 않고 app-internal canonical destination과 replace/history policy를 검증합니다.",
    mechanism: "보호 route 진입 시 current internal path/search/hash를 state 또는 validated parameter로 보존하고 로그인 성공 뒤 same-origin/base-path allowlist를 통과한 destination만 사용합니다. external/protocol-relative/javascript-like targets는 safe default로 대체합니다.",
    workflow: "route guard/loader가 intended location과 auth requirement를 기록하고 login page가 operation ID와 연결하며 success에서 validation·authorization·resource existence를 다시 확인한 뒤 replace/push/focus/title을 처리합니다.",
    invariants: "return target이 credential/PII를 포함하지 않고 untrusted origin/protocol로 redirect하지 않으며 back button이 login↔protected loop를 만들지 않습니다.",
    edgeCases: "encoded protocol, //host, backslash, base path, nested search/hash, expired intended resource, role change, multiple login tabs와 OAuth callback을 포함합니다.",
    failureModes: "startsWith('/') 하나는 protocol-relative/encoding 우회를 놓칠 수 있고 raw full URL 저장은 query/token/referrer leak와 open redirect 위험을 만듭니다.",
    verification: "malicious/canonical URL corpus, history back/forward, expired/forbidden target, deep-link refresh, focus/title/status와 no-sensitive-URL tests를 실행합니다.",
    operations: "return accepted/rejected reason과 route template—not raw URL—, auth result와 navigation loops를 관찰하고 redirect kill switch를 둡니다.",
    concepts: [c("intended destination", "인증 전에 사용자가 접근하려던 app-internal route state입니다.", ["검증 후 사용합니다.", "민감 query를 피합니다."]), c("open redirect", "attacker-controlled target으로 사용자를 외부/위험 URL에 보내는 취약점입니다.", ["same-origin canonical allowlist를 씁니다.", "encoding 우회를 시험합니다."]), c("history replacement", "login 같은 중간 route를 history stack에서 대체해 back-loop를 줄이는 navigation 정책입니다.", ["항상 replace가 정답은 아닙니다.", "journey를 시험합니다."])],
    codeExamples: [node("react41-safe-return", "same-origin return target validator", "React41SafeReturn.mjs", "synthetic base에서 internal target만 canonical path로 허용합니다.", String.raw`const origin = "https://app.example.invalid";
function safe(target) {
  try { const url = new URL(target, origin); if (url.origin !== origin) return "/"; if (!url.pathname.startsWith("/app/")) return "/"; return url.pathname + url.search + url.hash; } catch { return "/"; }
}
for (const target of ["/app/profile?tab=edit", "https://evil.invalid/x", "//evil.invalid/x", "javascript:alert(1)", "/public"]) console.log(JSON.stringify(target) + "=>" + safe(target));`, "\"/app/profile?tab=edit\"=>/app/profile?tab=edit\n\"https://evil.invalid/x\"=>/\n\"//evil.invalid/x\"=>/\n\"javascript:alert(1)\"=>/\n\"/public\"=>/", ["url-standard", "owasp-unvalidated-redirects", "local-app", "local-login"])],
  }),
  appliedTopic({
    id: "refresh-expiry-offline-recovery", title: "세션 expiry·refresh·offline를 single-flight recovery state로 조율합니다",
    lead: "각 API 401에서 login으로 즉시 보내지 않고 refresh eligibility, one-flight, replay safety, deadline와 current auth epoch를 평가합니다.",
    mechanism: "auth coordinator는 active session epoch별 refresh promise를 하나만 만들고 eligible requests가 outcome을 기다립니다. success는 rotated session을 atomic commit하고 safe requests를 한 번 replay하며 failure/reuse/revocation은 purge와 reauthentication으로 전환합니다.",
    workflow: "bootstrap unknown/authenticated/anonymous, online/offline, expiring/recovering/revoked states를 만들고 refresh endpoint bypass, queue cancellation, return journey와 stale data display policy를 정의합니다.",
    invariants: "refresh endpoint가 자기 interceptor loop에 들어가지 않고 unsafe mutation을 blind replay하지 않으며 logout/account switch 뒤 late refresh가 credential/data를 commit하지 않습니다.",
    edgeCases: "multiple 401, refresh timeout after rotation, offline expiry, tab sleep, clock skew, reused refresh, server revoke와 multi-tab coordination을 포함합니다.",
    failureModes: "401마다 refresh/logout을 수행하면 stampede와 navigation flicker가 생기고 refresh failure를 무한 retry하면 locked session과 provider load를 키웁니다.",
    verification: "N concurrent 401 one refresh, success/failure/reuse/logout/epoch, offline pause/deadline, replay-safe matrix와 cache purge를 실행합니다.",
    operations: "refresh flight size/outcome/latency, queued/replayed/dropped, auth epoch/reuse/revoke signals를 관찰하고 session incident runbook을 둡니다.",
    concepts: [c("auth coordinator", "refresh, auth epoch, queued requests와 logout transition을 단일 정책으로 조율하는 client service입니다.", ["server 검증을 대체하지 않습니다.", "single owner입니다."]), c("session bootstrap", "앱 시작 시 persisted hint/cookie와 server validation으로 anonymous/authenticated를 확정하는 단계입니다.", ["unknown UI가 필요합니다.", "private cache를 격리합니다."]), c("replay eligibility", "refresh 뒤 original request를 자동 재실행해도 안전한지 정하는 method/idempotency/commit 정책입니다.", ["mutation uncertainty를 reconcile합니다.", "한도를 둡니다."])],
  }),
  appliedTopic({
    id: "logout-account-switch-purge", title: "logout·계정 전환을 server revoke와 client async/cache purge transaction으로 만듭니다",
    lead: "store boolean만 false로 바꾸지 않고 credential, query/store/persisted caches, in-flight work, navigation와 cross-tab session을 일관되게 종료합니다.",
    mechanism: "logout transaction은 auth epoch를 먼저 증가시켜 late commits를 거부하고 new requests를 차단한 뒤 server revoke/cookie clear, requests/refresh cancel, memory/persistent caches purge, UI/navigation reset과 cross-tab notification을 수행합니다.",
    workflow: "local logout과 all-sessions revoke의 availability/failure policy를 정의하고 cleanup stack이 각 resource를 best-effort로 제거하며 server result uncertainty를 diagnostics/reconciliation에 남깁니다.",
    invariants: "logout 후 이전 user/tenant data가 화면/storage/cache/history에 재등장하지 않고 server revoke 실패를 조용히 성공으로 숨기지 않으며 cleanup은 idempotent합니다.",
    edgeCases: "offline logout, close tab, refresh in flight, account B login before A cleanup, service worker/cache, back-forward cache와 multiple tabs를 포함합니다.",
    failureModes: "localStorage 한 key만 지우면 in-memory query/store와 cookies/requests가 남고 늦은 Promise가 old profile을 다시 넣을 수 있습니다.",
    verification: "logout at every request phase, account A→B, offline/revoke failure, cross-tab, back navigation, storage/cache/network/log scans와 baseline resources를 실행합니다.",
    operations: "logout/revoke/purge steps, residual canary, epoch drops와 recovery/reconciliation을 관찰하고 emergency revoke-all/cache reset을 둡니다.",
    concepts: [c("logout transaction", "server credential invalidation과 모든 client state/resource cleanup을 하나의 추적 가능한 종료 작업으로 묶은 것입니다.", ["부분 실패를 기록합니다.", "idempotent해야 합니다."]), c("epoch invalidation", "auth generation을 증가시켜 이전 async callback/result를 무효화하는 첫 단계입니다.", ["purge race를 막습니다.", "server revoke와 별개입니다."]), c("residual state", "logout 뒤 남을 수 있는 memory/storage/cache/history/service-worker의 이전 계정 data입니다.", ["canary로 검사합니다.", "계정 전환 보안에 중요합니다."])],
    codeExamples: [node("react41-logout-purge", "logout cleanup transaction model", "React41LogoutPurge.mjs", "epoch를 먼저 올리고 resources를 idempotently purge하는 순서를 실행합니다.", String.raw`let state = { epoch: 5, requests: 3, queryEntries: 4, persistedEntries: 2, user: true };
function logout() {
  state.epoch += 1;
  state.requests = 0; state.queryEntries = 0; state.persistedEntries = 0; state.user = false;
  return state;
}
console.log(JSON.stringify(logout()));
console.log(JSON.stringify(logout()));
console.log("late-epoch-accepted=" + (5 === state.epoch));`, "{\"epoch\":6,\"requests\":0,\"queryEntries\":0,\"persistedEntries\":0,\"user\":false}\n{\"epoch\":7,\"requests\":0,\"queryEntries\":0,\"persistedEntries\":0,\"user\":false}\nlate-epoch-accepted=false", ["owasp-session", "owasp-html5", "local-auth-store", "local-navbar", "local-auth-api"])],
  }),
  appliedTopic({
    id: "auth-forms-navigation-accessibility", title: "인증 form·navigation·session status를 접근성과 privacy UX로 설계합니다",
    lead: "폼이 submit된다는 사실을 넘어 accessible labels/autocomplete/errors, pending, focus, route title/status와 privacy-preserving feedback을 보장합니다.",
    mechanism: "username/password/new-password/current-password autocomplete tokens, visible label/instructions, field/global errors, aria-invalid/describedby, busy/status와 deterministic focus를 사용합니다. navigation 뒤 heading/title/focus와 session expiry/relogin status를 명확히 전달합니다.",
    workflow: "register/login/profile/logout별 keyboard journey와 accessible name/description, password reveal semantics, pending/cancel/error/success focus destination, history와 screen reader announcement를 표로 만듭니다.",
    invariants: "색상/placeholder만으로 label/error를 전달하지 않고 password를 DOM/log/clipboard에 불필요하게 남기지 않으며 generic security message와 actionable recovery를 균형 있게 제공합니다.",
    edgeCases: "password manager, paste, IME, Caps Lock, zoom/reflow, reduced motion, screen reader virtual cursor, timeout/relogin modal와 multiple errors를 포함합니다.",
    failureModes: "error text만 아래에 추가하면 control association/focus가 없고 login redirect 뒤 title/focus가 이전 route에 남아 assistive technology 사용자가 context를 잃습니다.",
    verification: "keyboard/password manager, accessible tree/name/description/status, focus/title/history, contrast/zoom, sensitive DOM/log scan와 manual assistive tests를 실행합니다.",
    operations: "validation/recovery abandonment, focus loss, repeated submit와 accessibility regressions를 privacy-safe하게 관찰하고 alternative recovery channel을 둡니다.",
    concepts: [c("autocomplete token", "browser/password manager가 form field 목적을 이해하도록 표준화된 autocomplete 값입니다.", ["current/new password를 구분합니다.", "보안·사용성을 돕습니다."]), c("auth status message", "session/login/logout 결과와 필요한 action을 focus 이동 없이 접근성 API에 전달하는 메시지입니다.", ["민감 원인을 숨깁니다.", "중복을 통제합니다."]), c("navigation focus", "client route 전환 뒤 새 page의 logical landmark/heading으로 context를 제공하는 focus 정책입니다.", ["title 갱신과 연결합니다.", "무조건 body로 보내지 않습니다."])],
  }),
  appliedTopic({
    id: "e2e-security-observability-recovery", title: "auth E2E·security negatives·privacy telemetry와 incident recovery를 완성합니다",
    lead: "mock login success에서 멈추지 않고 disposable identity/API server와 real browser에서 registration부터 revoke/logout까지 정상·공격·장애 흐름을 검증합니다.",
    mechanism: "model tests는 state/epoch, component tests는 form/a11y, contract tests는 HTTP/problems/tokens, browser E2E는 cookie/storage/navigation/multi-tab, security tests는 tamper/replay/CSRF/XSS/IDOR, canary는 production-like issuer/resource compatibility를 증명합니다.",
    workflow: "synthetic accounts와 short-lived sessions로 happy, invalid, expiry/refresh, profile conflict, revoke, logout/account switch와 browser close/reopen matrix를 만들고 traces/artifacts를 secret/PII redaction합니다.",
    invariants: "tests가 production credential/real PII를 사용하지 않고 retry/sleep 운에 의존하지 않으며 screenshots/traces/logs에 password/token/profile values가 없습니다.",
    edgeCases: "issuer/key rotation, clock skew, rate limit, partial outage, email/service dependency, compromised refresh, old app version와 disaster rollback을 포함합니다.",
    failureModes: "UI happy E2E 하나는 direct API/security/session races를 놓치고 full network/storage trace를 무제한 보존하면 test가 credential leak source가 됩니다.",
    verification: "state/component/contract/browser/security/a11y/load/canary, artifact secret scan, revoke/rotate/cache purge, rollback and account reconciliation rehearsal를 실행합니다.",
    operations: "registration/login/refresh/profile/logout funnel, stable failures, security signals, latency/SLO와 build/issuer/key/policy version을 alert·owner·runbook에 연결합니다.",
    concepts: [c("synthetic account", "test 전용 non-person identity와 controlled lifecycle을 가진 계정입니다.", ["production user를 쓰지 않습니다.", "cleanup/expiry를 둡니다."]), c("auth canary", "최소 synthetic journey로 issuer/resource/client compatibility를 지속 검증하는 production-like probe입니다.", ["credential access를 제한합니다.", "rate/noise를 통제합니다."]), c("account reconciliation", "timeout/partial failure 뒤 account/session/profile server state와 client 기대를 비교·복구하는 절차입니다.", ["blind retry와 다릅니다.", "감사 evidence를 남깁니다."])],
    codeExamples: [node("react41-auth-release-gate", "integrated auth journey release gate", "React41AuthReleaseGate.mjs", "기능·security·a11y·privacy·recovery evidence로 release를 판정합니다.", String.raw`const report = { register: true, login: true, refreshSingleFlight: true, profileConflict: true, directAuthz: true, logoutPurge: true, a11y: true, secretFindings: 0, rollbackReady: true };
const pass = Object.entries(report).every(([key, value]) => key === "secretFindings" ? value === 0 : value === true);
for (const [key, value] of Object.entries(report)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "register=true\nlogin=true\nrefreshSingleFlight=true\nprofileConflict=true\ndirectAuthz=true\nlogoutPurge=true\na11y=true\nsecretFindings=0\nrollbackReady=true\nrelease=pass", ["rfc7519", "rfc6750", "rfc9700", "owasp-authentication", "owasp-session", "owasp-authorization", "wcag-errors", "wcag-status", "local-jwt-flow", "local-feature-flow"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-jwt-flow", repository: "D:/dev/REACT", path: "docs/integration/react-springboot-jwt-flow.md", usedFor: ["React/Spring Boot JWT sequence", "client/server file flow", "failure/refresh context"], evidence: "2026-07-14 read-only sanitized audit: 202 lines, 10,116 bytes, SHA-256 7287E0FA7A3A43E37DA0FEF8FF378CEABB0CE2EDB8404FBF2ACB94C0AE89FE97. actual token/password/user/routes/payloads는 복사하지 않았습니다." },
  { id: "local-feature-flow", repository: "D:/dev/REACT", path: "docs/integration/code-flow-by-feature.md", usedFor: ["registration/login/profile/logout code-flow provenance"], evidence: "2026-07-14 read-only sanitized audit: 568 lines, 32,140 bytes, SHA-256 546F6BECA265FB69250102BF8406C62D818D07F9258C44B7C23068C240E5BD62. actual credentials/PII/endpoints는 복사하지 않았습니다." },
  { id: "local-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["register/login/profile/refresh/logout adapters", "token/sensitive lifecycle audit"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. actual token/password/user/payload/routes는 복사하지 않았습니다." },
  { id: "local-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["client auth state", "login/logout/profile persistence boundary"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. actual user/storage values는 복사하지 않았습니다." },
  { id: "local-login", repository: "D:/dev/my-app03", path: "src/pages/LoginPage.jsx", usedFor: ["login form/state/navigation", "error UX audit"], evidence: "2026-07-14 read-only sanitized audit: 97 lines, 4,359 bytes, SHA-256 9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8. actual credentials/routes/messages는 복사하지 않았습니다." },
  { id: "local-register", repository: "D:/dev/my-app03", path: "src/pages/RegisterPage.jsx", usedFor: ["registration validation/submit", "field error UX"], evidence: "2026-07-14 read-only sanitized audit: 96 lines, 4,659 bytes, SHA-256 97E846CDDF471EA415ACB659E344B63889B2364D1A256876816F08B8891D71C4. actual identity/password/messages는 복사하지 않았습니다." },
  { id: "local-profile", repository: "D:/dev/my-app03", path: "src/pages/ProfilePage.jsx", usedFor: ["profile read/edit/delete flow", "draft/authorization audit"], evidence: "2026-07-14 read-only sanitized audit: 155 lines, 6,304 bytes, SHA-256 5A3ED767BA9BEA73D2D76C48266188F73D0570C93AE59DB51179638E24BE567D. actual profile/route/message values는 복사하지 않았습니다." },
  { id: "local-navbar", repository: "D:/dev/my-app03", path: "src/components/Navbar.jsx", usedFor: ["auth-visible navigation", "logout trigger"], evidence: "2026-07-14 read-only sanitized audit: 51 lines, 2,138 bytes, SHA-256 5785D2A37FDDD6A0EF397F92460A2CE9958F0719211CFFC1E69992C880806880. actual labels/routes/user values는 복사하지 않았습니다." },
  { id: "local-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["route/layout/auth bootstrap integration"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. actual routes/components values는 복사하지 않았습니다." },
  { id: "rfc7519", repository: "IETF RFC 7519", path: "rfc7519.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7519.html", usedFor: ["JWT claims and validation context"], evidence: "JSON Web Token 표준입니다." },
  { id: "rfc6750", repository: "IETF RFC 6750", path: "rfc6750.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6750.html", usedFor: ["bearer token usage/threat context"], evidence: "OAuth 2.0 Bearer Token Usage 표준입니다." },
  { id: "rfc9700", repository: "IETF RFC 9700", path: "rfc9700.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9700.html", usedFor: ["OAuth 2.0 security best current practice", "redirect/token threats"], evidence: "OAuth 2.0 Security Best Current Practice입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["profile preconditions/status semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["safe structured form/API problems"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "url-standard", repository: "WHATWG URL Standard", path: "", publicUrl: "https://url.spec.whatwg.org/", usedFor: ["return URL parsing/canonicalization"], evidence: "WHATWG URL 표준입니다." },
  { id: "html-forms", repository: "WHATWG HTML Standard", path: "forms", publicUrl: "https://html.spec.whatwg.org/multipage/forms.html", usedFor: ["form labels/autocomplete/validation semantics"], evidence: "WHATWG HTML forms 표준입니다." },
  { id: "owasp-authentication", repository: "OWASP Cheat Sheet Series", path: "Authentication_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["authentication responses/password/account protections"], evidence: "OWASP 공식 authentication guidance입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session lifecycle/logout/cookie security"], evidence: "OWASP 공식 session management guidance입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["server-side object/field authorization"], evidence: "OWASP 공식 authorization guidance입니다." },
  { id: "owasp-html5", repository: "OWASP Cheat Sheet Series", path: "HTML5_Security_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", usedFor: ["browser storage/client security"], evidence: "OWASP 공식 HTML5 security guidance입니다." },
  { id: "owasp-unvalidated-redirects", repository: "OWASP Cheat Sheet Series", path: "Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", usedFor: ["safe return URL/open redirect prevention"], evidence: "OWASP 공식 redirect guidance입니다." },
  { id: "wcag-errors", repository: "W3C WAI WCAG", path: "Understanding/error-identification", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html", usedFor: ["accessible form error identification"], evidence: "W3C WAI 공식 WCAG guidance입니다." },
  { id: "wcag-status", repository: "W3C WAI WCAG", path: "Understanding/status-messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["login/logout/profile status messages"], evidence: "W3C WAI 공식 WCAG status guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-41-integrated-auth-user-flow", slug: "react-41-integrated-auth-user-flow", courseId: "react", moduleId: "react-integrated-app-quality", order: 1,
  title: "통합 인증·사용자 여정", subtitle: "회원가입·로그인·프로필·세션 복구·logout을 state, navigation, token lifecycle, 접근성, server authorization과 incident recovery로 완성합니다.",
  level: "고급", estimatedMinutes: 150,
  coreQuestion: "React 사용자 인증 흐름을 편리한 UI에 그치지 않고 credential과 private data의 전체 생명주기, concurrency, accessibility와 복구 가능성까지 어떻게 검증할까요?",
  summary: "REACT JWT/feature-flow 문서와 my-app03 Auth API/store, Login/Register/Profile, Navbar/App 9개 sources를 read-only·sanitized 감사해 registration→login→profile→refresh→logout의 실제 구조를 보존합니다. 실제 credentials, PII, routes, endpoints와 payloads는 복사하지 않습니다. registration validation/enumeration, login machine, token/session threat boundaries, versioned profile, safe return navigation, refresh recovery, logout/account purge, accessible/privacy UX와 E2E/security/operations를 IETF·WHATWG·OWASP·W3C 근거와 일곱 executable models로 확장합니다.",
  objectives: ["원본 auth journey와 sensitive data flow를 redacted audit한다.", "registration client/server validation과 enumeration-safe recovery를 구현한다.", "login을 operation state machine과 atomic session commit으로 만든다.", "cookie/token/client store 역할을 threat model로 구분한다.", "profile draft/version/field authorization을 검증한다.", "deep-link return navigation을 open redirect 없이 복구한다.", "refresh/expiry/offline를 single-flight auth coordinator로 조율한다.", "logout/account switch에서 server revoke와 모든 client state를 purge한다.", "auth forms/navigation accessibility, privacy, E2E와 incident recovery를 운영한다."],
  prerequisites: [{ title: "Router·HTTP·server state capstone", reason: "route lifecycle, typed HTTP, query/mutation cache, auth-scoped invalidation과 navigation/error recovery를 알아야 통합 인증 여정을 중복 없이 안전하게 조립할 수 있습니다.", sessionSlug: "react-40-router-network-capstone" }],
  keywords: ["registration", "login", "JWT", "session", "refresh token", "profile", "open redirect", "auth epoch", "logout", "account switch", "accessibility", "privacy"],
  topics,
  lab: { title: "원본 my-app03 인증 여정을 production-like browser/API에서 qualification하기", scenario: "원본 files는 변경하지 않고 synthetic accounts와 disposable identity/resource server에서 register→login→deep link→profile→expiry/refresh→logout/account switch를 재현합니다.", setup: ["Node 20 이상", "React browser fixture", "disposable identity/resource servers", "short-lived synthetic sessions", "deferred refresh/profile responses", "keyboard/screen reader tooling", "secret artifact scanner", "원본 9 files read-only"], steps: ["원본 source hashes와 redacted auth state/sequence/sensitive sink graph를 기록합니다.", "registration client/server schema, duplicate/enumeration/rate/field errors를 검증합니다.", "login operation state, atomic session/bootstrap과 generic failure를 구현합니다.", "cookie/token/store strategy threat model과 storage/log/bundle scans를 실행합니다.", "versioned profile draft/update/conflict와 field/object authorization을 시험합니다.", "deep-link intended destination corpus와 history/focus/title/status를 검증합니다.", "N concurrent 401, single refresh, replay-safe queue, offline/logout/epoch races를 실행합니다.", "logout/revoke/account A→B/cross-tab/back navigation과 residual state canary를 검증합니다.", "keyboard/password manager/zoom/screen-reader auth journey와 sensitive DOM/artifact scan을 실행합니다.", "issuer/key rotation, revoke/rotate/cache purge, canary, rollback과 account reconciliation runbook을 rehearsal합니다."], expectedResult: ["client UI/store tampering으로 protected server operation을 수행할 수 없습니다.", "동시 login/refresh/profile operations에서 stale/duplicate result와 half-authenticated state가 없습니다.", "credentials/PII가 URL, persistence, logs, screenshots, traces와 bundles에 노출되지 않습니다.", "deep link, error, expiry, profile conflict와 logout이 keyboard/screen reader에도 명확하고 복구 가능합니다.", "revoke/rotate/logout/rollback 이후 server/client/account states가 reconciliation evidence와 함께 합의됩니다."], cleanup: ["synthetic accounts/sessions/tokens, identity/resource servers와 test data를 revoke/delete합니다.", "requests, refresh queues, timers/listeners, query/store/persistent caches와 browser history/storage를 제거합니다.", "screenshots/traces/logs/secret canaries를 retention policy에 따라 폐기합니다.", "원본 9 files hash/status unchanged를 확인합니다."], extensions: ["MFA/WebAuthn/step-up journey와 recovery codes를 추가합니다.", "multiple device/session management와 remote revoke를 구현합니다.", "OAuth authorization code+PKCE login과 local credential login을 비교합니다.", "auth SLO/security signal/account reconciliation dashboard를 구축합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 실제 browser/server auth journey와 대응시키세요.", requirements: ["stdout 완전 일치", "redacted source journey", "registration codes", "login machine", "profile version", "safe return", "logout purge", "release gate", "model 범위"], hints: ["Node model을 실제 JWT validation/server authorization/browser cookie security evidence라고 표현하지 마세요."], expectedOutcome: "등록부터 revoke/logout까지 client/server state와 credential lifecycle을 설명합니다.", solutionOutline: ["audit→register/login→session/profile/nav→refresh/logout→qualify/recover 순서입니다."] },
    { difficulty: "응용", prompt: "원본 my-app03 인증 여정을 production-safe하게 재설계하세요.", requirements: ["state machines", "server validation/authz", "token/session threat model", "safe navigation", "single-flight refresh", "profile conflict", "logout purge", "a11y/privacy", "E2E/incident"], hints: ["isLoggedIn과 decoded role만으로 보호를 구현하지 마세요."], expectedOutcome: "실패·공격·계정 전환에도 private data와 권한이 올바른 lifecycle을 지킵니다.", solutionOutline: ["threat/sequence→contracts→guards/coordinator→fault/security tests→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 frontend authentication journey standard를 작성하세요.", requirements: ["registration/login", "credential storage/refresh", "profile/authz", "navigation", "logout/revoke", "a11y/privacy", "tests/telemetry", "incident reconciliation"], hints: ["form 구현 지침에서 끝내지 말고 server issuer/resource와 recovery ownership까지 정의하세요."], expectedOutcome: "모든 auth UI가 동일한 security·accessibility·recovery evidence로 review됩니다.", solutionOutline: ["identify assets→model states→validate/authorize→isolate/purge→observe/recover 순서입니다."] },
  ],
  nextSessions: ["react-42-integrated-guestbook-crud"], sources,
  sourceCoverage: { filesRead: 9, filesUsed: 9, uncoveredNotes: ["원본 docs/source의 actual token/password/user/profile/routes/endpoints/payload/messages는 공개 content에 복사하지 않았습니다.", "client auth store/Navbar/route behavior를 관찰했지만 server-side authentication/authorization/token validation/rotation이 모두 보장된다고 과장하지 않습니다.", "JWT/client storage strategy는 threat model과 server architecture에 따라 선택해야 하며 원본 snapshot을 current recommendation으로 제시하지 않습니다.", "Node models는 actual browser cookie/storage, React Router, Axios/query cache, issuer/resource server cryptography/authorization과 multi-tab races를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
