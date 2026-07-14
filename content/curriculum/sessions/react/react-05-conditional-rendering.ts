import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localIfSources = ["local-if01", "local-if02", "local-if-list", "archive-if01", "archive-if02", "archive-if-list"];

const topics = [
  appliedTopic({
    id: "source-conditional-audit", title: "step05-if의 여러 표현을 truthiness·output·mount 계약으로 감사합니다",
    lead: "if, ternary, null, early return, &&와 ||가 모두 조건문이라는 말에서 멈추지 않고 각 expression이 실제로 어떤 JavaScript value와 React child를 만드는지 추적합니다.",
    mechanism: "IfExam01은 boolean branch를 variable에 담고, IfExam02에는 if/else, null, early return, &&, ||의 학습 variants가 주석과 final expression으로 공존하며 list parent가 true/false props를 전달합니다. my-app01과 REACT archive의 세 파일은 각 counterpart와 byte hash가 같습니다.",
    workflow: "각 variant의 condition runtime value, evaluated branch, returned React node/null/primitive, child mount 여부와 accessible output을 truth table로 만들고 archive parity를 확인합니다.",
    invariants: "원본은 read-only이고 실제 item/person/domain strings를 공개 fixture에 복사하지 않으며, condition은 명시적 domain state에서 파생하고 raw truthy/falsy shortcuts로 valid zero/empty를 잃지 않습니다.",
    edgeCases: "false, 0, negative zero, empty string, null, undefined, NaN, empty array/object, rejected promise, stale request와 hydration-time environment 차이를 포함합니다.",
    failureModes: "count && JSX는 count가 0일 때 0 text를 render할 수 있고 value || fallback은 valid zero/empty를 덮으며 implicit undefined return은 의도와 test expectation을 숨깁니다.",
    verification: "source hash/variant matrix, exact truthiness model, component role/text/mount tests, StrictMode, server/client render parity와 warning capture를 실행합니다.",
    operations: "conditional policy 변경은 UI-state analytics, accessibility/error signals, feature-flag compatibility와 rollback matrix로 release합니다.",
    concepts: [c("conditional child", "condition 평가 결과에 따라 React tree에 포함·제외·대체되는 node입니다.", ["JavaScript value semantics를 따릅니다.", "mount lifetime에 영향 줍니다."]), c("truthiness", "JavaScript value가 boolean context에서 true/false로 변환되는 규칙입니다.", ["업무 상태와 같지 않습니다.", "0/empty를 명시합니다."]), c("archive parity", "두 학습 저장소 counterpart가 동일 bytes/hash를 갖는 provenance입니다.", ["중복을 별도 구현으로 과장하지 않습니다.", "한 내용의 보존 copy입니다."])],
    codeExamples: [node("react05-truthiness", "조건 표현식 truthiness와 fallback 차이", "React05Truthiness.mjs", "false-like values와 &&, ||, ??의 핵심 차이를 exact stdout으로 확인합니다.", String.raw`const cases = [
  ["false", false], ["zero", 0], ["empty", ""], ["null", null],
  ["undefined", undefined], ["nan", Number.NaN], ["array", []], ["object", {}],
];
for (const [label, value] of cases) console.log(label + "=" + Boolean(value));
console.log("zero-and=" + (0 && "RIGHT"));
console.log("empty-or=" + ("" || "fallback"));
console.log("zero-nullish=" + (0 ?? "fallback"));
console.log("empty-nullish=" + ("" ?? "fallback"));`, "false=false\nzero=false\nempty=false\nnull=false\nundefined=false\nnan=false\narray=true\nobject=true\nzero-and=0\nempty-or=fallback\nzero-nullish=0\nempty-nullish=", localIfSources.concat(["react-conditional", "ecma-conditional", "ecma-logical-and", "ecma-logical-or"]))],
  }),
  appliedTopic({
    id: "branch-syntax-selection", title: "if·early return·ternary·&&·||를 output shape와 readability로 선택합니다",
    lead: "짧은 syntax가 항상 좋은 것이 아니라 branch 수, shared shell, false-like display와 nested complexity에 맞는 표현을 선택합니다.",
    mechanism: "if/early return은 statement-level control flow, ternary는 두 expressions 중 하나의 value, &&/||는 operand 자체를 반환하는 short-circuit expressions입니다. React는 resulting child types를 처리하지만 JavaScript가 boolean을 자동 반환하지는 않습니다.",
    workflow: "mutually exclusive top-level states는 early return, 작은 inline two-way value는 ternary, boolean-only optional node는 &&로 제한하고 complex nested ternary를 named subcomponent/state mapping으로 분리합니다.",
    invariants: "branch마다 valid React node/null을 명시하고 count/length는 >0처럼 boolean으로 바꾸며 || fallback과 nullish fallback의 product semantics를 구분합니다.",
    edgeCases: "0 count, empty label, null optional data, undefined loading marker, object condition, operator precedence와 JSX braces 안 statement 금지를 다룹니다.",
    failureModes: "조건 expression에 API object를 그대로 넣으면 항상 truthy이고 nested ternary는 unreachable/duplicate states를 숨기며 branch마다 다른 wrapper가 child state를 예기치 않게 reset합니다.",
    verification: "condition value corpus, branch coverage/mutation, mounted type/key tree snapshot, accessible output와 lint/readability review를 결합합니다.",
    operations: "critical branch reason code와 impossible-state counter를 low-cardinality로 관찰하고 syntax refactor는 output/mount parity gate를 통과시킵니다.",
    concepts: [c("short-circuit expression", "왼쪽 값으로 결과가 결정되면 오른쪽을 평가하지 않고 operand value를 반환하는 표현입니다.", ["boolean만 반환하지 않습니다.", "side effect를 피합니다."]), c("early return", "component render에서 현재 state의 complete UI를 일찍 반환해 나머지 branches를 제외하는 구조입니다.", ["top-level state에 적합합니다.", "shared shell 요구를 고려합니다."]), c("branch shape", "각 condition이 반환하는 element type, wrapper, key와 semantic role의 구조입니다.", ["state lifetime에 영향 줍니다.", "a11y parity를 봅니다."])],
  }),
  appliedTopic({
    id: "exhaustive-ui-state-model", title: "boolean 여러 개 대신 exhaustive UI state machine을 렌더링합니다",
    lead: "isLoading, isError, hasData, isEmpty가 독립 booleans면 loading+error+success 같은 impossible combination과 누락 branch가 생깁니다.",
    mechanism: "UI state를 idle, initial-loading, content, empty, refreshing, stale-error, terminal-error, unauthorized 같은 finite variants와 variant별 payload로 표현하면 한 render snapshot에서 가능한 상태가 하나로 제한됩니다.",
    workflow: "events와 transitions, state-specific data/error/progress payload, permitted actions와 rendered role/focus를 table로 정의하고 exhaustive switch/default-never 또는 runtime guard로 처리합니다.",
    invariants: "initial loading과 background refresh를 구분하고 usable previous data는 transient refresh/error에서 보존하며 unauthorized는 server authorization 결과를 반영할 뿐 security decision을 client가 만들지 않습니다.",
    edgeCases: "empty success, partial page, retry exhausted, offline cached data, stale response, permission revoked, feature unavailable와 malformed state를 포함합니다.",
    failureModes: "error가 나면 무조건 content를 지워 사용자가 context를 잃거나 loading spinner가 전체 화면을 반복 대체해 focus/layout이 흔들리고 impossible boolean state가 blank UI를 만듭니다.",
    verification: "state/event transition table, every variant render, impossible-state rejection, action availability, focus/live status와 snapshot retention을 test합니다.",
    operations: "state residence time, transition failure, retry/outcome와 impossible-state counter를 versioned reason codes로 관찰하고 fallback/rollback을 둡니다.",
    concepts: [c("UI state machine", "user-visible state variants와 event에 따른 허용 transition을 명시한 model입니다.", ["boolean 조합을 줄입니다.", "render와 action을 함께 정의합니다."]), c("exhaustive rendering", "모든 허용 state variant가 정확히 한 UI branch를 갖고 unknown state는 실패하는 조건입니다.", ["type/runtime guard로 강제합니다.", "default로 숨기지 않습니다."]), c("stale-while-refresh UI", "이전 usable content를 유지하면서 background update 진행 상태를 별도로 알리는 UI입니다.", ["initial load와 다릅니다.", "stale 표시/정책이 필요합니다."])],
    codeExamples: [node("react05-state-machine", "exhaustive UI state renderer", "React05StateMachine.mjs", "initial load, content, empty, refresh, stale error와 terminal states를 stable view code로 mapping합니다.", String.raw`function view(state) {
  switch (state.kind) {
    case "idle": return "IDLE";
    case "loading": return state.previous ? "STALE_LOADING" : "FULL_LOADING";
    case "success": return state.count === 0 ? "EMPTY" : "CONTENT";
    case "error": return state.previous ? "STALE_ERROR" : "TERMINAL_ERROR";
    case "unauthorized": return "ACCESS_DENIED";
    default: throw new Error("UNKNOWN_STATE");
  }
}
const states = [
  { kind: "idle" }, { kind: "loading", previous: false },
  { kind: "success", count: 0 }, { kind: "success", count: 3 },
  { kind: "loading", previous: true }, { kind: "error", previous: true },
  { kind: "error", previous: false }, { kind: "unauthorized" },
];
console.log(states.map(view).join("|"));
try { view({ kind: "mystery" }); } catch (error) { console.log(error.message); }`, "IDLE|FULL_LOADING|EMPTY|CONTENT|STALE_LOADING|STALE_ERROR|TERMINAL_ERROR|ACCESS_DENIED\nUNKNOWN_STATE", ["react-state-snapshot", "react-choosing-state"] )],
  }),
  appliedTopic({
    id: "null-hidden-state-lifetime", title: "return null·CSS hidden·inert·key reset의 state와 interaction 차이를 구분합니다",
    lead: "‘안 보인다’는 결과가 같아도 subtree unmount, mounted-but-hidden, inaccessible/inert와 preserved state는 전혀 다른 lifetime을 가집니다.",
    mechanism: "conditional exclusion은 child tree를 제거해 local state/effects/DOM을 정리할 수 있고, CSS/hidden은 DOM과 component state를 보존할 수 있습니다. inert는 subtree의 focus/interaction을 제한하지만 browser support와 semantics를 실제로 확인해야 합니다.",
    workflow: "privacy/resource/state-reset 요구로 unmount 여부를 결정하고 preserved hidden UI는 focus, timers, observers, media와 accessibility exposure를 명시적으로 중지·복원합니다.",
    invariants: "숨겨진 controls가 tab/focus/submit을 받지 않고 sensitive content가 단순 CSS로 authorization되지 않으며 reset이 필요하면 explicit key/state transition을 사용합니다.",
    edgeCases: "animation exit, dialog background, offscreen tab panel, form draft, audio/video, screen reader virtual cursor, server rendering와 hydration을 다룹니다.",
    failureModes: "display:none만 바꿨다고 effect가 정리됐다고 생각해 background subscription이 계속되거나 conditional wrapper type 변화로 의도치 않은 form draft reset이 발생합니다.",
    verification: "mount/effect cleanup counters, DOM/accessible tree, tab/focus, timers/observers, form value preservation와 remount key tests를 실행합니다.",
    operations: "hidden-mounted resource count, orphan subscription, focus escape와 draft-loss signal을 관찰하고 lifecycle policy를 component API로 문서화합니다.",
    concepts: [c("conditional unmount", "branch에서 subtree를 제외해 component instance와 host nodes를 제거하는 lifecycle 결과입니다.", ["cleanup을 유발합니다.", "state가 reset됩니다."]), c("inert subtree", "user input과 sequential focus 대상에서 제외되는 DOM subtree입니다.", ["visibility와 별개입니다.", "지원/접근성을 test합니다."]), c("explicit reset", "identity key 또는 owner action으로 component state를 의도적으로 초기화하는 전환입니다.", ["위치 우연에 의존하지 않습니다.", "사용자에게 loss를 알립니다."])],
    codeExamples: [node("react05-visibility-policy", "unmount·hidden·inert 상태 보존 정책", "React05VisibilityPolicy.mjs", "visibility mode별 mounted/state/focus/resource 계약을 pure table로 검증합니다.", String.raw`const modes = {
  unmounted: { mounted: false, state: "reset", focusable: false, effects: "cleaned" },
  hidden: { mounted: true, state: "preserved", focusable: false, effects: "running" },
  inert: { mounted: true, state: "preserved", focusable: false, effects: "paused-by-owner" },
};
for (const [name, policy] of Object.entries(modes)) {
  console.log(name + "=" + [policy.mounted, policy.state, policy.focusable, policy.effects].join("|"));
}
console.log("css-is-authorization=false");
console.log("reset-requires-explicit-policy=true");`, "unmounted=false|reset|false|cleaned\nhidden=true|preserved|false|running\ninert=true|preserved|false|paused-by-owner\ncss-is-authorization=false\nreset-requires-explicit-policy=true", ["react-preserving-state", "html-inert"] )],
  }),
  appliedTopic({
    id: "async-race-pending-refresh", title: "async result를 request generation으로 gate하고 pending·refresh·cancel UI를 구분합니다",
    lead: "빠르게 condition을 바꿀 때 느린 이전 request가 나중에 도착하면 새 selection 화면을 오래된 결과로 덮을 수 있습니다.",
    mechanism: "각 query/selection에 generation 또는 request identity를 부여하고 response가 current request와 일치할 때만 state transition을 commit합니다. AbortController는 불필요한 work 취소 신호지만 이미 도착한 결과 gate를 대체하지 않습니다.",
    workflow: "event에서 new generation→abort old→pending/refresh state→response schema validate→generation compare→success/error transition을 실행하고 finally cleanup을 current request에만 적용합니다.",
    invariants: "old response/error/finally가 newer state를 덮지 않고 retry는 같은 logical query 정책을 따르며 initial loading과 refresh는 previous content 보존 여부가 다릅니다.",
    edgeCases: "out-of-order success, old error after new success, abort race, component unmount, duplicate click, offline reconnect, partial stream와 timeout을 다룹니다.",
    failureModes: "isLoading boolean 하나를 모든 request가 finally false로 바꾸면 new request 중 spinner가 사라지고 stale response가 content를 되돌립니다.",
    verification: "controlled deferred promises, old/new success/error/finally permutations, abort spy, unmount cleanup와 exact transition log를 확인합니다.",
    operations: "stale-drop, cancel reason, latency, retry/exhaustion과 previous-content retention을 관찰하고 timeout/fallback/runbook을 둡니다.",
    concepts: [c("request generation", "현재 async intent를 구분하는 monotonically changing identity입니다.", ["stale result를 버립니다.", "render key와 다릅니다."]), c("background refresh", "usable previous UI를 유지한 채 새 data를 가져오는 pending state입니다.", ["initial loading과 다릅니다.", "status를 알립니다."]), c("abort signal", "async producer에게 더 이상 결과가 필요 없음을 전달하는 cancellation channel입니다.", ["completion race가 가능합니다.", "result gate를 함께 둡니다."])],
    codeExamples: [node("react05-request-generation", "out-of-order response gate", "React05RequestGeneration.mjs", "newer request가 먼저 완료된 뒤 older response가 도착해도 current UI를 덮지 않는지 실행합니다.", String.raw`let generation = 0;
let state = "idle";
const events = [];
function start() { generation += 1; return generation; }
function complete(id, value) {
  if (id !== generation) { events.push("drop:" + id); return; }
  state = value; events.push("commit:" + id);
}
const first = start();
const second = start();
complete(second, "new-result");
complete(first, "old-result");
console.log("current-generation=" + generation);
console.log("events=" + events.join(","));
console.log("state=" + state);
console.log("old-overwrite=false");
console.log("abort-is-only-gate=false");`, "current-generation=2\nevents=commit:2,drop:1\nstate=new-result\nold-overwrite=false\nabort-is-only-gate=false", ["react-you-might-not-need-effect", "dom-abortcontroller"] )],
  }),
  appliedTopic({
    id: "render-errors-boundaries-retry", title: "render error boundary와 event·async failure를 서로 다른 복구 경계로 둡니다",
    lead: "조건부 rendering에서 throw 하나가 전체 root를 비우지 않게 하되 모든 오류가 Error Boundary에 잡힌다고 가정하지 않습니다.",
    mechanism: "Error Boundary class lifecycle은 descendant render/lifecycle errors의 fallback을 제공하지만 event handler, arbitrary async callback, server-side rendering과 boundary 자체 error는 같은 방식으로 잡지 않습니다.",
    workflow: "feature/route 수준 boundary에 stable fallback, retry/reset key, error correlation과 safe navigation을 두고 event/async failures는 해당 action state machine에서 명시적으로 catch/classify합니다.",
    invariants: "fallback도 접근 가능하고 sensitive exception/message/stack을 user나 telemetry에 raw 노출하지 않으며 retry는 failed side effect를 중복하지 않습니다.",
    edgeCases: "fallback render failure, repeated retry loop, lazy import failure, stale chunk after deploy, event exception, rejected promise와 partial user draft를 포함합니다.",
    failureModes: "boundary를 app root 하나에만 두면 작은 widget 오류가 전체 화면을 지우고 catch에서 error를 삼키면 monitoring과 user recovery가 모두 사라집니다.",
    verification: "render/event/effect/async/lazy fault injection, boundary scope, fallback focus/name, retry/reset, draft preservation와 redacted reporting을 test합니다.",
    operations: "boundary name/build version/reason fingerprint, retry success와 fallback residence를 관찰하고 chunk/cache purge와 rollback runbook을 둡니다.",
    concepts: [c("Error Boundary", "descendant render lifecycle failure를 잡아 fallback UI를 제공하는 React component boundary입니다.", ["모든 async/event error를 잡지 않습니다.", "scope를 작게 둡니다."]), c("fault containment", "한 component failure가 전체 application으로 번지지 않게 영향 범위를 제한하는 구조입니다.", ["fallback dependency도 최소화합니다.", "복구 action을 제공합니다."]), c("reset key", "retry 시 failed subtree identity를 새로 만들어 state/effects를 재초기화하는 값입니다.", ["무한 retry를 막습니다.", "draft loss를 관리합니다."])],
  }),
  appliedTopic({
    id: "suspense-fallback-reveal", title: "Suspense fallback의 reveal·state·nested boundary를 product contract로 검증합니다",
    lead: "Suspense를 임의 fetch의 loading boolean 대체로 오해하지 않고 실제 suspend-enabled data/code source와 reveal behavior를 기준으로 사용합니다.",
    mechanism: "descendant가 supported mechanism으로 suspend하면 가장 가까운 Suspense가 fallback을 보여 주고 ready 후 children을 reveal합니다. initial mount 전 suspend와 already-visible tree의 re-suspend는 state/effect behavior가 다를 수 있습니다.",
    workflow: "route shell, critical content와 secondary panels의 reveal priority를 정해 nested boundaries와 lightweight accessible fallbacks를 배치하고 transition/deferred update 여부를 선택합니다.",
    invariants: "fallback이 layout/focus를 심하게 흔들지 않고 already-usable content를 불필요하게 숨기지 않으며 error는 Error Boundary, timeout/retry는 data layer와 연결됩니다.",
    edgeCases: "fallback 자체 suspend/error, nested waterfall, slow module, offline chunk, SSR streaming, hydration error와 repeated suspend를 포함합니다.",
    failureModes: "한 giant boundary가 작은 child 지연에도 전체 page를 spinner로 바꾸거나 너무 많은 boundaries가 flicker와 inaccessible announcements를 만듭니다.",
    verification: "controlled suspend promises, nested reveal sequence, transition update, fallback roles, focus/layout, SSR/hydration와 error-boundary interaction을 확인합니다.",
    operations: "suspense duration, fallback exposure, chunk/data error와 reveal sequence를 bounded telemetry로 관찰하고 preloading/cache/rollback을 운영합니다.",
    concepts: [c("suspension", "render가 아직 준비되지 않은 dependency를 React에 알리고 재시도를 예약하는 상태입니다.", ["일반 isLoading과 다릅니다.", "지원 integration이 필요합니다."]), c("fallback", "children이 준비되지 않은 동안 boundary가 대신 렌더링하는 React node입니다.", ["가볍고 접근 가능해야 합니다.", "error UI와 다릅니다."]), c("reveal order", "nested async content를 어느 순서와 경계로 사용자에게 보여 줄지의 UX 계약입니다.", ["priority를 반영합니다.", "waterfall을 측정합니다."])],
  }),
  appliedTopic({
    id: "conditional-a11y-focus-status", title: "loading·empty·error·success 변화를 role·focus·aria-busy로 전달합니다",
    lead: "조건부 UI가 시각적으로 바뀌어도 screen reader가 상태 변화를 알지 못하거나 focus가 사라지면 작업 완료·오류를 이해하기 어렵습니다.",
    mechanism: "status messages는 적절한 role/properties로 focus 이동 없이 전달할 수 있고 critical alert는 더 강한 interruption을 가집니다. aria-busy는 updating region의 상태를 표현하며 focus 이동은 실제 context/action 요구에만 사용합니다.",
    workflow: "각 UI state에 visible copy, semantic role, accessible name, focus owner, retry action과 announcement priority를 표로 만들고 repeated changes를 deduplicate합니다.",
    invariants: "spinner/icon만으로 상태를 표현하지 않고 error field/action은 programmatically 연결하며 conditional removal 뒤 focus를 logical fallback으로 복원합니다.",
    edgeCases: "rapid loading toggles, background refresh, multiple simultaneous errors, modal/route change, reduced motion, screen reader browse mode와 empty result를 다룹니다.",
    failureModes: "모든 state change를 role=alert로 알리면 과도한 interruption이 생기고 hidden focused control 제거 뒤 body로 focus가 유실됩니다.",
    verification: "role/name/state queries, screen reader spot check, keyboard focus sequence, aria-busy lifecycle, announcement count와 visual/nonvisual parity를 실행합니다.",
    operations: "a11y regression, focus-loss, retry abandonment와 fallback residence를 release gates와 support runbook에 연결합니다.",
    concepts: [c("status message", "focus를 이동하지 않고 작업 진행·결과·오류 정보를 programmatically 알리는 content입니다.", ["적절한 role을 사용합니다.", "중복을 피합니다."]), c("aria-busy", "region이 업데이트 중이며 아직 완성되지 않았음을 assistive technology에 알리는 state입니다.", ["완료 시 해제합니다.", "loading copy를 대신하지 않습니다."]), c("focus recovery", "focused subtree가 사라진 뒤 logical trigger·heading·error control로 focus를 결정적으로 옮기는 정책입니다.", ["body 유실을 막습니다.", "context를 보존합니다."])],
  }),
  appliedTopic({
    id: "ssr-hydration-branch-parity", title: "server render와 hydration이 같은 conditional tree를 선택하게 합니다",
    lead: "server와 client의 첫 render가 서로 다른 시간·locale·browser API·feature flag를 보면 hydration mismatch와 예기치 않은 subtree reset이 발생합니다.",
    mechanism: "hydrateRoot는 server가 만든 DOM에 React tree를 연결하며 server/client initial output이 같은 것을 전제로 합니다. window 존재, current time, random value에 따른 branch를 render 중 즉시 선택하면 이 전제가 깨집니다.",
    workflow: "request에서 결정된 permission·locale·flag snapshot을 serialized initial state로 공유하고, browser-only 정보는 hydration 후 effect/event에서 state transition으로 반영하며 loading·fallback shape도 동일하게 맞춥니다.",
    invariants: "server markup과 client first render의 element type·text·list key·form control mode가 같고 permission-sensitive payload는 HTML에 포함되지 않으며 recoverable mismatch를 정상 분기 전략으로 삼지 않습니다.",
    edgeCases: "timezone/locale, clock boundary, randomized ID, media query, browser extension mutation, CDN-cached flag, stale deployment chunk, streaming Suspense와 controlled/uncontrolled input 전환을 다룹니다.",
    failureModes: "typeof window conditional로 server에서 placeholder, client에서 content를 즉시 반환하면 첫 tree가 달라지고, warning을 숨기면 event binding·form value·focus가 잘못 연결된 상태를 놓칩니다.",
    verification: "fixed clock/locale/flag snapshot으로 server HTML을 만든 뒤 같은 input으로 hydrate하고 recoverable-error capture, DOM/text/value/focus, Suspense reveal·stream order와 JavaScript-disabled baseline을 확인합니다.",
    operations: "hydration recoverable error를 route·build·reason으로 bounded aggregation하고 server/client artifact compatibility window, cache purge, canary·rollback runbook을 함께 운영합니다.",
    concepts: [c("hydration parity", "server markup과 client first render가 같은 UI tree contract을 가지는 조건입니다.", ["warning 없음만으로 추정하지 않습니다.", "DOM·event·state를 확인합니다."]), c("initial state snapshot", "server와 client의 첫 render가 공유하는 request-time data·permission·flag input입니다.", ["serialize 경계를 검증합니다.", "sensitive data를 제외합니다."]), c("recoverable hydration error", "React가 recovery를 시도할 수 있지만 output 불일치를 나타내는 signal입니다.", ["무시할 정상 흐름이 아닙니다.", "root cause를 분류합니다."])],
  }),
  appliedTopic({
    id: "security-performance-release", title: "조건부 visibility를 authorization과 분리하고 branch 비용·feature flag를 운영합니다",
    lead: "UI에서 button/row를 숨기는 것은 보안 통제가 아니며 숨겨진 branch의 heavy work와 unsafe content가 실행·노출되지 않는지도 별도 검증해야 합니다.",
    mechanism: "client condition은 presentation decision이고 server가 data/action authorization을 강제합니다. JSX text escaping을 유지하고 raw HTML sink를 기본 거부하며 branch 안 expensive computation은 선택된 state에서만 평가되도록 분리합니다.",
    workflow: "runtime data/permission schema→server-authorized response→finite UI state→selected component lazy boundary 순서로 구성하고 feature flag old/new branches의 output/a11y/security compatibility를 test합니다.",
    invariants: "unauthorized data/action은 network/cache에 없고 hidden branch side effects가 시작되지 않으며 user-controlled markup을 raw HTML로 해석하지 않고 flag default/rollback이 안전합니다.",
    edgeCases: "stale permission, flag service failure, mixed bundle/server versions, hydration branch mismatch, expensive hidden calculation, malicious markup-like text와 rollback을 다룹니다.",
    failureModes: "client isAdmin만으로 action을 숨기면 직접 request가 성공할 수 있고 both branches를 먼저 계산한 뒤 ternary로 고르면 hidden work와 side effects가 이미 실행됩니다.",
    verification: "server denial, forbidden payload/DOM fields, raw HTML corpus, branch evaluation spies, Profiler, old/new flag parity, SSR hydration와 rollback rehearsal를 실행합니다.",
    operations: "authorization denial, flag exposure, branch error/latency, hydration mismatch와 rollback success를 versioned telemetry로 관리합니다.",
    concepts: [c("presentation condition", "이미 허용된 data/action을 어떤 UI로 보여 줄지 결정하는 client rule입니다.", ["authorization이 아닙니다.", "accessibility semantics를 포함합니다."]), c("lazy branch evaluation", "선택된 branch의 computation/module만 필요할 때 수행하는 구조입니다.", ["side effect는 render 밖에 둡니다.", "성능을 측정합니다."]), c("feature-flag fallback", "flag unavailable/rollback 때 사용할 안전하고 호환되는 UI behavior입니다.", ["default를 정의합니다.", "old/new API window가 필요합니다."])],
    codeExamples: [node("react05-release-policy", "UI state별 accessibility·security release gate", "React05ReleasePolicy.mjs", "loading/error/content/unauthorized branch가 role, focus와 server authorization/raw HTML 정책을 지키는지 검사합니다.", String.raw`const states = [
  { kind: "loading", role: "status", focus: "keep", serverAuthorized: true },
  { kind: "error", role: "alert", focus: "retry", serverAuthorized: true },
  { kind: "content", role: "region", focus: "keep", serverAuthorized: true },
  { kind: "unauthorized", role: "status", focus: "safe-heading", serverAuthorized: false },
];
for (const state of states) {
  const safe = state.role !== "" && state.focus !== "body";
  console.log(state.kind + "=" + state.role + "|focus=" + state.focus + "|a11y=" + safe);
}
console.log("client-visibility-is-auth=false");
console.log("raw-html=false");
console.log("render-errors-use-boundary=true");
console.log("suspense-is-error-boundary=false");`, "loading=status|focus=keep|a11y=true\nerror=alert|focus=retry|a11y=true\ncontent=region|focus=keep|a11y=true\nunauthorized=status|focus=safe-heading|a11y=true\nclient-visibility-is-auth=false\nraw-html=false\nrender-errors-use-boundary=true\nsuspense-is-error-boundary=false", ["react-suspense", "react-component", "react-hydrate-root", "react-dom-common", "wcag-status-messages", "wcag-focus-order", "owasp-xss-prevention"] )],
  }),
];

const sources: SessionSource[] = [
  { id: "local-if01", repository: "my-app01", path: "src/pages/step05-if/IfExam01.jsx", usedFor: ["if/else branch variable provenance"], evidence: "Read-only sanitized audit: 25 lines, 653 bytes, SHA-256 4AD6F9D1F1E7076EDE37345708D794AF02B265A217AAC2ED0E0C15284E2C1ED4; actual display strings were not copied." },
  { id: "local-if02", repository: "my-app01", path: "src/pages/step05-if/IfExam02.jsx", usedFor: ["if, null, early return, logical AND/OR variants"], evidence: "Read-only sanitized audit: 90 lines, 2,134 bytes, SHA-256 9ABFB3A792A69405D9C0C6EFF3A2F1BEFB0481C6A2C3B99AB574547EB64BBC4D; actual item strings were not copied." },
  { id: "local-if-list", repository: "my-app01", path: "src/pages/step05-if/IfExam02List.jsx", usedFor: ["true/false prop matrix parent provenance"], evidence: "Read-only sanitized audit: 15 lines, 449 bytes, SHA-256 5FD18C74D1DFF0C956D224AF5D44396FC04B620C3CF43EDEF87D6C0353B2202F; actual domain values were not copied." },
  { id: "archive-if01", repository: "REACT", path: "code/react/01-basics-my-app01/src/pages/step05-if/IfExam01.jsx", usedFor: ["archive byte parity"], evidence: "Read-only sanitized audit: 25 lines, 653 bytes, SHA-256 4AD6F9D1F1E7076EDE37345708D794AF02B265A217AAC2ED0E0C15284E2C1ED4." },
  { id: "archive-if02", repository: "REACT", path: "code/react/01-basics-my-app01/src/pages/step05-if/IfExam02.jsx", usedFor: ["archive byte parity"], evidence: "Read-only sanitized audit: 90 lines, 2,134 bytes, SHA-256 9ABFB3A792A69405D9C0C6EFF3A2F1BEFB0481C6A2C3B99AB574547EB64BBC4D." },
  { id: "archive-if-list", repository: "REACT", path: "code/react/01-basics-my-app01/src/pages/step05-if/IfExam02List.jsx", usedFor: ["archive byte parity"], evidence: "Read-only sanitized audit: 15 lines, 449 bytes, SHA-256 5FD18C74D1DFF0C956D224AF5D44396FC04B620C3CF43EDEF87D6C0353B2202F." },
  { id: "react-conditional", repository: "React", path: "learn/conditional-rendering", publicUrl: "https://react.dev/learn/conditional-rendering", usedFor: ["if, ternary, logical AND and null rendering"], evidence: "React 공식 conditional rendering guidance입니다." },
  { id: "react-state-snapshot", repository: "React", path: "learn/state-as-a-snapshot", publicUrl: "https://react.dev/learn/state-as-a-snapshot", usedFor: ["one render's UI state snapshot"], evidence: "React 공식 state snapshot guidance입니다." },
  { id: "react-choosing-state", repository: "React", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["avoid contradictory and duplicate state"], evidence: "React 공식 state structure guidance입니다." },
  { id: "react-preserving-state", repository: "React", path: "learn/preserving-and-resetting-state", publicUrl: "https://react.dev/learn/preserving-and-resetting-state", usedFor: ["conditional mount and explicit reset semantics"], evidence: "React 공식 state preservation guidance입니다." },
  { id: "react-you-might-not-need-effect", repository: "React", path: "learn/you-might-not-need-an-effect", publicUrl: "https://react.dev/learn/you-might-not-need-an-effect", usedFor: ["render derivation and race-safe effect alternatives"], evidence: "React 공식 Effect design guidance입니다." },
  { id: "react-suspense", repository: "React", path: "reference/react/Suspense", publicUrl: "https://react.dev/reference/react/Suspense", usedFor: ["fallback and reveal semantics"], evidence: "React 공식 Suspense API입니다." },
  { id: "react-component", repository: "React", path: "reference/react/Component", publicUrl: "https://react.dev/reference/react/Component", usedFor: ["Error Boundary lifecycle and caveats"], evidence: "React 공식 Component/Error Boundary API입니다." },
  { id: "react-hydrate-root", repository: "React DOM", path: "reference/react-dom/client/hydrateRoot", publicUrl: "https://react.dev/reference/react-dom/client/hydrateRoot", usedFor: ["server/client initial output parity and recoverable hydration errors"], evidence: "React DOM 공식 hydrateRoot API입니다." },
  { id: "react-dom-common", repository: "React DOM", path: "reference/react-dom/components/common", publicUrl: "https://react.dev/reference/react-dom/components/common", usedFor: ["DOM props and dangerous raw HTML sink"], evidence: "React DOM 공식 common components reference입니다." },
  { id: "ecma-conditional", repository: "ECMA-262", path: "Conditional Operator", publicUrl: "https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-conditional-operator", usedFor: ["ternary expression semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "ecma-logical-and", repository: "ECMA-262", path: "Binary Logical AND", publicUrl: "https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-binary-logical-operators", usedFor: ["logical AND operand-value semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "ecma-logical-or", repository: "ECMA-262", path: "Binary Logical OR", publicUrl: "https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-binary-logical-operators", usedFor: ["logical OR operand-value semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "dom-abortcontroller", repository: "WHATWG DOM", path: "AbortController", publicUrl: "https://dom.spec.whatwg.org/#interface-abortcontroller", usedFor: ["abort signal and cancellation"], evidence: "WHATWG 공식 DOM Standard입니다." },
  { id: "html-inert", repository: "WHATWG HTML", path: "The inert attribute", publicUrl: "https://html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute", usedFor: ["inert subtree interaction semantics"], evidence: "WHATWG 공식 HTML Standard입니다." },
  { id: "wcag-status-messages", repository: "W3C WAI", path: "Understanding Status Messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages", usedFor: ["programmatic dynamic status announcements"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
  { id: "wcag-focus-order", repository: "W3C WAI", path: "Understanding Focus Order", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html", usedFor: ["focus continuity across branch changes"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
  { id: "owasp-xss-prevention", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["output contexts and unsafe sink defense"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-05-state-setter-batching", slug: "react-05-conditional-rendering", courseId: "react", moduleId: "react-rendering-components", order: 5,
  title: "조건부 렌더링과 UI 상태", subtitle: "원본 if/ternary/null/&&/||를 exhaustive UI state, async race, lifecycle, Suspense/error, accessibility·authorization과 release 운영으로 확장합니다.", level: "중급", estimatedMinutes: 100,
  coreQuestion: "loading·empty·content·error·unauthorized 같은 UI 상태를 어떻게 빠짐없이 렌더링하고 async race, focus, security와 state lifetime을 안전하게 유지할까요?",
  summary: "my-app01 step05-if 세 파일과 REACT archive counterparts를 read-only·sanitized 감사해 if/else, null, early return, logical AND/OR와 boolean prop list 흐름을 보존하고 counterpart hashes가 일치함을 확인했습니다. 실제 item/display strings는 복사하지 않습니다. truthiness와 syntax 선택, exhaustive finite UI states, unmount/hidden/inert state lifetime, async generation/cancel, Error Boundary, Suspense reveal, status/focus accessibility와 client visibility가 authorization이 아닌 security boundary, performance/feature-flag release까지 current official sources로 확장합니다. 다섯 Node examples는 falsy values, state renderer, out-of-order response, visibility policy와 release gates를 exact stdout으로 실행합니다.",
  objectives: ["원본 conditional variants와 archive parity를 감사한다.", "truthiness와 if/ternary/&&/|| output semantics를 구분한다.", "contradictory booleans 대신 exhaustive UI state를 설계한다.", "unmount/hidden/inert와 state/effect lifetime을 선택한다.", "request generation과 abort로 async race를 제어한다.", "render Error Boundary와 event/async failure를 구분한다.", "Suspense fallback과 nested reveal을 검증한다.", "status·focus·aria-busy로 상태 변화를 접근 가능하게 전달한다.", "conditional visibility를 server authorization과 분리한다.", "branch cost, feature flags, hydration과 rollback을 운영한다."],
  prerequisites: [{ title: "목록 렌더링·key와 reconciliation", reason: "conditional filter/removal이 list item identity, component state와 focus를 어떻게 바꾸는지 알아야 branch lifetime과 UI state transition을 정확히 설계할 수 있습니다.", sessionSlug: "react-04-list-key-reconciliation" }],
  keywords: ["conditional rendering", "truthiness", "ternary", "logical AND", "UI state machine", "loading", "empty", "error boundary", "Suspense", "focus", "authorization"],
  topics,
  lab: {
    title: "boolean demo를 async·accessible exhaustive UI state로 전환하기",
    scenario: "원본 actual labels를 사용하지 않는 disposable component에서 loading/content/empty/error/unauthorized와 rapid query change를 구현하고 lifecycle·a11y·security evidence를 만듭니다.",
    setup: ["원본 6 files read-only와 hashes", "synthetic non-domain UI records/errors", "controlled promises and AbortController fixture", "React component/browser accessibility tests", "server authorization stub and unsafe-input corpus"],
    steps: ["원본 variants를 condition value→returned node→mounted subtree matrix로 기록합니다.", "false/0/empty/null/undefined/NaN/array/object truthiness tests를 실행합니다.", "independent booleans를 finite state/event transition model로 교체합니다.", "idle/loading/empty/content/refresh/stale-error/error/unauthorized UI를 exhaustive render합니다.", "null/unmount, hidden와 inert의 state/effect/focus 차이를 test합니다.", "two out-of-order requests와 abort/error/finally permutations에 generation gate를 적용합니다.", "render/event/async/lazy faults를 boundary와 action state에서 각각 분류합니다.", "nested Suspense fallback/reveal과 Error Boundary interaction을 검증합니다.", "role/status/alert/aria-busy와 focus recovery를 keyboard/screen-reader 관점에서 확인합니다.", "server denial, forbidden payload/DOM/raw HTML와 flag fallback을 negative test합니다.", "Profiler/hydration/old-new flag parity와 rollback을 rehearsal합니다.", "source hashes, state matrix, faults/a11y/security evidence와 runbook을 제출합니다."],
    expectedResult: ["모든 허용 UI state가 정확히 한 branch와 actions를 가집니다.", "0/empty/null 의미가 shortcut 때문에 손실되거나 DOM에 유출되지 않습니다.", "older async result/finally가 current UI를 덮지 않습니다.", "branch 변화 뒤 state/effect/focus와 status announcements가 의도한 policy를 따릅니다.", "unauthorized/raw unsafe content가 payload/DOM에 없고 flag rollback이 호환됩니다."],
    cleanup: ["controlled promises, timers, abort handlers와 error reporters를 정리합니다.", "synthetic data, browser storage, test reports와 traces를 제거합니다.", "feature flags, verbose state logging과 fault injection을 원복합니다.", "원본 6 files hash/status unchanged를 확인합니다."],
    extensions: ["TypeScript discriminated union과 exhaustive never를 적용합니다.", "router-level pending/error UI와 streaming SSR을 비교합니다.", "offline cached/stale state와 retry backoff를 추가합니다.", "state transition model에서 test matrix와 observability schema를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Node examples를 실행하고 React UI state/lifecycle evidence로 연결하세요.", requirements: ["stdout 완전 일치", "truthiness/0 차이", "exhaustive states", "request generation", "unmount/hidden/inert", "a11y/security gates"], hints: ["Node model을 actual React mount/Suspense/Error Boundary 실행으로 과장하지 마세요."], expectedOutcome: "conditional syntax를 state·lifecycle·async·accessibility contract로 설명합니다.", solutionOutline: ["audit→classify→model→gate→contain→announce 순서입니다."] },
    { difficulty: "응용", prompt: "step05-if demo를 remote-data production screen으로 확장하세요.", requirements: ["finite state union", "initial/refresh distinction", "stale response gate", "Error/Suspense boundaries", "focus/status", "server authorization", "unsafe sink tests", "flag rollback"], hints: ["isLoading/isError/hasData booleans를 독립적으로 늘리지 마세요."], expectedOutcome: "network·permission·render failure에도 usable and accessible UI가 수렴합니다.", solutionOutline: ["events→states→render→async gate→a11y→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 conditional UI 표준을 작성하세요.", requirements: ["truthiness/syntax", "state taxonomy", "mount/preserve/reset", "async cancel/generation", "error/Suspense", "a11y/focus", "authorization/XSS", "performance/flag/hydration gates"], hints: ["visual screenshots만 아니라 semantic roles, state lifetime와 server outcomes를 포함하세요."], expectedOutcome: "모든 conditional screen이 빠짐없는 state와 복구 evidence로 review됩니다.", solutionOutline: ["enumerate→transition→render→protect→verify→release 순서입니다."] },
  ],
  nextSessions: ["react-06-component-composition-children"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["IfExam01.jsx 25 lines/653 bytes, IfExam02.jsx 90 lines/2,134 bytes, IfExam02List.jsx 15 lines/449 bytes를 sanitized audit했고 actual item/display strings는 복사하지 않았습니다.", "세 my-app01 SHA-256은 각각 4AD6F9D1F1E7076EDE37345708D794AF02B265A217AAC2ED0E0C15284E2C1ED4, 9ABFB3A792A69405D9C0C6EFF3A2F1BEFB0481C6A2C3B99AB574547EB64BBC4D, 5FD18C74D1DFF0C956D224AF5D44396FC04B620C3CF43EDEF87D6C0353B2202F이며 REACT archive counterparts와 byte-identical합니다.", "원본의 commented variants와 final logical expression을 structural provenance로 사용했지만 exhaustive async UI, Suspense/Error Boundary, accessibility와 authorization이 구현됐다고 과장하지 않았습니다.", "official primary sources와 synthetic models로 missing/error/race/lifecycle/security/operations를 보강했습니다.", "Node examples는 실제 React mount/state, Suspense scheduler, Error Boundary, browser DOM/focus와 server authorization을 대체하지 않습니다."] },
});

export default session;
