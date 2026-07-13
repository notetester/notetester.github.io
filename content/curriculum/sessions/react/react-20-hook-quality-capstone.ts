import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-hook-useid-audit", title: "Hook·useId 원본을 호출 규칙과 DOM 관계로 감사합니다",
    lead: "세 useId 예제와 두 Hook 문서를 읽어 Hook 호출 위치, generated ID의 소비처, label-input 대응과 ref validation 책임을 실제 JSX 기준으로 확인합니다.",
    mechanism: "UseIdTest01은 한 id를 둘 이상의 input에 재사용하고 UseIdTest03은 htmlFor를 만들지만 input id를 누락합니다. UseIdTest02는 한 opaque base에서 suffix를 파생해 두 label-input pair를 고유하게 연결합니다.",
    workflow: "Hook call order, returned value owner, every id definition/reference, accessible relationship과 validation/focus path를 표로 만들고 원본 설명·실제 DOM·공식 contract를 분리합니다.",
    invariants: "원본은 read-only이고 실제 사용자 값·로컬 URL·도메인 문자열을 복제하지 않으며 useId가 list key, database id, security token 또는 random secret이라고 주장하지 않습니다.",
    edgeCases: "component 두 번 mount, duplicate suffix, missing target, conditional Hook, server/client tree mismatch, multiple roots, invalid form, hidden description과 unmount를 포함합니다.",
    failureModes: "ID 문자열이 생성됐다는 사실만 확인하면 duplicate id와 끊어진 htmlFor를 놓치고 label click/focus·accessible name이 실제로 작동하지 않습니다.",
    verification: "다섯 원본의 hash·lines·bytes, ID graph audit, duplicate/missing target test, label click, accessibility tree와 hydration fixture를 실행합니다.",
    operations: "broken relationship, hydration mismatch와 Hook lint code만 낮은 cardinality로 기록하고 generated ID·input value·사용자 이름을 telemetry에 남기지 않습니다.",
    concepts: [
      c("ID relationship graph", "DOM id를 정의하는 element와 htmlFor·aria-describedby 등 참조 attributes를 edge로 연결한 검증 graph입니다.", ["문자열 존재보다 관계를 검사합니다.", "중복과 dangling reference를 찾습니다."]),
      c("Hook call topology", "component/custom Hook render에서 Hooks가 같은 순서로 호출되는 구조입니다.", ["조건·반복에 의존하지 않습니다.", "lint와 runtime 연결의 기반입니다."]),
      c("structural provenance", "실제 domain 값을 옮기지 않고 Hook/JSX/relationship 구조와 결함만 학습 근거로 사용하는 방식입니다.", ["원본을 변경하지 않습니다.", "보강 내용을 원본 구현으로 오인하지 않습니다."]),
    ],
    codeExamples: [node("react20-source-audit", "useId 원본 relationship 위험 분류", "React20SourceAudit.mjs", "세 예제의 ID 정의·참조 구조를 synthetic metadata로 재현해 duplicate와 dangling target을 분류합니다.", String.raw`function audit(fields) {
  const ids = fields.map((field) => field.inputId).filter(Boolean);
  const duplicate = new Set(ids).size !== ids.length;
  const dangling = fields.some((field) => field.labelFor && !ids.includes(field.labelFor));
  return duplicate ? "duplicate-id" : dangling ? "dangling-label" : "ok";
}
console.log("sample-1=" + audit([{ inputId: "base", labelFor: "base" }, { inputId: "base", labelFor: null }]));
console.log("sample-2=" + audit([{ inputId: "base-first", labelFor: "base-first" }, { inputId: "base-second", labelFor: "base-second" }]));
console.log("sample-3=" + audit([{ inputId: null, labelFor: "name" }, { inputId: null, labelFor: "age" }]));`, "sample-1=duplicate-id\nsample-2=ok\nsample-3=dangling-label", ["local-useid-01", "local-useid-02", "local-useid-03", "local-hook-notes", "local-hooks-guide"])]
  }),
  appliedTopic({
    id: "rules-hooks-static-enforcement", title: "Rules of Hooks를 이름 규칙이 아니라 호출 순서 불변식으로 강제합니다",
    lead: "use로 시작하면 무조건 Hook이라는 암기에서 벗어나 component 또는 custom Hook의 top-level에서만 React Hooks를 호출하고 일반 helper와 Hook API를 명확히 나눕니다.",
    mechanism: "React는 render마다 Hook 호출 순서로 stateful slots를 대응시키므로 condition, loop, early return 뒤, callback이나 ordinary function에서 호출하면 순서가 달라질 수 있습니다.",
    workflow: "Hook call graph를 component/custom Hook entry부터 추적하고 rules-of-hooks, component-hook-factories와 관련 lint를 CI error로 두며 suppression에는 좁은 근거와 expiry를 요구합니다.",
    invariants: "모든 render path가 같은 Hook sequence를 가지며 Hook은 React function component 또는 custom Hook에서만 호출되고 custom Hook 이름은 use로 시작해 lint와 독자에게 contract를 알립니다.",
    edgeCases: "early return, try/catch/finally, event handler, async function, loop-generated fields, factory가 component/Hook을 반환하는 경우와 use API의 특별 규칙을 구분합니다.",
    failureModes: "조건부 useId/useState는 특정 입력에서만 slot order를 밀어 다른 state가 대응되고 lint disable은 upgrade/StrictMode에서 재현하기 어려운 corruption을 만듭니다.",
    verification: "positive/negative lint fixtures, every branch call sequence model, production build와 target React version의 runtime warning을 확인합니다.",
    operations: "lint plugin/config version을 lockfile과 release evidence에 남기고 새 diagnostic은 baseline으로 숨기지 않고 owner·migration deadline을 정합니다.",
    concepts: [
      c("Rules of Hooks", "React Hooks를 top-level에서, React function component 또는 custom Hook 안에서만 호출하는 규칙입니다.", ["slot order를 보존합니다.", "static lint로 강제합니다."]),
      c("early-return hazard", "일부 render가 Hook 호출 전에 반환해 이후 Hooks의 호출 여부·순서가 달라지는 결함입니다.", ["Hooks를 early return보다 앞에 둡니다.", "component 분리를 검토합니다."]),
      c("lint gate", "Hook 구조·의존성·순수성 위반을 merge/release 전에 실패시키는 정적 검증 단계입니다.", ["suppression을 감사합니다.", "runtime test와 병행합니다."]),
    ],
    codeExamples: [node("react20-hook-order", "render path별 Hook 순서 검사", "React20HookOrder.mjs", "synthetic call sequences가 모든 branch에서 동일한지 검사해 conditional Hook 위험을 exact output으로 보여 줍니다.", String.raw`function sameSequence(paths) {
  const expected = JSON.stringify(paths[0]);
  return paths.every((path) => JSON.stringify(path) === expected);
}
const valid = [["useId", "useRef"], ["useId", "useRef"]];
const invalid = [["useId", "useRef"], ["useRef"]];
console.log("valid=" + sameSequence(valid));
console.log("conditional=" + sameSequence(invalid));
console.log("expected=" + valid[0].join("->"));`, "valid=true\nconditional=false\nexpected=useId->useRef", ["react-rules-hooks", "react-eslint-hooks", "local-hook-notes"])]
  }),
  appliedTopic({
    id: "custom-hook-public-contract", title: "custom Hook의 input·return·lifecycle·failure 계약을 공개 API로 만듭니다",
    lead: "로직 재사용을 code 이동으로 끝내지 않고 caller가 전달할 reactive inputs, 반환 state/actions, side effects, cleanup, errors와 test seam을 작은 stable contract로 정의합니다.",
    mechanism: "custom Hook은 다른 Hooks를 조합하지만 state 자체를 component instances 사이에 공유하지 않습니다. 같은 Hook을 두 번 호출하면 각 호출은 독립 state/lifecycle을 가지며 shared authority가 필요하면 외부 store/context가 필요합니다.",
    workflow: "한 user-visible capability를 선택해 params schema, result discriminated union, finite actions, cleanup/cancellation, retry와 observability를 문서화하고 implementation details를 숨깁니다.",
    invariants: "Hook 이름은 use로 시작하고 input object를 mutation하지 않으며 raw setter/DOM node/credential을 과도하게 노출하지 않고 caller가 render 중 결과를 안전하게 읽을 수 있습니다.",
    edgeCases: "optional callback, changing object identity, stale request, concurrent callers, unmount, retry, SSR no-browser environment, provider missing과 dependency upgrade를 포함합니다.",
    failureModes: "boolean loading 하나와 nullable data/error를 반환하면 모순 상태가 생기고 raw setState를 반환하면 caller가 Hook invariant를 우회하며 두 호출이 state를 공유한다고 오해합니다.",
    verification: "contract table, independent two-caller fixture, rerender/unmount, cancellation, negative input, SSR import와 backward-compatible return-shape tests를 실행합니다.",
    operations: "Hook API 변경은 consumer inventory, semver/deprecation adapter, canary와 rollback을 두고 useDebugValue에는 secret/PII가 아닌 bounded status만 표시합니다.",
    concepts: [
      c("custom Hook contract", "호출 입력, 반환 값/actions, lifecycle과 failure semantics를 정의한 reusable React API입니다.", ["state 공유를 자동 의미하지 않습니다.", "consumer compatibility 대상입니다."]),
      c("result union", "idle/loading/success/error처럼 동시에 하나만 가능한 결과 상태를 discriminant로 표현한 반환 모델입니다.", ["모순 booleans를 막습니다.", "UI branch가 exhaustive해집니다."]),
      c("debug label", "React DevTools에서 custom Hook 상태를 이해하도록 제공하는 bounded diagnostic value입니다.", ["필요한 Hook에만 사용합니다.", "민감정보를 넣지 않습니다."]),
    ],
    codeExamples: [node("react20-hook-contract", "custom Hook result union 검증", "React20HookContract.mjs", "public result의 status별 required/forbidden fields를 검사해 모순 상태를 stable code로 거부합니다.", String.raw`function validate(result) {
  if (result.status === "idle") return result.data === undefined && result.error === undefined ? "ok" : "idle-leak";
  if (result.status === "success") return result.data !== undefined && result.error === undefined ? "ok" : "success-shape";
  if (result.status === "error") return typeof result.error === "string" && result.data === undefined ? "ok" : "error-shape";
  return "unknown-status";
}
console.log(validate({ status: "idle" }));
console.log(validate({ status: "success", data: [1, 2] }));
console.log(validate({ status: "success", data: [], error: "stale" }));
console.log(validate({ status: "mystery" }));`, "ok\nok\nsuccess-shape\nunknown-status", ["react-custom-hooks", "react-use-debug-value", "react-eslint-hooks"])]
  }),
  appliedTopic({
    id: "hook-purity-strictmode", title: "render·initializer·updater·custom Hook body를 순수하게 유지합니다",
    lead: "Hook이 호출된다는 이유로 render 중 network, DOM, storage와 global mutation이 허용되는 것이 아니므로 calculation과 external synchronization의 phase를 분리합니다.",
    mechanism: "component와 Hook body는 props/state/context를 읽어 같은 input에 같은 result를 계산해야 합니다. StrictMode development checks는 추가 render와 Effect setup/cleanup으로 impure code를 드러냅니다.",
    workflow: "render path의 Date/random/global write/DOM/request를 inventory하고 event handler 또는 Effect boundary로 이동하며 Effect는 setup과 완전한 cleanup을 대칭으로 만듭니다.",
    invariants: "render와 updater는 input을 mutation하지 않고 external side effect를 만들지 않으며 repeated calculation이 user-visible duplicate를 만들지 않고 cleanup은 setup한 resource만 해제합니다.",
    edgeCases: "lazy initializer, module counter ID, cache mutation, ref.current write/read, subscription, request abort, development extra calls와 third-party Hook을 포함합니다.",
    failureModes: "global nextId++는 render abort/retry와 hydration order에서 mismatch를 만들고 Hook body request는 every render에서 중복되며 incomplete cleanup은 listener/timer를 누적합니다.",
    verification: "same input double invocation, frozen inputs, side-effect counter, StrictMode mount/unmount, aborted render와 production final-result parity를 확인합니다.",
    operations: "development-only duplicate symptom을 숨기지 않고 resource count·cleanup failure를 관찰하며 dependency exception에는 owner와 upgrade plan을 둡니다.",
    concepts: [
      c("render purity", "render 단계가 외부 state를 바꾸지 않고 같은 inputs에 같은 output description을 만드는 성질입니다.", ["Hook body도 포함합니다.", "event/effect와 분리합니다."]),
      c("setup-cleanup symmetry", "Effect가 만든 subscription/timer/request resource를 cleanup이 정확히 한 번씩 해제할 수 있는 구조입니다.", ["재실행에 안전합니다.", "partial setup도 고려합니다."]),
      c("StrictMode probe", "development에서 purity와 cleanup 결함을 드러내는 React의 추가 검사입니다.", ["production 중복 실행 계약이 아닙니다.", "증상을 root cause로 연결합니다."]),
    ],
    codeExamples: [node("react20-purity", "Hook 계산의 반복 실행 purity", "React20Purity.mjs", "frozen input을 두 번 계산해 value equivalence와 input 보존을 검증합니다.", String.raw`const input = Object.freeze({ prefix: "field", count: 2 });
function calculate(value) {
  return Array.from({ length: value.count }, (_, index) => value.prefix + "-" + (index + 1));
}
const first = calculate(input);
const second = calculate(input);
console.log("same-value=" + (JSON.stringify(first) === JSON.stringify(second)));
console.log("same-reference=" + (first === second));
console.log("input-count=" + input.count);
console.log("result=" + first.join(","));`, "same-value=true\nsame-reference=false\ninput-count=2\nresult=field-1,field-2", ["react-purity", "react-strict-mode", "local-hook-notes"])]
  }),
  appliedTopic({
    id: "useid-opaque-accessibility-id", title: "useId를 opaque accessibility identifier로 사용합니다",
    lead: "useId 반환 문자열의 모양이나 순번에 의존하지 않고 동일 component call에서 label, input, description과 error를 연결하는 opaque base로만 사용합니다.",
    mechanism: "useId는 component의 특정 Hook call에 연결된 unique string을 반환하며 동일한 server/client tree에서 hydration-safe relationships를 돕습니다. list key나 data identity는 domain data에서 가져와야 합니다.",
    workflow: "component top-level에서 base를 한 번 만들고 -input, -hint, -error suffix를 고정해 정의/reference를 구성하며 DOM에서 unique·resolved graph를 검증합니다.",
    invariants: "ID 문자열을 parse·정렬·영속화·서버 전송하지 않고 list key/cache/security token으로 쓰지 않으며 모든 references는 같은 render tree의 존재하는 unique target을 가리킵니다.",
    edgeCases: "component 여러 인스턴스, keyed remount, conditionally rendered error, multiple roots identifierPrefix, server/client mismatch와 async Server Component 제약을 다룹니다.",
    failureModes: "useId를 key로 쓰면 data reorder identity를 잃고 global counter는 SSR/hydration에서 어긋나며 같은 base를 두 input id에 쓰면 HTML uniqueness가 깨집니다.",
    verification: "two-instance uniqueness, suffix graph, no parse/persist assertion, list reorder, server/client identical tree와 multiple-root prefix fixture를 실행합니다.",
    operations: "generated ID value를 logs/snapshots에 고정하지 않고 broken relationship count와 build/root prefix configuration만 관찰하며 framework upgrade에서 hydration matrix를 재검증합니다.",
    concepts: [
      c("opaque identifier", "내부 문자열 형식을 해석하지 않고 equality/reference 연결에만 사용하는 ID입니다.", ["format contract를 만들지 않습니다.", "영속 domain id와 다릅니다."]),
      c("relationship suffix", "한 useId base에서 input·hint·error처럼 관련 targets를 고유하게 파생하는 stable literal suffix입니다.", ["중복을 피합니다.", "purpose를 읽을 수 있게 합니다."]),
      c("identifierPrefix", "여러 React roots의 generated IDs가 충돌하지 않도록 root/server-hydration 설정에 맞추는 prefix option입니다.", ["server/client에서 일치시킵니다.", "한 root에는 보통 필요 없습니다."]),
    ],
    codeExamples: [node("react20-id-graph", "opaque base에서 form relationship 파생", "React20IdGraph.mjs", "React가 생성했다고 가정한 opaque base를 해석하지 않고 related IDs와 references를 deterministic하게 구성합니다.", String.raw`function fieldIds(base) {
  return { input: base + "-input", hint: base + "-hint", error: base + "-error" };
}
const ids = fieldIds("opaque-a");
const references = { htmlFor: ids.input, describedBy: [ids.hint, ids.error] };
console.log(JSON.stringify(ids));
console.log("label-target=" + references.htmlFor);
console.log("described-by=" + references.describedBy.join(" "));
console.log("unique=" + (new Set(Object.values(ids)).size === 3));`, "{\"input\":\"opaque-a-input\",\"hint\":\"opaque-a-hint\",\"error\":\"opaque-a-error\"}\nlabel-target=opaque-a-input\ndescribed-by=opaque-a-hint opaque-a-error\nunique=true", ["local-useid-02", "react-use-id", "html-label", "wai-form-labels"])]
  }),
  appliedTopic({
    id: "form-name-description-error", title: "label·description·error·group 관계를 접근성 contract로 완성합니다",
    lead: "label click으로 focus가 간다는 한 결과를 넘어 control의 accessible name, 도움말, validation error와 required/invalid state가 keyboard·screen reader에서 일관되게 전달되도록 설계합니다.",
    mechanism: "label의 for/htmlFor는 unique input id를 참조하고 aria-describedby는 supplementary text IDs를 공백으로 연결할 수 있습니다. error가 나타나면 참조 target과 invalid state를 함께 관리합니다.",
    workflow: "visible label을 기본으로 input id를 연결하고 hint/error IDs를 파생하며 fieldset/legend로 group을 표현하고 submit 후 summary→field focus 흐름을 정합니다.",
    invariants: "placeholder를 유일한 label로 사용하지 않고 error를 색상만으로 표시하지 않으며 dangling/duplicate IDs가 없고 hidden target의 visibility와 announcement 정책을 명시합니다.",
    edgeCases: "optional/required, multiple errors, async validation, error 제거, repeated component, radio group, disabled/read-only, localization과 long help text를 포함합니다.",
    failureModes: "htmlFor만 만들고 input id를 누락하면 label이 control을 찾지 못하고 같은 id를 여러 input에 쓰면 첫 target처럼 잘못 연결되며 alert만 사용하면 context와 복구가 약합니다.",
    verification: "role/name/description, label click focus, duplicate/dangling ID, invalid state, error summary keyboard flow, zoom/reflow와 screen reader smoke test를 실행합니다.",
    operations: "field type·validation reason별 failure만 집계하고 입력값과 generated ID는 수집하지 않으며 accessibility regression을 release blocker로 둡니다.",
    concepts: [
      c("accessible description", "control의 이름을 보완하는 도움말·제약·오류 text로 accessibility API에 연결된 정보입니다.", ["이름과 구분합니다.", "aria-describedby 등을 사용합니다."]),
      c("dangling reference", "htmlFor나 ARIA IDREF가 현재 DOM에 존재하지 않는 id를 가리키는 결함입니다.", ["dynamic branch에서 생깁니다.", "graph test로 잡습니다."]),
      c("error recovery focus", "검증 실패 후 summary 또는 첫 invalid field로 이동해 문제와 수정 위치를 알리는 keyboard flow입니다.", ["focus를 빼앗는 시점을 신중히 정합니다.", "오류 text를 보존합니다."]),
    ],
    codeExamples: [node("react20-a11y-relations", "label·description IDREF graph 검증", "React20A11yRelations.mjs", "DOM-like metadata에서 duplicate definition과 missing references를 stable result로 검사합니다.", String.raw`function validate(nodes) {
  const defined = nodes.map((node) => node.id).filter(Boolean);
  if (new Set(defined).size !== defined.length) return "duplicate-id";
  const refs = nodes.flatMap((node) => [node.htmlFor, ...(node.describedBy ?? [])]).filter(Boolean);
  const missing = refs.filter((id) => !defined.includes(id));
  return missing.length ? "missing:" + [...new Set(missing)].join(",") : "ok";
}
console.log(validate([{ id: "f" }, { htmlFor: "f" }]));
console.log(validate([{ id: "f" }, { id: "f" }]));
console.log(validate([{ id: "f", describedBy: ["hint"] }]));`, "ok\nduplicate-id\nmissing:hint", ["local-useid-01", "local-useid-03", "html-label", "wai-form-labels", "wcag22"])]
  }),
  appliedTopic({
    id: "ssr-hydration-multi-root", title: "server/client tree와 multiple-root prefix를 hydration contract로 맞춥니다",
    lead: "useId가 SSR을 자동 해결한다고 과장하지 않고 server와 client가 같은 component tree를 렌더하고 root identifierPrefix 설정이 일치할 때 relationship IDs가 대응된다는 전제를 검증합니다.",
    mechanism: "useId는 parent path 기반으로 server/client output을 맞추지만 browser-only 조건이나 시간·random으로 tree가 달라지면 generated sequence와 markup이 어긋날 수 있습니다.",
    workflow: "server/client inputs, feature flags, locale와 root prefix를 snapshot하고 deterministic tree signature를 비교한 뒤 hydrateRoot 경고와 label relationships를 production artifact에서 확인합니다.",
    invariants: "첫 render tree는 server/client에서 동형이고 root prefix는 server renderer와 hydrateRoot에 동일하며 hydration warning을 suppressHydrationWarning으로 일반 해결하지 않습니다.",
    edgeCases: "browser API branch, auth/session drift, A/B flag, locale data, Suspense streaming, two independent roots, CDN old HTML/new bundle과 partial hydration을 포함합니다.",
    failureModes: "server는 field를 렌더하고 client는 숨기면 이후 IDs와 IDREFs가 어긋나고 root prefixes가 겹치면 한 document의 IDs가 충돌할 수 있습니다.",
    verification: "server/client tree signature, rendered HTML→hydrate label focus, two roots uniqueness, old/new artifact compatibility와 no-hydration-warning gate를 실행합니다.",
    operations: "hydration mismatch를 route/build/flag code로 관찰하고 raw HTML/field values는 남기지 않으며 mismatch 증가 시 flag rollback 또는 compatible artifact 복원 runbook을 실행합니다.",
    concepts: [
      c("hydration parity", "server HTML과 client 첫 render의 element tree·attributes가 React가 연결할 수 있게 일치하는 성질입니다.", ["useId도 이 전제가 필요합니다.", "production build로 검증합니다."]),
      c("tree signature", "민감 text를 제외하고 component/type/key/relationship 구조를 canonical하게 표현한 비교 값입니다.", ["diagnostic model입니다.", "React internal format이 아닙니다."]),
      c("multi-root isolation", "한 document의 독립 React roots가 ID namespace와 lifecycle을 충돌 없이 운영하는 조건입니다.", ["identifierPrefix를 검토합니다.", "server/client 설정을 맞춥니다."]),
    ],
    codeExamples: [node("react20-hydration-signature", "server/client field tree parity 검사", "React20Hydration.mjs", "field purpose sequence와 root prefix를 비교해 safe/mismatch 결과를 exact output으로 분류합니다.", String.raw`function signature(prefix, fields) {
  return prefix + "|" + fields.map((field) => field.type + ":" + field.purpose).join(",");
}
const server = signature("app-a", [{ type: "input", purpose: "name" }, { type: "input", purpose: "age" }]);
const client = signature("app-a", [{ type: "input", purpose: "name" }, { type: "input", purpose: "age" }]);
const drifted = signature("app-a", [{ type: "input", purpose: "age" }]);
console.log("server=" + server);
console.log("parity=" + (server === client));
console.log("drift=" + (server === drifted));`, "server=app-a|input:name,input:age\nparity=true\ndrift=false", ["react-use-id", "react-strict-mode", "local-useid-02"])]
  }),
  appliedTopic({
    id: "memo-debug-performance-quality", title: "Hook abstraction·memoization·debugging 비용을 measurement로 관리합니다",
    lead: "custom Hook으로 모든 한 줄을 감싸거나 useMemo/useCallback을 correctness 장치처럼 사용하지 않고 dependency clarity, consumer API와 measured interaction/render cost를 근거로 선택합니다.",
    mechanism: "custom Hook 호출은 일반 function abstraction 비용과 내부 Hooks lifecycle을 가지며 memoization은 dependencies가 같을 때 cached value/reference를 재사용하지만 semantic correctness를 보장하지 않습니다.",
    workflow: "먼저 pure/simple contract를 만들고 Profiler와 render/calculate counts로 bottleneck을 확인한 뒤 좁은 memo boundary를 적용하고 useDebugValue는 expensive formatting을 필요 시 지연합니다.",
    invariants: "stale dependency를 성능 최적화로 정당화하지 않고 Hook return object/function identity를 public correctness 요구로 만들지 않으며 debugging label은 bounded·redacted합니다.",
    edgeCases: "cheap calculation, unstable object dependency, memoized callback stale closure, compiler optimization, development extra render, many Hook instances와 DevTools closed 상태를 다룹니다.",
    failureModes: "모든 return을 memoize하면 dependencies와 invalidation surface만 늘고 empty dependency로 callback을 고정하면 old input을 보며 debug label에 payload를 넣으면 개인정보가 노출됩니다.",
    verification: "before/after profiler, result parity, dependency lint, stale closure fixture, allocation/render counts와 debug output redaction review를 실행합니다.",
    operations: "optimization에는 measured baseline·owner·removal condition을 남기고 runtime upgrade/React Compiler 적용 시 manual memoization assumptions를 다시 측정합니다.",
    concepts: [
      c("abstraction budget", "custom Hook이 추가하는 API, lifecycle, dependencies와 debugging 비용을 허용할 근거입니다.", ["재사용 횟수만 보지 않습니다.", "user capability 중심으로 묶습니다."]),
      c("memoization boundary", "측정된 expensive calculation 또는 reference-sensitive consumer를 둘러싸는 cache 범위입니다.", ["correctness와 분리합니다.", "dependencies가 완전해야 합니다."]),
      c("privacy-safe debug value", "상태 payload 대신 status·count·reason code만 표시하는 custom Hook diagnostic입니다.", ["DevTools도 노출 surface입니다.", "bounded formatting을 씁니다."]),
    ],
    codeExamples: [node("react20-debug-value", "민감 payload 없는 Hook debug projection", "React20DebugValue.mjs", "Hook result에서 status, bounded count와 stable error code만 선택해 diagnostic value를 만듭니다.", String.raw`function debugValue(result) {
  if (result.status === "success") return "success:items=" + Math.min(result.data.length, 999);
  if (result.status === "error") return "error:" + result.code;
  return result.status;
}
console.log(debugValue({ status: "success", data: ["private-a", "private-b"] }));
console.log(debugValue({ status: "error", code: "timeout", detail: "do-not-log" }));
console.log(debugValue({ status: "loading" }));`, "success:items=2\nerror:timeout\nloading", ["react-use-debug-value", "react-custom-hooks", "react-eslint-hooks"])]
  }),
  appliedTopic({
    id: "hook-testing-evidence-layers", title: "pure contract·Hook integration·DOM·hydration tests의 증명 범위를 나눕니다",
    lead: "custom Hook을 isolated helper 한 번으로 검증했다고 끝내지 않고 순수 policy, React lifecycle, consumer DOM, browser accessibility와 server/client hydration을 각각 가장 작은 compatible fixture에서 증명합니다.",
    mechanism: "Node pure model은 schema와 transition을 빠르게 확인하지만 React Hook dispatcher와 Effects를 실행하지 않습니다. component integration은 실제 Hook order/lifecycle을, browser/SSR fixture는 focus·accessibility tree와 hydration을 검증합니다.",
    workflow: "각 invariant를 pure, lint, React development, DOM user flow, SSR/hydration, production build와 canary 중 최소 필요한 층에 배정하고 test double이 증명하지 못하는 항목을 표에 남깁니다.",
    invariants: "implementation call count에 과도하게 결합하지 않고 user-visible result와 cleanup을 우선하며 generated ID literal을 snapshot하지 않고 uniqueness·resolved relationships를 assert합니다.",
    edgeCases: "rerender inputs, two Hook calls, unmount, StrictMode, suspended/aborted render, fake timers, server tree drift, multiple roots와 assistive technology를 포함합니다.",
    failureModes: "Node model만 통과하면 conditional Hook·DOM focus를 놓치고 brittle ID snapshot은 React upgrade에 깨지며 mocked Effect는 실제 cleanup/resource leak을 증명하지 못합니다.",
    verification: "invariant→test-layer traceability, positive/negative fixtures, deterministic clock/network, zero console/hydration warnings와 production artifact readback을 실행합니다.",
    operations: "flaky test를 skip으로 방치하지 않고 nondeterminism source를 격리하며 release evidence에 runtime/browser/plugin versions와 tested artifact hash를 연결합니다.",
    concepts: [
      c("test-layer responsibility", "pure·lint·React·DOM·SSR·E2E 각 test가 증명하고 증명하지 못하는 contract 범위입니다.", ["중복보다 공백을 찾습니다.", "실제 compatible runtime을 포함합니다."]),
      c("relationship assertion", "generated ID 문자열 대신 definitions의 uniqueness와 IDREF가 존재 target을 가리키는지를 검사하는 assertion입니다.", ["implementation format에 덜 결합됩니다.", "접근성 outcome과 연결합니다."]),
      c("production-like evidence", "development helper가 아닌 실제 optimization, SSR/hydration와 asset 조건에서 얻은 검증 결과입니다.", ["StrictMode evidence와 병행합니다.", "artifact hash를 고정합니다."]),
    ],
    codeExamples: [node("react20-test-matrix", "Hook invariant별 required test layers", "React20TestMatrix.mjs", "각 품질 invariant에 pure/lint/DOM/SSR 층을 배정하고 누락된 evidence를 fail closed 분류합니다.", String.raw`const required = {
  hookOrder: ["lint", "react"],
  idRelationship: ["dom"],
  hydration: ["ssr"],
  resultSchema: ["pure"],
};
const evidence = new Set(["lint", "react", "dom", "pure"]);
for (const [name, layers] of Object.entries(required)) {
  const missing = layers.filter((layer) => !evidence.has(layer));
  console.log(name + "=" + (missing.length ? "missing:" + missing.join(",") : "ok"));
}`, "hookOrder=ok\nidRelationship=ok\nhydration=missing:ssr\nresultSchema=ok", ["react-rules-hooks", "react-strict-mode", "react-use-id", "wai-form-labels"])]
  }),
  appliedTopic({
    id: "hook-security-recovery-release", title: "Hook·ID·접근성 품질을 security·recovery release gate로 통합합니다",
    lead: "lint와 label focus 한 번으로 완료하지 않고 API misuse, secret propagation, hydration mismatch, cleanup leak, accessibility regression과 consumer migration을 배포 전후 evidence로 묶습니다.",
    mechanism: "Hook은 credentials나 authorization을 자동 보호하지 않고 DOM id는 공개 문자열입니다. 품질 gate는 static rules, pure model, actual component DOM, SSR/hydration, performance와 rollback compatibility를 서로 독립적으로 확인합니다.",
    workflow: "source hash→lint/type→Node contract→React StrictMode→DOM/a11y→SSR/multi-root→performance→security scan→canary→rollback 순서로 immutable evidence를 저장합니다.",
    invariants: "generated IDs에 user/secret/domain values를 넣지 않고 errors/debug/logs를 redaction하며 cleanup/migration 실패 시 safe previous state를 보존하고 release는 모든 required gates가 통과해야 합니다.",
    edgeCases: "old/new Hook return shapes, duplicate package React, partial deploy, stale HTML, provider missing, client-only API on server, feature rollback과 persisted consumer state를 포함합니다.",
    failureModes: "DOM id를 security token처럼 믿으면 공개 markup에 노출되고 Hook API return field 제거는 consumers를 runtime에서 깨뜨리며 hydration warning suppression은 broken relationships를 숨깁니다.",
    verification: "secret canary, malformed inputs, consumer compatibility matrix, all exact examples, relationship graph, keyboard/screen reader, server/client parity, canary metrics와 rollback rehearsal를 실행합니다.",
    operations: "release dashboard에는 lint/a11y/hydration/cleanup/retry reason code와 build version만 남기고 threshold 초과 시 flag disable, artifact rollback과 relationship smoke test를 수행합니다.",
    concepts: [
      c("quality evidence chain", "source provenance부터 user outcome·rollback까지 각 검증이 무엇을 증명하는지 연결한 기록입니다.", ["한 test로 대체하지 않습니다.", "artifact version을 고정합니다."]),
      c("DOM ID disclosure", "id attribute가 page source, accessibility tree와 client scripts에 공개되는 특성입니다.", ["secret에 사용하지 않습니다.", "PII를 포함하지 않습니다."]),
      c("consumer compatibility", "custom Hook의 old/new callers가 migration window와 rollback에서 같은 핵심 contract를 유지하는 성질입니다.", ["return shape와 behavior를 모두 봅니다.", "adapter를 둘 수 있습니다."]),
    ],
    codeExamples: [node("react20-quality-gate", "Hook quality fail-closed release gate", "React20QualityGate.mjs", "lint·purity·ID graph·a11y·hydration·security·rollback evidence가 모두 참일 때만 release합니다.", String.raw`function gate(evidence) {
  const required = ["lint", "purity", "idGraph", "accessibility", "hydration", "security", "rollback"];
  const failed = required.filter((name) => evidence[name] !== true);
  return { release: failed.length === 0, failed };
}
console.log(JSON.stringify(gate({ lint: true, purity: true, idGraph: true, accessibility: true, hydration: true, security: true, rollback: true })));
console.log(JSON.stringify(gate({ lint: true, purity: true, idGraph: false, accessibility: false, hydration: true, security: true, rollback: true })));`, "{\"release\":true,\"failed\":[]}\n{\"release\":false,\"failed\":[\"idGraph\",\"accessibility\"]}", ["react-use-id", "react-rules-hooks", "react-purity", "react-strict-mode", "wcag22"])]
  }),
];

const sources: SessionSource[] = [
  { id: "local-useid-01", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step11-hook/UseIdTest01.jsx", usedFor: ["label variants", "duplicate input id risk provenance"], evidence: "Read-only structural audit: 33 lines, 1,058 bytes, SHA-256 AB93C52CFCF68699E899266A9BFCC24608C2298FED45D8D9BC5F8B9A92B2D5A0." },
  { id: "local-useid-02", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step11-hook/UseIdTest02.jsx", usedFor: ["single useId base", "related suffix pattern provenance"], evidence: "Read-only structural audit: 19 lines, 523 bytes, SHA-256 2C839B64B450BDB4197252C24B9381319DFE586E850A5043558DB648434C2215." },
  { id: "local-useid-03", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step11-hook/UseIdTest03.jsx", usedFor: ["two useId calls", "missing input id and imperative validation provenance"], evidence: "Read-only structural audit: 48 lines, 1,457 bytes, SHA-256 3D36C4AB9341507B7413C4CFB6134E991AF1FAA2F76AB9FD26E03B67E19B0. Actual form values were not copied." },
  { id: "local-hook-notes", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step11-hook/hook_설명.txt", usedFor: ["Hook categories and top-level rule provenance", "memo/ref/useId learning sequence"], evidence: "Read-only structural audit: 58 lines, 2,931 bytes, SHA-256 CBE3CB63863801A5A5E3831AF42F16F6782E3B999E068766A2074BF4BE21AA8D." },
  { id: "local-hooks-guide", repository: "local REACT learning snapshot", path: "REACT/docs/react/05-hooks.md", usedFor: ["Hook lifecycle guide", "useId label example and learning result provenance"], evidence: "Read-only structural audit: 200 lines, 9,174 bytes, SHA-256 B0563A725CD72CA4B751FBCDA43A4062121D0DEDCA9A34ACEDA6773A56F02862. Actual local/GitHub URLs and domain strings were not copied." },
  { id: "react-use-id", repository: "React official API", path: "reference/react/useId", publicUrl: "https://react.dev/reference/react/useId", usedFor: ["opaque accessibility IDs", "SSR, suffix, multi-root and non-list-key caveats"], evidence: "Official React 19.2 API documents useId identity, accessibility relationships, hydration requirements and identifierPrefix." },
  { id: "react-rules-hooks", repository: "React official Rules", path: "reference/rules/rules-of-hooks", publicUrl: "https://react.dev/reference/rules/rules-of-hooks", usedFor: ["top-level Hook calls", "valid component/custom Hook contexts"], evidence: "Official React Rules specify where Hooks may be called and enumerate invalid conditional, loop and callback cases." },
  { id: "react-eslint-hooks", repository: "React official tooling reference", path: "reference/eslint-plugin-react-hooks", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks", usedFor: ["Hook lint gate", "compiler-related diagnostics and gradual adoption"], evidence: "Official reference describes eslint-plugin-react-hooks diagnostics and recommended lint integration." },
  { id: "react-use-debug-value", repository: "React official API", path: "reference/react/useDebugValue", publicUrl: "https://react.dev/reference/react/useDebugValue", usedFor: ["custom Hook diagnostics", "deferred and privacy-safe formatting"], evidence: "Official API documents custom Hook debug labels and formatting behavior." },
  { id: "react-strict-mode", repository: "React official API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development purity and cleanup checks", "extra render/Effect diagnostics"], evidence: "Official API distinguishes development checks from production behavior." },
  { id: "react-custom-hooks", repository: "React official documentation", path: "learn/reusing-logic-with-custom-hooks", publicUrl: "https://react.dev/learn/reusing-logic-with-custom-hooks", usedFor: ["custom Hook extraction", "independent state and reactive input contracts"], evidence: "Official guide explains custom Hook naming, logic reuse, independent calls and event/effect boundaries." },
  { id: "react-purity", repository: "React official Rules", path: "reference/rules/components-and-hooks-must-be-pure", publicUrl: "https://react.dev/reference/rules/components-and-hooks-must-be-pure", usedFor: ["idempotent render", "side effects outside render and immutable inputs"], evidence: "Official React Rule defines purity, idempotence and side-effect placement for Components and Hooks." },
  { id: "html-label", repository: "WHATWG HTML Living Standard", path: "multipage/forms.html#the-label-element", publicUrl: "https://html.spec.whatwg.org/multipage/forms.html#the-label-element", usedFor: ["label-control association", "unique target semantics"], evidence: "HTML Standard defines label association through for/id and labelable controls." },
  { id: "wai-form-labels", repository: "W3C Web Accessibility Initiative", path: "WAI/tutorials/forms/labels", publicUrl: "https://www.w3.org/WAI/tutorials/forms/labels/", usedFor: ["visible labels", "explicit/implicit association and control purpose"], evidence: "WAI tutorial provides accessible labeling patterns for form controls." },
  { id: "wcag22", repository: "W3C Web Accessibility Initiative", path: "TR/WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["names, instructions, errors and focus", "release accessibility criteria"], evidence: "WCAG 2.2 provides normative perceivable, operable and robust success criteria." },
];

const session = createExpertSession({
  inventoryId: "react-20-hook-quality-capstone", slug: "react-20-hook-quality-capstone", courseId: "react", moduleId: "react-events-forms-hooks", order: 10,
  title: "Hook 품질·useId와 접근성 capstone", subtitle: "Hook 호출·순수성·public contract와 useId 기반 DOM 관계를 SSR·접근성·보안·rollback evidence로 통합합니다.",
  level: "고급", estimatedMinutes: 125,
  coreQuestion: "custom Hook과 useId를 호출 규칙·순수성·SSR 및 accessible relationship을 지키는 공개 API로 만들고 어떤 evidence로 production 품질을 증명할까요?",
  summary: "my-app01의 UseIdTest01~03, Hook 설명과 REACT Hooks 문서를 read-only로 감사합니다. 첫 예제의 duplicate id와 세 번째 예제의 dangling htmlFor를 숨기지 않고 두 번째 예제의 base+suffix 구조를 올바른 출발점으로 사용합니다. Rules of Hooks·lint, custom Hook input/result/lifecycle contract, render purity와 StrictMode, opaque useId·multiple roots·hydration, label/description/error/focus, measurement 기반 abstraction·memo/debugging과 secret-free compatibility/rollback gate까지 열 절과 열 Node exact examples로 확장합니다.",
  objectives: ["원본 useId 예제의 duplicate/dangling/valid relationships를 evidence로 구분한다.", "Rules of Hooks를 call-order invariant와 lint gate로 강제한다.", "custom Hook input/result/lifecycle/failure API를 설계한다.", "Hook body·initializer·updater의 purity와 cleanup을 검증한다.", "useId를 opaque accessibility ID로 사용하고 list/data/security identity와 구분한다.", "label·hint·error·group과 focus recovery를 WCAG contract로 연결한다.", "server/client tree와 multiple-root prefixes의 hydration parity를 검증한다.", "memoization/debug abstraction을 measured·privacy-safe하게 운영한다.", "consumer migration, security canary와 rollback을 release gate로 만든다."],
  prerequisites: [{ title: "custom Hook 추출과 contract", reason: "capstone은 앞 세션에서 만든 custom Hook의 input, output과 lifecycle을 lint·purity·useId·SSR·접근성·운영 evidence로 강화합니다.", sessionSlug: "react-19-custom-hook-contract" }],
  keywords: ["Rules of Hooks", "custom Hook", "useId", "accessibility", "label", "aria-describedby", "hydration", "identifierPrefix", "StrictMode", "useDebugValue", "Hook lint", "rollback"],
  topics,
  lab: {
    title: "useAccessibleField custom Hook 품질 capstone",
    scenario: "원본 다섯 자료는 변경하지 않고 synthetic fields만 쓰는 disposable React SSR/client fixture에서 Hook contract, IDs, errors, focus, hydration과 migration을 검증합니다.",
    setup: ["Node.js 20 이상", "React 19 development와 production-like SSR/hydration fixture", "eslint-plugin-react-hooks", "Testing Library compatible DOM", "keyboard/accessibility inspection", "synthetic non-PII fields", "원본 다섯 파일 read-only hashes"],
    steps: ["원본 Hook calls와 id definition/reference graph 및 hash evidence를 기록합니다.", "duplicate id와 dangling htmlFor를 실패시키고 base+input/hint/error suffix graph로 교정합니다.", "custom Hook params와 idle/valid/invalid result/action contract를 정의합니다.", "conditional/loop/early-return Hook negative fixtures를 lint에서 실패시킵니다.", "render/initializer를 두 번 실행해 external mutation·random/global counter가 없음을 확인합니다.", "label click, role/name/description/invalid/error summary와 keyboard focus를 검증합니다.", "동일 component 두 인스턴스와 multiple roots에서 unique relationships를 검사합니다.", "server/client tree, root prefix와 hydration warning zero를 production build에서 확인합니다.", "debug labels와 telemetry에 input/generated ID/secret이 없는지 canary scan합니다.", "old/new Hook consumers, feature flag, artifact rollback과 relationship smoke test를 rehearsal합니다."],
    expectedResult: ["모든 render path의 Hook sequence가 동일하고 lint suppression이 없습니다.", "custom Hook result가 모순 없는 union이며 두 호출의 state가 독립적입니다.", "모든 label/hint/error IDREF가 unique existing target을 가리킵니다.", "keyboard·screen reader·invalid focus 흐름이 유지됩니다.", "server/client와 multiple roots에서 hydration mismatch가 없습니다.", "debug/telemetry에 user value, generated ID, credential 또는 private endpoint가 없습니다.", "old/new consumer와 rollback artifact가 같은 핵심 관계 contract를 유지합니다."],
    cleanup: ["temporary builds, SSR output, browser storage, reports와 synthetic values를 제거합니다.", "debug/profiler/relationship tracing을 원복합니다.", "원본 다섯 파일의 hash와 git status가 변경되지 않았는지 확인합니다."],
    extensions: ["fieldset/legend, radio group과 composite validation을 Hook contract에 추가합니다.", "React Server Components와 client boundary별 Hook availability matrix를 작성합니다.", "component library의 identifierPrefix/multiple-root integration test를 자동화합니다.", "Hook API metadata에서 docs, lint fixtures와 compatibility tests를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node examples를 실행하고 원본 useId 세 예제의 valid/invalid relationship과 대응시키세요.", requirements: ["stdout 완전 일치", "duplicate/dangling audit", "Hook order", "result union", "purity", "opaque suffix IDs", "IDREF graph", "hydration signature", "safe debug", "test matrix", "quality gate"], hints: ["generated ID 문자열 자체를 snapshot하지 말고 정의와 참조 관계를 assert하세요."], expectedOutcome: "Node model의 범위와 실제 React/DOM/hydration 검증 경계를 설명합니다.", solutionOutline: ["source→rules/contract→purity→ID/a11y→SSR/debug/release 순서입니다."] },
    { difficulty: "응용", prompt: "UseIdTest03 구조를 useAccessibleField custom Hook과 semantic form으로 재설계하세요.", requirements: ["top-level Hooks", "base+suffix IDs", "visible labels", "hint/error descriptions", "no alert-only validation", "result union", "focus recovery", "two instances", "SSR parity", "secret-free diagnostics", "migration adapter"], hints: ["ref validation을 유지하더라도 controlled/uncontrolled ownership과 error rendering을 명확히 하세요."], expectedOutcome: "중복 없이 재사용 가능하고 SSR·keyboard·screen reader에서 검증된 field Hook이 완성됩니다.", solutionOutline: ["contract→Hook→semantic DOM→validation→SSR→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React Hook 품질·접근성 governance를 작성하세요.", requirements: ["Rules/lint", "purity/cleanup", "custom Hook API/versioning", "useId boundaries", "label/error/focus", "SSR/multi-root", "debug/privacy", "performance evidence", "canary/rollback"], hints: ["Hook 목록이 아니라 source부터 consumer migration까지 evidence chain을 정의하세요."], expectedOutcome: "팀이 reusable Hook을 접근성·보안·운영 회귀 없이 진화시키는 표준이 완성됩니다.", solutionOutline: ["audit→constrain→implement→integrate→observe→migrate 순서입니다."] },
  ],
  nextSessions: ["react-21-reducer-state-machine"], sources,
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["UseIdTest01/02/03, hook_설명.txt와 REACT 05-hooks 문서를 read-only로 전부 읽고 exact hash·lines·bytes를 기록했습니다.", "UseIdTest01의 duplicate id와 UseIdTest03의 missing input id를 숨기지 않았고 UseIdTest02의 base+suffix relationship만 valid structural provenance로 사용했습니다.", "원본의 실제 form values, alert text, local/GitHub URLs와 domain strings는 공개 examples에 복사하지 않았습니다.", "원본에 custom Hook result union, lint/SSR/multi-root tests, accessible error/focus, privacy telemetry와 rollback이 이미 있다고 주장하지 않고 official sources와 synthetic models로 보강했습니다.", "Node examples는 actual React Hook dispatcher, eslint plugin, DOM focus/accessibility tree, server rendering/hydration과 DevTools behavior를 대체하지 않으므로 lab fixture가 필요합니다."] },
});

export default session;
