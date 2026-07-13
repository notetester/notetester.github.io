import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-reducer-audit", title: "세 reducer 원본을 action·purity·input invariant로 감사합니다",
    lead: "counter와 두 transaction 예제를 읽어 state shape, action type/payload, default branch, input parsing, validation owner와 reducer side effect를 실제 실행 경로로 추적합니다.",
    mechanism: "UseReducerTest01은 known actions에는 새 object를 반환하지만 unknown action default가 없어 undefined가 됩니다. Test02/03은 빈 number input이 NaN으로 흐를 수 있고 Test03은 reducer 안에서 alert를 호출해 purity를 깨뜨립니다.",
    workflow: "각 action의 runtime schema, precondition, next state, rejected result와 external command를 표로 만들고 원본 주석·browser input·React reducer contract를 분리합니다.",
    invariants: "원본은 read-only이고 실제 기관·금액·message 문자열은 복제하지 않으며 reducer가 server transaction, authorization 또는 durable ledger를 구현한다고 과장하지 않습니다.",
    edgeCases: "unknown action, missing/wrong/NaN/Infinity/negative/fraction payload, insufficient value, repeated dispatch, overflow, StrictMode development call과 rollback을 포함합니다.",
    failureModes: "UI handler가 막는다는 가정만으로 reducer를 열어 두면 다른 caller/test가 invalid action을 넣고 undefined/NaN state 또는 duplicate alert를 만듭니다.",
    verification: "네 원본의 hash·lines·bytes, action truth table, pure double invocation, malformed input corpus, actual React dispatch와 accessible failure feedback을 실행합니다.",
    operations: "action type, accepted/rejected reason과 transition latency만 기록하고 payload·balance-like value·기관/사용자 data는 telemetry에 남기지 않습니다.",
    concepts: [
      c("reducer provenance", "state/action/transition 주장이 어느 원본 branch와 공식 contract에서 왔는지 연결한 evidence입니다.", ["원본 결함을 숨기지 않습니다.", "보강 설계와 구분합니다."]),
      c("unknown-action policy", "허용 목록에 없는 action을 same-state, explicit failure 또는 development throw 중 어떻게 처리할지 정한 규칙입니다.", ["undefined를 반환하지 않습니다.", "환경별 전략을 문서화합니다."]),
      c("pure transition", "현재 state와 validated action만으로 외부 부작용 없이 next state를 계산하는 함수입니다.", ["alert/network/storage를 포함하지 않습니다.", "재실행에 안전합니다."]),
    ],
    codeExamples: [node("react21-source-audit", "원본 reducer risk inventory", "React21SourceAudit.mjs", "세 원본의 default, parsing과 side-effect 구조를 synthetic audit codes로 고정합니다.", String.raw`const findings = [
  { source: "counter", defaultReturn: false, reducerEffect: false, parseRisk: false },
  { source: "transaction-handler", defaultReturn: true, reducerEffect: false, parseRisk: true },
  { source: "transaction-reducer", defaultReturn: true, reducerEffect: true, parseRisk: true },
];
for (const item of findings) {
  const risks = [!item.defaultReturn && "unknown-undefined", item.reducerEffect && "effect-in-reducer", item.parseRisk && "nan-input"].filter(Boolean);
  console.log(item.source + "=" + (risks.join(",") || "none"));
}`, "counter=unknown-undefined\ntransaction-handler=nan-input\ntransaction-reducer=effect-in-reducer,nan-input", ["local-reducer-01", "local-reducer-02", "local-reducer-03", "local-reducer-guide"])]
  }),
  appliedTopic({
    id: "reducer-dispatch-queue", title: "useReducer의 state·dispatch·reducer·initializer 흐름을 queue로 추적합니다",
    lead: "dispatch가 state를 즉시 대입하는 함수라고 생각하지 않고 action을 React에 전달해 다음 render에서 reducer가 queued state를 계산하는 요청으로 이해합니다.",
    mechanism: "useReducer는 현재 state와 stable dispatch를 반환합니다. dispatch(action)는 다음 state 계산을 요청하고 React가 reducer에 pending state와 action을 순서대로 적용한 뒤 Object.is 결과와 rendering을 처리합니다.",
    workflow: "event snapshot, dispatched actions, reducer input/output, next render와 commit을 timeline으로 기록하고 같은 event의 여러 actions를 왼쪽부터 reduce합니다.",
    invariants: "reducer는 항상 valid state를 반환하고 current state를 mutate하지 않으며 dispatch 후 실행 중 handler의 state snapshot이 즉시 바뀐다고 가정하지 않습니다.",
    edgeCases: "multiple dispatches, same-state result, replace-like reset, lazy initializer, action order, startTransition integration과 aborted render를 포함합니다.",
    failureModes: "dispatch 뒤 old state log를 next state로 오해하거나 reducer가 input state를 mutate하면 prior snapshots와 reference-based update detection이 깨집니다.",
    verification: "action sequence pure reduce, actual event multiple dispatch, old/new snapshot log, reference assertions와 development/production final-state parity를 확인합니다.",
    operations: "dispatch count보다 accepted transition과 user outcome을 관찰하고 React/runtime upgrade에서 queue assumptions를 official contract와 canary로 다시 검증합니다.",
    concepts: [
      c("dispatch", "action을 reducer state queue에 전달해 다음 state 계산을 요청하는 React 제공 함수입니다.", ["state를 즉시 반환하지 않습니다.", "identity는 안정적입니다."]),
      c("reducer queue", "한 state slot에 순서대로 적용될 dispatched actions의 논리적 sequence입니다.", ["각 action은 앞선 next state를 받습니다.", "순서가 의미입니다."]),
      c("lazy initializer", "initialArg에서 초기 state를 순수하게 계산하도록 useReducer 세 번째 인수로 제공하는 함수입니다.", ["expensive initialization을 분리합니다.", "migration/validation을 고려합니다."]),
    ],
    codeExamples: [node("react21-dispatch-queue", "ordered reducer action queue", "React21Queue.mjs", "counter actions를 순서대로 적용해 dispatch order와 unknown same-state policy를 exact output으로 확인합니다.", String.raw`function reducer(state, action) {
  if (action.type === "increment") return { count: state.count + 1 };
  if (action.type === "decrement") return { count: state.count - 1 };
  if (action.type === "reset") return { count: action.value };
  return state;
}
const actions = [{ type: "increment" }, { type: "increment" }, { type: "decrement" }, { type: "unknown" }];
const final = actions.reduce(reducer, { count: 0 });
console.log("count=" + final.count);
console.log("actions=" + actions.map((action) => action.type).join("->"));
console.log("valid=" + Number.isInteger(final.count));`, "count=1\nactions=increment->increment->decrement->unknown\nvalid=true", ["react-use-reducer", "react-extract-reducer", "react-queue", "local-reducer-01"])]
  }),
  appliedTopic({
    id: "action-schema-discriminated-union", title: "action을 discriminated union과 runtime parser로 제한합니다",
    lead: "type 문자열과 arbitrary payload object를 자유롭게 dispatch하지 않고 action별 required fields, units, ranges, version과 authorization-independent intent를 finite contract로 정의합니다.",
    mechanism: "TypeScript discriminated union은 compile-time exhaustive narrowing을 돕지만 untrusted network/storage/JavaScript caller는 runtime parser가 필요합니다. parsed action만 reducer에 전달합니다.",
    workflow: "domain event 이름을 past/intent convention으로 정하고 type별 payload schema와 stable error codes를 만든 뒤 raw DOM input→parse/normalize→validated action→reducer로 흐르게 합니다.",
    invariants: "action payload는 최소·immutable하고 unknown/additional sensitive fields를 projection에서 제거하며 numeric input은 finite integer/range/unit을 확인하고 NaN을 허용하지 않습니다.",
    edgeCases: "missing type, unknown type, numeric string, empty string, whitespace, NaN/Infinity, negative/zero, oversized value, extra prototype keys와 action version을 포함합니다.",
    failureModes: "parseInt empty result NaN은 negative comparison을 통과할 수 있고 Type assertion만 사용하면 runtime wrong shape가 reducer에 들어가며 generic payload는 least authority를 깨뜨립니다.",
    verification: "positive/negative runtime corpus, TypeScript exhaustive never, forbidden-field projection, fuzz boundary와 DOM validity/valueAsNumber behavior를 확인합니다.",
    operations: "schema failure를 action/version/reason code로 집계하고 raw input/payload는 저장하지 않으며 action version migration과 producer inventory를 관리합니다.",
    concepts: [
      c("discriminated union", "공통 literal type field로 각 action variant와 payload shape를 구분하는 type입니다.", ["exhaustive switch를 돕습니다.", "runtime validation은 별도입니다."]),
      c("action parser", "unknown input을 allowed action union으로 validate·normalize하거나 stable failure로 거부하는 boundary입니다.", ["reducer 전에 둡니다.", "추가 fields를 제거합니다."]),
      c("finite number", "NaN과 ±Infinity가 아니며 domain range·precision·unit을 만족하는 numeric value입니다.", ["input type=number도 자동 보장하지 않습니다.", "Number.isFinite를 사용합니다."]),
    ],
    codeExamples: [node("react21-action-parser", "unknown action runtime parser", "React21ActionParser.mjs", "raw action에서 allowed types와 finite positive integer amount를 검사해 exact results를 반환합니다.", String.raw`function parse(value) {
  if (!value || typeof value !== "object") return { ok: false, code: "object-required" };
  if (value.type === "reset") return { ok: true, action: { type: "reset" } };
  if (!["credit", "debit"].includes(value.type)) return { ok: false, code: "unknown-type" };
  if (!Number.isSafeInteger(value.amount) || value.amount <= 0) return { ok: false, code: "invalid-amount" };
  return { ok: true, action: { type: value.type, amount: value.amount } };
}
console.log(JSON.stringify(parse({ type: "credit", amount: 3, secret: "drop" })));
console.log(JSON.stringify(parse({ type: "debit", amount: Number.NaN })));
console.log(JSON.stringify(parse({ type: "other", amount: 1 })));`, "{\"ok\":true,\"action\":{\"type\":\"credit\",\"amount\":3}}\n{\"ok\":false,\"code\":\"invalid-amount\"}\n{\"ok\":false,\"code\":\"unknown-type\"}", ["typescript-discriminated", "html-number-input", "local-reducer-02", "local-reducer-03"])]
  }),
  appliedTopic({
    id: "pure-reducer-unknown-action", title: "reducer purity·immutability·unknown action 정책을 executable invariant로 만듭니다",
    lead: "switch 문을 썼다는 사실보다 same inputs→same next state, no side effects, no mutation과 total return을 모든 branch에서 보장합니다.",
    mechanism: "React는 development에서 reducer/initializer를 추가 호출해 impurity를 찾을 수 있습니다. alert, network, storage, random/time과 global counters는 reducer 밖 event/effect command boundary로 이동합니다.",
    workflow: "input state/action을 freeze하고 reducer를 두 번 실행해 equivalent result와 zero external calls를 검사하며 unknown action은 documented same-state 또는 exhaustive development failure로 처리합니다.",
    invariants: "모든 allowed action은 valid new/same state를 반환하고 input은 보존되며 rejected domain transition도 state의 typed error/status로 표현하거나 caller result로 분리합니다.",
    edgeCases: "unknown action, same-value transition, nested array/object, Date/random, development double call, exception, logging과 analytics를 포함합니다.",
    failureModes: "reducer alert는 duplicate call에서 두 번 보일 수 있고 no-default switch는 undefined를 반환하며 push/direct property assignment는 past state를 오염시킵니다.",
    verification: "deep freeze, double invocation, side-effect sentinel, every action branch, unknown action와 StrictMode actual component test를 실행합니다.",
    operations: "reducer exception을 payload와 함께 log하지 않고 stable action/error code와 version만 기록하며 impurity regression을 release blocker로 둡니다.",
    concepts: [
      c("total reducer", "허용·비허용 입력 정책을 포함해 모든 실행 경로가 valid state 또는 명시적 failure를 만드는 reducer입니다.", ["undefined를 반환하지 않습니다.", "branch coverage가 필요합니다."]),
      c("reducer purity", "state/action 외 외부 값을 읽거나 바꾸지 않고 deterministic next state를 반환하는 성질입니다.", ["alert도 side effect입니다.", "StrictMode로 검사합니다."]),
      c("same-state rejection", "허용되지 않은 transition에서 기존 state reference를 유지하고 별도 reason을 반환/관찰하는 정책입니다.", ["silent failure와 구분합니다.", "UI feedback 경계를 정합니다."]),
    ],
    codeExamples: [node("react21-pure-reducer", "pure reducer double-invocation test", "React21Pure.mjs", "같은 frozen state/action을 두 번 줄 때 equivalent next state와 input 보존을 확인합니다.", String.raw`const state = Object.freeze({ value: 5, status: "ready" });
const action = Object.freeze({ type: "decrease", amount: 2 });
function reducer(current, event) {
  if (event.type !== "decrease") return current;
  if (event.amount > current.value) return { ...current, status: "rejected" };
  return { value: current.value - event.amount, status: "ready" };
}
const first = reducer(state, action);
const second = reducer(state, action);
console.log("equivalent=" + (JSON.stringify(first) === JSON.stringify(second)));
console.log("input=" + JSON.stringify(state));
console.log("result=" + JSON.stringify(first));`, "equivalent=true\ninput={\"value\":5,\"status\":\"ready\"}\nresult={\"value\":3,\"status\":\"ready\"}", ["react-purity", "react-strict-mode", "react-use-reducer", "local-reducer-03"])]
  }),
  appliedTopic({
    id: "state-machine-invariants", title: "boolean 조합을 finite state machine과 guarded transitions로 바꿉니다",
    lead: "복잡한 reducer를 큰 switch로만 만들지 않고 허용 states, events, guards와 impossible transitions를 명시해 loading/error/ready/pending 같은 lifecycle을 설명 가능하게 만듭니다.",
    mechanism: "finite state machine은 현재 state tag와 event 조합에 따라 next tag/data를 선택하고 guard가 domain precondition을 확인합니다. 허용되지 않은 transition은 stable rejection을 냅니다.",
    workflow: "state nodes와 event edges를 그려 terminal/transient states, guard, retry/cancel과 error recovery를 정하고 reducer에서 transition table 또는 exhaustive switch로 구현합니다.",
    invariants: "한 시점에 하나의 state tag만 존재하고 tag별 required data가 완전하며 pending 중 duplicate action과 terminal state의 invalid event 정책을 명시합니다.",
    edgeCases: "double submit, cancel after success, retry from non-error, stale response, timeout, optimistic rollback, offline and restored persisted state를 포함합니다.",
    failureModes: "isLoading/isError/isSuccess booleans는 동시에 true가 될 수 있고 guard를 UI disabled에만 두면 programmatic dispatch가 invariant를 우회합니다.",
    verification: "state×event transition matrix, unreachable-state analysis, invalid transition corpus, random action sequences와 UI disabled/announcement parity를 확인합니다.",
    operations: "state tag와 transition result reason을 낮은 cardinality로 관찰하고 stuck transient state timeout, retry budget과 recovery runbook을 둡니다.",
    concepts: [
      c("finite state machine", "유한한 상태 집합과 event별 transition/guard로 lifecycle을 표현하는 모델입니다.", ["boolean 조합을 줄입니다.", "모든 edge를 테스트합니다."]),
      c("transition guard", "현재 state와 validated event가 transition을 허용하는지 판단하는 순수 조건입니다.", ["UI disable과 중복 방어합니다.", "authorization을 대체하지 않습니다."]),
      c("impossible state", "product contract상 동시에 존재할 수 없지만 느슨한 state shape에서는 표현 가능한 조합입니다.", ["union/tag로 제거합니다.", "decoder에서도 차단합니다."]),
    ],
    codeExamples: [node("react21-state-machine", "finite request machine transition table", "React21Machine.mjs", "idle/pending/success/error states에 submit/resolve/reject/retry를 적용해 invalid transitions를 분류합니다.", String.raw`const table = {
  idle: { submit: "pending" },
  pending: { resolve: "success", reject: "error" },
  error: { retry: "pending" },
  success: {},
};
function transition(state, event) {
  const next = table[state]?.[event];
  return next ? { ok: true, state: next } : { ok: false, state, code: "invalid-transition" };
}
let current = "idle";
for (const event of ["submit", "submit", "reject", "retry", "resolve"]) {
  const result = transition(current, event);
  console.log(current + "+" + event + "=" + result.state + ":" + (result.ok ? "ok" : result.code));
  current = result.state;
}`, "idle+submit=pending:ok\npending+submit=pending:invalid-transition\npending+reject=error:ok\nerror+retry=pending:ok\npending+resolve=success:ok", ["react-state-structure", "react-extract-reducer", "typescript-discriminated"])]
  }),
  appliedTopic({
    id: "domain-guards-authorization", title: "domain guard, validation과 server authorization을 서로 다른 경계에 둡니다",
    lead: "reducer가 값 부족을 막았다는 사실을 실제 transaction authorization이나 consistency 보장으로 오해하지 않고 local UI invariant와 authoritative server decision을 분리합니다.",
    mechanism: "client reducer는 optimistic/local state를 보호하지만 사용자가 수정 가능한 code입니다. server는 authenticated principal, current version, idempotency와 atomic persistence를 다시 검증해야 합니다.",
    workflow: "DOM input parse→client action guard→pending command→server authorization/version transaction→success/reject event→reconciliation 순서로 책임을 배치합니다.",
    invariants: "negative/NaN/overflow를 양쪽에서 차단하고 client state를 authority로 신뢰하지 않으며 server rejection은 raw detail 없이 typed public reason과 accessible recovery action으로 전환합니다.",
    edgeCases: "two tabs, stale value, repeated click, network retry, out-of-order response, authorization revoke, idempotency collision와 partial failure를 포함합니다.",
    failureModes: "button disabled와 reducer guard만 있으면 crafted request를 막지 못하고 server response 전에 final state로 확정하면 rejection 때 UI와 authority가 갈라집니다.",
    verification: "client negative corpus, server authorization/idempotency/version contract fixture, optimistic rollback, concurrent tabs와 accessible error/retry UI를 실행합니다.",
    operations: "rejection을 auth/conflict/validation/transient reason으로 집계하고 payload·value·principal을 redaction하며 conflict spike에는 stale client rollback/refresh runbook을 둡니다.",
    concepts: [
      c("client invariant", "UI state가 locally valid하도록 reducer가 지키는 조건입니다.", ["server security 경계가 아닙니다.", "user feedback을 빠르게 합니다."]),
      c("authoritative transition", "server의 current data·authorization·transaction에서 최종 승인되는 state change입니다.", ["version/idempotency를 사용합니다.", "client와 reconcile합니다."]),
      c("optimistic reconciliation", "예측 적용한 local state를 server success로 확정하거나 rejection/conflict에서 rollback·merge하는 과정입니다.", ["action identity가 필요합니다.", "사용자에게 상태를 알립니다."]),
    ],
    codeExamples: [node("react21-domain-guard", "finite amount와 local guard 분류", "React21Guard.mjs", "validated action이라도 current state guard를 통과해야 transition하도록 exact 결과를 만듭니다.", String.raw`function apply(state, action) {
  if (!Number.isSafeInteger(action.amount) || action.amount <= 0) return { ...state, result: "invalid-amount" };
  if (action.type === "debit" && action.amount > state.value) return { ...state, result: "insufficient" };
  const delta = action.type === "credit" ? action.amount : -action.amount;
  return { value: state.value + delta, result: "accepted" };
}
console.log(JSON.stringify(apply({ value: 5 }, { type: "debit", amount: 7 })));
console.log(JSON.stringify(apply({ value: 5 }, { type: "credit", amount: Number.NaN })));
console.log(JSON.stringify(apply({ value: 5 }, { type: "debit", amount: 2 })));`, "{\"value\":5,\"result\":\"insufficient\"}\n{\"value\":5,\"result\":\"invalid-amount\"}\n{\"value\":3,\"result\":\"accepted\"}", ["local-reducer-02", "local-reducer-03", "html-number-input", "wcag22"])]
  }),
  appliedTopic({
    id: "effects-command-separation", title: "reducer가 next state와 command intent를 계산하고 effect runner가 외부 작업을 수행하게 합니다",
    lead: "alert/network/storage를 reducer에서 직접 실행하지 않고 event handler, Effect 또는 application command layer가 validated transition 결과에 따라 실행하도록 분리합니다.",
    mechanism: "pure reducer는 state와 pending command descriptor를 반환할 수 있고 runner가 unique command id로 외부 작업을 수행해 success/failure action을 다시 dispatch합니다. 실제 architecture에 따라 command queue는 별도 owner에 둘 수 있습니다.",
    workflow: "event→reducer pending command→runner claim/abort→external result→resolved/rejected action→command clear 순서를 정의하고 duplicate execution과 unmount를 처리합니다.",
    invariants: "reducer 안 side effect가 없고 command payload는 최소·validated하며 runner는 idempotency/cancellation을 지원하고 completion action은 matching command id/version에만 적용됩니다.",
    edgeCases: "StrictMode setup, runner remount, duplicate command, abort, timeout, out-of-order response, retry/backoff, offline queue와 app close를 포함합니다.",
    failureModes: "reducer alert는 purity를 깨고 Effect가 pending state마다 request를 중복 실행하며 completion id를 확인하지 않으면 old response가 current state를 덮습니다.",
    verification: "pure command emission, fake runner call count, duplicate/idempotency, abort/unmount, stale completion와 actual integration failure feedback을 확인합니다.",
    operations: "command id/type/status/latency/retry reason만 관찰하고 request body를 logs에 남기지 않으며 stuck command timeout과 reconciliation worker를 둡니다.",
    concepts: [
      c("command descriptor", "외부 side effect가 수행할 action type, stable id와 최소 payload를 immutable value로 표현한 값입니다.", ["reducer가 실행하지 않습니다.", "runner가 소비합니다."]),
      c("effect runner", "pending command를 claim하고 network/storage 등 외부 작업 후 typed completion event를 dispatch하는 boundary입니다.", ["idempotency가 필요합니다.", "cleanup/cancellation을 관리합니다."]),
      c("stale completion", "과거 command의 늦은 결과가 현재 state/version과 맞지 않는 event입니다.", ["command id/version으로 거부합니다.", "telemetry reason을 남깁니다."]),
    ],
    codeExamples: [node("react21-command-separation", "pure transition과 external command descriptor", "React21Command.mjs", "submit이 command를 생성하고 matching completion만 적용하는 reducer model을 실행합니다.", String.raw`function reducer(state, action) {
  if (action.type === "submit" && state.status === "idle") return { status: "pending", command: { id: action.id, kind: "save" } };
  if (action.type === "resolved" && state.status === "pending" && state.command.id === action.id) return { status: "success", command: null };
  if (action.type === "resolved") return { ...state, ignored: "stale-completion" };
  return state;
}
let state = reducer({ status: "idle", command: null }, { type: "submit", id: "cmd-1" });
console.log(JSON.stringify(state));
console.log(JSON.stringify(reducer(state, { type: "resolved", id: "old" })));
console.log(JSON.stringify(reducer(state, { type: "resolved", id: "cmd-1" })));`, "{\"status\":\"pending\",\"command\":{\"id\":\"cmd-1\",\"kind\":\"save\"}}\n{\"status\":\"pending\",\"command\":{\"id\":\"cmd-1\",\"kind\":\"save\"},\"ignored\":\"stale-completion\"}\n{\"status\":\"success\",\"command\":null}", ["react-purity", "react-use-reducer", "react-strict-mode"])]
  }),
  appliedTopic({
    id: "initialize-reset-migrate-undo", title: "initializer·reset·persisted schema migration과 undo를 명시적으로 설계합니다",
    lead: "reset을 hard-coded object 반환으로 끝내지 않고 props/session별 initialArg, persisted version decode, data migration과 bounded history/undo semantics를 정의합니다.",
    mechanism: "useReducer initializer는 initialArg에서 초기 state를 계산하고 reset action도 같은 initializer를 재사용할 수 있습니다. persisted state는 versioned parser를 거쳐 current canonical state로 변환해야 합니다.",
    workflow: "current schema와 invariants를 정의하고 vN decoders/migrations, corrupt/unknown fallback, reset reason, present/past/future history limit과 irreversible command 경계를 구현합니다.",
    invariants: "initializer는 pure하고 reset이 credential/cache/server data 삭제를 자동 의미하지 않으며 migration은 원본을 보존하거나 safe export 후 atomic replace하고 history에 sensitive payload를 무제한 저장하지 않습니다.",
    edgeCases: "missing storage, malformed JSON, future version, partial migration, old tab/new app, undo after server commit, history cap와 rollback to old reader를 포함합니다.",
    failureModes: "version 없는 persisted reducer state는 배포 후 invalid shape가 되고 reset이 local UI만 지워도 server data는 남으며 unbounded history는 memory/privacy 비용을 만듭니다.",
    verification: "initializer double call, every version fixture, corrupt/future rejection, reset parity, undo/redo sequence, history limit와 old/new/rollback compatibility를 실행합니다.",
    operations: "migration success/failure/version과 safe-reset choice만 관찰하고 stored values는 수집하지 않으며 failure spike에서 writes 중지·export·rollback runbook을 실행합니다.",
    concepts: [
      c("versioned initializer", "initialArg 또는 persisted unknown data를 current reducer state로 검증·migration하는 pure function입니다.", ["schema version을 읽습니다.", "failure policy를 가집니다."]),
      c("reset semantics", "어떤 scope의 state를 어떤 default/source로 되돌리고 무엇은 보존하는지 정한 contract입니다.", ["local/server/cache를 구분합니다.", "사용자 data loss를 알립니다."]),
      c("bounded undo history", "present state와 제한된 past/future snapshots 또는 inverse events를 보존하는 구조입니다.", ["memory/privacy limit을 둡니다.", "external effects와 reconcile합니다."]),
    ],
    codeExamples: [node("react21-migration", "versioned reducer state decode", "React21Migration.mjs", "v1/current/unknown persisted shapes를 current canonical state 또는 stable failure로 변환합니다.", String.raw`function decode(input) {
  if (!input || typeof input !== "object") return { ok: false, code: "object-required" };
  if (input.version === 1 && Number.isSafeInteger(input.count)) return { ok: true, state: { version: 2, value: input.count, status: "ready" } };
  if (input.version === 2 && Number.isSafeInteger(input.value) && input.status === "ready") return { ok: true, state: input };
  return { ok: false, code: input.version > 2 ? "future-version" : "invalid-state" };
}
console.log(JSON.stringify(decode({ version: 1, count: 4 })));
console.log(JSON.stringify(decode({ version: 2, value: 4, status: "ready" })));
console.log(JSON.stringify(decode({ version: 3, value: 4 })));`, "{\"ok\":true,\"state\":{\"version\":2,\"value\":4,\"status\":\"ready\"}}\n{\"ok\":true,\"state\":{\"version\":2,\"value\":4,\"status\":\"ready\"}}\n{\"ok\":false,\"code\":\"future-version\"}", ["react-use-reducer", "react-state-structure", "react-use-state"])]
  }),
  appliedTopic({
    id: "model-based-accessible-testing", title: "transition matrix·model-based sequence와 accessible UI를 함께 검증합니다",
    lead: "reducer unit examples만 통과시키지 않고 random/curated event sequences 뒤 invariants, actual component controls, focus, status/error announcements와 server reconciliation을 검사합니다.",
    mechanism: "pure reference model은 action sequence의 expected state를 만들고 React component test는 dispatch wiring과 rendered controls를, browser/E2E는 accessibility와 authoritative integration을 증명합니다.",
    workflow: "state×action table에서 positive/negative paths를 생성하고 fixed seed sequence, invariant after each step, shrinking/minimal reproduction, keyboard flow와 server fault fixtures를 구성합니다.",
    invariants: "모든 step 뒤 state schema가 valid하고 rejected event가 data를 corrupt하지 않으며 disabled state와 reducer guard가 일치하고 status/error가 programmatically perceivable합니다.",
    edgeCases: "long sequence, repeated reset, alternating valid/invalid amount, focus during pending, live region flood, retry/cancel race와 stale server result를 포함합니다.",
    failureModes: "branch coverage 100%여도 transition order bug를 놓칠 수 있고 screenshot만으로 control name·keyboard·announcement를 증명하지 못하며 random test seed 미기록은 재현을 막습니다.",
    verification: "exact examples, table coverage, fixed-seed sequence, invariant checker, DOM role/name/state, keyboard/focus, screen reader smoke와 fault-injected E2E를 실행합니다.",
    operations: "실패 sequence seed/action types/reason만 보존하고 payload를 redaction하며 flaky external fixture와 deterministic model failure를 분리합니다.",
    concepts: [
      c("model-based test", "reference transition model에서 action sequence와 expected states를 생성해 implementation과 비교하는 검증입니다.", ["순서 결함을 찾습니다.", "minimal failing sequence를 보존합니다."]),
      c("invariant-after-step", "action sequence의 마지막뿐 아니라 각 transition 직후 state 조건을 검사하는 방식입니다.", ["corruption 지점을 찾습니다.", "rejected action도 검사합니다."]),
      c("accessible transition feedback", "pending/success/error/rejected 변화가 focus, control state와 programmatic text로 전달되는 UI contract입니다.", ["색상/alert만 의존하지 않습니다.", "announcement volume을 제어합니다."]),
    ],
    codeExamples: [node("react21-sequence-test", "action sequence별 invariant 검사", "React21Sequence.mjs", "mixed actions 후 every-step finite/nonnegative invariant와 final state를 exact output으로 확인합니다.", String.raw`function reducer(state, action) {
  if (action.type === "add" && Number.isSafeInteger(action.amount) && action.amount > 0) return { value: state.value + action.amount };
  if (action.type === "remove" && Number.isSafeInteger(action.amount) && action.amount > 0 && action.amount <= state.value) return { value: state.value - action.amount };
  if (action.type === "reset") return { value: 0 };
  return state;
}
const actions = [{ type: "add", amount: 4 }, { type: "remove", amount: 7 }, { type: "remove", amount: 1 }, { type: "reset" }];
let state = { value: 0 };
for (const [index, action] of actions.entries()) {
  state = reducer(state, action);
  console.log(index + ":" + action.type + "=" + state.value + ":valid=" + (Number.isSafeInteger(state.value) && state.value >= 0));
}`, "0:add=4:valid=true\n1:remove=4:valid=true\n2:remove=3:valid=true\n3:reset=0:valid=true", ["react-extract-reducer", "react-queue", "wcag22"])]
  }),
  appliedTopic({
    id: "reducer-performance-observability-recovery", title: "reducer complexity·render scope·telemetry·canary와 rollback을 운영합니다",
    lead: "useReducer로 옮겼다는 이유로 성능이 좋아진다고 가정하지 않고 transition cost, state/reference shape, consumer render scope와 action volume을 실제 측정합니다.",
    mechanism: "reducer calculation은 render processing 중 실행되고 state reference 변화는 consumers에 영향을 줍니다. 큰 deep copy, broad context value와 noisy actions는 latency와 render fan-out을 만들 수 있습니다.",
    workflow: "action별 transition time/state size, React Profiler interaction, consumer renders와 rejected ratio를 baseline하고 normalization/splitting을 적용한 뒤 artifact canary와 rollback을 검증합니다.",
    invariants: "optimization이 reducer purity/invariants를 깨지 않고 telemetry cardinality와 payload가 bounded·redacted하며 failed migration/canary에서 previous compatible state를 복구할 수 있습니다.",
    edgeCases: "large list, burst dispatch, no-op same-state, action logging growth, persisted schema, old/new tabs, provider split와 external store migration을 포함합니다.",
    failureModes: "every action에서 전체 tree deep clone은 GC/latency를 만들고 action payload logging은 개인정보를 노출하며 incompatible rollback reader는 새 state를 corrupt합니다.",
    verification: "size/action load test, Profiler, same-state reference, telemetry schema/cardinality, source/action secret scan, canary thresholds와 rollback/migration rehearsal를 실행합니다.",
    operations: "SLO 초과·invariant violation·schema failure를 release stop condition으로 두고 feature flag, writes pause, compatible artifact rollback과 reconciliation을 수행합니다.",
    concepts: [
      c("transition budget", "action 하나가 reducer calculation·allocation에 사용할 수 있는 시간과 state size 상한입니다.", ["representative data로 측정합니다.", "user interaction SLO와 연결합니다."]),
      c("action telemetry", "payload 대신 action type, outcome reason, duration과 version을 기록하는 관측 schema입니다.", ["cardinality를 제한합니다.", "민감값을 제외합니다."]),
      c("reducer rollback compatibility", "이전 artifact가 새 persisted state를 안전하게 읽거나 writes를 중지하고 복구할 수 있는 능력입니다.", ["versioned decoder가 필요합니다.", "reconciliation을 포함합니다."]),
    ],
    codeExamples: [node("react21-release-gate", "reducer release evidence gate", "React21ReleaseGate.mjs", "schema·purity·matrix·a11y·performance·migration·rollback evidence를 fail closed로 판정합니다.", String.raw`function gate(evidence) {
  const required = ["schema", "purity", "transitions", "accessibility", "performance", "migration", "rollback"];
  const failed = required.filter((key) => evidence[key] !== true);
  return { release: failed.length === 0, failed };
}
console.log(JSON.stringify(gate({ schema: true, purity: true, transitions: true, accessibility: true, performance: true, migration: true, rollback: true })));
console.log(JSON.stringify(gate({ schema: true, purity: false, transitions: true, accessibility: true, performance: false, migration: true, rollback: true })));`, "{\"release\":true,\"failed\":[]}\n{\"release\":false,\"failed\":[\"purity\",\"performance\"]}", ["react-use-reducer", "react-scaling-reducer-context", "react-strict-mode", "react-state-structure"])]
  }),
];

const sources: SessionSource[] = [
  { id: "local-reducer-01", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step14-Reducer/UseReducerTest01.jsx", usedFor: ["counter action/reducer structure", "unknown action undefined risk provenance"], evidence: "Read-only structural audit: 73 lines, 2,677 bytes, SHA-256 7D3A38D6A6D7BA3842EF7F5D1B80164E26DB16E3A2899C22AA3CE7F8FE3C4969." },
  { id: "local-reducer-02", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step14-Reducer/UseReducerTest02.jsx", usedFor: ["numeric payload and handler guard", "NaN parsing risk provenance"], evidence: "Read-only structural audit: 45 lines, 1,412 bytes, SHA-256 852354B8482A56D2E00DF2AE352AD51677EC70ED2443CA230435DCEDA5F6D182. Actual institution and value strings were not copied." },
  { id: "local-reducer-03", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step14-Reducer/UseReducerTest03.jsx", usedFor: ["object state and reducer guard", "alert side effect and NaN risk provenance"], evidence: "Read-only structural audit: 42 lines, 1,483 bytes, SHA-256 DB7AB9939D0CEE94D701920A1F09FED2A34DD86191E8BCB684163D33946F4E11. Actual institution and alert strings were not copied." },
  { id: "local-reducer-guide", repository: "local REACT learning snapshot", path: "REACT/docs/react/07-usereducer.md", usedFor: ["state/dispatch/reducer/action learning model", "counter and transaction flow provenance"], evidence: "Read-only structural audit: 90 lines, 3,570 bytes, SHA-256 6C484A10DDDC517372E00E6D5A29D21147C4AFC1C5822E7E2A3EF074228B90C2. Actual local/GitHub URLs and domain strings were not copied." },
  { id: "react-use-reducer", repository: "React official API", path: "reference/react/useReducer", publicUrl: "https://react.dev/reference/react/useReducer", usedFor: ["state/dispatch/reducer/initializer contract", "purity, queue and troubleshooting"], evidence: "Official React 19.2 API documents useReducer parameters, dispatch, reducer purity, Object.is behavior and StrictMode checks." },
  { id: "react-extract-reducer", repository: "React official documentation", path: "learn/extracting-state-logic-into-a-reducer", publicUrl: "https://react.dev/learn/extracting-state-logic-into-a-reducer", usedFor: ["action-driven transitions", "reducer extraction and testing"], evidence: "Official guide explains consolidating state update logic into pure reducers and action objects." },
  { id: "react-scaling-reducer-context", repository: "React official documentation", path: "learn/scaling-up-with-reducer-and-context", publicUrl: "https://react.dev/learn/scaling-up-with-reducer-and-context", usedFor: ["reducer ownership and dispatch sharing", "provider integration boundary"], evidence: "Official guide combines reducer state/actions with Context and separates provider responsibilities." },
  { id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["canonical state and impossible combinations", "normalization"], evidence: "Official guide defines principles for grouping related state and avoiding contradiction, redundancy, duplication and deep nesting." },
  { id: "react-queue", repository: "React official documentation", path: "learn/queueing-a-series-of-state-updates", publicUrl: "https://react.dev/learn/queueing-a-series-of-state-updates", usedFor: ["ordered queued updates", "snapshot versus pending state"], evidence: "Official guide explains batching and ordered updater processing." },
  { id: "react-purity", repository: "React official Rules", path: "reference/rules/components-and-hooks-must-be-pure", publicUrl: "https://react.dev/reference/rules/components-and-hooks-must-be-pure", usedFor: ["pure reducer calculation", "side-effect placement and immutable inputs"], evidence: "Official React Rule defines idempotence and side effects outside render." },
  { id: "react-strict-mode", repository: "React official API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["development reducer/initializer purity checks", "Effect cleanup diagnostics"], evidence: "Official API distinguishes development-only checks from production behavior." },
  { id: "react-use-state", repository: "React official API", path: "reference/react/useState", publicUrl: "https://react.dev/reference/react/useState", usedFor: ["useState comparison", "queued functional update and immutable state contract"], evidence: "Official API documents useState setters, queued updates, Object.is and initializer purity." },
  { id: "typescript-discriminated", repository: "TypeScript official handbook", path: "handbook/2/narrowing.html#discriminated-unions", publicUrl: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions", usedFor: ["action unions", "exhaustive narrowing"], evidence: "Official TypeScript handbook documents discriminated unions and never-based exhaustiveness." },
  { id: "html-number-input", repository: "WHATWG HTML Living Standard", path: "multipage/input.html#number-state-(type=number)", publicUrl: "https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)", usedFor: ["number input value and validity", "browser input boundary"], evidence: "HTML Standard defines Number-state input value, constraints and conversion behavior." },
  { id: "wcag22", repository: "W3C Web Accessibility Initiative", path: "TR/WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["error identification/status/focus", "keyboard and perceivable transition feedback"], evidence: "WCAG 2.2 provides normative criteria for input assistance, status and operability." },
];

const session = createExpertSession({
  inventoryId: "react-21-reducer-state-machine", slug: "react-21-reducer-state-machine", courseId: "react", moduleId: "react-state-management", order: 1,
  title: "useReducer와 상태 머신", subtitle: "validated action·pure total reducer·finite transition·command/recovery evidence로 복잡한 UI state를 예측 가능하게 운영합니다.",
  level: "고급", estimatedMinutes: 120,
  coreQuestion: "복잡한 UI state 변화를 validated action과 pure reducer로 모델링하고 impossible state, side effect, concurrency와 migration 실패까지 어떻게 통제할까요?",
  summary: "my-app01의 UseReducerTest01~03과 REACT reducer 문서를 read-only로 감사합니다. unknown action undefined, empty numeric input의 NaN path와 reducer 내부 alert side effect를 숨기지 않습니다. dispatch queue, discriminated/runtime action schema, total pure reducer, finite state machine/guards, client invariant와 server authority, command/effect separation, initializer/reset/migration/undo, model-based accessible testing과 performance/telemetry/canary/rollback까지 열 절과 열 Node exact examples로 확장합니다. 실제 기관·금액·alert·URL 값은 복제하지 않습니다.",
  objectives: ["원본 reducer의 totality, parsing과 side-effect 결함을 source evidence로 진단한다.", "dispatch/action queue와 render snapshot을 순서대로 계산한다.", "action discriminated union과 runtime parser를 구현한다.", "pure·immutable·total reducer와 unknown action 정책을 강제한다.", "finite state machine으로 impossible states와 invalid transitions를 제거한다.", "client guard와 authoritative server authorization을 구분한다.", "external effects를 command runner와 typed completion으로 분리한다.", "initializer, persisted migration, reset과 bounded undo를 설계한다.", "model-based/a11y/performance tests와 canary/rollback을 운영한다."],
  prerequisites: [{ title: "Hook 품질·useId와 접근성 capstone", reason: "useReducer도 Hook 호출·purity·StrictMode·accessible feedback 계약을 따르므로 앞 세션의 품질 evidence를 state transition 설계에 적용합니다.", sessionSlug: "react-20-hook-quality-capstone" }],
  keywords: ["useReducer", "dispatch", "action schema", "discriminated union", "pure reducer", "finite state machine", "transition guard", "command", "migration", "model-based testing", "rollback"],
  topics,
  lab: {
    title: "validated reducer와 finite workflow machine 구축",
    scenario: "원본 네 자료는 변경하지 않고 synthetic units/actions만 쓰는 disposable React fixture에서 parser, reducer, machine, command runner와 recovery를 검증합니다.",
    setup: ["Node.js 20 이상", "React 19 development/production fixture", "TypeScript exhaustive action fixture", "Testing Library compatible DOM", "fake command/server boundary", "synthetic non-sensitive values", "원본 네 파일 read-only hashes"],
    steps: ["원본 action/state/default/input/effect paths와 hash evidence를 기록합니다.", "unknown/missing/NaN/Infinity/negative/fraction/oversized action corpus를 parser에 통과시킵니다.", "state/action을 freeze하고 reducer double invocation과 total return을 검사합니다.", "idle/pending/success/error state×event matrix와 guards를 구현합니다.", "UI guard를 우회한 dispatch도 invariant를 깨지 못하는지 확인합니다.", "pending command와 runner를 분리하고 duplicate/abort/stale completion을 시험합니다.", "server authorization/version/idempotency success/reject를 optimistic state와 reconcile합니다.", "v1/v2/future/corrupt persisted state, reset, undo/redo와 rollback reader를 검증합니다.", "fixed-seed action sequences마다 invariant와 accessible status/focus를 확인합니다.", "large state/burst actions, secret-free telemetry, canary thresholds와 artifact rollback을 rehearsal합니다."],
    expectedResult: ["모든 raw action은 validated union 또는 stable failure가 됩니다.", "reducer는 모든 branch에서 pure valid state를 반환하고 external call이 없습니다.", "invalid state/event 조합이 표현·적용되지 않습니다.", "external commands는 idempotent/cancellable하며 stale completion이 무시됩니다.", "server rejection에서 local state와 accessible UI가 복구됩니다.", "persisted schema와 old/new/rollback readers가 compatibility matrix를 통과합니다.", "action payload 없이도 outcome·latency·invariant SLO를 관찰할 수 있습니다."],
    cleanup: ["temporary builds, storage, command logs, reports와 synthetic values를 제거합니다.", "Profiler/fault injection/verbose action tracing을 원복합니다.", "원본 네 파일의 hash와 git status가 변경되지 않았는지 확인합니다."],
    extensions: ["statechart 도구와 hand-written reducer의 generated transition coverage를 비교합니다.", "property-based generator와 shrinking을 추가합니다.", "event sourcing snapshot/replay와 privacy retention을 검토합니다.", "다음 Context provider에서 state와 dispatch capability를 분리해 공유합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node examples를 실행하고 원본 세 reducer의 action/state/effect 문제와 대응시키세요.", requirements: ["stdout 완전 일치", "source risk", "queue", "runtime parser", "purity", "machine", "guard", "command", "migration", "sequence", "release gate"], hints: ["UI handler 검증과 reducer invariant, server authorization을 같은 경계로 설명하지 마세요."], expectedOutcome: "각 model의 증명 범위와 actual React/server integration 공백을 설명합니다.", solutionOutline: ["audit→schema→pure machine→effects/recovery→operate 순서입니다."] },
    { difficulty: "응용", prompt: "UseReducerTest03 구조를 pure finite transaction-like workflow로 재설계하세요.", requirements: ["synthetic units", "validated action union", "NaN/range checks", "pure total reducer", "no alert in reducer", "pending/rejected states", "command id", "server reconciliation", "accessible feedback", "migration/rollback"], hints: ["학습 모델을 실제 금융 원장·보안 구현으로 과장하지 마세요."], expectedOutcome: "부작용·invalid input·stale response에 복구 가능한 reducer workflow가 완성됩니다.", solutionOutline: ["parse→transition→command→reconcile→test→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 reducer/state-machine governance를 작성하세요.", requirements: ["action schema/version", "purity/totality", "state invariants", "guards/authority", "command effects", "persistence/undo", "model+a11y tests", "telemetry/privacy", "canary/rollback"], hints: ["switch 문 style guide가 아니라 transition lifecycle과 evidence chain을 정의하세요."], expectedOutcome: "복잡한 state logic을 감사·migration·복구할 수 있는 표준이 완성됩니다.", solutionOutline: ["model→validate→reduce→effect→persist→verify→operate 순서입니다."] },
  ],
  nextSessions: ["react-22-context-provider-boundary"], sources,
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["UseReducerTest01/02/03과 REACT 07-usereducer 문서를 read-only로 전부 읽고 exact hash·lines·bytes를 기록했습니다.", "UseReducerTest01의 unknown-action undefined, Test02/03의 empty input→NaN 가능성과 Test03 reducer alert side effect를 숨기지 않았습니다.", "원본의 실제 institution, amount-like, alert, local/GitHub URL과 domain strings는 공개 examples에 복사하지 않았습니다.", "원본 reducer가 server authorization, atomic persistence, idempotency, command runner, state migration/undo나 accessible recovery를 이미 구현했다고 주장하지 않고 official sources와 synthetic models로 보강했습니다.", "Node examples는 actual React dispatch scheduling, DOM number validity/focus, StrictMode, network/server concurrency, durable persistence와 Profiler를 대체하지 않으므로 lab fixture가 필요합니다."] },
});

export default session;
