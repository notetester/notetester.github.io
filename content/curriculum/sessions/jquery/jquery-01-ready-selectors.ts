import type { DetailedSession } from "../../types";

const cdnTag = String.raw`<script
  src="https://code.jquery.com/jquery-4.0.0.min.js"
  integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
  crossorigin="anonymous"></script>`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["jquery-01-ready-selectors"],
  slug: "jquery-01-ready-selectors",
  courseId: "javascript",
  moduleId: "02-jquery-legacy-migration",
  order: 1,
  title: "jQuery 로딩, ready, $ 래퍼와 선택자",
  subtitle: "스크립트가 실행되는 시점과 jQuery collection의 정체를 이해하고, 레거시 선택 코드를 공급망·충돌·현대 DOM 전환까지 포함해 안전하게 다룹니다.",
  level: "기초",
  estimatedMinutes: 330,
  coreQuestion: "jQuery가 정확히 언제 준비되고 $()가 무엇을 반환하는지 추적해, 로딩 순서와 선택 집합 오류를 진단하고 현대 DOM 코드와 상호 운용하려면 어떤 경계를 알아야 할까요?",
  summary: "day10의 첫 네 원본을 전부 감사해 jQuery를 단순한 짧은 문법이 아니라 로딩되는 JavaScript library와 array-like collection으로 설명합니다. ex01은 jQuery·CDN·두 ready 형식을 주석으로만 소개하고 실제 library를 로드하지 않으며 두 번째 형식도 미완성입니다. ex02는 head에서 jQuery 4.0.0을 동기 로드한 뒤 body 요소 아래 script에서 ID를 선택하므로 ready 없이도 성공합니다. ex03은 first/last라는 제목과 열 개의 paragraph fixture만 있고 호출 코드는 없어 재구성이 필요합니다. ex04는 실제로 $(\"p\").even()을 호출해 zero-based 0·2번째인 Hello1·Hello3에서 class를 제거합니다. 이 근거 위에서 pinned version·CDN/self-host·full/slim·SRI·CSP·오프라인 복구를 다루고, parser-blocking·defer·module·DOMContentLoaded·window load와 $(handler)의 차이를 시간순으로 해설합니다. $()의 selector·DOM wrapping·HTML creation·ready overload를 입력별로 구분하고, jQuery object가 Array나 DOM node가 아니며 length·index·get·toArray·empty set·snapshot membership을 가진다는 모델을 세웁니다. CSS selector의 root/context·invalid/dynamic selector·semantic hook과 first/last/eq/even/odd/filter/not/is의 반환 계약을 다루며, getter-first/setter-all 비대칭과 조용한 empty collection을 진단합니다. 마지막으로 noConflict와 multiple-version/plugin ownership, native querySelectorAll 대응, 단계적 jQuery 4/Migrate 전환, 테스트·성능·접근성·관측성 기준을 연결합니다.",
  objectives: [
    "jQuery가 페이지에 들어오는 network·parse·execute 순서와 $ is not defined의 원인을 단계별로 진단할 수 있다.",
    "$(handler), DOMContentLoaded, body-bottom script, defer/module, window load의 실행 시점과 선택 기준을 설명할 수 있다.",
    "$()의 입력별 overload와 jQuery collection·DOM Element·NodeList·Array의 차이를 실행 결과로 구분할 수 있다.",
    "CSS selector와 context를 사용해 집합을 만들고 first·last·eq·even·filter로 원본 집합을 안전하게 좁힐 수 있다.",
    "빈 collection, invalid selector, 오래된 jQuery, 두 버전 혼재와 $ 전역 충돌을 재현하고 교정할 수 있다.",
    "CDN·self-host·bundler 중 배포 방식을 SRI·CSP·offline·cache·upgrade 비용과 함께 선택할 수 있다.",
    "레거시 jQuery 코드를 native DOM으로 대응시키고 유지·점진 이관·제거 중 적합한 전략을 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "DOM 조회와 traversal", reason: "jQuery collection이 감싸는 실제 Element와 querySelectorAll의 NodeList, selector root와 반환 규약을 비교하는 기반입니다.", sessionSlug: "js-05-dom-query-traversal" },
    { title: "JavaScript 실행과 event", reason: "script가 parser를 멈추는 시점, callback 등록과 DOMContentLoaded/load event를 시간 순서로 이해하는 데 필요합니다.", sessionSlug: "js-03-event-model-listeners" },
  ],
  keywords: ["jQuery", "jQuery 4", "$()", "jQuery collection", "ready", "DOMContentLoaded", "load", "CDN", "self-host", "SRI", "CSP", "defer", "async", "module", "CSS selector", "context", "first", "last", "eq", "even", "filter", "noConflict", "querySelectorAll", "jQuery Migrate", "legacy migration"],
  chapters: [
    {
      id: "jquery-role-source-audit",
      title: "jQuery는 브라우저가 아니라 페이지에 추가하는 JavaScript library입니다",
      lead: "짧은 $ 표기만 외우기 전에 누가 그 함수를 만들고 어떤 문제를 해결하며 언제 비용이 되는지부터 확인합니다.",
      explanations: [
        "jQuery는 HTML 문서 탐색·조작, event, effect, Ajax의 브라우저 차이를 하나의 API로 감싸 온 JavaScript library입니다. library는 application의 전체 제어 흐름을 소유하는 framework와 달리, application code가 필요할 때 호출하는 기능 집합입니다.",
        "브라우저에는 원래 jQuery가 없습니다. jQuery script가 성공적으로 내려와 실행되어야 window.jQuery와 보통의 alias window.$가 생깁니다. 그러므로 $()는 HTML 문법도 CSS 문법도 아니고, global function call입니다.",
        "원본 ex01은 이 정의와 CDN, $(document).ready(handler), $(handler) 형식을 HTML comment에 적었지만 script src도 실행 code도 없습니다. 설명 source와 실행 evidence를 구분해야 잘못된 성공 결론을 피할 수 있습니다.",
        "원본 ex02는 jQuery 4.0.0을 실제로 로드하고 ID selector로 collection을 만든 뒤 class와 event method를 호출합니다. 이번 세션에서는 이 코드를 로딩·선택·wrapper 증거로 사용하고 class와 event의 상세 계약은 뒤 세션으로 넘깁니다.",
        "현대 DOM API가 querySelector, classList, fetch, Web Animations 등 많은 요구를 직접 해결하므로 새 project에 selector 한 줄을 줄이려고 jQuery를 넣는 것은 download·upgrade·security·typing 비용이 큽니다. 반면 검증된 jQuery plugin과 대규모 legacy code가 중심인 system에서는 무조건 제거가 더 위험할 수 있습니다.",
        "따라서 목표는 jQuery를 낡은 것으로 조롱하거나 모든 곳에 추가하는 것이 아닙니다. 현재 dependency와 plugin contract를 정확히 이해하고, 유지할 곳과 native로 옮길 경계를 evidence로 정하는 것입니다.",
      ],
      concepts: [
        { term: "library", definition: "application code가 필요할 때 호출하는 재사용 기능 집합입니다.", detail: ["jQuery file도 먼저 load·execute되어야 합니다.", "호출 주체는 application code입니다."], analogy: "공구함에서 필요한 도구를 꺼내 쓰는 것과 비슷합니다.", caveat: "dependency가 작아 보여도 version·security·upgrade ownership은 생깁니다." },
        { term: "global alias", definition: "window.jQuery를 짧게 가리키는 window.$ 같은 전역 이름입니다.", detail: ["$는 jQuery 전용 예약어가 아닙니다.", "다른 library 또는 기존 code와 충돌할 수 있습니다."] },
        { term: "legacy migration", definition: "동작하는 기존 code를 한 번에 다시 쓰지 않고 inventory·test·boundary를 만들며 점진적으로 대체하는 과정입니다.", detail: ["현재 behavior를 먼저 고정합니다.", "plugin과 version coupling을 조사합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "HTML에 $()를 적었는데 ReferenceError: $ is not defined가 난다.", likelyCause: "jQuery가 브라우저 내장이라고 생각했거나 library script가 load·execute되기 전에 dependent code가 실행되었습니다.", checks: ["Network에서 jQuery request status와 response MIME을 봅니다.", "Console에서 typeof window.jQuery와 typeof window.$를 확인합니다.", "Elements/Sources에서 script의 실제 순서를 확인합니다."], fix: "검증한 jQuery script를 dependent code보다 먼저 로드하고, failure도 처리하며 한 owner가 version을 관리하게 합니다.", prevention: "dependency smoke test에서 $.fn.jquery를 확인하고 page마다 임의 CDN tag를 복사하지 않습니다." },
      ],
      comparisons: [
        { title: "jQuery를 추가·유지·제거하는 기준", options: [
          { name: "유지", chooseWhen: "검증된 plugin과 넓은 legacy surface가 jQuery contract에 결합되어 있을 때", avoidWhen: "미사용 dependency인데 관성으로만 남아 있을 때", tradeoffs: ["rewrite risk가 낮습니다.", "dependency와 upgrade 비용은 계속 소유합니다."] },
          { name: "점진 이관", chooseWhen: "component boundary와 regression test를 만들 수 있을 때", avoidWhen: "behavior evidence 없이 전역 replace만 할 때", tradeoffs: ["위험을 작은 단위로 나눕니다.", "한동안 두 API style이 공존합니다."] },
          { name: "신규 추가", chooseWhen: "필수 plugin 가치가 dependency 비용보다 명확히 클 때", avoidWhen: "query·class toggle 몇 줄만 필요할 때", tradeoffs: ["legacy ecosystem을 활용합니다.", "bundle·CSP·maintenance surface가 늘어납니다."] },
        ] },
      ],
    },
    {
      id: "loading-version-supply-chain",
      title: "로딩은 URL 한 줄이 아니라 version·integrity·정책·복구를 가진 공급망 계약입니다",
      lead: "성공한 개발 PC의 cache에 기대지 않고 사용자의 browser가 같은 bytes를 같은 순서로 실행하도록 설계합니다.",
      explanations: [
        "이 세션의 실행 예제는 2026-07-12 기준 공식 stable jQuery 4.0.0 minified full build를 정확한 URL로 고정합니다. latest 같은 움직이는 URL은 검토하지 않은 breaking change가 배포에 들어오므로 사용하지 않습니다.",
        "development build는 읽기 쉬운 source와 diagnostic에 유리하고 minified build는 transfer 크기를 줄입니다. full build와 slim build도 다릅니다. jQuery 4 slim은 Ajax·effects뿐 아니라 그 module에 묶인 Deferred/Callbacks와 queue 같은 기능이 빠질 수 있으므로 file 이름만 작다고 교체하지 않습니다.",
        "CDN은 shared edge와 운영 편의를 주지만 network·DNS·provider·privacy/CSP 의존을 추가합니다. self-host는 availability와 change control을 직접 소유하지만 patch·cache header·asset pipeline 운영도 직접 해야 합니다. bundler는 dependency graph와 hash asset을 통합하지만 global plugin과 ESM/import 경계를 검증해야 합니다.",
        "Subresource Integrity의 integrity hash는 받은 bytes가 고정한 digest와 같은지 검사합니다. cross-origin SRI에는 CORS-compatible response가 필요하므로 crossorigin=anonymous를 함께 둡니다. version을 바꾸면 URL과 hash를 같이 갱신해야 합니다.",
        "CSP의 script-src가 code.jquery.com을 허용하지 않으면 Network request가 있어도 실행이 막힐 수 있습니다. nonce/hash 정책과 external host allowlist를 system 전체에서 결정하며, 보안을 위해 CSP를 끄는 방식으로 해결하지 않습니다.",
        "CDN fallback을 넣는다면 integrity failure와 network failure를 관측하고 self-hosted exact same reviewed version을 한 번만 load합니다. 두 copy가 모두 실행되거나 dependent plugin보다 늦게 fallback되는 race가 없도록 bootstrap 순서를 test합니다.",
        "아래 tag의 SHA-256은 official 4.0.0 minified resource에 고정되어 있습니다. 임의 mirror나 복사 과정에서 bytes가 달라지면 browser가 의도대로 실행을 거부합니다.",
        cdnTag,
      ],
      concepts: [
        { term: "CDN", definition: "여러 edge에서 static content를 제공하는 배포 network입니다.", detail: ["latency/cache 장점이 있습니다.", "외부 availability와 policy dependency가 생깁니다."] },
        { term: "Subresource Integrity", definition: "external resource의 cryptographic digest를 markup에 선언해 expected bytes인지 browser가 검증하는 장치입니다.", detail: ["version update와 hash update는 한 change입니다.", "malicious code의 안전한 의미를 판단하는 sanitizer는 아닙니다."] },
        { term: "Content Security Policy", definition: "page가 script 등 resource를 어느 origin·nonce·hash에서 실행할지 제한하는 browser policy입니다.", detail: ["CSP console violation을 확인합니다.", "허용 범위를 최소화합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "jQuery request는 200인데 Refused to execute 또는 integrity mismatch 뒤 $가 없다.", likelyCause: "CSP가 host를 막았거나 URL의 bytes와 integrity digest가 일치하지 않습니다.", checks: ["Console의 CSP/SRI message를 읽습니다.", "최종 redirect URL과 response bytes/version을 확인합니다.", "script tag의 URL·integrity·crossorigin 조합을 official release와 대조합니다."], fix: "검토한 exact version/hash와 CSP allowlist 또는 self-hosted asset을 함께 배포합니다.", prevention: "CI에서 asset hash와 CSP browser smoke test를 실행하고 URL만 단독 변경하지 않습니다." },
        { symptom: "개발 PC에서는 되지만 폐쇄망·offline 현장에서 화면 기능이 전부 멈춘다.", likelyCause: "외부 CDN이 유일한 runtime dependency인데 availability requirement와 fallback을 설계하지 않았습니다.", checks: ["DevTools Offline에서 cold-cache reload합니다.", "DNS/CDN failure와 timeout을 재현합니다.", "self-host asset이 실제 같은 version인지 확인합니다."], fix: "요구에 맞게 self-host하거나 deterministic fallback과 user-visible recovery를 둡니다.", prevention: "online/offline·cold-cache deployment test와 dependency availability SLO를 문서화합니다." },
      ],
      expertNotes: [
        "SRI는 받은 file의 identity를 확인하지만 그 version 자체의 vulnerability나 application misuse를 해결하지 않습니다. dependency inventory·release review·CSP·safe DOM sink가 모두 필요합니다.",
        "cache-busting query를 무작정 바꾸기보다 content-hashed self-host assets 또는 immutable exact-version CDN URL을 사용합니다.",
      ],
    },
    {
      id: "parser-ready-timeline",
      title: "ready를 이해하려면 HTML parser와 script 실행을 하나의 timeline으로 그려야 합니다",
      lead: "DOM이 아직 없어서 실패한 것과 jQuery 자체가 아직 없어서 실패한 것을 서로 다른 문제로 분리합니다.",
      explanations: [
        "classic script에 async/defer가 없으면 parser는 external file을 받아 실행할 때까지 해당 위치에서 멈춥니다. head의 dependent code가 아직 뒤 body element를 조회하면 jQuery는 존재해도 collection length가 0일 수 있습니다.",
        "원본 ex02는 jQuery를 head에서 동기 load하지만 실제 $('#box1') code는 box1/box2 markup 아래 body 끝에 있습니다. parser가 target을 이미 만들었으므로 ready wrapper 없이도 성공합니다. 이것은 ready가 무용하다는 증거가 아니라 실행 위치가 보장된다는 증거입니다.",
        "$(handler)는 document가 ready일 때 handler를 실행하는 권장 shorthand입니다. DOMContentLoaded가 이미 발생한 뒤 등록해도 jQuery는 handler를 실행해 주므로, 늦게 addEventListener('DOMContentLoaded', ...)만 등록하는 code와 중요한 차이가 있습니다.",
        "DOM ready는 document tree를 query할 수 있다는 뜻이지 image, stylesheet background image, font, iframe 등 모든 asset이 끝났다는 뜻이 아닙니다. 실제 image dimension이 필요하면 image load/decode 또는 window load라는 별도 contract를 사용합니다.",
        "외부 classic scripts에 defer를 사용하면 document parse 뒤 DOMContentLoaded 전에 document order로 실행됩니다. 다만 jQuery external tag에만 defer를 붙이고 바로 다음 inline dependent script는 defer하지 않으면 inline code가 먼저 실행될 수 있습니다.",
        "module script는 기본적으로 deferred execution을 가지지만 module scope와 import/export를 사용합니다. global UMD jQuery와 ESM/bundler build는 ownership 방식이 다르므로 module이라는 단어만으로 window.$가 생긴다고 가정하지 않습니다.",
        "async는 download 완료 순서대로 독립 실행되어 dependency 순서를 보장하지 않습니다. jQuery와 그 plugin/dependent code에 async를 각각 붙이는 구성은 빠른 network에서 우연히 성공해도 race입니다.",
      ],
      concepts: [
        { term: "DOM ready", definition: "document parsing이 끝나 DOM tree를 안정적으로 조회할 수 있는 단계입니다.", detail: ["모든 asset load 완료와 다릅니다.", "jQuery의 ready queue가 callback을 관리합니다."] },
        { term: "parser-blocking script", definition: "HTML parser가 해당 classic script의 fetch와 execution을 기다리는 script입니다.", detail: ["뒤 markup은 아직 DOM에 없습니다.", "순서는 단순하지만 rendering을 지연할 수 있습니다."] },
        { term: "defer", definition: "external classic script를 병렬 fetch하고 parse 완료 뒤 document order로 실행하게 하는 attribute입니다.", detail: ["DOMContentLoaded 전에 실행됩니다.", "inline classic script에는 같은 방식으로 적용되지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-ready-after-head-registration",
          title: "head에서 등록한 ready가 뒤 body의 두 항목을 조회합니다",
          language: "html",
          filename: "jquery-ready.html",
          purpose: "jQuery load와 handler 등록은 head에서 일어나도 handler body는 DOM parsing 후 실행됨을 exact output으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>jQuery ready</title>
  <script
    src="https://code.jquery.com/jquery-4.0.0.min.js"
    integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
    crossorigin="anonymous"></script>
  <script>
    $(function ($) {
      const $items = $("[data-item]");
      $("#out").text([
        "jquery=" + $.fn.jquery,
        "items=" + $items.length,
        "first=" + $items.first().text(),
        "body-present=" + (document.body !== null)
      ].join("\n"));
    });
  </script>
</head>
<body>
  <ul><li data-item>Alpha</li><li data-item>Beta</li></ul>
  <pre id="out"></pre>
</body>
</html>`,
          walkthrough: [
            { lines: "5-9", explanation: "공식 exact-version full minified build를 SRI와 anonymous CORS mode로 먼저 로드합니다." },
            { lines: "10-18", explanation: "$(handler)는 callback을 ready queue에 등록합니다. callback parameter $는 local jQuery alias입니다." },
            { lines: "22-23", explanation: "두 항목과 output node는 handler를 등록한 script보다 source상 뒤에 있지만 실행 시점에는 DOM에 존재합니다." },
          ],
          run: { environment: ["network에서 code.jquery.com 접근이 가능한 modern browser", "JavaScript enabled"], command: "jquery-ready.html을 browser에서 열고 #out의 네 줄을 확인" },
          output: { value: "jquery=4.0.0\nitems=2\nfirst=Alpha\nbody-present=true", explanation: ["loaded function의 version은 4.0.0입니다.", "ready callback 실행 시 data-item 두 개와 body가 이미 만들어졌습니다.", "first()는 collection의 첫 Element를 감싼 새 collection입니다."] },
          experiments: [
            { change: "$(function...)을 제거하고 같은 inline code를 head에서 즉시 실행합니다.", prediction: "jQuery는 존재하지만 뒤 markup이 없어 items=0이며 #out도 없어 text setter가 조용히 아무 일도 하지 않습니다.", result: "library-ready와 DOM-ready를 별도 조건으로 확인해야 합니다." },
            { change: "handler 등록을 setTimeout으로 DOMContentLoaded 뒤 늦춥니다.", prediction: "jQuery ready는 이미 준비된 상태를 기억해 handler를 실행합니다.", result: "늦은 raw DOMContentLoaded listener와 다릅니다." },
            { change: "image를 추가하고 ready 안에서 naturalWidth를 읽습니다.", prediction: "slow network에서는 아직 0일 수 있습니다.", result: "DOM ready는 asset ready가 아닙니다." },
          ],
          sourceRefs: ["web-jquery-intro-source", "web-jquery-class-event-source", "jquery-ready-api", "html-script-loading", "jquery-cdn-release"],
        },
      ],
      diagnostics: [
        { symptom: "ready 안에서는 element를 찾지만 ready 밖 head code에서는 length가 0이다.", likelyCause: "jQuery 존재 여부가 아니라 target markup보다 조회가 먼저 실행되는 DOM timing 문제입니다.", checks: ["script와 target의 source order를 봅니다.", "document.readyState와 collection.length를 두 위치에서 기록합니다.", "defer/module/body-bottom/ready 중 어떤 contract인지 확인합니다."], fix: "$(handler), 올바른 defer chain, module/import 또는 component mount 뒤 query 중 하나로 lifecycle을 명시합니다.", prevention: "script 위치에 우연히 의존하지 말고 component entrypoint의 DOM availability를 test합니다." },
        { symptom: "ready callback에서 image 너비가 0이거나 layout이 나중에 바뀐다.", likelyCause: "DOM parsing 완료와 image/font 등 asset load 완료를 같은 시점으로 오해했습니다.", checks: ["image.complete/naturalWidth 또는 decode를 확인합니다.", "window load 전후 값을 비교합니다.", "CSS/font loading과 layout read timing을 봅니다."], fix: "필요한 asset 자체의 load/decode promise를 기다린 뒤 측정하고 resize/reflow도 처리합니다.", prevention: "DOM initialization과 asset-dependent measurement를 별도 함수와 test로 분리합니다." },
        { symptom: "defer를 붙인 뒤 inline code에서 $가 사라졌다.", likelyCause: "external jQuery만 defer되어 parse 후 실행되는데 뒤 inline script는 parser 중 즉시 실행되었습니다.", checks: ["각 script의 classic/module·src·async·defer를 표로 만듭니다.", "실제 execution timestamp를 기록합니다.", "dependent code가 external deferred script인지 확인합니다."], fix: "dependency와 dependent external scripts를 모두 defer해 document order를 보장하거나 bundler/import로 graph를 만듭니다.", prevention: "script tag load matrix를 integration test하고 부분적으로 attribute를 붙이지 않습니다." },
      ],
      comparisons: [
        { title: "DOM initialization 전략", options: [
          { name: "$(handler)", chooseWhen: "jQuery legacy entrypoint와 late registration guarantee가 필요할 때", avoidWhen: "jQuery dependency가 없는 modern module일 때", tradeoffs: ["짧고 legacy plugin과 일관됩니다.", "jQuery dependency와 global lifecycle을 유지합니다."] },
          { name: "defer/module", chooseWhen: "script graph와 DOM parse 뒤 execution을 markup/build에서 보장할 때", avoidWhen: "inline/deferred order를 혼합해 dependency가 모호할 때", tradeoffs: ["ready wrapper가 줄어듭니다.", "load order contract를 정확히 구성해야 합니다."] },
          { name: "body-bottom", chooseWhen: "작은 정적 page에서 target 뒤 execution이 명확할 때", avoidWhen: "partial render·component remount·dynamic injection이 있을 때", tradeoffs: ["단순합니다.", "위치에 의존하고 reusable lifecycle이 약합니다."] },
        ] },
      ],
    },
    {
      id: "jquery-overloads-wrapper-model",
      title: "$()는 하나의 의미가 아니라 입력 형태에 따라 조회·wrapping·생성·ready를 수행합니다",
      lead: "같은 괄호 표기 때문에 서로 다른 반환값과 부작용을 섞지 않도록 input→operation→result 표를 머릿속에 둡니다.",
      explanations: [
        "$('li.topic')처럼 selector string을 넣으면 context 안의 matching Elements를 담은 jQuery collection을 만듭니다. $('#id')라고 써도 반환값은 Element 하나가 아니라 0개 또는 1개를 담는 collection입니다.",
        "$(domElement)는 이미 가진 Element를 새로 query하지 않고 jQuery wrapper에 넣어 jQuery methods를 사용할 수 있게 합니다. event callback의 this 같은 DOM node와 $(this)를 같은 object라고 생각하면 method 경계가 흐려집니다.",
        "$(nodeList)나 $(arrayOfElements)는 array-like input을 하나의 collection으로 감쌉니다. 원본 NodeList/Array가 jQuery object로 변한 것이 아니라 새 wrapper가 references를 갖습니다.",
        "$('<li>')처럼 HTML-looking string을 넣으면 element 생성 path입니다. $('li') selector와 한 글자 차이지만 operation이 다릅니다. 외부 문자열을 HTML 생성 input에 연결하면 injection sink가 되므로 trusted static markup 또는 DOM creation/text setter를 사용합니다.",
        "$(function ($) { ... })는 selector가 아니라 ready handler 등록 overload입니다. callback parameter로 받은 $는 local alias라 noConflict 환경에서도 안전하게 jQuery를 가리킬 수 있습니다.",
        "argument가 이미 jQuery object라면 다시 $()로 감싸도 보통 같은 elements를 다루지만 불필요한 wrapping과 type confusion을 만듭니다. $ 접두사 변수명은 $items처럼 wrapper임을 드러내는 convention이지 language rule은 아닙니다.",
      ],
      concepts: [
        { term: "overload", definition: "같은 function name이 입력 type/shape에 따라 다른 동작 계약을 선택하는 방식입니다.", detail: ["selector string과 HTML string을 구분합니다.", "function input은 ready 등록입니다."] },
        { term: "wrapper", definition: "기존 DOM references를 담고 jQuery methods를 제공하는 object입니다.", detail: ["DOM node를 복제하지 않습니다.", "원시 node API도 get으로 꺼낼 수 있습니다."] },
        { term: "HTML creation sink", definition: "문자열을 markup으로 parse해 nodes를 만드는 경계입니다.", detail: ["untrusted string을 직접 넣지 않습니다.", "text는 .text() 또는 textContent로 둡니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "document.querySelector('#box').addClass is not a function이 난다.", likelyCause: "native DOM Element에 jQuery collection method를 호출했습니다.", checks: ["value instanceof Element를 확인합니다.", "value.jquery와 value.length를 확인합니다.", "어느 API family를 사용할지 결정합니다."], fix: "$(element).addClass('active')로 명시적으로 wrap하거나 element.classList.add('active')로 native API를 사용합니다.", prevention: "$box/boxElement처럼 변수 type을 드러내고 한 function 안에서 무의미하게 API family를 오가지 않습니다." },
        { symptom: "사용자 이름을 $('<li>' + name + '</li>')로 넣었더니 tag나 event attribute가 실행된다.", likelyCause: "data를 HTML creation string으로 연결해 parser sink를 열었습니다.", checks: ["name이 external/user-controlled인지 추적합니다.", "HTML-taking jQuery methods를 search합니다.", "DOM 결과에 예상 밖 element/attribute가 생기는지 봅니다."], fix: "const $li = $('<li>').text(name)처럼 structure와 text를 분리합니다.", prevention: "untrusted data는 text sink만 통과시키고 Trusted Types/sanitizer가 필요한 rich HTML은 별도 reviewed pipeline으로 제한합니다." },
      ],
    },
    {
      id: "collection-versus-dom-array",
      title: "jQuery collection은 Array도 DOM node도 아닌 array-like wrapper입니다",
      lead: "collection의 membership과 안에 든 node의 identity를 따로 추적하면 length·index·method 오류가 크게 줄어듭니다.",
      explanations: [
        "jQuery selection 결과는 numeric keys와 length를 가진 array-like object입니다. Array.isArray($items)는 false이고 Array.prototype methods가 모두 직접 제공되는 것도 아닙니다. jQuery의 .map/.filter와 native Array methods는 callback와 return contract가 다를 수 있습니다.",
        "$items[0] 또는 $items.get(0)은 첫 raw DOM Element를 반환합니다. .first()는 raw node가 아니라 첫 요소만 담은 새 jQuery collection을 반환합니다. 이 차이가 textContent와 .text(), classList와 .addClass 사용 위치를 결정합니다.",
        ".toArray()와 인수 없는 .get()은 plain Array로 references를 꺼냅니다. Array pipeline이 필요할 때 명시적으로 변환하고, 다시 jQuery methods가 필요하면 필요한 node만 wrap합니다.",
        "no-match selection은 null이 아니라 length 0의 empty jQuery collection입니다. 많은 setter/chained methods는 throw 없이 아무 일도 하지 않아 page가 조용히 잘못될 수 있습니다. required element에는 length와 cardinality assertion을 둡니다.",
        "collection membership은 선택한 시점의 집합입니다. 뒤에 matching node를 추가해도 기존 $items.length가 자동 증가한다고 기대하지 말고 다시 select합니다. 다만 collection 안의 node references는 같은 live DOM objects라 그 node의 text/class 변화는 보입니다.",
        "많은 jQuery methods는 implicit iteration을 합니다. setter 형태는 collection 전체에 쓰고 getter 형태는 보통 첫 element에서 읽습니다. $('#items').text('x')와 $('#items').text()처럼 arguments 유무가 read/write cardinality를 바꿀 수 있으므로 API 문서를 확인합니다.",
      ],
      concepts: [
        { term: "array-like", definition: "numeric index와 length는 있지만 Array 자체는 아닌 object입니다.", detail: ["Array.isArray는 false입니다.", "get/toArray로 plain Array를 얻습니다."] },
        { term: "membership snapshot", definition: "selection 실행 시점에 collection에 들어간 node reference 집합입니다.", detail: ["새 matching node는 자동 포함되지 않습니다.", "이미 든 node의 현재 property는 계속 보입니다."] },
        { term: "implicit iteration", definition: "jQuery setter가 collection의 각 element에 내부적으로 같은 operation을 적용하는 동작입니다.", detail: ["명시 each가 항상 필요하지 않습니다.", "getter는 흔히 첫 요소만 읽습니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-collection-dom-boundary",
          title: "collection, DOM node와 plain Array의 경계를 출력합니다",
          language: "html",
          filename: "jquery-collection.html",
          purpose: "jQuery version marker·length·raw node·get·toArray·empty selection의 반환을 한 번에 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>jQuery collection</title>
  <script
    src="https://code.jquery.com/jquery-4.0.0.min.js"
    integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
    crossorigin="anonymous"></script>
</head>
<body>
  <ul id="list"><li>One</li><li>Two</li><li>Three</li></ul>
  <pre id="out"></pre>
  <script>
    const $items = $("#list > li");
    $("#out").text([
      "jquery-object=" + $items.jquery,
      "length=" + $items.length,
      "dom-node=" + $items[0].nodeName,
      "first-via-get=" + $items.get(0).textContent,
      "array=" + Array.isArray($items.toArray()),
      "missing=" + $(".missing").length
    ].join("\n"));
  </script>
</body>
</html>`,
          walkthrough: [
            { lines: "12", explanation: "body-bottom script 시점에 list children 세 개를 collection으로 선택합니다." },
            { lines: "14-17", explanation: "jquery marker와 length는 wrapper를, numeric index/get은 raw LI Element를 보여 줍니다." },
            { lines: "18-19", explanation: "toArray 결과만 Array이고 no-match는 null 대신 length 0 collection입니다." },
          ],
          run: { environment: ["jQuery CDN에 접근 가능한 modern browser"], command: "jquery-collection.html을 열어 #out 확인" },
          output: { value: "jquery-object=4.0.0\nlength=3\ndom-node=LI\nfirst-via-get=One\narray=true\nmissing=0", explanation: ["$items.jquery는 wrapper를 만든 jQuery version입니다.", "$items[0]과 get(0)은 같은 LI reference를 얻는 두 방법입니다.", "빈 선택도 safe collection이라 length가 0입니다."] },
          experiments: [
            { change: "$items.push처럼 Array method를 직접 기대합니다.", prediction: "일부 array-like method가 보여도 Array contract 전체를 기대할 수 없습니다.", result: "plain array pipeline은 toArray로 경계를 명시합니다." },
            { change: "selection 뒤 list에 새 li를 append하고 기존 length를 다시 출력합니다.", prediction: "기존 collection은 3이고 새 query는 4입니다.", result: "membership과 node identity를 분리합니다." },
            { change: "get(99).textContent를 호출합니다.", prediction: "get(99)가 undefined이므로 property access에서 TypeError가 납니다.", result: "optional cardinality를 검사해야 합니다." },
          ],
          sourceRefs: ["web-jquery-class-event-source", "jquery-constructor-api", "jquery-get-array-api", "dom-query-standard"],
        },
      ],
      diagnostics: [
        { symptom: "selector typo인데 error 없이 style과 event가 적용되지 않는다.", likelyCause: "jQuery empty collection에서 chain이 조용한 no-op으로 끝났습니다.", checks: ["각 boundary에서 collection.length를 기록합니다.", "selector와 root/context를 Elements query로 검증합니다.", "실행 시점과 다른 document/iframe/shadow root인지 봅니다."], fix: "필수 node는 expectOne(selector, root) 같은 assertion helper로 1개임을 검증하고 optional empty는 명시적으로 처리합니다.", prevention: "critical selector cardinality와 empty state를 test하고 data-role 같은 안정적 hook을 사용합니다." },
        { symptom: "$items.map(...).join is not a function 또는 Array API 결과가 예상과 다르다.", likelyCause: "jQuery collection/map result를 plain Array로 착각했습니다.", checks: ["Array.isArray와 value.jquery를 출력합니다.", "callback signature와 null filtering contract를 API별로 확인합니다.", "get/toArray boundary가 있는지 봅니다."], fix: "$items.toArray().map(...) 또는 $items.map(...).get()처럼 변환 지점을 명시합니다.", prevention: "wrapper와 Array variable type/convention을 분리하고 TypeScript type을 사용합니다." },
      ],
    },
    {
      id: "selectors-context-contract",
      title: "selector는 문자열 장식이 아니라 root와 cardinality를 가진 query contract입니다",
      lead: "무엇을 찾는지뿐 아니라 어디에서 몇 개를 찾아야 하는지를 함께 적습니다.",
      explanations: [
        "jQuery는 ID, class, type, attribute, descendant, child, pseudo-class 등 CSS selector syntax를 중심으로 matching set을 만듭니다. 표준 CSS selector를 우선하면 native querySelectorAll로 옮기기 쉽고 browser selector engine 최적화도 활용합니다.",
        "$('p')는 document 전체가 기본 root입니다. $('#panel').find('p') 또는 $('p', panelElement)처럼 component root를 좁히면 unrelated markup 충돌과 query 비용을 줄일 수 있습니다. root 자체를 descendant query가 포함하는지는 API별로 확인합니다.",
        "ID는 document에서 unique여야 합니다. duplicate ID가 있으면 어떤 code가 첫 항목만 얻거나 collection 전체를 얻는지 API와 optimization에 따라 혼란스러우므로 clone이나 server template에서 unique contract를 지킵니다.",
        "presentation class를 JS public API로 쓰면 redesign이 behavior를 깨뜨립니다. data-role/data-js 같은 semantic hook 또는 component-owned root를 사용하되 data attribute를 권한·가격 같은 trusted business state로 신뢰하지 않습니다.",
        "invalid selector는 SyntaxError를 throw할 수 있고 valid하지만 no-match selector는 empty collection입니다. 두 failure mode를 catch 하나로 섞지 않습니다.",
        "사용자 입력을 '#' + input처럼 selector syntax로 조립하면 quote/bracket/escape 때문에 error나 unintended match가 생길 수 있습니다. identifier를 직접 map/allowlist하거나 표준 CSS.escape가 필요한 정확한 token만 escape합니다. selector injection을 HTML injection과 다른 query-boundary 문제로 다룹니다.",
        "같은 전역 selector를 loop와 event마다 반복하면 큰 DOM에서 비용과 coupling이 커집니다. stable root를 cache하고 dynamic subtree가 교체되는 lifecycle에서는 stale cache인지 다시 확인합니다.",
      ],
      concepts: [
        { term: "query root", definition: "selector matching을 시작하는 Document 또는 component Element boundary입니다.", detail: ["전역 충돌을 줄입니다.", "Shadow DOM/iframe은 별도 tree boundary입니다."] },
        { term: "cardinality", definition: "query가 0·1·여러 개 중 몇 개를 정상으로 기대하는지에 대한 계약입니다.", detail: ["required one은 assertion합니다.", "optional empty는 UI state로 처리합니다."] },
        { term: "semantic hook", definition: "시각 표현보다 behavior ownership을 드러내는 stable selector marker입니다.", detail: ["data-js와 component root가 예입니다.", "보안상 trusted state는 아닙니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "동적으로 만든 selector에서 unrecognized expression/SyntaxError가 나거나 엉뚱한 요소가 선택된다.", likelyCause: "외부 문자열을 CSS grammar에 그대로 삽입했습니다.", checks: ["완성된 selector를 민감값 없이 기록합니다.", "고정 syntax와 dynamic token을 분리합니다.", "CSS.escape 또는 allowlist가 적용되는 범위를 확인합니다."], fix: "가능하면 element data를 직접 비교하거나 identifier map을 사용하고, CSS identifier 한 token만 CSS.escape로 escape합니다.", prevention: "query builder에 raw string concatenation을 금지하고 quotes/brackets/Unicode fixture를 test합니다." },
        { symptom: "modal 안 항목만 바꾸려 했는데 page의 같은 class가 모두 바뀐다.", likelyCause: "document 전역 selector를 사용해 component ownership boundary를 잃었습니다.", checks: ["selection root와 length를 기록합니다.", "중복 component instances를 재현합니다.", "closest/root ref가 stale하지 않은지 확인합니다."], fix: "component root에서 .find 또는 context query를 사용하고 expected cardinality를 검증합니다.", prevention: "component API가 root를 인수로 받고 global selector를 내부에서 금지하도록 lint/test합니다." },
      ],
    },
    {
      id: "set-filtering-order-index",
      title: "first·last·eq·even·filter는 DOM 전체가 아니라 현재 collection의 순서와 위치를 다룹니다",
      lead: "사람이 세는 순서, JavaScript index, CSS structural position을 섞지 않고 기준 집합을 먼저 출력합니다.",
      explanations: [
        ".first()와 .last()는 현재 collection의 첫·마지막 element를 담은 새 jQuery collection을 반환합니다. 원본 collection 자체를 삭제하거나 변형하지 않으므로 여러 branch filter를 같은 base에서 만들 수 있습니다.",
        ".eq(index)는 zero-based 위치 하나를 새 collection으로 만듭니다. negative index는 끝에서 셉니다. raw Element가 필요하면 .get(index), wrapper chain이 필요하면 .eq(index)를 선택합니다.",
        ".even()과 .odd()는 현재 matched set의 zero-based index를 사용합니다. 따라서 .even()은 첫째·셋째·다섯째 항목입니다. CSS :nth-child(even)은 parent의 one-based 둘째·넷째 child를 의미하므로 같은 표현이 아닙니다.",
        "원본 ex04의 $(\"p\").even().removeClass(\"blue under\")는 네 paragraph 중 index 0과 2, 즉 Hello1과 Hello3을 고릅니다. 이 동작은 jQuery 3.5에 추가된 .even() method이므로 오래된 runtime에서는 method가 없습니다.",
        "원본 ex03은 title에 first/last를 적고 Hello/HI paragraph 열 개를 두었지만 method를 실제 호출하지 않습니다. 아래 예제는 그 학습 의도를 ex04의 실행 fixture와 함께 재구성한 것이며 원본 실행 결과라고 과장하지 않습니다.",
        ".filter(selectorOrFunction)는 현재 members 중 조건을 통과한 새 collection, .not은 제외한 collection, .is는 하나라도 match하는 boolean을 반환합니다. collection을 반환하는 method와 boolean getter를 chain에서 구분합니다.",
        "filter 순서는 앞선 query와 DOM order에 의해 정해집니다. sort나 DOM move 뒤 같은 selector를 다시 실행하면 index 의미가 바뀔 수 있으므로 업무 identity를 index 하나로 저장하지 않습니다.",
      ],
      concepts: [
        { term: "matched-set index", definition: "현재 jQuery collection 안에서 0부터 매긴 위치입니다.", detail: ["DOM sibling position과 다를 수 있습니다.", "앞선 filter 결과에 따라 다시 매겨집니다."] },
        { term: "non-mutating filter", definition: "base collection을 그대로 두고 subset을 담은 새 wrapper를 반환하는 operation입니다.", detail: ["DOM node 자체를 복제하지 않습니다.", "후속 setter는 subset의 nodes를 변경합니다."] },
        { term: "predicate", definition: "각 candidate가 조건을 통과하는지 boolean으로 판정하는 selector 또는 callback입니다.", detail: ["filter/not/is에서 쓰입니다.", "external state와 부수효과를 최소화합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-first-last-even-filter",
          title: "원본 네 paragraph에서 첫·끝·짝수 index·class 결과를 고정합니다",
          language: "html",
          filename: "jquery-set-filtering.html",
          purpose: "ex03의 first/last 의도와 ex04의 even/removeClass 실행을 하나의 재현 가능한 결과로 교정합니다.",
          code: String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>jQuery set filtering</title>
  <script
    src="https://code.jquery.com/jquery-4.0.0.min.js"
    integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
    crossorigin="anonymous"></script>
</head>
<body>
  <p class="blue under">Hello1</p>
  <p class="blue under highlight">Hello2</p>
  <p class="blue under">Hello3</p>
  <p class="blue under">Hello4</p>
  <pre id="out"></pre>
  <script>
    const $paragraphs = $("p");
    const evenText = $paragraphs.even().toArray()
      .map(function (element) { return element.textContent; })
      .join("|");

    $paragraphs.even().removeClass("blue under");

    const classes = $paragraphs.toArray()
      .map(function (element) {
        return element.className.trim().replace(/\s+/g, "-") || "(none)";
      })
      .join("|");

    $("#out").text([
      "all=" + $paragraphs.length,
      "first=" + $paragraphs.first().text(),
      "last=" + $paragraphs.last().text(),
      "even=" + evenText,
      "highlight=" + $paragraphs.filter(".highlight").text(),
      "classes=" + classes
    ].join("\n"));
  </script>
</body>
</html>`,
          walkthrough: [
            { lines: "12-15", explanation: "원본 ex04의 class fixture 네 개를 그대로 두어 class removal 결과를 비교합니다." },
            { lines: "18-21", explanation: ".even()은 현재 collection index 0·2의 text를 먼저 기록합니다." },
            { lines: "23-29", explanation: "같은 subset에서 두 class token을 제거하고 각 node의 최종 class string을 안정적 형식으로 만듭니다." },
            { lines: "31-38", explanation: "base length, first/last collection getter, highlight filter와 final class를 출력합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-set-filtering.html을 열고 #out 확인" },
          output: { value: "all=4\nfirst=Hello1\nlast=Hello4\neven=Hello1|Hello3\nhighlight=Hello2\nclasses=(none)|blue-under-highlight|(none)|blue-under", explanation: ["base collection 네 개는 filter 후에도 그대로입니다.", "zero-based even positions는 Hello1과 Hello3입니다.", "그 두 node에서만 blue와 under가 사라지고 Hello2 highlight는 유지됩니다."] },
          experiments: [
            { change: ".even()을 CSS selector p:nth-child(even)으로 바꿉니다.", prediction: "DOM child position 기준 둘째·넷째가 선택될 수 있으며 pre 등 sibling 구조에 따라 달라집니다.", result: "matched-set index와 structural position은 다른 축입니다." },
            { change: "$paragraphs.filter('.missing').first().text()를 출력합니다.", prediction: "empty collection getter가 빈 문자열을 반환해 오류가 감춰질 수 있습니다.", result: "required selection cardinality assertion이 필요합니다." },
            { change: "runtime을 jQuery 3.4 이하로 바꿉니다.", prediction: ".even is not a function 오류가 납니다.", result: "API 사용 전에 실제 $.fn.jquery와 compatibility를 확인합니다." },
          ],
          sourceRefs: ["web-jquery-first-last-source", "web-jquery-even-source", "jquery-filtering-api", "jquery-even-api"],
        },
      ],
      diagnostics: [
        { symptom: "짝수 항목을 골랐는데 눈으로는 첫 번째와 세 번째가 바뀐다.", likelyCause: ".even()이 사람의 one-based 번호가 아니라 collection의 zero-based 0·2 index를 선택합니다.", checks: ["각 item에 collection index와 DOM position을 함께 출력합니다.", "앞선 selector/filter가 만든 기준 집합을 확인합니다.", ":nth-child와 .even을 혼용했는지 봅니다."], fix: "업무 요구가 collection index인지 DOM sibling position인지 명시하고 .even 또는 :nth-child(even)을 선택합니다.", prevention: "first/second 같은 label과 index를 test output에 함께 기록합니다." },
        { symptom: "$(...).even is not a function이 난다.", likelyCause: "jQuery 3.5 미만을 로드했거나 $가 다른 library/다른 jQuery instance를 가리킵니다.", checks: ["$.fn.jquery를 출력합니다.", "window.$ === window.jQuery인지 확인합니다.", "중복 script와 plugin load order를 조사합니다."], fix: "지원 version의 한 instance로 통일하거나 호환되는 .filter callback을 사용합니다.", prevention: "package/asset version을 고정하고 compatibility matrix와 smoke test를 둡니다." },
      ],
    },
    {
      id: "global-alias-no-conflict",
      title: "$는 공유 전역 이름이므로 noConflict와 instance ownership을 명시해야 합니다",
      lead: "어떤 $가 어느 jQuery instance와 plugin registry를 가리키는지 확인하지 않으면 간헐적인 method missing을 만들 수 있습니다.",
      explanations: [
        "$라는 identifier는 jQuery keyword가 아닙니다. 다른 library, legacy helper 또는 application이 먼저 window.$를 사용할 수 있고, jQuery load가 그 global을 alias로 차지합니다.",
        "jQuery.noConflict()는 jQuery가 차지하기 전의 $ 값을 복원하고 jQuery global은 남깁니다. 반환된 reference를 jq 같은 지역 변수에 저장하면 global $ 없이도 jq(selector)를 사용할 수 있습니다.",
        "ready callback의 첫 parameter에는 jQuery reference가 전달되므로 jq(function ($) { ... }) block 안에서는 안전한 local $ alias를 쓸 수 있습니다. block 밖의 window.$와 같은지 가정하지 않습니다.",
        "noConflict(true)는 $뿐 아니라 window.jQuery global도 이전 값으로 되돌리는 deep release입니다. plugin이 global jQuery를 나중에 찾는 system에서는 method가 사라질 수 있으므로 ownership plan 없이 호출하지 않습니다.",
        "jQuery를 두 번 로드하면 각각 별도 fn prototype·data/event registry를 가질 수 있습니다. plugin이 첫 instance의 $.fn에 등록되고 code는 두 번째 instance를 호출하면 plugin is not a function이 납니다.",
        "microfrontend나 third-party widget에서는 global을 빌려 쓰기보다 module/bundle boundary 또는 explicit injected jQuery reference를 사용합니다. legacy plugin이 global을 요구하면 integration adapter 한 곳이 책임집니다.",
      ],
      concepts: [
        { term: "noConflict", definition: "jQuery가 점유한 global alias를 이전 값으로 되돌리고 사용할 jQuery reference를 반환하는 API입니다.", detail: ["기본은 $만 양보합니다.", "true 인수는 jQuery global도 양보합니다."] },
        { term: "instance ownership", definition: "page의 어느 jQuery function object가 plugin·data·event 생명주기를 소유하는지 정하는 계약입니다.", detail: ["한 version/instance가 기본입니다.", "plugin registration 대상과 call 대상을 같게 합니다."] },
        { term: "local alias", definition: "function parameter나 module variable 안에서만 jQuery를 가리키는 이름입니다.", detail: ["global collision을 줄입니다.", "dependency가 눈에 보입니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-no-conflict-local-alias",
          title: "기존 $를 복원하고 지역 jQuery alias로 두 항목을 선택합니다",
          language: "html",
          filename: "jquery-no-conflict.html",
          purpose: "noConflict가 $와 jQuery를 모두 지우는 것이 아니라 이전 $를 복원하고 reference를 반환함을 exact identity로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>jQuery noConflict</title>
  <script>
    window.previousDollar = window.$ = function legacyDollar() {
      return "legacy";
    };
  </script>
  <script
    src="https://code.jquery.com/jquery-4.0.0.min.js"
    integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
    crossorigin="anonymous"></script>
  <script>
    const jq = jQuery.noConflict();
    jq(function ($) {
      jq("#out").text([
        "dollar-restored=" + (window.$ === window.previousDollar),
        "jq-version=" + $.fn.jquery,
        "selected=" + $(".item").length,
        "global-jquery=" + (window.jQuery === jq)
      ].join("\n"));
    });
  </script>
</head>
<body>
  <span class="item">A</span><span class="item">B</span>
  <pre id="out"></pre>
</body>
</html>`,
          walkthrough: [
            { lines: "6-10", explanation: "jQuery보다 먼저 존재한 $ function identity를 previousDollar에도 보관합니다." },
            { lines: "16", explanation: "noConflict는 이전 $를 복원하고 현재 jQuery function reference를 jq로 반환합니다." },
            { lines: "17-24", explanation: "ready callback의 local $와 explicit jq가 같은 jQuery instance를 가리키며 global identities를 출력합니다." },
          ],
          run: { environment: ["jQuery CDN에 접근 가능한 modern browser"], command: "jquery-no-conflict.html을 열고 #out 확인" },
          output: { value: "dollar-restored=true\njq-version=4.0.0\nselected=2\nglobal-jquery=true", explanation: ["window.$는 jQuery 전의 legacy function으로 복원되었습니다.", "callback의 local $와 jq는 jQuery 4.0.0입니다.", "기본 noConflict는 window.jQuery global을 유지합니다."] },
          experiments: [
            { change: "noConflict(true)를 사용합니다.", prediction: "window.jQuery도 이전 값으로 돌아가거나 undefined가 되지만 jq reference는 계속 사용할 수 있습니다.", result: "deep release 뒤 global을 찾는 plugin은 별도 조정이 필요합니다." },
            { change: "callback 밖에서 $('.item')을 호출합니다.", prediction: "복원된 legacyDollar가 호출되어 jQuery collection을 반환하지 않습니다.", result: "local alias의 scope를 지켜야 합니다." },
            { change: "jQuery를 다시 로드한 뒤 첫 jq에 등록된 임의 plugin을 둘째 $에서 호출합니다.", prediction: "둘째 instance의 fn에는 plugin이 없어 method missing이 납니다.", result: "instance를 하나로 통일합니다." },
          ],
          sourceRefs: ["jquery-no-conflict-api", "jquery-constructor-api", "jquery-ready-api"],
        },
      ],
      diagnostics: [
        { symptom: "$는 function인데 pluginName is not a function이 간헐적으로 난다.", likelyCause: "$가 plugin이 등록된 jQuery instance와 다른 library 또는 두 번째 jQuery instance를 가리킵니다.", checks: ["각 load 지점에서 $.fn.jquery와 object identity를 기록합니다.", "script tag/package bundle에 중복 jQuery가 있는지 찾습니다.", "plugin factory가 어느 reference를 받는지 확인합니다."], fix: "한 jQuery instance를 dependency injection하고 plugin registration/call을 같은 reference에 묶습니다.", prevention: "global jQuery 중복 검사를 build/runtime smoke test에 넣고 widget adapter 밖에서 deep noConflict를 금지합니다." },
      ],
    },
    {
      id: "native-dom-migration-map",
      title: "jQuery와 native DOM의 차이는 글자 수가 아니라 collection·lifecycle·compatibility contract입니다",
      lead: "한 줄 치환표를 출발점으로 삼되 반환 type과 반복 범위가 바뀌지 않는지 test합니다.",
      explanations: [
        "$(selector)와 document.querySelectorAll(selector)는 모두 여러 요소를 찾지만 전자는 jQuery collection, 후자는 static NodeList입니다. no-match는 둘 다 empty collection이지만 제공 methods와 callback contract가 다릅니다.",
        "$items.first()는 jQuery collection이고 nodeList[0]은 Element 또는 undefined입니다. jQuery의 getter-first/setter-all behavior를 native로 옮길 때 querySelector 한 개와 querySelectorAll+forEach 중 어느 cardinality인지 결정합니다.",
        "$items.addClass('active')는 implicit iteration을 하지만 native Element.classList.add는 한 node method입니다. nodeList.forEach(node => node.classList.add('active'))처럼 반복이 드러납니다.",
        ".on('click', handler)는 addEventListener와 대응하지만 jQuery event normalization, namespace, delegation, data와 this/currentTarget 차이가 있습니다. 단순 search/replace가 아니라 event contract test가 필요합니다.",
        "$(handler)는 defer/module/DOMContentLoaded 또는 component mount lifecycle로 옮길 수 있습니다. late registration behavior가 필요하면 document.readyState를 검사하는 helper를 만들거나 module execution contract로 없앱니다.",
        "기존 jQuery를 4.0으로 곧바로 교체하지 않습니다. current version/plugin inventory와 test baseline을 만들고, 공식 upgrade guide에 따라 supported intermediate version·jQuery Migrate warning 제거·plugin 교체·Migrate 제거·4.0 regression 순서로 진행합니다.",
        "Migrate는 영구 compatibility layer가 아니라 deprecated usage를 발견하고 단계적으로 제거하는 도구입니다. warning을 숨긴 채 version만 올리면 removed API와 silent behavior change를 production에 넘깁니다.",
      ],
      concepts: [
        { term: "behavior-preserving migration", definition: "API 표현을 바꾸면서 externally observable behavior와 accessibility·security contract를 test로 유지하는 이관입니다.", detail: ["before/after fixtures가 필요합니다.", "반환 type과 empty/error behavior를 비교합니다."] },
        { term: "jQuery Migrate", definition: "업그레이드 중 deprecated/removed jQuery usage를 진단하고 일부 compatibility를 제공하는 공식 보조 plugin입니다.", detail: ["warning을 backlog로 처리합니다.", "최종 dependency로 방치하지 않습니다."] },
        { term: "compatibility matrix", definition: "jQuery version, plugin, browser, page별 지원 조합과 검증 결과를 기록한 표입니다.", detail: ["두 instance 혼재를 드러냅니다.", "upgrade 순서를 결정합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "jQuery를 native로 바꾼 뒤 첫 항목만 바뀌거나 null error가 난다.", likelyCause: "jQuery collection setter의 implicit iteration을 querySelector 하나 또는 nullable Element로 단순 치환했습니다.", checks: ["원래 selection length와 write cardinality를 기록합니다.", "querySelector와 querySelectorAll 중 무엇을 썼는지 봅니다.", "empty collection과 null 처리 차이를 test합니다."], fix: "expected cardinality에 따라 required query assertion 또는 querySelectorAll(...).forEach를 사용합니다.", prevention: "API 치환표에 return type·empty behavior·iteration column을 포함합니다." },
        { symptom: "jQuery 4로 바꾼 뒤 오래된 plugin과 positional selector가 깨진다.", likelyCause: "removed/deprecated APIs와 plugin compatibility를 조사하지 않고 major version을 바로 교체했습니다.", checks: ["current/target $.fn.jquery와 plugin version을 inventory합니다.", "Migrate warning과 official upgrade guide를 읽습니다.", "deprecated :eq/:even 같은 selector extension을 search합니다."], fix: "supported 중간 version과 Migrate를 사용해 warning을 제거하고 plugin을 update/replace한 뒤 4.0을 재검증합니다.", prevention: "dependency upgrade를 application regression·accessibility·performance test와 같은 release로 관리합니다." },
      ],
      comparisons: [
        { title: "기본 선택 API 대응", options: [
          { name: "jQuery collection", chooseWhen: "legacy plugin/API chain과 broad existing behavior를 유지할 때", avoidWhen: "신규 small component에 dependency가 전혀 없을 때", tradeoffs: ["implicit iteration과 legacy normalization이 있습니다.", "runtime dependency와 wrapper type을 소유합니다."] },
          { name: "native DOM", chooseWhen: "modern browser baseline과 명시적 component lifecycle이 있을 때", avoidWhen: "검증 없는 전역 rewrite로 plugin contract를 깨뜨릴 때", tradeoffs: ["추가 library가 필요 없습니다.", "null/cardinality/iteration을 직접 명시합니다."] },
        ] },
      ],
      expertNotes: [
        "Migration metric은 제거한 jQuery 호출 수보다 behavior test coverage, bundle/runtime 변화, error rate와 accessibility regression이 중요합니다.",
        "한 page에서 jQuery와 native code가 공존할 수 있지만 DOM ownership과 cleanup owner를 component별로 하나로 정해야 duplicate handler와 stale reference를 막습니다.",
      ],
    },
    {
      id: "testing-performance-accessibility-operations",
      title: "선택 코드는 unit 한 줄이 아니라 실제 browser의 load·DOM·정책에서 검증합니다",
      lead: "정상 network 한 번만 보는 대신 dependency failure와 empty·late·duplicate 상태를 운영 가능한 신호로 만듭니다.",
      explanations: [
        "selector engine과 ready는 browser DOM/lifecycle에 의존하므로 jsdom unit만으로 끝내지 않고 실제 supported browser에서 integration smoke test를 둡니다. cold cache, slow network, CDN block, CSP violation과 fallback을 별도 fixture로 만듭니다.",
        "critical page는 jQuery version, required root count와 initialization completion marker를 확인합니다. console에 raw selector나 user data를 무제한 남기지 않고 page/component/error code와 expected/actual cardinality를 privacy-safe telemetry로 보냅니다.",
        "성능은 '$가 느리다' 같은 추측 대신 representative DOM에서 query count와 duration을 측정합니다. component root를 좁히고 loop 밖에서 stable selection을 cache하되 dynamic re-render 뒤 stale collection을 재사용하지 않습니다.",
        "선택과 class 변경 자체가 semantic·keyboard behavior를 만들지는 않습니다. ex02의 inline onclick과 visual class를 현대화할 때 native button, accessible name, focus, keyboard activation과 event listener lifecycle을 함께 검증합니다.",
        "empty result가 optional인지 bug인지 UX에 드러냅니다. 검색 결과 0개는 정상 empty state일 수 있지만 navigation root 0개는 initialization error입니다. 같은 length 0이라도 domain contract가 다릅니다.",
        "upgrade test는 first/last/even 같은 exact set뿐 아니라 plugin registration, ready ordering, noConflict, CSP/SRI, duplicate instance, screen reader semantics와 cleanup까지 포함합니다.",
      ],
      concepts: [
        { term: "browser integration test", definition: "실제 script loading·DOM parsing·CSP·event timing을 browser에서 함께 검증하는 test입니다.", detail: ["network failure fixture를 포함합니다.", "exact stable output을 비교합니다."] },
        { term: "initialization marker", definition: "component가 required dependency와 DOM을 확인하고 초기화 완료했음을 나타내는 관측 신호입니다.", detail: ["silent no-op을 드러냅니다.", "중복 초기화도 감지합니다."] },
        { term: "stale selection", definition: "DOM subtree가 교체된 뒤 이전 nodes를 계속 가리키는 cached collection입니다.", detail: ["isConnected와 owner lifecycle을 봅니다.", "재선택 또는 state-driven render를 사용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "부분 화면 전환 뒤 같은 handler가 두 번 실행되거나 이전 node만 바뀐다.", likelyCause: "component를 중복 initialize했거나 cached jQuery collection이 detached old DOM을 가리킵니다.", checks: ["initialize/dispose count와 node.isConnected를 기록합니다.", "event namespace/owner와 duplicate listener를 확인합니다.", "subtree replacement 시점을 찾습니다."], fix: "component별 idempotent mount와 dispose를 만들고 새 root에서 collection을 다시 만듭니다.", prevention: "mount→rerender→unmount→remount browser test와 listener leak test를 둡니다." },
        { symptom: "jQuery upgrade 뒤 화면은 비슷하지만 keyboard로 control을 쓸 수 없다.", likelyCause: "visual class와 click mouse path만 regression test하고 semantic element·focus·keyboard contract를 누락했습니다.", checks: ["Tab order와 Enter/Space activation을 확인합니다.", "accessible name/role/state tree를 봅니다.", "native element를 div+click로 바꿨는지 조사합니다."], fix: "native semantic controls를 사용하고 focus·keyboard·ARIA를 behavior test에 포함합니다.", prevention: "visual snapshot 외에 accessibility tree와 keyboard E2E를 release gate로 둡니다." },
      ],
      expertNotes: [
        "Performance budget에는 library transfer/parse뿐 아니라 selector frequency, layout-triggering getter, duplicate handler와 plugin initialization도 포함합니다.",
        "Telemetry는 selector 원문이나 DOM text를 수집하기보다 component ID, error category, count, version과 correlation ID만 수집합니다.",
      ],
    },
  ],
  lab: {
    title: "두 가지 boot 방식과 migration-ready 선택 패널 만들기",
    scenario: "오래된 강의 목록 page가 CDN jQuery와 전역 $에 의존합니다. 동일한 markup을 jQuery mode와 native mode에서 초기화하고, 선택 결과와 failure가 같은 contract를 갖게 만들어 단계적 이관의 기준선을 세웁니다.",
    setup: [
      "course-card 네 개와 data-level, data-course-id를 가진 semantic list를 만듭니다.",
      "jQuery 4.0.0 full minified exact URL·SRI·crossorigin tag와 self-host fallback 설계 문서를 준비합니다.",
      "mode query parameter가 jquery 또는 native를 선택하게 하되 한 mode만 DOM을 소유하게 합니다.",
      "status live region과 required root assertion, initialization marker를 둡니다.",
    ],
    steps: [
      "Network cold cache에서 pinned jQuery가 성공하고 $.fn.jquery가 4.0.0인지 확인합니다.",
      "head의 $(handler) 안에서 component root 하나와 card 네 개를 assertion하고 완료 marker를 기록합니다.",
      "first·last·even·filter로 입문/고급 및 index subset을 만들고 화면과 exact text log에 결과를 표시합니다.",
      "collection·raw Element·plain Array boundary를 .first(), .get(0), .toArray()로 각각 사용합니다.",
      "window.$를 선점한 fixture에서 noConflict를 적용하고 local alias만으로 같은 결과를 만듭니다.",
      "native mode는 querySelectorAll·Array.from/filter·classList를 사용해 같은 expected output을 만듭니다.",
      "CDN block, invalid selector, missing root, duplicated root, 늦은 registration과 dynamic card append를 각각 재현합니다.",
      "empty 정상 상태와 initialization failure를 다른 user message/error code로 표현합니다.",
      "keyboard로 filter control을 조작하고 live status가 읽히며 focus가 사라지지 않는지 확인합니다.",
      "jQuery/native 두 mode의 selection IDs, DOM class, error category를 browser integration test로 비교합니다.",
    ],
    expectedResult: [
      "정상 jQuery mode와 native mode가 같은 네 card와 같은 first/last/even/filter IDs를 출력합니다.",
      "$가 다른 function이어도 local jQuery alias로 정상 초기화되고 기존 $ identity가 보존됩니다.",
      "CDN/CSP/SRI/순서 실패는 silent blank page가 아니라 dependency stage와 recovery message로 드러납니다.",
      "동적 card 추가 전 기존 collection과 재선택 collection의 length 차이가 예상대로 기록됩니다.",
      "필수 root 0개/2개는 initialization failure이고 filter 결과 0개는 접근 가능한 empty state입니다.",
      "mouse뿐 아니라 keyboard와 accessibility state에서도 두 mode behavior가 같습니다.",
    ],
    cleanup: ["임시 network block과 CSP fixture를 원래 test profile로 되돌립니다.", "fallback test가 만든 duplicate script와 handlers가 남지 않았는지 확인합니다."],
    extensions: [
      "실제 legacy page의 selector usage를 inventory해 required·optional·collection으로 분류합니다.",
      "jQuery 3.x fixture와 4.0 fixture에서 .even 지원과 Migrate warning 차이를 기록합니다.",
      "self-hosted content-hashed asset과 CDN의 cold/warm cache timing을 비교하되 availability와 privacy도 평가합니다.",
      "TypeScript로 JQuery<HTMLElement>, Element, Element[] 경계를 type 수준에서 표현합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 ex01~ex04를 감사하고 네 exact example의 결과를 직접 재현하세요.", requirements: ["ex01/ex03에서 설명·fixture와 실제 execution을 구분합니다.", "ready·collection·filter·noConflict 네 예제의 exact output을 모두 맞춥니다.", "각 예제에서 jQuery version과 expected collection length를 출력합니다.", "한 변형 실험씩 실행하고 결과 원인을 문장으로 설명합니다."], hints: ["ex02 body-bottom script의 위치를 먼저 보세요.", ".even()은 0부터 셉니다."], expectedOutcome: "원본의 범위를 과장하지 않고 jQuery load·ready·wrapper·set filter 결과를 재현합니다.", solutionOutline: ["Network/Console/DOM 세 관점으로 증거를 모읍니다.", "output 차이는 timing·type·index 축으로 분류합니다."] },
    { difficulty: "응용", prompt: "$ is not defined와 조용한 empty collection을 진단하는 dependency/selector guard를 구현하세요.", requirements: ["jQuery global과 version을 확인합니다.", "required one, optional one, collection query helper를 구분합니다.", "CDN failure와 CSP/SRI failure category를 구분합니다.", "user-visible recovery와 privacy-safe diagnostic code를 제공합니다.", "late DOM과 duplicate root fixture를 test합니다."], hints: ["typeof window.jQuery를 먼저 검사하세요.", "length 0이 언제 정상인지 API contract에 적으세요."], expectedOutcome: "blank page 대신 원인과 복구가 분명한 initialization boundary가 완성됩니다.", solutionOutline: ["dependency stage 뒤 DOM stage를 순서대로 확인합니다.", "expected cardinality와 actual count를 함께 반환합니다."] },
    { difficulty: "설계", prompt: "plugin-heavy legacy page를 jQuery 4 또는 native DOM으로 점진 이관하는 4주 계획과 compatibility test matrix를 설계하세요.", requirements: ["현재 jQuery/중복 load/plugin/positional selector inventory를 만듭니다.", "Migrate 도입·warning 제거·plugin 교체·Migrate 제거 순서를 정합니다.", "jQuery와 native component의 DOM/event ownership boundary를 정합니다.", "SRI·CSP·offline·self-host/CDN policy를 포함합니다.", "behavior·keyboard·accessibility·performance·error-rate release gate를 정의합니다."], hints: ["major version direct jump를 피하세요.", "호출 수보다 사용자 behavior evidence를 기준으로 삼으세요."], expectedOutcome: "rollback 가능하고 instance collision 없이 측정 가능한 migration roadmap이 완성됩니다.", solutionOutline: ["page/plugin compatibility matrix를 먼저 만듭니다.", "가장 독립적인 component부터 adapter 뒤에서 옮깁니다."] },
  ],
  reviewQuestions: [
    { question: "$는 browser가 기본 제공하는 keyword인가요?", answer: "아닙니다. 보통 jQuery가 window.$에 등록하는 global alias이며 다른 code도 사용할 수 있습니다." },
    { question: "ex02가 ready 없이 동작하는 직접 이유는 무엇인가요?", answer: "dependent script가 body target elements 뒤에 있어 실행 시점에 DOM이 이미 만들어졌기 때문입니다." },
    { question: "$(handler)와 window load는 같은 시점인가요?", answer: "아닙니다. ready는 DOM parse 준비를 다루고 load는 image 등 dependent resources까지 기다립니다." },
    { question: "DOMContentLoaded가 이미 발생한 뒤 등록한 jQuery ready handler는 어떻게 되나요?", answer: "jQuery는 ready state를 기억해 handler를 실행합니다. 늦게 등록한 raw DOMContentLoaded listener와 다릅니다." },
    { question: "$('#box')는 Element를 직접 반환하나요?", answer: "아닙니다. 0개 또는 그 Element를 담은 jQuery collection을 반환합니다." },
    { question: ".first()와 .get(0)의 반환 차이는 무엇인가요?", answer: ".first()는 새 jQuery collection, .get(0)은 raw DOM Element 또는 undefined입니다." },
    { question: "선택 뒤 matching node를 추가하면 기존 collection length가 자동 증가하나요?", answer: "아닙니다. membership은 선택 시점 기준이므로 새 node를 포함하려면 다시 query합니다." },
    { question: "empty jQuery collection이 위험할 수 있는 이유는 무엇인가요?", answer: "많은 chain이 throw 없이 no-op이라 selector typo나 timing error가 조용히 숨을 수 있기 때문입니다." },
    { question: ".even()이 Hello1과 Hello3을 선택하는 이유는 무엇인가요?", answer: "현재 collection에서 zero-based index 0과 2가 even이기 때문입니다." },
    { question: ".even()과 :nth-child(even)은 같은가요?", answer: "아닙니다. 전자는 matched-set의 0-based index, 후자는 parent 안의 1-based structural position입니다." },
    { question: "SRI hash만 있으면 external library 사용이 완전히 안전한가요?", answer: "아닙니다. expected bytes identity만 확인하며 version vulnerability·misuse·availability·CSP 문제는 별도로 관리합니다." },
    { question: "noConflict() 기본 호출은 무엇을 복원하나요?", answer: "jQuery가 차지하기 전의 $를 복원하고 jQuery global은 남기며 현재 jQuery reference를 반환합니다." },
    { question: "jQuery를 두 번 load하면 왜 plugin method가 사라질 수 있나요?", answer: "각 function object의 fn registry가 달라 plugin 등록 instance와 호출 instance가 어긋날 수 있기 때문입니다." },
    { question: "jQuery major upgrade의 첫 단계는 version tag 교체인가요?", answer: "아닙니다. current version·plugin·usage inventory와 regression baseline을 먼저 만들고 upgrade guide/Migrate로 단계적으로 진행합니다." },
  ],
  completionChecklist: [
    "네 원본 파일에서 주석·fixture·실제 execution evidence를 구분했다.",
    "jQuery exact version과 full/slim·development/minified build를 구분했다.",
    "CDN/self-host/bundler 선택에 SRI·CSP·offline·fallback ownership을 포함했다.",
    "parser-blocking·async·defer·module·body-bottom·ready·load timeline을 설명했다.",
    "$()의 selector·DOM wrapping·array-like wrapping·HTML creation·ready overload를 구분했다.",
    "jQuery collection·DOM Element·NodeList·Array를 length/get/toArray로 구분했다.",
    "empty collection과 invalid selector를 서로 다른 failure mode로 처리했다.",
    "query root·semantic hook·expected cardinality를 component contract에 적었다.",
    "first·last·eq·even·filter/not/is의 반환 type과 기준 집합을 설명했다.",
    ".even()의 zero-based 위치와 :nth-child(even)의 one-based 구조 위치를 구분했다.",
    "noConflict와 local alias를 사용하고 multiple jQuery instance를 제거했다.",
    "jQuery/native 대응에서 반환 type·empty behavior·implicit iteration을 test했다.",
    "upgrade guide·Migrate·plugin matrix를 사용한 단계적 이관 계획을 만들었다.",
    "실제 browser에서 four exact outputs와 network/policy failure를 검증했다.",
    "keyboard·accessibility·performance·privacy-safe observability를 release 기준에 포함했다.",
  ],
  nextSessions: ["jquery-02-traversal-manipulation"],
  sources: [
    { id: "web-jquery-intro-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex01_jquery.html", usedFor: ["jQuery definition", "library", "CDN", "ready syntax"], evidence: "주석에 jQuery·CDN·두 ready 형식이 소개되지만 library load와 실행 code는 없고 두 번째 형식은 미완성임을 확인했습니다." },
    { id: "web-jquery-class-event-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex02_jquery.html", usedFor: ["jQuery 4.0.0 load", "ID selector", "body-bottom execution order", "jQuery method chain"], evidence: "head에서 jQuery를 동기 load하고 body elements 뒤 script에서 ID collection을 조작하므로 ready 없이도 조회되는 실제 순서를 사용했습니다." },
    { id: "web-jquery-first-last-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex03_jquery.html", usedFor: ["first/last title", "ten paragraph fixture", "selection-order experiment"], evidence: "title과 DOM fixture는 first/last 학습 의도를 보이지만 실제 호출은 없어 재구성 예제로 보완했습니다." },
    { id: "web-jquery-even-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day10/ex04_jquery.html", usedFor: ["even filtering", "zero-based positions", "removeClass on filtered set"], evidence: "네 paragraph 중 zero-based index 0·2에서 blue/under가 제거되는 원본 실행 결과를 확인했습니다." },
    { id: "jquery-release-4", repository: "OpenJS Foundation jQuery", path: "jQuery 4.0.0 final release", publicUrl: "https://blog.jquery.com/2026/01/17/jquery-4-0-0/", usedFor: ["current stable release", "major release context", "browser/module changes"], evidence: "공식 2026-01-17 final release announcement를 version과 migration context의 기준으로 사용했습니다." },
    { id: "jquery-cdn-release", repository: "OpenJS Foundation jQuery", path: "official CDN releases", publicUrl: "https://releases.jquery.com/", usedFor: ["4.0.0 files", "minified/full/slim variants", "pinned CDN URL"], evidence: "공식 CDN의 exact 4.0.0 resource와 variant를 실행 tag 기준으로 사용했습니다." },
    { id: "jquery-download-builds", repository: "OpenJS Foundation jQuery", path: "download and build variants", publicUrl: "https://jquery.com/download/", usedFor: ["CDN/self-host", "development/minified", "full/slim", "npm/bundler"], evidence: "공식 download page의 배포 방식과 build 차이를 공급망 비교에 사용했습니다." },
    { id: "jquery-ready-api", repository: "OpenJS Foundation jQuery API", path: ".ready()", publicUrl: "https://api.jquery.com/ready/", usedFor: ["$(handler) recommendation", "late registration", "DOMContentLoaded difference", "load distinction", "local alias"], evidence: "ready handler의 document readiness 보장과 recommended shorthand를 timeline의 기준으로 사용했습니다." },
    { id: "jquery-constructor-api", repository: "OpenJS Foundation jQuery API", path: "jQuery()", publicUrl: "https://api.jquery.com/jQuery/", usedFor: ["selector overload", "DOM/array-like wrapping", "HTML creation", "ready overload", "jQuery object"], evidence: "$() 입력별 overload와 wrapper 반환 계약을 공식 constructor documentation에 맞췄습니다." },
    { id: "jquery-get-array-api", repository: "OpenJS Foundation jQuery API", path: ".get() and .toArray()", publicUrl: "https://api.jquery.com/get/", usedFor: ["raw DOM element", "negative index", "plain Array conversion"], evidence: "wrapper에서 raw Element/Array로 나가는 boundary를 공식 get/toArray 계약에 맞췄습니다." },
    { id: "jquery-filtering-api", repository: "OpenJS Foundation jQuery API", path: "filtering category", publicUrl: "https://api.jquery.com/category/traversing/filtering/", usedFor: ["first/last/eq/filter/not/is", "new collection", "matched set"], evidence: "현재 matched set을 줄이는 methods와 return type의 기준으로 사용했습니다." },
    { id: "jquery-even-api", repository: "OpenJS Foundation jQuery API", path: ".even()", publicUrl: "https://api.jquery.com/even/", usedFor: ["zero-based even set", "version added 3.5", "new collection"], evidence: "원본 ex04가 선택하는 0·2 positions와 compatibility 진단을 공식 .even contract로 검증했습니다." },
    { id: "jquery-no-conflict-api", repository: "OpenJS Foundation jQuery API", path: "jQuery.noConflict()", publicUrl: "https://api.jquery.com/jQuery.noConflict/", usedFor: ["restore previous $", "deep release", "returned reference", "multiple versions"], evidence: "global alias 복원과 local instance ownership을 공식 noConflict contract에 맞췄습니다." },
    { id: "jquery-upgrade-4", repository: "OpenJS Foundation jQuery", path: "jQuery Core 4.0 Upgrade Guide", publicUrl: "https://jquery.com/upgrade-guide/4.0/", usedFor: ["removed/deprecated APIs", "Migrate process", "plugin compatibility", "stepwise upgrade"], evidence: "major version 직접 교체 대신 warning 제거와 단계적 regression을 설계하는 기준으로 사용했습니다." },
    { id: "sri-standard", repository: "W3C Web Application Security Working Group", path: "Subresource Integrity", publicUrl: "https://www.w3.org/TR/sri/", usedFor: ["integrity metadata", "CORS interaction", "resource identity", "failure behavior"], evidence: "external jQuery bytes를 고정하고 mismatch 실행을 막는 browser contract의 1차 기준입니다." },
    { id: "html-script-loading", repository: "WHATWG HTML Standard", path: "the script element", publicUrl: "https://html.spec.whatwg.org/multipage/scripting.html#the-script-element", usedFor: ["classic parser blocking", "async", "defer", "module execution", "DOMContentLoaded ordering"], evidence: "ready 전후의 browser parser와 script scheduling 설명을 living standard에 맞췄습니다." },
    { id: "dom-query-standard", repository: "WHATWG DOM Standard", path: "#dom-parentnode-queryselectorall", publicUrl: "https://dom.spec.whatwg.org/#dom-parentnode-queryselectorall", usedFor: ["native selector comparison", "static NodeList", "invalid selector", "query root"], evidence: "jQuery collection과 native DOM selection의 반환·root·error 비교 기준입니다." },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "inventory의 네 원본을 모두 읽고 사용했습니다. ex01은 설명 comment뿐이고 ex03은 title·fixture뿐이므로 실행 동작은 공식 API와 재구성 exact examples로 보완했습니다.",
      "ex02의 class/event와 ex04의 class mutation은 이번 세션에서는 collection·execution order·subset evidence로만 사용하고 상세 class/event API는 jquery-03과 jquery-04에서 다룹니다.",
      "공급망·SRI·CSP·noConflict·multiple version·native migration은 원본에 없어 jQuery/W3C/WHATWG 1차 문서로 보강했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const expertSession = session as DetailedSession;
expertSession.level = "전문가";
expertSession.estimatedMinutes = 400;
expertSession.chapters.push({
  id: "selector-escaping-scope-native-migration-accessibility",
  title: "selector escaping·scope·native migration을 성능과 접근성 계약으로 설계합니다",
  lead: "jQuery selector 한 줄을 querySelector로 기계 치환하지 않습니다. 입력이 selector 문법이 되는 경계, 탐색 root, 반환 collection, document readiness, focus와 semantic state까지 같은 동작 계약으로 옮깁니다.",
  explanations: [
    "jQuery의 `$()`는 selector 실행, HTML fragment 생성, DOM node wrapping, ready callback 등록 등 여러 overload를 가진 함수입니다. modern DOM으로 migration할 때는 호출마다 의도를 먼저 분류합니다. selector는 querySelector/All, wrapping은 node 자체 또는 Array, creation은 createElement/template, ready는 module/defer 또는 DOMContentLoaded로 각각 다른 API가 됩니다.",
    "CSS selector에 사용자·서버 문자열을 보간하면 그 값은 plain text가 아니라 selector grammar 일부가 됩니다. id가 `course:1`, 공백, 점, 대괄호를 포함하면 raw `#${id}`는 다른 의미나 SyntaxError가 될 수 있습니다. identifier 자리에는 `CSS.escape(id)` 또는 jQuery의 `$.escapeSelector(id)`를 사용하고, 가능하면 Map·dataset iteration처럼 selector 조합 자체를 줄입니다.",
    "attribute selector의 quoted value에도 별도 grammar와 escaping 문제가 있습니다. CSS.escape가 모든 selector string template을 자동 안전하게 만들지는 않습니다. 전체 selector를 외부 입력으로 받지 말고 code가 고정한 selector 구조 안에서 정확히 identifier 한 조각만 escape하거나, 이미 찾은 elements의 property 값을 JavaScript로 비교합니다.",
    "탐색 범위는 correctness와 성능의 공통 경계입니다. `$(root).find('.item')`를 `document.querySelectorAll('.item')`로 바꾸면 다른 component의 같은 class까지 포함할 수 있습니다. `root.querySelectorAll(...)`, `:scope > ...`, closest 후 contains 확인으로 component root를 명시하고 shadow root·iframe·detached tree는 별도 document 경계로 다룹니다.",
    "jQuery collection은 array처럼 보이지만 Array가 아니며 chain method와 implicit iteration을 제공합니다. querySelectorAll은 static NodeList이고 getElementsByClassName 계열은 live collection입니다. migration에서 `.first()`, `.eq()`, `.get()`, `.toArray()`의 empty·negative index·identity semantics를 Array indexing, at, Array.from으로 명시적으로 재현합니다.",
    "native selector가 항상 더 빠르거나 jQuery가 항상 느리다는 구호로 결정하지 않습니다. selector 결과를 실제로 쓰는 범위, DOM size, 반복 횟수, mutation 사이 cache 유효성을 측정합니다. querySelectorAll 후 layout-dependent property를 반복 읽으면 selector보다 style/layout thrashing이 더 큰 병목일 수 있습니다.",
    "ready 처리도 migration contract입니다. type=module과 defer script는 document parsing 뒤 실행되지만 async/dynamic script는 실행 시점이 다릅니다. 재사용 initializer는 `document.readyState === 'loading'`이면 DOMContentLoaded once를 등록하고 아니면 즉시 실행하며, hot navigation이나 partial render에서는 document ready보다 component mount/dispose lifecycle을 사용합니다.",
    "jQuery 4 upgrade에서는 deprecated/removed APIs, slim/full build 차이, browser support와 plugin compatibility를 공식 upgrade guide로 점검합니다. 새 jQuery와 legacy plugin을 함께 쓸 때 global `$`를 덮는 방식 대신 dependency ownership을 명시하고, migrate plugin은 임시 진단 도구로만 사용해 warning을 제거한 뒤 배포합니다.",
    "CDN script는 exact version을 고정하고 HTTPS와 Subresource Integrity, crossorigin 정책을 검토합니다. SRI는 받아온 resource bytes가 지정 hash와 같은지 확인하지만 malicious upstream version 선택, compromised application HTML, runtime DOM injection을 모두 해결하지 않습니다. self-host와 CDN의 cache·CSP·offline·update 책임을 비교합니다.",
    "selector로 찾은 요소가 존재한다고 usable UI가 되는 것은 아닙니다. click 가능한 div를 늘리기보다 button/link semantics를 유지하고, filtering 뒤 focus가 제거되면 논리적 다음 control로 이동합니다. hidden/disabled/aria-selected 같은 상태는 selector class만 바꾸지 말고 native property와 accessible state를 authoritative render에서 함께 갱신합니다.",
    "검증은 selector result count만 보지 않습니다. 특수문자 id, 빈 result, duplicated id, nested component, dynamic insert, shadow root, keyboard Tab/Enter/Space, visible focus, Accessibility tree를 포함합니다. DevTools Performance에서 selector 호출과 style/layout을 분리하고, Elements에서 query root 밖 node가 섞이지 않는지 확인합니다.",
  ],
  concepts: [
    { term: "selector injection", definition: "외부 문자열이 CSS selector 문법으로 해석되어 의도하지 않은 요소 선택·SyntaxError·과도한 탐색을 만드는 경계 오류입니다.", detail: ["전체 selector를 외부 입력으로 받지 않습니다.", "identifier 조각에는 CSS.escape를 적용합니다."] },
    { term: "query scope", definition: "selector가 탐색할 Document·Element·ShadowRoot와 component boundary를 명시한 범위입니다.", detail: ["root.querySelectorAll과 :scope를 사용합니다.", "closest 결과도 contains로 소유 범위를 확인합니다."] },
    { term: "migration parity", definition: "jQuery 호출을 native API로 옮길 때 result set·순서·empty behavior·event timing·focus·cleanup이 기존 계약과 같은지 검증하는 기준입니다.", detail: ["문법 치환보다 behavior test를 우선합니다.", "collection과 lifecycle 차이를 기록합니다."] },
  ],
  codeExamples: [
    {
      id: "native-selector-escape-scope-focus",
      title: "CSS.escape와 :scope로 component 밖 선택을 막고 focus를 보존",
      language: "html",
      filename: "native-selector-migration.html",
      purpose: "특수문자 id를 안전하게 선택하고 같은 class가 다른 component에도 있어도 현재 root의 직접 항목만 모으며 semantic button focus를 exact 확인합니다.",
      code: "<!doctype html>\n<html lang=\"ko\">\n<head><meta charset=\"utf-8\"><title>selector migration</title></head>\n<body>\n  <section id=\"alpha\" aria-labelledby=\"alpha-title\">\n    <h2 id=\"alpha-title\">알파 과정</h2>\n    <ul>\n      <li><button id=\"course:1\" class=\"lesson\" type=\"button\">DOM</button></li>\n      <li><button id=\"course.2\" class=\"lesson\" type=\"button\" disabled>Ajax</button></li>\n    </ul>\n  </section>\n  <section id=\"beta\"><button class=\"lesson\" type=\"button\">다른 과정</button></section>\n  <pre id=\"out\" aria-live=\"polite\"></pre>\n  <script>\n    const root = document.querySelector('#alpha');\n    const rawId = 'course:1';\n    const escapedId = CSS.escape(rawId);\n    const selected = root.querySelector(`#${escapedId}`);\n    const scoped = root.querySelectorAll(':scope > ul > li > .lesson');\n    const enabled = [...scoped].filter((button) => !button.disabled);\n    selected.focus();\n\n    const lines = [\n      `escaped=${escapedId}`,\n      `scoped=${scoped.length}`,\n      `enabled=${enabled.length}`,\n      `focused=${document.activeElement.id}`,\n    ];\n    document.querySelector('#out').textContent = lines.join('\\n');\n    console.log(lines.join('\\n'));\n  </script>\n</body>\n</html>",
      walkthrough: [
        { lines: "1-13", explanation: "같은 lesson class가 두 component에 있고 alpha 안 id에는 colon/dot이 포함된 semantic button fixture를 만듭니다." },
        { lines: "15-19", explanation: "component root와 raw identifier를 분리하고 CSS.escape 결과만 id selector 조각에 넣습니다." },
        { lines: "20-22", explanation: ":scope의 직접 구조로 alpha items만 수집하고 disabled는 native property로 거른 뒤 찾은 button에 focus합니다." },
        { lines: "24-32", explanation: "escaped selector, scoped/usable count와 activeElement를 화면·Console에 동일하게 기록합니다." },
        { lines: "31-33", explanation: "script와 문서를 닫고 keyboard Tab 순서와 visible focus를 실제 browser에서 확인합니다." },
      ],
      run: { environment: ["최신 Chromium 또는 Firefox", "native-selector-migration.html을 UTF-8로 저장", "DevTools Elements·Console·Performance·Accessibility", "keyboard-only Tab·Shift+Tab·Enter"], command: "브라우저에서 native-selector-migration.html을 열고 pre 출력, alpha 범위, focus ring과 접근성 이름을 확인" },
      output: { value: "escaped=course\\:1\nscoped=2\nenabled=1\nfocused=course:1", explanation: ["CSS.escape는 colon을 selector 문법에서 literal identifier로 처리하도록 backslash를 추가합니다.", "document 전체에는 lesson이 세 개지만 alpha root와 :scope 구조에서는 두 개만 선택됩니다.", "disabled button을 제외한 usable 항목은 하나이고 focus는 특수문자 id의 native button에 있습니다."] },
      experiments: [
        { change: "root.querySelectorAll을 document.querySelectorAll('.lesson')로 바꿉니다.", prediction: "beta의 다른 과정까지 포함되어 count가 3이 됩니다.", result: "migration에서 탐색 root가 behavior contract임을 확인합니다." },
        { change: "CSS.escape를 제거하고 `#course:1`을 사용합니다.", prediction: "colon이 pseudo-class 문법으로 해석되어 SyntaxError 또는 잘못된 query가 됩니다.", result: "외부 identifier와 selector grammar 경계를 확인합니다." },
        { change: "jQuery 4 full/slim build를 exact version+SRI로 별도 page에 로드하고 `$.escapeSelector(rawId)` 및 `$(root).find()` 결과를 비교합니다.", prediction: "동일한 요소 집합을 얻되 build/plugin/API 호환성은 upgrade guide와 실제 smoke test가 필요합니다.", result: "native migration parity와 공급망 선택을 서로 독립적으로 기록합니다." },
      ],
      sourceRefs: ["jquery-release-4", "jquery-download-builds", "jquery-upgrade-4", "sri-standard", "dom-query-standard"],
    },
  ],
  diagnostics: [
    { symptom: "서버에서 받은 id를 `#${id}`에 넣자 SyntaxError가 나거나 다른 요소가 선택된다.", likelyCause: "plain identifier를 CSS selector grammar로 직접 보간했습니다.", checks: ["id에 colon·dot·space·bracket이 있는 fixture로 재현합니다.", "전체 selector가 외부 입력인지 identifier 조각만 외부인지 분류합니다.", "CSS.escape/$.escapeSelector 적용 위치와 query root를 확인합니다."], fix: "selector 구조는 code에 고정하고 identifier 조각만 CSS.escape로 처리하거나 Map/getElementById/property 비교로 selector 조합을 제거합니다.", prevention: "특수문자·빈 값·매우 긴 값·nested component selector contract test를 둡니다." },
    { symptom: "jQuery를 제거한 뒤 같은 class의 다른 widget까지 event/state 변경 대상이 된다.", likelyCause: "`$(root).find()`의 context를 document.querySelectorAll로 넓혀 query scope를 잃었습니다.", checks: ["기존 jQuery context와 새 native root를 나란히 출력합니다.", ":scope/direct-child 의미와 descendant 차이를 확인합니다.", "closest 결과가 component root 안인지 contains로 검증합니다."], fix: "Element 또는 ShadowRoot에서 query하고 구조상 direct child가 필요하면 :scope를 사용하며 event delegation도 root ownership을 확인합니다.", prevention: "두 개 이상의 동일 component를 렌더링해 cross-component mutation 0을 E2E로 검증합니다." },
  ],
  expertNotes: ["CSS.escape는 identifier serialization 도구이지 임의 selector sanitizer가 아닙니다. 외부 값으로 combinator·pseudo-class·attribute selector 전체를 만들지 않습니다.", "jQuery 제거 여부는 bundle 크기 하나로 판단하지 말고 legacy plugin, browser target, team migration cost와 parity tests를 포함해 단계적으로 결정합니다."],
});

expertSession.reviewQuestions.push(
  { question: "CSS.escape를 전체 selector 문자열에 한 번 적용하면 안전한가요?", answer: "아닙니다. selector 구조는 code에 고정하고 id 같은 identifier 조각만 escape해야 하며 attribute value 등 다른 문맥은 별도 규칙이 필요합니다." },
  { question: "$(root).find('.item')을 document.querySelectorAll('.item')로 바꾸면 같은가요?", answer: "아닙니다. 탐색 root가 document로 넓어져 다른 component의 item까지 포함될 수 있으므로 root.querySelectorAll로 scope를 보존해야 합니다." },
  { question: "SRI를 사용하면 외부 jQuery의 모든 공급망 위험이 사라지나요?", answer: "아닙니다. 특정 resource bytes 무결성을 확인할 뿐 application HTML 변조, 잘못 고정한 version, plugin 취약점과 runtime injection까지 해결하지 않습니다." },
);
expertSession.completionChecklist.push(
  "jQuery overload를 selector·creation·wrapping·ready 의도로 분류해 native API로 parity migration했다.",
  "외부 identifier는 CSS.escape/$.escapeSelector 문맥을 검증하고 전체 selector 입력을 허용하지 않았다.",
  "component query scope·collection semantics·focus·keyboard·Accessibility tree를 migration 전후 비교했다.",
  "jQuery exact version·build·plugin 호환성과 SRI/CSP/self-host 정책을 검증했다.",
);
