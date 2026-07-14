import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function nodeExample(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "node", filename, purpose, code,
    walkthrough: [
      { lines: "1-10", explanation: "합성 component/event tree, handler와 native default action을 선언합니다." },
      { lines: "11-끝에서 5줄 전", explanation: "capture→target→bubble, handler reference, target/currentTarget, cancellation 또는 keyboard activation을 deterministic queue로 계산합니다." },
      { lines: "마지막 5줄", explanation: "호출 순서·default 여부·focus/action count를 exact stdout으로 출력합니다." },
    ],
    run: { environment: ["Node.js 20 이상", "ECMAScript module", "React·DOM·network·credential 불필요"], command: "node " + filename },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "순수 event model은 React SyntheticEvent, browser composed path/default actions, pointer/keyboard와 assistive technology를 대체하지 않으므로 실제 browser integration test가 필요합니다."] },
    experiments: [
      { change: "capture/bubble listener, stop flag, target 또는 control element를 바꿉니다.", prediction: "event order나 default action만 contract에 따라 달라집니다.", result: "Node trace와 browser eventPhase/currentTarget/defaultPrevented trace를 비교합니다." },
      { change: "mouse click을 keyboard Enter/Space, form submit 또는 touch/pointer input으로 바꿉니다.", prediction: "native element는 표준 activation을 제공하고 generic element의 수동 구현 공백이 드러납니다.", result: "focus, action count, navigation/submit와 announcement를 input modality별로 기록합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-step06-event-audit",
    title: "step06-event와 local Button wrapper를 실행 사실·학습 의도·고급 공백으로 감사합니다",
    lead: "짧은 onClick 예제는 handler 문법을 보여 주지만 propagation과 접근 가능한 interaction 전체를 증명하지 않으므로 source 범위를 먼저 고정합니다.",
    explanations: [
      "Event01은 component 안 handler, argument가 없는 reference 전달과 argument를 묶는 inline arrow를 대비하고 render 중 함수를 즉시 호출하는 잘못된 모양을 주석으로 남깁니다. 이 source는 핵심 pitfall을 잘 보여 주지만 click 외 input, event object와 propagation을 실행하지 않습니다.",
      "Event02는 module scope의 재사용 button component가 message와 children을 받아 native button onClick으로 연결되는 composition을 보여 줍니다. 하지만 behavior prop을 parent가 직접 전달하기보다 내부 alert 종류를 data prop으로 고정해 application intent와 presentation 경계가 섞여 있습니다.",
      "Event03은 third-party Button의 normal/disabled variants와 inline/separate handlers를, Event04와 components/Btn은 children과 data prop으로 공통 Button을 재사용하는 경로를 보여 줍니다. custom component 이름만 보고 최종 DOM, keyboard와 disabled behavior를 단정하지 않고 library version과 rendered host tree를 확인해야 합니다.",
      "REACT local 문서는 handler를 pass/call하는 차이와 실행 연결법을 설명하지만 capture/bubble, stop/default, target/currentTarget, keyboard/pointer equivalence와 async duplicate prevention을 깊게 다루지 않습니다. current React/DOM/UI Events/HTML/WCAG primary docs로 이 공백을 보완합니다.",
      "원본 alert/console message와 UI text는 공개 example fixture로 복사하지 않고 generic synthetic action IDs만 사용합니다. source hashes는 provenance이고 실제 interaction qualification은 browser에서 별도로 수행합니다.",
    ],
    concepts: [
      c("event source audit", "handler가 어디서 생성되어 어떤 host element와 user input에 연결되는지 source path와 runtime tree로 추적하는 과정입니다.", ["commented code와 live code를 구분합니다.", "library wrapper의 최종 DOM을 확인합니다."]),
      c("handler reference", "나중의 interaction 때 호출하도록 function value 자체를 prop에 전달한 것입니다.", ["render 중 호출과 다릅니다.", "argument가 필요하면 wrapper function을 씁니다."]),
      c("interaction evidence gap", "click handler 존재와 keyboard/pointer/propagation/default/failure까지 올바르게 동작한다는 증거 사이의 차이입니다.", ["absence를 성공으로 보지 않습니다.", "input modality matrix를 둡니다."]),
    ],
    diagnostics: [
      d("화면을 열자마자 action이 실행됩니다.", "onClick에 function reference가 아니라 호출 결과를 전달했습니다.", ["JSX handler expression", "render stack", "handler return type", "Strict Mode repetition"], "argument 없는 handler는 reference로, argument가 있으면 event 때 실행되는 arrow/function wrapper로 전달합니다.", "render-only test에서 side-effect count 0을 assert합니다."),
      d("custom Btn이 keyboard로 작동하는지 코드만 보고 판단할 수 없습니다.", "component 이름과 UI library abstraction이 최종 host semantics를 가렸습니다.", ["rendered tag/role", "Tab/Enter/Space", "disabled state", "library version"], "browser에서 role/name/focus/activation을 확인하고 semantic contract를 wrapper API에 문서화합니다.", "wrapper variants마다 DOM/keyboard contract tests를 둡니다."),
    ],
    expertNotes: ["source에 onClick이 있다는 사실은 handler 연결 evidence이고 user task completion evidence는 아닙니다.", "third-party component upgrade에서는 emitted DOM/event behavior와 CSS focus를 version별로 re-qualify합니다."],
    codeExamples: [nodeExample("react11-source-capabilities", "원본 event capability와 미검증 영역 분리", "React11SourceCapabilities.mjs", "local files의 관찰 capability를 synthetic audit rows로 집계합니다.", String.raw`const files = [
  { id: "event01", reference: true, argument: true, propagation: false },
  { id: "event02", reference: true, argument: true, propagation: false },
  { id: "event03", reference: true, argument: false, propagation: false },
  { id: "event04", reference: false, argument: true, propagation: false },
  { id: "button-wrapper", reference: false, argument: true, propagation: false },
];
const references = files.filter((file) => file.reference).map((file) => file.id);
const argumentsUsed = files.filter((file) => file.argument).map((file) => file.id);
const propagation = files.filter((file) => file.propagation).map((file) => file.id);
console.log("files=" + files.length);
console.log("reference=" + references.join(","));
console.log("argument=" + argumentsUsed.join(","));
console.log("propagation=" + (propagation.join(",") || "none"));
console.log("gap=" + files.filter((file) => !file.propagation).length);`, "files=5\nreference=event01,event02,event03\nargument=event01,event02,event04,button-wrapper\npropagation=none\ngap=5", ["local-event01", "local-event02", "local-event03", "local-event04", "local-btn", "local-react-events-doc", "react-events"])],
  },
  {
    id: "pass-handler-not-call",
    title: "render에는 function을 전달하고 interaction 시점에만 intent를 실행합니다",
    lead: "JSX braces의 JavaScript는 render 중 평가되므로 handler expression의 값이 function인지 호출 결과인지 구분해야 합니다.",
    explanations: [
      "onClick={handleAction}은 function value를 전달해 React가 click 때 호출하도록 합니다. onClick={handleAction()}은 render 때 즉시 실행하고 return value를 handler prop으로 넣으므로 side effect, infinite update와 undefined handler를 만들 수 있습니다.",
      "argument를 전달하려면 onClick={() => handleAction(itemId)}처럼 function을 새로 만듭니다. event object도 필요하면 (event) => handleAction(itemId, event)로 명시하고 function body가 어느 render snapshot의 props/state를 캡처하는지 이해합니다.",
      "inline function allocation 자체를 correctness bug로 보지 않습니다. memoized child의 measured render cost나 referential contract가 있을 때만 useCallback 등을 검토하고 dependency completeness와 stale closure 위험을 함께 시험합니다.",
      "handler는 user intent 이름(onSave, onSelectModule)으로 custom component에 전달하고 내부 host element의 onClick에 연결합니다. 이 방식은 parent가 behavior를 소유하고 button primitive는 semantics/style을 소유하게 합니다.",
    ],
    concepts: [
      c("render-time evaluation", "component function과 JSX expressions가 current props/state로 실행되어 다음 element tree를 계산하는 시점입니다.", ["event side effect를 실행하지 않습니다.", "Strict Mode에서 반복될 수 있습니다."]),
      c("deferred callback", "현재는 실행하지 않고 future event에 호출하도록 전달한 function value입니다.", ["closure를 캡처합니다.", "cancel/guard 정책을 가질 수 있습니다."]),
      c("intent callback", "DOM event 이름보다 product action 의미를 표현하는 custom component prop입니다.", ["onSave/onDismiss처럼 이름 짓습니다.", "input modality와 분리합니다."]),
    ],
    diagnostics: [
      d("Too many re-renders 오류가 납니다.", "render 중 호출된 handler가 state를 갱신해 다시 render를 요청합니다.", ["handler JSX syntax", "state setter stack", "render count", "function return"], "function reference 또는 deferred arrow를 전달합니다.", "component render test에서 setter/network/analytics 호출 0을 assert합니다."),
      d("memoized child가 stale item ID로 action을 실행합니다.", "callback identity를 고정하면서 dependency에서 item ID를 누락했습니다.", ["closure creation render", "useCallback dependencies", "prop changes", "action payload"], "dependency를 완전하게 두거나 event 시점의 ID를 명시 argument로 전달하는 구조로 단순화합니다.", "rerender 후 latest-ID interaction test를 둡니다."),
    ],
    expertNotes: ["성능 optimization으로 callback을 고정하기 전에 React Profiler와 user latency를 측정합니다.", "handler prop name은 implementation event보다 domain intent를 표현하면 keyboard shortcut, menu와 voice action도 같은 behavior를 재사용할 수 있습니다."],
    codeExamples: [nodeExample("react11-pass-versus-call", "handler 전달과 즉시 호출 timing 비교", "React11PassHandler.mjs", "render/click phase를 분리한 작은 scheduler로 side-effect timing을 출력합니다.", String.raw`const log = [];
function action(label) {
  log.push("action:" + label);
  return undefined;
}
const calledDuringRender = action("called");
const passedHandler = () => action("passed");
log.push("render-complete");
if (typeof calledDuringRender === "function") calledDuringRender();
passedHandler();
console.log("trace=" + log.join(">"));
console.log("render-actions=" + log.slice(0, 1).length);
console.log("called-handler-type=" + typeof calledDuringRender);
console.log("passed-handler-type=" + typeof passedHandler);`, "trace=action:called>render-complete>action:passed\nrender-actions=1\ncalled-handler-type=undefined\npassed-handler-type=function", ["local-event01", "local-event03", "react-events"])],
  },
  {
    id: "event-object-target-currenttarget",
    title: "event object의 target·currentTarget·type·defaultPrevented를 구분해 읽습니다",
    lead: "nested icon/text를 클릭할 때 target은 달라질 수 있지만 listener가 연결된 control은 currentTarget이므로 action ownership에 맞는 값을 사용해야 합니다.",
    explanations: [
      "target은 event가 시작된 가장 안쪽 node이고 currentTarget은 현재 실행 중인 listener가 붙은 node입니다. button 안 SVG/path나 span을 클릭해도 button dataset/disabled state를 읽으려면 currentTarget을 사용합니다.",
      "React event handler는 React event object를 받고 일부 fields는 native event와 대응하지만 모든 mapping을 public API로 의존하지 않습니다. type, target/currentTarget, modifier keys, defaultPrevented처럼 문서화된 contract를 사용합니다.",
      "event object를 async callback에 저장할 때 현재 React version의 lifetime을 가정하기보다 필요한 primitive values를 handler에서 즉시 추출합니다. DOM node를 장기 보관하면 detached tree와 privacy-sensitive input이 retention될 수 있습니다.",
      "TypeScript에서는 구체적인 element/currentTarget type을 선언해 value/checked/dataset을 안전하게 읽고 target을 무조건 cast하지 않습니다. event delegation은 closest와 containment 검증으로 허용된 action node만 선택합니다.",
    ],
    concepts: [
      c("event target", "event가 dispatch된 가장 안쪽 object입니다.", ["nested child일 수 있습니다.", "listener owner와 같지 않을 수 있습니다."]),
      c("currentTarget", "현재 호출되는 listener가 등록된 object입니다.", ["handler 실행 중 의미가 있습니다.", "control-owned metadata에 적합합니다."]),
      c("defaultPrevented", "어떤 listener가 cancelable event의 default action을 취소했는지 나타내는 상태입니다.", ["propagation stop과 독립적입니다.", "cancelable 여부를 확인합니다."]),
    ],
    diagnostics: [
      d("button text를 누르면 되지만 icon을 누르면 action ID가 undefined입니다.", "event.target에서 dataset을 읽어 nested SVG/path를 받았습니다.", ["target tag", "currentTarget tag", "dataset owner", "composed path"], "button-owned metadata는 event.currentTarget에서 읽거나 ID를 closure argument로 전달합니다.", "nested child 각각을 클릭하는 integration test를 둡니다."),
      d("async log에 event DOM 전체와 typed input이 오래 남습니다.", "event/node object를 queue에 그대로 보관했습니다.", ["queued payload", "retained DOM", "log schema", "sensitive fields"], "handler에서 allowlisted primitive action ID와 sanitized metadata만 추출합니다.", "telemetry schema/secret/PII scan과 retention test를 둡니다."),
    ],
    expertNotes: ["event target은 shadow DOM/composed path에서 retarget될 수 있으므로 web component integration은 actual browser에서 검증합니다.", "analytics에 raw target text/value/DOM HTML을 넣지 않고 stable non-sensitive action code를 사용합니다."],
    codeExamples: [nodeExample("react11-target-currenttarget", "nested target과 listener owner 비교", "React11Targets.mjs", "synthetic nested click에서 target/currentTarget metadata를 분리합니다.", String.raw`const button = { tag: "BUTTON", dataset: { action: "save" } };
const icon = { tag: "SVG", dataset: {} };
const event = { type: "click", target: icon, currentTarget: button, defaultPrevented: false };
const fromTarget = event.target.dataset.action || "missing";
const fromCurrent = event.currentTarget.dataset.action || "missing";
console.log("type=" + event.type);
console.log("target=" + event.target.tag);
console.log("currentTarget=" + event.currentTarget.tag);
console.log("target-action=" + fromTarget);
console.log("current-action=" + fromCurrent);`, "type=click\ntarget=SVG\ncurrentTarget=BUTTON\ntarget-action=missing\ncurrent-action=save", ["react-dom-common", "dom-events", "ui-events"])],
  },
  {
    id: "capture-target-bubble-phases",
    title: "capture→target→bubble 순서와 React tree ownership을 trace로 설명합니다",
    lead: "child interaction을 parent가 함께 받는 것은 중복 호출이 아니라 기본 propagation일 수 있으므로 handler order와 stopping point를 evidence로 봅니다.",
    explanations: [
      "event는 propagation path를 따라 capture phase에서 ancestor부터 target으로 이동하고 target listener를 실행한 뒤 bubble phase에서 ancestor로 올라갑니다. React에서는 onClickCapture와 onClick으로 이 순서를 관찰하며 특정 event의 bubbling 예외는 current docs에서 확인합니다.",
      "DOM tree와 React component ownership을 혼동하지 않습니다. portals와 multiple roots, shadow DOM에서는 visual/component ancestry와 native composed path가 다를 수 있어 actual integration trace가 필요합니다.",
      "parent card onClick 안에 child action button을 두면 child action 뒤 card navigation도 실행될 수 있습니다. nested interactive controls 자체가 invalid/혼란스러운 구조인지 먼저 고치고, 독립 actions는 sibling controls와 explicit callbacks로 설계합니다.",
      "capture listener는 global shortcuts, routing, analytics와 policy enforcement에 쓰일 수 있지만 stopPropagation 이후에도 capture가 먼저 실행될 수 있습니다. 수집 데이터 최소화, sampling와 failure isolation을 둡니다.",
    ],
    concepts: [
      c("capture phase", "event가 root 쪽 ancestor에서 target 방향으로 내려가며 capture listeners를 실행하는 단계입니다.", ["onClickCapture로 관찰합니다.", "target보다 먼저 실행됩니다."]),
      c("target phase", "event target에 등록된 listeners가 실행되는 단계입니다.", ["capture/bubble listener ordering을 확인합니다.", "default action과 별개입니다."]),
      c("bubble phase", "target에서 ancestor 방향으로 올라가며 bubble listeners를 실행하는 단계입니다.", ["delegation에 활용합니다.", "stopPropagation으로 중단할 수 있습니다."]),
    ],
    diagnostics: [
      d("row 안 삭제 버튼을 누르자 상세 화면도 열립니다.", "button click이 row의 bubble handler까지 전파됐습니다.", ["capture/target/bubble trace", "nested interactive markup", "handler ownership", "navigation result"], "actions를 semantic siblings로 재구성하거나 child에서 명시적으로 propagation을 중지하고 callback chain을 문서화합니다.", "각 nested target의 action-count/navigation assertions를 둡니다."),
      d("analytics가 한 click을 두 번 기록합니다.", "root capture와 component callback이 같은 event를 독립 event처럼 기록했습니다.", ["event/action ID", "capture/bubble logs", "retry policy", "multiple roots"], "한 canonical instrumentation boundary와 dedupe ID를 두고 product callback과 transport를 분리합니다.", "한 interaction당 expected telemetry count를 integration test합니다."),
    ],
    expertNotes: ["propagation은 implicit coupling이므로 중요한 business flow에서는 child가 parent intent callback을 명시 호출하는 구조가 traceability를 높일 수 있습니다.", "native event path와 React event delegation implementation detail에 기대는 코드는 React upgrade 때 다시 qualification합니다."],
    codeExamples: [nodeExample("react11-propagation-order", "capture·target·bubble과 stop 위치", "React11Propagation.mjs", "세 node path의 listeners를 순서대로 실행하고 target에서 bubble을 중단합니다.", String.raw`const trace = [];
const path = ["root", "panel", "button"];
for (const node of path) trace.push("capture:" + node);
trace.push("target:button");
let stopped = true;
if (!stopped) {
  for (const node of path.slice(0, -1).reverse()) trace.push("bubble:" + node);
}
console.log("trace=" + trace.join(">"));
console.log("capture-count=" + trace.filter((item) => item.startsWith("capture")).length);
console.log("target-count=" + trace.filter((item) => item.startsWith("target")).length);
console.log("bubble-count=" + trace.filter((item) => item.startsWith("bubble")).length);
console.log("stopped=" + stopped);`, "trace=capture:root>capture:panel>capture:button>target:button\ncapture-count=3\ntarget-count=1\nbubble-count=0\nstopped=true", ["react-events", "react-dom-common", "dom-events", "ui-events"])],
  },
  {
    id: "stop-propagation-explicit-chaining",
    title: "stopPropagation은 최소 범위에 쓰고 중요한 behavior는 명시 callback chain으로 연결합니다",
    lead: "전역적으로 event를 막으면 analytics, shortcuts와 부모 behavior까지 조용히 사라질 수 있으므로 semantic structure와 ownership을 먼저 고칩니다.",
    explanations: [
      "stopPropagation은 같은 event가 ancestor listeners로 더 전파되는 것을 막지만 current target의 다른 listener나 default action까지 자동으로 취소하지 않습니다. 즉시 전파 중단과 default cancellation은 별도 API/contract입니다.",
      "모든 child에서 stopPropagation을 호출하는 패턴은 component composition을 깨뜨립니다. card 전체 click target을 제거하고 제목 link와 별도 action buttons를 제공하면 event suppression 없이도 명확한 semantics를 얻을 수 있습니다.",
      "child primitive가 internal telemetry 후 parent onActivate를 명시 호출하면 실행 순서와 error boundary가 코드에 드러납니다. parent behavior가 꼭 propagation에 의존해야 하는지 검토하고 contract tests로 action count를 고정합니다.",
      "Escape, click-away와 global shortcuts는 여러 layers가 경쟁할 수 있습니다. topmost overlay ownership, event phase와 cancellation policy를 central stack manager에 두고 IME/composition과 nested dialogs를 실제 browser에서 시험합니다.",
    ],
    concepts: [
      c("stopPropagation", "event가 propagation path의 다음 object로 이동하지 않도록 표시하는 operation입니다.", ["default action을 취소하지 않습니다.", "현재 listener 이후 세부 동작을 구분합니다."]),
      c("explicit callback chain", "child handler가 local work 뒤 parent intent callback을 코드로 직접 호출하는 흐름입니다.", ["순서를 추적하기 쉽습니다.", "error/telemetry ownership을 정의합니다."]),
      c("interaction ownership", "어떤 component/layer가 event를 해석하고 state/navigation/side effect를 실행할 책임이 있는지 정한 경계입니다.", ["nested layers에서 중요합니다.", "한 action의 canonical owner를 둡니다."]),
    ],
    diagnostics: [
      d("modal 안 click 이후 외부 click-away가 함께 닫히거나 전혀 동작하지 않습니다.", "overlay stack의 event phase와 propagation policy가 component마다 다릅니다.", ["capture/bubble logs", "portal DOM", "topmost overlay", "pointerdown/click timing"], "central overlay manager가 topmost layer와 dismissal event를 소유하도록 합니다.", "nested overlay pointer/keyboard close matrix를 둡니다."),
      d("stopPropagation 추가 후 보안 감사 click log가 사라졌습니다.", "감사 listener가 bubble phase에만 의존했습니다.", ["listener phase", "stopping component", "audit requirements", "privacy schema"], "필수 capture 관측과 product callbacks를 분리하고 최소 metadata만 기록합니다.", "stopped interaction에서도 expected audit count를 검증합니다."),
    ],
    expertNotes: ["propagation suppression은 구조 결함의 빠른 patch가 될 수 있으므로 code review에서 semantic alternative를 먼저 요구합니다.", "global capture analytics는 stopPropagation을 우회할 수 있지만 사용자의 raw target/value를 수집할 권한을 주지는 않습니다."],
  },
  {
    id: "prevent-default-native-actions",
    title: "preventDefault와 propagation을 분리하고 native form/link behavior를 의도적으로 유지합니다",
    lead: "submit/navigation을 막는 코드와 parent handler를 막는 코드는 다른 문제이며 둘을 혼동하면 keyboard submit와 links가 깨집니다.",
    explanations: [
      "preventDefault는 cancelable event의 browser default action을 취소합니다. form submit의 navigation/reload를 client validation 후 막을 수 있지만 stopPropagation은 submit default를 막지 않고, preventDefault는 parent listener 호출을 막지 않습니다.",
      "form은 onSubmit을 canonical boundary로 삼아 click과 Enter submit을 같은 path로 처리합니다. submit button에는 명시 type을 두고 unrelated button은 type=button으로 지정해 accidental submit을 피합니다.",
      "anchor navigation은 링크의 핵심 의미이므로 href를 유지하고 modifier/middle click, open-in-new-tab과 copy-address behavior를 router integration에서 보존합니다. 단순히 onClick preventDefault로 모든 navigation을 custom 처리하지 않습니다.",
      "validation 실패에서는 invalid fields와 error summary relationships, focus 이동을 제공하고 성공/진행 중에는 duplicate submit guard와 visible status를 둡니다. default를 막은 뒤 action이 실패하면 사용자가 retry할 경로가 있어야 합니다.",
    ],
    concepts: [
      c("default action", "event dispatch 뒤 browser/HTML element가 수행하도록 정의된 built-in behavior입니다.", ["submit/navigation/activation 등이 있습니다.", "event마다 cancelable 여부가 다릅니다."]),
      c("preventDefault", "cancelable event의 default action을 실행하지 않도록 표시하는 operation입니다.", ["propagation과 독립적입니다.", "defaultPrevented로 확인합니다."]),
      c("canonical submit boundary", "pointer와 keyboard activation을 모두 form submit event 하나에서 validation/command로 처리하는 경계입니다.", ["button click에만 의존하지 않습니다.", "duplicate prevention을 둡니다."]),
    ],
    diagnostics: [
      d("button click은 저장되지만 input에서 Enter를 누르면 page가 reload됩니다.", "save logic이 button onClick에만 있고 form onSubmit/default cancellation이 없습니다.", ["form element", "button type", "onSubmit", "network/navigation trace"], "form onSubmit을 canonical handler로 두고 validation 후 필요한 경우 preventDefault합니다.", "click/Enter submit을 같은 action count로 검증합니다."),
      d("child에서 preventDefault했지만 parent card onClick도 실행됩니다.", "default cancellation을 propagation stop으로 오해했습니다.", ["defaultPrevented", "bubble trace", "parent handler", "native action"], "semantic structure를 고치고 필요할 때 stopPropagation 또는 explicit callbacks를 별도로 적용합니다.", "default/propagation 2×2 behavior matrix를 test합니다."),
    ],
    expertNotes: ["React form action APIs를 사용하더라도 native form semantics, pending/error state와 progressive enhancement 요구를 별도로 검토합니다.", "href 없는 clickable anchor와 preventDefault-only links는 navigation semantics를 잃으므로 button으로 바꿉니다."],
    codeExamples: [nodeExample("react11-default-versus-propagation", "default cancellation과 propagation의 2×2 분리", "React11Cancellation.mjs", "네 event case에서 native action과 parent listener 실행 여부를 계산합니다.", String.raw`function dispatch({ prevent, stop }) {
  return {
    child: true,
    parent: !stop,
    nativeDefault: !prevent,
    defaultPrevented: prevent,
  };
}
const cases = [
  ["none", dispatch({ prevent: false, stop: false })],
  ["prevent", dispatch({ prevent: true, stop: false })],
  ["stop", dispatch({ prevent: false, stop: true })],
  ["both", dispatch({ prevent: true, stop: true })],
];
for (const [name, result] of cases) {
  console.log(name + "=" + [result.child, result.parent, result.nativeDefault, result.defaultPrevented].join(","));
}`, "none=true,true,true,false\nprevent=true,true,false,true\nstop=true,false,true,false\nboth=true,false,false,true", ["react-events", "react-form", "dom-events", "html-activation", "html-links"])],
  },
  {
    id: "semantic-keyboard-pointer-interaction",
    title: "native controls로 pointer·keyboard·assistive technology activation을 같은 intent에 연결합니다",
    lead: "click은 mouse 전용 event가 아니며 native button/link가 여러 input modalities를 click/submit으로 합성해 주는 이점을 보존해야 합니다.",
    explanations: [
      "action은 button, navigation은 href가 있는 anchor를 사용하면 focusability, role, Enter/Space activation과 disabled/form behavior의 상당 부분을 browser가 제공합니다. div에 role/tabIndex/onKeyDown을 조합하는 것은 더 많은 edge cases와 유지 비용을 만듭니다.",
      "button은 visible 또는 computed accessible name을 가져야 하고 focus indicator가 보여야 합니다. icon-only control, toggle의 pressed state와 menu disclosure의 expanded/controls relationship을 pattern에 맞게 표현합니다.",
      "pointerdown/up/click timing은 drag, long press와 click-away에서 달라집니다. 핵심 action을 pointerdown에만 연결하면 keyboard/screen-reader activation이 빠질 수 있으므로 native click/submit을 기본으로 하고 gesture가 필요한 경우 alternative를 제공합니다.",
      "keyboard shortcut은 control을 대체하지 않고 discoverable한 보조 경로입니다. input/IME, platform modifier, reserved shortcuts와 focus context를 확인하며 user-configurable/disable 정책을 둡니다.",
    ],
    concepts: [
      c("activation behavior", "user input을 element의 click, submit 또는 navigation action으로 해석하는 platform-defined behavior입니다.", ["native element가 제공합니다.", "input modality별로 검증합니다."]),
      c("keyboard operability", "모든 기능을 keyboard interface로 완료할 수 있는 성질입니다.", ["Tab 도달만으로 충분하지 않습니다.", "focus order/visibility도 포함합니다."]),
      c("name role value", "user agent와 assistive technology가 UI component의 식별·종류·현재 state를 programmatically 알 수 있는 contract입니다.", ["custom controls에 특히 중요합니다.", "state 변경을 알립니다."]),
    ],
    diagnostics: [
      d("role=button div가 Tab에는 잡히지만 Space에서 page만 scroll됩니다.", "native button activation을 불완전하게 재구현했습니다.", ["rendered tag", "keydown/keyup handling", "click count", "default scroll"], "native button으로 교체하고 CSS로 appearance를 조정합니다.", "mouse/Enter/Space 각각 action 1회와 focus 유지 test를 둡니다."),
      d("disabled처럼 보이는 custom control이 keyboard로 계속 실행됩니다.", "CSS/aria-disabled만 적용하고 handler guard와 native disabled semantics를 구분하지 않았습니다.", ["disabled/aria-disabled", "Tab order", "handler guard", "name/state"], "가능하면 native disabled를 사용하고 aria-disabled pattern이면 event guard와 설명을 함께 둡니다.", "pointer/keyboard/programmatic activation matrix를 둡니다."),
    ],
    expertNotes: ["React onClick은 다양한 activation에서 호출될 수 있으므로 이름을 mouseClick처럼 좁게 해석하지 않습니다.", "custom composite widgets가 필요하면 해당 WAI-ARIA APG pattern의 keyboard model을 전체 구현하고 native alternative와 비용을 비교합니다."],
    codeExamples: [nodeExample("react11-keyboard-activation", "native button과 generic div activation matrix", "React11KeyboardActivation.mjs", "element별 click/Enter/Space built-in action count를 간소화해 비교합니다.", String.raw`const inputs = ["pointer", "Enter", "Space"];
function activates(element, input) {
  if (element === "button") return inputs.includes(input);
  if (element === "link") return input === "pointer" || input === "Enter";
  return input === "pointer";
}
for (const element of ["button", "link", "div"]) {
  const results = inputs.map((input) => input + ":" + activates(element, input));
  console.log(element + "=" + results.join(","));
}
console.log("button-complete=" + inputs.every((input) => activates("button", input)));
console.log("div-gap=" + inputs.filter((input) => !activates("div", input)).length);`, "button=pointer:true,Enter:true,Space:true\nlink=pointer:true,Enter:true,Space:false\ndiv=pointer:true,Enter:false,Space:false\nbutton-complete=true\ndiv-gap=2", ["local-event02", "local-event03", "local-event04", "local-btn", "html-button", "html-activation", "wcag-keyboard", "wcag-name-role-value", "aria-button"])],
  },
  {
    id: "handler-props-design-system",
    title: "design-system component가 behavior를 고정하지 않고 intent handler와 native props를 안전하게 전달하게 합니다",
    lead: "재사용 button이 data 값에 따라 내부에서 action을 추측하면 호출자 behavior, type, disabled와 analytics ownership이 불투명해집니다.",
    explanations: [
      "Button primitive는 onPress/onClick 같은 명시 callback, children/label, type, disabled와 필요한 aria state를 받고 최종 native button에 연결합니다. domain action 종류를 문자열로 받고 내부 switch/console/alert하는 구조는 presentation과 business behavior를 결합합니다.",
      "custom intent prop은 onSaveDraft처럼 product 의미를 표현할 수 있고 primitive는 이를 native onClick에 연결합니다. 호출 순서, propagation policy와 disabled guard를 문서화하며 consumer handler 오류를 swallow하지 않습니다.",
      "rest props forwarding은 data/aria props와 event handlers를 편리하게 전달하지만 invalid role, raw telemetry와 secret-bearing data attribute도 퍼뜨릴 수 있습니다. 허용 surface, conflict precedence와 ref forwarding을 type/test로 제한합니다.",
      "third-party UI library wrapper는 emitted element, loading/disabled focus, ripple/motion, polymorphic prop와 version compatibility를 검증합니다. library example을 사용했다는 이유로 접근성 책임이 library로 이전되지는 않습니다.",
    ],
    concepts: [
      c("behavior injection", "parent가 callback prop으로 child의 action behavior를 제공하는 composition입니다.", ["presentation과 intent를 분리합니다.", "test doubles를 쉽게 만듭니다."]),
      c("prop forwarding", "wrapper가 지원하는 host/component props를 내부 element에 전달하는 방식입니다.", ["allowlist/precedence가 필요합니다.", "unknown sensitive data를 경계합니다."]),
      c("design-system contract", "variant별 rendered element, name/role/state, events와 focus behavior를 versioned하게 정의한 API입니다.", ["시각 style만이 아닙니다.", "library upgrade gate가 필요합니다."]),
    ],
    diagnostics: [
      d("공통 Btn에서 label은 바뀌지만 모든 버튼이 같은 내부 행동을 합니다.", "data prop으로 behavior를 추측하고 caller callback을 받지 않습니다.", ["wrapper props", "internal switch/log", "caller intent", "tests"], "onActivate intent callback을 받아 native button handler에서 호출하도록 리팩터링합니다.", "서로 다른 caller callbacks/action counts를 wrapper test합니다."),
      d("type=submit이 wrapper에서 사라져 form Enter 경로가 깨집니다.", "native button props를 component API가 노출/forward하지 않습니다.", ["rendered type", "prop spread/precedence", "form submit", "TypeScript props"], "ButtonHTMLAttributes 기반 allowlisted API와 명시 default type 정책을 둡니다.", "button/form variants의 rendered attributes와 submit integration을 검증합니다."),
    ],
    expertNotes: ["onClick과 onPress naming은 library philosophy보다 emitted input semantics와 consumer expectation을 명확히 문서화하는 것이 중요합니다.", "component API에서 DOM event object를 domain layer 깊숙이 전달하지 않고 필요한 intent payload로 변환합니다."],
  },
  {
    id: "async-actions-duplicate-guard",
    title: "async handler의 snapshot·중복 실행·abort·retry를 explicit action state로 통제합니다",
    lead: "handler가 Promise를 반환해도 React가 business transaction을 자동 직렬화하지 않으므로 빠른 activation과 late response를 설계해야 합니다.",
    explanations: [
      "빠른 double click, Enter key repeat와 network retry는 같은 command를 여러 번 보낼 수 있습니다. pending state로 UI를 guard하고 server-side idempotency/unique invariant를 함께 사용해 client button disable만 신뢰하지 않습니다.",
      "async closure는 handler가 생성된 render의 props/state snapshot을 캡처합니다. response가 돌아왔을 때 route/item이 바뀌었으면 stale result를 무시하거나 request identity와 current owner를 대조합니다.",
      "AbortController 같은 cancellation은 불필요한 response processing을 줄이지만 이미 server가 수행한 write를 되돌리는 transaction이 아닙니다. command 결과 reconciliation과 idempotent retry를 별도로 둡니다.",
      "handler 오류는 visible error state와 retry action으로 변환하고 unhandled rejection, raw server message/stack과 sensitive payload를 console/telemetry에 남기지 않습니다. action ID, sanitized error category와 duration만 관측합니다.",
    ],
    concepts: [
      c("in-flight guard", "동일 user intent가 처리 중일 때 duplicate local execution을 막는 state/logic입니다.", ["server idempotency를 대체하지 않습니다.", "keyboard/pointer 모두 적용합니다."]),
      c("stale completion", "이전 request 결과가 더 새로운 user context/state 이후 도착해 현재 UI를 덮는 상황입니다.", ["request identity를 비교합니다.", "cancel/reconcile합니다."]),
      c("idempotency key", "같은 logical command의 retry를 server가 중복 적용하지 않게 식별하는 stable token입니다.", ["non-sensitive random value를 사용합니다.", "scope/expiry를 정의합니다."]),
    ],
    diagnostics: [
      d("빠르게 두 번 누르면 두 records가 생성됩니다.", "UI guard와 server idempotency/unique constraint가 없습니다.", ["event count", "network requests", "pending timing", "server command IDs"], "synchronous in-flight guard와 idempotency key, server invariant를 함께 적용합니다.", "double click/key repeat/network retry fault test를 둡니다."),
      d("이전 item 저장 response가 새 item 화면에 success를 표시합니다.", "async completion을 current selection/request와 대조하지 않았습니다.", ["request/item IDs", "route transition", "abort signal", "completion reducer"], "request ID와 target ID가 current state와 맞을 때만 result를 적용합니다.", "out-of-order completion test를 deterministic deferred promises로 둡니다."),
    ],
    expertNotes: ["disabled pending button이 focus를 잃거나 retry 설명을 못 읽게 할 수 있으므로 aria-disabled/status와 focus policy를 product context에 맞게 검증합니다.", "client action token을 authentication/authorization credential로 취급하지 않으며 server가 권한을 다시 검증합니다."],
    codeExamples: [nodeExample("react11-async-guard", "빠른 중복 activation과 stale completion 차단", "React11AsyncGuard.mjs", "in-flight/request ID state machine으로 accepted/ignored completion을 계산합니다.", String.raw`let pending = null;
let nextId = 1;
const trace = [];
function start(target) {
  if (pending) { trace.push("duplicate:" + target); return null; }
  pending = { requestId: "r" + nextId++, target };
  trace.push("start:" + pending.requestId + ":" + target);
  return { ...pending };
}
function finish(request, currentTarget) {
  const accepted = pending && request && pending.requestId === request.requestId && request.target === currentTarget;
  trace.push((accepted ? "apply:" : "ignore:") + (request?.requestId || "none"));
  if (pending?.requestId === request?.requestId) pending = null;
  return Boolean(accepted);
}
const first = start("item-a");
start("item-a");
const applied = finish(first, "item-b");
console.log("trace=" + trace.join(">"));
console.log("applied=" + applied);
console.log("pending=" + (pending ? pending.requestId : "none"));`, "trace=start:r1:item-a>duplicate:item-a>ignore:r1\napplied=false\npending=none", ["react-events", "react-dom-common"])],
  },
  {
    id: "event-performance-delegation",
    title: "event delegation과 handler identity는 측정된 성능 문제에만 적용합니다",
    lead: "많은 inline handlers를 무조건 제거하기보다 browser/React delegation, list size와 child memoization을 실제 profile로 확인합니다.",
    explanations: [
      "React event system은 root/container 수준 delegation과 synthetic event dispatch를 사용하지만 exact implementation은 version detail일 수 있습니다. application은 documented event behavior에 의존하고 listener count를 추정으로 최적화하지 않습니다.",
      "큰 list에서 parent delegation을 직접 구현하면 target.closest, containment, disabled/hidden items와 nested actions를 안전하게 처리해야 합니다. per-item closure가 명확하고 profile에서 문제가 없다면 더 단순한 구조를 유지합니다.",
      "useCallback은 function identity를 cache하지만 stale dependencies, code complexity와 memory를 추가합니다. memoized child가 실제로 expensive하고 prop identity가 re-render 원인이라는 profile evidence가 있을 때 적용합니다.",
      "고빈도 pointermove/scroll/input에서는 handler work, layout reads/writes와 state update frequency를 측정합니다. passive listener가 필요한 native integration, requestAnimationFrame coalescing와 accessibility feedback latency를 함께 검토합니다.",
    ],
    concepts: [
      c("event delegation", "ancestor listener 하나가 descendant에서 bubble된 events를 target/path로 분기하는 방식입니다.", ["dynamic items에 유용할 수 있습니다.", "target validation이 필요합니다."]),
      c("handler identity", "두 render의 callback이 같은 function reference인지 나타내는 특성입니다.", ["correctness와 자동으로 같지 않습니다.", "memoized consumers에서 측정합니다."]),
      c("interaction latency", "user input부터 visible/announced response까지 걸리는 시간입니다.", ["main-thread work를 포함합니다.", "AT feedback도 고려합니다."]),
    ],
    diagnostics: [
      d("delegated list click이 nested delete icon에서도 row open을 실행합니다.", "closest selector와 action priority/containment를 명확히 하지 않았습니다.", ["target path", "matched elements", "nested action", "disabled/removed rows"], "action-specific data attribute를 closest로 찾고 container containment와 priority를 검증합니다.", "각 nested target/whitespace/dynamic row test를 둡니다."),
      d("useCallback을 추가했지만 interaction latency가 그대로입니다.", "병목이 function allocation이 아니라 expensive render/layout/network였습니다.", ["Profiler commits", "handler work", "layout trace", "network timing"], "측정된 dominant cost를 줄이고 불필요 memoization을 제거합니다.", "optimization 전후 user-timing과 render counts를 budget에 비교합니다."),
    ],
    expertNotes: ["listener 수보다 handler가 수행하는 synchronous work와 layout thrashing이 사용자 latency에 더 큰 경우가 많습니다.", "delegation metadata에 raw user content를 넣지 않고 stable action codes만 사용합니다."],
  },
  {
    id: "event-testing-observability-security",
    title: "실제 user input으로 event order·action count·default·focus와 sanitized telemetry를 검증합니다",
    lead: "handler 함수를 직접 호출하는 unit test는 React wiring, native activation과 propagation/default behavior를 검증하지 못합니다.",
    explanations: [
      "component/browser test는 role/name으로 control을 찾고 pointer, Enter/Space, form Enter와 Tab focus로 interaction합니다. action callback count/payload, parent listener count, navigation/submit, focus와 status를 user-observable 결과로 assert합니다.",
      "capture/target/bubble trace가 필요하면 test-only listener에서 phase/currentTarget/defaultPrevented를 구조화해 기록합니다. console text 전체를 oracle로 쓰지 않고 stable event IDs와 expected sequence를 비교합니다.",
      "race test는 deferred promises와 fake/controlled clock으로 double activation, out-of-order completion, abort와 retry를 재현합니다. implementation batching timing보다 final state/action invariants를 우선합니다.",
      "telemetry에는 action code, component version, latency와 sanitized result category만 허용합니다. target text, input value, DOM HTML, URL query와 event object를 통째로 수집하지 않으며 sampling/consent/retention을 적용합니다.",
    ],
    concepts: [
      c("behavioral event test", "실제 element/input 경로로 dispatch해 handler wiring과 user-observable 결과를 확인하는 test입니다.", ["function direct-call test와 다릅니다.", "native defaults/focus를 포함합니다."]),
      c("action cardinality", "한 user intent가 business callback/network command/telemetry를 몇 번 발생시켜야 하는지 정한 불변식입니다.", ["보통 1회를 명시합니다.", "retry/dedupe와 연결합니다."]),
      c("sanitized event telemetry", "event object 대신 allowlisted non-sensitive action metadata만 기록하는 관측 계약입니다.", ["raw target/value를 금지합니다.", "retention과 sampling을 둡니다."]),
    ],
    diagnostics: [
      d("unit test는 통과하지만 실제 button click에 callback이 0회입니다.", "handler 함수를 직접 호출해 JSX wiring을 건너뛰었습니다.", ["rendered control", "prop forwarding", "disabled overlay", "actual user event"], "component를 render하고 role/name으로 찾아 실제 activation을 수행합니다.", "pointer/keyboard/submit variant별 callback cardinality를 assert합니다."),
      d("analytics payload에 input value와 DOM text가 포함됩니다.", "event target/object를 generic serializer에 전달했습니다.", ["telemetry schema", "payload samples", "input fields", "retention"], "allowlisted action code/result/latency만 새 object로 구성합니다.", "schema validation과 secret/PII canary scan으로 전송을 차단합니다."),
    ],
    expertNotes: ["browser의 trusted event와 test-created event 차이가 있으므로 critical activation은 실제 browser automation으로 qualification합니다.", "screen reader가 trigger하는 activation도 native click path에 합쳐지는지 representative AT/browser에서 확인합니다."],
  },
  {
    id: "interaction-release-governance",
    title: "event interaction을 release gate·incident trace·rollback과 연결합니다",
    lead: "handler refactor와 UI library upgrade는 화면이 같아 보여도 propagation, submit, keyboard와 duplicate command behavior를 바꿀 수 있습니다.",
    explanations: [
      "release gate는 critical actions의 pointer/keyboard/form paths, action cardinality, default navigation/submit, focus, async guard와 sanitized telemetry를 production build에서 검증합니다. library/browser matrix와 known exceptions를 versioned evidence로 남깁니다.",
      "feature flag와 canary는 new interaction handler를 일부 synthetic/test traffic에서 비교하되 실제 user의 raw event stream을 수집하지 않습니다. duplicate command/error rates와 task-level outcomes만 privacy-preserving aggregate로 봅니다.",
      "incident trace에는 action ID, handler/component version, phase, command ID, sanitized category와 timestamps를 연결합니다. 한 번의 user intent가 capture/component/network에서 중복 생성되었는지 correlation으로 확인합니다.",
      "rollback은 이전 frontend artifact뿐 아니라 service worker/CDN cache와 compatible backend idempotency contract를 포함합니다. rollback 후 mouse만 smoke하지 않고 keyboard submit, nested actions와 stale response를 재검증합니다.",
    ],
    concepts: [
      c("interaction contract gate", "input modality별 expected event/action/default/focus 결과를 배포 전 강제하는 기준입니다.", ["production build에서 실행합니다.", "action cardinality를 포함합니다."]),
      c("correlation ID", "한 logical action의 UI event, command와 result를 sensitive payload 없이 연결하는 identifier입니다.", ["authentication token이 아닙니다.", "scope/retention을 제한합니다."]),
      c("interaction rollback", "이전 handler/component artifact로 되돌리고 event semantics와 command invariants가 복구됐는지 확인하는 절차입니다.", ["cache/version을 포함합니다.", "keyboard path를 재검증합니다."]),
    ],
    diagnostics: [
      d("UI library upgrade 후 Space에서 action이 두 번 실행됩니다.", "wrapper와 library native activation/keydown handler가 모두 callback을 호출합니다.", ["keydown/click trace", "library DOM", "callback count", "version diff"], "native click을 canonical path로 두고 중복 manual key handler를 제거합니다.", "pointer/Enter/Space action 1회 contract를 upgrade gate에 둡니다."),
      d("frontend rollback 뒤에도 duplicate writes가 계속됩니다.", "cached chunk와 이미 전송된/retried commands, server idempotency state를 함께 보지 않았습니다.", ["asset versions", "command IDs", "retry queue", "server dedupe"], "atomic artifact/cache rollback과 command reconciliation을 수행합니다.", "mixed-version/delayed retry rollback rehearsal를 둡니다."),
    ],
    expertNotes: ["event-level logs를 전부 보존하는 대신 sampled structured action traces와 reproducible synthetic tests를 사용합니다.", "interaction exception에는 mouse-only workaround가 아니라 keyboard/AT 사용자의 동등한 경로, owner와 expiry를 명시합니다."],
    codeExamples: [nodeExample("react11-interaction-gate", "input modality별 action cardinality release gate", "React11InteractionGate.mjs", "critical actions의 pointer/keyboard/default 결과를 집계합니다.", String.raw`const checks = [
  { action: "save", input: "pointer", count: 1, focus: true, defaultOk: true },
  { action: "save", input: "Enter", count: 1, focus: true, defaultOk: true },
  { action: "toggle", input: "Space", count: 1, focus: true, defaultOk: true },
  { action: "navigate", input: "Enter", count: 1, focus: true, defaultOk: true },
];
const failed = checks.filter((item) => item.count !== 1 || !item.focus || !item.defaultOk);
console.log("checks=" + checks.length);
console.log("actions=" + [...new Set(checks.map((item) => item.action))].join(","));
console.log("inputs=" + checks.map((item) => item.input).join(","));
console.log("failed=" + failed.length);
console.log("release=" + (failed.length === 0 ? "go" : "hold"));`, "checks=4\nactions=save,toggle,navigate\ninputs=pointer,Enter,Space,Enter\nfailed=0\nrelease=go", ["react-events", "react-dom-common", "wcag-keyboard", "wcag-name-role-value", "aria-button"])],
  },
];

const sources: SessionSource[] = [
  { id: "local-event01", repository: "local learning source", path: "my-app01\\src\\pages\\step06-event\\Event01.jsx", usedFor: ["handler reference vs invocation", "inline argument wrapper", "render-time pitfall"], evidence: "2026-07-14 read-only audit: 30 lines, 1,015 bytes, SHA-256 07A22D6C35ED5BE0C84ABA4E81C69BFF72A003628E6E6EA8FBFB65B47DB8AAFA. 원본 alert/UI 문자열은 복사하지 않았습니다." },
  { id: "local-event02", repository: "local learning source", path: "my-app01\\src\\pages\\step06-event\\Event02.jsx", usedFor: ["module-scope wrapper", "children", "native button"], evidence: "24 lines, 784 bytes, SHA-256 74F63B2388E39EF3B37BC42903EB0BEE06690F23C867773C71662ED5D950277D. 원본 action 문자열은 복사하지 않았습니다." },
  { id: "local-event03", repository: "local learning source", path: "my-app01\\src\\pages\\step06-event\\Event03.jsx", usedFor: ["third-party Button", "separate/inline handler", "disabled variant"], evidence: "23 lines, 921 bytes, SHA-256 B7737A10255194C7762737611B75F5F1269FB0547F4710422534DF9142A0D31F. 원본 console/UI 문자열과 external tutorial URL은 복사하지 않았습니다." },
  { id: "local-event04", repository: "local learning source", path: "my-app01\\src\\pages\\step06-event\\Event04.jsx", usedFor: ["custom Btn composition", "children", "data prop behavior"], evidence: "12 lines, 288 bytes, SHA-256 97E0330B48CFAD8FFFE6648A34F6DF01745C8C0438F8ECCD30EFA2383AD5A99E. 원본 labels는 복사하지 않았습니다." },
  { id: "local-btn", repository: "local learning source", path: "my-app01\\src\\components\\Btn.jsx", usedFor: ["reusable UI wrapper", "internal handler", "children"], evidence: "8 lines, 215 bytes, SHA-256 553C5BFD519626BBE004E17B1826030BF11159CBB4937D5F4A8C4B1908E123AA. 원본 logged data는 복사하지 않았습니다." },
  { id: "local-react-events-doc", repository: "local learning source", path: "REACT\\docs\\react\\04-events-forms.md", usedFor: ["local event lesson", "handler pass/call", "execution guide"], evidence: "282 lines, 11,153 bytes, SHA-256 4705EA901D97ED2576EA7214D389826BC172C4E1619EE262A0B15FDAEFF8DD44. embedded strings, frame/asset addresses와 form values는 복사하지 않았습니다." },
  { id: "react-events", repository: "React Documentation", path: "learn/responding-to-events", publicUrl: "https://react.dev/learn/responding-to-events", usedFor: ["handler passing", "propagation", "capture", "stop/default", "semantic controls"], evidence: "current React 19.2 primary event guidance를 확인했습니다." },
  { id: "react-dom-common", repository: "React DOM API", path: "reference/react-dom/components/common#react-event-object", publicUrl: "https://react.dev/reference/react-dom/components/common#react-event-object", usedFor: ["React event object", "currentTarget/target", "event props"], evidence: "current React DOM event object contract를 확인했습니다." },
  { id: "react-form", repository: "React DOM API", path: "reference/react-dom/components/form", publicUrl: "https://react.dev/reference/react-dom/components/form", usedFor: ["form submit", "form action", "native form boundary"], evidence: "current React form component API를 확인했습니다." },
  { id: "dom-events", repository: "WHATWG DOM Standard", path: "#events", publicUrl: "https://dom.spec.whatwg.org/#events", usedFor: ["dispatch", "target/currentTarget", "propagation/cancellation"], evidence: "living DOM event dispatch standard를 확인했습니다." },
  { id: "ui-events", repository: "W3C UI Events", path: "UI Events", publicUrl: "https://w3c.github.io/uievents/", usedFor: ["keyboard/mouse event order", "event interfaces", "activation inputs"], evidence: "W3C UI Events specification을 확인했습니다." },
  { id: "html-activation", repository: "WHATWG HTML Standard", path: "interaction.html#activation-behavior", publicUrl: "https://html.spec.whatwg.org/multipage/interaction.html#activation-behavior", usedFor: ["activation behavior", "click", "focus"], evidence: "living HTML activation behavior를 확인했습니다." },
  { id: "html-button", repository: "WHATWG HTML Standard", path: "form-elements.html#the-button-element", publicUrl: "https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element", usedFor: ["native button", "submit/type/disabled"], evidence: "living HTML button contract를 확인했습니다." },
  { id: "html-links", repository: "WHATWG HTML Standard", path: "links.html#following-hyperlinks", publicUrl: "https://html.spec.whatwg.org/multipage/links.html#following-hyperlinks", usedFor: ["anchor navigation", "default link behavior"], evidence: "living HTML hyperlink following behavior를 확인했습니다." },
  { id: "wcag-keyboard", repository: "W3C WAI WCAG 2.2", path: "Understanding/keyboard", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html", usedFor: ["keyboard operability", "critical journeys"], evidence: "WCAG 2.2 keyboard explanation을 확인했습니다." },
  { id: "wcag-name-role-value", repository: "W3C WAI WCAG 2.2", path: "Understanding/name-role-value", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html", usedFor: ["control name/role/state", "custom UI"], evidence: "WCAG 2.2 name, role, value explanation을 확인했습니다." },
  { id: "aria-button", repository: "W3C WAI ARIA APG", path: "patterns/button", publicUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/button/", usedFor: ["button keyboard interaction", "toggle state", "accessible name"], evidence: "WAI-ARIA APG button pattern을 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "react-11-state-event-patterns", slug: "react-11-event-handler-propagation", courseId: "react", moduleId: "react-events-forms-hooks", order: 1,
  title: "이벤트 처리·전파와 접근 가능한 상호작용",
  subtitle: "step06 handler 문법을 capture·target·bubble, native default, keyboard, async cardinality와 운영 evidence로 확장합니다",
  level: "중급", estimatedMinutes: 110,
  coreQuestion: "React handler를 render 때 호출하지 않고 user intent 시점에 실행하며, propagation/default/native activation/async 흐름을 모든 input modality에서 정확히 한 번 처리한다고 어떻게 증명할까요?",
  summary: "my-app01 step06 Event01~04, components/Btn과 REACT event 문서 6개를 read-only로 감사합니다. 원본은 handler reference/inline arrow, arguments/children, native/third-party Button과 disabled variant를 보여 주지만 capture-target-bubble, target/currentTarget, stopPropagation/preventDefault, semantic keyboard activation, async duplicate/stale completion과 privacy-safe telemetry evidence는 없습니다. handler pass-not-call, event object, propagation phases, explicit callbacks, native defaults/forms/links, keyboard/pointer accessibility, design-system handler props, async guards, measured delegation, behavioral tests와 release governance를 연결합니다. 일곱 순수 Node examples는 source gap, pass/call timing, target/currentTarget, propagation trace, cancellation 2×2, native activation과 async/release cardinality를 synthetic exact stdout으로 실행합니다.",
  objectives: ["원본 handler capabilities와 고급 interaction evidence gap을 분리한다.", "handler reference와 render-time invocation을 구분한다.", "target/currentTarget/defaultPrevented를 안전하게 읽는다.", "capture-target-bubble와 stopPropagation의 적용 범위를 trace한다.", "preventDefault와 native form/link behavior를 분리한다.", "native controls로 pointer/keyboard/AT activation을 보장한다.", "async duplicate/stale completion과 sanitized telemetry를 통제한다.", "input modality별 action cardinality를 release/rollback gate로 운영한다."],
  prerequisites: [{ title: "접근 가능한 component rendering capstone", reason: "event handler는 앞 세션에서 완성한 native role/name/state/focus를 가진 rendered controls 위에 연결되어야 합니다.", sessionSlug: "react-10-accessible-rendering-capstone" }],
  keywords: ["event handler", "SyntheticEvent", "target", "currentTarget", "capture", "bubble", "stopPropagation", "preventDefault", "default action", "button", "keyboard", "form submit", "action cardinality", "async guard", "event delegation"],
  topics,
  lab: {
    title: "합성 action toolbar와 form을 propagation·keyboard·async fault까지 qualification하기",
    scenario: "native buttons/link/form과 nested panel을 합성 data로 구현해 input modality별 event sequence, action count, focus, default behavior와 sanitized command trace를 증명합니다.",
    setup: ["Node 20+", "current React development/production build", "modern browsers", "component/browser user-event tools", "keyboard와 representative screen reader", "deferred promise/network stub", "synthetic non-PII action IDs", "실제 input values·event objects·remote assets·credentials 금지"],
    steps: ["6개 local source의 path/size/hash와 live handler wiring을 기록합니다.", "render-time invocation 반례와 reference/argument wrapper를 component test합니다.", "nested icon/button/panel에서 target/currentTarget와 capture-target-bubble trace를 기록합니다.", "stopPropagation/preventDefault 2×2와 explicit callback chain을 실행합니다.", "form click/Enter submit, anchor navigation/modifier와 button pointer/Enter/Space를 검증합니다.", "custom Button wrapper의 role/name/type/disabled/callback forwarding을 확인합니다.", "double activation, key repeat, out-of-order completion, abort와 server idempotency stub을 fault test합니다.", "role/name/focus/action cardinality와 sanitized telemetry schema를 assert합니다.", "production build/library version에서 keyboard/AT critical journey를 반복합니다.", "canary/rollback 후 mixed asset version과 delayed command reconciliation을 rehearsal합니다."],
    expectedResult: ["render 중 action count가 0이고 interaction마다 expected callback이 정확히 실행됩니다.", "capture-target-bubble와 stopping/default 결과가 trace와 일치합니다.", "nested target에서도 current owner/action ID가 안정적입니다.", "pointer, Enter, Space와 form Enter가 native semantics로 동등한 intent를 실행합니다.", "double activation/stale completion이 partial/duplicate command를 만들지 않습니다.", "telemetry에 raw DOM/input/event/secret이 없고 release/rollback evidence가 남습니다."],
    cleanup: ["synthetic commands, browser storage와 deferred requests를 제거합니다.", "test capture listeners, analytics stubs와 debug logging을 해제합니다.", "service worker/cache와 feature flags를 원복합니다.", "원본 my-app01/REACT hashes와 git status unchanged를 readback합니다."],
    extensions: ["React12에서 state snapshot/batching와 functional updater를 handler queue에 적용합니다.", "pointer capture/drag-and-drop/long-press를 accessible alternatives와 별도 qualification합니다.", "portal/modal/menu의 APG keyboard/focus/event stack을 확장합니다.", "server idempotency와 optimistic UI compensation을 end-to-end command model로 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples와 browser handler trace를 실행해 event lifecycle을 대조하세요.", requirements: ["stdout을 완전 일치시킵니다.", "render action 0을 확인합니다.", "target/currentTarget을 nested click으로 비교합니다.", "capture-target-bubble 순서를 기록합니다.", "prevent/stop 2×2를 확인합니다.", "pointer/Enter/Space action count를 확인합니다.", "async/release gate를 검증합니다."], hints: ["handler 함수를 직접 호출하지 말고 실제 role/name control을 통해 activation하세요."], expectedOutcome: "한 interaction이 DOM/React event에서 business command까지 어디서 몇 번 실행되는지 설명합니다.", solutionOutline: ["audit→pass→inspect→propagate/cancel→activate→guard→gate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Btn/Event examples를 accessible intent-callback toolbar와 form으로 리팩터링하세요.", requirements: ["원본 문자열을 복사하지 않습니다.", "native button/link/form을 사용합니다.", "onIntent callback을 주입합니다.", "target/currentTarget과 propagation 정책을 명시합니다.", "keyboard/default/focus를 검증합니다.", "double/stale async를 차단합니다.", "sanitized action telemetry와 fault tests를 둡니다."], hints: ["문자열 prop으로 behavior를 추측하지 말고 caller가 function을 전달하게 하세요."], expectedOutcome: "input modality와 nesting에 관계없이 action이 정확히 한 번 실행됩니다.", solutionOutline: ["semantic primitive→intent API→event policy→async command→tests 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React interaction governance를 작성하세요.", requirements: ["pass-not-call lint/review rule을 둡니다.", "target/currentTarget/propagation/default 기준을 둡니다.", "native keyboard/design-system contract를 둡니다.", "async cardinality/idempotency/retry를 둡니다.", "event telemetry privacy schema를 둡니다.", "browser/AT/library matrix를 둡니다.", "canary/incident/rollback 절차를 둡니다."], hints: ["이벤트 API 목록이 아니라 user intent부터 durable result까지 lifecycle을 표준화하세요."], expectedOutcome: "interaction correctness가 구현·시험·관측·복구 가능한 표준이 됩니다.", solutionOutline: ["own→dispatch→cancel/default→activate→commit→observe→recover 순서입니다."] },
  ],
  nextSessions: ["react-12-state-batching-functional-update"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["my-app01 step06 Event01~04, components/Btn과 REACT event 문서의 path, line/byte counts와 SHA-256을 read-only로 기록했습니다.", "원본은 handler reference/inline wrapper/children/native 및 third-party Button을 보여 주지만 capture/bubble, target/currentTarget, stop/default, keyboard/async behavior를 실행하지 않습니다.", "원본 alert/console/UI labels, embedded URLs와 실제 입력값은 public prose/examples에 복사하지 않았습니다.", "third-party Button의 실제 host DOM과 disabled/keyboard/focus는 installed version과 production build에서 별도 검증해야 합니다.", "event propagation, default actions와 AT activation은 actual browser/React root/portal topology에서 qualification해야 합니다."] },
});

export default session;
