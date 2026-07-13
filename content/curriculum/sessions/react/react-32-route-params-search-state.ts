import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuditRefs = ["local-router-guide", "local-router-app", "local-router-nav", "local-param-page", "local-myapp02-router", "local-myapp02-navbar"];

const topics = [
  appliedTopic({
    id: "source-url-routing-audit", title: "학습 원본을 route tree·URL consumer·hosting boundary로 감사합니다",
    lead: "라우트 선언과 링크가 보인다는 사실만 기록하지 않고 path pattern이 어떤 값을 만들고, 어느 컴포넌트가 읽으며, 새로고침 때 어떤 서버가 문서를 반환해야 하는지까지 추적합니다.",
    mechanism: "REACT 문서와 basics App은 BrowserRouter/HashRouter, flat Routes, dynamic segments와 useParams를 보여 주고 my-app02는 고정 route와 NavLink active state를 보여 줍니다. 이 snapshot에는 search-param schema, canonicalization, nested data router와 server rewrite 계약이 없으므로 관찰 사실과 production 보강안을 구분합니다.",
    workflow: "각 route pattern, parameter name, link producer, URL reader, history operation, deployment base와 fallback을 sanitized graph로 만들고 문자열로 읽힌 값이 domain value가 되기 전 parser·validator를 통과하는지 표시합니다.",
    invariants: "원본 여섯 파일은 read-only이며 실제 route 문자열·화면 문구·domain records·local URL을 공개 fixture에 복사하지 않고 구조와 exact provenance만 기록합니다.",
    edgeCases: "missing segment, percent encoding, malformed escape, repeated query key, empty value, unknown key, trailing slash, base path, direct refresh, back/forward와 copied deep link를 포함합니다.",
    failureModes: "useParams 결과를 배열 index나 resource identity로 즉시 사용하면 범위 오류와 권한 혼동이 생기고 SPA navigation만 시험하면 정적 hosting의 deep-link 404를 놓칩니다.",
    verification: "source lines·bytes·SHA-256, route producer/consumer graph, parameter corpus, query round trip, history trace와 clean-host deep-link request를 각각 확인합니다.",
    operations: "route family, parse failure code, navigation type와 fallback failure만 low-cardinality로 관찰하고 raw URL query·user identifier·referrer detail은 수집하지 않습니다.",
    concepts: [c("route pattern", "URL pathname segment와 component match를 연결하는 선언입니다.", ["literal과 dynamic segment를 구분합니다.", "값 validation 자체는 아닙니다."]), c("URL consumer", "params·search·location을 읽어 UI나 request를 만드는 코드 지점입니다.", ["sink까지 추적합니다.", "runtime schema가 필요합니다."]), c("hosting boundary", "deep link 요청에 document를 반환할 책임이 client router에서 server/CDN으로 넘어가는 경계입니다.", ["rewrite 또는 hash 전략을 정합니다.", "새로고침으로 시험합니다."])],
    codeExamples: [node("react32-source-map", "sanitized route source capability map", "React32SourceMap.mjs", "원본 값을 복사하지 않고 source별 관찰 capability와 공백을 출력합니다.", String.raw`const sources = [
  ["guide", "router,params,hosting-note"],
  ["basics-app", "flat-routes,dynamic-segments,router-mode"],
  ["param-page", "string-param-consumer"],
  ["state-app", "flat-routes,active-links"],
];
for (const [name, facts] of sources) console.log(name + "=" + facts);
console.log("private-values-copied=false");`, "guide=router,params,hosting-note\nbasics-app=flat-routes,dynamic-segments,router-mode\nparam-page=string-param-consumer\nstate-app=flat-routes,active-links\nprivate-values-copied=false", localAuditRefs.concat(["rr-modes", "rr-routing"]))],
  }),
  appliedTopic({
    id: "path-param-runtime-schema", title: "path params를 문자열에서 검증된 domain key로 변환합니다",
    lead: "dynamic segment는 편리한 변수 선언이 아니라 외부 입력 경계이며 useParams가 돌려준 문자열 또는 undefined를 parsing하지 않으면 잘못된 화면과 request가 만들어집니다.",
    mechanism: "route matcher는 decoded segment를 params map에 연결하지만 숫자·UUID·enum·resource 존재 여부나 현재 principal의 접근 권한까지 증명하지 않습니다. parser는 missing, syntax, range와 canonical form을 stable result로 분류하고 loader 또는 component 진입 전에 domain key를 만듭니다.",
    workflow: "segment grammar와 최대 길이를 정하고 decode 결과를 allowlist/schema로 검증한 뒤 canonical key로 변환하며 invalid는 안전한 400/404 UX, valid-but-forbidden은 server의 403 결정으로 분리합니다.",
    invariants: "parseInt의 부분 성공, truthy 검사, array index direct access를 금지하고 parameter 값만으로 resource authorization이 승인되지 않습니다.",
    edgeCases: "undefined, empty, leading sign/zero, whitespace, Unicode normalization, slash encoding, overflow, duplicate canonical ID와 deleted resource를 포함합니다.",
    failureModes: "숫자로 시작하는 임의 문자열이 부분 parse되거나 negative/huge index가 collection lookup으로 전달되면 crash·잘못된 record·enumeration 신호가 발생합니다.",
    verification: "table/property tests로 accepted/rejected corpus, parse→format→parse round trip, maximum length, unauthorized direct request와 safe 404/403 differentiation을 검증합니다.",
    operations: "param 이름과 stable parse reason만 집계하고 원문 segment는 로그·analytics에 남기지 않으며 비정상 급증에는 rate/abuse runbook을 연결합니다.",
    concepts: [c("dynamic segment", "route pattern에서 URL 한 구간을 이름 있는 문자열로 포착하는 자리입니다.", ["optional/splat과 다릅니다.", "domain type이 아닙니다."]), c("runtime schema", "실행 시 외부 문자열의 존재·형식·범위를 검증하는 계약입니다.", ["typed result를 반환합니다.", "authorization과 분리합니다."]), c("canonical key", "동일한 resource를 하나의 표준 문자열로 표현한 식별자입니다.", ["비교와 cache key에 씁니다.", "원 입력을 그대로 신뢰하지 않습니다."])],
    codeExamples: [node("react32-param-parser", "strict path parameter parser", "React32ParamParser.mjs", "정수형 segment를 전체 문자열·범위 기준으로 분류합니다.", String.raw`function parseKey(raw) {
  if (raw === undefined) return { ok: false, code: "missing" };
  if (!/^[1-9]\d{0,5}$/.test(raw)) return { ok: false, code: "syntax" };
  const value = Number(raw);
  return value <= 500000 ? { ok: true, value } : { ok: false, code: "range" };
}
for (const raw of [undefined, "12x", "0007", "42", "900000"]) {
  const result = parseKey(raw);
  console.log(String(raw) + "=" + (result.ok ? "ok:" + result.value : result.code));
}`, "undefined=missing\n12x=syntax\n0007=syntax\n42=ok:42\n900000=range", ["local-param-page", "rr-use-params", "rr-routing", "whatwg-url", "owasp-input-validation"])],
  }),
  appliedTopic({
    id: "search-param-multimap-schema", title: "search params를 ordered multimap으로 읽고 default·duplicate 정책을 명시합니다",
    lead: "query는 object 한 개가 아니라 같은 key가 반복될 수 있는 ordered sequence이므로 get 하나와 object spread만으로 filter·sort·page 계약을 표현하면 정보가 조용히 사라집니다.",
    mechanism: "URLSearchParams는 key/value 문자열 쌍과 get/getAll/append/set/delete를 제공합니다. useSearchParams의 setter는 navigation을 만들며 callback update는 React state queue와 같은 누적 semantics가 아니므로 한 transition에서 next params를 한 번 계산합니다.",
    workflow: "허용 key, single/multi cardinality, missing과 empty 차이, default, enum/range, ordering과 unknown-key policy를 schema로 만들고 parse result와 canonical serializer를 한 module에서 제공합니다.",
    invariants: "multi-select 값은 getAll로 보존하고 page/sort default는 화면 state와 URL 양쪽에 중복 저장하지 않으며 invalid query를 silently privileged mode로 바꾸지 않습니다.",
    edgeCases: "duplicate single key, repeated multi key, empty string, plus/space, percent encoding, unknown key, huge value/count, reordered keys와 browser paste를 포함합니다.",
    failureModes: "Object.fromEntries는 duplicate key를 마지막 값 하나로 축소하고 useSearchParams setter를 같은 tick에 여러 번 호출하면 앞선 의도가 누락될 수 있습니다.",
    verification: "generated multimap corpus, duplicate/empty/unknown negatives, parse-serialize idempotency, back/forward, copied URL와 component integration을 검사합니다.",
    operations: "허용 key와 parse reason별 count만 수집하고 자유 검색어와 filter values는 analytics/log에서 redaction 또는 제외합니다.",
    concepts: [c("ordered multimap", "같은 key가 여러 값을 가지며 쌍의 순서도 보존되는 자료 구조입니다.", ["URLSearchParams의 모델입니다.", "plain object와 다릅니다."]), c("cardinality policy", "각 query key가 0·1·여러 값을 허용하는지 정한 규칙입니다.", ["duplicate 처리도 포함합니다.", "schema에 둡니다."]), c("query default", "key가 없을 때 적용하는 domain 기본값입니다.", ["empty와 구분합니다.", "URL 표기 여부를 결정합니다."])],
    codeExamples: [node("react32-query-parser", "query multimap schema parser", "React32QueryParser.mjs", "반복 filter와 단일 page의 duplicate/범위를 안정적으로 처리합니다.", String.raw`function parseQuery(text) {
  const q = new URLSearchParams(text);
  const pages = q.getAll("page");
  if (pages.length > 1) return { ok: false, code: "duplicate-page" };
  const page = pages.length === 0 ? 1 : Number(pages[0]);
  if (!Number.isInteger(page) || page < 1 || page > 99) return { ok: false, code: "invalid-page" };
  const tags = [...new Set(q.getAll("tag").filter((v) => /^[a-z-]{1,12}$/.test(v)))].sort();
  return { ok: true, page, tags };
}
for (const text of ["tag=ui&tag=web&page=2", "page=2&page=3", "page=0", "tag=ui&tag=ui"]) {
  const r = parseQuery(text);
  console.log(text + "=" + (r.ok ? "page:" + r.page + ",tags:" + (r.tags.join("+") || "none") : r.code));
}`, "tag=ui&tag=web&page=2=page:2,tags:ui+web\npage=2&page=3=duplicate-page\npage=0=invalid-page\ntag=ui&tag=ui=page:1,tags:ui", ["rr-use-search-params", "whatwg-url", "owasp-input-validation"])],
  }),
  appliedTopic({
    id: "canonical-url-serialization", title: "canonical URL을 deterministic하게 직렬화합니다",
    lead: "같은 화면 상태가 key 순서·default 표기·중복 값에 따라 여러 URL로 표현되면 cache, analytics, 공유 링크와 test fixture가 분열됩니다.",
    mechanism: "canonicalizer는 pathname segment를 encode하고 query key/value를 schema 순서로 정렬하며 default와 빈 optional 값을 생략하고 multi values를 deduplicate합니다. hash는 server request에 전달되지 않는 client fragment이므로 query와 같은 데이터 채널로 간주하지 않습니다.",
    workflow: "parsed domain state에서만 URL을 만들고 raw 문자열 조합을 피하며 segment/query 역할에 맞는 URL/URLSearchParams API를 사용해 한 번만 encoding합니다.",
    invariants: "parse(canonicalize(state))가 같은 state를 만들고 canonicalize(parse(url))는 두 번째 호출부터 바뀌지 않으며 secret·개인정보를 URL에 넣지 않습니다.",
    edgeCases: "spaces, composed/decomposed Unicode, reserved delimiters, percent sign, repeated values, default page, empty search, trailing slash와 fragment를 포함합니다.",
    failureModes: "이미 encoded 값을 다시 encode하면 percent가 중첩되고 object iteration 우연에 의존하면 같은 filter가 서로 다른 URL·cache key를 만듭니다.",
    verification: "Unicode/reserved corpus round trip, canonical idempotency, link copy/paste, server log privacy와 old URL redirect/replace compatibility를 시험합니다.",
    operations: "canonical mismatch와 legacy-shape 비율을 path template 기준으로 관찰하고 raw full URL은 민감정보 검토 전 수집하지 않습니다.",
    concepts: [c("canonical URL", "동일한 navigation state를 대표하는 하나의 표준 URL 표현입니다.", ["default를 정규화합니다.", "공유/cache identity를 안정화합니다."]), c("percent encoding", "URL 구성 요소에서 직접 쓸 수 없는 bytes를 percent triplet으로 나타내는 규칙입니다.", ["component별 규칙이 다릅니다.", "중복 encoding을 피합니다."]), c("idempotent serialization", "같은 값을 반복 직렬화해도 결과가 더 변하지 않는 성질입니다.", ["canonicalizer 핵심 검증입니다.", "입력 schema 뒤에 수행합니다."])],
    codeExamples: [node("react32-canonical-url", "deterministic canonical query serializer", "React32CanonicalUrl.mjs", "default 생략·multi-value 정렬·segment encoding을 적용합니다.", String.raw`function canonical(state) {
  const url = new URL("https://example.invalid/");
  url.pathname = "/catalog/" + encodeURIComponent(state.item);
  const q = new URLSearchParams();
  for (const tag of [...new Set(state.tags)].sort()) q.append("tag", tag);
  if (state.page !== 1) q.set("page", String(state.page));
  url.search = q.toString();
  return url.pathname + url.search;
}
console.log(canonical({ item: "guide one", tags: ["web", "ui", "web"], page: 1 }));
console.log(canonical({ item: "guide one", tags: ["ui"], page: 3 }));`, "/catalog/guide%20one?tag=ui&tag=web\n/catalog/guide%20one?tag=ui&page=3", ["rr-use-search-params", "rr-use-location", "whatwg-url"])],
  }),
  appliedTopic({
    id: "url-state-ownership", title: "URL state·local state·server state의 소유권을 나눕니다",
    lead: "공유·bookmark·back/forward로 복원되어야 하는 선택만 URL에 두고 순간 UI와 authoritative data를 query에 억지로 직렬화하지 않습니다.",
    mechanism: "URL은 navigation identity와 shareable view input, component state는 ephemeral interaction, server는 entity와 authorization의 authority입니다. URL에서 parse한 filter/page가 request key를 만들고 server result를 파생 view로 렌더하되 결과 record 자체를 URL state로 복제하지 않습니다.",
    workflow: "각 state에 shareability, sensitivity, size, lifetime, authority, reload/back semantics를 표시해 owner를 정하고 URL→parsed state→request descriptor→result의 단방향 data flow를 만듭니다.",
    invariants: "URL은 component state의 second copy가 아니며 route change가 필요한 state만 history에 들어가고 password·token·개인정보·대형 draft는 path/query/hash 어디에도 두지 않습니다.",
    edgeCases: "unsaved form, modal, selected tab, pagination, server cursor, temporary toast, feature flag, account switch와 stale copied link를 포함합니다.",
    failureModes: "effect 두 개로 URL과 local filter를 양방향 sync하면 loop·flicker·back button overwrite가 생기고 location state만 쓰면 새로고침·공유에서 state가 사라집니다.",
    verification: "state classification review, reload/copy/back-forward tests, URL size/privacy scan, stale deep link와 account authorization을 실행합니다.",
    operations: "state owner violations, URL length budget과 parse fallback을 측정하고 sensitive-key scanner를 CI와 telemetry ingestion 앞에 둡니다.",
    concepts: [c("URL state", "현재 화면을 식별·공유·복원하는 데 필요한 navigation 입력입니다.", ["schema로 parse합니다.", "공개 가능성을 검토합니다."]), c("ephemeral state", "focus·hover·열린 임시 UI처럼 현재 interaction에만 필요한 값입니다.", ["URL에 넣지 않을 수 있습니다.", "lifetime이 짧습니다."]), c("request descriptor", "검증된 route/query state에서 만든 fetch key와 server request 조건입니다.", ["raw URL과 분리합니다.", "authorization은 server가 합니다."])],
    codeExamples: [node("react32-state-owner", "navigation state ownership classifier", "React32StateOwner.mjs", "shareability·sensitivity·authority 기준으로 URL/local/server owner를 결정합니다.", String.raw`function owner(field) {
  if (field.authoritative) return "server";
  if (field.sensitive || !field.shareable) return "local";
  return "url";
}
const fields = [
  ["page", { shareable: true }],
  ["dialogOpen", { shareable: false }],
  ["credential", { shareable: false, sensitive: true }],
  ["record", { authoritative: true }],
];
for (const [name, flags] of fields) console.log(name + "=" + owner(flags));`, "page=url\ndialogOpen=local\ncredential=local\nrecord=server", ["rr-use-location", "rr-use-search-params", "html-history", "owasp-input-validation"])],
  }),
  appliedTopic({
    id: "history-navigation-semantics", title: "push·replace·POP과 back/forward UX를 설계합니다",
    lead: "navigate가 성공했다는 사실보다 사용자의 뒤로 가기 기대와 history entry 수가 맞는지 판단해야 filter 입력·redirect·wizard가 예측 가능해집니다.",
    mechanism: "push는 새 entry를 만들고 replace는 현재 entry를 바꾸며 browser back/forward는 기존 entry를 이동합니다. 입력 매 keystroke, canonical correction, post-auth redirect와 destructive completion은 서로 다른 history policy가 필요합니다.",
    workflow: "user intent별 push/replace rule을 표로 만들고 debounce와 final commit을 구분하며 navigation type, scroll/focus, pending과 cancellation을 state machine으로 연결합니다.",
    invariants: "redirect loop를 만들지 않고 replace로 사용자가 접근 가능한 이전 page를 지우지 않으며 back/forward가 stale local state에 의해 즉시 재덮이지 않습니다.",
    edgeCases: "rapid query typing, double click, same-URL navigation, hash-only change, pending loader, blocked form, cross-origin link와 restored tab을 포함합니다.",
    failureModes: "모든 query update를 push하면 back stack이 keystroke로 채워지고 모든 이동을 replace하면 사용자가 이전 작업으로 돌아갈 수 없습니다.",
    verification: "memory history model과 real browser에서 entry sequence, navigation type, back/forward restoration, pending cancel, focus/scroll을 검증합니다.",
    operations: "navigation intent·type·cancel reason과 excessive-entry 경보를 low-cardinality로 기록하고 full target URL을 남기지 않습니다.",
    concepts: [c("history entry", "URL과 navigation-associated state를 가진 session history의 한 항목입니다.", ["document와 반드시 1:1은 아닙니다.", "push/replace로 관리합니다."]), c("replace navigation", "현재 history entry를 새 destination으로 교체하는 이동입니다.", ["canonical correction에 유용합니다.", "back expectation을 검토합니다."]), c("POP navigation", "back/forward처럼 기존 history entry로 이동하는 동작을 가리키는 router 관점의 이름입니다.", ["user intent를 존중합니다.", "effect로 덮지 않습니다."])],
    codeExamples: [node("react32-history-model", "push·replace·back history model", "React32HistoryModel.mjs", "history policy가 entry와 current URL에 미치는 결과를 결정적으로 보여 줍니다.", String.raw`let entries = ["/catalog"];
let index = 0;
function push(url) { entries = entries.slice(0, index + 1).concat(url); index++; }
function replace(url) { entries[index] = url; }
function back() { if (index > 0) index--; }
push("/catalog?page=2");
replace("/catalog?page=2&tag=ui");
push("/catalog/item-a");
back();
console.log("entries=" + entries.join("|"));
console.log("index=" + index);
console.log("current=" + entries[index]);`, "entries=/catalog|/catalog?page=2&tag=ui|/catalog/item-a\nindex=1\ncurrent=/catalog?page=2&tag=ui", ["rr-use-navigate", "rr-navigating", "local-router-nav", "local-myapp02-navbar", "html-history"])],
  }),
  appliedTopic({
    id: "deep-link-hosting-contract", title: "deep link·refresh·base path를 client와 hosting 계약으로 만듭니다",
    lead: "Link로 이동되는 화면이 직접 주소 입력과 새로고침에서도 열린다는 보장은 router가 아니라 server/CDN의 document fallback과 asset base 설정까지 맞아야 성립합니다.",
    mechanism: "Browser history URL은 server에 pathname 그대로 요청되므로 SPA host가 known asset/API를 제외한 app routes에 entry document를 반환해야 합니다. hash routing은 fragment가 server에 전달되지 않는 특성으로 static host 제약을 피하지만 canonical·server observation tradeoff가 있습니다.",
    workflow: "deployment prefix, trailing slash, document fallback, 404 ownership, asset URLs, API exclusions와 old URL redirects를 명세하고 clean browser에서 nested/deep URL을 최초 request로 엽니다.",
    invariants: "모든 404를 entry HTML 200으로 바꿔 real missing asset/API를 숨기지 않고 base path와 generated links/assets가 같은 deployment contract를 사용합니다.",
    edgeCases: "subdirectory deploy, case sensitivity, encoded path, trailing slash, missing asset, service-worker cache, offline revisit, prerendered route와 CDN cache를 포함합니다.",
    failureModes: "dev server fallback만 보고 배포하면 refresh 404가 나고 blanket rewrite는 존재하지 않는 script/API에도 HTML을 반환해 parsing error와 cache pollution을 만듭니다.",
    verification: "HTTP first request, content-type/status, assets/API exclusion, hard refresh, new tab, copied link, old artifact와 rollback cache를 production-like host에서 검사합니다.",
    operations: "document fallback miss, HTML-as-asset response, route 404와 deploy prefix mismatch를 관찰하고 immutable assets와 rollback 문서를 둡니다.",
    concepts: [c("deep link", "앱 내부의 특정 navigation state를 직접 가리키는 URL입니다.", ["첫 document request로도 열려야 합니다.", "공유·bookmark 대상입니다."]), c("SPA fallback", "app route 요청에 client entry document를 반환하는 hosting 규칙입니다.", ["asset/API는 제외합니다.", "status/cache를 설계합니다."]), c("base path", "앱이 root가 아닌 prefix 아래 배포될 때 route와 asset이 기준으로 삼는 경로입니다.", ["router와 bundler가 일치해야 합니다.", "환경별 시험이 필요합니다."])],
    codeExamples: [node("react32-deep-link-policy", "SPA fallback request classifier", "React32DeepLinkPolicy.mjs", "document route와 asset/API를 분리해 fallback 여부를 결정합니다.", String.raw`function classify(path, accept) {
  if (path.startsWith("/service/") || /\.[a-z0-9]+$/i.test(path)) return "origin-resource";
  if (accept.includes("text/html")) return "app-document";
  return "not-found";
}
const cases = [
  ["/workspace/report-a", "text/html"],
  ["/assets/app.js", "*/*"],
  ["/service/items", "application/json"],
  ["/workspace/report-a", "application/json"],
];
for (const [path, accept] of cases) console.log(path + "=" + classify(path, accept));`, "/workspace/report-a=app-document\n/assets/app.js=origin-resource\n/service/items=origin-resource\n/workspace/report-a=not-found", ["local-router-guide", "local-router-app", "local-myapp02-router", "rr-modes", "rr-routing", "html-history"])],
  }),
  appliedTopic({
    id: "url-input-security-privacy", title: "URL을 untrusted public input으로 취급해 injection·open redirect·정보 노출을 막습니다",
    lead: "주소창에서 보이고 사용자가 직접 바꿀 수 있는 params/search/hash/location state는 신뢰 경계 밖 입력이며 숨겨진 링크나 client guard가 보안 통제가 아닙니다.",
    mechanism: "route 값은 parser와 allowlist를 거쳐 text, selector, request, redirect 등 sink별 validation/encoding을 적용합니다. return destination은 relative internal path만 허용하고 scheme-relative, absolute, control characters와 ambiguous decoding을 거부합니다.",
    workflow: "모든 URL reader에서 data-flow를 따라 DOM, network, storage, log와 navigation sinks를 inventory하고 server authorization, output encoding, safe redirect resolver와 privacy redaction을 배치합니다.",
    invariants: "param/resource ID가 authorization 증거가 아니며 raw query를 innerHTML·selector·header·filesystem·SQL·redirect target에 연결하지 않고 secret/PII를 URL에 저장하지 않습니다.",
    edgeCases: "double encoding, mixed-case scheme, backslash, encoded slash, Unicode confusable, CRLF, script-like scheme, protocol-relative target와 oversized query를 포함합니다.",
    failureModes: "startsWith 한 번이나 same-domain 문자열 포함 검사로 redirect를 허용하면 우회되고 URL의 token은 history·referrer·logs·screenshots·analytics로 확산됩니다.",
    verification: "malicious corpus, direct object request, redirect allow/deny table, DOM sink tests, server deny, referrer/log/storage scan과 length/rate limit을 실행합니다.",
    operations: "stable rejection code·route template·sink만 기록하고 raw attacker input과 credentials를 로그에서 제거하며 redirect abuse alert/runbook을 둡니다.",
    concepts: [c("untrusted URL input", "주소·링크·외부 site가 만들 수 있어 신뢰할 수 없는 path/query/hash 값입니다.", ["schema validation이 필요합니다.", "client가 만든 URL도 재검증합니다."]), c("open redirect", "공격자가 지정한 외부 destination으로 신뢰받는 app이 사용자를 보내는 취약점입니다.", ["strict internal allowlist로 막습니다.", "중첩 encoding을 시험합니다."]), c("authorization boundary", "resource 접근 허용을 authenticated principal과 server policy로 결정하는 지점입니다.", ["client route match와 다릅니다.", "매 요청 검증합니다."])],
    codeExamples: [node("react32-safe-destination", "strict internal navigation destination validator", "React32SafeDestination.mjs", "synthetic base에서 same-origin absolute-path destination만 canonical form으로 허용합니다.", String.raw`const base = new URL("https://example.invalid/");
function safe(raw) {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f]/.test(raw)) return "reject";
  const target = new URL(raw, base);
  if (target.origin !== base.origin || !target.pathname.startsWith("/workspace")) return "reject";
  return target.pathname + target.search + target.hash;
}
for (const raw of ["/workspace", "/workspace?tab=files", "//outside.invalid/x", "/other", "https://outside.invalid/"]) {
  console.log(raw + "=" + safe(raw));
}`, "/workspace=/workspace\n/workspace?tab=files=/workspace?tab=files\n//outside.invalid/x=reject\n/other=reject\nhttps://outside.invalid/=reject", ["rr-use-navigate", "rr-use-location", "rr-navigating", "owasp-input-validation", "owasp-redirects", "whatwg-url"])],
  }),
  appliedTopic({
    id: "url-accessibility-shareability", title: "URL 변화가 title·focus·status·공유 맥락까지 전달되게 합니다",
    lead: "주소가 바뀌고 새 component가 보인다는 것만으로 keyboard와 assistive technology 사용자에게 page 전환이 전달되지는 않습니다.",
    mechanism: "route metadata에서 unique document title, page heading와 focus target을 만들고 user-initiated navigation 완료 시 적절한 landmark/heading으로 focus를 복구합니다. query-only filter 변화는 context를 보존하며 결과 count를 status로 알리고 excessive focus 이동을 피합니다.",
    workflow: "navigation 종류별 title, heading, focus, scroll, status, loading와 error policy를 표로 만들고 back/forward·deep link·pending completion까지 keyboard/screen-reader로 시험합니다.",
    invariants: "URL만 바꾸고 silent update하지 않으며 focus를 무조건 body나 매 query keystroke마다 옮기지 않고 링크 이름과 destination purpose가 이해 가능해야 합니다.",
    edgeCases: "same layout child route, query filter, hash anchor, slow loader, error route, restored scroll, reduced motion, repeated status와 browser title history를 포함합니다.",
    failureModes: "persistent layout 안의 main content만 교체되면 screen reader cursor가 이전 context에 남고 generic title은 tab/history에서 page를 구별하지 못합니다.",
    verification: "keyboard-only, screen reader announcement, title/heading uniqueness, focus visibility/order, query result status, back/forward scroll과 zoom을 수동·자동으로 확인합니다.",
    operations: "route-template별 missing title/heading, focus fallback과 navigation abandonment를 privacy-safe하게 관찰하고 accessibility regression gate를 둡니다.",
    concepts: [c("navigation announcement", "새 view의 제목·상태를 assistive technology가 인지할 수 있게 전달하는 과정입니다.", ["title/focus/status를 조합합니다.", "중복을 피합니다."]), c("focus policy", "navigation 종류와 결과에 따라 keyboard focus를 유지하거나 옮길 target을 정한 규칙입니다.", ["visible heading/landmark를 선호합니다.", "query 입력을 방해하지 않습니다."]), c("shareable context", "URL을 다시 열었을 때 page 제목·선택·결과 의미가 독립적으로 이해되는 성질입니다.", ["default를 명시합니다.", "stale state를 처리합니다."])],
  }),
  appliedTopic({
    id: "url-contract-tests-operations", title: "parser·router·browser·hosting을 하나의 URL contract suite로 검증합니다",
    lead: "몇 개 링크를 손으로 클릭하는 수준을 넘어 모든 route family의 생성·해석·이동·복원·보안·배포를 executable contract로 유지합니다.",
    mechanism: "pure tests는 parser/canonicalizer, memory router는 match/history, component integration은 params/search render, browser E2E는 title/focus/back, disposable host는 first request/status/content-type를 증명합니다.",
    workflow: "route manifest에서 valid/invalid/deep-link fixtures를 생성하고 positive·negative·property·accessibility·security cases를 CI에 묶으며 old/new URL migration과 rollback을 canary에서 readback합니다.",
    invariants: "test fixture에는 실제 사용자·route/domain/token 값이 없고 mocks가 browser URL encoding, History, server rewrite와 authorization을 증명한다고 과장하지 않습니다.",
    edgeCases: "old bookmark, unknown route, malformed encoding, version-skewed client, service-worker cache, offline, locale prefix, base change와 rollback artifact를 포함합니다.",
    failureModes: "component snapshot만 통과하면 address bar/history/first request가 깨져도 알 수 없고 production route metrics에 raw URL을 남기면 기능 검증이 privacy incident가 됩니다.",
    verification: "examples exact stdout, sourceRef closure, route manifest coverage, actual browser/host matrix, sensitive scan, telemetry schema, canary와 rollback rehearsal를 실행합니다.",
    operations: "parse/deep-link/navigation SLI, error budget, owner, low-cardinality dashboards, alert와 old URL reconciliation runbook을 운영합니다.",
    concepts: [c("URL contract suite", "URL 생성부터 hosting·render·navigation·복구까지 층별로 검증하는 test 묶음입니다.", ["pure와 real integration을 구분합니다.", "보안/a11y를 포함합니다."]), c("route manifest", "route family의 pattern, schema, owner, metadata와 compatibility를 구조화한 목록입니다.", ["fixture 생성에 씁니다.", "single source를 지향합니다."]), c("route-template telemetry", "실제 값 대신 parameterized route 이름으로 집계하는 관찰 방식입니다.", ["cardinality와 privacy를 지킵니다.", "stable reason code를 씁니다."])],
    codeExamples: [node("react32-release-gate", "URL contract release gate", "React32ReleaseGate.mjs", "parser·canonical·history·deep-link·security·accessibility 증거가 모두 있어야 배포를 허용합니다.", String.raw`const evidence = {
  parser: true, canonical: true, history: true, deepLink: true,
  security: true, accessibility: true, privateValuesCopied: false,
};
const required = ["parser", "canonical", "history", "deepLink", "security", "accessibility"];
const missing = required.filter((key) => evidence[key] !== true);
const safe = evidence.privateValuesCopied === false;
console.log("missing=" + (missing.join(",") || "none"));
console.log("private-values-copied=" + evidence.privateValuesCopied);
console.log("release=" + (missing.length === 0 && safe ? "pass" : "block"));`, "missing=none\nprivate-values-copied=false\nrelease=pass", ["local-router-guide", "local-router-app", "local-router-nav", "local-param-page", "local-myapp02-router", "local-myapp02-navbar", "rr-modes", "rr-routing", "rr-use-params", "rr-use-search-params", "rr-use-location", "rr-use-navigate", "rr-navigating", "whatwg-url", "html-history", "owasp-input-validation", "owasp-redirects", "wcag-page-titled", "wcag-focus-order", "wcag-status"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-router-guide", repository: "D:/dev/REACT", path: "docs/react/08-router.md", usedFor: ["v6 declarative router lesson", "dynamic param and hosting notes", "source-to-demo structure"], evidence: "2026-07-14 read-only sanitized audit: 107 lines, 5,551 bytes, SHA-256 5D1D686C17CD50FF6FF7ADFD5AD41DA9715DB9C8674059523378422DED643541. actual routes, local URL과 UI strings는 복사하지 않았습니다." },
  { id: "local-router-app", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/App.js", usedFor: ["declarative flat route tree", "dynamic segments", "BrowserRouter/HashRouter deployment choice"], evidence: "2026-07-14 read-only sanitized audit: 64 lines, 2,593 bytes, SHA-256 A74CF035261424CEB448C27FBC7CD5DF747D72D615BCE24BB3BC26B52E3998E1. actual route/data/domain values는 복사하지 않았습니다." },
  { id: "local-router-nav", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/pages/step16-Router/RouterTest02.jsx", usedFor: ["Link producer inventory", "persistent navigation outside route slot"], evidence: "2026-07-14 read-only sanitized audit: 36 lines, 1,197 bytes, SHA-256 B2DC8FFCE93BD5E8140951CA60BE0D7584E1DE941B58837040C332DA8648C277. actual destinations와 link labels는 복사하지 않았습니다." },
  { id: "local-param-page", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/pages/step16-Router/Third.jsx", usedFor: ["useParams string consumption", "unchecked index/image sink provenance"], evidence: "2026-07-14 read-only sanitized audit: 15 lines, 506 bytes, SHA-256 CFD1481184AACE2F775349B85F8F283B916801331EFC9BB886CA54995A1C3E89. actual params, labels와 asset values는 복사하지 않았습니다." },
  { id: "local-myapp02-router", repository: "D:/dev/my-app02", path: "src/App.js", usedFor: ["flat BrowserRouter/Routes structure", "persistent Navbar boundary"], evidence: "2026-07-14 read-only sanitized audit: 30 lines, 880 bytes, SHA-256 5FF7DE7AFDC11D4413421A26FE137A064A382FC0ECDA21C5C6AB48B934665150. actual route/page values는 복사하지 않았습니다." },
  { id: "local-myapp02-navbar", repository: "D:/dev/my-app02", path: "src/components/Navbar.jsx", usedFor: ["NavLink active-state structure", "auth-conditioned visibility provenance"], evidence: "2026-07-14 read-only sanitized audit: 32 lines, 1,439 bytes, SHA-256 D29B5E26C4D63428A85C06076EA9A0C15B651DBBEEAB0679817D57E6660C5C38. actual labels/destinations와 user values는 복사하지 않았습니다." },
  { id: "rr-modes", repository: "React Router official documentation", path: "start/modes", publicUrl: "https://reactrouter.com/start/modes", usedFor: ["declarative/data/framework mode boundaries"], evidence: "React Router 공식 현행 mode 선택 문서입니다." },
  { id: "rr-routing", repository: "React Router official documentation", path: "start/data/routing", publicUrl: "https://reactrouter.com/start/data/routing", usedFor: ["nested and dynamic route contracts", "params availability"], evidence: "React Router 공식 현행 data routing 문서입니다." },
  { id: "rr-use-params", repository: "React Router official documentation", path: "api/hooks/useParams", publicUrl: "https://reactrouter.com/api/hooks/useParams", usedFor: ["matched dynamic parameter access"], evidence: "React Router 공식 현행 useParams API입니다." },
  { id: "rr-use-search-params", repository: "React Router official documentation", path: "api/hooks/useSearchParams", publicUrl: "https://reactrouter.com/api/hooks/useSearchParams", usedFor: ["URLSearchParams tuple and navigation semantics", "setter caveats"], evidence: "React Router 공식 현행 useSearchParams API입니다." },
  { id: "rr-use-location", repository: "React Router official documentation", path: "api/hooks/useLocation", publicUrl: "https://reactrouter.com/api/hooks/useLocation", usedFor: ["current location observation"], evidence: "React Router 공식 현행 useLocation API입니다." },
  { id: "rr-use-navigate", repository: "React Router official documentation", path: "api/hooks/useNavigate", publicUrl: "https://reactrouter.com/api/hooks/useNavigate", usedFor: ["programmatic navigation and replace"], evidence: "React Router 공식 현행 useNavigate API입니다." },
  { id: "rr-navigating", repository: "React Router official documentation", path: "start/data/navigating", publicUrl: "https://reactrouter.com/start/data/navigating", usedFor: ["Link/NavLink/navigation choices"], evidence: "React Router 공식 현행 data navigation 문서입니다." },
  { id: "whatwg-url", repository: "WHATWG URL Standard", path: "URL Standard", publicUrl: "https://url.spec.whatwg.org/", usedFor: ["URL parsing and percent-encoding", "URLSearchParams model"], evidence: "WHATWG Living Standard의 URL parsing·serialization 규범입니다." },
  { id: "html-history", repository: "WHATWG HTML Living Standard", path: "nav-history-apis.html", publicUrl: "https://html.spec.whatwg.org/multipage/nav-history-apis.html", usedFor: ["session history and navigation APIs"], evidence: "WHATWG HTML Living Standard의 navigation/history 규범입니다." },
  { id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input_Validation_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allowlist validation of URL inputs"], evidence: "OWASP 공식 input validation guidance입니다." },
  { id: "owasp-redirects", repository: "OWASP Cheat Sheet Series", path: "Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", usedFor: ["safe internal redirect validation"], evidence: "OWASP 공식 unvalidated redirect guidance입니다." },
  { id: "wcag-page-titled", repository: "W3C WAI WCAG", path: "Understanding/page-titled", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html", usedFor: ["descriptive document titles after navigation"], evidence: "W3C WAI 공식 Page Titled guidance입니다." },
  { id: "wcag-focus-order", repository: "W3C WAI WCAG", path: "Understanding/focus-order", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html", usedFor: ["meaningful focus order and navigation recovery"], evidence: "W3C WAI 공식 Focus Order guidance입니다." },
  { id: "wcag-status", repository: "W3C WAI WCAG", path: "Understanding/status-messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", usedFor: ["query-result and navigation status announcements"], evidence: "W3C WAI 공식 Status Messages guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-32-route-params-search-state", slug: "react-32-route-params-search-state", courseId: "react", moduleId: "react-router-network", order: 2,
  title: "route params·search와 URL state", subtitle: "URL을 public input·shareable state·history entry·hosting contract로 함께 다루며 parsing, canonicalization, deep link와 보안을 끝까지 검증합니다.",
  level: "중급", estimatedMinutes: 120,
  coreQuestion: "route params와 search를 어떻게 읽을지가 아니라, 어떤 URL도 안전하고 canonical하며 공유·새로고침·back/forward 가능한 application state가 되게 하려면 무엇을 계약해야 할까요?",
  summary: "REACT Router 문서와 basics/my-app02 route·navigation sources 여섯 개를 read-only·sanitized 감사해 declarative flat route, dynamic string params, active links와 Browser/Hash hosting 선택을 보존합니다. 실제 route·user·domain·token 값은 복사하지 않습니다. 현행 React Router, WHATWG와 OWASP 근거로 strict path/query schema, multimap/default, canonical URL, state ownership, history semantics, deep-link hosting, redirect/input security, accessibility와 layered qualification을 아홉 deterministic Node models에 연결합니다.",
  objectives: ["원본 route producer/consumer/hosting 경계를 감사한다.", "path params를 runtime schema와 canonical domain key로 변환한다.", "search params의 duplicate·multi-value·default를 보존한다.", "동일 state에 하나의 canonical URL을 만든다.", "URL/local/server state ownership을 분리한다.", "push·replace·back/forward semantics를 설계한다.", "deep link·refresh·base path hosting 계약을 검증한다.", "URL input·redirect·resource authorization을 안전하게 분리한다.", "title·focus·status를 포함한 navigation 접근성을 검증한다.", "parser부터 production host까지 URL contract suite를 운영한다."],
  prerequisites: [{ title: "Router configuration과 layout", reason: "route tree, Router/Routes/Link와 layout slot의 기본 구조를 알아야 URL value와 history/hosting 계약을 분리할 수 있습니다.", sessionSlug: "react-31-router-configuration-layout" }],
  keywords: ["route params", "search params", "URLSearchParams", "canonical URL", "history", "deep link", "SPA fallback", "open redirect", "runtime schema", "navigation accessibility"],
  topics,
  lab: { title: "URL contract laboratory와 production-like deep-link host qualification", scenario: "원본 files는 변경하지 않고 synthetic routes와 non-sensitive values만 사용해 parser/canonicalizer, memory router, browser와 disposable static host를 같은 manifest로 시험합니다.", setup: ["Node.js 20 이상", "React Router current data-mode fixture", "real browser history", "disposable host with selective SPA fallback", "keyboard/screen-reader tools", "malicious URL corpus", "원본 여섯 files read-only"], steps: ["원본의 route producer/consumer/hosting graph와 exact hashes를 기록합니다.", "path/query schema와 stable error codes를 작성합니다.", "multi-value/default/unknown policy와 canonical serializer를 property-test합니다.", "URL/local/server state classification과 request descriptor를 만듭니다.", "push/replace/back/forward intent matrix를 browser에서 실행합니다.", "first-request deep link, base path, asset/API exclusions와 rollback artifact를 시험합니다.", "redirect/injection/object authorization negative corpus를 실행합니다.", "title/heading/focus/status/scroll을 keyboard와 assistive technology로 확인합니다.", "route-template telemetry, sensitive redaction, canary와 rollback runbook을 rehearsal합니다."], expectedResult: ["모든 params/search가 typed parse result를 거쳐 domain state가 됩니다.", "같은 state는 하나의 canonical URL로 직렬화되고 back/forward와 copy/reload가 복원됩니다.", "deep link는 production-like host에서 올바른 status/content-type으로 열리며 asset/API 실패가 숨지 않습니다.", "external redirect·malformed input·direct resource tampering이 안전하게 거부됩니다.", "navigation 완료·query 결과·오류가 title/focus/status로 접근 가능하게 전달됩니다."], cleanup: ["temporary host, browser profiles, history, service worker와 caches를 제거합니다.", "synthetic URLs, malicious corpus, screenshots와 logs를 폐기합니다.", "rewrite/base/feature flags와 verbose telemetry를 원복합니다.", "원본 여섯 files의 hash/status unchanged를 확인합니다."], extensions: ["typed route manifest에서 URL builders와 parsers를 생성합니다.", "locale/base-path migration과 old bookmark compatibility를 설계합니다.", "SSR/prerender canonical/link metadata를 추가합니다.", "privacy-safe route observability dashboard를 구현합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "아홉 Node examples를 실행하고 각 output을 실제 React Router/browser/host 계약과 대응시키세요.", requirements: ["stdout 완전 일치", "sanitized source map", "strict params", "query multimap", "canonical URL", "state owner", "history", "deep-link policy", "safe destination", "release gate", "model 한계"], hints: ["Node URL/history model이 actual router, browser navigation 또는 server rewrite를 증명한다고 표현하지 마세요."], expectedOutcome: "URL 입력에서 accessible page와 deep-link response까지 각 책임 경계를 설명합니다.", solutionOutline: ["audit→parse→canonicalize→own→navigate→host→secure→qualify 순서입니다."] },
    { difficulty: "응용", prompt: "filterable catalog의 shareable URL contract를 설계하세요.", requirements: ["path/query schemas", "multi/default policy", "canonicalizer", "push/replace", "deep-link host", "authorization", "title/focus/status", "property/E2E tests", "telemetry redaction"], hints: ["filter 결과 record를 URL state로 복제하거나 자유 검색어를 raw analytics에 남기지 마세요."], expectedOutcome: "paste/reload/back/forward와 invalid input에도 같은 안전한 view가 복원됩니다.", solutionOutline: ["manifest→schema→serializer→history policy→integration→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 route/URL governance와 migration 표준을 작성하세요.", requirements: ["ownership", "naming/versioning", "parser/canonical", "hosting", "security/privacy", "accessibility", "compatibility", "tests", "SLI/runbook/rollback"], hints: ["router API 목록이 아니라 old bookmarks와 deploy rollback까지 계약하세요."], expectedOutcome: "모든 팀이 route 추가·변경·폐기를 같은 evidence로 review할 수 있습니다.", solutionOutline: ["inventory→contract→generate→verify→observe→migrate/reconcile 순서입니다."] },
  ],
  nextSessions: ["react-33-nested-route-data-errors"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["REACT Router 문서, basics App/navigation/param consumer와 my-app02 App/Navbar를 전부 read-only로 읽고 exact lines·bytes·SHA-256를 기록했습니다.", "원본은 declarative flat routes와 v6 학습 흐름이므로 현행 data/framework mode의 loader/action/error contracts를 이미 구현했다고 주장하지 않습니다.", "실제 route strings, page/link labels, local URL, movie/user/domain records와 tokens는 공개 content에 복사하지 않았습니다.", "Node models는 actual React Router matching/encoding, browser History/focus/scroll, server authorization와 hosting rewrite를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
