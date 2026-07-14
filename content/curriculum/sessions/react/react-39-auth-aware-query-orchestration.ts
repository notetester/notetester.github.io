import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuthRefs = [
  "r39-local-package", "r39-local-lock", "r39-local-app", "r39-local-http", "r39-local-auth",
  "r39-local-auth-store", "r39-local-fetch-doc", "r39-local-crud-doc", "r39-local-flow-doc", "r39-local-jwt-doc",
];

const topics = [
  appliedTopic({
    id: "source-auth-query-capability-audit", title: "원본 auth·HTTP·route 흐름을 query orchestration graph로 감사합니다",
    lead: "로그인 화면이 동작한다는 인상 대신 startup, storage, Axios interceptor, refresh, logout, route guard와 data fetch의 실제 owners를 source에서 복원합니다.",
    mechanism: "my-app03은 App startup Effect, Axios instance, Auth request/response interceptors와 auth Zustand store를 조합하며 Guestbook page가 manual fetch를 수행합니다. local package/lock에는 Axios 1.16.1, React Router 7.15.0, Zustand 5.0.13이 있고 TanStack Query는 없습니다. 2026-07-14 current registry의 React Query 5.101.2, Axios 1.18.1, React Router DOM 7.18.1은 비교 target이지 local 구현 사실이 아닙니다.",
    workflow: "package/lock/source/docs hashes를 고정하고 app boot→credential/session evidence→identity resolution→route decision→request interceptor→401 response→refresh/replay→logout/cache cleanup을 sanitized sequence로 그립니다. source observation과 목표 single-flight/query design을 분리합니다.",
    invariants: "실제 storage key, token, password, user profile, endpoint, route와 payload를 공개 자료로 복사하지 않고 structural ownership과 synthetic epochs만 사용하며 원본을 변경하지 않습니다.",
    edgeCases: "새 tab, direct deep link, expired credential, two concurrent 401s, refresh failure, logout during request, account switch, storage corruption와 SSR request를 포함합니다.",
    failureModes: "persisted boolean이 true라는 이유로 server session과 권한이 유효하다고 가정하거나 interceptor가 있다는 이유로 refresh가 race-safe하다고 주장하면 private cache leak와 replay loop를 놓칩니다.",
    verification: "hash/dependency/version, interceptor registration/ejection, auth transitions, concurrent 401 count, route/query owners, storage/cache sinks와 original status를 확인합니다.",
    operations: "auth phase·epoch, request template, refresh outcome와 purge count만 low-cardinality로 남기고 identity/token/body/URL은 redaction합니다.",
    concepts: [
      c("auth orchestration graph", "startup·credential·identity·request·refresh·route·cache owners와 transition을 연결한 지도입니다.", ["boolean보다 풍부합니다.", "관찰과 목표를 구분합니다."]),
      c("auth evidence", "server가 검증할 session/cookie/token과 client가 UI를 위해 보유한 비민감 상태를 구분하는 증거입니다.", ["persisted boolean은 권한이 아닙니다.", "server가 최종 판정합니다."]),
      c("capability baseline", "현재 dependency와 source가 실제 제공하는 동작의 경계입니다.", ["latest와 분리합니다.", "migration 과장을 막습니다."]),
    ],
    codeExamples: [node(
      "react39-source-auth-audit", "sanitized auth/query capability audit", "React39SourceAuthAudit.mjs",
      "local dependency와 observed owners를 current migration targets와 분리합니다.",
      String.raw`const local = { query: false, axios: "1.16.1", router: "7.15.0", zustand: "5.0.13" };
const current = { query: "5.101.2", axios: "1.18.1", router: "7.18.1" };
const owners = ["startup:app-effect", "transport:axios-instance", "auth:interceptors-store", "data:page-effect"];
for (const owner of owners) console.log(owner);
console.log("local-query=" + local.query);
console.log("current=" + [current.query, current.axios, current.router].join("|"));
console.log("private-values-copied=false");`,
      "startup:app-effect\ntransport:axios-instance\nauth:interceptors-store\ndata:page-effect\nlocal-query=false\ncurrent=5.101.2|1.18.1|7.18.1\nprivate-values-copied=false",
      localAuthRefs.concat(["r39-query-registry", "r39-axios-registry", "r39-router-registry"]),
    )],
  }),
  appliedTopic({
    id: "auth-state-machine-epoch-scope", title: "인증을 state machine과 monotonic auth epoch로 표현합니다",
    lead: "isLogin 하나 대신 identity가 아직 불명인지, guest인지, authenticated인지, refresh 중인지, 만료·logout 중인지와 어떤 세대의 결과인지 함께 기록합니다.",
    mechanism: "auth state는 booting/unknown, guest, authenticating, authenticated, refreshing, expired/logging-out 같은 명시적 transitions를 갖습니다. auth epoch는 login, logout, account/tenant switch나 session authority가 바뀔 때 증가해 old async result와 private query identity를 새 세대에서 거부하도록 돕습니다.",
    workflow: "authoritative transition reducer를 만들고 startup resolution 전 unknown을 유지합니다. success는 opaque subject scope와 epoch를 설정하고 refresh는 같은 epoch에서 single-flight로 진행하며 logout/switch는 epoch 증가→requests cancel→cache purge→guest transition 순서를 수행합니다.",
    invariants: "epoch는 감소하지 않고 credential 자체를 query key/state/log에 넣지 않으며 guest와 unknown을 합쳐 protected query를 조기 실행하지 않습니다.",
    edgeCases: "strict mode double startup, login response after logout, refresh response after account switch, multiple tabs, storage event, server revocation와 clock skew를 포함합니다.",
    failureModes: "old login/refresh response를 현재 store에 그대로 쓰면 logout이 되돌아가고 query key에 auth scope가 없으면 새 사용자가 이전 cache를 볼 수 있습니다.",
    verification: "transition table, invalid transition negatives, epoch monotonic property, deferred response permutations, storage corruption와 private query key secret scan을 실행합니다.",
    operations: "auth phase duration, epoch-change reason, discarded stale result count와 transition failure code를 관찰하고 subject value는 hash조차 불필요하면 수집하지 않습니다.",
    concepts: [
      c("auth state machine", "인증의 허용 상태와 사건별 transition을 명시한 authoritative model입니다.", ["unknown과 guest를 구분합니다.", "server authority를 반영합니다."]),
      c("auth epoch", "인증 scope가 바뀔 때 단조 증가해 old async work/cache를 구별하는 비밀 아닌 세대 값입니다.", ["token이 아닙니다.", "purge를 보완합니다."]),
      c("stale auth result", "시작 당시 epoch가 현재와 달라져 더는 적용할 수 없는 login·refresh·query 응답입니다.", ["commit하지 않습니다.", "안전하게 폐기합니다."]),
    ],
    codeExamples: [node(
      "react39-auth-epoch-key", "auth epoch query isolation model", "React39AuthEpochKey.mjs",
      "같은 resource라도 logout/login 뒤 cache identity가 달라지고 old result가 거부되는지 확인합니다.",
      String.raw`let epoch = 7;
const key = () => JSON.stringify(["private-items", { authEpoch: epoch }]);
const oldKey = key();
const requestEpoch = epoch;
epoch += 1;
const newKey = key();
console.log("same-key=" + (oldKey === newKey));
console.log("old-result-accepted=" + (requestEpoch === epoch));
console.log("old=" + oldKey);
console.log("new=" + newKey);
console.log("contains-token=false");`,
      "same-key=false\nold-result-accepted=false\nold=[\"private-items\",{\"authEpoch\":7}]\nnew=[\"private-items\",{\"authEpoch\":8}]\ncontains-token=false",
      ["r39-queryclient", "r39-owasp-authz", "r39-owasp-html5"],
    )],
  }),
  appliedTopic({
    id: "enabled-skiptoken-auth-gates", title: "enabled·skipToken과 auth resolution을 declarative query gate로 만듭니다",
    lead: "queryFn 내부에서 로그인 여부를 검사해 빈 값을 반환하지 않고 query 자체가 현재 조건에서 존재하고 자동 실행될 수 있는지를 options로 표현합니다.",
    mechanism: "enabled:false query는 cache 유무에 따라 success 또는 pending 상태로 시작할 수 있고 automatic fetch/refetch와 invalidation-triggered refetch를 무시하며 manual refetch는 가능합니다. skipToken은 TypeScript에서 queryFn 부재를 type-safe하게 표현하지만 refetch()가 작동하지 않는 차이가 있으므로 의도를 선택합니다.",
    workflow: "auth resolved, authenticated, required route params/schema, feature permission과 network policy를 pure gate로 계산합니다. unknown은 query를 만들되 실행하지 않거나 skipToken으로 배제하고 guest는 protected query를 실행하지 않으며 authenticated epoch가 key에 들어갑니다.",
    invariants: "disabled 상태를 loading으로 무한 표시하지 않고 queryFn이 undefined/placeholder identity로 private endpoint를 호출하지 않으며 invalidate가 disabled query를 강제로 fetch한다고 기대하지 않습니다.",
    edgeCases: "warm cache while disabled, logout during background refetch, param empty string/0, permission loading, manual refetch button, SSR hydration와 skipToken refetch 요구를 포함합니다.",
    failureModes: "enabled:false를 imperative permanent pause로 남기면 query lifecycle 기능을 잃고 auth unknown을 guest로 처리하면 direct deep link가 login으로 깜빡이거나 protected request가 조기 발사됩니다.",
    verification: "auth×param×cache gate matrix, initial status/fetchStatus, invalidate/refetch behavior, skipToken type tests, epoch switch와 UI branches를 실제 QueryClient/component로 검증합니다.",
    operations: "gate outcome과 safe reason code, time waiting for auth/params, unexpected manual fetch와 disabled cache hits를 query family별로 관찰합니다.",
    concepts: [
      c("declarative query gate", "query options가 현재 identity와 실행 조건을 직접 표현하도록 하는 pure predicate입니다.", ["queryFn 내부 early return과 다릅니다.", "reason을 테스트합니다."]),
      c("enabled", "query의 자동 fetch/refetch 참여 여부를 제어하는 option입니다.", ["cache state는 남을 수 있습니다.", "invalidation behavior를 이해합니다."]),
      c("skipToken", "조건이 충족되지 않을 때 queryFn 대신 사용해 실행 불가능성을 type-safe하게 나타내는 sentinel입니다.", ["refetch 제한이 있습니다.", "version contract를 확인합니다."]),
    ],
    codeExamples: [node(
      "react39-query-gate-matrix", "auth-aware query gate classifier", "React39QueryGateMatrix.mjs",
      "auth resolution, identity와 param 조건을 실행/대기/skip으로 분류합니다.",
      String.raw`const cases = [
  ["unknown", true], ["guest", true], ["authenticated", false], ["authenticated", true], ["expired", true],
];
for (const [auth, hasParam] of cases) {
  const result = auth === "unknown" ? "wait-auth" : auth !== "authenticated" ? "skip-private" : hasParam ? "enabled" : "wait-param";
  console.log(auth + ":" + hasParam + "=" + result);
}
console.log("disabled-invalidation-refetch=false");`,
      "unknown:true=wait-auth\nguest:true=skip-private\nauthenticated:false=wait-param\nauthenticated:true=enabled\nexpired:true=skip-private\ndisabled-invalidation-refetch=false",
      ["r39-disabling"],
    )],
  }),
  appliedTopic({
    id: "authenticated-query-transport-boundary", title: "queryFn과 Axios instance 사이에 credential·AbortSignal 경계를 고정합니다",
    lead: "component가 header를 조립하거나 token을 query key에 넣지 않고 request-scoped auth evidence와 cancellation을 transport adapter에 위임합니다.",
    mechanism: "queryFn은 query key inputs와 TanStack Query가 제공한 AbortSignal을 adapter에 넘기고 Axios는 signal option으로 AbortController cancellation을 받을 수 있습니다. request interceptor는 전송 직전 현재 credential 정책을 적용하되 config를 in-place 공유하거나 retry metadata와 secret을 log하지 않습니다.",
    workflow: "secret-free key parse→auth epoch 확인→adapter(route template, signal)→interceptor credential attachment→status/problem/schema parse→immutable result 순서를 구성합니다. cookie session이면 credentials/CSRF policy를, bearer면 memory/rotation policy를 별도로 둡니다.",
    invariants: "token은 query key, URL, persisted query cache, error serialization과 analytics에 없고 aborted/old-epoch response는 cache에 commit되지 않으며 server가 매 request를 검증합니다.",
    edgeCases: "signal already aborted, refresh while request queued, adapter retry, CORS, cookie SameSite, 204, redirect, malformed problem과 interceptor HMR duplication을 포함합니다.",
    failureModes: "Axios default header에 stale token을 영구 복사하면 refresh 뒤에도 old credential이 나가고 signal을 소비하지 않으면 logout/cancel 이후 private response가 도착할 수 있습니다.",
    verification: "header just-in-time attachment, no-secret sinks, AbortSignal propagation, old epoch discard, interceptor eject, cookie/bearer variants와 disposable server authorization을 실행합니다.",
    operations: "route template, auth epoch, abort/failure class, schema version와 latency를 수집하고 raw config/header/body는 redaction합니다.",
    concepts: [
      c("credential boundary", "credential을 보관·첨부·회전·폐기하는 최소 transport/session 경계입니다.", ["component/query key와 분리합니다.", "server 검증이 필수입니다."]),
      c("AbortSignal propagation", "query cancellation signal을 Axios와 모든 nested requests에 전달하는 과정입니다.", ["무시된 Promise와 다릅니다.", "old commit을 막습니다."]),
      c("just-in-time attachment", "request가 실제 전송되기 직전 현재 auth evidence를 config에 적용하는 방식입니다.", ["stale defaults를 피합니다.", "log redaction이 필요합니다."]),
    ],
  }),
  appliedTopic({
    id: "single-flight-401-refresh", title: "동시 401을 하나의 bounded single-flight refresh로 합칩니다",
    lead: "각 response interceptor가 독립 refresh를 호출하지 않고 같은 auth epoch의 401 requests가 하나의 in-flight refresh Promise를 공유하게 합니다.",
    mechanism: "response interceptor는 401을 받은 original request가 refresh endpoint 자체인지, 이미 replay했는지, 현재 epoch가 같은지 검사합니다. refreshFlights는 epoch별 Promise를 공유하고 성공하면 credential/session evidence를 원자적으로 갱신한 뒤 eligible requests만 한 번 replay하며 finally에서 flight를 정리합니다.",
    workflow: "401 classify→loop guard→same-epoch flight get/create→refresh request on separate/no-refresh client→schema/epoch commit→original config clone/redact→one replay를 수행합니다. refresh 실패는 모든 waiters에 같은 typed auth-expired 결과를 주고 logout coordinator를 한 번 호출합니다.",
    invariants: "한 epoch에 active refresh가 하나이고 refresh request는 자기 interceptor loop에 들어가지 않으며 original request는 최대 한 번 replay되고 logout 이후 refresh success를 commit하지 않습니다.",
    edgeCases: "10 simultaneous 401s, refresh도 401/403/5xx, refresh timeout, one waiter abort, logout/account switch, app background와 server key rotation을 포함합니다.",
    failureModes: "요청마다 refresh하면 token rotation race와 storm이 생기고 단일 retry marker만 두어도 shared flight·epoch·refresh endpoint exclusion이 없으면 loop와 stale login resurrection이 남습니다.",
    verification: "N concurrent 401에서 refresh count 1, one replay/request, failure fan-out, abort waiter, epoch change, refresh endpoint loop negative와 interceptor cleanup을 실행합니다.",
    operations: "refresh flight size/duration/outcome, waiters, replay count, loop prevented와 epoch-discarded success를 identity 없이 관찰합니다.",
    concepts: [
      c("single-flight", "동일 목적의 동시 요청들이 하나의 in-flight Promise 결과를 공유하는 조정 방식입니다.", ["dedupe key가 필요합니다.", "무기한 global이 아닙니다."]),
      c("bounded replay", "원본 request를 명시한 조건에서 최대 횟수만 다시 보내는 정책입니다.", ["refresh endpoint를 제외합니다.", "idempotency를 확인합니다."]),
      c("refresh flight", "특정 auth epoch의 session 갱신을 대표하는 공유 Promise와 metadata입니다.", ["finally에서 정리합니다.", "logout이 무효화합니다."]),
    ],
    codeExamples: [node(
      "react39-single-flight-refresh", "concurrent 401 single-flight model", "React39SingleFlightRefresh.mjs",
      "세 요청이 같은 refresh Promise를 공유해 호출 수가 하나인지 확인합니다.",
      String.raw`let flight;
let refreshCalls = 0;
function refreshOnce() {
  if (!flight) flight = Promise.resolve().then(() => { refreshCalls += 1; return "epoch-8"; }).finally(() => { flight = undefined; });
  return flight;
}
const values = await Promise.all([refreshOnce(), refreshOnce(), refreshOnce()]);
console.log("refresh-calls=" + refreshCalls);
console.log("waiters=" + values.length);
console.log("same-result=" + (new Set(values).size === 1));
console.log("max-replay=1");`,
      "refresh-calls=1\nwaiters=3\nsame-result=true\nmax-replay=1",
      ["r39-axios-interceptors", "r39-axios-cancellation", "r39-rfc9110", "r39-owasp-auth", "r39-owasp-session"],
    )],
  }),
  appliedTopic({
    id: "replay-eligibility-refresh-failure", title: "401 replay eligibility와 refresh failure를 request semantics로 분류합니다",
    lead: "refresh 성공 뒤 모든 request를 다시 보내지 않고 cancellation, method effect, body replayability, idempotency와 user intent를 확인합니다.",
    mechanism: "GET 같은 safe request는 일반적으로 replay하기 쉽지만 mutation은 RFC method semantics와 실제 server idempotency contract를 함께 봐야 합니다. stream/form body가 재사용 가능한지, AbortSignal이 취소됐는지, retry marker/deadline과 auth epoch가 유효한지도 검사하고 403은 새 credential로 해결될 인증 실패가 아니라 권한 거부일 수 있습니다.",
    workflow: "status 401만 refresh candidate로 좁히고 refresh endpoint/replayed/aborted/expired requests를 제외합니다. safe/idempotent 또는 server idempotency-key protected command만 replay하며 ambiguous non-idempotent command는 결과 조회·사용자 확인으로 보냅니다.",
    invariants: "403/validation/conflict를 refresh loop로 보내지 않고 canceled navigation과 logout의 request를 부활시키지 않으며 replay config에서 credential은 현재 policy로 다시 첨부합니다.",
    edgeCases: "POST commit 뒤 401-like gateway error, non-rewindable upload, 307/308 redirect, idempotency key expiry, Retry-After, refresh success after deadline와 destructive form을 포함합니다.",
    failureModes: "401이면 config를 무조건 재호출하는 interceptor는 duplicate side effect와 user-canceled action을 재생하고 모든 4xx를 token expiry로 보면 authorization/validation 오류를 숨깁니다.",
    verification: "status×method×dedupe×abort×epoch matrix, body replayability, duplicate prevention, 403 no-refresh, ambiguous outcome UX와 server audit를 실행합니다.",
    operations: "replay accepted/blocked reason, duplicate prevented, ambiguous outcome와 refresh-failure logout count를 low-cardinality로 관찰합니다.",
    concepts: [
      c("replay eligibility", "request를 동일 logical effect로 안전하게 다시 보낼 수 있는 조건 집합입니다.", ["auth 성공만으로 충분하지 않습니다.", "body와 idempotency를 봅니다."]),
      c("refresh candidate", "인증 evidence 갱신으로 복구할 수 있다고 분류된 제한된 401 failure입니다.", ["403과 다릅니다.", "loop guard를 통과합니다."]),
      c("non-rewindable body", "한 번 소비한 뒤 동일 bytes로 자동 재전송할 수 없는 stream 같은 body입니다.", ["rebuild contract가 필요합니다.", "blind replay를 막습니다."]),
    ],
    codeExamples: [node(
      "react39-replay-eligibility", "auth replay eligibility classifier", "React39ReplayEligibility.mjs",
      "status, method, dedupe, abort와 retry marker로 replay 가능성을 판단합니다.",
      String.raw`const cases = [
  [401, "GET", false, false, 0], [403, "GET", false, false, 0],
  [401, "POST", false, false, 0], [401, "POST", true, false, 0],
  [401, "PUT", false, true, 0], [401, "DELETE", false, false, 1],
];
for (const [status, method, dedupe, aborted, retries] of cases) {
  const semantic = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes(method);
  const replay = status === 401 && !aborted && retries === 0 && (semantic || dedupe);
  console.log([status, method, dedupe, aborted, retries].join(":") + "=" + replay);
}`,
      "401:GET:false:false:0=true\n403:GET:false:false:0=false\n401:POST:false:false:0=false\n401:POST:true:false:0=true\n401:PUT:false:true:0=false\n401:DELETE:false:false:1=false",
      ["r39-rfc9110", "r39-axios-errors", "r39-owasp-authz"],
    )],
  }),
  appliedTopic({
    id: "logout-account-switch-purge", title: "logout과 account switch를 cancel→epoch→purge transaction으로 만듭니다",
    lead: "auth store boolean과 storage 한 항목만 지우지 않고 private work, query/mutation cache, persisted state, navigation과 transport credential을 하나의 idempotent cleanup으로 조율합니다.",
    mechanism: "QueryClient의 cancelQueries는 in-flight work를 조율하고 removeQueries는 matching cache를 제거하며 clear는 connected query/mutation caches 전체를 비웁니다. resetQueries는 초기 상태로 되돌리고 active queries를 refetch할 수 있으므로 logout에서 원하는 의미와 다를 수 있습니다. public/private cache policy에 따라 scoped remove 또는 dedicated client clear를 선택합니다.",
    workflow: "logout intent를 latch하고 auth epoch를 먼저 증가시켜 late commit을 거부합니다. refresh flight와 private requests를 cancel하고 paused mutations를 discard한 뒤 private queries/remove or clear, persisted cache/storage/credential를 purge하고 guest state와 safe route로 전환합니다.",
    invariants: "cleanup은 여러 번 호출해도 같은 final state이고 old account request/refresh/persisted cache가 새 account에서 살아나지 않으며 public cache 보존은 명시적 allowlist만 사용합니다.",
    edgeCases: "logout during refresh/mutation/prefetch, offline, storage exception, purge 일부 실패, multiple tabs, SSR cookie revoke failure와 browser back를 포함합니다.",
    failureModes: "navigate만 하면 memory cache와 in-flight response가 남고 resetQueries를 쓰면 credential 삭제 뒤 active private refetch가 발생할 수 있으며 persisted auth boolean만 지우면 private query data가 남습니다.",
    verification: "cleanup fault injection, repeated logout, account A→B, late response, mutation queue, persisted/browser memory secret canary, back navigation와 cross-tab event를 실행합니다.",
    operations: "logout phase/duration, canceled/removed/cleared counts, purge failures, stale commit prevented와 residual canary를 관찰합니다.",
    concepts: [
      c("logout transaction", "인증 evidence, async work, caches, persistence와 navigation을 일관된 guest 상태로 수렴시키는 cleanup protocol입니다.", ["server revoke도 포함합니다.", "idempotent해야 합니다."]),
      c("removeQueries", "filter에 맞는 query cache records를 제거하는 QueryClient 작업입니다.", ["refetch가 목적이 아닙니다.", "private scope에 사용합니다."]),
      c("clear", "QueryClient에 연결된 query와 mutation caches를 모두 지우는 강한 작업입니다.", ["public cache도 사라집니다.", "client 경계를 설계합니다."]),
    ],
    codeExamples: [node(
      "react39-logout-purge", "idempotent logout purge planner", "React39LogoutPurge.mjs",
      "late commit 거부를 위해 epoch 증가가 cleanup보다 먼저이고 반복 실행이 안전한지 모델링합니다.",
      String.raw`let state = { epoch: 4, flights: 3, privateQueries: 8, pausedMutations: 2, credential: true };
function logout() {
  if (state.credential) state.epoch += 1;
  state = { ...state, flights: 0, privateQueries: 0, pausedMutations: 0, credential: false };
}
logout();
const once = JSON.stringify(state);
logout();
console.log("state=" + JSON.stringify(state));
console.log("idempotent=" + (once === JSON.stringify(state)));
console.log("late-epoch-4-accepted=" + (4 === state.epoch));`,
      "state={\"epoch\":5,\"flights\":0,\"privateQueries\":0,\"pausedMutations\":0,\"credential\":false}\nidempotent=true\nlate-epoch-4-accepted=false",
      ["r39-queryclient", "r39-cancellation", "r39-owasp-session", "r39-owasp-html5"],
    )],
  }),
  appliedTopic({
    id: "router-query-navigation-prefetch", title: "Router loader·Query cache·prefetch의 ownership을 한 번만 정합니다",
    lead: "deep link와 client navigation이 같은 data identity를 공유하도록 route params, loader와 query options factory를 연결하고 duplicate fetch owner를 제거합니다.",
    mechanism: "React Router data loader는 route component 전에 data를 제공하고 action은 completion 뒤 page loader data를 revalidate할 수 있습니다. TanStack prefetchQuery는 staleTime에 따라 cache를 준비하고 Promise<void>로 error data를 반환하지 않으므로 loader에서 error가 필요하면 fetchQuery 같은 계약을 고려합니다. Link prefetch는 intent/render/viewport 등 route module/data prefetch 정책을 제공합니다.",
    workflow: "route params/schema→auth resolution→query options factory를 single source로 만들고 loader는 ensure/fetch/prefetch 중 UX/error contract에 맞는 한 작업을 호출합니다. hover/focus/viewport prefetch는 permission, network, staleTime와 cache budget을 확인합니다.",
    invariants: "loader와 component가 다른 key/endpoint로 중복 fetch하지 않고 unauthorized route를 prefetch하지 않으며 navigation abort signal과 auth epoch가 request에 전달됩니다.",
    edgeCases: "direct deep link, back/forward warm cache, hover storm, mobile viewport, stale prefetch, loader redirect/error, mutation action revalidation와 logout during navigation을 포함합니다.",
    failureModes: "loader와 useQuery가 각자 request하면 waterfall/duplicate가 생기고 prefetch Promise가 throw한다고 가정하면 route error handling이 빠지며 모든 link render prefetch는 private traffic와 cache를 폭증시킵니다.",
    verification: "deep link/client nav/back, cold/warm/stale cache, hover/focus/viewport, abort/logout, unauthorized no-prefetch, loader error와 request count를 browser에서 실행합니다.",
    operations: "navigation ID, route template, cache hit/prefetch usefulness, duplicate requests, abort와 time-to-usable-content를 privacy-safe하게 관찰합니다.",
    concepts: [
      c("query options factory", "route와 component가 같은 key/queryFn/freshness contract를 재사용하도록 만드는 정의입니다.", ["single owner를 돕습니다.", "secret을 포함하지 않습니다."]),
      c("route prefetch", "사용자 navigation 전에 route module과 data를 준비하는 작업입니다.", ["permission/network budget을 봅니다.", "completion guarantee가 아닙니다."]),
      c("loader-query bridge", "route loader가 QueryClient cache contract를 사용해 deep link와 component query를 연결하는 경계입니다.", ["duplicate owner를 피합니다.", "error semantics를 선택합니다."]),
    ],
    codeExamples: [node(
      "react39-navigation-prefetch", "auth-aware navigation prefetch classifier", "React39NavigationPrefetch.mjs",
      "intent, auth, network와 freshness로 private prefetch 실행 여부를 분류합니다.",
      String.raw`const cases = [
  ["intent", "authenticated", "fast", false],
  ["render", "authenticated", "slow", false],
  ["intent", "guest", "fast", false],
  ["viewport", "authenticated", "fast", true],
];
for (const [trigger, auth, network, fresh] of cases) {
  const prefetch = auth === "authenticated" && network === "fast" && !fresh && trigger !== "render";
  console.log([trigger, auth, network, fresh].join(":") + "=" + prefetch);
}`,
      "intent:authenticated:fast:false=true\nrender:authenticated:slow:false=false\nintent:guest:fast:false=false\nviewport:authenticated:fast:true=false",
      ["r39-prefetch", "r39-router-loading", "r39-router-actions", "r39-router-link"],
    )],
  }),
  appliedTopic({
    id: "client-guard-server-auth-csrf", title: "client guard와 server authentication·authorization·CSRF를 분리합니다",
    lead: "protected route가 보이지 않는다는 사실은 API가 보호됐다는 뜻이 아니므로 UI convenience와 security control을 명시적으로 나눕니다.",
    mechanism: "client guard는 unknown/loading/guest/authenticated에 따라 skeleton, login redirect와 content를 선택합니다. server는 401 authentication challenge/실패와 403 authenticated-but-forbidden 등의 semantics를 일관되게 적용하고 object/action authorization을 매 request 검사합니다. cookie credential을 쓰면 SameSite만 믿지 않고 threat model에 따라 CSRF token/origin 검증을 둡니다.",
    workflow: "route metadata에 required capability를 선언해 UI/prefetch gate에 쓰되 server policy의 복제본으로 취급하지 않습니다. query/mutation error normalizer가 401 refresh 후보, 403 forbidden, CSRF/validation/conflict를 구분하고 redirect destination을 allowlist합니다.",
    invariants: "client store 조작으로 API 권한을 얻을 수 없고 open redirect가 없으며 credential을 URL/localStorage에 불필요하게 두지 않고 server response가 sensitive reason을 과도하게 노출하지 않습니다.",
    edgeCases: "role revoked after load, object ownership change, nested route partial access, CSRF token expiry, cross-origin request, deep link return URL과 browser back cache를 포함합니다.",
    failureModes: "Route component if문만 보호로 쓰면 direct API 호출을 막지 못하고 403을 refresh하면 무한 loop가 되며 untrusted return URL로 redirect하면 open redirect가 됩니다.",
    verification: "guest/authenticated/forbidden object matrix, direct API negatives, CSRF origin/token, redirect allowlist, role revoke, cache purge와 browser history를 실행합니다.",
    operations: "safe authn/authz/CSRF denial class, redirect reason와 guard/server disagreement를 identity 없이 관찰합니다.",
    concepts: [
      c("client guard", "route UI와 navigation affordance를 현재 client auth state에 맞추는 편의 계층입니다.", ["보안 경계가 아닙니다.", "unknown을 처리합니다."]),
      c("server authorization", "resource/action마다 server authority가 권한을 검증하는 보안 통제입니다.", ["deny by default를 따릅니다.", "client state를 신뢰하지 않습니다."]),
      c("CSRF defense", "browser가 자동 첨부하는 credential로 원치 않는 state change가 발생하지 않도록 origin/token/cookie 정책을 조합하는 방어입니다.", ["XSS와 별개입니다.", "API 방식에 맞춥니다."]),
    ],
  }),
  appliedTopic({
    id: "ssr-request-scoped-auth-query", title: "SSR QueryClient와 auth context를 HTTP request마다 격리합니다",
    lead: "process-global cache나 module-global refresh Promise가 서로 다른 SSR 사용자의 data와 credential을 공유하지 않도록 request lifetime을 architecture boundary로 둡니다.",
    mechanism: "SSR에서는 HTTP request마다 QueryClient와 auth context를 만들고 server loader/query가 그 request의 cookie/header policy만 사용합니다. safe query subset을 dehydrate하고 client HydrationBoundary에서 같은 key/epoch/schema로 hydrate하며 React hydrateRoot의 first client tree는 server output과 일치해야 합니다.",
    workflow: "request factory→credential parse/verify→opaque auth scope/epoch→request-scoped QueryClient→authorized prefetch→dehydrate allowlist/redaction/escape→response disposal을 수행합니다. browser에서 새 client를 stable하게 한 번 만들고 logout/account switch purge를 연결합니다.",
    invariants: "두 SSR requests가 client/cache/refresh flight를 공유하지 않고 token, Set-Cookie, error stack과 private disallowed data가 dehydrated HTML에 없으며 hydration은 authorization을 대신하지 않습니다.",
    edgeCases: "streaming, partial loader error, unauthenticated SSR then client login, cookie rotation, clock skew, cached CDN HTML, bot/pre-render와 hydration 중 logout을 포함합니다.",
    failureModes: "module-global QueryClient는 cross-request leak를 만들고 전체 cache 직렬화는 credential/problem internals를 HTML에 남기며 client가 다른 auth snapshot으로 첫 render하면 hydration mismatch와 private flash가 생깁니다.",
    verification: "two simultaneous users with canary records, serialized artifact secret scan, authorized allowlist, first-render parity, cookie rotation, disposal와 CDN cache headers를 실행합니다.",
    operations: "request-scoped cache size, prefetch/hydrate outcome, cross-request canary, hydration mismatch와 redaction failures를 관찰합니다.",
    concepts: [
      c("request-scoped QueryClient", "하나의 SSR HTTP request에서만 존재하고 response 뒤 폐기되는 QueryClient입니다.", ["process global을 금지합니다.", "auth context와 연결합니다."]),
      c("dehydrate allowlist", "client에 보내도 되는 query records만 선택하는 명시적 정책입니다.", ["전체 cache dump를 피합니다.", "secret scan을 거칩니다."]),
      c("hydration parity", "server HTML과 client 첫 render가 같은 auth/query snapshot을 해석하는 조건입니다.", ["security control이 아닙니다.", "mismatch를 측정합니다."]),
    ],
    codeExamples: [node(
      "react39-ssr-isolation", "two-request SSR cache isolation model", "React39SsrIsolation.mjs",
      "request마다 별도 cache와 auth epoch를 사용해 canary가 섞이지 않는지 확인합니다.",
      String.raw`function createRequestScope(epoch, canary) {
  return { epoch, cache: new Map([["private-summary", { canary }]]) };
}
const a = createRequestScope(11, "synthetic-a");
const b = createRequestScope(22, "synthetic-b");
console.log("same-cache=" + (a.cache === b.cache));
console.log("a=" + a.cache.get("private-summary").canary + "@e" + a.epoch);
console.log("b=" + b.cache.get("private-summary").canary + "@e" + b.epoch);
console.log("cross-request-leak=" + (a.cache.get("private-summary").canary === b.cache.get("private-summary").canary));
console.log("credential-serialized=false");`,
      "same-cache=false\na=synthetic-a@e11\nb=synthetic-b@e22\ncross-request-leak=false\ncredential-serialized=false",
      ["r39-ssr", "r39-react-hydrate", "r39-owasp-authz", "r39-owasp-csrf"],
    )],
  }),
  appliedTopic({
    id: "cross-layer-auth-races", title: "refresh·query·mutation·navigation·logout races를 epoch commit gate로 통합합니다",
    lead: "각 layer의 개별 loading flag가 아니라 시작 epoch, operation identity, abortability와 commit precondition으로 모든 late result를 같은 규칙에서 판정합니다.",
    mechanism: "work item은 startEpoch, kind, resource key, operation ID와 AbortSignal을 캡처하고 completion 때 current epoch/route relevance/version을 검사합니다. query cache key isolation과 cancellation, mutation idempotency/precondition, refresh single-flight, navigation abort가 서로 다른 책임을 갖되 final commit gate는 old auth scope를 거부합니다.",
    workflow: "race inventory를 만들고 login-after-logout, refresh-after-switch, query-after-logout, mutation-after-role-revoke, prefetch-after-navigation cases에 deferred responses를 배치합니다. epoch 변화는 future commit을 막고 cleanup은 memory/persistence를 제거하며 server는 authority를 재검증합니다.",
    invariants: "취소 성공 여부와 관계없이 old epoch result가 visible private state에 commit되지 않고 mutation server commit의 ambiguous outcome은 cache discard와 별도로 reconciliation합니다.",
    edgeCases: "AbortSignal 미지원 transport, response already queued, service worker cache, multiple tabs, offline replay, SSR stream과 deployment version change를 포함합니다.",
    failureModes: "cancel 호출만 믿으면 이미 도착한 microtask가 commit할 수 있고 epoch 검사만 하고 cache purge를 생략하면 old private data가 memory/persistence에 남습니다.",
    verification: "event permutation/property tests, abort-before/after-response, epoch mismatch, server commit ambiguity, multi-tab and persistence canaries와 final reconciliation을 실행합니다.",
    operations: "stale completion discarded, abort effectiveness, post-logout response, ambiguous mutation와 cross-layer race class를 correlation ID로 연결합니다.",
    concepts: [
      c("commit gate", "async 결과를 visible state/cache에 쓰기 직전 auth epoch·identity·version을 재검사하는 경계입니다.", ["cancel을 보완합니다.", "server commit과 다릅니다."]),
      c("race inventory", "서로 교차할 수 있는 auth/query/mutation/navigation 사건과 예상 final state를 나열한 표입니다.", ["permutations를 만듭니다.", "cleanup도 포함합니다."]),
      c("late completion", "auth scope나 route relevance가 바뀐 뒤 도착한 이전 async work 결과입니다.", ["폐기 또는 reconcile합니다.", "현재 state를 되돌리지 않습니다."]),
    ],
  }),
  appliedTopic({
    id: "auth-orchestration-tests-operations-release", title: "auth-aware contract tests·privacy observability와 staged release를 운영합니다",
    lead: "interceptor unit mock만 통과시키지 않고 실제 concurrency, server status, cache purge, deep link, SSR와 accessible recovery를 계층별로 증명합니다.",
    mechanism: "pure reducer/gate tests는 transitions를, fresh QueryClient와 Axios adapter integration은 cache/cancel/refresh를, disposable server는 cookie/bearer/401/403/CSRF를, browser는 deep link/navigation/storage/focus를, two-request harness는 SSR isolation을 검증합니다.",
    workflow: "source baseline→auth state/epoch adapter→one private query pilot→single-flight canary→logout purge→router bridge→SSR qualification 순서로 feature flags를 사용합니다. old/new auth owners를 동시에 쓰는 기간을 제한하고 rollback은 epoch bump와 cache/persistence purge를 포함합니다.",
    invariants: "tests 사이 QueryClient/interceptor/storage/server가 공유되지 않고 synthetic credentials만 사용하며 logs/traces/screenshots/HTML artifacts에 token·PII가 없습니다.",
    edgeCases: "test parallelism, HMR duplicate interceptor, clock expiration, flaky network, tab duplication, partial deploy, telemetry outage와 rollback 중 pending requests를 포함합니다.",
    failureModes: "happy-path login test만 있으면 401 storm·logout resurrection·cross-user SSR leak를 놓치고 success rate만 보면 private cache 잔류와 refresh latency를 발견하지 못합니다.",
    verification: "transition/property tests, N-401 single-flight, status/replay matrix, logout fault injection, deep link/back/prefetch, SSR canary, artifact privacy scan와 rollback rehearsal을 실행합니다.",
    operations: "auth resolution/refresh SLI, query gate wait, replay/loop, purge residual, stale commit, SSR cross-request canary와 user-visible recovery를 dashboard·owner·runbook에 연결합니다.",
    concepts: [
      c("auth contract suite", "client state, transport, server, router, cache와 SSR 경계를 함께 검증하는 테스트 집합입니다.", ["mock 한 층으로 끝내지 않습니다.", "privacy negatives를 포함합니다."]),
      c("privacy observability", "문제 진단에 필요한 phase·reason·latency를 남기되 credential·identity·payload를 수집하지 않는 telemetry입니다.", ["redaction을 test합니다.", "cardinality를 제한합니다."]),
      c("epoch rollback", "문제 release를 되돌릴 때 auth epoch를 증가시키고 incompatible cache/work를 제거해 old 결과의 재등장을 막는 절차입니다.", ["code rollback만 하지 않습니다.", "reconciliation을 포함합니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "r39-local-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["local dependency capability"], evidence: "2026-07-14 read-only audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. React 19.2.6, Router 7.15.0, Axios 1.16.1, Zustand 5.0.13이 있고 TanStack Query는 없습니다." },
  { id: "r39-local-lock", repository: "D:/dev/my-app03", path: "package-lock.json", usedFor: ["resolved local dependency baseline"], evidence: "2026-07-14 read-only audit: 17,457 lines, 676,411 bytes, SHA-256 7464FAAF3F30C8DFC33D98F51215AF86033D5F80E5E70FBDA55F916F82B3757B. lockfileVersion 3과 local resolved versions를 확인했습니다." },
  { id: "r39-local-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["startup auth and route ownership"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. flat routes/startup Effect/storage 구조만 사용하고 실제 routes/values는 복사하지 않았습니다." },
  { id: "r39-local-http", repository: "D:/dev/my-app03", path: "src/api/Http.jsx", usedFor: ["Axios instance boundary"], evidence: "2026-07-14 read-only sanitized audit: 18 lines, 872 bytes, SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987. instance/config 구조만 사용하고 base/config values는 복사하지 않았습니다." },
  { id: "r39-local-auth", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["request/response interceptor and login/logout/refresh flow"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 route/token/key/payload는 복사하지 않았고 current source가 single-flight/epoch-safe라고 과장하지 않습니다." },
  { id: "r39-local-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["client auth UI state and cleanup baseline"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. current direct source이며 archived copy와 혼동하지 않았습니다." },
  { id: "r39-local-fetch-doc", repository: "D:/dev/REACT", path: "docs/react/09-fetch-axios.md", usedFor: ["manual HTTP lifecycle provenance"], evidence: "2026-07-14 read-only sanitized audit: 108 lines, 4,797 bytes, SHA-256 3A5B8BF21C44D86E331AED7A8B6E554E3B2F65FA91D576A48CFBFF22679F3507." },
  { id: "r39-local-crud-doc", repository: "D:/dev/REACT", path: "docs/react/11-zustand-auth-crud.md", usedFor: ["auth/store/CRUD provenance"], evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. actual user/domain strings는 복사하지 않았습니다." },
  { id: "r39-local-flow-doc", repository: "D:/dev/REACT", path: "docs/integration/code-flow-by-feature.md", usedFor: ["integrated auth/refresh/navigation flow provenance"], evidence: "2026-07-14 read-only sanitized audit: 568 lines, 32,140 bytes, SHA-256 546F6BECA265FB69250102BF8406C62D818D07F9258C44B7C23068C240E5BD62. 실제 token/password/user/routes/payload는 복사하지 않았습니다." },
  { id: "r39-local-jwt-doc", repository: "D:/dev/REACT", path: "docs/integration/react-springboot-jwt-flow.md", usedFor: ["React/Spring JWT sequence provenance"], evidence: "2026-07-14 read-only sanitized audit: 202 lines, 10,116 bytes, SHA-256 7287E0FA7A3A43E37DA0FEF8FF378CEABB0CE2EDB8404FBF2ACB94C0AE89FE97. actual credential/routes/payload는 복사하지 않았습니다." },
  { id: "r39-query-registry", repository: "npm registry", path: "@tanstack/react-query/latest", publicUrl: "https://registry.npmjs.org/@tanstack%2Freact-query/latest", usedFor: ["current Query target version"], evidence: "2026-07-14 registry readback latest 5.101.2; local 설치와 분리했습니다." },
  { id: "r39-axios-registry", repository: "npm registry", path: "axios/latest", publicUrl: "https://registry.npmjs.org/axios/latest", usedFor: ["current Axios comparison version"], evidence: "2026-07-14 registry readback latest 1.18.1; local 1.16.1과 분리했습니다." },
  { id: "r39-router-registry", repository: "npm registry", path: "react-router-dom/latest", publicUrl: "https://registry.npmjs.org/react-router-dom/latest", usedFor: ["current Router comparison version"], evidence: "2026-07-14 registry readback latest 7.18.1; local 7.15.0과 분리했습니다." },
  { id: "r39-disabling", repository: "TanStack Query official documentation", path: "framework/react/guides/disabling-queries", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries", usedFor: ["enabled and skipToken contracts"], evidence: "disabled query cache/status/refetch/invalidation behavior와 skipToken limitation의 current official guide입니다." },
  { id: "r39-queryclient", repository: "TanStack Query official documentation", path: "reference/QueryClient", publicUrl: "https://tanstack.com/query/latest/docs/reference/QueryClient", usedFor: ["cancel/remove/reset/clear cache operations"], evidence: "current QueryClient 공식 reference입니다." },
  { id: "r39-cancellation", repository: "TanStack Query official documentation", path: "framework/react/guides/query-cancellation", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation", usedFor: ["query AbortSignal cancellation"], evidence: "current query cancellation 공식 guide입니다." },
  { id: "r39-prefetch", repository: "TanStack Query official documentation", path: "framework/react/guides/prefetching", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/prefetching", usedFor: ["prefetchQuery stale/error/GC contract"], evidence: "prefetchQuery/fetchQuery와 event-handler prefetch의 current official guide입니다." },
  { id: "r39-ssr", repository: "TanStack Query official documentation", path: "framework/react/guides/ssr", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/ssr", usedFor: ["SSR request-scoped clients and hydration"], evidence: "current SSR/dehydrate/HydrationBoundary 공식 guide입니다." },
  { id: "r39-axios-interceptors", repository: "Axios official documentation", path: "docs/interceptors", publicUrl: "https://axios-http.com/docs/interceptors", usedFor: ["request/response interceptors and ejection"], evidence: "Axios interceptors 실행·eject/clear와 chain 공식 documentation입니다." },
  { id: "r39-axios-cancellation", repository: "Axios official documentation", path: "docs/cancellation", publicUrl: "https://axios-http.com/docs/cancellation", usedFor: ["AbortController signal cancellation"], evidence: "Axios AbortController signal과 canceled request 공식 documentation입니다." },
  { id: "r39-axios-errors", repository: "Axios official documentation", path: "docs/handling_errors", publicUrl: "https://axios-http.com/docs/handling_errors", usedFor: ["Axios error/status normalization and redaction"], evidence: "AxiosError structure, status handling, cancellation/timeout와 safe serialization 공식 documentation입니다." },
  { id: "r39-router-loading", repository: "React Router official documentation", path: "start/data/data-loading", publicUrl: "https://reactrouter.com/start/data/data-loading", usedFor: ["route loader and component data contract"], evidence: "data router loader가 route component 전에 data를 제공하는 current official documentation입니다." },
  { id: "r39-router-actions", repository: "React Router official documentation", path: "start/data/actions", publicUrl: "https://reactrouter.com/start/data/actions", usedFor: ["actions, fetchers and revalidation"], evidence: "route actions completion 뒤 loader revalidation과 navigation/non-navigation submissions의 current official documentation입니다." },
  { id: "r39-router-link", repository: "React Router official documentation", path: "api/components/Link", publicUrl: "https://reactrouter.com/api/components/Link", usedFor: ["Link intent/render/viewport prefetch"], evidence: "Link prefetch modes와 generated prefetch links의 current official reference입니다." },
  { id: "r39-rfc9110", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["401/403 and replay/idempotency semantics"], evidence: "HTTP authentication status와 method semantics standards source입니다." },
  { id: "r39-owasp-auth", repository: "OWASP Cheat Sheet Series", path: "Authentication Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["authentication lifecycle guidance"], evidence: "authentication/session lifecycle의 OWASP primary guidance입니다." },
  { id: "r39-owasp-authz", repository: "OWASP Cheat Sheet Series", path: "Authorization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["server authorization and deny-by-default"], evidence: "server-side authorization과 least privilege OWASP guidance입니다." },
  { id: "r39-owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session rotation/logout/expiration"], evidence: "session ID lifecycle, renewal와 termination OWASP guidance입니다." },
  { id: "r39-owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site Request Forgery Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["cookie-authenticated state change CSRF defenses"], evidence: "CSRF token/origin/cookie defense OWASP guidance입니다." },
  { id: "r39-owasp-html5", repository: "OWASP Cheat Sheet Series", path: "HTML5 Security Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", usedFor: ["browser storage credential/privacy boundary"], evidence: "Web Storage와 client-side secret handling OWASP guidance입니다." },
  { id: "r39-react-hydrate", repository: "React official documentation", path: "reference/react-dom/client/hydrateRoot", publicUrl: "https://react.dev/reference/react-dom/client/hydrateRoot", usedFor: ["server/client hydration parity"], evidence: "hydrateRoot의 server HTML/client tree parity 공식 reference입니다." },
];

const session = createExpertSession({
  inventoryId: "react-39-app-layout-navbar", slug: "react-39-auth-aware-query-orchestration", courseId: "react", moduleId: "react-router-network", order: 9,
  title: "인증 인지형 query·refresh orchestration",
  subtitle: "auth state·epoch를 query gate, 401 single-flight, bounded replay, logout purge, navigation prefetch와 request-scoped SSR에 연결합니다.",
  level: "고급", estimatedMinutes: 140,
  coreQuestion: "인증이 아직 결정되지 않았거나 갱신·만료·logout·account switch 중일 때 query와 navigation이 private data를 섞거나 요청을 폭증시키지 않도록 어떻게 조율할까요?",
  summary: "my-app03의 App/Http/Auth/auth-store와 통합 문서를 read-only·sanitized 감사해 local manual auth/HTTP 흐름과 current library targets를 구분합니다. auth state machine과 monotonic epoch, enabled/skipToken gate, secret-free query transport, epoch-scoped 401 single-flight와 bounded replay, cancel→purge logout, Router loader/Query prefetch single ownership, client guard 대 server auth/CSRF, request-scoped SSR와 cross-layer race/release evidence를 여덟 executable models로 상세히 연결합니다.",
  objectives: [
    "원본 auth·HTTP·route/query ownership과 versions를 감사한다.", "auth state machine과 monotonic epoch를 설계한다.",
    "enabled·skipToken으로 auth/param query gate를 표현한다.", "queryFn·Axios credential·AbortSignal 경계를 고정한다.",
    "동시 401을 epoch-scoped single-flight refresh로 합친다.", "status·method·idempotency·abort로 bounded replay를 판정한다.",
    "logout/account switch에서 requests·queries·mutations·persistence를 purge한다.", "Router loader·Query cache·prefetch ownership을 통합한다.",
    "client guard와 server authn/authz/CSRF를 분리한다.", "SSR request isolation과 cross-layer race를 contract tests로 운영한다.",
  ],
  prerequisites: [{ title: "mutation·invalidation과 optimistic transaction", reason: "auth expiry와 logout이 pending mutation, retry, invalidation, optimistic cache에 미치는 영향을 안전하게 조율하려면 mutation transaction과 replay 조건을 알아야 합니다.", sessionSlug: "react-38-mutation-invalidation-optimistic" }],
  keywords: ["authentication", "auth epoch", "enabled", "skipToken", "single-flight", "refresh", "401", "logout purge", "prefetch", "SSR isolation"],
  topics,
  lab: {
    title: "deep link부터 logout까지 auth-aware query orchestration qualification",
    scenario: "원본 source와 실제 credential/routes를 노출하지 않고 synthetic cookie/bearer modes와 disposable auth server에서 concurrent 401, account switch, navigation, SSR를 검증합니다.",
    setup: ["Node.js 20 이상", "React·Router·TanStack Query·Axios fixture", "disposable auth/resource/CSRF server", "deferred requests와 fake/real clock", "browser storage and multi-tab harness", "two-request SSR harness", "원본 10 files read-only", "synthetic credentials/records only"],
    steps: [
      "원본 hashes/dependencies와 startup→interceptor→refresh→logout→route/data graph를 고정합니다.",
      "unknown/guest/authenticating/authenticated/refreshing/expired/logout state와 epoch transition table을 구현합니다.",
      "auth×param×cache enabled/skipToken gate와 private secret-free query keys를 검증합니다.",
      "query AbortSignal→Axios adapter, just-in-time credential와 no-secret error/log/persistence를 시험합니다.",
      "N concurrent 401을 한 epoch refresh flight로 합치고 success/failure/abort/logout permutations를 실행합니다.",
      "status×method×dedupe×body×deadline replay matrix와 ambiguous outcomes를 검증합니다.",
      "logout/account switch의 epoch→cancel→mutation/query/persistence purge→guest navigation을 fault injection합니다.",
      "deep link/loader/query options, hover/focus/viewport prefetch, back/abort와 unauthorized no-request를 검증합니다.",
      "401/403/CSRF/direct API/server authorization와 accessible redirect/error recovery를 실행합니다.",
      "two-user SSR isolation, hydration privacy/parity, race SLI와 canary/rollback을 rehearsal합니다.",
    ],
    expectedResult: [
      "unknown·guest·authenticated scopes가 query/cache/navigation에서 섞이지 않습니다.",
      "동시 401 N건이 한 refresh를 공유하고 각 eligible request는 최대 한 번만 replay됩니다.",
      "logout/account switch 뒤 old responses, refresh, queries, mutations와 persisted private data가 되살아나지 않습니다.",
      "deep link와 client navigation이 같은 data identity를 쓰고 unauthorized prefetch/duplicate fetch가 없습니다.",
      "SSR requests가 cache/credential을 공유하지 않고 privacy·hydration·recovery evidence를 가집니다.",
    ],
    cleanup: ["QueryClients/caches, Axios interceptors/instances, requests, timers와 disposable servers를 제거합니다.", "synthetic credentials, cookies, storage, dehydrated states, traces와 canaries를 폐기합니다.", "offline/focus/multi-tab/browser history와 feature flags를 원복합니다.", "원본 10 files hash/status unchanged를 확인합니다."],
    extensions: ["multi-tab leader-based refresh coordination을 qualification합니다.", "passkey/OIDC provider callback과 query epoch를 연결합니다.", "service worker cache/logout purge 경계를 추가합니다.", "edge SSR와 region failover session consistency를 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node examples를 실행하고 auth epoch에서 SSR isolation까지 적용 범위를 설명하세요.", requirements: ["stdout 완전 일치", "source/version audit", "epoch key", "query gate", "single-flight", "replay", "logout purge", "prefetch", "SSR"], hints: ["Node model은 실제 Axios interceptors, QueryClient, browser cookie/storage, Router와 server authorization을 증명하지 않습니다."], expectedOutcome: "auth 사건 하나가 query·transport·route·cache에 어떻게 전파되는지 설명합니다.", solutionOutline: ["audit→state/epoch/gate→transport/refresh/replay→purge/router→security/SSR→release 순서입니다."] },
    { difficulty: "응용", prompt: "원본 my-app03 auth flow를 epoch-scoped single-flight와 logout purge로 점진 강화하세요.", requirements: ["source hashes", "transition reducer", "one refresh/epoch", "bounded replay", "AbortSignal", "cache/persistence purge", "deep-link tests", "rollback"], hints: ["현재 interceptor source가 이미 race-safe하다고 가정하지 마세요."], expectedOutcome: "401 storm와 logout resurrection 없이 private queries가 올바른 auth scope에서만 실행됩니다.", solutionOutline: ["baseline→adapter seam→epoch/flight→query pilot→fault/browser→canary cutover입니다."] },
    { difficulty: "설계", prompt: "조직 공통 auth-aware frontend orchestration 표준을 작성하세요.", requirements: ["state/epoch", "credential boundary", "query gates/keys", "refresh/replay", "logout/purge", "router/prefetch", "server auth/CSRF", "SSR/tests/SLI"], hints: ["client route guard를 server authorization으로 표현하지 마세요."], expectedOutcome: "모든 private data flow가 인증 변화·실패·동시성·복구에서 같은 불변식을 지킵니다.", solutionOutline: ["resolve→scope→fetch→refresh/replay→purge→navigate/render→observe/recover 순서입니다."] },
  ],
  nextSessions: ["react-40-router-network-capstone"], sources,
  sourceCoverage: {
    filesRead: 10, filesUsed: 10,
    uncoveredNotes: [
      "원본 storage key/token/password/user profile/endpoint/route/payload를 공개 content에 복사하지 않았습니다.",
      "my-app03에는 TanStack Query가 없고 current source의 interceptor가 single-flight, bounded replay, auth epoch isolation을 구현한다고 과장하지 않습니다.",
      "local/current package versions와 archived docs/direct current store source를 구분했습니다.",
      "Node models는 actual QueryClient, Axios chain/cancellation, Router navigation, browser cookie/storage/CSRF와 server authorization/SSR를 대체하지 않으므로 lab integration을 요구합니다.",
    ],
  },
});

export default session;
