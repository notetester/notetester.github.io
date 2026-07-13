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

(session.chapters as DetailedSession["chapters"]).push(
  {
    id: "dom-node-taxonomy-and-collections",
    title: "DOM은 화면 그림이 아니라 서로 다른 node type과 관계를 가진 살아 있는 tree입니다",
    lead: "Elements panel에서 element만 보면 indentation text·comment·document type을 놓칩니다. Node와 Element API, 정적 NodeList와 live HTMLCollection을 구분해야 mutation 뒤 결과를 정확히 예측할 수 있습니다.",
    explanations: [
      "Document는 tree의 소유자이고 documentElement는 html element입니다. html 아래 head와 body가 있고 각 element 사이의 줄바꿈·들여쓰기도 Text node가 될 수 있습니다. 주석은 Comment node이며 화면 box가 없다고 DOM에서 사라지는 것은 아닙니다. nodeType·nodeName·parentNode·childNodes는 모든 node를, tagName·children·firstElementChild는 element 중심 관계를 관찰합니다.",
      "childNodes는 Text와 Comment까지 포함하지만 children은 Element만 포함합니다. 따라서 `firstChild`가 줄바꿈 Text인 문서에서 곧바로 classList를 읽으면 실패할 수 있습니다. 구조를 찾는 목적이면 firstElementChild·children·querySelector를, 정확한 parser 산출물 감사이면 childNodes와 nodeType을 사용합니다.",
      "querySelectorAll이 돌려주는 NodeList는 호출 시점의 정적 결과인 반면 getElementsByTagName·children 같은 HTMLCollection은 이후 mutation을 반영하는 live collection입니다. live collection을 순회하면서 child를 추가·삭제하면 length와 index가 즉시 변하므로 snapshot이 필요할 때 `Array.from(collection)`으로 고정합니다.",
      "DOM 순서는 CSS의 시각적 재배치와 다를 수 있습니다. flex `order`, grid placement, absolute positioning으로 화면 순서를 바꾸더라도 keyboard·screen reader·copy 순서는 보통 document tree를 따릅니다. 정보와 interaction 순서는 source DOM에서 먼저 올바르게 만들고 시각 재배치는 보조로 사용합니다.",
    ],
    concepts: [
      { term: "Node와 Element", definition: "Node는 Document·DocumentType·Element·Text·Comment 등을 아우르는 DOM tree 기본 interface이고 Element는 tag와 attribute를 갖는 node 종류입니다.", detail: ["모든 Element는 Node이지만 모든 Node가 Element는 아닙니다.", "API가 어떤 종류를 반환하는지 확인해야 null·property 오류를 줄입니다."] },
      { term: "live collection", definition: "원본 DOM이 바뀌면 별도 재조회 없이 현재 구성과 length가 달라지는 collection입니다.", detail: ["HTMLCollection이 대표적입니다.", "mutation 중 순회는 snapshot 또는 역순 처리가 안전합니다."] },
    ],
    codeExamples: [
      {
        id: "dom-node-kinds-and-live-collections",
        title: "Text·Comment·Element와 정적·live collection을 실제 mutation으로 구분",
        language: "html",
        filename: "dom-node-kinds.html",
        purpose: "같은 main에서 childNodes와 children의 차이, querySelectorAll과 getElementsByTagName의 mutation 반영 차이를 브라우저가 출력한 고정 문자열로 확인합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>DOM 노드 종류</title>\n</head>\n<body>\n  <main id=\"note\">\n    <!-- 학습 메모 -->\n    <h1>DOM 노드 구분</h1>\n    <p>첫 문단</p>\n  </main>\n  <pre id=\"result\"></pre>\n  <script>\n    const main = document.querySelector(\"#note\");\n    const staticParagraphs = main.querySelectorAll(\"p\");\n    const liveParagraphs = main.getElementsByTagName(\"p\");\n    const added = document.createElement(\"p\");\n    added.textContent = \"추가 문단\";\n    main.append(added);\n\n    const textCount = [...main.childNodes]\n      .filter((node) => node.nodeType === Node.TEXT_NODE).length;\n    const commentCount = [...main.childNodes]\n      .filter((node) => node.nodeType === Node.COMMENT_NODE).length;\n    const lines = [\n      `childNodes=${main.childNodes.length}`,\n      `children=${main.children.length}`,\n      `textNodes=${textCount}`,\n      `comments=${commentCount}`,\n      `firstElement=${main.firstElementChild.tagName}`,\n      `staticParagraphs=${staticParagraphs.length}`,\n      `liveParagraphs=${liveParagraphs.length}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-13", explanation: "표준 문서 안 main에 indentation Text, 한 Comment, h1과 p Element를 둡니다. 결과 pre는 main 밖이라 관찰 대상 collection에 섞이지 않습니다." },
          { lines: "14-20", explanation: "mutation 전 정적 NodeList와 live HTMLCollection을 얻은 뒤 새 p를 생성해 append합니다." },
          { lines: "22-25", explanation: "childNodes에서 nodeType 상수로 Text와 Comment를 세어 element-only API와 비교합니다." },
          { lines: "26-35", explanation: "전체 node 수, element 수, 첫 element, mutation 전후 collection 길이를 newline으로 고정해 화면의 pre에 기록합니다." },
          { lines: "36-38", explanation: "script와 문서를 닫습니다. 이 출력은 console formatter가 아니라 plain text라 브라우저별 객체 표현 차이가 없습니다." },
        ],
        run: { environment: ["Chromium·Firefox·Safari 계열 현대 browser", "JavaScript 활성화", "network 불필요"], command: "dom-node-kinds.html을 열고 #result의 일곱 줄을 확인" },
        output: { value: "childNodes=8\nchildren=3\ntextNodes=4\ncomments=1\nfirstElement=H1\nstaticParagraphs=1\nliveParagraphs=2", explanation: ["append된 p까지 element child는 세 개지만 indentation Text와 Comment까지 세면 childNodes는 여덟 개입니다.", "정적 NodeList는 mutation 전 p 하나를 유지하고 live HTMLCollection은 두 개로 갱신됩니다.", "tagName은 HTML DOM에서 대문자 H1로 직렬화됩니다."] },
        experiments: [
          { change: "`main.firstChild.tagName`을 출력합니다.", prediction: "firstChild는 indentation Text이므로 tagName이 undefined입니다.", result: "구조 element가 필요할 때 firstElementChild를 선택해야 합니다." },
          { change: "liveParagraphs를 앞에서부터 순회하며 각 p를 remove합니다.", prediction: "제거 즉시 index가 당겨져 일부 node를 건너뛸 수 있습니다.", result: "Array.from으로 snapshot을 만들거나 while(collection.length) 같은 명시적 전략을 사용합니다." },
        ],
        sourceRefs: ["dom-standard", "mdn-dom-guide", "whatwg-dom-conformance"],
      },
    ],
    diagnostics: [
      { symptom: "첫 child에 classList를 적용했는데 undefined 오류가 나거나 예상하지 않은 공백 node가 선택된다.", likelyCause: "firstChild·childNodes가 indentation Text까지 반환한다는 사실을 element-only API처럼 가정했습니다.", checks: ["nodeType과 nodeName을 출력합니다.", "firstChild와 firstElementChild를 비교합니다.", "View Source의 줄바꿈·공백을 확인합니다."], fix: "element 구조가 목적이면 firstElementChild·children·querySelector를 사용하고 Text가 목적이면 nodeType을 분기합니다.", prevention: "DOM API wrapper와 test fixture에 Text·Comment가 섞인 문서를 포함합니다." },
    ],
    comparisons: [{ title: "현재 DOM 집합을 어떤 collection으로 보관할까요?", options: [
      { name: "정적 NodeList", chooseWhen: "조회 시점 snapshot을 순회·비교할 때", avoidWhen: "이후 mutation을 자동 반영해야 할 때", tradeoffs: ["순회 중 DOM 변경에도 대상 집합이 안정적입니다.", "최신 상태가 필요하면 다시 조회해야 합니다."] },
      { name: "live HTMLCollection", chooseWhen: "현재 element children·tag 집합을 즉시 반영해야 할 때", avoidWhen: "순회 중 같은 collection을 mutation할 때", tradeoffs: ["자동으로 최신 DOM을 반영합니다.", "length/index가 도중에 변해 디버깅이 어려울 수 있습니다."] },
    ] }],
    expertNotes: ["대규모 subtree에서 반복 query와 layout-dependent property를 섞으면 style/layout flush 비용이 커질 수 있습니다. DOM 조회 결과를 필요한 scope에서 재사용하되 live collection의 최신성 의미를 명시합니다.", "Accessibility tree는 DOM을 그대로 복사하지 않습니다. CSS visibility, native semantics, ARIA, accessible name 계산을 반영하므로 DOM tree와 별도로 브라우저 도구에서 확인합니다."],
  },
  {
    id: "safe-dom-construction-and-mutation",
    title: "DOM 변경은 문자열 HTML 삽입이 아니라 신뢰 경계·의미·focus를 보존하는 작업입니다",
    lead: "사용자 문자열을 화면에 보여 주는 단순 요구도 innerHTML을 선택하는 순간 HTML parser와 scriptable URL·event attribute를 함께 허용할 수 있습니다. plain text와 제한된 rich content를 다른 pipeline으로 다룹니다.",
    explanations: [
      "textContent는 문자열을 Text node로 넣으므로 `<strong>` 같은 문자가 markup으로 해석되지 않습니다. 사용자 이름·검색어·오류 메시지처럼 markup이 필요 없는 값의 기본 선택입니다. `innerHTML`은 HTML fragment parser를 호출하므로 입력이 신뢰되지 않으면 XSS sink가 됩니다.",
      "제한된 rich text가 정말 필요하면 검증된 sanitizer와 작은 allowlist, URL scheme·origin 정책, Trusted Types 같은 방어를 application 경계에서 설계합니다. 단순 regex로 tag를 지우는 방식은 entity·malformed markup·namespace·URL 우회를 모두 처리하지 못합니다.",
      "createElement·setAttribute·classList·append로 구조를 만들면 code review에서 element와 data 경계를 볼 수 있습니다. 그래도 `href`, `src`, `style`, event handler 같은 속성은 별도 정책이 필요합니다. 안전한 DOM API라는 이름이 business authorization이나 URL 검증을 대신하지 않습니다.",
      "subtree를 통째로 교체하면 현재 focus, selection, media 재생 상태와 event listener가 사라질 수 있습니다. stable key와 최소 mutation을 사용하고 사용자 action 뒤 focus가 합리적인 위치에 남는지 keyboard로 검증합니다.",
    ],
    concepts: [
      { term: "HTML injection sink", definition: "문자열을 HTML·script·URL 문맥으로 해석해 공격자가 DOM 구조나 실행 경로를 바꿀 수 있는 API 지점입니다.", detail: ["innerHTML·insertAdjacentHTML 등이 대표적입니다.", "입력 검증과 출력 문맥 방어가 함께 필요합니다."] },
      { term: "textContent", definition: "node의 descendant text를 읽거나 문자열을 Text node로 교체하는 DOM property입니다.", detail: ["markup 문자를 literal text로 다룹니다.", "사용자에게 보이는 line break·layout은 CSS와 element 구조가 결정합니다."] },
    ],
    codeExamples: [
      {
        id: "safe-textcontent-user-label",
        title: "공격처럼 보이는 문자열을 실행 가능한 markup이 아닌 Text node로 출력",
        language: "html",
        filename: "safe-user-label.html",
        purpose: "신뢰하지 않는 plain text를 textContent에 넣었을 때 element가 생성되지 않고 원문이 그대로 남는 것을 DOM query로 관찰합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>안전한 텍스트 출력</title>\n</head>\n<body>\n  <main>\n    <h1>사용자 표시 이름</h1>\n    <p id=\"label\"></p>\n    <pre id=\"result\"></pre>\n  </main>\n  <script>\n    const untrusted = '<img src=x onerror=alert(1)><strong>관리자</strong>';\n    const label = document.querySelector(\"#label\");\n    label.textContent = untrusted;\n\n    const lines = [\n      `text=${label.textContent}`,\n      `elementChildren=${label.children.length}`,\n      `containsImage=${label.querySelector(\"img\") !== null}`,\n      `containsStrong=${label.querySelector(\"strong\") !== null}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-11", explanation: "표준 문서와 사용자 표시 영역, 기계적으로 확인할 result 영역을 분리합니다." },
          { lines: "12-15", explanation: "event attribute와 strong처럼 보이는 신뢰하지 않는 문자열을 textContent로 할당합니다. parser를 호출하지 않고 Text node 하나를 만듭니다." },
          { lines: "17-23", explanation: "보이는 원문과 element child 수, img·strong selector 결과를 한 문자열로 기록합니다." },
          { lines: "24-27", explanation: "문서를 닫습니다. alert가 실행되지 않는다는 소극적 주장 대신 생성 element가 0이라는 DOM 결과를 검증합니다." },
        ],
        run: { environment: ["현대 browser", "JavaScript 활성화", "network 불필요"], command: "safe-user-label.html을 열고 #result text와 Elements의 #label child를 확인" },
        output: { value: "text=<img src=x onerror=alert(1)><strong>관리자</strong>\nelementChildren=0\ncontainsImage=false\ncontainsStrong=false", explanation: ["꺾쇠와 attribute 문자열이 그대로 text로 보이고 img·strong element는 생성되지 않습니다.", "plain text 요구에서는 sanitizer보다 더 작은 공격 표면인 textContent가 기본입니다.", "rich HTML 요구가 생기면 이 예제를 innerHTML로 바꾸는 대신 별도 allowlist pipeline을 설계해야 합니다."] },
        experiments: [
          { change: "untrusted 값을 정상 사용자 이름 `홍길동`으로 바꿉니다.", prediction: "elementChildren=0과 두 selector false는 유지되고 text만 바뀝니다.", result: "plain text invariant는 입력 내용에 의존하지 않습니다." },
          { change: "label.innerHTML = untrusted로 바꾼 별도 격리 fixture를 검사하되 event 실행은 차단합니다.", prediction: "img와 strong element가 생성됩니다.", result: "같은 문자열도 선택한 DOM sink에 따라 parser 적용 여부가 달라집니다." },
        ],
        sourceRefs: ["dom-standard", "whatwg-parsing-algorithms", "mdn-dom-guide"],
      },
    ],
    diagnostics: [
      { symptom: "댓글·검색어를 출력한 뒤 예상하지 않은 element가 생기거나 event handler가 실행된다.", likelyCause: "plain text를 innerHTML·insertAdjacentHTML 같은 HTML parsing sink에 전달했습니다.", checks: ["입력 source와 DOM sink를 따라갑니다.", "Elements에서 생성된 element·attribute를 확인합니다.", "sanitizer version·allowlist·URL policy와 CSP report를 확인합니다."], fix: "plain text는 textContent로 바꾸고 rich text는 검증된 sanitizer·URL allowlist·Trusted Types 정책을 거칩니다.", prevention: "lint·code review·security test에서 HTML sink 사용을 중앙화하고 malicious fixture를 유지합니다." },
    ],
    expertNotes: ["textContent는 XSS 경계를 줄이지만 Unicode bidi control, confusable identifier, 지나치게 긴 text 같은 display·abuse 문제는 별도 validation이 필요합니다.", "DOM mutation telemetry에 원문 사용자 content를 기록하면 privacy 사고가 됩니다. element id·operation type·error category처럼 최소한의 비식별 정보만 수집합니다."],
  },
  {
    id: "template-fragment-lifecycle-validation",
    title: "template·DocumentFragment·문서 lifecycle을 이해하면 대량 DOM 생성과 검증을 예측 가능하게 만들 수 있습니다",
    lead: "template의 content는 현재 document 화면에 즉시 렌더링되는 child가 아니라 별도 DocumentFragment입니다. clone·bind·append 단계를 나누면 중복 id, event 연결, 성능과 hydration mismatch를 검토할 수 있습니다.",
    explanations: [
      "template element의 markup은 parser가 읽지만 template.content라는 inert DocumentFragment 안에 보관됩니다. cloneNode(true)로 복제한 뒤 data를 textContent로 주입하고 실제 document에 append해야 화면과 document query 대상이 됩니다. template 안 script·resource의 활성화 경계는 종류와 삽입 방식에 따라 달라지므로 신뢰하지 않는 template을 안전하다고 가정하지 않습니다.",
      "DocumentFragment에 여러 node를 모아 한 번 append하면 fragment의 children이 destination으로 이동하고 fragment는 비게 됩니다. 이것이 무조건 단일 layout만 만든다고 단정할 수는 없지만, 반복 DOM 연결과 관찰 가능한 중간 상태를 줄여 update를 transaction처럼 구성하는 데 도움이 됩니다.",
      "defer script는 document parsing과 병렬 fetch 후 document 순서를 지키며 DOMContentLoaded 전에 실행됩니다. module은 기본적으로 defer와 비슷하지만 dependency graph·top-level await가 timing에 영향을 줄 수 있습니다. 단순히 `setTimeout`으로 DOM 준비를 추측하지 말고 script 위치·defer/module 계약 또는 DOMContentLoaded를 사용합니다.",
      "View Source는 server가 보낸 text, Elements는 parser·script 이후 현재 DOM입니다. SSR hydration에서는 server markup과 첫 client render가 일치해야 하며, clock·random·locale·권한 data 차이는 mismatch를 만듭니다. build에서 validator, runtime에서 DOM assertion, 접근성 tree와 keyboard 수동 검사를 각각 맡깁니다.",
    ],
    concepts: [
      { term: "DocumentFragment", definition: "parent가 없는 가벼운 node tree로, append할 때 fragment 자체가 아니라 그 children이 destination으로 이동합니다.", detail: ["template.content가 DocumentFragment입니다.", "완성 전 subtree를 document 밖에서 조립할 수 있습니다."] },
      { term: "DOMContentLoaded", definition: "HTML parsing과 defer/module script 실행이 끝나 DOM을 안전하게 탐색할 수 있음을 알리는 document event입니다.", detail: ["image 등 모든 subresource load 완료를 기다리는 load와 다릅니다.", "async script timing과는 별도입니다."] },
    ],
    codeExamples: [
      {
        id: "template-document-fragment-batch",
        title: "template clone 두 개를 fragment에서 완성한 뒤 main으로 한 번에 이동",
        language: "html",
        filename: "template-fragment.html",
        purpose: "template.content의 inert성, clone별 text 주입, DocumentFragment append 뒤 이동 semantics를 exact DOM count로 확인합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>학습 카드 조립</title>\n</head>\n<body>\n  <main id=\"cards\"><h1>HTML 핵심 카드</h1></main>\n  <template id=\"card-template\">\n    <article class=\"card\"><h2></h2><p></p></article>\n  </template>\n  <pre id=\"result\"></pre>\n  <script>\n    const template = document.querySelector(\"#card-template\");\n    const fragment = document.createDocumentFragment();\n    for (const [title, body] of [[\"DOM\", \"현재 문서 tree\"], [\"접근성\", \"의미와 이름\"]]) {\n      const card = template.content.firstElementChild.cloneNode(true);\n      card.querySelector(\"h2\").textContent = title;\n      card.querySelector(\"p\").textContent = body;\n      fragment.append(card);\n    }\n    const before = fragment.childElementCount;\n    document.querySelector(\"#cards\").append(fragment);\n    const headings = [...document.querySelectorAll(\"#cards article h2\")]\n      .map((heading) => heading.textContent).join(\",\");\n    const lines = [\n      `fragmentBefore=${before}`,\n      `fragmentAfter=${fragment.childElementCount}`,\n      `articles=${document.querySelectorAll(\"#cards article\").length}`,\n      `headings=${headings}`,\n      `templateStill=${template.content.childElementCount}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-12", explanation: "main과 화면에 직접 나타나지 않는 card template, 결과 영역을 선언합니다. template 안에는 id를 두지 않아 clone 뒤 중복 id를 피합니다." },
          { lines: "13-21", explanation: "template의 첫 element를 deep clone하고 각 카드의 text만 textContent로 주입해 detached fragment에 모읍니다." },
          { lines: "22-25", explanation: "append 전 fragment child 수를 저장하고 main에 이동한 뒤 실제 document heading을 DOM 순서로 수집합니다." },
          { lines: "26-33", explanation: "fragment가 비었는지, article 두 개와 heading 순서, 원본 template content가 남았는지를 plain text로 기록합니다." },
          { lines: "34-36", explanation: "script와 문서를 닫습니다. fragment의 이동과 template 원본 보존을 독립적으로 확인할 수 있습니다." },
        ],
        run: { environment: ["현대 browser", "JavaScript 활성화", "network 불필요"], command: "template-fragment.html을 열고 #result와 #cards의 DOM 순서를 확인" },
        output: { value: "fragmentBefore=2\nfragmentAfter=0\narticles=2\nheadings=DOM,접근성\ntemplateStill=1", explanation: ["DocumentFragment의 두 article은 main으로 이동하므로 append 뒤 fragment child 수는 0입니다.", "template.content는 복제 원본이므로 여전히 article 하나를 보유합니다.", "실제 document query에는 template content가 섞이지 않고 main에 삽입된 두 article만 포함됩니다."] },
        experiments: [
          { change: "template article에 고정 id='card'를 추가해 두 번 clone합니다.", prediction: "실제 document에 중복 id가 생겨 getElementById와 label/reference 계약이 모호해집니다.", result: "clone template에는 id를 피하거나 삽입마다 unique id와 참조 attribute를 함께 생성합니다." },
          { change: "두 번째 카드 삽입 전에 fragment를 console에서 펼쳐 둡니다.", prediction: "DevTools lazy object view가 나중 상태를 보일 수 있습니다.", result: "관찰 시점의 원시 count·문자열 snapshot을 남겨 디버깅 ambiguity를 줄입니다." },
        ],
        sourceRefs: ["web-index-jsp-source", "dom-standard", "whatwg-dom-conformance", "whatwg-metadata"],
      },
    ],
    diagnostics: [
      { symptom: "template로 만든 카드가 보이지 않거나 document.querySelector가 template 내부 항목을 찾지 못한다.", likelyCause: "template.content를 clone·append하지 않고 template의 inert content가 현재 document child라고 가정했습니다.", checks: ["template.content.nodeType과 childElementCount를 확인합니다.", "clone이 실제 destination에 append됐는지 봅니다.", "중복 id와 hidden/CSS 상태를 확인합니다."], fix: "template.content에서 필요한 subtree를 clone하고 data를 안전하게 주입한 뒤 명시적 destination에 append합니다.", prevention: "component test에서 삽입 전후 fragment·destination count와 unique id·accessible name을 검증합니다." },
    ],
    comparisons: [{ title: "DOM 준비 시점을 어떻게 보장할까요?", options: [
      { name: "body 끝 script", chooseWhen: "작은 문서에서 앞서 파싱된 DOM만 즉시 사용할 때", avoidWhen: "dependency·cache·module graph가 커져 head resource 관리가 필요할 때", tradeoffs: ["mental model이 단순합니다.", "공통 head resource 정책과 분리될 수 있습니다."] },
      { name: "defer 또는 module", chooseWhen: "head에서 resource를 발견하면서 parser 이후 순서 있는 실행이 필요할 때", avoidWhen: "독립 third-party script가 parsing과 무관하게 즉시 실행돼야 할 때", tradeoffs: ["parsing을 막지 않고 DOM 준비 전후 계약이 명확합니다.", "module dependency와 top-level await timing을 이해해야 합니다."] },
      { name: "DOMContentLoaded listener", chooseWhen: "script가 async·동적 위치 등 여러 경로에서 실행되어 DOM 준비 여부를 분기해야 할 때", avoidWhen: "이미 event가 지난 뒤 listener만 등록할 수 있는 code path에서 readyState 처리가 없을 때", tradeoffs: ["문서 lifecycle을 직접 표현합니다.", "중복 initialization 방지와 already-loaded branch가 필요합니다."] },
    ] }],
    expertNotes: ["SSR template와 client component가 같은 landmark·heading·id를 생성하는지 DOM snapshot과 hydration warning을 함께 봅니다. production warning을 숨기는 방식은 mismatch를 해결하지 않습니다.", "대량 append 성능은 node 수·style selector·layout read/write 교차에 좌우됩니다. fragment 사용만으로 충분하다고 가정하지 말고 Performance trace에서 style/layout/paint와 interaction latency를 측정합니다."],
  },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "childNodes와 children은 무엇이 다른가요?", answer: "childNodes는 Text·Comment 등 모든 child Node를 포함하고 children은 child Element만 포함하는 live HTMLCollection입니다." },
  { question: "querySelectorAll 결과는 DOM mutation 뒤 자동 갱신되나요?", answer: "아닙니다. 일반적으로 호출 시점의 정적 NodeList입니다. getElementsByTagName이나 children 같은 live collection과 구분합니다." },
  { question: "firstChild에 classList가 없을 수 있는 이유는 무엇인가요?", answer: "indentation 줄바꿈이 첫 Text node일 수 있기 때문입니다. 첫 element가 필요하면 firstElementChild를 사용합니다." },
  { question: "사용자 이름을 출력할 때 innerHTML보다 textContent가 기본인 이유는 무엇인가요?", answer: "textContent는 문자열을 HTML로 parsing하지 않고 Text node로 넣어 불필요한 element·event attribute 생성 공격면을 닫기 때문입니다." },
  { question: "template 안 content가 즉시 화면과 document query에 포함되나요?", answer: "아닙니다. template.content라는 inert DocumentFragment에 있고 clone 또는 이동해 실제 document에 append해야 합니다." },
  { question: "DocumentFragment를 append하면 fragment 자체가 DOM element로 남나요?", answer: "아닙니다. fragment의 children이 destination으로 이동하고 fragment는 비게 됩니다." },
  { question: "DOMContentLoaded와 load는 같은 시점인가요?", answer: "아닙니다. DOMContentLoaded는 parsing과 defer/module 실행 완료를 뜻하고 load는 image 등 관련 resource 완료까지 기다립니다." },
);

(session.completionChecklist as string[]).push(
  "Node·Element·Text·Comment·DocumentType의 nodeType과 tree 관계를 구분할 수 있다.",
  "childNodes·children, firstChild·firstElementChild를 목적에 맞게 선택할 수 있다.",
  "정적 NodeList와 live HTMLCollection을 mutation 전후 exact count로 검증할 수 있다.",
  "plain text는 textContent로 출력하고 rich HTML sanitizer·URL policy 책임을 분리할 수 있다.",
  "createElement·classList·append로 DOM 구조와 신뢰하지 않는 data 경계를 드러낼 수 있다.",
  "template.content를 clone해 DocumentFragment에서 조립하고 중복 id를 방지할 수 있다.",
  "script 위치·defer/module·DOMContentLoaded의 lifecycle을 설명하고 source·DOM·접근성 tree를 함께 검증할 수 있다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "dom-standard", repository: "WHATWG DOM Living Standard", path: "dom/", publicUrl: "https://dom.spec.whatwg.org/", usedFor: ["node tree", "Node·Element·Text·Comment", "NodeList·HTMLCollection", "DocumentFragment", "mutation"], evidence: "2026-07-14에 WHATWG DOM의 tree·node interfaces·old-style collections·DocumentFragment와 mutation algorithm 구성을 확인했습니다." },
  { id: "whatwg-parsing-algorithms", repository: "WHATWG HTML Living Standard", path: "multipage/parsing.html", publicUrl: "https://html.spec.whatwg.org/multipage/parsing.html", usedFor: ["HTML fragment parsing", "tree construction", "script와 parser lifecycle", "error recovery"], evidence: "2026-07-14에 HTML parsing과 tree-construction 규칙을 확인해 innerHTML fragment parsing·source/DOM 차이와 lifecycle 설명의 기준으로 사용했습니다." },
  { id: "whatwg-dom-conformance", repository: "WHATWG HTML Living Standard", path: "multipage/dom.html", publicUrl: "https://html.spec.whatwg.org/multipage/dom.html", usedFor: ["HTML document DOM", "content model", "semantics와 DOM", "global attributes"], evidence: "2026-07-14에 HTML 문서가 DOM node tree로 표현되는 규칙과 document conformance 경계를 확인했습니다." },
  { id: "whatwg-metadata", repository: "WHATWG HTML Living Standard", path: "multipage/semantics.html#the-meta-element", publicUrl: "https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element", usedFor: ["head metadata", "charset", "title과 document shell", "template 생성 문서의 metadata 책임"], evidence: "2026-07-14에 head metadata element 정의와 문서 metadata 배치 규칙을 확인했습니다." },
  { id: "mdn-dom-guide", repository: "MDN Web Docs", path: "en-US/docs/Web/API/Document_Object_Model", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model", usedFor: ["DOM 입문 mental model", "document·node API", "DOM 생성·조작", "browser 실습 연결"], evidence: "2026-07-14에 MDN의 DOM 소개와 주요 interface·node 생성/조작 학습 경로를 WHATWG normative source의 실습 보조 자료로 확인했습니다." },
);

export default session;
