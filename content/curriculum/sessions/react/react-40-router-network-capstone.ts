import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localCapstoneRefs = [
  "r40-local-router-doc", "r40-local-fetch-doc", "r40-local-zustand-doc", "r40-local-crud-doc",
  "r40-local-flow-doc", "r40-local-jwt-doc",
  "r40-app02-package", "r40-app02-lock", "r40-app02-app", "r40-app02-auth-store", "r40-app02-todo", "r40-app02-memo",
  "r40-app03-package", "r40-app03-lock", "r40-app03-app", "r40-app03-http", "r40-app03-auth",
  "r40-app03-guest-api", "r40-app03-guest-page", "r40-app03-auth-store", "r40-app03-guest-store",
];

const topics = [
  appliedTopic({
    id: "source-wide-router-network-audit", title: "두 앱과 여섯 문서를 sanitized route·network·state topology로 복원합니다",
    lead: "capstone을 새 예제로 시작하지 않고 REACT 문서, my-app02의 local auth/Todo/Memo와 my-app03의 Axios/auth/Guestbook을 같은 구조적 지도에 놓습니다.",
    mechanism: "문서는 Router, Fetch/Axios, Zustand, auth CRUD와 React-Spring JWT 흐름을 설명합니다. my-app02는 local UI auth와 Zustand Todo/Memo, flat declarative routes를 사용하고 Axios/Query는 없습니다. my-app03은 flat routes, startup auth Effect, Axios instance/interceptors, manual Guestbook Effect fetch와 store patch를 사용하며 TanStack Query는 없습니다. local versions와 2026-07-14 registry current Query 5.101.2, Axios 1.18.1, Router DOM 7.18.1을 분리합니다.",
    workflow: "21개 local files의 line/byte/SHA와 dependency presence를 고정하고 route→component→state owner→HTTP adapter→auth→server state→reconciliation edges를 그립니다. observed source, 문서 설명, target architecture와 검증되지 않은 추론을 다른 색/열로 기록합니다.",
    invariants: "실제 route, base URL, token/storage key, password, user, Todo/Memo/Guestbook content와 payload를 복사하지 않고 synthetic resource names와 structural facts만 사용하며 원본 파일을 바꾸지 않습니다.",
    edgeCases: "direct deep link, unauthenticated entry, startup storage corruption, concurrent 401, create/update/delete races, back navigation, logout, static hosting refresh와 version drift를 포함합니다.",
    failureModes: "파일이 많다는 이유로 기능별 몇 줄만 요약하면 route/network/cache/auth owners와 책임 중복을 잃고 sample이 동작한다는 사실을 production contract로 과장하게 됩니다.",
    verification: "hash/status, dependency/lock parity, routes/imports/call graph, state owners, request methods, sensitive sinks와 local/current version evidence를 자동·수동으로 대조합니다.",
    operations: "source snapshot ID, app variant, capability present/absent와 audit coverage를 기록하되 원본 값과 개인 data는 수집하지 않습니다.",
    concepts: [
      c("system topology", "route·component·state·HTTP·auth·server/cache owners와 호출 edge를 나타낸 전체 구조입니다.", ["파일 목록보다 의미가 큽니다.", "observed/target을 구분합니다."]),
      c("capability matrix", "각 app/version이 routing, transport, auth, cache와 mutation 기능을 실제로 갖는지 나타내는 표입니다.", ["package와 source를 함께 봅니다.", "latest를 local로 오인하지 않습니다."]),
      c("sanitized provenance", "민감·도메인 값을 제거하면서 source path/hash와 구조적 근거를 보존하는 기록입니다.", ["재검증 가능합니다.", "원본을 변경하지 않습니다."]),
    ],
    codeExamples: [node(
      "react40-source-topology", "sanitized two-app capability topology", "React40SourceTopology.mjs",
      "my-app02/03의 실제 local capability와 current target versions를 분리해 출력합니다.",
      String.raw`const apps = {
  app02: { router: "7.15.0", axios: false, query: false, serverCrud: false },
  app03: { router: "7.15.0", axios: "1.16.1", query: false, serverCrud: true },
};
for (const [name, caps] of Object.entries(apps)) console.log(name + "=" + JSON.stringify(caps));
console.log("current-target=router:7.18.1|axios:1.18.1|query:5.101.2");
console.log("local-files-audited=21");
console.log("private-values-copied=false");`,
      "app02={\"router\":\"7.15.0\",\"axios\":false,\"query\":false,\"serverCrud\":false}\napp03={\"router\":\"7.15.0\",\"axios\":\"1.16.1\",\"query\":false,\"serverCrud\":true}\ncurrent-target=router:7.18.1|axios:1.18.1|query:5.101.2\nlocal-files-audited=21\nprivate-values-copied=false",
      localCapstoneRefs.concat(["r40-query-registry", "r40-axios-registry", "r40-router-registry"]),
    )],
  }),
  appliedTopic({
    id: "architecture-boundaries-single-ownership", title: "Router·HTTP·auth·server state의 책임과 single owner를 고정합니다",
    lead: "component, Zustand, Router loader, Query cache와 Axios interceptor가 같은 사실을 각각 소유하지 않도록 authoritative owner와 orchestration edge를 정합니다.",
    mechanism: "Router는 URL match/navigation/data boundary를, HTTP adapter는 transport/config/cancel/error normalization을, auth coordinator는 credential/session epoch와 refresh/logout을, Query cache는 remote read identity/freshness를, mutation layer는 side effect/reconciliation을, local store는 UI draft/preference를 담당합니다. server가 data와 authorization의 최종 authority입니다.",
    workflow: "state inventory를 URL state, local ephemeral, client durable preference, auth evidence/UI state, remote server state와 derived view로 분류하고 각 항목에 one write owner, readers, persistence, invalidation, security와 cleanup을 지정합니다.",
    invariants: "server list를 Zustand와 Query cache에 장기 dual-write하지 않고 component가 interceptor/credential을 직접 조립하지 않으며 URL에서 파생 가능한 filter/page를 별도 state에 무조건 복제하지 않습니다.",
    edgeCases: "optimistic projection, offline draft, loader prefetch, persisted public cache, SSR dehydrated state, multi-tab auth와 compatibility migration을 포함합니다.",
    failureModes: "어디서든 편한 곳에 state를 저장하면 filter URL과 UI가 갈라지고 logout 시 private owner를 모두 찾지 못하며 두 cache의 invalidation이 서로 달라집니다.",
    verification: "state ownership table의 duplicate writer, derived copies, persistence/sensitive fields, cleanup edge, route/query key consistency와 mutation reconciliation을 review gate로 검사합니다.",
    operations: "owner, state family, write source, divergence/reconciliation incidents와 cleanup residual을 low-cardinality로 관찰합니다.",
    concepts: [
      c("authoritative owner", "특정 사실을 쓰고 lifecycle을 결정하는 단일 책임 계층입니다.", ["readers는 여러 개일 수 있습니다.", "server authority와 client cache를 구분합니다."]),
      c("orchestration edge", "한 계층의 사건을 다른 계층의 명시적 action으로 연결하는 경계입니다.", ["숨은 side effect를 줄입니다.", "cancel/error를 전달합니다."]),
      c("derived state", "URL, server result나 local source에서 계산할 수 있어 독립 write owner가 필요 없는 값입니다.", ["필요하면 memoize합니다.", "복제를 피합니다."]),
    ],
  }),
  appliedTopic({
    id: "deep-link-route-data-error-flow", title: "deep link를 match→param schema→auth→loader→pending/error tree로 추적합니다",
    lead: "홈에서 클릭한 정상 경로만 보지 않고 주소창 새로고침과 잘못된 param에서도 어떤 route branch와 UI boundary가 책임지는지 고정합니다.",
    mechanism: "React Router route objects는 path/component뿐 아니라 loader/action/error behavior를 정의하고 nested match는 parent layout에서 child params/data/error를 구성합니다. loader는 route component 전에 data를 제공하며 pending navigation UI는 current usable content와 next-route work를 구분해야 합니다.",
    workflow: "incoming URL normalize→route match→params/search schema→auth resolution/guard→loader/query options→render or redirect/not-found/error boundary 순서를 그립니다. route-local error는 가장 가까운 boundary로, unknown auth는 accessible resolution UI로 보냅니다.",
    invariants: "untrusted param/search를 API URL에 그대로 붙이지 않고 unknown을 guest로 조기 redirect하지 않으며 status/error UI가 focus와 current usable content를 불필요하게 제거하지 않습니다.",
    edgeCases: "unknown route, missing/encoded/invalid ID, nested 404, loader abort, same-route search change, hash/base path, back/forward, offline와 static-host refresh를 포함합니다.",
    failureModes: "component mount 뒤 Effect에서 param/auth/data를 모두 처리하면 protected content flash와 waterfall이 생기고 catch-all이 모든 error를 같은 404로 만들면 recovery가 불가능합니다.",
    verification: "URL corpus, route match/param schema, direct load/client nav/back, auth unknown/guest, loader abort, nearest boundary, keyboard focus와 status announcements를 browser에서 실행합니다.",
    operations: "route template, navigation phase, param validation code, loader outcome, boundary ID와 time-to-usable-content를 기록하고 raw URL/search values는 제한합니다.",
    concepts: [
      c("deep link", "앱 내부 navigation history 없이 특정 URL로 직접 진입하는 요청입니다.", ["server/static host도 처리해야 합니다.", "startup auth와 data가 필요합니다."]),
      c("route data boundary", "match된 route가 params, loader/action, pending와 error 처리를 함께 소유하는 경계입니다.", ["component Effect와 다릅니다.", "nested ownership을 가집니다."]),
      c("nearest error boundary", "throw된 route/render error를 가장 가까운 route 계층에서 격리하고 복구 UI를 제공하는 boundary입니다.", ["404와 모든 failure를 합치지 않습니다.", "safe details만 표시합니다."]),
    ],
    codeExamples: [node(
      "react40-deep-link-flow", "deep-link route phase classifier", "React40DeepLinkFlow.mjs",
      "valid, invalid-param, guest와 loader failure가 서로 다른 terminal UI로 가는지 보여 줍니다.",
      String.raw`const cases = [
  ["match", true, "authenticated", "ok"],
  ["match", false, "authenticated", "ok"],
  ["match", true, "guest", "ok"],
  ["match", true, "authenticated", "problem"],
  ["miss", true, "authenticated", "ok"],
];
for (const [match, param, auth, loader] of cases) {
  const view = match === "miss" ? "route-404" : !param ? "param-404" : auth !== "authenticated" ? "login-redirect" : loader !== "ok" ? "route-error" : "content";
  console.log([match, param, auth, loader].join(":") + "=" + view);
}`,
      "match:true:authenticated:ok=content\nmatch:false:authenticated:ok=param-404\nmatch:true:guest:ok=login-redirect\nmatch:true:authenticated:problem=route-error\nmiss:true:authenticated:ok=route-404",
      ["r40-router-routing", "r40-router-loading", "r40-router-pending", "r40-router-errors"],
    )],
  }),
  appliedTopic({
    id: "loader-query-identity-orchestration", title: "route loader와 Query cache를 options factory 하나로 연결합니다",
    lead: "loader와 component가 각각 fetch하지 않고 URL/auth inputs가 같은 query identity와 queryFn을 만들도록 bridge를 구성합니다.",
    mechanism: "query key는 resource, validated route/search params, representation version과 non-secret auth epoch를 포함합니다. loader는 user-visible error가 필요하면 fetch/ensure 계열을 선택하고 speculative intent는 prefetchQuery를 사용하며 component는 같은 options를 구독합니다. prefetch는 staleTime과 GC, permission/network budget의 영향을 받습니다.",
    workflow: "route schema가 canonical inputs를 만들고 queryOptions factory가 key/queryFn/stale policy를 반환합니다. loader는 QueryClient와 request AbortSignal을 사용해 cache를 준비하고 component는 그 cache를 읽으며 Link intent/viewport prefetch도 같은 factory를 사용합니다.",
    invariants: "loader/component/prefetch의 key와 queryFn이 일치하고 token/PII가 key에 없으며 unauthorized/invalid route는 private prefetch를 시작하지 않고 abort/epoch mismatch result를 commit하지 않습니다.",
    edgeCases: "warm/stale/missing cache, loader error vs prefetch swallow, rapid hover, multiple route params, account switch, background refetch와 inactive GC를 포함합니다.",
    failureModes: "loader는 URL 문자열, component는 object key를 쓰면 cache가 두 개가 되고 prefetch가 error를 throw한다고 가정하면 navigation error 계약이 깨지며 모든 link를 prefetch하면 private traffic이 폭증합니다.",
    verification: "key equivalence corpus, one request cold/warm path, stale/refetch, invalid/unauthorized no-request, hover/focus/viewport, abort와 account switch를 actual Router+Query fixture로 실행합니다.",
    operations: "route/query template, cache hit, prefetch useful/wasted, duplicate request, age와 abort를 correlation ID로 연결합니다.",
    concepts: [
      c("loader-query bridge", "Router loader가 QueryClient의 동일 query contract를 이용해 navigation과 component cache를 연결하는 패턴입니다.", ["single request owner를 만듭니다.", "error policy를 선택합니다."]),
      c("query options factory", "validated inputs에서 key, queryFn과 lifecycle policy를 생성하는 재사용 가능한 정의입니다.", ["loader/component가 공유합니다.", "secret-free입니다."]),
      c("prefetch budget", "사용자 intent, permission, network, freshness와 cache retention을 근거로 speculative fetch를 제한하는 정책입니다.", ["모든 link를 fetch하지 않습니다.", "효용을 측정합니다."]),
    ],
    codeExamples: [node(
      "react40-loader-query-owner", "route/query single-owner request planner", "React40LoaderQueryOwner.mjs",
      "deep link, component mount와 hover가 같은 key에서 중복 network owner를 만들지 않는지 모델링합니다.",
      String.raw`const cache = new Set();
let requests = 0;
function ensure(key) {
  if (!cache.has(key)) { requests += 1; cache.add(key); return "fetched"; }
  return "cache-hit";
}
const key = JSON.stringify(["resource", { id: "synthetic", authEpoch: 3 }]);
console.log("loader=" + ensure(key));
console.log("component=" + ensure(key));
console.log("prefetch=" + ensure(key));
console.log("requests=" + requests);
console.log("contains-secret=false");`,
      "loader=fetched\ncomponent=cache-hit\nprefetch=cache-hit\nrequests=1\ncontains-secret=false",
      ["r40-query-keys", "r40-queryclient", "r40-query-prefetch", "r40-router-loading", "r40-router-link"],
    )],
  }),
  appliedTopic({
    id: "http-adapter-protocol-pipeline", title: "Fetch/Axios를 status·body·schema·cancel·problem pipeline으로 통일합니다",
    lead: "fetch와 Axios syntax 차이를 가르치는 데서 끝내지 않고 request intent부터 typed success/failure까지 동일한 adapter contract로 맞춥니다.",
    mechanism: "WHATWG Fetch는 request/response와 AbortSignal 기반 fetch algorithm을 정의하고 HTTP non-2xx를 반드시 Promise rejection으로 만들지는 않으므로 status를 확인해야 합니다. Axios instance는 shared baseline config와 interceptors를 제공하고 signal cancellation과 AxiosError status/code를 normalize할 수 있습니다. RFC 9110 method/status semantics와 RFC 9457 problem details를 application error taxonomy에 연결합니다.",
    workflow: "validated command/query→route template/params encode→method/headers/body/timeout/signal→transport→status/content-type→bounded body parse→runtime schema→domain mapper 또는 SafeProblem 순서를 구현합니다. fetch/axios adapters는 동일 Result/Error interface를 반환합니다.",
    invariants: "2xx만으로 schema-valid success라 하지 않고 non-2xx/problem malformed/204를 구분하며 AbortSignal을 nested requests까지 전달하고 raw config/header/body/stack을 UI·log에 노출하지 않습니다.",
    edgeCases: "network/CORS, timeout, abort, 204, redirect, wrong content type, invalid JSON, oversized body, 401/403/409/412/429/5xx, Retry-After와 partial response를 포함합니다.",
    failureModes: "response.json을 status 전에 호출하면 HTML error에서 parse failure만 보이고 AxiosError 전체를 serialize하면 credential config가 노출되며 timeout과 user abort를 같은 alert/retry로 처리하면 UX가 틀립니다.",
    verification: "disposable server status/body corpus, fetch/Axios parity, timeout/abort races, schema/property tests, error redaction, retry metadata와 resource cleanup을 실행합니다.",
    operations: "transport, method/route template, phase, safe failure code, latency/bytes/retry-after를 기록하고 raw URL/body/credentials를 제외합니다.",
    concepts: [
      c("HTTP adapter", "UI/query/mutation intent를 protocol request와 typed result로 변환하는 경계입니다.", ["transport library를 감쌉니다.", "schema/error를 통일합니다."]),
      c("SafeProblem", "UI/retry/telemetry가 사용할 수 있도록 민감 detail을 제거한 stable problem representation입니다.", ["RFC 9457을 수용할 수 있습니다.", "raw error와 다릅니다."]),
      c("cancellation taxonomy", "user/navigation/logout abort, timeout과 network failure를 서로 다른 결과로 분류하는 체계입니다.", ["retry와 announcement가 달라집니다.", "signal source를 추적합니다."]),
    ],
    codeExamples: [node(
      "react40-http-failure-classifier", "HTTP transport/status/schema failure classifier", "React40HttpFailureClassifier.mjs",
      "network, abort, status, body와 schema 실패를 stable code로 분리합니다.",
      String.raw`const cases = [
  { transport: "abort" }, { transport: "network" }, { status: 401, body: "problem" },
  { status: 503, body: "problem" }, { status: 200, body: "invalid" }, { status: 204, body: "empty" }, { status: 200, body: "valid" },
];
for (const x of cases) {
  const code = x.transport === "abort" ? "cancelled" : x.transport === "network" ? "network" : x.status === 204 ? "success-empty" : x.status >= 400 ? "http-" + x.status : x.body !== "valid" ? "schema" : "success";
  console.log(code);
}`,
      "cancelled\nnetwork\nhttp-401\nhttp-503\nschema\nsuccess-empty\nsuccess",
      ["r40-fetch-standard", "r40-axios-instance", "r40-axios-interceptors", "r40-axios-cancellation", "r40-axios-errors", "r40-rfc9110", "r40-rfc9457"],
    )],
  }),
  appliedTopic({
    id: "auth-bootstrap-refresh-logout", title: "auth bootstrap·single-flight refresh·logout을 app-wide coordinator로 묶습니다",
    lead: "route component마다 로그인 확인을 반복하지 않고 startup resolution, credential attachment, 401 recovery, cache scope와 logout cleanup을 하나의 epoch protocol로 운영합니다.",
    mechanism: "auth state는 unknown/guest/authenticated/refreshing/expired/logout을 구분하고 epoch가 scope 변경마다 증가합니다. Axios response interceptor의 concurrent 401은 epoch별 refresh flight 하나를 공유하며 eligible request만 bounded replay합니다. logout은 epoch 증가, requests/refresh cancel, private query/mutation/persistence purge, server revoke와 safe navigation을 조율합니다.",
    workflow: "startup server/session probe→auth state resolve→route/query gates→just-in-time credential→401 classify/single-flight→epoch commit gate→bounded replay를 구성합니다. logout/account switch는 late result를 먼저 무효화한 뒤 모든 private sinks를 제거합니다.",
    invariants: "client guard/store가 server authorization을 대신하지 않고 token이 URL/query key/storage/log에 불필요하게 남지 않으며 refresh endpoint가 자기 loop에 들어가지 않고 old epoch 결과가 commit되지 않습니다.",
    edgeCases: "direct deep link while unknown, concurrent 401, refresh failure/timeout, logout during mutation, account switch, multi-tab, CSRF, storage exception와 SSR cookie rotation을 포함합니다.",
    failureModes: "persisted isLogin만 보고 query를 실행하면 expired private request/flash가 생기고 request별 refresh는 storm을 만들며 navigate-only logout은 memory cache와 late response를 남깁니다.",
    verification: "state/epoch table, N-401 one flight, status×method replay, server authn/authz/CSRF negatives, logout fault injection, residual secret canary와 account A→B를 실행합니다.",
    operations: "auth resolve/refresh/logout phase, waiters/replays, stale commit blocked, purge counts와 authn/authz/CSRF safe codes를 privacy-safe하게 관찰합니다.",
    concepts: [
      c("auth coordinator", "startup, credential, refresh, epoch, logout과 dependent data gates를 조율하는 app boundary입니다.", ["server policy는 별도입니다.", "single owner를 둡니다."]),
      c("epoch commit gate", "async auth/data result를 쓰기 직전 current auth generation과 일치하는지 검사하는 경계입니다.", ["cancel을 보완합니다.", "token을 key로 쓰지 않습니다."]),
      c("logout purge", "requests, refresh, query/mutation cache, persistence와 credential을 guest 상태로 수렴시키는 idempotent cleanup입니다.", ["navigate보다 넓습니다.", "server revoke를 포함합니다."]),
    ],
    codeExamples: [node(
      "react40-auth-coordinator", "auth epoch refresh/logout coordinator model", "React40AuthCoordinator.mjs",
      "concurrent 401이 한 refresh를 공유하고 logout epoch가 old result를 거부하는지 보여 줍니다.",
      String.raw`let epoch = 9;
let refreshCalls = 0;
let flight;
const refreshOnce = () => flight ??= Promise.resolve().then(() => { refreshCalls += 1; return { startEpoch: epoch }; });
const results = await Promise.all([refreshOnce(), refreshOnce(), refreshOnce()]);
const oldEpoch = results[0].startEpoch;
epoch += 1;
console.log("refresh-calls=" + refreshCalls);
console.log("waiters=" + results.length);
console.log("old-result-accepted=" + (oldEpoch === epoch));
console.log("logout-epoch=" + epoch);
console.log("credential-logged=false");`,
      "refresh-calls=1\nwaiters=3\nold-result-accepted=false\nlogout-epoch=10\ncredential-logged=false",
      ["r40-axios-interceptors", "r40-queryclient", "r40-query-cancellation", "r40-owasp-auth", "r40-owasp-authz", "r40-owasp-session", "r40-owasp-csrf", "r40-owasp-html5"],
    )],
  }),
  appliedTopic({
    id: "server-state-freshness-prefetch-cache", title: "server state를 identity·freshness·retention·prefetch budget으로 운영합니다",
    lead: "Zustand에 remote list를 복사해 전역화하는 대신 query key, status/fetchStatus, staleTime/gcTime, invalidation과 auth purge를 business contract로 정합니다.",
    mechanism: "TanStack Query는 top-level serializable key로 query identity를 정하고 QueryClient가 cache lifecycle을 관리합니다. fresh/stale는 revalidation 필요성을, active/inactive와 gcTime은 retention을, prefetch는 navigation 전에 cache를 준비하는 행위를 나타냅니다. local draft와 server result는 다른 owners입니다.",
    workflow: "resource/filter/page/representation/auth epoch key factory를 만들고 queryFn에 AbortSignal/schema를 연결합니다. query family별 maximum acceptable age, refetch triggers, retention, retry, prefetch와 logout purge를 표로 정합니다.",
    invariants: "다른 auth/filter result가 key를 공유하지 않고 credential이 key/cache persistence에 없으며 disabled/unknown auth query가 invalidation으로 몰래 fetch되지 않고 stale data fallback이 age/error를 숨기지 않습니다.",
    edgeCases: "warm deep link, focus/reconnect storm, offline, pagination, empty/error with previous data, inactive private cache, multiple tabs, SSR hydration와 app version buster를 포함합니다.",
    failureModes: "staleTime 0을 cache 없음으로 오해하거나 gcTime을 freshness로 쓰면 request storm/오래된 표시가 생기고 broad key는 account/filter data를 섞습니다.",
    verification: "key equivalence/isolation, status×fetchStatus UI, fake clock fresh/stale/GC, focus/reconnect, prefetch usefulness, logout purge와 memory/privacy budget을 실행합니다.",
    operations: "query family, age/state, observer, cache hit/refetch/prefetch/GC, bytes와 purge residual을 low-cardinality로 관찰합니다.",
    concepts: [
      c("server-state cache", "remote authority의 result를 identity와 freshness policy 아래 임시 보유하는 client cache입니다.", ["local source of truth가 아닙니다.", "revalidation이 필요합니다."]),
      c("freshness budget", "사용자 위험과 data volatility를 근거로 허용하는 cache age와 refetch triggers입니다.", ["retention과 다릅니다.", "family별로 정합니다."]),
      c("auth-scoped query key", "private result를 공유할 수 있는 auth generation을 포함한 secret-free cache identity입니다.", ["token을 넣지 않습니다.", "purge를 보완합니다."]),
    ],
    codeExamples: [node(
      "react40-query-freshness-plan", "auth-scoped cache and prefetch decision model", "React40QueryFreshnessPlan.mjs",
      "cache age, auth scope와 navigation intent로 serve/refetch/prefetch를 분류합니다.",
      String.raw`const cases = [
  { age: 10, stale: 60, auth: true, intent: false },
  { age: 90, stale: 60, auth: true, intent: false },
  { age: 90, stale: 60, auth: true, intent: true },
  { age: 90, stale: 60, auth: false, intent: true },
];
for (const x of cases) {
  const result = !x.auth ? "skip-private" : x.age <= x.stale ? "serve-fresh" : x.intent ? "prefetch-stale" : "serve-stale-refetch";
  console.log(result);
}`,
      "serve-fresh\nserve-stale-refetch\nprefetch-stale\nskip-private",
      ["r40-query-queries", "r40-query-keys", "r40-queryclient", "r40-query-prefetch"],
    )],
  }),
  appliedTopic({
    id: "mutation-optimistic-version-convergence", title: "mutation을 idempotency·optimistic projection·versioned convergence로 설계합니다",
    lead: "create 뒤 refetch와 update/delete local patch를 하나의 규칙으로 억지 통일하지 않고 server effect와 cache certainty에 따라 response patch, targeted invalidation과 rollback을 조합합니다.",
    mechanism: "useMutation lifecycle은 variables/context/status를 추적하고 success callback에서 affected query families를 invalidate할 수 있습니다. optimistic cache path는 queries cancel→snapshot 또는 inverse operation→apply→success canonicalize/error rollback→settled invalidate 순서를 따릅니다. concurrent operations는 whole snapshot이 아니라 operation log로 격리하고 If-Match/version이 lost update를 감지합니다.",
    workflow: "command schema와 idempotency/precondition을 정하고 mutation×query-family effect matrix를 만듭니다. 확실한 server response는 immutable patch하고 membership/aggregate가 불확실한 queries는 targeted awaited invalidation하며 concurrent pending effects를 confirmed base 위에 fold합니다.",
    invariants: "same logical command duplicate가 server에서 통제되고 stale response/version이 최신 cache를 낮추지 않으며 실패한 operation만 rollback되고 다른 성공/pending effect는 보존됩니다.",
    edgeCases: "double submit, ambiguous timeout, temp ID, response inversion, same entity conflict, delete missing, offline replay, logout mid-mutation와 refetch failure를 포함합니다.",
    failureModes: "전체 list snapshot rollback은 later success를 지우고 모든 성공 뒤 broad invalidation은 storm을 만들며 POST blind retry와 last response wins는 duplicate/lost update를 만듭니다.",
    verification: "mutation lifecycle, method/dedupe matrix, all response permutations, immutable references, targeted invalidation, ETag/412 conflict, offline resume와 final server-cache parity를 실행합니다.",
    operations: "mutation phase/outcome, duplicate prevented, optimistic confirm/rollback, conflict, invalidation cost와 reconciliation latency/mismatch를 관찰합니다.",
    concepts: [
      c("confirmed base", "server가 확인한 최신 representation으로 pending optimistic operations를 적용하기 전 기준입니다.", ["version을 가집니다.", "stale response를 거부합니다."]),
      c("targeted invalidation", "mutation effect에 실제로 영향받는 query families만 stale/refetch 대상으로 지정하는 작업입니다.", ["broad refetch를 피합니다.", "key factory와 공유합니다."]),
      c("versioned convergence", "client optimistic intent와 server confirmed version이 conflict 감지·rollback·refetch를 통해 같은 최종 상태로 수렴하는 성질입니다.", ["last-write UI와 다릅니다.", "precondition을 사용합니다."]),
    ],
    codeExamples: [node(
      "react40-mutation-convergence", "concurrent optimistic version convergence model", "React40MutationConvergence.mjs",
      "실패 operation만 제거하고 server version이 단조 증가하는지 모델링합니다.",
      String.raw`let confirmed = { value: 10, version: 4 };
let pending = [{ id: "a", delta: 1 }, { id: "b", delta: 2 }];
const visible = () => pending.reduce((n, op) => n + op.delta, confirmed.value);
console.log("optimistic=" + visible());
pending = pending.filter((op) => op.id !== "a");
console.log("after-a-error=" + visible());
confirmed = { value: 12, version: 5 };
pending = pending.filter((op) => op.id !== "b");
console.log("confirmed=" + confirmed.value + "@v" + confirmed.version);
console.log("stale-v4-accepted=" + (4 >= confirmed.version));`,
      "optimistic=13\nafter-a-error=12\nconfirmed=12@v5\nstale-v4-accepted=false",
      ["r40-query-mutations", "r40-query-invalidations", "r40-query-optimistic", "r40-router-actions", "r40-rfc9110"],
    )],
  }),
  appliedTopic({
    id: "error-retry-accessible-recovery", title: "route·HTTP·query·mutation error를 recovery taxonomy와 접근성으로 연결합니다",
    lead: "모든 실패를 console/toast로 보내지 않고 어디까지 usable data가 있고 누가 재시도·재로그인·병합·뒤로가기를 제공할지 정합니다.",
    mechanism: "transport abort/network/timeout, HTTP 401/403/404/409/412/422/429/5xx, body/schema, query initial/background, mutation conflict와 render/route errors를 stable SafeProblem으로 분류합니다. Router error boundary는 subtree를 격리하고 Query stale-data fallback, mutation rollback과 status message는 각기 다른 recovery 역할을 가집니다.",
    workflow: "raw error→safe classifier→retry eligibility/deadline→UI surface(boundary/inline/status/global)→focus/action→telemetry를 매핑합니다. canceled navigation은 오류 alert를 피하고 401 single-flight, 403 forbidden, conflict merge와 429/503 capped retry를 구분합니다.",
    invariants: "non-idempotent ambiguous operation을 자동 retry하지 않고 previous validated data가 있으면 background error에서 불필요하게 지우지 않으며 status 변화는 focus를 훔치지 않고 보조기술에 전달됩니다.",
    edgeCases: "boundary reset loop, Retry-After, offline pause, stale private data, nested route error, validation field focus, repeated announcements와 telemetry failure를 포함합니다.",
    failureModes: "세 번 재시도 기본값을 모든 failure에 적용하면 auth/validation과 outage load를 증폭하고 toast-only UI는 field/route context와 screen-reader recovery를 잃습니다.",
    verification: "failure×attempt×data-presence matrix, retry bounds, nearest boundary, stale fallback age, keyboard/focus/live region, safe detail redaction와 reset loop를 실행합니다.",
    operations: "safe problem type, surface/recovery action, retry/delay, boundary reset, stale fallback duration와 user outcome을 관찰합니다.",
    concepts: [
      c("recovery taxonomy", "failure class, data availability와 operation semantics에 따라 retry·reauth·merge·fallback·stop을 결정하는 표입니다.", ["상태 코드 하나보다 넓습니다.", "deadline을 포함합니다."]),
      c("stale-data fallback", "refresh 실패 때 마지막 validated data를 age/error 표시와 함께 유지하는 resilience 방식입니다.", ["민감/위험 data는 제한합니다.", "silent freshness가 아닙니다."]),
      c("accessible status", "focus를 이동하지 않고 pending/success/error를 시각·보조기술 사용자에게 전달하는 피드백입니다.", ["중복을 제한합니다.", "action을 제공합니다."]),
    ],
    codeExamples: [node(
      "react40-recovery-matrix", "failure and usable-data recovery classifier", "React40RecoveryMatrix.mjs",
      "initial/background/auth/conflict/cancel failure를 다른 recovery로 분류합니다.",
      String.raw`const cases = [
  ["cancelled", false], ["network", false], ["network", true], ["http-401", true],
  ["http-403", true], ["http-412", true], ["schema", false], ["http-503", true],
];
for (const [kind, hasData] of cases) {
  const action = kind === "cancelled" ? "silent" : kind === "http-401" ? "refresh-once" : kind === "http-403" ? "forbidden" : kind === "http-412" ? "merge-conflict" : hasData ? "keep-data-retry" : "boundary";
  console.log(kind + ":" + hasData + "=" + action);
}`,
      "cancelled:false=silent\nnetwork:false=boundary\nnetwork:true=keep-data-retry\nhttp-401:true=refresh-once\nhttp-403:true=forbidden\nhttp-412:true=merge-conflict\nschema:false=boundary\nhttp-503:true=keep-data-retry",
      ["r40-axios-errors", "r40-rfc9110", "r40-rfc9457", "r40-router-errors", "r40-wcag-status"],
    )],
  }),
  appliedTopic({
    id: "guestbook-end-to-end-capstone", title: "Guestbook user journey를 deep-link부터 logout까지 한 trace로 결합합니다",
    lead: "앞선 계약들을 각각 나열하지 않고 synthetic Guestbook detail/list journey에서 사건, state, network, cache, UI와 recovery evidence를 시간순으로 연결합니다.",
    mechanism: "direct URL이 route/params를 match하고 auth unknown을 resolve한 뒤 loader-query bridge가 list/detail을 fetch합니다. query state가 pending/content/background status를 만들고 create/update/delete mutation은 idempotency/precondition, optimistic projection과 targeted invalidation을 사용합니다. 401은 single-flight refresh, 412는 merge, fatal route problem은 boundary, logout은 epoch/purge를 수행합니다.",
    workflow: "correlation ID와 synthetic record를 사용해 deep link→auth resolve→loader/query→render→create optimistic→server canonicalize→update concurrent conflict→retry/merge→background refetch→delete→logout→back navigation을 실제 browser/disposable server에서 실행합니다.",
    invariants: "각 단계의 owner가 하나이고 URL/auth/query/mutation versions가 trace에서 연결되며 actual source values나 credential이 artifact에 없고 logout 후 private screen/cache/network가 되살아나지 않습니다.",
    edgeCases: "empty list, create fail, update completion inversion, delete already absent, concurrent 401, refresh fail, offline, keyboard-only flow, screen reader와 deploy mid-session을 포함합니다.",
    failureModes: "개별 unit demo만 있으면 deep-link startup waterfall, interceptor-cache race, mutation 뒤 stale route, logout back-cache 같은 cross-layer bug를 발견하지 못합니다.",
    verification: "trace span ordering, one request identity, all fault branches, final server/cache parity, accessibility tree/focus/status, no-secret artifacts와 cleanup을 실행합니다.",
    operations: "navigation→auth→query→mutation→reconciliation spans를 하나의 safe correlation으로 연결하고 user/content/credential 대신 route/query/mutation templates와 reason codes를 사용합니다.",
    concepts: [
      c("end-to-end trace", "한 사용자 의도가 route, auth, request, cache, render와 mutation/recovery를 통과하는 시간순 evidence입니다.", ["raw payload를 제외합니다.", "cross-layer 원인을 찾습니다."]),
      c("convergence checkpoint", "특정 단계에서 URL, visible UI, client cache와 server confirmed state가 합의하는지 확인하는 지점입니다.", ["optimistic pending을 구분합니다.", "logout empty state도 포함합니다."]),
      c("correlation ID", "여러 계층의 동일 operation/trace를 연결하는 비민감 opaque 식별자입니다.", ["user ID가 아닙니다.", "cardinality/retention을 통제합니다."]),
    ],
    codeExamples: [node(
      "react40-end-to-end-trace", "router-network-server-state journey trace", "React40EndToEndTrace.mjs",
      "deep link부터 logout purge까지 핵심 phases와 invariants를 순서대로 출력합니다.",
      String.raw`const trace = [
  "route:matched", "auth:resolved@e5", "loader:query-key-ready", "http:validated",
  "cache:success", "ui:content", "mutation:optimistic", "mutation:confirmed@v2",
  "cache:reconciled", "ui:status-announced", "logout:epoch@e6", "logout:private-purged",
];
trace.forEach((event, index) => console.log(String(index + 1).padStart(2, "0") + "|" + event));
console.log("final-private-records=0");
console.log("secret-findings=0");`,
      "01|route:matched\n02|auth:resolved@e5\n03|loader:query-key-ready\n04|http:validated\n05|cache:success\n06|ui:content\n07|mutation:optimistic\n08|mutation:confirmed@v2\n09|cache:reconciled\n10|ui:status-announced\n11|logout:epoch@e6\n12|logout:private-purged\nfinal-private-records=0\nsecret-findings=0",
      ["r40-router-actions", "r40-query-queries", "r40-query-mutations", "r40-queryclient", "r40-wcag-status"],
    )],
  }),
  appliedTopic({
    id: "ssr-static-deploy-runtime-contract", title: "SSR·SPA static hosting·API 환경을 deployment contract로 검증합니다",
    lead: "개발 server에서 navigation이 된다는 사실을 배포 성공으로 보지 않고 direct URL, base path, asset/API origin, cache headers, hydration와 secret injection을 실제 artifact에서 확인합니다.",
    mechanism: "SSR은 HTTP request마다 QueryClient/auth context를 만들고 safe cache subset만 dehydrate하며 hydrateRoot first tree parity를 지킵니다. 정적 SPA hosting은 server가 deep link를 app entry로 rewrite하는지, 그렇지 않으면 hash routing/404 fallback 같은 hosting-specific strategy가 필요한지 확인합니다. GitHub Pages는 static hosting이므로 server runtime/API secrets를 제공하는 backend로 오인하지 않습니다.",
    workflow: "build-time public config와 runtime server secrets를 분리하고 base/asset/API URLs를 schema 검증합니다. preview artifact에서 root/nested/deep refresh, 404, browser back, CORS/CSP/cookie, cache busting/service worker와 source-map privacy를 테스트합니다.",
    invariants: "client bundle/HTML/dehydrated cache에 server secret·credential·private error가 없고 SSR clients가 request 간 공유되지 않으며 deployment rollback이 incompatible cache와 pending work를 정리합니다.",
    edgeCases: "project-site subpath, custom domain, CDN stale index/assets, deploy during session, API mixed content/CORS, cookie domain/SameSite, hydration mismatch, offline service worker와 old chunk를 포함합니다.",
    failureModes: "client-side route 클릭만 검사하면 deep refresh 404를 놓치고 environment secret을 frontend build variable에 넣으면 공개 bundle에 포함되며 process-global SSR QueryClient는 cross-request leak를 만듭니다.",
    verification: "immutable build hash, bundle/HTML/source-map secret scan, direct URL matrix, two-request SSR canary, API/CORS/cookie, old/new cache compatibility, canary and rollback rehearsal을 실행합니다.",
    operations: "build ID, route template/status, asset/API latency, hydration mismatch, cache version, deep-link failure와 rollback trigger를 관찰합니다.",
    concepts: [
      c("deployment contract", "build artifact, host routing, API origin, cache/security headers와 runtime behavior가 만족해야 하는 검증 목록입니다.", ["dev server와 분리합니다.", "rollback을 포함합니다."]),
      c("SPA fallback", "server가 file이 아닌 application route request를 client app entry로 돌려주는 hosting 동작입니다.", ["host 지원을 확인합니다.", "실제 404 asset은 구분합니다."]),
      c("request-scoped SSR cache", "한 HTTP request에서만 생성·사용·폐기되는 query/auth cache입니다.", ["global 공유를 금지합니다.", "dehydrate allowlist를 사용합니다."]),
    ],
    codeExamples: [node(
      "react40-deployment-gate", "deployment artifact and deep-link readiness gate", "React40DeploymentGate.mjs",
      "artifact, direct route, secret, SSR isolation과 rollback 증거를 배포 gate로 계산합니다.",
      String.raw`const report = {
  immutableArtifact: true, rootRoute: true, nestedDirectRoute: true, asset404Separated: true,
  secretFindings: 0, ssrCrossRequestLeaks: 0, hydrationMismatches: 0, rollbackReady: true,
};
const pass = Object.entries(report).every(([key, value]) => key === "secretFindings" || key === "ssrCrossRequestLeaks" || key === "hydrationMismatches" ? value === 0 : value === true);
for (const [key, value] of Object.entries(report)) console.log(key + "=" + value);
console.log("deploy=" + (pass ? "pass" : "block"));`,
      "immutableArtifact=true\nrootRoute=true\nnestedDirectRoute=true\nasset404Separated=true\nsecretFindings=0\nssrCrossRequestLeaks=0\nhydrationMismatches=0\nrollbackReady=true\ndeploy=pass",
      ["r40-query-ssr", "r40-react-hydrate", "r40-github-pages", "r40-router-routing"],
    )],
  }),
  appliedTopic({
    id: "observability-test-release-governance", title: "contract tests·privacy observability·canary rollback으로 capstone을 운영합니다",
    lead: "한 번 실행한 screenshot이나 coverage 숫자가 아니라 cross-layer invariants를 반복 증명하고 production-like failure에서 복구할 수 있는 release evidence를 만듭니다.",
    mechanism: "pure tests는 key/gate/reducer/patch algebra를, component tests는 Router/Query/provider/accessibility를, disposable server는 protocol/auth/idempotency/version을, browser E2E는 deep link/navigation/offline/storage를, SSR harness와 artifact scan은 request isolation/deploy privacy를 증명합니다. telemetry는 route/query/mutation templates와 safe reason만 사용합니다.",
    workflow: "source hashes→contract inventory→deterministic examples→unit/property→component→HTTP→browser→SSR/build→load/privacy→canary 순서로 evidence manifest를 생성합니다. rollout은 app/route cohort와 feature flag를 사용하고 rollback trigger, cache buster, purge와 reconciliation runbook을 연습합니다.",
    invariants: "tests마다 QueryClient/Axios interceptors/storage/server가 격리되고 flaky retry가 race failure를 숨기지 않으며 logs/traces/screenshots/reports에 token·PII·original payload가 없습니다.",
    edgeCases: "parallel tests, clock/network nondeterminism, HMR duplicate setup, partial deploy, telemetry loss, multi-tab, rollback with persisted cache와 dependency upgrade defaults를 포함합니다.",
    failureModes: "mocked success snapshots만 보면 AbortSignal, browser routing, cache scheduler와 server semantics를 우회하고 global success rate는 stale overwrite·duplicate·private residual을 숨깁니다.",
    verification: "all examples exact stdout, sourceRefs union, type/lint/depth, response permutations, browser a11y, two-request canary, URL/source hash, privacy scan, SLO and rollback rehearsal을 실행합니다.",
    operations: "time-to-usable, duplicate requests, refresh fan-in, cache hit/staleness, mutation conflict/rollback, residual private cache, boundary recovery와 deploy health를 dashboard·owner·runbook에 연결합니다.",
    concepts: [
      c("evidence manifest", "source/version, test result, artifact hash, metrics와 approvals를 한 release에 연결하는 기록입니다.", ["재현 가능해야 합니다.", "민감 값을 제외합니다."]),
      c("contract test pyramid", "pure→component→protocol→browser→SSR/deploy로 실제 경계를 점진적으로 포함하는 검증 구조입니다.", ["mock 범위를 명시합니다.", "층별 책임이 다릅니다."]),
      c("reconciliation runbook", "rollback·logout·cache mismatch·ambiguous mutation 뒤 server/client state를 안전하게 재수렴시키는 절차입니다.", ["owner/trigger가 있습니다.", "연습합니다."]),
    ],
    codeExamples: [node(
      "react40-release-evidence", "capstone release evidence gate", "React40ReleaseEvidence.mjs",
      "correctness, race, accessibility, privacy, performance와 rollback evidence를 함께 판정합니다.",
      String.raw`const evidence = {
  sourceCoverage: 21, examplesExact: 11, raceFailures: 0, secretFindings: 0,
  accessibilityBlockers: 0, duplicateRequestDelta: 0, crossRequestLeaks: 0, rollbackReady: true,
};
const pass = evidence.sourceCoverage === 21 && evidence.examplesExact >= 10 && evidence.raceFailures === 0 && evidence.secretFindings === 0 && evidence.accessibilityBlockers === 0 && evidence.duplicateRequestDelta <= 0 && evidence.crossRequestLeaks === 0 && evidence.rollbackReady;
for (const [key, value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`,
      "sourceCoverage=21\nexamplesExact=11\nraceFailures=0\nsecretFindings=0\naccessibilityBlockers=0\nduplicateRequestDelta=0\ncrossRequestLeaks=0\nrollbackReady=true\nrelease=pass",
      ["r40-query-testing", "r40-queryclient", "r40-rfc9457", "r40-wcag-status"],
    )],
  }),
];

const sources: SessionSource[] = [
  { id: "r40-local-router-doc", repository: "D:/dev/REACT", path: "docs/react/08-router.md", usedFor: ["Router lesson and structural baseline"], evidence: "2026-07-14 read-only sanitized audit: 107 lines, 5,551 bytes, SHA-256 5D1D686C17CD50FF6FF7ADFD5AD41DA9715DB9C8674059523378422DED643541. actual routes/values는 복사하지 않았습니다." },
  { id: "r40-local-fetch-doc", repository: "D:/dev/REACT", path: "docs/react/09-fetch-axios.md", usedFor: ["Fetch/Axios lesson baseline"], evidence: "2026-07-14 read-only sanitized audit: 108 lines, 4,797 bytes, SHA-256 3A5B8BF21C44D86E331AED7A8B6E554E3B2F65FA91D576A48CFBFF22679F3507. actual URL/key/output은 복사하지 않았습니다." },
  { id: "r40-local-zustand-doc", repository: "D:/dev/REACT", path: "docs/react/10-zustand-basics.md", usedFor: ["local/global/persisted state lesson baseline"], evidence: "2026-07-14 read-only sanitized audit: 134 lines, 6,356 bytes, SHA-256 36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D." },
  { id: "r40-local-crud-doc", repository: "D:/dev/REACT", path: "docs/react/11-zustand-auth-crud.md", usedFor: ["auth and CRUD state lesson baseline"], evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. actual user/domain strings는 복사하지 않았습니다." },
  { id: "r40-local-flow-doc", repository: "D:/dev/REACT", path: "docs/integration/code-flow-by-feature.md", usedFor: ["integrated route/auth/CRUD call flow"], evidence: "2026-07-14 read-only sanitized audit: 568 lines, 32,140 bytes, SHA-256 546F6BECA265FB69250102BF8406C62D818D07F9258C44B7C23068C240E5BD62. token/password/user/routes/payload는 복사하지 않았습니다." },
  { id: "r40-local-jwt-doc", repository: "D:/dev/REACT", path: "docs/integration/react-springboot-jwt-flow.md", usedFor: ["React/Spring auth sequence provenance"], evidence: "2026-07-14 read-only sanitized audit: 202 lines, 10,116 bytes, SHA-256 7287E0FA7A3A43E37DA0FEF8FF378CEABB0CE2EDB8404FBF2ACB94C0AE89FE97. credential/routes/payload는 복사하지 않았습니다." },
  { id: "r40-app02-package", repository: "D:/dev/my-app02", path: "package.json", usedFor: ["app02 dependency capability"], evidence: "2026-07-14 read-only audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. React 19.2.6, Router 7.15.0, Zustand 5.0.13이며 Axios/Query는 없습니다." },
  { id: "r40-app02-lock", repository: "D:/dev/my-app02", path: "package-lock.json", usedFor: ["app02 resolved versions"], evidence: "2026-07-14 read-only audit: 17,419 lines, 674,984 bytes, SHA-256 E7D13FE49A9DD89B4F3528668666B5637145990D7570369FDDF6DF6C1D63C400. lockfileVersion 3입니다." },
  { id: "r40-app02-app", repository: "D:/dev/my-app02", path: "src/App.js", usedFor: ["app02 flat declarative routes"], evidence: "2026-07-14 read-only sanitized audit: 30 lines, 880 bytes, SHA-256 5FF7DE7AFDC11D4413421A26FE137A064A382FC0ECDA21C5C6AB48B934665150. actual route strings는 복사하지 않았습니다." },
  { id: "r40-app02-auth-store", repository: "D:/dev/my-app02", path: "src/store/useAuthStore.jsx", usedFor: ["persisted UI auth baseline"], evidence: "2026-07-14 read-only sanitized audit: 33 lines, 1,737 bytes, SHA-256 DA8F4C6AB40D340827A8205484AD98EC3693D4BF2073B922D5521E1734FE9653. server authority로 과장하지 않고 profile/storage values를 복사하지 않았습니다." },
  { id: "r40-app02-todo", repository: "D:/dev/my-app02", path: "src/pages/TodoPage.jsx", usedFor: ["local protected Todo flow"], evidence: "2026-07-14 read-only sanitized audit: 75 lines, 3,254 bytes, SHA-256 E505E755118DC9CFDC7929C063C9F0F9441725D5598DE0B6861A3BED5C7F16C0. local guard/action 구조만 사용했습니다." },
  { id: "r40-app02-memo", repository: "D:/dev/my-app02", path: "src/pages/MemoPage.jsx", usedFor: ["local protected Memo flow"], evidence: "2026-07-14 read-only sanitized audit: 93 lines, 4,354 bytes, SHA-256 F346E532F8546F54BAFB558414CF6A39872EA493807AFF1CAAB54B93227D32D5. local auth/UI pattern만 사용했습니다." },
  { id: "r40-app03-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["app03 dependency capability"], evidence: "2026-07-14 read-only audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. React 19.2.6, Router 7.15.0, Axios 1.16.1, Zustand 5.0.13이며 Query는 없습니다." },
  { id: "r40-app03-lock", repository: "D:/dev/my-app03", path: "package-lock.json", usedFor: ["app03 resolved versions"], evidence: "2026-07-14 read-only audit: 17,457 lines, 676,411 bytes, SHA-256 7464FAAF3F30C8DFC33D98F51215AF86033D5F80E5E70FBDA55F916F82B3757B. lockfileVersion 3입니다." },
  { id: "r40-app03-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["flat routes and auth startup"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. actual values/routes는 복사하지 않았습니다." },
  { id: "r40-app03-http", repository: "D:/dev/my-app03", path: "src/api/Http.jsx", usedFor: ["Axios instance boundary"], evidence: "2026-07-14 read-only sanitized audit: 18 lines, 872 bytes, SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987. base/config values는 복사하지 않았습니다." },
  { id: "r40-app03-auth", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["interceptors/login/logout/refresh baseline"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. actual token/key/route/payload를 복사하지 않고 race-safe target과 observed source를 구분했습니다." },
  { id: "r40-app03-guest-api", repository: "D:/dev/my-app03", path: "src/api/GuestBook.jsx", usedFor: ["Guestbook CRUD adapter"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 365 bytes, SHA-256 42CC6DCDAFB0BA46A85307C7A762656B11FB8D3194F2DC44FBD44AF7F32D37D4. actual routes/payload는 복사하지 않았습니다." },
  { id: "r40-app03-guest-page", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["manual fetch/create-refetch/update-patch/delete-remove"], evidence: "2026-07-14 read-only sanitized audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. actual user/content/password/messages는 복사하지 않았습니다." },
  { id: "r40-app03-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["current direct auth store cleanup baseline"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. archived copy와 구분했습니다." },
  { id: "r40-app03-guest-store", repository: "D:/dev/my-app03", path: "src/store/useGuestbookStore.jsx", usedFor: ["manual server-list copy/patch/remove"], evidence: "2026-07-14 read-only sanitized audit: 21 lines, 562 bytes, SHA-256 DA1A28E1BD3D8A7632530089011576C1FC7F4BE6A75D9001BFCD04323BABF209. domain values는 복사하지 않았습니다." },
  { id: "r40-query-registry", repository: "npm registry", path: "@tanstack/react-query/latest", publicUrl: "https://registry.npmjs.org/@tanstack%2Freact-query/latest", usedFor: ["current Query target version"], evidence: "2026-07-14 registry latest 5.101.2; local apps에 설치되지 않은 target으로 기록했습니다." },
  { id: "r40-axios-registry", repository: "npm registry", path: "axios/latest", publicUrl: "https://registry.npmjs.org/axios/latest", usedFor: ["current Axios comparison"], evidence: "2026-07-14 registry latest 1.18.1; local app03 1.16.1과 분리했습니다." },
  { id: "r40-router-registry", repository: "npm registry", path: "react-router-dom/latest", publicUrl: "https://registry.npmjs.org/react-router-dom/latest", usedFor: ["current Router comparison"], evidence: "2026-07-14 registry latest 7.18.1; local 7.15.0과 분리했습니다." },
  { id: "r40-router-routing", repository: "React Router official documentation", path: "start/data/routing", publicUrl: "https://reactrouter.com/start/data/routing", usedFor: ["route objects/nesting"], evidence: "current data routing 공식 documentation입니다." },
  { id: "r40-router-loading", repository: "React Router official documentation", path: "start/data/data-loading", publicUrl: "https://reactrouter.com/start/data/data-loading", usedFor: ["route loader contract"], evidence: "current data loading 공식 documentation입니다." },
  { id: "r40-router-actions", repository: "React Router official documentation", path: "start/data/actions", publicUrl: "https://reactrouter.com/start/data/actions", usedFor: ["actions/fetchers/revalidation"], evidence: "current actions 공식 documentation입니다." },
  { id: "r40-router-pending", repository: "React Router official documentation", path: "start/data/pending-ui", publicUrl: "https://reactrouter.com/start/data/pending-ui", usedFor: ["navigation/submission pending UI"], evidence: "current pending UI 공식 documentation입니다." },
  { id: "r40-router-errors", repository: "React Router official documentation", path: "how-to/error-boundary", publicUrl: "https://reactrouter.com/how-to/error-boundary", usedFor: ["route error boundaries"], evidence: "current error boundary 공식 guidance입니다." },
  { id: "r40-router-link", repository: "React Router official documentation", path: "api/components/Link", publicUrl: "https://reactrouter.com/api/components/Link", usedFor: ["intent/render/viewport prefetch"], evidence: "current Link prefetch reference입니다." },
  { id: "r40-query-queries", repository: "TanStack Query official documentation", path: "framework/react/guides/queries", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/queries", usedFor: ["query state contract"], evidence: "current queries 공식 guide입니다." },
  { id: "r40-query-keys", repository: "TanStack Query official documentation", path: "framework/react/guides/query-keys", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys", usedFor: ["query identity"], evidence: "current query keys 공식 guide입니다." },
  { id: "r40-queryclient", repository: "TanStack Query official documentation", path: "reference/QueryClient", publicUrl: "https://tanstack.com/query/latest/docs/reference/QueryClient", usedFor: ["cache/cancel/purge/fetch operations"], evidence: "current QueryClient 공식 reference입니다." },
  { id: "r40-query-prefetch", repository: "TanStack Query official documentation", path: "framework/react/guides/prefetching", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/prefetching", usedFor: ["prefetch lifecycle"], evidence: "current prefetching 공식 guide입니다." },
  { id: "r40-query-mutations", repository: "TanStack Query official documentation", path: "framework/react/guides/mutations", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/mutations", usedFor: ["mutation lifecycle"], evidence: "current mutations 공식 guide입니다." },
  { id: "r40-query-invalidations", repository: "TanStack Query official documentation", path: "framework/react/guides/invalidations-from-mutations", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations", usedFor: ["mutation invalidation"], evidence: "current invalidations-from-mutations 공식 guide입니다." },
  { id: "r40-query-optimistic", repository: "TanStack Query official documentation", path: "framework/react/guides/optimistic-updates", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates", usedFor: ["optimistic apply/rollback"], evidence: "current optimistic updates 공식 guide입니다." },
  { id: "r40-query-cancellation", repository: "TanStack Query official documentation", path: "framework/react/guides/query-cancellation", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation", usedFor: ["AbortSignal query cancellation"], evidence: "current query cancellation 공식 guide입니다." },
  { id: "r40-query-ssr", repository: "TanStack Query official documentation", path: "framework/react/guides/ssr", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/ssr", usedFor: ["SSR request isolation/dehydration"], evidence: "current SSR 공식 guide입니다." },
  { id: "r40-query-testing", repository: "TanStack Query official documentation", path: "framework/react/guides/testing", publicUrl: "https://tanstack.com/query/latest/docs/framework/react/guides/testing", usedFor: ["isolated query tests"], evidence: "current testing 공식 guide입니다." },
  { id: "r40-axios-instance", repository: "Axios official documentation", path: "docs/instance", publicUrl: "https://axios-http.com/docs/instance", usedFor: ["preconfigured instance boundary"], evidence: "Axios instance 공식 documentation입니다." },
  { id: "r40-axios-interceptors", repository: "Axios official documentation", path: "docs/interceptors", publicUrl: "https://axios-http.com/docs/interceptors", usedFor: ["request/response interceptors"], evidence: "Axios interceptors/ejection/ordering 공식 documentation입니다." },
  { id: "r40-axios-cancellation", repository: "Axios official documentation", path: "docs/cancellation", publicUrl: "https://axios-http.com/docs/cancellation", usedFor: ["AbortController cancellation"], evidence: "Axios signal cancellation 공식 documentation입니다." },
  { id: "r40-axios-errors", repository: "Axios official documentation", path: "docs/handling_errors", publicUrl: "https://axios-http.com/docs/handling_errors", usedFor: ["AxiosError/status/redaction"], evidence: "Axios error handling 공식 documentation입니다." },
  { id: "r40-fetch-standard", repository: "WHATWG", path: "Fetch Standard", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["fetch request/response/abort algorithm"], evidence: "living Fetch Standard primary source입니다." },
  { id: "r40-rfc9110", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["methods/status/idempotency/preconditions"], evidence: "HTTP semantics standards source입니다." },
  { id: "r40-rfc9457", repository: "IETF RFC Editor", path: "RFC 9457 Problem Details for HTTP APIs", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["typed problem details"], evidence: "HTTP API problem details standards source입니다." },
  { id: "r40-owasp-auth", repository: "OWASP Cheat Sheet Series", path: "Authentication Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["authentication lifecycle"], evidence: "OWASP authentication primary guidance입니다." },
  { id: "r40-owasp-authz", repository: "OWASP Cheat Sheet Series", path: "Authorization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["server authorization"], evidence: "OWASP authorization primary guidance입니다." },
  { id: "r40-owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session rotation/logout"], evidence: "OWASP session management primary guidance입니다." },
  { id: "r40-owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site Request Forgery Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["CSRF defenses"], evidence: "OWASP CSRF prevention primary guidance입니다." },
  { id: "r40-owasp-html5", repository: "OWASP Cheat Sheet Series", path: "HTML5 Security Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", usedFor: ["browser storage safety"], evidence: "OWASP HTML5/browser storage primary guidance입니다." },
  { id: "r40-wcag-status", repository: "W3C Web Accessibility Initiative", path: "WCAG 2.2 Understanding Status Messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["accessible async status"], evidence: "W3C WAI status messages guidance입니다." },
  { id: "r40-react-hydrate", repository: "React official documentation", path: "reference/react-dom/client/hydrateRoot", publicUrl: "https://react.dev/reference/react-dom/client/hydrateRoot", usedFor: ["hydration parity"], evidence: "React hydrateRoot 공식 reference입니다." },
  { id: "r40-github-pages", repository: "GitHub Docs", path: "pages/getting-started-with-github-pages/about-github-pages", publicUrl: "https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages", usedFor: ["static GitHub Pages deployment boundary"], evidence: "GitHub Pages의 static hosting scope에 대한 official documentation입니다." },
];

const session = createExpertSession({
  inventoryId: "react-40-login-register-profile", slug: "react-40-router-network-capstone", courseId: "react", moduleId: "react-router-network", order: 10,
  title: "Router·HTTP·server state capstone",
  subtitle: "두 학습 앱의 Router·Fetch/Axios·auth·Zustand·Guestbook을 deep-link에서 mutation, logout, SSR/static deploy와 observability까지 하나의 검증 가능한 system으로 결합합니다.",
  level: "고급", estimatedMinutes: 150,
  coreQuestion: "사용자의 한 URL과 변경 의도가 Router, auth, HTTP, query cache, optimistic mutation, 오류 복구와 배포를 통과할 때 어떻게 single ownership·보안·접근성·수렴을 끝까지 보장할까요?",
  summary: "REACT 여섯 문서, my-app02 여섯 files와 my-app03 아홉 files를 read-only·sanitized 감사해 local capabilities와 current targets를 분리합니다. system ownership, deep-link route/data/error flow, loader-query identity, Fetch/Axios protocol adapter, auth epoch/single-flight/logout, server-state freshness, versioned optimistic convergence, recovery/accessibility, Guestbook end-to-end trace, SSR/static deploy와 evidence-driven release를 열한 개의 exact Node models와 production-like lab으로 완결합니다.",
  objectives: [
    "두 앱과 여섯 문서의 route/network/state/auth topology를 감사한다.", "URL·local·auth·server state의 authoritative owner를 분류한다.",
    "deep link를 match/param/auth/loader/pending/error tree로 추적한다.", "loader·component·prefetch가 같은 query options를 사용하게 한다.",
    "Fetch/Axios를 typed protocol/error/cancellation adapter로 통일한다.", "auth bootstrap·single-flight refresh·logout purge를 app-wide 조율한다.",
    "query identity/freshness/retention/prefetch budget을 운영한다.", "mutation idempotency·optimistic operation log·version conflict로 수렴시킨다.",
    "error/retry/accessibility와 Guestbook end-to-end trace를 증명한다.", "SSR/static deployment, observability, canary와 rollback evidence를 완성한다.",
  ],
  prerequisites: [{ title: "인증 인지형 query·refresh orchestration", reason: "deep-link와 server state를 합칠 때 auth unknown, 401 refresh, logout purge, prefetch와 SSR request isolation을 같은 cache/navigation 계약에 연결할 수 있어야 합니다.", sessionSlug: "react-39-auth-aware-query-orchestration" }],
  keywords: ["React Router", "Fetch", "Axios", "TanStack Query", "authentication", "server state", "optimistic transaction", "deep link", "SSR", "deployment", "observability"],
  topics,
  lab: {
    title: "Router·HTTP·server-state full journey production qualification",
    scenario: "원본 21 files를 변경하지 않고 synthetic Guestbook/Todo/Memo concepts, disposable HTTP/auth server와 production-like build에서 deep-link→auth→query→mutation→recovery→logout→deploy 전 과정을 검증합니다.",
    setup: ["Node.js 20 이상", "React·Router·TanStack Query·Axios fixture", "disposable RFC 9457/ETag/idempotency/auth/CSRF server", "deferred requests와 fake/real clock", "browser keyboard/screen-reader assertions", "two-request SSR and static preview hosts", "resource/trace/privacy scanners", "원본 21 files read-only"],
    steps: [
      "21 source hashes, two-app capability matrix와 sanitized route/network/state graph를 고정합니다.",
      "URL/local/auth/server/derived state ownership과 duplicate writers/persistence/cleanup을 감사합니다.",
      "valid/invalid/guest/error deep links에서 route match, param schema, auth, loader, pending/boundary를 실행합니다.",
      "loader/component/prefetch가 secret-free query options factory를 공유하고 cold/warm/stale request counts를 검증합니다.",
      "Fetch/Axios adapter를 status/content/schema/problem/cancel corpus와 no-secret error serialization에서 비교합니다.",
      "auth bootstrap, N concurrent 401 single-flight, bounded replay, server authz/CSRF와 logout/account switch purge를 fault injection합니다.",
      "query key/fresh/gc/refetch/prefetch/offline/SSR와 private cache retention budget을 실행합니다.",
      "create/update/delete의 idempotency, targeted invalidation, optimistic operation log, ETag/412와 response permutations를 검증합니다.",
      "Guestbook full trace의 error/retry/focus/status/final convergence와 privacy-safe correlation을 확인합니다.",
      "SSR request isolation, static deep-link/build/privacy/caching, load SLI, canary/rollback과 reconciliation runbook을 rehearsal합니다.",
    ],
    expectedResult: [
      "deep link와 client navigation이 같은 route/query identity를 사용하고 duplicate owner/request가 없습니다.",
      "auth·HTTP·query·mutation races에서도 old/private/stale 결과가 잘못 commit되지 않습니다.",
      "optimistic UI가 실패한 operation만 rollback하고 server version과 최종 수렴합니다.",
      "모든 error class가 안전하고 접근 가능한 recovery를 가지며 raw credential/PII가 artifacts에 없습니다.",
      "SSR/static production artifact와 canary/rollback이 direct route·cache·privacy·observability contract를 통과합니다.",
    ],
    cleanup: ["QueryClients/caches/mutations, Axios interceptors, requests/timers/listeners와 disposable servers/hosts를 제거합니다.", "synthetic entities, credentials, storage, ETags/idempotency records, dehydrated states, traces와 build canaries를 폐기합니다.", "offline/focus/history/multi-tab/service-worker state와 feature flags를 원복합니다.", "원본 21 files hash/status unchanged를 확인합니다."],
    extensions: ["React Router framework/streaming mode를 동일 contract로 qualification합니다.", "multi-tab/offline mutation queue와 conflict resolver를 추가합니다.", "service worker와 CDN cache를 auth/logout/deploy runbook에 통합합니다.", "SLO 기반 자동 canary rollback과 reconciliation detector를 구축합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열한 개 Node examples를 실행하고 deep link에서 release gate까지 각 model의 적용 한계를 설명하세요.", requirements: ["stdout 완전 일치", "source topology", "route flow", "loader/query", "HTTP", "auth", "freshness", "mutation", "recovery", "full trace", "deploy/release"], hints: ["Node model은 actual Router matching, browser, Query/Axios scheduler, HTTP/server authorization과 SSR/static host를 대신하지 않습니다."], expectedOutcome: "하나의 사용자 journey를 모든 owners와 evidence로 추적합니다.", solutionOutline: ["audit/owner→route/query/HTTP→auth/cache/mutation→recovery/trace→deploy/operate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Guestbook 흐름을 loader-query와 versioned optimistic mutation으로 점진 이전하세요.", requirements: ["source baseline", "query options owner", "typed adapter", "auth epoch", "targeted invalidation", "operation log/If-Match", "browser faults/a11y", "deploy/rollback"], hints: ["원본에 Query가 이미 설치됐거나 interceptor가 race-safe하다고 가정하지 마세요."], expectedOutcome: "manual Effect/store copy가 single server-state owner로 이동하고 모든 deep-link/race/recovery가 검증됩니다.", solutionOutline: ["baseline→adapter/query pilot→mutation/version→auth/router→production canary→old owner 제거입니다."] },
    { difficulty: "설계", prompt: "조직의 Router·network·server-state reference architecture와 release policy를 작성하세요.", requirements: ["ownership/state classes", "route/data/errors", "HTTP schemas/cancel", "auth/security", "query/mutation", "a11y", "SSR/deploy", "tests/SLI/runbook"], hints: ["library 이름 나열 대신 입력·상태·불변식·failure·recovery owner를 적으세요."], expectedOutcome: "새 기능도 같은 end-to-end correctness/security/accessibility/operations evidence로 출시됩니다.", solutionOutline: ["classify→route→authorize→fetch/cache→mutate/converge→render/recover→deploy/observe 순서입니다."] },
  ],
  nextSessions: ["react-41-integrated-auth-user-flow"], sources,
  sourceCoverage: {
    filesRead: 21, filesUsed: 21,
    uncoveredNotes: [
      "실제 route/base URL/storage key/token/password/user/Todo/Memo/Guestbook content와 payload를 공개 content에 복사하지 않았습니다.",
      "my-app02의 persisted UI auth를 server authority로, my-app03 manual Effect/store flow를 Query 구현으로, current interceptor를 epoch/single-flight-safe로 과장하지 않았습니다.",
      "local locked versions와 2026-07-14 registry current targets를 분리하고 archived docs와 direct current source 차이를 명시했습니다.",
      "Node models는 actual React Router, Fetch/Axios, TanStack Query, browser accessibility/security, server transaction/authorization와 SSR/static hosting을 대체하지 않으므로 production-like lab을 요구합니다.",
    ],
  },
});

export default session;
