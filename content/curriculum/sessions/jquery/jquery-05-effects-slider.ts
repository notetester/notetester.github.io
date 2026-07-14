import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["jquery-05-effects-slider"],
  slug: "jquery-05-effects-slider",
  courseId: "javascript",
  moduleId: "02-jquery-legacy-migration",
  order: 5,
  title: "show/hide/fade/slide/animate와 슬라이더 상태",
  subtitle: "효과 queue와 취소 정책을 정확히 모델링하고, 자동 재생·무한 복제·썸네일이 상태·접근성·모션 선호와 일치하는 슬라이더를 설계합니다.",
  level: "중급",
  estimatedMinutes: 410,
  coreQuestion: "빠른 입력·resize·background timer와 중단이 겹쳐도 animation queue와 UI 상태가 어긋나지 않고, 모든 사용자가 직접 제어할 수 있는 슬라이더를 만들려면 무엇을 source of truth로 두어야 할까요?",
  summary: "inventory의 day11 ex04~ex07과 day12 ex03~ex06 여덟 파일, 앞 세션에서 잘못 배정된 day12 ex01/ex02 두 파일까지 총 10개 원본을 감사합니다. ex04/05/06은 hide/show/toggle, fadeIn/Out/Toggle, slideUp/Down/Toggle이 각각 dimensions+opacity, opacity, height/display를 animated하게 바꾸는 최소 예제입니다. ex07은 width/height animate와 complete callback을 보여 주지만 빠른 toggle clicks가 element별 fx queue에 누적되고, callback이 captured target이 아니라 계속 변하는 isBig을 읽어 완료 message가 실제 animation과 달라질 수 있습니다. 재귀속한 ex01은 left relative animate를 3초씩 queue하고 box click의 stop()은 current만 중간에서 멈춘 뒤 queued next를 시작할 수 있습니다. ex02 ticker는 setInterval 4초와 두 단계 animation을 중첩하며 pause/visibility/dispose가 없습니다. day12 ex03은 flex+transform 원리, ex04는 control 없는 자동 slider, ex05는 slides 전체 clone으로 seamless wrap을 흉내 내지만 resize 중 old width target, queue overlap, duplicate interactive content와 cleanup 문제가 있습니다. ex06 thumbnail gallery는 main image와 active class를 맞추지만 click 가능한 img, generic alt/title, keyboard·pressed/current announcement가 없습니다. 이를 full/slim effects availability, element별 fx queue, queue length, callbacks·promises, stop/finish/clearQueue/jumpToEnd matrix, captured transition target, timer/animation state machine, transform versus left measurement, resize/visibility/page lifecycle, canonical index와 render, accessible manual/auto carousel contract, reduced motion, clone sanitation, thumbnail buttons, browser identity/timing/performance tests로 확장합니다.",
  objectives: [
    "show/hide/toggle·fade·slide·animate가 어떤 CSS/display dimensions를 바꾸고 언제 선택할지 설명할 수 있다.",
    "각 element의 fx queue와 current/queued animations, callback·promise 완료 시점을 관측할 수 있다.",
    ".stop(clearQueue,jumpToEnd)·.finish()·queue clearing의 상태와 callback 결과를 예측할 수 있다.",
    "빠른 입력에서 mutable state와 queued callback이 어긋나는 문제를 transition target capture와 render로 해결할 수 있다.",
    "setInterval과 animation duration을 상태 machine으로 관리하고 overlap·background·dispose를 처리할 수 있다.",
    "canonical slide index 하나로 transform, hidden/current state, buttons, thumbnail과 announcement를 동기화할 수 있다.",
    "clone-based infinite slider의 original/visual index, duplicate ID·focus·ARIA와 resize snap을 안전하게 처리할 수 있다.",
    "자동 rotation 정지 제어·focus/hover pause·keyboard·prefers-reduced-motion·image alt를 갖춘 접근 가능한 carousel을 구현할 수 있다.",
  ],
  prerequisites: [
    { title: "jQuery events와 component lifecycle", reason: "빠른 클릭, focus/hover pause, resize, timer disposal과 namespaced controls를 effect state machine에 연결합니다.", sessionSlug: "jquery-04-events-validation" },
    { title: "비동기 callback·timer·event loop", reason: "animation completion과 interval tick이 이후 task에서 실행되고 서로 겹치는 순서를 분석합니다.", sessionSlug: "js-08-event-loop-timers-callback" },
    { title: "CSS position·transform·overflow", reason: "left/top layout animation과 transform track, clipping window와 stacking/focus-visible 결과를 이해하는 기반입니다.", sessionSlug: "css-07-position-stacking-modal" },
  ],
  keywords: ["jQuery effects", "show", "hide", "toggle", "fade", "slide", "animate", "fx queue", "queue", "stop", "finish", "clearQueue", "jumpToEnd", "callback", "timer", "setInterval", "carousel", "slider", "canonical index", "clone track", "transform", "resize", "prefers-reduced-motion", "rotation control", "aria-hidden", "thumbnail"],
  chapters: [
    {
      id: "ten-source-audit-effects-to-carousel",
      title: "10개 원본을 단순 효과→queue→timer→carousel state의 성장 경로로 읽습니다",
      lead: "각 file이 실제로 실행하는 animation과 빠진 lifecycle·접근성 계약을 분리해 기록합니다.",
      explanations: [
        "day11 ex04는 hide/show/toggle, ex05는 fade, ex06은 slide를 같은 bear image에 적용해 기본 effect family를 비교합니다. 모두 1200ms duration이지만 queue 관측·중단·대체 입력은 없습니다.",
        "day11 ex07은 animate width/height와 complete alert를 보여 줍니다. isBig을 click 즉시 반전하고 callback에서도 mutable isBig을 다시 읽어 queue가 쌓이면 완료된 target과 message가 달라질 수 있습니다.",
        "day12 ex01은 left +=/-=100px animations를 3초 queue하고 stop()을 box click에 둡니다. 인수 없는 stop은 current를 중간에서 멈추고 queued next가 있으면 시작하므로 사용자가 생각한 ‘모두 취소’와 다릅니다.",
        "day12 ex02 news ticker는 setInterval 4초마다 upward animation→text 교체→second animation을 수행합니다. normal 2초 total이면 여유가 있지만 throttling·slow device·hidden tab·reinit에서 overlap 가능성과 interval leak을 다루지 않습니다.",
        "day12 ex03은 overflow window와 flex transform 원리를 시각화하고 ex04는 3초 자동 rotation으로 확장합니다. controls·pause·current announcement·meaningful alt가 없습니다.",
        "day12 ex05는 original slides를 모두 clone해 clone first로 이동한 뒤 left=0 snap을 수행합니다. resize가 current animation target과 경쟁하고 clones의 ID/focus/ARIA와 interval cleanup이 없습니다.",
        "day12 ex06은 thumbnail click→main src→active class를 구현하지만 thumbnails가 img 자체라 keyboard button semantics가 없고 모든 alt/title이 generic하며 active는 border만 전달합니다.",
      ],
      concepts: [
        { term: "effect progression", definition: "단일 property effect에서 queued transitions, timed rotation과 stateful carousel로 복잡도가 커지는 학습 경로입니다.", detail: ["각 단계에 새로운 lifecycle이 생깁니다.", "API 수보다 state ownership이 중요합니다."] },
        { term: "source correction", definition: "앞 세션에 잘못 귀속된 day12 effect files를 실제 주제인 이번 session으로 옮기는 provenance 수정입니다.", detail: ["누락 없이 사용합니다.", "event source라고 과장하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "효과 예제는 각각 동작하지만 slider로 합치자 index·화면·button 상태가 어긋난다.", likelyCause: "개별 effects 호출을 이어 붙였을 뿐 canonical state와 transition lifecycle을 만들지 않았습니다.", checks: ["index/target/queue/timer/render owner를 표로 만듭니다.", "input 중 animation과 callback 순서를 기록합니다.", "DOM class/left를 source로 역추론하는지 봅니다."], fix: "canonical index와 transition(state,source)→render를 만들고 effect는 파생 표현으로 제한합니다.", prevention: "rapid click/resize/timer/focus/dispose sequence를 과정 초기부터 test합니다." },
      ],
    },
    {
      id: "effects-build-and-family-contracts",
      title: "효과 API를 쓰기 전에 full build인지 확인하고 show·fade·slide의 시각·layout 차이를 압니다",
      lead: "method 이름만 바꿔도 숨김 방식·layout·focus 결과가 달라집니다.",
      explanations: [
        "jQuery slim build는 effects module이 없어 show/hide의 즉시 형태 일부와 animation methods availability가 full build와 다를 수 있습니다. 실제 $.fn.jquery와 method 존재, loaded variant를 dependency smoke test로 확인합니다.",
        "hide/show/toggle duration form은 width·height·opacity 등을 함께 변화시켜 display none과 이전 display 복원을 다룹니다. layout 주변 content가 크게 움직일 수 있습니다.",
        "fadeOut/fadeIn/fadeToggle은 opacity를 중심으로 animation하고 완료 시 display를 숨기거나 복원합니다. opacity만 0인 중간 frame에서도 element가 layout/focus/hit testing에 남는 문제를 고려합니다.",
        "slideUp/slideDown/slideToggle은 height/padding/margin 계열을 조절해 disclosure처럼 세로로 열고 닫습니다. semantic expanded/hidden state와 keyboard focus는 별도로 동기화해야 합니다.",
        "duration은 number milliseconds 또는 fast/slow 등이고 기본은 400ms입니다. exact product timing은 token으로 관리하고 test에서는 0 또는 $.fx.off로 final state를 결정적으로 검증합니다.",
        "효과가 보인다고 접근성 tree에서 hidden인 것은 아닙니다. 닫힌 content의 focusable descendants, hidden/display, aria-expanded를 same transition에서 관리합니다.",
      ],
      concepts: [
        { term: "effect family", definition: "dimensions+opacity, opacity, vertical dimensions처럼 서로 다른 CSS state를 보간하는 method 집합입니다.", detail: ["show/fade/slide가 다릅니다.", "layout와 interaction 결과를 비교합니다."] },
        { term: "full build", definition: "Ajax/effects 등 jQuery modules를 포함한 build variant입니다.", detail: ["slim과 구분합니다.", "runtime method smoke test를 둡니다."] },
        { term: "final-state test", definition: "animation frame timing 대신 transition이 끝난 뒤 display/state invariant를 검증하는 test입니다.", detail: ["duration 0/$.fx.off를 사용할 수 있습니다.", "실제 motion E2E는 별도로 둡니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-effect-family-final-states",
          title: "show/hide·fade·slide의 최종 visibility를 모션 없이 검증합니다",
          language: "html",
          filename: "jquery-effects-final-state.html",
          purpose: "CI와 reduced-motion path에서 effect method가 도달해야 하는 visible/hidden state를 exact booleans로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>effect families</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<div id="panel" style="width:40px;height:40px">내용</div><pre id="out"></pre><script>
  $.fx.off = true;
  const $panel = $("#panel");
  const lines = [];
  $panel.hide(1200); lines.push("hide=" + !$panel.is(":visible"));
  $panel.show(1200); lines.push("show=" + $panel.is(":visible"));
  $panel.fadeOut(1200); lines.push("fade-out=" + !$panel.is(":visible"));
  $panel.fadeIn(1200); lines.push("fade-in=" + $panel.is(":visible"));
  $panel.slideUp(1200); lines.push("slide-up=" + !$panel.is(":visible"));
  $panel.slideDown(1200); lines.push("slide-down=" + $panel.is(":visible"));
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "8", explanation: "$.fx.off를 test/reduced-motion fixture에서만 켜 모든 effects를 즉시 final state로 보냅니다." },
            { lines: "11-16", explanation: "세 effect families의 hide/show pair를 같은 sized panel과 :visible final state로 비교합니다." },
          ],
          run: { environment: ["full jQuery 4.0.0 build에 접근 가능한 modern browser"], command: "jquery-effects-final-state.html을 열고 #out 확인" },
          output: { value: "hide=true\nshow=true\nfade-out=true\nfade-in=true\nslide-up=true\nslide-down=true", explanation: ["각 hide form은 final hidden, corresponding show form은 final visible입니다.", "모션 frame이 아니라 state contract를 검증합니다."] },
          experiments: [
            { change: "slim build로 바꿉니다.", prediction: "fade/slide/animate methods availability가 달라질 수 있습니다.", result: "build variant를 dependency contract로 둡니다." },
            { change: "$.fx.off=false와 duration 1200을 사용합니다.", prediction: "호출 직후는 intermediate/running state이고 callback/promise 뒤 final state입니다.", result: "완료 시점을 기다려야 합니다." },
            { change: "panel 안 focusable button을 넣고 slideUp 중 Tab을 누릅니다.", prediction: "visual transition과 focusability가 어긋날 수 있습니다.", result: "interaction/hidden state를 transition policy에 포함합니다." },
          ],
          sourceRefs: ["web-jquery-show-hide-source", "web-jquery-fade-source", "web-jquery-slide-source", "jquery-effects-basic-api", "jquery-download-builds"],
        },
      ],
      diagnostics: [
        { symptom: "fadeIn/slideDown/animate is not a function이 난다.", likelyCause: "effects가 빠진 slim build 또는 다른 jQuery instance를 로드했습니다.", checks: ["$.fn.jquery와 typeof $.fn.animate/fadeIn을 확인합니다.", "script/package file name과 build variant를 봅니다.", "duplicate jQuery instances를 조사합니다."], fix: "효과가 필요하면 reviewed full build 한 instance를 사용하거나 CSS/Web Animations/native instant state로 대체합니다.", prevention: "required method smoke test와 dependency manifest를 둡니다." },
      ],
    },
    {
      id: "fx-queue-observation-completion",
      title: "각 element는 fx queue를 가지며 다음 animation은 앞 transition이 끝난 뒤 시작합니다",
      lead: "빠른 클릭은 마지막 의도 하나가 아니라 여러 작업을 예약할 수 있습니다.",
      explanations: [
        "같은 element에 여러 effect/animate calls를 하면 첫 animation이 시작되고 나머지는 기본 fx queue에 들어갑니다. queue는 element별이므로 두 elements의 animations는 서로 독립적으로 동시에 진행할 수 있습니다.",
        ".queue('fx')는 해당 element의 queue array를 보여 줍니다. running animation을 나타내는 internal inprogress marker가 포함될 수 있어 length를 업무 상태로 직접 저장하기보다 diagnostic으로 사용합니다.",
        "animate complete callback은 matched element별 animation이 정상 완료하거나 jumpToEnd로 완료될 때 호출됩니다. stop(false,false)처럼 중간 중단하면 current callback은 호출되지 않습니다.",
        ".promise('fx')는 selected elements의 fx queues가 모두 비워졌을 때 후속 작업을 연결하는 데 사용할 수 있지만 cancellation semantics와 error channel은 native Promise와 다릅니다.",
        "custom .queue(callback)는 next/dequeue를 호출하지 않으면 queue가 영원히 멈춥니다. animation callback과 custom queue step을 섞을 때 반드시 진행 책임을 명시합니다.",
        "원본 ex07에서 빠르게 enlarge/shrink/toggle을 누르면 3초 animations가 차례로 재생되어 입력을 멈춘 뒤에도 UI가 오래 움직입니다. 버튼을 disable, latest-intent replacement 또는 bounded queue 중 product policy를 정합니다.",
      ],
      concepts: [
        { term: "fx queue", definition: "jQuery가 element별 effects functions를 순차 실행하는 기본 queue입니다.", detail: ["이름은 fx입니다.", "same element calls가 누적됩니다."] },
        { term: "completion callback", definition: "한 animation이 target state까지 완료된 뒤 element별 호출되는 function입니다.", detail: ["중간 stop에서는 호출되지 않을 수 있습니다.", "mutable external state를 조심합니다."] },
        { term: "queue backpressure", definition: "사용자 입력 속도가 animation 처리 속도보다 빨라 pending work가 계속 늘어나는 문제입니다.", detail: ["latest intent 또는 disable policy를 정합니다.", "queue length/delay를 관측합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "클릭을 멈췄는데도 box가 몇 초 동안 계속 움직인다.", likelyCause: "각 click이 새 animation을 fx queue에 추가해 backlog가 남았습니다.", checks: ["$box.queue('fx').length와 click/complete timestamps를 기록합니다.", "same element에 relative animations가 쌓이는지 봅니다.", "button disable/latest-intent policy가 있는지 확인합니다."], fix: "제품 요구에 따라 stop(true,false/true)로 이전 work를 clear하고 새 target을 시작하거나 transition 중 input을 잠급니다.", prevention: "rapid 20-click fixture와 maximum queue/delay budget을 둡니다." },
        { symptom: "custom queue step 뒤 다음 effect가 영원히 시작하지 않는다.", likelyCause: ".queue(function(next){...}) 안에서 next/dequeue를 호출하지 않았습니다.", checks: ["fx queue head와 length를 봅니다.", "custom function exit paths를 확인합니다.", "exception 전 next가 누락됐는지 봅니다."], fix: "모든 정상/오류 path에서 next를 호출하거나 animation complete callback으로 단순화합니다.", prevention: "queue drain promise timeout test를 둡니다." },
      ],
    },
    {
      id: "stop-finish-cancellation-matrix",
      title: "stop의 clearQueue와 jumpToEnd는 현재 animation·나머지 queue·callback을 서로 다르게 처리합니다",
      lead: "‘멈춘다’라는 한 단어 대신 current position, pending work, final state와 callback 네 칸을 정의합니다.",
      explanations: [
        ".stop(false,false)는 current animation을 intermediate state에서 멈추고 current callback을 호출하지 않으며 queue의 next animation을 바로 시작할 수 있습니다.",
        ".stop(true,false)는 current를 intermediate에서 멈추고 queued animations를 지웁니다. 화면이 중간 width/left/opacity로 남으므로 다음 render가 deterministic final state를 써야 합니다.",
        ".stop(false,true)는 current를 target end로 jump해 callback을 호출하고 queued next를 시작합니다. queue backlog 자체는 남습니다.",
        ".stop(true,true)는 current target으로 jump해 callback을 호출하고 rest queue를 지웁니다. latest-intent UI에서 이전 transition을 finalizing할지 중간에서 replace할지 결정 후 사용합니다.",
        ".finish()는 current와 모든 queued animations을 중단하고 각각의 target final values/completion을 즉시 적용해 최종 target이 last queued intent가 될 수 있습니다. stop(true,true)와 같다고 단순화하지 않습니다.",
        "day12 ex01의 인수 없는 stop은 ‘모두 취소’가 아닙니다. 사용자가 box를 click했을 때 current만 중간에서 멈추고 queued directions가 있으면 next가 시작될 수 있습니다.",
      ],
      concepts: [
        { term: "clearQueue", definition: "current 뒤에 기다리는 queued animations를 제거할지 정하는 stop 인수입니다.", detail: ["current stopping과 별개입니다.", "true면 backlog를 버립니다."] },
        { term: "jumpToEnd", definition: "current animation을 intermediate가 아니라 target final CSS에 즉시 도달시킬지 정하는 인수입니다.", detail: ["true면 completion callback이 호출됩니다.", "queue clearing과 별개입니다."] },
        { term: "finish", definition: "current와 queued animations 모두를 final targets로 완료 처리하고 queue를 제거하는 operation입니다.", detail: ["마지막 queued target까지 적용될 수 있습니다.", "callback side effects를 고려합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-stop-queue-callback-matrix",
          title: "stop(true,false)와 stop(true,true)의 queue·callback·target 차이를 검증합니다",
          language: "html",
          filename: "jquery-stop-matrix.html",
          purpose: "실시간 intermediate position을 제외하고 stable queue/callback/final target semantics를 exact output으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>stop matrix</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<div id="box" style="position:absolute;left:0;width:10px;height:10px"></div><pre id="out"></pre><script>
  const $box = $("#box");
  const lines = [];
  let completed = 0;
  $box.animate({ left: 100 }, 1000, function () { completed += 1; })
    .animate({ left: 200 }, 1000, function () { completed += 1; })
    .animate({ left: 300 }, 1000, function () { completed += 1; });
  lines.push("queued-before=" + $box.queue("fx").length);
  $box.stop(true, false);
  lines.push("after-stop-queue=" + $box.queue("fx").length);
  lines.push("after-stop-callbacks=" + completed);
  $box.css("left", 0);
  $box.animate({ left: 100 }, 1000, function () { completed += 1; })
    .animate({ left: 200 }, 1000, function () { completed += 1; });
  lines.push("queued-before-jump=" + $box.queue("fx").length);
  $box.stop(true, true);
  lines.push("after-jump-queue=" + $box.queue("fx").length);
  lines.push("after-jump-callbacks=" + completed);
  lines.push("after-jump-left=" + $box[0].style.left);
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "11-17", explanation: "세 long animations를 즉시 queue하고 diagnostic length를 읽습니다." },
            { lines: "18-21", explanation: "clearQueue true, jump false는 current callback 없이 queue를 0으로 만듭니다." },
            { lines: "22-30", explanation: "두 animations를 다시 queue한 뒤 jump true로 current first target 100px과 callback 하나만 완료합니다." },
          ],
          run: { environment: ["full jQuery 4.0.0 build에 접근 가능한 modern browser"], command: "jquery-stop-matrix.html을 열고 #out 확인" },
          output: { value: "queued-before=3\nafter-stop-queue=0\nafter-stop-callbacks=0\nqueued-before-jump=2\nafter-jump-queue=0\nafter-jump-callbacks=1\nafter-jump-left=100px", explanation: ["running marker를 포함한 queue length와 clear 결과가 보입니다.", "jumpToEnd는 current target과 callback만 완료하고 queued second는 clear됩니다."] },
          experiments: [
            { change: "stop(false,false)를 사용합니다.", prediction: "current는 중간에서 멈추고 queued next가 시작될 수 있습니다.", result: "전체 cancel이 아닙니다." },
            { change: "stop(false,true)를 사용합니다.", prediction: "current callback 후 queued next가 시작되어 queue는 계속 진행합니다.", result: "jump와 clear는 독립입니다." },
            { change: "finish()를 사용합니다.", prediction: "queued targets까지 final values/completions가 즉시 처리되어 last target 200px까지 갈 수 있습니다.", result: "stop(true,true)와 다릅니다." },
          ],
          sourceRefs: ["web-jquery-animate-source", "web-jquery-stop-source", "jquery-stop-api", "jquery-finish-api", "jquery-queue-api"],
        },
      ],
      diagnostics: [
        { symptom: "stop 버튼을 눌렀는데 box가 즉시 다른 방향으로 다시 움직인다.", likelyCause: "stop() 기본은 current만 멈추고 pending queue를 clear하지 않아 next animation이 시작됐습니다.", checks: ["stop 인수와 fx queue length를 확인합니다.", "relative directions가 몇 개 pending인지 기록합니다.", "원하는 cancel final state를 정의합니다."], fix: "전체 pending 제거면 stop(true,false/true)를 선택하고 canonical state에서 final CSS를 다시 render합니다.", prevention: "네 stop 조합 truth table과 rapid-click cancel E2E를 둡니다." },
      ],
    },
    {
      id: "mutable-state-callback-capture",
      title: "queued callback은 실행 시점의 mutable state가 아니라 transition을 시작할 때의 target을 capture합니다",
      lead: "완료 message와 ARIA state가 실제로 끝난 animation과 같은 intent를 가리켜야 합니다.",
      explanations: [
        "day11 ex07의 toggle click은 isBig을 즉시 반전하고 width/height target을 예약합니다. 여러 clicks가 queue되면 첫 callback이 실행될 때 isBig은 이미 나중 click 값일 수 있습니다.",
        "callback 안 alert(isBig?'늘리기':'줄이기')는 animation이 끝낸 target이 아니라 latest mutable flag를 읽어 wrong message를 만들 수 있습니다.",
        "transition마다 const targetBig = nextState를 capture하고 completion에서 targetBig을 사용합니다. 더 나은 구조는 canonical state와 transition token을 만들고 stale completion이 current UI를 덮지 않게 합니다.",
        "latest-intent policy라면 새 input에서 previous animation을 stop(true,false), state를 latest target으로 set, render/animate를 새로 시작합니다. sequential-intent policy라면 queue item 자체에 immutable target snapshot을 넣습니다.",
        "completion callback이 alert/focus/live announcement를 남발하면 queued effects마다 뒤늦은 feedback이 나옵니다. 중요한 state change만 polite status로 알리고 stale callback은 무시합니다.",
      ],
      concepts: [
        { term: "captured target", definition: "transition을 예약할 때 const로 고정한 그 작업의 목표 state입니다.", detail: ["completion과 일치합니다.", "later mutable state와 분리됩니다."] },
        { term: "transition token", definition: "각 animation request에 증가 ID를 부여해 latest completion인지 확인하는 값입니다.", detail: ["stale callback을 무시합니다.", "async response guard와 같습니다."] },
        { term: "latest versus sequential intent", definition: "새 입력이 이전 작업을 대체할지 모든 입력을 순서대로 실행할지에 대한 제품 정책입니다.", detail: ["stop/queue 선택을 결정합니다.", "사용자 expectation을 문서화합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-queue-captured-state",
          title: "custom queue에서 mutable flag와 captured target의 report 차이를 비교합니다",
          language: "html",
          filename: "jquery-captured-target.html",
          purpose: "animation time에 의존하지 않고 queued completion closure가 읽는 state difference를 deterministic하게 보여 줍니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>captured target</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body><div id="box"></div><pre id="out"></pre><script>
  const $box = $("#box");
  const lines = [];
  let oldBig = false;
  function enqueueOld() {
    oldBig = !oldBig;
    $box.queue("old", function (next) {
      lines.push("old-report=" + (oldBig ? "big" : "small"));
      next();
    });
  }
  let fixedBig = false;
  function enqueueFixed() {
    const targetBig = !fixedBig;
    fixedBig = targetBig;
    $box.queue("fixed", function (next) {
      lines.push("fixed-report=" + (targetBig ? "big" : "small"));
      next();
    });
  }
  enqueueOld(); enqueueOld();
  enqueueFixed(); enqueueFixed();
  $box.dequeue("old");
  $box.dequeue("fixed");
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "10-17", explanation: "old callbacks는 실행 시점의 shared oldBig만 읽으므로 두 requests target을 잃습니다." },
            { lines: "18-27", explanation: "fixed callback은 각 enqueue에서 targetBig const를 capture합니다." },
            { lines: "28-32", explanation: "두 custom queues를 나중에 drain해 final mutable state와 captured targets를 비교합니다." },
          ],
          run: { environment: ["jQuery 4.0.0을 지원하는 modern browser"], command: "jquery-captured-target.html을 열고 #out 확인" },
          output: { value: "old-report=small\nold-report=small\nfixed-report=big\nfixed-report=small", explanation: ["old callbacks 둘은 final mutable small을 잘못 보고합니다.", "fixed callbacks는 각 big/small transition target을 보존합니다."] },
          experiments: [
            { change: "queue를 바로 실행하는 fx queue로 바꿉니다.", prediction: "timing에 따라 bug가 감춰질 수 있지만 rapid input에서는 다시 드러납니다.", result: "custom deterministic test가 closure issue를 분리합니다." },
            { change: "transition token을 추가하고 only-latest completion만 render합니다.", prediction: "이전 callback은 state announcement를 건너뜁니다.", result: "latest-intent UI가 안정됩니다." },
            { change: "immutable action array로 targets를 저장합니다.", prediction: "sequential playback에서도 각 intent가 보존됩니다.", result: "제품 정책에 맞게 선택합니다." },
          ],
          sourceRefs: ["web-jquery-animate-source", "jquery-queue-api", "jquery-animate-api"],
        },
      ],
      diagnostics: [
        { symptom: "box는 작아졌는데 callback은 ‘늘리기 성공’이라고 말한다.", likelyCause: "queued callback이 자기 target이 아니라 click마다 변한 shared isBig을 실행 시점에 읽었습니다.", checks: ["request target/token과 callback observed state를 함께 기록합니다.", "queue length와 click order를 재현합니다.", "completion side effect가 stale인지 확인합니다."], fix: "각 request의 target을 const로 capture하거나 latest token completion만 render합니다.", prevention: "rapid alternating clicks와 delayed completions fixture를 둡니다." },
      ],
    },
    {
      id: "timers-overlap-visibility-disposal",
      title: "자동 재생 timer는 animation과 별도 resource이며 overlap·visibility·focus·dispose를 관리합니다",
      lead: "setInterval을 시작한 것만으로 carousel controller가 완성되지 않습니다.",
      explanations: [
        "day12 ex02 ticker는 interval 4000ms, two animations 1000ms씩이라 정상 foreground에서는 overlap 여유가 있습니다. 하지만 background throttling, long task, reduced device performance와 queue backlog로 다음 tick 전에 transition이 끝나지 않을 수 있습니다.",
        "setInterval callback은 previous async/animation 완료를 기다리지 않습니다. controller가 isTransitioning이면 tick skip, next timeout을 completion 뒤 schedule하거나 latest-intent replacement policy를 사용합니다.",
        "timer ID는 component owner가 저장하고 pause/stop/dispose에서 clearInterval/clearTimeout합니다. remount마다 새 interval을 만들면 rotation 속도가 배수로 증가합니다.",
        "document visibilitychange에서 hidden이면 pause하고 visible에서 user rotation preference에 따라 재개합니다. background에서 밀린 ticks를 한꺼번에 재생하지 않습니다.",
        "APG carousel은 auto rotation에 stop/restart button을 요구하고 keyboard focus가 carousel에 들어오면 stop하며 user가 명시 재시작하기 전 자동으로 재개하지 않습니다. hover 동안도 stop합니다.",
        "자동 ticker text를 live region으로 매 tick assertive announce하면 screen reader를 방해합니다. auto rotation 중 live off, user-triggered navigation에서만 concise status를 알리는 정책을 고려합니다.",
      ],
      concepts: [
        { term: "timer resource", definition: "component mount에서 생성하고 pause/dispose에서 명시 해제해야 하는 interval/timeout handle입니다.", detail: ["animation queue와 별개입니다.", "중복 mount를 막습니다."] },
        { term: "transition lock", definition: "현재 animation이 끝나기 전 새로운 automatic transition을 skip/replace/queue할지 제어하는 state입니다.", detail: ["overlap을 막습니다.", "manual input policy와 구분합니다."] },
        { term: "rotation preference", definition: "사용자가 자동 재생을 명시적으로 켰는지·껐는지 보존하는 state입니다.", detail: ["focus stop 뒤 자동 재개하지 않습니다.", "session/device preference를 설계합니다."] },
      ],
      codeExamples: [
        {
          id: "carousel-rotation-controller-policy",
          title: "reduced motion·focus·hover·manual restart를 pure rotation controller로 검증합니다",
          language: "html",
          filename: "carousel-rotation-policy.html",
          purpose: "실제 시간 기다림 없이 automatic rotation policy와 canonical index 변화를 exact state로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>rotation policy</title></head><body><pre id="out"></pre><script>
  function createRotation(total, reduced) {
    let index = 0;
    let running = false;
    return {
      startByUser() { running = true; },
      startAutomatically() { if (!reduced) running = true; },
      stop() { running = false; },
      tick() { if (running) index = (index + 1) % total; },
      snapshot() { return { index, running }; }
    };
  }
  const lines = [];
  const reduced = createRotation(3, true);
  reduced.startAutomatically();
  lines.push("reduced-start=" + reduced.snapshot().running);
  const normal = createRotation(3, false);
  normal.startAutomatically();
  lines.push("normal-start=" + normal.snapshot().running);
  normal.tick();
  lines.push("tick=" + normal.snapshot().index);
  normal.stop();
  normal.tick();
  lines.push("focus-stop=" + !normal.snapshot().running + ",index=" + normal.snapshot().index);
  normal.startByUser();
  normal.tick();
  lines.push("manual-restart=" + normal.snapshot().running + ",index=" + normal.snapshot().index);
  normal.stop();
  lines.push("hover-stop=" + !normal.snapshot().running);
  document.querySelector("#out").textContent = lines.join("\n");
</script></body></html>`,
          walkthrough: [
            { lines: "3-13", explanation: "timer implementation과 분리한 pure controller가 reduced policy, running과 canonical index를 소유합니다." },
            { lines: "16-31", explanation: "automatic start, tick, focus stop, explicit restart와 hover stop sequence를 deterministic하게 실행합니다." },
          ],
          run: { environment: ["modern browser"], command: "carousel-rotation-policy.html을 열고 #out 확인" },
          output: { value: "reduced-start=false\nnormal-start=true\ntick=1\nfocus-stop=true,index=1\nmanual-restart=true,index=2\nhover-stop=true", explanation: ["reduced preference에서는 automatic start가 거부됩니다.", "focus stop 뒤 tick이 멈추고 explicit user restart만 다시 진행합니다."] },
          experiments: [
            { change: "focus stop 뒤 focusout에서 startAutomatically를 호출합니다.", prediction: "reduced가 아니면 자동 재개되어 APG의 explicit restart expectation을 깨뜨릴 수 있습니다.", result: "userStopped/focusStopped state를 더 세분화합니다." },
            { change: "tick을 transition 중 여러 번 호출합니다.", prediction: "lock policy 없이는 index가 화면보다 앞설 수 있습니다.", result: "controller에 transitioning/token을 추가합니다." },
            { change: "visibility hidden/visible events를 controller에 연결합니다.", prediction: "hidden에서 stop되고 visible에서 saved user preference에 따라 재개됩니다.", result: "missed ticks를 replay하지 않습니다." },
          ],
          sourceRefs: ["web-jquery-news-ticker-source", "web-auto-slider-source", "wai-carousel-pattern", "media-reduced-motion", "html-timers-visibility"],
        },
      ],
      diagnostics: [
        { symptom: "SPA 화면을 다시 열 때마다 auto slider가 점점 빨라진다.", likelyCause: "이전 interval을 dispose하지 않고 remount마다 추가 timer를 만들었습니다.", checks: ["active timer/mount/dispose count를 기록합니다.", "event namespace와 timer owner를 확인합니다.", "route unmount 뒤 callbacks를 instrument합니다."], fix: "component disposer가 interval/timeout/animation queue를 모두 stop/clear하고 idempotent mount를 보장합니다.", prevention: "mount→unmount→remount fake-clock test와 one tick=one transition assertion을 둡니다." },
        { symptom: "hidden tab에서 돌아오자 여러 slides가 빠르게 지나가거나 queue가 쌓인다.", likelyCause: "timer throttling/missed schedule과 running animation을 상태 없이 누적했습니다.", checks: ["visibility state, tick timestamps, queue length를 봅니다.", "interval callback이 transition 완료를 기다리는지 확인합니다.", "catch-up replay logic을 찾습니다."], fix: "hidden에서 pause하고 visible에서 current time/state로 one transition만 schedule하며 backlog를 버립니다.", prevention: "visibility change와 long-task fake clock fixtures를 둡니다." },
      ],
    },
    {
      id: "canonical-index-render-slider",
      title: "슬라이더는 transform 값을 읽지 않고 canonical index 하나에서 모든 UI를 render합니다",
      lead: "버튼·track·slide visibility·thumbnail·announcement가 같은 index를 바라보게 합니다.",
      explanations: [
        "day12 ex03의 goTo(index)는 transform만 바꾸고 current index/selected button/hidden slide를 관리하지 않습니다. index를 closure state에 저장하고 normalize한 뒤 render에서 모든 표현을 갱신합니다.",
        "normalize(index,total)는 ((index%total)+total)%total로 next/previous wrap을 다룹니다. total 0이면 component error/empty state를 별도 처리하고 modulo zero를 피합니다.",
        "render는 track transform, slide hidden/aria-hidden/inert, picker aria-current/pressed, status '2/3'과 optional preload를 같은 index에서 만듭니다.",
        "off-screen transform만 적용한 slides는 DOM/accessibility/focus에서 여전히 존재할 수 있습니다. inactive slide의 interactive descendants를 hidden/inert 또는 APG pattern에 맞게 관리합니다.",
        "manual button activation은 focus를 control에 유지해 반복 navigation을 쉽게 합니다. Tab sequence를 script로 가로채지 않고 native buttons를 사용합니다.",
        "URL/hash/deep link로 initial index를 받으면 parse·range normalize하고 data identity로 복원합니다. slide insert/remove 뒤 index가 같은 content를 가리키는지 ID 기반 policy를 둡니다.",
      ],
      concepts: [
        { term: "canonical index", definition: "현재 보여 줄 logical slide를 나타내는 유일한 state입니다.", detail: ["transform/class를 역으로 읽지 않습니다.", "모든 표현이 여기서 파생됩니다."] },
        { term: "index normalization", definition: "negative/overflow index를 0..total-1 범위로 순환시키는 함수입니다.", detail: ["next/previous wrap에 사용합니다.", "total 0을 별도 처리합니다."] },
        { term: "inactive slide contract", definition: "보이지 않는 slide가 accessibility tree·focus·interaction에서 어떻게 제외되는지 정한 정책입니다.", detail: ["transform만으로 충분하지 않습니다.", "hidden/inert/focusability를 test합니다."] },
      ],
      codeExamples: [
        {
          id: "carousel-canonical-index-render",
          title: "next·wrap·previous를 canonical index와 slide 상태로 동기화합니다",
          language: "html",
          filename: "carousel-canonical-index.html",
          purpose: "transform animation 없이 state/render logic의 wrap·current·hidden invariant를 exact output으로 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>canonical carousel</title></head><body>
<section id="carousel" aria-label="과정 슬라이드"><div class="track">
  <article class="slide" data-id="html">HTML</article>
  <article class="slide" data-id="css">CSS</article>
  <article class="slide" data-id="js">JavaScript</article>
</div><p id="status"></p></section><pre id="out"></pre><script>
  const slides = [...document.querySelectorAll(".slide")];
  let index = 0;
  const lines = [];
  function normalize(value) { return (value % slides.length + slides.length) % slides.length; }
  function render(label) {
    index = normalize(index);
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.setAttribute("aria-hidden", String(i !== index));
    });
    document.querySelector("#status").textContent = (index + 1) + "/" + slides.length;
    lines.push(label + "=" + index + "|" + slides[index].dataset.id + "|" + document.querySelector("#status").textContent);
  }
  render("init");
  index += 1; render("next1");
  index += 1; render("next2");
  index += 1; render("wrap");
  index -= 1; render("prev");
  document.querySelector("#out").textContent = lines.join("\n");
</script></body></html>`,
          walkthrough: [
            { lines: "9-11", explanation: "DOM slides를 snapshot하고 index 하나를 canonical state로 둡니다." },
            { lines: "12-21", explanation: "normalize와 render가 hidden/aria-hidden/status를 같은 index에서 갱신합니다." },
            { lines: "22-27", explanation: "initial, two next, overflow wrap와 negative previous를 순서대로 검증합니다." },
          ],
          run: { environment: ["modern browser"], command: "carousel-canonical-index.html을 열고 #out 확인" },
          output: { value: "init=0|html|1/3\nnext1=1|css|2/3\nnext2=2|js|3/3\nwrap=0|html|1/3\nprev=2|js|3/3", explanation: ["index와 logical ID/status가 항상 같은 slide를 가리킵니다.", "3에서 0, 0에서 2로 순환합니다."] },
          experiments: [
            { change: "slides를 0개로 만듭니다.", prediction: "현재 normalize는 modulo zero라 별도 empty guard가 필요합니다.", result: "component initialization에서 total>0을 검증합니다." },
            { change: "transform만 바꾸고 hidden 갱신을 제거합니다.", prediction: "off-screen slides가 accessibility/focus에서 남을 수 있습니다.", result: "visual과 interaction state를 함께 render합니다." },
            { change: "middle slide를 삭제합니다.", prediction: "numeric index가 다른 content를 가리킬 수 있습니다.", result: "logical slide ID 복원 policy를 추가합니다." },
          ],
          sourceRefs: ["web-slider-structure-source", "web-auto-slider-source", "wai-carousel-pattern"],
        },
      ],
      diagnostics: [
        { symptom: "화면은 slide 2인데 thumbnail과 status는 1을 가리킨다.", likelyCause: "transform/active class/text를 서로 다른 handlers에서 갱신하고 canonical index가 없습니다.", checks: ["index, translate, active picker, aria-hidden/status를 한 snapshot에 기록합니다.", "callback/timer/resize가 각각 DOM을 직접 쓰는지 봅니다.", "render entrypoint를 확인합니다."], fix: "모든 sources가 setIndex/transition을 호출하고 render 하나가 파생 UI를 갱신하게 합니다.", prevention: "index↔slide ID↔picker↔status invariant를 every transition E2E로 둡니다." },
      ],
    },
    {
      id: "transform-left-resize-measurement",
      title: "left/top과 transform 중 무엇이 더 빠른지 추측하지 말고 layout·paint·resize correctness를 측정합니다",
      lead: "성능 선택과 state correctness를 함께 봅니다.",
      explanations: [
        "day12 ex03/04는 CSS transform translateX를 쓰고 ex05는 jQuery animate left를 씁니다. transform은 layout flow를 바꾸지 않고 compositor에서 처리될 가능성이 있어 track movement에 유리할 수 있지만 layer/memory/paint 조건을 실제로 profile합니다.",
        "left animation은 positioned element의 layout/paint를 유발할 수 있고 jQuery animate가 numeric CSS interpolation을 관리합니다. simple legacy support에는 편하지만 responsive transform slider와 동일한 API라고 보지 않습니다.",
        "ex05 updateSize는 window.width를 slideWidth와 track width에 쓰며 resize 중 current animation이 old target left로 완료되면 새 width render를 덮을 수 있습니다. resize 시작에서 stop(true,false), measurement, canonical index snap, optional resume를 수행합니다.",
        "container width와 viewport width는 다를 수 있습니다. ResizeObserver로 actual carousel viewport content box를 측정하고 window resize만 신뢰하지 않습니다.",
        "object-fit image dimensions, font/content load와 scrollbar가 measurement를 바꿀 수 있습니다. CSS percentage transform처럼 layout-independent representation을 선호하거나 observer에서 re-render합니다.",
        "transitionend/animation completion은 property와 target token을 확인하고 removed/reduced-motion path에서 event가 없을 수 있으므로 timeout fallback이 아닌 state-driven immediate completion도 설계합니다.",
      ],
      concepts: [
        { term: "layout animation", definition: "left/width처럼 layout 계산과 paint를 유발할 수 있는 properties를 시간에 따라 바꾸는 animation입니다.", detail: ["main-thread 비용을 측정합니다.", "responsive measurement와 결합됩니다."] },
        { term: "transform animation", definition: "element coordinate transform을 보간해 layout flow와 분리할 수 있는 animation입니다.", detail: ["compositor 최적화 가능성이 있습니다.", "accessibility/DOM state는 별도입니다."] },
        { term: "resize reconciliation", definition: "animation을 중단하고 새 viewport measurement에서 canonical state를 다시 render하는 과정입니다.", detail: ["old completion을 무시합니다.", "ResizeObserver를 고려합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "resize 뒤 slider가 slide 사이에 걸리거나 잠시 맞았다가 옛 위치로 돌아간다.", likelyCause: "새 width로 left를 쓴 뒤 old animation callback/target이 완료되어 state를 덮었습니다.", checks: ["resize/animation token과 target width를 기록합니다.", "queue/current animation을 확인합니다.", "window vs carousel width를 비교합니다."], fix: "resize에서 previous transition을 cancel/token invalidation하고 actual container를 재측정한 뒤 canonical index final position을 즉시 render합니다.", prevention: "animation 중 resize, orientation, scrollbar/font/image load E2E를 둡니다." },
      ],
      expertNotes: [
        "Performance panel에서 scripting/style/layout/paint/composite와 frame budget을 representative slide content/device에서 비교합니다.",
        "will-change를 모든 slides에 영구 적용하면 layer memory가 늘 수 있어 측정 없이 사용하지 않습니다.",
      ],
    },
    {
      id: "infinite-clone-slider-identity",
      title: "무한 slider의 clone은 visual continuity용일 뿐 logical slides·IDs·focus·state에 포함하지 않습니다",
      lead: "original index와 track position index를 분리합니다.",
      explanations: [
        "day12 ex05는 original slides 세 개를 통째로 clone해 뒤에 붙이고 index 3의 clone first로 animation한 뒤 left=0으로 snap합니다. logical total은 cloning 전 3을 보존하는 점은 맞습니다.",
        "하지만 clones가 interactive content, id, name, label/ARIA IDREF를 그대로 복사하면 duplicate IDs, tab stops와 screen reader duplicate content가 생깁니다. visual clones는 aria-hidden/inert, focusable descendants 제거와 ID sanitation을 해야 합니다.",
        "canonical index는 0..logicalTotal-1, track position은 clone offset을 포함한 별도 value입니다. status 1/3에 clone을 4/6으로 노출하지 않습니다.",
        "snap은 transition/animation을 잠시 끄고 equivalent original position으로 즉시 이동한 뒤 다음 frame에 transition을 복원합니다. focus가 clone 안에 있다면 corresponding original control로 안전하게 복귀해야 합니다.",
        "DOM clone에 application state를 복사하기보다 slide data와 renderer를 사용하면 original/clone semantics와 dynamic updates가 명확합니다. clone content 자체를 interactive하지 않게 제한하는 것도 방법입니다.",
        "무한 effect가 꼭 필요한지 먼저 판단합니다. bounded previous/next+wrap final state만으로도 사용자 경험이 충분하면 duplicate DOM을 만들지 않는 것이 accessibility/maintenance에 낫습니다.",
      ],
      concepts: [
        { term: "logical index", definition: "사용자에게 제공하는 original slide set 안의 canonical position입니다.", detail: ["clone을 count하지 않습니다.", "status/pickers가 사용합니다."] },
        { term: "track index", definition: "visual continuity를 위해 clone positions까지 포함한 physical track position입니다.", detail: ["snap 때 logical과 달라집니다.", "외부 state로 노출하지 않습니다."] },
        { term: "clone sanitation", definition: "visual clones의 IDs·focusability·ARIA·forms를 제거/변경해 logical duplicate로 노출되지 않게 하는 과정입니다.", detail: ["aria-hidden만으로 focus를 막지 않습니다.", "inert/tabindex와 IDREF를 검사합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "screen reader가 같은 slide를 두 번 읽거나 Tab이 보이지 않는 clone button으로 간다.", likelyCause: "무한 track clones를 visual-only로 숨기지 않고 interactive IDs/focusability를 복제했습니다.", checks: ["duplicate IDs와 accessibility tree/tab order를 검사합니다.", "clone aria-hidden/inert와 descendants tabindex를 봅니다.", "logical total/status에 clones가 포함됐는지 확인합니다."], fix: "clones를 inert/aria-hidden visual artifacts로 sanitize하거나 clone-less wrap 구조로 바꿉니다.", prevention: "duplicate ID, off-screen focus, screen reader slide count E2E를 둡니다." },
      ],
    },
    {
      id: "accessible-carousel-controls-reduced-motion",
      title: "자동 carousel은 사용자가 정지·이동·현재 위치를 이해할 수 있을 때만 허용합니다",
      lead: "모션은 장식이 아니라 시간에 따라 context를 바꾸는 interaction입니다.",
      explanations: [
        "WAI APG는 previous/next buttons와 auto rotation stop/restart button을 요구합니다. rotation control은 rotating content보다 먼저 Tab sequence에 두어 쉽게 찾게 합니다.",
        "keyboard focus가 carousel 안에 들어오면 automatic rotation을 stop하고 user가 명시적으로 restart하기 전 재개하지 않습니다. mouse hover 동안도 stop해 읽을 시간을 보장합니다.",
        "prefers-reduced-motion: reduce이면 auto-start와 spatial sliding을 기본 비활성/즉시 transition으로 바꿉니다. 사용자가 explicit play를 선택할 수 있어도 slow/essential motion과 정책을 분리합니다.",
        "inactive slides가 off-screen일 뿐 accessibility tree에서 살아 있으면 context가 갑자기 바뀔 수 있습니다. active slide만 perceivable/interactive하게 만들고 rotation 중 live announcement를 과도하게 하지 않습니다.",
        "button labels는 '이전 슬라이드', '다음 슬라이드', '자동 재생 중지/시작'처럼 action을 말합니다. picker는 current state를 aria-current 또는 selected tab pattern으로 전달합니다.",
        "images는 content 의미에 맞는 alt를 갖고 decorative duplicates/clones는 empty alt와 hidden policy를 씁니다. 'main photo', 'thumbnail photo' 같은 generic alt는 사용자가 차이를 이해하지 못합니다.",
        "touch swipe를 추가해도 buttons/keyboard를 제거하지 않습니다. swipe threshold, vertical scroll conflict와 pointer cancellation을 test합니다.",
      ],
      concepts: [
        { term: "rotation control", definition: "automatic carousel을 user가 stop/restart하는 button입니다.", detail: ["content보다 먼저 접근 가능해야 합니다.", "현재 action label을 갱신합니다."] },
        { term: "prefers-reduced-motion", definition: "사용자가 non-essential motion 감소를 요청한 media feature입니다.", detail: ["auto-start를 피합니다.", "instant final-state render를 제공합니다."] },
        { term: "perceivable slide", definition: "현재 사용자에게 보이고 읽히며 focus할 수 있는 logical slide입니다.", detail: ["off-screen transform만으로 숨기지 않습니다.", "status와 일치합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "키보드로 carousel을 읽는 중 slide가 자동으로 바뀌어 focus/context가 사라진다.", likelyCause: "focus entry에서 rotation을 stop하지 않고 inactive slides/focus를 관리하지 않았습니다.", checks: ["focusin 중 timer/running state를 봅니다.", "active slide와 focused element identity를 기록합니다.", "rotation control 위치/label을 확인합니다."], fix: "focusin에서 stop하고 explicit play 전 재개하지 않으며 active slide/focus invariants를 유지합니다.", prevention: "keyboard/screen reader auto-rotation E2E와 reduced motion fixture를 둡니다." },
      ],
    },
    {
      id: "thumbnail-gallery-buttons-state",
      title: "썸네일은 click 가능한 img가 아니라 label·pressed/current state를 가진 controls입니다",
      lead: "main image, active visual과 keyboard focus가 같은 logical item을 가리키게 합니다.",
      explanations: [
        "day12 ex06은 thumbnail img에 click listeners를 직접 붙입니다. img는 기본 button keyboard semantics가 없어 Tab/Enter/Space로 선택할 수 없고 cursor:pointer만으로 control이 되지 않습니다.",
        "각 thumbnail image를 button 안에 두고 button label을 '설악산 사진 보기'처럼 action/content로 제공합니다. image alt는 button label과 중복 verbosity를 피하도록 context에 맞춥니다.",
        "canonical gallery index에서 main src/alt/caption, active class와 aria-pressed/current를 함께 render합니다. clicked DOM src를 그대로 source of truth로 쓰지 않고 validated items data를 사용합니다.",
        "현재 thumbnail border만으로 state를 전달하지 않고 aria-pressed=true 또는 carousel picker pattern을 사용합니다. focus ring은 active border와 별개로 충분히 보여야 합니다.",
        "main image load 실패·slow load에서 previous content, pending/error status와 image dimensions를 관리합니다. external URL을 style/HTML string으로 넣지 않고 validated src property를 사용합니다.",
        "Arrow key roving pattern을 쓰려면 APG pattern을 선택하고 구현합니다. 단순 button group이면 Tab/Shift+Tab native sequence와 activation만으로도 충분할 수 있어 불필요한 custom keyboard를 만들지 않습니다.",
      ],
      concepts: [
        { term: "thumbnail control", definition: "특정 gallery item을 선택하는 semantic button/picker입니다.", detail: ["keyboard activation을 제공합니다.", "현재 state를 전달합니다."] },
        { term: "gallery item model", definition: "src·alt·caption·ID를 가진 validated data record로 main/thumbnail UI의 source of truth입니다.", detail: ["DOM src를 역으로 읽지 않습니다.", "preload/error를 관리합니다."] },
        { term: "pressed/current state", definition: "button 또는 picker가 현재 logical item을 가리킴을 assistive technology에 전달하는 state입니다.", detail: ["visual border와 함께 씁니다.", "pattern에 맞는 ARIA를 선택합니다."] },
      ],
      codeExamples: [
        {
          id: "accessible-thumbnail-gallery-state",
          title: "thumbnail button activation으로 main image와 pressed state를 동기화합니다",
          language: "html",
          filename: "accessible-thumbnail-gallery.html",
          purpose: "실제 image network 없이 data model에서 main attributes와 three button states를 exact output으로 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>thumbnail gallery</title></head><body>
<img id="main" src="photo-1.jpg" alt="봄 숲길"><div id="thumbs" aria-label="사진 선택">
  <button id="thumb-1" data-index="0" aria-pressed="true">봄 숲길</button>
  <button id="thumb-2" data-index="1" aria-pressed="false">여름 계곡</button>
  <button id="thumb-3" data-index="2" aria-pressed="false">가을 단풍</button>
</div><pre id="out"></pre><script>
  const items = [
    { src: "photo-1.jpg", alt: "봄 숲길" },
    { src: "photo-2.jpg", alt: "여름 계곡" },
    { src: "photo-3.jpg", alt: "가을 단풍" }
  ];
  const buttons = [...document.querySelectorAll("#thumbs button")];
  let index = 0;
  function render(next) {
    index = next;
    const main = document.querySelector("#main");
    main.setAttribute("src", items[index].src);
    main.alt = items[index].alt;
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  }
  buttons.forEach(button => button.addEventListener("click", () => render(Number(button.dataset.index))));
  buttons[1].click();
  document.querySelector("#out").textContent = [
    "current=" + (index + 1) + "/" + items.length,
    "main=" + document.querySelector("#main").getAttribute("src") + "|" + document.querySelector("#main").alt,
    "pressed=" + buttons.map(button => button.getAttribute("aria-pressed")).join("|")
  ].join("\n");
</script></body></html>`,
          walkthrough: [
            { lines: "4-8", explanation: "generic clickable images 대신 labels와 aria-pressed가 있는 native buttons를 둡니다." },
            { lines: "10-24", explanation: "validated items data와 canonical index에서 main src/alt와 all pressed states를 render합니다." },
            { lines: "25-31", explanation: "둘째 button의 native click activation 뒤 logical/current attributes를 출력합니다." },
          ],
          run: { environment: ["modern browser"], command: "accessible-thumbnail-gallery.html을 열고 #out 확인" },
          output: { value: "current=2/3\nmain=photo-2.jpg|여름 계곡\npressed=false|true|false", explanation: ["둘째 logical item이 main image와 status가 됩니다.", "세 buttons 중 둘째만 pressed=true입니다."] },
          experiments: [
            { change: "button을 img로 되돌립니다.", prediction: "native Tab/Enter/Space button behavior와 pressed state가 사라집니다.", result: "cursor:pointer는 semantics가 아닙니다." },
            { change: "items[1].src를 invalid protocol/external value로 바꿉니다.", prediction: "property가 request를 시도할 수 있습니다.", result: "allowed media URL/provenance와 error state를 검증합니다." },
            { change: "visual active class만 갱신하고 aria-pressed를 제거합니다.", prediction: "screen reader가 current thumbnail을 알기 어렵습니다.", result: "visual/accessibility state를 함께 render합니다." },
          ],
          sourceRefs: ["web-thumbnail-gallery-source", "wai-carousel-pattern", "wai-image-alt-tutorial", "html-button-standard", "web-infinite-clone-slider-source", "css-transforms-standard"],
        },
      ],
      diagnostics: [
        { symptom: "mouse로 thumbnail은 바뀌지만 keyboard와 screen reader에서는 선택할 수 없다.", likelyCause: "img에 click/cursor만 붙이고 button semantics·label·current state를 제공하지 않았습니다.", checks: ["Tab order, Enter/Space activation과 accessibility tree role/name/state를 봅니다.", "alt/title이 모두 generic인지 확인합니다.", "active border 외 state가 있는지 봅니다."], fix: "thumbnail을 native button/picker로 만들고 item-specific label과 pressed/current state를 render합니다.", prevention: "mouse/keyboard/touch/screen reader gallery E2E를 둡니다." },
      ],
    },
    {
      id: "testing-performance-modern-migration",
      title: "효과·carousel은 fake-clock state test와 실제 browser motion·성능·접근성 test를 나눠 검증합니다",
      lead: "시간을 기다리는 flaky test 대신 pure controller를 먼저 고정하고 실제 rendering은 최소 E2E로 확인합니다.",
      explanations: [
        "index normalization, rotation policy, captured target과 timer scheduling은 fake clock/pure state tests로 즉시 검증합니다. animation frame pixel exact snapshot은 browser/environment에 따라 흔들릴 수 있습니다.",
        "실제 browser E2E는 rapid click, stop matrix, transitionend/completion, resize during motion, visibility hidden, reduced motion, focus/hover pause, clone focus와 image load/error를 다룹니다.",
        "performance는 left versus transform을 같은 content/device에서 frame time, style/layout/paint/composite, layer memory와 input latency로 비교합니다. transform이 항상 빠르다는 slogan으로 결정하지 않습니다.",
        "jQuery effects를 CSS transition/Web Animations로 옮길 때 queue semantics는 자동 제공되지 않습니다. animation object의 cancel/finish, finished promise와 canonical state controller를 명시합니다.",
        "CSS transition은 class/state와 prefers-reduced-motion media query를 자연스럽게 결합하지만 transitionend가 property별 여러 번 발생하거나 no-change/reduced path에서 발생하지 않을 수 있습니다. token/fallback finalization을 설계합니다.",
        "telemetry는 slide content나 image URL 전체보다 rotation running/source, index/total, transition duration, cancel/queue length, reduced preference와 error code를 privacy-safe하게 기록합니다.",
        "자동 carousel 자체가 content 이해를 방해하거나 engagement 가치가 낮다면 제거가 최고의 성능·접근성 개선일 수 있습니다. product metric과 user research로 정당화합니다.",
      ],
      concepts: [
        { term: "fake clock", definition: "timer 시간을 test가 수동으로 진행해 interval/timeout state를 빠르고 결정적으로 검증하는 도구입니다.", detail: ["overlap/cleanup을 test합니다.", "실제 rendering E2E를 대체하지 않습니다."] },
        { term: "motion E2E", definition: "실제 supported browser에서 animation·focus·visibility·media query·resize를 함께 검증하는 test입니다.", detail: ["pixel 중간값보다 invariants를 봅니다.", "representative device를 포함합니다."] },
        { term: "animation controller", definition: "jQuery/CSS/Web Animations 구현과 분리해 canonical state, cancellation, timers와 lifecycle을 소유하는 layer입니다.", detail: ["migration을 쉽게 합니다.", "효과 API를 교체할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "animation tests가 CI마다 중간 pixel 값 차이로 실패한다.", likelyCause: "실제 timer/frame scheduling의 intermediate geometry를 exact snapshot으로 고정했습니다.", checks: ["assertion이 final state/controller state인지 봅니다.", "reduced/background/CPU conditions를 확인합니다.", "fake clock과 browser E2E 역할을 분리합니다."], fix: "pure state/fake-clock exact tests와 final invariant E2E를 사용하고 중간 motion은 tolerance/performance trace로 검증합니다.", prevention: "test pyramid와 supported browser timing budget을 문서화합니다." },
      ],
      comparisons: [
        { title: "slider movement 구현 선택", options: [
          { name: "jQuery animate left", chooseWhen: "기존 full-jQuery legacy component와 fx queue behavior를 유지할 때", avoidWhen: "responsive high-frequency carousel을 새로 만들 때", tradeoffs: ["legacy callback/queue와 통합됩니다.", "layout/resize/cancellation 비용을 소유합니다."] },
          { name: "CSS transform transition", chooseWhen: "class/state-driven responsive track와 reduced-motion media query가 필요할 때", avoidWhen: "complex imperative sequence와 completion control이 핵심일 때", tradeoffs: ["compositor 최적화 가능성이 있습니다.", "transitionend/no-event paths를 처리합니다."] },
          { name: "Web Animations API", chooseWhen: "imperative cancel/finish/playbackRate와 finished promise가 필요할 때", avoidWhen: "단순 instant/state class로 충분할 때", tradeoffs: ["Animation object control이 명확합니다.", "controller와 compatibility를 설계해야 합니다."] },
        ] },
      ],
      expertNotes: [
        "CLS, INP와 frame budget을 carousel 자체의 가치를 포함해 평가하고 autoplay가 conversion보다 distraction을 늘리는지도 측정합니다.",
        "animation cancellation은 visual target뿐 아니라 completion side effects, live announcements, timers와 preload/network work까지 함께 취소해야 합니다.",
      ],
    },
  ],
  lab: {
    title: "queue-safe·reduced-motion·접근 가능한 학습 과정 carousel",
    scenario: "10개 원본의 effects와 slider를 하나의 과정 carousel로 통합합니다. 빠른 manual 입력, auto rotation, resize와 route unmount에서도 index·queue·focus·announcement가 일치해야 합니다.",
    setup: [
      "course ID·title·image src/alt·description을 가진 validated slide data와 0/1/3/large fixtures를 준비합니다.",
      "canonical index, rotation preference, running/transition token, timer ID와 disposer를 controller state로 만듭니다.",
      "previous/next, picker, rotation button, status와 semantic slide containers를 APG contract에 맞게 구성합니다.",
      "jQuery full build effects mode와 CSS transform mode를 같은 controller 뒤 adapter로 둡니다.",
    ],
    steps: [
      "show/fade/slide final-state example과 full/slim method smoke test를 실행합니다.",
      "fx queue length와 stop/finish 네 조합을 instrument하고 latest/sequential input policy를 선택합니다.",
      "queued callbacks가 immutable target/token을 capture하게 고치고 stale completion을 무시합니다.",
      "normalizeIndex와 render가 slide hidden/inert, transform, pickers, status를 한 번에 갱신하게 합니다.",
      "auto rotation은 reduced motion에서 시작하지 않고 focus/hover/visibility에서 pause하며 explicit restart를 제공합니다.",
      "animation duration보다 tick이 빨라지는 fixture에서 overlap을 skip/replace하고 backlog를 만들지 않습니다.",
      "ResizeObserver에서 current transition을 invalidate하고 actual viewport를 재측정해 canonical position으로 snap합니다.",
      "infinite clone mode를 켜면 logical/track index를 분리하고 clones의 IDs·focus·ARIA를 sanitize합니다.",
      "thumbnail buttons로 main image src/alt/pressed state를 data-driven render합니다.",
      "rapid click, resize mid-motion, hidden tab, remount, keyboard/screen reader와 image error를 실제 browser에서 검증합니다.",
    ],
    expectedResult: [
      "queue backlog가 policy maximum을 넘지 않고 stop/replace 뒤 stale callback이 state를 덮지 않습니다.",
      "index·logical slide ID·track position·picker·status·active accessibility state가 모든 transition에서 일치합니다.",
      "reduced-motion 사용자는 autoplay/spatial motion 없이 같은 content와 controls를 사용할 수 있습니다.",
      "focus/hover 중 auto rotation이 멈추고 user explicit restart 전 focus stop은 자동 재개되지 않습니다.",
      "clones가 logical slide count·tab order·accessibility tree·IDs를 중복하지 않습니다.",
      "component dispose 뒤 timer, queue, resize observer, event와 completion side effect가 남지 않습니다.",
    ],
    cleanup: ["interval/timeout을 clear하고 effects queue를 policy에 맞게 stop/clear합니다.", "ResizeObserver/events/preload와 clones를 dispose하고 focus를 safe owner로 복귀합니다."],
    extensions: [
      "Web Animations adapter를 추가해 cancel/finish/finished promise semantics를 비교합니다.",
      "touch swipe와 pointer cancellation을 추가하되 buttons/keyboard path를 유지합니다.",
      "image decode/preload와 network failure fallback, LCP/CLS impact를 측정합니다.",
      "autoplay 제거 A/B와 user research를 통해 carousel 존재 가치를 평가합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "10개 원본의 effects·queue·timer·slider 동작을 감사하고 여섯 exact examples를 재현하세요.", requirements: ["show/fade/slide final states를 비교합니다.", "stop matrix와 captured target results를 설명합니다.", "rotation policy와 canonical wrap sequence를 재현합니다.", "thumbnail main/pressed state를 맞춥니다.", "원본별 빠진 pause/accessibility/dispose를 기록합니다."], hints: ["인수 없는 stop은 queue 전체 취소가 아닙니다.", "transform 값을 current index로 다시 읽지 마세요."], expectedOutcome: "effect API 결과와 controller state를 분리하고 원본 범위를 정확히 설명합니다.", solutionOutline: ["각 file에 current state, pending work, input, cleanup columns를 추가합니다.", "모션 없이 pure state를 먼저 test합니다."] },
    { difficulty: "응용", prompt: "원본 ex07/ex01의 queue 폭주와 mutable callback bug를 latest-intent transition으로 교정하세요.", requirements: ["rapid alternating 20-click fixture를 만듭니다.", "stop clear/jump policy를 선택하고 근거를 적습니다.", "immutable target/token을 capture합니다.", "stale completion·alert를 제거하고 status를 동기화합니다.", "queue length·input latency budget을 검증합니다."], hints: ["latest target을 state에 먼저 저장하세요.", "중간 CSS를 final state로 오해하지 마세요."], expectedOutcome: "빠른 입력을 멈추면 UI가 latest intent에 빠르게 수렴하고 delayed feedback이 없습니다.", solutionOutline: ["old transition invalidate→state set→adapter start→tokened completion 순서를 사용합니다.", "stop matrix test를 회귀에 포함합니다."] },
    { difficulty: "설계", prompt: "clone-free 또는 sanitized infinite accessible carousel을 production 수준으로 설계하세요.", requirements: ["canonical/logical/track index와 0/1/N state를 정의합니다.", "autoplay control·focus/hover/visibility·reduced motion policy를 포함합니다.", "resize/image load/transition cancellation과 timer disposer를 설계합니다.", "inactive/clone slide focus·IDs·ARIA·alt와 thumbnail semantics를 검증합니다.", "jQuery/CSS/WAAPI adapter tradeoff, performance/user metric과 rollback을 정합니다."], hints: ["무한 illusion이 정말 필요한지도 결정하세요.", "aria-hidden만으로 focusable clone을 막을 수 없습니다."], expectedOutcome: "모션 구현을 교체할 수 있고 사용자 제어·접근성·lifecycle이 보장되는 carousel architecture가 완성됩니다.", solutionOutline: ["pure controller와 view adapter를 먼저 분리합니다.", "fake clock state tests와 real browser motion E2E를 나눕니다."] },
  ],
  reviewQuestions: [
    { question: "jQuery slim build에서 effects를 당연히 사용할 수 있나요?", answer: "아닙니다. build variant에 따라 effects가 빠지므로 full build와 required methods를 확인합니다." },
    { question: "hide/show와 fade/slide는 같은 property를 animation하나요?", answer: "아닙니다. hide/show는 dimensions+opacity, fade는 opacity, slide는 vertical dimensions/display 중심입니다." },
    { question: "같은 element에 animate를 연속 호출하면 모두 동시에 시작하나요?", answer: "기본적으로 첫 animation이 시작되고 나머지는 element의 fx queue에서 순차 실행됩니다." },
    { question: ".stop() 기본 호출은 queued animations도 모두 지우나요?", answer: "아닙니다. current를 중단하고 queue의 next가 시작될 수 있습니다." },
    { question: "stop의 clearQueue와 jumpToEnd는 무엇을 각각 제어하나요?", answer: "clearQueue는 pending work 제거, jumpToEnd는 current target/callback 즉시 완료를 제어합니다." },
    { question: ".finish()와 .stop(true,true)는 완전히 같은가요?", answer: "아닙니다. finish는 queued animations의 final values/completions까지 즉시 처리합니다." },
    { question: "queued callback에서 shared isBig을 읽으면 왜 틀릴 수 있나요?", answer: "callback 실행 전 나중 inputs가 state를 바꿔 해당 animation target과 다른 최신 값을 읽을 수 있기 때문입니다." },
    { question: "setInterval은 이전 animation 완료를 기다리나요?", answer: "아닙니다. overlap/lock/schedule-after-completion 정책을 controller가 구현해야 합니다." },
    { question: "hidden tab에서 돌아올 때 missed ticks를 모두 재생해야 하나요?", answer: "보통 backlog를 버리고 current state에서 one next schedule을 만들며 제품 정책을 명시합니다." },
    { question: "slider current state를 transform string에서 읽어도 되나요?", answer: "아닙니다. canonical index에서 transform과 모든 UI를 파생합니다." },
    { question: "off-screen transform이면 inactive slide가 접근성 tree와 Tab에서 사라지나요?", answer: "아닙니다. hidden/inert/focusability와 APG pattern을 별도 적용해야 합니다." },
    { question: "left보다 transform이 항상 빠른가요?", answer: "항상이라고 단정할 수 없으며 content/device에서 layout/paint/composite/layer memory를 측정합니다." },
    { question: "infinite slider clones를 logical total에 포함하나요?", answer: "아닙니다. clones는 visual artifacts이고 logical index/status는 originals만 셉니다." },
    { question: "aria-hidden=true만 주면 clone 안 buttons도 Tab에서 사라지나요?", answer: "아닙니다. inert/tabindex/structure로 focusability도 제거해야 합니다." },
    { question: "auto carousel이 focus를 받으면 언제 재개하나요?", answer: "focus 진입에서 stop하고 사용자가 rotation control로 명시 restart하기 전 자동 재개하지 않는 것이 APG 기준입니다." },
    { question: "prefers-reduced-motion 사용자는 content를 못 보게 해야 하나요?", answer: "아닙니다. autoplay/spatial motion만 줄이고 같은 content와 manual controls/final states를 제공합니다." },
    { question: "thumbnail img에 click과 cursor:pointer를 붙이면 button인가요?", answer: "아닙니다. native button semantics, keyboard activation, label과 current state가 필요합니다." },
  ],
  completionChecklist: [
    "inventory 8개와 재귀속 2개, 총 10개 source의 실제 execution을 감사했다.",
    "full/slim build와 show/fade/slide/animate method availability를 확인했다.",
    "effect families의 layout·opacity·display·focus 결과를 구분했다.",
    "element별 fx queue, completion callback와 custom queue next/dequeue를 설명했다.",
    "rapid input queue backlog를 측정하고 latest/sequential policy를 정했다.",
    "stop clearQueue/jumpToEnd 네 조합과 finish 차이를 exact output으로 검증했다.",
    "queued callback이 immutable target/token을 capture하고 stale completion을 무시했다.",
    "timer·animation overlap, visibility pause와 mount/dispose cleanup을 구현했다.",
    "canonical index와 render로 transform·hidden·picker·status를 동기화했다.",
    "0/1/N, next/previous wrap와 dynamic slide identity를 처리했다.",
    "left/transform 성능과 resize mid-animation correctness를 실제 browser로 측정했다.",
    "logical/track index를 분리하고 visual clones의 IDs·focus·ARIA를 sanitize했다.",
    "auto rotation stop/restart, focus/hover pause와 current announcement를 제공했다.",
    "prefers-reduced-motion에서 auto-start와 non-essential motion을 줄였다.",
    "images와 thumbnail buttons에 item-specific accessible names/current state를 제공했다.",
    "fake-clock controller tests와 real browser motion/accessibility/performance E2E를 분리했다.",
  ],
  nextSessions: ["jquery-06-ajax-modern-migration"],
  sources: [
    { id: "web-jquery-show-hide-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day11/ex04_jquery.html", usedFor: ["hide/show/toggle", "1200ms duration", "dimensions/opacity", "button controls", "missing cancellation"], evidence: "bear image의 세 basic effects를 final visibility와 layout/focus contract로 확장했습니다." },
    { id: "web-jquery-fade-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day11/ex05_jquery.html", usedFor: ["fadeIn/fadeOut/fadeToggle", "opacity", "display final state", "button controls"], evidence: "opacity-centered effect family와 intermediate interaction state를 비교하는 근거입니다." },
    { id: "web-jquery-slide-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day11/ex06_jquery.html", usedFor: ["slideUp/slideDown/slideToggle", "height", "disclosure motion", "button controls"], evidence: "vertical effect를 semantic expanded/hidden state와 결합하는 출발점입니다." },
    { id: "web-jquery-animate-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day11/ex07_jquery.html", usedFor: ["animate width/height", "duration", "complete callback", "isBig toggle", "rapid queue", "mutable callback state"], evidence: "3초 toggle queue와 mutable isBig completion message를 captured target/token 진단으로 교정했습니다." },
    { id: "web-jquery-stop-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex01_jquery.html", usedFor: ["relative left animation", "rapid direction queue", "stop without arguments", "intermediate state"], evidence: "앞 세션에서 재귀속해 stop matrix와 전체 cancel 오해의 실제 근거로 사용했습니다." },
    { id: "web-jquery-news-ticker-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex02_jquery.html", usedFor: ["setInterval", "animation completion callback", "text replacement", "two-stage ticker", "index wrap", "missing pause/dispose"], evidence: "timer와 animation overlap·visibility·announcement lifecycle로 재구성했습니다." },
    { id: "web-slider-structure-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex03_slider.html", usedFor: ["overflow window", "flex track", "translateX percent", "goTo index", "inline controls", "debug overflow"], evidence: "visual track 원리를 canonical index/render와 accessible controls의 기반으로 사용했습니다." },
    { id: "web-auto-slider-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex04_slider.html", usedFor: ["auto transform slider", "setInterval", "modulo index", "image slides", "missing controls/alt"], evidence: "automatic rotation controller·pause·reduced motion과 APG carousel contract로 확장했습니다." },
    { id: "web-infinite-clone-slider-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex05_slider.html", usedFor: ["clone track", "logical total", "left animate", "reset snap", "resize update", "interval", "queue overlap"], evidence: "logical/track index, clone sanitation, resize cancellation과 disposal 진단의 중심 source입니다." },
    { id: "web-thumbnail-gallery-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day12/ex06_slider.html", usedFor: ["main image", "thumbnail NodeList", "click selection", "active class", "src synchronization", "generic alt/title"], evidence: "native thumbnail buttons·item model·pressed/current state와 meaningful alt로 교정했습니다." },
    { id: "jquery-effects-basic-api", repository: "OpenJS Foundation jQuery API", path: "show/hide/fade/slide effects", publicUrl: "https://api.jquery.com/show/", usedFor: ["duration/easing/callback", "display restoration", "effect properties", "queue behavior", "final state"], evidence: "세 basic effect families의 공식 behavior와 completion contract 기준입니다." },
    { id: "jquery-animate-api", repository: "OpenJS Foundation jQuery API", path: ".animate()", publicUrl: "https://api.jquery.com/animate/", usedFor: ["properties/duration/easing", "queue option", "complete/progress/step", "custom queue", "relative values"], evidence: "원본 animate를 target/callback/controller와 modern migration 관점으로 보강했습니다." },
    { id: "jquery-queue-api", repository: "OpenJS Foundation jQuery API", path: ".queue()", publicUrl: "https://api.jquery.com/queue/", usedFor: ["fx queue", "element-specific sequence", "queue length", "custom queue", "next/dequeue"], evidence: "빠른 input backlog와 captured-state exact examples의 공식 기준입니다." },
    { id: "jquery-stop-api", repository: "OpenJS Foundation jQuery API", path: ".stop()", publicUrl: "https://api.jquery.com/stop/", usedFor: ["clearQueue", "jumpToEnd", "intermediate state", "callback rules", "next queue behavior"], evidence: "stop four-state matrix와 원본 no-argument stop 교정 기준입니다." },
    { id: "jquery-finish-api", repository: "OpenJS Foundation jQuery API", path: ".finish()", publicUrl: "https://api.jquery.com/finish/", usedFor: ["current/queued completion", "last target", "callback effects", "$.fx.off", "stop contrast"], evidence: "queue finalization과 deterministic/reduced-motion fixture의 기준입니다." },
    { id: "jquery-download-builds", repository: "OpenJS Foundation jQuery", path: "download build variants", publicUrl: "https://jquery.com/download/", usedFor: ["full/slim effects availability", "dependency selection", "migration"], evidence: "effects runtime availability를 build contract로 명시하는 근거입니다." },
    { id: "wai-carousel-pattern", repository: "W3C WAI-ARIA Authoring Practices", path: "carousel pattern", publicUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/", usedFor: ["previous/next", "rotation control", "focus/hover stop", "keyboard", "slide picker", "off-screen accessibility"], evidence: "자동 slider의 사용자 제어와 perceivable context를 설계하는 공식 pattern입니다." },
    { id: "media-reduced-motion", repository: "W3C CSS Working Group", path: "prefers-reduced-motion", publicUrl: "https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion", usedFor: ["user motion preference", "auto-start policy", "instant transition", "testing"], evidence: "non-essential autoplay/spatial motion을 줄이는 platform preference 기준입니다." },
    { id: "css-transforms-standard", repository: "W3C CSS Working Group", path: "CSS Transforms", publicUrl: "https://drafts.csswg.org/css-transforms-2/", usedFor: ["translate track", "coordinate transform", "layout separation", "performance measurement"], evidence: "left animation과 transform track의 platform model을 비교하는 기준입니다." },
    { id: "html-timers-visibility", repository: "WHATWG HTML Standard", path: "timers and page visibility integration", publicUrl: "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers", usedFor: ["setInterval scheduling", "timer resource", "background behavior", "cleanup"], evidence: "ticker/autoplay가 animation completion을 기다리지 않는 timer lifecycle의 기준입니다." },
    { id: "wai-image-alt-tutorial", repository: "W3C Web Accessibility Initiative", path: "images concepts", publicUrl: "https://www.w3.org/WAI/tutorials/images/", usedFor: ["meaningful image alternatives", "decorative clones", "thumbnail context", "generic alt correction"], evidence: "원본 generic/empty alt를 slide content 목적에 맞게 교정하는 기준입니다." },
    { id: "html-button-standard", repository: "WHATWG HTML Standard", path: "button element", publicUrl: "https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element", usedFor: ["thumbnail controls", "keyboard activation", "labels", "focus"], evidence: "clickable img를 native button controls로 옮기는 platform 기준입니다." },
  ],
  sourceCoverage: {
    filesRead: 10,
    filesUsed: 10,
    uncoveredNotes: [
      "inventory의 8개 files를 모두 사용했고 jquery-04에서 실제 내용이 effects라 재귀속한 day12/ex01과 ex02도 이번 세션에 포함해 총 10개를 감사했습니다.",
      "원본은 basic effects부터 clone slider까지 풍부하지만 queue stop matrix, captured callback target, timer/visibility/dispose, reduced motion과 accessible carousel contract를 체계화하지 않아 공식 API/표준으로 보강했습니다.",
      "ex05 clone slider의 responsive width/queue/clone focus-ID 문제와 ex06 clickable img/generic alt를 production diagnostic과 accessible data-driven controls로 교정했습니다.",
      "transform versus left는 일반론으로 단정하지 않고 representative browser profile·resize correctness·layer memory를 측정하도록 보강했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
