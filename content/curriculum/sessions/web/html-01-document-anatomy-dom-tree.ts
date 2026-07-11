import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["html-01-document-anatomy"],
  slug: "html-01-document-anatomy-dom-tree",
  courseId: "web",
  moduleId: "01-html-document-forms",
  order: 1,
  title: "HTML5 문서가 DOM 트리가 되는 과정",
  subtitle: "태그 모양을 외우는 데서 멈추지 않고, 전송된 문자 stream이 parser를 거쳐 문서 mode·요소·텍스트·속성 node의 DOM 트리가 되는 과정을 이해합니다.",
  level: "입문",
  estimatedMinutes: 150,
  coreQuestion: "브라우저는 HTML source를 어떤 순서로 해석해 화면·접근성 tree·JavaScript가 공유하는 DOM을 만들고, doctype·lang·head·body는 그 과정에서 어떤 계약을 맡을까요?",
  summary: "원본 첫 HTML 문서의 doctype, html lang, head meta charset/title, body를 출발점으로 tag·element·attribute·text와 void element를 구분합니다. bytes→문자 decoding→tokenization→tree construction→style/layout/paint 흐름, source와 복구된 DOM 차이, standards/quirks mode, document language·metadata·landmark·접근성까지 첫 페이지를 전문가 mental model로 확장합니다.",
  objectives: [
    "HTML이 화면 좌표가 아니라 의미와 관계를 markup하는 문서 언어임을 설명할 수 있다.",
    "bytes decoding·tokenization·tree construction을 구분하고 source와 DOM이 항상 같지 않은 이유를 설명할 수 있다.",
    "doctype이 HTML5 문서 mode를 선택하게 하는 선언이며 일반 element가 아님을 설명할 수 있다.",
    "html·head·body의 역할과 lang·charset·title metadata가 사용자·브라우저·보조기술에 미치는 영향을 설명할 수 있다.",
    "tag·element·attribute·text node·comment·void element를 구분하고 올바른 중첩 tree를 작성할 수 있다.",
    "브라우저 error recovery에 의존하지 않고 validator·DevTools로 실제 DOM을 확인할 수 있다.",
    "semantic landmark와 heading을 사용해 시각 표현 없이도 탐색 가능한 최소 문서를 만들 수 있다.",
  ],
  prerequisites: [],
  keywords: ["HTML", "HTML5", "DOCTYPE", "DOM", "parser", "element", "tag", "attribute", "text node", "head", "body", "lang", "charset", "accessibility"],
  chapters: [
    {
      id: "markup-not-painting",
      title: "HTML은 화면을 그리는 명령 목록보다 콘텐츠의 의미·계층·관계를 표시하는 언어입니다",
      lead: "제목·문단·링크·표·폼이라는 의미를 element로 표시하면 CSS·JavaScript·검색엔진·보조기술이 같은 구조를 해석할 수 있습니다.",
      explanations: [
        "원본 주석은 HTML을 HyperText Markup Language로 설명합니다. HyperText는 다른 자원과 연결되는 text이고 markup은 content가 무엇인지 구조적으로 표시합니다. HTML 자체가 programming language처럼 임의 계산을 수행하는 것은 아니지만 form·media·dialog 같은 풍부한 browser behavior를 선언합니다.",
        "화면에서 큰 글자처럼 보이게 div와 CSS만 쓰는 것과 h1으로 문서 제목을 표시하는 것은 다릅니다. 시각 사용자는 비슷하게 볼 수 있어도 outline·검색·screen reader heading navigation·자동화가 읽는 의미가 달라집니다.",
        "HTML은 tree 관계를 가집니다. 한 element 안에 다른 element가 들어가 parent/child가 되고 같은 parent 아래 element는 sibling입니다. CSS selector와 DOM traversal, event propagation은 이 tree 관계를 사용합니다.",
        "HTML·CSS·JavaScript의 책임은 완전히 고정된 벽은 아니지만 기본 원칙은 content/structure, presentation/layout, behavior/state입니다. 의미를 CSS class 이름만으로 만들거나 핵심 content를 JavaScript 실패 시 전부 잃지 않도록 progressive enhancement를 고려합니다.",
      ],
      concepts: [
        { term: "markup", definition: "원문 content에 element와 attribute를 더해 의미·구조·관계를 기계가 해석할 수 있게 표시하는 방식입니다.", detail: ["시각 style 자체와 다릅니다.", "문서 tree와 접근성 의미의 출발점입니다."], analogy: "교과서 원고에 '대제목', '문단', '참고 링크'라는 편집 표식을 붙이는 것과 비슷합니다." },
        { term: "hypertext", definition: "link를 통해 다른 문서·위치·resource로 이동할 수 있는 연결된 text 구조입니다.", detail: ["href와 URL은 뒤 세션에서 깊게 다룹니다.", "문서가 고립된 한 장이 아니라 web graph에 참여합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "페이지는 시각적으로 보이지만 screen reader·검색·자동 test가 제목·main content를 찾지 못한다.", likelyCause: "모든 구조를 div·span과 CSS class로만 만들고 의미 있는 element를 사용하지 않았습니다.", checks: ["CSS를 끄고 document outline을 읽습니다.", "heading·main·nav·button·link가 실제 element인지 확인합니다.", "browser accessibility tree와 landmark 목록을 봅니다."], fix: "content 역할에 맞는 native semantic element로 구조를 다시 표시하고 style은 CSS에 둡니다.", prevention: "semantic HTML·keyboard·accessibility tree review를 UI 완료 조건에 포함합니다." },
      ],
    },
    {
      id: "bytes-to-dom",
      title: "브라우저는 bytes를 문자로 decoding하고 token을 만든 뒤 tree construction으로 DOM을 구성합니다",
      lead: "HTML source text가 곧 화면이나 DOM은 아니며 parser가 누락 tag·잘못된 중첩을 규칙에 따라 복구할 수 있습니다.",
      explanations: [
        "network response나 file의 bytes는 HTTP Content-Type charset과 문서 meta charset 등 encoding 정보로 Unicode 문자 stream이 됩니다. encoding 판단이 틀리면 parser가 올바른 tag를 보더라도 한글 text가 깨집니다.",
        "tokenizer는 start tag·end tag·character·comment·doctype 같은 token을 만들고 tree builder는 insertion mode에 따라 Document 아래 html·head·body와 하위 node를 구성합니다. parser는 단순히 angle bracket를 stack으로 쌓는 것보다 복잡한 error recovery 규칙을 가집니다.",
        "DOM은 Document Object Model로 browser가 제공하는 node object tree입니다. CSS가 style을 계산하고 layout·paint가 화면 pixel을 만들며 JavaScript는 DOM attribute/property와 node를 조회·수정할 수 있습니다. DOM과 rendered visual tree도 동일하지 않습니다.",
        "View Source는 원래 response text에 가깝고 DevTools Elements는 parser 복구와 JavaScript 변경 뒤 현재 DOM을 보여 줍니다. 원인을 찾을 때 둘을 비교합니다.",
      ],
      concepts: [
        { term: "tokenization", definition: "문자 stream을 doctype·start/end tag·text·comment 같은 HTML token sequence로 해석하는 parser 단계입니다.", detail: ["script/style 등 state에 따라 문자 의미가 달라집니다.", "tree construction과 분리됩니다."] },
        { term: "DOM", definition: "Document와 element·text·comment 등 node가 parent/child 관계를 이루는 browser의 문서 객체 model입니다.", detail: ["source와 복구·변경 후 DOM은 다를 수 있습니다.", "CSS·JavaScript·접근성 API가 공통으로 참조합니다."] },
      ],
      codeExamples: [
        {
          id: "minimal-semantic-document",
          title: "문서 선언부터 main content까지 갖춘 최소 한국어 페이지",
          language: "html",
          filename: "first-document.html",
          purpose: "doctype·language·encoding·title·body landmark가 parser와 사용자에게 제공하는 정보를 한 문서에서 확인합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>HTML 첫 문서</title>\n</head>\n<body>\n  <header>\n    <p>NOTE TESTER 학습 기록</p>\n  </header>\n  <main>\n    <h1>브라우저가 읽는 HTML</h1>\n    <p>이 문단은 DOM의 텍스트 노드가 됩니다.</p>\n  </main>\n</body>\n</html>",
          walkthrough: [
            { lines: "1", explanation: "짧은 HTML doctype으로 standards mode를 요청합니다. 일반 element처럼 닫는 tag가 없습니다." },
            { lines: "2", explanation: "root html에 문서 기본 언어 ko를 선언합니다." },
            { lines: "3-7", explanation: "화면 본문이 아닌 metadata 영역에 encoding·viewport·탭/문서 제목을 둡니다." },
            { lines: "8-16", explanation: "body 안 header와 유일한 주 콘텐츠 main, 문서 대표 h1, 설명 p를 올바르게 중첩합니다." },
            { lines: "17", explanation: "root element를 닫아 source tree 의도를 명확히 합니다." },
          ],
          run: { environment: ["UTF-8로 저장", "현대 browser", "DevTools Elements와 Accessibility panel"], command: "browser에서 first-document.html 열기" },
          output: { value: "탭 제목: HTML 첫 문서\n문서 언어: ko\n화면 텍스트:\nNOTE TESTER 학습 기록\n브라우저가 읽는 HTML\n이 문단은 DOM의 텍스트 노드가 됩니다.", explanation: ["title은 body 화면이 아니라 탭·history·문서 이름에 사용됩니다.", "header와 main은 접근성 tree의 landmark가 됩니다.", "들여쓰기 whitespace도 text node가 될 수 있지만 일반 HTML layout에서는 연속 공백이 collapse됩니다."] },
          experiments: [
            { change: "<!doctype html>을 제거하고 document.compatMode를 console에서 확인합니다.", prediction: "일부 문서에서 BackCompat quirks mode가 선택될 수 있습니다.", result: "doctype은 화면 content가 아니라 rendering mode 선택 신호입니다." },
            { change: "lang='ko'를 lang='en'으로 잘못 바꿉니다.", prediction: "화면 글자는 같아도 screen reader 발음·번역·언어 도구가 영어 문서로 판단할 수 있습니다.", result: "lang은 시각 style이 아닌 문서 해석 metadata입니다." },
          ],
          sourceRefs: ["web-html-first-source", "whatwg-semantics", "wai-page-structure"],
        },
      ],
      diagnostics: [
        { symptom: "View Source에는 없는 body·tbody element가 DevTools DOM에 보이거나 node 위치가 바뀐다.", likelyCause: "HTML parser가 생략 element를 생성하거나 잘못된 nesting을 표준 error recovery 규칙으로 재구성했습니다.", checks: ["View Source와 Elements tree를 비교합니다.", "validator에서 첫 markup 오류를 찾습니다.", "JavaScript가 DOM을 수정했는지 확인합니다."], fix: "복구 결과에 의존하지 말고 content model에 맞는 명시적 nesting과 필수 구조를 작성합니다.", prevention: "HTML validation과 DOM snapshot/accessibility test를 CI에 둡니다." },
      ],
    },
    {
      id: "doctype-document-mode",
      title: "doctype은 HTML5 element가 아니라 browser 문서 mode를 standards로 맞추는 선행 선언입니다",
      lead: "현대 HTML 문서는 첫 줄에 <!doctype html>을 사용해 오래된 quirks layout 호환 mode를 피합니다.",
      explanations: [
        "doctype은 HTML parser가 만드는 DocumentType node로 일반 content element와 다릅니다. 화면에 표시되지 않고 end tag가 없습니다. 대소문자는 허용되는 범위가 있지만 관례적으로 짧은 lowercase 표기를 사용합니다.",
        "doctype이 없거나 오래된 잘못된 형태면 browser가 legacy site 호환을 위해 quirks 또는 limited-quirks mode를 선택할 수 있습니다. CSS box model·table·font 계산 일부가 standards와 달라져 같은 CSS가 예상과 다르게 보입니다.",
        "document.compatMode가 'CSS1Compat'이면 standards, 'BackCompat'이면 quirks를 나타냅니다. 이름이 직관적이지 않으므로 DevTools rendering 정보와 함께 확인합니다.",
        "doctype이 최신 browser feature를 enable하는 version switch라는 설명은 부정확합니다. HTML5 doctype은 standards mode trigger이며 실제 element/API 지원은 browser engine과 feature detection에 따릅니다.",
      ],
      concepts: [
        { term: "standards mode", definition: "현대 HTML·CSS 표준에 가까운 layout·parsing behavior를 사용하는 browser document mode입니다.", detail: ["올바른 doctype으로 요청합니다.", "browser feature version 전체를 고정하지 않습니다."] },
        { term: "quirks mode", definition: "doctype 없는 오래된 문서와 호환하려고 일부 layout behavior를 legacy 방식으로 처리하는 mode입니다.", detail: ["새 문서에서는 피합니다.", "document.compatMode로 확인할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "box 크기·table·font layout이 다른 페이지와 다르고 document.compatMode가 BackCompat이다.", likelyCause: "doctype이 누락·오타·앞선 bytes 때문에 standards mode trigger로 인식되지 않았습니다.", checks: ["response 시작부와 BOM/앞선 text를 확인합니다.", "doctype을 정확히 비교합니다.", "compatMode를 console에서 확인합니다."], fix: "문서 첫 부분에 정확한 <!doctype html>을 두고 legacy CSS를 standards 기준으로 수정합니다.", prevention: "HTML template·SSR layout에 doctype을 중앙화하고 smoke test에서 CSS1Compat를 단언합니다." },
      ],
    },
    {
      id: "root-language-head-metadata",
      title: "html lang과 head metadata는 화면 밖에서 문서 해석·이름·encoding·mobile viewport를 결정합니다",
      lead: "사용자는 body를 보지만 browser·검색·보조기술은 root language와 head metadata를 먼저 활용합니다.",
      explanations: [
        "html은 Document의 root element이며 lang은 페이지 주 언어를 BCP 47 language tag로 선언합니다. 한국어면 ko, 한국에서 사용하는 한국어를 특별히 구분해야 할 때 ko-KR을 고려합니다. text 일부 언어가 바뀌면 해당 element에 lang을 다시 지정합니다.",
        "meta charset='utf-8'은 HTML bytes decoding 선언입니다. parser가 앞부분에서 빨리 발견할 수 있게 head 초반에 둡니다. HTTP charset이 다르면 우선순위와 browser sniffing이 관여하므로 server header와 파일 encoding을 일치시킵니다.",
        "title은 document마다 유일하고 목적을 구분할 수 있게 작성합니다. 검색 결과·bookmark·history·tab·screen reader 문서 이름에 쓰입니다. body h1과 관련은 있지만 같은 node가 아니며 둘 다 목적에 맞게 둡니다.",
        "viewport meta는 mobile browser의 layout viewport를 device width와 맞추는 일반 설정입니다. user zoom을 막는 maximum-scale/user-scalable=no는 접근성을 해칠 수 있어 피합니다. description·canonical·Open Graph 같은 metadata는 뒤 SEO/배포 맥락에서 다룹니다.",
      ],
      concepts: [
        { term: "document language", definition: "페이지 content의 기본 자연어를 root lang attribute로 선언한 값입니다.", detail: ["발음·번역·hyphenation·spellcheck에 영향 줍니다.", "시각 text만 보고 자동으로 정확히 알 수 없습니다."] },
        { term: "metadata", definition: "문서 content 자체를 설명하거나 browser·검색·공유 client에 처리 정보를 제공하는 data입니다.", detail: ["대부분 head에 둡니다.", "화면 body와 별도이지만 사용자 경험에 중요합니다."] },
      ],
      codeExamples: [
        {
          id: "document-metadata-dom-inspection",
          title: "DOM API로 root·head·body 계약 확인",
          language: "html",
          filename: "inspect-document.html",
          purpose: "parser가 만든 document의 mode·언어·title·root children을 console의 안정된 문자열로 확인합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>문서 구조 점검</title>\n</head>\n<body>\n  <main id=\"content\">\n    <h1>DOM 점검</h1>\n  </main>\n  <script>\n    console.log(`mode=${document.compatMode}`);\n    console.log(`root=${document.documentElement.tagName}`);\n    console.log(`lang=${document.documentElement.lang}`);\n    console.log(`title=${document.title}`);\n    console.log(`body-first=${document.body.firstElementChild.tagName}`);\n    console.log(`main-text=${document.querySelector('#content h1').textContent}`);\n  </script>\n</body>\n</html>",
          walkthrough: [
            { lines: "1-10", explanation: "표준 문서와 language·title·main/h1을 만듭니다." },
            { lines: "11-18", explanation: "body 끝 script가 parsing된 앞 DOM을 읽어 mode, root element, language, title, first element, h1 text를 출력합니다." },
            { lines: "19-20", explanation: "script·body·html을 닫아 source 의도를 명확히 합니다." },
          ],
          run: { environment: ["현대 browser", "DevTools Console"], command: "browser에서 inspect-document.html을 열고 Console 확인" },
          output: { value: "mode=CSS1Compat\nroot=HTML\nlang=ko\ntitle=문서 구조 점검\nbody-first=MAIN\nmain-text=DOM 점검", explanation: ["tagName은 HTML 문서 DOM에서 uppercase로 표시됩니다.", "doctype이 standards mode를 만들고 html/head/body 구조가 document property로 노출됩니다.", "querySelector는 CSS selector로 현재 DOM의 h1 text node 값을 읽습니다."] },
          experiments: [
            { change: "script를 head로 옮기고 defer 없이 그대로 실행합니다.", prediction: "실행 시점에 body·main이 아직 parser에 생성되지 않아 null 접근 오류가 날 수 있습니다.", result: "DOM node 존재는 source 위치와 script 실행 timing에 의존합니다." },
            { change: "title element를 삭제합니다.", prediction: "document.title은 빈 문자열이고 tab에 file name/URL이 보일 수 있습니다.", result: "모든 독립 페이지에 목적을 설명하는 title이 필요합니다." },
          ],
          sourceRefs: ["web-html-first-source", "whatwg-semantics", "whatwg-syntax"],
        },
      ],
      diagnostics: [
        { symptom: "한글이 깨지고 meta charset을 넣었는데도 일부 환경에서 다르게 보인다.", likelyCause: "파일 실제 encoding·HTTP Content-Type charset·meta 선언이 서로 다르거나 meta가 너무 늦게 발견됩니다.", checks: ["editor 저장 encoding과 response header를 확인합니다.", "network raw response 앞부분과 meta 위치를 봅니다.", "UTF-8 bytes로 새 최소 파일을 비교합니다."], fix: "파일·server header·meta를 UTF-8로 일치시키고 charset 선언을 head 앞부분에 둡니다.", prevention: "server integration test와 한글·emoji round-trip fixture를 둡니다." },
      ],
    },
    {
      id: "elements-tags-attributes-nodes",
      title: "tag 표기와 DOM element, attribute, text node, void element를 구분합니다",
      lead: "<p>는 start tag이고 start/end tag와 content 전체가 element이며 DOM에는 별도 object와 text node로 표현됩니다.",
      explanations: [
        "원본은 <시작태그>content</끝태그>를 element로 설명합니다. 정확히는 tag는 source syntax 조각이고 element는 parser가 만든 의미 단위입니다. JavaScript에서 document.querySelector('p')가 반환하는 것은 tag 문자열이 아니라 HTMLParagraphElement 객체입니다.",
        "attribute는 start tag에 name/value로 기록해 element에 추가 정보·상태·관계를 제공합니다. 모든 element에 가능한 global attribute와 특정 element 전용 attribute가 있습니다. 같은 attribute를 중복 쓰거나 bool attribute를 'false' 문자열로 끄려는 실수를 피합니다.",
        "img·meta·link·input·br 같은 void element는 HTML syntax에서 end tag와 child content를 가질 수 없습니다. XHTML식 trailing slash는 HTML에서 self-closing 의미를 일반 element에 부여하지 않습니다. <div /> 뒤 content가 div 밖이라고 가정하지 않습니다.",
        "comment는 화면에 보이지 않아도 source와 DOM에 남을 수 있고 client에게 전송됩니다. password·API key·내부 TODO·개인정보를 HTML comment에 넣지 않습니다. DevTools·View Source로 누구나 볼 수 있습니다.",
      ],
      concepts: [
        { term: "element", definition: "HTML parser가 tag·attribute·content를 바탕으로 만든 문서 구조의 의미 있는 DOM node입니다.", detail: ["source tag와 object를 구분합니다.", "content model이 허용 child 관계를 정의합니다."] },
        { term: "void element", definition: "HTML에서 child content와 end tag를 가질 수 없는 정해진 element 종류입니다.", detail: ["meta·img·input·br 등이 있습니다.", "일반 element를 />로 닫는 XML 의미와 다릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "<div /> 다음 content가 예상과 다르게 div 안에 들어가 DOM이 커진다.", likelyCause: "HTML에서 일반 element의 trailing slash를 XML self-closing syntax로 오해했습니다.", checks: ["DevTools DOM과 source를 비교합니다.", "해당 element가 void인지 확인합니다.", "validator parse 오류를 봅니다."], fix: "일반 HTML element는 명시 end tag </div>로 닫고 void element만 정해진 syntax로 사용합니다.", prevention: "HTML formatter·validator와 component render test를 사용합니다." },
      ],
    },
    {
      id: "nesting-error-recovery",
      title: "browser error recovery는 페이지를 보이게 할 뿐 author 의도·접근성·cross-browser 계약을 보장하지 않습니다",
      lead: "잘못된 중첩이 화면에서 그럴듯해도 parser가 element를 자동 닫거나 재배치해 CSS·event·form 관계가 달라질 수 있습니다.",
      explanations: [
        "HTML parser는 p 안 block element가 시작되면 p를 자동 종료하거나 table 안 잘못된 node를 다른 위치로 옮기는 foster parenting 같은 규칙을 적용합니다. 단순 stack 예상과 실제 DOM이 달라집니다.",
        "browser가 닫는 tag를 일부 생략할 수 있게 허용하더라도 학습·협업 code에서는 명시 end tag와 일관된 formatting이 오류를 줄입니다. minifier가 spec에 따라 생략하는 것은 별도 build 단계입니다.",
        "interactive content를 잘못 중첩해 button 안 button, a 안 복잡 interactive를 만들면 parser·keyboard·event behavior가 예측하기 어렵고 접근성 규칙을 위반합니다. native element content model을 확인합니다.",
        "HTML validator는 syntax·content model 오류를 찾지만 사용자 task가 가능한지·heading 이름이 좋은지·contrast가 충분한지 모두 증명하지 않습니다. 자동 검사와 keyboard/screen reader 수동 검증을 결합합니다.",
      ],
      concepts: [
        { term: "error recovery", definition: "HTML parser가 잘못되거나 불완전한 markup에서도 정해진 규칙으로 DOM tree 생성을 계속하는 처리입니다.", detail: ["오류가 없다는 뜻이 아닙니다.", "source와 DOM 차이를 만들 수 있습니다."] },
        { term: "content model", definition: "각 HTML element가 어떤 child·text·interactive content를 허용하는지 정의한 구조 규칙입니다.", detail: ["semantic·parser·accessibility behavior와 연결됩니다.", "부모/자식 tag만 외우는 것보다 역할을 이해합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "CSS child selector·event.currentTarget·form 제출 대상이 source에서 예상한 tree와 다르다.", likelyCause: "잘못된 nesting을 parser가 자동 복구해 실제 DOM parent/child가 변경됐습니다.", checks: ["Elements에서 실제 parent chain을 확인합니다.", "HTML validator 첫 오류부터 수정합니다.", "DOM을 변경하는 script 전후 snapshot을 비교합니다."], fix: "content model에 맞게 source nesting을 고치고 복구에 의존하는 selector·event 코드를 제거합니다.", prevention: "template별 HTML validation·DOM integration test를 둡니다." },
      ],
    },
    {
      id: "semantic-accessible-document",
      title: "최소 문서도 title·language·heading·landmark로 독립적으로 탐색 가능해야 합니다",
      lead: "중간 페이지 하나만 열어도 무엇을 하는 문서인지 이름과 main content 구조를 알 수 있어야 합니다.",
      explanations: [
        "한 페이지에 대표 h1을 두고 하위 section heading을 논리적으로 배치합니다. heading level은 글자 크기를 위한 도구가 아니며 CSS로 style합니다. level을 건너뛴 모든 경우가 무조건 오류는 아니지만 outline 관계를 독자가 이해할 수 있어야 합니다.",
        "header·nav·main·aside·footer 같은 semantic region은 screen reader landmark navigation과 구조 이해를 돕습니다. native HTML landmark가 있으면 같은 role을 중복 추가하지 않습니다. 같은 종류 nav가 여러 개면 aria-label/labelledby로 구분합니다.",
        "main은 페이지의 주 콘텐츠를 표시하고 반복 header/nav에서 skip할 수 있게 합니다. 문서에 여러 main을 동시에 노출하지 않습니다. SPA route 전환 시 focus와 document title도 갱신합니다.",
        "HTML source에 secret을 넣으면 CSS로 숨겨도 client에게 전달됩니다. authorization은 server에서 수행하고 허용된 data만 markup에 포함합니다. hidden input도 보안 저장소가 아닙니다.",
      ],
      concepts: [
        { term: "landmark", definition: "페이지의 header/navigation/main/complementary/footer 등 주요 region을 보조기술이 빠르게 탐색하도록 제공하는 구조입니다.", detail: ["native semantic element가 implicit role을 제공합니다.", "여러 같은 landmark는 이름을 구분합니다."] },
        { term: "document outline", definition: "heading과 section 관계로 사용자가 문서 주제와 하위 내용을 파악하는 구조적 개요입니다.", detail: ["heading을 시각 크기로만 선택하지 않습니다.", "중간 URL에서 읽어도 문맥을 제공합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "screen reader landmark 목록에 main이 없거나 navigation이 여러 개 모두 '탐색'으로만 보인다.", likelyCause: "semantic element를 쓰지 않았거나 같은 landmark에 구분 가능한 accessible name이 없습니다.", checks: ["browser accessibility tree·landmark 목록을 확인합니다.", "main/nav/header/footer element와 label을 봅니다.", "중복 role과 숨김 상태를 확인합니다."], fix: "native landmark element를 사용하고 같은 종류가 여러 개면 목적을 설명하는 label을 제공합니다.", prevention: "keyboard skip link·landmark·heading 자동/수동 접근성 검사를 둡니다." },
      ],
      comparisons: [
        { title: "문서 구조를 어떻게 표시할까요?", options: [
          { name: "semantic HTML", chooseWhen: "표준 element가 content 역할과 behavior를 이미 표현할 때", avoidWhen: "정말 대응 element가 없는 custom widget state만 표현할 때", tradeoffs: ["browser·접근성 기본 의미와 behavior를 얻습니다.", "content model을 배워야 합니다.", "style은 자유롭게 CSS로 바꿀 수 있습니다."] },
          { name: "div/span + ARIA", chooseWhen: "native element로 표현할 수 없는 보완 의미가 있고 ARIA pattern을 완전히 구현할 때", avoidWhen: "button·link·nav·main 등 native 대안이 있을 때", tradeoffs: ["추가 의미를 표현할 수 있습니다.", "keyboard·state·focus behavior를 직접 구현해야 합니다.", "잘못된 ARIA는 의미를 악화시킬 수 있습니다."] },
        ] },
      ],
      expertNotes: ["HTML parser의 insertion mode·custom element upgrade·script blocking은 performance와 component hydration에 연결되지만 이 세션에서는 source→DOM 기본 pipeline을 먼저 고정합니다.", "SSR·SPA에서도 route별 unique title·lang 변화·main focus·landmark를 관리해 client navigation이 문서 탐색 의미를 잃지 않게 합니다."],
    },
  ],
  lab: {
    title: "접근 가능한 단일 학습 노트 문서",
    scenario: "CSS와 JavaScript 없이도 제목·목차·본문·관련 정보·footer가 의미 있게 읽히는 한 페이지 학습 노트를 만들고 DOM·접근성 tree를 검수합니다.",
    setup: ["study-note.html을 UTF-8로 만듭니다.", "현대 browser와 DevTools, HTML validator, keyboard만 사용합니다.", "실제 개인정보·secret을 넣지 않습니다."],
    steps: ["doctype·html lang=ko·charset·viewport·unique title을 작성합니다.", "body를 header, nav(문서 목차), main, aside(관련 자료), footer로 구성합니다.", "main에 h1 하나와 최소 세 section/h2를 논리적으로 배치합니다.", "각 목차 link가 section id로 이동하게 하고 id를 unique하게 만듭니다.", "source와 Elements DOM tree를 비교하고 parent/child/sibling을 그림으로 기록합니다.", "document.compatMode·title·lang을 console에서 확인합니다.", "accessibility tree에서 landmark·heading 이름과 순서를 확인합니다.", "doctype·lang·end tag를 하나씩 일부러 깨뜨린 복사본에서 validator와 DOM recovery를 기록합니다.", "comment·hidden content에 민감정보가 없음을 확인합니다."],
    expectedResult: ["document.compatMode가 CSS1Compat입니다.", "한글이 UTF-8로 깨지지 않고 title과 h1이 목적을 설명합니다.", "CSS를 끄거나 적용하지 않아도 heading·목차·main 순서로 읽힙니다.", "keyboard와 screen reader landmark 목록에서 major region을 찾을 수 있습니다.", "validator 오류 없이 source 의도와 DOM tree가 일치합니다.", "중간 section URL을 열어도 heading 문맥이 이해됩니다."],
    cleanup: ["실패 실험 복사본만 삭제하고 정상 study-note.html은 다음 CSS 세션에서 재사용합니다."],
    extensions: ["여러 언어 문장을 lang attribute로 구분합니다.", "skip link를 추가해 main으로 이동합니다.", "DOM tree를 손으로 JSON-like 구조로 표현합니다.", "SSR page와 client route 전환에서 title/focus 변화를 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 ex01_html.html을 한국어 학습 문서로 다시 작성하세요.", requirements: ["doctype·lang=ko·charset·viewport·title을 넣습니다.", "body에 h1·p·main landmark를 추가합니다.", "각 tag·element·attribute·text node를 표로 구분합니다.", "DevTools에서 DOM tree를 캡처하지 않고 글로 설명합니다."], hints: ["title과 h1의 위치·용도가 다릅니다.", "주석은 화면에 안 보여도 source에 남습니다."], expectedOutcome: "첫 문서 구조를 이유와 함께 설명하고 browser에서 확인합니다.", solutionOutline: ["원본 주석의 구조 설명을 읽습니다.", "최소 semantic page를 작성합니다.", "source/DOM/accessibility tree를 비교합니다."] },
    { difficulty: "응용", prompt: "고장 난 HTML source를 복구 의존 없이 수정하세요.", requirements: ["doctype 누락·head 안 body content·p/div 잘못 중첩·일반 self-closing tag·중복 id를 포함한 fixture를 만듭니다.", "View Source와 Elements 차이를 기록합니다.", "validator 첫 오류부터 순서대로 수정합니다.", "수정 전후 compatMode·DOM·heading/landmark를 비교합니다."], hints: ["browser가 보여 준다는 사실은 valid하다는 뜻이 아닙니다.", "한 오류가 뒤쪽 많은 parser 오류를 만들 수 있습니다."], expectedOutcome: "HTML parser recovery를 관찰하고 명시적 올바른 source로 되돌립니다." },
    { difficulty: "설계", prompt: "SSR·SPA 공통 document shell 규칙을 설계하세요.", requirements: ["doctype·charset·viewport·route별 title·description·lang 정책을 정합니다.", "header/nav/main/footer와 skip link·focus 이동을 설계합니다.", "hydration 전후 DOM 일치와 no-JS content를 검토합니다.", "CSP·secret 비노출·canonical/OG metadata 책임을 분리합니다.", "HTML validation·accessibility tree·route integration test를 CI에 정의합니다."], hints: ["component 이름만 semantic element를 보장하지 않습니다.", "client route 전환은 새 문서 load와 다르게 title/focus를 직접 갱신해야 합니다."], expectedOutcome: "한 파일 구조를 production 문서 shell·접근성·보안·검증 정책으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "tag와 element는 같은 말인가요?", answer: "tag는 source의 시작/끝 표기이고 element는 parser가 만든 의미 단위와 DOM 객체를 가리킵니다." },
    { question: "HTML source와 DOM이 왜 다를 수 있나요?", answer: "parser가 생략 element를 만들고 잘못된 nesting을 error recovery하며 JavaScript도 현재 DOM을 바꿀 수 있기 때문입니다." },
    { question: "doctype의 역할은 HTML version library를 load하는 것인가요?", answer: "아닙니다. 현대 문서를 standards mode로 해석하도록 trigger하는 선언입니다." },
    { question: "lang은 화면에 보이지 않는데 왜 필요한가요?", answer: "screen reader 발음·번역·spellcheck·검색 등 문서 언어 해석에 사용됩니다." },
    { question: "meta charset=False처럼 attribute 값을 써도 되나요?", answer: "charset은 encoding 이름을 값으로 갖습니다. boolean attribute와 일반 value attribute의 의미를 구분해야 합니다." },
    { question: "<div />는 HTML에서 div를 self-closing하나요?", answer: "아닙니다. div는 void element가 아니므로 명시 </div>가 필요합니다." },
    { question: "HTML comment에 API key를 넣으면 안전한가요?", answer: "아닙니다. client에게 전송되어 View Source·DevTools에서 볼 수 있습니다." },
    { question: "validator 통과만으로 접근 가능한 페이지인가요?", answer: "아닙니다. syntax 외 heading 이름·keyboard·focus·landmark·task 수행을 자동/수동으로 검증해야 합니다." },
  ],
  completionChecklist: [
    "HTML markup·CSS presentation·JavaScript behavior의 기본 책임을 구분할 수 있다.",
    "bytes→문자→token→DOM→layout/paint 흐름을 설명할 수 있다.",
    "doctype·standards/quirks mode를 확인할 수 있다.",
    "html lang·head charset/title/viewport·body 역할을 설명할 수 있다.",
    "tag·element·attribute·text/comment·void element를 구분할 수 있다.",
    "View Source·DOM·accessibility tree를 비교해 parser recovery를 진단할 수 있다.",
    "heading·landmark로 CSS 없이도 탐색 가능한 문서를 만들 수 있다.",
    "client HTML에 secret을 넣지 않고 validator·접근성 test를 적용할 수 있다.",
  ],
  nextSessions: ["html-02-text-block-inline"],
  sources: [
    { id: "web-html-first-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day01/ex01_html.html", usedFor: ["HTML/CSS/JS 책임", "HyperText·Markup", "element·empty tag·attribute", "doctype·html·head·body", "metadata"], evidence: "원본 첫 문서의 전체 주석과 실제 doctype/head/body source를 감사하고 현재 표준 용어·DOM·접근성 설명으로 확장했습니다." },
    { id: "web-index-jsp-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/index.jsp", usedFor: ["server template의 최종 HTML shell", "doctype·head·body", "title·h1·link"], evidence: "JSP directive 뒤 browser에 전달되는 HTML document shell을 비교해 source 생성 계층과 최종 HTML 구조를 연결했습니다." },
    { id: "whatwg-semantics", repository: "WHATWG HTML Standard", path: "multipage/semantics.html", publicUrl: "https://html.spec.whatwg.org/multipage/semantics.html", usedFor: ["document element", "lang", "head metadata", "title", "body·semantic element"], evidence: "2026-07-11 기준 living standard의 document semantics를 root language와 metadata 설명의 기준으로 확인했습니다." },
    { id: "whatwg-syntax", repository: "WHATWG HTML Standard", path: "multipage/syntax.html", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html", usedFor: ["doctype", "tokenization/tree source", "tag omission", "HTML syntax"], evidence: "2026-07-11 기준 HTML syntax와 parser가 source에서 tree를 구성하는 규칙을 확인했습니다." },
    { id: "wai-page-structure", repository: "W3C Web Accessibility Initiative", path: "tutorials/page-structure", publicUrl: "https://www.w3.org/WAI/tutorials/page-structure/", usedFor: ["heading", "landmark", "region", "문서 탐색", "정보와 관계"], evidence: "W3C WAI page structure guidance를 semantic heading·landmark·독립 문서 탐색 설명에 반영했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["링크·URL은 html-03, image/media는 html-04, heading/text content는 html-02에서 element별로 확장합니다.", "parser insertion mode·accessibility tree·SPA document shell·client secret 경계는 원본 첫 문서를 전문가 수준 mental model로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;
