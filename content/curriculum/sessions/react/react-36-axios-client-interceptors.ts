import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAxiosRefs = ["local-axios", "local-app1-package", "local-http", "local-auth-api", "local-guest-api", "local-app3-package", "local-fetch-doc"];

const topics = [
  appliedTopic({
    id: "source-axios-boundary-audit", title: "Axios 예제·공통 instance·Auth/Guestbook adapters를 redacted call graph로 감사합니다",
    lead: "axios.get 사용 여부가 아니라 instance defaults, interceptor, token/storage, domain function, caller와 error sink의 실제 연결을 값 없이 복원합니다.",
    mechanism: "my-app01 Axios 예제는 request/loading/error와 provider data를 보여 주지만 source에 credential-like literal이 존재합니다. my-app03는 공통 instance와 domain adapters를 두며 Auth source에는 token-related logic이 있어 interceptor 동시성·storage·logout까지 별도 검증이 필요합니다.",
    workflow: "source/package hash, Axios snapshot version, imports, create/defaults, request/response interceptors, domain calls, token reads/writes, retry flags, error/log와 cancellation을 graph로 기록합니다.",
    invariants: "실제 URL/query/API-key/token/password/user/payload 값을 공개 content에 복사하지 않고 source observation, Axios current contract와 hardening proposal을 구분하며 원본은 변경하지 않습니다.",
    edgeCases: "global Axios use, multiple instances, hot reload duplicate interceptors, stale token, 401 burst, logout, public endpoints와 provider request를 포함합니다.",
    failureModes: "공통 file이 있다는 사실만으로 모든 calls가 instance를 쓴다고 가정하거나 interceptor가 보안을 자동 해결한다고 생각하면 bypass와 hidden global side effects를 놓칩니다.",
    verification: "import/call graph, interceptor registration/ejection, package-lock/runtime, secret/endpoint sink scan, synthetic request traces와 original hashes를 확인합니다.",
    operations: "instance/interceptor version, request policy path, bypass count와 credential incident를 privacy-safe하게 관찰하고 revoke/rotate/redeploy/cache purge를 둡니다.",
    concepts: [c("Axios instance", "defaults·adapter·interceptors가 격리된 callable client입니다.", ["global Axios와 구분합니다.", "service trust boundary별로 나눕니다."]), c("interceptor chain", "request 전과 response/rejection 후 config/result를 처리하는 ordered handlers입니다.", ["등록/eject lifecycle이 있습니다.", "domain logic을 숨길 수 있습니다."]), c("adapter call graph", "component→domain API→Axios instance→transport와 response 역방향을 나타낸 구조입니다.", ["bypass를 찾습니다.", "민감 값은 redaction합니다."])],
    codeExamples: [node("react36-source-callgraph", "redacted Axios call graph inventory", "React36SourceCallGraph.mjs", "실제 endpoints/credentials 없이 source별 역할과 review gaps를 출력합니다.", String.raw`const graph = [
  ["axios-example", "direct-client", "credential-review"],
  ["http-module", "shared-instance", "interceptor-lifecycle"],
  ["auth-api", "domain-adapter", "token-refresh-review"],
  ["guest-api", "domain-adapter", "schema-error-review"],
];
for (const row of graph) console.log(row.join("|"));
console.log("actual-values-copied=false");`, "axios-example|direct-client|credential-review\nhttp-module|shared-instance|interceptor-lifecycle\nauth-api|domain-adapter|token-refresh-review\nguest-api|domain-adapter|schema-error-review\nactual-values-copied=false", localAxiosRefs.concat(["axios-intro", "axios-instance", "owasp-secrets"]))],
  }),
  appliedTopic({
    id: "instance-defaults-config-precedence", title: "service별 instance와 config precedence를 explicit policy로 만듭니다",
    lead: "global defaults를 수정하지 않고 baseURL, timeout, credentials, headers, params serialization과 adapter를 trust boundary별 instance에 고정합니다.",
    mechanism: "Axios config는 library defaults, instance defaults, per-request config 순으로 merge되며 per-request 값이 우선합니다. absolute URL, allowAbsoluteUrls, headers와 timeout override는 security/performance policy를 우회할 수 있어 wrapper에서 validation합니다.",
    workflow: "internal API, public provider, upload처럼 origin/auth/SLA가 다른 instances를 만들고 immutable policy builder가 permitted request overrides만 merge하며 package/runtime versions를 lock합니다.",
    invariants: "untrusted input이 baseURL/origin/adapter/headers를 바꾸지 않고 credential-bearing instance를 third-party URL에 사용하지 않으며 timeout 0 같은 unbounded override를 금지합니다.",
    edgeCases: "relative/absolute URL, proxy base path, SSR Node adapter, preview environment, multipart, download, long polling와 per-call headers를 포함합니다.",
    failureModes: "global Authorization default는 third-party request에 credential을 누출할 수 있고 임의 absolute URL을 instance에 허용하면 SSRF/open proxy 성격의 abuse가 생깁니다.",
    verification: "config merge table, allowed/denied origin and overrides, browser/Node adapter parity, header case, timeout bounds와 actual raw request capture를 실행합니다.",
    operations: "instance name/config version, destination template, adapter와 override denial을 관찰하고 misconfiguration kill switch를 둡니다.",
    concepts: [c("config precedence", "library→instance→request 순으로 Axios options가 merge되는 우선순위입니다.", ["request가 보통 최종입니다.", "policy validator를 둡니다."]), c("trust-boundary instance", "origin·credential·SLA가 같은 calls만 처리하는 격리 Axios instance입니다.", ["provider별로 나눕니다.", "global defaults를 피합니다."]), c("absolute URL policy", "instance baseURL을 무시할 수 있는 absolute request URL 허용 여부와 origin allowlist입니다.", ["redirect도 검증합니다.", "user input을 금지합니다."])],
    codeExamples: [node("react36-config-merge", "Axios-like config precedence and policy model", "React36ConfigMerge.mjs", "library/instance/request merge 뒤 forbidden overrides를 거부합니다.", String.raw`const library = { timeout: 0, withCredentials: false };
const instance = { timeout: 3000, withCredentials: true, origin: "internal" };
const request = { timeout: 5000, origin: "external" };
const merged = { ...library, ...instance, ...request };
const allowed = merged.origin === "internal" && merged.timeout > 0 && merged.timeout <= 10000;
console.log("timeout=" + merged.timeout);
console.log("credentials=" + merged.withCredentials);
console.log("origin=" + merged.origin);
console.log("allowed=" + allowed);`, "timeout=5000\ncredentials=true\norigin=external\nallowed=false", ["axios-defaults", "axios-request-config", "fetch-standard", "local-http"])],
  }),
  appliedTopic({
    id: "request-interceptor-auth-context", title: "request interceptor를 최소 auth·correlation·deadline enrichment로 제한합니다",
    lead: "모든 request에서 storage를 읽고 header를 덮는 hidden mutation 대신 request metadata와 endpoint policy에 따라 필요한 정보만 추가합니다.",
    mechanism: "request interceptor fulfilled handler는 config를 반환해야 하며 synchronous/runWhen options와 ordered registration이 execution에 영향을 줄 수 있습니다. auth token은 current auth epoch와 destination/audience를 확인하고 correlation/deadline은 existing validated values를 존중합니다.",
    workflow: "public/auth/refresh/upload 등 request policy metadata를 선언하고 interceptor가 token provider, request ID, remaining deadline을 dependency로 읽어 allowlisted headers/options만 생성합니다.",
    invariants: "refresh/login/public/third-party request에 잘못된 token을 붙이지 않고 caller header를 무조건 신뢰·로그하지 않으며 async token retrieval이 cancellation/deadline을 넘지 않습니다.",
    edgeCases: "token expires between enqueue/send, logout/account switch, multiple auth audiences, hot reload, synchronous interceptor error와 retries를 포함합니다.",
    failureModes: "localStorage를 각 request에서 직접 읽으면 XSS/persistence와 test coupling이 생기고 refresh request에도 expired token/retry marker를 붙여 loop가 될 수 있습니다.",
    verification: "route policy matrix, token audience/epoch, public/refresh bypass, header injection, interceptor order/ejection와 concurrent logout tests를 실행합니다.",
    operations: "auth attached/skipped reason, token epoch—not value—, deadline remaining과 interceptor failure를 low-cardinality로 관찰합니다.",
    concepts: [c("request enrichment", "기본 config에 auth/correlation/deadline 같은 검증된 metadata를 추가하는 단계입니다.", ["domain payload를 바꾸지 않습니다.", "policy로 제한합니다."]), c("auth epoch", "login/logout/account switch generation으로 stale token/request를 거르는 version입니다.", ["token value와 다릅니다.", "cache/retry에 전달합니다."]), c("run condition", "특정 config/endpoint에서 interceptor 실행 여부를 정하는 predicate입니다.", ["bypass가 감사 가능해야 합니다.", "보안 검증을 server가 대체합니다."])],
  }),
  appliedTopic({
    id: "response-error-normalization", title: "Axios response와 AxiosError를 typed result로 정규화합니다",
    lead: "error.response/error.request/message 분기에서 끝내지 않고 validateStatus, response schema와 domain problem을 application 계약으로 바꿉니다.",
    mechanism: "Axios response는 data/status/headers/config/request를 제공하고 기본 validateStatus 밖의 status는 AxiosError rejection이 됩니다. AxiosError code/name/status와 response/request/setup branches는 adapter/runtime마다 다를 수 있으므로 raw object를 UI/log에 넘기지 않습니다.",
    workflow: "status policy를 명시하고 response data를 runtime schema로 검증하며 error는 cancel/timeout/network/HTTP/schema/domain/config/unknown stable codes로 ordered mapping합니다.",
    invariants: "HTTP 2xx라도 invalid schema는 success가 아니고 4xx를 resolve하도록 validateStatus를 바꿨다면 caller가 명시적으로 처리하며 config/headers/data/token을 diagnostics에서 redaction합니다.",
    edgeCases: "204, proxy HTML, empty error body, custom validateStatus, ERR_CANCELED/ECONNABORTED, Node/browser error shape와 toJSON을 포함합니다.",
    failureModes: "error.toJSON 전체를 log하면 config headers/data가 민감할 수 있고 모든 rejection을 네트워크 오류로 표시하면 auth/conflict/validation 복구가 사라집니다.",
    verification: "status/error code/adapter corpus, invalid data schema, safe log snapshot, localized messages, retry hints와 unknown fallback을 실행합니다.",
    operations: "stable failure class/status/domain code/adapter/build/correlation을 관찰하고 raw AxiosError sampling은 production에서 기본 금지합니다.",
    concepts: [c("validateStatus", "어떤 HTTP status를 Promise fulfillment/rejection으로 처리할지 결정하는 Axios config 함수입니다.", ["domain success와 다릅니다.", "일관된 policy가 필요합니다."]), c("AxiosError", "Axios가 request/response/config/error code context와 함께 반환하는 error shape입니다.", ["adapter 차이가 있습니다.", "safe normalize가 필요합니다."]), c("error normalization", "unstable raw error를 stable code, safe message, status, field errors와 retry hint로 바꾸는 경계입니다.", ["secret redaction을 포함합니다.", "root cause context를 보존합니다."])],
    codeExamples: [node("react36-error-normalizer", "Axios-like error branch normalizer", "React36ErrorNormalizer.mjs", "response/request/cancel/setup shapes를 stable failure code로 변환합니다.", String.raw`function normalize(e) {
  if (e.code === "ERR_CANCELED") return "cancelled";
  if (e.code === "ECONNABORTED") return "timeout";
  if (e.response) return "http:" + e.response.status;
  if (e.request) return "network";
  if (e.message) return "config";
  return "unknown";
}
for (const e of [{ code: "ERR_CANCELED" }, { code: "ECONNABORTED" }, { response: { status: 409 } }, { request: {} }, { message: "synthetic" }, {}]) console.log(normalize(e));`, "cancelled\ntimeout\nhttp:409\nnetwork\nconfig\nunknown", ["axios-errors", "axios-response", "axios-cancellation", "rfc9457", "local-axios", "local-auth-api"])],
  }),
  appliedTopic({
    id: "single-flight-token-refresh", title: "401 refresh를 single-flight·bounded replay와 auth epoch로 직렬화합니다",
    lead: "동시에 실패한 요청마다 refresh를 호출하지 않고 하나의 current refresh outcome을 기다리되 logout·재실패·unsafe mutation을 통제합니다.",
    mechanism: "response interceptor는 eligible 401에서 refresh promise 하나를 생성·공유하고 성공 시 current epoch를 확인해 replay-safe original requests를 한 번 재시도합니다. refresh endpoint와 already-retried request는 제외하고 failure는 auth state purge와 explicit reauthentication으로 전환합니다.",
    workflow: "request metadata에 auth required, replay safety, retry count, epoch를 두고 mutex/single-flight queue가 cancellation과 deadline을 존중하며 refresh token rotation 결과를 atomic commit합니다.",
    invariants: "동시 401 N개가 refresh N개를 만들지 않고 original Authorization/config를 안전하게 재생성하며 logout 이후 refresh/replay가 token이나 private data를 되살리지 않습니다.",
    edgeCases: "refresh 401/403/timeout, user logout during refresh, account switch, mutation after server commit, queue cancellation, tab concurrency와 token rotation reuse detection을 포함합니다.",
    failureModes: "config._retry boolean만 추가하면 type/policy가 불명확하고 non-idempotent mutation replay, infinite loop, token stampede와 post-logout resurrection이 생길 수 있습니다.",
    verification: "1/10/100 concurrent 401, one refresh, success/failure/logout/epoch, deadline/cancel, replay-safe matrix와 server rotation/reuse tests를 실행합니다.",
    operations: "refresh flight size/duration/outcome, replay count, epoch drops와 reuse/compromise signals를 관찰하고 revoke/logout-all/runbook을 둡니다.",
    concepts: [c("single-flight", "같은 refresh 작업이 진행 중이면 callers가 하나의 Promise/result를 공유하는 동시성 패턴입니다.", ["stampede를 막습니다.", "scope key가 필요합니다."]), c("bounded replay", "명시적 safety·count·deadline 안에서 original request를 제한적으로 재실행하는 정책입니다.", ["blind retry가 아닙니다.", "mutation uncertainty를 reconcile합니다."]), c("token resurrection", "logout/account switch 뒤 늦은 refresh가 credential과 private state를 다시 저장하는 race입니다.", ["auth epoch로 거부합니다.", "purge 후에도 guard합니다."])],
    codeExamples: [node("react36-refresh-flight", "single-flight refresh queue model", "React36RefreshFlight.mjs", "동시 401 requests가 하나의 refresh generation을 공유하는지 계산합니다.", String.raw`const requests = ["r1", "r2", "r3", "r4"];
let refreshCalls = 0; let flight = null;
function getFlight() { if (!flight) { refreshCalls += 1; flight = { id: "refresh-1", epoch: 7 }; } return flight; }
const joined = requests.map((id) => id + "->" + getFlight().id);
console.log(joined.join(","));
console.log("refresh-calls=" + refreshCalls);
console.log("epoch-match=" + (flight.epoch === 7));
console.log("replay-limit=1");`, "r1->refresh-1,r2->refresh-1,r3->refresh-1,r4->refresh-1\nrefresh-calls=1\nepoch-match=true\nreplay-limit=1", ["axios-interceptors", "axios-instance", "rfc9110", "local-auth-api", "local-http"])],
  }),
  appliedTopic({
    id: "cancellation-timeout-progress", title: "AbortSignal·timeout·upload/download progress와 cleanup을 adapter별로 검증합니다",
    lead: "deprecated cancellation recipe를 새 코드에 복사하지 않고 AbortController와 absolute deadline을 Axios config·adapter에 전달합니다.",
    mechanism: "Axios는 signal과 timeout을 지원하지만 timeout의 범위와 error code, progress event는 browser/Node adapter 및 version에 따라 다를 수 있습니다. total deadline은 retries와 body processing이 공유하고 unmount/user/logout는 signal로 취소합니다.",
    workflow: "caller가 signal/deadline을 소유하고 request config에 전달하며 response/stream/progress listeners를 cleanup하고 cancellation을 typed result로 처리합니다.",
    invariants: "cancelled/expired request가 store/cache를 commit하지 않고 duplicate controllers/listeners/timers를 남기지 않으며 progress가 total size unknown/large values에서 안전합니다.",
    edgeCases: "already aborted, headers received then cancel, timeout vs abort same tick, upload retry, Node stream, React StrictMode와 shared subscribers를 포함합니다.",
    failureModes: "timeout option만으로 DNS/connect/body/parse 전체 deadline이 보장된다고 단정하거나 CancelToken과 signal을 무기한 혼용하면 cleanup과 error classification이 복잡해집니다.",
    verification: "adapter/version-specific abort/timeout phases, active resources, progress monotonicity/unknown total, retry deadline와 component unmount를 실행합니다.",
    operations: "cancel/timeout phase, transferred size bucket, adapter/version과 cleanup failure를 관찰하고 stuck upload/download kill switch를 둡니다.",
    concepts: [c("AbortSignal config", "Axios request cancellation을 caller lifecycle에 연결하는 standard signal option입니다.", ["deprecated token과 구분합니다.", "하위 adapter 지원을 확인합니다."]), c("progress event", "upload/download 전송량 변화를 나타내는 adapter-specific notification입니다.", ["total이 없을 수 있습니다.", "render rate를 제한합니다."]), c("adapter parity", "browser XHR/fetch와 Node HTTP 등 Axios adapters가 같은 application contract를 만족하는지 확인하는 조건입니다.", ["error/stream 차이를 시험합니다.", "환경을 기록합니다."])],
  }),
  appliedTopic({
    id: "retry-transform-serialization", title: "transform·params serialization·retry를 protocol과 domain에서 분리합니다",
    lead: "interceptor 하나가 payload 변환과 retry를 모두 책임지지 않도록 pure serialization, transport retry와 mutation reconciliation을 나눕니다.",
    mechanism: "paramsSerializer와 transformRequest/transformResponse는 wire representation을 바꿀 수 있고 interceptor는 config/result를 조정합니다. 자동 JSON transform에 기대더라도 media type/schema를 검증하고 retry는 replayable serialized body와 idempotency policy가 있을 때만 수행합니다.",
    workflow: "domain command→validated DTO→canonical serializer→Axios config→wire를 단계화하고 response data→schema→domain mapper를 거치며 retry adapter는 immutable request descriptor를 받습니다.",
    invariants: "serialization은 deterministic하고 sensitive fields allowlist를 지키며 FormData/stream을 무조건 replay하지 않고 response transform이 invalid data를 trusted type으로 만들지 않습니다.",
    edgeCases: "array query formats, dates/big integers, undefined/null, multipart boundary, Blob/stream, circular data, compressed response와 charset을 포함합니다.",
    failureModes: "interceptor에서 arbitrary object를 mutation하면 retry마다 headers/body가 누적되고 transformResponse JSON 결과를 type assertion만으로 신뢰하게 됩니다.",
    verification: "golden wire fixtures, canonical params, sensitive allowlist, retry byte parity, non-replayable body denial와 response schema negatives를 실행합니다.",
    operations: "serializer/schema version, request size/type, retry replayability와 transformation failure를 관찰하고 version rollback을 둡니다.",
    concepts: [c("canonical serializer", "같은 validated DTO를 안정된 query/body bytes로 변환하는 pure function입니다.", ["서명/cache/retry에 유리합니다.", "sensitive allowlist를 둡니다."]), c("replayable body", "같은 logical operation에서 안전하게 다시 생성·전송할 수 있는 request body입니다.", ["stream/FormData는 주의합니다.", "idempotency와 별개입니다."]), c("domain mapper", "validated wire DTO를 application entity/result로 변환하는 경계입니다.", ["transport shape를 격리합니다.", "invalid data를 거부합니다."])],
    codeExamples: [node("react36-replay-policy", "serialized request replayability model", "React36ReplayPolicy.mjs", "method/body/idempotency key로 retry 가능성을 분류합니다.", String.raw`const cases = [
  ["GET", "none", false], ["PUT", "json", false], ["POST", "json", false],
  ["POST", "json", true], ["POST", "stream", true], ["DELETE", "none", true],
];
for (const [method, body, key] of cases) {
  const replayableBody = body === "none" || body === "json";
  const methodSafe = method === "GET" || method === "PUT" || method === "DELETE";
  console.log(method + ":" + body + ":" + key + "=" + (replayableBody && (methodSafe || key)));
}`, "GET:none:false=true\nPUT:json:false=true\nPOST:json:false=false\nPOST:json:true=true\nPOST:stream:true=false\nDELETE:none:true=true", ["axios-request-config", "axios-api", "rfc9110", "local-guest-api"])],
  }),
  appliedTopic({
    id: "interceptor-lifecycle-hot-reload", title: "interceptor 등록·순서·eject와 hot reload/test isolation을 lifecycle로 관리합니다",
    lead: "module import 때 영구 등록하는 side effect를 피하고 app/session/test owner가 handler를 설치·해제해 duplicate execution과 stale closures를 막습니다.",
    mechanism: "interceptors.use는 ID를 반환하고 eject로 제거할 수 있으며 registration order와 fulfilled/rejected chain이 behavior에 영향을 줍니다. provider/hook setup은 dependencies와 auth epoch를 명시하고 cleanup에서 IDs를 eject합니다.",
    workflow: "client factory가 base instance를 만들고 installPolicies가 interceptor IDs와 disposer를 반환하며 HMR, test, logout, app unmount에서 disposer를 정확히 한 번 실행합니다.",
    invariants: "동일 policy가 중복 등록되지 않고 handler가 stale store/token closure를 잡지 않으며 exception/rejection이 remaining cleanup과 stable normalization을 건너뛰지 않습니다.",
    edgeCases: "HMR, StrictMode setup/cleanup, multiple roots, microfrontends, test module cache, dynamic tenant와 policy replacement를 포함합니다.",
    failureModes: "페이지 render마다 interceptor를 등록하면 request당 handler가 증가하고 old token/dispatch를 계속 사용하며 duplicate retries/logs가 발생합니다.",
    verification: "install/uninstall cycles, handler count, order, error path, HMR/StrictMode/test reset와 active policy baseline을 확인합니다.",
    operations: "interceptor count/version/install owner, duplicate execution과 stale epoch drop을 관찰하고 policy disable/rollback 기능을 둡니다.",
    concepts: [c("interceptor ID", "Axios가 등록 handler를 나중에 eject하기 위해 반환하는 식별자입니다.", ["lifecycle owner가 보관합니다.", "request ID와 다릅니다."]), c("policy disposer", "설치한 interceptors/listeners/resources를 역순으로 제거하는 cleanup 함수입니다.", ["idempotent해야 합니다.", "test reset에 사용합니다."]), c("stale closure", "handler가 등록 당시 token/store/config를 계속 참조해 current context와 어긋나는 상태입니다.", ["provider를 동적으로 읽습니다.", "epoch를 검증합니다."])],
    codeExamples: [node("react36-interceptor-lifecycle", "interceptor install/eject registry model", "React36InterceptorLifecycle.mjs", "duplicate install을 막고 cleanup 뒤 baseline으로 돌아갑니다.", String.raw`let nextId = 1; const active = new Map();
function install(name) { if ([...active.values()].includes(name)) return null; const id = nextId++; active.set(id, name); return id; }
function eject(id) { return active.delete(id); }
const auth = install("auth"); const duplicate = install("auth"); const trace = install("trace");
console.log("auth=" + auth + "|duplicate=" + duplicate + "|trace=" + trace);
console.log("active=" + [...active.values()].join(","));
console.log("eject-auth=" + eject(auth));
console.log("remaining=" + [...active.values()].join(","));`, "auth=1|duplicate=null|trace=2\nactive=auth,trace\neject-auth=true\nremaining=trace", ["axios-interceptors", "axios-instance", "local-http", "local-app3-package"])],
  }),
  appliedTopic({
    id: "domain-adapter-dependency-boundary", title: "Axios config를 domain adapter의 typed command·result 뒤에 숨깁니다",
    lead: "component가 response.data나 AxiosError shape에 직접 결합하지 않도록 Auth·Guestbook 같은 feature boundary가 validated input과 stable result만 노출합니다.",
    mechanism: "domain adapter는 command/DTO를 schema로 검증하고 trust-boundary Axios instance를 호출한 뒤 status/data/problem을 application entity/result로 mapping합니다. component/store는 transport library와 endpoint를 알지 않고 pending·success·field error·conflict 같은 domain outcome을 처리합니다.",
    workflow: "feature별 interface와 input/result union을 정의하고 client, clock, ID, auth context를 constructor/factory dependency로 주입하며 production Axios implementation과 deterministic fake/disposable-server implementations를 같은 contract suite로 검증합니다.",
    invariants: "component가 Axios global/defaults/interceptors를 직접 조작하지 않고 domain adapter가 authorization을 대신한다고 주장하지 않으며 invalid response가 partial entity/cache를 commit하지 않습니다.",
    edgeCases: "partial DTO, API version skew, empty/duplicate entities, pagination, file upload, field problem, conflict, provider fallback와 offline adapter를 포함합니다.",
    failureModes: "모든 endpoint를 generic request<T>로만 노출하면 runtime schema와 domain semantics가 caller로 새고 test가 Axios implementation detail에 결합합니다.",
    verification: "type/runtime input negatives, response schema corpus, status/problem mapping, production/fake adapter contract parity, no partial commit와 direct Axios import architecture check를 실행합니다.",
    operations: "domain operation·stable outcome·schema/client policy version과 latency를 관찰하고 endpoint/path/payload/credential은 adapter 내부에서 redaction합니다.",
    concepts: [c("domain adapter", "transport request/response를 feature command와 stable application result로 변환하는 경계입니다.", ["Axios를 격리합니다.", "server authorization을 대체하지 않습니다."]), c("result union", "success, validation, unauthorized, conflict, unavailable 등 가능한 outcome을 식별 가능한 variants로 표현한 값입니다.", ["raw exception을 대체합니다.", "exhaustive handling을 돕습니다."]), c("dependency injection", "Axios client, clock, ID와 auth provider를 숨은 global 대신 명시적 parameter/factory dependency로 전달하는 설계입니다.", ["fault test를 가능하게 합니다.", "lifecycle owner를 드러냅니다."])],
  }),
  appliedTopic({
    id: "mock-adapter-contract-observability", title: "adapter contract tests·safe observability와 Axios upgrade/rollback을 운영합니다",
    lead: "Axios를 전역 mock해 원하는 data만 반환하지 않고 config merge, interceptor, adapter, wire/server와 browser gaps를 계층별로 검증합니다.",
    mechanism: "pure tests는 config/error/retry policy, custom/mock adapter는 interceptor contract, disposable HTTP server는 status/headers/body/delay, browser integration은 CORS/cookies/progress/cancel, provider canary는 upstream compatibility를 증명합니다.",
    workflow: "request descriptor와 expected normalized result corpus를 모든 adapters에 실행하고 logs/traces는 endpoint template, phase, stable code, attempt와 policy version만 allowlist합니다.",
    invariants: "tests/artifacts에 actual credentials/PII가 없고 mock이 interceptor order/error schema를 우회하지 않으며 Axios/runtime upgrade는 lockfile과 browser/Node matrix에서 qualification됩니다.",
    edgeCases: "adapter package drift, Node vs browser errors, proxy, HTTP/2 statusText, cancellation, upload progress, source maps와 minified stack을 포함합니다.",
    failureModes: "axios.get mock만 쓰면 instance/interceptor/config가 실행되지 않고 full config/error logging은 Authorization/body를 CI/telemetry에 노출합니다.",
    verification: "policy unit, adapter contract, disposable server, browser/provider canary, secret artifact scan, load/race/resource budgets와 old/new version rollback을 실행합니다.",
    operations: "Axios/adapter/policy version, request latency/failure/retry/refresh queue, interceptor count와 secret canary를 dashboard·alert·owner·runbook에 연결합니다.",
    concepts: [c("custom adapter", "Axios config를 받아 Promise response/error를 반환하는 transport abstraction입니다.", ["contract tests에 사용할 수 있습니다.", "browser wire test를 대체하지 않습니다."]), c("policy version", "client config/interceptor/error/retry behavior 묶음의 release identifier입니다.", ["trace와 연결합니다.", "rollback 단위입니다."]), c("safe telemetry allowlist", "수집을 허용한 endpoint template·phase·stable code 등 최소 fields 목록입니다.", ["config/data/header dump를 금지합니다.", "retention/access를 둡니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-axios", repository: "D:/dev/my-app01", path: "src/pages/step18-Axios/AxiosTest01.jsx", usedFor: ["direct Axios/loading/error flow", "credential-like source audit"], evidence: "2026-07-14 read-only sanitized audit: 68 lines, 2,538 bytes, SHA-256 40B3700253746B25105F4BDFBDCF9D7F034513F038CA2A3CE06E67BCF85ADF48. 실제 endpoint/query/key-like/display values는 복사하지 않았습니다." },
  { id: "local-app1-package", repository: "D:/dev/my-app01", path: "package.json", usedFor: ["local Axios dependency snapshot", "test/runtime capability"], evidence: "2026-07-14 read-only audit: 44 lines, 1,052 bytes, SHA-256 6FB7B7A0AD0C96237903AF33A63D476231C1496055E5EF423B2F385FB50BB7A5. version은 source snapshot이지 current recommendation이 아닙니다." },
  { id: "local-http", repository: "D:/dev/my-app03", path: "src/api/Http.jsx", usedFor: ["shared instance", "interceptor/config boundary"], evidence: "2026-07-14 read-only sanitized audit: 18 lines, 872 bytes, SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987. 실제 config/route values는 복사하지 않았습니다." },
  { id: "local-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["token/refresh/domain API call graph", "sensitive lifecycle audit"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 token/password/user/payload/route values는 복사하지 않았습니다." },
  { id: "local-guest-api", repository: "D:/dev/my-app03", path: "src/api/GuestBook.jsx", usedFor: ["CRUD domain adapter", "response/retry contract"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 365 bytes, SHA-256 42CC6DCDAFB0BA46A85307C7A762656B11FB8D3194F2DC44FBD44AF7F32D37D4. 실제 route/domain values는 복사하지 않았습니다." },
  { id: "local-app3-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["Axios/test dependency snapshot", "runtime compatibility"], evidence: "2026-07-14 read-only audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. version은 historical source snapshot입니다." },
  { id: "local-fetch-doc", repository: "D:/dev/REACT", path: "docs/react/09-fetch-axios.md", usedFor: ["local Fetch/Axios comparison", "run-result guide", "credential-like source audit"], evidence: "2026-07-14 read-only sanitized audit: 108 lines, 4,797 bytes, SHA-256 3A5B8BF21C44D86E331AED7A8B6E554E3B2F65FA91D576A48CFBFF22679F3507. 실제 URL/key-like/output strings는 복사하지 않았습니다." },
  { id: "axios-intro", repository: "Axios official documentation", path: "docs/intro", publicUrl: "https://axios-http.com/docs/intro", usedFor: ["browser/Node promise client overview", "feature scope"], evidence: "Axios 공식 introduction입니다." },
  { id: "axios-api", repository: "Axios official documentation", path: "docs/api_intro", publicUrl: "https://axios-http.com/docs/api_intro", usedFor: ["Axios request API and aliases"], evidence: "Axios 공식 API introduction입니다." },
  { id: "axios-instance", repository: "Axios official documentation", path: "docs/instance", publicUrl: "https://axios-http.com/docs/instance", usedFor: ["instance creation/call/retry context"], evidence: "Axios 공식 instance documentation입니다." },
  { id: "axios-defaults", repository: "Axios official documentation", path: "docs/config_defaults", publicUrl: "https://axios-http.com/docs/config_defaults", usedFor: ["default config and precedence"], evidence: "Axios 공식 config defaults documentation입니다." },
  { id: "axios-request-config", repository: "Axios official documentation", path: "docs/req_config", publicUrl: "https://axios-http.com/docs/req_config", usedFor: ["request options/adapter/transform/params/timeout/signal"], evidence: "Axios 공식 request config documentation입니다." },
  { id: "axios-response", repository: "Axios official documentation", path: "docs/res_schema", publicUrl: "https://axios-http.com/docs/res_schema", usedFor: ["response schema"], evidence: "Axios 공식 response schema documentation입니다." },
  { id: "axios-interceptors", repository: "Axios official documentation", path: "docs/interceptors", publicUrl: "https://axios-http.com/docs/interceptors", usedFor: ["request/response interceptor use/eject/options"], evidence: "Axios 공식 interceptors documentation입니다." },
  { id: "axios-errors", repository: "Axios official documentation", path: "docs/handling_errors", publicUrl: "https://axios-http.com/docs/handling_errors", usedFor: ["AxiosError branches/code/validateStatus/toJSON"], evidence: "Axios 공식 error handling documentation입니다." },
  { id: "axios-cancellation", repository: "Axios official documentation", path: "docs/cancellation", publicUrl: "https://axios-http.com/docs/cancellation", usedFor: ["AbortController/signal/timeout and deprecated cancellation context"], evidence: "Axios 공식 cancellation documentation입니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["browser Fetch/CORS/credentials/AbortSignal transport baseline"], evidence: "WHATWG Fetch 표준입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP method/status/idempotency/retry context"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["HTTP problem response normalization"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "Secrets_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["credential exposure/rotation/lifecycle"], evidence: "OWASP 공식 secret management guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-36-axios-client-interceptors", slug: "react-36-axios-client-interceptors", courseId: "react", moduleId: "react-router-network", order: 6,
  title: "Axios client·interceptor와 오류 경계", subtitle: "trust-boundary instances, config precedence, typed errors, single-flight refresh, cancellation과 adapter contract tests를 운영 가능한 policy로 만듭니다.",
  level: "고급", estimatedMinutes: 140,
  coreQuestion: "Axios의 편의 기능을 global side effect와 retry/security bug 없이 어떻게 명시적이고 테스트 가능한 HTTP application boundary로 만들까요?",
  summary: "my-app01 Axios 예제/package, my-app03 Http/Auth/Guestbook adapters/package와 REACT Fetch/Axios 문서를 read-only·sanitized 감사했습니다. 실제 endpoint, credential-like literal, token/password/user/payload는 복사하지 않고 rotation/removal 위험으로만 기록합니다. service별 instance/config precedence, request enrichment, response/AxiosError normalization, single-flight refresh, AbortSignal/progress, deterministic serialization/replay, interceptor lifecycle와 adapter/browser/provider qualification을 current Axios·WHATWG·IETF·OWASP 근거와 여섯 executable models로 심화합니다.",
  objectives: ["원본 Axios instance/interceptor/domain call graph를 redacted audit한다.", "trust boundary별 instance와 config precedence를 검증한다.", "request interceptor를 최소 auth/correlation/deadline enrichment로 제한한다.", "Axios response/error를 safe typed result로 정규화한다.", "동시 401을 single-flight refresh와 bounded replay로 처리한다.", "AbortSignal/timeout/progress와 adapter cleanup을 검증한다.", "serialization/transform/retry와 domain mapping을 분리한다.", "interceptor install/eject lifecycle을 관리한다.", "adapter/browser/provider tests와 safe observability/rollback을 운영한다."],
  prerequisites: [{ title: "Fetch와 HTTP request lifecycle", reason: "HTTP Request/Response, schema, cancellation, retry/cache/CORS와 secret boundary를 알아야 Axios abstractions의 실제 보장과 adapter gaps를 정확히 판단할 수 있습니다.", sessionSlug: "react-35-fetch-http-lifecycle" }],
  keywords: ["Axios", "instance", "config precedence", "interceptor", "AxiosError", "single-flight", "token refresh", "AbortSignal", "adapter", "serialization", "retry", "secret rotation"],
  topics,
  lab: { title: "원본 Axios adapters를 lifecycle-safe typed client policy로 qualification하기", scenario: "원본 files는 변경하지 않고 synthetic requests, disposable HTTP server와 browser/Node adapters에서 instance/interceptor/refresh/error/cancel behavior를 재현합니다.", setup: ["Node 20 이상", "source-compatible and current Axios snapshots", "browser and Node test adapters", "disposable HTTP/problem server", "deferred refresh/fake deadline", "resource/interceptor counters", "built artifact secret scanner", "원본 7 files read-only"], steps: ["원본 source/package hashes와 redacted call/interceptor/token/error graph를 기록합니다.", "credential-like material의 revoke/rotate/backend-boundary plan을 만들고 actual value는 출력하지 않습니다.", "internal/public/upload service instances와 immutable override policy를 구현합니다.", "request metadata별 auth/correlation/deadline interceptor와 install/eject lifecycle을 검증합니다.", "status/AxiosError/schema/domain normalization과 safe diagnostics를 corpus로 실행합니다.", "동시 401 single-flight refresh, auth epoch, bounded replay/logout races를 시험합니다.", "AbortSignal/timeout/progress와 active request/listener/timer baseline을 adapter별로 확인합니다.", "canonical params/body transforms, replayability/idempotency와 mutation reconciliation을 검증합니다.", "mock/custom adapter, disposable server, browser/CORS/provider canary를 같은 contract suite로 비교합니다.", "secret-free traces/artifacts, policy/Axios upgrade canary와 revoke/rollback/reconciliation runbook을 rehearsal합니다."], expectedResult: ["각 request가 올바른 trust-boundary instance와 current auth/deadline policy만 사용합니다.", "동시 401이 하나의 refresh로 합쳐지고 logout/epoch 뒤 token이나 data가 되살아나지 않습니다.", "raw AxiosError/config/data가 UI/log로 새지 않고 typed failure와 recovery action으로 변환됩니다.", "cancel/retry/adapter lifecycle 뒤 resources/interceptors가 baseline으로 돌아갑니다.", "source/build/maps/storage/telemetry에 reusable provider secret이 없고 upgrade/rollback evidence가 남습니다."], cleanup: ["Axios instances/interceptors, requests, timers/listeners, server/adapters와 browser storage를 제거합니다.", "synthetic tokens, payloads, problem fixtures, traces와 secret canaries를 폐기합니다.", "fake clocks/network/CORS, flags와 verbose diagnostics를 원복합니다.", "원본 7 files hash/status unchanged를 확인합니다."], extensions: ["OpenAPI-generated domain adapters를 같은 policy/contract suite에 연결합니다.", "multiple tabs의 refresh coordination과 token reuse detection을 설계합니다.", "upload resume/checksum과 progress accessibility를 qualification합니다.", "Axios/fetch adapter를 differential test하고 migration evidence를 만듭니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node examples를 실행하고 실제 Axios adapter/interceptor 결과와 대응시키세요.", requirements: ["stdout 완전 일치", "redacted call graph", "config policy", "error normalization", "refresh single-flight", "replay policy", "interceptor lifecycle", "model 범위"], hints: ["Node model을 Axios 실행·browser transport·server auth evidence라고 표현하지 마세요."], expectedOutcome: "Axios request가 config/interceptors/adapter를 거쳐 typed result로 돌아오는 lifecycle을 설명합니다.", solutionOutline: ["audit→instance/config→request/response→refresh/cancel→serialize/lifecycle→qualify 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Http/Auth/Guestbook adapters를 production-safe Axios architecture로 재설계하세요.", requirements: ["instance isolation", "config guards", "auth epoch/single-flight", "typed error/schema", "cancel/deadline", "replay/idempotency", "interceptor cleanup", "multi-layer tests", "rotation/rollback"], hints: ["interceptor에 domain UI와 모든 retry logic을 숨기지 마세요."], expectedOutcome: "인증·CRUD calls가 concurrency와 failure에서도 명시적이고 복구 가능한 계약을 지킵니다.", solutionOutline: ["threat/call graph→policies→normalize/constrain→fault-test→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 Axios governance를 작성하세요.", requirements: ["instances/config", "interceptor ownership", "auth/refresh", "errors/schema", "cancel/retry", "serialization", "test adapters", "privacy/upgrade/incident"], hints: ["wrapper API가 아니라 protocol·credential lifecycle과 rollback까지 정의하세요."], expectedOutcome: "Axios usage가 project마다 달라져도 동일한 correctness/security/operations evidence로 review됩니다.", solutionOutline: ["scope→install→enrich→normalize→bound→verify→recover 순서입니다."] },
  ],
  nextSessions: ["react-37-api-state-machine-cache"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["원본 Axios 예제/학습 문서의 actual endpoint와 credential-like literal은 공개 content에 복사하지 않고 revoke/rotate/removal 필요성만 기록했습니다.", "Auth source의 실제 token/password/user/payload/routes와 HTTP config values는 복사하지 않았습니다.", "package versions는 historical source snapshot이며 current Axios docs와 차이를 lab에서 qualification하도록 했습니다.", "Node models는 actual Axios config merge/interceptor order/adapters, browser transport, token server rotation과 HTTP semantics를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
