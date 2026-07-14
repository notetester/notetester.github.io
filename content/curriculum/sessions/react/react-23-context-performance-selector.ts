import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefs = ["local-context-doc", "local-theme", "local-user", "local-provider", "local-header", "local-main", "local-footer"];

const topics = [
  appliedTopic({
    id: "source-provider-graph-audit", title: "원본 Context 예제를 provider·consumer·update graph로 감사합니다",
    lead: "createContext와 useContext 호출만 세지 않고 어떤 state가 value에 들어가며 어느 consumer가 읽고 누가 update authority를 갖는지 graph로 복원합니다.",
    mechanism: "원본 ContextTest는 theme와 user state를 서로 다른 두 Provider에 넣고 Page 아래 Header·Main·Footer가 theme를 소비합니다. source comment의 성능 경고는 출발점일 뿐 실제 re-render 범위는 consumer, 부모 render, value identity와 memo boundary를 함께 측정해야 합니다.",
    workflow: "source hash를 고정한 뒤 provider nesting, value shape, consumer fields, setter exposure, default value, state owner와 rendered private text를 redacted table에 기록하고 runtime Profiler trace와 구분합니다.",
    invariants: "원본 파일은 바꾸지 않고 실제 기관명·주소·사용자 문자열을 공개 fixture에 복사하지 않으며 source observation, React contract와 개선 제안을 서로 다른 evidence column에 둡니다.",
    edgeCases: "provider 없음, nested override, null user, rapid toggle, parent-only render, StrictMode, same-value update와 multiple roots를 포함합니다.",
    failureModes: "모든 descendant가 무조건 re-render된다고 단정하거나 Profiler 없이 Context만 원인으로 지목하면 memo·parent·local state 원인을 놓치고 잘못된 최적화를 합니다.",
    verification: "source hashes, provider/consumer graph, field-level read inventory, synthetic private-free fixture, Profiler commit/render reasons와 original worktree unchanged를 확인합니다.",
    operations: "provider owner와 consumer count, change frequency, commit duration, privacy-safe render reason을 baseline으로 저장하고 구조 변경 전후를 같은 workload에서 비교합니다.",
    concepts: [c("provider graph", "Provider별 value owner와 descendant consumer 관계를 나타낸 구조입니다.", ["nesting과 override를 표시합니다.", "DOM tree와 같지 않을 수 있습니다."]), c("consumer read set", "한 consumer가 Context value 중 실제로 읽는 fields 집합입니다.", ["최적화 경계를 찾습니다.", "권한 범위도 드러냅니다."]), c("source observation", "read-only 원본에서 직접 확인한 사실이며 runtime guarantee나 성능 측정과 분리한 근거입니다.", ["hash를 고정합니다.", "민감 문자열은 복사하지 않습니다."])],
    codeExamples: [node("react23-source-graph", "redacted provider·consumer graph", "React23SourceGraph.mjs", "실제 화면 문자열 없이 원본의 구조적 provenance만 출력합니다.", String.raw`const graph = {
  providers: ["theme", "user"],
  consumers: { header: ["theme"], main: ["theme"], footer: ["theme", "theme-update"] },
};
console.log("providers=" + graph.providers.join(","));
for (const [name, reads] of Object.entries(graph.consumers)) console.log(name + "=" + reads.join("+"));
console.log("private-values-copied=false");`, "providers=theme,user\nheader=theme\nmain=theme\nfooter=theme+theme-update\nprivate-values-copied=false", localRefs.concat(["react-passing-context"]))],
  }),
  appliedTopic({
    id: "context-propagation-identity", title: "Context propagation을 closest provider와 Object.is identity로 추적합니다",
    lead: "consumer가 어느 값을 받는지 tree proximity로 결정하고 value 변경 여부는 deep equality가 아니라 Object.is 관점에서 설명합니다.",
    mechanism: "useContext는 호출한 component 위에서 가장 가까운 matching Provider의 value를 읽고 Provider가 받은 이전·다음 value가 Object.is로 다르면 subscribing consumers에 새 context를 전파합니다. 같은 모양의 새 object는 다른 identity입니다.",
    workflow: "provider lookup, previous/next value identity, consumer subscription, component render, DOM commit 단계를 분리하고 nested provider override와 same-value state bailout을 작은 fixture로 재현합니다.",
    invariants: "consumer는 자신의 아래 Provider를 읽지 않고 default value는 Provider가 없을 때만 쓰이며 value object의 identity 정책이 명시됩니다.",
    edgeCases: "NaN, -0/0, inline object/function, mutable same-reference object, portal, nested overrides와 duplicated module Context objects를 다룹니다.",
    failureModes: "object 내부를 mutation한 뒤 같은 reference를 넘기면 update가 전파되지 않을 수 있고 bundler가 Context module을 중복하면 provider와 consumer가 다른 object를 참조합니다.",
    verification: "Object.is matrix, closest-provider tests, mutation negative test, duplicate module/build graph, consumer render counter와 DOM output을 확인합니다.",
    operations: "unexpected stale context, provider identity churn, duplicate bundle module과 affected route/build를 reason code로 관찰하고 rollback 기준을 둡니다.",
    concepts: [c("closest provider", "consumer 위쪽 tree에서 가장 가까운 동일 Context Provider입니다.", ["lexical import만으로 정해지지 않습니다.", "nested override를 허용합니다."]), c("Object.is comparison", "이전과 다음 context value 변경을 판단하는 JavaScript 동일성 비교입니다.", ["deep equality가 아닙니다.", "object identity가 중요합니다."]), c("module identity", "Provider와 consumer가 정확히 같은 Context object를 import해야 한다는 조건입니다.", ["duplicate bundle을 검사합니다.", "이름이 같아도 object가 다를 수 있습니다."])],
    codeExamples: [node("react23-object-is", "Context value identity change model", "React23ObjectIs.mjs", "inline object와 stable reference의 전파 후보 차이를 Object.is로 계산합니다.", String.raw`const stable = { theme: "dark" };
const cases = [
  ["same-reference", stable, stable],
  ["new-object", stable, { theme: "dark" }],
  ["same-primitive", "dark", "dark"],
  ["changed-primitive", "dark", "light"],
];
for (const [name, before, after] of cases) console.log(name + "=" + !Object.is(before, after));`, "same-reference=false\nnew-object=true\nsame-primitive=false\nchanged-primitive=true", ["react-use-context", "react-create-context", "react-use-memo"])],
  }),
  appliedTopic({
    id: "split-context-by-change-authority", title: "read/write·domain·change frequency로 Context를 분리합니다",
    lead: "하나의 거대한 app context 대신 함께 바뀌고 같은 audience가 읽는 data만 같은 propagation domain에 둡니다.",
    mechanism: "state value와 dispatch를 분리하면 dispatch-only consumer는 state 변경에서 불필요한 context update를 피할 수 있고 theme, authenticated identity, locale처럼 ownership과 invalidation 규칙이 다른 data는 별도 boundary가 됩니다.",
    workflow: "각 field의 owner, update frequency, consumer set, sensitivity, persistence와 lifecycle을 matrix로 만든 뒤 overlap이 큰 fields만 묶고 action API는 최소 authority로 노출합니다.",
    invariants: "분리는 의미 있는 consistency boundary를 깨지 않고 consumer가 사용하지 않는 write capability를 받지 않으며 cross-context update의 ordering contract를 정의합니다.",
    edgeCases: "atomic multi-field transition, logout, tenant switch, locale/theme change, lazy subtree, modal portal과 feature flags를 포함합니다.",
    failureModes: "field마다 Context를 만들면 provider nesting과 atomicity가 복잡해지고 반대로 모든 setter를 한 value에 넣으면 과도한 authority와 identity churn이 생깁니다.",
    verification: "consumer-field matrix, update fan-out counts, authority negative tests, atomic transition integration, logout/override tests와 before/after Profiler evidence를 실행합니다.",
    operations: "context별 update rate, subscriber count, cross-context inconsistency와 authorization incident를 low-cardinality metric으로 관리합니다.",
    concepts: [c("propagation domain", "한 Context value 변경의 영향을 받을 수 있는 consumer 집합입니다.", ["Provider boundary로 정합니다.", "DOM descendants 전체와 동일하지 않습니다."]), c("read/write split", "state를 읽는 Context와 action을 호출하는 Context를 분리하는 설계입니다.", ["authority를 줄입니다.", "dispatch identity는 안정적으로 유지할 수 있습니다."]), c("atomic boundary", "여러 fields가 하나의 일관된 transition으로 관찰되어야 하는 범위입니다.", ["과도한 분할을 막습니다.", "reducer와 결합할 수 있습니다."])],
    codeExamples: [node("react23-audience-matrix", "Context split audience 계산", "React23AudienceMatrix.mjs", "field별 consumer 집합을 계산해 split 후보를 보여 줍니다.", String.raw`const reads = { theme: ["header", "main", "footer"], user: ["profile"], dispatch: ["footer", "profile"] };
for (const key of Object.keys(reads)) console.log(key + "=" + reads[key].sort().join(","));
const overlap = reads.theme.filter((x) => reads.user.includes(x));
console.log("theme-user-overlap=" + overlap.length);`, "theme=footer,header,main\nuser=profile\ndispatch=footer,profile\ntheme-user-overlap=0", ["react-passing-context", "react-use-context", "local-provider", "local-header", "local-main", "local-footer"])],
  }),
  appliedTopic({
    id: "stable-provider-value", title: "Provider value와 action identity를 의도적으로 안정화합니다",
    lead: "useMemo를 기계적으로 감싸지 않고 object/function을 누가 생성하며 어떤 dependency가 의미 있게 value를 바꾸는지 먼저 고정합니다.",
    mechanism: "inline value object는 Provider component가 render될 때마다 새 identity가 되므로 consumers에 새 context 후보를 만듭니다. useMemo/useCallback은 정확한 dependency에서 identity를 재사용하지만 correctness를 대신하지 않으며 React Compiler 환경과 측정 결과도 고려합니다.",
    workflow: "value를 primitive, stable dispatch, derived field, action으로 분해하고 pure derivation을 render에서 계산한 뒤 memo 전후 commit duration과 render counts를 production build에서 비교합니다.",
    invariants: "memo dependency는 value가 읽는 모든 reactive input을 포함하고 stale closure가 없으며 action은 current authorization/state를 server와 reducer에서 다시 검증합니다.",
    edgeCases: "setter/reducer dispatch, callback props, mutable objects, development double render, compiler optimization, hot reload와 server/client boundary를 다룹니다.",
    failureModes: "빈 dependency로 provider value를 고정하면 stale state/action이 되고 모든 object를 memo하면 complexity와 memory retention만 늘 수 있습니다.",
    verification: "dependency lint, stale callback tests, identity trace, Profiler production workload, compiler on/off parity와 authorization negative tests를 수행합니다.",
    operations: "memo change는 render budget과 correctness canary를 함께 gate하고 regression이면 구조 분할 또는 rollback을 선택합니다.",
    concepts: [c("provider value identity", "Provider에 전달되는 value의 reference 동일성입니다.", ["전파 판단에 관여합니다.", "내용의 deep equality와 다릅니다."]), c("stale closure", "callback이 생성될 당시의 reactive value를 계속 참조하는 오류입니다.", ["dependency 누락에서 생깁니다.", "identity 안정화와 correctness를 함께 봅니다."]), c("optimization evidence", "동일 workload에서 측정한 render count와 commit duration 근거입니다.", ["개발 느낌이 아닙니다.", "production build로 확인합니다."])],
  }),
  appliedTopic({
    id: "memo-consumer-boundaries", title: "memo boundary와 Context subscription의 역할을 구분합니다",
    lead: "memo가 props 비교는 건너뛸 수 있어도 component가 직접 읽는 Context의 새 value까지 차단하는 방화벽은 아닙니다.",
    mechanism: "memoized component는 parent가 같은 props로 render할 때 재실행을 피할 수 있지만 자신이 구독한 Context가 바뀌면 render합니다. context read를 얇은 outer component에 두고 필요한 primitive를 memoized child prop으로 내리면 field-level boundary를 만들 수 있습니다.",
    workflow: "render reason을 parent props, local state, context, external store로 분류한 뒤 expensive subtree만 memo하고 prop identity와 comparison cost를 함께 측정합니다.",
    invariants: "custom comparator는 모든 props와 function behavior를 정확히 비교하고 비용이 render보다 싸며 stale UI를 만들지 않습니다.",
    edgeCases: "children prop, JSX object identity, function props, deep comparator, Suspense, transitions와 hidden subtree를 포함합니다.",
    failureModes: "memo를 전역으로 적용하거나 functions를 comparator에서 무시하면 stale closure가 생기고 비교 비용이 실제 render보다 커질 수 있습니다.",
    verification: "why-did-render fixture, context-only/prop-only/local-state cases, comparator property tests, Profiler flamegraph와 user timing을 확인합니다.",
    operations: "memo boundary별 hit rate, comparison duration, commit latency와 stale incident를 추적하고 owner가 없는 최적화는 제거합니다.",
    concepts: [c("memo boundary", "동일 props에서 component render를 건너뛸 수 있는 optimization boundary입니다.", ["Context update는 별도입니다.", "semantic guarantee가 아닙니다."]), c("render reason", "component가 다시 실행된 원인을 props·state·context·store 등으로 분류한 값입니다.", ["Profiler와 instrumentation으로 확인합니다.", "추측하지 않습니다."]), c("comparison budget", "props 비교에 허용하는 시간·복잡도 한도입니다.", ["render cost와 비교합니다.", "deep equality를 기본으로 두지 않습니다."])],
  }),
  appliedTopic({
    id: "selector-external-store", title: "field-level selector가 필요하면 external store subscription 계약을 적용합니다",
    lead: "Context 자체를 selector API처럼 오해하지 않고 snapshot과 subscribe를 가진 store에서 consumer가 선택한 값만 비교합니다.",
    mechanism: "useSyncExternalStore는 subscribe, getSnapshot과 선택적 getServerSnapshot 계약으로 concurrent rendering에 안전한 external store read를 제공합니다. selector layer는 snapshot에서 slice를 계산하고 equality로 의미 있는 변경만 consumer에 전달합니다.",
    workflow: "store state를 immutable snapshot으로 만들고 subscribe cleanup, stable getSnapshot, selector purity, equality, server snapshot을 구현한 뒤 Context에는 store instance처럼 드물게 바뀌는 dependency만 제공합니다.",
    invariants: "같은 store state에서는 Object.is-equal cached snapshot을 반환하고 subscribe는 정확히 unsubscribe하며 selector는 side effect 없이 같은 input에 같은 output을 냅니다.",
    edgeCases: "selector returns object, mutable store, nested updates, unsubscribe during emit, SSR, hydration, cross-tab event와 tearing을 다룹니다.",
    failureModes: "getSnapshot이 매번 새 object를 만들면 infinite render 오류가 나고 mutation으로 snapshot identity를 유지하면 update를 놓칩니다.",
    verification: "subscribe/unsubscribe balance, same/changed snapshot, selector equality, concurrent update, SSR hydration와 listener exception isolation tests를 실행합니다.",
    operations: "listener count, snapshot churn, selector recomputation, notification latency와 hydration mismatch를 관찰하고 store reset/recovery runbook을 둡니다.",
    concepts: [c("external store", "React 바깥에서 state와 subscribe/getSnapshot을 제공하는 저장소입니다.", ["Context와 역할이 다릅니다.", "lifecycle ownership이 필요합니다."]), c("selector", "전체 snapshot에서 consumer가 필요한 slice를 순수하게 계산하는 함수입니다.", ["field-level subscription을 돕습니다.", "authorization filter가 아닙니다."]), c("tearing", "한 render 결과 안에서 서로 다른 시점의 store values가 섞여 보이는 일관성 오류입니다.", ["snapshot contract로 방지합니다.", "concurrent tests가 필요합니다."])],
    codeExamples: [node("react23-selector-store", "selector notification model", "React23SelectorStore.mjs", "전체 store update 중 선택한 slice가 바뀐 consumer만 알림 대상으로 계산합니다.", String.raw`let state = Object.freeze({ theme: "dark", count: 0 });
const selectors = { theme: (s) => s.theme, count: (s) => s.count };
function changed(next) {
  const names = Object.entries(selectors).filter(([, select]) => !Object.is(select(state), select(next))).map(([name]) => name);
  state = Object.freeze(next);
  return names;
}
console.log("count-update=" + changed({ theme: "dark", count: 1 }).join(","));
console.log("theme-update=" + changed({ theme: "light", count: 1 }).join(","));
console.log("same-update=" + (changed({ theme: "light", count: 1 }).join(",") || "none"));`, "count-update=count\ntheme-update=theme\nsame-update=none", ["react-use-sync-store", "react-use-context", "react-use-memo"])],
  }),
  appliedTopic({
    id: "snapshot-consistency-concurrency", title: "immutable snapshot·batch·transition에서 consistency를 지킵니다",
    lead: "빠른 update에서 최신 값만 보인다는 기대를 명시적인 snapshot version과 transaction boundary로 바꿉니다.",
    mechanism: "store는 한 version에 대응하는 immutable snapshot을 반환하고 notification 전에 state를 commit합니다. React가 non-blocking Transition 중 store mutation을 감지하면 getSnapshot을 다시 확인할 수 있으므로 mutable partially-updated object를 노출하면 안 됩니다.",
    workflow: "versioned snapshot, atomic update function, listener copy, reentrant update policy와 batch semantics를 정의하고 randomized action sequences에서 invariants를 검사합니다.",
    invariants: "한 version의 fields는 함께 commit되고 listener가 보는 snapshot은 committed immutable value이며 exception 하나가 remaining cleanup과 diagnostics를 막지 않습니다.",
    edgeCases: "nested dispatch, listener removal/addition during emit, same-tick batch, Transition, Suspense, worker message와 multiple roots를 포함합니다.",
    failureModes: "fields를 차례로 mutation해 중간 snapshot을 노출하거나 notification 전에 state를 갱신하지 않으면 consumers가 impossible combination을 봅니다.",
    verification: "version monotonicity, atomic multi-field property tests, reentrant/exception listener cases, concurrent rendering fixture와 baseline listener count를 확인합니다.",
    operations: "version gap, rejected transition, listener failure, long notification과 impossible-state canary를 관찰하고 last-known-good snapshot rollback을 연습합니다.",
    concepts: [c("immutable snapshot", "특정 version의 store state를 변경 불가능한 value로 표현한 것입니다.", ["동일 state면 cached identity를 씁니다.", "partial mutation을 노출하지 않습니다."]), c("atomic commit", "관련 fields가 중간 상태 없이 하나의 version으로 관찰되는 전환입니다.", ["notification보다 먼저 완료합니다.", "transaction 규칙이 필요합니다."]), c("version monotonicity", "committed snapshot version이 뒤로 가지 않는 불변식입니다.", ["stale update를 탐지합니다.", "wrap/reset 정책을 둡니다."])],
    codeExamples: [node("react23-versioned-snapshot", "immutable snapshot version model", "React23VersionedSnapshot.mjs", "atomic update와 no-op에서 snapshot identity/version이 어떻게 유지되는지 실행합니다.", String.raw`let snapshot = Object.freeze({ version: 0, theme: "dark", user: null });
function commit(patch) {
  const next = { ...snapshot, ...patch };
  const changed = Object.keys(patch).some((key) => !Object.is(snapshot[key], next[key]));
  if (changed) snapshot = Object.freeze({ ...next, version: snapshot.version + 1 });
  return changed;
}
console.log("theme=" + commit({ theme: "light" }) + "|v=" + snapshot.version);
console.log("same=" + commit({ theme: "light" }) + "|v=" + snapshot.version);
console.log("user=" + commit({ user: "synthetic-user" }) + "|v=" + snapshot.version);`, "theme=true|v=1\nsame=false|v=1\nuser=true|v=2", ["react-use-sync-store", "react-use-context"] )],
  }),
  appliedTopic({
    id: "default-ssr-hydration-boundary", title: "default value·SSR snapshot·hydration boundary를 계약으로 만듭니다",
    lead: "Provider 누락을 조용히 숨기는 편의 default와 server/client snapshot 불일치를 분리해 초기 화면의 결정성을 보장합니다.",
    mechanism: "createContext defaultValue는 matching Provider가 없을 때 쓰이는 static fallback이고 Provider value가 undefined라고 default로 돌아가지 않습니다. external store hydration은 getServerSnapshot의 결과가 첫 client snapshot과 의미 있게 일치해야 합니다.",
    workflow: "required Context는 sentinel과 custom hook으로 Provider 누락을 stable error로 만들고 optional Context만 안전한 immutable default를 두며 SSR state는 escaped serialized handoff와 schema/version 검증을 거칩니다.",
    invariants: "server HTML과 first client read가 같은 user-visible state를 만들고 request/user별 state가 process-global singleton으로 섞이지 않으며 untrusted serialized state를 검증합니다.",
    edgeCases: "undefined/null values, streaming SSR, partial hydration, browser-only API, timezone/locale, cache restore, multiple requests와 deploy version skew를 포함합니다.",
    failureModes: "mutable global store를 server requests가 공유하면 data leak가 생기고 default user를 넣으면 Provider 누락이 실제 authorization처럼 보일 수 있습니다.",
    verification: "missing provider negative test, null/undefined matrix, two-request isolation, server/client snapshot parity, hydration warnings와 malicious serialized state tests를 실행합니다.",
    operations: "hydration mismatch, provider-missing code, schema/version reject와 cross-request canary를 관찰하고 SSR feature rollback과 cache purge 절차를 둡니다.",
    concepts: [c("static default", "matching Provider가 없을 때 createContext가 반환하는 변경되지 않는 fallback입니다.", ["undefined Provider value와 다릅니다.", "required dependency를 숨길 수 있습니다."]), c("server snapshot", "SSR에서 external store의 초기 값을 제공하는 snapshot입니다.", ["client hydration과 맞아야 합니다.", "request scope를 지킵니다."]), c("request isolation", "서버의 서로 다른 HTTP 요청이 mutable context/store state를 공유하지 않는 보안·일관성 조건입니다.", ["per-request instance를 씁니다.", "leak canary를 시험합니다."])],
  }),
  appliedTopic({
    id: "theme-user-accessibility-security", title: "theme·identity Context를 접근성 preference와 권한 경계로 다룹니다",
    lead: "dark toggle과 user object 공유를 UI 편의로 끝내지 않고 system preference, focus/contrast, logout invalidation과 server authorization에 연결합니다.",
    mechanism: "theme state는 prefers-color-scheme와 explicit user choice의 precedence를 갖고 DOM attribute/class로 일관되게 반영합니다. identity Context는 표시와 request coordination을 돕지만 client value 자체가 권한 증명이 될 수 없습니다.",
    workflow: "preference source, persistence scope, initial paint, change announcement 필요성, contrast/focus styles를 정하고 logout/tenant switch에서 context, store, query cache와 in-flight generation을 함께 invalidation합니다.",
    invariants: "theme 변경 후 focus를 잃지 않고 text/controls가 contrast·forced-colors에서 사용 가능하며 sensitive action은 server가 token/session과 resource authorization을 다시 확인합니다.",
    edgeCases: "system preference change, no storage, private browsing, cross-tab logout, expired session, reduced motion, forced colors와 account switch를 포함합니다.",
    failureModes: "localStorage user object나 Context role만 믿으면 privilege escalation이 가능하고 theme rerender가 uncontrolled focus/animation을 재시작할 수 있습니다.",
    verification: "keyboard/focus, contrast/forced-colors, first paint/hydration, storage failure, logout race/cross-tab, tampered context와 server denial tests를 실행합니다.",
    operations: "theme mismatch/FOUC, accessibility regression, post-logout data commit와 unauthorized denial을 privacy-safe metrics와 incident runbook으로 관리합니다.",
    concepts: [c("preference precedence", "system 설정과 사용자의 명시적 선택 중 어느 값을 우선할지 정한 규칙입니다.", ["초기 paint에 적용합니다.", "변경 가능성을 둡니다."]), c("UI identity", "화면 표시와 request coordination을 위한 client-side 사용자 상태입니다.", ["권한 증명이 아닙니다.", "server authorization이 필요합니다."]), c("auth epoch", "login/logout/account switch마다 증가해 이전 비동기 결과를 폐기하는 identity version입니다.", ["cache key에 반영합니다.", "post-logout race를 막습니다."])],
  }),
  appliedTopic({
    id: "performance-tests-migration-operations", title: "render budget·contract test·migration과 rollback을 함께 운영합니다",
    lead: "최적화를 코드 모양으로 승인하지 않고 representative workload에서 user outcome과 render/commit cost가 실제 개선되는지 qualification합니다.",
    mechanism: "Profiler의 actualDuration/baseDuration, component render counters와 browser interaction timing을 context update reason에 연결하고 test는 behavior를 우선하되 store subscription/cleanup invariant도 직접 검증합니다.",
    workflow: "baseline을 수집한 뒤 split, stable value, memo boundary, external selector를 한 단계씩 적용하고 correctness/a11y/security/performance gates를 통과한 변경만 canary로 배포합니다.",
    invariants: "최적화 전후 user-visible behavior와 authorization은 같고 measurement overhead와 development-only behavior를 production metric으로 오해하지 않으며 rollback artifact가 준비됩니다.",
    edgeCases: "low-end device, 1/1000 consumers, rapid updates, hidden tabs, slow hydration, compiler on/off, old/new persisted state와 mixed deploy를 포함합니다.",
    failureModes: "render count만 줄이고 interaction latency나 memory를 악화시키거나 internal implementation을 과도하게 assert하면 React/store upgrade마다 tests가 깨집니다.",
    verification: "contract/component/browser tests, listener leak, Profiler production trace, accessibility scan, security negatives, bundle/memory budgets와 old/new rollback rehearsal를 실행합니다.",
    operations: "p50/p95 interaction·commit, render fan-out, listener/snapshot churn, hydration/a11y/security error와 release version을 dashboard/runbook에 연결합니다.",
    concepts: [c("render budget", "대표 update에서 허용하는 render 수와 commit 시간 한도입니다.", ["device/workload를 고정합니다.", "user latency와 함께 봅니다."]), c("contract test", "Context/store 내부 구현보다 consumer가 관찰하는 state·action·failure 규칙을 검증하는 test입니다.", ["refactor 내성이 있습니다.", "invariant test를 보완합니다."]), c("incremental migration", "provider/consumer 일부를 작은 reversible 단계로 새 state architecture에 옮기는 절차입니다.", ["mixed-mode compatibility를 둡니다.", "rollback을 연습합니다."])],
    codeExamples: [node("react23-render-budget", "Context update render-budget gate", "React23RenderBudget.mjs", "baseline과 split/selector 후보의 synthetic fan-out을 예산과 비교합니다.", String.raw`const cases = [
  { name: "single-context", renders: 120, budget: 50 },
  { name: "split-context", renders: 42, budget: 50 },
  { name: "selector-store", renders: 18, budget: 50 },
];
for (const item of cases) console.log(item.name + "=" + item.renders + "|pass=" + (item.renders <= item.budget));
console.log("behavior-parity=required");`, "single-context=120|pass=false\nsplit-context=42|pass=true\nselector-store=18|pass=true\nbehavior-parity=required", ["react-profiler", "react-memo", "react-use-memo", "react-use-sync-store"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-context-doc", repository: "D:/dev/REACT", path: "docs/react/06-context.md", usedFor: ["props drilling/context lesson", "theme result guide", "library transition"], evidence: "2026-07-14 read-only sanitized audit: 80 lines, 3,519 bytes, SHA-256 D26D7FE60D8B94279E3D3E6DEFCE6FEBFCF78591A7E04D638CDB5082AE93DEFB. embedded visible strings/assets는 복사하지 않았습니다." },
  { id: "local-theme", repository: "D:/dev/my-app01", path: "src/pages/step13-context/ThemeContext.jsx", usedFor: ["theme Context creation", "source performance caveat"], evidence: "2026-07-14 read-only audit: 9 lines, 605 bytes, SHA-256 12563BF8FC265B6C347E032A78D009B8C51EE2D4469843EBB1DFB4DC85D448EA." },
  { id: "local-user", repository: "D:/dev/my-app01", path: "src/pages/step13-context/UserConetext.jsx", usedFor: ["user Context creation", "separate domain boundary"], evidence: "2026-07-14 read-only audit: 9 lines, 604 bytes, SHA-256 16B3C2952ECD0E9E9AD9ADDACBEBD41FA011382B5C7182DCC809427D7D9A04D4. filename의 원본 철자를 provenance로만 유지합니다." },
  { id: "local-provider", repository: "D:/dev/my-app01", path: "src/pages/step13-context/ContextTest.jsx", usedFor: ["nested providers", "inline object values", "state ownership"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 837 bytes, SHA-256 F5FCB44786273AF509B780B0CB375C0F5C889674CBB5A3B765A6560D9996AE36. 실제 UI strings는 복사하지 않았습니다." },
  { id: "local-header", repository: "D:/dev/my-app01", path: "src/pages/step13-context/Header.jsx", usedFor: ["theme read consumer"], evidence: "2026-07-14 read-only sanitized audit: 17 lines, 593 bytes, SHA-256 672B0A9D6BA543FA61330D3F56BDCDA416344ACCA04E7BE070B29FBC77B2C91A. identifying strings는 복사하지 않았습니다." },
  { id: "local-main", repository: "D:/dev/my-app01", path: "src/pages/step13-context/Main.jsx", usedFor: ["theme read consumer"], evidence: "2026-07-14 read-only sanitized audit: 19 lines, 630 bytes, SHA-256 12F9DEA20DA4D7320703D201E22BB004EEE4CEAFA2F6884AC776ACEEC519C573. visible source strings는 복사하지 않았습니다." },
  { id: "local-footer", repository: "D:/dev/my-app01", path: "src/pages/step13-context/Footer.jsx", usedFor: ["theme read/write consumer", "functional update opportunity"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 926 bytes, SHA-256 BF7C93E802CE778659939E77B331569B14F73A532E30EC9D52A16B311E075983. address/identifying strings는 복사하지 않았습니다." },
  { id: "react-passing-context", repository: "React official documentation", path: "learn/passing-data-deeply-with-context", publicUrl: "https://react.dev/learn/passing-data-deeply-with-context", usedFor: ["provider/consumer model", "context alternatives"], evidence: "React 공식 Context 학습 문서입니다." },
  { id: "react-use-context", repository: "React official API", path: "reference/react/useContext", publicUrl: "https://react.dev/reference/react/useContext", usedFor: ["closest provider", "Object.is propagation", "memo caveat"], evidence: "React 공식 useContext 계약입니다." },
  { id: "react-create-context", repository: "React official API", path: "reference/react/createContext", publicUrl: "https://react.dev/reference/react/createContext", usedFor: ["static default", "provider creation"], evidence: "React 공식 createContext 계약입니다." },
  { id: "react-memo", repository: "React official API", path: "reference/react/memo", publicUrl: "https://react.dev/reference/react/memo", usedFor: ["props memo boundary", "context updates"], evidence: "React 공식 memo API입니다." },
  { id: "react-use-memo", repository: "React official API", path: "reference/react/useMemo", publicUrl: "https://react.dev/reference/react/useMemo", usedFor: ["provider value identity", "optimization caveats"], evidence: "React 공식 useMemo API입니다." },
  { id: "react-use-sync-store", repository: "React official API", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["external store subscription", "snapshot and SSR contracts"], evidence: "React 공식 useSyncExternalStore API입니다." },
  { id: "react-profiler", repository: "React official API", path: "reference/react/Profiler", publicUrl: "https://react.dev/reference/react/Profiler", usedFor: ["render/commit measurement"], evidence: "React 공식 Profiler API입니다." },
];

const session = createExpertSession({
    inventoryId: "react-23-context-split-performance", slug: "react-23-context-performance-selector",
  courseId: "react", moduleId: "react-state-management", order: 3,
  title: "Context 성능·selector와 external store", subtitle: "Provider identity, split boundaries, memo, immutable snapshot과 field-level subscription을 측정 가능한 계약으로 설계합니다.",
  level: "고급", estimatedMinutes: 130,
  coreQuestion: "공유 상태가 커지고 update가 잦아질 때 Context의 정확한 전파 계약을 지키면서 불필요한 rendering과 stale/tearing을 어떻게 줄일까요?",
  summary: "REACT Context 문서와 my-app01 step13의 두 Context, nested Provider, Header/Main/Footer consumers를 read-only·sanitized 감사해 실제 provider/value/read/write graph를 보존합니다. 실제 식별·주소·화면 문자열은 복사하지 않습니다. closest Provider와 Object.is propagation, domain/read-write 분할, stable value, memo boundary, useSyncExternalStore selector/snapshot, concurrent consistency, SSR/default, theme·identity a11y/security와 performance qualification을 공식 React 계약과 여섯 deterministic Node models로 확장합니다.",
  objectives: ["원본 Context source를 provider/consumer/update graph로 감사한다.", "closest provider와 Object.is propagation을 설명한다.", "domain·audience·change frequency·authority로 Context를 분리한다.", "Provider value/action identity를 correctness와 함께 안정화한다.", "memo와 Context subscription 경계를 구분한다.", "selector/external store snapshot·subscribe 계약을 구현한다.", "concurrent/SSR/hydration consistency와 request isolation을 검증한다.", "theme·identity의 accessibility/security boundary를 지킨다.", "render budget, migration, canary와 rollback evidence를 운영한다."],
  prerequisites: [{ title: "Context provider와 공유 상태 경계", reason: "Context 생성·Provider nesting·consumer와 공유 상태 ownership을 알아야 propagation cost와 selector architecture를 정확히 설계할 수 있습니다.", sessionSlug: "react-22-context-provider-boundary" }],
  keywords: ["Context", "Object.is", "Provider", "memo", "useMemo", "selector", "useSyncExternalStore", "snapshot", "tearing", "Profiler", "SSR", "accessibility"],
  topics,
  lab: {
    title: "원본 theme/user Context를 측정 가능한 split·selector architecture로 qualification하기",
    scenario: "원본 files는 변경하지 않고 synthetic non-identifying values를 사용하는 disposable React fixture에서 single/split Context와 external selector store를 동일 workload로 비교합니다.",
    setup: ["Node 20 이상", "React development/production builds", "StrictMode and Profiler fixture", "SSR/hydration test server", "keyboard/contrast inspection", "원본 7 files read-only", "synthetic private-free identities"],
    steps: ["source hashes와 provider/consumer/read-write graph를 기록합니다.", "single Context에서 parent/props/state/context render reasons와 baseline cost를 측정합니다.", "closest Provider, default/null/undefined와 Object.is cases를 검증합니다.", "theme/user와 state/dispatch boundaries를 consumer/authority matrix로 분리합니다.", "Provider value memo dependencies와 stale closure negative tests를 실행합니다.", "memoized child와 context-reading wrapper의 render reasons를 비교합니다.", "immutable versioned external store와 selector/equality/subscription cleanup을 구현합니다.", "concurrent updates, reentrant listeners, SSR two-request isolation과 hydration parity를 검증합니다.", "theme keyboard/contrast/first paint와 tampered identity/server denial/logout races를 시험합니다.", "production workload에서 latency/render/listener budgets, canary와 rollback을 qualification합니다."],
    expectedResult: ["모든 consumer가 closest authorized owner의 current value만 관찰합니다.", "same state는 stable snapshot/value identity를 유지하고 relevant slice 변경만 selector consumer에 전달됩니다.", "listener/Provider lifecycle이 mount/unmount/SSR 뒤 baseline으로 돌아갑니다.", "theme/identity UI가 accessibility를 지키며 client Context가 authorization 증명으로 사용되지 않습니다.", "최적화 전후 behavior parity와 production render/latency budget이 evidence로 남습니다."],
    cleanup: ["temporary stores, listeners, roots, server instances와 Profiler traces를 제거합니다.", "synthetic users, storage/preferences, caches와 serialized snapshots를 폐기합니다.", "feature flags, compiler/profiling builds와 verbose instrumentation을 원복합니다.", "원본 7 files의 hash/status가 unchanged인지 확인합니다."],
    extensions: ["selector equality를 property-based test로 검증합니다.", "multiple React roots와 cross-tab store를 qualification합니다.", "React Compiler on/off에서 optimization evidence를 비교합니다.", "Zustand/Redux external store adapter와 동일 contract suite를 공유합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node examples를 실행하고 실제 React Provider/Profiler/store fixture와 대응시키세요.", requirements: ["stdout 완전 일치", "redacted source graph", "Object.is cases", "audience split", "selector notifications", "snapshot version", "render budget", "model 범위"], hints: ["Node model을 React scheduler나 DOM 구현이라고 표현하지 마세요."], expectedOutcome: "Context update가 value identity에서 consumer rendering과 commit으로 이어지는 경로를 설명합니다.", solutionOutline: ["audit→lookup/compare→split/stabilize→select/snapshot→measure 순서입니다."] },
    { difficulty: "응용", prompt: "원본 theme/user Context를 production-safe architecture로 재설계하세요.", requirements: ["domain/read-write split", "stable actions/value", "provider-missing guard", "selector store", "SSR isolation", "theme a11y", "identity authorization boundary", "Profiler budgets"], hints: ["Context를 무조건 external store로 바꾸기 전에 update frequency와 audience를 측정하세요."], expectedOutcome: "빠른 update와 SSR/logout에도 correct·accessible·bounded shared state가 완성됩니다.", solutionOutline: ["graph→contracts→boundaries→tests→production qualification 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 React shared-state 선택·운영 표준을 작성하세요.", requirements: ["local/props/context/store criteria", "identity/snapshot", "selector/equality", "SSR/concurrency", "authority/privacy", "a11y", "performance evidence", "migration/rollback"], hints: ["library 선호가 아니라 consistency와 ownership 계약으로 결정하세요."], expectedOutcome: "Context에서 external store까지 선택 근거와 운영 evidence가 감사 가능한 표준이 됩니다.", solutionOutline: ["classify→own→propagate→select→isolate→measure→recover 순서입니다."] },
  ],
  nextSessions: ["react-24-zustand-store-actions"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["원본 Footer에 실제 기관 주소와 Header/Main에 식별 가능한 화면 문자열이 있으므로 공개 examples/evidence에는 복사하지 않았습니다.", "원본 ContextTest의 inline Provider object와 source comments를 구조적 provenance로 감사했지만 실제 모든 descendant render나 production 성능을 측정했다고 과장하지 않습니다.", "Node models는 actual React Context propagation, scheduler, DOM commit, useSyncExternalStore concurrency와 SSR/hydration을 대체하지 않으므로 lab fixture를 별도로 요구합니다.", "Zustand store/actions/persistence와 authentication CRUD는 다음 state-management sessions에서 원본 my-app02/my-app03를 감사해 심화합니다."] },
});

export default session;
