import type { Lesson } from "./types";

export const foundationLessons: Lesson[] = [
  {
    slug: "html-document-flow",
    track: "web",
    order: 1,
    title: "HTML 문서가 화면이 되기까지",
    eyebrow: "웹의 언어 01",
    summary:
      "HTML을 단순한 태그 암기가 아니라, 브라우저가 읽어 트리 구조의 문서로 만드는 언어로 이해합니다. 기본 문서 구조부터 의미 있는 태그, 링크·표·폼까지 한 흐름으로 연결합니다.",
    level: "입문",
    duration: "35분",
    why:
      "CSS는 HTML 요소를 골라 꾸미고 JavaScript는 그 요소를 찾아 바꿉니다. 따라서 HTML의 구조와 의미를 정확히 잡아 두면 이후의 스타일, 이벤트, 서버 요청까지 훨씬 쉽게 이해할 수 있습니다.",
    prerequisites: [],
    keywords: [
      "HTML",
      "요소",
      "태그",
      "속성",
      "시맨틱",
      "DOM 트리",
      "폼",
      "접근성",
    ],
    sections: [
      {
        id: "browser-flow",
        title: "브라우저는 HTML을 어떻게 읽을까",
        paragraphs: [
          "HTML(HyperText Markup Language)은 문서의 내용과 구조를 표시하는 마크업 언어입니다. 마크업이란 제목, 문단, 링크처럼 각 내용의 역할을 표식으로 알려 주는 일입니다. 브라우저는 위에서 아래로 HTML을 파싱합니다. 파싱은 문자열을 규칙에 따라 해석하는 과정입니다.",
          "브라우저는 해석한 요소를 부모·자식 관계의 DOM(Document Object Model) 트리로 만듭니다. DOM은 문서를 JavaScript가 다룰 수 있는 객체 구조로 표현한 것입니다. CSS는 이 트리의 요소를 선택해 꾸미고, JavaScript는 요소의 글자·속성·위치를 바꿉니다.",
        ],
        bullets: [
          "요소(element): 시작 태그, 내용, 종료 태그를 합친 한 단위입니다. 예: <p>안녕</p>.",
          "빈 요소(void element): 내용과 종료 태그가 없는 요소입니다. 예: <img>, <br>, <meta>.",
          "속성(attribute): 시작 태그에 덧붙이는 설정입니다. 예: <html lang=\"ko\">의 lang.",
          "중첩(nesting): 요소 안에 다른 요소를 넣어 부모·자식 관계를 만드는 것입니다.",
        ],
        tip:
          "개발자 도구의 Elements 패널은 원본 문자열이 아니라 브라우저가 보정해서 만든 실제 DOM을 보여 줍니다.",
      },
      {
        id: "document-skeleton",
        title: "모든 페이지의 출발점: 기본 문서 구조",
        paragraphs: [
          "DOCTYPE은 브라우저에게 이 문서를 현대 HTML 표준으로 해석하라고 알립니다. html은 전체 문서의 뿌리, head는 화면 밖의 문서 정보, body는 실제 화면에 표시할 내용을 담습니다.",
          "UTF-8은 한글을 포함한 문자를 바이트로 표현하는 인코딩 방식입니다. viewport 메타 정보는 모바일 화면 너비를 기준으로 레이아웃을 계산하게 합니다. lang=\"ko\"는 화면 낭독기와 검색 엔진에 주 언어가 한국어임을 알려 줍니다.",
        ],
        code: {
          language: "html",
          label: "그대로 저장해 열 수 있는 최소 문서",
          code: `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>오늘의 복습</title>
  </head>
  <body>
    <h1>HTML 복습 노트</h1>
    <p>구조가 먼저이고, 모양과 동작은 그다음입니다.</p>
  </body>
</html>`,
          explanation: [
            "h1은 이 페이지를 대표하는 최상위 제목입니다.",
            "p는 하나의 문단입니다. 소스의 연속된 공백과 줄바꿈은 보통 한 칸으로 합쳐집니다.",
          ],
        },
        result: {
          label: "브라우저에서 보이는 결과",
          output: `HTML 복습 노트
구조가 먼저이고, 모양과 동작은 그다음입니다.`,
          explanation:
            "title은 본문이 아니라 브라우저 탭 제목에 표시됩니다. head의 meta도 화면에는 보이지 않지만 문서를 올바르게 해석하는 데 필요합니다.",
        },
      },
      {
        id: "meaningful-structure",
        title: "div보다 먼저 역할을 생각하기",
        paragraphs: [
          "div와 span은 특별한 의미 없이 영역을 묶습니다. div는 기본적으로 새 줄을 차지하는 블록 요소이고 span은 글 흐름 안에 놓이는 인라인 요소입니다. 둘 다 유용하지만, 역할이 분명하다면 header, nav, main, article, section, footer 같은 시맨틱 요소를 먼저 사용합니다.",
          "시맨틱은 ‘의미가 드러난다’는 뜻입니다. 사람, 검색 엔진, 화면 낭독기가 문서의 구획을 이해하기 쉬워집니다. 모양 때문에 h1을 고르는 것이 아니라 제목이기 때문에 h1을 고르는 식으로 생각해야 합니다.",
        ],
        code: {
          language: "html",
          label: "읽는 순서가 드러나는 학습 카드",
          code: `<main>
  <article>
    <header>
      <h1>DOM 기초</h1>
      <p><time datetime="2026-07-10">2026년 7월 10일</time> 복습</p>
    </header>
    <section aria-labelledby="goal">
      <h2 id="goal">오늘의 목표</h2>
      <p>요소를 선택하고 글자를 바꿀 수 있다.</p>
    </section>
  </article>
</main>`,
          explanation: [
            "article은 따로 떼어 배포해도 이해되는 한 덩어리의 콘텐츠입니다.",
            "aria-labelledby는 section의 이름을 goal 제목과 연결합니다. aria는 보조 기술에 의미를 보충하는 접근성 속성입니다.",
          ],
        },
        tip:
          "제목 단계는 h1 다음 h2, h2 다음 h3처럼 문서 계층을 따라가세요. 글자 크기는 CSS로 바꿉니다.",
      },
      {
        id: "links-tables-forms",
        title: "링크·표·폼은 목적에 맞게",
        paragraphs: [
          "a는 다른 위치로 이동시키는 링크이고 button은 현재 화면에서 동작을 실행하는 버튼입니다. 표는 행과 열의 관계가 있는 데이터에만 사용합니다. 화면 배치를 위해 table을 쓰면 읽는 순서와 반응형 레이아웃이 망가집니다.",
          "form은 사용자의 입력을 묶어 서버로 보냅니다. action은 받을 주소, method는 HTTP 요청 방식입니다. GET은 조회 조건처럼 주소에 드러나도 되는 값에, POST는 생성·변경이나 큰 본문에 사용합니다. POST라고 해서 자동으로 암호화되는 것은 아니므로 실제 서비스는 HTTPS도 필요합니다.",
        ],
        code: {
          language: "html",
          label: "이름이 연결된 검색 폼",
          code: `<form action="/lessons" method="get">
  <label for="keyword">찾을 개념</label>
  <input
    id="keyword"
    name="keyword"
    type="search"
    required
    autocomplete="off"
  />
  <button type="submit">검색</button>
</form>`,
          explanation: [
            "label의 for와 input의 id가 같아서 글자를 눌러도 입력창에 초점이 갑니다.",
            "name은 서버에 전달될 키입니다. DOM에서 찾는 id와 목적이 다릅니다.",
            "keyword에 DOM을 입력해 전송하면 주소는 /lessons?keyword=DOM 형태가 됩니다.",
          ],
        },
        result: {
          label: "DOM을 입력하고 검색했을 때",
          output: `GET /lessons?keyword=DOM`,
          explanation:
            "브라우저는 name=value 쌍을 URL 쿼리 문자열로 인코딩합니다. 서버는 keyword라는 이름으로 DOM 값을 읽습니다.",
        },
      },
      {
        id: "html-pitfalls",
        title: "자주 생기는 실수와 빠른 점검법",
        paragraphs: [
          "브라우저는 닫는 태그가 빠져도 어느 정도 보정하므로 ‘화면이 나온다’가 ‘문서가 올바르다’는 뜻은 아닙니다. 들여쓰기를 일정하게 하고 개발자 도구에서 예상한 부모·자식 구조인지 확인하세요.",
        ],
        bullets: [
          "id는 한 문서에서 유일하게, 반복되는 분류에는 class를 사용합니다.",
          "이미지에는 내용을 설명하는 alt를 씁니다. 장식용 이미지는 alt=\"\"로 비워 화면 낭독기가 건너뛰게 합니다.",
          "새 창만 열기 위한 빈 href=\"#\"는 스크롤을 위로 움직일 수 있습니다. 동작이라면 button을 사용합니다.",
          "br을 여백 만들기에 반복 사용하지 말고 문단은 p, 간격은 CSS로 표현합니다.",
          "비밀번호·토큰 같은 민감한 값은 HTML이나 브라우저 JavaScript에 넣지 않습니다.",
        ],
        tip:
          "태그 이름을 외우기보다 ‘이 내용의 역할은 무엇인가?’를 먼저 묻고, 모양은 다음 CSS 레슨에서 해결하세요.",
      },
    ],
    checkpoints: [
      "head와 body에 들어갈 내용을 구분할 수 있다.",
      "요소, 태그, 속성, DOM 트리의 관계를 설명할 수 있다.",
      "div 대신 의미 있는 요소를 선택해야 하는 이유를 말할 수 있다.",
      "label, id, name이 각각 무엇을 연결하는지 구분할 수 있다.",
      "GET 폼을 전송했을 때 URL이 어떻게 만들어지는지 예측할 수 있다.",
    ],
    related: [
      "css-cascade-layout",
      "javascript-dom-events",
      "servlet-jsp-request-lifecycle",
    ],
    sources: [
      {
        label: "공개 HTML 폼 예제",
        repository: "https://github.com/notetester/JSPBasic",
        path: "JSPBasic/WebContent/HTML/form.html",
        note: "입력 요소와 form 전송 구조를 확인할 수 있는 공개 학습 예제입니다.",
      },
      {
        label: "공개 블록·인라인 예제",
        repository: "https://github.com/notetester/CSS",
        path: "01. 블럭 요소 VS 인라인 요소/INDEX01.html",
        note: "블록과 인라인의 기본 흐름을 비교할 수 있습니다.",
      },
    ],
  },
  {
    slug: "css-cascade-layout",
    track: "web",
    order: 2,
    title: "CSS 캐스케이드에서 반응형 레이아웃까지",
    eyebrow: "웹의 언어 02",
    summary:
      "선택자가 겹칠 때 최종 스타일이 정해지는 규칙부터 박스 모델, Flexbox, 반응형 설계까지 연결해 ‘왜 이 모양이 나왔는지’ 설명할 수 있게 됩니다.",
    level: "기초",
    duration: "45분",
    why:
      "CSS 문제는 속성을 더 붙이는 것보다 적용 우선순위와 크기 계산을 정확히 읽는 것이 먼저입니다. 이 두 축을 이해하면 !important와 임의의 픽셀로 덮어쓰는 일을 크게 줄일 수 있습니다.",
    prerequisites: ["html-document-flow"],
    keywords: [
      "CSS",
      "선택자",
      "캐스케이드",
      "명시도",
      "박스 모델",
      "Flexbox",
      "미디어 쿼리",
      "반응형",
    ],
    sections: [
      {
        id: "cascade",
        title: "캐스케이드: 겹친 선언의 승자를 정하는 규칙",
        paragraphs: [
          "CSS(Cascading Style Sheets)의 cascading은 폭포처럼 여러 스타일 후보를 차례로 거른다는 뜻입니다. 브라우저는 중요도와 출처, 선택자 명시도, 소스에 적힌 순서를 고려해 한 속성의 최종값을 정합니다.",
          "명시도는 선택자가 얼마나 구체적인지를 나타내는 가중치입니다. 보통 인라인 style, id, class·속성·가상 클래스, 요소 선택자 순으로 강합니다. 같은 명시도라면 나중에 선언한 규칙이 이깁니다. 상속은 부모의 일부 속성이 자식에게 전달되는 별도 개념이며 color, font 계열은 대체로 상속되지만 margin, border는 상속되지 않습니다.",
        ],
        code: {
          language: "html",
          label: "같은 문단에 세 규칙이 겹치는 예",
          code: `<style>
  p { color: steelblue; }
  .notice { color: tomato; }
  #today { color: seagreen; }
</style>

<p id="today" class="notice">오늘 복습할 내용</p>`,
          explanation: [
            "요소 선택자 p보다 class 선택자 .notice가 구체적입니다.",
            "id 선택자 #today가 셋 중 명시도가 가장 높으므로 최종 글자색은 seagreen입니다.",
          ],
        },
        result: {
          label: "계산된 스타일",
          output: `color: seagreen`,
          explanation:
            "개발자 도구의 Styles 패널을 열면 탈락한 color 선언에는 취소선이 표시되고, Computed 패널에는 최종값이 보입니다.",
        },
        tip:
          "우선순위가 헷갈리면 규칙을 더 추가하기 전에 개발자 도구에서 어느 선언이 이겼는지 먼저 확인하세요.",
      },
      {
        id: "box-model",
        title: "박스 모델: width만 보고 크기를 판단하지 않기",
        paragraphs: [
          "모든 요소는 content, padding, border, margin으로 둘러싸인 사각형입니다. content는 실제 내용, padding은 내용 안쪽 여백, border는 테두리, margin은 다른 박스와의 바깥 간격입니다.",
          "기본 content-box에서는 width가 content 너비만 뜻해 padding과 border가 바깥으로 더해집니다. border-box에서는 선언한 width 안에 content, padding, border가 함께 들어갑니다. 예측 가능한 레이아웃을 위해 전체 요소에 border-box를 적용하는 패턴이 흔합니다.",
        ],
        code: {
          language: "css",
          label: "200px 카드의 크기를 고정하기",
          code: `*, *::before, *::after {
  box-sizing: border-box;
}

.card {
  width: 200px;
  padding: 20px;
  border: 4px solid #2e7a73;
  margin-block: 16px;
}`,
          explanation: [
            "border-box이므로 화면에서 카드의 테두리 바깥 너비는 정확히 200px입니다.",
            "margin-block은 글쓰기 방향을 고려한 논리 속성으로 위·아래 바깥 간격을 지정합니다.",
          ],
        },
        result: {
          label: "가로 크기 계산",
          output: `전체 너비 200px = content 152px + padding 40px + border 8px`,
        },
      },
      {
        id: "normal-flow-flex",
        title: "문서 흐름과 Flexbox",
        paragraphs: [
          "일반 흐름(normal flow)은 별도 위치 지정이 없을 때 요소가 놓이는 기본 규칙입니다. 블록 요소는 세로로 쌓이고 인라인 내용은 한 줄 안에서 흐릅니다. 레이아웃을 만들 때 이 기본 흐름을 최대한 유지하면 내용이 늘어도 덜 깨집니다.",
          "Flexbox는 한 방향으로 놓이는 항목을 배치하는 도구입니다. display: flex를 준 부모가 flex container, 바로 아래 자식이 flex item입니다. flex-direction이 주축 방향을 정하고 justify-content는 주축, align-items는 교차축 정렬을 담당합니다.",
        ],
        code: {
          language: "html",
          label: "줄바꿈되는 학습 카드 목록",
          code: `<style>
  .lesson-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 0;
    list-style: none;
  }
  .lesson-list > li {
    flex: 1 1 180px;
    padding: 16px;
    border: 1px solid #ccd4d0;
  }
</style>

<ul class="lesson-list">
  <li>HTML 구조</li>
  <li>CSS 캐스케이드</li>
  <li>JavaScript DOM</li>
</ul>`,
          explanation: [
            "flex-wrap은 공간이 부족하면 다음 줄로 보냅니다.",
            "flex: 1 1 180px은 기본 너비 180px에서 늘고 줄 수 있다는 뜻입니다.",
            "gap은 항목 사이 간격이며 마지막 항목 바깥에 불필요한 여백을 만들지 않습니다.",
          ],
        },
      },
      {
        id: "responsive",
        title: "고정 화면이 아닌 범위로 설계하기",
        paragraphs: [
          "반응형 디자인은 기기 이름을 맞히는 기술이 아니라 사용 가능한 공간에 맞춰 콘텐츠가 자연스럽게 재배치되게 하는 설계입니다. 먼저 작은 화면에서 읽히는 기본 스타일을 만들고, 넓어질 때 필요한 규칙을 min-width 미디어 쿼리로 추가하는 방식을 모바일 우선이라고 합니다.",
          "width: 100%만으로는 큰 화면에서 문장이 지나치게 길어질 수 있습니다. max-width로 읽기 좋은 최대 폭을 제한하고 margin-inline: auto로 가운데 배치합니다. 이미지에는 max-width: 100%와 height: auto를 주면 부모보다 커지지 않으면서 비율을 유지합니다.",
        ],
        code: {
          language: "css",
          label: "모바일 한 열에서 데스크톱 두 열로",
          code: `.page {
  width: min(100% - 32px, 1080px);
  margin-inline: auto;
}

.layout {
  display: grid;
  gap: 24px;
}

@media (min-width: 768px) {
  .layout {
    grid-template-columns: 240px minmax(0, 1fr);
  }
}`,
          explanation: [
            "min()은 ‘좌우 여백을 뺀 화면 폭’과 1080px 중 작은 값을 선택합니다.",
            "minmax(0, 1fr)의 0은 긴 코드가 본문 열을 억지로 넓히는 문제를 막습니다.",
          ],
        },
      },
      {
        id: "css-pitfalls",
        title: "깨지는 레이아웃에서 먼저 볼 것",
        paragraphs: [
          "CSS를 고칠 때는 증상에 임의의 숫자를 덧대기보다 캐스케이드, 박스 크기, 부모의 배치 규칙, 콘텐츠의 최소 크기 순으로 원인을 좁히세요.",
        ],
        bullets: [
          "!important는 정상적인 우선순위 추적을 어렵게 합니다. 외부 스타일을 제한적으로 덮는 경우가 아니라면 선택자 구조부터 정리합니다.",
          "height를 고정하면 글자가 늘거나 번역될 때 넘칩니다. 최소 높이가 필요하면 min-height를 우선 검토합니다.",
          "position: absolute는 일반 흐름에서 빠집니다. 전체 레이아웃보다 배지·아이콘 같은 겹침에 제한해 씁니다.",
          "색만으로 상태를 구분하지 말고 글자나 아이콘을 함께 제공합니다. 본문과 배경의 명도 대비도 확인합니다.",
          "키보드 사용자를 위해 :focus-visible 스타일을 제거하지 말고 명확하게 만듭니다.",
        ],
        tip:
          "브라우저 폭을 천천히 줄이면서 특정 기기 크기가 아니라 콘텐츠가 처음 답답해지는 지점을 breakpoint로 잡으세요.",
      },
    ],
    checkpoints: [
      "요소, class, id 선택자가 겹칠 때 최종값을 예측할 수 있다.",
      "content-box와 border-box의 전체 너비를 계산할 수 있다.",
      "Flexbox의 주축과 교차축을 구분할 수 있다.",
      "고정 height가 콘텐츠 증가에 취약한 이유를 설명할 수 있다.",
      "작은 화면을 기본으로 하는 반응형 규칙을 작성할 수 있다.",
    ],
    related: ["html-document-flow", "javascript-dom-events"],
    sources: [
      {
        label: "공개 CSS 선택자 예제",
        repository: "https://github.com/notetester/CSS",
        path: "02. 스타일 시트 선택자/INDEX03(선택자기본).html",
        note: "요소·class·id 선택자의 적용 범위를 비교하는 공개 예제입니다.",
      },
      {
        label: "공개 레이아웃 예제",
        repository: "https://github.com/notetester/CSS",
        path: "06. 레이아웃(매우중요)/INDEX01.html",
        note: "기본 문서 흐름에서 레이아웃을 구성하는 초기 학습 자료입니다.",
      },
    ],
  },
  {
    slug: "javascript-dom-events",
    track: "web",
    order: 3,
    title: "JavaScript로 DOM과 이벤트 다루기",
    eyebrow: "웹의 언어 03",
    summary:
      "HTML이 만든 DOM을 안전하게 찾고, 상태를 바꾸고, 사용자의 이벤트에 반응하는 방법을 작은 인터랙션으로 익힙니다. 버블링과 이벤트 위임까지 이해합니다.",
    level: "기초",
    duration: "45분",
    why:
      "버튼, 폼 검증, 탭, 모달, 비동기 요청은 모두 ‘요소를 찾고 이벤트에 반응해 상태를 바꾸는’ 같은 뼈대를 공유합니다. 이 흐름을 알면 프레임워크의 이벤트 처리도 원리를 놓치지 않습니다.",
    prerequisites: ["html-document-flow", "css-cascade-layout"],
    keywords: [
      "JavaScript",
      "DOM",
      "querySelector",
      "이벤트",
      "콜백",
      "버블링",
      "이벤트 위임",
      "defer",
    ],
    sections: [
      {
        id: "load-and-select",
        title: "DOM이 준비된 뒤 요소 찾기",
        paragraphs: [
          "JavaScript는 브라우저에서 동작을 담당하는 프로그래밍 언어입니다. script를 head에 두고 일반 방식으로 불러오면 브라우저가 HTML 파싱을 잠시 멈추고 스크립트를 실행합니다. defer 속성을 쓰면 다운로드는 병렬로 진행하고 DOM 구성이 끝난 뒤 문서 순서대로 실행합니다.",
          "document.querySelector는 CSS 선택자와 일치하는 첫 요소 하나를, querySelectorAll은 모든 요소를 NodeList로 돌려줍니다. NodeList는 배열과 비슷하고 forEach는 쓸 수 있지만 모든 배열 메서드가 있는 것은 아닙니다. 찾지 못한 querySelector 결과는 null이므로 존재 여부를 확인해야 합니다.",
        ],
        code: {
          language: "html",
          label: "defer로 DOM 준비 시점 보장하기",
          code: `<head>
  <script defer src="app.js"></script>
</head>
<body>
  <p id="status">대기 중</p>
</body>`,
          explanation: [
            "app.js가 실행될 때 #status 요소가 이미 DOM에 만들어져 있습니다.",
            "별도 파일에 스크립트를 두면 HTML 구조와 동작을 나누어 관리하기 쉽습니다.",
          ],
        },
        tip:
          "script가 body 끝에 있어도 동작할 수 있지만, 외부 스크립트에는 의도를 명확히 하는 defer 패턴이 편리합니다.",
      },
      {
        id: "read-write-dom",
        title: "글자, class, 속성, 폼 상태 바꾸기",
        paragraphs: [
          "textContent는 요소 안의 텍스트를 읽거나 바꿉니다. innerHTML은 문자열을 HTML로 파싱하므로 신뢰하지 못하는 사용자 입력을 넣으면 스크립트 삽입 공격이 생길 수 있습니다. 단순 글자는 textContent를 우선 사용합니다.",
          "classList.add, remove, toggle은 CSS class를 조작합니다. 화면 모양을 JavaScript style 속성으로 일일이 바꾸기보다 class를 상태 이름으로 붙이고 CSS가 모양을 담당하게 하면 역할이 선명합니다. input의 checked, button의 disabled 같은 현재 상태는 DOM 프로퍼티로 읽고 씁니다.",
        ],
        code: {
          language: "javascript",
          label: "동의 여부에 따라 버튼 활성화하기",
          code: `const agree = document.querySelector("#agree");
const nextButton = document.querySelector("#next");
const status = document.querySelector("#status");

if (agree && nextButton && status) {
  agree.addEventListener("change", () => {
    nextButton.disabled = !agree.checked;
    status.textContent = agree.checked ? "계속할 수 있습니다." : "동의가 필요합니다.";
  });
}`,
          explanation: [
            "change는 체크박스의 선택 상태가 바뀔 때 발생하는 이벤트입니다.",
            "disabled 프로퍼티에 true를 넣으면 버튼이 비활성화됩니다.",
            "삼항 연산자 조건 ? 참일 때 값 : 거짓일 때 값으로 상태 문구를 고릅니다.",
          ],
        },
        result: {
          label: "체크박스를 선택한 직후",
          output: `버튼 disabled: false
상태 문구: 계속할 수 있습니다.`,
        },
      },
      {
        id: "event-object",
        title: "이벤트 객체와 기본 동작",
        paragraphs: [
          "이벤트는 클릭, 입력, 제출처럼 브라우저 안에서 발생한 사건입니다. addEventListener의 두 번째 인수는 사건이 일어났을 때 실행될 콜백 함수입니다. 콜백은 지금 즉시 실행하는 함수가 아니라 다른 코드에 전달해 나중에 호출하게 하는 함수입니다.",
          "콜백의 매개변수 event에는 사건 정보가 들어 있습니다. event.target은 실제 사건이 시작된 요소, event.currentTarget은 현재 콜백이 등록된 요소입니다. 링크 이동이나 폼 제출 같은 브라우저 기본 동작을 막아야 할 때만 event.preventDefault()를 호출합니다.",
        ],
        code: {
          language: "javascript",
          label: "검색 폼을 검사하고 제출 흐름 유지하기",
          code: `const form = document.querySelector("#search-form");

form?.addEventListener("submit", (event) => {
  const data = new FormData(form);
  const keyword = String(data.get("keyword") ?? "").trim();

  if (keyword.length < 2) {
    event.preventDefault();
    document.querySelector("#error").textContent = "두 글자 이상 입력하세요.";
  }
});`,
          explanation: [
            "optional chaining인 ?.은 form이 null이면 addEventListener 호출을 건너뜁니다.",
            "FormData는 name을 기준으로 폼 값을 읽습니다.",
            "유효하면 preventDefault를 부르지 않으므로 원래 action 주소로 정상 제출됩니다.",
          ],
        },
      },
      {
        id: "bubbling-delegation",
        title: "버블링을 이용한 이벤트 위임",
        paragraphs: [
          "대부분의 DOM 이벤트는 가장 안쪽 요소에서 시작해 부모 방향으로 올라갑니다. 이를 버블링이라고 합니다. 버튼 속 span을 눌러도 click 이벤트가 버튼과 그 부모 목록까지 전달될 수 있습니다.",
          "이벤트 위임은 여러 자식에 각각 리스너를 붙이지 않고 공통 부모 하나에서 버블링된 이벤트를 처리하는 방식입니다. 나중에 동적으로 추가한 자식도 처리할 수 있습니다. closest는 자신부터 부모 방향으로 가장 가까운 선택자 일치 요소를 찾습니다.",
        ],
        code: {
          language: "javascript",
          label: "동적으로 추가되는 복습 목록 삭제",
          code: `const list = document.querySelector("#lesson-list");

list?.addEventListener("click", (event) => {
  const clicked = event.target;
  if (!(clicked instanceof Element)) return;

  const button = clicked.closest("button[data-remove]");
  if (!button || !list.contains(button)) return;

  button.closest("li")?.remove();
});`,
          explanation: [
            "data-remove는 사용자 정의 data 속성이고 선택 의도를 분명히 합니다.",
            "instanceof Element 검사 뒤에야 closest를 안전하게 호출합니다.",
            "list.contains 검사는 중첩된 다른 목록에서 올라온 버튼을 잘못 처리하지 않게 합니다.",
          ],
        },
      },
      {
        id: "javascript-pitfalls",
        title: "이벤트 코드가 두 번 또는 전혀 안 될 때",
        paragraphs: [
          "먼저 콘솔의 첫 오류부터 해결하고, 선택자가 실제 요소를 찾았는지, 스크립트 실행 시점이 맞는지, 같은 리스너를 반복 등록하지 않았는지 순서대로 확인합니다.",
        ],
        bullets: [
          "onclick 속성과 addEventListener를 섞으면 실행 경로를 추적하기 어렵습니다. 동작은 JavaScript 파일에 모읍니다.",
          "addEventListener(\"click\", handleClick())은 함수를 즉시 실행한 결과를 전달합니다. 괄호 없이 handleClick을 전달합니다.",
          "화살표 함수의 this는 호출한 DOM 요소로 바뀌지 않습니다. 어느 요소에서 일어났는지는 event.currentTarget을 쓰면 명확합니다.",
          "preventDefault와 stopPropagation을 습관처럼 호출하면 폼 제출과 이벤트 위임이 조용히 깨집니다.",
          "사용자 입력을 innerHTML에 넣지 말고 textContent를 사용해 XSS 위험을 줄입니다.",
        ],
        tip:
          "콘솔에 event.target과 event.currentTarget을 함께 찍어 보면 버블링 경로를 가장 빠르게 이해할 수 있습니다.",
      },
    ],
    checkpoints: [
      "defer가 DOM 접근 오류를 줄이는 이유를 설명할 수 있다.",
      "querySelector와 querySelectorAll의 반환값 차이를 안다.",
      "textContent, classList, checked, disabled를 목적에 맞게 쓸 수 있다.",
      "target과 currentTarget의 차이를 설명할 수 있다.",
      "부모 하나의 리스너로 여러 자식 클릭을 처리할 수 있다.",
    ],
    related: [
      "html-document-flow",
      "css-cascade-layout",
      "jquery-to-modern-dom",
    ],
    sources: [
      {
        label: "공개 DOM 선택 예제",
        repository: "https://github.com/notetester/JAVASCRIPT",
        path: "03NODE_SELECTOR/script01(노드선택1).html",
        note: "id·class·태그로 DOM 노드를 찾는 단계별 예제입니다.",
      },
      {
        label: "공개 이벤트 버블링 예제",
        repository: "https://github.com/notetester/JAVASCRIPT",
        path: "05EVENT객체/script02(버블링).html",
        note: "이벤트 객체와 부모 방향 전파를 확인할 수 있습니다.",
      },
    ],
  },
  {
    slug: "jquery-to-modern-dom",
    track: "web",
    order: 4,
    title: "jQuery를 읽고 현대 DOM 코드로 옮기기",
    eyebrow: "웹의 언어 04",
    summary:
      "기존 jQuery 코드의 선택·이벤트·class·폼 상태 조작을 정확히 읽고, 같은 동작을 브라우저 표준 DOM API로 옮기는 대응표를 익힙니다.",
    level: "기초",
    duration: "35분",
    why:
      "오래된 JSP·Spring 프로젝트와 플러그인에는 jQuery가 여전히 많습니다. 새 코드에 무조건 추가할 필요는 없지만, 기존 코드를 유지보수하고 점진적으로 바꾸려면 $가 감춘 DOM 동작을 이해해야 합니다.",
    prerequisites: ["javascript-dom-events"],
    keywords: [
      "jQuery",
      "$",
      "ready",
      "on",
      "classList",
      "prop",
      "DOM API",
      "점진적 전환",
    ],
    sections: [
      {
        id: "what-jquery-wraps",
        title: "$는 무엇을 돌려주는가",
        paragraphs: [
          "jQuery는 DOM 선택, 이벤트, 애니메이션, AJAX의 브라우저 차이를 간단한 API로 감싼 JavaScript 라이브러리입니다. 라이브러리는 자주 쓰는 기능을 미리 구현해 둔 코드 묶음입니다. $(\".item\")은 DOM 요소 자체가 아니라 선택된 요소들을 감싼 jQuery 객체를 반환합니다.",
          "jQuery 객체에는 .on(), .addClass(), .prop() 같은 jQuery 메서드를 쓰고, querySelector로 얻은 DOM 요소에는 addEventListener, classList, checked 같은 표준 API를 씁니다. 둘을 섞을 때는 $('#id')[0]처럼 DOM 요소를 꺼내거나 $(domElement)처럼 다시 감싸야 하지만, 한 기능 안에서는 한 방식을 일관되게 쓰는 편이 읽기 쉽습니다.",
        ],
        bullets: [
          "$(function () { ... }): DOM이 준비된 뒤 콜백을 실행합니다.",
          "$(\"선택자\"): CSS 선택자에 맞는 요소를 jQuery 객체로 감쌉니다.",
          "메서드 체이닝: 메서드가 다시 jQuery 객체를 돌려줘 .addClass(...).text(...)처럼 이어 쓰는 방식입니다.",
          "CDN: 라이브러리 파일을 외부 콘텐츠 전송 서버에서 불러오는 방식입니다. 네트워크와 버전 고정 여부를 함께 고려해야 합니다.",
        ],
      },
      {
        id: "jquery-interaction",
        title: "jQuery로 선택하고 이벤트 처리하기",
        paragraphs: [
          ".on(\"click\", callback)은 클릭 리스너를 등록합니다. .text()는 글자, .addClass()와 .toggleClass()는 class, .attr()은 HTML 속성, .prop()은 checked·disabled 같은 현재 DOM 상태를 다룹니다.",
          "attr과 prop을 구분해야 합니다. checked라는 HTML 속성은 처음 선택된 기본값을 나타내지만, 사용자가 클릭한 뒤의 현재 체크 상태는 checked 프로퍼티입니다. 그래서 폼 상태에는 .prop(\"checked\")를 사용합니다.",
        ],
        code: {
          language: "javascript",
          label: "jQuery 방식의 즐겨찾기 토글",
          code: `$(function () {
  $("#favorite").on("change", function () {
    const selected = $(this).prop("checked");
    $("#card").toggleClass("is-favorite", selected);
    $("#message").text(selected ? "즐겨찾기에 추가했습니다." : "즐겨찾기에서 뺐습니다.");
  });
});`,
          explanation: [
            "일반 function 안의 this는 change 이벤트가 발생한 체크박스입니다.",
            "toggleClass의 두 번째 인수는 class를 붙일지 뗄지를 명시하는 boolean 값입니다.",
          ],
        },
        result: {
          label: "체크했을 때",
          output: `#card class: card is-favorite
#message: 즐겨찾기에 추가했습니다.`,
        },
      },
      {
        id: "native-equivalent",
        title: "같은 동작을 표준 DOM API로 쓰기",
        paragraphs: [
          "현대 브라우저는 querySelector, addEventListener, classList, fetch처럼 과거에 jQuery가 단순화했던 핵심 기능을 표준으로 제공합니다. 작은 새 기능이라면 jQuery를 추가하지 않고도 같은 동작을 명확하게 작성할 수 있습니다.",
          "변환할 때는 문법을 한 줄씩 치환하기보다 입력, 상태 변화, 화면 출력이라는 동작 단위로 비교합니다. null 가능성을 확인하는 것도 jQuery와 다른 중요한 지점입니다. jQuery는 결과가 없어도 빈 jQuery 객체를 반환하지만 querySelector는 null을 반환합니다.",
        ],
        code: {
          language: "javascript",
          label: "위 예제의 현대 DOM 버전",
          code: `const favorite = document.querySelector("#favorite");
const card = document.querySelector("#card");
const message = document.querySelector("#message");

if (favorite instanceof HTMLInputElement && card && message) {
  favorite.addEventListener("change", () => {
    card.classList.toggle("is-favorite", favorite.checked);
    message.textContent = favorite.checked
      ? "즐겨찾기에 추가했습니다."
      : "즐겨찾기에서 뺐습니다.";
  });
}`,
          explanation: [
            "HTMLInputElement 검사로 checked 프로퍼티를 안전하게 사용합니다.",
            "textContent는 문자열을 HTML로 해석하지 않아 단순 메시지 출력에 안전합니다.",
          ],
        },
      },
      {
        id: "translation-table",
        title: "유지보수할 때 자주 보는 대응 관계",
        paragraphs: [
          "아래 관계를 외우기보다 각각이 선택, 순회, 이벤트, 내용, class, 속성 중 어느 역할인지 분류하세요. 그러면 낯선 플러그인 코드도 DOM 동작으로 해석할 수 있습니다.",
        ],
        bullets: [
          "$(\".item\") ↔ document.querySelectorAll(\".item\")",
          "$(\"#save\").on(\"click\", fn) ↔ element.addEventListener(\"click\", fn)",
          ".each((index, element) => ...) ↔ nodeList.forEach((element, index) => ...)",
          ".text(value) ↔ element.textContent = value",
          ".addClass/.removeClass/.toggleClass ↔ element.classList.add/remove/toggle",
          ".attr(\"title\", value) ↔ element.setAttribute(\"title\", value)",
          ".prop(\"checked\") ↔ input.checked",
          ".val() ↔ input.value",
        ],
        code: {
          language: "javascript",
          label: "여러 항목 순회 비교",
          code: `// jQuery
$(".lesson").each(function (index) {
  $(this).attr("data-order", index + 1);
});

// 표준 DOM
document.querySelectorAll(".lesson").forEach((lesson, index) => {
  lesson.dataset.order = String(index + 1);
});`,
          explanation: [
            "dataset.order는 data-order HTML 속성과 연결됩니다.",
            "dataset에 넣는 값은 문자열로 변환하는 것이 의도를 분명히 합니다.",
          ],
        },
      },
      {
        id: "jquery-pitfalls",
        title: "점진적으로 바꿀 때 지켜야 할 선",
        paragraphs: [
          "동작 중인 레거시 화면을 한 번에 전부 바꾸면 회귀 범위가 커집니다. 사용자 동작 하나를 기준으로 기존 테스트나 수동 재현 절차를 먼저 만들고, 그 단위를 표준 API로 옮긴 뒤 결과를 비교하세요.",
        ],
        bullets: [
          "페이지가 기대하는 jQuery 버전을 확인하고, 단순히 최신 CDN 주소로 교체하지 않습니다. 플러그인이 깨질 수 있습니다.",
          "같은 버튼에 jQuery .on과 addEventListener를 중복 등록하면 한 번 클릭에 두 번 실행됩니다.",
          ".html(userInput)은 XSS 위험이 있습니다. 단순 글자는 .text(userInput) 또는 textContent를 사용합니다.",
          "동적으로 생기는 요소는 부모에 .on(\"click\", \"자식선택자\", handler)를 쓰거나 표준 이벤트 위임을 사용합니다.",
          "애니메이션 제거·추가는 prefers-reduced-motion 같은 사용자 모션 설정도 고려합니다.",
        ],
        tip:
          "새 코드인지 기존 플러그인 유지보수인지 먼저 구분하세요. 선택의 기준은 유행이 아니라 의존성 비용, 지원 브라우저, 회귀 위험입니다.",
      },
    ],
    checkpoints: [
      "jQuery 객체와 DOM 요소의 차이를 설명할 수 있다.",
      "attr과 prop을 폼 상태 예제로 구분할 수 있다.",
      ".on, .text, .toggleClass를 표준 DOM API로 옮길 수 있다.",
      "querySelector가 null을 반환할 수 있음을 처리할 수 있다.",
      "레거시 화면을 동작 단위로 점진 전환할 수 있다.",
    ],
    related: ["javascript-dom-events", "html-document-flow"],
    sources: [
      {
        label: "공개 jQuery 기초 예제",
        repository: "https://github.com/notetester/JQUERY",
        path: "jquery02.html",
        note: "선택자와 문서 준비 시점의 기본 사용법을 확인할 수 있습니다.",
      },
      {
        label: "공개 jQuery DOM 조작 예제",
        repository: "https://github.com/notetester/JQUERY",
        path: "jquery05.html",
        note: "속성과 화면 요소를 조작하는 기존 jQuery 패턴의 참고 자료입니다.",
      },
    ],
  },
  {
    slug: "xml-data-format",
    track: "web",
    order: 5,
    title: "XML로 계층형 데이터 읽고 설계하기",
    eyebrow: "웹의 언어 05",
    summary:
      "XML의 엄격한 문법과 트리 구조를 익히고, 브라우저에서 데이터를 파싱하는 방법부터 Java·Spring 설정과 MyBatis 매핑에서 XML이 쓰이는 이유까지 연결합니다.",
    level: "기초",
    duration: "35분",
    why:
      "요즘 웹 API는 JSON을 많이 쓰지만, Servlet 설정·Spring 빈 설정·MyBatis SQL 매퍼·RSS 같은 곳에서는 XML을 자주 만납니다. 태그 모양만 보고 HTML과 같다고 생각하지 않으려면 데이터 구조와 문법을 정확히 알아야 합니다.",
    prerequisites: ["html-document-flow"],
    keywords: [
      "XML",
      "요소",
      "속성",
      "트리",
      "well-formed",
      "namespace",
      "DOMParser",
      "MyBatis",
    ],
    sections: [
      {
        id: "xml-rules",
        title: "XML은 태그를 직접 정의하는 데이터 언어",
        paragraphs: [
          "XML(eXtensible Markup Language)은 계층형 데이터를 텍스트로 표현하는 마크업 언어입니다. HTML은 h1, p처럼 정해진 요소의 의미와 화면 표현이 있지만, XML은 lesson, keyword처럼 데이터 목적에 맞는 이름을 직접 만듭니다. XML 자체는 화면을 꾸미지 않습니다.",
          "정상적인 XML 문서는 루트 요소가 정확히 하나이고, 시작 태그와 종료 태그가 정확히 짝을 이루며, 대소문자를 구분하고, 속성값을 따옴표로 감쌉니다. 이 최소 문법을 지킨 상태를 well-formed, 즉 문법적으로 올바르다고 합니다.",
        ],
        bullets: [
          "<?xml version=\"1.0\" encoding=\"UTF-8\"?> 선언은 선택 사항이지만 인코딩 의도를 분명히 합니다.",
          "<lesson>...</lesson>은 요소이고 difficulty=\"basic\"은 속성입니다.",
          "&lt;, &gt;, &amp;, &quot;, &apos;는 문법 기호를 데이터로 표현하는 미리 정의된 엔티티입니다.",
          "빈 요소는 <prerequisite></prerequisite> 또는 <prerequisite />로 쓸 수 있습니다.",
        ],
        tip:
          "XML 오류가 나면 먼저 루트가 하나인지, 태그의 대소문자와 닫는 순서가 맞는지부터 확인하세요.",
      },
      {
        id: "element-attribute-tree",
        title: "요소, 속성, 텍스트를 어떻게 나눌까",
        paragraphs: [
          "요소는 자식 구조를 가질 수 있고 같은 이름을 반복할 수 있어 주요 데이터를 담기에 좋습니다. 속성은 한 요소의 짧은 메타데이터에 어울립니다. 메타데이터는 본문 데이터를 설명하는 데이터입니다. 긴 설명이나 반복 가능한 값은 속성보다 자식 요소로 두는 편이 확장하기 쉽습니다.",
          "XML도 부모·자식·형제 관계의 트리입니다. 아래 문서에서 catalog가 루트, lesson은 catalog의 자식, title과 keyword는 lesson의 자식입니다. id는 lesson을 식별하는 속성입니다.",
        ],
        code: {
          language: "xml",
          label: "작고 완전한 학습 목록 XML",
          code: `<?xml version="1.0" encoding="UTF-8"?>
<catalog updated="2026-07-10">
  <lesson id="dom" level="basic">
    <title>DOM과 이벤트</title>
    <keyword>selector</keyword>
    <keyword>event</keyword>
  </lesson>
  <lesson id="jsp" level="basic">
    <title>Servlet과 JSP</title>
    <keyword>request</keyword>
    <keyword>response</keyword>
  </lesson>
</catalog>`,
          explanation: [
            "catalog 하나가 전체 문서를 감싸므로 루트 요소 규칙을 만족합니다.",
            "keyword를 자식 요소로 두어 한 lesson에 여러 번 반복할 수 있습니다.",
            "updated는 catalog 전체를 설명하는 짧은 메타데이터라 속성으로 두었습니다.",
          ],
        },
        result: {
          label: "트리로 읽은 결과",
          output: `catalog
├─ lesson#dom → title 1개, keyword 2개
└─ lesson#jsp → title 1개, keyword 2개`,
        },
      },
      {
        id: "parse-in-browser",
        title: "브라우저에서 XML 파싱하기",
        paragraphs: [
          "DOMParser는 문자열을 DOM 문서로 바꾸는 브라우저 표준 객체입니다. HTML 문서와 마찬가지로 querySelector와 querySelectorAll로 요소를 찾을 수 있습니다. 다만 XML은 대소문자를 구분하므로 lesson과 Lesson은 다른 이름입니다.",
          "외부 XML을 fetch로 가져올 때는 응답 상태와 CORS도 확인해야 합니다. CORS는 다른 출처의 자원을 브라우저가 읽도록 서버가 허용하는 규칙입니다. 여기서는 네트워크 없이 실행 가능한 문자열 예제로 파싱 자체에 집중합니다.",
        ],
        code: {
          language: "javascript",
          label: "XML 문자열에서 제목 뽑기",
          code: `const source =
  "<catalog>" +
  "<lesson id='dom'><title>DOM과 이벤트</title></lesson>" +
  "<lesson id='jsp'><title>Servlet과 JSP</title></lesson>" +
  "</catalog>";

const xml = new DOMParser().parseFromString(source, "application/xml");
const parseError = xml.querySelector("parsererror");

if (parseError) {
  console.error("XML 문법 오류");
} else {
  const titles = [...xml.querySelectorAll("lesson > title")]
    .map((node) => node.textContent?.trim() ?? "");
  console.log(titles.join(" | "));
}`,
          explanation: [
            "parseFromString의 두 번째 인수 application/xml은 HTML이 아니라 XML 규칙으로 해석하게 합니다.",
            "문법 오류가 있어도 예외 대신 parsererror 요소가 생길 수 있으므로 명시적으로 검사합니다.",
            "전개 문법 [...]으로 NodeList를 배열로 바꾼 뒤 map을 사용합니다.",
          ],
        },
        result: {
          label: "콘솔 출력",
          output: `DOM과 이벤트 | Servlet과 JSP`,
        },
      },
      {
        id: "xml-in-java-stack",
        title: "Java·Spring·MyBatis에서 만나는 XML",
        paragraphs: [
          "Java 웹 프로젝트의 web.xml은 Servlet 컨테이너 설정을, Spring XML은 객체 연결을, MyBatis mapper XML은 Java 메서드와 SQL을 연결합니다. 컨테이너는 애플리케이션의 객체 생성과 요청 처리를 관리하는 실행 환경이고, 매퍼는 서로 다른 표현을 연결하는 구성 요소입니다.",
          "namespace는 같은 태그 이름의 충돌을 피하도록 이름에 소속을 부여합니다. xmlns로 선언하며, URI는 반드시 접속할 웹 주소라기보다 이름을 유일하게 만드는 식별자입니다. 스키마는 허용할 요소와 속성, 순서를 검증하는 규칙 문서입니다.",
        ],
        code: {
          language: "xml",
          label: "MyBatis 매퍼의 핵심 모양",
          code: `<mapper namespace="study.lesson.LessonMapper">
  <select id="findTitle" parameterType="long" resultType="string">
    SELECT title
    FROM lesson
    WHERE id = #{id}
  </select>
</mapper>`,
          explanation: [
            "namespace와 select의 id를 합쳐 Java 매퍼 메서드를 식별합니다.",
            "#{id}는 값을 바인딩해 SQL과 데이터를 분리합니다. 문자열 치환인 \${id}와 달리 일반 값 입력에 안전한 기본 선택입니다.",
            "실제 프로젝트에서는 mapper DOCTYPE이나 스키마 선언과 데이터베이스별 SQL도 함께 확인합니다.",
          ],
        },
      },
      {
        id: "xml-pitfalls",
        title: "XML에서 자주 놓치는 경계",
        paragraphs: [
          "XML은 공백과 줄바꿈도 텍스트 노드가 될 수 있습니다. 화면에서 보이는 값만 필요하면 textContent를 trim하고, 순수 요소 자식이 필요하면 children을 사용합니다.",
        ],
        bullets: [
          "<Lesson>과 <lesson>은 다릅니다. 이름의 대소문자를 일관되게 정합니다.",
          "& 문자를 그대로 쓰면 엔티티 시작으로 해석됩니다. 데이터에서는 &amp;로 이스케이프합니다.",
          "외부에서 받은 XML은 DTD와 외부 엔티티 처리를 안전하게 비활성화한 파서를 사용해 XXE 공격을 막습니다.",
          "속성 순서에 의미를 두지 않습니다. XML 처리기는 속성 순서를 보장할 필요가 없습니다.",
          "비밀번호·API 키·실제 접속 문자열은 공개 XML 예제나 저장소에 넣지 않고 환경별 비밀 저장소로 분리합니다.",
        ],
        tip:
          "사람이 읽는 설명은 요소, 짧은 식별자와 분류는 속성이라는 출발 규칙을 쓰되 반복·확장 가능성에 따라 조정하세요.",
      },
    ],
    checkpoints: [
      "XML과 HTML의 목적 차이를 설명할 수 있다.",
      "well-formed XML의 최소 규칙을 나열할 수 있다.",
      "요소와 속성 중 어디에 데이터를 둘지 이유를 말할 수 있다.",
      "DOMParser의 parsererror를 확인하며 XML을 읽을 수 있다.",
      "MyBatis의 #{value} 바인딩이 단순 문자열 치환보다 안전한 이유를 안다.",
    ],
    related: [
      "html-document-flow",
      "javascript-dom-events",
      "servlet-jsp-request-lifecycle",
    ],
    sources: [
      {
        label: "공개 MyBatis XML 매퍼",
        repository: "https://github.com/notetester/SPRING",
        path: "MyWeb/src/main/resources/sqlmap/UserMapper.xml",
        note: "namespace와 SQL 매핑이 쓰이는 실제 공개 프로젝트 구조입니다.",
      },
      {
        label: "공개 Java 웹 배포 서술자",
        repository: "https://github.com/notetester/JSPBasic",
        path: "JSPBasic/WebContent/WEB-INF/web.xml",
        note: "Java 웹 애플리케이션 설정에서 XML이 사용되는 예입니다.",
      },
    ],
  },
  {
    slug: "java-language-basics",
    track: "java",
    order: 1,
    title: "Java 문법과 실행 흐름 다시 잡기",
    eyebrow: "Java에서 JSP까지 01",
    summary:
      "소스가 JVM에서 실행되는 과정부터 변수·자료형·연산·조건문·반복문·메서드·배열을 작은 완성 프로그램으로 다시 연결합니다.",
    level: "입문",
    duration: "50분",
    why:
      "Spring이나 JSP의 코드는 결국 Java 문법으로 실행됩니다. 자료형 변환과 제어 흐름을 정확히 읽지 못하면 프레임워크 오류처럼 보이는 문제도 실제로는 단순한 Java 문제일 수 있습니다.",
    prerequisites: [],
    keywords: [
      "Java",
      "JDK",
      "JVM",
      "변수",
      "자료형",
      "조건문",
      "반복문",
      "메서드",
      "배열",
    ],
    sections: [
      {
        id: "compile-run",
        title: ".java에서 실행 결과까지",
        paragraphs: [
          "JDK(Java Development Kit)는 javac 컴파일러와 실행 도구를 포함한 개발 도구 모음입니다. javac는 사람이 읽는 .java 소스를 JVM(Java Virtual Machine)이 실행할 수 있는 .class 바이트코드로 컴파일합니다. JVM은 운영체제마다 구현되지만 같은 바이트코드를 실행해 Java의 이식성을 만듭니다.",
          "클래스는 코드의 기본 묶음이고 main은 일반 Java 프로그램의 시작 메서드입니다. public은 JVM이 접근할 수 있음을, static은 객체를 만들지 않고 호출할 수 있음을, void는 반환값이 없음을 뜻합니다. String[] args에는 명령줄 인수가 들어옵니다.",
        ],
        code: {
          language: "java",
          label: "HelloReview.java",
          code: `public class HelloReview {
    public static void main(String[] args) {
        System.out.println("Hello, Java");
        System.out.println("인수 개수: " + args.length);
    }
}`,
          explanation: [
            "public 클래스 이름과 파일 이름은 HelloReview로 같아야 합니다.",
            "println은 값을 출력한 뒤 줄을 바꿉니다.",
            "+는 문자열이 포함된 식에서 값을 문자열로 이어 붙입니다.",
          ],
        },
        result: {
          label: "javac HelloReview.java 후 java HelloReview one 실행",
          output: `Hello, Java
인수 개수: 1`,
        },
        tip:
          "컴파일 오류는 실행 전에 문법·자료형을 검사한 결과이고, 런타임 오류는 컴파일 뒤 실행 중 생긴 문제입니다. 두 단계를 구분하세요.",
      },
      {
        id: "types-variables",
        title: "변수, 기본형, 참조형",
        paragraphs: [
          "변수는 이름을 붙인 저장 공간입니다. 선언은 자료형과 이름을 정하고, 대입은 값을 넣습니다. Java의 기본형은 정수 byte·short·int·long, 실수 float·double, 문자 char, 논리 boolean입니다. int와 double이 정수와 실수 리터럴의 기본형입니다.",
          "String, 배열, 사용자가 만든 클래스는 참조형입니다. 참조형 변수는 객체 자체가 아니라 객체를 가리키는 참조를 담고, 아무 객체도 가리키지 않는 값은 null입니다. 작은 범위에서 큰 범위로는 자동 변환될 수 있지만, 반대 방향의 명시적 형 변환은 값 손실을 만들 수 있습니다.",
        ],
        code: {
          language: "java",
          label: "Types.java",
          code: `public class Types {
    public static void main(String[] args) {
        int count = 3;
        long total = count * 4_000L;
        double average = total / (double) count;
        char grade = 'A';
        boolean passed = average >= 10_000;

        System.out.println(total);
        System.out.println(average);
        System.out.println(grade + ":" + passed);
    }
}`,
          explanation: [
            "4_000의 밑줄은 가독성을 위한 것으로 값에는 영향을 주지 않습니다.",
            "정수끼리 나누면 소수 부분이 사라지므로 한 피연산자를 double로 변환합니다.",
            "char는 작은따옴표 한 문자, String은 큰따옴표 문자열입니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `12000
4000.0
A:false`,
        },
      },
      {
        id: "control-flow",
        title: "조건과 반복으로 실행 경로 만들기",
        paragraphs: [
          "if는 boolean 조건이 true일 때 블록을 실행하고, else if와 else로 다른 경로를 고릅니다. switch는 하나의 값에 따라 여러 경우를 나눌 때 유용합니다. ==는 기본형 값을 비교하지만 String 내용 비교에는 equals를 사용합니다.",
          "for는 반복 횟수가 분명할 때, while은 조건이 참인 동안 반복할 때 알맞습니다. break는 가장 가까운 반복을 끝내고 continue는 현재 회차의 나머지를 건너뜁니다. 증감 연산자 ++를 복잡한 식 안에 넣기보다 별도 문장으로 쓰면 평가 순서 실수를 줄일 수 있습니다.",
        ],
        code: {
          language: "java",
          label: "ScoreSummary.java",
          code: `public class ScoreSummary {
    public static void main(String[] args) {
        int[] scores = {88, 73, 95, 61};
        int passed = 0;

        for (int score : scores) {
            if (score >= 80) {
                passed++;
            }
        }

        String message = passed >= 3 ? "목표 달성" : "조금 더 복습";
        System.out.println("80점 이상: " + passed);
        System.out.println(message);
    }
}`,
          explanation: [
            "int[]는 int 값 여러 개를 순서대로 저장하는 배열 자료형입니다.",
            "향상된 for문은 배열의 각 값을 score에 차례로 넣습니다.",
            "삼항 연산자는 짧은 값 선택에 쓰며 복잡한 분기는 if가 더 읽기 쉽습니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `80점 이상: 2
조금 더 복습`,
        },
      },
      {
        id: "methods-arrays",
        title: "메서드로 의도를 묶고 배열을 안전하게 다루기",
        paragraphs: [
          "메서드는 이름이 있는 재사용 가능한 작업입니다. 매개변수는 호출할 때 받을 입력의 이름과 자료형이고, 반환형은 결과 자료형입니다. return은 결과를 호출한 곳에 돌려주며 메서드 실행도 끝냅니다. void 메서드는 결과값을 돌려주지 않습니다.",
          "배열은 생성할 때 길이가 고정되고 인덱스는 0부터 length - 1까지입니다. 범위를 넘으면 ArrayIndexOutOfBoundsException이 실행 중 발생합니다. 합계·최댓값 같은 계산을 메서드로 분리하면 입력과 결과를 독립적으로 시험하기 쉽습니다.",
        ],
        code: {
          language: "java",
          label: "Average.java",
          code: `public class Average {
    static double average(int[] values) {
        if (values.length == 0) return 0.0;

        int sum = 0;
        for (int value : values) sum += value;
        return sum / (double) values.length;
    }

    public static void main(String[] args) {
        int[] minutes = {20, 35, 25};
        System.out.println(average(minutes));
    }
}`,
          explanation: [
            "빈 배열을 먼저 처리해 0으로 나누는 상황을 피합니다.",
            "메서드의 입력 int[]와 출력 double이 선언부에 드러납니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `26.666666666666668`,
          explanation:
            "표시 자리수를 제한하려면 System.out.printf(\"%.1f%n\", average(minutes))처럼 형식을 지정할 수 있습니다.",
        },
      },
      {
        id: "java-pitfalls",
        title: "처음 다시 볼 때 특히 헷갈리는 것",
        paragraphs: [
          "오류 메시지는 보통 예외 종류, 설명, 발생 위치인 스택 트레이스를 제공합니다. 맨 위의 내 코드 파일과 줄 번호부터 읽고 그 줄로 들어온 값이 무엇인지 확인하세요.",
        ],
        bullets: [
          "String은 ==가 아니라 equals로 내용을 비교합니다. 상수 쪽에서 \"yes\".equals(input)처럼 쓰면 null에도 안전합니다.",
          "정수 나눗셈은 소수 부분을 버립니다. 필요한 시점 전에 double로 변환합니다.",
          "지역 변수는 사용 전에 초기화해야 하고, 참조형의 null을 사용하면 NullPointerException이 납니다.",
          "배열 마지막 인덱스는 length가 아니라 length - 1입니다.",
          "Scanner를 닫으면 그 안의 System.in도 닫힙니다. 작은 프로그램과 장기 실행 프로그램에서 자원 수명을 구분합니다.",
        ],
        tip:
          "한 줄에 한 변화만 두고, 중간값을 의미 있는 변수로 꺼내 출력해 보면 연산 순서와 자료형 문제를 빠르게 찾을 수 있습니다.",
      },
    ],
    checkpoints: [
      "JDK, javac, 바이트코드, JVM의 역할을 순서대로 설명할 수 있다.",
      "기본형과 참조형을 예로 구분할 수 있다.",
      "정수 나눗셈과 명시적 형 변환의 결과를 예측할 수 있다.",
      "조건문과 반복문으로 배열 값을 집계할 수 있다.",
      "입력과 반환형이 분명한 메서드를 작성할 수 있다.",
    ],
    related: ["java-oop-collections", "servlet-jsp-request-lifecycle"],
    sources: [
      {
        label: "공개 Java 시작 예제",
        repository: "https://github.com/notetester/workspace",
        path: "day01/src/day01/HelloJava.java",
        note: "main 메서드와 콘솔 출력의 출발점을 확인할 수 있습니다.",
      },
      {
        label: "공개 변수·자료형 예제",
        repository: "https://github.com/notetester/workspace",
        path: "day02/src/day02/VariableEx.java",
        note: "변수 선언과 값 저장을 연습하는 공개 자료입니다.",
      },
      {
        label: "공개 반복문 예제",
        repository: "https://github.com/notetester/workspace",
        path: "day04/src/day04/EnhancedForEx.java",
        note: "배열을 순회하는 향상된 for문의 참고 예제입니다.",
      },
    ],
  },
  {
    slug: "java-oop-collections",
    track: "java",
    order: 2,
    title: "Java 객체지향과 컬렉션을 함께 이해하기",
    eyebrow: "Java에서 JSP까지 02",
    summary:
      "클래스·객체·캡슐화에서 상속·다형성으로 확장하고, 여러 객체를 List·Set·Map에 담아 실제 프로그램의 모델과 데이터 흐름을 구성합니다.",
    level: "기초",
    duration: "55분",
    why:
      "Spring의 Controller·Service·Repository, JPA 엔티티와 DTO는 모두 객체의 책임과 관계 위에 세워집니다. 컬렉션까지 연결해야 여러 회원, 게시글, 응답 데이터를 실제로 다룰 수 있습니다.",
    prerequisites: ["java-language-basics"],
    keywords: [
      "클래스",
      "객체",
      "캡슐화",
      "생성자",
      "상속",
      "다형성",
      "제네릭",
      "List",
      "Set",
      "Map",
    ],
    sections: [
      {
        id: "class-object-encapsulation",
        title: "클래스는 설계도, 객체는 각자의 상태",
        paragraphs: [
          "클래스는 상태를 나타내는 필드와 동작을 나타내는 메서드를 묶은 사용자 정의 자료형입니다. new로 클래스를 실제 메모리에 만든 것이 객체이고, 변수는 그 객체를 가리키는 참조를 담습니다. 같은 클래스에서 만든 객체도 필드값은 각각 다를 수 있습니다.",
          "캡슐화는 내부 상태를 숨기고 허용한 동작을 통해서만 바꾸게 하는 설계입니다. 필드를 private으로 막고 의미 있는 메서드에서 규칙을 검사하면 어디서든 잘못된 값을 대입하는 일을 줄일 수 있습니다. 단순 getter·setter를 만드는 것보다 상태 변화의 의도를 메서드 이름에 담는 것이 좋습니다.",
        ],
        code: {
          language: "java",
          label: "MemberDemo.java",
          code: `public class MemberDemo {
    static class Member {
        private final long id;
        private String name;
        private boolean active = true;

        Member(long id, String name) {
            if (id <= 0 || name.isBlank()) {
                throw new IllegalArgumentException("올바른 회원 정보가 필요합니다.");
            }
            this.id = id;
            this.name = name;
        }

        void rename(String newName) {
            if (newName.isBlank()) throw new IllegalArgumentException("이름은 비울 수 없습니다.");
            this.name = newName;
        }

        String summary() {
            return id + ":" + name + ":" + active;
        }
    }

    public static void main(String[] args) {
        Member member = new Member(1L, "둘리");
        member.rename("도우너");
        System.out.println(member.summary());
    }
}`,
          explanation: [
            "생성자는 클래스 이름과 같고 반환형이 없으며 객체의 초기 상태를 만듭니다.",
            "this.id는 현재 객체의 필드, id는 생성자 매개변수입니다.",
            "final 필드는 생성 후 다른 값으로 다시 대입할 수 없습니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `1:도우너:true`,
        },
      },
      {
        id: "constructors-overload",
        title: "생성자와 오버로딩으로 사용 방법 정의하기",
        paragraphs: [
          "생성자는 객체가 유효한 상태로 시작하도록 필수값을 받습니다. 아무 생성자도 작성하지 않았을 때만 컴파일러가 매개변수 없는 기본 생성자를 제공합니다. 생성자를 하나라도 작성하면 필요한 생성자를 직접 모두 정의해야 합니다.",
          "오버로딩은 같은 이름의 메서드를 매개변수 개수나 자료형을 다르게 정의하는 것입니다. 반환형만 바꾸는 것은 호출 시 구분할 수 없어 오버로딩이 아닙니다. 비슷한 의도를 하나의 이름으로 표현할 때 유용하지만 String 매개변수만 바꿔 의미가 모호하다면 findByEmail처럼 이름을 분리하는 편이 낫습니다.",
        ],
        bullets: [
          "this(...)는 같은 클래스의 다른 생성자를 호출하며 생성자 첫 문장이어야 합니다.",
          "메서드 시그니처는 이름과 매개변수 목록으로 구분됩니다.",
          "객체가 반드시 가져야 할 값은 생성자에서 받고 선택값에는 명확한 기본값을 둡니다.",
        ],
        tip:
          "생성 뒤 setter를 여러 번 불러야만 쓸 수 있는 객체라면, 생성자가 필수 조건을 충분히 표현하는지 다시 보세요.",
      },
      {
        id: "inheritance-polymorphism",
        title: "상속보다 중요한 다형성의 효과",
        paragraphs: [
          "상속은 기존 클래스의 필드와 메서드를 물려받아 더 구체적인 클래스를 만드는 기능입니다. extends 뒤가 부모 타입입니다. 오버라이딩은 자식이 부모 메서드를 같은 시그니처로 다시 구현하는 것이며 @Override가 실수를 컴파일 시점에 잡아 줍니다.",
          "다형성은 부모 타입의 한 변수로 여러 자식 객체를 다루되, 실행할 때 실제 객체의 오버라이딩 메서드가 호출되는 성질입니다. 호출하는 쪽이 구체적인 Cat·Dog를 일일이 분기하지 않아도 새 타입을 추가할 수 있습니다. 단, 단순 코드 재사용만을 위한 깊은 상속보다 인터페이스와 조합이 변경에 유연한 경우가 많습니다.",
        ],
        code: {
          language: "java",
          label: "PolymorphismDemo.java",
          code: `public class PolymorphismDemo {
    interface Notifier {
        String send(String message);
    }

    static class EmailNotifier implements Notifier {
        public String send(String message) { return "EMAIL: " + message; }
    }

    static class ConsoleNotifier implements Notifier {
        public String send(String message) { return "CONSOLE: " + message; }
    }

    static void notify(Notifier notifier, String message) {
        System.out.println(notifier.send(message));
    }

    public static void main(String[] args) {
        notify(new EmailNotifier(), "복습 시간");
        notify(new ConsoleNotifier(), "복습 시간");
    }
}`,
          explanation: [
            "인터페이스는 구현 클래스가 지켜야 할 메서드 계약을 선언합니다.",
            "notify는 구체 클래스가 아닌 Notifier 계약에 의존합니다.",
            "같은 send 호출이 실제 객체에 따라 다른 결과를 만드는 것이 다형성입니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `EMAIL: 복습 시간
CONSOLE: 복습 시간`,
        },
      },
      {
        id: "collections-generics",
        title: "List, Set, Map과 제네릭",
        paragraphs: [
          "컬렉션은 여러 객체를 다루는 표준 자료구조입니다. List는 순서와 중복이 있고 인덱스로 접근합니다. Set은 중복 없는 집합입니다. Map은 중복되지 않는 key와 value를 연결하며 Collection의 하위 타입은 아니지만 컬렉션 프레임워크의 핵심입니다.",
          "제네릭 <String>은 컬렉션에 담을 자료형을 컴파일 시점에 제한합니다. 꺼낼 때 형 변환할 필요가 없고 잘못된 타입 삽입을 미리 막습니다. 구현체는 기본적으로 ArrayList, HashSet, HashMap에서 시작하되 순서 보장, 정렬, 동시성 같은 요구가 있을 때 다른 구현을 선택합니다.",
        ],
        code: {
          language: "java",
          label: "CollectionDemo.java",
          code: `import java.util.*;

public class CollectionDemo {
    public static void main(String[] args) {
        List<String> history = new ArrayList<>();
        history.add("HTML");
        history.add("HTML");
        history.add("Java");

        Set<String> unique = new LinkedHashSet<>(history);
        Map<String, Integer> minutes = new LinkedHashMap<>();
        minutes.put("HTML", 20);
        minutes.merge("HTML", 15, Integer::sum);
        minutes.put("Java", 30);

        System.out.println(history);
        System.out.println(unique);
        minutes.forEach((topic, time) -> System.out.println(topic + "=" + time));
    }
}`,
          explanation: [
            "List는 HTML 중복을 그대로 보존합니다.",
            "LinkedHashSet은 중복을 없애면서 들어온 순서를 보존합니다.",
            "merge는 key가 있으면 기존 값과 새 값을 합치고 없으면 새로 넣습니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `[HTML, HTML, Java]
[HTML, Java]
HTML=35
Java=30`,
        },
      },
      {
        id: "oop-pitfalls",
        title: "객체와 컬렉션 설계에서 흔한 실수",
        paragraphs: [
          "객체지향의 목표는 클래스를 많이 만드는 것이 아니라 변경 이유가 같은 상태와 동작을 함께 두고, 다른 부분과의 계약을 분명히 하는 것입니다.",
        ],
        bullets: [
          "모든 필드에 public setter를 만들면 캡슐화 효과가 사라집니다. 허용할 상태 변화에 이름을 붙입니다.",
          "부모-자식이 정말 ‘is-a’ 관계가 아니라면 상속 대신 필드로 다른 객체를 가지는 조합을 검토합니다.",
          "HashSet과 HashMap의 key로 사용자 객체를 쓸 때 equals와 hashCode의 일관성이 필요합니다.",
          "Map을 인덱스 0부터 size까지 순회하면 key가 연속이라는 잘못된 가정이 됩니다. entrySet으로 순회합니다.",
          "컬렉션을 순회하면서 직접 remove하면 ConcurrentModificationException이 날 수 있습니다. removeIf나 Iterator.remove를 씁니다.",
        ],
        tip:
          "변수는 가능한 List·Map·Notifier 같은 인터페이스 타입으로 선언하고, 생성할 때만 ArrayList·HashMap 같은 구현체를 고르세요.",
      },
    ],
    checkpoints: [
      "클래스, 객체, 참조의 차이를 설명할 수 있다.",
      "생성자에서 유효한 초기 상태를 보장할 수 있다.",
      "오버로딩과 오버라이딩을 구분할 수 있다.",
      "부모나 인터페이스 타입으로 다형성을 사용할 수 있다.",
      "순서·중복·key 조회 요구에 따라 List, Set, Map을 선택할 수 있다.",
    ],
    related: ["java-language-basics", "servlet-jsp-request-lifecycle"],
    sources: [
      {
        label: "공개 캡슐화 예제",
        repository: "https://github.com/notetester/workspace",
        path: "day10/src/encap/good/Member.java",
        note: "private 상태와 접근 메서드를 분리한 학습 예제입니다.",
      },
      {
        label: "공개 다형성 예제",
        repository: "https://github.com/notetester/workspace",
        path: "day11/src/poly/basic3/MainClass.java",
        note: "부모 타입으로 여러 객체를 다루는 흐름을 확인할 수 있습니다.",
      },
      {
        label: "공개 Map 예제",
        repository: "https://github.com/notetester/workspace",
        path: "day15/src/collection/map/HashMapEx01.java",
        note: "HashMap의 key-value 저장과 조회를 연습하는 공개 자료입니다.",
      },
    ],
  },
  {
    slug: "servlet-jsp-request-lifecycle",
    track: "java",
    order: 3,
    title: "Servlet 요청 생명주기와 JSP 렌더링",
    eyebrow: "Java에서 JSP까지 03",
    summary:
      "브라우저의 HTTP 요청이 Servlet 컨테이너를 지나 doGet·doPost로 들어오고, request에 데이터를 담아 JSP가 HTML을 만드는 전 과정을 한 번의 요청으로 추적합니다.",
    level: "기초",
    duration: "55분",
    why:
      "Spring MVC도 핵심은 요청을 받고, Java 코드로 처리하고, 모델 데이터를 뷰에 전달해 응답하는 구조입니다. Servlet과 JSP의 원리를 알면 Controller·Model·View와 forward·redirect의 차이가 선명해집니다.",
    prerequisites: [
      "java-language-basics",
      "java-oop-collections",
      "html-document-flow",
    ],
    keywords: [
      "HTTP",
      "Servlet",
      "Servlet container",
      "request",
      "response",
      "forward",
      "JSP",
      "EL",
      "JSTL",
      "session",
    ],
    sections: [
      {
        id: "request-response-container",
        title: "브라우저와 Servlet 사이의 한 번의 왕복",
        paragraphs: [
          "HTTP는 클라이언트가 요청을 보내고 서버가 응답하는 규칙입니다. 요청에는 메서드(GET·POST), 경로, 헤더, 필요하면 본문이 있고 응답에는 상태 코드, 헤더, 본문이 있습니다. HTML 폼의 action과 method가 이 요청을 만듭니다.",
          "Servlet 컨테이너는 Tomcat처럼 Servlet 객체의 생성·생명주기·URL 매핑·동시 요청을 관리하는 서버 실행 환경입니다. @WebServlet의 경로와 요청 URL이 맞으면 컨테이너가 HttpServletRequest와 HttpServletResponse 객체를 만들어 해당 Servlet 메서드에 전달합니다.",
        ],
        code: {
          language: "java",
          label: "GreetingServlet.java",
          code: `import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet("/greeting")
public class GreetingServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setContentType("text/plain;charset=UTF-8");
        String name = request.getParameter("name");
        if (name == null || name.isBlank()) name = "학습자";
        response.getWriter().println("안녕하세요, " + name + "님");
    }
}`,
          explanation: [
            "GET /앱경로/greeting?name=둘리 요청은 doGet으로 들어옵니다.",
            "getParameter는 쿼리 문자열이나 폼의 name을 기준으로 값을 읽고, 없으면 null입니다.",
            "Content-Type과 charset은 응답 본문이 UTF-8 텍스트임을 브라우저에 알립니다.",
          ],
        },
        result: {
          label: "GET /greeting?name=둘리의 응답 본문",
          output: `안녕하세요, 둘리님`,
        },
      },
      {
        id: "servlet-lifecycle",
        title: "init, service, doGet·doPost, destroy",
        paragraphs: [
          "컨테이너는 보통 Servlet 객체 하나를 만들고 init을 한 번 호출합니다. 요청마다 service가 호출되고, HttpServlet의 service가 HTTP 메서드를 보고 doGet이나 doPost로 분배합니다. 애플리케이션을 내릴 때 destroy가 한 번 호출됩니다.",
          "여러 요청이 같은 Servlet 인스턴스를 여러 스레드에서 동시에 사용할 수 있습니다. 따라서 요청별 name이나 계산 결과를 Servlet 필드에 저장하면 사용자끼리 값이 섞일 수 있습니다. 요청별 데이터는 메서드의 지역 변수나 request 속성에 두고, 공유 상태가 꼭 필요하면 동시성을 안전하게 설계합니다.",
        ],
        bullets: [
          "init: 설정을 읽는 등 Servlet 전체 수명에 한 번 필요한 초기화.",
          "service: 요청마다 호출되어 메서드별 처리기로 분배.",
          "doGet: 조회·링크 이동처럼 GET 요청 처리.",
          "doPost: 폼 제출·생성처럼 POST 요청 처리.",
          "destroy: 서버 종료나 재배포 때 자원 정리.",
        ],
        tip:
          "service를 직접 재구현해 doGet·doPost를 수동 호출하기보다 보통 필요한 doGet·doPost만 오버라이드하세요.",
      },
      {
        id: "parameters-and-post",
        title: "폼 파라미터를 읽고 검증하기",
        paragraphs: [
          "HTML input의 name이 요청 파라미터 이름이 됩니다. getParameter는 값 하나를 String으로, 같은 name의 체크박스처럼 값이 여러 개면 getParameterValues가 String[]로 돌려줍니다. 숫자도 먼저 문자열로 들어오므로 비어 있는지와 형식을 검사한 뒤 변환합니다.",
          "클라이언트의 required와 pattern 검사는 사용자 편의를 위한 1차 검사입니다. 요청은 브라우저 밖에서도 만들 수 있으므로 서버가 반드시 다시 검증해야 합니다. 민감한 값은 로그에 그대로 남기지 않습니다.",
        ],
        code: {
          language: "java",
          label: "StudyServlet의 POST 처리",
          code: `@Override
protected void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException {
    request.setCharacterEncoding("UTF-8");
    response.setContentType("text/plain;charset=UTF-8");

    String topic = request.getParameter("topic");
    String minutesText = request.getParameter("minutes");

    if (topic == null || topic.isBlank() || minutesText == null) {
        response.sendError(400, "topic과 minutes가 필요합니다.");
        return;
    }

    try {
        int minutes = Integer.parseInt(minutesText);
        if (minutes <= 0) throw new NumberFormatException();
        response.getWriter().printf("%s: %d분 기록%n", topic, minutes);
    } catch (NumberFormatException error) {
        response.sendError(400, "minutes는 양의 정수여야 합니다.");
    }
}`,
          explanation: [
            "400은 요청 값이 잘못되었다는 HTTP 상태 코드입니다.",
            "return으로 오류 응답 뒤의 정상 처리 코드가 실행되지 않게 합니다.",
            "POST 본문의 문자 인코딩은 파라미터를 읽기 전에 설정합니다.",
          ],
        },
        result: {
          label: "topic=JSP, minutes=30을 보낸 결과",
          output: `HTTP 200
JSP: 30분 기록`,
        },
      },
      {
        id: "forward-to-jsp",
        title: "Servlet은 처리하고 JSP는 HTML을 만든다",
        paragraphs: [
          "Servlet에서 데이터 준비와 흐름 제어를 맡고 JSP에서 화면을 렌더링하면 역할이 나뉩니다. 렌더링은 데이터를 최종 HTML 문자열로 만드는 과정입니다. request.setAttribute로 모델 데이터를 저장하고 RequestDispatcher.forward로 JSP에 같은 요청을 넘깁니다.",
          "JSP는 서버에서 Servlet 코드로 변환·컴파일되어 실행됩니다. EL(Expression Language)의 \${이름}은 request·session 등의 속성을 간결하게 읽습니다. JSTL(JSP Standard Tag Library)은 조건과 반복을 태그로 표현해 <% ... %> 스크립틀릿에 Java 코드를 섞는 일을 줄입니다.",
        ],
        code: {
          language: "java",
          label: "목록을 JSP로 forward하는 Servlet",
          code: `@WebServlet("/lessons")
public class LessonServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setAttribute("title", "오늘의 복습");
        request.setAttribute("topics", java.util.List.of("HTML", "Java", "JSP"));
        request.getRequestDispatcher("/WEB-INF/views/lessons.jsp")
               .forward(request, response);
    }
}`,
          explanation: [
            "WEB-INF 아래 파일은 브라우저가 직접 URL로 열 수 없어 Servlet을 거치게 할 수 있습니다.",
            "forward는 서버 안에서 같은 request와 response를 JSP로 넘기므로 속성이 유지됩니다.",
          ],
        },
      },
      {
        id: "jsp-el-jstl",
        title: "EL과 JSTL로 출력과 반복 표현하기",
        paragraphs: [
          "JSP의 page 지시어는 응답 문자셋과 페이지 설정을 정합니다. taglib 지시어는 JSTL 태그의 접두사와 라이브러리를 연결합니다. 아래 예제는 Servlet이 request에 넣은 title과 topics를 출력합니다.",
          "EL은 속성을 찾을 때 page, request, session, application 범위를 차례로 탐색합니다. 이름이 겹치면 requestScope.title처럼 범위를 명시할 수 있습니다. c:out은 출력값을 이스케이프해 HTML 삽입 위험을 줄이고, c:forEach는 배열과 컬렉션을 반복합니다.",
        ],
        code: {
          language: "jsp",
          label: "/WEB-INF/views/lessons.jsp",
          code: `<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!doctype html>
<html lang="ko">
  <head><title><c:out value="\${title}" /></title></head>
  <body>
    <h1><c:out value="\${title}" /></h1>
    <ul>
      <c:forEach var="topic" items="\${topics}">
        <li><c:out value="\${topic}" /></li>
      </c:forEach>
    </ul>
  </body>
</html>`,
          explanation: [
            "Jakarta Tags 3.x의 core URI를 사용한 예입니다. 오래된 프로젝트는 java.sun.com JSTL URI를 쓸 수 있으므로 의존성 버전과 맞춥니다.",
            "JSP는 표현만 담당하고 목록을 만드는 Java 로직은 Servlet에 남아 있습니다.",
          ],
        },
        result: {
          label: "브라우저에 렌더링되는 목록",
          output: `오늘의 복습
• HTML
• Java
• JSP`,
        },
      },
      {
        id: "scope-forward-redirect-pitfalls",
        title: "범위와 페이지 이동에서 정보가 사라지는 이유",
        paragraphs: [
          "request 범위는 한 요청과 그 forward 동안만 유지됩니다. session은 여러 요청에 걸쳐 같은 사용자의 상태를 보존하고, application은 애플리케이션 전체 사용자가 공유합니다. 범위가 넓을수록 수명과 동시성, 메모리, 개인정보 위험이 커지므로 필요한 가장 좁은 범위를 선택합니다.",
          "forward는 서버 내부 이동이라 URL이 그대로이고 request 속성이 유지됩니다. sendRedirect는 브라우저에 새 URL로 다시 요청하라고 3xx 응답을 보내므로 URL이 바뀌고 기존 request 속성은 사라집니다. POST 성공 뒤 새로고침 중복 제출을 막는 PRG(Post/Redirect/Get)에는 redirect가 알맞습니다.",
        ],
        bullets: [
          "Servlet 인스턴스 필드에 요청별 값을 저장하지 않습니다. 동시 요청이 값을 공유합니다.",
          "응답 writer로 본문을 쓴 뒤 forward하거나 redirect하지 않습니다. 이미 응답이 커밋될 수 있습니다.",
          "JSP에 데이터베이스 조회나 복잡한 Java 코드를 넣지 않고 Servlet·Service에서 처리합니다.",
          "사용자 입력을 그대로 HTML로 출력하지 않습니다. c:out과 상황에 맞는 출력 인코딩을 사용합니다.",
          "session에 큰 목록이나 민감한 정보를 오래 저장하지 않고 로그아웃 시 필요한 상태를 정리합니다.",
        ],
        tip:
          "값이 사라졌다면 먼저 새 HTTP 요청이 생겼는지 확인하세요. redirect 뒤에는 request가 새로 만들어지므로 session이나 쿼리 파라미터 등 의도한 전달 방법이 필요합니다.",
      },
    ],
    checkpoints: [
      "HTTP 요청이 URL 매핑을 거쳐 doGet·doPost에 도달하는 과정을 설명할 수 있다.",
      "Servlet 생명주기와 동시 요청 때문에 인스턴스 필드가 위험한 이유를 안다.",
      "폼의 name을 서버에서 읽고 빈 값·숫자 형식을 다시 검증할 수 있다.",
      "request 속성을 forward로 JSP에 전달하고 EL·JSTL로 출력할 수 있다.",
      "forward와 redirect, request와 session 범위를 상황에 맞게 구분할 수 있다.",
    ],
    related: [
      "html-document-flow",
      "xml-data-format",
      "java-language-basics",
      "java-oop-collections",
    ],
    sources: [
      {
        label: "공개 Servlet 예제",
        repository: "https://github.com/notetester/JSPBasic",
        path: "JSPBasic/src/com/servlet/TestServlet.java",
        note: "URL 매핑과 request·response 처리의 공개 학습 예제입니다.",
      },
      {
        label: "공개 POST request 예제",
        repository: "https://github.com/notetester/JSPBasic",
        path: "JSPBasic/WebContent/request/req_post_ex01.jsp",
        note: "폼 전송과 요청 파라미터 흐름을 확인할 수 있습니다.",
      },
      {
        label: "공개 forward 예제",
        repository: "https://github.com/notetester/JSPBasic",
        path: "JSPBasic/WebContent/send_vs_forward/forward_ex02.jsp",
        note: "같은 요청을 서버 내부에서 전달하는 흐름의 참고 자료입니다.",
      },
    ],
  },
];
