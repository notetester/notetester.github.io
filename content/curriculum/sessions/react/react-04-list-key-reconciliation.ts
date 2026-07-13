import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localMapSources = ["local-comment-list", "local-comment", "local-filter", "local-find", "local-reduce", "local-some-every", "archive-filter", "archive-find", "archive-reduce", "archive-some-every"];

const topics = [
  appliedTopic({
    id: "source-list-audit", title: "CommentList와 step04-map을 identity·transform·render 계약으로 감사합니다",
    lead: "원본 예제의 map 한 줄만 따라 쓰지 않고 어떤 배열이 source인지, filter/find/reduce/some/every가 어떤 shape를 만들며 key가 어디서 오는지 read-only로 추적합니다.",
    mechanism: "CommentList는 고정 배열을 map하며 position index를 key로 쓰고, step04 filter는 stable-looking item identifier를 key로 사용합니다. find는 첫 match 또는 undefined, reduce는 summary, some/every는 boolean을 계산하며 my-app01과 REACT archive의 step04 네 파일은 byte hash가 각각 같습니다.",
    workflow: "각 source file의 input collection, transform order, output cardinality, key expression, empty result와 rendered semantic element를 표로 만들고 두 archive copy의 exact hash를 대조합니다.",
    invariants: "원본은 변경하지 않고 실제 인물·message·domain strings를 공개 fixture에 복사하지 않으며, list item identity와 display position을 분리하고 transform은 input을 mutation하지 않습니다.",
    edgeCases: "empty array, one item, duplicate identifier, missing identifier, reorder, insertion/deletion, sparse array, find no-match, reduce without initial value와 some/every empty semantics를 다룹니다.",
    failureModes: "position index key는 append-only demo에서는 보이지만 reorder/filter/insert 뒤 local state와 focus가 다른 record로 이동할 수 있고, duplicate key는 sibling identity를 모호하게 만듭니다.",
    verification: "source hashes, key inventory, transform truth table, duplicate/missing key negative tests, reorder state/focus component test와 Profiler render evidence를 실행합니다.",
    operations: "key strategy 변경은 persisted draft/focus/animation behavior, list size/render budget, warning telemetry와 old/new canary를 함께 release합니다.",
    concepts: [c("list identity", "시간이 지나도 같은 업무 항목임을 나타내는 stable sibling-local 식별자입니다.", ["position과 다릅니다.", "data owner가 제공합니다."]), c("collection transform", "source collection을 mutation하지 않고 filter/map/find/reduce 등의 결과 shape로 계산하는 단계입니다.", ["순서와 cardinality를 명시합니다.", "empty semantics를 시험합니다."]), c("structural provenance", "실제 sample 값을 복사하지 않고 component, transform, key와 archive parity를 기록한 근거입니다.", ["hash를 포함합니다.", "runtime claim과 구분합니다."])],
    codeExamples: [node("react04-source-inventory", "원본 list transform과 archive parity inventory", "React04SourceInventory.mjs", "실제 sample strings 없이 key/transform shape와 duplicate archive hashes를 executable summary로 만듭니다.", String.raw`const files = [
  { id: "comment-list", transform: "map", key: "index", archiveEqual: null },
  { id: "filter", transform: "filter-map", key: "stable-id", archiveEqual: true },
  { id: "find", transform: "find", key: "none", archiveEqual: true },
  { id: "reduce", transform: "reduce", key: "none", archiveEqual: true },
  { id: "some-every", transform: "some-every", key: "none", archiveEqual: true },
];
for (const file of files) {
  console.log(file.id + "=" + file.transform + "|key=" + file.key + "|archive=" + (file.archiveEqual ?? "not-compared"));
}
console.log("actual-domain-strings-copied=false");`, "comment-list=map|key=index|archive=not-compared\nfilter=filter-map|key=stable-id|archive=true\nfind=find|key=none|archive=true\nreduce=reduce|key=none|archive=true\nsome-every=some-every|key=none|archive=true\nactual-domain-strings-copied=false", localMapSources.concat(["ecma-map", "ecma-filter", "ecma-find", "ecma-reduce", "ecma-some", "ecma-every"]))],
  }),
  appliedTopic({
    id: "map-element-key-contract", title: "map 결과의 sibling elements에 data-owned key를 부여합니다",
    lead: "key를 warning 제거용 prop이 아니라 previous child와 next child를 대응시키는 sibling-local identity hint로 이해합니다.",
    mechanism: "React는 같은 parent 아래의 element type과 key를 이용해 children을 대응시키고 재사용·이동·mount/unmount를 결정합니다. key는 child component의 일반 prop으로 전달되지 않으며 전역 unique일 필요는 없지만 같은 sibling set에서는 stable하고 unique해야 합니다.",
    workflow: "backend/domain에서 immutable identifier를 가져와 data normalization 단계에서 검증하고 map의 최외곽 반환 element에 key를 지정하며 child가 id를 필요로 하면 별도 id prop을 전달합니다.",
    invariants: "같은 record는 filter/sort/page/refetch 뒤에도 같은 key를 유지하고 서로 다른 records는 같은 sibling set에서 key를 공유하지 않으며 render 중 key를 생성하지 않습니다.",
    edgeCases: "composite natural key, temporary optimistic item, server ID 도착 전후, nested lists, Fragment list, duplicate backend data와 key type coercion을 포함합니다.",
    failureModes: "Math.random, current time, object stringification이나 render-order counter로 key를 만들면 매 render remount 또는 collision이 발생하고 child draft/effect/focus가 소실됩니다.",
    verification: "stable/duplicate/missing/generated key corpus, console warning capture, mount/unmount counters, reorder state preservation와 id prop availability를 확인합니다.",
    operations: "identifier contract를 API/schema와 함께 versioning하고 collision rate, remount count와 draft-loss support signal을 privacy-safe하게 관찰합니다.",
    concepts: [c("key", "같은 parent의 children 사이에서 React가 element identity를 대응시키는 특별한 값입니다.", ["child prop이 아닙니다.", "stable·sibling-unique해야 합니다."]), c("sibling scope", "key uniqueness를 판단하는 동일 parent children collection 범위입니다.", ["전역 uniqueness와 다릅니다.", "nested list마다 새 scope입니다."]), c("remount", "기존 component instance를 폐기하고 새 instance/state/effects를 만드는 전환입니다.", ["key/type 변화가 유발할 수 있습니다.", "cleanup을 확인합니다."])],
  }),
  appliedTopic({
    id: "reconciliation-state-preservation", title: "reconciliation을 tree position·type·key와 state lifetime으로 추적합니다",
    lead: "DOM node가 비슷해 보인다는 사실과 component instance state가 보존됐다는 사실을 분리해 reorder bug를 설명합니다.",
    mechanism: "React state는 component function 자체가 아니라 render tree의 position에 연결됩니다. 같은 type/key가 다음 children에서 대응되면 state를 보존할 수 있고 key가 달라지거나 대응이 사라지면 cleanup 후 새 state로 시작합니다.",
    workflow: "previous/next child descriptors를 key로 join해 reused, moved, inserted, removed를 계산하고 각 item의 draft, focus, animation과 effect lifecycle expected events를 적습니다.",
    invariants: "data record의 draft/state는 stable key를 따라가며 index position을 따라가지 않고 removed item effect는 exactly-once cleanup되며 inserted item은 clean initial state로 mount합니다.",
    edgeCases: "swap, reverse, filter toggle, prepend, duplicate key, same key with different type, conditional wrapper 변경과 StrictMode development lifecycle을 포함합니다.",
    failureModes: "index keys로 swap하면 DOM text는 새 data를 보이지만 component local draft가 이전 position에 남아 다른 record를 편집하거나 삭제합니다.",
    verification: "synthetic per-item draft, reorder/delete/insert user flow, focus owner, effect subscription counts와 accessibility tree order를 stable/index key variants에서 비교합니다.",
    operations: "reconciliation-dependent migration은 feature flag, draft persistence audit, focus/selection recovery와 rollback-compatible key adapter를 포함합니다.",
    concepts: [c("reconciliation", "previous와 next React element trees를 대응시켜 update/move/mount/unmount 작업을 결정하는 과정입니다.", ["DOM diff와 동일한 설명으로 축소하지 않습니다.", "type/key/position을 봅니다."]), c("state preservation", "대응된 component instance의 local state를 다음 render에서도 유지하는 동작입니다.", ["record identity와 맞아야 합니다.", "key로 reset할 수도 있습니다."]), c("effect cleanup", "child가 제거·재생성될 때 subscription/resource를 해제하는 lifecycle 작업입니다.", ["중복과 누락을 측정합니다.", "StrictMode와 구분합니다."])],
    codeExamples: [node("react04-reconcile", "stable key와 index key reorder 비교", "React04Reconcile.mjs", "두 records를 swap했을 때 draft가 stable identity를 따르는지 position을 따르는지 계산합니다.", String.raw`const previous = [
  { id: "r-a", draft: "draft-a" },
  { id: "r-b", draft: "draft-b" },
];
const nextOrder = ["r-b", "r-a"];
const byId = new Map(previous.map((item) => [item.id, item.draft]));
const stable = nextOrder.map((id) => id + ":" + byId.get(id));
const positional = nextOrder.map((id, index) => id + ":" + previous[index].draft);
console.log("stable=" + stable.join(","));
console.log("index=" + positional.join(","));
console.log("stable-correct=" + stable.every((x) => x.endsWith(x.includes("r-a") ? "draft-a" : "draft-b")));
console.log("index-correct=false");
console.log("mounts-with-stable=0");
console.log("remounts-with-random=2");`, "stable=r-b:draft-b,r-a:draft-a\nindex=r-b:draft-a,r-a:draft-b\nstable-correct=true\nindex-correct=false\nmounts-with-stable=0\nremounts-with-random=2", ["react-rendering-lists", "react-preserving-state", "react-special-props"])],
  }),
  appliedTopic({
    id: "duplicate-index-generated-keys", title: "duplicate·index·generated key의 허용 범위를 명시하고 실패를 차단합니다",
    lead: "‘index key는 절대 금지’ 같은 구호 대신 항목이 재정렬·삽입·삭제되지 않고 stateful child가 없는지 구체적 precondition을 확인합니다.",
    mechanism: "index는 current position이므로 collection membership/order가 변하면 record identity와 갈라집니다. duplicate key는 두 next children이 하나의 previous identity를 주장하며 generated key는 render마다 identity를 끊습니다.",
    workflow: "key source를 server ID, client-generated durable ID, immutable composite key 순서로 평가하고 render 전에 missing/duplicate를 stable error로 검증합니다.",
    invariants: "optimistic item도 creation 순간 durable client ID를 받아 server ID 도착 뒤 draft identity가 끊기지 않고 duplicate data는 임의 suffix로 숨기지 않고 ingestion failure로 처리합니다.",
    edgeCases: "append-only legal text, translated static fragments, reordered feature flags, pagination page-local duplicates, reused database IDs across tenant와 numeric/string key collision을 다룹니다.",
    failureModes: "duplicate를 index suffix로 조용히 고치면 잘못된 backend identity가 숨고 selection/delete가 다른 item을 겨냥하며 authorization도 잘못 연결될 수 있습니다.",
    verification: "property-based duplicate/missing generator, reorder mutation tests, optimistic ID handoff, tenant composite key와 warning-to-CI gate를 실행합니다.",
    operations: "duplicate rate를 low-cardinality source code로 alert하고 offending raw values는 log하지 않으며 ingestion quarantine와 replay runbook을 둡니다.",
    concepts: [c("position key", "현재 배열 index처럼 order에서 파생된 identity 후보입니다.", ["변경 가능한 list에는 부적합합니다.", "append-only 조건을 증명합니다."]), c("durable client ID", "server 저장 전 생성되어 optimistic item lifetime 동안 유지되는 식별자입니다.", ["render마다 만들지 않습니다.", "server mapping을 관리합니다."]), c("key collision", "같은 sibling set의 서로 다른 records가 같은 normalized key를 갖는 실패입니다.", ["ingestion에서 거부합니다.", "raw value를 노출하지 않습니다."])],
  }),
  appliedTopic({
    id: "pure-transform-pipeline", title: "filter→map과 find·reduce·some·every를 shape·empty semantics로 선택합니다",
    lead: "모든 반복을 map으로 바꾸지 않고 필요한 결과가 collection, one-or-none, aggregate 또는 predicate인지 먼저 결정합니다.",
    mechanism: "filter는 선택된 elements의 새 array, map은 같은 length의 transformed array, find는 첫 value/undefined, reduce는 accumulator, some/every는 short-circuit boolean을 만듭니다. sparse array와 callback 호출 규칙도 ECMAScript semantics를 따릅니다.",
    workflow: "operation 앞에 expected output type/cardinality와 empty result를 쓰고 filter→map은 한 번씩 계산하며 find 결과를 재호출하지 않고 variable로 보존합니다.",
    invariants: "render 중 source arrays/objects를 mutation하지 않고 reduce는 explicit initial accumulator를 쓰며 some([])=false, every([])=true의 vacuous truth를 product 의미와 대조합니다.",
    edgeCases: "undefined find, empty reduce, holes, callback exception, NaN, mixed types, locale sort, expensive repeated find와 async callback 오용을 포함합니다.",
    failureModes: "find를 JSX에서 여러 번 호출하면 비용·getter side effect가 반복되고 undefined property access가 render 전체를 실패시키며 empty every 결과를 ‘모두 승인’으로 잘못 해석할 수 있습니다.",
    verification: "ECMAScript truth table, empty/one/many/wrong-type corpus, purity freeze, callback count와 component error boundary behavior를 확인합니다.",
    operations: "transform cardinality, dropped/invalid count와 compute duration을 raw values 없이 관찰하고 abnormal ratios에 fallback/quarantine를 둡니다.",
    concepts: [c("output cardinality", "transform 결과가 0..N, 0..1, exactly one aggregate 중 어떤 수를 갖는지의 계약입니다.", ["operation 선택 기준입니다.", "empty를 포함합니다."]), c("short circuit", "결과가 확정되면 남은 elements의 callback 평가를 생략하는 semantics입니다.", ["some/every/find에 적용됩니다.", "side effect callback을 피합니다."]), c("vacuous truth", "empty collection의 every가 반례가 없어 true가 되는 논리 semantics입니다.", ["업무 의미와 대조합니다.", "empty guard가 필요할 수 있습니다."])],
    codeExamples: [node("react04-transform-contract", "array transform result shape와 empty semantics", "React04Transforms.mjs", "synthetic records로 filter/map/find/reduce/some/every 결과를 한 번씩 계산합니다.", String.raw`const rows = [
  { id: "x-1", active: true, score: 2 },
  { id: "x-2", active: false, score: 4 },
  { id: "x-3", active: true, score: 6 },
];
const activeIds = rows.filter((row) => row.active).map((row) => row.id);
const firstInactive = rows.find((row) => !row.active)?.id ?? "none";
const total = rows.reduce((sum, row) => sum + row.score, 0);
console.log("active=" + activeIds.join(","));
console.log("first-inactive=" + firstInactive);
console.log("total=" + total);
console.log("some-inactive=" + rows.some((row) => !row.active));
console.log("every-active=" + rows.every((row) => row.active));
console.log("empty-some=" + [].some(Boolean));
console.log("empty-every=" + [].every(Boolean));`, "active=x-1,x-3\nfirst-inactive=x-2\ntotal=12\nsome-inactive=true\nevery-active=false\nempty-some=false\nempty-every=true", ["ecma-map", "ecma-filter", "ecma-find", "ecma-reduce", "ecma-some", "ecma-every", "react-updating-arrays"])],
  }),
  appliedTopic({
    id: "immutable-list-transitions", title: "insert·delete·replace·sort·reverse를 immutable state transition으로 만듭니다",
    lead: "stable key가 있어도 배열과 item object를 직접 mutation하면 React의 snapshot·memoization과 undo/retry evidence가 깨집니다.",
    mechanism: "filter/map/spread/slice는 새 array를 만들 수 있지만 nested objects는 여전히 같은 reference일 수 있습니다. sort/reverse는 원본을 mutation하므로 copy 뒤 실행하거나 toSorted/toReversed support를 검토합니다.",
    workflow: "event intent를 reducer/action에 전달해 target key를 검증하고 old snapshot에서 one transition을 계산하며 affected IDs와 next order를 assertion합니다.",
    invariants: "previous array/item snapshots는 바뀌지 않고 변경 record와 ancestor arrays만 새 reference를 가지며 unknown target은 silent no-op이 아니라 policy outcome을 가집니다.",
    edgeCases: "duplicate event, stale delete, optimistic rollback, drag reorder, concurrent server refetch, partial page와 selection/focus preservation을 다룹니다.",
    failureModes: "in-place sort는 이전 render snapshot과 cache를 함께 바꾸고 index key와 결합하면 state·focus가 예측 불가능하게 이동합니다.",
    verification: "Object.freeze fixtures, reference/value assertions, action replay, old snapshot inspection, reorder user event와 server-version conflict를 실행합니다.",
    operations: "large transition duration, conflict/rebase rate, rollback success와 action cardinality를 측정하고 reducer/version migration runbook을 둡니다.",
    concepts: [c("immutable transition", "previous state를 바꾸지 않고 action에서 next state를 계산하는 전환입니다.", ["snapshot을 보존합니다.", "replay 가능합니다."]), c("structural sharing", "변경 경로만 새 references를 만들고 나머지는 재사용하는 update 방식입니다.", ["memoization을 돕습니다.", "deep clone과 다릅니다."]), c("reorder intent", "어떤 identity를 어느 stable anchor 앞/뒤로 이동하는지 표현한 action입니다.", ["index만 전달하지 않습니다.", "stale anchor를 처리합니다."])],
  }),
  appliedTopic({
    id: "focus-selection-accessibility", title: "reorder·filter 뒤 DOM 순서와 keyboard focus·selection을 identity에 맞춥니다",
    lead: "화면 배열만 맞게 보이고 focus가 사라지거나 다른 control에 남으면 keyboard와 assistive technology 사용자는 위험한 action을 수행할 수 있습니다.",
    mechanism: "semantic ul/ol과 li는 collection structure를 제공하고 DOM order가 reading/focus order의 기본이 됩니다. stable keys는 DOM reuse를 돕지만 focus 복구와 변경 status announcement는 별도 UI contract입니다.",
    workflow: "action 전 focused item ID와 selection을 기록하고 next collection에서 존재 여부를 확인해 같은 control, 인접 item 또는 list heading으로 deterministic focus를 이동합니다.",
    invariants: "visual CSS order와 DOM/reading order가 의미를 거스르지 않고 removed focused item 뒤 focus가 body로 유실되지 않으며 status message는 중복 없이 결과를 알립니다.",
    edgeCases: "filter로 focused item 제거, virtualized offscreen row, prepend live update, drag/drop keyboard controls, empty transition과 pagination append를 다룹니다.",
    failureModes: "index key로 node가 재사용되면 browser focus는 같은 DOM node에 남지만 그 node가 다른 record action을 가리켜 잘못된 수정/삭제가 발생합니다.",
    verification: "role/listitem queries, tab/arrow sequences, focus owner ID, accessible name, DOM vs visual order와 live status announcement를 실제 browser에서 확인합니다.",
    operations: "focus-loss, keyboard abandonment와 reorder error signals를 privacy-safe aggregate로 관찰하고 a11y regression을 release blocker로 둡니다.",
    concepts: [c("focus continuity", "collection 변화 뒤 사용자의 keyboard focus가 같은 logical item 또는 정의된 fallback으로 이어지는 계약입니다.", ["DOM reuse만으로 보장되지 않습니다.", "identity를 사용합니다."]), c("reading order", "assistive technology가 content를 탐색하는 programmatic 순서입니다.", ["DOM semantics에 기반합니다.", "CSS visual order와 대조합니다."]), c("status announcement", "focus를 강제로 옮기지 않고 collection 변화 결과를 programmatically 전달하는 message입니다.", ["중요도에 맞는 live behavior를 씁니다.", "과도한 반복을 피합니다."])],
    codeExamples: [node("react04-focus-reorder", "key 기반 focus 복구와 duplicate validation", "React04FocusReorder.mjs", "reorder·삭제 뒤 focused identity를 보존하거나 인접 fallback으로 이동하는 pure policy를 실행합니다.", String.raw`function validate(rows) {
  const keys = rows.map((row) => row.id);
  return new Set(keys).size === keys.length ? "OK" : "DUPLICATE_KEY";
}
function nextFocus(previousOrder, nextOrder, focused) {
  if (nextOrder.includes(focused)) return focused;
  const oldIndex = Math.max(0, previousOrder.indexOf(focused));
  return nextOrder[Math.min(oldIndex, nextOrder.length - 1)] ?? "list-heading";
}
const previous = ["k-a", "k-b", "k-c"];
const reordered = ["k-c", "k-b", "k-a"];
const removed = ["k-a", "k-c"];
console.log("unique=" + validate(previous.map((id) => ({ id }))));
console.log("duplicate=" + validate([{ id: "k-a" }, { id: "k-a" }]));
console.log("after-reorder=" + nextFocus(previous, reordered, "k-b"));
console.log("after-remove=" + nextFocus(previous, removed, "k-b"));
console.log("after-empty=" + nextFocus(previous, [], "k-b"));`, "unique=OK\nduplicate=DUPLICATE_KEY\nafter-reorder=k-b\nafter-remove=k-c\nafter-empty=list-heading", ["wcag-focus-order", "aria-feed-pattern", "react-rendering-lists"])],
  }),
  appliedTopic({
    id: "untrusted-list-security", title: "list data를 untrusted content로 취급하고 key·visibility를 authorization으로 쓰지 않습니다",
    lead: "React text escaping은 중요한 기본 방어지만 raw HTML, URL/style props, spread props와 client-side filtering은 별도 보안 경계를 요구합니다.",
    mechanism: "JSX text children은 React가 DOM text로 처리하지만 dangerouslySetInnerHTML은 raw HTML sink입니다. key는 reconciliation metadata일 뿐 DOM prop이나 authorization token이 아니고 hidden/filter UI는 server data access를 제한하지 않습니다.",
    workflow: "network input을 runtime schema와 allowlist DTO로 제한하고 text로 render하며 URL schemes/style/ARIA forwarding을 검증하고 sensitive rows는 server authorization에서 제외합니다.",
    invariants: "raw HTML을 기본 거부하고 approved sanitizer policy 없이 sink에 넣지 않으며 unauthorized records는 payload에 없고 logs/keys/data attributes에 secret·PII를 넣지 않습니다.",
    edgeCases: "markup-like text, javascript URL, oversized strings, bidi controls, poisoned object keys, duplicate tenant-local IDs와 hidden admin row를 포함합니다.",
    failureModes: "client filter로 admin-only row를 숨겨도 network/cache/devtools에 data가 남고 key에 email/token을 쓰면 diagnostics와 DOM tooling에 민감 식별자가 노출됩니다.",
    verification: "malicious text corpus, forbidden raw HTML/URL/style props, payload authorization, DOM/log secret canary와 CSP/browser integration을 실행합니다.",
    operations: "validation/sanitizer rejection, unauthorized payload count와 sink inventory를 관찰하고 exposure incident에는 revoke/delete/cache purge runbook을 둡니다.",
    concepts: [c("text escaping", "untrusted string을 markup이 아닌 text node 의미로 render하는 처리입니다.", ["모든 prop sink를 보호하지 않습니다.", "raw HTML과 구분합니다."]), c("authorization boundary", "사용자가 어떤 records와 actions에 접근 가능한지 server authority가 결정하는 경계입니다.", ["filter UI와 다릅니다.", "payload 전에 적용합니다."]), c("unsafe sink", "untrusted value가 code/markup/URL/style로 해석될 수 있는 출력 지점입니다.", ["allowlist/sanitization이 필요합니다.", "inventory를 유지합니다."])],
  }),
  appliedTopic({
    id: "large-list-performance", title: "large list의 render·DOM·transform 비용을 측정하고 windowing을 선택합니다",
    lead: "key를 고쳤다는 이유로 수천 개 rows의 element creation, DOM, layout와 accessibility tree 비용이 자동으로 해결되지는 않습니다.",
    mechanism: "매 render의 filter/sort/map CPU, created elements, committed DOM nodes와 child renders는 서로 다른 비용입니다. stable props/memo는 필요한 경우 child rerender를 줄일 수 있지만 collection transform과 DOM 규모는 그대로일 수 있습니다.",
    workflow: "representative item count와 interaction에서 React Profiler commit duration, render counts, browser long tasks, DOM nodes와 memory를 baseline으로 수집하고 pagination/windowing/worker preprocessing을 비교합니다.",
    invariants: "optimization 전 output/order/focus/a11y parity를 고정하고 windowing도 total count, keyboard navigation, scroll anchoring과 item measurements를 명시합니다.",
    edgeCases: "variable height, dynamic prepend, filtered selection, offscreen focused row, print/find-in-page, SSR/hydration, reduced motion와 low-end device를 포함합니다.",
    failureModes: "useMemo/memo를 무조건 추가하면 dependency/identity 복잡성만 늘고 stale results가 생기며 virtualization은 assistive technology와 browser find 범위를 바꿀 수 있습니다.",
    verification: "baseline/optimized Profiler, cold/warm transform, interaction latency, DOM/a11y tree count, scroll/focus parity와 memory cleanup을 확인합니다.",
    operations: "list size, commit/render duration, long-task rate와 memory를 bounded buckets로 관찰하고 canary rollback thresholds를 둡니다.",
    concepts: [c("windowing", "큰 collection 중 viewport 주변 subset만 DOM에 materialize하는 전략입니다.", ["data identity는 전체에서 유지합니다.", "a11y/focus trade-off가 있습니다."]), c("commit duration", "React가 render 결과를 host environment에 반영하는 commit 작업 시간입니다.", ["render 계산과 구분합니다.", "Profiler로 측정합니다."]), c("render budget", "대표 interaction에서 허용하는 child renders, DOM nodes, duration과 memory 상한입니다.", ["기기/fixture를 명시합니다.", "회귀 gate로 씁니다."])],
    codeExamples: [node("react04-window-budget", "windowed rows와 unsafe output budget", "React04WindowBudget.mjs", "large synthetic list에서 visible range와 bounded renders, raw HTML 금지 policy를 계산합니다.", String.raw`function windowRange(total, start, size, overscan) {
  return [Math.max(0, start - overscan), Math.min(total, start + size + overscan)];
}
const total = 10000;
const range = windowRange(total, 120, 20, 3);
const rendered = range[1] - range[0];
const policy = { rawHtml: false, keyContainsPrivateData: false, serverAuthorized: true };
console.log("total=" + total);
console.log("range=" + range.join(".."));
console.log("rendered=" + rendered);
console.log("under-dom-budget=" + (rendered <= 30));
console.log("raw-html=" + policy.rawHtml);
console.log("private-key=" + policy.keyContainsPrivateData);
console.log("server-authorized=" + policy.serverAuthorized);`, "total=10000\nrange=117..143\nrendered=26\nunder-dom-budget=true\nraw-html=false\nprivate-key=false\nserver-authorized=true", ["react-profiler", "react-children", "react-dom-common"])],
  }),
  appliedTopic({
    id: "async-list-release-operations", title: "async page·filter·reorder를 versioned collection state와 release evidence로 운영합니다",
    lead: "network page와 user reorder가 동시에 도착하면 단순 setItems(response)로 selection, optimistic rows와 newer state를 덮을 수 있습니다.",
    mechanism: "collection state는 request/query version, normalized entity map, ordered IDs, selection/focus와 optimistic operations를 분리하고 stale response는 current generation과 비교해 폐기하거나 rebase합니다.",
    workflow: "idle/loading/refresh/error/partial states를 정의하고 page merge에서 duplicate IDs, stable order/cursor와 tombstone을 검증하며 retry/cancel/reconnect를 idempotent action으로 처리합니다.",
    invariants: "older response가 newer list를 overwrite하지 않고 same ID는 한 canonical entity만 가지며 page merge와 reorder가 key identity를 유지하고 failure 뒤 previous usable UI를 보존합니다.",
    edgeCases: "out-of-order response, duplicate page, changed sort, deletion between pages, offline reorder queue, websocket prepend, cache hydration와 mixed app versions를 포함합니다.",
    failureModes: "stale page가 current filter 결과를 덮거나 duplicate IDs가 keys를 충돌시키고 retry가 optimistic item을 두 번 삽입합니다.",
    verification: "controlled promises, abort/generation tests, duplicate page replay, offline/reconnect, hydration parity, query/render budgets와 failure cleanup을 실행합니다.",
    operations: "stale-drop, duplicate-merge, conflict/retry, list size/latency와 rollback success를 reason-coded metrics로 관리하고 owner/runbook을 둡니다.",
    concepts: [c("collection generation", "현재 query/sort/filter 요청 계열을 식별해 stale async 결과를 거르는 version입니다.", ["request ID와 연결합니다.", "render key와 다릅니다."]), c("normalized collection", "entity-by-ID와 ordered ID list를 분리한 state shape입니다.", ["identity를 중앙화합니다.", "duplicate merge를 통제합니다."]), c("rebase", "server의 최신 base 위에 아직 확정되지 않은 local operation을 다시 적용하는 복구입니다.", ["operation identity가 필요합니다.", "conflict 정책을 둡니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-comment-list", repository: "my-app01", path: "src/pages/step02-component/CommentList.jsx", usedFor: ["map rendering and index-key provenance"], evidence: "Read-only sanitized audit: 52 lines, 1,463 bytes, SHA-256 19DF8830E90D3935BCE8B0797170531EF93558FC36C8F00499F0AFF4F617533D; actual person/message strings were not copied." },
  { id: "local-comment", repository: "my-app01", path: "src/pages/step02-component/Comment.jsx", usedFor: ["stateful-looking child/rendered row structure"], evidence: "Read-only sanitized audit: 50 lines, 1,276 bytes, SHA-256 81F87641ABFC8F0C6EE117EB1129B1874C06D34C62C7D1303B8D1089947B0274; image/text literals were not copied." },
  { id: "local-filter", repository: "my-app01", path: "src/pages/step04-map/FilterCommandList.jsx", usedFor: ["filter-map and stable item-key provenance"], evidence: "Read-only sanitized audit: 46 lines, 1,176 bytes, SHA-256 4168ADC83D8C23A76CE248BBCCC10BFEEF75DA03FD31F1FDCD24C7C8376109DD." },
  { id: "local-find", repository: "my-app01", path: "src/pages/step04-map/FindCommandList.jsx", usedFor: ["find one-or-none and conditional result provenance"], evidence: "Read-only sanitized audit: 50 lines, 1,566 bytes, SHA-256 C204A6641D82C2A7880569CDFC55F4FAEA8600564CB8588121F58A7386957C0C." },
  { id: "local-reduce", repository: "my-app01", path: "src/pages/step04-map/ReduceCommandList.jsx", usedFor: ["explicit accumulator summary provenance"], evidence: "Read-only sanitized audit: 28 lines, 1,261 bytes, SHA-256 2D796C28CE25202E96C35D40BE8C25A359B82F1606876A0E95E392B1ADB6DD75." },
  { id: "local-some-every", repository: "my-app01", path: "src/pages/step04-map/SomeEveryCommandList.jsx", usedFor: ["some/every predicate provenance"], evidence: "Read-only sanitized audit: 18 lines, 953 bytes, SHA-256 1D11281A846E0CE4D1990719FD12D817E61595DB46096EFF0D75CDF3105C5D29." },
  { id: "archive-filter", repository: "REACT", path: "code/react/01-basics-my-app01/src/pages/step04-map/FilterCommandList.jsx", usedFor: ["archive byte-parity evidence"], evidence: "Read-only sanitized audit: 46 lines, 1,176 bytes, SHA-256 4168ADC83D8C23A76CE248BBCCC10BFEEF75DA03FD31F1FDCD24C7C8376109DD." },
  { id: "archive-find", repository: "REACT", path: "code/react/01-basics-my-app01/src/pages/step04-map/FindCommandList.jsx", usedFor: ["archive byte-parity evidence"], evidence: "Read-only sanitized audit: 50 lines, 1,566 bytes, SHA-256 C204A6641D82C2A7880569CDFC55F4FAEA8600564CB8588121F58A7386957C0C." },
  { id: "archive-reduce", repository: "REACT", path: "code/react/01-basics-my-app01/src/pages/step04-map/ReduceCommandList.jsx", usedFor: ["archive byte-parity evidence"], evidence: "Read-only sanitized audit: 28 lines, 1,261 bytes, SHA-256 2D796C28CE25202E96C35D40BE8C25A359B82F1606876A0E95E392B1ADB6DD75." },
  { id: "archive-some-every", repository: "REACT", path: "code/react/01-basics-my-app01/src/pages/step04-map/SomeEveryCommandList.jsx", usedFor: ["archive byte-parity evidence"], evidence: "Read-only sanitized audit: 18 lines, 953 bytes, SHA-256 1D11281A846E0CE4D1990719FD12D817E61595DB46096EFF0D75CDF3105C5D29." },
  { id: "react-rendering-lists", repository: "React", path: "learn/rendering-lists", publicUrl: "https://react.dev/learn/rendering-lists", usedFor: ["map/filter rendering and key rules"], evidence: "React 공식 list rendering guidance입니다." },
  { id: "react-preserving-state", repository: "React", path: "learn/preserving-and-resetting-state", publicUrl: "https://react.dev/learn/preserving-and-resetting-state", usedFor: ["tree position, key and state preservation"], evidence: "React 공식 state identity guidance입니다." },
  { id: "react-special-props", repository: "React", path: "warnings/special-props", publicUrl: "https://react.dev/warnings/special-props", usedFor: ["key not forwarded as a normal prop"], evidence: "React 공식 special props warning입니다." },
  { id: "react-updating-arrays", repository: "React", path: "learn/updating-arrays-in-state", publicUrl: "https://react.dev/learn/updating-arrays-in-state", usedFor: ["immutable list transitions"], evidence: "React 공식 array state update guidance입니다." },
  { id: "react-profiler", repository: "React", path: "reference/react/Profiler", publicUrl: "https://react.dev/reference/react/Profiler", usedFor: ["render performance measurements"], evidence: "React 공식 Profiler API입니다." },
  { id: "react-children", repository: "React", path: "reference/react/Children", publicUrl: "https://react.dev/reference/react/Children", usedFor: ["children traversal and dynamic list caveats"], evidence: "React 공식 Children API입니다." },
  { id: "react-dom-common", repository: "React DOM", path: "reference/react-dom/components/common", publicUrl: "https://react.dev/reference/react-dom/components/common", usedFor: ["common DOM props and raw HTML sink"], evidence: "React DOM 공식 common components reference입니다." },
  { id: "ecma-map", repository: "ECMA-262", path: "Array.prototype.map", publicUrl: "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.map", usedFor: ["map callback and result semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "ecma-filter", repository: "ECMA-262", path: "Array.prototype.filter", publicUrl: "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.filter", usedFor: ["filter result semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "ecma-find", repository: "ECMA-262", path: "Array.prototype.find", publicUrl: "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.find", usedFor: ["find first/undefined semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "ecma-reduce", repository: "ECMA-262", path: "Array.prototype.reduce", publicUrl: "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.reduce", usedFor: ["reduce accumulator semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "ecma-some", repository: "ECMA-262", path: "Array.prototype.some", publicUrl: "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.some", usedFor: ["some short-circuit and empty semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "ecma-every", repository: "ECMA-262", path: "Array.prototype.every", publicUrl: "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.every", usedFor: ["every short-circuit and empty semantics"], evidence: "TC39 공식 ECMAScript specification입니다." },
  { id: "wcag-focus-order", repository: "W3C WAI", path: "Understanding Focus Order", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html", usedFor: ["logical focus order during list changes"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
  { id: "aria-feed-pattern", repository: "W3C WAI-ARIA APG", path: "Feed Pattern", publicUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/feed/", usedFor: ["dynamic feed semantics and keyboard considerations"], evidence: "W3C WAI-ARIA APG 공식 feed pattern입니다." },
];

const session = createExpertSession({
  inventoryId: "react-04-list-key-reconciliation", slug: "react-04-list-key-reconciliation", courseId: "react", moduleId: "react-rendering-components", order: 4,
  title: "목록 렌더링·key와 reconciliation", subtitle: "원본 map/filter/find/reduce/some/every를 stable identity·state/focus preservation·security·large-list budgets와 async collection 운영으로 확장합니다.", level: "중급", estimatedMinutes: 110,
  coreQuestion: "동적으로 변하는 collection을 어떤 identity와 pure transforms로 렌더링해야 reorder·filter·retry 뒤에도 올바른 component state, focus와 성능을 유지할까요?",
  summary: "my-app01 CommentList/Comment와 step04-map 네 파일, REACT archive의 동일 네 파일을 read-only·sanitized 감사했습니다. CommentList의 index key와 filter 예제의 item-owned key 차이, find one-or-none, reduce summary와 some/every predicate를 실제 구조로 보존하되 원본 인물·message strings는 복사하지 않습니다. list key/sibling scope, reconciliation과 state/effect lifetime, duplicate/index/generated keys, transform empty semantics, immutable reorder, focus/accessibility, untrusted content/authorization, large-list performance와 async page/rebase 운영까지 current official specifications로 확장합니다. 다섯 Node examples는 source inventory, stable/index reorder, transform shapes, focus recovery와 window/security budget을 exact stdout으로 실행합니다.",
  objectives: ["원본 list sources와 archive parity를 안전하게 감사한다.", "map output에 stable sibling-local key를 부여한다.", "reconciliation과 component state/effect lifetime을 설명한다.", "duplicate/index/generated key failures를 차단한다.", "filter/map/find/reduce/some/every의 result/empty semantics를 선택한다.", "insert/delete/reorder를 immutable transitions로 만든다.", "list 변화 뒤 focus·reading order·status를 보존한다.", "untrusted content와 authorization boundary를 분리한다.", "large list의 transform/render/DOM budget을 측정한다.", "async pages와 optimistic reorder를 generation/rebase로 운영한다."],
  prerequisites: [{ title: "props와 단방향 데이터 흐름", reason: "item data와 callback authority의 owner를 알아야 list item identity와 reorder transition이 어느 state를 보존해야 하는지 판단할 수 있습니다.", sessionSlug: "react-03-props-one-way-data" }],
  keywords: ["list rendering", "key", "reconciliation", "map", "filter", "find", "reduce", "some", "every", "immutable array", "focus", "windowing"],
  topics,
  lab: {
    title: "index-key CommentList를 reorder-safe accessible collection으로 재설계하기",
    scenario: "원본 sample values를 사용하지 않는 disposable React fixture에서 filter/sort/prepend/delete와 per-row draft/focus를 재현하고 stable key·query/render budgets를 적용합니다.",
    setup: ["원본 10 files read-only와 hashes", "synthetic non-PII records with durable IDs", "React development fixture and component test DOM", "Profiler/statement-free render counter", "keyboard and accessibility inspection"],
    steps: ["원본 key/transform/empty behavior와 archive hash parity를 기록합니다.", "synthetic record schema에서 required durable key와 duplicate/missing guard를 만듭니다.", "index/stable/random key variants로 swap/prepend/filter/delete를 실행합니다.", "row별 editable draft와 effect subscription이 key를 따라가는지 확인합니다.", "filter/map/find/reduce/some/every empty/one/many matrix를 실행합니다.", "in-place sort를 immutable action reducer와 key-anchor reorder로 교체합니다.", "focused row 삭제/reorder의 deterministic focus fallback과 status message를 구현합니다.", "markup-like text/unsafe URL/raw HTML/unauthorized payload negative tests를 실행합니다.", "1·100·10,000 items에서 transform/render/DOM/memory를 측정하고 window budget을 적용합니다.", "out-of-order page, duplicate retry와 optimistic reorder를 generation/rebase로 처리합니다.", "StrictMode/browser/accessibility/production build parity와 cleanup을 확인합니다.", "source hashes, key contract, test/Profiler artifacts와 rollback runbook을 제출합니다."],
    expectedResult: ["reorder/filter/insert/delete 뒤 row state와 focus가 같은 record identity를 따릅니다.", "duplicate/missing/generated keys가 CI에서 stable failure로 차단됩니다.", "transform empty/cardinality semantics와 list output이 일치합니다.", "unauthorized/raw unsafe content가 DOM과 diagnostics에 노출되지 않습니다.", "representative list가 render/DOM/accessibility budgets와 async merge invariant를 지킵니다."],
    cleanup: ["synthetic records, browser storage, test reports와 Profiler traces를 제거합니다.", "subscriptions, timers, observers와 workers를 종료합니다.", "feature flags, verbose render logs와 network fault handlers를 원복합니다.", "원본 10 files의 hash/status가 unchanged인지 확인합니다."],
    extensions: ["keyboard drag-and-drop와 live reordering announcements를 구현합니다.", "variable-height virtualization과 SSR hydration을 비교합니다.", "normalized cache와 offline operation rebase를 추가합니다.", "property-based key/reorder/action sequence tests를 구축합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Node examples를 실행하고 React component fixture의 expected evidence로 연결하세요.", requirements: ["stdout 완전 일치", "source/archive parity", "stable/index key reorder", "transform empty semantics", "duplicate/focus fallback", "window/security budget"], hints: ["Node matching model을 React reconciliation 구현 그 자체로 표현하지 마세요."], expectedOutcome: "key와 collection transforms를 identity·state·a11y·performance contract로 설명합니다.", solutionOutline: ["audit→identify→transform→reconcile→focus→measure 순서입니다."] },
    { difficulty: "응용", prompt: "원본 CommentList를 editable/filterable/reorderable production list로 확장하세요.", requirements: ["durable key schema", "immutable actions", "draft/focus preservation", "duplicate guards", "a11y status", "untrusted content boundary", "Profiler budgets", "async generation/rebase"], hints: ["index를 제거하는 것만으로 focus와 async merge가 자동 해결되지는 않습니다."], expectedOutcome: "동적 collection이 reorder·failure·retry에도 같은 identity와 user context를 유지합니다.", solutionOutline: ["normalize→guard→render→transition→verify→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 React collection rendering 표준을 작성하세요.", requirements: ["key ownership/collision", "transform semantics", "state/effect lifetime", "immutable reorder", "focus/a11y", "security/authorization", "performance/windowing", "async merge/release evidence"], hints: ["key를 linter rule 하나로 끝내지 말고 API schema와 incident recovery에 연결하세요."], expectedOutcome: "모든 list component가 correctness·accessibility·security·performance 근거로 review됩니다.", solutionOutline: ["inventory→identity→calculate→preserve→bound→recover 순서입니다."] },
  ],
  nextSessions: ["react-05-conditional-rendering"], sources,
  sourceCoverage: { filesRead: 10, filesUsed: 10, uncoveredNotes: ["CommentList.jsx 52 lines/1,463 bytes와 Comment.jsx 50 lines/1,276 bytes를 sanitized audit했고 actual person/message/image strings는 복사하지 않았습니다.", "my-app01 step04-map 네 파일의 SHA-256은 Filter 4168ADC83D8C23A76CE248BBCCC10BFEEF75DA03FD31F1FDCD24C7C8376109DD, Find C204A6641D82C2A7880569CDFC55F4FAEA8600564CB8588121F58A7386957C0C, Reduce 2D796C28CE25202E96C35D40BE8C25A359B82F1606876A0E95E392B1ADB6DD75, SomeEvery 1D11281A846E0CE4D1990719FD12D817E61595DB46096EFF0D75CDF3105C5D29이며 REACT archive copies와 각각 byte-identical합니다.", "CommentList의 position index key와 filter file의 item-owned key를 관찰했지만 원본에 reorder/state/focus test가 있다고 과장하지 않았습니다.", "원본 source에는 duplicate/generated key guards, async merge, accessibility, unsafe content와 large-list operational budgets가 충분하지 않아 official primary sources와 synthetic models로 보강했습니다.", "Node examples는 실제 React Fiber/reconciliation scheduler, DOM focus/accessibility tree와 browser performance를 대체하지 않습니다."] },
});

export default session;
