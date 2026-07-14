import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-effect-audit", title: "원본 Effect 다섯 예제를 render·commit·external I/O 근거로 감사합니다",
    lead: "빈/없는/선택 dependency와 fetch 예제를 학습 history로 보존하면서 개발에서 한 번, 매 렌더 뒤 같은 단순 문구가 정확한 lifecycle guarantee가 아님을 교정합니다.",
    mechanism: "EffectTest01~04는 dependency array 형태에 따른 재동기화 차이를 console로 보여 주고 EffectTest05는 mount 후 external fetch와 list render를 시도합니다. 그러나 StrictMode probe, cleanup, response.ok, abort, schema, loading/error와 external asset/privacy는 설명하지 않습니다.",
    workflow: "각 Effect의 external system, setup side effect, reactive reads/dependencies, cleanup, rerun trigger, failure/result UI와 test evidence를 table로 만들고 console order를 component contract와 분리합니다.",
    invariants: "원본은 read-only이고 실제 third-party endpoint/data/image는 공개 lab에서 호출·복사하지 않으며, Effect는 external system synchronization에만 사용하고 render 계산을 우회하지 않습니다.",
    edgeCases: "StrictMode setup-cleanup-setup, dependency unchanged/changed, hidden/unmounted tree, slow/offline/HTTP error/malformed data, prop change와 server rendering을 다룹니다.",
    failureModes: "empty dependencies를 production lifetime exactly once로 오해하고 response object truthiness만 확인해 4xx를 success처럼 parse하며 cleanup 없는 request가 unmount 뒤 state를 갱신할 수 있습니다.",
    verification: "source hash, render/commit/effect trace, dependency matrix, setup-cleanup balance, mocked HTTP status/schema/race와 production build를 실행합니다.",
    operations: "effect kind, owner, active subscription/request count, failure/latency와 cleanup imbalance를 privacy-safe reason codes로 관찰하고 external provider fallback/rollback을 둡니다.",
    concepts: [
      c("Effect inventory", "component별 external system, setup, reactive dependencies, cleanup, failure와 owner를 정리한 표입니다.", ["불필요한 Effect를 찾습니다.", "운영 resource와 연결합니다."]),
      c("commit evidence", "React가 계산한 tree를 host environment에 반영한 뒤 Effect가 synchronization을 수행했다는 runtime 관찰입니다.", ["render log와 구분합니다.", "console 횟수가 contract는 아닙니다."]),
      c("external system", "React가 소유하지 않는 network, browser API, subscription, timer, widget 또는 storage interface입니다.", ["Effect의 주된 대상입니다.", "render 계산과 구분합니다."]),
    ],
    codeExamples: [node("react15-source-audit", "Effect source gap inventory", "React15Audit.mjs", "dependency examples에서 관찰된 것과 production qualification에 필요한 gaps를 stable codes로 출력합니다.", String.raw`const checks = [
  ["empty-deps-demo", true],
  ["no-deps-demo", true],
  ["selected-deps-demo", true],
  ["cleanup", false],
  ["response-status", false],
  ["abort-race", false],
  ["schema-ui-states", false],
];
console.log("observed=" + checks.filter((x) => x[1]).length);
console.log("gaps=" + checks.filter((x) => !x[1]).map((x) => x[0]).join(","));
console.log("qualified=" + checks.every((x) => x[1]));`, "observed=3\ngaps=cleanup,response-status,abort-race,schema-ui-states\nqualified=false", ["local-effect1", "local-effect2", "local-effect3", "local-effect4", "local-effect5", "local-hooks-doc"])],
  }),
  appliedTopic({
    id: "effect-external-sync", title: "Effect를 external system synchronization으로 제한합니다",
    lead: "component가 render됐으니 무언가 실행한다는 lifecycle callback으로 보지 않고 현재 React state/props를 React 밖 system과 맞추는 독립 process로 정의합니다.",
    mechanism: "React는 commit 뒤 setup function을 실행하고 dependencies가 바뀌면 이전 cleanup 뒤 새 setup을 실행하며 unmount에서 마지막 cleanup을 수행합니다. Effect는 event handler와 render calculation의 대체물이 아닙니다.",
    workflow: "먼저 Effect 없이 render/event에서 해결 가능한지 묻고 external system이 있으면 connection identity, setup, cleanup와 reactive configuration을 하나의 Effect process로 둡니다.",
    invariants: "같은 setup이 여러 번 호출되어도 cleanup과 대칭이며 render 중 external mutation이 없고 user action mutation은 해당 event handler에서 시작합니다.",
    edgeCases: "development StrictMode, interrupted render that never commits, hidden/offscreen trees, parent remount/key reset, server render와 browser hydration을 다룹니다.",
    failureModes: "analytics POST나 구매 mutation을 mount Effect에 두면 navigation/remount/probe로 중복되고 render body에서 DOM/storage를 바꾸면 concurrent rendering과 purity가 깨집니다.",
    verification: "setup/cleanup counters, repeated mount/unmount, StrictMode, aborted render, event-only mutation와 server/client boundary tests를 실행합니다.",
    operations: "active external handles와 duplicate mutation idempotency를 관찰하고 feature disable, connection drain와 cleanup runbook을 둡니다.",
    concepts: [
      c("synchronization process", "현재 React inputs를 external system configuration/state와 일치시키는 setup-cleanup lifecycle입니다.", ["독립 process로 설계합니다.", "event mutation과 다릅니다."]),
      c("commit phase", "render 결과가 host environment에 적용되는 단계로 passive Effect setup의 선행 경계입니다.", ["render phase와 구분합니다.", "server behavior를 확인합니다."]),
      c("symmetric cleanup", "setup이 만든 connection/subscription/resource를 같은 identity와 scope로 되돌리는 함수입니다.", ["재실행 가능해야 합니다.", "unmount에서 호출됩니다."]),
    ],
    codeExamples: [node("react15-effect-machine", "setup·dependency change·cleanup state machine", "React15EffectMachine.mjs", "Effect process가 dependency change마다 old cleanup 뒤 new setup하고 unmount에서 balance를 맞추는지 계산합니다.", String.raw`let active = null, setups = 0, cleanups = 0;
function sync(key) {
  if (Object.is(active, key)) return "unchanged";
  if (active !== null) { cleanups += 1; active = null; }
  active = key; setups += 1; return "setup:" + key;
}
function unmount() {
  if (active !== null) { cleanups += 1; active = null; }
}
console.log(sync("a"));
console.log(sync("a"));
console.log(sync("b"));
unmount();
console.log("setups=" + setups + ",cleanups=" + cleanups + ",active=" + active);`, "setup:a\nunchanged\nsetup:b\nsetups=2,cleanups=2,active=null", ["react-use-effect", "react-synchronizing", "react-lifecycle-effects"])],
  }),
  appliedTopic({
    id: "render-event-effect-choice", title: "render 계산·user event·Effect의 책임을 decision tree로 나눕니다",
    lead: "값을 계산하거나 button click 때문에 해야 할 일을 Effect에 옮겨 extra render와 stale synchronization을 만들지 않도록 발생 원인과 owner를 기준으로 위치를 고릅니다.",
    mechanism: "props/state에서 바로 계산되는 value는 render에, 특정 user interaction로 발생한 mutation은 event handler에, component가 화면에 존재하는 동안 external system과 맞춰야 하는 일은 Effect에 둡니다.",
    workflow: "요구사항 문장을 because-of-render, because-of-event, because-of-external-subscription으로 분류하고 pure derivation→event→Effect 순서로 가장 좁은 owner를 선택합니다.",
    invariants: "derived value를 state+Effect로 복제하지 않고 event identity와 payload를 잃지 않으며 Effect가 UI state를 무한히 되먹임하지 않습니다.",
    edgeCases: "navigation analytics, initial focus, data prefetch, form submit result, prop-driven widget configuration, cache subscription와 server action을 다룹니다.",
    failureModes: "fullName을 Effect로 state에 저장하면 stale 한 frame과 extra render가 생기고 event result notification을 Effect에서 감지하면 remount 때 재표시됩니다.",
    verification: "no-extra-render assertions, event replay/remount, pure derived property tests, Effect inventory review와 user-visible outcome tests를 실행합니다.",
    operations: "Effect 수 자체보다 external handle/resource/error budget과 unnecessary render/latency를 profiler와 static review로 관리합니다.",
    concepts: [
      c("derived render value", "현재 props/state에서 side effect 없이 즉시 계산할 수 있어 별도 state가 필요 없는 값입니다.", ["render에서 계산합니다.", "비용은 필요 시 측정합니다."]),
      c("event-caused action", "특정 user/system event의 identity와 payload 때문에 수행하는 mutation입니다.", ["handler에서 시작합니다.", "Effect로 추론하지 않습니다."]),
      c("existence synchronization", "component가 현재 configuration으로 mounted되어 있다는 사실 때문에 external system을 연결·갱신하는 process입니다.", ["Effect에 적합합니다.", "cleanup이 필요합니다."]),
    ],
    codeExamples: [node("react15-placement", "render·event·Effect placement 분류", "React15Placement.mjs", "요구사항 원인을 explicit categories로 분류하고 ambiguous/missing owner를 거부합니다.", String.raw`function place(job) {
  if (job.source === "inputs" && !job.external) return "render";
  if (job.source === "event") return "event";
  if (job.source === "existence" && job.external) return "effect";
  return "redesign";
}
for (const job of [
  { source: "inputs", external: false },
  { source: "event", external: true },
  { source: "existence", external: true },
  { source: "inputs", external: true },
]) console.log(place(job));`, "render\nevent\neffect\nredesign", ["react-you-might-not-need-effect", "react-separating-events-effects", "react-purity"])],
  }),
  appliedTopic({
    id: "dependency-reactive-values", title: "reactive value와 Object.is 비교를 기준으로 dependency를 완전하게 선언합니다",
    lead: "빈 배열이나 lint 억제를 원하는 실행 횟수 스위치로 사용하지 않고 setup code가 읽는 props/state/component-scoped values가 왜 dependency인지 dataflow로 증명합니다.",
    mechanism: "dependency list는 setup이 읽는 reactive values를 고정 길이 inline array로 선언하고 React는 이전 값과 Object.is로 비교해 재동기화를 결정합니다. 선택이 아니라 code에서 도출됩니다.",
    workflow: "Effect setup/cleanup에서 읽는 identifiers를 inventory하고 reactive 여부를 판정해 exhaustive-deps를 통과시키며 불필요한 dependency는 code structure를 바꿔 제거합니다.",
    invariants: "dependency를 숨기기 위해 lint disable, ref mutation이나 empty array를 쓰지 않고 every reactive read가 list 또는 Effect 밖 stable/non-reactive path에 있습니다.",
    edgeCases: "NaN, -0, object/function new reference, optional values, derived primitive, module constant, ref.current, custom Hook와 dynamic dependency length를 다룹니다.",
    failureModes: "누락 dependency는 stale connection/config를 만들고 매 render 새 object/function dependency는 unnecessary reruns 또는 loop를 만듭니다.",
    verification: "dependency extraction review, Object.is matrix, prop/state changes, stale closure, function/object identity와 lint rule tests를 실행합니다.",
    operations: "dependency lint version/compiler changes를 CI에서 qualification하고 suppression은 owner/reason/expiry와 runtime regression tests를 요구합니다.",
    concepts: [
      c("reactive value", "component render에 참여하고 props, state 또는 component body declaration으로 render마다 달라질 수 있는 value입니다.", ["Effect read는 dependency가 됩니다.", "module constant와 구분합니다."]),
      c("Object.is", "React dependencies와 여러 equality decisions에 사용되는 JavaScript same-value comparison입니다.", ["NaN과 -0 semantics가 있습니다.", "deep compare가 아닙니다."]),
      c("exhaustive dependency", "Effect가 읽는 모든 reactive values를 빠짐없이 선언한 dependency contract입니다.", ["lint가 돕습니다.", "실행 횟수 취향이 아닙니다."]),
    ],
    codeExamples: [node("react15-dependency-diff", "Object.is 기반 dependency 변화 계산", "React15Deps.mjs", "primitive, NaN, -0와 new object references의 재동기화 여부를 출력합니다.", String.raw`function changed(before, after) {
  return before.length !== after.length || before.some((value, index) => !Object.is(value, after[index]));
}
const stableObject = { id: 1 };
console.log("same=" + changed([1, "a", stableObject], [1, "a", stableObject]));
console.log("primitive=" + changed([1], [2]));
console.log("nan=" + changed([NaN], [NaN]));
console.log("negative-zero=" + changed([-0], [0]));
console.log("new-object=" + changed([{ id: 1 }], [{ id: 1 }]));`, "same=false\nprimitive=true\nnan=false\nnegative-zero=true\nnew-object=true", ["react-use-effect", "react-effect-dependencies", "mdn-object-is"])],
  }),
  appliedTopic({
    id: "remove-dependencies-restructure", title: "object·function dependency를 숨기지 않고 code를 재구조화합니다",
    lead: "Effect가 매 render 실행되는 문제를 useMemo/useCallback로 무조건 감싸거나 lint에서 지우지 않고 생성 위치, primitive extraction와 Effect responsibility를 줄여 해결합니다.",
    mechanism: "Effect 밖에서 만들어 매 render 새 reference인 options/function은 dependency를 흔듭니다. setup 안에서 non-reactive helper를 만들거나 primitive props만 전달하고 Effect event/non-reactive read를 구분할 수 있습니다.",
    workflow: "먼저 Effect 필요성을 제거하고, 남으면 read values를 primitive로 좁히고 object/function construction을 setup 내부로 이동하며 genuinely shared function만 stable API로 만듭니다.",
    invariants: "memoization은 correctness patch가 아니고 dependencies는 완전하며 non-reactive read가 latest value 또는 snapshot 중 어떤 의미인지 명시합니다.",
    edgeCases: "callback prop, option objects, debounced functions, event listener identity, mutable refs, Effect Event availability/version와 custom Hooks를 다룹니다.",
    failureModes: "빈 dependency callback은 stale state를 캡처하고 object를 JSON.stringify dependency로 바꾸면 order/cost/type 문제가 생기며 ref escape는 updates를 숨깁니다.",
    verification: "behavior first, rerun counts second로 assert하고 stale/latest scenarios, listener add/remove identity, profiler와 linter/compiler tests를 실행합니다.",
    operations: "optimization/helper abstraction은 measured rerun/resource cost와 owner를 문서화하고 React/compiler upgrades에서 다시 benchmark합니다.",
    concepts: [
      c("dependency restructuring", "reactive read와 object/function creation 위치를 바꿔 Effect가 실제 synchronization inputs에만 의존하게 하는 설계입니다.", ["dependency를 삭제하는 것이 아닙니다.", "Effect responsibility를 줄입니다."]),
      c("non-reactive read", "Effect re-synchronization trigger가 되지 않으면서 실행 시점의 latest value를 읽는 명시적 pattern입니다.", ["지원 API/version을 확인합니다.", "snapshot semantics와 구분합니다."]),
      c("listener identity", "add와 remove가 같은 callback/reference와 target/options 조합을 사용해야 cleanup되는 external subscription identity입니다.", ["wrapper 생성 위치에 영향 받습니다.", "cleanup test가 필요합니다."]),
    ],
  }),
  appliedTopic({
    id: "state-update-loop", title: "Effect→state→render→Effect feedback loop와 stale derived state를 제거합니다",
    lead: "Effect가 state를 set한다는 사실 자체가 오류는 아니지만 dependency를 다시 바꾸는 unconditional update가 loop를 만들고 derived values를 복제하면 extra render와 drift가 생깁니다.",
    mechanism: "Effect setup이 state를 update하면 new render가 예약되고 그 state 또는 새 reference가 dependency를 바꾸면 Effect가 다시 실행됩니다. final value가 stable해도 unnecessary render가 남을 수 있습니다.",
    workflow: "state update의 외부 evidence source와 equality/idempotency를 확인하고 pure derivation은 render로, subscription snapshot은 useSyncExternalStore 계열 contract로, event update는 handler로 이동합니다.",
    invariants: "Effect state update는 external system의 changed snapshot에 근거하고 same semantic value에는 update하지 않으며 loop termination을 explicit test합니다.",
    edgeCases: "new array/object every poll, setState functional update, batching, async responses, derived sorted/filter data, browser resize/storage와 external store tearing을 다룹니다.",
    failureModes: "dependency object를 Effect에서 새 object state로 set하면 무한 loop가 나고 props list를 filtered state로 mirror하면 prop/filter changes 사이 stale 결과가 보입니다.",
    verification: "render/effect/update counts, semantic equality, max-step guard, derived property tests, external store concurrent snapshot와 profiler를 실행합니다.",
    operations: "render loop errors, long tasks, update depth와 effect churn을 release telemetry와 alert로 관찰하고 feature disable/rollback을 둡니다.",
    concepts: [
      c("feedback loop", "Effect update가 자신의 dependency를 바꿔 다시 Effect를 실행하는 cycle입니다.", ["termination 조건이 필요합니다.", "대개 ownership을 재검토합니다."]),
      c("mirrored state", "props/derived value를 별도 state로 복제해 synchronization이 필요한 상태입니다.", ["가능하면 제거합니다.", "editable draft는 예외 정책이 필요합니다."]),
      c("external snapshot", "React 밖 store/system의 현재 일관된 value로 subscription notification과 함께 읽는 값입니다.", ["concurrent-safe contract가 필요합니다.", "Effect mirror와 비교합니다."]),
    ],
    codeExamples: [node("react15-loop-detector", "Effect feedback transition termination 검사", "React15Loop.mjs", "semantic equality가 없는 update와 capped idempotent update의 차이를 step 수로 확인합니다.", String.raw`function run(update, initial, limit = 8) {
  let state = initial, steps = 0;
  while (steps < limit) {
    const next = update(state);
    if (Object.is(next, state)) return { stable: true, steps, state };
    state = next; steps += 1;
  }
  return { stable: false, steps, state };
}
console.log(JSON.stringify(run((value) => Math.min(value + 1, 3), 0)));
console.log(JSON.stringify(run((value) => ({ count: value.count }), { count: 1 }, 4)));`, "{\"stable\":true,\"steps\":3,\"state\":3}\n{\"stable\":false,\"steps\":4,\"state\":{\"count\":1}}", ["react-you-might-not-need-effect", "react-updating-effect-state", "react-state-structure"])],
  }),
  appliedTopic({
    id: "browser-subscription-timer", title: "browser subscription·timer·document/widget synchronization의 owner와 cleanup을 명시합니다",
    lead: "Effect의 적합한 사례에서도 target, callback, interval와 options identity를 한 lifecycle로 묶고 event frequency, background behavior와 SSR absence를 고려합니다.",
    mechanism: "setup은 addEventListener, observer, timer 또는 widget connect를 수행하고 cleanup은 exact identity로 remove/disconnect/clear합니다. dependencies가 바뀌면 old external configuration을 먼저 해제합니다.",
    workflow: "external API의 acquire/update/release contract, target lifetime, frequency/backpressure와 initial snapshot을 문서화하고 custom Hook으로 좁은 typed interface를 제공합니다.",
    invariants: "listener/timer가 component instances마다 누적되지 않고 cleanup 뒤 callback이 current component state를 update하지 않으며 server render에서 browser globals를 읽지 않습니다.",
    edgeCases: "capture/passive options, throttled background tabs, visibility change, ResizeObserver loop, multiple roots, HMR, widget imperative update와 permission denial을 다룹니다.",
    failureModes: "anonymous listener를 remove할 수 없거나 interval cleanup 누락으로 duplicate callbacks가 생기고 window access가 SSR/build에서 실패합니다.",
    verification: "add/remove balance, fake timers, repeated mount/dependency changes, background/visibility, server import/render와 resource leak tests를 실행합니다.",
    operations: "active handles, callback rate/queue delay와 permission/error codes를 관찰하고 circuit/disconnect/reconnect runbook을 둡니다.",
    concepts: [
      c("subscription", "external system change notifications를 callback으로 받기 위해 등록하는 long-lived relationship입니다.", ["unsubscribe가 필요합니다.", "snapshot read와 결합합니다."]),
      c("resource handle", "timer id, observer, connection 또는 widget instance처럼 cleanup에 필요한 external identity입니다.", ["setup scope에 보존합니다.", "leak counters를 둡니다."]),
      c("backpressure", "external event 생산 속도가 UI 처리 능력을 넘을 때 sampling, coalescing, queue limit 등으로 부하를 통제하는 정책입니다.", ["단순 debounce와 다를 수 있습니다.", "latest/all semantics를 정합니다."]),
    ],
    codeExamples: [node("react15-subscription-balance", "subscription acquire/release balance", "React15Subscriptions.mjs", "mount/reconfigure/unmount sequence에서 active handle 수가 zero로 돌아가는지 실행합니다.", String.raw`let nextId = 1;
const active = new Set();
function acquire() { const id = nextId++; active.add(id); return id; }
function release(id) { return active.delete(id); }
let handle = acquire();
console.log("after-mount=" + active.size);
release(handle); handle = acquire();
console.log("after-reconfigure=" + active.size);
console.log("wrong-release=" + release(999));
release(handle);
console.log("after-unmount=" + active.size);`, "after-mount=1\nafter-reconfigure=1\nwrong-release=false\nafter-unmount=0", ["react-synchronizing", "react-lifecycle-effects", "mdn-event-target", "mdn-timers"])],
  }),
  appliedTopic({
    id: "effect-fetching-boundary", title: "Effect fetch의 loading·status·schema·cache·framework 대안을 구분합니다",
    lead: "mount Effect에서 fetch 한 번을 호출하는 초급 예제를 production data layer로 일반화하지 않고 routing, SSR, cache, waterfalls와 race를 고려해 ownership을 선택합니다.",
    mechanism: "plain Effect fetch는 client commit 뒤 시작해 server HTML에 data가 없고 parent-child waterfalls, no shared cache와 race handling을 직접 구현해야 합니다. framework loader 또는 query cache가 더 적합할 수 있습니다.",
    workflow: "route/data requirements에서 server/client timing, cache identity/freshness, auth, cancellation, retry와 error boundary를 결정하고 Effect가 필요한 경우 request state machine과 cleanup을 완성합니다.",
    invariants: "response.ok/status/media/schema를 확인하고 unknown payload를 projection하며 raw provider image/fields를 directly render하지 않고 loading/error/empty/success를 exhaustive하게 표시합니다.",
    edgeCases: "204, 304/cache, 4xx/5xx, HTML proxy error, slow/offline, out-of-order, duplicate component, pagination, rate limit, auth expiry와 partial data를 다룹니다.",
    failureModes: "if(!response)는 HTTP error를 잡지 못하고 response.json은 error HTML에서 실패하며 slice/map 전 schema 확인이 없으면 runtime error와 field exposure가 생깁니다.",
    verification: "status/media/schema matrix, loading/error/empty/success DOM, race/abort, cache dedup/stale, SSR/route navigation와 malicious payload tests를 실행합니다.",
    operations: "endpoint/status/reason/latency/cache hit/stale/fallback을 관찰하고 raw URL/query/PII를 redaction하며 provider quota/circuit/rollback을 운영합니다.",
    concepts: [
      c("request state machine", "idle/loading/success-empty/success-data/error/aborted와 retry transitions를 명시한 data fetch UI model입니다.", ["boolean 두 개보다 안전합니다.", "stale data 정책을 포함합니다."]),
      c("cache identity", "같은 data request를 공유·invalidate하기 위한 normalized key와 scope입니다.", ["auth/tenant/params를 포함합니다.", "raw secret을 key에 넣지 않습니다."]),
      c("network waterfall", "parent data 완료 후 child render가 시작되어 requests가 순차적으로 발생하는 latency pattern입니다.", ["route preloading/cache로 줄일 수 있습니다.", "Effect tree에서 흔합니다."]),
    ],
    codeExamples: [node("react15-http-classifier", "HTTP status·media·body state 분류", "React15Http.mjs", "response truthiness 대신 status/media/body shape를 확인해 UI result category를 결정합니다.", String.raw`function classify(response) {
  if (response.status === 204) return "empty";
  if (response.status === 429) return "rate-limit";
  if (response.status >= 500) return "transient";
  if (response.status < 200 || response.status >= 300) return "request-error";
  if (response.media !== "application/json") return "contract-media";
  if (!Array.isArray(response.body)) return "contract-shape";
  return response.body.length === 0 ? "empty" : "data";
}
for (const response of [
  { status: 200, media: "application/json", body: [1] },
  { status: 200, media: "text/html", body: "error" },
  { status: 404, media: "application/json", body: {} },
  { status: 429, media: "application/json", body: {} },
  { status: 503, media: "text/html", body: "" },
]) console.log(classify(response));`, "data\ncontract-media\nrequest-error\nrate-limit\ntransient", ["local-effect5", "fetch-standard", "rfc9110", "react-fetching-effects", "owasp-third-party-js"])],
  }),
  appliedTopic({
    id: "effect-observability-testing", title: "Effect를 fake lifecycle·real integration·StrictMode·production evidence로 검증합니다",
    lead: "Effect callback을 직접 호출하는 unit test보다 component mount, dependency changes, cleanup, external protocol과 user-visible outcome을 실제 owner lifecycle에서 검증합니다.",
    mechanism: "pure parsers/reducers는 unit test하고 component integration은 setup/cleanup spy와 user actions, browser/network는 protocol/fault, production build는 timing/resource/SSR/canary를 증명합니다.",
    workflow: "각 Effect inventory row에 deterministic fake, integration fixture, failure injection, resource balance, privacy telemetry와 rollback test를 연결합니다.",
    invariants: "test가 exact console call count나 development-only sequence에 고정되지 않고 final external/resource state와 user result, no-leak/no-stale-update를 assert합니다.",
    edgeCases: "StrictMode, rerender same/changed deps, unmount mid-request, delayed cleanup, hidden tab, error throw, server render/hydration, HMR와 multiple components를 다룹니다.",
    failureModes: "Effect callback만 unit 호출하면 React cleanup order와 dependency semantics를 검증하지 못하고 mock fetch가 status/body stream/race를 현실과 다르게 만들 수 있습니다.",
    verification: "pure unit, component StrictMode, mock server/browser, leak/resource counters, production SSR/build and canary rollback을 층별로 실행합니다.",
    operations: "effect churn/active handles/request abort/stale/error/latency budgets를 dashboard와 alert로 운영하고 high-cardinality values/PII는 제외합니다.",
    concepts: [
      c("lifecycle integration test", "component를 실제 mount/rerender/unmount해 setup·cleanup과 external result를 검증하는 test입니다.", ["callback 직접 호출과 다릅니다.", "StrictMode fixture를 포함합니다."]),
      c("resource balance", "test 또는 user flow 종료 뒤 acquired handles와 released handles가 맞고 active count가 expected baseline인 조건입니다.", ["leak를 탐지합니다.", "실패 경로도 포함합니다."]),
      c("stale update", "이전 dependency/request lifecycle의 결과가 새/current component state에 commit되는 잘못된 update입니다.", ["sequence/abort/cleanup으로 막습니다.", "race test가 필요합니다."]),
    ],
  }),
  appliedTopic({
    id: "effect-governance-release", title: "Effect custom Hook·lint·upgrade와 external dependency release를 운영합니다",
    lead: "잘 동작하는 한 component를 넘어 repeated synchronization을 custom Hook interface로 캡슐화하고 dependency lint, provider/browser upgrades와 operational recovery를 표준화합니다.",
    mechanism: "custom Hook은 external system과 React lifecycle을 좁은 values/actions/status API로 감싸고 internal Effect dependencies/cleanup을 소유합니다. consumer는 implementation detail을 재현하지 않습니다.",
    workflow: "Effect inventory에서 repeated process를 선택해 contract, inputs/status/errors, cleanup와 tests를 정의하고 lint/compiler/runtime/version matrix로 qualification합니다.",
    invariants: "custom Hook 이름/Rules of Hooks를 지키고 hidden global singleton이나 cross-user state를 만들지 않으며 external provider secret과 actual values를 public client에 넣지 않습니다.",
    edgeCases: "multiple consumers/shared connection, provider reconnect/backoff, browser permission, React version/compiler, SSR, test environment와 deprecation을 다룹니다.",
    failureModes: "generic useEffectOnce Hook은 reactive dependency를 숨기고 shared module connection은 tenant/component cleanup을 섞으며 external SDK upgrade가 silent behavior drift를 만듭니다.",
    verification: "contract tests, multi-consumer isolation, lint Rules/exhaustive deps, provider fault/reconnect, browser/SSR matrix, canary and rollback rehearsal를 실행합니다.",
    operations: "Hook version, active consumers/connections, failure/backoff/circuit state와 provider quota를 운영하고 owner, runbook, deprecation/migration을 둡니다.",
    concepts: [
      c("custom synchronization Hook", "한 external system process의 inputs, status/actions와 lifecycle cleanup을 reusable React interface로 캡슐화한 Hook입니다.", ["Effect detail을 숨깁니다.", "contract tests가 필요합니다."]),
      c("Rules of Hooks", "Hooks를 component/custom Hook top level에서 일관된 order로 호출하도록 하는 React 규칙입니다.", ["lint/compiler가 활용합니다.", "조건부 호출을 피합니다."]),
      c("reconnect policy", "connection failure 뒤 retry eligibility, delay/jitter, cap, circuit, user feedback와 cleanup을 정의한 운영 규칙입니다.", ["무한 즉시 retry를 피합니다.", "provider quota를 고려합니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "local-effect1", repository: "D:/dev/my-app01", path: "src/pages/step11-hook/EffectTest01.jsx", usedFor: ["empty dependency example", "render/effect log ordering"], evidence: "2026-07-14 read-only audit: 21 lines, 634 bytes, SHA-256 78AF9AAACAB5D37B6F267C7E2C7BC7B8B88A6CE99AB48AE3D2C781605051C227." },
  { id: "local-effect2", repository: "D:/dev/my-app01", path: "src/pages/step11-hook/EffectTest02.jsx", usedFor: ["missing dependency array example", "every commit explanation gap"], evidence: "2026-07-14 read-only audit: 20 lines, 592 bytes, SHA-256 44D8827825CC85A2A83101F2C53EFCDDDD7CEE8CD608D295A6D09C085BE057C3." },
  { id: "local-effect3", repository: "D:/dev/my-app01", path: "src/pages/step11-hook/EffectTest03.jsx", usedFor: ["single dependency example", "unrelated state"], evidence: "2026-07-14 read-only audit: 25 lines, 924 bytes, SHA-256 686DD021102AC7AEE441B65B8EF33C9B1F8D3172B923C9FB0009C1F9388A45F8." },
  { id: "local-effect4", repository: "D:/dev/my-app01", path: "src/pages/step11-hook/EffectTest04.jsx", usedFor: ["multiple dependencies", "rerun conditions"], evidence: "2026-07-14 read-only audit: 25 lines, 942 bytes, SHA-256 690B191B18971640CD634B9A18BFF655AC5807CEF3A7D85504B79F9699D8F06C." },
  { id: "local-effect5", repository: "D:/dev/my-app01", path: "src/pages/step11-hook/EffectTest05.jsx", usedFor: ["mount fetch", "response check defect", "no cleanup/schema/loading/error", "external image"], evidence: "2026-07-14 read-only audit: 39 lines, 1,128 bytes, SHA-256 55E6452095CEB4C578ECCB8DB4371022A8269DD9A985CCE16696183E78E27C89. 실제 endpoint/data/image는 호출·복사하지 않았습니다." },
  { id: "local-hooks-doc", repository: "D:/dev/REACT", path: "docs/react/05-hooks.md", usedFor: ["existing Effect walkthrough", "source-result context"], evidence: "2026-07-14 read-only audit: 200 lines, 9,174 bytes, SHA-256 B0563A725CD72CA4B751FBCDA43A4062121D0DEDCA9A34ACEDA6773A56F02862." },
  { id: "react-use-effect", repository: "React official API", path: "reference/react/useEffect", publicUrl: "https://react.dev/reference/react/useEffect", usedFor: ["setup/cleanup/dependencies", "client-only caveats"], evidence: "current useEffect API contract and caveats를 확인했습니다." },
  { id: "react-synchronizing", repository: "React official documentation", path: "learn/synchronizing-with-effects", publicUrl: "https://react.dev/learn/synchronizing-with-effects", usedFor: ["external synchronization", "cleanup/StrictMode"], evidence: "Effect synchronization and cleanup model을 확인했습니다." },
  { id: "react-lifecycle-effects", repository: "React official documentation", path: "learn/lifecycle-of-reactive-effects", publicUrl: "https://react.dev/learn/lifecycle-of-reactive-effects", usedFor: ["independent process", "start/stop cycles"], evidence: "reactive Effect lifecycle guidance를 확인했습니다." },
  { id: "react-you-might-not-need-effect", repository: "React official documentation", path: "learn/you-might-not-need-an-effect", publicUrl: "https://react.dev/learn/you-might-not-need-an-effect", usedFor: ["derived/event alternatives", "avoid chains"], evidence: "unnecessary Effect alternatives를 확인했습니다." },
  { id: "react-separating-events-effects", repository: "React official documentation", path: "learn/separating-events-from-effects", publicUrl: "https://react.dev/learn/separating-events-from-effects", usedFor: ["event vs Effect semantics", "non-reactive logic"], evidence: "events and Effect separation을 확인했습니다." },
  { id: "react-purity", repository: "React official documentation", path: "learn/keeping-components-pure", publicUrl: "https://react.dev/learn/keeping-components-pure", usedFor: ["render purity"], evidence: "pure component render constraints를 확인했습니다." },
  { id: "react-effect-dependencies", repository: "React official documentation", path: "learn/removing-effect-dependencies", publicUrl: "https://react.dev/learn/removing-effect-dependencies", usedFor: ["reactive dependency derivation", "restructuring"], evidence: "removing unnecessary dependencies without suppression guidance를 확인했습니다." },
  { id: "react-updating-effect-state", repository: "React official API", path: "reference/react/useEffect#updating-state-based-on-previous-state-from-an-effect", publicUrl: "https://react.dev/reference/react/useEffect#updating-state-based-on-previous-state-from-an-effect", usedFor: ["state update dependencies", "updater pattern"], evidence: "Effect state update dependency guidance를 확인했습니다." },
  { id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["avoid mirrored/duplicate state"], evidence: "state structure principles를 확인했습니다." },
  { id: "react-fetching-effects", repository: "React official API", path: "reference/react/useEffect#fetching-data-with-effects", publicUrl: "https://react.dev/reference/react/useEffect#fetching-data-with-effects", usedFor: ["Effect fetch example", "ignore/race caveat"], evidence: "official Effect data fetching example와 alternatives caveats를 확인했습니다." },
  { id: "mdn-object-is", repository: "MDN Web Docs", path: "JavaScript/Reference/Global_Objects/Object/is", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is", usedFor: ["dependency comparison semantics"], evidence: "Object.is same-value behavior를 확인했습니다." },
  { id: "mdn-event-target", repository: "MDN Web Docs", path: "Web/API/EventTarget/addEventListener", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener", usedFor: ["listener subscription/options"], evidence: "EventTarget listener contract를 확인했습니다." },
  { id: "mdn-timers", repository: "MDN Web Docs", path: "Web/API/Window/setInterval", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval", usedFor: ["timer handle/interval behavior"], evidence: "setInterval browser behavior and delay restrictions를 확인했습니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["fetch response/network semantics", "abort/integration"], evidence: "current Fetch Standard request/response model을 확인했습니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP status semantics", "4xx/5xx classification"], evidence: "HTTP semantics and status classes를 확인했습니다." },
  { id: "owasp-third-party-js", repository: "OWASP Cheat Sheet Series", path: "Third_Party_Javascript_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html", usedFor: ["third-party asset/provider risk"], evidence: "third-party client dependency/data risk principles를 확인했습니다." },
];

const session = createExpertSession({
    inventoryId: "react-15-effect-lifecycle-deps", slug: "react-15-effect-synchronization",
  courseId: "react", moduleId: "react-events-forms-hooks", order: 5,
  title: "Effect와 외부 시스템 동기화", subtitle: "render·event·Effect를 분리하고 reactive dependency, subscription, fetch와 cleanup을 실행 가능한 lifecycle로 설계합니다.",
  level: "중급", estimatedMinutes: 125,
  coreQuestion: "무엇을 Effect에 두어야 하며 reactive inputs가 바뀌는 동안 external system을 누수·중복·stale result 없이 어떻게 동기화할까요?",
  summary: "my-app01 EffectTest01~05와 REACT hooks 설명을 read-only로 감사해 empty/no/specific dependencies와 mount fetch의 실제 학습 흐름을 보존합니다. Effect를 external synchronization process로 정의하고 render/event 선택, complete dependencies와 Object.is, dependency restructuring, state feedback loop, browser subscriptions/timers, fetching status/schema/cache alternatives, lifecycle tests와 custom Hook governance까지 current React/WHATWG/IETF/OWASP sources와 일곱 Node examples로 확장합니다. 실제 third-party endpoint/data/image는 공개 examples에서 호출·복사하지 않고 원본의 response truthiness, cleanup/abort/schema/UI state gaps를 명시합니다.",
  objectives: ["원본 Effect examples의 보장과 gaps를 감사한다.", "Effect를 external synchronization process로 설명한다.", "render 계산·event action·Effect를 구분한다.", "reactive dependencies를 Object.is와 code dataflow로 도출한다.", "object/function dependency와 feedback loop를 구조적으로 제거한다.", "subscription/timer resource와 cleanup을 소유한다.", "Effect fetch의 HTTP/schema/UI/cache/race 경계를 설계한다.", "StrictMode/lifecycle/production integration과 resource balance를 검증한다.", "custom Hook, lint, provider upgrade와 rollback을 운영한다."],
  prerequisites: [{ title: "form validation과 오류 UX", reason: "async validation, abort, server error와 form state ownership을 이해하면 Effect가 필요한 external synchronization과 event-driven mutation을 정확히 분리할 수 있습니다.", sessionSlug: "react-14-form-validation-errors" }],
  keywords: ["useEffect", "synchronization", "dependency", "Object.is", "cleanup", "subscription", "timer", "fetch", "race", "StrictMode", "custom Hook", "exhaustive-deps"],
  topics,
  lab: {
    title: "원본 Effect·fetch 예제를 external process inventory와 resource-safe Hook으로 qualification하기",
    scenario: "원본 files는 변경하지 않고 synthetic HTTP/subscription/timer systems와 delayed failures를 사용하는 React fixture에서 setup, dependencies, cleanup와 UI result를 검증합니다.",
    setup: ["Node 20 이상", "React StrictMode development/production fixture", "disposable mock HTTP server", "fake timers/event target/subscription counters", "SSR import/render fixture", "원본 6 files read-only", "synthetic non-PII data"],
    steps: ["원본 6 files hash와 Effect inventory를 작성합니다.", "각 작업을 render/event/Effect로 재분류하고 unnecessary Effects를 제거합니다.", "Effect reactive reads와 dependencies를 lint/dataflow로 완전하게 선언합니다.", "object/function creation을 restructure하고 stale/latest semantics를 test합니다.", "subscription/timer setup-cleanup identity와 active resource balance를 검증합니다.", "Effect state feedback loop와 mirrored derived state를 제거합니다.", "HTTP status/media/schema/loading/error/empty/success와 projection을 구현합니다.", "same/changed deps, StrictMode, unmount, slow/out-of-order/offline/malformed fault matrix를 실행합니다.", "SSR/production build/browser/provider quota and privacy telemetry를 canary합니다.", "custom Hook extraction, reconnect/circuit, rollback/disconnect runbook을 rehearsal합니다."],
    expectedResult: ["모든 Effect가 명시된 external system과 symmetric cleanup을 가집니다.", "dependencies가 완전하고 stale closure, rerun loop와 duplicate resources가 없습니다.", "HTTP/schema/race failures가 typed UI와 cancellation/fallback으로 처리됩니다.", "StrictMode·rerender·unmount·SSR 후 active resources가 expected baseline입니다.", "provider failure와 Hook upgrade가 canary/rollback에서 복구됩니다."],
    cleanup: ["temporary servers, builds, timers/listeners/subscriptions와 browser storage를 제거합니다.", "synthetic payloads, request ids와 captured traces를 폐기합니다.", "fake clocks, verbose lifecycle logs와 feature flags를 원복합니다.", "원본 6 files hash/status unchanged를 확인합니다."],
    extensions: ["useEffectEvent 지원 환경과 latest non-reactive read를 비교합니다.", "useSyncExternalStore 기반 browser/external store Hook을 구현합니다.", "framework route loader/query cache와 Effect fetch waterfall을 benchmark합니다.", "Effect inventory와 resource balance instrumentation을 static/runtime tooling으로 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 실제 React lifecycle evidence와 대응시키세요.", requirements: ["stdout 완전 일치", "source gaps", "setup/cleanup balance", "placement", "Object.is dependencies", "loop termination", "subscription balance", "HTTP classification", "model 범위"], hints: ["empty dependency를 절대 한 번 실행이라고 단정하지 마세요."], expectedOutcome: "Effect process의 start/stop/restart와 result를 설명합니다.", solutionOutline: ["audit→place→depend/restructure→resource→fetch→test 순서입니다."] },
    { difficulty: "응용", prompt: "원본 EffectTest05 fetch를 production-safe data flow로 재설계하세요.", requirements: ["Effect 필요성/loader cache 비교", "status/media/schema", "projection", "loading/error/empty/data", "abort/latest-wins", "owned images/a11y", "StrictMode/resource tests", "provider fallback/rollback"], hints: ["response object 존재와 response.ok는 다릅니다."], expectedOutcome: "provider failure와 navigation에도 stale/leak 없는 data UI가 완성됩니다.", solutionOutline: ["requirements→ownership→request machine→validate/project→render→fault/ops 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React Effect·external system governance를 작성하세요.", requirements: ["render/event/Effect decision", "dependencies/lint", "setup-cleanup", "subscriptions/timers", "fetch/cache/race", "SSR/StrictMode", "tests/telemetry", "provider canary/reconnect/rollback"], hints: ["Hook API 목록이 아니라 external resource lifecycle을 정의하세요."], expectedOutcome: "Effect 도입부터 provider 장애 복구까지 감사 가능한 표준이 완성됩니다.", solutionOutline: ["inventory→classify→synchronize→clean→validate→observe→recover 순서입니다."] },
  ],
  nextSessions: ["react-16-effect-cleanup-race"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["실제 third-party endpoint, product/user data와 external image는 공개 examples에서 호출·복사하지 않고 structure와 defects만 provenance로 사용했습니다.", "원본 console logs는 dependency 학습 보조일 뿐 render/commit/production 횟수 guarantee가 아니며 StrictMode와 cleanup을 official sources로 보강했습니다.", "Node examples는 actual React scheduler/commit, browser events/timers/fetch streams, SSR와 provider behavior를 대체하지 않으므로 lab integration이 필요합니다.", "abort, latest-wins, streaming와 reconnection cleanup의 심화는 React16에서 이어집니다."] },
});

export default session;
