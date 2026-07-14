import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["jquery-04-events-validation"],
  slug: "jquery-04-events-validation",
  courseId: "javascript",
  moduleId: "02-jquery-legacy-migration",
  order: 4,
  title: "jQuery 이벤트와 실시간 폼 검증",
  subtitle: "직접·위임 event lifecycle과 IME를 이해하고, 한 validation contract를 입력·제출·접근성·서버 오류에 일관되게 적용합니다.",
  level: "중급",
  estimatedMinutes: 390,
  coreQuestion: "동적으로 바뀌는 화면과 한국어 입력에서도 이벤트가 중복·누락되지 않고, 같은 검증 규칙이 실시간 UI·폼 제출·접근성·서버 응답에서 일치하게 하려면 어떻게 설계해야 할까요?",
  summary: "inventory가 연결한 네 원본을 모두 감사했지만 실제 이벤트·폼 검증 근거는 day11 ex01/ex02 두 파일입니다. day12 ex01은 animate/stop, day12 ex02는 setInterval과 animation callback 뉴스 ticker라 다음 효과 세션으로 재귀속하며, 이번 세션의 event/form source로 과장하지 않습니다. day11 ex01은 hover image, password keyup, 주소 change, radio change를 실제 실행하지만 hover는 3.3부터 deprecated이고 pointer-only image에 accessible name/control이 없으며 keyup마다 alert·focus·값 삭제를 반복합니다. day11 ex02는 keyup/blur/change/one/submit을 폭넓게 보여 주지만 submit의 username < 2가 string numeric coercion을 일으켜 '가'를 통과시키고, email includes 검사·empty password equality·password trim·msg_or 오타·attr('class') 전체 덮기·최초 focus에서 textarea 삭제·항상 preventDefault 등 결함이 있습니다. 무엇보다 controls에 id만 있고 name이 없어 FormData/POST entry가 0개입니다. 이를 jQuery Event wrapper의 target/currentTarget/delegateTarget, 직접/위임 .on, namespace .off, element·event type별 .one, input/change/focusout/submit 선택, IME isComposing/compositionend, debounce·AbortController/latest-response, pure validator, HTML constraint validation·ValidityState·setCustomValidity, accessible field message/error summary/focus, FormData와 server validation 경계로 재구성합니다. inventory가 요구한 동적 목록 위임은 원본에 없음을 밝히고 공식 .on contract를 바탕으로 별도 보강 example로 제공합니다. 모든 code는 입력값을 지우거나 alert loop를 만들지 않고, submit 때 첫 오류에 한 번만 focus하며, server가 최종 보안·업무 검증을 소유합니다.",
  objectives: [
    "browser event의 target·bubble·default action과 jQuery Event wrapper/originalEvent를 설명할 수 있다.",
    ".on()의 직접·위임 binding과 target/currentTarget/delegateTarget/this를 동적 descendant에서 구분할 수 있다.",
    "event namespace와 .off()로 component handler만 정리하고 중복 mount·leak을 막을 수 있다.",
    ".one()이 element별·event type별 최대 한 번이라는 정확한 계약을 적용할 수 있다.",
    "keyup 대신 input·change·focusout·submit을 입력 방식과 검증 시점에 맞게 선택하고 IME composition을 처리할 수 있다.",
    "실시간과 submit에서 같은 pure validation rules를 재사용하고 HTML ValidityState와 함께 사용할 수 있다.",
    "aria-describedby·aria-invalid·live region·error summary·first-error focus로 접근 가능한 오류 feedback을 만들 수 있다.",
    "name/FormData·requestSubmit/form.submit 차이와 client/server validation·async race·보안 경계를 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "jQuery class·property·폼 상태", reason: "검증 결과를 current value/property, state class, ARIA와 FormData에 일관되게 반영하는 기반입니다.", sessionSlug: "jquery-03-style-attributes-form-state" },
    { title: "JavaScript event model", reason: "capturing·target·bubbling·default action과 listener identity를 jQuery wrapper/위임 API에 연결합니다.", sessionSlug: "js-03-event-model-listeners" },
    { title: "HTML 폼 validation", reason: "required/type/pattern/minlength, ValidityState, submit과 successful controls를 custom rules와 중복 구현하지 않기 위한 기반입니다.", sessionSlug: "html-08-form-controls-validation" },
  ],
  keywords: ["jQuery events", "on", "off", "one", "event delegation", "namespace", "target", "currentTarget", "delegateTarget", "input", "change", "focusout", "submit", "preventDefault", "IME", "compositionend", "isComposing", "debounce", "validation", "ValidityState", "setCustomValidity", "FormData", "requestSubmit", "aria-invalid", "error summary", "server validation"],
  chapters: [
    {
      id: "source-audit-scope-correction",
      title: "인벤토리의 경로도 실제 내용을 읽어 검증하고 잘못 귀속된 원본은 정직하게 재배치합니다",
      lead: "파일 이름이나 inventory 설명보다 실행 code를 source of truth로 삼습니다.",
      explanations: [
        "day11 ex01은 hover, keyup, change와 radio interaction을 실제 실행합니다. event type 선택과 current value update를 배우기 좋지만 pointer-only hover, alert/focus/value deletion, .html error message와 programmatic .val/change 경계를 교정해야 합니다.",
        "day11 ex02는 username/email/password/job/intro와 submit을 한 page에 모아 실시간·submit validation rule drift를 관찰하기 좋습니다. 그러나 모든 controls에 name이 없고 id만 있어 실제 form payload가 비어 있습니다.",
        "inventory가 함께 지정한 day12 ex01은 buttons의 click으로 animate queue를 만들고 box click으로 stop합니다. click binding 일부가 있어도 학습 핵심은 effect queue/cancellation이므로 jquery-05로 넘깁니다.",
        "day12 ex02는 setInterval과 animation completion callback으로 news text를 교체합니다. DOM event/form validation을 다루지 않으므로 역시 jquery-05 source로 재귀속합니다.",
        "inventory exercise의 dynamic list deletion delegation은 네 원본 어디에도 없습니다. 공식 jQuery .on delegation contract와 앞 세션의 dynamic insertion을 결합한 보강 example임을 명시하며 원본 evidence라고 쓰지 않습니다.",
        "이런 provenance correction은 source coverage를 낮추는 실패가 아니라 잘못된 주장과 중복 설명을 막는 품질 작업입니다. filesRead는 4, 이번 세션 filesUsed는 2로 기록하고 다음 세션에서 나머지 둘을 사용합니다.",
      ],
      concepts: [
        { term: "source attribution", definition: "어떤 원본이 어떤 개념·실행 결과를 실제로 제공했는지 기록하는 provenance 계약입니다.", detail: ["comment/title과 실행을 구분합니다.", "잘못 배정된 source는 재귀속합니다."] },
        { term: "scope boundary", definition: "이번 세션이 깊이 다룰 핵심과 후속 세션으로 넘길 내용을 나누는 경계입니다.", detail: ["event/form과 effect queue를 분리합니다.", "누락이 아니라 명시적 후속 연결입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "커리큘럼에는 동적 목록 위임 원본이라고 적혀 있지만 해당 파일에 code가 없다.", likelyCause: "inventory 설명을 실제 source audit 없이 사실로 사용했습니다.", checks: ["연결된 모든 파일의 executable lines를 읽습니다.", "comment-only/fixture/execution을 구분합니다.", "다른 세션과 실제 내용 중복을 확인합니다."], fix: "공식 API 기반 보강 example로 명시하고 잘못 배정된 files를 실제 주제 세션으로 재귀속합니다.", prevention: "filesRead/filesUsed/uncoveredNotes와 source evidence를 session마다 검증합니다." },
      ],
    },
    {
      id: "event-flow-jquery-wrapper-default-action",
      title: "jQuery Event는 native event 흐름을 감싸며 target·bubble·default action을 없애지 않습니다",
      lead: "handler가 호출됐다는 사실과 browser 기본 동작이 취소됐다는 사실을 구분합니다.",
      explanations: [
        "browser event는 deepest target에서 발생하고 대부분 ancestors로 bubble합니다. jQuery는 normalized event object를 handler에 전달하며 원래 native object는 event.originalEvent에서 볼 수 있습니다.",
        "event.target은 최초 발생한 deepest node이고 직접 handler의 this/currentTarget은 handler를 전달받는 element입니다. descendant icon을 누르면 target은 span/svg일 수 있어 target.closest 범위를 잘못 잡기 쉽습니다.",
        "event.preventDefault는 link navigation·form submission 같은 cancelable default action만 취소합니다. bubbling을 멈추지 않으며 stopPropagation은 반대로 propagation만 멈추고 default를 취소하지 않습니다.",
        "return false는 jQuery에서 preventDefault와 stopPropagation을 함께 수행하는 shorthand라 의도가 숨습니다. 두 동작 중 필요한 것만 명시적으로 호출합니다.",
        "submit은 submit button click뿐 아니라 Enter, requestSubmit, accessibility activation 등 여러 경로로 발생합니다. click handler가 아니라 form submit event에서 최종 validation을 수행합니다.",
        "day11 ex02는 항상 preventDefault해 demo page 이동은 막지만 성공 submission path가 없습니다. 실제 product에서는 invalid일 때만 막고 valid data를 controlled fetch/native submission 중 하나로 보냅니다.",
      ],
      concepts: [
        { term: "jQuery Event", definition: "browser event를 정규화해 jQuery handler에 전달하는 wrapper입니다.", detail: ["originalEvent로 native object를 봅니다.", "target/default/bubble semantics를 유지합니다."] },
        { term: "default action", definition: "event dispatch 뒤 browser가 수행하는 navigation·submission 같은 platform behavior입니다.", detail: ["preventDefault로 취소할 수 있습니다.", "propagation과 별개입니다."] },
        { term: "propagation", definition: "event가 target에서 ancestor listeners로 전달되는 흐름입니다.", detail: ["delegation이 활용합니다.", "stopPropagation으로 중단합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "submit handler가 실행됐는데 page가 이동하거나 반대로 valid form도 영원히 제출되지 않는다.", likelyCause: "preventDefault 조건과 실제 성공 submission path를 설계하지 않았습니다.", checks: ["event.isDefaultPrevented와 form validity를 기록합니다.", "invalid/valid branches에서 preventDefault 호출 위치를 봅니다.", "Enter/requestSubmit/click 경로를 모두 재현합니다."], fix: "invalid일 때만 기본 제출을 막고 valid branch의 fetch/native submission을 명시합니다.", prevention: "invalid/valid·button/Enter/requestSubmit E2E matrix를 둡니다." },
      ],
    },
    {
      id: "on-direct-delegated-targets",
      title: ".on() 직접 binding은 현재 elements에, delegation은 stable ancestor와 미래 descendants에 적용됩니다",
      lead: "동적 element 수명과 event가 bubble하는 경로를 기준으로 binding 위치를 고릅니다.",
      explanations: [
        "$buttons.on('click', handler)는 호출 시점 collection members에 직접 handlers를 붙입니다. 나중에 추가된 button에는 자동으로 붙지 않습니다.",
        "$list.on('click.tasks', '.remove', handler)는 stable list에 하나의 handler를 두고 event가 bubble할 때 path에서 .remove와 match한 descendant를 처리합니다. 이후 추가된 items도 작동합니다.",
        "delegated handler에서 event.target은 실제로 누른 nested span, event.currentTarget과 this는 selector와 match한 button, event.delegateTarget은 handler를 등록한 list입니다. 세 identity를 구분해야 정확한 item에서 closest를 시작할 수 있습니다.",
        "jQuery가 this를 match element로 설정하려면 일반 function handler를 사용합니다. arrow function의 lexical this는 jQuery가 바꿀 수 없으므로 event.currentTarget 또는 named function을 사용합니다.",
        "delegation root를 document로 올리면 모든 event path에서 selectors를 비교해 coupling과 cost가 커집니다. dynamic items를 소유하는 가장 가까운 stable component root를 선택합니다.",
        "focus/blur는 원래 bubble하지 않지만 jQuery는 delegated focus/blur를 focusin/focusout으로 매핑합니다. 명확성을 위해 위임에서는 bubbling names를 직접 쓰는 편이 좋습니다.",
      ],
      concepts: [
        { term: "direct handler", definition: "현재 selected elements 각각에 직접 등록된 event handler입니다.", detail: ["미래 elements에는 없습니다.", "element별 cleanup이 필요합니다."] },
        { term: "delegated handler", definition: "stable ancestor가 bubbling event를 받아 selector와 match한 descendant context에서 실행하는 handler입니다.", detail: ["동적 descendants를 처리합니다.", "가까운 root를 사용합니다."] },
        { term: "delegateTarget", definition: "delegated handler가 실제로 등록된 ancestor element입니다.", detail: ["currentTarget/this와 다를 수 있습니다.", "component ownership boundary입니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-delegated-dynamic-remove",
          title: "중첩 span을 눌러도 동적으로 추가된 item을 정확히 삭제합니다",
          language: "html",
          filename: "jquery-event-delegation.html",
          purpose: "target/currentTarget/delegateTarget/this identities와 future descendant delegation을 exact output으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>delegation</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<ul id="tasks"><li data-id="a">A <button class="remove"><span>삭제</span></button></li></ul>
<pre id="out"></pre><script>
  const lines = [];
  $("#tasks").on("click.tasks", ".remove", function (event) {
    const $item = $(this).closest("li");
    lines.push("target=" + event.target.nodeName);
    lines.push("current=" + event.currentTarget.className);
    lines.push("delegate=" + event.delegateTarget.id);
    lines.push("this=" + this.className);
    lines.push("removed=" + $item.attr("data-id"));
    $item.remove();
  });
  $("#tasks").append('<li data-id="b">B <button class="remove"><span>삭제</span></button></li>');
  $("#tasks li[data-id='b'] .remove span").trigger("click");
  lines.push("remaining=" + $("#tasks li").length);
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "9-18", explanation: "stable tasks root에 namespaced delegated handler 하나를 두고 matched button에서 item을 찾습니다." },
            { lines: "19-22", explanation: "binding 뒤 B item을 추가하고 deepest span click을 발생시켜 future descendant 처리를 검증합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-event-delegation.html을 열고 #out 확인" },
          output: { value: "target=SPAN\ncurrent=remove\ndelegate=tasks\nthis=remove\nremoved=b\nremaining=1", explanation: ["target은 실제 span, current/this는 matched button, delegateTarget은 list입니다.", "동적으로 추가한 B만 제거되어 A 한 개가 남습니다."] },
          experiments: [
            { change: "$('.remove').on(...) 직접 binding 뒤 B를 추가합니다.", prediction: "B에는 handler가 없어 삭제되지 않습니다.", result: "future descendants에는 delegation이 필요합니다." },
            { change: "arrow function handler에서 this.className을 읽습니다.", prediction: "lexical this라 matched button을 가리키지 않습니다.", result: "event.currentTarget을 쓰거나 일반 function을 사용합니다." },
            { change: "$(document)에 같은 delegation을 둡니다.", prediction: "동작은 가능하지만 scope/cost/collision이 커집니다.", result: "가장 가까운 stable root가 낫습니다." },
          ],
          sourceRefs: ["jquery-on-api", "jquery-event-targets-api", "dom-event-standard"],
        },
      ],
      diagnostics: [
        { symptom: "동적으로 추가한 delete button만 작동하지 않는다.", likelyCause: "초기 buttons collection에 direct binding해 future element에는 handler가 없습니다.", checks: ["binding 시점과 element 생성 시점을 비교합니다.", "handler가 selector 인수 없는 direct .on인지 봅니다.", "event가 stable ancestor까지 bubble하는지 확인합니다."], fix: "component root에 .on('click.namespace', '.remove', handler) delegation을 둡니다.", prevention: "initial/future item 두 fixtures와 remount test를 둡니다." },
        { symptom: "button 안 icon을 누르면 wrong item 또는 undefined를 처리한다.", likelyCause: "event.target을 button이라고 가정했지만 deepest span/svg가 target입니다.", checks: ["target/currentTarget/delegateTarget/this를 함께 기록합니다.", "closest 시작 node를 봅니다.", "nested markup fixture를 재현합니다."], fix: "delegated match인 this/currentTarget에서 closest item을 시작합니다.", prevention: "text/icon/svg nested targets를 event test에 포함합니다." },
      ],
    },
    {
      id: "event-namespaces-off-lifecycle",
      title: "event namespace는 component가 자기 handlers만 정확히 정리하는 lifecycle 이름입니다",
      lead: "mount 때 등록한 모든 handlers를 dispose 때 같은 namespace로 제거합니다.",
      explanations: [
        "'input.signup', 'submit.signup'처럼 event type 뒤 namespace를 붙이면 다른 기능의 같은 event handlers와 ownership을 분리할 수 있습니다. namespace는 hierarchy가 아니라 matching label입니다.",
        ".off('.signup')은 해당 element의 signup namespace 모든 event types를 제거합니다. .off('click')은 그 element의 모든 click direct/delegated handlers를 지울 수 있어 large codebase에서 위험합니다.",
        "specific delegated handler를 제거할 때 events·selector·handler filters가 attach와 맞아야 합니다. anonymous function을 다시 써서 같은 모양을 전달해도 function identity가 달라 제거되지 않습니다.",
        "component mount가 여러 번 호출되면 동일 handler가 중복 등록될 수 있습니다. mount 전 .off('.namespace') 후 attach 또는 mounted guard를 사용하고 dispose에서 off를 보장합니다.",
        "namespace는 native addEventListener에는 없는 jQuery 편의입니다. native migration에서는 AbortSignal, named listener+removeEventListener 또는 component-owned disposer array로 같은 ownership을 구현합니다.",
        "handler가 timer·observer·fetch·plugin을 만들면 .off만으로 모두 정리되지 않습니다. disposer가 event 외 resources도 취소합니다.",
      ],
      concepts: [
        { term: "event namespace", definition: "event type에 붙여 handler ownership별 attach/trigger/remove를 가능하게 하는 jQuery label입니다.", detail: [".signup 형태로 일괄 제거합니다.", "계층 구조는 아닙니다."] },
        { term: "handler identity", definition: "등록과 특정 제거에서 같은 function object인지 나타내는 identity입니다.", detail: ["새 anonymous function은 다릅니다.", "named function/disposer를 사용합니다."] },
        { term: "idempotent mount", definition: "mount를 여러 번 호출해도 handler가 중복되지 않는 component initialization입니다.", detail: ["namespace teardown 또는 guard를 씁니다.", "한 event당 effect count로 test합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-one-namespace-teardown",
          title: ".one과 audit namespace를 독립적으로 실행·제거합니다",
          language: "html",
          filename: "jquery-event-lifecycle.html",
          purpose: "one handler는 한 번, regular handler는 두 번 실행된 뒤 namespace teardown으로 더 이상 실행되지 않음을 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>event lifecycle</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<button id="run">실행</button><pre id="out"></pre><script>
  const lines = [];
  let once = 0;
  let audit = 0;
  const $run = $("#run");
  $run.one("click.once", function () { once += 1; lines.push("once"); });
  $run.on("click.audit", function () { audit += 1; lines.push("audit"); });
  $run.trigger("click").trigger("click");
  $run.off(".audit").trigger("click");
  lines.push("counts=once:" + once + ",audit:" + audit);
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "10-13", explanation: "같은 button에 once와 audit namespaces의 one/regular handlers를 따로 등록합니다." },
            { lines: "14-16", explanation: "두 clicks 뒤 audit namespace만 제거하고 third click, final counts를 확인합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-event-lifecycle.html을 열고 #out 확인" },
          output: { value: "once\naudit\naudit\ncounts=once:1,audit:2", explanation: ["first click에서 둘 다, second에서 audit만 실행됩니다.", "off('.audit') 뒤 third click은 아무 handler도 실행하지 않습니다."] },
          experiments: [
            { change: ".one('click mouseenter', handler)를 사용합니다.", prediction: "각 event type별 한 번이므로 최대 두 번 실행될 수 있습니다.", result: "전체에서 딱 한 번이라는 설명은 부정확합니다." },
            { change: ".off('click')을 사용합니다.", prediction: "once/audit뿐 아니라 같은 element의 다른 click handlers도 제거할 수 있습니다.", result: "owner namespace를 사용합니다." },
            { change: "mount를 두 번 호출해 audit handler를 두 번 등록합니다.", prediction: "한 click에 audit가 두 번 실행됩니다.", result: "idempotent mount/dispose가 필요합니다." },
          ],
          sourceRefs: ["web-jquery-form-event-source", "jquery-off-api", "jquery-one-api"],
        },
      ],
      diagnostics: [
        { symptom: "page 재진입 뒤 한 input에 validation이 두세 번 실행된다.", likelyCause: "component mount마다 handlers를 다시 on하고 이전 namespace를 off/dispose하지 않았습니다.", checks: ["mount/dispose/handler call count를 기록합니다.", "event namespace 사용 여부를 봅니다.", "동일 node가 재사용되는지 확인합니다."], fix: "mount 전 off('.component') 또는 mounted guard를 사용하고 unmount에서 all resources를 dispose합니다.", prevention: "mount→unmount→remount 뒤 one event=one effect E2E를 둡니다." },
        { symptom: ".off('click') 뒤 다른 팀 기능의 button도 멈춘다.", likelyCause: "event type만 지정해 같은 element의 모든 click handlers를 제거했습니다.", checks: ["attach namespaces와 off filters를 조사합니다.", "delegated/direct handlers가 같은 root에 있는지 봅니다.", "selector/handler identity가 필요했는지 확인합니다."], fix: "소유 namespace .off('.signup') 또는 exact event+selector+handler를 사용합니다.", prevention: "plugin/component마다 unique namespace convention을 둡니다." },
      ],
    },
    {
      id: "one-hover-event-choice",
      title: ".one과 event type은 목적에 맞게 선택하고 사용자 데이터를 지우는 shortcut으로 쓰지 않습니다",
      lead: "언제 한 번인지, 어떤 입력 경로를 포착하는지, 사용자가 무엇을 잃는지를 함께 봅니다.",
      explanations: [
        ".one(events, handler)은 element별·event type별 최대 한 번 실행 후 자신을 제거합니다. 여러 event types를 한 string에 주면 각 type별 한 번이라 handler가 여러 번 실행될 수 있습니다.",
        "day11 ex02는 textarea의 first focus에서 value를 무조건 빈 문자열로 만듭니다. restored draft, autofill, server-prefilled text와 사용자가 keyboard로 focus한 값까지 잃을 수 있습니다. one은 first-use help/analytics처럼 data-destructive하지 않은 용도에 씁니다.",
        "day11 ex01의 .hover(enter,leave)는 mouseenter/mouseleave shorthand이고 jQuery 3.3부터 deprecated입니다. .on('mouseenter',...)와 .on('mouseleave',...)로 옮겨도 touch/keyboard activation을 제공하지 않습니다.",
        "상태가 변하는 bulb image는 decorative hover가 아니라 button으로 만들고 click/keyboard/touch path, pressed/status text와 meaningful alt/name을 제공합니다. pointer hover는 progressive decoration으로만 둡니다.",
        "focus/blur validation은 사용자가 field를 떠날 때 low-frequency feedback에 적합하지만 initial focus만으로 값을 지우거나 error를 내지 않습니다. 위임에서는 focusin/focusout을 사용합니다.",
      ],
      concepts: [
        { term: "once-per-type", definition: ".one handler가 각 element와 각 event type 조합에서 최대 한 번 실행되는 계약입니다.", detail: ["여러 types면 여러 번 가능입니다.", "호출 뒤 자동 unbind됩니다."] },
        { term: "input modality", definition: "mouse·touch·keyboard·voice·IME 등 사용자가 UI를 조작하는 방식입니다.", detail: ["hover만으로 기능을 제공하지 않습니다.", "native controls를 우선합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "자동완성/서버 복원된 자기소개가 first focus에서 사라진다.", likelyCause: ".one('focus')를 data 초기화에 사용했습니다.", checks: ["focus 전 value provenance를 확인합니다.", "keyboard/mouse/autofill/restoration paths를 test합니다.", "placeholder와 actual value를 혼동했는지 봅니다."], fix: "실제 value를 지우지 말고 one을 도움말 announcement/analytics에만 사용합니다.", prevention: "prefilled/restored/autofilled form E2E를 둡니다." },
      ],
    },
    {
      id: "input-change-focusout-submit",
      title: "실시간 입력·선택 확정·field 이탈·최종 제출은 서로 다른 event를 사용합니다",
      lead: "keyup 하나로 모든 값 변화를 대표하지 않습니다.",
      explanations: [
        "input event는 text value가 사용자 입력으로 바뀔 때 발생해 keyboard뿐 아니라 paste, drag-drop, speech/mobile input을 더 넓게 포착합니다. programmatic .val/property write는 자동 input/change를 발생시키지 않습니다.",
        "keyup은 key가 release된 순간이고 value change가 없는 keys에도 발생하며 paste/context menu/mobile/voice를 놓칠 수 있습니다. day11 두 원본의 text validation을 input으로 옮깁니다.",
        "change는 checkbox/radio/select의 committed selection과 text control의 committed change를 다룹니다. 즉각 character validation에는 input, 선택형 current state에는 change가 자연스럽습니다.",
        "blur/focusout은 field를 떠난 뒤 expensive/strict feedback을 보여 줄 때 유용합니다. direct blur와 delegated bubbling focusout을 구분합니다.",
        "submit은 모든 input path의 마지막 gate입니다. 실시간 feedback이 통과했더라도 server-validated current values를 다시 검사하고 errors를 summary/fields에 연결합니다.",
        "input handler에서 매 keystroke마다 network request나 큰 DOM update를 하지 않습니다. cheap local validation은 즉시, async availability check는 debounce+cancel+latest response guard를 사용합니다.",
      ],
      concepts: [
        { term: "input event", definition: "user action으로 editable value가 바뀐 뒤 발생하는 broad value-change event입니다.", detail: ["paste/mobile을 포함합니다.", "script value write는 자동 dispatch하지 않습니다."] },
        { term: "change event", definition: "control의 value/selection change가 commit된 시점의 event입니다.", detail: ["checkbox/radio/select에 적합합니다.", "text timing은 input과 다릅니다."] },
        { term: "submit gate", definition: "click/Enter/requestSubmit 등 모든 제출 경로에서 form 전체 current state를 최종 검증하는 boundary입니다.", detail: ["button click만 보지 않습니다.", "client success가 server success를 보장하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "붙여넣기·모바일 자동완성 뒤 validation message가 갱신되지 않는다.", likelyCause: "keyup만 듣고 실제 value-change input paths를 포착하지 않았습니다.", checks: ["input/change/keyup logs를 modality별로 비교합니다.", "programmatic write인지 user input인지 구분합니다.", "IME composition 상태를 봅니다."], fix: "text current value에는 input을 기본으로 하고 commit/expensive rule은 focusout/submit과 조합합니다.", prevention: "keyboard/paste/mobile/voice/autofill fixture를 포함합니다." },
      ],
    },
    {
      id: "ime-composition-debounce-async-race",
      title: "한국어 IME 조합 중에는 확정되지 않은 글자를 성급하게 검증하거나 서버로 보내지 않습니다",
      lead: "composition session과 최종 input을 구분하고 async response의 최신성도 검증합니다.",
      explanations: [
        "한글·일본어·중국어 IME는 여러 keystrokes를 조합해 한 grapheme을 확정합니다. 조합 중 input을 글자 수 오류로 즉시 표시하면 message가 깜빡이고 screen reader가 불필요한 오류를 반복할 수 있습니다.",
        "native InputEvent.isComposing 또는 jQuery event.originalEvent?.isComposing이 true면 validation을 보류하고 compositionend에서 확정 current value를 검사합니다.",
        "문자열 length는 UTF-16 code units 수입니다. 제품이 사용자 인식 글자 수를 요구하면 emoji/combining marks를 포함해 Intl.Segmenter grapheme segmentation 또는 명확한 server-equivalent rule을 검토합니다.",
        "debounce는 마지막 input 뒤 일정 시간 quiet period를 기다리지만 blur/submit에서는 pending debounce를 flush하거나 즉시 validate해야 합니다. timer만 늦춘다고 stale server response가 해결되지는 않습니다.",
        "username availability처럼 async validation은 previous AbortController를 abort하고 request sequence/current value를 응답 시 다시 비교합니다. 오래된 success가 새 input error를 덮지 못하게 합니다.",
        "pending/error/success state와 aria-busy/status를 관리하되 password·email raw values를 telemetry에 남기지 않습니다.",
      ],
      concepts: [
        { term: "composition", definition: "IME가 여러 입력을 하나의 확정 text로 조합하는 session입니다.", detail: ["isComposing으로 중간 input을 식별합니다.", "compositionend에서 재검증합니다."] },
        { term: "debounce", definition: "연속 events가 멈춘 뒤 마지막 호출만 실행하도록 지연하는 rate-limit 전략입니다.", detail: ["submit에서는 flush policy가 필요합니다.", "network race는 별도 취소합니다."] },
        { term: "stale response", definition: "현재 input보다 이전 value/request에 대한 async 결과가 늦게 도착한 상태입니다.", detail: ["sequence/value를 비교합니다.", "AbortController를 사용합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-ime-composition-validation",
          title: "조합 중 input을 건너뛰고 확정된 한글 이름만 검증합니다",
          language: "html",
          filename: "jquery-ime-validation.html",
          purpose: "InputEvent.isComposing과 compositionend/current value 처리 순서를 synthetic browser events로 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>IME validation</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<input id="username" aria-label="이름"><pre id="out"></pre><script>
  const input = document.querySelector("#username");
  const lines = [];
  function validateName() {
    const value = input.value;
    lines.push(value + ":" + (value.length >= 2 ? "ok" : "too-short"));
  }
  $(input)
    .on("input.validation", function (event) {
      if (event.originalEvent?.isComposing) {
        lines.push("composing:skip");
        return;
      }
      validateName();
    })
    .on("compositionend.validation", validateName);
  input.value = "ㅎ";
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "ㅎ", isComposing: true }));
  input.value = "한";
  input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "한" }));
  input.value = "한국";
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "국", isComposing: false }));
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "10-14", explanation: "현재 확정 value를 같은 validator에서 length rule로 판정합니다." },
            { lines: "15-24", explanation: "input originalEvent가 composing이면 skip하고 compositionend는 current value를 검증합니다." },
            { lines: "25-31", explanation: "조합 중 ㅎ, 확정 한, 다음 확정 한국 sequence를 synthetic events로 재현합니다." },
          ],
          run: { environment: ["InputEvent/CompositionEvent와 jQuery 4.0.0을 지원하는 modern browser"], command: "jquery-ime-validation.html을 열고 #out 확인" },
          output: { value: "composing:skip\n한:too-short\n한국:ok", explanation: ["조합 중 partial input은 검증하지 않습니다.", "compositionend의 한 글자는 too-short, 확정 한국은 ok입니다."] },
          experiments: [
            { change: "isComposing guard를 제거합니다.", prediction: "ㅎ partial state에도 오류가 추가됩니다.", result: "IME 중 premature feedback이 생깁니다." },
            { change: "emoji family를 length rule에 넣습니다.", prediction: "사용자 인식 한 글자와 length가 크게 다를 수 있습니다.", result: "제품 글자 수 정의가 필요합니다." },
            { change: "각 input에서 async request를 보내고 응답 순서를 뒤집습니다.", prediction: "latest guard 없이는 오래된 결과가 현재 UI를 덮습니다.", result: "abort/sequence/value 확인을 추가합니다." },
          ],
          sourceRefs: ["web-jquery-basic-event-source", "web-jquery-form-event-source", "ui-events-standard", "ecma-intl-segmenter"],
        },
      ],
      diagnostics: [
        { symptom: "한글 입력 중 오류 문구가 매 keystroke마다 깜빡이거나 값을 지운다.", likelyCause: "IME composition 중 partial input을 확정 text처럼 keyup/input에서 검증했습니다.", checks: ["compositionstart/update/end와 input isComposing을 기록합니다.", "message update와 value deletion을 찾습니다.", "한국어/일본어 mobile IME를 test합니다."], fix: "isComposing 중 local/async validation을 보류하고 compositionend에서 current value를 검증합니다.", prevention: "IME composition E2E와 no-value-deletion invariant를 둡니다." },
        { symptom: "아이디 중복 검사가 이전 값은 가능이라고 늦게 표시한다.", likelyCause: "async responses가 request 순서와 다르게 도착했는데 current value/latest request를 확인하지 않았습니다.", checks: ["request sequence/value와 response time을 기록합니다.", "AbortController가 previous request를 취소하는지 봅니다.", "unmount 뒤 update도 확인합니다."], fix: "debounce+abort+monotonic sequence/current value guard로 latest result만 render합니다.", prevention: "reversed response order, abort, unmount fixtures를 둡니다." },
      ],
    },
    {
      id: "single-validation-contract-original-bugs",
      title: "실시간과 submit은 같은 pure validator를 재사용하고 입력값을 지우지 않습니다",
      lead: "event handler마다 rule을 다시 쓰면 이미 원본처럼 서로 다른 결과를 냅니다.",
      explanations: [
        "day11 ex02의 input handler는 val.length<2를 쓰지만 submit handler는 username<2를 씁니다. string numeric comparison에서 '가'는 NaN<2가 false라 한 글자 이름이 submit을 통과합니다.",
        "순수 validateName(value)는 normalized value와 error code/message를 반환하고 DOM을 직접 바꾸지 않습니다. input/focusout/submit/server mapping이 같은 function을 호출합니다.",
        "email은 '@'와 '.' 포함만으로 충분하지 않습니다. HTML type=email의 ValidityState를 기본으로 사용하고 제품 규칙과 server canonicalization을 필요한 만큼 추가합니다.",
        "password confirm은 둘 다 empty인 경우 equal이지만 required/minimum rule을 먼저 적용해야 합니다. password를 임의 trim하면 실제 credential을 바꾸므로 product/server policy 없이 정규화하지 않습니다.",
        "원본은 오류 때 field 값을 지우고 alert/focus를 반복합니다. 입력을 보존하고 inline message를 연결하며 submit에서 error summary를 만들고 첫 invalid field에 한 번만 focus합니다.",
        ".attr('class','msg_err')는 stable msg class를 덮습니다. removeClass('msg_ok msg_err').addClass(nextClass) 또는 toggleClass(force)로 base class를 보존합니다.",
      ],
      concepts: [
        { term: "pure validator", definition: "입력값을 받아 valid/error data를 반환하고 DOM·network·focus side effect를 만들지 않는 function입니다.", detail: ["여러 event path가 재사용합니다.", "unit test가 쉽습니다."] },
        { term: "rule drift", definition: "실시간·submit·server에서 같은 field 규칙을 서로 다르게 구현해 결과가 어긋나는 상태입니다.", detail: ["single contract로 줄입니다.", "server가 최종 authority입니다."] },
        { term: "non-destructive feedback", definition: "잘못된 입력도 지우지 않고 사용자가 수정할 수 있게 message/state만 갱신하는 UX입니다.", detail: ["alert loop를 피합니다.", "첫 오류에 한 번만 focus합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-original-name-coercion-bug",
          title: "문자열 숫자 비교와 length 검증의 결과 차이를 재현합니다",
          language: "html",
          filename: "jquery-validation-coercion.html",
          purpose: "원본 submit의 username < 2가 비숫자 한 글자를 통과시키는 이유를 exact truth table로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>validation coercion</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body><pre id="out"></pre><script>
  const values = ["", "가", "1", "가나"];
  const lines = $.map(values, function (value) {
    const oldRejected = value < 2;
    const fixedRejected = value.trim().length < 2;
    return JSON.stringify(value) + ": old=" + oldRejected + " fixed=" + fixedRejected;
  });
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "7-12", explanation: "empty, 한글 한 글자, numeric string, 한글 두 글자를 old coercion과 explicit length rule에 넣습니다." },
            { lines: "13", explanation: "JSON.stringify로 empty/Unicode 값을 명확히 보이는 truth table을 만듭니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-validation-coercion.html을 열고 #out 확인" },
          output: { value: "\"\": old=true fixed=true\n\"가\": old=false fixed=true\n\"1\": old=true fixed=true\n\"가나\": old=false fixed=false", explanation: ["'가'는 numeric conversion NaN이라 NaN<2가 false여서 old rule을 통과합니다.", "length rule은 one character를 정확히 거부합니다."] },
          experiments: [
            { change: "value='  가  '를 추가합니다.", prediction: "trim length rule은 한 글자로 거부합니다.", result: "name normalization policy를 명시합니다." },
            { change: "emoji를 넣습니다.", prediction: "UTF-16 length와 grapheme count가 다를 수 있습니다.", result: "사용자 인식 글자 수 rule은 Intl.Segmenter/server parity를 검토합니다." },
            { change: "old comparison을 Number(value)<2로 명시합니다.", prediction: "bug의 numeric coercion 의도가 더 분명해지지만 name length rule로는 여전히 틀립니다.", result: "domain에 맞는 metric을 사용합니다." },
          ],
          sourceRefs: ["web-jquery-form-event-source", "ecma-relational-comparison", "ecma-intl-segmenter"],
        },
        {
          id: "jquery-accessible-validation-submit",
          title: "한 validator가 message·ARIA·submit 차단을 동기화하고 값은 보존합니다",
          language: "html",
          filename: "jquery-accessible-validation.html",
          purpose: "invalid/valid submits에서 preventDefault, aria-invalid, message와 value preservation을 deterministic handler invocation으로 검증합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>accessible validation</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<form id="signup" novalidate>
  <label for="name">이름</label>
  <input id="name" name="username" aria-describedby="name-error">
  <p id="name-error" class="msg" aria-live="polite"></p>
  <button type="submit">가입</button>
</form><pre id="out"></pre><script>
  const lines = [];
  function validateName(value) {
    const valid = value.trim().length >= 2;
    return { valid, message: valid ? "" : "이름은 2자 이상 입력하세요." };
  }
  function render(result) {
    $("#name").attr("aria-invalid", String(!result.valid));
    $("#name-error").text(result.message)
      .removeClass("msg_ok msg_err").addClass(result.valid ? "msg_ok" : "msg_err");
  }
  $("#signup").on("submit.validation", function (event) {
    const result = validateName(String($("#name").val()));
    render(result);
    if (!result.valid) event.preventDefault();
    lines.push((result.valid ? "accepted" : "blocked") +
      "|prevented=" + event.isDefaultPrevented() +
      "|invalid=" + $("#name").attr("aria-invalid") +
      "|message=" + ($("#name-error").text() || "(empty)") +
      "|value=" + $("#name").val());
  });
  $("#name").val("가");
  $("#signup").triggerHandler("submit");
  $("#name").val("가나");
  $("#signup").triggerHandler("submit");
  $("#out").text(lines.join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "14-22", explanation: "pure validator와 render를 분리해 base msg class를 보존하며 ARIA/message를 같은 result로 갱신합니다." },
            { lines: "23-33", explanation: "submit에서 invalid만 preventDefault하고 observable state/value를 한 줄로 기록합니다." },
            { lines: "34-39", explanation: "triggerHandler로 navigation 없이 one/two-character cases를 handler 수준에서 deterministic 검증합니다." },
          ],
          run: { environment: ["jQuery 4.0.0 CDN에 접근 가능한 modern browser"], command: "jquery-accessible-validation.html을 열고 #out 확인" },
          output: { value: "blocked|prevented=true|invalid=true|message=이름은 2자 이상 입력하세요.|value=가\naccepted|prevented=false|invalid=false|message=(empty)|value=가나", explanation: ["invalid value는 보존되고 message/ARIA와 default prevention이 일치합니다.", "valid submit은 error를 clear하고 prevented=false입니다."] },
          experiments: [
            { change: "msg class를 attr('class','msg_err')로 설정합니다.", prediction: "base msg class가 사라집니다.", result: "token state methods를 사용합니다." },
            { change: "novalidate를 제거하고 requestSubmit을 사용합니다.", prediction: "native constraint validation과 submit event ordering도 적용됩니다.", result: "통합 test는 실제 submission API를 사용합니다." },
            { change: "invalid branch에서 value를 지웁니다.", prediction: "output value가 empty가 되어 사용자가 입력을 잃습니다.", result: "non-destructive feedback을 유지합니다." },
          ],
          sourceRefs: ["web-jquery-form-event-source", "jquery-submit-api", "html-constraint-validation", "wai-form-notifications"],
        },
      ],
      diagnostics: [
        { symptom: "이름 한 글자가 실시간에는 오류인데 submit에서는 통과한다.", likelyCause: "실시간은 length, submit은 username<2 numeric coercion이라는 서로 다른 rules를 사용했습니다.", checks: ["모든 validation paths의 function을 비교합니다.", "truth table에 Unicode/non-numeric/numeric strings를 넣습니다.", "server rule도 대조합니다."], fix: "하나의 pure validator를 input/focusout/submit에서 재사용하고 server-equivalent contract를 문서화합니다.", prevention: "same fixtures를 client real-time/submit/server contract tests에 재사용합니다." },
        { symptom: "비밀번호 두 칸이 비어 있는데 일치 성공으로 표시된다.", likelyCause: "required/minimum rules 전에 equality만 검사했습니다.", checks: ["empty/short/mismatch/valid 순서로 truth table을 만듭니다.", "HTML required/minlength와 custom validator를 비교합니다.", "password trim 여부를 확인합니다."], fix: "required→minimum/policy→confirmation equality 순으로 검증하고 raw value를 임의 trim하지 않습니다.", prevention: "empty/whitespace/Unicode/mismatch fixtures와 server parity를 둡니다." },
      ],
    },
    {
      id: "constraint-validation-formdata-submission-apis",
      title: "HTML constraint validation과 name/FormData를 활용하고 submit API 차이를 정확히 압니다",
      lead: "브라우저가 이미 가진 email·required·minlength 계약을 다시 부정확하게 만들지 않습니다.",
      explanations: [
        "type=email, required, minlength, pattern 등은 ValidityState에 typeMismatch/valueMissing/tooShort/patternMismatch를 제공합니다. custom UI도 이 state를 읽고 제품-specific rule만 추가합니다.",
        "setCustomValidity(nonEmptyMessage)는 customError로 invalid를 유지합니다. 정상 상태에서는 반드시 setCustomValidity('')로 clear하지 않으면 다른 값이 맞아도 계속 submit이 막힙니다.",
        "day11 ex02의 모든 fields는 id만 있고 name이 없습니다. id는 DOM/label 식별자이고 name은 form entry key라 new FormData(form)와 native POST에 아무 값도 들어가지 않습니다.",
        "submit button click만 듣지 말고 form submit을 듣습니다. form.requestSubmit()은 submitter·constraint validation·submit event를 수행하지만 form.submit() method는 constraint validation과 submit event를 건너뜁니다.",
        "browser native validation이 submit event 전에 막을 수 있어 custom summary가 필요하면 invalid events와 checkValidity/reportValidity flow를 설계합니다. novalidate는 custom UI ownership을 선택할 때만 사용합니다.",
        "FormData entries와 화면 summary를 비교하고 disabled/no-name/unchecked controls의 missing semantics를 server schema에서 normalize합니다.",
      ],
      concepts: [
        { term: "ValidityState", definition: "HTML control의 현재 constraint validation flags를 제공하는 live object입니다.", detail: ["valueMissing/typeMismatch 등이 있습니다.", "customError도 포함합니다."] },
        { term: "setCustomValidity", definition: "non-empty custom error message로 control을 invalid로 만들고 empty string으로 해제하는 API입니다.", detail: ["정상 때 clear가 필수입니다.", "message localization을 설계합니다."] },
        { term: "requestSubmit", definition: "submitter semantics와 constraint validation을 거쳐 submit event를 발생시키는 form method입니다.", detail: ["form.submit와 다릅니다.", "통합 test에 적합합니다."] },
      ],
      codeExamples: [
        {
          id: "jquery-form-name-formdata",
          title: "id만 있는 원본 form과 name을 고친 form의 제출 entries를 비교합니다",
          language: "html",
          filename: "jquery-formdata-name.html",
          purpose: "DOM ID와 form submission name의 역할 차이를 exact FormData count/query string으로 확인합니다.",
          code: String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>id name FormData</title>
<script src="https://code.jquery.com/jquery-4.0.0.min.js"
 integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
 crossorigin="anonymous"></script></head><body>
<form id="original"><input id="old-user" value="kim"><input id="old-email" value="kim@example.com"><select id="old-job"><option value="developer" selected>개발자</option></select></form>
<form id="fixed"><input id="new-user" name="username" value="kim"><input id="new-email" name="email" value="kim@example.com"><select id="new-job" name="job"><option value="developer" selected>개발자</option></select></form>
<pre id="out"></pre><script>
  const original = new FormData($("#original")[0]);
  const fixed = new FormData($("#fixed")[0]);
  $("#out").text([
    "original-count=" + [...original].length,
    "fixed-count=" + [...fixed].length,
    "fixed=" + new URLSearchParams(fixed).toString()
  ].join("\n"));
</script></body></html>`,
          walkthrough: [
            { lines: "7-8", explanation: "같은 values를 가진 두 forms에서 첫째는 id만, 둘째는 id와 submission name을 가집니다." },
            { lines: "10-16", explanation: "FormData entry count와 encoded fixed payload를 비교합니다." },
          ],
          run: { environment: ["FormData/URLSearchParams와 jQuery 4.0.0을 지원하는 modern browser"], command: "jquery-formdata-name.html을 열고 #out 확인" },
          output: { value: "original-count=0\nfixed-count=3\nfixed=username=kim&email=kim%40example.com&job=developer", explanation: ["id-only controls는 submission entries가 0개입니다.", "name을 가진 세 controls가 expected encoded payload를 만듭니다."] },
          experiments: [
            { change: "email을 disabled로 만듭니다.", prediction: "fixed-count가 2로 줄고 email entry가 빠집니다.", result: "FormData successful-control semantics를 따릅니다." },
            { change: "id를 모두 제거하고 name은 둡니다.", prediction: "FormData entries는 유지되지만 label/query wiring을 별도 고쳐야 합니다.", result: "id와 name 역할이 다릅니다." },
            { change: "form.submit와 requestSubmit을 각각 instrument합니다.", prediction: "submit method는 validation/submit listener를 건너뛰고 requestSubmit은 수행합니다.", result: "실제 product path에 맞는 API를 선택합니다." },
          ],
          sourceRefs: ["web-jquery-form-event-source", "html-forms-standard", "html-form-entry-standard", "jquery-hover-api"],
        },
      ],
      diagnostics: [
        { symptom: "UI validation은 성공했는데 server에 field values가 하나도 없다.", likelyCause: "controls에 id만 있고 name이 없어 form entry list에 포함되지 않았습니다.", checks: ["new FormData(form) entries를 출력합니다.", "각 successful control의 name/disabled/checked를 확인합니다.", "request content type/payload를 봅니다."], fix: "server contract keys와 일치하는 name을 controls에 부여하고 FormData integration test를 추가합니다.", prevention: "expected payload snapshot과 required names lint를 둡니다." },
        { symptom: "setCustomValidity를 고친 뒤에도 field가 계속 invalid다.", likelyCause: "이전 non-empty custom message를 정상 branch에서 empty string으로 clear하지 않았습니다.", checks: ["validity.customError와 validationMessage를 확인합니다.", "모든 validator branches를 봅니다.", "current value에서 setCustomValidity('')가 실행되는지 확인합니다."], fix: "매 validation에서 error면 message, 정상은 반드시 empty string을 설정합니다.", prevention: "invalid→valid transition fixture를 둡니다." },
      ],
    },
    {
      id: "accessible-error-feedback-focus",
      title: "오류는 색과 alert가 아니라 field 관계·상태·요약·focus 순서로 전달합니다",
      lead: "사용자가 입력을 유지한 채 문제를 찾고 수정하고 다시 제출할 수 있어야 합니다.",
      explanations: [
        "각 input은 aria-describedby로 stable help/error element와 연결하고 invalid일 때 aria-invalid=true를 설정합니다. error text만 바뀌어도 field와 관계가 유지됩니다.",
        "실시간 message는 모든 keystroke를 assertive하게 읽지 않습니다. polite live region 또는 submit error summary를 사용하고 IME composition 중 announcement를 보류합니다.",
        "color green/red만으로 성공/오류를 구분하지 않고 text/icon/semantic state를 함께 제공합니다. msg base class를 유지하고 has-error/msg_err token만 바꿉니다.",
        "submit에서 errors가 여러 개면 page title/summary에 count와 links를 제공하고 first invalid field에 한 번 focus합니다. 각 rule에서 alert→focus→value deletion을 반복하지 않습니다.",
        "focus 이동은 user context를 바꾸므로 실시간 validation마다 하지 않습니다. submit 또는 명시 navigation 때만 predictable하게 수행하고 scroll/focus-visible을 검증합니다.",
        "server errors도 같은 field IDs/error codes로 render하며 general error는 summary에 둡니다. server가 돌려준 message를 .html로 넣지 않고 text로 렌더링합니다.",
      ],
      concepts: [
        { term: "field error relationship", definition: "input과 설명/error element를 aria-describedby 등으로 연결하는 접근성 관계입니다.", detail: ["stable IDs를 사용합니다.", "message가 비어도 relation을 유지할 수 있습니다."] },
        { term: "error summary", definition: "submit 실패 시 모든 오류를 count와 field links로 모아 제공하는 영역입니다.", detail: ["first error focus와 조합합니다.", "server/general errors도 포함합니다."] },
        { term: "non-destructive correction", definition: "invalid value를 보존하고 message/selection/focus로 수정 기회를 주는 interaction입니다.", detail: ["값 자동 삭제를 피합니다.", "password도 임의 normalize하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "화면에는 red message가 있지만 screen reader가 field error를 알지 못한다.", likelyCause: "색/class/text만 바꾸고 input과 message relationship·aria-invalid·announcement를 누락했습니다.", checks: ["accessibility tree에서 description/invalid state를 봅니다.", "aria-describedby ID가 unique/existing인지 확인합니다.", "live region timing과 duplicate announcements를 test합니다."], fix: "stable describedby, aria-invalid, polite field message와 submit summary/focus를 함께 구현합니다.", prevention: "keyboard/screen reader/accessibility-tree E2E를 release gate에 둡니다." },
      ],
    },
    {
      id: "server-validation-security-async-errors",
      title: "클라이언트 검증은 UX layer이고 server가 최종 schema·권한·업무 규칙을 검증합니다",
      lead: "DevTools에서 우회할 수 있는 DOM 상태를 보안 경계로 사용하지 않습니다.",
      explanations: [
        "client JavaScript는 비활성화·변조할 수 있고 request는 UI를 거치지 않고 만들어질 수 있습니다. required/email/password policy, uniqueness, authorization과 rate limit은 server에서 다시 검증합니다.",
        "client와 server가 같은 error code/schema를 공유하면 rule drift가 줄지만 server response가 최종 authority입니다. field errors와 form/global errors를 구분해 current values를 보존하며 다시 표시합니다.",
        "비밀번호를 trim/log/analytics에 보내지 않고 error messages에도 raw input을 echo하지 않습니다. username/email도 privacy policy에 맞춰 최소화·redact합니다.",
        "async uniqueness result는 snapshot일 뿐 submit 순간 race가 가능하므로 server transaction/unique constraint가 최종 보장합니다. client green check를 authorization/guarantee로 표현하지 않습니다.",
        "server error HTML을 .html에 넣으면 stored/reflected XSS가 될 수 있습니다. error code를 local text template에 map하거나 plain text sink를 사용합니다.",
        "network timeout/offline/429/5xx는 field invalid와 다른 operational state입니다. retry/cancel/pending을 별도 표현하고 submit button lock이 영구히 남지 않게 finally cleanup합니다.",
      ],
      concepts: [
        { term: "client validation", definition: "빠른 feedback과 불필요한 request 감소를 위한 사용자 경험 layer입니다.", detail: ["보안 경계가 아닙니다.", "server rule과 일치시킵니다."] },
        { term: "server authority", definition: "request data·권한·현재 DB state를 최종 검증하고 결과를 확정하는 boundary입니다.", detail: ["unique constraint/transaction을 소유합니다.", "structured errors를 반환합니다."] },
        { term: "operational error", definition: "입력값 오류가 아니라 timeout/offline/rate-limit/server failure 같은 실행 환경 오류입니다.", detail: ["field error와 분리합니다.", "retry/correlation을 제공합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "client에서 사용 가능했던 username이 submit에서는 중복 오류가 난다.", likelyCause: "availability check 이후 다른 request가 같은 값을 차지한 정상 race입니다.", checks: ["check/submit timestamps와 server constraint error code를 봅니다.", "client가 availability를 guarantee로 표시했는지 확인합니다.", "server unique constraint가 있는지 확인합니다."], fix: "server constraint를 최종 authority로 두고 submit error를 field에 재매핑해 입력을 보존합니다.", prevention: "race fixture와 structured conflict error contract를 둡니다." },
      ],
    },
    {
      id: "native-migration-performance-testing",
      title: "이벤트 이관은 .on을 addEventListener로 바꾸는 것보다 lifecycle·입력·접근성 contract를 보존하는 작업입니다",
      lead: "실제 browser에서 event order와 한 번성, payload와 focus를 함께 회귀 검증합니다.",
      explanations: [
        "direct .on은 addEventListener, delegated .on은 ancestor listener+target.closest(selector)+root.contains, .off namespace는 AbortController signal 또는 disposer, .one은 addEventListener once option으로 옮길 수 있습니다.",
        "jQuery delegated this/currentTarget semantics를 native closest result로 명시해야 합니다. event.currentTarget는 native에서는 ancestor listener root이므로 jQuery 위임 currentTarget과 그대로 같지 않을 수 있습니다.",
        "high-frequency input에서 매번 전체 form query·layout·network를 하지 않습니다. cheap pure validation, batched DOM render, debounced async check를 분리하고 representative device에서 측정합니다.",
        "test matrix는 direct/future delegated item, nested target, mount twice/off, one multiple types, IME, paste, programmatic val, native validity, Enter/requestSubmit, FormData names, server errors, keyboard/screen reader를 포함합니다.",
        "synthetic triggerHandler는 handler unit integration에는 좋지만 native constraint validation·bubbling·default action 전체를 재현하지 않습니다. final E2E는 real click/type/requestSubmit/browser event를 사용합니다.",
        "telemetry는 raw input이 아니라 event source, validation error code, pending duration, abort/stale count, submit outcome와 version을 privacy-safe하게 기록합니다.",
      ],
      concepts: [
        { term: "delegation adapter", definition: "native ancestor event에서 closest match를 계산해 jQuery delegated handler의 context를 재현하는 helper입니다.", detail: ["root containment를 확인합니다.", "target/current semantics를 문서화합니다."] },
        { term: "AbortSignal listener lifecycle", definition: "addEventListener option signal로 component의 native listeners를 한 번에 해제하는 방식입니다.", detail: ["namespace 대안이 됩니다.", "fetch cancellation과 owner를 묶을 수 있습니다."] },
        { term: "behavior matrix", definition: "API 교체 전후 event ordering·cardinality·default action·focus·payload를 비교하는 regression 표입니다.", detail: ["실제 browser로 검증합니다.", "handler output만 보지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "native delegation으로 옮긴 뒤 currentTarget이 list라 button code가 깨진다.", likelyCause: "native currentTarget는 listener root이고 jQuery delegated currentTarget/this는 matched descendant라는 semantic 차이를 누락했습니다.", checks: ["target/currentTarget/closest match를 before/after 모두 기록합니다.", "root.contains와 selector match를 확인합니다.", "handler API가 무엇을 기대하는지 봅니다."], fix: "const match=event.target.closest(selector)로 matched element를 명시하고 handler에 전달합니다.", prevention: "nested target/future descendant/ancestor outside fixtures를 migration test에 둡니다." },
      ],
      comparisons: [
        { title: "텍스트 field 검증 시점 선택", options: [
          { name: "input", chooseWhen: "빠른 local feedback과 broad value-change coverage가 필요할 때", avoidWhen: "매 event마다 expensive network/DOM 작업을 할 때", tradeoffs: ["paste/mobile을 포착합니다.", "IME/debounce를 처리합니다."] },
          { name: "focusout", chooseWhen: "field 이탈 뒤 strict/expensive feedback이 적합할 때", avoidWhen: "사용자가 field를 떠나지 않고 submit할 path를 놓칠 때", tradeoffs: ["빈번한 update가 줄어듭니다.", "submit 검증이 여전히 필요합니다."] },
          { name: "submit", chooseWhen: "모든 current fields의 최종 client gate가 필요할 때", avoidWhen: "실시간 UX를 완전히 대체하려 할 때", tradeoffs: ["모든 submission paths를 모읍니다.", "server validation을 대체하지 않습니다."] },
        ] },
      ],
      expertNotes: [
        "event performance는 handler 개수뿐 아니라 delegation root depth, selector complexity, DOM/layout work, async request rate와 duplicate mount를 함께 측정합니다.",
        "browser automation에서 IME 실제 조합 지원이 제한되면 synthetic isComposing unit과 수동/real-device E2E를 둘 다 유지합니다.",
      ],
    },
  ],
  lab: {
    title: "접근 가능한 회원가입: 동적 field·IME·async 검사·server 오류까지 하나의 validation pipeline",
    scenario: "원본 회원가입 form을 실제 제출 가능한 component로 다시 만듭니다. 입력 방식과 DOM 동적 변경에 관계없이 한 규칙을 사용하고, 오류를 지우지 않으며, client/server 결과와 event lifecycle이 일치해야 합니다.",
    setup: [
      "lang=ko form에 username/email/password/confirm/job/intro와 각 name·label·describedby error element를 만듭니다.",
      "pure validators, renderField, validateForm, renderSummary와 server-error mapper를 분리합니다.",
      "component root·event namespace·AbortController·latest request sequence를 준비합니다.",
      "exact-output fixtures와 real requestSubmit/keyboard/IME/accessibility E2E 환경을 준비합니다.",
    ],
    steps: [
      "원본 username<2 coercion, empty password equality, msg_or, attr class overwrite와 id-only payload bugs를 test로 고정합니다.",
      "text controls는 input.validation, selection controls는 change.validation, form은 submit.validation으로 연결합니다.",
      "isComposing 중 local/async validation을 보류하고 compositionend에서 current value를 검사합니다.",
      "username async check를 debounce하고 previous request abort, sequence/current-value guard를 구현합니다.",
      "dynamic optional field/delete action을 component root delegation으로 처리하고 nested target identities를 검증합니다.",
      "HTML ValidityState와 product rules를 하나의 structured ValidationResult로 합칩니다.",
      "field message·aria-invalid·aria-describedby·live region과 submit error summary/links를 render합니다.",
      "invalid submit은 값을 보존하고 preventDefault, summary focus 후 first invalid field로 이동합니다.",
      "valid submit의 FormData expected entries를 확인하고 mock server field/global errors를 같은 UI로 재표시합니다.",
      "dispose에서 namespace handlers, debounce timer, fetch, observer를 정리하고 remount one-event-one-effect를 검증합니다.",
    ],
    expectedResult: [
      "keyboard/paste/mobile/IME와 programmatic paths에서 동일한 current value rule이 적용됩니다.",
      "dynamic descendants도 한 delegated handler로 동작하고 nested target에서도 correct item을 처리합니다.",
      "invalid values는 지워지지 않고 field relation·summary·focus로 수정 경로가 제공됩니다.",
      "FormData에는 username/email/password/passwordConfirm/job/intro names가 expected values로 들어갑니다.",
      "stale async response는 UI를 덮지 않고 server validation errors가 current inputs에 안전한 text로 매핑됩니다.",
      "remount/dispose 뒤 handler/request/timer leak 없이 한 event당 정확히 한 transition만 일어납니다.",
    ],
    cleanup: ["pending debounce/fetch를 abort하고 .off('.signup') 및 observers/timers를 정리합니다.", "password/form values와 network/debug logs를 지우고 test account data를 폐기합니다."],
    extensions: [
      "Intl.Segmenter grapheme count와 server Unicode normalization parity를 구현합니다.",
      "password manager/autofill/restored draft와 browser back-forward cache를 test합니다.",
      "jQuery event layer를 native AbortSignal delegation adapter로 교체해 behavior matrix를 비교합니다.",
      "429/offline/timeout/retry와 optimistic username state를 operational error model로 추가합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 day11 두 파일의 검증 결함을 재현하고 여섯 exact examples의 결과를 맞추세요.", requirements: ["username<2와 length truth table을 설명합니다.", "dynamic delegation identities를 출력합니다.", "IME composition skip sequence를 재현합니다.", "accessible invalid/valid submit, namespace one, id/name FormData results를 맞춥니다."], hints: ["'가'<2는 NaN comparison입니다.", "event.target과 this를 같은 것으로 가정하지 마세요."], expectedOutcome: "원본 behavior를 evidence로 교정하고 event/validation/form contracts를 exact output으로 설명합니다.", solutionOutline: ["source execution과 official API 보강을 구분합니다.", "각 example의 state transition을 표로 만듭니다."] },
    { difficulty: "응용", prompt: "동적 할 일 form에 event delegation·namespace dispose·accessible validation을 구현하세요.", requirements: ["future items와 nested icon clicks를 처리합니다.", "mount twice에도 handler가 중복되지 않습니다.", "input/change/submit을 목적별로 선택합니다.", "message relation·aria-invalid·summary·first error focus를 구현합니다.", "FormData expected names와 values를 검증합니다."], hints: ["가장 가까운 stable root에 delegation을 두세요.", "입력값을 오류 때 지우지 마세요."], expectedOutcome: "동적 DOM과 반복 lifecycle에서도 중복·누락 없이 접근 가능한 form이 완성됩니다.", solutionOutline: ["component namespace와 disposer를 먼저 만듭니다.", "pure validators 뒤 render/submit side effects를 분리합니다."] },
    { difficulty: "설계", prompt: "username 비동기 검증을 IME·debounce·취소·latest response·server constraint까지 포함해 설계하세요.", requirements: ["composition/input/focusout/submit state machine을 정의합니다.", "debounce flush와 AbortController/sequence guard를 설계합니다.", "pending/success/field error/operational error UI와 ARIA를 구분합니다.", "unique server constraint race와 structured conflict error를 포함합니다.", "privacy-safe telemetry·performance budget·rollback test를 정합니다."], hints: ["availability check는 submit 시점 uniqueness 보장이 아닙니다.", "raw username/password telemetry를 피하세요."], expectedOutcome: "stale result와 rule drift 없이 운영 가능한 end-to-end validation architecture가 완성됩니다.", solutionOutline: ["client state machine과 server authority boundary를 먼저 그립니다.", "reversed response/race/offline fixtures를 release gate로 만듭니다."] },
  ],
  reviewQuestions: [
    { question: "inventory에 연결된 파일은 모두 이번 세션 source로 사용해야 하나요?", answer: "아닙니다. 실제 내용을 감사해 주제가 다른 files는 적합한 세션으로 재귀속하고 그 사실을 coverage에 기록합니다." },
    { question: "event.target과 delegated handler의 this는 언제 다른가요?", answer: "nested descendant에서 event가 시작하면 target은 deepest node이고 this/currentTarget은 selector와 match한 element입니다." },
    { question: "event.delegateTarget은 무엇인가요?", answer: "delegated handler가 실제 등록된 stable ancestor element입니다." },
    { question: "동적으로 추가된 element에 direct handler가 자동 적용되나요?", answer: "아닙니다. stable ancestor delegation 또는 생성 시 binding이 필요합니다." },
    { question: ".off('click')과 .off('.signup')의 차이는 무엇인가요?", answer: "전자는 해당 element의 모든 click handlers를 제거할 수 있고 후자는 signup namespace 소유 handlers만 제거합니다." },
    { question: ".one('click mouseenter', handler)는 전체에서 한 번인가요?", answer: "아닙니다. element별·event type별 한 번이라 최대 두 번 실행될 수 있습니다." },
    { question: "keyup 대신 input을 쓰는 이유는 무엇인가요?", answer: "paste·mobile·voice 등 keyboard release가 아닌 value changes를 더 넓게 포착하기 때문입니다." },
    { question: "IME 조합 중 validation을 어떻게 처리하나요?", answer: "originalEvent.isComposing 중 보류하고 compositionend/current 확정 value에서 검증합니다." },
    { question: "debounce만 있으면 stale async response가 해결되나요?", answer: "아닙니다. previous request abort와 sequence/current value guard도 필요합니다." },
    { question: "원본 username < 2가 '가'를 통과시키는 이유는 무엇인가요?", answer: "문자열이 숫자로 변환되며 '가'는 NaN, NaN<2는 false라 reject branch가 실행되지 않기 때문입니다." },
    { question: "두 empty passwords가 equal이면 valid인가요?", answer: "아닙니다. required/minimum rule을 먼저 통과한 뒤 confirmation equality를 검사합니다." },
    { question: "input 값을 programmatically .val로 바꾸면 input/change가 자동 발생하나요?", answer: "아닙니다. render를 직접 호출하거나 필요한 event를 명시적으로 trigger합니다." },
    { question: "setCustomValidity error를 해제하려면 무엇을 해야 하나요?", answer: "정상 branch에서 setCustomValidity('')를 호출해야 customError가 clear됩니다." },
    { question: "id만 있고 name이 없는 control은 FormData에 들어가나요?", answer: "아닙니다. id는 DOM 식별자이고 form entry key는 name입니다." },
    { question: "form.submit()과 requestSubmit()의 핵심 차이는 무엇인가요?", answer: "submit()은 constraint validation과 submit event를 건너뛰지만 requestSubmit()은 정상 submission 절차를 수행합니다." },
    { question: "클라이언트 validation이 server validation을 대체할 수 있나요?", answer: "아닙니다. request는 우회·변조 가능하므로 server가 schema·권한·업무 규칙을 최종 검증합니다." },
  ],
  completionChecklist: [
    "inventory 네 files를 모두 읽고 day11 event/form 2개와 day12 effects 2개의 실제 scope를 교정했다.",
    "target/currentTarget/delegateTarget/this와 default action/propagation을 구분했다.",
    "direct와 delegated .on을 initial/future/nested target fixture로 검증했다.",
    "가장 가까운 stable root와 simple delegated selector를 사용했다.",
    "event namespace·handler identity·off로 idempotent mount/dispose를 만들었다.",
    ".one의 element별·event type별 once contract를 검증했다.",
    "deprecated hover를 mouseenter/leave로 옮기고 keyboard/touch functional path를 제공했다.",
    "text value에는 input, selection에는 change, 위임 focus에는 focusout, 최종에는 submit을 사용했다.",
    "IME isComposing/compositionend와 grapheme rule을 검토했다.",
    "debounce·AbortController·sequence/current-value guard로 stale async result를 막았다.",
    "실시간·submit이 같은 pure validators를 재사용했다.",
    "username coercion·email includes·empty password·trim·class overwrite·msg_or bugs를 교정했다.",
    "HTML ValidityState/setCustomValidity를 사용하고 valid에서 custom error를 clear했다.",
    "모든 submitted controls에 name을 두고 expected FormData를 검증했다.",
    "aria-describedby·aria-invalid·live message·error summary·first-error focus를 구현했다.",
    "invalid input을 지우거나 매 event마다 alert/focus하지 않았다.",
    "requestSubmit/form.submit와 client/server/operational error boundaries를 구분했다.",
    "native migration에서 jQuery delegated currentTarget와 lifecycle 차이를 behavior matrix로 test했다.",
  ],
  nextSessions: ["jquery-05-effects-slider"],
  sources: [
    { id: "web-jquery-basic-event-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day11/ex01_jquery.html", usedFor: ["hover image", "password keyup", "address checkbox change", "radio change", "programmatic val", "alert/focus/value deletion"], evidence: "실제 hover/keyup/change handlers를 input modality·non-destructive feedback·current value event 경계의 교정 근거로 사용했습니다." },
    { id: "web-jquery-form-event-source", repository: "webstudy 학습 원본", path: "myweb/src/main/webapp/day11/ex02_jquery.html", usedFor: ["keyup/blur/change/one/submit", "username coercion bug", "email/password rule drift", "class overwrite/msg_or typo", "id without name", "always preventDefault"], evidence: "회원가입 전체 code를 pure validator·accessible feedback·FormData/server boundary의 중심 audit로 사용했습니다." },
    { id: "jquery-on-api", repository: "OpenJS Foundation jQuery API", path: ".on()", publicUrl: "https://api.jquery.com/on/", usedFor: ["direct/delegated binding", "future descendants", "event namespaces", "this/target", "performance", "default/propagation"], evidence: "원본에 없는 dynamic delegation을 공식 current API contract로 정직하게 보강했습니다." },
    { id: "jquery-off-api", repository: "OpenJS Foundation jQuery API", path: ".off()", publicUrl: "https://api.jquery.com/off/", usedFor: ["namespace teardown", "event/selector/handler matching", "handler identity", "plugin best practice", "delegated removal"], evidence: "component lifecycle에서 다른 handlers를 보존하는 exact removal 기준입니다." },
    { id: "jquery-one-api", repository: "OpenJS Foundation jQuery API", path: ".one()", publicUrl: "https://api.jquery.com/one/", usedFor: ["once per element per event type", "multiple event types", "auto unbind", "delegated one"], evidence: "원본의 ‘딱 한번’ 설명을 element/event-type cardinality로 교정했습니다." },
    { id: "jquery-event-targets-api", repository: "OpenJS Foundation jQuery API", path: "event target/currentTarget/delegateTarget", publicUrl: "https://api.jquery.com/event.delegateTarget/", usedFor: ["deepest target", "matched current target", "binding root", "delegation context", "nested target"], evidence: "동적 delete exact example의 세 identities 기준입니다." },
    { id: "jquery-submit-api", repository: "OpenJS Foundation jQuery API", path: "submit event and preventDefault", publicUrl: "https://api.jquery.com/submit/", usedFor: ["form-level submit", "Enter path", "preventDefault", "current values", "event normalization"], evidence: "button click이 아닌 form submit을 final client gate로 두는 기준입니다." },
    { id: "jquery-hover-api", repository: "OpenJS Foundation jQuery API", path: ".hover()", publicUrl: "https://api.jquery.com/hover/", usedFor: ["deprecation since 3.3", "mouseenter/leave replacement", "pointer-only limitation"], evidence: "원본 bulb hover를 current event APIs와 accessible activation으로 교정했습니다." },
    { id: "ui-events-standard", repository: "W3C Web Applications Working Group", path: "UI Events", publicUrl: "https://www.w3.org/TR/uievents/", usedFor: ["input events", "composition events", "isComposing", "event order", "keyboard/IME"], evidence: "한국어 조합 중 validation 보류와 확정 event sequence의 1차 기준입니다." },
    { id: "dom-event-standard", repository: "WHATWG DOM Standard", path: "event dispatch", publicUrl: "https://dom.spec.whatwg.org/#events", usedFor: ["target/currentTarget", "bubbling", "default prevention", "listener lifecycle", "native migration"], evidence: "jQuery wrapper 아래의 platform event flow 기준입니다." },
    { id: "html-constraint-validation", repository: "WHATWG HTML Standard", path: "constraint validation", publicUrl: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation", usedFor: ["ValidityState", "required/type/minlength", "setCustomValidity", "invalid flow", "report/check validity"], evidence: "custom rule을 browser-native validation과 일관되게 결합하는 기준입니다." },
    { id: "html-forms-standard", repository: "WHATWG HTML Standard", path: "form element submission APIs", publicUrl: "https://html.spec.whatwg.org/multipage/forms.html#the-form-element", usedFor: ["submit event", "requestSubmit", "form.submit bypass", "submitter", "constraint validation"], evidence: "programmatic submission APIs와 actual integration test 경계를 검증했습니다." },
    { id: "html-form-entry-standard", repository: "WHATWG HTML Standard", path: "constructing the entry list", publicUrl: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-entry-list", usedFor: ["name/value", "successful controls", "disabled/unchecked", "FormData", "server payload"], evidence: "원본 id-only controls가 payload 0개인 이유와 fixed entries의 기준입니다." },
    { id: "wai-form-notifications", repository: "W3C Web Accessibility Initiative", path: "form user notification tutorial", publicUrl: "https://www.w3.org/WAI/tutorials/forms/notifications/", usedFor: ["field feedback", "error summary", "focus", "live region", "non-color cues"], evidence: "inline message·summary·focus와 assistive technology feedback 설계의 기준입니다." },
    { id: "ecma-relational-comparison", repository: "ECMA International", path: "abstract relational comparison", publicUrl: "https://tc39.es/ecma262/multipage/abstract-operations.html#sec-islessthan", usedFor: ["string/number coercion", "NaN comparison", "username bug truth table"], evidence: "원본 username < 2가 비숫자 한 글자를 통과시키는 language-level 원인입니다." },
    { id: "ecma-intl-segmenter", repository: "ECMA International", path: "Intl.Segmenter", publicUrl: "https://tc39.es/ecma402/#segmenter-objects", usedFor: ["grapheme segmentation", "user-perceived length", "Unicode rule", "server parity"], evidence: "UTF-16 length를 사용자 인식 글자 수로 일반화하지 않는 전문가 보강 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 2,
    uncoveredNotes: [
      "day12/ex01_jquery.html은 click handler를 포함하지만 핵심이 animate/stop queue이고 day12/ex02_jquery.html은 setInterval+animation callback ticker이므로 둘 다 jquery-05-effects-slider로 재귀속합니다.",
      "inventory가 요구한 동적 목록 event delegation은 네 원본에 존재하지 않아 공식 jQuery .on 문서와 앞 세션 dynamic insertion을 바탕으로 보강했으며 원본 evidence로 주장하지 않습니다.",
      "day11 원본의 username coercion, name 누락, rule drift, keyup/IME, destructive alert/focus/value deletion, class overwrite/msg_or, textarea first-focus deletion과 always preventDefault를 모두 교정했습니다.",
      "namespace lifecycle, IME/debounce/async race, native constraint validation, accessible summary/focus, requestSubmit/FormData와 server validation은 공식 1차 문서로 보강했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
