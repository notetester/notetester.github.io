import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-props-audit", title: "원본 props 예제를 owner·snapshot·callback 계약으로 감사합니다",
    lead: "Item/Profile 계열 여덟 파일을 부모·자식이라는 말에만 머물지 않고 source of truth, runtime types, missing props와 callback 권한이 어디에 있는지 추적합니다.",
    mechanism: "원본 Item은 destructuring, Profile은 name/status display, Profile2/3은 child event callback, ProfileSample 계열은 parent state와 callback 전달을 보여 주며 일부 unused import, spelling drift와 isStatus 누락도 함께 드러냅니다.",
    workflow: "각 component의 input props, local state, derived display, emitted events와 owner update를 표로 만들고 source에서 관찰한 사실과 실제 browser interaction 결과를 분리합니다.",
    invariants: "원본은 read-only이고 actual sample person/message strings는 공개 fixture에 복사하지 않으며, child는 props를 mutation하지 않고 owner에게 finite event intent만 전달합니다.",
    edgeCases: "missing isStatus, false/zero/empty/null, wrong callback type, rapid repeated click, unmounted child, stale closure와 callback throw를 포함합니다.",
    failureModes: "optional처럼 쓰인 prop이 실제로 required인데 누락되면 조용히 false UI가 되고, raw setter 전달은 child에 owner state 전체 mutation 권한을 줍니다.",
    verification: "source hash, prop contract table, runtime schema negative tests, user-event interaction, StrictMode rerender와 state owner trace를 실행합니다.",
    operations: "prop interface 변화는 component consumer inventory, compatibility period, visual/accessibility contract와 telemetry reason code로 release합니다.",
    concepts: [
      c("prop contract", "component가 받는 names, runtime types, requiredness, semantics와 callback events의 공개 interface입니다.", ["표시 예제보다 넓습니다.", "versioning 대상입니다."]),
      c("state owner", "어떤 사실의 authoritative current value와 update rules를 소유하는 component 또는 store입니다.", ["한 곳으로 고정합니다.", "파생 값과 구분합니다."]),
      c("event intent", "child가 owner에게 요청하는 domain/UI action을 최소 payload와 stable type으로 표현한 값입니다.", ["raw setter보다 좁습니다.", "검증 가능합니다."]),
    ],
    codeExamples: [node("react03-source-contract", "원본 component의 prop·owner risk inventory", "React03SourceContract.mjs", "missing prop와 raw setter exposure를 executable audit codes로 분류합니다.", String.raw`const contracts = [
  { component: "Item", required: ["title", "content"], supplied: ["title", "content"], rawSetter: false },
  { component: "Profile", required: ["name", "isStatus"], supplied: ["name"], rawSetter: false },
  { component: "Profile3", required: ["name", "status", "onChangeStatus"], supplied: ["name", "status", "onChangeStatus"], rawSetter: true },
];
for (const item of contracts) {
  const missing = item.required.filter((name) => !item.supplied.includes(name));
  console.log(item.component + ":missing=" + (missing.join(",") || "none") + ",raw-setter=" + item.rawSetter);
}`, "Item:missing=none,raw-setter=false\nProfile:missing=isStatus,raw-setter=false\nProfile3:missing=none,raw-setter=true", ["local-item", "local-item-list", "local-profile", "local-profile2", "local-profile3", "local-sample1", "local-sample2", "local-sample3"])],
  }),
  appliedTopic({
    id: "props-snapshot-readonly", title: "props를 읽기 전용 render snapshot으로 이해합니다",
    lead: "props를 JavaScript object 하나라고만 보면 nested mutation과 시간 변화가 섞이므로 특정 parent render가 전달한 immutable input snapshot이라는 React contract로 다룹니다.",
    mechanism: "parent state가 바뀌면 parent가 새 element/props values를 계산하고 React가 child를 다시 render합니다. 이미 시작한 render의 props가 스스로 바뀌는 것이 아니라 다음 render가 새 snapshot을 받습니다.",
    workflow: "component signature에서 props를 destructure하고 render에서는 읽기만 하며 변경은 owner event handler가 새 state/reference를 계산해 다음 render로 전달합니다.",
    invariants: "props object와 nested arrays/objects를 child가 mutation하지 않고 같은 inputs의 render는 같은 output을 만들며 external side effect는 event/effect boundary에 둡니다.",
    edgeCases: "parent가 같은 object를 재사용한 내부 mutation, frozen development fixture, concurrent render, event handler가 캡처한 old props와 async callback을 다룹니다.",
    failureModes: "child가 props.user.status를 직접 바꾸면 owner update log가 없고 memoization/reference comparison이 변화 감지를 놓쳐 UI와 data가 갈라집니다.",
    verification: "deep-freeze mutation negative test, old/new snapshot logs, StrictMode pure render, reference and value assertions와 concurrent async sequence를 확인합니다.",
    operations: "state mutation detector와 lint를 development/CI에 두고 production에서는 raw objects/PII를 logging하지 않은 stable transition metrics만 남깁니다.",
    concepts: [
      c("render snapshot", "한 render 호출이 보는 props·state·context values의 일관된 입력 묶음입니다.", ["다음 render와 구분합니다.", "handler closure에도 영향 줍니다."]),
      c("read-only input", "consumer가 직접 변경하지 않고 owner의 update interface로만 새 값을 요청하는 input입니다.", ["JavaScript가 자동 deep immutable인 것은 아닙니다.", "discipline과 tests가 필요합니다."]),
      c("structural sharing", "변경되지 않은 nested references는 재사용하고 변경 경로만 새 object/array로 만드는 update 방식입니다.", ["identity comparison을 돕습니다.", "deep clone과 다릅니다."]),
    ],
    codeExamples: [node("react03-immutable-update", "nested prop mutation과 structural copy 비교", "React03Immutable.mjs", "원본 snapshot을 보존하면서 status만 새 object로 바꾸는 update를 실행합니다.", String.raw`const original = Object.freeze({
  id: "u-1",
  profile: Object.freeze({ status: "away", score: 0 }),
});
const next = { ...original, profile: { ...original.profile, status: "active" } };
console.log("original=" + original.profile.status);
console.log("next=" + next.profile.status);
console.log("root-changed=" + (original !== next));
console.log("profile-changed=" + (original.profile !== next.profile));
console.log("score-preserved=" + next.profile.score);`, "original=away\nnext=active\nroot-changed=true\nprofile-changed=true\nscore-preserved=0", ["react-props", "react-state-snapshot", "react-updating-objects", "mdn-object-freeze"])],
  }),
  appliedTopic({
    id: "destructuring-default-rest", title: "destructuring·default·rest props의 missing semantics를 명시합니다",
    lead: "간결한 function signature가 requiredness와 validation을 숨기지 않도록 undefined, null, false, zero와 unknown props를 구분해 public component API를 읽을 수 있게 만듭니다.",
    mechanism: "parameter destructuring은 named properties를 local bindings로 가져오고 default initializer는 값이 undefined일 때만 적용됩니다. null, empty string, false와 zero는 그대로 유지됩니다.",
    workflow: "required props는 type/runtime schema로 검증하고 genuinely optional prop에만 domain default를 두며 rest props forwarding은 allowlist와 collision order를 설계합니다.",
    invariants: "required prop 누락을 false-like display로 숨기지 않고 boolean, enum과 identifier는 명시적 domain values를 사용하며 internal props를 host DOM에 무차별 spread하지 않습니다.",
    edgeCases: "property present with undefined, null, inherited property, getter throw, duplicate explicit/spread order, aria/data forwarding과 reserved key/ref를 확인합니다.",
    failureModes: "logical OR default는 valid false/zero를 덮고 props spread 뒤 explicit prop 순서가 바뀌면 security/accessibility attribute가 의도치 않게 override됩니다.",
    verification: "missing/undefined/null/empty/false/zero/wrong-type corpus, host DOM warning, attribute output와 TypeScript compile-time cases를 함께 둡니다.",
    operations: "optional→required 또는 default change는 consumer telemetry가 아니라 static inventory와 compatibility adapter, deprecation tests로 migration합니다.",
    concepts: [
      c("default initializer", "destructured property가 undefined일 때 사용할 local fallback expression입니다.", ["null에는 적용되지 않습니다.", "domain default 근거가 필요합니다."]),
      c("rest props", "명시적으로 추출하지 않은 remaining enumerable own properties를 모은 object입니다.", ["blind DOM forwarding을 피합니다.", "allowlist가 필요할 수 있습니다."]),
      c("requiredness", "component가 의미 있는 결과를 만들기 위해 반드시 받아야 하는 prop 조건입니다.", ["type과 runtime에서 다룹니다.", "false-like와 혼동하지 않습니다."]),
    ],
    codeExamples: [node("react03-default-semantics", "undefined default와 false·zero·null 보존", "React03Defaults.mjs", "destructuring default와 nullish fallback의 차이를 exact values로 출력합니다.", String.raw`function inspect(input) {
  const { enabled = true, count = 5, label = "fallback" } = input;
  return { enabled, count, label };
}
for (const input of [{}, { enabled: false, count: 0, label: "" }, { label: null }]) {
  const value = inspect(input);
  console.log(JSON.stringify(value));
}`, "{\"enabled\":true,\"count\":5,\"label\":\"fallback\"}\n{\"enabled\":false,\"count\":0,\"label\":\"\"}\n{\"enabled\":true,\"count\":5,\"label\":null}", ["local-item", "local-profile", "mdn-destructuring", "react-props"])],
  }),
  appliedTopic({
    id: "runtime-type-schema", title: "static prop type와 untrusted runtime data validation을 분리합니다",
    lead: "JSX를 작성한 개발자에게는 TypeScript가 도움을 주지만 network JSON, storage와 JavaScript caller는 runtime에 wrong type을 보낼 수 있으므로 boundary schema와 display model을 둡니다.",
    mechanism: "static type checker는 build-time source relationships를 검사하고 erased types는 runtime payload를 바꾸지 않습니다. schema parser가 unknown input을 validate/normalize해 trusted component props를 만듭니다.",
    workflow: "fetch response를 unknown으로 받고 status/media/schema를 검증해 domain DTO를 만든 뒤 component-specific projection과 formatter로 props를 구성합니다.",
    invariants: "component 내부에서 every field를 defensive parse하지 않고 boundary가 finite enums, ranges, string lengths와 optional semantics를 보장하며 parse failure는 safe UI/error code로 전환합니다.",
    edgeCases: "numeric string, NaN/Infinity, unknown enum, missing nested object, additional fields, large string/array, prototype pollution keys와 versioned response를 다룹니다.",
    failureModes: "as Type assertion으로 payload를 신뢰하면 undefined access와 false display가 생기고 raw object spread는 internal/sensitive fields를 child나 DOM에 노출합니다.",
    verification: "positive/negative schema corpus, fuzz/property tests, API contract fixture, forbidden prop/DOM field assertions와 version compatibility matrix를 실행합니다.",
    operations: "schema failure rate를 endpoint/version/reason code로 낮은 cardinality 관찰하고 raw payload/PII는 telemetry에 남기지 않으며 rollback과 adapter를 둡니다.",
    concepts: [
      c("static prop type", "source code에서 component caller와 signature의 type 관계를 검사하는 compile-time contract입니다.", ["runtime에 사라질 수 있습니다.", "untrusted JSON을 검증하지 않습니다."]),
      c("runtime schema", "실행 중 unknown input의 shape, types, ranges와 allowed values를 검사·변환하는 contract입니다.", ["boundary에서 적용합니다.", "stable errors를 만듭니다."]),
      c("projection", "큰 domain/API object에서 component가 공개·표시할 최소 fields만 새 object로 선택하는 변환입니다.", ["data minimization을 돕습니다.", "prop coupling을 줄입니다."]),
    ],
    codeExamples: [node("react03-prop-parser", "unknown profile payload를 finite prop contract로 parse", "React03Parser.mjs", "id/name/status만 allowlist하고 wrong/missing values를 stable codes로 거부합니다.", String.raw`const allowed = new Set(["active", "away"]);
function parse(value) {
  if (!value || typeof value !== "object") return { ok: false, code: "object-required" };
  if (typeof value.id !== "string" || value.id.length === 0) return { ok: false, code: "id-required" };
  if (typeof value.name !== "string" || value.name.length > 40) return { ok: false, code: "name-invalid" };
  if (!allowed.has(value.status)) return { ok: false, code: "status-invalid" };
  return { ok: true, value: { id: value.id, name: value.name, status: value.status } };
}
console.log(JSON.stringify(parse({ id: "1", name: "Ada", status: "active", secret: "drop" })));
console.log(JSON.stringify(parse({ id: "2", name: "Bob", status: "unknown" })));`, "{\"ok\":true,\"value\":{\"id\":\"1\",\"name\":\"Ada\",\"status\":\"active\"}}\n{\"ok\":false,\"code\":\"status-invalid\"}", ["react-typescript", "typescript-unknown", "owasp-mass-assignment", "local-sample1"])],
  }),
  appliedTopic({
    id: "reference-identity-memo", title: "object·array·function prop의 value와 reference identity를 구분합니다",
    lead: "내용이 같아 보이는 object도 매 render마다 새 reference면 memoized child와 Effect dependencies가 달라질 수 있으므로 correctness와 performance의 identity 요구를 먼저 정합니다.",
    mechanism: "JavaScript objects/functions는 reference identity로 비교되고 React memoization/dependency tools는 보통 Object.is 기반 비교를 사용합니다. 새 literal은 같은 fields여도 다른 reference입니다.",
    workflow: "primitive props와 minimal IDs를 우선하고 derived object/function은 필요성과 measured bottleneck이 있을 때 stable owner, useMemo/useCallback 또는 child API redesign을 선택합니다.",
    invariants: "reference stability를 correctness requirement로 만들지 않고 stale closure를 피하며 memoization은 pure calculation/result equivalence와 dependency completeness를 전제로 합니다.",
    edgeCases: "NaN, -0/Object.is, mutated same reference, function closure, optional callback, context value object와 deep comparison cost를 확인합니다.",
    failureModes: "매 render 새 object 때문에 memoized child가 계속 render되거나 same mutated reference 때문에 store selector/update가 변화를 놓치고, 빈 dependency callback이 old props를 캡처합니다.",
    verification: "render counts보다 user result를 먼저 assert하고 Profiler evidence, reference/value matrix, stale callback test와 mutation detector를 사용합니다.",
    operations: "compiler/runtime upgrade와 memoization 제거는 production trace와 interaction latency budget으로 canary하고 optimization code에 owner/measurement를 남깁니다.",
    concepts: [
      c("reference identity", "두 object/function values가 같은 allocation을 가리키는지 비교하는 JavaScript identity입니다.", ["field equality와 다릅니다.", "Object.is 비교를 이해합니다."]),
      c("referential stability", "여러 render 사이 의미가 변하지 않을 때 같은 reference를 유지하는 속성입니다.", ["항상 필요한 것은 아닙니다.", "dependencies와 memo에 영향 줍니다."]),
      c("stale closure", "handler가 생성될 때의 old props/state snapshot을 계속 참조해 현재 intent와 다른 결과를 내는 현상입니다.", ["dependencies 또는 functional update를 검토합니다.", "async에서 드러납니다."]),
    ],
    codeExamples: [node("react03-reference-matrix", "value equality와 reference identity 반례", "React03References.mjs", "같은 fields의 새 object, same mutation과 structural copy를 비교합니다.", String.raw`const first = { status: "away" };
const sameValue = { status: "away" };
const sameReference = first;
const next = { ...first, status: "active" };
console.log("same-value-ref=" + Object.is(first, sameValue));
console.log("same-ref=" + Object.is(first, sameReference));
console.log("next-ref=" + Object.is(first, next));
console.log("first-status=" + first.status);
console.log("next-status=" + next.status);`, "same-value-ref=false\nsame-ref=true\nnext-ref=false\nfirst-status=away\nnext-status=active", ["react-memo", "react-use-callback", "react-state-structure"])],
  }),
  appliedTopic({
    id: "callback-event-contract", title: "callback prop을 raw setter가 아닌 typed event intent로 좁힙니다",
    lead: "자식에서 부모로 값을 보낸다는 표현을 child가 owner를 직접 변경한다는 의미로 오해하지 않고 owner가 제공한 capability를 user event에서 호출하는 contract로 설계합니다.",
    mechanism: "parent는 function prop을 전달하고 child event handler가 finite payload로 호출합니다. callback은 owner가 validation, transition, authorization, analytics와 side effects 순서를 결정하는 entry point입니다.",
    workflow: "onStatusChange(nextStatus) 또는 onAction({type,id})처럼 이름·payload·sync/async/error semantics를 문서화하고 child는 pending/disabled/error UX를 contract에 맞게 표시합니다.",
    invariants: "raw setState/store reference를 전달하지 않고 child가 허용 가능한 action만 요청하며 callback은 render 중이 아니라 explicit event에서 호출됩니다.",
    edgeCases: "double click, callback absent, async rejection, unmount during request, stale entity version, disabled/read-only user와 event bubbling을 다룹니다.",
    failureModes: "setStatus 자체를 전달하면 child가 arbitrary value/function을 넣을 수 있고 duplicate click은 mutation을 중복 전송하며 rejection을 무시하면 UI와 server가 갈라집니다.",
    verification: "user-event test, action payload schema, duplicate/idempotency, pending state, rejection/retry, version conflict와 accessible error feedback을 검증합니다.",
    operations: "action success/failure/latency를 stable type과 reason code로 관찰하고 payload PII를 redaction하며 repeated failure rollback/fallback runbook을 둡니다.",
    concepts: [
      c("capability callback", "child가 수행할 수 있는 제한된 action을 function interface로 부여하는 prop입니다.", ["raw owner mutation보다 좁습니다.", "least authority를 적용합니다."]),
      c("event payload", "action type과 필요한 최소 identity/value/version을 담는 immutable request value입니다.", ["runtime schema가 필요할 수 있습니다.", "DOM event 전체를 저장하지 않습니다."]),
      c("pending contract", "async callback 실행 중 중복 action, cancellation, progress와 error display를 정의한 UI 상태 규칙입니다.", ["button disable만으로 끝나지 않습니다.", "retry/idempotency와 연결합니다."]),
    ],
    codeExamples: [node("react03-event-reducer", "finite child event와 owner transition", "React03Events.mjs", "raw setter 대신 allowed status events만 owner reducer가 적용하고 invalid event를 거부합니다.", String.raw`function reduce(state, event) {
  if (event.type !== "status-requested") return { ...state, error: "unknown-event" };
  if (!["active", "away"].includes(event.value)) return { ...state, error: "invalid-status" };
  if (state.status === event.value) return { ...state, error: null, changed: false };
  return { status: event.value, error: null, changed: true };
}
let state = { status: "away", error: null };
state = reduce(state, { type: "status-requested", value: "active" });
console.log(JSON.stringify(state));
console.log(JSON.stringify(reduce(state, { type: "status-requested", value: "root" })));`, "{\"status\":\"active\",\"error\":null,\"changed\":true}\n{\"status\":\"active\",\"error\":\"invalid-status\",\"changed\":true}", ["local-profile2", "local-profile3", "local-sample2", "local-sample3", "react-responding-events"])],
  }),
  appliedTopic({
    id: "lifting-single-source", title: "공유 상태를 가장 가까운 공통 owner로 올리고 파생 값을 계산합니다",
    lead: "여러 Profile이 같은 status를 보여야 할 때 각 child local state와 Effects로 복제하지 않고 최소 canonical state와 update path를 한 곳에 둡니다.",
    mechanism: "closest common parent가 shared state를 소유해 value props와 callback props를 children에게 전달합니다. child local state는 독립 draft/ephemeral UI처럼 실제로 공유하지 않는 사실에만 둡니다.",
    workflow: "각 state variable의 owner, writers, readers, persistence와 reset lifetime을 표로 만들고 duplicates를 제거해 canonical state와 pure derived values를 구분합니다.",
    invariants: "동일 domain 사실의 authoritative copy는 하나이고 every update는 owner transition을 통하며 child display는 next render props에서 계산됩니다.",
    edgeCases: "component unmount/remount reset, route change, server refetch, optimistic draft, undo, two browser tabs와 concurrent server update를 다룹니다.",
    failureModes: "parent status와 child status를 각각 저장하면 button path마다 일부만 바뀌고 synchronization Effect가 loop/race를 만들며 hidden component state가 stale하게 남습니다.",
    verification: "state ownership diagram, all action paths, mount/reset, two-child consistency, server reconciliation과 no-sync-effect assertions를 둡니다.",
    operations: "owner가 parent→Context/store/server cache로 이동하면 data migration, reset/persistence policy와 rollback compatibility를 versioned test합니다.",
    concepts: [
      c("single source of truth", "한 사실의 authoritative value와 update rules를 한 owner에 두는 설계입니다.", ["복제 UI는 props로 읽습니다.", "server authority와도 구분합니다."]),
      c("lifting state up", "shared state를 children의 가장 가까운 common owner로 이동하는 React pattern입니다.", ["필요 범위까지만 올립니다.", "global state와 다릅니다."]),
      c("derived value", "canonical inputs에서 render 중 순수하게 다시 계산할 수 있어 별도 state로 저장하지 않는 값입니다.", ["동기화 Effect를 줄입니다.", "비용은 측정합니다."]),
    ],
    codeExamples: [node("react03-owner-model", "canonical state와 두 child projection 일치", "React03Owner.mjs", "owner action 한 번이 두 child view와 derived summary를 같은 snapshot에서 만들도록 실행합니다.", String.raw`function view(state, id) {
  return { id, status: state.status, label: state.status === "active" ? "online" : "offline" };
}
let owner = { status: "away", version: 1 };
owner = { status: "active", version: owner.version + 1 };
const children = [view(owner, "left"), view(owner, "right")];
console.log("version=" + owner.version);
console.log("statuses=" + children.map((x) => x.status).join(","));
console.log("labels=" + children.map((x) => x.label).join(","));`, "version=2\nstatuses=active,active\nlabels=online,online", ["local-sample1", "local-sample3", "react-sharing-state", "react-state-structure"])],
  }),
  appliedTopic({
    id: "drilling-composition-context", title: "prop drilling·composition·Context의 tradeoff와 scope를 결정합니다",
    lead: "중간 component가 prop을 전달한다는 이유만으로 global context를 만들지 않고 tree structure, slot composition, state locality와 update frequency를 근거로 data path를 선택합니다.",
    mechanism: "explicit props는 dependency를 드러내고 composition은 intermediate component가 data를 몰라도 rendered child를 받게 합니다. Context는 provider subtree에 ambient dependency를 제공하지만 value update가 consumers에 영향을 줍니다.",
    workflow: "먼저 state를 consuming subtree 가까이 두고 props/children slots로 전달한 뒤 truly cross-cutting stable data에 Context를 검토하고 high-frequency/domain server state는 specialized store/cache와 비교합니다.",
    invariants: "Context default가 provider 누락을 조용히 숨기지 않고 provider value identity와 lifecycle을 관리하며 component reuse/test에는 explicit boundary wrapper를 제공합니다.",
    edgeCases: "nested providers, partial subtree override, value object recreation, provider reset, portal, SSR request isolation과 multiple React roots를 다룹니다.",
    failureModes: "한 giant Context에 모든 state/actions를 넣으면 unrelated consumers가 render되고 reuse/test dependencies가 숨으며 provider 누락이 fake default로 production error를 가립니다.",
    verification: "dependency tree, consumer render/profile, missing provider negative test, nested scope isolation와 SSR/multi-root fixture를 실행합니다.",
    operations: "Context interface 변화와 store migration은 consumers inventory, compatibility adapter, provider version telemetry와 rollback wrapper를 둡니다.",
    concepts: [
      c("prop drilling", "data가 필요한 descendant까지 여러 intermediate component props를 거쳐 전달되는 현상입니다.", ["항상 결함은 아닙니다.", "dependency가 명시적입니다."]),
      c("composition inversion", "parent가 이미 구성한 child/slot element를 intermediate component에 전달해 data dependency를 우회하는 방식입니다.", ["children/named slots를 씁니다.", "DOM ownership을 고려합니다."]),
      c("Context", "provider subtree의 descendants가 explicit prop chain 없이 읽는 ambient React value channel입니다.", ["scope와 update cost가 있습니다.", "global mutable singleton이 아닙니다."]),
    ],
  }),
  appliedTopic({
    id: "state-vs-props-lifecycle", title: "props·local state·server state·derived state의 수명과 authority를 구분합니다",
    lead: "화면에 쓰이는 모든 값을 useState에 넣지 않고 누가 바꾸며 얼마나 오래 살아야 하고 server와 충돌할 때 누가 이기는지 기준으로 저장 위치를 선택합니다.",
    mechanism: "props는 owner snapshot, local state는 component instance의 user interaction memory, server state는 remote authority의 cached snapshot, derived value는 inputs에서 계산되는 값입니다.",
    workflow: "각 value에 authority, writers/readers, lifetime/reset, persistence, synchronization와 conflict policy를 적고 minimum canonical state만 저장합니다.",
    invariants: "props로 초기화한 editable draft는 이후 prop 변경 정책을 명시하고 server value를 blind overwrite하지 않으며 derived data는 stale duplicate state로 저장하지 않습니다.",
    edgeCases: "route param change, same component key reuse, form dirty state, server refetch, optimistic update rollback, offline cache와 multi-tab changes를 다룹니다.",
    failureModes: "useState(props.value)가 prop updates를 자동 따라갈 것이라 기대하면 stale draft가 되고 Effect mirror는 user edits를 덮거나 loop를 만듭니다.",
    verification: "lifecycle/reset matrix, dirty vs pristine prop update, key change, refetch/conflict, undo/rollback과 remount tests를 실행합니다.",
    operations: "state model 변경은 persisted storage/cache schema migration과 old/new tab compatibility, invalidation, rollback cleanup을 포함합니다.",
    concepts: [
      c("local state", "특정 mounted component instance가 interaction 사이에 기억하는 UI value입니다.", ["key/type/position에 따라 보존됩니다.", "server truth와 다릅니다."]),
      c("server state", "remote system이 authoritative하며 client가 비동기 snapshot/cache로 보유하는 data입니다.", ["staleness와 invalidation이 있습니다.", "props/local state와 정책이 다릅니다."]),
      c("draft state", "사용자가 commit 전 편집하는 local copy로 base version과 dirty/conflict policy를 가진 state입니다.", ["props mirror와 다릅니다.", "cancel/rebase가 필요합니다."]),
    ],
  }),
  appliedTopic({
    id: "prop-api-evolution-tests", title: "component prop API를 accessibility·security·compatibility tests로 versioning합니다",
    lead: "prop rename 하나도 dozens of consumers의 behavior, DOM exposure와 accessible names를 바꿀 수 있으므로 public interface, migration adapter와 release evidence를 함께 관리합니다.",
    mechanism: "component API는 prop names/types/defaults, callback timing/errors, children slots, rendered semantic DOM, focus와 styling extension points를 포함합니다.",
    workflow: "API contract table과 consumer inventory를 만들고 new prop을 additive하게 도입해 deprecation warning/codemod/adapter를 제공한 뒤 usage zero에서 old path를 제거합니다.",
    invariants: "unknown props를 secret/PII와 함께 DOM spread하지 않고 accessible name/role/state와 forbidden fields를 tests로 고정하며 callback failure를 삼키지 않습니다.",
    edgeCases: "old/new props both supplied, default change, callback async conversion, renamed event payload, CSS/test selector coupling, third-party consumer와 mixed-version bundles를 다룹니다.",
    failureModes: "silent default change는 users 일부에서만 UI를 뒤집고 raw spread는 internal token을 data attribute로 노출하며 snapshot-only tests는 keyboard/error regression을 놓칩니다.",
    verification: "type tests, runtime schema corpus, role/name user flows, forbidden DOM fields, old/new compatibility, visual/browser and bundle canary를 실행합니다.",
    operations: "deprecation adoption, error/latency/accessibility signals와 bundle versions를 관찰하고 removal gate, rollback adapter와 support runbook을 운영합니다.",
    concepts: [
      c("component public API", "consumer가 의존하는 props, events, slots, rendered semantics와 lifecycle behavior의 합의입니다.", ["JavaScript signature보다 넓습니다.", "versioning 대상입니다."]),
      c("compatibility adapter", "old prop/event contract를 new internal model로 변환해 migration window를 제공하는 임시 boundary입니다.", ["owner와 expiry가 필요합니다.", "telemetry로 제거를 판단합니다."]),
      c("forbidden prop", "secret, internal authorization 또는 unsupported DOM field처럼 component/host output에 전달되면 안 되는 value입니다.", ["negative assertion을 둡니다.", "spread를 제한합니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "local-item", repository: "D:/dev/my-app01", path: "src/pages/step02-component/Item.jsx", usedFor: ["props destructuring", "item display"], evidence: "2026-07-14 read-only audit: 17 lines, 398 bytes, SHA-256 3BD21516D49B40681E13192073DBB111D7889DA2DF8874B5F3E64CD348943C9A." },
  { id: "local-item-list", repository: "D:/dev/my-app01", path: "src/pages/step02-component/ItemList.jsx", usedFor: ["parent composition", "quoted props"], evidence: "2026-07-14 read-only audit: 12 lines, 421 bytes, SHA-256 DEA2F180913CC1077507DBD1D24C4D16FC3C6B5319A007EBFADB39C786727D49. 실제 lesson strings는 복사하지 않았습니다." },
  { id: "local-profile", repository: "D:/dev/my-app01", path: "src/pages/step09-props/Profile.jsx", usedFor: ["name/status props", "missing boolean behavior"], evidence: "2026-07-14 read-only audit: 25 lines, 678 bytes, SHA-256 75083A9588021E455D87BF5EC4A629ECBC76DB5CFA16D9BB4685EB3E0DC297F9." },
  { id: "local-profile2", repository: "D:/dev/my-app01", path: "src/pages/step09-props/Profile2.jsx", usedFor: ["callback prop", "local child state"], evidence: "2026-07-14 read-only audit: 16 lines, 661 bytes, SHA-256 08730535452B02658FD047C6947569BA66D83CC192075B9D00185D2FF49E92B1." },
  { id: "local-profile3", repository: "D:/dev/my-app01", path: "src/pages/step09-props/Profile3.jsx", usedFor: ["value and raw setter-like callback props"], evidence: "2026-07-14 read-only audit: 11 lines, 401 bytes, SHA-256 61F3647FBE926844426EE6D4F15AD9BF327CDC6353FC0A0DF8A65E891827E340." },
  { id: "local-sample1", repository: "D:/dev/my-app01", path: "src/pages/step09-props/ProfileSample.jsx", usedFor: ["parent owner", "status/user props", "missing prop call"], evidence: "2026-07-14 read-only audit: 43 lines, 1,981 bytes, SHA-256 38BB0E4E9DAED3F4BB222AFBA1DAE4BE608E9422C5D7779CEC904F6C2AC32843. 실제 person strings는 사용하지 않았습니다." },
  { id: "local-sample2", repository: "D:/dev/my-app01", path: "src/pages/step09-props/ProfileSample2.jsx", usedFor: ["parent callback", "child-to-owner intent"], evidence: "2026-07-14 read-only audit: 19 lines, 534 bytes, SHA-256 948124F7EA6C4F86A480E06AEA43C47A45855D2876C55956C0B3A07E6C9CE980." },
  { id: "local-sample3", repository: "D:/dev/my-app01", path: "src/pages/step09-props/ProfileSample3.jsx", usedFor: ["lifted state", "raw setStatus callback"], evidence: "2026-07-14 read-only audit: 25 lines, 754 bytes, SHA-256 59888460C4720CC074ED71AE7CD30D9F2A843132550F2CD4059FA3BF6B069E64. 실제 person strings는 사용하지 않았습니다." },
  { id: "react-props", repository: "React official documentation", path: "learn/passing-props-to-a-component", publicUrl: "https://react.dev/learn/passing-props-to-a-component", usedFor: ["props snapshot/read-only", "destructuring/defaults/children"], evidence: "current official props guidance를 확인했습니다." },
  { id: "react-state-snapshot", repository: "React official documentation", path: "learn/state-as-a-snapshot", publicUrl: "https://react.dev/learn/state-as-a-snapshot", usedFor: ["render snapshots", "event closure values"], evidence: "state/props render snapshot model을 확인했습니다." },
  { id: "react-updating-objects", repository: "React official documentation", path: "learn/updating-objects-in-state", publicUrl: "https://react.dev/learn/updating-objects-in-state", usedFor: ["immutability", "structural copy"], evidence: "object state update and mutation caveats를 확인했습니다." },
  { id: "react-sharing-state", repository: "React official documentation", path: "learn/sharing-state-between-components", publicUrl: "https://react.dev/learn/sharing-state-between-components", usedFor: ["lifting state", "single owner"], evidence: "shared state owner와 controlled component pattern을 확인했습니다." },
  { id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["avoid duplicate/derived state", "state normalization"], evidence: "state structure principles and duplication risks를 확인했습니다." },
  { id: "react-responding-events", repository: "React official documentation", path: "learn/responding-to-events", publicUrl: "https://react.dev/learn/responding-to-events", usedFor: ["callback handlers", "event propagation"], evidence: "event handler passing/calling contract를 확인했습니다." },
  { id: "react-typescript", repository: "React official documentation", path: "learn/typescript", publicUrl: "https://react.dev/learn/typescript", usedFor: ["static prop types", "React TypeScript setup"], evidence: "official React TypeScript prop typing guidance를 확인했습니다." },
  { id: "react-memo", repository: "React official API", path: "reference/react/memo", publicUrl: "https://react.dev/reference/react/memo", usedFor: ["prop comparison", "memoization caveats"], evidence: "memo Object.is prop comparison and correctness caveats를 확인했습니다." },
  { id: "react-use-callback", repository: "React official API", path: "reference/react/useCallback", publicUrl: "https://react.dev/reference/react/useCallback", usedFor: ["function identity", "dependency semantics"], evidence: "useCallback cache and dependency behavior를 확인했습니다." },
  { id: "typescript-unknown", repository: "TypeScript official handbook", path: "2/functions.html#unknown", publicUrl: "https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown", usedFor: ["unknown input", "safe narrowing"], evidence: "unknown type narrowing guidance를 확인했습니다." },
  { id: "mdn-destructuring", repository: "MDN Web Docs", path: "JavaScript/Reference/Operators/Destructuring", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring", usedFor: ["parameter destructuring", "default initializer/rest"], evidence: "destructuring/default semantics를 확인했습니다." },
  { id: "mdn-object-freeze", repository: "MDN Web Docs", path: "JavaScript/Reference/Global_Objects/Object/freeze", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze", usedFor: ["shallow freeze", "mutation tests"], evidence: "Object.freeze shallow immutability behavior를 확인했습니다." },
  { id: "owasp-mass-assignment", repository: "OWASP Cheat Sheet Series", path: "Mass_Assignment_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html", usedFor: ["allowlist projection", "untrusted field binding"], evidence: "allowlist DTO and mass assignment defense principles를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "react-03-props-one-way-data", slug: "react-03-props-one-way-data",
  courseId: "react", moduleId: "react-rendering-components", order: 3,
  title: "props와 단방향 데이터 흐름", subtitle: "읽기 전용 snapshot, runtime schema, callback capability와 state ownership으로 부모·자식 component 계약을 설계합니다.",
  level: "기초", estimatedMinutes: 120,
  coreQuestion: "component 사이의 data와 변경 의도를 누가 소유하고 어떤 prop/event 계약으로 전달해야 상태가 한 방향으로 설명 가능할까요?",
  summary: "my-app01의 Item/ItemList와 Profile/ProfileSample 6개 계열 파일을 read-only로 감사해 destructuring, parent→child values, child callback과 lifted state의 실제 학습 흐름을 보존합니다. props snapshot과 read-only/nested immutability, default/rest semantics, static vs runtime schema, reference identity, capability callback, single source of truth, props/composition/Context 선택, local/server/draft state와 component API evolution까지 current official sources와 일곱 Node examples로 확장합니다. 원본의 missing isStatus, raw setter 권한과 문자열 오타를 숨기지 않고 synthetic data, accessibility/security/compatibility tests로 production 기준을 세웁니다.",
  objectives: ["원본 component의 prop/state/event owner를 inventory한다.", "props를 immutable render snapshot으로 설명한다.", "destructuring default와 false/zero/null semantics를 구분한다.", "static type과 runtime schema/projection을 적용한다.", "value/reference identity와 stale closure를 진단한다.", "callback을 finite event capability로 설계한다.", "shared state를 common owner에 올리고 derived state를 제거한다.", "props/composition/Context 및 local/server/draft state의 수명을 선택한다.", "component API를 security/accessibility/compatibility gates로 운영한다."],
  prerequisites: [{ title: "JSX 표현식·속성·Fragment", reason: "JSX가 prop values와 children을 어떤 runtime types로 만드는지 알아야 component input과 event output 계약을 정확히 설계할 수 있습니다.", sessionSlug: "react-02-jsx-expression-fragment" }],
  keywords: ["props", "one-way data flow", "snapshot", "immutability", "destructuring", "runtime schema", "callback", "lifting state", "Context", "derived state", "component API"],
  topics,
  lab: {
    title: "원본 Profile 계열을 typed prop·event·owner contract로 재설계하기",
    scenario: "원본 files는 변경하지 않고 synthetic profiles와 disposable React fixture에서 missing props, callback 권한, duplicated state와 API migration을 검증합니다.",
    setup: ["Node 20 이상", "React development/production fixture", "TypeScript and runtime schema fixture", "Testing Library compatible DOM", "원본 8 files read-only", "synthetic non-PII profiles"],
    steps: ["원본 8 files의 hash, input props, local/parent state와 callbacks를 기록합니다.", "required/optional/default/enum/range/callback error prop contract table을 작성합니다.", "missing isStatus와 false/zero/null/undefined matrix를 test합니다.", "nested object mutation을 deep-freeze fixture로 실패시키고 structural update로 바꿉니다.", "unknown API payload를 schema→allowlist projection→trusted props로 변환합니다.", "raw setStatus prop을 status-requested event capability로 교체합니다.", "duplicate child/parent status를 common owner canonical state로 합칩니다.", "object/function reference와 stale async callback을 Profiler/user flows로 검증합니다.", "role/name/error/pending UI와 forbidden DOM fields를 test합니다.", "old/new prop adapter, consumer inventory, canary와 rollback을 rehearsal합니다."],
    expectedResult: ["모든 prop의 type, requiredness, default와 owner가 명확합니다.", "child mutation과 duplicated state가 없고 every event가 finite owner transition을 통합니다.", "untrusted fields/PII가 props 또는 DOM으로 흘러가지 않습니다.", "missing/wrong/stale/duplicate cases가 safe UI와 stable error를 만듭니다.", "old/new consumers가 compatibility window와 rollback에서 작동합니다."],
    cleanup: ["temporary builds, node_modules, browser storage와 test reports를 제거합니다.", "synthetic profiles/runtime schema corpus를 폐기합니다.", "verbose render/action tracing을 원복합니다.", "원본 8 files hash/status unchanged를 확인합니다."],
    extensions: ["discriminated union component variants를 TypeScript로 구현합니다.", "Context와 Zustand selector의 update fan-out을 비교합니다.", "server state query cache와 local editable draft conflict를 추가합니다.", "prop API contract metadata에서 docs/tests/codemods를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 원본 Profile 흐름과 대응시키세요.", requirements: ["stdout 완전 일치", "missing prop 확인", "structural copy", "default semantics", "runtime projection", "reference identity", "finite callback event", "single owner"], hints: ["callback 호출을 child가 parent state를 직접 변경한다고 설명하지 마세요."], expectedOutcome: "props snapshot과 owner transition을 실행 결과로 설명합니다.", solutionOutline: ["audit→snapshot/default/type→identity→event→owner 순서입니다."] },
    { difficulty: "응용", prompt: "ProfileSample3의 raw setter와 상태 모델을 production-safe하게 재설계하세요.", requirements: ["typed status enum", "runtime validation", "finite event payload", "pending/error/duplicate policy", "single owner", "accessibility tests", "forbidden field test", "compatibility adapter"], hints: ["setState 함수 전체를 child API로 공개하지 마세요."], expectedOutcome: "least-authority component event contract와 복구 가능한 UI가 완성됩니다.", solutionOutline: ["contract→parse→event reducer→render states→tests→migration 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React prop·state ownership 표준을 작성하세요.", requirements: ["required/default semantics", "immutability", "runtime boundary", "object/function identity", "callback capability", "lifting/context/store criteria", "draft/server state", "security/a11y/versioning gates"], hints: ["TypeScript interface 목록이 아니라 data lifecycle과 change authority를 정의하세요."], expectedOutcome: "component 간 data 흐름을 감사·migration할 수 있는 표준이 완성됩니다.", solutionOutline: ["classify→own→validate→project→emit→synchronize→evolve 순서입니다."] },
  ],
  nextSessions: ["react-04-list-key-reconciliation"], sources,
  sourceCoverage: { filesRead: 8, filesUsed: 8, uncoveredNotes: ["원본의 실제 person/course/message strings는 공개 examples에 복사하지 않고 component structure와 contract defect만 provenance로 사용했습니다.", "원본 JavaScript files에는 static/runtime prop schema, callback error/pending, security/accessibility와 compatibility migration이 충분하지 않아 official sources와 synthetic models로 보강했습니다.", "Node examples는 React render scheduling, browser events/DOM, TypeScript compiler와 schema library integration을 대체하지 않으므로 lab fixture가 필요합니다.", "state setters, batching, list reconciliation, forms와 hooks의 더 깊은 behavior는 후속 React04~18에서 별도 원본과 함께 다룹니다."] },
});

export default session;
