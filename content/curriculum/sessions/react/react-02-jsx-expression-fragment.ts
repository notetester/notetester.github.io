import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-jsx-audit", title: "원본 JSX 예제를 syntax·runtime·accessibility 위험으로 감사합니다",
    lead: "Book·Library·Clock·Comment·CommentList를 실행 가능한 학습 흐름으로 보존하면서 문자열 숫자, 비결정적 시간, 외부 image, 빈 alt와 index key가 가르치는 범위를 정확히 제한합니다.",
    mechanism: "원본은 Fragment와 expressions, props, object style, Date 생성, array map을 단계적으로 보여 주지만 compiler mode·runtime prop type·identity·sanitization·accessible name까지 자동 설명하지는 않습니다.",
    workflow: "각 파일의 hash와 현재 render tree 연결 여부를 기록하고 JSX syntax fact, JavaScript runtime value, React reconciliation behavior와 browser DOM/accessibility 결과를 별도 열로 분해합니다.",
    invariants: "공개 예제는 synthetic text만 사용하고 source file은 read-only이며, 설명하는 모든 화면 결과는 현재 entry tree 또는 isolated component test에서 실제로 관찰되어야 합니다.",
    edgeCases: "문자열 page count, invalid Date/locale, missing image, empty alt, reordered comments, duplicate text, null child와 style null/zero를 포함합니다.",
    failureModes: "주석으로 보존된 code를 현재 화면이라고 오해하거나 index key로 state가 다른 row에 붙고, 외부 placeholder availability와 local timezone 때문에 결과가 기계마다 달라질 수 있습니다.",
    verification: "source hash audit, transform snapshot, component render, DOM/accessibility query, reorder identity test와 deterministic timezone fixture를 단계별로 실행합니다.",
    operations: "compiler/React/browser upgrade 때 JSX transform, warning, output tree와 accessibility regression을 다시 qualification하고 external assets는 owned/proxied asset policy로 관리합니다.",
    concepts: [
      c("structural provenance", "원본의 tag·expression·prop·map 구조만 학습 근거로 사용하고 실제 domain strings는 복사하지 않는 추적 방식입니다.", ["hash와 path를 고정합니다.", "runtime은 별도 검증합니다."]),
      c("render fixture", "한 component를 통제된 props·locale·clock·asset environment에서 실제 render하는 재현 가능한 시험 입력입니다.", ["source만 읽는 것과 다릅니다.", "DOM 결과를 남깁니다."]),
      c("identity hazard", "보이는 text는 같아도 unstable key나 component type 변화로 state/DOM identity가 잘못 연결되는 위험입니다.", ["reorder로 드러납니다.", "후속 list 세션과 연결됩니다."]),
    ],
    codeExamples: [node("react02-audit-table", "source observation과 runtime verification 분리", "React02Audit.mjs", "다섯 원본 예제의 관찰 사실과 추가 검증 필요 항목을 stable audit code로 요약합니다.", String.raw`const findings = [
  ["fragment", true, true],
  ["quoted-number", true, false],
  ["clock-determinism", true, false],
  ["image-accessibility", true, false],
  ["reorder-identity", true, false],
];
console.log("observed=" + findings.filter((x) => x[1]).length);
console.log("verified=" + findings.filter((x) => x[2]).length);
console.log("pending=" + findings.filter((x) => !x[2]).map((x) => x[0]).join(","));`, "observed=5\nverified=1\npending=quoted-number,clock-determinism,image-accessibility,reorder-identity", ["local-book", "local-library", "local-clock", "local-comment", "local-comment-list", "local-react-jsx"])],
  }),
  appliedTopic({
    id: "jsx-transform-runtime", title: "JSX parse·transform·element 생성과 runtime boundary를 추적합니다",
    lead: "HTML 같은 표면 문법 아래에서 compiler가 type, props와 children을 가진 element descriptions로 변환하는 과정을 이해해 transform configuration과 runtime 오류를 분리합니다.",
    mechanism: "JSX parser는 lowercase host tag와 uppercase component reference, attributes, spread와 children을 읽어 configured classic 또는 automatic runtime calls로 변환하며 결과는 DOM node가 아닌 immutable-like description입니다.",
    workflow: "source JSX, transformed JavaScript, created element shape, React render tree와 committed DOM을 순서대로 비교하고 어느 layer에서 error가 발생했는지 표시합니다.",
    invariants: "transform mode와 runtime packages가 일치하고 component identifiers는 scope에 존재하며 render phase에서는 element description을 mutation하거나 DOM처럼 다루지 않습니다.",
    edgeCases: "unknown lowercase custom tag, undefined uppercase component, duplicate props after spread, namespace-like names, development transform metadata와 unsupported syntax를 다룹니다.",
    failureModes: "compiler plugin/version mismatch는 JSX syntax error 또는 runtime helper import failure를 만들고, element object를 DOM API에 전달하면 ownership/type 오류가 납니다.",
    verification: "toolchain transform snapshot, source maps, development/production builds, actual render와 invalid identifier negative tests를 함께 둡니다.",
    operations: "compiler·React runtime upgrade는 generated helper imports, bundle diff, warning/error taxonomy와 source-map privacy를 canary에서 확인합니다.",
    concepts: [
      c("JSX transform", "JSX syntax를 JavaScript element creation calls로 바꾸는 build 단계입니다.", ["runtime mode와 맞아야 합니다.", "DOM 생성 자체가 아닙니다."]),
      c("React element", "type, props와 children을 기술하는 render input value입니다.", ["DOM node와 다릅니다.", "직접 mutation하지 않습니다."]),
      c("automatic runtime", "JSX transform이 매 file의 React default import 없이 dedicated JSX runtime helpers를 사용하는 mode입니다.", ["toolchain 지원을 확인합니다.", "application API가 아닙니다."]),
    ],
    codeExamples: [node("react02-element-shape", "JSX element description을 순수 object로 모델링", "React02ElementShape.mjs", "host와 component type을 구분하고 props spread의 마지막 값 우선 규칙을 explicit model로 출력합니다.", String.raw`function jsx(type, config, ...children) {
  return { type, props: { ...config, children } };
}
function Card() {}
const host = jsx("section", { role: "region", tone: "old", ...{ tone: "new" } }, "Hello");
const custom = jsx(Card, { id: 7 });
console.log("host=" + host.type);
console.log("tone=" + host.props.tone);
console.log("child=" + host.props.children[0]);
console.log("component=" + custom.type.name);`, "host=section\ntone=new\nchild=Hello\ncomponent=Card", ["react-jsx-intro", "react-create-element", "react-jsx-runtime"])],
  }),
  appliedTopic({
    id: "single-root-fragment", title: "single returned tree와 Fragment·keyed Fragment의 identity를 구분합니다",
    lead: "여러 sibling을 wrapper DOM 없이 묶는 Fragment를 단순 문법 편의가 아니라 returned element, DOM semantics와 reconciliation identity 결정으로 이해합니다.",
    mechanism: "component는 하나의 JavaScript value를 반환하며 Fragment element가 여러 children을 group합니다. shorthand Fragment는 props를 받을 수 없고 list group identity가 필요하면 explicit Fragment와 key를 사용합니다.",
    workflow: "필요한 semantic wrapper가 있는지 먼저 결정하고, wrapper가 layout/accessibility에 불필요할 때 Fragment를 선택한 뒤 list reorder에서는 stable group key로 identity를 검증합니다.",
    invariants: "Fragment가 DOM landmark나 style target을 만들 것이라 기대하지 않고, key는 sibling scope에서 stable·unique하며 business identity에서 나옵니다.",
    edgeCases: "empty Fragment, conditional siblings, table rows/cells, keyed multi-node items, nested arrays, portal과 CSS child selectors를 확인합니다.",
    failureModes: "불필요한 div는 grid/table/accessibility semantics를 깨고 shorthand Fragment를 map에서 쓰면 key를 붙일 수 없어 reorder state가 이동할 수 있습니다.",
    verification: "DOM snapshot에서 wrapper 유무, accessibility tree, keyed reorder state, CSS selector와 server/client markup parity를 test합니다.",
    operations: "design system component가 DOM wrapper를 추가·제거할 때 layout, focus, selectors와 hydration compatibility를 breaking change로 review합니다.",
    concepts: [
      c("single returned tree", "component call 한 번이 반환하는 하나의 element description root입니다.", ["Fragment도 하나의 root value입니다.", "DOM root node 수와 다를 수 있습니다."]),
      c("Fragment", "추가 host DOM node 없이 children을 group하는 React type입니다.", ["shorthand와 explicit form이 있습니다.", "layout wrapper가 아닙니다."]),
      c("group key", "여러 sibling nodes가 한 logical list item임을 reconciliation에 알리는 stable identity입니다.", ["explicit Fragment에 둡니다.", "index를 피합니다."]),
    ],
    codeExamples: [node("react02-keyed-fragment", "logical group key와 reorder identity 검증", "React02Fragment.mjs", "두 node씩 가진 groups를 id key로 reorder해 같은 content identity가 유지되는지 계산합니다.", String.raw`const groups = [
  { id: "a", nodes: ["A-title", "A-body"] },
  { id: "b", nodes: ["B-title", "B-body"] },
];
const before = new Map(groups.map((group) => [group.id, group.nodes.join("|")]));
const reordered = [groups[1], groups[0]];
console.log("order=" + reordered.map((x) => x.id).join(","));
console.log("a-stable=" + (before.get("a") === reordered[1].nodes.join("|")));
console.log("b-stable=" + (before.get("b") === reordered[0].nodes.join("|")));`, "order=b,a\na-stable=true\nb-stable=true", ["react-fragment", "react-rendering-lists", "local-library"])],
  }),
  appliedTopic({
    id: "expressions-statements-precompute", title: "JSX expression container와 statement·precomputation 경계를 설계합니다",
    lead: "중괄호 안에 무엇이 들어가는지를 암기하지 않고 grammar의 expression value와 control-flow statement 차이를 이해해 복잡한 render logic을 읽을 수 있게 만듭니다.",
    mechanism: "expression은 value를 만들 수 있어 identifier, property access, call, arithmetic, conditional과 map 결과가 JSX child/prop에 들어가며 if, for, variable declaration 같은 statement는 component body에서 먼저 실행합니다.",
    workflow: "입력 normalization과 branch decision을 render 위에서 named variables/functions로 계산하고 JSX에는 읽기 쉬운 final values와 small conditions만 남깁니다.",
    invariants: "render 계산은 순수하고 total하거나 명시적 failure UI를 반환하며, branch마다 stable semantic structure와 accessible feedback을 제공합니다.",
    edgeCases: "0이 logical AND에서 화면에 나타나는 경우, empty string, NaN, optional chaining, throwing getter, Promise child와 sparse arrays를 다룹니다.",
    failureModes: "length && Component 패턴은 length가 0일 때 0 text를 render할 수 있고, JSX 안의 긴 nested ternary는 branch 누락과 테스트 공백을 만듭니다.",
    verification: "value/type table, branch coverage, DOM query, accessibility live feedback와 throwing/async negative tests를 둡니다.",
    operations: "business branch가 늘면 finite state/result model과 component variants로 승격하고 unreachable state telemetry를 수집합니다.",
    concepts: [
      c("expression", "평가되어 하나의 JavaScript value를 만드는 syntax입니다.", ["JSX braces에 사용할 수 있습니다.", "side effect 없는 계산을 선호합니다."]),
      c("statement", "control flow나 declaration을 수행하며 JSX child value로 바로 들어가지 않는 syntax입니다.", ["component body에서 사용합니다.", "결과를 변수로 만듭니다."]),
      c("render precomputation", "JSX 전에 validation·filter·branch result를 named value로 계산하는 방식입니다.", ["가독성과 testability를 높입니다.", "memoization과 다릅니다."]),
    ],
    codeExamples: [node("react02-expression-values", "conditional child value의 type matrix", "React02Expressions.mjs", "AND와 explicit ternary의 zero/empty/null behavior를 비교하는 pure child normalizer를 실행합니다.", String.raw`function visible(value) {
  if (value === null || value === undefined || typeof value === "boolean") return [];
  if (Array.isArray(value)) return value.flatMap(visible);
  return [String(value)];
}
for (const count of [0, 2]) {
  const andValue = count && "items";
  const ternaryValue = count > 0 ? "items" : null;
  console.log("count=" + count + ",and=" + JSON.stringify(visible(andValue)) + ",ternary=" + JSON.stringify(visible(ternaryValue)));
}`, "count=0,and=[\"0\"],ternary=[]\ncount=2,and=[\"items\"],ternary=[\"items\"]", ["react-jsx-braces", "react-conditional", "mdn-expression"])],
  }),
  appliedTopic({
    id: "children-value-semantics", title: "string·number·null·boolean·array children의 render 의미를 type별로 고정합니다",
    lead: "JavaScript value가 JSX child가 될 때 실제 text node, 빈 결과, nested list 또는 오류로 어떻게 정규화되는지 알아야 조건과 API payload를 안전하게 화면에 옮길 수 있습니다.",
    mechanism: "string과 number는 text로, null/undefined/boolean은 보통 빈 child로 처리되며 arrays와 iterable elements는 flatten/reconcile됩니다. plain object와 Promise는 지원되는 context가 아니면 render error를 만들 수 있습니다.",
    workflow: "external data를 runtime schema로 검증하고 display model로 변환한 뒤 formatter가 locale/time/number와 missing policy를 적용해 primitive text 또는 elements를 반환합니다.",
    invariants: "raw API object, Error, Date나 secret-bearing value를 child에 직접 넘기지 않고 user-visible fallback과 developer-safe diagnostic을 분리합니다.",
    edgeCases: "negative zero, NaN, BigInt support/version, Symbol, empty array, sparse nested array, duplicate element keys와 throwing toString을 확인합니다.",
    failureModes: "객체 전체를 render하면 runtime error가 나고 JSON.stringify로 임시 표시하면 sensitive/internal fields가 노출되며 locale-independent contract도 깨집니다.",
    verification: "type corpus component tests, forbidden field assertion, locale/timezone matrix, error boundary와 list key warning zero를 검증합니다.",
    operations: "schema/locale/library upgrade 때 display golden data와 accessibility names를 replay하고 raw payload logging을 redaction합니다.",
    concepts: [
      c("renderable child", "React가 text 또는 element tree로 해석할 수 있는 지원 value입니다.", ["type마다 의미가 다릅니다.", "plain object는 display model이 아닙니다."]),
      c("display model", "외부/domain data에서 화면에 공개할 fields와 formatted values만 가진 UI 경계 객체입니다.", ["allowlist projection입니다.", "locale 정책을 가집니다."]),
      c("empty child", "tree position에서 host node를 만들지 않는 null·undefined·boolean 계열 결과입니다.", ["0과 다릅니다.", "accessibility feedback을 고려합니다."]),
    ],
    codeExamples: [node("react02-children-normalizer", "지원 child type의 flatten과 invalid object 거부", "React02Children.mjs", "nested arrays, empty values, zero와 plain object를 분류해 deterministic result를 출력합니다.", String.raw`function normalize(value, out = []) {
  if (value === null || value === undefined || typeof value === "boolean") return out;
  if (Array.isArray(value)) { for (const item of value) normalize(item, out); return out; }
  if (typeof value === "string" || typeof value === "number") { out.push(String(value)); return out; }
  throw new TypeError("unsupported:" + typeof value);
}
console.log("nodes=" + normalize(["A", null, [0, false, "B"]]).join("|"));
try { normalize({ text: "hidden" }); } catch (error) { console.log(error.message); }`, "nodes=A|0|B\nunsupported:object", ["react-children", "react-rendering-lists", "react-conditional"])],
  }),
  appliedTopic({
    id: "attributes-properties-style", title: "JSX props와 DOM attributes·properties·style object를 구분합니다",
    lead: "className과 camelCase를 외우는 데서 나아가 React prop이 DOM property/attribute, event listener와 CSS serialization으로 commit되는 contract를 field별로 확인합니다.",
    mechanism: "host element JSX props는 React DOM이 known properties와 attributes로 처리하고 className, htmlFor, event handlers와 style object는 JavaScript-friendly names와 typed values를 사용합니다.",
    workflow: "semantic HTML element와 native attribute를 먼저 고르고, dynamic class 또는 style은 finite variants와 normalized values로 만들며 DOM output을 browser inspector와 tests에서 readback합니다.",
    invariants: "style object는 immutable input처럼 다루고 CSS property names는 camelCase/custom property syntax를 지키며 untrusted string을 URL/style/HTML sink에 직접 연결하지 않습니다.",
    edgeCases: "unitless CSS property, zero, custom properties, vendor prefix, boolean attribute, aria/data attributes, null removal, controlled form properties와 unknown props를 확인합니다.",
    failureModes: "style numeric value의 unit 가정, object mutation, invalid aria spelling과 component-only props가 DOM에 흘러 warning·layout·accessibility drift를 만듭니다.",
    verification: "computed style, serialized attributes, accessibility tree, invalid prop warning, CSP/style policy와 responsive/high-contrast browser matrix를 test합니다.",
    operations: "design token/theme migration은 rendered CSS variables와 contrast/focus states를 canary하고 inline style 증가가 CSP와 cache에 미치는 영향을 추적합니다.",
    concepts: [
      c("host prop", "built-in DOM element에 전달되어 property, attribute, event 또는 style로 처리되는 JSX input입니다.", ["component prop과 구분합니다.", "React DOM mapping을 따릅니다."]),
      c("style object", "CSS declarations를 camelCase keys와 string/number values로 표현한 React prop입니다.", ["일부 숫자는 px 처리됩니다.", "mutation을 피합니다."]),
      c("ARIA attribute", "accessibility semantics와 state를 accessibility API에 전달하는 aria-* attribute입니다.", ["spelling과 value contract를 지킵니다.", "native semantics를 우선합니다."]),
    ],
    codeExamples: [node("react02-style-normalizer", "style value의 unit과 custom property 정규화", "React02Style.mjs", "px 대상, unitless, zero와 CSS custom property를 명시적 table로 serialize합니다.", String.raw`const unitless = new Set(["opacity", "zIndex", "lineHeight", "flex"]);
function css(name, value) {
  if (name.startsWith("--")) return String(value);
  if (typeof value !== "number" || value === 0 || unitless.has(name)) return String(value);
  return value + "px";
}
for (const [name, value] of [["marginTop", 8], ["opacity", 0.5], ["width", 0], ["--gap", 12]]) {
  console.log(name + "=" + css(name, value));
}`, "marginTop=8px\nopacity=0.5\nwidth=0\n--gap=12", ["local-comment", "react-common-components", "mdn-cssom"])],
  }),
  appliedTopic({
    id: "escaping-html-url-boundary", title: "text escaping과 HTML·URL·style sink의 서로 다른 보안 경계를 지킵니다",
    lead: "JSX text interpolation이 markup을 escape한다는 사실을 모든 injection 방어로 확대하지 않고 dangerous HTML, URL navigation, CSS와 third-party asset 경계를 각각 검증합니다.",
    mechanism: "일반 string child는 markup으로 해석되지 않도록 escaped text로 commit되지만 dangerouslySetInnerHTML은 trusted HTML bytes를 삽입하며 href/src/style/event-like sinks는 별도 scheme·origin·policy 검증이 필요합니다.",
    workflow: "가능하면 structured React elements와 text props를 사용하고 rich HTML 요구가 있으면 provenance, allowlisted sanitizer, Trusted Types/CSP와 post-sanitize invariants를 dedicated boundary에 둡니다.",
    invariants: "user input은 code/HTML/template로 평가하지 않으며 URL은 parsed absolute/relative policy, image는 owned host·size·alt·referrer/privacy policy를 통과합니다.",
    edgeCases: "javascript/data/blob schemes, protocol-relative URL, SVG/MathML, malformed encodings, sanitizer version drift, target blank opener와 CSS url을 확인합니다.",
    failureModes: "escaping만 믿고 dangerous HTML 또는 attacker-controlled href를 허용하면 XSS/navigation이 가능하고 external image는 tracking·availability·privacy leak을 만듭니다.",
    verification: "malicious corpus, sanitizer differential test, CSP/Trusted Types reports, URL parser allowlist, image failure/privacy와 accessibility alt tests를 실행합니다.",
    operations: "sanitizer/browser policy upgrade와 new HTML features를 security regression corpus로 qualification하고 violation reports를 privacy-safe하게 triage합니다.",
    concepts: [
      c("text escaping", "special markup characters를 text로 보이도록 안전한 representation으로 변환하는 처리입니다.", ["일반 JSX text에 적용됩니다.", "URL/HTML sink 전체를 보호하지 않습니다."]),
      c("trusted HTML boundary", "검증된 provenance와 sanitizer policy를 통과한 HTML만 dangerous sink에 허용하는 좁은 interface입니다.", ["일반 component 밖으로 격리합니다.", "versioned tests가 필요합니다."]),
      c("URL sink", "href, src, action처럼 browser navigation 또는 resource loading을 시작하는 value 위치입니다.", ["scheme/origin을 검증합니다.", "text escaping과 다릅니다."]),
    ],
    codeExamples: [node("react02-url-policy", "frontend URL scheme·origin allowlist", "React02UrlPolicy.mjs", "synthetic base에서 relative/same-origin HTTPS만 허용하고 javascript와 foreign origin을 거부합니다.", String.raw`const base = new URL("https://app.example/");
function allow(raw) {
  try {
    const url = new URL(raw, base);
    return url.protocol === "https:" && url.origin === base.origin;
  } catch { return false; }
}
for (const raw of ["/docs", "https://app.example/help", "javascript:alert(1)", "https://evil.example/"]) {
  console.log(raw + "=" + allow(raw));
}`, "/docs=true\nhttps://app.example/help=true\njavascript:alert(1)=false\nhttps://evil.example/=false", ["react-dom-elements", "react-dangerous-html", "owasp-xss", "mdn-url", "local-comment"])],
  }),
  appliedTopic({
    id: "deterministic-time-purity", title: "Date·locale·random 표현을 deterministic render input으로 바꿉니다",
    lead: "Clock처럼 render 중 현재 시간을 읽는 간단한 예제를 purity, timezone, hydration과 testing 문제로 확장해 시간 source와 update schedule을 분리합니다.",
    mechanism: "new Date는 호출 순간과 environment timezone/locale에 의존하므로 같은 props에서도 다른 text를 만들 수 있습니다. 현재 시각은 injected Clock 또는 state snapshot으로 소유하고 timer Effect가 명시적 cadence로 갱신합니다.",
    workflow: "canonical Instant를 data/state로 받고 formatter에 explicit locale/timeZone/options를 주며 timer setup·cleanup, visibility와 drift correction을 별도 hook에서 관리합니다.",
    invariants: "render 중 timer를 만들지 않고 server/client initial value와 timezone policy를 맞추며 tests는 fixed instant와 explicit zone을 사용합니다.",
    edgeCases: "DST gap/overlap, invalid date, locale fallback, background tab timer throttling, system clock jump, hydration boundary와 second/minute rounding을 다룹니다.",
    failureModes: "server/client 시간이 달라 hydration mismatch가 나고 StrictMode에서 timer cleanup 누락이 중복 update를 만들며 locale default가 snapshot을 불안정하게 합니다.",
    verification: "fixed clock unit test, multiple timezone/locale formatting, fake timer cleanup, visibility/resume와 hydration integration을 검증합니다.",
    operations: "tzdata/browser upgrade와 business timezone 변경을 golden instant corpus로 qualification하고 client/server clock skew를 telemetry로 관찰합니다.",
    concepts: [
      c("Instant", "timezone과 무관한 timeline의 한 시점을 나타내는 canonical value입니다.", ["표시 zone과 분리합니다.", "epoch 또는 ISO로 전달합니다."]),
      c("formatter policy", "locale, timezone, calendar와 precision을 명시해 user-visible time text를 만드는 규칙입니다.", ["environment default를 피합니다.", "accessibility label도 고려합니다."]),
      c("timer ownership", "어떤 mounted component/hook가 timer를 생성·갱신·cleanup하는지 정한 lifecycle 경계입니다.", ["StrictMode를 견딥니다.", "background throttling을 고려합니다."]),
    ],
    codeExamples: [node("react02-fixed-clock", "fixed instant와 explicit timezone format", "React02Clock.mjs", "같은 Instant를 UTC와 Asia/Seoul에서 안정된 parts로 출력해 environment default 의존을 제거합니다.", String.raw`const instant = new Date("2026-07-14T03:04:05Z");
function format(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(instant);
}
console.log("utc=" + format("UTC"));
console.log("seoul=" + format("Asia/Seoul"));
console.log("same-instant=" + (instant.toISOString() === "2026-07-14T03:04:05.000Z"));`, "utc=2026-07-14, 03:04:05\nseoul=2026-07-14, 12:04:05\nsame-instant=true", ["local-clock", "react-purity", "mdn-intl", "mdn-date"])],
  }),
  appliedTopic({
    id: "debug-source-map-warning", title: "JSX compile error·render error·warning과 source map evidence를 분리합니다",
    lead: "화면이 비었을 때 무작정 문법을 고치지 않고 transform, module resolution, render exception, reconciliation warning와 CSS visibility를 pipeline 순서로 진단합니다.",
    mechanism: "syntax/transform error는 bundle 생성 전에, module error는 graph load에서, render exception은 component evaluation에서, warning은 계속 render될 수 있는 contract risk에서 발생하며 CSS/network는 commit 뒤 화면을 가릴 수 있습니다.",
    workflow: "terminal build output, browser network/module, console stack/source map, error boundary, React DevTools tree와 DOM/computed style을 앞에서 뒤로 확인합니다.",
    invariants: "development warning zero를 목표로 하되 console wording에 test를 고정하지 않고 stable invalid behavior와 DOM/user outcome을 assert합니다.",
    edgeCases: "stale HMR state, source map path privacy, minified production stack, duplicate React, extension/case mismatch, CSP blocked script와 cached old chunk를 다룹니다.",
    failureModes: "blank screen을 CSS로 오해하거나 warning을 무시하고, production source map을 public 배포해 internal path/source를 노출할 수 있습니다.",
    verification: "clean build, no-cache browser, deliberate syntax/render/key errors, error boundary fallback, source map access policy와 stale chunk recovery tests를 둡니다.",
    operations: "release artifact hash와 source map을 access-controlled error service에 연결하고 error signature, affected version와 rollback trigger를 운영합니다.",
    concepts: [
      c("transform error", "JSX/source가 valid JavaScript bundle로 변환되기 전에 발생하는 parser/compiler failure입니다.", ["browser render 전입니다.", "source 위치를 봅니다."]),
      c("render exception", "component evaluation 중 throw되어 해당 tree commit을 중단하거나 error boundary로 전달되는 오류입니다.", ["warning과 다릅니다.", "fallback ownership이 필요합니다."]),
      c("source map", "generated bundle 위치를 original source 위치와 연결하는 mapping artifact입니다.", ["debug에 유용합니다.", "배포 접근 정책이 필요합니다."]),
    ],
  }),
  appliedTopic({
    id: "jsx-accessibility-release", title: "semantic DOM·accessible name과 production JSX regression gate를 완성합니다",
    lead: "JSX가 compile되고 화면이 닮았다는 기준을 넘어 native semantics, keyboard/focus, image text alternatives와 assistive technology outcome까지 첫 component의 완료 조건으로 둡니다.",
    mechanism: "React component tree는 최종 semantic DOM과 accessibility tree로 평가됩니다. div/span과 CSS만으로 역할을 흉내 내기보다 button, heading, list, label과 landmark를 목적에 맞게 사용합니다.",
    workflow: "UI intent를 element/role/name/state 표로 만들고 JSX를 작성한 뒤 keyboard-only path, accessible queries, contrast/zoom/reduced motion과 screen reader spot check를 수행합니다.",
    invariants: "interactive control은 keyboard로 도달·작동하고 accessible name이 있으며 decorative image만 empty alt를 사용하고 informative image는 equivalent text를 제공합니다.",
    edgeCases: "loading/error/empty/disabled, dynamic list insertion, focus restoration, high zoom/reflow, RTL, forced colors와 unavailable external image를 다룹니다.",
    failureModes: "빈 alt를 모든 image에 복사하면 정보가 사라지고 click handler div는 keyboard semantics가 없으며 snapshot은 accessible name regression을 놓칩니다.",
    verification: "role/name-based component tests, automated axe-type checks, manual keyboard, screen reader spot test와 visual regression을 production build에서 실행합니다.",
    operations: "component library release마다 accessibility contract tests와 supported browser/AT matrix를 유지하고 known exception에는 owner·expiry·remediation을 둡니다.",
    concepts: [
      c("semantic element", "내용과 interaction의 의미를 browser와 assistive technology에 기본 제공하는 HTML element입니다.", ["native behavior를 우선합니다.", "CSS appearance와 독립입니다."]),
      c("accessible name", "assistive technology가 control/image/region을 식별할 때 사용하는 계산된 이름입니다.", ["visible label과 연결합니다.", "role만으로 생기지 않습니다."]),
      c("decorative image", "주변 text가 이미 전달하는 의미를 반복해 정보 손실 없이 accessibility tree에서 제외할 수 있는 image입니다.", ["empty alt를 사용합니다.", "모든 image가 decorative는 아닙니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "local-book", repository: "D:/dev/my-app01", path: "src/pages/step01-jsx/Book.jsx", usedFor: ["Fragment", "props expressions", "quoted page value"], evidence: "2026-07-14 read-only audit: 25 lines, 731 bytes, SHA-256 1F7F3EF67F0D3D675E342C1AD1B50D6483107A578AB71AFC17D0FEA69FB0AD4A." },
  { id: "local-library", repository: "D:/dev/my-app01", path: "src/pages/step01-jsx/Library.jsx", usedFor: ["composition", "repeated children", "quoted props"], evidence: "2026-07-14 read-only audit: 19 lines, 618 bytes, SHA-256 F3951584896DCC8D54EEF59555947AEC43B5C21B1E9E807A2147C7D6D9B7104C." },
  { id: "local-clock", repository: "D:/dev/my-app01", path: "src/pages/step02-component/Clock.jsx", usedFor: ["Date render expression", "locale nondeterminism"], evidence: "2026-07-14 read-only audit: 8 lines, 169 bytes, SHA-256 0F66B677AF548DE61C281D6536E5E4E6D9DA26B249ACA61AEB30C6861F4617F4." },
  { id: "local-comment", repository: "D:/dev/my-app01", path: "src/pages/step02-component/Comment.jsx", usedFor: ["style object", "external image", "empty alt"], evidence: "2026-07-14 read-only audit: 50 lines, 1,276 bytes, SHA-256 81F87641ABFC8F0C6EE117EB1129B1874C06D34C62C7D1303B8D1089947B0274. 실제 remote asset는 example에서 호출하지 않았습니다." },
  { id: "local-comment-list", repository: "D:/dev/my-app01", path: "src/pages/step02-component/CommentList.jsx", usedFor: ["map render", "index key", "source comment about backend"], evidence: "2026-07-14 read-only audit: 52 lines, 1,463 bytes, SHA-256 19DF8830E90D3935BCE8B0797170531EF93558FC36C8F00499F0AFF4F617533D. 실제 인물·comment values는 복사하지 않았습니다." },
  { id: "local-react-jsx", repository: "D:/dev/REACT", path: "docs/react/02-jsx-components.md", usedFor: ["existing JSX/component explanation", "code-result linkage"], evidence: "2026-07-14 read-only audit: 151 lines, 6,231 bytes, SHA-256 16210EF43D4FAB3E4189AE8090BA9452409FED56555D6DF72E0639EC2560D24C." },
  { id: "react-jsx-intro", repository: "React official documentation", path: "learn/writing-markup-with-jsx", publicUrl: "https://react.dev/learn/writing-markup-with-jsx", usedFor: ["JSX rules", "single root"], evidence: "current official JSX markup guidance를 확인했습니다." },
  { id: "react-jsx-braces", repository: "React official documentation", path: "learn/javascript-in-jsx-with-curly-braces", publicUrl: "https://react.dev/learn/javascript-in-jsx-with-curly-braces", usedFor: ["expression containers", "objects/styles"], evidence: "curly-brace expression and object usage를 확인했습니다." },
  { id: "react-create-element", repository: "React official API", path: "reference/react/createElement", publicUrl: "https://react.dev/reference/react/createElement", usedFor: ["element type/props/children", "JSX alternative"], evidence: "createElement output contract and caveats를 확인했습니다." },
  { id: "react-jsx-runtime", repository: "React official upgrade guide", path: "blog/2024/04/25/react-19-upgrade-guide", publicUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide", usedFor: ["automatic JSX transform", "React 19 runtime requirement"], evidence: "React 19이 modern JSX transform을 요구한다는 current official upgrade guidance를 확인했습니다." },
  { id: "react-fragment", repository: "React official API", path: "reference/react/Fragment", publicUrl: "https://react.dev/reference/react/Fragment", usedFor: ["Fragment semantics", "keyed Fragment"], evidence: "Fragment grouping and explicit key behavior를 확인했습니다." },
  { id: "react-rendering-lists", repository: "React official documentation", path: "learn/rendering-lists", publicUrl: "https://react.dev/learn/rendering-lists", usedFor: ["array children", "keys"], evidence: "map rendering and stable key guidance를 확인했습니다." },
  { id: "react-conditional", repository: "React official documentation", path: "learn/conditional-rendering", publicUrl: "https://react.dev/learn/conditional-rendering", usedFor: ["conditional values", "null children"], evidence: "conditional JSX patterns and null rendering을 확인했습니다." },
  { id: "react-children", repository: "React official API", path: "reference/react/Children", publicUrl: "https://react.dev/reference/react/Children", usedFor: ["children traversal", "opaque children caveats"], evidence: "Children API semantics and caveats를 확인했습니다." },
  { id: "react-common-components", repository: "React DOM official API", path: "reference/react-dom/components/common", publicUrl: "https://react.dev/reference/react-dom/components/common", usedFor: ["common props", "style", "ARIA/data attributes"], evidence: "React DOM common component prop contract를 확인했습니다." },
  { id: "react-dom-elements", repository: "React DOM official API", path: "reference/react-dom/components", publicUrl: "https://react.dev/reference/react-dom/components", usedFor: ["built-in element contracts", "DOM mapping"], evidence: "built-in DOM component reference를 확인했습니다." },
  { id: "react-dangerous-html", repository: "React DOM official API", path: "reference/react-dom/components/common#dangerously-setting-the-inner-html", publicUrl: "https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html", usedFor: ["dangerouslySetInnerHTML boundary", "XSS caveat"], evidence: "dangerous HTML API의 official warning과 usage를 확인했습니다." },
  { id: "react-purity", repository: "React official documentation", path: "learn/keeping-components-pure", publicUrl: "https://react.dev/learn/keeping-components-pure", usedFor: ["deterministic render", "side effects"], evidence: "same inputs pure output requirement를 확인했습니다." },
  { id: "mdn-expression", repository: "MDN Web Docs", path: "JavaScript/Guide/Expressions_and_operators", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators", usedFor: ["expression value semantics", "logical operators"], evidence: "JavaScript expression/operator semantics를 확인했습니다." },
  { id: "mdn-cssom", repository: "MDN Web Docs", path: "Web/API/CSS_Object_Model", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model", usedFor: ["CSSOM/readback", "computed style boundary"], evidence: "CSSOM browser style representation을 확인했습니다." },
  { id: "mdn-url", repository: "MDN Web Docs", path: "Web/API/URL/URL", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/URL/URL", usedFor: ["URL parsing", "base resolution"], evidence: "URL constructor parsing and base resolution을 확인했습니다." },
  { id: "mdn-intl", repository: "MDN Web Docs", path: "JavaScript/Reference/Global_Objects/Intl/DateTimeFormat", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat", usedFor: ["locale/timezone formatting", "deterministic options"], evidence: "Intl.DateTimeFormat options and behavior를 확인했습니다." },
  { id: "mdn-date", repository: "MDN Web Docs", path: "JavaScript/Reference/Global_Objects/Date", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date", usedFor: ["Date instant", "environment time behavior"], evidence: "Date value and timezone display boundary를 확인했습니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross_Site_Scripting_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["contextual output encoding", "dangerous contexts"], evidence: "context-specific XSS prevention principles를 확인했습니다." },
];

const session = createExpertSession({
    inventoryId: "react-02-jsx-expression-rules", slug: "react-02-jsx-expression-fragment",
  courseId: "react", moduleId: "react-rendering-components", order: 2,
  title: "JSX 표현식·속성·Fragment", subtitle: "원본 JSX 예제를 compiler transform, child value types, DOM props, purity, injection boundary와 accessibility까지 확장합니다.",
  level: "기초", estimatedMinutes: 120,
  coreQuestion: "JSX 한 줄이 어떤 JavaScript value와 DOM/accessibility 결과가 되며, 경계 입력과 toolchain 변화에도 그 의미를 어떻게 검증할까요?",
  summary: "my-app01의 Book·Library·Clock·Comment·CommentList와 REACT JSX 설명 문서를 read-only로 감사해 Fragment, expressions, object style, Date와 map의 출발점을 보존합니다. JSX transform과 element description, single root·keyed Fragment, expression/statement, renderable child types, DOM props/style, escaping과 URL/HTML sink, deterministic time, debug pipeline와 accessibility release gate를 current official sources와 실행 가능한 Node models로 연결합니다. 원본의 실제 문자열과 외부 image를 복사하지 않고 source limitations, browser/React integration과 production qualification 범위를 분명히 합니다.",
  objectives: ["원본 JSX source fact와 runtime/browser 검증을 분리한다.", "JSX transform과 React element·DOM node를 구분한다.", "Fragment와 stable group identity를 적용한다.", "expression/statement와 conditional zero trap을 설명한다.", "children runtime type을 안전한 display model로 바꾼다.", "DOM props·style·ARIA와 escaping/URL/HTML sink를 구분한다.", "time/locale render를 deterministic하게 만든다.", "compile→render→DOM→accessibility pipeline을 진단하고 release gate로 운영한다."],
  prerequisites: [{ title: "Vite·React 진입점과 JSX 컴포넌트", reason: "toolchain, createRoot, component purity와 props의 첫 contract를 알아야 JSX syntax가 실제 tree와 DOM으로 이어지는 단계를 구분할 수 있습니다.", sessionSlug: "react-01-vite-jsx-component" }],
  keywords: ["JSX", "Fragment", "expression", "children", "style", "DOM props", "escaping", "XSS", "URL", "DateTimeFormat", "source maps", "accessibility"],
  topics,
  lab: {
    title: "원본 JSX 다섯 예제를 deterministic·accessible component fixture로 qualification하기",
    scenario: "원본은 변경하지 않고 synthetic data, fixed clock와 owned assets를 사용하는 isolated React fixture에서 transform부터 accessibility tree까지 검증합니다.",
    setup: ["Node 20 이상", "원본 my-app01/REACT read-only", "React development/production builds", "current supported browsers", "fixed instant/locale/timezone", "synthetic text and owned placeholder asset"],
    steps: ["원본 6개 files의 hash와 current entry 연결 여부를 기록합니다.", "각 JSX를 transformed JS와 element shape까지 capture합니다.", "single root와 wrapper/Fragment DOM·CSS·accessibility 차이를 비교합니다.", "string/number/null/boolean/array/object child corpus를 실행합니다.", "AND zero trap과 explicit branch 결과를 DOM query로 확인합니다.", "style values/ARIA/data/boolean props의 serialized DOM과 computed style을 readback합니다.", "text, dangerous HTML, URL, image source의 malicious corpus를 실행합니다.", "Clock을 fixed Instant와 explicit locale/timezone/timer cleanup 구조로 교정합니다.", "index-key group을 stable ID/keyed Fragment로 바꾸고 reorder identity를 test합니다.", "development/production warning zero, keyboard/accessibility와 source-map policy를 canary합니다."],
    expectedResult: ["JSX source, transformed code, element tree와 DOM 결과가 추적됩니다.", "모든 child type과 branch가 documented UI 또는 stable failure를 만듭니다.", "HTML/URL/style/image sinks가 각 정책을 통과하고 raw object/secret이 노출되지 않습니다.", "time, key와 Fragment behavior가 locale/reorder/StrictMode에도 deterministic합니다.", "semantic DOM, accessible names와 production build가 regression gate를 통과합니다."],
    cleanup: ["temporary build/cache/source maps와 preview servers를 제거합니다.", "synthetic data, malicious corpus와 owned asset fixture를 폐기합니다.", "fake timers, locale/timezone와 verbose diagnostics를 원복합니다.", "원본 6개 files hash/status unchanged를 확인합니다."],
    extensions: ["TypeScript JSX intrinsic element/props typing을 추가합니다.", "SSR hydration에서 locale/time mismatch를 검증합니다.", "Trusted Types와 strict CSP report/enforce를 추가합니다.", "visual/accessibility differential tests를 browser matrix에 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 실제 JSX/DOM 결과와 대응표를 만드세요.", requirements: ["stdout 완전 일치", "element와 DOM 구분", "0/null children 비교", "style unit 확인", "URL 거부 corpus", "fixed timezone 결과", "model과 React guarantee 분리"], hints: ["Node model을 React reconciler라고 부르지 마세요."], expectedOutcome: "JSX value가 안전한 UI 결과가 되는 pipeline을 설명합니다.", solutionOutline: ["transform→tree→children→props/sinks→time→DOM/a11y 순서입니다."] },
    { difficulty: "응용", prompt: "원본 CommentList와 Clock을 production-safe JSX로 교정하세요.", requirements: ["stable item ID/key", "fixed/testable clock", "owned image and alt policy", "safe display model", "semantic elements", "URL/HTML negative tests", "warning zero", "production accessibility gate"], hints: ["index key와 current Date를 cosmetic issue로만 보지 마세요."], expectedOutcome: "reorder·locale·asset failure에도 정확한 component가 완성됩니다.", solutionOutline: ["audit→identity/time/sinks→semantic JSX→tests→canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JSX·DOM sink·accessibility 표준을 작성하세요.", requirements: ["transform support matrix", "child type policy", "Fragment/key rules", "props/style/ARIA conventions", "rich HTML/URL/image policy", "time/locale purity", "debug/source-map policy", "browser/a11y/rollback gates"], hints: ["formatting rule이 아니라 input부터 production DOM까지의 contract를 만드세요."], expectedOutcome: "JSX authoring과 운영 검증을 함께 통제하는 표준이 완성됩니다.", solutionOutline: ["parse→value→identity→sink→format→observe→qualify 순서입니다."] },
  ],
  nextSessions: ["react-03-props-one-way-data"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["원본의 실제 인물·book·comment strings와 외부 image URL은 공개 examples에 복사/호출하지 않고 structural provenance만 사용했습니다.", "원본 Date와 index key는 작은 데모의 출발점이며 deterministic time, stable identity와 accessibility production pattern은 official sources와 synthetic models로 보강했습니다.", "Node examples는 JSX compiler, React renderer, browser DOM/CSSOM/accessibility tree와 CSP를 대체하지 않으므로 lab integration을 요구합니다.", "상태, event와 reconciliation의 더 깊은 동작은 후속 React03~07에서 별도 source files와 함께 다룹니다."] },
});

export default session;
