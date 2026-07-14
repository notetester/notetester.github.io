import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-consumer-subscription-audit", title: "원본 consumer의 실제 subscription 폭을 감사합니다",
    lead: "TodoPage·MemoPage·Navbar와 세 stores를 read-only·sanitized 감사해 whole-store read와 atomic selector read를 component별 graph로 만듭니다.",
    mechanism: "인자 없이 useStore()를 호출하면 component가 store 전체 state 변화에 반응하고 useStore(state => state.field)는 선택한 결과의 equality 변화에 반응합니다. 원본 auth read 일부는 atomic이지만 todo·memo page와 Navbar에는 whole-store subscription이 남아 있습니다.",
    workflow: "component마다 render에 쓰는 fields, events에 쓰는 actions, selector form, derived calculation과 expected update frequency를 표로 만들고 실제 source hash를 고정합니다.",
    invariants: "공개 audit에는 실제 사용자 profile·문구·storage key·endpoint가 없고 source에서 관찰한 subscription 형태와 실제 render cost measurement를 구분합니다.",
    edgeCases: "destructuring 후 일부 field만 쓰는 경우, action만 쓰는 component, conditional branch, parent rerender, StrictMode와 HMR을 포함합니다.",
    failureModes: "destructure가 JavaScript상 필요한 field만 읽는다는 이유로 store subscription도 좁다고 착각하거나 source만 보고 production rerender 횟수를 단정하면 잘못된 최적화를 합니다.",
    verification: "static consumer matrix를 만든 뒤 Profiler와 render reason counters로 representative actions별 affected components를 실제 fixture에서 측정합니다.",
    operations: "whole-store subscriber 수와 action별 render fan-out을 release version에 연결하고 source drift 시 matrix를 재생성합니다.",
    concepts: [c("subscription width", "한 store update가 component를 다시 확인하게 만드는 선택 state 범위입니다.", ["selector 결과로 결정됩니다.", "render 사용 field와 별개일 수 있습니다."]), c("whole-store read", "selector 없이 bound hook 전체 state를 반환받는 구독입니다.", ["모든 state change에 반응합니다.", "작은 store에서는 의도일 수 있습니다."]), c("consumer graph", "component가 어느 fields/actions/derived values를 읽고 어떤 command를 실행하는지 나타낸 구조입니다.", ["audit 근거입니다.", "측정 계획을 만듭니다."])],
    codeExamples: [node("react25-subscription-inventory", "원본 subscription width inventory", "React25SubscriptionInventory.mjs", "식별 값을 쓰지 않고 component별 whole/atomic read 수를 계산합니다.", String.raw`const reads = [
  { component: "TodoPage", whole: 1, atomic: 1 },
  { component: "MemoPage", whole: 1, atomic: 1 },
  { component: "Navbar", whole: 1, atomic: 0 },
];
const totals = reads.reduce((sum, row) => ({ whole: sum.whole + row.whole, atomic: sum.atomic + row.atomic }), { whole: 0, atomic: 0 });
for (const row of reads) console.log(row.component + "=whole:" + row.whole + ",atomic:" + row.atomic);
console.log("total=whole:" + totals.whole + ",atomic:" + totals.atomic);`, "TodoPage=whole:1,atomic:1\nMemoPage=whole:1,atomic:1\nNavbar=whole:1,atomic:0\ntotal=whole:3,atomic:2", ["local-react25-todo-page", "local-react25-memo-page", "local-react25-navbar", "local-react25-todo-store", "local-react25-memo-store", "local-react25-auth-store", "local-react25-doc-basics", "local-react25-doc-auth", "local-react25-archive-one", "local-react25-archive-two", "zustand-repository"] )],
  }),
  appliedTopic({
    id: "atomic-selector-object-is", title: "atomic selector와 Object.is notification을 이해합니다",
    lead: "한 component가 count 하나를 읽는다면 state => state.count처럼 primitive·stable reference를 직접 고르는 selector가 기본 경계입니다.",
    mechanism: "Zustand hook은 selector가 반환한 이전·다음 값을 비교해 relevant change를 결정합니다. 기본 atomic pick은 strict/reference equality에 잘 맞고 React external store는 snapshot 차이를 Object.is로 판단합니다.",
    workflow: "component render에 실제 필요한 최소 field를 primitive 또는 immutable stable object reference로 선택하고 action도 별도 selector로 가져옵니다.",
    invariants: "selector는 pure하고 same store snapshot에서 같은 결과를 반환하며 관련 없는 field update에는 결과 reference/value가 변하지 않습니다.",
    edgeCases: "NaN, -0, undefined, object mutation, selector closure prop, store replacement과 action identity를 포함합니다.",
    failureModes: "selector 내부에서 object를 mutate하거나 I/O를 실행하면 render 재시도에서 결과가 달라지고 새 object를 매번 만들면 모든 store update가 relevant처럼 보일 수 있습니다.",
    verification: "Object.is edge matrix, unrelated/relevant updates, same snapshot repeated calls와 selector purity를 test합니다.",
    operations: "selector notification rate와 component commit을 action reason에 연결하고 high-frequency field consumer budget을 별도로 둡니다.",
    concepts: [c("atomic selector", "state에서 primitive나 stable reference 하나를 직접 반환하는 좁은 selector입니다.", ["기본 equality에 적합합니다.", "구독 폭을 명확히 합니다."]), c("Object.is", "React external snapshot 변화 판정에 사용되는 동일성 비교입니다.", ["NaN은 자신과 같습니다.", "0과 -0은 다릅니다."]), c("relevant update", "selector 결과가 equality 기준에서 달라져 해당 subscriber가 다시 확인해야 하는 update입니다.", ["store 전체 변경과 다릅니다.", "측정할 수 있습니다."])],
    codeExamples: [node("react25-atomic-notifications", "atomic selector notification matrix", "React25AtomicNotifications.mjs", "whole state와 primitive selector의 notification 후보를 비교합니다.", String.raw`const states = [
  { count: 0, theme: "light" },
  { count: 0, theme: "dark" },
  { count: 1, theme: "dark" },
];
let whole = 0;
let atomic = 0;
for (let index = 1; index < states.length; index += 1) {
  if (!Object.is(states[index - 1], states[index])) whole += 1;
  if (!Object.is(states[index - 1].count, states[index].count)) atomic += 1;
}
console.log("transitions=" + (states.length - 1));
console.log("whole-changes=" + whole);
console.log("count-changes=" + atomic);`, "transitions=2\nwhole-changes=2\ncount-changes=1", ["zustand-repository", "zustand-create-api", "react-use-sync-external-store"])],
  }),
  appliedTopic({
    id: "selector-output-use-shallow", title: "object·array selector output과 useShallow를 정확히 제한합니다",
    lead: "여러 fields를 한 selector object로 묶으면 매 호출 새 reference가 생기므로 stable atomic picks 또는 useShallow의 top-level 비교를 의도적으로 선택합니다.",
    mechanism: "useShallow는 selector output의 top-level entries가 shallow equal이면 이전 결과를 재사용해 rerender를 줄입니다. nested mutation, expensive computation, semantic equality를 자동 해결하지 않습니다.",
    workflow: "fields를 독립 atomic selectors로 읽을지, 한 object/tuple과 useShallow로 묶을지 update correlation·readability·measurement로 결정합니다.",
    invariants: "selector output의 각 entry가 immutable/stable하고 shallow equality가 UI 의미와 일치하며 nested 값 변경은 새 nested reference로 드러납니다.",
    edgeCases: "property order, arrays, Maps/Sets, nested object, function/action, NaN와 dynamically computed keys를 포함합니다.",
    failureModes: "mutated nested object는 top-level reference가 같아 change를 숨기고 매번 새 nested value를 만들면 shallow comparison도 매번 달라집니다.",
    verification: "same entries/new container, one changed entry, nested immutable/mutated cases, action identity와 render count를 시험합니다.",
    operations: "selector allocation·comparison cost와 commit reduction을 함께 측정해 useShallow가 실제 latency를 개선할 때만 유지합니다.",
    concepts: [c("selector output identity", "selector가 반환하는 container 또는 primitive의 reference/value 동일성입니다.", ["notification 판단에 쓰입니다.", "same snapshot에서 안정적이어야 합니다."]), c("shallow equality", "object/array top-level entries만 비교하는 equality입니다.", ["deep equality가 아닙니다.", "immutable nested update가 필요합니다."]), c("tuple selector", "여러 값을 고정 순서 배열로 묶어 한 selector 결과로 반환하는 패턴입니다.", ["useShallow와 조합합니다.", "slot 의미를 문서화합니다."])],
    codeExamples: [node("react25-shallow-output", "selector container shallow equality", "React25ShallowOutput.mjs", "새 container라도 entries가 같을 때와 field가 변할 때를 비교합니다.", String.raw`const shallow = (left, right) => {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => Object.is(left[key], right[key]));
};
const action = () => "ok";
const previous = { count: 1, action };
const sameEntries = { count: 1, action };
const changed = { count: 2, action };
console.log("container-same=" + Object.is(previous, sameEntries));
console.log("shallow-same=" + shallow(previous, sameEntries));
console.log("shallow-changed=" + shallow(previous, changed));`, "container-same=false\nshallow-same=true\nshallow-changed=false", ["zustand-use-shallow-guide", "zustand-use-shallow-api", "react-use-sync-external-store"])],
  }),
  appliedTopic({
    id: "action-selector-stability", title: "actions도 selector로 읽고 identity 계약을 지킵니다",
    lead: "component가 addTodo 같은 action만 필요하면 state => state.addTodo로 선택해 data updates와 render dependency를 분리합니다.",
    mechanism: "state creator에서 한 번 만들어진 action function은 일반 merge updates 동안 stable reference를 유지합니다. replace, hydration merge 또는 action 재생성 패턴은 이 계약을 깨뜨릴 수 있습니다.",
    workflow: "read selectors와 command selectors를 나누고 event handler는 selected action을 호출하며 action 내부에서 최신 state를 functional set/get으로 읽습니다.",
    invariants: "data-only update는 action reference를 바꾸지 않고 component는 action closure에 old state를 capture하지 않으며 destructive replace 뒤에도 public action shape가 유지됩니다.",
    edgeCases: "action factory가 state에 따라 새 function을 만드는 경우, slice collision, HMR, reset/replace, middleware wrapper와 bound parameters를 포함합니다.",
    failureModes: "whole store에서 action을 destructure하면 unrelated data update에도 subscriber가 다시 확인되고 useCallback으로 unstable store action을 감추면 root cause가 남습니다.",
    verification: "before/after action reference, data-only update render count, reset/rehydrate와 command behavior를 시험합니다.",
    operations: "missing/changed action identity를 contract failure로 수집하고 public action shape에 compatibility test를 둡니다.",
    concepts: [c("action selector", "store state에서 command function 하나를 반환하는 selector입니다.", ["data subscription을 좁힙니다.", "function identity를 검증합니다."]), c("stable action", "store lifetime 동안 같은 command가 같은 function reference를 유지하는 계약입니다.", ["default creator에 유리합니다.", "replace를 주의합니다."]), c("command closure", "event 입력만 capture하고 current store state는 action 실행 시 읽는 handler 구조입니다.", ["stale state를 피합니다.", "test하기 쉽습니다."])],
  }),
  appliedTopic({
    id: "derived-selector-computation", title: "derived selector의 계산 비용과 identity를 관리합니다",
    lead: "remaining count처럼 cheap primitive는 inline selector로 계산할 수 있지만 sort/filter 결과처럼 새 collection은 cache·input identity·ownership을 설계해야 합니다.",
    mechanism: "selector는 store가 update될 때와 React render 과정에서 재평가될 수 있습니다. output equality가 같아도 expensive calculation 비용은 이미 지불될 수 있으므로 normalization·memoization·component memo를 구분합니다.",
    workflow: "계산 complexity와 input change frequency를 측정하고 primitive derived value, stable entity reference, memoized projection 중 최소한의 전략을 선택합니다.",
    invariants: "derived selector는 source state와 일치하고 cache key가 모든 semantic inputs를 포함하며 mutable input으로 cache가 오염되지 않습니다.",
    edgeCases: "large list, locale/timezone sort, filter object identity, multiple consumers, parameterized selector와 cache growth를 포함합니다.",
    failureModes: "모든 derived 값을 store field로 복제하면 동기화 bug가 생기고 무제한 per-ID memo cache는 memory leak가 됩니다.",
    verification: "correctness property, same inputs repeat output, one input changed invalidation, compute count와 memory bound를 시험합니다.",
    operations: "selector compute p95, cache hit/miss·size와 component commit을 함께 관찰하고 budget 초과 시 server query 또는 normalization을 검토합니다.",
    concepts: [c("projection", "authoritative state를 UI가 쓰는 shape로 pure하게 변환한 값입니다.", ["저장과 구분합니다.", "input contract를 갖습니다."]), c("memoization", "같은 semantic inputs에 이전 계산 결과를 재사용하는 최적화입니다.", ["correctness가 먼저입니다.", "cache bound를 둡니다."]), c("parameterized selector", "component prop 같은 인자를 받아 특정 entity나 view를 고르는 selector factory/pattern입니다.", ["closure identity를 관리합니다.", "cache scope를 제한합니다."])],
  }),
  appliedTopic({
    id: "slices-pattern-composition", title: "slice pattern으로 큰 store의 ownership을 나눕니다",
    lead: "slice는 별도 store 여러 개가 아니라 하나의 bounded store state creator를 domain별 함수로 분리해 조합하는 modularity pattern입니다.",
    mechanism: "각 slice creator가 동일 set/get/api를 받아 자신의 state와 actions를 반환하고 root creator가 spread로 합칩니다. middleware는 공식 안내대로 individual slice가 아니라 combined store에 적용합니다.",
    workflow: "domain ownership, public fields/actions, cross-slice dependency와 naming namespace를 정하고 slice creators를 pure composition boundary로 유지합니다.",
    invariants: "slice keys가 충돌하지 않고 각 field의 write owner가 하나이며 root store의 middleware와 type mutators가 한 번만 적용됩니다.",
    edgeCases: "동일 action name, circular get dependency, reset all, cross-slice transaction, lazy feature, middleware order와 TypeScript StateCreator types를 포함합니다.",
    failureModes: "slice별 persist/devtools를 중첩하면 예상하지 못한 behavior/type이 생기고 spread 충돌은 앞 slice field/action을 조용히 덮습니다.",
    verification: "key collision static/runtime guard, slice unit tests, combined state shape, middleware once와 cross-slice behavior를 시험합니다.",
    operations: "root/slice schema version과 action namespace를 release inventory에 남기고 collision을 build failure로 만듭니다.",
    concepts: [c("slice creator", "root store의 set/get/api를 공유하며 한 domain의 state와 actions를 만드는 함수입니다.", ["별도 store가 아닙니다.", "독립 test가 가능합니다."]), c("bounded store", "여러 slices가 결합되어 하나의 subscription·API boundary를 이루는 store입니다.", ["selector로 경계를 좁힙니다.", "middleware는 root에 둡니다."]), c("key collision", "slice composition에서 같은 property 이름이 뒤 spread에 의해 덮이는 오류입니다.", ["namespace/guard로 막습니다.", "action에도 적용됩니다."])],
    codeExamples: [node("react25-slice-collision", "slice key collision guard", "React25SliceCollision.mjs", "root composition 전에 duplicate keys를 찾아 실패시킵니다.", String.raw`const profileSlice = { profile: null, reset: () => "profile" };
const tasksSlice = { tasks: [], reset: () => "tasks" };
const collisions = Object.keys(profileSlice).filter((key) => Object.hasOwn(tasksSlice, key));
const compose = (...slices) => collisions.length ? null : Object.assign({}, ...slices);
const store = compose(profileSlice, tasksSlice);
console.log("collisions=" + collisions.join(","));
console.log("composed=" + Boolean(store));
console.log("policy=" + (collisions.length ? "rename-before-compose" : "safe"));`, "collisions=reset\ncomposed=false\npolicy=rename-before-compose", ["zustand-slices-guide", "zustand-auto-selectors-guide", "zustand-create-store-api"])],
  }),
  appliedTopic({
    id: "cross-slice-actions-atomicity", title: "cross-slice action을 invariant 중심으로 설계합니다",
    lead: "한 domain action이 다른 slice state를 바꿀 수 있지만 get().actionA(); get().actionB()의 중간 상태가 observer에게 보이는지 판단해야 합니다.",
    mechanism: "모든 slices는 같은 root state를 공유하므로 하나의 set callback에서 여러 slice fields를 함께 반환하면 단일 commit으로 invariant를 지킬 수 있습니다. actions 연쇄 호출은 여러 commit이 될 수 있습니다.",
    workflow: "cross-domain use case를 orchestration action으로 정의하고 before/current validation 후 필요한 fields를 한 transition에서 계산합니다.",
    invariants: "entity move처럼 count 합이 보존되어야 하는 command는 어느 subscriber도 깨진 중간 합을 보지 않고 error는 partial commit을 남기지 않습니다.",
    edgeCases: "missing entity, duplicate command, nested action call, subscription reentrancy, async boundary와 server transaction mismatch를 포함합니다.",
    failureModes: "두 actions 중 두 번째가 실패하면 첫 번째 commit만 남고 UI가 business invariant를 위반할 수 있습니다.",
    verification: "notification마다 invariant assertion, injected failure between steps, duplicate/no-op와 final action result를 시험합니다.",
    operations: "cross-slice command reason, commit count와 invariant failure를 추적하고 recovery command와 rollback을 준비합니다.",
    concepts: [c("orchestration action", "여러 slice state를 한 use case invariant 아래 조정하는 root command입니다.", ["ownership을 문서화합니다.", "한 set을 고려합니다."]), c("intermediate state", "여러 commit 사이 observer가 볼 수 있는 아직 business invariant가 완성되지 않은 state입니다.", ["허용 여부를 정합니다.", "notification test로 찾습니다."]), c("commit count", "한 command가 store state를 실제로 몇 번 변경·통지하는지 나타낸 값입니다.", ["atomicity 근거입니다.", "render cost에도 영향합니다."])],
    codeExamples: [node("react25-cross-slice-atomic", "cross-slice 단일 commit", "React25CrossSliceAtomic.mjs", "두 counters의 보존 합과 notification 수를 검증합니다.", String.raw`let state = { inbox: 2, archive: 1 };
let notifications = 0;
const moveOne = () => {
  if (state.inbox === 0) return false;
  state = { ...state, inbox: state.inbox - 1, archive: state.archive + 1 };
  notifications += 1;
  return true;
};
const beforeTotal = state.inbox + state.archive;
const moved = moveOne();
console.log("moved=" + moved + "|notifications=" + notifications);
console.log("inbox=" + state.inbox + "|archive=" + state.archive);
console.log("total-preserved=" + (beforeTotal === state.inbox + state.archive));`, "moved=true|notifications=1\ninbox=1|archive=2\ntotal-preserved=true", ["zustand-slices-guide", "zustand-create-api", "react-choosing-state"])],
  }),
  appliedTopic({
    id: "subscribe-with-selector", title: "subscribeWithSelector로 non-React 관찰 범위를 좁힙니다",
    lead: "DOM adapter, telemetry, cache coordinator처럼 React 밖에서 특정 slice 변화만 필요한 경우 selector-aware subscription을 사용하고 lifecycle을 소유합니다.",
    mechanism: "subscribeWithSelector middleware는 subscribe(selector, callback, options) signature를 제공하며 callback에는 current/previous selected value가 전달되고 equalityFn·fireImmediately를 선택할 수 있습니다.",
    workflow: "관찰 목적과 최소 selector, equality, initial fire 의미, cleanup owner, reentrancy policy를 정하고 combined store root에 middleware를 적용합니다.",
    invariants: "관련 없는 update는 callback을 호출하지 않고 initial callback 중복이 없으며 unsubscribe 뒤 side effect가 발생하지 않습니다.",
    edgeCases: "object selector, shallow/custom equality, fireImmediately, synchronous set, listener exception, StrictMode double setup과 cross-tab adapter를 포함합니다.",
    failureModes: "selector와 callback 인자 순서를 혼동하거나 equality가 semantic change를 숨기면 adapter가 stale해지고 cleanup 누락은 duplicate effect를 만듭니다.",
    verification: "previous/current pairs, unrelated update, equality boundary, immediate fire, unsubscribe와 reentrant set을 시험합니다.",
    operations: "listener count·callback rate·duration과 failure를 selector ID에 연결하되 selected 민감 값은 log하지 않습니다.",
    concepts: [c("selector subscription", "React 밖에서 선택 결과가 바뀔 때만 callback을 실행하는 구독입니다.", ["middleware가 signature를 확장합니다.", "cleanup이 필수입니다."]), c("fireImmediately", "등록 시 현재 selected value로 callback을 한 번 즉시 호출하는 option입니다.", ["initial sync에 씁니다.", "중복 side effect를 주의합니다."]), c("equality function", "이전·다음 selector 결과가 의미상 같은지 결정하는 함수입니다.", ["equivalence 성질을 지켜야 합니다.", "비용을 측정합니다."])],
    codeExamples: [node("react25-selector-subscribe", "selector-aware subscription", "React25SelectorSubscribe.mjs", "관련 field 변화와 cleanup만 통지하는 모델을 검증합니다.", String.raw`let state = { count: 0, theme: "light" };
const listeners = new Set();
const subscribe = (selector, callback) => {
  let previous = selector(state);
  const entry = (next) => { const value = selector(next); if (!Object.is(value, previous)) { const old = previous; previous = value; callback(value, old); } };
  listeners.add(entry); return () => listeners.delete(entry);
};
const set = (patch) => { state = { ...state, ...patch }; for (const listener of [...listeners]) listener(state); };
const seen = [];
const off = subscribe((value) => value.count, (value, old) => seen.push(old + "->" + value));
set({ theme: "dark" }); set({ count: 1 }); off(); set({ count: 2 });
console.log("seen=" + seen.join(","));
console.log("listeners=" + listeners.size);
console.log("final-count=" + state.count);`, "seen=0->1\nlisteners=0\nfinal-count=2", ["zustand-subscribe-selector", "zustand-repository", "react-use-sync-external-store"])],
  }),
  appliedTopic({
    id: "store-instance-context-ssr", title: "store instance를 Context·SSR request 경계에 배치합니다",
    lead: "module singleton이 적합하지 않은 reusable component, multi-tenant widget와 SSR에서는 createStore로 instance를 만들고 Context가 API를 전달하게 합니다.",
    mechanism: "vanilla createStore는 hook이 아닌 StoreApi를 만들고 React useStore(store, selector)가 해당 instance를 구독합니다. server에서는 request마다 instance와 initial snapshot을 만들고 client hydration과 동일 데이터를 전달합니다.",
    workflow: "instance owner를 request/page/widget/test로 정하고 Provider가 stable store reference를 보존하며 consumer custom hook은 missing Provider를 명확히 실패시킵니다.",
    invariants: "서로 다른 requests/users/widgets가 mutable state를 공유하지 않고 server snapshot과 first client snapshot이 같으며 Provider rerender가 store를 재생성하지 않습니다.",
    edgeCases: "streaming SSR, hydration, route reuse, nested Providers, multiple roots, test parallelism와 server component boundary를 포함합니다.",
    failureModes: "server module singleton은 cross-request data leak를 만들 수 있고 Provider body에서 매 render createStore하면 state와 listeners가 유실됩니다.",
    verification: "two-request canary, two-widget isolation, provider rerender persistence, missing Provider와 hydration parity를 시험합니다.",
    operations: "store instance lifecycle, request correlation과 hydration mismatch를 privacy-safe하게 관찰하고 singleton fallback을 금지합니다.",
    concepts: [c("vanilla store", "React hook과 분리된 getState·setState·subscribe API instance입니다.", ["createStore로 만듭니다.", "useStore로 연결합니다."]), c("instance scope", "하나의 mutable store를 공유해도 되는 user/request/widget/test 수명 경계입니다.", ["owner가 생성·폐기합니다.", "global을 기본값으로 두지 않습니다."]), c("hydration parity", "server HTML을 만든 snapshot과 client 첫 snapshot이 같은 사용자 출력 상태를 만드는 조건입니다.", ["serialize/validate합니다.", "mismatch를 bug로 봅니다."])],
    codeExamples: [node("react25-store-isolation", "request별 store instance isolation", "React25StoreIsolation.mjs", "동일 factory에서 만든 두 stores가 state와 listeners를 공유하지 않음을 검증합니다.", String.raw`const createStore = (initial) => {
  let state = { ...initial };
  const listeners = new Set();
  return { get: () => state, set: (patch) => { state = { ...state, ...patch }; for (const listener of listeners) listener(); }, listeners };
};
const first = createStore({ count: 0 });
const second = createStore({ count: 0 });
first.set({ count: 1 });
console.log("first=" + first.get().count + "|second=" + second.get().count);
console.log("same-state=" + (first.get() === second.get()));
console.log("listener-total=" + (first.listeners.size + second.listeners.size));`, "first=1|second=0\nsame-state=false\nlistener-total=0", ["zustand-create-store-api", "zustand-use-store-api", "react-use-sync-external-store", "react-strict-mode"])],
  }),
  appliedTopic({
    id: "render-budget-profiler", title: "selector 최적화를 Profiler render budget로 검증합니다",
    lead: "whole-store를 selector로 바꿨다는 코드 모양이 아니라 representative user actions에서 render·commit·interaction 결과가 실제 개선되는지 측정합니다.",
    mechanism: "Profiler actualDuration/baseDuration, component render counters와 browser interaction timing을 action reason과 연결합니다. 일반 production build에서는 profiling이 비활성화될 수 있으므로 React 공식 안내의 profiling-enabled build 여부를 기록하고 development StrictMode의 추가 호출을 production evidence와 구분합니다.",
    workflow: "baseline→atomic selector→useShallow 또는 slice split을 한 단계씩 적용하고 correctness·accessibility parity와 p50/p95 latency를 함께 비교합니다.",
    invariants: "최적화 전후 사용자 결과와 server authorization은 같고 render count를 줄이기 위해 stale data를 허용하지 않으며 측정 build·device·workload가 기록됩니다.",
    edgeCases: "1/1000 entities, rapid typing, low-end device, hidden tab, concurrent render, dev/prod build와 cache warm/cold를 포함합니다.",
    failureModes: "render 수만 줄이고 selector compute·equality cost를 늘리거나 synthetic counter를 실제 DOM interaction latency로 과장할 수 있습니다.",
    verification: "same workload에서 behavior assertions, render/commit budgets, selector compute count, accessibility와 memory/listener checks를 실행합니다.",
    operations: "action별 render fan-out·actualDuration·interaction latency를 release dashboard에 연결하고 regression threshold와 rollback flag를 둡니다.",
    concepts: [c("render fan-out", "한 store action 뒤 다시 render를 시도한 component 수와 범위입니다.", ["commit과 구분합니다.", "action reason에 연결합니다."]), c("actualDuration", "Profiler가 해당 update render에 소비된 시간을 보고하는 값입니다.", ["환경과 build를 기록합니다.", "user latency와 함께 봅니다."]), c("performance qualification", "정확성 parity 아래 representative workload가 정한 latency/render budget을 통과하는 절차입니다.", ["baseline이 필요합니다.", "canary에서 재확인합니다."])],
    codeExamples: [node("react25-render-budget", "whole·atomic·slice render budget", "React25RenderBudget.mjs", "synthetic fan-out 후보를 동일 budget으로 분류합니다.", String.raw`const candidates = [
  { name: "whole-store", renders: 96 },
  { name: "atomic-selector", renders: 28 },
  { name: "slice-selector", renders: 14 },
];
const budget = 30;
for (const item of candidates) console.log(item.name + "=" + item.renders + "|pass=" + (item.renders <= budget));
console.log("behavior-parity=required");`, "whole-store=96|pass=false\natomic-selector=28|pass=true\nslice-selector=14|pass=true\nbehavior-parity=required", ["local-react25-todo-page", "local-react25-memo-page", "local-react25-navbar", "react-profiler", "react-use-sync-external-store"])],
  }),
  appliedTopic({
    id: "selector-tests-equality-contract", title: "selector·equality·slice 계약을 독립적으로 test합니다",
    lead: "component test만으로 우연히 가려질 수 있는 selector purity, reference, equality equivalence와 listener cleanup을 작은 contract suite에 고정합니다.",
    mechanism: "selector는 state fixtures에 pure function으로 실행하고 equality는 reflexive·symmetric·transitive cases를 검사하며 store tests는 notification pairs와 unsubscribe를 확인합니다.",
    workflow: "source state matrix, unrelated/relevant mutations, same-value/no-op, slice collision, previous/current callback과 instance isolation을 test layers로 나눕니다.",
    invariants: "selector result가 hidden mutable cache에 오염되지 않고 equality가 semantic change를 숨기지 않으며 tests 간 store/listener residue가 없습니다.",
    edgeCases: "NaN/-0, nested mutation, reordered keys, duplicate actions, StrictMode cycle, parallel workers와 randomized command sequence를 포함합니다.",
    failureModes: "render count snapshot만 assert하면 React upgrade에 brittle하고 custom equality가 항상 true인 결함은 UI stale을 조용히 만듭니다.",
    verification: "pure selector unit, property-based equality, store notification, React behavior와 browser performance tests를 CI stages로 실행합니다.",
    operations: "flaky seed, selector ID, listener delta와 version matrix를 test artifact에 남기고 failure를 render snapshot 업데이트로 덮지 않습니다.",
    concepts: [c("equality equivalence", "같음 판정이 자기반사·대칭·추이 성질을 지키는 조건입니다.", ["custom comparator에 필요합니다.", "semantic contract를 반영합니다."]), c("selector contract test", "state 입력에 대한 selector output과 identity를 React 없이 검증하는 test입니다.", ["빠르고 결정적입니다.", "component test를 보완합니다."]), c("notification pair", "selector subscription callback이 받는 current와 previous selected value의 조합입니다.", ["순서를 검증합니다.", "initial fire를 구분합니다."])],
  }),
  appliedTopic({
    id: "incremental-migration-operations", title: "whole-store consumers를 단계적으로 selector·slice로 이동합니다",
    lead: "원본 pages를 한 번에 재작성하지 않고 static inventory와 Profiler baseline을 고정한 뒤 가장 빈번하고 좁은 consumer부터 이동합니다.",
    mechanism: "atomic read/action selectors는 store shape를 바꾸지 않고 subscription만 좁히므로 첫 단계로 안전합니다. slice extraction은 public selector/action adapter를 유지하며 내부 ownership을 바꿉니다.",
    workflow: "inventory→baseline→atomic selectors→derived output identity→slice collision guard→cross-slice action→old adapter removal 순으로 canary와 rollback을 둡니다.",
    invariants: "각 단계 user behavior와 state transition은 같고 partial rollout에서도 old/new components가 같은 store contract를 사용하며 dual subscription이 side effect를 중복하지 않습니다.",
    edgeCases: "old tab, HMR, persisted state, mixed bundle, route lazy load, cross-slice command와 rollback을 포함합니다.",
    failureModes: "selectors를 과도하게 생성해 readability와 compute cost를 악화시키거나 slice 분리가 business transaction을 여러 commit으로 쪼갤 수 있습니다.",
    verification: "consumer matrix diff, behavior parity, render budget, collision/type tests, canary error와 rollback rehearsal를 release gate로 둡니다.",
    operations: "whole-store subscriber count, render p95, listener count, slice schema version과 rollback status를 dashboard/runbook에 연결합니다.",
    concepts: [c("selector migration", "store state shape는 유지하면서 consumers의 subscription output을 좁히는 변경입니다.", ["작고 reversible합니다.", "baseline과 비교합니다."]), c("compatibility adapter", "old consumer API를 유지하면서 새 slice/selector 구현으로 연결하는 기간 제한 layer입니다.", ["제거 날짜를 둡니다.", "중복 effect를 막습니다."]), c("cutover gate", "다음 migration 단계로 넘어가기 위한 correctness·performance·cleanup 기준입니다.", ["증거 owner가 있습니다.", "rollback 조건도 포함합니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-react25-todo-page", repository: "local learning source", path: "my-app02/src/pages/TodoPage.jsx", usedFor: ["whole todo-store subscription", "atomic auth selector comparison", "derived remaining count"], evidence: "2026-07-14 read-only sanitized audit: 75 lines, 3,254 bytes, SHA-256 E505E755118DC9CFDC7929C063C9F0F9441725D5598DE0B6861A3BED5C7F16C0. UI values는 복사하지 않았습니다." },
  { id: "local-react25-memo-page", repository: "local learning source", path: "my-app02/src/pages/MemoPage.jsx", usedFor: ["whole memo-store subscription", "local edit state", "atomic auth selector comparison"], evidence: "2026-07-14 read-only sanitized audit: 93 lines, 4,354 bytes, SHA-256 F346E532F8546F54BAFB558414CF6A39872EA493807AFF1CAAB54B93227D32D5. memo content와 visible strings는 복사하지 않았습니다." },
  { id: "local-react25-navbar", repository: "local learning source", path: "my-app02/src/components/Navbar.jsx", usedFor: ["whole auth-store subscription", "action selector migration candidate"], evidence: "2026-07-14 read-only sanitized audit: 32 lines, 1,439 bytes, SHA-256 D29B5E26C4D63428A85C06076EA9A0C15B651DBBEEAB0679817D57E6660C5C38. route와 visible strings는 복사하지 않았습니다." },
  { id: "local-react25-todo-store", repository: "local learning source", path: "my-app02/src/store/useTodoStore.jsx", usedFor: ["todo state/action shape", "selector candidates"], evidence: "2026-07-14 read-only sanitized audit: 34 lines, 1,104 bytes, SHA-256 AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9. storage value는 복사하지 않았습니다." },
  { id: "local-react25-memo-store", repository: "local learning source", path: "my-app02/src/store/useMemoStroe.jsx", usedFor: ["memo state/action shape", "selector candidates"], evidence: "2026-07-14 read-only sanitized audit: 36 lines, 1,363 bytes, SHA-256 3CE0CDFAEEC21A71EB551FFC14D0206BB1BEE9941FA09FC45F085EF815462078. filename typo는 provenance로만 보존합니다." },
  { id: "local-react25-auth-store", repository: "local learning source", path: "my-app02/src/store/useAuthStore.jsx", usedFor: ["auth state/action selector graph", "whole-store persistence caveat"], evidence: "2026-07-14 read-only sanitized audit: 33 lines, 1,737 bytes, SHA-256 DA8F4C6AB40D340827A8205484AD98EC3693D4BF2073B922D5521E1734FE9653. 실제 profile 값과 storage name은 복사하지 않았습니다." },
  { id: "local-react25-doc-basics", repository: "local learning source", path: "REACT/docs/react/10-zustand-basics.md", usedFor: ["whole-store/selector lesson audit", "store progression"], evidence: "2026-07-14 read-only sanitized audit: 134 lines, 6,356 bytes, SHA-256 36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D. live references와 embedded values는 복사하지 않았습니다." },
  { id: "local-react25-doc-auth", repository: "local learning source", path: "REACT/docs/react/11-zustand-auth-crud.md", usedFor: ["auth/CRUD consumer progression", "selector and persistence boundary audit"], evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. account-like flow와 live paths는 복사하지 않았습니다." },
  { id: "local-react25-archive-one", repository: "local learning source", path: "REACT/docs/archive/notion-raw/react-zustand-1.md", usedFor: ["historical selector explanation", "contract drift audit"], evidence: "2026-07-14 read-only sanitized audit: 58 lines, 3,215 bytes, SHA-256 A8237B9635D36C35B116302A9BFB69A8E2AB15D2623B0A1DE475509D167FEFE1. raw values는 인용하지 않았습니다." },
  { id: "local-react25-archive-two", repository: "local learning source", path: "REACT/docs/archive/notion-raw/react-zustand-2.md", usedFor: ["historical auth/CRUD structure", "current selector/slice extension"], evidence: "2026-07-14 read-only sanitized audit: 87 lines, 4,581 bytes, SHA-256 D7698A8363617E766850ACBB1D9066420BCF8246C8670D56FD9AD0411B15FBA8. raw account-like strings는 인용하지 않았습니다." },
  { id: "zustand-repository", repository: "pmndrs/zustand official repository", path: "README.md", publicUrl: "https://github.com/pmndrs/zustand", usedFor: ["whole-store update caveat", "atomic selector equality", "useShallow and subscribeWithSelector overview"], evidence: "Zustand 공식 repository README의 selecting state와 external API 계약입니다." },
  { id: "zustand-create-api", repository: "Zustand official documentation", path: "reference/apis/create", publicUrl: "https://zustand.docs.pmnd.rs/reference/apis/create", usedFor: ["bound store selector API", "attached store methods"], evidence: "Zustand 공식 create API입니다." },
  { id: "zustand-use-shallow-guide", repository: "Zustand official documentation", path: "learn/guides/prevent-rerenders-with-use-shallow", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/prevent-rerenders-with-use-shallow", usedFor: ["selector output rerender prevention", "shallow comparison use case"], evidence: "Zustand 공식 useShallow learning guide입니다." },
  { id: "zustand-use-shallow-api", repository: "Zustand official documentation", path: "reference/hooks/use-shallow", publicUrl: "https://zustand.docs.pmnd.rs/reference/hooks/use-shallow", usedFor: ["useShallow signature and return behavior"], evidence: "Zustand 공식 useShallow hook reference입니다." },
  { id: "zustand-slices-guide", repository: "Zustand official documentation", path: "learn/guides/slices-pattern", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/slices-pattern", usedFor: ["slice composition", "cross-slice actions", "middleware-at-root guidance"], evidence: "Zustand 공식 slices pattern guide입니다." },
  { id: "zustand-auto-selectors-guide", repository: "Zustand official documentation", path: "learn/guides/auto-generating-selectors", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/auto-generating-selectors", usedFor: ["generated selector API tradeoffs", "slice public surface"], evidence: "Zustand 공식 auto-generating selectors guide입니다." },
  { id: "zustand-subscribe-selector", repository: "Zustand official documentation", path: "reference/middlewares/subscribe-with-selector", publicUrl: "https://zustand.docs.pmnd.rs/reference/middlewares/subscribe-with-selector", usedFor: ["selector subscription signature", "equalityFn and fireImmediately"], evidence: "Zustand 공식 subscribeWithSelector middleware reference입니다." },
  { id: "zustand-create-store-api", repository: "Zustand official documentation", path: "reference/apis/create-store", publicUrl: "https://zustand.docs.pmnd.rs/reference/apis/create-store", usedFor: ["vanilla store creation", "instance-scoped state"], evidence: "Zustand 공식 createStore API입니다." },
  { id: "zustand-use-store-api", repository: "Zustand official documentation", path: "reference/hooks/use-store", publicUrl: "https://zustand.docs.pmnd.rs/reference/hooks/use-store", usedFor: ["React subscription to vanilla store", "dynamic store instances"], evidence: "Zustand 공식 useStore hook reference입니다." },
  { id: "react-use-sync-external-store", repository: "React official API", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["snapshot equality", "subscribe cleanup", "SSR snapshot parity"], evidence: "React 공식 external-store subscription contract입니다." },
  { id: "react-profiler", repository: "React official API", path: "reference/react/Profiler", publicUrl: "https://react.dev/reference/react/Profiler", usedFor: ["render and commit measurement"], evidence: "React 공식 Profiler API입니다." },
  { id: "react-strict-mode", repository: "React official API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development lifecycle stress checks", "cleanup verification"], evidence: "React 공식 StrictMode API입니다." },
  { id: "react-choosing-state", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["derived-state ownership", "normalized state design"], evidence: "React 공식 state structure guide입니다." },
];

const session = createExpertSession({
    inventoryId: "react-25-zustand-store-actions", slug: "react-25-zustand-selector-slices",
  courseId: "react", moduleId: "react-state-management", order: 5,
  title: "Zustand selector·slice와 render 경계", subtitle: "원본 whole-store consumers를 atomic selector, shallow output, slice ownership, selector subscription과 measurable render budget으로 단계적으로 전환합니다.",
  level: "고급", estimatedMinutes: 125,
  coreQuestion: "큰 Zustand store에서 component별 최소 state만 정확히 구독하면서 slice modularity, cross-domain invariant, SSR isolation과 성능 근거를 어떻게 함께 지킬까요?",
  summary: "my-app02 TodoPage·MemoPage·Navbar와 todo·memo·auth stores, REACT 두 문서와 두 archive files를 read-only·sanitized 감사했습니다. 원본에서 auth atomic selectors와 todo/memo/Navbar whole-store reads가 함께 존재함을 source observation으로 기록하되 실제 render 횟수로 과장하지 않습니다. atomic selector와 Object.is, useShallow의 top-level 한계, action/derived selectors, slice composition과 collision, cross-slice atomic action, subscribeWithSelector, createStore/useStore instance scope, SSR parity, Profiler budget, equality contract tests와 incremental migration을 공식 Zustand·React 계약 및 일곱 deterministic Node models로 완성합니다.",
  objectives: ["원본 component-store subscription graph를 hash evidence로 만든다.", "whole-store와 atomic selector notification을 구분한다.", "object/array selector output과 useShallow 한계를 검증한다.", "action과 derived selector의 identity·compute 계약을 설계한다.", "slices를 key ownership과 root middleware로 조합한다.", "cross-slice action의 intermediate state를 제거한다.", "subscribeWithSelector lifecycle과 equality를 검증한다.", "request/widget별 store instance와 hydration parity를 지킨다.", "Profiler behavior parity 아래 render budget을 qualification한다.", "selector-first migration을 canary와 rollback으로 운영한다."],
  prerequisites: [{ title: "Zustand store·action과 immutable update", reason: "set/get, structural sharing과 subscription API를 알아야 selector equality와 slice boundary를 정확히 설계할 수 있습니다.", sessionSlug: "react-24-zustand-store-actions" }],
  keywords: ["Zustand", "selector", "Object.is", "useShallow", "slice pattern", "subscribeWithSelector", "createStore", "useStore", "Profiler", "SSR", "render budget", "equality"],
  topics,
  lab: {
    title: "원본 whole-store consumers를 atomic selector·slice architecture로 qualification하기",
    scenario: "원본 files는 변경하지 않고 synthetic private-free fixtures에서 TodoPage·MemoPage·Navbar의 subscription shape를 재현해 correctness와 render fan-out을 단계별로 비교합니다.",
    setup: ["Node.js 20 이상", "React 19.2 compatible development 및 profiling-enabled production fixtures", "Zustand 5.0.13 local matrix와 current patch", "Profiler/render reason counters", "SSR two-request harness", "원본 10 files read-only", "PII·credential·real endpoint 없음"],
    steps: ["10 source hashes와 component-field-action selector graph를 재검증합니다.", "whole-store baseline에서 representative add/update/logout-like synthetic actions별 render fan-out을 측정합니다.", "state와 actions를 atomic selectors로 이동하고 behavior·reference parity를 확인합니다.", "object/tuple output의 Object.is·shallow·nested cases를 시험합니다.", "derived selectors의 compute count와 cache bound를 측정합니다.", "todo·memo·auth-like domains를 collision-safe slices로 조합하고 middleware를 root에 한 번 적용합니다.", "cross-slice invariant action을 한 commit으로 만들고 notification마다 invariant를 검사합니다.", "subscribeWithSelector의 previous/current, equality, fireImmediately와 cleanup을 검증합니다.", "createStore/useStore로 two-widget·two-request isolation과 hydration parity를 확인합니다.", "production Profiler·interaction budgets, tests, canary와 rollback gate를 통과시킵니다."],
    expectedResult: ["관련 없는 state update는 atomic selector consumer의 selected output을 바꾸지 않습니다.", "shallow equality가 허용된 top-level 범위에서만 사용되고 nested changes는 immutable reference로 드러납니다.", "slice collision이 build/test에서 차단되고 cross-slice command는 한 commit으로 invariant를 보존합니다.", "listeners와 store instances가 cleanup 뒤 baseline으로 돌아가고 requests/widgets가 격리됩니다.", "최적화 전후 behavior·accessibility parity와 production render/latency evidence가 남습니다."],
    cleanup: ["temporary stores, listeners, React roots, SSR servers, Profiler traces와 counters를 제거합니다.", "synthetic states, caches와 generated fixtures를 폐기합니다.", "feature flags와 verbose instrumentation을 원복합니다.", "원본 10 files의 hashes와 unchanged 상태를 확인합니다."],
    extensions: ["parameterized selector cache를 bounded LRU로 qualification합니다.", "100k normalized entities와 array projection을 비교합니다.", "React Compiler on/off에서 selector/memo evidence를 비교합니다.", "다음 persist/auth 세션의 hydration gate와 selector instance scope를 통합합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node models를 실행하고 actual Zustand/React fixture의 selector notifications와 한 항목씩 대응시키세요.", requirements: ["stdout 완전 일치", "source inventory", "Object.is matrix", "shallow output", "collision guard", "cross-slice commit", "selector subscription cleanup", "instance isolation", "render model 범위"], hints: ["synthetic render count를 실제 Profiler 결과로 표현하지 마세요."], expectedOutcome: "store update에서 selector result equality, subscriber check, React render/commit까지 경계를 설명합니다.", solutionOutline: ["audit→select→compare→compose→subscribe→isolate→measure 순서입니다."] },
    { difficulty: "응용", prompt: "원본 세 consumers를 atomic selector와 collision-safe slices로 재설계하세요.", requirements: ["read/action selectors", "useShallow decision", "derived compute budget", "root middleware", "atomic cross-slice action", "cleanup", "SSR instance", "Profiler parity"], hints: ["field 수보다 change frequency와 consumer audience를 기준으로 slice를 나누세요."], expectedOutcome: "관련 update만 render되고 domain invariants와 lifecycle이 보존되는 architecture가 완성됩니다.", solutionOutline: ["graph→baseline→atomic migration→slice ownership→integration→qualification 순서입니다."] },
    { difficulty: "설계", prompt: "팀의 Zustand selector·slice 성능 표준을 작성하세요.", requirements: ["selector purity", "equality policy", "action identity", "slice collision", "cross-slice atomicity", "instance scope", "SSR", "measurement", "migration/rollback"], hints: ["render 수 하나가 아니라 user latency·correctness·cleanup evidence를 모두 요구하세요."], expectedOutcome: "library upgrade와 store growth에도 감사 가능한 subscription·modularity 표준이 됩니다.", solutionOutline: ["inventory→contract→compose→measure→release→recover 순서입니다."] },
  ],
  nextSessions: ["react-26-zustand-persist-auth"], sources,
  sourceCoverage: { filesRead: 10, filesUsed: 10, uncoveredNotes: ["TodoPage·MemoPage·Navbar와 세 stores, REACT 두 current docs와 두 archive docs를 read-only·sanitized 감사했습니다.", "원본 auth selectors와 todo/memo whole-store reads를 source 형태로 확인했지만 실제 production render count를 측정했다고 과장하지 않습니다.", "실제 profile/content/visible strings, routes, storage names와 live references는 공개 examples에 복사하지 않았습니다.", "useMemoStroe filename typo는 provenance에만 보존하고 API 권장 철자로 일반화하지 않습니다.", "Node models는 Zustand selector middleware, React scheduler/DOM/Profiler, SSR/hydration과 browser behavior를 대체하지 않아 lab fixture가 필요합니다.", "slice 분리는 separate stores와 동일하지 않으며 middleware는 공식 guide에 따라 combined root에 적용하는 계약으로 설명했습니다."] },
});

export default session;
