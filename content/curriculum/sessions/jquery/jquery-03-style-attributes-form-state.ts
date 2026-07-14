import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["jquery-03-style-attributes-form-state"],
  slug: "jquery-03-style-attributes-form-state",
  courseId: "javascript",
  moduleId: "02-jquery-legacy-migration",
  order: 3,
  title: "class·css·attr·prop과 폼 상태",
  subtitle: "HTML 초기값, 현재 DOM property, CSS 표현, ARIA 상태와 FormData 제출값을 분리하고 하나의 render 함수에서 다시 일치시킵니다.",
  level: "중급",
  estimatedMinutes: 370,
  coreQuestion: "class·style·attribute·property·value·ARIA·제출 데이터가 서로 어긋나지 않게, jQuery로 현재 폼 상태를 읽고 하나의 authoritative state에서 모든 파생 표현을 동기화하려면 어떻게 해야 할까요?",
  summary: "day10 ex05~ex10 여섯 원본을 모두 감사해 add/remove/toggleClass, css, attr/prop, :checked/:selected, val을 하나의 상태 층 모델로 재구성합니다. DOM에는 단일 상태가 없습니다. content attribute는 HTML의 선언·초기/default 정보를, DOM property는 사용자가 바꾼 현재 typed state를, class/inline/computed style은 화면 표현을, ARIA는 접근성 API에 전달할 상태를, FormData는 제출 entry list를 나타냅니다. ex05의 표현 중심 f_blue/bg_tomato class를 is-selected/has-error 같은 의미 있는 상태 class와 toggleClass(name, boolean)의 결정론적 render로 확장합니다. ex06의 .css getter는 inline source spelling이 아니라 rgb(...)처럼 정규화된 computed value를 돌려줄 수 있고, click target과 current handler element가 자식 클릭에서 달라지며, 결과 출력 code가 모두 comment라 msg가 실제로 표시되지 않습니다. ex07은 collection .each와 static $.each 설명을 섞고 index 기반 ID를 만들며 .text/.html 차이를 보여 줍니다. 이를 implicit iteration, stable identity와 HTML string XSS 경계로 교정합니다. ex08은 single select의 option 세 개에 selected, 같은 radio group 두 개에 checked를 모두 써 현재 상태와 default attributes가 갈리는 비정상 fixture입니다. 현재 selection은 각 group 마지막 항목으로 정리될 수 있어 attribute 존재만 세면 안 됩니다. ex09는 change가 일어난 뒤에만 summary를 그려 초기 화면이 비고, .val()로 programmatically 바꿔도 change가 자동 dispatch되지 않습니다. ex10의 '#select optin'과 'selectedI'는 selector와 property가 모두 오타라 조용히 아무 일도 하지 않습니다. 이 evidence를 attr/current/default/reset matrix, single/multiple value types, tri-state indeterminate, disabled versus aria-disabled/FormData, safe text, native migration과 state-invariant browser tests로 연결합니다.",
  objectives: [
    "content attribute·default property·current property·class·inline/computed style·ARIA·FormData의 역할을 구분할 수 있다.",
    "addClass/removeClass/hasClass/toggleClass(name, boolean)로 authoritative boolean에서 결정론적 UI를 만들 수 있다.",
    ".css() getter/setter와 inline/computed value, CSS custom property, class 기반 상태의 선택 기준을 설명할 수 있다.",
    ".attr()와 .prop()을 checked/defaultChecked·selected/defaultSelected·selectedIndex·disabled에 정확히 적용할 수 있다.",
    ":checked/:selected와 .val()로 checkbox·radio·single/multiple select의 현재 값을 올바른 type/cardinality로 읽을 수 있다.",
    "programmatic .val/.prop 변경이 change event를 자동 발생시키지 않는 이유와 공용 transition/render 해법을 구현할 수 있다.",
    "none/some/all/empty를 구분하는 전체 선택과 indeterminate·submit disabled·summary를 한 번에 동기화할 수 있다.",
    "disabled와 aria-disabled의 focus·동작·제출 차이, .text/.html 신뢰 경계와 접근성 상태를 test할 수 있다.",
  ],
  prerequisites: [
    { title: "jQuery ready와 collection", reason: "getter는 주로 첫 element를 읽고 setter는 collection 전체에 쓰는 jQuery collection cardinality를 전제로 합니다.", sessionSlug: "jquery-01-ready-selectors" },
    { title: "HTML 폼 controls와 validation", reason: "checkbox·radio·select·disabled·name과 FormData의 browser-native 제출 계약을 이해해야 합니다.", sessionSlug: "html-08-form-controls-validation" },
    { title: "DOM attribute·property와 폼 상태", reason: "jQuery attr/prop/val 아래에서 동작하는 current/default/dirty/reset과 class/dataset 모델을 native API와 대조합니다.", sessionSlug: "js-07-dom-attributes-forms" },
  ],
  keywords: ["jQuery class", "addClass", "removeClass", "toggleClass", "hasClass", "css", "computed style", "attr", "prop", "checked", "defaultChecked", "selected", "defaultSelected", "selectedIndex", "val", "change", "indeterminate", "disabled", "aria-disabled", "FormData", "text", "html", "visible", "state invariant"],
  chapters: [
    {
      id: "source-audit-state-layer-map",
      title: "상태를 한 칸에 넣지 말고 선언·현재값·표현·접근성·제출의 층으로 나눕니다",
      lead: "같은 checkbox 하나도 HTML source와 현재 UI, reset 기준과 server payload에서 서로 다른 값을 가질 수 있습니다.",
      explanations: [
        "content attribute는 markup의 문자열 또는 존재 여부입니다. checked/selected/disabled 같은 boolean attribute는 값이 'false'여도 존재하면 true 의미를 가지며, 현재 사용자의 조작 상태와 항상 같지 않습니다.",
        "DOM property는 checked boolean, selectedIndex number, value string처럼 현재 typed state를 나타냅니다. checked attribute는 current checked property보다 defaultChecked와 연결되고 selected attribute도 defaultSelected baseline과 연결됩니다.",
        "class와 inline style은 visual representation입니다. accessibility state를 자동으로 만들거나 business rule의 신뢰 가능한 source가 되지 않습니다. ARIA는 accessibility API에 상태를 전달하지만 native behavior나 submit exclusion을 대신하지 않습니다.",
        "FormData는 successful controls의 현재 entry list입니다. name 없는 control, disabled control, unchecked checkbox/radio 등은 빠질 수 있어 화면에 보이는 모든 input이 payload에 들어간다고 가정하면 안 됩니다.",
        "원본 여섯 파일은 각 API syntax를 폭넓게 보여 주지만 이 층의 관계를 한 모델로 묶지 않습니다. 이번 세션은 application state 또는 current native property를 authoritative source로 정하고 render에서 class/property/ARIA/summary를 함께 갱신합니다.",
        "getter는 흔히 첫 element에서 읽고 setter는 collection 전체에 implicit iteration합니다. empty collection getter는 undefined, setter는 silent no-op이 될 수 있어 selector cardinality도 상태 계약에 포함합니다.",
      ],
      concepts: [
        { term: "content attribute", definition: "HTML source/attribute map에 존재하는 문자열 또는 presence 기반 선언입니다.", detail: ["초기/default state와 연결됩니다.", "현재 property와 다를 수 있습니다."] },
        { term: "current property", definition: "사용자와 script 조작 뒤 control이 현재 가진 typed DOM state입니다.", detail: ["checked/value/selectedIndex 등이 있습니다.", "제출과 화면 판정의 주된 근거입니다."] },
        { term: "derived representation", definition: "authoritative state에서 계산되는 class·style·ARIA·summary·button disabled 같은 표현입니다.", detail: ["다시 source of truth로 읽지 않습니다.", "한 render에서 동기화합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "화면 checkbox는 꺼졌는데 attr('checked')는 계속 존재한다.", likelyCause: "current checked property가 아니라 initial/default content attribute를 읽었습니다.", checks: ["attr('checked'), prop('checked'), prop('defaultChecked')를 함께 출력합니다.", "사용자 조작과 form.reset 전후를 비교합니다.", "업무 요구가 current인지 default인지 정합니다."], fix: "현재 선택 판정은 .prop('checked') 또는 .is(':checked'), reset baseline은 defaultChecked/attribute로 분리합니다.", prevention: "initial/current/default/reset matrix를 control 유형별 browser test로 둡니다." },
      ],
    },
    {
      id: "semantic-state-classes",
      title: "class는 색 이름이 아니라 상태의 의미를 표현하고 boolean force로 결정론적으로 갱신합니다",
      lead: "무조건 뒤집는 toggle 대신 원하는 최종 상태를 먼저 계산합니다.",
      explanations: [
        ".addClass와 .removeClass는 기존 class tokens를 보존하면서 하나 이상 tokens를 추가·제거합니다. class attribute 전체를 .attr('class', ...)로 덮으면 layout/utility/component classes를 잃을 수 있습니다.",
        "원본 ex05의 f_blue·bg_tomato는 결과 색을 직접 이름에 넣어 redesign과 behavior가 결합됩니다. is-selected·is-expanded·has-error·is-pending처럼 상태 의미를 class로 두고 실제 색/배치는 CSS가 소유하게 합니다.",
        ".toggleClass(name) 무인수 상태 전환은 현재 DOM class를 읽어 반대로 바꿉니다. handler 중복 실행, async retry, reset 뒤 render에서 의도와 반대가 될 수 있습니다.",
        ".toggleClass(name, stateBoolean)는 true면 add, false면 remove해 같은 state로 여러 번 호출해도 결과가 같습니다. jQuery API는 단순 truthy/falsy가 아니라 boolean 인수를 요구하므로 Boolean conversion과 domain state를 명시합니다.",
        ".hasClass는 matched set 중 하나라도 class를 가지면 true입니다. 각 element별 state가 필요하면 .each/map 또는 authoritative model을 사용하고 collection 전체가 같은 상태라고 오해하지 않습니다.",
        "class는 visual hook이므로 disabled/checked 같은 native behavior가 필요하면 property도 같이 갱신합니다. aria-expanded 같은 accessibility state도 같은 render transition에서 갱신하되 class에서 역추론하지 않습니다.",
      ],
      concepts: [
        { term: "state class", definition: "색상·크기보다 UI의 의미 있는 상태를 나타내는 class token입니다.", detail: ["is-selected/has-error가 예입니다.", "CSS와 behavior coupling을 줄입니다."] },
        { term: "forced toggle", definition: "toggleClass의 boolean 인수로 원하는 최종 class 존재 여부를 명시하는 방식입니다.", detail: ["재실행에 안전합니다.", "blind toggle drift를 막습니다."] },
        { term: "idempotent render", definition: "같은 state로 여러 번 호출해도 DOM 결과가 더 이상 바뀌지 않는 render입니다.", detail: ["retry/remount에 강합니다.", "불변식 test가 쉽습니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-class-css-attribute-state",
          title: "상태 class, inline custom property와 일반 attribute를 설정·제거합니다",
          language: "html",
          filename: "jquery-class-css-attr.html",
          purpose: "class token 보존, forced toggle, inline style/attribute 제거 결과를 exact value로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>class css attr</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head>
<body><div id="card" class="card">강의 카드</div><pre id="out"></pre>
<script>
  const $card = $("#card");
  $card
    .addClass("is-selected")
    .toggleClass("is-muted", false)
    .css({ "--accent": "tomato", width: "160px" })
    .attr("title", "선택됨");
  const lines = [
    "class=" + $card.attr("class"),
    "selected=" + $card.hasClass("is-selected"),
    "title=" + $card.attr("title"),
    "inline-accent=" + $card[0].style.getPropertyValue("--accent"),
    "inline-width=" + $card[0].style.width
  ];
  $card.css("--accent", "").removeAttr("title");
  lines.push(
    "after-remove-accent=" + ($card[0].style.getPropertyValue("--accent") || "(empty)"),
    "after-remove-title=" + String($card.attr("title"))
  );
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "9-14", explanation: "base card class를 보존하고 selected만 add, muted는 false로 확실히 제거하며 inline properties와 title을 설정합니다." },
            { lines: "15-21", explanation: "class/attribute와 DOM style declaration의 exact state를 getter로 기록합니다." },
            { lines: "22-27", explanation: "custom property empty setter와 removeAttr 뒤 absence를 문자열로 명시합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-class-css-attr.html을 열고 #out 확인" },
          output: { value: "class=card is-selected\nselected=true\ntitle=선택됨\ninline-accent=tomato\ninline-width=160px\nafter-remove-accent=(empty)\nafter-remove-title=undefined", explanation: ["base class는 유지되고 semantic state class만 추가됩니다.", "inline declaration과 title은 제거 후 empty/undefined 경계로 확인됩니다."] },
          experiments: [
            { change: ".attr('class','is-selected')로 바꿉니다.", prediction: "base card class가 사라집니다.", result: "token API를 사용해야 합니다." },
            { change: ".toggleClass('is-selected')를 두 번 실행합니다.", prediction: "최종 상태는 원래대로지만 중간 render가 뒤집힙니다.", result: "authoritative boolean을 force 인수로 전달합니다." },
            { change: "width 값을 숫자 160으로 줍니다.", prediction: "jQuery 4가 width처럼 제한된 property에는 px를 붙입니다.", result: "모든 numeric CSS property에 일반화하지 않습니다." },
          ],
          sourceRefs: ["web-jquery-class-css-attr-source", "jquery-class-api", "jquery-css-api", "jquery-attr-api"],
        },
      ],
      diagnostics: [
        { symptom: "toggle handler가 두 번 실행되자 visual state와 model이 반대로 된다.", likelyCause: "현재 class를 무조건 뒤집는 blind toggle을 transition과 render 모두에서 호출했습니다.", checks: ["handler/mount 호출 수를 기록합니다.", "authoritative boolean과 hasClass 결과를 비교합니다.", "toggleClass에 force 인수가 있는지 봅니다."], fix: "state를 먼저 계산하고 toggleClass(name, state), prop/ARIA/summary를 한 render에서 갱신합니다.", prevention: "같은 state로 render를 두 번 호출하는 idempotence test를 둡니다." },
      ],
    },
    {
      id: "inline-computed-css-boundary",
      title: ".css() getter는 source 문자열이 아니라 computed style일 수 있고 setter는 inline declaration을 만듭니다",
      lead: "표시 색을 application state로 비교하지 않고 style source와 computed result를 구분합니다.",
      explanations: [
        "원본 ex05의 .css(name,value)는 matched elements의 inline style declaration을 씁니다. object setter는 여러 properties를 한 call에 쓰고 collection 전체에 implicit iteration합니다.",
        "원본 ex06의 $(this).css('background-color') getter는 cascade 뒤 computed value를 읽어 source의 red 대신 rgb(255, 0, 0) 같은 normalized serialization을 반환할 수 있습니다. raw 문자열 equality로 state를 판정하지 않습니다.",
        ".css(name,'')는 해당 inline declaration을 제거하지만 stylesheet rule까지 지우지는 않습니다. 제거 뒤 computed value는 inherited/author/style default가 다시 적용될 수 있습니다.",
        "CSS custom property는 '--accent'처럼 원형 이름을 사용합니다. 일반 property camelCase/kebab handling과 달리 custom property 이름을 camelCase로 바꾸지 않습니다.",
        "jQuery 4에서 numeric setter가 자동 px를 붙이는 property 범위는 width/height/border/margin/padding 중심으로 제한되었습니다. unit을 명시하는 string이 version migration에 더 분명합니다.",
        "computed getter가 layout을 요구하는 property와 DOM writes를 반복해서 교차하면 layout thrashing이 생길 수 있습니다. reads와 writes를 phase로 분리하고 state 판정은 class/model에서 합니다.",
        "원본 ex06은 click callback에서 msg를 계산하지만 모든 출력 line이 comment라 page에 아무 결과도 보여 주지 않습니다. 또한 e.target===this는 div에 child가 없을 때만 우연히 같고 child click에서는 달라집니다.",
      ],
      concepts: [
        { term: "inline style", definition: "element style attribute에 직접 저장되는 author declaration입니다.", detail: [".css setter가 주로 만듭니다.", "class stylesheet보다 재사용성이 낮습니다."] },
        { term: "computed style", definition: "cascade·inheritance·layout을 거쳐 browser가 계산한 현재 property value입니다.", detail: ["serialization이 source와 다를 수 있습니다.", "layout read 비용이 있을 수 있습니다."] },
        { term: "CSS custom property", definition: "--name 형태로 선언·상속되는 author-defined CSS value입니다.", detail: ["이름을 그대로 사용합니다.", "문자열이며 업무 보안 state가 아닙니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: ".css('background-color') === 'red' 비교가 false다.", likelyCause: "computed getter가 rgb(...) 등 normalized value를 반환했습니다.", checks: ["element.style.backgroundColor와 .css getter를 함께 출력합니다.", "class/stylesheet/cascade source를 확인합니다.", "browser별 serialization을 test합니다."], fix: "업무 상태는 class/model로 판정하고 color equality가 필요하면 CSSOM normalization을 고려합니다.", prevention: "presentation value를 business branch 조건으로 사용하지 않습니다." },
        { symptom: ".css(name,'') 뒤에도 화면 style이 남는다.", likelyCause: "inline declaration만 제거되어 stylesheet 또는 inherited rule이 다시 적용되었습니다.", checks: ["element.style과 getComputedStyle를 구분합니다.", "matched CSS rules/cascade를 봅니다.", "shorthand/longhand 관계를 확인합니다."], fix: "상태 class를 제거하거나 해당 stylesheet rule의 조건을 바꾸고 inline removal만으로 모든 style이 사라진다고 가정하지 않습니다.", prevention: "style ownership을 class/stylesheet 중심으로 정하고 inline override를 제한합니다." },
      ],
      expertNotes: [
        "색·길이 computed reads를 telemetry로 수집하지 말고 state token과 transition duration 같은 의미 있는 metric을 수집합니다.",
        "visual-only style change가 focus/contrast/zoom/reduced-motion 요구를 깨뜨리지 않는지 accessibility test를 함께 실행합니다.",
      ],
    },
    {
      id: "attribute-property-default-current",
      title: "attr은 선언 문자열, prop은 현재 typed state를 다루며 boolean control에는 default state도 있습니다",
      lead: "checked 하나를 initial·current·default 세 열로 찍으면 attr/prop 혼동이 사라집니다.",
      explanations: [
        ".attr(name)는 첫 element의 content attribute string 또는 absence의 undefined를 반환합니다. .prop(name)는 DOM object의 property value를 읽어 boolean/number/object가 될 수 있습니다.",
        "boolean attribute는 checked='false'여도 presence semantics로 초기 true입니다. 현재 상태를 끄려면 .prop('checked', false) 또는 적절한 native property를 사용합니다.",
        "checked attribute는 current checked보다 defaultChecked와 연결됩니다. 사용자가 current를 바꿔도 attribute가 자동 제거되지 않고 form.reset은 default baseline으로 되돌립니다. selected/defaultSelected도 같은 구분이 필요합니다.",
        "selectedIndex와 indeterminate는 attribute 문자열로 다루는 대상이 아니라 property입니다. ex10은 selectedIndex getter를 올바르게 쓰지만 setter line에서 optin/selectedI 두 오타로 empty collection·임의 property write가 조용히 실패합니다.",
        "jQuery 4에서는 non-ARIA attribute setter에 false를 주면 remove할 수 있지만 aria-* false는 absence와 의미가 달라 문자열 'false'로 남깁니다. 확실한 removal은 removeAttr 또는 null을 사용합니다.",
        "property를 바꿔도 input/change event가 자동 발생하지 않습니다. application state와 render를 직접 갱신하고, 정말 같은 event pipeline을 실행해야 할 때만 의도적으로 trigger합니다.",
      ],
      concepts: [
        { term: "boolean attribute", definition: "문자열 값이 아니라 attribute 존재 자체가 true를 뜻하는 HTML attribute입니다.", detail: ["'false'도 존재하면 true입니다.", "checked/disabled/selected 등이 있습니다."] },
        { term: "defaultChecked/defaultSelected", definition: "form reset과 initial state의 기준이 되는 properties입니다.", detail: ["content attribute와 연결됩니다.", "current checked/selected와 분리됩니다."] },
        { term: "property-only state", definition: "indeterminate·selectedIndex처럼 동일한 content attribute로 표현하지 않는 current DOM state입니다.", detail: ["prop/native property를 사용합니다.", "serialization 때 별도 처리합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-checked-attribute-property-matrix",
          title: "checked attribute·current property·default property 변화를 나란히 봅니다",
          language: "html",
          filename: "jquery-attr-prop-checked.html",
          purpose: "jQuery 4 boolean attr return과 current/default 분리를 exact snapshots로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>attr prop checked</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head>
<body><input id="terms" type="checkbox" checked><pre id="out"></pre>
<script>
  const $terms = $("#terms");
  const lines = [];
  function snapshot(label) {
    lines.push(
      label + ":attr=" + String($terms.attr("checked")) +
      ",prop=" + $terms.prop("checked") +
      ",default=" + $terms.prop("defaultChecked")
    );
  }
  snapshot("initial");
  $terms.prop("checked", false);
  snapshot("current-off");
  $terms.removeAttr("checked");
  snapshot("remove-attr");
  $terms.prop("checked", true);
  snapshot("current-on");
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "9-16", explanation: "같은 control의 content attribute, current checked와 defaultChecked를 한 snapshot에 기록합니다." },
            { lines: "17-22", explanation: "current off는 default/attribute를 유지하지만 removeAttr은 default baseline도 false로 바꿉니다." },
            { lines: "23-25", explanation: "current만 다시 true로 해도 attribute/default는 되살아나지 않습니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-attr-prop-checked.html을 열고 #out 확인" },
          output: { value: "initial:attr=,prop=true,default=true\ncurrent-off:attr=,prop=false,default=true\nremove-attr:attr=undefined,prop=false,default=false\ncurrent-on:attr=undefined,prop=true,default=false", explanation: ["jQuery 4의 bare boolean attr getter는 빈 문자열입니다.", "current와 default는 독립적으로 갈라지고 attribute removal이 default를 바꿉니다."] },
          experiments: [
            { change: "checked='false' markup으로 바꿉니다.", prediction: "initial prop/default는 여전히 true입니다.", result: "boolean attribute는 value text가 아니라 presence입니다." },
            { change: "current-off 뒤 form.reset()을 호출합니다.", prediction: "attribute/default가 남아 checked가 true로 돌아옵니다.", result: "reset은 default baseline을 사용합니다." },
            { change: ".attr('aria-disabled', false)를 호출합니다.", prediction: "jQuery 4는 attribute를 지우지 않고 'false' 문자열을 둡니다.", result: "ARIA false와 absence를 구분합니다." },
          ],
          sourceRefs: ["web-jquery-prop-form-source", "jquery-attr-api", "jquery-prop-api", "html-input-state-standard"],
        },
      ],
      diagnostics: [
        { symptom: "disabled='false'인데 control이 비활성이다.", likelyCause: "boolean attribute의 value text를 false boolean으로 해석했습니다.", checks: ["hasAttribute/attr과 prop('disabled')를 비교합니다.", "server template가 문자열 false를 쓰는지 봅니다.", "ARIA와 native disabled를 분리합니다."], fix: ".prop('disabled', false) 또는 removeAttr로 presence를 제거합니다.", prevention: "boolean attributes를 string interpolation하지 말고 conditional presence/property로 render합니다." },
        { symptom: "2번 옵션 선택 버튼이 아무 반응도 오류도 없다.", likelyCause: "원본처럼 '#select optin' selector와 'selectedI' property가 모두 오타라 empty collection setter가 no-op입니다.", checks: ["$('#select optin').length를 확인합니다.", "selectedIndex spelling과 실제 value를 출력합니다.", "필수 selector assertion을 둡니다."], fix: "$('#select').prop('selectedIndex', 1) 또는 $('#select').val('opt2')를 사용하고 summary를 render합니다.", prevention: "required selector count와 property after-write assertion을 browser test에 둡니다." },
      ],
    },
    {
      id: "single-radio-select-current-state",
      title: "checkbox·radio·single select는 attribute 개수가 아니라 현재 checkedness·selectedness를 읽습니다",
      lead: "비정상 초기 markup도 browser가 만든 현재 state와 reset baseline을 따로 검사합니다.",
      explanations: [
        ":checked는 현재 checked checkbox/radio뿐 아니라 selected option도 match할 수 있습니다. checkbox/radio group을 명확한 input selector와 함께 사용해 의도를 드러냅니다.",
        ":selected는 option current selectedness를 고르는 jQuery extension이며 표준 CSS가 아닙니다. pure CSS option query 뒤 .filter(':selected') 또는 select.val()/native selectedOptions를 사용하면 migration boundary가 분명합니다.",
        "원본 ex08 single select는 세 options에 selected attribute를 모두, radio group 두 inputs에 checked attribute를 모두 둡니다. single-selection invariant 때문에 현재 UI는 마지막 option opt3와 마지막 radio woman이 true가 될 수 있지만 content/default attributes는 여러 개 남습니다.",
        "따라서 $('[selected]').length나 $('[checked]').length를 현재 선택 개수로 사용하면 틀립니다. option:selected, :checked, .prop('selected/checked'), .val을 현재 state 기준으로 사용합니다.",
        "checkbox collection .val() getter는 선택된 전체 values를 자동 array로 주지 않고 첫 element의 value를 읽을 수 있습니다. 현재 checked subset을 만들고 .map(function(){ return this.value; }).get()으로 수집합니다.",
        "single select/radio에서 no current value는 undefined/null/empty 정책을 application schema로 normalize합니다. magic string 'undefined'를 server payload로 보내지 않습니다.",
      ],
      concepts: [
        { term: "checkedness", definition: "checkbox/radio의 현재 boolean selection state입니다.", detail: ["checked content attribute와 다릅니다.", "radio group invariant가 적용됩니다."] },
        { term: "selectedness", definition: "option의 현재 선택 state입니다.", detail: ["selected/defaultSelected와 구분합니다.", "single/multiple select cardinality가 다릅니다."] },
        { term: "selection invariant", definition: "single select와 같은-name radio group이 현재 하나 이하/하나의 선택만 유지하는 규칙입니다.", detail: ["비정상 markup도 current state가 정리될 수 있습니다.", "default attributes는 별도로 남을 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "single select/radio에서 checked/selected attributes가 여러 개인데 화면에는 하나만 보인다.", likelyCause: "content/default declarations와 browser가 유지하는 current single-selection state를 같은 것으로 셌습니다.", checks: ["attribute presence, defaultSelected/defaultChecked, current selected/checked를 각각 출력합니다.", "DOM order와 reset 결과를 확인합니다.", "server-generated markup 유효성을 검사합니다."], fix: "markup default를 하나로 교정하고 current state는 property/val로 읽습니다.", prevention: "single-selection control 생성기에서 multiple defaults를 거부하고 current/default browser fixture를 둡니다." },
      ],
    },
    {
      id: "val-types-programmatic-change",
      title: ".val() 반환 type은 control cardinality에 따라 달라지고 setter는 change를 자동 발생시키지 않습니다",
      lead: "값을 바꾸는 것과 값 변화 event를 알리는 것을 별도 transition으로 다룹니다.",
      explanations: [
        "text/radio/single select getter는 보통 string 또는 no-value의 undefined를 다룹니다. multiple select getter는 selected values의 array를 반환할 수 있어 string으로 곧바로 trim하는 code가 깨질 수 있습니다.",
        "checkbox collection getter는 collection 전체 checked values가 아니라 first element value를 읽는 getter-first behavior입니다. checked subset .map().get 또는 FormData.getAll을 사용합니다.",
        "원본 ex09는 change handlers 안에서 네 summary를 그리므로 initial selected/checked values가 있어도 사용자가 처음 조작하기 전 결과 영역이 비어 있습니다. handler와 render를 분리하고 page initialization에서 render를 한 번 호출합니다.",
        ".val(value) 또는 native value property로 값을 programmatically 바꿔도 change event는 dispatch되지 않습니다. jQuery 공식 문서도 의도적으로 handler를 실행하려면 .trigger('change')를 별도로 호출하라고 설명합니다.",
        "모든 programmatic write 뒤 event를 무조건 trigger하면 handler loop와 중복 side effect가 생길 수 있습니다. setState→render 또는 updateValue(value,{notify})처럼 owner가 notification policy를 정합니다.",
        "form submission 관점은 control별 getter를 다시 조립하기보다 FormData를 사용해 name, disabled, checked, multiple semantics와 동일한 entry list를 확인합니다. 화면 summary와 payload를 서로 대조합니다.",
      ],
      concepts: [
        { term: "getter cardinality", definition: "하나의 getter가 first value, one group value 또는 values array 중 무엇을 반환하는지에 대한 계약입니다.", detail: ["control/multiple 상태에 따라 다릅니다.", "undefined/empty 정책을 둡니다."] },
        { term: "programmatic transition", definition: "script가 property/value를 바꾸는 state change입니다.", detail: ["user event가 자동 발생하지 않습니다.", "render/notify policy를 명시합니다."] },
        { term: "FormData entry list", definition: "form의 successful controls에서 name/value pairs를 구성한 실제 제출 모델입니다.", detail: ["getAll로 repeated names를 읽습니다.", "disabled/unchecked/no-name은 빠질 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-form-current-values-change",
          title: "checkbox·radio·single/multiple select 현재 값과 programmatic change를 출력합니다",
          language: "html",
          filename: "jquery-val-current-state.html",
          purpose: "value cardinality와 .val setter/change dispatch 분리를 한 fixture에서 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>val current state</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<label><input type="checkbox" name="hobby" value="독서" checked>독서</label>
<label><input type="checkbox" name="hobby" value="자전거">자전거</label>
<label><input type="checkbox" name="hobby" value="영화" checked>영화</label>
<label><input type="radio" name="gender" value="man">남성</label>
<label><input type="radio" name="gender" value="woman" checked>여성</label>
<select id="course"><option value="opt1">옵션1</option><option value="opt2" selected>옵션2</option></select>
<select id="sweets" multiple><option value="chocolate" selected>chocolate</option><option value="candy">candy</option><option value="fudge" selected>fudge</option></select>
<pre id="out"></pre><script>
  let changes = 0;
  $("#course").on("change", function () { changes += 1; });
  const hobbies = $("input[name='hobby']:checked").map(function () {
    return this.value;
  }).get();
  const lines = [
    "hobbies=" + hobbies.join("|"),
    "gender=" + $("input[name='gender']:checked").val(),
    "course=" + $("#course").val(),
    "sweets=" + ($("#sweets").val() ?? []).join("|"),
    "missing=" + String($("input[name='missing']:checked").val())
  ];
  $("#course").val("opt1");
  lines.push("after-set=" + $("#course").val() + ",changes=" + changes);
  $("#course").trigger("change");
  lines.push("after-trigger=" + $("#course").val() + ",changes=" + changes);
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "6-13", explanation: "repeated checkbox/radio names, single select와 multiple select의 current state fixture를 만듭니다." },
            { lines: "17-27", explanation: "checked hobbies를 Array로 수집하고 one/multiple/no-match getter types를 기록합니다." },
            { lines: "28-32", explanation: ".val setter 직후와 explicit change trigger 뒤 counter를 비교합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-val-current-state.html을 열고 #out 확인" },
          output: { value: "hobbies=독서|영화\ngender=woman\ncourse=opt2\nsweets=chocolate|fudge\nmissing=undefined\nafter-set=opt1,changes=0\nafter-trigger=opt1,changes=1", explanation: ["checked subset의 두 hobbies와 one radio value가 현재 state입니다.", "multiple val은 array이고 missing getter는 undefined입니다.", "setter만으로 change counter는 증가하지 않습니다."] },
          experiments: [
            { change: "$('#sweets').val([])을 호출합니다.", prediction: "selected values가 empty array가 됩니다.", result: "empty multi-selection policy를 UI/payload와 동기화합니다." },
            { change: "checkbox collection 전체에 .val()을 호출합니다.", prediction: "checked values array가 아니라 첫 element의 value를 읽는 혼동이 생깁니다.", result: "checked subset map/get 또는 FormData.getAll을 씁니다." },
            { change: ".trigger('change') handler 안에서 다시 .val(...).trigger('change')합니다.", prediction: "guard가 없으면 recursive/duplicate processing이 생길 수 있습니다.", result: "transition owner와 notify option을 둡니다." },
          ],
          sourceRefs: ["web-jquery-initial-form-source", "web-jquery-change-values-source", "jquery-val-api", "jquery-form-selectors-api", "html-form-entry-standard"],
        },
      ],
      diagnostics: [
        { symptom: ".val()로 course를 바꿨는데 summary는 이전 값이다.", likelyCause: "programmatic value setter가 change event를 자동 dispatch하지 않아 event handler 기반 render가 실행되지 않았습니다.", checks: ["setter 직후 actual val과 summary를 비교합니다.", "change handler call count를 기록합니다.", "render가 event 안에만 갇혔는지 봅니다."], fix: "공용 state transition/render를 직접 호출하고 external observers에게 notification이 필요할 때만 명시 trigger합니다.", prevention: "user change와 programmatic change를 같은 pure render/validator로 test합니다." },
        { symptom: "multiple select value에서 join/trim type error가 난다.", likelyCause: "single string과 multiple array 반환을 하나의 string type으로 가정했습니다.", checks: ["multiple property와 Array.isArray(value)를 확인합니다.", "empty selection return을 test합니다.", "schema normalization 위치를 찾습니다."], fix: "control contract에 따라 string|string[]|undefined를 normalize하고 UI/payload types를 명시합니다.", prevention: "one/none/many fixtures와 TypeScript union을 사용합니다." },
      ],
    },
    {
      id: "tri-state-select-all-derived-ui",
      title: "전체 선택은 true/false 두 상태가 아니라 none·some·all·empty 네 경우를 계산합니다",
      lead: "master checkbox의 checked와 indeterminate를 별도 properties로 갱신합니다.",
      explanations: [
        "child selected count가 0이면 none, 0보다 크고 total보다 작으면 some, total과 같으면 all입니다. total 0인 empty는 every의 vacuous truth 때문에 all로 오판하지 않도록 별도 처리합니다.",
        "master.checked는 all, master.indeterminate는 some && !all입니다. indeterminate는 visual/current property-only 상태이고 form submission value나 checked를 자동 바꾸지 않습니다.",
        "원본 ex10의 '1번 체크박스 선택'은 모든 checkboxes를 false로 만든 뒤 첫 하나를 true로 합니다. 전체 선택 product rule은 required/optional groups, disabled items와 dynamically added items까지 정의해야 합니다.",
        "button disabled 조건도 '하나 이상', '모든 항목', '모든 required' 중 명시합니다. selected count만 보고 업무 규칙을 추측하지 않습니다.",
        "하나의 sync/render에서 master checked/indeterminate, submit disabled, summary, class와 ARIA message를 함께 갱신하면 drift를 막을 수 있습니다.",
        ".prop({checked, indeterminate, disabled}) object setter로 current properties를 한 transition에서 표현할 수 있지만 event는 자동 발생하지 않으므로 handler가 sync를 직접 호출합니다.",
      ],
      concepts: [
        { term: "indeterminate", definition: "checkbox가 부분 선택임을 시각적으로 나타내는 property-only 상태입니다.", detail: ["checked와 독립입니다.", "HTML attribute가 아닙니다."] },
        { term: "vacuous truth", definition: "empty collection의 every predicate가 true가 되는 논리 규칙입니다.", detail: ["total>0 guard가 필요합니다.", "empty product state를 별도 정의합니다."] },
        { term: "state invariant", definition: "child selection과 master/submit/summary 사이에 항상 유지되어야 하는 관계입니다.", detail: ["all===checked를 검사합니다.", "some&&!all===indeterminate를 검사합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-tristate-select-all",
          title: "부분·전체·다시 부분 선택을 master checkbox에 동기화합니다",
          language: "html",
          filename: "jquery-tristate.html",
          purpose: "selected count에서 checked와 indeterminate를 독립 계산하는 exact sequence를 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>tri state</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<label><input id="all" type="checkbox">전체 선택</label>
<label><input class="item" type="checkbox" checked>약관</label>
<label><input class="item" type="checkbox">개인정보</label>
<label><input class="item" type="checkbox" checked>마케팅</label>
<pre id="out"></pre><script>
  const $all = $("#all");
  const $items = $(".item");
  const lines = [];
  function sync(label) {
    const selected = $items.filter(":checked").length;
    const all = $items.length > 0 && selected === $items.length;
    const some = selected > 0;
    $all.prop({ checked: all, indeterminate: some && !all });
    lines.push(label + ":selected=" + selected + "/" + $items.length +
      ",all=" + $all.prop("checked") +
      ",mixed=" + $all.prop("indeterminate"));
  }
  sync("initial");
  $items.prop("checked", true);
  sync("after-all");
  $items.eq(1).prop("checked", false);
  sync("after-one-off");
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "13-21", explanation: "현재 checked subset 수로 all/some을 계산하고 two master properties를 한 번에 씁니다." },
            { lines: "23-29", explanation: "initial mixed, all selected, one off sequence를 같은 sync에 통과시킵니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-tristate.html을 열고 #out 확인" },
          output: { value: "initial:selected=2/3,all=false,mixed=true\nafter-all:selected=3/3,all=true,mixed=false\nafter-one-off:selected=2/3,all=false,mixed=true", explanation: ["2/3은 checked false와 indeterminate true입니다.", "3/3만 master checked true이고 한 항목을 끄면 mixed로 복귀합니다."] },
          experiments: [
            { change: "items가 0개인 fixture를 만듭니다.", prediction: "total>0 guard 덕분에 all=false, mixed=false입니다.", result: "empty를 all로 오판하지 않습니다." },
            { change: "disabled item을 추가합니다.", prediction: "모집단에 포함할지 product rule에 따라 결과가 달라집니다.", result: "enabled/required subset을 명시합니다." },
            { change: "$all.prop('indeterminate', true)만 설정합니다.", prediction: "checked와 submitted value는 자동으로 바뀌지 않습니다.", result: "두 properties를 독립 관리합니다." },
          ],
          sourceRefs: ["web-jquery-prop-form-source", "jquery-prop-api", "html-input-state-standard"],
        },
      ],
      diagnostics: [
        { symptom: "항목이 하나도 없는데 전체 선택이 true로 표시된다.", likelyCause: "empty every/all comparison을 total guard 없이 사용했습니다.", checks: ["total/selected를 함께 출력합니다.", "동적 loading/empty 시점을 재현합니다.", "master state의 empty policy를 확인합니다."], fix: "all = total > 0 && selected === total로 계산하고 empty UI를 별도로 표시합니다.", prevention: "0/1/many·none/some/all fixtures를 state table에 포함합니다." },
      ],
    },
    {
      id: "disabled-aria-formdata-contract",
      title: "disabled는 native 동작·focus·제출을 바꾸지만 aria-disabled는 접근성 상태만 전달합니다",
      lead: "보이는 비활성 표현과 browser가 실제로 막는 behavior를 분리합니다.",
      explanations: [
        "HTML disabled property가 true인 form control은 일반적으로 사용자 조작/focus와 FormData entry list에서 제외됩니다. class로 회색만 만들거나 aria-disabled=true만 설정해도 이 native behavior는 생기지 않습니다.",
        "aria-disabled='true'는 accessibility API에 비활성 의도를 전달하지만 click/keyboard/submit을 자동으로 막지 않습니다. custom control이면 author code가 behavior와 focus policy를 구현해야 합니다.",
        "disabled control은 server payload에 없으므로 server가 missing을 false/unchanged/unauthorized 중 무엇으로 해석할지 schema를 정해야 합니다. client disabled를 authorization으로 신뢰하지 않고 server에서 권한을 재검증합니다.",
        "readonly는 control type에 따라 focus·submission에서 disabled와 다릅니다. 보여 주되 제출할 값과 수정 불가의 의미를 제품 요구로 분리합니다.",
        "name 없는 control, unchecked checkbox/radio도 FormData에 들어가지 않습니다. ex09 summary와 실제 new FormData(form) entries를 같이 출력해 mismatch를 발견합니다.",
        "native button/input을 쓸 수 있는데 div+ARIA로 재구현하지 않습니다. native semantics를 기본으로 하고 ARIA는 추가 설명·상태 연결에 사용합니다.",
      ],
      concepts: [
        { term: "native disabled", definition: "HTML control property가 interaction·focus·submission semantics를 바꾸는 상태입니다.", detail: ["FormData에서 제외됩니다.", "server authorization을 대신하지 않습니다."] },
        { term: "aria-disabled", definition: "accessibility API에 disabled 상태를 전달하는 ARIA attribute입니다.", detail: ["behavior를 자동 차단하지 않습니다.", "focus policy를 author가 정합니다."] },
        { term: "successful control", definition: "form entry list에 name/value로 포함될 조건을 만족한 control입니다.", detail: ["disabled/no-name/unchecked가 제외될 수 있습니다.", "payload schema가 missing을 처리합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-disabled-aria-submission",
          title: "native disabled와 aria-disabled control의 FormData 포함 여부를 비교합니다",
          language: "html",
          filename: "jquery-disabled-formdata.html",
          purpose: "visual/accessibility state가 아니라 platform submission contract의 차이를 exact boolean으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>disabled aria</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<form id="settings">
  <input id="native" name="native" value="A" disabled>
  <input id="aria" name="aria" value="B" aria-disabled="true">
</form><pre id="out"></pre><script>
  const data = new FormData($("#settings")[0]);
  $("#out").text([
    "native-disabled=" + $("#native").prop("disabled"),
    "native-submitted=" + data.has("native"),
    "aria-disabled=" + $("#aria").attr("aria-disabled"),
    "aria-submitted=" + data.has("aria")
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "7-10", explanation: "같은 shape의 controls에 native disabled와 aria-disabled만 다르게 설정합니다." },
            { lines: "12-18", explanation: "property/attribute와 실제 FormData membership을 한 쌍씩 출력합니다." },
          ],
          run: { environment: ["FormData와 jQuery 4.0.0을 지원하는 modern browser"], command: "jquery-disabled-formdata.html을 열고 #out 확인" },
          output: { value: "native-disabled=true\nnative-submitted=false\naria-disabled=true\naria-submitted=true", explanation: ["native disabled input은 entry list에서 제외됩니다.", "aria-disabled input은 accessibility state만 있어 FormData에는 계속 포함됩니다."] },
          experiments: [
            { change: "aria input의 click/input을 시도합니다.", prediction: "author code가 막지 않으면 여전히 조작할 수 있습니다.", result: "ARIA alone은 behavior가 아닙니다." },
            { change: "native disabled를 false property로 바꿉니다.", prediction: "FormData에 native=A가 포함됩니다.", result: "current property가 submission을 제어합니다." },
            { change: "두 inputs의 name을 제거합니다.", prediction: "둘 다 FormData에서 제외됩니다.", result: "id와 name의 역할이 다릅니다." },
          ],
          sourceRefs: ["web-jquery-prop-form-source", "jquery-prop-api", "html-form-entry-standard", "wai-aria-disabled"],
        },
      ],
      diagnostics: [
        { symptom: "aria-disabled=true인데 click·focus·FormData 제출이 계속 된다.", likelyCause: "ARIA가 native behavior를 구현한다고 오해했습니다.", checks: ["prop('disabled')와 attr('aria-disabled')를 분리합니다.", "keyboard/mouse handler와 tab order를 test합니다.", "FormData membership을 확인합니다."], fix: "가능하면 native disabled control을 사용하고 custom policy라면 event/focus/submission을 명시 구현합니다.", prevention: "ARIA state와 platform behavior를 별도 test column으로 둡니다." },
      ],
    },
    {
      id: "each-text-html-visibility-trust",
      title: "each·text·html·visible은 반복·신뢰·layout 경계를 함께 드러냅니다",
      lead: "문자열을 보여 주는 것과 markup으로 실행하는 것, 화면에 안 보이는 것과 layout 공간이 없는 것을 구분합니다.",
      explanations: [
        "원본 ex07 comment는 collection .each와 static $.each(array/object)를 섞습니다. $items.each callback은 (index, element)이고 this는 DOM Element이며, 단순 setter는 implicit iteration이라 each가 필요 없습니다.",
        "index로 para-0 같은 ID를 만드는 방식은 insertion/sort 뒤 business identity가 바뀝니다. source data의 stable ID를 validate하고 duplicate를 검사하며 DOM position은 표시 순서로만 사용합니다.",
        ".text(value)는 value를 literal text로 두고 .html(value)는 HTML parser를 호출합니다. 원본의 '<h2>Hello jQuery</h2>'가 전자에서는 꺾쇠를 보이고 후자에서는 h2 node가 되는 차이가 핵심입니다.",
        "form/URL/server/user string을 .html에 넣으면 script tag나 event attribute가 실행되는 XSS가 될 수 있습니다. plain content는 .text, rich content는 vetted sanitizer/Trusted Types boundary를 사용합니다.",
        "원본 ex08의 :visible/:hidden은 display 상태를 뒤집는 demo지만 jQuery :visible은 layout space 소비를 기준으로 하므로 visibility:hidden이나 opacity:0 element도 visible로 간주될 수 있습니다.",
        ":visible/:hidden은 jQuery extensions라 native querySelectorAll fast path를 직접 쓰지 못하고 layout calculation을 유발할 수 있습니다. 먼저 pure CSS selector로 좁힌 뒤 filter하거나 application state class/hidden property를 사용합니다.",
        "event handler에서 e.target과 this/currentTarget은 child click에서 다를 수 있습니다. ex06처럼 자식 없는 div에서 같았다는 사실을 모든 event에 일반화하지 않습니다.",
      ],
      concepts: [
        { term: "collection each", definition: "jQuery matched set의 DOM members를 index/element/this로 순회하는 instance method입니다.", detail: ["static $.each와 다릅니다.", "implicit setter iteration이면 생략합니다."] },
        { term: "text sink", definition: "문자열을 markup으로 해석하지 않고 Text data로 넣는 API입니다.", detail: [".text/textContent가 해당합니다.", "plain external data에 적합합니다."] },
        { term: "visibility heuristic", definition: "jQuery :visible이 layout space를 기준으로 element를 분류하는 규칙입니다.", detail: ["opacity/visibility와 다를 수 있습니다.", "application state와 동일하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-text-html-trust-boundary",
          title: "같은 문자열을 literal text와 vetted rich markup으로 넣어 DOM 차이를 봅니다",
          language: "html",
          filename: "jquery-text-html.html",
          purpose: "text sink와 HTML parser sink의 node count 차이를 deterministic output으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>text html</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<div id="safe"></div><div id="rich"></div><pre id="out"></pre>
<script>
  const untrusted = "<em>사용자 입력</em>";
  $("#safe").text(untrusted);
  $("#rich").html("<strong>검증된 강조</strong>");
  $("#out").text([
    "safe-text=" + $("#safe").text(),
    "safe-elements=" + $("#safe").children().length,
    "rich-text=" + $("#rich").text(),
    "rich-elements=" + $("#rich").children().length
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "8-10", explanation: "external-looking markup string은 text로, code-owned static rich structure만 html parser에 넘깁니다." },
            { lines: "11-16", explanation: "text representation과 child element count를 함께 출력해 parser 경계를 증명합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-text-html.html을 열고 #out 확인" },
          output: { value: "safe-text=<em>사용자 입력</em>\nsafe-elements=0\nrich-text=검증된 강조\nrich-elements=1", explanation: ["safe container에는 literal 꺾쇠 text만 있고 element가 없습니다.", "rich container에는 strong element 하나가 parse되었습니다."] },
          experiments: [
            { change: "untrusted를 .html에 넣습니다.", prediction: "em element가 생성되고 executable attribute fixture는 위험해집니다.", result: "data provenance에 따라 sink를 제한합니다." },
            { change: "rich content를 .text로 바꿉니다.", prediction: "strong markup이 literal text로 표시됩니다.", result: "plain text 요구에는 이 behavior가 안전합니다." },
            { change: "visibility:hidden element를 $(':visible')로 검사합니다.", prediction: "layout space를 가지면 jQuery 기준 visible일 수 있습니다.", result: "CSS visibility와 jQuery heuristic을 구분합니다." },
          ],
          sourceRefs: ["web-jquery-each-text-html-source", "web-jquery-computed-css-source", "web-jquery-initial-form-source", "jquery-content-api", "jquery-visibility-api", "trusted-types-standard", "html-select-state-standard", "dom-token-list-standard"],
        },
      ],
      diagnostics: [
        { symptom: "외부 문자열이 tag로 생성되거나 event attribute가 실행된다.", likelyCause: "plain data를 .html parser sink에 넘겼습니다.", checks: ["source provenance와 .html/append sinks를 추적합니다.", "unexpected child elements/attributes를 검사합니다.", "CSP/Trusted Types report를 봅니다."], fix: "plain data는 .text/textContent로 넣고 rich HTML은 allowlist sanitizer와 reviewed policy를 거칩니다.", prevention: "HTML sink wrapper와 malicious browser fixtures를 둡니다." },
        { symptom: "opacity:0 또는 visibility:hidden element가 :visible에 잡힌다.", likelyCause: "jQuery :visible은 눈으로 보임이 아니라 layout space 소비를 기준으로 합니다.", checks: ["width/height/client rect와 computed opacity/visibility/display를 각각 확인합니다.", "application hidden state class/property를 봅니다.", "selector cost를 profile합니다."], fix: "제품 state는 hidden/class/model로 판정하고 구체적 CSS visibility 조건은 computed properties로 명시합니다.", prevention: ":visible을 business state로 사용하지 않고 pure selector 뒤 최소 filter만 사용합니다." },
      ],
    },
    {
      id: "unified-render-native-migration-testing",
      title: "하나의 render와 상태 불변식으로 jQuery/native 이관·접근성·제출을 동시에 검증합니다",
      lead: "API 호출 수가 아니라 현재 state와 모든 파생 표현이 같은 truth를 말하는지 검사합니다.",
      explanations: [
        "event handler마다 class, prop, message를 따로 갱신하면 drift가 생깁니다. readCurrentState 또는 application reducer가 state를 만들고 render(state)가 class·property·ARIA·summary·submit availability를 한 번에 씁니다.",
        "render 후 invariants는 is-selected class===checked, aria-expanded===!hidden, master checked===all children, indeterminate===some&&!all, summary entries===FormData entries처럼 machine-checkable하게 둡니다.",
        "jQuery to native mapping은 add/remove/toggleClass→classList, css setter→style/setProperty, css getter→getComputedStyle, attr→get/set/removeAttribute, prop→DOM property, val→value/selectedOptions, checked selector→querySelectorAll(':checked')입니다.",
        ":selected는 native 표준 selector가 아니므로 option:checked, select.selectedOptions 또는 option.selected property를 사용합니다. jQuery extension을 CSS selector string 그대로 옮기지 않습니다.",
        "browser tests는 initial/current/default/reset, user input/change, programmatic write with/without notification, no/single/multiple values, disabled/FormData와 keyboard/accessibility tree를 포함합니다.",
        "style/class만 disabled처럼 보이게 만들어 security control로 사용하지 않습니다. server는 submitted value와 authorization/business rule을 독립 검증하고 client UI는 convenience layer입니다.",
        "observability는 field value 자체 대신 component/error code, expected/actual count, transition source(user/programmatic/reset), jQuery version을 privacy-safe하게 기록합니다.",
      ],
      concepts: [
        { term: "authoritative state", definition: "다른 class·ARIA·summary가 파생되는 단일 현재 truth입니다.", detail: ["application model 또는 native properties일 수 있습니다.", "파생 DOM을 다시 source로 삼지 않습니다."] },
        { term: "render invariant", definition: "render 뒤 여러 representation 사이에 항상 성립해야 하는 논리 관계입니다.", detail: ["browser assertion으로 검사합니다.", "state drift를 조기에 찾습니다."] },
        { term: "behavior-preserving migration", definition: "jQuery를 native API로 바꾸면서 current/default/empty/event/submission/accessibility behavior를 유지하는 과정입니다.", detail: ["selector 문법만 치환하지 않습니다.", "before/after matrix를 둡니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "form.reset 뒤 inputs는 돌아왔지만 class·summary·button disabled는 이전 상태다.", likelyCause: "native reset이 current properties를 default로 되돌린 뒤 derived UI render를 다시 실행하지 않았습니다.", checks: ["reset 전후 current/default를 기록합니다.", "reset event/default action timing을 확인합니다.", "render 호출 경로를 봅니다."], fix: "reset 완료 뒤 current controls에서 state를 다시 읽어 render하고 invariants를 검사합니다.", prevention: "edit→programmatic change→reset sequence E2E를 둡니다." },
        { symptom: "jQuery를 native로 바꾼 뒤 여러 controls 중 첫 하나만 바뀐다.", likelyCause: "jQuery setter의 implicit iteration을 단일 Element property write로 치환했습니다.", checks: ["원래 collection length와 native query return을 비교합니다.", "querySelector/querySelectorAll을 확인합니다.", "write loop/cardinality를 test합니다."], fix: "expected collection이면 querySelectorAll(...).forEach 또는 state-driven loop를 사용합니다.", prevention: "migration map에 return type·empty behavior·iteration·event dispatch column을 둡니다." },
      ],
      comparisons: [
        { title: "UI 상태 표현 수단 선택", options: [
          { name: "native property", chooseWhen: "checked/disabled/value/selectedIndex처럼 platform behavior가 있을 때", avoidWhen: "시각 디자인만 표현하려 할 때", tradeoffs: ["interaction/submission semantics가 생깁니다.", "control type contract를 따라야 합니다."] },
          { name: "semantic class", chooseWhen: "여러 style을 의미 있는 visual state로 묶을 때", avoidWhen: "권한·제출·accessibility behavior의 유일한 source로 쓸 때", tradeoffs: ["CSS가 presentation을 소유합니다.", "native/ARIA state는 별도로 동기화합니다."] },
          { name: "ARIA state", chooseWhen: "native semantics에 없는 accessibility 상태를 전달하거나 custom widget contract를 완성할 때", avoidWhen: "native behavior를 자동 구현한다고 기대할 때", tradeoffs: ["assistive technology에 의미를 전달합니다.", "keyboard/behavior는 author가 구현합니다."] },
        ] },
      ],
      expertNotes: [
        "폼 state test는 DOM snapshot보다 property/attribute/FormData/accessibility tree를 동시에 읽어야 합니다.",
        "layout/computed style reads는 render write phase와 분리하고 large collections에서 :visible/:selected extension 비용을 실제 browser로 측정합니다.",
      ],
    },
  ],
  lab: {
    title: "접근 가능한 학습 환경설정 폼의 current/default/submission 상태 동기화",
    scenario: "원본 ex05~ex10을 하나의 환경설정 폼으로 합칩니다. theme class, course/radio/hobbies/multiple values, 전체 선택, disabled policy와 summary/FormData가 초기·사용자·programmatic·reset 상태에서 항상 일치해야 합니다.",
    setup: [
      "form에 name이 있는 text, checkbox required/optional groups, radio, single/multiple select와 reset/submit buttons를 만듭니다.",
      "각 control에 label, 설명/오류 ID, status live region과 semantic state classes를 준비합니다.",
      "state reader, pure normalization, render(state), invariant assertions를 별도 functions로 나눕니다.",
      "jQuery 4 exact version과 native comparison mode를 같은 validated fixture에 연결합니다.",
    ],
    steps: [
      "initial attribute/default/current/FormData matrix를 control별로 기록하고 비정상 multiple defaults를 제거합니다.",
      "add/remove/toggleClass(force)로 is-selected/has-error/is-pending states를 render합니다.",
      "inline CSS는 preview custom property처럼 dynamic value에만 제한하고 업무 state는 class/property로 둡니다.",
      "checkbox/radio/single/multiple values를 current property/.val로 읽고 initial summary를 즉시 render합니다.",
      "programmatic .val/.prop change 뒤 공용 render를 직접 호출하고 notify 여부를 별도 option으로 test합니다.",
      "전체 선택의 empty/none/some/all과 indeterminate, required-only submit condition을 구현합니다.",
      "disabled와 aria-disabled control의 mouse/keyboard/focus/FormData behavior를 비교합니다.",
      "summary를 .text로 만들고 악성-looking input이 markup으로 parse되지 않음을 확인합니다.",
      "form.reset 뒤 default/current/derived state를 다시 동기화하고 모든 invariants를 검사합니다.",
      "같은 behavior를 native properties/classList/FormData로 구현해 jQuery version과 exact state matrix를 비교합니다.",
    ],
    expectedResult: [
      "initial/user/programmatic/reset 모든 단계에서 current controls, semantic classes, ARIA, summary와 FormData가 같은 state를 말합니다.",
      "single control은 하나, repeated checkbox/multiple select는 values array로 명확히 normalize됩니다.",
      "master checked/indeterminate와 submit disabled가 required group rule을 정확히 반영합니다.",
      "disabled는 제출에서 빠지고 aria-disabled-only control은 author behavior 없이는 계속 조작·제출됩니다.",
      "외부 문자열은 literal text로만 표시되고 HTML element/event attribute로 생성되지 않습니다.",
      "jQuery/native modes가 같은 state/invariant/accessibility behavior를 통과합니다.",
    ],
    cleanup: ["test에서 만든 inline styles, custom validity와 event handlers를 dispose합니다.", "sensitive form values와 debug logs를 지우고 browser profile을 초기화합니다."],
    extensions: [
      "required/optional agreement groups와 server validation error mapping을 추가합니다.",
      "autosave 중 pending/failed/saved state class와 aria-live announcement를 설계합니다.",
      "large option list에서 :selected/:visible와 native selectedOptions/state class의 성능을 비교합니다.",
      "TypeScript로 string|string[]|undefined와 form state reducer를 모델링합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 exact examples를 실행하고 각 output을 initial/current/default/visual/accessibility/submission 층에 배치하세요.", requirements: ["class/css/attr removal 결과를 재현합니다.", "checked attr/prop/default 네 snapshots를 설명합니다.", "single/multiple/no-match val types와 change counter를 확인합니다.", "tri-state·disabled/FormData·text/html outputs를 모두 맞춥니다."], hints: ["보이는 결과만 보지 말고 attribute/property/FormData를 같이 출력하세요.", "jQuery 4 bare boolean attr은 빈 문자열일 수 있습니다."], expectedOutcome: "API를 암기하는 대신 각 state layer와 mutation effect를 exact output으로 설명합니다.", solutionOutline: ["한 control마다 source/default/current/submitted 표를 만듭니다.", "각 setter 뒤 event 자동 발생 여부도 기록합니다."] },
    { difficulty: "응용", prompt: "원본 ex10의 오타를 교정하고 required/optional 전체 선택 환경설정 폼을 완성하세요.", requirements: ["required selector cardinality assertion으로 optin typo를 잡습니다.", "selectedIndex 또는 value를 올바르게 설정합니다.", "none/some/all/empty와 indeterminate를 처리합니다.", "programmatic update 뒤 공용 render를 호출합니다.", "summary와 FormData.getAll을 비교하고 reset을 test합니다."], hints: ["selectedI라는 표준 property는 없습니다.", "disabled item을 모집단에 포함할지 먼저 정하세요."], expectedOutcome: "silent no-op 없이 current UI·summary·payload가 동기화된 폼이 완성됩니다.", solutionOutline: ["state reader와 render를 handler 밖으로 추출합니다.", "0/1/many와 reset sequence를 자동 검사합니다."] },
    { difficulty: "설계", prompt: "레거시 jQuery 설정 폼을 native DOM과 server validation까지 점진 이관하는 상태 계약을 설계하세요.", requirements: ["attribute/default/current/class/ARIA/FormData/server columns를 가진 matrix를 만듭니다.", "jQuery extension selectors와 implicit iteration의 native 대응을 정의합니다.", "disabled/aria-disabled/readOnly/authorization 책임을 분리합니다.", "XSS·IME·keyboard·screen reader·reset·async error tests를 포함합니다.", "rollout metric과 rollback, privacy-safe telemetry를 정합니다."], hints: ["DOM class를 server truth로 사용하지 마세요.", "behavior-preserving matrix가 API 호출 수보다 중요합니다."], expectedOutcome: "state drift와 제출 누락 없이 rollback 가능한 form migration plan이 완성됩니다.", solutionOutline: ["authoritative state owner를 먼저 정합니다.", "각 representation을 pure render와 invariant로 묶습니다."] },
  ],
  reviewQuestions: [
    { question: "checked attribute와 checked property는 항상 같은가요?", answer: "아닙니다. attribute는 defaultChecked/초기 baseline과 연결되고 property는 현재 checkedness입니다." },
    { question: "disabled='false'는 활성 상태인가요?", answer: "아닙니다. boolean attribute는 값 문자열과 무관하게 존재하면 true입니다." },
    { question: "toggleClass(name)과 toggleClass(name, state)의 차이는 무엇인가요?", answer: "전자는 현재 class를 반전하고 후자는 boolean으로 원하는 최종 존재 여부를 정합니다." },
    { question: ".css getter가 source의 'red'를 그대로 반환한다고 보장되나요?", answer: "아닙니다. cascade 뒤 computed value가 rgb(...)처럼 정규화될 수 있습니다." },
    { question: ".css(name,'')은 stylesheet rule도 지우나요?", answer: "아닙니다. 해당 inline declaration을 제거해 underlying stylesheet/inheritance가 다시 보일 수 있습니다." },
    { question: "jQuery 4에서 .attr('aria-expanded', false)는 attribute를 제거하나요?", answer: "아닙니다. ARIA false는 의미가 있어 문자열 'false'로 남으며 제거는 removeAttr/null을 사용합니다." },
    { question: "single select의 여러 selected attributes는 현재 여러 selection을 뜻하나요?", answer: "아닙니다. current selectedness는 single-selection invariant로 하나가 되지만 defaults/attributes가 여러 개 남을 수 있습니다." },
    { question: "checkbox collection .val()은 checked values 배열을 반환하나요?", answer: "일반적으로 collection getter는 첫 element value를 읽으므로 checked subset map/get 또는 FormData.getAll을 사용합니다." },
    { question: "multiple select .val()의 type은 무엇인가요?", answer: "selected values의 string array가 될 수 있으며 empty/no-value 정책도 명시해야 합니다." },
    { question: ".val(value)를 호출하면 change handler가 자동 실행되나요?", answer: "아닙니다. render를 직접 호출하거나 의도적으로 trigger('change')해야 합니다." },
    { question: "indeterminate=true면 checked도 자동 false가 되나요?", answer: "아닙니다. 두 properties는 독립이며 render가 함께 설정해야 합니다." },
    { question: "items가 0개일 때 all selected는 true인가요?", answer: "제품 UI에서는 보통 false로 정의하므로 total>0 guard를 둡니다." },
    { question: "aria-disabled=true는 FormData 제출을 막나요?", answer: "아닙니다. native disabled가 아니므로 author code가 막지 않으면 계속 제출됩니다." },
    { question: ".text와 .html의 핵심 신뢰 경계는 무엇인가요?", answer: ".text는 literal Text data, .html은 문자열을 markup으로 parse하는 injection sink입니다." },
    { question: "visibility:hidden element는 jQuery :visible에서 항상 hidden인가요?", answer: "아닙니다. layout 공간을 소비하면 :visible로 간주될 수 있습니다." },
  ],
  completionChecklist: [
    "여섯 원본의 실제 execution, comment-only line, 오타와 비정상 초기 markup을 감사했다.",
    "content attribute·default property·current property·class/style·ARIA·FormData 층을 구분했다.",
    "semantic state class와 toggleClass(name, boolean)으로 idempotent render를 만들었다.",
    "inline style와 computed style, custom property와 jQuery 4 numeric-unit 범위를 구분했다.",
    "attr/prop과 boolean presence, checked/defaultChecked·selected/defaultSelected를 검증했다.",
    "ARIA false와 attribute absence, non-ARIA attr false removal을 구분했다.",
    "single select/radio duplicate defaults와 current single-selection invariant를 교정했다.",
    "checkbox/radio/single/multiple/no-match val types를 명시적으로 normalize했다.",
    "programmatic val/prop write가 change를 자동 dispatch하지 않음을 test했다.",
    "전체 선택의 empty/none/some/all과 indeterminate를 처리했다.",
    "disabled·aria-disabled·readonly·authorization과 FormData behavior를 분리했다.",
    "collection each/static each/implicit iteration을 구분하고 stable identity를 사용했다.",
    "external data는 text sink, rich markup은 reviewed HTML boundary로 제한했다.",
    ":visible heuristic과 current application hidden state를 구분했다.",
    "initial→user→programmatic→reset sequence에서 state invariants와 jQuery/native parity를 검증했다.",
  ],
  nextSessions: ["jquery-04-events-validation"],
  sources: [
    { id: "web-jquery-class-css-attr-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex05_jquery.html", usedFor: ["add/remove/toggleClass", "css set/remove", "attr/removeAttr", "implicit iteration", "presentation class"], evidence: "일곱 buttons의 실제 class/css/attr mutations를 semantic forced-state render와 inline ownership 비교의 출발점으로 사용했습니다." },
    { id: "web-jquery-computed-css-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex06_jquery.html", usedFor: ["multiple CSS setter", "computed background-color getter", "this and event target", "text versus HTML interpolation", "comment-only output"], evidence: "computed color를 msg에 읽지만 출력 code가 전부 comment임을 확인하고 computed/source serialization과 safe sink로 보완했습니다." },
    { id: "web-jquery-each-text-html-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex07_jquery.html", usedFor: ["collection each", "index-based id", "text getter", "text versus html setter", "literal versus parsed markup"], evidence: "paragraph ID assignment과 두 output containers를 stable identity·implicit iteration·XSS trust boundary로 확장했습니다." },
    { id: "web-jquery-initial-form-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex08_jquery.html", usedFor: ["visible/hidden", "selected/checked", "duplicate single defaults", "first val", "multiple collection values"], evidence: "세 selected options와 두 checked radios라는 비정상 defaults를 current/default 상태 분리 fixture로 사용했습니다." },
    { id: "web-jquery-change-values-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex09_jquery.html", usedFor: ["change event", "single/radio/checkbox/multiple values", "selected extension", "empty initial summary", "value aggregation"], evidence: "사용자 change 뒤에만 summary가 갱신되는 실제 code를 initialization·programmatic transition·FormData parity로 보강했습니다." },
    { id: "web-jquery-prop-form-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex10_jquery.html", usedFor: ["checked prop", "selectedIndex", "bulk property write", "optin selector typo", "selectedI property typo"], evidence: "현재 checkbox/select property와 완전 무동작하는 두 오타를 silent empty-collection/state assertion 진단으로 사용했습니다." },
    { id: "jquery-class-api", repository: "OpenJS Foundation jQuery API", path: "class attribute methods", publicUrl: "https://api.jquery.com/toggleClass/", usedFor: ["add/remove/has/toggle class", "boolean state argument", "multiple tokens", "jQuery 4 removed signature"], evidence: "semantic class와 forced boolean toggle의 현재 contract를 공식 API로 검증했습니다." },
    { id: "jquery-css-api", repository: "OpenJS Foundation jQuery API", path: ".css()", publicUrl: "https://api.jquery.com/css/", usedFor: ["computed getter", "inline setter/removal", "custom properties", "jQuery 4 numeric px scope", "layout/style tradeoff"], evidence: "원본 css demo를 inline/computed/style ownership과 version-aware unit behavior로 보강했습니다." },
    { id: "jquery-attr-api", repository: "OpenJS Foundation jQuery API", path: ".attr() and .removeAttr()", publicUrl: "https://api.jquery.com/attr/", usedFor: ["attribute string/undefined", "jQuery 4 boolean attr", "non-ARIA false removal", "ARIA false preservation", "multi setter"], evidence: "attribute와 property/ARIA absence 차이를 jQuery 4 공식 behavior에 맞췄습니다." },
    { id: "jquery-prop-api", repository: "OpenJS Foundation jQuery API", path: ".prop()", publicUrl: "https://api.jquery.com/prop/", usedFor: ["typed current property", "checked/defaultChecked", "selectedIndex", "indeterminate", "bulk setter"], evidence: "current form state를 attr 대신 prop/native property로 읽고 쓰는 기준입니다." },
    { id: "jquery-val-api", repository: "OpenJS Foundation jQuery API", path: ".val()", publicUrl: "https://api.jquery.com/val/", usedFor: ["single/multiple values", "getter-first", "setter", "no automatic change", "function setter"], evidence: "원본 value handlers를 type/cardinality와 explicit notification contract로 보강했습니다." },
    { id: "jquery-form-selectors-api", repository: "OpenJS Foundation jQuery API", path: ":checked and :selected", publicUrl: "https://api.jquery.com/checked-selector/", usedFor: ["current checked/selected", "option matching", "jQuery selected extension", "pure selector migration"], evidence: "attribute presence가 아닌 current control state selection의 기준입니다." },
    { id: "jquery-content-api", repository: "OpenJS Foundation jQuery API", path: ".text() and .html()", publicUrl: "https://api.jquery.com/text/", usedFor: ["literal text", "HTML parsing", "getter/setter", "external-data boundary"], evidence: "원본 두 결과 containers를 safe text와 rich markup parser 경계로 검증했습니다." },
    { id: "jquery-visibility-api", repository: "OpenJS Foundation jQuery API", path: ":visible and :hidden", publicUrl: "https://api.jquery.com/visible-selector/", usedFor: ["layout-space heuristic", "visibility/opacity cases", "jQuery extension performance", "state-class alternative"], evidence: "원본 display demo가 의미하는 visibility 범위와 비용을 공식 selector contract로 보강했습니다." },
    { id: "html-input-state-standard", repository: "WHATWG HTML Standard", path: "input checkedness and form control state", publicUrl: "https://html.spec.whatwg.org/multipage/input.html#the-input-element", usedFor: ["checked/defaultChecked", "radio group", "dirty state", "indeterminate", "disabled"], evidence: "jQuery prop 아래 browser-native current/default form state의 1차 기준입니다." },
    { id: "html-select-state-standard", repository: "WHATWG HTML Standard", path: "select and option selectedness", publicUrl: "https://html.spec.whatwg.org/multipage/form-elements.html#the-select-element", usedFor: ["single/multiple selection", "selected/defaultSelected", "selectedIndex", "duplicate defaults", "reset"], evidence: "원본의 세 selected options와 current single-selection 상태를 교정하는 platform 기준입니다." },
    { id: "html-form-entry-standard", repository: "WHATWG HTML Standard", path: "constructing the entry list", publicUrl: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-entry-list", usedFor: ["successful controls", "name", "disabled exclusion", "unchecked exclusion", "repeated values", "FormData"], evidence: "화면 summary와 실제 제출 payload가 같은지 검증하는 기준입니다." },
    { id: "wai-aria-disabled", repository: "W3C WAI-ARIA", path: "aria-disabled state", publicUrl: "https://www.w3.org/TR/wai-aria-1.2/#aria-disabled", usedFor: ["accessibility state", "native disabled contrast", "author behavior", "focus policy"], evidence: "ARIA가 native interaction/submission behavior를 자동 구현하지 않는 경계를 설명합니다." },
    { id: "trusted-types-standard", repository: "W3C Web Application Security Working Group", path: "Trusted Types", publicUrl: "https://www.w3.org/TR/trusted-types/", usedFor: ["HTML sink", "TrustedHTML", "CSP enforcement", "policy review", "XSS tests"], evidence: ".html external-data parsing을 reviewed injection boundary로 제한하는 보안 근거입니다." },
    { id: "dom-token-list-standard", repository: "WHATWG DOM Standard", path: "DOMTokenList", publicUrl: "https://dom.spec.whatwg.org/#interface-domtokenlist", usedFor: ["native classList migration", "token behavior", "force toggle", "state class"], evidence: "jQuery class methods를 native classList로 옮길 때 behavior를 비교하는 platform 기준입니다." },
  ],
  sourceCoverage: {
    filesRead: 6,
    filesUsed: 6,
    uncoveredNotes: [
      "원본 여섯 파일을 모두 읽고 사용했습니다. API syntax는 풍부하지만 content attribute, default property, current property와 reset 관계를 체계적으로 구분하지 않아 jQuery 4 API와 HTML Standard로 보강했습니다.",
      "ex08의 single select와 radio group은 중복 selected/checked initial attributes를 가지므로 current selectedness/checkedness와 default state가 갈리는 진단 fixture로 사용했습니다.",
      "ex09는 initial render가 없고 ex10은 optin/selectedI 두 오타로 no-op이므로 programmatic change·required selector assertion·state invariant로 교정했습니다.",
      "indeterminate, empty groups, disabled/FormData, aria-disabled, safe HTML boundary, reset, accessibility, performance와 native migration은 원본에 없어 공식 1차 문서로 보강했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
