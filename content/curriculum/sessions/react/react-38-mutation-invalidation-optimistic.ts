import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localMutationRefs = [
  "r38-local-package", "r38-local-lock", "r38-local-page", "r38-local-store",
  "r38-local-api", "r38-local-fetch-doc", "r38-local-crud-doc", "r38-local-flow-doc",
];

const topics = [
  appliedTopic({
    id: "source-mutation-capability-audit", title: "원본 CRUD와 설치 버전을 mutation capability graph로 복원합니다",
    lead: "라이브러리 예제를 덧씌우기 전에 원본에서 create·update·delete가 어디서 시작되고 어떤 cache/store를 어떤 방식으로 맞추는지 읽습니다.",
    mechanism: "my-app03은 page handler가 GuestBook API adapter를 호출하고 create 뒤 전체 list를 다시 받고 update/delete 뒤 Zustand list를 local patch/remove합니다. lock에는 Axios와 React Router, Zustand가 있으나 TanStack Query는 없으므로 현재 동작을 Query mutation 구현이라고 부르지 않습니다. 2026-07-14 registry의 current @tanstack/react-query 5.101.2는 migration target일 뿐 local 설치 사실이 아닙니다.",
    workflow: "package와 lock, page, API, store, 설명 문서의 hash를 고정하고 command→transport→server authority→client reconciliation→feedback 순서를 create/update/delete별로 그립니다. observed behavior, 추론, 목표 설계를 서로 다른 열에 둡니다.",
    invariants: "원본 endpoint·token·password·user·guestbook content와 payload를 공개 자료로 복사하지 않고 structural counts와 sanitized synthetic records만 사용하며 원본 파일은 변경하지 않습니다.",
    edgeCases: "두 번 클릭, create 성공 뒤 refetch 실패, update 응답 역전, delete 404, component unmount, logout/account switch, 느린 응답과 부분 장애를 포함합니다.",
    failureModes: "local list가 바뀌었다는 이유로 server commit과 모든 query variant가 일치한다고 간주하면 stale detail, filtered list 누락, duplicate와 account 간 data 잔류를 놓칩니다.",
    verification: "source hash·dependency presence·action graph·cache owner·response order·sensitive sink와 original git status를 확인하고 target library version은 registry readback으로 따로 기록합니다.",
    operations: "mutation family, phase, reconciliation mode, query family와 safe outcome code를 기록하되 record content, credential, URL parameter와 사용자 식별자는 telemetry에서 제거합니다.",
    concepts: [
      c("mutation capability graph", "사용자 의도부터 server commit과 client reconciliation까지의 owners·edges·실패 경계를 나타낸 지도입니다.", ["CRUD method 이름보다 넓습니다.", "observed와 target을 구분합니다."]),
      c("reconciliation", "server authority의 결과를 현재 client views와 cache에 다시 일치시키는 과정입니다.", ["refetch와 direct patch를 선택합니다.", "실패 경로도 포함합니다."]),
      c("provenance boundary", "원본에서 직접 확인한 사실과 공식 계약, 교육용 모델의 적용 범위를 분리하는 경계입니다.", ["과장을 막습니다.", "민감 값을 복사하지 않습니다."]),
    ],
    codeExamples: [node(
      "react38-source-mutation-audit", "sanitized CRUD capability and version audit", "React38SourceMutationAudit.mjs",
      "원본의 세 reconciliation 방식과 local/current dependency 차이를 실제 값 없이 출력합니다.",
      String.raw`const local = { queryInstalled: false, axios: "1.16.1", router: "7.15.0", zustand: "5.0.13" };
const target = { reactQuery: "5.101.2" };
const flows = [["create", "server-then-refetch"], ["update", "server-then-local-patch"], ["delete", "server-then-local-remove"]];
for (const row of flows) console.log(row.join("="));
console.log("local-query-installed=" + local.queryInstalled);
console.log("target-react-query=" + target.reactQuery);
console.log("private-values-copied=false");`,
      "create=server-then-refetch\nupdate=server-then-local-patch\ndelete=server-then-local-remove\nlocal-query-installed=false\ntarget-react-query=5.101.2\nprivate-values-copied=false",
      localMutationRefs.concat(["r38-query-registry"]),
    )],
  }),
  appliedTopic({
    id: "mutation-state-callback-lifecycle", title: "mutation state와 callback을 command lifecycle로 읽습니다",
    lead: "mutate 함수 하나를 fire-and-forget handler로 보지 않고 variables, submittedAt, status, data/error, failureCount와 callback promise를 하나의 command record로 추적합니다.",
    mechanism: "useMutation은 idle·pending·error·success 상태와 mutate/mutateAsync를 제공합니다. onMutate는 request 전에 context를 준비하고 onSuccess·onError·onSettled는 결과별 reconciliation을 수행하며 callback이 Promise를 반환하면 그 작업이 끝날 때까지 mutation lifecycle이 기다릴 수 있습니다. mutateAsync는 caller가 await/catch/composition해야 할 때 사용합니다.",
    workflow: "validated variables와 client operation ID를 만들고 onMutate에서 cancel/snapshot 또는 patch context를 반환합니다. mutationFn은 server command만 수행하고 success/error/settled 역할을 중복시키지 않으며 UI는 status와 accessible feedback을 구독합니다.",
    invariants: "한 command의 variables와 context가 다른 command에 섞이지 않고 callback error가 삼켜지지 않으며 component callback과 hook-level callback의 생존 범위를 구분합니다.",
    edgeCases: "연속 mutate 호출, unmount 전 completion, callback 자체 실패, out-of-order completion, abort, retry, reset과 같은 mutationKey의 여러 pending instances를 포함합니다.",
    failureModes: "전역 boolean 하나로 모든 저장을 표현하면 어느 record가 pending인지 잃고 연속 호출의 completion order를 submission order로 오해하면 마지막 입력을 오래된 응답이 덮습니다.",
    verification: "허용 state transition, mutateAsync rejection, awaited callbacks, per-call variables/context, unmount와 consecutive completion order를 fake transport와 실제 hook integration에서 실행합니다.",
    operations: "operation ID, mutation key template, status duration, attempt와 safe failure class를 기록하고 variables/body 전체는 log하지 않습니다.",
    concepts: [
      c("mutation status", "하나의 mutation observer가 idle·pending·error·success 중 어디에 있는지 나타내는 상태입니다.", ["server entity version과 다릅니다.", "variables와 함께 읽습니다."]),
      c("mutation context", "onMutate가 이후 callback에 전달하는 rollback·operation metadata입니다.", ["global singleton이 아닙니다.", "민감 값을 넣지 않습니다."]),
      c("mutateAsync", "mutation completion을 Promise로 받아 caller가 순서·오류·후속 작업을 조합하는 API입니다.", ["catch가 필요합니다.", "render 중 호출하지 않습니다."]),
    ],
    codeExamples: [node(
      "react38-mutation-lifecycle", "mutation callback lifecycle model", "React38MutationLifecycle.mjs",
      "prepare→pending→server→success→settled와 실패 분기를 결정적으로 확인합니다.",
      String.raw`function run(outcome) {
  const events = ["onMutate", "pending", "mutationFn"];
  events.push(outcome === "ok" ? "onSuccess" : "onError", "onSettled", outcome === "ok" ? "success" : "error");
  return events.join(">");
}
console.log("ok=" + run("ok"));
console.log("fail=" + run("fail"));
console.log("completion-order-independent=true");`,
      "ok=onMutate>pending>mutationFn>onSuccess>onSettled>success\nfail=onMutate>pending>mutationFn>onError>onSettled>error\ncompletion-order-independent=true",
      ["r38-mutations", "r38-usemutation", "r38-wcag-status"],
    )],
  }),
  appliedTopic({
    id: "command-http-idempotency-contract", title: "mutation variables를 HTTP command·idempotency 계약으로 좁힙니다",
    lead: "UI form object를 그대로 보내지 않고 server가 검증할 command schema, authorization scope, precondition과 retry safety를 명시합니다.",
    mechanism: "HTTP method 이름은 중요한 의미를 제공하지만 실제 endpoint의 business effect가 그 의미를 지켜야 합니다. RFC 9110에서 safe methods와 PUT·DELETE는 method semantics상 idempotent이고 POST는 일반적으로 그렇지 않으므로 불확실한 전송 실패 후 재시도에는 server-supported idempotency key, conditional request 또는 결과 조회가 필요합니다.",
    workflow: "form draft를 trim/normalize한 뒤 allowlisted command DTO로 만들고 client operation ID와 expected version을 붙입니다. adapter는 method, media type, timeout, AbortSignal과 precondition headers를 구성하고 response/problem schema를 검증합니다.",
    invariants: "password/token/transport config가 query cache나 mutation variables telemetry에 들어가지 않고 같은 idempotency key는 같은 logical command에만 재사용되며 server가 권한과 version을 다시 검증합니다.",
    edgeCases: "double submit, ambiguous timeout, proxy retry, offline resume, validation 400, auth 401/403, conflict 409/412, delete already absent와 key expiry를 포함합니다.",
    failureModes: "POST가 실패했다고 blind retry하면 duplicate를 만들 수 있고 client-side disable button만 믿으면 다른 tab·network replay·악성 request를 막지 못합니다.",
    verification: "schema positive/negative, duplicate key, same/different payload, timeout before/after commit, method semantics, authorization와 conflict response contract를 disposable server에서 검증합니다.",
    operations: "method·route template·idempotency outcome·precondition result와 safe problem type을 관찰하고 raw URL/body/header는 redaction합니다.",
    concepts: [
      c("command DTO", "server 변경 의도를 표현하는 최소 allowlisted 입력 객체입니다.", ["UI draft와 분리합니다.", "runtime schema를 통과합니다."]),
      c("idempotency key", "동일 logical non-idempotent command의 중복 처리를 server가 식별하도록 하는 opaque key입니다.", ["서버 저장 계약이 필요합니다.", "credential이 아닙니다."]),
      c("ambiguous outcome", "client는 응답을 못 받았지만 server commit 여부를 알 수 없는 전송 결과입니다.", ["blind retry가 위험합니다.", "조회·dedupe로 해결합니다."]),
    ],
    codeExamples: [node(
      "react38-retry-idempotency-gate", "mutation retry safety classifier", "React38RetryIdempotencyGate.mjs",
      "method 의미와 server dedupe/precondition 증거로 자동 재시도 가능성을 분류합니다.",
      String.raw`const cases = [
  ["GET", false, true], ["PUT", false, true], ["DELETE", false, true],
  ["POST", false, false], ["POST", true, true], ["PATCH", false, false],
];
for (const [method, serverDedup, expected] of cases) {
  const semantic = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes(method);
  const retry = semantic || serverDedup;
  console.log(method + ":" + serverDedup + "=" + retry + ":" + (retry === expected));
}`,
      "GET:false=true:true\nPUT:false=true:true\nDELETE:false=true:true\nPOST:false=false:true\nPOST:true=true:true\nPATCH:false=false:true",
      ["r38-rfc9110", "r38-mutations", "r38-usemutation"],
    )],
  }),
  appliedTopic({
    id: "targeted-invalidation-awaiting", title: "invalidation을 query identity graph와 awaited freshness gate로 설계합니다",
    lead: "mutation 성공 뒤 모든 cache를 무조건 새로 받지 않고 어떤 query variants가 stale해졌는지 key factory와 server effect로 계산합니다.",
    mechanism: "invalidateQueries는 filter에 맞는 queries를 stale로 표시해 staleTime을 덮어쓰고 active matches를 background refetch할 수 있습니다. prefix, exact, predicate와 refetchType을 의도적으로 선택하며 mutation callback에서 returned Promise를 await하면 필요한 invalidation/refetch가 끝날 때까지 pending UX를 유지할 수 있습니다.",
    workflow: "command effect matrix에 entity detail, list/filter/page, aggregate와 dependent permissions를 적고 response patch가 확실한 key는 직접 갱신하며 불확실한 families만 invalidation합니다. navigation을 막아야 하는 critical fresh set과 background set을 구분합니다.",
    invariants: "다른 tenant/auth epoch를 invalidate하지 않고 inactive/private cache retention 정책을 지키며 invalidation이 server authorization이나 transaction commit을 대신하지 않습니다.",
    edgeCases: "create가 filter 포함/제외를 바꾸는 경우, update sort 이동, delete empty page, aggregate count, inactive query, offline paused refetch와 연속 mutations를 포함합니다.",
    failureModes: "['items'] 전체 invalidation은 request storm을 만들고 현재 화면 key만 invalidate하면 다른 filter/detail이 stale하며 callback Promise를 반환하지 않으면 success UI가 fresh read보다 먼저 보일 수 있습니다.",
    verification: "mutation×query-family truth table, prefix/exact/predicate matches, active/inactive behavior, awaited pending duration, offline와 auth scope를 실제 QueryClient로 검증합니다.",
    operations: "invalidated query count, active refetch count/latency, bytes, unnecessary refetch ratio와 stale-after-mutation incidents를 family별로 측정합니다.",
    concepts: [
      c("query invalidation", "cache record를 stale로 선언하고 조건에 따라 refetch하도록 조율하는 작업입니다.", ["cache delete와 다릅니다.", "prefix scope를 검토합니다."]),
      c("effect matrix", "각 command가 어떤 query families의 결과를 바꿀 수 있는지 나타내는 표입니다.", ["filter와 aggregate를 포함합니다.", "server contract와 맞춥니다."]),
      c("freshness gate", "사용자에게 completion을 알리기 전 필수 queries의 reconciliation이 끝났음을 확인하는 경계입니다.", ["모든 refetch를 막지는 않습니다.", "await 정책을 명시합니다."]),
    ],
    codeExamples: [node(
      "react38-invalidation-matrix", "targeted invalidation planner", "React38InvalidationMatrix.mjs",
      "create/update/delete effect를 detail·list·aggregate query family로 매핑합니다.",
      String.raw`const plan = {
  create: ["list", "aggregate"],
  update: ["detail", "list", "aggregate"],
  delete: ["detail", "list", "aggregate"],
};
for (const action of Object.keys(plan)) console.log(action + "=" + plan[action].join(","));
const broad = Object.values(plan).some((x) => x.includes("unrelated-auth-scope"));
console.log("cross-auth-scope=" + broad);
console.log("await-critical=true");`,
      "create=list,aggregate\nupdate=detail,list,aggregate\ndelete=detail,list,aggregate\ncross-auth-scope=false\nawait-critical=true",
      ["r38-invalidation-mutations", "r38-query-invalidation", "r38-queryclient", "r38-rfc9110"],
    )],
  }),
  appliedTopic({
    id: "response-driven-immutable-cache-update", title: "server response로 cache를 immutable하게 교정합니다",
    lead: "server가 canonical entity를 반환했다면 무조건 refetch하기보다 validated response를 관련 detail/list에 구조 공유를 보존하며 반영합니다.",
    mechanism: "setQueryData는 synchronous updater로 기존 cache에서 새 immutable value를 만들어 저장합니다. response에는 server ID, normalized fields, authorization-filtered representation과 version이 있을 수 있으므로 client variables를 성공 결과처럼 복사하지 말고 response schema를 source of truth로 사용합니다.",
    workflow: "response를 parse한 뒤 detail key를 replace하고 list updater는 stable ID로 record를 찾아 새 object와 array를 만듭니다. 현재 filter/sort/page membership을 확실히 계산할 수 없으면 speculative insertion 대신 targeted invalidation을 선택합니다.",
    invariants: "oldData와 nested branches를 in-place mutation하지 않고 undefined cache를 명시적으로 처리하며 entity identity와 representation version이 다른 cache를 섞지 않습니다.",
    edgeCases: "no cached list, record missing, server-normalized value, updated sort key, partial representation, deleted entity, same ID in multiple pages와 structural sharing cost를 포함합니다.",
    failureModes: "oldData[index].field를 직접 바꾸면 subscribers가 변경을 놓칠 수 있고 request variables로 cache를 갱신하면 server canonicalization과 권한 필터를 잃습니다.",
    verification: "reference equality, unchanged branch sharing, frozen oldData, missing record/cache, filter membership, response schema와 subsequent refetch parity를 실행합니다.",
    operations: "patch hit/miss, invalidation fallback, changed entity count, cache update duration와 parity mismatch를 기록합니다.",
    concepts: [
      c("response-driven update", "검증된 mutation response를 authoritative 새 representation으로 cache에 반영하는 방식입니다.", ["variables 복사와 다릅니다.", "schema를 검증합니다."]),
      c("immutable updater", "old cache를 변경하지 않고 새 root/changed branches를 반환하는 pure 함수입니다.", ["structural sharing을 돕습니다.", "undefined를 처리합니다."]),
      c("membership uncertainty", "변경 후 entity가 현재 filter/sort/page에 속하는지 client가 확정할 수 없는 상태입니다.", ["invalidation 신호입니다.", "추측 삽입을 피합니다."]),
    ],
    codeExamples: [node(
      "react38-immutable-cache-patch", "immutable response patch with structural sharing", "React38ImmutableCachePatch.mjs",
      "변경 record만 교체하고 원본 array와 다른 record reference를 보존합니다.",
      String.raw`const oldList = Object.freeze([Object.freeze({ id: "a", value: 1 }), Object.freeze({ id: "b", value: 2 })]);
const response = { id: "b", value: 3 };
const next = oldList.map((item) => item.id === response.id ? response : item);
console.log("new-array=" + (next !== oldList));
console.log("a-shared=" + (next[0] === oldList[0]));
console.log("b-replaced=" + (next[1] !== oldList[1]));
console.log("values=" + next.map((x) => x.value).join(","));`,
      "new-array=true\na-shared=true\nb-replaced=true\nvalues=1,3",
      ["r38-response-updates", "r38-local-page", "r38-local-store"],
    )],
  }),
  appliedTopic({
    id: "optimistic-transaction-rollback", title: "optimistic update를 cancel·snapshot·apply·rollback·settle transaction으로 만듭니다",
    lead: "즉시 보이는 UI를 단순 선반영으로 구현하지 않고 stale refetch와 실패가 cache를 손상하지 않도록 transaction phases를 고정합니다.",
    mechanism: "cache optimistic path는 onMutate에서 관련 outgoing queries를 await cancel하고 previous data를 snapshot한 뒤 setQueryData로 optimistic value를 적용합니다. onError는 context를 사용해 되돌리고 onSettled는 server truth를 얻도록 invalidate합니다. UI-only optimistic rendering은 variables와 submittedAt을 보여 주므로 shared cache 변경이 불필요한 경우 더 단순합니다.",
    workflow: "optimistic 가치와 rollback 가능성을 먼저 평가하고 critical key set을 cancel합니다. reversible patch/context와 operation ID를 저장하고 success response로 canonicalize하며 실패 시 해당 operation만 undo하고 마지막에 scope-limited revalidation을 수행합니다.",
    invariants: "cancelQueries가 optimistic write보다 먼저 끝나고 rollback context는 같은 operation에만 쓰이며 server가 거부한 data를 success처럼 오래 유지하지 않습니다.",
    edgeCases: "cancel 직전 response, rollback 중 새 mutation, refetch 실패, component unmount, offline pending, validation error, delete undo와 server canonical ID를 포함합니다.",
    failureModes: "cancel 없이 optimistic write하면 오래된 query response가 선반영을 덮고 whole-cache snapshot 복원은 그 뒤 성공한 다른 mutation까지 지울 수 있습니다.",
    verification: "deferred query/mutation으로 모든 interleaving, cancel consumption, snapshot immutability, success canonicalization, error rollback와 settled invalidation을 실행합니다.",
    operations: "optimistic applied/confirmed/rolled-back, visible duration, correction magnitude, cancel result와 refetch outcome을 operation/family 단위로 관찰합니다.",
    concepts: [
      c("optimistic transaction", "server 확인 전 예상 결과를 표시하고 commit 또는 rollback하는 client-side transaction protocol입니다.", ["server transaction이 아닙니다.", "reconciliation이 필요합니다."]),
      c("rollback context", "실패 시 해당 optimistic effect를 취소할 snapshot·inverse patch·operation metadata입니다.", ["전역 snapshot을 피합니다.", "민감 data를 제한합니다."]),
      c("query cancellation", "관련 in-flight query가 optimistic cache를 오래된 결과로 덮지 않도록 중지·revert하는 coordination입니다.", ["AbortSignal consumption을 검증합니다.", "mutation 취소와 다릅니다."]),
    ],
    codeExamples: [node(
      "react38-optimistic-rollback", "optimistic transaction phase model", "React38OptimisticRollback.mjs",
      "inverse patch로 한 operation의 값만 commit 또는 rollback합니다.",
      String.raw`function transaction(outcome) {
  let state = { value: 10, version: 1 };
  const before = state;
  state = { ...state, value: 11 };
  const optimistic = state.value;
  state = outcome === "ok" ? { value: 11, version: 2 } : before;
  return { optimistic, final: state.value, version: state.version };
}
for (const outcome of ["ok", "error"]) {
  const x = transaction(outcome);
  console.log(outcome + "=" + x.optimistic + ">" + x.final + "@v" + x.version);
}`,
      "ok=11>11@v2\nerror=11>10@v1",
      ["r38-optimistic", "r38-queryclient", "r38-cancellation"],
    )],
  }),
  appliedTopic({
    id: "optimistic-create-temp-id-reconcile", title: "optimistic create의 임시 identity를 server identity로 원자적으로 교체합니다",
    lead: "새 row를 즉시 표시할 때 array index나 content를 identity로 쓰지 않고 collision-free client operation ID와 server canonical ID를 연결합니다.",
    mechanism: "pending variables와 submittedAt은 동시에 여러 mutation을 표시하는 단서가 됩니다. cache에 optimistic entity를 넣는다면 temp ID, operation ID와 pending marker를 사용하고 success response에서 같은 operation만 server entity로 replace합니다. query key나 persisted public state에 credential을 넣지 않습니다.",
    workflow: "clientOperationId를 만들고 synthetic temp identity로 row를 삽입해 aria-live status를 제공합니다. server response의 canonical ID/version을 검증해 temp row를 교체하고 error는 해당 row만 제거하거나 retry affordance로 유지합니다.",
    invariants: "두 create가 같은 temp ID를 공유하지 않고 server ID와 충돌하지 않으며 성공/실패가 다른 pending row에 적용되지 않습니다.",
    edgeCases: "동일 content 동시 제출, success order inversion, retry same logical command, page/filter exclusion, server normalization, navigation/unmount와 offline resume를 포함합니다.",
    failureModes: "내용 문자열이나 -1을 공통 key로 쓰면 React identity와 reconciliation이 섞이고 success 때 list 전체를 교체하면 다른 optimistic rows가 사라집니다.",
    verification: "N concurrent creates, reordered success/error, duplicate payload, operation mapping, React key stability, focus/status와 refetch parity를 실행합니다.",
    operations: "pending create count/age, temp→server reconcile latency, orphan temp count와 retry/discard outcome을 content 없이 관찰합니다.",
    concepts: [
      c("temporary identity", "server ID가 생기기 전 optimistic entity를 안정적으로 구별하는 client-only identity입니다.", ["operation과 연결합니다.", "server key로 보내지 않습니다."]),
      c("submittedAt", "mutation이 제출된 시간을 나타내어 concurrent pending instances를 구분하는 단서입니다.", ["유일성은 보완합니다.", "server time이 아닙니다."]),
      c("canonical reconciliation", "server가 반환한 ID·version·normalized representation으로 optimistic placeholder를 교체하는 과정입니다.", ["해당 operation만 바꿉니다.", "schema를 통과합니다."]),
    ],
  }),
  appliedTopic({
    id: "concurrent-optimistic-operation-log", title: "동시 optimistic mutations를 operation log와 inverse patch로 격리합니다",
    lead: "한 개의 previous snapshot 대신 각 mutation이 만든 effect를 식별해 실패한 operation만 제거하고 나머지 성공·pending effect를 재적용합니다.",
    mechanism: "concurrent mutation completion order는 submission order와 다를 수 있습니다. whole snapshot rollback은 snapshot 뒤의 성공을 지우므로 base confirmed state와 ordered pending operations, 또는 entity/version별 inverse patch를 유지하고 server response마다 confirmed base를 갱신한 뒤 남은 operations를 fold합니다.",
    workflow: "operation에 ID, entity ID, expected version, submitted order와 pure apply/inverse를 저장합니다. success는 confirmed result를 반영하고 operation을 제거하며 error는 그 operation만 제거한 뒤 current confirmed+remaining pending으로 projection을 재계산합니다.",
    invariants: "operation apply가 deterministic하고 다른 entity/field를 건드리지 않으며 stale response가 더 높은 confirmed version을 낮추지 않습니다.",
    edgeCases: "same entity same field, different fields, create then update/delete, one fail one success, retry duplicate, account epoch change와 server reorder를 포함합니다.",
    failureModes: "첫 mutation snapshot으로 rollback하면 두 번째 성공을 없애고 마지막 response wins만 쓰면 오래된 response가 최신 의도를 덮습니다.",
    verification: "permutation property tests, duplicate response, failure subset, version monotonicity, operation cleanup와 final server refetch parity를 실행합니다.",
    operations: "pending log length/age, conflicts, rebases, stale response discarded, rollback scope와 reconciliation mismatch를 low-cardinality로 기록합니다.",
    concepts: [
      c("operation log", "확정되지 않은 client mutations의 순서·대상·effect를 보존하는 기록입니다.", ["projection을 재계산합니다.", "payload를 최소화합니다."]),
      c("inverse patch", "특정 operation의 effect만 되돌리는 국소 변환입니다.", ["전체 snapshot보다 안전합니다.", "composability를 검증합니다."]),
      c("confirmed base", "server가 확인한 최신 representation으로 pending optimistic operations를 적용하기 전 기준 상태입니다.", ["version을 가집니다.", "stale response를 거부합니다."]),
    ],
    codeExamples: [node(
      "react38-concurrent-operation-log", "concurrent optimistic operation-log rollback", "React38ConcurrentOperationLog.mjs",
      "두 optimistic 증가 중 첫 작업만 실패해도 두 번째 effect가 남는지 검증합니다.",
      String.raw`const base = 10;
let pending = [{ id: "op-a", delta: 1 }, { id: "op-b", delta: 2 }];
const project = () => pending.reduce((value, op) => value + op.delta, base);
console.log("optimistic=" + project());
pending = pending.filter((op) => op.id !== "op-a");
console.log("after-a-error=" + project());
pending = pending.filter((op) => op.id !== "op-b");
const confirmed = base + 2;
console.log("after-b-success=" + confirmed);
console.log("later-success-preserved=" + (confirmed === 12));`,
      "optimistic=13\nafter-a-error=12\nafter-b-success=12\nlater-success-preserved=true",
      ["r38-optimistic", "r38-usemutation"],
    )],
  }),
  appliedTopic({
    id: "etag-if-match-conflict-resolution", title: "ETag·If-Match와 version으로 lost update를 감지합니다",
    lead: "optimistic UI가 빨라 보여도 두 사용자의 server update 경쟁을 해결하지 못하므로 conditional request와 명시적 conflict UX를 둡니다.",
    mechanism: "server representation의 ETag 또는 domain version을 read 결과와 함께 보존하고 변경 request에 If-Match precondition을 보냅니다. 현재 representation과 맞지 않으면 server는 commit하지 않고 412 같은 실패를 반환할 수 있으며 client는 latest를 받아 사용자 draft와 비교·merge·retry할지 결정합니다.",
    workflow: "query response에서 opaque validator를 안전한 metadata로 저장하고 mutation variables에는 expected validator reference를 둡니다. conflict는 자동 overwrite하지 않고 latest fetch→field diff→discard/reapply/manual merge로 처리합니다.",
    invariants: "client가 validator를 만들어 내지 않고 server가 authorization과 precondition을 commit과 같은 경계에서 검사하며 version은 성공 때만 단조 증가합니다.",
    edgeCases: "weak validator, missing ETag, deleted target, create conflict, clock skew, stale offline mutation, same-value update와 multi-resource transaction을 포함합니다.",
    failureModes: "updatedAt client timestamp나 last response wins만 쓰면 lost update를 조용히 만들고 412를 network error처럼 retry하면 conflict loop가 됩니다.",
    verification: "two-client race, stale/current/missing If-Match, 412 problem schema, merge choices, version monotonicity와 audit event를 disposable server에서 실행합니다.",
    operations: "precondition success/failure, conflict resolution choice/time, repeated conflict와 version gap을 기록하고 representation content는 제외합니다.",
    concepts: [
      c("conditional request", "현재 server representation에 대한 precondition이 참일 때만 method를 적용하는 HTTP 요청입니다.", ["lost update를 감지합니다.", "authorization을 대체하지 않습니다."]),
      c("If-Match", "현재 representation의 validator가 지정 값과 맞아야 요청을 수행하도록 하는 precondition header입니다.", ["opaque ETag를 사용합니다.", "client clock과 다릅니다."]),
      c("conflict UX", "자동 덮어쓰기 대신 latest와 local intent를 비교해 재적용·병합·취소를 선택하게 하는 사용자 흐름입니다.", ["draft를 보존합니다.", "무한 retry를 막습니다."]),
    ],
    codeExamples: [node(
      "react38-version-precondition", "versioned mutation precondition model", "React38VersionPrecondition.mjs",
      "두 client가 같은 version에서 수정할 때 stale second write가 거부되는지 보여 줍니다.",
      String.raw`let server = { value: 10, version: 4 };
function update(expected, value) {
  if (expected !== server.version) return { status: 412, version: server.version };
  server = { value, version: server.version + 1 };
  return { status: 200, version: server.version };
}
console.log("client-a=" + JSON.stringify(update(4, 11)));
console.log("client-b=" + JSON.stringify(update(4, 12)));
console.log("server=" + JSON.stringify(server));`,
      "client-a={\"status\":200,\"version\":5}\nclient-b={\"status\":412,\"version\":5}\nserver={\"value\":11,\"version\":5}",
      ["r38-rfc9110", "r38-rfc9457", "r38-owasp-authz"],
    )],
  }),
  appliedTopic({
    id: "retry-offline-persisted-mutations", title: "mutation retry·offline pause·persistence를 replay safety로 제한합니다",
    lead: "query retry 정책을 mutation에 복사하지 않고 side effect의 중복 가능성, server dedupe, deadline과 사용자 의도를 기준으로 resume 여부를 결정합니다.",
    mechanism: "TanStack mutations의 기본 retry는 0이고 retry를 설정할 수 있습니다. network mode와 persistence로 paused mutation을 재개할 때 serialized state에는 함수가 포함되지 않으므로 reload 뒤 resume에는 matching default mutationFn이 필요합니다. 기술적으로 재개 가능하다는 사실은 business replay가 안전하다는 뜻이 아닙니다.",
    workflow: "failure taxonomy와 replay eligibility를 method/idempotency key/precondition별로 정하고 capped backoff, expiry와 user cancellation을 둡니다. persistence allowlist에는 최소 variables와 schema/app/auth epoch를 넣고 default function을 등록해 hydrate 뒤 검증합니다.",
    invariants: "logout/account switch 뒤 old mutation을 재생하지 않고 non-idempotent ambiguous command는 dedupe 증거 없이 자동 retry하지 않으며 persisted queue에 credential과 private response를 저장하지 않습니다.",
    edgeCases: "offline before send, after commit before response, app upgrade/downgrade, key expiry, revoked permission, duplicated resume, background tab와 device clock change를 포함합니다.",
    failureModes: "모든 failed POST를 reconnect 때 재생하면 duplicate와 권한 경계 위반이 생기고 default mutationFn이 없으면 reload 뒤 paused mutation을 재개할 수 없습니다.",
    verification: "offline phase matrix, ambiguous commit, hydrate/default function, schema/auth epoch mismatch, duplicate resume, expiry, logout purge와 privacy scan을 실행합니다.",
    operations: "paused queue length/age, resumed/expired/discarded/deduped, retry attempts와 replay conflicts를 operation class로 관찰합니다.",
    concepts: [
      c("replay eligibility", "mutation을 같은 logical effect로 안전하게 다시 보낼 수 있는지 판단하는 계약입니다.", ["method만 보지 않습니다.", "dedupe/precondition을 확인합니다."]),
      c("paused mutation", "network policy 등으로 실행을 완료하지 못하고 resume 가능한 상태로 보존된 mutation입니다.", ["commit 여부를 따집니다.", "무기한 보존하지 않습니다."]),
      c("default mutation function", "persisted mutation이 reload 후 실행 코드를 복원할 수 있도록 mutation key에 연결한 기본 함수입니다.", ["함수는 serialize되지 않습니다.", "schema/version을 검증합니다."]),
    ],
  }),
  appliedTopic({
    id: "auth-security-accessible-feedback", title: "mutation authorization·privacy와 accessible feedback을 같은 완료 조건에 둡니다",
    lead: "버튼을 숨기거나 optimistic 성공 색을 칠하는 것을 권한 검사와 사용자 통지로 착각하지 않습니다.",
    mechanism: "client auth state는 affordance를 제어하지만 server는 모든 command의 authentication, object/field authorization, CSRF 또는 bearer policy와 input validation을 다시 수행해야 합니다. mutation error는 RFC 9457 같은 typed safe problem으로 normalize하고 pending/success/error status는 focus를 훔치지 않는 status message로 전달합니다.",
    workflow: "UI capability hint→server authorization→safe problem mapping→rollback/retry affordance→aria-live status 순서를 설계합니다. 401 refresh, 403 forbidden, 409/412 conflict, 422 validation과 5xx를 서로 다른 recovery로 매핑합니다.",
    invariants: "권한 없는 optimistic data를 private cache에 오래 남기지 않고 raw Axios config/header/body/problem detail을 log/DOM에 노출하지 않으며 success announcement는 실제 completion policy 뒤에만 발생합니다.",
    edgeCases: "screen reader 중 연속 mutation, focus 이동, duplicate announcement, field error, session expiry mid-submit, CSRF failure, account switch와 destructive undo를 포함합니다.",
    failureModes: "403을 401 refresh로 반복하거나 실패를 toast 하나로만 표시하면 loop와 접근성 손실이 생기며 client guard만으로 object authorization을 대신하면 보안 취약점입니다.",
    verification: "role/object negatives, auth expiry, safe problem redaction, keyboard/focus, live region announcements, rollback/error retry와 no-secret DOM/log scan을 실행합니다.",
    operations: "safe status/failure code, authorization denial class, announcement latency와 retry/abandon outcome을 PII 없이 측정합니다.",
    concepts: [
      c("server authorization", "요청 주체가 해당 resource와 operation을 수행할 권한이 있는지 server가 검증하는 통제입니다.", ["client guard와 다릅니다.", "매 요청 적용합니다."]),
      c("problem details", "HTTP API 오류를 type·status·title 등 기계 판독 가능한 안전한 형태로 표현하는 규격입니다.", ["내부 stack을 숨깁니다.", "도메인 code를 확장할 수 있습니다."]),
      c("status message", "focus를 이동하지 않고 작업 결과 변화를 보조기술에 전달하는 사용자 피드백입니다.", ["중복을 제한합니다.", "시각 상태도 제공합니다."]),
    ],
  }),
  appliedTopic({
    id: "mutation-tests-observability-release", title: "race contract tests와 reconciliation observability로 migration을 출시합니다",
    lead: "happy-path mock 한 건이 아니라 transport와 cache scheduler의 시간 순서를 제어해 손실·중복·stale overwrite가 없음을 증명합니다.",
    mechanism: "pure patch tests는 immutability와 operation algebra를, fresh QueryClient integration은 callbacks/cache/invalidation을, disposable server는 idempotency/precondition/problem contract를, browser tests는 navigation/focus/offline/accessibility를 검증합니다. 원본 manual flow와 new mutation owner를 장기간 dual-write하지 않습니다.",
    workflow: "deferred promises와 fake/real clock으로 response permutations를 만들고 source baseline→shadow comparison→one command pilot→canary→cutover→old owner removal 순서로 진행합니다. rollback은 cache buster와 reconciliation refetch를 포함합니다.",
    invariants: "테스트마다 QueryClient/cache/server가 격리되고 stdout model을 실제 library 보장으로 과장하지 않으며 release artifact와 local source hash가 추적 가능합니다.",
    edgeCases: "HMR duplicate interceptor, multiple tabs, persisted queue, browser back, deployment during pending mutation, schema version drift, partial rollback과 telemetry outage를 포함합니다.",
    failureModes: "useMutation mock만 검증하면 callbacks와 invalidation ordering을 건너뛰고 store+query cache dual-write는 비교 기간 뒤에도 divergence source로 남습니다.",
    verification: "all response permutations, property-based operation log, QueryClient callbacks, real HTTP fault injection, browser a11y, privacy scan, canary SLO와 rollback rehearsal을 실행합니다.",
    operations: "mutation success만 세지 않고 ambiguous outcomes, duplicate prevented, conflicts, rollbacks, stale mismatches, invalidation cost와 user correction을 dashboard·owner·runbook에 연결합니다.",
    concepts: [
      c("race contract test", "비동기 completion 순서를 통제해 모든 허용 interleaving에서 불변식을 검증하는 테스트입니다.", ["deferred transport를 사용합니다.", "한 순서만 보지 않습니다."]),
      c("reconciliation SLI", "server truth와 visible cache가 다시 일치하는 시간·실패·불일치율 지표입니다.", ["success rate를 보완합니다.", "privacy-safe여야 합니다."]),
      c("single owner cutover", "같은 server state를 쓰는 authoritative client owner를 old/new 중 하나로 유지하며 전환하는 방식입니다.", ["dual-write를 제한합니다.", "rollback을 준비합니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "r38-local-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["local dependency capability baseline"], evidence: "2026-07-14 read-only sanitized audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. React 19.2.6, React Router 7.15.0, Axios 1.16.1, Zustand 5.0.13이 선언되고 TanStack Query는 선언되지 않았습니다." },
  { id: "r38-local-lock", repository: "D:/dev/my-app03", path: "package-lock.json", usedFor: ["resolved dependency and no-query baseline"], evidence: "2026-07-14 read-only audit: 17,457 lines, 676,411 bytes, SHA-256 7464FAAF3F30C8DFC33D98F51215AF86033D5F80E5E70FBDA55F916F82B3757B. lockfileVersion 3이며 Axios 1.16.1, Router 7.15.0, Zustand 5.0.13을 확인했고 TanStack Query package는 없었습니다." },
  { id: "r38-local-page", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["manual list and mutation reconciliation baseline"], evidence: "2026-07-14 read-only sanitized audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. Effect list fetch, create refetch, update local patch, delete local remove 구조만 사용하고 실제 user/content/password/messages는 복사하지 않았습니다." },
  { id: "r38-local-store", repository: "D:/dev/my-app03", path: "src/store/useGuestbookStore.jsx", usedFor: ["manual list patch/remove owner"], evidence: "2026-07-14 read-only sanitized audit: 21 lines, 562 bytes, SHA-256 DA1A28E1BD3D8A7632530089011576C1FC7F4BE6A75D9001BFCD04323BABF209. list copy/patch/remove 구조만 사용하고 domain values는 복사하지 않았습니다." },
  { id: "r38-local-api", repository: "D:/dev/my-app03", path: "src/api/GuestBook.jsx", usedFor: ["CRUD adapter boundary"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 365 bytes, SHA-256 42CC6DCDAFB0BA46A85307C7A762656B11FB8D3194F2DC44FBD44AF7F32D37D4. method structure만 사용하고 실제 route/payload는 복사하지 않았습니다." },
  { id: "r38-local-fetch-doc", repository: "D:/dev/REACT", path: "docs/react/09-fetch-axios.md", usedFor: ["manual HTTP state provenance"], evidence: "2026-07-14 read-only sanitized audit: 108 lines, 4,797 bytes, SHA-256 3A5B8BF21C44D86E331AED7A8B6E554E3B2F65FA91D576A48CFBFF22679F3507. 실제 URL/key/output은 복사하지 않았습니다." },
  { id: "r38-local-crud-doc", repository: "D:/dev/REACT", path: "docs/react/11-zustand-auth-crud.md", usedFor: ["auth and CRUD store provenance"], evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. 실제 user/domain strings는 복사하지 않았습니다." },
  { id: "r38-local-flow-doc", repository: "D:/dev/REACT", path: "docs/integration/code-flow-by-feature.md", usedFor: ["integrated auth/CRUD flow provenance"], evidence: "2026-07-14 read-only sanitized audit: 568 lines, 32,140 bytes, SHA-256 546F6BECA265FB69250102BF8406C62D818D07F9258C44B7C23068C240E5BD62. 실제 token/password/user/routes/payloads는 복사하지 않았습니다." },
  { id: "r38-query-registry", repository: "npm registry", path: "@tanstack/react-query/latest", publicUrl: "https://registry.npmjs.org/@tanstack%2Freact-query/latest", usedFor: ["current target package version"], evidence: "2026-07-14 registry readback: latest version 5.101.2. local my-app03 설치 상태와 분리해 기록했습니다." },
  { id: "r38-mutations", repository: "TanStack Query official documentation", path: "framework/react/guides/mutations", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/mutations", usedFor: ["mutation states, callbacks, consecutive and persisted mutations"], evidence: "current React mutations 공식 guide입니다." },
  { id: "r38-usemutation", repository: "TanStack Query official documentation", path: "framework/react/reference/useMutation", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/reference/useMutation", usedFor: ["useMutation options/results/retry/scope contract"], evidence: "current useMutation 공식 reference입니다." },
  { id: "r38-invalidation-mutations", repository: "TanStack Query official documentation", path: "framework/react/guides/invalidations-from-mutations", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations", usedFor: ["callback-driven invalidation"], evidence: "mutation success와 query invalidation을 연결하는 공식 guide입니다." },
  { id: "r38-optimistic", repository: "TanStack Query official documentation", path: "framework/react/guides/optimistic-updates", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates", usedFor: ["UI/cache optimistic paths and rollback"], evidence: "variables/submittedAt UI path와 cancel/snapshot/set/rollback cache path를 다루는 공식 guide입니다." },
  { id: "r38-response-updates", repository: "TanStack Query official documentation", path: "framework/react/guides/updates-from-mutation-responses", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses", usedFor: ["response-driven immutable cache update"], evidence: "mutation response와 setQueryData immutable update 공식 guide입니다." },
  { id: "r38-query-invalidation", repository: "TanStack Query official documentation", path: "framework/react/guides/query-invalidation", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation", usedFor: ["stale override, matching and active refetch"], evidence: "invalidateQueries matching과 stale/refetch semantics 공식 guide입니다." },
  { id: "r38-queryclient", repository: "TanStack Query official documentation", path: "reference/QueryClient", publicUrl: "https://tanstack.com/query/latest/docs/reference/QueryClient", usedFor: ["cancel, set, invalidate and cache operations"], evidence: "current QueryClient 공식 reference입니다." },
  { id: "r38-cancellation", repository: "TanStack Query official documentation", path: "framework/react/guides/query-cancellation", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation", usedFor: ["AbortSignal and query cancellation"], evidence: "queryFn AbortSignal consumption과 cancellation 공식 guide입니다." },
  { id: "r38-rfc9110", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["method idempotency, conditional requests and status semantics"], evidence: "HTTP method semantics, idempotency, validators/If-Match와 4xx semantics의 standards source입니다." },
  { id: "r38-rfc9457", repository: "IETF RFC Editor", path: "RFC 9457 Problem Details for HTTP APIs", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["typed safe API problems"], evidence: "HTTP API problem details standards source입니다." },
  { id: "r38-owasp-authz", repository: "OWASP Cheat Sheet Series", path: "Authorization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["server-side authorization and deny-by-default"], evidence: "authorization enforcement와 least privilege를 위한 OWASP primary guidance입니다." },
  { id: "r38-wcag-status", repository: "W3C Web Accessibility Initiative", path: "WCAG 2.2 Understanding Status Messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["accessible pending/success/error status"], evidence: "focus 이동 없이 상태 변화를 전달하는 WCAG understanding guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-38-mutation-invalidation-optimistic", slug: "react-38-mutation-invalidation-optimistic", courseId: "react", moduleId: "react-router-network", order: 8,
  title: "mutation·invalidation과 optimistic transaction",
  subtitle: "CRUD side effect를 versioned command, targeted invalidation, immutable response patch와 concurrency-safe optimistic transaction으로 운영합니다.",
  level: "고급", estimatedMinutes: 140,
  coreQuestion: "server 변경을 빠르게 보이게 하면서도 duplicate, stale overwrite, lost update, rollback 손실과 private cache 오염 없이 어떻게 확정 상태로 수렴시킬까요?",
  summary: "my-app03의 manual Guestbook create-refetch/update-patch/delete-remove 흐름과 dependency lock을 read-only·sanitized 감사하고 TanStack Query가 local에 없다는 사실을 current 5.101.2 migration target과 분리합니다. mutation state/callback, command schema와 idempotency, targeted awaited invalidation, response-driven immutable update, cancel→snapshot/operation log→optimistic apply→commit/rollback→revalidate, temp ID, concurrent completion, ETag/If-Match conflict, offline replay, authorization·accessible feedback과 race/release 검증을 여덟 runnable models로 연결합니다.",
  objectives: [
    "원본 CRUD ownership과 dependency capability를 복원한다.", "mutation state/callback Promise와 completion order를 설명한다.",
    "command schema·idempotency·ambiguous outcome 계약을 설계한다.", "query identity graph로 invalidation 범위와 freshness gate를 계산한다.",
    "server response를 immutable cache update에 사용한다.", "optimistic transaction의 cancel·apply·commit·rollback 순서를 구현한다.",
    "temp ID와 concurrent operation log로 mutations를 격리한다.", "ETag·If-Match/version conflict를 사용자 복구 흐름으로 연결한다.",
    "offline retry/persistence를 replay-safe commands로 제한한다.", "authorization·accessibility·race observability를 release gate로 운영한다.",
  ],
  prerequisites: [{ title: "API state machine·query cache", reason: "query key, QueryClient, freshness, cancellation, auth scope와 server-state ownership을 알아야 mutation이 어떤 cache를 어떻게 교정하는지 설계할 수 있습니다.", sessionSlug: "react-37-api-state-machine-cache" }],
  keywords: ["mutation", "invalidation", "optimistic update", "rollback", "operation log", "idempotency", "ETag", "If-Match", "concurrency", "reconciliation"],
  topics,
  lab: {
    title: "Guestbook CRUD를 concurrency-safe optimistic transaction으로 qualification하기",
    scenario: "원본 files를 바꾸거나 실제 endpoint/data를 공개하지 않고 synthetic records와 disposable conditional HTTP server에서 manual baseline과 TanStack Query target을 비교합니다.",
    setup: ["Node.js 20 이상", "React와 current TanStack Query fixture", "disposable RFC 9457/ETag/idempotency server", "deferred requests와 fake/real clock", "fresh QueryClient per case", "browser accessibility runner", "원본 8 files read-only", "synthetic non-sensitive records"],
    steps: [
      "원본 hashes/dependencies와 create-refetch/update-patch/delete-remove graph를 고정합니다.",
      "mutation variables/context/status/callback state machine과 consecutive order를 계측합니다.",
      "command schema, method, idempotency key, timeout·ambiguous outcome와 problem taxonomy를 검증합니다.",
      "mutation×query-family effect matrix와 critical/background awaited invalidation을 구현합니다.",
      "server response immutable detail/list patch와 membership-uncertain invalidation fallback을 시험합니다.",
      "cancel→snapshot/inverse patch→optimistic apply→success/error→settled refetch를 모든 response order로 실행합니다.",
      "concurrent create temp IDs와 same-entity operation log를 reordered success/error에서 검증합니다.",
      "두 client ETag/If-Match race와 412 diff/merge/reapply UX를 실행합니다.",
      "offline persisted mutation replay, app/auth epoch mismatch, logout purge와 dedupe를 시험합니다.",
      "authorization/privacy/accessibility, SLI/canary/rollback과 final server-cache reconciliation을 검증합니다.",
    ],
    expectedResult: [
      "mutation completion 순서가 달라도 confirmed server state와 remaining optimistic effects가 손실 없이 표현됩니다.",
      "각 command가 필요한 query families만 교정하고 critical freshness 이후 completion을 알립니다.",
      "duplicate/ambiguous retries와 stale precondition이 server 계약으로 차단됩니다.",
      "실패한 operation만 rollback되고 다른 성공·pending operation은 보존됩니다.",
      "authorization·privacy·accessible feedback과 rollback runbook이 자동 evidence를 가집니다.",
    ],
    cleanup: ["QueryClients/caches/mutations, requests, timers와 disposable server를 제거합니다.", "persisted mutation queues, synthetic entities/ETags/idempotency records와 traces를 폐기합니다.", "browser storage, offline/focus state와 feature flags를 원복합니다.", "원본 8 files hash/status unchanged를 확인합니다."],
    extensions: ["multi-tab optimistic operation coordination을 추가합니다.", "offline-first mutation queue의 conflict resolver를 qualification합니다.", "multi-resource transaction/saga compensation을 비교합니다.", "reconciliation SLO와 automated stale-cache detector를 구축합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node examples를 실행하고 mutation lifecycle·invalidation·optimistic rollback의 적용 범위를 설명하세요.", requirements: ["stdout 완전 일치", "source/version audit", "callback lifecycle", "retry gate", "invalidation matrix", "immutable patch", "rollback", "operation log", "precondition"], hints: ["pure model은 실제 QueryClient scheduler, transport cancellation, server commit과 React rendering을 증명하지 않습니다."], expectedOutcome: "command에서 cache convergence까지 evidence chain을 설명합니다.", solutionOutline: ["audit→lifecycle/command→invalidate/patch→optimistic/concurrent→version/replay→release 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Guestbook update를 ETag 기반 optimistic mutation으로 점진 이전하세요.", requirements: ["sanitized schema", "auth-scoped key", "cancel/inverse patch", "response canonicalization", "If-Match/412", "concurrent tests", "accessible errors", "rollback"], hints: ["전체 list snapshot rollback으로 later success를 지우지 마세요."], expectedOutcome: "same-entity races에서도 server truth와 local intent가 손실 없이 수렴합니다.", solutionOutline: ["baseline→conditional server→single operation→permutation tests→canary→cutover입니다."] },
    { difficulty: "설계", prompt: "조직 공통 mutation governance와 replay policy를 작성하세요.", requirements: ["command schemas", "idempotency/preconditions", "invalidation ownership", "optimistic eligibility", "concurrency", "offline persistence", "auth/privacy/a11y", "SLI/runbook"], hints: ["HTTP method 이름만으로 실제 business idempotency를 가정하지 마세요."], expectedOutcome: "모든 side effect가 duplicate·conflict·rollback·replay·recovery evidence를 갖습니다.", solutionOutline: ["classify→validate→execute→project→reconcile→observe/recover 순서입니다."] },
  ],
  nextSessions: ["react-39-auth-aware-query-orchestration"], sources,
  sourceCoverage: {
    filesRead: 8, filesUsed: 8,
    uncoveredNotes: [
      "원본 endpoint/token/password/user/guestbook content와 payload를 공개 content에 복사하지 않았습니다.",
      "my-app03에는 TanStack Query가 설치되어 있지 않으므로 mutation/invalidation/optimistic behavior를 observed implementation으로 주장하지 않고 migration target으로 표시했습니다.",
      "원본 create-refetch/update-patch/delete-remove 구조는 보존했지만 현재 source가 idempotency, ETag, concurrency-safe rollback을 구현한다고 과장하지 않습니다.",
      "Node models는 실제 TanStack Query callbacks/cache scheduler, AbortSignal transport, React rendering, browser accessibility와 server transaction을 대체하지 않으므로 lab integration을 요구합니다.",
    ],
  },
});

export default session;
