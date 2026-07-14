import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuditRefs = ["local-app01-vitals", "local-app02-vitals", "local-app03-vitals", "local-app01-index", "local-app02-index", "local-app03-index", "local-usememo-list", "local-guestbook-page", "local-modern-roadmap", "local-app03-app"];

const topics = [
  appliedTopic({
    id: "source-performance-resilience-audit", title: "원본 metrics·render·list·network·boundary surface를 evidence graph로 감사합니다",
    lead: "web-vitals 파일이 있다는 사실을 실제 field telemetry로 오해하지 않고 어디서 callback이 연결되는지, 어떤 metrics 세대이며 render/list/network/error boundaries가 존재하는지 source에서 확인합니다.",
    mechanism: "세 apps의 reportWebVitals는 dynamic import로 CLS/FID/FCP/LCP/TTFB callbacks를 제공하지만 entry points는 인자 없이 호출해 metrics를 보내지 않습니다. basics에는 useMemo filter example이 있고 Guestbook에는 큰 form/list/async CRUD surface가 있으나 App snapshot에는 route-level error/Suspense resilience가 없습니다. local source는 current INP 기반 guidance보다 오래된 library API를 반영합니다.",
    workflow: "entry point→metric callback→transport, component tree→state subscriptions→render work, bundle imports→chunks, request→pending/error/retry와 route→boundary를 sanitized graph로 만들고 observed fact와 proposed current contract를 분리합니다.",
    invariants: "원본 열 files는 read-only이며 actual routes, user/content/password/token/endpoint/domain values와 raw metric attribution을 공개 fixture에 복사하지 않습니다.",
    edgeCases: "no callback, legacy FID vs current INP, unsupported metric, hidden tab, development Strict Mode, dynamic import failure, large list, slow input, offline와 render crash를 포함합니다.",
    failureModes: "reportWebVitals 파일만 보고 observability가 작동한다고 주장하거나 development render count를 production regression으로 단정하면 잘못된 최적화와 blind production monitoring이 생깁니다.",
    verification: "exact hashes, callback call graph, package metric version, current metric mapping, render/list/network/boundary inventory와 original worktree unchanged를 확인합니다.",
    operations: "metric name/version, route template, release/browser cohort와 safe attribution만 기록하고 raw URL, inputs, user/resource identifiers를 제외합니다.",
    concepts: [c("performance telemetry path", "browser measurement에서 callback, batching, transport와 backend aggregation까지 이어지는 경로입니다.", ["파일 존재만으로 작동하지 않습니다.", "privacy budget을 포함합니다."]), c("metric generation", "같은 목적의 field metric이 정의/API 변화로 교체되는 versioned 계약입니다.", ["FID와 INP를 구분합니다.", "dashboard migration이 필요합니다."]), c("resilience boundary inventory", "render/code/network/storage failures를 어느 boundary가 격리·복구하는지 정리한 graph입니다.", ["missing boundary를 찾습니다.", "error ownership을 명시합니다."])],
    codeExamples: [node("react44-source-audit", "sanitized performance capability inventory", "React44SourceAudit.mjs", "원본에서 관찰한 vitals callback과 performance/resilience gaps를 출력합니다.", String.raw`const observed = {
  dynamicVitalsImport: true,
  callbackConnectedAtEntry: false,
  legacyFidMetric: true,
  currentInpMetric: false,
  memoizedListExample: true,
  asyncCrudSurface: true,
  explicitErrorBoundary: false,
  routeCodeSplitEvidence: false,
};
for (const key of Object.keys(observed).sort()) console.log(key + "=" + observed[key]);
console.log("private-values-copied=false");`, "asyncCrudSurface=true\ncallbackConnectedAtEntry=false\ncurrentInpMetric=false\ndynamicVitalsImport=true\nexplicitErrorBoundary=false\nlegacyFidMetric=true\nmemoizedListExample=true\nrouteCodeSplitEvidence=false\nprivate-values-copied=false", localAuditRefs.concat(["web-vitals-repo", "web-vitals-core", "react-profiler"]))],
  }),
  appliedTopic({
    id: "performance-budgets-measurement", title: "사용자 journey별 performance budget과 baseline을 먼저 고정합니다",
    lead: "빠르게 느껴진다는 인상이나 microbenchmark 한 번이 아니라 startup, navigation, input, list update와 recovery에 허용할 field percentile·lab work·resource budget을 선언합니다.",
    mechanism: "performance budget은 LCP/INP/CLS 같은 outcome, JavaScript/CSS/image bytes와 request count, React commit duration, long tasks와 memory, API latency를 route/journey별로 묶습니다. field p75와 controlled lab trace는 서로 다른 population/evidence를 제공하며 같은 release/cohort로 비교합니다.",
    workflow: "critical journeys와 user/device/network cohorts를 정하고 warm/cold, cache, data size, viewport와 build digest를 고정해 baseline을 수집한 뒤 hypothesis와 expected user impact를 적고 한 change씩 비교합니다.",
    invariants: "평균만으로 tail을 숨기지 않고 development build/extension-loaded browser를 production baseline과 섞지 않으며 performance를 accessibility/content correctness보다 우선해 기능을 제거하지 않습니다.",
    edgeCases: "small/large dataset, low-end device, slow network, cache warm/cold, background tab, locale, zoom, reduced motion, offline와 third-party delay를 포함합니다.",
    failureModes: "한 desktop Lighthouse score를 SLO로 쓰면 real interaction/tail을 놓치고 budget 없이 memo/code split을 추가하면 complexity만 늘거나 waterfall로 더 느려질 수 있습니다.",
    verification: "environment manifest, repeat distribution, p50/p75/p95, before/after confidence, bundle/commit/request attribution와 regression threshold를 review합니다.",
    operations: "route/release/device/network cohort의 low-cardinality aggregates, sample rate, retention와 budget breach owner를 dashboard/alert에 연결합니다.",
    concepts: [c("performance budget", "특정 journey의 outcome/work/resource가 넘지 않아야 할 release 기준입니다.", ["metric과 cohort를 명시합니다.", "rollback trigger가 됩니다."]), c("field measurement", "실제 사용자 환경에서 수집한 performance 관찰값입니다.", ["population bias를 기록합니다.", "privacy를 보호합니다."]), c("lab measurement", "통제된 device/network/data fixture에서 반복 가능한 trace입니다.", ["원인 분석에 유용합니다.", "field를 대체하지 않습니다."])],
    codeExamples: [node("react44-budget-gate", "multi-signal performance budget gate", "React44BudgetGate.mjs", "field percentile, bundle과 commit budget을 모두 평가합니다.", String.raw`const measured = { lcpMs: 2200, inpMs: 170, cls: 0.06, initialJsKb: 185, commitMs: 12 };
const budgets = { lcpMs: 2500, inpMs: 200, cls: 0.1, initialJsKb: 200, commitMs: 16 };
const checks = Object.keys(budgets).map((key) => [key, measured[key] <= budgets[key]]);
for (const [key, ok] of checks) console.log(key + "=" + (ok ? "pass" : "block"));
console.log("release=" + (checks.every(([, ok]) => ok) ? "pass" : "block"));`, "lcpMs=pass\ninpMs=pass\ncls=pass\ninitialJsKb=pass\ncommitMs=pass\nrelease=pass", ["web-vitals-core", "web-inp", "w3c-performance-timeline", "w3c-user-timing", "vite-build"])],
  }),
  appliedTopic({
    id: "react-profiler-render-attribution", title: "React Profiler로 render·commit 비용을 state owner와 interaction에 귀속합니다",
    lead: "render count 자체를 나쁘다고 보지 않고 어떤 update가 어떤 subtree를 왜 render했고 actual/base duration과 commit timing이 user-visible delay에 기여했는지 추적합니다.",
    mechanism: "React Profiler onRender callback은 id, phase, actualDuration, baseDuration, start/commit time을 제공합니다. 개발 도구 Profiler와 production sampling은 build behavior가 다를 수 있으므로 mark/measure와 browser interaction/network timeline을 correlation해 render, layout/paint와 waiting을 구분합니다.",
    workflow: "느린 journey를 재현하고 interaction marker→state action→selector subscribers→component render→commit→paint를 trace하며 largest actual duration과 repeated commits를 source state ownership으로 역추적합니다.",
    invariants: "Profiler 자체 overhead와 development Strict Mode를 기록하고 component props/user data를 telemetry에 넣지 않으며 render가 빠른데 network/DOM paint가 느린 문제를 memo로 숨기지 않습니다.",
    edgeCases: "initial mount/update/nested-update, Suspense reveal, context fan-out, route transition, concurrent interruption, hidden/offscreen tree와 error recovery를 포함합니다.",
    failureModes: "console render count만 줄이면 stale UI/complex memo가 생길 수 있고 flame chart screenshot만 저장하면 release/data/build 조건을 재현할 수 없습니다.",
    verification: "same production-like artifact/data fixture, Profiler callback schema, User Timing correlation, state/selector mutation, before/after distributions와 correctness parity를 확인합니다.",
    operations: "component group ID, phase, duration bucket, release와 interaction type만 sampling하고 props/text/route params는 제외합니다.",
    concepts: [c("React commit", "React가 계산한 변경을 host DOM에 적용하는 단계입니다.", ["render와 구분합니다.", "한 commit에 여러 components가 포함됩니다."]), c("actual duration", "현재 Profiler subtree가 해당 update에서 render하는 데 사용한 추정 시간입니다.", ["baseline과 비교합니다.", "브라우저 paint 전체가 아닙니다."]), c("render attribution", "update 원인과 affected subscribers/subtree를 duration evidence에 연결하는 과정입니다.", ["state owner를 찾습니다.", "추측 memo를 피합니다."])],
    codeExamples: [node("react44-profiler-summary", "Profiler commit aggregation model", "React44ProfilerSummary.mjs", "synthetic commits를 phase별 count와 max duration으로 집계합니다.", String.raw`const commits = [
  { phase: "mount", ms: 9 },
  { phase: "update", ms: 14 },
  { phase: "update", ms: 6 },
  { phase: "nested-update", ms: 4 },
];
for (const phase of ["mount", "update", "nested-update"]) {
  const rows = commits.filter((item) => item.phase === phase);
  console.log(phase + "=count:" + rows.length + ",max:" + Math.max(0, ...rows.map((item) => item.ms)));
}
console.log("raw-props-recorded=false");`, "mount=count:1,max:9\nupdate=count:2,max:14\nnested-update=count:1,max:4\nraw-props-recorded=false", ["react-profiler", "w3c-performance-timeline", "w3c-user-timing", "local-app03-app"])],
  }),
  appliedTopic({
    id: "list-input-state-performance", title: "list·input·selector performance를 identity·work·priority로 최적화합니다",
    lead: "useMemo를 무조건 추가하지 않고 stable entity identity, state locality, selector granularity, expensive calculation과 urgent/non-urgent update를 분해해 keystroke와 CRUD가 필요한 work만 수행하게 합니다.",
    mechanism: "normalized entities와 stable keys는 reconciliation을 돕고 store selectors는 필요한 slice만 subscribe합니다. memo/useMemo/useCallback은 measured repeated work와 stable inputs에만 쓰며 useDeferredValue/useTransition은 non-urgent rendering priority를 낮출 뿐 계산량을 제거하지 않습니다. 큰 list는 pagination/windowing을 검토합니다.",
    workflow: "input event→state write→subscribers→filter/sort→row renders→DOM nodes를 계측하고 derived data를 한 번 계산하며 expensive path를 profile한 뒤 state locality, selector, algorithm, deferred priority, virtualization 순서로 평가합니다.",
    invariants: "입력 value와 accessibility status는 즉시 유지하고 deferred result가 stale임을 표현하며 memo dependency를 누락해 correctness를 희생하지 않고 index key로 render를 억지 최적화하지 않습니다.",
    edgeCases: "empty/large list, rapid IME input, reordered/deleted rows, optimistic pending, same reference mutation, slow device, screen reader virtual cursor와 focus in virtualized row를 포함합니다.",
    failureModes: "모든 callback/value memo는 comparison/retention 비용을 늘리고 deferred value를 debounce/network cancel로 오해하면 stale requests가 남으며 virtualization은 focus/reading order를 깨뜨릴 수 있습니다.",
    verification: "keystroke INP, commit counts/durations, selector subscription count, algorithm complexity, stable key/focus, deferred stale indicator와 no-regression data correctness를 검증합니다.",
    operations: "dataset size bucket, interaction kind, commit/render/DOM count와 abandon을 privacy-safe하게 관찰하고 raw query/content는 수집하지 않습니다.",
    concepts: [c("selector granularity", "store에서 component가 구독하는 state slice의 범위입니다.", ["작을수록 unrelated update를 줄일 수 있습니다.", "equality와 identity가 중요합니다."]), c("deferred rendering", "urgent input을 먼저 반영하고 느린 파생 UI update의 우선순위를 낮추는 방식입니다.", ["work를 제거하지 않습니다.", "stale UI를 표시합니다."]), c("virtualization", "보이는 범위 중심으로 일부 list DOM만 render하는 기법입니다.", ["큰 list에 적용합니다.", "focus/a11y를 qualification합니다."])],
    codeExamples: [node("react44-render-work", "list render-work estimator", "React44RenderWork.mjs", "selector/state locality와 windowing이 affected rows를 어떻게 줄이는지 비교합니다.", String.raw`function work({ rows, affected, broadSubscription, windowSize }) {
  const subscribed = broadSubscription ? rows : affected;
  return Math.min(subscribed, windowSize ?? subscribed);
}
const cases = [
  ["broad", { rows: 1000, affected: 1, broadSubscription: true }],
  ["selector", { rows: 1000, affected: 1, broadSubscription: false }],
  ["windowed-broad", { rows: 1000, affected: 1, broadSubscription: true, windowSize: 30 }],
  ["windowed-selector", { rows: 1000, affected: 1, broadSubscription: false, windowSize: 30 }],
];
for (const [name, input] of cases) console.log(name + "=" + work(input));
`, "broad=1000\nselector=1\nwindowed-broad=30\nwindowed-selector=1", ["react-memo", "react-use-deferred-value", "react-use-transition", "local-usememo-list", "local-guestbook-page"])],
  }),
  appliedTopic({
    id: "bundle-code-split-loading", title: "bundle graph·route code split·lazy/Suspense를 waterfall 없이 설계합니다",
    lead: "initial JavaScript를 줄인 숫자만 보지 않고 어떤 route/interaction이 어떤 chunk를 언제 발견·fetch·evaluate하며 failure에서 어떻게 복구되는지 dependency graph와 budget으로 검증합니다.",
    mechanism: "dynamic import와 React lazy는 component code를 필요 시 loading하고 Suspense fallback을 표시합니다. Vite production build는 optimized chunks/assets를 생성하며 route/framework-level lazy와 preload는 code/data discovery를 병렬화할 수 있습니다. 과도한 작은 chunks는 request/parse overhead와 waterfall을 만듭니다.",
    workflow: "production build manifest와 source map을 안전하게 분석해 initial/shared/route-only dependencies를 분류하고 route criticality·cache reuse·third-party cost에 따라 split point를 정한 뒤 cold/warm navigation을 trace합니다.",
    invariants: "lazy를 component render 안에서 선언해 state를 reset하지 않고 fallback이 accessible layout/focus를 유지하며 chunk load error가 infinite retry/blank page가 되지 않고 source maps에 secrets/source exposure policy를 적용합니다.",
    edgeCases: "cold cache, slow network, deploy between document/chunk request, preload failure, offline cached old chunk, shared vendor duplication, CSS chunk, base path와 rollback을 포함합니다.",
    failureModes: "bundle size만 줄이고 route가 serial code→data waterfall을 만들면 LCP가 악화되고 giant vendor chunk는 작은 change에도 cache invalidation을 넓히며 random manualChunks는 coupling을 숨깁니다.",
    verification: "manifest/digest, initial/route bytes, duplicate modules, request waterfall, parse/evaluate time, fallback/focus, chunk 404/new deploy recovery와 rollback artifact를 검사합니다.",
    operations: "chunk logical ID, bytes/cache hit/load error/release만 관찰하고 source path/query/user route params는 공개 telemetry에서 제외합니다.",
    concepts: [c("code splitting", "application code를 여러 loadable chunks로 나눠 initial 또는 route별 전송량을 조절하는 기법입니다.", ["dependency graph를 봅니다.", "waterfall을 피합니다."]), c("lazy component", "처음 render될 때 module loading을 시작하는 React component declaration입니다.", ["module scope에 선언합니다.", "Suspense가 필요합니다."]), c("chunk skew", "old document/runtime가 새 배포에서 삭제되거나 이름이 달라진 chunk를 요청하는 version 불일치입니다.", ["immutable retention/refresh UX가 필요합니다.", "rollback에서 시험합니다."])],
    codeExamples: [node("react44-chunk-budget", "route chunk dependency budget model", "React44ChunkBudget.mjs", "initial/shared/route chunks의 unique bytes와 waterfall depth를 계산합니다.", String.raw`const chunks = {
  core: { kb: 90, deps: [] },
  shared: { kb: 45, deps: ["core"] },
  routeA: { kb: 35, deps: ["shared"] },
  routeB: { kb: 50, deps: ["shared"] },
};
function total(route) {
  const names = ["core", "shared", route];
  return names.reduce((sum, name) => sum + chunks[name].kb, 0);
}
console.log("initial-kb=" + chunks.core.kb);
console.log("routeA-total-kb=" + total("routeA"));
console.log("routeB-total-kb=" + total("routeB"));
console.log("max-depth=3");`, "initial-kb=90\nrouteA-total-kb=170\nrouteB-total-kb=185\nmax-depth=3", ["react-lazy", "react-suspense", "vite-build", "vite-performance", "local-modern-roadmap"])],
  }),
  appliedTopic({
    id: "current-web-vitals-field-attribution", title: "LCP·INP·CLS와 supporting metrics를 current field contract로 운영합니다",
    lead: "legacy FID callback을 그대로 유지하지 않고 현재 Core Web Vitals의 metric definitions, lifecycle, attribution과 field aggregation을 versioned schema로 관리합니다.",
    mechanism: "LCP는 loading paint, INP는 page lifetime interaction responsiveness, CLS는 unexpected layout instability를 대표합니다. TTFB/FCP는 diagnosis를 돕습니다. web-vitals library의 current callbacks와 attribution build를 검토하고 metric ID/navigation type/version을 batching하며 p75 cohort로 평가합니다.",
    workflow: "metric schema와 library version을 고정하고 visibility/page lifecycle flush, sample rate, consent/privacy, route template와 release cohort를 정하며 poor samples에서 Performance Timeline/Profiler/network를 safe correlation합니다.",
    invariants: "FID와 INP를 같은 series로 합치지 않고 unsupported/no-interaction을 zero로 기록하지 않으며 raw URL, element text/selectors, user ID와 free-form attribution을 전송하지 않습니다.",
    edgeCases: "SPA soft navigation, bfcache restore, background tab, no interaction, cross-origin frame, long-lived page, prerender, multiple metric updates와 offline batching을 포함합니다.",
    failureModes: "console callback만 연결해 telemetry라 부르거나 metric finalization/lifecycle을 놓치면 biased data가 되고 high-cardinality element/URL attribution은 privacy·cost 문제를 만듭니다.",
    verification: "library/current metric mapping, synthetic poor/good interactions, visibility flush, duplicate metric ID, schema/version, redaction/cardinality, backend p75와 dashboard migration을 검증합니다.",
    operations: "metric name/version/value bucket, route template, release, device/network cohort와 safe cause code를 retention/sample budget 안에서 운영합니다.",
    concepts: [c("Core Web Vitals", "loading, responsiveness와 visual stability의 핵심 field experience metrics 집합입니다.", ["현재 LCP·INP·CLS를 구분합니다.", "정의/version을 기록합니다."]), c("INP", "page 전 생애의 click/tap/keyboard interactions 중 전반적 responsiveness를 나타내는 field metric입니다.", ["FID와 다릅니다.", "interaction 없는 page를 구분합니다."]), c("metric attribution", "poor metric에 기여한 timing/resource/render category를 safe metadata로 연결하는 정보입니다.", ["raw element/user data를 제한합니다.", "원인 분석에 씁니다."])],
    codeExamples: [node("react44-vitals-schema", "versioned Web Vitals event sanitizer", "React44VitalsSchema.mjs", "current metrics만 허용하고 route/value를 bounded schema로 정규화합니다.", String.raw`const allowed = new Set(["LCP", "INP", "CLS", "TTFB", "FCP"]);
function sanitize(event) {
  if (!allowed.has(event.name) || !Number.isFinite(event.value) || event.value < 0) return "reject";
  return [event.name, Math.round(event.value * 1000) / 1000, event.routeTemplate, event.release].join("|");
}
const events = [
  { name: "INP", value: 180.25, routeTemplate: "workspace-item", release: "r1" },
  { name: "CLS", value: 0.0756, routeTemplate: "workspace-item", release: "r1" },
  { name: "FID", value: 30, routeTemplate: "workspace-item", release: "r1" },
  { name: "LCP", value: -1, routeTemplate: "workspace-item", release: "r1" },
];
for (const event of events) console.log(sanitize(event));`, "INP|180.25|workspace-item|r1\nCLS|0.076|workspace-item|r1\nreject\nreject", ["web-vitals-repo", "web-vitals-core", "web-inp", "w3c-performance-timeline", "local-app01-vitals", "local-app02-vitals", "local-app03-vitals", "local-app01-index", "local-app02-index", "local-app03-index"])],
  }),
  appliedTopic({
    id: "error-boundary-suspense-recovery", title: "Error Boundary·Suspense·retry를 independent recovery state로 설계합니다",
    lead: "loading fallback과 error fallback을 같은 spinner/catch로 뭉개지 않고 render/code/data failure가 가장 가까운 boundary에서 안전한 context와 retry/reset/navigation을 제공하게 합니다.",
    mechanism: "Suspense는 supported resource/code가 pending일 때 fallback을 표시하고 lazy rejection/render error는 nearest Error Boundary가 처리합니다. Error Boundary는 event handler, arbitrary async error와 server/API authorization을 자동 처리하지 않으므로 route/data layer typed failures와 연결합니다.",
    workflow: "tree에 root safety net과 feature/route boundaries를 배치하고 pending, expected empty/validation/denied, recoverable transient와 fatal unknown을 분류해 retry key, back/safe navigation, reset scope와 focus/status를 정의합니다.",
    invariants: "boundary가 raw Error stack, response body, token/user data를 UI/telemetry에 노출하지 않고 retry가 unbounded loop나 duplicate mutation을 만들지 않으며 unaffected layout/state를 최대한 보존합니다.",
    edgeCases: "lazy chunk reject, render crash, boundary itself crash, Suspense promise reject, event handler error, offline, server 503, stale deploy와 partial data를 포함합니다.",
    failureModes: "root boundary 하나는 전체 app을 제거하고 Suspense를 generic data fetch에 임의 적용하면 unsupported promise behavior를 가정하며 catch 후 null은 silent blank UI를 만듭니다.",
    verification: "failure origin×boundary matrix, safe error taxonomy, retry/reset counts, focus/status/keyboard, lazy chunk skew, mutation idempotency와 root fallback을 시험합니다.",
    operations: "boundary/route ID, safe error class, retry/reset/outcome, release와 correlation만 기록하고 stack은 access-controlled server sink로 제한합니다.",
    concepts: [c("Error Boundary", "descendant render lifecycle 오류를 포착해 fallback UI를 렌더하는 React class boundary입니다.", ["모든 async/event error를 잡지 않습니다.", "tree isolation을 제공합니다."]), c("Suspense fallback", "supported child가 준비되지 않았을 때 가까운 Suspense가 표시하는 대체 UI입니다.", ["error fallback과 다릅니다.", "layout/focus를 설계합니다."]), c("reset scope", "retry나 navigation에서 어떤 subtree state/cache/error를 새로 생성할지 정한 범위입니다.", ["unaffected state를 보존합니다.", "key/version과 연결합니다."])],
    codeExamples: [node("react44-recovery-policy", "failure-to-boundary recovery classifier", "React44RecoveryPolicy.mjs", "failure 종류별 UI, retry와 reset scope를 결정합니다.", String.raw`const policies = {
  pending: ["skeleton", "none", "none"],
  validation: ["inline-errors", "user-edit", "form"],
  forbidden: ["access-message", "none", "route"],
  transient: ["retry-panel", "bounded", "feature"],
  render: ["safe-fallback", "manual", "subtree"],
  unknown: ["root-fallback", "manual", "app"],
};
for (const kind of Object.keys(policies)) console.log(kind + "=" + policies[kind].join("|"));`, "pending=skeleton|none|none\nvalidation=inline-errors|user-edit|form\nforbidden=access-message|none|route\ntransient=retry-panel|bounded|feature\nrender=safe-fallback|manual|subtree\nunknown=root-fallback|manual|app", ["react-error-boundary", "react-suspense", "react-lazy", "vite-build", "local-app03-app"])],
  }),
  appliedTopic({
    id: "offline-degraded-ux", title: "offline·slow·partial outage를 truthful degraded UX와 reconciliation으로 처리합니다",
    lead: "navigator online boolean이나 generic retry button에 의존하지 않고 operation별 capability, cached freshness, pending durability와 server commit uncertainty를 사용자에게 정확히 표현합니다.",
    mechanism: "browser online state는 network reachability의 hint일 뿐 endpoint availability를 증명하지 않습니다. read는 last-known cache와 age/source, write는 local draft/pending/queued/unknown-commit를 구분하고 Service Worker/cache 전략은 auth scope, version, storage quota와 update lifecycle을 가집니다.",
    workflow: "feature capability matrix에서 offline read/write, stale limit, queue/idempotency, conflict, retry deadline, discard/export와 reconnect revalidation을 정의하고 slow/timeout/DNS/503/partial endpoint faults를 주입합니다.",
    invariants: "cached data를 current server truth로 표시하지 않고 sensitive/user-scoped response를 shared cache에 저장하지 않으며 timeout 뒤 mutation을 자동 duplicate retry하지 않고 authentication/version을 reconnect에서 재검증합니다.",
    edgeCases: "false online, flaky network, offline reload, expired auth, quota/corrupt cache, service-worker old schema, two tabs, queued delete after revoke와 server committed after timeout을 포함합니다.",
    failureModes: "online event만 믿으면 captive portal/partial outage를 놓치고 모든 writes를 queue하면 stale 권한으로 나중에 실행되며 offline fallback이 blank/keyboard trap이면 기능은 있어도 사용할 수 없습니다.",
    verification: "network fault matrix, cache age/source label, offline/reload, queue replay authorization/version/idempotency, quota, service-worker update/rollback, keyboard/status와 server readback을 실행합니다.",
    operations: "capability mode, cache age bucket, queue length/age, reconnect/reconcile result와 storage pressure를 privacy-safe하게 관찰합니다.",
    concepts: [c("degraded mode", "일부 dependency failure에서도 제한된 기능과 정확한 상태 설명을 제공하는 operating mode입니다.", ["capability를 명시합니다.", "정상처럼 가장하지 않습니다."]), c("unknown commit", "client가 response를 받지 못해 server mutation 성공 여부를 알 수 없는 상태입니다.", ["readback/idempotency로 합의합니다.", "blind retry를 피합니다."]), c("offline reconciliation", "재연결 뒤 cached/local pending과 current server/auth/version을 비교해 합의하는 절차입니다.", ["conflict UX가 필요합니다.", "queue를 무조건 재생하지 않습니다."])],
    codeExamples: [node("react44-degraded-mode", "network/cache capability decision model", "React44DegradedMode.mjs", "connectivity, cache age와 operation 종류에 따라 truthful capability를 결정합니다.", String.raw`function mode(input) {
  if (input.online && input.endpointOk) return "online";
  if (input.operation === "read" && input.cacheAgeMin <= 30) return "stale-read";
  if (input.operation === "write" && input.draftSafe) return "local-draft";
  return "unavailable";
}
const cases = [
  { online: true, endpointOk: true, operation: "read", cacheAgeMin: 0 },
  { online: true, endpointOk: false, operation: "read", cacheAgeMin: 10 },
  { online: false, endpointOk: false, operation: "write", draftSafe: true },
  { online: false, endpointOk: false, operation: "read", cacheAgeMin: 90 },
];
for (const item of cases) console.log(mode(item));`, "online\nstale-read\nlocal-draft\nunavailable", ["html-system-state", "service-workers", "fetch-standard", "rfc9110", "local-guestbook-page"])],
  }),
  appliedTopic({
    id: "accessibility-performance-resilience", title: "성능·접근성·resilience를 같은 user outcome budget으로 검증합니다",
    lead: "빠른 화면, 접근 가능한 화면, 실패를 복구하는 화면을 서로 trade-off하는 별도 checklist로 보지 않고 keyboard/assistive technology/slow device/network에서 task completion을 함께 측정합니다.",
    mechanism: "skeleton과 lazy UI는 layout stability, semantic structure와 focus preservation을 지켜야 하고 virtualization/deferred update는 reading order와 status를 유지해야 합니다. timeout, animation과 retry는 WCAG의 충분한 시간, motion, status, focus 기준과 degraded capability를 함께 반영합니다.",
    workflow: "critical task마다 device/network, keyboard/screen reader, zoom/reduced motion, slow/pending/error/offline을 교차해 completion, INP/LCP/CLS, focus path, announcements와 recovery success를 측정합니다.",
    invariants: "performance를 위해 labels/headings/live regions를 제거하지 않고 accessibility overlay를 별도 late-loaded dependency로 미루지 않으며 loading/error UI가 focusable controls와 task context를 예고 없이 없애지 않습니다.",
    edgeCases: "slow screen reader navigation, 400% zoom, high contrast, reduced motion, virtualized focused row, streamed reveal, repeated status, time limit와 low-memory device를 포함합니다.",
    failureModes: "visual spinner만 빠르게 표시해도 screen reader에는 silent하고 skeleton dimensions가 달라 CLS/focus loss가 생기며 aggressive debounce는 keyboard 입력과 status feedback을 지연합니다.",
    verification: "keyboard/screen reader/manual WCAG, automated checks, focus/reading order, zoom/reflow, reduced motion, vitals/commit budgets와 fault recovery를 production-like browser에서 검증합니다.",
    operations: "task completion/abandon, accessibility failure code, performance bucket와 recovery outcome을 aggregate하며 assistive technology/user identity를 추적하지 않습니다.",
    concepts: [c("inclusive performance", "다양한 device, input과 assistive technology 사용자가 task를 완료하는 데 걸리는 실제 경험입니다.", ["metric만이 아닙니다.", "접근성과 함께 측정합니다."]), c("layout stability", "content loading/변화 중 visual positions가 예측 가능하게 유지되는 성질입니다.", ["CLS와 연결됩니다.", "focus context도 보호합니다."]), c("resilient focus", "pending/error/retry/virtualization 변화에도 keyboard focus가 논리적이고 visible한 target에 남거나 복구되는 성질입니다.", ["DOM identity를 설계합니다.", "status와 함께 시험합니다."])],
    codeExamples: [node("react44-inclusive-gate", "inclusive task outcome gate", "React44InclusiveGate.mjs", "성능, keyboard, focus, status와 recovery evidence를 하나의 task gate로 평가합니다.", String.raw`const task = {
  inpMs: 180, inpBudget: 200, cls: 0.05, clsBudget: 0.1,
  keyboardComplete: true, focusPreserved: true, statusAnnounced: true,
  degradedRecovery: true,
};
const checks = {
  interaction: task.inpMs <= task.inpBudget,
  stability: task.cls <= task.clsBudget,
  keyboard: task.keyboardComplete,
  focus: task.focusPreserved,
  status: task.statusAnnounced,
  recovery: task.degradedRecovery,
};
for (const [key, ok] of Object.entries(checks)) console.log(key + "=" + (ok ? "pass" : "block"));
console.log("task=" + (Object.values(checks).every(Boolean) ? "pass" : "block"));`, "interaction=pass\nstability=pass\nkeyboard=pass\nfocus=pass\nstatus=pass\nrecovery=pass\ntask=pass", ["wcag22", "web-vitals-core", "web-inp", "react-use-deferred-value", "react-suspense"])],
  }),
  appliedTopic({
    id: "privacy-observability-release-recovery", title: "privacy-safe observability·canary·rollback으로 performance와 resilience를 운영합니다",
    lead: "개선 전후 dashboard만 보는 데서 끝내지 않고 metric schema, sampling, cardinality, sensitive attribution, canary decision와 code/data/cache reconciliation을 release contract에 연결합니다.",
    mechanism: "client signals는 route template, release/build digest, metric version, bounded device/network cohort와 safe error codes를 batch합니다. source maps/traces는 access-controlled이고 canary는 correctness·a11y·security·performance budgets를 함께 평가하며 rollback은 old chunks/cache/schema/session compatibility를 확인합니다.",
    workflow: "telemetry data classification과 allowlist를 먼저 작성하고 sample/retention/drop policy를 적용하며 baseline→canary→ramp gates와 automatic/manual stop thresholds, immutable artifact, cache purge와 post-rollback readback을 rehearsal합니다.",
    invariants: "raw URL/query/content/DOM text/user/token/endpoint를 metrics에 넣지 않고 low traffic noise를 regression으로 단정하지 않으며 performance success가 errors/a11y/security 악화를 상쇄하지 않습니다.",
    edgeCases: "metric schema drift, ad blocker, offline batch replay, duplicated page lifecycle, low sample, source-map exposure, chunk skew, service-worker cache와 rollback after mutation을 포함합니다.",
    failureModes: "free-form error/selector attribution은 cardinality·privacy를 폭발시키고 average-only canary는 tail regression을 숨기며 code rollback만 하고 cache/queued writes를 방치하면 data divergence가 남습니다.",
    verification: "telemetry schema/redaction, cardinality/sample/retention, synthetic canary, p75 confidence, cross-gate stop, artifact digest, old/new browser/cache와 reconciliation readback을 실행합니다.",
    operations: "budget SLO/error budget, dashboards, alert owner, safe drill-down, canary state와 rollback/reconciliation runbooks를 지속적으로 관리합니다.",
    concepts: [c("privacy-safe attribution", "원인을 분석할 수 있지만 raw user/content/URL을 포함하지 않는 bounded metadata입니다.", ["allowlist를 씁니다.", "retention을 제한합니다."]), c("cross-quality gate", "correctness, security, accessibility, performance와 resilience를 모두 만족해야 진행하는 release 판정입니다.", ["한 metric이 다른 실패를 상쇄하지 않습니다.", "canary에 적용합니다."]), c("rollback reconciliation", "old artifact로 되돌린 뒤 caches, queued operations, sessions와 server data의 호환·합의를 확인하는 절차입니다.", ["code rollback 이후도 포함합니다.", "readback을 요구합니다."])],
    codeExamples: [node("react44-release-gate", "performance accessibility resilience release gate", "React44ReleaseGate.mjs", "vitals, bundle, React work, accessibility, degraded UX, privacy와 rollback evidence를 모두 요구합니다.", String.raw`const evidence = {
  currentVitals: true, bundleBudget: true, renderBudget: true,
  accessibility: true, errorRecovery: true, degradedMode: true,
  telemetryRedacted: true, canary: true, rollback: true,
  privateValuesCopied: false,
};
const required = ["currentVitals", "bundleBudget", "renderBudget", "accessibility", "errorRecovery", "degradedMode", "telemetryRedacted", "canary", "rollback"];
const missing = required.filter((key) => evidence[key] !== true);
console.log("missing=" + (missing.join(",") || "none"));
console.log("private-values-copied=" + evidence.privateValuesCopied);
console.log("release=" + (missing.length === 0 && !evidence.privateValuesCopied ? "pass" : "block"));`, "missing=none\nprivate-values-copied=false\nrelease=pass", ["local-app01-vitals", "local-app02-vitals", "local-app03-vitals", "local-app01-index", "local-app02-index", "local-app03-index", "local-usememo-list", "local-guestbook-page", "local-modern-roadmap", "local-app03-app", "react-profiler", "react-memo", "react-use-deferred-value", "react-use-transition", "react-lazy", "react-suspense", "react-error-boundary", "vite-build", "vite-performance", "web-vitals-repo", "web-vitals-core", "web-inp", "w3c-performance-timeline", "w3c-user-timing", "wcag22", "service-workers", "fetch-standard", "html-system-state", "rfc9110", "owasp-logging"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-app01-vitals", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/reportWebVitals.js", usedFor: ["legacy CLS/FID/FCP/LCP/TTFB callback", "dynamic metric import"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 362 bytes, SHA-256 714851669856152806C289F9AAC6240B414BBAC50C60EE4F7E6247F31EAC0C1C. metric structure만 사용했습니다." },
  { id: "local-app02-vitals", repository: "D:/dev/my-app02", path: "src/reportWebVitals.js", usedFor: ["duplicated legacy metrics callback", "current INP migration gap"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 362 bytes, SHA-256 714851669856152806C289F9AAC6240B414BBAC50C60EE4F7E6247F31EAC0C1C. metric structure만 사용했습니다." },
  { id: "local-app03-vitals", repository: "D:/dev/my-app03", path: "src/reportWebVitals.js", usedFor: ["legacy metrics callback", "dynamic import provenance"], evidence: "2026-07-14 read-only sanitized audit: 13 lines, 375 bytes, SHA-256 5EFBB84CBED52B82CAB1165C816C92390B0A5D752E490CA564172A14E3A84A6D. metric structure만 사용했습니다." },
  { id: "local-app01-index", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/index.js", usedFor: ["metrics callback invocation without handler", "large learning-gallery entry composition"], evidence: "2026-07-14 read-only sanitized audit: 138 lines, 5,999 bytes, SHA-256 6D98AFE2B6BB2FBA346259D2309CF89E07BB12517B1EDCC1A044EB9688120D78. actual UI/routes/domain values는 복사하지 않았습니다." },
  { id: "local-app02-index", repository: "D:/dev/my-app02", path: "src/index.js", usedFor: ["metrics invocation without callback", "root rendering baseline"], evidence: "2026-07-14 read-only sanitized audit: 17 lines, 535 bytes, SHA-256 39F6891BEBCE856CE604EA450F08ACE26FA1B931415985881FBB323F63BA26FB. actual DOM identifier/comment URLs는 복사하지 않았습니다." },
  { id: "local-app03-index", repository: "D:/dev/my-app03", path: "src/index.js", usedFor: ["metrics invocation without callback", "root rendering baseline"], evidence: "2026-07-14 read-only sanitized audit: 17 lines, 552 bytes, SHA-256 10943746C5E810A957D9983E74B9C27E40A819C256AF8B3592FEB1972944E439. actual DOM identifier/comment URLs는 복사하지 않았습니다." },
  { id: "local-usememo-list", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/pages/step11-hook/UseMemo04.jsx", usedFor: ["memoized filter learning example", "input/list performance provenance"], evidence: "2026-07-14 read-only sanitized audit: 31 lines, 1,028 bytes, SHA-256 986714249C94F5DE7F1555F58E7ADE3AD79F87091222F2321CA576F0BEB9B29E. actual list/query/UI values는 복사하지 않았습니다." },
  { id: "local-guestbook-page", repository: "D:/dev/my-app03", path: "src/pages/GuestBookPage.jsx", usedFor: ["large form/list/CRUD render surface", "async failure and degraded-state inventory"], evidence: "2026-07-14 read-only sanitized audit: 253 lines, 10,636 bytes, SHA-256 40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077. actual user/content/password/route/endpoint values는 복사하지 않았습니다." },
  { id: "local-modern-roadmap", repository: "D:/dev/REACT", path: "docs/react/12-modern-react-roadmap.md", usedFor: ["CRA preservation/current migration context", "effects, network states, accessibility and Vite roadmap"], evidence: "2026-07-14 read-only sanitized audit: 204 lines, 9,672 bytes, SHA-256 123B645573BF48E3FC576514D2A7EDC4F80D56702BD23D79F75072167D959DAD. actual local/demo URLs와 domain strings는 복사하지 않았습니다." },
  { id: "local-app03-app", repository: "D:/dev/my-app03", path: "src/App.js", usedFor: ["route/auth tree and missing explicit error/Suspense boundaries", "bundle surface provenance"], evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. actual routes, storage keys와 user values는 복사하지 않았습니다." },
  { id: "react-profiler", repository: "React official documentation", path: "reference/react/Profiler", publicUrl: "https://react.dev/reference/react/Profiler", usedFor: ["onRender phases and duration attribution"], evidence: "React 공식 현행 Profiler API 문서입니다." },
  { id: "react-memo", repository: "React official documentation", path: "reference/react/memo", publicUrl: "https://react.dev/reference/react/memo", usedFor: ["measured component memoization contract"], evidence: "React 공식 현행 memo API 문서입니다." },
  { id: "react-use-deferred-value", repository: "React official documentation", path: "reference/react/useDeferredValue", publicUrl: "https://react.dev/reference/react/useDeferredValue", usedFor: ["non-urgent deferred rendering"], evidence: "React 공식 현행 useDeferredValue API 문서입니다." },
  { id: "react-use-transition", repository: "React official documentation", path: "reference/react/useTransition", publicUrl: "https://react.dev/reference/react/useTransition", usedFor: ["transition priority and pending state"], evidence: "React 공식 현행 useTransition API 문서입니다." },
  { id: "react-lazy", repository: "React official documentation", path: "reference/react/lazy", publicUrl: "https://react.dev/reference/react/lazy", usedFor: ["lazy component code loading and rejection"], evidence: "React 공식 현행 lazy API 문서입니다." },
  { id: "react-suspense", repository: "React official documentation", path: "reference/react/Suspense", publicUrl: "https://react.dev/reference/react/Suspense", usedFor: ["loading fallback and reveal semantics"], evidence: "React 공식 현행 Suspense API 문서입니다." },
  { id: "react-error-boundary", repository: "React official documentation", path: "reference/react/Component#error-boundary", publicUrl: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary", usedFor: ["render error boundary scope and fallback"], evidence: "React 공식 Component 문서의 Error Boundary guidance입니다." },
  { id: "vite-build", repository: "Vite official documentation", path: "guide/build", publicUrl: "https://vite.dev/guide/build", usedFor: ["production build, chunks, base and load errors"], evidence: "Vite 공식 현행 production build 문서입니다." },
  { id: "vite-performance", repository: "Vite official documentation", path: "guide/performance", publicUrl: "https://vite.dev/guide/performance", usedFor: ["build/dev performance diagnosis"], evidence: "Vite 공식 현행 performance guidance입니다." },
  { id: "web-vitals-repo", repository: "GoogleChrome web-vitals official repository", path: "README", publicUrl: "https://github.com/GoogleChrome/web-vitals", usedFor: ["current library callbacks and attribution builds"], evidence: "web-vitals 공식 source repository와 API README입니다." },
  { id: "web-vitals-core", repository: "web.dev official guidance", path: "articles/vitals", publicUrl: "https://web.dev/articles/vitals", usedFor: ["current Core Web Vitals definitions and thresholds"], evidence: "Google web.dev의 current Web Vitals guidance입니다." },
  { id: "web-inp", repository: "web.dev official guidance", path: "articles/inp", publicUrl: "https://web.dev/articles/inp", usedFor: ["INP lifecycle, field and attribution behavior"], evidence: "Google web.dev의 current INP guidance입니다." },
  { id: "w3c-performance-timeline", repository: "W3C Performance Timeline", path: "performance-timeline", publicUrl: "https://www.w3.org/TR/performance-timeline/", usedFor: ["PerformanceEntry and PerformanceObserver primitives"], evidence: "W3C Performance Timeline specification입니다." },
  { id: "w3c-user-timing", repository: "W3C User Timing", path: "user-timing", publicUrl: "https://www.w3.org/TR/user-timing/", usedFor: ["mark/measure instrumentation"], evidence: "W3C User Timing specification입니다." },
  { id: "wcag22", repository: "W3C Web Content Accessibility Guidelines", path: "WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["keyboard, focus, timing, status, reflow and motion criteria"], evidence: "W3C Recommendation인 WCAG 2.2입니다." },
  { id: "service-workers", repository: "W3C Service Workers", path: "service-workers", publicUrl: "https://www.w3.org/TR/service-workers/", usedFor: ["offline interception, cache and update lifecycle"], evidence: "W3C Service Workers specification입니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "Fetch Standard", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["network/abort/response behavior"], evidence: "WHATWG Living Standard의 Fetch 규범입니다." },
  { id: "html-system-state", repository: "WHATWG HTML Living Standard", path: "system-state.html", publicUrl: "https://html.spec.whatwg.org/multipage/system-state.html", usedFor: ["online/offline browser state limitations"], evidence: "WHATWG HTML Living Standard의 system state 규범입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP status/retry/cache-related semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["sensitive telemetry exclusion and logging operations"], evidence: "OWASP 공식 logging guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-44-component-testing", slug: "react-44-performance-accessibility-resilience", courseId: "react", moduleId: "react-integrated-app-quality", order: 4,
  title: "성능·접근성·error resilience", subtitle: "Profiler·current Web Vitals·bundle·list/input work를 accessible pending/error/offline recovery와 privacy-safe release gates로 통합합니다.",
  level: "고급", estimatedMinutes: 145,
  coreQuestion: "React app을 빠르게 만드는 최적화가 keyboard·assistive technology·slow/offline 사용자와 실패 복구를 해치지 않으면서 실제 field outcome으로 증명되려면 무엇을 측정하고 운영해야 할까요?",
  summary: "my-app01~03 reportWebVitals/index, useMemo list, Guestbook page, modern roadmap와 my-app03 App 열 files를 read-only·sanitized 감사해 legacy FID callback, unconnected metrics path, list/CRUD surface와 missing explicit error/Suspense boundaries를 보존합니다. actual routes, users, contents, credentials/tokens, endpoints/domains와 raw metric attribution은 복사하지 않습니다. 현행 React, Vite, web-vitals/web.dev, W3C, WHATWG, IETF와 OWASP 근거로 budgets, Profiler attribution, list/input priority, code split, LCP/INP/CLS, error/Suspense, offline degraded UX, inclusive performance와 privacy-safe canary/rollback을 열 deterministic Node models에 연결합니다.",
  objectives: ["원본 metric/render/list/network/boundary 상태를 current contract와 비교한다.", "journey별 field/lab/work/resource performance budgets를 정의한다.", "Profiler commit을 interaction·state owner에 귀속한다.", "list/input work를 identity·selector·priority·windowing으로 최적화한다.", "bundle graph와 route code split을 waterfall/chunk skew까지 검증한다.", "LCP·INP·CLS current field schema와 legacy FID migration을 운영한다.", "Error Boundary·Suspense·retry/reset scope를 설계한다.", "offline/partial outage를 truthful degraded UX와 reconciliation으로 처리한다.", "성능·접근성·resilience를 같은 task outcome으로 검증한다.", "privacy-safe telemetry, canary와 rollback을 cross-quality gate로 운영한다."],
  prerequisites: [{ title: "component·integration·E2E testing", reason: "component/browser/server fidelity, deterministic faults, accessibility/security negatives와 CI evidence를 알아야 performance/resilience 개선을 regression 없이 qualification할 수 있습니다.", sessionSlug: "react-43-component-integration-e2e-testing" }],
  keywords: ["React Profiler", "Web Vitals", "INP", "LCP", "CLS", "bundle budget", "code splitting", "lazy", "Suspense", "Error Boundary", "useDeferredValue", "virtualization", "offline", "degraded UX", "privacy observability"],
  topics,
  lab: { title: "inclusive performance·resilience production qualification", scenario: "원본 files는 변경하지 않고 synthetic datasets, production-like build, controlled browsers/networks와 disposable API를 사용해 fast/slow/offline/error/rollback journeys를 같은 evidence chain으로 검증합니다.", setup: ["Node.js current supported runtime", "production-like React build with Profiler sampling fixture", "Vite current build analyzer fixture", "current web-vitals callbacks", "controlled browser/device/network profiles", "keyboard/screen-reader/accessibility tools", "disposable faulting API and offline/service-worker fixture", "원본 열 files read-only"], steps: ["원본 callback/render/list/network/boundary graph와 exact hashes를 기록합니다.", "critical journeys에 vitals/bundle/commit/request/task budgets와 cohorts를 정의합니다.", "Profiler/User Timing/network timeline으로 slow interaction을 state owner에 귀속합니다.", "list/input selector, state locality, algorithm, deferred priority와 windowing을 순서대로 시험합니다.", "production manifest의 initial/route/shared chunks와 cold/warm waterfall/chunk skew를 분석합니다.", "current LCP/INP/CLS schema, lifecycle flush, redaction와 p75 aggregation을 검증합니다.", "lazy/render/data failures의 nearest Error/Suspense boundary와 bounded retry/focus를 fault-test합니다.", "slow/offline/partial outage, cache age, local draft, unknown commit와 reconnect reconciliation을 실행합니다.", "keyboard/screen reader/zoom/reduced motion과 low-end/slow network task completion을 함께 측정합니다.", "privacy telemetry, canary ramp/stop, old/new chunks/cache와 rollback reconciliation을 rehearsal합니다."], expectedResult: ["current field metrics와 versioned schema가 실제 callback→transport→aggregate 경로를 가집니다.", "measured optimization이 correctness와 keyboard/focus/status를 보존하며 interaction/bundle/render budgets를 만족합니다.", "lazy/chunk/data/render failures가 blank page나 retry loop 없이 가까운 boundary에서 복구됩니다.", "offline/partial outage에서 cache/draft/unknown commit이 truthful하게 표시되고 reconnect에서 합의됩니다.", "canary/rollback이 security·a11y·performance·resilience와 privacy evidence를 함께 판정합니다."], cleanup: ["profiles, Profiler callbacks, PerformanceObservers, timers/listeners와 metrics buffers를 제거합니다.", "temporary build/chunks/source maps, API/server/service-worker/caches와 browser data를 폐기합니다.", "synthetic datasets, traces/screenshots/logs를 privacy retention policy에 따라 제거합니다.", "원본 열 files의 hash/status unchanged를 확인합니다."], extensions: ["React Server Components/SSR/streaming route별 performance boundaries를 비교합니다.", "real-user safe attribution과 automated regression bisect를 구현합니다.", "large-list virtualization의 screen-reader/focus compatibility suite를 확장합니다.", "service-worker update/chunk skew/rollback chaos drill을 자동화합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node examples를 실행하고 actual React/browser/build/field/a11y evidence와 대응시키세요.", requirements: ["stdout 완전 일치", "source audit", "budget gate", "Profiler summary", "render work", "chunk budget", "vitals schema", "recovery policy", "degraded mode", "inclusive gate", "release gate", "model 한계"], hints: ["Node 계산이 React scheduling, browser paint, field Web Vitals, assistive technology 또는 Service Worker를 증명한다고 표현하지 마세요."], expectedOutcome: "interaction 시작부터 field metric·recovery·rollback까지 성능과 포용성 책임을 설명합니다.", solutionOutline: ["audit→budget/attribute→reduce/prioritize→split/measure→recover/degrade→operate 순서입니다."] },
    { difficulty: "응용", prompt: "Guestbook list/input/navigation을 inclusive performance와 resilience 기준으로 최적화하세요.", requirements: ["production baseline", "Profiler attribution", "selector/state locality", "large-list strategy", "current vitals", "lazy/error boundaries", "offline/cache/draft", "keyboard/focus/status", "privacy telemetry", "canary/rollback"], hints: ["useMemo와 code split을 먼저 넣지 말고 bottleneck과 task outcome부터 측정하세요."], expectedOutcome: "large/slow/offline/error conditions에서도 빠르고 접근 가능하며 복구 가능한 CRUD journey가 완성됩니다.", solutionOutline: ["measure→hypothesize→change one boundary→fault/a11y verify→field canary→reconcile 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 frontend performance·accessibility·resilience governance를 작성하세요.", requirements: ["budgets/cohorts", "Profiler/field attribution", "bundle/list/input", "current metric versioning", "boundaries/retry", "offline/cache", "WCAG task outcomes", "privacy/cardinality", "canary/SLO/runbook/rollback"], hints: ["단일 Lighthouse score나 평균 dashboard를 release 기준으로 삼지 마세요."], expectedOutcome: "모든 개선이 사용자 outcome·privacy·복구 evidence로 승인됩니다.", solutionOutline: ["classify journeys→budget→observe→optimize→fault→ramp/reconcile 순서입니다."] },
  ],
  nextSessions: ["react-45-production-capstone"], sources,
  sourceCoverage: { filesRead: 10, filesUsed: 10, uncoveredNotes: ["세 reportWebVitals와 index entry points, useMemo list, Guestbook, modern roadmap, my-app03 App을 read-only로 읽고 exact lines·bytes·SHA-256를 기록했습니다.", "원본 callbacks의 CLS/FID/FCP/LCP/TTFB와 no-argument entry invocation을 숨기지 않았고 current INP telemetry나 production dashboard가 이미 있다고 주장하지 않습니다.", "원본에 explicit Error Boundary/Suspense route recovery와 route code split이 있다고 주장하지 않고 current official contracts로 확장했습니다.", "actual routes, DOM identifiers, users, contents, passwords/tokens, endpoints/domains와 raw attribution values는 공개 content에 복사하지 않았습니다.", "Node models는 actual React Profiler/scheduler, build chunks, browser Web Vitals/paint, assistive technology, network/Service Worker와 rollback을 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
