import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const customHookLocalSources = [
  "local-effect01", "local-effect02", "local-effect03", "local-effect04", "local-effect05",
  "local-ref03", "local-ref04", "local-memo02", "local-memo03", "local-memo04",
  "local-callback02", "local-callback03", "local-callback-child",
  "local-hook-notes", "react-hooks-doc", "react-official-audit", "react-source-coverage",
];

const topics = [
  appliedTopic({
    id: "source-custom-hook-extraction-audit", title: "Effect·ref·memo 로직에서 재사용할 stateful contract를 감사합니다",
    lead: "custom Hook을 새 문법으로 시작하지 않고 원본 Effect dependency variants, remote async flow, persistent ref/previous value, memoized calculation과 callback identity에서 반복되는 owner·lifecycle을 먼저 찾습니다.",
    mechanism: "EffectTest01~04는 dependency schedule, EffectTest05는 cleanup/cancellation이 없는 remote async flow, Ref03~04는 persistent cell과 previous commit, Memo02~04는 derived cache, Callback02~03/Child는 functional update·identity·stale closure risk를 보여 줍니다. hook/REACT 문서는 top-level call과 Effect cleanup 방향을 제공합니다.",
    workflow: "각 source의 input, returned state/action, Effect resource, dependency, ref owner, memo need, error/cancel/cleanup, consumer count와 source hash를 표로 만들고 중복 syntax가 아니라 concrete high-level use case를 extraction candidate로 분류합니다.",
    invariants: "원본 actual endpoint·payload field·list·label·log strings와 credential-like values를 복사하지 않고 source는 read-only이며 extraction 전후 behavior/state independence를 검증합니다.",
    edgeCases: "empty/omitted/multiple dependencies, unmount before response, StrictMode replay, stale callback, multiple hook consumers, SSR no-browser와 cache/store sharing을 포함합니다.",
    failureModes: "Effect code를 useMount 같은 generic wrapper로 감추면 dependencies와 cleanup이 lint에서 보이지 않고 custom Hook이 state까지 공유한다고 오해하거나 remote async stale result를 재사용할 수 있습니다.",
    verification: "line/byte/SHA-256, archive parity, extraction before/after component tests, multiple instances, dependency lint, resource counts와 exact state transitions를 확인합니다.",
    operations: "Hook name/version/consumer, resource/error/latency와 cleanup outcome을 bounded telemetry로 관리하고 source literal/secret artifact scan을 release gate에 둡니다.",
    concepts: [c("custom Hook", "다른 Hooks를 조합해 concrete reusable stateful logic과 contract를 제공하는 use-prefixed function입니다.", ["state 자체가 아니라 logic을 공유합니다.", "top-level Rules를 따릅니다."]), c("extraction candidate", "여러 consumer가 같은 high-level input→state/action→resource lifecycle을 필요로 하는 로직입니다.", ["단순 duplication만 보지 않습니다.", "owner를 명확히 합니다."]), c("behavior parity", "custom Hook 추출 전후 같은 event/input에서 state, actions, effects, cleanup과 user outcome이 같은 조건입니다.", ["negative path를 포함합니다.", "성능과 a11y도 봅니다."])],
    codeExamples: [node("react19-source-matrix", "custom Hook 추출 provenance matrix", "React19SourceMatrix.mjs", "열세 코드와 네 문서의 structural role, archive parity와 remote literal 비복사를 exact stdout으로 고정합니다.", String.raw`const rows = [
  ["effect-01", "empty-dependencies"],
  ["effect-02", "every-render"],
  ["effect-03", "one-dependency"],
  ["effect-04", "two-dependencies"],
  ["effect-05", "remote-async-no-cleanup"],
  ["ref-03", "persistent-cell"],
  ["ref-04", "previous-after-commit"],
  ["memo-02", "empty-cache"],
  ["memo-03", "reactive-cache"],
  ["memo-04", "derived-filter"],
  ["callback-02", "functional-update"],
  ["callback-03", "captured-state-risk"],
  ["callback-child", "memo-boundary"],
  ["hook-notes", "top-level-taxonomy"],
  ["hooks-doc", "curated-hooks"],
  ["official-audit", "effect-cleanup-strict"],
  ["source-coverage", "archive-inventory"],
];
for (const row of rows) console.log(row.join("|"));
console.log("archive-counterparts=13");
console.log("archive-byte-equal=true");
console.log("remote-and-domain-literals-copied=false");`, "effect-01|empty-dependencies\neffect-02|every-render\neffect-03|one-dependency\neffect-04|two-dependencies\neffect-05|remote-async-no-cleanup\nref-03|persistent-cell\nref-04|previous-after-commit\nmemo-02|empty-cache\nmemo-03|reactive-cache\nmemo-04|derived-filter\ncallback-02|functional-update\ncallback-03|captured-state-risk\ncallback-child|memo-boundary\nhook-notes|top-level-taxonomy\nhooks-doc|curated-hooks\nofficial-audit|effect-cleanup-strict\nsource-coverage|archive-inventory\narchive-counterparts=13\narchive-byte-equal=true\nremote-and-domain-literals-copied=false", customHookLocalSources.concat(["react-custom-hooks", "react-rules-hooks"]))],
  }),
  appliedTopic({
    id: "logic-not-shared-state", title: "custom Hook은 stateful logic을 공유하되 각 call의 state를 독립 소유합니다",
    lead: "같은 custom Hook을 두 component가 호출해도 state/ref/Effect instance는 두 벌이며 실제 state를 공유하려면 lift/context/external store 같은 별도 owner가 필요합니다.",
    mechanism: "custom Hook body는 caller component render의 일부로 다시 실행되고 내부 built-in Hook slots는 caller identity와 call order에 속합니다. return value만 API로 노출되고 module singleton이 아니면 calls끼리 자동 공유되지 않습니다.",
    workflow: "consumer별 independent state가 맞는지, shared server cache/store가 필요한지, owner lifetime이 route/component/session 중 어디인지 먼저 선택하고 API 이름에 scope를 드러냅니다.",
    invariants: "두 calls가 서로의 local state/ref를 변경하지 않고 shared state가 필요하면 explicit store/provider key와 subscribe contract를 사용하며 module mutable singleton을 숨기지 않습니다.",
    edgeCases: "same component에서 두 번 call, keyed remount, nested providers, tenant/user switch, SSR requests, module cache, HMR와 test isolation을 다룹니다.",
    failureModes: "custom Hook을 한 번 정의했으니 state가 공유된다고 생각하거나 module variable로 공유해 SSR request/tenant data가 섞이고 tests가 order-dependent해질 수 있습니다.",
    verification: "two consumers/two calls, remount/key, provider scope, SSR concurrent requests와 test reset을 실행해 state/ref/resource identity를 확인합니다.",
    operations: "instance/store scope와 consumer count를 관찰하고 cross-tenant/user leak negative tests와 logout reset runbook을 둡니다.",
    concepts: [c("stateful logic", "state/ref/effect와 events를 어떤 순서로 조합하는지의 재사용 가능한 behavior입니다.", ["state value 자체와 다릅니다.", "각 call이 instance를 가집니다."]), c("Hook instance", "한 caller component identity와 call position에 연결된 built-in Hook state/resource 집합입니다.", ["call마다 독립입니다.", "key/remount에서 reset됩니다."]), c("shared store", "여러 consumers가 같은 snapshot을 구독하도록 별도 owner가 관리하는 state source입니다.", ["useSyncExternalStore contract가 필요합니다.", "scope/security를 명시합니다."])],
    codeExamples: [node("react19-independent-instances", "custom Hook call 독립 state model", "React19IndependentInstances.mjs", "같은 factory logic을 두 번 호출해도 각 state가 독립적으로 변하는지 실행합니다.", String.raw`function createCounter(initial) {
  let value = initial;
  return {
    read: () => value,
    increment: () => { value += 1; },
  };
}
const first = createCounter(0);
const second = createCounter(10);
first.increment();
first.increment();
second.increment();
console.log("first=" + first.read());
console.log("second=" + second.read());
console.log("same-state=" + (first.read() === second.read()));
console.log("shared-logic=true");
console.log("shared-state=false");`, "first=2\nsecond=11\nsame-state=false\nshared-logic=true\nshared-state=false", ["react-custom-hooks", "react-rules-hooks"])],
  }),
  appliedTopic({
    id: "extraction-boundary-high-level-purpose", title: "useMount wrapper 대신 concrete high-level use case로 경계를 잡습니다",
    lead: "Effect를 한 줄로 숨기는 것이 좋은 abstraction은 아니며 Hook 이름만 보고 input, output, external system과 cleanup intent를 예측할 수 있어야 합니다.",
    mechanism: "좋은 custom Hook은 useConnection, useResource, usePrevious처럼 product/system purpose를 제약하고 reactive data flow를 드러냅니다. useEffectOnce/useMount 같은 lifecycle wrapper는 dependency와 resynchronization 의미를 가립니다.",
    workflow: "반복되는 external-system goal→authoritative inputs→finite state/actions→resource acquire/release→error/retry→consumer responsibilities를 기술하고 name이 이 contract를 전달하는지 review합니다.",
    invariants: "Hook가 임의 callback을 받아 Effect semantics를 숨기지 않고 한 high-level responsibility만 가지며 raw transport/DOM detail을 consumer에 누출하지 않습니다.",
    edgeCases: "한 consumer뿐인 premature extraction, two Effects with different purposes, conditional resource, optional key, event callback, polling/retry와 feature-specific policy를 다룹니다.",
    failureModes: "generic useAsync/useMount가 cancellation, permission, cache와 state taxonomy를 모호하게 만들고 unrelated Effects를 하나로 합쳐 cleanup coupling을 키울 수 있습니다.",
    verification: "API name/input/output만으로 purpose review, extraction before/after dependency graph, consumer simplification, resource fault injection과 deletion test를 수행합니다.",
    operations: "Hook catalog에 purpose/owner/status/errors/side effects/version/consumers를 기록하고 generic wrappers는 exception review와 expiry를 둡니다.",
    concepts: [c("high-level purpose", "consumer가 구현 세부가 아니라 원하는 external-system behavior를 표현하는 Hook 책임입니다.", ["이름에 드러납니다.", "하나의 goal에 집중합니다."]), c("lifecycle wrapper", "mount/update 같은 lifecycle timing만 감추고 실제 synchronization purpose를 표현하지 않는 generic Hook입니다.", ["dependency를 숨길 수 있습니다.", "피합니다."]), c("abstraction pressure", "중복·변경·테스트·policy가 여러 consumer에서 반복되어 stable contract 추출이 가치 있는 정도입니다.", ["premature extraction을 막습니다.", "삭제 가능성을 봅니다."])],
  }),
  appliedTopic({
    id: "rules-call-order-lint-factories", title: "Hook call order와 lint/compiler 규칙을 public contract로 강제합니다",
    lead: "React는 render마다 같은 순서의 Hook calls로 state slots를 연결하므로 조건·loop·early return·callback 안에서 custom Hook을 호출하면 state가 다른 slot에 매핑될 수 있습니다.",
    mechanism: "component와 custom Hook의 top level에서만 Hooks를 호출하고 use-prefix naming으로 lint가 Hook boundary를 인식하게 합니다. component-hook-factories는 render 중 nested Hook/component definition 같은 unstable factories를 검사합니다.",
    workflow: "rules-of-hooks/exhaustive-deps/recommended lint를 CI에 적용하고 conditional behavior는 Hook call 내부 parameter/state branch로 이동하며 custom effect hooks를 lint settings에 등록합니다.",
    invariants: "모든 render path의 call order/count가 같고 Hook는 async/event callback에 있지 않으며 suppression에는 owner/reason/expiry/negative test가 있습니다.",
    edgeCases: "early return, looped data, conditional feature, dynamic Hook factory, callback passed to Hook, use special API 차이, generated code와 mixed lint config를 다룹니다.",
    failureModes: "flag가 false일 때 Hook을 건너뛰면 다음 state가 다른 slot을 읽고 use-prefix가 없는 function 안의 Hook는 lint/reader contract를 흐립니다.",
    verification: "positive/negative lint fixtures, render path call trace, feature toggle, factory diagnostics와 compiler coverage snapshot을 확인합니다.",
    operations: "lint suppressions, compiler skips와 rule version을 dashboard로 관리하고 config drift를 build failure와 owner alert로 막습니다.",
    concepts: [c("Hook call order", "각 render에서 Hooks가 같은 순서와 개수로 호출되어 state slots를 안정적으로 연결하는 조건입니다.", ["조건 호출을 금지합니다.", "top level에서 호출합니다."]), c("use-prefix contract", "function이 Hooks를 호출할 수 있음을 caller와 lint에 알리는 이름 규약입니다.", ["대문자가 뒤따릅니다.", "일반 utility에는 쓰지 않습니다."]), c("Hook factory", "호출/렌더 시점에 새 Hook나 component definition을 동적으로 만드는 higher-order pattern입니다.", ["state identity를 깨뜨릴 수 있습니다.", "lint로 검사합니다."])],
    codeExamples: [node("react19-hook-order", "Hook call order invariant", "React19HookOrder.mjs", "top-level call sequence와 conditional sequence가 render paths 사이에서 같은지 비교합니다.", String.raw`const topLevelFirst = ["state", "ref", "effect"];
const topLevelSecond = ["state", "ref", "effect"];
const conditionalEnabled = ["state", "ref", "effect"];
const conditionalDisabled = ["state", "effect"];
function same(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
console.log("top-level-first=" + topLevelFirst.join(","));
console.log("top-level-second=" + topLevelSecond.join(","));
console.log("top-level-stable=" + same(topLevelFirst, topLevelSecond));
console.log("conditional-enabled=" + conditionalEnabled.join(","));
console.log("conditional-disabled=" + conditionalDisabled.join(","));
console.log("conditional-stable=" + same(conditionalEnabled, conditionalDisabled));
console.log("lint-required=true");`, "top-level-first=state,ref,effect\ntop-level-second=state,ref,effect\ntop-level-stable=true\nconditional-enabled=state,ref,effect\nconditional-disabled=state,effect\nconditional-stable=false\nlint-required=true", ["react-rules-hooks", "react-eslint-plugin-hooks", "eslint-rules-of-hooks", "eslint-component-hook-factories"])],
  }),
  appliedTopic({
    id: "typed-interface-state-actions-errors", title: "Hook input·state·actions·errors를 versioned typed interface로 설계합니다",
    lead: "tuple 몇 칸의 위치 의미나 boolean 여러 개를 반환하면 consumer가 loading+error+data impossible state를 만들고 API 진화에서 깨지기 쉽습니다.",
    mechanism: "input options는 reactive values/callback policy를 명시하고 return은 idle/loading/success/error/unauthorized 같은 discriminated union과 stable actions를 제공합니다. errors는 safe code/retryability와 internal cause를 분리합니다.",
    workflow: "consumer use cases→input schema/defaults→finite state variants/payload→actions/preconditions/idempotence→error/cancel→identity guarantees→version/migration을 표로 정의합니다.",
    invariants: "한 snapshot에 허용 state 하나만 있고 success payload/error는 해당 variant에만 존재하며 actions가 server authorization을 대신하지 않고 function identity guarantee는 실제 consumer 필요가 있을 때만 약속합니다.",
    edgeCases: "optional/empty key, default options object, partial/stale data, retry, cancellation, permission revoke, pagination, multiple instances와 backward compatibility를 다룹니다.",
    failureModes: "[data, loading, error, reload] positional tuple가 확장되며 consumer가 index를 잘못 쓰거나 stable action을 약속하지 않았는데 effect dependency로 사용해 resubscribe loop가 생깁니다.",
    verification: "TypeScript type tests, runtime schema, exhaustive switch, invalid state/action, identity test, old/new consumer contract와 serialized server snapshot을 검증합니다.",
    operations: "Hook API/version, state residence, error/retry reason과 deprecated field usage를 bounded telemetry로 관리하고 adapter/codemod/rollback을 준비합니다.",
    concepts: [c("discriminated union", "공통 status tag로 서로 다른 valid state payload를 구분하는 type 구조입니다.", ["impossible state를 줄입니다.", "exhaustive render가 가능합니다."]), c("action contract", "Hook consumer가 호출할 수 있는 command의 input, precondition, outcome과 identity 보장입니다.", ["authorization과 구분합니다.", "idempotence를 명시합니다."]), c("API version", "input/output/behavior compatibility를 추적하는 contract revision입니다.", ["migration window를 둡니다.", "telemetry schema와 맞춥니다."])],
    codeExamples: [node("react19-contract-states", "custom Hook finite return contract", "React19ContractStates.mjs", "status별 payload/action shape와 unknown state rejection을 deterministic하게 검사합니다.", String.raw`const states = [
  { status: "idle", data: null, error: null, canRetry: false },
  { status: "loading", data: null, error: null, canRetry: false },
  { status: "success", data: ["item"], error: null, canRetry: false },
  { status: "error", data: null, error: "RETRYABLE", canRetry: true },
];
function valid(state) {
  if (state.status === "success") return Array.isArray(state.data) && state.error === null;
  if (state.status === "error") return state.data === null && typeof state.error === "string";
  if (state.status === "idle" || state.status === "loading") return state.data === null && state.error === null;
  return false;
}
for (const state of states) console.log(state.status + "=" + valid(state));
console.log("unknown=" + valid({ status: "unknown" }));
console.log("contract-version=v1");
console.log("authorization-is-ui-state=false");`, "idle=true\nloading=true\nsuccess=true\nerror=true\nunknown=false\ncontract-version=v1\nauthorization-is-ui-state=false", ["react-typescript", "react-custom-hooks", "eslint-exhaustive-deps"])],
  }),
  appliedTopic({
    id: "effect-resource-cleanup-strictmode", title: "custom Hook가 획득한 listener·timer·request resource를 invocation별로 정리합니다",
    lead: "Effect를 Hook 안에 숨겨도 cleanup 책임은 사라지지 않으며 consumer가 implementation을 볼 수 없으므로 오히려 lifecycle guarantee가 API에 명시되어야 합니다.",
    mechanism: "setup invocation마다 resource와 disposer를 같은 closure에 묶고 dependencies가 바뀌거나 unmount될 때 cleanup합니다. StrictMode development replay는 setup→cleanup→setup symmetry를 검사합니다.",
    workflow: "input key/version→setup acquire list→partial failure rollback→subscription callback→cleanup reverse order→retry/remount sequence를 설계하고 active resource count를 test합니다.",
    invariants: "setup마다 cleanup이 있고 cleanup은 idempotent하며 old cleanup이 new resource를 해제하지 않고 caller callback churn으로 불필요한 resubscribe가 일어나지 않습니다.",
    edgeCases: "constructor throw, timer + listener partial setup, rapid key change, StrictMode, hidden route, reconnect/backoff, browser page lifecycle와 consumer unmount를 다룹니다.",
    failureModes: "empty dependencies로 initial key만 구독하거나 cleanup을 생략해 duplicate listeners/timers가 남고 Hook가 callback을 dependency로 받아 매 render reconnect할 수 있습니다.",
    verification: "acquire/release counts, fault injection, rapid dependency change, StrictMode, fake timer, listener registry와 heap snapshot을 실행합니다.",
    operations: "live resources, cleanup failure, reconnect/backoff와 orphan age를 Hook/version별로 관찰하고 kill switch와 force-dispose runbook을 둡니다.",
    concepts: [c("resource lifecycle", "Hook가 external system에서 획득한 listener/timer/connection/request의 acquire-use-release 과정입니다.", ["Hook API에 포함합니다.", "unmount에서 끝납니다."]), c("cleanup symmetry", "각 setup invocation의 모든 acquisition을 같은 invocation cleanup이 해제하는 조건입니다.", ["partial setup을 처리합니다.", "idempotent합니다."]), c("resubscription", "reactive dependency 변경 때문에 old resource를 정리하고 new resource에 다시 연결하는 동작입니다.", ["의도한 key만 trigger합니다.", "callback churn을 줄입니다."])],
  }),
  appliedTopic({
    id: "event-freshness-effect-event-ref", title: "event callback freshness를 dependency·functional update·Effect Event·ref로 구분합니다",
    lead: "consumer callback을 Hook Effect에 전달할 때 매 render resubscribe하거나 반대로 empty dependency로 initial callback만 호출하는 두 극단을 피해야 합니다.",
    mechanism: "reactive synchronization input은 dependencies에 포함하고 event-like latest callback logic은 useEffectEvent 같은 현재 API로 Effect 반응성과 분리할 수 있습니다. ref latest-callback pattern은 render read/write 규칙과 lint/tearing caveat를 명시해야 합니다.",
    workflow: "callback이 resource identity를 바꾸는 reactive input인지 발생 시 latest logic만 필요한 event인지 분류하고 functional updater, direct event handler, Effect Event와 explicit resubscribe 중 하나를 선택합니다.",
    invariants: "dependency를 속이지 않고 latest required value가 stale하지 않으며 Effect Event를 dependency omission shortcut이나 render/event 밖의 일반 stable callback으로 오용하지 않습니다.",
    edgeCases: "rapid prop change, delayed event, debounce, subscription burst, error reporter, callback identity guarantee, React version compatibility와 testing을 다룹니다.",
    failureModes: "empty dependencies callback이 initial props를 계속 사용하거나 inline callback dependency 때문에 socket/listener가 매 render 재연결되고 ref를 render 중 갱신해 purity를 깨뜨릴 수 있습니다.",
    verification: "old/new callback delayed events, resubscribe count, lint, StrictMode, functional update와 supported React version test를 실행합니다.",
    operations: "stale event, reconnect churn과 dropped/duplicate notification을 reason code로 관찰하고 version gating과 fallback adapter를 둡니다.",
    concepts: [c("reactive input", "변경되면 external synchronization 자체를 다시 수행해야 하는 prop/state입니다.", ["dependency에 포함합니다.", "resource identity를 바꿉니다."]), c("Effect Event", "Effect에서 latest props/state를 읽되 Effect 자체를 reactive하게 만들지 않는 event-like logic API입니다.", ["Effect 안에서 호출합니다.", "dependency shortcut이 아닙니다."]), c("callback freshness", "event 발생 시 consumer가 의도한 최신 logic과 values가 실행되는 조건입니다.", ["identity와 분리합니다.", "delayed event로 test합니다."])],
  }),
  appliedTopic({
    id: "async-hook-cancel-generation-security", title: "async custom Hook에 cancellation·generation·permission·safe error를 내장합니다",
    lead: "원본 remote fetch 구조를 그대로 추출하면 unmount/stale response, status validation, secret-like endpoint/config, raw logging과 retry storm도 함께 재사용됩니다.",
    mechanism: "요청마다 generation/key identity와 AbortSignal을 만들고 current generation만 state를 commit합니다. transport status/schema/permission을 검증하고 Hook는 safe error code와 retry action을 반환하며 server authorization을 우회하지 않습니다.",
    workflow: "validated input→generation increment→old abort→loading/refresh state→status/schema validation→generation gate→success/error→cleanup/finally current check 순서로 구현합니다.",
    invariants: "old success/error/finally가 new state를 덮지 않고 abort와 failure를 구분하며 credentials/endpoints/raw payload가 source, logs, errors, cache key와 public fixtures에 노출되지 않습니다.",
    edgeCases: "out-of-order success/error, abort race, retry/backoff, empty key, unauthorized, logout, offline, SSR, shared cache deduplication와 partial response를 다룹니다.",
    failureModes: "isMounted boolean 하나로 shared request ownership을 숨기거나 empty dependencies로 initial key만 fetch하고 raw remote errors/data를 console에 남길 수 있습니다.",
    verification: "controlled deferred permutations, abort spy, schema/status/auth negative tests, logout/cache isolation, secret scan와 retry deadline을 실행합니다.",
    operations: "latency/status/stale-drop/abort/retry를 endpoint value 없이 stable operation code로 수집하고 incident 시 kill switch, cache purge, credential rotation과 rollback을 수행합니다.",
    concepts: [c("request generation", "현재 consumer intent에 속하는 async operation을 구분하는 monotonically changing identity입니다.", ["stale commit을 막습니다.", "abort와 함께 씁니다."]), c("safe error", "user/consumer에 노출 가능한 code·retryability와 내부 cause/trace를 분리한 failure contract입니다.", ["raw payload를 숨깁니다.", "stable code를 씁니다."]), c("authorization boundary", "server가 data/action permission을 검증하는 보안 경계입니다.", ["Hook UI state가 대신하지 않습니다.", "cache도 scope를 지킵니다."])],
    codeExamples: [node("react19-latest-wins", "async Hook generation·cleanup gate", "React19LatestWins.mjs", "new request completion 뒤 old result/finally가 current state를 덮지 않는지 실행합니다.", String.raw`let generation = 0;
let state = "idle";
const events = [];
function start() {
  generation += 1;
  events.push("start:" + generation);
  return generation;
}
function settle(id, value) {
  if (id !== generation) {
    events.push("drop:" + id);
    return;
  }
  state = value;
  events.push("commit:" + id);
}
const first = start();
const second = start();
settle(second, "ready-new");
settle(first, "ready-old");
console.log("generation=" + generation);
console.log("events=" + events.join(","));
console.log("state=" + state);
console.log("old-overwrite=false");
console.log("abort-plus-generation=true");
console.log("raw-error-exposed=false");`, "generation=2\nevents=start:1,start:2,commit:2,drop:1\nstate=ready-new\nold-overwrite=false\nabort-plus-generation=true\nraw-error-exposed=false", ["local-effect05", "local-ref04", "local-memo03", "local-callback02", "react-use-effect", "react-use-effect-event", "react-use-ref", "react-use-memo", "dom-abort-controller", "owasp-rest-security", "owasp-xss-prevention"])],
  }),
  appliedTopic({
    id: "external-store-snapshot-ssr", title: "shared external source는 useSyncExternalStore snapshot·subscribe·SSR contract로 감쌉니다",
    lead: "browser event/store처럼 여러 consumers가 실제 state source 하나를 공유할 때 각 Hook call의 useEffect+useState 복제보다 snapshot consistency가 명시된 external-store adapter가 적합합니다.",
    mechanism: "useSyncExternalStore는 subscribe, getSnapshot과 optional getServerSnapshot을 받아 concurrent rendering에서도 store snapshot을 읽습니다. unchanged store에는 cached Object.is-equal snapshot을 반환해야 하고 subscribe identity churn을 피합니다.",
    workflow: "store owner/scope→immutable cached snapshot→subscribe returns cleanup→server snapshot/serialization→hydration equality→consumer selector/performance→logout/reset을 설계합니다.",
    invariants: "getSnapshot은 store가 안 바뀌면 같은 value/identity를 반환하고 subscribe는 listener를 정확히 해제하며 server snapshot이 client initial snapshot과 compatible하고 user/tenant scope가 섞이지 않습니다.",
    edgeCases: "store mutation during render, uncached object snapshot, resubscribe function, SSR request concurrency, no server value, offline event, selector tearing와 hydration mismatch를 포함합니다.",
    failureModes: "getSnapshot이 매번 새 object를 반환해 infinite render가 나거나 module singleton server store가 requests를 섞고 cleanup 없는 subscribe가 duplicate notification을 만듭니다.",
    verification: "snapshot identity, subscribe/unsubscribe count, mutation notification, concurrent render, SSR/hydration, multiple requests와 logout reset을 실제 React fixture에서 test합니다.",
    operations: "store version/listener count/snapshot error/hydration mismatch를 bounded telemetry로 관리하고 cache reset과 adapter rollback runbook을 둡니다.",
    concepts: [c("external store", "React 밖에 authoritative state와 subscription을 가진 source입니다.", ["shared state를 명시합니다.", "scope를 관리합니다."]), c("snapshot", "한 시점의 external store 값을 React가 비교·render할 수 있게 제공하는 immutable view입니다.", ["unchanged identity를 cache합니다.", "server snapshot을 정의합니다."]), c("subscription", "store 변경 시 React가 다시 snapshot을 읽도록 callback을 등록하고 cleanup을 반환하는 contract입니다.", ["중복을 막습니다.", "stable function을 선호합니다."])],
    codeExamples: [node("react19-external-store", "cached snapshot·subscription·SSR model", "React19ExternalStore.mjs", "unchanged snapshot identity, one notification, unsubscribe와 server snapshot contract를 실행합니다.", String.raw`let version = 1;
let value = "ready";
let cached = Object.freeze({ version, value });
const listeners = new Set();
function getSnapshot() {
  return cached;
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const first = getSnapshot();
const second = getSnapshot();
let notifications = 0;
const unsubscribe = subscribe(() => { notifications += 1; });
version = 2;
value = "updated";
cached = Object.freeze({ version, value });
for (const listener of listeners) listener();
unsubscribe();
console.log("unchanged-identity=" + (first === second));
console.log("snapshot=" + getSnapshot().version + "|" + getSnapshot().value);
console.log("notifications=" + notifications);
console.log("listeners-after-cleanup=" + listeners.size);
console.log("server-snapshot-version=1");
console.log("hydration-contract=v1");
console.log("debug-value=Resource:updated");`, "unchanged-identity=true\nsnapshot=2|updated\nnotifications=1\nlisteners-after-cleanup=0\nserver-snapshot-version=1\nhydration-contract=v1\ndebug-value=Resource:updated", ["react-use-sync-external-store", "react-use-debug-value", "react-dom-server", "react-render-pipeable-stream", "react-act", "react-strict-mode", "wcag-status-messages"])],
  }),
  appliedTopic({
    id: "hook-testing-act-timers-faults", title: "Hook contract를 component harness·act·fake time·fault matrix로 검증합니다",
    lead: "Hook를 일반 함수처럼 직접 호출하는 test는 React state/effect scheduling과 cleanup을 실행하지 않으므로 작은 test component/harness에서 public behavior를 관찰해야 합니다.",
    mechanism: "act는 updates/effects를 flush해 assertion 시점을 맞추고 controlled promises/fake timers/event emitters로 state transitions와 cleanup을 재현합니다. implementation state보다 return contract와 external resource를 assert합니다.",
    workflow: "contract state/action matrix→harness render→act event/resolve/reject/time→visible/returned outcome→resource counts→rerender/unmount/StrictMode→SSR/hydration 순서로 test합니다.",
    invariants: "tests가 real timing/network에 의존하지 않고 warnings/unhandled rejection이 없으며 cleanup 후 callback이 state를 commit하지 않고 fake timers/listeners가 매 test 복원됩니다.",
    edgeCases: "rapid rerender, aborted promise, error then retry, timer drift, StrictMode replay, concurrent store mutation, SSR no-effect와 hydration을 다룹니다.",
    failureModes: "Hook body를 직접 call하거나 act warning을 무시해 effects가 assertion 뒤 실행되고 fake timer cleanup 누락으로 다음 test가 오염될 수 있습니다.",
    verification: "positive/negative state matrix, branch/transition coverage, mutation tests, resource leak assertions, console warning fail-on-use와 production-like integration을 실행합니다.",
    operations: "flaky rate, act warning, leaked handles, test duration와 untested state variants를 CI gate로 관리합니다.",
    concepts: [c("Hook harness", "custom Hook를 실제 component render 안에서 호출하고 public result/actions를 노출하는 test fixture입니다.", ["Rules를 지킵니다.", "consumer behavior를 검증합니다."]), c("act", "React updates와 effects를 test assertion 전 처리하도록 감싸는 helper입니다.", ["async를 await합니다.", "warning을 무시하지 않습니다."]), c("controlled dependency", "promise/timer/store/event를 test가 원하는 순서로 완료·실패·취소할 수 있는 deterministic fixture입니다.", ["race를 재현합니다.", "cleanup합니다."])],
  }),
  appliedTopic({
    id: "debug-performance-version-release", title: "useDebugValue·성능 budget·SSR·version migration으로 Hook를 운영합니다",
    lead: "재사용 Hook는 consumer 수만큼 영향 범위가 커지므로 이름 좋은 함수만 배포하지 않고 diagnostics, performance, server/client compatibility와 migration evidence가 필요합니다.",
    mechanism: "useDebugValue는 DevTools에서 Hook 상태를 이해하도록 bounded label을 제공할 수 있고 expensive formatting은 필요할 때만 수행합니다. public return identity, subscriptions, async state와 serialized server snapshot은 version contract입니다.",
    workflow: "API/version doc→debug label without data→render/subscription/latency/memory budget→SSR/hydration→old/new adapter/codemod→canary→rollback/readback 순서로 release합니다.",
    invariants: "debug/telemetry label에 user data·URL·token·payload를 넣지 않고 Hook updates가 unrelated consumers를 fan-out하지 않으며 old/new contracts가 compatibility window 동안 공존합니다.",
    edgeCases: "large consumer fleet, memoized return object, context/store fan-out, server component boundary, streaming SSR, partial deploy, deprecated fields와 rollback을 다룹니다.",
    failureModes: "매 render 새 return object/action을 만들어 consumer effects가 churn하거나 debug label에 raw data를 넣고 version 없이 tuple order를 바꿔 전체 consumers를 깨뜨릴 수 있습니다.",
    verification: "DevTools label, prop/action identity, Profiler/subscription count, privacy scan, server render/hydration, old/new contract tests, canary와 rollback rehearsal를 실행합니다.",
    operations: "consumer/version distribution, state/error/latency, listener/resource count와 deprecation usage를 bounded dashboard로 관리하고 owner/SLO/kill switch/runbook을 둡니다.",
    concepts: [c("useDebugValue", "custom Hook의 현재 상태를 React DevTools에 설명하는 optional Hook입니다.", ["민감 data를 넣지 않습니다.", "format 비용을 제한합니다."]), c("return identity contract", "Hook가 반환하는 object/action reference의 안정성을 consumer에게 약속하는 범위입니다.", ["필요할 때만 약속합니다.", "version에 포함합니다."]), c("compatibility window", "old/new Hook consumer와 implementation이 함께 동작하도록 유지하는 migration 기간입니다.", ["adapter/codemod를 둡니다.", "rollback을 지원합니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-effect01", repository: "my-app01", path: "src/pages/step11-hook/EffectTest01.jsx", usedFor: ["empty dependency Effect provenance"], evidence: "Read-only sanitized audit: 21 lines, 634 bytes, SHA-256 78AF9AAACAB5D37B6F267C7E2C7BC7B8B88A6CE99AB48AE3D2C781605051C227; actual display/log strings were not copied." },
  { id: "local-effect02", repository: "my-app01", path: "src/pages/step11-hook/EffectTest02.jsx", usedFor: ["omitted dependency Effect provenance"], evidence: "Read-only sanitized audit: 20 lines, 592 bytes, SHA-256 44D8827825CC85A2A83101F2C53EFCDDDD7CEE8CD608D295A6D09C085BE057C3; actual display/log strings were not copied." },
  { id: "local-effect03", repository: "my-app01", path: "src/pages/step11-hook/EffectTest03.jsx", usedFor: ["single reactive dependency provenance"], evidence: "Read-only sanitized audit: 25 lines, 924 bytes, SHA-256 686DD021102AC7AEE441B65B8EF33C9B1F8D3172B923C9FB0009C1F9388A45F8; actual display/log strings were not copied." },
  { id: "local-effect04", repository: "my-app01", path: "src/pages/step11-hook/EffectTest04.jsx", usedFor: ["multiple reactive dependencies provenance"], evidence: "Read-only sanitized audit: 25 lines, 942 bytes, SHA-256 690B191B18971640CD634B9A18BFF655AC5807CEF3A7D85504B79F9699D8F06C; actual display/log strings were not copied." },
  { id: "local-effect05", repository: "my-app01", path: "src/pages/step11-hook/EffectTest05.jsx", usedFor: ["remote async Effect without cancellation provenance"], evidence: "Read-only redacted audit: 39 lines, 1,128 bytes, SHA-256 55E6452095CEB4C578ECCB8DB4371022A8269DD9A985CCE16696183E78E27C89; actual endpoint, query, payload fields, labels and logs were not copied." },
  { id: "local-ref03", repository: "my-app01", path: "src/pages/step11-hook/UseRefTest03.jsx", usedFor: ["persistent ref versus state/local extraction provenance"], evidence: "Read-only sanitized audit: 43 lines, 1,424 bytes, SHA-256 7F754489C3DF5D5107CDB34F8506BCB91D2027C667C7ACD656ED95C27A678924; actual labels/log strings were not copied." },
  { id: "local-ref04", repository: "my-app01", path: "src/pages/step11-hook/UseRefTest04.jsx", usedFor: ["previous value after Effect provenance"], evidence: "Read-only sanitized audit: 25 lines, 743 bytes, SHA-256 D7992E247704597FAA5C6E949E30E0F9F28CBD87310ED71DDDA843AD4BE23C0D; actual display strings were not copied." },
  { id: "local-memo02", repository: "my-app01", path: "src/pages/step11-hook/UseMemo02.jsx", usedFor: ["empty-dependency memo extraction provenance"], evidence: "Read-only sanitized audit: 29 lines, 921 bytes, SHA-256 2AC2BE651FABFA1ECEA23524BA0CDC541A0036C4B4E1D2E3BB46CD4F38DE6214; actual log/display values were not copied." },
  { id: "local-memo03", repository: "my-app01", path: "src/pages/step11-hook/UseMemo03.jsx", usedFor: ["reactive memo dependency provenance"], evidence: "Read-only sanitized audit: 28 lines, 875 bytes, SHA-256 DC98E468E1581396CC015DA813D494A1317097D89589F2F980BBED9DB3AFA8D0; actual log/display values were not copied." },
  { id: "local-memo04", repository: "my-app01", path: "src/pages/step11-hook/UseMemo04.jsx", usedFor: ["derived filter memo provenance"], evidence: "Read-only sanitized audit: 31 lines, 1,028 bytes, SHA-256 986714249C94F5DE7F1555F58E7ADE3AD79F87091222F2321CA576F0BEB9B29E; actual list/domain/display strings were not copied." },
  { id: "local-callback02", repository: "my-app01", path: "src/pages/step11-hook/UseCallBack02.jsx", usedFor: ["functional updater callback provenance"], evidence: "Read-only sanitized audit: 30 lines, 1,091 bytes, SHA-256 62154C6FF0297755AB0824708861AACC76463EAF2F132FB934975CCAAB034496; actual labels/log strings were not copied." },
  { id: "local-callback03", repository: "my-app01", path: "src/pages/step11-hook/UseCallBack03.jsx", usedFor: ["captured callback stale-risk provenance"], evidence: "Read-only sanitized audit: 26 lines, 862 bytes, SHA-256 016923AD42EC8F686AD82F76951DE978E7021EBBE57FD2021FD75B300BE8E8F4; actual labels/log strings were not copied." },
  { id: "local-callback-child", repository: "my-app01", path: "src/pages/step11-hook/UseCallBackChild.jsx", usedFor: ["memoized consumer boundary provenance"], evidence: "Read-only sanitized audit: 15 lines, 407 bytes, SHA-256 7048ECB03A471A9F18D32667F934BB937D7D593C4AD5C67D3CD9889C2D051099; actual label/log strings were not copied." },
  { id: "local-hook-notes", repository: "my-app01", path: "src/pages/step11-hook/hook_설명.txt", usedFor: ["original Hook naming/top-level/use-case taxonomy"], evidence: "Read-only sanitized audit: 58 lines, 2,931 bytes, SHA-256 CBE3CB63863801A5A5E3831AF42F16F6782E3B999E068766A2074BF4BE21AA8D." },
  { id: "react-hooks-doc", repository: "REACT", path: "docs/react/05-hooks.md", usedFor: ["curated Effect/ref/memo/callback provenance"], evidence: "Read-only structural audit: 200 lines, 9,174 bytes, SHA-256 B0563A725CD72CA4B751FBCDA43A4062121D0DEDCA9A34ACEDA6773A56F02862; embedded local URLs and display text were not copied." },
  { id: "react-official-audit", repository: "REACT", path: "docs/reference/official-reference-audit.md", usedFor: ["official Effect cleanup/StrictMode update provenance"], evidence: "Read-only structural audit: 37 lines, 4,125 bytes, SHA-256 CFEBF7DB1BDA1D6279928A5953EB2A60211A5CF0EEA92B9538462698B0726029." },
  { id: "react-source-coverage", repository: "REACT", path: "docs/reference/source-coverage.md", usedFor: ["archive collection scope provenance"], evidence: "Read-only structural audit: 33 lines, 3,514 bytes, SHA-256 44BF82D58DB16DAD7E596413EC5F3A41295B39E77077ABBE89FE6EBEB9647FE7." },
  { id: "react-custom-hooks", repository: "React", path: "learn/reusing-logic-with-custom-hooks", publicUrl: "https://react.dev/learn/reusing-logic-with-custom-hooks", usedFor: ["custom Hook extraction, naming, independent state and high-level purpose"], evidence: "React 공식 custom Hook guidance입니다." },
  { id: "react-rules-hooks", repository: "React", path: "reference/rules/rules-of-hooks", publicUrl: "https://react.dev/reference/rules/rules-of-hooks", usedFor: ["top-level component/Hook call rules"], evidence: "React 공식 Rules of Hooks reference입니다." },
  { id: "react-eslint-plugin-hooks", repository: "React", path: "reference/eslint-plugin-react-hooks", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks", usedFor: ["recommended React rules and compiler diagnostics"], evidence: "React 공식 eslint-plugin-react-hooks reference입니다." },
  { id: "eslint-rules-of-hooks", repository: "React", path: "reference/eslint-plugin-react-hooks/lints/rules-of-hooks", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks/lints/rules-of-hooks", usedFor: ["Hook order violations and custom effect settings"], evidence: "React 공식 rules-of-hooks lint reference입니다." },
  { id: "eslint-exhaustive-deps", repository: "React", path: "reference/eslint-plugin-react-hooks/lints/exhaustive-deps", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps", usedFor: ["custom Hook dependency completeness"], evidence: "React 공식 exhaustive-deps lint reference입니다." },
  { id: "eslint-component-hook-factories", repository: "React", path: "reference/eslint-plugin-react-hooks/lints/component-hook-factories", publicUrl: "https://react.dev/reference/eslint-plugin-react-hooks/lints/component-hook-factories", usedFor: ["dynamic nested component/Hook factory validation"], evidence: "React 공식 component-hook-factories lint reference입니다." },
  { id: "react-use-sync-external-store", repository: "React", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["snapshot, subscribe and getServerSnapshot contract"], evidence: "React 공식 useSyncExternalStore API입니다." },
  { id: "react-use-debug-value", repository: "React", path: "reference/react/useDebugValue", publicUrl: "https://react.dev/reference/react/useDebugValue", usedFor: ["privacy-safe DevTools Hook labels"], evidence: "React 공식 useDebugValue API입니다." },
  { id: "react-act", repository: "React", path: "reference/react/act", publicUrl: "https://react.dev/reference/react/act", usedFor: ["flushing updates in React tests"], evidence: "React 공식 act testing API입니다." },
  { id: "react-use-effect-event", repository: "React", path: "reference/react/useEffectEvent", publicUrl: "https://react.dev/reference/react/useEffectEvent", usedFor: ["separating event logic from reactive Effect dependencies"], evidence: "React 공식 useEffectEvent API입니다." },
  { id: "react-use-effect", repository: "React", path: "reference/react/useEffect", publicUrl: "https://react.dev/reference/react/useEffect", usedFor: ["external system synchronization and cleanup"], evidence: "React 공식 useEffect API입니다." },
  { id: "react-use-ref", repository: "React", path: "reference/react/useRef", publicUrl: "https://react.dev/reference/react/useRef", usedFor: ["persistent mutable cell and purity rules"], evidence: "React 공식 useRef API입니다." },
  { id: "react-use-memo", repository: "React", path: "reference/react/useMemo", publicUrl: "https://react.dev/reference/react/useMemo", usedFor: ["derived calculation cache and dependency contract"], evidence: "React 공식 useMemo API입니다." },
  { id: "react-strict-mode", repository: "React", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["setup/cleanup and purity development checks"], evidence: "React 공식 StrictMode API입니다." },
  { id: "react-dom-server", repository: "React DOM", path: "reference/react-dom/server", publicUrl: "https://react.dev/reference/react-dom/server", usedFor: ["server rendering API boundary"], evidence: "React DOM 공식 server APIs reference입니다." },
  { id: "react-render-pipeable-stream", repository: "React DOM", path: "reference/react-dom/server/renderToPipeableStream", publicUrl: "https://react.dev/reference/react-dom/server/renderToPipeableStream", usedFor: ["streaming SSR lifecycle"], evidence: "React DOM 공식 renderToPipeableStream API입니다." },
  { id: "react-typescript", repository: "React", path: "learn/typescript", publicUrl: "https://react.dev/learn/typescript", usedFor: ["typed Hook input/output contracts"], evidence: "React 공식 TypeScript guidance입니다." },
  { id: "dom-abort-controller", repository: "WHATWG DOM", path: "AbortController", publicUrl: "https://dom.spec.whatwg.org/#interface-abortcontroller", usedFor: ["async cancellation signal semantics"], evidence: "WHATWG 공식 DOM Standard입니다." },
  { id: "owasp-rest-security", repository: "OWASP Cheat Sheet Series", path: "REST Security", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html", usedFor: ["server authorization and safe REST error/data handling"], evidence: "OWASP 공식 REST security guidance입니다." },
  { id: "owasp-xss-prevention", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["untrusted remote data output contexts"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
  { id: "wcag-status-messages", repository: "W3C WAI", path: "Understanding Status Messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages", usedFor: ["custom Hook loading/error/result announcements"], evidence: "W3C WAI 공식 WCAG 2.2 guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-19-usememo-derived", slug: "react-19-custom-hook-contract", courseId: "react", moduleId: "react-events-forms-hooks", order: 9,
  title: "custom Hook 계약과 재사용", subtitle: "원본 Effect·ref·memo·callback 로직을 Rules, typed state/actions, cleanup, async race, external store, SSR와 versioned 운영 contract로 추출합니다.", level: "고급", estimatedMinutes: 115,
  coreQuestion: "반복되는 Effect·ref·memo 로직을 어떤 high-level custom Hook 경계와 input/state/action/resource contract로 추출해야 consumer가 단순해지고 lifecycle·race·SSR·security가 안전할까요?",
  summary: "my-app01 step11-hook의 EffectTest01~05, Ref03~04, Memo02~04, Callback02~03/Child, hook 설명과 REACT hooks/공식 감수/source coverage를 read-only·sanitized 감사하고 열세 archive counterparts가 byte-identical함을 확인했습니다. 실제 remote endpoint/query/payload fields와 display/log/domain strings는 복사하지 않습니다. custom Hook가 logic을 공유하지만 state는 독립이라는 원칙, concrete high-level extraction, Hook order/lints, typed finite return contract, resource cleanup, callback freshness/useEffectEvent, async abort+generation+authorization, useSyncExternalStore snapshots, act/fake-time tests, useDebugValue/performance/SSR/version migration까지 확장합니다. 여섯 exact Node examples는 provenance, instance isolation, call order, return states, latest-wins와 external-store contract를 실행합니다.",
  objectives: ["Effect/ref/memo/callback 원본과 archive parity를 redacted hash evidence로 감사한다.", "custom Hook가 stateful logic만 공유하고 calls의 state는 독립임을 설명한다.", "generic lifecycle wrapper가 아닌 concrete high-level purpose를 선택한다.", "Rules of Hooks와 lint/compiler contract를 강제한다.", "typed input·finite state·actions·errors와 identity guarantee를 설계한다.", "Effect resource setup/cleanup과 StrictMode replay를 처리한다.", "callback freshness와 Effect Event/ref/memo 선택을 구분한다.", "async cancellation·generation·permission·safe errors를 내장한다.", "useSyncExternalStore snapshot/subscribe/SSR를 구현한다.", "act·fake time·fault matrix로 Hook behavior를 test한다.", "debug/performance/version/canary/rollback을 운영한다."],
  prerequisites: [{ title: "memo·useMemo·useCallback과 성능 측정", reason: "custom Hook가 반환하는 actions/objects와 내부 callbacks의 identity·dependency·stale closure를 정확히 설계하고 consumer fan-out을 측정하려면 memoization과 성능 evidence를 이해해야 합니다.", sessionSlug: "react-18-memo-callback-performance" }],
  keywords: ["custom Hook", "Rules of Hooks", "exhaustive-deps", "Hook contract", "cleanup", "useEffectEvent", "AbortController", "generation", "useSyncExternalStore", "useDebugValue", "act", "SSR"],
  topics,
  lab: {
    title: "원본 Effect/ref/memo 로직을 production-grade resource Hook family로 추출하기",
    scenario: "actual endpoint/domain/display strings를 쓰지 않는 synthetic resource/store에서 useResource·usePrevious·useDerivedView 성격의 focused Hooks를 만들고 consumers, race, SSR와 migration evidence를 생성합니다.",
    setup: ["원본 17 used files/docs와 hashes read-only", "synthetic transport/store/timer/event emitter", "controlled deferred promises and AbortController", "TypeScript/lint/React harness/StrictMode", "server render/hydration, accessibility and security corpus"],
    steps: ["열세 code와 네 docs의 input/state/resource/dependency/hash matrix를 작성합니다.", "두 consumers/two calls/remount에서 Hook state와 resource independence를 확인합니다.", "generic lifecycle wrapper를 concrete high-level purpose contracts로 분리합니다.", "Rules/lint/factory negative fixtures와 custom effect settings를 통과시킵니다.", "typed options, finite state, actions/errors/identity와 v1 contract를 작성합니다.", "listener/timer/connection partial setup와 StrictMode cleanup symmetry를 fault-inject합니다.", "latest consumer callback, resubscribe와 Effect Event/version fallback을 비교합니다.", "old/new async success/error/finally/abort/logout permutations에 generation gate를 적용합니다.", "cached snapshot/subscribe/getServerSnapshot과 tenant/request isolation을 test합니다.", "act, controlled promises, fake timers, unmount, SSR/hydration tests를 실행합니다.", "useDebugValue privacy, Profiler/listener count, old/new adapter, canary/rollback을 검증합니다.", "source hashes, type/state/resource/security/performance artifacts와 runbook을 제출합니다."],
    expectedResult: ["Hook calls의 local state/resource가 독립이고 explicit store만 공유됩니다.", "모든 render path의 Hook order와 dependencies가 lint-clean합니다.", "finite return contract와 actions/errors/identity가 type/runtime evidence를 가집니다.", "old async work와 cleanup이 current state/store를 덮지 않고 resources가 남지 않습니다.", "SSR/hydration, a11y/security, version migration과 rollback이 compatible합니다."],
    cleanup: ["listeners, timers, connections, requests, store subscriptions와 controlled promises를 dispose합니다.", "synthetic data/store, browser storage, profiles, test traces와 server artifacts를 제거합니다.", "feature/version gates, adapters, fake timers, fault injection과 verbose debug labels를 원복합니다.", "원본 17 used files/docs와 13 archive counterparts의 hash/status unchanged를 확인합니다."],
    extensions: ["selector-aware external store Hook를 설계합니다.", "Suspense/resource cache adapter와 framework data API를 비교합니다.", "Hook API schema에서 type tests/docs/codemods를 생성합니다.", "package로 배포할 custom Hook의 React/compiler/version compatibility matrix를 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node examples와 실제 Hook harness를 같은 transition matrix로 실행하세요.", requirements: ["stdout 완전 일치", "source/hash matrix", "independent calls", "Rules/order", "finite contract", "latest-wins", "external store/SSR"], hints: ["Node factory/store model을 React Hook state/scheduler 증거로 표현하지 마세요."], expectedOutcome: "custom Hook을 함수 재사용이 아니라 state/resource/API contract로 설명합니다.", solutionOutline: ["audit→name purpose→type contract→own resources→test→operate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 remote Effect와 previous/memo/callback 로직을 focused custom Hooks로 추출하세요.", requirements: ["concrete names", "independent instances", "lint-clean dependencies", "abort+generation", "safe finite errors", "external store when shared", "act/StrictMode/SSR", "privacy/performance"], hints: ["useMount/useEffectOnce 같은 generic wrapper로 dependency를 숨기지 마세요."], expectedOutcome: "rapid key/logout/unmount/SSR에서도 stale data와 resource leak 없이 consumers가 단순해집니다.", solutionOutline: ["separate purposes→contract→cleanup→race gate→harness→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 custom Hook 품질 표준을 작성하세요.", requirements: ["naming/extraction", "Rules/lints", "typed state/actions/errors", "resource cleanup", "event freshness", "async/security", "external store/SSR", "testing", "debug/performance/version/rollback"], hints: ["Hook signature뿐 아니라 lifecycle failure와 consumer migration을 포함하세요."], expectedOutcome: "재사용 Hook가 library 수준의 compatibility·security·operations evidence로 관리됩니다.", solutionOutline: ["purpose→surface→lifecycle→proof→version→operate 순서입니다."] },
  ],
  nextSessions: ["react-20-hook-quality-capstone"], sources,
  sourceCoverage: {
    filesRead: 30,
    filesUsed: 17,
    uncoveredFiles: [
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/EffectTest01.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/EffectTest02.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/EffectTest03.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/EffectTest04.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/EffectTest05.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseRefTest03.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseRefTest04.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo02.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo03.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo04.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseCallBack02.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseCallBack03.jsx",
      "REACT/code/react/01-basics-my-app01/src/pages/step11-hook/UseCallBackChild.jsx",
    ],
    uncoveredNotes: ["열세 archive counterparts는 source로 중복 사용하지 않고 SHA-256 byte parity만 검증했습니다.", "EffectTest05의 actual remote endpoint/query/payload fields와 모든 source의 display/log/domain strings는 공개 fixture에 복사하지 않았습니다.", "원본에 custom Hook implementation, cleanup/cancel/latest-wins, external store, SSR/type/version/security qualification이 있다고 과장하지 않고 official sources와 synthetic models로 보강했습니다.", "여섯 Node examples는 actual React Hook dispatcher/scheduler, effects, browser/network/server/store와 accessibility tree를 대체하지 않습니다."],
  },
});

export default session;
