import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-style-asset-audit", title: "Board·전역 CSS·public asset·Comment 원본을 styling channel별로 감사합니다",
    lead: "Board의 className/external stylesheet, App/index의 global rules, public HTML/manifest와 Comment의 inline style·external image를 읽어 markup, CSS, asset resolution과 accessibility 책임을 분리합니다.",
    mechanism: "Board.jsx와 Board.css는 semantic tree와 class selector를 나누고 App.css/index.css는 application 전역에 cascade됩니다. public template/manifest는 root asset references를 제공하며 Comment는 JavaScript style objects와 외부 image source·비어 있는 alt를 사용합니다.",
    workflow: "각 파일의 selector scope, DOM semantics, asset origin, build transform 여부, accessible name/alt, cache lifecycle과 failure fallback을 표로 만들고 원본 관찰과 production 보강을 구분합니다.",
    invariants: "일곱 원본은 read-only이고 실제 외부 image URL·인명·메시지·branding 값을 복제하지 않으며 외부 자원이 안전·영속·접근 가능하다고 가정하지 않습니다.",
    edgeCases: "CSS 미로드, hashed asset 누락, base path 배포, offline cache, high zoom, forced colors, reduced motion, broken image, empty alt, external tracking과 CSP 차단을 포함합니다.",
    failureModes: "visual 결과만 보면 global selector 충돌, div-button keyboard 결함, 빈 alt의 의미 손실, public path 404와 외부 image privacy leak를 놓칩니다.",
    verification: "hash·lines·bytes, selector/asset inventory, CSS-off semantic review, keyboard/accessibility tree, production build URL graph, CSP report-only와 cache readback을 층별로 실행합니다.",
    operations: "asset 404, stylesheet failure, layout shift, contrast/focus regression과 CSP violation을 stable reason code로 관찰하고 DOM text·external URL query와 사용자 data는 telemetry에서 제거합니다.",
    concepts: [
      c("styling channel", "external/global CSS, scoped class, inline style와 asset 같은 표현 경로와 그 cascade·build·security 책임입니다.", ["한 방식이 항상 우월하지 않습니다.", "사용 목적을 문서화합니다."]),
      c("asset provenance", "이미지·font·manifest가 어느 source/build artifact/cache policy에서 왔는지 추적하는 정보입니다.", ["external origin을 별도 관리합니다.", "hash와 license를 확인합니다."]),
      c("semantic-first styling", "CSS가 없거나 바뀌어도 문서 구조와 control 의미가 native HTML로 남도록 먼저 markup을 설계하는 원칙입니다.", ["시각 모양과 role을 구분합니다.", "keyboard contract를 보존합니다."]),
    ],
    codeExamples: [node("react09-source-audit", "원본 styling·asset channel inventory", "React09SourceAudit.mjs", "실제 domain 값 없이 원본에서 관찰한 styling channels와 교정 위험을 exact output으로 분류합니다.", String.raw`const channels = [
  { name: "board", mode: "class-plus-css", risk: "repeated-control-semantics" },
  { name: "global", mode: "app-and-index-css", risk: "cascade-scope" },
  { name: "public", mode: "template-manifest", risk: "base-and-cache" },
  { name: "comment", mode: "inline-plus-external-image", risk: "alt-origin-privacy" },
];
for (const item of channels) console.log(item.name + "=" + item.mode + ":" + item.risk);`, "board=class-plus-css:repeated-control-semantics\nglobal=app-and-index-css:cascade-scope\npublic=template-manifest:base-and-cache\ncomment=inline-plus-external-image:alt-origin-privacy", ["local-board-jsx", "local-board-css", "local-app-css", "local-index-css", "local-public-index", "local-public-manifest", "local-comment-style"])]
  }),
  appliedTopic({
    id: "semantic-component-dom", title: "component 이름보다 실제 host DOM의 의미와 interaction을 먼저 설계합니다",
    lead: "Square, Card, Comment 같은 component 이름이 browser accessibility tree를 만들지는 않으므로 최종 button, heading, list, article와 image semantics를 user action과 content structure에 맞춥니다.",
    mechanism: "React component는 결국 host elements와 attributes로 렌더링됩니다. native button은 keyboard activation, focus와 disabled semantics를 제공하지만 styled div는 같은 모양이어도 그 contract가 없습니다.",
    workflow: "content outline과 user actions를 작성하고 native host element를 선택한 뒤 component props를 semantic variants로 제한하며 CSS class는 그 contract를 시각화합니다.",
    invariants: "클릭 가능한 것은 가능한 한 button/link를 사용하고 heading level·list structure·label association을 유지하며 ARIA로 잘못된 native semantics를 덮어쓰지 않습니다.",
    edgeCases: "button 안 interactive descendant, nested links, disabled vs aria-disabled, icon-only control, loading label, heading reuse context와 polymorphic as prop을 다룹니다.",
    failureModes: "div에 onClick과 cursor만 주면 Enter/Space activation·focus·role/name이 없고 component 이름이 Button이어도 실제 DOM이 div면 접근성은 개선되지 않습니다.",
    verification: "CSS-off DOM outline, keyboard-only activation, accessibility role/name/state, disabled behavior와 invalid nested-interactive HTML을 검사합니다.",
    operations: "design-system component는 rendered host contract를 versioned API로 관리하고 semantic breaking change를 visual minor update처럼 배포하지 않습니다.",
    concepts: [
      c("host element", "React component가 최종적으로 생성하는 HTML element type입니다.", ["component 이름과 구분합니다.", "browser semantics를 결정합니다."]),
      c("accessible name", "assistive technology가 control이나 image의 목적을 식별하는 계산된 이름입니다.", ["보이는 text·label·alt 등이 기여합니다.", "placeholder만 의존하지 않습니다."]),
      c("semantic variant", "component의 역할과 상태를 유한한 props로 표현해 허용 DOM·style 조합을 제한하는 API입니다.", ["임의 class string보다 검토하기 쉽습니다.", "native semantics를 우선합니다."]),
    ],
    codeExamples: [node("react09-semantic-audit", "interactive element semantic contract 검사", "React09SemanticAudit.mjs", "synthetic component metadata에서 clickable div, unnamed button과 올바른 button을 stable codes로 분류합니다.", String.raw`function audit(node) {
  if (node.onClick && !["button", "a"].includes(node.tag)) return "non-native-interactive";
  if (["button", "a"].includes(node.tag) && !node.name) return "accessible-name-required";
  return "ok";
}
const nodes = [
  { tag: "div", onClick: true, name: "Open" },
  { tag: "button", onClick: true, name: "" },
  { tag: "button", onClick: true, name: "Open details" },
];
for (const node of nodes) console.log(node.tag + "=" + audit(node));`, "div=non-native-interactive\nbutton=accessible-name-required\nbutton=ok", ["local-board-jsx", "react-dom-common", "wcag22"])]
  }),
  appliedTopic({
    id: "class-style-contract", title: "className·style·data/ARIA state를 제한된 component styling API로 만듭니다",
    lead: "className 문자열 연결과 inline style object를 편의상 섞지 않고 reusable visual variants, truly dynamic numeric values와 semantic state attributes의 책임을 나눕니다.",
    mechanism: "React DOM에서 className은 CSS class attribute를, style은 camelCase JavaScript object properties를 설정합니다. boolean/enum state는 class 또는 data-*와 native/ARIA state에 연결할 수 있지만 CSS가 state semantics를 대신하지 않습니다.",
    workflow: "base class와 allowlisted size/tone/state variant를 deterministic하게 조합하고 layout 좌표·progress 같은 계산값만 style/custom property로 전달하며 consumer class override 정책을 정합니다.",
    invariants: "untrusted string을 raw style text, selector나 URL에 삽입하지 않고 internal state와 public class namespaces를 구분하며 aria-disabled 같은 semantics와 visual disabled가 함께 변합니다.",
    edgeCases: "undefined/false class token, zero numeric style, unitless property, CSS custom property typing, consumer class collision, RTL logical property와 server/client class mismatch를 다룹니다.",
    failureModes: "user input을 className에 그대로 연결하면 hidden admin-like class나 layout escape가 적용될 수 있고 arbitrary style object forwarding은 unsafe URL·overlay와 UI spoofing 범위를 넓힙니다.",
    verification: "variant truth table, forbidden token, DOM attribute snapshot, computed style, RTL/zoom와 malicious input fixture를 검사합니다.",
    operations: "class contract 변경에는 consumer inventory와 compatibility aliases를 두고 visual telemetry는 class 문자열 전체가 아니라 finite variant code로 기록합니다.",
    concepts: [
      c("className contract", "component가 허용하는 base·variant·state class의 조합 규칙입니다.", ["allowlist를 사용합니다.", "CSS module/build naming과 분리합니다."]),
      c("inline style object", "element의 style attribute를 JavaScript property/value object로 설정하는 React prop입니다.", ["동적 계산값에 유용합니다.", "pseudo/media rules를 대체하지 않습니다."]),
      c("state attribute", "disabled, aria-selected, data-state처럼 DOM에 component 상태를 명시하는 attribute입니다.", ["semantic attribute와 styling hook을 구분합니다.", "finite values를 씁니다."]),
    ],
    codeExamples: [node("react09-class-tokens", "allowlisted class token 조합", "React09ClassTokens.mjs", "untrusted variant를 raw class로 전달하지 않고 stable fallback과 state tokens를 생성합니다.", String.raw`const tones = new Set(["neutral", "accent", "danger"]);
const sizes = new Set(["sm", "md", "lg"]);
function classes(input) {
  const tone = tones.has(input.tone) ? input.tone : "neutral";
  const size = sizes.has(input.size) ? input.size : "md";
  return ["action", "action--" + tone, "action--" + size, input.disabled && "is-disabled"].filter(Boolean).join(" ");
}
console.log(classes({ tone: "accent", size: "sm", disabled: false }));
console.log(classes({ tone: "untrusted token", size: "huge", disabled: true }));`, "action action--accent action--sm\naction action--neutral action--md is-disabled", ["local-board-css", "local-comment-style", "react-dom-common", "selectors4"])]
  }),
  appliedTopic({
    id: "cascade-specificity-scope", title: "cascade origin·layer·specificity·source order와 scope를 계산합니다",
    lead: "CSS가 가끔 덮어써진다는 감각 대신 origin/importance, layer order, specificity, scoping proximity와 source order의 비교 순서로 winner를 설명하고 global leakage를 제어합니다.",
    mechanism: "selector matching 뒤 cascade가 declaration precedence를 결정합니다. inline style, !important, unlayered/layered rules와 selector specificity는 서로 다른 축이며 긴 selector를 추가하는 것은 근본 해결이 아닙니다.",
    workflow: "reset/base/components/utilities/overrides layer policy를 정하고 selector 목적과 scope를 문서화하며 component class를 낮은 specificity로 유지하고 DevTools matched-rule evidence를 기록합니다.",
    invariants: "!important escalation과 id/deep descendant selector를 기본 해법으로 쓰지 않고 source order를 build chunk 우연에 맡기지 않으며 global element rules의 영향 범위를 audit합니다.",
    edgeCases: ":where() zero specificity, :is()/:not() argument specificity, attribute state, inline style, !important origin reversal, shadow DOM, CSS Modules와 lazy-loaded chunk order를 다룹니다.",
    failureModes: "App.css와 index.css의 broad selector가 feature CSS를 덮거나 fix마다 specificity를 높이면 override가 불가능해지고 route별 CSS load order에서 결과가 달라집니다.",
    verification: "representative selector specificity table, computed style provenance, route/chunk matrix, CSS order snapshot과 forbidden !important/deep-selector lint를 실행합니다.",
    operations: "cascade contract 변경은 visual diff, selector count/specificity budget과 old/new CSS artifact canary로 배포하며 emergency override는 owner와 expiry를 둡니다.",
    concepts: [
      c("cascade", "같은 element/property에 적용 가능한 declarations 중 우선순위를 정하는 CSS 알고리즘입니다.", ["specificity 하나만 보지 않습니다.", "origin/layer/order를 포함합니다."]),
      c("specificity", "selector의 id, class/attribute/pseudo-class, type/pseudo-element 성분으로 비교되는 우선순위 가중치입니다.", ["DOM depth와 동일하지 않습니다.", ":where()는 zero입니다."]),
      c("cascade layer", "author rules의 precedence order를 명시하는 @layer grouping입니다.", ["layer 내부 cascade도 존재합니다.", "architecture 순서를 고정합니다."]),
    ],
    codeExamples: [node("react09-cascade", "layer·specificity·source order winner model", "React09Cascade.mjs", "교육용 declaration tuples를 CSS precedence 핵심 축 순서로 정렬해 winner를 exact output으로 고정합니다.", String.raw`const declarations = [
  { value: "base", layer: 1, specificity: [0, 1, 0], order: 1 },
  { value: "component", layer: 2, specificity: [0, 1, 0], order: 2 },
  { value: "component-later", layer: 2, specificity: [0, 1, 0], order: 3 },
];
function compare(left, right) {
  return left.layer - right.layer || left.specificity[0] - right.specificity[0] || left.specificity[1] - right.specificity[1] || left.specificity[2] - right.specificity[2] || left.order - right.order;
}
const winner = declarations.toSorted(compare).at(-1);
console.log("winner=" + winner.value);
console.log("layer=" + winner.layer);
console.log("specificity=" + winner.specificity.join("-"));`, "winner=component-later\nlayer=2\nspecificity=0-1-0", ["local-board-css", "local-app-css", "local-index-css", "css-cascade6", "selectors4"])]
  }),
  appliedTopic({
    id: "tokens-theme-contrast", title: "design token·theme와 contrast를 의미 기반 contract로 운영합니다",
    lead: "색상 hex와 spacing 숫자를 component마다 복사하지 않고 semantic token을 사용하되 token 이름, fallback, theme override와 WCAG contrast가 실제 모든 state에서 유효한지 검증합니다.",
    mechanism: "CSS custom properties는 cascade를 통해 token 값을 전달하고 component는 --color-text, --surface-danger 같은 의미 token을 사용합니다. contrast는 foreground/background의 computed colors와 text 크기·state에 따라 평가합니다.",
    workflow: "primitive palette에서 semantic aliases와 component tokens를 분리하고 light/dark/high-contrast themes를 정의한 뒤 default, hover, focus, disabled, selected와 error combinations의 contrast를 계산합니다.",
    invariants: "색상만으로 상태를 전달하지 않고 text/icon/shape를 함께 제공하며 focus indicator와 text contrast를 token release gate로 두고 custom property cycle/missing fallback을 차단합니다.",
    edgeCases: "transparent overlay, opacity disabled text, gradient/image background, forced-colors, user color scheme, OLED dark mode, visited links와 chart categorical colors를 포함합니다.",
    failureModes: "primitive blue-500을 meaning으로 사용하면 palette 변경 시 의미가 깨지고 disabled opacity가 text contrast를 낮추며 dark theme 일부 nested scope에서 token이 누락됩니다.",
    verification: "computed color pair별 contrast, color-blind/forced-colors/manual review, token reference graph, missing/cycle detection과 visual snapshots를 실행합니다.",
    operations: "token changes는 impacted component inventory, versioned design artifact, screenshot/contrast diff, canary와 alias deprecation period로 배포합니다.",
    concepts: [
      c("semantic token", "구체 색 값이 아니라 text, surface, border, danger 같은 UI 의미에 이름을 붙인 design value입니다.", ["theme별 값이 달라질 수 있습니다.", "component와 palette를 분리합니다."]),
      c("contrast ratio", "상대 휘도에 기반해 foreground와 background의 명도 차이를 나타내는 비율입니다.", ["computed state마다 검사합니다.", "크기와 용도 기준을 적용합니다."]),
      c("forced colors", "사용자/OS가 제한된 색 palette로 author colors를 대체하는 접근성 모드입니다.", ["semantic structure와 system colors가 중요합니다.", "실제 모드에서 검증합니다."]),
    ],
    codeExamples: [node("react09-contrast", "sRGB 색상 contrast ratio 계산", "React09Contrast.mjs", "고정 hex pairs의 WCAG relative luminance와 ratio를 계산해 경계 아래 조합을 표시합니다.", String.raw`function luminance(hex) {
  const values = hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16) / 255);
  const linear = values.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function ratio(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
for (const pair of [["#000000", "#ffffff"], ["#777777", "#ffffff"]]) {
  const value = ratio(...pair);
  console.log(pair.join("/") + "=" + value.toFixed(2) + ":" + (value >= 4.5 ? "pass" : "fail"));
}`, "#000000/#ffffff=21.00:pass\n#777777/#ffffff=4.48:fail", ["wcag22", "css-cascade6", "local-app-css"])]
  }),
  appliedTopic({
    id: "responsive-motion-state", title: "responsive layout·visual order·focus state와 reduced motion을 함께 설계합니다",
    lead: "고정 pixel square와 centered viewport 같은 학습 CSS를 다양한 container, zoom, writing mode와 motion preference에서도 content와 interaction이 유지되는 layout contract로 확장합니다.",
    mechanism: "flex/grid는 available space에 따라 layout을 계산하고 media queries는 viewport·user preference 조건을 적용합니다. CSS order나 transform은 visual 위치를 바꿔도 DOM reading/focus order를 자동 바꾸지 않습니다.",
    workflow: "content-driven min/max sizes와 logical properties를 사용하고 narrow→wide progressive enhancement, visible focus, hover-independent states와 prefers-reduced-motion alternative를 설계합니다.",
    invariants: "320 CSS px equivalent reflow와 200%/400% zoom에서 two-dimensional scroll을 최소화하고 DOM order와 task order를 일치시키며 motion 제거 후에도 상태 변화가 이해됩니다.",
    edgeCases: "long translated text, large font, RTL/vertical writing, coarse pointer, no hover, reduced motion, forced colors, virtual keyboard와 safe-area inset을 포함합니다.",
    failureModes: "fixed width/height는 text를 잘라내고 CSS order로만 card 순서를 바꾸면 screen reader/keyboard 순서와 visual order가 갈라지며 focus outline 제거는 current position을 숨깁니다.",
    verification: "viewport/container matrix, zoom/reflow, keyboard focus order, RTL, pointer/hover query, reduced-motion and forced-colors screenshots와 layout-shift trace를 실행합니다.",
    operations: "responsive breakpoint는 device 이름보다 content failure point로 관리하고 CLS, overflow, focus visibility와 animation duration budget을 canary 관찰합니다.",
    concepts: [
      c("content breakpoint", "특정 device 이름이 아니라 content가 더 이상 읽기·조작 가능하지 않은 지점에서 정한 layout 전환 조건입니다.", ["component/container 범위를 고려합니다.", "실제 content로 검증합니다."]),
      c("visual versus DOM order", "CSS가 보여 주는 순서와 document source/focus/reading 순서의 차이입니다.", ["task 순서를 DOM에 둡니다.", "order 남용을 피합니다."]),
      c("reduced-motion alternative", "사용자 motion preference에서 불필요한 이동·회전을 줄이되 상태와 완료 feedback은 보존하는 표현입니다.", ["모든 animation을 무조건 제거하는 것과 다릅니다.", "vestibular trigger를 줄입니다."]),
    ],
    codeExamples: [node("react09-motion", "motion preference별 style contract", "React09Motion.mjs", "동일 상태 전환에서 reduced mode가 movement를 제거하고 semantic status를 보존하는 model을 실행합니다.", String.raw`function transition(preference) {
  return preference === "reduce"
    ? { durationMs: 0, transform: "none", status: "complete" }
    : { durationMs: 180, transform: "translate", status: "complete" };
}
for (const preference of ["no-preference", "reduce"]) {
  const value = transition(preference);
  console.log(preference + "=" + value.durationMs + ":" + value.transform + ":" + value.status);
}`, "no-preference=180:translate:complete\nreduce=0:none:complete", ["local-board-css", "local-app-css", "mediaqueries5", "wcag22"])]
  }),
  appliedTopic({
    id: "asset-import-public-base", title: "bundler import와 public root asset의 build·base·cache 수명을 구분합니다",
    lead: "파일이 프로젝트 폴더에 있다는 사실만으로 배포 URL이 정해진다고 보지 않고 module graph import, public directory copy, HTML template reference와 deployment base path의 계약을 확인합니다.",
    mechanism: "module-imported asset은 bundler가 dependency graph에 넣어 fingerprint URL로 바꿀 수 있고 public asset은 보통 이름을 유지한 채 copy됩니다. template placeholder와 root-relative path 해석은 toolchain/base configuration에 의존합니다.",
    workflow: "asset을 component-owned hashed import, stable public well-known file, generated manifest/icon 또는 external approved resource로 분류하고 production build manifest에서 emitted URL과 owning source를 readback합니다.",
    invariants: "source code의 개발 경로를 runtime URL로 추정하지 않고 base path·case sensitivity·filename encoding을 검증하며 immutable cache는 content-hashed asset에만 적용합니다.",
    edgeCases: "subpath hosting, trailing slash, Windows/Linux case difference, old HTML with new chunks, CDN propagation, service worker stale manifest, missing icon sizes와 rollback artifact를 다룹니다.",
    failureModes: "root /icon.png는 subpath 배포에서 404가 되고 mutable public filename에 1년 immutable cache를 주면 새 배포 뒤 old bytes가 남으며 build가 제거한 unused asset을 참조할 수 있습니다.",
    verification: "production build asset graph, base-path server, case-sensitive container, offline/old HTML-new assets matrix, 404 fallback와 manifest icon fetch를 실행합니다.",
    operations: "hashed artifacts를 이전 HTML compatibility window 동안 유지하고 manifest/HTML은 재검증 가능 cache policy를 사용하며 deploy 후 representative URLs와 MIME을 readback합니다.",
    concepts: [
      c("module asset", "JavaScript/CSS module graph에서 import되어 build tool이 hash·optimization·URL rewrite를 적용할 수 있는 파일입니다.", ["toolchain contract를 확인합니다.", "dead asset 제거가 가능합니다."]),
      c("public asset", "module import 없이 배포 root/base 아래 고정 이름으로 복사·참조되는 파일입니다.", ["stable name이 필요할 때 씁니다.", "cache invalidation을 직접 관리합니다."]),
      c("deployment base", "application이 host root가 아닌 subpath에 있을 때 asset/link URL을 해석하는 prefix contract입니다.", ["build와 router/HTML이 일치해야 합니다.", "root-relative path를 검사합니다."]),
    ],
    codeExamples: [node("react09-asset-policy", "asset 종류별 emitted URL·cache policy", "React09AssetPolicy.mjs", "synthetic asset registry로 module/public/external categories와 base-safe 결과를 분류합니다.", String.raw`function resolve(asset, base) {
  if (asset.kind === "module") return { url: base + "assets/" + asset.name + ".a1b2." + asset.ext, cache: "immutable" };
  if (asset.kind === "public") return { url: base + asset.name + "." + asset.ext, cache: "revalidate" };
  return { url: null, cache: "blocked" };
}
const assets = [
  { kind: "module", name: "hero", ext: "svg" },
  { kind: "public", name: "manifest", ext: "json" },
  { kind: "external", name: "avatar", ext: "png" },
];
for (const asset of assets) {
  const value = resolve(asset, "/study/");
  console.log(asset.kind + "=" + (value.url ?? "none") + ":" + value.cache);
}`, "module=/study/assets/hero.a1b2.svg:immutable\npublic=/study/manifest.json:revalidate\nexternal=none:blocked", ["local-public-index", "local-public-manifest", "appmanifest", "rfc9111"])]
  }),
  appliedTopic({
    id: "image-semantics-performance", title: "image의 purpose·alt·dimensions·responsive loading과 failure fallback을 설계합니다",
    lead: "img src가 보인다는 것에서 끝내지 않고 informative, decorative, functional, complex image 목적을 먼저 분류해 alt/name과 surrounding text를 정하고 intrinsic dimensions·responsive candidates를 제공합니다.",
    mechanism: "alt는 image가 로드되지 않거나 non-visual navigation일 때 대체 목적을 전달합니다. width/height 또는 aspect-ratio는 layout 공간을 예약하고 srcset/sizes는 환경에 맞는 candidate 선택을 돕습니다.",
    workflow: "content owner가 purpose와 text alternative를 작성하고 local/approved origin, dimensions, format, responsive variants, loading priority와 error fallback을 asset metadata로 관리합니다.",
    invariants: "정보 image에 빈 alt를 쓰지 않고 decorative image는 정말 중복 정보일 때 alt empty를 명시하며 functional image의 alt는 동작 목적을 설명하고 external source를 user input 그대로 허용하지 않습니다.",
    edgeCases: "broken/blocked source, slow network, high DPR, zoom, SVG script/external refs, animated image, complex chart, localization, user-generated image와 fallback loop를 포함합니다.",
    failureModes: "모든 image alt를 filename으로 채우면 의미가 없고 informative avatar에 empty alt를 쓰면 정체성이 사라지며 dimensions가 없으면 load 시 layout shift가 생깁니다.",
    verification: "images-off/CSS-off, screen reader/name audit, broken source, allowed origin/type/size, width-height ratio, responsive candidate network와 CLS/LCP trace를 실행합니다.",
    operations: "asset failure, bytes, decode time, LCP/CLS와 fallback use를 URL 전체가 아닌 asset class/id로 관찰하고 external provider outage에는 local neutral fallback을 둡니다.",
    concepts: [
      c("text alternative", "image가 전달하는 목적·정보를 text로 동등하게 제공하는 content입니다.", ["주변 text와 중복을 피합니다.", "purpose에 따라 empty일 수 있습니다."]),
      c("intrinsic dimensions", "image의 width/height 비율을 layout 전에 알려 공간을 예약하는 metadata입니다.", ["responsive CSS와 함께 씁니다.", "layout shift를 줄입니다."]),
      c("responsive image candidate", "viewport, rendered size와 pixel density에 따라 browser가 선택할 수 있는 srcset 후보입니다.", ["sizes를 정확히 제공합니다.", "실제 bytes를 측정합니다."]),
    ],
    codeExamples: [node("react09-image-policy", "image purpose와 alt/dimension validation", "React09ImagePolicy.mjs", "외부 URL 없이 image metadata의 alt·dimension contract를 stable codes로 검사합니다.", String.raw`function validate(image) {
  if (!Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) return "dimensions-required";
  if (image.purpose === "informative" && image.alt.trim() === "") return "alt-required";
  if (image.purpose === "decorative" && image.alt !== "") return "decorative-alt-empty";
  return "ok";
}
const images = [
  { purpose: "informative", alt: "", width: 64, height: 64 },
  { purpose: "decorative", alt: "pattern", width: 32, height: 32 },
  { purpose: "informative", alt: "Profile placeholder", width: 64, height: 64 },
];
for (const image of images) console.log(image.purpose + "=" + validate(image));`, "informative=alt-required\ndecorative=decorative-alt-empty\ninformative=ok", ["local-comment-style", "whatwg-img", "wai-images", "wcag22"])]
  }),
  appliedTopic({
    id: "style-asset-security-cache", title: "CSP·origin allowlist·cache integrity와 UI spoofing 경계를 방어합니다",
    lead: "React escaping이 CSS URL, external image, font, manifest와 arbitrary style prop의 모든 위험을 해결한다고 오해하지 않고 각 fetch/sink context에 allowlist, CSP와 artifact policy를 둡니다.",
    mechanism: "CSP fetch directives는 허용 resource origins/schemes를 제한하는 defense-in-depth이고 HTTP cache는 response freshness/reuse를 제어합니다. component key/class나 hidden CSS는 authorization 또는 integrity control이 아닙니다.",
    workflow: "asset ingress에서 type·size·origin·license를 검증하고 self-hosted hashed artifacts를 우선하며 CSP report-only→enforce, cache headers, deployment manifest와 rollback artifact retention을 운영합니다.",
    invariants: "actual credentials/token/user identifiers를 CSS URL·query·class·telemetry에 넣지 않고 user-controlled style overlay로 trusted UI를 가리지 못하게 하며 server action authorization을 별도 검사합니다.",
    edgeCases: "data/blob URLs, SVG active content, redirect to disallowed origin, font fingerprinting, stale CSP/report endpoint, cache poisoning, service worker와 third-party outage를 다룹니다.",
    failureModes: "img-src *는 외부 tracking을 허용하고 raw background-image URL은 request로 secret을 누출할 수 있으며 CSP만 믿고 unsafe content model을 유지하면 browser/version 차이에서 우회됩니다.",
    verification: "malicious asset metadata, redirect/MIME/size, CSP report-only, blocked fallback, cache validator/immutable naming, old HTML-new asset/rollback와 server authorization negative tests를 실행합니다.",
    operations: "CSP violation은 directive·blocked category·release version의 낮은 cardinality로 수집하고 full URI/query는 redaction하며 emergency origin allow는 owner·expiry·rollback을 둡니다.",
    concepts: [
      c("Content Security Policy", "browser가 script/style/image/font 등 resource와 실행 source를 제한하도록 server가 전달하는 보안 정책입니다.", ["defense-in-depth입니다.", "semantic validation/authorization을 대체하지 않습니다."]),
      c("asset allowlist", "허용 origin, MIME, extension, size와 transformation을 명시한 ingress/render 정책입니다.", ["redirect 최종 origin도 검사합니다.", "user URL을 그대로 신뢰하지 않습니다."]),
      c("cache compatibility window", "old HTML/runtime이 참조할 수 있는 이전 hashed artifacts를 안전하게 유지하는 배포 기간입니다.", ["404를 줄입니다.", "rollback과 연결합니다."]),
    ],
    codeExamples: [node("react09-security-cache", "asset source·fingerprint cache 분류", "React09SecurityCache.mjs", "synthetic source categories와 filename fingerprint를 검사해 allow/block 및 cache mode를 결정합니다.", String.raw`function policy(asset) {
  if (!asset.local) return { allowed: false, cache: "none", code: "external-blocked" };
  if (!/\.[0-9a-f]{8}\./.test(asset.filename)) return { allowed: true, cache: "revalidate", code: "mutable-name" };
  return { allowed: true, cache: "immutable", code: "fingerprinted" };
}
for (const asset of [
  { local: true, filename: "app.12ab34cd.css" },
  { local: true, filename: "manifest.json" },
  { local: false, filename: "avatar.png" },
]) console.log(JSON.stringify(policy(asset)));`, "{\"allowed\":true,\"cache\":\"immutable\",\"code\":\"fingerprinted\"}\n{\"allowed\":true,\"cache\":\"revalidate\",\"code\":\"mutable-name\"}\n{\"allowed\":false,\"cache\":\"none\",\"code\":\"external-blocked\"}", ["csp3", "rfc9111", "local-public-index", "local-public-manifest"])]
  }),
  appliedTopic({
    id: "visual-test-recovery-operations", title: "semantic·computed·visual·network 검증과 CSS/asset rollback을 자동화합니다",
    lead: "screenshot 한 장이나 lint 통과를 완료 증거로 삼지 않고 DOM semantics, computed styles, interaction states, responsive screenshots, asset requests와 cache/CSP 결과를 별도 release gates로 둡니다.",
    mechanism: "unit token tests는 pure policy를, component DOM tests는 role/name/state를, browser tests는 cascade/layout/focus를, production build tests는 emitted assets와 headers를 증명합니다.",
    workflow: "baseline token/DOM/visual/performance budgets를 고정하고 component states×themes×viewports matrix, production artifact scan, canary readback, rollback and cache purge rehearsal를 실행합니다.",
    invariants: "visual diff 승인만으로 semantic regression을 통과시키지 않고 screenshot에는 deterministic fonts/data/motion을 사용하며 build hash와 tested artifact를 동일하게 배포합니다.",
    edgeCases: "font fallback, subpixel/OS rendering, animation nondeterminism, delayed image, old cache, route lazy CSS, CSP enforce, offline, RTL와 locale expansion을 포함합니다.",
    failureModes: "pixel diff threshold를 크게 두면 focus/contrast 결함을 놓치고 generated asset index 없이 deploy하면 HTML과 chunks가 불일치하며 rollback 후 cache가 새 CSS를 계속 제공합니다.",
    verification: "Node exact examples, ESLint/TypeScript/content schema, role/name assertions, computed style, axe+manual keyboard, visual matrix, Lighthouse-like metrics, URL/headers/CSP와 rollback readback을 실행합니다.",
    operations: "release dashboard에 asset 404, CSS load, CSP, CLS/LCP, contrast/focus failures와 version을 연결하고 threshold 초과 시 traffic stop, artifact rollback과 bounded cache invalidation을 수행합니다.",
    concepts: [
      c("computed-style evidence", "cascade와 layout 조건을 적용한 뒤 browser가 element property에 계산한 값을 source rule과 연결한 증거입니다.", ["inline/source CSS text와 다릅니다.", "실제 browser가 필요합니다."]),
      c("visual regression matrix", "component state, theme, viewport, locale와 preference 조합에서 screenshot 차이를 비교하는 test 집합입니다.", ["semantic tests와 병행합니다.", "deterministic fixture가 필요합니다."]),
      c("artifact rollback", "검증된 이전 HTML/CSS/assets와 compatible cache policy로 traffic을 되돌리는 절차입니다.", ["DB rollback과 별개입니다.", "old asset retention이 필요합니다."]),
    ],
    codeExamples: [node("react09-release-gate", "semantic·visual·asset release gate", "React09ReleaseGate.mjs", "독립 evidence가 모두 통과해야 release 가능한 fail-closed gate를 실행합니다.", String.raw`function gate(evidence) {
  const required = ["semantic", "keyboard", "contrast", "visual", "assets", "csp", "rollback"];
  const failed = required.filter((name) => evidence[name] !== true);
  return failed.length ? { release: false, failed } : { release: true, failed: [] };
}
console.log(JSON.stringify(gate({ semantic: true, keyboard: true, contrast: true, visual: true, assets: true, csp: true, rollback: true })));
console.log(JSON.stringify(gate({ semantic: true, keyboard: false, contrast: true, visual: true, assets: false, csp: true, rollback: true })));`, "{\"release\":true,\"failed\":[]}\n{\"release\":false,\"failed\":[\"keyboard\",\"assets\"]}", ["wcag22", "mediaqueries5", "csp3", "rfc9111", "appmanifest"])]
  }),
];

const sources: SessionSource[] = [
  { id: "local-board-jsx", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step07-css/Board.jsx", usedFor: ["className component structure", "repeated square markup provenance"], evidence: "Read-only structural audit: 25 lines, 850 bytes, SHA-256 64E870D5ACEE184056DBEEE02503215731A66BF03EA123370D5C2C17F55290B1." },
  { id: "local-board-css", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step07-css/Board.css", usedFor: ["external component CSS", "flex and fixed square style provenance"], evidence: "Read-only structural audit: 13 lines, 212 bytes, SHA-256 D5758FE004D362E4237C5C6239F1E2C466AA00BFB67F8FEAD74748A9A8E9E675." },
  { id: "local-app-css", repository: "local my-app01 learning snapshot", path: "my-app01/src/App.css", usedFor: ["application-global class rules", "animation and reduced-motion provenance"], evidence: "Read-only structural audit: 38 lines, 564 bytes, SHA-256 C5AC42E56BF8C34EB741D752BC879144F186D7CA0A48FCBB73B967177F7A9240." },
  { id: "local-index-css", repository: "local my-app01 learning snapshot", path: "my-app01/src/index.css", usedFor: ["global body/code typography", "root cascade provenance"], evidence: "Read-only structural audit: 13 lines, 366 bytes, SHA-256 DAF22C296C801D3D533083361CC59FBDC22E5BFE528AA4BAD1973B54CC5448A4." },
  { id: "local-public-index", repository: "local my-app01 learning snapshot", path: "my-app01/public/index.html", usedFor: ["public URL placeholder", "icon/manifest/noscript structure provenance"], evidence: "Read-only structural audit: 43 lines, 1,763 bytes, SHA-256 DCBD3E0F3E996DFD376C9A2FAD90318FFAFF21AA7B5D3A5B4DD2A95E40E26308. Actual branding text was not copied." },
  { id: "local-public-manifest", repository: "local my-app01 learning snapshot", path: "my-app01/public/manifest.json", usedFor: ["manifest icon metadata", "public asset naming provenance"], evidence: "Read-only structural audit: 25 lines, 492 bytes, SHA-256 50B3D8C3903AF3F78D871B94557AB14F4E39CA192EACA3D2CFA863C867279A14. Actual branding values were not copied." },
  { id: "local-comment-style", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step02-component/Comment.jsx", usedFor: ["inline style object structure", "external image and empty-alt risk provenance"], evidence: "Read-only structural audit: 50 lines, 1,276 bytes, SHA-256 81F87641ABFC8F0C6EE117EB1129B1874C06D34C62C7D1303B8D1089947B0274. The actual external URL, person and message values were not copied." },
  { id: "react-dom-common", repository: "React official API", path: "reference/react-dom/components/common", publicUrl: "https://react.dev/reference/react-dom/components/common", usedFor: ["className/style/common props", "ARIA and data attributes"], evidence: "Official React DOM API documents common host component props, className, style objects, event and accessibility attributes." },
  { id: "whatwg-img", repository: "WHATWG HTML Living Standard", path: "multipage/embedded-content.html#the-img-element", publicUrl: "https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element", usedFor: ["img source/alt/dimensions", "responsive image selection semantics"], evidence: "HTML Standard defines img alternatives, dimensions, source candidates, loading and decoding behavior." },
  { id: "css-cascade6", repository: "W3C CSS Working Group", path: "TR/css-cascade-6", publicUrl: "https://www.w3.org/TR/css-cascade-6/", usedFor: ["cascade ordering", "layers, scope and specificity interaction"], evidence: "CSS Cascading and Inheritance Level 6 defines origins, importance, context, style attributes, layers and cascade sorting." },
  { id: "selectors4", repository: "W3C CSS Working Group", path: "TR/selectors-4", publicUrl: "https://www.w3.org/TR/selectors-4/", usedFor: ["class/attribute/state selectors", "specificity of functional pseudo-classes"], evidence: "Selectors Level 4 defines selector matching, specificity and modern pseudo-class behavior." },
  { id: "mediaqueries5", repository: "W3C CSS Working Group", path: "TR/mediaqueries-5", publicUrl: "https://www.w3.org/TR/mediaqueries-5/", usedFor: ["responsive conditions", "user preference and interaction media features"], evidence: "Media Queries Level 5 defines viewport, pointer/hover, color scheme, contrast and reduced-motion media features." },
  { id: "wcag22", repository: "W3C Web Accessibility Initiative", path: "TR/WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["contrast, focus and reflow", "non-text and interaction accessibility"], evidence: "WCAG 2.2 provides normative success criteria for perceivable, operable and robust content including contrast, reflow and focus." },
  { id: "wai-images", repository: "W3C Web Accessibility Initiative", path: "WAI/tutorials/images", publicUrl: "https://www.w3.org/WAI/tutorials/images/", usedFor: ["informative/decorative/functional image alternatives", "image purpose classification"], evidence: "WAI Images Tutorial gives purpose-based text alternative patterns and decision guidance." },
  { id: "csp3", repository: "W3C Web Application Security Working Group", path: "TR/CSP3", publicUrl: "https://www.w3.org/TR/CSP3/", usedFor: ["style/image/font fetch restrictions", "report-only and enforcement model"], evidence: "Content Security Policy Level 3 defines directives, source lists, violations and enforcement as browser-side defense in depth." },
  { id: "appmanifest", repository: "W3C Web Applications Working Group", path: "TR/appmanifest", publicUrl: "https://www.w3.org/TR/appmanifest/", usedFor: ["manifest processing", "icons, start URL and install metadata"], evidence: "Web Application Manifest specification defines manifest members, icon processing and application metadata." },
  { id: "rfc9111", repository: "IETF RFC Editor", path: "rfc/rfc9111", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["HTTP cache freshness and validation", "deployment cache compatibility"], evidence: "RFC 9111 defines HTTP cache storage, freshness, validation and invalidation semantics." },
];

const session = createExpertSession({
    inventoryId: "react-09-css-assets-layout", slug: "react-09-css-assets-semantic-styling",
  courseId: "react", moduleId: "react-rendering-components", order: 9,
  title: "CSS·asset과 semantic component styling", subtitle: "semantic DOM, bounded style API, cascade·responsive·accessible image와 secure cacheable asset pipeline을 하나의 component contract로 설계합니다.",
  level: "중급", estimatedMinutes: 105,
  coreQuestion: "React component를 의미·keyboard·responsive behavior를 보존하면서 스타일링하고, CSS와 images/fonts/manifest를 안전하고 캐시 가능한 배포 artifact로 어떻게 운영할까요?",
  summary: "my-app01의 Board.jsx/Board.css, App.css, index.css, public index/manifest와 inline-style Comment.jsx를 read-only로 감사합니다. 실제 외부 image URL과 domain values는 복제하지 않고 class/external/global/inline/public asset 구조와 empty-alt·external-origin 위험만 provenance로 사용합니다. semantic host DOM, className/style/data-state API, cascade layers·specificity·scope, design tokens·WCAG contrast, responsive/reduced-motion, module import와 public/base/cache 수명, image purpose·alt·dimensions·performance, CSP·origin/cache 보안과 semantic/computed/visual/network release gates까지 열 절과 열 Node exact examples로 확장합니다.",
  objectives: ["원본 styling channels와 asset provenance를 hash evidence로 감사한다.", "component 이름이 아닌 host DOM semantics와 keyboard contract를 설계한다.", "className·style·state attributes를 finite allowlisted API로 만든다.", "cascade layer·specificity·source order와 global scope를 계산한다.", "semantic tokens와 모든 interaction state의 contrast를 검증한다.", "responsive reflow·DOM order·focus와 reduced motion을 함께 유지한다.", "module/public asset의 base URL·fingerprint·cache 수명을 구분한다.", "image purpose·alt·dimensions·responsive loading과 fallback을 구현한다.", "CSP·origin allowlist·privacy·cache compatibility와 rollback을 운영한다.", "semantic·visual·performance·network evidence를 독립 release gates로 만든다."],
  prerequisites: [{ title: "state 보존·reset과 component identity", reason: "style state와 asset loading 변화가 component tree, focus와 identity lifecycle에 미치는 영향을 구분해야 semantic component styling을 안정적으로 설계할 수 있습니다.", sessionSlug: "react-08-state-identity-reset" }],
  keywords: ["semantic HTML", "className", "inline style", "cascade layers", "specificity", "design tokens", "contrast", "responsive CSS", "reduced motion", "public assets", "image alt", "CSP", "HTTP cache"],
  topics,
  lab: {
    title: "Board와 Comment를 semantic component·asset pipeline으로 재구성하기",
    scenario: "원본 일곱 파일을 변경하지 않고 synthetic board/comment data와 local placeholder assets를 쓰는 disposable React production build에서 semantics, cascade, responsive image, CSP/cache와 rollback을 검증합니다.",
    setup: ["Node.js 20 이상", "React 19 production-like build", "local synthetic SVG/PNG assets only", "keyboard and accessibility inspection", "visual/computed-style browser matrix", "CSP report-only endpoint and cacheable static server", "원본 일곱 파일 read-only hashes"],
    steps: ["원본 selector, host DOM, inline styles, asset references와 external/alt risks를 inventory합니다.", "Board squares의 action 의미에 맞는 native button과 accessible names를 정의합니다.", "base/tone/size/state class allowlist와 dynamic custom-property boundary를 구현합니다.", "reset/base/components/utilities layer와 low-specificity selector budget을 세웁니다.", "light/dark/forced-colors tokens와 default/hover/focus/disabled/selected contrast를 검사합니다.", "320px equivalent, 200%/400% zoom, RTL, keyboard order와 reduced-motion 결과를 확인합니다.", "component-owned asset import와 public manifest/icon을 분류하고 subpath production URLs를 readback합니다.", "informative/decorative image의 alt, width/height, responsive candidates, broken fallback와 CLS/LCP를 검증합니다.", "external image는 차단한 채 CSP report-only→enforce, safe telemetry와 cache headers를 시험합니다.", "semantic/computed/visual/network/performance gates, canary, old artifact retention과 rollback을 rehearsal합니다."],
    expectedResult: ["CSS가 없어도 content hierarchy와 모든 controls가 이해·조작 가능합니다.", "class/style API가 finite하고 untrusted strings/URLs를 raw styling sink에 전달하지 않습니다.", "cascade winner와 token/contrast 결과가 theme/state별로 설명 가능합니다.", "narrow/zoom/RTL/reduced-motion에서 content, focus와 task order가 유지됩니다.", "production asset URLs가 base-safe하고 hashed/mutable cache policy와 일치합니다.", "images의 purpose, alt, dimensions와 fallback이 검증되고 external tracking source가 없습니다.", "CSP, artifact compatibility, canary와 rollback이 동일 build evidence로 반복 가능합니다."],
    cleanup: ["temporary builds, local test assets, browser caches/service workers와 CSP reports를 제거합니다.", "visual snapshots에 synthetic data나 machine paths가 남지 않았는지 검사합니다.", "원본 일곱 파일의 hash와 git status가 변경되지 않았는지 확인합니다."],
    extensions: ["CSS Modules와 cascade layers 조합의 emitted class/order를 비교합니다.", "container queries와 component-level breakpoints를 추가합니다.", "variable fonts의 subset/preload/fallback 및 CLS budget을 측정합니다.", "design token metadata에서 TypeScript types, docs, contrast tests와 migration aliases를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node examples를 실행하고 source→semantic/style/asset contract의 stdout을 완전히 일치시키세요.", requirements: ["stdout 완전 일치", "source channel audit", "semantic element audit", "class allowlist", "cascade winner", "contrast ratio", "motion preference", "asset URL/cache", "image alt/dimensions", "CSP/cache policy", "release gate"], hints: ["Node policy model이 actual browser cascade·layout·accessibility tree를 실행한 증거는 아닙니다."], expectedOutcome: "각 model의 증명 범위와 browser/build integration 검증을 구분합니다.", solutionOutline: ["audit→semantics→style/cascade→responsive→asset/image→security/release 순서입니다."] },
    { difficulty: "응용", prompt: "Board와 Comment를 production-ready semantic component로 재설계하세요.", requirements: ["native control/article semantics", "finite variants", "cascade layer", "theme/contrast/focus", "responsive/RTL/reduced-motion", "local hashed images", "purpose-based alt/dimensions", "CSP/cache", "visual+a11y+performance tests", "rollback"], hints: ["외부 placeholder URL을 다른 외부 URL로 바꾸는 것은 해결이 아닙니다."], expectedOutcome: "semantic, visual, privacy와 deployment lifecycle이 통합된 component가 완성됩니다.", solutionOutline: ["markup→API→CSS architecture→assets→tests→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React design system styling·asset governance를 작성하세요.", requirements: ["host semantics policy", "class/style escape hatch", "layers/specificity budget", "tokens/themes/contrast", "responsive/preferences", "asset ownership/base/fingerprints", "image/font/privacy/CSP", "cache compatibility", "visual/a11y/perf gates", "canary/rollback"], hints: ["component catalog보다 source부터 폐기까지의 contract와 evidence를 정의하세요."], expectedOutcome: "팀이 접근성·보안·성능 회귀 없이 styling과 assets를 evolution할 수 있는 표준이 완성됩니다.", solutionOutline: ["classify→constrain→style→package→verify→observe→migrate 순서입니다."] },
  ],
  nextSessions: ["react-10-accessible-rendering-capstone"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["Board.jsx/Board.css, App.css, index.css, public/index.html, public/manifest.json과 Comment.jsx 일곱 원본을 read-only로 전부 읽고 exact hash·lines·bytes를 기록했습니다.", "Comment.jsx의 실제 external image URL, 인명과 메시지 및 public files의 실제 branding 값은 공개 examples에 복제하지 않고 external-origin·empty-alt·public-path 구조만 provenance로 사용했습니다.", "원본에서 className, external/global CSS, inline style object, animation/reduced-motion와 public icon/manifest references만 관찰했으며 semantic controls, token system, CSP/cache policy와 responsive image pipeline이 이미 완성됐다고 주장하지 않습니다.", "Node examples는 실제 CSS cascade/selector matching, layout, font/image decode, accessibility tree, CSP enforcement, HTTP cache, service worker와 production bundler URL rewriting을 대체하지 않으므로 lab browser/build fixture가 필요합니다.", "React/CSS/HTML/WCAG/CSP/manifest/cache behavior와 browser support는 target versions 및 current primary specifications에 맞춰 release마다 다시 검증해야 합니다."] },
});

export default session;
