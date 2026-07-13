import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefs = ["local-router-doc", "app2-app", "app2-navbar", "app2-index", "app2-package", "app3-app", "app3-navbar", "app3-private", "app3-index", "app3-package"];

const topics = [
  appliedTopic({
    id: "source-version-mode-audit", title: "v6 학습 문서·v7 source range·현재 mode 문서를 한 버전으로 섞지 않습니다",
    lead: "REACT router 문서는 react-router-dom v6라고 명시하고 my-app02/03 package는 ^7.15.0을 선언하지만 두 App은 BrowserRouter·Routes·Route 기반 Declarative style을 사용합니다. current official docs의 Declarative·Data·Framework modes는 이 snapshots의 provenance와 별도로 읽습니다.",
    mechanism: "local docs, package manifests, index entry, App route owners, Navbar navigation과 PrivateRoute guard를 exact line/byte/SHA로 audit했습니다. declared semver range는 lockfile의 installed exact version도, 2026-07-14 현재 최신 권고도 아닙니다.",
    workflow: "문서 표기→package declared range→installed/lock resolution→imported APIs→runtime behavior→current official API/mode 문서를 분리한 compatibility matrix로 기록하고 upgrade 판단은 target version의 migration/change notes에서 다시 검증합니다.",
    invariants: "BrowserRouter를 deprecated라고 단정하거나 createBrowserRouter가 무조건 대체한다고 쓰지 않고 source route/domain/auth/storage literals를 공개 examples와 evidence에 복사하지 않습니다.",
    edgeCases: "react-router-dom re-export, caret range resolution, stale lock/node_modules, v6 code under v7 compatibility, v8 current docs, mixed packages와 transitive duplicates를 포함합니다.",
    failureModes: "문서의 v6 표기만 보고 source도 v6라 하거나 package range만 보고 현재 최신 API라고 주장하면 mode와 실제 runtime compatibility 결론이 왜곡됩니다.",
    verification: "package/lock/npm resolution, import graph, rendered navigation, direct URL refresh, current official API behavior와 source hashes를 각각 확인합니다.",
    operations: "declared/resolved/runtime/doc versions, deprecated API warnings, mode exceptions와 audit date를 dependency dashboard와 ADR에 남깁니다.",
    concepts: [c("version provenance", "문서, manifest range, resolved artifact와 runtime 각각의 version 근거입니다.", ["서로 대체하지 않습니다.", "감사 날짜를 둡니다."]), c("Declarative mode", "BrowserRouter와 JSX Routes/Route로 URL과 elements를 연결하는 React Router mode입니다.", ["source projects가 사용하는 style입니다.", "Data/Framework와 공존합니다."]), c("Data router", "createBrowserRouter와 RouterProvider를 통해 route objects, loaders/actions와 richer router state를 제공하는 mode입니다.", ["BrowserRouter의 단순 별칭이 아닙니다.", "필요한 capability로 선택합니다."])],
    codeExamples: [node("react31-version-matrix", "router source/version provenance matrix", "React31VersionMatrix.mjs", "문서 표기, declared range, observed mode와 current docs role을 분리합니다.", String.raw`const snapshots = [
  { source: "learning-doc", version: "v6", mode: "declarative" },
  { source: "app2-manifest", version: "^7.15.0", mode: "declarative" },
  { source: "app3-manifest", version: "^7.15.0", mode: "declarative" },
  { source: "current-docs", version: "current", mode: "mode-comparison" },
];
for (const x of snapshots) console.log(x.source + "=" + x.version + "|" + x.mode);
console.log("installed-version-inferred=false");
console.log("browser-router-deprecated=false");`, "learning-doc=v6|declarative\napp2-manifest=^7.15.0|declarative\napp3-manifest=^7.15.0|declarative\ncurrent-docs=current|mode-comparison\ninstalled-version-inferred=false\nbrowser-router-deprecated=false", localRefs.concat(["router-modes", "router-v7-browser", "router-v7-create"]))],
  }),
  appliedTopic({
    id: "browser-history-router-modes", title: "BrowserRouter·createBrowserRouter와 browser History의 책임을 구분합니다",
    lead: "둘 다 browser History API 기반 client routing에 사용할 수 있지만 BrowserRouter는 Declarative router component이고 createBrowserRouter는 route objects로 Data router instance를 만들어 RouterProvider에 전달합니다.",
    mechanism: "History push/replace/pop은 URL/session history를 바꾸고 router가 location을 match해 UI와 data lifecycle을 계산합니다. server는 direct request를 먼저 받으므로 client history가 static host rewrite나 server routes를 자동 구성하지 않습니다.",
    workflow: "단순 element routing이면 Declarative를 baseline으로 두고 route loaders/actions, pending UI, error boundaries와 data APIs가 실제 필요할 때 Data, full route-module/build/server features가 필요할 때 Framework mode를 평가합니다.",
    invariants: "router instance는 Data mode에서 module scope 등 안정된 위치에 한 번 만들고 History entry와 application state authority를 섞지 않으며 back/forward를 arbitrary redirect로 덮지 않습니다.",
    edgeCases: "POP navigation, replace after login, same URL different state, reload, multiple tabs, hash/fragment, base path, scroll restoration와 SSR hydration을 포함합니다.",
    failureModes: "createBrowserRouter를 render 안에서 매번 만들면 state/listeners가 reset되고 BrowserRouter만 추가하면 deep-link server 404가 해결된다고 오해할 수 있습니다.",
    verification: "push/replace/POP, direct load, refresh, back/forward, current location/key, single router creation, host rewrite와 browser/server integration을 시험합니다.",
    operations: "navigation type, route ID, transition duration, direct-load 404, redirect loop와 history depth 이상을 payload 없이 관찰합니다.",
    concepts: [c("session history", "한 browsing context에서 방문한 documents/locations의 entry sequence입니다.", ["push/replace/POP을 구분합니다.", "application database가 아닙니다."]), c("BrowserRouter", "browser History를 사용하는 Declarative React Router component입니다.", ["JSX route tree와 함께 씁니다.", "host 설정을 대신하지 않습니다."]), c("createBrowserRouter", "browser History를 사용하는 Data router instance를 route objects로 생성하는 함수입니다.", ["RouterProvider와 연결합니다.", "loaders/actions capability를 제공합니다."])],
    codeExamples: [node("react31-mode-decision", "router mode capability decision", "React31ModeDecision.mjs", "요구 capability로 Declarative·Data·Framework 후보를 선택합니다.", String.raw`const cases = [
  { name: "simple-ui", loaders: false, routeModules: false, serverFeatures: false },
  { name: "data-lifecycle", loaders: true, routeModules: false, serverFeatures: false },
  { name: "full-route-system", loaders: true, routeModules: true, serverFeatures: true },
];
function mode(x) {
  if (x.routeModules || x.serverFeatures) return "framework";
  if (x.loaders) return "data";
  return "declarative";
}
for (const item of cases) console.log(item.name + "=" + mode(item));`, "simple-ui=declarative\ndata-lifecycle=data\nfull-route-system=framework", ["router-modes", "router-browser", "router-create", "router-provider", "html-history"])],
  }),
  appliedTopic({
    id: "route-ownership-configuration", title: "route configuration을 URL 계약·owner·element/data/error 경계의 단일 registry로 만듭니다",
    lead: "App에 path와 element만 흩어놓지 않고 stable route ID, parent, segment, index, navigation label, authorization metadata, lazy/data/error owner와 observability name을 typed registry로 정의합니다.",
    mechanism: "absolute URL은 parent segments와 child segment를 조합하고 index route는 parent URL의 default child를, pathless layout은 URL segment 없이 공통 UI를 소유합니다. route ID는 URL rename과 독립적인 telemetry/test key가 됩니다.",
    workflow: "현재 App/links/imports를 inventory하고 canonical route registry를 만든 뒤 config에서 JSX 또는 route objects를 생성하며 duplicate path/ID, orphan parent/link, missing 404와 cyclic redirects를 CI에서 검증합니다.",
    invariants: "route ID와 sibling match는 unique하고 index route는 path를 갖지 않으며 navigation이 private route internals나 raw strings를 중복 소유하지 않고 every link target이 route contract에 존재합니다.",
    edgeCases: "pathless layout, index and wildcard siblings, optional/dynamic segments, trailing slash, case sensitivity, encoded path, external links와 feature-flagged routes를 포함합니다.",
    failureModes: "Navbar와 App에 route strings를 두 번 적으면 rename 때 orphan link가 생기고 component filename을 route authority로 쓰면 code split/refactor가 URL을 뜻밖에 깨뜨립니다.",
    verification: "config schema, uniqueness, reachable graph, link-target resolution, match corpus, route IDs, redirect cycles와 snapshot/change review를 실행합니다.",
    operations: "unmatched URL, orphan route/link, redirect count/loop, route ID latency/error와 deprecated URL traffic을 관찰합니다.",
    concepts: [c("route ownership", "URL segment, rendered boundary, data/error behavior와 lifecycle을 책임지는 route 정의입니다.", ["component import와 다릅니다.", "parent/child 관계를 가집니다."]), c("route ID", "URL path가 바뀌어도 route를 안정적으로 식별하는 내부 key입니다.", ["telemetry/test에 씁니다.", "user data를 넣지 않습니다."]), c("index route", "parent URL에서 추가 path segment 없이 기본으로 render되는 child route입니다.", ["path를 갖지 않습니다.", "layout의 default content입니다."])],
    codeExamples: [node("react31-route-registry", "route registry structural validator", "React31RouteRegistry.mjs", "synthetic route tree의 ID/path/index/wildcard 불변식을 검사합니다.", String.raw`const routes = [
  { id: "root", parent: null, path: "/" },
  { id: "workspace", parent: "root", path: "workspace" },
  { id: "workspace-index", parent: "workspace", index: true },
  { id: "item", parent: "workspace", path: "items/:itemId" },
  { id: "settings", parent: "workspace", path: "settings" },
  { id: "not-found", parent: "root", path: "*" },
];
const ids = new Set(routes.map((r) => r.id));
const valid = ids.size === routes.length && routes.every((r) => r.parent === null || ids.has(r.parent)) && routes.every((r) => !r.index || !r.path);
console.log("routes=" + routes.length);
console.log("index=" + routes.filter((r) => r.index).length);
console.log("wildcard=" + routes.filter((r) => r.path === "*").length);
console.log("valid=" + valid);`, "routes=6\nindex=1\nwildcard=1\nvalid=true", ["app2-app", "app2-navbar", "app3-app", "app3-navbar", "router-route", "router-routes", "router-declarative-routing"])],
  }),
  appliedTopic({
    id: "nested-layout-outlet", title: "공통 shell은 nested layout route가 소유하고 Outlet이 child match를 배치합니다",
    lead: "Navbar를 Routes 바깥에 우연히 두는 수준에서 확장해 public/authenticated/admin 등 수명과 data/error boundary가 다른 shells를 pathless 또는 path-owning parent routes로 모델링합니다.",
    mechanism: "parent route element가 header/navigation/sidebar와 Outlet을 render하고 current child match가 Outlet 위치에 들어갑니다. child navigation은 parent shell을 보존할 수 있지만 key, route boundary와 data changes에 따라 state lifetime이 달라집니다.",
    workflow: "반복 shell과 provider/data/error owners를 찾고 root/public/private layouts를 정한 뒤 index/child paths, Outlet context 범위, focus/scroll behavior와 reset tests를 설계합니다.",
    invariants: "layout은 child content를 Outlet으로 한 번 배치하고 provider/DOM nesting이 valid하며 route change에서 보존할 shell state와 reset할 page state를 명시합니다.",
    edgeCases: "pathless nested layouts, multiple outlets가 필요한 UI, modal routes, conditional navigation, child error, loading fallback, keyed reset와 portal을 포함합니다.",
    failureModes: "각 page에 Navbar/sidebar를 복사하면 active navigation, auth state와 accessibility landmark가 drift하고 layout에 Outlet이 없으면 child URL은 match돼도 content가 보이지 않습니다.",
    verification: "match stack, Outlet placement, index child, layout persistence/reset, landmarks/headings/focus, child error/loading과 deep-link render를 시험합니다.",
    operations: "matched layout stack, missing Outlet canary, shell remount count, navigation focus/scroll와 child error containment를 관찰합니다.",
    concepts: [c("layout route", "공통 UI와 provider/data/error boundary를 소유하면서 child route를 배치하는 parent route입니다.", ["pathless일 수 있습니다.", "URL 계약과 별도입니다."]), c("Outlet", "parent route element 안에서 현재 matched child element가 render되는 자리입니다.", ["child props 통로와 다릅니다.", "없으면 child가 표시되지 않습니다."]), c("match stack", "현재 URL에 동시에 match된 root부터 leaf까지의 route chain입니다.", ["layout/data/error owners를 설명합니다.", "stable route IDs로 관찰합니다."])],
    codeExamples: [node("react31-layout-match", "nested layout match stack", "React31LayoutMatch.mjs", "synthetic URL segments를 parent/child registry에 맞춰 layout stack을 계산합니다.", String.raw`const tree = {
  id: "root", segment: "", children: [
    { id: "workspace", segment: "workspace", children: [
      { id: "item", segment: "items", children: [{ id: "item-detail", segment: ":itemId", children: [] }] },
    ] },
  ],
};
const segments = ["workspace", "items", "alpha"];
const stack = [tree.id]; let node = tree;
for (const segment of segments) {
  const next = node.children.find((x) => x.segment === segment) ?? node.children.find((x) => x.segment.startsWith(":"));
  if (!next) break; stack.push(next.id); node = next;
}
console.log("stack=" + stack.join(">"));
console.log("outlets=" + (stack.length - 1));
console.log("leaf=" + stack.at(-1));`, "stack=root>workspace>item>item-detail\noutlets=3\nleaf=item-detail", ["local-router-doc", "router-outlet", "router-data-routing"])],
  }),
  appliedTopic({
    id: "navigation-link-accessibility", title: "NavLink·Link·navigate를 의미·History·접근성 계약에 맞게 선택합니다",
    lead: "사용자가 이동을 시작하는 navigation은 Link/NavLink를 기본으로 두고 active/pending state와 accessible name을 제공하며 submit success, timeout, logout처럼 event 결과의 imperative 이동만 navigate로 제한합니다.",
    mechanism: "Link는 anchor semantics와 client navigation을 결합하고 NavLink는 active/pending state를 노출합니다. navigate의 push/replace와 numeric history movement는 user expectation과 back behavior를 바꿉니다.",
    workflow: "navigation inventory에서 anchor/button 역할, label, active state, new tab/external URL, keyboard/focus, replace policy와 redirect owner를 검토하고 route registry의 typed target을 사용합니다.",
    invariants: "navigation 목적은 context에서 이해 가능하고 current page는 시각/semantic으로 표시하며 button onClick으로 링크를 흉내 내지 않고 외부/user-supplied redirect를 strict allowlist 없이 실행하지 않습니다.",
    edgeCases: "icon-only links, disabled-looking link, modified click, external origin, download, same-page fragment, pending transition, failed submit와 back after sign-in을 포함합니다.",
    failureModes: "모든 이동을 useNavigate button으로 구현하면 open-in-new-tab, copy-link와 anchor semantics를 잃고 active class만 시각적으로 바꾸면 assistive technology가 current page를 모릅니다.",
    verification: "role/name/current, keyboard and modified click, back/forward, replace/push, focus destination, external/open-redirect negatives와 browser integration을 실행합니다.",
    operations: "route-link success, abandon/duplicate navigation, redirect reason/loop, focus outcome와 accessibility audit를 route ID로 관찰합니다.",
    concepts: [c("declarative navigation", "렌더된 Link/NavLink가 목적 URL과 의미를 미리 표현하는 이동입니다.", ["사용자 시작 이동의 기본입니다.", "anchor 기능을 보존합니다."]), c("imperative navigation", "event/effect의 검증된 결과로 코드가 navigate를 호출하는 이동입니다.", ["사용 범위를 좁힙니다.", "push/replace를 명시합니다."]), c("current-page semantics", "현재 destination임을 시각 표시와 aria-current 등으로 함께 전달하는 계약입니다.", ["색만 의존하지 않습니다.", "NavLink state와 연결합니다."])],
  }),
  appliedTopic({
    id: "not-found-error-boundaries", title: "unmatched 404와 matched route의 render/data error를 다른 복구 경계로 처리합니다",
    lead: "path가 하나도 match되지 않는 404 route와 match는 됐지만 loader/action/render에서 실패한 error boundary를 구분해 status, message, retry/navigation과 telemetry reason을 정확히 만듭니다.",
    mechanism: "wildcard/splat route는 unmatched locations를 잡고 route error boundary는 matched subtree의 thrown response/error를 containment합니다. client fallback UI와 server HTTP status는 hosting/runtime mode에 맞춰 별도 검증합니다.",
    workflow: "known/unmatched/malformed/unauthorized/error corpus를 만들고 nearest boundary, HTTP status, user-safe copy, focus, recovery action와 error reporting owner를 route tree에 배치합니다.",
    invariants: "unknown path를 home으로 조용히 redirect하지 않고 sensitive stack/payload를 노출하지 않으며 retry가 non-idempotent action을 중복 실행하지 않습니다.",
    edgeCases: "nested splat, malformed encoding, chunk load failure, loader 404/403/500, offline, boundary itself throws, direct static-host request와 SSR stream error를 포함합니다.",
    failureModes: "wildcard route 하나로 모든 exceptions를 404라 부르면 운영 원인과 HTTP semantics가 왜곡되고 global boundary만 두면 전체 shell이 사라집니다.",
    verification: "route-match corpus, nearest-boundary containment, status/readback, safe message, focus/retry, direct load and server logs를 확인합니다.",
    operations: "unmatched route, loader/action/render/chunk reasons, boundary depth, recovery success와 unknown URL cardinality를 normalized template로 관찰합니다.",
    concepts: [c("unmatched route", "현재 location에 대응하는 route branch가 없는 navigation 결과입니다.", ["wildcard/404가 처리합니다.", "runtime exception과 다릅니다."]), c("route error boundary", "matched route subtree의 data/render failure를 가장 가까운 owner에서 containment하는 경계입니다.", ["safe recovery UI를 냅니다.", "404와 구분합니다."]), c("splat route", "남은 path segments를 wildcard로 match하는 route입니다.", ["404 fallback에 쓸 수 있습니다.", "구체 route와 우선순위를 시험합니다."])],
    codeExamples: [node("react31-error-classifier", "route miss versus execution error classifier", "React31ErrorClassifier.mjs", "match 여부와 failure phase로 404/data/render outcomes를 구분합니다.", String.raw`const cases = [
  { name: "unknown", matched: false, phase: null },
  { name: "missing-record", matched: true, phase: "loader", status: 404 },
  { name: "server-fault", matched: true, phase: "loader", status: 500 },
  { name: "render-fault", matched: true, phase: "render" },
];
function outcome(x) {
  if (!x.matched) return "route-not-found";
  if (x.phase === "render") return "render-boundary";
  return "data-" + x.status;
}
for (const item of cases) console.log(item.name + "=" + outcome(item));`, "unknown=route-not-found\nmissing-record=data-404\nserver-fault=data-500\nrender-fault=render-boundary", ["router-error-boundary", "router-route", "router-data-routing"])],
  }),
  appliedTopic({
    id: "auth-route-authorization", title: "PrivateRoute는 client UX guard이고 authorization authority는 server에 둡니다",
    lead: "my-app03의 wrapper/Navigate pattern은 비로그인 사용자의 UI flow를 안내하지만 browser state나 route hiding은 protected data/action 권한을 보장하지 않으므로 server가 every request에서 authentication과 authorization을 검증해야 합니다.",
    mechanism: "client guard는 auth status loading/authenticated/anonymous와 intended destination을 모델링하고 anonymous를 safe internal sign-in route로 replace할 수 있습니다. Data/Framework modes에서는 route data boundary에서 redirect를 결정할 수도 있지만 server API authorization은 여전히 독립적입니다.",
    workflow: "public/authenticated/role/resource ownership matrix를 작성하고 hydration loading, session expiry, deep link, safe return target, server 401/403, cache purge와 post-login navigation을 end-to-end로 시험합니다.",
    invariants: "token-like browser value 존재만으로 권한을 부여하지 않고 user-supplied return URL은 same-origin allowlist하며 unauthorized cached data를 render하지 않고 server denial을 client가 override하지 않습니다.",
    edgeCases: "auth unknown during hydration, expired/revoked session, permission downgrade, shared device, multiple tabs, back button, open redirect와 redirect loop를 포함합니다.",
    failureModes: "Navbar에서 link를 숨기거나 PrivateRoute children을 막는 것만으로 보안을 주장하면 direct API calls와 cached/private content 노출을 차단하지 못합니다.",
    verification: "anonymous/loading/authenticated/expired/forbidden matrix, direct API request, deep link, open redirect corpus, cache/storage purge, focus와 back history를 실행합니다.",
    operations: "guard decision, server 401/403, redirect reason/loop, session expiry recovery와 unauthorized data canary를 payload 없이 관찰합니다.",
    concepts: [c("client route guard", "인증 상태에 따라 client UI navigation/render를 안내하는 경계입니다.", ["UX 기능입니다.", "server authorization이 아닙니다."]), c("authorization authority", "특정 identity가 resource/action을 수행할 수 있는지 최종 결정하는 trusted server 경계입니다.", ["every request에서 검증합니다.", "client flag를 신뢰하지 않습니다."]), c("safe return target", "인증 후 돌아갈 수 있도록 검증·정규화한 same-origin internal destination입니다.", ["open redirect를 막습니다.", "route ID로 제한할 수 있습니다."])],
    codeExamples: [node("react31-auth-decision", "client guard and server authority matrix", "React31AuthDecision.mjs", "auth lifecycle의 client action과 server check requirement를 분리합니다.", String.raw`const states = ["loading", "anonymous", "authenticated", "expired"];
for (const state of states) {
  const client = state === "loading" ? "pending-ui" : state === "authenticated" ? "render" : "redirect-internal";
  const server = state === "authenticated" ? "authorize-request" : "deny-protected";
  console.log(state + "=" + client + "|" + server);
}
console.log("browser-state-authority=false");`, "loading=pending-ui|deny-protected\nanonymous=redirect-internal|deny-protected\nauthenticated=render|authorize-request\nexpired=redirect-internal|deny-protected\nbrowser-state-authority=false", ["app3-private", "app3-app", "app3-navbar", "router-navigate", "router-use-navigate"])],
  }),
  appliedTopic({
    id: "basename-static-hosting-deploy", title: "basename와 static-host rewrite를 서로 다른 deployment 계약으로 검증합니다",
    lead: "subdirectory deployment에서 basename은 router가 app URL prefix를 해석·생성하게 하고, SPA rewrite는 host가 direct requests를 entry HTML로 보내게 합니다. 하나를 설정했다고 다른 문제가 자동 해결되지 않습니다.",
    mechanism: "BrowserRouter/createBrowserRouter의 basename은 link/match URL에 base를 적용합니다. static host는 asset request를 제외한 valid app URLs를 index document로 rewrite해야 하며 unsupported host에서는 hash routing 또는 pre-render/server route 같은 다른 architecture를 명시적으로 선택합니다.",
    workflow: "public origin/base, asset base, route URLs와 host rules를 deployment manifest에 고정하고 root/subpath, link click/direct load/refresh, 404, assets, cache headers와 rollback build를 production-like preview에서 시험합니다.",
    invariants: "base는 leading slash와 canonical trailing policy를 따르고 URL을 string concatenate하지 않으며 rewrite가 API/assets/real 404를 index HTML로 잘못 덮지 않습니다.",
    edgeCases: "encoded base, trailing slash, case-sensitive host, CDN cache, service worker, custom domain, old asset chunk, multiple SPAs와 GitHub Pages-like constraints를 포함합니다.",
    failureModes: "basename만 추가하면 link click은 되지만 direct refresh가 server 404이고 모든 요청 rewrite는 missing JS/CSS에도 HTML을 반환해 MIME/chunk errors를 만듭니다.",
    verification: "root/subpath matrix, generated href, direct curl/browser request, refresh/back, asset content type/hash, host rule, real 404와 cache invalidation을 확인합니다.",
    operations: "direct-load 404, HTML-for-asset, base mismatch, chunk failure, CDN cache age와 deployment rollback success를 관찰합니다.",
    concepts: [c("basename", "router가 application routes 앞에 적용하는 deployment URL prefix입니다.", ["host rewrite가 아닙니다.", "links/matches와 일관돼야 합니다."]), c("SPA rewrite", "static host가 app route direct request를 entry HTML로 보내 client router가 처리하게 하는 규칙입니다.", ["assets/API를 제외합니다.", "HTTP 404 정책을 검토합니다."]), c("hash routing", "URL fragment 뒤 path를 client가 관리해 server request path를 고정하는 전략입니다.", ["host 제약의 선택지입니다.", "URL/SEO/tracking trade-off가 있습니다."])],
    codeExamples: [node("react31-deploy-contract", "basename and host rewrite validator", "React31DeployContract.mjs", "synthetic root/subpath URLs에서 route href와 host response contract를 검사합니다.", String.raw`const base = "/academy";
const requests = [
  { path: "/academy/workspace", kind: "route" },
  { path: "/academy/assets/app.js", kind: "asset" },
  { path: "/academy/missing.png", kind: "missing-asset" },
];
for (const req of requests) {
  const result = req.kind === "route" ? "entry-html" : req.kind === "asset" ? "javascript" : "404";
  console.log(req.path + "=" + result);
}
console.log("href=" + base + "/workspace");
console.log("basename-equals-rewrite=false");`, "/academy/workspace=entry-html\n/academy/assets/app.js=javascript\n/academy/missing.png=404\nhref=/academy/workspace\nbasename-equals-rewrite=false", ["app2-index", "app2-package", "app3-index", "app3-package", "router-browser", "router-spa", "router-deploying", "url-standard"])],
  }),
  appliedTopic({
    id: "route-data-code-splitting-hydration", title: "route boundary를 data loading·code splitting·SSR/hydration의 delivery unit으로 설계합니다",
    lead: "페이지 수가 늘 때 모든 element와 data를 root App에서 eager import/fetch하지 않고 route별 lazy chunk, loader/query prefetch, pending/error boundary와 SSR-safe initialization을 실제 runtime mode에 맞춰 배치합니다.",
    mechanism: "React lazy/Suspense는 component code loading을 다루고 Data/Framework router는 route discovery/data lifecycle과 pending/error capabilities를 더할 수 있습니다. declarative app도 lazy components를 쓸 수 있지만 loader APIs를 쓴다고 자동 SSR이 생기지는 않습니다.",
    workflow: "critical route budget, chunk graph, data dependency/waterfall, prefetch intent, fallback, error/retry와 hydration parity를 측정하고 target browser/network/host에서 initial/deep-link navigations를 qualification합니다.",
    invariants: "lazy import promise는 stable하고 fallback이 accessible하며 code/data error를 구분하고 server/client initial route tree와 snapshots가 일치하며 private data를 public preload에 넣지 않습니다.",
    edgeCases: "chunk 404 after deploy, offline cached shell, slow data/fast code, fast data/slow code, aborted navigation, hover prefetch abuse, SSR browser-only API와 streaming error를 포함합니다.",
    failureModes: "route마다 lazy만 붙이고 measurement를 생략하면 tiny chunks/request overhead와 fallback flash가 늘고 root effect fetch는 code split 뒤에도 data waterfall을 유지합니다.",
    verification: "bundle/chunk map, cold/warm navigation, slow/offline/chunk error, abort, prefetch budget, SSR/hydration warnings와 accessibility를 실행합니다.",
    operations: "route chunk bytes/load/error/cache hit, data waterfall/p95, aborted work, hydration mismatch와 fallback duration을 route ID로 관찰합니다.",
    concepts: [c("route delivery unit", "특정 route의 code, data, pending/error UI와 observability를 함께 qualification하는 배포 단위입니다.", ["route ID로 추적합니다.", "mode별 capability를 구분합니다."]), c("navigation waterfall", "route transition에서 code와 data requests가 불필요하게 순차 시작되는 지연 구조입니다.", ["parallel/prefetch를 검토합니다.", "network evidence가 필요합니다."]), c("hydration parity", "server-generated UI/snapshot과 client initial render가 같은 route/data contract를 갖는 조건입니다.", ["browser-only reads를 격리합니다.", "external state도 포함합니다."])],
  }),
  appliedTopic({
    id: "router-testing-observability", title: "memory/browser/server matrices로 match·navigation·layout·deploy를 계층 검증합니다",
    lead: "Link click 한 번의 component test에 그치지 않고 pure route registry, memory router, accessible component, real browser History, direct server requests와 production-like deploy preview를 각각의 oracle로 사용합니다.",
    mechanism: "pure tests는 registry graph, memory integration은 entries/params/errors, component tests는 role/name/current/focus, browser tests는 History/scroll/reload, server tests는 status/rewrite/assets, SSR tests는 hydration을 증명합니다.",
    workflow: "route requirement→normal/deep/unmatched/auth/error/base corpus→fastest trustworthy layer→cleanup/artifact→traceability를 작성하고 current route ID와 normalized template로 telemetry를 연결합니다.",
    invariants: "tests가 production route strings를 중복 정의하지 않고 arbitrary sleeps나 global history를 leak하지 않으며 private URL/query values와 screenshots를 redaction합니다.",
    edgeCases: "initialEntries index, encoded params, back/forward, replace, multiple tabs, base path, route lazy failure, browser bfcache와 canceled navigation을 포함합니다.",
    failureModes: "MemoryRouter green만으로 static host refresh를 증명하거나 mocked navigate call만 assert하면 actual History, link semantics, route matching과 focus를 놓칩니다.",
    verification: "registry property tests, memory match stack, accessible user flow, browser direct load/back, host curl/assets/status, SSR parity와 cleanup baseline을 실행합니다.",
    operations: "unmatched/redirect/error by route ID, navigation p95, direct-load success, focus/scroll outcome, test first-pass rate와 deploy synthetic probes를 운영합니다.",
    concepts: [c("memory router", "실제 browser URL 대신 in-memory history entries로 route behavior를 시험하는 router입니다.", ["빠른 integration에 적합합니다.", "host/browser test를 대체하지 않습니다."]), c("deep-link test", "root navigation 없이 nested application URL을 직접 열어 route, data, layout과 host contract를 검증하는 test입니다.", ["refresh와 함께 봅니다.", "배포 전 필수입니다."]), c("route template telemetry", "실제 parameter 값 대신 stable route ID/template로 navigation을 관찰하는 방식입니다.", ["cardinality와 privacy를 통제합니다.", "unknown path를 normalize합니다."])],
  }),
  appliedTopic({
    id: "incremental-router-migration-release", title: "route registry·nested layout·Data mode를 compatibility window로 점진 migration합니다",
    lead: "기존 App JSX routes를 한 번에 교체하지 않고 route contract registry를 먼저 도입해 current URLs를 보존하고 link generation, layouts, 404/error, deployment와 필요 capability만 단계적으로 이동합니다.",
    mechanism: "old/new configs를 같은 URL corpus에 differential match하고 legacy URL aliases/redirects, stable route IDs와 canary entry를 유지합니다. Declarative에서 Data mode 전환은 target capability가 필요할 때 adapter와 per-route waves로 수행합니다.",
    workflow: "source freeze→route registry→link adapters→layout nesting→404/errors→base/host qualification→optional Data router canary→old config cleanup 순으로 parity, redirect and rollback gates를 둡니다.",
    invariants: "published URLs와 bookmarks를 compatibility decision 없이 깨지 않고 redirect chain은 bounded하며 auth/server authorization과 data cache isolation을 migration 동안 유지합니다.",
    edgeCases: "old deep links, external referrers, service worker cache, mixed deploy, lazy old chunk, back after redirect, partial host rollout와 rollback after new URLs를 포함합니다.",
    failureModes: "path rename, nested layout와 router mode를 한 commit에서 바꾸면 404, state reset와 data errors의 root cause를 분리하기 어렵고 rollback이 new bookmarks를 잃습니다.",
    verification: "old/new route corpus differential, link crawler, redirects/status, direct deep links, auth/errors, base deploy, canary metrics, rollback and source hash readback을 실행합니다.",
    operations: "legacy URL traffic, redirect chain/loop, parity mismatch, canary error/p95, direct-load status, rollback time와 cleanup readiness를 관찰합니다.",
    concepts: [c("route compatibility window", "old/new URL contracts와 configs를 함께 지원해 bookmarks와 rollback을 보호하는 기간입니다.", ["telemetry로 종료합니다.", "redirect policy를 포함합니다."]), c("differential match", "같은 URL corpus를 old/new router에 적용해 matched route IDs, params와 outcomes를 비교하는 검증입니다.", ["representation 차이를 canonicalize합니다.", "unknown/error도 포함합니다."]), c("router cutover", "navigation/match/data authority를 old config에서 new router instance로 옮기는 통제된 전환입니다.", ["배포와 구분합니다.", "rollback gate가 필요합니다."])],
    codeExamples: [node("react31-release-gate", "router migration release evaluator", "React31ReleaseGate.mjs", "URL parity, 404, direct load, accessibility, auth와 rollback evidence를 판정합니다.", String.raw`const evidence = {
  urlParity: 100, redirectLoops: 0, directLoad: 100,
  wildcard: true, focusPass: true, serverAuth: true, rollbackMinutes: 8,
};
const gates = {
  routes: evidence.urlParity === 100 && evidence.redirectLoops === 0,
  hosting: evidence.directLoad === 100,
  recovery: evidence.wildcard && evidence.rollbackMinutes <= 10,
  accessibility: evidence.focusPass,
  security: evidence.serverAuth,
};
for (const [name, pass] of Object.entries(gates)) console.log(name + "=" + pass);
console.log("release=" + (Object.values(gates).every(Boolean) ? "pass" : "block"));`, "routes=true\nhosting=true\nrecovery=true\naccessibility=true\nsecurity=true\nrelease=pass", ["router-modes", "router-spa", "router-error-boundary", "wcag-link-purpose", "wcag-focus-order", "react-lazy", "react-suspense"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-router-doc", repository: "D:/dev/REACT", path: "docs/react/08-router.md", usedFor: ["v6-labelled learning snapshot", "BrowserRouter/Routes/Route/Link/useNavigate", "static-host note"], evidence: "2026-07-14 read-only sanitized audit: 107 lines, 5,551 bytes, SHA-256 5D1D686C17CD50FF6FF7ADFD5AD41DA9715DB9C8674059523378422DED643541. Embedded route/domain/demo literals were not copied." },
  { id: "app2-app", repository: "D:/dev/my-app02", path: "src/App.js", usedFor: ["Declarative BrowserRouter owner", "five route definitions"], evidence: "2026-07-14 read-only sanitized audit: 30 lines, 880 bytes, SHA-256 5FF7DE7AFDC11D4413421A26FE137A064A382FC0ECDA21C5C6AB48B934665150. Source has five path routes and no observed index/wildcard; route literals were not copied." },
  { id: "app2-navbar", repository: "D:/dev/my-app02", path: "src/components/Navbar.jsx", usedFor: ["NavLink owners and conditional navigation"], evidence: "2026-07-14 read-only sanitized audit: 32 lines, 1,439 bytes, SHA-256 D29B5E26C4D63428A85C06076EA9A0C15B651DBBEEAB0679817D57E6660C5C38. Five source link destinations/labels were not copied." },
  { id: "app2-index", repository: "D:/dev/my-app02", path: "src/index.js", usedFor: ["React root/router placement context"], evidence: "2026-07-14 read-only audit: 17 lines, 535 bytes, SHA-256 39F6891BEBCE856CE604EA450F08ACE26FA1B931415985881FBB323F63BA26FB." },
  { id: "app2-package", repository: "D:/dev/my-app02", path: "package.json", usedFor: ["declared React Router/React source ranges", "build/deploy context"], evidence: "2026-07-14 read-only audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. It declares react-router-dom ^7.15.0; this is not an installed exact or current-latest claim." },
  { id: "app3-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["Declarative BrowserRouter owner", "seven route definitions", "client guard composition"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. Source has seven path routes and no observed index/wildcard; route literals were not copied." },
  { id: "app3-navbar", repository: "D:/dev/my-app03", path: "src/components/Navbar.jsx", usedFor: ["NavLink/useNavigate owners", "conditional links"], evidence: "2026-07-14 read-only sanitized audit: 51 lines, 2,138 bytes, SHA-256 5785D2A37FDDD6A0EF397F92460A2CE9958F0719211CFFC1E69992C880806880. Seven source destinations/labels and domain values were not copied." },
  { id: "app3-private", repository: "D:/dev/my-app03", path: "src/components/PrivateRoute.jsx", usedFor: ["client Navigate guard", "authorization-boundary critique"], evidence: "2026-07-14 read-only sanitized audit: 20 lines, 846 bytes, SHA-256 93EC890BE94F8E25E7C715893EC043C01B9064B9E037F4FC60632EF60CFEAF8C. Storage/auth/route literals were not copied; this file is not treated as server authorization." },
  { id: "app3-index", repository: "D:/dev/my-app03", path: "src/index.js", usedFor: ["React root/router placement context"], evidence: "2026-07-14 read-only audit: 17 lines, 552 bytes, SHA-256 10943746C5E810A957D9983E74B9C27E40A819C256AF8B3592FEB1972944E439." },
  { id: "app3-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["declared React Router/React source ranges", "build/deploy context"], evidence: "2026-07-14 read-only audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. It declares react-router-dom ^7.15.0; this is not an installed exact or current-latest claim." },
  { id: "router-modes", repository: "React Router official documentation", path: "start/modes", publicUrl: "https://reactrouter.com/start/modes", usedFor: ["current Declarative/Data/Framework mode distinctions"], evidence: "2026-07-14 current React Router mode-selection documentation입니다." },
  { id: "router-declarative-routing", repository: "React Router official documentation", path: "start/declarative/routing", publicUrl: "https://reactrouter.com/start/declarative/routing", usedFor: ["Declarative Routes/Route configuration"], evidence: "React Router 공식 Declarative routing guidance입니다." },
  { id: "router-data-routing", repository: "React Router official documentation", path: "start/data/routing", publicUrl: "https://reactrouter.com/start/data/routing", usedFor: ["Data route objects, nested/index routes"], evidence: "React Router 공식 Data routing guidance입니다." },
  { id: "router-browser", repository: "React Router official API", path: "api/declarative-routers/BrowserRouter", publicUrl: "https://reactrouter.com/api/declarative-routers/BrowserRouter", usedFor: ["current BrowserRouter contract and basename"], evidence: "React Router 공식 current BrowserRouter API입니다." },
  { id: "router-create", repository: "React Router official API", path: "api/data-routers/createBrowserRouter", publicUrl: "https://reactrouter.com/api/data-routers/createBrowserRouter", usedFor: ["current createBrowserRouter contract"], evidence: "React Router 공식 current Data router API입니다." },
  { id: "router-provider", repository: "React Router official API", path: "api/data-routers/RouterProvider", publicUrl: "https://reactrouter.com/api/data-routers/RouterProvider", usedFor: ["Data router rendering boundary"], evidence: "React Router 공식 RouterProvider API입니다." },
  { id: "router-v7-browser", repository: "React Router v7 API archive", path: "functions/react-router.BrowserRouter.html", publicUrl: "https://api.reactrouter.com/v7/functions/react-router.BrowserRouter.html", usedFor: ["source-declared v7 BrowserRouter interpretation"], evidence: "v7 API archive의 Declarative BrowserRouter contract이며 current docs와 source snapshot을 연결할 때만 사용합니다." },
  { id: "router-v7-create", repository: "React Router v7 API archive", path: "functions/react-router.createBrowserRouter.html", publicUrl: "https://api.reactrouter.com/v7/functions/react-router.createBrowserRouter.html", usedFor: ["source-declared v7 createBrowserRouter interpretation"], evidence: "v7 API archive의 Data router creation contract이며 current-latest claim으로 사용하지 않습니다." },
  { id: "router-routes", repository: "React Router official API", path: "api/components/Routes", publicUrl: "https://reactrouter.com/api/components/Routes", usedFor: ["Declarative route matching boundary"], evidence: "React Router 공식 Routes API입니다." },
  { id: "router-route", repository: "React Router official API", path: "api/components/Route", publicUrl: "https://reactrouter.com/api/components/Route", usedFor: ["route/index/layout definitions"], evidence: "React Router 공식 Route API입니다." },
  { id: "router-outlet", repository: "React Router official API", path: "api/components/Outlet", publicUrl: "https://reactrouter.com/api/components/Outlet", usedFor: ["nested layout child placement"], evidence: "React Router 공식 Outlet API입니다." },
  { id: "router-navigate", repository: "React Router official API", path: "api/components/Navigate", publicUrl: "https://reactrouter.com/api/components/Navigate", usedFor: ["component redirect behavior"], evidence: "React Router 공식 Navigate API입니다." },
  { id: "router-use-navigate", repository: "React Router official API", path: "api/hooks/useNavigate", publicUrl: "https://reactrouter.com/api/hooks/useNavigate", usedFor: ["imperative navigation semantics"], evidence: "React Router 공식 useNavigate API입니다." },
  { id: "router-error-boundary", repository: "React Router official documentation", path: "how-to/error-boundary", publicUrl: "https://reactrouter.com/how-to/error-boundary", usedFor: ["route error containment"], evidence: "React Router 공식 error-boundary guidance입니다." },
  { id: "router-spa", repository: "React Router official documentation", path: "how-to/spa", publicUrl: "https://reactrouter.com/how-to/spa", usedFor: ["SPA direct-all-URLs-to-entry requirement"], evidence: "React Router 공식 SPA guidance이며 static host가 application URLs를 entry HTML로 보내야 함을 설명합니다." },
  { id: "router-deploying", repository: "React Router official documentation", path: "start/framework/deploying", publicUrl: "https://reactrouter.com/start/framework/deploying", usedFor: ["static/fullstack deployment distinctions"], evidence: "React Router 공식 deployment guidance입니다." },
  { id: "html-history", repository: "WHATWG HTML Standard", path: "nav-history-apis.html#the-history-interface", publicUrl: "https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-history-interface", usedFor: ["browser session History semantics"], evidence: "WHATWG HTML navigation/history standard입니다." },
  { id: "url-standard", repository: "WHATWG URL Standard", path: "", publicUrl: "https://url.spec.whatwg.org/", usedFor: ["URL parsing/base/encoding contract"], evidence: "WHATWG URL standard입니다." },
  { id: "wcag-link-purpose", repository: "W3C WAI WCAG 2.2 Understanding", path: "link-purpose-in-context", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html", usedFor: ["navigation purpose accessibility"], evidence: "W3C WCAG 2.2 link-purpose guidance입니다." },
  { id: "wcag-focus-order", repository: "W3C WAI WCAG 2.2 Understanding", path: "focus-order", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html", usedFor: ["route transition focus order"], evidence: "W3C WCAG 2.2 focus-order guidance입니다." },
  { id: "react-lazy", repository: "React official API", path: "reference/react/lazy", publicUrl: "https://react.dev/reference/react/lazy", usedFor: ["component code splitting"], evidence: "React 공식 lazy API입니다." },
  { id: "react-suspense", repository: "React official API", path: "reference/react/Suspense", publicUrl: "https://react.dev/reference/react/Suspense", usedFor: ["loading fallback boundary"], evidence: "React 공식 Suspense API입니다." },
];

const session = createExpertSession({
  inventoryId: "react-31-router-configuration-layout", slug: "react-31-router-configuration-layout", courseId: "react", moduleId: "react-router-network", order: 1,
  title: "Router 구성·layout과 route ownership", subtitle: "버전·mode를 분리해 읽고 route registry, nested layouts, 404/errors, auth guard, base/static hosting과 migration까지 URL 계약으로 운영합니다.",
  level: "중급", estimatedMinutes: 120,
  coreQuestion: "BrowserRouter 기반 학습 앱을 어떻게 URL·layout·data/error·navigation·deployment owner가 명확하고 deep link, 404, auth, 접근성, upgrade와 rollback까지 검증 가능한 router architecture로 확장할까요?",
  summary: "REACT v6-labelled router 문서와 my-app02/03의 App, Navbar, index, package 및 PrivateRoute 10 files를 exact line/byte/SHA로 sanitized audit했습니다. 두 projects는 react-router-dom ^7.15.0을 선언하고 BrowserRouter/Routes/Route Declarative style을 사용하지만 index/wildcard/Outlet은 관찰되지 않았습니다. 이를 current React Router Declarative/Data/Framework mode docs와 v7 API archive를 구분해 해석하고 typed route registry, nested layouts/Outlet, accessible navigation, unmatched 404 versus route errors, client guard versus server authorization, basename versus SPA rewrite, code/data delivery, layered tests와 incremental migration을 일곱 executable models로 확장합니다.",
  objectives: ["문서/manifest/resolved/current version 근거를 구분한다.", "BrowserRouter와 createBrowserRouter의 mode/history 책임을 설명한다.", "route registry와 stable IDs를 설계한다.", "nested layout/index/Outlet state lifetime을 구현한다.", "Link/NavLink/navigate의 접근성·History 계약을 적용한다.", "404와 route data/render errors를 분리한다.", "client guard와 server authorization을 구분한다.", "basename와 static-host rewrite를 검증한다.", "route code/data/hydration delivery를 qualification한다.", "router migration과 rollback evidence gate를 운영한다."],
  prerequisites: [{ title: "상태 관리·복구 가능성 capstone", reason: "route change가 local/shared/server state lifetime, account isolation, async cancellation과 recovery UX를 바꾸므로 state ownership과 복구 불변식을 먼저 이해해야 합니다.", sessionSlug: "react-30-state-management-capstone" }],
  keywords: ["React Router", "BrowserRouter", "createBrowserRouter", "RouterProvider", "route ownership", "nested layout", "Outlet", "404", "basename", "SPA rewrite", "authorization", "deep link"],
  topics,
  lab: { title: "my-app02/03 router를 nested, deployable, recoverable route system으로 qualification하기", scenario: "원본 files와 route literals는 변경·복사하지 않고 synthetic registry에서 current Declarative behavior를 재현한 뒤 layouts, 404/errors, auth, subpath hosting과 optional Data mode migration을 검증합니다.", setup: ["Node.js 20 이상", "source-compatible React Router runtime", "memory and real browser test harnesses", "disposable static host/rewrite preview", "synthetic routes and auth/data adapters", "accessibility and network throttling tools", "10 local source fingerprints", "current official docs plus v7 API archive"], steps: ["문서 v6, package ^7.15.0, observed Declarative APIs와 current modes를 matrix로 기록합니다.", "App/Navbar에서 route/link owners를 synthetic canonical registry로 옮깁니다.", "duplicate IDs/paths, orphan links, missing index/wildcard와 redirect cycles를 검증합니다.", "root/workspace layouts, index children와 Outlet match stack을 구현합니다.", "Link/NavLink/navigate의 role/name/current, push/replace/back와 focus를 시험합니다.", "unmatched route, loader 404/500, render/chunk errors와 nearest boundaries를 분리합니다.", "auth loading/anonymous/authenticated/expired, safe return target와 server authorization을 검증합니다.", "root/subpath basename, direct load/refresh, SPA rewrite, assets와 real 404를 preview host에서 실행합니다.", "lazy code/data waterfall, abort, chunk failure와 hydration parity를 측정합니다.", "pure/memory/component/browser/server test traceability와 privacy-safe telemetry를 연결합니다.", "old/new URL corpus differential, canary and rollback gate를 통과한 뒤 cleanup을 승인합니다.", "원본 10 files hash/git status unchanged를 재확인합니다."], expectedResult: ["version/mode claims가 source snapshot과 current docs provenance로 분리됩니다.", "route ID, parent/index/wildcard/link targets와 layout ownership이 단일 registry에서 검증됩니다.", "deep link, back/forward, 404/errors와 auth expiry가 접근 가능한 recovery UX를 만듭니다.", "root/subpath에서 basename와 host rewrite/assets/status가 각각 올바르게 동작합니다.", "optional router-mode migration이 published URLs와 server authorization을 보존하며 rollback 가능합니다."], cleanup: ["memory/browser routers, listeners, DOM roots, requests, static preview server와 auth/data adapters를 종료합니다.", "synthetic routes, histories, caches, chunks, screenshots/traces와 test identities를 폐기합니다.", "host rewrite/base flags, clocks, network throttles와 browser storage를 원복합니다.", "원본 10 files fingerprints와 git status unchanged를 확인합니다."], extensions: ["다음 세션에서 params/search/URL state schemas와 canonicalization을 깊게 다룹니다.", "Data loaders/actions/fetchers와 query cache integration을 actual app에 적용합니다.", "Framework route modules, SSR/streaming/pre-render와 security headers를 확장합니다.", "route registry에서 sitemap, breadcrumbs, typed links와 observability config를 생성합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node models를 실행하고 version→mode→registry→layout→error/auth→deploy→release chain을 설명하세요.", requirements: ["stdout 완전 일치", "version provenance", "mode decision", "route invariants", "match stack", "404/error distinction", "server auth", "basename/rewrite", "release gates"], hints: ["Node match model을 실제 React Router ranking, browser History, server rewrite나 authorization 증거로 과장하지 마세요."], expectedOutcome: "각 model의 contract와 actual integration 검증 범위를 구분합니다.", solutionOutline: ["audit→configure→nest→navigate/recover→deploy→migrate 순서입니다."] },
    { difficulty: "응용", prompt: "synthetic app을 nested layout, 404/error, auth와 subpath deployment가 있는 router로 구현하세요.", requirements: ["route registry", "index/Outlet", "NavLink semantics", "error boundaries", "server auth", "safe return target", "basename/rewrite", "direct deep links", "browser/server tests"], hints: ["원본 route literals를 그대로 복사하지 말고 synthetic names로 contract를 증명하세요."], expectedOutcome: "click뿐 아니라 refresh/back/error/expiry/subpath에서도 일관된 router가 완성됩니다.", solutionOutline: ["registry→layout→navigation→failure/security→hosting→evidence입니다."] },
    { difficulty: "설계", prompt: "Declarative app의 Data/Framework adoption과 URL compatibility migration plan을 작성하세요.", requirements: ["version provenance", "capability ADR", "published URL inventory", "differential corpus", "redirect policy", "data/error/auth boundaries", "hosting", "canary/telemetry", "rollback/cleanup"], hints: ["createBrowserRouter 도입 자체를 목표로 삼지 말고 필요한 capability와 migration cost를 입증하세요."], expectedOutcome: "current behavior와 bookmarks를 보존하면서 필요한 router capability만 점진 도입하는 계획이 완성됩니다.", solutionOutline: ["facts→capabilities→seams→parity→cutover→cleanup 순서입니다."] },
  ],
  nextSessions: ["react-32-route-params-search-state"], sources,
  sourceCoverage: { filesRead: 10, filesUsed: 10, uncoveredNotes: ["REACT router 문서는 v6 snapshot, my-app02/03 package는 ^7.15.0 declared range, current official site는 audit date의 mode/API guidance로 분리했으며 resolved installed exact version을 추정하지 않았습니다.", "두 App은 Declarative BrowserRouter/Routes/Route style, 각각 five/seven path definitions이며 source snapshot에서 index, wildcard와 Outlet을 관찰하지 못했습니다.", "Navbar/PrivateRoute의 실제 path, label, account/domain/storage/credential-like literals는 source evidence와 examples에 복사하지 않았습니다.", "client PrivateRoute/Navigate는 UX guard로만 사용하고 API/resource authorization authority라고 주장하지 않았습니다.", "Node models는 actual React Router matching/ranking, browser History, accessible DOM, server authorization, static-host rewrite, SSR/hydration과 deployment rollback을 대체하지 않습니다."] },
});

export default session;
