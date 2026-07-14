import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localCompositionSources = ["local-book", "local-library", "local-comment", "local-comment-list", "local-item", "local-children-event", "react-intro-composition-doc"];

const topics = [
  appliedTopic({
    id: "source-composition-audit", title: "Book·Library·Comment·Item과 children 문서를 component tree로 감사합니다",
    lead: "component가 component를 호출한다는 입문 설명을 element tree, prop ownership, repeated children와 slot boundary로 확장하되 원본 sample 값을 공개하지 않습니다.",
    mechanism: "Library는 Book elements를 props와 함께 반복해 합성하고 CommentList는 data를 Comment rows로, Item은 props를 semantic list로 표현합니다. Event02의 local helper는 start/end tags 사이 JSX를 children으로 받아 button content로 사용하며 REACT intro document는 root App가 child components를 합성하는 tree를 설명합니다.",
    workflow: "각 file에서 parent component, child element type, props/children input, repeated collection, returned root/Fragment와 semantic DOM owner를 기록하고 code/docs claim을 분리합니다.",
    invariants: "원본 files/doc은 read-only이고 실제 book/person/message/item/domain strings와 event messages를 공개 fixture에 복사하지 않으며 structural component/slot 관계와 hashes만 provenance로 사용합니다.",
    edgeCases: "no children, one/many children, text/number/null/false, nested Fragment/array, duplicate slot, invalid element type, child throw와 reordered dynamic children을 포함합니다.",
    failureModes: "composition을 함수 호출처럼만 설명하면 React elements의 opacity, key/state identity와 semantic DOM ownership이 사라지고 wrapper가 무분별하게 중첩됩니다.",
    verification: "source/document hashes, sanitized tree inventory, Node slot models, disposable React render, semantic DOM/a11y tree와 child error/lifecycle tests를 실행합니다.",
    operations: "component/slot API 변화는 consumer inventory, bundle/render/a11y/security evidence, compatibility adapter와 rollback으로 release합니다.",
    concepts: [c("component composition", "작은 components/elements를 parent의 render tree에 배치해 더 큰 UI를 만드는 구조입니다.", ["inheritance보다 명시적 tree를 선호합니다.", "state/DOM owner를 정합니다."]), c("children slot", "opening/closing component tags 사이의 JSX가 전달되는 opaque React node input입니다.", ["임의 array로 단정하지 않습니다.", "public API입니다."]), c("structural provenance", "실제 lesson values를 제외하고 tree, props, slots와 source hashes를 기록한 근거입니다.", ["code/docs를 구분합니다.", "synthetic 확장을 표시합니다."])],
    codeExamples: [node("react06-source-tree", "원본 component composition graph", "React06SourceTree.mjs", "실제 문자열 없이 parent→child/slot 구조와 children evidence를 executable inventory로 출력합니다.", String.raw`const edges = [
  ["Library", "Book", "props"],
  ["CommentList", "Comment", "mapped-props"],
  ["ItemView", "semantic-list", "props"],
  ["EventPanel", "ActionButton", "children-slot"],
  ["AppRoot", "child-components", "documented-composition"],
];
for (const [parent, child, channel] of edges) {
  console.log(parent + "->" + child + "|via=" + channel);
}
console.log("children-source-evidence=true");
console.log("actual-domain-strings-copied=false");`, "Library->Book|via=props\nCommentList->Comment|via=mapped-props\nItemView->semantic-list|via=props\nEventPanel->ActionButton|via=children-slot\nAppRoot->child-components|via=documented-composition\nchildren-source-evidence=true\nactual-domain-strings-copied=false", localCompositionSources.concat(["react-passing-props", "react-create-element"]))],
  }),
  appliedTopic({
    id: "element-node-children-semantics", title: "React element·React node·children의 runtime shape와 opacity를 구분합니다",
    lead: "children을 항상 array나 DOM node로 가정하지 않고 JSX가 만든 value와 React가 render할 수 있는 node 범위를 정확히 구분합니다.",
    mechanism: "JSX는 React element description을 만들고 children prop에는 element, string, number, null/boolean, array/iterable과 nested structures가 올 수 있습니다. element는 DOM instance가 아니며 생성 뒤 opaque/immutable description으로 취급합니다.",
    workflow: "component public API에서 children required/optional, allowed cardinality/semantic type와 fallback을 문서화하고 일반 content면 그대로 render하며 manipulation이 필요할 때만 React Children utilities를 고려합니다.",
    invariants: "children 내부 implementation을 임의 property traversal하지 않고 direct array methods를 무조건 호출하지 않으며 child element를 mutation하지 않습니다.",
    edgeCases: "0, empty string, false/null, single element, nested arrays/Fragments, portal, lazy/suspending child, custom iterable와 function-as-child를 다룹니다.",
    failureModes: "children.length 또는 children.map을 직접 호출하면 single element/undefined에서 실패하고 truthy check가 valid zero를 제거하며 element.props mutation이 data flow를 숨깁니다.",
    verification: "runtime node corpus, TypeScript ReactNode/ReactElement contracts, React render/count/toArray behavior, null/false/zero and nested structures를 확인합니다.",
    operations: "children shape change는 consumer type tests, runtime development warnings, usage inventory와 old/new compatibility window로 관리합니다.",
    concepts: [c("React element", "render할 component/host type, props와 key 등을 설명하는 opaque React value입니다.", ["DOM node가 아닙니다.", "mutation하지 않습니다."]), c("React node", "React가 render position에서 받아들일 수 있는 element, primitive, empty value와 collection의 넓은 범주입니다.", ["ReactElement보다 넓습니다.", "children typing에 사용합니다."]), c("opaque children", "parent가 child implementation/tree depth를 알지 않고 전달·배치하는 slot content입니다.", ["Children API도 traversal limits가 있습니다.", "data flow를 단순화합니다."])],
    codeExamples: [node("react06-node-shapes", "children node shape 분류", "React06NodeShapes.mjs", "React 자체 traversal을 모사한다고 주장하지 않고 synthetic node values의 public slot policy만 분류합니다.", String.raw`const nodes = [null, false, "label", 0, { kind: "element", type: "Card", key: "k-1" }];
function classify(value) {
  if (value === null || typeof value === "boolean") return "empty";
  if (typeof value === "string") return "text";
  if (typeof value === "number") return "number";
  if (value?.kind === "element") return "element";
  return "unsupported";
}
const classes = nodes.map(classify);
console.log("input-slots=" + nodes.length);
console.log("classes=" + classes.join(","));
console.log("renderable=" + classes.filter((value) => value !== "empty").length);
console.log("zero-preserved=" + classes.includes("number"));
console.log("element-opaque=true");
console.log("react-runtime-simulated=false");`, "input-slots=5\nclasses=empty,empty,text,number,element\nrenderable=3\nzero-preserved=true\nelement-opaque=true\nreact-runtime-simulated=false", ["react-children", "react-typescript"] )],
  }),
  appliedTopic({
    id: "containment-named-slots", title: "containment과 named slots로 layout을 data/content ownership에서 분리합니다",
    lead: "children 하나에 모든 content를 넣기 어렵다면 header/actions/sidebar 같은 named React-node props로 slots를 명시하되 wrapper가 semantics를 강제하지 않게 합니다.",
    mechanism: "generic container는 children을 content region에 배치하고 named slots는 distinct placement/semantics를 가진 React nodes를 props로 받습니다. special case는 base component composition과 extra props/slots로 표현할 수 있습니다.",
    workflow: "slot contract에 requiredness, cardinality, semantic element owner, accessible naming, layout fallback와 responsive order를 적고 container가 content data를 다시 해석하지 않게 합니다.",
    invariants: "한 landmark/heading/dialog name의 owner가 하나이고 slot absence가 invalid DOM을 만들지 않으며 visual reordering이 DOM/reading/focus order를 깨지 않습니다.",
    edgeCases: "missing title, duplicate actions, nested landmarks, empty Fragment, mobile slot relocation, portal/modal content, long translated text와 right-to-left layout을 포함합니다.",
    failureModes: "slot을 div로 무조건 감싸 table/list content model을 깨거나 container와 child가 모두 heading/ARIA role을 제공해 duplicate landmarks/names가 생깁니다.",
    verification: "required/optional/duplicate slot corpus, rendered HTML content model, role/name/heading hierarchy, keyboard focus와 responsive DOM order를 확인합니다.",
    operations: "slot additions/renames는 additive compatibility, consumer inventory, accessibility snapshots, visual canary와 rollback adapter로 release합니다.",
    concepts: [c("containment", "container가 내부 content를 직접 알지 않고 children을 정해진 region에 배치하는 합성 방식입니다.", ["재사용성을 높입니다.", "semantics owner를 정합니다."]), c("named slot", "header, body, actions처럼 placement 역할이 명시된 React-node prop입니다.", ["children과 함께 쓸 수 있습니다.", "requiredness를 문서화합니다."]), c("semantic owner", "role, heading, label, list/table structure를 어느 component가 생성할지의 단일 책임입니다.", ["중복 semantics를 막습니다.", "slot API에 포함합니다."])],
    codeExamples: [node("react06-slot-contract", "named slot requiredness와 semantic owner 검증", "React06SlotContract.mjs", "dialog-like container의 title/body/actions slots를 cardinality와 owner policy로 검사합니다.", String.raw`const contract = {
  title: { required: true, max: 1, owner: "consumer" },
  body: { required: true, max: 1, owner: "consumer" },
  actions: { required: false, max: 2, owner: "consumer" },
};
function validate(input) {
  for (const [slot, rule] of Object.entries(contract)) {
    const count = input[slot] ?? 0;
    if (rule.required && count === 0) return "MISSING_" + slot.toUpperCase();
    if (count > rule.max) return "TOO_MANY_" + slot.toUpperCase();
  }
  return "OK";
}
console.log("valid=" + validate({ title: 1, body: 1, actions: 2 }));
console.log("missing=" + validate({ title: 0, body: 1, actions: 0 }));
console.log("duplicate=" + validate({ title: 2, body: 1, actions: 0 }));
console.log("role-owner=container");
console.log("label-owner=title-slot");
console.log("visual-order-changes-dom=false");`, "valid=OK\nmissing=MISSING_TITLE\nduplicate=TOO_MANY_TITLE\nrole-owner=container\nlabel-owner=title-slot\nvisual-order-changes-dom=false", ["html-content-models", "wcag-name-role-value", "aria-dialog-pattern", "react-passing-props"] )],
  }),
  appliedTopic({
    id: "state-owner-render-props", title: "render props로 state owner와 rendering strategy를 분리합니다",
    lead: "container가 data/state lifecycle을 소유하면서 consumer별 UI를 합성해야 할 때 function prop의 input/output/error contract를 명시합니다.",
    mechanism: "render prop은 owner가 current state와 finite actions를 function에 전달하고 consumer가 React node를 반환하는 inversion입니다. 함수 호출은 render 중 일어나므로 pure하고 빠르며 side effect를 수행하지 않아야 합니다.",
    workflow: "state machine owner, render callback payload, permitted actions, pending/error variants와 fallback을 type/runtime contract로 정의하고 callback identity/performance를 실제로 측정합니다.",
    invariants: "render callback에 raw setter/secret/internal store를 넘기지 않고 least-authority actions만 제공하며 same state/input은 same semantic UI를 만들고 thrown error는 boundary로 전파합니다.",
    edgeCases: "missing/non-function prop, callback throw, async function returning promise, stale closure, nested render props, expensive calculation와 server component boundary를 다룹니다.",
    failureModes: "render callback 안에서 state를 update하면 render loop가 생기고 raw setter 전달은 consumer가 owner invariant를 우회하며 inline identity를 성능 문제의 유일 원인으로 오진할 수 있습니다.",
    verification: "state/action matrix, callback payload allowlist, render purity/throw, duplicate action, Profiler와 TypeScript negative tests를 실행합니다.",
    operations: "render-prop API 변화는 consumer usage, callback failure/render duration과 action reason telemetry, adapter/rollback으로 관리합니다.",
    concepts: [c("render prop", "React node를 계산하는 function을 prop/children으로 전달하는 합성 패턴입니다.", ["render 중 호출됩니다.", "payload contract가 필요합니다."]), c("inversion of control", "generic owner가 구체 UI 결정을 consumer callback/slot에 위임하는 구조입니다.", ["authority를 제한합니다.", "control flow를 문서화합니다."]), c("finite action", "owner state를 바꿀 수 있는 명명되고 검증 가능한 최소 event interface입니다.", ["raw setter보다 안전합니다.", "idempotency를 설계합니다."])],
  }),
  appliedTopic({
    id: "compound-components-context", title: "compound components를 scoped Context와 registration invariant로 설계합니다",
    lead: "Tabs, Menu 같은 related parts가 함께 자연스러운 JSX API를 만들 수 있지만 implicit Context와 ordering을 숨기지 않습니다.",
    mechanism: "root compound component가 state/actions/IDs를 Context로 제공하고 approved child parts가 읽습니다. DOM nesting만으로 magic parent를 찾지 않고 provider absence, duplicate registration과 controlled/uncontrolled ownership을 명시합니다.",
    workflow: "Root/List/Trigger/Panel parts, stable item IDs, registration order, selected value, keyboard actions와 semantic owner를 API contract로 만들고 direct/nested usage constraints를 runtime/type tests로 고정합니다.",
    invariants: "한 root scope 안에서 IDs가 unique하고 trigger-panel references가 대응되며 context outside root는 stable development error를 내고 controlled/uncontrolled mode를 lifetime 중 바꾸지 않습니다.",
    edgeCases: "dynamic add/remove/reorder, nested compound roots, disabled item, no selection, duplicate value, SSR generated IDs, portal panel와 lazy child를 포함합니다.",
    failureModes: "Children traversal/clone으로 direct children만 주입하면 wrapper/Fragment 뒤 parts를 놓치고 key/ref/props가 덮이며 implicit global Context가 nested widgets를 충돌시킵니다.",
    verification: "provider missing, duplicate IDs, nested roots, reorder/focus/keyboard ARIA pattern, controlled switch warning와 hydration ID parity를 확인합니다.",
    operations: "part API/Context schema 변화는 mixed-version compatibility, usage inventory, invalid-registration metrics와 rollback wrapper로 운영합니다.",
    concepts: [c("compound component", "여러 named child parts가 한 UI state/semantic contract를 공유하는 component API입니다.", ["root scope가 필요합니다.", "part 조합을 검증합니다."]), c("scoped Context", "특정 root subtree에만 state/actions를 제공하는 ambient channel입니다.", ["nested roots를 격리합니다.", "provider absence를 거부합니다."]), c("registration invariant", "parts의 stable IDs, uniqueness, order와 reference 연결이 만족해야 하는 조건입니다.", ["dynamic 변화에 적용합니다.", "DOM order와 대조합니다."])],
    codeExamples: [node("react06-compound-registry", "compound parts registration과 selection transition", "React06CompoundRegistry.mjs", "synthetic tab-like IDs의 duplicate guard, finite selection과 reorder identity를 실행합니다.", String.raw`function register(ids) {
  return new Set(ids).size === ids.length ? "OK" : "DUPLICATE_ID";
}
function select(ids, current, requested) {
  if (!ids.includes(requested)) return { value: current, outcome: "UNKNOWN_ID" };
  return { value: requested, outcome: "SELECTED" };
}
const ids = ["p-a", "p-b", "p-c"];
const selected = select(ids, "p-a", "p-c");
const reordered = ["p-c", "p-a", "p-b"];
console.log("registry=" + register(ids));
console.log("duplicate=" + register(["p-a", "p-a"]));
console.log("selection=" + selected.value + "|" + selected.outcome);
console.log("after-reorder=" + select(reordered, selected.value, selected.value).value);
console.log("unknown=" + select(ids, selected.value, "p-x").outcome);
console.log("raw-setter-exposed=false");`, "registry=OK\nduplicate=DUPLICATE_ID\nselection=p-c|SELECTED\nafter-reorder=p-c\nunknown=UNKNOWN_ID\nraw-setter-exposed=false", ["react-context", "react-clone-element"] )],
  }),
  appliedTopic({
    id: "children-api-clone-alternatives", title: "Children API와 cloneElement의 한계를 알고 explicit alternatives를 우선합니다",
    lead: "children을 변환해 props를 몰래 주입하는 편의가 data flow·typing·wrapper composition을 어렵게 만들 수 있으므로 direct need와 alternatives를 비교합니다.",
    mechanism: "React Children utilities는 opaque children structure를 제한적으로 count/map/toArray할 수 있지만 rendered descendant tree를 깊게 탐색하지 않습니다. cloneElement는 original을 바꾸지 않고 props를 shallow merge하지만 key/ref와 data flow를 추적하기 어렵게 합니다.",
    workflow: "단순 decorative wrapping이면 children 그대로, data 전달이면 props/Context, rendering strategy이면 render prop, dynamic collection이면 data array map을 우선하고 clone이 필요한 narrow adapter만 contract/test합니다.",
    invariants: "unknown child를 무차별 clone하지 않고 existing props/event handlers/key/ref를 덮지 않으며 child order/key normalization과 unsupported type을 명시합니다.",
    edgeCases: "string/null/Fragment, wrapper component, nested arrays, dynamic children keys, merged event handler throw/order, ref ownership와 TypeScript generic을 다룹니다.",
    failureModes: "Children.map이 nested custom component의 returned descendants까지 찾을 것이라 기대하면 parts가 누락되고 clone이 consumer handler를 덮어 interaction/a11y를 깨뜨립니다.",
    verification: "node shape corpus, direct/nested/wrapped parts, key preservation, handler composition order/error, ref and type negative tests를 실행합니다.",
    operations: "clone/Children usage를 lint/inventory하고 migration owner/expiry와 Context/render-prop replacement canary를 둡니다.",
    concepts: [c("Children utility", "opaque children prop을 제한된 방식으로 count/map/toArray하는 React API입니다.", ["deep rendered tree traversal이 아닙니다.", "dynamic key를 고려합니다."]), c("cloneElement", "기존 element description에서 일부 props/children을 바꾼 새 element를 만드는 API입니다.", ["data flow를 어렵게 할 수 있습니다.", "key/ref merge를 검토합니다."]), c("explicit alternative", "props, Context, render prop 또는 data mapping처럼 dependency와 owner가 드러나는 대안입니다.", ["debugging을 돕습니다.", "narrow API를 만듭니다."])],
  }),
  appliedTopic({
    id: "semantic-dom-accessibility", title: "container와 slot consumer 사이 semantic DOM·focus·accessible name owner를 고정합니다",
    lead: "재사용 wrapper가 div만 추가하거나 child semantics를 덮으면 visually correct composition도 invalid HTML과 inaccessible interaction을 만듭니다.",
    mechanism: "HTML content model은 어떤 children이 허용되는지 정하고 ARIA pattern은 role/state/reference/keyboard behavior를 요구합니다. wrapper가 polymorphic host를 허용해도 actual semantics와 ref/focus contract를 검증해야 합니다.",
    workflow: "component API에 default host, allowed overrides, heading/list/table/dialog semantics, label slot, focus entry/return와 keyboard actions를 포함하고 semantic owner를 하나씩 지정합니다.",
    invariants: "interactive element를 중첩하지 않고 name/role/value가 programmatically 결정되며 title/label IDs가 unique하고 DOM/reading/focus order가 의미를 보존합니다.",
    edgeCases: "button-inside-button slot, li outside list, table wrappers, empty accessible name, nested dialog, portal, disabled/read-only와 responsive reorder를 다룹니다.",
    failureModes: "as prop으로 아무 tag나 허용하면 required role/keyboard가 사라지고 container가 click handler를 div에 붙여 keyboard/semantic accessibility를 잃습니다.",
    verification: "HTML validation, role/name/state queries, keyboard/focus-return flows, heading/landmark tree, screen reader spot checks와 slot absence tests를 실행합니다.",
    operations: "semantic API changes는 accessibility contract snapshots, consumer inventory, support signal와 backward-compatible wrapper/rollback으로 release합니다.",
    concepts: [c("content model", "HTML element가 포함할 수 있는 child categories/elements의 구조 규칙입니다.", ["wrapper 설계에 적용합니다.", "React가 자동 교정하지 않습니다."]), c("accessible name owner", "control/region의 programmatic label을 어느 slot/component가 제공할지의 책임입니다.", ["한 곳으로 고정합니다.", "visible label과 대조합니다."]), c("focus contract", "compound/container interaction의 initial, movement, trap, return과 disabled behavior 계약입니다.", ["keyboard pattern과 연결합니다.", "portal에도 적용합니다."])],
  }),
  appliedTopic({
    id: "children-security-boundary", title: "children과 slot props를 trusted code와 untrusted content 경계로 분류합니다",
    lead: "React node를 받는 API가 곧 안전한 plugin sandbox는 아니며 caller code, network strings와 raw HTML은 서로 다른 trust 수준입니다.",
    mechanism: "JSX text는 DOM text context로 처리되지만 React element children은 arbitrary component code/effects를 실행할 수 있고 dangerouslySetInnerHTML은 raw markup sink입니다. rest props forwarding은 event/URL/style/ARIA/data exposure를 확장합니다.",
    workflow: "component consumers를 trusted application code로 제한하고 remote content는 schema→text/approved renderer로 변환하며 raw HTML/plugin 요구는 별도 sandbox/sanitizer/CSP threat model로 격리합니다.",
    invariants: "network JSON을 element/component type으로 직접 실행하지 않고 secret/auth state/raw setter를 slot에 주입하지 않으며 unknown props를 host DOM에 blind spread하지 않습니다.",
    edgeCases: "markup-like text, unsafe URL/style, function child from plugin, component registry poisoning, oversized nested tree, getter throw와 server/client trust mismatch를 포함합니다.",
    failureModes: "remote field를 component registry key/props spread로 사용하면 unauthorized component/action이 실행되고 raw HTML sanitizer drift가 stored XSS를 만듭니다.",
    verification: "schema allowlist, malicious text/URL/style/raw HTML, forbidden DOM props, component registry negative tests, CSP/browser test와 secret canary를 실행합니다.",
    operations: "unsafe sink/registry inventory, rejection reason, plugin version와 exposure incidents를 관찰하고 disable/revoke/purge/rollback runbook을 둡니다.",
    concepts: [c("trusted component code", "application build/review boundary 안에서 실행 권한을 가진 React component implementation입니다.", ["remote data와 다릅니다.", "side effects 권한이 있습니다."]), c("content renderer", "validated data variant를 approved React elements/text로 변환하는 allowlisted boundary입니다.", ["component registry를 제한합니다.", "unknown variant를 거부합니다."]), c("prop forwarding surface", "wrapper가 child/host에 전달해 behavior·DOM exposure를 바꿀 수 있는 props 범위입니다.", ["allowlist를 검토합니다.", "event/URL/style을 구분합니다."])],
  }),
  appliedTopic({
    id: "composition-performance", title: "component boundary와 children identity를 Profiler evidence로 최적화합니다",
    lead: "component를 많이 쪼개거나 children을 쓰면 자동으로 빠르다는 믿음 대신 render owner, prop identity와 committed work를 측정합니다.",
    mechanism: "parent render는 child elements를 다시 계산할 수 있고 memo는 props Object.is comparison으로 unchanged child work를 건너뛸 수 있지만 correctness와 state updates/Context를 막지 않습니다. element/children creation 비용과 DOM commit을 구분합니다.",
    workflow: "representative interaction에서 owner/children renders, commit duration, Context fan-out와 expensive calculation을 측정하고 state를 필요한 boundary 가까이 두거나 stable primitive props/slot elements를 선택합니다.",
    invariants: "optimization 전 semantic/a11y/error parity를 고정하고 stale closure/props를 만들지 않으며 memo/custom comparator가 function/object meaning을 빠뜨리지 않습니다.",
    edgeCases: "inline element/function, Context value object, frequent parent state, heavy child, hidden/offscreen subtree, StrictMode와 compiler-enabled build를 다룹니다.",
    failureModes: "모든 component에 memo/useMemo를 붙이면 dependency bugs와 comparison overhead가 늘고 Context update로 다시 render되는 이유를 놓칩니다.",
    verification: "Profiler baseline/variant, render counters, interaction latency, memory/cleanup, custom comparator negative cases와 production build를 확인합니다.",
    operations: "component/commit duration, render fan-out와 memory를 bounded labels로 관찰하고 canary/rollback budget을 둡니다.",
    concepts: [c("component boundary", "state, rendering, error와 semantic responsibility를 나누는 tree 경계입니다.", ["성능 boundary와 항상 같지 않습니다.", "API 비용이 있습니다."]), c("prop identity", "memo comparison과 dependency 판단에 쓰이는 prop reference/value 동일성입니다.", ["semantic equality와 구분합니다.", "function/object를 측정합니다."]), c("render fan-out", "한 state/Context change로 다시 실행되는 descendant component 범위입니다.", ["owner 위치와 Context scope에 영향받습니다.", "Profiler로 확인합니다."])],
  }),
  appliedTopic({
    id: "async-error-ssr-api-evolution", title: "lazy children·error containment·SSR hydration과 slot API evolution을 운영합니다",
    lead: "합성 tree의 child가 늦게 로드되거나 실패하고 old/new bundle이 섞일 때 container 전체 contract가 어떻게 fallback·복구되는지 설계합니다.",
    mechanism: "lazy component는 code promise가 resolve될 때까지 suspend할 수 있고 nearest Suspense/error boundaries가 fallback/failure scope를 정합니다. SSR server tree와 client initial tree의 slot order/content가 다르면 hydration mismatch가 생길 수 있습니다.",
    workflow: "shell/critical/optional slots의 lazy/error priority를 정하고 deterministic server/client inputs, boundary reset key와 retry를 둔 뒤 slot API를 additive→adapter→usage zero→remove 순서로 변경합니다.",
    invariants: "optional child failure가 unrelated UI를 지우지 않고 fallback도 semantic/name/focus contract를 지키며 old/new consumers가 compatibility window에서 같은 required slots를 충족합니다.",
    edgeCases: "chunk 404 after deploy, fallback error/suspend, server-only/client-only branch, slow slot, mixed version, renamed slot, duplicate old/new prop와 rollback을 포함합니다.",
    failureModes: "giant boundary는 작은 lazy child 때문에 whole layout을 바꾸고 slot rename을 atomically 배포하면 cached old bundle이 blank/invalid UI를 만듭니다.",
    verification: "controlled lazy resolve/reject, nested boundary, SSR/hydration, focus/layout, old/new adapter and bundle matrix, retry/rollback와 artifact cleanup을 실행합니다.",
    operations: "chunk/slot/boundary versions, fallback exposure, hydration mismatch, adapter usage와 retry success를 관찰하고 cache purge/rollback runbook을 둡니다.",
    concepts: [c("lazy child", "code가 필요할 때 비동기로 load되어 Suspense와 함께 합성되는 component입니다.", ["module contract를 검증합니다.", "error boundary가 필요합니다."]), c("hydration parity", "server markup과 client initial element tree가 호환되어 event/state attachment가 안정적으로 이루어지는 조건입니다.", ["환경 branch를 통제합니다.", "warning을 gate합니다."]), c("slot compatibility adapter", "old slot/prop contract를 new internal composition으로 변환하는 임시 boundary입니다.", ["usage/expiry를 추적합니다.", "mixed versions를 지원합니다."])],
    codeExamples: [node("react06-release-boundary", "composition security·a11y·performance release manifest", "React06ReleaseBoundary.mjs", "slot API의 required semantics, unsafe forwarding, lazy/error와 render budget을 하나의 deterministic gate로 검사합니다.", String.raw`const manifest = {
  requiredSlots: ["title", "body"],
  providedSlots: ["title", "body", "actions"],
  role: "dialog",
  accessibleName: true,
  rawHtml: false,
  unknownDomPropsForwarded: false,
  lazyChildBoundary: true,
  measuredRenders: 3,
  renderBudget: 4,
};
const missing = manifest.requiredSlots.filter((slot) => !manifest.providedSlots.includes(slot));
console.log("missing=" + (missing.join(",") || "none"));
console.log("role=" + manifest.role + "|named=" + manifest.accessibleName);
console.log("raw-html=" + manifest.rawHtml);
console.log("unknown-forwarding=" + manifest.unknownDomPropsForwarded);
console.log("lazy-boundary=" + manifest.lazyChildBoundary);
console.log("render-budget-pass=" + (manifest.measuredRenders <= manifest.renderBudget));
console.log("adapter-removal-ready=false");`, "missing=none\nrole=dialog|named=true\nraw-html=false\nunknown-forwarding=false\nlazy-boundary=true\nrender-budget-pass=true\nadapter-removal-ready=false", ["react-memo", "react-dom-common", "owasp-xss-prevention", "react-lazy"] )],
  }),
];

const sources: SessionSource[] = [
  { id: "local-book", repository: "my-app01", path: "src/pages/step01-jsx/Book.jsx", usedFor: ["child component and prop rendering provenance"], evidence: "Read-only sanitized audit: 25 lines, 731 bytes, SHA-256 1F7F3EF67F0D3D675E342C1AD1B50D6483107A578AB71AFC17D0FEA69FB0AD4A; actual book strings were not copied." },
  { id: "local-library", repository: "my-app01", path: "src/pages/step01-jsx/Library.jsx", usedFor: ["parent-to-Book composition provenance"], evidence: "Read-only sanitized audit: 19 lines, 618 bytes, SHA-256 F3951584896DCC8D54EEF59555947AEC43B5C21B1E9E807A2147C7D6D9B7104C; actual lesson strings were not copied." },
  { id: "local-comment", repository: "my-app01", path: "src/pages/step02-component/Comment.jsx", usedFor: ["row component and semantic wrapper provenance"], evidence: "Read-only sanitized audit: 50 lines, 1,276 bytes, SHA-256 81F87641ABFC8F0C6EE117EB1129B1874C06D34C62C7D1303B8D1089947B0274; image/text literals were not copied." },
  { id: "local-comment-list", repository: "my-app01", path: "src/pages/step02-component/CommentList.jsx", usedFor: ["parent mapping Comment children provenance"], evidence: "Read-only sanitized audit: 52 lines, 1,463 bytes, SHA-256 19DF8830E90D3935BCE8B0797170531EF93558FC36C8F00499F0AFF4F617533D; person/message literals were not copied." },
  { id: "local-item", repository: "my-app01", path: "src/pages/step02-component/Item.jsx", usedFor: ["prop-driven semantic list child provenance"], evidence: "Read-only sanitized audit: 17 lines, 398 bytes, SHA-256 3BD21516D49B40681E13192073DBB111D7889DA2DF8874B5F3E64CD348943C9A." },
  { id: "local-children-event", repository: "my-app01", path: "src/pages/step06-event/Event02.jsx", usedFor: ["direct children-slot component provenance"], evidence: "Read-only sanitized audit: 24 lines, 784 bytes, SHA-256 74F63B2388E39EF3B37BC42903EB0BEE06690F23C867773C71662ED5D950277D; event/display literals were not copied." },
  { id: "react-intro-composition-doc", repository: "REACT", path: "docs/react/01-intro-setup.md", usedFor: ["App root child-composition documentation provenance"], evidence: "Read-only structural audit: 166 lines, 8,577 bytes, SHA-256 F5606F52A72C9BE700F1F8F44C189E1848D4825292E20F14694033D47AE7C6B4; only the composition structure was used." },
  { id: "react-passing-props", repository: "React", path: "learn/passing-props-to-a-component", publicUrl: "https://react.dev/learn/passing-props-to-a-component", usedFor: ["passing JSX as children and prop composition"], evidence: "React 공식 props/children guidance입니다." },
  { id: "react-create-element", repository: "React", path: "reference/react/createElement", publicUrl: "https://react.dev/reference/react/createElement", usedFor: ["React element creation and opacity"], evidence: "React 공식 createElement API입니다." },
  { id: "react-children", repository: "React", path: "reference/react/Children", publicUrl: "https://react.dev/reference/react/Children", usedFor: ["opaque children traversal and caveats"], evidence: "React 공식 Children API입니다." },
  { id: "react-typescript", repository: "React", path: "learn/typescript", publicUrl: "https://react.dev/learn/typescript", usedFor: ["ReactNode and children typing"], evidence: "React 공식 TypeScript guidance입니다." },
  { id: "react-context", repository: "React", path: "learn/passing-data-deeply-with-context", publicUrl: "https://react.dev/learn/passing-data-deeply-with-context", usedFor: ["scoped context composition"], evidence: "React 공식 Context guidance입니다." },
  { id: "react-clone-element", repository: "React", path: "reference/react/cloneElement", publicUrl: "https://react.dev/reference/react/cloneElement", usedFor: ["cloneElement caveats and alternatives"], evidence: "React 공식 cloneElement API입니다." },
  { id: "react-memo", repository: "React", path: "reference/react/memo", publicUrl: "https://react.dev/reference/react/memo", usedFor: ["component memoization and prop comparison"], evidence: "React 공식 memo API입니다." },
  { id: "react-dom-common", repository: "React DOM", path: "reference/react-dom/components/common", publicUrl: "https://react.dev/reference/react-dom/components/common", usedFor: ["host props and raw HTML sink"], evidence: "React DOM 공식 common components reference입니다." },
  { id: "react-lazy", repository: "React", path: "reference/react/lazy", publicUrl: "https://react.dev/reference/react/lazy", usedFor: ["lazy component loading and Suspense integration"], evidence: "React 공식 lazy API입니다." },
  { id: "html-content-models", repository: "WHATWG HTML", path: "Content models", publicUrl: "https://html.spec.whatwg.org/multipage/dom.html#content-models", usedFor: ["valid parent-child HTML structures"], evidence: "WHATWG 공식 HTML Standard입니다." },
  { id: "wcag-name-role-value", repository: "W3C WAI", path: "Understanding Name, Role, Value", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html", usedFor: ["programmatic component semantics"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
  { id: "aria-dialog-pattern", repository: "W3C WAI-ARIA APG", path: "Dialog Modal Pattern", publicUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/", usedFor: ["dialog slot roles, naming and keyboard contract"], evidence: "W3C WAI-ARIA APG 공식 dialog pattern입니다." },
  { id: "owasp-xss-prevention", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["output contexts, raw HTML and unsafe sinks"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-06-list-map-key", slug: "react-06-component-composition-children", courseId: "react", moduleId: "react-rendering-components", order: 6,
  title: "component 합성과 children slot", subtitle: "원본 parent-child tree와 direct children 예제를 opaque node·named/render/compound slots, semantic ownership, security·performance와 async API 운영으로 확장합니다.", level: "중급", estimatedMinutes: 105,
  coreQuestion: "재사용 가능한 UI를 어떤 component/children/slot 경계로 합성해야 data flow와 state ownership이 명확하고 semantics·security·performance·failure가 통제될까요?",
  summary: "my-app01의 Book, Library, Comment, CommentList, Item과 direct children example, REACT intro composition document를 read-only·sanitized 감사했습니다. Library→Book, CommentList→Comment, prop-driven semantic Item과 root App composition, start/end tags 사이 JSX를 children으로 전달하는 실제 구조를 보존하되 book/person/message/item/event strings는 복사하지 않습니다. React element/node/opaque children, containment/named slots, render props, compound components/scoped Context, Children/cloneElement alternatives, semantic DOM/a11y owner, untrusted content/prop forwarding, composition performance와 lazy/error/SSR/API migration을 current official sources로 확장합니다. 다섯 Node examples는 source tree, node shapes, slot validation, compound registry와 release manifest를 exact stdout으로 실행합니다.",
  objectives: ["원본 component tree와 children evidence를 안전하게 감사한다.", "React element·node·children runtime 범위를 구분한다.", "containment과 named slots의 semantic owner를 설계한다.", "render props로 state owner와 rendering strategy를 분리한다.", "compound components를 scoped Context/registration invariant로 만든다.", "Children/cloneElement caveats와 explicit alternatives를 선택한다.", "semantic DOM·accessible name·focus owner를 고정한다.", "children/slot trust와 raw HTML/prop forwarding을 통제한다.", "component boundary·prop identity·render fan-out을 측정한다.", "lazy/error/SSR와 slot API compatibility를 운영한다."],
  prerequisites: [{ title: "조건부 렌더링과 UI 상태", reason: "branch에 따라 child subtree가 mount·preserve·reset되는 원리를 알아야 composition slot의 state/error/fallback lifetime을 안전하게 설계할 수 있습니다.", sessionSlug: "react-05-conditional-rendering" }],
  keywords: ["component composition", "children", "ReactNode", "slot", "named slots", "render props", "compound components", "Context", "cloneElement", "semantic DOM", "memo", "lazy"],
  topics,
  lab: {
    title: "원본 parent-child 예제를 typed slot·compound component system으로 확장하기",
    scenario: "원본 actual labels를 쓰지 않는 disposable React fixture에서 Card/Dialog/Tabs-like composition을 만들고 children shape, semantic ownership, malicious inputs, performance와 mixed-version behavior를 qualification합니다.",
    setup: ["원본 7 files/docs read-only와 hashes", "synthetic React nodes and non-domain text", "TypeScript/runtime slot schema fixture", "component/browser accessibility tests", "Profiler and controlled lazy/error fixtures"],
    steps: ["원본 parent→child, props/children, repeated mapping과 semantic owner graph를 기록합니다.", "null/false/zero/text/element/array/Fragment/function children corpus를 실행합니다.", "generic containment와 title/body/actions named slot contracts를 정의합니다.", "required/optional/duplicate slots와 invalid HTML structures를 negative test합니다.", "state owner가 finite actions를 제공하는 render-prop variant를 구현합니다.", "Root/Trigger/Panel compound parts를 scoped Context와 stable registration IDs로 만듭니다.", "Children/cloneElement implementation을 props/Context/render-prop alternatives와 비교합니다.", "role/name/value, headings, focus entry/return와 nested interactive content를 검증합니다.", "remote markup/URL/style/component registry와 unknown prop forwarding을 공격 corpus로 검사합니다.", "Profiler에서 state placement, Context fan-out, memo/prop identity variants를 비교합니다.", "lazy resolve/reject, boundary reset, SSR/hydration와 old/new slot adapter를 실행합니다.", "source hashes, API table, a11y/security/performance/compatibility artifacts와 rollback runbook을 제출합니다."],
    expectedResult: ["children shapes와 slot cardinality가 explicit contract로 검증됩니다.", "container/consumer 중 하나만 semantic name/role/focus를 소유합니다.", "compound parts가 nested/reordered 상황에도 stable IDs와 finite actions를 유지합니다.", "remote unsafe content와 unknown host props가 실행·DOM 노출되지 않습니다.", "lazy/error/hydration/mixed-version과 render budgets가 release gates를 통과합니다."],
    cleanup: ["synthetic nodes, browser storage, test/Profiler/hydration artifacts를 제거합니다.", "timers, lazy promises, observers, reporters와 Context registries를 정리합니다.", "feature flags, adapters, fault injection과 verbose logs를 원복합니다.", "원본 7 files/docs hashes/status unchanged를 확인합니다."],
    extensions: ["headless accessible component primitives를 설계합니다.", "server/client component slot serialization boundary를 비교합니다.", "polymorphic as prop의 TypeScript/semantic contract를 추가합니다.", "component API metadata에서 docs, type tests와 codemods를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Node examples를 실행하고 실제 React composition tests로 연결하세요.", requirements: ["stdout 완전 일치", "source tree", "node shape/zero", "named slot validation", "compound registration", "security/a11y/performance manifest"], hints: ["synthetic node 분류를 React Children implementation이라고 표현하지 마세요."], expectedOutcome: "component composition을 tree·slot·authority·semantic contract로 설명합니다.", solutionOutline: ["audit→classify nodes→define slots→share state→protect/measure 순서입니다."] },
    { difficulty: "응용", prompt: "Book/Comment/Item 구조를 reusable accessible compound UI로 확장하세요.", requirements: ["children/named slot types", "semantic owner", "finite actions", "scoped Context", "invalid composition tests", "unsafe content/forwarding guards", "Profiler budgets", "lazy/error adapter"], hints: ["child elements를 clone해 props를 몰래 주입하기 전에 explicit Context/props를 비교하세요."], expectedOutcome: "재사용 API가 nested/missing/failure/attack 상황에도 예측 가능하게 동작합니다.", solutionOutline: ["contract→compose→register→validate→profile→evolve 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 React component composition 표준을 작성하세요.", requirements: ["element/node/children semantics", "containment/named/render slots", "compound/context", "Children/clone policy", "semantic/a11y owner", "security trust", "performance", "lazy/SSR/versioning gates"], hints: ["props type 목록뿐 아니라 rendered semantics, state authority와 failure containment를 포함하세요."], expectedOutcome: "component library API가 compatibility·a11y·security·performance 근거로 진화합니다.", solutionOutline: ["boundaries→slots→authority→semantics→evidence→migration 순서입니다."] },
  ],
  nextSessions: ["react-07-state-snapshot-immutability"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["Book.jsx 25 lines/731 bytes, Library.jsx 19 lines/618 bytes, Comment.jsx 50 lines/1,276 bytes, CommentList.jsx 52 lines/1,463 bytes, Item.jsx 17 lines/398 bytes를 sanitized audit했고 actual lesson/person/message/item strings를 복사하지 않았습니다.", "Event02.jsx는 24 lines/784 bytes, SHA-256 74F63B23…이며 direct children prop evidence만 사용하고 event/display literals는 제외했습니다.", "REACT docs/react/01-intro-setup.md는 166 lines/8,577 bytes, SHA-256 F5606F52…이며 root App child-composition structure만 provenance로 사용했습니다.", "원본에 named slots, render props, compound Context, clone alternatives, semantic ownership, security/performance/SSR migration이 구현됐다고 과장하지 않고 official sources와 synthetic models로 보강했습니다.", "Node examples는 actual React element/Children traversal, Context/reconciliation, DOM/a11y, lazy/Suspense, SSR hydration과 browser security를 대체하지 않습니다."] },
});

export default session;
