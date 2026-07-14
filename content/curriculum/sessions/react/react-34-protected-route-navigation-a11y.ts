import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuditRefs = ["local-router-guide", "local-myapp02-navbar", "local-myapp03-app", "local-private-route", "local-myapp03-navbar", "local-auth-store", "local-login-page"];

const topics = [
  appliedTopic({
    id: "source-protected-navigation-audit", title: "원본 guard·auth store·navigation을 trust와 accessibility graph로 감사합니다",
    lead: "화면이 숨겨지고 redirect된다는 데서 멈추지 않고 어떤 state를 신뢰하며 누가 server 권한을 검사하고 navigation 변화가 keyboard·assistive technology에 어떻게 전달되는지 복원합니다.",
    mechanism: "my-app03 App은 시작 effect에서 browser storage를 읽어 auth store를 갱신하고 PrivateRoute는 store boolean 또는 storage item 존재만으로 children/redirect를 결정합니다. Navbar는 auth state로 links를 조건부 표시하고 logout 뒤 programmatic navigation을 수행하며 Login page는 credential submission과 local persistence를 수행합니다. 원본에는 pending tri-state, validated return URL, focus/title/status policy가 없습니다.",
    workflow: "auth source, bootstrap, guard decision, link visibility, login/logout redirect, persisted fields, API/server authorization, focus/title/status/keyboard와 cleanup을 graph로 만들고 client convenience와 security enforcement를 색으로 분리합니다.",
    invariants: "원본 일곱 files는 read-only이고 실제 route, storage key, member field, user, endpoint, credential/token/domain/UI values는 공개 fixture에 복사하지 않습니다.",
    edgeCases: "cold reload, corrupted/expired storage, token without user, role downgrade, logout failure, two tabs, direct URL, browser back, pending navigation와 assistive technology를 포함합니다.",
    failureModes: "storage item 존재를 authentication proof로 취급하면 forged/stale 값이 UI guard를 통과하고 hidden NavLink를 authorization으로 오해하면 direct API/resource access가 남습니다.",
    verification: "source hashes, auth state/route graph, storage readers/writers, server calls, client-only decision points, focus/title/status inventory와 original worktree unchanged를 확인합니다.",
    operations: "guard phase, route template, server auth outcome와 accessibility fallback만 low-cardinality로 관찰하고 token/user/target URL은 기록하지 않습니다.",
    concepts: [c("client route guard", "render 또는 navigation 전에 client auth state를 보고 UI route 접근을 조정하는 장치입니다.", ["UX control입니다.", "server authorization을 대체하지 않습니다."]), c("auth bootstrap", "app 시작 시 server session과 client state를 확인해 unknown에서 authenticated/anonymous로 전환하는 과정입니다.", ["pending phase가 필요합니다.", "stale persistence를 검증합니다."]), c("navigation accessibility graph", "route 변화가 title, heading, focus, status와 keyboard order에 미치는 관계입니다.", ["guard redirect도 포함합니다.", "실제 browser에서 시험합니다."])],
    codeExamples: [node("react34-source-audit", "sanitized guard/navigation capability inventory", "React34SourceAudit.mjs", "실제 values 없이 원본에서 관찰한 auth/navigation capability와 production gaps를 출력합니다.", String.raw`const observed = {
  storageBootstrap: true,
  booleanAuthStore: true,
  wrapperGuard: true,
  conditionalLinks: true,
  programmaticLogoutNavigation: true,
  pendingAuthPhase: false,
  serverAuthorizationInGuard: false,
  validatedReturnTarget: false,
  navigationA11yPolicy: false,
};
for (const key of Object.keys(observed).sort()) console.log(key + "=" + observed[key]);
console.log("private-values-copied=false");`, "booleanAuthStore=true\nconditionalLinks=true\nnavigationA11yPolicy=false\npendingAuthPhase=false\nprogrammaticLogoutNavigation=true\nserverAuthorizationInGuard=false\nstorageBootstrap=true\nvalidatedReturnTarget=false\nwrapperGuard=true\nprivate-values-copied=false", localAuditRefs.concat(["rr-modes", "rr-route-object", "owasp-authorization", "owasp-session"]))],
  }),
  appliedTopic({
    id: "auth-bootstrap-tristate", title: "auth를 unknown·authenticated·anonymous tri-state와 session generation으로 모델링합니다",
    lead: "첫 render의 false를 로그아웃으로 단정해 sign-in 화면으로 튕겼다가 되돌아오는 flicker를 막고 persisted hint와 server-confirmed session을 분리합니다.",
    mechanism: "auth state는 unknown/bootstrap, authenticated principal, anonymous와 terminal error를 구분하며 browser persistence는 UX hint일 뿐 authority가 아닙니다. bootstrap request가 끝날 때 current generation/account와 일치하는 결과만 commit하고 pending 동안 보호 content나 anonymous redirect를 성급히 렌더하지 않습니다.",
    workflow: "app/root loader에서 session 확인을 시작하고 timeout/abort/refresh를 처리해 principal 최소 public fields와 expiry/version을 store에 넣으며 stale/corrupt persistence는 purge합니다.",
    invariants: "unknown을 anonymous로 취급하지 않고 principal과 authenticated flag가 모순되지 않으며 session credential은 URL/log/long-lived general store에 복제하지 않습니다.",
    edgeCases: "offline startup, expired/revoked session, malformed storage, slow refresh, simultaneous tabs, account switch, server 401/503, abort와 clock skew를 포함합니다.",
    failureModes: "boolean 하나는 loading과 anonymous를 구분하지 못해 redirect loop/flicker를 만들고 persisted user만 복원하면 server에서 이미 revoke된 권한을 UI가 유지합니다.",
    verification: "transition table, invalid event negatives, cold/warm reload, slow/abort/401/503, stale generation, two tabs와 sensitive sink scan을 실행합니다.",
    operations: "bootstrap duration, terminal phase/reason, refresh/revoke와 stale-discard만 관찰하고 principal/credential values는 제외합니다.",
    concepts: [c("auth tri-state", "session 확인 전 unknown, 확인된 authenticated와 anonymous를 분리한 상태 모델입니다.", ["flicker를 막습니다.", "error/retrying을 확장할 수 있습니다."]), c("persisted hint", "빠른 UX를 돕지만 server 확인 전 신뢰할 수 없는 client 저장 정보입니다.", ["authority가 아닙니다.", "만료/스키마를 검증합니다."]), c("session generation", "auth bootstrap/refresh 순서를 식별해 older response commit을 막는 번호입니다.", ["account switch를 보호합니다.", "abort와 함께 씁니다."])],
    codeExamples: [node("react34-auth-tristate", "auth bootstrap state machine", "React34AuthTristate.mjs", "unknown에서만 current generation 결과를 commit하고 stale event를 거부합니다.", String.raw`let auth = { phase: "unknown", generation: 2 };
function resolve(event) {
  if (event.generation !== auth.generation || auth.phase !== "unknown") return "stale";
  auth = event.ok ? { phase: "authenticated", generation: auth.generation } : { phase: "anonymous", generation: auth.generation };
  return auth.phase;
}
console.log("old=" + resolve({ generation: 1, ok: true }));
console.log("current=" + resolve({ generation: 2, ok: true }));
console.log("duplicate=" + resolve({ generation: 2, ok: false }));
console.log("phase=" + auth.phase);`, "old=stale\ncurrent=authenticated\nduplicate=stale\nphase=authenticated", ["local-myapp03-app", "local-auth-store", "local-private-route", "rr-route-object", "owasp-session"])],
  }),
  appliedTopic({
    id: "client-guard-server-authorization", title: "client guard와 server authentication·authorization을 분리합니다",
    lead: "보호 page를 렌더하지 않는 client decision은 정보 노출을 줄이는 UX일 뿐 resource 접근 권한은 server가 매 요청의 session과 object/action context로 결정해야 합니다.",
    mechanism: "client guard는 unknown/pending/anonymous/authenticated에 따라 pending shell, redirect 또는 page를 선택합니다. server는 credential 검증(authentication) 뒤 principal이 requested resource/action/field를 허용받았는지 authorization하고 401과 403을 구분합니다. link visibility는 affordance이지 control이 아닙니다.",
    workflow: "route metadata에 login-required UX를 선언하되 loader/API에서 session과 resource policy를 검사하고 deny-by-default, least privilege와 object-level checks를 적용하며 client는 safe typed 401/403 response만 소비합니다.",
    invariants: "storage token·client role·route param·hidden link가 server allow 근거가 아니며 authenticated principal도 모든 resource/action을 허용받지 않습니다.",
    edgeCases: "direct API call, changed route key, horizontal/vertical privilege, role downgrade, deleted membership, stale tab, replay, mass assignment와 admin-only field를 포함합니다.",
    failureModes: "guard wrapper만 추가하면 API는 열려 있을 수 있고 user-owned string 비교나 client role은 변조 가능하며 401/403을 모두 sign-in redirect로 처리하면 forbidden loop와 context loss가 생깁니다.",
    verification: "no/malformed/expired credential, other resource ID, each role/action/field, direct HTTP, hidden-link bypass, 401/403 UI, audit log와 deny-by-default negatives를 실행합니다.",
    operations: "server policy ID, action, allow/deny reason와 401/403 rate만 안전하게 기록하고 resource/principal/credential 값은 제외하거나 보호합니다.",
    concepts: [c("authentication", "요청 주체의 session/credential을 검증해 principal을 확정하는 과정입니다.", ["client boolean과 다릅니다.", "server에서 확인합니다."]), c("authorization", "확정된 principal이 특정 resource에 특정 action을 할 수 있는지 결정하는 과정입니다.", ["매 요청 적용합니다.", "deny by default입니다."]), c("UI affordance", "가능한 동작을 사용자에게 보여 주거나 숨기는 presentation입니다.", ["보안 통제가 아닙니다.", "keyboard 접근도 고려합니다."])],
    codeExamples: [node("react34-guard-policy", "client guard and server policy decision matrix", "React34GuardPolicy.mjs", "client render decision과 server allow/deny를 별도 결과로 출력합니다.", String.raw`function client(phase) {
  return phase === "unknown" ? "pending" : phase === "anonymous" ? "redirect" : "render";
}
function server(input) {
  if (!input.session) return "401";
  if (!input.allowed) return "403";
  return "200";
}
const cases = [
  { phase: "unknown", session: false, allowed: false },
  { phase: "anonymous", session: false, allowed: false },
  { phase: "authenticated", session: true, allowed: false },
  { phase: "authenticated", session: true, allowed: true },
];
for (const item of cases) console.log(client(item.phase) + "|" + server(item));`, "pending|401\nredirect|401\nrender|403\nrender|200", ["local-private-route", "local-myapp02-navbar", "local-myapp03-navbar", "owasp-authorization", "rfc9110", "rr-route-object"])],
  }),
  appliedTopic({
    id: "safe-return-url-redirect", title: "sign-in return URL을 strict internal destination으로 검증합니다",
    lead: "보호 route에서 sign-in으로 보낸 뒤 원래 맥락을 복구하되 공격자가 외부·권한 없는·ambiguous target을 주입할 수 없도록 destination을 data로 검증합니다.",
    mechanism: "return target은 current location의 pathname/search/hash에서 만들 수 있지만 user-controlled input입니다. relative absolute-path만 허용하고 base origin으로 parse한 뒤 same origin, approved route prefix, length와 control-character rules를 검사하며 scheme-relative/absolute/backslash/double-encoded forms를 거부합니다.",
    workflow: "guard가 validated canonical target 또는 opaque server state ID를 생성하고 sign-in 성공 뒤 한 번 consume하며 destination route loader/server authorization을 다시 실행하고 invalid/expired target은 safe default로 보냅니다.",
    invariants: "return target에 token/credential/PII를 넣지 않고 authorization bypass로 쓰지 않으며 외부 origin, protocol-relative, script scheme와 login loop destination을 허용하지 않습니다.",
    edgeCases: "encoded slash/backslash, Unicode confusable, CRLF, very long query, nested return parameter, hash, stale deleted route, cross-tenant target, repeated login와 browser back을 포함합니다.",
    failureModes: "startsWith('/')만 보면 double slash를 놓치고 substring domain check는 attacker-controlled host를 허용하며 raw location 전체 저장은 sensitive query를 persistence/log로 확산합니다.",
    verification: "positive/negative redirect corpus, nested/double encoding, canonical round trip, one-time consume, stale/forbidden target, login loop와 server authorization을 실행합니다.",
    operations: "accept/reject reason과 target route template만 기록하고 raw return URL/query는 telemetry에서 제거합니다.",
    concepts: [c("return URL", "인증 완료 뒤 복귀하려는 내부 navigation destination입니다.", ["외부 입력으로 검증합니다.", "one-time state로 다룰 수 있습니다."]), c("internal destination", "검증된 same-origin app route와 허용 prefix를 만족하는 target입니다.", ["absolute external URL을 거부합니다.", "canonicalize합니다."]), c("redirect loop", "guard와 sign-in route가 서로 반복 이동해 사용자가 page에 도달하지 못하는 상태입니다.", ["default와 consume policy로 막습니다.", "history replace를 검토합니다."])],
    codeExamples: [node("react34-return-target", "strict post-auth return-target validator", "React34ReturnTarget.mjs", "synthetic base에서 approved internal workspace path만 허용합니다.", String.raw`const base = new URL("https://example.invalid/");
function resolveReturn(raw) {
  if (typeof raw !== "string" || raw.length > 120 || !raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f]/.test(raw)) return "/workspace";
  const target = new URL(raw, base);
  if (target.origin !== base.origin || !target.pathname.startsWith("/workspace") || target.pathname === "/workspace/sign-in") return "/workspace";
  return target.pathname + target.search + target.hash;
}
for (const raw of ["/workspace/report-a", "/workspace?tab=files", "//outside.invalid/x", "https://outside.invalid/", "/other", "/workspace/sign-in"]) {
  console.log(raw + "=" + resolveReturn(raw));
}`, "/workspace/report-a=/workspace/report-a\n/workspace?tab=files=/workspace?tab=files\n//outside.invalid/x=/workspace\nhttps://outside.invalid/=/workspace\n/other=/workspace\n/workspace/sign-in=/workspace", ["rr-redirect", "owasp-redirects", "rr-navigating", "local-login-page"])],
  }),
  appliedTopic({
    id: "role-resource-policy-ui", title: "role·resource·field policy를 server 결정과 accessible UI에 연결합니다",
    lead: "role 이름 하나를 route access와 동일시하지 않고 principal, tenant, resource ownership, action, field와 current policy version을 server에서 평가한 뒤 UI는 그 결과를 설명 가능하게 반영합니다.",
    mechanism: "RBAC는 역할 기반 coarse permission, ABAC/resource policy는 ownership·tenant·상태 같은 context를 결합합니다. server policy decision은 allow/deny와 safe reason을 반환하고 client capability document는 button/link affordance를 조정하지만 최종 mutation에서 다시 검사합니다.",
    workflow: "resource/action matrix를 작성해 default deny, least privilege, separation of duties와 field allowlist를 적용하고 permission changes가 session/cache/navigation에 전파되는 revoke path를 만듭니다.",
    invariants: "client role string과 disabled control이 권한 증거가 아니며 list access가 detail/update/delete를 자동 허용하지 않고 forbidden content를 DOM/loader payload에 미리 내려 숨기지 않습니다.",
    edgeCases: "multiple roles, tenant switch, ownership transfer, suspended resource, role downgrade mid-session, bulk action, hidden fields, shared link와 stale capability cache를 포함합니다.",
    failureModes: "route-level admin flag 하나는 object/field 권한을 놓치고 UI에서 숨기기만 하면 keyboard/HTTP/direct script로 action을 호출할 수 있으며 overly broad 404/403 정책은 정보 노출 또는 복구 혼란을 만듭니다.",
    verification: "role×resource×action×field matrix, deny-by-default, cross-tenant/direct request, mid-session revoke, cached UI, accessible disabled/absent explanation와 audit events를 시험합니다.",
    operations: "policy ID/version, action, allow/deny code와 revoke propagation latency를 기록하고 principal/resource identifiers와 confidential fields는 보호합니다.",
    concepts: [c("RBAC", "principal의 role에 permission을 연결하는 authorization model입니다.", ["coarse policy에 유용합니다.", "object context가 추가될 수 있습니다."]), c("resource policy", "특정 object, tenant, action, field와 상태를 평가하는 server authorization 규칙입니다.", ["매 요청 적용합니다.", "default deny합니다."]), c("capability document", "현재 화면이 표시할 수 있는 actions를 server가 safe하게 설명한 projection입니다.", ["UX를 돕습니다.", "mutation 재검사를 대체하지 않습니다."])],
    codeExamples: [node("react34-authorization-matrix", "resource/action authorization matrix", "React34AuthorizationMatrix.mjs", "role와 ownership/action을 결합해 default-deny 결과를 출력합니다.", String.raw`function authorize({ role, owner, action }) {
  if (role === "maintainer" && ["read", "update"].includes(action)) return "allow";
  if (role === "member" && owner && action === "read") return "allow";
  return "deny";
}
const cases = [
  { role: "member", owner: true, action: "read" },
  { role: "member", owner: false, action: "read" },
  { role: "member", owner: true, action: "update" },
  { role: "maintainer", owner: false, action: "update" },
  { role: "maintainer", owner: false, action: "delete" },
];
for (const item of cases) console.log(item.role + ":" + item.owner + ":" + item.action + "=" + authorize(item));`, "member:true:read=allow\nmember:false:read=deny\nmember:true:update=deny\nmaintainer:false:update=allow\nmaintainer:false:delete=deny", ["owasp-authorization", "rr-route-object", "rfc9110"])],
  }),
  appliedTopic({
    id: "logout-session-cache-lifecycle", title: "logout·expiry·revocation에서 credential, auth store와 caches를 원자적으로 정리합니다",
    lead: "logout button 뒤 home으로 이동하는 것만으로 끝내지 않고 server session invalidation, local credentials, in-flight requests, protected caches, history와 다른 tabs가 어떤 순서로 수렴하는지 설계합니다.",
    mechanism: "logout command는 server revoke를 시도하고 결과와 무관하게 client credential/auth state를 안전하게 clear하며 auth generation을 올려 late responses를 폐기합니다. user-scoped query/cache/persisted drafts와 service-worker data를 policy에 따라 purge하고 BroadcastChannel/storage event로 다른 tabs에 알립니다.",
    workflow: "credential inventory와 user-scoped state registry를 만들고 revoke→local purge→request abort→cache purge→safe replace navigation→cross-tab acknowledgement 순서와 partial-failure reconciliation을 정합니다.",
    invariants: "server logout 실패가 client secret clear를 막지 않고 previous principal data가 next login에 보이지 않으며 browser back이 protected snapshot을 다시 usable하게 만들지 않습니다.",
    edgeCases: "offline logout, revoke timeout, double click, two tabs, refresh token race, request after logout, account switch, persisted queue, BFCache와 shared device를 포함합니다.",
    failureModes: "auth boolean만 false로 바꾸면 tokens/caches가 남고 navigate만 하면 in-flight success가 user data를 다시 store에 넣으며 local clear만 하면 server session이 계속 유효할 수 있습니다.",
    verification: "server revoke readback, storage/cache/cookie inventory, in-flight abort/late response, cross-tab, back/BFCache, offline retry와 next-user isolation을 실행합니다.",
    operations: "logout phase, revoke/local-purge outcome, late-discard, cross-tab propagation와 residual cache scan을 기록하고 credentials는 절대 로그하지 않습니다.",
    concepts: [c("revocation", "server가 session/refresh capability를 더 이상 유효하지 않게 만드는 절차입니다.", ["client clear와 별도입니다.", "readback/expiry가 필요합니다."]), c("auth-scoped cache purge", "현재 principal에 속한 cached data와 pending operations를 logout에서 제거하는 과정입니다.", ["next user leak를 막습니다.", "public cache와 구분합니다."]), c("cross-tab convergence", "한 tab의 login/logout/revoke가 다른 tabs의 auth state와 UI에 전파되어 같은 결론에 도달하는 성질입니다.", ["generation/version을 씁니다.", "충돌을 시험합니다."])],
    codeExamples: [node("react34-logout-cleanup", "logout cleanup dependency order", "React34LogoutCleanup.mjs", "의존 관계를 지킨 cleanup step과 residual gate를 출력합니다.", String.raw`const steps = [
  ["revoke-attempt", []],
  ["clear-credential", ["revoke-attempt"]],
  ["advance-generation", ["clear-credential"]],
  ["abort-requests", ["advance-generation"]],
  ["purge-user-cache", ["abort-requests"]],
  ["replace-navigation", ["purge-user-cache"]],
  ["notify-tabs", ["clear-credential"]],
];
const done = new Set();
for (const [step, needs] of steps) {
  const ready = needs.every((need) => done.has(need));
  console.log(step + "=" + (ready ? "done" : "blocked"));
  if (ready) done.add(step);
}
console.log("residual-sensitive-state=none");`, "revoke-attempt=done\nclear-credential=done\nadvance-generation=done\nabort-requests=done\npurge-user-cache=done\nreplace-navigation=done\nnotify-tabs=done\nresidual-sensitive-state=none", ["local-myapp03-navbar", "local-auth-store", "local-login-page", "owasp-session", "rr-use-navigate"])],
  }),
  appliedTopic({
    id: "navigation-title-focus-status", title: "route 변화에 document title·heading·focus·status를 일관되게 적용합니다",
    lead: "보호 route redirect와 nested content 교체가 시각적으로만 보이지 않게 navigation 완료, 거부, loading과 오류를 keyboard와 assistive technology에 명확히 전달합니다.",
    mechanism: "route metadata는 unique document title과 main heading을 제공하고 full page-like navigation 완료 뒤 main heading/landmark에 programmatic focus를 보낼 수 있습니다. query-only update나 validation은 입력 focus를 유지하고 result/status를 live region으로 알리며 guard redirect는 목적과 다음 action을 visible text로 설명합니다.",
    workflow: "navigation intent별 title timing, heading level, focus destination/fallback, scroll, busy/status와 error message를 table로 만들고 user action, POP, redirect, pending completion을 구분합니다.",
    invariants: "모든 page에 descriptive title과 visible main heading이 있고 focus가 hidden/unmounted target이나 body로 사라지지 않으며 status만 색/animation으로 전달하지 않습니다.",
    edgeCases: "same layout child, guard redirect, query filter, slow loader, error boundary, back/forward, hash target, reduced motion, repeated status와 modal route를 포함합니다.",
    failureModes: "document title을 고정하면 tab/history를 구별하지 못하고 route change 뒤 focus가 old NavLink에 남으면 새 content를 찾기 어려우며 매 render focus는 keyboard 작업을 방해합니다.",
    verification: "title/heading uniqueness, keyboard focus sequence/visibility, screen-reader navigation announcement, status message, query focus preservation, back/forward와 zoom/reduced-motion을 시험합니다.",
    operations: "route ID별 missing title/heading, focus fallback, status delivery와 abandonment를 privacy-safe하게 관찰하고 accessibility owner/runbook을 둡니다.",
    concepts: [c("document title", "browser tab/history와 assistive technology가 page 목적을 식별하는 문서 이름입니다.", ["route마다 descriptive해야 합니다.", "navigation timing을 정합니다."]), c("focus destination", "navigation 완료 뒤 keyboard focus를 보낼 논리적인 heading/landmark 또는 preserved control입니다.", ["intent별로 다릅니다.", "visible해야 합니다."]), c("status message", "focus를 옮기지 않고 loading/result/error 변화를 assistive technology에 알리는 메시지입니다.", ["반복을 통제합니다.", "민감정보를 제외합니다."])],
    codeExamples: [node("react34-navigation-a11y", "navigation title/focus/status policy", "React34NavigationA11y.mjs", "navigation kind마다 title, focus와 status action을 결정합니다.", String.raw`function policy(kind) {
  const table = {
    page: ["Workspace record", "main-heading", "loaded"],
    filter: ["Workspace records", "preserve-control", "results-updated"],
    denied: ["Access unavailable", "error-heading", "access-denied"],
    pending: ["Workspace", "preserve-current", "loading"],
  };
  return table[kind] || ["Page unavailable", "main-heading", "not-found"];
}
for (const kind of ["page", "filter", "denied", "pending", "unknown"]) {
  console.log(kind + "=" + policy(kind).join("|"));
}`, "page=Workspace record|main-heading|loaded\nfilter=Workspace records|preserve-control|results-updated\ndenied=Access unavailable|error-heading|access-denied\npending=Workspace|preserve-current|loading\nunknown=Page unavailable|main-heading|not-found", ["wcag22", "wcag-page-titled", "wcag-focus-order", "wcag-status", "rr-pending-ui"])],
  }),
  appliedTopic({
    id: "keyboard-link-current-breadcrumb", title: "Link·NavLink·breadcrumb를 native keyboard와 current semantics로 구현합니다",
    lead: "클릭 가능한 div와 CSS active 색상에 의존하지 않고 native link/button 역할, 명확한 이름, current location과 hierarchy를 keyboard·screen reader 모두 이해하게 합니다.",
    mechanism: "navigation destination은 Link/NavLink가 anchor semantics를 제공하고 in-page action은 button을 사용합니다. NavLink는 active/pending state를 styling과 aria-current에 연결할 수 있으며 breadcrumb는 ordered list와 current page 표시를 갖고 tab order는 DOM의 의미 순서를 따릅니다.",
    workflow: "각 interactive element를 navigate/action으로 분류하고 accessible name, destination, current/pending/disabled state, focus style와 keyboard activation을 정의하며 route matches metadata에서 breadcrumb를 생성합니다.",
    invariants: "모든 navigation은 keyboard로 도달·실행 가능하고 현재 page를 색만으로 표시하지 않으며 disabled link 흉내가 focus trap이나 dead control을 만들지 않습니다.",
    edgeCases: "same URL link, external/download link, new tab, icon-only control, long breadcrumb, collapsed mobile nav, pending link, touch/keyboard parity와 high contrast를 포함합니다.",
    failureModes: "onClick div는 Enter/Space, role, focus와 context menu를 잃고 positive tabindex는 DOM/visual order를 어긋나게 하며 aria-current를 여러 sibling에 주면 위치를 혼동합니다.",
    verification: "Tab/Shift+Tab/Enter/Space, screen-reader name/role/current, visible focus, context menu/copy link, breadcrumb landmark/list, high contrast와 pending states를 수동·자동으로 검사합니다.",
    operations: "missing names/current conflicts, keyboard activation failures와 focus loss를 route/component ID로 집계하고 link target value는 수집하지 않습니다.",
    concepts: [c("native link semantics", "href를 가진 anchor가 제공하는 navigation, keyboard, context menu와 접근성 의미입니다.", ["Link가 보존합니다.", "action에는 button을 씁니다."]), c("aria-current", "set 안에서 현재 item/page임을 assistive technology에 알리는 상태입니다.", ["한 current item을 유지합니다.", "색상과 함께 사용합니다."]), c("breadcrumb", "현재 page까지의 route hierarchy를 links와 current item으로 보여 주는 navigation landmark입니다.", ["ordered list를 씁니다.", "route metadata에서 만들 수 있습니다."])],
    codeExamples: [node("react34-navigation-semantics", "navigation element semantics audit", "React34NavigationSemantics.mjs", "element intent와 native semantic requirements를 검사합니다.", String.raw`const elements = [
  { id: "primary-nav", intent: "navigate", tag: "a", name: true, current: true },
  { id: "save", intent: "action", tag: "button", name: true },
  { id: "bad-nav", intent: "navigate", tag: "div", name: true },
  { id: "icon-action", intent: "action", tag: "button", name: false },
];
for (const item of elements) {
  const tagOk = item.intent === "navigate" ? item.tag === "a" : item.tag === "button";
  const issues = [!tagOk && "wrong-element", !item.name && "missing-name"].filter(Boolean);
  console.log(item.id + "=" + (issues.join(",") || "pass"));
}`, "primary-nav=pass\nsave=pass\nbad-nav=wrong-element\nicon-action=missing-name", ["rr-nav-link", "rr-navigating", "wai-breadcrumb", "wcag22", "local-myapp02-navbar", "local-myapp03-navbar"])],
  }),
  appliedTopic({
    id: "pending-navigation-blocker", title: "pending navigation과 unsaved-change blocker를 별도 state machine으로 운영합니다",
    lead: "느린 route 이동의 진행 상태와 작성 중 form을 떠나는 확인을 섞지 않고, 중복 navigation·back/forward·hard reload까지 각 API가 다루는 범위를 분명히 합니다.",
    mechanism: "useNavigation은 idle/submitting/loading과 destination/form context를 제공하고 useBlocker는 SPA navigation을 unblocked/blocked/proceeding으로 조정합니다. blocker는 hard reload나 cross-origin navigation을 모두 처리하지 않으므로 beforeunload 사용은 최소화하고 autosave/draft recovery를 함께 설계합니다.",
    workflow: "dirty 계산을 authoritative draft/base diff로 만들고 same-resource harmless query를 제외하며 blocked dialog에 destination summary, stay/proceed/save actions와 initial/return focus를 제공합니다. submit success는 dirty를 clear하고 blocked navigation을 안전하게 resume합니다.",
    invariants: "pending spinner가 blocker dialog를 덮거나 focus를 훔치지 않고 proceed/reset은 blocked state에서만 실행되며 browser confirm만을 접근 가능한 유일 UX로 의존하지 않습니다.",
    edgeCases: "double navigation, POP/back, submit while blocked, save failure, route action success, hard reload, external link, multiple dirty forms, mobile close와 two tabs를 포함합니다.",
    failureModes: "dirty boolean을 submit 뒤 clear하지 않으면 successful save 후에도 막히고 unstable prompt만 사용하면 브라우저별 back/forward behavior가 다르며 blocker가 security/auth redirect를 무조건 막을 수 있습니다.",
    verification: "blocker transition table, keyboard dialog/focus trap/escape policy, proceed/reset, pending overlap, save-success/failure, back/forward, hard reload와 draft recovery를 실제 browser에서 시험합니다.",
    operations: "block/stay/proceed/save outcome, dirty age와 abandonment를 low-cardinality로 기록하고 form content/destination URL은 제외합니다.",
    concepts: [c("navigation pending state", "route loader 또는 submission 때문에 다음 navigation이 진행 중인 상태입니다.", ["global/local feedback에 씁니다.", "blocker와 다릅니다."]), c("navigation blocker", "SPA 내부 이동을 잠시 멈추고 사용자 선택에 따라 proceed/reset하는 state machine입니다.", ["hard reload 범위가 다릅니다.", "dirty condition이 필요합니다."]), c("recoverable draft", "navigation loss에도 사용자가 복원할 수 있도록 정책적으로 저장한 최소 draft입니다.", ["민감도/만료를 검토합니다.", "blocker 실패를 보완합니다."])],
    codeExamples: [node("react34-blocker-machine", "navigation blocker finite-state machine", "React34BlockerMachine.mjs", "blocked state에서만 proceed/reset을 허용하고 terminal transition을 출력합니다.", String.raw`let state = "unblocked";
function event(type) {
  const transitions = {
    unblocked: { attemptDirty: "blocked", attemptClean: "unblocked" },
    blocked: { stay: "unblocked", proceed: "proceeding" },
    proceeding: { complete: "unblocked" },
  };
  const next = transitions[state]?.[type];
  if (!next) return "invalid";
  state = next;
  return state;
}
for (const type of ["attemptDirty", "attemptDirty", "proceed", "stay", "complete"]) console.log(type + "=" + event(type));
console.log("final=" + state);`, "attemptDirty=blocked\nattemptDirty=invalid\nproceed=proceeding\nstay=invalid\ncomplete=unblocked\nfinal=unblocked", ["rr-navigation-blocking", "rr-use-blocker", "rr-pending-ui", "rr-use-navigation", "wcag-focus-order", "wcag-status"])],
  }),
  appliedTopic({
    id: "protected-navigation-qualification", title: "auth·redirect·accessibility·blocker를 end-to-end release evidence로 검증합니다",
    lead: "로그인 성공과 화면 표시만 확인하지 않고 cold bootstrap, direct request, revoke, redirect abuse, keyboard navigation, blocker failure와 rollback을 하나의 fault matrix로 반복합니다.",
    mechanism: "pure models는 auth/redirect/policy/blocker, router integration은 guards/loaders/history, disposable server는 session/resource authorization, browser E2E는 focus/title/status/keyboard/tabs, security tests는 storage/log/URL/caches를 증명합니다.",
    workflow: "anonymous/unknown/authenticated/forbidden/revoked × direct/link/back/return target/logout/blocker를 교차하고 expected client UI, server status, history, focus, storage/cache와 telemetry를 assert합니다.",
    invariants: "실제 user, route, domain, token, credential과 endpoint를 fixtures/screenshots/logs에 복사하지 않고 client-only tests가 server policy와 browser accessibility를 증명한다고 과장하지 않습니다.",
    edgeCases: "expired session, forged persistence, cross-tenant ID, double-encoded redirect, two tabs, offline logout, late response, BFCache, no keyboard/mouse, reduced motion와 deploy rollback을 포함합니다.",
    failureModes: "happy path E2E 하나는 IDOR/open redirect/stale session/focus loss를 놓치고 rollback에서 auth schema/cache가 호환되지 않으면 사용자가 loop 또는 data leak 상태에 남습니다.",
    verification: "exact examples, sourceRef closure, auth/server policy negatives, redirect corpus, keyboard/screen-reader, storage/log/bundle scans, cross-tab/BFCache, canary readback와 rollback rehearsal를 실행합니다.",
    operations: "auth/navigation/a11y SLI, denial and redirect reason, pending/blocker duration, owner, alert와 revoke/purge/focus/rollback reconciliation runbooks를 운영합니다.",
    concepts: [c("auth-navigation fault matrix", "auth phase·policy·navigation type·failure를 교차해 expected UI/server/recovery를 적은 표입니다.", ["보안/a11y를 함께 봅니다.", "cleanup을 포함합니다."]), c("security readback", "client success 표시가 아니라 server session/resource 상태가 실제 revoke/deny되었는지 다시 확인하는 절차입니다.", ["logout/role change에 필요합니다.", "safe probe를 씁니다."]), c("accessibility release gate", "title, heading, focus, keyboard, status와 blocker dialog evidence가 없으면 배포를 막는 품질 기준입니다.", ["자동/수동 검증을 결합합니다.", "owner가 승인합니다."])],
    codeExamples: [node("react34-release-gate", "protected navigation release gate", "React34ReleaseGate.mjs", "server authorization, safe redirects, session lifecycle와 접근성 evidence를 모두 요구합니다.", String.raw`const evidence = {
  triState: true, serverAuthorization: true, safeReturnTarget: true,
  revokeAndPurge: true, titleFocusStatus: true, keyboardSemantics: true,
  blocker: true, crossTab: true, rollback: true, privateValuesCopied: false,
};
const required = ["triState", "serverAuthorization", "safeReturnTarget", "revokeAndPurge", "titleFocusStatus", "keyboardSemantics", "blocker", "crossTab", "rollback"];
const missing = required.filter((key) => evidence[key] !== true);
console.log("missing=" + (missing.join(",") || "none"));
console.log("private-values-copied=" + evidence.privateValuesCopied);
console.log("release=" + (missing.length === 0 && !evidence.privateValuesCopied ? "pass" : "block"));`, "missing=none\nprivate-values-copied=false\nrelease=pass", ["local-router-guide", "local-myapp02-navbar", "local-myapp03-app", "local-private-route", "local-myapp03-navbar", "local-auth-store", "local-login-page", "rr-modes", "rr-route-object", "rr-redirect", "rr-navigating", "rr-use-navigate", "rr-pending-ui", "rr-navigation-blocking", "rr-use-blocker", "rr-use-navigation", "rr-nav-link", "owasp-authorization", "owasp-redirects", "owasp-session", "rfc9110", "wcag22", "wcag-page-titled", "wcag-focus-order", "wcag-status", "wai-breadcrumb"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-router-guide", repository: "D:/dev/REACT", path: "docs/react/08-router.md", usedFor: ["declarative navigation baseline", "programmatic navigation and protected-route progression"], evidence: "2026-07-14 read-only sanitized audit: 107 lines, 5,551 bytes, SHA-256 5D1D686C17CD50FF6FF7ADFD5AD41DA9715DB9C8674059523378422DED643541. actual routes, local URL과 UI strings는 복사하지 않았습니다." },
  { id: "local-myapp02-navbar", repository: "D:/dev/my-app02", path: "src/components/Navbar.jsx", usedFor: ["auth-conditioned NavLink visibility", "active-state callback provenance"], evidence: "2026-07-14 read-only sanitized audit: 32 lines, 1,439 bytes, SHA-256 D29B5E26C4D63428A85C06076EA9A0C15B651DBBEEAB0679817D57E6660C5C38. actual labels, destinations와 user values는 복사하지 않았습니다." },
  { id: "local-myapp03-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["storage-based auth bootstrap", "wrapper guard placement"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. actual routes, storage key와 user values는 복사하지 않았습니다." },
  { id: "local-private-route", repository: "D:/dev/my-app03", path: "src/components/PrivateRoute.jsx", usedFor: ["client wrapper guard decision", "store-or-storage and redirect provenance"], evidence: "2026-07-14 read-only sanitized audit: 20 lines, 846 bytes, SHA-256 93EC890BE94F8E25E7C715893EC043C01B9064B9E037F4FC60632EF60CFEAF8C. actual storage key와 redirect value는 복사하지 않았습니다." },
  { id: "local-myapp03-navbar", repository: "D:/dev/my-app03", path: "src/components/Navbar.jsx", usedFor: ["conditional NavLinks", "server logout/local clear/navigation sequence"], evidence: "2026-07-14 read-only sanitized audit: 51 lines, 2,138 bytes, SHA-256 5785D2A37FDDD6A0EF397F92460A2CE9958F0719211CFFC1E69992C880806880. actual labels, destinations, endpoints와 user values는 복사하지 않았습니다." },
  { id: "local-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["boolean auth/user state", "login/logout state and browser-storage cleanup"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. actual storage key, user fields와 values는 복사하지 않았습니다." },
  { id: "local-login-page", repository: "D:/dev/my-app03", path: "src/pages/LoginPage.jsx", usedFor: ["credential form and auth transition", "token persistence and navigation provenance"], evidence: "2026-07-14 read-only sanitized audit: 97 lines, 4,359 bytes, SHA-256 9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8. actual member fields, credentials, tokens, messages, destinations와 endpoint values는 복사하지 않았습니다." },
  { id: "rr-modes", repository: "React Router official documentation", path: "start/modes", publicUrl: "https://reactrouter.com/start/modes", usedFor: ["Declarative/Data/Framework auth integration boundaries"], evidence: "React Router 공식 현행 mode 선택 문서입니다." },
  { id: "rr-route-object", repository: "React Router official documentation", path: "start/data/route-object", publicUrl: "https://reactrouter.com/start/data/route-object", usedFor: ["loader/middleware route authorization boundaries"], evidence: "React Router 공식 현행 Route Object 문서입니다." },
  { id: "rr-redirect", repository: "React Router official documentation", path: "api/utils/redirect", publicUrl: "https://reactrouter.com/api/utils/redirect", usedFor: ["loader/action redirect response and input warning"], evidence: "React Router 공식 현행 redirect API입니다." },
  { id: "rr-navigating", repository: "React Router official documentation", path: "start/data/navigating", publicUrl: "https://reactrouter.com/start/data/navigating", usedFor: ["Link/NavLink/navigate selection"], evidence: "React Router 공식 현행 data navigation 문서입니다." },
  { id: "rr-use-navigate", repository: "React Router official documentation", path: "api/hooks/useNavigate", publicUrl: "https://reactrouter.com/api/hooks/useNavigate", usedFor: ["programmatic navigation and replace semantics"], evidence: "React Router 공식 현행 useNavigate API입니다." },
  { id: "rr-pending-ui", repository: "React Router official documentation", path: "start/framework/pending-ui", publicUrl: "https://reactrouter.com/start/framework/pending-ui", usedFor: ["global/local pending navigation UI"], evidence: "React Router 공식 현행 Pending UI 문서입니다." },
  { id: "rr-navigation-blocking", repository: "React Router official documentation", path: "how-to/navigation-blocking", publicUrl: "https://reactrouter.com/how-to/navigation-blocking", usedFor: ["unsaved-change navigation workflow"], evidence: "React Router 공식 현행 Navigation Blocking 문서입니다." },
  { id: "rr-use-blocker", repository: "React Router official documentation", path: "api/hooks/useBlocker", publicUrl: "https://reactrouter.com/api/hooks/useBlocker", usedFor: ["blocker states, proceed and reset"], evidence: "React Router 공식 현행 useBlocker API입니다." },
  { id: "rr-use-navigation", repository: "React Router official documentation", path: "api/hooks/useNavigation", publicUrl: "https://reactrouter.com/api/hooks/useNavigation", usedFor: ["idle/submitting/loading navigation state"], evidence: "React Router 공식 현행 useNavigation API입니다." },
  { id: "rr-nav-link", repository: "React Router official documentation", path: "api/components/NavLink", publicUrl: "https://reactrouter.com/api/components/NavLink", usedFor: ["active/pending state and aria-current"], evidence: "React Router 공식 현행 NavLink API입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["deny by default, least privilege and per-request policy"], evidence: "OWASP 공식 authorization guidance입니다." },
  { id: "owasp-redirects", repository: "OWASP Cheat Sheet Series", path: "Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", usedFor: ["safe return-target validation"], evidence: "OWASP 공식 unvalidated redirect guidance입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session lifecycle, storage and logout/revocation"], evidence: "OWASP 공식 session management guidance입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["401/403 and HTTP response semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "wcag22", repository: "W3C Web Content Accessibility Guidelines", path: "WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["keyboard, focus, names, structure and status baseline"], evidence: "W3C Recommendation인 WCAG 2.2입니다." },
  { id: "wcag-page-titled", repository: "W3C WAI WCAG", path: "Understanding/page-titled", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html", usedFor: ["descriptive document titles"], evidence: "W3C WAI 공식 Page Titled guidance입니다." },
  { id: "wcag-focus-order", repository: "W3C WAI WCAG", path: "Understanding/focus-order", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html", usedFor: ["meaningful keyboard focus order"], evidence: "W3C WAI 공식 Focus Order guidance입니다." },
  { id: "wcag-status", repository: "W3C WAI WCAG", path: "Understanding/status-messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["pending, result and error announcements"], evidence: "W3C WAI 공식 Status Messages guidance입니다." },
  { id: "wai-breadcrumb", repository: "W3C WAI ARIA Authoring Practices Guide", path: "patterns/breadcrumb", publicUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/", usedFor: ["breadcrumb landmark, list and current page pattern"], evidence: "W3C WAI ARIA APG 공식 Breadcrumb pattern입니다." },
];

const session = createExpertSession({
  inventoryId: "react-34-fetch-detail-cancel", slug: "react-34-protected-route-navigation-a11y", courseId: "react", moduleId: "react-router-network", order: 4,
  title: "보호 route·navigation과 접근성", subtitle: "client guard를 server authorization과 분리하고 session·redirect·focus·title·status·keyboard·blocker를 하나의 복구 가능한 navigation lifecycle로 만듭니다.",
  level: "고급", estimatedMinutes: 130,
  coreQuestion: "로그인이 필요한 route를 어떻게 보호해야 forged/stale client state가 권한을 얻지 못하고, 모든 navigation·redirect·pending·blocked 상태가 keyboard와 assistive technology에도 명확할까요?",
  summary: "REACT Router guide와 my-app02/my-app03 App, Navbar, PrivateRoute, auth store와 Login page 일곱 files를 read-only·sanitized 감사해 boolean/storage-based client guard, conditional links와 login/logout navigation의 실제 baseline을 보존합니다. 실제 route·storage key·member/user·credential/token·endpoint/domain values는 복사하지 않습니다. 현행 React Router, OWASP, IETF와 W3C 근거로 auth tri-state, client/server policy split, safe return target, resource authorization, revoke/cache lifecycle, title/focus/status, native keyboard semantics, pending/blocker와 release qualification을 열 deterministic Node models에 연결합니다.",
  objectives: ["원본 guard/auth/navigation trust와 accessibility 경계를 감사한다.", "unknown/authenticated/anonymous bootstrap lifecycle을 설계한다.", "client guard와 server authorization을 분리한다.", "return URL을 strict internal destination으로 검증한다.", "role/resource/action/field policy를 deny-by-default로 적용한다.", "logout/revoke/request/cache/tab lifecycle을 수렴시킨다.", "title/heading/focus/status navigation policy를 구현한다.", "Link/NavLink/breadcrumb의 native keyboard semantics를 검증한다.", "pending navigation과 unsaved-change blocker를 분리한다.", "security/accessibility fault matrix와 rollback evidence로 배포한다."],
  prerequisites: [{ title: "nested route·data loading과 error boundary", reason: "route tree, loaders/actions, pending, redirects와 error boundaries를 알아야 보호 route의 server policy와 accessible recovery를 올바른 boundary에 배치할 수 있습니다.", sessionSlug: "react-33-nested-route-data-errors" }],
  keywords: ["protected route", "authentication", "authorization", "return URL", "open redirect", "session revocation", "focus management", "document title", "status message", "keyboard navigation", "NavLink", "useBlocker"],
  topics,
  lab: { title: "protected navigation security·accessibility fault laboratory", scenario: "원본 files는 변경하지 않고 synthetic principals/routes/resources만 쓰는 current data-router, disposable session server와 real browser에서 auth·redirect·navigation·blocker lifecycle을 qualification합니다.", setup: ["Node.js 20 이상", "React Router current Data/Framework fixture", "disposable session/resource server", "two-tab browser harness", "keyboard and screen-reader tools", "malicious return-target corpus", "원본 일곱 files read-only"], steps: ["source auth/guard/navigation graph와 exact hashes를 기록합니다.", "auth tri-state/generation bootstrap과 pending shell을 구현합니다.", "client route UX와 server object/action/field policy를 분리합니다.", "strict same-origin approved-prefix return-target validator를 적용합니다.", "role/resource matrix와 mid-session revoke를 direct HTTP로 시험합니다.", "logout revoke, credential/request/cache purge와 cross-tab convergence를 구현합니다.", "route metadata로 title/heading/focus/status/scroll policy를 실행합니다.", "native Link/NavLink/button/breadcrumb semantics를 keyboard/screen reader로 확인합니다.", "pending navigation과 dirty blocker의 proceed/reset/save/hard-reload 경계를 시험합니다.", "security/accessibility SLI, canary readback와 old/new auth/cache rollback을 rehearsal합니다."], expectedResult: ["unknown bootstrap에서 protected content와 anonymous redirect가 성급히 노출되지 않습니다.", "forged client state와 direct cross-resource requests가 server에서 401/403으로 거부됩니다.", "return target은 approved internal route만 복구하고 external/ambiguous inputs는 safe default가 됩니다.", "logout/revoke 뒤 late responses, caches, history와 other tabs가 previous principal data를 복원하지 않습니다.", "navigation·denial·pending·blocker가 title/focus/status/keyboard로 접근 가능하고 rollback evidence가 남습니다."], cleanup: ["temporary server, sessions, requests, abort listeners, browser profiles와 channels를 제거합니다.", "synthetic principals/resources/return targets, screenshots와 logs를 폐기합니다.", "auth/blocker flags, caches, persisted drafts와 verbose tracing을 원복합니다.", "원본 일곱 files의 hash/status unchanged를 확인합니다."], extensions: ["passkey/OIDC callback state와 PKCE return-target 계약을 추가합니다.", "policy decision point/capability document를 route loaders에 연결합니다.", "BFCache/service-worker/session rotation의 cross-tab matrix를 확장합니다.", "automated accessibility navigation regression dashboard를 구현합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node examples를 실행하고 실제 router/server/browser evidence와 대응시키세요.", requirements: ["stdout 완전 일치", "source audit", "auth tri-state", "client/server policy", "return target", "authorization matrix", "logout cleanup", "title/focus/status", "native semantics", "blocker machine", "release gate", "model 한계"], hints: ["Node model이 server policy, browser focus/History, cross-tab 또는 screen-reader output을 증명한다고 표현하지 마세요."], expectedOutcome: "cold bootstrap부터 logout/blocker/rollback까지 security와 accessibility responsibility를 설명합니다.", solutionOutline: ["audit→bootstrap→authorize/redirect→revoke→announce/navigate→block→qualify 순서입니다."] },
    { difficulty: "응용", prompt: "storage-boolean wrapper guard를 production route protection으로 migration하세요.", requirements: ["tri-state root loader", "server per-resource policy", "typed 401/403", "safe return target", "revoke/purge/tabs", "title/focus/status", "keyboard nav", "blocker", "canary adapter/rollback"], hints: ["기존 guard를 한 번에 삭제하지 말고 client UX adapter와 server enforcement를 구분해 canary하세요."], expectedOutcome: "forged/stale persistence와 rapid navigation에도 권한·history·focus가 안전하게 수렴합니다.", solutionOutline: ["source graph→server policy→client state→redirect/a11y→fault→migration 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 protected navigation governance를 작성하세요.", requirements: ["session/bootstrap", "client/server boundary", "authorization model", "redirect validation", "revoke/cache/tab lifecycle", "title/focus/status", "keyboard/current/breadcrumb", "pending/blocker", "tests/SLI/runbook/rollback"], hints: ["로그인 여부가 아니라 session 생성부터 revoke·접근성·reconciliation까지 계약하세요."], expectedOutcome: "모든 protected route가 같은 security/accessibility/operations evidence로 review됩니다.", solutionOutline: ["inventory→trust/policy→navigate/announce→purge/block→verify/operate 순서입니다."] },
  ],
  nextSessions: ["react-35-fetch-http-lifecycle"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["REACT Router guide와 my-app02 Navbar, my-app03 App/PrivateRoute/Navbar/auth store/Login page를 read-only로 읽고 exact lines·bytes·SHA-256를 기록했습니다.", "원본의 storage-presence wrapper guard와 conditional links를 숨기지 않았고 server authorization, tri-state bootstrap, safe return target와 navigation accessibility가 이미 구현됐다고 주장하지 않습니다.", "actual routes, labels, storage keys, member fields, users, credentials/tokens, endpoints와 domain values는 공개 content에 복사하지 않았습니다.", "Node models는 actual React Router redirects/blockers, server session/policy, browser History/focus/BFCache, cross-tab과 assistive technology를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
