import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function nodeExample(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "node", filename, purpose, code,
    walkthrough: [
      { lines: "1-10", explanation: "합성 UI tree, stable IDs, user preference 또는 접근성 계약을 선언합니다." },
      { lines: "11-끝에서 5줄 전", explanation: "React/browser 동작에서 분리한 순수 함수를 통해 semantic structure, reconciliation, name, state와 CSS policy를 결정적으로 계산합니다." },
      { lines: "마지막 5줄", explanation: "role·name·order·key·focus·motion 결과를 exact stdout으로 출력해 예상 결과와 한 글자씩 대조합니다." },
    ],
    run: { environment: ["Node.js 20 이상", "ECMAScript module", "React·DOM·network·credential·외부 asset 불필요"], command: "node " + filename },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "이 model은 실제 React reconciler, browser accessibility tree, CSS cascade, keyboard와 assistive technology를 대체하지 않으므로 capstone browser lab을 별도로 실행합니다."] },
    experiments: [
      { change: "role, accessible name, stable ID, state 또는 preference 하나를 바꿉니다.", prediction: "해당 contract의 audit 결과만 결정적으로 달라지고 unrelated output은 유지됩니다.", result: "Node stdout과 browser role/name/state snapshot, keyboard path를 함께 비교합니다." },
      { change: "data 순서를 재배치하거나 empty/error/loading state를 추가합니다.", prediction: "stable identity는 유지되고 heading/list/status 의미와 focus destination이 state contract에 맞게 바뀝니다.", result: "DOM diff보다 user-observable name·role·order·announcement와 focus를 우선 검증합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-rendering-accessibility-audit",
    title: "원본 App·JSX·목록·CSS를 사실과 접근성 공백으로 나누어 감사합니다",
    lead: "capstone은 원본을 예쁘게 재배치하는 작업이 아니라 현재 render tree가 누구에게 어떤 의미와 상호작용을 제공하는지 증거로 고정하는 작업입니다.",
    explanations: [
      "my-app01의 현재 App.js는 router, 여러 route와 local data를 조합하지만 초기 JSX·component·list·CSS 수업 파일을 현재 root에 직접 렌더하지 않습니다. 따라서 source가 존재한다는 사실과 production 화면에서 사용된다는 사실을 분리하고 import graph와 route entry를 확인해야 합니다.",
      "Book/Library는 Fragment, JSX expression과 props 전달을 보여 주고 Item/ItemList는 component composition을 보여 줍니다. 그러나 반복 항목을 data map과 stable key로 렌더하지 않으며 원본 예시의 사람 이름·작품명·문구는 학습자 개인정보가 아니더라도 공개 capstone의 fixture로 재사용하지 않습니다.",
      "Board는 native button과 className/CSS import를 사용해 기본 keyboard activation을 얻지만, 3×3 의미, 현재 선택 상태, 행/열 관계, focus indicator와 contrast 검증은 없습니다. native element를 썼다는 사실만으로 전체 widget accessibility가 자동 완성되지는 않습니다.",
      "App.css에는 prefers-reduced-motion 조건이 있지만 이 규칙은 motion을 줄이라는 사용자의 요청에서 animation을 실행하지 않는 분기일 뿐, capstone의 모든 transition·scroll·loading indicator가 같은 정책을 따르는지는 별도 감사해야 합니다. Board.css는 크기와 cursor를 지정하지만 focus-visible, forced colors와 zoom/reflow evidence가 없습니다.",
      "REACT 문서는 JSX와 map/key를 설명하지만 index key를 일반 fallback처럼 읽으면 reorder·insert에서 identity가 흐려질 수 있습니다. 현재 React와 웹 표준 문서를 primary source로 삼고 원본 문서는 학습 이력과 실행 경로를 설명하는 local evidence로 제한합니다.",
    ],
    concepts: [
      c("source provenance", "결론이 어떤 local file snapshot에서 나왔는지 path·size·hash로 다시 검증할 수 있는 기록입니다.", ["사실과 추론을 분리합니다.", "실제 문자열·원격 asset·secret을 복사하지 않습니다."]),
      c("accessibility gap", "코드에서 관찰한 feature와 사용자가 keyboard·screen reader·zoom·preference 환경에서 성공한다는 실행 증거 사이의 차이입니다.", ["absence of evidence를 success로 바꾸지 않습니다.", "role/name/state/focus를 측정합니다."]),
      c("render inventory", "root에서 실제 도달 가능한 component, state와 DOM output을 정리한 목록입니다.", ["dead lesson files와 live route를 구분합니다.", "조건 분기별 tree를 포함합니다."]),
    ],
    diagnostics: [
      d("수정한 lesson component가 browser에 전혀 보이지 않습니다.", "현재 App/router tree에 연결되지 않은 보존용 source를 수정했습니다.", ["root.render target", "App imports", "route table", "loaded source map"], "capstone 전용 route와 단일 composition root에 대상 component를 명시적으로 연결합니다.", "route별 render smoke test와 dead import audit를 둡니다."),
      d("접근성 검사 도구의 점수는 높지만 keyboard로 핵심 작업을 끝낼 수 없습니다.", "static rule scan을 실제 interaction evidence로 오해했습니다.", ["Tab/Shift+Tab path", "Enter/Space activation", "focus after state change", "screen reader name/role/state"], "도구 검사와 수동 keyboard·zoom·assistive technology journey를 함께 qualification합니다.", "release checklist에 task-completion evidence와 환경 matrix를 둡니다."),
    ],
    expertNotes: ["현재 원본에는 capstone 접근성 완료를 증명하는 automated/manual report가 없으므로 이 세션의 개선안을 원본 사실처럼 표현하지 않습니다.", "local source hash는 provenance이지 quality seal이 아닙니다. 동작은 target browser와 assistive technology에서 다시 검증합니다."],
    codeExamples: [nodeExample("react10-source-manifest", "원본 사실·공백·공개 가능 여부를 분리", "React10SourceManifest.mjs", "local source를 raw 문자열 없이 capability와 evidence 상태로 분류합니다.", String.raw`const files = [
  { id: "app", live: true, jsx: true, a11yEvidence: false },
  { id: "book", live: false, jsx: true, a11yEvidence: false },
  { id: "item-list", live: false, jsx: true, a11yEvidence: false },
  { id: "board", live: false, jsx: true, a11yEvidence: false },
  { id: "styles", live: true, jsx: false, a11yEvidence: false },
];
const live = files.filter((file) => file.live).map((file) => file.id);
const lessons = files.filter((file) => file.jsx).map((file) => file.id);
const qualified = files.filter((file) => file.a11yEvidence).map((file) => file.id);
console.log("files=" + files.length);
console.log("live=" + live.join(","));
console.log("jsx-lessons=" + lessons.join(","));
console.log("qualified=" + (qualified.join(",") || "none"));
console.log("gap=" + (lessons.length - qualified.length));`, "files=5\nlive=app,styles\njsx-lessons=app,book,item-list,board\nqualified=none\ngap=4", ["local-app", "local-app-css", "local-index-css", "local-book", "local-library", "local-item", "local-item-list", "local-board", "local-board-css", "local-react-jsx-doc", "local-react-state-doc", "react-jsx", "react-props"])],
  },
  {
    id: "jsx-render-tree-contract",
    title: "JSX를 HTML 문자열이 아니라 다음 render를 설명하는 element tree로 읽습니다",
    lead: "JSX의 모양보다 component가 props와 state snapshot으로 어떤 host elements, text와 relationships를 반환하는지가 사용자 경험의 출발점입니다.",
    explanations: [
      "JSX는 JavaScript syntax extension이며 build 단계에서 element description으로 변환됩니다. component function은 render 중 props/state/context를 읽어 description을 계산하므로 DOM 조회·mutation, random ID와 외부 side effect를 render 본문에 섞지 않습니다.",
      "여러 sibling은 실제 semantic wrapper 또는 Fragment로 묶습니다. Fragment는 DOM node를 추가하지 않으므로 layout wrapper가 필요 없는 경우 유용하지만 landmark나 list container가 필요한 자리에 Fragment를 쓰면 의미 관계도 생성되지 않습니다.",
      "React component 이름은 대문자로 시작하고 host element는 소문자로 씁니다. custom component가 최종적으로 어떤 host semantics를 내보내는지 API 문서와 browser tree에서 확인하며 이름이 Button인 것만으로 native button이라고 가정하지 않습니다.",
      "render purity는 같은 입력이 같은 결과를 만들고 이전 render의 object를 mutation하지 않는 계약입니다. development Strict Mode의 반복 render가 버그를 만드는 대신 숨겨진 mutation을 드러내도록 component와 fixture를 설계합니다.",
    ],
    concepts: [
      c("element tree", "component가 현재 입력으로 반환한 React element들의 계층적 description입니다.", ["DOM과 동일하지 않습니다.", "component/host boundaries를 포함합니다."]),
      c("Fragment", "추가 host wrapper 없이 여러 children을 group하는 React element입니다.", ["semantic container를 만들지 않습니다.", "명시 Fragment는 key를 받을 수 있습니다."]),
      c("render purity", "동일 입력에서 동일 JSX description을 계산하고 render 밖 상태를 변경하지 않는 성질입니다.", ["local calculation은 허용합니다.", "event side effect와 분리합니다."]),
    ],
    diagnostics: [
      d("screen reader landmark 목록에 main이 없고 모든 것이 div로만 보입니다.", "Fragment와 generic wrapper가 semantic host element를 대신했습니다.", ["rendered DOM", "accessibility tree", "component host output", "landmark list"], "layout과 semantic 역할을 분리해 header/nav/main/section/footer 등 적절한 host element를 출력합니다.", "role-based DOM tests와 landmark manual check를 둡니다."),
      d("Strict Mode에서 항목 수가 두 배로 늘어납니다.", "render 중 module/global array를 mutation했습니다.", ["component body writes", "shared references", "double render trace", "immutable result"], "render마다 새 result를 계산하고 mutation/side effect를 event 또는 Effect의 정확한 경계로 옮깁니다.", "deep-freeze fixture와 repeated-render equivalence test를 둡니다."),
    ],
    expertNotes: ["component abstraction은 DOM semantics를 숨길 수 있으므로 design system API에 rendered element와 accessible contract를 문서화합니다.", "Fragment 제거로 node 수가 줄어도 필요한 list/landmark relationship까지 제거하면 성능 최적화가 아닙니다."],
  },
  {
    id: "semantic-landmarks-headings",
    title: "landmark·heading·section 구조로 화면의 정보 architecture를 programmatically 표현합니다",
    lead: "시각적 크기와 여백만으로 구분한 화면은 CSS를 보지 못하는 사용자와 구조 탐색 기능에 같은 관계를 전달하지 못합니다.",
    explanations: [
      "한 page의 주요 content는 main으로 식별하고 반복 navigation에는 nav와 구체적인 accessible name을 제공합니다. header/footer는 위치에 따라 landmark가 될 수 있으므로 중첩 scope와 중복 이름을 accessibility tree에서 확인합니다.",
      "heading은 글자 크기 preset이 아니라 section의 이름입니다. page title에서 세부 section으로 논리적 outline을 만들되 component 재사용 때문에 heading level을 hard-code해야 한다면 caller가 context를 소유하거나 section labeling 관계를 명시합니다.",
      "목록 의미가 있는 반복 데이터는 ul/ol과 li로 표현합니다. grid/table 같은 복합 pattern이 정말 필요한 경우 keyboard model, rows/columns, selection state까지 구현할 비용을 먼저 평가하고 단순 목록으로 해결할 수 있으면 native semantics를 우선합니다.",
      "visually hidden heading/label은 display:none으로 제거하지 않고 접근 가능한 방식으로 숨깁니다. 반대로 화면에 보이는 text가 이미 충분한 이름이면 redundant aria-label로 다른 이름을 덮어쓰지 않습니다.",
    ],
    concepts: [
      c("landmark", "사용자가 page의 큰 영역 사이를 빠르게 이동하도록 목적을 노출하는 semantic region입니다.", ["main·nav·header·footer 등을 사용합니다.", "동일 role이 여러 개면 이름을 구분합니다."]),
      c("heading outline", "content section들의 이름과 계층을 heading levels로 표현한 구조입니다.", ["시각 크기와 독립적입니다.", "component context를 고려합니다."]),
      c("programmatic relationship", "시각적으로 표현한 group·label·order 관계를 DOM semantics로 도구가 해석할 수 있게 만든 연결입니다.", ["WCAG info and relationships와 연결됩니다.", "CSS만으로 만들지 않습니다."]),
    ],
    diagnostics: [
      d("heading shortcut으로 이동하면 level 1 다음 level 4로 건너뜁니다.", "component가 visual preset에 맞춰 heading tag를 고정했습니다.", ["heading outline", "component API", "page composition", "CSS class"], "content hierarchy를 먼저 정하고 style token과 semantic level을 분리합니다.", "route별 heading snapshot과 manual heading navigation을 둡니다."),
      d("두 navigation landmark가 모두 이름 없이 같은 항목으로 읽힙니다.", "반복 nav에 구분 가능한 accessible name이 없습니다.", ["accessibility tree names", "aria-labelledby targets", "visible headings", "duplicate landmarks"], "각 nav를 visible heading 또는 간결한 aria-label로 고유하게 식별합니다.", "duplicate landmark name rule과 screen reader landmark test를 둡니다."),
    ],
    expertNotes: ["ARIA role을 generic div에 추가하기 전에 native element가 제공하는 parsing, keyboard와 platform mapping을 우선 사용합니다.", "outline algorithm을 자동으로 완벽히 판정하는 것보다 실제 task에서 heading/landmark 탐색이 예측 가능한지 함께 확인합니다."],
    codeExamples: [nodeExample("react10-semantic-outline", "landmark와 heading outline 감사", "React10SemanticOutline.mjs", "합성 render tree에서 landmark 이름과 heading level jump를 계산합니다.", String.raw`const tree = {
  landmarks: [
    { role: "banner", name: "" },
    { role: "navigation", name: "Primary" },
    { role: "main", name: "Learning workspace" },
    { role: "contentinfo", name: "" },
  ],
  headings: [{ level: 1, text: "Workspace" }, { level: 2, text: "Modules" }, { level: 3, text: "Current module" }],
};
const named = tree.landmarks.filter((item) => item.name).map((item) => item.role + ":" + item.name);
const jumps = tree.headings.slice(1).filter((item, index) => item.level > tree.headings[index].level + 1);
console.log("landmarks=" + tree.landmarks.map((item) => item.role).join(","));
console.log("named=" + named.join("|"));
console.log("heading-levels=" + tree.headings.map((item) => item.level).join(">"));
console.log("level-jumps=" + jumps.length);
console.log("main-count=" + tree.landmarks.filter((item) => item.role === "main").length);`, "landmarks=banner,navigation,main,contentinfo\nnamed=navigation:Primary|main:Learning workspace\nheading-levels=1>2>3\nlevel-jumps=0\nmain-count=1", ["react-jsx", "react-fragment", "react-dom-common", "wcag-info-rel", "html-sections"])],
  },
  {
    id: "props-children-pure-composition",
    title: "props·children과 pure composition으로 semantic 책임을 잃지 않는 component API를 만듭니다",
    lead: "재사용 component가 style만 감싸면서 caller의 label, element type와 relationship을 버리면 abstraction이 접근성 결함을 확산시킵니다.",
    explanations: [
      "props는 parent render에서 child로 전달되는 read-only snapshot입니다. child는 props object나 전달된 array를 mutation하지 않고 callback으로 intent를 알리며 parent가 state와 validation을 소유합니다.",
      "children은 arbitrary nested content이므로 ButtonShell처럼 interactive element를 감싸는 component는 interactive descendants 중첩, empty accessible name과 disabled semantics를 검증해야 합니다. text가 반드시 필요하면 runtime/type contract와 design review를 둡니다.",
      "polymorphic as prop은 semantic flexibility를 주지만 href 없는 anchor, keyboard 없는 div button 같은 invalid combinations도 쉽게 만듭니다. 허용 조합을 discriminated API로 제한하고 기본값은 가장 흔한 native element로 둡니다.",
      "presentation component는 domain data 전체를 받기보다 화면에 필요한 label, description, status와 actions를 받습니다. 이 경계는 secret/PII가 client DOM·logs·snapshots로 과다 노출되는 것을 줄이고 accessible copy ownership도 명확히 합니다.",
    ],
    concepts: [
      c("semantic API", "component consumer가 element의 role·name·state와 relationships를 올바르게 제공하도록 유도하는 props contract입니다.", ["visual variants와 분리합니다.", "invalid combinations를 제한합니다."]),
      c("children composition", "parent가 nested UI를 child slot으로 전달해 wrapper와 content를 조합하는 방식입니다.", ["nested interactive content를 검증합니다.", "accessible name source를 보존합니다."]),
      c("pure component", "props/state/context가 같을 때 같은 UI description을 반환하며 외부 상태를 mutation하지 않는 component입니다.", ["memoization과 별개입니다.", "event side effect는 허용됩니다."]),
    ],
    diagnostics: [
      d("design-system Button에 아이콘만 전달하자 이름 없는 button이 됩니다.", "children이 항상 visible text일 것이라는 암묵적 가정이 깨졌습니다.", ["computed accessible name", "icon aria-hidden/title", "aria-label/labelledby", "component prop types"], "아이콘 전용 variant에 필수 label prop을 두고 decorative icon을 name computation에서 제외합니다.", "role/name query와 empty-label type/lint test를 둡니다."),
      d("as=div인 Link component가 mouse로만 동작합니다.", "visual polymorphism이 native interaction semantics를 제거했습니다.", ["rendered tag", "href", "Tab order", "Enter/Space behavior"], "navigation은 anchor+href, action은 button을 사용하고 unsupported polymorphic combinations를 금지합니다.", "element/role/keyboard contract tests를 variant마다 둡니다."),
    ],
    expertNotes: ["prop spreading으로 unknown aria-*와 event handlers를 무조건 forwarding하면 ownership과 security review가 흐려집니다. 허용 surface를 문서화합니다.", "accessible copy도 product contract이므로 localization에서 label과 description이 비거나 중복되지 않는지 longest-locale까지 시험합니다."],
  },
  {
    id: "conditional-complete-ui-states",
    title: "loading·empty·error·success·stale 상태를 완전한 UI state machine으로 렌더합니다",
    lead: "happy path만 JSX로 만들면 실제 network와 permission 실패에서 빈 화면, focus loss와 중복 announcement가 발생합니다.",
    explanations: [
      "conditional rendering은 if, ternary와 &&를 사용할 수 있지만 각 branch가 어떤 task를 허용하고 이전 content를 유지하는지 state table로 먼저 정의합니다. 숫자 0 같은 falsy value가 text node로 남는 && 반례도 boundary test에 포함합니다.",
      "loading은 최초 load와 background refresh를 구분합니다. 기존 성공 content가 있으면 무조건 지우고 spinner만 보여 주기보다 stale 표시와 busy state를 사용해 context와 focus를 보존합니다.",
      "empty는 정상적인 0건 결과이고 error는 요청이 완료되지 않은 상태입니다. 각각 명확한 heading/message, retry 또는 filter reset action을 제공하고 status/alert live region은 urgency와 중복 announcement를 고려해 최소 범위에 둡니다.",
      "state transition 후 focus는 사용자가 다음 행동을 예측할 수 있는 위치에 남겨야 합니다. 삭제된 row 내부 focus, modal close와 route error 같은 경우 trigger, next item 또는 error summary로 명시적으로 복구합니다.",
    ],
    concepts: [
      c("UI state machine", "허용 가능한 화면 상태와 event에 따른 transition을 명시한 모델입니다.", ["boolean 조합의 불가능 상태를 줄입니다.", "focus/announcement도 output에 포함합니다."]),
      c("live region", "DOM 변화가 assistive technology에 announcement되도록 politeness와 atomicity를 지정한 영역입니다.", ["모든 변경에 쓰지 않습니다.", "중복·과다 announcement를 시험합니다."]),
      c("stale content", "새 요청이 진행 중이지만 이전 성공 결과가 아직 화면에 남아 있는 상태입니다.", ["freshness를 표시합니다.", "action enablement를 정의합니다."]),
    ],
    diagnostics: [
      d("재조회할 때마다 focus가 body로 이동합니다.", "조건 branch가 focus된 subtree를 unmount하고 복구 정책이 없습니다.", ["activeElement before/after", "component keys", "branch DOM identity", "focus destination"], "가능하면 stable shell을 유지하고 unavoidable removal 뒤 trigger/heading/next item으로 focus를 복구합니다.", "state transition별 focus assertion을 둡니다."),
      d("error message가 화면에는 있지만 screen reader에 전달되지 않거나 반복 낭독됩니다.", "live region이 늦게 생성되거나 전체 page를 매 render 갱신합니다.", ["region existence timing", "role/status/alert", "changed text scope", "duplicate updates"], "stable live region에 짧은 변경 text만 갱신하고 urgency를 error severity에 맞춥니다.", "announcement count를 assistive technology matrix에서 수동 검증합니다."),
    ],
    expertNotes: ["aria-busy는 loading UI를 대신하지 않으며 user가 기다리는 대상과 available actions를 visible text로도 설명합니다.", "Suspense/error boundary를 사용해도 domain empty/permission/stale semantics와 focus recovery는 application이 소유합니다."],
    codeExamples: [nodeExample("react10-ui-states", "완전한 화면 상태와 접근성 output", "React10UiStates.mjs", "load result를 loading/empty/error/success state와 announcement/action으로 변환합니다.", String.raw`function view(model) {
  if (model.error) return { state: "error", role: "alert", text: "Could not load modules", action: "retry" };
  if (model.loading && model.items.length === 0) return { state: "loading", role: "status", text: "Loading modules", action: "none" };
  if (!model.loading && model.items.length === 0) return { state: "empty", role: "status", text: "No modules found", action: "reset-filter" };
  return { state: model.loading ? "stale" : "success", role: "region", text: model.items.length + " modules", action: "open" };
}
const cases = [
  { loading: true, items: [], error: false },
  { loading: false, items: [], error: false },
  { loading: false, items: [], error: true },
  { loading: true, items: [{ id: "m1" }], error: false },
];
for (const value of cases) {
  const result = view(value);
  console.log([result.state, result.role, result.text, result.action].join("|"));
}`, "loading|status|Loading modules|none\nempty|status|No modules found|reset-filter\nerror|alert|Could not load modules|retry\nstale|region|1 modules|open", ["react-conditional", "react-purity", "react-dom-common", "wcag-info-rel"])],
  },
  {
    id: "list-key-identity-semantics",
    title: "semantic list와 stable key로 데이터 identity·순서·local state를 함께 보존합니다",
    lead: "key warning을 없애는 값과 사용자의 item identity를 보존하는 값은 같아야 하며 배열 index는 reorder 가능한 목록에서 그 계약을 만족하지 않습니다.",
    explanations: [
      "map으로 elements를 만들 때 key는 sibling scope에서 unique하고 data에서 안정적으로 유도되어야 합니다. render 중 random 값이나 array index는 insert, sort, filter에서 같은 logical item에 다른 identity를 주거나 다른 item에 이전 state를 붙일 수 있습니다.",
      "key는 child prop으로 자동 전달되지 않으므로 child가 ID를 표시하거나 action에 사용해야 하면 id prop을 별도로 전달합니다. database ID가 없으면 item 생성 시 stable local ID를 부여하고 persistence/export contract를 정의합니다.",
      "UI가 목록처럼 보이면 ul/ol/li semantics를 사용합니다. card grid가 list semantics인지, 순서가 의미 있는지, description list/table이 더 맞는지 content relationship을 기준으로 선택합니다.",
      "optimistic insert/delete/reorder에서는 server response가 temporary ID를 바꿀 때 focus와 local draft state가 reset되지 않도록 identity mapping을 계획합니다. 중복 key warning뿐 아니라 selection/focus가 logical item을 따라가는지 시험합니다.",
    ],
    concepts: [
      c("stable key", "sibling list에서 같은 logical item을 render 사이 식별하는 안정된 값입니다.", ["globally unique일 필요는 없습니다.", "index/random을 reorder 목록에 쓰지 않습니다."]),
      c("reconciliation identity", "이전과 다음 element를 같은 logical position/component instance로 대응시키는 기준입니다.", ["type·position·key가 관련됩니다.", "local state 보존에 영향 줍니다."]),
      c("semantic list", "반복 items의 집합/순서 관계를 ul·ol·li 등으로 programmatically 표현한 구조입니다.", ["generic div collection과 다릅니다.", "item count/navigation에 도움 됩니다."]),
    ],
    diagnostics: [
      d("정렬 후 편집 input 값이 다른 row로 이동합니다.", "array index key가 position을 identity로 사용했습니다.", ["key values before/after", "data IDs", "row local state", "sort/filter operation"], "stable domain/local IDs를 key로 사용하고 temp-to-server ID transition을 보존합니다.", "reorder 중 selection/input/focus가 ID를 따라가는 integration test를 둡니다."),
      d("key를 child에서 읽으려 했지만 undefined입니다.", "React의 reconciliation-only key를 일반 prop으로 오해했습니다.", ["child props", "JSX key/id", "event payload", "DOM attribute"], "필요한 identifier는 key와 별도로 id prop으로 전달합니다.", "component prop contract와 action ID test를 둡니다."),
    ],
    expertNotes: ["key 변경으로 state를 의도적으로 reset할 수 있지만 우연한 key drift와 구분해 reset reason을 test name에 명시합니다.", "virtualized list는 DOM window가 작아도 accessible position/count, focus persistence와 offscreen navigation을 product requirement에 맞게 검증합니다."],
    codeExamples: [nodeExample("react10-key-reconciliation", "index key와 stable ID의 state 이동 비교", "React10Keys.mjs", "reorder 전 item별 draft를 index와 stable ID로 재연결해 차이를 출력합니다.", String.raw`const before = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
];
const draftsByIndex = new Map([[0, ""], [1, "edited"], [2, ""]]);
const draftsById = new Map([["a", ""], ["b", "edited"], ["c", ""]]);
const after = [before[2], before[0], before[1]];
const indexOwner = after.find((_, index) => draftsByIndex.get(index) === "edited").id;
const stableOwner = after.find((item) => draftsById.get(item.id) === "edited").id;
console.log("order=" + after.map((item) => item.id).join(","));
console.log("index-draft-owner=" + indexOwner);
console.log("stable-draft-owner=" + stableOwner);
console.log("identity-preserved=" + (stableOwner === "b"));
console.log("list-items=" + after.length);`, "order=c,a,b\nindex-draft-owner=a\nstable-draft-owner=b\nidentity-preserved=true\nlist-items=3", ["local-item", "local-item-list", "local-react-jsx-doc", "local-react-state-doc", "react-lists"])],
  },
  {
    id: "native-actions-accessible-name",
    title: "button·link와 accessible name을 사용해 action과 navigation 의도를 일치시킵니다",
    lead: "click handler가 있다는 이유로 div를 control로 만들면 keyboard activation, focus, disabled와 platform role을 다시 불완전하게 구현하게 됩니다.",
    explanations: [
      "현재 page에서 상태를 바꾸는 action은 button, 실제 URL로 이동하는 navigation은 anchor+href를 기본으로 사용합니다. router Link도 최종 anchor semantics와 새 tab/copy address behavior를 보존하는지 확인합니다.",
      "accessible name은 visible text, associated label, aria-labelledby 또는 필요한 경우 aria-label에서 계산됩니다. aria-label은 visible text를 덮어쓸 수 있으므로 같은 의도인지 확인하고 icon-only control에만 간결하고 번역 가능한 이름을 제공합니다.",
      "disabled native button은 focus/submit/event behavior가 바뀝니다. 설명이 필요해 focusable 상태를 유지할 경우 aria-disabled만 붙이고 action guard를 빼먹지 않으며, 왜 사용할 수 없는지 가까운 text로 전달합니다.",
      "3×3 Board의 숫자 button은 native activation은 있지만 숫자만으로 cell meaning/selection/player state가 충분한지 product context에서 결정해야 합니다. selected/pressed/current 같은 state는 widget pattern에 맞는 attribute와 visible indicator를 함께 둡니다.",
    ],
    concepts: [
      c("accessible name", "assistive technology가 control/region을 식별할 때 사용하는 계산된 이름입니다.", ["visible label과 일치시킵니다.", "description과 역할이 다릅니다."]),
      c("native semantics", "HTML element가 기본으로 제공하는 role, focus, keyboard, form와 platform behavior입니다.", ["ARIA보다 우선합니다.", "CSS로 외형을 바꿀 수 있습니다."]),
      c("action/navigation distinction", "현재 context의 동작과 resource location 이동을 button/anchor로 구분하는 계약입니다.", ["keyboard와 browser 기능에 영향 줍니다.", "visual style과 독립적입니다."]),
    ],
    diagnostics: [
      d("mouse click은 되지만 Tab으로 control에 도달할 수 없습니다.", "onClick을 generic div에 붙여 native interactive semantics를 잃었습니다.", ["rendered tag", "tab order", "role/name", "Enter/Space"], "action은 native button, navigation은 href가 있는 anchor로 바꿉니다.", "keyboard-only critical journey와 semantic element lint를 둡니다."),
      d("screen reader가 icon button을 이름 없이 button이라고만 읽습니다.", "icon에 visible/associated accessible name source가 없습니다.", ["computed name", "visible text", "aria-label/labelledby", "SVG title/aria-hidden"], "localizable label을 button에 제공하고 decorative SVG를 name 계산에서 제외합니다.", "모든 interactive role을 name query로 검증합니다."),
    ],
    expertNotes: ["ARIA로 role=button을 추가해도 native button의 form, disabled와 keyboard behavior가 자동으로 모두 생기지 않습니다.", "accessible name은 존재 여부뿐 아니라 음성 명령 사용자가 보이는 label로 찾을 수 있도록 label-in-name도 고려합니다."],
    codeExamples: [nodeExample("react10-accessible-name", "visible text·labelledby·aria-label 이름 우선순위", "React10AccessibleName.mjs", "간소화한 name source policy로 control audit 결과를 만듭니다.", String.raw`function nameOf(control, labels) {
  if (control.ariaLabel) return control.ariaLabel.trim();
  if (control.labelledBy.length > 0) return control.labelledBy.map((id) => labels[id] || "").join(" ").trim();
  return control.text.trim();
}
const labels = { saveText: "Save draft", panelTitle: "Module filters" };
const controls = [
  { role: "button", text: "Save draft", ariaLabel: "", labelledBy: [] },
  { role: "button", text: "", ariaLabel: "Close panel", labelledBy: [] },
  { role: "region", text: "", ariaLabel: "", labelledBy: ["panelTitle"] },
  { role: "button", text: "", ariaLabel: "", labelledBy: [] },
];
const names = controls.map((control) => nameOf(control, labels));
console.log("names=" + names.map((name) => name || "unnamed").join("|"));
console.log("unnamed=" + names.filter((name) => !name).length);
console.log("buttons=" + controls.filter((item) => item.role === "button").length);
console.log("named-region=" + names[2]);`, "names=Save draft|Close panel|Module filters|unnamed\nunnamed=1\nbuttons=3\nnamed-region=Module filters", ["local-board", "local-board-css", "react-dom-common", "aria-names", "html-button"] )],
  },
  {
    id: "css-focus-contrast-preferences",
    title: "CSS가 focus·contrast·zoom·motion preference를 지우지 않도록 visual contract를 검증합니다",
    lead: "접근 가능한 DOM도 focus indicator가 보이지 않거나 zoom에서 content가 잘리고 motion preference를 무시하면 task를 완료하기 어렵습니다.",
    explanations: [
      "focus-visible style은 background, outline과 offset 등 주변 색상에서 식별 가능한 indicator를 제공합니다. outline:none을 쓸 때는 동등 이상의 대체 indicator와 forced-colors 동작을 증명해야 하며 mouse focus와 keyboard focus의 요구를 구분합니다.",
      "text와 meaningful icons/boundaries의 contrast를 실제 computed colors, states와 gradients에서 측정합니다. hover만 다른 색, disabled text, placeholder와 error border도 state matrix에 포함하며 color만으로 status를 구분하지 않습니다.",
      "200% text zoom과 좁은 viewport에서 horizontal two-dimensional scroll 없이 content와 controls가 reflow되는지 확인합니다. fixed pixels, min-width, absolute positioning과 clipped text를 longest locale/large font에서 시험합니다.",
      "prefers-reduced-motion은 장식 animation을 끄거나 duration을 줄이는 정책으로 사용하되 essential state change는 text/position 변화로 명확히 전달합니다. prefers-contrast/forced-colors support는 target browser matrix에서 실제 system settings로 확인합니다.",
    ],
    concepts: [
      c("focus indicator", "현재 keyboard focus 위치를 시각적으로 식별시키는 상태 표현입니다.", ["DOM focus와 일치해야 합니다.", "contrast와 clipping을 검증합니다."]),
      c("reflow", "viewport 또는 text 확대에서도 content와 기능이 읽을 수 있는 layout으로 재배치되는 성질입니다.", ["two-dimensional scrolling을 줄입니다.", "zoom과 localization을 함께 시험합니다."]),
      c("reduced motion", "사용자가 non-essential animation을 줄이도록 요청하는 media preference입니다.", ["모든 motion을 무조건 숨기는 의미는 아닙니다.", "대체 state cue가 필요합니다."]),
    ],
    diagnostics: [
      d("Tab 이동은 되지만 현재 위치가 보이지 않습니다.", "global reset 또는 component style이 outline을 제거했고 대체 focus-visible indicator가 없습니다.", ["computed outline/box-shadow", ":focus-visible match", "overflow clipping", "forced colors"], "design token으로 고대비 focus ring을 제공하고 component overflow에서 잘리지 않게 합니다.", "critical controls의 focus screenshot과 computed-style assertions를 둡니다."),
      d("200% zoom에서 action button이 화면 밖에 고정됩니다.", "fixed width/position과 nowrap이 content reflow를 막습니다.", ["viewport width", "scroll axes", "min-width", "longest labels"], "flex/grid wrapping, relative sizing와 content-driven breakpoints로 재구성합니다.", "320 CSS px와 200% zoom, longest-locale visual regression을 둡니다."),
    ],
    expertNotes: ["자동 contrast 계산은 opacity, background image와 OS forced colors를 놓칠 수 있어 representative screenshots와 system preference tests를 병행합니다.", "motion을 끄는 media query가 존재하는 것과 모든 animated component가 그 token을 사용하는 것은 다른 증거입니다."],
    codeExamples: [nodeExample("react10-css-preferences", "motion·contrast·focus policy 결정", "React10CssPreferences.mjs", "합성 user preferences와 component state로 허용된 animation/focus token을 계산합니다.", String.raw`function tokens(preference) {
  return {
    duration: preference.reducedMotion ? 0 : 180,
    focusWidth: preference.highContrast ? 4 : 3,
    outlineStyle: preference.forcedColors ? "solid" : "double",
    columns: preference.narrow ? 1 : 3,
  };
}
const normal = tokens({ reducedMotion: false, highContrast: false, forcedColors: false, narrow: false });
const adapted = tokens({ reducedMotion: true, highContrast: true, forcedColors: true, narrow: true });
console.log("normal=" + [normal.duration, normal.focusWidth, normal.outlineStyle, normal.columns].join(","));
console.log("adapted=" + [adapted.duration, adapted.focusWidth, adapted.outlineStyle, adapted.columns].join(","));
console.log("motion-off=" + (adapted.duration === 0));
console.log("focus-visible=" + (adapted.focusWidth >= 3));
console.log("single-column=" + (adapted.columns === 1));`, "normal=180,3,double,3\nadapted=0,4,solid,1\nmotion-off=true\nfocus-visible=true\nsingle-column=true", ["local-app-css", "local-index-css", "local-board-css", "wcag-focus-visible", "wcag-contrast", "wcag-reflow"])],
  },
  {
    id: "images-icons-nontext-content",
    title: "image·icon·chart의 목적에 맞춰 text alternative와 실패 경로를 설계합니다",
    lead: "파일 이름이나 generic 아이콘 설명을 alt로 복사하는 대신 해당 context에서 이미지가 전달하는 정보와 action을 text로 동등하게 제공합니다.",
    explanations: [
      "informative image는 같은 목적을 전달하는 concise alt를 제공하고 주변 caption과 중복을 피합니다. decorative image는 empty alt로 name computation에서 제외하며 CSS background로 옮겼다고 해서 meaningful information을 잃지 않게 합니다.",
      "link/button 안 image는 이미지 외형보다 action destination을 accessible name으로 표현합니다. icon-only action은 button label을 제공하고 SVG path/title의 browser별 name 조합에만 의존하지 않습니다.",
      "chart와 complex diagram은 짧은 summary와 동일 data/table 또는 자세한 설명으로 task를 수행할 수 있게 합니다. color legend만으로 categories를 구분하지 않고 label, pattern 또는 shape를 병행합니다.",
      "remote asset failure, slow load와 blocked third-party request에서도 layout, name과 core action이 유지되어야 합니다. 이번 공개 예제는 원본의 asset 이름/주소를 복사하지 않고 합성 local identifiers만 사용합니다.",
    ],
    concepts: [
      c("text alternative", "non-text content의 목적이나 정보를 text로 동등하게 전달하는 대안입니다.", ["context에 따라 달라집니다.", "caption과 중복을 피합니다."]),
      c("decorative image", "정보나 기능을 추가하지 않아 assistive technology에서 무시되어야 하는 이미지입니다.", ["empty alt를 사용합니다.", "missing alt와 다릅니다."]),
      c("accessible fallback", "asset/network failure에도 이름, 구조와 핵심 task를 유지하는 대체 표현입니다.", ["layout shift를 통제합니다.", "third-party dependency를 최소화합니다."]),
    ],
    diagnostics: [
      d("screen reader가 모든 thumbnail을 파일 이름으로 읽습니다.", "alt가 생략되거나 asset path를 그대로 사용했습니다.", ["computed name", "alt values", "surrounding caption", "image purpose"], "informative/decorative/functional 목적별 alt policy를 적용합니다.", "image fixture별 accessible name snapshot과 content review를 둡니다."),
      d("이미지 CDN 차단 시 card action 이름까지 사라집니다.", "button/link의 유일한 name source가 load에 실패한 image metadata였습니다.", ["network blocked state", "link/button name", "visible fallback", "layout dimensions"], "action에 안정된 text label을 제공하고 image는 보조 content로 둡니다.", "offline/blocked-asset journey를 release test에 둡니다."),
    ],
    expertNotes: ["alt 품질은 linter가 완전히 판정할 수 없으므로 content owner와 장애 사용자 관점의 task review가 필요합니다.", "sensitive user-generated image metadata와 file names를 alt/telemetry에 그대로 노출하지 않습니다."],
  },
  {
    id: "responsive-localized-rendering",
    title: "zoom·localization·content variability에서도 DOM order와 reading order를 일치시킵니다",
    lead: "desktop 한 viewport의 screenshot이 맞아도 CSS visual order가 DOM reading order와 다르거나 번역 text가 잘리면 component contract는 깨집니다.",
    explanations: [
      "flex/grid order로 visual 순서만 바꾸면 keyboard focus와 screen reader reading order는 DOM을 따를 수 있습니다. source order를 logical task sequence로 두고 responsive layout이 그 순서를 시각적으로도 보존하도록 합니다.",
      "고정 height와 text truncation은 번역, user font와 validation message에서 정보를 숨길 수 있습니다. wrapping과 content-driven sizing을 기본으로 하고 truncation이 필요하면 full text에 접근 가능한 경로를 제공합니다.",
      "number/date/unit은 locale-aware formatting을 사용하되 accessible name이 symbol만으로 모호하지 않은지 확인합니다. RTL에서는 margin-left 같은 physical properties보다 logical properties와 icon direction semantics를 검토합니다.",
      "SSR/hydration을 쓰는 환경에서는 locale, random ID와 viewport-dependent branch가 server/client tree를 다르게 만들 수 있습니다. deterministic initial tree와 post-hydration enhancement를 분리하고 accessibility attributes가 flicker하지 않게 합니다.",
    ],
    concepts: [
      c("logical order", "reading, focus와 task completion이 따라야 하는 content 순서입니다.", ["DOM source order를 우선합니다.", "CSS visual order와 대조합니다."]),
      c("content resilience", "긴 번역, zoom, missing data와 user font에서도 정보와 action이 손실되지 않는 layout 성질입니다.", ["고정 높이를 경계합니다.", "empty/long values를 시험합니다."]),
      c("hydration parity", "server markup과 client 첫 render가 의미와 structure에서 일치하는 성질입니다.", ["IDs와 locale을 deterministic하게 합니다.", "warning 없는 것만으로 충분하지 않습니다."]),
    ],
    diagnostics: [
      d("mobile에서 시각상 첫 action이 Tab 순서에서는 마지막입니다.", "CSS order로만 card actions를 재배치했습니다.", ["DOM order", "computed visual order", "Tab sequence", "screen reader reading order"], "DOM을 logical order로 재구성하고 grid areas로 placement만 조정합니다.", "viewport별 keyboard/reading order assertions를 둡니다."),
      d("번역 locale에서 label이 잘려 두 buttons가 같은 text처럼 보입니다.", "fixed width와 ellipsis가 unique action text를 숨겼습니다.", ["longest locale", "zoom", "accessible names", "tooltip keyboard access"], "wrapping/content sizing을 허용하고 full unique label을 visible하게 유지합니다.", "pseudo-localization과 200% text zoom regression을 둡니다."),
    ],
    expertNotes: ["visual regression은 DOM/accessibility order를 보지 못하므로 role/name/focus assertions와 함께 사용합니다.", "client-only viewport branch보다 CSS media query를 우선하면 hydration mismatch와 resize state를 줄일 수 있습니다."],
  },
  {
    id: "accessibility-testing-evidence",
    title: "role·name·state query와 keyboard task를 중심으로 접근성 evidence를 축적합니다",
    lead: "snapshot 전체 DOM을 승인하는 대신 사용자가 인식하고 조작하는 semantic contract를 test oracle로 삼습니다.",
    explanations: [
      "component test는 role과 accessible name으로 element를 찾고 checked/expanded/current/invalid/busy 같은 state와 관계를 확인합니다. test-id는 semantic query로 표현할 수 없는 implementation detail에 제한합니다.",
      "keyboard test는 Tab/Shift+Tab, Enter/Space, Escape와 pattern-specific arrows를 실제 focus 이동과 action 결과로 검증합니다. programmatic click만 호출하면 native activation과 focusability 결함을 놓칩니다.",
      "automated rules는 missing names, invalid ARIA와 일부 contrast를 빠르게 찾지만 reading order, meaningful alt, announcement timing과 task usability를 완전히 판정하지 못합니다. manual review와 representative assistive technology matrix를 유지합니다.",
      "test fixture에는 합성 비식별 data만 사용하고 production DOM, screenshots와 analytics payload를 그대로 저장하지 않습니다. 실패 artifact에서도 typed text와 query response를 redact하고 retention을 제한합니다.",
    ],
    concepts: [
      c("semantic query", "role, accessible name, label과 state처럼 사용자가 인식하는 contract로 element를 찾는 test 방식입니다.", ["implementation class보다 안정적입니다.", "name computation을 검증합니다."]),
      c("keyboard journey", "mouse 없이 focus 이동과 activation으로 핵심 task를 완료하는 end-to-end 경로입니다.", ["focus recovery를 포함합니다.", "browser default behavior를 사용합니다."]),
      c("evidence matrix", "자동 검사, DOM test, browser, keyboard, zoom와 assistive technology 결과를 환경별로 기록한 표입니다.", ["한 점수로 합치지 않습니다.", "known gaps/owners를 둡니다."]),
    ],
    diagnostics: [
      d("DOM snapshot은 통과하지만 button 이름이 사라졌습니다.", "구조 전체 snapshot이 의미 변화에 대한 명시 assertion을 제공하지 못했습니다.", ["role/name queries", "snapshot diff review", "translation fixture", "icon-only variants"], "critical roles/names/states를 직접 assert하고 snapshot은 보조 artifact로 줄입니다.", "component contract별 semantic assertions를 필수화합니다."),
      d("자동 접근성 scan 0건인데 modal에서 keyboard가 빠져나갑니다.", "rule engine이 interaction focus lifecycle을 실행하지 않았습니다.", ["initial focus", "Tab loop", "Escape", "return focus"], "user-event/browser journey로 open→navigate→close→return focus를 검증합니다.", "복합 widget마다 keyboard pattern test와 manual AT review를 둡니다."),
    ],
    expertNotes: ["지원 AT/browser matrix는 무한하지 않으므로 사용자 분석과 risk를 근거로 대표 조합과 최소 standards baseline을 문서화합니다.", "접근성 test failure를 flaky로 무시하지 않고 focus timing, animation과 async state root cause를 재현 가능한 clock/network fixture로 고정합니다."],
    codeExamples: [nodeExample("react10-a11y-gate", "role·name·state·keyboard evidence release gate", "React10A11yGate.mjs", "capstone route들의 합성 검사 결과를 severity와 owner가 있는 release decision으로 집계합니다.", String.raw`const evidence = [
  { route: "modules", semantic: true, keyboard: true, zoom: true, at: true },
  { route: "module-detail", semantic: true, keyboard: true, zoom: true, at: true },
  { route: "settings", semantic: true, keyboard: false, zoom: true, at: false },
];
const fields = ["semantic", "keyboard", "zoom", "at"];
const failures = evidence.flatMap((row) => fields.filter((field) => !row[field]).map((field) => row.route + ":" + field));
const passingRoutes = evidence.filter((row) => fields.every((field) => row[field])).map((row) => row.route);
console.log("routes=" + evidence.length);
console.log("passing=" + passingRoutes.join(","));
console.log("failures=" + failures.join(","));
console.log("release=" + (failures.length === 0 ? "go" : "hold"));
console.log("failure-count=" + failures.length);`, "routes=3\npassing=modules,module-detail\nfailures=settings:keyboard,settings:at\nrelease=hold\nfailure-count=2", ["react-dom-common", "wcag-keyboard", "wcag-name-role-value", "wcag-focus-visible", "wcag-reflow"])],
  },
  {
    id: "capstone-component-architecture",
    title: "capstone을 page shell·semantic primitives·domain components·state adapters로 조립합니다",
    lead: "한 거대한 App component에 JSX, fetch, formatting과 keyboard logic을 모으면 semantics와 failure states를 독립적으로 검증하기 어렵습니다.",
    explanations: [
      "page shell은 skip link, landmarks, heading context와 route focus를 소유하고 semantic primitive는 Button, Link, Field, Status, VisuallyHidden 같은 낮은 수준 contract를 제공합니다. domain component는 ModuleCard/List처럼 user task와 accessible copy를 소유합니다.",
      "data adapter는 remote/domain model을 presentation-safe view model로 바꾸며 secrets, internal fields와 remote asset URLs를 component tree에 그대로 전달하지 않습니다. loading/error/empty/stale state는 typed result로 page에 전달합니다.",
      "CSS는 component state attribute와 design tokens에 연결하고 DOM order를 layout convenience에 맞춰 뒤집지 않습니다. interaction은 native controls와 explicit callbacks로 연결해 propagation에 숨은 dependency를 줄입니다.",
      "capstone definition of done은 screenshot이 아니라 source provenance, semantic tree, all states, stable keys, keyboard/zoom/motion/contrast, sanitized fixtures와 rollback evidence가 모두 연결된 것입니다.",
    ],
    concepts: [
      c("semantic primitive", "native semantics와 조직의 style/accessibility policy를 재사용 가능한 최소 component로 묶은 abstraction입니다.", ["rendered element를 문서화합니다.", "escape hatch를 제한합니다."]),
      c("view model", "domain/remote data를 UI가 필요한 안전한 fields와 state로 변환한 presentation input입니다.", ["secret/PII 최소화에 도움 됩니다.", "formatting/absence 정책을 포함합니다."]),
      c("definition of done", "기능·접근성·보안·운영 증거가 충족되어야 완료로 판단하는 검증 기준입니다.", ["점수 하나가 아닙니다.", "owners와 exceptions를 기록합니다."]),
    ],
    diagnostics: [
      d("같은 icon button 결함이 여러 routes에서 반복됩니다.", "semantic primitive 없이 각 domain component가 control을 직접 재구현했습니다.", ["duplicate markup", "design-system variants", "role/name failures", "dependency versions"], "검증된 Button/IconButton primitive로 수렴하고 migration codemod와 exception list를 운영합니다.", "primitive contract suite를 모든 variants에 실행합니다."),
      d("API response의 내부 field가 DOM data attribute에 노출됩니다.", "domain object를 view에 무차별 spread했습니다.", ["component props", "rendered DOM", "network response", "analytics payload"], "allowlisted view model로 필요한 fields만 전달하고 sensitive-field scan을 둡니다.", "synthetic fixture와 DOM/log secret scan을 CI에 둡니다."),
    ],
    expertNotes: ["design system이 접근성을 중앙화할 수 있지만 잘못된 primitive는 결함도 중앙 배포하므로 versioned qualification과 rollback이 필요합니다.", "semantic abstraction과 domain abstraction의 경계를 분리하면 HTML 표준 변경과 product copy 변경을 독립적으로 시험할 수 있습니다."],
  },
  {
    id: "release-observability-governance",
    title: "접근성을 release gate·telemetry·사용자 feedback·복구 절차로 운영합니다",
    lead: "개발 시점의 검사만 통과해도 content, locale, feature flag와 dependency upgrade가 runtime accessibility를 다시 깨뜨릴 수 있습니다.",
    explanations: [
      "CI에서는 type/lint/unit/semantic browser scan과 production build를 실행하고 preview environment에서 keyboard, zoom와 reduced-motion smoke를 수행합니다. blocker 기준과 time-bounded exception에는 owner, 영향, 대체 경로와 만료일을 둡니다.",
      "production telemetry는 개인의 assistive technology 사용 여부를 추적하지 않고 generic task failure, validation loop, focus-loss proxy 같은 최소 aggregate signal을 privacy review 아래 사용합니다. 정성적인 사용자 feedback channel과 support escalation을 함께 둡니다.",
      "content/locale/CSS/design-system 변경도 code와 같은 semantic contract를 깨뜨릴 수 있으므로 canary, visual+semantic diff와 rollback artifact를 준비합니다. cache/CDN rollback 뒤 HTML/JS chunk version mismatch도 확인합니다.",
      "incident에서는 affected journey, role/name/focus regression, introduced version과 workaround를 기록하고 hotfix 후 automated regression과 design rule을 보강합니다. 접근성을 별도 마지막 QA가 아니라 component lifecycle의 품질 속성으로 운영합니다.",
    ],
    concepts: [
      c("accessibility release gate", "정의한 semantic/keyboard/visual/AT evidence가 충족되지 않으면 배포를 중지하는 기준입니다.", ["risk와 severity를 명시합니다.", "예외에 expiry를 둡니다."]),
      c("privacy-preserving telemetry", "민감한 사용자 특성을 수집하지 않고 task-level failure를 최소 집계하는 관측 방식입니다.", ["consent와 retention을 검토합니다.", "개별 AT 탐지를 피합니다."]),
      c("semantic rollback", "이전 artifact로 되돌린 뒤 role/name/state/focus contract까지 복구됐는지 확인하는 절차입니다.", ["visual rollback만 보지 않습니다.", "cache compatibility를 확인합니다."]),
    ],
    diagnostics: [
      d("번역 배포 후 특정 locale에서만 accessible name이 비었습니다.", "message key 누락을 visual fallback이 가렸고 semantic gate가 locale matrix를 실행하지 않았습니다.", ["locale bundles", "computed names", "fallback chain", "canary errors"], "critical labels의 required-key validation과 pseudo/locales semantic tests를 추가합니다.", "모든 supported locale에 empty accessible-name gate를 둡니다."),
      d("rollback했지만 일부 사용자는 이전 HTML과 새 JS chunk 조합으로 계속 실패합니다.", "CDN/service worker cache version과 atomic artifact promotion을 확인하지 않았습니다.", ["HTML/chunk hashes", "cache headers", "service worker", "canary session versions"], "versioned immutable assets와 atomic HTML promotion, cache purge/runbook을 적용합니다.", "rollback rehearsal에 semantic smoke와 mixed-version detection을 포함합니다."),
    ],
    expertNotes: ["사용자의 disability/AT fingerprint를 제품 telemetry로 추론하는 것은 접근성 개선을 명분으로 한 privacy 침해가 될 수 있습니다.", "governance는 exception을 영구 backlog로 숨기지 않고 user impact, owner와 expiry를 공개적으로 추적해야 합니다."],
    codeExamples: [nodeExample("react10-capstone-scorecard", "capstone release scorecard와 exception expiry", "React10Scorecard.mjs", "필수 evidence와 exception 상태로 deterministic release 결정을 내립니다.", String.raw`const checks = [
  { id: "semantic", pass: true, required: true },
  { id: "keyboard", pass: true, required: true },
  { id: "zoom", pass: true, required: true },
  { id: "motion", pass: true, required: true },
  { id: "screen-reader", pass: true, required: true },
  { id: "optional-legacy", pass: false, required: false },
];
const blocking = checks.filter((item) => item.required && !item.pass).map((item) => item.id);
const advisory = checks.filter((item) => !item.required && !item.pass).map((item) => item.id);
console.log("required=" + checks.filter((item) => item.required).length);
console.log("blocking=" + (blocking.join(",") || "none"));
console.log("advisory=" + advisory.join(","));
console.log("release=" + (blocking.length === 0 ? "go" : "hold"));
console.log("evidence-complete=" + (blocking.length === 0));`, "required=5\nblocking=none\nadvisory=optional-legacy\nrelease=go\nevidence-complete=true", ["react-purity", "wcag-info-rel", "wcag-keyboard", "wcag-name-role-value", "wcag-contrast", "wcag-non-text"])],
  },
];

const sources: SessionSource[] = [
  { id: "local-app", repository: "local learning source", path: "my-app01\\src\\App.js", usedFor: ["current router composition", "local state data", "live root inventory"], evidence: "2026-07-14 read-only audit: 49 lines, 2,011 bytes, SHA-256 9CFFFAE061E24C865A2320692E409C8330AAAE764EABD9D441904D20ED619E39. 화면 문자열과 asset 이름은 공개 fixture에 복사하지 않았습니다." },
  { id: "local-app-css", repository: "local learning source", path: "my-app01\\src\\App.css", usedFor: ["CRA styles", "prefers-reduced-motion", "visual-only gap"], evidence: "38 lines, 564 bytes, SHA-256 C5AC42E56BF8C34EB741D752BC879144F186D7CA0A48FCBB73B967177F7A9240." },
  { id: "local-index-css", repository: "local learning source", path: "my-app01\\src\\index.css", usedFor: ["global style baseline", "font/body audit"], evidence: "13 lines, 366 bytes, SHA-256 DAF22C296C801D3D533083361CC59FBDC22E5BFE528AA4BAD1973B54CC5448A4." },
  { id: "local-book", repository: "local learning source", path: "my-app01\\src\\pages\\step01-jsx\\Book.jsx", usedFor: ["Fragment", "props expressions", "heading repetition"], evidence: "25 lines, 731 bytes, SHA-256 1F7F3EF67F0D3D675E342C1AD1B50D6483107A578AB71AFC17D0FEA69FB0AD4A. 원본 문구를 복사하지 않았습니다." },
  { id: "local-library", repository: "local learning source", path: "my-app01\\src\\pages\\step01-jsx\\Library.jsx", usedFor: ["component composition", "props", "Fragment"], evidence: "19 lines, 618 bytes, SHA-256 F3951584896DCC8D54EEF59555947AEC43B5C21B1E9E807A2147C7D6D9B7104C. 원본 이름과 문구를 복사하지 않았습니다." },
  { id: "local-item", repository: "local learning source", path: "my-app01\\src\\pages\\step02-component\\Item.jsx", usedFor: ["destructured props", "list-like markup"], evidence: "17 lines, 398 bytes, SHA-256 3BD21516D49B40681E13192073DBB111D7889DA2DF8874B5F3E64CD348943C9A." },
  { id: "local-item-list", repository: "local learning source", path: "my-app01\\src\\pages\\step02-component\\ItemList.jsx", usedFor: ["static repeated components", "data/key inventory gap"], evidence: "12 lines, 421 bytes, SHA-256 DEA2F180913CC1077507DBD1D24C4D16FC3C6B5319A007EBFADB39C786727D49. 원본 강의 문구를 복사하지 않았습니다." },
  { id: "local-board", repository: "local learning source", path: "my-app01\\src\\pages\\step07-css\\Board.jsx", usedFor: ["native buttons", "CSS className", "grid semantics gap"], evidence: "25 lines, 850 bytes, SHA-256 64E870D5ACEE184056DBEEE02503215731A66BF03EA123370D5C2C17F55290B1." },
  { id: "local-board-css", repository: "local learning source", path: "my-app01\\src\\pages\\step07-css\\Board.css", usedFor: ["button sizing", "focus/contrast/reflow gap"], evidence: "13 lines, 212 bytes, SHA-256 D5758FE004D362E4237C5C6239F1E2C466AA00BFB67F8FEAD74748A9A8E9E675." },
  { id: "local-react-jsx-doc", repository: "local learning source", path: "REACT\\docs\\react\\02-jsx-components.md", usedFor: ["local JSX/component explanation", "map/key lesson", "execution guide"], evidence: "151 lines, 6,231 bytes, SHA-256 16210EF43D4FAB3E4189AE8090BA9452409FED56555D6DF72E0639EC2560D24C." },
  { id: "local-react-state-doc", repository: "local learning source", path: "REACT\\docs\\react\\03-state-list-events.md", usedFor: ["local state/list lesson", "functional update note", "list operations"], evidence: "284 lines, 11,652 bytes, SHA-256 90A2931C736201262E3C1970DE35AA45FC40EBD0406252FF04C33302DF8F2EDF. embedded data strings와 remote assets는 복사하지 않았습니다." },
  { id: "react-jsx", repository: "React Documentation", path: "learn/writing-markup-with-jsx", publicUrl: "https://react.dev/learn/writing-markup-with-jsx", usedFor: ["JSX rules", "single root", "className", "Fragment"], evidence: "current React 19.2 primary documentation을 확인했습니다." },
  { id: "react-lists", repository: "React Documentation", path: "learn/rendering-lists", publicUrl: "https://react.dev/learn/rendering-lists", usedFor: ["map/filter", "stable keys", "list identity"], evidence: "current React list/key guidance를 확인했습니다." },
  { id: "react-conditional", repository: "React Documentation", path: "learn/conditional-rendering", publicUrl: "https://react.dev/learn/conditional-rendering", usedFor: ["conditional JSX", "branching", "falsy caveat"], evidence: "current conditional rendering guidance를 확인했습니다." },
  { id: "react-props", repository: "React Documentation", path: "learn/passing-props-to-a-component", publicUrl: "https://react.dev/learn/passing-props-to-a-component", usedFor: ["props snapshot", "children", "composition"], evidence: "current props/children contract를 확인했습니다." },
  { id: "react-purity", repository: "React Documentation", path: "learn/keeping-components-pure", publicUrl: "https://react.dev/learn/keeping-components-pure", usedFor: ["render purity", "mutation", "Strict Mode reasoning"], evidence: "current component purity guidance를 확인했습니다." },
  { id: "react-fragment", repository: "React API", path: "reference/react/Fragment", publicUrl: "https://react.dev/reference/react/Fragment", usedFor: ["Fragment DOM behavior", "keyed Fragment"], evidence: "current Fragment API contract를 확인했습니다." },
  { id: "react-dom-common", repository: "React DOM API", path: "reference/react-dom/components/common", publicUrl: "https://react.dev/reference/react-dom/components/common", usedFor: ["common DOM props", "ARIA attributes", "event/state mapping"], evidence: "current React DOM common component props를 확인했습니다." },
  { id: "wcag-info-rel", repository: "W3C WAI WCAG 2.2", path: "Understanding/info-and-relationships", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html", usedFor: ["programmatic structure", "headings", "relationships"], evidence: "W3C WCAG 2.2 understanding document를 확인했습니다." },
  { id: "aria-names", repository: "W3C WAI ARIA APG", path: "practices/names-and-descriptions", publicUrl: "https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/", usedFor: ["accessible names", "descriptions", "visible labels"], evidence: "W3C APG naming practices를 확인했습니다." },
  { id: "html-sections", repository: "WHATWG HTML Standard", path: "multipage/sections.html", publicUrl: "https://html.spec.whatwg.org/multipage/sections.html", usedFor: ["sections", "headings", "landmarks semantics"], evidence: "living HTML section/heading semantics를 확인했습니다." },
  { id: "html-button", repository: "WHATWG HTML Standard", path: "multipage/form-elements.html#the-button-element", publicUrl: "https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element", usedFor: ["native button", "activation", "disabled/form behavior"], evidence: "living HTML button contract를 확인했습니다." },
  { id: "wcag-keyboard", repository: "W3C WAI WCAG 2.2", path: "Understanding/keyboard", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html", usedFor: ["keyboard operation", "critical journeys"], evidence: "WCAG 2.2 keyboard success criterion explanation을 확인했습니다." },
  { id: "wcag-name-role-value", repository: "W3C WAI WCAG 2.2", path: "Understanding/name-role-value", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html", usedFor: ["name role state/value", "custom controls"], evidence: "WCAG 2.2 name, role, value explanation을 확인했습니다." },
  { id: "wcag-focus-visible", repository: "W3C WAI WCAG 2.2", path: "Understanding/focus-visible", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html", usedFor: ["visible keyboard focus", "focus styling"], evidence: "WCAG 2.2 focus visible explanation을 확인했습니다." },
  { id: "wcag-contrast", repository: "W3C WAI WCAG 2.2", path: "Understanding/contrast-minimum", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html", usedFor: ["text contrast", "state matrix"], evidence: "WCAG 2.2 contrast minimum explanation을 확인했습니다." },
  { id: "wcag-reflow", repository: "W3C WAI WCAG 2.2", path: "Understanding/reflow", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html", usedFor: ["zoom", "narrow viewport", "content reflow"], evidence: "WCAG 2.2 reflow explanation을 확인했습니다." },
  { id: "wcag-non-text", repository: "W3C WAI WCAG 2.2", path: "Understanding/non-text-content", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html", usedFor: ["image alternatives", "decorative content"], evidence: "WCAG 2.2 non-text content explanation을 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "react-10-accessible-rendering-capstone", slug: "react-10-accessible-rendering-capstone", courseId: "react", moduleId: "react-rendering-components", order: 10,
  title: "접근 가능한 component rendering capstone",
  subtitle: "원본 App·JSX·목록·CSS를 semantic tree, stable identity, complete states와 keyboard/zoom evidence가 있는 capstone으로 통합합니다",
  level: "중급", estimatedMinutes: 120,
  coreQuestion: "component가 화면에 보인다는 수준을 넘어 JSX·props·conditions·lists·CSS가 모든 사용자에게 예측 가능한 name·role·state·order·focus를 제공한다고 어떻게 설계하고 증명할까요?",
  summary: "my-app01과 REACT local sources 11개를 read-only로 감사해 현재 router App, Fragment/props examples, static Item composition, native-button Board와 CSS/media-query 사실을 고정합니다. 원본은 학습에 유용하지만 live route 연결, data map/stable keys, landmark/heading/list semantics, accessible names/states, focus/contrast/reflow/motion, keyboard/assistive-technology 회귀 evidence가 없음을 분명히 합니다. JSX tree/purity, semantic landmarks, props/children API, complete loading-empty-error-success states, list reconciliation identity, native actions/names, CSS preferences, non-text content, localization/order, semantic testing, component architecture와 release governance를 하나의 capstone으로 연결합니다. 일곱 순수 Node examples는 provenance gap, outline, UI states, key identity, accessible name, CSS preference와 release scorecard를 synthetic data와 exact stdout으로 실행합니다.",
  objectives: ["원본 source 사실과 접근성 미검증 영역을 provenance로 분리한다.", "JSX/Fragment/render purity와 host semantic tree의 차이를 설명한다.", "landmark, heading, list와 accessible name 관계를 설계한다.", "loading·empty·error·success·stale state의 focus/announcement를 완성한다.", "stable key와 reconciliation identity로 list local state를 보존한다.", "native actions와 CSS focus/contrast/reflow/motion preference를 검증한다.", "role/name/state query와 keyboard/zoom/AT evidence matrix를 구축한다.", "sanitized view model, release gate, telemetry와 rollback까지 capstone을 운영한다."],
  prerequisites: [{ title: "CSS·assets·semantic styling", reason: "capstone은 앞 세션까지의 JSX, props, 조건, list identity와 CSS 결과를 semantic/accessibility contract로 통합합니다.", sessionSlug: "react-09-css-assets-semantic-styling" }],
  keywords: ["accessible rendering", "JSX", "Fragment", "semantic HTML", "landmark", "heading", "accessible name", "list key", "reconciliation", "focus-visible", "contrast", "reflow", "reduced motion", "keyboard", "WCAG", "ARIA", "capstone"],
  topics,
  lab: {
    title: "합성 학습 모듈 catalog를 접근 가능한 rendering capstone으로 qualification하기",
    scenario: "원본 lesson files를 직접 공개하지 않고 합성 module data로 page shell, filters, list/cards, detail state와 actions를 구현해 semantic·keyboard·zoom·preference·failure evidence를 완성합니다.",
    setup: ["Node 20+와 clean package install", "current React development/production build", "현대 browser 두 종류", "accessibility tree/keyboard/zoom tools", "대표 screen reader 조합", "reduced-motion/forced-colors settings", "synthetic non-PII fixtures", "network/asset failure stub", "실제 사용자 문자열·remote asset·credential 금지"],
    steps: ["11개 local source의 path/size/hash와 live/dead import status를 readback합니다.", "single capstone route와 skip link/header/nav/main/footer/heading outline을 만듭니다.", "domain rows를 allowlisted synthetic view model과 stable ID로 변환합니다.", "loading/empty/error/success/stale branches와 retry/reset actions를 완성합니다.", "ul/li 또는 적절한 native structure로 list를 렌더하고 reorder/filter에서 state/focus identity를 검증합니다.", "button/link, visible/icon-only labels와 status/selection attributes를 role/name/state query로 검증합니다.", "focus-visible, contrast, 320 CSS px, 200% zoom, long locale, RTL과 reduced-motion/forced-colors를 실행합니다.", "keyboard-only task와 representative screen reader의 landmark/heading/list/form journey를 기록합니다.", "blocked asset, slow request, malformed/empty data와 route transition focus를 fault test합니다.", "production preview에서 semantic scan, artifacts sanitization, cache/canary/rollback scorecard를 실행합니다."],
    expectedResult: ["원본 facts와 capstone improvements가 provenance로 분리됩니다.", "한 main과 구분된 landmarks/heading/list relationships가 accessibility tree에 나타납니다.", "모든 state에서 visible message, accessible name/state, action과 focus destination이 명확합니다.", "reorder/filter/delete에서도 stable ID가 local state와 focus를 보존합니다.", "keyboard, zoom, contrast, reduced motion와 screen reader critical task가 완료됩니다.", "fixture/log/screenshot에 실제 문자열·remote asset·secret이 없고 release/rollback evidence가 남습니다."],
    cleanup: ["synthetic fixtures, browser storage, screenshots와 local preview artifacts를 제거합니다.", "debug accessibility/React logs와 temporary feature flags를 원복합니다.", "AT/browser test profiles와 cache/service worker state를 초기화합니다.", "원본 두 repositories의 hash/status unchanged를 readback합니다."],
    extensions: ["React11에서 native event handler와 propagation/keyboard interaction을 확장합니다.", "React12에서 state snapshot, batching와 functional updater를 interaction state에 적용합니다.", "virtualized list와 composite grid를 별도 APG keyboard pattern lab으로 확장합니다.", "SSR/streaming hydration의 semantic parity와 route focus를 production topology에서 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 capstone browser DOM/accessibility tree와 대응시키세요.", requirements: ["stdout을 완전 일치시킵니다.", "provenance gap과 live route를 구분합니다.", "landmark/heading outline을 확인합니다.", "all UI states와 focus/announcement를 검증합니다.", "stable/index key의 state owner 차이를 재현합니다.", "control names와 CSS preferences를 확인합니다.", "release scorecard를 evidence에 연결합니다."], hints: ["Node model 통과를 browser/AT 통과로 표현하지 말고 별도 evidence column을 두세요."], expectedOutcome: "render tree에서 user-observable semantic contract까지 추적할 수 있습니다.", solutionOutline: ["audit→tree→states→identity→names/styles→journey→gate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 lesson concepts를 합성 module catalog capstone으로 재구성하세요.", requirements: ["실제 원본 문자열과 asset을 복사하지 않습니다.", "semantic shell/heading/list를 둡니다.", "stable keys와 complete states를 둡니다.", "native controls/names/states를 둡니다.", "focus/contrast/reflow/motion을 검증합니다.", "keyboard/AT/failure tests를 실행합니다.", "sanitized artifacts와 rollback을 남깁니다."], hints: ["component 이름보다 실제 host element의 name/role/state를 먼저 표로 작성하세요."], expectedOutcome: "처음 보는 사용자도 keyboard와 screen reader로 핵심 task를 완료하는 capstone이 완성됩니다.", solutionOutline: ["view model→semantic primitives→domain list/state→styles→qualification 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 accessible React rendering governance를 작성하세요.", requirements: ["semantic component API와 escape hatch 기준을 둡니다.", "keys/state/focus/announcement contract를 둡니다.", "CSS token/zoom/preference matrix를 둡니다.", "locale/non-text/privacy 정책을 둡니다.", "automated/manual AT evidence를 둡니다.", "blocker/exception/owner/expiry를 둡니다.", "canary/telemetry/incident/rollback을 둡니다."], hints: ["WCAG 항목 나열을 넘어 실제 component lifecycle과 release evidence에 연결하세요."], expectedOutcome: "접근성이 구현·리뷰·테스트·배포·복구 가능한 engineering standard가 됩니다.", solutionOutline: ["standardize→test→qualify→release→observe→recover 순서입니다."] },
  ],
  nextSessions: ["react-11-event-handler-propagation"], sources,
  sourceCoverage: { filesRead: 11, filesUsed: 11, uncoveredNotes: ["my-app01 9 files와 REACT 설명 2 files를 read-only로 읽고 path, line/byte counts와 SHA-256을 source evidence에 기록했습니다.", "현재 App은 router/data route를 렌더하지만 초기 Book/Library/Item/Board lessons는 live root에 직접 연결되지 않아 source 존재와 runtime exposure를 구분했습니다.", "원본은 Fragment/props/static composition/native buttons/className/CSS media query를 보여 주지만 stable-key data list, full landmarks/headings/names/states/focus/contrast/reflow/AT tests의 완료 evidence는 없습니다.", "원본의 사람·작품·강의 문자열과 asset file names/URLs는 public examples와 lab fixtures에 복사하지 않았습니다.", "browser accessibility tree, keyboard/zoom/contrast/motion와 assistive technology 결과는 target production build에서 별도 qualification해야 합니다."] },
});

export default session;
