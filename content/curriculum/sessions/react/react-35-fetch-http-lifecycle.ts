import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localNetworkRefs = ["local-fetch-doc", "local-fetch1", "local-fetch2", "local-http", "local-auth-api", "local-guest-api"];

const topics = [
  appliedTopic({
    id: "source-network-boundary-audit", title: "Fetch·공통 client·Auth·Guestbook 원본을 redacted HTTP boundary로 감사합니다",
    lead: "API를 호출한다는 한 문장 대신 request construction, credential handling, response validation, error/cleanup과 caller contract를 파일별로 추적합니다.",
    mechanism: "my-app01 Fetch 예제는 public data request와 loading/error/status 흐름을 보여 주지만 실제 source와 학습 문서에 client-side credential-like literal과 endpoint가 포함됩니다. my-app03는 공통 HTTP adapter와 Auth/Guestbook functions를 두지만 network/domain/security 보장은 각 caller와 server까지 확인해야 합니다.",
    workflow: "source hash를 고정한 뒤 method, URL origin/path/query, headers/credentials, body, status check, parser, schema, error, timeout/abort/retry/cache와 log sinks를 값 없이 matrix로 기록합니다.",
    invariants: "원본은 변경하지 않고 actual endpoint/query/payload/user/token/password/API-key-like values를 공개 content에 복사하지 않으며 발견한 credential-like material은 rotation/removal 대상으로만 기록합니다.",
    edgeCases: "HTTP endpoint, mixed content, redirect, missing response.ok, non-JSON error, empty body, duplicate request, logout와 page unmount를 포함합니다.",
    failureModes: "fetch가 resolve했다는 이유로 HTTP 성공이라 판단하거나 browser에 provider secret을 넣으면 status/domain failure와 credential abuse를 놓칩니다.",
    verification: "source hashes, secret/endpoint sink scan, request/response contract table, disposable server replay, status/content-type/schema corpus와 original worktree unchanged를 확인합니다.",
    operations: "credential exposure는 revoke/rotate/redeploy/cache purge와 provider usage reconciliation runbook에 연결하고 network errors는 stable low-cardinality reason으로 관찰합니다.",
    concepts: [c("HTTP boundary", "browser application과 remote service 사이 request·response·failure 계약이 바뀌는 지점입니다.", ["transport와 domain을 분리합니다.", "adapter owner를 정합니다."]), c("credential-like literal", "API key/token처럼 사용할 가능성이 있어 값 공개 없이 secret lifecycle 대상으로 취급할 문자열입니다.", ["실제 유효성은 출력하지 않습니다.", "rotation을 우선합니다."]), c("redacted audit", "구조·hash·위험은 보존하되 endpoint·credential·개인정보 값을 제거한 source evidence입니다.", ["재현 가능한 metadata를 둡니다.", "보안 사고를 확대하지 않습니다."])],
    codeExamples: [node("react35-source-boundaries", "redacted network source inventory", "React35SourceBoundaries.mjs", "실제 URL과 credential을 출력하지 않고 source별 구조와 확인 과제를 기록합니다.", String.raw`const sources = [
  ["fetch1", "fetch", "credential-review", "status-gap"],
  ["fetch2", "fetch", "credential-review", "status-checked"],
  ["http", "shared-adapter", "config-boundary", "interceptor-review"],
  ["auth", "domain-api", "sensitive-fields", "response-contract"],
  ["guest", "domain-api", "crud", "response-contract"],
];
for (const row of sources) console.log(row.join("|"));
console.log("actual-values-copied=false");`, "fetch1|fetch|credential-review|status-gap\nfetch2|fetch|credential-review|status-checked\nhttp|shared-adapter|config-boundary|interceptor-review\nauth|domain-api|sensitive-fields|response-contract\nguest|domain-api|crud|response-contract\nactual-values-copied=false", localNetworkRefs.concat(["fetch-standard", "owasp-secrets"]))],
  }),
  appliedTopic({
    id: "request-url-method-header-body", title: "URL·method·headers·body를 canonical request contract로 조립합니다",
    lead: "문자열 이어 붙이기 대신 base origin, path segments, query parameters, method semantics와 media type을 각각 검증합니다.",
    mechanism: "URL과 URLSearchParams는 encoding/canonicalization을 담당하고 request method는 safe/idempotent 여부와 cache/retry behavior에 영향을 줍니다. JSON body를 보낼 때 serialization과 Content-Type은 별도이며 GET body처럼 호환되지 않는 조합을 피합니다.",
    workflow: "trusted configuration에서 base URL을 읽고 path ID는 encode/canonical validation, query는 allowlist/URLSearchParams, method/body/header는 endpoint contract로 생성하며 request ID와 deadline을 metadata에 둡니다.",
    invariants: "user input이 origin이나 header structure를 바꾸지 않고 credentials/secrets는 URL/query에 넣지 않으며 method/body/content-type 조합이 API schema와 일치합니다.",
    edgeCases: "Unicode, slash/percent/dot segments, repeated/empty query, large body, GET/HEAD, redirect, proxy base path와 newline/header injection을 포함합니다.",
    failureModes: "raw interpolation은 double encoding/path traversal/open redirect를 만들 수 있고 token을 query에 넣으면 logs/history/referrer/cache에 남습니다.",
    verification: "URL corpus, origin allowlist, encoded path/query roundtrip, method/body matrix, header injection negatives와 server raw request capture를 실행합니다.",
    operations: "endpoint template, method, safe reason code, request size와 config version을 관찰하되 full URL/query/header/payload는 기본 telemetry에서 제외합니다.",
    concepts: [c("canonical URL", "동일 resource를 안정된 encoding·ordering·origin policy로 표현한 URL입니다.", ["cache/query key와 연결합니다.", "서명 전에도 필요합니다."]), c("method semantics", "HTTP method가 safe/idempotent/cacheable behavior에 주는 표준 의미입니다.", ["server 구현도 지켜야 합니다.", "retry 정책과 연결합니다."]), c("media type", "request/response representation 형식을 Content-Type으로 식별하는 값입니다.", ["JSON 가정을 검증합니다.", "charset/parameters를 파싱합니다."])],
    codeExamples: [node("react35-request-builder", "canonical request descriptor", "React35RequestBuilder.mjs", "trusted base와 encoded path/query로 secret-free request descriptor를 만듭니다.", String.raw`const base = new URL("https://example.invalid/api/");
const id = "item/한글";
const url = new URL("items/" + encodeURIComponent(id), base);
url.search = new URLSearchParams({ page: "2", sort: "created" }).toString();
const request = { method: "GET", origin: url.origin, path: url.pathname, query: url.search, hasBody: false };
for (const [k, v] of Object.entries(request)) console.log(k + "=" + v);
console.log("credential-in-url=false");`, "method=GET\norigin=https://example.invalid\npath=/api/items/item%2F%ED%95%9C%EA%B8%80\nquery=?page=2&sort=created\nhasBody=false\ncredential-in-url=false", ["url-standard", "fetch-standard", "rfc9110"])],
  }),
  appliedTopic({
    id: "response-status-headers-redirect", title: "Response status·headers·redirect를 body parsing보다 먼저 분류합니다",
    lead: "fetch Promise rejection과 HTTP error를 구분하고 status class, method, redirect와 application problem을 typed result로 바꿉니다.",
    mechanism: "Fetch는 일반적인 4xx/5xx에서도 Response로 fulfill하고 network/abort 단계에서 reject합니다. response.ok는 200~299 shorthand이며 204/304, redirect, 401/403/404/409/412/429/5xx는 각기 다른 body·cache·retry·UX 의미를 가집니다.",
    workflow: "response type/url/redirected/status/headers를 안전하게 읽고 status policy로 expected body parser와 domain result를 선택하며 Retry-After/ETag/Location 같은 headers는 형식·trust boundary를 검증합니다.",
    invariants: "body를 한 번만 소비하고 status에 맞는 parser를 선택하며 unauthorized와 forbidden, not-found와 enumeration-safe response를 구분하되 raw server detail을 사용자에게 그대로 노출하지 않습니다.",
    edgeCases: "204 empty, 304 cache path, opaque response, redirect loop/cross-origin, 206 partial, malformed Retry-After와 custom proxy status를 포함합니다.",
    failureModes: "항상 response.json()을 호출하면 204/HTML error에서 parsing failure가 원래 status를 가리고 401 때 무한 refresh loop가 생길 수 있습니다.",
    verification: "all relevant status fixtures, empty/non-JSON bodies, headers/redirect/opaque, auth retry budget와 safe problem mapping을 disposable server에서 실행합니다.",
    operations: "status class·stable domain code·redirect count·retry hint와 endpoint template을 관찰하고 raw body/header values는 redaction합니다.",
    concepts: [c("network error", "Response가 만들어지기 전 transport/CORS/abort 등으로 Fetch가 reject된 상태입니다.", ["HTTP error와 다릅니다.", "브라우저 정보가 제한될 수 있습니다."]), c("HTTP problem", "Response status와 safe structured body로 표현된 요청 처리 실패입니다.", ["typed result로 정규화합니다.", "raw message를 신뢰하지 않습니다."]), c("body consumption", "Response stream을 json/text 등으로 읽어 disturbed/locked 상태로 만드는 일회성 작업입니다.", ["parser를 먼저 결정합니다.", "clone 비용을 통제합니다."])],
    codeExamples: [node("react35-response-classifier", "HTTP status/body policy classifier", "React35ResponseClassifier.mjs", "status별 parser와 action을 결정적으로 분류합니다.", String.raw`const cases = [
  [200, "json", "success"], [204, "none", "success"], [304, "none", "use-cache"],
  [401, "problem", "reauth-once"], [403, "problem", "deny"], [412, "problem", "conflict"],
  [429, "problem", "retry-hint"], [503, "problem", "retry-budget"],
];
for (const [status, parser, action] of cases) console.log(status + "=" + parser + "|" + action);`, "200=json|success\n204=none|success\n304=none|use-cache\n401=problem|reauth-once\n403=problem|deny\n412=problem|conflict\n429=problem|retry-hint\n503=problem|retry-budget", ["fetch-standard", "rfc9110", "rfc6585", "rfc9457", "local-fetch2"])],
  }),
  appliedTopic({
    id: "body-stream-content-type-schema", title: "body stream·Content-Type·encoding·schema를 단계별로 검증합니다",
    lead: "JSON parse 성공을 API data correctness로 오해하지 않고 bytes→text→syntax→schema→domain invariant를 분리합니다.",
    mechanism: "Response body는 ReadableStream이고 high-level json/text methods는 stream을 consume합니다. Content-Type은 parser 선택의 힌트이지만 server misconfiguration과 malicious content가 있으므로 허용 media type과 size, syntax, runtime schema를 함께 확인합니다.",
    workflow: "status/header로 body 기대를 정하고 size/deadline을 제한한 뒤 parser가 syntax error를 분류하며 schema validator가 required/type/range/unknown fields를 처리하고 domain mapper가 safe object를 만듭니다.",
    invariants: "untrusted JSON을 곧바로 trusted TypeScript type으로 cast하지 않고 prototype-sensitive keys와 oversized/deep payload를 방어하며 invalid response가 partial store를 commit하지 않습니다.",
    edgeCases: "empty JSON, wrong charset/media type, BOM, invalid UTF-8, top-level array/object mismatch, duplicate/unknown fields, huge integer/date와 partial stream을 포함합니다.",
    failureModes: "response.json() as User는 runtime validation이 아니고 content-type 무시와 unlimited buffering은 XSS sink, schema confusion 또는 memory exhaustion으로 이어질 수 있습니다.",
    verification: "media type corpus, syntax/schema/domain negative fixtures, size/depth limits, stream abort/truncation, prototype keys와 no-partial-commit을 실행합니다.",
    operations: "parse/schema/domain reject reason, payload size bucket, contract version과 provider build를 관찰하고 body sample은 synthetic canary만 사용합니다.",
    concepts: [c("runtime schema", "외부 JSON이 예상 field/type/range를 만족하는지 실행 중 확인하는 계약입니다.", ["TypeScript type과 다릅니다.", "versioning을 포함합니다."]), c("stream backpressure", "consumer 처리 속도에 맞춰 producer/read 속도를 제한하는 흐름 제어입니다.", ["무제한 buffering을 막습니다.", "cancel cleanup이 필요합니다."]), c("no partial commit", "response 전체 검증 전에는 application state에 일부 data를 반영하지 않는 불변식입니다.", ["stream UI는 별도 transaction이 필요합니다.", "rollback과 연결합니다."])],
    codeExamples: [node("react35-body-validator", "media type·syntax·schema validator model", "React35BodyValidator.mjs", "synthetic response bodies를 단계별 stable result로 분류합니다.", String.raw`function parse(contentType, body) {
  if (!contentType.toLowerCase().startsWith("application/json")) return "media-type";
  let data; try { data = JSON.parse(body); } catch { return "syntax"; }
  if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.id !== "string") return "schema";
  return "ok:" + data.id;
}
console.log(parse("text/html", "{}"));
console.log(parse("application/json", "{"));
console.log(parse("application/json", "{\"id\":42}"));
console.log(parse("application/json; charset=utf-8", "{\"id\":\"synthetic\"}"));`, "media-type\nsyntax\nschema\nok:synthetic", ["fetch-standard", "streams-standard", "infra-standard", "openapi-spec"])],
  }),
  appliedTopic({
    id: "failure-taxonomy-user-result", title: "abort·timeout·offline·CORS·HTTP·schema·domain failure를 typed result로 정규화합니다",
    lead: "catch 하나에서 모두 네트워크 오류로 표시하지 않고 복구 주체와 retry 가능성이 다른 failure classes를 안정된 code로 분류합니다.",
    mechanism: "browser Fetch의 TypeError는 세부 원인을 제한적으로만 드러낼 수 있으므로 request context와 online signal은 진단 보조로 쓰고 확정 원인으로 과장하지 않습니다. AbortSignal reason, HTTP status/problem, parser/schema와 domain rejection을 ordered mapping합니다.",
    workflow: "known abort/timeout부터 분류하고 Response가 있으면 status/problem, body 단계면 parse/schema, domain 단계면 rule code를 반환하며 unknown은 safe generic failure와 correlation ID를 제공합니다.",
    invariants: "user message, developer diagnostics와 telemetry fields를 분리하고 raw exception/URL/body/token을 UI나 log에 노출하지 않으며 retry hint가 operation idempotency/deadline을 반영합니다.",
    edgeCases: "browser offline signal false positive, DNS/TLS/CORS indistinguishable error, proxy HTML, captive portal, extension block, abort race와 multiple nested causes를 포함합니다.",
    failureModes: "error.message를 그대로 렌더링하면 민감 detail·불안정 wording을 노출하고 모든 TypeError를 CORS로 단정하면 실제 outage/config/abort를 오진합니다.",
    verification: "fault injection matrix, stable code/message, sensitive sink scan, retry decision, correlation propagation와 unknown fallback을 실제 browsers/server에서 실행합니다.",
    operations: "failure class·status/domain code·browser/network adapter version·correlation을 low-cardinality로 수집하고 root cause는 server/provider evidence와 합칩니다.",
    concepts: [c("failure taxonomy", "복구 주체·retry·user action이 같은 실패를 안정된 categories로 분류한 체계입니다.", ["exception class만이 아닙니다.", "unknown을 둡니다."]), c("safe user message", "내부 detail 없이 사용자가 이해하고 취할 action을 알려 주는 localized message입니다.", ["stable code와 연결합니다.", "raw error를 대체합니다."]), c("correlation ID", "client request와 server/proxy logs를 민감 payload 없이 연결하는 opaque identifier입니다.", ["권한을 주지 않습니다.", "cardinality/retention을 통제합니다."])],
  }),
  appliedTopic({
    id: "abort-deadline-resource-cleanup", title: "AbortSignal·deadline과 response resource cleanup을 전 계층에 전달합니다",
    lead: "화면 unmount만 고려하지 않고 user cancel, route change, total deadline, body reader와 downstream adapters를 하나의 cancellation tree로 연결합니다.",
    mechanism: "AbortController는 signal을 통해 fetch와 body consumption을 중단할 수 있고 caller signal과 timeout signal을 합성할 수 있습니다. deadline은 여러 retry/parse 단계가 공유하는 절대 budget이며 각 단계는 남은 시간을 넘지 않습니다.",
    workflow: "request owner가 controller/deadline을 만들고 adapter가 signal을 fetch, stream reader, parser/worker에 전달하며 finally에서 reader/listener/timer를 해제하고 abort reason을 typed failure로 보존합니다.",
    invariants: "cancelled/expired generation은 state/cache를 commit하지 않고 cleanup은 idempotent하며 active request/reader/timer/listener가 baseline으로 돌아갑니다.",
    edgeCases: "already-aborted signal, abort during headers/body/parse, timeout and user cancel same tick, retry deadline, shared request subscribers와 browser support를 포함합니다.",
    failureModes: "Promise.race timeout만 쓰면 underlying fetch가 계속되고 retry마다 full timeout을 다시 주면 total latency와 load가 budget을 초과합니다.",
    verification: "abort timing permutations, combined signal reason, total deadline, body stream cancel, active resource counters와 unhandled rejection zero를 실행합니다.",
    operations: "abort/user/route/deadline reason, active duration, cleanup failure와 leaked handles를 관찰하고 provider circuit/kill switch와 연결합니다.",
    concepts: [c("cancellation tree", "상위 operation cancel이 request·stream·parser 같은 하위 작업에 전파되는 ownership 구조입니다.", ["signal을 전달합니다.", "cleanup을 분리합니다."]), c("absolute deadline", "operation 전체가 완료되어야 하는 단일 종료 시각입니다.", ["retry가 공유합니다.", "per-attempt timeout과 다릅니다."]), c("resource baseline", "operation 전후 active readers/requests/timers/listeners의 정상 개수입니다.", ["leak test 기준입니다.", "shared resources는 policy를 둡니다."])],
    codeExamples: [node("react35-deadline-budget", "retry 단계 remaining deadline model", "React35DeadlineBudget.mjs", "절대 deadline에서 attempt별 남은 budget을 계산합니다.", String.raw`const deadline = 1000;
const starts = [100, 450, 900, 1050];
for (const now of starts) {
  const remaining = Math.max(0, deadline - now);
  const attemptTimeout = Math.min(300, remaining);
  console.log(now + "=remaining:" + remaining + "|attempt:" + attemptTimeout + "|start:" + (remaining > 0));
}`, "100=remaining:900|attempt:300|start:true\n450=remaining:550|attempt:300|start:true\n900=remaining:100|attempt:100|start:true\n1050=remaining:0|attempt:0|start:false", ["fetch-standard", "react-effect-fetch", "local-fetch1", "local-fetch2"])],
  }),
  appliedTopic({
    id: "retry-idempotency-backoff", title: "retry를 method·idempotency·status·deadline·backoff로 제한합니다",
    lead: "실패하면 세 번이라는 recipe 대신 같은 operation을 반복해도 안전한지와 server commit uncertainty를 먼저 판단합니다.",
    mechanism: "safe/idempotent methods와 explicit idempotency key가 retry 후보이고 timeout 후 mutation은 server commit 여부가 불명확할 수 있습니다. 408/425/429/selected 5xx와 network failure는 Retry-After, exponential backoff+jitter, attempt/deadline budgets와 circuit state를 고려합니다.",
    workflow: "operation class와 replay safety를 선언하고 status/problem/headers를 validation한 뒤 capped exponential delay와 jitter, total attempts/deadline을 계산하며 mutation uncertainty는 status lookup/reconciliation으로 전환합니다.",
    invariants: "non-idempotent mutation을 새 operation ID로 자동 반복하지 않고 Retry-After를 무제한 신뢰하지 않으며 user cancel/logout가 retry queue를 중단합니다.",
    edgeCases: "timeout after commit, 429 malformed/date header, 503 storm, offline reconnect, multiple tabs, clock skew, circuit half-open와 retry amplification을 포함합니다.",
    failureModes: "즉시 synchronized retries는 outage load를 증폭하고 refresh-token/CRUD mutation retry가 duplicate side effects를 만들 수 있습니다.",
    verification: "method/status/idempotency table, server commit uncertainty, jitter bounds, Retry-After cap, cancellation/deadline와 load simulation을 실행합니다.",
    operations: "attempts, backoff, idempotency/reconciliation outcome, circuit state와 provider quota를 관찰하고 global retry kill switch를 둡니다.",
    concepts: [c("replay safety", "같은 logical operation을 반복해도 duplicate side effect 없이 같은 의도를 유지하는 성질입니다.", ["method 이름만으로 충분하지 않습니다.", "idempotency key를 사용할 수 있습니다."]), c("retry amplification", "여러 계층/clients가 재시도해 outage 부하를 배수로 키우는 현상입니다.", ["한 계층이 소유합니다.", "budget/circuit를 둡니다."]), c("commit uncertainty", "client가 실패를 봤지만 server가 mutation을 commit했는지 알 수 없는 상태입니다.", ["blind retry보다 조회/reconcile합니다.", "operation ID가 필요합니다."])],
    codeExamples: [node("react35-retry-policy", "HTTP retry decision model", "React35RetryPolicy.mjs", "method/status/idempotency/deadline로 retry와 reconciliation을 구분합니다.", String.raw`const cases = [
  ["GET", 503, true, 800], ["POST", 503, false, 800], ["POST", 503, true, 800],
  ["GET", 404, true, 800], ["GET", 429, true, 0], ["DELETE", 0, true, 300],
];
for (const [method, status, replaySafe, remaining] of cases) {
  const transient = status === 0 || status === 429 || status >= 500;
  const decision = remaining <= 0 ? "deadline" : transient && replaySafe ? "retry" : transient ? "reconcile" : "fail";
  console.log(method + ":" + status + ":" + replaySafe + "=" + decision);
}`, "GET:503:true=retry\nPOST:503:false=reconcile\nPOST:503:true=retry\nGET:404:true=fail\nGET:429:true=deadline\nDELETE:0:true=retry", ["rfc9110", "rfc6585", "fetch-standard"])],
  }),
  appliedTopic({
    id: "cache-revalidation-freshness", title: "browser·HTTP·application cache의 freshness와 conditional revalidation을 구분합니다",
    lead: "cache를 한 덩어리로 부르지 않고 누가 key를 만들고 얼마나 fresh하며 auth/logout/mutation에서 언제 invalidate하는지 정의합니다.",
    mechanism: "HTTP cache는 method/status/cache directives와 validators를 사용하고 application cache는 query/auth/version key와 stale policy를 가집니다. ETag/Last-Modified conditional request는 304로 body 전송을 줄이지만 current representation과 authorization scope를 정확히 연결해야 합니다.",
    workflow: "resource/key/vary/auth scope, freshness TTL, validator, stale-while-revalidate, mutation invalidation과 offline fallback을 표로 만들고 response Cache-Control/Vary를 proxy/browser에서 실제 확인합니다.",
    invariants: "private/authenticated data가 shared cache에 노출되지 않고 account/tenant switch와 logout에서 application/persistent caches가 purge되며 304는 대응 cached body가 있을 때만 사용합니다.",
    edgeCases: "Vary mismatch, weak ETag, clock skew, service worker, back-forward cache, CDN, offline stale, schema version와 deploy rollback을 포함합니다.",
    failureModes: "fetch cache option 하나로 all layers를 제어한다고 가정하면 stale/security bug가 생기고 query key에서 auth/filter를 빼면 다른 결과가 충돌합니다.",
    verification: "raw cache headers, fresh/stale/304/200 paths, Vary/auth separation, mutation/logout purge, offline/schema mismatch와 browser/proxy integration을 실행합니다.",
    operations: "cache hit/revalidate/stale serve, age/version, auth purge와 wrong-scope canary를 관찰하고 cache bypass/flush/reconciliation runbook을 둡니다.",
    concepts: [c("freshness", "cached response를 origin 재검증 없이 사용할 수 있는 기간/조건입니다.", ["layer별로 다릅니다.", "authorization과 연결합니다."]), c("validator", "ETag나 Last-Modified처럼 cached representation이 아직 current인지 조건부 요청에 쓰는 metadata입니다.", ["body와 함께 저장합니다.", "weak/strong 의미를 구분합니다."]), c("cache scope", "cache entry를 공유할 수 있는 user/tenant/request context 범위입니다.", ["Vary/query key에 반영합니다.", "private data를 격리합니다."])],
    codeExamples: [node("react35-cache-revalidate", "cache freshness·validator decision", "React35CacheRevalidate.mjs", "age/TTL/body/ETag로 serve·revalidate·miss를 분류합니다.", String.raw`const cases = [
  { age: 20, ttl: 60, body: true, etag: true },
  { age: 80, ttl: 60, body: true, etag: true },
  { age: 80, ttl: 60, body: true, etag: false },
  { age: 0, ttl: 60, body: false, etag: false },
];
for (const c of cases) console.log(c.body ? c.age <= c.ttl ? "serve-fresh" : c.etag ? "revalidate" : "fetch-full" : "miss");`, "serve-fresh\nrevalidate\nfetch-full\nmiss", ["rfc9111", "rfc9110", "fetch-standard", "local-http"])],
  }),
  appliedTopic({
    id: "cors-credentials-secrets-boundary", title: "CORS·cookies·Authorization과 third-party secret boundary를 위협 모델로 검증합니다",
    lead: "CORS를 server authorization이나 secret 보호 장치로 오해하지 않고 browser가 cross-origin response 노출을 통제하는 protocol로 다룹니다.",
    mechanism: "Fetch CORS mode, credentials mode, Origin/preflight와 Access-Control-* response가 browser exposure를 결정합니다. cookie는 SameSite/Secure/HttpOnly/CSRF와, Authorization header는 token lifecycle/XSS와 연결되며 provider secret은 trusted backend/proxy에서만 보유합니다.",
    workflow: "frontend/server/provider origins와 trust/data flow를 그리고 allowed origins/methods/headers/credentials를 exact allowlist로 구성하며 secret-bearing provider call을 backend adapter로 이동하고 abuse quota/rotation을 둡니다.",
    invariants: "wildcard origin과 credentials를 결합하지 않고 reflected Origin을 무검증 허용하지 않으며 browser bundle/source map/storage/log/network URL에 reusable provider secret이 없습니다.",
    edgeCases: "null Origin, subdomain takeover, preflight cache, redirects, localhost/preview domains, SameSite navigation, CSRF, XSS와 service worker를 포함합니다.",
    failureModes: "CORS 허용이 인증 성공을 뜻한다고 생각하면 direct API abuse가 가능하고 `.env` client prefix에 secret을 넣으면 빌드 결과에서 누구나 추출할 수 있습니다.",
    verification: "allowed/denied/null/malicious origins, preflight, credential modes, direct API authorization, CSRF/XSS controls와 source/build/map/log secret scans를 실행합니다.",
    operations: "origin/method/preflight denial, auth/CSRF failure, provider quota와 secret canary를 관찰하고 revoke/rotate/redeploy/cache purge를 rehearsal합니다.",
    concepts: [c("CORS", "browser가 cross-origin request/response를 script에 노출할지 server headers와 함께 결정하는 Fetch protocol입니다.", ["인증·인가가 아닙니다.", "non-browser client를 막지 않습니다."]), c("credentials mode", "cross-origin request에서 cookies/TLS client cert/Authorization 관련 credential 전송과 response exposure에 영향을 주는 Fetch option입니다.", ["server policy와 맞춥니다.", "CSRF를 별도로 봅니다."]), c("backend-for-frontend", "browser 대신 trusted server가 provider secret과 upstream contract를 소유하는 adapter boundary입니다.", ["authorization/rate limits를 둡니다.", "무조건 proxy가 아닙니다."])],
  }),
  appliedTopic({
    id: "contract-tests-observability-recovery", title: "disposable HTTP contract tests·privacy-safe tracing과 provider recovery를 운영합니다",
    lead: "mock Response 한 개가 아니라 raw protocol/status/body/stream/delay/cache/CORS와 실제 browser behavior를 재현하고 failure evidence를 안전하게 남깁니다.",
    mechanism: "unit model은 request/result mapping, disposable server는 HTTP wire semantics, browser integration은 Fetch/CORS/stream/cache, provider sandbox/canary는 upstream compatibility를 증명합니다. tracing은 request ID·endpoint template·phase·stable code를 연결합니다.",
    workflow: "contract corpus에 2xx/empty/redirect/problem/malformed/slow/abort/cache/CORS를 넣고 request/response schema와 sensitive allowlist를 검증하며 release 전에 provider/config/credential rollback을 rehearsal합니다.",
    invariants: "tests는 actual production credential/PII를 사용하지 않고 arbitrary sleep에 의존하지 않으며 logs/traces/artifacts가 URL query/header/body secrets를 포함하지 않습니다.",
    edgeCases: "provider version drift, sandbox/prod difference, proxy rewrite, partial outage, DNS/TLS, browser versions, rate quota와 deploy rollback을 포함합니다.",
    failureModes: "interceptor mock만 검증하면 browser/proxy/server gap을 놓치고 full request dump는 incident를 진단하면서 credential exposure를 확대할 수 있습니다.",
    verification: "model/contract/browser/provider canary, secret artifact scan, correlation completeness, fault/resource budgets, circuit/kill switch와 credential rotation/reconciliation을 실행합니다.",
    operations: "availability/latency, status/failure class, retry/cache/abort, schema drift와 provider/config/build version을 SLI·alert·owner·runbook으로 연결합니다.",
    concepts: [c("contract corpus", "HTTP client/server 경계의 정상·경계·실패 wire fixtures 모음입니다.", ["schema/status/headers를 포함합니다.", "실제 secret을 쓰지 않습니다."]), c("endpoint template", "실제 path IDs/query를 제거한 low-cardinality route 식별자입니다.", ["telemetry cardinality를 통제합니다.", "민감정보를 줄입니다."]), c("provider reconciliation", "client failure/timeout/rotation 뒤 upstream usage·billing·commit과 local state를 비교해 복구하는 절차입니다.", ["retry와 다릅니다.", "incident evidence를 보존합니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-fetch-doc", repository: "D:/dev/REACT", path: "docs/react/09-fetch-axios.md", usedFor: ["Fetch/Axios local lesson", "request/result guide", "credential-like source audit"], evidence: "2026-07-14 read-only sanitized audit: 108 lines, 4,797 bytes, SHA-256 3A5B8BF21C44D86E331AED7A8B6E554E3B2F65FA91D576A48CFBFF22679F3507. 실제 URLs, credential-like value와 embedded output strings는 복사하지 않았습니다." },
  { id: "local-fetch1", repository: "D:/dev/my-app01", path: "src/pages/step17-Fetch/FetchTest01.jsx", usedFor: ["basic fetch flow", "status/cleanup gap", "credential-like source audit"], evidence: "2026-07-14 read-only sanitized audit: 25 lines, 960 bytes, SHA-256 D1369B0BB1ADE1B0C4EA7D785B7A2B791A9E86B59060C5D333C5E6EC4B834F16. 실제 endpoint/query/key-like value는 복사하지 않았습니다." },
  { id: "local-fetch2", repository: "D:/dev/my-app01", path: "src/pages/step17-Fetch/FetchTest02.jsx", usedFor: ["response.ok/loading/error", "credential-like source audit"], evidence: "2026-07-14 read-only sanitized audit: 43 lines, 1,474 bytes, SHA-256 48E3B23DDAF82EC97B8857F8C09945876DA0DEC22ECBD6F372C141CB403F4932. 실제 endpoint/query/key-like value는 복사하지 않았습니다." },
  { id: "local-http", repository: "D:/dev/my-app03", path: "src/api/Http.jsx", usedFor: ["shared HTTP adapter", "base/config/interceptor boundary"], evidence: "2026-07-14 read-only sanitized audit: 18 lines, 872 bytes, SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987. 실제 configuration/route values는 복사하지 않았습니다." },
  { id: "local-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["auth request/response functions", "sensitive-field/token lifecycle audit"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 token/password/user/payload/route values는 복사하지 않았습니다." },
  { id: "local-guest-api", repository: "D:/dev/my-app03", path: "src/api/GuestBook.jsx", usedFor: ["CRUD endpoint adapter", "request/response contract audit"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 365 bytes, SHA-256 42CC6DCDAFB0BA46A85307C7A762656B11FB8D3194F2DC44FBD44AF7F32D37D4. 실제 route/domain values는 복사하지 않았습니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["Request/Response/fetch/CORS/credentials/abort semantics"], evidence: "WHATWG Fetch 현행 표준입니다." },
  { id: "url-standard", repository: "WHATWG URL Standard", path: "", publicUrl: "https://url.spec.whatwg.org/", usedFor: ["URL parsing/serialization/canonicalization"], evidence: "WHATWG URL 현행 표준입니다." },
  { id: "streams-standard", repository: "WHATWG Streams Standard", path: "", publicUrl: "https://streams.spec.whatwg.org/", usedFor: ["ReadableStream consumption/backpressure/cancel"], evidence: "WHATWG Streams 현행 표준입니다." },
  { id: "infra-standard", repository: "WHATWG Infra Standard", path: "", publicUrl: "https://infra.spec.whatwg.org/", usedFor: ["standard data/string/byte processing context"], evidence: "WHATWG Infra 현행 표준입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP methods/status/headers/idempotency/conditional requests"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9111", repository: "IETF RFC 9111", path: "rfc9111.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["HTTP cache freshness/revalidation"], evidence: "HTTP Caching 표준입니다." },
  { id: "rfc6585", repository: "IETF RFC 6585", path: "rfc6585.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6585.html", usedFor: ["429/428/431/511 status context"], evidence: "Additional HTTP Status Codes 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["structured HTTP problem details"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "openapi-spec", repository: "OpenAPI Initiative", path: "oas/latest.html", publicUrl: "https://spec.openapis.org/oas/latest.html", usedFor: ["request/response schema contract context"], evidence: "OpenAPI Specification 공식 최신 문서입니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "Secrets_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["secret exposure/rotation/lifecycle"], evidence: "OWASP 공식 secret management guidance입니다." },
  { id: "react-effect-fetch", repository: "React official API", path: "reference/react/useEffect#fetching-data-with-effects", publicUrl: "https://react.dev/reference/react/useEffect#fetching-data-with-effects", usedFor: ["Effect fetch cleanup/race context"], evidence: "React 공식 Effect fetch guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-35-fetch-http-lifecycle", slug: "react-35-fetch-http-lifecycle", courseId: "react", moduleId: "react-router-network", order: 5,
  title: "Fetch와 HTTP request lifecycle", subtitle: "Request/Response·stream·schema·deadline·retry·cache·CORS와 secret incident recovery를 하나의 typed network boundary로 구현합니다.",
  level: "고급", estimatedMinutes: 140,
  coreQuestion: "브라우저 Fetch가 반환하는 transport 결과를 어떻게 검증·취소·복구해 application이 신뢰할 수 있는 typed data와 안전한 failure로 바꿀까요?",
  summary: "REACT Fetch/Axios 문서, my-app01 Fetch 예제 두 개와 my-app03 Http/Auth/Guestbook adapters를 read-only·sanitized 감사했습니다. 실제 source의 endpoint와 client credential-like literals는 값 없이 rotation/removal 위험으로 명시하고 public content에는 복사하지 않습니다. canonical request, Response/status/headers, stream/content-type/schema, failure taxonomy, cancellation/deadline, constrained retry, HTTP/app cache, CORS/credentials/backend secret boundary와 contract/observability/recovery를 WHATWG·IETF·OpenAPI·OWASP·React 근거와 일곱 executable models로 심화합니다.",
  objectives: ["원본 network sources와 credential-like risk를 redacted audit한다.", "URL/method/header/body를 canonical request로 조립한다.", "Response status/headers/redirect를 parser 전에 분류한다.", "body stream·media type·syntax·schema/domain을 검증한다.", "abort/timeout/offline/CORS/HTTP/schema/domain failures를 typed result로 만든다.", "cancellation tree와 absolute deadline으로 resources를 정리한다.", "retry/idempotency/backoff와 commit uncertainty를 통제한다.", "cache freshness/revalidation/auth scope를 설계한다.", "CORS/credentials/secrets와 contract testing/operations를 검증한다."],
  prerequisites: [{ title: "보호 route·navigation과 접근성", reason: "route change, auth guard와 navigation lifecycle을 알아야 request ownership/cancellation, return flow와 credential scope를 정확히 설계할 수 있습니다.", sessionSlug: "react-34-protected-route-navigation-a11y" }],
  keywords: ["Fetch", "Request", "Response", "HTTP", "ReadableStream", "Content-Type", "runtime schema", "AbortSignal", "deadline", "idempotency", "cache", "CORS", "secret rotation"],
  topics,
  lab: { title: "원본 Fetch/API adapters를 secret-free typed HTTP runtime으로 qualification하기", scenario: "원본 files는 변경하지 않고 synthetic endpoints와 disposable HTTP/CORS/stream server에서 request부터 schema/domain result, retry/cache와 incident recovery까지 재현합니다.", setup: ["Node 20 이상", "current browsers", "disposable HTTP/CORS/stream server", "deferred responses/fake clock", "schema validator and resource counters", "built artifact secret scanner", "원본 6 files read-only", "synthetic non-sensitive payloads"], steps: ["원본 source hashes와 redacted URL/credential/request/response matrix를 기록합니다.", "발견된 credential-like material의 revoke/rotate/backend-boundary plan을 만들고 value는 출력하지 않습니다.", "canonical URL/method/header/body builder와 origin/schema guards를 구현합니다.", "status/header/content-type/body/schema/domain ordered parser와 safe typed problems를 만듭니다.", "empty/malformed/oversized/truncated/redirect/opaque response corpus를 실행합니다.", "user/route/deadline signals와 stream/parser cleanup, active baseline을 검증합니다.", "method/idempotency/status/Retry-After/backoff/deadline retry policy와 commit reconciliation을 시험합니다.", "fresh/stale/304/Vary/auth cache와 mutation/logout purge를 브라우저·proxy에서 검증합니다.", "CORS origin/preflight/credentials, direct authorization와 source/build/map/log secret scans를 실행합니다.", "provider canary, privacy-safe trace, circuit/kill switch, rotation/cache purge/rollback/reconciliation runbook을 rehearsal합니다."], expectedResult: ["untrusted response가 status/media/schema/domain 검증 전 application state에 commit되지 않습니다.", "cancel/timeout/retry 뒤 request/stream/timer/listener가 baseline으로 돌아가고 stale result가 없습니다.", "retry/cache가 method·version·auth scope와 total deadline을 지켜 duplicate side effect/data leak를 만들지 않습니다.", "browser artifacts와 telemetry에 reusable provider secret/PII가 없고 direct API는 server authorization을 요구합니다.", "HTTP/provider failure를 stable user action과 traceable operational recovery로 연결합니다."], cleanup: ["temporary server, requests, streams/readers, timers/listeners와 caches를 제거합니다.", "synthetic bodies, IDs, problem fixtures와 secret canaries를 폐기합니다.", "proxy/CORS/network faults, browser storage, feature flags와 verbose tracing을 원복합니다.", "원본 6 files hash/status unchanged를 확인합니다."], extensions: ["SSE/WebSocket streaming parser와 resume/backpressure를 추가합니다.", "service worker/offline cache와 background sync를 auth/version aware하게 qualification합니다.", "OpenAPI-generated client와 handwritten adapter를 differential contract-test합니다.", "provider error budget/circuit와 data reconciliation dashboard를 구축합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 disposable server/browser Fetch 결과와 대응시키세요.", requirements: ["stdout 완전 일치", "redacted source boundaries", "canonical request", "status policy", "body validation", "deadline", "retry", "cache", "model 범위"], hints: ["Node descriptor/model을 actual browser CORS/cache/stream implementation evidence라고 표현하지 마세요."], expectedOutcome: "request creation부터 typed success/failure와 cleanup까지 lifecycle을 설명합니다.", solutionOutline: ["audit→request→status/body/schema→failure/cancel→retry/cache→secure/operate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Fetch/Auth/Guestbook adapters를 공통 typed client로 재설계하세요.", requirements: ["secret-free config", "request/schema contracts", "status/problem mapping", "abort/deadline", "idempotent retry", "cache/auth scope", "CORS/server auth", "contract/fault tests", "rotation/rollback"], hints: ["공통 interceptor가 모든 domain problem과 retry를 자동 해결한다고 가정하지 마세요."], expectedOutcome: "각 caller가 stable typed result를 받고 network/security failure가 복구 가능합니다.", solutionOutline: ["threat/inventory→adapter contract→validate/cancel→policy→qualification 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 browser HTTP client governance를 작성하세요.", requirements: ["URL/method/body", "response/schema", "failure taxonomy", "deadline/retry", "cache", "CORS/credentials/secrets", "observability/privacy", "incident recovery"], hints: ["library wrapper 목록이 아니라 protocol에서 credential rotation과 reconciliation까지 정의하세요."], expectedOutcome: "모든 frontend network call이 동일한 correctness·security·operations evidence로 review됩니다.", solutionOutline: ["classify→construct→validate→bound→recover→observe 순서입니다."] },
  ],
  nextSessions: ["react-36-axios-client-interceptors"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["원본 Fetch files와 학습 문서에 credential-like literal 및 actual endpoints가 있어 공개 content에는 값을 복사하지 않고 revoke/rotate/removal과 backend boundary 필요성만 기록했습니다.", "my-app03 Auth source의 실제 token/password/user/payload/route values와 공통 client configuration은 복사하지 않았습니다.", "원본의 response.ok/loading/error와 adapter structure를 관찰했지만 schema/deadline/retry/cache/CORS/server authorization이 모두 구현됐다고 과장하지 않습니다.", "Node models는 actual browser Fetch/CORS/cache/stream, proxy/server semantics와 provider incident response를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
