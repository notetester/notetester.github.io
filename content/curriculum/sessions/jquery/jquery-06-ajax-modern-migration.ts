import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["jquery-06-ajax-modern-migration"],
  slug: "jquery-06-ajax-modern-migration",
  courseId: "javascript",
  moduleId: "02-jquery-legacy-migration",
  order: 6,
  title: "$.ajax JSON·XML 처리와 fetch 전환 전략",
  subtitle: "요청·응답·변환·오류·취소 계약을 분리하고, 검증 가능한 경계를 만든 뒤 jQuery Ajax를 Fetch로 기능 단위 이식합니다.",
  level: "고급",
  estimatedMinutes: 470,
  coreQuestion: "jQuery가 암묵적으로 처리하던 직렬화·응답 변환·HTTP 실패·취소를 잃지 않으면서, 안전하고 관측 가능한 Fetch 기반 요청 계층으로 어떻게 점진 이식할까요?",
  summary: "inventory의 day12 ex07~ex14 여덟 원본과 연결된 XML·JSON·text fixture를 전부 감사합니다. ex07은 Ajax와 options를 설명하는 주석뿐이며 실행 jQuery가 없고 serialized()라는 오기, success는 한 callback만 가능하다는 과도한 단순화, error 인자 설명 오류가 있습니다. ex08~11은 dataType xml로 child element·attribute·mixed text·default namespace weather를 읽고, ex12는 JSON 점수 배열, ex13은 cross-origin 화장품 JSON, ex14는 slash/comma 구분 text를 table로 표현합니다. 형식별 흐름은 좋은 출발점이지만 모든 예제가 응답 값을 HTML 문자열로 이어 .html()에 넣고, error에서 표준 계약에 없는 response.message를 읽으며, loading·empty·abort·timeout·retry·schema 검증이 없습니다. weather에는 97개 local 중 고창의 ta 하나가 실제로 누락되고 JSON count는 숫자가 아니라 문자열이며 text format은 delimiter 충돌에 취약합니다. 외부 API는 CORS·가용성·schema drift에 따라 재현성이 흔들리고 색상 값을 style 문자열에 직접 삽입합니다. 이번 세션은 Ajax를 XML 전용 기술이 아닌 비동기 HTTP 교환으로 다시 정의하고, full/slim build, $.ajax request lifecycle, url·method·data·processData·contentType·dataType, successful form controls와 serialize/param/FormData, jqXHR Deferred callback signatures, JSON·XML·text converter와 syntax/schema 경계, HTTP·network·CORS·timeout·abort·parsererror taxonomy, latest-intent race, safe DOM table, accessible loading/empty/error/retry, credentials·CSRF·cache·global events, jQuery 4 변경, Response.ok·single-use body·AbortController와 Fetch adapter, behavior-first strangler migration과 contract tests까지 초급에서 production 운영 수준으로 연결합니다.",
  objectives: [
    "Ajax·HTTP request/response와 jQuery가 담당하는 transport·conversion 단계를 시간 순서로 설명할 수 있다.",
    "method·data·processData·contentType·dataType의 방향과 wire 결과를 구분해 요청 계약을 작성할 수 있다.",
    ".serialize()·$.param·URLSearchParams·FormData·JSON body의 포함 규칙과 encoding 차이를 검증할 수 있다.",
    "jqXHR의 done·fail·always·then·abort 계약과 native Promise와 다른 다중 인자·취소 특성을 설명할 수 있다.",
    "JSON·XML·text의 syntax·MIME·schema·missing/empty 변환 실패를 별도 상태로 진단할 수 있다.",
    "HTTP·network/CORS·timeout·abort·parsererror·schema·render 오류를 사용자 상태와 telemetry code로 분류할 수 있다.",
    "이전 jqXHR abort와 generation token을 함께 사용해 stale response와 stale finally를 차단할 수 있다.",
    "외부 응답을 HTML·style 문자열로 조립하지 않고 검증한 model과 text/property DOM API로 렌더링할 수 있다.",
    "Fetch의 Response.ok·body consumption·credentials·cache·AbortSignal을 jQuery observable behavior와 맞출 수 있다.",
    "transport→parser/normalizer→renderer 경계와 공통 contract tests로 기능별 점진 이식을 수행할 수 있다.",
  ],
  prerequisites: [
    { title: "jQuery 이벤트·폼 검증", reason: "submit lifecycle, successful controls, namespaced teardown와 최신 입력 상태를 AJAX 요청 owner에 연결합니다.", sessionSlug: "jquery-04-events-validation" },
    { title: "Fetch·JSON·HTTP", reason: "Response.ok, header/body, network와 HTTP 실패, AbortController 기반 native transport를 이미 이해하고 비교합니다.", sessionSlug: "js-10-fetch-json-http" },
    { title: "Fetch·XML·DOMParser", reason: "XML parsererror, namespace, missing/empty와 safe DOM rendering을 jQuery dataType xml 이식에 적용합니다.", sessionSlug: "js-11-fetch-xml-domparser-capstone" },
  ],
  keywords: ["Ajax", "$.ajax", "jqXHR", "Deferred", "done", "fail", "always", "abort", "timeout", "serialize", "$.param", "processData", "contentType", "dataType", "JSON", "XML", "text", "parsererror", "CORS", "credentials", "CSRF", "cache", "global Ajax events", "Fetch", "Response.ok", "AbortController", "URLSearchParams", "FormData", "stale response", "XSS", "strangler migration", "contract test"],
  chapters: [
    {
      id: "ajax-eight-source-contract-audit",
      title: "여덟 원본에서 실행 evidence와 설명·inventory의 약속을 먼저 분리합니다",
      lead: "없는 done/fail·serialize 실행을 원본이 보여 준 것처럼 쓰지 않고, 실제 형식별 요청·렌더 흐름을 보존합니다.",
      explanations: [
        "day12 ex07은 AJAX 약자·부분 갱신·$.ajax options를 주석으로 설명하지만 jQuery script와 실행 request가 없습니다. serialized()는 .serialize()의 오기이고 error(function(data){})는 실제 실패 인자 순서를 생략합니다.",
        "inventory가 말한 done·fail과 serialize는 여덟 원본 어디에서도 실행되지 않습니다. ex08~14는 success/error option만 사용합니다. 이번 exact examples는 공식 API를 바탕으로 새로 보완한 것이며 source 실행 결과라고 과장하지 않습니다.",
        "ex08은 data01.xml의 child name/price, ex09는 data02.xml의 name/price attributes, ex10은 data03.xml의 direct text+attributes를 읽습니다. XML이라는 한 단어 안에서도 schema가 세 가지라 adapter가 달라집니다.",
        "ex11 weather.xml은 default namespace current와 97개 local을 갖고, stn_id 172 고창의 ta attribute 하나가 없습니다. .attr('ta') ?? '-'는 missing을 다루지만 .text() ?? '-'는 empty string을 대체하지 못합니다.",
        "ex12의 data04.json은 4개 record이고 count가 모두 string입니다. JSON parse 성공은 Array shape·field type·range가 올바르다는 보장이 아닙니다.",
        "ex13은 cross-origin Makeup API의 top five와 colors를 렌더링합니다. live endpoint는 감사 시점과 배포 시점의 CORS·availability·schema가 달라질 수 있어 exact lesson test는 local fixture를 사용해야 합니다.",
        "ex14는 data05.txt를 slash로 row, comma로 column 분리해 현재 3행×4열을 만듭니다. delimiter가 값 안에 들어오거나 trailing row·열 누락이 생기면 silently malformed table이 됩니다.",
      ],
      concepts: [
        { term: "source evidence", definition: "원본에서 실제 실행되거나 데이터로 확인된 동작입니다.", detail: ["주석의 주장과 구분합니다.", "fixture shape와 line-level code를 함께 봅니다."] },
        { term: "inventory gap", definition: "curriculum 요구에는 있지만 연결 원본에서 실행 증거를 찾지 못한 항목입니다.", detail: ["공식 자료와 새 example로 보완합니다.", "원본 provenance로 표시하지 않습니다."] },
        { term: "response schema", definition: "parse된 값이 가져야 할 container·field·type·missing 규칙입니다.", detail: ["format syntax와 별개입니다.", "UI 전에 domain model로 normalize합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "문서에는 done/fail 예제라고 적혀 있는데 원본에는 success/error만 보인다.", likelyCause: "inventory 목표와 source evidence를 합쳐 기록했습니다.", checks: ["여덟 HTML의 실제 method names를 검색합니다.", "주석과 실행 script를 구분합니다.", "fixture와 외부 API observation을 분리합니다."], fix: "원본은 success/error evidence로 기록하고 done/fail은 공식 API 기반 보완 example로 명시합니다.", prevention: "모든 세션에 filesRead/filesUsed와 sourceRefs를 유지합니다." },
      ],
    },
    {
      id: "ajax-http-lifecycle-build-contract",
      title: "Ajax는 XML 전용 문법이 아니라 비동기 HTTP lifecycle이며 jQuery full build가 그 adapter를 제공합니다",
      lead: "버튼 click부터 request 생성·송신·response·converter·callback·render까지 순서와 owner를 그립니다.",
      explanations: [
        "AJAX라는 이름은 역사적으로 Asynchronous JavaScript and XML이지만 현재 핵심은 페이지 전체 navigation 없이 HTTP request를 보내고 응답으로 일부 상태를 갱신하는 방식입니다. JSON·XML·text·HTML·binary를 모두 다룰 수 있습니다.",
        "브라우저 event handler가 $.ajax(settings)를 호출하면 jQuery는 options를 normalize하고 data를 직렬화하며 transport를 선택해 jqXHR를 즉시 반환합니다. network response 뒤 converter가 dataType에 맞게 body를 바꾸고 success/done 또는 error/fail, complete/always와 global events가 실행됩니다.",
        "비동기는 서버와 클라이언트의 속도를 맞출 필요가 없다는 뜻이 아니라 호출 stack을 막고 기다리지 않는다는 뜻입니다. 응답 순서·취소·loading ownership·component disposal을 애플리케이션이 관리해야 합니다.",
        "jQuery 4 slim build에는 Ajax와 그에 결합된 Deferred/Callbacks가 빠집니다. $.ajax is not a function이면 endpoint부터 의심하지 말고 $.fn.jquery, typeof $.ajax, script filename, duplicate instance와 load order를 확인합니다.",
        "file:// 문서에서 상대 AJAX를 열면 same-origin/CORS/local protocol 정책 때문에 실패할 수 있습니다. 학습 예제도 application과 같은 HTTP origin에서 제공하거나 deterministic mock transport를 사용합니다.",
        "inline div click이 아니라 native button, idle→loading→success|empty|error|canceled state, request owner와 dispose를 처음부터 구성합니다.",
      ],
      concepts: [
        { term: "transport", definition: "실제 request를 보내고 status·headers·raw body를 돌려주는 계층입니다.", detail: ["보통 XHR를 사용합니다.", "JSONP/script는 다른 transport일 수 있습니다."] },
        { term: "converter", definition: "받은 body를 text→json·text→xml 등 기대 dataType으로 변환하는 단계입니다.", detail: ["syntax error가 parsererror가 될 수 있습니다.", "schema validation은 별도입니다."] },
        { term: "jqXHR", definition: "XHR 호환 정보와 jQuery Deferred Promise interface, abort를 결합한 $.ajax 반환 객체입니다.", detail: ["즉시 반환됩니다.", "native Promise와 동일 객체가 아닙니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "$.ajax is not a function이 난다.", likelyCause: "jQuery 4 slim build, jQuery보다 이른 호출, load 실패 또는 뒤늦게 다른 instance가 $를 덮었습니다.", checks: ["typeof $.ajax와 $.fn.jquery를 출력합니다.", "Network/SRI/CSP와 script filename을 봅니다.", "window.jQuery identity가 plugin과 같은지 확인합니다."], fix: "검토한 full build 한 instance를 dependency 순서에 맞게 로드하거나 Fetch adapter로 옮깁니다.", prevention: "startup method smoke test와 exact version/build lock을 둡니다." },
        { symptom: "로컬 파일을 더블클릭하면 XML은 존재하는데 요청이 실패한다.", likelyCause: "file origin과 relative XHR 정책을 HTTP application과 혼동했습니다.", checks: ["location.protocol과 request URL/origin을 봅니다.", "DevTools Console CORS/local errors를 확인합니다.", "HTTP server에서 재현합니다."], fix: "same-origin development server나 mock transport에서 실행합니다.", prevention: "run instructions에 origin과 fixture server를 명시합니다." },
      ],
    },
    {
      id: "ajax-option-wire-contract",
      title: "method·data·processData·contentType·dataType을 request와 response 방향으로 나눕니다",
      lead: "이름이 비슷한 옵션을 암기하지 않고 실제 wire URL·header·body·converter로 검증합니다.",
      explanations: [
        "url은 endpoint, method는 HTTP method입니다. type은 method의 과거 호환 alias이고 새 code에서는 method가 의도를 더 명확히 드러냅니다. GET data는 body가 아니라 query string으로 붙습니다.",
        "data가 plain object이고 processData가 기본 true면 jQuery가 URL-encoded string으로 변환합니다. processData:false는 자동 처리를 끌 뿐 객체를 JSON으로 바꾸지 않습니다.",
        "contentType은 서버로 보내는 request body의 media type입니다. JSON은 JSON.stringify와 application/json을 함께 써야 합니다. FormData는 multipart boundary를 browser가 만들도록 contentType을 직접 쓰지 않습니다.",
        "dataType은 기대하는 response type과 converter 방향입니다. dataType:'json'을 쓴다고 request가 JSON이 되지 않고, contentType:'application/json'을 쓴다고 response가 자동 JSON이 되지 않습니다.",
        "headers·beforeSend·statusCode·timeout·cache·ifModified·xhrFields는 각각 request metadata, status 분기, 시간·캐시·credential 정책을 바꿉니다. option 몇 개를 전역 $.ajaxSetup에 숨기면 plugin 포함 모든 요청이 영향을 받으므로 explicit wrapper를 선호합니다.",
        "timeout은 $.ajax 호출 시점부터 계산되므로 connection slot을 기다리다가 송신 전 timeout될 수도 있습니다. 0은 무제한이며 production budget을 의미하지 않습니다.",
      ],
      concepts: [
        { term: "processData", definition: "string이 아닌 data를 jQuery query serialization으로 바꿀지 정하는 option입니다.", detail: ["기본 true입니다.", "JSON stringify option이 아닙니다."] },
        { term: "contentType", definition: "보내는 request body bytes의 media type header 정책입니다.", detail: ["dataType과 방향이 반대입니다.", "FormData boundary는 browser에 맡깁니다."] },
        { term: "dataType", definition: "받을 response를 어떤 converter로 어떤 JavaScript value로 만들지 지정하는 option입니다.", detail: ["json/xml/text 등이 있습니다.", "schema validity는 보장하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "서버가 JSON을 기대하는데 body가 q=ajax&level=2로 온다.", likelyCause: "plain object와 processData 기본값을 사용하면서 contentType만 JSON으로 바꿨습니다.", checks: ["Network의 request headers와 raw payload를 봅니다.", "JSON.stringify 호출 여부를 확인합니다.", "server parser contract를 확인합니다."], fix: "data: JSON.stringify(value), processData:false, contentType:'application/json'을 일관되게 사용합니다.", prevention: "각 endpoint에 method·URL·headers·body bytes·response schema contract test를 둡니다." },
        { symptom: "dataType:'json'인데 서버가 request JSON을 못 읽는다.", likelyCause: "dataType을 request body option으로 오해했습니다.", checks: ["contentType과 body를 확인합니다.", "dataType이 response converter임을 확인합니다.", "server Content-Type과 response body도 별도 봅니다."], fix: "request encoding과 response parsing을 서로 다른 설정으로 명시합니다.", prevention: "options 표를 send/receive 두 열로 문서화합니다." },
      ],
      comparisons: [
        { title: "대표 request body 선택", options: [
          { name: "URL-encoded", chooseWhen: "전통 form text fields와 반복 key를 server가 form parser로 받을 때", avoidWhen: "file/binary 또는 nested JSON schema가 핵심일 때", tradeoffs: ["간단하고 form 친화적입니다.", "array/nesting policy를 합의해야 합니다."] },
          { name: "JSON", chooseWhen: "typed nested API document와 명시 schema가 있을 때", avoidWhen: "file upload를 한 body로 보내야 할 때", tradeoffs: ["구조가 명확합니다.", "stringify·Content-Type·CORS preflight를 소유합니다."] },
          { name: "FormData", chooseWhen: "file과 text/repeated fields를 multipart로 보낼 때", avoidWhen: "server가 JSON만 받는 endpoint일 때", tradeoffs: ["Blob/File을 지원합니다.", "boundary header를 직접 설정하면 안 됩니다."] },
        ] },
      ],
    },
    {
      id: "successful-controls-serialization",
      title: ".serialize와 $.param은 DOM form 성공 control과 JavaScript object를 서로 다른 규칙으로 인코딩합니다",
      lead: "누락된 값과 중복 key, space·ampersand encoding을 exact string으로 확인합니다.",
      explanations: [
        ".serialize()는 form의 name이 있는 enabled successful controls를 DOM 순서대로 URL-encoded string으로 만듭니다. checked checkbox/radio만 포함되고 file content, unchecked control, disabled control, name 없는 input은 제외됩니다.",
        "submit button 값은 실제 submitter를 통한 entry list와 달리 단순 .serialize() 호출에서는 포함되지 않습니다. 어떤 버튼을 눌렀는지가 API 계약에 필요하면 submitter를 명시적으로 전달하거나 FormData(form, submitter) 지원 경로를 검토합니다.",
        "form과 그 children을 동시에 jQuery selection에 넣고 serialize하면 같은 controls가 중복될 수 있습니다. form 하나를 root로 선택합니다.",
        "$.param({tag:['js','xml']}) 기본은 tag[]=js 형태를 쓰고 traditional:true는 같은 tag key를 반복합니다. form 안 같은 name control은 본래 repeated key가 됩니다. server binding policy와 byte contract를 맞춥니다.",
        "URLSearchParams는 application/x-www-form-urlencoded serializer를 사용해 space를 +로 표현할 수 있고 jQuery param은 %20을 사용합니다. decode 의미가 같을 수 있어도 raw string·signature·cache key는 다를 수 있습니다.",
        "file은 .serialize 대상이 아닙니다. new FormData(form)을 사용하고 multipart Content-Type boundary를 browser에 맡깁니다. jQuery 3/4 병행 code에서는 processData:false와 contentType:false를 명시하면 호환 경계가 분명합니다.",
      ],
      concepts: [
        { term: "successful control", definition: "form submission entry list에 포함될 자격을 가진 name 있는 enabled/currently selected control입니다.", detail: ["unchecked·disabled·no-name은 빠집니다.", "submitter와 file은 API별 차이가 있습니다."] },
        { term: "repeated key", definition: "checkbox group처럼 같은 name이 여러 번 나타나는 encoded field입니다.", detail: ["순서를 보존할 수 있습니다.", "server array binding을 합의합니다."] },
        { term: "wire equivalence", definition: "decode한 의미뿐 아니라 실제 URL/body bytes와 header까지 같은지 비교하는 관점입니다.", detail: ["%20과 +는 raw bytes가 다릅니다.", "signature/cache에 영향이 있습니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-successful-controls-serialization",
          title: "form serialize와 object array serialization의 포함·encoding 차이를 검증합니다",
          language: "html",
          filename: "jquery-serialize-contract.html",
          purpose: "원본에 실행되지 않았던 serialize를 successful controls·repeated key·default/traditional object policy까지 결정적으로 보완합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>serialize contract</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<form id="filters">
  <input name="q" value="red shoes">
  <input name="tag" value="js">
  <input name="tag" value="a&amp;b">
  <input type="checkbox" name="include" value="sale" checked>
  <input type="checkbox" name="include" value="sold-out">
  <select name="sort"><option value="price" selected>가격</option></select>
  <input name="disabled" value="secret" disabled>
  <input id="only-id" value="ignored">
  <input type="file" name="attachment">
  <button type="submit" name="action" value="search">검색</button>
</form><pre id="out"></pre><script>
  const form = $("#filters").serialize();
  const object = $.param({ q: "red shoes", tag: ["js", "a&b"] });
  const traditional = $.param({ q: "red shoes", tag: ["js", "a&b"] }, true);
  const params = new URLSearchParams(form);
  $("#out").text([
    "form=" + form,
    "object=" + object,
    "traditional=" + traditional,
    "tags=" + params.getAll("tag").join("|"),
    "excluded=" + !params.has("disabled") + "|" + !params.has("attachment") + "|" + !params.has("action")
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "6-17", explanation: "checked·unchecked·disabled·no-name·file·submitter와 repeated tag를 한 form에 둡니다." },
            { lines: "20-22", explanation: "DOM serialize, object default array와 traditional repeated-key policy를 각각 생성합니다." },
            { lines: "23-30", explanation: "decode한 tag 순서와 제외된 세 controls를 exact booleans로 검증합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 full build에 접근 가능한 modern browser"], command: "jquery-serialize-contract.html을 열고 #out 확인" },
          output: { value: "form=q=red%20shoes&tag=js&tag=a%26b&include=sale&sort=price\nobject=q=red%20shoes&tag%5B%5D=js&tag%5B%5D=a%26b\ntraditional=q=red%20shoes&tag=js&tag=a%26b\ntags=js|a&b\nexcluded=true|true|true", explanation: ["form same-name controls와 traditional object는 repeated key, default object array는 bracket key를 사용합니다.", "unchecked·disabled·file·submit button이 serialize에서 제외됩니다."] },
          experiments: [
            { change: "form과 모든 input을 한 selection으로 합쳐 serialize합니다.", prediction: "같은 successful values가 중복될 수 있습니다.", result: "form root 하나만 serialize합니다." },
            { change: "new URLSearchParams(new FormData(form)).toString()을 비교합니다.", prediction: "space가 +로 보이고 File string 처리 때문에 file 없는 text form에서만 단순 비교가 안전합니다.", result: "target body type에 맞는 API를 선택합니다." },
            { change: "disabled를 readonly로 바꿉니다.", prediction: "readonly text control은 제출될 수 있어 disabled와 다른 결과입니다.", result: "UI 상태와 submission contract를 구분합니다." },
          ],
          sourceRefs: ["web-jquery-ajax-syntax-source", "jquery-serialize-api", "jquery-param-api", "html-form-entry-standard", "url-standard", "xhr-formdata-standard"],
        },
      ],
      diagnostics: [
        { symptom: ".serialize() 결과에서 보이는 입력 값이 빠진다.", likelyCause: "name 없음, disabled, unchecked, file 또는 form selection 범위 문제입니다.", checks: ["control의 name/disabled/checked/type을 표로 출력합니다.", "form 하나를 선택했는지 확인합니다.", "submitter/file 요구를 확인합니다."], fix: "server에 필요한 controls에 stable name을 주고 files는 FormData, submitter는 명시 경로로 처리합니다.", prevention: "form fixture의 exact encoded string과 server decoded entries를 모두 test합니다." },
      ],
    },
    {
      id: "response-conversion-json-xml-text",
      title: "dataType converter 뒤에도 syntax·MIME·schema·missing/empty 검증은 끝나지 않습니다",
      lead: "JSON object, XML Document, text string과 parsererror를 같은 transport harness에서 비교합니다.",
      explanations: [
        "dataType:'json'은 strict JSON parsing 후 JavaScript value를 done에 줍니다. malformed 또는 빈 JSON body는 parsererror가 될 수 있지만 Array 여부·field type·business range는 자동 검증하지 않습니다.",
        "dataType:'xml'은 XMLDocument를 돌려주므로 jQuery traversal이 가능하지만 child element, attribute, mixed text, namespace가 다른 schema를 한 selector로 뭉개지 않습니다. expected root와 namespace URI/localName을 검증합니다.",
        "ex10의 $(product).text()는 descendant text까지 합칠 수 있습니다. direct company text와 nested fields가 섞이면 direct Text node policy를 adapter에 명시합니다.",
        "weather default namespace와 ta missing 한 건처럼 missing과 empty를 구분합니다. nullish coalescing은 undefined/null만 대체하고 empty string은 대체하지 않습니다.",
        "dataType:'text'는 delimiter parse를 대신해 주지 않습니다. ex14처럼 row/column separator가 format이면 empty trailing row, exact column count, escaping/quoting 여부를 검증하거나 CSV/JSON 같은 정의된 format으로 바꿉니다.",
        "Content-Type 추론에만 맡기면 서버 error HTML을 JSON으로 오해할 수 있고, dataType을 강제하면 mismatched body가 parsererror가 됩니다. status·Content-Type·raw sample·converter·schema error를 서로 다른 diagnostic field로 남깁니다.",
      ],
      concepts: [
        { term: "parsererror", definition: "transport는 응답했지만 지정 converter가 body syntax를 구조화 값으로 만들지 못한 jQuery failure category입니다.", detail: ["status 200과 함께 발생할 수 있습니다.", "schema error와 구분합니다."] },
        { term: "shape validation", definition: "parse 결과가 expected array/object/root/fields/types를 갖는지 확인하는 application boundary입니다.", detail: ["JSON/XML parser가 대신하지 않습니다.", "renderer 전에 수행합니다."] },
        { term: "missing versus empty", definition: "field 자체가 없는 상태와 존재하지만 빈 문자열인 상태를 나누는 policy입니다.", detail: ["??는 empty를 대체하지 않습니다.", "0과 false도 보존합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-ajax-converter-error-matrix",
          title: "mock transport로 JSON·XML·text 변환과 malformed JSON·HTTP 503 실패를 검증합니다",
          language: "html",
          filename: "jquery-ajax-converter-matrix.html",
          purpose: "외부 API 없이 실제 $.ajax converter와 jqXHR done/fail 인자 순서를 Chrome에서 결정적으로 실행합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>ajax converter matrix</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body><pre id="out"></pre><script>
  const fixtures = {
    "mock://json": [200, "OK", '{"name":"HTML","count":"95"}', "application/json"],
    "mock://xml": [200, "OK", '<products><product name="우유" price="950"/></products>', "application/xml"],
    "mock://text": [200, "OK", "1,홍길동/2,고길동/3,임꺽정", "text/plain"],
    "mock://bad-json": [200, "OK", '{"broken":', "application/json"],
    "mock://unavailable": [503, "Service Unavailable", '{"message":"later"}', "application/json"]
  };
  $.ajaxTransport("+*", function (options) {
    if (!options.url.startsWith("mock://")) return;
    return { send: function (_headers, complete) {
      const item = fixtures[options.url];
      complete(item[0], item[1], { text: item[2] }, "Content-Type: " + item[3]);
    }, abort: function () {} };
  });
  function request(url, dataType) {
    return new Promise(resolve => {
      $.ajax({ url: url, dataType: dataType })
        .done((data, textStatus, jqXHR) => resolve({ ok: true, data: data, textStatus: textStatus, status: jqXHR.status }))
        .fail((jqXHR, textStatus, errorThrown) => resolve({ ok: false, textStatus: textStatus, status: jqXHR.status, error: errorThrown }));
    });
  }
  (async function () {
    const json = await request("mock://json", "json");
    const xml = await request("mock://xml", "xml");
    const text = await request("mock://text", "text");
    const bad = await request("mock://bad-json", "json");
    const down = await request("mock://unavailable", "json");
    document.querySelector("#out").textContent = [
      "json=" + typeof json.data + "|" + json.data.name + "|" + json.data.count,
      "xml=" + xml.data.documentElement.localName + "|" + xml.data.querySelector("product").getAttribute("name"),
      "text=" + text.data.split("/").length + "|" + text.data.split("/")[0].split(",")[1],
      "bad=" + bad.textStatus + "|" + bad.status,
      "http=" + down.textStatus + "|" + down.status + "|" + down.error
    ].join("\n");
  })();
</script></body></html>`,
          walkthrough: [
            { lines: "6-12", explanation: "five deterministic response fixtures에 status·reason·body·Content-Type을 둡니다." },
            { lines: "13-20", explanation: "학습 test 전용 ajaxTransport가 raw text response를 실제 jQuery converter로 전달합니다." },
            { lines: "21-27", explanation: "done과 fail의 서로 다른 인자 순서를 하나의 normalized result로 바꿉니다." },
            { lines: "28-41", explanation: "세 성공 data types, status 200 parsererror와 HTTP 503 error를 exact output으로 비교합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 full build와 ajaxTransport를 지원하는 modern browser"], command: "jquery-ajax-converter-matrix.html을 열고 #out 확인" },
          output: { value: "json=object|HTML|95\nxml=products|우유\ntext=3|홍길동\nbad=parsererror|200\nhttp=error|503|Service Unavailable", explanation: ["dataType별 done data shape가 다릅니다.", "malformed JSON은 HTTP 200이어도 parsererror이고 503은 error입니다."] },
          experiments: [
            { change: "JSON count를 number 95로 바꿉니다.", prediction: "converter는 둘 다 성공하지만 typeof가 달라집니다.", result: "schema adapter가 type policy를 강제합니다." },
            { change: "XML root를 parsererror document가 되게 malformed하게 만듭니다.", prediction: "text→xml converter가 parsererror failure로 갑니다.", result: "HTTP 성공과 syntax 성공을 분리합니다." },
            { change: "dataType을 생략하고 Content-Type을 text/html로 잘못 보냅니다.", prediction: "문자열로 성공해 later property access에서 실패할 수 있습니다.", result: "server MIME와 explicit contract를 함께 고칩니다." },
          ],
          sourceRefs: ["web-jquery-xml-child-source", "web-jquery-xml-attribute-source", "web-jquery-car-xml-source", "web-jquery-weather-source", "web-jquery-json-source", "web-jquery-text-source", "jquery-ajax-api", "jquery-ajax-transport-api"],
        },
      ],
      diagnostics: [
        { symptom: "status 200인데 fail의 textStatus가 parsererror다.", likelyCause: "malformed/empty JSON·XML 또는 body와 dataType mismatch입니다.", checks: ["status, Content-Type, responseText의 제한된 safe sample을 봅니다.", "expected dataType과 server error page 여부를 확인합니다.", "converter와 schema validation 단계를 분리합니다."], fix: "server가 valid body와 MIME을 반환하게 하고 client는 empty/null policy와 parse error UI를 둡니다.", prevention: "200 malformed, 204 empty, error HTML fixtures를 contract tests에 포함합니다." },
        { symptom: "weather local이 0개이거나 일부 값이 undefined/빈칸이다.", likelyCause: "default namespace·selector contract 또는 missing/empty를 무시했습니다.", checks: ["documentElement.namespaceURI와 localName을 봅니다.", "getElementsByTagNameNS 결과를 비교합니다.", "attribute hasAttribute/value와 text trim을 기록합니다."], fix: "namespace-aware adapter와 explicit missing/empty fallback을 사용합니다.", prevention: "missing ta 한 건과 empty-value fixture를 보존합니다." },
      ],
    },
    {
      id: "jqxhr-deferred-callback-contract",
      title: "jqXHR는 Deferred thenable이지만 native Promise와 같은 성공·실패 값·취소 계약이 아닙니다",
      lead: "callback 이름보다 인자 순서, late subscription, error propagation과 abort handle 보존이 중요합니다.",
      explanations: [
        "success option과 .done은 성공에서 data,textStatus,jqXHR를 받고 error option과 .fail은 jqXHR,textStatus,errorThrown를 받습니다. 원본의 response.message는 표준 field가 아니며 대부분 undefined입니다.",
        "success option도 modern jQuery에서 function array를 받을 수 있으므로 '한 개만 가능'이라는 설명은 정확하지 않습니다. .done은 request 반환 뒤 관찰자를 여러 개 추가하고 완료 후 등록해도 stored result를 받는 Deferred 표현이라는 장점이 있습니다.",
        ".always는 성공과 실패에서 인자 shape가 다릅니다. 첫 인자를 항상 data라고 가정하지 말고 공통 cleanup은 인자를 읽지 않는 finally-like 역할로 제한하거나 wrapper에서 정규화합니다.",
        ".then은 새 jQuery promise로 값을 변환·오류를 전파하고 .done은 terminal observer에 가깝습니다. jqXHR.success/error/complete methods는 이미 제거되었으므로 done/fail/always를 사용합니다.",
        "await jqXHR는 thenable assimilation으로 성공 첫 값 data를 얻을 수 있지만 status·headers·textStatus 등 나머지 성공 인자와 abort method가 await result에 남지 않습니다. migration wrapper가 {data,status,headers}와 typed error를 명시합니다.",
        "jqXHR.abort()는 client waiting을 취소하지만 server transaction rollback을 보장하지 않습니다. write 재시도에는 idempotency key·server duplicate prevention을 별도 설계합니다.",
      ],
      concepts: [
        { term: "thenable assimilation", definition: "await/Promise가 then method를 가진 외부 객체를 받아 그 fulfillment/rejection을 따라가는 동작입니다.", detail: ["native Promise identity를 뜻하지 않습니다.", "jqXHR 다중 인자를 잃을 수 있습니다."] },
        { term: "late subscription", definition: "Deferred가 이미 완료된 뒤 done/fail observer를 등록해도 기억한 결과로 호출하는 특성입니다.", detail: ["여러 observer에 유용합니다.", "callback lifecycle을 추적해야 합니다."] },
        { term: "normalized result", definition: "transport별 callback 인자 차이를 {data,status,headers} 또는 typed error 한 형태로 바꾼 application contract입니다.", detail: ["migration 경계가 됩니다.", "UI가 jqXHR를 직접 읽지 않게 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "fail alert에 undefined가 뜬다.", likelyCause: "jqXHR에 없는 message property만 읽었습니다.", checks: ["fail 인자를 세 개 모두 이름 붙여 기록합니다.", "status·textStatus·responseJSON의 allowed error shape를 확인합니다.", "HTTP/2 statusText가 빈 값일 수 있음을 고려합니다."], fix: "normalizeError(jqXHR,textStatus,errorThrown)에서 safe user message와 diagnostic code를 분리합니다.", prevention: "404·503·network status 0·parsererror fixtures를 둡니다." },
        { symptom: "await $.ajax로 바꾼 뒤 status와 abort가 사라졌다.", likelyCause: "jqXHR thenable의 첫 fulfillment 값만 await result로 사용했습니다.", checks: ["await 전 jqXHR handle을 보관했는지 봅니다.", "done 다중 인자 사용 지점을 inventory합니다.", "headers/status consumer를 찾습니다."], fix: "jqXHR를 native Promise로 명시 wrapping하고 result/error shape에 필요한 metadata를 복사합니다.", prevention: "legacy와 Fetch clients에 같은 normalized contract test를 실행합니다." },
      ],
    },
    {
      id: "error-state-taxonomy-observability",
      title: "HTTP·network/CORS·timeout·abort·parse·schema·render 오류를 한 catch로 뭉개지 않습니다",
      lead: "사용자 조치와 운영 원인이 다른 failure를 stable code와 상태 machine으로 분류합니다.",
      explanations: [
        "jQuery는 HTTP 4xx/5xx를 fail로 보내고 textStatus는 보통 error입니다. Fetch는 응답을 받으면 404도 fulfilled Response로 돌려주므로 response.ok를 애플리케이션이 검사해야 behavior parity가 생깁니다.",
        "network·DNS·CORS failure는 browser가 response details를 숨겨 jQuery status 0/error 또는 Fetch TypeError가 될 수 있습니다. curl 성공은 browser CORS 성공을 뜻하지 않습니다.",
        "timeout은 budget 초과, abort는 사용자 supersession/navigation 같은 예상 취소일 수 있습니다. 둘을 같은 빨간 오류 toast와 retry telemetry로 기록하지 않습니다.",
        "parsererror는 syntax/converter failure, schema error는 parse된 값의 shape/type failure, render error는 safe model을 view로 옮기는 code failure입니다. stage를 기록하면 server·client ownership을 바로 찾습니다.",
        "state는 idle→loading→success|empty|error|canceled로 명시하고 previous content를 유지할지 clear할지 제품 정책을 둡니다. expected abort는 error live region을 시끄럽게 갱신하지 않습니다.",
        "telemetry에는 request ID, endpoint template, method, duration, status, stage, category, retry count, abort reason을 남기되 query PII·raw response·credential은 기록하지 않습니다.",
      ],
      concepts: [
        { term: "failure stage", definition: "request가 transport·HTTP policy·parse·schema·render 중 어디서 실패했는지 나타내는 값입니다.", detail: ["ownership을 좁힙니다.", "사용자 message와 분리합니다."] },
        { term: "expected cancellation", definition: "새 검색·navigation·dispose처럼 제품 흐름상 의도된 요청 중단입니다.", detail: ["오류 toast 대상이 아닐 수 있습니다.", "측정은 별도로 남깁니다."] },
        { term: "request correlation", definition: "한 사용자 intent와 network attempt·response·render log를 연결하는 privacy-safe ID입니다.", detail: ["stale race를 분석합니다.", "서버 trace와 연계할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "브라우저에서는 CORS error인데 Postman에서는 200이다.", likelyCause: "non-browser client는 browser CORS enforcement를 하지 않습니다.", checks: ["request/response origin과 preflight를 봅니다.", "Access-Control-Allow-Origin/Credentials/Methods/Headers를 확인합니다.", "cookie SameSite/Secure 정책을 별도 봅니다."], fix: "server가 exact origin·method·headers·credentials contract를 허용하거나 same-origin backend proxy를 사용합니다.", prevention: "실제 browser cross-origin integration test를 둡니다." },
        { symptom: "사용자가 새 검색을 했을 뿐인데 전역 오류 toast가 뜬다.", likelyCause: "abort를 일반 failure와 동일 처리했습니다.", checks: ["textStatus/error.name과 abort reason을 확인합니다.", "global ajaxError가 expected abort를 필터링하는지 봅니다.", "generation token과 request owner를 기록합니다."], fix: "expected cancel은 canceled state로 분류하고 최신 request UI를 유지합니다.", prevention: "supersession·navigation·timeout을 서로 다른 fixtures로 검증합니다." },
      ],
    },
    {
      id: "cancellation-timeout-latest-intent",
      title: "이전 요청 abort와 generation token을 함께 사용해 stale response와 stale finally를 막습니다",
      lead: "취소가 늦거나 transport가 무시해도 최신 intent만 view와 loading을 변경해야 합니다.",
      explanations: [
        "자동완성·필터처럼 inputs가 연속되면 old slow response가 new fast response 뒤 도착할 수 있습니다. completion order는 request order가 아니므로 마지막 도착을 그대로 render하면 화면이 과거로 돌아갑니다.",
        "새 intent에서 이전 jqXHR.abort()를 호출하면 bandwidth와 callback을 줄일 수 있습니다. 그러나 이미 response가 완료됐거나 server 작업이 계속되고 custom transport가 취소를 완전히 지키지 않을 수 있어 generation/token guard도 필요합니다.",
        "load마다 token=++latest를 capture하고 done뿐 아니라 fail/finally에서도 token===latest일 때만 view/loading/focus를 갱신합니다. stale finally가 최신 request의 spinner를 꺼 버리는 bug도 막습니다.",
        "manual abort와 timeout은 둘 다 status 0일 수 있지만 textStatus를 abort/timeout으로 분리합니다. timeout retry는 idempotent GET과 제한된 transient status만 bounded exponential backoff+jitter로 수행합니다.",
        "component dispose에서 current jqXHR를 abort하고 observer/events를 해제합니다. abort handler가 이후 global state를 mutate하지 않도록 owner active token도 invalidate합니다.",
        "Fetch에서는 AbortController signal을 request에 전달하고 timeout은 AbortSignal.timeout 또는 controller+timer fallback으로 구현합니다. abort reason name을 UI policy에 매핑하되 지원 browser 범위를 test합니다.",
      ],
      concepts: [
        { term: "latest-intent token", definition: "각 request 시작 때 증가시키고 completion이 현재 intent인지 검사하는 generation 값입니다.", detail: ["abort가 불완전해도 보호합니다.", "finally에도 적용합니다."] },
        { term: "supersession", definition: "새 사용자 intent가 이전 in-flight request 결과를 더 이상 유효하지 않게 만드는 사건입니다.", detail: ["expected abort가 될 수 있습니다.", "server write 취소 보장은 아닙니다."] },
        { term: "bounded retry", definition: "멱등성·status·attempt·backoff 상한을 둔 제한적 재시도입니다.", detail: ["abort/validation/most 4xx는 재시도하지 않습니다.", "Retry-After를 존중합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-latest-intent-token",
          title: "완료 순서가 뒤집혀도 latest token만 render와 loading을 변경합니다",
          language: "html",
          filename: "jquery-latest-intent.html",
          purpose: "실제 시간과 network 없이 controlled Deferred를 역순 resolve해 stale done/finally guard를 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>latest intent</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body><pre id="out"></pre><script>
  let latest = 0;
  let view = "idle";
  let loading = false;
  const events = [];
  function controlled() {
    const deferred = $.Deferred();
    return { promise: deferred.promise(), resolve: value => deferred.resolve(value) };
  }
  function load(source) {
    const token = ++latest;
    loading = true;
    source.promise
      .done(value => {
        if (token === latest) { view = value; events.push("rendered:" + value); }
        else events.push("ignored:" + value);
      })
      .always(() => { if (token === latest) loading = false; });
  }
  const oldRequest = controlled();
  const newRequest = controlled();
  load(oldRequest);
  load(newRequest);
  newRequest.resolve("new");
  oldRequest.resolve("old");
  $("#out").text([
    "events=" + events.join("|"),
    "view=" + view,
    "token=" + latest,
    "loading=" + loading
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "6-14", explanation: "controlled Deferred와 canonical latest/view/loading state를 준비합니다." },
            { lines: "15-24", explanation: "done과 always 모두 captured token이 최신일 때만 shared UI를 바꿉니다." },
            { lines: "25-30", explanation: "old를 먼저 시작하고 new를 먼저 완료해 실제 race order를 결정적으로 만듭니다." },
          ],
          run: { environment: ["jQuery 4.0.0 full build를 지원하는 modern browser"], command: "jquery-latest-intent.html을 열고 #out 확인" },
          output: { value: "events=rendered:new|ignored:old\nview=new\ntoken=2\nloading=false", explanation: ["new만 render되고 늦은 old는 관측만 됩니다.", "stale always가 latest loading state를 바꾸지 않습니다."] },
          experiments: [
            { change: "always의 token guard를 제거하고 old를 loading 중 resolve합니다.", prediction: "old finally가 최신 spinner를 조기에 끌 수 있습니다.", result: "모든 shared-state completion에 token gate가 필요합니다." },
            { change: "new load에서 old jqXHR abort도 호출합니다.", prediction: "old work를 줄이지만 token guard는 여전히 안전망입니다.", result: "cancel과 commit guard를 함께 씁니다." },
            { change: "write POST에 같은 자동 retry를 적용합니다.", prediction: "server가 이미 처리했으면 중복 side effect가 날 수 있습니다.", result: "idempotency contract 없이는 자동 재시도하지 않습니다." },
          ],
          sourceRefs: ["jquery-ajax-api", "jquery-deferred-api", "dom-abort-standard"],
        },
        {
          id: "jquery-abort-timeout-taxonomy",
          title: "mock jqXHR의 manual abort와 timeout을 서로 다른 안정적 상태로 분류합니다",
          language: "html",
          filename: "jquery-abort-timeout.html",
          purpose: "외부 지연 server 없이 ajaxTransport의 cancel handle로 abort와 timeout textStatus를 실제 jQuery에서 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>abort timeout</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body><pre id="out"></pre><script>
  $.ajaxTransport("+*", function (options) {
    if (!options.url.startsWith("slow://")) return;
    let timer;
    return {
      send: function (_headers, complete) {
        timer = setTimeout(() => complete(200, "OK", { text: '{"ok":true}' }, "Content-Type: application/json"), 100);
      },
      abort: function () { clearTimeout(timer); }
    };
  });
  function classify(settings, manualDelay) {
    return new Promise(resolve => {
      const jqXHR = $.ajax(settings)
        .fail((xhr, textStatus, errorThrown) => resolve(textStatus + "|" + xhr.status + "|" + errorThrown));
      if (manualDelay !== undefined) setTimeout(() => jqXHR.abort(), manualDelay);
    });
  }
  (async function () {
    const manual = await classify({ url: "slow://manual", dataType: "json" }, 5);
    const timeout = await classify({ url: "slow://timeout", dataType: "json", timeout: 20 });
    $("#out").text(["manual=" + manual, "timeout=" + timeout].join("\n"));
  })();
</script></body></html>`,
          walkthrough: [
            { lines: "6-15", explanation: "100ms response를 예약하고 abort에서 timer를 지우는 deterministic test transport를 만듭니다." },
            { lines: "16-22", explanation: "fail의 textStatus·status·errorThrown을 stable category로 수집하고 optional manual abort를 예약합니다." },
            { lines: "23-27", explanation: "5ms user abort와 20ms jQuery timeout을 같은 100ms transport에서 비교합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 full build를 지원하는 modern browser"], command: "jquery-abort-timeout.html을 열고 #out 확인" },
          output: { value: "manual=abort|0|abort\ntimeout=timeout|0|timeout", explanation: ["둘 다 status 0이지만 textStatus와 errorThrown이 abort/timeout으로 구분됩니다.", "UI retry와 telemetry 정책도 달라야 합니다."] },
          experiments: [
            { change: "timeout을 150ms로 늘립니다.", prediction: "request가 success로 끝나 classify Promise가 fail에서 resolve되지 않습니다.", result: "test helper에 success case도 명시해야 합니다." },
            { change: "abort transport가 timer를 지우지 않게 합니다.", prediction: "late complete 시도가 발생하지만 UI token이 stale commit을 막아야 합니다.", result: "transport cancellation과 state guard가 별개입니다." },
            { change: "Fetch AbortController와 AbortSignal.timeout으로 같은 분류를 만듭니다.", prediction: "기본 user abort는 AbortError, timeout signal은 TimeoutError로 구분할 수 있습니다.", result: "browser support와 fallback을 test합니다." },
          ],
          sourceRefs: ["jquery-ajax-api", "jquery-ajax-transport-api", "dom-abort-standard", "fetch-standard"],
        },
      ],
      diagnostics: [
        { symptom: "빠르게 두 번 검색하면 첫 결과가 마지막에 화면을 덮는다.", likelyCause: "response arrival order를 intent order로 가정하고 completion을 모두 commit했습니다.", checks: ["request token/start/finish/render를 기록합니다.", "이전 jqXHR abort 여부를 봅니다.", "done과 always 모두 current token을 검사하는지 확인합니다."], fix: "새 load에서 이전 요청을 abort하고 generation이 최신인 completion만 commit합니다.", prevention: "slow-old/fast-new와 stale-finally exact race test를 둡니다." },
        { symptom: "timeout 뒤 재시도로 결제가 두 번 처리된다.", likelyCause: "client timeout을 server rollback으로 오해하고 non-idempotent write를 자동 재시도했습니다.", checks: ["server request ID와 transaction result를 조회합니다.", "idempotency key와 retry policy를 확인합니다.", "timeout이 send 전/후인지 분석합니다."], fix: "write endpoint에 idempotency key·deduplication·status reconciliation을 구현합니다.", prevention: "retry 가능 method/status와 business idempotency를 API contract에 명시합니다." },
      ],
    },
    {
      id: "safe-response-rendering-accessible-states",
      title: "응답 format이 JSON·XML이어도 untrusted data이며 text/property DOM API로만 기본 렌더링합니다",
      lead: "원본의 table HTML·inline style 문자열 연결을 model validation과 node construction으로 바꿉니다.",
      explanations: [
        "ex08~14는 XML text/attribute, JSON field와 delimiter text를 table string에 이어 $('#result').html(table)로 삽입합니다. endpoint가 외부이거나 stored data가 오염되면 HTML로 해석되어 XSS가 됩니다.",
        "safe default는 table·thead·tbody·tr·th·td elements를 만들고 values를 textContent 또는 .text(value)로 넣는 것입니다. escaping 함수를 한 번 호출했다는 추정 대신 HTML parser를 거치지 않는 sink를 선택합니다.",
        "ex13의 hex_value를 style attribute string에 이어 넣지 않습니다. strict color allowlist와 CSS.supports를 통과한 값만 element.style.backgroundColor property에 설정하고 색 이름·text label도 제공합니다.",
        "value ?? '-'는 0과 false를 보존하지만 empty string은 보존합니다. 제품상 empty도 placeholder라면 normalizeText가 trim 후 빈 값을 '-'로 바꾸고, numeric string은 schema 정책대로 parse/format합니다.",
        "table에는 caption, column headers와 scope를 제공하고 result region은 loading/empty/error/success를 text로 전달합니다. loading 중 button disabled 여부와 기존 content 유지 정책, retry button, focus 이동을 과도한 live announcement 없이 설계합니다.",
        "큰 weather table은 모든 97행을 즉시 문자열로 만드는 것보다 filter/pagination/virtualization을 검토하되 semantic table navigation과 keyboard access를 보존합니다.",
      ],
      concepts: [
        { term: "safe sink", definition: "untrusted value를 markup/code로 해석하지 않고 text 또는 검증된 property 값으로 넣는 DOM API입니다.", detail: ["textContent/.text가 대표입니다.", "URL/style은 별도 allowlist가 필요합니다."] },
        { term: "normalizer", definition: "raw response를 missing·empty·type·range 정책이 적용된 domain model로 바꾸는 함수입니다.", detail: ["renderer가 format별 DOM을 읽지 않습니다.", "schema failure를 조기에 만듭니다."] },
        { term: "async view state", definition: "idle/loading/success/empty/error/canceled와 current data를 명시한 UI model입니다.", detail: ["접근성 status와 연결합니다.", "stale request가 갱신하지 못합니다."] },
      ],
      codeExamples: [
        {
          id: "safe-ajax-table-rendering",
          title: "악성 이름·0·빈 값·색상 문자열을 safe DOM table로 렌더링합니다",
          language: "html",
          filename: "safe-ajax-render.html",
          purpose: "원본의 .html(table)과 inline style interpolation을 제거하고 literal text·nullish·allowlist 결과를 exact output으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>safe render</title></head><body>
<table><caption>점수와 색상</caption><thead><tr><th scope="col">이름</th><th scope="col">점수</th><th scope="col">색상</th></tr></thead><tbody id="rows"></tbody></table>
<pre id="out"></pre><script>
  window.xss = 0;
  const records = [
    { name: '<img src=x onerror="window.xss=1">', count: 0, color: "#336699" },
    { name: null, count: "", color: "red; background:url(javascript:alert(1))" }
  ];
  function text(value) {
    if (value === null || value === undefined) return "-";
    const result = String(value).trim();
    return result === "" ? "-" : result;
  }
  function safeColor(value) { return /^#[0-9a-f]{6}$/i.test(value) ? value : null; }
  const tbody = document.querySelector("#rows");
  records.forEach(record => {
    const row = document.createElement("tr");
    [text(record.name), text(record.count)].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    const colorCell = document.createElement("td");
    const color = safeColor(record.color);
    colorCell.textContent = color || "사용 불가";
    if (color) colorCell.style.backgroundColor = color;
    row.append(colorCell);
    tbody.append(row);
  });
  const cells = tbody.querySelectorAll("td");
  document.querySelector("#out").textContent = [
    "rows=" + tbody.rows.length,
    "literal-name=" + (cells[0].textContent === records[0].name),
    "injected-elements=" + tbody.querySelectorAll("img").length,
    "xss=" + window.xss,
    "counts=" + cells[1].textContent + "|" + cells[4].textContent,
    "valid-colors=" + [...tbody.rows].filter(row => row.cells[2].style.backgroundColor !== "").length
  ].join("\n");
</script></body></html>`,
          walkthrough: [
            { lines: "5-8", explanation: "HTML-looking name, numeric zero, empty count와 malicious style-like value를 fixture로 둡니다." },
            { lines: "9-15", explanation: "nullish·empty를 분리한 text normalizer와 strict six-digit hex allowlist를 만듭니다." },
            { lines: "16-31", explanation: "nodes와 textContent/property만 사용해 table을 구성합니다." },
            { lines: "32-40", explanation: "literal text, injected node 0, 0 보존, empty placeholder와 one valid color를 검증합니다." },
          ],
          run: { environment: ["modern browser"], command: "safe-ajax-render.html을 열고 #out 확인" },
          output: { value: "rows=2\nliteral-name=true\ninjected-elements=0\nxss=0\ncounts=0|-\nvalid-colors=1", explanation: ["HTML-looking 값은 literal text이고 img/onerror가 만들어지지 않습니다.", "0은 보존되고 empty count와 invalid color는 정책대로 처리됩니다."] },
          experiments: [
            { change: "cell.textContent 대신 row.innerHTML 문자열에 name을 연결합니다.", prediction: "img element가 생성되고 error event에서 code가 실행될 수 있습니다.", result: "응답 format과 DOM sink 안전성은 별개입니다." },
            { change: "color allowlist를 제거하고 style attribute string을 조립합니다.", prediction: "markup/CSS context 경계가 깨질 수 있습니다.", result: "검증된 value를 style property로만 설정합니다." },
            { change: "count fallback을 record.count || '-'로 바꿉니다.", prediction: "numeric 0이 '-'로 잘못 바뀝니다.", result: "nullish와 empty policy를 명시합니다." },
          ],
          sourceRefs: ["web-jquery-xml-child-source", "web-jquery-xml-attribute-source", "web-jquery-car-xml-source", "web-jquery-weather-source", "web-jquery-json-source", "web-jquery-cross-origin-json-source", "web-jquery-text-source", "dom-standard", "owasp-xss-prevention", "wai-table-tutorial"],
        },
      ],
      diagnostics: [
        { symptom: "API의 상품명 때문에 table markup이 깨지거나 예상치 못한 element가 생긴다.", likelyCause: "응답 field를 HTML 문자열에 연결해 .html()로 해석했습니다.", checks: ["innerHTML/.html/insertAdjacentHTML과 template interpolation을 찾습니다.", "raw response가 markup characters를 포함하는지 봅니다.", "style/URL sinks도 별도로 inventory합니다."], fix: "validated model에서 DOM nodes를 만들고 values는 textContent/.text, style은 strict allowlist+property로 설정합니다.", prevention: "hostile fixture와 CSP, DOM node count assertions를 둡니다." },
        { symptom: "0점이 '-'로 표시되거나 빈 지역명이 그대로 빈 cell이 된다.", likelyCause: "truthy fallback과 nullish fallback을 제품 policy 없이 섞었습니다.", checks: ["raw value/type와 normalized value를 비교합니다.", "null/undefined/empty/whitespace/0/false fixtures를 돌립니다.", "schema의 nullable 규칙을 확인합니다."], fix: "field별 normalizeText/number policy를 만들고 0과 false를 보존합니다.", prevention: "boundary-value table tests를 둡니다." },
      ],
    },
    {
      id: "cors-credentials-csrf-cache-global-events",
      title: "cross-origin·credential·CSRF·cache·global events는 서로 다른 보안·운영 계약입니다",
      lead: "ex13의 외부 API 성공을 보편적 규칙으로 만들지 않고 browser와 server 양쪽 정책을 확인합니다.",
      explanations: [
        "origin은 scheme·host·port 조합입니다. 다른 origin response를 script가 읽을 수 있는지는 server CORS headers와 browser check가 결정하며 client에 CORS를 끄는 해결 option은 없습니다.",
        "mode:'no-cors'는 읽을 수 있는 해결책이 아니라 opaque response를 만들 수 있습니다. status/body/headers가 필요한 JSON UI에서는 사용할 수 없습니다. JSONP는 remote script execution이며 jQuery 4는 json에서 JSONP로 자동 승격하지 않습니다.",
        "credential 포함은 jQuery xhrFields:{withCredentials:true}, Fetch credentials:'include'와 server의 exact Access-Control-Allow-Origin 및 Access-Control-Allow-Credentials:true, cookie SameSite/Secure 정책이 함께 맞아야 합니다. credential response에 wildcard origin은 사용할 수 없습니다.",
        "CORS는 response read permission이고 CSRF 방어가 아닙니다. state-changing request는 SameSite cookie, CSRF token/origin verification과 idempotency를 server policy로 구현합니다.",
        "jQuery cache:false는 주로 GET/HEAD URL에 timestamp query를 붙이는 cache busting이고 Fetch cache modes와 완전 동치가 아닙니다. no-cache도 저장 금지가 아니라 재검증 의미일 수 있어 HTTP cache header를 함께 설계합니다.",
        "ajaxStart/Stop/Error 같은 global events는 jQuery Ajax만 보고 Fetch는 보지 않습니다. 혼합 migration에서는 explicit request wrapper가 activity counter와 telemetry를 소유하고 expected abort를 global error로 알리지 않습니다.",
        "$.ajaxSetup은 이후 plugin requests까지 바꾸는 hidden global state가 됩니다. base URL·headers·credentials·telemetry를 explicit client factory/wrapper에 넣고 call site override와 test isolation을 제공합니다.",
      ],
      concepts: [
        { term: "CORS", definition: "cross-origin response를 browser JavaScript가 읽도록 server가 허용하는 HTTP protocol입니다.", detail: ["인증·CSRF와 다릅니다.", "preflight가 생길 수 있습니다."] },
        { term: "credential mode", definition: "cookie·HTTP authentication 같은 credentials를 cross-origin request에 포함하고 response를 노출할지 정하는 양쪽 계약입니다.", detail: ["client flag만으로 충분하지 않습니다.", "wildcard origin 제한이 있습니다."] },
        { term: "global request instrumentation", definition: "전체 요청의 loading count·duration·error를 관측하는 계층입니다.", detail: ["jQuery global events는 Fetch를 못 봅니다.", "공통 wrapper로 이관합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "credentials include를 켰는데 cookie가 없거나 response가 CORS로 차단된다.", likelyCause: "server allow-origin/credentials 또는 cookie SameSite/Secure/third-party policy가 함께 맞지 않습니다.", checks: ["preflight와 actual response headers를 확인합니다.", "Set-Cookie attributes와 browser storage를 봅니다.", "exact origin과 wildcard를 비교합니다."], fix: "client·CORS server·cookie policy를 한 contract로 수정하고 필요하면 same-origin BFF를 사용합니다.", prevention: "credentialed cross-origin browser test와 CSRF test를 별도로 둡니다." },
        { symptom: "Fetch로 옮긴 요청만 global spinner에 잡히지 않는다.", likelyCause: "jQuery ajaxStart/ajaxStop에만 loading count를 연결했습니다.", checks: ["request implementations 목록을 만듭니다.", "global event listener와 fetch wrapper를 비교합니다.", "concurrent count decrement가 finally/token safe한지 봅니다."], fix: "jQuery와 Fetch adapters가 공유하는 explicit activity/telemetry wrapper를 사용합니다.", prevention: "mixed two-request concurrency contract test를 둡니다." },
      ],
    },
    {
      id: "jquery4-ajax-changes-migration-inventory",
      title: "jQuery 4의 Ajax·FormData·JSONP·script 변화와 plugin coupling을 먼저 inventory합니다",
      lead: "API 이름 치환 전에 현재 version·build·global hooks·plugins·observable behavior를 고정합니다.",
      explanations: [
        "jQuery 4 full과 slim의 차이를 lockfile·served asset에서 확인합니다. slim에는 Ajax가 없으므로 migration 중 우연히 slim으로 바꾸면 request layer 전체가 사라집니다.",
        "jQuery 4는 dataType:'json' request를 callback placeholder 때문에 JSONP로 자동 승격하지 않습니다. JSONP는 명시 dataType:'jsonp'가 필요하지만 신규 code에서는 reviewed CORS API 또는 same-origin proxy를 우선합니다.",
        "dataType:'script'를 명시하지 않은 script response는 자동 실행되지 않습니다. untrusted remote script 실행을 data retrieval과 섞지 않고 CSP·SRI·module loading policy로 분리합니다.",
        "jQuery 4는 FormData/binary data 지원을 보강해 기본 처리할 수 있지만 3.x/4.x 병행 legacy code에서는 data:formData, processData:false, contentType:false를 명시해 boundary와 multipart header ownership을 분명히 합니다.",
        "inventory에는 $.ajax/$.get/$.post/.load, $.ajaxSetup/prefilter/transport, global events, jqXHR methods, plugin requests, JSONP/script, credential/cache/timeout defaults, tests와 server endpoints를 기록합니다.",
        ".load(url selector)는 HTML을 selected elements에 삽입하고 반환값이 jqXHR가 아니라 jQuery collection입니다. untrusted HTML과 cancellation 요구가 있으면 explicit request+safe render 경계로 옮깁니다.",
        "upgrade와 removal을 같은 change로 하지 않습니다. exact version upgrade+jQuery Migrate warnings를 먼저 해결하고 behavior tests가 녹색인 작은 feature부터 Fetch adapter로 전환합니다.",
      ],
      concepts: [
        { term: "dependency surface", definition: "직접 호출뿐 아니라 plugin·global hook·prefilter·build variant가 jQuery Ajax에 기대는 전체 범위입니다.", detail: ["검색만으로 끝나지 않습니다.", "runtime instrumentation을 보강합니다."] },
        { term: "JSONP", definition: "script tag와 global callback으로 cross-origin data처럼 code를 실행하는 legacy transport입니다.", detail: ["CORS JSON과 다릅니다.", "remote code trust가 필요합니다."] },
        { term: "strangler migration", definition: "기존 system을 유지한 채 경계별 새 구현으로 traffic/feature를 점진 전환하는 방식입니다.", detail: ["rollback이 쉽습니다.", "한동안 두 transports가 공존합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "jQuery 4 upgrade 뒤 JSON endpoint가 JSONP callback을 호출하지 않는다.", likelyCause: "과거의 암묵적 JSON→JSONP 승격에 의존했습니다.", checks: ["dataType과 callback placeholder를 봅니다.", "server가 CORS JSON을 제공하는지 확인합니다.", "remote script trust/CSP를 평가합니다."], fix: "가능하면 CORS JSON/same-origin proxy로 옮기고 불가피한 legacy만 explicit jsonp로 격리합니다.", prevention: "upgrade guide와 endpoint transport inventory를 release gate로 둡니다." },
        { symptom: ".load() 결과에 fail이나 abort를 호출할 수 없다.", likelyCause: ".load가 jqXHR가 아니라 jQuery collection을 반환하는 점을 놓쳤습니다.", checks: ["return value와 callback signature를 공식 API에서 확인합니다.", "cancellation/error requirements를 정리합니다.", "inserted HTML trust를 봅니다."], fix: "explicit $.ajax/Fetch request를 사용해 jqXHR/controller와 safe rendering을 소유합니다.", prevention: "shorthand별 반환 contract를 migration matrix에 기록합니다." },
      ],
    },
    {
      id: "fetch-equivalence-response-policy",
      title: "Fetch는 HTTP error를 reject하지 않으므로 Response.ok·parse·schema를 adapter에서 명시합니다",
      lead: "문법 치환이 아니라 jQuery fail과 같은 observable error contract를 다시 만듭니다.",
      explanations: [
        "fetch()는 network algorithm이 response를 얻으면 Promise<Response>를 fulfill합니다. 404/500은 network failure가 아니므로 catch에 가지 않고 response.ok가 false입니다.",
        "adapter는 status와 allowed Content-Type을 확인하고 body를 한 번 소비한 뒤 !ok를 HttpError로 만듭니다. error body도 JSON이 아닐 수 있어 safe fallback과 size/logging limit를 둡니다.",
        "Response.json/text/blob/formData는 body stream을 소비합니다. 같은 Response를 두 번 읽으면 TypeError가 될 수 있어 두 consumer가 정말 필요하면 consumption 전에 clone하지만 large body memory/stream cost를 고려합니다.",
        "dataType:'json'은 response.json(), xml은 response.text()+DOMParser+parsererror/root/namespace 검사, text는 response.text()로 옮깁니다. parser 뒤 domain schema adapter는 그대로 공유합니다.",
        "jqXHR.abort는 AbortController.abort, timeout은 AbortSignal.timeout 또는 fallback timer, xhrFields.withCredentials는 credentials:'include', statusCode는 response.status policy로 대응합니다.",
        "jQuery cache:false와 Fetch cache setting을 mechanical one-to-one으로 바꾸지 않고 endpoint cache semantics·server Cache-Control/ETag와 함께 재설계합니다.",
      ],
      concepts: [
        { term: "Response.ok", definition: "HTTP status가 200~299인지 나타내는 Fetch Response boolean입니다.", detail: ["false여도 fetch Promise는 fulfill할 수 있습니다.", "application policy가 검사합니다."] },
        { term: "body consumption", definition: "Response body stream을 json/text 등으로 한 번 읽어 unusable 상태로 만드는 과정입니다.", detail: ["double read가 실패합니다.", "필요 시 읽기 전 clone합니다."] },
        { term: "HttpError", definition: "status·code·safe body metadata를 가진 application-defined HTTP policy error입니다.", detail: ["network TypeError와 구분합니다.", "UI와 telemetry가 안정적으로 분류합니다."] },
      ],
      codeExamples: [
        {
          id: "fetch-response-ok-policy",
          title: "404 Response도 resolve된 뒤 adapter의 ok policy에서 HttpError가 됨을 검증합니다",
          language: "html",
          filename: "fetch-response-policy.html",
          purpose: "network 없이 native Response objects로 success·HTTP error·single body consumption을 결정적으로 비교합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>fetch response policy</title></head><body><pre id="out"></pre><script>
  class HttpError extends Error {
    constructor(status, message) { super(message); this.name = "HttpError"; this.status = status; }
  }
  async function getJson(response) {
    const data = await response.json();
    if (!response.ok) throw new HttpError(response.status, data.message || "요청 실패");
    if (!data || typeof data !== "object") throw new TypeError("응답 구조 오류");
    return { status: response.status, data: data };
  }
  (async function () {
    const ok = new Response('{"id":7,"name":"Ada"}', { status: 200, headers: { "Content-Type": "application/json" } });
    const missing = new Response('{"message":"missing"}', { status: 404, headers: { "Content-Type": "application/json" } });
    const rawStatus = missing.status;
    const rawOk = missing.ok;
    const success = await getJson(ok);
    let policy;
    try { await getJson(missing); }
    catch (error) { policy = error.name + "|" + error.status + "|" + error.message; }
    document.querySelector("#out").textContent = [
      "resolved=" + rawStatus + "|" + rawOk,
      "success=" + success.status + "|" + success.data.id + "|" + success.data.name,
      "policy=" + policy,
      "body-used=" + ok.bodyUsed + "|" + missing.bodyUsed
    ].join("\n");
  })();
</script></body></html>`,
          walkthrough: [
            { lines: "3-9", explanation: "HTTP policy error와 parse→ok→shape 순서를 가진 JSON adapter를 만듭니다." },
            { lines: "11-15", explanation: "network 없는 native 200/404 Response를 만들고 404의 raw status/ok를 먼저 읽습니다." },
            { lines: "16-26", explanation: "success와 HttpError 결과, 두 body가 한 번 소비됐음을 출력합니다." },
          ],
          run: { environment: ["Fetch Response API를 지원하는 modern browser"], command: "fetch-response-policy.html을 열고 #out 확인" },
          output: { value: "resolved=404|false\nsuccess=200|7|Ada\npolicy=HttpError|404|missing\nbody-used=true|true", explanation: ["404 Response는 객체로 존재하며 ok=false입니다.", "adapter가 body를 읽고 explicit HttpError로 바꿉니다."] },
          experiments: [
            { change: "missing.json()을 getJson 전에 한 번 호출합니다.", prediction: "두 번째 body consumption에서 TypeError가 납니다.", result: "body owner를 하나로 정하거나 읽기 전 clone합니다." },
            { change: "404 body를 HTML로 바꿉니다.", prediction: "현재 adapter는 JSON parse에서 먼저 SyntaxError가 납니다.", result: "status/Content-Type/error-body fallback 순서를 API 계약에 맞게 설계합니다." },
            { change: "response.ok 검사를 제거합니다.", prediction: "404 payload가 success data처럼 UI에 전달됩니다.", result: "jQuery fail parity가 깨집니다." },
          ],
          sourceRefs: ["fetch-standard", "http-semantics", "dom-abort-standard"],
        },
      ],
      diagnostics: [
        { symptom: "Fetch로 바꾸자 404가 catch에 들어오지 않고 success rendering에서 깨진다.", likelyCause: "network rejection과 HTTP error response를 같은 것으로 가정했습니다.", checks: ["response.status/ok를 parse 전에 기록합니다.", "adapter에 explicit HTTP policy가 있는지 봅니다.", "jQuery fail fixtures와 비교합니다."], fix: "!response.ok를 typed HttpError로 바꾸고 success path에는 validated data만 반환합니다.", prevention: "200·204·404·503·network·bad JSON contract matrix를 양 clients에 실행합니다." },
        { symptom: "응답을 log한 뒤 response.json()이 body already used로 실패한다.", likelyCause: "log/debug layer가 body를 먼저 소비했습니다.", checks: ["bodyUsed와 모든 json/text calls를 찾습니다.", "service worker/telemetry wrapper도 확인합니다.", "clone 시점을 봅니다."], fix: "body consumption owner를 adapter 하나로 두고 필요한 safe summary만 그 결과에서 기록합니다.", prevention: "double-read test와 raw body logging 금지 정책을 둡니다." },
      ],
    },
    {
      id: "behavior-first-strangler-contract-tests",
      title: "transport→normalizer→renderer를 분리하고 jQuery·Fetch에 같은 behavior contract를 실행합니다",
      lead: "한 번에 전면 rewrite하지 않고 observable 결과가 같은 작은 endpoint부터 adapter만 교체합니다.",
      explanations: [
        "UI가 $.ajax options·jqXHR·XMLDocument를 직접 읽으면 migration surface가 넓습니다. jqueryClient/fetchClient는 {status,data,headers} 또는 HttpError·CanceledError 한 contract를 반환하고 parser/normalizer/renderer는 transport를 모르게 합니다.",
        "contract matrix는 method, query ordering/repeated fields, body/header, credentials, 200/204/404/503, malformed/empty, schema, timeout/abort, latest race, cache와 telemetry를 같은 fixtures로 두 clients에 실행합니다.",
        "live Makeup API는 optional integration smoke test로만 두고 exact tests는 captured minimal fixture 또는 local mock server를 사용합니다. 외부 schema drift가 lesson build를 깨뜨리지 않게 합니다.",
        "첫 migration 대상은 plugin/global hook 의존이 적고 GET처럼 rollback이 쉬운 feature입니다. feature flag와 adapter injection으로 사용자 일부 또는 test route에서 Fetch를 켜고 metrics를 비교합니다.",
        "비교할 metrics는 success/error category, p50/p95 duration, canceled/stale count, payload/cache, UI state/accessibility와 error support tickets입니다. 단순 bundle bytes만 보지 않습니다.",
        "parity가 확인되면 해당 feature의 jQuery dependency와 global coupling을 제거합니다. 마지막 consumer가 사라지기 전에는 jQuery 자체를 삭제하지 않고 plugin·build·tests를 재감사합니다.",
      ],
      concepts: [
        { term: "contract test", definition: "서로 다른 implementations에 같은 inputs/failures를 주고 동일한 observable result를 요구하는 test입니다.", detail: ["migration drift를 잡습니다.", "implementation detail을 고정하지 않습니다."] },
        { term: "adapter injection", definition: "UI가 concrete jQuery/Fetch 대신 agreed client interface를 주입받는 구조입니다.", detail: ["feature flag/rollback이 쉽습니다.", "test double을 넣을 수 있습니다."] },
        { term: "behavior parity", definition: "API 문법이 아니라 status·data·error·cancel·UI 결과가 사용자와 caller 관점에서 동등한 상태입니다.", detail: ["wire 차이는 의도적으로 문서화할 수 있습니다.", "숨은 regression을 줄입니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-fetch-client-parity",
          title: "jQuery-style callback과 Fetch Response를 같은 normalized result·HttpError로 맞춥니다",
          language: "html",
          filename: "jquery-fetch-parity.html",
          purpose: "실제 library transport 없이 두 adapter의 externally observable contract를 success와 503에서 비교합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>client parity</title></head><body><pre id="out"></pre><script>
  class HttpError extends Error {
    constructor(status, message) { super(message); this.name = "HttpError"; this.status = status; }
  }
  function fakeJqXHR(fixture) {
    return {
      done(handler) {
        if (fixture.status < 400) handler(fixture.body, "success", { status: fixture.status });
        return this;
      },
      fail(handler) {
        if (fixture.status >= 400) handler({ status: fixture.status, responseJSON: fixture.body }, "error", fixture.reason);
        return this;
      }
    };
  }
  function jqueryClient(fixture) {
    return new Promise((resolve, reject) => {
      fakeJqXHR(fixture)
        .done((data, _text, xhr) => resolve({ status: xhr.status, data: data }))
        .fail((xhr, _text, error) => reject(new HttpError(xhr.status, xhr.responseJSON.message || error)));
    });
  }
  async function fetchClient(response) {
    const data = await response.json();
    if (!response.ok) throw new HttpError(response.status, data.message || response.statusText);
    return { status: response.status, data: data };
  }
  function summarize(result) { return result.status + "|" + result.data.id + "|" + result.data.name; }
  function summarizeError(error) { return error.name + "|" + error.status + "|" + error.message; }
  (async function () {
    const okFixture = { status: 200, body: { id: 7, name: "Ada" }, reason: "OK" };
    const badFixture = { status: 503, body: { message: "later" }, reason: "Service Unavailable" };
    const jqOk = await jqueryClient(okFixture);
    const fetchOk = await fetchClient(new Response(JSON.stringify(okFixture.body), { status: 200 }));
    let jqBad; let fetchBad;
    try { await jqueryClient(badFixture); } catch (error) { jqBad = summarizeError(error); }
    try { await fetchClient(new Response(JSON.stringify(badFixture.body), { status: 503 })); } catch (error) { fetchBad = summarizeError(error); }
    document.querySelector("#out").textContent = [
      "jquery=" + summarize(jqOk),
      "fetch=" + summarize(fetchOk),
      "success-parity=" + (summarize(jqOk) === summarize(fetchOk)),
      "jquery-error=" + jqBad,
      "fetch-error=" + fetchBad,
      "error-parity=" + (jqBad === fetchBad)
    ].join("\n");
  })();
</script></body></html>`,
          walkthrough: [
            { lines: "3-13", explanation: "HttpError와 최소 jqXHR callback contract를 deterministic fake로 만듭니다." },
            { lines: "14-25", explanation: "두 clients가 서로 다른 raw interface를 같은 result/error shape로 normalize합니다." },
            { lines: "28-42", explanation: "200과 503 fixtures를 두 clients에 실행해 success/error parity를 비교합니다." },
          ],
          run: { environment: ["Promise와 Fetch Response를 지원하는 modern browser"], command: "jquery-fetch-parity.html을 열고 #out 확인" },
          output: { value: "jquery=200|7|Ada\nfetch=200|7|Ada\nsuccess-parity=true\njquery-error=HttpError|503|later\nfetch-error=HttpError|503|later\nerror-parity=true", explanation: ["raw APIs는 달라도 normalized success와 failure contract가 같습니다.", "UI는 transport-specific callback 인자를 몰라도 됩니다."] },
          experiments: [
            { change: "fetchClient에서 response.ok 검사를 제거합니다.", prediction: "503이 success result가 되어 error parity가 깨집니다.", result: "behavior contract가 missing HTTP policy를 즉시 찾습니다." },
            { change: "jQuery error wrapper가 errorThrown만 message로 사용합니다.", prediction: "server safe error body와 다른 message가 되어 parity가 깨집니다.", result: "error normalization precedence를 합의합니다." },
            { change: "same contract에 abort·timeout·parsererror fixtures를 추가합니다.", prediction: "transport별 raw names를 application categories로 map해야 합니다.", result: "migration coverage가 production failure까지 넓어집니다." },
          ],
          sourceRefs: ["jquery-ajax-api", "jquery-deferred-api", "fetch-standard", "dom-abort-standard"],
        },
      ],
      diagnostics: [
        { symptom: "성공 화면은 같은데 Fetch 전환 뒤 오류·취소·spinner 동작만 달라진다.", likelyCause: "happy-path data만 비교하고 error/finally/global lifecycle contract를 고정하지 않았습니다.", checks: ["failure matrix와 activity counter를 두 clients에 실행합니다.", "abort/timeout/stale/loading transitions를 snapshot합니다.", "error normalization과 accessibility message를 비교합니다."], fix: "normalized result/error/state contract를 만들고 adapters에 같은 tests를 적용합니다.", prevention: "feature rollout gate에 behavior parity와 rollback metric을 둡니다." },
      ],
      comparisons: [
        { title: "이식 전략 선택", options: [
          { name: "현행 유지", chooseWhen: "검증된 plugins와 넓은 jQuery Ajax surface가 안정적이고 교체 가치가 작을 때", avoidWhen: "unsupported version·취약 global coupling·변경 불능이 클 때", tradeoffs: ["rewrite risk가 낮습니다.", "dependency/upgrade ownership은 남습니다."] },
          { name: "점진 adapter 이식", chooseWhen: "endpoint·feature 경계와 contract tests를 만들 수 있을 때", avoidWhen: "UI가 global jqXHR state에 얽혀 경계가 전혀 없을 때", tradeoffs: ["rollback과 학습이 쉽습니다.", "두 clients가 잠시 공존합니다."] },
          { name: "전면 rewrite", chooseWhen: "surface가 작고 behavior inventory·tests·rollback이 충분할 때", avoidWhen: "plugins·global events·unknown endpoints가 많을 때", tradeoffs: ["종료 상태가 단순합니다.", "한 번의 regression blast radius가 큽니다."] },
        ] },
      ],
      expertNotes: [
        "OpenTelemetry traceparent 같은 correlation을 도입할 때 cross-origin allow-headers/preflight와 privacy policy를 함께 설계합니다.",
        "streaming·upload progress·service worker·binary/download 요구는 Fetch/XHR 능력이 다르므로 기능별 adapter가 필요하고 단일 만능 wrapper를 만들지 않습니다.",
      ],
    },
    {
      id: "testing-release-operations",
      title: "mock converter test·local HTTP contract·real browser CORS·운영 관측을 층별로 검증합니다",
      lead: "live 외부 API 하나가 성공한 화면을 테스트 완료로 보지 않습니다.",
      explanations: [
        "pure tests는 normalizer의 null/empty/0/type/range와 error mapping, token state를 빠르게 검증합니다. ajaxTransport·fake Response는 jQuery converter와 Fetch policy를 외부 network 없이 결정적으로 확인합니다.",
        "local integration server는 query/form/JSON/multipart echo, 200 JSON/XML/text, 204, 404/503 JSON·HTML, malformed body, delay, disconnect, ETag/304를 제공합니다. 실제 wire headers/body를 assertion합니다.",
        "cross-origin browser test는 다른 port에서 preflight allow/deny, credentials/wildcard, cookie policy와 CSP connect-src를 확인합니다. unit mock은 browser enforcement를 완전히 재현하지 못합니다.",
        "E2E는 double click/typing, slow old-fast new, manual abort, navigation dispose, retry, loading/empty/error focus·announcement와 safe hostile content를 검증합니다.",
        "external Makeup API smoke는 optional·quarantined test로 status/CORS/minimum schema만 확인하고 exact count/content에 release를 걸지 않습니다. contract 변화는 alert와 fixture update review로 다룹니다.",
        "release 전 jQuery full version·Migrate warnings·plugin requests·Fetch rollout flag·error metrics·rollback path를 확인합니다. deploy 후 category별 error/stale/cancel/duration과 server correlation을 감시합니다.",
      ],
      concepts: [
        { term: "mock transport", definition: "network 대신 deterministic status·headers·body·delay를 jQuery converter에 공급하는 test adapter입니다.", detail: ["외부 API 의존을 없앱니다.", "실제 browser CORS를 대신하지 않습니다."] },
        { term: "contract server", definition: "요청 wire와 다양한 response/failure를 재현하는 local integration endpoint 집합입니다.", detail: ["clients를 같은 조건으로 비교합니다.", "CI에서 재현 가능합니다."] },
        { term: "canary migration", definition: "일부 feature/user/session에 새 adapter를 켜 metrics와 rollback을 확인하는 rollout입니다.", detail: ["blast radius를 줄입니다.", "parity criteria가 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "mock tests는 모두 통과하지만 production에서만 CORS·cookie가 실패한다.", likelyCause: "mock이 browser origin/preflight/cookie policy를 실행하지 않았습니다.", checks: ["real origin/port와 response headers를 확인합니다.", "CSP·SameSite·Secure를 봅니다.", "browser integration coverage를 확인합니다."], fix: "representative cross-origin browser test와 staging server policy 검증을 추가합니다.", prevention: "unit/mock·same-origin integration·cross-origin E2E의 책임을 test plan에 분리합니다." },
      ],
      expertNotes: [
        "request timeout budget은 user journey SLO와 server latency distribution을 기준으로 잡고 무조건 짧게 만드는 방식으로 reliability를 왜곡하지 않습니다.",
        "raw error body와 query를 telemetry에 남기지 않고 allowlisted code·status·size·duration만 수집하며 debugging sample도 접근·보존 정책을 둡니다.",
      ],
    },
  ],
  lab: {
    title: "XML·JSON·text 통합 조회기를 jQuery와 Fetch 공통 계약으로 점진 이식합니다",
    scenario: "여덟 원본의 상품·자동차·날씨·점수·화장품·사람 데이터를 하나의 학습 자료 조회기로 재구성합니다. 첫 구현은 jQuery full build를 유지하고, transport/parser/normalizer/renderer 경계를 만든 뒤 feature flag로 Fetch adapter를 전환합니다.",
    setup: [
      "local contract server에 200 JSON/XML/text, 204, 404/503, malformed body, delay, echo와 cross-origin allow/deny endpoints를 준비합니다.",
      "원본 fixture의 child/attribute/mixed XML, default namespace와 missing ta, count string, 3×4 text, hostile name/color 최소 cases를 보존합니다.",
      "RequestResult, HttpError, ParseError, SchemaError, CanceledError와 idle/loading/success/empty/error/canceled view model을 정의합니다.",
      "jqueryClient와 fetchClient가 같은 request descriptor와 normalized result/error를 사용하도록 dependency injection합니다.",
      "button·filter form·status/error/retry region과 caption/header가 있는 semantic table을 만듭니다.",
    ],
    steps: [
      "source audit 표에 여덟 HTML과 six fixtures의 actual behavior·missing contract·security sink를 기록합니다.",
      "serialize exact example로 successful controls, repeated keys, disabled/unchecked/file/submitter 차이를 검증합니다.",
      "method·URL query·headers·URL-encoded/JSON/FormData body를 echo endpoint에서 wire exact로 확인합니다.",
      "jQuery converter matrix로 JSON/XML/text success, HTTP 503와 status 200 parsererror를 재현합니다.",
      "형식별 parser 뒤 array/root/namespace/field/type/missing/empty normalizer를 구현합니다.",
      "HTML/style string 조립을 제거하고 textContent·validated style property로 accessible table을 render합니다.",
      "loading/empty/error/canceled/retry와 first-error/status announcement/focus policy를 구현합니다.",
      "slow-old/fast-new에서 previous jqXHR abort와 generation guard를 적용하고 stale finally도 차단합니다.",
      "manual abort·timeout·network/CORS·404/503·bad JSON/XML·schema failure를 stable categories로 분류합니다.",
      "Fetch adapter에 response.ok, single body owner, AbortController/timeout, credentials와 cache policy를 구현합니다.",
      "두 adapters에 같은 success/failure/cancel/wire/view contract suite를 실행하고 parity를 확인합니다.",
      "한 read-only feature를 canary로 전환해 duration/error/stale/accessibility를 비교하고 rollback을 rehearsal합니다.",
    ],
    expectedResult: [
      "form/query/body의 실제 bytes와 server decoded entries가 documented endpoint contract와 일치합니다.",
      "HTTP·network/CORS·timeout·abort·parse·schema·render failures가 서로 다른 code와 적절한 UI 상태가 됩니다.",
      "빠른 반복 요청에서도 최신 intent만 data·loading·focus·announcement를 변경합니다.",
      "hostile response values가 element/style/script로 해석되지 않고 0·false·missing·empty가 정책대로 보존됩니다.",
      "jQuery와 Fetch clients가 200/204/404/503/malformed/delay/cancel fixtures에서 같은 normalized behavior를 냅니다.",
      "cross-origin credentials·preflight·CSP와 CSRF 정책이 browser/server 양쪽에서 검증됩니다.",
      "feature flag rollback 뒤에도 requests·global activity·telemetry와 UI가 정상 동작합니다.",
    ],
    cleanup: ["in-flight jqXHR/AbortController와 timeout을 취소하고 event/global test handlers를 제거합니다.", "mock routes·test credentials·temporary fixtures를 정리하고 logs에 raw PII/body가 남지 않았는지 확인합니다."],
    extensions: [
      "ETag/If-None-Match와 stale-while-revalidate cache policy를 추가해 304/updated UI를 검증합니다.",
      "multipart file upload와 progress가 필요할 때 XHR/Fetch capability 차이를 별도 adapter로 설계합니다.",
      "service worker offline cache와 background sync를 추가하되 write idempotency·conflict UI를 검증합니다.",
      "OpenAPI/JSON Schema 또는 runtime validator로 normalizer contract를 생성·검증하고 server consumer test와 연결합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 원본과 연결 fixture를 감사하고 serialize·converter·safe render exact examples를 재현하세요.", requirements: ["원본에 done/fail·serialize 실행이 없음을 구분합니다.", "form/object/traditional raw strings와 excluded controls를 설명합니다.", "JSON/XML/text와 200 parsererror/503 error를 재현합니다.", "weather missing ta·count string·text 3×4를 확인합니다.", "hostile name/color가 DOM code로 해석되지 않음을 검증합니다."], hints: ["dataType은 response 방향입니다.", "fixture observation과 공식 보완 example을 같은 provenance로 쓰지 마세요."], expectedOutcome: "원본의 형식별 장점과 실제 결함, 보완 예제의 근거를 정확히 구분합니다.", solutionOutline: ["source/fixture/API evidence 세 열을 만듭니다.", "wire·converter·schema·sink를 순서대로 확인합니다."] },
    { difficulty: "응용", prompt: "상품 검색을 jqXHR abort·latest token·accessible async state가 있는 production component로 교정하세요.", requirements: ["idle/loading/success/empty/error/canceled model을 만듭니다.", "previous abort와 done/fail/always token guard를 적용합니다.", "HTTP/network/timeout/abort/parser/schema categories를 분리합니다.", "safe table와 retry/focus/announcement policy를 구현합니다.", "slow-old/fast-new·stale finally·dispose를 browser에서 검증합니다."], hints: ["abort만으로 stale commit을 막았다고 가정하지 마세요.", "expected cancel을 오류 toast로 표시하지 마세요."], expectedOutcome: "빠른 입력과 실패에도 최신 결과·spinner·message가 일치하고 사용자 입력이 보존됩니다.", solutionOutline: ["request owner가 handle/token/state를 소유합니다.", "normalizer와 renderer는 jqXHR를 직접 읽지 않습니다."] },
    { difficulty: "설계", prompt: "jQuery Ajax surface를 Fetch로 canary 이식하는 architecture·contract suite·rollout을 설계하세요.", requirements: ["plugins/global hooks/shorthands/JSONP/FormData/credentials/cache inventory를 만듭니다.", "normalized result/error interface와 two adapters를 정의합니다.", "wire·response·failure·cancel·race·accessibility contract matrix를 작성합니다.", "local/CORS/live optional tests와 privacy-safe telemetry를 분리합니다.", "feature flag·canary criteria·rollback·마지막 jQuery removal gate를 정합니다."], hints: ["API call name보다 observable behavior를 고정하세요.", "Fetch 404와 jqXHR fail 차이를 adapter 안에서 해결하세요."], expectedOutcome: "기능 단위로 안전하게 전환하고 회귀 시 즉시 rollback 가능한 implementation-ready migration plan이 완성됩니다.", solutionOutline: ["transport→normalizer→renderer 경계를 먼저 만듭니다.", "read-only low-coupling feature부터 parity metrics로 전환합니다."] },
  ],
  reviewQuestions: [
    { question: "AJAX는 XML만 사용하는 기술인가요?", answer: "아닙니다. 페이지 navigation 없이 비동기 HTTP 교환을 처리하며 JSON·XML·text·HTML·binary를 다룰 수 있습니다." },
    { question: "jQuery 4 slim build에서도 $.ajax를 쓸 수 있나요?", answer: "아닙니다. slim에는 Ajax가 없으므로 full build 또는 Fetch가 필요합니다." },
    { question: "dataType:'json'은 JSON request body를 만든다는 뜻인가요?", answer: "아닙니다. 기대 response converter이고 request JSON은 stringify·contentType·processData 계약을 별도로 둡니다." },
    { question: "processData:false면 object가 JSON으로 바뀌나요?", answer: "아닙니다. jQuery의 자동 query 변환을 끌 뿐 JSON.stringify를 대신하지 않습니다." },
    { question: ".serialize()에 모든 보이는 form 값이 들어가나요?", answer: "아닙니다. name 있는 enabled successful controls 중심이며 unchecked·disabled·file·no-name과 보통 submit button 값은 빠집니다." },
    { question: "FormData의 multipart Content-Type을 직접 써야 하나요?", answer: "아닙니다. boundary를 browser가 생성하도록 Content-Type을 직접 설정하지 않습니다." },
    { question: "success option은 callback 하나만 받을 수 있나요?", answer: "현대 jQuery에서는 function array도 가능하며 done의 핵심은 Deferred observer/late subscription 표현입니다." },
    { question: "done과 fail의 인자 순서는 같은가요?", answer: "아닙니다. done은 data,textStatus,jqXHR이고 fail은 jqXHR,textStatus,errorThrown입니다." },
    { question: "response.message가 jQuery 표준 오류 메시지인가요?", answer: "아닙니다. status/textStatus/errorThrown과 합의한 responseJSON shape를 normalize해야 합니다." },
    { question: "jqXHR는 native Promise인가요?", answer: "아닙니다. Deferred Promise interface를 가진 thenable이며 다중 인자와 abort 등 별도 계약이 있습니다." },
    { question: "status 200이면 JSON parse도 성공하나요?", answer: "아닙니다. malformed/empty body나 dataType mismatch로 parsererror가 날 수 있습니다." },
    { question: "JSON parse 성공이면 schema도 올바른가요?", answer: "아닙니다. container·fields·types·missing/range를 application normalizer가 검증합니다." },
    { question: "value ?? '-'는 empty string도 '-'로 바꾸나요?", answer: "아닙니다. null/undefined만 대체하므로 empty 정책은 trim/length로 별도 처리합니다." },
    { question: "JSON/XML 값을 .html()로 넣어도 format이 안전하게 해 주나요?", answer: "아닙니다. 값은 untrusted data이며 textContent/.text와 검증된 property를 사용합니다." },
    { question: "abort하면 server 작업도 반드시 취소되나요?", answer: "아닙니다. client가 결과를 기다리지 않는다는 뜻이며 server transaction rollback은 별도 계약입니다." },
    { question: "이전 요청을 abort하면 generation token은 필요 없나요?", answer: "필요합니다. 이미 완료됐거나 취소를 지키지 않는 transport의 stale completion/finally를 막습니다." },
    { question: "Fetch는 404에서 Promise를 reject하나요?", answer: "보통 아닙니다. Response를 fulfill하고 ok=false이므로 adapter가 HTTP error policy를 적용합니다." },
    { question: "mode:'no-cors'로 CORS JSON 문제를 해결할 수 있나요?", answer: "아닙니다. 읽을 수 없는 opaque response가 될 수 있어 JSON UI 해결책이 아닙니다." },
    { question: "CORS가 CSRF도 막아 주나요?", answer: "아닙니다. response read policy와 state-changing request protection은 다른 문제입니다." },
    { question: "jQuery global Ajax events가 Fetch도 추적하나요?", answer: "아닙니다. 혼합 이식에는 공통 explicit activity/telemetry wrapper가 필요합니다." },
    { question: "jQuery cache:false와 Fetch cache:'no-store'는 완전히 같나요?", answer: "아닙니다. URL cache busting과 Fetch/HTTP cache mode를 endpoint semantics에 맞게 다시 설계합니다." },
    { question: "한 번에 jQuery를 제거하는 것이 항상 더 빠른가요?", answer: "아닙니다. plugin/global coupling이 있으면 contract tests와 adapter를 둔 feature별 strangler 이식이 더 안전할 수 있습니다." },
  ],
  completionChecklist: [
    "inventory의 여덟 Ajax 원본과 six response fixtures를 실제로 읽고 source evidence와 설명을 구분했다.",
    "원본에 done/fail·serialize 실행이 없고 ex07의 serialized 오기·error 설명 오류를 명시했다.",
    "jQuery full/slim과 $.ajax availability·load order·HTTP origin을 확인했다.",
    "Ajax request→transport→response→converter→callbacks→render lifecycle과 owner를 그렸다.",
    "url·method·data·processData·contentType·dataType의 wire 방향을 구분했다.",
    "GET query, URL-encoded·JSON·FormData body와 headers를 server echo로 검증했다.",
    ".serialize successful controls, repeated keys, disabled/unchecked/file/submitter와 $.param policy를 exact string으로 검증했다.",
    "jqXHR done/fail/always/then의 인자·late subscription·abort와 native Promise 차이를 설명했다.",
    "JSON·XML·text converter와 MIME·syntax·schema·missing/empty 경계를 분리했다.",
    "child/attribute/mixed/default-namespace XML adapter와 weather missing ta fixture를 검증했다.",
    "JSON count string과 delimiter text exact rows/columns를 domain model로 normalize했다.",
    "HTTP·network/CORS·timeout·abort·parsererror·schema·render failures를 stable categories로 분류했다.",
    "previous jqXHR abort와 generation token을 done/fail/always 모두에 적용했다.",
    "non-idempotent write retry에 idempotency key·server deduplication 정책을 두었다.",
    "HTML/style 문자열 조립을 제거하고 safe text/property DOM rendering과 hostile fixture를 통과했다.",
    "caption/header와 loading/empty/error/canceled/retry/focus/announcement state를 제공했다.",
    "CORS·credentials·cookie·CSRF·CSP connect-src를 서로 다른 양쪽 계약으로 검증했다.",
    "jQuery cache/global events/ajaxSetup와 Fetch 혼합 instrumentation 차이를 처리했다.",
    "jQuery 4 JSONP/script/FormData/build changes와 plugin/shorthand coupling을 inventory했다.",
    "Fetch adapter가 Response.ok·single body owner·AbortController/timeout·credentials·cache를 명시했다.",
    "jQuery/Fetch adapters에 200/204/404/503/malformed/delay/cancel/race contract suite를 공통 실행했다.",
    "live 외부 API를 optional smoke로 격리하고 deterministic local fixtures를 release tests에 사용했다.",
    "canary metrics·feature flag·rollback과 마지막 jQuery dependency removal gate를 rehearsal했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "web-jquery-ajax-syntax-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex07_ajax.html", usedFor: ["Ajax 설명", "$.ajax options vocabulary", "success/error contrast", "serialized 오기", "실행 evidence 부재"], evidence: "주석만 있는 원본의 장점과 done/fail·serialize 실행 부재, 부정확한 error 설명을 정직하게 교정했습니다." },
    { id: "web-jquery-xml-child-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex08_ajax.html", usedFor: ["dataType xml", "child name/price", "table string", "unsafe html", "error handler"], evidence: "data01.xml의 child element product flow를 XML schema adapter와 safe table의 출발점으로 사용했습니다." },
    { id: "web-jquery-xml-attribute-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex09_ajax.html", usedFor: ["XML attributes", "name/price", "missing attribute", "unsafe sink"], evidence: "attribute-based schema와 undefined/missing·XSS 경계를 감사했습니다." },
    { id: "web-jquery-car-xml-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex10_ajax.html", usedFor: ["mixed direct text", "name/price attributes", "car table", "descendant text caveat"], evidence: "회사 text와 차명·가격 attribute가 섞인 XML을 별도 normalizer로 분리했습니다." },
    { id: "web-jquery-weather-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex11_ajax.html", usedFor: ["default namespace", "97 local rows", "missing ta", "nullish fallback", "weather table"], evidence: "실제 weather fixture의 namespace와 stn_id 172 고창 ta 누락을 missing/empty policy에 반영했습니다." },
    { id: "web-jquery-json-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex12_ajax.html", usedFor: ["dataType json", "$.each", "four scores", "count string", "schema validation"], evidence: "JSON array parse 뒤 container·field type validation과 safe render의 근거로 사용했습니다." },
    { id: "web-jquery-cross-origin-json-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex13_ajax.html", usedFor: ["cross-origin API", "top five", "schema drift", "product colors", "unsafe style/HTML"], evidence: "live external dependency·CORS와 untrusted color/name rendering을 deterministic fixture·allowlist로 교정했습니다." },
    { id: "web-jquery-text-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex14_ajax.html", usedFor: ["dataType text", "slash/comma split", "three rows four columns", "delimiter failure", "unsafe HTML"], evidence: "현재 delimiter 동작을 보존하면서 exact column validation과 defined format migration을 추가했습니다." },
    { id: "jquery-ajax-api", repository: "OpenJS Foundation jQuery API", path: "jQuery.ajax()", publicUrl: "https://api.jquery.com/jQuery.ajax/", usedFor: ["settings", "jqXHR", "callback signatures", "data converters", "timeout", "abort", "global events"], evidence: "request options·converter·Deferred callback과 error category의 공식 기준입니다." },
    { id: "jquery-serialize-api", repository: "OpenJS Foundation jQuery API", path: ".serialize()", publicUrl: "https://api.jquery.com/serialize/", usedFor: ["successful controls", "URL encoding", "excluded fields", "duplicates"], evidence: "원본 inventory gap을 새 deterministic form example로 보완한 공식 기준입니다." },
    { id: "jquery-param-api", repository: "OpenJS Foundation jQuery API", path: "jQuery.param()", publicUrl: "https://api.jquery.com/jQuery.param/", usedFor: ["object serialization", "arrays", "traditional", "encoding"], evidence: "form repeated keys와 object bracket/traditional policy를 비교하는 기준입니다." },
    { id: "jquery-deferred-api", repository: "OpenJS Foundation jQuery API", path: "Deferred object", publicUrl: "https://api.jquery.com/category/deferred-object/", usedFor: ["done/fail/always/then", "late subscription", "thenable", "callback queues"], evidence: "jqXHR와 native Promise의 observer·transformation·argument 차이를 설명하는 기준입니다." },
    { id: "jquery-ajax-transport-api", repository: "OpenJS Foundation jQuery API", path: "jQuery.ajaxTransport()", publicUrl: "https://api.jquery.com/jQuery.ajaxTransport/", usedFor: ["deterministic test transport", "send complete", "abort", "converter exercise"], evidence: "외부 API 없이 실제 $.ajax converter/timeout을 검증하는 학습 harness 근거입니다." },
    { id: "jquery4-upgrade-guide", repository: "OpenJS Foundation jQuery", path: "jQuery Core 4.0 Upgrade Guide", publicUrl: "https://jquery.com/upgrade-guide/4.0/", usedFor: ["JSONP promotion removal", "script execution changes", "binary/FormData", "Migrate"], evidence: "현재 4.x migration의 breaking changes와 보안 경계를 반영했습니다." },
    { id: "fetch-standard", repository: "WHATWG", path: "Fetch Standard", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["Request/Response", "ok", "body consumption", "CORS", "credentials", "cache", "network error"], evidence: "Fetch adapter가 명시적으로 되찾아야 할 HTTP·body·CORS 계약의 기준입니다." },
    { id: "dom-abort-standard", repository: "WHATWG", path: "DOM AbortController and AbortSignal", publicUrl: "https://dom.spec.whatwg.org/#aborting-ongoing-activities", usedFor: ["abort reason", "AbortController", "timeout signal", "lifecycle cancellation"], evidence: "Fetch cancellation과 user/timeout reason 분리의 platform 기준입니다." },
    { id: "url-standard", repository: "WHATWG", path: "URLSearchParams", publicUrl: "https://url.spec.whatwg.org/#urlsearchparams", usedFor: ["form URL encoding", "append/set", "repeated key", "space plus"], evidence: "jQuery serialization과 native query/body wire 차이를 설명하는 기준입니다." },
    { id: "xhr-formdata-standard", repository: "WHATWG", path: "FormData interface", publicUrl: "https://xhr.spec.whatwg.org/#interface-formdata", usedFor: ["multipart fields", "Blob/File", "append/set", "browser boundary"], evidence: "file upload와 repeated multipart fields, Content-Type ownership의 기준입니다." },
    { id: "html-form-entry-standard", repository: "WHATWG", path: "constructing the entry list", publicUrl: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-entry-list", usedFor: ["successful controls", "submitter", "disabled/checked", "files", "entry order"], evidence: "jQuery serialize와 native form submission의 공통·차이 기준입니다." },
    { id: "dom-standard", repository: "WHATWG", path: "DOM Standard", publicUrl: "https://dom.spec.whatwg.org/", usedFor: ["Element/Text construction", "textContent", "tree", "safe rendering"], evidence: "응답 값을 markup이 아닌 DOM text로 구성하는 platform 기준입니다." },
    { id: "http-semantics", repository: "IETF HTTP Working Group", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["methods", "status", "headers", "idempotency", "HTTP semantics"], evidence: "transport library 밖 method/status/retry 의미를 구분하는 기준입니다." },
    { id: "owasp-xss-prevention", repository: "OWASP Foundation", path: "Cross Site Scripting Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["safe sinks", "output context", "HTML/style injection", "untrusted response"], evidence: "원본의 .html과 inline style 문자열을 safe DOM/property 경계로 교정했습니다." },
    { id: "wai-table-tutorial", repository: "W3C Web Accessibility Initiative", path: "Tables Tutorial", publicUrl: "https://www.w3.org/WAI/tutorials/tables/", usedFor: ["caption", "header scope", "dynamic table", "navigation"], evidence: "비동기 결과 표도 구조·관계를 전달하는 accessible table 기준입니다." },
  ],
  sourceCoverage: {
    filesRead: 8,
    filesUsed: 8,
    uncoveredNotes: [
      "inventory의 여덟 HTML 원본을 모두 읽고 사용했습니다. ex07은 설명 주석만 있어 실행 source가 아니라 잘못된 용어·callback 계약·evidence 부재를 교정하는 source로 사용했습니다.",
      "inventory가 요구한 done/fail과 serialize는 어느 원본에서도 실행되지 않습니다. success/error 원본과 공식 API를 구분하고 새 exact examples로 보완했습니다.",
      "연결된 data01.xml, data02.xml, data03.xml, weather.xml, data04.json, data05.txt도 직접 감사해 child/attribute/mixed/default-namespace, 97 local과 ta 누락 1개, count string, 3×4 text를 확인했지만 inventory sourceFiles 수에는 포함하지 않았습니다.",
      "XML parser 일반론은 js-11-fetch-xml-domparser-capstone과 xml-03-browser-parse-render로, form control 기초는 jquery-03/04로 링크하면서도 Ajax contract가 자립하도록 핵심 missing/empty·successful-control 설명을 반복했습니다.",
      "외부 Makeup API는 시점 의존 CORS·availability·schema 때문에 exact test에서 제외하고 deterministic fixture와 optional browser integration smoke로 분리했습니다.",
      "CORS·credentials·CSRF·cache·safe sinks·AbortSignal·jQuery 4 changes는 원본에 체계적 설명이 없어 공식 jQuery·WHATWG·IETF·W3C·OWASP 자료로 보강했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
