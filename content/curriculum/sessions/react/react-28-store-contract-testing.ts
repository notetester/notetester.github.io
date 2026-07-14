import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const scaffoldRefs = ["local-app2-test", "local-app2-setup", "local-app2-package", "local-app3-test", "local-app3-setup", "local-app3-package"];

const topics = [
  appliedTopic({
    id: "source-test-capability-audit", title: "원본 test scaffold를 실제 feature coverage와 분리해 감사합니다",
    lead: "App.test.js와 setupTests.js가 존재한다는 사실을 Todo·Memo·Auth·Guestbook이 검증됐다는 주장으로 바꾸지 않고 실행 가능한 test capability와 placeholder assertion을 구분합니다.",
    mechanism: "my-app02/my-app03에는 Testing Library와 jest-dom setup, test script/dependencies가 있지만 App test는 scaffold 기본 문구를 찾는 형태라 current routes/stores/CRUD contract를 대표하지 않을 수 있습니다. 두 Zustand 문서는 실행 흐름을 설명하지만 test evidence 자체는 아닙니다.",
    workflow: "package scripts/runtime/dependencies, environment setup, test files, imported subjects, assertions, covered states와 actual pass/fail을 inventory하고 source hash와 current application behavior의 drift를 기록합니다.",
    invariants: "원본을 변경하지 않고 실제 화면·user·memo·guestbook·credential 값을 공개 fixture에 복사하지 않으며 file existence, runnable test와 behavior coverage를 별도 지표로 둡니다.",
    edgeCases: "stale scaffold, no-test exit, watch mode, CI environment, different package locks, timezone/storage, ESM/CJS와 DOM implementation version을 포함합니다.",
    failureModes: "test 파일 1개나 green badge만 보고 feature regression이 없다고 결론 내리면 assertion이 앱과 무관하거나 test가 실행되지 않은 상태를 놓칩니다.",
    verification: "test discovery list, executed assertion count, target import graph, current UI mismatch, package-lock/runtime snapshot, clean process exit와 original hashes를 확인합니다.",
    operations: "discovered/executed/skipped/flaky tests, feature-to-test mapping, runtime/dependency version과 artifact retention을 CI summary에 남깁니다.",
    concepts: [c("test capability", "runner·environment·library·script가 test를 실행할 수 있는 준비 상태입니다.", ["coverage와 다릅니다.", "실제 command로 확인합니다."]), c("behavior coverage", "feature의 정상·경계·실패·복구 계약 중 자동 test가 검증하는 범위입니다.", ["line coverage와 다릅니다.", "traceability를 둡니다."]), c("placeholder test", "project scaffold의 기본 동작만 확인하며 현재 domain feature를 대표하지 않는 test입니다.", ["삭제 전 대체 test를 만듭니다.", "green 신호를 과장하지 않습니다."])],
    codeExamples: [node("react28-capability-inventory", "test capability·coverage inventory", "React28CapabilityInventory.mjs", "scaffold file과 domain contract coverage를 별도 출력합니다.", String.raw`const projects = [
  { name: "app2", runnerReady: true, scaffoldAssertions: 1, domainContracts: 0 },
  { name: "app3", runnerReady: true, scaffoldAssertions: 1, domainContracts: 0 },
];
for (const p of projects) console.log(p.name + "=runner:" + p.runnerReady + "|scaffold:" + p.scaffoldAssertions + "|domain:" + p.domainContracts);
console.log("feature-coverage-claimed=false");`, "app2=runner:true|scaffold:1|domain:0\napp3=runner:true|scaffold:1|domain:0\nfeature-coverage-claimed=false", scaffoldRefs.concat(["local-zustand-basics", "local-zustand-crud", "testing-library-principles"]))],
  }),
  appliedTopic({
    id: "vanilla-store-contract", title: "React component 밖에서 vanilla store state·action 계약을 검증합니다",
    lead: "DOM render를 거치지 않아도 되는 pure action과 invariant는 createStore/getState/setState/subscribe 수준에서 빠르고 결정적으로 시험합니다.",
    mechanism: "vanilla store test는 fresh instance를 만들고 initial state, action input validation, immutable next state, return/result와 subscription notification을 관찰합니다. module singleton을 공유하지 않으면 test 간 state leak를 줄일 수 있습니다.",
    workflow: "state creator를 factory로 분리하고 Arrange에서 fresh store, Act에서 public action, Assert에서 observable state/result/invariant를 검증하며 private implementation 호출은 피합니다.",
    invariants: "action은 invalid input에서 state를 부분 변경하지 않고 unchanged records의 identity를 보존하며 test가 실행 순서에 의존하지 않습니다.",
    edgeCases: "empty/duplicate ID, repeated delete, update missing entity, nested object, replacement setState, thrown listener와 action composition을 다룹니다.",
    failureModes: "global bound hook을 import해 state를 누적시키거나 internal set 호출만 assert하면 public selector/component contract와 notification bug를 놓칩니다.",
    verification: "fresh-store parallel tests, initial/final snapshots, immutability/identity, invalid action negatives, subscription count와 public API-only enforcement를 실행합니다.",
    operations: "slow pure tests, shared-state flakes, mutation detection과 invariant failure seed를 CI에 보존해 즉시 재현합니다.",
    concepts: [c("vanilla store", "React Hook 없이 getState·setState·subscribe를 제공하는 store instance입니다.", ["pure contract test에 적합합니다.", "component test를 대체하지 않습니다."]), c("state creator factory", "각 test/request가 독립 store를 만들 수 있도록 state와 actions 생성 logic을 반환하는 factory입니다.", ["singleton leak를 줄입니다.", "dependency injection을 돕습니다."]), c("observable contract", "consumer가 public action/state/subscription으로 확인할 수 있는 behavior입니다.", ["private call count보다 안정적입니다.", "refactor 내성이 있습니다."])],
    codeExamples: [node("react28-store-contract", "fresh store action contract model", "React28StoreContract.mjs", "add/toggle/remove의 public state 결과와 invalid no-op를 검증합니다.", String.raw`function createStore() {
  let items = [];
  return { add: (id) => items.some((x) => x.id === id) ? false : (items = [...items, { id, done: false }], true), toggle: (id) => { const before = items; items = items.map((x) => x.id === id ? { ...x, done: !x.done } : x); return items !== before && items.some((x) => x.id === id); }, list: () => items };
}
const a = createStore(); const b = createStore();
console.log("add=" + a.add("i1"));
console.log("duplicate=" + a.add("i1"));
console.log("toggle=" + a.toggle("i1") + "|done=" + a.list()[0].done);
console.log("isolated=" + b.list().length);`, "add=true\nduplicate=false\ntoggle=true|done=true\nisolated=0", ["zustand-create-store", "zustand-testing", "local-zustand-basics"])],
  }),
  appliedTopic({
    id: "reset-isolation-lifecycle", title: "initial state reset·module isolation과 lifecycle cleanup을 자동화합니다",
    lead: "afterEach에 임의 빈 object를 넣지 않고 store가 정의한 initial state와 middleware lifecycle로 안전하게 돌아갑니다.",
    mechanism: "getInitialState 또는 store factory가 canonical initial state를 제공하고 reset registry는 각 store를 replace semantics로 복원합니다. subscriptions, timers, AbortControllers와 storage mocks도 각 test 뒤 해제합니다.",
    workflow: "test wrapper create를 사용해 reset functions를 등록하고 before/after baseline을 검사하며 fake timers·DOM·network·storage ownership을 동일 cleanup stack에 둡니다.",
    invariants: "test order/randomization/parallelism이 final result를 바꾸지 않고 reset이 actions나 required defaults를 삭제하지 않으며 active resources가 baseline으로 돌아갑니다.",
    edgeCases: "multiple stores, persist rehydrate during reset, async action completion after test, module cache, worker/test shards와 failed setup을 포함합니다.",
    failureModes: "setState({}, true)는 actions까지 제거할 수 있고 afterEach가 unawaited async work보다 먼저 끝나면 다음 test에 late update가 침투합니다.",
    verification: "random order/repeat/shard, failed-test cleanup, active handles/listeners, late async rejection, reset action availability와 storage baseline을 확인합니다.",
    operations: "order-dependent flakes, open handles, retry-pass tests와 cleanup duration을 CI에서 quarantine가 아니라 root cause 수정으로 연결합니다.",
    concepts: [c("canonical initial state", "store 생성 직후 public state와 actions의 기준 snapshot입니다.", ["reset source로 사용합니다.", "mutable shared object를 피합니다."]), c("replace semantics", "partial merge가 아니라 전체 state를 next state로 교체하는 set 동작입니다.", ["actions 보존을 확인합니다.", "middleware 계약을 따릅니다."]), c("cleanup stack", "test가 획득한 subscription/timer/request/storage override의 역순 해제 목록입니다.", ["실패 시에도 실행합니다.", "baseline을 assert합니다."])],
    codeExamples: [node("react28-reset-registry", "store reset registry model", "React28ResetRegistry.mjs", "여러 store를 canonical initial state로 되돌리고 action shape를 보존합니다.", String.raw`const stores = [
  { name: "auth", initial: { loggedIn: false }, state: { loggedIn: true } },
  { name: "todo", initial: { count: 0 }, state: { count: 3 } },
];
for (const store of stores) store.state = structuredClone(store.initial);
for (const store of stores) console.log(store.name + "=" + JSON.stringify(store.state));
console.log("active-cleanups=0");`, "auth={\"loggedIn\":false}\ntodo={\"count\":0}\nactive-cleanups=0", ["zustand-reset", "zustand-testing", "react-act"])],
  }),
  appliedTopic({
    id: "selector-subscription-contract", title: "selector·equality·subscription notification을 변경 행렬로 검증합니다",
    lead: "최종 화면만 맞는 test에 더해 어떤 slice 변화가 어떤 subscriber를 깨워야 하는지 positive/negative cases로 고정합니다.",
    mechanism: "selector는 snapshot에서 slice를 계산하고 equality가 이전/다음을 비교합니다. store notification과 component render는 같은 값이 아니므로 raw listener call, selected change와 React render evidence를 분리합니다.",
    workflow: "primitive/object/array selectors와 stable/unstable output, equality, unrelated update, unsubscribe를 matrix로 만들고 render counter는 production-like component fixture에서 따로 측정합니다.",
    invariants: "selector는 pure하고 same snapshot에 stable semantic value를 반환하며 unsubscribe 뒤 callback이 실행되지 않고 equality가 변경을 숨기지 않습니다.",
    edgeCases: "new object selector, shallow nested mutation, NaN/-0, reentrant update, listener removal during emit와 memoized selector cache를 포함합니다.",
    failureModes: "store subscribe call 수를 component render 수로 해석하거나 equality를 항상 true로 mock하면 stale UI와 missed update를 test가 숨깁니다.",
    verification: "related/unrelated updates, identity/equality corpus, unsubscribe/reentrant cases, React render reason과 selector exception isolation을 실행합니다.",
    operations: "selector recomputation, notification fan-out, render budget와 stale canary를 release evidence로 보존합니다.",
    concepts: [c("selector contract", "snapshot에서 consumer slice를 side effect 없이 계산하는 규칙입니다.", ["input/output identity를 정의합니다.", "권한 filtering과 다릅니다."]), c("equality function", "이전/다음 selected values가 의미 있게 같은지 판단하는 함수입니다.", ["missed update를 만들 수 있습니다.", "비용 budget을 둡니다."]), c("notification matrix", "state change별 raw subscriber와 selected consumer의 expected notification을 적은 표입니다.", ["negative cases를 포함합니다.", "render와 구분합니다."])],
    codeExamples: [node("react28-selector-matrix", "selector change matrix", "React28SelectorMatrix.mjs", "related/unrelated update가 선택 slice에 미치는 변화를 계산합니다.", String.raw`const selectors = { count: (s) => s.count, theme: (s) => s.theme };
let before = { count: 0, theme: "dark" };
for (const next of [{ count: 1, theme: "dark" }, { count: 1, theme: "light" }, { count: 1, theme: "light" }]) {
  const changed = Object.entries(selectors).filter(([, pick]) => !Object.is(pick(before), pick(next))).map(([name]) => name);
  console.log(changed.join(",") || "none"); before = next;
}`, "count\ntheme\nnone", ["zustand-create-store", "zustand-testing", "react-sync-store"])],
  }),
  appliedTopic({
    id: "persist-storage-hydration-tests", title: "persist serialization·version migration·hydration과 storage failure를 검증합니다",
    lead: "localStorage mock에 JSON 하나를 넣는 데서 멈추지 않고 cold start, corrupt/old/new version, partialize, merge와 cleanup을 실제 storage contract로 시험합니다.",
    mechanism: "persisted envelope은 version과 selected state를 직렬화하고 hydration은 storage read/parse/migrate/merge/finish phases를 가집니다. actions, secrets와 transient pending/errors는 보통 persistence에서 제외합니다.",
    workflow: "in-memory spec-compatible storage와 real browser fixture를 나누고 empty/corrupt/quota/blocked/old-version/current-version/newer-version cases에서 safe fallback과 evidence를 assert합니다.",
    invariants: "hydration 전후 schema가 valid하고 failed migration이 partial state를 commit하지 않으며 password/token/private cache가 serialized output에 없습니다.",
    edgeCases: "storage unavailable, JSON prototype keys, quota, two tabs, hydration race, app downgrade, timezone/locale와 logout purge를 포함합니다.",
    failureModes: "happy JSON만 mock하면 SecurityError/quota/corruption을 놓치고 entire store persistence는 action/runtime objects와 sensitive state를 남길 수 있습니다.",
    verification: "serialization snapshot allowlist, version corpus/migration idempotency, storage exceptions, cross-tab/logout, hydration UI와 real browser parity를 실행합니다.",
    operations: "hydrate/migrate/purge success, corrupt envelope, version distribution와 recovery rate를 관찰하고 remote kill/reset UX를 둡니다.",
    concepts: [c("persist envelope", "version과 allowlisted serialized state를 담는 storage record입니다.", ["runtime store 전체와 다릅니다.", "schema 검증합니다."]), c("hydration phase", "persisted data를 읽어 current store에 안전하게 반영하는 lifecycle 단계입니다.", ["초기 UI와 연결합니다.", "실패 상태가 필요합니다."]), c("migration corpus", "지원하는 과거/손상/미래 versions의 representative fixtures입니다.", ["idempotency를 시험합니다.", "실제 secret을 포함하지 않습니다."])],
    codeExamples: [node("react28-persist-migration", "persist envelope migration corpus", "React28PersistMigration.mjs", "old/current/corrupt envelopes를 current safe state로 분류합니다.", String.raw`function hydrate(raw) {
  try { const x = JSON.parse(raw); if (x.version === 2 && Array.isArray(x.todos)) return "current:" + x.todos.length; if (x.version === 1 && Array.isArray(x.items)) return "migrated:" + x.items.length; return "unsupported"; } catch { return "corrupt"; }
}
console.log(hydrate('{"version":2,"todos":[]}'));
console.log(hydrate('{"version":1,"items":[{"id":"synthetic"}]}'));
console.log(hydrate('{bad'));
console.log("secrets-serialized=false");`, "current:0\nmigrated:1\ncorrupt\nsecrets-serialized=false", ["html-webstorage", "zustand-testing", "local-zustand-basics", "local-zustand-crud"])],
  }),
  appliedTopic({
    id: "async-action-race-fault-tests", title: "async action의 pending·abort·race·retry를 deferred fault test로 제어합니다",
    lead: "Promise가 즉시 resolve하는 mock 대신 A/B completion order와 cancellation, timeout, schema/error를 test가 직접 결정합니다.",
    mechanism: "deferred promises와 fake adapters가 start/resolve/reject를 분리하고 action은 operation/query generation을 검사해 current result만 commit합니다. fake timers는 deadline/backoff에만 쓰고 microtask flush와 React act 경계를 명시합니다.",
    workflow: "A start→B start→A/B resolve permutations, abort/unmount/logout, status/schema/retry와 cleanup을 table로 만들고 clock/network dependency를 action에 주입합니다.",
    invariants: "test는 arbitrary sleep에 의존하지 않고 stale result가 state를 바꾸지 않으며 abort/reject가 unhandled rejection과 active resource를 남기지 않습니다.",
    edgeCases: "same tick settle, abort after response before commit, retry overlap, mutation timeout after server commit, fake/real timer mixing과 act warning을 포함합니다.",
    failureModes: "mockResolvedValue만 쓰면 race가 항상 request order대로 끝나고 runAllTimers가 unrelated recurring timer를 무한 실행하거나 actual network cleanup을 증명하지 못합니다.",
    verification: "all relevant order permutations, abort reason, timeout/backoff cap, unhandled rejection, active handles와 actual disposable server integration을 실행합니다.",
    operations: "flaky seed, settle order, retry/timeout/abort, leaked handle와 failing adapter version을 artifact로 보존합니다.",
    concepts: [c("deferred promise", "test가 resolve/reject 시점을 직접 제어하는 Promise fixture입니다.", ["race를 결정적으로 만듭니다.", "실제 network test를 보완합니다."]), c("dependency adapter", "clock/network/ID/storage 같은 외부 기능을 명시적으로 주입하는 경계입니다.", ["fault를 주입할 수 있습니다.", "production adapter도 contract-test합니다."]), c("act boundary", "React update가 test assertion 전에 처리되도록 묶는 test synchronization 경계입니다.", ["warning 숨김이 아닙니다.", "user interaction helper와 조정합니다."])],
    codeExamples: [node("react28-race-harness", "latest-operation race harness", "React28RaceHarness.mjs", "A/B 완료 순서를 바꿔 stale commit 거부를 실행합니다.", String.raw`let current = 0; let value = "initial";
function start() { return ++current; }
function settle(id, next) { if (id !== current) return "stale"; value = next; return "committed"; }
const a = start(); const b = start();
console.log("A=" + settle(a, "old"));
console.log("B=" + settle(b, "new"));
console.log("value=" + value);
console.log("active=0");`, "A=stale\nB=committed\nvalue=new\nactive=0", ["react-act", "vitest-timers", "local-app3-package"])],
  }),
  appliedTopic({
    id: "component-user-contract-tests", title: "store-connected component를 accessible user behavior로 검증합니다",
    lead: "store 내부 state를 직접 읽고 버튼 CSS class를 클릭하지 않고 label, role, accessible name과 visible status를 통해 사용자가 수행하는 흐름을 시험합니다.",
    mechanism: "component test는 fresh Provider/store, router/network adapters와 user-event를 조립하고 query priority에 따라 role/label/text를 선택합니다. action 뒤 DOM, focus, disabled/busy, status와 store/server effect를 함께 확인합니다.",
    workflow: "render helper가 store seed와 adapters를 받고 user가 입력→submit→pending→success/error/retry/cancel을 수행하며 findBy/waitFor는 관찰할 async condition에만 사용합니다.",
    invariants: "test query는 접근 가능한 UI contract를 반영하고 implementation classes/test IDs에 과도하게 결합하지 않으며 실제 browser gap을 명시합니다.",
    edgeCases: "keyboard submit, IME, validation, double click, slow response, focus after delete/error, hidden dialog, route navigation와 screen reader status를 포함합니다.",
    failureModes: "fireEvent로 low-level event 하나만 보내면 실제 typing/focus sequence를 놓치고 getByText regex 하나는 duplicate/hidden 요소에서 잘못된 target을 선택할 수 있습니다.",
    verification: "accessible queries, user-event sequences, focus/status/error recovery, no-console-error, network call/result와 browser E2E parity를 실행합니다.",
    operations: "failed DOM/accessibility snapshot, user action trace와 network problem artifact를 최소·redacted 형태로 CI에 보존합니다.",
    concepts: [c("accessible query", "role·name·label처럼 접근성 tree와 사용자 인식을 반영해 element를 찾는 query입니다.", ["markup refactor에 강합니다.", "a11y contract를 드러냅니다."]), c("user-event sequence", "focus, keyboard/pointer events와 value change를 실제 사용자 상호작용에 가깝게 발생시키는 test 동작입니다.", ["브라우저 E2E는 아닙니다.", "await가 필요할 수 있습니다."]), c("render harness", "fresh store/router/network와 component를 일관되게 조립하는 test helper입니다.", ["default를 최소화합니다.", "override를 명시합니다."])],
  }),
  appliedTopic({
    id: "model-property-metamorphic-tests", title: "CRUD action sequence를 model·property·metamorphic tests로 확장합니다",
    lead: "예시 세 개만 고정하지 않고 임의 action sequence에서도 unique IDs, no orphan, derived parity와 rollback invariants가 유지되는지 검사합니다.",
    mechanism: "작은 reference model과 system under test에 같은 seeded commands를 적용하고 final/step states를 비교합니다. property generator는 valid/invalid IDs·payloads를 만들고 shrinker가 실패를 최소 sequence로 줄입니다.",
    workflow: "state schema와 invariants를 먼저 선언하고 add/update/toggle/delete/reset/hydrate/rollback commands의 precondition과 postcondition을 만든 뒤 seed와 minimized trace를 보존합니다.",
    invariants: "모든 ordered IDs가 entity에 존재하고 duplicate가 없으며 derived count가 entities와 같고 failed command는 허용한 field 외 state를 바꾸지 않습니다.",
    edgeCases: "zero/large sequence, duplicate IDs, Unicode/empty/long text, repeated delete, migration, conflict/rollback와 action commutativity를 포함합니다.",
    failureModes: "random만 쓰고 seed를 저장하지 않으면 재현이 불가능하고 implementation을 그대로 복사한 model은 같은 bug를 공유합니다.",
    verification: "fixed regression seeds, randomized runs, shrinking, reference model independence, mutation testing과 performance limits를 확인합니다.",
    operations: "failed seed/minimized commands/runtime version을 artifact로 남기고 flaky retry로 숨기지 않고 permanent regression case로 승격합니다.",
    concepts: [c("reference model", "더 단순하고 독립적인 방식으로 expected state를 계산하는 비교 구현입니다.", ["SUT code를 복사하지 않습니다.", "적용 범위를 명시합니다."]), c("property test", "많은 생성 입력에서 항상 성립해야 할 invariant를 검증하는 test입니다.", ["예시 test를 보완합니다.", "generator bias를 점검합니다."]), c("metamorphic relation", "입력을 변형했을 때 결과가 따라야 하는 관계입니다.", ["예: unrelated update commutativity입니다.", "정답 oracle이 어려울 때 유용합니다."])],
    codeExamples: [node("react28-sequence-invariants", "seeded CRUD sequence invariant checker", "React28SequenceInvariants.mjs", "add/toggle/delete 뒤 unique/order/entity invariants를 매 step 검사합니다.", String.raw`let state = { entities: {}, order: [] };
const actions = [["add", "a"], ["add", "b"], ["toggle", "a"], ["delete", "b"], ["add", "a"]];
for (const [type, id] of actions) {
  if (type === "add" && !state.entities[id]) state = { entities: { ...state.entities, [id]: { id, done: false } }, order: [...state.order, id] };
  if (type === "toggle" && state.entities[id]) state = { ...state, entities: { ...state.entities, [id]: { ...state.entities[id], done: !state.entities[id].done } } };
  if (type === "delete" && state.entities[id]) { const entities = { ...state.entities }; delete entities[id]; state = { entities, order: state.order.filter((x) => x !== id) }; }
  const valid = new Set(state.order).size === state.order.length && state.order.every((x) => state.entities[x]); console.log(type + ":" + id + "=" + valid);
}`, "add:a=true\nadd:b=true\ntoggle:a=true\ndelete:b=true\nadd:a=true", ["zustand-testing", "local-zustand-crud"])],
  }),
  appliedTopic({
    id: "test-pyramid-coverage-mutation", title: "contract·component·integration·E2E와 coverage·mutation을 risk로 배분합니다",
    lead: "모든 behavior를 한 느린 browser test로 만들거나 line coverage 숫자만 높이지 않고 failure가 발생하는 경계에 맞춰 test layer를 선택합니다.",
    mechanism: "pure invariants는 store/model, rendering/accessibility는 component, storage/HTTP는 integration, 실제 navigation/browser policy는 E2E에 둡니다. coverage는 미실행 경로를 찾고 mutation test는 assertion sensitivity를 평가합니다.",
    workflow: "feature-risk matrix에서 data loss, authorization, accessibility, race와 browser compatibility를 분류하고 fastest trustworthy layer와 최소 cross-layer smoke를 배정합니다.",
    invariants: "critical contract는 negative/recovery test를 가지며 coverage threshold를 맞추기 위한 무의미 assertion을 만들지 않고 duplicated layers의 목적을 문서화합니다.",
    edgeCases: "generated code, unreachable branches, source maps, parallel databases, browser matrix, visual differences와 third-party outages를 포함합니다.",
    failureModes: "100% line coverage도 wrong assertion이면 bug를 못 잡고 E2E만 많으면 느림·flakiness 때문에 feedback과 원인 격리가 나빠집니다.",
    verification: "requirement-test traceability, coverage diff, representative mutations, layer runtime/flake rate와 escaped defect review를 수행합니다.",
    operations: "suite duration, queue time, flake/skip/quarantine, mutation score, escaped defect와 ownership을 dashboard에 연결합니다.",
    concepts: [c("test layer", "pure store, component, integration, E2E처럼 검증할 runtime 경계와 비용을 정한 층입니다.", ["risk에 맞게 선택합니다.", "상호 보완합니다."]), c("coverage gap", "요구사항/경로/상태 중 test evidence가 없는 부분입니다.", ["line 숫자만이 아닙니다.", "우선순위를 둡니다."]), c("mutation testing", "코드에 작은 의도적 변화를 넣어 tests가 잘못된 behavior를 탐지하는지 평가하는 기법입니다.", ["모든 mutation 생존이 bug는 아닙니다.", "critical logic에 집중합니다."])],
  }),
  appliedTopic({
    id: "ci-flake-artifact-operations", title: "결정적 CI·flake triage·redacted artifact와 release gate를 운영합니다",
    lead: "로컬 green을 배포 신뢰로 바꾸기 위해 runtime/lockfile/timezone/seed를 고정하고 실패 evidence와 rerun 정책을 명시합니다.",
    mechanism: "CI는 clean install, fixed runtime/locale/timezone, shard seed와 isolated ports/storage를 사용하고 reports/screenshots/traces는 secret·PII를 redaction합니다. retry는 flake 분류 evidence일 뿐 최초 실패를 green으로 덮지 않습니다.",
    workflow: "lint/type/unit/component/integration/E2E를 cost와 dependency 순서로 배치하고 cancel/timeout, junit/coverage/artifacts, branch protection과 canary rollback criteria를 구성합니다.",
    invariants: "같은 commit/inputs는 같은 result를 만들고 skipped/quarantined tests가 조용히 release gate를 빠져나가지 않으며 artifact에 token/password/private content가 없습니다.",
    edgeCases: "Windows/Linux path, CPU contention, port collision, clock DST, dependency registry, browser version, test timeout와 canceled workflow를 포함합니다.",
    failureModes: "실패 때마다 무조건 rerun하면 flaky risk를 은폐하고 전체 DOM/storage/network dump는 민감정보를 CI artifact에 장기 보존할 수 있습니다.",
    verification: "clean repeat/shuffle/shard, constrained CPU, cross-OS, artifact secret scan, quarantine expiry, branch rule와 failed-deploy rollback rehearsal를 실행합니다.",
    operations: "first-pass pass rate, retry recovery, flake owner/age, suite latency, artifact access/retention과 escaped regression을 SLO/runbook으로 관리합니다.",
    concepts: [c("first-pass pass rate", "retry 전에 한 번에 성공한 CI 실행 비율입니다.", ["flake를 드러냅니다.", "최종 green과 구분합니다."]), c("quarantine", "known flaky test를 명시적 owner·expiry·issue와 함께 release gate에서 임시 분리하는 상태입니다.", ["삭제가 아닙니다.", "critical test는 대체 gate가 필요합니다."]), c("redacted artifact", "재현에 필요한 evidence는 보존하되 credential·PII·private payload를 제거한 CI 산출물입니다.", ["access/retention을 제한합니다.", "canary value로 scan합니다."])],
    codeExamples: [node("react28-ci-gate", "test suite release-gate evaluator", "React28CiGate.mjs", "first-pass, skips, leaks와 critical contracts로 release 결정을 계산합니다.", String.raw`const report = { firstPass: 98.7, skippedCritical: 0, openHandles: 0, criticalPassed: true, artifactsSecretFree: true };
const pass = report.firstPass >= 98 && report.skippedCritical === 0 && report.openHandles === 0 && report.criticalPassed && report.artifactsSecretFree;
for (const [key, value] of Object.entries(report)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "firstPass=98.7\nskippedCritical=0\nopenHandles=0\ncriticalPassed=true\nartifactsSecretFree=true\nrelease=pass", ["testing-library-principles", "testing-library-queries", "testing-library-user-event", "vitest-timers", "zustand-testing"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-app2-test", repository: "D:/dev/my-app02", path: "src/App.test.js", usedFor: ["Testing Library scaffold assertion", "feature coverage gap"], evidence: "2026-07-14 read-only audit: 8 lines, 246 bytes, SHA-256 F7784693194B8657D1BF70C37EA70F4A2D694C4566EC41550A8E650EB600AAA4. scaffold text는 공개 example에 복사하지 않았습니다." },
  { id: "local-app2-setup", repository: "D:/dev/my-app02", path: "src/setupTests.js", usedFor: ["jest-dom setup capability"], evidence: "2026-07-14 read-only audit: 5 lines, 241 bytes, SHA-256 22583759D0045FDF8D62C9DB0AACBA9FD8BDDDE79C671AA08C97DCFD4E930CC6." },
  { id: "local-app2-package", repository: "D:/dev/my-app02", path: "package.json", usedFor: ["test script/runtime dependency capability"], evidence: "2026-07-14 read-only sanitized audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. dependency versions are source snapshot, not current recommendations." },
  { id: "local-app3-test", repository: "D:/dev/my-app03", path: "src/App.test.js", usedFor: ["Testing Library scaffold assertion", "integrated feature coverage gap"], evidence: "2026-07-14 read-only audit: 8 lines, 254 bytes, SHA-256 78EB8F13A8B8CBDCD6F25554F77111A90C9B1E5C128CF84B003C6A821A7F67E5. scaffold text는 복사하지 않았습니다." },
  { id: "local-app3-setup", repository: "D:/dev/my-app03", path: "src/setupTests.js", usedFor: ["jest-dom setup capability"], evidence: "2026-07-14 read-only audit: 5 lines, 246 bytes, SHA-256 C630B70E0F17B0FDDF547079FD2EC64E6D677252588037F873F1008F307F49B9." },
  { id: "local-app3-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["test script/runtime dependency capability"], evidence: "2026-07-14 read-only sanitized audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. dependency versions are source snapshot." },
  { id: "local-zustand-basics", repository: "D:/dev/REACT", path: "docs/react/10-zustand-basics.md", usedFor: ["local Zustand store/actions/persist lesson", "test gap context"], evidence: "2026-07-14 read-only sanitized audit: 134 lines, 6,356 bytes, SHA-256 36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D. embedded strings/assets는 복사하지 않았습니다." },
  { id: "local-zustand-crud", repository: "D:/dev/REACT", path: "docs/react/11-zustand-auth-crud.md", usedFor: ["auth/Todo/Memo/Guestbook flow", "contract test targets"], evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. actual user/domain values는 복사하지 않았습니다." },
  { id: "zustand-testing", repository: "Zustand official documentation", path: "learn/guides/testing", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/testing", usedFor: ["test environment", "store reset patterns"], evidence: "Zustand 공식 testing guidance의 현행 경로입니다." },
  { id: "zustand-create-store", repository: "Zustand official documentation", path: "reference/apis/create-store", publicUrl: "https://zustand.docs.pmnd.rs/reference/apis/create-store", usedFor: ["vanilla store API", "get/set/subscribe contracts"], evidence: "Zustand 공식 createStore API입니다." },
  { id: "zustand-reset", repository: "Zustand official documentation", path: "learn/guides/how-to-reset-state", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/how-to-reset-state", usedFor: ["single/multiple store reset"], evidence: "Zustand 공식 reset guidance입니다." },
  { id: "react-act", repository: "React official API", path: "reference/react/act", publicUrl: "https://react.dev/reference/react/act", usedFor: ["React test update synchronization"], evidence: "React 공식 act API입니다." },
  { id: "react-sync-store", repository: "React official API", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["subscription/snapshot expectations"], evidence: "React 공식 external store API입니다." },
  { id: "testing-library-principles", repository: "Testing Library official documentation", path: "guiding-principles", publicUrl: "https://testing-library.com/docs/guiding-principles/", usedFor: ["user-centered test philosophy"], evidence: "Testing Library 공식 guiding principles입니다." },
  { id: "testing-library-queries", repository: "Testing Library official documentation", path: "queries/about", publicUrl: "https://testing-library.com/docs/queries/about/", usedFor: ["accessible query priority", "async query choice"], evidence: "Testing Library 공식 query guidance입니다." },
  { id: "testing-library-user-event", repository: "Testing Library official documentation", path: "user-event/intro", publicUrl: "https://testing-library.com/docs/user-event/intro/", usedFor: ["user interaction sequences"], evidence: "Testing Library 공식 user-event guidance입니다." },
  { id: "vitest-timers", repository: "Vitest official documentation", path: "guide/mocking/timers", publicUrl: "https://vitest.dev/guide/mocking/timers", usedFor: ["fake timer control and cleanup"], evidence: "Vitest 공식 timer mocking guidance입니다." },
  { id: "html-webstorage", repository: "WHATWG HTML Standard", path: "webstorage", publicUrl: "https://html.spec.whatwg.org/multipage/webstorage.html", usedFor: ["storage API and failure/event context"], evidence: "WHATWG HTML Web Storage 표준입니다." },
];

const session = createExpertSession({
  inventoryId: "react-28-zustand-memo-slices", slug: "react-28-store-contract-testing", courseId: "react", moduleId: "react-state-management", order: 8,
  title: "store contract·component와 fault testing", subtitle: "Zustand action·selector·persist·async race를 fresh-store model부터 accessible component, browser와 결정적 CI까지 검증합니다.",
  level: "고급", estimatedMinutes: 135,
  coreQuestion: "공유 상태와 CRUD가 정상 demo를 넘어서 모든 test 순서·race·storage failure·사용자 상호작용에서도 같은 계약을 지킨다는 것을 어떻게 증명할까요?",
  summary: "my-app02/my-app03의 App test, setup, package capability와 REACT Zustand 학습 문서를 read-only·sanitized 감사해 Testing Library/jest-dom scaffold는 존재하지만 current auth/Todo/Memo/Guestbook feature coverage로 과장할 수 없음을 명시합니다. fresh vanilla store contract, reset/cleanup, selector notification, persist migration/storage faults, deferred async races, accessible user tests, property/model sequences, risk-based layers와 deterministic CI/flake/redacted artifacts를 공식 Zustand·React·Testing Library·Vitest·WHATWG 근거와 일곱 executable models로 확장합니다.",
  objectives: ["원본 test capability와 실제 feature coverage를 분리한다.", "fresh vanilla store의 state/action invariant를 검증한다.", "reset·module isolation·resource cleanup을 자동화한다.", "selector/equality/subscription 변경 행렬을 시험한다.", "persist serialization/migration/hydration/storage failure를 검증한다.", "async action race/cancel/retry를 결정적으로 제어한다.", "store-connected UI를 accessible user behavior로 시험한다.", "model/property tests와 risk-based test layers를 설계한다.", "CI flake·artifact·release gates를 운영한다."],
  prerequisites: [{ title: "CRUD state와 server 동기화", reason: "entity, operation, optimistic rollback, version conflict와 reconciliation invariants를 알아야 store/component/fault tests의 expected contract를 정확히 정의할 수 있습니다.", sessionSlug: "react-27-crud-state-server-sync" }],
  keywords: ["Zustand testing", "createStore", "reset", "selector", "persist migration", "Testing Library", "user-event", "fake timers", "property testing", "flaky test", "CI"],
  topics,
  lab: { title: "Todo·Memo·Guestbook store를 deterministic contract suite로 qualification하기", scenario: "원본 projects는 변경하지 않고 synthetic state creators와 disposable adapters에서 pure store부터 browser storage/HTTP/user flow까지 계층별 evidence를 만듭니다.", setup: ["Node 20 이상", "project-compatible test runner and DOM", "Testing Library/user-event", "fresh vanilla Zustand stores", "fake and real storage/HTTP adapters", "seeded property harness", "원본 8 files read-only", "synthetic non-sensitive fixtures"], steps: ["원본 test discovery/assertion과 feature-contract matrix를 기록합니다.", "store factory와 canonical reset/cleanup registry를 구현합니다.", "actions의 valid/invalid/identity invariants와 subscription matrix를 시험합니다.", "persist allowlist, old/corrupt/future versions, quota/blocked/hydration을 검증합니다.", "deferred A/B races, abort/timeout/retry와 active resource baseline을 실행합니다.", "accessible queries/user-event로 CRUD pending/error/focus flow를 검증합니다.", "seeded CRUD command sequences와 model/property/metamorphic invariants를 실행합니다.", "disposable HTTP/browser에서 schema/auth/storage/navigation gaps를 확인합니다.", "coverage traceability와 critical mutations로 assertion sensitivity를 평가합니다.", "clean/shuffle/shard/cross-OS CI, redacted artifacts와 rollback gate를 qualification합니다."], expectedResult: ["모든 test가 fresh state에서 순서·shard와 무관하게 같은 결과를 냅니다.", "selector/persist/async failures가 missed update, stale commit, leak나 secret persistence를 남기지 않습니다.", "component tests가 실제 label/role/focus/status와 store/server outcome을 함께 확인합니다.", "critical CRUD/auth/recovery contracts가 적절한 layer와 negative cases에 연결됩니다.", "첫-pass 신뢰도, failure seed/evidence와 release/rollback 기준이 감사 가능합니다."], cleanup: ["stores, subscriptions, timers, requests, DOM roots와 test servers를 종료합니다.", "synthetic storage/envelopes/entities, coverage/traces와 secret canaries를 정책에 따라 폐기합니다.", "fake clock/network/storage, environment variables와 feature flags를 원복합니다.", "원본 8 files hash/status unchanged를 확인합니다."], extensions: ["fast-check 등 property library adapter를 reference model에 연결합니다.", "contract suite를 Zustand와 대체 store 구현에 differential 실행합니다.", "Playwright browser matrix와 accessibility snapshot을 추가합니다.", "mutation testing 결과를 requirement-risk dashboard와 연결합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 store/component/browser test layer와 대응시키세요.", requirements: ["stdout 완전 일치", "capability inventory", "fresh isolation", "reset baseline", "selector matrix", "persist migration", "race harness", "sequence invariants", "CI gate"], hints: ["model stdout을 실제 Zustand/DOM/browser integration evidence라고 표현하지 마세요."], expectedOutcome: "각 test가 어떤 contract와 runtime gap을 증명하는지 설명합니다.", solutionOutline: ["audit→fresh/reset→selector/persist→async/UI→property/layers→CI 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Todo/Memo/Guestbook의 feature contract tests를 작성하세요.", requirements: ["store factory/reset", "CRUD invariants", "persist corpus", "race/conflict/auth faults", "accessible UI", "HTTP/browser integration", "property seeds", "secret-free artifacts"], hints: ["기존 scaffold assertion을 지우기 전에 실제 feature regression을 막는 대체 tests를 먼저 만드세요."], expectedOutcome: "current features의 정상·경계·실패·복구가 결정적으로 검증됩니다.", solutionOutline: ["trace contracts→choose layers→fault inject→cleanup→CI qualify 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 frontend state test 표준을 작성하세요.", requirements: ["capability/coverage", "isolation/reset", "selector/persist/async", "a11y/user tests", "property/model", "integration/E2E", "flake/artifact/security", "release gates"], hints: ["coverage percentage 대신 escaped defect와 recovery risk에 test budget을 배분하세요."], expectedOutcome: "상태 라이브러리 교체와 CI 환경 변화에도 유지되는 감사 가능한 quality standard가 완성됩니다.", solutionOutline: ["inventory→contract→isolate→exercise→measure→operate 순서입니다."] },
  ],
  nextSessions: ["react-29-state-architecture-migration"], sources,
  sourceCoverage: { filesRead: 8, filesUsed: 8, uncoveredNotes: ["원본 두 App.test.js는 scaffold-style assertion을 포함하므로 auth/Todo/Memo/Guestbook behavior coverage가 있다고 과장하지 않습니다.", "원본 package dependency versions는 historical source snapshot이며 current library 선택 권고가 아닙니다.", "실제 visible/domain/user values와 credentials는 test fixtures/evidence에 복사하지 않았습니다.", "Node models는 actual Zustand middleware, React act/DOM, browser storage, Testing Library/user-event와 CI runtime을 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
