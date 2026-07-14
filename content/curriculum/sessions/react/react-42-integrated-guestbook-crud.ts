import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localGuestRefs = ["local-guest-page", "local-guest-store", "local-guest-api", "local-flow-doc", "local-guest-controller", "local-guest-service", "local-guest-mapper"];

const topics = [
  appliedTopic({
    id: "source-end-to-end-guestbook-audit", title: "React→API→Controller→Service→Mapper 원본을 redacted CRUD sequence로 감사합니다",
    lead: "화면 코드만 보지 않고 list/create/update/delete가 client state, HTTP, server logic와 SQL을 왕복해 다시 UI에 반영되는 전체 경로를 복원합니다.",
    mechanism: "my-app03 GuestBookPage는 store와 API functions를 사용하고 REACT 보존본의 Spring Boot Controller/Service/Mapper가 CRUD를 처리합니다. local patch와 refetch가 섞여 있고 writer/password-related fields가 흐르므로 source observation과 production authorization/password guidance를 분리합니다.",
    workflow: "source hashes, operation actor, input fields, auth expectation, endpoint/method, response shape, service result, SQL target, client commit/refetch, error/log와 cleanup을 값 없이 sequence matrix로 작성합니다.",
    invariants: "원본은 변경하지 않고 실제 writer/email/password/content/route/SQL values를 공개 content에 복사하지 않으며 source에서 확인하지 못한 transaction/auth/version 보장을 주장하지 않습니다.",
    edgeCases: "anonymous list, authenticated create, other-writer update, wrong secret, duplicate submit, empty list, inactive rows, DB error와 response inversion을 포함합니다.",
    failureModes: "UI 버튼 visibility나 writer 문자열/비밀값 조건을 robust object authorization으로 과장하면 ID tamper, same-name, replay와 data integrity 위험을 숨깁니다.",
    verification: "client/server/SQL call graph, request/response schema, principal/resource checks, sensitive sinks, transaction result, source hash와 original worktrees unchanged를 확인합니다.",
    operations: "operation, endpoint template, stable outcome, affected row expectation/actual, auth principal class와 correlation을 PII 없이 연결합니다.",
    concepts: [c("end-to-end CRUD path", "UI event에서 DB mutation/readback과 최종 화면까지 이어지는 계층별 sequence입니다.", ["각 경계의 계약을 기록합니다.", "한 file 실행과 다릅니다."]), c("source claim boundary", "원본에서 직접 관찰한 구현과 외부 표준/개선 제안을 구분하는 선입니다.", ["보안을 과장하지 않습니다.", "hash evidence와 연결합니다."]), c("affected-row invariant", "update/delete가 예상한 정확한 resource row 수와 authorization 조건을 만족해야 한다는 규칙입니다.", ["0/다수 rows를 처리합니다.", "response와 transaction에 연결합니다."])],
    codeExamples: [node("react42-source-sequence", "redacted full-stack CRUD source inventory", "React42SourceSequence.mjs", "실제 domain 값을 제외하고 operation별 source path와 client reconciliation을 출력합니다.", String.raw`const operations = [
  ["list", "page>api>controller>service>mapper", "replace-validated-list"],
  ["create", "form>api>controller>service>mapper", "refetch-or-confirm"],
  ["update", "draft>api>controller>service>mapper", "versioned-patch"],
  ["delete", "confirm>api>controller>service>mapper", "remove-or-refetch"],
];
for (const row of operations) console.log(row.join("|"));
console.log("actual-domain-values-copied=false");`, "list|page>api>controller>service>mapper|replace-validated-list\ncreate|form>api>controller>service>mapper|refetch-or-confirm\nupdate|draft>api>controller>service>mapper|versioned-patch\ndelete|confirm>api>controller>service>mapper|remove-or-refetch\nactual-domain-values-copied=false", localGuestRefs.concat(["rfc9110", "owasp-authorization"]))],
  }),
  appliedTopic({
    id: "public-list-state-schema", title: "공개 목록을 query state·runtime schema·safe rendering으로 구현합니다",
    lead: "빈 배열과 fetch 실패를 같은 화면으로 만들지 않고 initial pending, success-empty/data, background refresh, stale error와 offline을 구분합니다.",
    mechanism: "list query는 auth가 없어도 접근 가능한 contract와 secret-free key를 가지며 Response status/body/schema를 검증해 stable ID, safe text, timestamp/version fields만 cache에 넣습니다. public이어도 개인정보 최소화와 cache scope를 검토합니다.",
    workflow: "query key/freshness/cancel/retry, list response schema, normalize/order/dedupe, loading/empty/error/stale status, focus/title와 retry action을 정의합니다.",
    invariants: "invalid/malformed row 하나가 unchecked DOM/store에 들어가지 않고 password/internal fields가 list response/cache/log에 없으며 list key가 stable ID를 사용합니다.",
    edgeCases: "204/empty, malformed one row, duplicate ID, huge/long content, pagination, refresh failure, deleted row, XSS-like text와 timezone을 포함합니다.",
    failureModes: "response data를 그대로 map하고 index key를 쓰면 schema/XSS sink, identity/focus bugs가 생기며 catch에서 []로 바꾸면 outage를 empty list로 위장합니다.",
    verification: "status/content-type/schema corpus, empty/error/stale/offline UI, duplicate/unsafe text, accessibility/focus, cache freshness와 no-sensitive-fields를 실행합니다.",
    operations: "list status/schema reject, rows/bytes/age, duplicate/drop, refresh latency와 public privacy budget을 관찰합니다.",
    concepts: [c("success-empty", "request/schema가 성공했지만 valid result collection이 비어 있는 상태입니다.", ["error와 다릅니다.", "명확한 empty guidance를 줍니다."]), c("row schema", "목록 한 record가 가져야 할 허용 fields와 runtime types/ranges입니다.", ["sensitive fields를 제외합니다.", "versioning합니다."]), c("safe text rendering", "untrusted content를 markup/code가 아니라 text로 렌더링하고 URL/HTML sinks를 별도 sanitize하는 규칙입니다.", ["React escaping에 적용 범위를 둡니다.", "raw HTML을 피합니다."])],
    codeExamples: [node("react42-list-validator", "public list row schema/dedupe model", "React42ListValidator.mjs", "synthetic rows에서 invalid/duplicate/sensitive fields를 거르고 stable order를 만듭니다.", String.raw`const rows = [
  { id: "a", subject: "one", content: "text" }, { id: "a", subject: "duplicate", content: "text" },
  { id: 2, subject: "bad", content: "text" }, { id: "b", subject: "two", content: "text", internalSecret: "forbidden" },
];
const accepted = []; const seen = new Set(); let rejected = 0;
for (const row of rows) { const valid = typeof row.id === "string" && typeof row.subject === "string" && typeof row.content === "string" && !("internalSecret" in row) && !seen.has(row.id); if (!valid) { rejected++; continue; } seen.add(row.id); accepted.push(row.id); }
console.log("accepted=" + accepted.join(","));
console.log("rejected=" + rejected);
console.log("sensitive-fields=0");`, "accepted=a\nrejected=3\nsensitive-fields=0", ["react-xss", "tanstack-queries", "tanstack-query-keys", "local-guest-page", "local-guest-mapper"])],
  }),
  appliedTopic({
    id: "create-command-idempotency", title: "작성 form을 validated command·idempotency와 confirmed result로 만듭니다",
    lead: "로그인 user fields를 payload에 복사해 신뢰하지 않고 server principal이 ownership metadata를 결정하며 duplicate click/timeout-after-commit을 조율합니다.",
    mechanism: "create command는 allowlisted subject/content와 필요한 transient proof만 포함하고 operation/idempotency key를 사용합니다. server가 authenticated principal을 authoritative writer로 매핑하고 validation/authorization/transaction 후 canonical entity/version을 반환합니다.",
    workflow: "controlled draft, trim/length/schema, accessible field errors, operation state, double-submit suppression, idempotency, timeout reconciliation과 success focus/status/list update를 연결합니다.",
    invariants: "client-supplied owner/email/role를 authority로 쓰지 않고 credential-like field를 persist/log하지 않으며 같은 operation retry가 record를 두 번 만들지 않습니다.",
    edgeCases: "blank/Unicode/large content, double Enter/click, network timeout after commit, expired login, idempotency key replay, DB constraint와 canonicalization을 포함합니다.",
    failureModes: "button disabled만으로 duplicate를 막으면 network retry/multi-tab을 못 막고 create success 후 unawaited list refetch가 실패하면 새 record visibility가 불확실합니다.",
    verification: "client/server schema, direct payload owner tamper, duplicate/idempotency, timeout/status lookup, transaction/row count, focus/status와 no-secret artifacts를 실행합니다.",
    operations: "create operation/idempotency outcome, validation/auth/transaction reason, reconciliation lag와 duplicate prevention을 관찰합니다.",
    concepts: [c("create command", "새 resource 생성 의도와 validated allowlisted fields, operation identity를 가진 요청입니다.", ["client owner는 신뢰하지 않습니다.", "domain DTO로 분리합니다."]), c("idempotency key", "같은 logical create 재시도를 server가 식별해 duplicate side effect를 막는 opaque key입니다.", ["user data를 넣지 않습니다.", "scope/expiry를 둡니다."]), c("canonical result", "server가 ID/version/default/normalized values를 확정해 반환한 entity representation입니다.", ["optimistic temp를 교체합니다.", "schema 검증합니다."])],
    codeExamples: [node("react42-create-idempotency", "create idempotency ledger model", "React42CreateIdempotency.mjs", "같은 operation key가 duplicate entity를 만들지 않고 confirmed ID를 재사용합니다.", String.raw`const ledger = new Map(); let sequence = 0;
function create(key) { if (ledger.has(key)) return { duplicate: true, id: ledger.get(key) }; const id = "srv-" + (++sequence); ledger.set(key, id); return { duplicate: false, id }; }
for (const key of ["op-a", "op-a", "op-b"]) { const result = create(key); console.log(key + "=" + result.id + "|duplicate=" + result.duplicate); }
console.log("entities=" + sequence);`, "op-a=srv-1|duplicate=false\nop-a=srv-1|duplicate=true\nop-b=srv-2|duplicate=false\nentities=2", ["rfc9110", "rfc9457", "owasp-authorization", "local-guest-controller", "local-guest-service"])],
  }),
  appliedTopic({
    id: "edit-draft-version-conflict", title: "수정을 isolated draft·version precondition과 three-way conflict UX로 구현합니다",
    lead: "list entity를 입력 중 직접 mutation하지 않고 edit start base, local draft와 server current를 분리해 cancel·validation·conflict를 복구합니다.",
    mechanism: "edit operation은 resource ID, base version/ETag와 allowlisted fields를 보내고 server는 current principal/resource/fields/precondition을 transaction에서 검증합니다. 409/412에서 base-local-current diff를 만들고 user가 reload/merge/cancel을 선택합니다.",
    workflow: "edit start/cancel/submit state, field validation, pending lock, typed errors, success canonical patch, conflict fetch/diff/retry와 focus/status를 정의합니다.",
    invariants: "cancel/error가 confirmed entity를 변경하지 않고 stale edit가 newer server content를 덮지 않으며 client writer/password comparison만으로 authorization하지 않습니다.",
    edgeCases: "row deleted during edit, same/different field updates, account/role change, server normalization, long draft, page refetch와 another tab/device를 포함합니다.",
    failureModes: "editId와 global edit fields 하나만 쓰면서 list refetch가 오면 draft/base가 섞일 수 있고 version 없이 last write wins면 lost update가 생깁니다.",
    verification: "draft isolation/cancel, client/server validation, two-client conflicts, resource/field tamper, canonical response, list refetch/rebase와 a11y를 실행합니다.",
    operations: "edit duration, conflict fields category—not content—, resolution/retry, auth denial와 reconciliation을 관찰합니다.",
    concepts: [c("edit base", "편집 시작 시점의 confirmed entity와 version snapshot입니다.", ["three-way diff에 씁니다.", "draft와 분리합니다."]), c("precondition", "update가 적용되기 위해 resource version/ETag가 만족해야 하는 조건입니다.", ["lost update를 탐지합니다.", "server가 검증합니다."]), c("conflict UX", "base/local/current 차이를 안전하게 보여 주고 reload/merge/cancel/authorized overwrite를 선택하게 하는 흐름입니다.", ["자동 overwrite를 피합니다.", "접근성을 지킵니다."])],
    codeExamples: [node("react42-edit-conflict", "three-way edit conflict model", "React42EditConflict.mjs", "base/local/current synthetic fields에서 충돌과 safe merge candidates를 분류합니다.", String.raw`const base = { subject: "A", content: "X" };
const local = { subject: "B", content: "X" };
const current = { subject: "C", content: "Y" };
for (const key of Object.keys(base)) {
  const l = !Object.is(base[key], local[key]); const s = !Object.is(base[key], current[key]);
  const result = l && s && !Object.is(local[key], current[key]) ? "conflict" : l ? "local" : s ? "server" : "same";
  console.log(key + "=" + result);
}`, "subject=conflict\ncontent=server", ["rfc9110", "tanstack-optimistic", "local-guest-page", "local-guest-service", "local-guest-mapper"])],
  }),
  appliedTopic({
    id: "delete-confirmation-soft-delete", title: "삭제를 target confirmation·server authorization·soft-delete와 undo policy로 설계합니다",
    lead: "row ID와 secret 입력을 보내는 UI만 만들지 않고 대상의 accessible identity, destructive confirmation, current principal/version과 server deletion semantics를 검증합니다.",
    mechanism: "delete command는 resource ID/version과 operation identity를 갖고 server가 authenticated principal/resource authorization을 확인합니다. soft delete는 active marker와 audit/retention/restore policy를 가지며 client는 confirmed success 후 remove/invalidate하거나 reversible optimistic tombstone을 사용합니다.",
    workflow: "delete trigger→dialog/inline confirmation→target summary→pending/cancel→typed result→focus fallback/status→cache reconciliation을 정의하고 password/secret-like proof가 필요하다면 transient·rate-limited server verification으로 격리합니다.",
    invariants: "다른 resource ID tamper가 거부되고 repeated delete는 stable idempotent/not-found policy를 따르며 wrong target/focus loss와 credential persistence가 없습니다.",
    edgeCases: "already deleted, edit pending, version conflict, last item, retry after timeout, soft-delete restore, retention/legal hold와 moderator/admin delete를 포함합니다.",
    failureModes: "button 옆 password field와 writer string equality는 object authorization이 아니고 optimistic remove 후 server failure에서 전체 list snapshot rollback은 newer data를 잃을 수 있습니다.",
    verification: "target/focus/dialog a11y, ID/version/auth tamper, repeated/timeout delete, affected rows, tombstone rollback/reconcile와 storage/log secret scan을 실행합니다.",
    operations: "delete/deny/not-found/conflict/restore outcome, affected rows, tombstone age와 audit retention을 관찰하고 repair/restore runbook을 둡니다.",
    concepts: [c("delete command", "target identity/version과 operation ID를 가진 destructive intent입니다.", ["server authorization이 필요합니다.", "UI visibility와 다릅니다."]), c("tombstone", "삭제됐거나 삭제 pending임을 표현해 stale merge/restore를 조율하는 marker입니다.", ["hard delete와 다릅니다.", "retention을 둡니다."]), c("focus fallback", "삭제된 row의 다음/이전 logical control이나 list heading으로 focus를 복구하는 규칙입니다.", ["stable identity를 씁니다.", "body로 잃지 않습니다."])],
  }),
  appliedTopic({
    id: "server-authorization-secret-design", title: "client visibility·writer field·secret proof와 server object authorization을 분리합니다",
    lead: "버튼 숨김과 payload writer/secret을 신뢰하지 않고 authenticated principal, immutable resource owner/role와 action별 policy를 server가 조회·검증합니다.",
    mechanism: "authorization은 subject-resource-action-context decision이고 server가 resource ID로 current owner/tenant/status를 불러와 deny-by-default로 판단합니다. client-supplied writer/email/role은 display/input일 뿐 identity proof가 아니며 per-entry password가 있다면 strong hashing/rate-limit/reset/transport/logging lifecycle이 필요합니다.",
    workflow: "list/create/update/delete별 anonymous/authenticated/owner/moderator rules, allowed fields와 response redaction을 matrix로 만들고 controller/service/data query가 principal 조건과 affected rows를 일관되게 적용합니다.",
    invariants: "IDOR, same-name, owner-field tamper, mass assignment와 secret replay가 거부되고 list response/telemetry/cache에 password/hash/internal auth fields가 없습니다.",
    edgeCases: "renamed user, duplicate display name, deleted account, role downgrade, tenant switch, moderator override, timing/enumeration와 legacy rows를 포함합니다.",
    failureModes: "WHERE writer = request.writer 같은 client-controlled equality는 principal binding이 아니며 plaintext/reversible entry secret은 DB/log compromise 영향을 키웁니다.",
    verification: "direct API other-ID/owner/field tamper, anonymous/owner/role matrix, rate/replay, DB/log/response secret scan와 affected-row/transaction tests를 실행합니다.",
    operations: "authorization decision/reason, suspicious target/field changes, rate/replay and audit event를 PII/secret 없이 관찰하고 revoke/repair runbook을 둡니다.",
    concepts: [c("object authorization", "현재 principal이 특정 resource에 action을 수행할 수 있는지 server가 검증하는 결정입니다.", ["매 operation 확인합니다.", "UI와 다릅니다."]), c("principal binding", "resource owner/tenant identity를 authenticated server principal과 신뢰 가능한 key로 연결하는 절차입니다.", ["display writer 문자열과 다릅니다.", "DB query/transaction에 반영합니다."]), c("secret proof lifecycle", "별도 resource secret을 생성·hash·verify·rate-limit·reset·폐기하는 전체 정책입니다.", ["password를 로그/응답하지 않습니다.", "필요성부터 검토합니다."])],
    codeExamples: [node("react42-authz-matrix", "server object authorization decision model", "React42AuthzMatrix.mjs", "client display writer가 아니라 principal/owner/role/action으로 결정을 분류합니다.", String.raw`function allowed({ principal, owner, role, action }) {
  if (action === "list") return true;
  if (!principal) return false;
  if (role === "moderator" && ["update", "delete"].includes(action)) return true;
  return principal === owner && ["update", "delete"].includes(action);
}
const cases = [
  { principal: null, owner: "u1", role: "anonymous", action: "list" },
  { principal: null, owner: "u1", role: "anonymous", action: "delete" },
  { principal: "u1", owner: "u1", role: "member", action: "update" },
  { principal: "u2", owner: "u1", role: "member", action: "delete" },
  { principal: "u2", owner: "u1", role: "moderator", action: "delete" },
];
for (const c of cases) console.log(c.action + ":" + c.role + "=" + allowed(c));`, "list:anonymous=true\ndelete:anonymous=false\nupdate:member=true\ndelete:member=false\ndelete:moderator=true", ["owasp-authorization", "owasp-password", "local-guest-controller", "local-guest-service", "local-guest-mapper"])],
  }),
  appliedTopic({
    id: "mutation-cache-reconciliation", title: "create/update/delete를 optimistic transaction·invalidation과 server readback으로 합의시킵니다",
    lead: "operation마다 local patch/refetch 전략이 달라져도 confirmed base, pending overlay, query keys와 version rules를 하나의 mutation policy로 통일합니다.",
    mechanism: "mutation lifecycle은 validate→cancel relevant queries→snapshot/forward patch→server command→canonical result commit→targeted invalidation/readback이며 error에서 field-scoped rollback/rebase, settled에서 reconciliation을 수행합니다.",
    workflow: "query key factory와 entity version을 공유하고 create temp mapping, update field patch, delete tombstone의 inverse/rebase를 정의하며 concurrent mutations를 operation ID와 scope로 추적합니다.",
    invariants: "older refetch가 newer mutation을 덮지 않고 한 mutation rollback이 unrelated success를 되돌리지 않으며 authorization/schema-invalid response가 cache에 commit되지 않습니다.",
    edgeCases: "two edits, create then delete before confirm, update/delete conflict, refetch failure, offline queue, account switch와 websocket/poll update를 포함합니다.",
    failureModes: "각 handler가 store 배열을 독립 patch하고 fetchList를 await하지 않으면 cache/server/UI divergence와 stale overwrite가 조용히 남습니다.",
    verification: "all completion orders, optimistic inverse/rebase, version conflict, invalidate/refetch failures, auth epoch purge와 cache/server parity를 실행합니다.",
    operations: "pending age, optimistic commit/rollback/rebase, invalidation/readback lag, stale-drop와 divergence detection을 관찰하고 cache repair를 둡니다.",
    concepts: [c("mutation scope", "동시에 실행·직렬화·reconcile해야 하는 resource/query 범위와 operation identity입니다.", ["entity/collection별로 정합니다.", "global loading과 다릅니다."]), c("targeted invalidation", "mutation이 영향을 준 query key family만 stale로 표시해 재검증하는 동작입니다.", ["전체 cache clear보다 정밀합니다.", "auth scope를 포함합니다."]), c("readback", "mutation 후 server current representation/list를 다시 읽어 client 예상과 합의하는 검증입니다.", ["항상 필요한지는 정책입니다.", "commit uncertainty에 유용합니다."])],
    codeExamples: [node("react42-mutation-order", "versioned mutation/refetch reconciliation model", "React42MutationOrder.mjs", "old list response가 newer mutation version을 덮지 않게 합니다.", String.raw`let cache = { version: 3, value: "base" };
function commit(source, version, value) { if (version < cache.version) return source + ":stale"; cache = { version, value }; return source + ":committed"; }
console.log(commit("mutation", 5, "updated"));
console.log(commit("old-refetch", 4, "old-list"));
console.log(commit("new-refetch", 6, "canonical"));
console.log("cache=" + cache.version + "|" + cache.value);`, "mutation:committed\nold-refetch:stale\nnew-refetch:committed\ncache=6|canonical", ["tanstack-mutations", "tanstack-invalidation", "tanstack-optimistic", "local-guest-store", "local-guest-page"])],
  }),
  appliedTopic({
    id: "server-transaction-response-contract", title: "Controller·Service·Mapper transaction과 response contract를 atomic result로 만듭니다",
    lead: "HTTP 200과 service boolean만 보지 않고 validation·authorization·SQL affected rows·commit/rollback과 response schema가 같은 operation outcome을 표현하는지 검증합니다.",
    mechanism: "Controller는 transport/schema/principal을 검증해 command를 Service에 전달하고 Service transaction은 authorization/current version/business invariant와 Mapper affected rows를 확인합니다. 성공 commit 뒤 canonical DTO를 반환하고 validation/deny/not-found/conflict/DB failure는 stable HTTP problem으로 mapping합니다.",
    workflow: "operation별 transaction boundary, read-before-write 또는 conditional SQL, expected affected rows, exception translation, rollback, response status/problem/body와 correlation을 표로 만들고 client typed result와 합칩니다.",
    invariants: "DB rollback인데 client success를 반환하지 않고 0 rows를 무조건 성공으로 처리하지 않으며 raw SQL/exception/schema/credential detail이 response/log/UI로 새지 않습니다.",
    edgeCases: "constraint violation, deadlock, lock timeout, connection loss after commit, 0/2 affected rows, transaction retry, response serialization failure와 schema deploy skew를 포함합니다.",
    failureModes: "catch-all로 success=false만 반환하면 HTTP/cache/retry가 원인을 구분하지 못하고 update/delete row count를 확인하지 않으면 nonexistent/unauthorized target이 성공처럼 보입니다.",
    verification: "positive/validation/deny/not-found/conflict, affected rows 0/1/many, injected DB exceptions, commit uncertainty, response schema/redaction와 client reconciliation을 실행합니다.",
    operations: "transaction outcome, stable problem code, affected-row category, retry/deadlock/rollback/commit uncertainty와 schema/build version을 correlation으로 관찰합니다.",
    concepts: [c("transaction boundary", "함께 commit 또는 rollback되어야 하는 authorization·read/version·write 작업 범위입니다.", ["Service ownership을 명시합니다.", "HTTP request와 항상 같지는 않습니다."]), c("affected rows", "SQL write가 실제로 변경한 rows 수로 target/version/authorization condition 결과를 확인하는 값입니다.", ["예상치와 비교합니다.", "driver semantics를 검증합니다."]), c("problem mapping", "domain/DB 결과를 stable HTTP status·problem type/code와 safe fields로 변환하는 경계입니다.", ["raw exception을 숨깁니다.", "client recovery와 연결합니다."])],
    codeExamples: [node("react42-transaction-result", "affected-row transaction result classifier", "React42TransactionResult.mjs", "authorization/version 검증 뒤 affected rows와 exception을 stable outcome으로 분류합니다.", String.raw`function classify({ authorized, current, rows, dbError }) {
  if (!authorized) return "forbidden";
  if (!current) return "conflict";
  if (dbError) return "unavailable-rollback";
  if (rows === 0) return "not-found-or-conflict";
  if (rows !== 1) return "integrity-rollback";
  return "committed";
}
const cases = [{ authorized: false, current: true, rows: 0 }, { authorized: true, current: false, rows: 0 }, { authorized: true, current: true, rows: 1 }, { authorized: true, current: true, rows: 2 }, { authorized: true, current: true, rows: 0, dbError: true }];
for (const item of cases) console.log(classify(item));`, "forbidden\nconflict\ncommitted\nintegrity-rollback\nunavailable-rollback", ["rfc9110", "rfc9457", "local-guest-controller", "local-guest-service", "local-guest-mapper"])],
  }),
  appliedTopic({
    id: "content-accessibility-privacy", title: "untrusted content·CRUD forms·dynamic list를 접근성과 privacy boundary로 렌더링합니다",
    lead: "React escaping만 믿거나 disabled textarea로 content를 보여 주지 않고 semantic reading, long text, focus/status와 unsafe URL/HTML sinks를 검증합니다.",
    mechanism: "subject/content/writer/timestamp는 allowlisted text로 렌더링하고 raw HTML·style·URL을 별도 sanitize합니다. form labels/errors/busy, create/edit/delete status, list semantics와 focus recovery를 stable entity identity에 연결합니다.",
    workflow: "data classification, output context, max display/whitespace policy, headings/list/article semantics, label/describedby, live status와 keyboard focus destination을 operation state table에 넣습니다.",
    invariants: "content가 executable markup/URL/style에 들어가지 않고 PII/password/internal errors가 화면/DOM/analytics에 노출되지 않으며 색상/placeholder만으로 상태를 전달하지 않습니다.",
    edgeCases: "markup-like strings, bidi controls, long unbroken text, line breaks, duplicate headings, zoom/reflow, screen reader, edit/delete errors와 repeated announcements를 포함합니다.",
    failureModes: "dangerouslySetInnerHTML이나 unsafe link를 쓰면 XSS가 생길 수 있고 disabled form control을 display로 사용하면 reading/focus semantics와 contrast가 부적절할 수 있습니다.",
    verification: "XSS payload corpus, DOM sinks, keyboard/screen reader, label/error/status/focus, contrast/zoom, PII/password log/DOM scan와 CSP report를 실행합니다.",
    operations: "sanitization reject, content length, accessibility errors, focus loss와 sensitive sink canary를 privacy-safe하게 관찰합니다.",
    concepts: [c("output context", "untrusted value가 text, attribute, URL, style, HTML 중 어디에 삽입되는지 나타내는 보안 경계입니다.", ["context별 encoding/sanitize가 다릅니다.", "text를 기본으로 합니다."]), c("dynamic status", "CRUD 결과·오류·list 변화가 focus 이동 없이 assistive technology에 전달되는 메시지입니다.", ["민감정보를 제외합니다.", "중복을 통제합니다."]), c("entity focus anchor", "create/edit/delete/reorder 뒤 focus 복구에 사용하는 stable entity ID와 control role입니다.", ["array index를 피합니다.", "fallback을 정의합니다."])],
  }),
  appliedTopic({
    id: "full-stack-tests-observability-recovery", title: "full-stack contract·security·a11y tests와 DB/cache recovery를 운영합니다",
    lead: "frontend mock 성공을 넘어서 disposable DB/server/browser에서 SQL affected rows, authorization, HTTP schema, cache reconciliation과 user outcome을 하나로 검증합니다.",
    mechanism: "model tests는 operation/version, component tests는 forms/focus, contract tests는 API problems/schema, backend integration은 controller-service-mapper/transaction/auth, browser E2E는 route/storage/network/a11y, security tests는 IDOR/XSS/mass assignment와 secret sinks를 증명합니다.",
    workflow: "synthetic accounts/records와 unique run IDs로 list/create/edit/conflict/delete/deny/outage sequences를 실행하고 client/server/DB traces를 correlation으로 연결하며 artifacts를 redaction합니다.",
    invariants: "tests가 production user/password/token/content를 사용하지 않고 cleanup/rollback 뒤 DB/cache/client가 baseline이며 retry/sleep 운에 의존하지 않습니다.",
    edgeCases: "DB deadlock/constraint, transaction timeout, old/new schema, server rollback/client cache warm, multi-tab/device, partial outage와 backup restore를 포함합니다.",
    failureModes: "controller 200만 assert하면 SQL 0 rows와 client divergence를 놓치고 production DB dump/screenshots/traces를 사용하면 privacy/credential exposure가 생깁니다.",
    verification: "model/component/HTTP/backend/DB/browser/security/a11y/load, schema/affected-row/cache parity, secret artifact scan, canary, rollback/restore/reconciliation rehearsal를 실행합니다.",
    operations: "CRUD SLI, auth deny, DB rows/latency/errors, cache divergence, a11y/security signals와 build/schema/policy version을 dashboard·alert·owner·runbook에 연결합니다.",
    concepts: [c("full-stack contract test", "client request부터 server transaction/response와 final client state까지 실제 compatible layers를 검증하는 test입니다.", ["mock 단위 test를 보완합니다.", "synthetic data를 씁니다."]), c("correlated evidence", "같은 operation ID로 browser, HTTP, service, SQL과 cache state를 연결한 redacted evidence입니다.", ["root cause 분석에 사용합니다.", "payload를 최소화합니다."]), c("reconciliation rehearsal", "rollback/timeout/partial commit 뒤 DB/server/cache/UI 차이를 탐지·정지·복구하는 연습입니다.", ["backup restore도 포함합니다.", "owner와 RTO/RPO를 둡니다."])],
    codeExamples: [node("react42-fullstack-gate", "Guestbook full-stack release gate", "React42FullStackGate.mjs", "client/server/DB/security/a11y/recovery evidence로 release를 판정합니다.", String.raw`const evidence = { listSchema: true, createIdempotent: true, editConflict: true, deleteAuthz: true, affectedRows: true, cacheParity: true, xssBlocked: true, a11y: true, secretFindings: 0, rollbackReady: true };
const pass = Object.entries(evidence).every(([key, value]) => key === "secretFindings" ? value === 0 : value === true);
for (const [key, value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "listSchema=true\ncreateIdempotent=true\neditConflict=true\ndeleteAuthz=true\naffectedRows=true\ncacheParity=true\nxssBlocked=true\na11y=true\nsecretFindings=0\nrollbackReady=true\nrelease=pass", ["rfc9457", "owasp-authorization", "owasp-xss", "wcag-errors", "wcag-status", "tanstack-testing", "local-flow-doc", "local-guest-controller", "local-guest-service", "local-guest-mapper"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-guest-page", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["list/create/edit/delete UI", "auth visibility", "local/refetch reconciliation"], evidence: "2026-07-14 read-only sanitized audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. actual writer/email/password/content/routes/messages는 복사하지 않았습니다." },
  { id: "local-guest-store", repository: "D:/dev/my-app03", path: "src/store/useGuestbookStore.jsx", usedFor: ["client list cache", "update/remove actions"], evidence: "2026-07-14 read-only sanitized audit: 21 lines, 562 bytes, SHA-256 DA1A28E1BD3D8A7632530089011576C1FC7F4BE6A75D9001BFCD04323BABF209. actual domain values는 복사하지 않았습니다." },
  { id: "local-guest-api", repository: "D:/dev/my-app03", path: "src/api/GuestBook.jsx", usedFor: ["HTTP CRUD adapter"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 365 bytes, SHA-256 42CC6DCDAFB0BA46A85307C7A762656B11FB8D3194F2DC44FBD44AF7F32D37D4. actual routes/payloads는 복사하지 않았습니다." },
  { id: "local-flow-doc", repository: "D:/dev/REACT", path: "docs/integration/code-flow-by-feature.md", usedFor: ["client-server-SQL sequence provenance", "public/protected flow context"], evidence: "2026-07-14 read-only sanitized audit: 568 lines, 32,140 bytes, SHA-256 546F6BECA265FB69250102BF8406C62D818D07F9258C44B7C23068C240E5BD62. actual credentials/PII/routes/SQL values는 복사하지 않았습니다." },
  { id: "local-guest-controller", repository: "D:/dev/REACT", path: "code/springboot/02-integration-MyProject02/src/main/java/com/study/myproject02/guestbook/controller/GuestBookController.java", usedFor: ["HTTP controller CRUD flow", "response shape/authorization audit"], evidence: "2026-07-14 read-only sanitized audit: 107 lines, 3,917 bytes, SHA-256 889A00EA9E2D8BEEC7F7F0EE91021647F5C0D0078093D040A91C01EA8CAEFE6C. actual routes/fields/messages는 복사하지 않았습니다." },
  { id: "local-guest-service", repository: "D:/dev/REACT", path: "code/springboot/02-integration-MyProject02/src/main/java/com/study/myproject02/guestbook/service/GuestBookServiceImpl.java", usedFor: ["service/mapper flow", "secret/writer verification audit"], evidence: "2026-07-14 read-only sanitized audit: 51 lines, 1,866 bytes, SHA-256 3C8B9A10371DFBA2A0B22B7A220D7ACDE47EF25555E32954574FFE0B4A388F15. actual writer/password/field values는 복사하지 않았습니다." },
  { id: "local-guest-mapper", repository: "D:/dev/REACT", path: "code/springboot/02-integration-MyProject02/src/main/resources/mapper/guestbook-mapper.xml", usedFor: ["SQL list/insert/update/soft-delete provenance", "affected-row/auth condition audit"], evidence: "2026-07-14 read-only sanitized audit: 30 lines, 1,326 bytes, SHA-256 3A85DBE88834EE67111DE9F09445D30EBE05EF4619F1B4D2B2A0BB6E872E9CCB. actual table/column/parameter values는 공개 examples에 복사하지 않았습니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP method/status/idempotency/preconditions"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["typed API problem responses"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "react-xss", repository: "React official documentation", path: "reference/react-dom/components/common#dangerously-setting-the-inner-html", publicUrl: "https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html", usedFor: ["raw HTML sink warning/context"], evidence: "React 공식 DOM common props guidance입니다." },
  { id: "tanstack-queries", repository: "TanStack Query official documentation", path: "framework/react/guides/queries", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/queries", usedFor: ["list query state"], evidence: "TanStack Query 공식 queries guidance입니다." },
  { id: "tanstack-query-keys", repository: "TanStack Query official documentation", path: "framework/react/guides/query-keys", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys", usedFor: ["cache identity"], evidence: "TanStack Query 공식 query keys guidance입니다." },
  { id: "tanstack-mutations", repository: "TanStack Query official documentation", path: "framework/react/guides/mutations", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/mutations", usedFor: ["mutation lifecycle"], evidence: "TanStack Query 공식 mutations guidance입니다." },
  { id: "tanstack-invalidation", repository: "TanStack Query official documentation", path: "framework/react/guides/invalidations-from-mutations", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations", usedFor: ["targeted invalidation"], evidence: "TanStack Query 공식 invalidation guidance입니다." },
  { id: "tanstack-optimistic", repository: "TanStack Query official documentation", path: "framework/react/guides/optimistic-updates", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates", usedFor: ["optimistic transaction/rollback"], evidence: "TanStack Query 공식 optimistic updates guidance입니다." },
  { id: "tanstack-testing", repository: "TanStack Query official documentation", path: "framework/react/guides/testing", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/testing", usedFor: ["isolated cache/component tests"], evidence: "TanStack Query 공식 testing guidance입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["deny-by-default/object authorization"], evidence: "OWASP 공식 authorization guidance입니다." },
  { id: "owasp-password", repository: "OWASP Cheat Sheet Series", path: "Password_Storage_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", usedFor: ["secret/password storage/verification context"], evidence: "OWASP 공식 password storage guidance입니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross_Site_Scripting_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["output-context XSS prevention"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
  { id: "wcag-errors", repository: "W3C WAI WCAG", path: "Understanding/error-identification", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html", usedFor: ["accessible form errors"], evidence: "W3C WAI 공식 error identification guidance입니다." },
  { id: "wcag-status", repository: "W3C WAI WCAG", path: "Understanding/status-messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["dynamic CRUD status messages"], evidence: "W3C WAI 공식 status message guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-42-guestbook-crud", slug: "react-42-integrated-guestbook-crud", courseId: "react", moduleId: "react-integrated-app-quality", order: 2,
  title: "통합 Guestbook CRUD", subtitle: "React form·query/mutation에서 Spring controller·service·SQL과 server authorization, version conflict, 접근성, full-stack recovery까지 연결합니다.",
  level: "고급", estimatedMinutes: 155,
  coreQuestion: "방명록 CRUD를 demo 버튼 모음이 아니라 concurrent users, untrusted content, authorization, DB failure와 rollback 뒤에도 합의되는 full-stack feature로 어떻게 완성할까요?",
  summary: "my-app03 GuestBook page/store/API, REACT integration flow와 보존 Spring Controller/Service/Mapper 7개 sources를 read-only·sanitized 감사해 list/create/update/delete의 실제 계층 경로와 local patch/refetch를 보존합니다. 실제 writer/email/password/content/routes/SQL values는 복사하지 않습니다. public list schema, idempotent create, versioned edit, authorized soft delete, server object authorization/secret lifecycle, optimistic cache reconciliation, untrusted-content/a11y와 full-stack DB/security/recovery qualification을 IETF·React·TanStack·OWASP·W3C 근거와 일곱 executable models로 확장합니다.",
  objectives: ["원본 client→server→SQL CRUD path를 redacted audit한다.", "공개 list를 query state/schema/safe rendering으로 구현한다.", "create를 validated idempotent command와 canonical result로 만든다.", "edit draft와 version conflict를 복구한다.", "delete confirmation/soft-delete/affected-row를 검증한다.", "client visibility와 server object authorization/secret lifecycle을 분리한다.", "optimistic mutation/invalidation/readback으로 cache와 server를 합의시킨다.", "untrusted content, forms, dynamic list 접근성과 privacy를 지킨다.", "full-stack DB/security/a11y tests와 rollback/reconciliation을 운영한다."],
  prerequisites: [{ title: "통합 인증·사용자 여정", reason: "current principal, auth epoch, refresh/logout, profile/navigation와 server authorization 경계를 알아야 public list와 authenticated CRUD operations를 안전하게 통합할 수 있습니다.", sessionSlug: "react-41-integrated-auth-user-flow" }],
  keywords: ["Guestbook", "CRUD", "idempotency", "ETag", "optimistic update", "soft delete", "object authorization", "XSS", "affected rows", "query invalidation", "full-stack test", "reconciliation"],
  topics,
  lab: { title: "원본 Guestbook을 versioned authorized full-stack CRUD로 qualification하기", scenario: "원본 files는 변경하지 않고 synthetic accounts/records와 disposable DB/Spring-compatible API/React browser fixture에서 list→create→edit conflict→delete/deny→rollback을 재현합니다.", setup: ["Node 20 이상", "React/query client browser fixture", "disposable Spring-compatible HTTP server", "isolated transactional database", "deferred requests/fake faults", "keyboard/security tooling", "secret artifact scanner", "원본 7 files read-only"], steps: ["원본 hashes와 redacted client/server/SQL operation sequence를 기록합니다.", "public list status/schema/redaction/dedupe/freshness와 safe text rendering을 구현합니다.", "create form/server validation/principal binding/idempotency/readback을 검증합니다.", "edit draft/version precondition/two-client conflict/merge UX를 시험합니다.", "delete target/confirmation/principal/version/soft-delete/affected rows와 focus fallback을 검증합니다.", "anonymous/owner/other/moderator 및 ID/owner/field/secret tamper authorization matrix를 실행합니다.", "concurrent optimistic mutations, stale refetch, rollback/rebase/invalidation/readback을 fault-test합니다.", "XSS-like content, keyboard/screen reader, labels/errors/status/focus/zoom과 sensitive DOM/log scans를 실행합니다.", "controller/service/mapper/DB transaction/schema/affected-row와 client cache parity를 integration test합니다.", "partial outage/rollback/DB restore/cache repair, canary와 full reconciliation runbook을 rehearsal합니다."], expectedResult: ["public list가 invalid/sensitive rows를 노출하지 않고 empty/error/stale states를 정확히 표현합니다.", "duplicate/retried create와 concurrent edit/delete가 duplicate/lost/stale data를 만들지 않습니다.", "client tampering으로 다른 resource나 forbidden fields를 변경할 수 없고 secrets가 저장·로그·응답되지 않습니다.", "CRUD pending/error/conflict/result와 list changes가 keyboard/screen reader에 명확합니다.", "server/DB/cache/UI가 장애·rollback 뒤 correlated evidence와 함께 합의됩니다."], cleanup: ["synthetic accounts/records/idempotency keys, DB schema/data와 server/client caches를 제거합니다.", "requests, mutation queues, timers/listeners, browser storage/history와 test servers를 종료합니다.", "logs/traces/screenshots/secret canaries를 retention policy에 따라 폐기합니다.", "원본 7 files hash/status unchanged를 확인합니다."], extensions: ["cursor pagination/search/moderation/audit log를 추가합니다.", "real-time SSE/WebSocket updates와 versioned cache merge를 구현합니다.", "file attachments의 content scan/authorization/lifecycle을 추가합니다.", "DB backup/restore와 client cache reconciliation dashboard를 자동화합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 actual React/API/DB results와 대응시키세요.", requirements: ["stdout 완전 일치", "redacted source sequence", "list schema", "create idempotency", "edit conflict", "authorization matrix", "mutation order", "release gate", "model 범위"], hints: ["Node model을 actual Spring transaction/SQL authorization/browser rendering evidence라고 표현하지 마세요."], expectedOutcome: "각 CRUD operation이 UI에서 DB와 reconciliation까지 이동하는 경로를 설명합니다.", solutionOutline: ["audit→list/create→edit/delete/auth→cache/a11y→full-stack recover 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Guestbook을 production-safe full-stack feature로 재설계하세요.", requirements: ["typed list/schema", "idempotent create", "versioned edit", "authorized delete", "server principal/fields", "optimistic reconciliation", "XSS/a11y", "DB integration", "rollback/repair"], hints: ["writer string이나 client button visibility를 authorization으로 사용하지 마세요."], expectedOutcome: "concurrency·attack·DB failure에도 correct·secure·accessible·recoverable CRUD가 완성됩니다.", solutionOutline: ["threat/contracts→commands/versions→authorize/transaction→cache/UI→qualification 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 full-stack CRUD governance를 작성하세요.", requirements: ["source/contract trace", "schema/identity", "idempotency/version", "authorization/secrets", "transactions/rows", "cache/reconciliation", "a11y/privacy", "tests/operations"], hints: ["Controller/Service/Mapper 계층 이름보다 data integrity와 failure recovery evidence를 중심으로 작성하세요."], expectedOutcome: "모든 CRUD feature가 client부터 DB와 incident recovery까지 같은 기준으로 review됩니다.", solutionOutline: ["trace→validate→authorize→commit→reconcile→observe/recover 순서입니다."] },
  ],
  nextSessions: ["react-43-component-integration-e2e-testing"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["원본 docs/source의 actual writer/email/password/content/routes/SQL/table/parameter values는 공개 content에 복사하지 않았습니다.", "원본 writer/password-related checks와 client button visibility를 관찰했지만 robust principal-bound object authorization이라고 과장하지 않습니다.", "source의 local patch/refetch/soft-delete structure를 보존했지만 idempotency/version/transaction/affected-row/cache reconciliation이 모두 구현됐다고 주장하지 않습니다.", "Node models는 actual React/query cache, Spring Security/controller/service/transaction/MyBatis/DB와 browser accessibility/security를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
