import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-race-security-audit", title: "원본 fetch·Axios·CRUD 흐름을 cancellation·race·secret·stale UI 관점으로 감사합니다",
    lead: "loading/error 예제가 개선된 점을 보존하면서 source에 남은 credential-like literal, insecure transport, no abort/latest-wins, fire-and-forget refresh와 raw error logging을 공개하지 않고 위험으로 기록합니다.",
    mechanism: "FetchTest01은 status check 없이 mount fetch, FetchTest02와 AxiosTest01은 loading/error/status 처리를 개선하지만 cleanup이 없습니다. GuestBookPage는 mount list와 mutation 뒤 refetch를 시작하면서 request ownership, await/reconciliation, race/version과 error UI가 불완전합니다.",
    workflow: "각 request의 trigger, key/version, credential scope, controller/signal, latest owner, timeout/retry, parse/project, commit guard와 cleanup을 table로 만들고 source literal은 structural redaction으로만 기록합니다.",
    invariants: "실제 endpoint, key, credential, user/domain data는 public examples/sources evidence에 복사하지 않고 exposed credential-like value는 rotation 대상으로 표시하며 client bundle에 secret을 두지 않습니다.",
    edgeCases: "StrictMode remount, route/prop rapid change, slow old response, mutation-followed-refetch, logout, offline/timeout/429/5xx, partial stream, navigation와 multiple tabs를 다룹니다.",
    failureModes: "old request가 new UI를 덮고 unawaited refetch failure가 사라지며 credential literal이 public bundle/history에 남고 HTTP transport가 query/credential exposure를 키울 수 있습니다.",
    verification: "source secret scan/redaction, deferred out-of-order requests, abort/timeout, mutation/refetch version, logout/route unmount와 no-stale/no-leak assertions를 실행합니다.",
    operations: "credential rotation, request active/abort/stale/timeout/retry/result counts, provider quota/circuit와 incident rollback/reconciliation runbook을 운영합니다.",
    concepts: [
      c("request ownership", "어떤 component/route/query key가 request lifecycle, result commit와 cancellation을 책임지는지 정한 경계입니다.", ["trigger와 cleanup을 연결합니다.", "shared cache와 구분합니다."]),
      c("credential-like literal", "client source나 bundle에 있어 secret일 가능성이 높고 즉시 redaction·rotation assessment가 필요한 value입니다.", ["공개 문서에 복사하지 않습니다.", "prefix만으로 안전하지 않습니다."]),
      c("stale commit", "이전 request/version 결과가 더 최신 UI state나 identity 위에 적용되는 잘못된 update입니다.", ["latest/version guard로 막습니다.", "abort만으로 충분하지 않을 수 있습니다."]),
    ],
    codeExamples: [node("react16-source-risk", "request lifecycle·secret hygiene gap inventory", "React16Audit.mjs", "원본의 개선된 status/loading과 남은 cleanup/race/secret gaps를 redacted codes로 출력합니다.", String.raw`const checks = [
  ["status-check", true],
  ["loading-state", true],
  ["error-state", true],
  ["abort-cleanup", false],
  ["latest-wins", false],
  ["client-secret-free", false],
  ["refetch-awaited", false],
];
console.log("present=" + checks.filter((x) => x[1]).length);
console.log("gaps=" + checks.filter((x) => !x[1]).map((x) => x[0]).join(","));
console.log("publish-safe=" + checks.every((x) => x[1]));`, "present=3\ngaps=abort-cleanup,latest-wins,client-secret-free,refetch-awaited\npublish-safe=false", ["local-fetch1", "local-fetch2", "local-axios", "local-guest-api", "local-guest-page", "owasp-secrets"])],
  }),
  appliedTopic({
    id: "cleanup-symmetry", title: "setup이 획득한 모든 resource와 callback 권한을 cleanup에서 대칭적으로 폐기합니다",
    lead: "cleanup을 unmount 때 한 번 실행되는 마지막 처리로 보지 않고 dependency change 전과 development probe에서 반복되는 normal lifecycle transition으로 설계합니다.",
    mechanism: "Effect setup마다 AbortController, listener, timer, subscription, reader 또는 connection handle을 local scope에서 만들고 cleanup은 해당 generation의 exact handles를 abort/remove/clear/cancel/close합니다.",
    workflow: "resource acquisition list와 release API/idempotency/error behavior를 작성하고 setup partially fails case까지 try/finally 또는 composed disposer로 정리합니다.",
    invariants: "cleanup은 여러 번 호출되어도 안전하고 새 generation resource를 old cleanup이 폐기하지 않으며 release failure가 나머지 cleanup을 막지 않습니다.",
    edgeCases: "setup throw midway, cleanup throw, multiple resources, async close, dependency change during pending setup, HMR/StrictMode와 process/page termination을 다룹니다.",
    failureModes: "module-global controller/handle을 공유하면 old cleanup이 new request를 abort하고 첫 release throw 뒤 listeners/timers가 leak될 수 있습니다.",
    verification: "acquire/release multiset, partial setup, repeated cleanup, old/new generation isolation, active zero/baseline와 failure injection을 test합니다.",
    operations: "resource type별 active/acquired/released/error age를 관찰하고 leak threshold, force-disconnect와 process restart runbook을 둡니다.",
    concepts: [
      c("disposer", "한 resource나 setup 묶음을 안전하게 release하는 cleanup function입니다.", ["idempotent하게 설계합니다.", "reverse acquisition order를 고려합니다."]),
      c("generation", "한 Effect setup invocation이 소유하는 request/resource lifecycle instance입니다.", ["old/new를 구분합니다.", "local handles를 가집니다."]),
      c("cleanup isolation", "old generation cleanup이 current/new generation resources나 state를 변경하지 않는 성질입니다.", ["identity guard가 필요합니다.", "shared global을 피합니다."]),
    ],
    codeExamples: [node("react16-disposer-stack", "resource disposer 역순·오류 격리", "React16Disposers.mjs", "세 resource를 획득하고 한 cleanup failure에도 나머지를 release해 active zero를 만드는 model입니다.", String.raw`const active = new Set();
const disposers = [];
function acquire(id, fails = false) {
  active.add(id);
  disposers.push(() => { active.delete(id); if (fails) throw new Error("release:" + id); });
}
acquire("listener");
acquire("timer", true);
acquire("request");
const errors = [];
for (const dispose of disposers.reverse()) {
  try { dispose(); } catch (error) { errors.push(error.message); }
}
console.log("active=" + active.size);
console.log("errors=" + errors.join(","));`, "active=0\nerrors=release:timer", ["react-use-effect", "react-synchronizing", "local-fetch2"])],
  }),
  appliedTopic({
    id: "abort-controller-fetch", title: "AbortController·AbortSignal로 in-flight fetch의 network·body consumption을 취소합니다",
    lead: "ignore flag만으로 state commit을 막는 것과 실제 request/body 작업을 중단하는 것을 구분하고 controller를 한 Effect generation에 소유시킵니다.",
    mechanism: "AbortController.abort는 associated signal을 aborted로 만들고 fetch/request/body consumption이 AbortError-like failure로 reject될 수 있습니다. cleanup은 controller.abort를 호출하고 catch는 abort를 user error와 구분합니다.",
    workflow: "setup에서 controller를 만들고 fetch options에 signal을 전달하며 cleanup abort, try/catch/finally에서 abort/timeout/network/HTTP/schema를 분류합니다.",
    invariants: "aborted result는 error banner/alert로 표시하지 않고 controller를 unrelated requests에 재사용하지 않으며 abort 뒤 response parse/commit를 진행하지 않습니다.",
    edgeCases: "already aborted signal, abort after headers/before body, stream reader, custom reason, library adapter support, service worker/cache와 keepalive를 다룹니다.",
    failureModes: "controller를 state/module에 공유하면 unrelated calls가 취소되고 abort catch를 generic outage로 표시하면 navigation 때 false error가 보이며 signal을 fetch에 안 넘기면 cleanup이 no-op입니다.",
    verification: "abort before/start/headers/body, cleanup, custom reason, no error UI/no commit, active request/resource와 browser/library compatibility tests를 실행합니다.",
    operations: "abort reason/phase/count와 bytes/time saved를 low-cardinality로 관찰하고 high abort rate는 navigation/design/performance regression으로 조사합니다.",
    concepts: [
      c("AbortController", "하나 이상의 abort-aware operations에 cancellation signal을 발행하는 browser controller입니다.", ["generation scope로 만듭니다.", "abort는 idempotent합니다."]),
      c("AbortSignal", "aborted state, reason과 abort event를 operation에 전달하는 read-only signal입니다.", ["fetch options에 넘깁니다.", "composition APIs가 있습니다."]),
      c("abort classification", "user navigation/dependency cleanup/timeout/manual cancel을 network/HTTP/application failure와 구분하는 error taxonomy입니다.", ["UX와 retry가 다릅니다.", "raw reason을 노출하지 않습니다."]),
    ],
    codeExamples: [node("react16-abort-state", "cancellation reason과 UI result 분류", "React16Abort.mjs", "abort, timeout, HTTP와 network categories를 user-facing error 여부와 함께 분류합니다.", String.raw`function classify(error) {
  if (error.name === "AbortError" && error.reason === "cleanup") return { kind: "aborted", show: false };
  if (error.name === "TimeoutError") return { kind: "timeout", show: true };
  if (error.status === 429) return { kind: "rate-limit", show: true };
  if (typeof error.status === "number") return { kind: "http", show: true };
  return { kind: "network", show: true };
}
for (const error of [
  { name: "AbortError", reason: "cleanup" },
  { name: "TimeoutError" },
  { status: 429 },
  { status: 404 },
  { name: "TypeError" },
]) console.log(JSON.stringify(classify(error)));`, "{\"kind\":\"aborted\",\"show\":false}\n{\"kind\":\"timeout\",\"show\":true}\n{\"kind\":\"rate-limit\",\"show\":true}\n{\"kind\":\"http\",\"show\":true}\n{\"kind\":\"network\",\"show\":true}", ["mdn-abort-controller", "mdn-abort-signal", "fetch-standard", "react-fetching-effects"])],
  }),
  appliedTopic({
    id: "ignore-vs-abort", title: "ignore flag·abort·cache deduplication의 서로 다른 역할을 조합합니다",
    lead: "모든 async API가 abort를 지원하지 않고 abort가 이미 완료된 callback commit을 되돌리지는 않으므로 generation active flag와 result identity guard를 보조 방어로 사용합니다.",
    mechanism: "ignore/active flag는 old callback의 state commit을 막지만 network/resource를 중단하지 않습니다. abort는 지원 operation을 취소하고 shared cache는 duplicate request ownership을 component 밖에서 deduplicate합니다.",
    workflow: "operation cancellation support와 sharing을 조사해 per-component Effect는 abort+active/generation guard, shared query는 cache subscriber unsubscribe와 cache request policy를 사용합니다.",
    invariants: "flag는 cleanup closure의 generation-local value이고 shared request를 한 consumer unmount가 임의 abort하지 않으며 current identity/version을 commit 직전에 다시 확인합니다.",
    edgeCases: "uncancellable promise, CPU worker, cached immediate resolve, multiple subscribers, abort race, retry promise chain, mutation response와 library cancellation semantics를 다룹니다.",
    failureModes: "ignore만 쓰면 abandoned requests/quota가 계속 소모되고 per-consumer abort가 shared fetch를 깨며 module-global active flag가 다른 instances를 섞습니다.",
    verification: "abortable/uncancellable, immediate/late, one/multi subscribers, cache hit/miss, unmount/remount와 resource/commit counts를 test합니다.",
    operations: "abandoned work, shared consumer/ref count, dedup/cache hit, abort and stale commit prevention을 관찰하고 cache owner/eviction/runbook을 둡니다.",
    concepts: [
      c("ignore flag", "cleanup 뒤 해당 async generation의 callback result를 UI state에 commit하지 않도록 막는 local boolean guard입니다.", ["resource를 취소하지 않습니다.", "generation scope입니다."]),
      c("deduplication", "같은 normalized request key의 concurrent work를 하나로 공유해 duplicate I/O를 줄이는 처리입니다.", ["consumer lifetime과 request owner를 분리합니다.", "cache policy가 필요합니다."]),
      c("commit guard", "result 적용 직전에 generation/key/version/current identity가 여전히 맞는지 확인하는 final condition입니다.", ["abort를 보완합니다.", "stale result를 막습니다."]),
    ],
    codeExamples: [node("react16-active-generation", "generation-local result commit guard", "React16Generation.mjs", "old generation을 cleanup한 뒤 늦은 결과는 무시하고 current 결과만 commit합니다.", String.raw`let current = 0;
let state = "idle";
function start(key) {
  const generation = ++current;
  let active = true;
  return {
    finish(value) {
      if (!active || generation !== current) return "ignored";
      state = key + ":" + value; return "committed";
    },
    cleanup() { active = false; },
  };
}
const first = start("a");
first.cleanup();
const second = start("b");
console.log("old=" + first.finish("old"));
console.log("new=" + second.finish("new"));
console.log("state=" + state);`, "old=ignored\nnew=committed\nstate=b:new", ["react-fetching-effects", "react-use-effect", "tanstack-query-cancellation"])],
  }),
  appliedTopic({
    id: "latest-wins-versioning", title: "rapid key changes와 mutation/refetch에 latest-wins·entity version·operation identity를 적용합니다",
    lead: "abort timing에 의존하지 않고 request sequence, query key, entity id/version와 mutation id를 result commit 조건에 포함해 slow old response가 current screen을 덮지 못하게 합니다.",
    mechanism: "each request captures monotonically increasing sequence와 normalized key/version. response commit은 current sequence/key와 같고 component active이며 server version conflict가 없을 때만 수행합니다.",
    workflow: "query/mutation identities를 만들고 state machine에 requestedAt/sequence/key/baseVersion을 보존하며 refetch 또는 optimistic reconciliation이 어떤 결과를 authoritative하게 채택할지 정의합니다.",
    invariants: "different entity/query results를 섞지 않고 mutation success 뒤 old list response가 new item을 지우지 않으며 version conflict는 overwrite 대신 explicit recovery로 전환합니다.",
    edgeCases: "A→B→A, cache hit, same key forced refresh, concurrent edit/delete, mutation then list, pagination/filter change, clock skew와 server version missing을 다룹니다.",
    failureModes: "loading boolean 하나와 shared data state는 overlapping requests를 표현하지 못하고 mutation 직후 fire-and-forget list가 old snapshot을 commit할 수 있습니다.",
    verification: "deferred response permutations, A-B-A, forced refresh, mutation/list ordering, 409/ETag conflict, cache/version and no-lost-update tests를 실행합니다.",
    operations: "stale discarded, conflict/reconcile, sequence/key, optimistic rollback와 data age metrics를 privacy-safe하게 관찰하고 manual refresh/fallback을 둡니다.",
    concepts: [
      c("latest-wins", "동일 UI owner/key에서 가장 최신 generation result만 current state에 적용하는 concurrency policy입니다.", ["모든 domain operation에 적합하지는 않습니다.", "sequence가 필요합니다."]),
      c("base version", "edit/mutation이 읽고 시작한 entity representation version입니다.", ["server conflict 검증에 사용합니다.", "request sequence와 다릅니다."]),
      c("reconciliation", "mutation/cache/refetch results를 authority와 version policy에 따라 하나의 current client state로 합치는 과정입니다.", ["blind replace를 피합니다.", "rollback도 포함합니다."]),
    ],
    codeExamples: [node("react16-latest-version", "query sequence와 entity version commit", "React16Latest.mjs", "old sequence, wrong key와 older server version을 각각 거부합니다.", String.raw`let current = { sequence: 3, key: "item:7", version: 5, value: "current" };
function commit(result) {
  if (result.sequence !== current.sequence) return "stale-sequence";
  if (result.key !== current.key) return "wrong-key";
  if (result.version < current.version) return "older-version";
  current = { ...current, version: result.version, value: result.value };
  return "committed";
}
console.log(commit({ sequence: 2, key: "item:7", version: 6, value: "old-request" }));
console.log(commit({ sequence: 3, key: "item:8", version: 6, value: "wrong" }));
console.log(commit({ sequence: 3, key: "item:7", version: 4, value: "old-data" }));
console.log(commit({ sequence: 3, key: "item:7", version: 6, value: "new" }));
console.log(JSON.stringify(current));`, "stale-sequence\nwrong-key\nolder-version\ncommitted\n{\"sequence\":3,\"key\":\"item:7\",\"version\":6,\"value\":\"new\"}", ["local-guest-page", "rfc9110", "react-use-effect", "react-state-snapshot"])],
  }),
  appliedTopic({
    id: "deadline-timeout-signal", title: "timeout·deadline·user cancel·cleanup signals를 합성하고 이유별 UX를 분리합니다",
    lead: "setTimeout에서 reject만 하고 request를 남기지 않고 AbortSignal timeout/any 또는 compatible composition으로 one cancellation channel과 end-to-end deadline budget을 만듭니다.",
    mechanism: "deadline은 user action 전체 허용 시간이고 connect/read/provider retries가 그 budget을 나눕니다. timeout signal과 cleanup/user signal을 합성해 whichever first abort reason을 분류합니다.",
    workflow: "UI interaction deadline, individual attempt timeout, retry delays와 server timeouts를 budget table로 만들고 signal을 모든 abort-aware layers에 전달합니다.",
    invariants: "timeout 뒤 underlying work가 계속되지 않고 timeout과 user/navigation cancel을 다른 error/telemetry로 분류하며 finally가 pending state/resource를 정리합니다.",
    edgeCases: "already expired deadline, nested adapters dropping signal, retry after remaining budget zero, hidden tab timers, streaming partial progress와 server continuing work를 다룹니다.",
    failureModes: "Promise.race timeout만 쓰면 losing fetch가 계속되고 각 layer timeout 합이 user deadline을 초과하며 abort reason을 generic network error로 숨깁니다.",
    verification: "fake clock/deadline, timeout before/after headers, user cancel, navigation cleanup, nested signal propagation, retries and active work zero를 test합니다.",
    operations: "deadline/attempt/abort reason, remaining budget, provider/server duration와 orphan work를 관찰하고 timeout tuning/circuit/fallback을 운영합니다.",
    concepts: [
      c("deadline", "operation 전체가 완료되어야 하는 absolute time boundary입니다.", ["remaining budget을 계산합니다.", "attempt timeout과 다릅니다."]),
      c("signal composition", "timeout, user cancel와 lifecycle cleanup 중 하나가 발생하면 operation 전체에 abort를 전달하는 결합입니다.", ["reason을 보존합니다.", "support matrix를 확인합니다."]),
      c("orphan work", "caller가 더 이상 결과를 사용하지 않는데 취소되지 않고 network/CPU/provider resource를 소비하는 작업입니다.", ["quota/비용을 만듭니다.", "active count로 탐지합니다."]),
    ],
    codeExamples: [node("react16-deadline-budget", "end-to-end deadline의 남은 attempt budget 계산", "React16Deadline.mjs", "elapsed time과 retry delay를 반영해 다음 attempt 가능 시간과 stop을 계산합니다.", String.raw`function remaining(deadline, now, retryDelay, attemptCap) {
  const afterDelay = deadline - now - retryDelay;
  return Math.max(0, Math.min(attemptCap, afterDelay));
}
for (const row of [
  [1000, 100, 100, 400],
  [1000, 700, 200, 400],
  [1000, 950, 100, 400],
]) console.log(remaining(...row));
`, "400\n100\n0", ["mdn-abort-timeout", "mdn-abort-any", "fetch-standard"])],
  }),
  appliedTopic({
    id: "retry-backoff-idempotency", title: "retry를 status·method·idempotency·Retry-After·deadline과 함께 제한합니다",
    lead: "catch되면 즉시 재호출하는 loop가 아니라 transient eligibility, exponential backoff+jitter, cap/attempt/deadline와 duplicate mutation 방지를 하나의 policy로 설계합니다.",
    mechanism: "safe/idempotent read는 transient network/408/429/selected 5xx에 제한 retry할 수 있고 mutation은 operation idempotency key/server dedup contract 없이는 자동 retry가 duplicate effects를 만들 수 있습니다.",
    workflow: "method/operation semantics와 error taxonomy를 입력으로 retry decision, Retry-After honoring, exponential delay+jitter, max attempts/deadline와 user cancel을 계산합니다.",
    invariants: "validation/auth/permanent 4xx를 retry하지 않고 abort는 retry하지 않으며 every retry가 same logical operation identity와 remaining deadline을 보존합니다.",
    edgeCases: "429 date/seconds, 503, DNS/offline, response body partial, POST idempotency key, refresh token, concurrent retriers, retry storm와 browser online event를 다룹니다.",
    failureModes: "all errors retry는 rate limit/credential failure와 outage를 증폭하고 POST retry는 duplicate records를 만들며 fixed delay synchronized clients가 thundering herd를 만듭니다.",
    verification: "decision table, deterministic jitter seed, Retry-After parse, deadline exhaustion, idempotency duplicate, abort and circuit-open tests를 실행합니다.",
    operations: "attempt/outcome/delay/Retry-After/circuit/provider quota를 관찰하고 retry budget, global load shedding와 manual fallback runbook을 둡니다.",
    concepts: [
      c("retry eligibility", "operation semantics와 failure category가 자동 재시도를 허용하는지 판정하는 규칙입니다.", ["status만 보지 않습니다.", "idempotency/deadline을 포함합니다."]),
      c("exponential backoff with jitter", "attempt마다 지연을 늘리고 무작위 분산을 추가해 provider와 clients 동시 부하를 줄이는 schedule입니다.", ["cap/deadline이 필요합니다.", "Retry-After를 존중합니다."]),
      c("idempotency key", "재전송된 mutation이 같은 logical operation임을 server가 식별·deduplicate하기 위한 opaque identity입니다.", ["server contract가 필요합니다.", "secret/PII를 넣지 않습니다."]),
    ],
    codeExamples: [node("react16-retry-policy", "method·status·abort별 retry eligibility", "React16Retry.mjs", "GET transient/rate-limit과 idempotency-key POST만 제한 retry하도록 결정합니다.", String.raw`function retry({ method, status, aborted, key, attempt }) {
  if (aborted || attempt >= 3) return false;
  const transient = status === 408 || status === 429 || status >= 500;
  if (!transient) return false;
  if (method === "GET" || method === "HEAD") return true;
  return Boolean(key);
}
for (const item of [
  { method: "GET", status: 503, aborted: false, attempt: 0 },
  { method: "POST", status: 503, aborted: false, attempt: 0 },
  { method: "POST", status: 503, aborted: false, key: "k-1", attempt: 0 },
  { method: "GET", status: 400, aborted: false, attempt: 0 },
  { method: "GET", status: 503, aborted: true, attempt: 0 },
]) console.log(retry(item));`, "true\nfalse\ntrue\nfalse\nfalse", ["rfc9110", "rfc6585", "aws-backoff", "local-guest-api"])],
  }),
  appliedTopic({
    id: "stream-reader-worker-cleanup", title: "stream reader·WebSocket·EventSource·Worker의 partial result와 shutdown을 관리합니다",
    lead: "fetch Promise 하나보다 오래 사는 streams와 push channels는 reader/connection ownership, framing, backpressure, reconnect와 partial UI rollback이 필요합니다.",
    mechanism: "ReadableStream reader는 cancel/releaseLock, WebSocket/EventSource는 close, Worker는 terminate/message listener cleanup을 가지며 incoming messages/chunks는 current generation and schema를 통과해 commit됩니다.",
    workflow: "protocol framing/schema, connection states, queue/buffer limit, heartbeat/reconnect, cancellation과 final/partial result policy를 state machine으로 정의합니다.",
    invariants: "cleanup 뒤 messages/chunks가 UI를 갱신하지 않고 buffers가 unbounded하지 않으며 partial payload를 complete domain object처럼 처리하지 않습니다.",
    edgeCases: "half message, malformed frame, reconnect duplicate, network sleep/resume, browser offline/background, worker error, slow consumer와 server unaware disconnect를 다룹니다.",
    failureModes: "reader cancel 없이 navigation하면 bytes/CPU가 계속되고 reconnect가 listeners를 중복 등록하며 unbounded message array가 memory를 고갈시킵니다.",
    verification: "partial/malformed/slow streams, cancel mid-read, reconnect dedup, buffer cap/backpressure, unmount and active handles/memory tests를 실행합니다.",
    operations: "connection/reader/worker active, queue depth/dropped/duplicates, reconnect/error/bytes/age를 관찰하고 drain/force-close/fallback을 운영합니다.",
    concepts: [
      c("backpressure", "producer 속도가 consumer 처리·render 속도를 넘을 때 buffer, pause, sampling 또는 drop 정책으로 부하를 통제하는 메커니즘입니다.", ["semantics를 명시합니다.", "memory budget이 필요합니다."]),
      c("partial result", "stream이 아직 끝나지 않아 final schema/invariant 전체를 만족하지 않을 수 있는 중간 데이터입니다.", ["UI 표식을 둡니다.", "commit policy가 필요합니다."]),
      c("graceful shutdown", "new work를 중단하고 pending data를 제한 시간 처리한 뒤 connection/reader/worker resources를 release하는 종료 절차입니다.", ["force close fallback이 있습니다.", "cleanup과 연결합니다."]),
    ],
  }),
  appliedTopic({
    id: "unmount-hidden-navigation", title: "unmount·route change·hidden/offscreen와 logout에서 data visibility·cleanup 정책을 구분합니다",
    lead: "component가 화면에서 사라졌다는 사실과 data가 invalid하다는 사실을 같게 보지 않고 route/cache/auth owner가 cancellation, retention와 sensitive purge를 결정합니다.",
    mechanism: "unmount는 component-local Effect cleanup을 실행하지만 shared cache/request는 다른 subscribers가 있으면 유지될 수 있습니다. logout은 auth-scoped cache, queued callbacks와 persisted sensitive state를 별도 purge합니다.",
    workflow: "resource/data별 owner, visibility, subscriber/ref count, retention TTL, auth/tenant scope, purge event와 navigation prefetch policy를 정의합니다.",
    invariants: "logout/tenant switch 뒤 old authenticated result가 commit/display되지 않고 hidden component subscription policy가 explicit하며 route change가 shared work를 잘못 취소하지 않습니다.",
    edgeCases: "back-forward cache, tab hidden, Suspense/offscreen, shared query, route prefetch, logout mid-request, account switch, multiple tabs와 cache persistence를 다룹니다.",
    failureModes: "isMounted global flag는 multiple instances를 섞고 unmount마다 cache를 지우면 navigation 성능이 나빠지며 logout 뒤 queued response가 user data를 재삽입할 수 있습니다.",
    verification: "multi-subscriber, unmount one/all, hide/show, logout/tenant switch mid-request, cache purge/persist, back navigation and cross-tab tests를 실행합니다.",
    operations: "active subscribers, cache auth scope/age, post-logout drops와 purge success를 관찰하고 incident-wide revocation/cache flush runbook을 둡니다.",
    concepts: [
      c("subscriber ref count", "shared resource/query를 현재 사용하는 consumers 수로 zero일 때 abort/retention policy를 결정하는 값입니다.", ["owner가 관리합니다.", "component global flag와 다릅니다."]),
      c("auth-scoped cache", "user/tenant authorization identity에 묶여 logout/switch 때 invalidate·purge해야 하는 cached data입니다.", ["key와 storage isolation이 필요합니다.", "public cache와 구분합니다."]),
      c("post-logout commit", "logout 후 이전 authenticated request/callback이 state/cache에 sensitive data를 다시 넣는 race입니다.", ["generation/auth epoch로 거부합니다.", "purge만으로 부족합니다."]),
    ],
  }),
  appliedTopic({
    id: "race-fault-tests-operations", title: "deterministic deferred tests·resource counters·secret scan과 production race observability를 운영합니다",
    lead: "빠른 mock Promise 한 개로는 race가 재현되지 않으므로 completion order를 직접 제어하고 모든 permutation에서 current result, no leak와 no secret를 증명합니다.",
    mechanism: "deferred promises/fake streams/fake clocks가 start와 resolve/reject order를 제어하고 integration fixture는 real AbortSignal/network/React lifecycle을 검증하며 resource counters가 acquire/release를 비교합니다.",
    workflow: "request generations A/B/C의 resolve permutations, abort/timeout/unmount/logout, retry/stream와 malformed/secret canary cases를 table로 만들어 seeded reproducible tests와 production-like canary에 연결합니다.",
    invariants: "tests는 setTimeout 운에 의존하지 않고 current key/version final state와 discarded reasons, active zero/baseline, forbidden sink zero를 assert합니다.",
    edgeCases: "same tick resolutions, abort after resolve before commit, cleanup failure, retry overlap, shared subscriber, StrictMode, process/browser differences와 unhandled rejection을 다룹니다.",
    failureModes: "await fetch mock 즉시 resolve는 stale race를 숨기고 arbitrary sleep test는 flaky하며 secret scan이 source만 보고 built bundle/source map/log를 놓칠 수 있습니다.",
    verification: "all relevant order permutations, browser integration, active handles/unhandled rejections, heap/queue budgets, built artifact/source-map/log secret scans와 rollback rehearsal를 실행합니다.",
    operations: "stale/abort/timeout/retry/leak/secret canary metrics와 affected build/provider versions를 관찰하고 kill switch, credential rotation, cache purge와 reconciliation runbook을 운영합니다.",
    concepts: [
      c("deferred test promise", "test가 resolve/reject 시점을 직접 제어해 async completion order를 결정적으로 만드는 Promise fixture입니다.", ["race permutations에 사용합니다.", "real network test를 보완합니다."]),
      c("resource counter", "request/listener/timer/reader/connection의 acquire·release·active cardinality를 기록하는 test/telemetry instrument입니다.", ["high-cardinality identity는 노출하지 않습니다.", "leak threshold를 둡니다."]),
      c("secret artifact scan", "source뿐 아니라 built bundle, source map, logs/reports와 caches에서 credential canary/pattern을 검사하는 release gate입니다.", ["actual secret을 출력하지 않습니다.", "rotation과 연결합니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "local-fetch1", repository: "D:/dev/my-app01", path: "src/pages/step17-Fetch/FetchTest01.jsx", usedFor: ["mount fetch", "missing status/cleanup", "credential-like literal audit"], evidence: "2026-07-14 read-only audit: 25 lines, 960 bytes, SHA-256 D1369B0BB1ADE1B0C4EA7D785B7A2B791A9E86B59060C5D333C5E6EC4B834F16. 실제 endpoint/credential-like value는 공개 content에 복사하지 않았고 rotation 대상으로 분류했습니다." },
  { id: "local-fetch2", repository: "D:/dev/my-app01", path: "src/pages/step17-Fetch/FetchTest02.jsx", usedFor: ["response.ok", "loading/error/finally", "missing abort"], evidence: "2026-07-14 read-only audit: 43 lines, 1,474 bytes, SHA-256 48E3B23DDAF82EC97B8857F8C09945876DA0DEC22ECBD6F372C141CB403F4932. 실제 endpoint/credential-like value는 복사하지 않았습니다." },
  { id: "local-axios", repository: "D:/dev/my-app01", path: "src/pages/step18-Axios/AxiosTest01.jsx", usedFor: ["Axios error/loading", "missing cancellation", "credential-like literal audit"], evidence: "2026-07-14 read-only audit: 68 lines, 2,538 bytes, SHA-256 40B3700253746B25105F4BDFBDCF9D7F034513F038CA2A3CE06E67BCF85ADF48. 실제 endpoint/credential-like value는 복사하지 않았습니다." },
  { id: "local-guest-api", repository: "D:/dev/my-app03", path: "src/api/GuestBook.jsx", usedFor: ["CRUD request boundaries", "mutation identity context"], evidence: "2026-07-14 read-only audit: 13 lines, 365 bytes, SHA-256 42CC6DCDAFB0BA46A85307C7A762656B11FB8D3194F2DC44FBD44AF7F32D37D4. 실제 routes/domain values는 복사하지 않았습니다." },
  { id: "local-guest-page", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["mount list", "mutation/refetch race", "raw errors", "auth-scoped UI"], evidence: "2026-07-14 read-only audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. 실제 user/guestbook/password values는 복사하지 않았습니다." },
  { id: "react-use-effect", repository: "React official API", path: "reference/react/useEffect", publicUrl: "https://react.dev/reference/react/useEffect", usedFor: ["setup/cleanup", "dependency lifecycle"], evidence: "current useEffect lifecycle contract를 확인했습니다." },
  { id: "react-synchronizing", repository: "React official documentation", path: "learn/synchronizing-with-effects", publicUrl: "https://react.dev/learn/synchronizing-with-effects", usedFor: ["cleanup symmetry", "development probe"], evidence: "Effect synchronization/cleanup guidance를 확인했습니다." },
  { id: "react-fetching-effects", repository: "React official API", path: "reference/react/useEffect#fetching-data-with-effects", publicUrl: "https://react.dev/reference/react/useEffect#fetching-data-with-effects", usedFor: ["ignore flag", "race handling"], evidence: "official Effect fetch race example를 확인했습니다." },
  { id: "react-state-snapshot", repository: "React official documentation", path: "learn/state-as-a-snapshot", publicUrl: "https://react.dev/learn/state-as-a-snapshot", usedFor: ["async callback snapshot", "event/render state"], evidence: "React state snapshot semantics를 확인했습니다." },
  { id: "mdn-abort-controller", repository: "MDN Web Docs", path: "Web/API/AbortController", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController", usedFor: ["controller abort", "fetch/body cancellation"], evidence: "AbortController API and fetch/body abort를 확인했습니다." },
  { id: "mdn-abort-signal", repository: "MDN Web Docs", path: "Web/API/AbortSignal", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal", usedFor: ["signal state/reason", "abort events"], evidence: "AbortSignal current API를 확인했습니다." },
  { id: "mdn-abort-timeout", repository: "MDN Web Docs", path: "Web/API/AbortSignal/timeout_static", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static", usedFor: ["timeout signals"], evidence: "AbortSignal.timeout behavior를 확인했습니다." },
  { id: "mdn-abort-any", repository: "MDN Web Docs", path: "Web/API/AbortSignal/any_static", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static", usedFor: ["signal composition"], evidence: "AbortSignal.any composition behavior를 확인했습니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["fetch abort/request/response/body semantics"], evidence: "current Fetch Standard를 확인했습니다." },
  { id: "tanstack-query-cancellation", repository: "TanStack Query official documentation", path: "framework/react/guides/query-cancellation", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation", usedFor: ["shared query signal/cancellation context"], evidence: "TanStack Query current cancellation contract를 확인했습니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["idempotency/status/retry semantics", "conditional requests"], evidence: "HTTP semantics를 확인했습니다." },
  { id: "rfc6585", repository: "IETF RFC 6585", path: "rfc6585.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6585.html", usedFor: ["429 Retry-After context"], evidence: "Additional HTTP status codes including 429를 확인했습니다." },
  { id: "aws-backoff", repository: "AWS Builders Library", path: "timeouts-retries-and-backoff-with-jitter", publicUrl: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/", usedFor: ["retry/backoff/jitter", "load amplification"], evidence: "AWS primary engineering guidance on timeouts/retries/backoff/jitter를 확인했습니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "Secrets_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["credential rotation", "secret lifecycle"], evidence: "secret exposure, rotation and lifecycle guidance를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "react-16-effect-cleanup-race", slug: "react-16-effect-cleanup-race",
  courseId: "react", moduleId: "react-events-forms-hooks", order: 6,
  title: "Effect cleanup·취소와 비동기 race", subtitle: "AbortSignal, generation/version, deadline, retry와 resource shutdown으로 navigation·mutation·stream 경합을 통제합니다.",
  level: "고급", estimatedMinutes: 130,
  coreQuestion: "Effect나 event에서 시작한 비동기 작업이 겹치고 화면·identity가 바뀔 때 오래된 결과와 resource를 어떻게 확실히 폐기·복구할까요?",
  summary: "my-app01의 두 Fetch/Axios 예제와 my-app03 GuestBook API/Page를 read-only로 감사해 status/loading/error 개선과 mount/refetch 흐름을 보존합니다. 실제 source에 존재하는 credential-like literal, transport, no-abort/latest-wins, unawaited refetch와 raw logging 위험을 값 자체를 공개하지 않고 명시합니다. cleanup symmetry, AbortController, ignore/abort/cache 역할, generation/version latest-wins, deadline signal composition, constrained retry/idempotency, stream/worker shutdown, auth-scoped unmount/logout와 deterministic race/secret artifact gates를 official sources와 일곱 Node examples로 구현합니다.",
  objectives: ["원본 request flow의 cleanup/race/secret gaps를 redacted audit한다.", "generation별 resource disposer와 cleanup isolation을 설계한다.", "AbortController/Signal로 fetch/body를 취소하고 abort를 분류한다.", "ignore flag, abort와 shared cache ownership을 구분한다.", "sequence/key/entity version으로 stale commit을 막는다.", "deadline/timeout/user/cleanup signals를 합성한다.", "retry를 idempotency/status/backoff/deadline으로 제한한다.", "streams/workers와 unmount/logout resources를 안전하게 종료한다.", "deferred race/resource/secret artifact tests와 operational recovery를 운영한다."],
  prerequisites: [{ title: "Effect와 외부 시스템 동기화", reason: "Effect의 setup/dependency/cleanup과 fetch ownership을 알아야 cancellation, generation race와 retry/resource shutdown을 정확히 설계할 수 있습니다.", sessionSlug: "react-15-effect-synchronization" }],
  keywords: ["cleanup", "AbortController", "AbortSignal", "race condition", "latest-wins", "generation", "deadline", "timeout", "retry", "idempotency", "stream", "logout", "secret rotation"],
  topics,
  lab: {
    title: "원본 fetch·CRUD 흐름을 cancellable versioned request runtime으로 qualification하기",
    scenario: "원본 files는 변경하지 않고 redacted synthetic endpoints, deferred responses, fake streams와 disposable server에서 navigation·mutation·logout races를 재현합니다.",
    setup: ["Node 20 이상", "React StrictMode/browser fixture", "disposable HTTP/stream server", "deferred promises and fake clocks", "request/resource counters", "built artifact secret scanner", "원본 5 files read-only", "synthetic non-PII data"],
    steps: ["원본 5 files의 hash와 redacted credential/request lifecycle audit를 작성합니다.", "publicly exposed credential-like material을 rotation 대상으로 기록하고 client bundle secret-free architecture를 정의합니다.", "각 Effect generation에 controller, active guard, sequence/key/version와 disposer stack을 둡니다.", "A/B/A and mutation/refetch completion permutations에서 latest/version commit guard를 test합니다.", "cleanup/user/timeout signals와 remaining deadline을 모든 adapters에 전달합니다.", "abort/timeout/offline/HTTP/schema/429/5xx와 retry/idempotency/backoff decision table을 실행합니다.", "stream partial/malformed/slow/cancel와 queue/resource limits를 fault-test합니다.", "multi-subscriber unmount, route hide/show, logout/tenant switch와 auth cache purge를 검증합니다.", "StrictMode/production browser에서 unhandled rejection, active zero/baseline, stale/secret sink zero를 확인합니다.", "provider circuit/fallback, kill switch, credential rotation, cache purge, reconciliation and rollback runbook을 rehearsal합니다."],
    expectedResult: ["old/unmounted/other-identity results가 current UI/cache에 commit되지 않습니다.", "abort/timeout/cleanup 뒤 network/stream/listener resources가 expected baseline으로 돌아갑니다.", "retry가 transient/idempotent budget 안에서만 실행되고 duplicate mutations가 없습니다.", "logout/tenant switch 뒤 authenticated data와 queued callbacks가 재등장하지 않습니다.", "source/build/map/log/storage에 usable credential이 없고 rotation/incident rollback이 검증됩니다."],
    cleanup: ["temporary servers, streams, requests, timers/listeners, caches와 browser storage를 제거합니다.", "synthetic payloads, idempotency keys, secret canaries와 captured artifacts를 폐기합니다.", "fake clocks, network faults, verbose tracing와 feature flags를 원복합니다.", "원본 5 files hash/status unchanged를 확인합니다."],
    extensions: ["framework/query cache cancellation과 component Effect implementation을 differential test합니다.", "WebSocket/SSE reconnect·resume token·backpressure를 구현합니다.", "service worker/background sync에서 auth epoch와 cancellation을 확장합니다.", "static secret scan과 runtime request-generation tracing을 CI/observability에 자동 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 실제 React/browser request lifecycle과 대응시키세요.", requirements: ["stdout 완전 일치", "redacted source risk", "disposer balance", "abort taxonomy", "generation guard", "version commit", "deadline", "retry policy", "model 범위"], hints: ["ignore flag가 request 자체를 취소한다고 쓰지 마세요."], expectedOutcome: "비동기 generation의 start/commit/cleanup/abort를 설명합니다.", solutionOutline: ["audit→own/dispose→abort/guard→version/deadline→retry/stream→operate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 GuestBook list/mutation/refetch를 race-safe하게 재설계하세요.", requirements: ["query/mutation identities", "abort/latest/version", "awaited reconciliation", "optimistic/conflict rollback", "logout scope", "typed failures/retry", "resource/secret tests", "provider rollback"], hints: ["mutation 성공 뒤 무조건 list replace가 최신이라는 가정을 버리세요."], expectedOutcome: "rapid navigation과 concurrent mutation에도 lost/stale UI가 없는 flow가 완성됩니다.", solutionOutline: ["inventory→state machine→guards→reconcile→fault/security→canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 frontend async cancellation·race governance를 작성하세요.", requirements: ["ownership/generation", "cleanup/AbortSignal", "commit/version guard", "deadline/retry/idempotency", "stream/backpressure", "cache/auth scope", "secret lifecycle", "deterministic tests/telemetry/runbook"], hints: ["isMounted boolean recipe가 아니라 request/data/resource lifecycle을 정의하세요."], expectedOutcome: "request 시작부터 secret incident와 data reconciliation까지 감사 가능한 표준이 완성됩니다.", solutionOutline: ["classify→identify→cancel→guard→recover→purge→observe 순서입니다."] },
  ],
  nextSessions: ["react-17-ref-dom-imperative"], sources,
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["원본 source의 실제 endpoint, query, credential-like literal, user/guestbook/password values는 공개 examples와 evidence에 복사하지 않았고 rotation/redaction 대상으로만 기록했습니다.", "원본에 실제 credential-like literal이 있어 public site content는 usable value zero를 유지하며 source repository 자체의 rotation/removal은 별도 authorized remediation이 필요합니다.", "Node examples는 actual browser Fetch/Abort streams, React lifecycle, Axios/query cache, server idempotency/version/authorization을 대체하지 않으므로 lab integration을 요구합니다.", "인증 token storage/refresh와 network adapter의 전체 hardening은 React network/auth 및 DevOps security 과정에서 별도 심화합니다."] },
});

export default session;
