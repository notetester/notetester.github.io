import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function node(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "node", filename, purpose, code,
    walkthrough: [
      { lines: "1-8", explanation: "React runtime이나 browser를 흉내 내는 작은 순수 model의 입력과 불변식을 선언합니다." },
      { lines: "9-끝에서 3줄 전", explanation: "root·JSX tree·component purity·props·module graph 중 한 경계를 결정적으로 계산합니다." },
      { lines: "마지막 3줄", explanation: "관찰해야 할 핵심 결과를 stdout으로 출력해 문서의 예상 결과와 한 글자씩 대조합니다." },
    ],
    run: { environment: ["Node.js 20 이상", "ECMAScript module eval", "React·browser·network·credential 불필요"], command: "node " + filename },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "순수 Node model은 실제 JSX compiler, React reconciler, DOM, StrictMode와 bundler integration을 대체하지 않으므로 browser lab을 별도로 실행합니다."] },
    experiments: [
      { change: "root id, props, child 순서, render input 또는 module edge 하나를 바꿉니다.", prediction: "명시한 불변식에 따라 성공 결과나 안정된 failure code가 달라집니다.", result: "stdout 변화와 실제 React development build의 화면·console·component tree를 함께 기록합니다." },
      { change: "CRA fixture와 Vite fixture에서 같은 component contract를 실행합니다.", prediction: "UI 의미는 같고 entry·script·environment 경계와 build artifacts만 toolchain에 맞게 달라집니다.", result: "unit test, browser snapshot, bundle manifest와 rollback 결과를 비교합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-toolchain-audit",
    title: "원본 React 학습 앱을 코드·도구·문서 provenance로 먼저 읽습니다",
    lead: "첫 화면을 고치기 전에 어떤 Node·package manager·bundler·React version과 entry tree를 설명하는지 고정해야 과거 강의 문법과 현재 권장 구성을 섞지 않습니다.",
    explanations: [
      "원본 my-app01의 package.json은 React 19 계열과 react-scripts 5를 함께 둔 CRA 기반 학습 앱입니다. 이 조합은 원본 복습에는 가치가 있지만 새 프로젝트의 기본 선택이라고 일반화하지 않고 lockfile, 실제 설치 tree, Node version과 build result를 별도로 기록합니다.",
      "원본 index.js는 createRoot와 StrictMode를 사용하면서 여러 단계별 component imports와 render 후보를 주석으로 보존합니다. 무엇을 배웠는지 보여 주는 history이지만 한 번에 하나의 composition root와 route catalog로 정리하지 않으면 unused imports, stale code와 현재 실행 화면을 혼동하기 쉽습니다.",
      "원본 Book과 Library는 function component, Fragment, props, child composition을 작은 예제로 보여 줍니다. 문자열로 전달된 page count는 숫자처럼 보이지만 runtime type은 string이므로 이후 계산·validation 단계에서는 typed boundary가 필요합니다.",
      "D:/dev/REACT의 기존 설명 문서는 CRA 보존 이유, Vite 대안, index.html→entry→App→component 흐름과 실제 실행 결과를 연결합니다. 이번 세션은 그 설명을 그대로 복사하지 않고 source hash와 공식 current docs를 대조해 오류와 적용 범위를 명시합니다.",
      "source audit의 산출물은 파일 목록만이 아니라 사실, 추론, 미검증 가정을 나눈 표입니다. source에서 관찰한 React version이나 call은 사실이고 browser behavior는 실행 증거이며 production suitability는 별도 qualification 결과입니다.",
    ],
    concepts: [
      c("source provenance", "학습 결론이 어느 repository file과 snapshot에서 나왔는지 다시 확인할 수 있는 추적 정보입니다.", ["path·hash·line count를 고정합니다.", "실제 사용자 데이터 복사를 의미하지 않습니다."]),
      c("toolchain qualification", "Node·package manager·bundler·plugin·browser 조합이 요구한 개발·빌드·테스트 결과를 재현하는지 확인하는 절차입니다.", ["version label보다 실행 matrix가 중요합니다.", "legacy 보존과 신규 선택을 구분합니다."]),
      c("fact/inference boundary", "source에서 직접 읽은 사실과 여러 증거로 도출한 해석, 아직 실행하지 않은 가정을 분리하는 기록 규칙입니다.", ["과장을 줄입니다.", "upgrade 때 다시 검증합니다."]),
    ],
    diagnostics: [
      d("문서에는 Vite라고 쓰였지만 npm start가 실행되고 react-scripts가 build를 소유합니다.", "원본 CRA fixture와 신규 toolchain 설명을 한 환경처럼 합쳤습니다.", ["package scripts", "installed dependency tree", "entry HTML/JS", "actual command and port"], "legacy CRA reproduction과 Vite migration lab을 별도 directories·commands로 분리하고 결과 contract만 비교합니다.", "각 세션에 source hash, runtime version, command와 artifact manifest를 남깁니다."),
      d("어떤 component를 수정해도 화면이 바뀌지 않습니다.", "주석으로 남은 import 또는 render 후보를 고쳤지만 현재 root tree에는 다른 App만 연결돼 있습니다.", ["createRoot target", "root.render child", "route table", "browser loaded source map"], "single composition root와 explicit route/lab catalog에서 대상 component를 연결합니다.", "rendered component smoke test와 dead module lint를 둡니다."),
    ],
    expertNotes: ["학습용 주석은 맥락을 보존하지만 executable truth는 아닙니다. 현재 import graph와 runtime tree를 우선합니다.", "패키지 이름과 version만 보고 호환성을 단정하지 않고 clean install·test·build 결과를 기록합니다."],
    codeExamples: [node("react01-source-matrix", "source 사실과 qualification 상태를 분리", "React01SourceMatrix.mjs", "관찰한 원본 fact와 아직 실행해야 할 verification을 섞지 않는 audit 표를 만듭니다.", String.raw`const rows = [
  { item: "entry", observed: true, verified: true },
  { item: "strict-mode", observed: true, verified: true },
  { item: "vite-build", observed: false, verified: false },
  { item: "browser-output", observed: false, verified: false },
];
const facts = rows.filter((row) => row.observed).length;
const evidence = rows.filter((row) => row.verified).length;
const pending = rows.filter((row) => !row.verified).map((row) => row.item);
console.log("facts=" + facts);
console.log("verified=" + evidence);
console.log("pending=" + pending.join(","));`, "facts=2\nverified=2\npending=vite-build,browser-output", ["local-package", "local-index", "local-react-intro", "react-cra-sunset"])],
  },
  {
    id: "project-runtime-toolchain",
    title: "Node·package manager·lockfile·script와 Vite 개발/production 경계를 고정합니다",
    lead: "React component source만 같아도 resolver, environment variables, CSS/assets와 browser target을 소유하는 toolchain이 다르면 실행 결과와 공급망 위험이 달라집니다.",
    explanations: [
      "package.json의 semver range는 허용 범위이고 lockfile은 실제 dependency graph snapshot입니다. clean machine에서는 npm ci 같은 frozen install로 lockfile과 manifest 불일치를 실패시키고 Node/npm version, registry와 integrity 결과를 함께 기록합니다.",
      "development server의 빠른 transform과 hot update는 production artifact가 아닙니다. npm run build를 clean environment에서 실행하고 output filenames, hashes, chunk graph, source map policy, asset base와 fallback routing을 실제 정적 server에서 검증합니다.",
      "Vite는 index.html을 module graph entry로 취급하고 import.meta.env의 노출 규칙을 사용합니다. CRA의 public/index.html, src/index.js, process.env naming을 기계적으로 rename하면 root, public path와 runtime configuration에서 silent drift가 생깁니다.",
      "client bundle에 포함되는 environment value는 사용자가 읽고 수정할 수 있는 공개 설정입니다. API secret, signing key, database credential은 어떤 prefix를 붙여도 frontend build 변수에 두지 않으며 server-side secret store와 short-lived capability를 사용합니다.",
      "새 프로젝트에서는 framework 또는 Vite 같은 current path를 요구사항에 맞게 고르되 원본 CRA를 즉시 삭제하지 않습니다. behavior baseline을 만들고 entry, tests, CSS/assets, routes, environment와 deployment를 작은 단계로 옮겨 rollback 가능한 migration을 만듭니다.",
    ],
    concepts: [
      c("manifest", "직접 의존성, scripts와 project metadata를 선언하는 package.json입니다.", ["lockfile과 역할이 다릅니다.", "script는 build interface가 됩니다."]),
      c("lockfile", "resolved dependency versions, graph와 integrity metadata를 재현하기 위한 snapshot입니다.", ["source control에 둡니다.", "다른 platform 조건도 검토합니다."]),
      c("development/production parity", "동일 source가 개발 server와 production static serving에서 의미적으로 같은 route·asset·configuration behavior를 보이는 성질입니다.", ["성능과 debug checks는 다를 수 있습니다.", "production-like preview가 필요합니다."]),
    ],
    diagnostics: [
      d("개발 server에서는 보이지만 배포 후 빈 화면과 asset 404가 납니다.", "base path, SPA fallback, case-sensitive path 또는 production environment가 development와 다릅니다.", ["browser network waterfall", "built index asset URLs", "server fallback", "route refresh", "case-sensitive clean build"], "explicit base/deploy path와 static fallback을 맞추고 production artifact를 동일 server topology에서 smoke test합니다.", "preview·subpath·deep-link·cache-header tests를 CI에 둡니다."),
    ],
    expertNotes: ["hot reload 성공은 production build와 dependency integrity를 증명하지 않습니다.", "frontend environment prefix는 공개 여부 표식이지 secret 보호 장치가 아닙니다."],
    codeExamples: [node("react01-toolchain-gate", "manifest와 build gate를 결정표로 검증", "React01ToolchainGate.mjs", "lockfile, frozen install, build, deep-link와 secret scan이 모두 있어야 release candidate가 되는 model입니다.", String.raw`const checks = {
  lockfile: true,
  frozenInstall: true,
  productionBuild: true,
  deepLink: false,
  clientSecretScan: true,
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log("ready=" + (failed.length === 0));
console.log("failed=" + (failed.join(",") || "none"));
checks.deepLink = true;
console.log("after-fix=" + Object.values(checks).every(Boolean));`, "ready=false\nfailed=deepLink\nafter-fix=true", ["local-package", "vite-guide", "npm-package-json", "react-start-project"])],
  },
  {
    id: "html-entry-create-root",
    title: "HTML mount node에서 createRoot·render·unmount까지 ownership을 추적합니다",
    lead: "React UI는 저절로 뜨지 않고 browser가 읽은 HTML node와 client entry가 하나의 root ownership contract를 맺을 때 component tree가 DOM에 연결됩니다.",
    explanations: [
      "document.getElementById로 찾는 mount element가 없으면 createRoot에 null을 전달하게 됩니다. non-null assertion으로 숨기기보다 boot 전에 존재와 중복 여부를 검사해 build/template mismatch를 즉시 설명 가능한 오류로 만듭니다.",
      "createRoot는 React가 해당 DOM container 내부를 소유하게 합니다. 같은 container에 여러 root를 만들거나 React 밖 code가 children을 임의로 교체하면 ownership 충돌과 event/listener leak이 생길 수 있습니다.",
      "root.render에 전달한 element는 현재 UI tree의 선언입니다. component function을 직접 호출하는 것이 아니라 JSX element를 만들어 React가 render와 reconciliation을 제어하게 해야 Hooks ordering, identity와 scheduling이 유지됩니다.",
      "기존 server-rendered HTML을 이어받는 경우 createRoot가 아니라 hydration contract가 필요합니다. server/client markup, identifier prefix, locale/time/random과 data snapshot이 다르면 hydration warning 또는 client replacement가 생깁니다.",
      "microfrontend 또는 test에서 root를 제거할 때 unmount로 React tree의 effects와 event ownership을 정리한 뒤 host node를 폐기합니다. DOM remove만 수행해 cleanup을 우연에 맡기지 않습니다.",
    ],
    concepts: [
      c("mount node", "React root가 children DOM을 관리하도록 host HTML이 제공하는 container element입니다.", ["stable unique selector를 가집니다.", "React 밖 mutation을 제한합니다."]),
      c("createRoot", "browser DOM node에 client React root를 만들고 render/unmount interface를 제공하는 API입니다.", ["한 container에 한 root가 기본입니다.", "hydration과 다릅니다."]),
      c("ownership boundary", "DOM subtree의 생성·갱신·event·cleanup을 어느 runtime이 책임지는지 정한 경계입니다.", ["host와 React 사이를 명시합니다.", "중복 mutation을 막습니다."]),
    ],
    diagnostics: [
      d("createRoot 대상이 null이거나 같은 node에 이미 root가 있다는 경고가 납니다.", "HTML id와 entry가 drift했거나 hot/microfrontend lifecycle에서 root를 중복 생성했습니다.", ["served HTML source", "selector cardinality", "entry execution count", "stored root handle", "unmount trace"], "mount node를 boot assertion으로 검증하고 root handle을 lifecycle owner가 한 번 생성·unmount합니다.", "HTML-entry contract test와 repeated mount/unmount leak test를 둡니다."),
    ],
    expertNotes: ["DOM node 존재를 TypeScript assertion만으로 보장하지 말고 실제 served document에서 확인합니다.", "SSR markup이 있으면 hydration을 별도 세션에서 framework contract와 검증합니다."],
    codeExamples: [node("react01-root-contract", "mount root cardinality와 lifecycle 검증", "React01RootContract.mjs", "한 mount id에 한 root만 만들고 unmount 뒤 재생성할 수 있는 ownership state machine을 실행합니다.", String.raw`const state = new Map([["root", "empty"]]);
function mount(id) {
  if (!state.has(id)) return "missing";
  if (state.get(id) === "mounted") return "duplicate";
  state.set(id, "mounted");
  return "mounted";
}
function unmount(id) {
  if (state.get(id) !== "mounted") return "not-mounted";
  state.set(id, "empty");
  return "unmounted";
}
console.log("first=" + mount("root"));
console.log("second=" + mount("root"));
console.log("missing=" + mount("app"));
console.log("cleanup=" + unmount("root"));
console.log("remount=" + mount("root"));`, "first=mounted\nsecond=duplicate\nmissing=missing\ncleanup=unmounted\nremount=mounted", ["local-index", "local-app", "react-create-root", "react-client-api"])],
  },
  {
    id: "strict-mode-development",
    title: "StrictMode의 development-only 재실행을 버그 탐지 신호로 사용합니다",
    lead: "개발 중 render·Effect·ref callback이 다시 실행되는 현상을 React가 두 번 저장했다는 오류로 오해하지 않고 purity와 cleanup 검사를 통과하도록 설계합니다.",
    explanations: [
      "StrictMode는 production UI를 두 번 commit하는 기능이 아니라 development에서 impure render, missing Effect cleanup, ref cleanup과 deprecated API를 더 빨리 드러내는 검사 경계입니다. console 횟수만 세지 말고 commit과 external side effect를 구분합니다.",
      "component render는 같은 props, state, context에 대해 같은 JSX를 계산해야 합니다. render 중 global counter 증가, Date.now, random, request, storage write나 input array sort는 재실행 시 결과와 외부 상태를 바꿉니다.",
      "외부 system 동기화는 Effect에서 수행하되 setup이 만든 subscription, timer, observer, request lifecycle을 cleanup이 대칭적으로 해제해야 합니다. development의 setup→cleanup→setup sequence를 견디지 못하면 real navigation과 retry에서도 leak이 생깁니다.",
      "중복 POST를 StrictMode 탓으로 가리고 mode를 끄면 render/effect ownership 결함이 남습니다. user event에서 mutation을 시작하고 idempotency key, abort, deduplication과 server contract로 exactly-once처럼 보이는 UX를 설계합니다.",
      "performance profiling은 development StrictMode 횟수와 production commit cost를 분리합니다. development check를 유지한 채 React Profiler, browser performance와 production build를 함께 측정합니다.",
    ],
    concepts: [
      c("pure render", "같은 inputs에서 외부 상태를 변경하지 않고 같은 JSX description을 계산하는 render 성질입니다.", ["호출 횟수에 독립적입니다.", "event/effect와 역할을 나눕니다."]),
      c("symmetric cleanup", "setup이 획득한 subscription·timer·resource를 같은 identity와 scope로 해제하는 cleanup입니다.", ["재실행 가능해야 합니다.", "navigation에서도 필요합니다."]),
      c("development probe", "production 의미를 바꾸지 않으면서 lifecycle 결함을 노출하기 위해 development에서 추가 실행하는 검사입니다.", ["횟수가 API contract는 아닙니다.", "발견된 결함을 수정합니다."]),
    ],
    diagnostics: [
      d("development에서 counter, analytics 또는 POST가 두 번 증가합니다.", "render 또는 mount Effect에 비멱등 external mutation을 두고 cleanup/dedup 없이 StrictMode probe를 받았습니다.", ["render body side effects", "Effect dependencies", "setup/cleanup trace", "event path", "server idempotency"], "render를 순수 계산으로 만들고 user action mutation과 Effect synchronization을 분리하며 cleanup·abort·idempotency를 구현합니다.", "StrictMode integration test와 effect balance counters를 유지합니다."),
    ],
    expertNotes: ["StrictMode의 현재 추가 호출 횟수를 business logic에 의존하지 않습니다.", "production에서 한 번 보인다는 이유로 impure render를 허용하지 않습니다."],
  },
  {
    id: "jsx-syntax-transform",
    title: "JSX를 HTML 문자열이 아니라 JavaScript element description으로 읽습니다",
    lead: "JSX의 tag·attribute·children·expression 규칙을 parser와 runtime element creation 관점에서 이해하면 문법 오류, injection과 type 혼동을 빠르게 진단할 수 있습니다.",
    explanations: [
      "JSX는 browser가 그대로 실행하는 HTML이 아니라 build transform이 JavaScript calls/objects로 바꾸는 syntax extension입니다. HTML과 비슷해도 className, camelCase event names, expression braces, self-closing tags와 single returned root 규칙을 따릅니다.",
      "lowercase tag는 built-in host element로, uppercase identifier는 scope의 component reference로 해석됩니다. component 이름을 소문자로 시작하면 정의한 function 대신 unknown DOM tag처럼 처리될 수 있습니다.",
      "중괄호에는 JavaScript expression이 들어가며 statement를 바로 놓을 수 없습니다. if/for는 render 전에 계산하거나 conditional expression, logical operator와 array map으로 value를 만들어 JSX tree에 삽입합니다.",
      "string·number는 text child가 되고 null, undefined와 boolean은 보통 화면 node를 만들지 않습니다. object를 child로 직접 render하면 오류가 날 수 있으므로 public representation을 명시적으로 formatting합니다.",
      "React의 일반 text interpolation은 escaping되지만 dangerouslySetInnerHTML은 별도 trusted HTML boundary입니다. 사용자 입력을 markup으로 만들지 말고 sanitization, CSP와 source provenance를 이후 보안 세션에서 검증합니다.",
    ],
    concepts: [
      c("JSX element", "type, props와 children을 가진 UI description을 만드는 syntax 결과입니다.", ["실제 DOM node와 다릅니다.", "render 때 reconciliation 입력이 됩니다."]),
      c("expression container", "JSX 중괄호 안에서 JavaScript expression 결과를 child 또는 prop value로 삽입하는 영역입니다.", ["statement는 직접 둘 수 없습니다.", "runtime type을 보존합니다."]),
      c("Fragment", "추가 host DOM wrapper 없이 여러 sibling children을 하나의 returned element group으로 묶는 React type입니다.", ["DOM node가 아닙니다.", "목록에서는 explicit key가 필요할 수 있습니다."]),
    ],
    diagnostics: [
      d("Adjacent JSX elements 또는 object is not valid as a child 오류가 납니다.", "여러 root를 반환했거나 public representation 없이 object를 child에 넣었습니다.", ["returned expression AST", "child runtime types", "Fragment placement", "conditional branches"], "single element/Fragment로 group하고 object를 allowlisted fields와 formatter로 변환합니다.", "child type matrix와 invalid object negative test를 둡니다."),
    ],
    expertNotes: ["JSX escaping이 authorization이나 URL safety를 대신하지 않습니다.", "transform mode와 runtime import behavior는 compiler/bundler version의 qualification 대상입니다."],
    codeExamples: [node("react01-jsx-tree", "JSX element description의 type·props·children model", "React01JsxTree.mjs", "작은 element factory로 Library→Book tree를 만들고 DOM 문자열이 아니라 구조 description임을 출력합니다.", String.raw`function element(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}
function Book(props) {
  return element("article", { "data-id": props.id },
    element("h2", null, props.title),
    element("p", null, props.pages)
  );
}
const tree = element("main", null,
  Book({ id: 1, title: "Guide", pages: 120 }),
  Book({ id: 2, title: "Lab", pages: 80 })
);
console.log("root=" + tree.type);
console.log("children=" + tree.children.length);
console.log("first=" + tree.children[0].children[0].children[0]);
console.log("pages-type=" + typeof tree.children[0].children[1].children[0]);`, "root=main\nchildren=2\nfirst=Guide\npages-type=number", ["local-book", "local-library", "local-react-jsx", "react-writing-markup", "react-jsx-braces"])],
  },
  {
    id: "function-component-contract",
    title: "function component를 pure render unit과 stable identity로 설계합니다",
    lead: "component는 호출 가능한 function이지만 React tree 안에서는 type identity, inputs와 Hook rules를 가진 선언 단위이므로 일반 helper처럼 임의 호출하거나 매 render마다 새로 정의하지 않습니다.",
    explanations: [
      "component 이름은 대문자로 시작하고 JSX element type으로 사용합니다. React가 component boundary를 알면 state, Effects, error and profiling frames를 해당 identity에 연결할 수 있습니다.",
      "component function은 props를 받고 JSX를 반환하는 pure calculation이어야 합니다. DOM mutation, network, timers와 persistent storage는 render phase가 아니라 event 또는 Effect ownership으로 이동합니다.",
      "parent function 안에서 child component function을 매번 새로 정의하면 render마다 type identity가 달라져 child state가 reset되고 DOM work가 증가할 수 있습니다. component definitions는 module top level에 두고 data는 props로 전달합니다.",
      "component를 직접 Book(props)처럼 호출하면 단순 예제는 돌아 보일 수 있지만 Hook call graph와 React ownership을 우회합니다. JSX Book element로 만들어 React가 호출 시점과 횟수를 제어하게 합니다.",
      "한 component가 data fetching, authentication, layout와 모든 fields를 소유하면 변경 이유와 render blast radius가 커집니다. route/container, domain UI와 reusable presentation boundaries를 실제 cohesion과 state ownership으로 나눕니다.",
    ],
    concepts: [
      c("component identity", "React가 이전과 다음 tree에서 같은 component type/state position을 연결하는 기준입니다.", ["function reference와 tree position이 중요합니다.", "동적 nested definition을 피합니다."]),
      c("render phase", "React가 component functions를 호출해 다음 UI description을 계산하는 단계입니다.", ["commit과 구분합니다.", "중단·재실행될 수 있습니다."]),
      c("composition boundary", "한 component가 어떤 children과 state/event interface를 소유하는지 정한 UI 설계 경계입니다.", ["재사용보다 책임을 먼저 봅니다.", "props surface를 작게 유지합니다."]),
    ],
    diagnostics: [
      d("parent 입력 때마다 child form state가 초기화됩니다.", "child component를 parent render 안에서 정의해 type reference가 매번 바뀝니다.", ["React DevTools tree", "definition location", "key/type changes", "mount/unmount trace"], "child definition을 module scope로 옮기고 필요한 values/functions를 props로 전달합니다.", "state preservation/reset tests와 mount counters를 둡니다."),
    ],
    expertNotes: ["작은 component 수 자체가 품질 지표는 아니며 state ownership과 change cohesion을 근거로 분리합니다.", "React compiler 최적화를 기대해 purity 위반을 숨기지 않습니다."],
    codeExamples: [node("react01-purity", "같은 입력의 pure render와 외부 mutation 비교", "React01Purity.mjs", "동일 props를 두 번 계산했을 때 pure output은 같고 impure global state만 달라지는 반례를 실행합니다.", String.raw`let external = 0;
function pureCard(props) {
  return { type: "card", label: props.label.trim(), count: props.count };
}
function impureCard(props) {
  external += 1;
  return { type: "card", label: props.label, sequence: external };
}
const a = pureCard({ label: " Alpha ", count: 2 });
const b = pureCard({ label: " Alpha ", count: 2 });
const x = impureCard({ label: "Alpha" });
const y = impureCard({ label: "Alpha" });
console.log("pure-equal=" + (JSON.stringify(a) === JSON.stringify(b)));
console.log("impure-equal=" + (JSON.stringify(x) === JSON.stringify(y)));
console.log("external=" + external);`, "pure-equal=true\nimpure-equal=false\nexternal=2", ["react-first-component", "react-purity", "react-strict-mode"])],
  },
  {
    id: "props-runtime-contract",
    title: "props의 단방향 snapshot과 runtime type·default·validation 경계를 설계합니다",
    lead: "JSX attribute로 전달한 값은 이름만 보고 type이 정해지지 않으므로 parent가 표현식을 통해 올바른 domain value를 주고 child는 읽기 전용 input contract로 다룹니다.",
    explanations: [
      "props는 parent render가 child에 전달한 snapshot입니다. child가 props object나 nested array/object를 mutation하면 parent state와 memoization assumptions을 깨므로 update intent를 callback event로 올려 보냅니다.",
      "quoted JSX attribute numOfPage=\"105\"는 string이고 braces의 numOfPage={105}는 number입니다. 표시만 할 때 같아 보여도 addition, sorting, validation과 API encoding에서 다른 결과가 되므로 boundary conversion을 명시합니다.",
      "destructuring은 props contract를 읽기 쉽게 하지만 누락·unknown·wrong-type을 자동 거부하지 않습니다. TypeScript static types, runtime schema validation과 component tests가 각기 build-time와 untrusted runtime 경계를 담당합니다.",
      "default value는 missing 또는 undefined와 적용 규칙을 확인하고 null, empty string과 zero를 domain 의미에 따라 구분합니다. logical OR로 default를 주면 valid zero/false를 덮을 수 있어 nullish semantics가 필요한지 결정합니다.",
      "callback props는 child가 발생시킨 user intent와 최소 payload를 전달합니다. child가 parent internal store를 직접 import하지 않으면 재사용, isolated test와 ownership reasoning이 쉬워집니다.",
    ],
    concepts: [
      c("props snapshot", "특정 parent render에서 child에게 전달된 읽기 전용 input values 집합입니다.", ["시간에 따라 새 snapshot을 받습니다.", "child가 직접 수정하지 않습니다."]),
      c("runtime boundary", "external JSON, DOM input 또는 loosely typed JSX value가 domain/component type으로 변환·검증되는 지점입니다.", ["static type과 다릅니다.", "오류 taxonomy를 가집니다."]),
      c("callback prop", "child event intent를 parent state owner에게 전달하는 function input입니다.", ["mutation 권한을 좁힙니다.", "stable payload contract를 둡니다."]),
    ],
    diagnostics: [
      d("페이지 수 105에 1을 더했는데 1051이 됩니다.", "quoted JSX attribute가 string인데 숫자 domain value로 검증·변환하지 않았습니다.", ["React DevTools prop type", "JSX attribute syntax", "API schema", "Number conversion result", "NaN/range"], "parent boundary에서 finite integer와 range를 검증해 number prop으로 전달하고 invalid input을 stable error로 처리합니다.", "string/number/missing/null/zero/bounds props table test를 둡니다."),
    ],
    expertNotes: ["TypeScript는 network JSON과 user input을 runtime에 검증하지 않습니다.", "props drilling을 피하려고 모든 값을 Context/global store로 옮기기 전에 ownership과 update frequency를 측정합니다."],
    codeExamples: [node("react01-props-normalization", "문자열 props를 domain number로 안전하게 정규화", "React01Props.mjs", "missing, decimal, negative와 valid integer를 구분하고 default가 zero를 덮지 않는 converter를 실행합니다.", String.raw`function pages(value, fallback = 1) {
  if (value === undefined) return { ok: true, value: fallback, source: "default" };
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 0) return { ok: false, code: "invalid-pages" };
  return { ok: true, value: number, source: "input" };
}
for (const value of [undefined, "105", 0, "2.5", -1]) {
  const result = pages(value);
  console.log(JSON.stringify(result));
}`, "{\"ok\":true,\"value\":1,\"source\":\"default\"}\n{\"ok\":true,\"value\":105,\"source\":\"input\"}\n{\"ok\":true,\"value\":0,\"source\":\"input\"}\n{\"ok\":false,\"code\":\"invalid-pages\"}\n{\"ok\":false,\"code\":\"invalid-pages\"}", ["local-book", "local-library", "react-props", "react-conditional-rendering"])],
  },
  {
    id: "composition-tree-data-flow",
    title: "parent·child composition과 단방향 data/event 흐름을 tree로 추적합니다",
    lead: "Library가 Book을 여러 번 배치하는 작은 예제를 화면 복제라고만 보지 않고 identity, data ownership, child slots와 event direction을 설명하는 첫 component architecture로 확장합니다.",
    explanations: [
      "parent는 child element types와 props를 선택해 UI tree를 합성합니다. child는 받은 props로 표시하고 user event callback을 parent로 올리며 sibling끼리 서로를 직접 mutation하지 않습니다.",
      "같은 Book component를 여러 번 사용해도 각 element position과 key에 따라 독립 instance identity를 가질 수 있습니다. list insertion/reorder에서는 stable domain key가 state preservation을 결정하므로 다음 세션에서 reconciliation과 함께 다룹니다.",
      "children prop은 parent가 markup composition을 주입하는 slot입니다. header, body, actions를 named props나 compound components로 표현할 때 접근성 relation과 DOM structure ownership을 함께 정합니다.",
      "data가 두 siblings에 필요하면 가장 가까운 공통 owner로 state를 올리고 derived data는 render에서 계산합니다. duplicate state copies와 synchronization Effects를 만들지 않습니다.",
      "component tree와 DOM tree는 동일하지 않습니다. Fragment, component boundary, portal과 conditional null은 DOM node를 만들지 않거나 다른 container에 commit할 수 있어 accessibility tree와 event semantics를 실제 browser에서 확인합니다.",
    ],
    concepts: [
      c("one-way data flow", "owner가 props로 data를 아래로 보내고 child가 callback으로 event intent를 위로 알리는 흐름입니다.", ["source of truth를 추적합니다.", "양방향 mutation을 피합니다."]),
      c("lifting state", "여러 descendants가 공유하는 최소 state를 가장 가까운 공통 owner로 이동하는 설계입니다.", ["derived state를 중복 저장하지 않습니다.", "범위를 과도하게 높이지 않습니다."]),
      c("slot composition", "parent가 child component의 특정 UI 위치에 elements/content를 제공하는 합성 방식입니다.", ["children 또는 named props를 사용합니다.", "DOM/accessibility ownership을 명시합니다."]),
    ],
    diagnostics: [
      d("두 sibling의 선택값이 서로 달라지고 Effects로 계속 맞춰야 합니다.", "같은 domain 사실을 각 child state에 중복 저장해 source of truth가 둘입니다.", ["state owners", "update paths", "derived values", "effect dependency cycle"], "공통 owner에 최소 canonical state를 두고 props/callback으로 내려 보내며 derived value는 render에서 계산합니다.", "한 action당 owner update와 sibling consistency test를 둡니다."),
    ],
    expertNotes: ["global store는 component composition을 대체하지 않으며 domain-wide shared state에만 근거를 두고 사용합니다.", "UI tree diagram에는 state owner, server/cache boundary와 failure boundary를 함께 표시합니다."],
  },
  {
    id: "esm-import-export-graph",
    title: "ES module import/export와 case-sensitive dependency graph를 관리합니다",
    lead: "component 파일을 나누는 행위는 곧 module public API와 build graph를 만드는 일이므로 default/named exports, path resolution, cycles와 lazy chunk boundaries를 의도적으로 설계합니다.",
    explanations: [
      "default export는 한 module의 대표 value를 임의 local name으로 import할 수 있고 named export는 exported identifier와 연결됩니다. 팀 규칙보다 refactor discoverability, tree tooling과 public API clarity를 근거로 선택합니다.",
      "relative specifier는 importer file 위치에서 해석되며 extension/index/alias behavior는 browser 또는 bundler가 소유합니다. development Windows의 case-insensitive filesystem에서 통과한 Book/book mismatch가 Linux CI에서 실패할 수 있습니다.",
      "static imports는 module graph를 build 전에 분석하게 해 tree-shaking, chunking과 early syntax errors를 돕습니다. dynamic import는 필요 시점에 별도 chunk를 불러오지만 loading/error/retry UX와 stale deployment chunk recovery를 요구합니다.",
      "barrel module은 import path를 단순화하지만 broad re-export, name collision와 cycle을 숨길 수 있습니다. feature public API에서만 좁게 사용하고 internal module은 direct dependency를 유지합니다.",
      "circular imports는 initialization order와 temporal dead zone 문제를 만들 수 있습니다. UI feature가 서로의 store/component를 import한다면 shared contract를 더 낮은 dependency layer로 추출하거나 event/interface 방향을 다시 설계합니다.",
    ],
    concepts: [
      c("module graph", "static/dynamic import edges로 연결된 source modules의 dependency graph입니다.", ["build chunks와 invalidation에 영향 줍니다.", "cycle과 boundary를 검사합니다."]),
      c("default export", "module마다 하나 존재할 수 있고 importer가 원하는 local identifier로 받는 export form입니다.", ["rename 자유가 있습니다.", "named export와 혼동하지 않습니다."]),
      c("dynamic import", "runtime에 module loading promise를 시작하는 import expression입니다.", ["code splitting에 사용합니다.", "loading/error recovery가 필요합니다."]),
    ],
    diagnostics: [
      d("Windows 개발에서는 성공하지만 Linux CI에서 Module not found가 납니다.", "import specifier와 실제 filename case가 다르거나 bundler-specific resolution에 의존했습니다.", ["git tracked case", "exact specifier", "clean case-sensitive checkout", "alias config", "build resolver trace"], "filename/specifier case를 정확히 맞추고 supported resolution만 사용해 clean Linux build를 실행합니다.", "case-sensitive import lint와 container clean build를 CI에 둡니다."),
    ],
    expertNotes: ["barrel 개수보다 dependency direction과 cycle-free feature boundary가 중요합니다.", "dynamic import path를 user input으로 조립하지 않고 finite allowlist를 사용합니다."],
    codeExamples: [node("react01-module-graph", "module dependency의 cycle과 build order 검사", "React01ModuleGraph.mjs", "entry→App→Library→Book graph를 topological order로 정렬하고 cycle edge를 추가했을 때 거부합니다.", String.raw`function order(graph) {
  const visiting = new Set(), done = new Set(), out = [];
  function visit(node) {
    if (visiting.has(node)) throw new Error("cycle:" + node);
    if (done.has(node)) return;
    visiting.add(node);
    for (const dep of graph[node] || []) visit(dep);
    visiting.delete(node);
    done.add(node);
    out.push(node);
  }
  for (const node of Object.keys(graph)) visit(node);
  return out;
}
const graph = { entry: ["App"], App: ["Library"], Library: ["Book"], Book: [] };
console.log("order=" + order(graph).join(">"));
graph.Book = ["App"];
try { order(graph); } catch (error) { console.log(error.message); }`, "order=Book>Library>App>entry\ncycle:App", ["local-index", "local-book", "local-library", "mdn-import", "mdn-export", "mdn-modules"])],
  },
  {
    id: "cra-vite-migration-release",
    title: "CRA 학습 자산을 보존하면서 Vite로 behavior-first migration합니다",
    lead: "도구 이름을 바꾸는 작업으로 축소하지 않고 현재 화면·route·test·asset·configuration contract를 고정한 뒤 작은 reversible steps와 production readback으로 이동합니다.",
    explanations: [
      "먼저 legacy app을 clean install, test와 production build로 재현하고 root routes, visual states, network mocks, asset URLs와 browser targets를 baseline artifact로 남깁니다. 현재 실패를 migration defect와 혼동하지 않도록 known issues를 별도 기록합니다.",
      "Vite fixture를 생성한 뒤 entry HTML/root, src entry, JSX file extensions, CSS/assets, aliases와 environment access를 한 boundary씩 옮깁니다. 대규모 dependency upgrade와 component refactor를 같은 change에 묶지 않습니다.",
      "CRA service worker, Jest setup, proxy, public directory와 environment prefix는 Vite에 자동 대응되지 않습니다. 각 feature를 사용 여부부터 inventory하고 Vitest 또는 기존 test runner, dev proxy와 deploy server의 실제 contract를 명시합니다.",
      "browser behavior parity는 pixel snapshot 하나로 충분하지 않습니다. accessible names, keyboard path, route refresh, loading/error, form state, network contract, console zero-error와 production bundle budgets를 함께 비교합니다.",
      "cutover는 immutable artifact와 rollback reference를 둡니다. canary traffic 또는 preview environment에서 telemetry와 real user signals를 보고, stale chunk/cache failure와 deep-link fallback을 rehearsal한 뒤 old artifact를 retention 기간 동안 보존합니다.",
    ],
    concepts: [
      c("behavior baseline", "migration 전후에 반드시 보존해야 할 user-visible·accessibility·network·route·error 결과 집합입니다.", ["source shape보다 결과를 고정합니다.", "known defects도 기록합니다."]),
      c("reversible migration", "각 단계가 독립 검증되고 이전 artifact/config로 돌아갈 수 있는 migration 방식입니다.", ["tool upgrade와 refactor를 분리합니다.", "rollback을 실제 연습합니다."]),
      c("production readback", "배포된 HTML·assets·headers·routes와 telemetry가 승인한 artifact/config와 같은지 다시 읽어 확인하는 절차입니다.", ["CI 성공을 보완합니다.", "cache/CDN을 포함합니다."]),
    ],
    diagnostics: [
      d("Vite 전환 후 홈은 보이지만 새로고침 route, images 또는 tests가 깨집니다.", "entry만 옮기고 public path, SPA fallback, asset imports, environment와 test setup inventory를 생략했습니다.", ["deep-link HTTP response", "built asset manifest", "public/import usage", "test globals/setup", "runtime config"], "migration matrix의 각 boundary를 explicit Vite contract로 옮기고 production-like server에서 parity suite를 실행합니다.", "legacy/new artifact differential suite와 rollback smoke test를 release gate로 둡니다."),
    ],
    expertNotes: ["CRA 지원 종료 사실만으로 당일 삭제를 정당화하지 않고 risk와 behavior evidence로 migration priority를 정합니다.", "Vite development speed와 production security는 별도 검증 대상입니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-package", repository: "D:/dev/my-app01", path: "package.json", usedFor: ["CRA scripts", "React 19 dependencies", "browser targets"], evidence: "2026-07-14 read-only audit: 44 lines, 1,052 bytes, SHA-256 6FB7B7A0AD0C96237903AF33A63D476231C1496055E5EF423B2F385FB50BB7A5." },
  { id: "local-index", repository: "D:/dev/my-app01", path: "src/index.js", usedFor: ["createRoot", "StrictMode", "commented lesson imports"], evidence: "2026-07-14 read-only audit: 140 lines, 6,137 bytes, SHA-256 6CEDE299CBC8A6766C018A4DCD9F6290655579F4965026837C448D2910FE890F." },
  { id: "local-app", repository: "D:/dev/my-app01", path: "src/App.js", usedFor: ["root composition", "router integration", "stateful sample data"], evidence: "2026-07-14 read-only audit: 49 lines, 2,011 bytes, SHA-256 9CFFFAE061E24C865A2320692E409C8330AAAE764EABD9D441904D20ED619E39. 실제 학습 문자열 값은 공개 예제에 복사하지 않았습니다." },
  { id: "local-book", repository: "D:/dev/my-app01", path: "src/pages/step01-jsx/Book.jsx", usedFor: ["function component", "Fragment", "props expressions"], evidence: "2026-07-14 read-only audit: 25 lines, 731 bytes, SHA-256 1F7F3EF67F0D3D675E342C1AD1B50D6483107A578AB71AFC17D0FEA69FB0AD4A." },
  { id: "local-library", repository: "D:/dev/my-app01", path: "src/pages/step01-jsx/Library.jsx", usedFor: ["component composition", "quoted props", "repeated children"], evidence: "2026-07-14 read-only audit: 19 lines, 618 bytes, SHA-256 F3951584896DCC8D54EEF59555947AEC43B5C21B1E9E807A2147C7D6D9B7104C. 실제 책/인물 문자열은 synthetic labels로 대체했습니다." },
  { id: "local-react-intro", repository: "D:/dev/REACT", path: "docs/react/01-intro-setup.md", usedFor: ["CRA/Vite distinction", "app skeleton", "existing result explanation"], evidence: "2026-07-14 read-only audit: 166 lines, 8,577 bytes, SHA-256 F5606F52A72C9BE700F1F8F44C189E1848D4825292E20F14694033D47AE7C6B4." },
  { id: "local-react-jsx", repository: "D:/dev/REACT", path: "docs/react/02-jsx-components.md", usedFor: ["JSX/component explanation", "props and composition", "run-result mapping"], evidence: "2026-07-14 read-only audit: 151 lines, 6,231 bytes, SHA-256 16210EF43D4FAB3E4189AE8090BA9452409FED56555D6DF72E0639EC2560D24C." },
  { id: "react-start-project", repository: "React official documentation", path: "learn/start-a-new-react-project", publicUrl: "https://react.dev/learn/start-a-new-react-project", usedFor: ["current project start guidance", "framework/build tool choices"], evidence: "React official current start guidance를 확인했습니다." },
  { id: "react-cra-sunset", repository: "React official blog", path: "blog/2025/02/14/sunsetting-create-react-app", publicUrl: "https://react.dev/blog/2025/02/14/sunsetting-create-react-app", usedFor: ["CRA deprecation context", "migration rationale"], evidence: "React 팀의 CRA deprecation and migration guidance를 확인했습니다." },
  { id: "react-first-component", repository: "React official documentation", path: "learn/your-first-component", publicUrl: "https://react.dev/learn/your-first-component", usedFor: ["component capitalization", "component definitions"], evidence: "function component definition과 JSX usage를 확인했습니다." },
  { id: "react-writing-markup", repository: "React official documentation", path: "learn/writing-markup-with-jsx", publicUrl: "https://react.dev/learn/writing-markup-with-jsx", usedFor: ["JSX markup rules", "single root and closing tags"], evidence: "JSX markup conversion rules를 확인했습니다." },
  { id: "react-jsx-braces", repository: "React official documentation", path: "learn/javascript-in-jsx-with-curly-braces", publicUrl: "https://react.dev/learn/javascript-in-jsx-with-curly-braces", usedFor: ["expression containers", "object props"], evidence: "JSX curly-brace JavaScript expression contract를 확인했습니다." },
  { id: "react-purity", repository: "React official documentation", path: "learn/keeping-components-pure", publicUrl: "https://react.dev/learn/keeping-components-pure", usedFor: ["pure render", "side-effect boundary"], evidence: "component purity와 StrictMode development detection을 확인했습니다." },
  { id: "react-props", repository: "React official documentation", path: "learn/passing-props-to-a-component", publicUrl: "https://react.dev/learn/passing-props-to-a-component", usedFor: ["props snapshot", "destructuring/defaults", "children"], evidence: "props 전달과 read-only input semantics를 확인했습니다." },
  { id: "react-conditional-rendering", repository: "React official documentation", path: "learn/conditional-rendering", publicUrl: "https://react.dev/learn/conditional-rendering", usedFor: ["conditional expressions", "null rendering"], evidence: "JSX conditional value patterns를 확인했습니다." },
  { id: "react-create-root", repository: "React DOM official API", path: "reference/react-dom/client/createRoot", publicUrl: "https://react.dev/reference/react-dom/client/createRoot", usedFor: ["root creation", "render", "unmount"], evidence: "createRoot container ownership, render와 unmount API를 확인했습니다." },
  { id: "react-client-api", repository: "React DOM official API", path: "reference/react-dom/client", publicUrl: "https://react.dev/reference/react-dom/client", usedFor: ["client root API boundary", "hydrate alternative"], evidence: "client React DOM entry API 목록과 역할을 확인했습니다." },
  { id: "react-strict-mode", repository: "React official API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development checks", "double render/effect/ref probes"], evidence: "StrictMode의 development-only behavior와 caveats를 확인했습니다." },
  { id: "vite-guide", repository: "Vite official documentation", path: "guide", publicUrl: "https://vite.dev/guide/", usedFor: ["Vite project creation", "index/module entry", "build workflow"], evidence: "current Vite guide의 React templates와 development/build workflow를 확인했습니다." },
  { id: "npm-package-json", repository: "npm official documentation", path: "configuring-npm/package-json", publicUrl: "https://docs.npmjs.com/cli/v11/configuring-npm/package-json", usedFor: ["manifest and scripts", "dependency declarations"], evidence: "package.json official field contract를 확인했습니다." },
  { id: "mdn-import", repository: "MDN Web Docs", path: "JavaScript/Reference/Statements/import", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import", usedFor: ["static import forms", "live bindings"], evidence: "ECMAScript import declaration forms and module-only scope를 확인했습니다." },
  { id: "mdn-export", repository: "MDN Web Docs", path: "JavaScript/Reference/Statements/export", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export", usedFor: ["default/named exports", "re-export"], evidence: "default/named export forms and module contract를 확인했습니다." },
  { id: "mdn-modules", repository: "MDN Web Docs", path: "JavaScript/Guide/Modules", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules", usedFor: ["module graph", "browser module behavior", "dynamic imports"], evidence: "JavaScript module resolution and graph guidance를 확인했습니다." },
];

const session = createExpertSession({
    inventoryId: "react-01-toolchain-entry",
  slug: "react-01-vite-jsx-component",
  courseId: "react",
  moduleId: "react-rendering-components",
  order: 1,
  title: "Vite·React 진입점과 JSX 컴포넌트",
  subtitle: "CRA 학습 원본을 provenance로 보존하면서 modern toolchain, createRoot, StrictMode, JSX, component purity, props와 module graph를 실행 증거로 연결합니다.",
  level: "입문",
  estimatedMinutes: 120,
  coreQuestion: "빈 HTML root가 어떻게 React component tree가 되며, 첫 JSX 예제를 도구 변화에도 안전하고 재현 가능하게 설명할 수 있을까요?",
  summary: "my-app01의 package.json, index.js, App.js, Book/Library와 기존 REACT 설명 문서를 read-only로 감사해 CRA 기반 학습 history, createRoot·StrictMode, JSX·props·composition의 실제 출발점을 고정합니다. 현재 React/Vite/npm/JavaScript module 공식 문서로 legacy 보존과 신규 선택을 구분하고, project/lock/build 경계, mount ownership, pure function component, runtime props type, one-way composition, case-sensitive ESM graph와 behavior-first CRA→Vite migration까지 독립적으로 다시 볼 수 있게 설명합니다. 다섯 Node examples는 source evidence, release gate, root lifecycle, JSX tree, purity, props와 module graph 중 핵심을 실제 실행하며 browser/React/bundler 증명 범위를 정직하게 분리합니다.",
  objectives: [
    "원본 code에서 관찰한 사실과 current toolchain 권장 사항, 미검증 runtime 가정을 구분한다.",
    "manifest·lockfile·development server·production artifact와 client secret boundary를 설명한다.",
    "HTML mount node에서 createRoot·render·unmount ownership을 추적한다.",
    "StrictMode development probe가 요구하는 render purity와 cleanup을 설명한다.",
    "JSX tag·attribute·children·expression과 Fragment를 element description 관점에서 읽는다.",
    "function component identity와 props runtime contract, 단방향 composition을 설계한다.",
    "ES module import/export graph, filename case와 cycle을 진단한다.",
    "CRA source를 behavior baseline과 reversible gates로 Vite에 migration한다.",
  ],
  prerequisites: [{ title: "Repository 통합 테스트와 Testcontainers", reason: "backend data contract와 reproducible integration environment를 이해하면 React가 소비할 API와 frontend build/runtime test의 책임을 명확히 분리할 수 있습니다.", sessionSlug: "jpa-10-repository-test-testcontainers" }],
  keywords: ["React", "Vite", "CRA", "JSX", "createRoot", "StrictMode", "component", "props", "Fragment", "pure render", "composition", "ES modules", "lockfile", "migration"],
  topics,
  lab: {
    title: "원본 CRA 첫 컴포넌트를 Vite-compatible behavior baseline으로 qualification하기",
    scenario: "원본 파일은 변경하지 않고 sanitized copy와 disposable Vite fixture에서 root·Book/Library UI, props types, StrictMode, module case와 production deployment를 비교합니다.",
    setup: ["Node 20 이상", "frozen package install 가능한 isolated directory", "current supported browser", "원본 my-app01/REACT read-only", "synthetic labels only", "CRA와 Vite production-like static servers"],
    steps: ["원본 7개 source files의 path/hash/관찰 사실을 기록합니다.", "Node/package manager/version/lockfile/scripts/dependency tree를 inventory합니다.", "CRA baseline을 clean install·test·build하고 known failures를 분리합니다.", "served HTML의 unique root와 index createRoot/StrictMode/current App tree를 추적합니다.", "Book/Library를 synthetic values로 render하고 quoted/string과 expression/number props 차이를 test합니다.", "render double-call에서 global mutation·random·time/network가 없는지 purity test합니다.", "default/named imports, filename case와 cycle을 clean case-sensitive build에서 검사합니다.", "Vite fixture에 root, components, CSS/assets, tests, routes와 environment를 작은 단계로 옮깁니다.", "accessibility/visual/network/console/deep-link/build artifact differential suite를 실행합니다.", "immutable old/new artifacts와 production-like rollback/readback을 rehearsal합니다."],
    expectedResult: ["원본 fact와 current recommendation, runtime evidence가 혼동 없이 추적됩니다.", "root lifecycle과 StrictMode에서 duplicate ownership 또는 impure render가 없습니다.", "JSX/props/component behavior가 CRA와 Vite production build에서 동일합니다.", "client artifact에 secret이 없고 routes/assets/environment가 production server에서 작동합니다.", "migration canary와 rollback artifact가 재현 가능합니다."],
    cleanup: ["temporary node_modules, caches, build outputs, preview servers와 browser storage를 제거합니다.", "synthetic fixtures와 temporary environment files를 폐기합니다.", "verbose source maps/logs를 원래 policy로 되돌립니다.", "원본 7개 files의 hash/status가 unchanged인지 확인합니다."],
    extensions: ["TypeScript runtime schema와 component props contract를 추가합니다.", "SSR/hydration framework fixture와 client createRoot를 비교합니다.", "React Testing Library와 browser visual/accessibility tests를 release gate에 연결합니다.", "dependency SBOM, provenance attestation와 signed immutable frontend artifact를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Node examples를 실행하고 실제 React browser evidence와 대응표를 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "model과 React guarantee를 구분합니다.", "source facts와 pending verification을 나눕니다.", "root lifecycle을 설명합니다.", "JSX tree와 DOM 차이를 적습니다.", "props runtime type 반례를 재현합니다."], hints: ["Node object model을 실제 React reconciler라고 부르지 마세요."], expectedOutcome: "첫 component가 toolchain→entry→tree→props로 실행되는 흐름을 증거로 설명합니다.", solutionOutline: ["source→build→root→JSX→component→props→module 순서입니다."] },
    { difficulty: "응용", prompt: "my-app01 Book/Library 학습 화면의 CRA→Vite migration plan을 작성하세요.", requirements: ["clean CRA baseline을 둡니다.", "entry/assets/environment/tests 차이를 inventory합니다.", "props number contract를 교정합니다.", "StrictMode purity를 검증합니다.", "case-sensitive module build를 둡니다.", "deep-link/production static serving을 test합니다.", "secret scan을 포함합니다.", "canary/rollback을 rehearsal합니다."], hints: ["dependency upgrade와 UI refactor를 한 commit에 묶지 마세요."], expectedOutcome: "학습 history를 잃지 않으면서 current toolchain으로 재현 가능한 migration이 완성됩니다.", solutionOutline: ["baseline→matrix→fixture→incremental move→differential tests→cutover/rollback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React project bootstrap·component 표준을 작성하세요.", requirements: ["supported Node/package manager와 frozen install을 정의합니다.", "framework/Vite 선택 기준을 둡니다.", "root/hydration ownership을 정의합니다.", "StrictMode/purity/cleanup을 요구합니다.", "JSX/props/runtime validation conventions를 둡니다.", "module/case/cycle rules를 둡니다.", "client secret prohibition과 artifact checks를 둡니다.", "accessibility/browser/production/rollback gates를 포함합니다."], hints: ["코드 스타일 목록이 아니라 source부터 운영까지의 검증 표준을 만드세요."], expectedOutcome: "첫 commit부터 production readback까지 감사 가능한 frontend bootstrap governance가 완성됩니다.", solutionOutline: ["versions→entry→render contract→component API→graph→quality→artifact→operate 순서입니다."] },
  ],
  nextSessions: ["react-02-jsx-expression-fragment"],
  sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["원본의 실제 학습 문자열과 environment values는 공개 example에 복사하지 않고 synthetic labels와 structural findings만 사용했습니다.", "원본은 CRA 기반이며 Vite build를 실제로 실행한 증거가 아니므로 Vite guidance와 migration lab을 별도 qualification으로 명시했습니다.", "Node examples는 JSX compiler, React renderer, browser DOM/accessibility tree와 production bundler를 대체하지 않으며 actual integration lab이 필요합니다.", "라우팅·state·Effects·data fetching·testing·security·performance는 해당 후속 세션에서 source files와 official docs를 추가 감사합니다."] },
});

export default session;
