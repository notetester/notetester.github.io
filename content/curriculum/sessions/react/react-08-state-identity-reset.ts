import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-identity-audit", title: "조건부·목록·Profile 원본을 component tree identity로 다시 읽습니다",
    lead: "조건에 따라 element를 고르는 IfExam, index key 목록, 반복 component tree와 Profile 전환을 읽어 data 값의 변화와 component identity의 보존·교체를 분리합니다.",
    mechanism: "IfExam은 같은 render 위치에 서로 다른 JSX 결과를 둘 수 있고 CommentList는 position 기반 index key를 사용하며 ItemList는 고정 tree를 구성합니다. ProfileSample은 name/status props를 바꾸지만 child type과 위치를 유지해 local state reset 여부와 별개입니다.",
    workflow: "각 원본에서 parent path, sibling slot, element type, explicit key, props와 local state를 표로 만들고 action 뒤 동일 identity인지 새 identity인지 예상한 다음 actual React fixture로 확인합니다.",
    invariants: "원본은 read-only이고 실제 인명·메시지·과정 문자열을 synthetic fixture에 복제하지 않으며 index key와 누락 prop 같은 결함도 숨기지 않고 관찰과 교정을 구분합니다.",
    edgeCases: "빈 목록, 앞 삽입, 정렬, 조건 branch type 변화, 같은 type의 prop 변화, key 변경, Fragment, nested component definition, focus된 item 삭제와 development remount checks를 포함합니다.",
    failureModes: "props가 바뀌면 state도 자동 reset된다고 생각하거나 JSX 변수명이 다르면 identity도 다르다고 생각하면 draft가 다른 entity에 남거나 예상치 않게 사라집니다.",
    verification: "여섯 원본의 hash·lines·bytes, tree coordinate worksheet, reorder state fixture, profile switch user test와 focus/accessibility trace를 보존합니다.",
    operations: "identity policy 변경은 affected routes/components, preserved draft count, reset reason과 recovery action을 privacy-safe code로 canary 관찰하고 rollback 가능한 key strategy를 유지합니다.",
    concepts: [
      c("component identity", "React가 render 사이에 같은 mounted component instance와 state로 대응시키는 tree상의 정체성입니다.", ["변수명과 다릅니다.", "type·position·key가 핵심입니다."]),
      c("tree coordinate", "parent 아래 sibling 위치와 element type·key를 합쳐 state slot을 대응시키는 설명 모델입니다.", ["구현 내부 구조로 과장하지 않습니다.", "reconciliation을 예측하는 데 씁니다."]),
      c("structural audit", "실제 domain 값을 제거하고 element tree, props, key와 state owner만 추적하는 원본 분석입니다.", ["개인정보를 복제하지 않습니다.", "실행 관찰과 문서 주장을 분리합니다."]),
    ],
    codeExamples: [node("react08-source-risk", "원본 identity risk inventory", "React08SourceRisk.mjs", "여섯 원본의 구조에서 identity 관련 위험을 synthetic audit record로 분류합니다.", String.raw`const records = [
  { source: "conditional", risk: "branch-type" },
  { source: "list", risk: "index-key" },
  { source: "profile", risk: "prop-change-is-not-reset" },
  { source: "tree", risk: "position-must-be-traced" },
];
for (const record of records) {
  console.log(record.source + "=" + record.risk);
}`, "conditional=branch-type\nlist=index-key\nprofile=prop-change-is-not-reset\ntree=position-must-be-traced", ["local-if-basic", "local-if-operators", "local-comment-list", "local-item-list", "local-profile", "local-profile-sample", "react-preserve-reset"])]
  }),
  appliedTopic({
    id: "identity-position-type-key", title: "state를 JSX tag가 아니라 parent position·type·key에 연결해 추적합니다",
    lead: "화면 좌표나 component 함수 이름만 보지 않고 같은 parent의 sibling matching에서 type과 key가 어떻게 대응되는지 모델링해 state 보존을 예측합니다.",
    mechanism: "같은 parent 아래 같은 대응 위치에서 같은 component type과 같은 key가 유지되면 React는 기존 state를 보존합니다. type 또는 key가 달라지면 old subtree를 unmount하고 새 subtree state를 초기화합니다.",
    workflow: "old/new element tree를 parent별로 펼치고 explicit key가 있으면 key+type, 없으면 position+type으로 candidate를 맞춘 뒤 preserved, moved, mounted, unmounted를 표시합니다.",
    invariants: "key는 sibling scope에서 stable하고 unique하며 render마다 생성하지 않고 component 함수 자체를 render 안에서 새로 정의하지 않으며 fragment grouping도 identity 의도를 드러냅니다.",
    edgeCases: "unkeyed Fragment, keyed Fragment, same key different type, same type different key, portal target, conditional null, Suspense/Offscreen-like library behavior와 version별 semantics를 구분합니다.",
    failureModes: "화면상 같은 자리에 보인다는 이유만으로 type 변화 뒤 state가 남는다고 기대하거나 global unique key가 필요하다고 과도하게 설계하면 reset bug와 불필요한 coupling이 생깁니다.",
    verification: "old/new tree diff model, mount/unmount counters, state sentinel, keyed Fragment reorder와 actual target React version에서 Profiler/DevTools evidence를 비교합니다.",
    operations: "framework/compiler upgrade에서 reconciliation assumptions를 official release docs와 golden interaction fixtures로 재검증하고 internal Fiber fields에 의존하지 않습니다.",
    concepts: [
      c("position", "같은 parent의 children 대응 과정에서 element가 차지하는 sibling slot입니다.", ["화면 pixel 위치가 아닙니다.", "key가 없을 때 특히 중요합니다."]),
      c("element type", "host tag 또는 component function/class처럼 React가 subtree 종류를 구분하는 값입니다.", ["같은 JSX 모양과 다를 수 있습니다.", "함수 reference identity가 중요합니다."]),
      c("key", "같은 parent의 siblings 사이에서 render 간 item identity를 알리는 개발자 제공 값입니다.", ["component prop으로 자동 전달되지 않습니다.", "보안 식별자가 아닙니다."]),
    ],
    codeExamples: [node("react08-identity-coordinate", "type·key·position identity 좌표", "React08Identity.mjs", "old/new synthetic children을 type과 key/position으로 매칭해 preserve·reset 결과를 출력합니다.", String.raw`function identity(node, index) {
  return node.type + ":" + (node.key ?? "position-" + index);
}
const oldTree = [{ type: "Counter", key: null }, { type: "Panel", key: "help" }];
const nextTree = [{ type: "Counter", key: null }, { type: "Panel", key: "settings" }];
for (let index = 0; index < nextTree.length; index += 1) {
  const before = identity(oldTree[index], index);
  const after = identity(nextTree[index], index);
  console.log(index + ":" + before + "->" + after + ":" + (before === after ? "preserve" : "reset"));
}`, "0:Counter:position-0->Counter:position-0:preserve\n1:Panel:help->Panel:settings:reset", ["react-preserve-reset", "react-fragment", "local-item-list"])]
  }),
  appliedTopic({
    id: "preserve-same-position", title: "같은 위치·type에서 props가 바뀌어도 local state가 보존됨을 설명합니다",
    lead: "Profile이 다른 entity props를 받거나 조건 값이 바뀌어도 같은 component type과 key/position이면 local draft, selection과 focus-related state가 남을 수 있음을 제품 요구와 연결합니다.",
    mechanism: "parent가 새 props로 child element를 계산해도 identity가 같으면 React는 같은 component state slots를 다음 render에 제공합니다. props 변화는 state reset signal이 아닙니다.",
    workflow: "entity switch action에서 old/new props, identity tuple, local draft policy를 적고 보존이 맞으면 entity별 state로 설계하거나 owner로 올리며 reset이 맞으면 semantic key를 사용합니다.",
    invariants: "props에서 초기화한 draft가 이후 props를 자동 추종한다고 가정하지 않고 dirty/pristine, save/discard, entity version과 switch confirmation 정책을 명시합니다.",
    edgeCases: "same id refreshed data, different id same component, dirty form, route param change, optimistic save, back navigation, restored browser history와 server conflict를 포함합니다.",
    failureModes: "useState(props.value)는 첫 mount 이후 prop 변화에 자동 재초기화되지 않아 다른 profile에 old draft가 나타날 수 있고 무조건 Effect mirror는 user edit를 덮습니다.",
    verification: "same identity prop switch, dirty/pristine matrix, save/discard confirmation, server version conflict와 back/forward user flow를 실행합니다.",
    operations: "draft retention/reset reason과 conflict rate를 entity type별 낮은 cardinality로 관찰하고 draft 내용이나 개인 식별자는 수집하지 않습니다.",
    concepts: [
      c("state preservation", "old/new render에서 같은 component identity로 매칭된 state slots가 이어지는 동작입니다.", ["props equality가 조건은 아닙니다.", "제품 의도와 맞는지 검토합니다."]),
      c("editable draft", "server/prop value에서 시작하지만 사용자 편집 동안 별도 수명과 conflict 정책을 갖는 local state입니다.", ["dirty flag가 필요할 수 있습니다.", "authoritative server value와 구분합니다."]),
      c("identity-preserving prop change", "component identity는 유지한 채 입력 snapshot만 새 값으로 바뀌는 render 전환입니다.", ["local state는 남습니다.", "derived display는 새 props를 봅니다."]),
    ],
    codeExamples: [node("react08-preserve", "같은 identity에서 props와 local draft 분리", "React08Preserve.mjs", "profile id props가 바뀌어도 동일 identity store의 draft가 보존되는 모델을 실행합니다.", String.raw`const stateByIdentity = new Map([["Profile:position-0", { draft: "local-note" }]]);
function render(profileId) {
  const identity = "Profile:position-0";
  return { profileId, draft: stateByIdentity.get(identity).draft };
}
console.log(JSON.stringify(render("profile-a")));
console.log(JSON.stringify(render("profile-b")));`, "{\"profileId\":\"profile-a\",\"draft\":\"local-note\"}\n{\"profileId\":\"profile-b\",\"draft\":\"local-note\"}", ["local-profile", "local-profile-sample", "react-preserve-reset", "react-sharing-state"])]
  }),
  appliedTopic({
    id: "intentional-reset-type-key", title: "type 또는 semantic key로 의도적인 reset 경계를 만듭니다",
    lead: "setter로 모든 field를 수동 초기화하기 전에 component subtree 전체의 lifecycle이 entity나 workflow step과 함께 끝나야 하는지 판단하고 declarative key reset을 선택합니다.",
    mechanism: "같은 위치에서 element type이나 key가 바뀌면 React는 old component state를 폐기하고 새 identity의 initializer를 사용합니다. key는 parent가 child identity를 명시하는 선언적 reset 도구입니다.",
    workflow: "reset 대상 state와 보존할 state를 나눠 reset boundary를 최소 subtree로 감싸고 domain-stable key를 정한 뒤 focus, pending request, cleanup과 analytics를 테스트합니다.",
    invariants: "key는 random/time/index가 아니라 entity/workflow identity에서 안정적으로 나오며 security deletion이나 server revoke를 component unmount만으로 완료했다고 간주하지 않습니다.",
    edgeCases: "same entity refresh, composite key, locale/theme change, pending upload, unmount cleanup, animation exit, server mutation 중 reset과 hydration key mismatch를 확인합니다.",
    failureModes: "key={Math.random()}은 every render remount로 input focus·network/cache·performance를 망가뜨리고 너무 큰 boundary key는 navigation마다 unrelated state까지 잃게 합니다.",
    verification: "mount/unmount/initializer counters, focus and selection, pending cancellation, old/new key matrix와 unchanged sibling preservation을 검사합니다.",
    operations: "reset policy 변경은 state-loss 위험이 있으므로 draft export/confirmation, canary affected count, rollback과 support runbook을 포함합니다.",
    concepts: [
      c("intentional reset", "제품 의미상 새 task/entity/session이 시작될 때 component identity를 바꿔 local state를 초기화하는 설계입니다.", ["key를 사용할 수 있습니다.", "범위를 최소화합니다."]),
      c("reset boundary", "identity 변화로 state가 함께 폐기되는 subtree 범위입니다.", ["pending side effect cleanup을 포함합니다.", "unrelated owner는 밖에 둡니다."]),
      c("semantic key", "domain entity나 workflow instance처럼 실제 수명을 표현하는 stable key입니다.", ["random key와 다릅니다.", "sibling scope에서 unique합니다."]),
    ],
    codeExamples: [node("react08-reset", "semantic key 변경의 reset 모델", "React08Reset.mjs", "identity별 initializer를 한 번만 적용해 same key 보존과 different key reset을 exact output으로 보여 줍니다.", String.raw`const memory = new Map();
function render(key) {
  const identity = "Editor:" + key;
  if (!memory.has(identity)) memory.set(identity, { draft: "empty", mounts: 1 });
  return memory.get(identity);
}
render("entity-a").draft = "edited";
console.log("same-key=" + render("entity-a").draft);
console.log("new-key=" + render("entity-b").draft);
console.log("identities=" + [...memory.keys()].join(","));`, "same-key=edited\nnew-key=empty\nidentities=Editor:entity-a,Editor:entity-b", ["react-preserve-reset", "react-no-effect", "react-strict-mode"])]
  }),
  appliedTopic({
    id: "list-key-reorder", title: "index key의 reorder state drift를 stable data key로 교정합니다",
    lead: "index key가 warning을 없애는 임시 문법이 아니라 삽입·삭제·정렬에서 row의 local state와 DOM identity를 어느 item에 붙일지 결정하는 계약임을 재현합니다.",
    mechanism: "index key는 position과 같으므로 앞에 새 item이 들어오면 기존 position의 state가 새로운 data row에 재사용됩니다. stable item id key는 item이 이동해도 같은 identity를 찾아 state를 보존합니다.",
    workflow: "list가 변할 수 있는 모든 action을 inventory하고 server/domain stable id를 key로 사용하며 id가 없다면 data model 생성 경계에서 한 번 부여합니다.",
    invariants: "siblings의 keys는 unique·stable하고 render 중 생성되지 않으며 display label이나 array index처럼 변경·중복 가능한 값에 의존하지 않습니다.",
    edgeCases: "prepend, middle insert, delete, reverse, filtered subset, duplicate server id, optimistic temporary id→server id 전환, nested lists와 keyed Fragment를 다룹니다.",
    failureModes: "index key 목록에서 input draft, checkbox, focus와 uncontrolled DOM state가 다른 item으로 이동하고 duplicate key는 matching을 예측 불가능하게 만듭니다.",
    verification: "각 row에 synthetic local sentinel을 넣고 prepend/reverse/filter를 수행해 data id와 state id가 일치하는지, duplicate key가 CI에서 실패하는지 확인합니다.",
    operations: "backend id 결함과 duplicate rate를 ingestion에서 차단하고 optimistic id remap은 state migration 또는 stable client id 전략으로 canary합니다.",
    concepts: [
      c("index key", "array의 현재 위치를 key로 사용하는 방식입니다.", ["정적 목록 외에는 위험합니다.", "reorder에서 identity가 data와 갈라집니다."]),
      c("state drift", "component local state나 DOM state가 의도한 data entity가 아닌 다른 row에 대응되는 현상입니다.", ["눈에 보이는 값만으로 놓칠 수 있습니다.", "id sentinel로 검사합니다."]),
      c("stable data key", "item이 sibling 목록에서 이동해도 같은 entity를 식별하는 고유 값입니다.", ["data 생성 시점에 부여합니다.", "sibling scope unique가 필요합니다."]),
    ],
    codeExamples: [
      node("react08-index-key", "index key 앞 삽입의 state drift", "React08IndexKey.mjs", "원본 CommentList의 index-key 구조를 synthetic data로 재현해 prepend 뒤 row/state 불일치를 출력합니다.", String.raw`const stateByIndex = new Map([[0, "draft-a"], [1, "draft-b"]]);
const before = ["a", "b"];
const after = ["x", ...before];
console.log("before=" + before.map((id, index) => id + ":" + stateByIndex.get(index)).join(","));
console.log("after=" + after.map((id, index) => id + ":" + (stateByIndex.get(index) ?? "new")).join(","));`, "before=a:draft-a,b:draft-b\nafter=x:draft-a,a:draft-b,b:new", ["local-comment-list", "react-render-lists"]),
      node("react08-stable-key", "stable id key의 reorder 보존", "React08StableKey.mjs", "동일 prepend에서 id별 state가 원래 entity에 남는 것을 비교합니다.", String.raw`const stateById = new Map([["a", "draft-a"], ["b", "draft-b"]]);
const after = ["x", "a", "b"];
console.log(after.map((id) => id + ":" + (stateById.get(id) ?? "new")).join(","));
console.log("a-preserved=" + (stateById.get("a") === "draft-a"));
console.log("b-preserved=" + (stateById.get("b") === "draft-b"));`, "x:new,a:draft-a,b:draft-b\na-preserved=true\nb-preserved=true", ["local-comment-list", "react-render-lists", "react-fragment"]),
    ],
  }),
  appliedTopic({
    id: "conditional-tree-shape", title: "조건부 rendering이 만드는 실제 tree shape와 false-like 값을 구분합니다",
    lead: "if, ternary, &&, ||와 null 반환을 문법 취향으로만 비교하지 않고 어떤 element type이 어느 sibling position에 남고 0·empty string이 무엇을 render하는지 추적합니다.",
    mechanism: "조건식은 JSX element, text/number, null 등을 계산합니다. false/null/undefined는 child로 보이지 않지만 숫자 0은 text node가 될 수 있고 branch에서 type이 달라지면 해당 position의 state가 reset됩니다.",
    workflow: "condition의 runtime type과 가능한 values를 열거하고 각 branch의 element tree를 그린 뒤 동일 stateful component를 보존할지 서로 다른 workflow로 reset할지 먼저 결정합니다.",
    invariants: "count && <Badge>처럼 0이 유효한 값이면 명시적 boolean comparison을 쓰고 access control을 단순 conditional hiding에 맡기지 않으며 semantic container/heading order를 유지합니다.",
    edgeCases: "0, -0, NaN, empty string, null, undefined, empty array, loading/error/success union, branch가 null→component로 바뀌는 경우와 SSR hydration을 다룹니다.",
    failureModes: "0 && element는 0 text를 남길 수 있고 서로 다른 user 권한 branch를 CSS/conditional로 숨기기만 하면 network/action authorization은 여전히 열려 있습니다.",
    verification: "truthiness matrix, DOM text/role queries, same/different type branch state sentinel, server authorization negative test와 hydration warning fixture를 실행합니다.",
    operations: "unknown/loading/empty/error/success reason을 finite state로 관찰하고 raw user data를 branch labels나 logs에 넣지 않습니다.",
    concepts: [
      c("conditional tree", "condition 값에 따라 이번 render가 반환하는 element/text/null 구조입니다.", ["문법과 결과 tree를 분리합니다.", "identity에 영향을 줍니다."]),
      c("renderable zero", "JavaScript에서는 false-like지만 React child로는 text 0이 될 수 있는 numeric value입니다.", ["&& 왼쪽에 주의합니다.", "명시적 비교를 씁니다."]),
      c("finite UI state", "loading·empty·ready·error처럼 허용 가능한 화면 상태를 하나의 discriminated 값으로 표현한 모델입니다.", ["모순 booleans를 줄입니다.", "모든 branch를 테스트합니다."]),
    ],
    codeExamples: [node("react08-conditional", "&&의 0과 explicit boolean 비교", "React08Conditional.mjs", "React child 선택 규칙의 핵심 반례를 string model로 고정해 0 text 노출을 확인합니다.", String.raw`function andChild(left, child) {
  return left && child;
}
function describe(value) {
  if (value === false || value === null || value === undefined) return "nothing";
  return typeof value + ":" + String(value);
}
console.log("zero-and=" + describe(andChild(0, "badge")));
console.log("false-and=" + describe(andChild(false, "badge")));
console.log("explicit=" + describe(0 > 0 && "badge"));
console.log("positive=" + describe(2 > 0 && "badge"));`, "zero-and=number:0\nfalse-and=nothing\nexplicit=nothing\npositive=string:badge", ["local-if-basic", "local-if-operators", "react-conditional-rendering"])]
  }),
  appliedTopic({
    id: "nested-component-definition", title: "render 내부 component 정의가 매번 새 type을 만드는 문제를 제거합니다",
    lead: "작은 helper component를 parent 함수 안에 선언하면 closure가 편해 보여도 parent render마다 다른 function object가 생성되어 child identity와 state가 계속 reset될 수 있습니다.",
    mechanism: "React element type에는 component function reference가 들어갑니다. nested function 선언은 parent 호출마다 새 reference가 되므로 같은 position에서도 old/new type이 달라집니다.",
    workflow: "component definition을 module top-level로 옮기고 필요한 값은 props로 전달하며 정말 local render fragment라면 component가 아닌 plain helper/value 계산과 비교합니다.",
    invariants: "stateful component type reference는 render 사이 안정적이고 component는 render에서 정의·호출하지 않으며 Hooks는 React component 호출 규칙 안에서만 실행합니다.",
    edgeCases: "factory-generated component, HOC를 render에서 호출, dynamic import, memo/forwardRef wrapper 생성, render props와 ordinary function helper를 구분합니다.",
    failureModes: "nested component의 input, focus, animation과 Effect가 every parent render마다 unmount/mount되고 StrictMode 증상과 섞여 원인을 오진합니다.",
    verification: "type Object.is, mount/cleanup count, parent unrelated update 뒤 child state/focus와 React lint/compiler diagnostics를 확인합니다.",
    operations: "component factory migration은 displayName보다 actual type stability와 behavior parity를 canary하고 library public API wrapper identity를 version별로 검증합니다.",
    concepts: [
      c("component type reference", "JSX element의 component 종류를 나타내는 function/class object identity입니다.", ["이름 문자열과 다릅니다.", "render 사이 안정적이어야 합니다."]),
      c("nested definition", "다른 component render 함수 안에서 새 component function을 선언하는 pattern입니다.", ["매 호출 새 type이 됩니다.", "top-level로 옮깁니다."]),
      c("mount churn", "의도하지 않은 identity 변화로 subtree가 반복 unmount/mount되는 현상입니다.", ["state와 focus를 잃습니다.", "Effect setup 비용을 만듭니다."]),
    ],
    codeExamples: [node("react08-nested-type", "nested type reference와 hoisted type 비교", "React08NestedType.mjs", "일반 JavaScript function identity로 render마다 생성된 nested type의 reset 원인을 보여 줍니다.", String.raw`function makeNestedType() {
  return function Field() {};
}
function HoistedField() {}
const firstNested = makeNestedType();
const secondNested = makeNestedType();
console.log("nested-same=" + Object.is(firstNested, secondNested));
console.log("hoisted-same=" + Object.is(HoistedField, HoistedField));
console.log("nested-name=" + firstNested.name);
console.log("identity-uses-reference=true");`, "nested-same=false\nhoisted-same=true\nnested-name=Field\nidentity-uses-reference=true", ["react-preserve-reset", "react-strict-mode", "local-item-list"])]
  }),
  appliedTopic({
    id: "profile-state-product-policy", title: "Profile 전환의 보존·reset·lifting 정책을 제품 의미로 결정합니다",
    lead: "같은 component가 다른 profile props를 받는다는 기술적 사실만으로 draft 보존을 정하지 않고 사용자가 누구의 데이터를 편집하는지, unsaved work가 있는지와 security boundary를 기준으로 lifecycle을 설계합니다.",
    mechanism: "local state를 같은 identity에 두면 entity switch에도 보존되고 semantic key를 바꾸면 reset됩니다. 여러 Profile이 같은 status를 공유하면 closest common owner로 올려 controlled value/callback을 전달합니다.",
    workflow: "각 state를 per-component, per-entity, per-route, per-user-session 또는 server authority로 분류하고 preserve, key reset, keyed cache, lift state와 explicit draft store 중 하나를 선택합니다.",
    invariants: "한 domain 사실의 owner는 하나이고 entity switch에서 dirty data를 조용히 다른 entity에 적용하지 않으며 user boundary 변경 시 memory·cache·request·server authorization을 모두 독립적으로 정리합니다.",
    edgeCases: "same entity refetch, profile A→B→A, unsaved draft, tab duplication, role change, logout/login, optimistic request와 stale response를 포함합니다.",
    failureModes: "모든 전환에 key reset을 쓰면 의도한 draft를 잃고 모든 것을 lift/globalize하면 unrelated users/entities state가 섞이며 Effect로 prop을 local state에 복사하면 race가 생깁니다.",
    verification: "policy matrix별 A→B→A, dirty confirmation, controlled child synchronization, logout cache purge, request abort/version과 server authorization을 테스트합니다.",
    operations: "draft loss, cross-entity mismatch, reset confirmation과 conflict resolution을 개인정보 없는 reason code로 관찰하고 incident에는 cache invalidation과 safe export 절차를 둡니다.",
    concepts: [
      c("per-entity state", "entity id별로 독립 보존되어 전환 후 돌아왔을 때 해당 entity 값과 다시 연결되는 state입니다.", ["keyed store가 필요할 수 있습니다.", "retention과 privacy를 정합니다."]),
      c("controlled component", "중요 value와 update owner가 parent에 있고 child가 props와 event callback으로 동작하는 component입니다.", ["shared state에 적합합니다.", "local ephemeral state와 병행할 수 있습니다."]),
      c("lifecycle policy", "state를 어떤 identity에서 생성·보존·reset·폐기할지 제품 의미로 정한 규칙입니다.", ["React 기본 동작에만 맡기지 않습니다.", "보안 삭제와 구분합니다."]),
    ],
    codeExamples: [node("react08-profile-policy", "profile draft lifecycle 정책 비교", "React08ProfilePolicy.mjs", "preserve-one-slot, reset-by-key와 per-entity-cache 결과를 deterministic model로 비교합니다.", String.raw`const singleSlot = { draft: "draft-a" };
const resetByKey = new Map([["a", "draft-a"]]);
const perEntity = new Map([["a", "draft-a"], ["b", "draft-b"]]);
console.log("single-switch-b=" + singleSlot.draft);
console.log("reset-switch-b=" + (resetByKey.get("b") ?? "empty"));
console.log("cache-switch-b=" + perEntity.get("b"));
console.log("cache-return-a=" + perEntity.get("a"));`, "single-switch-b=draft-a\nreset-switch-b=empty\ncache-switch-b=draft-b\ncache-return-a=draft-a", ["local-profile", "local-profile-sample", "react-sharing-state", "react-no-effect", "react-preserve-reset"])]
  }),
  appliedTopic({
    id: "identity-accessibility-focus", title: "reset과 reorder 뒤 focus·name·keyboard context를 복구합니다",
    lead: "state가 정확히 reset돼도 focus가 document body로 사라지거나 tab selection과 panel 관계가 깨지면 사용자는 작업 위치를 잃으므로 identity change의 accessibility outcome을 설계합니다.",
    mechanism: "unmount된 focused element는 더 이상 focus target이 아니며 DOM 순서와 accessible relationships가 바뀝니다. app은 action 의미에 맞는 살아 있는 target을 선택하고 native semantics/ARIA pattern을 유지해야 합니다.",
    workflow: "action 전 focused id와 user intent를 기록하고 삭제·reset·tab switch 뒤 next logical item, trigger 또는 heading으로 focus를 이동하며 announcement는 필요한 변화만 전달합니다.",
    invariants: "focus target은 존재하고 visible·operable하며 keyboard order와 visual order가 일치하고 tabs는 tab/tablist/tabpanel 관계, selected state와 arrow-key policy를 일관되게 구현합니다.",
    edgeCases: "last item 삭제, empty list, disabled next item, modal reset, async content, screen reader browse mode, reduced motion과 mobile virtual keyboard를 포함합니다.",
    failureModes: "random key remount는 typing 중 focus를 잃고 reorder 후 DOM focus는 남아도 accessible label이 다른 entity로 바뀌며 tab panel reset이 selection과 맞지 않을 수 있습니다.",
    verification: "keyboard-only flows, document.activeElement, role/name/selected/controls relationships, screen reader smoke test와 zoom/reflow에서 focus indicator를 확인합니다.",
    operations: "focus recovery failure를 raw element text 없이 action/reason code로 관찰하고 high-impact navigation reset에는 accessibility canary와 rollback gate를 둡니다.",
    concepts: [
      c("focus recovery", "focused subtree가 제거·reset된 뒤 사용자의 다음 합리적 작업 지점으로 programmatic 또는 natural focus를 복원하는 정책입니다.", ["무조건 body나 첫 element로 보내지 않습니다.", "action 의미를 반영합니다."]),
      c("roving tabindex", "복합 widget에서 한 item만 tab stop으로 두고 arrow keys로 내부 focus를 이동하는 pattern입니다.", ["APG pattern을 따릅니다.", "모든 목록에 필요한 것은 아닙니다."]),
      c("accessible relationship", "tab과 panel처럼 id/aria-controls/aria-labelledby 및 state가 의미적으로 연결된 contract입니다.", ["DOM identity 변화에도 유효해야 합니다.", "automated+manual 검증합니다."]),
    ],
    codeExamples: [node("react08-focus-recovery", "삭제 후 다음 focus id 선택", "React08FocusRecovery.mjs", "목록 item 삭제 시 next, previous, trigger 순서의 deterministic focus recovery를 계산합니다.", String.raw`function recover(before, removedId, triggerId) {
  const index = before.indexOf(removedId);
  const remaining = before.filter((id) => id !== removedId);
  return remaining[index] ?? remaining[index - 1] ?? triggerId;
}
console.log("middle=" + recover(["a", "b", "c"], "b", "add"));
console.log("last=" + recover(["a", "b"], "b", "add"));
console.log("only=" + recover(["a"], "a", "add"));`, "middle=c\nlast=a\nonly=add", ["wai-tabs", "react-render-lists", "react-preserve-reset"])]
  }),
  appliedTopic({
    id: "identity-security-performance-recovery", title: "identity 변경의 보안·성능·복구를 운영 release gate로 만듭니다",
    lead: "key 변경을 UI 초기화 도구로만 보지 않고 unmount cleanup, pending work, cache retention, render churn, cross-user data와 rollback compatibility까지 점검합니다.",
    mechanism: "identity reset은 React local state와 Effects lifecycle에 영향을 주지만 server data 삭제, authorization revoke, browser cache 정리나 network 취소를 자동 보장하지 않습니다. 불안정 key는 mount churn과 비용을 만듭니다.",
    workflow: "identity policy별 preserved/reset data, cleanup, request ownership, cache scope, focus, mount cost와 security boundary를 표로 만들고 unit→DOM→E2E→canary→rollback을 수행합니다.",
    invariants: "user/session boundary에서 old sensitive display와 caches를 fail closed 정리하고 server authorization을 매 action 검사하며 stable key를 사용하고 cleanup은 중복 호출에도 안전합니다.",
    edgeCases: "logout 중 request, old response arriving after new user, StrictMode setup/cleanup, rollback to old key scheme, persisted keyed drafts, duplicate tabs와 offline cache를 다룹니다.",
    failureModes: "component를 unmount했으니 보안 데이터가 삭제됐다고 믿으면 external cache와 server session에 값이 남고 random keys는 every render subscription/request 재생성과 latency를 만듭니다.",
    verification: "cross-user sentinel, abort/version check, cache namespace purge, mount/cleanup counters, interaction latency budget, migration reader와 rollback rehearsal를 실행합니다.",
    operations: "cross-identity mismatch는 즉시 release stop 조건으로 두고 affected key policy/version만 기록하며 sensitive payload를 수집하지 않고 purge/re-authentication runbook을 실행합니다.",
    concepts: [
      c("identity boundary audit", "component identity 변화가 state·Effect·focus·cache·request·authorization에 미치는 영향을 함께 검토하는 절차입니다.", ["unmount와 data deletion을 구분합니다.", "제품 경계를 기준으로 합니다."]),
      c("mount churn budget", "한 interaction에서 허용되는 불필요한 mount/unmount와 setup/cleanup 비용의 상한입니다.", ["Profiler로 측정합니다.", "stable key로 예방합니다."]),
      c("cross-identity leak", "한 entity/user의 local 또는 cached 값이 다른 identity 화면·action에 연결되는 결함입니다.", ["보안 incident가 될 수 있습니다.", "sentinel tests와 purge가 필요합니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "local-if-basic", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step05-if/IfExam01.jsx", usedFor: ["if/else conditional result structure", "truthiness comments provenance"], evidence: "Read-only structural audit: 25 lines, 653 bytes, SHA-256 4AD6F9D1F1E7076EDE37345708D794AF02B265A217AAC2ED0E0C15284E2C1ED4." },
  { id: "local-if-operators", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step05-if/IfExam02.jsx", usedFor: ["conditional variants", "0 && warning and OR fallback provenance"], evidence: "Read-only structural audit: 90 lines, 2,134 bytes, SHA-256 9ABFB3A792A69405D9C0C6EFF3A2F1BEFB0481C6A2C3B99AB574547EB64BBC4D." },
  { id: "local-comment-list", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step02-component/CommentList.jsx", usedFor: ["map rendering", "index key risk provenance"], evidence: "Read-only structural audit: 52 lines, 1,463 bytes, SHA-256 19DF8830E90D3935BCE8B0797170531EF93558FC36C8F00499F0AFF4F617533D. Actual names and comments were not copied." },
  { id: "local-item-list", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step02-component/ItemList.jsx", usedFor: ["static component tree", "repeated sibling position provenance"], evidence: "Read-only structural audit: 12 lines, 421 bytes, SHA-256 DEA2F180913CC1077507DBD1D24C4D16FC3C6B5319A007EBFADB39C786727D49. Actual course text was not copied." },
  { id: "local-profile", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step09-props/Profile.jsx", usedFor: ["profile props and commented local-state variant", "same component type provenance"], evidence: "Read-only structural audit: 25 lines, 678 bytes, SHA-256 75083A9588021E455D87BF5EC4A629ECBC76DB5CFA16D9BB4685EB3E0DC297F9." },
  { id: "local-profile-sample", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step09-props/ProfileSample.jsx", usedFor: ["parent profile switching", "same-position children and missing prop provenance"], evidence: "Read-only structural audit: 43 lines, 1,981 bytes, SHA-256 38BB0E4E9DAED3F4BB222AFBA1DAE4BE608E9422C5D7779CEC904F6C2AC32843. Actual person values were not copied." },
  { id: "react-preserve-reset", repository: "React official documentation", path: "learn/preserving-and-resetting-state", publicUrl: "https://react.dev/learn/preserving-and-resetting-state", usedFor: ["state tied to tree position", "type/key reset", "nested component definition warning"], evidence: "Official React guide explains preservation at the same tree position, reset by type/key and why nested component definitions reset state." },
  { id: "react-render-lists", repository: "React official documentation", path: "learn/rendering-lists", publicUrl: "https://react.dev/learn/rendering-lists", usedFor: ["stable sibling keys", "key generation and Fragment guidance"], evidence: "Official guide requires stable keys from data and explains their role across insertion, deletion and reorder." },
  { id: "react-conditional-rendering", repository: "React official documentation", path: "learn/conditional-rendering", publicUrl: "https://react.dev/learn/conditional-rendering", usedFor: ["if/ternary/&& rendering", "0 && pitfall"], evidence: "Official guide documents conditional JSX techniques and the numeric zero pitfall with logical AND." },
  { id: "react-sharing-state", repository: "React official documentation", path: "learn/sharing-state-between-components", publicUrl: "https://react.dev/learn/sharing-state-between-components", usedFor: ["lifting state", "controlled component and single owner"], evidence: "Official guide explains moving coordinated state to a common parent and controlling children through props and handlers." },
  { id: "react-no-effect", repository: "React official documentation", path: "learn/you-might-not-need-an-effect", publicUrl: "https://react.dev/learn/you-might-not-need-an-effect", usedFor: ["avoid prop-mirroring Effects", "key-based reset and event-time adjustment"], evidence: "Official guide recommends deriving during render or using declarative identity rather than Effects for many reset/synchronization cases." },
  { id: "react-fragment", repository: "React official API", path: "reference/react/Fragment", publicUrl: "https://react.dev/reference/react/Fragment", usedFor: ["keyed Fragment", "group identity and state caveats"], evidence: "Official API reference documents explicit Fragment keys and state preservation caveats when grouping changes." },
  { id: "react-strict-mode", repository: "React official API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development remount-like diagnostics", "cleanup and purity checks"], evidence: "Official API reference distinguishes development-only checks from production behavior." },
  { id: "wai-tabs", repository: "W3C WAI-ARIA Authoring Practices", path: "patterns/tabs", publicUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/", usedFor: ["tab keyboard interaction", "tab, tablist and tabpanel relationships"], evidence: "W3C APG defines roles, states, relationships and keyboard behavior for accessible tabs." },
];

const session = createExpertSession({
  inventoryId: "react-08-state-identity-reset", slug: "react-08-state-identity-reset",
  courseId: "react", moduleId: "react-rendering-components", order: 8,
  title: "state 보존·reset과 component identity", subtitle: "position·type·key로 state lifecycle을 예측하고 list reorder, profile 전환과 focus 복구를 제품 의도에 맞게 설계합니다.",
  level: "중급", estimatedMinutes: 110,
  coreQuestion: "React는 두 render의 component를 어떻게 같은 identity로 판단하며, 어떤 state를 보존하고 어떤 경계에서 reset해야 data·focus·보안 context가 섞이지 않을까요?",
  summary: "my-app01의 조건부 IfExam 두 파일, index key CommentList, 정적 ItemList와 Profile/ProfileSample을 read-only로 감사합니다. state가 JSX 변수명이나 화면 좌표가 아니라 parent position·element type·key에 연결된다는 모델, 같은 identity의 prop 변경과 draft 보존, semantic key reset, index key reorder drift와 stable id, 0 && conditional tree, render 내부 component 정의의 새 type, profile lifecycle 정책, focus/tabs 접근성과 cross-identity 보안·mount churn·rollback까지 열 절로 확장합니다. 실제 인명·메시지·과정 값은 복제하지 않으며 아홉 Node exact models와 actual React DOM/user-flow 검증의 경계를 명시합니다.",
  objectives: ["조건부·목록·profile 원본을 type·position·key tree로 감사한다.", "같은 identity의 props 변화와 local state 보존을 구분한다.", "semantic key와 최소 reset boundary를 설계한다.", "index key reorder state drift를 재현하고 stable id로 교정한다.", "conditional tree의 0·null·type 변화 semantics를 설명한다.", "nested component definition의 type instability를 진단한다.", "profile draft를 preserve/reset/per-entity/lift 정책으로 분류한다.", "reset 뒤 focus·keyboard·ARIA 관계를 복구한다.", "cross-user data, cleanup, mount budget, canary와 rollback을 검증한다."],
  prerequisites: [{ title: "state snapshot과 불변 업데이트", reason: "현재 render의 state와 update queue를 알아야 다음 render에서 같은 component state가 보존되는지 reset되는지를 정확히 분리할 수 있습니다.", sessionSlug: "react-07-state-snapshot-immutability" }],
  keywords: ["component identity", "state preservation", "reset", "key", "position", "reconciliation", "index key", "conditional rendering", "nested component", "focus recovery", "controlled component"],
  topics,
  lab: {
    title: "Profile 전환과 reorder 가능한 목록의 identity laboratory",
    scenario: "원본 여섯 파일은 변경하지 않고 synthetic profiles/items를 쓰는 disposable React fixture에서 same-position preservation, semantic reset, reorder와 accessibility/security recovery를 검증합니다.",
    setup: ["Node.js 20 이상", "React 19 development와 production-like builds", "Testing Library compatible DOM", "Profiler·mount/cleanup counters", "keyboard/accessibility inspection", "원본 여섯 파일 read-only hashes"],
    steps: ["원본 tree의 parent path, position, type, key, props와 local state를 그립니다.", "same type/position에서 profile props만 바꿔 local draft가 보존됨을 확인합니다.", "entity semantic key를 바꿔 최소 editor subtree만 reset하고 sibling state는 보존합니다.", "index key 목록 앞 삽입·reverse·filter로 row/state mismatch를 재현합니다.", "stable synthetic id로 같은 actions 뒤 state와 focus가 item을 따라가는지 확인합니다.", "0/null/empty/error/ready conditional branches의 DOM tree와 state reset을 비교합니다.", "nested component를 render 안/밖에 정의해 type·mount·cleanup count를 비교합니다.", "preserve/reset/per-entity cache/controlled owner 정책으로 A→B→A draft flow를 테스트합니다.", "삭제·tab 전환·empty list에서 focus와 ARIA relationships를 검사합니다.", "logout 중 request, cache purge, cross-user sentinel, canary와 old-key rollback을 rehearsal합니다."],
    expectedResult: ["모든 state preservation/reset이 old/new identity tuple로 설명됩니다.", "index key drift가 재현되고 stable id에서 entity/state/focus가 일치합니다.", "profile switch에서 dirty draft 정책과 user confirmation이 명확합니다.", "nested definition과 random key mount churn이 제거됩니다.", "keyboard focus, tabs semantics와 empty/error transitions가 유지됩니다.", "component reset과 server authorization/cache purge가 별도 security gates로 검증됩니다."],
    cleanup: ["temporary builds, browser storage, keyed draft caches와 reports를 제거합니다.", "mount/focus tracing과 synthetic users를 폐기합니다.", "원본 여섯 파일의 hash와 git status가 바뀌지 않았는지 확인합니다."],
    extensions: ["router param별 preserve/reset policy와 browser history restoration을 추가합니다.", "virtualized list의 stable itemKey와 focus restoration을 검증합니다.", "optimistic temporary id→server id migration 전략을 비교합니다.", "identity policy를 static lint와 component metadata로 문서화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "아홉 Node models를 실행하고 old/new element identity와 stdout을 연결하세요.", requirements: ["stdout 완전 일치", "source risk audit", "identity tuple", "same-key preserve", "semantic reset", "index drift", "stable key", "0 &&", "nested type", "profile policy", "focus recovery"], hints: ["props가 바뀐 것과 component identity가 바뀐 것을 같은 사건으로 취급하지 마세요."], expectedOutcome: "각 action에서 state가 왜 남거나 사라지는지 tree로 설명합니다.", solutionOutline: ["audit→coordinate→preserve/reset→list/conditional→profile/focus 순서입니다."] },
    { difficulty: "응용", prompt: "ProfileSample을 dirty draft가 있는 multi-profile editor로 재설계하세요.", requirements: ["synthetic stable ids", "per-entity lifecycle decision", "semantic key boundary", "dirty confirm/save/discard", "stale request version", "controlled shared status", "focus recovery", "logout purge", "user-flow tests"], hints: ["key reset만으로 server draft 삭제나 request 취소가 끝난다고 가정하지 마세요."], expectedOutcome: "data loss와 cross-profile state leak 없이 전환 가능한 editor가 완성됩니다.", solutionOutline: ["policy matrix→identity boundary→events→a11y→security→recovery 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React component identity·key·reset 표준을 작성하세요.", requirements: ["type/position/key model", "stable key generation", "index/static-list exception", "draft preserve/reset criteria", "nested definitions prohibition", "focus/ARIA contract", "cache/request/security cleanup", "mount budget", "migration/canary/rollback"], hints: ["key naming convention이 아니라 state와 effect lifecycle governance를 만드세요."], expectedOutcome: "reorder·navigation·user 전환에서 state 수명을 감사 가능한 표준이 완성됩니다.", solutionOutline: ["model→classify→key→reset→verify→observe→migrate 순서입니다."] },
  ],
  nextSessions: ["react-09-css-assets-semantic-styling"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["IfExam01/02, CommentList, ItemList, Profile와 ProfileSample 여섯 원본을 read-only로 전부 읽고 exact hash·lines·bytes를 기록했습니다.", "원본의 실제 person, comment, course와 display strings는 공개 examples에 복사하지 않고 conditional/list/profile/tree shape만 structural provenance로 사용했습니다.", "CommentList의 index key, ProfileSample의 missing prop과 주석/behavior 차이를 숨기지 않았으며 원본에 stable key, semantic reset, focus recovery나 security cleanup이 이미 있다고 주장하지 않습니다.", "Node examples는 React reconciliation, DOM mount/unmount, Effects cleanup, focus, accessibility tree, hydration과 router/cache integration을 대체하지 않으므로 lab에서 actual React fixture를 실행해야 합니다.", "identity 결정은 React public documentation에 맞춘 설명 모델이며 internal Fiber implementation details나 future-version behavior를 고정된 contract로 과장하지 않습니다."] },
});

export default session;
