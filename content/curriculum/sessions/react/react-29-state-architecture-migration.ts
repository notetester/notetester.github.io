import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const auditRefs = [
  "local-state-doc", "local-context-doc", "local-reducer-doc", "local-zustand-doc", "local-zustand-crud",
  "local-number-count", "local-counter-functional", "local-lifted-state", "local-context-test",
  "local-theme-context", "local-reducer-flow", "local-app2-auth", "local-app2-todo", "local-app3-auth", "local-app3-guest",
];

const topics = [
  appliedTopic({
    id: "state-owner-source-audit", title: "원본의 state owner를 값이 아니라 수명·권한·동기화 경계로 감사합니다",
    lead: "useState 개수나 store 파일 존재 여부만 세지 않고 누가 쓰고 읽는지, 언제 초기화·폐기되는지, 원격 authoritative copy가 있는지와 복구 책임을 각 state field에 기록합니다.",
    mechanism: "my-app01은 local event/form, lifted props, Context와 reducer의 학습 progression을 보여 주고 my-app02/03은 Zustand persist와 CRUD/server flow를 더합니다. 이는 하나의 도구로 통일해야 한다는 결론이 아니라 서로 다른 owner 후보가 실제로 공존한다는 provenance입니다.",
    workflow: "원본을 read-only로 hash하고 field→writer→readers→lifetime→persistence→remote authority→failure/recovery 표를 만든 뒤 duplicated, derived, sensitive와 ambiguous state를 표시합니다.",
    invariants: "한 사실에는 canonical owner가 하나이고 derived value는 저장하지 않으며 credential·개인정보·원본 route/domain literal을 공개 inventory나 fixture에 복사하지 않습니다.",
    edgeCases: "conditional mount, keyed reset, two tabs, logout, refresh, offline, stale response, optimistic mutation, downgrade와 corrupt persistence를 포함합니다.",
    failureModes: "컴포넌트 이름과 Hook 이름만 세면 실제 writer, server authority와 retention이 보이지 않아 migration 뒤 duplicated truth와 데이터 손실을 만듭니다.",
    verification: "source hash, import/call graph, runtime state snapshots, writer instrumentation, refresh/logout/offline matrix와 원본 git status를 대조합니다.",
    operations: "unknown owner, duplicate writers, sensitive persistence, reconciliation mismatch와 recovery time을 backlog·dashboard의 owner에 연결합니다.",
    concepts: [c("authoritative owner", "특정 사실의 현재 값을 최종 결정하는 단 하나의 경계입니다.", ["writer와 validation을 소유합니다.", "cache나 mirror와 구분합니다."]), c("state lifetime", "값이 생성되어 유효하고 reset·폐기되는 시간과 tree 범위입니다.", ["component, route, session, server 범위를 구분합니다.", "보존은 요구사항입니다."]), c("state provenance", "현재 값이 어느 source·action·version에서 왔는지 설명하는 추적 정보입니다.", ["migration 대조에 필요합니다.", "민감 payload는 남기지 않습니다."])],
    codeExamples: [node("react29-owner-inventory", "state owner decision inventory", "React29OwnerInventory.mjs", "수명·독자·원격 권위·transition 복잡도로 owner 후보를 결정합니다.", String.raw`const fields = [
  { name: "draft", readers: 1, remote: false, crossRoute: false, transitions: 2 },
  { name: "panel", readers: 2, remote: false, crossRoute: false, transitions: 2 },
  { name: "workflow", readers: 3, remote: false, crossRoute: false, transitions: 7 },
  { name: "preference", readers: 4, remote: false, crossRoute: true, transitions: 2 },
  { name: "records", readers: 5, remote: true, crossRoute: true, transitions: 4 },
];
function owner(x) {
  if (x.remote) return "server-cache";
  if (x.crossRoute) return "external-store";
  if (x.transitions >= 5) return "reducer-context";
  if (x.readers > 1) return "lifted";
  return "local";
}
for (const field of fields) console.log(field.name + "=" + owner(field));`, "draft=local\npanel=lifted\nworkflow=reducer-context\npreference=external-store\nrecords=server-cache", auditRefs.concat(["react-state-structure", "react-sharing", "tanstack-client-state"]))],
  }),
  appliedTopic({
    id: "state-taxonomy-lifetime-authority", title: "UI·workflow·client preference·server state를 같은 global bucket에서 분리합니다",
    lead: "modal open, form draft, reducer workflow, persisted preference, authenticated session hint와 remote records는 변경 주기·권위·freshness·보안이 달라 같은 저장소에 넣는 편의가 올바른 architecture를 뜻하지 않습니다.",
    mechanism: "UI state는 tree와 함께 사라질 수 있고 workflow state는 허용 transition이 중요하며 client preference는 explicit retention이 필요합니다. server state는 remote authority, freshness, dedupe, invalidation, retry와 conflict를 별도 lifecycle로 가집니다.",
    workflow: "각 field를 essential/derived, local/shared, client/server, ephemeral/persisted와 sensitive/non-sensitive 축으로 분류하고 가장 좁은 owner부터 승격 이유를 입증합니다.",
    invariants: "remote entity의 client copy는 cache 또는 optimistic projection이지 두 번째 authority가 아니고 server payload와 UI flags를 같은 record에 무분별하게 영속화하지 않습니다.",
    edgeCases: "server deletion, permission change, cache stale, reconnect, background refetch, local draft conflict와 account switch를 포함합니다.",
    failureModes: "API 결과를 Zustand에 영구 복제하고 loading/error를 여러 컴포넌트가 따로 관리하면 invalidation·race·logout purge와 source of truth가 갈라집니다.",
    verification: "state-classification review, freshness clock, invalidation map, account-switch purge, offline/reconnect와 server conflict integration을 실행합니다.",
    operations: "cache age, invalidation lag, duplicate fetch, stale render, persisted byte budget와 purge success를 관찰합니다.",
    concepts: [c("UI state", "현재 화면 상호작용만 설명하고 보통 해당 UI tree 수명을 따르는 상태입니다.", ["가장 가까운 component에 둡니다.", "URL state와 구분합니다."]), c("server state", "서버가 권위를 갖고 client가 비동기로 cache·동기화하는 데이터입니다.", ["freshness와 invalidation이 필요합니다.", "client store와 역할이 다릅니다."]), c("essential state", "다른 입력에서 계산할 수 없어 실제로 보존해야 하는 최소 사실입니다.", ["derived duplication을 제거합니다.", "reset 조건을 정합니다."])],
  }),
  appliedTopic({
    id: "local-lifted-context-decision", title: "local에서 lifted·Context로 필요한 거리만 이동합니다",
    lead: "state가 둘 이상의 sibling에게 필요할 때 가장 가까운 공통 parent로 올리고, props 전달이 넓은 안정된 ambient dependency가 될 때 Context를 검토하되 Context 자체를 state manager로 오해하지 않습니다.",
    mechanism: "lifting은 owner를 공통 ancestor로 바꾸고 controlled props로 data flow를 드러냅니다. Context는 tree 아래로 value를 운반하며 provider value identity와 consumer breadth가 update fan-out을 결정합니다.",
    workflow: "local default→common ancestor→composition/children→split read/dispatch Context→external store 순으로 비용을 측정하며 각 승격에 consumer count, reuse와 lifetime 근거를 남깁니다.",
    invariants: "setter를 어디서나 호출하게 풀지 않고 domain action을 노출하며 provider 밖 사용을 guard하고 unrelated high-frequency state를 한 Context value에 묶지 않습니다.",
    edgeCases: "nested providers, provider missing, default value masking, reusable subtree, portal, route remount, inline object identity와 conditional provider를 포함합니다.",
    failureModes: "prop drilling이라는 말만으로 모든 state를 Context로 옮기면 dependency가 숨고 provider가 거대해지며 update마다 넓은 subtree가 다시 구독합니다.",
    verification: "owner diagram, controlled/uncontrolled contract, provider boundary tests, consumer render reason, missing provider와 keyed reset을 확인합니다.",
    operations: "provider consumer 수, update frequency, rerender fan-out, ownership churn과 context split 효과를 기록합니다.",
    concepts: [c("lifting state up", "공유해야 할 state를 가장 가까운 공통 조상으로 옮겨 한 owner가 제어하게 하는 방식입니다.", ["controlled props로 내려보냅니다.", "무조건 root로 올리지 않습니다."]), c("Context transport", "provider value를 descendant가 직접 읽게 하는 전달 통로입니다.", ["state lifecycle은 provider가 결정합니다.", "전역 singleton과 다릅니다."]), c("provider boundary", "Context value의 생성·수명·접근 가능한 subtree를 정하는 경계입니다.", ["reset과 test isolation에 중요합니다.", "너무 넓히지 않습니다."])],
  }),
  appliedTopic({
    id: "reducer-context-state-machine", title: "transition이 복잡해지면 reducer와 Context를 command contract로 결합합니다",
    lead: "여러 boolean setter와 순서 의존 update를 named event, finite status와 pure reducer로 바꾸고 Context는 state와 dispatch를 필요한 subtree에 공급합니다.",
    mechanism: "reducer는 previous state와 action에서 next state를 계산하고 impossible state를 type/schema와 default rejection으로 차단합니다. side effect는 reducer 밖 command handler가 operation ID와 함께 수행합니다.",
    workflow: "상태·event·guard·effect·rollback 표를 먼저 작성하고 reducer transition tests, provider integration, async adapter와 replay log를 단계적으로 연결합니다.",
    invariants: "reducer는 pure하고 unknown action을 조용히 성공시키지 않으며 pending/success/error가 상호 모순되지 않고 stale operation completion을 거부합니다.",
    edgeCases: "duplicate submit, cancel after resolve, retry, undo, nested dispatch, initialization from persisted version와 concurrent server conflict를 포함합니다.",
    failureModes: "reducer 안에서 fetch/storage를 실행하거나 action payload에 callback/runtime object를 넣으면 replay·test·serialization과 rollback이 깨집니다.",
    verification: "transition table exhaustiveness, forbidden transitions, action schema, replay parity, race permutations와 provider unmount cleanup을 시험합니다.",
    operations: "event/rejection reason, transition latency, stuck state, retry/rollback rate를 payload 없이 low-cardinality로 관찰합니다.",
    concepts: [c("transition table", "현재 state와 event가 허용할 next state·effect를 정의한 표입니다.", ["impossible state를 찾습니다.", "test oracle이 됩니다."]), c("domain action", "UI event가 아니라 업무 의도와 검증 가능한 payload를 담은 reducer event입니다.", ["stable name을 씁니다.", "side effect를 직접 담지 않습니다."]), c("command handler", "effectful 작업을 수행한 뒤 reducer에 결과 event를 전달하는 경계입니다.", ["operation ID를 사용합니다.", "재시도 정책을 소유합니다."])],
    codeExamples: [node("react29-reducer-machine", "finite reducer transition model", "React29ReducerMachine.mjs", "허용 event만 적용하고 stale completion과 impossible transition을 거부합니다.", String.raw`function reduce(state, event) {
  if (event.type === "submit" && state.status === "editing") return { status: "saving", op: event.op };
  if (event.type === "saved" && state.status === "saving" && state.op === event.op) return { status: "saved", op: null };
  if (event.type === "reset" && state.status === "saved") return { status: "editing", op: null };
  return state;
}
let state = { status: "editing", op: null };
for (const event of [{ type: "submit", op: 2 }, { type: "saved", op: 1 }, { type: "saved", op: 2 }, { type: "reset" }]) {
  const before = state.status; state = reduce(state, event);
  console.log(event.type + "=" + before + "->" + state.status);
}`, "submit=editing->saving\nsaved=saving->saving\nsaved=saving->saved\nreset=saved->editing", ["local-reducer-flow", "local-reducer-doc", "react-reducer", "react-reducer-context"])],
  }),
  appliedTopic({
    id: "external-store-zustand-boundary", title: "Zustand는 cross-tree client state의 좁은 external-store boundary로 둡니다",
    lead: "route를 넘는 client-only preference, session projection이나 여러 독립 subtree의 협업처럼 component owner가 부자연스러운 경우에만 store를 사용하고 actions/selectors/persist schema를 public contract로 정의합니다.",
    mechanism: "Zustand create는 external store와 React-bound Hook을 만들며 selector가 consumer slice를 고릅니다. persist는 저장 정책이지 자동 보안·migration·multi-tab consistency가 아닙니다.",
    workflow: "state creator factory, public actions, narrow selectors, slices, versioned allowlist persistence와 reset을 정의하고 component가 raw setState나 whole store를 읽지 않게 migration seam을 둡니다.",
    invariants: "store에 DOM node, Promise, callback, password/token 원문과 server cache 전체를 넣지 않고 account logout과 version downgrade에서 safe reset이 가능합니다.",
    edgeCases: "SSR/hydration, multiple stores, selector identity, replace semantics, corrupt storage, two tabs, package v5 behavior와 hot reload를 포함합니다.",
    failureModes: "편의를 위해 모든 local form과 API data를 singleton store에 넣으면 test isolation, SSR request isolation, persistence scope와 invalidation이 엉킵니다.",
    verification: "fresh-store contracts, selector notification matrix, hydration corpus, account switch, SSR snapshot parity와 component render budget을 실행합니다.",
    operations: "store size, subscriber fan-out, hydration/migration/purge, reset failures와 sensitive-key canary scan을 운영합니다.",
    concepts: [c("external store", "React tree 밖에서 snapshot·subscription을 제공하는 state container입니다.", ["cross-tree sharing에 적합합니다.", "React integration 계약이 필요합니다."]), c("selector seam", "consumer가 store 전체가 아니라 필요한 slice contract만 읽는 경계입니다.", ["migration adapter가 됩니다.", "render 범위를 줄입니다."]), c("persistence allowlist", "명시적으로 저장을 허용한 non-sensitive fields와 version만 직렬화하는 정책입니다.", ["deny by default입니다.", "logout purge를 포함합니다."])],
  }),
  appliedTopic({
    id: "server-cache-client-store-separation", title: "원격 records는 server cache에 두고 client store는 UI 의도만 보존합니다",
    lead: "server에서 읽고 여러 곳이 재사용하는 data는 query key, freshness, dedupe, cancellation, invalidation과 mutation lifecycle을 가진 server-state cache가 책임지고 Zustand에는 filter·selection 같은 client 의도만 남깁니다.",
    mechanism: "query cache는 key로 remote resource를 식별하고 observer, stale/fresh, refetch와 garbage collection을 관리합니다. client store가 같은 entity array를 다시 복사하면 cache invalidation 뒤 mirror가 stale해집니다.",
    workflow: "API call sites와 copies를 inventory하고 query key factory, schema validation, staleTime, invalidation/mutation rollback을 만든 뒤 derived selectors가 cache와 client filter를 결합하게 합니다.",
    invariants: "query key는 resource와 모든 varying input을 포함하고 unauthorized scope를 공유하지 않으며 mutation success가 임의 local mirror만 고치고 server/cache reconciliation을 생략하지 않습니다.",
    edgeCases: "background refetch, offline mutation, pagination, account switch, deleted record, optimistic conflict, stale-while-revalidate와 cache persistence를 포함합니다.",
    failureModes: "effect마다 fetch하고 결과를 global store에 덮어쓰면 dedupe·abort·freshness가 없고 늦은 응답이 최신 filter의 결과를 덮습니다.",
    verification: "key isolation, request dedupe, stale/refetch, cancel/race, optimistic rollback, invalidation and server readback을 actual library integration에서 시험합니다.",
    operations: "query age, refetch/duplicate/error, cache bytes, invalidation lag, optimistic rollback와 stale display 시간을 관찰합니다.",
    concepts: [c("query key", "remote resource와 parameters·scope를 결정적으로 식별하는 serializable cache key입니다.", ["varying input을 모두 포함합니다.", "권한 경계를 섞지 않습니다."]), c("freshness policy", "cached data를 언제 신뢰하고 언제 background/foreground refetch할지 정한 규칙입니다.", ["업무별로 다릅니다.", "기본값을 명시합니다."]), c("cache invalidation", "mutation이나 외부 사건 뒤 관련 remote cache를 stale로 표시하거나 다시 읽게 하는 절차입니다.", ["정확한 key 범위를 씁니다.", "server authority를 복원합니다."])],
    codeExamples: [node("react29-cache-separation", "client/server state split model", "React29CacheSeparation.mjs", "remote records와 client-only filter를 분리해 derived view만 계산합니다.", String.raw`const serverCache = { version: 4, records: [{ id: "r1", active: true }, { id: "r2", active: false }] };
const clientState = { filter: "active", selectedId: "r1" };
const visible = serverCache.records.filter((x) => clientState.filter === "all" || x.active);
console.log("server-version=" + serverCache.version);
console.log("client-fields=" + Object.keys(clientState).sort().join(","));
console.log("visible=" + visible.map((x) => x.id).join(","));
console.log("duplicated-records=false");`, "server-version=4\nclient-fields=filter,selectedId\nvisible=r1\nduplicated-records=false", ["local-app2-todo", "local-app3-guest", "tanstack-overview", "tanstack-client-state", "tanstack-query-keys"])],
  }),
  appliedTopic({
    id: "architecture-decision-scorecard", title: "도구 취향 대신 owner scorecard와 architecture decision record로 선택합니다",
    lead: "consumer distance, write complexity, lifetime, persistence, remote authority, concurrency, SSR와 security를 점수화하되 숫자를 자동 정답으로 쓰지 않고 trade-off discussion과 재검토 trigger로 사용합니다.",
    mechanism: "scorecard는 local/lifted/reducer-context/external store/server cache 후보의 적합성과 비용을 같은 질문으로 비교하고 ADR은 chosen option, rejected alternatives, assumptions와 rollback seam을 기록합니다.",
    workflow: "field group별 facts를 수집하고 가장 단순한 후보를 baseline으로 둔 뒤 각 승격의 measurable pain과 risk 감소를 검증해 decision owner와 review date를 정합니다.",
    invariants: "library popularity나 파일 수가 선택 근거가 아니며 security/authority hard constraint를 편의 점수로 상쇄하지 않고 source version과 assumptions를 함께 기록합니다.",
    edgeCases: "future reuse speculative design, team skill, bundle budget, SSR adoption, offline mode, regulatory retention와 library end-of-life를 포함합니다.",
    failureModes: "전역 store가 확장에 유연하다는 막연한 이유로 조기 도입하거나 score 합계 하나로 server authority와 secret retention 문제를 덮습니다.",
    verification: "representative feature spike, render/bundle/test/migration measurement, failure drill, ADR peer review와 expiry trigger를 확인합니다.",
    operations: "exception count, architecture drift, store growth, decision age와 trigger breach를 governance backlog에 연결합니다.",
    concepts: [c("decision scorecard", "같은 state facts로 후보들의 적합성과 비용을 비교하는 질문표입니다.", ["토론을 구조화합니다.", "자동 결정기는 아닙니다."]), c("ADR", "맥락·결정·대안·결과·재검토 조건을 남기는 architecture decision record입니다.", ["source snapshot을 기록합니다.", "migration seam을 포함합니다."]), c("hard constraint", "점수나 편의로 상쇄할 수 없는 보안·권위·규제·runtime 조건입니다.", ["먼저 필터링합니다.", "검증 증거가 필요합니다."])],
  }),
  appliedTopic({
    id: "migration-contract-adapters", title: "canonical schema와 adapters로 old/new representation을 동시에 이해합니다",
    lead: "store 교체를 component 전면 rewrite로 시작하지 않고 domain-facing read model과 commands를 고정한 뒤 legacy/new adapters가 같은 contract를 구현하게 합니다.",
    mechanism: "anti-corruption adapter는 old shape를 canonical schema로 normalize하고 command를 old/new write 형태로 변환합니다. version, provenance, validation failure와 lossy field를 명시해야 rollback도 old path를 다시 읽을 수 있습니다.",
    workflow: "golden corpus→canonical schema→legacy read adapter→new write model→round-trip/differential tests→consumer seam 순으로 만들고 unsupported values를 silent default하지 않습니다.",
    invariants: "adapter output은 schema-valid하고 같은 input에 deterministic하며 migration 실패가 partial state를 commit하지 않고 lossy conversion을 evidence 없이 허용하지 않습니다.",
    edgeCases: "missing/null/wrong type, duplicate IDs, renamed enum, future version, old app downgrade, Unicode, large payload와 corrupt storage를 포함합니다.",
    failureModes: "component마다 임시 변환을 넣으면 rules가 갈리고 제거 시점을 알 수 없으며 rollback 때 new-only data를 old reader가 해석하지 못합니다.",
    verification: "golden old/current/future corpus, round-trip, differential selector results, mutation/negative tests와 downgrade rehearsal을 실행합니다.",
    operations: "adapter version distribution, validation/lossy/fallback reason, latency와 oldest active client를 관찰합니다.",
    concepts: [c("canonical schema", "migration 기간 모든 consumer가 이해하는 최소·versioned domain representation입니다.", ["owner가 명확합니다.", "runtime validation합니다."]), c("anti-corruption adapter", "legacy와 target representation 사이 번역을 한 경계에 격리하는 adapter입니다.", ["consumer를 보호합니다.", "제거 조건을 둡니다."]), c("golden corpus", "과거·현재·손상·미래 versions의 기대 변환 결과를 고정한 fixtures입니다.", ["민감값을 합성합니다.", "downgrade도 포함합니다."])],
    codeExamples: [node("react29-schema-adapter", "legacy-to-canonical adapter", "React29SchemaAdapter.mjs", "legacy shape를 검증된 version 2 canonical state로 변환합니다.", String.raw`function adapt(raw) {
  if (!raw || raw.version !== 1 || !Array.isArray(raw.items)) return { ok: false, reason: "unsupported" };
  const ids = raw.items.map((x) => String(x.key));
  if (new Set(ids).size !== ids.length) return { ok: false, reason: "duplicate" };
  return { ok: true, value: { version: 2, entities: Object.fromEntries(ids.map((id) => [id, { id }])), order: ids } };
}
for (const input of [{ version: 1, items: [{ key: "a" }, { key: "b" }] }, { version: 1, items: [{ key: "a" }, { key: "a" }] }, { version: 3 }]) {
  const result = adapt(input);
  console.log(result.ok ? "ok:v" + result.value.version + ":" + result.value.order.join(",") : "error:" + result.reason);
}`, "ok:v2:a,b\nerror:duplicate\nerror:unsupported", ["local-zustand-doc", "local-zustand-crud", "zustand-persist", "zustand-v5-migration", "react-state-structure"])],
  }),
  appliedTopic({
    id: "dual-read-write-reconciliation", title: "dual-read·dual-write를 mismatch가 보이는 임시 migration phase로 운영합니다",
    lead: "old/new을 무조건 두 번 쓰는 것으로 끝내지 않고 primary/secondary, operation ID, ordering, canonical comparison, mismatch classification, repair ownership과 기간 제한을 설계합니다.",
    mechanism: "shadow read는 사용자 결과를 primary에서 내고 secondary를 canonicalize해 비교합니다. dual write는 idempotency key와 ordered journal을 사용하며 한쪽 실패 시 partial success를 명시하고 reconciliation queue가 convergence를 회복합니다.",
    workflow: "read shadow→sampled compare→new write shadow→dual write→new primary read→old fallback 제거 순으로 risk를 늘리고 각 단계에 entry/exit/rollback criteria를 둡니다.",
    invariants: "사용자 응답 authority가 단계별로 하나이며 mismatch를 평균으로 합치지 않고 write acknowledgement와 durable journal 없이 성공을 반환하지 않습니다.",
    edgeCases: "out-of-order completion, retry, duplicate event, one-side outage, schema drift, clock skew, delete tombstone와 reconciliation poison record를 포함합니다.",
    failureModes: "두 저장소를 fire-and-forget으로 갱신하면 partial failure를 잃고 서로 다른 sort/default를 raw JSON 비교해 false mismatch 폭풍을 만듭니다.",
    verification: "fault injection, operation replay, canonical compare, tombstone/delete, queue retry/dead-letter, read-after-write와 restore drill을 실행합니다.",
    operations: "compare sample, exact/semantic/missing/version mismatch, partial write, reconciliation lag/depth/age와 repair success를 관찰합니다.",
    concepts: [c("shadow read", "secondary result를 사용자 응답에 쓰지 않고 primary와 비교하는 migration read입니다.", ["안전한 evidence를 만듭니다.", "비용과 개인정보를 통제합니다."]), c("dual write", "한 logical command를 old/new targets에 추적 가능하게 적용하는 임시 전략입니다.", ["atomicity gap을 처리합니다.", "idempotency가 필요합니다."]), c("reconciliation", "두 representations의 차이를 분류하고 authority 규칙에 따라 수렴시키는 절차입니다.", ["자동 repair 범위를 제한합니다.", "감사 journal을 남깁니다."])],
    codeExamples: [node("react29-reconciliation", "shadow comparison and reconciliation queue", "React29Reconciliation.mjs", "old/new reads를 canonicalize해 mismatch를 분류하고 repair 대상을 만듭니다.", String.raw`const pairs = [
  { id: "a", old: { enabled: 1 }, next: { enabled: true } },
  { id: "b", old: { enabled: 0 }, next: { enabled: true } },
  { id: "c", old: null, next: { enabled: false } },
];
const canonical = (x) => x == null ? null : { enabled: Boolean(x.enabled) };
const repairs = [];
for (const pair of pairs) {
  const left = canonical(pair.old); const right = canonical(pair.next);
  const reason = left === null ? "missing-old" : JSON.stringify(left) === JSON.stringify(right) ? "equal" : "value-mismatch";
  if (reason !== "equal") repairs.push(pair.id + ":" + reason);
  console.log(pair.id + "=" + reason);
}
console.log("repairs=" + repairs.join(","));`, "a=equal\nb=value-mismatch\nc=missing-old\nrepairs=b:value-mismatch,c:missing-old", ["local-app2-auth", "local-app3-auth", "react-sync-store", "zustand-create-store"])],
  }),
  appliedTopic({
    id: "cutover-canary-observability", title: "cohort canary와 evidence gate로 read authority를 단계적으로 전환합니다",
    lead: "배포와 cutover를 같은 순간으로 묶지 않고 code compatibility를 먼저 배포한 뒤 stable cohort assignment, guardrail, hold period와 human-readable go/no-go evidence로 new authority 비율을 올립니다.",
    mechanism: "feature flag는 actor/tenant 대신 synthetic stable bucket으로 설명하고 실제 운영에서는 privacy-safe key를 server-side hash합니다. 단계마다 mismatch, error, latency, business invariant와 reconciliation backlog가 budget 안인지 확인합니다.",
    workflow: "0% shadow→internal→small canary→progressive cohorts→new default→old read fallback window→cleanup 순으로 진행하고 자동 halt와 수동 rollback 권한을 정합니다.",
    invariants: "같은 actor는 hold period 동안 같은 cohort를 받고 authorization은 flag로 우회하지 않으며 metric absence를 성공으로 해석하지 않습니다.",
    edgeCases: "flag service outage, anonymous→login identity, multi-device, cache stale, rollback during write, low traffic, regional skew와 metric pipeline delay를 포함합니다.",
    failureModes: "랜덤 요청마다 old/new path를 바꾸면 한 사용자의 state가 흔들리고 전체 평균 latency가 소수 cohort의 data loss를 숨깁니다.",
    verification: "deterministic assignment, fail-safe flag default, cohort parity, synthetic probes, telemetry loss alert, hold period와 rollback time objective를 시험합니다.",
    operations: "cohort별 mismatch/error/p95, invariant breach, telemetry completeness, reconciliation age와 cutover decision record를 보존합니다.",
    concepts: [c("cutover", "사용자-visible read/write authority를 old에서 new path로 옮기는 통제된 전환입니다.", ["배포와 구분합니다.", "단계별 rollback이 필요합니다."]), c("stable cohort", "같은 subject가 실험 기간 같은 path를 사용하도록 결정적으로 배정한 집단입니다.", ["privacy-safe assignment를 씁니다.", "authorization이 아닙니다."]), c("guardrail", "넘으면 자동 halt·rollback 또는 수동 승인을 요구하는 품질·안전 한계입니다.", ["분모와 window를 명시합니다.", "metric loss도 다룹니다."])],
    codeExamples: [node("react29-cutover-gate", "progressive cutover gate", "React29CutoverGate.mjs", "cohort evidence와 backlog budget으로 다음 단계 진입을 결정합니다.", String.raw`const stages = [
  { name: "shadow", mismatch: 0.3, errors: 0.1, backlogAge: 2 },
  { name: "canary", mismatch: 0.7, errors: 0.2, backlogAge: 4 },
  { name: "expand", mismatch: 1.4, errors: 0.2, backlogAge: 3 },
];
for (const stage of stages) {
  const pass = stage.mismatch <= 1 && stage.errors <= 0.5 && stage.backlogAge <= 5;
  console.log(stage.name + "=" + (pass ? "advance" : "hold"));
}
console.log("authority=canary");`, "shadow=advance\ncanary=advance\nexpand=hold\nauthority=canary", ["react-managing-state", "zustand-flux", "tanstack-overview"])],
  }),
  appliedTopic({
    id: "rollback-recovery-cleanup", title: "rollback은 binary flag가 아니라 data·code·journal의 forward-compatible 복구입니다",
    lead: "new read를 끄는 것만으로 끝내지 않고 new-only writes가 old representation에서 보이는지, in-flight operations와 reconciliation을 어떻게 멈추고 재개하는지, cleanup을 언제 허용하는지 연습합니다.",
    mechanism: "rollback runbook은 trigger→freeze/route→drain→restore/translate→reconcile→verify→resume 순서를 가집니다. durable command journal과 backward-compatible schema window가 cutover 이후 발생한 사실을 잃지 않게 합니다.",
    workflow: "rollback time/data loss objectives를 정하고 snapshot, append-only journal, old adapter compatibility, point-in-time restore와 forward repair를 disposable environment에서 반복합니다.",
    invariants: "rollback 중 accepted command를 조용히 버리지 않고 duplicate replay가 final state를 바꾸지 않으며 restore 뒤 server/readback과 audit count가 일치합니다.",
    edgeCases: "rollback mid-command, schema downgrade, old code missing enum, poison record, snapshot stale, cross-tab cache와 two consecutive rollback attempts를 포함합니다.",
    failureModes: "DB/store schema를 먼저 파괴적으로 바꾸고 old code를 제거하면 flag를 내려도 읽을 수 없고 backup 존재만 확인하면 실제 restore 시간이 budget을 넘습니다.",
    verification: "cold restore, journal replay/idempotency, old/new readers, count/hash/invariant readback, in-flight drain와 operator handoff를 rehearsal합니다.",
    operations: "RTO/RPO, replay duplicates/rejections, restore age, convergence time와 rollback trigger부터 user recovery까지 timeline을 보존합니다.",
    concepts: [c("compatibility window", "old/new code와 schema가 함께 안전하게 읽고 쓸 수 있게 유지하는 기간입니다.", ["cleanup 전 필수입니다.", "oldest active client를 봅니다."]), c("command journal", "accepted logical writes의 operation ID·version·outcome을 durable하게 남긴 기록입니다.", ["replay와 reconciliation에 씁니다.", "민감 payload를 최소화합니다."]), c("forward repair", "old snapshot으로 완전 후퇴하지 않고 new evidence를 현재 schema에 재적용해 수렴시키는 복구입니다.", ["data loss를 줄입니다.", "검증된 adapter가 필요합니다."])],
    codeExamples: [node("react29-rollback-journal", "idempotent rollback journal replay", "React29RollbackJournal.mjs", "snapshot 뒤 command journal을 중복 없이 replay해 복구 상태를 계산합니다.", String.raw`const snapshot = { count: 2, applied: [] };
const journal = [{ op: "o1", delta: 3 }, { op: "o2", delta: -1 }, { op: "o1", delta: 3 }];
const state = structuredClone(snapshot);
for (const event of journal) {
  if (state.applied.includes(event.op)) { console.log(event.op + "=duplicate"); continue; }
  state.count += event.delta; state.applied.push(event.op); console.log(event.op + "=applied");
}
console.log("count=" + state.count);
console.log("applied=" + state.applied.join(","));`, "o1=applied\no2=applied\no1=duplicate\ncount=4\napplied=o1,o2", ["local-app3-guest", "local-app2-todo", "zustand-persist", "react-preserving-state"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-state-doc", repository: "D:/dev/REACT", path: "docs/react/03-state-list-events.md", usedFor: ["state/list/event progression", "local state structure"], evidence: "2026-07-14 read-only sanitized audit: 284 lines, 11,652 bytes, SHA-256 90A2931C736201262E3C1970DE35AA45FC40EBD0406252FF04C33302DF8F2EDF. embedded values는 공개 fixture에 복사하지 않았습니다." },
  { id: "local-context-doc", repository: "D:/dev/REACT", path: "docs/react/06-context.md", usedFor: ["Context/provider progression"], evidence: "2026-07-14 read-only sanitized audit: 80 lines, 3,519 bytes, SHA-256 D26D7FE60D8B94279E3D3E6DEFCE6FEBFCF78591A7E04D638CDB5082AE93DEFB." },
  { id: "local-reducer-doc", repository: "D:/dev/REACT", path: "docs/react/07-usereducer.md", usedFor: ["reducer/action progression"], evidence: "2026-07-14 read-only sanitized audit: 90 lines, 3,570 bytes, SHA-256 6C484A10DDDC517372E00E6D5A29D21147C4AFC1C5822E7E2A3EF074228B90C2." },
  { id: "local-zustand-doc", repository: "D:/dev/REACT", path: "docs/react/10-zustand-basics.md", usedFor: ["Zustand actions/persist progression"], evidence: "2026-07-14 read-only sanitized audit: 134 lines, 6,356 bytes, SHA-256 36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D." },
  { id: "local-zustand-crud", repository: "D:/dev/REACT", path: "docs/react/11-zustand-auth-crud.md", usedFor: ["auth and CRUD store progression"], evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. domain/user values는 복사하지 않았습니다." },
  { id: "local-number-count", repository: "D:/dev/my-app01", path: "src/pages/step03-state/NumberCount.jsx", usedFor: ["plain variable versus render state"], evidence: "2026-07-14 read-only audit: 34 lines, 1,293 bytes, SHA-256 ECDA360EBDBB46FD66A1DF570FF9C8DBBE8CCF7F7A3FF4AD59D5D17C79E1388C." },
  { id: "local-counter-functional", repository: "D:/dev/my-app01", path: "src/pages/step08-event2/CounterEx10.jsx", usedFor: ["local functional state updates"], evidence: "2026-07-14 read-only audit: 31 lines, 903 bytes, SHA-256 B7FB3DF0D0C7825150CF8D1452C8178ACA07AB7A7D07053475A1F1CE2F688E6D." },
  { id: "local-lifted-state", repository: "D:/dev/my-app01", path: "src/pages/step12-context/NoContext.jsx", usedFor: ["lifted state and props"], evidence: "2026-07-14 read-only audit: 11 lines, 267 bytes, SHA-256 B6ABE3211F80A76C2004271677AC1EE6EF896C712D6BF9BABDE449F71729DCBE." },
  { id: "local-context-test", repository: "D:/dev/my-app01", path: "src/pages/step13-context/ContextTest.jsx", usedFor: ["provider values and multiple contexts"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 837 bytes, SHA-256 F5FCB44786273AF509B780B0CB375C0F5C889674CBB5A3B765A6560D9996AE36. actual values는 복사하지 않았습니다." },
  { id: "local-theme-context", repository: "D:/dev/my-app01", path: "src/pages/step13-context/ThemeContext.jsx", usedFor: ["context creation and consumer boundary"], evidence: "2026-07-14 read-only sanitized audit: 9 lines, 605 bytes, SHA-256 12563BF8FC265B6C347E032A78D009B8C51EE2D4469843EBB1DFB4DC85D448EA." },
  { id: "local-reducer-flow", repository: "D:/dev/my-app01", path: "src/pages/step14-Reducer/UseReducerTest01.jsx", usedFor: ["reducer transition progression"], evidence: "2026-07-14 read-only sanitized audit: 73 lines, 2,677 bytes, SHA-256 7D3A38D6A6D7BA3842EF7F5D1B80164E26DB16E3A2899C22AA3CE7F8FE3C4969." },
  { id: "local-app2-auth", repository: "D:/dev/my-app02", path: "src/store/useAuthStore.jsx", usedFor: ["Zustand auth/persist boundary"], evidence: "2026-07-14 read-only sanitized audit: 33 lines, 1,737 bytes, SHA-256 DA8F4C6AB40D340827A8205484AD98EC3693D4BF2073B922D5521E1734FE9653. storage/domain literals and sensitive values were not copied." },
  { id: "local-app2-todo", repository: "D:/dev/my-app02", path: "src/store/useTodoStore.jsx", usedFor: ["client CRUD store boundary"], evidence: "2026-07-14 read-only sanitized audit: 34 lines, 1,104 bytes, SHA-256 AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9." },
  { id: "local-app3-auth", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["external store and storage interaction"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. storage key and credential-like values were not copied." },
  { id: "local-app3-guest", repository: "D:/dev/my-app03", path: "src/store/useGuestbookStore.jsx", usedFor: ["server-backed entity list boundary"], evidence: "2026-07-14 read-only sanitized audit: 21 lines, 562 bytes, SHA-256 DA1A28E1BD3D8A7632530089011576C1FC7F4BE6A75D9001BFCD04323BABF209." },
  { id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["essential and normalized state"], evidence: "React 공식 state structure principles: related state grouping, contradiction/redundancy/duplication/deep nesting avoidance." },
  { id: "react-sharing", repository: "React official documentation", path: "learn/sharing-state-between-components", publicUrl: "https://react.dev/learn/sharing-state-between-components", usedFor: ["lifting state and controlled ownership"], evidence: "React 공식 shared-state ownership guidance입니다." },
  { id: "react-reducer", repository: "React official documentation", path: "learn/extracting-state-logic-into-a-reducer", publicUrl: "https://react.dev/learn/extracting-state-logic-into-a-reducer", usedFor: ["reducer extraction and actions"], evidence: "React 공식 reducer guidance입니다." },
  { id: "react-reducer-context", repository: "React official documentation", path: "learn/scaling-up-with-reducer-and-context", publicUrl: "https://react.dev/learn/scaling-up-with-reducer-and-context", usedFor: ["reducer plus context architecture"], evidence: "React 공식 reducer/context scaling guidance입니다." },
  { id: "react-managing-state", repository: "React official documentation", path: "learn/managing-state", publicUrl: "https://react.dev/learn/managing-state", usedFor: ["state management progression"], evidence: "React 공식 managing-state learning path입니다." },
  { id: "react-preserving-state", repository: "React official documentation", path: "learn/preserving-and-resetting-state", publicUrl: "https://react.dev/learn/preserving-and-resetting-state", usedFor: ["tree identity and reset"], evidence: "React 공식 state preservation/reset guidance입니다." },
  { id: "react-sync-store", repository: "React official API", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["external store snapshots and subscription"], evidence: "React 공식 external-store integration API입니다." },
  { id: "zustand-create-store", repository: "Zustand official documentation", path: "reference/apis/create-store", publicUrl: "https://zustand.docs.pmnd.rs/reference/apis/create-store", usedFor: ["vanilla external store contract"], evidence: "Zustand 공식 createStore API입니다." },
  { id: "zustand-persist", repository: "Zustand official documentation", path: "reference/middlewares/persist", publicUrl: "https://zustand.docs.pmnd.rs/reference/middlewares/persist", usedFor: ["versioned persistence and migration"], evidence: "Zustand 공식 persist middleware reference입니다." },
  { id: "zustand-flux", repository: "Zustand official documentation", path: "learn/guides/flux-inspired-practice", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/flux-inspired-practice", usedFor: ["actions and store architecture"], evidence: "Zustand 공식 Flux-inspired practice guidance입니다." },
  { id: "zustand-v5-migration", repository: "Zustand official documentation", path: "reference/migrations/migrating-to-v5", publicUrl: "https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5", usedFor: ["v5 replace/persist behavior distinctions"], evidence: "Zustand 공식 v4→v5 migration guidance이며 source projects의 declared v5 dependency 맥락과 구분해 사용합니다." },
  { id: "tanstack-overview", repository: "TanStack Query official documentation", path: "latest/docs/framework/react/overview", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/overview", usedFor: ["server-state lifecycle"], evidence: "TanStack Query 최신 React overview입니다." },
  { id: "tanstack-client-state", repository: "TanStack Query official documentation", path: "latest/docs/framework/react/guides/does-this-replace-client-state", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state", usedFor: ["server versus client state"], evidence: "TanStack Query 공식 server/client state responsibility guidance입니다." },
  { id: "tanstack-query-keys", repository: "TanStack Query official documentation", path: "latest/docs/framework/react/guides/query-keys", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys", usedFor: ["query key cache contract"], evidence: "TanStack Query 공식 query-key guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-29-state-architecture-migration", slug: "react-29-state-architecture-migration", courseId: "react", moduleId: "react-state-management", order: 9,
  title: "상태 아키텍처 선택·migration", subtitle: "local·lifted·Context/reducer·Zustand·server cache의 권위를 구분하고 dual-read/write, reconciliation, cutover와 rollback으로 무손실 전환합니다.",
  level: "고급", estimatedMinutes: 130,
  coreQuestion: "각 state의 가장 작은 올바른 owner를 어떻게 고르고, 이미 중복된 old/new 상태를 사용자-visible 데이터 손실 없이 단계적으로 전환하고 되돌릴까요?",
  summary: "my-app01의 local/lifted/Context/reducer progression과 my-app02/03의 Zustand persist·CRUD flows를 exact line/byte/SHA provenance로 sanitized audit했습니다. 도구 취향이 아니라 lifetime·writers/readers·remote authority·freshness·security decision record로 local, lifted, reducer-context, external store와 server cache를 선택하고 canonical adapters, shadow dual-read, idempotent dual-write, mismatch reconciliation, cohort cutover, durable journal과 rollback rehearsal까지 여섯 executable models로 연결합니다.",
  objectives: ["67개 상태 흐름에서 authoritative owner와 lifetime을 식별한다.", "local·lifted·Context/reducer·Zustand·server cache 선택 기준을 적용한다.", "essential/derived와 client/server state를 분리한다.", "canonical schema와 legacy/new adapters를 설계한다.", "dual-read/write와 mismatch reconciliation을 운영한다.", "cohort cutover guardrail과 rollback journal을 검증한다.", "민감 persistence와 SSR/hydration·multi-tab 위험을 통제한다.", "migration 완료·cleanup의 evidence gate를 작성한다."],
  prerequisites: [{ title: "store contract·component와 fault testing", reason: "old/new store의 action, selector, persistence, async race와 browser failure contract를 독립적으로 검증할 수 있어야 migration parity와 rollback evidence를 만들 수 있습니다.", sessionSlug: "react-28-store-contract-testing" }],
  keywords: ["state ownership", "local state", "lifting state", "Context", "useReducer", "Zustand", "server state", "dual read", "dual write", "reconciliation", "cutover", "rollback"],
  topics,
  lab: { title: "Todo·Memo·Guestbook 상태를 복구 가능한 architecture로 단계 전환하기", scenario: "원본 projects는 변경하지 않고 synthetic compatibility harness에서 current state fields를 분류하고 old/new adapters와 server-cache split을 만든 뒤 shadow, dual-write, cutover와 rollback을 qualification합니다.", setup: ["Node.js 20 이상", "project-compatible React/Zustand/query test runtime", "disposable storage and HTTP adapters", "feature flag/cohort emulator", "fault injector and deterministic clock", "read-only local source hashes", "synthetic non-sensitive fixtures"], steps: ["67개 state-flow manifest에서 writer/readers/lifetime/authority를 기록합니다.", "각 field를 local/lifted/reducer-context/external/server-cache decision scorecard에 배치합니다.", "essential/derived와 persisted allowlist를 정하고 sensitive state를 제거합니다.", "canonical schema와 legacy/new adapters, golden corpus를 구현합니다.", "shadow reads를 canonical compare하고 mismatch reason과 repair queue를 검증합니다.", "idempotent dual writes와 one-side outage/read-after-write를 fault inject합니다.", "stable cohorts에서 new read authority를 단계적으로 늘리고 guardrail을 확인합니다.", "mid-command rollback, snapshot restore, journal replay와 forward repair를 rehearsal합니다.", "old path 제거 전 oldest client, backlog zero, parity hold period와 restore evidence를 승인합니다.", "원본 sources의 hash/git status가 unchanged인지 재확인합니다."], expectedResult: ["각 사실의 owner·lifetime·reset·persistence·server authority가 단일 표에서 설명됩니다.", "old/new adapters가 golden corpus와 differential selectors에서 semantic parity를 만듭니다.", "partial writes와 read mismatches가 durable reason·queue로 드러나고 수렴합니다.", "cohort cutover가 error/mismatch/backlog budgets에서 자동 hold 또는 advance합니다.", "rollback이 accepted commands를 잃지 않고 RTO/RPO 안에서 verified readback을 만듭니다."], cleanup: ["shadow/dual-write flags와 workers를 안전 순서로 중지합니다.", "synthetic journal, storage, cache, mismatch payload와 artifacts를 폐기합니다.", "test adapters, clocks, subscribers, requests와 feature flags를 원복합니다.", "원본 15 files와 docs의 hash/status unchanged를 확인합니다."], extensions: ["URL/router state를 owner taxonomy에 추가합니다.", "server cache/query library actual integration과 offline mutation을 qualification합니다.", "multi-tab BroadcastChannel/storage-event reconciliation을 추가합니다.", "ADR와 cutover gates를 CI policy-as-code로 자동화합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node models를 실행하고 각 결과를 owner·adapter·reconciliation·cutover·rollback 단계에 대응시키세요.", requirements: ["stdout 완전 일치", "owner inventory", "reducer machine", "client/server split", "schema adapter", "mismatch queue", "cutover hold", "journal replay"], hints: ["Node model은 실제 React render, Zustand middleware, query cache, browser storage와 network를 대체하지 않습니다."], expectedOutcome: "각 model의 불변식과 실제 integration gap을 설명합니다.", solutionOutline: ["inventory→choose→adapt→shadow/reconcile→cutover→recover 순서입니다."] },
    { difficulty: "응용", prompt: "한 CRUD flow를 local/Zustand 혼합 구조에서 server-cache와 좁은 client state로 migration하세요.", requirements: ["authority map", "canonical schema", "query keys", "legacy adapter", "shadow compare", "dual write", "fault injection", "cohort gate", "rollback"], hints: ["remote entity array를 새 cache와 old store에 영구 복제한 채 완료로 선언하지 마세요."], expectedOutcome: "데이터 손실 없이 관찰·중단·복구 가능한 incremental migration이 완성됩니다.", solutionOutline: ["classify→seam→shadow→write→cutover→cleanup입니다."] },
    { difficulty: "설계", prompt: "조직 공통 frontend state architecture와 migration 표준을 작성하세요.", requirements: ["owner decision record", "client/server split", "persistence security", "adapter compatibility", "dual read/write", "reconciliation", "telemetry", "rollback RTO/RPO", "cleanup gate"], hints: ["숫자 scorecard가 authority와 security hard constraints를 상쇄하지 않게 하세요."], expectedOutcome: "library 교체와 데이터 model 변화에도 재사용할 수 있는 복구 중심 표준이 완성됩니다.", solutionOutline: ["facts→constraints→decision→compatibility→evidence→operate 순서입니다."] },
  ],
  nextSessions: ["react-30-state-management-capstone"], sources,
  sourceCoverage: { filesRead: 20, filesUsed: 15, uncoveredFiles: ["my-app01/src/pages/step13-context/Footer.jsx", "my-app01/src/pages/step13-context/Header.jsx", "my-app01/src/pages/step13-context/Main.jsx", "my-app02/src/pages/LoginPage.jsx", "my-app03/src/pages/GuestBookPage.jsx"], uncoveredNotes: ["이 세션은 architecture 결정과 migration seam에 직접 필요한 15 local files/docs를 source로 사용하고, 같은 flow의 consumer files 5개는 구조 확인만 했습니다.", "전체 67 state-flow source audit와 42-file uncovered manifest는 다음 capstone react-30에서 공개합니다.", "my-app02/my-app03 package는 React 19.2.x, react-router-dom 7.15 계열과 Zustand 5.0.x를 선언한 source snapshot이며 최신 권고로 과장하지 않습니다.", "실제 user/domain/storage/route/endpoint/credential-like literals는 sources, examples와 telemetry design에 복사하지 않았습니다.", "Node models는 React tree/scheduler, actual Zustand/query middleware, browser storage, network partial failure와 server authority를 대체하지 않습니다."] },
});

export default session;
