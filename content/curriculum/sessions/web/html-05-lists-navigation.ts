import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["html-05-lists-navigation"],
  slug: "html-05-lists-navigation",
  courseId: "web",
  moduleId: "01-html-document-forms",
  order: 5,
  title: "순서·비순서·설명 목록과 내비게이션 메뉴",
  subtitle: "bullet 모양을 고르는 수준을 넘어, 항목 사이의 의미 관계를 ol·ul·dl로 모델링하고 링크 목록을 접근 가능한 nav로 발전시킵니다.",
  level: "기초",
  estimatedMinutes: 135,
  coreQuestion: "콘텐츠가 목록이라는 사실과 순서의 중요성, 용어와 설명의 관계를 HTML로 어떻게 구분하고, 그 구조를 키보드와 보조기술도 이해하는 내비게이션으로 만들까요?",
  summary: "원본의 레시피 ol, 중첩 음료 ul, 상품 구성 dl, 가로 메뉴 예제를 모두 다시 읽습니다. ol·ul·li와 dl·dt·dd의 content model, start/value/reversed, 중첩 tree, marker와 list-style, nav landmark와 현재 페이지 표시를 연결합니다. 시각적으로 bullet을 없애도 DOM 의미는 남는다는 점, 메뉴와 모든 링크 목록이 같은 것은 아니라는 점, 과도한 중첩·빈 href·hover 전용 상태·가로 overflow를 진단하는 방법까지 다룹니다.",
  objectives: [
    "항목 순서가 결과에 영향을 주는지 판단해 ol과 ul을 선택할 수 있다.",
    "용어와 하나 이상의 설명 관계를 dl·dt·dd로 표현하고 잘못된 table 대용 사용을 피할 수 있다.",
    "중첩 목록에서 하위 목록을 해당 li 내부에 배치해 올바른 parent/child tree를 만들 수 있다.",
    "list marker의 의미와 CSS 표현을 분리하고 start·value·reversed가 필요한 번호 체계를 구현할 수 있다.",
    "주요 탐색 링크를 nav와 접근 가능한 이름으로 묶고 현재 페이지를 aria-current로 표시할 수 있다.",
    "keyboard focus·hover·small viewport·CSS 비활성 상태에서도 사용할 수 있는 내비게이션을 검증할 수 있다.",
  ],
  prerequisites: [
    { title: "이미지·배경·오디오·비디오·iframe의 선택 기준", reason: "앞 세션까지 익힌 문서 구조와 링크·media 대체 텍스트를 바탕으로 반복 콘텐츠를 관계 있는 목록으로 묶습니다.", sessionSlug: "html-04-images-background-media" },
  ],
  keywords: ["ol", "ul", "li", "dl", "dt", "dd", "list marker", "nested list", "nav", "aria-current", "keyboard navigation", "content model"],
  chapters: [
    {
      id: "recognize-list-information",
      title: "목록은 bullet 장식이 아니라 같은 종류의 항목이 반복된다는 정보 구조입니다",
      lead: "CSS를 모두 제거했을 때도 항목의 경계와 관계가 읽혀야 하며, HTML element 선택은 marker 모양이 아니라 순서와 관계로 결정합니다.",
      explanations: [
        "원본 레시피에는 재료 설명 뒤 네 단계가 이어집니다. 단계를 바꾸면 결과가 달라질 수 있으므로 ol이 자연스럽습니다. 반대로 Coffee·Tea·Milk처럼 선택지나 분류를 나열하고 순서가 중요하지 않으면 ul이 맞습니다. 숫자로 보이게 하고 싶다는 이유만으로 ol을 선택하지 않습니다.",
        "ol과 ul의 직접적인 목록 항목은 li입니다. li는 하나의 항목 전체를 감싸므로 단순 text뿐 아니라 paragraph·link·하위 목록 같은 flow content를 포함할 수 있습니다. 여러 div를 두고 CSS pseudo-element로 bullet을 그리면 시각 모양은 흉내 내도 목록의 항목 수와 계층이라는 의미를 잃습니다.",
        "browser와 screen reader는 목록 시작과 항목 수를 전달할 수 있습니다. 검색 crawler·Reader mode·자동 test도 이 구조를 활용합니다. 따라서 CSS로 list-style: none을 적용해 marker를 숨겨도 ul·li의 semantic은 DOM에 남습니다.",
        "모든 반복 UI가 반드시 list일 필요는 없습니다. 서로 독립적인 article 묶음은 section 안 article들이 더 직접적인 의미일 수 있고, key/value data는 dl 또는 table이 맞을 수 있습니다. 먼저 사용자가 항목을 어떤 관계로 이해해야 하는지 말로 설명한 뒤 element를 고릅니다.",
      ],
      concepts: [
        { term: "ordered list", definition: "항목의 의도된 순서가 의미를 가지는 목록이며 ol 안에 li를 둡니다.", detail: ["절차, 순위, 시간 순서에 적합합니다.", "기본 marker 모양이 숫자라는 사실보다 순서 의미가 선택 기준입니다."], analogy: "요리 순서처럼 3단계를 먼저 하면 결과가 달라지는 작업 지시서입니다." },
        { term: "unordered list", definition: "항목 순서를 바꾸어도 핵심 의미가 유지되는 목록이며 ul 안에 li를 둡니다.", detail: ["기능, 재료, 탐색 링크 묶음에 자주 씁니다.", "CSS로 marker를 숨겨도 목록 의미는 유지됩니다."], caveat: "순서가 전혀 없다는 뜻보다 현재 순서가 의미의 핵심이 아니라는 뜻입니다." },
        { term: "list item", definition: "ol 또는 ul이 나타내는 목록의 한 항목인 li element입니다.", detail: ["하위 목록은 관련된 li 안에 둡니다.", "한 항목의 link·설명·상태를 함께 감쌀 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "화면에는 bullet이 있지만 접근성 검사에서 list나 항목 수가 발견되지 않는다.", likelyCause: "div와 ::before content로 marker 모양만 만들었습니다.", checks: ["Elements에서 실제 ul/ol/li tree인지 확인합니다.", "CSS를 끄고 항목 경계를 읽습니다.", "accessibility tree에서 list/listitem role을 확인합니다."], fix: "실제 반복 관계를 ul 또는 ol과 li로 markup하고 marker 표현만 CSS로 조정합니다.", prevention: "component review에서 시각 screenshot뿐 아니라 semantic role과 keyboard 순서를 함께 확인합니다." },
      ],
    },
    {
      id: "ordered-list-numbering",
      title: "ol의 번호는 CSS 장식이면서 동시에 순서·진행·참조 의미를 전달합니다",
      lead: "기본 1부터 시작하는 순서 외에도 start·value·reversed로 문서 자체의 번호 체계를 표현할 수 있지만, 보이는 번호만 억지로 맞추는 데 쓰지 않습니다.",
      explanations: [
        "ol의 start는 첫 항목의 시작 정수, li의 value는 특정 항목 번호를 지정합니다. reversed는 내림차순 목록임을 나타냅니다. 문서가 여러 페이지로 나뉜 11번째 단계부터 시작하거나 실제 순위를 보여줄 때 유용합니다. 단지 디자인 시안이 로마 숫자라는 이유는 CSS list-style-type으로 해결합니다.",
        "원본은 upper-roman marker 예제를 inline style로 보여 줍니다. 학습 단계에서는 효과가 즉시 보여 유용하지만 재사용 site에서는 class와 stylesheet로 옮겨 content와 presentation을 분리합니다. square는 일반적으로 ul marker에 어울리며 ol에 적용하면 순서 의미는 DOM에 남아도 시각적으로 번호를 숨겨 사용자가 순서를 인지하기 어려울 수 있습니다.",
        "번호는 paragraph text에 '1.'을 직접 타이핑하는 것과 다릅니다. 항목을 추가·삭제하면 browser가 다시 계산하고, screen reader가 목록 구조로 알립니다. 직접 번호를 쓸 때는 번호와 content가 한 text가 되어 유지보수와 재정렬이 깨집니다.",
        "법령·문제 번호처럼 복잡한 다단계 numbering은 CSS counter를 고려할 수 있습니다. 그래도 source의 계층은 중첩 ol로 표현해야 하며, counter는 의미 tree를 대신하지 않습니다.",
      ],
      concepts: [
        { term: "list marker", definition: "각 list item 앞에 생성되는 숫자·문자·기호 영역입니다.", detail: ["::marker로 제한된 style을 적용할 수 있습니다.", "marker 표현과 ol/ul의 의미는 별개입니다."] },
        { term: "start/value/reversed", definition: "ordered list의 실제 번호 sequence를 문서에 선언하는 HTML 기능입니다.", detail: ["start는 ol 전체 시작점입니다.", "value는 개별 li 번호를 바꾸며 뒤 항목에도 영향을 줍니다.", "reversed는 내림차순입니다."], caveat: "시각 순서를 CSS order로 뒤집고 DOM 번호는 그대로 두면 읽기 순서와 화면 순서가 달라질 수 있습니다." },
      ],
      codeExamples: [
        {
          id: "recipe-and-ranking-lists",
          title: "절차와 순위를 번호 의미에 맞게 표현하기",
          language: "html",
          filename: "ordered-lists.html",
          purpose: "ol의 기본 절차, start, value, reversed를 실제 DOM 번호와 함께 확인합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>순서 목록</title>\n  <style>.roman { list-style-type: upper-roman; }</style>\n</head>\n<body>\n  <main>\n    <h1>배포 전 확인</h1>\n    <ol class=\"roman\">\n      <li>자동 검사를 실행한다.</li>\n      <li>미리보기에서 키보드로 이동한다.</li>\n      <li>검증된 commit을 배포한다.</li>\n    </ol>\n\n    <h2>상위 3개 개선 과제</h2>\n    <ol reversed start=\"3\">\n      <li>문서 link 점검</li>\n      <li value=\"2\">모바일 overflow 제거</li>\n      <li>접근성 이름 확인</li>\n    </ol>\n  </main>\n</body>\n</html>",
          walkthrough: [
            { lines: "1-7", explanation: "한국어 standards 문서와 재사용 가능한 roman class를 준비합니다. numbering 의미는 HTML, marker 모양은 CSS가 맡습니다." },
            { lines: "10-14", explanation: "실행 순서가 중요한 배포 확인 절차를 ol과 세 li로 구성합니다." },
            { lines: "17-21", explanation: "내림차순 ranking을 reversed와 start=3으로 선언합니다. 두 번째 value=2는 명시적인 실제 번호이며 다음 항목은 1이 됩니다." },
          ],
          run: { environment: ["UTF-8 text editor", "현대 browser"], command: "browser에서 ordered-lists.html 열기" },
          output: { value: "배포 전 확인\nI. 자동 검사를 실행한다.\nII. 미리보기에서 키보드로 이동한다.\nIII. 검증된 commit을 배포한다.\n\n상위 3개 개선 과제\n3. 문서 link 점검\n2. 모바일 overflow 제거\n1. 접근성 이름 확인", explanation: ["roman class는 첫 목록의 marker만 바꿉니다.", "두 번째 목록은 실제 내림차순 순위를 DOM에 표현합니다.", "CSS를 끄면 첫 목록 marker는 decimal로 돌아오지만 두 목록 모두 ordered list 의미는 유지됩니다."] },
          experiments: [
            { change: "첫 ol을 ul로 바꾸고 CSS roman은 유지합니다.", prediction: "일부 browser에서 roman marker가 보일 수 있어도 semantic은 unordered list가 됩니다.", result: "모양은 element 선택의 근거가 아니며 절차에는 ol을 유지해야 합니다." },
            { change: "reversed를 제거하고 start=3만 남깁니다.", prediction: "번호가 3, 4, 5로 증가합니다.", result: "start는 방향을 바꾸지 않고 시작값만 지정합니다." },
          ],
          sourceRefs: ["web-list-source", "whatwg-grouping-content"],
        },
      ],
      diagnostics: [
        { symptom: "화면 순위는 3·2·1처럼 보이지만 screen reader가 순서를 다르게 읽거나 복사하면 번호가 사라진다.", likelyCause: "CSS pseudo-element로 번호를 그리거나 flex order로 시각 위치만 뒤집었습니다.", checks: ["DOM order와 ol attributes를 확인합니다.", "CSS를 끄고 항목 순서를 읽습니다.", "keyboard focus 이동 순서와 화면 순서를 비교합니다."], fix: "의도한 읽기 순서대로 DOM을 두고 ol reversed/start/value로 numbering 의미를 선언합니다.", prevention: "시각 순서·DOM 순서·focus 순서가 일치하는지 responsive QA에 포함합니다." },
      ],
    },
    {
      id: "nested-list-tree",
      title: "중첩 목록은 들여쓰기가 아니라 항목의 포함 관계를 나타내는 tree입니다",
      lead: "하위 ul 또는 ol은 자신을 설명하는 상위 li 안에 있어야 parent item과의 관계가 명확해집니다.",
      explanations: [
        "원본 Coffee 예제는 Coffee li 안에 따뜻한 커피와 차가운 커피 ul을 두고, 다시 따뜻한 커피 안에서 size를 중첩합니다. source indentation은 사람이 읽기 좋게 할 뿐이며 실제 관계는 opening/closing tag가 만든 DOM tree가 결정합니다.",
        "상위 li를 닫은 다음 sibling으로 ul을 두면 화면에서는 비슷하게 들여쓸 수 있어도 어떤 항목의 하위 목록인지 구조적으로 약해집니다. 올바른 pattern은 <li>상위 이름<ul>...</ul></li>입니다. DevTools에서 child UL이 해당 LI 안에 있는지 확인합니다.",
        "중첩 단계가 깊을수록 사용자는 현재 위치를 잃습니다. 원본의 5단계 구조는 tree 학습에는 좋지만 실제 navigation이나 상품 분류에서는 정보 architecture를 다시 설계하고 두세 단계 이후 검색·breadcrumb·별도 페이지를 고려합니다.",
        "중첩 ol은 장·절·항처럼 계층적 절차를 나타낼 수 있고, ul 안 ol처럼 종류를 섞을 수도 있습니다. 각 단계에서 '순서가 중요한가'를 새로 판단합니다. 부모가 ul이라고 자식도 반드시 ul일 필요는 없습니다.",
      ],
      concepts: [
        { term: "nested list", definition: "하나의 li가 다시 ol 또는 ul을 자식으로 포함해 상위 항목과 하위 항목 관계를 표현한 구조입니다.", detail: ["들여쓰기 CSS보다 DOM parent 관계가 본질입니다.", "각 깊이마다 ordered/unordered를 독립 판단합니다."] },
        { term: "information architecture", definition: "사용자가 정보의 분류·계층·label·탐색 경로를 예측할 수 있게 구조화하는 설계입니다.", detail: ["깊은 중첩을 무조건 HTML로 옮기는 것보다 category 재구성이 중요합니다.", "navigation, breadcrumb, search와 연결됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "하위 항목이 시각적으로는 들여쓰기 되지만 접근성 tree에서 상위 항목과 별도 목록으로 읽힌다.", likelyCause: "부모 li를 먼저 닫은 뒤 하위 ul을 sibling으로 배치했습니다.", checks: ["DevTools에서 하위 UL의 parent가 LI인지 확인합니다.", "validator의 content model 오류를 확인합니다.", "screen reader list nesting announce를 듣습니다."], fix: "하위 목록을 관련 상위 li의 닫는 tag 앞, 즉 li 내부로 옮깁니다.", prevention: "formatter indentation만 믿지 말고 DOM tree와 validator를 함께 확인합니다." },
      ],
    },
    {
      id: "description-list-relations",
      title: "dl은 이름과 하나 이상의 설명이 이루는 association group을 표현합니다",
      lead: "사전 정의뿐 아니라 metadata·상품 사양·질문과 답처럼 용어와 설명 관계가 핵심일 때 사용합니다.",
      explanations: [
        "dl 안의 dt는 설명할 term/name, dd는 description/value입니다. 원본 상품 구성처럼 하나의 dt 뒤에 여러 dd가 올 수 있고, 여러 dt가 하나의 설명을 공유하는 grouping도 가능합니다. 단순히 왼쪽 label과 오른쪽 값을 맞추는 layout 도구가 아닙니다.",
        "키보드-표준입력장치처럼 짧은 정의, 상품명-구성 옵션, API metadata의 label-value 등에 적합합니다. 그러나 행과 열을 교차 비교해야 하는 가격표·성적표는 table이 더 정확합니다. form의 label과 input 관계도 dl이 아니라 label element와 form control API로 선언해야 합니다.",
        "dt 안에 heading role을 무분별하게 넣지 않습니다. dl 자체 앞에 h2를 두어 section의 목적을 설명하고, CSS grid를 dl에 적용해 두 열처럼 배치할 수 있습니다. 작은 화면에서는 한 열로 되돌려 reading order를 유지합니다.",
        "colon을 dt text 끝에 직접 넣는 것은 언어와 디자인에 따라 선택할 수 있지만 pseudo-element로만 중요한 구분자를 제공하면 copy·speech output 차이가 생길 수 있습니다. 관계는 dl 구조로 이미 전달되므로 punctuation은 보조 표현입니다.",
      ],
      concepts: [
        { term: "description list", definition: "dt로 표현한 이름·용어와 dd로 표현한 설명·값의 association group들을 담는 dl element입니다.", detail: ["한 dt에 여러 dd가 연결될 수 있습니다.", "dictionary에만 한정되지 않습니다."] },
        { term: "association group", definition: "연속된 하나 이상의 dt와 하나 이상의 dd가 한 관계 묶음을 이루는 구조입니다.", detail: ["source 순서가 연결 관계를 만듭니다.", "비교용 2차원 data이면 table을 검토합니다."] },
      ],
      codeExamples: [
        {
          id: "course-metadata-description-list",
          title: "한 이름에 여러 설명을 연결한 과정 metadata",
          language: "html",
          filename: "course-details.html",
          purpose: "dl·dt·dd의 association을 유지하면서 CSS Grid를 점진적으로 적용합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>과정 정보</title>\n  <style>\n    .details { display: grid; grid-template-columns: 8rem 1fr; gap: .5rem 1rem; }\n    .details dt { font-weight: 700; }\n    .details dd { margin: 0; }\n    @media (max-width: 30rem) { .details { grid-template-columns: 1fr; } }\n  </style>\n</head>\n<body>\n  <main>\n    <h1>HTML 문서 과정</h1>\n    <dl class=\"details\">\n      <dt>학습 시간</dt>\n      <dd>135분</dd>\n      <dt>준비물</dt>\n      <dd>현대 브라우저</dd>\n      <dd>텍스트 편집기</dd>\n      <dt>완료 기준</dt>\n      <dd>목록과 내비게이션 접근성 검사 통과</dd>\n    </dl>\n  </main>\n</body>\n</html>",
          walkthrough: [
            { lines: "5-10", explanation: "dl의 semantic을 바꾸지 않고 큰 화면은 label/value 두 열, 좁은 화면은 source order 한 열로 표현합니다." },
            { lines: "15-24", explanation: "h1이 목록 전체의 목적을 제공하고 각 dt 뒤 dd가 association을 이룹니다. 준비물에는 dd 두 개가 연결됩니다." },
          ],
          run: { environment: ["현대 browser", "폭 480px 이하와 이상 viewport"], command: "browser에서 course-details.html을 열고 viewport 폭 변경" },
          output: { value: "HTML 문서 과정\n학습 시간  135분\n준비물      현대 브라우저\n            텍스트 편집기\n완료 기준   목록과 내비게이션 접근성 검사 통과\n(폭 480px 이하에서는 같은 순서의 한 열)", explanation: ["visual column이 바뀌어도 DOM 순서는 dt 다음 관련 dd입니다.", "준비물 한 term에 두 description이 연결됩니다.", "CSS가 로드되지 않아도 모든 text와 관계가 남습니다."] },
          experiments: [
            { change: "dl을 div로 바꾸고 class만 유지합니다.", prediction: "grid 모양은 비슷하지만 description list의 관계와 항목 announce를 잃습니다.", result: "CSS class는 semantic을 만들지 않습니다." },
            { change: "준비물의 두 dd를 하나의 dd 안 ul로 바꿉니다.", prediction: "두 준비물을 하나의 설명 안 명시적 목록으로 읽습니다.", result: "여러 설명인지 한 설명 속 여러 항목인지 content 의미에 따라 선택합니다." },
          ],
          sourceRefs: ["web-dl-source", "whatwg-grouping-content"],
        },
      ],
      diagnostics: [
        { symptom: "성적표처럼 여러 학생과 과목을 교차 비교하기 어렵고 screen reader가 header 관계를 알지 못한다.", likelyCause: "2차원 tabular data를 dl의 label/value 나열로 표현했습니다.", checks: ["행과 열 header가 모두 필요한지 질문합니다.", "특정 cell이 어떤 row/column에 속하는지 설명해 봅니다.", "좁은 화면에서도 비교 목적이 유지되는지 확인합니다."], fix: "행·열 관계가 핵심이면 caption과 th를 갖춘 table로 전환합니다.", prevention: "dl은 association, table은 2차원 비교라는 선택 기준을 content 설계 checklist에 둡니다." },
      ],
      comparisons: [
        { title: "반복 정보에 맞는 구조 고르기", options: [
          { name: "ul/ol", chooseWhen: "동일 종류의 항목을 나열하고 선택 또는 순서가 핵심일 때", avoidWhen: "이름-설명이나 행-열 교차 관계가 핵심일 때", tradeoffs: ["목록 수와 계층이 명확합니다.", "표 형태 비교 의미는 제공하지 않습니다."] },
          { name: "dl", chooseWhen: "용어·이름과 설명·값의 association을 표현할 때", avoidWhen: "form label 연결이나 2차원 표 data일 때", tradeoffs: ["한 term과 여러 description 관계를 표현합니다.", "browser 기본 style만으로 관계가 시각적으로 약할 수 있습니다."] },
          { name: "table", chooseWhen: "row와 column header를 따라 여러 값을 비교할 때", avoidWhen: "단순 layout 두 열을 만들고 싶을 뿐일 때", tradeoffs: ["복잡한 data 관계에 강합니다.", "작은 화면 responsive 전략이 더 필요합니다."] },
        ] },
      ],
    },
    {
      id: "navigation-list-landmark",
      title: "주요 탐색은 nav landmark 안의 링크 목록으로 만들고 목적과 현재 위치를 알려야 합니다",
      lead: "원본 ul 메뉴의 좋은 출발점을 nav·접근 가능한 이름·실제 URL·현재 페이지 상태·keyboard focus까지 확장합니다.",
      explanations: [
        "navigation은 보통 link들의 목록이므로 ul이 자연스럽습니다. nav는 페이지나 site의 주요 탐색 link section을 나타내는 landmark입니다. footer의 모든 보조 link 묶음까지 무조건 nav로 감싸기보다 사용자가 반복적으로 이동에 쓰는 주요 group을 식별합니다.",
        "한 페이지에 nav가 여러 개면 aria-label 또는 보이는 heading과 aria-labelledby로 '주요 메뉴', '학습 과정 내비게이션'처럼 구분합니다. label에는 'navigation'이라는 role 이름을 반복하기보다 목적을 짧게 씁니다.",
        "현재 문서 link에는 aria-current='page'를 둡니다. 색이나 border만으로 현재 상태를 전달하면 색을 구분하기 어렵거나 CSS가 없을 때 의미가 사라집니다. aria-current는 click을 막는 속성이 아니라 상태 정보이므로 href를 유지할지 제품 behavior에 따라 결정합니다.",
        "사이트 navigation은 일반적으로 a link를 사용합니다. button은 현재 page에서 menu panel을 열거나 state를 바꾸는 action에 씁니다. href='#'는 top으로 이동하고 history/URL 의미가 없는 placeholder이므로 완성 자료에서는 실제 route를 넣습니다.",
      ],
      concepts: [
        { term: "navigation landmark", definition: "사용자가 다른 문서나 같은 문서의 주요 위치로 이동하는 link group을 나타내는 nav 영역입니다.", detail: ["반복 탐색을 빠르게 건너뛸 수 있습니다.", "여러 nav는 고유한 accessible name으로 구분합니다."] },
        { term: "aria-current", definition: "link 집합·단계·날짜 등에서 현재 항목을 표시하는 ARIA state입니다.", detail: ["현재 문서 link에는 page 값을 사용합니다.", "시각 style과 함께 제공하되 style을 대신하지 않습니다."] },
        { term: "link versus button", definition: "link는 URL로 이동하고 button은 현재 context에서 action을 실행한다는 interaction 계약입니다.", detail: ["새 문서·route 이동은 a href입니다.", "menu open/close는 button입니다."], caveat: "CSS로 서로 모양을 바꿔도 keyboard behavior와 semantic 역할은 바뀌지 않습니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "Tab으로 메뉴에 도달해도 현재 페이지를 알 수 없고 mouse hover에서만 상태가 보인다.", likelyCause: ":hover만 style하고 :focus-visible·aria-current를 제공하지 않았습니다.", checks: ["mouse 없이 Tab/Shift+Tab로 전부 이동합니다.", "현재 link의 aria-current 값을 확인합니다.", "forced-colors와 CSS 비활성 상태에서 현재 위치를 확인합니다."], fix: "focus-visible outline을 명확히 하고 현재 link에 aria-current='page'와 비색상 indicator를 함께 제공합니다.", prevention: "keyboard path와 current-page announce를 navigation component test case로 고정합니다." },
      ],
    },
    {
      id: "navigation-responsive-css",
      title: "메뉴 CSS는 source order·hit target·focus를 보존하며 작은 화면에서도 overflow 없이 적응해야 합니다",
      lead: "inline-block과 overflow:hidden으로 한 줄을 강제한 원본을 flex-wrap과 간격, 명확한 focus style을 갖춘 progressive enhancement로 개선합니다.",
      explanations: [
        "원본은 ul의 marker와 margin/padding을 없애고 li를 inline-block, a를 block으로 만들어 넓은 click 영역을 제공합니다. 핵심 원리는 link 자체에 padding을 주어 text 주변도 interactive target으로 만드는 것입니다. li에만 padding을 두면 보이는 영역 일부가 click되지 않습니다.",
        "overflow:hidden은 float layout을 감싸던 legacy 기법이나 넘친 content를 잘라낼 수 있습니다. 긴 번역 text·200% zoom·small viewport에서 메뉴가 보이지 않으면 기능 손실입니다. 현대 layout에서는 display:flex, flex-wrap:wrap, gap을 사용하거나 mobile disclosure menu를 설계합니다.",
        "outline: none으로 focus 표시를 제거하지 않습니다. :hover와 :focus-visible에 동등한 시각 feedback을 주고, current state는 border·font weight·underline 등 색 외의 cue도 씁니다. border 추가가 layout shift를 만들면 처음부터 transparent border 공간을 확보할 수 있습니다.",
        "menu라는 ARIA role은 desktop application식 composite widget keyboard model을 요구할 수 있습니다. 일반 website navigation에 role='menu'와 menuitem을 무심코 추가하지 말고 native nav, ul, a의 익숙한 Tab/link behavior를 유지합니다.",
      ],
      concepts: [
        { term: "progressive enhancement", definition: "의미 있는 HTML link 목록을 baseline으로 두고 CSS layout과 JavaScript behavior를 실패해도 핵심 탐색이 남도록 더하는 방식입니다.", detail: ["CSS 없이도 link가 보여야 합니다.", "JavaScript 없이도 route에 접근 가능해야 합니다."] },
        { term: "focus-visible", definition: "keyboard 등 focus indicator가 필요한 방식으로 focus된 element를 주로 선택하는 pseudo-class입니다.", detail: ["browser 기본 outline을 존중하거나 더 명확히 만듭니다.", "hover와 별도 상태입니다."] },
      ],
      codeExamples: [
        {
          id: "accessible-responsive-navigation",
          title: "현재 위치와 keyboard focus가 보이는 반응형 navigation",
          language: "html",
          filename: "navigation.html",
          purpose: "nav·ul·a의 native semantic을 유지하며 flex wrapping, current state, hover/focus를 구현합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>학습 내비게이션</title>\n  <style>\n    * { box-sizing: border-box; }\n    .site-nav ul { display: flex; flex-wrap: wrap; gap: .25rem; margin: 0; padding: 0; list-style: none; }\n    .site-nav a { display: block; padding: .75rem 1rem; color: #17324d; text-underline-offset: .25em; border-block-end: .2rem solid transparent; }\n    .site-nav a:hover { background: #e9f3ff; }\n    .site-nav a:focus-visible { outline: .2rem solid #a33b00; outline-offset: .15rem; }\n    .site-nav a[aria-current=\"page\"] { font-weight: 700; border-block-end-color: currentColor; }\n  </style>\n</head>\n<body>\n  <header>\n    <nav class=\"site-nav\" aria-label=\"주요 메뉴\">\n      <ul>\n        <li><a href=\"/\">홈</a></li>\n        <li><a href=\"/curriculum\" aria-current=\"page\">학습 과정</a></li>\n        <li><a href=\"/projects\">프로젝트</a></li>\n        <li><a href=\"/about\">소개</a></li>\n      </ul>\n    </nav>\n  </header>\n  <main><h1>학습 과정</h1></main>\n</body>\n</html>",
          walkthrough: [
            { lines: "7-13", explanation: "source order는 유지하고 flex-wrap으로 좁은 폭에서 다음 줄로 보냅니다. link padding이 전체 hit target을 만듭니다." },
            { lines: "11-13", explanation: "hover, keyboard focus, 현재 페이지를 서로 다른 selector와 비색상 cue로 제공합니다." },
            { lines: "18-25", explanation: "이름 있는 nav 안 ul·li·실제 href link를 두고 현재 route 하나에 aria-current=page를 선언합니다." },
            { lines: "28", explanation: "body의 h1도 현재 link 이름과 일치해 사용자가 이동 결과를 확인합니다." },
          ],
          run: { environment: ["현대 browser", "keyboard", "DevTools responsive mode 320px 이상"], command: "browser에서 navigation.html을 열고 Tab 이동 및 viewport 축소" },
          output: { value: "주요 메뉴 landmark\n홈 | 학습 과정(현재 페이지) | 프로젝트 | 소개\n본문 제목: 학습 과정\n좁은 폭: 항목이 source 순서를 유지한 채 다음 줄로 줄바꿈\nTab focus: 각 link에 갈색 outline 표시", explanation: ["list marker는 시각적으로 숨었지만 accessibility tree의 list/listitem 의미는 남습니다.", "aria-current와 underline/border가 현재 위치를 함께 전달합니다.", "overflow:hidden이 없어 zoom이나 긴 text를 자르지 않습니다."] },
          experiments: [
            { change: "ul의 flex-wrap을 nowrap으로 바꾸고 viewport를 320px로 줄입니다.", prediction: "긴 menu가 가로로 넘치거나 page 전체 horizontal scroll을 만들 수 있습니다.", result: "responsive navigation은 고정된 한 줄보다 content 증가와 zoom을 견뎌야 합니다." },
            { change: "a의 padding을 li로 옮깁니다.", prediction: "보이는 여백을 눌러도 link가 activation되지 않습니다.", result: "interactive target 크기는 실제 a/button box가 가져야 합니다." },
            { change: "aria-current와 focus-visible rule을 제거합니다.", prediction: "현재 위치와 keyboard focus를 색/hover에 의존하게 됩니다.", result: "state와 input 방식마다 독립적인 feedback이 필요합니다." },
          ],
          sourceRefs: ["web-menu-source", "wai-menus-source", "wai-page-structure"],
        },
      ],
      diagnostics: [
        { symptom: "200% zoom 또는 긴 한국어 label에서 메뉴 일부가 잘리고 접근할 수 없다.", likelyCause: "nowrap·고정 width·overflow:hidden 조합으로 한 줄 layout을 강제했습니다.", checks: ["320 CSS px와 200% zoom에서 horizontal overflow를 확인합니다.", "text를 두 배 길이로 바꿉니다.", "Tab으로 화면 밖 link까지 이동해 focus가 보이는지 확인합니다."], fix: "flex-wrap을 허용하고 고정 폭/clip을 제거하거나 접근 가능한 disclosure navigation pattern으로 전환합니다.", prevention: "long-label, zoom, small-viewport case를 visual regression과 keyboard QA에 포함합니다." },
        { symptom: "일반 site link에 role=menu를 추가한 뒤 arrow key가 동작하지 않는다는 접근성 지적이 나온다.", likelyCause: "필요한 composite widget keyboard behavior 없이 application menu role만 선언했습니다.", checks: ["실제 요구가 site navigation인지 application command menu인지 구분합니다.", "ARIA role에 요구되는 keyboard pattern을 확인합니다.", "native nav/ul/a로 충분한지 검토합니다."], fix: "일반 site 탐색이면 menu/menuitem role을 제거하고 nav·link semantic과 Tab behavior를 사용합니다.", prevention: "ARIA를 추가하기 전에 native HTML로 요구를 충족하는지 먼저 검토합니다." },
      ],
      expertNotes: [
        "SPA router의 Link component도 최종 DOM에서 유효한 href를 가진 anchor가 되어야 새 tab, copy link, browser history 같은 web 기본 동작을 보존합니다.",
        "현재 route 판정은 prefix 비교만 쓰면 /course와 /course-old가 동시에 current가 될 수 있습니다. route segment 기준으로 하나의 aria-current=page만 설정하고 rendered test로 검증합니다.",
      ],
    },
    {
      id: "lists-navigation-verification",
      title: "목록과 내비게이션은 source·DOM·접근성 tree·interaction 네 층에서 검증합니다",
      lead: "문법 validator만 통과하거나 화면만 예쁘다고 끝내지 않고 의미 구조와 실제 사용자 경로를 반복 가능한 검사로 만듭니다.",
      explanations: [
        "첫째 source와 HTML validator에서 li 위치, 닫는 tag, 중첩 content model을 확인합니다. 둘째 DevTools DOM에서 parser가 복구한 실제 parent/child 관계를 확인합니다. 셋째 accessibility tree에서 navigation 이름, list와 항목 수, current state를 봅니다. 넷째 keyboard·zoom·mobile viewport에서 link를 실제로 사용합니다.",
        "CSS를 끄는 검사는 progressive enhancement를 빠르게 보여 줍니다. 항목 순서와 link text가 이해되고 모든 href가 이동해야 합니다. JavaScript를 끄거나 network를 느리게 했을 때도 주요 route link가 server fallback 또는 실제 document URL을 가져야 합니다.",
        "자동 test는 nav 안 link의 accessible name과 href, aria-current 개수, broken internal route, horizontal overflow를 검사할 수 있습니다. 하지만 정보 architecture가 이해되는지, label이 모호하지 않은지는 사람 review가 필요합니다.",
        "목록이 길어지면 항목 수보다 찾기 비용이 문제입니다. heading으로 group을 나누고 search/filter를 제공하되, filtering result count와 empty state를 알립니다. virtualized list는 DOM에서 보이지 않는 항목과 screen reader 탐색의 tradeoff를 별도로 검증합니다.",
      ],
      concepts: [
        { term: "accessible name", definition: "보조기술이 landmark나 control을 구분할 때 사용하는 계산된 이름입니다.", detail: ["nav는 aria-label 또는 heading 연결로 구분할 수 있습니다.", "link는 대개 visible text가 이름이 됩니다."] },
        { term: "semantic regression", definition: "화면은 비슷하지만 refactoring 뒤 role·name·state·reading order가 사라지는 회귀입니다.", detail: ["snapshot image만으로 찾기 어렵습니다.", "DOM/accessibility assertions와 keyboard test가 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "두 nav가 모두 단순히 'navigation'으로만 읽혀 사용자가 원하는 영역을 선택하기 어렵다.", likelyCause: "한 페이지의 여러 navigation landmark에 구분되는 accessible name이 없습니다.", checks: ["landmark 목록을 확인합니다.", "각 nav의 aria-label/aria-labelledby를 봅니다.", "label이 보이는 heading과 일치하는지 확인합니다."], fix: "각 nav 목적에 맞게 '주요 메뉴', '과정 목차'처럼 고유하고 간결한 이름을 제공합니다.", prevention: "페이지 단위 landmark map을 설계하고 중복 role에는 이름을 요구합니다." },
      ],
    },
  ],
  lab: {
    title: "원본 가로 메뉴와 깊은 음료 목록을 접근 가능한 학습 사이트 navigation으로 재설계하기",
    scenario: "학습 사이트에 과정 분류가 늘면서 한 줄 메뉴가 mobile에서 잘리고, 현재 과정과 하위 topic 관계도 알기 어렵습니다. CSS가 실패해도 사용할 수 있는 목록 기반 navigation으로 바꿉니다.",
    setup: ["navigation.html을 새 UTF-8 file로 준비합니다.", "과정 5개와 각 과정의 대표 topic 2개를 text로 먼저 적습니다.", "browser DevTools Elements·Accessibility와 320px responsive viewport를 준비합니다."],
    steps: [
      "각 항목의 순서 의미를 판단하고 주요 과정은 ul, 단계형 학습 순서는 ol로 분리합니다.",
      "site 이동 link 묶음을 이름 있는 nav 안 ul·li·a로 작성하고 실제 상대 URL을 부여합니다.",
      "현재 문서 link 하나에 aria-current='page'를 설정하고 body h1과 목적을 맞춥니다.",
      "하위 topic 목록은 해당 과정 li 내부에 중첩하고 3단계를 넘는 분류는 별도 page로 분리합니다.",
      "CSS 없이 문서 순서와 모든 link를 검사한 뒤 flex-wrap·gap·link padding을 더합니다.",
      "hover·focus-visible·current 상태를 각각 구현하고 색 외 underline/border/outline cue를 둡니다.",
      "320px, 200% zoom, 긴 label에서 overflow와 clip이 없는지 확인합니다.",
      "Accessibility tree에서 nav 이름, list 항목 수, current state를 기록합니다.",
    ],
    expectedResult: ["CSS/JavaScript가 없어도 모든 과정 link가 source 순서로 보이고 이동합니다.", "하위 목록이 관련 li의 child로 나타납니다.", "각 nav landmark가 고유한 이름을 가지며 현재 page 하나가 announce됩니다.", "Tab focus가 항상 화면 안에 보이고 작은 viewport에서 항목이 잘리지 않습니다.", "ol·ul·dl을 선택한 이유를 순서·association·비교 관계로 설명할 수 있습니다."],
    cleanup: ["실험용 href='#'를 실제 route 또는 안전한 example URL로 교체합니다.", "DevTools에서 임시로 바꾼 DOM/style을 reload해 원본과 일치시킵니다."],
    extensions: ["breadcrumb를 이름 있는 nav와 ol로 만들고 현재 항목을 link가 아닌 text로 비교합니다.", "Playwright로 nav link accessible name·href·aria-current 개수·horizontal overflow를 자동 검사합니다.", "과정이 50개일 때 heading group·search·filter 중 어떤 정보 architecture가 적합한지 설계 문서로 남깁니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "장보기 항목과 조리 4단계를 각각 올바른 목록으로 작성하세요.", requirements: ["장보기는 ul, 조리 단계는 ol을 사용합니다.", "모든 항목은 li이며 직접 입력한 숫자·bullet text를 쓰지 않습니다.", "CSS를 꺼도 관계가 읽혀야 합니다."], hints: ["순서를 바꾸었을 때 결과가 달라지는지 묻습니다.", "marker 모양은 나중에 CSS로 바꿉니다."], expectedOutcome: "screen reader가 두 목록과 각 항목 수를 구분하고 조리 단계가 1부터 자동 numbering됩니다.", solutionOutline: ["h1 아래 h2 두 개로 group 목적을 씁니다.", "재료 ul과 절차 ol을 sibling section에 둡니다."] },
    { difficulty: "응용", prompt: "원본 상품 구성을 responsive description list로 개선하세요.", requirements: ["하나의 상품명에 여러 구성 dd를 연결합니다.", "큰 화면 두 열·작은 화면 한 열이되 DOM 순서를 바꾸지 않습니다.", "table이 아닌 이유를 한 문단으로 설명합니다.", "CSS 비활성 결과도 확인합니다."], hints: ["dt 다음 연속 dd가 association group을 이룹니다.", "grid-template-columns는 presentation일 뿐입니다."], expectedOutcome: "상품명과 여러 설명의 관계가 DOM/accessibility tree에 남고 320px에서 가로 overflow가 없습니다.", solutionOutline: ["h2와 dl을 만들고 dt/dd source 순서를 먼저 완성합니다.", "media query로 grid column만 변경합니다."] },
    { difficulty: "설계", prompt: "학습 과정·세션·현재 위치를 보여 주는 production navigation component 명세와 검증 전략을 설계하세요.", requirements: ["nav accessible name, 목록 계층, link/button 선택 규칙을 명시합니다.", "current page, hover, focus-visible, disabled/loading 상태를 구분합니다.", "320px·200% zoom·긴 번역·CSS/JS 실패 case를 포함합니다.", "자동 test와 사람 review 경계를 정의합니다.", "SPA와 server-rendered link behavior를 모두 설명합니다."], hints: ["시각 state, semantic state, interaction state를 표로 나눕니다.", "ARIA menu pattern이 정말 필요한지 먼저 반증합니다."], expectedOutcome: "구현자가 native HTML baseline을 유지하고 회귀 test를 작성할 수 있는 component 계약이 완성됩니다.", solutionOutline: ["information architecture와 route model을 먼저 확정합니다.", "DOM 예시와 keyboard path를 작성합니다.", "role/name/state 및 overflow assertions를 test 목록으로 만듭니다."] },
  ],
  reviewQuestions: [
    { question: "숫자 marker가 필요하면 항상 ol을 써야 하나요?", answer: "아닙니다. ol 선택 기준은 항목 순서가 의미를 가지는지입니다. marker 모양은 CSS list-style-type으로 바꿉니다." },
    { question: "중첩 ul은 상위 li 뒤에 두어도 화면만 들여쓰면 같은가요?", answer: "아닙니다. 하위 목록은 관련 li 내부에 있어야 parent/child 관계가 DOM과 접근성 tree에 표현됩니다." },
    { question: "dl은 언제 table보다 적합한가요?", answer: "용어·이름과 하나 이상의 설명·값 association이 핵심일 때입니다. row와 column을 교차 비교하면 table이 적합합니다." },
    { question: "list-style:none이면 screen reader의 목록 의미도 사라지나요?", answer: "일반적으로 HTML ul/ol/li 구조는 남지만 browser·보조기술 조합과 CSS technique 차이를 test해야 합니다. 의미를 위해 실제 목록 element를 유지합니다." },
    { question: "일반 website navigation에 role=menu를 붙이면 더 접근 가능한가요?", answer: "대개 아닙니다. menu role은 별도 keyboard pattern을 요구할 수 있으므로 일반 탐색은 native nav·ul·a가 더 익숙하고 견고합니다." },
    { question: "현재 page는 색으로만 표시해도 되나요?", answer: "안 됩니다. aria-current='page'와 underline·border·font weight 같은 비색상 cue를 함께 제공합니다." },
    { question: "link와 button을 나누는 핵심 질문은 무엇인가요?", answer: "URL로 이동하면 link, 현재 context에서 state/action을 실행하면 button입니다. 모양이 아니라 behavior 계약으로 고릅니다." },
    { question: "responsive navigation에서 overflow:hidden이 위험한 이유는 무엇인가요?", answer: "zoom·긴 label·작은 viewport에서 핵심 link를 잘라 사용자가 접근하지 못하게 만들 수 있기 때문입니다." },
  ],
  completionChecklist: [
    "ol·ul을 marker 모양이 아니라 순서 의미로 선택했다.",
    "모든 직접 목록 항목을 li로 작성하고 하위 목록을 관련 li 내부에 두었다.",
    "이름-설명 관계에는 dl·dt·dd를 사용하고 2차원 비교 data와 구분했다.",
    "주요 link group을 고유한 이름의 nav로 묶고 실제 href를 제공했다.",
    "현재 page에 aria-current를 하나만 설정하고 색 외의 cue를 제공했다.",
    "link에 충분한 hit target을 주고 hover와 focus-visible을 모두 확인했다.",
    "CSS/JavaScript 비활성, 320px, 200% zoom, 긴 label에서 기능을 검사했다.",
    "source·DOM·accessibility tree·keyboard interaction 네 층의 검증 결과를 기록했다.",
  ],
  nextSessions: ["html-06-table-semantics"],
  sources: [
    { id: "web-list-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day02/ex08_list.html", usedFor: ["ol·ul·li", "upper-roman marker", "중첩 Coffee 목록"], evidence: "레시피 ordered list와 5단계 음료 nested list의 실제 source·주석을 읽고 의미 선택과 깊이 tradeoff로 확장했습니다." },
    { id: "web-dl-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day02/ex09_dl.html", usedFor: ["dl·dt·dd", "한 dt와 여러 dd", "상품 구성"], evidence: "키보드/모니터 정의와 상품 구성 association group을 확인하고 table·form label과의 경계를 보강했습니다." },
    { id: "web-menu-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day02/ex10_ul_menu.html", usedFor: ["ul navigation", "inline-block", "link padding", "hover", "overflow"], evidence: "HOME·NEWS·CONTENT·ABOUT 가로 메뉴를 audit해 nav name, current state, keyboard focus, flex wrapping의 production pattern으로 발전시켰습니다." },
    { id: "whatwg-grouping-content", repository: "WHATWG HTML Standard", path: "multipage/grouping-content.html", publicUrl: "https://html.spec.whatwg.org/multipage/grouping-content.html", usedFor: ["ol·ul·li content model", "start·reversed·value", "dl association groups"], evidence: "2026-07-11 기준 living standard의 grouping content 정의와 attributes를 구조 설명의 기준으로 사용했습니다." },
    { id: "whatwg-sections-nav", repository: "WHATWG HTML Standard", path: "multipage/sections.html#the-nav-element", publicUrl: "https://html.spec.whatwg.org/multipage/sections.html#the-nav-element", usedFor: ["nav element", "주요 link section", "landmark"], evidence: "nav element가 주요 navigation link section을 나타내는 semantic을 확인했습니다." },
    { id: "wai-page-structure", repository: "W3C Web Accessibility Initiative", path: "tutorials/page-structure/", publicUrl: "https://www.w3.org/WAI/tutorials/page-structure/", usedFor: ["landmark", "page region", "navigation structure"], evidence: "page region과 landmark가 보조기술 탐색을 돕는다는 guidance를 verification에 반영했습니다." },
    { id: "wai-menus-source", repository: "W3C Web Accessibility Initiative", path: "tutorials/menus/structure/", publicUrl: "https://www.w3.org/WAI/tutorials/menus/structure/", usedFor: ["menu structure", "list navigation", "current item", "fly-out boundary"], evidence: "site navigation의 list structure와 menu labeling 원칙을 native navigation 예제에 반영했습니다." },
  ],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "원본은 marker·nested list·description list·horizontal menu를 충실히 보여 주지만 nav landmark, aria-current, focus-visible, responsive wrap, ARIA menu 오용 경계는 공식 표준과 접근성 guidance로 보강했습니다.",
      "CSS counter, breadcrumb, disclosure navigation, virtualization은 이 세션에서 선택 기준만 소개하며 각각 CSS 고급·JavaScript component 세션에서 구현을 확장합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
