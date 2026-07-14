import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuditRefs = ["local-router-guide", "local-basics-router-app", "local-myapp02-app", "local-myapp03-app", "local-myapp03-guestbook"];

const topics = [
  appliedTopic({
    id: "source-route-data-audit", title: "원본의 flat declarative routes와 component data flow를 사실대로 감사합니다",
    lead: "현행 API를 원본에 소급해 있다고 가정하지 않고 route tree, persistent layout, component fetch/mutation, error sink와 async cleanup을 실제 source에서 복원합니다.",
    mechanism: "REACT guide와 basics/my-app02/my-app03 Apps는 BrowserRouter/Routes/Route 기반 flat declarations를 사용하고 persistent navigation을 Routes 밖에 둡니다. my-app03 Guestbook page는 component/store/API 경로에서 fetch와 mutations를 수행합니다. 이 snapshot에는 createBrowserRouter, nested children, loader/action/errorElement가 없습니다.",
    workflow: "각 파일의 route declaration, layout-like shell, data start/commit, pending/error, navigation과 auth dependency를 sanitized graph로 만들고 implemented fact, inferred risk, proposed data-router contract를 세 열로 분리합니다.",
    invariants: "원본 다섯 files는 read-only이며 실제 routes, endpoint, user/content/password/token/domain values를 공개 fixture에 복사하지 않고 구조와 exact provenance만 사용합니다.",
    edgeCases: "missing parent outlet, route remount, deep child refresh, fetch on unmount, duplicate mutation, error without sink, auth change와 out-of-order response를 포함합니다.",
    failureModes: "flat JSX tree를 nested data router라고 부르거나 component effect를 loader라고 부르면 실행 순서·취소·error bubbling·SSR 가능성을 잘못 가르치게 됩니다.",
    verification: "source hashes, route/layout/data graph, API inventory, negative search for loader/action/errorElement, async await/catch/cleanup와 original worktree unchanged를 확인합니다.",
    operations: "source version, route template, data phase와 safe failure reason만 기록하고 원본 payload·URLs·principal 값을 telemetry에 남기지 않습니다.",
    concepts: [c("declarative mode", "render tree 안의 Routes/Route로 match와 navigation을 제공하는 React Router mode입니다.", ["basic routing에 적합합니다.", "data APIs를 자동 제공하지 않습니다."]), c("data route", "component뿐 아니라 loader, action, error boundary와 revalidation behavior를 가진 route object입니다.", ["Data/Framework mode가 필요합니다.", "web Request/Response와 연결됩니다."]), c("source fact gap", "원본에서 실제 관찰한 기능과 production 보강 설계 사이의 명시적 차이입니다.", ["과장을 막습니다.", "migration 범위를 만듭니다."])],
    codeExamples: [node("react33-source-capabilities", "sanitized source-to-capability audit", "React33SourceCapabilities.mjs", "원본의 flat routes와 component data flow, 아직 없는 data-router capability를 구분합니다.", String.raw`const observed = {
  flatDeclarativeRoutes: true,
  persistentNavOutsideRoutes: true,
  componentFetchAndMutations: true,
  nestedChildren: false,
  routeLoaders: false,
  routeActions: false,
  routeErrorBoundaries: false,
};
for (const key of Object.keys(observed).sort()) console.log(key + "=" + observed[key]);
console.log("private-values-copied=false");`, "componentFetchAndMutations=true\nflatDeclarativeRoutes=true\nnestedChildren=false\npersistentNavOutsideRoutes=true\nrouteActions=false\nrouteErrorBoundaries=false\nrouteLoaders=false\nprivate-values-copied=false", localAuditRefs.concat(["rr-modes", "rr-routing", "rr-route-object"]))],
  }),
  appliedTopic({
    id: "nested-route-layout-outlet", title: "nested route tree·layout·Outlet·index의 렌더 계약을 설계합니다",
    lead: "URL 문자열을 중복 나열하는 대신 화면과 데이터의 계층을 route tree에 표현해 parent shell은 보존하고 child content와 child errors만 교체합니다.",
    mechanism: "children은 match chain을 만들고 parent component의 Outlet 위치에 child element를 렌더합니다. index route는 parent URL의 default child이며 pathless layout은 URL segment를 추가하지 않고 UI/error/data boundary를 만듭니다. relative links는 route hierarchy와 resolved location을 기준으로 계산됩니다.",
    workflow: "URL information architecture, persistent chrome, data ownership, error isolation과 authorization scope를 나란히 그려 layout routes를 결정하고 모든 parent component에 intended Outlet이 있는지 검사합니다.",
    invariants: "한 URL은 예측 가능한 ordered match chain을 가지며 parent가 Outlet을 빠뜨려 child match를 invisible하게 만들지 않고 index와 explicit child의 역할을 혼동하지 않습니다.",
    edgeCases: "pathless layout, index child, absolute child, splat, optional segment, multiple layouts, same component reuse, trailing slash와 parent-only navigation을 포함합니다.",
    failureModes: "path prefix를 복붙한 flat routes는 layout/data/error ownership을 분산시키고 Outlet 누락은 URL은 맞는데 child UI가 보이지 않는 silent integration bug를 만듭니다.",
    verification: "route-object unit match, match chain snapshot, relative link resolution, parent state preservation, Outlet/index negatives와 deep-link browser test를 실행합니다.",
    operations: "matched route IDs, boundary depth, unmatched route와 layout remount count를 low-cardinality로 관찰하고 dynamic params는 제외합니다.",
    concepts: [c("match chain", "현재 URL에 함께 일치한 root부터 leaf까지의 ordered routes입니다.", ["각 layout/data/error 경계를 포함합니다.", "params는 누적될 수 있습니다."]), c("Outlet", "parent route component에서 matched child가 렌더되는 자리입니다.", ["slot 위치가 layout을 결정합니다.", "없으면 child UI가 나타나지 않습니다."]), c("index route", "parent URL에서 Outlet에 렌더되는 path 없는 기본 child입니다.", ["path와 함께 쓰지 않습니다.", "parent layout을 재사용합니다."])],
    codeExamples: [node("react33-match-chain", "nested route match-chain model", "React33MatchChain.mjs", "synthetic route tree에서 parent/layout/leaf chain과 Outlet depth를 계산합니다.", String.raw`const routes = {
  id: "root", children: [{ id: "workspace", segment: "workspace", children: [
    { id: "workspace-index", index: true },
    { id: "record", segment: ":recordKey" },
  ] }],
};
function match(parts) {
  const chain = [routes.id, routes.children[0].id];
  chain.push(parts.length === 1 ? "workspace-index" : "record");
  return chain;
}
for (const parts of [["workspace"], ["workspace", "record-a"]]) {
  const chain = match(parts);
  console.log(parts.join("/") + "=" + chain.join(">") + ":outlets=" + (chain.length - 1));
}`, "workspace=root>workspace>workspace-index:outlets=2\nworkspace/record-a=root>workspace>record:outlets=2", ["rr-routing", "rr-route-object", "local-router-guide", "local-basics-router-app", "local-myapp02-app", "local-myapp03-app"])],
  }),
  appliedTopic({
    id: "loader-request-params-contract", title: "loader를 Request·params·schema·typed result 경계로 만듭니다",
    lead: "component가 mount된 뒤 fetch하는 습관에서 벗어나 navigation이 commit되기 전 route의 필수 데이터를 검증·로드하고 redirect/error를 render와 같은 tree에서 처리합니다.",
    mechanism: "data route loader는 standard Request, matched params와 context를 받아 data/Response를 반환하거나 throw합니다. nested matched loaders는 route별로 실행될 수 있으므로 parent/child dependencies와 duplicate fetch를 명시하며 request.signal을 downstream fetch에 전달합니다.",
    workflow: "params/search schema를 먼저 parse하고 session/authorization context를 확인한 뒤 request descriptor를 만들며 response status, content type와 body schema를 검증해 serializable domain result 또는 typed route error를 반환합니다.",
    invariants: "loader는 component local state를 mutation하지 않고 aborted request의 결과를 commit하지 않으며 client params가 권한을 증명하지 않고 raw server error/secret을 returned data에 넣지 않습니다.",
    edgeCases: "missing/malformed param, 204, 404, 401/403, 429/503, invalid JSON/content type, redirect, timeout, abort, duplicate parent fetch와 stale session을 포함합니다.",
    failureModes: "fetch가 resolve됐다는 이유로 4xx/5xx를 success data로 parse하거나 request.signal을 전달하지 않으면 stale navigation이 network/server work를 계속하고 late state를 만들 수 있습니다.",
    verification: "pure parser, disposable server contract, status/schema negatives, abort signal propagation, parent/child parallel trace, authorization와 serialized output scan을 실행합니다.",
    operations: "route ID, loader phase, status class, stable problem code, abort와 latency만 기록하고 URL params·response body·credentials는 redaction합니다.",
    concepts: [c("route loader", "matched route가 render 전에 필요한 data를 제공하는 data-router function입니다.", ["Request와 params를 받습니다.", "return/throw contract를 가집니다."]), c("request signal", "navigation 취소를 downstream async work에 전달하는 AbortSignal입니다.", ["fetch에 연결합니다.", "abort를 일반 오류와 구분합니다."]), c("typed route result", "validated data 또는 status와 safe problem code로 구분된 loader outcome입니다.", ["raw exception을 숨깁니다.", "boundary가 소비합니다."])],
    codeExamples: [node("react33-loader-result", "loader input and response classifier", "React33LoaderResult.mjs", "synthetic params/status/body를 validated data 또는 stable route problem으로 분류합니다.", String.raw`function loaderModel(input) {
  if (!/^[a-z][a-z0-9-]{0,15}$/.test(input.key || "")) return { kind: "problem", status: 400, code: "invalid-key" };
  if (input.aborted) return { kind: "cancelled" };
  if (input.status === 404) return { kind: "problem", status: 404, code: "not-found" };
  if (input.status !== 200 || typeof input.body?.title !== "string") return { kind: "problem", status: 502, code: "upstream-contract" };
  return { kind: "data", title: input.body.title };
}
const cases = [
  { key: "bad key", status: 200, body: { title: "x" } },
  { key: "record-a", aborted: true },
  { key: "record-a", status: 404 },
  { key: "record-a", status: 200, body: {} },
  { key: "record-a", status: 200, body: { title: "Synthetic" } },
];
for (const item of cases) { const r = loaderModel(item); console.log(r.kind + ":" + (r.code || r.title || "none")); }`, "problem:invalid-key\ncancelled:none\nproblem:not-found\nproblem:upstream-contract\ndata:Synthetic", ["rr-data-loading", "rr-route-object", "rr-routing", "fetch-standard", "rfc9110"])],
  }),
  appliedTopic({
    id: "action-mutation-revalidation", title: "action·Form·fetcher mutation을 validation·authorization·revalidation 계약으로 묶습니다",
    lead: "button handler가 API를 호출하고 navigate하는 조각을 넘어 mutation의 HTTP intent, field errors, duplicate submission, server commit와 loader refresh를 route 단위로 추적합니다.",
    mechanism: "route action은 Request의 method/formData/body를 검증해 mutation을 수행하고 data/redirect/problem을 반환합니다. navigation Form은 history/navigation state를 만들고 fetcher는 URL 이동 없이 독립 mutation을 수행하며 successful action 뒤 relevant loader data가 revalidate될 수 있습니다.",
    workflow: "allowed method와 CSRF/session, field schema, object/field authorization, idempotency/precondition, transaction result를 확인하고 expected validation은 action data로, unexpected route failure는 boundary로 보냅니다.",
    invariants: "client hidden field와 disabled button을 authorization으로 믿지 않고 duplicate/retry가 mutation을 두 번 만들지 않으며 validation error를 fatal boundary로 보내 form 입력을 잃지 않습니다.",
    edgeCases: "double click, timeout after commit, stale version, partial form, 400/422, 401/403, 409/412, redirect, file upload, fetcher overlap과 logout race를 포함합니다.",
    failureModes: "catch 하나로 모든 실패를 navigate하면 field context를 잃고 action 성공 후 어떤 loader가 갱신되는지 모르며 pending UI가 stale data를 confirmed처럼 표시할 수 있습니다.",
    verification: "method/schema/CSRF/auth negatives, idempotent retry, transaction rollback, Form/fetcher pending, action data, redirect history와 exact revalidation trace를 시험합니다.",
    operations: "action route ID, method class, terminal problem code, duration, retry/conflict와 revalidation count를 관찰하고 form values/token은 기록하지 않습니다.",
    concepts: [c("route action", "route에 연결된 data mutation handler입니다.", ["standard Request를 받습니다.", "successful result가 revalidation과 연결됩니다."]), c("fetcher mutation", "navigation 없이 loader/action과 상호작용하는 독립 mutation입니다.", ["자체 pending/data를 가집니다.", "concurrency를 분리합니다."]), c("expected validation", "사용자가 수정해 재제출할 수 있는 field/domain rejection입니다.", ["form context에 표시합니다.", "fatal error boundary와 다릅니다."])],
    codeExamples: [node("react33-action-result", "typed action outcome model", "React33ActionResult.mjs", "method·authorization·field·version을 검사해 validation/conflict/success를 구분합니다.", String.raw`function action(input) {
  if (input.method !== "POST") return { status: 405, code: "method" };
  if (!input.authorized) return { status: 403, code: "forbidden" };
  if (!input.title?.trim()) return { status: 422, code: "title-required" };
  if (input.version !== input.currentVersion) return { status: 412, code: "stale-version" };
  return { status: 200, code: "updated", revalidate: true };
}
const cases = [
  { method: "GET" },
  { method: "POST", authorized: false },
  { method: "POST", authorized: true, title: "", version: 2, currentVersion: 2 },
  { method: "POST", authorized: true, title: "x", version: 1, currentVersion: 2 },
  { method: "POST", authorized: true, title: "x", version: 2, currentVersion: 2 },
];
for (const value of cases) { const r = action(value); console.log(r.status + ":" + r.code + ":revalidate=" + Boolean(r.revalidate)); }`, "405:method:revalidate=false\n403:forbidden:revalidate=false\n422:title-required:revalidate=false\n412:stale-version:revalidate=false\n200:updated:revalidate=true", ["rr-actions", "rr-route-object", "rfc9110", "local-myapp03-guestbook"])],
  }),
  appliedTopic({
    id: "route-error-boundary-bubbling", title: "errorElement·ErrorBoundary와 bubbling을 recovery boundary로 설계합니다",
    lead: "모든 오류를 root blank page나 toast 하나로 몰지 않고 실패한 child의 가장 가까운 route boundary가 safe context와 복구 action을 제공하면서 상위 layout을 보존하게 합니다.",
    mechanism: "loader/action/render에서 throw된 값은 가장 가까운 route error boundary로 bubble합니다. status-bearing route data, Error instance와 unknown value를 구분하고 Framework mode의 server error sanitization과 Data mode client exposure 차이를 이해합니다. field validation은 일반적으로 action data이며 fatal boundary가 아닙니다.",
    workflow: "route tree에 root safety net과 domain-specific child boundaries를 배치하고 status/code별 title, message, retry/back/home, focus와 logging policy를 정의하며 unknown은 safe generic response로 축소합니다.",
    invariants: "boundary UI가 stack, raw response, SQL/path, credentials나 personal data를 노출하지 않고 오류 발생 route 아래만 대체하며 recovery action이 같은 실패 loop를 무한 반복하지 않습니다.",
    edgeCases: "thrown Response/data, Error, string/object, 404, 401/403, offline, render crash, boundary 자체 crash, parent loader failure와 child action validation을 포함합니다.",
    failureModes: "catch 후 정상 data처럼 반환하면 component가 malformed result에서 다시 crash하고 root boundary 하나는 navigation·form context와 unaffected sibling layout까지 제거합니다.",
    verification: "각 origin/boundary pair table, status/unknown branches, sanitized production output, retry/focus/keyboard, boundary-crash fallback와 error correlation을 시험합니다.",
    operations: "route ID, boundary ID, safe error class/status, correlation과 recovery result를 기록하고 raw thrown data/stack은 access-controlled server sink로 제한합니다.",
    concepts: [c("route error boundary", "matched route의 loader/action/render 오류를 대신 렌더하는 recovery UI 경계입니다.", ["가까운 boundary가 처리합니다.", "layout isolation을 제공합니다."]), c("error bubbling", "오류가 자체 boundary가 없을 때 ancestor route boundary로 이동하는 규칙입니다.", ["root fallback이 필요합니다.", "tree로 예측합니다."]), c("route error response", "HTTP-like status와 safe data를 가진 의도된 route failure입니다.", ["unknown Error와 분리합니다.", "404 같은 expected absence에 씁니다."])],
    codeExamples: [node("react33-error-boundary", "nearest route error-boundary selector", "React33ErrorBoundary.mjs", "route chain에서 failure origin에 가장 가까운 boundary를 선택하고 safe class를 만듭니다.", String.raw`const chain = [
  { id: "root", boundary: true },
  { id: "workspace", boundary: false },
  { id: "record", boundary: true },
  { id: "activity", boundary: false },
];
function nearest(origin) {
  const index = chain.findIndex((route) => route.id === origin);
  return chain.slice(0, index + 1).reverse().find((route) => route.boundary)?.id || "document";
}
for (const item of [["activity", 404], ["record", 500], ["workspace", 503], ["root", 500]]) {
  console.log(item[0] + ":" + item[1] + "=" + nearest(item[0]));
}`, "activity:404=record\nrecord:500=record\nworkspace:503=root\nroot:500=root", ["rr-error-boundary", "rr-use-route-error", "rr-is-route-error-response", "rr-routing", "wcag-status"])],
  }),
  appliedTopic({
    id: "abort-race-stale-commit", title: "AbortSignal·request generation·late response로 navigation race를 통제합니다",
    lead: "router가 stale navigation을 취소해도 transport와 server가 실제 일을 즉시 중단한다는 보장은 없으므로 signal propagation, commit guard와 mutation reconciliation을 함께 설계합니다.",
    mechanism: "새 navigation은 이전 loader request를 abort할 수 있고 fetch는 request.signal을 받으면 client work를 중단합니다. 그러나 abort는 이미 server에 도착한 mutation을 되돌리지 않으며 custom promise/library가 signal을 무시할 수 있으므로 generation/version guard와 idempotency가 필요합니다.",
    workflow: "navigation/request ID를 만들고 signal을 모든 cancellable layer에 전달하며 AbortError를 expected cancellation로 분류하고 result commit 직전에 current generation/session/resource version을 다시 확인합니다.",
    invariants: "aborted/older result가 current route data를 덮지 않고 cancellation을 user-visible fatal error로 표시하지 않으며 mutation은 abort 이후 server commit 가능성을 reconciliation합니다.",
    edgeCases: "rapid params/search, cached instant result, slow old response, abort before/after headers, non-fetch client, server commit after disconnect, account switch와 retry를 포함합니다.",
    failureModes: "debounce만으로 race를 막았다고 생각하거나 catch에서 abort를 오류 toast로 표시하면 stale UI와 noise가 남고 cleanup flag만으로 network/server work는 멈추지 않습니다.",
    verification: "deferred promises로 completion order permutation, actual AbortController/fetch, signal listener cleanup, late commit guard, mutation idempotency와 server readback을 실행합니다.",
    operations: "route template별 started/aborted/committed/stale-discarded, latency와 server-after-abort reconciliation을 측정하되 destination/value는 기록하지 않습니다.",
    concepts: [c("cooperative cancellation", "caller가 signal을 보내고 각 async layer가 이를 관찰해 작업을 중단하는 방식입니다.", ["자동 rollback이 아닙니다.", "signal 전파가 필요합니다."]), c("generation guard", "결과가 시작된 request generation과 현재 generation이 같은지 commit 직전 확인하는 규칙입니다.", ["signal 미지원 layer를 방어합니다.", "resource/session scope도 봅니다."]), c("abort reconciliation", "client 취소 뒤 server mutation이 commit됐을 가능성을 조회·합의하는 절차입니다.", ["idempotency가 도움 됩니다.", "단순 rollback과 다릅니다."])],
    codeExamples: [node("react33-race-guard", "generation-based stale result guard", "React33RaceGuard.mjs", "나중에 시작한 navigation만 commit하고 older completion을 discard합니다.", String.raw`let generation = 0;
let current = "none";
function start(label) {
  const mine = ++generation;
  return () => {
    if (mine !== generation) return label + ":discard";
    current = label;
    return label + ":commit";
  };
}
const finishOld = start("old");
const finishNew = start("new");
console.log(finishNew());
console.log(finishOld());
console.log("current=" + current);
console.log("generation=" + generation);`, "new:commit\nold:discard\ncurrent=new\ngeneration=2", ["rr-race-conditions", "rr-data-loading", "fetch-standard", "local-myapp03-guestbook"])],
  }),
  appliedTopic({
    id: "pending-streaming-boundaries", title: "pending·streaming·Suspense boundary를 route data UX와 연결합니다",
    lead: "모든 loader가 끝날 때까지 blank page를 보여 주거나 모든 promise를 즉시 stream하는 극단을 피하고 critical data, optional slow data와 mutation feedback을 구분합니다.",
    mechanism: "useNavigation은 global navigation pending을, NavLink/fetcher는 local pending을 제공합니다. Framework rendering/data loading은 loader promise serialization과 streaming 경계를 지원할 수 있지만 deployment runtime, CSP, error handling과 hydration contract를 확인해야 합니다.",
    workflow: "route별 critical data와 defer 가능한 data, skeleton dimensions, previous-data preservation, cancel/retry, status announcement와 timeout budget을 정하고 boundary를 layout/leaf에 배치합니다.",
    invariants: "pending indicator가 keyboard focus를 훔치거나 existing content를 inaccessible하게 지우지 않고 stale data를 current confirmed result로 오인시키지 않으며 promise rejection은 nearest recovery path를 가집니다.",
    edgeCases: "instant completion, very slow response, multiple nested loaders, fetcher plus navigation, streamed rejection, client disconnect, reduced motion, repeated live announcement와 offline을 포함합니다.",
    failureModes: "global spinner 하나는 어떤 action이 진행 중인지 숨기고 skeleton이 layout shift/focus reset을 만들며 unsupported host에서 streaming을 가정하면 response가 buffer되거나 hydration이 깨집니다.",
    verification: "timing matrix, global/local pending visibility, aria-busy/status, focus preservation, streamed success/rejection, no-JS/slow network와 deployment runtime trace를 실행합니다.",
    operations: "pending duration, boundary reveal, abandon, streamed rejection와 layout shift를 route ID 기준으로 관찰하고 user payload는 제외합니다.",
    concepts: [c("navigation pending", "다음 route data가 준비되는 동안 진행 중인 navigation state입니다.", ["현재/next location을 구분합니다.", "global/local feedback을 설계합니다."]), c("streaming boundary", "일부 data/UI를 먼저 보내고 느린 promise 결과를 나중에 reveal하는 경계입니다.", ["runtime 지원이 필요합니다.", "error/hydration을 검증합니다."]), c("stale presentation", "새 navigation 중 이전 data를 의도적으로 유지하는 UI 상태입니다.", ["명확히 표시합니다.", "confirmed current와 구분합니다."])],
  }),
  appliedTopic({
    id: "revalidation-cache-consistency", title: "revalidation·shouldRevalidate·cache를 consistency policy로 설계합니다",
    lead: "action 뒤 loader가 다시 불렸다는 사실을 최신성의 충분조건으로 보지 않고 어떤 route data가 언제 invalid해지고 concurrent response가 어떤 version으로 commit되는지 정의합니다.",
    mechanism: "data router는 navigation, search/params change와 successful actions 뒤 loader revalidation을 조정합니다. shouldRevalidate는 기본 behavior 전체를 대체하는 고급 escape hatch이므로 false가 stale authorization/data를 고착하지 않게 input/output dependencies와 server cache semantics를 함께 봅니다.",
    workflow: "loader별 dependency key, freshness, mutation impact, ETag/version, current navigation generation과 auth scope를 작성하고 default revalidation을 baseline으로 측정한 후 증거가 있는 좁은 skip만 추가합니다.",
    invariants: "다른 principal의 cache를 공유하지 않고 older version이 newer commit을 덮지 않으며 skipped revalidation에도 explicit invalidation/expiry/rollback path가 있습니다.",
    edgeCases: "same URL refresh, search-only change, parent/child shared data, fetcher mutation, redirect, 4xx action, concurrent mutations, server push, offline와 deploy schema skew를 포함합니다.",
    failureModes: "성능을 위해 항상 false를 반환하면 stale permissions/data가 남고 action마다 모든 loader를 무조건 refetch하면 thundering requests와 focus/pending churn이 생깁니다.",
    verification: "dependency matrix, default/override parity, mutation impact, ETag/304, version order, auth switch, concurrent fetcher와 production trace를 검증합니다.",
    operations: "loader calls, cache hit/revalidate/skip reason, bytes, age, version conflict와 stale correction을 route ID·auth scope hash 기준으로 관찰합니다.",
    concepts: [c("revalidation", "기존 loader data가 아직 유효한지 다시 확인하고 갱신하는 과정입니다.", ["actions/navigation과 연결됩니다.", "cache freshness와 다릅니다."]), c("shouldRevalidate", "특정 navigation/submission에서 loader 재실행 여부를 조정하는 route hook입니다.", ["default를 대체합니다.", "증거 있는 최적화만 합니다."]), c("auth-scoped cache", "principal/tenant/permission context를 key에 포함해 교차 사용자 data 재사용을 막는 cache입니다.", ["logout에서 purge합니다.", "server authorization을 대체하지 않습니다."])],
    codeExamples: [node("react33-revalidation", "route-data revalidation decision matrix", "React33Revalidation.mjs", "params/search/action/auth/version 변화에 따라 stable revalidation reason을 결정합니다.", String.raw`function decide(change) {
  if (change.authScope) return "revalidate:auth-scope";
  if (change.actionSuccess) return "revalidate:mutation";
  if (change.params || change.search) return "revalidate:url-input";
  if (change.serverVersion !== change.cachedVersion) return "revalidate:version";
  return "reuse:fresh";
}
const cases = [
  { authScope: true },
  { actionSuccess: true },
  { search: true },
  { serverVersion: 3, cachedVersion: 2 },
  { serverVersion: 2, cachedVersion: 2 },
];
for (const item of cases) console.log(decide(item));`, "revalidate:auth-scope\nrevalidate:mutation\nrevalidate:url-input\nrevalidate:version\nreuse:fresh", ["rr-route-object", "rr-actions", "rr-race-conditions", "rfc9110"])],
  }),
  appliedTopic({
    id: "ssr-hydration-data-boundary", title: "SSR·prerender·CSR 경계와 loader data serialization을 고정합니다",
    lead: "같은 route module이 server와 browser에서 언제 실행되는지, 어떤 credential/context가 어느 쪽에만 존재하는지 모르면 double fetch, hydration mismatch와 cross-request data leak가 생깁니다.",
    mechanism: "React Router Framework mode는 CSR, SSR와 static pre-rendering 전략을 제공하고 server loader data를 serializable payload로 client에 전달할 수 있습니다. server-only secrets, per-request session/context와 browser-only APIs를 module boundary로 분리하고 request마다 격리된 stores/caches를 만듭니다.",
    workflow: "route별 render strategy와 loader execution matrix를 작성하고 returned fields allowlist, serialization type/size, CSP/nonce, cache-control, hydration input과 client revalidation trigger를 명세합니다.",
    invariants: "server credential·internal error·private headers가 serialized data/bundle에 들어가지 않고 request A의 loader/cache가 request B로 공유되지 않으며 initial HTML와 hydration 첫 render가 같은 public snapshot을 사용합니다.",
    edgeCases: "dynamic route prerender exclusion, clientLoader, no-JS, bot, timezone/locale, random/time data, streaming failure, deploy version skew, cache poisoning과 aborted request를 포함합니다.",
    failureModes: "module-level mutable cache/store는 사용자 간 data leak을 만들고 browser global을 server render에서 읽으면 crash하며 server/client가 별도 now/random을 렌더하면 hydration mismatch가 납니다.",
    verification: "two-request isolation, serialized payload snapshot/sensitive scan, HTML-client parity, no-JS, SSR/CSR/pre-render matrix, CSP, cache headers와 old/new artifact compatibility를 실행합니다.",
    operations: "render strategy, loader location, serialization bytes, hydration mismatch, cache scope와 server/client error correlation을 route ID로 관찰합니다.",
    concepts: [c("render strategy", "route output을 client, request-time server 또는 build-time pre-render 중 어디서 만드는지 정한 방식입니다.", ["deployment와 맞아야 합니다.", "route별 data 특성을 봅니다."]), c("hydration payload", "server-rendered UI를 client가 같은 state에서 이어받기 위한 serialized public data입니다.", ["allowlist가 필요합니다.", "secret을 포함하지 않습니다."]), c("request isolation", "SSR request마다 context, auth, cache와 mutable state를 분리하는 성질입니다.", ["module singleton leak를 막습니다.", "동시 요청으로 시험합니다."])],
    codeExamples: [node("react33-ssr-allowlist", "SSR loader-data serialization allowlist", "React33SsrAllowlist.mjs", "public fields만 hydration payload로 복사하고 sensitive/internal fields를 제외합니다.", String.raw`const loaderData = {
  title: "Synthetic record",
  summary: "Public summary",
  internalTrace: "trace-redacted",
  sessionSecret: "secret-redacted",
  ownerEmail: "private-redacted",
};
const allowed = ["title", "summary"];
const payload = Object.fromEntries(allowed.map((key) => [key, loaderData[key]]));
console.log(JSON.stringify(payload));
console.log("keys=" + Object.keys(payload).sort().join(","));
console.log("sensitive-present=" + ["internalTrace", "sessionSecret", "ownerEmail"].some((key) => key in payload));`, "{\"title\":\"Synthetic record\",\"summary\":\"Public summary\"}\nkeys=summary,title\nsensitive-present=false", ["rr-rendering", "rr-data-loading", "rr-modes", "fetch-standard"])],
  }),
  appliedTopic({
    id: "route-data-qualification-operations", title: "route tree·data·error·SSR를 fault matrix와 release gate로 완성합니다",
    lead: "route component가 화면에 나온다는 한 가지 확인을 넘어 matching, loader/action protocol, cancellation, boundary recovery, accessibility, security와 deployment rendering을 독립 evidence로 만듭니다.",
    mechanism: "pure tests는 tree/result machines, router integration은 loaders/actions/bubbling, disposable HTTP은 Request/Response/abort, browser E2E는 navigation/pending/focus, SSR harness는 isolation/serialization을 증명합니다.",
    workflow: "route manifest와 fault matrix에서 success, invalid, denied, missing, slow, abort, stale, boundary crash, offline, SSR skew를 생성하고 expected match/data/UI/status/log/cleanup을 assert합니다.",
    invariants: "실제 credentials·users·routes·domains·payloads를 fixture에 복사하지 않고 test doubles와 Node models가 actual browser/server/runtime behavior를 대체한다고 주장하지 않습니다.",
    edgeCases: "unknown route, missing Outlet, parent/child failure, double action, abort-after-commit, stream reject, no-JS, two SSR users, rollback와 cached old document를 포함합니다.",
    failureModes: "mock success와 snapshots만 있으면 status/schema/abort/error bubbling/focus/request isolation을 놓치고 rollback 때 cache/server/UI divergence가 남습니다.",
    verification: "exact examples, sourceRef closure, component/router/HTTP/E2E/a11y/security/SSR suites, URL checks, local hash recheck, canary readback와 rollback rehearsal를 실행합니다.",
    operations: "route data SLI, error budget, owners, safe reason dashboards, alerts와 abort/mutation/cache/SSR reconciliation runbooks를 운영합니다.",
    concepts: [c("route fault matrix", "route/data phase와 failure injection을 교차해 expected boundary·recovery를 적은 표입니다.", ["cleanup까지 포함합니다.", "happy path를 넘어섭니다."]), c("boundary qualification", "각 route/error/render boundary가 의도한 failure만 격리하고 복구하는지 실제 runtime에서 증명하는 절차입니다.", ["bubbling을 포함합니다.", "접근성도 봅니다."]), c("release evidence chain", "source provenance부터 production-like readback·rollback까지 연결된 배포 증거입니다.", ["artifact version을 고정합니다.", "owner가 판정합니다."])],
    codeExamples: [node("react33-release-gate", "nested data-router release gate", "React33ReleaseGate.mjs", "tree, loader, action, error, abort, accessibility와 SSR evidence가 모두 있어야 배포합니다.", String.raw`const evidence = {
  tree: true, loader: true, action: true, errorBoundary: true,
  abortRace: true, accessibility: true, authorization: true,
  ssrIsolation: true, rollback: true, privateValuesCopied: false,
};
const required = ["tree", "loader", "action", "errorBoundary", "abortRace", "accessibility", "authorization", "ssrIsolation", "rollback"];
const missing = required.filter((key) => evidence[key] !== true);
console.log("missing=" + (missing.join(",") || "none"));
console.log("private-values-copied=" + evidence.privateValuesCopied);
console.log("release=" + (missing.length === 0 && !evidence.privateValuesCopied ? "pass" : "block"));`, "missing=none\nprivate-values-copied=false\nrelease=pass", ["local-router-guide", "local-basics-router-app", "local-myapp02-app", "local-myapp03-app", "local-myapp03-guestbook", "rr-modes", "rr-routing", "rr-route-object", "rr-data-loading", "rr-actions", "rr-error-boundary", "rr-pending-ui", "rr-race-conditions", "rr-rendering", "rr-use-route-error", "rr-is-route-error-response", "fetch-standard", "rfc9110", "wcag-status"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-router-guide", repository: "D:/dev/REACT", path: "docs/react/08-router.md", usedFor: ["v6 declarative router lesson", "flat route and params provenance"], evidence: "2026-07-14 read-only sanitized audit: 107 lines, 5,551 bytes, SHA-256 5D1D686C17CD50FF6FF7ADFD5AD41DA9715DB9C8674059523378422DED643541. actual routes, local URL과 UI strings는 복사하지 않았습니다." },
  { id: "local-basics-router-app", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/App.js", usedFor: ["flat declarative route tree", "persistent navigation and router selection"], evidence: "2026-07-14 read-only sanitized audit: 64 lines, 2,593 bytes, SHA-256 A74CF035261424CEB448C27FBC7CD5DF747D72D615BCE24BB3BC26B52E3998E1. actual route/data/domain values는 복사하지 않았습니다." },
  { id: "local-myapp02-app", repository: "D:/dev/my-app02", path: "src/App.js", usedFor: ["flat Routes structure", "Navbar outside route slot"], evidence: "2026-07-14 read-only sanitized audit: 30 lines, 880 bytes, SHA-256 5FF7DE7AFDC11D4413421A26FE137A064A382FC0ECDA21C5C6AB48B934665150. actual routes/pages는 복사하지 않았습니다." },
  { id: "local-myapp03-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["flat route declarations", "component wrapper guard and auth hydration provenance"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. actual routes, storage keys와 user values는 복사하지 않았습니다." },
  { id: "local-myapp03-guestbook", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["component-driven fetch/mutations", "local pending/error and refetch provenance"], evidence: "2026-07-14 read-only sanitized audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. actual users, content, password, routes와 endpoint values는 복사하지 않았습니다." },
  { id: "rr-modes", repository: "React Router official documentation", path: "start/modes", publicUrl: "https://reactrouter.com/start/modes", usedFor: ["Declarative/Data/Framework capability boundaries"], evidence: "React Router 공식 현행 mode 선택 문서입니다." },
  { id: "rr-routing", repository: "React Router official documentation", path: "start/data/routing", publicUrl: "https://reactrouter.com/start/data/routing", usedFor: ["nested routes, index and dynamic segments"], evidence: "React Router 공식 현행 data routing 문서입니다." },
  { id: "rr-route-object", repository: "React Router official documentation", path: "start/data/route-object", publicUrl: "https://reactrouter.com/start/data/route-object", usedFor: ["loader/action/error/revalidation route object contracts"], evidence: "React Router 공식 현행 Route Object 문서입니다." },
  { id: "rr-data-loading", repository: "React Router official documentation", path: "start/data/data-loading", publicUrl: "https://reactrouter.com/start/data/data-loading", usedFor: ["route loader and useLoaderData contracts"], evidence: "React Router 공식 현행 Data Loading 문서입니다." },
  { id: "rr-actions", repository: "React Router official documentation", path: "start/data/actions", publicUrl: "https://reactrouter.com/start/data/actions", usedFor: ["Form/fetcher mutation and revalidation"], evidence: "React Router 공식 현행 Actions 문서입니다." },
  { id: "rr-error-boundary", repository: "React Router official documentation", path: "how-to/error-boundary", publicUrl: "https://reactrouter.com/how-to/error-boundary", usedFor: ["route error boundaries, bubbling and sanitization"], evidence: "React Router 공식 현행 Error Boundaries 문서입니다." },
  { id: "rr-pending-ui", repository: "React Router official documentation", path: "start/framework/pending-ui", publicUrl: "https://reactrouter.com/start/framework/pending-ui", usedFor: ["global/local pending and optimistic UI"], evidence: "React Router 공식 현행 Pending UI 문서입니다." },
  { id: "rr-race-conditions", repository: "React Router official documentation", path: "explanation/race-conditions", publicUrl: "https://reactrouter.com/explanation/race-conditions", usedFor: ["cancellation and stale revalidation behavior"], evidence: "React Router 공식 현행 Race Conditions 설명입니다." },
  { id: "rr-rendering", repository: "React Router official documentation", path: "start/framework/rendering", publicUrl: "https://reactrouter.com/start/framework/rendering", usedFor: ["CSR, SSR and static pre-rendering strategies"], evidence: "React Router 공식 현행 Rendering Strategies 문서입니다." },
  { id: "rr-use-route-error", repository: "React Router official documentation", path: "api/hooks/useRouteError", publicUrl: "https://reactrouter.com/api/hooks/useRouteError", usedFor: ["Data mode route error access"], evidence: "React Router 공식 현행 useRouteError API입니다." },
  { id: "rr-is-route-error-response", repository: "React Router official documentation", path: "api/utils/isRouteErrorResponse", publicUrl: "https://reactrouter.com/api/utils/isRouteErrorResponse", usedFor: ["status-bearing route error discrimination"], evidence: "React Router 공식 현행 isRouteErrorResponse API입니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "Fetch Standard", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["Request/Response, status and abort semantics"], evidence: "WHATWG Living Standard의 Fetch 규범입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP methods, status, validators and semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "wcag-status", repository: "W3C WAI WCAG", path: "Understanding/status-messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["accessible pending and error status messages"], evidence: "W3C WAI 공식 status message guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-33-fetch-lifecycle", slug: "react-33-nested-route-data-errors", courseId: "react", moduleId: "react-router-network", order: 3,
  title: "nested route·data loading과 error boundary", subtitle: "route tree에 layout, loader, action, cancellation, error recovery와 SSR isolation을 함께 배치하고 실제 실패 순서로 검증합니다.",
  level: "고급", estimatedMinutes: 130,
  coreQuestion: "nested route의 화면 계층과 data lifecycle을 어떻게 연결해야 느린 요청·mutation·오류·취소·SSR에서도 올바른 layout과 최신 data를 안전하게 유지할까요?",
  summary: "REACT Router guide, basics/my-app02/my-app03 App과 Guestbook page 다섯 files를 read-only·sanitized 감사해 flat declarative routes와 component-driven fetch/mutation이라는 실제 baseline을 보존합니다. 원본에 없는 loader/action/errorElement를 구현된 것처럼 말하지 않고 현행 React Router, WHATWG, IETF와 W3C 근거로 nested layout/Outlet, loader/action contracts, error bubbling, abort/race, pending/streaming, revalidation, SSR isolation과 fault operations를 아홉 deterministic Node models에 연결합니다.",
  objectives: ["원본 flat route와 component data flow를 과장 없이 감사한다.", "nested tree·layout·Outlet·index match 계약을 설계한다.", "loader를 Request/params/schema/abort 경계로 구현한다.", "action·Form·fetcher·revalidation lifecycle을 분리한다.", "가장 가까운 route error boundary와 safe recovery를 설계한다.", "AbortSignal과 generation guard로 stale commit을 막는다.", "pending·streaming과 accessible feedback을 연결한다.", "revalidation/cache/version/auth scope consistency를 검증한다.", "SSR/prerender/CSR와 hydration serialization을 격리한다.", "fault matrix, canary와 rollback evidence로 배포한다."],
  prerequisites: [{ title: "route params·search와 URL state", reason: "params/search schema, canonical URL, history와 deep-link hosting을 알아야 data route의 Request input과 navigation lifecycle을 안전하게 설계할 수 있습니다.", sessionSlug: "react-32-route-params-search-state" }],
  keywords: ["nested routes", "Outlet", "loader", "action", "error boundary", "AbortSignal", "race condition", "revalidation", "pending UI", "SSR", "hydration", "request isolation"],
  topics,
  lab: { title: "nested data router fault laboratory와 SSR isolation qualification", scenario: "원본 files는 변경하지 않고 synthetic route/data만 쓰는 current data-mode router, disposable HTTP server와 two-request SSR harness에서 match부터 rollback까지 시험합니다.", setup: ["Node.js 20 이상", "React Router current Data/Framework fixtures", "disposable HTTP server", "deferred promises and AbortController", "browser keyboard/accessibility tools", "two-request SSR harness", "원본 다섯 files read-only"], steps: ["source route/data graph와 exact hashes, implemented/missing capability를 기록합니다.", "nested tree와 Outlet/index/pathless layouts를 manifest로 정의합니다.", "params/search/session/schema와 signal을 사용하는 loaders를 구현합니다.", "validated/authorized/idempotent actions와 Form/fetcher pending을 구현합니다.", "root/child boundaries와 thrown data/Error/unknown bubbling을 fault-test합니다.", "rapid navigation, abort, late response와 mutation-after-abort를 reconciliation합니다.", "pending/streaming/rejection의 focus/status/layout behavior를 확인합니다.", "revalidation dependency/version/auth-scope matrix를 실행합니다.", "SSR/CSR/prerender, serialization allowlist와 concurrent request isolation을 검증합니다.", "SLI, canary readback, rollback와 cache/data reconciliation runbook을 rehearsal합니다."], expectedResult: ["nested match chain과 layout preservation이 deep link에서도 일치합니다.", "loader/action은 invalid·denied·missing·conflict를 typed outcome으로 반환합니다.", "aborted/older work가 current UI를 덮지 않고 server commit 가능성이 reconciliation됩니다.", "nearest boundary가 safe accessible recovery를 제공하며 unaffected layouts를 보존합니다.", "SSR payload에 secrets가 없고 concurrent requests와 old/new artifacts가 격리됩니다."], cleanup: ["temporary server, requests, abort listeners, router, timers와 browser state를 제거합니다.", "synthetic records, form data, SSR payloads와 logs를 폐기합니다.", "faults, streaming/SSR flags, caches와 verbose tracing을 원복합니다.", "원본 다섯 files의 hash/status unchanged를 확인합니다."], extensions: ["typed route-module generation과 middleware context를 qualification합니다.", "parallel nested loader deduplication과 request-scoped cache를 구현합니다.", "streamed SSR CSP/nonce와 partial hydration failure를 분석합니다.", "production route-error reconciliation dashboard를 만듭니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "아홉 Node examples를 실행하고 actual router/HTTP/browser/SSR evidence와 대응시키세요.", requirements: ["stdout 완전 일치", "source gap", "match chain", "loader result", "action result", "boundary bubbling", "race guard", "revalidation", "SSR allowlist", "release gate", "model 한계"], hints: ["pure Node model이 React Router scheduler, network abort, server commit 또는 hydration을 증명한다고 표현하지 마세요."], expectedOutcome: "URL match에서 loader/action/error/SSR cleanup까지 각 실행 순서와 owner를 설명합니다.", solutionOutline: ["audit→tree→load/mutate→recover/cancel→revalidate→render/isolate→operate 순서입니다."] },
    { difficulty: "응용", prompt: "flat component-fetch feature를 nested data router로 migration하세요.", requirements: ["route manifest", "Outlet/index", "loader/action schemas", "fetcher/Form", "nearest boundaries", "abort/version guard", "a11y pending/error", "SSR decision", "old route rollback"], hints: ["원본이 이미 data router였다고 가정하거나 validation error를 fatal boundary로 보내지 마세요."], expectedOutcome: "deep link·rapid navigation·mutation failure에도 layout과 data가 일관되고 복구됩니다.", solutionOutline: ["baseline graph→route tree→contracts→fault tests→canary adapter→migration 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 route-module/data lifecycle 표준을 작성하세요.", requirements: ["mode/ownership", "loader/action protocol", "error taxonomy", "abort/race", "pending/streaming", "revalidation/cache", "SSR/privacy", "a11y/security", "observability/runbook/rollback"], hints: ["API 목록보다 request start부터 cancellation·server-after-abort reconciliation까지 정의하세요."], expectedOutcome: "모든 route module이 같은 correctness/security/accessibility/operations evidence로 review됩니다.", solutionOutline: ["classify→contract→isolate→fault→observe→reconcile 순서입니다."] },
  ],
  nextSessions: ["react-34-protected-route-navigation-a11y"], sources,
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["REACT Router guide, basics/my-app02/my-app03 Apps와 Guestbook page를 read-only로 읽고 exact lines·bytes·SHA-256를 기록했습니다.", "원본은 flat declarative Routes와 component/store/API data flow이며 nested children, loader, action, errorElement가 이미 있다고 주장하지 않습니다.", "actual routes, endpoints, UI strings, user/content/password/token/domain values는 공개 content에 복사하지 않았습니다.", "Node models는 actual React Router matching/revalidation, Fetch abort, browser focus, server transaction과 SSR/hydration을 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
