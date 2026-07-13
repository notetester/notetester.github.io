import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["css-01-apply-cascade"],
  slug: "css-01-apply-cascade",
  courseId: "web",
  moduleId: "02-css-cascade-layout-responsive",
  order: 1,
  title: "인라인·내부·외부 CSS와 캐스케이드의 판단 순서",
  subtitle: "CSS를 어디에 쓰는지 나열하는 데서 멈추지 않고, 충돌한 declaration이 origin·importance·style attribute·layer·specificity·scope·source order를 거쳐 최종 값이 되는 과정을 추적합니다.",
  level: "기초",
  estimatedMinutes: 170,
  coreQuestion: "같은 element의 같은 property를 여러 style sheet와 inline style이 동시에 선언할 때 browser는 어떤 순서로 승자를 고르고, DevTools와 CSSOM으로 그 근거를 어떻게 확인할까요?",
  summary: "원본의 style attribute typography 예제와 external style01.css→internal style→inline color 충돌을 출발점으로 CSS syntax와 적용 경로를 정리합니다. internal/external은 둘 다 author stylesheet이며 단순히 'inline>internal>external'로 외우면 틀리는 경우를 실제 출력으로 확인합니다. relevance, origin/importance, encapsulation, style attribute, cascade layer, specificity, scope proximity, appearance order와 inheritance/value processing을 단계적으로 다루고, !important 남용·404/MIME/CSP·cache·FOUC·computed style 진단과 design-system layer 전략까지 연결합니다.",
  objectives: [
    "style attribute·style element·link stylesheet의 용도·범위·재사용·성능·보안 tradeoff를 설명할 수 있다.",
    "CSS rule·selector·declaration·property·value·at-rule 용어를 HTML attribute와 구분할 수 있다.",
    "internal과 external rule이 같은 author origin에서 specificity와 source order로 경쟁한다는 점을 증명할 수 있다.",
    "cascade의 주요 판단 단계와 !important·inline style·layer가 순서에 미치는 영향을 설명할 수 있다.",
    "inheritance와 initial/inherit/unset/revert/revert-layer를 구분하고 parent/child computed value를 추적할 수 있다.",
    "DevTools Styles/Computed와 getComputedStyle, Network를 이용해 적용되지 않는 CSS의 실제 원인을 진단할 수 있다.",
  ],
  prerequisites: [
    { title: "접근 가능한 지원서·상품·취미 페이지 종합 제작", reason: "완성된 semantic HTML은 유지한 채 presentation layer를 더하고, CSS 실패에도 content와 task가 보존되는지 확인합니다.", sessionSlug: "html-10-document-capstone" },
  ],
  keywords: ["CSS", "style attribute", "style element", "link stylesheet", "cascade", "origin", "importance", "@layer", "specificity", "source order", "inheritance", "computed style", "CSSOM"],
  chapters: [
    {
      id: "css-rule-language",
      title: "CSS는 selector가 고른 element에 property:value declaration을 적용하는 규칙 언어입니다",
      lead: "HTML attribute와 CSS property를 같은 '속성'으로 뭉뚱그리지 않고 syntax와 책임을 분리합니다.",
      explanations: [
        "원본 첫 file은 h1의 style attribute에 background-color:red, color:white, text-align:center를 선언합니다. HTML에서 style은 global attribute이고 그 attribute value 안에 CSS declaration list가 들어갑니다. id·lang·href 같은 HTML attribute와 color·font-size 같은 CSS property는 서로 다른 vocabulary입니다.",
        "일반 style rule은 selector 뒤 중괄호 declaration block을 가집니다. h2, h3 { color: lightblue; }에서 h2,h3는 selector list이고 color:lightblue는 declaration입니다. colon은 property와 value, semicolon은 declaration을 구분합니다. 마지막 semicolon은 선택적으로 생략될 수 있어도 diff와 추가 실수를 줄이기 위해 일관되게 씁니다.",
        "browser는 알 수 없는 property나 invalid value declaration을 무시하고 나머지 rule을 계속 처리할 수 있습니다. 중괄호·comment·token 오류는 뒤 rule까지 영향을 줄 수 있으므로 DevTools와 validator/linter로 실제 parsed CSSOM을 확인합니다.",
        "@charset, @import, @media, @supports, @layer 같은 at-rule은 stylesheet의 encoding·import·조건·구조를 제어합니다. 원본 style01.css의 @charset 'utf-8'은 external sheet encoding 선언이지만 modern HTTP/file UTF-8 policy와 response Content-Type을 함께 맞춥니다.",
        "CSS는 semantic HTML을 바꾸지 않습니다. h2에 font-size:3rem을 줘도 h1이 되지 않고 div에 color·font-weight를 줘도 heading role이 생기지 않습니다. structure와 presentation을 분리해 각각 검증합니다.",
      ],
      concepts: [
        { term: "style rule", definition: "selector list와 declaration block을 결합해 matching element에 CSS declaration을 제공하는 규칙입니다.", detail: ["selector가 match하지 않으면 declaration 후보가 되지 않습니다.", "조건부 at-rule 안에 존재할 수 있습니다."] },
        { term: "declaration", definition: "property name과 value, 선택적인 !important annotation으로 구성된 한 style 주장입니다.", detail: ["같은 property의 여러 declaration이 cascade에서 경쟁합니다.", "invalid declaration은 적용 후보에서 탈락합니다."] },
        { term: "CSS property", definition: "color·display·margin처럼 rendering의 한 측면을 제어하는 표준 이름입니다.", detail: ["HTML attribute와 namespace가 다릅니다.", "각 property마다 initial value·inheritance·value grammar가 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "한 declaration 뒤의 style만 모두 사라지거나 DevTools에 property가 보이지 않는다.", likelyCause: "semicolon·colon·brace·comment가 깨져 parser가 declaration/rule을 무시했습니다.", checks: ["DevTools Styles에서 rule이 parsed됐는지 확인합니다.", "CSS file response와 source를 비교합니다.", "stylelint/validator가 가리키는 첫 syntax error부터 고칩니다."], fix: "올바른 selector { property: value; } 구조로 수정하고 작은 rule 단위로 다시 load합니다.", prevention: "formatter·linter·editor syntax highlighting과 build parse check를 사용합니다." },
      ],
    },
    {
      id: "three-authoring-locations",
      title: "inline·internal·external은 작성 위치와 운영 범위가 다르지만 단순 고정 우선순위 세 단계는 아닙니다",
      lead: "style attribute는 특정 element, style element는 document, linked stylesheet는 여러 document에 재사용되며 모두 author style 영역에 참여합니다.",
      explanations: [
        "inline style은 element의 style attribute에 declaration을 직접 둡니다. 빠른 실험·email HTML·JavaScript가 계산한 one-off 좌표에는 쓰일 수 있지만 반복·theme·media query·pseudo-class 관리가 어렵고 markup에 presentation이 흩어집니다. CSP가 inline style을 제한할 수도 있습니다.",
        "internal stylesheet는 head의 style element에 rule을 둡니다. 한 document에만 필요한 critical/demo style, component preview에 편리하지만 여러 page에서 복제되면 cache와 유지보수가 나빠집니다. style element도 parser 시점에 potentially render-blocking일 수 있습니다.",
        "external stylesheet는 link rel='stylesheet' href='...'로 별도 CSS resource를 가져옵니다. page 간 재사용·browser cache·독립 build에 유리하지만 URL·HTTP status·Content-Type·CORS/redirect·cache invalidation을 관리해야 합니다. CSS가 늦게 오면 unstyled content가 보이거나 rendering이 지연될 수 있습니다.",
        "internal과 external rule은 둘 다 보통 normal author declaration입니다. selector specificity가 같으면 HTML에서 style sheet가 합쳐지는 appearance order상 나중 rule이 이깁니다. link 뒤 style이면 internal이, style 뒤 link면 external이 이길 수 있습니다. external이라는 이유로 항상 약하지 않습니다.",
        "style attribute normal declaration은 같은 origin/importance에서 stylesheet selector rule보다 별도 높은 우선 단계를 가집니다. 그러나 author !important rule, user important style, transition 등 다른 cascade 단계와 경쟁하면 'inline이 무조건 최고'라는 말도 정확하지 않습니다.",
      ],
      concepts: [
        { term: "inline style", definition: "HTML element의 style attribute에 직접 연결한 CSS declaration list입니다.", detail: ["selector가 없습니다.", "normal stylesheet rule보다 강하지만 모든 cascade origin/importance를 이기는 것은 아닙니다."] },
        { term: "internal stylesheet", definition: "현재 document의 style element에 포함한 stylesheet입니다.", detail: ["일반 selector와 at-rule을 사용할 수 있습니다.", "document 범위에 묶입니다."] },
        { term: "external stylesheet", definition: "link로 별도 URL에서 가져와 document에 적용하는 CSS resource입니다.", detail: ["공유·cache·build 분리에 유리합니다.", "network와 MIME/cache failure를 진단해야 합니다."] },
      ],
      codeExamples: [
        {
          id: "authoring-location-collision",
          title: "external→internal→inline 충돌의 실제 computed color",
          language: "html",
          filename: "cascade-locations.html",
          purpose: "원본과 같은 세 적용 위치를 한 page에서 충돌시키고 rule 순서와 inline 제거에 따른 승자를 관찰합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>CSS 적용 위치</title>\n  <!-- base.css 내용: .message { color: olive; } -->\n  <link rel=\"stylesheet\" href=\"base.css\">\n  <style>\n    .message { color: lightblue; }\n  </style>\n</head>\n<body>\n  <h1>CSS 적용 위치</h1>\n  <p id=\"plain\" class=\"message\">외부와 내부 규칙 경쟁</p>\n  <p id=\"inline\" class=\"message\" style=\"color: tomato\">inline까지 경쟁</p>\n  <pre id=\"result\"></pre>\n  <script>\n    const color = (id) => getComputedStyle(document.querySelector(id)).color;\n    document.querySelector('#result').textContent = [\n      `plain=${color('#plain')}`,\n      `inline=${color('#inline')}`\n    ].join('\\n');\n  </script>\n</body>\n</html>",
          walkthrough: [
            { lines: "6-10", explanation: "external base.css가 먼저, 같은 specificity의 internal .message가 나중에 나타나므로 plain element에서는 internal rule이 승리합니다." },
            { lines: "14-15", explanation: "둘 다 class가 match하지만 두 번째 p에는 normal inline color가 있어 stylesheet의 normal author rule보다 앞섭니다." },
            { lines: "17-22", explanation: "getComputedStyle가 현재 resolved color를 rgb serialization으로 출력합니다. 선언 text 이름과 출력 표현은 다를 수 있습니다." },
          ],
          run: { environment: ["현대 browser", "같은 directory의 base.css에 .message { color: olive; } 저장"], command: "browser에서 cascade-locations.html을 열고 결과 확인" },
          output: { value: "plain=rgb(173, 216, 230)\ninline=rgb(255, 99, 71)", explanation: ["lightblue는 rgb(173,216,230), tomato는 rgb(255,99,71)로 resolved serialization됩니다.", "external olive는 selector specificity가 같고 먼저 등장해 plain에서 internal rule에 졌습니다.", "computed output만 보지 말고 DevTools Styles에서 어떤 rule이 crossed out인지 함께 확인합니다."] },
          experiments: [
            { change: "link를 style element 뒤로 이동합니다.", prediction: "plain은 olive(rgb(128,128,0))가 됩니다.", result: "internal/external의 위치 label보다 같은 origin·specificity에서 최종 appearance order가 중요합니다." },
            { change: "inline p의 style attribute를 제거합니다.", prediction: "inline p도 lightblue가 됩니다.", result: "style attribute 후보가 사라져 internal/external rule만 다시 경쟁합니다." },
            { change: "base.css의 rule을 .message { color: olive !important; }로 바꿉니다.", prediction: "두 p 모두 olive가 됩니다. normal inline tomato도 author important rule을 이기지 못합니다.", result: "importance 단계가 normal style attribute보다 먼저 비교됩니다." },
          ],
          sourceRefs: ["web-css-combined-source", "web-css-external-source", "css-cascade-6", "cssom"],
        },
      ],
      diagnostics: [
        { symptom: "external CSS를 수정했는데 page에는 이전 color가 계속 보인다.", likelyCause: "browser/CDN/service worker cache 또는 다른 URL/build artifact를 보고 있습니다.", checks: ["Network에서 stylesheet request URL·status·from cache·response body를 확인합니다.", "Disable cache 후 reload합니다.", "link href와 build output hash를 비교합니다.", "DevTools Sources/Styles rule source를 엽니다."], fix: "content-hashed filename 또는 versioned URL과 올바른 cache policy를 사용하고 service worker/CDN invalidation을 수행합니다.", prevention: "immutable hashed asset+HTML no-cache/revalidation 전략과 deploy smoke test를 둡니다." },
      ],
      comparisons: [
        { title: "style 작성 위치 선택", options: [
          { name: "style attribute", chooseWhen: "계산된 one-off style 또는 제한된 email/template 환경에서 특정 element에 직접 값이 필요할 때", avoidWhen: "반복 component·theme·state·responsive rule을 관리할 때", tradeoffs: ["가까이 있어 즉시 보입니다.", "재사용·override·CSP·유지보수가 어렵습니다."] },
          { name: "style element", chooseWhen: "독립 demo·single document critical style처럼 범위가 명확할 때", avoidWhen: "여러 route/page에서 같은 rule을 공유할 때", tradeoffs: ["추가 resource 없이 전체 selector를 사용합니다.", "HTML 중복과 cache 분리가 어렵습니다."] },
          { name: "linked stylesheet", chooseWhen: "site/component style을 여러 page에서 공유하고 build/cache할 때", avoidWhen: "external request가 허용되지 않는 특수 standalone artifact일 때", tradeoffs: ["관심사·cache·tooling 분리에 유리합니다.", "network·MIME·cache·loading order를 운영해야 합니다."] },
        ] },
      ],
    },
    {
      id: "cascade-sorting-model",
      title: "캐스케이드는 관련 후보를 origin/importance부터 source order까지 단계적으로 정렬합니다",
      lead: "한 숫자 우선순위나 selector 점수만 보지 않고 앞 단계가 다르면 뒤 단계는 비교조차 하지 않는 lexicographic model로 이해합니다.",
      explanations: [
        "첫 단계는 rule이 현재 element/property/media/support 조건에 관련되는지입니다. selector가 match하지 않거나 @media 조건이 false, declaration value가 invalid이면 cascade 후보가 아닙니다. '우선순위가 낮아서'가 아니라 applicability 문제일 수 있습니다.",
        "그다음 origin과 importance가 user-agent·user·author style, normal/important, animation/transition을 구분합니다. 일반적인 normal author는 normal user/UA보다 앞서지만 user important는 author important보다 앞서 사용자가 accessibility 필요로 page를 override할 수 있게 합니다. transition declaration은 정렬상 매우 높은 단계가 될 수 있습니다.",
        "encapsulation context와 style attribute 단계 뒤 author origin 내부에서는 cascade layer가 비교됩니다. normal declaration은 뒤 layer가 앞 layer를 이기고 explicit layer 밖 unlayered normal style이 layer normal보다 뒤 implicit layer에 있어 강합니다. important에서는 layer order가 반대로 작동해 앞 layer의 중요한 guard가 보호됩니다.",
        "같은 origin/importance/context/style-attribute/layer 안에서 selector specificity를 비교하고, @scope가 사용되면 scope root까지 proximity, 마지막으로 appearance order를 비교합니다. selector specificity만 크게 만드는 것은 전체 model 중 한 단계만 조작하는 것입니다.",
        "source order는 CSS file 한 개의 line만 뜻하지 않습니다. imported stylesheet는 import 위치에 삽입된 것처럼, 여러 linked sheet는 document linking order에 따라, style attribute는 document order 규칙으로 정렬됩니다. bundler가 file 결합 순서를 바꾸면 equal rule 승자가 바뀔 수 있습니다.",
      ],
      concepts: [
        { term: "cascade origin", definition: "declaration이 browser 기본(UA), 사용자 설정, page author 등 어디에서 왔는지 나타내는 분류입니다.", detail: ["importance와 함께 우선순위를 결정합니다.", "사용자 accessibility override를 보존합니다."] },
        { term: "importance", definition: "normal declaration인지 !important annotation이 붙은 declaration인지 구분하는 cascade 축입니다.", detail: ["origin·layer 순서와 상호작용합니다.", "강한 selector와 다른 단계입니다."] },
        { term: "lexicographic comparison", definition: "앞 기준에서 차이가 나면 승자가 결정되고 같을 때만 다음 기준을 비교하는 방식입니다.", detail: ["origin 차이를 specificity로 뒤집을 수 없습니다.", "최종 source order는 앞 기준이 모두 같을 때만 작동합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "id selector를 여러 개 붙여도 짧은 rule을 이기지 못한다.", likelyCause: "상대 rule이 더 높은 origin/importance 또는 layer 단계에 있어 specificity 비교까지 가지 않습니다.", checks: ["DevTools에서 !important와 layer/origin을 확인합니다.", "animation/transition 중인지 봅니다.", "crossed-out rule의 cascade reason을 확인합니다."], fix: "전체 cascade 단계를 확인하고 layer/order/importance architecture를 바로잡으며 selector escalation을 제거합니다.", prevention: "layer contract와 !important 사용 정책을 정하고 specificity budget/lint를 둡니다." },
      ],
    },
    {
      id: "cascade-layers-and-important",
      title: "@layer는 selector를 더 세게 만들지 않고 style category의 override 순서를 명시합니다",
      lead: "reset·third-party·base·components·utilities 같은 style group의 정상 우선순위를 한 곳에서 선언해 specificity 전쟁을 줄입니다.",
      explanations: [
        "@layer reset, base, components, utilities;처럼 layer order를 stylesheet 초기에 선언할 수 있습니다. normal rule은 나중 layer가 이기므로 utilities가 component default를 의도적으로 override할 수 있습니다. 각 layer 안에서는 specificity와 order가 계속 적용됩니다.",
        "explicit layer에 속하지 않은 normal author rule은 implicit outer/final layer에 놓여 named layer normal rule보다 강합니다. legacy unlayered CSS를 layer로 감싸지 않고 새 design system만 layer에 넣으면 legacy가 계속 이길 수 있습니다. migration 순서를 설계합니다.",
        "!important는 layer 순서를 반대로 합니다. 앞 layer의 important가 뒤 layer important보다 강해 reset/guard를 보호할 수 있습니다. 이 반전은 third-party override 전략에서 혼동하기 쉬우므로 실제 matrix test를 둡니다.",
        "!important를 매번 쓰면 사용자 override·state·theme·maintenance를 어렵게 하고 또 다른 !important 경쟁을 부릅니다. accessibility에 필요한 user important를 막지 않으며, author important는 invariant/utility 예외처럼 매우 좁은 정책으로 제한합니다.",
        "layer는 runtime isolation이나 security boundary가 아닙니다. selector matching 범위는 그대로이며 Shadow DOM·@scope·CSS Modules와 책임이 다릅니다. layer name과 import/bundle order를 build output에서 검증합니다.",
      ],
      concepts: [
        { term: "cascade layer", definition: "한 origin 안의 declaration을 명시적으로 순서화하는 @layer grouping입니다.", detail: ["normal은 뒤 layer가 강합니다.", "important는 앞 layer가 강합니다."] },
        { term: "specificity escalation", definition: "override하려고 selector에 id·class·nesting을 계속 추가해 유지보수 비용이 증가하는 현상입니다.", detail: ["layer/order architecture로 줄일 수 있습니다.", "다음 selector 세션에서 계산을 깊게 다룹니다."] },
      ],
      codeExamples: [
        {
          id: "layer-order-proof",
          title: "낮은 specificity utility가 layer 순서로 component를 override하는 예",
          language: "html",
          filename: "cascade-layers.html",
          purpose: "selector를 과도하게 강화하지 않고 named layer와 unlayered rule의 normal/important 순서를 실제 computed output으로 확인합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>캐스케이드 레이어</title>\n  <style>\n    @layer reset, base, components, utilities;\n\n    @layer components {\n      #demo.card { color: darkgreen; background: honeydew; }\n    }\n    @layer utilities {\n      .text-alert { color: firebrick; }\n    }\n    @layer base {\n      .card { border: 3px solid navy !important; }\n    }\n    @layer utilities {\n      .card { border-color: orange !important; }\n    }\n    .card { background: lavender; }\n  </style>\n</head>\n<body>\n  <p id=\"demo\" class=\"card text-alert\">레이어 결과</p>\n  <pre id=\"result\"></pre>\n  <script>\n    const style = getComputedStyle(document.querySelector('#demo'));\n    document.querySelector('#result').textContent = [\n      `color=${style.color}`,\n      `background=${style.backgroundColor}`,\n      `border=${style.borderTopColor}`\n    ].join('\\n');\n  </script>\n</body>\n</html>",
          walkthrough: [
            { lines: "7", explanation: "normal layer 우선순위를 reset<base<components<utilities 순으로 선언합니다." },
            { lines: "9-14", explanation: "components의 매우 높은 #demo.card specificity보다 뒤 utilities의 짧은 .text-alert가 layer 단계에서 먼저 이겨 color는 firebrick입니다." },
            { lines: "15-20", explanation: "important layer order는 반대라 base navy가 utilities orange보다 강합니다." },
            { lines: "21", explanation: "unlayered normal background lavender가 named components의 honeydew보다 강합니다." },
            { lines: "27-33", explanation: "세 property resolved color를 한 번에 출력해 각 cascade 축의 결과를 분리합니다." },
          ],
          run: { environment: ["@layer를 지원하는 현대 browser", "DevTools Styles/Layers view가 있으면 함께 사용"], command: "browser에서 cascade-layers.html을 열고 결과 확인" },
          output: { value: "color=rgb(178, 34, 34)\nbackground=rgb(230, 230, 250)\nborder=rgb(0, 0, 128)", explanation: ["firebrick, lavender, navy가 각각 rgb로 serialization됩니다.", "color는 specificity보다 layer order가 앞 단계임을 증명합니다.", "border important는 normal layer와 반대 순서임을 보여 줍니다."] },
          experiments: [
            { change: "unlayered .card background rule을 @layer base 안으로 옮깁니다.", prediction: "components가 base보다 뒤이므로 background는 honeydew가 됩니다.", result: "unlayered normal rule의 implicit 강함을 migration에서 고려해야 합니다." },
            { change: "두 border declaration의 !important를 제거합니다.", prediction: "normal layer order상 utilities orange가 이깁니다.", result: "important는 layer ordering 방향을 반전합니다." },
            { change: "@layer 선언 순서를 utilities, components, base, reset으로 바꿉니다.", prediction: "normal/important 결과가 새 layer order에 맞게 바뀝니다.", result: "layer order declaration은 design-system public contract입니다." },
          ],
          sourceRefs: ["css-cascade-6", "css-cascade-5"],
        },
      ],
      diagnostics: [
        { symptom: "새 @layer components의 rule이 legacy CSS보다 계속 약하다.", likelyCause: "legacy rule이 unlayered normal author style이라 named layer보다 뒤 implicit layer에서 승리합니다.", checks: ["DevTools에서 winning rule이 layered/unlayered인지 확인합니다.", "bundle의 @layer order 선언 위치를 봅니다.", "third-party/legacy import가 layer에 감싸졌는지 확인합니다."], fix: "legacy 또는 third-party style을 의도한 낮은 layer로 import/감싸고 unlayered overrides를 단계적으로 제거합니다.", prevention: "모든 author CSS의 layer ownership을 정하고 unlayered rule을 lint/CI report합니다." },
      ],
    },
    {
      id: "inheritance-and-defaults",
      title: "캐스케이드가 element의 specified value를 정한 뒤 inheritance와 defaulting이 빈 값을 채웁니다",
      lead: "parent의 모든 style이 child로 복사되는 것이 아니며 property마다 inherited 여부와 initial value가 다릅니다.",
      explanations: [
        "color·font-family 같은 많은 text-related property는 child에 직접 cascade value가 없으면 parent computed value를 inherit합니다. margin·border·background 같은 layout/box property는 기본적으로 inherit하지 않습니다. 그래서 body color는 paragraph에 전달되지만 body border는 모든 descendant에 복제되지 않습니다.",
        "inherit keyword는 원래 non-inherited property도 parent computed value를 받게 하고 initial은 specification의 initial value를 사용합니다. unset은 inherited property에서는 inherit처럼, non-inherited에서는 initial처럼 동작합니다.",
        "revert는 현재 origin에서의 변경을 되돌려 이전 origin/cascade 수준 결과로 돌아가고 revert-layer는 현재 layer의 변경을 되돌려 앞 layer/같은 origin cascade 결과를 드러냅니다. 단순히 browser default라는 한 문장으로 설명하면 theme/user style과 layer에서 틀릴 수 있습니다.",
        "all property는 거의 모든 property에 defaulting keyword를 한 번에 적용하지만 direction·unicode-bidi 같은 예외가 있고 component에 무심코 사용하면 accessibility/user preference까지 지울 수 있습니다. reset은 필요한 범위와 property를 명시합니다.",
        "custom property는 기본적으로 inherit하며 var() substitution 시점과 invalid-at-computed-value behavior가 일반 property와 다릅니다. typography/theme token에 유용하지만 다음 심화 CSS 세션에서 별도로 다룹니다.",
      ],
      concepts: [
        { term: "inheritance", definition: "element에 직접 지정된 cascaded value가 없을 때 일부 property가 parent의 computed value를 받는 과정입니다.", detail: ["property마다 inherited 여부가 다릅니다.", "selector matching이나 DOM value 복사와 다릅니다."] },
        { term: "initial value", definition: "각 CSS property specification이 정의한 기본값입니다.", detail: ["browser stylesheet의 실제 default rule과 같지 않을 수 있습니다.", "initial keyword가 사용합니다."] },
        { term: "revert-layer", definition: "현재 cascade layer의 declaration 효과를 되돌려 이전 layer에서 정해질 값을 사용하게 하는 keyword입니다.", detail: ["layer architecture와 함께 씁니다.", "inherit/initial과 다른 cascade rollback입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "parent에 background와 margin을 줬는데 child가 같은 배경처럼 보이거나 margin을 상속했다고 오해한다.", likelyCause: "transparent child background를 통해 parent 배경이 보이는 현상과 실제 inheritance를 구분하지 않았습니다.", checks: ["DevTools Computed에서 child background-color와 margin source를 확인합니다.", "child에 다른 background를 일시 적용합니다.", "property definition의 inherited 여부를 확인합니다."], fix: "computed value와 paint 결과를 분리해 설명하고 필요한 child property만 명시적으로 선언합니다.", prevention: "style 설명에서 cascade/inheritance/layout/painting 단계를 구분합니다." },
      ],
    },
    {
      id: "value-processing-pipeline",
      title: "선언된 text가 그대로 pixel이 되지 않고 cascaded→specified→computed→used→actual value 단계를 거칩니다",
      lead: "DevTools의 선언·computed 숫자·실제 geometry가 다른 이유를 value processing pipeline으로 해석합니다.",
      explanations: [
        "declared value는 matching rule이 제공한 모든 후보, cascaded value는 cascade 승자, specified value는 cascade/상속/defaulting이 채운 값입니다. computed value는 relative value를 가능한 범위에서 resolve해 inheritance에 쓰이는 값이 됩니다.",
        "used value는 layout이 containing block·font metric·viewport·intrinsic size를 고려해 실제 계산한 값이고 actual value는 device pixel·지원 한계 등 rendering 제약을 반영합니다. width:50%의 computed/resolved serialization과 getBoundingClientRect pixel 값은 역할이 다릅니다.",
        "getComputedStyle는 이름과 달리 CSSOM이 정의한 resolved value를 반환해 property에 따라 computed 또는 used value에 가까울 수 있습니다. shorthand가 분해되고 named color가 rgb로 serialization되며 pseudo-element style도 두 번째 argument로 조회할 수 있습니다.",
        "CSS custom property와 var(), calc(), em/rem/%/viewport unit, auto는 언제 resolve되는지가 다릅니다. 값이 예상과 다를 때 declaration text 하나만 보지 말고 containing block·inherited font-size·layout mode·box sizing까지 추적합니다.",
      ],
      concepts: [
        { term: "computed value", definition: "cascade/defaulting 뒤 relative 값을 specification 규칙에 따라 계산해 inheritance에 사용할 수 있게 만든 property value 단계입니다.", detail: ["최종 pixel geometry와 다를 수 있습니다.", "property마다 계산 규칙이 다릅니다."] },
        { term: "used value", definition: "layout에 필요한 실제 조건을 적용해 계산한 값입니다.", detail: ["percentage width는 containing block이 필요합니다.", "geometry API와 관계가 깊습니다."] },
        { term: "resolved value", definition: "getComputedStyle가 CSSOM 규칙에 따라 반환하는 value이며 property에 따라 computed 또는 used 값에 대응합니다.", detail: ["named color가 rgb로 serialize될 수 있습니다.", "API 이름만 보고 단계가 항상 동일하다고 가정하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "CSS에는 color:tomato라고 썼는데 test는 rgb(255, 99, 71)를 받아 실패한다.", likelyCause: "author-specified token과 CSSOM resolved serialization을 같은 문자열로 비교했습니다.", checks: ["getComputedStyle 결과인지 stylesheet text인지 구분합니다.", "browser가 canonical serialization한 형식을 확인합니다.", "semantic color token/visual output 중 무엇을 test할지 정합니다."], fix: "computed test는 canonical rgb/normalized value 또는 실제 visual invariant를 비교하고 source token test는 parsed stylesheet/design token을 별도로 검사합니다.", prevention: "declared token과 resolved value assertions를 목적별로 분리합니다." },
      ],
    },
    {
      id: "css-loading-security-performance",
      title: "외부 CSS는 cascade 후보가 되기 전에 network·MIME·CSP·cache·loading 조건을 통과해야 합니다",
      lead: "rule 우선순위를 고치기 전에 stylesheet가 실제로 fetch·parse·attach되었는지 확인합니다.",
      explanations: [
        "link href가 틀리면 404 HTML error page를 CSS로 가져오고 strict MIME checking 때문에 무시될 수 있습니다. Network에서 status 200만 보지 말고 final URL, Content-Type text/css, response body, redirect, CSP console error를 확인합니다.",
        "linked stylesheet는 media가 현재 environment에 match하고 potentially render-blocking이면 first render를 막을 수 있습니다. critical CSS를 무조건 inline하면 HTML 중복/CSP/cache 손실이 생기고 지나친 split은 request/ordering overhead를 만듭니다. 실제 Core Web Vitals와 cache를 측정합니다.",
        "@import는 CSS 안에서 추가 resource dependency와 ordering을 만듭니다. modern build에서는 HTML link 또는 bundler dependency graph가 preload/discovery에 더 유리할 수 있습니다. import를 layer와 함께 사용할 때 syntax/order 제한을 확인합니다.",
        "CSP style-src는 inline style/style element와 external origin을 제한할 수 있습니다. unsafe-inline을 쉽게 허용하기보다 nonce/hash 또는 external hashed sheet 전략을 threat model에 맞게 사용합니다. CSS도 visited history leak·url request·data exfiltration 표면이 될 수 있어 untrusted CSS를 실행 가능한 style로 받아들이지 않습니다.",
        "cache-busting query를 매 deploy 임의로 붙이는 대신 content hash와 immutable cache를 사용하고 HTML이 새 hash를 참조하게 합니다. rollback 시 asset을 유지하고 deploy atomicity를 보장합니다.",
      ],
      concepts: [
        { term: "render-blocking stylesheet", definition: "현재 media에 적용되며 browser가 정확한 first render를 위해 load/parse를 기다릴 수 있는 stylesheet resource입니다.", detail: ["critical rendering path에 참여합니다.", "조건과 browser behavior를 측정합니다."] },
        { term: "CSP style-src", definition: "어떤 origin·nonce·hash의 style을 document가 적용할 수 있는지 제한하는 Content Security Policy directive입니다.", detail: ["inline style architecture에 영향을 줍니다.", "보안 정책을 우회하려 unsafe-inline을 무심코 추가하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "link tag와 CSS file이 있는데 page가 완전히 unstyled이고 Styles panel에 external rule이 없다.", likelyCause: "404/redirect HTML, 잘못된 MIME, CSP, invalid href/base URL, media mismatch로 sheet가 attach되지 않았습니다.", checks: ["Network request URL·status·Content-Type·body를 확인합니다.", "Console의 MIME/CSP 오류를 봅니다.", "document.styleSheets와 sheet.disabled/media를 확인합니다.", "base element와 relative URL resolution을 확인합니다."], fix: "올바른 public CSS URL과 text/css response, CSP allowlist/nonce, matching media를 구성합니다.", prevention: "deploy smoke test에서 CSS URL 200+MIME, key computed style, CSP violation 0을 단언합니다." },
        { symptom: "첫 화면은 잠깐 unstyled였다가 뒤늦게 layout이 크게 바뀐다.", likelyCause: "stylesheet가 늦게 발견되거나 async injection/non-matching preload·cache miss로 critical style 적용이 지연됐습니다.", checks: ["Performance/Network waterfall에서 discovery·download·apply 시점을 봅니다.", "stylesheet link가 head에 있는지 확인합니다.", "layout shift entry와 web font/image를 분리합니다."], fix: "critical stylesheet를 head에서 조기 발견시키고 bundle/size/cache를 최적화하며 noncritical style만 의도적으로 지연합니다.", prevention: "slow-network visual test와 CLS/LCP budget을 CI/monitoring에 둡니다." },
      ],
    },
    {
      id: "devtools-cascade-debugging",
      title: "적용되지 않는 CSS는 match→validity→cascade→inheritance→layout→paint 순서로 좁힙니다",
      lead: "무작정 !important를 추가하지 않고 DevTools가 보여 주는 crossed-out rule과 winning source를 증거로 원인을 분리합니다.",
      explanations: [
        "Elements에서 실제 target과 class/state를 확인하고 Styles에서 selector match 여부를 봅니다. rule 자체가 없으면 loading/selector 문제, property가 취소선이면 cascade 패배, 경고 icon이면 invalid value, 보이지만 효과가 없으면 layout/paint context를 조사합니다.",
        "Computed panel에서 property를 검색해 최종 resolved value와 펼친 source chain을 확인합니다. inherited from parent group과 user-agent rule을 구분하고 pseudo-element라면 ::before/::after node 또는 getComputedStyle(element,'::before')를 봅니다.",
        "element.style은 inline declaration API이고 classList 변경과 다릅니다. JavaScript가 runtime에 style property를 쓰는지 Mutation observer, event listener breakpoint, React style prop/state를 추적합니다. reload 후 다시 생기면 source를 고칩니다.",
        "disable rule checkbox와 temporary value edit로 가설을 검증하되 DevTools 수정은 source file에 자동 저장되지 않을 수 있습니다. 변경 근거를 source에 반영하고 reload/build/test로 확인합니다.",
        "최소 reproduction에는 HTML, 관련 CSS 순서/layer, browser/viewport, expected/actual computed value를 포함합니다. 전체 application에서 selector를 더 세게 만드는 대신 경쟁 후보만 남겨 cascade 단계별로 비교합니다.",
      ],
      concepts: [
        { term: "matched rule", definition: "현재 element와 조건에 selector가 일치해 declaration 후보를 제공하는 CSS rule입니다.", detail: ["match와 win은 다릅니다.", "pseudo-class/state와 shadow boundary를 확인합니다."] },
        { term: "crossed-out declaration", definition: "DevTools에서 match했지만 cascade 또는 shorthand/longhand 충돌 등으로 최종 값이 되지 못한 declaration 표시입니다.", detail: ["winning source를 함께 봅니다.", "무조건 specificity 문제는 아닙니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "CSS가 안 된다는 이유로 !important를 붙였더니 한 화면은 고쳐졌지만 hover·theme·user style이 깨졌다.", likelyCause: "selector/state/loading/layer 원인을 확인하지 않고 importance 단계를 올렸습니다.", checks: ["원래 declaration이 match/valid했는지 봅니다.", "winning rule의 origin/layer/specificity/order를 기록합니다.", "hover/focus/dark/user important에서 회귀를 test합니다."], fix: "!important를 제거하고 layer/order/component ownership 또는 정확한 selector/state를 수정합니다.", prevention: "author !important를 lint 제한하고 예외마다 이유·owner·removal plan을 요구합니다." },
      ],
      expertNotes: [
        "CSS-in-JS library는 runtime insertion order와 style tag 재hydration이 source order를 바꿀 수 있습니다. SSR/client에서 동일 order와 layer name을 보장하고 hydration test를 둡니다.",
        "Shadow DOM은 encapsulation context라는 별도 cascade 축을 추가합니다. normal/important가 inner/outer context에서 반대 보호 목적을 가지므로 ::part·custom properties API를 명시적으로 설계합니다.",
      ],
    },
  ],
  lab: {
    title: "원본 세 적용 방식을 production style architecture와 cascade 증거표로 재구성하기",
    scenario: "한 page에 external olive, internal lightblue, inline tomato, legacy !important, 새 @layer rule이 섞여 수정할 때마다 다른 element가 깨집니다. 선언을 지우지 않고 먼저 승자와 이유를 완전히 추적한 뒤 architecture를 정리합니다.",
    setup: ["원본 HTML 2개와 CSS 1개를 read-only evidence로 준비합니다.", "현대 browser DevTools Styles·Computed·Network와 @layer 지원 환경을 준비합니다.", "각 target element/property별 후보·origin·importance·layer·specificity·order를 기록할 표를 만듭니다."],
    steps: [
      "세 source에서 모든 color/font/text declaration과 selector/apply 위치를 inventory합니다.",
      "external→internal→inline 순서 page를 재현하고 각 element의 computed color를 rgb로 기록합니다.",
      "link/style 순서를 뒤집고 inline 제거, !important 추가 실험의 predicted/actual 결과를 비교합니다.",
      "reset/base/components/utilities layer order를 선언하고 legacy/third-party/existing rule의 layer ownership을 정합니다.",
      "normal과 important layer matrix를 실행해 예상과 실제가 일치하는지 확인합니다.",
      "inline repetition을 class/token으로 옮기고 semantic HTML과 CSS-off 결과가 변하지 않는지 봅니다.",
      "Network/MIME/CSP/cache failure를 한 번씩 재현해 cascade 문제와 loading 문제를 구분합니다.",
      "lint·computed style assertions·slow-network visual test와 architecture decision을 문서화합니다.",
    ],
    expectedResult: ["각 property 승자를 cascade 단계와 source URL/line으로 설명할 수 있습니다.", "internal/external을 고정 priority로 오해하지 않고 link order 실험 결과가 일치합니다.", "layer를 사용해 selector specificity 증가 없이 의도한 override가 됩니다.", "author !important가 정책상 필요한 최소 예외 외에는 제거됩니다.", "external CSS 200/text-css/cache/CSP와 key computed style smoke test가 통과합니다.", "CSS를 제거해도 HTML content·heading·form/link behavior는 유지됩니다."],
    cleanup: ["실험용 inline !important와 broken href/MIME/CSP 설정을 원복합니다.", "DevTools local override와 cache disable을 해제하고 clean reload 결과를 다시 기록합니다."],
    extensions: ["third-party CSS를 낮은 vendor layer에 import하고 upgrade diff를 test합니다.", "dark/high-contrast theme token을 custom property와 user preference로 연결합니다.", "SSR/CSS-in-JS insertion order가 server/client에서 같은지 hydration regression test를 작성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "같은 p의 color를 external olive, internal blue, inline tomato로 선언하고 승자를 예측·검증하세요.", requirements: ["external CSS와 link, head style, style attribute를 모두 사용합니다.", "link/style 순서를 두 번 바꿉니다.", "getComputedStyle rgb와 DevTools winning source를 기록합니다.", "inline 제거 뒤 결과를 설명합니다."], hints: ["internal과 external은 같은 normal author origin입니다.", "같은 specificity이면 appearance order를 봅니다."], expectedOutcome: "세 위치 조합별 computed color를 정확히 예측하고 단순 3단 priority 암기와 실제 cascade 차이를 설명합니다.", solutionOutline: ["후보 표를 만든 뒤 style attribute 여부→specificity/order 순서로 비교합니다.", "named color와 rgb serialization을 구분합니다."] },
    { difficulty: "응용", prompt: "legacy·component·utility CSS를 @layer로 정리하고 !important를 제거하세요.", requirements: ["layer order와 각 category ownership을 문서화합니다.", "unlayered legacy rule의 영향과 migration을 처리합니다.", "normal/important layer reversal test를 포함합니다.", "selector specificity를 높이지 않고 override합니다.", "hover/focus/user preference 회귀를 검사합니다."], hints: ["unlayered normal은 named layer보다 강할 수 있습니다.", "important layer는 normal과 반대입니다."], expectedOutcome: "computed style은 유지하면서 layer contract가 명확하고 예외 !important 수가 측정 가능하게 줄어듭니다.", solutionOutline: ["winning rule inventory부터 만듭니다.", "vendor/reset/base/components/utilities 순서를 실제 요구에 맞게 결정합니다."] },
    { difficulty: "설계", prompt: "여러 팀·third-party·CSS Modules·CSS-in-JS가 공존하는 style governance와 검증 체계를 설계하세요.", requirements: ["origin/layer/encapsulation/token/component/utility 책임을 정의합니다.", "inline style·!important·unlayered rule 허용 정책을 만듭니다.", "bundle/link/runtime insertion order와 SSR hydration을 다룹니다.", "CSP·cache hash·render-blocking/performance budget을 포함합니다.", "computed style·visual·accessibility/user override test matrix를 정의합니다."], hints: ["specificity만 표준화해도 origin/layer/runtime order 문제는 남습니다.", "user important style을 막지 않는지 검토합니다."], expectedOutcome: "새 component가 selector 전쟁 없이 예측 가능한 cascade에 참여하고 deploy/SSR/cache/security까지 검증 가능한 architecture가 완성됩니다.", solutionOutline: ["cascade sorting 축을 architecture decision table에 대응시킵니다.", "각 축의 owner와 automated invariant를 정의합니다."] },
  ],
  reviewQuestions: [
    { question: "internal CSS는 external CSS보다 항상 강한가요?", answer: "아닙니다. 둘 다 보통 normal author stylesheet이며 같은 specificity면 최종 stylesheet appearance order가 결정합니다." },
    { question: "inline style은 언제나 모든 CSS를 이기나요?", answer: "아닙니다. 같은 importance의 stylesheet normal rule보다 강하지만 author/user important, transition 등 더 앞 cascade 단계가 있습니다." },
    { question: "selector가 match했는데 declaration이 취소선인 이유는 무엇인가요?", answer: "후보에는 들었지만 origin/importance/style attribute/layer/specificity/scope/order 또는 shorthand 충돌에서 다른 declaration이 이겼기 때문입니다." },
    { question: "@layer normal rule은 어느 layer가 강한가요?", answer: "선언된 layer order에서 뒤 layer가 강합니다. important declaration은 반대로 앞 layer가 강합니다." },
    { question: "unlayered normal rule은 named layer보다 약한가요?", answer: "아닙니다. 같은 origin의 unlayered normal rule은 implicit final layer에 있어 named layer normal rule보다 강합니다." },
    { question: "부모 background가 child에 보이면 background가 상속된 것인가요?", answer: "대개 child background가 transparent라 parent painting이 비치는 것입니다. child computed background와 실제 inheritance를 구분합니다." },
    { question: "initial과 inherit, unset은 어떻게 다른가요?", answer: "initial은 property initial value, inherit은 parent computed value, unset은 inherited property면 inherit·아니면 initial처럼 동작합니다." },
    { question: "getComputedStyle는 source에 쓴 token을 그대로 반환하나요?", answer: "아닙니다. CSSOM resolved value를 canonical serialization하므로 tomato가 rgb 값으로 반환될 수 있습니다." },
    { question: "CSS가 전혀 적용되지 않을 때 specificity부터 보면 되나요?", answer: "먼저 resource fetch/status/MIME/CSP, selector match, value validity를 확인한 뒤 cascade를 봅니다." },
  ],
  completionChecklist: [
    "HTML attribute·CSS property·selector·declaration·at-rule 용어를 구분했다.",
    "inline/internal/external 선택을 범위·재사용·network·CSP tradeoff로 결정했다.",
    "각 충돌 property를 origin/importance/style attribute/layer/specificity/scope/order 순서로 추적했다.",
    "normal/important의 layer 순서 반전과 unlayered normal rule을 실제 output으로 검증했다.",
    "inheritance와 initial/inherit/unset/revert/revert-layer를 property별로 구분했다.",
    "declared/computed/used/actual value와 getComputedStyle serialization 차이를 설명했다.",
    "Network status·MIME·CSP·cache와 DevTools Styles/Computed evidence를 확인했다.",
    "무분별한 inline/!important/specificity escalation 없이 layer·ownership architecture로 수정했다.",
  ],
  nextSessions: ["css-02-basic-selectors-specificity"],
  sources: [
    { id: "web-css-inline-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/ex05_style_attr.html", usedFor: ["style attribute", "background/color/text-align", "font property", "HTML attribute와 CSS property"], evidence: "원본 inline typography 선언 전체를 읽어 syntax·범위·재사용·CSP와 computed style 진단으로 확장했습니다." },
    { id: "web-css-combined-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/ex08_html_css.html", usedFor: ["external link", "internal style", "inline override", "Cascading 개념"], evidence: "h2/h3/h4의 external olive, internal lightblue, inline tomato/orange/aqua 충돌을 실제 cascade location example의 근거로 사용했습니다." },
    { id: "web-css-external-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/style01.css", usedFor: ["external stylesheet", "@charset", "selector list", "olive base"], evidence: "별도 CSS의 @charset과 h2,h3,h4 rule을 확인해 resource loading·source order·cache 설명에 연결했습니다." },
    { id: "css-cascade-6", repository: "W3C CSS Working Group", path: "TR/css-cascade-6/", publicUrl: "https://www.w3.org/TR/css-cascade-6/", usedFor: ["cascade sorting order", "origin/importance", "style attribute", "layer", "scope proximity", "appearance order"], evidence: "2026-07-12 기준 CSS Cascade Level 6 working specification의 정렬 단계와 style sheet ordering을 mental model의 기준으로 확인했습니다." },
    { id: "css-cascade-5", repository: "W3C CSS Working Group", path: "TR/css-cascade-5/", publicUrl: "https://www.w3.org/TR/css-cascade-5/", usedFor: ["cascade layers", "layer ordering", "important reversal", "defaulting/revert-layer"], evidence: "Cascade Level 5의 layer와 value defaulting 정의를 layer example과 inheritance keyword 설명에 반영했습니다." },
    { id: "cssom", repository: "W3C CSS Working Group", path: "TR/cssom-1/", publicUrl: "https://www.w3.org/TR/cssom-1/", usedFor: ["getComputedStyle", "CSSStyleDeclaration", "resolved value", "serialization"], evidence: "CSSOM의 getComputedStyle/resolved value API를 exact rgb output과 diagnostics의 기준으로 사용했습니다." },
    { id: "whatwg-stylesheet-link", repository: "WHATWG HTML Standard", path: "multipage/links.html#link-type-stylesheet", publicUrl: "https://html.spec.whatwg.org/multipage/links.html#link-type-stylesheet", usedFor: ["link rel=stylesheet", "resource fetch", "media", "render blocking"], evidence: "linked stylesheet processing과 media/render-blocking 조건을 외부 CSS 운영 설명에 반영했습니다." },
  ],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "원본은 세 적용 위치와 충돌을 간결하게 보여 줍니다. origin/importance/layer/scope/value pipeline, CSP/cache/MIME/SSR은 W3C/WHATWG 공식 표준으로 전문가 수준까지 보강했습니다.",
      "specificity 계산과 selector grammar는 다음 css-02/03, custom property/theme·Grid·animation은 후속 CSS/프로젝트 세션에서 별도로 확장합니다.",
    ],
  },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "origin-layer-rollback-and-inline-boundary",
    title: "origin·importance·layer·inline을 한 cascade 표에서 추적합니다",
    lead: "selector specificity를 계산하기 전에 declaration이 어느 origin·importance·layer에 속하는지 분류하고 revert-layer로 현재 layer만 되돌리는 경계를 확인합니다.",
    explanations: [
      "cascade는 relevance 뒤 origin과 importance를 먼저 비교합니다. 같은 author origin에서도 transition, important, animation, normal의 우선순위가 다르고 user important는 author important보다 앞서 사용자 접근성 override를 보호합니다.",
      "normal author declaration에서는 unlayered style이 named layer보다 뒤에 있어 이깁니다. important declaration에서는 layer order가 반전되어 먼저 선언한 layer의 important가 뒤 layer important보다 강합니다.",
      "revert-layer는 현재 cascade layer의 값을 제거한 것처럼 이전 layer 또는 origin 결과로 돌아갑니다. revert는 현재 origin 전체를 건너뛰는 더 넓은 rollback이므로 둘을 theme reset에 섞지 않습니다.",
      "style attribute는 author origin의 특정 declaration이며 normal inline은 stylesheet normal보다 강하지만 stylesheet의 author !important에는 집니다. 무조건 최상위라는 표는 user origin과 importance를 설명하지 못합니다.",
      "DevTools에서는 Styles의 crossed-out declaration만 보지 말고 layer·inherited group·matched selector와 Computed의 최종 longhand를 함께 확인합니다. shorthand 한 줄이 여러 longhand를 덮을 수 있습니다.",
    ],
    concepts: [
      { term: "cascade rollback", definition: "revert·revert-layer 같은 전역 keyword로 현재 cascade 범위의 declaration을 되돌리는 동작입니다.", detail: ["revert-layer는 현재 layer만 건너뜁니다.", "unset·initial·inherit와 의미가 다릅니다."] },
      { term: "important layer inversion", definition: "important declaration에서는 normal과 반대로 앞 layer가 뒤 layer보다 높은 우선순위를 갖는 규칙입니다.", detail: ["초기 guard layer를 보호할 수 있습니다.", "layer 밖 important도 별도 위치를 가집니다."] },
    ],
    codeExamples: [
      {
        id: "revert-layer-important-inversion-proof",
        title: "revert-layer·unlayered normal·important layer 반전을 동시에 검증합니다",
        language: "html",
        filename: "cascade-rollback.html",
        purpose: "specificity가 아닌 layer 단계에서 결정되는 color·background·border 결과를 computed style로 고정합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"utf-8\"><title>cascade rollback</title>\n<style>\n  @layer reset, components, utilities;\n  @layer reset {\n    .card { color: gray; padding: 8px; border: 4px solid navy !important; }\n  }\n  @layer components {\n    #lesson.card { color: royalblue; background: honeydew; }\n  }\n  @layer utilities {\n    .card { color: tomato; border-color: orange !important; }\n    .rollback { color: revert-layer; }\n  }\n  .card { background: lavender; }\n</style>\n</head>\n<body>\n<article id=\"lesson\" class=\"card rollback\">레이어 카드</article>\n<pre id=\"result\"></pre>\n<script>\n  const style = getComputedStyle(document.querySelector(\"#lesson\"));\n  document.querySelector(\"#result\").textContent = [\n    \"color=\" + style.color,\n    \"background=\" + style.backgroundColor,\n    \"border=\" + style.borderTopColor + \" \" + style.borderTopWidth,\n    \"padding=\" + style.paddingTop,\n  ].join(\"\\n\");\n</script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-17", explanation: "세 layer 순서, normal color rollback, important border 반전과 unlayered background 후보를 선언합니다." },
          { lines: "20-30", explanation: "한 element의 최종 color·background·border·padding longhand를 CSSOM canonical 값으로 출력합니다." },
        ],
        run: { environment: ["@layer와 revert-layer를 지원하는 현대 Chromium"], command: "browser에서 cascade-rollback.html을 열고 #result 확인" },
        output: { value: "color=rgb(65, 105, 225)\nbackground=rgb(230, 230, 250)\nborder=rgb(0, 0, 128) 4px\npadding=8px", explanation: ["utilities의 revert-layer가 color를 components의 royalblue로 되돌립니다.", "unlayered lavender는 layered normal background보다 강하고 reset의 navy important는 utilities orange important보다 강합니다."] },
        experiments: [
          { change: "rollback class를 제거합니다.", prediction: "utilities의 tomato가 color가 됩니다.", result: "revert-layer가 현재 layer declaration만 제거함을 확인합니다." },
          { change: "reset과 utilities layer 순서를 바꿉니다.", prediction: "important border 승자도 반대로 바뀝니다.", result: "important layer 순서 반전을 확인합니다." },
          { change: "unlayered background를 삭제합니다.", prediction: "components의 honeydew가 보입니다.", result: "unlayered normal의 위치를 확인합니다." },
        ],
        sourceRefs: ["css-cascade-6", "css-cascade-5"],
      },
      {
        id: "inline-important-cssom-evidence",
        title: "inline normal과 stylesheet important의 승자·source serialization을 구분합니다",
        language: "html",
        filename: "inline-important.html",
        purpose: "style attribute source와 getComputedStyle 결과가 다른 API 계층임을 exact output으로 보여 줍니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"utf-8\"><title>inline boundary</title>\n<style>\n  #target.notice { color: royalblue !important; }\n  .notice { color: green; background: gold; }\n</style>\n</head>\n<body>\n<p id=\"target\" class=\"notice\" style=\"color: tomato; background: lightcyan\">알림</p>\n<pre id=\"result\"></pre>\n<script>\n  const target = document.querySelector(\"#target\");\n  const style = getComputedStyle(target);\n  document.querySelector(\"#result\").textContent = [\n    \"attribute=\" + target.getAttribute(\"style\"),\n    \"inline-color=\" + target.style.color,\n    \"inline-priority=\" + (target.style.getPropertyPriority(\"color\") || \"normal\"),\n    \"computed-color=\" + style.color,\n    \"computed-background=\" + style.backgroundColor,\n  ].join(\"\\n\");\n</script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-8", explanation: "author stylesheet의 important color와 normal background를 정의합니다." },
          { lines: "11-23", explanation: "inline source text·CSSStyleDeclaration과 cascade 뒤 computed color/background를 별도로 읽습니다." },
        ],
        run: { environment: ["현대 Chromium", "외부 network 불필요"], command: "browser에서 inline-important.html을 열고 #result 확인" },
        output: { value: "attribute=color: tomato; background: lightcyan\ninline-color=tomato\ninline-priority=normal\ncomputed-color=rgb(65, 105, 225)\ncomputed-background=rgb(224, 255, 255)", explanation: ["author important royalblue가 normal inline tomato를 이깁니다.", "background에는 important가 없어 inline lightcyan이 stylesheet gold보다 강합니다."] },
        experiments: [
          { change: "inline color에도 !important를 붙입니다.", prediction: "같은 author important에서 inline declaration이 royalblue rule을 이깁니다.", result: "importance가 같아진 뒤 inline precedence를 비교합니다." },
          { change: "style attribute를 제거합니다.", prediction: "background는 gold가 됩니다.", result: "source API와 computed API의 차이를 확인합니다." },
          { change: "사용자 입력을 style attribute에 문자열 결합합니다.", prediction: "허용하지 않은 property·url이 들어갈 수 있습니다.", result: "동적 style은 allowlist property API와 CSP 경계를 사용합니다." },
        ],
        sourceRefs: ["web-css-inline-source", "css-style-attributes", "css-cascade-6", "cssom"],
      },
    ],
    diagnostics: [
      { symptom: "높은 specificity selector와 inline style이 있는데도 component guard가 이긴다.", likelyCause: "앞 layer의 important declaration 또는 user important를 specificity보다 뒤에서 확인했습니다.", checks: ["origin·importance·layer를 먼저 표로 만듭니다.", "DevTools layer와 important badge를 확인합니다.", "revert/revert-layer 후보를 봅니다."], fix: "cascade 단계 순서대로 원인을 수정하고 무분별한 specificity·important 경쟁을 중단합니다.", prevention: "layer contract와 important 허용 위치를 lint·architecture 문서로 고정합니다." },
    ],
    expertNotes: ["사용자 stylesheet와 forced colors는 제품 CSS가 임의로 이겨야 할 대상이 아닙니다. 사용자 설정을 견디는 semantic DOM과 system color/focus indicator를 함께 설계합니다."],
  },
  {
    id: "logical-inheritance-loading-security-boundaries",
    title: "상속·논리 방향·stylesheet loading을 접근성·성능·보안 경계로 연결합니다",
    lead: "computed value 상속과 writing mode의 logical 축을 이해하고 CSS가 적용되지 않는 문제를 Network·CSP·MIME·cache와 cascade 문제로 분리합니다.",
    explanations: [
      "color·font 일부는 상속되지만 margin·border·background는 기본적으로 상속되지 않습니다. currentColor는 computed color를 다른 paint property에 연결해 theme와 forced-color 적응을 돕습니다.",
      "inline-size·block-size와 margin-inline-start·border-block-start는 writing-mode와 direction에 따라 물리 축으로 매핑됩니다. left/right 고정은 세로쓰기·RTL localization에서 의미적 시작을 잃을 수 있습니다.",
      "외부 stylesheet는 link href resolution, fetch status, redirect, MIME, CSP style-src, integrity/crossorigin과 cache 상태를 통과해야 cascade 후보가 됩니다. Styles panel에 rule이 아예 없으면 selector보다 Network부터 봅니다.",
      "render-blocking CSS를 많은 origin·@import chain·거대 unused rule로 나누면 first paint가 늦어집니다. critical CSS와 cache를 측정하되 inline 남발로 CSP와 유지보수를 훼손하지 않습니다.",
      "CSS는 데이터 보안 수단이 아닙니다. display:none·color:transparent로 숨긴 secret은 DOM·source·accessibility tooling에서 읽힐 수 있으므로 server authorization과 최소 데이터 전송이 필요합니다.",
    ],
    concepts: [
      { term: "logical property", definition: "left/right 같은 물리 방향 대신 inline/block 흐름의 시작·끝에 맞춰 매핑되는 CSS property입니다.", detail: ["writing-mode와 direction에 반응합니다.", "다국어 layout 유지보수에 유리합니다."] },
      { term: "stylesheet loading boundary", definition: "CSS resource가 cascade에 참여하기 전에 URL·network·MIME·CSP·cache를 통과하는 단계입니다.", detail: ["selector debug보다 앞선 문제일 수 있습니다.", "DevTools Network와 Security 정책을 봅니다."] },
    ],
    codeExamples: [{
      id: "writing-mode-logical-inheritance-proof",
      title: "vertical-rl에서 논리 크기·margin·border와 currentColor 상속을 측정합니다",
      language: "html",
      filename: "logical-cascade.html",
      purpose: "logical property가 물리 top/right와 geometry로 변환되는 과정을 computed style로 검증합니다.",
      code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"utf-8\"><title>logical cascade</title>\n<style>\n  .parent { color: #123456; writing-mode: vertical-rl; --space: 12px; }\n  .child {\n    box-sizing: border-box;\n    color: inherit;\n    inline-size: 100px;\n    block-size: 60px;\n    margin-inline-start: var(--space);\n    border-block-start: 4px solid currentColor;\n  }\n</style>\n</head>\n<body>\n<div class=\"parent\"><div id=\"child\" class=\"child\">세로 카드</div></div>\n<pre id=\"result\"></pre>\n<script>\n  const child = document.querySelector(\"#child\");\n  const style = getComputedStyle(child);\n  const rect = child.getBoundingClientRect();\n  document.querySelector(\"#result\").textContent = [\n    \"writing-mode=\" + style.writingMode,\n    \"color=\" + style.color,\n    \"logical-margin=\" + style.marginInlineStart,\n    \"physical-margin-top=\" + style.marginTop,\n    \"logical-border=\" + style.borderBlockStartWidth,\n    \"physical-border-right=\" + style.borderRightWidth,\n    \"rect=\" + Math.round(rect.width) + \"x\" + Math.round(rect.height),\n  ].join(\"\\n\");\n</script>\n</body>\n</html>",
      walkthrough: [
        { lines: "1-14", explanation: "부모의 color·writing mode·custom property와 자식의 logical size/margin/border를 선언합니다." },
        { lines: "17-31", explanation: "logical longhand, 매핑된 physical top/right와 60×100 border-box geometry를 한 번에 측정합니다." },
      ],
      run: { environment: ["writing-mode와 logical property를 지원하는 현대 Chromium"], command: "browser에서 logical-cascade.html을 열고 #result 확인" },
      output: { value: "writing-mode=vertical-rl\ncolor=rgb(18, 52, 86)\nlogical-margin=12px\nphysical-margin-top=12px\nlogical-border=4px\nphysical-border-right=4px\nrect=60x100", explanation: ["vertical-rl에서 inline 축은 위→아래라 inline-start margin이 top에 매핑됩니다.", "block-start는 오른쪽이므로 borderBlockStart가 borderRight가 되고 inline/block 크기는 물리 height/width가 됩니다."] },
      experiments: [
        { change: "writing-mode를 horizontal-tb로 바꿉니다.", prediction: "inline-start margin은 left, block-start border는 top으로 매핑되고 rect는 100×60입니다.", result: "논리 축이 writing mode에 반응합니다." },
        { change: "부모 color를 바꿉니다.", prediction: "inherit와 currentColor를 통해 자식 text와 border가 함께 바뀝니다.", result: "상속과 paint token 연결을 확인합니다." },
        { change: "외부 stylesheet로 옮기고 CSP style-src를 위반합니다.", prediction: "rule이 cascade 후보에 들어오지 않습니다.", result: "Network/Console/CSP와 cascade diagnostics를 분리합니다." },
      ],
      sourceRefs: ["whatwg-stylesheet-link", "css-writing-modes-4", "csp-style-src", "css-cascade-6", "cssom"],
    }],
    diagnostics: [
      { symptom: "LTR에서는 맞지만 RTL·세로쓰기에서 간격과 강조 border가 반대쪽에 나타난다.", likelyCause: "left/right/top을 의미적 inline/block 시작으로 오해했습니다.", checks: ["writing-mode와 direction computed 값을 확인합니다.", "logical/physical longhand를 나란히 봅니다.", "실제 rect와 localization fixture를 측정합니다."], fix: "의미적 방향은 logical property로 바꾸고 필요한 물리 좌표만 명시합니다.", prevention: "LTR·RTL·vertical writing mode visual/computed regression을 둡니다." },
    ],
    expertNotes: ["getComputedStyle 호출은 style/layout flush를 유발할 수 있습니다. 반복 animation loop에서 read/write를 섞지 말고 DevTools Performance로 forced reflow를 측정합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "normal declaration과 important declaration에서 layer 순서는 어떻게 다른가요?", answer: "normal은 뒤 layer가 강하지만 important는 순서가 반전되어 앞 layer가 강합니다." },
  { question: "revert와 revert-layer의 차이는 무엇인가요?", answer: "revert-layer는 현재 cascade layer만 건너뛰고 revert는 현재 origin 수준을 되돌려 더 이전 origin 결과를 찾습니다." },
  { question: "normal inline style이 stylesheet !important를 이기나요?", answer: "아닙니다. 같은 author origin에서 important declaration이 normal inline보다 먼저 비교됩니다." },
  { question: "논리 속성의 inline-start는 항상 왼쪽인가요?", answer: "아닙니다. writing-mode와 direction에 따라 top·right 등 다른 물리 면으로 매핑됩니다." },
  { question: "Styles panel에 기대 rule이 전혀 없다면 무엇부터 확인하나요?", answer: "selector보다 link URL, Network status, MIME, CSP, cache와 stylesheet parse 여부를 먼저 확인합니다." },
  { question: "display:none으로 민감 데이터를 숨기면 안전한가요?", answer: "아닙니다. DOM/source로 읽을 수 있으므로 authorization 후 필요한 데이터만 server에서 전달해야 합니다." },
);
session.completionChecklist.push(
  "cascade 후보를 origin·importance·layer·specificity·scope·order 순서로 표로 만든다.",
  "normal/important layer 순서 반전과 unlayered 위치를 설명한다.",
  "revert·revert-layer·unset·initial·inherit를 목적에 맞게 선택한다.",
  "inline source declaration과 CSSOM computed serialization을 분리해 테스트한다.",
  "LTR·RTL·vertical writing mode에서 logical property mapping을 검증한다.",
  "CSS 미적용 시 Network·MIME·CSP·cache와 selector 문제를 분리한다.",
  "사용자 override·forced colors를 존중하고 CSS를 보안 은닉 수단으로 사용하지 않는다.",
);
(session.sources as DetailedSession["sources"]).push(
  { id: "css-style-attributes", repository: "W3C CSS Working Group", path: "TR/css-style-attr/", publicUrl: "https://www.w3.org/TR/css-style-attr/", usedFor: ["style attribute", "inline declaration parsing"], evidence: "W3C CSS Style Attributes specification을 inline author declaration의 공식 근거로 사용했습니다." },
  { id: "css-writing-modes-4", repository: "W3C CSS Working Group", path: "TR/css-writing-modes-4/#block-flow", publicUrl: "https://www.w3.org/TR/css-writing-modes-4/#block-flow", usedFor: ["writing-mode", "inline/block axis", "logical mapping"], evidence: "CSS Writing Modes의 block/inline flow 정의를 logical property 계산 기준으로 사용했습니다." },
  { id: "csp-style-src", repository: "W3C Web Application Security", path: "TR/CSP3/#directive-style-src", publicUrl: "https://www.w3.org/TR/CSP3/#directive-style-src", usedFor: ["style-src", "inline/external CSS 보안", "loading failure"], evidence: "CSP Level 3 style-src directive를 stylesheet loading 보안 경계의 근거로 사용했습니다." },
);

export default session;
