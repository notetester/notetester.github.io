import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["html-09-semantic-layout-accessibility"],
  slug: "html-09-semantic-layout-accessibility",
  courseId: "web",
  moduleId: "01-html-document-forms",
  order: 9,
  title: "div 레이아웃을 시맨틱 랜드마크로 바꾸기",
  subtitle: "header·nav·main·section·article·aside·footer를 모양 이름이 아닌 문서 역할로 선택하고 heading·skip link·DOM 순서를 통해 누구나 빠르게 탐색하게 합니다.",
  level: "중급",
  estimatedMinutes: 180,
  coreQuestion: "같은 화면 배치를 유지하면서도 browser·검색·보조기술이 각 영역의 목적과 계층을 이해하고 keyboard 사용자가 반복 navigation을 건너뛰게 하려면 문서 tree를 어떻게 설계할까요?",
  summary: "원본의 div+id+float 2열 레이아웃에서 section 일부 도입, 3열+aside, 최종 header/nav/main/section/aside/footer 진화까지 네 파일을 비교합니다. semantic element는 CSS 대체가 아니라 의미 계약임을 밝히고 header/footer의 문맥, nav의 실제 link, 유일한 main, heading이 있는 section, 독립 배포 가능한 article, 보조적 aside를 선택합니다. landmark 이름·skip link·logical heading·DOM/focus order·responsive CSS Grid·ARIA 중복과 landmark 남용을 진단하며 CSS/JavaScript 실패에서도 읽히는 page shell을 구현합니다.",
  objectives: [
    "div와 semantic sectioning/landmark element의 차이를 style이 아닌 의미·API 관점으로 설명할 수 있다.",
    "header·nav·main·section·article·aside·footer를 content 역할과 재사용 범위에 맞게 선택할 수 있다.",
    "heading level로 page의 실제 계층을 표현하고 section을 heading 없이 남용하지 않을 수 있다.",
    "여러 navigation/region에 고유한 accessible name을 제공하고 landmark 목록의 과밀을 피할 수 있다.",
    "skip link와 main target을 구현해 keyboard 사용자가 반복 content를 건너뛸 수 있게 할 수 있다.",
    "CSS Grid/Flex responsive layout에서도 DOM·reading·focus 순서와 정보 우선순위를 보존할 수 있다.",
  ],
  prerequisites: [
    { title: "입력 컨트롤, 레이블, 내장 검증과 파일 업로드", reason: "label·group·keyboard·error 관계를 익혔으므로 이제 control이 놓이는 page 전체의 semantic navigation 구조를 설계합니다.", sessionSlug: "html-08-form-controls-validation" },
  ],
  keywords: ["semantic HTML", "header", "nav", "main", "section", "article", "aside", "footer", "landmark", "heading hierarchy", "skip link", "DOM order", "ARIA"],
  chapters: [
    {
      id: "meaning-before-layout",
      title: "semantic HTML은 CSS class 이름보다 오래 유지되는 콘텐츠 역할 계약입니다",
      lead: "header처럼 보이는 회색 상자와 실제 header element는 시각적으로 같을 수 있지만 문서 탐색·재사용·자동화가 읽는 정보가 다릅니다.",
      explanations: [
        "원본 ex14는 #header·#nav·#content·#footer라는 id를 가진 div로 page 영역을 구분합니다. 사람은 id 이름과 배경색을 보고 역할을 추측할 수 있지만 div 자체는 특별한 문서 의미가 없는 generic container입니다. semantic element는 이 추측을 HTML vocabulary로 명시합니다.",
        "semantic element를 쓰면 CSS가 자동으로 아름답게 배치되는 것은 아닙니다. header·main·aside도 기본적으로 block flow에 놓이며 Grid/Flex/spacing은 CSS 책임입니다. 반대로 div에 role을 붙이면 일부 접근성 의미를 보강할 수 있지만 native element가 제공하는 content model과 유지보수 clarity를 먼저 사용합니다.",
        "의미는 사용자의 탐색 방식과 연결됩니다. screen reader 사용자는 landmark 목록으로 main/navigation을 이동하고 heading 목록으로 section을 훑을 수 있습니다. browser Reader mode·검색 engine·test selector도 구조를 활용합니다. CSS class가 .left라고 해서 왼쪽이라는 현재 배치 외의 목적은 알 수 없습니다.",
        "semantic 선택은 모양이 아니라 '이 content는 page/site 전체의 header인가, 독립 article인가, 주 내용과 간접 관련 aside인가'라는 질문에서 시작합니다. mobile에서 aside가 아래로 이동해도 역할은 그대로 유지됩니다.",
      ],
      concepts: [
        { term: "semantic HTML", definition: "content의 목적·관계·역할을 element 자체의 정의로 표현하는 HTML 작성 방식입니다.", detail: ["CSS presentation과 독립적입니다.", "native behavior와 accessibility mapping을 활용합니다."], analogy: "창고 상자 색만 다르게 칠하는 대신 '문서', '공구', '의약품' label과 보관 규칙을 붙이는 것과 같습니다." },
        { term: "generic container", definition: "고유한 semantic 역할이 없는 div 또는 span 같은 grouping element입니다.", detail: ["CSS/JavaScript hook에 유용합니다.", "적합한 semantic element가 없을 때 사용합니다."], caveat: "div가 나쁜 element라는 뜻이 아니라 content 의미를 더 정확히 표현할 element가 있을 때 대체하지 말라는 뜻입니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "화면은 잘 보이지만 landmark 목록에 main과 navigation이 없고 자동 test가 매번 #content id에 의존한다.", likelyCause: "모든 page 영역을 generic div로만 표현했습니다.", checks: ["accessibility tree의 landmark를 확인합니다.", "CSS를 끄고 heading/content 순서를 읽습니다.", "각 div 역할을 한 문장으로 정의합니다."], fix: "content 역할에 맞는 header/nav/main/section/article/aside/footer로 변경하고 필요한 generic wrapper만 남깁니다.", prevention: "page template review에 landmark map과 heading outline을 포함합니다." },
      ],
    },
    {
      id: "landmark-elements-contract",
      title: "header·nav·main·footer는 page의 반복 구조와 주 콘텐츠 경계를 빠르게 탐색하게 합니다",
      lead: "element 이름을 위치 label로 오해하지 않고 포함된 문맥과 실제 content purpose로 판단합니다.",
      explanations: [
        "body의 직접적인 header는 보통 site 이름·logo·global search·주요 introduction을 포함하는 banner 성격을 가집니다. article/section 안 header는 그 영역의 제목·작성자·metadata를 묶으며 page banner와 같은 landmark가 아닐 수 있습니다. header는 무조건 page 맨 위라는 위치 규칙이 아닙니다.",
        "nav는 주요 navigation link section입니다. 원본 메뉴1·2·3은 text li일 뿐 이동할 href가 없어 navigation 기능이 없습니다. 실제 route를 가진 a link를 목록으로 제공하고, page에 nav가 여러 개면 '주요 메뉴', '과정 목차'처럼 목적을 구분합니다.",
        "main은 document body의 지배적인 고유 content를 나타냅니다. 반복 site header/nav/footer는 보통 main 밖에 둡니다. SPA shell에 template용 hidden main이 여러 개 생기거나 modal 안 main을 추가하지 않도록 rendered page에서 사용자에게 노출되는 main 경계를 검증합니다.",
        "footer는 자신이 속한 nearest sectioning content 또는 body의 footer로 작성자·copyright·관련 link 등을 담습니다. 단순히 화면 바닥에 붙이는 CSS sticky footer 개념과 다릅니다. article footer와 site footer는 서로 다른 문맥입니다.",
        "native element에 role='navigation'·role='main'을 중복 추가할 필요는 대개 없습니다. 오래된 특수 호환성 요구가 아니라면 native semantics를 사용하고 ARIA로 바꾸거나 중복하지 않습니다.",
      ],
      concepts: [
        { term: "landmark", definition: "page의 큰 영역 목적을 나타내 사용자가 region 사이를 빠르게 탐색할 수 있게 하는 접근성 구조입니다.", detail: ["main·navigation·banner·contentinfo 등이 대표적입니다.", "너무 많으면 목록 탐색 비용이 증가합니다."] },
        { term: "main content", definition: "현재 document의 중심 주제와 직접 관련된 고유 content 영역입니다.", detail: ["반복 site chrome과 구분합니다.", "skip link target이 됩니다."] },
        { term: "native-first rule", definition: "필요한 의미·상태·behavior를 제공하는 native HTML element가 있으면 ARIA로 재구현하기 전에 이를 사용하는 원칙입니다.", detail: ["semantic drift와 keyboard 구현 부담을 줄입니다.", "ARIA는 부족한 의미를 보강할 때 사용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "screen reader landmark 목록에 이름 없는 navigation이 세 개 보여 어느 메뉴인지 구분할 수 없다.", likelyCause: "여러 nav가 같은 implicit role을 가지지만 accessible name이 없습니다.", checks: ["각 nav의 aria-label/aria-labelledby를 확인합니다.", "visible heading과 label이 일치하는지 봅니다.", "landmark가 실제 주요 탐색인지 재평가합니다."], fix: "유지할 nav마다 고유하고 간결한 목적 이름을 제공하고 중요하지 않은 link group은 generic/footer structure로 단순화합니다.", prevention: "page 단위 landmark 개수·role·name uniqueness를 rendered test로 검사합니다." },
      ],
    },
    {
      id: "section-article-aside",
      title: "section·article·aside는 폭과 위치가 아니라 콘텐츠의 주제·독립성·관련성으로 구분합니다",
      lead: ".left/.center/.right 같은 배치 class를 semantic element 선택 기준으로 사용하지 않습니다.",
      explanations: [
        "section은 문서나 article 안의 thematic grouping이며 일반적으로 heading으로 주제를 식별합니다. CSS wrapper가 필요하다는 이유로 section을 쓰거나 모든 div를 section으로 치환하면 의미 없는 region이 늘어납니다. 적합한 element가 없고 주제 heading도 없다면 div가 더 정직합니다.",
        "article은 forum post·news story·blog entry·상품 card처럼 document 밖에 따로 배포하거나 syndicate해도 자체 의미가 유지되는 composition입니다. article 안에 section이 있을 수 있고 section 안에 여러 article이 있을 수 있습니다. element 계층은 content model에 따라 선택합니다.",
        "aside는 주변 content와 간접 관련되거나 별도로 볼 수 있는 보조 content입니다. glossary, related links, author bio, pull quote 등에 적합합니다. '오른쪽 column'이라는 이유만으로 사용하지 않고 mobile에서 아래로 이동해도 aside 의미가 맞는지 확인합니다.",
        "원본 ex16의 '내용과 상관없는 공간'은 정말 무관한 광고/보조 content라면 aside 후보지만 완전히 무관하고 사용자에게 가치가 없다면 제거가 먼저입니다. semantic element는 불필요한 content를 정당화하지 않습니다.",
        "section과 aside가 landmark로 노출되는 조건·browser mapping은 이름과 문맥에 영향을 받을 수 있습니다. 중요한 region에는 heading 또는 aria-labelledby로 이름을 제공하고, 모든 작은 wrapper를 landmark로 만들지 않습니다.",
      ],
      concepts: [
        { term: "thematic grouping", definition: "하나의 식별 가능한 주제 아래 관련 content를 묶는 구조입니다.", detail: ["section과 heading 조합이 대표적입니다.", "시각 column과 동일하지 않습니다."] },
        { term: "self-contained composition", definition: "별도로 재사용·배포해도 자체 제목과 문맥으로 이해되는 content 단위이며 article이 표현합니다.", detail: ["목록 속 여러 article이 가능할 수 있습니다.", "단순 card wrapper라고 자동 article은 아닙니다."] },
        { term: "tangential content", definition: "주 content와 관련은 있지만 흐름에서 분리해도 되는 보조 content이며 aside가 표현합니다.", detail: ["관련 link·용어·작성자 정보 등이 예입니다.", "layout right side와 동의어가 아닙니다."] },
      ],
      codeExamples: [
        {
          id: "semantic-course-page",
          title: "site shell·과정 article·관련 aside를 역할대로 구성하기",
          language: "html",
          filename: "semantic-course.html",
          purpose: "div id 기반 원본을 실제 link, 유일한 main, heading 있는 section, 독립 article, 관련 aside로 바꿉니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>HTML 과정 | 학습 기록</title></head>\n<body>\n  <a href=\"#main-content\">본문 바로가기</a>\n  <header>\n    <p><a href=\"/\">NOTE TESTER 학습 기록</a></p>\n  </header>\n  <nav aria-label=\"주요 메뉴\">\n    <ul>\n      <li><a href=\"/curriculum\" aria-current=\"page\">학습 과정</a></li>\n      <li><a href=\"/projects\">프로젝트</a></li>\n    </ul>\n  </nav>\n\n  <main id=\"main-content\" tabindex=\"-1\">\n    <h1>HTML 문서 과정</h1>\n    <section aria-labelledby=\"lessons-title\">\n      <h2 id=\"lessons-title\">핵심 세션</h2>\n      <article>\n        <h3><a href=\"/curriculum/web/html-document\">HTML 문서와 DOM</a></h3>\n        <p>source가 의미 있는 DOM tree가 되는 과정을 학습합니다.</p>\n        <footer><p>예상 학습 시간 150분</p></footer>\n      </article>\n    </section>\n    <aside aria-labelledby=\"related-title\">\n      <h2 id=\"related-title\">관련 복습</h2>\n      <ul><li><a href=\"/curriculum/web/lists\">목록과 내비게이션</a></li></ul>\n    </aside>\n  </main>\n\n  <footer>\n    <p><small>학습 내용을 반복 검증해 공개합니다.</small></p>\n  </footer>\n</body>\n</html>",
          walkthrough: [
            { lines: "5", explanation: "keyboard 사용자가 반복 header/navigation을 건너 main target으로 이동하는 skip link입니다." },
            { lines: "6-14", explanation: "site header와 실제 href를 가진 이름 있는 주요 navigation을 main 밖에 둡니다." },
            { lines: "16-25", explanation: "유일한 main의 h1 아래 thematic section(h2)과 독립 lesson article(h3)을 계층적으로 구성합니다. article footer는 site footer가 아닙니다." },
            { lines: "26-29", explanation: "주 과정과 간접 관련된 복습 link를 이름 있는 aside로 분리합니다." },
            { lines: "32-34", explanation: "body-level footer가 site 전체의 반복 정보를 제공합니다." },
          ],
          run: { environment: ["현대 browser", "keyboard", "DevTools Accessibility tree"], command: "browser에서 semantic-course.html을 열고 Tab→Enter로 본문 바로가기 후 landmark/heading 목록 확인" },
          output: { value: "landmarks:\n- banner\n- navigation '주요 메뉴'\n- main\n- complementary '관련 복습'\n- contentinfo\n\nheadings:\n- h1 HTML 문서 과정\n  - h2 핵심 세션\n    - h3 HTML 문서와 DOM\n  - h2 관련 복습\n\nskip link activation: focus target #main-content", explanation: ["header/footer의 landmark mapping은 body-level 문맥에서 기대됩니다.", "section·aside 이름은 heading/aria-labelledby로 식별됩니다.", "tabindex=-1은 skip target에 programmatic focus가 필요할 때 활용하며 실제 browser behavior를 test합니다."] },
          experiments: [
            { change: "nav의 a를 모두 span으로 바꿉니다.", prediction: "navigation 모양은 CSS로 유지할 수 있어도 keyboard link·URL·새 tab·history 기능을 잃습니다.", result: "nav는 실제 link behavior와 함께 사용해야 합니다." },
            { change: "관련 복습 aside를 main 밖으로 옮깁니다.", prediction: "보이는 위치가 CSS로 같아도 main content와의 tree 관계와 landmark 순서가 달라집니다.", result: "DOM 위치는 content 관계와 reading order를 표현합니다." },
            { change: "모든 div를 이름 없는 section으로 바꿉니다.", prediction: "구조가 더 semantic해지는 대신 이름 없는 region/section이 늘고 heading 계층이 불명확해집니다.", result: "semantic element는 역할이 있을 때 선택합니다." },
          ],
          sourceRefs: ["web-layout-semantic-source", "whatwg-sections", "wai-page-structure"],
        },
      ],
      diagnostics: [
        { symptom: "page에 section이 20개 있지만 heading 목록에는 h1 하나뿐이고 region 목록이 이해되지 않는다.", likelyCause: "style wrapper div를 기계적으로 section으로 바꾸고 각 thematic group의 이름을 설계하지 않았습니다.", checks: ["각 section의 주제를 한 문장으로 말합니다.", "heading 또는 aria-labelledby 존재를 확인합니다.", "generic div로 되돌려도 의미 손실이 있는지 봅니다."], fix: "실제 thematic grouping만 section으로 남기고 heading을 제공하며 layout wrapper는 div로 사용합니다.", prevention: "section 추가 시 purpose와 heading을 code review template에 요구합니다." },
      ],
    },
    {
      id: "heading-hierarchy",
      title: "heading은 font 크기가 아니라 사용자가 문서를 훑는 계층적 목차입니다",
      lead: "h1→h2→h3를 content nesting에 맞추고 HTML outline algorithm이 level을 자동 보정해 줄 것이라 기대하지 않습니다.",
      explanations: [
        "원본 ex14에는 site header의 '헤더 부분' h1과 content의 '본문제목' h1이 함께 있습니다. 여러 h1이 문법적으로 가능한 경우가 있어도 학습 site의 page 목적을 한 개의 명확한 h1로 두고 하위 주제를 h2/h3로 구성하면 사용자와 test가 예측하기 쉽습니다.",
        "heading level은 visual size가 아닙니다. h2를 작게 보이게 하거나 h4를 크게 만드는 것은 CSS로 처리합니다. card title이 언제나 h2인지 component 내부에서 고정하기보다 page context가 전달하는 level 또는 적절한 heading element 구조를 설계합니다.",
        "level을 h2에서 h4로 건너뛰면 관계를 오해하게 할 수 있습니다. 새 subsection이 정말 h3인지, 단순 bold label인지 판단합니다. 반대로 이전 section이 끝난 뒤 level을 낮추는 것은 정상일 수 있으므로 heading sequence validator 결과를 content tree와 함께 해석합니다.",
        "heading text는 '내용', '자세히'보다 topic/purpose를 구체적으로 설명합니다. 같은 이름의 heading이 반복되면 상위 context로 구분되는지 확인하고 search result/card 목록에서는 고유 title을 우선합니다.",
      ],
      concepts: [
        { term: "heading hierarchy", definition: "h1~h6 level로 문서 주제와 하위 주제의 포함 관계를 표현한 구조입니다.", detail: ["font size와 독립적입니다.", "heading 목록 탐색과 page 이해를 돕습니다."] },
        { term: "document outline", definition: "heading과 section 관계에서 사용자가 인지하는 문서 목차 구조입니다.", detail: ["자동 outline algorithm이 author 의도를 모두 보정한다고 기대하지 않습니다.", "실제 heading level을 명시합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "화면 글자 크기는 자연스럽지만 screen reader heading 목록이 h1→h4→h2로 튀어 section 관계를 이해하기 어렵다.", likelyCause: "visual font size를 얻으려고 heading level을 선택했습니다.", checks: ["CSS를 끄고 heading text/level만 목록으로 봅니다.", "각 heading의 parent topic을 적습니다.", "component가 level을 hard-code했는지 확인합니다."], fix: "content hierarchy에 맞게 h1/h2/h3를 재구성하고 시각 크기는 CSS class로 지정합니다.", prevention: "rendered heading outline snapshot과 사람 content review를 CI/QA에 포함합니다." },
      ],
    },
    {
      id: "skip-link-bypass-blocks",
      title: "skip link와 main landmark는 반복 header·menu를 건너 주 콘텐츠로 직접 이동하게 합니다",
      lead: "landmark 단축키를 모르는 keyboard 사용자도 첫 focusable link로 반복 block을 우회할 수 있어야 합니다.",
      explanations: [
        "여러 page에서 같은 global navigation link가 main보다 앞에 있으면 keyboard 사용자는 매번 모두 Tab해야 합니다. document 첫 부분의 '본문 바로가기' link가 main id를 target하면 한 번의 activation으로 반복 block을 건너갑니다.",
        "skip link를 시각적으로 항상 표시하거나 focus될 때 화면 안으로 나타나게 할 수 있습니다. display:none·visibility:hidden은 keyboard focus 대상에서도 제거하므로 off-screen technique을 쓰더라도 :focus에서 분명히 보이고 viewport에 나타나는지 test합니다.",
        "fragment navigation 뒤 focus가 main에 실제로 이동하는 browser behavior는 target element와 환경에 따라 확인해야 합니다. main에 tabindex='-1'을 두는 pattern을 사용할 때 일반 Tab order에 추가하지 않으면서 programmatic/fragment focus target이 되는지 test합니다.",
        "sticky header가 target heading을 가리면 scroll-margin-top을 main/heading에 적용할 수 있습니다. URL hash, focus indicator, screen reader virtual cursor가 모두 기대 위치를 가리키는지 확인합니다.",
      ],
      concepts: [
        { term: "bypass mechanism", definition: "반복되는 navigation/header block을 건너 page의 주요 content로 이동하는 방법입니다.", detail: ["skip link와 landmark가 대표적입니다.", "keyboard와 screen reader 탐색을 모두 고려합니다."] },
        { term: "fragment target", definition: "URL의 #identifier가 가리키는 같은 document 내 고유 id element입니다.", detail: ["skip link의 destination입니다.", "sticky header와 focus behavior를 test합니다."] },
      ],
      codeExamples: [
        {
          id: "visible-on-focus-skip-link",
          title: "focus될 때 보이는 skip link와 sticky header 보정",
          language: "html",
          filename: "skip-link.html",
          purpose: "반복 메뉴를 keyboard 한 번으로 건너고 target focus·scroll 위치를 시각적으로 확인합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>본문 바로가기</title>\n  <style>\n    .skip-link { position: fixed; inset-block-start: .5rem; inset-inline-start: .5rem; transform: translateY(-200%); padding: .75rem; background: #fff; color: #111; z-index: 1000; }\n    .skip-link:focus { transform: translateY(0); outline: .2rem solid #b33a00; }\n    header { position: sticky; inset-block-start: 0; background: #eee; }\n    main { scroll-margin-block-start: 6rem; }\n    main:focus { outline: .2rem solid #165a9e; outline-offset: .25rem; }\n  </style>\n</head>\n<body>\n  <a class=\"skip-link\" href=\"#content\">본문 바로가기</a>\n  <header>\n    <nav aria-label=\"주요 메뉴\"><a href=\"/\">홈</a> <a href=\"/curriculum\">학습 과정</a></nav>\n  </header>\n  <main id=\"content\" tabindex=\"-1\">\n    <h1>시맨틱 페이지 구조</h1>\n    <p>첫 번째 Tab과 Enter로 이 본문에 도착합니다.</p>\n  </main>\n</body>\n</html>",
          walkthrough: [
            { lines: "7-8", explanation: "skip link는 평소 viewport 위로 이동하지만 focus되면 고대비 배경·outline과 함께 화면에 나타납니다." },
            { lines: "9-11", explanation: "sticky header 아래 target이 가려지지 않게 scroll margin을 두고 main focus를 보이게 합니다." },
            { lines: "15", explanation: "첫 focusable element가 main fragment를 가리키는 실제 anchor입니다." },
            { lines: "19-22", explanation: "main은 고유 id와 tabindex=-1을 가져 일반 Tab stop을 추가하지 않으면서 target focus를 지원합니다." },
          ],
          run: { environment: ["현대 browser", "mouse 사용하지 않음"], command: "skip-link.html을 열고 Tab 한 번→Enter" },
          output: { value: "Tab 1: '본문 바로가기' link가 화면 좌상단에 나타남\nEnter: URL hash=#content\nviewport: sticky header 아래 main 시작이 보임\nfocus target: main#content\nvisible text: 시맨틱 페이지 구조", explanation: ["browser별 fragment focus 세부 behavior를 실제 target에서 확인합니다.", "skip link는 CSS가 실패해도 document 첫 link로 보이고 작동합니다.", "main landmark와 skip link는 서로 보완합니다."] },
          experiments: [
            { change: ".skip-link에 display:none을 적용합니다.", prediction: "첫 Tab으로 link에 도달할 수 없어 bypass 기능이 사라집니다.", result: "숨김 technique은 focus 가능성을 보존해야 합니다." },
            { change: "main의 id를 main-content로 바꾸고 href를 수정하지 않습니다.", prediction: "#content target이 없어 이동하지 않습니다.", result: "internal fragment link integrity를 자동 검사해야 합니다." },
            { change: "scroll-margin과 main focus outline을 제거합니다.", prediction: "sticky header가 heading을 가리거나 현재 위치를 시각적으로 확인하기 어렵습니다.", result: "semantic navigation과 visual focus/scroll feedback을 함께 설계합니다." },
          ],
          sourceRefs: ["wai-skip-link", "wai-page-structure", "web-layout-semantic-source"],
        },
      ],
      diagnostics: [
        { symptom: "skip link는 accessibility audit에 존재하지만 Tab으로 보이지 않거나 activation 후 header에 가려진다.", likelyCause: "display:none/clip 오류 또는 sticky header offset과 focus style을 검증하지 않았습니다.", checks: ["첫 Tab focus target을 확인합니다.", ":focus computed style과 viewport position을 봅니다.", "activation 뒤 activeElement·hash·target bounding box를 확인합니다."], fix: "focus 시 visible한 style, 유효한 fragment id, target focus 지원, scroll-margin을 적용합니다.", prevention: "모든 page template에서 첫 Tab→Enter bypass E2E test를 실행합니다." },
      ],
    },
    {
      id: "dom-reading-focus-order",
      title: "responsive CSS는 화면 위치를 바꿔도 DOM·reading·focus order의 논리를 깨뜨리지 않아야 합니다",
      lead: "float·Grid order로 aside를 왼쪽에 보이게 하는 것보다 source에서 무엇을 먼저 이해해야 하는지 결정합니다.",
      explanations: [
        "원본 float layout은 left/center/right source order와 visual order가 대체로 같습니다. CSS Grid를 도입할 때 grid-area로 시각 위치를 쉽게 바꿀 수 있지만 screen reader reading order와 keyboard Tab order는 주로 DOM을 따릅니다. 화면만 보고 DOM을 뒤섞지 않습니다.",
        "주 content를 먼저 읽어야 한다면 DOM에서 main article을 먼저 두고 보조 aside를 뒤에 둔 뒤 desktop grid에서 옆 column에 배치합니다. 그러나 navigation이 task 전에 꼭 필요하면 source 관계를 다르게 설계할 수 있습니다. 하나의 절대 규칙이 아니라 사용자 흐름과 content dependency로 결정합니다.",
        "positive tabindex로 visual order를 강제로 맞추면 유지보수하기 어려운 별도 focus sequence가 생깁니다. native DOM order와 tabindex=0/-1만으로 해결하고 CSS order가 focusable element의 인지 순서와 충돌하지 않게 합니다.",
        "fixed height 300/400px와 overflow clip은 text zoom·번역·dynamic error에서 content를 잘라냅니다. min-block-size 또는 content-driven height를 사용하고 Grid/Flex item의 min-width overflow를 점검합니다.",
      ],
      concepts: [
        { term: "reading order", definition: "DOM과 accessibility tree를 따라 content가 순차적으로 제시되는 논리 순서입니다.", detail: ["visual 좌우 위치와 다를 수 있습니다.", "CSS를 끄고도 자연스러워야 합니다."] },
        { term: "focus order", definition: "Tab/Shift+Tab 등으로 interactive element가 focus되는 순서입니다.", detail: ["대개 DOM order를 따릅니다.", "positive tabindex와 CSS reorder를 피합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "desktop 화면에서는 왼쪽 메뉴→본문 순서인데 Tab은 본문 link부터 이동해 사용자가 위치를 잃는다.", likelyCause: "CSS grid/flex order로 visual 위치만 바꾸고 DOM focus order는 반대로 남겼습니다.", checks: ["CSS를 끄고 DOM 순서를 읽습니다.", "Tab sequence를 번호로 기록합니다.", "grid-area/order와 positive tabindex를 확인합니다."], fix: "사용자 task에 맞는 logical DOM order로 markup하고 visual layout도 가능한 한 같은 순서를 유지합니다.", prevention: "breakpoint별 screenshot과 keyboard focus order를 함께 regression test합니다." },
        { symptom: "200% text zoom에서 footer가 content 위를 덮고 aside text가 잘린다.", likelyCause: "column에 fixed height와 clear/overflow layout을 사용했습니다.", checks: ["fixed height/overflow를 검색합니다.", "long Korean/English text와 200% zoom을 적용합니다.", "footer bounding box와 preceding content를 비교합니다."], fix: "content-driven block size와 Grid/Flex flow를 사용하고 필요한 min/max constraint만 둡니다.", prevention: "fixed-height content region을 lint/review하고 zoom·long-content visual test를 둡니다." },
      ],
    },
    {
      id: "responsive-semantic-shell",
      title: "semantic tree를 고정한 채 CSS Grid로 한 열→다열 layout을 점진적으로 적용합니다",
      lead: "mobile baseline에서는 자연스러운 document flow를 사용하고 충분한 폭에서만 navigation·article·aside를 배치합니다.",
      explanations: [
        "HTML은 content 관계와 reading order를 완성한 뒤 CSS를 추가합니다. 기본 한 열에서는 header→nav→main content→aside→footer가 자연스럽게 이어지고, media query에서 main 내부 grid를 두 열로 만듭니다. semantic element 이름을 CSS selector로 사용할 수 있지만 재사용 component에는 class를 병행할 수 있습니다.",
        "원본의 20%+70%+10% fixed percentage는 text의 최소 폭을 무시합니다. minmax(0,1fr), minmax(min-content, ...)와 clamp를 사용하고 aside 최소 읽기 폭을 고려합니다. navigation은 wrap되거나 disclosure pattern으로 전환하되 link가 잘리지 않습니다.",
        "float는 image 주변 text 흐름에는 여전히 적합하지만 page macro layout에는 Grid/Flex가 명확합니다. clear:both로 footer를 복구하는 대신 grid container가 row sizing을 담당합니다. 다음 CSS 과정에서 cascade·box·grid를 더 깊게 다룹니다.",
        "landmark와 heading은 breakpoint마다 바뀌지 않습니다. desktop에서 aside를 오른쪽, mobile에서 아래로 옮겨도 같은 aside element와 이름을 유지해 mode 전환 때 접근성 tree가 불필요하게 재구성되지 않게 합니다.",
      ],
      concepts: [
        { term: "mobile-first flow", definition: "좁은 화면의 자연스러운 DOM flow를 baseline으로 두고 넓은 화면에서 layout enhancement를 적용하는 방식입니다.", detail: ["content 우선순위를 먼저 드러냅니다.", "CSS 실패에도 한 열 문서가 남습니다."] },
        { term: "macro layout", definition: "page의 큰 영역과 column/row 관계를 배치하는 layout 단계입니다.", detail: ["Grid/Flex가 주로 담당합니다.", "semantic element 선택과 별개입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "semantic element로 바꾼 뒤 footer가 옆 column으로 올라오거나 nav 배경 높이가 0이 된다.", likelyCause: "기존 float와 clear hack을 그대로 유지한 채 markup만 변경했습니다.", checks: ["float formatting context와 parent height를 확인합니다.", "clear selector가 새 element에 적용되는지 봅니다.", "Grid/Flex로 macro layout을 단순화할 수 있는지 검토합니다."], fix: "page macro layout을 Grid/Flex로 재작성하고 float/clear/fixed height를 제거합니다.", prevention: "semantic refactor와 layout refactor를 visual+accessibility regression에서 함께 검증합니다." },
      ],
    },
    {
      id: "structure-verification",
      title: "page 구조는 source·heading·landmark·keyboard·CSS-off·responsive 다섯 관점에서 검증합니다",
      lead: "semantic tag 개수를 세는 대신 사용자가 원하는 영역과 content를 얼마나 빨리 찾고 관계를 이해하는지 측정합니다.",
      explanations: [
        "source/DOM에서 유일한 visible main, 실제 href nav links, body-level site header/footer와 nested article header/footer를 확인합니다. HTML validator는 invalid nesting을 찾지만 element 선택의 content 의미까지 판단하지 못하므로 사람 review가 필요합니다.",
        "heading만 목록으로 추출해 page title과 하위 주제가 계층적으로 이해되는지 봅니다. landmark만 목록으로 추출해 각 role과 name이 고유하고 과도하지 않은지 확인합니다. 같은 label이 여러 영역에 반복되면 더 구체적인 이름을 사용합니다.",
        "keyboard 첫 Tab에서 skip link를 활성화하고 main focus가 보이는지, nav link와 article link focus order가 visual order와 일치하는지 확인합니다. browser zoom·200% text·320px·long translation에서 clip과 horizontal overflow를 봅니다.",
        "CSS와 JavaScript를 끄고 document가 title→navigation→main heading→content→footer로 읽히며 모든 link가 작동하는지 확인합니다. progressive enhancement baseline이 살아 있으면 stylesheet/network failure에서도 학습 자료를 사용할 수 있습니다.",
        "자동 test는 main count, landmark accessible name, heading level, internal fragment, empty href, horizontal overflow를 검사합니다. article/aside 선택이 정확한지는 content owner와 접근성 reviewer가 실제 문맥으로 판단합니다.",
      ],
      concepts: [
        { term: "landmark map", definition: "rendered page의 landmark role·accessible name·DOM 순서를 기록한 구조 검증 자료입니다.", detail: ["중복·누락·과밀을 찾습니다.", "page template 회귀 test에 사용합니다."] },
        { term: "progressive baseline", definition: "CSS/JavaScript가 실패해도 semantic HTML과 native link로 핵심 content·navigation을 사용할 수 있는 최소 상태입니다.", detail: ["enhancement의 기반입니다.", "site reliability와 접근성을 함께 높입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "자동 접근성 검사 점수는 높지만 사용자는 landmark 15개와 같은 이름의 heading 8개 사이에서 길을 잃는다.", likelyCause: "semantic/ARIA를 양적으로 추가하고 정보 architecture와 이름 품질을 검토하지 않았습니다.", checks: ["landmark·heading 목록만으로 page를 찾아가 봅니다.", "중요하지 않은 region을 식별합니다.", "task별 탐색 횟수와 label 예측 가능성을 user test합니다."], fix: "landmark를 핵심 영역으로 줄이고 heading/name을 목적 중심으로 구체화하며 related content를 적절히 group합니다.", prevention: "자동 rule과 함께 실제 task 기반 keyboard/screen reader review를 release 기준에 둡니다." },
      ],
      expertNotes: [
        "SPA route 전환 시 DOM이 바뀌어도 browser가 새 document navigation처럼 title·main heading·focus를 자동 처리하지 않을 수 있습니다. route title을 갱신하고 main heading/focus announcement 전략을 구현하되 사용자의 focus를 예고 없이 빼앗지 않습니다.",
        "shadow DOM·micro-frontend가 여러 main/banner를 생성하지 않도록 page shell owner와 component semantic budget을 architecture contract로 정합니다.",
      ],
    },
  ],
  lab: {
    title: "float 기반 3열 학습 페이지를 semantic·responsive·keyboard page shell로 마이그레이션하기",
    scenario: "기존 page는 #header/#nav/#content/#footer와 .left/.center/.right float, fixed height를 사용합니다. 화면은 보이지만 link가 아니고 main/heading/skip structure가 없으며 zoom에서 content가 잘립니다.",
    setup: ["원본 ex14~17 네 file의 element tree·CSS layout·heading을 비교 표로 만듭니다.", "modern browser, keyboard, 320px/desktop viewport, 200% zoom, accessibility tree를 준비합니다.", "동일 content의 before/after screenshot과 landmark/heading list를 기록할 문서를 준비합니다."],
    steps: [
      "각 영역의 content purpose를 정의하고 div 유지/header/nav/main/section/article/aside/footer 선택 근거를 적습니다.",
      "page h1과 하위 h2/h3 outline을 먼저 작성하고 menu text를 실제 href link 목록으로 바꿉니다.",
      "body-level site header/nav, 유일한 main, 이름 있는 related aside, site footer를 올바른 DOM 순서로 배치합니다.",
      "document 첫 link로 visible-on-focus skip link와 main fragment/focus target을 구현합니다.",
      "float·clear·fixed height를 제거하고 mobile 한 열 baseline과 desktop Grid enhancement를 작성합니다.",
      "여러 nav/aside/section의 accessible name을 확인하고 불필요한 landmark를 제거합니다.",
      "CSS off, first Tab→Enter, full Tab order, heading/landmark list, 320px·200% zoom을 검증합니다.",
      "before/after에서 visual layout뿐 아니라 탐색 횟수·main 도달·content clip 결과를 비교합니다.",
    ],
    expectedResult: ["한 개의 고유 main과 목적이 분명한 landmark만 남습니다.", "heading 목록이 page h1→section h2→article h3 관계를 설명합니다.", "첫 Tab/Enter로 반복 navigation을 건너 main에 도달하고 focus가 보입니다.", "nav 항목은 실제 link이며 current page가 식별됩니다.", "CSS가 없어도 읽히고 320px·200% zoom에서 content가 잘리지 않습니다.", "visual order·DOM reading order·keyboard focus order가 사용자 task와 일치합니다."],
    cleanup: ["before file은 research evidence로만 보관하고 public example에는 개인정보·private URL을 넣지 않습니다.", "임시 outline/landmark debug CSS와 duplicate role을 제거합니다."],
    extensions: ["client-side route 전환 후 document.title·h1·focus announcement를 구현하고 back/forward를 test합니다.", "breadcrumb nav와 local table-of-contents nav의 이름·current state를 추가합니다.", "실제 학습 site page template에 main count·skip target·heading/landmark assertions를 통합합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "#header/#nav/#content/#footer div page를 native semantic shell로 바꾸세요.", requirements: ["site header, 실제 link가 있는 이름 있는 nav, 유일한 main, site footer를 사용합니다.", "page 목적 h1을 main에 둡니다.", "CSS class/id는 필요할 때 유지하되 역할 근거를 적습니다.", "CSS를 꺼도 content 순서가 자연스럽습니다."], hints: ["element 이름은 top/left 같은 위치가 아니라 purpose로 고릅니다.", "nav 안 text li는 link가 아닙니다."], expectedOutcome: "landmark 목록에서 banner/navigation/main/contentinfo를 구분하고 모든 menu를 keyboard로 사용할 수 있습니다.", solutionOutline: ["content 역할 표를 먼저 만듭니다.", "markup 후 기존 style selector를 class 기반으로 조정합니다."] },
    { difficulty: "응용", prompt: "학습 과정 page에 section·article·aside와 skip link를 추가하고 responsive Grid로 배치하세요.", requirements: ["heading h1→h2→h3 계층을 유지합니다.", "독립 session card만 article로 사용합니다.", "관련 복습을 이름 있는 aside로 둡니다.", "first Tab→Enter로 main에 이동합니다.", "mobile 한 열·desktop 다열에서 DOM/focus order가 논리적입니다."], hints: ["section마다 실제 주제 heading이 있는지 확인합니다.", "fixed height와 positive tabindex를 사용하지 않습니다."], expectedOutcome: "heading·landmark·skip·responsive·zoom test가 모두 통과하고 CSS off에서도 읽힙니다.", solutionOutline: ["DOM baseline을 완성한 뒤 Grid를 추가합니다.", "breakpoint별 Tab sequence를 기록합니다."] },
    { difficulty: "설계", prompt: "SSR/SPA/micro-frontend가 공유하는 page shell semantic contract와 회귀 검사를 설계하세요.", requirements: ["main/banner/navigation/contentinfo ownership과 최대 개수 rule을 정의합니다.", "route title·h1·focus·skip target lifecycle을 설명합니다.", "component heading level과 landmark name strategy를 설계합니다.", "CSS reorder·portal·modal·hidden route tree 위험을 포함합니다.", "automated assertions와 screen reader task review 경계를 정의합니다."], hints: ["각 team이 main을 하나씩 만들면 page 전체는 깨집니다.", "route change는 full document navigation과 다른 focus/title behavior를 가집니다."], expectedOutcome: "여러 framework/team에서도 한 page로 일관된 landmark·heading·focus model을 유지하는 구현 가능한 contract가 완성됩니다.", solutionOutline: ["page shell owner와 slot semantics를 먼저 정합니다.", "rendered DOM fixture로 invariant test를 만듭니다."] },
  ],
  reviewQuestions: [
    { question: "semantic element를 쓰면 layout CSS가 필요 없나요?", answer: "아닙니다. HTML은 역할과 구조, CSS는 배치와 표현을 담당합니다. semantic tree 위에 Grid/Flex를 적용합니다." },
    { question: "모든 div를 section으로 바꾸면 더 semantic한가요?", answer: "아닙니다. section은 heading으로 식별되는 thematic grouping입니다. 단순 style wrapper는 div가 적합할 수 있습니다." },
    { question: "article과 section의 차이는 무엇인가요?", answer: "article은 별도로 배포해도 이해되는 self-contained composition이고 section은 문서 안의 thematic grouping입니다." },
    { question: "aside는 오른쪽 column을 뜻하나요?", answer: "아닙니다. 주 content와 간접 관련된 보조 content이며 화면 위치는 CSS가 결정합니다." },
    { question: "nav 안에 li text만 있으면 navigation인가요?", answer: "실제 이동이 필요하면 유효한 href를 가진 a link가 있어야 native navigation behavior를 제공합니다." },
    { question: "heading level은 글자 크기로 고르면 되나요?", answer: "아닙니다. h1~h6은 content 계층을 표현하고 시각 크기는 CSS로 정합니다." },
    { question: "main landmark만 있으면 skip link가 필요 없나요?", answer: "landmark navigation을 사용하지 않는 keyboard 사용자도 있으므로 visible-on-focus skip link가 반복 block bypass를 보완합니다." },
    { question: "CSS order로 visual 순서를 바꾸면 screen reader 순서도 바뀌나요?", answer: "대개 DOM/accessibility tree 순서는 그대로입니다. visual·reading·focus 순서가 충돌하지 않게 DOM을 논리적으로 설계합니다." },
    { question: "native nav에 role=navigation을 또 붙여야 하나요?", answer: "대개 불필요합니다. native semantics를 우선하고 ARIA는 실제로 부족한 의미를 보강할 때만 사용합니다." },
  ],
  completionChecklist: [
    "각 page 영역을 위치가 아니라 content purpose로 semantic/generic element에 배치했다.",
    "실제 href link가 있는 이름 있는 nav와 한 개의 사용자-visible main을 제공했다.",
    "section·article·aside를 주제·독립성·관련성 기준으로 선택했다.",
    "h1→h2→h3 heading 계층이 CSS 없이도 문서 목차를 설명한다.",
    "첫 focusable skip link가 유효한 main target으로 이동하고 focus가 보인다.",
    "불필요하거나 이름 없는 landmark와 중복 ARIA role을 제거했다.",
    "DOM·screen reader reading·keyboard focus·visual order가 사용자 흐름과 일치한다.",
    "CSS off·320px·200% zoom·long content에서 clip과 horizontal overflow 없이 완료했다.",
  ],
  nextSessions: ["html-10-document-capstone"],
  sources: [
    { id: "web-layout-div-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day04/ex14_layout.html", usedFor: ["div id page shell", "float 2-column", "clear footer", "multiple h1"], evidence: "non-semantic header/nav/content/footer div 구조를 baseline으로 audit해 role·heading·layout 책임을 분리했습니다." },
    { id: "web-layout-section-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day04/ex15_layout.html", usedFor: ["horizontal menu", "section left/right", "float", "content grouping"], evidence: "generic shell 안 section 도입 단계를 검토해 section을 layout wrapper로 남용하지 않는 기준을 만들었습니다." },
    { id: "web-layout-aside-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day04/ex16_layout.html", usedFor: ["3-column layout", "aside", "20/70/10 percentage", "fixed height"], evidence: "aside가 추가된 3열 구조를 content relevance·DOM order·zoom/overflow 관점에서 분석했습니다." },
    { id: "web-layout-semantic-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day04/ex17_layout.html", usedFor: ["header·nav·main·section·aside·footer", "semantic migration", "float layout"], evidence: "최종 semantic element version을 실제 link·main uniqueness·heading·skip·Grid를 갖춘 production shell로 확장했습니다." },
    { id: "whatwg-sections", repository: "WHATWG HTML Standard", path: "multipage/sections.html", publicUrl: "https://html.spec.whatwg.org/multipage/sections.html", usedFor: ["article·section·nav·aside", "header·footer", "heading", "main"], evidence: "2026-07-12 기준 living standard의 section element semantics와 contextual header/footer 정의를 선택 기준으로 확인했습니다." },
    { id: "whatwg-dom-semantics", repository: "WHATWG HTML Standard", path: "multipage/dom.html", publicUrl: "https://html.spec.whatwg.org/multipage/dom.html", usedFor: ["HTML semantics", "sectioning content", "heading/subheading boundary"], evidence: "HTML이 presentation보다 meaning을 전달한다는 semantic model을 div/element 비교의 기준으로 사용했습니다." },
    { id: "wai-page-structure", repository: "W3C Web Accessibility Initiative", path: "tutorials/page-structure/", publicUrl: "https://www.w3.org/WAI/tutorials/page-structure/", usedFor: ["page regions", "landmarks", "headings", "content structure", "bypass blocks"], evidence: "2026-04 갱신된 WAI page structure guidance를 landmark·heading·navigation verification에 반영했습니다." },
    { id: "wai-content-structure", repository: "W3C Web Accessibility Initiative", path: "tutorials/page-structure/content/", publicUrl: "https://www.w3.org/WAI/tutorials/page-structure/content/", usedFor: ["article", "section", "lists", "semantic extensibility"], evidence: "self-contained article과 thematic section guidance를 content role 비교에 사용했습니다." },
    { id: "wai-skip-link", repository: "W3C Web Accessibility Initiative", path: "WCAG22/Techniques/general/G1", publicUrl: "https://www.w3.org/WAI/WCAG22/Techniques/general/G1", usedFor: ["skip to main", "bypass repeated blocks", "keyboard"], evidence: "page 시작 link로 main content를 직접 이동하는 W3C technique을 skip-link example과 E2E 기준에 반영했습니다." },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "원본은 non-semantic div에서 semantic page element로 진화하는 과정을 명확히 보여 줍니다. 실제 link, landmark naming, skip link, DOM/focus order, SPA lifecycle은 현재 WHATWG/W3C WAI guidance로 보강했습니다.",
      "Grid/Flex의 상세 syntax·track sizing·container query는 다음 CSS module에서, SPA route focus와 component heading API는 React 과정에서 다시 구현합니다.",
    ],
  },
} satisfies DetailedSession;

(session.chapters as DetailedSession["chapters"]).push(
  {
    id: "landmark-heading-ownership-aria-first",
    title: "landmark와 heading은 component 수가 아니라 page 전체 정보 구조의 소유권 계약입니다",
    lead: "각 component가 스스로 main·nav·h1을 만들면 개별 조각은 그럴듯해도 page에는 중복 landmark와 끊긴 outline이 생깁니다. shell과 content slot의 책임을 먼저 정합니다.",
    explanations: [
      "body-level header는 보통 banner, footer는 contentinfo가 되지만 article/section 안 header·footer는 그 content의 introduction/footer일 뿐 같은 page landmark를 무한히 늘리지 않습니다. main은 사용자에게 보이는 page 주 content 하나를 기본으로 하고 hidden route trees도 중복 노출되지 않게 합니다.",
      "nav는 주요 link section에 사용하고 같은 page에 여러 nav가 있으면 `주요 탐색`, `현재 위치`, `이 글의 목차`처럼 목적을 accessible name으로 구분합니다. 모든 link 묶음이 landmark일 필요는 없으며 footer의 짧은 legal links는 문맥에 따라 nav 없이도 충분합니다.",
      "page shell은 route별 h1 slot과 main을 소유하고 content component는 전달받은 heading level 또는 h2 이하의 local structure를 사용합니다. heading을 visual size prop으로 선택하지 않고 의미 level과 style variant를 분리합니다.",
      "native HTML가 같은 의미와 behavior를 제공하면 그것을 먼저 사용합니다. nav/main/button/details/summary에 불필요한 동일 role을 중복하지 않고, ARIA는 semantic을 보완할 뿐 keyboard behavior·focus·validation을 자동 구현하지 않는다는 first rule을 지킵니다.",
    ],
    concepts: [
      { term: "semantic ownership", definition: "page shell과 components 중 누가 main·h1·navigation name·focus lifecycle을 생성하고 유지하는지 정한 책임 경계입니다.", detail: ["중복 landmark·heading을 방지합니다.", "SSR·SPA·micro-frontend에서 contract로 공유합니다."] },
      { term: "ARIA-first rule", definition: "필요한 의미와 behavior를 제공하는 native HTML를 우선하고 ARIA는 부족한 접근성 의미만 보완한다는 원칙입니다.", detail: ["중복 role을 피합니다.", "ARIA만으로 keyboard behavior가 생기지 않습니다."] },
    ],
    codeExamples: [
      {
        id: "page-landmark-map-audit",
        title: "header·named nav·main·article·aside·footer의 page landmark map 검사",
        language: "html",
        filename: "landmark-map.html",
        purpose: "native semantic shell에서 landmark 수·name·heading과 article/aside labeling을 exact DOM output과 accessibility snapshot으로 확인합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>DOM 학습 노트</title></head>\n<body>\n  <header><p>NOTE TESTER</p></header>\n  <nav aria-label=\"주요 탐색\"><a href=\"/\">홈</a><a href=\"/web/\">웹</a></nav>\n  <main id=\"main\">\n    <h1>DOM 학습 노트</h1>\n    <article aria-labelledby=\"lesson-title\">\n      <h2 id=\"lesson-title\">Node와 Element</h2><p>DOM tree 관계를 복습합니다.</p>\n    </article>\n    <aside aria-labelledby=\"related-title\"><h2 id=\"related-title\">관련 복습</h2><a href=\"/web/html/\">HTML 구조</a></aside>\n  </main>\n  <footer><p>학습자료 갱신: 2026-07-14</p></footer>\n  <pre id=\"result\"></pre>\n  <script>\n    const landmarkTags = [...document.querySelectorAll(\"body > header, body > nav, body > main, main > aside, body > footer\")].map((item) => item.tagName);\n    const headings = [...document.querySelectorAll(\"h1,h2\")].map((item) => `${item.tagName}:${item.textContent}`);\n    const lines = [\n      `landmarks=${landmarkTags.join(\",\")}`,\n      `mainCount=${document.querySelectorAll(\"main\").length}`,\n      `navName=${document.querySelector(\"nav\").getAttribute(\"aria-label\")}`,\n      `headings=${headings.join(\"|\")}`,\n      `articleLabel=${document.querySelector(\"article\").getAttribute(\"aria-labelledby\")}`,\n      `asideLabel=${document.querySelector(\"aside\").getAttribute(\"aria-labelledby\")}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-6", explanation: "독립 title, site header와 이름 있는 primary nav를 작성합니다." },
          { lines: "7-15", explanation: "유일한 main과 h1, labelled article/h2, labelled related aside/h2를 DOM reading order로 배치합니다." },
          { lines: "16-20", explanation: "site footer와 result를 두고 page-level landmark candidates·headings를 수집합니다." },
          { lines: "21-27", explanation: "landmark tags·main count·nav name·outline·label references를 exact string으로 기록합니다." },
          { lines: "28-30", explanation: "문서를 닫습니다. 실제 role/name은 browser accessibility snapshot으로 확인합니다." },
        ],
        run: { environment: ["현대 browser", "JavaScript 활성화", "network 불필요"], command: "landmark-map.html을 열고 #result 및 Accessibility tree의 banner/navigation/main/complementary/contentinfo를 확인" },
        output: { value: "landmarks=HEADER,NAV,MAIN,ASIDE,FOOTER\nmainCount=1\nnavName=주요 탐색\nheadings=H1:DOM 학습 노트|H2:Node와 Element|H2:관련 복습\narticleLabel=lesson-title\nasideLabel=related-title", explanation: ["native elements가 page-level landmark map을 구성합니다.", "article과 aside는 실제 heading id로 이름을 얻습니다.", "DOM output과 accessibility snapshot을 분리해 implicit role/name을 검증합니다."] },
        experiments: [
          { change: "article마다 main을 추가합니다.", prediction: "mainCount가 늘고 page 주 content landmark가 중복됩니다.", result: "main ownership은 page shell 한 곳에 둡니다." },
          { change: "nav aria-label을 제거하고 같은 nav를 두 개 만듭니다.", prediction: "navigation landmark 목록에서 목적을 구분하기 어렵습니다.", result: "여러 navigation에는 unique purpose name을 제공합니다." },
        ],
        sourceRefs: ["web-layout-div-source", "web-layout-semantic-source", "whatwg-dom-semantics", "whatwg-sections", "wai-page-structure", "wai-landmark-regions"],
      },
      {
        id: "heading-outline-component-contract",
        title: "page h1→section h2→article h3의 component heading contract 검사",
        language: "html",
        filename: "heading-contract.html",
        purpose: "두 thematic sections와 self-contained article에서 실제 tag rank·text·section labeling이 logical outline을 만드는지 DOM으로 검증합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>HTML 과정</title></head>\n<body>\n  <main>\n    <h1>HTML 과정</h1>\n    <section aria-labelledby=\"basics\">\n      <h2 id=\"basics\">문서 기초</h2>\n      <article><h3>DOM tree 실습</h3><p>Node 관계를 관찰합니다.</p></article>\n      <article><h3>링크 실습</h3><p>URL을 계산합니다.</p></article>\n    </section>\n    <section aria-labelledby=\"forms\">\n      <h2 id=\"forms\">Form과 HTTP</h2><p>전송 entry를 검증합니다.</p>\n    </section>\n    <pre id=\"result\"></pre>\n  </main>\n  <script>\n    const headings = [...document.querySelectorAll(\"h1,h2,h3,h4,h5,h6\")];\n    const ranks = headings.map((heading) => Number(heading.tagName.slice(1)));\n    const skipped = ranks.some((rank, index) => index > 0 && rank > ranks[index - 1] + 1);\n    const lines = [\n      `outline=${headings.map((heading) => `${heading.tagName}:${heading.textContent}`).join(\"|\")}`,\n      `ranks=${ranks.join(\",\")}`,\n      `skipped=${skipped}`,\n      `sections=${document.querySelectorAll(\"section\").length}`,\n      `articles=${document.querySelectorAll(\"article\").length}`,\n      `labels=${[...document.querySelectorAll(\"section\")].map((section) => section.getAttribute(\"aria-labelledby\")).join(\",\")}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-6", explanation: "독립 title과 page h1을 작성합니다." },
          { lines: "7-16", explanation: "문서 기초 section h2 아래 두 self-contained article h3와 형제 Form section h2를 배치합니다." },
          { lines: "17-22", explanation: "모든 heading ranks를 DOM order로 추출하고 아래 방향 rank jump를 계산합니다." },
          { lines: "23-29", explanation: "outline·ranks·skip·section/article 수와 label references를 기록합니다." },
          { lines: "30-32", explanation: "문서를 닫습니다. visual font 크기와 semantic rank를 독립적으로 유지합니다." },
        ],
        run: { environment: ["현대 browser", "JavaScript 활성화", "network 불필요"], command: "heading-contract.html을 열고 #result와 accessibility heading list를 확인" },
        output: { value: "outline=H1:HTML 과정|H2:문서 기초|H3:DOM tree 실습|H3:링크 실습|H2:Form과 HTTP\nranks=1,2,3,3,2\nskipped=false\nsections=2\narticles=2\nlabels=basics,forms", explanation: ["h3 뒤 형제 h2로 돌아가는 것은 정상적인 outline 종료입니다.", "아래 방향으로 한 level을 넘는 jump가 없습니다.", "각 section은 실제 h2 id로 식별됩니다."] },
        experiments: [
          { change: "DOM tree 실습을 디자인 크기 때문에 h5로 바꿉니다.", prediction: "ranks가 1,2,5...가 되어 skipped=true입니다.", result: "semantic level과 visual variant를 component API에서 분리합니다." },
          { change: "article을 page 밖으로 별도 배포합니다.", prediction: "h3만 남으면 독립 page 대표 heading 문맥이 부족합니다.", result: "독립 route에서는 shell이 h1 ownership을 제공하도록 component contract를 바꿉니다." },
        ],
        sourceRefs: ["web-layout-section-source", "web-layout-aside-source", "whatwg-sections", "wai-content-structure"],
      },
    ],
    diagnostics: [
      { symptom: "component마다 h1·main을 렌더해 한 page에 main 세 개와 같은 제목 다섯 개가 생긴다.", likelyCause: "semantic level과 landmark ownership을 component 내부에 고정하고 page composition contract가 없습니다.", checks: ["rendered DOM의 main count와 heading/landmark map을 추출합니다.", "component props와 page shell slots를 봅니다.", "hidden route·portal·micro-frontend tree도 accessibility exposure를 확인합니다."], fix: "page shell이 main·h1을 소유하고 components는 context-aware heading level과 labelled section/article를 받게 설계합니다.", prevention: "rendered page fixture에 unique visible main·single route h1·named landmark budget assertions를 둡니다." },
    ],
    expertNotes: ["heading rank 자동 검사에서 모든 h3→h2 transition을 오류로 보면 안 됩니다. 아래 방향 jump와 실제 section ownership을 구분하고 outline 문구 품질은 사람 review합니다.", "ARIA role을 추가해 native element의 잘못된 nesting을 덮지 않습니다. 먼저 HTML content model과 DOM tree를 고칩니다."],
  },
  {
    id: "focus-lifecycle-keyboard-native-behavior",
    title: "focus는 DOM order·native keyboard behavior·route/component lifecycle을 따라 예측 가능하게 이동해야 합니다",
    lead: "시각 highlight만 있는 상태와 실제 keyboard focus는 다릅니다. skip, disclosure, dialog, SPA route transition과 제거되는 node마다 activeElement가 어디로 가는지 acceptance criterion을 둡니다.",
    explanations: [
      "Tab sequence는 기본적으로 DOM order의 native links·buttons·form controls를 따릅니다. positive tabindex로 시각 order를 따라가게 억지로 고치지 말고 source DOM과 responsive layout을 같은 logical order로 만듭니다. tabindex=-1은 programmatic focus target에 사용할 수 있습니다.",
      "skip link는 첫 Tab에서 보이고 activation하면 main으로 scroll/focus가 이동해야 합니다. main의 tabindex=-1은 일반 Tab stop을 추가하지 않으면서 focus target이 되게 하며 outline을 무조건 제거하지 않습니다.",
      "disclosure는 details/summary 또는 button aria-expanded 같은 native-first pattern을 사용합니다. custom div role=button을 선택하면 Enter·Space, focus style, disabled, name/state를 모두 직접 구현해야 하므로 정당화와 AT test가 필요합니다.",
      "SPA route 변경은 full navigation처럼 focus·title을 자동 초기화하지 않습니다. 사용자가 link를 activation한 뒤 새 route title/h1이 준비되면 main 또는 heading으로 focus를 이동할지 결정하고 back/forward·loading·error에서 focus를 잃지 않습니다. modal을 닫으면 유효한 trigger 또는 다음 logical control로 복구합니다.",
    ],
    concepts: [
      { term: "focus lifecycle", definition: "사용자 action과 DOM/route 변화 전후 activeElement를 어디에 두고 어떻게 보이게 할지 정한 sequence입니다.", detail: ["제거·숨김 node를 처리합니다.", "trigger return과 route announcement를 포함합니다."] },
      { term: "programmatic focus target", definition: "Tab sequence에는 없지만 skip·error·route transition에서 script나 fragment 후 focus할 수 있는 element입니다.", detail: ["tabindex=-1을 사용할 수 있습니다.", "visible focus와 문맥을 제공합니다."] },
    ],
    codeExamples: [
      {
        id: "skip-native-disclosure-focus-audit",
        title: "skip link로 main focus 이동 후 native details disclosure를 연 상태와 Tab 후보 검사",
        language: "html",
        filename: "focus-lifecycle.html",
        purpose: "positive tabindex 없이 logical interactive order, main programmatic focus와 native details/summary open state를 exact DOM output으로 확인합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>focus lifecycle</title></head>\n<body>\n  <a id=\"skip\" href=\"#main\">본문으로 건너뛰기</a>\n  <header><p>학습자료</p></header>\n  <nav aria-label=\"주요 탐색\"><a id=\"home\" href=\"/\">홈</a></nav>\n  <main id=\"main\" tabindex=\"-1\">\n    <h1>접근성 구조</h1>\n    <details id=\"more\"><summary id=\"summary\">추가 설명</summary><p>native disclosure 내용</p></details>\n    <button id=\"route\" type=\"button\">다음 주제로 이동</button>\n    <pre id=\"result\"></pre>\n  </main>\n  <script>\n    const skip = document.querySelector(\"#skip\");\n    const main = document.querySelector(\"#main\");\n    const details = document.querySelector(\"#more\");\n    skip.addEventListener(\"click\", (event) => { event.preventDefault(); main.focus(); });\n    skip.click();\n    details.open = true;\n    const tabOrder = [...document.querySelectorAll(\"a[href],button,summary,[tabindex]\")]\n      .filter((item) => item.tabIndex >= 0).map((item) => item.id);\n    const lines = [\n      `active=${document.activeElement.id}`,\n      `mainTabIndex=${main.tabIndex}`,\n      `tabOrder=${tabOrder.join(\",\")}`,\n      `detailsOpen=${details.open}`,\n      `summaryTag=${document.querySelector(\"#summary\").tagName}`,\n      `explicitRoles=${document.querySelectorAll(\"[role]\").length}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-7", explanation: "첫 focusable skip link와 site header/named navigation을 작성합니다." },
          { lines: "8-14", explanation: "tabindex=-1 main, h1, native details/summary, route button과 result를 DOM task order로 둡니다." },
          { lines: "15-22", explanation: "skip activation으로 main에 focus하고 native details를 열어 lifecycle state를 만듭니다." },
          { lines: "23-32", explanation: "non-negative tabIndex candidates, active element, details와 explicit ARIA role 수를 기록합니다." },
          { lines: "33-34", explanation: "문서를 닫습니다. 실제 browser keyboard test에서는 Tab→Enter와 visible focus를 수동 확인합니다." },
        ],
        run: { environment: ["현대 browser", "keyboard", "JavaScript 활성화"], command: "focus-lifecycle.html을 열고 #result 확인 후 새로고침하여 Tab·Enter로 skip과 summary를 실제 조작" },
        output: { value: "active=main\nmainTabIndex=-1\ntabOrder=skip,home,summary,route\ndetailsOpen=true\nsummaryTag=SUMMARY\nexplicitRoles=0", explanation: ["skip activation 뒤 main이 programmatic focus를 받지만 일반 Tab order에는 포함되지 않습니다.", "native summary가 별도 ARIA role 없이 focusable disclosure control이 됩니다.", "logical Tab 후보는 source DOM 순서를 유지합니다."] },
        experiments: [
          { change: "main tabindex를 5로 바꿉니다.", prediction: "main이 positive tabindex로 앞선 Tab 순서를 왜곡합니다.", result: "programmatic target에는 -1을 사용하고 positive tabindex를 피합니다." },
          { change: "details/summary를 div role=button으로 바꿉니다.", prediction: "role만으로 open state·Enter/Space·focus behavior가 생기지 않습니다.", result: "native behavior가 요구를 충족하면 native element를 우선합니다." },
        ],
        sourceRefs: ["web-layout-div-source", "whatwg-dom-semantics", "wai-skip-link", "wai-landmark-regions"],
      },
    ],
    diagnostics: [
      { symptom: "skip activation·dialog close·route change 뒤 focus가 body로 사라지거나 hidden old route에 남는다.", likelyCause: "DOM visibility/removal만 갱신하고 activeElement lifecycle과 fallback target을 설계하지 않았습니다.", checks: ["action 전후 document.activeElement를 기록합니다.", "target이 hidden/inert/disconnected인지 봅니다.", "title·h1 준비 timing과 back/forward path를 확인합니다."], fix: "action별 trigger return 또는 새 main/heading focus policy를 정하고 valid connected target이 준비된 뒤 visible focus를 이동합니다.", prevention: "keyboard E2E에 activeElement sequence, removed trigger, loading/error/back-forward fixtures를 포함합니다." },
    ],
    expertNotes: ["자동 focus는 사용자의 virtual cursor나 typing을 예고 없이 빼앗을 수 있습니다. full route·modal·error summary처럼 명확한 context change에서만 최소한으로 적용합니다.", "CSS :focus-visible을 style하되 native outline을 제거한 뒤 대체하지 않는 실수를 피하고 forced-colors/high contrast에서도 indicator를 확인합니다."],
  },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "article 안 header도 항상 banner landmark인가요?", answer: "아닙니다. body-level site header와 달리 article/section 내부 header는 해당 content의 introduction이며 보통 page banner가 아닙니다." },
  { question: "page에 nav가 여러 개면 어떻게 구분하나요?", answer: "주요 탐색·현재 위치·이 글의 목차처럼 목적을 accessible name으로 구분하고 불필요한 nav landmark는 줄입니다." },
  { question: "component가 재사용되려면 h1을 내부에 고정해야 하나요?", answer: "아닙니다. page shell이 route h1을 소유하고 component는 context에 맞는 heading level과 style variant를 분리합니다." },
  { question: "role=button을 붙이면 div가 native button처럼 동작하나요?", answer: "아닙니다. focus·Enter/Space·disabled·state behavior를 직접 구현해야 하므로 native button을 우선합니다." },
  { question: "tabindex=-1은 element를 영원히 focus할 수 없게 하나요?", answer: "아닙니다. 일반 Tab sequence에서는 빠지지만 script나 fragment handling으로 programmatic focus target이 될 수 있습니다." },
  { question: "SPA route 변경 때 document.title만 바꾸면 충분한가요?", answer: "아닙니다. h1·main content와 focus/announcement, loading/error/back-forward lifecycle도 함께 관리합니다." },
);

(session.completionChecklist as string[]).push(
  "page shell이 unique visible main·route h1·site landmark와 focus lifecycle을 소유한다.",
  "여러 nav·aside·region에 purpose-specific accessible name을 제공하고 landmark budget을 검토했다.",
  "heading level과 visual style을 분리하고 rendered outline의 아래 방향 rank jump를 검사했다.",
  "native HTML가 제공하는 semantics/behavior를 우선하고 중복·보상용 ARIA를 제거했다.",
  "skip link·tabindex=-1 main·native disclosure를 실제 Tab/Enter/Escape와 activeElement로 검증했다.",
  "DOM·visual·reading·focus order를 breakpoint·zoom·long content에서 일치시켰다.",
  "SPA route·modal·removed trigger·loading/error/back-forward의 focus return/announcement를 E2E test했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "wai-landmark-regions", repository: "W3C WAI ARIA Authoring Practices Guide", path: "practices/landmark-regions/", publicUrl: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/", usedFor: ["landmark purpose", "region naming", "duplicate landmark labels", "page region map", "native landmark preference"], evidence: "2026-07-14에 WAI APG landmark regions guidance를 확인해 landmark ownership·naming·과밀 방지 검증에 사용했습니다." },
);

export default session;
