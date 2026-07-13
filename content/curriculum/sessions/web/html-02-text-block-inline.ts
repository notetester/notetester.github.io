import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["html-02-text-block-inline"],
  slug: "html-02-text-block-inline",
  courseId: "web",
  moduleId: "01-html-document-forms",
  order: 2,
  title: "제목·문단·텍스트 의미와 블록/인라인 흐름",
  subtitle: "글자를 크게·굵게 보이게 만드는 태그 암기에서 벗어나, 제목 계층·문단·공백·강조의 의미와 HTML 콘텐츠 모델, CSS 박스 흐름을 분리해 읽습니다.",
  level: "입문",
  estimatedMinutes: 170,
  coreQuestion: "같은 글자라도 h1~h6·p·pre·div·span·strong·em 중 무엇으로 표시해야 하며, HTML의 의미와 브라우저의 줄 흐름은 어떻게 구분할까요?",
  summary: "webstudy day01의 제목, 문단, div, 글자 서식 원본 네 파일을 실제 브라우저로 실행해 출발점으로 삼습니다. h1~h6의 계층, p의 구조적 문단, 공백 접기와 pre의 보존, br·hr의 정확한 목적, div·span의 중립성, strong·em과 b·i·mark·small·sub·sup·ins·del의 의미를 연결합니다. 또한 전통적인 '블록 태그/인라인 태그' 설명을 HTML 콘텐츠 모델과 CSS display로 분리하고, 잘못된 p/div 중첩의 파서 복구·접근성·유지보수·사용자 입력 보안까지 검증합니다.",
  objectives: [
    "h1~h6을 글자 크기가 아니라 문서의 주제·하위 주제 관계에 맞게 선택하고 제목 목록을 설명할 수 있다.",
    "p의 문단 의미와 일반 공백 접기, pre의 서식 보존, br의 강제 줄바꿈, hr의 주제 전환을 구분할 수 있다.",
    "HTML의 flow·phrasing 콘텐츠 모델과 CSS의 block·inline 표시 방식을 서로 다른 층으로 설명할 수 있다.",
    "div와 span을 의미 있는 요소가 없을 때만 쓰는 중립 컨테이너로 사용하고 잘못된 p/div 중첩을 진단할 수 있다.",
    "strong의 중요성·긴급성과 em의 강세를 단순 굵게·기울임 스타일과 구분할 수 있다.",
    "원본의 h0·h7·big 같은 비표준·폐기 요소를 현재 표준 요소와 CSS로 교정할 수 있다.",
    "DevTools의 DOM·Computed Style·Accessibility tree를 함께 사용해 소스, 의미, 화면 결과를 검증할 수 있다.",
  ],
  prerequisites: [
    {
      title: "HTML5 문서가 DOM 트리가 되는 과정",
      reason: "이 세션은 태그 문자열과 DOM 요소를 구분하고 부모·자식 관계를 읽는 능력을 전제로 합니다. 파서가 잘못된 문단 중첩을 복구하는 이유도 실제 DOM 트리에서 확인합니다.",
      sessionSlug: "html-01-document-anatomy-dom-tree",
    },
  ],
  keywords: ["heading", "h1", "paragraph", "p", "pre", "white-space", "br", "hr", "div", "span", "strong", "em", "flow content", "phrasing content", "display", "accessibility"],
  chapters: [
    {
      id: "meaning-content-boxes",
      title: "HTML 의미, DOM 콘텐츠 모델, CSS 박스 흐름은 같은 분류가 아닙니다",
      lead: "무엇을 말하는지는 HTML이, 어떤 자식을 허용하는지는 콘텐츠 모델이, 줄과 상자를 어떻게 배치하는지는 CSS가 결정합니다.",
      explanations: [
        "원본은 제목·p·div를 블록 레벨, span을 인라인이라고 소개합니다. 첫 화면을 예측하는 입문용 지름길로는 유용하지만 이를 요소의 영구 속성으로 외우면 곧 모순을 만납니다. 브라우저 기본 스타일시트가 보통 h1·p·div에 display:block, span·strong·em에 display:inline을 주지만 작성자 CSS로 값을 바꿀 수 있습니다.",
        "HTML 표준의 flow content는 body 안의 일반 문서 흐름에 놓일 수 있는 넓은 범주이고, phrasing content는 문장과 문단 내부 수준의 텍스트 및 요소 범주입니다. p는 phrasing content만 자식으로 허용하지만 div는 flow content를 담을 수 있습니다. 이 허용 관계는 CSS로 span을 block처럼 보이게 만들어도 바뀌지 않습니다.",
        "CSS display는 요소가 box tree에서 바깥 흐름에 block 또는 inline 방식으로 참여하는지, 내부 자식을 flow·flex·grid 중 무엇으로 배치하는지 정합니다. 반면 제목·문단·중요성 같은 의미는 document tree의 HTML 요소에서 옵니다. 화면 모양과 의미가 우연히 같은 기본값을 가질 뿐 동일한 개념은 아닙니다.",
        "따라서 요소 선택 순서는 '새 줄이 필요한가?'가 아니라 '이 콘텐츠가 제목인가, 문단인가, 중요 경고인가, 단순 묶음인가?'부터 시작합니다. 의미 있는 요소를 고른 뒤 CSS로 원하는 시각 흐름을 만듭니다. 이 순서를 지키면 CSS 제거, 읽기 모드, 검색 색인, 보조기술에서도 정보 구조가 남습니다.",
      ],
      concepts: [
        { term: "flow content", definition: "body의 일반 문서 흐름에서 사용할 수 있는 HTML 콘텐츠 범주입니다.", detail: ["heading·p·div·목록·표 등 많은 요소가 포함됩니다.", "CSS display 값이 아니라 HTML 자식 허용 규칙을 설명합니다."], analogy: "교재 한 페이지에 들어갈 수 있는 제목·문단·표 같은 큰 재료 목록입니다." },
        { term: "phrasing content", definition: "문장과 문단 내부에서 텍스트 흐름을 이루거나 그 일부에 의미를 부여하는 콘텐츠 범주입니다.", detail: ["text·span·strong·em·a·code 등이 대표적입니다.", "phrasing이라고 해서 CSS display가 반드시 inline으로 고정되지는 않습니다."], analogy: "문장 안에서 단어와 구절에 역할표를 붙이는 재료입니다." },
        { term: "display", definition: "요소가 CSS box tree에 어떤 바깥·안쪽 표시 유형으로 참여하는지 정하는 CSS 속성입니다.", detail: ["기본값은 user-agent stylesheet에서 올 수 있습니다.", "display를 바꿔도 HTML 요소 이름과 의미·콘텐츠 모델은 바뀌지 않습니다."], caveat: "display:none은 해당 하위 트리를 box tree에서 제거하고 일반적으로 접근성 노출에도 영향을 주므로 단순 모양 변경보다 큰 효과가 있습니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "CSS를 적용하니 span이 한 줄을 차지하거나 h2가 앞 문장과 같은 줄에 나타나서 요소 의미도 바뀌었다고 생각한다.", likelyCause: "HTML 의미·콘텐츠 모델과 CSS display를 같은 분류로 오해했습니다.", checks: ["Elements에서 실제 tagName을 확인합니다.", "Computed 패널에서 display의 출처와 최종값을 확인합니다.", "Accessibility tree에서 heading 역할이 유지되는지 확인합니다."], fix: "콘텐츠 역할에 맞는 HTML은 유지하고 배치 요구만 CSS display로 조정합니다.", prevention: "코드 리뷰에서 요소 선택 이유와 CSS 레이아웃 이유를 별도로 설명합니다." },
      ],
      comparisons: [
        { title: "구조와 줄 흐름을 무엇으로 결정할까요?", options: [
          { name: "HTML 의미 요소", chooseWhen: "제목·문단·강조·목록처럼 콘텐츠의 역할을 표현할 때", avoidWhen: "순수한 시각 배치만 바꿀 때", tradeoffs: ["기계가 읽을 수 있는 구조가 남습니다.", "요소별 콘텐츠 모델을 지켜야 합니다.", "기본 스타일은 CSS로 자유롭게 바꿀 수 있습니다."] },
          { name: "CSS display", chooseWhen: "block·inline·flex·grid 등 시각적 box 흐름을 정할 때", avoidWhen: "제목이나 중요성이라는 의미를 만들려 할 때", tradeoffs: ["레이아웃을 독립적으로 제어합니다.", "HTML 의미를 대신하지 않습니다.", "display:none 같은 값은 접근성·상호작용까지 검토해야 합니다."] },
        ] },
      ],
    },
    {
      id: "heading-hierarchy",
      title: "h1~h6은 글자 크기 단계가 아니라 문서의 주제와 하위 주제 관계입니다",
      lead: "제목 번호는 중첩된 섹션의 수준을 전달하므로 먼저 문서 개요를 만들고 그 관계를 h1부터 h6까지 표시합니다.",
      explanations: [
        "h1은 최상위 주제, h2는 그 하위 주제, h3는 h2 아래 세부 주제라는 관계를 표현합니다. 원본처럼 브라우저 기본 화면에서 h1이 크고 h6가 작게 보이지만 크기는 user-agent CSS의 기본 표현일 뿐 선택 기준이 아닙니다. 작은 최상위 제목이 필요하면 h1을 쓰고 CSS font-size를 줄입니다.",
        "한 독립 페이지에는 내용을 대표하는 명확한 h1 하나를 두는 관례가 독자와 검수 도구에 가장 이해하기 쉽습니다. 그 아래 동등한 장은 h2, 장 안의 절은 h3로 배치합니다. h2 다음에 h4로 건너뛰면 중간 관계가 보이지 않아 혼란을 주므로 가능한 한 피합니다. 다만 h4 하위 절을 닫고 새 h2로 돌아가는 것은 계층을 건너뛴 것이 아닙니다.",
        "브라우저와 보조기술은 제목 목록을 제공해 긴 페이지를 훑고 원하는 절로 이동하게 합니다. 제목 문구는 '소개', '기타'처럼 맥락 없는 단어보다 해당 절의 주제나 목적을 독립적으로 설명해야 합니다. 글자를 굵게 보이게 하려고 빈 h2를 넣거나 모든 카드 제목을 무조건 h1로 만들지 않습니다.",
        "원본의 h0·h7·h8·mudnhrg는 화면에서 사라지는 일반 텍스트가 아닙니다. HTML 파서는 이름을 가진 알 수 없는 요소 노드로 DOM에 남기지만 표준 heading 의미와 heading 접근성 역할을 제공하지 않습니다. 또한 사용자 정의 요소 이름은 충돌을 피하도록 하이픈을 포함해야 하므로 임의 이름을 표준 태그처럼 만드는 습관도 피합니다.",
      ],
      concepts: [
        { term: "heading rank", definition: "h1부터 h6까지 숫자가 나타내는 문서 제목의 계층 수준입니다.", detail: ["숫자가 작을수록 상위 수준입니다.", "시각적 글자 크기와 분리해 선택합니다."], analogy: "책의 책 제목, 장 제목, 절 제목을 차례로 붙이는 것과 같습니다." },
        { term: "document outline", definition: "제목과 섹션 관계로 독자가 페이지의 주제와 하위 내용을 파악하는 구조적 개요입니다.", detail: ["제목 목록 탐색과 검색·요약에 쓰입니다.", "CSS를 제거해도 논리 순서가 읽혀야 합니다."], caveat: "과거의 자동 outline 알고리즘에 기대어 section마다 h1을 반복하기보다 실제 heading rank를 명시적으로 설계합니다." },
      ],
      codeExamples: [
        {
          id: "semantic-study-note-outline",
          title: "제목 계층·문단·강조를 가진 독립 학습 노트",
          language: "html",
          filename: "semantic-study-note.html",
          purpose: "제목을 크기가 아닌 개요로 배치하고 strong·em·pre·hr의 의미를 DOM 조회 결과로 함께 검증합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>의미 있는 학습 노트</title>\n</head>\n<body>\n<article id=\"lesson\">\n  <h1>파이썬 반복문 복습</h1>\n  <p id=\"intro\">이번 세션의 <strong>필수 목표</strong>는 코드를 <em>직접</em> 추적하는 것입니다.</p>\n  <section>\n    <h2>핵심 규칙</h2>\n    <p>range(3)은 0부터 2까지 세 값을 만듭니다.</p>\n    <pre><code>for n in range(3):\n    print(n)</code></pre>\n  </section>\n  <hr>\n  <section>\n    <h2>주의</h2>\n    <p><strong>들여쓰기를 유지하세요.</strong> Python은 들여쓰기로 블록을 구분합니다.</p>\n  </section>\n</article>\n<pre id=\"result\"></pre>\n<script>\n  const headings = [...document.querySelectorAll(\"#lesson h1, #lesson h2\")]\n    .map((node) => `${node.tagName}:${node.textContent}`)\n    .join(\" > \");\n  const result = document.querySelector(\"#result\");\n  result.textContent = [\n    `outline=${headings}`,\n    `strong=${document.querySelector(\"#intro strong\").textContent}`,\n    `em=${document.querySelector(\"#intro em\").textContent}`,\n    `code=${JSON.stringify(document.querySelector(\"pre code\").textContent)}`,\n    `hr-count=${document.querySelectorAll(\"#lesson hr\").length}`,\n  ].join(\"\\n\");\n</script>\n</body>\n</html>",
          walkthrough: [
            { lines: "1-7", explanation: "한국어 HTML 문서 골격과 문서 탭 이름을 만듭니다. 제목 콘텐츠는 body에, 문서 metadata title은 head에 둡니다." },
            { lines: "8-10", explanation: "독립 학습 글을 article로 묶고 대표 제목 h1과 소개 문단을 둡니다. 필수 목표는 중요성이므로 strong, 발화상 강세는 em으로 표시합니다." },
            { lines: "11-20", explanation: "동등한 두 하위 주제는 모두 h2입니다. 코드는 공백 구조가 중요한 pre 안 code로 표시하고 hr은 두 학습 단계 사이의 주제 전환을 나타냅니다." },
            { lines: "23-27", explanation: "DOM에서 h1·h2 순서를 읽어 실제 개요를 안정된 문자열로 만듭니다. 글자 크기를 검사하지 않는 이유는 개요가 의미 계약이기 때문입니다." },
            { lines: "28-35", explanation: "strong·em 텍스트, 코드의 줄바꿈, hr 개수를 읽어 result에 정확한 검증 결과를 씁니다. JSON.stringify는 코드 안 줄바꿈을 \\n으로 눈에 보이게 합니다." },
          ],
          run: { environment: ["UTF-8로 저장", "JavaScript가 활성화된 현대 Chromium·Firefox·Safari", "DevTools Elements와 Accessibility 패널"], command: "browser에서 semantic-study-note.html 열기" },
          output: {
            value: "outline=H1:파이썬 반복문 복습 > H2:핵심 규칙 > H2:주의\nstrong=필수 목표\nem=직접\ncode=\"for n in range(3):\\n    print(n)\"\nhr-count=1",
            explanation: ["DOM 순서는 대표 h1 뒤에 동등한 h2 두 개가 있어 논리 개요와 일치합니다.", "strong과 em은 기본 화면에서 각각 굵게·기울임일 수 있지만 출력은 요소가 감싼 의미 단위의 텍스트를 검증합니다.", "code 값의 \\n과 네 칸 공백은 pre/code 내부 원문 구조가 DOM에 보존되었음을 보여 줍니다.", "hr 하나는 단순 테두리 장식이 아니라 핵심 규칙에서 주의 사항으로 넘어가는 주제 전환입니다."],
          },
          experiments: [
            { change: "h2 '주의'를 h4로 바꾸고 접근성 도구의 heading 목록을 확인합니다.", prediction: "시각 크기뿐 아니라 heading rank가 2에서 4로 바뀌어 존재하지 않는 h3 하위 구조처럼 읽힙니다.", result: "제목 번호는 디자인 크기가 아니라 문서 계층 계약이라는 점을 확인합니다." },
            { change: "CSS로 h1 { font-size: 1rem }과 h2 { font-size: 2rem }을 적용합니다.", prediction: "화면 크기 순서는 뒤집혀도 DOM tagName과 heading rank 순서는 H1, H2, H2로 유지됩니다.", result: "표현을 바꾸어도 HTML 의미가 바뀌지 않습니다." },
            { change: "strong을 span class=bold로 바꾸고 같은 굵기 CSS를 줍니다.", prediction: "화면은 같게 만들 수 있지만 중요성이라는 네이티브 의미는 사라집니다.", result: "중요하면 strong을 유지하고 단지 장식이면 span과 CSS를 사용합니다." },
          ],
          sourceRefs: ["web-day01-heading-source", "web-day01-paragraph-source", "web-day01-formatting-source", "whatwg-sections", "whatwg-grouping", "whatwg-text-level", "wai-headings"],
        },
      ],
      diagnostics: [
        { symptom: "화면에는 큰 글자가 보이지만 DevTools Accessibility heading 목록에서 제목을 찾을 수 없다.", likelyCause: "h0·h7·임의 태그 또는 font-size가 큰 div/p를 제목처럼 사용했습니다.", checks: ["Elements에서 h1~h6 중 하나인지 봅니다.", "Accessibility tree에서 role=heading과 level을 확인합니다.", "CSS를 끄고 정보 계층을 다시 읽습니다."], fix: "실제 계층에 맞는 h1~h6으로 바꾸고 크기·굵기는 CSS로 조절합니다.", prevention: "페이지별 heading outline 검사를 코드 리뷰와 접근성 테스트에 포함합니다." },
        { symptom: "화면만 보면 그럴듯하지만 heading 목록이 H1→H4→H2처럼 불연속이고 원하는 절로 탐색하기 어렵다.", likelyCause: "기본 글자 크기를 얻으려고 제목 번호를 선택했거나 재사용 컴포넌트가 rank를 고정했습니다.", checks: ["모든 h1~h6을 DOM 순서로 나열합니다.", "각 제목이 어느 상위 주제에 속하는지 문장으로 말해 봅니다.", "디자인 token과 heading rank prop이 섞였는지 봅니다."], fix: "정보 계층으로 rank를 다시 정하고 시각 typography는 class/token으로 분리합니다.", prevention: "Heading 컴포넌트에 시각 variant와 semantic level을 별도 입력으로 설계합니다." },
      ],
      comparisons: [
        { title: "큰 글자를 만들 때 무엇을 선택할까요?", options: [
          { name: "h1~h6 + CSS", chooseWhen: "문서 또는 섹션의 제목일 때", avoidWhen: "단순 가격·숫자·장식 문구일 때", tradeoffs: ["제목 탐색과 문서 계층을 제공합니다.", "rank를 문맥에 맞게 결정해야 합니다.", "글자 크기는 별도 CSS가 필요할 수 있습니다."] },
          { name: "p/span/div + CSS", chooseWhen: "제목이 아닌 일반 문장·레이블·장식 숫자를 크게 보일 때", avoidWhen: "실제 섹션 제목일 때", tradeoffs: ["시각 표현만 자유롭게 바꿉니다.", "heading 의미와 탐색 지점은 생기지 않습니다.", "필요한 다른 의미 요소가 없는지 먼저 확인해야 합니다."] },
        ] },
      ],
    },
    {
      id: "paragraph-whitespace",
      title: "p는 문단을 표시하고 일반 흐름의 공백 접기는 CSS white-space에서 일어납니다",
      lead: "소스의 줄바꿈과 여러 공백은 DOM text node에 남을 수 있지만 기본 white-space:normal 레이아웃에서는 한 공백처럼 렌더링됩니다.",
      explanations: [
        "p는 글을 둘러싼 사각 상자를 만드는 도구가 아니라 하나의 구조적 문단을 나타냅니다. 문단이 끝났으면 p를 닫고 새 p를 시작합니다. 관련 문장마다 무조건 p를 쪼개거나, 여러 문단을 하나의 p 안에 br로 이어 붙이면 독자가 인식할 구조와 DOM 구조가 어긋납니다.",
        "원본 ex03의 여러 줄과 연속 공백은 parser가 모두 삭제하는 것이 아닙니다. textContent로 읽으면 source의 공백과 newline이 남아 있습니다. 화면에서 한 칸으로 보이는 주된 이유는 기본 계산 스타일 white-space:normal이 공백 sequence를 접고 줄 너비에 따라 자동 줄바꿈하기 때문입니다. DOM 층과 layout 층을 구분해야 정확한 진단이 됩니다.",
        "p의 콘텐츠 모델은 phrasing content입니다. div·section·ul 같은 flow container를 p 안에 넣으면 유효하지 않으며 HTML parser가 p를 앞에서 자동 종료할 수 있습니다. 소스 들여쓰기만 보면 div가 p 자식처럼 보여도 실제 DOM에서는 형제가 되어 child selector·event·margin이 달라질 수 있습니다.",
        "여러 공백을 맞춤 간격으로 사용하거나 &nbsp;를 반복해 열을 정렬하지 않습니다. 화면 폭·글꼴·확대율이 바뀌면 깨지고 보조기술에는 관계가 전달되지 않습니다. 일반 문장 간격은 CSS margin/gap, 표 형태 데이터는 table, 보존된 코드·ASCII 배치는 pre처럼 목적에 맞는 구조를 사용합니다.",
      ],
      concepts: [
        { term: "paragraph", definition: "하나의 주제나 생각을 이루는 문장들의 구조적 단위이며 HTML에서는 p로 표시합니다.", detail: ["기본 margin은 표현일 뿐 문단 의미가 아닙니다.", "p 내부에는 phrasing content를 둡니다."], analogy: "워드프로세서에서 Enter로 새 문단을 만들고 자동 줄바꿈은 프로그램에 맡기는 것과 같습니다." },
        { term: "white-space collapsing", definition: "white-space:normal 같은 CSS 처리에서 연속 공백과 줄바꿈을 화면의 접힌 공백으로 처리하는 규칙입니다.", detail: ["DOM textContent 원문과 시각 결과가 다를 수 있습니다.", "줄 너비에 따른 soft wrap과 br의 forced break도 구분합니다."], caveat: "언어·bidirectional text·inline 요소 경계에 따라 공백 처리 세부 결과가 달라질 수 있으므로 중요한 정렬을 공백 문자에 맡기지 않습니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "HTML 소스에서 공백을 열 칸 넣었는데 화면에서는 한 칸만 보인다.", likelyCause: "일반 요소의 계산된 white-space가 normal이고 연속 공백이 layout 단계에서 접혔습니다.", checks: ["Elements에서 text node 원문과 textContent를 확인합니다.", "Computed에서 white-space 값을 확인합니다.", "의도가 문장 간격인지 원문 서식 보존인지 구분합니다."], fix: "일반 간격은 CSS margin·gap을 사용하고 구조적 preformatted content만 pre 또는 적절한 white-space CSS로 표시합니다.", prevention: "공백 문자로 layout을 맞추지 않는 코딩 규칙과 responsive 확대 테스트를 둡니다." },
        { symptom: "p 안에 넣은 div가 querySelector('#note > div')로 잡히지 않고 문단 여백도 예상과 다르다.", likelyCause: "p가 div를 자식으로 허용하지 않아 HTML parser가 div 시작 전에 p를 자동으로 닫았습니다.", checks: ["View Source와 Elements DOM을 나란히 비교합니다.", "div.parentElement.tagName을 Console에서 확인합니다.", "HTML validator의 첫 content-model 오류부터 봅니다."], fix: "p를 div 전에 닫고 div 뒤에 새 p를 열거나 전체 논리 묶음은 p 밖의 div/section으로 감쌉니다.", prevention: "p에는 text와 phrasing 요소만 두고 template별 HTML validation을 수행합니다." },
      ],
    },
    {
      id: "pre-br-hr",
      title: "pre·br·hr은 각각 보존된 서식, 강제 줄바꿈, 주제 전환이라는 좁은 목적을 가집니다",
      lead: "줄이 바뀌어 보인다는 공통점만 보고 서로 대체하면 문서 의미와 반응형 동작이 망가집니다.",
      explanations: [
        "pre는 문자 배치 자체가 내용의 구조를 표현하는 preformatted text 블록입니다. 코드, 터미널 출력, 고정된 형식의 시, ASCII art에 적합합니다. 기본 CSS가 공백과 newline을 보존하며 보통 고정폭 글꼴을 사용합니다. HTML 문법에서는 pre 시작 태그 바로 다음의 첫 newline 하나가 편의를 위해 제거되는 세부 규칙도 있습니다.",
        "컴퓨터 코드는 <pre><code>...</code></pre>, 프로그램 출력은 pre 안 samp, 사용자가 입력할 키는 kbd처럼 의미를 더할 수 있습니다. pre만 쓰면 모든 내용이 코드라는 뜻은 아닙니다. 긴 한 줄은 모바일 viewport를 넘을 수 있으므로 overflow:auto 또는 상황에 맞는 wrapping 정책을 검토하고, ASCII art는 음성·점자 사용자를 위한 설명도 제공합니다.",
        "br은 시·주소처럼 같은 문단 안에서 줄 경계 자체가 내용인 곳에 forced line break를 넣는 void element입니다. 새 문단 사이 간격이나 카드 사이 여백을 만들려고 br을 여러 개 연속 사용하지 않습니다. 문단이면 p를 나누고 시각 간격이면 CSS margin·gap을 사용합니다.",
        "hr은 수평선을 그리는 장식 태그보다 문단 수준의 thematic break, 즉 장면·주제·단계가 전환됨을 나타내는 요소입니다. 기본 브라우저가 선처럼 렌더링하지만 CSS로 선을 없애도 의미는 남습니다. 반대로 장식 선만 필요하면 border 또는 pseudo-element가 더 정확합니다.",
      ],
      concepts: [
        { term: "preformatted text", definition: "공백·줄바꿈·문자 위치 같은 typographic convention이 내용 구조를 이루는 텍스트입니다.", detail: ["pre가 그 구조를 표시합니다.", "일반 문단의 수동 정렬을 위한 만능 도구는 아닙니다."], caveat: "작은 화면 overflow와 비시각 사용자의 이해 가능성을 별도로 점검합니다." },
        { term: "forced line break", definition: "자동 줄바꿈과 달리 작성자가 내용상 반드시 끊어야 하는 위치를 br로 표시한 줄 경계입니다.", detail: ["시와 주소에 적합합니다.", "문단 경계는 p로 표시합니다."] },
        { term: "thematic break", definition: "이야기 장면·논의 주제·학습 단계가 바뀌는 문단 수준 전환이며 hr로 표시합니다.", detail: ["기본 선 모양과 구분합니다.", "장식 border를 대신하는 요소가 아닙니다."] },
      ],
      codeExamples: [
        {
          id: "whitespace-and-default-flow-inspection",
          title: "p·pre의 원문 공백과 div·span 기본 display 비교",
          language: "html",
          filename: "whitespace-flow.html",
          purpose: "같은 textContent가 CSS white-space에 따라 다르게 렌더링되고 div·span 기본 흐름이 계산 스타일에서 확인됨을 재현합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>공백과 흐름</title>\n</head>\n<body>\n<p id=\"collapsed\">한 칸     여러 칸\n다음 줄</p>\n<pre id=\"preserved\">한 칸     여러 칸\n다음 줄</pre>\n<div id=\"container\">앞 <span id=\"label\">같은 줄</span> 뒤</div>\n<p id=\"manual\">첫 줄<br>둘째 줄</p>\n<pre id=\"result\"></pre>\n<script>\n  const p = document.querySelector(\"#collapsed\");\n  const pre = document.querySelector(\"#preserved\");\n  const result = document.querySelector(\"#result\");\n  result.textContent = [\n    `p-text=${JSON.stringify(p.textContent)}`,\n    `pre-text=${JSON.stringify(pre.textContent)}`,\n    `p-white-space=${getComputedStyle(p).whiteSpace}`,\n    `pre-white-space=${getComputedStyle(pre).whiteSpace}`,\n    `div-display=${getComputedStyle(document.querySelector(\"#container\")).display}`,\n    `span-display=${getComputedStyle(document.querySelector(\"#label\")).display}`,\n    `br-count=${document.querySelectorAll(\"#manual br\").length}`,\n  ].join(\"\\n\");\n</script>\n</body>\n</html>",
          walkthrough: [
            { lines: "1-7", explanation: "외부 CSS가 없는 표준 문서를 만들어 브라우저 기본 스타일의 차이를 관찰합니다." },
            { lines: "8-11", explanation: "p와 pre에 정확히 같은 다섯 연속 공백과 source newline을 넣습니다. div 안 span은 일반 텍스트 흐름, br은 같은 문단 안의 강제 줄바꿈을 보여 줍니다." },
            { lines: "14-18", explanation: "두 요소를 DOM에서 찾아 textContent를 읽습니다. parser가 공백을 단순 삭제했다는 잘못된 설명인지 확인할 준비입니다." },
            { lines: "19-27", explanation: "JSON.stringify로 원문 공백/newline을 보이게 하고 getComputedStyle로 layout 단계의 white-space와 display를 읽습니다. 마지막에는 br element 개수를 검증합니다." },
          ],
          run: { environment: ["UTF-8로 저장", "기본 user-agent stylesheet를 유지한 현대 Chromium 브라우저", "JavaScript 활성화"], command: "browser에서 whitespace-flow.html 열기" },
          output: {
            value: "p-text=\"한 칸     여러 칸\\n다음 줄\"\npre-text=\"한 칸     여러 칸\\n다음 줄\"\np-white-space=normal\npre-white-space=pre\ndiv-display=block\nspan-display=inline\nbr-count=1",
            explanation: ["p와 pre의 textContent에는 모두 다섯 공백과 newline이 있으므로 parser가 원문 공백을 전부 지운 것이 아닙니다.", "p는 white-space:normal이라 화면에서 공백이 접히고 pre는 white-space:pre라 위치가 보존됩니다.", "div의 block과 span의 inline은 현재 브라우저 기본 계산 스타일입니다. CSS로 바꿀 수 있으므로 HTML의 영구 분류로 외우지 않습니다.", "br은 text character가 아니라 DOM element 하나이며 같은 p 안에서 강제 줄바꿈을 만듭니다."],
          },
          experiments: [
            { change: "p에 style='white-space: pre'를 추가합니다.", prediction: "tagName은 P 그대로지만 연속 공백과 source newline이 화면에서도 보존됩니다.", result: "공백 보존은 pre라는 요소 이름만이 아니라 CSS rendering 속성과 연결되지만, 실제 preformatted 의미가 있으면 pre를 우선합니다." },
            { change: "pre에 style='white-space: pre-wrap; overflow-wrap: anywhere'를 적용하고 창을 좁힙니다.", prediction: "공백과 줄 경계는 보존하면서 긴 줄이 viewport 안에서 추가로 감길 수 있습니다.", result: "모바일 overflow를 완화하되 코드 복사·정렬 요구와 trade-off를 확인합니다." },
            { change: "두 p 사이 간격을 위해 br 세 개를 넣은 뒤 이를 CSS margin-block으로 교체합니다.", prediction: "시각 간격은 유지할 수 있고 DOM에는 불필요한 강제 줄바꿈이 사라집니다.", result: "콘텐츠 구조와 시각 간격 책임이 분리됩니다." },
          ],
          sourceRefs: ["web-day01-paragraph-source", "web-day01-div-source", "whatwg-grouping", "csswg-display"],
        },
      ],
      diagnostics: [
        { symptom: "모바일에서 pre 코드 한 줄이 화면 밖으로 길게 넘쳐 페이지 전체가 가로로 흔들린다.", likelyCause: "pre의 기본 공백 보존과 줄바꿈 제한을 고려하지 않고 긴 URL·코드·출력을 넣었습니다.", checks: ["pre의 scrollWidth와 clientWidth를 비교합니다.", "Computed white-space와 overflow-x를 확인합니다.", "강제 줄바꿈이 코드 의미·복사 결과를 바꾸는지 검토합니다."], fix: "컨테이너에 max-width와 overflow:auto를 두거나 내용 성격에 맞으면 pre-wrap·overflow-wrap을 선택합니다.", prevention: "긴 token fixture와 320px viewport, 200% 확대에서 코드 블록을 시각 테스트합니다." },
        { symptom: "빈 공간을 만들려고 br·hr을 반복했더니 screen reader 흐름과 반응형 간격이 어색하다.", likelyCause: "내용상 줄 경계·주제 전환 요소를 presentation spacing 도구로 사용했습니다.", checks: ["각 br이 같은 문단에서 반드시 끊어야 하는 의미인지 묻습니다.", "각 hr 전후가 실제 주제 전환인지 읽습니다.", "CSS margin/gap을 제거한 구조를 봅니다."], fix: "문단은 p로 나누고 레이아웃 간격·장식 선은 CSS로 옮기며 의미 있는 br/hr만 남깁니다.", prevention: "CSS 없이 읽는 구조 검수와 semantic element 사용 기준을 문서화합니다." },
      ],
    },
    {
      id: "generic-div-span",
      title: "div와 span은 의미가 없는 만능 태그가 아니라 마지막에 선택하는 중립 컨테이너입니다",
      lead: "div는 flow 범위, span은 phrasing 범위를 묶되 더 구체적인 HTML 요소가 콘텐츠 목적을 표현하지 못할 때 사용합니다.",
      explanations: [
        "원본 ex04는 div를 스타일, 영역 구분, 이벤트 처리에 많이 쓰는 box로 설명합니다. 실제로 여러 요소를 하나의 CSS layout 단위나 JavaScript hook으로 묶을 때 유용합니다. 그러나 header·nav·main·article·section·aside·footer처럼 목적이 명확하면 해당 의미 요소를 먼저 선택합니다.",
        "span은 문장 안의 짧은 범위를 class·lang·data attribute 등으로 묶는 generic phrasing container입니다. 예를 들어 문장 일부의 언어가 영어라면 <span lang='en'>...</span>처럼 사용할 수 있습니다. 중요성이라면 strong, 강세라면 em, 코드라면 code가 더 정확하므로 모두 span class로 대체하지 않습니다.",
        "div의 기본 display:block과 span의 기본 display:inline은 흔한 시작점입니다. 그러나 div { display:inline } 또는 span { display:block }은 유효한 CSS입니다. CSS를 바꿔도 div가 heading이 되거나 span이 section이 되지 않으며 p 안 div가 허용되는 것도 아닙니다.",
        "generic container가 깊게 중첩되면 'div soup'가 되어 문서 목적, selector 범위, layout 책임을 이해하기 어렵습니다. wrapper가 정말 layout·component boundary를 제공하는지, 기존 의미 요소나 CSS pseudo-element로 대체 가능한지 검토하고 불필요한 계층을 줄입니다.",
      ],
      concepts: [
        { term: "generic container", definition: "자체적인 주제·중요성·문단 의미를 추가하지 않고 콘텐츠 범위를 묶는 요소입니다.", detail: ["div는 flow content용, span은 phrasing content용입니다.", "class·style·script hook만 필요한 경우에 적합합니다."], caveat: "중립이라는 말은 아무 문맥에나 중첩 가능하다는 뜻이 아니며 부모와 자식의 콘텐츠 모델을 지켜야 합니다." },
        { term: "parser recovery", definition: "잘못된 HTML 중첩을 브라우저가 표준 규칙으로 자동 종료·삽입·재배치해 DOM 생성을 계속하는 처리입니다.", detail: ["소스와 실제 DOM을 다르게 만들 수 있습니다.", "화면이 보인다는 사실은 유효한 markup을 보장하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "semantics-display-parser-recovery",
          title: "CSS display 교환과 잘못된 p/div 중첩의 DOM 복구",
          language: "html",
          filename: "semantics-vs-display.html",
          purpose: "요소 의미와 계산 display가 독립적이며 content model 위반은 CSS가 아니라 HTML parser가 DOM 구조를 바꿔 복구함을 확인합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>의미와 표시 비교</title>\n  <style>\n    #visual-heading { display: inline; font-size: 1rem; }\n    #visual-label { display: block; }\n  </style>\n</head>\n<body>\n<h2 id=\"visual-heading\">작게 보이는 제목</h2>\n<span id=\"visual-label\">블록처럼 보이는 레이블</span>\n<p id=\"broken\">문단 시작<div id=\"inside\">중간 영역</div>문단 끝</p>\n<pre id=\"result\"></pre>\n<script>\n  const heading = document.querySelector(\"#visual-heading\");\n  const label = document.querySelector(\"#visual-label\");\n  const broken = document.querySelector(\"#broken\");\n  const inside = document.querySelector(\"#inside\");\n  document.querySelector(\"#result\").textContent = [\n    `heading=${heading.tagName}/${getComputedStyle(heading).display}`,\n    `label=${label.tagName}/${getComputedStyle(label).display}`,\n    `broken-text=${JSON.stringify(broken.textContent)}`,\n    `div-parent=${inside.parentElement.tagName}`,\n    `paragraph-count=${document.querySelectorAll(\"p\").length}`,\n  ].join(\"\\n\");\n</script>\n</body>\n</html>",
          walkthrough: [
            { lines: "1-10", explanation: "h2를 inline, span을 block으로 표시하도록 CSS를 뒤집습니다. 이 설정은 box 흐름만 바꾸며 tagName과 의미는 바꾸지 않습니다." },
            { lines: "11-14", explanation: "h2·span 뒤에 의도적으로 유효하지 않은 p 안 div를 작성합니다. 실패 실험이므로 제품 코드에서는 이 구조를 사용하지 않습니다." },
            { lines: "16-20", explanation: "DOM에서 각 요소를 다시 찾아 source가 아니라 parser가 만든 현재 tree를 검사합니다." },
            { lines: "21-27", explanation: "tagName/display 쌍, p의 실제 textContent, div의 실제 부모, p 개수를 출력합니다. 닫는 </p>까지 복구하면서 빈 p가 추가되는 결과도 수치로 드러납니다." },
          ],
          run: { environment: ["UTF-8로 저장", "현대 Chromium 브라우저", "JavaScript 활성화", "HTML validator는 고의 오류를 보고해야 함"], command: "browser에서 semantics-vs-display.html 열기" },
          output: {
            value: "heading=H2/inline\nlabel=SPAN/block\nbroken-text=\"문단 시작\"\ndiv-parent=BODY\nparagraph-count=2",
            explanation: ["h2는 inline으로 보이지만 DOM tagName H2와 heading 의미가 유지됩니다.", "span은 block 상자를 만들지만 generic phrasing element인 SPAN 그대로입니다.", "broken p의 textContent에는 '문단 시작'만 남고 div는 BODY 자식으로 이동했습니다. div 뒤 '문단 끝'도 원래 p에 속하지 않습니다.", "마지막 </p>를 처리하는 오류 복구로 빈 p가 하나 더 생겨 paragraph-count가 2입니다. 소스 들여쓰기만 믿으면 찾기 어려운 결함입니다."],
          },
          experiments: [
            { change: "broken 구조를 <div><p>문단 시작</p><div>중간 영역</div><p>문단 끝</p></div>로 고칩니다.", prediction: "두 p와 중간 div가 바깥 div의 명시적 자식이 되고 parser가 빈 p를 만들 필요가 없습니다.", result: "source 의도와 DOM tree가 일치해 selector와 margin을 예측할 수 있습니다." },
            { change: "CSS display 두 규칙을 제거합니다.", prediction: "h2는 기본 block, span은 기본 inline으로 돌아가지만 tagName과 접근성 의미는 그대로입니다.", result: "user-agent style이 원본의 첫 화면을 만들었음을 확인합니다." },
            { change: "h2를 span으로 바꾸고 class만 heading처럼 꾸밉니다.", prediction: "화면을 비슷하게 만들 수 있어도 Accessibility tree의 heading과 level이 사라집니다.", result: "CSS는 semantic replacement가 아닙니다." },
          ],
          sourceRefs: ["web-day01-div-source", "web-day01-paragraph-source", "whatwg-grouping", "whatwg-parsing", "csswg-display"],
        },
      ],
      diagnostics: [
        { symptom: "화면 배치는 맞는데 접근성 tree가 generic만 반복하고 검색·테스트에서 main·heading·article을 찾기 어렵다.", likelyCause: "모든 구조를 div와 span으로만 만들었습니다.", checks: ["각 wrapper의 콘텐츠 역할을 한 문장으로 이름 붙입니다.", "native sectioning·heading·text-level 요소가 있는지 확인합니다.", "CSS를 제거하고 DOM outline을 읽습니다."], fix: "명확한 역할은 native semantic element로 바꾸고 순수 layout/script hook만 div·span으로 남깁니다.", prevention: "컴포넌트 API와 리뷰 checklist에 semantic root 요소 선택을 포함합니다." },
      ],
      comparisons: [
        { title: "콘텐츠 범위를 묶을 때 무엇을 쓸까요?", options: [
          { name: "semantic element", chooseWhen: "article·section·nav·p·strong·code처럼 목적을 설명하는 네이티브 요소가 있을 때", avoidWhen: "그 의미가 실제 콘텐츠와 맞지 않을 때", tradeoffs: ["접근성·검색·유지보수 문맥을 제공합니다.", "요소별 사용 조건을 이해해야 합니다.", "CSS 스타일에는 제약이 거의 없습니다."] },
          { name: "div/span", chooseWhen: "layout·style·script·언어 범위를 묶지만 더 구체적인 의미가 없을 때", avoidWhen: "단지 익숙하다는 이유로 모든 요소를 대체할 때", tradeoffs: ["중립적이고 유연합니다.", "자체 의미나 keyboard behavior가 없습니다.", "과도한 중첩은 DOM과 selector를 복잡하게 합니다."] },
        ] },
      ],
    },
    {
      id: "text-level-semantics",
      title: "strong·em과 여러 텍스트 요소는 보이는 모양보다 문장 속 역할을 표시합니다",
      lead: "굵게·기울임·형광펜처럼 보이는 기본 스타일은 의미의 흔한 표현일 뿐이며, 먼저 콘텐츠가 중요성·강세·표시·수정 중 무엇인지 결정합니다.",
      explanations: [
        "strong은 내용의 강한 중요성, 심각성 또는 긴급성을 표시합니다. '결제 후 취소할 수 없습니다', '서버를 종료하기 전에 저장하세요'처럼 먼저 읽어야 할 핵심이나 경고에 적합합니다. 단지 디자인 시안의 굵은 글씨라는 이유만으로 모든 bold text에 strong을 쓰지는 않습니다.",
        "em은 발화의 stress emphasis를 나타내며 어느 단어에 강세를 두는지에 따라 문장 의미가 달라질 수 있습니다. '반드시 오늘 제출'에서 오늘을 강조하는 것과 반드시를 강조하는 것은 대조점이 다릅니다. em은 일반 italic 요소가 아니고 중요성은 strong이 담당합니다.",
        "b는 추가 중요성 없이 독자의 주의를 끄는 keyword·lead-in 등에, i는 다른 목소리·분류학적 명칭·관용적 기술 용어 등에 사용할 수 있습니다. 둘 다 단순히 굵게·기울임만 뜻하는 폐기 요소는 아니지만 더 정확한 strong·em·mark·cite·dfn 등의 요소가 있으면 그것을 우선합니다. 순수 시각 효과면 CSS font-weight/font-style을 사용합니다.",
        "mark는 현재 문맥과 관련 있어 표시한 부분, small은 저작권·면책 같은 side comment, sub·sup은 화학식·각주·지수처럼 아래·위 첨자가 의미에 필요한 경우입니다. ins·del은 문서에 삽입·삭제된 편집 이력을 나타냅니다. 밑줄이나 취소선 모양만 필요하다고 ins·del을 쓰면 실제 수정 의미를 거짓으로 전달합니다.",
        "원본 ex06의 big은 현재 HTML에서 비표준 폐기 요소이므로 새 문서에 사용하지 않습니다. 글자 크기 확대는 CSS font-size로 표현합니다. 또한 strong/em이 보조기술에서 항상 특정 억양으로 낭독된다고 가정하지 않습니다. 의미는 접근성 API와 다른 도구가 사용할 수 있지만 실제 음성 표현은 사용자 agent와 설정에 따라 다릅니다.",
      ],
      concepts: [
        { term: "strong importance", definition: "내용의 중요성·심각성·긴급성이 주변 텍스트보다 강함을 strong으로 표시한 의미입니다.", detail: ["중첩하면 상대적 중요성을 더 높일 수 있습니다.", "단순 bold style과 동일하지 않습니다."] },
        { term: "stress emphasis", definition: "발화에서 특정 말에 강세를 주어 대조·의도를 바꾸는 의미이며 em으로 표시합니다.", detail: ["위치를 옮기면 문장 해석이 달라질 수 있습니다.", "중요성 자체는 strong의 역할입니다."], analogy: "같은 문장에서 어느 단어에 힘을 주어 읽느냐가 답변의 초점을 바꾸는 것과 같습니다." },
        { term: "presentational styling", definition: "콘텐츠 의미를 추가하지 않고 font-weight·font-style·color·text-decoration 등 시각 표현만 바꾸는 CSS입니다.", detail: ["디자인 요구에는 CSS를 사용합니다.", "색상 하나만으로 중요·상태를 전달하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "모든 굵은 UI 문구가 strong이고 모든 기울임 문구가 em이라 문장 의미와 접근성 정보가 과장된다.", likelyCause: "디자인 속성 bold/italic을 semantic importance/emphasis와 일대일로 치환했습니다.", checks: ["각 strong이 정말 먼저 읽어야 할 중요·경고인지 묻습니다.", "각 em의 위치를 옮겼을 때 문장 의미가 달라지는지 봅니다.", "순수 typography token 적용 대상인지 디자인 명세를 확인합니다."], fix: "의미가 있으면 strong/em을 유지하고 순수 시각 효과면 적절한 요소에 CSS class를 적용합니다.", prevention: "콘텐츠 작성 지침에 strong·em·b·i·mark와 CSS 선택 예를 함께 둡니다." },
        { symptom: "validator가 big 요소를 obsolete/non-conforming으로 보고 최신 브라우저에서 기대한 크기를 안정적으로 제어하기 어렵다.", likelyCause: "과거의 presentational big 요소를 새 HTML에 사용했습니다.", checks: ["HTML validator에서 obsolete feature를 확인합니다.", "CSS font-size가 아닌 element에 디자인을 의존하는지 봅니다.", "원본 migration 범위에서 big 사용을 검색합니다."], fix: "big을 콘텐츠 의미에 맞는 요소 또는 span으로 바꾸고 CSS font-size/design token으로 크기를 지정합니다.", prevention: "HTML conformance validation과 obsolete 요소 금지 lint 규칙을 CI에 둡니다." },
      ],
      comparisons: [
        { title: "텍스트를 눈에 띄게 할 때 어떤 표현을 선택할까요?", options: [
          { name: "strong", chooseWhen: "중요성·심각성·긴급성을 전달할 때", avoidWhen: "그저 굵은 시각 스타일만 필요할 때", tradeoffs: ["중요성 의미를 제공합니다.", "기본 bold는 변경할 수 있습니다.", "남용하면 모든 정보가 중요해져 우선순위가 사라집니다."] },
          { name: "em", chooseWhen: "말의 강세와 대조가 문장 뜻을 바꿀 때", avoidWhen: "일반적인 italic typography나 책 제목을 표시할 때", tradeoffs: ["강세 의미를 제공합니다.", "언어 문맥에 따라 위치가 중요합니다.", "시각 italic 여부는 CSS에 달려 있습니다."] },
          { name: "CSS class", chooseWhen: "의미 변화 없이 brand·typography·상태 모양만 적용할 때", avoidWhen: "중요성이나 강세를 기계도 알아야 할 때", tradeoffs: ["표현과 design token을 중앙 관리합니다.", "자체 semantic 의미는 없습니다.", "색·굵기만으로 상태를 전달하지 않아야 합니다."] },
        ] },
      ],
    },
    {
      id: "source-dom-box-accessibility",
      title: "소스, DOM tree, CSS box tree, 접근성 tree를 순서대로 보면 모순처럼 보이는 현상이 풀립니다",
      lead: "한 도구의 화면만 보지 말고 각 층이 무엇을 보존하고 무엇을 변환하는지 추적합니다.",
      explanations: [
        "첫째, View Source에서 서버가 보낸 tag·공백·순서를 확인합니다. 둘째, Elements에서 parser 복구와 script 변경 뒤 실제 DOM parent/child를 확인합니다. 셋째, Computed Style과 layout에서 white-space·display·margin·font를 확인합니다. 넷째, Accessibility tree와 heading 목록에서 role·name·level을 확인합니다.",
        "예를 들어 p 공백이 사라졌다는 증상은 source와 textContent에는 공백이 있으나 CSS layout에서 접힌 것일 수 있습니다. p 안 div가 사라졌다는 증상은 parser가 p를 닫아 DOM sibling으로 만든 것일 수 있습니다. h2가 같은 줄에 있다는 증상은 CSS display만 inline으로 바뀐 것일 수 있습니다. 각 원인은 다른 층에 있으므로 수정 위치도 달라집니다.",
        "innerText는 layout과 visibility를 반영해 textContent와 다르게 보일 수 있고, getComputedStyle은 cascade가 끝난 계산값을 보여 줍니다. 자동화에서 exact text를 비교할 때 어느 API의 계약을 원하는지 정합니다. 원문 data 보존이면 textContent, 사용자에게 보이는 줄 흐름이면 시각·접근성 테스트가 더 가깝습니다.",
        "접근성 검사는 heading 역할이 있다는 사실만 확인해서 끝나지 않습니다. 제목 문구가 목적을 설명하는지, rank가 관계를 반영하는지, CSS 확대와 고대비에서도 보이는지 수동 검토합니다. screen reader 제품 하나의 발음 결과만 HTML 표준 의미 전체로 일반화하지 않습니다.",
      ],
      concepts: [
        { term: "box tree", definition: "DOM과 CSS 계산 결과를 바탕으로 layout에 참여하는 box와 text sequence가 구성된 표현 구조입니다.", detail: ["document tree와 일대일이 아닐 수 있습니다.", "display:none·pseudo-element·anonymous box 등이 차이를 만듭니다."] },
        { term: "accessibility tree", definition: "DOM 의미·상태·이름을 보조기술이 사용할 수 있도록 플랫폼 접근성 객체로 노출한 구조입니다.", detail: ["heading role과 level을 확인할 수 있습니다.", "CSS와 ARIA, 숨김 상태가 노출에 영향을 줄 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "textContent test는 통과하지만 사용자는 줄이 합쳐지거나 내용이 보이지 않는다고 보고한다.", likelyCause: "DOM 문자열만 검증하고 CSS white-space·display·overflow·visibility 같은 실제 rendering을 검사하지 않았습니다.", checks: ["innerText와 screenshot을 textContent와 비교합니다.", "Computed Style에서 white-space/display/overflow를 봅니다.", "viewport·zoom·forced-colors 조건을 바꿉니다."], fix: "DOM unit test에 browser layout·visual·accessibility integration test를 추가하고 계약에 맞는 assertion API를 선택합니다.", prevention: "콘텐츠 구조와 rendering 결과에 서로 다른 테스트 층을 둡니다." },
      ],
      expertNotes: ["CSS reset은 h1·p·pre의 기본 margin·font-size·font-family를 모두 바꿀 수 있습니다. 기본 스타일이 사라져도 semantic regression으로 오판하지 말고 DOM role과 계산 style을 별도로 검증합니다.", "display:contents는 box tree에서 wrapper box를 없애지만 DOM을 없애는 것은 아닙니다. 요소 종류와 브라우저·접근성 조합에 따라 노출 문제가 있었으므로 semantic interactive 요소에 무심코 적용하지 않고 실제 접근성 tree로 확인합니다."],
    },
    {
      id: "authoring-security-maintenance",
      title: "실무에서는 콘텐츠 작성 규칙, 재사용 컴포넌트, 사용자 입력 보안까지 같은 계약으로 관리합니다",
      lead: "좋은 semantic markup은 한 번 고른 태그보다 작성자와 렌더러가 계속 지킬 수 있는 정책에 가깝습니다.",
      explanations: [
        "CMS·Markdown·rich-text editor가 제목을 생성한다면 h1은 페이지 shell이 담당하고 본문 작성자는 h2부터 시작하게 하는 등 책임을 정합니다. 단, 무조건 숫자를 1씩 더하는 변환보다 실제 문서 문맥을 검토해야 합니다. 복사·붙여넣기로 들어온 빈 heading, rank jump, br 반복, inline style을 정규화합니다.",
        "재사용 Heading 컴포넌트는 semantic level과 visual variant를 분리합니다. 예를 들어 level=2이면서 size='small'일 수 있어야 합니다. CardTitle이라는 컴포넌트 이름만으로 실제 h2가 보장되지는 않으므로 렌더된 DOM을 테스트합니다. 페이지 조합 시 h1 중복과 rank 관계도 integration 수준에서 검사합니다.",
        "사용자 입력을 strong·em·p로 보이게 한다고 문자열을 그대로 innerHTML에 넣으면 script, event handler, 위험 URL이 섞여 XSS가 될 수 있습니다. 기본은 textContent 또는 framework의 escaping을 사용합니다. 제한된 rich HTML이 꼭 필요하면 서버·클라이언트 경계를 포함해 검증된 sanitizer와 허용 요소·속성 목록을 적용하고 CSP를 보조 방어로 둡니다.",
        "semantic HTML은 성능 비용을 늘리는 장식이 아닙니다. 오히려 불필요한 wrapper와 script로 역할을 재구현하는 것보다 native 요소가 단순합니다. 다만 깊은 div 중첩, 거대한 pre 출력, DOM 전체를 매번 다시 훑는 목차 script는 성능·메모리에 영향을 줄 수 있으므로 콘텐츠 크기와 update 빈도에 맞게 측정합니다.",
      ],
      concepts: [
        { term: "semantic component API", definition: "컴포넌트의 시각 variant와 실제 HTML 의미 요소·heading level을 분리해 문맥에 맞게 렌더링하는 인터페이스입니다.", detail: ["component 이름이 DOM 의미를 자동 보장하지 않습니다.", "페이지 조합 test가 필요합니다."] },
        { term: "HTML sanitization", definition: "허용하지 않은 요소·속성·URL을 제거하거나 안전하게 변환해 사용자 제공 HTML의 실행 위험을 줄이는 처리입니다.", detail: ["escaping과 목적이 다릅니다.", "검증된 library와 allowlist 정책을 사용합니다."], caveat: "CSP만으로 신뢰할 수 없는 innerHTML 삽입을 안전하게 만들 수 없으며 sanitizer 우회와 URL scheme도 계속 관리해야 합니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "사용자가 입력한 학습 노트의 제목·강조를 렌더링한 뒤 임의 script나 onerror handler가 실행된다.", likelyCause: "신뢰하지 않는 문자열을 검증 없이 innerHTML 또는 dangerouslySetInnerHTML에 삽입했습니다.", checks: ["data가 생성·저장·렌더되는 모든 trust boundary를 추적합니다.", "허용 요소·attribute·URL scheme 정책과 sanitizer version을 확인합니다.", "CSP report와 DOM XSS test fixture를 봅니다."], fix: "plain text는 escaping/textContent로 출력하고 rich HTML은 검증된 sanitizer allowlist를 거친 결과만 렌더링합니다.", prevention: "security test, dependency update, CSP, server-side validation을 함께 운영하고 client HTML에 secret을 넣지 않습니다." },
      ],
      comparisons: [
        { title: "사용자 작성 텍스트를 어떻게 표시할까요?", options: [
          { name: "escaped plain text", chooseWhen: "사용자가 markup을 작성할 필요가 없을 때", avoidWhen: "검토된 rich text 기능이 제품 요구일 때", tradeoffs: ["기본적으로 가장 단순하고 안전합니다.", "제목·강조 같은 형식을 직접 표현할 수 없습니다.", "newline을 어떻게 보일지는 CSS/문단 변환 정책이 필요합니다."] },
          { name: "sanitized rich HTML", chooseWhen: "p·heading·strong·em·list 같은 제한된 작성 기능이 꼭 필요할 때", avoidWhen: "sanitizer와 allowlist를 지속 운영할 수 없을 때", tradeoffs: ["의미 있는 문서 구조를 보존할 수 있습니다.", "XSS 방어와 URL·attribute 정책이 복잡합니다.", "저장 전·출력 전 처리 책임과 migration을 명확히 해야 합니다."] },
        ] },
      ],
      expertNotes: ["Heading 자동 검사는 rank jump와 빈 제목을 잘 찾지만 문구가 실제 목적을 설명하는지 판단하지 못합니다. 콘텐츠 리뷰를 자동 검사와 결합합니다.", "화면 순서를 CSS order로 바꾸면 DOM·읽기·focus 순서와 달라질 수 있습니다. 본문과 제목은 가능한 한 의미 있는 읽기 순서로 DOM에 두고 시각 재배치가 이해를 해치지 않는지 검증합니다."],
    },
    {
      id: "element-selection-workflow",
      title: "요소 선택은 콘텐츠 질문에서 시작하고 브라우저 네 층에서 끝까지 검증합니다",
      lead: "외울 태그 목록 대신 반복 가능한 질문 순서를 사용하면 처음 보는 문서도 일관되게 설계할 수 있습니다.",
      explanations: [
        "먼저 이 문자열이 페이지·섹션의 제목인지 묻습니다. 그렇다면 상위 제목을 찾아 h1~h6 rank를 정합니다. 하나의 생각을 이루는 일반 글이면 p, 공백 위치가 내용이면 pre, 같은 문단에서 반드시 줄을 끊어야 하면 br, 주제가 전환되면 hr을 검토합니다.",
        "문장 일부라면 중요성·긴급성은 strong, 발화 강세는 em, 현재 문맥에서 표시한 관련성은 mark, 코드 식별자는 code처럼 더 구체적인 의미를 찾습니다. 적합한 요소가 없고 스타일·script·language 범위만 필요하면 span, 여러 flow 요소 묶음만 필요하면 div를 선택합니다.",
        "그다음 콘텐츠 모델을 확인합니다. p 안에 div를 넣거나 heading 안에 flow section을 넣지 않습니다. CSS로 시각 크기·display·margin·line-height·wrapping을 설계하되 HTML 의미를 대신하지 않게 합니다. 작은 viewport와 글자 확대에서 reflow·overflow도 확인합니다.",
        "마지막으로 View Source, Elements DOM, Computed Style, Accessibility tree, CSS 제거 화면, keyboard/heading 탐색을 확인합니다. validator의 첫 오류를 고치고 exact output test와 사람이 읽는 의미 검토를 함께 통과해야 완료입니다.",
      ],
      concepts: [
        { term: "semantic decision tree", definition: "콘텐츠의 주제·문단·강조·서식 보존·generic grouping 여부를 순서대로 묻고 적절한 요소를 고르는 절차입니다.", detail: ["화면 모양보다 콘텐츠 역할을 먼저 묻습니다.", "콘텐츠 모델과 접근성 검증까지 포함합니다."] },
        { term: "progressive validation", definition: "source 문법에서 DOM·CSS·접근성·실제 사용자 과제로 범위를 넓혀 결함 원인을 층별로 확인하는 방식입니다.", detail: ["validator 하나로 완료를 선언하지 않습니다.", "각 층의 실패를 해당 책임에서 수정합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "태그 선택 때마다 '이건 블록인가 인라인인가'만 묻고 결과적으로 제목·문단·경고가 모두 div/span이 된다.", likelyCause: "시각 흐름을 콘텐츠 의미보다 먼저 결정하는 선택 절차를 사용했습니다.", checks: ["각 콘텐츠를 제목·문단·강조·code·generic 중 하나로 설명합니다.", "CSS를 제거한 DOM이 읽히는지 확인합니다.", "native element 대안을 검색합니다."], fix: "콘텐츠 역할→콘텐츠 모델→CSS display→접근성 검증 순서로 다시 설계합니다.", prevention: "팀 템플릿과 리뷰에 semantic decision tree를 포함합니다." },
      ],
    },
    {
      id: "source-audit-boundaries",
      title: "원본 네 파일의 관찰은 보존하되 현재 표준의 경계와 오류 복구까지 확장합니다",
      lead: "학습 원본을 버리지 않고 실제 실행 결과를 재현한 다음, 단순화된 설명을 정확한 mental model로 교정합니다.",
      explanations: [
        "ex02_hn.html은 h1~h6의 기본 크기·굵기·줄바꿈과 h0·h7·임의 요소를 비교합니다. Chromium에서 DOM을 실행 확인하면 h0·h7·h8·mudnhrg도 이름을 가진 요소로 남지만 heading role은 아닙니다. 따라서 '일반 글자 취급'을 화면 기본 표현의 관찰과 표준 의미의 부재로 나누어 설명했습니다.",
        "ex03_paragraphs.html은 p의 source newline/space 접기, pre 보존, span, br, hr을 한 화면에 비교합니다. 이 관찰을 textContent와 computed white-space로 재현해 parser와 CSS layout 책임을 분리하고, br/hr의 semantic 목적과 pre overflow·접근성까지 확장했습니다.",
        "ex04_div.html은 배경·크기·border가 있는 div와 문장 중간 div의 새 줄을 보여 줍니다. 이를 div의 고정 본성이 아니라 기본 display:block 결과로 해석하고, span의 기본 inline과 CSS 교환 실험, p 안 div의 parser recovery, semantic container 우선 원칙으로 확장했습니다.",
        "ex06_textformatting.html은 i·b·sub·sup·ins·del·small·big·mark·strong·em과 CSS style을 비교합니다. 현재 표준에서 big은 폐기되었고 b/i도 단순 시각 요소 이상의 제한된 의미가 있습니다. strong·em의 차이, 편집 의미와 장식 선의 차이, CSS presentation 선택 기준을 공식 표준으로 보강했습니다.",
        "이 세션은 링크·URL, image/media, 목록, 표, form, 전체 semantic landmark 설계를 깊게 다루지 않습니다. 다만 현재 텍스트 구조를 이해하는 데 필요한 article·section과 접근성 heading 탐색은 예제 문맥으로 사용합니다. 후속 원자 세션에서 각 주제를 독립적으로 확장할 수 있도록 경계를 남깁니다.",
      ],
      concepts: [
        { term: "source audit", definition: "관련 원본을 모두 읽고 실제 browser DOM·표시·오류 흔적을 재현한 뒤 어떤 설명을 사용·교정·보충했는지 기록하는 과정입니다.", detail: ["원본 진행 순서를 존중합니다.", "현재 표준과 충돌하는 단순화는 근거를 남기고 수정합니다."] },
        { term: "scope boundary", definition: "한 세션의 핵심 질문에 필요한 깊이와 후속 세션으로 넘길 주제를 명시한 범위입니다.", detail: ["중간 세션만 읽어도 핵심은 이해되게 씁니다.", "관련된 모든 API를 한 페이지에 억지로 합치지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["학습 원본의 inline style은 한 파일에서 결과를 비교하기에는 유용하지만 production에서는 반복 속성을 stylesheet와 class/design token으로 이동해 cascade와 유지보수를 관리합니다.", "HTML Living Standard와 CSS 초안은 갱신될 수 있으므로 요소 의미·폐기 상태·접근성 권고를 정기적으로 재검토하고 날짜·근거 링크를 source evidence에 남깁니다."],
    },
  ],
  lab: {
    title: "CSS를 제거해도 읽히는 학습 기사와 텍스트 의미 검사기",
    scenario: "짧은 기술 학습 글을 h1~h3·p·pre/code·strong·em·hr·div/span으로 작성하고, 브라우저에서 문서 계층·공백·기본 흐름·접근성·오류 복구를 단계별로 검증합니다.",
    setup: ["UTF-8 편집기와 현대 Chromium 또는 Firefox를 준비합니다.", "DevTools Elements·Computed·Accessibility 패널과 HTML validator를 사용할 수 있게 합니다.", "실제 개인정보·비밀값·신뢰하지 않는 HTML을 예제에 넣지 않습니다.", "article-note.html 한 파일에서 시작하고 실패 실험은 별도 복사본으로 수행합니다."],
    steps: [
      "페이지 주제를 한 문장으로 정하고 대표 h1 하나, 동등한 h2 두 개, 첫 h2 아래 h3 하나를 종이에 outline으로 먼저 씁니다.",
      "각 제목 아래에 한 생각 단위의 p를 두고 중요 경고는 strong, 문장 대조 강세는 em으로 표시합니다. 굵기·기울임만 필요한 곳은 class와 CSS를 사용합니다.",
      "공백 구조가 의미인 실행 예를 pre 안 code로 넣고 긴 줄 fixture도 추가합니다. overflow:auto 또는 선택한 wrapping 정책을 320px viewport에서 확인합니다.",
      "같은 문단에서 의미상 필요한 줄 경계 하나만 br로 만들고, 주제가 바뀌는 두 장 사이에는 hr 하나를 사용합니다. 간격용 br/hr은 제거하고 CSS margin/gap으로 옮깁니다.",
      "layout wrapper가 필요한 곳에만 div, 문장 일부의 언어나 styling hook이 필요한 곳에만 span을 사용하고 더 구체적인 의미 요소가 없는지 검토합니다.",
      "Console에서 모든 h1~h6의 tagName과 textContent를 DOM 순서로 출력하고 outline 초안과 일치하는지 확인합니다.",
      "p와 pre의 textContent·getComputedStyle(...).whiteSpace를 비교하고 div/span의 display 값을 확인합니다. CSS로 display를 교환해도 tagName과 heading role이 유지되는지 봅니다.",
      "실패 복사본에 p 안 div와 h7을 넣어 View Source와 Elements 차이, validator 오류, accessibility heading 목록을 기록한 뒤 올바른 구조로 수정합니다.",
      "CSS를 끄고도 제목→문단→코드→주제 전환 순서가 읽히는지 확인하고 200% 확대·keyboard heading 탐색·Accessibility tree를 점검합니다.",
      "사용자 입력을 추가한다면 textContent로 출력하고, rich HTML이 필요한 경우의 sanitizer allowlist 정책을 문서로만 설계합니다. 검증 없는 innerHTML은 사용하지 않습니다.",
    ],
    expectedResult: ["heading 목록이 H1→H2→H3→H2 관계로 읽히고 각 제목이 독립적으로 목적을 설명합니다.", "일반 p의 연속 공백은 화면에서 접히지만 DOM textContent에는 원문이 남고 pre는 보존된 서식을 표시합니다.", "br은 같은 문단의 의미 있는 줄 경계에만, hr은 실제 주제 전환에만 존재합니다.", "div/span의 CSS display를 바꾸어도 HTML tagName과 semantic 역할은 바뀌지 않습니다.", "validator 정상 문서에는 p/div 중첩·h7·big 오류가 없고 source와 DOM 의도가 일치합니다.", "CSS 없이도 문서가 읽히고 작은 화면·확대에서 pre를 제외한 본문이 가로 overflow를 만들지 않습니다.", "Accessibility tree에 제목 role과 level이 노출되고 단순 굵은 디자인이 불필요한 strong으로 과장되지 않습니다."],
    cleanup: ["고의로 잘못 만든 p/div·h7 실패 복사본만 삭제하고 정상 article-note.html과 검증 기록을 보존합니다."],
    extensions: ["Heading 컴포넌트에 semantic level과 visual size를 분리한 API를 설계합니다.", "Markdown heading·paragraph·code block을 안전한 HTML allowlist로 변환하는 정책을 작성합니다.", "Playwright에서 heading 순서, p/pre computed white-space, 작은 viewport overflow를 자동 검사합니다.", "한국어 본문 안 영문 기술 용어에 span lang='en'을 적용하고 음성 출력 차이를 수동 확인합니다."],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본 네 파일의 핵심을 하나의 의미 있는 학습 기사로 다시 작성하고 실행 결과를 기록하세요.",
      requirements: ["h1 하나와 동등한 h2 두 개, 필요한 h3를 계층에 맞게 사용합니다.", "p·pre/code·br·hr을 각각 정확한 목적에 한 번 이상 사용합니다.", "중요 경고에 strong, 발화 강세에 em을 적용하고 선택 이유를 적습니다.", "div/span은 layout·문장 범위가 필요한 곳에만 사용합니다.", "DOM heading 목록과 p/pre textContent·white-space exact output을 기록합니다."],
      hints: ["제목 크기는 CSS로 바꿀 수 있으므로 먼저 outline을 그립니다.", "p와 pre의 textContent가 같아도 화면 결과가 다른 이유를 Computed에서 찾습니다."],
      expectedOutcome: "원본의 화면 관찰을 의미·DOM·CSS 세 층으로 설명하는 한 페이지를 재현합니다.",
      solutionOutline: ["주제와 하위 주제를 문장으로 정합니다.", "콘텐츠 역할에 맞는 요소를 선택합니다.", "브라우저에서 DOM과 계산 스타일을 출력합니다.", "CSS 제거·validator·접근성 tree를 점검합니다."],
    },
    {
      difficulty: "응용",
      prompt: "의도적으로 망가진 제목·문단·강조 문서를 진단하고 최소 수정으로 고치세요.",
      requirements: ["h7, H1→H4 rank jump, p 안 div, 간격용 br 네 개, 장식용 hr, big, 모든 bold의 strong 사용을 포함한 fixture를 만듭니다.", "View Source·Elements·Computed·Accessibility tree에서 각 결함의 책임 층을 표로 기록합니다.", "validator 첫 오류부터 수정하고 source와 DOM 차이를 설명합니다.", "수정 뒤 semantic HTML과 CSS presentation을 분리합니다.", "320px viewport와 200% 확대에서 pre overflow를 검증합니다."],
      hints: ["h7은 text node가 아니라 알 수 없는 element로 DOM에 남을 수 있습니다.", "p가 어디에서 자동 종료됐는지 div.parentElement와 p 개수로 확인합니다.", "굵게 보인다는 사실만으로 strong이 필요한 것은 아닙니다."],
      expectedOutcome: "겉보기 결과가 아니라 parser·콘텐츠 모델·CSS·접근성 원인을 구분해 결함을 수정합니다.",
      solutionOutline: ["heading outline과 유효한 콘텐츠 모델을 먼저 복구합니다.", "br/hr/big/strong의 의미 오용을 교정합니다.", "간격과 typography를 CSS로 이동합니다.", "자동·수동 검증 결과를 전후 비교합니다."],
    },
    {
      difficulty: "설계",
      prompt: "여러 작성자가 쓰는 공개 학습자료 사이트의 텍스트 콘텐츠 시스템을 설계하세요.",
      requirements: ["페이지 shell h1과 본문 h2~h6의 소유권·rank 정책을 정합니다.", "Heading의 semantic level과 visual variant를 분리한 component API를 정의합니다.", "p·pre/code·strong·em·mark·div/span 허용 기준과 obsolete 요소 migration 규칙을 만듭니다.", "Markdown 또는 rich text의 escaping·sanitizer allowlist·URL 검증·CSP 책임을 구분합니다.", "HTML validation, heading/accessibility tree, DOM snapshot, 320px overflow, 200% 확대 검사를 CI에 정의합니다.", "자동 검사로 판단할 수 없는 제목 문구 품질과 강조 남용을 사람 리뷰 항목으로 둡니다."],
      hints: ["컴포넌트 이름과 실제 렌더된 tagName은 다를 수 있습니다.", "사용자 HTML을 저장했다는 사실이 신뢰 가능함을 뜻하지 않습니다.", "display는 HTML 의미를 바꾸지 않지만 숨김·순서 변경은 접근성에 영향을 줄 수 있습니다."],
      expectedOutcome: "한 번의 올바른 markup을 넘어 작성·렌더링·보안·검증·migration을 지속할 수 있는 production 정책을 제시합니다.",
      solutionOutline: ["콘텐츠 역할과 ownership을 먼저 모델링합니다.", "semantic component와 style token을 분리합니다.", "신뢰 경계와 sanitization 정책을 설계합니다.", "자동·수동 acceptance criteria와 회귀 fixture를 정의합니다."],
    },
  ],
  reviewQuestions: [
    { question: "h1은 가장 큰 글자를 만들기 위한 요소인가요?", answer: "아닙니다. h1은 최상위 섹션의 heading 의미를 나타내며 시각 크기는 CSS로 바꿀 수 있습니다." },
    { question: "h2 다음에 h4가 나오면 왜 문제가 될 수 있나요?", answer: "h3 수준의 관계가 보이지 않아 독자와 heading 탐색 도구가 계층을 오해할 수 있습니다. 반면 하위 절을 닫고 h4에서 h2로 돌아가는 것은 정상일 수 있습니다." },
    { question: "h7을 쓰면 브라우저가 순수 text node로 바꾸나요?", answer: "아닙니다. 알 수 없는 이름의 HTML element로 DOM에 남을 수 있지만 표준 heading 의미와 level은 제공하지 않습니다." },
    { question: "p 소스의 여러 공백은 parser가 모두 삭제하나요?", answer: "항상 그렇지 않습니다. textContent에는 남을 수 있고 기본 white-space:normal layout에서 시각적으로 접힙니다." },
    { question: "pre와 br은 언제 구분해 사용하나요?", answer: "공백·줄 위치 전체가 내용 구조이면 pre, 같은 문단의 특정 위치에서만 강제 줄바꿈이 필요하면 br을 사용합니다." },
    { question: "hr은 장식용 수평선을 만들기 위한 요소인가요?", answer: "핵심 의미는 문단 수준의 주제 전환입니다. 장식 선만 필요하면 CSS border나 pseudo-element를 사용합니다." },
    { question: "span에 display:block을 주면 div와 같은 HTML 의미가 되나요?", answer: "아닙니다. box 표시는 block이 되어도 span은 phrasing generic element이며 콘텐츠 모델과 의미는 그대로입니다." },
    { question: "p 안 div를 CSS로 inline 처리하면 유효한 중첩이 되나요?", answer: "아닙니다. HTML parser가 CSS 적용 전에 p를 자동 종료할 수 있으며 CSS display는 콘텐츠 모델을 바꾸지 않습니다." },
    { question: "strong과 em의 차이는 굵게와 기울임인가요?", answer: "strong은 중요성·심각성·긴급성, em은 발화의 stress emphasis를 나타냅니다. 기본 시각 표현은 CSS로 바뀔 수 있습니다." },
    { question: "big을 새 HTML에 계속 사용해도 되나요?", answer: "아닙니다. 현재 HTML에서 폐기된 비표준 요소이므로 의미에 맞는 요소와 CSS font-size로 교체합니다." },
    { question: "사용자 입력에 strong과 p를 허용하려고 문자열을 innerHTML에 바로 넣어도 되나요?", answer: "안 됩니다. plain text는 escaping/textContent로, 제한된 rich HTML은 검증된 sanitizer allowlist와 URL 정책을 거쳐 렌더링해야 합니다." },
  ],
  completionChecklist: [
    "제목의 시각 크기와 h1~h6 heading rank를 분리해 설명할 수 있다.",
    "문서 주제와 하위 주제를 먼저 outline으로 만들고 논리적인 heading 순서를 작성할 수 있다.",
    "p와 pre의 textContent·white-space 차이를 DevTools와 코드로 검증할 수 있다.",
    "br의 강제 줄바꿈, hr의 주제 전환, CSS 간격·장식 선을 구분할 수 있다.",
    "flow·phrasing 콘텐츠 모델과 CSS block·inline display가 다른 층임을 설명할 수 있다.",
    "div와 span을 더 구체적인 semantic 요소가 없을 때만 사용할 수 있다.",
    "p 안 div의 parser recovery를 source와 실제 DOM 비교로 진단할 수 있다.",
    "strong·em·b·i·mark·small·sub·sup·ins·del과 순수 CSS style의 선택 기준을 설명할 수 있다.",
    "h0·h7·big 같은 비표준·폐기 요소를 현재 표준 구조로 교정할 수 있다.",
    "HTML validator·DOM·Computed Style·Accessibility tree·작은 viewport를 결합해 검증할 수 있다.",
    "신뢰하지 않는 텍스트를 escaping하고 rich HTML의 sanitization 필요성을 설명할 수 있다.",
  ],
  nextSessions: ["html-03-links-paths-navigation"],
  sources: [
    { id: "web-day01-heading-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/ex02_hn.html", usedFor: ["h1~h6 기본 표현", "h0·h7·임의 요소 비교", "블록/인라인 입문 관찰", "일반 공백 원본"], evidence: "전체 source와 주석을 읽고 Chromium DOM으로 h0·h1~h8·mudnhrg 요소가 생성되는 것을 실행 확인했습니다. heading 의미와 기본 표현을 현재 표준 기준으로 분리했습니다." },
    { id: "web-day01-paragraph-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/ex03_paragraphs.html", usedFor: ["p source 줄·공백", "pre 보존", "span·br·hr 비교"], evidence: "전체 source를 읽고 Chromium DOM에서 p·pre·span·br·hr 구조를 실행 확인했습니다. 동일 textContent와 다른 computed white-space를 별도 예제로 재현했습니다." },
    { id: "web-day01-div-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/ex04_div.html", usedFor: ["div generic 영역", "배경·크기·border", "문장 중간 div의 기본 흐름"], evidence: "전체 source와 inline style을 읽고 Chromium DOM에서 세 div와 문장 사이 div 구조를 실행 확인했습니다. generic container, CSS display, parser recovery로 확장했습니다." },
    { id: "web-day01-formatting-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/ex06_textformatting.html", usedFor: ["i·b·sub·sup·ins·del·small·big·mark", "strong·em", "CSS 글자 style 비교"], evidence: "전체 source를 읽고 Chromium DOM에서 text-level 요소를 실행 확인했습니다. big 폐기 상태와 각 요소의 현재 semantic 선택 기준을 보강했습니다." },
    { id: "whatwg-sections", repository: "WHATWG HTML Living Standard", path: "multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements", publicUrl: "https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements", usedFor: ["h1~h6 heading level", "sections와 heading 관계", "명시적 heading rank"], evidence: "2026-07-12 기준 h1~h6가 각 section의 heading을 나타내고 숫자가 중첩 수준에 대응한다는 표준 정의를 확인했습니다." },
    { id: "whatwg-grouping", repository: "WHATWG HTML Living Standard", path: "multipage/grouping-content.html", publicUrl: "https://html.spec.whatwg.org/multipage/grouping-content.html", usedFor: ["p 콘텐츠 모델", "hr thematic break", "pre와 선행 newline", "div generic container"], evidence: "2026-07-12 기준 p·hr·pre·div의 의미와 콘텐츠 모델, preformatted text 사용·접근성 고려를 확인했습니다." },
    { id: "whatwg-text-level", repository: "WHATWG HTML Living Standard", path: "multipage/text-level-semantics.html", publicUrl: "https://html.spec.whatwg.org/multipage/text-level-semantics.html", usedFor: ["em stress emphasis", "strong importance·seriousness·urgency", "small·mark·b·i·span·sub·sup·ins·del"], evidence: "2026-07-12 기준 text-level semantic 요소의 정의와 em·strong·b·i 선택 차이를 확인했습니다." },
    { id: "whatwg-parsing", repository: "WHATWG HTML Living Standard", path: "multipage/parsing.html", publicUrl: "https://html.spec.whatwg.org/multipage/parsing.html", usedFor: ["p 자동 종료", "잘못된 p/div 중첩 복구", "source와 DOM 차이"], evidence: "2026-07-12 기준 p scope와 div·heading·pre 시작 tag 처리의 tree-construction 규칙을 확인하고 실제 Chromium DOM 출력과 대조했습니다." },
    { id: "csswg-display", repository: "CSS Working Group Editor Draft", path: "css-display/", publicUrl: "https://drafts.csswg.org/css-display/", usedFor: ["display outer·inner type", "block·inline box", "document semantics와 CSS box 분리", "display:none·contents 주의"], evidence: "2026-07-12 기준 CSS Display가 document element tree에서 box tree를 만드는 방식과 display가 document-language semantics를 바꾸지 않는다는 정의를 확인했습니다." },
    { id: "wai-headings", repository: "W3C Web Accessibility Initiative", path: "tutorials/page-structure/headings/", publicUrl: "https://www.w3.org/WAI/tutorials/page-structure/headings/", usedFor: ["heading 탐색", "rank nesting", "rank 건너뛰기", "페이지 구조"], evidence: "2026-07-12 기준 heading이 페이지 조직과 in-page navigation을 전달하고 rank를 논리적으로 중첩한다는 WAI guidance를 확인했습니다." },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "원본 네 파일의 source·주석을 모두 읽고 Chromium headless DOM으로 각각 실행 확인했습니다. 로컬 provenance는 repository-relative path만 기록했으며 비공개 backup URL은 공개 출처로 사용하지 않았습니다.",
      "원본의 '블록은 한 줄 전체, 인라인은 해당 영역' 설명은 첫 기본 화면 관찰로 보존하되 HTML flow/phrasing 콘텐츠 모델과 CSS display/box tree가 별도라는 표준 설명으로 교정했습니다.",
      "h0·h7은 순수 text가 아니라 unknown element로 DOM에 남고 big은 폐기 요소라는 현재 경계를 보강했습니다. 링크·미디어·목록·표·폼과 전체 landmark layout은 후속 원자 세션 범위입니다.",
      "접근성 heading navigation, parser recovery, responsive pre overflow, component API, rich-text XSS 방어는 원본의 입문 예제를 실제 학습 사이트 운영 수준으로 확장한 내용입니다.",
    ],
  },
} satisfies DetailedSession;

(session.chapters as DetailedSession["chapters"]).push(
  {
    id: "whitespace-dom-rendered-text-audit",
    title: "공백은 source·DOM text·CSS formatting·복사와 음성 출력에서 서로 다른 결과를 만듭니다",
    lead: "일반 문단에서 여러 공백이 하나처럼 보인다는 관찰만 외우면 parser가 문자를 지웠다고 오해합니다. textContent와 computed white-space를 함께 기록해 어느 계층이 결과를 결정했는지 확인합니다.",
    explanations: [
      "HTML parser는 일반적인 source의 공백 문자를 Text node에 남길 수 있습니다. 기본 `white-space: normal` formatting이 연속 collapsible whitespace를 하나의 간격으로 표현하고 필요할 때 줄을 접습니다. 따라서 View Source, textContent, 화면, clipboard와 accessible text는 같은 문자열 표현이라고 단정할 수 없습니다.",
      "pre는 preformatted text를 나타내며 기본 `white-space: pre`로 공백과 줄바꿈 위치를 보존합니다. code sample·ASCII 표처럼 위치 자체가 정보일 때 적합하지만 긴 한 줄은 작은 viewport에서 overflow를 만들 수 있어 `overflow:auto`, 적절한 wrapping 정책, keyboard scroll 가능성을 검토합니다.",
      "`&nbsp;`는 의미 없는 layout 간격을 만드는 도구가 아닙니다. 줄이 분리되면 안 되는 단위처럼 non-breaking semantics가 실제로 필요할 때 제한적으로 쓰고, column 정렬·간격은 CSS gap·margin·grid를 사용합니다. 많은 non-breaking spaces는 reflow와 확대를 방해합니다.",
      "innerText는 현재 rendered layout과 hidden 상태를 고려하고 읽는 과정에서 style/layout 계산을 요구할 수 있지만 textContent는 DOM descendant text를 중심으로 읽습니다. 데이터 직렬화에는 textContent, 사용자가 보는 줄 경계 검사가 꼭 필요할 때만 innerText를 사용하고 성능 trace로 반복 호출 비용을 확인합니다.",
    ],
    concepts: [
      { term: "collapsible whitespace", definition: "CSS white-space 처리에서 연속 공백·줄바꿈 일부가 하나의 간격처럼 layout되는 문자 구간입니다.", detail: ["DOM에서 문자가 삭제됐다는 뜻은 아닙니다.", "white-space 속성과 line breaking 규칙이 결과를 결정합니다."] },
      { term: "preformatted text", definition: "작성자가 지정한 공백과 줄 위치가 콘텐츠 의미의 일부인 text입니다.", detail: ["pre가 대표적인 semantic container입니다.", "작은 화면 overflow와 음성 이해 가능성을 별도로 검토합니다."] },
    ],
    codeExamples: [
      {
        id: "whitespace-dom-and-computed-style",
        title: "같은 공백 문자열을 p와 pre에 넣고 DOM text와 computed white-space 비교",
        language: "html",
        filename: "whitespace-layers.html",
        purpose: "parser가 보존한 Text node와 CSS가 선택한 공백 formatting mode를 browser output으로 분리합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>공백 계층 점검</title>\n  <style>pre { overflow: auto; }</style>\n</head>\n<body>\n  <main>\n    <h1>공백은 어느 계층에서 바뀌나요?</h1>\n    <p id=\"normal\">Alpha   Beta\nGamma</p>\n    <pre id=\"preserved\">Alpha   Beta\nGamma</pre>\n    <output id=\"result\"></output>\n  </main>\n  <script>\n    const visible = (value) => value.replaceAll(\" \", \"·\").replaceAll(\"\\n\", \"↵\");\n    const paragraph = document.querySelector(\"#normal\");\n    const pre = document.querySelector(\"#preserved\");\n    const lines = [\n      `pText=${visible(paragraph.textContent)}`,\n      `preText=${visible(pre.textContent)}`,\n      `pWhiteSpace=${getComputedStyle(paragraph).whiteSpace}`,\n      `preWhiteSpace=${getComputedStyle(pre).whiteSpace}`,\n      `pDisplay=${getComputedStyle(paragraph).display}`,\n      `preDisplay=${getComputedStyle(pre).display}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-7", explanation: "표준 문서와 긴 pre가 viewport 전체를 밀지 않도록 overflow 정책을 둡니다." },
          { lines: "8-14", explanation: "p와 pre에 source 기준 완전히 같은 세 공백·한 줄바꿈 문자열을 넣고 결과 영역을 분리합니다." },
          { lines: "15-18", explanation: "공백을 가운데점, newline을 화살표로 바꾸는 관찰 함수와 두 element 참조를 만듭니다." },
          { lines: "19-28", explanation: "textContent, computed white-space와 display를 고정된 key=value 문자열로 기록합니다." },
          { lines: "29-32", explanation: "문서를 닫습니다. 시각 screenshot 없이도 DOM 문자열과 CSS formatting mode를 재현할 수 있습니다." },
        ],
        run: { environment: ["Chromium·Firefox·Safari 계열 현대 browser", "JavaScript 활성화", "network 불필요"], command: "whitespace-layers.html을 열고 #result의 여섯 줄과 실제 p/pre 줄바꿈을 비교" },
        output: { value: "pText=Alpha···Beta↵Gamma\npreText=Alpha···Beta↵Gamma\npWhiteSpace=normal\npreWhiteSpace=pre\npDisplay=block\npreDisplay=block", explanation: ["p와 pre의 textContent는 같은 세 공백·newline을 유지합니다.", "기본 computed white-space만 normal과 pre로 달라 화면 공백 표현이 달라집니다.", "둘 다 기본 block box지만 그 사실이 semantic 역할을 같게 만들지는 않습니다."] },
        experiments: [
          { change: "p에 `white-space: pre`를 적용합니다.", prediction: "p의 element 의미는 유지되지만 공백 표현은 pre처럼 보존됩니다.", result: "HTML semantics와 CSS formatting을 독립 축으로 검증할 수 있습니다." },
          { change: "pre에 매우 긴 URL 한 줄을 넣고 320px viewport에서 keyboard로 확인합니다.", prediction: "overflow:auto이면 페이지 전체가 아니라 pre 영역에 scroll이 생깁니다.", result: "공백 보존 선택에는 reflow·focus·scroll acceptance가 따라야 합니다." },
        ],
        sourceRefs: ["web-day01-paragraph-source", "whatwg-grouping", "csswg-display"],
      },
    ],
    diagnostics: [
      { symptom: "p의 source 줄바꿈이 사라졌다고 보고 parser bug를 의심하거나 공백 맞춤을 위해 nbsp를 반복한다.", likelyCause: "DOM text 보존과 CSS white-space collapse를 같은 계층으로 보았습니다.", checks: ["View Source와 textContent를 visible delimiter로 출력합니다.", "Computed의 white-space·display를 확인합니다.", "320px와 200% 확대에서 overflow·reflow를 검사합니다."], fix: "위치가 의미이면 pre 또는 명시적 white-space 정책을 쓰고, 단순 간격·정렬은 CSS layout으로 이동합니다.", prevention: "content fixture에 연속 공백·newline·긴 token·다국어 text를 넣고 DOM/Computed/reflow를 함께 회귀 검증합니다." },
    ],
    expertNotes: ["Unicode에는 ASCII space 외 non-breaking space, zero-width 문자, line/paragraph separator가 있습니다. validation·검색·길이 제한에서는 code unit 수만 보지 말고 product가 허용하는 normalization과 grapheme 정책을 문서화합니다.", "layout-dependent innerText를 large table loop에서 반복 읽으면 forced layout이 발생할 수 있습니다. DOM read와 style/layout read를 구분해 trace하고 batch합니다."],
  },
  {
    id: "machine-readable-inline-semantics",
    title: "inline 요소는 글꼴 효과보다 문장 속 역할과 machine-readable metadata를 전달합니다",
    lead: "time·abbr·code·mark는 기본 화면에서 모두 inline처럼 보일 수 있지만 서로 다른 의미·attribute·검색과 접근성 계약을 가집니다. 시각 효과가 같아도 가장 구체적인 element를 선택합니다.",
    explanations: [
      "time의 datetime은 사람이 읽는 표현과 기계가 해석하는 날짜·시간 값을 연결합니다. locale 표시를 자유롭게 유지하면서 일정·검색·parser에 표준 값을 제공할 수 있지만 timezone 없는 local time이 어느 지역 기준인지 문서 계약을 정해야 합니다.",
      "abbr의 title은 약어 확장 정보를 보완할 수 있지만 hover에만 의존하면 keyboard·touch·screen reader에서 항상 전달된다고 보장할 수 없습니다. 첫 등장에 본문으로 풀어 쓰고 약어를 괄호에 두는 방식이 가장 견고하며 title은 추가 정보로 사용합니다.",
      "code는 computer code fragment, kbd는 사용자 입력, samp는 프로그램 출력을 뜻합니다. monospace 글꼴만 원한다면 CSS를 사용하고, code block은 pre 안 code로 공백 구조와 의미를 함께 표현합니다. 실제 secret·token·개인 경로를 code example에 포함하지 않습니다.",
      "mark는 현재 문맥과 관련되어 highlight된 text를 뜻하고 strong은 중요성, em은 stress emphasis입니다. 검색 결과 강조처럼 관련성이 사라지면 mark도 제거해야 합니다. 색만으로 상태를 전달하지 않고 surrounding text와 contrast를 확인합니다.",
    ],
    concepts: [
      { term: "machine-readable value", definition: "사람용 표시와 별도로 parser·검색·application이 일관되게 해석할 수 있도록 attribute에 넣는 표준화된 값입니다.", detail: ["time의 datetime이 예입니다.", "timezone·형식·validation 책임이 필요합니다."] },
      { term: "phrasing semantics", definition: "문단 흐름 안 특정 text 범위의 역할·중요성·발화·기술적 종류를 표현하는 HTML 의미입니다.", detail: ["기본 inline display와 같은 개념이 아닙니다.", "화면 style은 CSS로 변경할 수 있습니다."] },
    ],
    codeExamples: [
      {
        id: "inline-semantics-metadata-inspection",
        title: "time·abbr·code·mark의 tag·metadata·computed display를 한 문장에서 검사",
        language: "html",
        filename: "inline-semantics.html",
        purpose: "모두 기본 inline display여도 tagName과 attribute가 서로 다른 semantic 계약을 갖는다는 사실을 브라우저 DOM으로 출력합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>문장 속 의미 점검</title>\n</head>\n<body>\n  <main>\n    <h1>배포 기록</h1>\n    <p id=\"sentence\">\n      <time datetime=\"2026-07-14T09:30:00+09:00\">7월 14일 오전 9시 30분</time>에\n      <abbr title=\"Document Object Model\">DOM</abbr> 예제의\n      <code>textContent</code> 결과를 <mark>재검증</mark>했습니다.\n    </p>\n    <pre id=\"result\"></pre>\n  </main>\n  <script>\n    const items = [...document.querySelectorAll(\"#sentence > *\")];\n    const time = document.querySelector(\"time\");\n    const abbr = document.querySelector(\"abbr\");\n    const lines = [\n      `elements=${items.map((item) => item.tagName).join(\",\")}`,\n      `datetime=${time.dateTime}`,\n      `abbrTitle=${abbr.title}`,\n      `allInline=${items.every((item) => getComputedStyle(item).display === \"inline\")}`,\n      `visibleText=${document.querySelector(\"#sentence\").textContent.replace(/\\s+/g, \" \" ).trim()}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-7", explanation: "독립 문서 metadata와 main을 준비합니다." },
          { lines: "8-16", explanation: "한 문장 안에 표준 datetime, 약어 확장, code fragment, 문맥상 highlight를 각각 구체적인 element로 표시합니다." },
          { lines: "17-20", explanation: "문장의 direct child element와 time·abbr DOM property를 얻습니다." },
          { lines: "21-28", explanation: "tag 순서, reflected metadata, computed display, whitespace-normalized visible text를 exact string으로 만듭니다." },
          { lines: "29-31", explanation: "결과를 pre에 기록하고 문서를 닫습니다. default style이 바뀌어도 tag·metadata 검사는 독립적으로 남습니다." },
        ],
        run: { environment: ["현대 browser", "JavaScript 활성화", "network 불필요"], command: "inline-semantics.html을 열고 #result와 Accessibility tree의 문장 이름을 확인" },
        output: { value: "elements=TIME,ABBR,CODE,MARK\ndatetime=2026-07-14T09:30:00+09:00\nabbrTitle=Document Object Model\nallInline=true\nvisibleText=7월 14일 오전 9시 30분에 DOM 예제의 textContent 결과를 재검증했습니다.", explanation: ["네 element는 기본 display가 모두 inline이지만 tagName과 metadata 계약은 서로 다릅니다.", "time.dateTime과 abbr.title은 attribute 값을 DOM property로 반영합니다.", "문장 전체의 공백은 관찰용으로 normalization해 source indentation과 사용자용 text를 구분했습니다."] },
        experiments: [
          { change: "abbr title을 제거하고 본문을 `Document Object Model(DOM)`으로 바꿉니다.", prediction: "hover 없이도 모든 사용자가 첫 등장 의미를 읽을 수 있습니다.", result: "본문 확장이 title-only 설명보다 견고한 baseline입니다." },
          { change: "mark를 span class=highlight로 바꿉니다.", prediction: "CSS 색은 같게 만들 수 있지만 현재 문맥과 관련된 highlight 의미는 사라집니다.", result: "의미가 필요한지 장식만 필요한지 먼저 결정합니다." },
        ],
        sourceRefs: ["web-day01-formatting-source", "whatwg-text-level", "wai-headings"],
      },
    ],
    diagnostics: [
      { symptom: "약어·시간·코드가 모두 span이고 색·font가 사라지면 무엇인지 구분되지 않는다.", likelyCause: "문장 속 역할을 element semantics가 아니라 CSS class만으로 표현했습니다.", checks: ["CSS를 끄고 문장을 읽습니다.", "DOM tagName과 datetime/title을 확인합니다.", "keyboard·touch에서 title-only 정보가 도달하는지 봅니다."], fix: "time·abbr·code·mark 등 가장 구체적인 element를 사용하고 필요한 설명은 visible text로 제공합니다.", prevention: "content style guide에 inline element 선택 표와 CSS-off·accessibility tree review를 둡니다." },
    ],
    expertNotes: ["datetime을 application에서 읽을 때 Date parser의 timezone·calendar 가정을 명시하고 server canonical value와 display locale을 분리합니다.", "semantic element가 자동으로 좋은 문구를 만들지는 않습니다. code 안 secret redaction, abbr 첫 등장 설명, mark 남용과 contrast는 사람 review가 필요합니다."],
  },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "일반 p에서 여러 공백이 하나처럼 보이면 DOM에서도 하나만 남나요?", answer: "그렇다고 단정할 수 없습니다. textContent에는 원문 공백이 남고 CSS white-space: normal이 layout에서 collapse할 수 있습니다." },
  { question: "pre를 쓰면 긴 code도 responsive 문제가 자동 해결되나요?", answer: "아닙니다. 공백 보존 때문에 긴 줄 overflow가 생길 수 있어 overflow·wrapping·320px·keyboard scroll을 검증해야 합니다." },
  { question: "time의 보이는 문자열과 datetime은 왜 분리하나요?", answer: "사람에게는 locale에 맞는 표현을, 기계에는 표준화된 날짜·시간 값을 제공하기 위해서입니다. timezone 계약도 함께 정합니다." },
  { question: "abbr의 title만으로 약어 설명을 끝내도 되나요?", answer: "권장하지 않습니다. hover를 못 쓰는 환경에서도 이해되도록 첫 등장 visible text에서 풀어 쓰고 title은 보조로 사용합니다." },
);

(session.completionChecklist as string[]).push(
  "source whitespace·DOM textContent·computed white-space·화면 표현을 네 계층으로 비교할 수 있다.",
  "preformatted content와 일반 문단을 의미에 따라 선택하고 긴 줄의 reflow·keyboard scroll을 검증할 수 있다.",
  "time·abbr·code·kbd·samp·mark의 문장 속 역할과 필요한 metadata를 설명할 수 있다.",
  "CSS를 끄고도 inline semantics가 이해되는지 확인하며 title-only·색상-only 정보 전달을 피할 수 있다.",
);

export default session;
