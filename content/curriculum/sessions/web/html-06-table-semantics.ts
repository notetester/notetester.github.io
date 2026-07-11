import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["html-06-table-semantics"],
  slug: "html-06-table-semantics",
  courseId: "web",
  moduleId: "01-html-document-forms",
  order: 6,
  title: "표의 행·열·머리글과 셀 병합을 데이터로 읽기",
  subtitle: "table을 칸 그리기 도구로 쓰지 않고 caption과 행·열 header가 각 data cell의 문맥을 설명하는 2차원 데이터 모델로 설계합니다.",
  level: "기초",
  estimatedMinutes: 155,
  coreQuestion: "표의 한 data cell을 화면에서 떼어 읽어도 어떤 행과 열의 값인지 알게 하려면 caption·th·scope·rowspan·colspan을 어떻게 설계하고 검증해야 할까요?",
  summary: "회원 정보, 상품 구성, 숙소 가격의 원본 세 예제를 기반으로 table·caption·thead·tbody·tfoot·tr·th·td·colgroup의 역할을 연결합니다. 단순 표에서는 scope로 header 방향을 명시하고, 병합된 복잡한 표는 가능한 한 단순화한 뒤 필요할 때 id/headers를 사용합니다. parser가 tbody를 암묵적으로 생성하는 현상, colspan/rowspan grid 오류, layout table 금지, mobile overflow와 scroll container, 정렬·빈값·단위·CSV 변환 및 접근성 tree 검증까지 실제 운영 관점으로 확장합니다.",
  objectives: [
    "2차원 행·열 관계가 핵심인 data와 단순 layout을 구분해 table 사용 여부를 결정할 수 있다.",
    "caption·thead·tbody·tfoot·tr·th·td의 책임과 DOM 처리 순서를 설명할 수 있다.",
    "column·row header에 scope를 지정해 각 data cell의 문맥을 programmatically 연결할 수 있다.",
    "rowspan·colspan이 차지하는 logical grid를 계산하고 겹침·빈칸 오류를 진단할 수 있다.",
    "복잡한 header는 단순한 여러 표로 분리할지 id/headers로 명시할지 판단할 수 있다.",
    "작은 viewport와 zoom에서도 header 관계를 보존하는 responsive table을 구현하고 검증할 수 있다.",
  ],
  prerequisites: [
    { title: "순서·비순서·설명 목록과 내비게이션 메뉴", reason: "반복 항목과 이름-설명 관계를 배웠으므로 이제 행과 열을 함께 따라 비교하는 2차원 data를 구분합니다.", sessionSlug: "html-05-lists-navigation" },
  ],
  keywords: ["table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "scope", "rowspan", "colspan", "headers", "responsive table"],
  chapters: [
    {
      id: "table-is-data-matrix",
      title: "table은 행과 열 header가 교차해 cell의 의미를 만드는 데이터 matrix입니다",
      lead: "border가 있는 직사각형처럼 보인다는 이유가 아니라, 사용자가 같은 열·같은 행 값을 비교해야 할 때 table을 선택합니다.",
      explanations: [
        "원본 회원 정보 표에서 '27'만 떼어 보면 의미를 알 수 없습니다. 같은 열 위의 '나이'와 같은 행의 '고길동'을 함께 읽어야 고길동의 나이가 27이라는 뜻이 됩니다. 이 교차 관계가 table의 핵심입니다.",
        "table element는 CSS grid를 만드는 범용 layout container가 아닙니다. header·sidebar·main을 table cell로 배치하면 reading order와 반응형 재배치가 어려워지고 보조기술이 data table로 오해할 수 있습니다. page layout은 semantic section과 CSS Grid/Flexbox가 담당합니다.",
        "이름-값 한 쌍들의 연속이라면 dl이 더 단순할 수 있고, 같은 종류 카드 나열이면 ul 또는 article group이 적합할 수 있습니다. 두 방향으로 header를 따라 비교하거나 행마다 같은 column schema가 반복되는지 질문합니다.",
        "표를 image나 screenshot으로 제공하면 확대·검색·복사·번역·screen reader navigation과 responsive reflow가 깨집니다. 실제 text와 table structure를 사용하고, chart가 필요하면 underlying data table 또는 동등한 설명을 제공합니다.",
      ],
      concepts: [
        { term: "tabular data", definition: "행과 열의 교차 위치가 각 값의 문맥을 결정하며 동일 schema로 비교할 수 있는 data입니다.", detail: ["cell 값은 관련 header와 함께 해석됩니다.", "시각 격자와 semantic table은 같지 않습니다."], analogy: "좌표 (행, 열)를 알아야 값을 찾는 spreadsheet와 같습니다." },
        { term: "layout table", definition: "data 관계가 아니라 화면 배치를 위해 table/tr/td를 사용하는 legacy technique입니다.", detail: ["현대 page layout에서는 피합니다.", "DOM reading order와 responsive design을 어렵게 합니다."], caveat: "오래된 email client처럼 CSS 제약이 큰 특수 환경은 별도 호환성 판단이 필요하지만 web page 기본 전략은 아닙니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "screen reader가 page header·sidebar를 행과 열 수가 있는 표로 announce한다.", likelyCause: "시각 layout을 table·tr·td로 구성했습니다.", checks: ["각 cell을 어떤 row/column header와 연결해야 하는지 질문합니다.", "table을 제거해도 data 의미가 유지되는지 봅니다.", "accessibility tree의 table role을 확인합니다."], fix: "header/nav/main/aside/footer semantic과 CSS Grid 또는 Flexbox로 page layout을 다시 만듭니다.", prevention: "table 사용 review에 '행·열 비교 data인가?'라는 gate를 둡니다." },
      ],
    },
    {
      id: "table-structure-and-parser",
      title: "caption과 row group은 표의 이름·구조·rendering/printing 경계를 명시합니다",
      lead: "table의 직접 child 순서와 thead·tbody·tfoot grouping을 명시하면 parser 복구에 덜 의존하고 style·script·보조기술이 같은 구조를 봅니다.",
      explanations: [
        "caption은 table의 짧은 제목이며 table의 첫 구조 요소로 둡니다. 주변 h2는 page outline 속 section 제목이고 caption은 특정 table과 programmatically 결합됩니다. 둘이 중복되면 목적에 따라 하나를 간결하게 조정하되 caption을 단순 장식으로 숨기지 않습니다.",
        "thead는 column header row group, tbody는 주요 data row group, tfoot은 합계·주석 같은 footer row group을 나타냅니다. source에서 그룹을 명시하면 CSS selector, sticky header, print 반복, DOM query가 예측 가능해집니다. tfoot을 data가 끝난 뒤 두는 현대 source 순서가 읽기 쉽습니다.",
        "tr은 row이며 그 안 cell은 th 또는 td입니다. 원본 주석의 'td가 일반적인 열'이라는 표현은 초보 단계에서 흔하지만 정확히는 하나의 data cell입니다. 열 자체는 각 row의 같은 grid position으로 형성되고 col/colgroup은 열 metadata·style group에 쓰입니다.",
        "HTML parser는 table 안에 tr만 쓴 source를 DOM에서 tbody로 감쌀 수 있습니다. 따라서 table > tr CSS selector나 table.children[0]이 tr일 것이라는 가정이 깨집니다. View Source와 Elements를 비교하고 가능한 한 tbody를 명시합니다.",
      ],
      concepts: [
        { term: "caption", definition: "특정 table의 목적과 주제를 식별하는 table 전용 제목입니다.", detail: ["screen reader의 table 탐색에서 식별에 유용합니다.", "복잡한 구조 설명은 caption과 중복되지 않는 별도 summary로 보강할 수 있습니다."] },
        { term: "row group", definition: "thead·tbody·tfoot로 묶은 관련 row들의 semantic group입니다.", detail: ["header, body, footer 역할을 분리합니다.", "table에는 여러 tbody가 올 수 있습니다."] },
        { term: "cell", definition: "table grid의 한 칸이며 header cell은 th, data cell은 td로 표현합니다.", detail: ["td 자체가 열 전체는 아닙니다.", "rowspan과 colspan으로 여러 grid slot을 점유할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "member-table-semantic-shell",
          title: "caption과 명시적 row group을 가진 회원 표",
          language: "html",
          filename: "members.html",
          purpose: "원본 회원 표를 semantic table shell과 column header association으로 개선합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>회원 현황</title>\n  <style>\n    table { border-collapse: collapse; }\n    th, td { border: 1px solid #777; padding: .5rem .75rem; text-align: start; }\n    thead { background: #eef4fa; }\n  </style>\n</head>\n<body>\n  <main>\n    <h1>회원 현황</h1>\n    <table>\n      <caption>2026년 7월 학습 모임 회원</caption>\n      <thead>\n        <tr><th scope=\"col\">이름</th><th scope=\"col\">나이</th><th scope=\"col\">지역</th></tr>\n      </thead>\n      <tbody>\n        <tr><th scope=\"row\">홍길동</th><td>17</td><td>충청도</td></tr>\n        <tr><th scope=\"row\">고길동</th><td>27</td><td>경기도</td></tr>\n        <tr><th scope=\"row\">김길동</th><td>21</td><td>함경도</td></tr>\n      </tbody>\n    </table>\n  </main>\n</body>\n</html>",
          walkthrough: [
            { lines: "6-9", explanation: "border는 CSS 표현이며 border-collapse로 인접 border를 합칩니다. logical text-align:start는 writing direction에 대응합니다." },
            { lines: "15-18", explanation: "caption이 표 자체를 식별하고 thead의 th scope=col이 각 column data를 설명합니다." },
            { lines: "20-24", explanation: "각 이름은 row 전체를 설명하므로 td가 아닌 th scope=row이고 나이·지역은 td입니다." },
          ],
          run: { environment: ["현대 browser", "DevTools Accessibility tree 또는 screen reader table navigation"], command: "browser에서 members.html을 열고 고길동의 27 cell 탐색" },
          output: { value: "표 이름: 2026년 7월 학습 모임 회원\n열 머리글: 이름 | 나이 | 지역\n행 머리글 고길동, 나이 27\n행 머리글 고길동, 지역 경기도", explanation: ["27 cell은 column header 나이와 row header 고길동의 교차 값입니다.", "CSS를 제거해도 caption과 header 관계는 남습니다.", "thead/tbody가 DOM에 명시되어 query와 style이 예측 가능합니다."] },
          experiments: [
            { change: "이름 cell을 th scope=row에서 td로 바꿉니다.", prediction: "시각 모양을 CSS로 유지할 수 있어도 나이·지역 cell의 row header association이 약해집니다.", result: "bold/배경색이 header semantic을 대신하지 않습니다." },
            { change: "tbody tag를 source에서 제거하고 DevTools를 확인합니다.", prediction: "browser parser가 tbody element를 DOM에 삽입할 수 있습니다.", result: "source와 DOM이 다를 수 있으므로 구조를 명시하고 실제 DOM을 검사합니다." },
          ],
          sourceRefs: ["web-table-basic-source", "whatwg-tables", "wai-tables"],
        },
      ],
      diagnostics: [
        { symptom: "document.querySelector('table > tr')가 null인데 화면에는 행이 보인다.", likelyCause: "parser가 tr을 암묵적 tbody 안으로 이동시켜 direct child가 아니게 되었습니다.", checks: ["DevTools Elements에서 TABLE > TBODY > TR tree를 확인합니다.", "View Source와 현재 DOM을 비교합니다.", "selector가 row group을 고려하는지 봅니다."], fix: "source에 tbody를 명시하고 'table tbody > tr' 또는 의미 있는 class/data selector를 사용합니다.", prevention: "parser insertion behavior에 의존하지 않도록 table row group을 항상 명시합니다." },
      ],
    },
    {
      id: "header-association-scope",
      title: "th와 scope는 data cell을 설명하는 header의 방향을 programmatically 선언합니다",
      lead: "가운데 정렬과 배경색은 header처럼 보이게 할 뿐이며, th·scope가 보조기술과 machine에 실제 관계를 제공합니다.",
      explanations: [
        "가장 단순한 표는 첫 row의 th가 column header입니다. scope='col'을 명시하면 방향이 분명합니다. 첫 column이 각 row를 식별하면 th scope='row'를 사용합니다. 두 방향 header가 함께 있어도 data cell은 row와 column 문맥을 모두 받을 수 있습니다.",
        "scope에는 col, row, colgroup, rowgroup이 있습니다. 병합 header가 여러 열 또는 행 group을 설명할 때 group 값을 고려합니다. 그러나 구조가 너무 복잡하면 사용자도 author도 관계를 검증하기 어렵기 때문에 작은 표 여러 개로 나누는 것이 먼저입니다.",
        "th라고 무조건 column header는 아닙니다. 원본 숙소 표에서 방 이름은 각 row를 식별할 수 있으므로 row header 후보입니다. 반대로 '3세까지 무료'처럼 tfoot 전체에 걸친 note는 colspan을 쓴 td로도 충분하며 모든 data cell header로 취급할 이유가 없습니다.",
        "빈 cell을 공백이나 dot로 채워 border만 유지하지 않습니다. 값이 없음, 적용 불가, 미집계는 서로 다른 data state입니다. visible text '없음', em dash와 legend, 또는 명확한 상태 label을 사용하고 raw data에도 null semantics를 보존합니다.",
      ],
      concepts: [
        { term: "header association", definition: "특정 td가 어떤 th의 설명을 받는지 table model이 계산하거나 author가 명시한 관계입니다.", detail: ["scope는 단순하고 규칙적인 표에서 방향을 선언합니다.", "복잡한 표는 headers/id가 필요할 수 있습니다."] },
        { term: "scope", definition: "th가 적용되는 row, column, row group 또는 column group을 지정하는 attribute입니다.", detail: ["scope=col과 scope=row가 가장 흔합니다.", "CSS style과 독립된 semantic입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "screen reader로 숫자 cell을 이동할 때 어느 상품의 어느 속성인지 반복해서 잃는다.", likelyCause: "header가 td이거나 th에 방향이 모호하고 row header가 없습니다.", checks: ["column/row header cell이 실제 th인지 봅니다.", "scope 값과 rowspan/colspan 범위를 확인합니다.", "접근성 tree 또는 screen reader table mode로 각 cell을 이동합니다."], fix: "단순 표는 th scope=col/row를 명시하고 복잡한 표는 구조를 단순화하거나 id/headers association을 제공합니다.", prevention: "각 sample data cell에 예상 header 목록을 작성해 수동·자동 검증합니다." },
      ],
    },
    {
      id: "merged-cell-grid-model",
      title: "rowspan과 colspan은 보이는 칸을 지우는 기능이 아니라 logical grid slot을 점유합니다",
      lead: "각 row가 남은 column slot을 정확히 채우도록 좌표표를 먼저 그리면 겹침·밀림·잘못된 header 범위를 예방할 수 있습니다.",
      explanations: [
        "rowspan='2'인 cell은 현재 row와 바로 다음 row의 같은 column slot을 차지합니다. 다음 row에서는 그 자리에 cell을 다시 만들지 않습니다. colspan='4'는 현재 row의 연속 네 column slot을 하나의 cell이 차지합니다. 단순히 오른쪽 cell tag를 숨기는 개념이 아닙니다.",
        "원본 상품 표의 '선물용'은 두 product row에 걸치고, 숙소 표의 4인실은 세 row, 가격은 네 row에 걸칩니다. source를 읽을 때 각 row의 시작 시 이미 이전 rowspan이 점유한 slot을 표시하고 새 cell이 들어갈 다음 빈 slot을 찾습니다.",
        "병합은 시각 중복을 줄이지만 reading order와 association을 복잡하게 합니다. 각 data row에 category를 반복하면 source data와 sorting/filtering/export가 단순해질 수 있습니다. 반복 text 비용과 table 이해 비용을 비교합니다.",
        "colspan/rowspan 값이 실제 column 수를 넘거나 두 spanning cell이 같은 slot을 덮으면 table model error가 생깁니다. browser가 그려 주더라도 DOM API의 rows/cells index와 보조기술 해석이 기대와 다를 수 있으므로 validator와 grid audit를 수행합니다.",
      ],
      concepts: [
        { term: "rowspan", definition: "cell이 현재 row부터 아래 방향으로 점유하는 row slot 수입니다.", detail: ["뒤 row는 점유된 column을 건너뜁니다.", "row group 경계와 header scope를 함께 검토합니다."] },
        { term: "colspan", definition: "cell이 현재 위치부터 오른쪽 방향으로 점유하는 column slot 수입니다.", detail: ["tfoot note나 multi-level header에 쓰입니다.", "표의 논리 column 수와 일치해야 합니다."] },
        { term: "logical grid", definition: "각 cell의 row·column 시작 좌표와 span이 차지하는 slot을 계산한 table 내부 matrix입니다.", detail: ["source의 cell 개수와 visual column 수는 다를 수 있습니다.", "병합 오류 진단의 기준입니다."] },
      ],
      codeExamples: [
        {
          id: "product-table-rowspan",
          title: "row header group과 상품 비교 표",
          language: "html",
          filename: "products.html",
          purpose: "rowspan이 차지하는 grid를 계산하고 용도·중량 row header와 column header를 연결합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>상품 구성</title></head>\n<body>\n  <table>\n    <caption>2026년 7월 감귤 상품 구성</caption>\n    <thead>\n      <tr>\n        <th scope=\"col\">용도</th><th scope=\"col\">중량</th>\n        <th scope=\"col\">개수</th><th scope=\"col\">가격</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <th scope=\"rowgroup\" rowspan=\"2\">선물용</th>\n        <th scope=\"row\">3 kg</th><td>11–16과</td><td>35,000원</td>\n      </tr>\n      <tr><th scope=\"row\">5 kg</th><td>18–26과</td><td>52,000원</td></tr>\n      <tr>\n        <th scope=\"rowgroup\" rowspan=\"2\">가정용</th>\n        <th scope=\"row\">3 kg</th><td>11–16과</td><td>30,000원</td>\n      </tr>\n      <tr><th scope=\"row\">5 kg</th><td>18–26과</td><td>47,000원</td></tr>\n    </tbody>\n  </table>\n</body>\n</html>",
          walkthrough: [
            { lines: "5-11", explanation: "caption과 네 column header가 4-column logical grid를 정의합니다." },
            { lines: "14-18", explanation: "선물용 cell은 첫 column의 두 row slot을 점유합니다. 다음 tr은 이미 점유된 slot을 건너뛰고 중량 th부터 시작합니다." },
            { lines: "19-23", explanation: "가정용도 같은 pattern이며 중량은 각 구체 상품 row를 식별하는 row header입니다." },
          ],
          run: { environment: ["현대 browser", "HTML validator", "screen reader table navigation"], command: "browser에서 products.html을 열고 52,000원 cell의 headers 확인" },
          output: { value: "표: 2026년 7월 감귤 상품 구성\n52,000원 cell 문맥:\n용도=선물용\n중량=5 kg\n열=가격\nlogical grid: 모든 data row가 4개 column slot을 채움", explanation: ["rowspan cell 선물용은 두 행을 설명합니다.", "5 kg은 해당 row header이고 가격은 column header입니다.", "시각적으로 반복을 줄였지만 association test가 반드시 필요합니다."] },
          experiments: [
            { change: "두 번째 row 맨 앞에 빈 td를 추가합니다.", prediction: "rowspan이 이미 첫 slot을 차지해 새 cell이 뒤 column들을 밀고 5-column처럼 깨집니다.", result: "spanned slot에는 placeholder cell을 넣지 않습니다." },
            { change: "rowspan을 제거하고 각 row에 선물용/가정용 th를 반복합니다.", prediction: "source가 길어지지만 sorting·mobile transformation·header association이 단순해집니다.", result: "복잡성 감소가 반복 text보다 가치 있는 경우 병합을 피합니다." },
          ],
          sourceRefs: ["web-table-span-source", "whatwg-tables", "wai-two-headers"],
        },
      ],
      diagnostics: [
        { symptom: "두 번째 row부터 cell이 한 column씩 밀리거나 마지막 값이 표 밖에 나타난다.", likelyCause: "이전 row의 rowspan 점유 slot을 계산하지 않고 placeholder td를 추가했습니다.", checks: ["전체 column 수를 정합니다.", "row별 점유 grid를 종이에 표시합니다.", "validator의 table model error와 각 tr.cells.length를 확인합니다."], fix: "rowspan이 차지한 slot의 cell을 후속 row에서 제거하고 모든 span 합계가 grid 범위 안에 들게 조정합니다.", prevention: "병합 표는 좌표 matrix와 대표 cell header 기대값을 code review에 첨부합니다." },
      ],
    },
    {
      id: "complex-headers-and-simplification",
      title: "복잡한 표는 먼저 분리·반복으로 단순화하고 마지막 수단으로 id와 headers를 명시합니다",
      lead: "multi-level 또는 irregular header가 필요한지 검토하고, 한 cell과 관련된 모든 th를 안정적인 ID 목록으로 연결할 수 있습니다.",
      explanations: [
        "scope로 명확한 규칙을 표현할 수 없는 irregular table에서는 각 th에 고유 id를 주고 td의 headers attribute에 관련 id들을 space로 나열할 수 있습니다. 이 방식은 정확하지만 authoring 비용과 회귀 위험이 큽니다. row 추가·column 변경 때 모든 참조를 갱신해야 합니다.",
        "복잡성의 첫 해법은 markup을 더하는 것이 아니라 data presentation을 나누는 것입니다. 선물용과 가정용 표를 분리하거나 반복 category column을 사용하고, 상세 비교를 filter 가능한 단순 표로 제공합니다. W3C guidance도 복잡한 표보다 간단한 여러 표가 이해하기 쉬울 수 있음을 강조합니다.",
        "colgroup과 col은 column을 grouping해 style 범위를 지정할 수 있지만 cell content를 감싸는 DOM container가 아닙니다. col에 text나 click handler를 두지 못하며, row/column header association을 자동으로 대신하지 않습니다.",
        "sortable table을 만들면 button은 th 안에 둘 수 있고 현재 sort direction을 aria-sort로 알립니다. 단순히 header click event만 걸면 keyboard와 state announce가 빠집니다. sorting 뒤 DOM row order와 screen order를 함께 갱신합니다.",
      ],
      concepts: [
        { term: "headers attribute", definition: "data/header cell이 관련된 th들의 id token을 명시하는 attribute입니다.", detail: ["같은 table 안의 고유 th id를 참조합니다.", "irregular/multi-level 표에서 사용합니다."], caveat: "관계 유지 비용이 크므로 단순화와 scope를 먼저 검토합니다." },
        { term: "colgroup", definition: "하나 이상의 logical column을 grouping해 제한된 presentation과 span metadata를 적용하는 element입니다.", detail: ["cell content wrapper가 아닙니다.", "header relationship 자체를 완성하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "column을 하나 추가한 뒤 screen reader가 기존 data cell에 엉뚱한 header를 읽는다.", likelyCause: "복잡한 id/headers 참조가 schema 변경과 함께 갱신되지 않았습니다.", checks: ["모든 headers token이 같은 table의 존재하는 th id인지 확인합니다.", "ID 중복을 검사합니다.", "대표 cell별 예상 header와 실제 announce를 비교합니다."], fix: "참조를 수정하고 가능하면 표를 분리하거나 단순 scope 구조로 재설계합니다.", prevention: "table schema에서 headers 참조를 생성하고 broken ID/association test를 CI에 둡니다." },
      ],
      comparisons: [
        { title: "header 관계 표현 전략", options: [
          { name: "scope", chooseWhen: "규칙적인 row/column 또는 group header가 있을 때", avoidWhen: "header 관계가 불규칙해 방향만으로 표현되지 않을 때", tradeoffs: ["읽고 유지하기 쉽습니다.", "매우 복잡한 교차 관계에는 부족할 수 있습니다."] },
          { name: "id/headers", chooseWhen: "단순화해도 irregular header가 꼭 필요할 때", avoidWhen: "표를 나누거나 반복 column으로 더 쉽게 표현할 수 있을 때", tradeoffs: ["관계를 명시적으로 열거합니다.", "schema 변경 시 참조 회귀 위험이 큽니다."] },
          { name: "여러 단순 표", chooseWhen: "주제·category별로 독립 비교가 가능할 때", avoidWhen: "한 화면에서 전체 교차 비교가 핵심일 때", tradeoffs: ["이해·mobile·유지보수가 쉬워집니다.", "전체 scan과 중복 label 비용이 늘 수 있습니다."] },
        ] },
      ],
    },
    {
      id: "responsive-table-presentation",
      title: "반응형 표는 구조를 버리지 않고 scroll·reflow·분할 중 데이터 목적에 맞는 전략을 선택합니다",
      lead: "작은 화면에서 column을 무조건 숨기거나 td를 block으로 바꾸면 header association이 사라질 수 있으므로 원본 table semantic과 정보 손실을 검증합니다.",
      explanations: [
        "column이 적은 표는 font·padding을 조정해 자연스럽게 맞출 수 있습니다. 넓은 비교 표는 focus 가능한 scroll region을 제공하거나 주변 설명으로 horizontal scroll을 알립니다. page 전체가 가로로 넘치지 않고 table container 안에서만 scroll되는지 확인합니다.",
        "각 row를 card처럼 쌓는 reflow pattern은 mobile 읽기에는 편하지만 각 value 앞 label을 중복 표시해야 합니다. CSS generated content에만 header text를 넣으면 translation·copy·accessibility 차이가 생길 수 있습니다. DOM의 th/headers association을 유지하고 실제 보조기술 조합에서 test합니다.",
        "중요 column을 숨기면 표가 주장하는 비교 의미가 바뀔 수 있습니다. 사용자에게 column chooser를 제공하거나 summary와 상세 view를 분리합니다. 숨긴 값이 download/export에는 포함되는지와 privacy도 명시합니다.",
        "숫자는 단위를 header 또는 각 value에 명확히 두고 decimal alignment를 고려합니다. CSS text-align:end가 locale 방향을 존중하며, 정렬용 공백을 data에 넣지 않습니다. currency·date는 사용자에게 읽히는 형식과 machine sort key를 분리할 수 있습니다.",
      ],
      concepts: [
        { term: "scroll container", definition: "넓은 table만 독립적으로 가로 scroll하게 하는 overflow wrapper입니다.", detail: ["page 전체 horizontal overflow를 막습니다.", "keyboard와 focus 사용자도 영역을 발견하고 조작할 수 있어야 합니다."] },
        { term: "reflow", definition: "viewport 또는 zoom 변화에 맞춰 content가 손실 없이 새 layout으로 배치되는 behavior입니다.", detail: ["header 관계와 reading order를 보존해야 합니다.", "정보를 단순히 clip하는 것과 다릅니다."] },
      ],
      codeExamples: [
        {
          id: "responsive-scroll-table",
          title: "caption과 header를 유지하는 국소 가로 scroll 표",
          language: "html",
          filename: "responsive-table.html",
          purpose: "넓은 표가 page 전체를 밀지 않게 하면서 semantic table과 모든 column을 보존합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>반응형 표</title>\n  <style>\n    .table-scroll { max-inline-size: 100%; overflow-x: auto; border: 1px solid #999; }\n    table { border-collapse: collapse; min-inline-size: 44rem; }\n    th, td { padding: .6rem; border: 1px solid #aaa; }\n    th { text-align: start; }\n    td.number { text-align: end; font-variant-numeric: tabular-nums; }\n  </style>\n</head>\n<body>\n  <main>\n    <h1>월별 학습 기록</h1>\n    <p id=\"scroll-help\">좁은 화면에서는 표를 좌우로 이동해 모든 열을 확인하세요.</p>\n    <div class=\"table-scroll\" role=\"region\" aria-labelledby=\"study-caption\" aria-describedby=\"scroll-help\" tabindex=\"0\">\n      <table>\n        <caption id=\"study-caption\">2026년 상반기 과정별 학습 시간</caption>\n        <thead><tr><th scope=\"col\">과정</th><th scope=\"col\">1월</th><th scope=\"col\">2월</th><th scope=\"col\">3월</th><th scope=\"col\">합계</th></tr></thead>\n        <tbody>\n          <tr><th scope=\"row\">HTML</th><td class=\"number\">12시간</td><td class=\"number\">16시간</td><td class=\"number\">20시간</td><td class=\"number\">48시간</td></tr>\n          <tr><th scope=\"row\">Python</th><td class=\"number\">18시간</td><td class=\"number\">22시간</td><td class=\"number\">25시간</td><td class=\"number\">65시간</td></tr>\n        </tbody>\n      </table>\n    </div>\n  </main>\n</body>\n</html>",
          walkthrough: [
            { lines: "8-12", explanation: "wrapper만 overflow하고 table에 최소 너비를 주어 column을 억지로 압축하지 않습니다. 숫자는 끝 정렬합니다." },
            { lines: "18-20", explanation: "visible instruction과 이름/설명이 있는 focusable region이 keyboard 사용자에게 scroll context를 제공합니다." },
            { lines: "21-27", explanation: "table 자체의 caption·column/row header semantic은 그대로 유지하고 모든 data column을 제공합니다." },
          ],
          run: { environment: ["현대 browser", "320px responsive viewport", "keyboard"], command: "browser에서 responsive-table.html을 열고 Tab 후 Shift+mouse wheel 또는 arrow/trackpad로 표 이동" },
          output: { value: "페이지 제목: 월별 학습 기록\nscroll 영역 이름: 2026년 상반기 과정별 학습 시간\n설명: 좁은 화면에서는 표를 좌우로 이동해 모든 열을 확인하세요.\n320px: page body는 가로 overflow 없음, 표 영역 안에서 과정·1월·2월·3월·합계 전체 확인 가능", explanation: ["table semantic은 scroll wrapper 때문에 사라지지 않습니다.", "tabindex는 overflow region을 keyboard focus 대상으로 만듭니다.", "실제 browser와 보조기술에서 중복 region announce 여부를 검토해 필요한 속성만 유지합니다."] },
          experiments: [
            { change: "overflow-x:auto를 table 자체가 아닌 body에 적용합니다.", prediction: "page header와 본문 전체가 가로로 흔들려 탐색이 불편해집니다.", result: "overflow는 넓은 component 경계 안에 제한합니다." },
            { change: "합계 column을 display:none으로 숨깁니다.", prediction: "mobile에서는 핵심 비교 결과를 잃고 표의 목적이 달라집니다.", result: "column 제거는 layout 결정이 아니라 content 우선순위 결정입니다." },
          ],
          sourceRefs: ["web-table-basic-source", "wai-table-tips"],
        },
      ],
      diagnostics: [
        { symptom: "mobile에서 표 때문에 page 전체가 좌우로 움직이고 heading도 화면 밖으로 밀린다.", likelyCause: "table의 intrinsic width가 body overflow를 만들고 국소 scroll wrapper가 없습니다.", checks: ["document.documentElement.scrollWidth와 clientWidth를 비교합니다.", "table wrapper 경계를 확인합니다.", "200% zoom에서도 focus target이 보이는지 검사합니다."], fix: "table을 max-inline-size:100%와 overflow-x:auto인 명확한 wrapper에 두고 scroll 안내와 keyboard 접근을 제공합니다.", prevention: "모든 wide data component에 320px·zoom·long-value overflow test를 추가합니다." },
      ],
    },
    {
      id: "table-quality-verification",
      title: "표 품질은 문법·grid·header association·데이터 정확성·responsive interaction을 함께 검사합니다",
      lead: "border가 반듯하다는 사실은 table model과 data가 정확하다는 증거가 아니므로 대표 cell을 중심으로 검증 기록을 남깁니다.",
      explanations: [
        "HTML validator로 잘못된 child 순서와 span을 확인하고 DevTools DOM에서 암묵적 tbody와 실제 cell 위치를 봅니다. accessibility tree 또는 screen reader table mode에서는 caption, row/column count, header announce를 확인합니다.",
        "대표 data cell 세 개를 골라 각 cell의 기대 header 목록을 적습니다. 예를 들어 52,000원은 선물용·5 kg·가격과 연결되어야 합니다. 시각적으로 위와 왼쪽만 보지 말고 programmatic association 결과를 확인합니다.",
        "표 값은 원본 data와 대조하고 합계·단위·날짜·currency locale을 검증합니다. 빈 string, 0, 없음, 미집계는 다른 상태입니다. 사용자에게 보여 주는 formatted string과 sorting/export의 raw value가 일관되는지도 test합니다.",
        "caption은 같은 page의 다른 표와 구분되어야 하고, 복잡한 표 summary는 구조를 설명하되 caption을 반복하지 않습니다. 200% zoom, 320 CSS px, keyboard, high contrast, print, CSS 실패에서 정보 손실을 확인합니다.",
      ],
      concepts: [
        { term: "representative cell test", definition: "단순·병합·경계 위치의 data cell을 골라 예상되는 모든 header와 실제 association을 비교하는 검사입니다.", detail: ["표 전체를 무작정 듣는 것보다 회귀를 구체화합니다.", "span이나 schema 변경 때 다시 실행합니다."] },
        { term: "data integrity", definition: "표시·정렬·합계·export 전 과정에서 값과 단위, null 의미가 원본 계약과 일치하는 성질입니다.", detail: ["semantic HTML만 맞아도 잘못된 숫자는 좋은 표가 아닙니다.", "formatting과 raw data를 구분합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "표는 접근 가능하지만 가격 정렬이 100,000원보다 9,000원을 큰 값으로 배치한다.", likelyCause: "formatted currency text를 문자열로 정렬했습니다.", checks: ["DOM/data model의 raw numeric value를 확인합니다.", "locale separator와 currency symbol 제거 방식이 안전한지 봅니다.", "negative/null 값 test를 실행합니다."], fix: "숫자 raw field로 정렬하고 표시 단계에서 Intl.NumberFormat 등 locale formatting을 적용합니다.", prevention: "표 schema에 type·unit·null policy와 sort comparator test를 정의합니다." },
        { symptom: "caption과 주변 heading이 모두 '표' 또는 '정보'라 여러 표를 구분할 수 없다.", likelyCause: "table 목적을 드러내지 않는 generic label을 사용했습니다.", checks: ["caption만 모아 읽어 서로 구분되는지 봅니다.", "기간·대상·단위가 필요한지 확인합니다.", "caption과 summary가 중복되는지 검토합니다."], fix: "'2026년 7월 감귤 상품 구성'처럼 대상과 범위를 간결하게 포함합니다.", prevention: "한 page의 table name uniqueness를 content review 항목으로 둡니다." },
      ],
      expertNotes: [
        "대규모 virtualized grid는 native table만으로 해결되지 않을 수 있지만, ARIA grid를 적용하면 arrow-key focus management·selection·editing 등 application widget 계약을 구현해야 합니다. 읽기 전용 data table에 무심코 grid role을 추가하지 않습니다.",
        "server-side pagination은 현재 page의 caption·row count와 전체 result count를 구분해 알리고, sort/filter state를 URL에 반영하면 linkability와 history가 좋아집니다.",
      ],
    },
  ],
  lab: {
    title: "병합된 숙소 가격표를 감사하고 단순·접근 가능·반응형 data table로 재구성하기",
    scenario: "숙소 표는 rowspan으로 반복을 줄였지만 row header 관계가 약하고 mobile에서 잘립니다. 예약자가 방·대상·크기·가격을 확실히 비교하도록 source data부터 표 구조와 검증 기준을 다시 만듭니다.",
    setup: ["방이름, 대상, 정원, 1인 가격, 비고를 CSV 또는 plain data matrix로 먼저 적습니다.", "320px responsive viewport와 HTML validator, accessibility tree를 준비합니다.", "원본 세 table file은 read-only evidence로 두고 새 lodging-table.html을 만듭니다."],
    steps: [
      "사용자가 행과 열을 교차 비교해야 하는지 확인하고 table 선택 근거를 적습니다.",
      "짧고 고유한 caption과 thead/tbody/tfoot row group을 명시합니다.",
      "모든 column header에 scope=col, 방 이름 row header에 scope=row를 지정합니다.",
      "rowspan을 제거한 단순 반복 version과 유지한 version의 logical grid·header association을 비교합니다.",
      "무료 정책은 dot placeholder가 아니라 tfoot의 명확한 문장과 colspan으로 제공합니다.",
      "국소 scroll wrapper를 적용하고 320px·200% zoom에서 page 전체 overflow가 없는지 검사합니다.",
      "대표 가격 cell 세 개의 예상 row/column header를 적고 실제 접근성 output과 대조합니다.",
      "data 원본과 모든 가격·정원·단위를 대조하고 CSS 비활성·print 결과를 기록합니다.",
    ],
    expectedResult: ["caption으로 같은 page의 다른 표와 구분됩니다.", "각 가격 cell에서 방 이름과 가격 column header를 잃지 않습니다.", "모든 row가 동일 logical column 수를 가지며 span overlap이 없습니다.", "작은 화면에서 표 내부만 scroll하고 모든 data가 남습니다.", "원본 data와 화면·export 값의 단위와 null 의미가 일치합니다."],
    cleanup: ["실험용 중복 table과 debug border를 제거하되 비교 결과는 lab note에 남깁니다.", "실제 고객·개인 정보가 있다면 공개 예제용 synthetic data로 교체합니다."],
    extensions: ["가격 column sort button과 aria-sort를 구현하고 keyboard로 검증합니다.", "CSV download와 화면 표의 row/column schema가 같은지 automated test를 작성합니다.", "복잡한 multi-level header version을 만든 뒤 단순 표 두 개로 분리한 version과 사용자 task 시간을 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "회원 이름·나이·지역 3열 표를 semantic structure로 작성하세요.", requirements: ["caption, thead, tbody를 명시합니다.", "column header는 th scope=col입니다.", "회원 이름은 th scope=row입니다.", "border와 spacing은 CSS로만 표현합니다."], hints: ["27이라는 값의 왼쪽과 위 header를 생각합니다.", "td는 열 전체가 아니라 data cell입니다."], expectedOutcome: "대표 나이 cell을 이동할 때 회원 이름과 나이 header가 함께 확인됩니다.", solutionOutline: ["4×3 data matrix를 먼저 그립니다.", "caption→thead→tbody source 순서로 작성합니다."] },
    { difficulty: "응용", prompt: "상품 구성 rowspan 표의 logical grid와 header association을 검증하세요.", requirements: ["모든 cell의 시작 row/column과 span을 표로 기록합니다.", "용도는 rowgroup, 중량은 row, 나머지는 column header와 연결합니다.", "placeholder td 없이 각 row가 4 slot을 채웁니다.", "대표 가격 2개의 expected headers를 기록합니다.", "단순 반복 version과 유지보수성을 비교합니다."], hints: ["후속 row 시작 전에 이전 rowspan 점유 slot을 표시합니다.", "병합을 없애는 것도 정답 후보입니다."], expectedOutcome: "validator table model error가 없고 대표 가격 cell이 올바른 용도·중량·가격 문맥을 가집니다.", solutionOutline: ["grid 좌표표를 먼저 완성합니다.", "scope만으로 모호하면 구조를 단순화합니다."] },
    { difficulty: "설계", prompt: "정렬·filter·pagination·CSV export가 있는 학습 통계 표의 production 계약을 설계하세요.", requirements: ["native table과 ARIA grid 선택 기준을 설명합니다.", "caption·header·sort state·empty/null/unit schema를 정의합니다.", "mobile scroll/reflow와 keyboard path를 설계합니다.", "raw value와 formatted value, export consistency test를 포함합니다.", "representative cell association과 privacy 검사를 자동화합니다."], hints: ["읽기용 표에 application grid behavior가 정말 필요한지 반증합니다.", "URL에 sort/filter/page state를 보존할지 결정합니다."], expectedOutcome: "semantic·interaction·data integrity·responsive·test 기준이 구현 가능한 component specification으로 완성됩니다.", solutionOutline: ["user task와 data schema부터 정의합니다.", "단순 HTML baseline 후 enhancement 단계를 나눕니다.", "대표 row/cell fixture로 automated assertions를 만듭니다."] },
  ],
  reviewQuestions: [
    { question: "border가 있는 2열 layout은 table을 써야 하나요?", answer: "행·열 교차 data 관계가 없다면 아닙니다. semantic section과 CSS Grid/Flexbox를 사용합니다." },
    { question: "td는 열을 뜻하나요?", answer: "td는 한 data cell입니다. 열은 여러 row에서 같은 grid position에 놓인 cell들의 관계로 형성됩니다." },
    { question: "caption과 h2는 같은가요?", answer: "둘 다 제목처럼 보일 수 있지만 caption은 특정 table과 결합되고 h2는 page section outline을 만듭니다." },
    { question: "tbody를 생략했는데 DOM에 생기는 이유는 무엇인가요?", answer: "HTML parser가 table row를 처리하며 암묵적 tbody를 생성할 수 있기 때문입니다. View Source와 DOM은 다를 수 있습니다." },
    { question: "th에 배경색만 주면 header가 되나요?", answer: "아닙니다. 실제 th와 scope 또는 headers association이 필요하며 CSS는 표현만 담당합니다." },
    { question: "rowspan 다음 row에 빈 td를 넣어 자리를 맞춰야 하나요?", answer: "아닙니다. rowspan cell이 이미 그 slot을 점유하므로 후속 row는 다음 빈 slot부터 cell을 둡니다." },
    { question: "복잡한 표에서 항상 id/headers를 쓰면 되나요?", answer: "먼저 여러 단순 표나 반복 column으로 구조를 단순화합니다. 불규칙 관계가 꼭 남을 때 id/headers를 사용하고 참조 회귀를 test합니다." },
    { question: "mobile에서는 덜 중요한 column을 숨기면 되나요?", answer: "정보 손실이 표 목적을 바꾸는지 먼저 판단합니다. scroll, reflow, summary/detail 분리, column chooser 등 대안을 검토합니다." },
  ],
  completionChecklist: [
    "행·열 교차 비교가 필요한 data에만 table을 사용했다.",
    "짧고 고유한 caption과 명시적 thead·tbody·필요한 tfoot을 작성했다.",
    "column·row header를 th와 적절한 scope로 선언했다.",
    "모든 rowspan·colspan의 logical grid를 계산하고 overlap·빈 slot을 검사했다.",
    "복잡한 header를 단순화할 수 있는지 먼저 검토했다.",
    "대표 data cell마다 기대 header와 실제 association을 비교했다.",
    "320px·200% zoom·keyboard·CSS 비활성에서 정보 손실과 page overflow를 검사했다.",
    "표시 값·정렬 값·합계·단위·null·export의 data integrity를 검증했다.",
  ],
  nextSessions: ["html-07-form-http-request"],
  sources: [
    { id: "web-table-basic-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day02/ex11_table.html", usedFor: ["table·tr·th·td", "caption", "thead·tbody·tfoot", "border-collapse", "암묵적 tbody"], evidence: "회원 정보 표 세 version과 상세 주석을 감사해 cell/header 용어와 parser DOM 차이를 현재 기준으로 교정·확장했습니다." },
    { id: "web-table-span-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day02/ex12_table.html", usedFor: ["상품 구성", "숙소 표", "rowspan", "colspan", "tfoot note"], evidence: "선물용·가정용 및 숙소의 병합 cell을 logical grid로 다시 계산하고 header association 예제로 사용했습니다." },
    { id: "web-table-colgroup-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day02/ex13_table.html", usedFor: ["colgroup·col", "column style", "rowspan 숙소 표"], evidence: "colgroup style 예제와 병합 숙소 표를 읽고 column grouping과 semantic header의 경계를 설명했습니다." },
    { id: "whatwg-tables", repository: "WHATWG HTML Standard", path: "multipage/tables.html", publicUrl: "https://html.spec.whatwg.org/multipage/tables.html", usedFor: ["table content model", "caption order", "row group", "cell grid", "scope·headers·span attributes"], evidence: "2026-07-11 기준 living standard의 table model과 element/attribute 정의를 구조·parser 설명의 기준으로 확인했습니다." },
    { id: "wai-tables", repository: "W3C Web Accessibility Initiative", path: "tutorials/tables/", publicUrl: "https://www.w3.org/WAI/tutorials/tables/", usedFor: ["data table boundary", "header association", "caption", "simple/complex table"], evidence: "W3C WAI Tables Tutorial의 programmatic header 관계와 layout table 경계를 접근성 검증에 반영했습니다." },
    { id: "wai-two-headers", repository: "W3C Web Accessibility Initiative", path: "tutorials/tables/two-headers/", publicUrl: "https://www.w3.org/WAI/tutorials/tables/two-headers/", usedFor: ["scope=col", "scope=row", "row/column header"], evidence: "두 방향 header가 있는 표의 scope 사용 guidance를 회원·상품 표에 적용했습니다." },
    { id: "wai-caption-summary", repository: "W3C Web Accessibility Initiative", path: "tutorials/tables/caption-summary/", publicUrl: "https://www.w3.org/WAI/tutorials/tables/caption-summary/", usedFor: ["caption", "complex table summary", "table identification"], evidence: "caption이 table을 식별하고 복잡한 구조 summary가 별도 역할을 가진다는 guidance를 반영했습니다." },
    { id: "wai-table-tips", repository: "W3C Web Accessibility Initiative", path: "tutorials/tables/tips/", publicUrl: "https://www.w3.org/WAI/tutorials/tables/tips/", usedFor: ["복잡한 표 단순화", "responsive preservation", "table separation"], evidence: "복잡한 표 분리와 responsive format에서도 structural relationship을 보존하라는 guidance를 설계 기준으로 사용했습니다." },
  ],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "원본의 세 table file은 기본 구조·span·colgroup을 폭넓게 포함합니다. scope, headers/id, responsive scroll, sort state, data integrity는 WHATWG와 W3C WAI guidance로 전문가 수준까지 보강했습니다.",
      "실제 interactive sort/filter/pagination 구현은 JavaScript DOM/상태 세션에서, database pagination과 raw schema는 backend/database 과정에서 다시 연결합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
