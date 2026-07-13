import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function nodeExample(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "node", filename, purpose, code,
    walkthrough: [
      { lines: "1-10", explanation: "render snapshot, queued replacement/updater 또는 immutable state fixture를 선언합니다." },
      { lines: "11-끝에서 5줄 전", explanation: "React state semantics에서 분리한 순수 queue/reducer로 batching, closure와 structural sharing을 결정적으로 계산합니다." },
      { lines: "마지막 5줄", explanation: "next state, snapshot, identity와 render 요청 결과를 exact stdout으로 출력합니다." },
    ],
    run: { environment: ["Node.js 20 이상", "ECMAScript module", "React·DOM·network·credential 불필요"], command: "node " + filename },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "순수 queue model은 실제 React scheduler, lanes, render/commit, Strict Mode와 browser event boundaries를 대체하지 않으므로 React integration tests를 별도로 실행합니다."] },
    experiments: [
      { change: "replacement와 updater 순서, snapshot 또는 object/array operation을 바꿉니다.", prediction: "queue를 왼쪽부터 적용한 next state와 preserved identities가 명시 규칙대로 달라집니다.", result: "Node output과 React test의 rendered result/action count를 비교합니다." },
      { change: "동일 action을 빠르게 반복하거나 async completion 순서를 뒤집습니다.", prediction: "functional updater/request identity를 사용한 경로는 lost update와 stale overwrite를 방지합니다.", result: "deferred promise와 user-event로 final state, pending/error와 retry를 검증합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-state-counter-audit",
    title: "step03-state와 CounterEx01~10을 state capability·개인정보 공백·현대 semantics로 감사합니다",
    lead: "원본 예제를 모두 같은 수준의 state 증거로 합치지 않고 어떤 transition/identity를 실제로 보여 주는지 파일별로 분리합니다.",
    explanations: [
      "NumberCount와 CounterEx01은 component local let을 event에서 변경하고 console에는 새 값이 보이지만 React가 다시 render하지 않아 화면 snapshot은 바뀌지 않는 이유를 설명합니다. 다음 render가 우연히 발생하면 local variable은 초기값으로 다시 생성되므로 external mutable store도 아닙니다.",
      "CounterEx02는 useState initial value와 direct setCnt(cnt±1)를 사용해 state update가 render를 요청하는 기본을 보여 줍니다. 하지만 같은 handler에서 여러 direct setter를 호출하거나 async/rapid actions가 겹치는 경우의 batching/updater queue는 실행하지 않습니다.",
      "CounterEx03~06은 controlled text/checkbox와 reset, CounterEx07~08은 object spread와 computed property, CounterEx09는 lazy initializer, array spread/filter, useRef ID, CounterEx10은 boolean toggle을 보여 줍니다. 각각은 유용하지만 direct snapshot values를 사용하므로 concurrent/repeated updates에서는 functional form을 검토해야 합니다.",
      "CounterEx04·07·08에는 계정 입력처럼 보이는 field와 식별 가능한 sample literals가 포함됩니다. 이 세션은 해당 values를 공개 fixture, output, prose에 복사하지 않고 field 구조와 update technique만 generic synthetic keys로 재현합니다.",
      "REACT local 문서는 functional updater를 언급하지만 current React batching, state snapshot, updater queue purity, object/array identity와 Strict Mode behavior는 current official primary docs로 다시 검증합니다.",
    ],
    concepts: [
      c("state source audit", "각 source가 initial state, transition, identity와 rendered result 중 무엇을 실제로 보여 주는지 기록하는 과정입니다.", ["주석과 실행 path를 구분합니다.", "advanced semantics를 과장하지 않습니다."]),
      c("state evidence gap", "setter가 존재한다는 사실과 repeated/async/concurrent updates가 올바른 final state를 만든다는 증거 사이의 차이입니다.", ["queue/retry를 시험합니다.", "rendered result로 확인합니다."]),
      c("sanitized fixture", "실제/식별 가능한 strings, credentials와 remote assets를 제거하고 동일 구조만 재현한 합성 test data입니다.", ["field names도 최소화합니다.", "logs/snapshots를 scan합니다."]),
    ],
    diagnostics: [
      d("console count는 변하지만 화면 count는 그대로입니다.", "React state가 아닌 render-local 변수를 mutation했습니다.", ["variable declaration", "setter 호출", "render count", "displayed snapshot"], "useState/useReducer 등 React가 소유하는 state로 transition을 표현합니다.", "user action 뒤 rendered value를 assert하는 test를 둡니다."),
      d("공개 문서 snapshot에 account-like sample 값이 남습니다.", "원본 fixture를 그대로 복사했습니다.", ["source literals", "generated examples", "test snapshots", "build artifacts"], "generic synthetic values로 교체하고 public artifact PII/secret scan을 실행합니다.", "fixture review와 automated pattern/entropy scan을 release gate에 둡니다."),
    ],
    expertNotes: ["source hash는 학습 이력 provenance이며 code가 current React concurrency에 안전하다는 보증이 아닙니다.", "CounterEx04의 결과처럼 credential-like input을 DOM에 다시 표시하는 pattern은 public teaching example에서도 재현하지 않습니다."],
    codeExamples: [nodeExample("react12-source-matrix", "원본 counter capability matrix", "React12SourceMatrix.mjs", "12 local source를 state/controlled/collection/updater evidence로 분류합니다.", String.raw`const files = [
  { id: "number", state: false, controlled: false, collection: false, updater: false },
  { id: "counter01", state: false, controlled: false, collection: false, updater: false },
  { id: "counter02", state: true, controlled: false, collection: false, updater: false },
  { id: "counter03", state: true, controlled: true, collection: false, updater: false },
  { id: "counter04", state: true, controlled: true, collection: false, updater: false },
  { id: "counter05", state: true, controlled: true, collection: false, updater: false },
  { id: "counter06", state: true, controlled: true, collection: false, updater: false },
  { id: "counter07", state: true, controlled: true, collection: false, updater: false },
  { id: "counter08", state: true, controlled: true, collection: false, updater: false },
  { id: "counter09", state: true, controlled: true, collection: true, updater: false },
  { id: "counter10", state: true, controlled: true, collection: false, updater: false },
  { id: "local-doc", state: true, controlled: true, collection: true, updater: true },
];
for (const key of ["state", "controlled", "collection", "updater"]) {
  console.log(key + "=" + files.filter((file) => file[key]).length);
}
console.log("files=" + files.length);`, "state=10\ncontrolled=9\ncollection=2\nupdater=1\nfiles=12", ["local-number-count", "local-counter01", "local-counter02", "local-counter03", "local-counter04", "local-counter05", "local-counter06", "local-counter07", "local-counter08", "local-counter09", "local-counter10", "local-react-state-doc", "react-use-state", "react-state-structure"])],
  },
  {
    id: "state-memory-render-commit",
    title: "state를 component의 persistent memory이자 다음 render 요청으로 이해합니다",
    lead: "setter는 화면 text를 직접 바꾸는 mutation이 아니라 React가 보관한 state를 갱신하도록 요청해 새 render/commit을 유도합니다.",
    explanations: [
      "component function의 local variables는 render 호출마다 새로 계산됩니다. event handler closure가 한 render의 local value를 잡을 수는 있지만 그 mutation만으로 React는 새 tree를 계산할 이유를 알지 못합니다.",
      "useState는 현재 render의 state snapshot과 setter를 반환합니다. setter 호출은 update를 queue하고 React가 component를 다시 호출하도록 요청하며 DOM commit은 render 결과가 이전과 달라 필요한 경우 수행됩니다.",
      "state를 어디에 둘지는 owner와 lifetime으로 결정합니다. page refresh를 넘어야 하면 storage/server, sibling과 공유해야 하면 common owner/context/store를 검토하고 단순 render-local derivation을 state에 중복 저장하지 않습니다.",
      "state setter에 Object.is와 같은 값이면 React가 update를 건너뛸 수 있지만 render/Strict Mode implementation details를 count contract로 삼지 않습니다. correctness test는 user-visible final state와 side-effect cardinality를 봅니다.",
    ],
    concepts: [
      c("component memory", "render 사이 보존되어 UI가 interaction history를 반영하게 하는 React-managed state입니다.", ["local variable과 다릅니다.", "component position/identity에 연결됩니다."]),
      c("render request", "state/props/context 변화로 component function을 다시 호출해 next UI description을 계산하도록 요청하는 과정입니다.", ["DOM mutation과 동일하지 않습니다.", "batch될 수 있습니다."]),
      c("commit", "계산된 React tree의 필요한 변경을 host DOM에 적용하는 단계입니다.", ["render purity와 분리합니다.", "Effects timing과 연결됩니다."]),
    ],
    diagnostics: [
      d("일반 변수로 고친 값이 parent re-render 뒤 초기값으로 돌아갑니다.", "값이 component state/store가 아니라 render-local initialization에 있습니다.", ["declaration scope", "parent render trigger", "state hook", "desired lifetime"], "요구 lifetime과 owner에 맞는 state/store로 이동합니다.", "parent rerender/unmount/remount별 preservation test를 둡니다."),
      d("setter 직후 DOM을 동기 조회했더니 이전 값입니다.", "setter를 즉시 DOM mutation으로 오해했습니다.", ["handler snapshot", "queued updates", "commit timing", "test wait boundary"], "다음 render/commit 후 user-visible output을 관찰하고 imperative integration만 documented escape hatch를 사용합니다.", "user-event 후 role/text/state가 갱신될 때까지 semantic assertion을 둡니다."),
    ],
    expertNotes: ["state를 React 밖 mutable singleton에 숨기면 concurrent roots, tests와 SSR request 사이 격리가 깨질 수 있습니다.", "render count를 줄이는 것보다 render가 pure하고 final UI가 correct한 것이 먼저입니다."],
    codeExamples: [nodeExample("react12-local-versus-state", "render-local mutation과 persistent state 비교", "React12LocalState.mjs", "두 render에서 local initializer와 external React-like state shelf를 비교합니다.", String.raw`let storedState = 5;
function render() {
  let local = 5;
  return {
    read: () => ({ local, state: storedState }),
    incrementLocal: () => { local += 1; },
    incrementState: () => { storedState += 1; },
  };
}
const first = render();
first.incrementLocal();
first.incrementState();
console.log("first=" + JSON.stringify(first.read()));
const second = render();
console.log("second=" + JSON.stringify(second.read()));
console.log("local-reset=" + (second.read().local === 5));
console.log("state-persisted=" + (second.read().state === 6));`, "first={\"local\":6,\"state\":6}\nsecond={\"local\":5,\"state\":6}\nlocal-reset=true\nstate-persisted=true", ["local-number-count", "local-counter01", "local-counter02", "react-render-commit", "react-use-state"])],
  },
  {
    id: "state-render-snapshot-closure",
    title: "각 render의 state는 고정 snapshot이며 handler와 async closure가 그 값을 캡처합니다",
    lead: "setter 뒤 같은 handler에서 읽는 state가 변하지 않는 이유를 substitution model로 설명하면 stale closure와 async race를 예측할 수 있습니다.",
    explanations: [
      "React가 component를 호출할 때 해당 render의 state values, props와 handlers가 계산됩니다. 그 render 안에서 state variable은 setter를 호출해도 바뀌지 않고 update는 다음 render를 위한 queue에 들어갑니다.",
      "같은 handler에서 setCount(count + 1)을 세 번 호출하면 모두 같은 count snapshot으로 같은 replacement value를 계산합니다. 세 increment intent를 누적하려면 updater function이 queue의 이전 결과를 받아야 합니다.",
      "setTimeout, promise와 subscription callback은 생성된 render의 snapshot을 캡처합니다. 어떤 경우에는 이 안정된 snapshot이 의도이고, latest value가 필요한 subscription/imperative callback은 Effect dependency, ref 또는 event-specific API를 목적에 맞게 사용합니다.",
      "stale closure를 무조건 ref로 우회하지 않습니다. state transition은 functional updater로, render-dependent effect는 complete dependencies로, async command completion은 request identity/current owner validation으로 해결합니다.",
    ],
    concepts: [
      c("render snapshot", "특정 component 호출에서 props/state/local values가 고정된 UI와 handler view입니다.", ["setter로 즉시 바뀌지 않습니다.", "다음 render는 새 snapshot입니다."]),
      c("closure capture", "function이 만들어질 때 lexical scope의 values를 참조하도록 보존하는 JavaScript 특성입니다.", ["async에서도 유지됩니다.", "stale/current 요구를 구분합니다."]),
      c("substitution model", "handler 안 state variable을 해당 render의 실제 값으로 치환해 queued updates를 예측하는 사고 방식입니다.", ["direct replacement 반례에 유용합니다.", "queue 순서와 함께 씁니다."]),
    ],
    diagnostics: [
      d("setter를 호출한 다음 console에는 계속 이전 count가 찍힙니다.", "현재 handler snapshot의 state를 읽고 있습니다.", ["render number", "captured value", "queued next value", "next rendered output"], "현재 snapshot과 next state를 분리해 이름 짓고 다음 render 결과를 관찰합니다.", "handler log와 rendered value를 별도 assertions로 둡니다."),
      d("늦은 response가 현재 선택과 다른 item을 덮어씁니다.", "async callback이 old target/state를 캡처했고 completion validation이 없습니다.", ["request target/ID", "current selection", "completion order", "abort/reducer logic"], "request identity와 target이 current owner와 일치할 때만 result를 적용합니다.", "out-of-order deferred response test를 둡니다."),
    ],
    expertNotes: ["snapshot은 버그가 아니라 event가 발생한 UI context를 일관되게 보는 contract입니다.", "latest ref는 render를 유발하지 않고 React data flow를 우회하므로 rendering state 저장소로 사용하지 않습니다."],
    codeExamples: [nodeExample("react12-snapshot-async", "setter 뒤에도 async closure가 old snapshot을 봄", "React12Snapshot.mjs", "captured render value와 다음 stored state를 분리합니다.", String.raw`let stored = 0;
function makeHandler(snapshot) {
  return () => {
    stored = snapshot + 5;
    return { captured: snapshot, queued: stored };
  };
}
const handlerFromRender0 = makeHandler(stored);
const immediate = handlerFromRender0();
stored = 9;
const delayedRead = immediate.captured;
console.log("captured=" + immediate.captured);
console.log("queued=" + immediate.queued);
console.log("stored-now=" + stored);
console.log("delayed-read=" + delayedRead);
console.log("snapshot-stable=" + (delayedRead === 0));`, "captured=0\nqueued=5\nstored-now=9\ndelayed-read=0\nsnapshot-stable=true", ["local-counter02", "local-counter10", "react-state-snapshot", "react-use-state"])],
  },
  {
    id: "automatic-batching-update-queue",
    title: "React가 event work 뒤 state updates를 queue/batch하는 이유와 경계를 이해합니다",
    lead: "batching은 여러 setter마다 half-finished UI를 commit하지 않고 한 coherent next render를 계산하도록 돕지만 update intent를 자동 누적해 주지는 않습니다.",
    explanations: [
      "React는 일반적으로 event handler code가 끝난 뒤 queued updates를 처리해 여러 state changes를 함께 render합니다. 이를 통해 서로 관련된 fields가 중간 상태로 화면에 나타나는 것을 줄이고 render/commit 비용을 조절합니다.",
      "batching과 같은 state에 여러 replacement values를 넣는 것은 별개입니다. count snapshot이 0일 때 setCount(count + 1) 세 번은 1을 세 번 replace하도록 queue하므로 final 1이 됩니다.",
      "서로 다른 intentional events는 각각 별도 event context로 처리됩니다. 자동 batching의 exact timing/async coverage를 version 내부 구현처럼 외우기보다 public docs와 final-state invariants를 기준으로 코드를 작성합니다.",
      "flushSync는 third-party/browser imperative integration에서 DOM이 즉시 필요할 때의 드문 escape hatch이며 performance를 해치고 pending work/Suspense를 강제로 flush할 수 있습니다. 일반 state correctness 해결책으로 쓰지 않습니다.",
    ],
    concepts: [
      c("batching", "여러 state update를 모아 불필요한 intermediate commits 없이 처리하는 React behavior입니다.", ["update intent 누적과 다릅니다.", "event 경계를 이해합니다."]),
      c("replacement update", "setter에 next value를 직접 전달해 queue의 state를 그 값으로 바꾸는 update입니다.", ["snapshot에서 계산될 수 있습니다.", "뒤 update가 다시 덮을 수 있습니다."]),
      c("coherent render", "관련 state fields가 의도한 조합으로 함께 보이는 UI snapshot입니다.", ["half-finished state를 피합니다.", "domain invariant를 함께 설계합니다."]),
    ],
    diagnostics: [
      d("+3 button이 count를 1만 올립니다.", "같은 snapshot으로 계산한 replacement update를 세 번 queue했습니다.", ["handler snapshot", "setter arguments", "queue order", "final render"], "이전 queued result에 의존하는 세 transitions를 functional updaters로 전달합니다.", "direct vs functional +3 rendered result test를 둡니다."),
      d("flushSync를 곳곳에 추가한 뒤 interaction이 느려집니다.", "batching을 우회해 매 update를 동기 commit하려 했습니다.", ["flushSync call sites", "commit count", "main-thread trace", "imperative requirement"], "일반 code에서는 제거하고 꼭 필요한 third-party read/write boundary로 최소화합니다.", "performance budget과 escape-hatch review를 둡니다."),
    ],
    expertNotes: ["React의 scheduler priority/lanes는 advanced internals일 수 있으므로 application contract는 public state semantics와 user outcomes에 둡니다.", "관련 state가 항상 함께 바뀌어야 하면 여러 setters보다 reducer 또는 단일 state transition이 invariant를 명확히 할 수 있습니다."],
    codeExamples: [nodeExample("react12-batching-replace-updater", "replacement 세 번과 updater 세 번의 final state", "React12Batching.mjs", "같은 snapshot에서 만든 values와 queue-dependent functions를 비교합니다.", String.raw`function process(initial, queue) {
  return queue.reduce((state, update) => typeof update === "function" ? update(state) : update, initial);
}
const snapshot = 0;
const replacements = [snapshot + 1, snapshot + 1, snapshot + 1];
const updaters = [(n) => n + 1, (n) => n + 1, (n) => n + 1];
const replaced = process(snapshot, replacements);
const accumulated = process(snapshot, updaters);
console.log("snapshot=" + snapshot);
console.log("replacement-queue=" + replacements.join(","));
console.log("replacement-final=" + replaced);
console.log("updater-final=" + accumulated);
console.log("difference=" + (accumulated - replaced));`, "snapshot=0\nreplacement-queue=1,1,1\nreplacement-final=1\nupdater-final=3\ndifference=2", ["local-counter02", "local-react-state-doc", "react-queueing", "react-state-snapshot", "react-use-state"])],
  },
  {
    id: "functional-updater-queue-purity",
    title: "이전 queued state에 의존하는 transition은 pure functional updater로 표현합니다",
    lead: "setState(prev => next)는 latest value를 마법처럼 읽는 syntax가 아니라 queue가 이전 update 결과를 차례로 전달하는 state transition입니다.",
    explanations: [
      "functional updater는 pending state 하나를 받아 next state를 반환합니다. React가 queue를 처리할 때 updater들을 순서대로 적용하므로 increment, toggle, append와 previous object merge처럼 이전 state에 의존하는 intent를 안전하게 compose합니다.",
      "replacement와 updater를 섞으면 queue 순서가 중요합니다. replace 5, increment, replace 42, double이라면 각 operation을 왼쪽부터 적용해 final 84를 예측할 수 있어야 합니다.",
      "updater는 pure해야 하며 이전 state를 mutation하거나 network/logging/random/time side effect를 수행하지 않습니다. development Strict Mode는 updater를 반복 호출해 impurity를 찾을 수 있으므로 result equivalence와 side-effect count 0을 보장합니다.",
      "항상 functional form을 강제할 필요는 없지만 same-event repeated update, closure age가 긴 async callback 또는 previous state 기반 transition에는 명확합니다. next value가 event payload로 완전히 대체되는 input update는 direct value도 자연스럽습니다.",
    ],
    concepts: [
      c("functional updater", "pending state를 입력받아 next state를 반환하도록 setter에 전달하는 pure function입니다.", ["queue 순서대로 호출됩니다.", "이전 render snapshot 직접 참조를 줄입니다."]),
      c("update queue", "한 state hook에 대기 중인 replacement와 updater operations의 ordered sequence입니다.", ["왼쪽부터 적용해 예측합니다.", "render 전에 처리될 수 있습니다."]),
      c("updater purity", "updater가 input state를 mutation/외부 side effect 없이 next value만 계산하는 성질입니다.", ["Strict Mode에서 중요합니다.", "시간/랜덤/network를 배제합니다."]),
    ],
    diagnostics: [
      d("Strict Mode에서 item이 두 번 추가됩니다.", "updater 안에서 이전 array를 push하거나 external list를 mutation했습니다.", ["updater body", "push/splice", "external writes", "repeated-call result"], "spread/map/filter로 새 collection을 반환하고 side effect를 handler/Effect의 정확한 경계로 옮깁니다.", "동일 input으로 updater를 두 번 호출해 result/side-effect equivalence를 test합니다."),
      d("replacement와 updater를 섞은 handler의 final value를 팀이 다르게 예측합니다.", "queue order를 명시하지 않고 setter를 즉시 assignment처럼 읽었습니다.", ["ordered setter calls", "replacement values", "updater functions", "expected final"], "operation queue를 표로 적고 가능하면 한 named transition/reducer로 단순화합니다.", "mixed queue exact-result unit test를 둡니다."),
    ],
    expertNotes: ["functional updater는 stale server response를 자동으로 막지 않으므로 request identity와 domain version을 별도로 확인합니다.", "updater parameter 이름은 prev보다 domain 의미(count/items/form)를 사용하면 transition review가 쉬워집니다."],
    codeExamples: [nodeExample("react12-mixed-update-queue", "replacement와 updater의 ordered composition", "React12MixedQueue.mjs", "mixed queue를 왼쪽부터 처리하고 step별 state를 출력합니다.", String.raw`const queue = [
  { label: "replace-5", apply: () => 5 },
  { label: "increment", apply: (n) => n + 1 },
  { label: "replace-42", apply: () => 42 },
  { label: "double", apply: (n) => n * 2 },
];
let state = 0;
const trace = [];
for (const update of queue) {
  state = update.apply(state);
  trace.push(update.label + ":" + state);
}
console.log("initial=0");
console.log("trace=" + trace.join(">"));
console.log("final=" + state);
console.log("operations=" + queue.length);`, "initial=0\ntrace=replace-5:5>increment:6>replace-42:42>double:84\nfinal=84\noperations=4", ["react-queueing", "react-use-state", "react-strict-mode"])],
  },
  {
    id: "immutable-object-state",
    title: "object state는 mutation하지 않고 changed path만 copy해 새 identity를 만듭니다",
    lead: "object spread는 top-level shallow copy이므로 nested field와 concurrent changes를 잃지 않도록 state shape와 updater를 함께 설계합니다.",
    explanations: [
      "state object의 field를 직접 대입하면 같은 reference를 mutation해 이전 snapshots와 memoized consumers를 오염시키고 React가 change를 감지하지 못할 수 있습니다. setter에 새 object를 전달해 변경 identity를 표현합니다.",
      "{ ...prev, field: value }는 top-level fields를 보존하지만 nested object는 같은 reference입니다. nested field를 바꾸려면 각 changed level을 copy하거나 state를 더 평평하게 정규화하고 Immer 같은 도구도 mutation illusion의 generated immutable result를 이해합니다.",
      "CounterEx07/08처럼 input마다 object spread를 사용할 때 closure의 form을 직접 읽으면 같은 batch의 다른 field update를 덮을 수 있습니다. setForm(prev => ({ ...prev, [name]: value }))로 queue의 latest object를 기반으로 합니다.",
      "state object에 password/token/large API response를 통째로 저장·표시하지 않습니다. form은 필요한 fields만 가지며 sensitive value를 result preview, URL, analytics와 persistent storage에 복사하지 않습니다.",
    ],
    concepts: [
      c("structural sharing", "변경되지 않은 branches는 reference를 재사용하고 changed path만 새 objects로 만드는 immutable update 방식입니다.", ["identity 비교를 가능하게 합니다.", "nested paths를 정확히 copy합니다."]),
      c("shallow copy", "object의 바로 아래 properties만 새 container로 복사하고 nested references는 공유하는 operation입니다.", ["spread/Object.assign이 대표적입니다.", "deep copy와 다릅니다."]),
      c("normalized state", "중복 nested objects 대신 IDs와 tables처럼 update/consistency가 쉬운 평평한 구조로 저장한 state입니다.", ["derived views를 계산합니다.", "single source of truth를 돕습니다."]),
    ],
    diagnostics: [
      d("한 field를 바꾸자 다른 handler가 동시에 바꾼 field가 이전 값으로 돌아갑니다.", "두 handlers가 같은 old object snapshot을 spread해 replacement했습니다.", ["captured form object", "queued setters", "changed keys", "final object"], "각 transition을 functional updater로 바꿔 pending latest object를 spread합니다.", "같은 event/rapid changes의 multi-field preservation test를 둡니다."),
      d("nested address를 수정했는데 previous snapshot과 memo child도 함께 바뀝니다.", "top-level만 copy하고 nested object를 직접 mutation했습니다.", ["reference equality by level", "mutation site", "memo selectors", "history snapshots"], "changed nested path의 모든 levels를 copy하거나 state를 normalize합니다.", "deep-freeze dev fixtures와 structural-sharing assertions를 둡니다."),
    ],
    expertNotes: ["JSON stringify/parse deep copy는 Date/Map/undefined/prototype를 잃고 전체 identity를 바꾸므로 일반 immutable update 해결책이 아닙니다.", "controlled form state의 보안은 React state 여부가 아니라 DOM/log/storage/network로 어디까지 전달되는지 data flow 전체에서 평가합니다."],
    codeExamples: [nodeExample("react12-object-functional-update", "두 field transition의 immutable composition", "React12ObjectUpdate.mjs", "functional queue로 generic profile fields를 보존하고 identity를 비교합니다.", String.raw`const initial = { display: "Learner", preferences: { density: "comfortable", contrast: "normal" } };
const updates = [
  (state) => ({ ...state, display: "Reviewer" }),
  (state) => ({ ...state, preferences: { ...state.preferences, contrast: "high" } }),
];
const next = updates.reduce((state, update) => update(state), initial);
console.log("initial-display=" + initial.display);
console.log("next-display=" + next.display);
console.log("next-contrast=" + next.preferences.contrast);
console.log("root-changed=" + (initial !== next));
console.log("nested-changed=" + (initial.preferences !== next.preferences));`, "initial-display=Learner\nnext-display=Reviewer\nnext-contrast=high\nroot-changed=true\nnested-changed=true", ["local-counter03", "local-counter04", "local-counter05", "local-counter06", "local-counter07", "local-counter08", "react-update-objects", "react-use-state"])],
  },
  {
    id: "immutable-array-state-stable-id",
    title: "array state는 spread·map·filter와 stable IDs로 추가·수정·삭제합니다",
    lead: "push/splice와 index identity를 피하고 collection transition이 item order, selection와 child state를 예측 가능하게 유지하게 합니다.",
    explanations: [
      "추가는 [...items, item] 또는 prepend, 삭제는 filter, 수정은 map으로 새 array를 반환합니다. sort/reverse는 원본을 mutation하므로 먼저 copy한 뒤 정렬하고 nested item을 바꿀 때는 해당 item object도 새로 만듭니다.",
      "CounterEx09는 lazy initializer, useRef next ID, array spread/filter와 list key를 보여 줍니다. local monotonic ID는 한 mount 안에서는 안정적이지만 persisted/multi-client data와 충돌할 수 있어 server/domain ID contract를 별도로 둡니다.",
      "rapid additions/deletions가 같은 old todos snapshot을 읽으면 lost update가 생길 수 있습니다. setItems(items => [...items, newItem])와 setItems(items => items.filter(...))처럼 functional transition을 사용합니다.",
      "key는 stable item identity이고 array position이 아닙니다. optimistic temp ID가 server ID로 바뀔 때 component state/focus reset 여부를 관리하고 ID를 secret/user data로 만들지 않습니다.",
    ],
    concepts: [
      c("immutable collection update", "기존 array/item을 mutation하지 않고 next collection과 changed items를 새로 만드는 transition입니다.", ["spread/map/filter를 사용합니다.", "sort/reverse 전 copy합니다."]),
      c("stable item ID", "render와 operations 사이 같은 logical item을 식별하는 지속적인 값입니다.", ["key/action에 사용합니다.", "index와 다릅니다."]),
      c("lazy initializer", "useState에 function을 전달해 initial state 계산을 mount initialization 시점에 수행하는 방식입니다.", ["function을 호출해 전달하지 않습니다.", "pure해야 합니다."]),
    ],
    diagnostics: [
      d("빠른 추가 두 번 중 한 item이 사라집니다.", "두 handlers가 같은 old array를 spread해 replacement했습니다.", ["captured items", "setter queue", "generated IDs", "final list"], "functional updater로 pending array에 각각 append합니다.", "same-event/rapid action additions와 unique ID test를 둡니다."),
      d("정렬 후 checkbox state가 다른 row로 이동합니다.", "array index를 key/selection identity로 사용했습니다.", ["keys before/after", "item IDs", "local child state", "sort operation"], "stable ID를 key와 selection reference로 사용합니다.", "reorder/filter/delete에서 state/focus가 ID를 따라가는 integration test를 둡니다."),
    ],
    expertNotes: ["대형 arrays에서 immutable update 비용은 normalized maps, pagination/virtualization와 reducer/store 선택으로 측정해 해결합니다.", "useRef ID increment는 render를 유발하지 않지만 server uniqueness, hydration stability와 distributed creation을 보장하지 않습니다."],
    codeExamples: [nodeExample("react12-array-transitions", "append·toggle·delete immutable queue", "React12ArrayUpdates.mjs", "stable synthetic IDs로 collection operations와 identity preservation을 계산합니다.", String.raw`const initial = [{ id: "a", done: false }, { id: "b", done: false }];
const updates = [
  (items) => [...items, { id: "c", done: false }],
  (items) => items.map((item) => item.id === "b" ? { ...item, done: true } : item),
  (items) => items.filter((item) => item.id !== "a"),
];
const next = updates.reduce((items, update) => update(items), initial);
console.log("initial=" + initial.map((item) => item.id + ":" + item.done).join(","));
console.log("next=" + next.map((item) => item.id + ":" + item.done).join(","));
console.log("array-changed=" + (initial !== next));
console.log("b-changed=" + (initial[1] !== next[0]));
console.log("count=" + next.length);`, "initial=a:false,b:false\nnext=b:true,c:false\narray-changed=true\nb-changed=true\ncount=2", ["local-counter09", "local-react-state-doc", "react-update-arrays", "react-lists", "react-use-state"])],
  },
  {
    id: "minimal-state-derived-values",
    title: "중복·모순 state를 줄이고 render 중 안전하게 계산할 수 있는 값은 derive합니다",
    lead: "fullName, filteredItems와 selection object를 별도 state로 복제하면 원본 update와 동기화되지 않는 impossible states가 생깁니다.",
    explanations: [
      "state에는 user interaction/history로 보존해야 하는 최소 source of truth만 둡니다. 두 fields에서 계산되는 label, items와 query에서 계산되는 filtered list는 render 중 derive하고 measured expensive calculation만 memoization을 검토합니다.",
      "boolean 여러 개(isLoading/isError/hasData)가 불가능 조합을 만들면 discriminated status와 payload로 state machine을 표현합니다. transition function/reducer가 허용 상태만 반환하게 합니다.",
      "selected object 전체를 저장하면 items가 갱신될 때 stale copy가 남습니다. selectedId만 state로 두고 current items에서 object를 찾으며 missing/deleted case를 명시합니다.",
      "Effect에서 derived state를 set하면 extra render와 stale intermediate UI가 생깁니다. external system synchronization이 아니라 render calculation이면 Effect를 제거하고 event에서 관련 state를 함께 갱신합니다.",
    ],
    concepts: [
      c("single source of truth", "같은 사실을 여러 state copies에 중복 저장하지 않고 한 canonical value에서 derive하는 원칙입니다.", ["모순을 줄입니다.", "owner를 명확히 합니다."]),
      c("derived value", "현재 props/state로 render 중 계산할 수 있어 별도 persistence가 필요 없는 값입니다.", ["Effect로 sync하지 않습니다.", "비용을 측정해 memo합니다."]),
      c("impossible state", "독립 booleans/fields 조합으로 business model상 허용되지 않지만 표현 가능한 상태입니다.", ["discriminated union/reducer로 줄입니다.", "transition tests를 둡니다."]),
    ],
    diagnostics: [
      d("filter query를 바꾸면 한 render 동안 이전 filtered list가 보입니다.", "Effect가 query 후 derived list state를 비동기적으로 동기화합니다.", ["source/derived states", "Effect setter", "render timeline", "calculation cost"], "render 중 items.filter(query)를 계산하고 필요하면 pure memoization을 적용합니다.", "query change 직후 rendered result가 일치하는 test를 둡니다."),
      d("isLoading과 isError가 동시에 true라 UI branch가 흔들립니다.", "독립 booleans가 impossible combinations를 허용합니다.", ["state shape", "all transitions", "branch precedence", "network lifecycle"], "status discriminant와 상태별 payload를 하나의 transition model로 만듭니다.", "모든 event/state transition table과 unreachable-state test를 둡니다."),
    ],
    expertNotes: ["useMemo는 state consistency 도구가 아니라 pure calculation cache이며 dependencies가 완전해야 합니다.", "server cache state와 local UI state를 무조건 한 object에 섞지 않고 ownership, freshness와 invalidation을 분리합니다."],
  },
  {
    id: "preserve-reset-component-state",
    title: "component type·position·key로 state 보존과 의도적 reset을 설계합니다",
    lead: "JSX branch가 비슷해 보여도 tree position과 key가 달라지면 React가 같은 component instance인지 결정하는 방식이 달라집니다.",
    explanations: [
      "state는 component function 자체가 아니라 render tree에서의 identity에 연결됩니다. 같은 type이 같은 position에 남으면 props가 바뀌어도 state가 보존되고 type 또는 key가 바뀌면 subtree state가 reset될 수 있습니다.",
      "component 정의를 parent render 안에 중첩하면 매 render 새 function type처럼 취급되어 child state가 reset될 수 있으므로 component declarations를 module scope에 둡니다.",
      "form 대상 entity가 바뀔 때 key={entityId}로 draft를 명시 reset하는 것은 유용하지만 입력 중 parent rerender마다 random key를 만들면 focus/draft가 사라집니다. reset reason과 user confirmation을 product contract로 둡니다.",
      "hide/show에서 state를 보존할지 unmount/reset할지는 privacy, memory와 task expectation에 따라 결정합니다. sensitive form을 숨기기만 해 DOM/state에 남기는 것과 unmount해 제거하는 차이를 검토합니다.",
    ],
    concepts: [
      c("component identity", "React가 이전/다음 tree에서 같은 stateful component instance인지 판단하는 type·position·key 기반 identity입니다.", ["state preservation을 결정합니다.", "DOM node ID와 다릅니다."]),
      c("intentional reset", "새 entity/session/task 시작처럼 product reason에 따라 subtree state를 명시 초기화하는 설계입니다.", ["stable key를 사용합니다.", "사용자 data loss를 알립니다."]),
      c("unmount", "component가 tree에서 제거되어 해당 local state와 Effect lifecycle이 종료되는 과정입니다.", ["hide와 다릅니다.", "cleanup/async completion을 관리합니다."]),
    ],
    diagnostics: [
      d("parent input 한 글자마다 child counter가 0으로 돌아갑니다.", "child component function을 parent 안에서 선언해 type identity가 매 render 달라집니다.", ["component declaration scope", "tree type", "keys", "mount logs"], "component를 module scope로 이동하고 props로 data를 전달합니다.", "parent rerender에서도 child state가 보존되는 test를 둡니다."),
      d("list 정렬 때 편집 draft와 focus가 사라집니다.", "unstable/random/index key가 component identity를 바꿨습니다.", ["key generation", "stable domain ID", "reorder", "focus/draft owner"], "stable item ID를 key로 사용하고 reset key는 명시 action에서만 변경합니다.", "reorder/filter 후 draft/focus preservation test를 둡니다."),
    ],
    expertNotes: ["key로 reset하기 전에 state owner를 올바른 level로 이동하거나 controlled component가 더 명확한지 검토합니다.", "hidden sensitive state의 retention과 browser autofill/history를 security/privacy 요구와 함께 시험합니다."],
    codeExamples: [nodeExample("react12-state-identity", "stable key 보존과 changed key reset", "React12Identity.mjs", "key별 state shelf를 간소화해 render sequence의 preservation을 보여 줍니다.", String.raw`const shelf = new Map();
function render(key, initial = 0) {
  if (!shelf.has(key)) shelf.set(key, initial);
  return {
    read: () => shelf.get(key),
    increment: () => shelf.set(key, shelf.get(key) + 1),
  };
}
const first = render("item-a");
first.increment();
const same = render("item-a");
const reset = render("item-b");
console.log("same-key=" + same.read());
console.log("new-key=" + reset.read());
console.log("instances=" + shelf.size);
console.log("preserved=" + (same.read() === 1));
console.log("reset=" + (reset.read() === 0));`, "same-key=1\nnew-key=0\ninstances=2\npreserved=true\nreset=true", ["local-counter09", "react-preserve-reset", "react-lists"])],
  },
  {
    id: "async-race-reducer-transactions",
    title: "async action과 복합 state는 request identity·functional transition·reducer invariant로 처리합니다",
    lead: "여러 setters와 promise completion이 얽히면 partial state와 stale overwrite가 생기므로 logical action을 하나의 transition으로 모델링합니다.",
    explanations: [
      "request 시작은 pending request ID/target을 state에 기록하고 completion은 ID가 current request와 일치할 때만 success/error로 전환합니다. Abort는 processing을 줄여도 server write를 되돌리지 않으므로 idempotency/reconciliation을 함께 둡니다.",
      "복합 action이 count, history와 status를 함께 바꾸면 여러 setters보다 reducer action 하나가 invariant와 transition table을 명확히 할 수 있습니다. reducer도 pure하고 exhaustive하며 unknown action을 조용히 무시할지 fail-fast할지 정책을 둡니다.",
      "optimistic update는 base/server version, optimistic patch와 rollback/confirm을 구분합니다. 실패 시 old snapshot 전체를 덮어 최근 user changes를 잃지 않도록 patch/operation ID 기반 compensation을 설계합니다.",
      "retry는 매 attempt의 state와 timeout/backoff를 기록하고 same logical command id를 유지합니다. UI에 pending/error/retry를 accessible하게 표현하고 rapid events가 hidden duplicate commands를 만들지 않게 합니다.",
    ],
    concepts: [
      c("request identity", "async completion이 어느 logical request/target에 속하는지 current state와 대조하는 identifier입니다.", ["stale response를 거부합니다.", "credential이 아닙니다."]),
      c("reducer invariant", "모든 action transition 전후에 반드시 유지되어야 하는 state 조건입니다.", ["pure reducer로 강제합니다.", "impossible state를 줄입니다."]),
      c("optimistic patch", "server 확정 전 UI에 적용하고 confirm/rollback 가능한 operation 단위 변경입니다.", ["operation ID를 둡니다.", "최근 변경을 덮지 않습니다."]),
    ],
    diagnostics: [
      d("느린 첫 request가 빠른 두 번째 result를 덮습니다.", "completion에 request/target identity guard가 없습니다.", ["start/completion IDs", "current target", "abort signal", "reducer transition"], "current pending ID와 일치하는 completion만 적용합니다.", "out-of-order deferred responses를 모든 success/error 조합으로 test합니다."),
      d("optimistic rollback이 사용자의 이후 편집까지 되돌립니다.", "실패 시 전체 old snapshot을 restore했습니다.", ["operation timeline", "base version", "later edits", "rollback scope"], "실패 operation의 inverse patch만 적용하거나 server truth와 pending operations를 재base합니다.", "interleaved optimistic success/failure/user edit test를 둡니다."),
    ],
    expertNotes: ["React batching은 database/network transaction을 제공하지 않으므로 server atomicity/idempotency를 별도로 설계합니다.", "reducer action payload와 devtools/telemetry에 sensitive form values를 넣지 않고 sanitized command metadata만 기록합니다."],
  },
  {
    id: "state-testing-strictmode-flush",
    title: "state tests는 rendered outcome·queue invariants·purity를 검증하고 implementation timing을 고정하지 않습니다",
    lead: "setter 호출 횟수나 render count보다 실제 user action 후 final UI와 side effects가 맞는지 검증해야 React scheduling 변화에도 견딥니다.",
    explanations: [
      "component test는 role/name으로 control을 찾고 실제 click/change/keyboard action 후 rendered value, disabled/pending/error와 callback cardinality를 assert합니다. setter mock만 확인하면 queue/JSX wiring을 놓칩니다.",
      "pure updater/reducer는 같은 frozen input으로 반복 호출해 동일 result와 external write 0을 확인합니다. Strict Mode development checks가 initializer/updater/render를 반복해도 visible result와 business side effects가 중복되지 않아야 합니다.",
      "batching test는 direct +3 final 1과 functional +3 final 3처럼 public semantics를 검증하되 exact render count나 scheduler tick을 brittle oracle로 만들지 않습니다. async tests는 controlled promises와 act-compatible user flow를 사용합니다.",
      "flushSync는 imperative API가 synchronous DOM read를 요구하는 narrow adapter에서만 integration test하고 fallback/performance를 측정합니다. 일반 tests에서 await 문제를 숨기려고 사용하지 않습니다.",
    ],
    concepts: [
      c("outcome-based state test", "setter 내부 호출보다 user interaction 후 rendered role/text/state와 side effects를 검증하는 test입니다.", ["public contract에 가깝습니다.", "scheduler 변화에 강합니다."]),
      c("purity probe", "initializer/updater/reducer를 반복 호출해 mutation과 external side effect를 탐지하는 test입니다.", ["frozen input을 사용합니다.", "Strict Mode reasoning과 연결합니다."]),
      c("controlled async fixture", "promise resolution/rejection 순서를 test가 명시적으로 제어해 race를 재현하는 도구입니다.", ["sleep을 피합니다.", "out-of-order를 만듭니다."]),
    ],
    diagnostics: [
      d("React upgrade 후 render-count test만 대량 실패하지만 UI는 같습니다.", "implementation scheduling을 product contract로 고정했습니다.", ["failed assertions", "rendered outcome", "side effects", "performance budget"], "correctness는 final UI/action invariants로, 성능은 separate profiler budget으로 분리합니다.", "public behavior assertions와 measured performance tests를 나눕니다."),
      d("async state test가 가끔 이전 value를 봅니다.", "promise/timer resolution을 기다리지 않고 arbitrary sleep에 의존합니다.", ["pending promises", "test clock", "semantic wait target", "act warnings"], "controlled deferred promise를 resolve하고 expected rendered state를 조건으로 기다립니다.", "race order별 deterministic test helpers를 둡니다."),
    ],
    expertNotes: ["Strict Mode의 development-only checks를 production behavior로 오해하지 않고 impurity detector로 활용합니다.", "performance test는 dev Strict Mode가 아니라 representative production build에서도 반복합니다."],
  },
  {
    id: "state-release-observability-governance",
    title: "state transition을 versioned contract·privacy-safe telemetry·canary·rollback으로 운영합니다",
    lead: "state refactor는 화면 한 장이 같아도 rapid input, stale response와 reload/remount에서 data loss를 만들 수 있으므로 transition evidence를 배포까지 유지합니다.",
    explanations: [
      "release gate는 direct/functional queue cases, object/array structural sharing, stable IDs, reset/preserve, controlled async races와 sanitized artifact scan을 production build에서 실행합니다. user task와 accessibility state도 함께 확인합니다.",
      "telemetry에는 raw state/form values가 아니라 transition name, component version, duration, sanitized result와 retry count를 최소 집계합니다. reducer/action devtools와 error reports에서도 credentials, PII와 full API responses를 redact합니다.",
      "canary는 lost-update/duplicate command/error/retry 같은 aggregate invariants를 이전 version과 비교하고 feature flag rollback path를 둡니다. local persisted state schema가 바뀌면 versioned migration/forward compatibility를 rehearsal합니다.",
      "incident에서는 source event→snapshot→queued operations→request/commit→rendered result timeline을 재구성합니다. hotfix 뒤 updater/reducer regression, data reconciliation과 mixed-version cache/storage rollback을 검증합니다.",
    ],
    concepts: [
      c("transition contract", "특정 event/action과 이전 state가 허용된 next state/side effects를 만드는 versioned 규칙입니다.", ["table/tests로 표현합니다.", "impossible states를 금지합니다."]),
      c("state telemetry minimization", "raw state 대신 non-sensitive transition/result counts와 latency만 수집하는 원칙입니다.", ["form values를 금지합니다.", "retention/sampling을 둡니다."]),
      c("state schema rollback", "persisted/client state version과 application artifact를 호환 가능한 이전 상태로 되돌리거나 forward-repair하는 절차입니다.", ["migration을 포함합니다.", "mixed versions를 시험합니다."]),
    ],
    diagnostics: [
      d("state debug log에 password-like value와 full profile가 남습니다.", "generic state/action serializer가 모든 payload를 기록합니다.", ["logger middleware", "action payload", "error reports", "retention"], "allowlisted transition metadata만 기록하고 sensitive fields를 state/action log에서 배제합니다.", "telemetry schema validation과 secret/PII canary scan으로 전송을 차단합니다."),
      d("rollback 후 persisted new-state schema를 old bundle이 읽지 못해 빈 화면입니다.", "frontend artifact만 되돌리고 storage schema 호환성을 준비하지 않았습니다.", ["state version", "migration direction", "cache/bundle versions", "fallback UI"], "versioned parser, tolerant defaults와 forward repair/clear-with-consent runbook을 둡니다.", "N/N-1 mixed storage/bundle rollback test를 둡니다."),
    ],
    expertNotes: ["state snapshots는 debugging에 유용하지만 production user data 전체를 수집할 정당성이 되지 않습니다.", "lost update가 server/domain data에 영향을 주면 UI hotfix뿐 아니라 authoritative data reconciliation이 필요합니다."],
    codeExamples: [nodeExample("react12-state-release-gate", "state transition qualification scorecard", "React12StateGate.mjs", "queue, purity, identity, race와 privacy evidence로 release를 결정합니다.", String.raw`const checks = [
  { id: "functional-queue", pass: true },
  { id: "updater-purity", pass: true },
  { id: "object-identity", pass: true },
  { id: "array-identity", pass: true },
  { id: "async-race", pass: true },
  { id: "privacy-scan", pass: true },
];
const failed = checks.filter((check) => !check.pass).map((check) => check.id);
console.log("checks=" + checks.length);
console.log("passed=" + (checks.length - failed.length));
console.log("failed=" + (failed.join(",") || "none"));
console.log("release=" + (failed.length === 0 ? "go" : "hold"));
console.log("evidence-complete=" + (failed.length === 0));`, "checks=6\npassed=6\nfailed=none\nrelease=go\nevidence-complete=true", ["react-queueing", "react-use-state", "react-strict-mode", "react-flush-sync", "react-no-effect"])],
  },
];

const sources: SessionSource[] = [
  { id: "local-number-count", repository: "local learning source", path: "my-app01\\src\\pages\\step03-state\\NumberCount.jsx", usedFor: ["render-local variable", "console vs UI", "state motivation"], evidence: "2026-07-14 read-only audit: 34 lines, 1,293 bytes, SHA-256 ECDA360EBDBB46FD66A1DF570FF9C8DBBE8CCF7F7A3FF4AD59D5D17C79E1388C." },
  { id: "local-counter01", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx01.jsx", usedFor: ["local counter mutation", "no rerender", "third-party Button"], evidence: "24 lines, 848 bytes, SHA-256 09C924B2413A7B575D4D11F92691254F136D2F7168D15E5BAAD05F275F8DE988. 원본 UI/console 문자열은 복사하지 않았습니다." },
  { id: "local-counter02", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx02.jsx", usedFor: ["useState counter", "direct replacement", "render logging"], evidence: "43 lines, 1,180 bytes, SHA-256 6B906A4670C781F37B02CD712A58BCA8F93B27E21B0ACE48D22439B5ACA361EB. 원본 UI/console 문자열은 복사하지 않았습니다." },
  { id: "local-counter03", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx03.jsx", usedFor: ["controlled text", "event value", "reset"], evidence: "22 lines, 728 bytes, SHA-256 90BF3C717748A4E113D1E48C02E61CFF921B3FE1517F1E70C8B69082A4B8C507. 원본 labels/typed values는 복사하지 않았습니다." },
  { id: "local-counter04", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx04.jsx", usedFor: ["multi-field controlled form", "reset/result", "sensitive-display gap"], evidence: "44 lines, 1,437 bytes, SHA-256 C4F010D78F10F5FEA3AF5206677D8D484927FADF0538E7DB410CA17DC98C11FD. credential-like fields, labels와 values는 public content에 복사하지 않았습니다." },
  { id: "local-counter05", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx05.jsx", usedFor: ["controlled checkbox", "checked event state"], evidence: "28 lines, 662 bytes, SHA-256 71A99859DFD83710A4D4C6D2ECD9935CE3C55109ACB7661D8E0A4A27625B81D7. 원본 labels는 복사하지 않았습니다." },
  { id: "local-counter06", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx06.jsx", usedFor: ["third-party controlled checkbox", "label composition", "boolean state"], evidence: "35 lines, 1,199 bytes, SHA-256 1AFF79CE6B5FC793DB483424DB1A7C11B5572D806C3FBCF4F4DEB5534EAA9B62. 원본 labels는 복사하지 않았습니다." },
  { id: "local-counter07", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx07.jsx", usedFor: ["object state", "field spread", "controlled fields"], evidence: "45 lines, 1,714 bytes, SHA-256 92B6C359106DB12B782942C4ABFE96A52E5C61C21CEF0BCAA3D55F463E169977. identifying/account-like sample literals는 복사하지 않았습니다." },
  { id: "local-counter08", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx08.jsx", usedFor: ["computed property update", "shared change handler", "object spread"], evidence: "42 lines, 1,245 bytes, SHA-256 13E30F2F6B0E82D71BFD0BD42D90978D64654D87FB439356763E2453E7CDD388. identifying/account-like sample literals는 복사하지 않았습니다." },
  { id: "local-counter09", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx09.jsx", usedFor: ["lazy initializer", "array add/delete", "useRef ID", "list key"], evidence: "59 lines, 2,011 bytes, SHA-256 BE73ECCA553D8E3AF73CE6740020F0EE95BE0C50B74B85889E40CAC105B12D06. 원본 item/input strings는 복사하지 않았습니다." },
  { id: "local-counter10", repository: "local learning source", path: "my-app01\\src\\pages\\step08-event2\\CounterEx10.jsx", usedFor: ["boolean toggle", "direct snapshot inversion", "third-party ToggleButton"], evidence: "31 lines, 903 bytes, SHA-256 B7FB3DF0D0C7825150CF8D1452C8178ACA07AB7A7D07053475A1F1CE2F688E6D. 원본 labels는 복사하지 않았습니다." },
  { id: "local-react-state-doc", repository: "local learning source", path: "REACT\\docs\\react\\03-state-list-events.md", usedFor: ["local state/list explanation", "functional updater", "array operations"], evidence: "284 lines, 11,652 bytes, SHA-256 90A2931C736201262E3C1970DE35AA45FC40EBD0406252FF04C33302DF8F2EDF. embedded strings, remote assets와 identifying values는 복사하지 않았습니다." },
  { id: "react-state-snapshot", repository: "React Documentation", path: "learn/state-as-a-snapshot", publicUrl: "https://react.dev/learn/state-as-a-snapshot", usedFor: ["render snapshot", "closure", "direct setter repetition"], evidence: "current React 19.2 state snapshot guidance를 확인했습니다." },
  { id: "react-queueing", repository: "React Documentation", path: "learn/queueing-a-series-of-state-updates", publicUrl: "https://react.dev/learn/queueing-a-series-of-state-updates", usedFor: ["batching", "replacement/updater queue", "functional updates"], evidence: "current React batching/update queue guidance를 확인했습니다." },
  { id: "react-use-state", repository: "React API", path: "reference/react/useState", publicUrl: "https://react.dev/reference/react/useState", usedFor: ["useState contract", "setter/updater", "initializer", "Object.is"], evidence: "current useState API contract를 확인했습니다." },
  { id: "react-update-objects", repository: "React Documentation", path: "learn/updating-objects-in-state", publicUrl: "https://react.dev/learn/updating-objects-in-state", usedFor: ["object immutability", "nested copy", "spread"], evidence: "current object-state update guidance를 확인했습니다." },
  { id: "react-update-arrays", repository: "React Documentation", path: "learn/updating-arrays-in-state", publicUrl: "https://react.dev/learn/updating-arrays-in-state", usedFor: ["array immutability", "map/filter/spread", "nested objects"], evidence: "current array-state update guidance를 확인했습니다." },
  { id: "react-state-structure", repository: "React Documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["minimal state", "avoid contradictions/duplication", "selection IDs"], evidence: "current state structure principles를 확인했습니다." },
  { id: "react-preserve-reset", repository: "React Documentation", path: "learn/preserving-and-resetting-state", publicUrl: "https://react.dev/learn/preserving-and-resetting-state", usedFor: ["component identity", "position/key", "intentional reset"], evidence: "current state preservation/reset guidance를 확인했습니다." },
  { id: "react-render-commit", repository: "React Documentation", path: "learn/render-and-commit", publicUrl: "https://react.dev/learn/render-and-commit", usedFor: ["render request", "render/commit phases", "DOM update"], evidence: "current render and commit explanation을 확인했습니다." },
  { id: "react-strict-mode", repository: "React API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development purity checks", "repeated render/updater"], evidence: "current StrictMode checks를 확인했습니다." },
  { id: "react-flush-sync", repository: "React DOM API", path: "reference/react-dom/flushSync", publicUrl: "https://react.dev/reference/react-dom/flushSync", usedFor: ["synchronous DOM escape hatch", "performance caveat"], evidence: "current flushSync API and caveats를 확인했습니다." },
  { id: "react-no-effect", repository: "React Documentation", path: "learn/you-might-not-need-an-effect", publicUrl: "https://react.dev/learn/you-might-not-need-an-effect", usedFor: ["derived state", "avoid synchronization Effects", "event transitions"], evidence: "current guidance on unnecessary Effects를 확인했습니다." },
  { id: "react-lists", repository: "React Documentation", path: "learn/rendering-lists", publicUrl: "https://react.dev/learn/rendering-lists", usedFor: ["stable keys", "map/filter", "component identity"], evidence: "current React list/key guidance를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "react-12-state-batching-functional-update", slug: "react-12-state-batching-functional-update", courseId: "react", moduleId: "react-events-forms-hooks", order: 2,
  title: "state batching과 함수형 업데이트",
  subtitle: "일반 변수와 direct setter에서 출발해 render snapshot·update queue·immutability·async race·state release governance까지 확장합니다",
  level: "중급", estimatedMinutes: 115,
  coreQuestion: "React state가 render snapshot과 ordered update queue로 처리될 때 lost update·mutation·stale completion 없이 count, object와 array transitions를 어떻게 설계하고 실제 final UI로 검증할까요?",
  summary: "my-app01 NumberCount, CounterEx01~10과 REACT state 문서 12개를 read-only로 감사합니다. 원본은 일반 변수의 no-rerender, useState direct replacements, controlled text/checkbox, object spread/computed keys, lazy array initializer/useRef ID/filter와 direct boolean toggle을 단계적으로 보여 줍니다. 하지만 repeated setter batching, functional updater queue, mixed replacement/updater order, nested immutability, rapid/async lost updates, request identity와 Strict Mode purity evidence는 제한적이며 account-like sample literals를 공개 자료에 복사하지 않아야 합니다. component memory/render-commit, snapshot closure, batching, pure functional queues, object/array structural sharing, minimal derived state, preserve/reset identity, async reducer transactions, outcome tests와 privacy-safe release governance를 연결합니다. 여덟 순수 Node examples는 source matrix, local/state persistence, async snapshot, replacement/updater batching, mixed queue, object/array transitions, key identity와 release gate를 exact stdout으로 실행합니다.",
  objectives: ["12개 원본의 state capability와 privacy/evidence gap을 구분한다.", "local variable, state memory와 render/commit을 설명한다.", "render snapshot과 async closure 결과를 예측한다.", "batching과 replacement update의 한계를 구분한다.", "functional updater queue를 pure transition으로 작성한다.", "object/array state를 structural sharing과 stable IDs로 갱신한다.", "derived/minimal state와 preserve/reset identity를 설계한다.", "async races, Strict Mode tests, telemetry와 rollback을 운영한다."],
  prerequisites: [{ title: "이벤트 처리·전파와 접근 가능한 상호작용", reason: "state update는 앞 세션에서 정확히 한 번 dispatch되는 event/intent handler 안에서 queue되므로 event boundary와 action cardinality를 먼저 이해해야 합니다.", sessionSlug: "react-11-event-handler-propagation" }],
  keywords: ["useState", "state snapshot", "batching", "update queue", "functional updater", "replacement update", "closure", "immutability", "structural sharing", "object state", "array state", "stable key", "derived state", "StrictMode", "flushSync", "async race"],
  topics,
  lab: {
    title: "합성 counter·preferences·task list를 batching/immutability/race까지 qualification하기",
    scenario: "원본 값을 복사하지 않은 합성 state fixtures로 direct/functional queues, controlled fields, collection operations와 async request reducer를 실제 React UI에서 검증합니다.",
    setup: ["Node 20+", "current React development/production build", "component/browser user-event tools", "Strict Mode development root", "controlled deferred promises/clock", "synthetic non-PII fields/items", "telemetry schema validator", "실제 account strings·remote assets·credentials 금지"],
    steps: ["12개 local source의 path/line/bytes/hash와 capabilities/privacy gap을 기록합니다.", "local let counter와 useState counter의 render/persistence를 비교합니다.", "setter 직후 snapshot과 delayed closure 값을 trace합니다.", "direct +3 final 1, functional +3 final 3과 mixed queue final state를 검증합니다.", "object multi-field/nested updates를 functional structural sharing으로 실행합니다.", "array append/toggle/delete/reorder와 stable key/focus identity를 검증합니다.", "derived filtered data와 discriminated status에서 duplicate/impossible state를 제거합니다.", "same/different key, parent rerender와 unmount에서 preserve/reset을 확인합니다.", "double action/out-of-order success/error/abort/optimistic rollback을 reducer와 request IDs로 fault test합니다.", "Strict Mode purity, production outcome/performance와 sanitized telemetry/canary/rollback을 실행합니다."],
    expectedResult: ["일반 변수와 React state의 render/persistence 차이가 명확합니다.", "direct/functional/mixed update queues의 final values가 공식 semantics와 일치합니다.", "object/array previous snapshots는 mutation되지 않고 changed paths만 새 identity입니다.", "stable IDs가 reorder/delete에서도 item state와 focus를 보존합니다.", "stale async completions과 duplicate commands가 current state를 오염시키지 않습니다.", "fixtures/logs/snapshots에 실제/account-like values와 secret이 없고 release/rollback evidence가 남습니다."],
    cleanup: ["synthetic state/storage, deferred requests와 screenshots를 제거합니다.", "Strict Mode debug logs, profiler marks와 test telemetry를 해제합니다.", "feature flags/cache/persisted schema fixtures를 원복합니다.", "원본 my-app01/REACT hash와 git status unchanged를 readback합니다."],
    extensions: ["React13 controlled form에서 field state, validation와 submit lifecycle을 확장합니다.", "useReducer와 state machine을 복합 async workflow에 적용합니다.", "external store/useSyncExternalStore와 server cache ownership을 비교합니다.", "optimistic UI와 server version/idempotency를 end-to-end로 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node examples를 실행하고 React rendered 결과와 queue trace를 대조하세요.", requirements: ["stdout을 완전 일치시킵니다.", "local/state persistence를 비교합니다.", "snapshot/delayed closure를 확인합니다.", "direct +3과 functional +3을 재현합니다.", "mixed queue를 단계별 계산합니다.", "object/array identities를 확인합니다.", "key preserve/reset을 확인합니다.", "release gate를 evidence에 연결합니다."], hints: ["setter를 assignment처럼 읽지 말고 ordered replacement/updater operations로 적으세요."], expectedOutcome: "한 handler의 snapshot에서 다음 render state까지 queue를 정확히 계산합니다.", solutionOutline: ["audit→memory/snapshot→batch/queue→immutability→identity/race→gate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 counter/form/list patterns를 functional updater와 sanitized reducer workflow로 리팩터링하세요.", requirements: ["원본 sample values를 복사하지 않습니다.", "previous-dependent setters를 functional form으로 바꿉니다.", "nested object/array mutation을 제거합니다.", "minimal/derived state를 구분합니다.", "stable IDs와 reset policy를 둡니다.", "async request identity/rollback을 둡니다.", "Strict Mode/outcome/privacy tests를 실행합니다."], hints: ["object spread의 시작점이 old closure인지 pending updater argument인지 확인하세요."], expectedOutcome: "rapid/async actions에서도 lost update와 sensitive artifact가 없는 state flow가 완성됩니다.", solutionOutline: ["shape→transition→queue→identity→async reducer→qualification 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React state transition governance를 작성하세요.", requirements: ["state ownership/minimality 기준을 둡니다.", "snapshot/updater/reducer purity 규칙을 둡니다.", "object/array/stable key 정책을 둡니다.", "preserve/reset와 persisted schema 정책을 둡니다.", "async identity/idempotency/optimistic rollback을 둡니다.", "outcome/Strict Mode/performance tests를 둡니다.", "telemetry privacy/canary/incident/rollback을 둡니다."], hints: ["Hook API 나열이 아니라 event→queue→render→commit→server result lifecycle을 표준화하세요."], expectedOutcome: "state correctness와 privacy가 구현·검증·관측·복구 가능한 engineering standard가 됩니다.", solutionOutline: ["own→transition→queue→render/commit→coordinate→observe→recover 순서입니다."] },
  ],
  nextSessions: ["react-13-controlled-form"], sources,
  sourceCoverage: { filesRead: 12, filesUsed: 12, uncoveredNotes: ["my-app01 NumberCount, CounterEx01~10과 REACT state 문서 12 files를 read-only로 읽고 path, line/byte counts와 SHA-256을 기록했습니다.", "원본은 no-rerender local variables, useState direct updates, controlled inputs, object/array copies, lazy initializer/useRef ID와 toggle을 보여 줍니다.", "동일 handler의 repeated setters, mixed replacement/updater queue, nested structural sharing, out-of-order async와 Strict Mode purity는 원본 실행 evidence가 제한적이어서 explicit gap으로 표시했습니다.", "CounterEx04/07/08의 account-like/identifying sample values, 모든 UI strings와 remote assets는 public prose/examples/outputs에 복사하지 않았습니다.", "실제 batching/scheduling, third-party controls, Strict Mode와 browser interaction은 installed React production/development builds에서 별도 qualification해야 합니다."] },
});

export default session;
