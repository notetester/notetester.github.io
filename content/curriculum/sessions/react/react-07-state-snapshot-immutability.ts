import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-state-provenance", title: "NumberCount와 Counter 원본을 state 전환 관점으로 감사합니다",
    lead: "일반 지역 변수, 단일 숫자 state, 객체 spread와 배열 add/filter 예제를 한 줄씩 읽어 render를 다시 요청하는 값과 단순히 메모리만 바꾸는 값을 구분합니다.",
    mechanism: "NumberCount의 지역 변수 mutation은 console 값만 바꾸고 이미 commit된 UI를 갱신하지 않습니다. CounterEx02는 setter로 다음 render를 요청하고, CounterEx07과 CounterEx09는 object/array의 새 root reference를 만들어 갱신합니다.",
    workflow: "각 handler에 대해 captured snapshot, queued update, next state, render request, commit된 text와 보존·교체된 reference를 표로 기록하고 원본 주석과 실제 실행 관찰을 분리합니다.",
    invariants: "원본 파일은 read-only이며 실제 사람·연락처·과정 문자열은 복제하지 않고, 공개 예제는 synthetic identifiers만 사용하며 원본에 없는 batching·deep immutability를 있었다고 주장하지 않습니다.",
    edgeCases: "빠른 연속 click, 같은 값 설정, 음수 경계, 중복 id, 없는 항목 삭제, nested object mutation, StrictMode development 재실행과 unmount 전 비동기 callback을 포함합니다.",
    failureModes: "지역 변수만 바꾸면 handler log와 화면이 갈라지고, 같은 object를 mutate해 setter에 돌려주면 Object.is 비교에서 render가 생략되거나 다른 snapshot까지 오염될 수 있습니다.",
    verification: "다섯 원본의 hash·lines·bytes를 고정하고 synthetic Node model, React development fixture, user-event 연속 동작, reference assertions와 accessibility tree를 층별로 검증합니다.",
    operations: "state transition 이름, render/commit count, rejected action reason과 recovery latency만 낮은 cardinality로 기록하고 실제 state payload나 개인정보는 telemetry에 남기지 않습니다.",
    concepts: [
      c("source provenance", "설명의 각 주장이 어느 원본 구조와 공식 contract에서 왔는지 추적하는 증거입니다.", ["원본 관찰과 보강 설계를 구분합니다.", "hash로 snapshot을 고정합니다."]),
      c("render-triggering update", "React에 다음 render에서 사용할 state update를 queue하라고 요청하는 setter 호출입니다.", ["DOM을 즉시 직접 바꾸지 않습니다.", "같은 값이면 render가 생략될 수 있습니다."]),
      c("structural provenance", "실제 domain 값을 복사하지 않고 component·handler·update shape만 학습 근거로 사용하는 방식입니다.", ["개인정보 노출을 줄입니다.", "원본 실행 결과를 위조하지 않습니다."]),
    ],
    codeExamples: [node("react07-source-audit", "지역 변수와 queued state의 관찰 차이", "React07SourceAudit.mjs", "원본 구조를 synthetic render/commit model로 축소해 지역 변수 mutation과 state request의 차이를 exact output으로 확인합니다.", String.raw`let localCount = 0;
let committedText = "count=0";
function mutateLocal() {
  localCount += 1;
}
function requestState(next) {
  committedText = "count=" + next;
}
mutateLocal();
console.log("after-local=" + committedText + ",memory=" + localCount);
requestState(localCount);
console.log("after-state=" + committedText + ",memory=" + localCount);`, "after-local=count=0,memory=1\nafter-state=count=1,memory=1", ["local-number-count", "local-counter-state", "local-state-guide", "react-use-state"])],
  }),
  appliedTopic({
    id: "state-owner-render-memory", title: "state를 component instance의 최소 기억으로 설계합니다",
    lead: "화면에 보인다는 이유로 모든 값을 state에 넣지 않고 user action 사이에 보존되어야 하며 render 결과에 영향을 주는 최소 canonical 값만 component instance에 둡니다.",
    mechanism: "useState 호출은 현재 component identity의 state slot과 setter를 연결합니다. render는 그 시점의 state snapshot을 읽고 setter는 React가 관리하는 queue에 update를 추가해 다음 render 가능성을 만듭니다.",
    workflow: "값마다 authoritative owner, readers, writers, lifetime, reset condition과 persistence를 적고 props·state·ref·derived value·server cache 중 하나를 근거와 함께 선택합니다.",
    invariants: "파생 가능한 total·filtered list·formatted label은 별도 state로 복제하지 않고 render에서 계산하며 state hooks의 호출 순서와 component top-level 규칙을 유지합니다.",
    edgeCases: "initial value 계산 비용, prop에서 시작한 editable draft, 같은 값 setter, NaN와 -0의 Object.is semantics, conditional hook, remount와 server hydration을 확인합니다.",
    failureModes: "state를 일반 변수처럼 대입하거나 hook을 조건문 안에서 호출하면 React가 slot과 값을 안정적으로 연결할 수 없고, props mirror state는 동기화 Effect와 stale 값을 만듭니다.",
    verification: "state inventory와 derived-state 제거 전후 결과, initializer call count, same-value update, remount/reset와 Rules of Hooks lint를 확인합니다.",
    operations: "state schema가 localStorage·URL·server와 연결되면 version, migration, invalidation과 rollback cleanup을 별도 계약으로 관리합니다.",
    concepts: [
      c("component state", "특정 component identity가 render 사이에 기억하는 React 관리 값입니다.", ["지역 변수와 다릅니다.", "identity가 바뀌면 reset될 수 있습니다."]),
      c("state slot", "hook 호출 순서와 component identity에 연결된 논리적 저장 위치입니다.", ["조건부 호출을 피합니다.", "선언 순서가 contract입니다."]),
      c("derived value", "현재 props와 state에서 순수하게 계산할 수 있어 별도 저장하지 않는 값입니다.", ["중복 truth를 줄입니다.", "비용은 측정 후 최적화합니다."]),
    ],
  }),
  appliedTopic({
    id: "render-snapshot-closure", title: "한 render의 snapshot과 handler closure를 시간축으로 추적합니다",
    lead: "setter 직후 변수가 즉시 바뀔 것이라는 직관을 버리고 render n에서 만들어진 JSX와 event handler가 render n의 props·state 값을 계속 본다는 규칙으로 비동기 동작을 해석합니다.",
    mechanism: "React가 component를 호출할 때 state snapshot을 제공하고 반환된 event handler closure도 그 값을 캡처합니다. setter는 다음 render를 요청하지만 실행 중인 handler의 local binding을 바꾸지 않습니다.",
    workflow: "event 시작 시 render id와 captured value를 표시하고 queue된 update, 다음 render snapshot, timer 또는 promise callback의 captured value를 순서도로 적습니다.",
    invariants: "현재 event의 의도에 snapshot이 맞는지 최신 값이 필요한지 구분하고, 최신 update 계산은 functional updater 또는 명시적 external owner를 사용하며 render 중 ref를 읽어 snapshot contract를 우회하지 않습니다.",
    edgeCases: "timer 지연 중 여러 update, stale request response, aborted action, unmounted component, closure가 old prop id를 잡은 경우와 event replay 가능성을 다룹니다.",
    failureModes: "비동기 callback이 실행될 때 captured id가 current selection이라고 가정하면 다른 entity를 덮어쓰며, setter 뒤 console log를 next state 증거로 쓰면 잘못 진단합니다.",
    verification: "render 번호를 고정한 fake scheduler, delayed callback, selection change와 cancellation fixture에서 captured/current/committed 세 값을 각각 assert합니다.",
    operations: "비동기 mutation에는 entity id, version, action id와 abort/reconciliation 결과를 기록하되 input 본문은 redaction하고 stale response 비율을 관찰합니다.",
    concepts: [
      c("render snapshot", "한 번의 component 호출이 읽는 props·state·context와 여기서 만든 handler의 일관된 값 묶음입니다.", ["render 안에서 고정됩니다.", "다음 render와 구분합니다."]),
      c("closure", "함수가 생성된 lexical environment의 bindings를 이후 호출에서도 참조하는 JavaScript 동작입니다.", ["old snapshot을 보존할 수 있습니다.", "그 자체가 React 버그는 아닙니다."]),
      c("stale action", "실행 시점의 authoritative entity/version과 맞지 않는 과거 snapshot에서 시작된 동작입니다.", ["version을 확인합니다.", "취소 또는 reconciliation합니다."]),
    ],
    codeExamples: [node("react07-snapshot", "setter 요청과 captured snapshot 분리", "React07Snapshot.mjs", "두 render의 handler가 각자 생성 시점 값을 보존한다는 최소 시간 모델을 실행합니다.", String.raw`function render(snapshot) {
  return {
    visible: snapshot,
    handle: () => "captured=" + snapshot,
  };
}
const first = render(2);
const queuedNext = first.visible + 1;
const second = render(queuedNext);
console.log("first-visible=" + first.visible);
console.log(first.handle());
console.log("second-visible=" + second.visible);
console.log(second.handle());`, "first-visible=2\ncaptured=2\nsecond-visible=3\ncaptured=3", ["react-snapshot", "local-number-count", "local-state-guide"])],
  }),
  appliedTopic({
    id: "update-queue-batching", title: "replace update와 functional updater를 queue로 계산합니다",
    lead: "연속 setter 호출의 결과를 호출 횟수로 추측하지 않고 각 queue 항목이 snapshot 기반 replacement인지 pending state를 받는 updater function인지 왼쪽부터 계산합니다.",
    mechanism: "React는 event handler가 끝날 때까지 여러 state updates를 batch할 수 있습니다. 값 전달은 해당 render에서 계산한 replacement를 queue하고 함수 전달은 앞선 queue 결과를 argument로 받아 다음 값을 계산합니다.",
    workflow: "update sequence를 replace(value) 또는 update(previous=>next)로 표기하고 base state에서 queue를 reduce해 expected next state를 먼저 계산한 뒤 React fixture와 비교합니다.",
    invariants: "이전 state에 의존하는 update는 pure functional updater를 사용하고 updater 안에서 mutation, network, random id allocation 또는 telemetry side effect를 실행하지 않습니다.",
    edgeCases: "replace 다음 updater, updater 다음 replace, 같은 event와 서로 다른 event, promise/timeout boundary, automatic batching 범위와 flushSync 같은 escape hatch를 구분합니다.",
    failureModes: "setCount(count+1)을 세 번 호출하면 같은 captured count에서 계산한 replacement가 반복되어 의도한 누적이 되지 않고 impure updater는 development 재실행에서 side effect를 중복시킵니다.",
    verification: "mixed queue truth table, rapid user-event, StrictMode, same-value bailout와 production/development 결과의 user-visible parity를 확인합니다.",
    operations: "render count 자체를 correctness로 삼지 않고 final state와 interaction latency를 SLO로 두며 batching 변경 시 old/new React version canary를 비교합니다.",
    concepts: [
      c("update queue", "현재 state slot에 대해 다음 render 전에 순서대로 처리할 pending updates의 목록입니다.", ["replacement와 updater를 구분합니다.", "순서가 결과를 바꿉니다."]),
      c("functional updater", "pending state를 받아 다음 state를 순수하게 반환하는 setter argument 함수입니다.", ["이전 값 의존 update에 사용합니다.", "side effect를 두지 않습니다."]),
      c("batching", "여러 state update를 모아 불필요한 중간 commit을 줄이는 React 처리 방식입니다.", ["최종 결과 contract와 구분합니다.", "정확한 경계는 target version에서 검증합니다."]),
    ],
    codeExamples: [node("react07-update-queue", "replacement와 updater 혼합 queue", "React07Queue.mjs", "React queue의 핵심 계산을 순수 reducer로 모델링해 captured replacement와 pending updater 결과를 비교합니다.", String.raw`function applyQueue(base, queue) {
  return queue.reduce((state, item) => item.kind === "replace" ? item.value : item.run(state), base);
}
const captured = 0;
const replacements = [
  { kind: "replace", value: captured + 1 },
  { kind: "replace", value: captured + 1 },
  { kind: "replace", value: captured + 1 },
];
const updaters = Array.from({ length: 3 }, () => ({ kind: "update", run: (value) => value + 1 }));
const mixed = [{ kind: "replace", value: 5 }, { kind: "update", run: (value) => value + 2 }];
console.log("replace=" + applyQueue(captured, replacements));
console.log("updater=" + applyQueue(captured, updaters));
console.log("mixed=" + applyQueue(captured, mixed));`, "replace=1\nupdater=3\nmixed=7", ["local-counter-state", "react-queue", "react-use-state"])]
  }),
  appliedTopic({
    id: "object-immutable-update", title: "객체 state를 변경 경로만 복사해 업데이트합니다",
    lead: "spread 한 번이면 깊은 객체까지 immutable하다고 오해하지 않고 root에서 변경 leaf까지 새 reference를 만들고 나머지 branch는 structural sharing으로 재사용합니다.",
    mechanism: "JavaScript object spread는 enumerable own properties의 shallow copy입니다. nested object를 직접 mutate하면 old/new root를 나눴더라도 공유 leaf가 함께 바뀌므로 변경 경로마다 copy가 필요합니다.",
    workflow: "변경할 field path를 표시하고 leaf update, parent copies, root replacement 순서로 새 값을 만든 뒤 old snapshot value와 changed/unchanged reference assertions를 작성합니다.",
    invariants: "과거 snapshots를 mutation하지 않고 update 후 old state가 byte/value 기준으로 그대로이며 변경하지 않은 branch reference는 재사용하고 untrusted object를 blind spread하지 않습니다.",
    edgeCases: "optional nested object, computed property name, prototype pollution keys, Date/Map/class instance, deep tree, Immer 같은 library와 form field normalization을 다룹니다.",
    failureModes: "state.profile.name을 직접 바꾸거나 shallow root copy 뒤 nested mutation을 하면 이전 render와 undo history가 오염되고 memoized consumer가 변화를 잘못 감지합니다.",
    verification: "Object.freeze 또는 mutation detector, before/after serialization, reference path matrix, forbidden keys와 nested missing fixture를 실행합니다.",
    operations: "대형 object update가 allocation·GC budget을 넘으면 normalized state와 reducer를 검토하고 실제 profiler evidence 없이 deep clone으로 대체하지 않습니다.",
    concepts: [
      c("immutability", "기존 state snapshot을 바꾸지 않고 새 값으로 다음 state를 표현하는 update 규칙입니다.", ["JavaScript object가 자동 immutable인 것은 아닙니다.", "과거 snapshot을 보호합니다."]),
      c("shallow copy", "한 단계 properties만 새 container로 복사하고 nested references는 공유하는 복사입니다.", ["spread의 범위를 압니다.", "변경 경로는 추가 copy합니다."]),
      c("structural sharing", "변경 경로는 새 reference로 만들고 의미가 같은 branch는 이전 reference를 재사용하는 방식입니다.", ["reference 비교를 돕습니다.", "무조건 deep clone하지 않습니다."]),
    ],
    codeExamples: [node("react07-object-update", "nested 변경 경로와 reference assertions", "React07ObjectUpdate.mjs", "synthetic preference state에서 한 leaf만 바꾸고 old snapshot과 두 branch identity를 검사합니다.", String.raw`const before = Object.freeze({
  id: "profile-a",
  preferences: Object.freeze({ theme: "light", density: "compact" }),
  permissions: Object.freeze({ edit: false }),
});
const after = { ...before, preferences: { ...before.preferences, theme: "dark" } };
console.log("before-theme=" + before.preferences.theme);
console.log("after-theme=" + after.preferences.theme);
console.log("root-changed=" + (before !== after));
console.log("preferences-changed=" + (before.preferences !== after.preferences));
console.log("permissions-shared=" + (before.permissions === after.permissions));`, "before-theme=light\nafter-theme=dark\nroot-changed=true\npreferences-changed=true\npermissions-shared=true", ["local-counter-object", "react-objects", "local-state-guide"])]
  }),
  appliedTopic({
    id: "array-immutable-transitions", title: "배열의 add·delete·update·reorder를 immutable transition으로 만듭니다",
    lead: "push·splice·index assignment처럼 원본 배열을 바꾸는 연산과 spread·concat·filter·map·slice처럼 새 배열을 만드는 조합을 action별로 선택합니다.",
    mechanism: "배열도 object이므로 같은 reference mutation은 과거 snapshot을 오염시킵니다. add는 새 item과 spread, delete는 filter, replace는 map, reorder는 copy 후 sort/reverse로 구현합니다.",
    workflow: "stable id를 먼저 생성하고 action payload를 validate한 뒤 new array를 계산하며 존재하지 않는 id, duplicate id와 ordering rule을 explicit result code로 처리합니다.",
    invariants: "item identity는 array position이 아니라 stable id로 추적하고 update 대상 item만 새 object가 되며 unrelated items는 공유되고 input array와 nested items를 직접 mutate하지 않습니다.",
    edgeCases: "empty list, duplicate id, no-op delete, first/last insertion, sort comparator tie, sparse array, large list와 optimistic rollback을 포함합니다.",
    failureModes: "splice 후 같은 array를 setter에 넘기면 render가 생략될 수 있고 index를 identity로 사용하면 reorder 뒤 row local state가 다른 data에 붙습니다.",
    verification: "before/after array identity, item reference matrix, order and uniqueness invariants, invalid action 결과와 large-list profiler를 확인합니다.",
    operations: "대규모 목록은 immutable correctness를 유지한 채 pagination·windowing·normalized entity map을 검토하고 rollback에는 이전 authoritative snapshot/version을 사용합니다.",
    concepts: [
      c("immutable array transition", "입력 배열을 바꾸지 않고 action 결과를 새 배열로 반환하는 순수 변환입니다.", ["filter/map/spread를 조합합니다.", "nested item도 필요 시 복사합니다."]),
      c("stable item identity", "삽입·삭제·정렬에도 같은 domain item을 가리키는 고유 id입니다.", ["position과 다릅니다.", "React key와도 연결됩니다."]),
      c("no-op transition", "대상 없음이나 같은 값처럼 state 의미가 바뀌지 않는 action 결과입니다.", ["정책상 same reference를 반환할 수 있습니다.", "reason을 테스트합니다."]),
    ],
    codeExamples: [node("react07-array-update", "배열 add·update·delete와 원본 보존", "React07ArrayUpdate.mjs", "stable synthetic id로 세 action을 실행하고 원본과 최종 order를 exact output으로 비교합니다.", String.raw`const original = Object.freeze([
  Object.freeze({ id: "a", done: false }),
  Object.freeze({ id: "b", done: false }),
]);
const added = [...original, { id: "c", done: false }];
const updated = added.map((item) => item.id === "b" ? { ...item, done: true } : item);
const removed = updated.filter((item) => item.id !== "a");
console.log("original=" + original.map((item) => item.id + ":" + item.done).join(","));
console.log("final=" + removed.map((item) => item.id + ":" + item.done).join(","));
console.log("array-changed=" + (original !== removed));
console.log("b-changed=" + (original[1] !== removed[0]));`, "original=a:false,b:false\nfinal=b:true,c:false\narray-changed=true\nb-changed=true", ["local-counter-array", "local-state-guide", "react-arrays"])]
  }),
  appliedTopic({
    id: "state-structure-invariants", title: "중복·모순·깊은 state를 정규화하고 불변식을 세웁니다",
    lead: "state update 문법보다 먼저 어떤 값을 저장해야 하는지 결정해 같은 사실의 중복, 서로 모순 가능한 booleans, props 복제와 지나치게 깊은 nested tree를 줄입니다.",
    mechanism: "최소 canonical state와 stable entity map/order IDs를 두면 selected item 같은 파생 값은 id lookup으로 계산할 수 있고 한 action이 여러 복제 값을 맞추는 위험이 줄어듭니다.",
    workflow: "state field마다 authority와 derivability를 표시하고 impossible combinations를 finite enum 또는 reducer event로 바꾸며 entity data와 presentation order를 분리합니다.",
    invariants: "같은 domain 사실은 한 번만 저장하고 selectedId는 존재하거나 null이며 ids는 unique하고 every id가 entity map에 있고 transient draft와 server truth를 구분합니다.",
    edgeCases: "selected entity 삭제, duplicate server rows, partial response, optimistic temporary id, reordering, stale cache version과 migration 중 old shape를 처리합니다.",
    failureModes: "selectedItem object와 items 배열을 동시에 저장하면 items update 후 selection이 stale하고 isLoading/isError/isSuccess booleans는 불가능한 조합을 허용합니다.",
    verification: "property-based action sequences, invariant checker, reducer exhaustive switch, persisted-state migration과 corrupted storage recovery를 실행합니다.",
    operations: "state shape 변경에는 versioned decoder, safe default, migration failure metric과 rollback-compatible old reader를 두고 raw state dump를 production log에 남기지 않습니다.",
    concepts: [
      c("canonical state", "다른 값이 계산되는 최소 authoritative state 집합입니다.", ["중복을 줄입니다.", "owner를 명시합니다."]),
      c("normalization", "entity를 id별 map과 order/reference ids로 분리해 중복 nested copies를 줄이는 구조화입니다.", ["항상 필요한 것은 아닙니다.", "대규모 관계 상태에 유용합니다."]),
      c("state invariant", "모든 허용 transition 전후에 반드시 참이어야 하는 상태 조건입니다.", ["runtime guard와 test로 강제합니다.", "복구 기준이 됩니다."]),
    ],
    codeExamples: [node("react07-state-invariant", "normalized state invariant 검사", "React07Invariant.mjs", "entity map·order·selection의 unique/existence 조건을 검사하고 손상된 state를 안정된 code로 분류합니다.", String.raw`function validate(state) {
  const unique = new Set(state.order).size === state.order.length;
  const allExist = state.order.every((id) => Object.hasOwn(state.entities, id));
  const selectionExists = state.selectedId === null || Object.hasOwn(state.entities, state.selectedId);
  if (!unique) return "duplicate-order-id";
  if (!allExist) return "missing-entity";
  if (!selectionExists) return "missing-selection";
  return "ok";
}
const valid = { entities: { a: { done: false }, b: { done: true } }, order: ["a", "b"], selectedId: "b" };
const broken = { entities: { a: { done: false } }, order: ["a", "a"], selectedId: "z" };
console.log("valid=" + validate(valid));
console.log("broken=" + validate(broken));`, "valid=ok\nbroken=duplicate-order-id", ["react-state-structure", "react-arrays", "local-counter-array"])]
  }),
  appliedTopic({
    id: "purity-strict-mode", title: "StrictMode로 initializer·updater·render의 순수성을 검사합니다",
    lead: "development의 추가 호출을 중복 버그로 숨기지 않고 render와 updater가 같은 입력에 같은 결과를 내며 외부 상태를 변경하지 않는지 발견하는 진단 신호로 사용합니다.",
    mechanism: "StrictMode는 development에서 일부 render·initializer·updater를 추가 호출해 impure code를 드러낼 수 있으며 production 동작을 두 번 실행한다는 계약은 아닙니다.",
    workflow: "render, lazy initializer와 updater에서 network·storage write·random allocation·input mutation을 제거하고 side effect는 event 또는 lifecycle contract로 이동합니다.",
    invariants: "initializer와 updater는 argument 외 외부 mutable state를 바꾸지 않고 같은 input에 equivalent output을 반환하며 duplicate invocation이 user-visible mutation을 만들지 않습니다.",
    edgeCases: "random UUID, Date.now, module counter, array push, analytics call, development-only cleanup, hydration과 third-party library integration을 확인합니다.",
    failureModes: "updater 안에서 input array를 push하면 두 번째 development call에서 중복 item이 생기고, initializer에서 request를 보내면 mount 진단 과정에서 외부 작업이 중복됩니다.",
    verification: "deep-frozen input으로 updater를 두 번 호출하고 equality·side-effect count를 검사하며 StrictMode DOM fixture와 production build의 최종 UI parity를 비교합니다.",
    operations: "StrictMode warning을 끄기 전에 root cause와 dependency owner를 기록하고 임시 격리에는 제거 기한, canary와 replacement 계획을 둡니다.",
    concepts: [
      c("pure updater", "pending state만 받아 외부 부작용 없이 다음 state를 반환하는 함수입니다.", ["재실행 가능해야 합니다.", "input을 mutate하지 않습니다."]),
      c("idempotent side-effect boundary", "같은 action id가 재시도돼도 외부 결과가 중복되지 않게 보호된 실행 경계입니다.", ["updater 밖에 둡니다.", "server idempotency도 필요할 수 있습니다."]),
      c("StrictMode diagnostic", "development에서 unsafe patterns와 missing cleanup을 찾도록 추가 검사를 수행하는 React 도구입니다.", ["production double execution 보장이 아닙니다.", "최종 결과와 호출 횟수를 구분합니다."]),
    ],
    codeExamples: [node("react07-purity", "pure updater 재실행과 input 보존", "React07Purity.mjs", "같은 frozen input에 updater를 두 번 적용해 결과 동등성과 input 보존을 확인합니다.", String.raw`const input = Object.freeze({ count: 4, tags: Object.freeze(["stable"]) });
function update(previous) {
  return { ...previous, count: previous.count + 1 };
}
const first = update(input);
const second = update(input);
console.log("same-value=" + (JSON.stringify(first) === JSON.stringify(second)));
console.log("same-reference=" + (first === second));
console.log("input-count=" + input.count);
console.log("tags-shared=" + (first.tags === input.tags));`, "same-value=true\nsame-reference=false\ninput-count=4\ntags-shared=true", ["react-strict-mode", "react-use-state", "react-objects"])]
  }),
  appliedTopic({
    id: "state-a11y-security-performance", title: "state 변화의 접근성·보안·성능 contract를 함께 설계합니다",
    lead: "숫자와 배열이 올바르게 바뀌는 것만으로 완료하지 않고 keyboard operation, accessible name, focus, status announcement, untrusted text rendering과 bounded work를 user contract에 포함합니다.",
    mechanism: "React state가 JSX를 다시 계산해도 screen reader가 모든 visual change를 자동 이해하지는 않으며, 큰 array copy와 render fan-out은 interaction latency를 만들고 raw state를 HTML sink나 log에 연결하면 보안·privacy 문제가 됩니다.",
    workflow: "native controls와 명확한 label을 기본으로 쓰고 중요한 비초점 결과는 적절한 status region을 검토하며 text interpolation, allowlist projection, list size와 render scope budget을 설정합니다.",
    invariants: "동일 action을 pointer와 keyboard로 수행할 수 있고 focus가 예측 가능하며 status message는 중복 폭주하지 않고 untrusted text는 code/HTML로 실행되지 않으며 state payload가 telemetry에 노출되지 않습니다.",
    edgeCases: "rapid updates, screen reader announcement queue, disabled vs aria-disabled, focus 대상 삭제, 10만 items, malicious markup-like string과 low-memory device를 포함합니다.",
    failureModes: "clickable div는 keyboard와 name이 빠지고 every keystroke live announcement는 사용자를 방해하며 dangerouslySetInnerHTML과 raw localStorage state 복구는 injection 경계를 만듭니다.",
    verification: "keyboard-only, accessibility tree/name/role/state, focus after delete, malicious text fixture, Profiler interaction trace와 max-list load test를 실행합니다.",
    operations: "interaction latency, failed action reason, focus recovery와 announcement volume을 privacy-safe aggregate로 관찰하고 budget 초과 시 pagination/windowing 또는 ownership 축소를 적용합니다.",
    concepts: [
      c("accessible state feedback", "시각 변화의 의미를 keyboard와 assistive technology 사용자가 인지·조작할 수 있게 하는 UI 계약입니다.", ["native semantics를 우선합니다.", "announcement 남용을 피합니다."]),
      c("safe interpolation", "untrusted value를 실행 가능한 HTML이 아니라 text/data로 다루는 rendering 방식입니다.", ["raw HTML sink를 피합니다.", "URL 등 context별 검증이 필요합니다."]),
      c("render budget", "한 interaction에 허용할 계산·render·commit 시간과 영향 component 범위입니다.", ["Profiler로 측정합니다.", "immutability를 포기하는 이유가 아닙니다."]),
    ],
  }),
  appliedTopic({
    id: "state-test-recovery-operations", title: "transition tests와 손상 state 복구를 release gate로 만듭니다",
    lead: "happy-path click 한 번을 넘어 action sequence, corrupted persisted state, concurrent server response와 rollback을 상태 전이 표와 executable invariant로 검증합니다.",
    mechanism: "pure transition model은 action→next state를 빠르게 검사하고 React integration은 실제 scheduler·DOM·focus를 검증하며 end-to-end는 server authority와 persistence reconciliation을 확인합니다.",
    workflow: "정상·경계·실패 action corpus, invariant checker, component user tests, production-like build, canary, rollback trigger와 state migration readback 순서로 evidence를 모읍니다.",
    invariants: "실패한 action은 이전 valid state를 보존하거나 명시적 recoverable state로 전환하고 unknown persisted shape를 임의 추정하지 않으며 rollback이 새 state를 읽지 못하면 compatibility adapter를 둡니다.",
    edgeCases: "refresh 중 update, old tab과 new deployment, quota exceeded storage, partial write, duplicate action, offline retry, stale server version과 rollback 후 orphan field를 다룹니다.",
    failureModes: "UI snapshot test만 있으면 reference mutation과 queue 순서를 놓치고 version 없는 persisted state는 배포 후 parse exception이나 조용한 잘못된 default를 만듭니다.",
    verification: "model test와 DOM test의 책임 표, exact stdout, mutation sentinel, action-sequence fuzz, schema version matrix와 rollback rehearsal 결과를 보존합니다.",
    operations: "migration failure와 invariant violation은 stable code로 집계하고 affected version을 canary에서 차단하며 사용자 state를 로그로 수집하지 않고 safe reset/export 지원을 제공합니다.",
    concepts: [
      c("transition table", "현재 상태와 action별 허용 next state·error·side effect를 열거한 계약입니다.", ["불가능한 조합을 찾습니다.", "테스트 fixture가 됩니다."]),
      c("reconciliation", "local snapshot과 authoritative server/version 차이를 정책에 따라 병합·재시도·폐기하는 과정입니다.", ["blind overwrite를 피합니다.", "사용자에게 conflict를 알릴 수 있습니다."]),
      c("safe reset", "손상되거나 호환되지 않는 state를 개인정보 유출 없이 백업·폐기하고 valid default로 복구하는 절차입니다.", ["silent data loss를 피합니다.", "사용자 선택과 export를 고려합니다."]),
    ],
    codeExamples: [node("react07-recovery", "versioned state decode와 safe fallback", "React07Recovery.mjs", "persisted state의 version·shape를 검사하고 unknown/corrupt input을 stable recovery code로 분류합니다.", String.raw`function decode(input) {
  if (!input || typeof input !== "object") return { ok: false, code: "object-required" };
  if (input.version !== 2) return { ok: false, code: "unsupported-version" };
  if (!Number.isInteger(input.count) || input.count < 0) return { ok: false, code: "invalid-count" };
  return { ok: true, value: { version: 2, count: input.count } };
}
console.log(JSON.stringify(decode({ version: 2, count: 3, ignored: "drop" })));
console.log(JSON.stringify(decode({ version: 1, count: 3 })));
console.log(JSON.stringify(decode({ version: 2, count: -1 })));`, "{\"ok\":true,\"value\":{\"version\":2,\"count\":3}}\n{\"ok\":false,\"code\":\"unsupported-version\"}\n{\"ok\":false,\"code\":\"invalid-count\"}", ["react-state-structure", "react-strict-mode", "local-state-guide"])]
  }),
];

const sources: SessionSource[] = [
  { id: "local-number-count", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step03-state/NumberCount.jsx", usedFor: ["plain local variable mutation", "render request absence provenance"], evidence: "Read-only structural audit: 34 lines, 1,293 bytes, SHA-256 ECDA360EBDBB46FD66A1DF570FF9C8DBBE8CCF7F7A3FF4AD59D5D17C79E1388C." },
  { id: "local-counter-state", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step08-event2/CounterEx02.jsx", usedFor: ["useState counter", "value-form setter provenance"], evidence: "Read-only structural audit: 43 lines, 1,180 bytes, SHA-256 6B906A4670C781F37B02CD712A58BCA8F93B27E21B0ACE48D22439B5ACA361EB." },
  { id: "local-counter-object", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step08-event2/CounterEx07.jsx", usedFor: ["object spread update structure", "controlled field provenance"], evidence: "Read-only structural audit: 45 lines, 1,714 bytes, SHA-256 92B6C359106DB12B782942C4ABFE96A52E5C61C21CEF0BCAA3D55F463E169977. Actual person and contact values were not copied." },
  { id: "local-counter-array", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step08-event2/CounterEx09.jsx", usedFor: ["array add/filter structure", "stable id provenance"], evidence: "Read-only structural audit: 59 lines, 2,011 bytes, SHA-256 BE73ECCA553D8E3AF73CE6740020F0EE95BE0C50B74B85889E40CAC105B12D06. Actual list values were not copied." },
  { id: "local-state-guide", repository: "local REACT learning snapshot", path: "REACT/docs/react/03-state-list-events.md", usedFor: ["plain variable versus state notes", "snapshot, functional updater and immutable array notes"], evidence: "Read-only structural audit: 284 lines, 11,652 bytes, SHA-256 90A2931C736201262E3C1970DE35AA45FC40EBD0406252FF04C33302DF8F2EDF. Actual domain strings and local URLs were not copied." },
  { id: "react-snapshot", repository: "React official documentation", path: "learn/state-as-a-snapshot", publicUrl: "https://react.dev/learn/state-as-a-snapshot", usedFor: ["render snapshot", "handler closure timing"], evidence: "Official React 19.2 documentation explains that setting state requests a render and handlers observe the state snapshot from their render." },
  { id: "react-queue", repository: "React official documentation", path: "learn/queueing-a-series-of-state-updates", publicUrl: "https://react.dev/learn/queueing-a-series-of-state-updates", usedFor: ["batching", "replacement and functional updater queue"], evidence: "Official guide distinguishes queued replacement values from updater functions and explains batching around event handling." },
  { id: "react-use-state", repository: "React official API", path: "reference/react/useState", publicUrl: "https://react.dev/reference/react/useState", usedFor: ["setter contract", "Object.is skip, initializer and updater caveats"], evidence: "Official API reference documents useState parameters, setters, functional updaters and development checks." },
  { id: "react-objects", repository: "React official documentation", path: "learn/updating-objects-in-state", publicUrl: "https://react.dev/learn/updating-objects-in-state", usedFor: ["object immutability", "shallow copy and nested update"], evidence: "Official guide requires treating objects in state as read-only and copying every changed path." },
  { id: "react-arrays", repository: "React official documentation", path: "learn/updating-arrays-in-state", publicUrl: "https://react.dev/learn/updating-arrays-in-state", usedFor: ["array add/delete/update", "copy before sort or reverse"], evidence: "Official guide contrasts mutating array operations with spread, filter, map and copied reorder operations." },
  { id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["minimal canonical state", "avoid contradiction, duplication and deep nesting"], evidence: "Official guide gives principles for grouping related state and removing redundant or duplicated state." },
  { id: "react-strict-mode", repository: "React official API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development purity checks", "extra render and Effect checks"], evidence: "Official API reference describes development-only StrictMode checks and their role in finding impure rendering and missing cleanup." },
];

const session = createExpertSession({
  inventoryId: "react-07-state-snapshot-immutability", slug: "react-07-state-snapshot-immutability",
  courseId: "react", moduleId: "react-rendering-components", order: 7,
  title: "state snapshot과 불변 업데이트", subtitle: "일반 변수와 React state를 구분하고 snapshot·queue·structural sharing·복구 불변식으로 예측 가능한 UI 상태를 만듭니다.",
  level: "중급", estimatedMinutes: 110,
  coreQuestion: "React state는 언제 어떤 값을 보며, 연속 action과 객체·배열 변경에서도 과거 snapshot을 보존하면서 다음 UI를 어떻게 정확히 계산할까요?",
  summary: "my-app01의 NumberCount, 숫자 Counter, 객체 spread, 배열 add/filter와 REACT state 문서를 read-only로 감사합니다. 지역 변수 mutation이 commit된 UI를 갱신하지 않는 이유부터 component state slot, render snapshot과 stale closure, replacement/updater queue, shallow object copy와 nested structural sharing, immutable array transitions, canonical state 구조, StrictMode purity, accessibility·security·performance와 versioned recovery까지 열 절로 확장합니다. 원본의 실제 사람·연락처·과정·URL 값은 복제하지 않으며 일곱 Node exact-output 모델과 실제 React fixture의 증명 범위를 명확히 나눕니다.",
  objectives: ["원본 state 예제의 render trigger와 reference 변화를 source evidence로 설명한다.", "state를 component identity의 최소 canonical memory로 분류한다.", "render snapshot과 async handler closure를 시간축으로 추적한다.", "replacement와 functional updater queue의 결과를 계산한다.", "객체와 배열의 변경 경로를 structural sharing으로 업데이트한다.", "중복·모순 state를 제거하고 executable invariant를 세운다.", "StrictMode에서 initializer와 updater의 순수성을 검증한다.", "접근성·보안·성능·migration과 rollback까지 state contract에 포함한다."],
  prerequisites: [{ title: "component 합성과 children", reason: "state가 어느 component identity에 속하고 render 결과가 어떤 component tree를 만드는지 이해해야 snapshot과 update owner를 정확히 추적할 수 있습니다.", sessionSlug: "react-06-component-composition-children" }],
  keywords: ["useState", "state snapshot", "closure", "batching", "functional updater", "immutability", "structural sharing", "array update", "StrictMode", "state invariant", "recovery"],
  topics,
  lab: {
    title: "NumberCount·Counter 계열을 불변 transition laboratory로 재구성하기",
    scenario: "원본 다섯 자료는 변경하지 않고 synthetic counter/profile/task data를 쓰는 disposable React fixture에서 snapshot, queue, object/array identity와 복구를 검증합니다.",
    setup: ["Node.js 20 이상", "React 19 development와 production-like fixture", "Testing Library compatible DOM", "Profiler와 mutation sentinel", "원본 다섯 파일 read-only hash", "synthetic non-PII fixture"],
    steps: ["원본 hash·lines·bytes와 handler별 captured value/setter/update shape를 기록합니다.", "지역 변수 mutation 뒤 DOM이 유지되는 경우와 state setter 뒤 next commit을 구분합니다.", "같은 render에서 replacement 세 번과 functional updater 세 번의 queue를 실행합니다.", "timer callback에서 old snapshot과 current committed value를 분리해 기록합니다.", "nested object 한 leaf를 바꾸고 changed/shared reference matrix를 검증합니다.", "array add/update/delete/reorder에서 input과 unrelated item reference를 검사합니다.", "canonical entity/order/selectedId invariant를 action sequence마다 실행합니다.", "StrictMode에서 initializer/updater 부작용이 없는지 확인합니다.", "keyboard, accessible name, focus after delete, text injection과 large-list latency를 검증합니다.", "persisted version corruption, canary, rollback과 safe reset/export를 rehearsal합니다."],
    expectedResult: ["일반 변수와 state setter의 UI 영향 차이를 render/commit evidence로 설명합니다.", "연속 updater 결과가 queue 모델과 exact하게 일치합니다.", "과거 object/array snapshot이 보존되고 변경 경로만 새 reference입니다.", "중복·missing selection·invalid persisted state가 stable error code로 차단됩니다.", "keyboard/focus/status와 untrusted text 및 latency budget이 테스트됩니다.", "새 state schema의 migration과 rollback이 데이터 손실 없이 반복 가능합니다."],
    cleanup: ["temporary builds, browser storage, test reports와 synthetic fixtures를 제거합니다.", "development tracing과 mutation instrumentation을 원복합니다.", "원본 다섯 파일의 hash와 git status가 변경되지 않았는지 확인합니다."],
    extensions: ["useReducer로 finite action union과 exhaustive transition을 구현합니다.", "Immer 적용 전후 patch·reference·bundle 비용을 비교합니다.", "server optimistic update와 version conflict rollback을 추가합니다.", "property-based action sequence와 accessibility regression을 CI gate로 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 각 stdout을 snapshot·queue·reference 불변식과 연결하세요.", requirements: ["stdout 완전 일치", "지역 변수와 state request 구분", "old/new snapshot 구분", "replacement/updater queue 계산", "object path copy", "array action", "state invariant", "versioned recovery"], hints: ["setter 호출 직후 handler의 binding이 바뀐다고 설명하지 마세요."], expectedOutcome: "React 없는 deterministic model의 범위와 실제 React 검증의 경계를 설명합니다.", solutionOutline: ["source audit→snapshot→queue→object/array→invariant→purity/recovery 순서입니다."] },
    { difficulty: "응용", prompt: "CounterEx09 구조를 stable action reducer와 accessible task list로 재설계하세요.", requirements: ["synthetic ids", "immutable add/update/delete/reorder", "duplicate/missing action code", "functional updater", "focus recovery", "status feedback", "malicious text fixture", "large-list profile", "undo rollback"], hints: ["index를 item identity나 key로 사용하지 마세요."], expectedOutcome: "불변 update, 사용자 피드백과 복구가 함께 검증되는 목록이 완성됩니다.", solutionOutline: ["contract→reducer→render semantics→user tests→profile→rollback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React state lifecycle·migration 표준을 작성하세요.", requirements: ["owner와 lifetime 분류", "snapshot/queue 규칙", "object/array immutability", "derived/normalized criteria", "StrictMode purity", "a11y/security/performance budgets", "persisted schema version", "canary/rollback/reconciliation"], hints: ["useState API 목록보다 상태가 언제 생성·보존·폐기·복구되는지를 정의하세요."], expectedOutcome: "component와 server/persistence 경계를 감사할 수 있는 운영 표준이 완성됩니다.", solutionOutline: ["classify→model→transition→verify→observe→migrate→recover 순서입니다."] },
  ],
  nextSessions: ["react-08-state-identity-reset"], sources,
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["NumberCount, CounterEx02/07/09와 REACT state 문서를 read-only로 전부 읽고 exact hash·lines·bytes를 기록했습니다.", "원본의 실제 person, contact, course, message, endpoint와 local URL 값은 공개 session이나 synthetic examples에 복사하지 않았습니다.", "원본에서 일반 변수, value-form setter, shallow object spread, array add/filter 구조만 관찰했으며 functional queue, deep path copy, normalized invariant, StrictMode·a11y·security·migration이 이미 구현됐다고 주장하지 않습니다.", "Node examples는 React scheduler, automatic batching boundary, DOM commit, focus/accessibility tree와 Profiler behavior를 대체하지 않으므로 lab의 actual React fixture에서 별도 검증합니다.", "state가 어느 component identity에서 보존·reset되는지는 다음 React08에서 key·type·position과 함께 연결합니다."] },
});

export default session;
