import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["jquery-02-traversal-manipulation"],
  slug: "jquery-02-traversal-manipulation",
  courseId: "javascript",
  moduleId: "02-jquery-legacy-migration",
  order: 2,
  title: "find·filter·map과 DOM 삽입·복제",
  subtitle: "현재 collection과 DOM tree의 축을 구분하고, 값 변환부터 노드 이동·복제·제거까지 identity와 event·data 수명을 잃지 않게 설계합니다.",
  level: "중급",
  estimatedMinutes: 365,
  coreQuestion: "현재 jQuery collection을 올바른 축으로 탐색·변환하고, DOM 노드의 이동·복제·제거 과정에서 구조·identity·event·data·보안 경계를 보존하려면 무엇을 추적해야 할까요?",
  summary: "day10 ex11~ex13과 day11 ex03 네 원본을 모두 감사해 selection→traversal→transformation→insertion→lifecycle pipeline으로 재구성합니다. ex11은 find가 descendants를 찾고 filter가 현재 set을 줄인다는 큰 방향은 맞지만 filter callback의 index++는 판정 뒤 지역값만 증가시키므로 불필요하고, :even jQuery extension은 3.4부터 deprecated라 pure CSS selection 뒤 .even() method로 교정합니다. ex12의 ‘null 자동 제거’는 입력 array의 null을 없앤다는 뜻이 아니라 $.map callback이 null/undefined를 반환한 항목을 결과에서 제외한다는 뜻입니다. 실제로 null * 2는 0이므로 Array.map과 $.map 모두 [2,4,6,0]입니다. jQuery collection .map(index, element), $.map(value, index), Array.map(value, index, array)의 callback 순서·return type·flatten/drop 규칙을 분리합니다. ex13의 append/prepend/before/after를 안쪽/바깥쪽과 시작/끝 좌표계로 만들고 deprecated :eq(2)를 .eq(2)로 바꿉니다. 기존 DOM node 삽입은 복사가 아니라 이동이며 target이 여러 개면 마지막 target만 원본을 받고 앞 target들은 clone을 받는 규칙을 identity로 검증합니다. HTML string insertion은 script/event attribute code execution이 가능한 XSS sink이므로 untrusted data는 $('<li>').text(value)처럼 structure와 text를 분리합니다. ex03은 clone·empty·remove를 모두 comment로만 설명해 실행 evidence가 없고 clone(true)를 ‘event까지 복제’라고만 적습니다. 이를 clone(false/true, deep), jQuery data와 nested object sharing, duplicate ID/ARIA/form state, empty/remove/detach의 node·descendant·event·data 수명으로 확장합니다. 마지막으로 direct handler 복제보다 event delegation과 data-driven render를 우선하고, DOM batch·DocumentFragment·native API 이관·accessibility·memory leak test까지 연결합니다.",
  objectives: [
    ".find()·.children()·.filter()의 탐색 축과 시작 요소 포함 여부를 DOM tree에서 설명할 수 있다.",
    ".first()·.last()·.eq()·.even()과 deprecated positional selector를 구분해 current set을 정확히 줄일 수 있다.",
    ".each()·collection .map()·$.map()·Array.map/filter의 callback·return·drop·flatten 규칙을 비교할 수 있다.",
    "append·prepend·before·after의 삽입 위치와 target/content 주체를 결과 DOM order로 예측할 수 있다.",
    "기존 node의 이동, 여러 target에서의 implicit clone과 duplicate identity 문제를 진단할 수 있다.",
    "untrusted data를 HTML string으로 삽입하지 않고 element creation과 .text()로 안전하게 렌더링할 수 있다.",
    ".clone()의 event·data·descendant·form-state·shared-object 규칙과 duplicate ID 위험을 설명할 수 있다.",
    ".empty()·.remove()·.detach()를 container·node·event·data 수명 요구에 따라 선택하고 leak을 test할 수 있다.",
  ],
  prerequisites: [
    { title: "jQuery loading·ready·collection", reason: "모든 traversal과 manipulation은 현재 jQuery collection의 membership·index·wrapper 반환 규칙 위에서 동작합니다.", sessionSlug: "jquery-01-ready-selectors" },
    { title: "DOM query와 traversal", reason: "descendant·child·sibling 축과 node identity를 native DOM tree에서도 추적해야 find/filter 차이를 이해할 수 있습니다.", sessionSlug: "js-05-dom-query-traversal" },
    { title: "DOM 생성·삽입·제거", reason: "jQuery insertion wrapper 아래에서 실제 Node가 move·clone·remove되는 표준 DOM lifecycle을 비교합니다.", sessionSlug: "js-06-dom-create-update-remove" },
  ],
  keywords: ["jQuery traversal", "find", "children", "filter", "first", "last", "eq", "even", "each", "map", "jQuery.map", "Array.map", "append", "prepend", "before", "after", "appendTo", "node identity", "clone", "empty", "remove", "detach", "event data", "XSS", "Trusted Types", "event delegation", "DocumentFragment"],
  chapters: [
    {
      id: "source-audit-selection-transformation-lifecycle",
      title: "네 원본은 API 목록이 아니라 collection과 실제 DOM의 두 상태를 추적하는 pipeline으로 읽어야 합니다",
      lead: "선택 결과 wrapper와 document tree를 따로 그리면 method chain이 어느 쪽을 바꾸는지 예측할 수 있습니다.",
      explanations: [
        "jQuery manipulation은 보통 select→traverse/filter→transform→insert/remove 순서입니다. find/filter/map은 새 collection 또는 value array를 만들고, append/clone/remove는 실제 DOM tree와 jQuery-managed event/data 수명에 영향을 줍니다.",
        "collection은 node references의 집합이고 DOM은 parent/child 관계를 가진 tree입니다. filter로 collection member를 줄여도 DOM node가 사라지는 것은 아니며, append로 DOM node가 이동해도 그 node object의 identity와 reference는 유지됩니다.",
        "원본 ex11은 find/filter를 실제 실행해 descendant와 current-set filtering을 보여 줍니다. 다만 index++와 deprecated :even extension을 그대로 모방하지 않고 current API와 명시적 predicate로 고칩니다.",
        "원본 ex12는 console에서 Array.map, $.map, filter, $.grep을 비교하지만 ‘null 자동 제거’ 설명이 부정확합니다. 입력 null과 callback 반환 null을 분리하고, 현대 array data에는 native map/filter를 기본으로 권합니다.",
        "원본 ex13은 네 insertion directions를 실제 실행합니다. :eq(2)로 고른 내용c는 prepend/append/before/after 뒤에도 같은 node identity라 이미 적용한 style이 유지됩니다. 위치와 object를 구분하는 좋은 evidence입니다.",
        "원본 ex03의 clone/empty/remove code는 전부 comment라 page를 열어도 아무 조작이 일어나지 않습니다. title/comment의 학습 의도를 실제 event·data lifecycle examples로 재구성하며 원본 실행 결과라고 표현하지 않습니다.",
      ],
      concepts: [
        { term: "collection pipeline", definition: "한 matched set을 traversal·filter·map으로 새 set/value로 바꾸고 DOM operation으로 연결하는 흐름입니다.", detail: ["각 단계 return type을 적습니다.", "base collection과 subset을 구분합니다."] },
        { term: "node identity", definition: "DOM 위치나 wrapper가 달라져도 같은 Node object임을 나타내는 identity입니다.", detail: ["move는 identity를 보존합니다.", "clone은 다른 identity를 만듭니다."] },
        { term: "lifecycle ownership", definition: "node·event handler·jQuery data를 누가 만들고 언제 정리·재삽입할지 정한 계약입니다.", detail: ["remove와 detach 선택의 기준입니다.", "memory leak과 duplicate handler를 막습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "filter를 호출했는데 화면에서 제외된 node가 사라지지 않는다.", likelyCause: ".filter()가 DOM을 삭제하는 method가 아니라 새 subset wrapper를 반환한다는 계약을 혼동했습니다.", checks: ["base/subset length를 각각 출력합니다.", "DOM child count와 collection length를 구분합니다.", "return value를 저장했는지 확인합니다."], fix: "selection만 줄이려면 returned collection을 사용하고 실제 제거가 목적이면 명시적으로 .remove()를 호출합니다.", prevention: "각 chain step 옆에 jQuery/Array/DOM mutation return type을 표기합니다." },
      ],
    },
    {
      id: "find-children-filter-axis",
      title: "find는 descendant 축을 내려가고 filter는 현재 collection을 같은 자리에서 줄입니다",
      lead: "시작 집합, 이동 방향, candidate 집합을 먼저 말한 뒤 selector를 씁니다.",
      explanations: [
        "$('#shop').find('.card')는 shop collection의 각 element 아래 모든 descendants에서 card를 찾습니다. shop 자신이 .card여도 시작 element는 결과에 포함되지 않습니다.",
        ".children('.card')는 direct child 한 level만 보고, .find('.card')는 깊이에 제한 없이 descendants를 봅니다. component public surface가 direct cards인지 nested cards까지인지에 따라 선택합니다.",
        "$('.card').filter('.sale')는 이미 선택한 card members 각각이 sale selector를 match하는지 검사합니다. container에서 filter('.sale')를 호출해 descendant를 찾으려 하면 결과가 0일 수 있습니다.",
        "function predicate의 signature는 (index, element)이고 this는 current DOM Element입니다. 원본의 return index++ % 2 === 1은 postfix increment 전 index로 판정한 뒤 local parameter만 증가시키므로 index % 2 === 1과 결과가 같고 ++는 오해만 만듭니다.",
        "filter callback 안에서 repeated $(this).find(...)는 각 member의 descendant 값을 읽는 legitimate composition이지만 큰 set에서는 data를 한 번 normalize한 뒤 filter하는 편이 관측·test에 좋을 수 있습니다.",
        "find/filter 모두 새 jQuery collection을 반환하고 source collection을 직접 변경하지 않습니다. node references는 복제되지 않아 subset에 setter를 호출하면 원본 DOM의 같은 nodes가 바뀝니다.",
      ],
      concepts: [
        { term: "descendant axis", definition: "시작 node의 children 아래 모든 깊이로 내려가는 tree 방향입니다.", detail: ["find가 사용합니다.", "시작 node 자신은 제외합니다."] },
        { term: "current-set filtering", definition: "새 tree를 탐색하지 않고 현재 collection members 중 predicate를 만족한 것만 남기는 과정입니다.", detail: ["filter가 사용합니다.", "새 wrapper를 반환합니다."] },
        { term: "predicate callback", definition: "각 candidate를 포함할지 truthy/falsy로 판정하는 function입니다.", detail: ["index와 DOM element를 받습니다.", "판정과 무관한 부수효과를 피합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-find-versus-filter",
          title: "후손 탐색과 현재 카드 집합 필터를 같은 fixture에서 비교합니다",
          language: "html",
          filename: "jquery-find-filter.html",
          purpose: "find의 descendant/self exclusion과 filter의 current set predicate를 stable text로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>find filter</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head>
<body>
  <section id="shop" class="card">
    <article class="card sale"><h2>Keyboard</h2><span class="price">45000</span></article>
    <article class="card"><h2>Mouse</h2><span class="price">25000</span></article>
    <article class="card sale"><h2>Monitor</h2><span class="price">250000</span></article>
  </section>
  <article class="card sale"><h2>Outside</h2></article>
  <pre id="out"></pre>
  <script>
    const $cards = $("#shop").find(".card");
    const $sale = $cards.filter(".sale");
    const $expensive = $cards.filter(function () {
      return Number($(this).find(".price").text()) >= 50000;
    });
    const names = $set => $set.map(function () {
      return $(this).find("h2").text();
    }).get().join("|");
    $("#out").text([
      "descendants=" + $cards.length,
      "sale=" + names($sale),
      "expensive=" + names($expensive),
      "outside-in-find=" + $cards.filter(function () {
        return $(this).find("h2").text() === "Outside";
      }).length,
      "find-self=" + $("#shop").find("#shop").length
    ].join("\n"));
  </script>
</body></html>`,
          walkthrough: [
            { lines: "7-12", explanation: "shop은 스스로 card class를 갖지만 아래에 세 card가 있고 Outside card는 root 밖에 둡니다." },
            { lines: "15-19", explanation: "find로 descendant cards를 만든 뒤 sale selector와 price predicate로 같은 현재 set을 두 방향으로 줄입니다." },
            { lines: "20-29", explanation: "각 subset 이름, root 밖 제외와 find self-exclusion을 exact output으로 고정합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-find-filter.html을 열고 #out 확인" },
          output: { value: "descendants=3\nsale=Keyboard|Monitor\nexpensive=Monitor\noutside-in-find=0\nfind-self=0", explanation: ["find는 shop 아래 세 cards만 찾고 shop 자신과 Outside를 제외합니다.", "filter는 그 세 members 중 sale 두 개와 5만원 이상 한 개를 반환합니다."] },
          experiments: [
            { change: "$('#shop').filter('.card')를 실행합니다.", prediction: "descendant가 아니라 shop 자신 한 개가 반환됩니다.", result: "find와 filter의 candidate axis가 반대가 아니라 서로 다릅니다." },
            { change: ".find를 .children으로 바꾸고 card를 wrapper div 한 단계 아래로 옮깁니다.", prediction: "children은 nested cards를 찾지 못합니다.", result: "한 level과 모든 descendants를 요구에 맞게 고릅니다." },
            { change: "predicate의 index++를 index로 바꿉니다.", prediction: "판정 결과는 같습니다.", result: "callback parameter 증가가 다음 callback index에 영향을 주지 않습니다." },
          ],
          sourceRefs: ["web-jquery-find-filter-source", "jquery-find-filter-api", "jquery-filter-api"],
        },
      ],
      diagnostics: [
        { symptom: "container는 존재하는데 .find 결과가 0이거나 자신을 찾지 못한다.", likelyCause: "selector가 descendants에 없거나 시작 element 자신도 find가 포함한다고 오해했습니다.", checks: ["root length와 root.innerHTML을 확인합니다.", "direct child/descendant/self 각각을 Elements에서 봅니다.", "find 대신 filter/is가 필요한지 판단합니다."], fix: "자기 자신 판정은 .is/.filter, direct child는 .children, 모든 후손은 .find를 사용합니다.", prevention: "tree fixture에 self/direct child/deep child/outside control을 모두 둡니다." },
        { symptom: "filter('.sale')가 0인데 안쪽에 sale element가 보인다.", likelyCause: "현재 collection이 container이고 sale은 descendant라 filter candidate가 아닙니다.", checks: ["filter 전 collection members를 출력합니다.", "container가 sale인지 descendant가 sale인지 구분합니다.", "find('.sale') 결과와 비교합니다."], fix: "container 아래를 찾으려면 .find('.sale'), cards 중 sale만 고르려면 먼저 .find('.card').filter('.sale')를 사용합니다.", prevention: "method chain마다 current-set 내용을 이름 있는 변수로 저장합니다." },
      ],
    },
    {
      id: "positional-methods-deprecation",
      title: "위치 필터는 pure CSS로 먼저 선택한 뒤 method로 좁혀야 migration과 성능이 명확합니다",
      lead: "deprecated jQuery selector extensions를 현재 collection methods로 옮기고 0-based 기준을 보존합니다.",
      explanations: [
        "원본 ex11의 .filter(':even')과 ex13의 '#wrap p:eq(2)'는 jQuery 4.0.0에서 여전히 실행되지만 :even과 :eq() selector extensions는 jQuery 3.4부터 deprecated입니다.",
        "공식 교정은 $('#inner-2 p').even()과 $('#wrap p').eq(2)처럼 pure CSS selector로 base set을 만든 뒤 method로 좁히는 것입니다. 이 형태는 selector를 native querySelectorAll path에 더 가깝게 두고 migration boundary를 드러냅니다.",
        ".eq(2)는 third member를 담은 jQuery collection, .get(2)는 raw DOM Element를 반환합니다. 후속 jQuery chain이면 eq, native property면 get/index를 사용합니다.",
        ".even()은 0·2·4 matched-set positions, .odd()는 1·3·5 positions입니다. CSS :nth-child(even)의 parent 안 1-based 둘째·넷째와 다시 구분합니다.",
        "DOM insertion이나 filter가 base set 순서를 바꾸면 같은 eq index가 다른 business item을 가리킬 수 있습니다. persistent selection은 data-id 같은 identity로 저장하고 index는 순간 presentation에만 사용합니다.",
      ],
      concepts: [
        { term: "positional selector extension", definition: ":eq/:even처럼 CSS 표준이 아닌 jQuery가 selector grammar에 추가한 위치 filter입니다.", detail: ["3.4부터 deprecated인 항목이 있습니다.", "method form으로 옮깁니다."] },
        { term: "method filtering", definition: "pure CSS로 만든 collection에 .eq/.even 같은 method를 호출해 set을 줄이는 형태입니다.", detail: ["migration boundary가 분명합니다.", "jQuery collection을 반환합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "jQuery selector를 native querySelectorAll로 옮기자 ':eq' 또는 ':even' SyntaxError가 난다.", likelyCause: "CSS standard가 아닌 jQuery selector extension을 native selector에 넘겼습니다.", checks: ["selector 안 :eq/:lt/:gt/:even/:odd를 search합니다.", "official deprecated selector list를 확인합니다.", "base pure CSS와 positional step을 분리합니다."], fix: "querySelectorAll의 Array/NodeList index 또는 jQuery pure selector 뒤 .eq/.even method로 교정합니다.", prevention: "신규 selector에는 표준 CSS syntax만 허용하고 positional logic을 code에 둡니다." },
      ],
    },
    {
      id: "each-map-array-contracts",
      title: "each와 세 종류 map은 callback 순서·return type·null 처리 규칙이 서로 다릅니다",
      lead: "이름이 같다는 이유로 같은 API라고 보지 말고 input, callback, output을 세 열로 비교합니다.",
      explanations: [
        "$collection.each(function(index, element) {...})는 부수효과를 각 DOM member에 적용하고 원래 collection을 반환해 chain을 이어갑니다. callback this도 current DOM Element이며 false 반환으로 iteration을 중단할 수 있습니다.",
        "$collection.map(function(index, element){...})는 각 DOM member를 값으로 변환한 새 jQuery object를 반환합니다. plain Array가 필요하면 .get() 또는 .toArray()를 명시합니다.",
        "$.map(array, function(value, index){...})는 plain Array를 반환합니다. callback이 null/undefined를 반환하면 그 결과 항목을 제외하고, array를 반환하면 한 level flatten합니다. 원본 input 안 null이라는 사실만으로 제거하지 않습니다.",
        "원본 [1,2,3,null]에서 mapper value => value * 2를 적용하면 JavaScript numeric coercion으로 null * 2가 0입니다. 그래서 Array.map과 $.map 모두 [2,4,6,0]이며 원본 주석의 ‘null 자동 제거’를 이 case에 적용하면 틀립니다.",
        "Array.prototype.map(function(value,index,array){...})은 input 길이를 보존하고 callback 반환 null도 결과 member로 남깁니다. filtering은 Array.filter를 별도로 사용합니다. modern array data에는 $.grep보다 native filter가 의도와 ecosystem에 더 명확합니다.",
        "jQuery collection .map은 (index, element), static $.map과 Array.map은 (value, index) 순서입니다. 같은 named callback을 세 API에 재사용하면 argument reversal bug가 생길 수 있습니다.",
        "implicit iteration setter라면 each가 불필요합니다. 각 node에 addClass 하나만 할 때 $items.each(...addClass)보다 $items.addClass(...)가 간단하고 jQuery가 iteration을 소유합니다.",
      ],
      concepts: [
        { term: "transform", definition: "각 input member를 callback return value로 바꿔 새 result를 만드는 operation입니다.", detail: ["map의 목적입니다.", "side effect와 분리합니다."] },
        { term: "null dropping", definition: "$.map callback이 null/undefined를 반환한 result를 output에 넣지 않는 규칙입니다.", detail: ["input null 자동 삭제가 아닙니다.", "Array.map은 null return을 보존합니다."] },
        { term: "one-level flatten", definition: "$.map callback이 array를 반환하면 그 members를 result에 한 단계 펼치는 behavior입니다.", detail: ["plain Array.map과 다릅니다.", "의도치 않은 cardinality 변화에 주의합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-each-map-contracts",
          title: "DOM collection map·each와 $.map·Array.map 결과를 비교합니다",
          language: "html",
          filename: "jquery-map-contracts.html",
          purpose: "callback order, accumulated side effect, null dropping과 return Array boundary를 exact values로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>map contracts</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head>
<body><ul id="skills">
  <li data-hours="3">HTML</li><li data-hours="2">CSS</li><li data-hours="5">jQuery</li>
</ul><pre id="out"></pre>
<script>
  const mapped = $("#skills li").map(function (index, element) {
    return (index + 1) + ":" + $(element).text() + "=" + element.dataset.hours;
  }).get();
  let hours = 0;
  $("#skills li").each(function () { hours += Number(this.dataset.hours); });
  const jqueryMap = $.map([1, 2, 3, 4], function (value) {
    return value % 2 === 0 ? value * 10 : null;
  });
  const nativeMap = [1, 2, 3].map(function (value) {
    return value === 1 ? null : value;
  });
  $("#out").text([
    "mapped=" + mapped.join("|"),
    "hours=" + hours,
    "jquery-map=" + JSON.stringify(jqueryMap),
    "array-map=" + JSON.stringify(nativeMap),
    "return-type=" + Array.isArray(mapped)
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "10-12", explanation: "collection .map callback은 index를 먼저 받고 returned jQuery wrapper를 .get으로 Array화합니다." },
            { lines: "14-15", explanation: ".each는 DOM data-hours를 numeric total이라는 외부 side effect에 누적합니다." },
            { lines: "16-22", explanation: "$.map은 odd callback return null을 drop하지만 Array.map은 null member를 유지합니다." },
            { lines: "23-29", explanation: "cardinality·values와 plain Array identity를 deterministic JSON/text로 출력합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-map-contracts.html을 열고 #out 확인" },
          output: { value: "mapped=1:HTML=3|2:CSS=2|3:jQuery=5\nhours=10\njquery-map=[20,40]\narray-map=[null,2,3]\nreturn-type=true", explanation: ["DOM collection map은 세 formatted strings를 만듭니다.", "each는 3+2+5를 누적합니다.", "$.map은 null returns를 제외하고 Array.map은 null을 보존합니다."] },
          experiments: [
            { change: "$.map([1,2,3,null], value => value * 2)를 출력합니다.", prediction: "[2,4,6,0]입니다.", result: "input null이 아니라 callback return null만 drop됩니다." },
            { change: "$.map에서 짝수마다 [value, value * 10]을 반환합니다.", prediction: "result는 nested arrays가 아니라 한 level flattened values입니다.", result: "output cardinality가 input과 달라집니다." },
            { change: ".get()을 제거하고 mapped.join을 호출합니다.", prediction: "jQuery wrapper는 plain Array join contract가 아니어서 오류 또는 예상 밖 동작입니다.", result: "return type boundary를 지킵니다." },
          ],
          sourceRefs: ["web-jquery-map-source", "jquery-map-each-api", "jquery-static-map-api", "ecma-array-map-filter"],
        },
      ],
      diagnostics: [
        { symptom: "map 결과에 join을 호출했더니 join is not a function이 난다.", likelyCause: "jQuery collection .map이 plain Array가 아니라 jQuery object를 반환했습니다.", checks: ["Array.isArray와 result.jquery를 확인합니다.", "어느 map implementation을 호출했는지 봅니다.", "callback argument order도 함께 출력합니다."], fix: "$collection.map(...).get() 또는 .toArray() 뒤 native Array pipeline을 사용합니다.", prevention: "API 이름 옆에 input/callback/output type을 type annotation과 test로 고정합니다." },
        { symptom: "null을 넣었는데 $.map 결과에 0이 생겼다.", likelyCause: "null input이 mapper 안 numeric multiplication에서 0으로 coercion되었고 callback이 null을 반환한 것은 아닙니다.", checks: ["callback input과 return을 따로 기록합니다.", "Number(null)과 null * 2를 확인합니다.", "drop을 원한 조건이 return null인지 봅니다."], fix: "input validation/filter를 먼저 하거나 callback에서 value == null이면 null을 반환합니다.", prevention: "missing data와 numeric zero를 schema 단계에서 분리하고 coercion fixture를 둡니다." },
        { symptom: "callback에서 element와 index가 뒤바뀌어 dataset access가 실패한다.", likelyCause: "collection .map(index, element)와 $.map/Array.map(value, index)의 signature를 혼동했습니다.", checks: ["callback 첫 두 인수의 typeof/value를 출력합니다.", "method receiver가 jQuery collection인지 $ static인지 Array인지 확인합니다.", "공통 callback을 재사용했는지 봅니다."], fix: "API별 adapter callback을 쓰거나 먼저 plain Array로 변환해 한 convention으로 통일합니다.", prevention: "generic parameter 이름을 a/b가 아니라 index/element 또는 value/index로 명시합니다." },
      ],
    },
    {
      id: "insertion-coordinate-subject",
      title: "append·prepend·before·after는 안/밖과 시작/끝의 2×2 좌표계입니다",
      lead: "선택한 target을 기준으로 content가 child인지 sibling인지 먼저 정하면 DOM order를 암기하지 않아도 됩니다.",
      explanations: [
        ".prepend(content)는 target의 first child, .append(content)는 last child로 넣습니다. 둘 다 target 안쪽이라 target element 자체는 유지됩니다.",
        ".before(content)는 target 바로 앞 previous sibling, .after(content)는 target 바로 뒤 next sibling으로 넣습니다. target의 parent가 새 content의 parent가 됩니다.",
        "원본 ex13에서 #wrap 안 prepend 내용@@@, 기존 내용a~e, append 내용~~~~ 순서가 되고 #wrap 바깥에는 before 내용0과 after 내용3이 생깁니다. 안/밖 boundary를 DOM inspector에서 확인합니다.",
        ".append(content)와 $(content).appendTo(target)는 같은 목적이지만 문장의 주체가 다릅니다. container를 먼저 읽는 codebase인지 content pipeline을 chain하는 codebase인지 convention을 정합니다.",
        "여러 contents와 여러 targets, function overload는 cardinality를 크게 바꿀 수 있습니다. operation 전 target count·content identity·expected final order를 test합니다.",
        "Document position을 CSS visual order와 혼동하지 않습니다. flex order/position 때문에 화면상 위치가 달라도 accessibility reading/focus order는 DOM order의 영향을 받으므로 semantic 순서를 먼저 만듭니다.",
      ],
      concepts: [
        { term: "inside insertion", definition: "target을 parent로 두고 first 또는 last child를 추가하는 operation입니다.", detail: ["prepend/append가 해당합니다.", "target은 유지됩니다."] },
        { term: "outside insertion", definition: "target과 같은 parent 아래 previous 또는 next sibling을 추가하는 operation입니다.", detail: ["before/after가 해당합니다.", "parent availability가 필요합니다."] },
        { term: "content/target subject", definition: "append와 appendTo처럼 같은 operation을 container 또는 content 어느 쪽에서 읽는지의 API 표현 차이입니다.", detail: ["return chain이 달라질 수 있습니다.", "team convention을 둡니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "append했더니 element가 target 옆이 아니라 안쪽 끝에 들어간다.", likelyCause: "append를 outside-after insertion으로 오해했습니다.", checks: ["target.parentNode와 inserted.parentNode를 확인합니다.", "children/siblings order를 text로 출력합니다.", "요구가 child인지 sibling인지 다시 정합니다."], fix: "child 끝은 append, sibling 뒤는 after를 사용합니다.", prevention: "2×2 insertion matrix와 DOM order assertion을 code review template에 둡니다." },
      ],
    },
    {
      id: "node-move-multiple-target-clones",
      title: "기존 node를 삽입하면 이동하고 여러 target에서는 마지막만 원본을 받습니다",
      lead: "markup이 두 벌 보인다는 사실과 object identity가 두 벌이라는 사실을 구분합니다.",
      explanations: [
        "DOM Node는 동시에 두 parent의 child일 수 없습니다. existing node를 새 target에 append하면 old parent에서 자동으로 빠지고 새 parent로 이동합니다. remove를 먼저 호출할 필요가 없습니다.",
        "jQuery collection target이 여러 개일 때 existing element 하나를 append하면 마지막 target에는 원본 node, 앞 target들에는 jQuery가 만든 clones가 들어갑니다. 공식 append contract의 중요한 예외적 cardinality입니다.",
        "원본 reference === lastTarget.lastChild를 검사하면 identity를 확인할 수 있습니다. 첫 target의 보이는 복사본은 같은 class/text를 가질 수 있어도 strict identity는 다릅니다.",
        "implicit clones는 duplicate id, label[for], aria-labelledby/describedby/controls와 form name/value 관계를 복제할 수 있습니다. unique identity를 가진 component를 여러 target에 한 번에 넣지 않습니다.",
        "move는 기존 native/jQuery handlers와 data가 node에 붙어 있다면 보통 identity와 함께 유지하지만 component가 parent-context event delegation·CSS·observer에 의존하면 behavior가 달라질 수 있습니다.",
        "복제가 정말 필요하면 DOM clone보다 source data에서 새 component instance를 render해 새 ID·state·cleanup owner를 부여하는 방식이 더 안전한 경우가 많습니다.",
      ],
      concepts: [
        { term: "move semantics", definition: "기존 Node를 새 parent에 삽입할 때 같은 object가 old position에서 new position으로 옮겨지는 규칙입니다.", detail: ["identity가 유지됩니다.", "old parent에서는 사라집니다."] },
        { term: "implicit clone", definition: "하나의 content를 여러 jQuery targets에 삽입할 때 마지막 이외 targets용으로 자동 생성되는 copies입니다.", detail: ["원본은 마지막 target으로 갑니다.", "unique identifiers를 깨뜨릴 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-four-directions-move-clone",
          title: "네 방향 삽입과 기존 node의 이동·다중 target 복제를 검증합니다",
          language: "html",
          filename: "jquery-insertion-identity.html",
          purpose: "final DOM order, old parent empty, target별 child count와 original identity를 exact output으로 고정합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>insertion identity</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head>
<body>
  <div id="source"><b class="movable">M</b></div>
  <div id="stage"><span id="anchor">A</span></div>
  <div class="target"></div><div class="target"></div>
  <pre id="out"></pre>
  <script>
    $("#anchor").before("<i>B</i>").after("<i>C</i>");
    $("#stage").prepend("<u>P</u>").append("<u>Q</u>");
    const originalMovable = document.querySelector(".movable");
    $(".target").append(originalMovable);
    const stage = $("#stage").children().map(function () {
      return $(this).text();
    }).get().join("|");
    const targetCounts = $(".target").map(function () {
      return this.children.length;
    }).get().join("|");
    $("#out").text([
      "stage=" + stage,
      "source-children=" + $("#source").children().length,
      "target-counts=" + targetCounts,
      "movable-count=" + $(".movable").length,
      "original-in-last=" + ($(".target").last().children()[0] === originalMovable)
    ].join("\n"));
  </script>
</body></html>`,
          walkthrough: [
            { lines: "12-13", explanation: "anchor의 outside siblings와 stage의 inside first/last children을 순서대로 삽입합니다." },
            { lines: "14-15", explanation: "원본 movable identity를 보관한 뒤 두 targets에 하나의 existing node를 append합니다." },
            { lines: "16-29", explanation: "DOM order, old parent, implicit clone count와 마지막 target의 strict identity를 출력합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-insertion-identity.html을 열고 #out 확인" },
          output: { value: "stage=P|B|A|C|Q\nsource-children=0\ntarget-counts=1|1\nmovable-count=2\noriginal-in-last=true", explanation: ["prepend/before/anchor/after/append가 P-B-A-C-Q 순서를 만듭니다.", "movable 원본은 source에서 빠져 마지막 target으로 이동하고 첫 target에는 clone이 생깁니다."] },
          experiments: [
            { change: "target을 하나만 남깁니다.", prediction: "movable-count=1이고 그 target에 원본이 이동합니다.", result: "single target insertion은 clone을 만들지 않습니다." },
            { change: "originalMovable.cloneNode(true)를 각 target에 직접 넣습니다.", prediction: "원본은 source에 남지만 clone마다 새 identity이며 ID가 있으면 중복될 수 있습니다.", result: "copy ownership을 명시해야 합니다." },
            { change: "stage에 flex order를 줍니다.", prediction: "visual order는 달라질 수 있지만 DOM text order는 P|B|A|C|Q입니다.", result: "semantic/focus order를 CSS appearance와 분리합니다." },
          ],
          sourceRefs: ["web-jquery-insertion-source", "jquery-insertion-api", "dom-node-standard"],
        },
      ],
      diagnostics: [
        { symptom: "append 뒤 원래 위치에서 node가 사라졌다.", likelyCause: "existing DOM Node insertion은 copy가 아니라 move입니다.", checks: ["operation 전후 parentNode를 비교합니다.", "strict identity를 저장해 새 위치와 비교합니다.", "target count가 한 개인지 봅니다."], fix: "이동이 의도라면 정상으로 문서화하고, 독립 copy가 필요하면 identity/state를 재설계해 clone 또는 data-driven render를 사용합니다.", prevention: "API parameter가 HTML string/new node/existing node 중 무엇인지 type과 이름에 드러냅니다." },
        { symptom: "여러 target에 넣은 뒤 같은 id가 여러 개 생기고 label/ARIA가 엉뚱한 node를 가리킨다.", likelyCause: "jQuery가 마지막 target 외에 implicit clones를 만들어 unique identifiers도 복사했습니다.", checks: ["target length와 duplicated ID count를 확인합니다.", "for/aria-* IDREF를 모두 추적합니다.", "어느 instance가 original인지 identity를 봅니다."], fix: "unique-ID component를 multi-target append하지 말고 source data로 각 instance의 IDs와 state를 새로 생성합니다.", prevention: "duplicate-id/accessibility reference 검사와 multi-target fixture를 CI에 둡니다." },
      ],
    },
    {
      id: "safe-content-construction",
      title: "HTML string insertion은 code-execution sink이므로 structure와 untrusted text를 분리합니다",
      lead: "편리한 '<li>'+value+'</li>'가 data를 markup grammar로 바꾸는 순간을 신뢰 경계로 표시합니다.",
      explanations: [
        "jQuery constructor, append, before, after처럼 HTML string을 받는 APIs는 script tag나 onload 같은 executable attributes를 parse·실행할 수 있습니다. 공식 append 문서도 URL parameter, cookie, form input 같은 untrusted string을 직접 넣지 말라고 경고합니다.",
        "escape 몇 글자를 수동 replace하는 방법은 attribute/URL/style/script context를 완전히 다루지 못합니다. 단순 text는 $('<li>').text(userValue), native document.createElement+textContent처럼 parser를 통과하지 않는 sink를 사용합니다.",
        "trusted static structure와 dynamic data를 분리하면 security뿐 아니라 test와 accessibility도 좋아집니다. $('<article>').append($('<h2>').text(title), $('<p>').text(description))처럼 semantic nodes를 구성합니다.",
        "rich HTML이 제품 요구라면 allowlist sanitizer와 provenance, Trusted Types/CSP enforcement를 별도 reviewed boundary에 둡니다. TrustedHTML type이 생겼다는 이유만으로 content가 의미상 안전해지는 것은 아니며 policy 자체를 검토해야 합니다.",
        "URL은 URL parser와 protocol allowlist, CSS value는 property-specific validation을 거칩니다. .text() 하나가 모든 non-text sinks를 해결한다고 일반화하지 않습니다.",
        "event handler를 각 새 node에 복사하기보다 stable parent에서 event delegation을 사용하면 safe-rendered dynamic nodes도 자동으로 behavior를 얻고 cleanup surface가 줄어듭니다.",
      ],
      concepts: [
        { term: "HTML string sink", definition: "문자열을 HTML parser에 넘겨 nodes와 executable attributes를 만들 수 있는 API 경계입니다.", detail: ["append/before/after 등이 포함됩니다.", "untrusted strings를 직접 넘기지 않습니다."] },
        { term: "structure/data separation", definition: "element 구조는 trusted code로 만들고 external value는 text/property로 넣는 방식입니다.", detail: ["XSS risk를 줄입니다.", "semantic structure가 명확합니다."] },
        { term: "event delegation", definition: "stable ancestor 한 곳의 handler가 bubbling event target을 판별해 dynamic descendants를 처리하는 패턴입니다.", detail: ["clone handler가 덜 필요합니다.", "selector와 lifecycle ownership이 중요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "상품명이나 URL parameter를 append했더니 image onerror나 예상 밖 tag가 실행된다.", likelyCause: "untrusted data를 HTML string으로 조립해 insertion sink에 넘겼습니다.", checks: ["data provenance를 input→sink로 추적합니다.", "jQuery HTML-taking APIs와 .html을 search합니다.", "CSP/Trusted Types report를 확인합니다."], fix: "nodes를 static structure로 만들고 external values는 .text/textContent와 validated properties에 넣습니다.", prevention: "HTML string sink wrapper를 제한하고 security lint·malicious fixture·CSP Trusted Types reporting을 둡니다." },
      ],
      expertNotes: [
        "jQuery 4의 Trusted Types compatibility는 sanitizer가 아닙니다. default policy로 모든 string을 무조건 승인하면 enforcement 목적을 무너뜨립니다.",
        "대량 list는 detached DocumentFragment 또는 한 번의 container replace로 batch하되 focus·selection·live region과 event ownership을 보존합니다.",
      ],
    },
    {
      id: "clone-events-data-form-identity",
      title: "clone은 markup tree를 깊게 복사해도 event·data·form current state·업무 identity까지 독립 복제하지 않습니다",
      lead: "deep DOM copy와 deep application-state copy를 같은 말로 사용하지 않습니다.",
      explanations: [
        ".clone() 기본은 matched elements와 descendant elements/text nodes를 deep-copy하지만 jQuery-bound event handlers와 data는 복사하지 않습니다. clone(true)는 root events/data, clone(true,true)는 descendants의 events/data도 복사합니다.",
        "원본 ex03 comment의 ‘true는 이벤트까지 복제’는 data와 descendant option을 누락합니다. copied handler가 closure 안 같은 external state를 공유할 수도 있어 독립 component가 보장되지 않습니다.",
        ".data()에 저장한 primitive는 copy되지만 object/array 내부는 deep-copy되지 않아 original과 clone이 같은 nested object reference를 공유합니다. 한 clone에서 object를 mutate하면 다른 instance state도 바뀔 수 있습니다.",
        "clone은 id, name, label[for], aria-labelledby/describedby/controls 같은 attributes도 그대로 복사합니다. unique ID와 relationship contract를 새 instance에 맞게 다시 생성하지 않으면 accessibility와 query가 깨집니다.",
        "official clone contract는 input의 일부 dynamic state는 유지되지만 textarea의 사용자 입력과 select의 사용자 선택 같은 dynamic state는 performance 때문에 복사되지 않을 수 있다고 경고합니다. form clone을 state persistence로 사용하지 않습니다.",
        "direct handler를 복제하는 대신 list ancestor의 delegated handler와 immutable source data로 새 card를 render하면 event/data copying flags가 필요 없고 state owner가 분명해집니다.",
        "clone이 필요한 drag preview/template도 interactive IDs를 제거하고 inert/aria-hidden 여부, focusability와 cleanup을 검증합니다.",
      ],
      concepts: [
        { term: "deep DOM copy", definition: "element와 모든 descendant nodes/text를 새 node identities로 복사하는 것입니다.", detail: ["application object deep copy와 다릅니다.", "attributes도 복사됩니다."] },
        { term: "withDataAndEvents", definition: "clone에서 jQuery-managed event handlers와 data를 copy할지 정하는 boolean입니다.", detail: ["기본 false입니다.", "둘째 인수는 descendants를 제어합니다."] },
        { term: "shared nested data", definition: "copied .data record 안 object/array가 original과 clone에서 같은 reference로 남는 상태입니다.", detail: ["mutation이 전파됩니다.", "manual deep copy 또는 새 model이 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-clone-event-data-depth",
          title: "plain clone과 deep event/data clone의 차이를 클릭 결과로 확인합니다",
          language: "html",
          filename: "jquery-clone-lifecycle.html",
          purpose: "DOM은 세 벌이어도 direct handler와 jQuery data는 기본 clone에 없고 nested object는 deep clone과 공유됨을 증명합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>clone lifecycle</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head>
<body><div id="clone-list">
  <article class="card"><button class="action" data-hits="0">실행</button></article>
</div><pre id="out"></pre>
<script>
  const $originalAction = $("#clone-list .action").first();
  $originalAction.data("state", { count: 0 }).on("click", function () {
    const $button = $(this);
    $button.attr("data-hits", Number($button.attr("data-hits")) + 1);
  });
  const $card = $originalAction.closest(".card");
  $card.clone(false, false).attr("data-copy", "plain").appendTo("#clone-list");
  const $deep = $card.clone(true, true).attr("data-copy", "deep").appendTo("#clone-list");
  $("#clone-list .action").trigger("click");
  const $actions = $("#clone-list .action");
  const hits = $actions.map(function () { return $(this).attr("data-hits"); }).get();
  const dataFlags = $actions.map(function () {
    return String(Boolean($(this).data("state")));
  }).get();
  $("#out").text([
    "cards=" + $("#clone-list .card").length,
    "hits=" + hits.join("|"),
    "has-data=" + dataFlags.join("|"),
    "shared-object=" + ($originalAction.data("state") === $deep.find(".action").data("state"))
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "11-15", explanation: "original button에 object data와 직접 click handler를 등록합니다." },
            { lines: "16-18", explanation: "기본 plain clone과 descendant event/data까지 copy하는 deep clone을 같은 list에 추가합니다." },
            { lines: "19-29", explanation: "세 buttons를 programmatically click해 handler/data 존재와 shared nested identity를 출력합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-clone-lifecycle.html을 열고 #out 확인" },
          output: { value: "cards=3\nhits=1|0|1\nhas-data=true|false|true\nshared-object=true", explanation: ["plain clone에는 direct handler/data가 없어 hit가 0입니다.", "deep clone에는 handler/data가 있지만 state object는 original과 같은 reference입니다."] },
          experiments: [
            { change: "$deep.data의 state.count를 증가시킵니다.", prediction: "original이 읽는 같은 object의 count도 증가합니다.", result: "clone(true,true)는 nested application state deep copy가 아닙니다." },
            { change: "button에 id와 label[for]를 추가한 뒤 clone합니다.", prediction: "duplicate ID와 ambiguous relationship이 생깁니다.", result: "instance identifiers를 다시 생성해야 합니다." },
            { change: "direct handler를 parent delegation으로 옮기고 clone(false,false)를 사용합니다.", prediction: "모든 동적 buttons가 parent handler로 작동합니다.", result: "event copy가 필요 없어집니다." },
          ],
          sourceRefs: ["web-jquery-clone-source", "jquery-clone-api", "html-id-reference-contract"],
        },
      ],
      diagnostics: [
        { symptom: "clone한 button이 보이지만 click handler가 실행되지 않는다.", likelyCause: "기본 .clone()은 직접 등록된 jQuery event/data를 복사하지 않습니다.", checks: ["clone arguments를 확인합니다.", "handler가 direct인지 delegated인지 봅니다.", "plugin/native listener도 별도 ownership인지 조사합니다."], fix: "독립 instance 초기화 또는 parent event delegation을 사용하고 꼭 필요할 때만 clone(true,true)를 검토합니다.", prevention: "DOM copy와 behavior initialization을 별도 factory contract로 만듭니다." },
        { symptom: "clone card 하나의 state를 바꾸자 원본과 다른 clone도 함께 바뀐다.", likelyCause: ".data() 안 object/array가 clone과 original 사이에 같은 reference로 공유됩니다.", checks: ["strict equality로 nested object identity를 비교합니다.", "closure external state도 공유되는지 봅니다.", "deep-copy 요구와 mutable fields를 정의합니다."], fix: "structuredClone/validated model factory 등 요구에 맞는 새 state를 instance마다 만들고 DOM clone에 state copy를 맡기지 않습니다.", prevention: "component state를 immutable data로 소유하고 clone shared-reference fixture를 둡니다." },
        { symptom: "clone한 form에서 select/textarea 값이 화면과 model 사이에 다르다.", likelyCause: "일부 form controls의 dynamic user state는 clone에서 보존되지 않을 수 있습니다.", checks: ["attribute/default/current value를 original/clone에서 각각 출력합니다.", "input/select/textarea 유형별로 test합니다.", "application model이 별도로 있는지 확인합니다."], fix: "validated source data에서 새 form을 render하고 current values를 명시적으로 설정합니다.", prevention: "form state persistence에 DOM clone을 사용하지 않고 serialization/model을 사용합니다." },
      ],
    },
    {
      id: "empty-remove-detach-lifecycle",
      title: "empty·remove·detach는 지우는 범위와 event/data 보존 정책이 다릅니다",
      lead: "잠깐 화면에서 빼는 것과 영구 폐기를 같은 delete로 처리하지 않습니다.",
      explanations: [
        ".empty()는 selected containers는 남기고 모든 child nodes를 제거합니다. element descendants뿐 아니라 Text nodes도 children이므로 text content도 사라지며 descendant jQuery data/events를 정리합니다.",
        ".remove()는 selected nodes 자체와 descendants를 DOM에서 제거하고 해당 nodes의 jQuery-bound events/data도 정리합니다. 영구 폐기와 cleanup intent에 맞습니다.",
        ".detach()는 selected nodes를 DOM에서 빼지만 jQuery data/events를 유지해 나중에 같은 nodes를 재삽입할 때 behavior를 보존합니다. 장기 cache로 남기면 retained DOM/memory가 되므로 owner가 필요합니다.",
        "remove가 반환한 wrapper에는 node references가 남아 다시 append할 수는 있지만 jQuery가 정리한 direct event/data는 돌아오지 않습니다. reference 생존과 managed resource 생존을 구분합니다.",
        "native remove/replaceChildren과 jQuery cleanup behavior도 다를 수 있습니다. jQuery plugin이 .data/events를 쓴다면 plugin destroy API를 먼저 호출해야 observer/timer/global listener까지 정리될 수 있습니다.",
        "SPA route와 modal close에서 detach를 무기한 반복하면 stale form values·duplicate IDs·hidden focusable nodes·memory retention이 생길 수 있습니다. 재사용 기간과 disposal event를 명시합니다.",
      ],
      concepts: [
        { term: "structural lifetime", definition: "container·selected node·descendants 중 무엇이 DOM tree에 남는지를 나타냅니다.", detail: ["empty/remove/detach가 다릅니다.", "text nodes도 포함합니다."] },
        { term: "managed lifetime", definition: "jQuery data·events와 plugin resources가 보존 또는 정리되는 기간입니다.", detail: ["detach는 data/events를 보존합니다.", "remove는 정리합니다."] },
        { term: "disposal", definition: "DOM removal뿐 아니라 event·observer·timer·data·network work를 종료하는 component lifecycle 단계입니다.", detail: ["plugin destroy를 포함할 수 있습니다.", "재삽입과 영구 종료를 구분합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-detach-remove-data-event",
          title: "detach와 remove한 button을 다시 넣어 event/data 수명을 비교합니다",
          language: "html",
          filename: "jquery-remove-detach.html",
          purpose: "두 node reference를 모두 재삽입해도 detach만 jQuery handler/data를 보존함을 exact output으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>remove detach</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head>
<body><div id="source">
  <button id="keep" data-hits="0">keep</button>
  <button id="drop" data-hits="0">drop</button>
</div><div id="bin"></div><pre id="out"></pre>
<script>
  function countHit() {
    const $button = $(this);
    $button.attr("data-hits", Number($button.attr("data-hits")) + 1);
  }
  const $keep = $("#keep").on("click", countHit).data("note", "kept").detach();
  const $drop = $("#drop").on("click", countHit).data("note", "dropped").remove();
  $("#bin").append($keep, $drop);
  $("#bin button").trigger("click");
  $("#out").text([
    "hits=" + $("#keep").attr("data-hits") + "|" + $("#drop").attr("data-hits"),
    "keep-data=" + $("#keep").data("note"),
    "drop-data=" + String($("#drop").data("note"))
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "11-14", explanation: "공통 direct handler는 각 button의 data-hits attribute를 증가시킵니다." },
            { lines: "15-16", explanation: "keep은 detach, drop은 remove 전에 같은 handler/data를 받습니다." },
            { lines: "17-23", explanation: "둘 다 reference로 재삽입하고 click해 preserved/cleaned resources를 출력합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-remove-detach.html을 열고 #out 확인" },
          output: { value: "hits=1|0\nkeep-data=kept\ndrop-data=undefined", explanation: ["detach한 keep은 event/data가 유지됩니다.", "remove한 drop node는 다시 넣을 수 있지만 jQuery event/data는 정리되어 click count가 0입니다."] },
          experiments: [
            { change: "#bin.empty() 뒤 $keep reference를 다시 append합니다.", prediction: "empty cleanup이 descendants의 jQuery events/data도 제거해 handler가 사라집니다.", result: "container가 남는다고 child resources가 보존되는 것은 아닙니다." },
            { change: "detach한 node를 1,000개 배열에 보관합니다.", prediction: "화면에는 없어도 references/data가 memory에 retained됩니다.", result: "cache eviction/dispose가 필요합니다." },
            { change: "direct handler 대신 document-level native listener와 timer를 plugin처럼 등록합니다.", prediction: "remove만으로 외부 resource가 자동 정리되지 않을 수 있습니다.", result: "component destroy contract가 필요합니다." },
          ],
          sourceRefs: ["web-jquery-clone-source", "jquery-removal-api", "dom-node-standard", "jquery-positional-migration-api", "trusted-types-standard"],
        },
      ],
      diagnostics: [
        { symptom: "remove했던 node를 reference로 다시 넣었더니 click과 .data가 사라졌다.", likelyCause: ".remove()가 DOM뿐 아니라 jQuery-managed event/data도 정리했습니다.", checks: ["remove/detach 중 무엇을 호출했는지 봅니다.", "재사용 intent와 disposal intent를 확인합니다.", "외부 native/plugin resources도 별도 조사합니다."], fix: "짧은 재삽입이 목적이면 detach를 owner 아래 사용하고, 영구 폐기면 새 instance를 initialize합니다.", prevention: "component API를 hide(detach 가능)와 destroy(remove+cleanup)로 분리합니다." },
        { symptom: "empty 뒤 container는 있는데 내부 text와 handler가 모두 사라졌다.", likelyCause: ".empty()는 element children뿐 아니라 text nodes와 descendant jQuery events/data를 제거합니다.", checks: ["container와 child identities를 분리해 확인합니다.", "textContent/childNodes length를 봅니다.", "descendant handler/data를 재초기화했는지 확인합니다."], fix: "content reset intent면 새 contents를 안전하게 render하고, 보존이 필요하면 detach할 nodes를 먼저 명시적으로 분리합니다.", prevention: "empty/remove/detach matrix와 expected resource lifecycle을 test합니다." },
      ],
    },
    {
      id: "batching-delegation-native-migration-testing",
      title: "대량 DOM 조작은 batch·delegation·data-driven rendering과 lifecycle test로 마무리합니다",
      lead: "API를 아는 것을 넘어 반복 삽입·복제·삭제가 운영에서 느려지거나 새지 않도록 구조를 바꿉니다.",
      explanations: [
        "loop마다 live DOM에 append하고 layout getter를 섞으면 style/layout 계산이 반복될 수 있습니다. detached container, DocumentFragment, array of prepared nodes 또는 한 번의 append로 batch하고 실제 browser performance profile로 측정합니다.",
        "repeated cards를 clone한 DOM에서 만들기보다 normalized data array→safe node factory→fragment→single insertion pipeline으로 만듭니다. identity, default state, IDs와 accessibility 관계를 instance마다 생성합니다.",
        "dynamic item behavior는 stable list의 delegated .on('click', '.action', handler)으로 두면 clone(true)와 per-item handler cleanup이 줄어듭니다. delegation root가 너무 전역이면 unrelated events와 selector cost가 커지므로 component root에 둡니다.",
        "native migration은 find→querySelectorAll within root, filter→Array.filter/matches, map→Array.from, append/prepend/before/after→동명 DOM methods, clone→cloneNode, empty→replaceChildren, remove→Element.remove로 대응합니다. 하지만 event/data cleanup semantics는 자동 등가가 아닙니다.",
        "browser tests는 final DOM text만 보지 않고 strict identity, parent/order, selection cardinality, duplicate IDs, label/ARIA references, keyboard/focus, handler count, data identity와 detached memory를 검사합니다.",
        "MutationObserver로 모든 operation을 production에서 기록하면 비용과 privacy가 커집니다. component-level counters와 error categories, duplicate init/dispose counts를 sampling해 관측합니다.",
        "undo/redo 요구가 있다면 detached DOM snapshots보다 source data/state transitions를 기록하는 편이 serialization·test·memory 측면에서 안정적입니다.",
      ],
      concepts: [
        { term: "DOM batching", definition: "여러 node를 live tree 밖에서 준비해 적은 횟수로 삽입하는 전략입니다.", detail: ["layout churn을 줄일 수 있습니다.", "focus/live-region semantics도 test합니다."] },
        { term: "data-driven render", definition: "DOM을 source of truth로 복제하지 않고 validated data에서 새 view instances를 만드는 구조입니다.", detail: ["identity가 명시됩니다.", "undo/test가 쉬워집니다."] },
        { term: "lifecycle regression test", definition: "mount·move·clone·detach·remove·remount에서 DOM과 managed resources의 변화를 함께 검증하는 test입니다.", detail: ["handler/data count를 포함합니다.", "accessibility relations도 검사합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "상품 1,000개 추가가 느리고 화면이 여러 번 튄다.", likelyCause: "live DOM에 반복 insertion과 layout reads를 섞어 mutation/layout work가 누적됩니다.", checks: ["Performance profile에서 style/layout/paint와 long task를 봅니다.", "append 횟수와 forced layout getter를 셉니다.", "fragment/batch before-after를 같은 data로 비교합니다."], fix: "safe nodes를 detached fragment에서 준비해 한 번 삽입하고 layout reads/writes를 phase로 분리합니다.", prevention: "representative list size performance budget과 focus/scroll preservation test를 둡니다." },
        { symptom: "동적 item을 만들 때마다 handler가 늘어 한 click이 여러 번 처리된다.", likelyCause: "clone(true) 또는 mount마다 direct handler를 복제·중복 등록하고 dispose하지 않았습니다.", checks: ["mount/handler count를 기록합니다.", "delegation root와 namespace를 확인합니다.", "remove/detach/remount sequence를 재현합니다."], fix: "component root 하나의 delegated handler와 idempotent mount/dispose로 통합합니다.", prevention: "한 click당 effect count와 remount leak test를 release gate에 둡니다." },
      ],
      comparisons: [
        { title: "동적 목록 instance 생성 전략", options: [
          { name: "DOM clone", chooseWhen: "작은 inert template이며 state·ID·event를 명시적으로 재초기화할 때", avoidWhen: "interactive form/state를 통째로 독립 복사한다고 기대할 때", tradeoffs: ["기존 structure를 빠르게 복사합니다.", "identity/event/data/form-state 위험을 소유합니다."] },
          { name: "data-driven factory", chooseWhen: "반복 interactive components와 testable state가 필요할 때", avoidWhen: "단순 일회성 static copy에 지나친 abstraction일 때", tradeoffs: ["새 identity와 state owner가 분명합니다.", "render factory 설계가 필요합니다."] },
          { name: "detach/reinsert", chooseWhen: "같은 instance를 잠시 숨기고 state/event를 유지할 때", avoidWhen: "장기 cache·영구 폐기·많은 hidden focusable nodes일 때", tradeoffs: ["같은 identity를 보존합니다.", "memory와 stale state를 유지합니다."] },
        ] },
      ],
      expertNotes: [
        "jQuery object count보다 live Node count, retained detached tree, handler/plugin resource와 mutation/layout time을 측정합니다.",
        "DOM order 변경은 screen reader reading order와 keyboard focus sequence를 바꿀 수 있으므로 visual snapshot만으로 insertion correctness를 판단하지 않습니다.",
      ],
    },
  ],
  lab: {
    title: "안전한 상품 보드: 탐색·필터·batch render·보관·삭제 lifecycle",
    scenario: "원본의 find/filter/map/insertion/clone/remove를 하나의 상품 보드로 통합합니다. 상품을 가격·할인 조건으로 좁히고 안전하게 카드로 만들며, 임시 보관과 영구 삭제의 event/data 수명을 명시합니다.",
    setup: [
      "id·name·price·sale을 가진 validated plain object 배열과 malicious-looking title fixture를 준비합니다.",
      "#catalog component root, filter controls, results list, detached parking area owner와 status live region을 만듭니다.",
      "jQuery 4.0.0 exact version과 한 번만 등록되는 delegated action handler를 사용합니다.",
      "DOM order·identity·event/data·duplicate ID를 확인하는 browser assertions를 준비합니다.",
    ],
    steps: [
      "root.find('.product-card')와 current cards.filter(predicate)의 차이를 self/outside control과 함께 확인합니다.",
      "Array.filter/map으로 source data를 변환하고 $('<article>')·.text()로 각 semantic card를 만듭니다.",
      "준비한 cards를 detached fragment 또는 한 번의 append로 results에 batch 삽입합니다.",
      "first/last/eq/even을 pure CSS selection 뒤 method로 적용하고 deprecated :eq/:even을 사용하지 않습니다.",
      "append/prepend/before/after로 status/summary 위치를 만들고 DOM reading/focus order를 검사합니다.",
      "한 existing badge를 두 targets에 append해 original/implicit clone identity를 관찰한 뒤 multi-target copy를 제거합니다.",
      "clone(false)와 clone(true,true)의 handler/data/shared-object 결과를 exact test로 고정합니다.",
      "임시 보관 action은 detach, 영구 삭제는 component destroy 후 remove를 사용합니다.",
      "보관 card 재삽입과 삭제 card 새 data-driven render를 비교하고 stale/duplicate handler를 검사합니다.",
      "malicious title, duplicate ID, 0/1/1,000 items, repeated mount/dispose, keyboard/focus와 memory profile을 검증합니다.",
    ],
    expectedResult: [
      "filter 결과와 화면 cards가 같은 stable product IDs/order를 가집니다.",
      "external title은 literal text로만 보이며 element/event attribute로 parse되지 않습니다.",
      "모든 interactive card IDs와 label/ARIA IDREF가 unique하고 keyboard order가 DOM order와 일치합니다.",
      "임시 보관 card는 같은 identity·state·delegated behavior를 유지하고 영구 삭제 card resource는 정리됩니다.",
      "remount와 batch insertion 후 한 action은 정확히 한 번 처리되고 handler/data leak이 없습니다.",
      "1,000 items에서도 반복 live append보다 batch pipeline이 정한 performance budget을 만족합니다.",
    ],
    cleanup: ["detached parking cache를 비우고 남은 nodes의 dispose를 호출합니다.", "temporary observers/timers/performance marks와 test event handlers를 제거합니다."],
    extensions: [
      "jQuery implementation을 native DocumentFragment/querySelectorAll/replaceChildren로 옮겨 behavior matrix를 비교합니다.",
      "undo/redo를 detached DOM이 아니라 immutable state transitions로 구현합니다.",
      "virtualized list를 적용하고 focus recovery·screen reader item count를 검증합니다.",
      "Trusted Types report-only policy로 남은 HTML string sinks를 inventory합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "네 원본의 find/filter/map/positional/insertion/clone 주석을 현재 jQuery 4 계약으로 교정하세요.", requirements: ["index++ predicate를 index % 2로 바꿉니다.", ":even/:eq selector를 .even()/.eq() method로 바꿉니다.", "[1,2,3,null] map 결과를 실제 출력하고 null input/return을 구분합니다.", "ex03 comment code를 실행 가능한 clone/remove/detach fixture로 만듭니다.", "다섯 exact examples의 예상 출력을 모두 맞춥니다."], hints: ["$.map은 callback return null을 drop합니다.", "ex03의 원래 page는 아무 조작도 실행하지 않습니다."], expectedOutcome: "원본 의도를 보존하면서 deprecated·부정확 설명을 현재 API와 evidence로 교정합니다.", solutionOutline: ["각 원본에서 실제 실행 line과 comment-only line을 먼저 표시합니다.", "return type과 DOM mutation을 별도 표로 만듭니다."] },
    { difficulty: "응용", prompt: "상품 data를 안전한 cards로 batch render하고 find/filter/map 결과를 화면과 검증하세요.", requirements: ["untrusted title은 .text()로 넣습니다.", "data filter와 DOM filter의 IDs가 일치해야 합니다.", "fragment 또는 단일 append로 batch합니다.", "component root의 delegated handler를 사용합니다.", "empty/large/malicious data와 keyboard order를 test합니다."], hints: ["HTML string concatenation을 사용하지 마세요.", "DOM을 source of truth로 다시 parse하지 말고 data IDs를 보존하세요."], expectedOutcome: "XSS와 duplicate handler 없이 확장 가능한 data-driven list가 완성됩니다.", solutionOutline: ["validate→filter→node factory→batch insert 순서를 고정합니다.", "render 뒤 identity/cardinality assertions를 실행합니다."] },
    { difficulty: "설계", prompt: "대형 legacy widget의 clone·detach·remove 정책과 native migration plan을 설계하세요.", requirements: ["node/event/data/plugin/timer/observer/resource lifetime matrix를 만듭니다.", "clone/새 render/detach 선택 기준과 maximum cache lifetime을 정의합니다.", "duplicate ID·form current state·shared nested data·memory leak tests를 포함합니다.", "jQuery/native API 대응에서 cleanup 차이를 기록합니다.", "rollout metric·rollback·accessibility/performance release gate를 정합니다."], hints: ["보이는 DOM만 지워졌다고 disposal이 끝난 것은 아닙니다.", "event delegation과 state factory로 clone 필요성을 줄이세요."], expectedOutcome: "재삽입과 영구 폐기를 혼동하지 않는 운영 가능한 component lifecycle/migration contract가 완성됩니다.", solutionOutline: ["owner와 lifecycle state diagram을 먼저 그립니다.", "실제 resource별 create/destroy evidence를 자동 test로 바꿉니다."] },
  ],
  reviewQuestions: [
    { question: ".find('.x')가 시작 element 자신도 검사하나요?", answer: "아닙니다. 시작 collection의 descendants만 candidates이며 자신 판정은 .is/.filter 등을 사용합니다." },
    { question: ".children()과 .find()의 깊이 차이는 무엇인가요?", answer: ".children()은 direct child 한 level, .find()는 모든 descendant depth를 탐색합니다." },
    { question: ".filter() 호출이 DOM node를 삭제하나요?", answer: "아닙니다. current members 중 조건을 통과한 새 jQuery collection을 반환합니다." },
    { question: "filter callback의 index++가 다음 callback index를 바꾸나요?", answer: "아닙니다. 각 호출에 새 parameter value가 전달되고 postfix increment는 local value만 바꿉니다." },
    { question: ":even과 :eq() selector를 신규 code에서 피하는 이유는 무엇인가요?", answer: "jQuery 3.4부터 deprecated인 non-standard selector extensions라 pure CSS base selection 뒤 .even/.eq methods가 권장됩니다." },
    { question: "collection .map과 $.map의 callback argument order는 무엇인가요?", answer: "collection .map은 index, element이고 $.map array는 value, index입니다." },
    { question: "$.map 입력 배열에 null이 있으면 언제나 없어지나요?", answer: "아닙니다. callback이 null/undefined를 반환한 result가 제외될 뿐이며 null*2는 0을 반환합니다." },
    { question: "$.map과 Array.map의 null callback return 차이는 무엇인가요?", answer: "$.map은 제외하고 Array.map은 null member로 그대로 보존합니다." },
    { question: "append와 after의 위치 차이는 무엇인가요?", answer: "append는 target의 last child, after는 target 다음 sibling입니다." },
    { question: "기존 node를 한 target에 append하면 복제되나요?", answer: "아닙니다. 같은 node identity가 old parent에서 새 parent로 이동합니다." },
    { question: "기존 node를 여러 jQuery targets에 append하면 원본은 어디로 가나요?", answer: "마지막 target에 원본이 가고 앞 targets에는 clones가 생성됩니다." },
    { question: "HTML string을 append할 때 external data를 직접 연결하면 안 되는 이유는 무엇인가요?", answer: "HTML parser가 script/event attributes를 code로 실행할 수 있는 XSS sink이기 때문입니다." },
    { question: "clone(true,true)는 .data 안 object도 deep copy하나요?", answer: "아닙니다. nested object/array references는 original과 clone이 공유할 수 있습니다." },
    { question: ".empty(), .remove(), .detach()의 핵심 차이는 무엇인가요?", answer: "empty는 children을 정리, remove는 selected nodes와 jQuery data/events를 정리, detach는 selected nodes를 빼되 data/events를 보존합니다." },
    { question: "remove가 반환한 node를 다시 append하면 event/data도 복구되나요?", answer: "node reference는 재삽입할 수 있지만 remove가 정리한 jQuery event/data는 자동 복구되지 않습니다." },
  ],
  completionChecklist: [
    "네 원본의 실행 code와 comment-only 학습 의도를 구분했다.",
    "find·children·filter의 self/direct/deep/current-set axes를 exact fixture로 검증했다.",
    "filter callback의 index++ 오해를 제거하고 pure predicate를 작성했다.",
    "deprecated :even/:eq selector를 .even/.eq method로 교정했다.",
    "collection .map·$.map·Array.map/filter의 callback과 return type을 구분했다.",
    "input null과 callback return null, coercion 0을 정확히 구분했다.",
    "append/prepend/before/after의 inside/outside/start/end order를 예측했다.",
    "existing node move와 multi-target implicit clone identity를 확인했다.",
    "duplicate id·label/ARIA IDREF·form state 위험을 검사했다.",
    "untrusted data를 HTML string에 연결하지 않고 safe text/property sink를 사용했다.",
    "clone의 root/descendant event·data options와 shared nested object를 검증했다.",
    "empty/remove/detach의 node·event·data lifecycle matrix를 작성했다.",
    "event delegation과 data-driven factory로 clone/handler copying을 줄였다.",
    "batch insertion의 performance와 DOM/focus/accessibility order를 browser에서 검증했다.",
    "native migration에서 DOM API 대응뿐 아니라 jQuery cleanup semantics 차이를 test했다.",
  ],
  nextSessions: ["jquery-03-style-attributes-form-state"],
  sources: [
    { id: "web-jquery-find-filter-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex11_jquery.html", usedFor: ["find descendants", "filter current set", "function predicate index", ":even legacy selector", "style subset"], evidence: "find/filter의 실제 실행을 사용하고 index++ 부수효과와 deprecated :even selector를 현재 methods로 교정했습니다." },
    { id: "web-jquery-map-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex12_jquery.html", usedFor: ["Array.map versus $.map", "null input/return", "member transform", "Array.filter", "$.grep"], evidence: "console comparison 전체를 감사해 null*2=0과 callback-return null dropping, callback order와 native filter 선택을 보강했습니다." },
    { id: "web-jquery-insertion-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex13_jquery.html", usedFor: ["append/prepend/before/after", ":eq/get", "existing paragraph identity", "inside/outside order"], evidence: "네 directions의 실제 mutation을 2×2 insertion matrix로 사용하고 deprecated :eq selector를 .eq method로 교정했습니다." },
    { id: "web-jquery-clone-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day11/ex03_jquery.html", usedFor: ["clone intention", "append/appendTo subject", "empty", "remove", "three container fixture"], evidence: "원본 조작 code가 모두 comment라 실행 evidence가 없음을 밝히고 event/data/depth/detach lifecycle examples로 재구성했습니다." },
    { id: "jquery-find-filter-api", repository: "OpenJS Foundation jQuery API", path: ".find() and tree traversal", publicUrl: "https://api.jquery.com/find/", usedFor: ["descendant candidates", "self exclusion", "children comparison", "new collection", "context equivalence"], evidence: "find가 각 current member의 descendants에서만 selector를 평가하는 공식 contract를 사용했습니다." },
    { id: "jquery-filter-api", repository: "OpenJS Foundation jQuery API", path: ".filter()", publicUrl: "https://api.jquery.com/filter/", usedFor: ["current-set reduction", "callback index/element/this", "selector/element/selection forms"], evidence: "filter의 candidate set, predicate signature와 jQuery return을 exact example 기준으로 사용했습니다." },
    { id: "jquery-map-each-api", repository: "OpenJS Foundation jQuery API", path: ".map() and .each()", publicUrl: "https://api.jquery.com/map/", usedFor: ["collection map signature", "jQuery return", ".get Array boundary", "DOM value transform", "each contrast"], evidence: "collection .map(index, element)와 returned wrapper 계약을 공식 API에 맞췄습니다." },
    { id: "jquery-static-map-api", repository: "OpenJS Foundation jQuery API", path: "jQuery.map()", publicUrl: "https://api.jquery.com/jQuery.map/", usedFor: ["value/index signature", "Array return", "null/undefined dropping", "one-level flatten", "object mapping"], evidence: "원본 null 설명을 callback return contract와 coercion evidence로 교정했습니다." },
    { id: "ecma-array-map-filter", repository: "ECMA International", path: "ECMAScript indexed collection methods", publicUrl: "https://tc39.es/ecma262/multipage/indexed-collections.html", usedFor: ["Array.map length/value preservation", "Array.filter predicate", "callback order", "native migration"], evidence: "plain Array transformations를 jQuery utilities와 비교하는 1차 language specification입니다." },
    { id: "jquery-positional-migration-api", repository: "OpenJS Foundation jQuery API", path: ":even and :eq selector deprecations", publicUrl: "https://api.jquery.com/even-selector/", usedFor: ["deprecated since 3.4", ".even method replacement", "zero-based matched set", "native selector performance"], evidence: "원본 positional extensions를 pure CSS base selection 뒤 method form으로 옮기는 기준입니다." },
    { id: "jquery-insertion-api", repository: "OpenJS Foundation jQuery API", path: ".append() and related insertion methods", publicUrl: "https://api.jquery.com/append/", usedFor: ["inside last-child insertion", "append versus appendTo", "existing node move", "multiple target clone", "HTML string XSS warning"], evidence: "삽입 위치·identity·multi-target cardinality와 untrusted HTML 금지를 공식 contract로 검증했습니다." },
    { id: "jquery-clone-api", repository: "OpenJS Foundation jQuery API", path: ".clone()", publicUrl: "https://api.jquery.com/clone/", usedFor: ["deep DOM copy", "event/data booleans", "descendant copy", "shared object/array data", "form dynamic state", "duplicate ID"], evidence: "원본의 단순 event 설명을 event·data·state·identity lifecycle 전체로 보강했습니다." },
    { id: "jquery-removal-api", repository: "OpenJS Foundation jQuery API", path: ".empty(), .remove(), .detach()", publicUrl: "https://api.jquery.com/detach/", usedFor: ["detach data/event preservation", "remove cleanup", "empty descendants/text", "reinsert lifecycle"], evidence: "임시 분리와 영구 삭제의 managed resource 차이를 공식 removal contracts에 맞췄습니다." },
    { id: "trusted-types-standard", repository: "W3C Web Application Security Working Group", path: "Trusted Types", publicUrl: "https://www.w3.org/TR/trusted-types/", usedFor: ["DOM XSS sinks", "TrustedHTML", "CSP enforcement", "policy review", "non-sanitizer boundary"], evidence: "HTML string insertion을 type/enforcement 가능한 injection sink로 다루는 보안 보강 기준입니다." },
    { id: "dom-node-standard", repository: "WHATWG DOM Standard", path: "Node tree mutation and cloning", publicUrl: "https://dom.spec.whatwg.org/", usedFor: ["single parent", "pre-insert move", "cloneNode", "remove", "DocumentFragment", "node identity"], evidence: "jQuery manipulation 아래 실제 DOM node tree와 identity 변화의 platform 기준입니다." },
    { id: "html-id-reference-contract", repository: "WHATWG HTML Standard", path: "global id attribute", publicUrl: "https://html.spec.whatwg.org/multipage/dom.html#the-id-attribute", usedFor: ["unique ID", "clone duplicate ID", "label and ARIA references", "component instance identity"], evidence: "interactive clone에서 identifiers와 cross-element relationships를 재생성해야 하는 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "inventory의 네 원본을 모두 읽고 사용했습니다. ex03의 clone/empty/remove code는 전부 comment이므로 실제 lifecycle 결과는 공식 API와 deterministic browser examples로 보완했습니다.",
      "ex11의 index++ predicate는 의미 없는 local side effect이고 :even selector는 deprecated이므로 index predicate와 .even method로 교정했습니다.",
      "ex12의 null 설명은 input null과 callback return null을 혼동하므로 null*2=0 actual output과 $.map drop/flatten contract로 교정했습니다.",
      "multi-target identity, XSS/Trusted Types, clone nested data·form state·duplicate IDs, detach/plugin disposal, batching·delegation·native migration은 원본에 없어 공식 1차 문서로 보강했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
