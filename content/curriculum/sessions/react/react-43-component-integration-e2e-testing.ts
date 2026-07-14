import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuditRefs = ["local-app02-test", "local-app02-setup", "local-app02-package", "local-app03-test", "local-app03-setup", "local-app03-package", "local-app03-app", "local-guestbook-page", "local-auth-store"];

const topics = [
  appliedTopic({
    id: "source-test-gap-audit", title: "placeholder tests와 실제 auth·CRUD·router·network surface의 간극을 감사합니다",
    lead: "테스트 파일이 존재한다는 사실을 coverage로 착각하지 않고 assertion이 실제 UI에 대응하는지, 어떤 providers·storage·network·navigation을 건드리는지 source graph로 복원합니다.",
    mechanism: "my-app02·03 App.test는 초기 template 문구 하나를 찾는 동일한 placeholder이고 setupTests는 jest-dom matcher만 등록합니다. package에는 React Testing Library와 legacy user-event major가 있지만 App·auth store·Guestbook은 router, browser storage, async API, CRUD와 navigation을 사용하므로 현재 tests는 핵심 계약을 증명하지 못합니다.",
    workflow: "test name, rendered root, queries, interactions, assertions, providers, global state, network, cleanup과 product risks를 표로 만들고 pass/fail 여부와 meaningful confidence를 분리합니다.",
    invariants: "원본 아홉 files는 read-only이며 actual route, endpoint, user/content/password/token/storage/domain values를 fixture·문서·stdout에 복사하지 않고 structural provenance만 사용합니다.",
    edgeCases: "stale template assertion, test that never reaches async work, router duplication, persisted state leakage, open handles, network escape, order dependency와 false-positive snapshot을 포함합니다.",
    failureModes: "placeholder가 깨지는 이유를 product regression으로 오해하거나 억지로 legacy text를 UI에 추가하면 test가 요구사항이 아니라 scaffold를 보존하고 실제 auth/CRUD failures는 계속 놓칩니다.",
    verification: "exact lines·bytes·hashes, test-to-risk map, negative mutation test, network request inventory, global cleanup과 original worktree unchanged를 확인합니다.",
    operations: "suite/test ID, risk capability와 stable failure category만 기록하고 DOM dumps·traces·screenshots의 sensitive values는 redaction/retention policy를 적용합니다.",
    concepts: [c("placeholder test", "scaffold가 생성한 예시 문구처럼 현재 product behavior와 연결되지 않은 test입니다.", ["존재만으로 confidence가 생기지 않습니다.", "요구사항으로 교체합니다."]), c("test-to-risk map", "각 test가 어떤 business, accessibility, security, async failure를 탐지하는지 연결한 표입니다.", ["중복과 공백을 찾습니다.", "층 선택 근거가 됩니다."]), c("meaningful assertion", "사용자·protocol·state contract의 관찰 가능한 결과를 검증하는 assertion입니다.", ["implementation detail과 구분합니다.", "negative path를 포함합니다."])],
    codeExamples: [node("react43-source-gap", "sanitized test capability gap inventory", "React43SourceGap.mjs", "placeholder와 실제 application risks의 coverage 공백을 deterministic하게 출력합니다.", String.raw`const capabilities = {
  templateTextAssertion: true,
  semanticUserInteraction: false,
  authJourney: false,
  crudMutation: false,
  routerNavigation: false,
  networkFailure: false,
  accessibility: false,
  securityNegative: false,
};
for (const key of Object.keys(capabilities).sort()) console.log(key + "=" + capabilities[key]);
console.log("private-values-copied=false");`, "accessibility=false\nauthJourney=false\ncrudMutation=false\nnetworkFailure=false\nrouterNavigation=false\nsecurityNegative=false\nsemanticUserInteraction=false\ntemplateTextAssertion=true\nprivate-values-copied=false", localAuditRefs.concat(["react-act", "rtl-intro", "rtl-guiding"]))],
  }),
  appliedTopic({
    id: "risk-based-test-layers", title: "unit·component·integration·contract·E2E를 failure cost와 fidelity로 배치합니다",
    lead: "피라미드 그림을 외우지 않고 어떤 layer가 어떤 runtime 보장을 실제로 관찰할 수 있는지와 실패 진단 비용을 기준으로 최소 충분한 test를 선택합니다.",
    mechanism: "pure unit은 parser/reducer invariant, component는 DOM/user interaction, integration은 providers/router/store/network boundary, contract는 HTTP/schema/status, E2E는 real browser/server/deployment journey를 검증합니다. 같은 behavior를 모든 층에 복제하지 않고 위험한 경계마다 가장 낮은 충분 fidelity를 선택합니다.",
    workflow: "feature별 probability, impact, detectability, runtime owner와 regression history를 점수화하고 fast deterministic tests를 넓게, 핵심 journeys와 browser-only contracts를 좁고 깊게 둡니다.",
    invariants: "jsdom이 layout, browser navigation, CORS, storage isolation과 assistive technology를 완전히 증명한다고 주장하지 않고 E2E가 모든 edge input 조합을 담당하게 하지 않습니다.",
    edgeCases: "pure validation, portal/focus, abort race, browser history, service worker, HTTP cache, server authorization, responsive layout와 cross-tab을 포함합니다.",
    failureModes: "E2E만 쓰면 느리고 원인 분리가 어렵고 unit mock만 쓰면 wiring/protocol/browser failures를 놓치며 arbitrary percentage coverage는 critical branch 누락을 숨깁니다.",
    verification: "risk matrix, layer rationale, deliberate mutation detection, runtime capability table, execution budget와 flaky-rate baseline을 review합니다.",
    operations: "layer별 duration, failure yield, flake, quarantine age와 escaped defect를 관찰해 suite 투자와 제거를 결정합니다.",
    concepts: [c("test fidelity", "test environment와 실제 runtime behavior가 일치하는 정도입니다.", ["높을수록 항상 좋은 것은 아닙니다.", "비용과 함께 봅니다."]), c("contract test", "두 boundary가 합의한 request/response/schema/status를 실제 또는 compatible implementation에서 검증합니다.", ["mock call count와 다릅니다.", "consumer/provider drift를 찾습니다."]), c("escaped defect", "test gate를 통과했지만 이후 환경이나 사용자에게 발견된 결함입니다.", ["risk map을 갱신합니다.", "suite 효율 지표입니다."])],
    codeExamples: [node("react43-layer-selector", "risk-to-test-layer selector", "React43LayerSelector.mjs", "browser/network/logic 특성에 따라 가장 낮은 충분 fidelity layer를 고릅니다.", String.raw`function layer(risk) {
  if (risk.browserPolicy || risk.crossPage) return "e2e";
  if (risk.httpContract) return "contract";
  if (risk.providers || risk.domInteraction) return "integration";
  return "unit";
}
const risks = [
  ["parser", {}],
  ["form", { domInteraction: true }],
  ["auth-wiring", { providers: true, httpContract: true }],
  ["status-schema", { httpContract: true }],
  ["history-focus", { browserPolicy: true }],
];
for (const [name, flags] of risks) console.log(name + "=" + layer(flags));`, "parser=unit\nform=integration\nauth-wiring=contract\nstatus-schema=contract\nhistory-focus=e2e", ["rtl-guiding", "playwright-intro", "playwright-isolation", "fetch-standard", "rfc9110"])],
  }),
  appliedTopic({
    id: "render-harness-provider-isolation", title: "Router·store·query·auth를 explicit render harness와 per-test isolation으로 만듭니다",
    lead: "App을 그대로 render하고 global state가 우연히 맞기를 기다리지 않고 test 목적에 필요한 providers와 initial navigation, store state, clock와 network를 fixture가 소유합니다.",
    mechanism: "custom render는 memory/data router, store factory, query client, theme와 error boundary를 test마다 새로 만들고 반환합니다. browser globals와 modules의 singleton state는 beforeEach/reset보다 생성자 injection과 disposable instance를 우선하며 Strict Mode 차이를 명시합니다.",
    workflow: "provider dependency graph를 정렬하고 minimal public fixture builders를 만든 뒤 each test에서 initial route/auth/server state를 선언하며 unmount 후 subscriptions, timers, requests, storage와 DOM을 baseline으로 돌립니다.",
    invariants: "test order와 process reuse에 결과가 의존하지 않고 real credentials/user data가 fixture에 없으며 wrapper가 product authorization/schema failures를 bypass하지 않습니다.",
    edgeCases: "nested router error, persisted store hydration, query retry, fake timer with user-event, Strict Mode double effect, portal container, locale와 multiple roots를 포함합니다.",
    failureModes: "shared query/store instance는 이전 test data를 leak하고 BrowserRouter를 component 안팎에서 중복하면 render가 crash하며 global mocks를 복원하지 않으면 unrelated tests가 통과/실패합니다.",
    verification: "randomized order, repeat N times, parallel workers, unmount leak counters, empty storage/network deny-by-default와 fresh instance identity를 검사합니다.",
    operations: "harness version, fixture seed, leaked handle class와 cleanup duration을 기록하고 payload values는 artifact에서 제거합니다.",
    concepts: [c("render harness", "component를 필요한 providers·router·state와 함께 일관되게 render하는 test factory입니다.", ["test마다 새 instance를 만듭니다.", "public inputs를 노출합니다."]), c("fixture builder", "valid synthetic object를 default로 만들고 필요한 field만 override하는 생성기입니다.", ["schema와 함께 version합니다.", "PII를 쓰지 않습니다."]), c("test isolation", "각 test가 다른 test의 state, storage, network와 time에 영향을 주거나 받지 않는 성질입니다.", ["parallel/repeat로 검증합니다.", "cleanup을 포함합니다."])],
    codeExamples: [node("react43-harness-order", "provider harness dependency ordering", "React43HarnessOrder.mjs", "provider dependencies를 topological order로 만들고 cycle을 gate합니다.", String.raw`const providers = {
  router: [],
  auth: ["router"],
  query: ["auth"],
  feature: ["query"],
};
const built = [];
while (built.length < Object.keys(providers).length) {
  const next = Object.keys(providers).find((name) => !built.includes(name) && providers[name].every((dep) => built.includes(dep)));
  if (!next) throw new Error("provider-cycle");
  built.push(next);
}
console.log("order=" + built.join(">"));
console.log("fresh-instances=true");
console.log("private-fixtures=false");`, "order=router>auth>query>feature\nfresh-instances=true\nprivate-fixtures=false", ["rtl-api", "react-act", "local-app03-app", "local-auth-store"])],
  }),
  appliedTopic({
    id: "semantic-queries-user-events", title: "role·name·label query와 realistic user-event로 accessible behavior를 검증합니다",
    lead: "CSS selector와 test ID로 내부 구조를 고정하지 않고 사용자가 인식하는 role, accessible name, label, text와 상태를 통해 control을 찾고 keyboard/pointer interaction을 await합니다.",
    mechanism: "Testing Library query priority는 role+accessible name, label, text 등 사용자-visible semantics를 선호합니다. current user-event는 setup instance와 async interactions를 사용해 focus, keyboard, pointer와 input event sequence를 더 현실적으로 만들며 get/find/query variants를 presence timing에 맞게 선택합니다.",
    workflow: "control의 semantic contract를 먼저 고치고 getByRole/name으로 initial UI, user.tab/type/click로 action, findByRole/status로 async result, queryByRole로 absence를 검증합니다.",
    invariants: "test가 통과하도록 inaccessible markup을 test ID로 우회하지 않고 awaited interaction과 DOM result를 연결하며 exact implementation class/store action call에 의존하지 않습니다.",
    edgeCases: "duplicate names, hidden content, disabled/readonly, IME, keyboard-only, focus order, async disappearance, live region, portal와 localized text를 포함합니다.",
    failureModes: "getByText는 중복/구조 변화에 취약하고 fireEvent 한 번은 real typing/focus sequence를 생략하며 async user interaction을 await하지 않으면 act warning과 race가 발생합니다.",
    verification: "query priority lint/review, keyboard-only flow, name/role assertions, focus/status, negative hidden/disabled interaction과 current user-event compatibility를 확인합니다.",
    operations: "semantic query fallback/testID 비율, act warnings와 accessibility regressions를 suite quality metric으로 추적합니다.",
    concepts: [c("accessible name", "보조 기술과 semantic query가 control을 식별하는 계산된 이름입니다.", ["visible label과 연결됩니다.", "role과 함께 사용합니다."]), c("web-first query", "DOM이 사용자가 인지할 상태가 될 때까지 의미 기반으로 찾거나 기다리는 query 방식입니다.", ["timing을 표현합니다.", "sleep을 대체합니다."]), c("user-event", "browser의 일반적인 사용자 interaction sequence를 높은 수준에서 시뮬레이션하는 Testing Library 도구입니다.", ["setup/await를 사용합니다.", "real browser와 동일하지는 않습니다."])],
    codeExamples: [node("react43-query-policy", "semantic query policy classifier", "React43QueryPolicy.mjs", "element semantics에 따라 recommended query와 fallback 경고를 분류합니다.", String.raw`function queryFor(element) {
  if (element.role && element.name) return "getByRole";
  if (element.label) return "getByLabelText";
  if (element.text) return "getByText";
  if (element.testId && element.justified) return "getByTestId";
  return "fix-markup";
}
const cases = [
  { role: "button", name: "Save" },
  { label: "Title" },
  { text: "Result" },
  { testId: "canvas", justified: true },
  { testId: "submit" },
];
for (const item of cases) console.log(queryFor(item));`, "getByRole\ngetByLabelText\ngetByText\ngetByTestId\nfix-markup", ["rtl-queries", "user-event-intro", "rtl-intro", "wcag22"])],
  }),
  appliedTopic({
    id: "auth-router-component-integration", title: "auth bootstrap·guard·login·logout·route 복구를 component integration으로 검증합니다",
    lead: "boolean store 하나를 mock하는 대신 unknown bootstrap부터 anonymous redirect, server-confirmed session, intended destination, logout purge와 back navigation까지 user-visible state transition을 검증합니다.",
    mechanism: "integration harness는 synthetic session handler, memory/data router, fresh auth store와 protected/public routes를 조립합니다. loader/guard가 401·403·pending을 구분하고 sign-in form interaction 후 safe internal destination으로 복귀하며 logout이 requests/cache/storage를 정리하는지 관찰합니다.",
    workflow: "anonymous, unknown, authenticated, forbidden, expired와 revoked fixtures를 만들고 direct protected URL에서 시작해 pending→redirect/form→success/deny→logout/back의 DOM·history·server call·state를 assert합니다.",
    invariants: "client store나 persisted hint만 바꿔 server-authorized UI가 되지 않고 return target은 검증되며 credential·authentication secret·identity values가 test logs·snapshots·traces에 남지 않습니다.",
    edgeCases: "slow bootstrap, malformed persistence, 401 then refresh, 403, role downgrade, double submit, safe default redirect, logout failure, late response와 two tabs를 포함합니다.",
    failureModes: "isLoggedIn=true fixture만 쓰면 bootstrap/expiry/deny를 놓치고 API function을 전부 mock하면 Request/status/cookie/abort contract가 테스트되지 않으며 raw error snapshot이 secrets를 노출할 수 있습니다.",
    verification: "server handler request assertions, stable 401/403 UI, pending/focus/status, redirect allow/deny corpus, logout residual scan와 direct HTTP authorization negative를 실행합니다.",
    operations: "journey phase·safe failure code·request count·cleanup residue만 artifact로 남기고 form data, session values와 return query는 redaction합니다.",
    concepts: [c("journey fixture", "여러 components/routes/server responses를 연결한 사용자 시나리오의 synthetic starting state입니다.", ["한 risk를 중심으로 합니다.", "deterministic합니다."]), c("server-confirmed auth", "test handler/server가 session을 검증해 반환한 principal/policy outcome입니다.", ["client flag와 분리합니다.", "401/403을 구분합니다."]), c("residual-state assertion", "logout/unmount 뒤 storage, cache, requests와 DOM에 이전 principal data가 남지 않았는지 확인하는 assertion입니다.", ["account switch를 보호합니다.", "artifacts도 scan합니다."])],
    codeExamples: [node("react43-auth-scenarios", "auth journey scenario matrix", "React43AuthScenarios.mjs", "auth phase와 server outcome을 expected UI/navigation으로 변환합니다.", String.raw`function expected(test) {
  if (test.phase === "unknown") return "pending";
  if (test.server === 401) return "sign-in";
  if (test.server === 403) return "forbidden";
  if (test.logout) return "public-clean";
  return "protected";
}
const cases = [
  { phase: "unknown", server: 200 },
  { phase: "anonymous", server: 401 },
  { phase: "authenticated", server: 403 },
  { phase: "authenticated", server: 200 },
  { phase: "authenticated", server: 200, logout: true },
];
for (const item of cases) console.log(expected(item));`, "pending\nsign-in\nforbidden\nprotected\npublic-clean", ["local-app03-app", "local-auth-store", "local-app03-package", "msw-docs", "rtl-api", "user-event-intro", "owasp-authorization"])],
  }),
  appliedTopic({
    id: "crud-network-contract-integration", title: "Guestbook CRUD를 MSW 또는 disposable server의 실제 HTTP contract로 검증합니다",
    lead: "axios/fetch function call count가 아니라 form input에서 Request, status/schema, optimistic/pending UI, server-confirmed entity와 cache reconciliation까지 boundary를 관찰합니다.",
    mechanism: "MSW는 request-client 내부를 mock하지 않고 network boundary에서 method/path/headers/body와 Response를 제어합니다. parser, CORS/cache/stream처럼 실제 server behavior가 중요한 경우 disposable HTTP server를 사용하고 동일 contract fixture를 재사용합니다.",
    workflow: "list/create/update/delete별 method, safe fields, auth, status, schema, version/idempotency와 failure matrix를 정의하고 default handlers는 unexpected request를 fail하며 test별 handler override로 slow/invalid/denied/conflict를 주입합니다.",
    invariants: "test response가 production schema를 임의로 단순화하지 않고 writer/owner/token/secret을 실제 값으로 쓰지 않으며 성공 UI는 confirmed response/readback 전에 확정되지 않습니다.",
    edgeCases: "empty list, malformed JSON, 204, 401/403, 404, 409/412, 422, 429/503, abort, duplicate submit, late list response와 delete focus fallback을 포함합니다.",
    failureModes: "API module을 jest.fn으로 바꾸면 serialization/status/abort를 놓치고 permissive wildcard handler는 wrong endpoint도 성공시키며 every-test fixed delay는 suite를 느리고 flaky하게 합니다.",
    verification: "unexpected network deny, request body allowlist, response schema, status mapping, optimistic rollback/rebase, cache readback, keyboard/status와 server-side authorization을 검사합니다.",
    operations: "scenario code, request count/order, response class와 leaked handler/open socket만 기록하고 payload와 authorization header를 artifact에서 제외합니다.",
    concepts: [c("network boundary mock", "application의 실제 request code를 유지하면서 transport 경계에서 request/response를 가로채는 test double입니다.", ["client-agnostic입니다.", "unexpected requests를 거부합니다."]), c("disposable server", "test run 동안만 실제 HTTP socket/protocol을 제공하고 종료되는 isolated server입니다.", ["protocol fidelity가 높습니다.", "cleanup을 검증합니다."]), c("contract fixture", "method, request schema, status와 response schema의 합의된 synthetic examples입니다.", ["consumer/provider가 공유할 수 있습니다.", "version을 고정합니다."])],
    codeExamples: [node("react43-http-matrix", "CRUD HTTP contract scenario matrix", "React43HttpMatrix.mjs", "operation/status별 UI와 retry policy를 stable result로 분류합니다.", String.raw`function result(op, status) {
  if (status >= 200 && status < 300) return op + ":confirmed";
  if (status === 401) return op + ":reauth";
  if (status === 403) return op + ":forbidden";
  if (status === 409 || status === 412) return op + ":conflict";
  if (status === 422) return op + ":field-errors";
  if (status === 503) return op + ":retry-budget";
  return op + ":failed";
}
for (const item of [["list", 200], ["create", 422], ["update", 412], ["delete", 403], ["list", 503]]) {
  console.log(result(item[0], item[1]));
}`, "list:confirmed\ncreate:field-errors\nupdate:conflict\ndelete:forbidden\nlist:retry-budget", ["local-guestbook-page", "local-app03-package", "msw-docs", "fetch-standard", "rfc9110", "owasp-authorization"])],
  }),
  appliedTopic({
    id: "deterministic-async-time-race", title: "async·timer·abort·race를 controllable deferred work로 deterministic하게 만듭니다",
    lead: "sleep과 운 좋은 response order에 기대지 않고 promise resolution, timer, request signal과 current generation을 test가 명시적으로 진행시켜 모든 permutation을 재현합니다.",
    mechanism: "deferred promise는 resolve/reject 시점을 test가 소유하고 fake clock은 debounce/backoff/expiry를 advance합니다. user-event와 fake timers는 documented advanceTimers option을 맞추며 AbortController와 request generation을 관찰해 stale completion이 commit되지 않는지 검사합니다.",
    workflow: "작업 A/B를 시작하고 pending UI를 assert한 뒤 B success→A late success, A abort→B failure 같은 순서를 단계별로 release하며 microtasks/timers를 API 기반으로 flush하고 최종 state와 cleanup을 확인합니다.",
    invariants: "arbitrary real sleep, unawaited interaction, globally frozen time과 implementation-specific task count에 의존하지 않고 abort를 fatal product error로 표시하지 않습니다.",
    edgeCases: "synchronous cache hit, abort before/after headers, timeout after server commit, Strict Mode duplicate start, retry timer, logout/account switch와 unmount를 포함합니다.",
    failureModes: "waitFor 안에서 side effect를 반복하면 request가 여러 번 발생하고 fake timer만 돌려 pending promise를 놓치며 catch-all assertion은 stale commit을 숨깁니다.",
    verification: "all completion-order permutations, signal aborted flag, generation commit/discard, timer/listener baseline, repeat/parallel runs와 no-open-handles를 실행합니다.",
    operations: "seed, virtual time, transition sequence, abort/stale-discard와 leaked handles를 failure artifact에 기록합니다.",
    concepts: [c("deferred promise", "resolve/reject 함수를 test가 보유해 async completion 순서를 제어하는 promise입니다.", ["race fixture에 사용합니다.", "production delay를 흉내 내지 않습니다."]), c("virtual clock", "timer 기반 behavior를 실제 대기 없이 test가 advance하는 시간 모델입니다.", ["Date/timer scope를 명시합니다.", "user-event와 연동합니다."]), c("race permutation", "동시에 시작된 operations의 가능한 completion/cancel 순서 조합입니다.", ["각 final invariant를 검증합니다.", "seed로 재현합니다."])],
    codeExamples: [node("react43-race-permutations", "generation commit race model", "React43RacePermutations.mjs", "completion order별 current generation만 commit되는지 확인합니다.", String.raw`function run(order) {
  let generation = 0;
  let value = "none";
  const starts = ["A", "B"].map((name) => ({ name, generation: ++generation }));
  for (const name of order) {
    const work = starts.find((item) => item.name === name);
    if (work.generation === generation) value = name;
  }
  return value;
}
for (const order of [["A", "B"], ["B", "A"]]) console.log(order.join(">") + "=" + run(order));
console.log("stale-commit=false");`, "A>B=B\nB>A=B\nstale-commit=false", ["react-act", "user-event-options", "rtl-api", "local-guestbook-page"])],
  }),
  appliedTopic({
    id: "playwright-e2e-isolation", title: "Playwright E2E를 isolated browser context와 web-first assertions로 구성합니다",
    lead: "DOM simulation이 증명하지 못하는 real navigation, focus, storage, cookie, download, responsive layout와 browser engine 차이를 핵심 사용자 journey에서 검증합니다.",
    mechanism: "Playwright Test는 test마다 isolated BrowserContext를 제공하고 role/name locators와 auto-retrying web-first assertions를 사용합니다. synthetic server seed/API fixture로 starting state를 만들며 storageState는 reusable secret을 commit하지 않고 run-scoped artifact로 제한합니다.",
    workflow: "journey별 Arrange를 API/database seed로 만들고 action을 user-visible locator로 수행하며 URL/title/focus/status/network/readback을 assert하고 Chromium/WebKit/Firefox와 mobile viewport 중 risk-based projects를 선택합니다.",
    invariants: "test가 다른 test의 account/cache/storage에 의존하지 않고 fixed timeout/sleep을 쓰지 않으며 trace/video/screenshot에 credentials·PII·private endpoint가 남지 않습니다.",
    edgeCases: "direct deep link, reload/back/forward, slow network, popup/new tab, download, responsive nav, touch, third-party outage, service worker와 multi-tab logout을 포함합니다.",
    failureModes: "shared account와 ordered suite는 parallel에서 깨지고 brittle CSS/XPath locator는 refactor에 취약하며 retry로 flaky test를 숨기면 실제 race가 production으로 나갑니다.",
    verification: "fresh context identity, parallel/shard/repeat, three-engine smoke, trace-on-first-retry, server readback, artifact secret scan와 deterministic seed teardown을 실행합니다.",
    operations: "journey/project duration, first-attempt pass, retry/flake, trace size와 cleanup residue를 dashboard에 연결하고 quarantine expiry를 둡니다.",
    concepts: [c("BrowserContext", "cookies, storage와 pages가 분리된 incognito-like Playwright browser session입니다.", ["test isolation에 사용합니다.", "process보다 가볍습니다."]), c("web-first assertion", "locator의 실제 page 상태가 기대에 도달할 때까지 자동 재평가하는 assertion입니다.", ["sleep을 줄입니다.", "timeout budget을 가집니다."]), c("test artifact hygiene", "trace, video, screenshot, report에서 secrets/PII를 배제·redact·retention하는 정책입니다.", ["실패 시 특히 중요합니다.", "CI 접근을 제한합니다."])],
    codeExamples: [node("react43-e2e-isolation", "E2E context and artifact isolation gate", "React43E2eIsolation.mjs", "각 journey의 unique context/seed와 artifact redaction을 검사합니다.", String.raw`const runs = [
  { test: "auth", context: "ctx-1", seed: "seed-1", artifactsRedacted: true },
  { test: "crud", context: "ctx-2", seed: "seed-2", artifactsRedacted: true },
  { test: "navigation", context: "ctx-3", seed: "seed-3", artifactsRedacted: true },
];
const uniqueContexts = new Set(runs.map((run) => run.context)).size === runs.length;
const uniqueSeeds = new Set(runs.map((run) => run.seed)).size === runs.length;
console.log("unique-contexts=" + uniqueContexts);
console.log("unique-seeds=" + uniqueSeeds);
console.log("artifacts-redacted=" + runs.every((run) => run.artifactsRedacted));
console.log("isolation=" + (uniqueContexts && uniqueSeeds ? "pass" : "block"));`, "unique-contexts=true\nunique-seeds=true\nartifacts-redacted=true\nisolation=pass", ["playwright-intro", "playwright-assertions", "playwright-isolation", "local-app02-package", "local-app03-package"])],
  }),
  appliedTopic({
    id: "accessibility-security-negative-tests", title: "접근성과 보안 negative를 component·browser·server tests에 내장합니다",
    lead: "성공 화면의 자동 scan 하나로 끝내지 않고 keyboard, accessible name, focus/status, authorization, redirect, untrusted content와 secret sinks를 각 책임 runtime에서 공격적으로 검증합니다.",
    mechanism: "component tests는 role·accessible name·label·error association과 focus, Playwright+axe는 common detectable violations와 keyboard journey, manual assessment는 context와 reading order를 담당합니다. security tests는 direct HTTP authorization, input·redirect corpus, safe text rendering와 artifact·storage·log scans를 실행합니다.",
    workflow: "WCAG criteria와 threat model을 feature risks에 연결하고 positive/negative fixtures를 만들며 UI hidden control, tampered resource ID, malicious text, expired session과 external return target을 server/browser 양쪽에서 실행합니다.",
    invariants: "automated axe pass를 WCAG conformance로 표현하지 않고 client-hidden UI를 authorization evidence로 사용하지 않으며 attack string 자체가 report/DOM/log에서 위험한 sink로 실행되지 않습니다.",
    edgeCases: "keyboard trap, modal return focus, dynamic status, zoom/reflow, color-only state, XSS-like content, IDOR, CSRF/session expiry, open redirect와 error stack을 포함합니다.",
    failureModes: "snapshot은 accessible name/focus를 놓치고 component mock server는 server authorization을 증명하지 못하며 raw attack payload를 test title/artifact에 남기면 pipeline이 새로운 exposure가 됩니다.",
    verification: "semantic queries, keyboard/screen reader manual checks, automated scan, direct API deny, malicious corpus, DOM/storage/log/trace secret scan와 safe error assertions를 실행합니다.",
    operations: "WCAG criterion/threat ID, route/feature, stable outcome와 remediation owner만 기록하고 raw payload와 identity는 보호합니다.",
    concepts: [c("negative test", "허용되지 않거나 잘못된 입력/행동이 안전하게 거부되는지 검증하는 test입니다.", ["보안·validation에 필수입니다.", "stable failure를 assert합니다."]), c("automated accessibility scan", "규칙으로 탐지 가능한 접근성 문제를 DOM에서 찾는 자동 검사입니다.", ["부분 coverage입니다.", "수동/사용자 검증을 보완합니다."]), c("direct authorization test", "UI를 거치지 않고 server endpoint에 변조된 identity/resource/action을 보내 deny를 확인하는 test입니다.", ["client guard를 우회합니다.", "server control을 증명합니다."])],
    codeExamples: [node("react43-negative-matrix", "accessibility and security negative matrix", "React43NegativeMatrix.mjs", "risk별 required runtime과 expected safe outcome을 출력합니다.", String.raw`const cases = [
  ["missing-label", "component+browser", "violation"],
  ["keyboard-trap", "browser+manual", "violation"],
  ["other-resource-update", "server", "deny"],
  ["external-return-target", "router+server", "safe-default"],
  ["script-like-content", "component+browser", "text-only"],
];
for (const item of cases) console.log(item.join("|"));
console.log("raw-payload-artifacts=false");`, "missing-label|component+browser|violation\nkeyboard-trap|browser+manual|violation\nother-resource-update|server|deny\nexternal-return-target|router+server|safe-default\nscript-like-content|component+browser|text-only\nraw-payload-artifacts=false", ["playwright-a11y", "wcag22", "owasp-wstg", "owasp-authorization", "rtl-queries"])],
  }),
  appliedTopic({
    id: "ci-flake-coverage-release-gate", title: "CI shard·flake triage·coverage와 test evidence retention을 운영합니다",
    lead: "테스트를 한 번 통과시키는 데서 끝내지 않고 어떤 suite가 언제, 어떤 immutable artifact와 environment에서 실행되고 실패가 어떻게 재현·격리·수정되는지 관리합니다.",
    mechanism: "fast deterministic suites는 every change, contract/E2E는 risk-based parallel projects, scheduled broad matrix는 compatibility를 담당합니다. coverage는 line percentage보다 risk requirements와 mutation/branch evidence를 보완하며 retry는 flake 측정용이지 pass 세탁용이 아닙니다.",
    workflow: "lockfile/runtime/browser/server schema를 고정하고 seed와 artifact digest를 기록하며 first-failure logs/trace를 수집해 product failure, test defect, environment outage를 분류하고 quarantine에는 owner/expiry를 둡니다.",
    invariants: "quarantined critical security/accessibility test가 release gate에서 사라지지 않고 retries 후 success를 clean pass로 집계하지 않으며 reports에 credentials/private payloads가 없습니다.",
    edgeCases: "parallel port collision, clock/timezone/locale, browser update, dependency drift, intermittent provider, disk quota, cancelled CI와 rerun on new commit을 포함합니다.",
    failureModes: "random rerun은 race를 숨기고 broad snapshot coverage는 behavior 공백을 감추며 unbounded traces/videos는 비용·privacy·retention 위험을 만듭니다.",
    verification: "examples exact, randomized/repeat/shard, mutation sample, first-attempt rate, quarantine expiry, artifact redaction, clean-room rerun와 rollback smoke를 실행합니다.",
    operations: "duration/queue, first-pass, flake, failure yield, quarantine age, escaped defect와 artifact retention을 owner·SLO·runbook에 연결합니다.",
    concepts: [c("first-attempt pass rate", "retry 전 첫 실행에서 성공한 test 비율입니다.", ["flake를 숨기지 않습니다.", "suite health를 봅니다."]), c("quarantine", "flaky test를 제한적으로 격리하되 owner·원인·expiry와 risk 대체 gate를 둔 상태입니다.", ["영구 skip이 아닙니다.", "critical control을 보호합니다."]), c("test evidence retention", "reports, logs, traces, screenshots를 필요한 기간과 접근 범위만 보존하는 정책입니다.", ["privacy와 비용을 제한합니다.", "artifact digest를 유지합니다."])],
    codeExamples: [node("react43-release-gate", "testing release evidence gate", "React43ReleaseGate.mjs", "component·contract·E2E·a11y·security·isolation·artifact evidence를 모두 요구합니다.", String.raw`const evidence = {
  component: true, integration: true, contract: true, e2e: true,
  accessibility: true, securityNegative: true, deterministic: true,
  isolation: true, artifactsRedacted: true, rollbackSmoke: true,
  privateValuesCopied: false,
};
const required = ["component", "integration", "contract", "e2e", "accessibility", "securityNegative", "deterministic", "isolation", "artifactsRedacted", "rollbackSmoke"];
const missing = required.filter((key) => evidence[key] !== true);
console.log("missing=" + (missing.join(",") || "none"));
console.log("private-values-copied=" + evidence.privateValuesCopied);
console.log("release=" + (missing.length === 0 && !evidence.privateValuesCopied ? "pass" : "block"));`, "missing=none\nprivate-values-copied=false\nrelease=pass", ["local-app02-test", "local-app02-setup", "local-app02-package", "local-app03-test", "local-app03-setup", "local-app03-package", "local-app03-app", "local-guestbook-page", "local-auth-store", "react-act", "rtl-intro", "rtl-guiding", "rtl-api", "rtl-queries", "user-event-intro", "user-event-options", "msw-docs", "playwright-intro", "playwright-assertions", "playwright-isolation", "playwright-a11y", "wcag22", "fetch-standard", "rfc9110", "owasp-wstg", "owasp-authorization"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-app02-test", repository: "D:/dev/my-app02", path: "src/App.test.js", usedFor: ["template assertion baseline", "missing product-risk coverage"], evidence: "2026-07-14 read-only sanitized audit: 8 lines, 246 bytes, SHA-256 F7784693194B8657D1BF70C37EA70F4A2D694C4566EC41550A8E650EB600AAA4. actual UI text는 복사하지 않았습니다." },
  { id: "local-app02-setup", repository: "D:/dev/my-app02", path: "src/setupTests.js", usedFor: ["jest-dom-only global setup", "matcher provenance"], evidence: "2026-07-14 read-only sanitized audit: 5 lines, 241 bytes, SHA-256 22583759D0045FDF8D62C9DB0AACBA9FD8BDDDE79C671AA08C97DCFD4E930CC6. external link text는 복사하지 않았습니다." },
  { id: "local-app02-package", repository: "D:/dev/my-app02", path: "package.json", usedFor: ["CRA/Jest/RTL dependency snapshot", "test script and user-event version gap"], evidence: "2026-07-14 read-only sanitized audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. package metadata만 사용하고 private configuration은 없습니다." },
  { id: "local-app03-test", repository: "D:/dev/my-app03", path: "src/App.test.js", usedFor: ["duplicated template assertion", "auth/CRUD/network coverage gap"], evidence: "2026-07-14 read-only sanitized audit: 8 lines, 254 bytes, SHA-256 78EB8F13A8B8CBDCD6F25554F77111A90C9B1E5C128CF84B003C6A821A7F67E5. actual UI text는 복사하지 않았습니다." },
  { id: "local-app03-setup", repository: "D:/dev/my-app03", path: "src/setupTests.js", usedFor: ["jest-dom-only setup", "missing network/router/store reset provenance"], evidence: "2026-07-14 read-only sanitized audit: 5 lines, 246 bytes, SHA-256 C630B70E0F17B0FDDF547079FD2EC64E6D677252588037F873F1008F307F49B9. external link text는 복사하지 않았습니다." },
  { id: "local-app03-package", repository: "D:/dev/my-app03", path: "package.json", usedFor: ["React/Router/Zustand/Axios/RTL dependency snapshot", "test/build script provenance"], evidence: "2026-07-14 read-only sanitized audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. package metadata만 사용하고 endpoint/domain values는 없습니다." },
  { id: "local-app03-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["router/auth bootstrap/provider integration surface", "protected/public route wiring"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. actual routes, storage keys와 user values는 복사하지 않았습니다." },
  { id: "local-guestbook-page", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["async CRUD integration surface", "pending/error/refetch/security test inventory"], evidence: "2026-07-14 read-only sanitized audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. actual user/content/password/route/endpoint values는 복사하지 않았습니다." },
  { id: "local-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["auth state/reset integration surface", "browser-storage cleanup provenance"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. actual storage key와 user fields/values는 복사하지 않았습니다." },
  { id: "react-act", repository: "React official documentation", path: "reference/react/act", publicUrl: "https://react.dev/reference/react/act", usedFor: ["async React update flushing and assertions"], evidence: "React 공식 현행 act API 문서입니다." },
  { id: "rtl-intro", repository: "Testing Library official documentation", path: "react-testing-library/intro", publicUrl: "https://testing-library.com/docs/react-testing-library/intro/", usedFor: ["user-centric React component testing"], evidence: "Testing Library 공식 React Testing Library 소개입니다." },
  { id: "rtl-guiding", repository: "Testing Library official documentation", path: "guiding-principles", publicUrl: "https://testing-library.com/docs/guiding-principles", usedFor: ["implementation-detail avoidance and confidence principle"], evidence: "Testing Library 공식 guiding principles입니다." },
  { id: "rtl-api", repository: "Testing Library official documentation", path: "react-testing-library/api", publicUrl: "https://testing-library.com/docs/react-testing-library/api/", usedFor: ["render wrapper, cleanup and StrictMode options"], evidence: "Testing Library 공식 React API 문서입니다." },
  { id: "rtl-queries", repository: "Testing Library official documentation", path: "queries/about", publicUrl: "https://testing-library.com/docs/queries/about/", usedFor: ["semantic query priority and async query variants"], evidence: "Testing Library 공식 Queries guidance입니다." },
  { id: "user-event-intro", repository: "Testing Library official documentation", path: "user-event/intro", publicUrl: "https://testing-library.com/docs/user-event/intro/", usedFor: ["current setup-based realistic interactions"], evidence: "Testing Library 공식 current user-event 문서이며 local v13 snapshot과 version gap을 명시합니다." },
  { id: "user-event-options", repository: "Testing Library official documentation", path: "user-event/options", publicUrl: "https://testing-library.com/docs/user-event/options/", usedFor: ["fake timer integration and interaction configuration"], evidence: "Testing Library 공식 user-event options 문서입니다." },
  { id: "msw-docs", repository: "Mock Service Worker official documentation", path: "docs", publicUrl: "https://mswjs.io/docs/", usedFor: ["network-boundary request interception and handlers"], evidence: "MSW 공식 current documentation입니다." },
  { id: "playwright-intro", repository: "Playwright official documentation", path: "docs/intro", publicUrl: "https://playwright.dev/docs/intro", usedFor: ["browser E2E runner and project setup"], evidence: "Playwright 공식 현행 introduction입니다." },
  { id: "playwright-assertions", repository: "Playwright official documentation", path: "docs/test-assertions", publicUrl: "https://playwright.dev/docs/test-assertions", usedFor: ["web-first auto-retrying assertions"], evidence: "Playwright 공식 현행 assertions 문서입니다." },
  { id: "playwright-isolation", repository: "Playwright official documentation", path: "docs/browser-contexts", publicUrl: "https://playwright.dev/docs/browser-contexts", usedFor: ["BrowserContext test isolation"], evidence: "Playwright 공식 현행 isolation 문서입니다." },
  { id: "playwright-a11y", repository: "Playwright official documentation", path: "docs/accessibility-testing", publicUrl: "https://playwright.dev/docs/accessibility-testing", usedFor: ["automated accessibility checks and manual limitation"], evidence: "Playwright 공식 accessibility testing guidance입니다." },
  { id: "wcag22", repository: "W3C Web Content Accessibility Guidelines", path: "WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["accessibility conformance criteria and manual checks"], evidence: "W3C Recommendation인 WCAG 2.2입니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "Fetch Standard", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["Request/Response/status/abort protocol behavior"], evidence: "WHATWG Living Standard의 Fetch 규범입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP method/status/idempotency semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "owasp-wstg", repository: "OWASP Web Security Testing Guide", path: "stable", publicUrl: "https://owasp.org/www-project-web-security-testing-guide/stable/", usedFor: ["web security test planning and negative coverage"], evidence: "OWASP 공식 Web Security Testing Guide입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["direct object/action authorization negatives"], evidence: "OWASP 공식 authorization guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-43-mock-local-storage", slug: "react-43-component-integration-e2e-testing", courseId: "react", moduleId: "react-integrated-app-quality", order: 3,
  title: "component·integration·E2E testing", subtitle: "placeholder를 user-centric component, real network contract, isolated browser journey와 security·accessibility release evidence로 교체합니다.",
  level: "고급", estimatedMinutes: 145,
  coreQuestion: "auth·router·CRUD·network가 얽힌 React app을 어떤 test layer와 fixture로 검증해야 빠르고 deterministic하면서도 실제 browser/server failure를 놓치지 않을까요?",
  summary: "my-app02·03의 App.test, setupTests, packages와 my-app03 App·Guestbook·auth store 아홉 files를 read-only·sanitized 감사해 초기 template assertion과 실제 auth/router/CRUD/network surface의 간극을 보존합니다. actual routes, endpoints, users, contents, credentials/tokens와 domains는 복사하지 않습니다. 현행 React, Testing Library/user-event, MSW, Playwright, W3C, WHATWG, IETF와 OWASP 근거로 risk-based layers, isolated harness, semantic interaction, auth/CRUD integration, deterministic race, real-browser E2E, a11y/security negatives와 CI operations를 열 deterministic Node models에 연결합니다.",
  objectives: ["placeholder tests와 product-risk coverage gap을 감사한다.", "unit/component/integration/contract/E2E layer를 risk에 배치한다.", "router/store/query/auth render harness를 per-test로 격리한다.", "semantic queries와 realistic user-event를 적용한다.", "auth bootstrap·guard·logout navigation을 integration-test한다.", "CRUD의 real HTTP status/schema/reconciliation을 검증한다.", "deferred work와 virtual time으로 race를 결정적으로 재현한다.", "Playwright BrowserContext와 web-first assertions로 핵심 journey를 검증한다.", "접근성·authorization·redirect·untrusted content negatives를 내장한다.", "flake, coverage, artifacts와 rollback smoke를 release gate로 운영한다."],
  prerequisites: [{ title: "통합 Guestbook CRUD", reason: "auth-scoped CRUD, server authorization, version conflict, cache reconciliation과 accessible form states를 알아야 meaningful component/integration/E2E contracts를 설계할 수 있습니다.", sessionSlug: "react-42-integrated-guestbook-crud" }],
  keywords: ["React Testing Library", "user-event", "MSW", "Playwright", "component test", "integration test", "contract test", "E2E", "test isolation", "deterministic async", "accessibility testing", "security testing", "flake"],
  topics,
  lab: { title: "placeholder를 production-confidence test portfolio로 교체하기", scenario: "원본 files는 변경하지 않고 synthetic non-sensitive fixtures, disposable HTTP server와 isolated browsers에서 auth→CRUD→navigation→failure→logout journey를 층별로 qualification합니다.", setup: ["Node.js current supported runtime", "React Testing Library current harness", "current user-event setup API", "MSW and disposable HTTP server", "Playwright current browsers", "keyboard/accessibility/security tooling", "deterministic clock/deferred requests", "원본 아홉 files read-only"], steps: ["원본 test/setup/package와 app risk graph, exact hashes를 기록합니다.", "risk-to-layer matrix와 critical journey requirements를 작성합니다.", "fresh router/store/query/auth custom render와 cleanup counters를 만듭니다.", "role/name/label queries와 awaited user-event로 form/navigation component tests를 작성합니다.", "auth bootstrap, 401/403, safe return, logout residual integration tests를 실행합니다.", "Guestbook list/create/update/delete의 request/status/schema/conflict/rollback handlers를 검증합니다.", "abort, timeout, stale response, retry를 deferred work와 virtual time permutations로 재현합니다.", "isolated Playwright contexts에서 deep-link/auth/CRUD/back/reload/three-engine smoke를 실행합니다.", "keyboard/focus/status/axe+manual와 direct authorization/redirect/content negative tests를 수행합니다.", "CI repeat/shard, artifact redaction, first-pass/flake gate와 rollback smoke를 rehearsal합니다."], expectedResult: ["placeholder assertions가 product-risk contracts로 대체됩니다.", "test order/parallel/clock/network와 persisted state에 따른 비결정성이 없습니다.", "auth/CRUD failures와 stale/duplicate operations가 expected DOM/server/cache outcomes로 검증됩니다.", "real browser navigation, focus, storage와 responsive/engine risks가 핵심 journeys에서 증명됩니다.", "security/accessibility negatives와 redacted artifacts, rollback evidence가 release gate에 남습니다."], cleanup: ["synthetic accounts/records, handlers, disposable servers와 browser contexts를 제거합니다.", "stores, queries, storage, timers, requests, listeners와 DOM을 baseline으로 돌립니다.", "traces/videos/screenshots/logs를 redaction·retention policy에 따라 폐기합니다.", "원본 아홉 files의 hash/status unchanged를 확인합니다."], extensions: ["provider-side Spring contract fixtures와 consumer-driven compatibility gate를 추가합니다.", "visual regression을 deterministic fonts/layout/animation policy로 qualification합니다.", "multi-tab/session rotation/service-worker journeys를 확장합니다.", "mutation testing과 escaped-defect 기반 risk coverage dashboard를 구축합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node examples를 실행하고 실제 RTL/MSW/Playwright/server evidence와 대응시키세요.", requirements: ["stdout 완전 일치", "source gap", "layer selector", "provider order", "semantic query", "auth matrix", "HTTP matrix", "race permutation", "browser isolation", "negative matrix", "release gate", "model 한계"], hints: ["Node model이 DOM, React scheduler, HTTP socket, browser storage/focus 또는 server authorization을 증명한다고 표현하지 마세요."], expectedOutcome: "한 product risk가 가장 낮은 충분 fidelity에서 시작해 E2E/readback까지 검증되는 흐름을 설명합니다.", solutionOutline: ["audit→risk/layer→harness/interaction→contract/race→browser/negative→operate 순서입니다."] },
    { difficulty: "응용", prompt: "my-app03 auth와 Guestbook 핵심 journey를 deterministic test portfolio로 재설계하세요.", requirements: ["fresh providers", "semantic interactions", "MSW/default deny", "disposable contract server", "auth/CRUD failures", "abort/race", "Playwright isolation", "a11y/security", "redacted artifacts", "flake policy"], hints: ["API module mock과 happy-path click test만으로 끝내지 마세요."], expectedOutcome: "빠른 local feedback과 실제 browser/server confidence가 겹치지 않고 보완됩니다.", solutionOutline: ["risk inventory→layer contracts→fixtures→faults→E2E/readback→CI 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 frontend test governance를 작성하세요.", requirements: ["risk ownership", "layer capability", "fixtures/isolation", "network contracts", "async determinism", "browser projects", "a11y/security", "coverage/flake", "artifacts/privacy", "SLO/runbook/rollback"], hints: ["coverage percentage보다 escaped defects와 control evidence를 관리하세요."], expectedOutcome: "모든 suite가 비용·탐지력·privacy·release decision에 연결됩니다.", solutionOutline: ["classify→choose fidelity→isolate→fault→measure→reconcile 순서입니다."] },
  ],
  nextSessions: ["react-44-performance-accessibility-resilience"], sources,
  sourceCoverage: { filesRead: 9, filesUsed: 9, uncoveredNotes: ["my-app02·03 App.test/setup/package와 my-app03 App/Guestbook/auth store를 전부 read-only로 읽고 exact lines·bytes·SHA-256를 기록했습니다.", "두 App.test의 template assertion과 setupTests의 jest-dom-only 상태를 숨기지 않았고 auth/CRUD/router/network test coverage가 이미 있다고 주장하지 않습니다.", "local package의 user-event v13 snapshot과 current official v14 guidance를 구분해 migration/compatibility 확인을 요구합니다.", "actual UI text, routes, endpoints, storage keys, user/content/password/token/domain values는 공개 examples와 evidence에 복사하지 않았습니다.", "Node models는 actual React DOM/scheduler, browser, network/server, accessibility tree와 authorization을 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
