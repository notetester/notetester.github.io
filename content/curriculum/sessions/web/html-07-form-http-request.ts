import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["html-07-form-http-request"],
  slug: "html-07-form-http-request",
  courseId: "web",
  moduleId: "01-html-document-forms",
  order: 7,
  title: "form 제출이 HTTP 요청 파라미터가 되는 과정",
  subtitle: "input을 배치하는 데서 멈추지 않고 submitter 선택→entry list 구성→encoding→HTTP 요청→Servlet parameter parsing→안전한 응답까지 전송 pipeline을 추적합니다.",
  level: "중급",
  estimatedMinutes: 175,
  coreQuestion: "사용자가 submit을 누른 순간 어떤 control만 name/value entry가 되고, GET·POST 요청의 어느 위치와 encoding으로 전달되며, 서버는 이를 어떻게 검증해 안전하게 사용해야 할까요?",
  summary: "원본 form 주석과 로그인·회원가입 예제, Jakarta Servlet의 getParameter 코드를 하나의 왕복 흐름으로 연결합니다. action·method·enctype, successful controls, name/id/value, submitter, GET query와 POST content, application/x-www-form-urlencoded, multipart/form-data, repeated name, disabled/readonly, character encoding, PRG를 다룹니다. 동시에 'GET은 header에 담긴다', '4096 byte 고정', 'POST는 URL에 안 보여서 안전하다', 'GET보다 느리다' 같은 과도한 단순화를 HTTP semantics에 맞게 교정하고, server validation·CSRF·XSS·secret·log/cache/history 경계를 진단합니다.",
  objectives: [
    "form의 action·method·enctype·submitter가 최종 요청을 어떻게 결정하는지 단계별로 설명할 수 있다.",
    "id와 name의 역할을 구분하고 어떤 form control이 entry list에 포함되거나 제외되는지 예측할 수 있다.",
    "GET query와 POST request content를 HTTP 안전성·멱등성·cache/linkability 관점에서 선택할 수 있다.",
    "URL-encoded repeated name을 Servlet의 String·String[] parameter API로 안전하게 읽을 수 있다.",
    "request encoding 설정 시점과 response content type/encoding 순서를 설명하고 한글 깨짐을 진단할 수 있다.",
    "POST를 보안 기능으로 오해하지 않고 HTTPS·server validation·authorization·CSRF·output escaping을 함께 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "표의 행·열·머리글과 셀 병합을 데이터로 읽기", reason: "앞 세션까지 semantic structure와 name/relationship 검증을 익혔으므로 이제 사용자가 만든 값을 network request로 전달합니다.", sessionSlug: "html-06-table-semantics" },
  ],
  keywords: ["form", "action", "method", "enctype", "GET", "POST", "query string", "form data set", "successful controls", "name", "value", "Servlet parameter", "PRG", "CSRF", "XSS"],
  chapters: [
    {
      id: "form-submission-pipeline",
      title: "form 제출은 control tree를 그대로 보내는 것이 아니라 성공한 control의 entry list를 요청으로 변환합니다",
      lead: "submit event가 허용되면 browser가 submitter와 form owner를 결정하고 name/value entry를 구성한 뒤 action URL·method·enctype에 따라 navigate 또는 request합니다.",
      explanations: [
        "form은 input 값을 단순히 server에 복사하는 상자가 아닙니다. 사용자가 submit button을 활성화하면 constraint validation과 submit event를 거쳐 form data entry list가 구성됩니다. 각 entry는 주로 name과 value이며 file control은 file 정보도 가집니다.",
        "form element의 action은 제출 destination URL, method는 GET 또는 POST 같은 제출 방법, enctype은 POST content serialization을 결정합니다. 속성을 생략하면 현재 document URL과 GET 등 기본값이 적용될 수 있지만, 학습·운영 코드에서는 목적이 드러나게 명시합니다.",
        "어떤 submit button을 눌렀는지도 data와 routing에 영향을 줍니다. submitter 자신의 name/value가 포함될 수 있고 formaction·formmethod·formenctype으로 form 기본값을 override할 수 있습니다. 저장과 미리보기처럼 목적이 다른 button을 하나의 form에 둘 때 사용합니다.",
        "JavaScript form.submit()은 submit event와 constraint validation을 건너뛰는 차이가 있고 requestSubmit()은 실제 submit button 활성화에 가까운 과정을 시작합니다. 무심코 submit()으로 바꾸면 client validation과 event handler가 실행되지 않는 회귀가 생깁니다. 그래도 client validation은 보안 경계가 아니므로 server가 다시 검증합니다.",
      ],
      concepts: [
        { term: "form owner", definition: "control이 제출될 form element입니다. 보통 가장 가까운 조상 form이며 form attribute로 document 내 특정 form ID를 지정할 수도 있습니다.", detail: ["시각적 위치만으로 소속이 결정되는 것은 아닙니다.", "nested form은 유효한 구조가 아닙니다."] },
        { term: "submitter", definition: "제출을 시작한 submit button 또는 image input입니다.", detail: ["자신의 name/value가 entry가 될 수 있습니다.", "formaction·formmethod 등으로 제출 설정을 override할 수 있습니다."] },
        { term: "entry list", definition: "제출 가능한 control에서 구성된 name/value 또는 name/file entry들의 ordered list입니다.", detail: ["모든 DOM input이 포함되는 것이 아닙니다.", "encoding 전에 구성됩니다."], analogy: "화면 전체를 사진으로 보내는 대신 제출 규칙을 통과한 항목만 key-value 송장에 적는 것과 같습니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "JavaScript에서 form.submit()을 호출하자 required 경고와 submit handler가 모두 실행되지 않는다.", likelyCause: "submit() method는 interactive submission과 달리 constraint validation·submit event를 우회합니다.", checks: ["호출 code가 submit()인지 requestSubmit()인지 확인합니다.", "button click과 programmatic 호출을 각각 test합니다.", "server validation이 독립적으로 존재하는지 확인합니다."], fix: "사용자 제출과 같은 흐름이 필요하면 requestSubmit(원하는Button)을 사용하고 server validation을 항상 유지합니다.", prevention: "click, Enter key, requestSubmit, direct HTTP request를 각각 integration test로 고정합니다." },
      ],
    },
    {
      id: "name-id-value-successful-controls",
      title: "id는 document 관계, name은 제출 key이며 value는 control 종류와 현재 상태에서 계산됩니다",
      lead: "label 연결이 되는 것과 server parameter가 생기는 것은 서로 다른 계약입니다.",
      explanations: [
        "id는 document 안에서 element를 식별해 label for, fragment, CSS, JavaScript와 연결합니다. name은 form submission entry의 key입니다. input에 id만 있고 name이 없으면 label과 script는 작동해도 일반 form entry는 만들어지지 않습니다. 반대로 name만 있으면 전송은 되지만 명시적 label 연결과 고유 DOM 식별이 부족할 수 있습니다.",
        "text·password·number 등의 value는 현재 입력값입니다. checkbox와 radio는 checked된 control만 제출되고 value를 생략하면 일반적으로 'on'이 될 수 있으므로 domain 값(예: email, sms)을 명시합니다. select multiple과 같은 name의 여러 checkbox는 name이 반복된 여러 entry를 만듭니다.",
        "disabled control은 focus·editing뿐 아니라 form data entry에서도 제외됩니다. readonly text control은 수정할 수 없지만 제출됩니다. UI에서 금액을 disabled로 보여 준다고 server가 그 값을 신뢰할 수 있는 것은 아닙니다. client HTML은 사용자가 바꿀 수 있으므로 가격·권한은 server source of truth에서 다시 계산합니다.",
        "unchecked checkbox, name 없는 control, disabled control, 선택되지 않은 option, 일반 button은 제출되지 않습니다. hidden input은 화면에 안 보여도 제출될 뿐 secret storage가 아닙니다. DevTools 또는 직접 HTTP client로 누구나 바꿀 수 있으므로 authorization token·가격·role을 신뢰하지 않습니다.",
      ],
      concepts: [
        { term: "name", definition: "form entry와 server parameter를 식별하는 key입니다.", detail: ["같은 name이 여러 번 나타날 수 있습니다.", "빈 name 또는 name 없음은 일반적으로 제출 key를 만들지 못합니다."] },
        { term: "value", definition: "control 종류와 현재 state에 따라 form entry에 들어가는 값입니다.", detail: ["사용자 visible label과 다를 수 있습니다.", "checkbox/radio에는 domain value를 명시합니다."] },
        { term: "successful control", definition: "제출 시점의 상태와 element 규칙을 만족해 form entry에 기여하는 control을 흔히 설명하는 용어입니다.", detail: ["disabled·unchecked·name 없는 control 등은 제외될 수 있습니다.", "실제 기준은 HTML form entry list 구성 algorithm입니다."] },
      ],
      codeExamples: [
        {
          id: "get-form-entry-observer",
          title: "GET form에서 포함·제외·반복되는 entry를 URL로 관찰하기",
          language: "html",
          filename: "search-form.html",
          purpose: "id/name, checked, disabled, readonly, repeated name, submitter가 최종 query에 미치는 영향을 정확히 확인합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>과정 검색</title></head>\n<body>\n  <main>\n    <h1>과정 검색</h1>\n    <form action=\"result.html\" method=\"get\">\n      <label for=\"query\">검색어</label>\n      <input id=\"query\" name=\"q\" value=\"HTML form\">\n\n      <fieldset>\n        <legend>난이도</legend>\n        <label><input type=\"checkbox\" name=\"level\" value=\"basic\" checked> 기초</label>\n        <label><input type=\"checkbox\" name=\"level\" value=\"advanced\" checked> 고급</label>\n        <label><input type=\"checkbox\" name=\"level\" value=\"expert\"> 전문가</label>\n      </fieldset>\n\n      <label>과정 코드 <input name=\"course\" value=\"web-01\" readonly></label>\n      <label>내부 점수 <input name=\"score\" value=\"999\" disabled></label>\n      <input id=\"visual-only\" value=\"name 없음\">\n      <button type=\"submit\" name=\"mode\" value=\"search\">검색</button>\n    </form>\n  </main>\n</body>\n</html>",
          walkthrough: [
            { lines: "6-9", explanation: "label은 id=query와 연결되지만 server key는 name=q입니다. GET이므로 entry가 query component가 됩니다." },
            { lines: "11-16", explanation: "checked된 두 checkbox만 같은 name=level의 반복 entry를 만듭니다. expert는 제외됩니다." },
            { lines: "18-20", explanation: "readonly course는 포함되고 disabled score와 name 없는 visual-only input은 제외됩니다." },
            { lines: "21", explanation: "실제로 활성화한 submit button의 mode=search도 entry에 포함됩니다." },
          ],
          run: { environment: ["UTF-8로 저장", "현대 browser"], command: "search-form.html을 열고 값을 바꾸지 않은 채 검색 button 활성화" },
          output: { value: "이동 URL의 query (percent-encoding 표기 차이는 browser에 따라 보일 수 있음):\nresult.html?q=HTML+form&level=basic&level=advanced&course=web-01&mode=search\n\n포함: q, level 2개, course, mode\n제외: unchecked expert, disabled score, name 없는 visual-only", explanation: ["space는 URL-encoded form encoding에서 +로 표시될 수 있습니다.", "동일 name의 entry 순서는 form tree order를 따릅니다.", "disabled 값이 제출되지 않는다는 사실은 보안 검증이 아니라 UI/form algorithm입니다."] },
          experiments: [
            { change: "course를 readonly에서 disabled로 바꿉니다.", prediction: "course=web-01 entry가 query에서 사라집니다.", result: "readonly는 제출되고 disabled는 제출되지 않습니다." },
            { change: "expert checkbox를 선택하고 advanced를 해제합니다.", prediction: "level=advanced가 사라지고 level=expert가 같은 위치 계열에 추가됩니다.", result: "checkbox는 checked state가 entry 포함 여부를 결정합니다." },
            { change: "검색 button 대신 Enter로 제출하고 다른 submitter도 추가해 비교합니다.", prediction: "implicit submission과 browser/form 구조에 따라 선택된 submitter entry가 달라질 수 있습니다.", result: "server business logic을 button parameter 하나에만 취약하게 의존하지 않고 허용 값과 action을 검증합니다." },
          ],
          sourceRefs: ["web-form-concepts-source", "web-form-basic-source", "whatwg-form-infrastructure"],
        },
      ],
      diagnostics: [
        { symptom: "화면에 값이 있고 label도 작동하지만 server getParameter가 null이다.", likelyCause: "control에 name이 없거나 disabled이거나 form owner 밖에 있어 entry list에 포함되지 않았습니다.", checks: ["Elements에서 name과 disabled를 확인합니다.", "control.form property가 예상 form인지 확인합니다.", "Network request의 Query String/Form Data를 직접 봅니다.", "server가 읽는 key spelling과 대소문자를 비교합니다."], fix: "stable한 name을 부여하고 필요한 값이면 disabled 대신 readonly 또는 별도 server-side source를 사용하며 form association을 바로잡습니다.", prevention: "rendered form name schema와 server DTO/parameter contract를 integration test로 연결합니다." },
      ],
    },
    {
      id: "get-post-http-semantics",
      title: "GET과 POST는 속도·은닉 비교가 아니라 요청 의도와 HTTP semantics로 선택합니다",
      lead: "검색·조회처럼 안전하고 공유 가능한 요청은 GET, server state를 만들거나 바꾸는 처리 제출은 보통 POST를 사용합니다.",
      explanations: [
        "GET form entry는 action URL의 query component로 encoding됩니다. 이를 'HTTP header에 담긴다'고 설명하면 message 구조를 잘못 이해하게 됩니다. request target에 query가 포함되고, proxy/server log·browser history·bookmark·Referer policy 등 여러 곳에 URL이 남을 수 있습니다.",
        "POST form entry는 선택한 enctype으로 request content에 담깁니다. 주소창에 보이지 않을 뿐 network에서 자동 암호화되는 것은 아닙니다. HTTPS가 transport를 보호하고 server authorization·validation·CSRF 방어가 별도로 필요합니다. 비밀번호를 GET query에 넣어서는 안 되며 POST+HTTPS도 log/body capture 정책을 검토합니다.",
        "GET은 safe method로 server state 변경을 의도해서는 안 되고 반복·prefetch·crawler 접근에도 안전해야 합니다. 검색 filter가 URL에 남으면 공유·bookmark·back/forward·cache에 유리합니다. POST는 target resource가 request content를 처리하도록 제출하며 주문 생성·계정 변경 같은 action에 적합합니다.",
        "GET은 4096 byte만, POST는 무제한이라는 고정 규칙은 없습니다. HTTP 표준·browser·server·proxy·framework가 각각 URI와 request body size limit을 가질 수 있습니다. RFC 9110은 senders/recipients가 최소 8000 octet URI를 지원할 것을 권고하지만 application은 실제 infrastructure limit을 문서화하고 414/413 등 실패를 처리해야 합니다.",
        "POST가 GET보다 본질적으로 느리다는 식의 선택도 부정확합니다. network round trip, connection, cache, payload, server work가 성능을 좌우합니다. method는 먼저 semantics와 security/caching 요구로 정하고 측정으로 성능을 다룹니다.",
      ],
      concepts: [
        { term: "safe method", definition: "client가 server state 변경을 요청하는 의미가 없는 HTTP method이며 GET이 대표적입니다.", detail: ["logging 같은 부수 효과는 있을 수 있습니다.", "crawler·prefetch·retry가 호출해도 business mutation이 일어나지 않아야 합니다."] },
        { term: "idempotent", definition: "같은 의도의 요청을 여러 번 적용한 결과가 한 번 적용한 결과와 같은 HTTP property입니다.", detail: ["safe method는 idempotent입니다.", "POST는 일반적으로 idempotent로 정의되지 않지만 application이 idempotency key를 설계할 수 있습니다."] },
        { term: "query component", definition: "URI에서 ? 뒤에 붙어 target resource를 식별·선택하는 data 부분입니다.", detail: ["GET form entry가 여기에 serialization됩니다.", "URL이 기록·공유되는 여러 channel을 고려합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "검색 link를 공유했는데 다른 사람이 같은 filter 결과를 재현하지 못한다.", likelyCause: "조회 조건을 POST body나 client memory에만 두어 URL에 표현하지 않았습니다.", checks: ["request method와 query를 확인합니다.", "refresh/back/bookmark 후 state를 test합니다.", "민감하지 않은 조회 조건인지 확인합니다."], fix: "안전한 검색 조건은 GET query로 모델링하고 canonical parsing/default 규칙을 정의합니다.", prevention: "공유 가능해야 하는 UI state는 URL contract review를 거칩니다." },
        { symptom: "GET /delete?id=7 link가 crawler나 preview tool 접근으로 data를 삭제했다.", likelyCause: "safe GET method에 server state mutation을 구현했습니다.", checks: ["route별 method와 side effect inventory를 만듭니다.", "CSRF·authorization·confirmation을 확인합니다.", "access log에서 automated GET을 찾습니다."], fix: "mutation을 POST/PUT/PATCH/DELETE 등의 적절한 endpoint로 옮기고 CSRF·authorization·idempotency를 설계합니다.", prevention: "GET handler에서 persistent mutation을 금지하는 architecture test와 review rule을 둡니다." },
      ],
      comparisons: [
        { title: "HTML form의 GET과 POST 선택", options: [
          { name: "GET", chooseWhen: "검색·filter·조회처럼 안전하고 URL로 공유·bookmark할 state일 때", avoidWhen: "비밀번호·민감 정보 또는 server state mutation을 제출할 때", tradeoffs: ["URL/history/cache와 잘 결합합니다.", "query가 여러 기록 지점에 노출되고 infrastructure URI limit을 받습니다."] },
          { name: "POST", chooseWhen: "resource 생성·처리·변경처럼 request content를 target이 처리할 때", avoidWhen: "단순 조회 state를 공유 가능한 URL로 만들어야 할 때", tradeoffs: ["body encoding과 큰 payload에 적합합니다.", "그 자체로 암호화·authorization·CSRF 방어를 제공하지 않습니다."] },
        ] },
      ],
    },
    {
      id: "encoding-and-enctype",
      title: "enctype은 entry list를 bytes로 serialization하는 형식이며 file upload와 문자 encoding에 직접 영향을 줍니다",
      lead: "기본 URL-encoded, file용 multipart, 제한적 text/plain을 구분하고 Content-Type과 decoding 계약을 client/server에서 일치시킵니다.",
      explanations: [
        "application/x-www-form-urlencoded는 일반 text form의 기본 encoding입니다. name과 value가 percent-encoding되고 pair가 &로 연결됩니다. space가 +로 표현될 수 있으며 같은 name은 반복 pair로 남습니다. raw string을 직접 split('&')/split('=')하면 encoded delimiter와 repeated key를 잘못 처리하므로 browser/server 표준 parser를 사용합니다.",
        "multipart/form-data는 각 entry를 boundary로 구분하고 file bytes와 filename/content type metadata를 포함할 수 있어 file upload에 사용합니다. form에 file input이 있으면 method=post와 enctype=multipart/form-data를 사용하고 server multipart limit·filename normalization·content sniffing·malware scanning·storage isolation을 설계합니다.",
        "text/plain form encoding은 debug처럼 보이지만 delimiter·newline·interoperability가 모호해 일반 application contract로 부적합합니다. JSON API는 native HTML form enctype가 아니므로 JavaScript가 FormData를 object로 바꿔 fetch할 수 있지만 no-JS fallback, CSRF, Content-Type validation을 별도로 설계합니다.",
        "문자는 document/form encoding에서 bytes가 되고 server가 같은 character set으로 decode해야 합니다. Servlet의 request.setCharacterEncoding은 parameter를 처음 읽기 전에 호출해야 effect가 있습니다. filter나 framework에서 application 전체 UTF-8 policy를 중앙화하는 편이 안전합니다.",
      ],
      concepts: [
        { term: "application/x-www-form-urlencoded", definition: "form name/value entry를 URL query와 유사한 percent-encoded pair sequence로 표현하는 media type입니다.", detail: ["일반 text control의 기본 POST encoding입니다.", "repeated name을 보존할 수 있습니다."] },
        { term: "multipart/form-data", definition: "각 form entry를 boundary로 분리해 text와 file content를 함께 전송하는 media type입니다.", detail: ["file upload에 사용합니다.", "boundary parameter는 browser가 설정하게 둡니다."] },
        { term: "character encoding", definition: "Unicode character와 전송/storage bytes 사이의 mapping 규칙입니다.", detail: ["UTF-8 policy를 client/server에서 맞춥니다.", "parameter parsing 전에 request encoding을 결정해야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "한글 이름이 깨지고 setCharacterEncoding('UTF-8')을 추가해도 고쳐지지 않는다.", likelyCause: "parameter/getReader를 먼저 호출해 body decoding이 끝난 뒤 encoding을 설정했거나 proxy/container/client charset 계약이 다릅니다.", checks: ["encoding 설정과 최초 parameter read 순서를 추적합니다.", "request Content-Type charset과 application encoding policy를 확인합니다.", "GET query와 POST body 문제를 분리합니다.", "raw bytes와 UTF-8 fixture로 재현합니다."], fix: "가장 앞단 filter/framework에서 parameter parsing 전에 UTF-8을 설정하고 response content type도 writer 획득 전에 지정합니다.", prevention: "한글·emoji·combining character를 포함한 request/response integration test를 둡니다." },
        { symptom: "file input이 있는데 server에는 filename text만 오거나 file part가 비어 있다.", likelyCause: "enctype이 기본 URL-encoded이거나 multipart parser/size limit이 구성되지 않았습니다.", checks: ["form method=post와 enctype=multipart/form-data를 확인합니다.", "Network Content-Type boundary를 확인합니다.", "server multipart config와 413/limit log를 봅니다."], fix: "browser가 생성한 multipart Content-Type을 사용하고 server multipart parsing·limit·safe storage를 구성합니다.", prevention: "빈 file, 큰 file, 확장자 위장, Unicode filename, 중단 upload를 security test에 포함합니다." },
      ],
    },
    {
      id: "server-parameter-contract",
      title: "Servlet parameter API는 query와 지원되는 form body를 String/String[] 계약으로 제공하지만 신뢰 경계 밖의 입력입니다",
      lead: "getParameter·getParameterValues·getParameterMap의 shape를 form schema와 맞추고 null·빈 값·중복·parse 오류를 명시적으로 처리합니다.",
      explanations: [
        "원본 Servlet은 username과 userage를 getParameter로 읽습니다. getParameter는 하나의 String을 반환하거나 parameter가 없으면 null일 수 있습니다. 같은 name이 여러 번 오면 getParameterValues가 String[]을 반환하며 getParameter 하나만 호출해 첫 값에 의존하는 behavior는 business rule을 모호하게 만들 수 있습니다.",
        "parameterMap은 Map<String,String[]> 형태로 전체 parameter set을 볼 수 있지만 그대로 domain object에 mass assignment하면 공격자가 role/admin/price 같은 예상치 못한 key를 보낼 수 있습니다. 허용 key를 명시하고 DTO별 parser/validator를 작성합니다.",
        "HTML input type=number도 HTTP에서는 text serialization입니다. server에서 integer/range/unit을 parse하고 실패를 validation error로 돌려야 합니다. null, empty string, whitespace, duplicate scalar, overflow, locale 숫자, negative를 분리합니다.",
        "Servlet source가 request parameter를 HTML string concatenation으로 그대로 출력하면 reflected XSS 위험이 있습니다. output context에 맞는 escaping 또는 template engine의 auto-escape를 사용합니다. request encoding과 output escaping은 다른 문제이며 UTF-8로 설정했다고 script injection이 막히지 않습니다.",
      ],
      concepts: [
        { term: "request parameter", definition: "query string 또는 container가 인식한 form body에서 이름으로 조회할 수 있게 만든 문자열 값 집합입니다.", detail: ["하나의 이름에 여러 값이 있을 수 있습니다.", "HTTP header/attribute/session과 다른 namespace입니다."] },
        { term: "allowlist binding", definition: "server DTO가 기대하는 parameter name과 type만 명시적으로 받아들이는 binding 방식입니다.", detail: ["mass assignment를 줄입니다.", "unknown·duplicate field policy를 정할 수 있습니다."] },
        { term: "output escaping", definition: "untrusted text를 삽입할 HTML text·attribute·URL·JavaScript 등 output context에 맞게 data로 표현하는 처리입니다.", detail: ["input validation과 별개입니다.", "HTML text context escaping을 다른 context에 재사용하면 안 됩니다."] },
      ],
      codeExamples: [
        {
          id: "servlet-safe-parameter-response",
          title: "repeated parameter와 숫자를 검증하고 HTML text로 escape하는 Servlet",
          language: "java",
          filename: "CourseSearchServlet.java",
          purpose: "form name schema를 Servlet API와 연결하고 null·multiple value·parse·output encoding을 안전하게 처리합니다.",
          code: "package example.web;\n\nimport jakarta.servlet.annotation.WebServlet;\nimport jakarta.servlet.http.HttpServlet;\nimport jakarta.servlet.http.HttpServletRequest;\nimport jakarta.servlet.http.HttpServletResponse;\nimport java.io.IOException;\nimport java.util.Arrays;\nimport java.util.Set;\nimport java.util.stream.Collectors;\n\n@WebServlet(\"/course-search\")\npublic class CourseSearchServlet extends HttpServlet {\n  private static final Set<String> ALLOWED_LEVELS = Set.of(\"basic\", \"advanced\", \"expert\");\n\n  @Override\n  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {\n    resp.setContentType(\"text/html; charset=UTF-8\");\n\n    String query = normalize(req.getParameter(\"q\"));\n    String[] rawLevels = req.getParameterValues(\"level\");\n    String levels = rawLevels == null ? \"선택 없음\" : Arrays.stream(rawLevels)\n        .filter(ALLOWED_LEVELS::contains)\n        .distinct()\n        .sorted()\n        .collect(Collectors.joining(\", \"));\n\n    if (query.isEmpty()) {\n      resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);\n      resp.getWriter().print(\"<!doctype html><html lang='ko'><meta charset='utf-8'>\"\n          + \"<title>입력 오류</title><h1>입력 오류</h1><p>검색어를 입력하세요.</p>\");\n      return;\n    }\n\n    resp.getWriter().print(\"<!doctype html><html lang='ko'><meta charset='utf-8'>\"\n        + \"<title>검색 결과</title><h1>검색 결과</h1><p>검색어: \" + escapeHtml(query)\n        + \"</p><p>난이도: \" + escapeHtml(levels) + \"</p>\");\n  }\n\n  private static String normalize(String value) {\n    return value == null ? \"\" : value.strip();\n  }\n\n  private static String escapeHtml(String value) {\n    return value.replace(\"&\", \"&amp;\").replace(\"<\", \"&lt;\")\n        .replace(\">\", \"&gt;\").replace(\"\\\"\", \"&quot;\").replace(\"'\", \"&#39;\");\n  }\n}",
          walkthrough: [
            { lines: "11-13", explanation: "Servlet route와 server가 허용하는 level allowlist를 선언합니다. client option list만 신뢰하지 않습니다." },
            { lines: "17-24", explanation: "response media type/encoding을 writer 전에 설정하고 scalar q와 repeated level을 각각 알맞은 API로 읽습니다." },
            { lines: "26-31", explanation: "빈 query를 400 validation response로 종료합니다. 화면 required를 우회한 direct request도 server에서 거부됩니다." },
            { lines: "33-35", explanation: "정상 응답에서도 request-derived text를 HTML text context에 escape합니다." },
            { lines: "38-44", explanation: "null normalization과 교육용 escape helper를 분리합니다. 운영에서는 검증된 template/encoding library를 context에 맞게 사용합니다." },
          ],
          run: { environment: ["JDK 21+", "Jakarta Servlet 6 compatible container", "application context root가 /app인 예"], command: "curl -i 'http://localhost:8080/app/course-search?q=%3Cscript%3E&level=advanced&level=basic&level=admin'" },
          output: { value: "HTTP/1.1 200\nContent-Type: text/html;charset=UTF-8\n\n화면 text:\n검색 결과\n검색어: <script>\n난이도: advanced, basic\n\npage source의 검색어: &lt;script&gt;\nadmin은 allowlist 밖이므로 제외", explanation: ["화면에는 문자 <script>가 text로 보이지만 source에서는 escaped되어 element로 실행되지 않습니다.", "중복 가능한 level은 배열로 받고 허용 값만 정렬·결합합니다.", "실제 header의 공백/casing은 container에 따라 다를 수 있으나 status·media type·화면 의미는 같습니다."] },
          experiments: [
            { change: "q parameter를 생략해 request합니다.", prediction: "normalize가 빈 문자열을 만들고 400과 '검색어를 입력하세요'를 반환합니다.", result: "client required 없이도 server validation이 작동합니다." },
            { change: "escapeHtml 호출을 제거하고 q=<img src=x onerror=alert(1)>를 보냅니다.", prediction: "browser가 untrusted markup을 element로 해석해 script behavior가 실행될 수 있습니다.", result: "encoding 설정은 XSS defense가 아니며 output context escaping이 필요합니다." },
            { change: "level=basic을 두 번 보냅니다.", prediction: "distinct 때문에 output에는 basic이 한 번만 나타납니다.", result: "중복 field policy는 server contract로 명시해야 합니다." },
          ],
          sourceRefs: ["jsp-servlet-parameter-source", "jakarta-servlet-request", "whatwg-form-infrastructure"],
        },
      ],
      diagnostics: [
        { symptom: "age input을 비웠더니 NumberFormatException 또는 500이 발생한다.", likelyCause: "getParameter 반환의 null/empty/whitespace를 구분하지 않고 즉시 parseInt했습니다.", checks: ["Network payload에 key가 없는지 빈 값인지 봅니다.", "server stack trace의 parse 위치를 찾습니다.", "min/max와 integer domain rule을 확인합니다."], fix: "normalize→required 여부→type parse→range validation 순서로 처리하고 field별 4xx error를 반환합니다.", prevention: "missing, empty, whitespace, non-number, overflow, boundary value fixture를 parameter contract test에 둡니다." },
        { symptom: "username에 HTML을 입력하자 response page에서 tag 또는 script로 실행된다.", likelyCause: "Servlet이 untrusted parameter를 HTML string에 직접 concatenate했습니다.", checks: ["response source에서 < > &가 escaped되었는지 확인합니다.", "삽입 context가 text/attribute/URL/script 중 무엇인지 구분합니다.", "template auto-escape가 disabled되지 않았는지 봅니다."], fix: "context-aware output encoding을 적용하고 가능하면 auto-escaping template를 사용하며 CSP를 defense-in-depth로 구성합니다.", prevention: "XSS payload fixture와 security linter/template policy를 CI에 포함합니다." },
      ],
    },
    {
      id: "security-boundaries",
      title: "form method와 client constraint는 보안 경계가 아니며 모든 요청은 조작·재전송될 수 있습니다",
      lead: "HTTPS, authentication, authorization, validation, CSRF, output encoding, rate limit, audit을 서로 다른 방어층으로 설계합니다.",
      explanations: [
        "사용자는 DevTools로 disabled·hidden·min·pattern을 바꾸거나 curl로 form을 완전히 우회할 수 있습니다. 따라서 role, price, account ID를 hidden input에서 받아 그대로 적용하지 않습니다. authenticated principal과 server database에서 권한·가격을 조회합니다.",
        "HTTPS는 전송 중 URL path/query와 body를 보호하지만 endpoint, browser history, application log, analytics, error report, server storage의 민감 정보 노출을 모두 해결하지 않습니다. password·token·주민번호 같은 data는 최소 수집, GET 금지, logging redaction, retention policy를 적용합니다.",
        "cookie 기반 인증으로 state-changing POST를 받으면 공격 site가 사용자의 browser를 이용해 요청하게 하는 CSRF를 방어해야 합니다. synchronizer token, SameSite cookie, Origin/Referer validation 등 framework가 제공하는 검증된 defense를 사용합니다. CORS와 CSRF는 같은 문제가 아닙니다.",
        "validation은 허용 형식·범위·business rule, authorization은 이 사용자가 이 resource/action을 수행할 권한, escaping은 output parser가 input을 code로 해석하지 않게 하는 책임입니다. 하나로 다른 책임을 대체하지 않습니다.",
      ],
      concepts: [
        { term: "trust boundary", definition: "한쪽의 data와 identity를 검증 없이 다른 권한 영역에서 신뢰해서는 안 되는 경계입니다.", detail: ["browser와 server 사이가 대표적입니다.", "internal service나 database에서도 별도 경계가 있습니다."] },
        { term: "CSRF", definition: "인증된 browser가 공격자의 의도대로 state-changing request를 보내게 하는 공격 유형입니다.", detail: ["cookie가 자동 전송되는 인증에서 특히 중요합니다.", "POST method만 사용한다고 방지되지 않습니다."] },
        { term: "server-side validation", definition: "client를 우회한 모든 request에도 적용되는 형식·범위·business rule 검증입니다.", detail: ["client validation은 UX 보조입니다.", "authorization과 output escaping을 대신하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "disabled price input을 바꿀 수 없는데도 주문 가격 조작 사고가 발생했다.", likelyCause: "server가 client가 제출한 hidden/disabled 대체 값 또는 JSON 가격을 source of truth로 신뢰했습니다.", checks: ["Network request와 server DTO에 price field가 있는지 봅니다.", "order service가 product DB 가격을 다시 조회하는지 확인합니다.", "authorization과 coupon rule을 추적합니다."], fix: "client는 product ID와 quantity만 의도값으로 보내고 server가 권한·현재 가격·할인을 authoritative data에서 계산합니다.", prevention: "tampered price/role/account ID integration test와 server-side invariant를 둡니다." },
      ],
    },
    {
      id: "response-and-post-redirect-get",
      title: "server 응답은 status·Content-Type·redirect를 포함한 계약이며 mutation 후 PRG가 중복 제출을 줄입니다",
      lead: "parameter를 읽는 것만큼 response encoding·error status·재요청 behavior와 사용자 복구 가능성이 중요합니다.",
      explanations: [
        "Servlet에서 response character encoding과 content type은 writer를 얻거나 response가 commit되기 전에 설정합니다. text/html을 보내면 반드시 유효한 HTML과 적절한 escaping을 사용합니다. JSON endpoint라면 application/json과 JSON serializer를 사용하고 HTML string을 섞지 않습니다.",
        "validation error는 보통 4xx 의미와 field별 message, 사용자가 수정할 safe value를 제공합니다. password는 다시 채우지 않고, server exception detail·stack trace·secret을 response에 노출하지 않습니다. success와 error를 모두 screen reader가 발견하도록 heading·focus/live region 전략을 세웁니다.",
        "state-changing POST가 HTML page를 바로 200으로 반환하면 refresh 때 browser가 같은 body를 재전송할 수 있습니다. Post/Redirect/Get pattern은 POST 처리 성공 후 303 See Other 등으로 결과 resource URL에 redirect하고 browser가 GET으로 결과를 표시하게 합니다.",
        "PRG는 double click·network retry·concurrent request를 완전히 막지 않습니다. 결제·주문에는 idempotency key, unique constraint, transaction을 함께 사용합니다. redirect URL에 secret을 넣지 않고 flash message는 session 등 제한된 lifecycle로 전달합니다.",
      ],
      concepts: [
        { term: "PRG", definition: "POST 처리 후 redirect response를 보내고 browser가 GET으로 결과 page를 조회하게 하는 Post/Redirect/Get pattern입니다.", detail: ["refresh 시 form body 재전송을 줄입니다.", "결과 URL을 bookmark할 수 있습니다."] },
        { term: "response commitment", definition: "status와 header를 더 이상 자유롭게 변경하기 어려울 만큼 response가 client로 전송되기 시작한 상태입니다.", detail: ["writer 사용·buffer flush 전에 encoding/content type을 정합니다.", "redirect와 error 처리 순서를 설계합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "가입 완료 page를 새로고침하자 같은 계정 생성 요청이 다시 실행된다.", likelyCause: "POST handler가 완료 HTML을 직접 반환해 browser history에 POST navigation이 남았습니다.", checks: ["Network status/redirect chain을 확인합니다.", "database unique constraint와 idempotency를 봅니다.", "double click·refresh·retry를 재현합니다."], fix: "transaction 성공 후 303 redirect로 결과 GET URL을 반환하고 server invariant로 중복 생성을 막습니다.", prevention: "PRG redirect chain, double submit, retry integration test를 추가합니다." },
      ],
      expertNotes: [
        "HTML form은 GET과 POST를 직접 지원합니다. PUT/PATCH/DELETE API와 연결할 때는 JavaScript fetch 또는 server의 method override convention을 사용하되 CSRF·cache·status semantics를 명확히 합니다.",
        "same-origin navigation과 cross-origin form submission은 가능 범위가 CORS fetch와 다릅니다. 민감한 mutation endpoint는 Origin/CSRF 방어를 적용하고 redirect destination allowlist로 open redirect를 막습니다.",
      ],
    },
    {
      id: "end-to-end-observability",
      title: "form 문제는 DOM state→entry list→Network request→server parse→domain validation→response 순서로 관찰합니다",
      lead: "화면만 반복해서 누르지 않고 각 경계에서 실제 값과 책임을 확인하면 null·encoding·중복·보안 오류의 원인을 빠르게 좁힐 수 있습니다.",
      explanations: [
        "첫째 Elements/Console에서 control의 name, value, checked, disabled, form property를 확인합니다. new FormData(form, submitter)를 지원하는 환경에서는 entry를 관찰하되 실제 GET URL/submit behavior와 차이가 없는지 Network에서 최종 확인합니다.",
        "둘째 Network panel에서 method, request URL/query, Content-Type, payload/Form Data, status, redirect chain, response header/body를 봅니다. password/token을 screenshot이나 issue에 그대로 붙이지 않고 redaction합니다.",
        "셋째 server boundary에서 parameter name·count·encoding·validation outcome을 structured log와 trace ID로 남기되 값 자체는 민감도에 따라 mask합니다. null은 '전송 안 됨', empty, parser failure, authorization reject와 구분합니다.",
        "넷째 automated test는 real rendered form을 제출해 server DTO와 response까지 확인합니다. 단위 test만으로 browser entry construction을 놓치지 않으며, curl direct request로 client constraint 우회도 검증합니다.",
      ],
      concepts: [
        { term: "redirect chain", definition: "초기 request 뒤 3xx response와 Location을 따라 발생한 연속 request 흐름입니다.", detail: ["PRG와 authentication redirect를 진단합니다.", "method가 어떤 단계에서 GET으로 바뀌는지 확인합니다."] },
        { term: "sensitive-data redaction", definition: "log·trace·screenshot에서 password·token·개인정보를 기록하지 않거나 안전한 형태로 가리는 처리입니다.", detail: ["관찰 가능성과 privacy를 함께 설계합니다.", "key 이름만 남기고 value를 제거할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "browser에서는 성공하지만 integration API client에서는 400, 또는 그 반대가 발생한다.", likelyCause: "Content-Type·encoding·repeated key·CSRF cookie/token·redirect follow behavior가 client마다 다릅니다.", checks: ["두 request의 method/URL/header/body를 secret 제거 후 비교합니다.", "redirect와 cookie jar behavior를 확인합니다.", "server parameter parser가 어떤 media type을 지원하는지 봅니다."], fix: "form/API별 media type과 authentication/CSRF contract를 문서화하고 동일 fixture로 contract test합니다.", prevention: "browser E2E와 direct HTTP integration test를 둘 다 유지합니다." },
      ],
    },
  ],
  lab: {
    title: "검색 GET과 가입 POST를 Network에서 추적하고 Servlet contract로 연결하기",
    scenario: "한 페이지에 검색과 가입 form이 있는데 일부 값이 null이고 한글이 깨지며 새로고침 때 가입이 중복됩니다. 브라우저부터 server response까지 단계별 증거로 원인을 분리합니다.",
    setup: ["검색 form은 method=get, 가입 form은 method=post인 UTF-8 page를 준비합니다.", "Jakarta Servlet compatible local container와 DevTools Network Preserve log를 준비합니다.", "실제 개인정보 대신 한글·emoji를 포함한 synthetic fixture를 사용합니다."],
    steps: [
      "각 control의 id·name·value·checked·disabled·readonly·form owner 표를 만듭니다.",
      "검색 form을 제출해 query entry 순서와 repeated key, URL 공유/refresh 결과를 기록합니다.",
      "가입 form을 URL-encoded POST로 제출해 Content-Type과 body, response status를 기록합니다.",
      "Servlet에서 parameter read 전 UTF-8 policy가 적용되는지 확인하고 scalar·array key를 구분합니다.",
      "missing·empty·invalid·duplicate 값을 direct curl로 보내 server validation을 우회 test합니다.",
      "HTML response에 XSS fixture를 넣어 text escaping과 Content-Type을 확인합니다.",
      "가입 성공 후 303 redirect→GET 결과 page가 되는 PRG chain을 구현합니다.",
      "log와 screenshot에서 password·token·개인정보 value를 제거하고 evidence를 정리합니다.",
    ],
    expectedResult: ["GET 검색 조건은 재현 가능한 URL에 나타나고 mutation은 일어나지 않습니다.", "POST body도 HTTPS·validation·CSRF가 별도 필요함을 설명할 수 있습니다.", "disabled/name 없음/unchecked control의 제외를 예측하고 Network에서 확인합니다.", "한글·emoji가 client→Servlet→response에서 깨지지 않습니다.", "direct request의 invalid value가 field error로 거부되고 XSS text가 실행되지 않습니다.", "refresh는 결과 GET만 반복하며 server invariant가 중복 가입을 막습니다."],
    cleanup: ["synthetic account와 upload/test log를 제거합니다.", "Network HAR을 공유한다면 cookie·Authorization·query PII를 sanitize합니다."],
    extensions: ["multipart file upload의 size/type/name 검증과 격리 storage를 추가합니다.", "Spring MVC DTO binding/Bean Validation에서 같은 parameter contract가 어떻게 표현되는지 비교합니다.", "idempotency key와 database unique constraint를 이용해 concurrent double submit을 test합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "GET 검색 form의 최종 query를 제출 전에 예측하고 Network 결과와 비교하세요.", requirements: ["text 1개, checked checkbox 2개, unchecked 1개, readonly 1개, disabled 1개를 포함합니다.", "모든 전송 control에 명시적 name/value를 둡니다.", "포함·제외 entry와 순서를 표로 기록합니다.", "민감 정보는 사용하지 않습니다."], hints: ["id는 label 관계, name은 parameter key입니다.", "disabled와 readonly 결과가 다릅니다."], expectedOutcome: "예측한 repeated query와 실제 request가 일치하고 각 제외 이유를 form algorithm으로 설명합니다.", solutionOutline: ["control state snapshot을 먼저 만듭니다.", "URLSearchParams와 Network query를 비교합니다."] },
    { difficulty: "응용", prompt: "Servlet parameter parser와 안전한 HTML response를 구현하세요.", requirements: ["scalar·repeated field를 각각 getParameter/getParameterValues로 처리합니다.", "missing·empty·unknown·duplicate policy를 정의합니다.", "문자 encoding은 parameter read 전에, response type은 writer 전에 설정합니다.", "server validation과 HTML text escaping을 적용합니다.", "curl로 client validation 우회를 test합니다."], hints: ["input type=number도 server에는 String입니다.", "UTF-8과 XSS defense는 서로 다른 책임입니다."], expectedOutcome: "한글·반복 field·invalid input·XSS fixture를 예상 status와 안전한 output으로 처리합니다.", solutionOutline: ["request DTO parsing과 domain validation을 나눕니다.", "template auto-escape 또는 context encoder를 사용합니다."] },
    { difficulty: "설계", prompt: "검색·로그인·주문·file upload 네 form의 HTTP와 security 계약을 설계하세요.", requirements: ["각 form의 action/method/enctype 선택 근거를 HTTP semantics로 설명합니다.", "URI/body size·encoding·repeated key·null policy를 정의합니다.", "authentication·authorization·CSRF·XSS·logging/privacy 방어를 분리합니다.", "PRG·idempotency·retry behavior를 설계합니다.", "browser E2E와 direct HTTP test matrix를 제시합니다."], hints: ["POST라는 한 단어를 보안 근거로 사용하지 않습니다.", "client field를 신뢰하지 않고 server source of truth를 찾습니다."], expectedOutcome: "frontend·backend·security·QA가 공유할 수 있는 end-to-end form contract와 failure matrix가 완성됩니다.", solutionOutline: ["user intent와 resource mutation 여부부터 분류합니다.", "entry schema→transport→server DTO→domain invariant→response 순서로 표를 만듭니다."] },
  ],
  reviewQuestions: [
    { question: "GET form data는 HTTP header에 들어가나요?", answer: "정확히는 action URL의 query component에 serialization되어 request target의 일부가 됩니다. URL은 history·log·cache 등 여러 곳에 남을 수 있습니다." },
    { question: "POST면 비밀번호가 안전한가요?", answer: "주소창에 body가 보이지 않을 뿐입니다. HTTPS, server validation, authentication/authorization, CSRF, logging 정책이 별도로 필요합니다." },
    { question: "id가 있으면 server로 값이 전송되나요?", answer: "일반 form 제출 key는 name입니다. id는 label·fragment·DOM 식별에 쓰이며 name이 없으면 보통 entry가 생기지 않습니다." },
    { question: "disabled와 readonly는 제출 결과가 같은가요?", answer: "아닙니다. disabled control은 entry에서 제외되고, 적용 가능한 readonly control은 값이 제출됩니다." },
    { question: "같은 name의 checkbox 여러 개는 server에서 어떻게 받나요?", answer: "반복 name/value entry가 되므로 Servlet에서는 getParameterValues로 String[]을 받고 허용 값과 중복 policy를 검증합니다." },
    { question: "GET은 4096 byte, POST는 무제한이라는 규칙이 있나요?", answer: "그런 보편적 고정값은 없습니다. 표준 권고와 browser·proxy·server·framework별 URI/body limit을 실제 환경에서 확인해야 합니다." },
    { question: "request.setCharacterEncoding은 언제 호출해야 하나요?", answer: "request parameter나 reader를 처음 읽기 전에 호출해야 합니다. application filter/framework에서 중앙화하는 편이 안전합니다." },
    { question: "required와 pattern이 있으면 server validation을 생략해도 되나요?", answer: "안 됩니다. client constraint는 우회할 수 있으므로 모든 request를 server에서 다시 검증합니다." },
    { question: "POST 후 redirect가 필요한 이유는 무엇인가요?", answer: "결과를 GET URL로 전환해 refresh 시 form body 재전송을 줄이고 결과 page를 link 가능하게 하기 위해서입니다. 중복 방지는 server invariant도 필요합니다." },
  ],
  completionChecklist: [
    "각 form의 action·method·enctype·submitter override를 설명할 수 있다.",
    "id와 name을 구분하고 모든 control의 포함·제외 entry를 예측했다.",
    "GET/POST를 속도·은닉이 아니라 safe/mutation·linkability semantics로 선택했다.",
    "repeated name·missing·empty·invalid·duplicate parameter policy를 server에 정의했다.",
    "parameter read 전 request encoding과 writer 전 response Content-Type/encoding을 설정했다.",
    "HTTPS·authorization·validation·CSRF·output escaping·logging privacy를 독립적으로 적용했다.",
    "mutation 성공 후 PRG와 idempotency/server invariant를 검증했다.",
    "DOM→Network→server parse→domain→response 전체 evidence에서 secret/PII를 redaction했다.",
  ],
  nextSessions: ["html-08-form-controls-validation"],
  sources: [
    { id: "web-form-concepts-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day03/ex04_form.html", usedFor: ["form action·method·enctype", "GET·POST", "name/value", "반복 값", "control attributes"], evidence: "원본의 상세 form 주석을 전부 감사하고 GET query, URI limit, POST security/performance 등 과도한 단순화를 현재 HTTP semantics로 교정했습니다." },
    { id: "web-form-basic-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day03/ex05_form.html", usedFor: ["login POST", "signup GET", "label", "disabled·readonly", "required·pattern", "fieldset"], evidence: "두 form의 실제 name/state를 entry list로 추적해 readonly/disabled와 validation 경계를 설명했습니다." },
    { id: "jsp-servlet-parameter-source", repository: "jspstudy 학습 원본", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex04.java", usedFor: ["Jakarta Servlet", "getParameter", "String/String[]", "request/response encoding", "HTML response"], evidence: "Servlet parameter 수신·응답 코드를 읽고 null/type validation, repeated field, encoding order, output escaping으로 확장했습니다." },
    { id: "whatwg-form-infrastructure", repository: "WHATWG HTML Standard", path: "multipage/form-control-infrastructure.html", publicUrl: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html", usedFor: ["form submission attributes", "entry list", "submitter", "form data encoding", "constraint/submission process"], evidence: "2026-07-12 기준 living standard의 form control infrastructure와 submission algorithm을 end-to-end pipeline의 기준으로 확인했습니다." },
    { id: "whatwg-forms", repository: "WHATWG HTML Standard", path: "multipage/forms.html", publicUrl: "https://html.spec.whatwg.org/multipage/forms.html", usedFor: ["form·input·button elements", "name/value", "disabled·readonly", "control categories"], evidence: "HTML form elements와 attributes의 현재 정의를 control 포함·제외 규칙에 반영했습니다." },
    { id: "rfc9110-http-semantics", repository: "IETF RFC Editor", path: "rfc/rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["GET·POST semantics", "safe·idempotent", "URI query", "sensitive data in URI", "URI length interoperability"], evidence: "RFC 9110의 method semantics와 URI 지원 권고를 사용해 원본의 header·4096 byte·속도 설명을 교정했습니다." },
    { id: "jakarta-servlet-request", repository: "Jakarta EE Platform API", path: "apidocs/jakarta/servlet/servletrequest", publicUrl: "https://jakarta.ee/specifications/platform/11/apidocs/jakarta/servlet/servletrequest", usedFor: ["getParameter family", "request character encoding", "encoding 설정 시점"], evidence: "ServletRequest API에서 setCharacterEncoding이 parameter/reader access 전에 호출되어야 한다는 계약과 parameter API를 확인했습니다." },
    { id: "jakarta-servlet-response", repository: "Jakarta EE Platform API", path: "apidocs/jakarta/servlet/servletresponse", publicUrl: "https://jakarta.ee/specifications/platform/11/apidocs/jakarta/servlet/servletresponse", usedFor: ["response encoding", "content type", "writer/commit order"], evidence: "ServletResponse encoding과 Content-Type/writer 순서를 안전한 응답 설명에 반영했습니다." },
  ],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "원본은 form attributes와 Servlet parameter의 학습 흐름이 풍부합니다. 현재 HTTP semantics, entry-list algorithm, PRG, CSRF/XSS, infrastructure limit은 공식 표준으로 교정·보강했습니다.",
      "각 input type의 UI·validation·accessibility와 multipart upload 구현은 다음 html-08에서, Spring MVC DTO binding은 Spring 과정에서 다시 깊게 연결합니다.",
    ],
  },
} satisfies DetailedSession;

(session.chapters as DetailedSession["chapters"]).push(
  {
    id: "successful-controls-submitter-entry-list",
    title: "browser는 form의 모든 element가 아니라 successful controls와 실제 submitter로 entry list를 만듭니다",
    lead: "화면에 값이 있다는 사실과 request에 name/value가 들어간다는 사실은 다릅니다. control state, name, disabled, checked, submit button을 한 번에 관찰해야 server parameter null의 원인을 찾을 수 있습니다.",
    explanations: [
      "submission 시 browser는 form owner가 같은 controls 중 전송 조건을 만족하는 항목으로 entry list를 만듭니다. name이 없는 control, disabled control, unchecked checkbox/radio는 제외되고 select multiple·같은 name checkbox는 repeated entries를 만듭니다. readonly는 disabled와 달리 보통 전송됩니다.",
      "submit button의 name/value는 실제 activation된 submitter만 포함됩니다. `requestSubmit(button)`은 validation과 submitter semantics를 거치지만 `form.submit()`은 submit event·constraint validation을 우회하는 차이가 있으므로 application code에서는 requestSubmit 또는 사용자 activation을 사용합니다.",
      "id는 label·DOM reference이고 name은 request key입니다. 두 값이 우연히 같아도 책임은 다르며 server DTO가 기대하는 exact key·cardinality와 맞아야 합니다. repeated name은 Map 한 값으로 덮지 말고 ordered multimap 또는 list로 처리합니다.",
      "FormData로 entry list를 관찰할 수 있지만 실제 GET query encoding, multipart boundary, activated submitter override와 redirect는 Network에서 최종 확인합니다. password·token·file name 같은 값은 log와 screenshot에서 redaction합니다.",
    ],
    concepts: [
      { term: "successful control", definition: "form submission entry list에 name/value를 제공할 조건을 만족한 control입니다.", detail: ["name·disabled·checked·submitter state가 영향을 줍니다.", "보이는 모든 control이 전송되는 것은 아닙니다."] },
      { term: "submitter", definition: "특정 submission을 실제로 시작한 submit button 또는 image input입니다.", detail: ["자신의 name/value를 entry에 추가합니다.", "formaction·formmethod·formenctype로 form 기본값을 override할 수 있습니다."] },
    ],
    codeExamples: [
      {
        id: "successful-controls-formdata-matrix",
        title: "name·disabled·checked·multiple·submitter가 FormData에 남기는 exact entries",
        language: "html",
        filename: "successful-controls.html",
        purpose: "서로 다른 control state를 한 form에 두고 requestSubmit의 실제 submitter를 포함한 entry 순서와 repeated keys를 관찰합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>successful controls</title></head>\n<body>\n  <main>\n    <h1>전송 entry 점검</h1>\n    <form id=\"search\" action=\"https://learn.example/search\" method=\"get\">\n      <label>검색어 <input name=\"q\" value=\"표 구조\"></label>\n      <label>id만 있음 <input id=\"id-only\" value=\"제외\"></label>\n      <input name=\"disabledField\" value=\"제외\" disabled>\n      <label><input type=\"checkbox\" name=\"topic\" value=\"html\" checked> HTML</label>\n      <label><input type=\"checkbox\" name=\"topic\" value=\"css\"> CSS</label>\n      <label><input type=\"radio\" name=\"level\" value=\"beginner\" checked> 입문</label>\n      <select name=\"lang\" multiple aria-label=\"언어\">\n        <option value=\"ko\" selected>한국어</option><option value=\"en\" selected>English</option>\n      </select>\n      <button id=\"submit\" name=\"intent\" value=\"search\">검색</button>\n    </form>\n    <pre id=\"result\"></pre>\n  </main>\n  <script>\n    const form = document.querySelector(\"#search\");\n    const submitter = document.querySelector(\"#submit\");\n    form.addEventListener(\"submit\", (event) => {\n      event.preventDefault();\n      const entries = [...new FormData(form, event.submitter)];\n      const pairs = entries.map(([name, value]) => `${name}=${value}`);\n      const lines = [\n        `submitter=${event.submitter.id}`,\n        `keys=${entries.map(([name]) => name).join(\",\")}`,\n        `entries=${pairs.join(\"|\")}`,\n        `topics=${entries.filter(([name]) => name === \"topic\").length}`,\n        `idOnlyIncluded=${entries.some(([name]) => name === \"id-only\")}`,\n        `disabledIncluded=${entries.some(([name]) => name === \"disabledField\")}`,\n      ];\n      document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n    });\n    form.requestSubmit(submitter);\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-7", explanation: "GET form과 고정 action을 준비합니다." },
          { lines: "8-19", explanation: "정상 text, name 없는 input, disabled input, checked/unchecked choice, multiple select와 name/value가 있는 submitter를 나란히 둡니다." },
          { lines: "20-26", explanation: "submit event를 관찰하고 navigation을 막은 뒤 실제 event.submitter를 포함해 FormData entry list를 만듭니다." },
          { lines: "27-37", explanation: "entry order·repeated key 수와 제외 대상 포함 여부를 exact string으로 기록합니다." },
          { lines: "38-41", explanation: "requestSubmit으로 validation·submitter path를 실행하고 문서를 닫습니다." },
        ],
        run: { environment: ["현대 browser", "FormData(form, submitter) 지원", "network 불필요"], command: "successful-controls.html을 열고 #result와 form control accessibility names를 확인" },
        output: { value: "submitter=submit\nkeys=q,topic,level,lang,lang,intent\nentries=q=표 구조|topic=html|level=beginner|lang=ko|lang=en|intent=search\ntopics=1\nidOnlyIncluded=false\ndisabledIncluded=false", explanation: ["unchecked CSS·disabledField·name 없는 id-only는 entry list에서 빠집니다.", "multiple select의 lang은 같은 key로 두 번 나타납니다.", "실제 submitter의 intent=search가 control tree 뒤 entry로 포함됩니다."] },
        experiments: [
          { change: "CSS checkbox도 checked로 바꿉니다.", prediction: "topic entry가 html과 css 두 개가 되고 topics=2입니다.", result: "server는 scalar가 아니라 list cardinality로 받아야 합니다." },
          { change: "form.requestSubmit 대신 form.submit()을 호출합니다.", prediction: "submit listener와 constraint validation을 거치지 않아 결과가 작성되지 않고 실제 navigation이 시도됩니다.", result: "두 API의 lifecycle 차이를 알고 requestSubmit을 기본으로 사용합니다." },
        ],
        sourceRefs: ["web-form-basic-source", "whatwg-form-infrastructure", "whatwg-forms"],
      },
      {
        id: "urlencoded-query-roundtrip",
        title: "space·ampersand·한글·repeated key의 application/x-www-form-urlencoded round trip",
        language: "html",
        filename: "urlencoded-query.html",
        purpose: "문자열 이어 붙이기 대신 URLSearchParams가 만드는 form-style percent encoding과 repeated key 복원을 exact output으로 확인합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>query encoding</title></head>\n<body>\n  <main><h1>GET query 직렬화</h1><pre id=\"result\"></pre></main>\n  <script>\n    const params = new URLSearchParams([\n      [\"q\", \"HTML form\"],\n      [\"tag\", \"a&b\"],\n      [\"tag\", \"한글\"],\n    ]);\n    const url = new URL(\"https://learn.example/search\");\n    url.search = params.toString();\n    const restored = new URLSearchParams(url.search);\n    const lines = [\n      `encoded=${params}`,\n      `url=${url.href}`,\n      `query=${restored.get(\"q\")}`,\n      `tags=${restored.getAll(\"tag\").join(\"|\")}`,\n      `tagCount=${restored.getAll(\"tag\").length}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-5", explanation: "독립 document와 result 영역을 준비합니다." },
          { lines: "6-11", explanation: "space, reserved ampersand, Unicode와 repeated tag를 tuple list로 URLSearchParams에 전달합니다." },
          { lines: "12-14", explanation: "고정 HTTPS URL에 serializer 결과를 적용하고 다시 parser로 읽습니다." },
          { lines: "15-22", explanation: "wire string·absolute URL·decoded scalar/list와 cardinality를 기록합니다." },
          { lines: "23-25", explanation: "문서를 닫습니다. query string을 raw concatenation하지 않아 delimiter injection을 피합니다." },
        ],
        run: { environment: ["현대 browser", "network 불필요"], command: "urlencoded-query.html을 열고 #result의 encoding·round-trip 다섯 줄을 확인" },
        output: { value: "encoded=q=HTML+form&tag=a%26b&tag=%ED%95%9C%EA%B8%80\nurl=https://learn.example/search?q=HTML+form&tag=a%26b&tag=%ED%95%9C%EA%B8%80\nquery=HTML form\ntags=a&b|한글\ntagCount=2", explanation: ["space는 plus, ampersand와 UTF-8 bytes는 percent-encoded됩니다.", "getAll은 repeated key 순서를 보존합니다.", "encoding은 escaping·authorization을 대신하지 않으며 sensitive GET data는 URL에 넣지 않습니다."] },
        experiments: [
          { change: "`'?q=' + value`로 직접 결합합니다.", prediction: "a&b의 ampersand가 새 parameter delimiter로 해석될 수 있습니다.", result: "URLSearchParams 같은 표준 serializer를 사용합니다." },
          { change: "password parameter를 추가합니다.", prediction: "encoding되어도 address bar·history·logs·referrer에 민감 값이 남습니다.", result: "민감 mutation은 HTTPS POST와 server-side redaction·cache policy를 사용합니다." },
        ],
        sourceRefs: ["whatwg-form-infrastructure", "url-urlencoded-standard", "rfc9110-http-semantics"],
      },
    ],
    diagnostics: [
      { symptom: "두 topic을 선택했지만 server에는 하나만 오고 query의 a&b가 별도 parameter로 갈라진다.", likelyCause: "repeated entry를 scalar로 덮거나 query를 표준 serializer 없이 문자열 결합했습니다.", checks: ["FormData entries와 Network query raw string을 비교합니다.", "server getParameterValues/list binding을 확인합니다.", "URLSearchParams round trip으로 delimiter·Unicode를 재현합니다."], fix: "cardinality를 schema에 선언하고 URLSearchParams/form serializer와 list binding을 사용합니다.", prevention: "missing·one·repeated·empty·Unicode·reserved-character contract fixture를 browser/server 모두에서 실행합니다." },
    ],
    expertNotes: ["URLSearchParams는 application/x-www-form-urlencoded 규칙을 사용하므로 generic percent-encoding API와 space 표현이 다를 수 있습니다. 실제 contract의 serializer를 고정합니다.", "GET URL은 CDN·proxy·analytics·browser history에 복제됩니다. 검색처럼 safe·shareable한 비민감 state만 넣고 retention과 referrer policy를 검토합니다."],
  },
  {
    id: "method-enctype-submitter-http-response",
    title: "method·enctype·submitter override와 server response를 하나의 HTTP transaction 계약으로 봅니다",
    lead: "form markup은 request 생성의 시작일 뿐입니다. endpoint는 method semantics, Content-Type parser, size limit, CSRF·authorization, validation, status·redirect를 일관되게 처리해야 합니다.",
    explanations: [
      "GET은 safe retrieval과 bookmark 가능한 query에 사용하고, state-changing operation은 POST를 사용합니다. method 이름만 바꿔도 idempotency가 생기지 않으며 duplicate submit·retry는 unique constraint, idempotency key 또는 domain invariant로 server가 제어합니다.",
      "application/x-www-form-urlencoded는 text-sized fields의 기본 encoding이고 multipart/form-data는 file·binary part와 text fields를 boundary로 나눕니다. fetch로 FormData를 보낼 때 Content-Type을 직접 쓰면 generated boundary가 빠질 수 있습니다. text/plain form enctype는 production parser contract로 대개 적합하지 않습니다.",
      "여러 submit button은 formaction·formmethod·formenctype으로 같은 fields를 preview/save/upload 등 다른 endpoint에 보낼 수 있습니다. 실제 event.submitter를 포함해 validation·authorization을 결정하고 button label만 server action으로 신뢰하지 않습니다.",
      "성공한 POST는 303 See Other와 Location으로 결과 GET에 연결하는 PRG가 refresh 재전송을 줄입니다. validation failure는 입력과 field errors를 보존하고, authentication redirect와 validation redirect를 섞지 않습니다. status·Content-Type·charset·cache·CSP headers는 body write 전에 정합니다.",
    ],
    concepts: [
      { term: "enctype", definition: "form entry list를 HTTP request body로 표현할 media type을 선택하는 attribute입니다.", detail: ["POST에서 주로 의미가 있습니다.", "file upload에는 multipart/form-data를 사용합니다."] },
      { term: "idempotency", definition: "동일한 의도 request가 중복 도착해도 domain 결과가 중복 생성되지 않도록 하는 server 계약입니다.", detail: ["HTTP method 이름만으로 보장되지 않습니다.", "unique constraint·key·transaction으로 구현합니다."] },
    ],
    codeExamples: [
      {
        id: "submitter-method-enctype-override",
        title: "submit button이 override한 action·method·enctype와 entry list 검사",
        language: "html",
        filename: "submitter-override.html",
        purpose: "form 기본 encoding과 upload submitter의 effective request metadata를 submit event에서 exact DOM properties로 관찰합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>submitter override</title></head>\n<body>\n  <main>\n    <h1>지원서 전송 계약</h1>\n    <form id=\"application\" action=\"https://learn.example/drafts\" method=\"post\" enctype=\"application/x-www-form-urlencoded\">\n      <label>표시 이름 <input name=\"displayName\" value=\"김하늘\"></label>\n      <button type=\"submit\" name=\"intent\" value=\"draft\">임시 저장</button>\n      <button id=\"upload\" type=\"submit\" name=\"intent\" value=\"upload\" formaction=\"https://learn.example/applications\" formmethod=\"post\" formenctype=\"multipart/form-data\">지원서 제출</button>\n    </form>\n    <pre id=\"result\"></pre>\n  </main>\n  <script>\n    const form = document.querySelector(\"#application\");\n    const upload = document.querySelector(\"#upload\");\n    form.addEventListener(\"submit\", (event) => {\n      event.preventDefault();\n      const submitter = event.submitter;\n      const entries = [...new FormData(form, submitter)]\n        .map(([name, value]) => `${name}:${value}`).join(\"|\");\n      const lines = [\n        `defaultAction=${form.action}`,\n        `defaultEnctype=${form.enctype}`,\n        `submitter=${submitter.id}`,\n        `effectiveAction=${submitter.formAction}`,\n        `effectiveMethod=${submitter.formMethod}`,\n        `effectiveEnctype=${submitter.formEnctype}`,\n        `entries=${entries}`,\n        `expectedResponse=303 See Other`,\n      ];\n      document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n    });\n    form.requestSubmit(upload);\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-7", explanation: "default POST/urlencoded form과 독립 action을 선언합니다." },
          { lines: "8-13", explanation: "text field, default draft submitter, action·method·multipart를 override하는 upload submitter를 둡니다." },
          { lines: "14-22", explanation: "submit event를 막고 실제 event.submitter와 그 submitter를 포함한 FormData entries를 얻습니다." },
          { lines: "23-34", explanation: "form 기본값과 effective submitter values, entries, server가 반환할 PRG status contract를 기록합니다." },
          { lines: "35-37", explanation: "requestSubmit으로 upload path를 실행하고 문서를 닫습니다." },
        ],
        run: { environment: ["현대 browser", "JavaScript 활성화", "network 불필요"], command: "submitter-override.html을 열고 #result와 submit button accessible names를 확인" },
        output: { value: "defaultAction=https://learn.example/drafts\ndefaultEnctype=application/x-www-form-urlencoded\nsubmitter=upload\neffectiveAction=https://learn.example/applications\neffectiveMethod=post\neffectiveEnctype=multipart/form-data\nentries=displayName:김하늘|intent:upload\nexpectedResponse=303 See Other", explanation: ["form 기본 endpoint/encoding과 activated submitter의 effective metadata가 다릅니다.", "entry list에는 upload button의 intent만 포함됩니다.", "303은 client가 자동 생성하는 값이 아니라 성공한 server handler의 response contract입니다."] },
        experiments: [
          { change: "draft button으로 requestSubmit합니다.", prediction: "effective action/enctype가 form 기본값이고 intent=draft가 포함됩니다.", result: "실제 submitter별 endpoint·authorization·validation contract를 test합니다." },
          { change: "multipart request Content-Type을 boundary 없이 수동 작성합니다.", prediction: "server parser가 parts를 분리하지 못합니다.", result: "native form 또는 browser FormData transport가 boundary를 생성하게 합니다." },
        ],
        sourceRefs: ["web-form-concepts-source", "jsp-servlet-parameter-source", "whatwg-forms", "rfc9110-http-semantics", "rfc7578-multipart", "jakarta-servlet-response"],
      },
    ],
    diagnostics: [
      { symptom: "multipart handler에 모든 parameter가 null이고 refresh 때 신청이 두 번 생성된다.", likelyCause: "effective submitter enctype/boundary를 확인하지 않았고 POST 성공 page를 직접 반환해 history 재전송이 남았습니다.", checks: ["event.submitter의 formAction/formMethod/formEnctype를 확인합니다.", "Network Content-Type boundary·payload와 server multipart limits를 봅니다.", "response status·Location과 database uniqueness를 확인합니다."], fix: "browser가 생성한 multipart boundary를 사용하고 server 성공 뒤 transaction/unique invariant와 303 PRG를 적용합니다.", prevention: "각 submitter의 effective request, oversize/invalid multipart, double click/retry/refresh integration test를 둡니다." },
    ],
    expertNotes: ["multipart filename과 Content-Type은 client-controlled metadata입니다. path로 사용하지 말고 server-generated id, size/signature/decoder 검사, quarantine·safe serving을 적용합니다.", "CSP form-action은 unexpected destination을 제한하는 defense-in-depth이지만 server CSRF·authorization·open redirect validation을 대체하지 않습니다."],
  },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "화면에 있는 input은 모두 request에 포함되나요?", answer: "아닙니다. name, disabled, checked, form owner와 submitter 등 successful-control 조건을 만족한 entries만 포함됩니다." },
  { question: "readonly와 disabled control은 전송 관점에서 같은가요?", answer: "아닙니다. readonly control은 보통 전송되지만 disabled control은 successful entry에서 제외됩니다." },
  { question: "같은 name checkbox 여러 개를 server Map 한 값으로 받아도 되나요?", answer: "여러 entries가 올 수 있으므로 list/array cardinality로 받고 missing·duplicate·unknown policy를 정해야 합니다." },
  { question: "GET query의 ampersand와 한글은 어떻게 안전하게 직렬화하나요?", answer: "문자열 결합 대신 form/URLSearchParams의 application/x-www-form-urlencoded serializer를 사용합니다." },
  { question: "multipart/form-data의 boundary를 직접 Content-Type에 적어야 하나요?", answer: "native form이나 fetch FormData에서는 browser가 body와 일치하는 boundary parameter를 생성하게 해야 합니다." },
  { question: "POST 성공 뒤 303 redirect를 쓰는 이유는 무엇인가요?", answer: "결과를 GET URL로 전환해 refresh에 원래 POST body가 재전송되는 위험을 줄이고 결과 URL을 공유 가능하게 합니다." },
);

(session.completionChecklist as string[]).push(
  "name 없는·disabled·unchecked·multiple·repeated·submitter controls의 FormData entry 차이를 검증했다.",
  "form.requestSubmit과 form.submit의 validation·event·submitter lifecycle 차이를 설명할 수 있다.",
  "GET query를 URLSearchParams로 직렬화하고 space·reserved 문자·Unicode·repeated key를 round-trip했다.",
  "safe/idempotent method 의미와 state-changing POST의 server invariant를 분리했다.",
  "각 submitter의 effective action·method·enctype와 authorization contract를 검사했다.",
  "multipart boundary·size·filename/type 신뢰 경계와 server parser limit을 검증했다.",
  "POST 성공 303 PRG, validation failure 입력 보존, response header commitment를 integration test했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "url-urlencoded-standard", repository: "WHATWG URL Living Standard", path: "#application/x-www-form-urlencoded", publicUrl: "https://url.spec.whatwg.org/#application/x-www-form-urlencoded", usedFor: ["form URL encoding", "percent-encode set", "space plus", "parser·serializer", "repeated parameters"], evidence: "2026-07-14에 application/x-www-form-urlencoded parser·serializer를 확인해 GET query의 space·reserved character·Unicode round-trip 기준으로 사용했습니다." },
  { id: "rfc7578-multipart", repository: "IETF RFC Editor", path: "rfc7578", publicUrl: "https://www.rfc-editor.org/rfc/rfc7578.html", usedFor: ["multipart/form-data", "boundary parameter", "part name·filename", "multiple files", "charset considerations"], evidence: "2026-07-14에 RFC 7578의 multipart/form-data media type과 boundary·part disposition 요구를 확인했습니다." },
);

export default session;
