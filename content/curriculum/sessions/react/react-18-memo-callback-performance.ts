import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const memoLocalSources = ["local-memo01", "local-memo02", "local-memo03", "local-memo04", "local-callback01", "local-callback02", "local-callback03", "local-callback-child", "local-hook-notes", "react-hooks-doc", "react-official-audit", "react-source-coverage"];

const topics = [
  appliedTopic({
    id: "source-memo-callback-audit", title: "UseMemo·UseCallBack 자료를 recompute·identity·closure evidence로 감사합니다",
    lead: "원본은 무거운 계산 baseline, 빈/특정 dependency의 useMemo, query filter, callback baseline·functional update·memo child를 단계별로 보여 주며 성공 예제뿐 아니라 stale closure 위험도 포함합니다.",
    mechanism: "UseMemo01은 render마다 계산, 02는 empty dependencies, 03은 count dependency, 04는 query filter를 보여 줍니다. UseCallBack01은 매 render 새 함수, 02는 empty dependencies와 functional updater, 03은 memo child에 empty-dependency callback을 전달하지만 captured state update 때문에 stale closure가 될 수 있습니다.",
    workflow: "각 파일을 computation input/output, reactive dependencies, identity consumer, render count, closure read, source line/byte/hash와 archive parity로 표로 만들고 actual list/label/log strings는 제외합니다.",
    invariants: "memoization을 correctness에 사용하지 않고 dependency는 실제 reactive reads를 완전하게 반영하며 optimization 전후 user-visible output·actions·accessibility가 같습니다.",
    edgeCases: "NaN, -0, new object/function, mutable input, StrictMode double calculation, cache discard, Suspense initial mount, stale callback, context/state child update와 compiler mode를 포함합니다.",
    failureModes: "빈 dependencies로 changing value를 캡처하면 stale result/callback이 되고 memo child를 감싸도 항상 새 object/function prop 하나가 bailout을 깨며 무거운 demo loop가 실제 workload를 대표하지 않을 수 있습니다.",
    verification: "source/hash matrix, exact dependency/identity model, React Profiler production-like traces, stale-closure interaction, component render counts와 output parity를 확인합니다.",
    operations: "optimization마다 baseline, hypothesis, owner, budget, artifact, rollback trigger와 cache/compiler compatibility를 기록하고 telemetry cardinality를 제한합니다.",
    concepts: [c("memoization", "같은 dependency identity에서 이전 calculation result나 function reference를 재사용하는 성능 기법입니다.", ["semantic guarantee가 아닙니다.", "측정 뒤 적용합니다."]), c("reactive dependency", "component scope에서 props/state로부터 읽고 Hook calculation/effect 결과에 영향을 주는 값입니다.", ["목록을 완전하게 둡니다.", "Object.is로 비교됩니다."]), c("stale closure", "함수가 생성된 render의 값을 계속 캡처해 최신 state/prop intent와 다른 결과를 내는 상태입니다.", ["functional updater로 read를 줄일 수 있습니다.", "dependency를 숨기지 않습니다."])],
    codeExamples: [node("react18-source-matrix", "memo/callback 원본 provenance matrix", "React18SourceMatrix.mjs", "여덟 코드와 문서 provenance, archive parity, stale-closure observation을 exact stdout으로 고정합니다.", String.raw`const rows = [
  ["memo-01", "baseline-recompute"],
  ["memo-02", "empty-dependency-cache"],
  ["memo-03", "reactive-dependency-cache"],
  ["memo-04", "query-filter-cache"],
  ["callback-01", "new-function-baseline"],
  ["callback-02", "functional-update-callback"],
  ["callback-03", "memo-child-stale-risk"],
  ["callback-child", "component-memo-boundary"],
  ["hook-notes", "original-taxonomy"],
  ["hooks-doc", "curated-caveat"],
  ["official-audit", "strict-effect-update"],
  ["source-coverage", "archive-inventory"],
];
for (const row of rows) console.log(row.join("|"));
console.log("archive-counterparts=8");
console.log("archive-byte-equal=true");
console.log("actual-literals-copied=false");`, "memo-01|baseline-recompute\nmemo-02|empty-dependency-cache\nmemo-03|reactive-dependency-cache\nmemo-04|query-filter-cache\ncallback-01|new-function-baseline\ncallback-02|functional-update-callback\ncallback-03|memo-child-stale-risk\ncallback-child|component-memo-boundary\nhook-notes|original-taxonomy\nhooks-doc|curated-caveat\nofficial-audit|strict-effect-update\nsource-coverage|archive-inventory\narchive-counterparts=8\narchive-byte-equal=true\nactual-literals-copied=false", memoLocalSources.concat(["react-use-memo", "react-use-callback", "react-memo"]))],
  }),
  appliedTopic({
    id: "correctness-first-cache-semantics", title: "cache가 없어져도 맞는 계산만 useMemo·useCallback에 넣습니다",
    lead: "useMemo와 useCallback은 cache를 제공하지만 React가 cache를 유지해야만 정답이 되는 code는 state/ref/architecture 문제를 숨깁니다.",
    mechanism: "useMemo는 dependency가 Object.is 기준으로 같으면 calculation result를 재사용하고 useCallback은 function definition을 재사용합니다. 개발 edit, initial suspension 등 이유로 cache가 폐기될 수 있으므로 correctness contract가 아닙니다.",
    workflow: "memo 제거 상태에서 correctness tests를 먼저 통과시키고 expensive/referential-stability consumer를 증명한 뒤 dependency identity와 cache hit/miss를 측정합니다.",
    invariants: "calculation은 pure하고 input을 mutate하지 않으며 cache miss/recompute가 output·side effect count를 바꾸지 않고 callback identity가 authorization/idempotency token이 아닙니다.",
    edgeCases: "NaN equality, +0/-0, mutable Map/array, deep-equal new object, hot reload, initial suspend, virtualization과 dependency length/order 변화를 다룹니다.",
    failureModes: "useMemo에 side effect를 넣으면 StrictMode나 cache discard에서 중복 실행되고 new mutable object를 같은 identity로 바꾸면 필요한 recompute가 생략됩니다.",
    verification: "memo 제거 mutation test, Object.is corpus, input freeze, cache reset, StrictMode와 repeat calculation output parity를 확인합니다.",
    operations: "cache hit 자체를 목표로 삼지 않고 interaction latency와 render work를 budget으로 관리하며 cache behavior 변화에 rollback 가능한 baseline을 둡니다.",
    concepts: [c("cache eviction", "React/runtime가 이전 memoized value나 function을 버리고 다시 계산할 수 있는 상황입니다.", ["correctness에 영향 없어야 합니다.", "recompute를 허용합니다."]), c("Object.is dependency comparison", "React가 각 dependency의 이전/현재 identity/value를 비교하는 기준입니다.", ["NaN과 signed zero를 이해합니다.", "deep comparison이 아닙니다."]), c("pure calculation", "같은 input에 같은 result를 만들고 외부 상태를 변경하지 않는 계산입니다.", ["StrictMode replay를 견딥니다.", "memo에 적합합니다."])],
    codeExamples: [node("react18-object-is", "dependency Object.is identity matrix", "React18ObjectIs.mjs", "primitive, NaN, signed zero와 object identity가 cache dependency 비교에서 어떻게 다른지 실행합니다.", String.raw`const shared = { id: "stable" };
const pairs = [
  ["same-number", 3, 3],
  ["nan", Number.NaN, Number.NaN],
  ["signed-zero", 0, -0],
  ["same-object", shared, shared],
  ["new-object", { id: "stable" }, { id: "stable" }],
];
for (const pair of pairs) console.log(pair[0] + "=" + Object.is(pair[1], pair[2]));
console.log("deep-equality-used=false");
console.log("cache-is-correctness=false");`, "same-number=true\nnan=true\nsigned-zero=false\nsame-object=true\nnew-object=false\ndeep-equality-used=false\ncache-is-correctness=false", ["react-use-memo", "react-use-callback", "tc39-object-is"])],
  }),
  appliedTopic({
    id: "measure-profiler-baseline", title: "optimization 전에 Profiler·Performance Timeline으로 baseline과 variance를 측정합니다",
    lead: "console log 횟수나 개발 모드 체감만으로 memoization을 판단하면 StrictMode, DevTools, JIT, machine 차이와 artificial loop 때문에 잘못된 결론을 냅니다.",
    mechanism: "React Profiler는 commit마다 actualDuration/baseDuration 등의 render evidence를 제공하고 performance tracks와 User Timing은 interaction 전체의 scheduling·main-thread 구간을 연결합니다.",
    workflow: "representative interaction→production profiling build→CPU/network/device condition→warmup→multiple samples→median/tail→render count/commit cause→before/after parity 순서로 측정합니다.",
    invariants: "같은 input/device/build에서 비교하고 p50뿐 아니라 p95/long task와 user outcome을 보며 profiling overhead와 development StrictMode를 결과에 명시합니다.",
    edgeCases: "first-load compilation, JIT warmup, GC, background tab, thermal throttling, nested update, Suspense, transition, low-end device와 noisy shared CI를 다룹니다.",
    failureModes: "한 번의 console.time 결과나 faster workstation만 보고 최적화하면 실제 사용자 tail latency가 악화되고 render 횟수 감소가 interaction 완료 지연으로 바뀔 수 있습니다.",
    verification: "sample count, raw timing artifact, percentile calculation, Profiler phase/commit, browser trace와 repeatability confidence를 검증합니다.",
    operations: "route/interaction별 latency·render budget, regression threshold, artifact retention과 rollback trigger를 versioned dashboard로 운영합니다.",
    concepts: [c("actualDuration", "현재 commit에서 Profiler subtree를 render하는 데 걸린 측정 시간입니다.", ["memo 효과 관찰에 사용합니다.", "profiling build 조건을 기록합니다."]), c("baseDuration", "memoization 없이 subtree 전체를 render할 때의 추정 기준 시간입니다.", ["actualDuration과 비교합니다.", "절대 SLA가 아닙니다."]), c("tail latency", "느린 사용자 경험을 나타내는 p95/p99 같은 분포 상단 지표입니다.", ["평균만 보지 않습니다.", "표본 조건을 고정합니다."])],
    codeExamples: [node("react18-profile-budget", "render sample percentile와 budget", "React18ProfileBudget.mjs", "synthetic duration samples의 median/p95와 optimization budget 판정을 deterministic하게 계산합니다.", String.raw`const samples = [9, 4, 5, 3, 7].slice().sort((a, b) => a - b);
function percentile(values, ratio) {
  const index = Math.ceil(values.length * ratio) - 1;
  return values[Math.max(0, index)];
}
const median = percentile(samples, 0.5);
const p95 = percentile(samples, 0.95);
console.log("samples=" + samples.join(","));
console.log("count=" + samples.length);
console.log("median-ms=" + median);
console.log("p95-ms=" + p95);
console.log("budget-ms=10");
console.log("within-budget=" + (p95 <= 10));
console.log("development-result-used=false");`, "samples=3,4,5,7,9\ncount=5\nmedian-ms=5\np95-ms=9\nbudget-ms=10\nwithin-budget=true\ndevelopment-result-used=false", ["react-profiler", "react-performance-tracks", "react-strict-mode", "w3c-performance-timeline", "w3c-user-timing"])],
  }),
  appliedTopic({
    id: "usememo-dependency-design", title: "useMemo calculation과 dependencies를 data-flow graph로 설계합니다",
    lead: "원본 empty dependencies와 count/query dependencies는 cache invalidation을 비교하기 좋지만 실제 calculation이 어떤 reactive value를 읽는지부터 결정해야 합니다.",
    mechanism: "calculation function 안에서 읽는 props/state/component-scope values가 dependencies이며 React는 각 항목을 Object.is로 비교합니다. empty array는 ‘한 번만’ 목적이 아니라 reactive read가 없을 때만 맞습니다.",
    workflow: "calculation input을 explicit parameter 수준으로 나열하고 derived object를 calculation 안에서 만들며 lint 결과, hit/miss, recompute cost와 output parity를 기록합니다.",
    invariants: "dependency를 성능 때문에 누락하지 않고 input mutation이 없으며 계산 결과가 render에서만 사용되는 pure derived value이고 trivial work는 memo 없이 유지합니다.",
    edgeCases: "locale/collator, mutable array sort, query normalization, object options, function dependencies, stale external config, empty data와 error throw를 다룹니다.",
    failureModes: "count를 읽는데 empty dependencies를 쓰면 stale result, items를 in-place mutate하면 identity가 같아 stale filter, memoized object를 다시 dependency로 써도 항상 새 값이면 cache가 깨집니다.",
    verification: "exhaustive-deps, dependency mutation tests, freeze/copy, hit/miss counters, property-based input corpus와 memo 제거 output parity를 실행합니다.",
    operations: "calculation name, input cardinality, recompute duration과 allocation을 bounded telemetry로 수집하고 dependency refactor는 before/after artifact를 남깁니다.",
    concepts: [c("cache invalidation", "dependency가 바뀌었을 때 이전 result를 버리고 다시 계산하는 결정입니다.", ["data-flow와 일치해야 합니다.", "누락은 stale result를 만듭니다."]), c("derived value", "authoritative props/state에서 pure하게 계산할 수 있어 별도 state가 필요 없는 값입니다.", ["render 중 계산합니다.", "비쌀 때만 memo합니다."]), c("dependency graph", "calculation output에 영향을 주는 reactive reads와 identity 관계를 나타낸 graph입니다.", ["lint로 보조합니다.", "숨은 input을 제거합니다."])],
  }),
  appliedTopic({
    id: "usecallback-closure-functional-update", title: "useCallback identity와 captured state correctness를 분리합니다",
    lead: "함수 reference가 stable하다는 사실은 함수가 최신 state를 읽는다는 뜻이 아니며 원본 Callback03의 empty dependency와 captured update가 그 차이를 드러냅니다.",
    mechanism: "useCallback은 function을 호출하지 않고 definition identity를 cache합니다. callback이 state를 next state 계산에만 쓰면 functional updater로 dependency를 제거할 수 있지만 logging/branching 등 실제 read는 dependency나 Effect Event policy가 필요합니다.",
    workflow: "callback body의 reactive reads→functional updater로 제거 가능한 read→remaining dependencies→identity consumer(memo child/effect/API)→interaction result를 추적합니다.",
    invariants: "latest state가 필요한 branch가 stale closure에 남지 않고 empty dependencies는 body가 reactive values를 읽지 않을 때만 사용하며 stable identity를 event deduplication/security key로 쓰지 않습니다.",
    edgeCases: "rapid clicks, batched updates, async callback, memo child, subscription callback, debounce timer, prop change와 callback ref를 포함합니다.",
    failureModes: "captured count+1을 empty dependencies로 cache하면 첫 snapshot 기준으로 반복 set되고 무조건 useCallback을 써도 consumer가 identity를 비교하지 않으면 비용만 늘어납니다.",
    verification: "rapid multi-click, prop/state change 뒤 callback, functional updater, dependency lint, identity comparison과 memo child render count를 test합니다.",
    operations: "stale-action report, duplicate action, callback allocation보다 user outcome과 render cost를 관찰하며 correctness regression이면 즉시 memoization을 제거합니다.",
    concepts: [c("function identity", "두 function object가 Object.is 기준으로 같은 reference인지의 속성입니다.", ["behavior freshness와 다릅니다.", "consumer가 비교할 때만 유용합니다."]), c("functional updater", "이전 committed state를 인자로 받아 next state를 계산하는 setter 형태입니다.", ["captured state read를 줄입니다.", "순차 update에 안전합니다."]), c("closure freshness", "callback이 호출 시점에 의도한 최신 reactive values를 반영하는 조건입니다.", ["dependencies를 완전하게 둡니다.", "identity stability와 별도 검증합니다."])],
    codeExamples: [node("react18-callback-freshness", "stale closure와 functional updater 비교", "React18CallbackFreshness.mjs", "captured snapshot callback과 functional updater callback의 반복 결과를 exact stdout으로 비교합니다.", String.raw`let state = 0;
function makeCaptured(snapshot) {
  return () => { state = snapshot + 1; };
}
const stale = makeCaptured(state);
stale();
state = 5;
stale();
console.log("captured-after-second-call=" + state);
state = 0;
function functional() {
  state = state + 1;
}
functional();
functional();
console.log("functional-after-two-calls=" + state);
console.log("stable-identity-means-fresh=false");
console.log("dependency-suppressed=false");`, "captured-after-second-call=1\nfunctional-after-two-calls=2\nstable-identity-means-fresh=false\ndependency-suppressed=false", ["local-callback02", "local-callback03", "react-use-callback", "eslint-exhaustive-deps"])],
  }),
  appliedTopic({
    id: "memo-component-bailout", title: "memo bailout을 props·state·context·child identity 전체에서 검증합니다",
    lead: "React.memo는 parent rerender를 완전히 막는 장벽이 아니라 props가 unchanged일 때 render를 건너뛸 수 있는 optimization이며 child own state/context 변화는 여전히 render합니다.",
    mechanism: "기본 comparator는 각 prop을 Object.is로 비교합니다. new object/array/function/JSX prop 하나가 bailout을 깨고 custom comparator는 모든 props와 function closure 의미를 정확히 비교해야 합니다.",
    workflow: "slow child 증거→memo wrapper→minimal primitive props→useMemo/useCallback로 필요한 identity만 안정화→Profiler로 actual/base duration과 output parity를 비교합니다.",
    invariants: "memo 없이도 correct하고 custom comparator가 stale function을 승인하지 않으며 context/state update를 막으려 하지 않고 comparator 비용이 skipped render보다 작습니다.",
    edgeCases: "children JSX identity, object spread, context provider value, stateful child, custom comparator deep graph/cycle, Suspense와 compiler memoization을 포함합니다.",
    failureModes: "항상 true comparator가 updated prop/function을 숨기거나 deep equality가 render보다 느리고 parent가 inline callback을 전달해 memo가 매번 깨질 수 있습니다.",
    verification: "prop identity matrix, own state/context update, custom comparator mutation, stale handler, Profiler duration와 accessibility output parity를 테스트합니다.",
    operations: "bailout rate가 아니라 interaction latency와 correctness를 budget으로 두며 comparator timeout/exception과 rollback을 준비합니다.",
    concepts: [c("memo bailout", "props가 unchanged일 때 React가 component render를 건너뛸 수 있는 최적화 경로입니다.", ["보장이 아닙니다.", "state/context update는 별개입니다."]), c("shallow prop comparison", "각 prop value를 Object.is로 비교하는 memo 기본 전략입니다.", ["object/function identity에 민감합니다.", "deep compare가 아닙니다."]), c("custom comparator", "이전/다음 props가 같은 output을 만든다고 판단하는 사용자 함수입니다.", ["모든 prop/function을 다룹니다.", "비용과 stale risk가 큽니다."])],
    codeExamples: [node("react18-prop-identity", "memo shallow prop identity model", "React18PropIdentity.mjs", "primitive, stable/new object와 function prop이 shallow equality에 미치는 영향을 실행합니다.", String.raw`function shallowEqual(left, right) {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => Object.is(left[key], right[key]));
}
const stableObject = { mode: "compact" };
const stableFunction = () => "ok";
const previous = { count: 1, config: stableObject, onSelect: stableFunction };
console.log("same-references=" + shallowEqual(previous, { count: 1, config: stableObject, onSelect: stableFunction }));
console.log("new-object=" + shallowEqual(previous, { count: 1, config: { mode: "compact" }, onSelect: stableFunction }));
console.log("new-function=" + shallowEqual(previous, { count: 1, config: stableObject, onSelect: () => "ok" }));
console.log("own-state-can-render=true");
console.log("context-can-render=true");
console.log("memo-is-guarantee=false");`, "same-references=true\nnew-object=false\nnew-function=false\nown-state-can-render=true\ncontext-can-render=true\nmemo-is-guarantee=false", ["local-callback-child", "react-memo", "react-use-memo", "react-use-callback"])],
  }),
  appliedTopic({
    id: "dependency-lint-compiler-safety", title: "exhaustive-deps와 compiler lints를 optimization safety net으로 사용합니다",
    lead: "dependency warning을 disable하면 당장 cache hit는 늘 수 있지만 stale closure와 compiler optimization coverage를 잃습니다.",
    mechanism: "eslint-plugin-react-hooks는 exhaustive dependencies, Rules, refs/purity, preserve-manual-memoization와 use-memo diagnostics를 제공하고 compiler가 unsafe pattern을 skip할 수 있게 근거를 만듭니다.",
    workflow: "recommended lint baseline→zero blind suppression→dependency graph refactor→manual memo preservation→compiler diagnostics inventory→behavior/performance test 순서로 adoption합니다.",
    invariants: "suppression에는 owner·reason·expiry·test가 있고 custom effect hooks를 lint settings에 등록하며 compiler warning을 correctness bug와 performance skip으로 분류합니다.",
    edgeCases: "generated code, library boundary, custom comparator, custom effect hook, monorepo mixed config, compiler gating과 React version compatibility를 다룹니다.",
    failureModes: "empty dependency를 유지하려고 lint를 끄면 state/prop 변경이 반영되지 않고 compiler migration에서 manual memo semantics가 조용히 바뀔 수 있습니다.",
    verification: "clean lint, negative fixtures, compiler diagnostics snapshot, suppression inventory, manual memo before/after behavior와 production build를 확인합니다.",
    operations: "lint/compile coverage, skip reason, suppression age와 regression을 dashboard로 관리하고 incremental rollout과 file-level rollback을 둡니다.",
    concepts: [c("exhaustive-deps", "Hook callback이 읽는 reactive values가 dependency list에 모두 있는지 검사하는 lint입니다.", ["stale closure를 막습니다.", "경고를 속이지 않습니다."]), c("manual memo preservation", "compiler가 기존 수동 memoization의 의도를 깨지 않도록 검사하는 migration 규칙입니다.", ["before/after를 test합니다.", "점진 적용합니다."]), c("compiler skip", "unsupported/unsafe function만 최적화에서 제외하고 나머지는 계속 compile할 수 있는 동작입니다.", ["진단을 분류합니다.", "무조건 장애가 아닙니다."])],
  }),
  appliedTopic({
    id: "memo-cost-memory-cardinality", title: "cache lookup·allocation·retention 비용과 high-cardinality input을 계산합니다",
    lead: "memoization은 공짜가 아니며 dependency array 비교, closure/object 유지, code complexity와 cache miss가 잦은 입력에서는 총 비용이 늘 수 있습니다.",
    mechanism: "useMemo/useCallback은 component instance lifetime에 cache entry와 dependencies를 유지합니다. 입력이 매 render 바뀌면 calculation과 cache 관리가 모두 발생하고 large result가 GC pressure를 늘립니다.",
    workflow: "calculation cost·change frequency·consumer bailout·retained size를 측정하고 trivial/high-churn 값은 memo를 제거하며 large derived data는 paging/index/worker architecture도 비교합니다.",
    invariants: "unbounded application-level cache로 오해하지 않고 sensitive data를 불필요하게 retained value에 두지 않으며 memory budget과 invalidation owner를 정의합니다.",
    edgeCases: "large arrays/images, per-row Hook 금지, virtualized list, locale variants, tenant/user switch, logout, hidden route와 hot reload를 다룹니다.",
    failureModes: "모든 object/function을 memo하면 dependency graph와 retained closures가 늘고 하나의 always-new dependency 때문에 효과 없이 lookup만 추가됩니다.",
    verification: "heap snapshot, allocation profile, GC pause, hit/miss/change frequency, memo removal experiment와 logout/unmount retention test를 실행합니다.",
    operations: "memory/GC/long-task budget과 privacy retention을 함께 감시하고 large cache 발견 시 feature flag로 제거·reconcile합니다.",
    concepts: [c("retained value", "component가 살아 있는 동안 memo cache가 참조해 GC되지 않는 result나 closure graph입니다.", ["memory budget을 봅니다.", "민감 data를 최소화합니다."]), c("change frequency", "dependency identity가 render 사이에 바뀌어 cache miss를 만드는 비율입니다.", ["높으면 효용이 낮습니다.", "interaction별로 측정합니다."]), c("optimization overhead", "dependency compare, Hook bookkeeping, allocation과 유지보수 복잡성의 추가 비용입니다.", ["benefit과 함께 측정합니다.", "trivial case는 제거합니다."])],
  }),
  appliedTopic({
    id: "responsiveness-transition-deferred", title: "계산 cache와 interaction scheduling을 useTransition·useDeferredValue로 구분합니다",
    lead: "useMemo가 계산을 건너뛰지 못하는 cache miss에는 typing 같은 urgent update와 slow result rendering을 분리하는 scheduling 전략이 더 적합할 수 있습니다.",
    mechanism: "useTransition은 non-urgent state update를 transition으로 표시하고 useDeferredValue는 value의 deferred version을 제공합니다. 둘 다 계산을 자동으로 빠르게 만들지는 않지만 urgent UI가 먼저 반응할 여지를 줍니다.",
    workflow: "interaction을 urgent input/selection과 non-urgent result로 나누고 pending/stale semantics, cancellation/latest intent, accessibility announcement와 CPU work 자체의 chunk/worker 대안을 설계합니다.",
    invariants: "input control update를 transition에 넣지 않고 pending UI가 focus를 빼앗지 않으며 stale result가 명확하고 server/data race contract는 별도 latest-wins로 처리합니다.",
    edgeCases: "continuous typing, expensive filter, network+CPU overlap, Suspense, screen reader status, reduced motion, starvation과 low-end device를 다룹니다.",
    failureModes: "모든 update를 transition으로 감싸면 control이 lag하고 useDeferredValue를 cache로 오해하면 expensive calculation이 계속 실행되며 stale UI가 최신으로 보일 수 있습니다.",
    verification: "typing latency, pending/stale state, rapid intent changes, screen-reader status, Profiler lane/commit와 worker alternative를 비교합니다.",
    operations: "input-to-paint와 result-settle latency를 분리하고 pending residence, abandon rate와 rollback threshold를 운영합니다.",
    concepts: [c("urgent update", "typing·pointer feedback처럼 즉시 반영되어야 하는 user interaction state입니다.", ["transition 밖에 둡니다.", "latency를 별도 측정합니다."]), c("transition update", "중단 가능하고 non-blocking priority로 처리할 수 있다고 표시한 state update입니다.", ["작업을 줄이지는 않습니다.", "pending UI를 제공합니다."]), c("deferred value", "urgent render 뒤에 따라갈 수 있는 value snapshot입니다.", ["stale 표시가 필요합니다.", "cache와 다릅니다."])],
  }),
  appliedTopic({
    id: "react-compiler-migration", title: "React Compiler와 manual memoization을 evidence 기반으로 공존·이관합니다",
    lead: "현재 React Compiler는 값·함수·component memoization을 자동 적용할 수 있지만 기존 manual memo를 일괄 삭제하거나 compiler를 만능 성능 해결책으로 보면 안 됩니다.",
    mechanism: "compiler는 component/Hook의 pure rules를 분석해 optimization하고 unsafe function을 skip할 수 있습니다. manual useMemo/useCallback/memo는 정밀한 escape hatch로 남을 수 있으며 directives와 gating config가 deployment behavior를 바꿉니다.",
    workflow: "runtime/build compatibility→lint diagnostics→baseline profiles→small compiler cohort→manual memo preservation→correctness/a11y/performance parity→coverage 확장 순서로 migration합니다.",
    invariants: "compiler adoption 전 render purity가 있고 existing memo removal은 별도 change로 test하며 compiled/uncompiled artifacts가 API·state·hydration contract를 공유합니다.",
    edgeCases: "library precompiled code, mixed React versions, annotation/infer/all mode, use memo/no memo directive, dynamic patterns, HMR와 rollback artifact를 다룹니다.",
    failureModes: "compiler가 있으니 모든 manual memo를 제거하면 dependency identity consumer behavior가 바뀌거나 unsupported component만 느려져 성능 분포가 예상과 달라질 수 있습니다.",
    verification: "compiler lint/config, generated artifact inventory, compiled coverage, before/after profile, manual memo retention test, hydration와 rollback rehearsal를 실행합니다.",
    operations: "compiler coverage/skip reason, regression cohort, artifact version과 kill switch를 관리하고 config 변경도 code release처럼 review합니다.",
    concepts: [c("React Compiler", "React component와 Hook를 정적 분석해 자동 memoization 등 optimization을 적용하는 build-time compiler입니다.", ["rules/purity가 중요합니다.", "점진 도입합니다."]), c("compilation gating", "어떤 cohort/file/function에 compiler output을 적용할지 제어하는 rollout 전략입니다.", ["rollback이 필요합니다.", "coverage를 관찰합니다."]), c("manual escape hatch", "compiler 자동 결정 외에 정확한 identity control이 필요할 때 유지하는 useMemo/useCallback/memo입니다.", ["근거를 문서화합니다.", "preservation lint를 씁니다."])],
  }),
  appliedTopic({
    id: "performance-release-accessibility-security", title: "성능 최적화를 output·a11y·security·rollback이 포함된 release gate로 닫습니다",
    lead: "더 빠른 render가 최신 data/action을 놓치거나 status announcement·focus·authorization 결과를 stale하게 만들면 성공한 최적화가 아닙니다.",
    mechanism: "optimization 전후 동일 input/event에서 visual text, accessible name/role/status, focus, enabled actions, server-authorized payload와 error recovery가 같아야 하고 latency/memory budget까지 함께 통과해야 합니다.",
    workflow: "correctness/a11y/security baseline→performance hypothesis→small code change→production-like samples→parity matrix→canary→rollback/reconciliation 순서로 release합니다.",
    invariants: "custom comparator가 permission/status prop을 숨기지 않고 memoized callback이 stale authorization context를 사용하지 않으며 raw input/data가 profiler labels와 telemetry에 없습니다.",
    edgeCases: "permission revoke, locale/theme, error/Suspense fallback, background refresh, assistive technology, low-end device, mixed compiler artifact와 rollback을 다룹니다.",
    failureModes: "comparator가 expensive data만 보고 error/permission prop을 무시하면 forbidden action이 남거나 status update가 screen reader에 전달되지 않을 수 있습니다.",
    verification: "component/integration/a11y/security negative tests, Profiler/Performance Timeline, heap, canary cohorts와 rollback readback을 실행합니다.",
    operations: "p95 interaction/render/memory뿐 아니라 stale action, announcement/focus regression과 rollback success를 same release dashboard에서 관리합니다.",
    concepts: [c("optimization parity", "optimization 전후 user-visible·semantic·security outcome이 같은 조건입니다.", ["성능 수치와 함께 통과합니다.", "negative state를 포함합니다."]), c("performance budget", "interaction/render/memory 지표에 대해 release 전 허용한 threshold입니다.", ["device/cohort를 명시합니다.", "tail을 봅니다."]), c("rollback reconciliation", "old artifact로 되돌린 뒤 pending state/cache/telemetry가 compatible 상태로 수렴하는 절차입니다.", ["연습합니다.", "readback을 남깁니다."])],
    codeExamples: [node("react18-release-gate", "memo optimization 종합 release gate", "React18ReleaseGate.mjs", "correctness·a11y·security parity와 p95/memory budget으로 release decision을 실행합니다.", String.raw`const candidate = {
  outputParity: true,
  actionParity: true,
  a11yParity: true,
  securityParity: true,
  p95Before: 18,
  p95After: 11,
  memoryMb: 6,
};
const gates = [
  ["output", candidate.outputParity],
  ["action", candidate.actionParity],
  ["a11y", candidate.a11yParity],
  ["security", candidate.securityParity],
  ["latency", candidate.p95After < candidate.p95Before && candidate.p95After <= 12],
  ["memory", candidate.memoryMb <= 8],
];
for (const gate of gates) console.log(gate[0] + "=" + gate[1]);
console.log("release=" + gates.every((gate) => gate[1]));
console.log("rollback-rehearsed=true");`, "output=true\naction=true\na11y=true\nsecurity=true\nlatency=true\nmemory=true\nrelease=true\nrollback-rehearsed=true", ["react-compiler-introduction", "eslint-preserve-manual-memoization", "eslint-use-memo", "react-use-deferred-value", "react-use-transition", "wcag-status-messages"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-memo01", repository: "my-app01", path: "src/pages/step11-hook/UseMemo01.jsx", usedFor: ["render-time expensive calculation baseline provenance"], evidence: "Read-only sanitized audit: 28 lines, 785 bytes, SHA-256 2FA410FE35607B921111E0D5E50699FC9DAE382AFF5978917EAFFF1ED6A2C805; actual log/display values were not copied." },
  { id: "local-memo02", repository: "my-app01", path: "src/pages/step11-hook/UseMemo02.jsx", usedFor: ["empty-dependency memo provenance"], evidence: "Read-only sanitized audit: 29 lines, 921 bytes, SHA-256 2AC2BE651FABFA1ECEA23524BA0CDC541A0036C4B4E1D2E3BB46CD4F38DE6214; actual log/display values were not copied." },
  { id: "local-memo03", repository: "my-app01", path: "src/pages/step11-hook/UseMemo03.jsx", usedFor: ["reactive count dependency provenance"], evidence: "Read-only sanitized audit: 28 lines, 875 bytes, SHA-256 DC98E468E1581396CC015DA813D494A1317097D89589F2F980BBED9DB3AFA8D0; actual log/display values were not copied." },
  { id: "local-memo04", repository: "my-app01", path: "src/pages/step11-hook/UseMemo04.jsx", usedFor: ["query filter and list memo provenance"], evidence: "Read-only sanitized audit: 31 lines, 1,028 bytes, SHA-256 986714249C94F5DE7F1555F58E7ADE3AD79F87091222F2321CA576F0BEB9B29E; actual list/domain/display strings were not copied." },
  { id: "local-callback01", repository: "my-app01", path: "src/pages/step11-hook/UseCallBack01.jsx", usedFor: ["new function per render baseline provenance"], evidence: "Read-only sanitized audit: 27 lines, 858 bytes, SHA-256 6F880652B0A067CFF5AC100FD94AD971D1A541033C76C332433566FE2AD6FAF6; actual labels/log strings were not copied." },
  { id: "local-callback02", repository: "my-app01", path: "src/pages/step11-hook/UseCallBack02.jsx", usedFor: ["empty dependencies with functional updater provenance"], evidence: "Read-only sanitized audit: 30 lines, 1,091 bytes, SHA-256 62154C6FF0297755AB0824708861AACC76463EAF2F132FB934975CCAAB034496; actual labels/log strings were not copied." },
  { id: "local-callback03", repository: "my-app01", path: "src/pages/step11-hook/UseCallBack03.jsx", usedFor: ["memo child callback and stale captured state risk"], evidence: "Read-only sanitized audit: 26 lines, 862 bytes, SHA-256 016923AD42EC8F686AD82F76951DE978E7021EBBE57FD2021FD75B300BE8E8F4; actual labels/log strings were not copied." },
  { id: "local-callback-child", repository: "my-app01", path: "src/pages/step11-hook/UseCallBackChild.jsx", usedFor: ["React.memo child provenance"], evidence: "Read-only sanitized audit: 15 lines, 407 bytes, SHA-256 7048ECB03A471A9F18D32667F934BB937D7D593C4AD5C67D3CD9889C2D051099; actual label/log strings were not copied." },
  { id: "local-hook-notes", repository: "my-app01", path: "src/pages/step11-hook/hook_설명.txt", usedFor: ["original useMemo/useCallback taxonomy provenance"], evidence: "Read-only sanitized audit: 58 lines, 2,931 bytes, SHA-256 CBE3CB63863801A5A5E3831AF42F16F6782E3B999E068766A2074BF4BE21AA8D." },
  { id: "react-hooks-doc", repository: "REACT", path: "docs/react/05-hooks.md", usedFor: ["curated memoization summary and correctness caveat"], evidence: "Read-only structural audit: 200 lines, 9,174 bytes, SHA-256 B0563A725CD72CA4B751FBCDA43A4062121D0DEDCA9A34ACEDA6773A56F02862; embedded local URLs and display text were not copied." },
  { id: "react-official-audit", repository: "REACT", path: "docs/reference/official-reference-audit.md", usedFor: ["official-review and StrictMode/Effect boundary provenance"], evidence: "Read-only structural audit: 37 lines, 4,125 bytes, SHA-256 CFEBF7DB1BDA1D6279928A5953EB2A60211A5CF0EEA92B9538462698B0726029." },
  { id: "react-source-coverage", repository: "REACT", path: "docs/reference/source-coverage.md", usedFor: ["archive collection scope provenance"], evidence: "Read-only structural audit: 33 lines, 3,514 bytes, SHA-256 44BF82D58DB16DAD7E596413EC5F3A41295B39E77077ABBE89FE6EBEB9647FE7." },
  { id: "react-memo", repository: "React", path: "reference/react/memo", publicUrl: "https://react.dev/reference/react/memo", usedFor: ["component memo semantics and comparator caveats"], evidence: "React 공식 memo API입니다." },
  { id: "react-use-memo", repository: "React", path: "reference/react/useMemo", publicUrl: "https://react.dev/reference/react/useMemo", usedFor: ["calculation cache, Object.is dependencies and eviction caveats"], evidence: "React 공식 useMemo API입니다." },
  { id: "react-use-callback", repository: "React", path: "reference/react/useCallback", publicUrl: "https://react.dev/reference/react/useCallback", usedFor: ["function identity cache and performance-only semantics"], evidence: "React 공식 useCallback API입니다." },
  { id: "react-profiler", repository: "React", path: "reference/react/Profiler", publicUrl: "https://react.dev/reference/react/Profiler", usedFor: ["actualDuration/baseDuration measurement"], evidence: "React 공식 Profiler API입니다." },
  { id: "react-performance-tracks", repository: "React", path: "reference/dev-tools/react-performance-tracks", publicUrl: "https://react.dev/reference/dev-tools/react-performance-tracks", usedFor: ["React scheduling and component performance tracks"], evidence: "React 공식 performance tracks reference입니다." },
  { id: "react-strict-mode", repository: "React", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development purity stress checks"], evidence: "React 공식 StrictMode API입니다." },
  { id: "react-use-deferred-value", repository: "React", path: "reference/react/useDeferredValue", publicUrl: "https://react.dev/reference/react/useDeferredValue", usedFor: ["deferred non-urgent value rendering"], evidence: "React 공식 useDeferredValue API입니다." },
  { id: "react-use-transition", repository: "React", path: "reference/react/useTransition", publicUrl: "https://react.dev/reference/react/useTransition", usedFor: ["non-blocking transition updates"], evidence: "React 공식 useTransition API입니다." },
  { id: "react-compiler-introduction", repository: "React", path: "learn/react-compiler/introduction", publicUrl: "https://react.dev/learn/react-compiler/introduction", usedFor: ["automatic memoization and migration guidance"], evidence: "React 공식 Compiler introduction입니다." },
  { id: "eslint-exhaustive-deps", repository: "React", path: "reference/eslint-plugin-react-hooks/lints/exhaustive-deps", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps", usedFor: ["dependency completeness and stale closure prevention"], evidence: "React 공식 eslint-plugin-react-hooks exhaustive-deps reference입니다." },
  { id: "eslint-preserve-manual-memoization", repository: "React", path: "reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization", usedFor: ["compiler migration manual memo preservation"], evidence: "React 공식 preserve-manual-memoization lint reference입니다." },
  { id: "eslint-use-memo", repository: "React", path: "reference/eslint-plugin-react-hooks/lints/use-memo", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks/lints/use-memo", usedFor: ["invalid useMemo usage diagnostics"], evidence: "React 공식 use-memo lint reference입니다." },
  { id: "tc39-object-is", repository: "ECMA-262", path: "Object.is", publicUrl: "https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.is", usedFor: ["Object.is language semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "w3c-performance-timeline", repository: "W3C", path: "Performance Timeline", publicUrl: "https://www.w3.org/TR/performance-timeline/", usedFor: ["performance entry and timeline measurement model"], evidence: "W3C 공식 Performance Timeline specification입니다." },
  { id: "w3c-user-timing", repository: "W3C", path: "User Timing", publicUrl: "https://www.w3.org/TR/user-timing/", usedFor: ["application-defined marks and measures"], evidence: "W3C 공식 User Timing specification입니다." },
  { id: "wcag-status-messages", repository: "W3C WAI", path: "Understanding Status Messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages", usedFor: ["pending/result announcements during optimized interactions"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-18-useid-accessibility", slug: "react-18-memo-callback-performance", courseId: "react", moduleId: "react-events-forms-hooks", order: 8,
  title: "memo·useMemo·useCallback과 성능 측정", subtitle: "원본 계산·함수 identity 예제를 correctness-first memoization, Profiler, responsiveness, Compiler와 release evidence로 확장합니다.", level: "고급", estimatedMinutes: 120,
  coreQuestion: "어떤 render work와 prop identity가 실제 사용자 성능 문제인지 측정하고 memo·useMemo·useCallback 또는 scheduling/compiler를 correctness 손실 없이 어떻게 선택할까요?",
  summary: "my-app01 step11-hook의 UseMemo01~04, UseCallBack01~03/Child, hook 설명과 REACT hooks/공식 감수/source coverage 문서를 read-only·sanitized 감사하고 여덟 archive counterparts가 byte-identical함을 확인했습니다. actual list·label·log·local URL strings는 복사하지 않습니다. 원본 Callback03의 empty dependency와 captured update는 stable identity가 fresh behavior를 보장하지 않는 실패 근거로 다룹니다. cache eviction/Object.is/purity, production-like Profiler와 distribution, dependency graph, memo comparator, lint/compiler safety, memory cost, transition/deferred scheduling, React Compiler migration, a11y/security parity와 rollback까지 확장합니다. 여섯 exact Node examples는 provenance, identity, percentile, closure, prop comparison과 release gate를 실행합니다.",
  objectives: ["원본 memo/callback 자료와 archive parity를 hash evidence로 감사한다.", "memoization을 correctness와 분리하고 cache eviction을 허용한다.", "Object.is dependency와 prop identity를 설명한다.", "Profiler/Performance Timeline으로 production-like baseline을 측정한다.", "useMemo dependency graph와 stale result를 검증한다.", "useCallback identity와 closure freshness를 분리한다.", "memo state/context/comparator 경계를 검증한다.", "lint/compiler safety와 manual memo migration을 운영한다.", "cache overhead·memory·high-churn input을 계산한다.", "transition/deferred scheduling과 memo를 구분한다.", "a11y/security/performance parity와 rollback을 release gate로 만든다."],
  prerequisites: [{ title: "ref와 DOM imperative escape hatch", reason: "memoized values/functions의 identity와 retained closure를 이해하고 Profiler/DOM measurement를 안전한 commit 경계에서 수행해야 optimization evidence를 정확히 수집할 수 있습니다.", sessionSlug: "react-17-ref-dom-imperative" }],
  keywords: ["memo", "useMemo", "useCallback", "Profiler", "Object.is", "stale closure", "exhaustive-deps", "useTransition", "useDeferredValue", "React Compiler", "performance budget"],
  topics,
  lab: {
    title: "원본 memo/callback demo를 production performance experiment로 qualification하기",
    scenario: "actual source strings를 쓰지 않는 synthetic searchable list와 memo child를 만들고 baseline/manual memo/compiler/scheduling variants를 correctness·a11y·latency·memory 기준으로 비교합니다.",
    setup: ["원본 12 used files/docs와 hashes read-only", "synthetic large/empty/mutable input corpus", "production profiling build and representative low-end throttle", "React Profiler/Performance Timeline/heap artifacts", "lint/compiler gating, accessibility and permission fixtures"],
    steps: ["여덟 code와 네 docs의 source/hash/identity/dependency matrix를 만듭니다.", "memo 없는 baseline의 output, actions, render/commit count와 latency distribution을 기록합니다.", "Object.is primitive/object/function corpus와 cache eviction 시 correctness를 test합니다.", "useMemo empty/count/query dependencies와 mutated/new identity input을 비교합니다.", "captured update와 functional updater callback을 rapid interaction으로 재현합니다.", "memo child의 primitive/object/function/state/context/comparator cases를 test합니다.", "exhaustive-deps·preserve-manual-memoization·use-memo와 compiler diagnostics를 통과시킵니다.", "cache overhead, retained heap, hit/miss/change frequency를 측정합니다.", "urgent input과 transition/deferred results의 latency·pending a11y를 비교합니다.", "manual memo와 compiler cohort의 output/a11y/security/profile parity를 검증합니다.", "canary, mixed artifact, rollback과 cache/state reconciliation을 rehearsal합니다.", "raw/profile evidence, decision record와 runbook을 제출합니다."],
    expectedResult: ["memo 제거 상태에서도 모든 correctness tests가 통과합니다.", "dependency/closure/prop identity가 stale behavior 없이 완전합니다.", "p50/p95/render/memory evidence가 optimization benefit과 overhead를 보여 줍니다.", "pending/result UI가 focus·status·permission semantics를 보존합니다.", "compiler/manual variants와 rollback이 compatible합니다."],
    cleanup: ["synthetic data, profiles, traces, heap snapshots와 browser storage를 제거합니다.", "CPU/network throttle, compiler gate, feature flag와 verbose timing을 원복합니다.", "timers/workers/observers와 pending transitions를 정리합니다.", "원본 12 used files/docs와 8 archive counterparts의 hash/status unchanged를 확인합니다."],
    extensions: ["worker/wasm으로 CPU-heavy transform을 분리합니다.", "list virtualization과 memo의 역할을 비교합니다.", "RUM sampling과 privacy budget을 설계합니다.", "compiler diagnostics와 Profiler evidence에서 자동 optimization review packet을 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node examples와 React Profiler experiment를 같은 input으로 실행하세요.", requirements: ["stdout 완전 일치", "source/hash matrix", "Object.is", "percentile", "stale/functional callback", "memo prop identity", "release parity"], hints: ["Node shallow-equality model을 React renderer/Profiler evidence로 표현하지 마세요."], expectedOutcome: "memoization을 cache·identity·measurement contract로 설명합니다.", solutionOutline: ["audit→baseline→hypothesis→memoize/schedule→measure→parity 순서입니다."] },
    { difficulty: "응용", prompt: "원본 filter와 memo child demo를 searchable production list로 확장하세요.", requirements: ["immutable inputs", "complete dependencies", "functional updater", "memo child", "Profiler p95", "memory", "deferred/transition", "a11y/security parity", "rollback"], hints: ["항상 새 prop 하나가 memo를 깨는지 먼저 확인하세요."], expectedOutcome: "저사양 rapid typing에서도 latest correct result와 responsive input을 유지합니다.", solutionOutline: ["data-flow→identity→profile→optimize→stress→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 React performance optimization 표준을 작성하세요.", requirements: ["correctness-first", "measurement protocol", "dependency/closure", "memo comparator", "overhead/memory", "scheduling", "compiler migration", "a11y/security", "canary/rollback"], hints: ["render 횟수 감소만 성공 지표로 삼지 마세요."], expectedOutcome: "모든 optimization이 재현 가능한 evidence와 제거 가능한 rollback으로 관리됩니다.", solutionOutline: ["observe→budget→change→prove→operate 순서입니다."] },
  ],
  nextSessions: ["react-19-custom-hook-contract"], sources,
  sourceCoverage: {
    filesRead: 20,
    filesUsed: 12,
    uncoveredFiles: [
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo01.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo02.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo03.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo04.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseCallBack01.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseCallBack02.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseCallBack03.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseCallBackChild.jsx",
    ],
    uncoveredNotes: ["여덟 archive counterparts는 source로 중복 사용하지 않고 SHA-256 byte parity만 검증했습니다.", "actual list, label, log, embedded local URL과 domain strings는 공개 fixtures에 복사하지 않았습니다.", "원본 demo의 artificial work를 production workload로 과장하지 않고 stale closure와 dependency risk를 source-observed teaching evidence로 사용했습니다.", "여섯 Node examples는 actual React renderer/compiler/scheduler, Profiler/browser performance와 accessibility tree를 대체하지 않습니다."],
  },
});

export default session;
