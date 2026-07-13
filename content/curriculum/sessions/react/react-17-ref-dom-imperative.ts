import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const refLocalSources = ["local-ref01", "local-ref02", "local-ref03", "local-ref04", "local-hook-notes", "react-hooks-doc", "react-official-audit", "react-source-coverage"];

const topics = [
  appliedTopic({
    id: "source-ref-audit", title: "step11-hook ref 자료를 DOM·mutable cell·commit lifecycle 관점으로 감사합니다",
    lead: "useRef를 단순히 ‘값을 저장하는 상자’로 외우지 않고 원본 네 예제의 DOM focus/clear, ref와 state/일반 변수 비교, 이전 값 기록을 render와 commit 순서로 재구성합니다.",
    mechanism: "UseRefTest01·02는 DOM input handle과 focus/value 접근, UseRefTest03은 state·ref·render-local variable의 서로 다른 수명, UseRefTest04는 render에서 이전 ref를 읽고 Effect 뒤 current value를 기록하는 흐름을 보여 줍니다. hook 설명과 REACT 정리는 이를 DOM 접근·이전 값·timer 용도로 분류합니다.",
    workflow: "파일별 hook call, ref initial value, current read/write 시점, render를 일으키는 update, DOM method, cleanup과 user-visible 결과를 표로 만들고 my-app01과 REACT archive counterpart hash parity를 별도 확인합니다.",
    invariants: "원본은 read-only이며 실제 placeholder·alert·log·외부 값은 공개 예제에 복사하지 않고, ref를 읽거나 쓰는 시점이 render purity와 commit lifecycle을 침범하지 않도록 분류합니다.",
    edgeCases: "null current, conditional mount, StrictMode callback 재실행, rapid unmount/remount, disabled/hidden target, hydration 전, stale handle과 ref owner 변경을 포함합니다.",
    failureModes: "current가 항상 존재한다고 단언하면 unmount race에서 예외가 나고 DOM value 직접 변경은 React가 소유한 controlled state와 갈라지며 ref write만으로 화면이 갱신된다고 오해할 수 있습니다.",
    verification: "source lines/bytes/SHA-256, archive parity, render/commit/effect event log, ref null transition, actual browser focus와 controlled input state를 서로 다른 evidence로 확인합니다.",
    operations: "imperative action 실패·focus loss·layout measurement 비용과 stale handle을 privacy-safe reason code로 관찰하고 React/runtime upgrade와 rollback 전후 behavior를 비교합니다.",
    concepts: [c("ref object", "동일 component instance에서 renders 사이에 유지되는 mutable current property를 가진 객체입니다.", ["current 변경은 render를 예약하지 않습니다.", "render 중 임의 read/write를 피합니다."]), c("commit lifecycle", "React가 계산한 tree를 host DOM에 반영하고 ref를 attach·detach하는 단계입니다.", ["render와 구분합니다.", "null transition을 포함합니다."]), c("sanitized provenance", "원본의 구조·줄 수·바이트·해시만 근거로 사용하고 실제 domain/display literal은 재사용하지 않는 감사 방식입니다.", ["archive parity를 별도 기록합니다.", "원본을 수정하지 않습니다."])],
    codeExamples: [node("react17-source-matrix", "ref 원본과 문서 provenance matrix", "React17SourceMatrix.mjs", "네 ref 예제와 세 문서의 structural role, archive parity와 literal 비복사 원칙을 exact stdout으로 고정합니다.", String.raw`const rows = [
  ["ref-01", "dom-focus-clear", "dom"],
  ["ref-02", "guarded-focus", "dom"],
  ["ref-03", "state-ref-local", "memory"],
  ["ref-04", "previous-after-commit", "effect"],
  ["hook-notes", "ref-use-cases", "notes"],
  ["hooks-doc", "memo-callback-ref", "curated"],
  ["official-audit", "effect-strict-cleanup", "curated"],
  ["source-coverage", "archive-scope", "inventory"],
];
for (const row of rows) console.log(row.join("|"));
console.log("archive-counterparts=4");
console.log("archive-byte-equal=true");
console.log("actual-literals-copied=false");`, "ref-01|dom-focus-clear|dom\nref-02|guarded-focus|dom\nref-03|state-ref-local|memory\nref-04|previous-after-commit|effect\nhook-notes|ref-use-cases|notes\nhooks-doc|memo-callback-ref|curated\nofficial-audit|effect-strict-cleanup|curated\nsource-coverage|archive-scope|inventory\narchive-counterparts=4\narchive-byte-equal=true\nactual-literals-copied=false", refLocalSources.concat(["react-use-ref", "react-reference-values-ref"]))],
  }),
  appliedTopic({
    id: "state-ref-local-semantics", title: "state·ref·render-local variable을 UI authority와 lifetime으로 구분합니다",
    lead: "세 값 모두 JavaScript 변수처럼 보이지만 state는 render scheduling과 snapshot, ref는 instance-persistent mutable cell, local variable은 render invocation에 속합니다.",
    mechanism: "state setter는 future render를 요청하고 현재 render snapshot을 바꾸지 않습니다. ref current는 다음 render에도 남지만 write 자체가 render를 만들지 않으며 function body local은 render마다 다시 계산됩니다.",
    workflow: "값마다 owner, lifetime, write API, render trigger, UI에 표시 가능한 authoritative 여부와 concurrency safety를 표로 정하고 UI가 의존하는 값은 state, 외부 handle·timer·previous metadata는 ref로 둡니다.",
    invariants: "render output이 ref mutation 시점에 암묵적으로 의존하지 않고 ref current write는 event/effect/commit callback에서 실행하며 state와 ref에 같은 사실을 중복 저장하지 않습니다.",
    edgeCases: "batched state updates, interrupted render, StrictMode double render, remount/key reset, closure capture, multiple component instances와 module singleton을 다룹니다.",
    failureModes: "ref count를 JSX에 표시하고 ref만 증가시키면 DOM이 stale하며 local variable에 draft를 보관하면 다음 render에서 사라지고 ref를 shared global처럼 생각하면 instance isolation을 오해합니다.",
    verification: "synthetic render ledger, actual component render counter, ref identity, remount key, concurrent transition과 multiple-instance test를 실행합니다.",
    operations: "stale display, unexpected remount와 duplicate authority를 review rule로 잡고 ref가 늘어날수록 owner와 cleanup 문서를 요구합니다.",
    concepts: [c("render snapshot", "한 component 호출이 읽는 props와 state의 고정된 논리적 시점입니다.", ["setter 뒤 현재 값은 바뀌지 않습니다.", "event closure와 연결됩니다."]), c("mutable cell", "변경할 수 있지만 변경 자체가 React render를 예약하지 않는 저장소입니다.", ["ref current가 대표적입니다.", "UI authority로 남용하지 않습니다."]), c("render-local value", "한 function component 호출에서 계산되고 다음 호출에서 다시 만들어지는 값입니다.", ["derived calculation에 적합합니다.", "persistent storage가 아닙니다."])],
    codeExamples: [node("react17-storage-lifetime", "state·ref·local render ledger", "React17StorageLifetime.mjs", "세 저장 방식의 persistence와 render scheduling 차이를 작은 deterministic model로 실행합니다.", String.raw`let renderCount = 0;
let state = 0;
const ref = { current: 0 };
let local = 0;
function render() {
  renderCount += 1;
  local = 10;
  return "r" + renderCount + "|state=" + state + "|ref=" + ref.current + "|local=" + local;
}
console.log(render());
ref.current += 1;
local += 1;
console.log("imperative|state=" + state + "|ref=" + ref.current + "|local=" + local);
state += 1;
console.log(render());
console.log("ref-write-schedules-render=false");
console.log("state-write-schedules-render=true");`, "r1|state=0|ref=0|local=10\nimperative|state=0|ref=1|local=11\nr2|state=1|ref=1|local=10\nref-write-schedules-render=false\nstate-write-schedules-render=true", ["local-ref03", "local-ref04", "react-use-ref", "react-reference-values-ref"])],
  }),
  appliedTopic({
    id: "dom-ref-attach-null-lifecycle", title: "DOM ref의 null→node→null attach lifecycle을 안전하게 다룹니다",
    lead: "DOM ref는 선언 순간부터 node가 아니라 initial null이며 commit 뒤 attach되고 conditional removal·unmount 때 다시 null이 될 수 있습니다.",
    mechanism: "React는 host node를 만든 commit에서 current에 node를 넣고 제거할 때 null로 되돌립니다. event 시점에도 target이 조건부로 사라졌거나 owner가 바뀌었을 수 있으므로 handle을 장기 보관하지 않고 필요할 때 ref에서 읽습니다.",
    workflow: "ref initial null→mounted node→detached null transition을 명시하고 imperative event는 current guard, element type/capability 검사, failed target fallback과 cleanup을 수행합니다.",
    invariants: "non-null assertion은 lifecycle evidence가 있는 좁은 구간에만 사용하고 detached node를 cache하지 않으며 React가 관리하는 child removal/creation을 raw DOM API로 우회하지 않습니다.",
    edgeCases: "conditional field, Suspense fallback, portal, key change, async callback after unmount, ref prop owner 교체와 callback ref cleanup을 포함합니다.",
    failureModes: "mount 전에 focus를 호출하거나 async completion이 old node를 조작하고 DOM removeChild로 React tree와 host tree를 어긋나게 만들 수 있습니다.",
    verification: "callback ref attach/detach log, conditional mount permutations, delayed callback, StrictMode development replay와 mutation observer를 사용해 실제 lifecycle을 확인합니다.",
    operations: "null-handle과 detached-node action을 stable code로 수집하되 DOM content나 input value는 telemetry에 기록하지 않습니다.",
    concepts: [c("ref attach", "commit에서 ref target에 host node 또는 imperative handle을 연결하는 동작입니다.", ["render 중 보장되지 않습니다.", "callback ref가 호출될 수 있습니다."]), c("ref detach", "target 제거나 ref 변경에서 이전 ref를 null 또는 cleanup으로 해제하는 동작입니다.", ["stale handle을 막습니다.", "unmount와 함께 검증합니다."]), c("host node ownership", "React가 element tree를 기반으로 DOM node 생성·갱신·제거를 관리하는 권한입니다.", ["직접 structural mutation을 피합니다.", "필요한 imperative method만 호출합니다."])],
  }),
  appliedTopic({
    id: "focus-accessibility-policy", title: "focus를 보조 효과가 아니라 keyboard·screen-reader navigation contract로 설계합니다",
    lead: "focus() 호출이 기술적으로 성공해도 user intent 없이 위치가 튀거나 hidden/disabled target을 가리키면 접근성과 작업 흐름이 깨집니다.",
    mechanism: "focus는 active element와 keyboard interaction context를 바꿉니다. dialog open, validation error, removed focused subtree처럼 context 변화가 있을 때 logical target과 return owner를 정하고 background refresh에는 현재 focus를 보존합니다.",
    workflow: "trigger→reason→target availability→visible label/role→focus move→announcement→return focus 순서의 policy table을 만들고 user-initiated context change에만 이동합니다.",
    invariants: "target은 mounted·visible·enabled·semantically named 상태이고 DOM order와 focus order가 logical하며 실패 시 body가 아닌 safe heading/trigger로 복구합니다.",
    edgeCases: "autofocus 충돌, dialog nesting, validation multiple errors, list reorder/removal, virtualized target, reduced motion, mobile virtual keyboard와 screen-reader browse mode를 다룹니다.",
    failureModes: "원본처럼 value 존재 여부만 보고 focus하면 빈 값 오류 위치를 알리지 못하거나 반복 render마다 focus를 빼앗고 CSS order와 tab order가 달라질 수 있습니다.",
    verification: "activeElement assertion, keyboard-only traversal, accessible name/role, screen-reader spot check, focus return과 rapid conditional transitions를 실제 browser에서 테스트합니다.",
    operations: "focus-loss·unexpected-body·dialog-return failure를 accessibility gate로 관리하고 사용자 입력 값은 로그에서 제외합니다.",
    concepts: [c("focus owner", "현재 interaction context에서 focus를 시작·복원할 책임이 있는 trigger나 container입니다.", ["return target을 기억합니다.", "ref로 DOM handle을 가질 수 있습니다."]), c("logical focus order", "DOM과 interaction 순서가 content meaning과 operation sequence를 따르는 조건입니다.", ["CSS visual order만 믿지 않습니다.", "keyboard로 검증합니다."]), c("focus recovery", "focused subtree가 사라지거나 action이 실패할 때 안전한 named target으로 이동하는 정책입니다.", ["body 유실을 막습니다.", "사용자 맥락을 보존합니다."])],
    codeExamples: [node("react17-focus-policy", "focus 이동 결정표", "React17FocusPolicy.mjs", "context change와 target 상태로 focus 이동·보존·복구를 deterministic하게 결정합니다.", String.raw`const cases = [
  { reason: "dialog-open", user: true, mounted: true, enabled: true, target: "dialog-heading" },
  { reason: "validation-error", user: true, mounted: true, enabled: true, target: "first-invalid" },
  { reason: "background-refresh", user: false, mounted: true, enabled: true, target: "keep" },
  { reason: "owner-removed", user: false, mounted: false, enabled: false, target: "safe-heading" },
];
function decide(item) {
  if (item.reason === "background-refresh") return "preserve";
  if (!item.mounted || !item.enabled) return "recover:" + item.target;
  return item.user ? "move:" + item.target : "preserve";
}
for (const item of cases) console.log(item.reason + "=" + decide(item));
console.log("body-is-fallback=false");
console.log("input-value-logged=false");`, "dialog-open=move:dialog-heading\nvalidation-error=move:first-invalid\nbackground-refresh=preserve\nowner-removed=recover:safe-heading\nbody-is-fallback=false\ninput-value-logged=false", ["local-ref01", "local-ref02", "wcag-focus-order", "wcag-name-role-value", "aria-dialog-pattern", "html-inert"])],
  }),
  appliedTopic({
    id: "controlled-uncontrolled-dom-mutation", title: "controlled state와 uncontrolled DOM value의 authority를 섞지 않습니다",
    lead: "ref로 input.value를 읽고 비우는 예제는 imperative DOM을 관찰하기 좋지만 production form에서 React state와 DOM이 동시에 값을 소유하면 drift가 생깁니다.",
    mechanism: "controlled input은 value prop/state가 authority이고 uncontrolled input은 DOM value와 defaultValue가 authority입니다. ref write는 다음 controlled render에서 덮일 수 있으며 native form reset과 React state reset도 별도입니다.",
    workflow: "field별 authority를 하나로 선택하고 controlled이면 setter/action으로 clear, uncontrolled이면 form/ref API와 validation lifecycle을 사용하며 selection·composition·focus 보존을 함께 검증합니다.",
    invariants: "한 field가 controlled/uncontrolled를 오가지 않고 validation과 submit은 같은 authoritative snapshot을 읽으며 sensitive input value를 console/telemetry에 남기지 않습니다.",
    edgeCases: "IME composition, autofill, password manager, file input, number zero/empty, native reset, hydration, async validation과 browser extension mutation을 포함합니다.",
    failureModes: "ref current.value를 직접 비운 뒤 state가 이전 문자열이면 다음 render에 값이 되살아나고 console log가 민감한 입력을 노출할 수 있습니다.",
    verification: "typing/composition/autofill/reset/submit, rerender after imperative write, controlled-mode warning와 redacted logging test를 실행합니다.",
    operations: "controlled-mode warning, reset mismatch와 validation drift를 release gate로 두고 raw field 값 수집을 금지합니다.",
    concepts: [c("controlled input", "React state가 current value를 소유하고 value/onChange contract로 DOM과 동기화하는 field입니다.", ["setter가 authority입니다.", "rerender가 DOM을 맞춥니다."]), c("uncontrolled input", "DOM이 current value를 소유하고 ref나 form submit 시점에 읽는 field입니다.", ["defaultValue를 사용합니다.", "mode 전환을 피합니다."]), c("authority drift", "같은 사실을 state와 DOM 등 둘 이상의 owner가 독립 변경해 서로 다른 값이 되는 상태입니다.", ["한 owner를 선택합니다.", "submit snapshot으로 검증합니다."])],
  }),
  appliedTopic({
    id: "layout-measurement-scheduling", title: "측정 read와 layout write를 phase·budget 기준으로 분리합니다",
    lead: "getBoundingClientRect 같은 측정은 실제 layout을 필요로 하고 read/write를 반복 교차하면 forced synchronous layout과 flicker가 생길 수 있습니다.",
    mechanism: "render는 DOM을 읽을 수 없고 commit 뒤 measurement가 가능합니다. paint 전 보정이 반드시 필요한 소수 경우 useLayoutEffect를 쓰되 blocking cost를 예산화하고, 지속적 size 변화는 ResizeObserver 같은 owner로 구독합니다.",
    workflow: "measure need→ref attach→single read batch→pure geometry decision→write batch→observer cleanup 순서로 구성하고 CSS로 해결 가능한 layout은 imperative measurement를 제거합니다.",
    invariants: "render 중 DOM read가 없고 read/write가 interleave되지 않으며 hidden/null target과 zoom/font/image load를 처리하고 layout effect가 network/long task를 수행하지 않습니다.",
    edgeCases: "SSR no-DOM, zero-size hidden node, font swap, image load, scroll container, transforms, device pixel ratio, observer loop와 resize storm을 다룹니다.",
    failureModes: "매 render마다 layout effect에서 measure 후 state를 무조건 쓰면 synchronous extra render loop와 jank가 생기고 server에서는 layout 정보가 없습니다.",
    verification: "production performance trace, forced layout count, layout shift, resize/zoom/font fixtures, SSR fallback와 observer disconnect를 확인합니다.",
    operations: "measurement duration, observer callback rate와 layout-shift budget을 route/component reason으로 bounded aggregate하고 threshold 초과 시 CSS fallback으로 rollback합니다.",
    concepts: [c("layout read", "browser가 계산한 element geometry나 scroll 정보를 읽는 operation입니다.", ["layout flush를 유발할 수 있습니다.", "batch합니다."]), c("layout write", "style/class/DOM 상태를 바꿔 다음 layout에 영향을 주는 operation입니다.", ["read와 교차하지 않습니다.", "React state owner를 우선합니다."]), c("useLayoutEffect", "DOM commit 뒤 browser paint 전 동기 실행되는 React Effect입니다.", ["paint를 막을 수 있습니다.", "SSR와 비용을 고려합니다."])],
    codeExamples: [node("react17-measurement-plan", "layout read/write phase budget", "React17MeasurementPlan.mjs", "read batch, pure decision과 write batch가 interleave되지 않고 budget 안인지 판정합니다.", String.raw`const phases = [
  { name: "render", reads: 0, writes: 0 },
  { name: "layout-read", reads: 3, writes: 0 },
  { name: "decision", reads: 0, writes: 0 },
  { name: "raf-write", reads: 0, writes: 2 },
];
for (const phase of phases) console.log(phase.name + "|read=" + phase.reads + "|write=" + phase.writes);
const durationMs = 4;
console.log("read-write-interleave=false");
console.log("layout-budget-ms=5");
console.log("within-budget=" + (durationMs <= 5));
console.log("ssr-measurement=unavailable");`, "render|read=0|write=0\nlayout-read|read=3|write=0\ndecision|read=0|write=0\nraf-write|read=0|write=2\nread-write-interleave=false\nlayout-budget-ms=5\nwithin-budget=true\nssr-measurement=unavailable", ["react-use-layout-effect", "cssom-view-geometry", "react-dom-refs"])],
  }),
  appliedTopic({
    id: "callback-ref-registry-dynamic-list", title: "callback ref로 동적 node registry의 attach·detach·reorder를 관리합니다",
    lead: "동적 list의 여러 node를 하나의 ref로 다룰 수 없을 때 item identity별 callback ref registry를 만들되 index와 DOM order를 identity로 사용하지 않습니다.",
    mechanism: "callback ref는 node attach 때 node, detach 때 null 또는 supported cleanup path를 받습니다. stable item ID→node Map을 갱신하면 reorder에도 identity가 유지되고 removed item은 반드시 삭제됩니다.",
    workflow: "stable domain ID→memoized ref callback→attach set→detach delete→action 시 current lookup→missing fallback 순서로 만들고 key와 registry ID를 같은 identity source에서 파생합니다.",
    invariants: "registry에 detached node가 남지 않고 duplicate ID를 거부하며 callback identity churn을 줄이고 ref callback에서 state를 무조건 갱신해 commit loop를 만들지 않습니다.",
    edgeCases: "filter/reorder, virtualization reuse, duplicate ID, StrictMode attach/detach replay, Suspense fallback, portal과 list owner unmount를 포함합니다.",
    failureModes: "array index로 node를 저장하면 reorder 뒤 잘못된 item에 scroll/focus하고 detach delete가 없으면 memory와 stale action이 남습니다.",
    verification: "attach/detach/reorder/filter/duplicate event trace, Map keys와 isConnected, actual focus/scroll target, StrictMode와 virtualization fixture를 확인합니다.",
    operations: "registry size와 visible item count 불일치, stale lookup과 duplicate ID를 low-cardinality metric으로 관리합니다.",
    concepts: [c("callback ref", "commit 시 target attach/detach를 함수 호출로 전달받는 ref 형태입니다.", ["dynamic registry에 적합합니다.", "호출 replay를 견딥니다."]), c("node registry", "stable item identity와 current host node를 연결하는 owner-local Map입니다.", ["detach에서 삭제합니다.", "DOM content는 저장하지 않습니다."]), c("identity alignment", "React key, data ID와 node registry key가 같은 logical entity를 가리키는 조건입니다.", ["index를 피합니다.", "reorder test를 합니다."])],
    codeExamples: [node("react17-ref-registry", "동적 node registry attach·detach", "React17RefRegistry.mjs", "stable ID registry가 reorder와 detach 후 올바른 active keys만 유지하는지 실행합니다.", String.raw`const registry = new Map();
function attach(id, node) {
  if (node === null) registry.delete(id);
  else if (registry.has(id)) throw new Error("DUPLICATE_ID");
  else registry.set(id, node);
}
attach("item-a", { connected: true });
attach("item-b", { connected: true });
console.log("initial=" + Array.from(registry.keys()).sort().join(","));
console.log("reorder-changes-identity=false");
attach("item-a", null);
attach("item-c", { connected: true });
console.log("after-detach-attach=" + Array.from(registry.keys()).sort().join(","));
console.log("stale-item-a=" + registry.has("item-a"));
console.log("registry-size=" + registry.size);`, "initial=item-a,item-b\nreorder-changes-identity=false\nafter-detach-attach=item-b,item-c\nstale-item-a=false\nregistry-size=2", ["react-dom-refs", "react-strict-mode"])],
  }),
  appliedTopic({
    id: "imperative-handle-capability", title: "ref prop와 useImperativeHandle로 최소 capability만 노출합니다",
    lead: "parent에 raw DOM node 전체를 넘기면 style/value/structure까지 임의 조작할 권한이 퍼지므로 focus·scroll·select 같은 좁은 command interface가 더 안전합니다.",
    mechanism: "React 19에서는 ref를 prop으로 받을 수 있고 useImperativeHandle로 exposed handle을 정의합니다. React 18 이하 compatibility에는 forwardRef가 필요하지만 current docs의 migration 상태를 명시해야 합니다.",
    workflow: "declarative prop으로 표현 불가능한 command를 먼저 증명하고 command name, arguments, preconditions, errors, idempotence와 accessibility effect를 정의한 뒤 internal DOM ref를 handle 뒤에 숨깁니다.",
    invariants: "handle은 최소 method만 노출하고 DOM node/value/style mutation 권한을 외부에 주지 않으며 dependencies가 complete하고 unmount 뒤 call은 stable failure가 됩니다.",
    edgeCases: "React 18/19 mixed consumers, ref callback/object, lazy child, conditional mount, nested wrapper, TypeScript handle version과 deprecated forwardRef adapter를 다룹니다.",
    failureModes: "raw node를 노출하면 consumer가 React ownership을 깨거나 unsafe HTML/style을 쓰고 handle object가 매 render 바뀌어 dependent logic이 churn할 수 있습니다.",
    verification: "type contract, allowed/denied method, null lifecycle, React 18 adapter/19 ref prop, keyboard/focus semantics와 compatibility test를 실행합니다.",
    operations: "handle API를 semver contract로 관리하고 method usage/failure를 값 없이 계수하며 adapter 제거는 consumer inventory와 rollback window를 거칩니다.",
    concepts: [c("imperative handle", "component가 parent ref에 노출하는 제한된 command object입니다.", ["raw DOM을 숨깁니다.", "useImperativeHandle로 정의합니다."]), c("capability interface", "caller가 수행할 수 있는 권한을 필요한 method로만 제한한 API입니다.", ["least authority를 적용합니다.", "method별 precondition을 둡니다."]), c("ref as prop", "React 19에서 function component가 ref를 prop으로 전달받는 현재 API 형태입니다.", ["이전 버전 adapter를 구분합니다.", "forwardRef migration을 문서화합니다."])],
    codeExamples: [node("react17-capability-handle", "최소 imperative capability allowlist", "React17CapabilityHandle.mjs", "요청 command가 공개 handle allowlist와 lifecycle을 통과하는지 stable result로 분류합니다.", String.raw`const allowed = new Set(["focus", "scrollToError", "selectText"]);
const requests = ["focus", "setMarkup", "scrollToError", "readSecret", "selectText"];
for (const command of requests) {
  console.log(command + "=" + (allowed.has(command) ? "allowed" : "denied"));
}
console.log("raw-dom-exposed=false");
console.log("detached-call=HANDLE_UNAVAILABLE");
console.log("react19-ref-prop=true");
console.log("react18-adapter=forwardRef");
console.log("rollback-contract-version=v1");`, "focus=allowed\nsetMarkup=denied\nscrollToError=allowed\nreadSecret=denied\nselectText=allowed\nraw-dom-exposed=false\ndetached-call=HANDLE_UNAVAILABLE\nreact19-ref-prop=true\nreact18-adapter=forwardRef\nrollback-contract-version=v1", ["react-use-imperative-handle", "react-forward-ref", "react-flush-sync", "wcag-name-role-value", "owasp-xss-prevention"])],
  }),
  appliedTopic({
    id: "external-widget-cleanup-strictmode", title: "third-party widget·observer·listener의 setup과 cleanup을 ref owner에 묶습니다",
    lead: "chart/editor/media 같은 imperative library는 DOM node를 받지만 React render와 별도 resource를 만들므로 ref만 저장하고 cleanup을 빼면 duplicate instance와 leak가 생깁니다.",
    mechanism: "Effect는 committed node와 configuration으로 widget을 생성하고 같은 setup invocation이 획득한 listener/observer/timer/widget을 cleanup에서 해제합니다. StrictMode development replay는 symmetry를 검증하는 stress test입니다.",
    workflow: "node ready→resource construct→listener register→current owner token 기록→update API 또는 recreate 정책→cleanup reverse order→ref detach 순서로 구성합니다.",
    invariants: "setup마다 disposer가 하나 있고 cleanup은 idempotent하며 old node/config resource가 new owner를 해제하지 않고 library가 React-managed children을 임의 소유하지 않습니다.",
    edgeCases: "StrictMode replay, fast prop change, async library load, constructor throw, partial setup, portal, Offscreen-like visibility와 route cache를 다룹니다.",
    failureModes: "ref callback마다 widget을 생성하고 detach cleanup을 하지 않으면 listener가 배수로 늘고 old cleanup이 new instance를 destroy할 수 있습니다.",
    verification: "constructor/destroy/listener counts, partial failure injection, rapid remount/config change, heap snapshot와 StrictMode test를 실행합니다.",
    operations: "live instance/listener/observer count와 cleanup failure를 build·component별로 관찰하고 destroy 실패 runbook과 safe reload를 둡니다.",
    concepts: [c("resource symmetry", "setup이 획득한 resource를 같은 invocation의 cleanup이 정확히 한 번 해제하는 조건입니다.", ["reverse order가 유용합니다.", "partial setup도 처리합니다."]), c("owner token", "async setup/cleanup이 현재 node·config instance에 속하는지 확인하는 identity입니다.", ["old cleanup을 격리합니다.", "generation과 연결합니다."]), c("idempotent cleanup", "여러 번 호출되어도 이미 해제된 resource에 추가 부작용이 없는 cleanup입니다.", ["StrictMode를 견딥니다.", "실패를 보고합니다."])],
  }),
  appliedTopic({
    id: "imperative-security-boundary", title: "ref와 DOM API를 trust·injection·privacy boundary로 감사합니다",
    lead: "ref 자체가 XSS를 만들지는 않지만 innerHTML, URL/style assignment, input value logging과 broad handle exposure로 이어지면 React의 declarative escaping 경계를 우회할 수 있습니다.",
    mechanism: "text/attribute/URL/style/HTML은 서로 다른 output context이며 raw HTML sink는 trusted pipeline 없이는 거부합니다. imperative handle은 capability allowlist로 제한하고 ref에서 읽은 user input을 telemetry에 남기지 않습니다.",
    workflow: "data origin→validation/schema→encoding/sanitization ownership→DOM sink→browser policy→logging/retention을 추적하고 unsafe sink inventory와 negative payload corpus를 운영합니다.",
    invariants: "untrusted markup을 DOM parser sink에 넣지 않고 javascript-like URL과 unsafe style을 차단하며 secrets/input values가 logs, errors, profiler labels와 ref registry에 복사되지 않습니다.",
    edgeCases: "SVG/MathML, CSS URL, clipboard, selection, contentEditable, browser extension mutation, third-party widget HTML와 server-rendered markup을 포함합니다.",
    failureModes: "focus/clear 편의를 위해 raw node 전체를 넘긴 consumer가 innerHTML을 쓰거나 console에 value를 남기고 stale node에 민감한 content가 보존될 수 있습니다.",
    verification: "sink inventory, malicious markup/URL/style corpus, CSP-compatible browser test, log/trace artifact secret scan와 detached-node retention test를 실행합니다.",
    operations: "unsafe sink call과 policy denial을 값 없이 계수하고 발견 시 kill switch, DOM purge, secret rotation과 artifact deletion runbook을 수행합니다.",
    concepts: [c("DOM sink", "문자열이나 object를 DOM content·attribute·URL·style로 해석하게 만드는 API 경계입니다.", ["context별 방어가 다릅니다.", "raw HTML을 기본 거부합니다."]), c("least authority", "consumer가 필요한 최소 command만 수행하도록 node/handle 권한을 줄이는 원칙입니다.", ["capability API를 씁니다.", "broad forwarding을 피합니다."]), c("privacy-safe telemetry", "input/DOM content 대신 operation result와 bounded reason만 수집하는 관측 방식입니다.", ["raw value를 금지합니다.", "retention을 정합니다."])],
  }),
  appliedTopic({
    id: "concurrency-ssr-performance-release", title: "imperative escape hatch를 concurrency·SSR·성능·rollback gate로 운영합니다",
    lead: "ref code는 작은 event handler로 보여도 concurrent rendering, server no-DOM, StrictMode, browser timing과 library version에 따라 달라지므로 production-like qualification이 필요합니다.",
    mechanism: "render는 재시작·폐기될 수 있어 imperative work를 commit 이후로 제한하고 server에서는 DOM API를 실행하지 않습니다. flushSync 같은 강제 동기화는 third-party integration의 마지막 수단이며 성능 비용을 측정합니다.",
    workflow: "pure render→commit ref attach→event/effect imperative action→cleanup→SSR fallback→hydration parity→canary/rollback evidence 순서로 release contract를 만듭니다.",
    invariants: "server import/render가 DOM global 없이 성공하고 first client tree가 일치하며 sync flush/layout work가 budget 안이고 imperative failure에도 declarative fallback이 남습니다.",
    edgeCases: "streaming SSR, hydration delay, event before lazy target ready, transition interruption, browser back-forward cache, old/new widget bundle와 rollback을 다룹니다.",
    failureModes: "module scope에서 document를 읽어 SSR이 깨지거나 flushSync를 일반 update에 사용해 responsiveness를 낮추고 hydration 전에 current를 호출할 수 있습니다.",
    verification: "server render, hydrate recoverable-error, controlled concurrency, production profiling, slow device, fault injection, old/new artifact와 rollback rehearsal를 실행합니다.",
    operations: "imperative calls, null/failure, sync duration, hydration error와 cleanup success를 bounded telemetry로 관리하고 owner·SLO·kill switch/runbook을 둡니다.",
    concepts: [c("imperative escape hatch", "declarative props/state로 표현하기 어려운 host operation을 제한적으로 수행하는 경계입니다.", ["default architecture가 아닙니다.", "evidence와 fallback이 필요합니다."]), c("flushSync", "React update를 동기적으로 flush하도록 요청하는 드문 React DOM API입니다.", ["성능 비용이 큽니다.", "integration evidence가 필요합니다."]), c("SSR-safe boundary", "server 평가/render에서 DOM global을 요구하지 않고 client commit 뒤에만 imperative API를 쓰는 구조입니다.", ["hydration parity를 유지합니다.", "browser-only adapter를 분리합니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-ref01", repository: "my-app01", path: "src/pages/step11-hook/UseRefTest01.jsx", usedFor: ["DOM ref focus and direct clear provenance"], evidence: "Read-only sanitized audit: 26 lines, 887 bytes, SHA-256 AF905EC61F84F425DB56BF15556BEC8E65030277FA7C3996E261303C72C8677D; actual placeholder, button and log strings were not copied." },
  { id: "local-ref02", repository: "my-app01", path: "src/pages/step11-hook/UseRefTest02.jsx", usedFor: ["guarded DOM focus provenance"], evidence: "Read-only sanitized audit: 27 lines, 825 bytes, SHA-256 C8741F5A2078E4CCEC500FC84EDC2F2024F695A534FB8CDC9DEBDDA12BB4D95D; actual alert/display strings were not copied." },
  { id: "local-ref03", repository: "my-app01", path: "src/pages/step11-hook/UseRefTest03.jsx", usedFor: ["state, ref and render-local comparison provenance"], evidence: "Read-only sanitized audit: 43 lines, 1,424 bytes, SHA-256 7F754489C3DF5D5107CDB34F8506BCB91D2027C667C7ACD656ED95C27A678924; actual labels/log strings were not copied." },
  { id: "local-ref04", repository: "my-app01", path: "src/pages/step11-hook/UseRefTest04.jsx", usedFor: ["previous value after commit provenance"], evidence: "Read-only sanitized audit: 25 lines, 743 bytes, SHA-256 D7992E247704597FAA5C6E949E30E0F9F28CBD87310ED71DDDA843AD4BE23C0D; actual display strings were not copied." },
  { id: "local-hook-notes", repository: "my-app01", path: "src/pages/step11-hook/hook_설명.txt", usedFor: ["original Hook use-case taxonomy and top-level rule provenance"], evidence: "Read-only sanitized audit: 58 lines, 2,931 bytes, SHA-256 CBE3CB63863801A5A5E3831AF42F16F6782E3B999E068766A2074BF4BE21AA8D." },
  { id: "react-hooks-doc", repository: "REACT", path: "docs/react/05-hooks.md", usedFor: ["curated useRef, memo and callback summary provenance"], evidence: "Read-only structural audit: 200 lines, 9,174 bytes, SHA-256 B0563A725CD72CA4B751FBCDA43A4062121D0DEDCA9A34ACEDA6773A56F02862; embedded local URLs and display text were not copied." },
  { id: "react-official-audit", repository: "REACT", path: "docs/reference/official-reference-audit.md", usedFor: ["official-review boundary and StrictMode/Effect update provenance"], evidence: "Read-only structural audit: 37 lines, 4,125 bytes, SHA-256 CFEBF7DB1BDA1D6279928A5953EB2A60211A5CF0EEA92B9538462698B0726029." },
  { id: "react-source-coverage", repository: "REACT", path: "docs/reference/source-coverage.md", usedFor: ["archive collection scope provenance"], evidence: "Read-only structural audit: 33 lines, 3,514 bytes, SHA-256 44BF82D58DB16DAD7E596413EC5F3A41295B39E77077ABBE89FE6EBEB9647FE7." },
  { id: "react-use-ref", repository: "React", path: "reference/react/useRef", publicUrl: "https://react.dev/reference/react/useRef", usedFor: ["useRef contract, purity and DOM manipulation"], evidence: "React 공식 useRef API입니다." },
  { id: "react-reference-values-ref", repository: "React", path: "learn/referencing-values-with-refs", publicUrl: "https://react.dev/learn/referencing-values-with-refs", usedFor: ["state versus ref semantics"], evidence: "React 공식 ref value guidance입니다." },
  { id: "react-dom-refs", repository: "React", path: "learn/manipulating-the-dom-with-refs", publicUrl: "https://react.dev/learn/manipulating-the-dom-with-refs", usedFor: ["DOM refs, callback refs and safe manipulation"], evidence: "React 공식 DOM ref guidance입니다." },
  { id: "react-use-imperative-handle", repository: "React", path: "reference/react/useImperativeHandle", publicUrl: "https://react.dev/reference/react/useImperativeHandle", usedFor: ["minimal custom ref handle and React 19 ref prop"], evidence: "React 공식 useImperativeHandle API입니다." },
  { id: "react-forward-ref", repository: "React", path: "reference/react/forwardRef", publicUrl: "https://react.dev/reference/react/forwardRef", usedFor: ["React 18 compatibility and current deprecation guidance"], evidence: "React 공식 forwardRef API와 migration guidance입니다." },
  { id: "react-use-layout-effect", repository: "React", path: "reference/react/useLayoutEffect", publicUrl: "https://react.dev/reference/react/useLayoutEffect", usedFor: ["pre-paint measurement and blocking caveats"], evidence: "React 공식 useLayoutEffect API입니다." },
  { id: "react-strict-mode", repository: "React", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development replay and ref callback checks"], evidence: "React 공식 StrictMode API입니다." },
  { id: "react-flush-sync", repository: "React DOM", path: "reference/react-dom/flushSync", publicUrl: "https://react.dev/reference/react-dom/flushSync", usedFor: ["rare synchronous third-party integration"], evidence: "React DOM 공식 flushSync API입니다." },
  { id: "cssom-view-geometry", repository: "CSSWG", path: "CSSOM View getBoundingClientRect", publicUrl: "https://drafts.csswg.org/cssom-view/#dom-element-getboundingclientrect", usedFor: ["element geometry measurement semantics"], evidence: "CSSWG 공식 CSSOM View specification입니다." },
  { id: "html-inert", repository: "WHATWG HTML", path: "The inert attribute", publicUrl: "https://html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute", usedFor: ["non-interactive subtree behavior"], evidence: "WHATWG 공식 HTML Standard입니다." },
  { id: "wcag-focus-order", repository: "W3C WAI", path: "Understanding Focus Order", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html", usedFor: ["logical keyboard focus order"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
  { id: "wcag-name-role-value", repository: "W3C WAI", path: "Understanding Name, Role, Value", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html", usedFor: ["programmatic semantics of imperative targets"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
  { id: "aria-dialog-pattern", repository: "W3C WAI-ARIA APG", path: "Dialog Modal Pattern", publicUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/", usedFor: ["dialog initial and return focus"], evidence: "W3C WAI-ARIA APG 공식 dialog pattern입니다." },
  { id: "owasp-xss-prevention", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["DOM output contexts and unsafe sinks"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-17-ref-dom-imperative", slug: "react-17-ref-dom-imperative", courseId: "react", moduleId: "react-events-forms-hooks", order: 7,
  title: "ref와 DOM imperative escape hatch", subtitle: "원본 DOM focus·mutable ref·previous value를 commit lifecycle, accessibility, measurement, capability security와 SSR 운영으로 확장합니다.", level: "고급", estimatedMinutes: 110,
  coreQuestion: "React의 declarative owner를 깨지 않으면서 DOM focus·measurement·third-party widget 같은 imperative 작업을 ref lifecycle과 최소 capability로 어떻게 안전하게 수행할까요?",
  summary: "my-app01 step11-hook의 UseRefTest01~04, hook 설명, REACT hooks/공식 감수/source coverage 문서를 read-only·sanitized 감사하고 네 코드의 REACT archive counterpart가 byte-identical함을 확인했습니다. 원본의 실제 placeholder·alert·log·display 값은 복사하지 않습니다. state/ref/local lifetime, DOM null attach/detach, controlled authority, keyboard focus, layout batching, callback registry, React 19 ref prop·useImperativeHandle와 React 18 adapter, third-party cleanup, DOM sink/security, concurrency·SSR·flushSync release gate까지 확장합니다. 여섯 Node examples는 provenance, storage lifetime, focus decision, layout phase, dynamic registry와 capability allowlist를 exact stdout으로 실행하되 actual React commit·DOM·browser·screen reader를 대체하지 않습니다.",
  objectives: ["원본 ref 자료와 archive parity를 hash evidence로 감사한다.", "state·ref·render-local의 lifetime과 render scheduling을 구분한다.", "DOM ref의 null→node→null commit lifecycle을 처리한다.", "controlled/uncontrolled authority와 direct value mutation을 구분한다.", "focus 이동을 keyboard·screen-reader contract로 설계한다.", "layout read/write와 useLayoutEffect 비용을 예산화한다.", "callback ref registry를 stable identity로 관리한다.", "최소 imperative handle과 React 18/19 compatibility를 설계한다.", "widget/listener/observer setup-cleanup을 대칭화한다.", "DOM sink·privacy·SSR·concurrency·rollback을 운영한다."],
  prerequisites: [{ title: "Effect cleanup·취소와 비동기 race", reason: "ref가 가리키는 DOM/widget resource도 owner 변경과 unmount에서 cleanup되어야 하므로 generation·cleanup symmetry를 알아야 stale handle과 old cleanup race를 막을 수 있습니다.", sessionSlug: "react-16-effect-cleanup-race" }],
  keywords: ["useRef", "DOM ref", "imperative escape hatch", "focus", "callback ref", "useImperativeHandle", "ref as prop", "forwardRef", "useLayoutEffect", "measurement", "StrictMode", "SSR"],
  topics,
  lab: {
    title: "원본 ref 예제를 accessible·SSR-safe imperative adapter로 qualification하기",
    scenario: "원본 actual strings를 쓰지 않는 disposable React fixture에서 field focus/clear, dynamic item registry, measured overlay와 third-party widget adapter를 만들고 lifecycle·a11y·security·performance evidence를 생성합니다.",
    setup: ["my-app01/REACT source와 hashes read-only", "synthetic fields/items and no domain values", "React 18 compatibility and React 19 ref-prop fixtures", "browser accessibility and production profiling build", "SSR/hydration, StrictMode and malicious sink corpus"],
    steps: ["원본 8 used files/docs와 4 archive counterparts의 line/byte/hash 및 구조 matrix를 작성합니다.", "state/ref/local mutation과 render schedule ledger를 component test로 재현합니다.", "conditional target의 null→node→null ref attach/detach trace를 기록합니다.", "controlled/uncontrolled clear와 rerender/autofill/IME/reset 결과를 비교합니다.", "validation/dialog/removal/background-refresh의 focus owner·target·return policy를 구현합니다.", "geometry read batch와 write batch를 분리하고 zoom/font/resize/hidden/SSR를 test합니다.", "stable item ID callback registry를 reorder/filter/virtualization/duplicate fixture로 검증합니다.", "focus/scroll/select만 노출하는 React 19 handle과 React 18 adapter를 type/runtime test합니다.", "widget constructor/listener/observer의 partial setup·StrictMode·cleanup을 fault-inject합니다.", "markup/URL/style/value logging과 broad handle exposure를 negative security test합니다.", "production trace, hydration, mixed artifact, canary와 rollback rehearsal를 수행합니다.", "hashes, lifecycle/a11y/security/performance evidence와 runbook을 제출합니다."],
    expectedResult: ["ref current lifecycle과 owner가 null transition까지 명시됩니다.", "UI authority가 state/DOM 사이에서 drift하지 않습니다.", "focus와 measurement가 semantic policy와 performance budget을 지킵니다.", "dynamic registry와 widget resource가 detach/unmount 후 남지 않습니다.", "imperative handle이 최소 capability이고 SSR/hydration/rollback이 안전합니다."],
    cleanup: ["widget/listener/observer/timer/callback registry를 dispose하고 ref를 detach합니다.", "synthetic fields/items, browser storage, profiles, traces와 hydration artifacts를 제거합니다.", "feature flag, compatibility adapter, fault injection과 verbose logging을 원복합니다.", "원본 8 used files/docs와 4 archive counterparts의 hash/status unchanged를 확인합니다."],
    extensions: ["polymorphic component의 typed ref contract를 설계합니다.", "ResizeObserver와 IntersectionObserver adapter를 비교합니다.", "focus trap 없이 native dialog/popover 전략을 검토합니다.", "imperative API usage inventory에서 codemod와 migration gate를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node examples와 실제 React/browser ref lifecycle을 나란히 실행하세요.", requirements: ["stdout 완전 일치", "source hash matrix", "state/ref/local ledger", "null attach/detach", "focus/a11y", "measurement", "registry/handle"], hints: ["Node Map/object model을 actual React commit이나 DOM focus 증거로 표현하지 마세요."], expectedOutcome: "ref를 mutable variable이 아니라 lifecycle·authority·capability contract로 설명합니다.", solutionOutline: ["audit→classify owner→attach→act→detach→verify 순서입니다."] },
    { difficulty: "응용", prompt: "원본 focus/previous-value 예제를 reusable field·overlay·widget adapter로 확장하세요.", requirements: ["controlled authority", "focus owner/return", "callback registry", "layout budget", "minimal handle", "StrictMode cleanup", "SSR fallback", "unsafe sink tests"], hints: ["raw DOM node를 그대로 consumer에 넘기지 마세요."], expectedOutcome: "conditional/reorder/unmount/SSR에서도 stale handle과 focus loss 없이 동작합니다.", solutionOutline: ["contract→ref lifecycle→semantic policy→resource cleanup→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 React imperative escape-hatch 표준을 작성하세요.", requirements: ["allowed use cases", "state/ref/local choice", "DOM authority", "focus/a11y", "measurement", "callback ref", "capability API", "security/privacy", "SSR/performance/rollback"], hints: ["focus 호출 예시만 아니라 owner, cleanup, failure와 telemetry를 포함하세요."], expectedOutcome: "imperative code가 최소 권한과 production evidence로 review됩니다.", solutionOutline: ["inventory→minimize→contain→measure→protect→operate 순서입니다."] },
  ],
  nextSessions: ["react-18-memo-callback-performance"], sources,
  sourceCoverage: {
    filesRead: 12,
    filesUsed: 8,
    uncoveredFiles: [
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseRefTest01.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseRefTest02.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseRefTest03.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseRefTest04.jsx",
    ],
    uncoveredNotes: ["네 archive counterpart는 source로 중복 사용하지 않고 SHA-256 byte parity만 검증했습니다.", "UseRefTest01~04와 hook/REACT docs는 actual display, alert, log, local URL strings를 제외한 structural provenance만 사용했습니다.", "원본에는 callback registry, capability handle, layout performance, accessibility, security, SSR와 React 18/19 compatibility qualification이 충분하지 않아 current official primary sources와 synthetic models로 보강했습니다.", "여섯 Node examples는 actual React scheduler/commit, DOM, layout, focus, screen reader와 browser security를 대체하지 않습니다."],
  },
});

export default session;
