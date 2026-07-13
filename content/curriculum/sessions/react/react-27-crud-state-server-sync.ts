import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const sourceAuditRefs = ["local-todo-store", "local-memo-store", "local-todo-page", "local-memo-page", "local-guest-store", "local-guest-page"];

const topics = [
  appliedTopic({
    id: "source-crud-state-audit", title: "Todo·Memo·Guestbook 원본을 state owner와 persistence 경계로 감사합니다",
    lead: "화면에 CRUD 버튼이 있다는 사실을 넘어 entity가 어디서 만들어지고 누가 authoritative하며 refresh·실패·재시도 뒤 어떤 state가 남는지 복원합니다.",
    mechanism: "my-app02 Todo/Memo는 persist middleware가 local browser state를 저장하고 page가 store action을 직접 호출합니다. my-app03 Guestbook은 server list를 store에 복사하고 insert 뒤 비동기 refetch, update/delete 뒤 local patch를 수행해 consistency 전략이 서로 다릅니다.",
    workflow: "각 source의 entity key, create/update/delete input, local draft, pending/error, persistence, server response, refresh/retry와 authorization assumption을 sanitized table로 만들고 source fact와 개선안을 분리합니다.",
    invariants: "원본은 변경하지 않고 실제 memo/todo/user/guestbook/password·endpoint 값을 복사하지 않으며 authoritativeness와 durability를 코드 경로별로 명시합니다.",
    edgeCases: "empty list, duplicate timestamp ID, refresh, two tabs, offline, repeated click, out-of-order list, edit/delete overlap, logout와 account switch를 포함합니다.",
    failureModes: "localStorage demo와 server CRUD를 같은 durable store로 취급하면 다른 기기·사용자와 동기화가 깨지고 awaited하지 않은 refetch가 실패해도 성공 UI로 남을 수 있습니다.",
    verification: "source hashes, action/state graph, async await inventory, error sinks, sensitive-field flow, refresh/offline replay와 original worktree unchanged를 확인합니다.",
    operations: "entity owner, persistence type, pending operation, reconciliation status와 last successful sync를 privacy-safe reason codes로 관찰하고 복구 owner를 정합니다.",
    concepts: [c("authoritative state", "충돌 시 최종 사실로 인정하는 source의 state입니다.", ["local/server별로 선언합니다.", "cache copy와 구분합니다."]), c("persistence boundary", "memory·browser storage·server DB 중 state가 생존하는 범위입니다.", ["사용자 범위도 포함합니다.", "durability를 과장하지 않습니다."]), c("reconciliation", "local 예상 state와 server confirmed state의 차이를 비교해 합의된 상태로 복구하는 절차입니다.", ["operation identity가 필요합니다.", "조용한 overwrite를 피합니다."])],
    codeExamples: [node("react27-source-boundaries", "sanitized CRUD source boundary inventory", "React27SourceBoundaries.mjs", "원본 값 없이 각 feature의 owner·persistence·sync shape를 출력합니다.", String.raw`const features = [
  ["todo", "browser-store", "persisted-local", "direct-actions"],
  ["memo", "browser-store", "persisted-local", "direct-actions"],
  ["guestbook", "server", "memory-cache", "fetch-and-patch"],
];
for (const row of features) console.log(row.join("|"));
console.log("private-values-copied=false");`, "todo|browser-store|persisted-local|direct-actions\nmemo|browser-store|persisted-local|direct-actions\nguestbook|server|memory-cache|fetch-and-patch\nprivate-values-copied=false", sourceAuditRefs.concat(["zustand-updating", "react-state-structure"]))],
  }),
  appliedTopic({
    id: "local-draft-entity-server-state", title: "local draft·entity cache·server state를 분리합니다",
    lead: "모든 값을 global store 한 object에 넣지 않고 lifetime, sharing, invalidation과 authority가 같은 state만 함께 둡니다.",
    mechanism: "form draft/edit mode는 component 또는 route lifetime, normalized entity cache는 ID 기반 공유, server state는 freshness·request·authorization metadata를 가집니다. derived counts와 filtered lists는 authoritative collection에서 계산합니다.",
    workflow: "각 value에 owner, lifetime, persistence, sensitivity, invalidation trigger와 consumer를 표시하고 duplicated state를 제거한 뒤 server snapshot과 pending overlay를 분리합니다.",
    invariants: "같은 entity는 canonical ID record 하나를 가지며 draft는 confirmed entity를 입력 중에 mutation하지 않고 derived state를 별도로 저장하지 않습니다.",
    edgeCases: "new unsaved item, edit cancel, server default, partial response, schema migration, route leave, account switch와 stale cache를 다룹니다.",
    failureModes: "server list와 filtered list를 각각 mutable state로 보관하면 update마다 divergence하고 edit input을 entity에 직접 bind하면 cancel이 불가능해집니다.",
    verification: "state classification table, duplicate owner detector, edit/cancel/submit tests, derived parity, route unmount와 auth-scope purge를 실행합니다.",
    operations: "cache age, drafts count, pending overlay, orphan entity와 auth scope mismatch를 관찰하고 safe discard/recovery UX를 둡니다.",
    concepts: [c("local draft", "아직 제출되지 않은 사용자 입력과 편집 상태입니다.", ["confirmed entity와 분리합니다.", "취소/복구 policy가 필요합니다."]), c("entity cache", "stable ID로 정규화한 server entity의 client copy입니다.", ["authority는 server일 수 있습니다.", "freshness metadata를 둡니다."]), c("pending overlay", "confirmed base 위에 아직 server 확정되지 않은 local operation을 적용한 view입니다.", ["rollback/rebase가 가능합니다.", "base를 파괴하지 않습니다."])],
    codeExamples: [node("react27-state-classifier", "state lifetime·authority classifier", "React27StateClassifier.mjs", "feature state를 local/cache/server-derived로 분류합니다.", String.raw`const fields = [
  { name: "editDraft", lifetime: "route", owner: "client" },
  { name: "entities", lifetime: "request-cache", owner: "server" },
  { name: "remainingCount", lifetime: "derived", owner: "calculation" },
  { name: "pendingOps", lifetime: "sync", owner: "client-overlay" },
];
for (const f of fields) console.log(f.name + "=" + f.owner + "@" + f.lifetime);`, "editDraft=client@route\nentities=server@request-cache\nremainingCount=calculation@derived\npendingOps=client-overlay@sync", ["react-state-structure", "zustand-updating", "local-todo-page", "local-memo-page", "local-guest-page"])],
  }),
  appliedTopic({
    id: "entity-identity-normalization", title: "entity identity·normalization과 client temporary ID를 설계합니다",
    lead: "Date.now 같은 편의 ID와 server primary key를 구분하고 create confirmation 전후에도 list key와 operation target이 흔들리지 않게 합니다.",
    mechanism: "normalized state는 entitiesById와 orderedIds를 분리하고 client-generated operation/temp ID가 optimistic item을 추적합니다. server ID가 도착하면 atomic mapping으로 references, selection과 pending operation을 치환합니다.",
    workflow: "server ID namespace, collision rule, temp prefix/UUID, canonicalization, duplicate response와 missing ID validation을 정의하고 list merge 전에 schema guard를 실행합니다.",
    invariants: "같은 logical entity는 한 canonical record만 갖고 sibling key는 stable하며 temp-to-server mapping은 한 번만 적용되고 duplicate IDs는 stable failure가 됩니다.",
    edgeCases: "same-millisecond create, offline multiple tabs, server ID type drift, duplicate page, deletion before create confirmation과 reordered response를 포함합니다.",
    failureModes: "timestamp를 unique로 믿으면 빠른/다중-tab create에서 collision하고 server response 전체로 list를 교체하면 pending local entity가 소실됩니다.",
    verification: "collision corpus, duplicate/missing/wrong-type IDs, temp mapping idempotency, list-key preservation와 property-based operation sequences를 실행합니다.",
    operations: "collision, unmapped temp, orphan references, duplicate server IDs와 reconciliation age를 metric/runbook으로 관리합니다.",
    concepts: [c("normalized state", "entity record map과 표시 순서 ID 배열을 분리한 구조입니다.", ["중복 record를 줄입니다.", "ordered relation은 별도입니다."]), c("temporary ID", "server ID가 오기 전 optimistic entity와 operation을 식별하는 client-scoped ID입니다.", ["namespace를 구분합니다.", "server confirmation 때 mapping합니다."]), c("canonicalization", "다양한 wire ID/type을 검증된 하나의 canonical key 형태로 변환하는 절차입니다.", ["collision을 검사합니다.", "schema boundary에서 수행합니다."])],
    codeExamples: [node("react27-temp-id-map", "temporary-to-server ID atomic mapping", "React27TempIdMap.mjs", "optimistic entity와 order references를 한 번에 server ID로 교체합니다.", String.raw`let state = { entities: { "tmp:a": { id: "tmp:a", text: "synthetic" } }, order: ["tmp:a"], pending: ["tmp:a"] };
function confirm(temp, server) {
  if (!state.entities[temp] || state.entities[server]) return false;
  const entity = { ...state.entities[temp], id: server };
  const entities = { ...state.entities, [server]: entity };
  delete entities[temp];
  state = { entities, order: state.order.map((id) => id === temp ? server : id), pending: state.pending.filter((id) => id !== temp) };
  return true;
}
console.log("first=" + confirm("tmp:a", "srv:42"));
console.log("second=" + confirm("tmp:a", "srv:42"));
console.log("order=" + state.order.join(","));
console.log("pending=" + (state.pending.join(",") || "none"));`, "first=true\nsecond=false\norder=srv:42\npending=none", ["react-render-lists", "zustand-updating", "rfc9110"] )],
  }),
  appliedTopic({
    id: "command-result-state-machine", title: "CRUD action을 command·state machine·typed result로 만듭니다",
    lead: "store action이 array만 바꾸고 끝나지 않도록 operation ID, pending phase, validation, response와 failure recovery를 명시합니다.",
    mechanism: "create/update/delete command는 target identity와 sanitized payload, base version, operation ID를 갖고 idle→pending→succeeded/failed/conflicted/cancelled로 전환합니다. transport exception과 domain rejection을 stable problem code로 분류합니다.",
    workflow: "입력 schema를 검증하고 duplicate submission을 막거나 같은 idempotency key로 합치며 request 후 status/schema/version을 확인해 reducer event로 commit합니다.",
    invariants: "terminal event는 해당 current operation에만 적용되고 UI pending/error가 action별로 독립적이며 raw server message나 secret field를 그대로 표시·기록하지 않습니다.",
    edgeCases: "double click, timeout after server commit, validation 400/422, unauthorized 401/403, not found 404, conflict 409/412와 retry를 포함합니다.",
    failureModes: "boolean loading 하나는 create/delete overlap을 표현하지 못하고 catch에서 모두 같은 메시지를 쓰면 retryable/validation/conflict 복구가 불가능합니다.",
    verification: "state transition table, invalid event negatives, duplicate operation, late terminal event, HTTP/problem mapping과 accessible pending/error UI를 검증합니다.",
    operations: "operation kind·terminal reason·latency·retry·conflict를 low-cardinality로 관찰하고 raw payload/credentials는 telemetry에서 제외합니다.",
    concepts: [c("CRUD command", "검증된 target/payload/version/operation ID를 가진 변경 의도입니다.", ["transport request와 구분합니다.", "재시도 정책을 포함합니다."]), c("operation state machine", "각 command의 pending부터 terminal result까지 허용 전환을 정의한 model입니다.", ["불법 전환을 거부합니다.", "concurrent operations를 구분합니다."]), c("typed problem", "HTTP/domain 실패를 stable code, safe message, field errors와 retry hint로 정규화한 결과입니다.", ["raw exception을 숨깁니다.", "RFC 9457과 연결할 수 있습니다."])],
    codeExamples: [node("react27-operation-machine", "CRUD operation transition model", "React27OperationMachine.mjs", "late/duplicate terminal events를 operation ID로 거부합니다.", String.raw`let op = { id: "op-1", phase: "idle" };
function event(id, type) {
  if (id !== op.id) return "stale";
  const allowed = { idle: ["start"], pending: ["success", "fail", "conflict"] };
  if (!(allowed[op.phase] || []).includes(type)) return "invalid";
  op = { ...op, phase: type === "start" ? "pending" : type };
  return op.phase;
}
console.log("start=" + event("op-1", "start"));
console.log("old=" + event("op-0", "success"));
console.log("success=" + event("op-1", "success"));
console.log("duplicate=" + event("op-1", "success"));`, "start=pending\nold=stale\nsuccess=success\nduplicate=invalid", ["rfc9110", "rfc9457", "react-state-structure", "local-guest-page"])],
  }),
  appliedTopic({
    id: "optimistic-transaction-rollback", title: "optimistic create/update/delete를 reversible transaction으로 구현합니다",
    lead: "UI를 먼저 바꾸는 것을 단순 배열 mutation으로 끝내지 않고 base snapshot, forward patch, inverse patch와 operation identity로 복구합니다.",
    mechanism: "optimistic transaction은 confirmed base 위에 pending patch를 적용하고 success에서 server canonical result로 확정하며 failure에서 inverse 또는 current base 위 rebase를 수행합니다. dependent operations는 causal ordering을 가집니다.",
    workflow: "operation별 affected entity/fields, precondition/version, forward/inverse, server canonicalization과 user-visible pending marker를 기록하고 rollback conflict policy를 정의합니다.",
    invariants: "한 operation 실패가 이후 unrelated 성공을 되돌리지 않고 rollback이 current newer edit를 덮지 않으며 pending item이 confirmed처럼 권한·durability를 주장하지 않습니다.",
    edgeCases: "create then edit/delete before confirm, two field updates, retry after timeout, server normalization, partial batch failure와 app reload를 다룹니다.",
    failureModes: "전체 이전 list를 snapshot으로 저장했다가 rollback하면 그 사이 성공한 변경까지 소실되고 array index rollback은 reorder 뒤 다른 item을 수정합니다.",
    verification: "operation permutations, inverse/rebase property tests, late success/failure, reload recovery, duplicate retry와 accessible pending/rollback announcement를 실행합니다.",
    operations: "optimistic age, rollback/rebase/conflict rate, orphan pending과 user reconciliation을 관찰하고 optimistic feature kill switch를 둡니다.",
    concepts: [c("optimistic transaction", "server 확정 전에 예상 결과를 표시하되 추적·복구 가능한 변경 단위입니다.", ["operation ID가 필요합니다.", "confirmed state와 구분합니다."]), c("inverse patch", "해당 forward patch만 되돌리는 field/identity 기반 변경입니다.", ["전체 snapshot rollback보다 정밀합니다.", "newer edit를 보호합니다."]), c("causal order", "한 operation이 다른 operation 결과에 의존하는 선후 관계입니다.", ["create 전 delete를 막습니다.", "queue/rebase에 사용합니다."])],
    codeExamples: [node("react27-optimistic-rollback", "field-scoped optimistic rollback", "React27OptimisticRollback.mjs", "한 field 실패가 이후 다른 field 성공을 덮지 않는 rollback을 실행합니다.", String.raw`let entity = { id: "e1", title: "old", done: false };
const beforeTitle = entity.title;
entity = { ...entity, title: "pending-title" };
entity = { ...entity, done: true };
if (entity.title === "pending-title") entity = { ...entity, title: beforeTitle };
console.log("title=" + entity.title);
console.log("done=" + entity.done);
console.log("whole-snapshot-restored=false");`, "title=old\ndone=true\nwhole-snapshot-restored=false", ["zustand-updating", "rfc9110", "local-todo-store", "local-memo-store", "local-guest-store"])],
  }),
  appliedTopic({
    id: "version-conflict-lost-update", title: "ETag·version precondition으로 lost update를 탐지·병합합니다",
    lead: "마지막 요청이 이긴다는 암묵적 정책 대신 사용자가 편집한 base version과 server current version을 비교합니다.",
    mechanism: "server는 representation ETag 또는 entity version을 제공하고 client update/delete는 If-Match 같은 precondition을 보냅니다. mismatch는 412/409로 분류해 latest fetch, field-level diff와 explicit overwrite/merge/cancel UX로 해결합니다.",
    workflow: "edit 시작 때 base snapshot/version을 고정하고 submit payload와 precondition을 연결하며 conflict response에서 base/local/current 3-way comparison을 만듭니다.",
    invariants: "stale client가 newer server state를 조용히 덮지 않고 overwrite 권한과 감사 기록이 있으며 merge 결과를 다시 validation/authorization합니다.",
    edgeCases: "delete conflict, weak/strong ETag, clock skew, partial update, same field/different fields, schema change와 offline long edit를 포함합니다.",
    failureModes: "updatedAt client time이나 last response arrival만 비교하면 clock/race 때문에 lost update를 놓치고 자동 field merge가 semantic invariant를 깨뜨릴 수 있습니다.",
    verification: "two-client concurrent edit, stale delete, same/different field 3-way merge, malformed/missing version와 retry precondition tests를 실행합니다.",
    operations: "conflict entity type/reason, resolution choice, retry loops와 reconciliation latency를 privacy-safe하게 관찰하고 manual recovery tool을 둡니다.",
    concepts: [c("lost update", "두 client의 read-modify-write 중 늦은 write가 앞선 변경을 조용히 덮는 오류입니다.", ["precondition으로 탐지합니다.", "arrival order와 다릅니다."]), c("entity version", "server가 entity 변경마다 갱신하는 concurrency token입니다.", ["ETag로 표현할 수 있습니다.", "client clock을 믿지 않습니다."]), c("three-way merge", "편집 base, local edit와 server current를 비교해 충돌 fields를 찾는 병합입니다.", ["자동/수동 정책이 필요합니다.", "재검증합니다."])],
    codeExamples: [node("react27-three-way-conflict", "three-way field conflict detector", "React27ThreeWayConflict.mjs", "base/local/server의 같은 field 변경만 conflict로 분류합니다.", String.raw`const base = { title: "A", done: false };
const local = { title: "B", done: false };
const server = { title: "C", done: true };
for (const key of Object.keys(base)) {
  const localChanged = !Object.is(base[key], local[key]);
  const serverChanged = !Object.is(base[key], server[key]);
  const conflict = localChanged && serverChanged && !Object.is(local[key], server[key]);
  console.log(key + "=" + (conflict ? "conflict" : localChanged ? "local" : serverChanged ? "server" : "same"));
}`, "title=conflict\ndone=server", ["rfc9110", "rfc9111"])],
  }),
  appliedTopic({
    id: "query-invalidation-race-reconciliation", title: "mutation 뒤 invalidate·refetch·push update를 versioned reconciliation으로 연결합니다",
    lead: "insert 후 fetchList를 호출했다는 사실이 최신 목록을 보장하지 않으므로 mutation result, refetch generation과 cache merge의 선후를 제어합니다.",
    mechanism: "mutation은 affected query keys와 entity를 알려주고 cache는 cancel/optimistic patch/commit/invalidate를 수행합니다. refetch response는 request generation과 server version을 검사해 current cache보다 오래되면 폐기하거나 field-aware merge합니다.",
    workflow: "query key에 auth/tenant/filter/page를 포함하고 mutation을 await한 뒤 current generation의 reconciliation까지 UI terminal state에 포함하며 push/poll events도 같은 version reducer로 통합합니다.",
    invariants: "older list가 newer mutation result를 덮지 않고 다른 account/query의 data가 섞이지 않으며 success가 표시될 때 정의한 consistency level을 만족합니다.",
    edgeCases: "unawaited refetch, response inversion, duplicate page, websocket update, tab focus refresh, logout mid-flight, partial cache와 offline reconnect를 포함합니다.",
    failureModes: "전역 list key 하나와 replace-all setter는 filter/account 간 cache leak와 stale overwrite를 만들고 mutation 성공만으로 reconciliation 성공을 가정합니다.",
    verification: "controlled response order, query-key isolation, mutation/refetch failure combinations, push/refetch dedupe, auth epoch switch와 cache purge tests를 실행합니다.",
    operations: "stale-drop, invalidate/refetch failure, cache age/version, reconciliation lag와 post-logout drop을 관찰하고 refetch/clear/repair runbook을 둡니다.",
    concepts: [c("query key", "server-state cache identity를 만드는 resource·scope·parameter tuple입니다.", ["auth/tenant를 포함합니다.", "UI label이 아닙니다."]), c("invalidation", "cached result를 stale로 표시해 재검증 대상임을 선언하는 동작입니다.", ["즉시 삭제와 다릅니다.", "refetch policy와 연결합니다."]), c("request generation", "같은 query에서 현재 유효한 요청 계열을 식별하는 version입니다.", ["older response를 거릅니다.", "entity version을 보완합니다."])],
  }),
  appliedTopic({
    id: "authorization-sensitive-fields", title: "client CRUD visibility와 server authorization·sensitive fields를 분리합니다",
    lead: "로그인 여부·작성자 이름 비교로 버튼을 숨기는 UX를 실제 수정·삭제 권한 검증으로 오해하지 않습니다.",
    mechanism: "client는 authenticated UI와 request shape를 조정하지만 server가 authenticated principal, resource ownership/role, allowed fields와 current version을 매 operation에 검증합니다. password/token 같은 sensitive inputs는 global/persisted store와 logs에 남기지 않습니다.",
    workflow: "operation별 subject/resource/action/field matrix를 만들고 deny-by-default server policy, generic safe error, reauthentication/CSRF/token 경계와 cache purge를 정의합니다.",
    invariants: "UI를 조작하거나 request identity field를 바꿔도 다른 사용자의 resource를 변경할 수 없고 credential-like values는 memory에 최소 시간만 존재하며 telemetry/storage에서 제외됩니다.",
    edgeCases: "same display name, ID tampering, role downgrade, logout race, expired session, cross-tab, mass assignment, replay와 enumeration을 포함합니다.",
    failureModes: "client user name과 entity writer string equality는 권한 증명이 아니고 request의 writer/owner fields를 그대로 신뢰하면 IDOR/mass assignment가 발생합니다.",
    verification: "direct API ID tamper, missing/other principal, forbidden fields, role/account switch, replay, log/storage/bundle secret scan과 cache purge tests를 실행합니다.",
    operations: "deny reason, suspicious target changes, post-logout attempts와 sensitive sink canary를 안전하게 관찰하고 revoke/rotate/purge/reconcile 절차를 둡니다.",
    concepts: [c("UI affordance", "가능한 동작을 보여 주거나 숨기는 client presentation입니다.", ["authorization control이 아닙니다.", "접근성을 지킵니다."]), c("object authorization", "현재 principal이 특정 resource에 특정 action을 수행할 수 있는지 server가 검증하는 절차입니다.", ["매 요청 확인합니다.", "IDOR를 막습니다."]), c("sensitive transient state", "password/token처럼 짧게 memory에서만 다루고 persistence/log를 금지하는 입력입니다.", ["lifetime을 제한합니다.", "cleanup을 시험합니다."])],
  }),
  appliedTopic({
    id: "crud-form-error-accessibility", title: "CRUD form·pending·error·conflict UX를 keyboard와 assistive technology까지 설계합니다",
    lead: "성공 경로 버튼만 만들지 않고 각 operation의 label, validation, busy, focus, status와 recovery action을 일관된 state machine에 연결합니다.",
    mechanism: "field error는 control과 programmatically 연결하고 operation pending은 중복 제출을 막되 취소/진행 정보를 제공합니다. create/delete/update 뒤 focus destination과 status message를 결정적으로 정하며 conflict는 선택 가능한 diff로 제시합니다.",
    workflow: "form semantics, label/instructions, field/global error, aria-invalid/describedby, live status, focus fallback, keyboard order와 destructive confirmation을 design/test matrix로 만듭니다.",
    invariants: "색상만으로 status를 전달하지 않고 error 발생/해결 때 focus와 입력을 보존하며 pending UI가 navigation/accessibility tree를 예기치 않게 제거하지 않습니다.",
    edgeCases: "multiple field errors, server global problem, repeated status, long content, IME, slow request, delete last row, conflict modal와 reduced motion을 포함합니다.",
    failureModes: "catch 메시지만 화면 아래 출력하면 어떤 field인지 알 수 없고 list rerender 뒤 focus가 body로 사라지며 disabled button만으로 진행 이유를 알리지 못합니다.",
    verification: "keyboard-only, screen reader name/description/status, focus after add/edit/delete/error, contrast/zoom, slow/retry/conflict와 automated/manual accessibility checks를 실행합니다.",
    operations: "validation/retry/abandon, focus loss, repeated submit와 accessibility regression을 privacy-safe하게 관찰하고 fallback UX를 둡니다.",
    concepts: [c("field error association", "오류 메시지를 해당 form control과 접근성 API로 연결하는 관계입니다.", ["visible text만으로 부족합니다.", "해결 시 갱신합니다."]), c("status message", "focus를 옮기지 않고 operation 결과를 assistive technology에 전달하는 동적 메시지입니다.", ["중복 announcement를 통제합니다.", "민감 detail을 제외합니다."]), c("focus recovery", "삭제·오류·modal 종료 뒤 논리적인 다음 target으로 keyboard focus를 보내는 규칙입니다.", ["list identity를 사용합니다.", "body fallback을 피합니다."])],
  }),
  appliedTopic({
    id: "crud-fault-tests-offline-operations", title: "model/component/HTTP fault tests와 offline·rollback 운영을 완성합니다",
    lead: "작은 reducer unit test에서 멈추지 않고 실제 browser storage, HTTP precondition, response order, authorization과 production recovery를 단계별로 검증합니다.",
    mechanism: "pure model은 operation/merge invariants, store test는 subscription/persistence, component test는 form/focus, disposable server는 HTTP/status/version/idempotency, browser E2E는 navigation/storage/offline을 증명합니다.",
    workflow: "seeded CRUD sequences와 fault matrix를 만들고 duplicate/slow/out-of-order/offline/conflict/denial을 주입해 expected final server/cache/UI/operation states와 cleanup을 assert합니다.",
    invariants: "test는 arbitrary sleep에 의존하지 않고 actual credential/PII를 사용하지 않으며 실패 후 requests/listeners/timers/storage가 baseline으로 돌아갑니다.",
    edgeCases: "reload with pending ops, storage corruption/quota, service worker replay, multi-tab edit, deploy schema skew, server rollback와 partial outage를 포함합니다.",
    failureModes: "mock success만 검증하면 protocol/schema/auth/race를 놓치고 production에서 cache만 rollback하면 server에 이미 commit된 operation과 divergence가 남습니다.",
    verification: "property/model, store/component, contract/integration, E2E/a11y/security, chaos/canary와 backup/rollback/reconciliation rehearsal를 실행합니다.",
    operations: "CRUD SLI, pending age, conflict/rollback, offline queue, cache/server divergence와 recovery duration을 dashboard·alert·owner·runbook에 연결합니다.",
    concepts: [c("fault matrix", "operation과 network/server/browser failure를 교차해 expected recovery를 적은 test 표입니다.", ["happy path를 넘어섭니다.", "cleanup을 포함합니다."]), c("offline queue", "연결이 없을 때 operation을 identity/version과 함께 보관해 재연결 후 검증·재생하는 queue입니다.", ["무조건 replay하지 않습니다.", "auth/version을 재확인합니다."]), c("data reconciliation runbook", "client/cache/server divergence를 탐지·정지·비교·복구·감사하는 운영 절차입니다.", ["rollback 이후도 포함합니다.", "owner와 evidence를 둡니다."])],
    codeExamples: [node("react27-fault-matrix", "CRUD fault recovery decision table", "React27FaultMatrix.mjs", "status/idempotency/version에 따라 retry·conflict·reauth·fail을 결정합니다.", String.raw`const cases = [
  { status: 0, idempotent: true, decision: "retry-budget" },
  { status: 401, idempotent: true, decision: "reauth-once" },
  { status: 412, idempotent: false, decision: "conflict" },
  { status: 422, idempotent: false, decision: "field-errors" },
  { status: 503, idempotent: false, decision: "manual-reconcile" },
];
for (const c of cases) console.log(c.status + "|" + c.idempotent + "=" + c.decision);`, "0|true=retry-budget\n401|true=reauth-once\n412|false=conflict\n422|false=field-errors\n503|false=manual-reconcile", ["rfc9110", "rfc9457", "owasp-authorization", "wcag-status", "zustand-testing", "local-guest-page"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-todo-store", repository: "D:/dev/my-app02", path: "src/store/useTodoStore.jsx", usedFor: ["persisted local todo CRUD", "timestamp identity", "immutable array updates"], evidence: "2026-07-14 read-only sanitized audit: 34 lines, 1,104 bytes, SHA-256 AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9. storage key/text values는 복사하지 않았습니다." },
  { id: "local-memo-store", repository: "D:/dev/my-app02", path: "src/store/useMemoStroe.jsx", usedFor: ["persisted memo create/update/delete", "timestamp/date provenance"], evidence: "2026-07-14 read-only sanitized audit: 36 lines, 1,363 bytes, SHA-256 3CE0CDFAEEC21A71EB551FFC14D0206BB1BEE9941FA09FC45F085EF815462078. original filename spelling을 provenance로 유지하고 storage/content values는 복사하지 않았습니다." },
  { id: "local-todo-page", repository: "D:/dev/my-app02", path: "src/pages/TodoPage.jsx", usedFor: ["auth-gated local CRUD UI", "derived remaining count", "controlled input"], evidence: "2026-07-14 read-only sanitized audit: 75 lines, 3,254 bytes, SHA-256 E505E755118DC9CFDC7929C063C9F0F9441725D5598DE0B6861A3BED5C7F16C0. actual UI strings/routes는 복사하지 않았습니다." },
  { id: "local-memo-page", repository: "D:/dev/my-app02", path: "src/pages/MemoPage.jsx", usedFor: ["local edit draft", "add/update/delete UI"], evidence: "2026-07-14 read-only sanitized audit: 93 lines, 4,354 bytes, SHA-256 F346E532F8546F54BAFB558414CF6A39872EA493807AFF1CAAB54B93227D32D5. memo/UI strings는 복사하지 않았습니다." },
  { id: "local-guest-store", repository: "D:/dev/my-app03", path: "src/store/useGuestbookStore.jsx", usedFor: ["server list cache", "local entity patch/delete"], evidence: "2026-07-14 read-only sanitized audit: 21 lines, 562 bytes, SHA-256 DA1A28E1BD3D8A7632530089011576C1FC7F4BE6A75D9001BFCD04323BABF209. domain field values는 복사하지 않았습니다." },
  { id: "local-guest-page", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["fetch/mutation/refetch flow", "edit/delete drafts", "client visibility/auth assumptions"], evidence: "2026-07-14 read-only sanitized audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. user/guestbook/password/message/route values는 복사하지 않았습니다." },
  { id: "zustand-updating", repository: "Zustand official documentation", path: "learn/guides/updating-state", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/updating-state", usedFor: ["set updates", "immutable nested updates"], evidence: "Zustand 공식 state update guidance의 현행 learn 경로입니다." },
  { id: "zustand-testing", repository: "Zustand official documentation", path: "learn/guides/testing", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/testing", usedFor: ["store/component test boundaries", "reset patterns"], evidence: "Zustand 공식 testing guidance의 현행 learn 경로입니다." },
  { id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["state ownership", "avoid duplication", "normalization"], evidence: "React 공식 state structure guidance입니다." },
  { id: "react-render-lists", repository: "React official documentation", path: "learn/rendering-lists", publicUrl: "https://react.dev/learn/rendering-lists", usedFor: ["stable entity keys"], evidence: "React 공식 list/key guidance입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP method/status/idempotency/preconditions", "ETag semantics context"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9111", repository: "IETF RFC 9111", path: "rfc9111.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["cache freshness/revalidation"], evidence: "HTTP Caching 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["typed HTTP problem responses"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["deny by default", "object/field authorization"], evidence: "OWASP 공식 authorization guidance입니다." },
  { id: "wcag-status", repository: "W3C WAI WCAG", path: "Understanding/status-messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["accessible CRUD status messages"], evidence: "W3C WAI 공식 status message guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-27-crud-state-server-sync", slug: "react-27-crud-state-server-sync", courseId: "react", moduleId: "react-state-management", order: 7,
  title: "CRUD state와 server 동기화", subtitle: "local draft, normalized entity, operation state machine, optimistic transaction과 HTTP version conflict를 하나의 복구 가능한 흐름으로 연결합니다.",
  level: "고급", estimatedMinutes: 135,
  coreQuestion: "local/persisted/server CRUD가 동시에 존재할 때 빠른 UI를 유지하면서 stale overwrite, lost update, 권한 오류와 실패 후 divergence를 어떻게 막을까요?",
  summary: "my-app02 Todo/Memo stores/pages와 my-app03 Guestbook store/page를 read-only·sanitized 감사해 local persisted array CRUD와 server list cache·fetch/mutation/refetch/local patch의 차이를 보존합니다. 실제 사용자·내용·password·route 값은 복사하지 않습니다. state taxonomy, normalized/temp identity, command/result machine, reversible optimistic transaction, ETag/version conflict, query reconciliation, server authorization, accessible error UX와 fault/offline operations를 official React/Zustand, IETF, OWASP, W3C 근거와 일곱 deterministic Node models로 확장합니다.",
  objectives: ["원본 CRUD sources의 owner/persistence/sync를 감사한다.", "local draft·entity cache·server state를 분리한다.", "stable/temp/server identity와 normalization을 설계한다.", "CRUD를 operation state machine과 typed problem으로 구현한다.", "optimistic patch를 정확히 rollback/rebase한다.", "version precondition과 three-way conflict를 처리한다.", "mutation/refetch/push를 versioned cache reconciliation으로 연결한다.", "client affordance와 server authorization을 분리한다.", "accessible form/error/focus와 fault/offline 운영을 검증한다."],
  prerequisites: [{ title: "Zustand persist·인증 상태 생명주기", reason: "store action, selector, persist hydration과 auth-scoped state lifecycle을 알아야 local/server CRUD cache와 sensitive pending operation을 안전하게 설계할 수 있습니다.", sessionSlug: "react-26-zustand-persist-auth" }],
  keywords: ["CRUD", "server state", "normalization", "optimistic update", "rollback", "ETag", "If-Match", "lost update", "query invalidation", "authorization", "offline", "reconciliation"],
  topics,
  lab: { title: "Todo·Memo·Guestbook을 versioned optimistic CRUD runtime으로 qualification하기", scenario: "원본 files는 변경하지 않고 synthetic non-sensitive data와 disposable versioned HTTP server에서 local-only, persisted와 server-authoritative CRUD를 같은 contract suite로 비교합니다.", setup: ["Node 20 이상", "React/Zustand browser fixture", "disposable HTTP server with ETag/problem responses", "deferred requests and fake offline", "keyboard/accessibility tools", "원본 6 files read-only", "synthetic non-PII records"], steps: ["원본 source hashes와 state/persistence/async/authority graph를 기록합니다.", "draft/entity/query/pending/error/auth state를 owner와 lifetime으로 분류합니다.", "normalized IDs와 temp-to-server atomic mapping/duplicate guards를 구현합니다.", "operation state machine과 safe problem mapping/idempotency를 적용합니다.", "create/update/delete optimistic patches와 field-scoped rollback/rebase를 시험합니다.", "두 client의 ETag/version conflict와 three-way resolution을 구현합니다.", "mutation/refetch/push response order와 auth-scoped query keys를 fault-test합니다.", "tampered resource/owner/field, logout와 secret sink negative tests를 실행합니다.", "keyboard/error/status/focus UX와 offline/reload/multi-tab을 검증합니다.", "production-like SLI, canary, rollback과 cache/server reconciliation runbook을 rehearsal합니다."], expectedResult: ["local draft, confirmed server base와 pending overlay가 섞이지 않습니다.", "duplicate/late/retried operations가 entity를 두 번 만들거나 newer state를 덮지 않습니다.", "optimistic failure와 version conflict가 unrelated success를 잃지 않고 복구됩니다.", "다른 principal/resource/forbidden field 변경이 server에서 거부되고 sensitive input이 저장·로그되지 않습니다.", "CRUD 결과·오류·pending과 focus가 접근 가능하며 rollback/reconciliation evidence가 남습니다."], cleanup: ["temporary server, requests, listeners, timers, stores와 browser storage를 제거합니다.", "synthetic entities, operation/idempotency keys, conflict snapshots와 logs를 폐기합니다.", "network faults, offline/service-worker modes, flags와 verbose tracing을 원복합니다.", "원본 6 files hash/status unchanged를 확인합니다."], extensions: ["TanStack Query mutation adapter를 같은 operation model로 qualification합니다.", "CRDT/event-sourced collaboration과 versioned CRUD를 비교합니다.", "encrypted offline queue와 device revocation을 설계합니다.", "production reconciliation dashboard와 repair command dry-run을 구현합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 실제 store/component/HTTP 결과와 대응시키세요.", requirements: ["stdout 완전 일치", "redacted source inventory", "state classification", "temp mapping", "operation machine", "rollback", "three-way conflict", "fault decisions", "model 범위"], hints: ["Node 배열 model을 실제 network/cache/React concurrency 증명이라고 표현하지 마세요."], expectedOutcome: "CRUD input에서 confirmed/reconciled UI까지 state와 failure 경로를 설명합니다.", solutionOutline: ["audit→classify/identify→command→optimistic/version→reconcile/authorize→operate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Guestbook 흐름을 concurrent-safe optimistic CRUD로 재설계하세요.", requirements: ["auth/query keys", "operation IDs", "normalized entities", "awaited reconciliation", "ETag conflict", "rollback/rebase", "server authorization", "a11y/error", "fault tests"], hints: ["mutation 성공과 최신 목록 확인을 하나의 boolean loading으로 합치지 마세요."], expectedOutcome: "빠른 연속 편집·삭제·refetch와 실패에도 server/cache/UI가 합의됩니다.", solutionOutline: ["contract→state machine→optimistic overlay→precondition→reconcile→qualification 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 frontend CRUD consistency 표준을 작성하세요.", requirements: ["authority/persistence", "identity/schema", "command/result", "optimistic/version", "cache/invalidation", "auth/privacy", "a11y", "offline/testing/operations"], hints: ["library API 목록이 아니라 실패 후 data reconciliation까지 정의하세요."], expectedOutcome: "모든 CRUD feature가 correctness·security·accessibility·recovery evidence로 review됩니다.", solutionOutline: ["inventory→model→guard→sync→recover→observe 순서입니다."] },
  ],
  nextSessions: ["react-28-store-contract-testing"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["원본 UI의 실제 todo/memo/guestbook/user/password/message/route values는 공개 content에 복사하지 않았습니다.", "my-app02는 browser-local persisted CRUD이고 my-app03 Guestbook은 server-authoritative 흐름이므로 동일 durability/consistency를 가진다고 과장하지 않습니다.", "원본 Guestbook의 async refetch와 client name visibility를 관찰했지만 server authorization/ETag/idempotency가 구현됐다고 주장하지 않습니다.", "Node models는 actual Zustand subscription/persist, React rendering, browser storage, HTTP cache/preconditions와 server transaction을 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
