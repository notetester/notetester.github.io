import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-context-tree-audit", title: "Theme·User Context 원본을 provider/consumer graph로 감사합니다",
    lead: "ContextTest의 nested providers, 두 createContext files와 Page→Header/Main/Footer tree를 읽어 value owner, consumers, writers, default와 실제 propagation scope를 표시합니다.",
    mechanism: "ContextTest는 매 render 새 Theme/User value object와 raw setters를 제공하고 Header/Main/Footer는 Theme만 소비하며 User provider는 이 snapshot의 tree에서 소비되지 않습니다. 두 contexts는 null default지만 consumers는 Theme value를 곧바로 destructure합니다.",
    workflow: "provider path, context identity, owner state, value fields, every consumer/read/write와 missing-provider outcome을 graph로 만들고 원본 주석의 broad rerender 주장과 실제 consumer update contract를 구분합니다.",
    invariants: "여덟 원본은 read-only이고 실제 조직·주소·사용자·local URL 값을 복제하지 않으며 Context가 authentication, global singleton 또는 모든 descendant를 무조건 render한다는 식으로 과장하지 않습니다.",
    edgeCases: "provider missing, nested override, unused provider, same/changed value identity, writer-only consumer, route unmount, multiple roots, SSR request와 user switch를 포함합니다.",
    failureModes: "null destructuring은 provider 누락에서 runtime error가 나고 raw setter는 consumer 권한을 넓히며 broad value object는 unrelated field 변화에도 context consumers를 갱신할 수 있습니다.",
    verification: "여덟 원본의 hash·lines·bytes, provider/consumer graph, missing provider, nested scope, read/write capability와 actual render/profile trace를 실행합니다.",
    operations: "provider version, missing-provider error, context update reason과 consumer group만 기록하고 user/context payload·주소·theme identifiers는 telemetry에 남기지 않습니다.",
    concepts: [
      c("provider/consumer graph", "각 Context provider의 tree 위치·value owner와 이를 읽거나 변경 요청하는 consumers를 연결한 구조입니다.", ["unused/broad scopes를 찾습니다.", "props tree와 함께 봅니다."]),
      c("context default", "matching provider가 위에 없을 때 useContext가 읽는 createContext의 static fallback입니다.", ["시간에 따라 바뀌지 않습니다.", "missing provider sentinel로 설계할 수 있습니다."]),
      c("capability surface", "Context value가 consumers에게 허용하는 read fields와 actions의 범위입니다.", ["raw setter보다 좁힙니다.", "least authority를 적용합니다."]),
    ],
    codeExamples: [node("react22-source-audit", "원본 Context graph 위험 inventory", "React22SourceAudit.mjs", "실제 domain 값 없이 provider values와 consumers를 graph로 축소해 unused/broad/default risks를 분류합니다.", String.raw`const contexts = [
  { name: "Theme", fields: ["value", "rawSetter"], consumers: ["Header", "Main", "Footer"], defaultValue: null },
  { name: "User", fields: ["value", "rawSetter"], consumers: [], defaultValue: null },
];
for (const context of contexts) {
  const risks = [context.fields.includes("rawSetter") && "broad-write", context.consumers.length === 0 && "unused-provider", context.defaultValue === null && "unguarded-null"].filter(Boolean);
  console.log(context.name + "=" + risks.join(",") + ":consumers=" + context.consumers.length);
}`, "Theme=broad-write,unguarded-null:consumers=3\nUser=broad-write,unused-provider,unguarded-null:consumers=0", ["local-context-root", "local-theme-context", "local-user-context", "local-header", "local-main", "local-footer", "local-page", "local-context-guide"])]
  }),
  appliedTopic({
    id: "create-default-guarded-consumer", title: "createContext default와 guarded consumer Hook으로 provider 누락을 즉시 진단합니다",
    lead: "null이 valid domain 값인지 missing-provider sentinel인지 섞지 않고 unique undefined/symbol-like sentinel과 custom consumer Hook으로 boundary contract를 강제합니다.",
    mechanism: "createContext default는 matching provider가 없을 때만 사용되는 static fallback입니다. useContext는 호출 component 위의 가장 가까운 provider value를 읽으며 same component가 반환하는 provider는 그 호출에 영향을 주지 않습니다.",
    workflow: "Context type을 State|undefined로 만들고 useThemeContext 같은 Hook에서 undefined를 명확한 stable error로 바꾸며 tests/stories에는 real provider wrapper를 제공합니다.",
    invariants: "valid null user와 missing provider를 구분하고 fake non-null default로 configuration error를 숨기지 않으며 error에는 payload나 secret을 포함하지 않습니다.",
    edgeCases: "optional provider, library default theme, test wrapper 누락, duplicate package/module context identity, provider conditional removal과 hot reload를 포함합니다.",
    failureModes: "createContext(null) 뒤 즉시 destructure하면 missing provider에서 opaque TypeError가 나고 fake object default는 production configuration 오류를 조용히 정상처럼 보이게 합니다.",
    verification: "provider present/missing/nested, valid null field, duplicate module identity와 error message redaction tests를 실행합니다.",
    operations: "missing-provider는 release blocker로 집계하고 component stack/build version만 남기며 user context value는 error report에 포함하지 않습니다.",
    concepts: [
      c("missing-provider sentinel", "valid domain value와 겹치지 않게 provider 부재를 나타내는 default marker입니다.", ["undefined를 사용할 수 있습니다.", "guard Hook이 해석합니다."]),
      c("guarded consumer Hook", "useContext 결과를 읽고 provider presence와 public contract를 검증해 typed value만 반환하는 custom Hook입니다.", ["일관된 error를 만듭니다.", "consumer 중복 검사를 줄입니다."]),
      c("module identity", "provider와 consumer가 정확히 같은 Context object reference를 import해야 하는 JavaScript identity 조건입니다.", ["duplicate bundles/symlinks를 점검합니다.", "이름만 같아도 부족합니다."]),
    ],
    codeExamples: [node("react22-guarded-context", "missing-provider sentinel guard", "React22Guard.mjs", "undefined provider와 valid null field를 구분해 stable result를 반환합니다.", String.raw`function consume(value) {
  if (value === undefined) return { ok: false, code: "provider-required" };
  if (!value || typeof value !== "object" || typeof value.mode !== "string") return { ok: false, code: "invalid-context" };
  return { ok: true, value: { mode: value.mode, user: value.user ?? null } };
}
console.log(JSON.stringify(consume(undefined)));
console.log(JSON.stringify(consume({ mode: "light", user: null })));
console.log(JSON.stringify(consume(null)));`, "{\"ok\":false,\"code\":\"provider-required\"}\n{\"ok\":true,\"value\":{\"mode\":\"light\",\"user\":null}}\n{\"ok\":false,\"code\":\"invalid-context\"}", ["react-create-context", "react-use-context", "local-theme-context", "local-user-context"])]
  }),
  appliedTopic({
    id: "provider-placement-lifetime", title: "provider를 필요한 subtree와 state lifetime 가까이에 배치합니다",
    lead: "props drilling이 보인다는 이유로 app root에 모든 값을 올리지 않고 실제 readers/writers의 closest common owner, reset/persistence와 route/user boundary를 기준으로 provider scope를 정합니다.",
    mechanism: "provider 아래 consumers는 가장 가까운 matching value를 읽고 provider가 unmount되면 그 provider가 소유한 local state도 identity 규칙에 따라 끝납니다. placement가 state lifetime과 update fan-out을 결정합니다.",
    workflow: "값마다 authority, readers, writers, lifetime, reset/persistence와 SSR request scope를 적고 props/composition/local state/provider/external store 중 가장 좁은 충분한 경계를 선택합니다.",
    invariants: "global app provider를 기본값으로 쓰지 않고 route/user/session 전환에서 old state가 새 scope로 새지 않으며 provider owner가 canonical state와 update rules를 가집니다.",
    edgeCases: "layout route persistence, modal/portal, nested workspace, logout/login, back navigation, multiple roots, SSR concurrent requests와 provider relocation migration을 포함합니다.",
    failureModes: "provider가 너무 높으면 unrelated consumers·retention이 늘고 너무 낮으면 필요한 sibling이 읽지 못하며 module singleton state는 SSR requests 사이에 leakage를 만들 수 있습니다.",
    verification: "ownership/tree diagram, mount/reset matrix, route/user switch, portal behavior, two SSR requests isolation과 provider relocation compatibility를 확인합니다.",
    operations: "provider scope 변경은 affected consumers, preserved/reset state와 cross-scope sentinel을 canary하고 data loss/leak threshold에서 rollback합니다.",
    concepts: [
      c("provider scope", "Context value를 읽을 수 있고 provider-owned state lifetime을 공유하는 descendant subtree입니다.", ["DOM 위치와 항상 같지 않습니다.", "가장 좁은 충분한 범위를 선택합니다."]),
      c("closest common owner", "같은 state를 공유해야 하는 readers/writers를 모두 포함하는 가장 가까운 component owner입니다.", ["lifting state와 연결됩니다.", "무조건 app root가 아닙니다."]),
      c("request isolation", "SSR의 동시 requests가 mutable context/store state를 서로 공유하지 않는 조건입니다.", ["request별 owner를 만듭니다.", "module global mutation을 피합니다."]),
    ],
    codeExamples: [node("react22-provider-placement", "consumer set의 최소 provider ancestor", "React22Placement.mjs", "synthetic tree path에서 두 consumers의 longest common prefix를 계산해 provider candidate를 찾습니다.", String.raw`function commonAncestor(paths) {
  const shortest = Math.min(...paths.map((path) => path.length));
  const result = [];
  for (let index = 0; index < shortest; index += 1) {
    const value = paths[0][index];
    if (!paths.every((path) => path[index] === value)) break;
    result.push(value);
  }
  return result;
}
const consumers = [["App", "Workspace", "Header"], ["App", "Workspace", "Footer"]];
console.log("common=" + commonAncestor(consumers).join("/"));
console.log("app-root-needed=" + (commonAncestor(consumers).length === 1));`, "common=App/Workspace\napp-root-needed=false", ["react-pass-context", "react-sharing-state", "local-page", "local-context-guide"])]
  }),
  appliedTopic({
    id: "value-capability-split", title: "state read와 action capability를 분리해 least-authority Context API를 만듭니다",
    lead: "{state,setState}를 그대로 공개하지 않고 consumers가 필요한 read model과 허용 action callbacks/dispatch만 제공해 invariants, validation과 migration boundary를 owner에 유지합니다.",
    mechanism: "consumer는 Context에서 받은 raw setter로 arbitrary state/function을 넣을 수 있지만 toggleTheme, selectWorkspace 또는 dispatch(finiteAction) capability는 owner가 transition policy를 유지합니다.",
    workflow: "consumer별 read/write matrix를 만들고 StateContext와 ActionsContext를 분리하거나 cohesive capability object를 제공하며 action payload schema와 async pending/error semantics를 문서화합니다.",
    invariants: "read-only consumer가 write capability를 받지 않고 action은 finite·validated하며 raw credential/user object/setter를 DOM이나 broad subtree에 전파하지 않습니다.",
    edgeCases: "optional action, read-only role, async rejection, duplicate action, stale entity/version, nested override와 backwards-compatible action addition을 포함합니다.",
    failureModes: "raw setUser/setTheme는 consumer가 owner invariant를 우회하고 state/actions giant object는 writer 변경과 read update를 한 subscription surface에 묶습니다.",
    verification: "consumer capability matrix, forbidden raw setter type/runtime test, invalid action, read-only scope, async failure/retry와 old/new API adapter를 실행합니다.",
    operations: "action type/outcome만 관찰하고 state payload를 redaction하며 capability expansion은 security/API review와 consumer inventory를 거칩니다.",
    concepts: [
      c("least-authority action", "consumer가 필요한 최소 transition만 요청할 수 있게 제한한 callback 또는 dispatch interface입니다.", ["raw setter보다 좁습니다.", "owner가 validation합니다."]),
      c("state/actions split", "읽기 snapshot과 변경 capability를 별도 Context/API로 나누는 pattern입니다.", ["writer-only/read-only consumers를 구분합니다.", "항상 필요한지는 측정합니다."]),
      c("consumer matrix", "각 component가 어떤 fields를 읽고 어떤 actions를 요청하는지 열거한 계약 표입니다.", ["scope/API 설계 근거가 됩니다.", "unused provider를 찾습니다."]),
    ],
    codeExamples: [node("react22-capability-matrix", "consumer별 최소 read/action projection", "React22Capabilities.mjs", "broad provider value에서 consumer contract에 허용된 fields/actions만 projection합니다.", String.raw`const provider = { mode: "dark", user: { id: "synthetic" }, toggleMode: true, replaceState: true };
const contracts = {
  Header: { read: ["mode"], actions: [] },
  Footer: { read: ["mode"], actions: ["toggleMode"] },
};
for (const [name, contract] of Object.entries(contracts)) {
  const exposed = [...contract.read, ...contract.actions].filter((key) => Object.hasOwn(provider, key));
  console.log(name + "=" + exposed.join(",") + ":raw-setter=" + exposed.includes("replaceState"));
}`, "Header=mode:raw-setter=false\nFooter=mode,toggleMode:raw-setter=false", ["local-header", "local-main", "local-footer", "react-scaling-reducer-context", "react-use-callback"])]
  }),
  appliedTopic({
    id: "nearest-provider-override", title: "nested providers의 nearest-value override와 scope composition을 예측합니다",
    lead: "Context를 하나의 global 값으로 생각하지 않고 consumer 위 가장 가까운 provider가 value를 override한다는 lexical tree 규칙으로 theme/workspace/test scopes를 구성합니다.",
    mechanism: "useContext는 호출 component 위의 closest matching Context provider를 찾습니다. nested provider는 바깥 값을 merge하지 않고 전달한 value 전체를 대체하므로 partial override는 명시적 composition이 필요합니다.",
    workflow: "outer/inner provider paths와 consumer 위치를 그려 expected value를 표시하고 override가 필요한 fields만 owner가 previous value와 합쳐 complete contract로 제공합니다.",
    invariants: "provider nesting order가 의도와 일치하고 override value가 full schema를 만족하며 same-name 다른 Context object나 provider가 consumer 아래에 있는 경우를 정상 연결로 오인하지 않습니다.",
    edgeCases: "deep nested themes, portal, conditional provider, sibling scopes, multiple roots, tests/story wrappers, duplicate modules와 context relocation을 포함합니다.",
    failureModes: "inner provider에 {mode}만 주고 actions도 상속될 것이라 기대하면 consumer가 undefined action을 받고 provider를 consumer JSX 안에 반환해 현재 useContext를 바꾸려 해도 위 provider를 읽습니다.",
    verification: "outer/inner/sibling/portal/missing matrix, complete schema guard, Context Object.is identity와 provider relocation user flow를 실행합니다.",
    operations: "override depth와 provider version을 bounded metadata로 기록하고 nested-scope regression은 feature flag로 이전 placement에 rollback합니다.",
    concepts: [
      c("nearest provider", "consumer에서 위로 올라가 처음 만나는 동일 Context object provider입니다.", ["가장 가까운 value가 사용됩니다.", "consumer 아래 provider는 영향이 없습니다."]),
      c("full-value override", "nested provider가 outer object를 자동 merge하지 않고 자신의 value를 해당 scope의 전체 value로 제공하는 동작입니다.", ["schema를 완성합니다.", "composition을 명시합니다."]),
      c("scope shadowing", "inner provider가 같은 Context의 outer value를 subtree에서 가리는 현상입니다.", ["의도적 override에 유용합니다.", "debug graph에 표시합니다."]),
    ],
    codeExamples: [node("react22-nearest-provider", "nested provider lookup model", "React22Nearest.mjs", "provider stack에서 nearest matching Context value를 찾아 sibling/missing 결과와 구분합니다.", String.raw`function read(stack, context) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].context === context) return stack[index].value;
  }
  return "default";
}
const stack = [{ context: "Theme", value: "light" }, { context: "Locale", value: "ko" }, { context: "Theme", value: "dark" }];
console.log("theme=" + read(stack, "Theme"));
console.log("locale=" + read(stack, "Locale"));
console.log("user=" + read(stack, "User"));`, "theme=dark\nlocale=ko\nuser=default", ["react-use-context", "react-create-context", "react-pass-context"])]
  }),
  appliedTopic({
    id: "context-update-value-identity", title: "Context value Object.is 변화와 consumer update fan-out을 측정합니다",
    lead: "Context가 바뀌면 모든 하위 component가 무조건 render된다는 설명을 교정해 provider value가 Object.is로 달라질 때 이를 읽는 consumers가 update 대상이 되고 memo만으로 context update를 막을 수 없음을 이해합니다.",
    mechanism: "provider가 render 때마다 새 {state,action} object를 만들면 fields가 같아도 reference가 달라집니다. useMemo/useCallback은 dependencies가 같을 때 identity를 재사용할 수 있지만 correctness·scope splitting을 대체하지 않습니다.",
    workflow: "consumer read sets와 update frequency를 측정해 state/actions 또는 independent domains를 split하고 provider value identity를 필요할 때 memoize하며 Profiler로 before/after user outcome을 비교합니다.",
    invariants: "performance fix가 stale closure/dependency를 만들지 않고 context value reference stability를 correctness requirement로 사용하지 않으며 non-consumers를 Context 탓으로 잘못 분류하지 않습니다.",
    edgeCases: "new object/function each render, same primitive, nested mutation same reference, memoized consumer, compiler optimization, high-frequency value와 large subtree를 포함합니다.",
    failureModes: "매 render 새 value object는 consumers를 갱신하고 memo(Component)는 context change를 무시하지 않으며 same object mutation은 React가 update를 감지하지 못해 stale UI를 만들 수 있습니다.",
    verification: "Object.is matrix, consumer render/profiler counts, value dependency tests, stale callback, unrelated parent render와 production interaction latency를 확인합니다.",
    operations: "context별 update rate, consumer group과 interaction latency를 낮은 cardinality로 관찰하고 다음 selector/external-store migration을 baseline으로 결정합니다.",
    concepts: [
      c("context value identity", "provider old/new value를 Object.is로 비교할 때 사용되는 JavaScript value/reference identity입니다.", ["object field equality와 다릅니다.", "mutation을 피합니다."]),
      c("consumer fan-out", "한 Context value update가 이를 읽는 consumer 집합에 전달되는 범위와 비용입니다.", ["descendants 전체와 구분합니다.", "Profiler로 측정합니다."]),
      c("memoization caveat", "memo/useMemo/useCallback은 성능 optimization이며 context correctness와 complete dependencies를 대신하지 않는다는 조건입니다.", ["memo consumer도 context를 읽으면 update됩니다.", "측정 후 적용합니다."]),
    ],
    codeExamples: [node("react22-value-identity", "provider value reference와 fan-out model", "React22Identity.mjs", "같은 fields의 new object와 reused object가 Object.is에서 어떻게 달라지는지 consumer count와 함께 출력합니다.", String.raw`const first = { mode: "dark", toggle: "stable-action" };
const sameFields = { mode: "dark", toggle: "stable-action" };
const reused = first;
const consumers = ["Header", "Main", "Footer"];
console.log("new-object-changed=" + !Object.is(first, sameFields));
console.log("reused-changed=" + !Object.is(first, reused));
console.log("consumer-count=" + consumers.length);
console.log("consumers=" + consumers.join(","));`, "new-object-changed=true\nreused-changed=false\nconsumer-count=3\nconsumers=Header,Main,Footer", ["local-context-root", "react-use-context", "react-memo", "react-use-memo", "react-use-callback"])]
  }),
  appliedTopic({
    id: "reducer-context-integration", title: "reducer state와 dispatch를 provider에서 결합하되 contracts를 분리합니다",
    lead: "앞 세션의 pure reducer를 provider owner에 두고 deep consumers에는 read state와 finite dispatch capability를 제공해 prop drilling을 줄이면서 transition authority를 유지합니다.",
    mechanism: "provider가 useReducer를 호출하고 state와 dispatch contexts를 제공하면 read consumers와 action-only consumers를 분리할 수 있습니다. reducer/action parser와 effects command runner는 Context 밖의 책임도 명확히 유지합니다.",
    workflow: "pure reducer/action union을 가져오고 StateContext/DispatchContext guarded Hooks, provider composition, command runner와 consumer role matrix를 구현합니다.",
    invariants: "reducer purity/totality가 유지되고 consumers는 validated actions만 dispatch하며 provider가 missing이면 즉시 실패하고 server authority를 Context state로 대체하지 않습니다.",
    edgeCases: "nested reducer providers, dispatch-only consumer, state migration, pending command, provider reset/key, lazy initializer와 testing wrapper를 포함합니다.",
    failureModes: "state/dispatch giant context는 action-only consumer까지 state update surface에 묶고 reducer 안 network를 넣으면 provider 어디서든 impurity가 확산됩니다.",
    verification: "state/action guarded Hooks, dispatch identity, consumer role fan-out, reducer sequence, command integration, provider missing와 reset/migration tests를 실행합니다.",
    operations: "provider/reducer version과 action outcome을 연결하되 payload는 redaction하고 reducer/Context migration을 같은 canary/rollback window로 관리합니다.",
    concepts: [
      c("state context", "current reducer snapshot을 read consumers에 제공하는 Context입니다.", ["immutable snapshot을 제공합니다.", "write capability와 분리할 수 있습니다."]),
      c("dispatch context", "finite reducer actions를 요청하는 stable dispatch capability를 제공하는 Context입니다.", ["raw state replacement와 다릅니다.", "writer-only consumer를 지원합니다."]),
      c("provider reducer owner", "shared state의 reducer, initializer와 command integration을 소유하는 closest common provider입니다.", ["server authority와 구분합니다.", "lifecycle/reset을 명시합니다."]),
    ],
    codeExamples: [node("react22-reducer-context", "state와 dispatch capability integration model", "React22ReducerContext.mjs", "provider owner가 validated actions를 reducer에 적용하고 consumers가 read-only snapshot을 받는 구조를 실행합니다.", String.raw`function reducer(state, action) {
  if (action.type === "toggle-mode") return { ...state, mode: state.mode === "light" ? "dark" : "light" };
  return state;
}
function createProvider(initial) {
  let state = initial;
  return { read: () => Object.freeze({ ...state }), dispatch: (action) => { state = reducer(state, action); } };
}
const provider = createProvider({ mode: "light", locale: "ko" });
console.log(JSON.stringify(provider.read()));
provider.dispatch({ type: "toggle-mode" });
console.log(JSON.stringify(provider.read()));`, "{\"mode\":\"light\",\"locale\":\"ko\"}\n{\"mode\":\"dark\",\"locale\":\"ko\"}", ["react-scaling-reducer-context", "react-sharing-state", "local-context-guide"])]
  }),
  appliedTopic({
    id: "ssr-client-context-boundary", title: "SSR·client state·use(Context)와 request isolation 경계를 명시합니다",
    lead: "Context를 module-global mutable store나 인증 전달 수단으로 쓰지 않고 server render snapshot, client provider hydration, framework의 Server/Client Component 규칙과 request scope를 구분합니다.",
    mechanism: "server render는 request별 provider values로 HTML snapshot을 만들고 client 첫 render가 compatible value/tree로 hydrate해야 합니다. React use API는 Context를 읽을 수 있지만 target framework/runtime의 allowed boundary를 확인해야 합니다.",
    workflow: "value source를 server request data, serialized client bootstrap, browser preference와 client interaction으로 분류하고 sensitive data minimization, hydration parity와 per-request provider creation을 설계합니다.",
    invariants: "module singleton에 request/user mutable state를 저장하지 않고 serialized context에는 client에 공개 가능한 최소 data만 넣으며 client Context를 server authorization evidence로 신뢰하지 않습니다.",
    edgeCases: "concurrent requests, streaming/Suspense, client navigation, stale bootstrap, logout during hydration, multiple roots, use conditional read와 framework version을 포함합니다.",
    failureModes: "server module user variable는 requests 사이 data leak을 만들고 HTML에 full user object를 serialize하면 secret/PII가 노출되며 server/client theme 불일치는 hydration flicker/mismatch를 만듭니다.",
    verification: "two-request isolation, serialized-field allowlist, server/client snapshot parity, logout/re-auth, target framework boundary와 hydration warnings zero를 확인합니다.",
    operations: "request scope/version/hydration reason만 관찰하고 serialized payload를 로그하지 않으며 leak sentinel이나 mismatch spike에서 traffic stop과 compatible artifact rollback을 실행합니다.",
    concepts: [
      c("server context snapshot", "한 request render에서 providers가 descendants에 제공한 immutable-by-convention value snapshot입니다.", ["request별로 생성합니다.", "client authority와 구분합니다."]),
      c("hydration bootstrap", "server HTML과 client 첫 provider state를 compatible하게 연결하기 위해 공개·검증된 최소 data를 전달하는 단계입니다.", ["secret을 포함하지 않습니다.", "schema/version을 둡니다."]),
      c("use(Context)", "React use API로 Context value를 읽는 방식이며 useContext와 달리 conditional call이 가능한 contract가 있습니다.", ["target React/framework 지원을 확인합니다.", "provider/authority 원칙은 같습니다."]),
    ],
    codeExamples: [node("react22-request-isolation", "request별 Context snapshot isolation", "React22RequestIsolation.mjs", "두 server requests가 같은 module mutable object를 공유하지 않고 public projection만 만드는 model을 실행합니다.", String.raw`function createRequestContext(input) {
  return Object.freeze({ requestId: input.requestId, mode: input.mode, user: input.user ? { displayRole: input.user.displayRole } : null });
}
const first = createRequestContext({ requestId: "r-1", mode: "light", user: { displayRole: "reader", secret: "drop" } });
const second = createRequestContext({ requestId: "r-2", mode: "dark", user: null });
console.log(JSON.stringify(first));
console.log(JSON.stringify(second));
console.log("isolated=" + (first !== second && first.requestId !== second.requestId));`, "{\"requestId\":\"r-1\",\"mode\":\"light\",\"user\":{\"displayRole\":\"reader\"}}\n{\"requestId\":\"r-2\",\"mode\":\"dark\",\"user\":null}\nisolated=true", ["react-use", "react-create-context", "react-strict-mode"])]
  }),
  appliedTopic({
    id: "theme-user-a11y-security", title: "theme·user Context를 accessibility preference와 security authority에서 분리합니다",
    lead: "원본의 theme/user use case를 확장하되 dark boolean을 색 두 개로만 적용하거나 user object 존재를 로그인·권한으로 간주하지 않고 preference, semantics와 server authorization을 별도 contract로 둡니다.",
    mechanism: "theme provider는 system preference, user explicit choice와 application default의 precedence를 계산할 수 있고 semantic tokens가 contrast/focus/forced-colors를 유지합니다. user context는 display snapshot일 뿐 server security decision이 아닙니다.",
    workflow: "theme source/override/reset와 hydration policy를 정의하고 semantic tokens·prefers-color-scheme/contrast를 적용하며 user projection은 최소 fields/actions로 제한하고 server actions는 재인증/권한 검사를 수행합니다.",
    invariants: "색만으로 state를 전달하지 않고 모든 themes에서 text/focus contrast를 유지하며 Context/hidden UI가 unauthorized action을 허용하지 않고 logout 시 client caches/requests와 server session을 각각 정리합니다.",
    edgeCases: "system preference change, user override, forced colors, reduced motion, old persisted theme, shared device, role revoke, logout race와 screen reader announcement를 포함합니다.",
    failureModes: "dark mode inline colors는 contrast/focus를 놓칠 수 있고 user context의 role로 client 버튼만 숨기면 crafted request가 가능하며 full profile Context는 PII exposure/fan-out을 늘립니다.",
    verification: "theme precedence matrix, all-state contrast/focus, forced-colors/zoom, hydration flicker, minimal user projection, server authorization negative test와 logout purge를 실행합니다.",
    operations: "theme mode/source와 authorization outcome reason만 집계하고 actual user/address/context data는 수집하지 않으며 a11y/security regression을 rollback trigger로 둡니다.",
    concepts: [
      c("preference precedence", "explicit user choice, system preference와 application default 중 어떤 값이 current theme를 결정하는지 정한 순서입니다.", ["reset 의미를 명시합니다.", "SSR bootstrap과 맞춥니다."]),
      c("semantic theme token", "background/text/focus/danger 같은 의미를 가진 theme value로 raw color보다 component contract에 가깝습니다.", ["모든 states의 contrast를 검사합니다.", "forced colors를 고려합니다."]),
      c("display identity versus authority", "Context의 user/role display snapshot과 server가 검증한 current authentication/authorization decision의 차이입니다.", ["client 값은 신뢰 경계가 아닙니다.", "actions마다 server 검사합니다."]),
    ],
    codeExamples: [node("react22-theme-policy", "theme preference precedence와 public user projection", "React22ThemePolicy.mjs", "explicit/system/default theme 선택과 sensitive fields 제거를 deterministic하게 실행합니다.", String.raw`function resolveTheme(input) {
  return input.explicit ?? input.system ?? input.fallback;
}
function publicUser(user) {
  return user ? { displayRole: user.displayRole } : null;
}
console.log("explicit=" + resolveTheme({ explicit: "dark", system: "light", fallback: "light" }));
console.log("system=" + resolveTheme({ explicit: null, system: "dark", fallback: "light" }));
console.log("fallback=" + resolveTheme({ explicit: null, system: null, fallback: "light" }));
console.log(JSON.stringify(publicUser({ displayRole: "reader", address: "drop", token: "drop" })));`, "explicit=dark\nsystem=dark\nfallback=light\n{\"displayRole\":\"reader\"}", ["local-header", "local-main", "local-footer", "local-user-context", "mediaqueries5", "wcag22"])]
  }),
  appliedTopic({
    id: "context-testing-external-store-recovery", title: "provider contract tests와 Context/external-store 선택·migration·rollback을 운영합니다",
    lead: "Context unit snapshot에 머물지 않고 missing/nested/scope/update/a11y/SSR/security flows를 검증하며 high-frequency selective subscription이나 non-React source가 필요할 때 external store boundary를 비교합니다.",
    mechanism: "Context는 tree-scoped value 전달에 적합하고 useSyncExternalStore는 external mutable source의 subscribe/getSnapshot/server snapshot 계약을 React와 연결합니다. 어느 쪽도 schema·authorization·persistence를 자동 해결하지 않습니다.",
    workflow: "consumer count/update rate/selector requirement/SSR source를 측정하고 keep/split/move 선택을 한 뒤 compatibility provider/adapter, dual-read shadow, canary와 rollback을 설계합니다.",
    invariants: "store snapshot은 cached/immutable-by-convention이고 subscription cleanup이 정확하며 migration 중 old/new consumers가 같은 canonical authority를 읽고 payload-free telemetry를 사용합니다.",
    edgeCases: "tearing, server snapshot missing, duplicate subscription, provider/store coexistence, old tab, persisted schema, rollback, offline와 library version drift를 포함합니다.",
    failureModes: "Context 성능 문제를 측정 없이 library로 옮기면 authority가 둘로 갈라지고 external store getSnapshot이 매번 새 object면 infinite re-render 위험이 있으며 cleanup 누락은 leaks를 만듭니다.",
    verification: "guarded provider unit, nested/update DOM tests, Profiler, external store subscribe/getSnapshot/server snapshot fixture, dual-read parity, a11y/security E2E, canary와 rollback rehearsal를 실행합니다.",
    operations: "context/store version, update/subscriber counts, parity mismatch와 migration phase를 관찰하고 threshold 초과 시 writes pause, adapter fallback과 reconciliation을 수행합니다.",
    concepts: [
      c("external store boundary", "React 밖 mutable source를 subscribe/getSnapshot contract로 읽는 integration 경계입니다.", ["Context와 목적이 다릅니다.", "useSyncExternalStore를 검토합니다."]),
      c("dual-read shadow", "migration 동안 old/new sources를 사용자 결과에 하나만 사용하면서 background에서 parity를 비교하는 방식입니다.", ["double write 위험을 관리합니다.", "payload를 log하지 않습니다."]),
      c("provider compatibility adapter", "old Context consumers를 유지하면서 new owner/store snapshot/actions에 연결하는 임시 bridge입니다.", ["제거 기한을 둡니다.", "rollback을 지원합니다."]),
    ],
    codeExamples: [node("react22-boundary-decision", "Context 유지·분할·external store 후보 분류", "React22BoundaryDecision.mjs", "tree scope, update frequency와 selective snapshot 필요를 기준으로 bounded recommendation을 계산합니다.", String.raw`function choose(input) {
  if (input.nonReactSource) return "external-store";
  if (input.highFrequency && input.selectiveReads) return "evaluate-selector-or-store";
  if (input.independentDomains > 1) return "split-contexts";
  return "context";
}
console.log(choose({ nonReactSource: false, highFrequency: false, selectiveReads: false, independentDomains: 1 }));
console.log(choose({ nonReactSource: false, highFrequency: false, selectiveReads: false, independentDomains: 2 }));
console.log(choose({ nonReactSource: true, highFrequency: true, selectiveReads: true, independentDomains: 1 }));`, "context\nsplit-contexts\nexternal-store", ["react-use-sync-store", "react-memo", "react-use-memo"])]
  }),
  appliedTopic({
    id: "context-release-evidence", title: "Context boundary의 correctness·a11y·security·performance·rollback을 release gate로 묶습니다",
    lead: "provider가 화면을 바꾼다는 happy path를 넘어 source provenance, guarded defaults, capability, nested scope, identity/fan-out, SSR isolation, theme accessibility와 migration recovery evidence를 하나의 fail-closed gate로 만듭니다.",
    mechanism: "각 검증층은 다른 failure class를 잡습니다. pure model은 schema/scope, React fixture는 propagation/lifecycle, browser는 semantics/performance, server fixture는 request isolation/authorization, canary는 artifact compatibility를 증명합니다.",
    workflow: "source hash→lint/type→Node models→React StrictMode→provider DOM/profile→SSR/security→a11y→migration parity→canary→rollback 순서로 tested artifact를 고정합니다.",
    invariants: "모든 required gates가 통과하고 context payload/PII/secret이 artifacts와 telemetry에 없으며 owner/runbook/rollback trigger가 지정되기 전에는 boundary 변경을 release하지 않습니다.",
    edgeCases: "missing provider production-only, partial route deploy, duplicate React/context module, stale HTML, old persisted value, user switch, feature flag and external-store rollback을 포함합니다.",
    failureModes: "visual snapshot만 통과하면 cross-user leak·missing provider·focus/contrast·fan-out을 놓치고 rollback adapter가 없으면 new state를 old app이 읽지 못합니다.",
    verification: "모든 exact examples, sourceRefs, relationship/consumer graph, negative provider/capability/security fixtures, production profiler, official URL checks와 rollback readback을 실행합니다.",
    operations: "release dashboard에는 provider/migration version과 stable failure codes만 남기고 payload를 redaction하며 leak/invariant/a11y/hydration threshold에서 traffic stop과 rollback을 수행합니다.",
    concepts: [
      c("boundary evidence chain", "provider source와 owner부터 user/security outcome·rollback까지 검증 근거를 연결한 record입니다.", ["한 test에 의존하지 않습니다.", "artifact version을 고정합니다."]),
      c("fail-closed provider release", "missing/invalid/security/parity evidence가 하나라도 실패하면 새 Context boundary를 활성화하지 않는 정책입니다.", ["feature flag를 사용합니다.", "safe old path를 보존합니다."]),
      c("reconciliation runbook", "Context/store/migration mismatch에서 writes를 제어하고 canonical source를 정해 상태를 다시 맞추는 절차입니다.", ["payload 노출을 피합니다.", "owner와 trigger를 둡니다."]),
    ],
    codeExamples: [node("react22-release-gate", "Context boundary fail-closed gate", "React22ReleaseGate.mjs", "guard·scope·capability·a11y·security·performance·SSR·rollback evidence가 모두 참일 때만 release합니다.", String.raw`function gate(evidence) {
  const required = ["guard", "scope", "capability", "accessibility", "security", "performance", "ssr", "rollback"];
  const failed = required.filter((name) => evidence[name] !== true);
  return { release: failed.length === 0, failed };
}
console.log(JSON.stringify(gate({ guard: true, scope: true, capability: true, accessibility: true, security: true, performance: true, ssr: true, rollback: true })));
console.log(JSON.stringify(gate({ guard: false, scope: true, capability: true, accessibility: true, security: false, performance: true, ssr: true, rollback: true })));`, "{\"release\":true,\"failed\":[]}\n{\"release\":false,\"failed\":[\"guard\",\"security\"]}", ["react-create-context", "react-use-context", "react-strict-mode", "react-use-sync-store", "wcag22"])]
  }),
];

const sources: SessionSource[] = [
  { id: "local-context-root", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step13-context/ContextTest.jsx", usedFor: ["nested Theme/User providers", "owner state, raw setters and new value objects provenance"], evidence: "Read-only structural audit: 23 lines, 837 bytes, SHA-256 F5FCB44786273AF509B780B0CB375C0F5C889674CBB5A3B765A6560D9996AE36." },
  { id: "local-theme-context", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step13-context/ThemeContext.jsx", usedFor: ["createContext null default", "theme sharing comments provenance"], evidence: "Read-only structural audit: 9 lines, 605 bytes, SHA-256 12563BF8FC265B6C347E032A78D009B8C51EE2D4469843EBB1DFB4DC85D448EA." },
  { id: "local-user-context", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step13-context/UserConetext.jsx", usedFor: ["separate User context", "null default and unused consumer provenance"], evidence: "Read-only structural audit: 9 lines, 604 bytes, SHA-256 16B3C2952ECD0E9E9AD9ADDACBEBD41FA011382B5C7182DCC809427D7D9A04D4." },
  { id: "local-header", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step13-context/Header.jsx", usedFor: ["read-only Theme consumer", "inline theme style provenance"], evidence: "Read-only structural audit: 17 lines, 593 bytes, SHA-256 672B0A9D6BA543FA61330D3F56BDCDA416344ACCA04E7BE070B29FBC77B2C91A. Actual organization text was not copied." },
  { id: "local-main", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step13-context/Main.jsx", usedFor: ["read-only Theme consumer", "shared theme rendering provenance"], evidence: "Read-only structural audit: 19 lines, 630 bytes, SHA-256 12F9DEA20DA4D7320703D201E22BB004EEE4CEAFA2F6884AC776ACEEC519C573. Actual display text was not copied." },
  { id: "local-footer", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step13-context/Footer.jsx", usedFor: ["Theme reader/writer", "raw setter toggle and inline style provenance"], evidence: "Read-only structural audit: 23 lines, 926 bytes, SHA-256 BF7C93E802CE778659939E77B331569B14F73A532E30EC9D52A16B311E075983. Actual organization, address and contact-like strings were not copied." },
  { id: "local-page", repository: "local my-app01 learning snapshot", path: "my-app01/src/pages/step13-context/Page.jsx", usedFor: ["Header/Main/Footer component tree", "provider consumer subtree provenance"], evidence: "Read-only structural audit: 14 lines, 299 bytes, SHA-256 5C606A89201EC072FEE2E6AAFBA8A2E06A9EADC1C1B1A45E8EFDB35483BA5DF9." },
  { id: "local-context-guide", repository: "local REACT learning snapshot", path: "REACT/docs/react/06-context.md", usedFor: ["props drilling and Context learning model", "Theme/User provider/consumer flow provenance"], evidence: "Read-only structural audit: 80 lines, 3,519 bytes, SHA-256 D26D7FE60D8B94279E3D3E6DEFCE6FEBFCF78591A7E04D638CDB5082AE93DEFB. Actual local paths, image/GitHub URLs and domain strings were not copied." },
  { id: "react-create-context", repository: "React official API", path: "reference/react/createContext", publicUrl: "https://react.dev/reference/react/createContext", usedFor: ["static default and provider syntax", "Context object identity"], evidence: "Official React 19.2 API documents createContext defaults and provider use, including React 19 provider syntax." },
  { id: "react-use-context", repository: "React official API", path: "reference/react/useContext", publicUrl: "https://react.dev/reference/react/useContext", usedFor: ["nearest provider lookup", "Object.is updates, memo caveats and troubleshooting"], evidence: "Official API documents nearest-provider lookup, context updates and duplicate-module identity pitfalls." },
  { id: "react-pass-context", repository: "React official documentation", path: "learn/passing-data-deeply-with-context", publicUrl: "https://react.dev/learn/passing-data-deeply-with-context", usedFor: ["context versus props/composition", "provider nesting and override"], evidence: "Official guide explains passing data deeply, closest providers and alternatives before Context." },
  { id: "react-scaling-reducer-context", repository: "React official documentation", path: "learn/scaling-up-with-reducer-and-context", publicUrl: "https://react.dev/learn/scaling-up-with-reducer-and-context", usedFor: ["state/dispatch Context split", "provider component and custom consumer Hooks"], evidence: "Official guide shows reducer plus separate state/dispatch Contexts and provider extraction." },
  { id: "react-memo", repository: "React official API", path: "reference/react/memo", publicUrl: "https://react.dev/reference/react/memo", usedFor: ["memoization scope", "context update caveat"], evidence: "Official API documents memo as performance optimization and prop comparison behavior." },
  { id: "react-use-memo", repository: "React official API", path: "reference/react/useMemo", publicUrl: "https://react.dev/reference/react/useMemo", usedFor: ["provider object identity optimization", "dependency and correctness caveats"], evidence: "Official API documents calculation caching, Object.is dependencies and troubleshooting." },
  { id: "react-use-callback", repository: "React official API", path: "reference/react/useCallback", publicUrl: "https://react.dev/reference/react/useCallback", usedFor: ["action function identity", "dependency and stale closure caveats"], evidence: "Official API documents function caching and dependency requirements." },
  { id: "react-use-sync-store", repository: "React official API", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["external store boundary", "subscribe/getSnapshot/server snapshot contract"], evidence: "Official API documents external store subscription, cached snapshots and server rendering requirements." },
  { id: "react-use", repository: "React official API", path: "reference/react/use", publicUrl: "https://react.dev/reference/react/use", usedFor: ["reading Context with use", "conditional read and Suspense boundary considerations"], evidence: "Official React API documents reading Context/resources with use and its distinct call rules." },
  { id: "react-sharing-state", repository: "React official documentation", path: "learn/sharing-state-between-components", publicUrl: "https://react.dev/learn/sharing-state-between-components", usedFor: ["closest common owner", "controlled shared state and single source"], evidence: "Official guide explains lifting state to a common owner and controlled components." },
  { id: "react-strict-mode", repository: "React official API", path: "reference/react/StrictMode", publicUrl: "https://react.dev/reference/react/StrictMode", usedFor: ["provider purity and cleanup checks", "development diagnostics"], evidence: "Official API distinguishes development-only checks from production behavior." },
  { id: "mediaqueries5", repository: "W3C CSS Working Group", path: "TR/mediaqueries-5", publicUrl: "https://www.w3.org/TR/mediaqueries-5/", usedFor: ["color scheme/contrast/motion preferences", "theme input signals"], evidence: "Media Queries Level 5 defines user preference and interaction media features." },
  { id: "wcag22", repository: "W3C Web Accessibility Initiative", path: "TR/WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["contrast, focus and non-color meaning", "theme and state accessibility gates"], evidence: "WCAG 2.2 provides normative perceivable, operable and robust criteria." },
];

const session = createExpertSession({
  inventoryId: "react-22-context-provider-boundary", slug: "react-22-context-provider-boundary", courseId: "react", moduleId: "react-state-management", order: 2,
  title: "Context provider와 공유 상태 경계", subtitle: "guarded defaults·least-authority value·scoped ownership·SSR isolation과 measured fan-out으로 안전한 공유 state boundary를 만듭니다.",
  level: "고급", estimatedMinutes: 120,
  coreQuestion: "어떤 state를 어느 provider scope가 소유하고 consumers에 어떤 read/action capability만 제공해야 Context가 누락·과도한 fan-out·cross-user leak 없이 진화할까요?",
  summary: "my-app01 step13-context의 ContextTest, Theme/User contexts, Header/Main/Footer/Page와 REACT Context 문서를 read-only로 감사합니다. Theme/User nested provider, Theme-only consumers, unused User provider, null default, raw setters, 매 render 새 value object와 실제 조직·주소 문자열 존재를 정확히 기록하되 값은 복제하지 않습니다. guarded default, provider placement/lifetime, least-authority state/actions, nearest nested override, Object.is fan-out, reducer integration, SSR/use/request isolation, accessible theme와 user authority 분리, external-store migration과 fail-closed rollback까지 열한 절과 열한 Node exact examples로 확장합니다.",
  objectives: ["원본 provider/consumer/read/write graph와 결함을 evidence로 감사한다.", "static default와 guarded consumer Hook으로 provider 누락을 진단한다.", "closest owner와 state lifetime에 맞게 provider를 배치한다.", "state read와 finite action capability를 least-authority로 분리한다.", "nested nearest provider와 full-value override를 예측한다.", "Context Object.is update와 consumer fan-out을 측정한다.", "pure reducer state/dispatch를 provider boundary에 통합한다.", "SSR/client/use(Context)와 request isolation을 설계한다.", "theme accessibility와 user display/authorization을 분리한다.", "Context/external-store migration, canary와 rollback을 운영한다."],
  prerequisites: [{ title: "useReducer와 상태 머신", reason: "공유 state owner가 pure transitions와 validated actions를 제공해야 Context가 raw setter나 모순 state를 subtree 전체에 확산하지 않습니다.", sessionSlug: "react-21-reducer-state-machine" }],
  keywords: ["createContext", "useContext", "Provider", "scope", "guarded context", "least authority", "state dispatch split", "Object.is", "consumer fan-out", "SSR isolation", "useSyncExternalStore", "rollback"],
  topics,
  lab: {
    title: "Theme·session provider boundary 재설계",
    scenario: "원본 여덟 자료는 변경하지 않고 synthetic public user projection과 theme tokens를 쓰는 disposable React SSR/client fixture에서 scope, capability, propagation, security와 migration을 검증합니다.",
    setup: ["Node.js 20 이상", "React 19 development/production SSR fixture", "Testing Library compatible DOM", "Profiler and render counters", "keyboard/accessibility/forced-colors checks", "fake server authorization and external store", "원본 여덟 파일 read-only hashes"],
    steps: ["원본 providers/consumers/readers/writers/defaults와 hash evidence를 graph로 기록합니다.", "undefined sentinel과 guarded useTheme/useSession Hooks로 missing/invalid providers를 실패시킵니다.", "Theme와 session values의 closest common owner, route/user/request lifetime을 정합니다.", "raw setters를 toggleTheme/logout/select finite capabilities로 교체하고 state/actions를 필요에 따라 분리합니다.", "outer/inner/sibling/portal scopes와 full-value override schema를 검증합니다.", "same/new/mutated value references와 consumer render fan-out을 Profiler로 측정합니다.", "앞 세션의 pure reducer와 dispatch Context, command runner를 provider에 통합합니다.", "두 SSR requests, serialized allowlist, server/client bootstrap과 multiple roots를 검증합니다.", "theme precedence, contrast/focus/forced colors와 server authorization/logout purge를 실행합니다.", "Context split과 external store 후보를 측정해 dual-read parity, canary와 rollback을 rehearsal합니다.", "provider scope 변경 후 full release gate와 original source unchanged를 확인합니다."],
    expectedResult: ["모든 consumer가 matching provider와 최소 read/action contract를 가집니다.", "missing/invalid provider가 silent fallback 없이 stable error로 차단됩니다.", "state lifetime이 route/user/request scope와 일치하고 cross-scope sentinel leak이 없습니다.", "nested override와 Context object identity가 tests에서 예측 가능합니다.", "value identity/fan-out이 측정되고 optimization이 correctness를 깨지 않습니다.", "server/client snapshots가 request-isolated하고 client user value가 authorization으로 사용되지 않습니다.", "모든 themes에서 contrast/focus/semantics가 유지됩니다.", "Context/external-store migration과 artifact rollback이 payload 노출 없이 반복 가능합니다."],
    cleanup: ["temporary builds, SSR snapshots, browser storage, external-store subscriptions와 reports를 제거합니다.", "Profiler/consumer tracing, fault injection과 synthetic session data를 폐기합니다.", "원본 여덟 파일의 hash와 git status가 변경되지 않았는지 확인합니다."],
    extensions: ["다음 세션에서 selector-based subscription과 structural equality를 측정합니다.", "router layouts별 provider preservation/reset matrix를 구현합니다.", "multi-tenant/workspace nested provider authorization boundaries를 추가합니다.", "Context contract metadata에서 provider wrappers, guarded Hooks와 test fixtures를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열한 Node examples를 실행하고 원본 provider/consumer tree의 문제와 대응시키세요.", requirements: ["stdout 완전 일치", "source graph", "guard", "placement", "capability", "nearest override", "identity", "reducer integration", "request isolation", "theme/security", "boundary decision", "release gate"], hints: ["Context consumer update와 모든 descendant render, client user display와 server authorization을 같은 것으로 설명하지 마세요."], expectedOutcome: "Context scope·identity·capability와 각 model의 integration 공백을 설명합니다.", solutionOutline: ["audit→guard/scope→capability/identity→SSR/security→migrate 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Theme/User tree를 production-safe provider module로 재설계하세요.", requirements: ["guarded defaults", "synthetic public user", "state/actions split", "finite capabilities", "scoped lifetime", "nested override tests", "memo only with evidence", "accessible theme", "server authorization", "SSR isolation", "rollback adapter"], hints: ["실제 조직·주소·사용자·token 값을 fixture나 logs에 복사하지 마세요."], expectedOutcome: "누락·cross-user leak·불필요 fan-out과 접근성 회귀에 안전한 provider가 완성됩니다.", solutionOutline: ["graph→owner→contract→provider→consumers→verify→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Context/provider governance를 작성하세요.", requirements: ["default/guard", "scope/lifetime", "read/action authority", "nested override", "identity/fan-out budget", "reducer/effects", "SSR/request isolation", "theme/user security", "Context/store criteria", "canary/rollback"], hints: ["createContext 사용법이 아니라 shared state의 생성부터 폐기·migration까지 정의하세요."], expectedOutcome: "provider boundary를 감사·측정·migration·복구할 수 있는 표준이 완성됩니다.", solutionOutline: ["classify→scope→constrain→provide→measure→isolate→migrate 순서입니다."] },
  ],
  nextSessions: ["react-23-context-performance-selector"], sources,
  sourceCoverage: { filesRead: 8, filesUsed: 8, uncoveredNotes: ["ContextTest, ThemeContext, UserConetext, Header, Main, Footer, Page와 REACT 06-context 문서를 read-only로 전부 읽고 exact hash·lines·bytes를 기록했습니다.", "원본의 Theme-only consumers, unused User provider, null defaults, raw setters와 new value objects를 숨기지 않았고 broad rerender 주석을 official consumer update contract로 교정했습니다.", "Footer/Header/Main의 실제 organization, address, display strings와 문서의 local/image URLs는 공개 examples에 복사하지 않고 structural provenance만 사용했습니다.", "원본 Context가 guarded Hooks, least-authority actions, SSR request isolation, server authorization, accessibility tokens, external-store migration/rollback을 이미 구현했다고 주장하지 않았습니다.", "Node examples는 actual React Context propagation, memo/compiler behavior, portal/multiple roots, SSR/hydration, accessibility tree, server authorization와 external subscription을 대체하지 않으므로 lab fixture가 필요합니다."] },
});

export default session;
