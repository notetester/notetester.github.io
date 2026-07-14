import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-form-audit", title: "원본 여섯 form component를 value·owner·conversion·submit 결함으로 감사합니다",
    lead: "text, checkbox, radio, select, 다중 checkbox와 온도 변환기를 단순 입력 예제로 보존하면서 DOM string 경계, missing keys/submit, stale update와 numeric coercion을 production 관점으로 드러냅니다.",
    mechanism: "FormSample01/02는 여러 controlled controls, Sample03은 object checkbox map과 derived selection, Sample04와 TempInput/Radio는 lifted raw value와 unit conversion을 보여 줍니다. 그러나 option key/value, form submit, enum authorization, functional update, number parsing과 precision policy는 별도 설계가 필요합니다.",
    workflow: "각 control의 DOM value type, canonical state type, parse/format, owner, validation, label, submission field와 reset policy를 표로 만든 뒤 source fact와 실행 결과를 분리합니다.",
    invariants: "원본은 read-only이고 실제 menu/user strings는 synthetic codes로 대체하며, client form은 authorization source가 아니고 every submitted field는 server에서 다시 검증합니다.",
    edgeCases: "empty text, whitespace, IME composition, false checkbox, unknown radio/select option, number exponent/decimal/overflow, rapid toggle와 Enter submit을 다룹니다.",
    failureModes: "number input도 event target value는 string이고 implicit coercion은 empty를 zero처럼 다룰 수 있으며 stale object spread는 빠른 checkbox changes를 잃고 select option key omission은 warnings를 만듭니다.",
    verification: "source hash, control matrix, user-event keyboard/IME, parser corpus, rapid update, native submit/FormData와 server contract integration을 실행합니다.",
    operations: "field/schema 변화는 form version, validation reason code, privacy-safe completion/error metrics, compatibility adapter와 rollback을 운영합니다.",
    concepts: [
      c("control contract", "한 form control의 DOM value, canonical state, parse/format, validity, label과 submitted field를 정의한 계약입니다.", ["control별로 다릅니다.", "server contract와 연결합니다."]),
      c("raw input", "사용자가 편집 중 DOM control에 가진 string/checked/files 형태의 손실 없는 값입니다.", ["invalid 중간값도 보존할 수 있습니다.", "domain value와 다릅니다."]),
      c("canonical form state", "submit validation과 domain conversion의 기준이 되는 owner-managed field values와 meta state입니다.", ["raw/draft와 구분할 수 있습니다.", "version/reset policy가 있습니다."]),
    ],
    codeExamples: [node("react13-source-audit", "원본 form의 runtime 위험 inventory", "React13Audit.mjs", "source에서 관찰한 controls와 추가 qualification gaps를 executable counts로 요약합니다.", String.raw`const findings = [
  ["text-string", true],
  ["checkbox-boolean", true],
  ["select-option-key", false],
  ["submit-contract", false],
  ["number-parser", false],
  ["rapid-functional-update", false],
];
console.log("observed=" + findings.filter((x) => x[1]).length);
console.log("pending=" + findings.filter((x) => !x[1]).map((x) => x[0]).join(","));
console.log("ready=" + findings.every((x) => x[1]));`, "observed=2\npending=select-option-key,submit-contract,number-parser,rapid-functional-update\nready=false", ["local-form1", "local-form2", "local-form3", "local-form4", "local-temp-input", "local-temp-radio", "local-react-forms"])],
  }),
  appliedTopic({
    id: "native-form-submit-semantics", title: "native form·submit·button·FormData semantics를 React event와 연결합니다",
    lead: "form을 layout wrapper로만 쓰지 않고 Enter, submit button, browser validation, autofill와 progressive enhancement가 만나는 semantic transaction boundary로 설계합니다.",
    mechanism: "form submit event는 submit button activation이나 Enter로 발생하고 React handler는 필요할 때 preventDefault 후 validation/mutation을 시작합니다. button의 default type은 form 안에서 submit일 수 있으므로 모든 buttons의 intent를 명시합니다.",
    workflow: "semantic form/action/method 또는 client mutation owner를 정하고 label/name/autocomplete를 부여한 뒤 onSubmit 한 곳에서 FormData snapshot, schema validation, pending/idempotency와 result UI를 처리합니다.",
    invariants: "click handler만으로 submit을 우회하지 않고 keyboard/assistive technology path가 같으며 duplicate submit과 navigation behavior가 문서화됩니다.",
    edgeCases: "Enter in text/textarea, multiple submitters, disabled/readOnly, nested form invalidity, browser constraint validation, file fields, offline/retry와 back navigation을 다룹니다.",
    failureModes: "onClick만 연결하면 Enter submit이 reload하거나 무시되고 cancel button이 implicit submit하며 duplicate action이 server mutation을 두 번 만들 수 있습니다.",
    verification: "keyboard/mouse/assistive submit, FormData field names, preventDefault branch, native invalid focus, duplicate/idempotency, navigation/reset와 no-JS fallback을 test합니다.",
    operations: "submit success/failure/latency와 duplicate suppression을 action/reason/version으로 관찰하고 raw field values와 secrets는 telemetry에서 제외합니다.",
    concepts: [
      c("submitter", "form 제출을 시작한 button 또는 input control로 name/value와 form override attributes를 가질 수 있습니다.", ["Enter path를 확인합니다.", "event submitter로 구분합니다."]),
      c("FormData", "successful form controls의 name/value snapshot을 나타내는 browser interface입니다.", ["unchecked/disabled semantics가 있습니다.", "runtime schema가 여전히 필요합니다."]),
      c("progressive enhancement", "기본 HTML form navigation을 유지하면서 JavaScript가 loading/error/partial update를 개선하는 설계입니다.", ["framework contract에 맞춥니다.", "no-JS가 항상 필수는 아닙니다."]),
    ],
    codeExamples: [node("react13-submit-machine", "submit pending·duplicate·result state machine", "React13Submit.mjs", "동일 idempotency key의 중복 submit을 억제하고 success/error transition을 deterministic하게 실행합니다.", String.raw`function submit(state, event) {
  if (event.type === "submit" && state.phase === "pending") return { ...state, duplicate: true };
  if (event.type === "submit") return { phase: "pending", key: event.key, duplicate: false };
  if (event.type === "resolved" && state.phase === "pending") return { phase: "success", key: state.key, duplicate: state.duplicate };
  if (event.type === "rejected" && state.phase === "pending") return { phase: "error", key: state.key, duplicate: state.duplicate };
  return state;
}
let state = { phase: "idle" };
state = submit(state, { type: "submit", key: "k-1" });
state = submit(state, { type: "submit", key: "k-1" });
console.log(JSON.stringify(state));
console.log(JSON.stringify(submit(state, { type: "resolved" })));`, "{\"phase\":\"pending\",\"key\":\"k-1\",\"duplicate\":true}\n{\"phase\":\"success\",\"key\":\"k-1\",\"duplicate\":true}", ["react-form-action", "mdn-form", "html-form", "rfc-idempotency"])],
  }),
  appliedTopic({
    id: "controlled-uncontrolled", title: "controlled와 uncontrolled input의 source of truth·reset·performance를 선택합니다",
    lead: "모든 input에 무조건 state를 붙이거나 DOM에 전부 맡기지 않고 validation timing, cross-field derivation, native integration와 lifecycle에 맞춰 소유 방식을 결정합니다.",
    mechanism: "controlled input은 value/checked prop과 onChange가 React state를 authoritative하게 만들고 uncontrolled input은 defaultValue/defaultChecked 후 DOM이 current value를 보유해 ref/FormData로 읽습니다.",
    workflow: "실시간 derived UI·validation·conditional fields가 필요하면 controlled를 우선 검토하고 단순 large/native/file form은 uncontrolled 또는 field-local library architecture와 비교합니다.",
    invariants: "한 control이 mounted lifetime 중 controlled↔uncontrolled로 우연히 전환하지 않고 undefined/null policy와 reset source를 명시합니다.",
    edgeCases: "initial async data, null value, file input, browser autofill, form reset, key remount, number/date special values와 third-party widget을 다룹니다.",
    failureModes: "value가 undefined에서 string으로 바뀌면 controlled transition warning이 나고 props update마다 draft를 overwrite하면 user input이 사라집니다.",
    verification: "initial/missing/async/reset/autofill/file matrix, warning zero, ref/FormData read, rerender count와 user draft preservation을 test합니다.",
    operations: "form library 또는 React upgrade에서 control ownership/warnings/autofill/browser matrix와 persisted draft migration을 qualification합니다.",
    concepts: [
      c("controlled input", "React prop value/checked가 current value의 source of truth인 form control입니다.", ["onChange update가 필요합니다.", "state snapshot을 따릅니다."]),
      c("uncontrolled input", "초기 default 뒤 DOM이 current value를 소유하고 submit/ref에서 읽는 control입니다.", ["file input에 적합할 수 있습니다.", "React state와 자동 동기화되지 않습니다."]),
      c("control transition", "한 mounted input이 uncontrolled에서 controlled 또는 반대로 ownership mode를 바꾸는 변화입니다.", ["우연한 transition을 피합니다.", "warning과 data loss를 만들 수 있습니다."]),
    ],
  }),
  appliedTopic({
    id: "text-ime-normalization", title: "text input의 IME·selection·normalization과 validation timing을 관리합니다",
    lead: "onChange마다 trim·uppercase·filter를 강제하면 한국어 같은 composition 입력과 cursor가 깨질 수 있으므로 raw draft, display와 commit normalization을 분리합니다.",
    mechanism: "browser text control은 compositionstart/update/end, input/change와 selection을 관리합니다. React onChange는 현재 value를 전달하지만 즉시 destructive normalization하면 composing sequence와 caret가 달라집니다.",
    workflow: "editing 중 raw string을 보존하고 length/resource limits와 safe feedback만 제공하며 blur/submit 또는 composition end에서 domain normalization·schema validation을 수행합니다.",
    invariants: "user가 입력 가능한 intermediate string을 허용하고 validation message가 typing을 막지 않으며 accessible description/live policy와 server revalidation을 둡니다.",
    edgeCases: "IME composition, emoji/grapheme, combining characters, paste, autofill, leading/trailing whitespace, newline, very large input와 password manager를 다룹니다.",
    failureModes: "code-unit substring은 emoji를 자르고 every keystroke trim은 space entry/caret를 깨며 regex replacement가 visually similar Unicode와 security policy를 놓칩니다.",
    verification: "real browser IME/paste/autofill, grapheme corpus, cursor selection, max length/resource limits, accessible validation와 server normalization parity를 test합니다.",
    operations: "normalization/security policy 변화는 stored/display/search compatibility와 migration, locale별 error metrics, rollback을 둡니다.",
    concepts: [
      c("composition event", "IME가 여러 keystrokes를 하나의 text sequence로 조립하는 동안 발생하는 browser event lifecycle입니다.", ["commit 전 중간값이 있습니다.", "destructive transform을 피합니다."]),
      c("raw draft", "편집 중 user intent를 손실 없이 보존하는 string state입니다.", ["domain normalized value와 다릅니다.", "invalid 중간값을 허용합니다."]),
      c("grapheme cluster", "사용자가 한 글자로 인식하는 Unicode code points 묶음입니다.", ["string length/code units와 다릅니다.", "UI length 정책을 명시합니다."]),
    ],
    codeExamples: [node("react13-text-normalize", "raw draft와 submit normalization 분리", "React13Text.mjs", "typing 단계에서는 spaces를 보존하고 submit에서만 Unicode normalization/trim/limit을 적용합니다.", String.raw`function normalize(raw) {
  const text = raw.normalize("NFC").trim();
  if (text.length === 0) return { ok: false, code: "required" };
  if ([...text].length > 12) return { ok: false, code: "too-long" };
  return { ok: true, value: text };
}
const raw = "  Cafe\u0301  ";
console.log("raw=" + JSON.stringify(raw));
console.log(JSON.stringify(normalize(raw)));
console.log(JSON.stringify(normalize("   ")));`, "raw=\"  Café  \"\n{\"ok\":true,\"value\":\"Café\"}\n{\"ok\":false,\"code\":\"required\"}", ["react-input", "mdn-composition", "unicode-normalization", "local-form1"])],
  }),
  appliedTopic({
    id: "number-raw-parse-format", title: "number input의 string draft와 domain number parse·precision을 분리합니다",
    lead: "type=number가 JavaScript number state를 자동 보장하지 않으므로 empty, minus, decimal, exponent와 locale expression을 잃지 않는 parser/formatter contract를 만듭니다.",
    mechanism: "input event target value는 string이고 valueAsNumber는 invalid/empty에 NaN을 반환할 수 있습니다. editing raw string을 유지하고 domain commit에서 finite/range/scale를 검사합니다.",
    workflow: "raw draft→syntax parser→finite numeric value→domain range/unit conversion→display formatter 순서를 만들고 currency/decimal은 binary floating-point suitability를 별도 평가합니다.",
    invariants: "implicit multiplication/coercion과 truthiness로 empty/zero를 구분하지 않고 NaN/Infinity/-0, range와 precision policy를 explicit results로 처리합니다.",
    edgeCases: "empty, '-', '.', '1.', exponent, leading zeros, comma locale, huge exponent, negative zero, step mismatch와 mobile inputMode를 다룹니다.",
    failureModes: "msg ? branch는 valid zero를 empty처럼 숨기고 Number('')는 0이며 toFixed는 string을 반환해 이후 arithmetic/type contract가 흔들립니다.",
    verification: "raw syntax corpus, finite/range/scale, zero/empty, round-trip tolerance, locale/browser input와 server numeric schema를 test합니다.",
    operations: "precision/unit policy 변경은 stored values, API schema와 formatted UI compatibility migration과 reconciliation을 포함합니다.",
    concepts: [
      c("numeric draft", "편집 가능한 number-like string으로 domain number가 되기 전 중간 상태입니다.", ["empty/minus를 보존합니다.", "validation과 분리합니다."]),
      c("finite number", "NaN과 ±Infinity가 아닌 JavaScript Number value입니다.", ["Number.isFinite로 확인합니다.", "range/scale도 별도입니다."]),
      c("parse/format round-trip", "canonical numeric value를 display하고 다시 parse했을 때 허용 tolerance 안에서 같은 의미를 얻는 성질입니다.", ["binary float caveat가 있습니다.", "locale 정책을 고정합니다."]),
    ],
    codeExamples: [node("react13-number-parser", "empty·finite·range를 구분하는 number parser", "React13Number.mjs", "implicit coercion 없이 numeric drafts를 stable result codes로 parse합니다.", String.raw`function parse(raw) {
  if (raw.trim() === "") return { ok: false, code: "empty" };
  const value = Number(raw);
  if (!Number.isFinite(value)) return { ok: false, code: "not-finite" };
  if (value < -100 || value > 100) return { ok: false, code: "range" };
  return { ok: true, value: Object.is(value, -0) ? 0 : value };
}
for (const raw of ["", "0", "-0", "12.5", "1e309", "101"]) {
  console.log(raw + "=" + JSON.stringify(parse(raw)));
}`, "={\"ok\":false,\"code\":\"empty\"}\n0={\"ok\":true,\"value\":0}\n-0={\"ok\":true,\"value\":0}\n12.5={\"ok\":true,\"value\":12.5}\n1e309={\"ok\":false,\"code\":\"not-finite\"}\n101={\"ok\":false,\"code\":\"range\"}", ["react-input", "mdn-value-as-number", "mdn-number", "local-temp-input", "local-form4"])],
  }),
  appliedTopic({
    id: "checkbox-radio-select", title: "checkbox·radio·select의 checked/value/group/option contract를 설계합니다",
    lead: "모든 control을 e.target.value 하나로 처리하지 않고 boolean, finite choice와 multi-selection의 distinct DOM semantics를 state type과 맞춥니다.",
    mechanism: "single checkbox current state는 checked boolean, radio group은 같은 name 중 선택된 value, select는 selected option value, multi-select는 selected options collection입니다.",
    workflow: "allowed option codes와 user labels를 분리해 stable key/value를 주고 event value를 allowlist parser로 검증해 canonical boolean/enum/set state를 업데이트합니다.",
    invariants: "admin 같은 authorization role을 client select로 신뢰하지 않고 unknown value를 거부하며 option keys/values와 labels/accessibility group semantics를 명시합니다.",
    edgeCases: "no selection, disabled option, unknown old value, dynamic options, same label different code, checkbox tri-state/indeterminate, reorder와 multi-select를 다룹니다.",
    failureModes: "checkbox value를 boolean으로 오해하고 option value 누락으로 label이 API code가 되며 client role selection을 server authorization에 사용하면 privilege escalation이 생깁니다.",
    verification: "checked/value type assertions, unknown/tampered option, group keyboard navigation, dynamic removal, FormData and server authorization negative tests를 둡니다.",
    operations: "option catalog version/deprecation/localization과 stored old codes를 migration하고 unknown selection metrics와 fallback UX를 운영합니다.",
    concepts: [
      c("checked state", "checkbox/radio control의 boolean selection property입니다.", ["value string과 다릅니다.", "controlled에는 checked를 사용합니다."]),
      c("option code", "display label과 분리된 stable finite domain identifier입니다.", ["allowlist validation을 합니다.", "locale change에도 유지합니다."]),
      c("selection set", "다중 checkbox/select에서 chosen option codes를 중복 없이 나타내는 canonical collection입니다.", ["immutable update를 사용합니다.", "order 필요 여부를 명시합니다."]),
    ],
    codeExamples: [node("react13-choice-parser", "finite radio/select option과 tampering 거부", "React13Choices.mjs", "synthetic role가 아닌 harmless theme codes를 allowlist로 parse합니다.", String.raw`const options = new Set(["system", "light", "dark"]);
function choose(raw) {
  return options.has(raw) ? { ok: true, value: raw } : { ok: false, code: "unknown-option" };
}
for (const raw of ["light", "admin", "", "system"]) {
  console.log(raw + "=" + JSON.stringify(choose(raw)));
}`, "light={\"ok\":true,\"value\":\"light\"}\nadmin={\"ok\":false,\"code\":\"unknown-option\"}\n={\"ok\":false,\"code\":\"unknown-option\"}\nsystem={\"ok\":true,\"value\":\"system\"}", ["local-form1", "local-form2", "react-select", "react-input", "owasp-authorization"])],
  }),
  appliedTopic({
    id: "multi-field-functional-update", title: "다중 field object와 dynamic checkbox를 함수형 불변 update로 처리합니다",
    lead: "event handler가 render snapshot의 checked object를 spread하면 연속 updates에서 old snapshot을 재사용할 수 있으므로 previous state 기반 transition과 field allowlist를 사용합니다.",
    mechanism: "computed property name으로 one field를 update할 수 있지만 setState(next) calculation이 current state에 의존하면 updater function prev=>next를 사용해 queued updates를 순서대로 적용합니다.",
    workflow: "field definitions를 component 밖 stable data로 두고 event에서 name/value를 schema로 validate한 뒤 functional update로 changed path만 copy하고 derived selected labels는 render에서 계산합니다.",
    invariants: "user-controlled name이 arbitrary object key/prototype를 쓰지 않도록 allowed field codes를 검사하고 canonical state와 selected summary를 중복 저장하지 않습니다.",
    edgeCases: "rapid two toggles, same field toggle twice, dynamic field addition/removal, prototype keys, stale option catalog, reset and optimistic server sync를 다룹니다.",
    failureModes: "setChecked({...checked,...}) 연속 호출은 이전 change를 덮을 수 있고 unvalidated name은 unexpected fields를 만들며 selectedItems state 복제는 drift합니다.",
    verification: "queued rapid updates, property-order independence, prototype key rejection, option catalog migration, derived summary와 reset tests를 실행합니다.",
    operations: "form schema fields/version과 persisted draft migration, unknown field telemetry, large form render/validation latency budget을 운영합니다.",
    concepts: [
      c("functional updater", "이전 state snapshot을 받아 다음 state를 반환하는 queued update function입니다.", ["current state 의존 update에 사용합니다.", "순수해야 합니다."]),
      c("computed property", "runtime key expression을 object property name으로 사용하는 JavaScript syntax입니다.", ["allowlist가 필요할 수 있습니다.", "immutable copy와 결합합니다."]),
      c("derived selection", "canonical checked map/set에서 filter/map으로 계산하는 표시·submit projection입니다.", ["별도 state로 중복 저장하지 않습니다.", "catalog와 함께 계산합니다."]),
    ],
    codeExamples: [node("react13-functional-checks", "연속 checkbox functional updates와 unknown field 거부", "React13Checks.mjs", "queued events를 previous state에 순서대로 적용해 두 changes를 모두 보존합니다.", String.raw`const allowed = new Set(["alpha", "beta", "gamma"]);
function update(previous, name, checked) {
  if (!allowed.has(name)) return { state: previous, error: "unknown-field" };
  return { state: { ...previous, [name]: checked }, error: null };
}
let state = { alpha: false, beta: false, gamma: false };
for (const [name, checked] of [["alpha", true], ["beta", true], ["__proto__", true]]) {
  const result = update(state, name, checked);
  state = result.state;
  console.log(name + ":" + (result.error || JSON.stringify(state)));
}`, "alpha:{\"alpha\":true,\"beta\":false,\"gamma\":false}\nbeta:{\"alpha\":true,\"beta\":true,\"gamma\":false}\n__proto__:unknown-field", ["local-form3", "react-queue-state", "react-updating-objects", "mdn-computed-property"])],
  }),
  appliedTopic({
    id: "derived-conversion-precision", title: "온도 같은 derived conversion을 parse·unit·precision·display pipeline으로 만듭니다",
    lead: "입력 string에 arithmetic operator를 적용해 implicit conversion하고 toFixed 문자열을 state처럼 다루지 않고 canonical unit/value와 reversible formatting policy를 설계합니다.",
    mechanism: "raw numeric draft를 finite value로 parse하고 canonical unit으로 normalize한 뒤 target unit을 pure function으로 계산하며 rounding은 display boundary에서만 적용합니다.",
    workflow: "unit codes를 stable enum으로 두고 parse result가 success일 때만 convert하며 empty/invalid에는 명확한 placeholder/error를 보여 주고 unit switch 때 raw/canonical ownership을 결정합니다.",
    invariants: "zero는 valid value, empty는 no value이고 conversion 내부는 number를 유지하며 display toFixed/Intl 결과 string을 다시 계산 입력으로 사용하지 않습니다.",
    edgeCases: "absolute minimum, huge values, -0, repeated unit toggles, rounding drift, locale decimal separator와 invalid partial input을 다룹니다.",
    failureModes: "truthiness가 zero를 숨기고 repeated rounded conversions가 drift하며 unit label과 value meaning이 잠시 어긋날 수 있습니다.",
    verification: "known points, zero/empty, inverse round-trip tolerance, repeated toggles, display precision/locales와 domain bounds를 property/golden tests로 검증합니다.",
    operations: "unit/precision policy 변화는 saved drafts/API/output compatibility와 analytics dimension을 versioning하고 rollback formatter를 둡니다.",
    concepts: [
      c("canonical unit", "내부 계산과 저장에 일관되게 사용하는 기준 measurement unit입니다.", ["display unit과 분리합니다.", "conversion source를 고정합니다."]),
      c("display rounding", "user-visible text precision을 위해 final representation에서 수행하는 rounding/formatting입니다.", ["domain calculation을 바꾸지 않습니다.", "string result입니다."]),
      c("round-trip tolerance", "unit A→B→A 또는 format→parse가 허용 error 범위 안에서 원래 의미를 보존하는 조건입니다.", ["floating-point를 고려합니다.", "exact equality만 요구하지 않습니다."]),
    ],
    codeExamples: [node("react13-temperature", "canonical temperature conversion과 display rounding", "React13Temperature.mjs", "zero를 포함한 known points를 number로 변환하고 final text에서만 한 자리 rounding합니다.", String.raw`function cToF(celsius) { return celsius * 9 / 5 + 32; }
function fToC(fahrenheit) { return (fahrenheit - 32) * 5 / 9; }
for (const celsius of [0, 100, -40]) {
  const fahrenheit = cToF(celsius);
  const back = fToC(fahrenheit);
  console.log(celsius + "C=" + fahrenheit.toFixed(1) + "F,back=" + back.toFixed(1));
}`, "0C=32.0F,back=0.0\n100C=212.0F,back=100.0\n-40C=-40.0F,back=-40.0", ["local-form4", "local-temp-input", "local-temp-radio", "nist-si"])],
  }),
  appliedTopic({
    id: "form-accessibility-security", title: "label·error·autocomplete·privacy와 server validation을 form contract에 포함합니다",
    lead: "controlled state가 맞다는 것만으로 usable form이 되지 않으므로 accessible naming, grouped choices, error focus, sensitive autofill/storage와 trust boundary를 함께 설계합니다.",
    mechanism: "native label/fieldset/legend, id/for, name/autocomplete와 describedby/error associations가 keyboard, browser autofill와 assistive technology에 control purpose·state를 전달합니다.",
    workflow: "field purpose와 sensitivity를 inventory하고 native semantics, instructions, inline/summary errors, focus management, pending/result announcements와 server response field errors를 하나의 flow로 만듭니다.",
    invariants: "placeholder를 label로 대체하지 않고 color만으로 validity를 표현하지 않으며 password/token/PII를 URL, client logs, analytics, persisted drafts나 DOM data attributes에 두지 않습니다.",
    edgeCases: "multiple same errors, dynamic fields, server general vs field error, screen reader live timing, autofill, password manager, session timeout, reload/back와 localization을 다룹니다.",
    failureModes: "client enum/required check만 믿으면 tampered requests가 통과하고 error가 label과 연결되지 않으면 users가 무엇을 고칠지 모르며 raw field logging이 privacy incident를 만듭니다.",
    verification: "role/name/description queries, keyboard/zoom/screen reader, malicious/tampered request, server field/global error mapping, forbidden logs/storage/URL와 session reset을 test합니다.",
    operations: "validation reason과 completion funnel은 sensitive values 없이 관찰하고 accessibility/security regression, retention/deletion와 incident runbook을 운영합니다.",
    concepts: [
      c("accessible label", "control의 목적을 programmatically 연결해 accessibility name 계산에 기여하는 text입니다.", ["placeholder와 다릅니다.", "visible label을 선호합니다."]),
      c("field error contract", "어떤 field/path와 stable code/message/action이 연결되는지 정의한 client-server validation 결과입니다.", ["generic error와 구분합니다.", "focus/description에 연결합니다."]),
      c("trust boundary", "browser-controlled input이 server-authoritative domain operation으로 넘어가기 전에 authentication, authorization와 validation을 다시 수행하는 경계입니다.", ["client check를 신뢰하지 않습니다.", "CSRF/idempotency도 고려합니다."]),
    ],
  }),
  appliedTopic({
    id: "reset-draft-release", title: "reset·async defaults·draft persistence와 form release lifecycle을 운영합니다",
    lead: "입력 후 성공만 보지 않고 route/entity change, cancel, server defaults, unsaved changes, refresh, multi-tab와 schema version migration에서 어떤 값을 보존·폐기할지 명시합니다.",
    mechanism: "form has base server version, raw/canonical fields, dirty/touched/errors, submit phase와 optional persisted draft를 가지며 reset은 어느 baseline으로 돌아갈지 정한 explicit transition입니다.",
    workflow: "create/edit/copy mode별 initialization을 정의하고 async load가 pristine draft에만 적용되는지, dirty conflict는 prompt/rebase/discard하는지, success 후 reset/navigation을 어떻게 하는지 설계합니다.",
    invariants: "entity id/version이 바뀌면 old draft를 잘못 적용하지 않고 persisted draft에는 schema/version/owner/expiry가 있으며 sensitive fields는 저장하지 않습니다.",
    edgeCases: "late server response, route switch, double tab, offline, stale ETag, partial save, browser back/restore, schema field rename와 expired session을 다룹니다.",
    failureModes: "Effect로 props를 항상 form state에 복사하면 user edits를 덮고 localStorage draft가 다른 user/entity에 노출되며 old schema가 invalid submission을 만듭니다.",
    verification: "pristine/dirty async update, entity/version switch, cancel/reset, draft owner/expiry/schema migration, multi-tab conflict와 logout deletion tests를 실행합니다.",
    operations: "draft schema migration, retention/deletion, conflict/error rate와 abandonment를 privacy-safe하게 관찰하고 feature flag/rollback cleanup을 둡니다.",
    concepts: [
      c("form baseline", "edit 시작 시 server/entity version과 initial field values의 immutable reference입니다.", ["dirty diff 기준입니다.", "async changes와 구분합니다."]),
      c("dirty state", "현재 draft가 baseline과 의미적으로 다른지 나타내는 derived/managed meta state입니다.", ["touched와 다릅니다.", "navigation guard에 사용합니다."]),
      c("draft schema version", "persisted form draft의 field shape와 migration compatibility를 나타내는 version입니다.", ["owner/entity/expiry와 함께 저장합니다.", "secret fields를 제외합니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "local-form1", repository: "D:/dev/my-app01", path: "src/pages/step10-form/FormSample01.jsx", usedFor: ["native controlled controls", "option key gap", "no submit"], evidence: "2026-07-14 read-only audit: 54 lines, 1,888 bytes, SHA-256 188527F7D90BF37A0098A742734D1335CC985A957D0621BE841F53458632BD02. 실제 display strings는 복사하지 않았습니다." },
  { id: "local-form2", repository: "D:/dev/my-app01", path: "src/pages/step10-form/FormSample02.jsx", usedFor: ["MUI controlled fields", "choice groups"], evidence: "2026-07-14 read-only audit: 81 lines, 2,931 bytes, SHA-256 18EBEC51F418F06276499585C923C8E86DFC4226F53892FC76BC1770B4FC68E1." },
  { id: "local-form3", repository: "D:/dev/my-app01", path: "src/pages/step10-form/FormSample03.jsx", usedFor: ["checkbox object", "derived selection", "non-functional spread"], evidence: "2026-07-14 read-only audit: 58 lines, 2,242 bytes, SHA-256 3D07B45FA295C589418CF02E5A5D14389F3D02E609E2CE8FEECA7EC01DF5AA57. 실제 menu values는 사용하지 않았습니다." },
  { id: "local-form4", repository: "D:/dev/my-app01", path: "src/pages/step10-form/FormSample04.jsx", usedFor: ["lifted temperature draft", "implicit numeric conversion", "toFixed"], evidence: "2026-07-14 read-only audit: 30 lines, 1,014 bytes, SHA-256 2D329D2C0E5FA8B206DDF24CDBA2594091D719A2D7E9ADC41FA2110A6EDBBD13." },
  { id: "local-temp-input", repository: "D:/dev/my-app01", path: "src/pages/step10-form/TempInput.jsx", usedFor: ["number input string", "callback prop"], evidence: "2026-07-14 read-only audit: 12 lines, 306 bytes, SHA-256 41675773ED016C44409458481231F2F8088DBD85AA17BB672D8A524432478BEA." },
  { id: "local-temp-radio", repository: "D:/dev/my-app01", path: "src/pages/step10-form/TempRadio.jsx", usedFor: ["radio checked/value", "unit callback"], evidence: "2026-07-14 read-only audit: 22 lines, 652 bytes, SHA-256 558979A6C051002E4366D959D35FEEBDECCECF6603EE51E1F118501126BC99D9. 실제 locale labels는 example에서 stable codes로 대체했습니다." },
  { id: "local-react-forms", repository: "D:/dev/REACT", path: "docs/react/04-events-forms.md", usedFor: ["existing form walkthrough", "source-to-result context"], evidence: "2026-07-14 read-only audit: 282 lines, 11,153 bytes, SHA-256 4705EA901D97ED2576EA7214D389826BC172C4E1619EE262A0B15FDAEFF8DD44." },
  { id: "react-input", repository: "React DOM official API", path: "reference/react-dom/components/input", publicUrl: "https://react.dev/reference/react-dom/components/input", usedFor: ["controlled input", "value/checked/onChange", "caveats"], evidence: "current input API와 controlled/uncontrolled caveats를 확인했습니다." },
  { id: "react-select", repository: "React DOM official API", path: "reference/react-dom/components/select", publicUrl: "https://react.dev/reference/react-dom/components/select", usedFor: ["select value/defaultValue", "option semantics"], evidence: "select controlled contract and multiple selection을 확인했습니다." },
  { id: "react-form-action", repository: "React DOM official API", path: "reference/react-dom/components/form", publicUrl: "https://react.dev/reference/react-dom/components/form", usedFor: ["form action/submit semantics", "progressive enhancement"], evidence: "React form component current action/submit behavior를 확인했습니다." },
  { id: "react-queue-state", repository: "React official documentation", path: "learn/queueing-a-series-of-state-updates", publicUrl: "https://react.dev/learn/queueing-a-series-of-state-updates", usedFor: ["batching", "functional updater"], evidence: "queued state updates와 updater functions를 확인했습니다." },
  { id: "react-updating-objects", repository: "React official documentation", path: "learn/updating-objects-in-state", publicUrl: "https://react.dev/learn/updating-objects-in-state", usedFor: ["object spread", "immutability"], evidence: "object state immutable update guidance를 확인했습니다." },
  { id: "mdn-form", repository: "MDN Web Docs", path: "Web/HTML/Reference/Elements/form", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form", usedFor: ["native form semantics", "submission attributes"], evidence: "HTML form element semantics를 확인했습니다." },
  { id: "html-form", repository: "WHATWG HTML Living Standard", path: "forms.html", publicUrl: "https://html.spec.whatwg.org/multipage/forms.html", usedFor: ["successful controls", "form submission/validation"], evidence: "current HTML form controls and submission algorithm을 확인했습니다." },
  { id: "mdn-composition", repository: "MDN Web Docs", path: "Web/API/Element/compositionstart_event", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event", usedFor: ["IME composition lifecycle"], evidence: "composition event semantics를 확인했습니다." },
  { id: "unicode-normalization", repository: "Unicode Standard Annex 15", path: "reports/tr15", publicUrl: "https://www.unicode.org/reports/tr15/", usedFor: ["Unicode normalization forms"], evidence: "Unicode normalization conformance를 확인했습니다." },
  { id: "mdn-value-as-number", repository: "MDN Web Docs", path: "Web/API/HTMLInputElement/valueAsNumber", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/valueAsNumber", usedFor: ["number input numeric view", "NaN cases"], evidence: "valueAsNumber runtime behavior를 확인했습니다." },
  { id: "mdn-number", repository: "MDN Web Docs", path: "JavaScript/Reference/Global_Objects/Number", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number", usedFor: ["Number conversion", "finite/precision"], evidence: "Number conversion and IEEE-754 caveats를 확인했습니다." },
  { id: "mdn-computed-property", repository: "MDN Web Docs", path: "JavaScript/Reference/Operators/Object_initializer#computed_property_names", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#computed_property_names", usedFor: ["dynamic field key updates"], evidence: "computed property name syntax를 확인했습니다." },
  { id: "nist-si", repository: "NIST Special Publication 330", path: "pml/special-publication-330", publicUrl: "https://www.nist.gov/pml/special-publication-330", usedFor: ["measurement unit provenance", "SI context"], evidence: "SI measurement reference context를 확인했습니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["server-side authorization", "deny by default"], evidence: "client field가 authorization을 대신하지 않는 원칙을 확인했습니다." },
  { id: "rfc-idempotency", repository: "IETF RFC 9110", path: "rfc9110.html#name-idempotent-methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods", usedFor: ["HTTP idempotency semantics", "duplicate submission context"], evidence: "HTTP idempotent method semantics를 확인했습니다." },
];

const session = createExpertSession({
    inventoryId: "react-13-form-checkbox-radio-select", slug: "react-13-controlled-form",
  courseId: "react", moduleId: "react-events-forms-hooks", order: 3,
  title: "controlled form과 입력 상태 모델", subtitle: "text·number·checkbox·radio·select·submit을 raw draft, canonical state, schema와 접근 가능한 transaction flow로 연결합니다.",
  level: "중급", estimatedMinutes: 125,
  coreQuestion: "DOM control의 편집 중 값을 잃지 않으면서 type-safe domain value, accessible validation과 중복 없는 server submission으로 어떻게 전환할까요?",
  summary: "my-app01의 FormSample01~04, TempInput/TempRadio와 REACT form 설명을 read-only로 감사해 controlled text/checkbox/radio/select, object checkbox state와 온도 변환 흐름을 보존합니다. native submit/FormData, controlled/uncontrolled ownership, IME/raw text, number string parsing, finite choices, functional multi-field updates, canonical unit/rounding, accessibility/security와 reset/draft lifecycle까지 current official sources와 일곱 Node examples로 확장합니다. 원본의 실제 menu/user/unit strings를 공개 example에 복사하지 않고 missing option key, no-submit, stale spread, truthiness-zero와 implicit numeric coercion을 실행 가능한 반례와 production gates로 교정합니다.",
  objectives: ["원본 control별 DOM/state/validation gaps를 inventory한다.", "native form/submit/button/FormData semantics를 적용한다.", "controlled와 uncontrolled ownership/reset을 선택한다.", "IME와 Unicode를 보존하는 text draft를 설계한다.", "number raw string과 finite domain value를 분리한다.", "checkbox/radio/select의 checked/value/option contract를 구현한다.", "다중 field를 functional immutable updates로 처리한다.", "unit conversion과 display rounding을 pure derived pipeline으로 만든다.", "accessible error, server validation, privacy와 draft lifecycle을 운영한다."],
  prerequisites: [{ title: "state batching과 함수형 업데이트", reason: "form event가 만드는 여러 state updates와 previous-state updater를 이해해야 rapid input과 multi-field object를 손실 없이 관리할 수 있습니다.", sessionSlug: "react-12-state-batching-functional-update" }],
  keywords: ["form", "controlled input", "uncontrolled", "FormData", "submit", "IME", "number parser", "checkbox", "radio", "select", "functional update", "validation", "accessibility"],
  topics,
  lab: {
    title: "원본 다중 control·온도 변환기를 schema-driven accessible form으로 qualification하기",
    scenario: "원본 files는 변경하지 않고 synthetic option codes와 fixed fixtures를 사용하는 React/browser/server adapter에서 editing, submit, error, reset과 draft migration을 검증합니다.",
    setup: ["Node 20 이상", "React development/production fixture", "current browsers with IME", "Testing Library/user-event compatible DOM", "disposable mock server with idempotency", "원본 7 files read-only", "synthetic non-sensitive fields"],
    steps: ["원본 7 files hash와 control contract/gaps를 기록합니다.", "field별 raw/canonical type, parser/formatter, allowed values와 error code를 정의합니다.", "semantic form/name/label/autocomplete/fieldset와 one onSubmit boundary를 구현합니다.", "missing/undefined/null/false/zero/IME/paste/autofill input corpus를 실행합니다.", "numeric empty/finite/range/precision과 temperature inverse round-trip을 test합니다.", "checkbox/radio/select unknown/tampered options와 rapid functional updates를 검증합니다.", "client schema와 server validation/authorization/field errors를 end-to-end 매핑합니다.", "pending/duplicate/idempotency/cancel/retry와 accessible announcements를 test합니다.", "async defaults, dirty conflict, reset/entity switch와 versioned draft를 검증합니다.", "production build browser/a11y/security telemetry canary와 rollback을 rehearsal합니다."],
    expectedResult: ["모든 control이 정확한 raw/canonical type과 ownership을 가집니다.", "IME, zero, empty, rapid input와 unknown option이 data loss 없이 처리됩니다.", "keyboard/Enter/autofill와 error focus/description이 접근 가능하게 작동합니다.", "tampered/duplicate submissions가 server boundary에서 안전하게 거부·deduplicate됩니다.", "reset/draft/schema migration과 rollback이 user/entity isolation을 보존합니다."],
    cleanup: ["temporary builds, mock server, browser storage/drafts와 reports를 제거합니다.", "synthetic options, idempotency keys와 malicious corpus를 폐기합니다.", "fake clocks/locales/verbose form tracing을 원복합니다.", "원본 7 files hash/status unchanged를 확인합니다."],
    extensions: ["React action/useActionState 기반 form과 client controlled flow를 비교합니다.", "schema metadata에서 fields, parsers와 server DTO를 생성합니다.", "decimal/currency library와 locale-aware number input을 추가합니다.", "offline draft encryption, multi-tab conflict와 resumable file upload를 설계합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 실제 browser control 결과와 대응시키세요.", requirements: ["stdout 완전 일치", "submit state", "IME normalization", "zero/empty parser", "choice allowlist", "functional update", "temperature round-trip", "model/browser 범위 구분"], hints: ["type=number의 value를 number라고 가정하지 마세요."], expectedOutcome: "DOM draft에서 validated submission까지의 pipeline을 설명합니다.", solutionOutline: ["audit→control ownership→parse/choose/update→derive→submit/a11y 순서입니다."] },
    { difficulty: "응용", prompt: "원본 FormSample01·03·04를 하나의 production-safe form으로 통합하세요.", requirements: ["semantic submit", "schema-driven fields", "raw/canonical split", "functional checkboxes", "unit precision", "tamper/server validation", "accessible errors/pending", "reset/draft version"], hints: ["client role select를 authorization 근거로 쓰지 마세요."], expectedOutcome: "rapid input와 실패/재시도에도 일관된 accessible form이 완성됩니다.", solutionOutline: ["contracts→state machine→controls→server→errors→lifecycle 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React form architecture·release 표준을 작성하세요.", requirements: ["controlled/uncontrolled criteria", "raw/parse/format schema", "IME/Unicode", "number/choice semantics", "submit/idempotency", "a11y/security/privacy", "draft/reset/migration", "browser/server/canary/rollback gates"], hints: ["UI library prop 목록이 아니라 input data lifecycle을 정의하세요."], expectedOutcome: "form 생성부터 server mutation과 data deletion까지 감사 가능한 표준이 완성됩니다.", solutionOutline: ["classify→edit→validate→submit→announce→persist/reset→operate 순서입니다."] },
  ],
  nextSessions: ["react-14-form-validation-errors"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["원본의 실제 menu/user/unit display strings는 synthetic codes로 대체하고 control structure와 defects만 provenance로 사용했습니다.", "원본은 form submit/server contract, IME, runtime schema, accessible errors, authorization, draft migration과 operation evidence가 충분하지 않아 official sources와 synthetic models로 보강했습니다.", "Node examples는 actual React event batching, browser form algorithms/IME/autofill/accessibility와 server validation을 대체하지 않으므로 lab integration을 요구합니다.", "복잡한 validation, Effect synchronization, refs와 custom hooks는 React14 이후 세션에서 별도 심화합니다."] },
});

export default session;
