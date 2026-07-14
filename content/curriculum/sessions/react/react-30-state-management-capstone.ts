import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

function local(id: string, repository: string, path: string, usedFor: string[], lines: number, bytes: number, sha: string, note = ""): SessionSource {
  return { id, repository, path, usedFor, evidence: "2026-07-14 read-only sanitized audit: " + lines + " lines, " + bytes.toLocaleString("en-US") + " bytes, SHA-256 " + sha + "." + (note ? " " + note : "") };
}
function official(id: string, repository: string, path: string, publicUrl: string, usedFor: string[], evidence: string): SessionSource {
  return { id, repository, path, publicUrl, usedFor, evidence };
}

const auditedCodeRefs = [
  "app1-app", "app1-counter", "app1-form", "app1-effect", "app1-ref", "app1-lifted", "app1-context", "app1-theme", "app1-user-context",
  "app1-reducer1", "app1-reducer2", "app1-reducer3", "app1-fetch", "app1-axios",
  "app2-login", "app2-memo", "app2-profile", "app2-todo", "app2-auth-store", "app2-memo-store", "app2-todo-store",
  "app3-http", "app3-guest-page", "app3-auth-store", "app3-guest-store",
];
const auditedDocRefs = ["doc-state", "doc-context", "doc-reducer", "doc-zustand", "doc-zustand-crud"];
const auditRefs = auditedCodeRefs.concat(auditedDocRefs);

const topics = [
  appliedTopic({
    id: "complete-state-flow-audit", title: "my-app01~03의 67개 state-flow를 hash manifest와 coverage ledger로 완전 감사했습니다",
    lead: "useState·useReducer·createContext·useContext·Zustand create/persist/set/get 구조를 가진 67 files를 모두 읽고 세 프로젝트별 file/line/byte totals와 각 file SHA를 고정해 capstone 주장이 기억이나 표본에만 의존하지 않게 합니다.",
    mechanism: "정규식 inventory는 my-app01 49 files·1,669 lines·57,526 bytes, my-app02 7·352·15,083, my-app03 11·901·38,375를 찾았습니다. 대표 25 code files와 5 docs는 SessionSource로 깊게 연결하고 나머지 42 code files도 exact metrics를 sourceCoverage에 보존합니다.",
    workflow: "scope와 matcher를 고정하고 normalized path를 정렬해 line/byte/SHA를 수집한 뒤 primitive, owner, async boundary, persistence와 server interaction tags를 붙이고 duplicate contents와 spelling drift도 삭제 없이 기록합니다.",
    invariants: "filesRead 72는 67 code+5 docs이고 filesUsed 30은 깊은 source refs이며 uncovered 42는 미독이 아니라 대표 인용에서 제외된 exact-audited code입니다. 원본 파일과 사용자/domain/route/storage/endpoint literals는 변경·복제하지 않습니다.",
    edgeCases: "comments-only match, duplicate files across projects, renamed directory/file typo, CRLF byte count, generated output, hidden state library usage와 dynamic imports를 포함합니다.",
    failureModes: "대표 store 몇 개만 보고 전체라고 부르거나 줄 수만 기록하고 content hash를 생략하면 후속 source drift와 누락을 탐지할 수 없습니다.",
    verification: "matcher rerun, 49+7+11=67, totals, missing/duplicate paths, random hash readback, secret scan, sourceRefs missing/unused zero와 원본 git status를 확인합니다.",
    operations: "inventory count/hash drift, source coverage ratio, unclassified writer, sensitive literal finding과 stale audit date를 release gate에 연결합니다.",
    concepts: [c("coverage ledger", "읽은 files, 깊게 사용한 sources, 대표 인용에서 제외된 files와 이유를 함께 기록한 감사 장부입니다.", ["미독과 미인용을 구분합니다.", "exact provenance를 보존합니다."]), c("content fingerprint", "path뿐 아니라 bytes와 SHA-256으로 특정 source snapshot을 식별하는 근거입니다.", ["source drift를 탐지합니다.", "내용 공개를 요구하지 않습니다."]), c("sanitized structural audit", "실제 값은 공개하지 않고 state primitive·owner·transition·boundary 구조만 추출하는 감사입니다.", ["secret/PII를 복사하지 않습니다.", "구조적 근거는 남깁니다."])],
    codeExamples: [node("react30-manifest-check", "67-file audit manifest totals", "React30ManifestCheck.mjs", "프로젝트별 exact inventory totals와 합계 불변식을 실행합니다.", String.raw`const manifests = [
  { app: "app1", files: 49, lines: 1669, bytes: 57526 },
  { app: "app2", files: 7, lines: 352, bytes: 15083 },
  { app: "app3", files: 11, lines: 901, bytes: 38375 },
];
for (const x of manifests) console.log(x.app + "=" + [x.files, x.lines, x.bytes].join("|"));
const total = manifests.reduce((a, x) => ({ files: a.files + x.files, lines: a.lines + x.lines, bytes: a.bytes + x.bytes }), { files: 0, lines: 0, bytes: 0 });
console.log("total=" + [total.files, total.lines, total.bytes].join("|"));
console.log("coverage=" + (total.files === 67 ? "complete" : "incomplete"));`, "app1=49|1669|57526\napp2=7|352|15083\napp3=11|901|38375\ntotal=67|2922|110984\ncoverage=complete", auditRefs.concat(["react-state-structure"]))],
  }),
  appliedTopic({
    id: "canonical-owner-invariants", title: "field inventory를 canonical owners·derived selectors·reset policies로 재설계합니다",
    lead: "67-file 목록을 교육용 progression으로만 보지 않고 form draft, UI visibility, reducer workflow, context dependency, persisted client state와 server entities 각각에 writer·authority·lifetime·reset 불변식을 부여합니다.",
    mechanism: "canonical state는 entities/order/selectedId처럼 essential facts만 저장하고 counts, filtered lists와 status booleans는 selector 또는 finite status에서 계산합니다. reader가 많다는 사실만으로 server entity를 client authority로 바꾸지 않습니다.",
    workflow: "field graph를 작성하고 duplicated facts와 writers를 찾은 뒤 canonical owner, allowed commands, derived selectors, persistence allowlist, account/route reset과 server readback을 schema로 고정합니다.",
    invariants: "entity IDs는 unique하고 order의 모든 ID가 entity에 존재하며 selectedId는 null 또는 existing ID이고 failed command는 state를 부분 변경하지 않습니다.",
    edgeCases: "delete selected entity, reorder, duplicate IDs, null/missing fields, account switch, old persisted shape, stale server deletion과 optimistic temp ID를 포함합니다.",
    failureModes: "selected object와 entities를 함께 저장하거나 filtered copy를 state에 두면 update/delete 뒤 서로 다른 화면이 다른 truth를 보게 됩니다.",
    verification: "schema/property tests, writer graph, derived parity, reset matrix, mutation sequences, account switch와 server reconciliation을 실행합니다.",
    operations: "invariant violation reason, duplicate writer count, stale selection, orphan IDs와 repair outcome을 low-cardinality로 관찰합니다.",
    concepts: [c("canonical state", "업무 사실을 중복 없이 표현하는 최소 authoritative representation입니다.", ["derived values를 제외합니다.", "schema와 owner가 있습니다."]), c("derived selector", "canonical state와 explicit input에서 저장 없이 view value를 계산하는 pure function입니다.", ["동기화 bug를 줄입니다.", "비용을 측정합니다."]), c("reset policy", "route/account/logout/version change에서 어떤 state를 보존·초기화·purge할지 정한 규칙입니다.", ["lifetime과 연결합니다.", "test합니다."])],
    codeExamples: [node("react30-canonical-invariants", "canonical entity state invariant checker", "React30CanonicalInvariants.mjs", "mutation마다 unique/order/selection invariants를 검사합니다.", String.raw`let state = { entities: { a: { id: "a", done: false } }, order: ["a"], selectedId: "a" };
const valid = (s) => new Set(s.order).size === s.order.length && s.order.every((id) => s.entities[id]) && (s.selectedId === null || Boolean(s.entities[s.selectedId]));
console.log("initial=" + valid(state));
state = { ...state, entities: { ...state.entities, b: { id: "b", done: false } }, order: [...state.order, "b"] };
console.log("add=" + valid(state));
const entities = { ...state.entities }; delete entities.a;
state = { entities, order: state.order.filter((id) => id !== "a"), selectedId: null };
console.log("delete-selected=" + valid(state));
console.log("derived-count=" + state.order.length);`, "initial=true\nadd=true\ndelete-selected=true\nderived-count=1", ["app1-counter", "app1-form", "app1-lifted", "app1-context", "react-sharing", "react-preserving"])],
  }),
  appliedTopic({
    id: "architecture-decision-boundaries", title: "local·lifted·reducer/context·Zustand·server cache를 명시 경계로 조합합니다",
    lead: "capstone의 목표는 한 library로 통일하는 것이 아니라 가장 좁은 owner를 유지하면서 explicit adapters와 commands로 경계를 연결하고 각 도구가 해결하지 않는 문제를 남김없이 적는 것입니다.",
    mechanism: "ephemeral single-owner state는 local, sibling coordination은 lifted, complex subtree workflow는 reducer/context, cross-tree client-only state는 external store, remote records는 query/cache가 맡습니다. URL/search state는 router owner로 다음 module에서 분리합니다.",
    workflow: "상태 그룹마다 authority·lifetime·consumer distance·transition complexity·persistence·remote freshness·SSR/security scorecard를 작성하고 ADR, rejection 이유와 re-evaluation trigger를 승인합니다.",
    invariants: "Context가 persistence·selector·server cache를 자동 제공한다고 가정하지 않고 Zustand가 authorization·remote authority를 대신하지 않으며 query cache를 durable database로 취급하지 않습니다.",
    edgeCases: "modal draft across routes, collaborative/offline edits, SSR request isolation, multiple accounts, embedded widgets, code splitting과 library upgrade를 포함합니다.",
    failureModes: "global이라는 한 단어로 route, session, browser와 server 범위를 섞으면 reset, security, hydration과 test isolation 책임이 사라집니다.",
    verification: "representative spikes, consumer/render graph, bundle/runtime, SSR hydration, cache invalidation, fault drills와 ADR assumption review를 수행합니다.",
    operations: "boundary crossing count, store growth, context fan-out, duplicate cache, architectural exceptions와 decision expiry를 추적합니다.",
    concepts: [c("composition boundary", "서로 다른 state owner를 props, commands, selectors와 adapters로 연결하는 명시 접점입니다.", ["ownership을 숨기지 않습니다.", "contract test합니다."]), c("cross-tree state", "하나의 자연스러운 common ancestor로 소유하기 어려운 독립 UI subtree들이 공유하는 client state입니다.", ["external store 후보입니다.", "remote state와 다릅니다."]), c("server cache boundary", "remote authority의 freshness·dedupe·invalidation·mutation lifecycle을 관리하는 경계입니다.", ["client preference와 분리합니다.", "query key가 contract입니다."])],
  }),
  appliedTopic({
    id: "command-reducer-journal", title: "UI handlers를 validated command·pure transition·durable effect journal로 바꿉니다",
    lead: "페이지와 store에 흩어진 add/update/delete/login setters를 domain command로 모델링하고 reducer가 synchronous decision을, effect adapter가 network/storage를, journal이 accepted operation과 결과를 추적하게 합니다.",
    mechanism: "command에는 type, operation ID, expected version과 sanitized payload가 있고 reducer는 pending state와 effect intent를 만듭니다. handler는 effect를 실행해 success/conflict/failure event를 되돌리며 stale completion을 generation으로 거부합니다.",
    workflow: "command schema→transition table→effect port→idempotency→result event→journal/replay→component intent adapter 순으로 구축하고 raw setState 접근을 migration seam 뒤로 숨깁니다.",
    invariants: "unknown/invalid command는 no partial update, same operation replay는 idempotent, reducer는 pure, journal은 accepted outcome을 잃지 않고 secret payload를 저장하지 않습니다.",
    edgeCases: "double click, timeout after server commit, cancellation, conflict, offline queue, undo, duplicate event, out-of-order completion과 process crash를 포함합니다.",
    failureModes: "component에서 local update와 fetch를 섞고 catch에서 이전 array를 복원하면 concurrent successful edit까지 되돌리거나 실제 server commit을 잃습니다.",
    verification: "transition exhaustiveness, schema negatives, all completion orders, duplicate replay, crash points, journal restore와 actual adapter contract tests를 실행합니다.",
    operations: "command accepted/rejected, operation age, conflict/retry/rollback, journal lag와 poisoned operation을 reason code로 관찰합니다.",
    concepts: [c("validated command", "업무 의도·operation ID·precondition을 schema로 검증한 write 요청입니다.", ["UI event와 분리합니다.", "민감 payload를 최소화합니다."]), c("effect intent", "pure transition이 외부 adapter에 요청할 작업을 data로 표현한 결과입니다.", ["reducer 안에서 effect를 실행하지 않습니다.", "test/replay가 가능합니다."]), c("operation journal", "logical write의 상태 전이를 idempotent operation ID로 추적하는 기록입니다.", ["복구에 사용합니다.", "retention과 redaction을 둡니다."])],
    codeExamples: [node("react30-command-journal", "validated command journal model", "React30CommandJournal.mjs", "duplicate와 stale-version commands를 분류하고 accepted writes만 적용합니다.", String.raw`let state = { version: 2, count: 4 };
const seen = new Set();
for (const command of [{ op: "x1", expected: 2, delta: 1 }, { op: "x1", expected: 2, delta: 1 }, { op: "x2", expected: 1, delta: -2 }, { op: "x3", expected: 3, delta: 2 }]) {
  let outcome;
  if (seen.has(command.op)) outcome = "duplicate";
  else if (command.expected !== state.version) outcome = "conflict";
  else { seen.add(command.op); state = { version: state.version + 1, count: state.count + command.delta }; outcome = "applied"; }
  console.log(command.op + "=" + outcome);
}
console.log("state=v" + state.version + "|count=" + state.count);`, "x1=applied\nx1=duplicate\nx2=conflict\nx3=applied\nstate=v4|count=7", ["app1-reducer1", "app1-reducer2", "app1-reducer3", "react-reducer", "react-reducer-context", "zustand-flux"])],
  }),
  appliedTopic({
    id: "async-server-optimistic-conflict", title: "fetch·Axios·store CRUD를 abort·generation·optimistic patch·conflict reconciliation로 통합합니다",
    lead: "my-app01 fetch/Axios progression과 my-app02/03 CRUD UI/store 흐름을 같은 async contract로 보고 pending, cancellation, latest-wins, optimistic inverse patch, server version conflict와 authoritative readback을 분리합니다.",
    mechanism: "read는 query key/generation과 AbortSignal로 stale commit을 막고 write는 operation ID, expected version, optimistic patch와 inverse patch를 기록합니다. failure 종류에 따라 rollback, refetch, merge 또는 user resolution을 선택합니다.",
    workflow: "request state machine과 typed result를 정의하고 A/B settle permutations, timeout, retry, offline, status/schema error, optimistic conflict와 unknown-outcome readback을 fault-injection합니다.",
    invariants: "stale read가 current view를 덮지 않고 rollback은 해당 operation patch만 되돌리며 timeout을 server failure로 단정하지 않고 authoritative readback 전 성공/실패를 임의 결정하지 않습니다.",
    edgeCases: "abort after response, mutation committed then connection lost, two optimistic edits, temp ID mapping, delete/edit conflict, retry duplicate와 partial schema를 포함합니다.",
    failureModes: "전체 list snapshot rollback은 다른 operation을 지우고 Boolean loading 하나는 동시 requests를 표현하지 못하며 catch-all message는 retryable/validation/auth conflict를 섞습니다.",
    verification: "deterministic deferred promises, actual AbortController/network adapter, optimistic composition, conflict fixtures, idempotency, read-after-timeout와 component accessibility를 시험합니다.",
    operations: "active operations, stale drops, abort/timeout, optimistic rollback, unknown outcome, conflict resolution time와 server readback parity를 관찰합니다.",
    concepts: [c("optimistic patch", "server confirmation 전 UI에 적용하는 operation-scoped change입니다.", ["inverse patch를 가집니다.", "authority는 server입니다."]), c("unknown outcome", "client는 실패를 관찰했지만 server commit 여부를 모르는 mutation 결과입니다.", ["readback/idempotency가 필요합니다.", "무조건 rollback하지 않습니다."]), c("generation guard", "현재 request generation과 일치하는 completion만 state에 commit하는 규칙입니다.", ["abort를 보완합니다.", "query scope별로 둡니다."])],
    codeExamples: [node("react30-optimistic-reconcile", "operation-scoped optimistic rollback", "React30OptimisticReconcile.mjs", "두 optimistic edits 중 실패한 operation의 patch만 되돌립니다.", String.raw`let entity = { title: "base", flagged: false };
const journal = [];
function apply(op, patch) { const before = Object.fromEntries(Object.keys(patch).map((k) => [k, entity[k]])); entity = { ...entity, ...patch }; journal.push({ op, before, patch }); }
function rollback(op) { const entry = journal.find((x) => x.op === op); entity = { ...entity, ...entry.before }; }
apply("title-op", { title: "draft" });
apply("flag-op", { flagged: true });
console.log("optimistic=" + entity.title + "|" + entity.flagged);
rollback("flag-op");
console.log("after-rollback=" + entity.title + "|" + entity.flagged);
console.log("title-op-preserved=" + (entity.title === "draft"));`, "optimistic=draft|true\nafter-rollback=draft|false\ntitle-op-preserved=true", ["app1-fetch", "app1-axios", "app2-memo", "app2-todo", "app3-http", "app3-guest-page", "tanstack-cancellation", "tanstack-optimistic"])],
  }),
  appliedTopic({
    id: "persistence-auth-security-recovery", title: "persist는 versioned non-sensitive projection과 hydration recovery로 제한합니다",
    lead: "my-app02/03 auth stores와 Zustand docs의 persist usage를 실제 credential 보관 권고로 오해하지 않고 allowlist, schema version, migration, corruption, logout/account switch purge와 browser storage threat boundary를 설계합니다.",
    mechanism: "persist envelope은 version, non-sensitive client preference와 bounded state만 포함하고 token/password/private server cache는 제외합니다. hydration은 idle/loading/ready/error/reset lifecycle과 old/current/future/corrupt corpus를 가집니다.",
    workflow: "data classification→allowlist/retention→envelope schema→migrations→storage exceptions→cross-tab/account purge→SSR hydration UI→remote kill/reset UX 순으로 qualification합니다.",
    invariants: "serialize output에 secret canary가 없고 failed migration은 partial commit하지 않으며 logout/account switch가 memory, storage, query cache와 in-flight requests를 함께 격리합니다.",
    edgeCases: "quota, SecurityError, corrupt JSON, future version, app downgrade, clock skew, two tabs, shared device, hydration race와 storage event를 포함합니다.",
    failureModes: "entire store persist는 actions/transient errors/sensitive state까지 저장할 수 있고 localStorage 존재를 authentication authority로 쓰면 stale/tampered state가 권한을 얻습니다.",
    verification: "serialized allowlist scan, version corpus, migration idempotency, actual browser quota/blocked cases, multi-tab logout, account switch, SSR parity와 secret scan을 실행합니다.",
    operations: "hydrate/migrate/purge/reset, version distribution, corrupt/future envelope, sensitive-key canary와 recovery UX completion을 관찰합니다.",
    concepts: [c("persist projection", "runtime store에서 저장을 허용한 최소 non-sensitive subset입니다.", ["entire store와 다릅니다.", "retention을 둡니다."]), c("hydration gate", "persisted value 검증·migration이 끝나기 전 UI가 stale state를 권위로 쓰지 않게 하는 상태 경계입니다.", ["loading/error/reset UX가 필요합니다.", "SSR과 연결합니다."]), c("account isolation", "다른 계정의 memory, storage, cache와 in-flight result가 현재 계정에 보이지 않게 하는 불변식입니다.", ["logout purge를 넘어섭니다.", "race를 시험합니다."])],
    codeExamples: [node("react30-persist-envelope", "safe persist migration corpus", "React30PersistEnvelope.mjs", "old/current/corrupt/future envelopes를 분류하고 non-sensitive projection만 만듭니다.", String.raw`function hydrate(raw) {
  try {
    const x = JSON.parse(raw);
    if (x.version === 1 && typeof x.mode === "string") return { status: "migrated", value: { version: 2, preferences: { mode: x.mode } } };
    if (x.version === 2 && x.preferences) return { status: "current", value: x };
    return { status: "unsupported", value: null };
  } catch { return { status: "corrupt", value: null }; }
}
for (const raw of ['{"version":1,"mode":"compact"}', '{"version":2,"preferences":{"mode":"wide"}}', '{"version":9}', "{bad"]) console.log(hydrate(raw).status);
console.log("persisted-fields=preferences,version");
console.log("sensitive-fields=0");`, "migrated\ncurrent\nunsupported\ncorrupt\npersisted-fields=preferences,version\nsensitive-fields=0", ["app2-auth-store", "app3-auth-store", "doc-zustand", "doc-zustand-crud", "zustand-persist", "zustand-v5-migration", "html-storage"])],
  }),
  appliedTopic({
    id: "selectors-performance-observability", title: "selector dependency와 render evidence를 correctness 이후의 budget으로 관리합니다",
    lead: "my-app01 memo/callback/ref/effect progression과 Zustand selectors를 조합하되 memoization을 무조건 성능 개선으로 간주하지 않고 selected value identity, subscription fan-out, computation cost와 stale closure risk를 실제 profiler evidence로 판단합니다.",
    mechanism: "selector는 canonical snapshot에서 slice/derived value를 pure하게 계산하고 equality가 semantic change를 판정합니다. store notification, selector recomputation, React render와 commit은 서로 다른 관찰 지표입니다.",
    workflow: "baseline user flow를 profile하고 whole-store subscriptions, unstable object selectors, duplicate derivation과 expensive work를 찾은 뒤 split/select/memoize를 하나씩 적용해 correctness와 p95를 재측정합니다.",
    invariants: "optimization 전후 visible/state result가 같고 selector는 same snapshot에 stable semantic value를 반환하며 equality가 genuine update를 숨기지 않습니다.",
    edgeCases: "new object/array, nested mutation, NaN/-0, high-frequency input, concurrent render, reentrant update, stale closure와 server cache structural sharing을 포함합니다.",
    failureModes: "render count 하나만 줄이고 stale data를 만들거나 useMemo/useCallback을 모든 곳에 추가하면 dependency bugs와 allocation/compare 비용이 늘 수 있습니다.",
    verification: "related/unrelated update matrix, identity/equality corpus, React Profiler, CPU/network throttle, mutation test와 user outcome parity를 확인합니다.",
    operations: "selector recomputation, notification/render/commit, p50/p95 interaction, long task, subscriber fan-out와 stale canary를 release evidence로 남깁니다.",
    concepts: [c("selector dependency", "selector output이 실제로 의존하는 state fields와 input 집합입니다.", ["mutation graph와 연결합니다.", "query scope를 포함합니다."]), c("render reason", "props, state, context 또는 external-store snapshot 중 render를 유발한 관찰 가능한 변화입니다.", ["notification과 다릅니다.", "profile evidence가 필요합니다."]), c("performance budget", "대표 device/workload에서 허용할 interaction, compute, render와 memory 한계입니다.", ["correctness gate 뒤에 둡니다.", "회귀를 자동 탐지합니다."])],
    codeExamples: [node("react30-selector-matrix", "selector dependency notification matrix", "React30SelectorMatrix.mjs", "state 변경별로 semantic output이 바뀐 selectors만 계산합니다.", String.raw`const selectors = { count: (s) => s.items.length, mode: (s) => s.mode, first: (s) => s.items[0]?.id ?? "none" };
let before = { items: [{ id: "a" }], mode: "compact" };
for (const next of [{ items: [{ id: "a" }, { id: "b" }], mode: "compact" }, { items: [{ id: "a" }, { id: "b" }], mode: "wide" }, { items: [{ id: "a" }, { id: "b" }], mode: "wide" }]) {
  const changed = Object.entries(selectors).filter(([, pick]) => !Object.is(pick(before), pick(next))).map(([name]) => name);
  console.log(changed.join(",") || "none"); before = next;
}`, "count\nmode\nnone", ["app1-effect", "app1-ref", "app2-profile", "zustand-create", "zustand-slices", "react-sync-store"])],
  }),
  appliedTopic({
    id: "testing-fault-injection-matrix", title: "pure store부터 component·browser·server까지 fault matrix로 계약을 증명합니다",
    lead: "원본 example이 실행된다는 사실과 production state architecture가 race, storage, network, accessibility와 recovery에서 안전하다는 사실을 분리해 가장 빠른 신뢰 가능한 test layer를 배정합니다.",
    mechanism: "pure model은 reducers/selectors/invariants, vanilla store는 actions/subscriptions, component는 accessible behavior, integration은 storage/HTTP/schema, E2E는 navigation/browser policy, recovery drill은 crash/restore를 검증합니다.",
    workflow: "risk→contract→layer→fixture/fault→oracle→cleanup→artifact traceability를 정의하고 empty/duplicate/stale/reordered/cancelled/corrupt/unauthorized cases와 mutation/property tests를 포함합니다.",
    invariants: "tests는 fresh state와 deterministic clock/network를 사용하고 arbitrary sleep, shared singleton, secret-bearing snapshots와 retry로 최초 실패 은폐를 금지합니다.",
    edgeCases: "unmounted completion, open handles, random order/shard, fake-real timer mix, storage events, browser differences, low traffic canary와 test artifact retention을 포함합니다.",
    failureModes: "line coverage나 scaffold green만으로 feature contract를 주장하면 wrong assertion, missing fault/recovery와 actual browser/server gap을 놓칩니다.",
    verification: "seeded repeats, shuffle/shard, all completion orders, real disposable adapters, accessibility, secret scan, mutation sensitivity와 cleanup baseline을 실행합니다.",
    operations: "first-pass pass rate, flaky seed, skipped critical tests, suite latency, open handles, artifact access/retention과 escaped defect를 관리합니다.",
    concepts: [c("fault matrix", "boundary별 주입할 failure, expected state/user outcome와 cleanup을 정리한 표입니다.", ["정상 경로와 같은 비중으로 둡니다.", "layer를 지정합니다."]), c("deterministic harness", "clock, network, IDs와 settle order를 test가 직접 제어하는 실행 환경입니다.", ["race를 재현합니다.", "실제 integration을 보완합니다."]), c("traceability", "architecture invariant를 test·source·runtime evidence와 release gate에 연결하는 관계입니다.", ["coverage 숫자보다 구체적입니다.", "변경 때 갱신합니다."])],
  }),
  appliedTopic({
    id: "incremental-migration-recovery", title: "strangler migration을 shadow·dual-write·reconciliation·rollback으로 qualification합니다",
    lead: "capstone target architecture를 big-bang rewrite하지 않고 consumer seam, canonical adapters, shadow comparisons, idempotent writes, stable cohorts와 durable journal로 old/new state를 단계적으로 교체합니다.",
    mechanism: "old path는 처음 primary로 남고 new path가 shadow에서 semantic parity를 증명합니다. dual writes의 partial failure는 reconciliation queue로 수렴하며 cutover는 cohort guardrail을 통과할 때만 read authority를 옮깁니다.",
    workflow: "inventory freeze→contract seam→new adapter→shadow read→new write shadow→dual write→cohort cutover→fallback window→old cleanup 순으로 entry/exit/rollback criteria를 실행합니다.",
    invariants: "단계별 user-visible authority는 하나이고 accepted write는 journal에 남으며 mismatch를 silent overwrite하지 않고 old reader가 compatibility window 동안 new facts를 잃지 않습니다.",
    edgeCases: "mid-flight rollback, one-side outage, out-of-order replay, delete tombstone, old app downgrade, poison queue, metric loss와 two rapid cutovers를 포함합니다.",
    failureModes: "배포 직후 모든 reader/writer를 동시에 바꾸면 root cause와 rollback point가 사라지고 new-only data 때문에 old code rollback이 실제로 불가능할 수 있습니다.",
    verification: "golden/differential corpus, faulted dual writes, queue convergence, cohort parity, cold restore, journal replay, old/new reader compatibility와 RTO/RPO를 rehearsal합니다.",
    operations: "mismatch types, partial writes, reconciliation depth/oldest age, cohort error/latency, restore/replay/convergence time와 cleanup readiness를 관찰합니다.",
    concepts: [c("strangler migration", "old path 주위에 compatibility seam을 두고 기능 단위로 new path를 대체하는 점진 전략입니다.", ["rollback points를 유지합니다.", "완료 조건이 필요합니다."]), c("semantic parity", "representation이 달라도 사용자·domain contract의 의미가 같은 상태입니다.", ["canonical compare합니다.", "raw JSON equality와 다릅니다."]), c("cleanup gate", "old path를 제거해도 되는 parity hold, client age, backlog, restore와 owner 증거의 승인 조건입니다.", ["되돌릴 수 없는 단계입니다.", "기한보다 evidence가 우선입니다."])],
    codeExamples: [node("react30-migration-gate", "migration and recovery evidence gate", "React30MigrationGate.mjs", "parity, queue, restore, compatibility와 security evidence로 cleanup을 판정합니다.", String.raw`const evidence = {
  parityDays: 14, mismatchRate: 0.2, oldestQueueMinutes: 3,
  restoreMinutes: 18, oldReaderCompatible: true, secretScan: true,
};
const checks = {
  parity: evidence.parityDays >= 14 && evidence.mismatchRate <= 0.5,
  queue: evidence.oldestQueueMinutes <= 5,
  recovery: evidence.restoreMinutes <= 30,
  compatibility: evidence.oldReaderCompatible,
  security: evidence.secretScan,
};
for (const [name, pass] of Object.entries(checks)) console.log(name + "=" + pass);
console.log("cleanup=" + (Object.values(checks).every(Boolean) ? "approve" : "block"));`, "parity=true\nqueue=true\nrecovery=true\ncompatibility=true\nsecurity=true\ncleanup=approve", ["app2-memo-store", "app2-todo-store", "app3-guest-store", "zustand-testing", "tanstack-testing", "dom-abort"])],
  }),
  appliedTopic({
    id: "accessible-failure-recovery-ux", title: "pending·empty·error·conflict·offline·recovery를 접근 가능한 UI 계약으로 만듭니다",
    lead: "state architecture가 내부적으로 정확해도 사용자가 저장 중인지, 재시도 가능한지, conflict에서 무엇이 보존됐는지 알 수 없다면 복구 가능한 시스템이 아니므로 visible status, focus와 keyboard flow를 state machine에 연결합니다.",
    mechanism: "finite UI status가 aria-live/status, disabled/busy, field errors, conflict comparison과 retry/cancel actions를 결정합니다. optimistic UI는 provisional 표시와 rollback/unknown-outcome 안내를 제공합니다.",
    workflow: "상태별 visible copy와 allowed actions, focus target, announcement, retained draft와 retry semantics를 표로 만들고 component/browser tests에서 keyboard/screen-reader와 slow/offline paths를 실행합니다.",
    invariants: "loading이 content를 영구 숨기지 않고 error가 draft를 잃지 않으며 disabled만으로 이유를 숨기지 않고 conflict resolution과 retry가 중복 mutation을 만들지 않습니다.",
    edgeCases: "double submit, IME, focus after delete, background refetch error, stale content, offline reconnect, long error text, reduced motion과 multiple live regions를 포함합니다.",
    failureModes: "console error나 spinner만 있으면 assistive technology와 일반 사용자 모두 복구 action·outcome을 알 수 없고 재클릭이 duplicate operation을 만들 수 있습니다.",
    verification: "role/name/status/focus, keyboard-only, screen reader announcement, slow/offline/conflict, draft retention, retry idempotency와 browser matrix를 확인합니다.",
    operations: "user-visible error reason, retry/recovery completion, abandoned operation, duplicate submit, accessibility audit와 support escalation을 privacy-safe하게 관찰합니다.",
    concepts: [c("recovery UX", "실패 원인 범위, 보존된 작업과 다음 안전한 action을 사용자가 이해·실행할 수 있게 하는 UI 계약입니다.", ["runbook의 사용자 버전입니다.", "상태 machine과 연결합니다."]), c("provisional state", "server confirmation 전 임시임을 UI가 표현하는 optimistic 결과입니다.", ["확정 state와 구분합니다.", "unknown outcome을 다룹니다."]), c("accessible status", "focus를 빼앗지 않으면서 상태 변화와 오류를 이름·role·live semantics로 전달하는 정보입니다.", ["시각 표시와 함께 씁니다.", "중복 announcement를 피합니다."])],
  }),
  appliedTopic({
    id: "production-governance-capstone", title: "SLO·telemetry·runbook·ownership과 cleanup 증거로 capstone을 운영합니다",
    lead: "좋은 state diagram을 배포 문서로 끝내지 않고 correctness, freshness, latency, recovery, privacy, cost와 architecture drift를 측정하며 alert에서 source·operation·user outcome까지 이어지는 실행 가능한 runbook을 만듭니다.",
    mechanism: "low-cardinality telemetry는 operation type, stable reason, state transition, query freshness, mismatch/reconciliation과 recovery duration을 기록하고 payload, token, free-text와 raw storage는 수집하지 않습니다.",
    workflow: "SLI/SLO→event schema→dashboard/alerts→owner/runbook→canary/rollback→post-incident→ADR/source coverage refresh를 연결하고 metric pipeline 자체의 completeness를 감시합니다.",
    invariants: "metric absence를 success로 해석하지 않고 labels에 user/record IDs를 넣지 않으며 alert마다 owner, evidence query, safe mitigation와 verification/close 조건이 있습니다.",
    edgeCases: "low traffic, sampling, telemetry outage, cardinality explosion, clock skew, deploy overlap, regional skew, multiple root causes와 privacy deletion request를 포함합니다.",
    failureModes: "error rate 평균만 보면 stale success/data loss를 놓치고 raw state dump는 디버깅 편의를 위해 민감정보와 high-cardinality cost를 만들 수 있습니다.",
    verification: "synthetic invariant breach, telemetry loss, alert routing, runbook rehearsal, rollback readback, privacy scan, retention deletion과 source audit refresh를 실행합니다.",
    operations: "state invariant/freshness/error/p95, unknown outcomes, mismatch/backlog, RTO/RPO, sensitive canary, exception age와 capstone release decision을 하나의 evidence packet으로 보존합니다.",
    concepts: [c("state correctness SLI", "valid schema·authority·freshness·operation convergence가 유지된 비율 또는 위반 수입니다.", ["HTTP success와 다릅니다.", "user outcome과 연결합니다."]), c("telemetry completeness", "기대한 operations/events 대비 관측 pipeline이 실제로 수집한 비율입니다.", ["무관측 성공 착각을 막습니다.", "독립 probe로 확인합니다."]), c("evidence packet", "source hashes, tests, metrics, canary, recovery와 승인 결정을 재현 가능하게 묶은 release 산출물입니다.", ["payload를 redaction합니다.", "retention을 정합니다."])],
    codeExamples: [node("react30-release-evidence", "state architecture release packet evaluator", "React30ReleaseEvidence.mjs", "correctness, telemetry, recovery, privacy와 source coverage gates를 계산합니다.", String.raw`const packet = { invariantPass: true, freshnessP95: 8, telemetry: 99.8, restore: 22, secretFindings: 0, auditedFiles: 67 };
const gates = {
  correctness: packet.invariantPass,
  freshness: packet.freshnessP95 <= 10,
  telemetry: packet.telemetry >= 99.5,
  recovery: packet.restore <= 30,
  privacy: packet.secretFindings === 0,
  coverage: packet.auditedFiles === 67,
};
for (const [name, pass] of Object.entries(gates)) console.log(name + "=" + pass);
console.log("release=" + (Object.values(gates).every(Boolean) ? "pass" : "block"));`, "correctness=true\nfreshness=true\ntelemetry=true\nrecovery=true\nprivacy=true\ncoverage=true\nrelease=pass", ["app1-app", "app2-login", "app3-auth-store", "react-managing", "tanstack-overview", "otel-web", "otel-attributes"])],
  }),
];

const sources: SessionSource[] = [
  local("app1-app", "D:/dev/my-app01", "src/App.js", ["route/page composition and learning progression"], 49, 2011, "9CFFFAE061E24C865A2320692E409C8330AAAE764EABD9D441904D20ED619E39"),
  local("app1-counter", "D:/dev/my-app01", "src/pages/step08-event2/CounterEx10.jsx", ["functional local updates"], 31, 903, "B7FB3DF0D0C7825150CF8D1452C8178ACA07AB7A7D07053475A1F1CE2F688E6D"),
  local("app1-form", "D:/dev/my-app01", "src/pages/step10-form/FormSample04.jsx", ["controlled form state"], 30, 1014, "2D329D2C0E5FA8B206DDF24CDBA2594091D719A2D7E9ADC41FA2110A6EDBBD13"),
  local("app1-effect", "D:/dev/my-app01", "src/pages/step11-hook/EffectTest05.jsx", ["effect/state synchronization"], 39, 1128, "55E6452095CEB4C578ECCB8DB4371022A8269DD9A985CCE16696183E78E27C89"),
  local("app1-ref", "D:/dev/my-app01", "src/pages/step11-hook/UseRefTest04.jsx", ["ref versus render state"], 25, 743, "D7992E247704597FAA5C6E949E30E0F9F28CBD87310ED71DDDA843AD4BE23C0D"),
  local("app1-lifted", "D:/dev/my-app01", "src/pages/step12-context/NoContext.jsx", ["lifted owner and props"], 11, 267, "B6ABE3211F80A76C2004271677AC1EE6EF896C712D6BF9BABDE449F71729DCBE"),
  local("app1-context", "D:/dev/my-app01", "src/pages/step13-context/ContextTest.jsx", ["multiple providers and values"], 23, 837, "F5FCB44786273AF509B780B0CB375C0F5C889674CBB5A3B765A6560D9996AE36", "Actual context values were not copied."),
  local("app1-theme", "D:/dev/my-app01", "src/pages/step13-context/ThemeContext.jsx", ["context creation/consumption"], 9, 605, "12563BF8FC265B6C347E032A78D009B8C51EE2D4469843EBB1DFB4DC85D448EA"),
  local("app1-user-context", "D:/dev/my-app01", "src/pages/step13-context/UserConetext.jsx", ["second context boundary"], 9, 604, "16B3C2952ECD0E9E9AD9ADDACBEBD41FA011382B5C7182DCC809427D7D9A04D4", "The source spelling is preserved as provenance."),
  local("app1-reducer1", "D:/dev/my-app01", "src/pages/step14-Reducer/UseReducerTest01.jsx", ["reducer/action progression"], 73, 2677, "7D3A38D6A6D7BA3842EF7F5D1B80164E26DB16E3A2899C22AA3CE7F8FE3C4969"),
  local("app1-reducer2", "D:/dev/my-app01", "src/pages/step14-Reducer/UseReducerTest02.jsx", ["reducer transition variants"], 45, 1412, "852354B8482A56D2E00DF2AE352AD51677EC70ED2443CA230435DCEDA5F6D182"),
  local("app1-reducer3", "D:/dev/my-app01", "src/pages/step14-Reducer/UseReducerTest03.jsx", ["reducer transition variants"], 42, 1483, "DB7AB9939D0CEE94D701920A1F09FED2A34DD86191E8BCB684163D33946F4E11"),
  local("app1-fetch", "D:/dev/my-app01", "src/pages/step17-Fetch/FetchTest02.jsx", ["fetch async state"], 43, 1474, "48E3B23DDAF82EC97B8857F8C09945876DA0DEC22ECBD6F372C141CB403F4932", "Endpoint and payload literals were not copied."),
  local("app1-axios", "D:/dev/my-app01", "src/pages/step18-Axios/AxiosTest02.jsx", ["Axios async state"], 50, 1684, "2D9BAC013DA10EC4FC33BF72EA364A4D529777C33DD4F8FA3F6A4EABE3413CBA", "Endpoint and payload literals were not copied."),
  local("app2-login", "D:/dev/my-app02", "src/pages/LoginPage.jsx", ["form/auth store consumer"], 34, 1183, "23390A52C441A3B7B61020DD7DA3C1017C3F9541FCCCEF84BC7B6BD9345EA1E1", "Input and route literals were not copied."),
  local("app2-memo", "D:/dev/my-app02", "src/pages/MemoPage.jsx", ["memo CRUD consumer"], 93, 4354, "F346E532F8546F54BAFB558414CF6A39872EA493807AFF1CAAB54B93227D32D5"),
  local("app2-profile", "D:/dev/my-app02", "src/pages/ProfilePage.jsx", ["profile/auth consumer"], 47, 2088, "DB57B643E3B5894B4D2D1A5D0FF0252E11E2B7CC6CB106F1BFD3CDB3784FE6F7", "Profile values were not copied."),
  local("app2-todo", "D:/dev/my-app02", "src/pages/TodoPage.jsx", ["Todo CRUD consumer"], 75, 3254, "E505E755118DC9CFDC7929C063C9F0F9441725D5598DE0B6861A3BED5C7F16C0"),
  local("app2-auth-store", "D:/dev/my-app02", "src/store/useAuthStore.jsx", ["Zustand auth/persist store"], 33, 1737, "DA8F4C6AB40D340827A8205484AD98EC3693D4BF2073B922D5521E1734FE9653", "Storage/domain and credential-like literals were not copied."),
  local("app2-memo-store", "D:/dev/my-app02", "src/store/useMemoStroe.jsx", ["Memo store actions"], 36, 1363, "3CE0CDFAEEC21A71EB551FFC14D0206BB1BEE9941FA09FC45F085EF815462078", "The source spelling is preserved as provenance."),
  local("app2-todo-store", "D:/dev/my-app02", "src/store/useTodoStore.jsx", ["Todo store actions"], 34, 1104, "AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9"),
  local("app3-http", "D:/dev/my-app03", "src/api/Http.jsx", ["HTTP client/store interaction"], 18, 872, "AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987", "Header, storage and endpoint literals were not copied."),
  local("app3-guest-page", "D:/dev/my-app03", "src/pages/GuestBookPage.jsx", ["large server-backed CRUD flow"], 253, 10636, "40B3B9446990A0F1A499329D0AA7360E758D44D0A57552E2B5E72D1E35627077", "User/domain/route values were not copied."),
  local("app3-auth-store", "D:/dev/my-app03", "src/store/useAuthStore.jsx", ["auth state/storage interaction"], 23, 908, "A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA", "Storage key and credential-like literals were not copied."),
  local("app3-guest-store", "D:/dev/my-app03", "src/store/useGuestbookStore.jsx", ["Guestbook entity store actions"], 21, 562, "DA1A28E1BD3D8A7632530089011576C1FC7F4BE6A75D9001BFCD04323BABF209"),
  local("doc-state", "D:/dev/REACT", "docs/react/03-state-list-events.md", ["local state/list/event curriculum"], 284, 11652, "90A2931C736201262E3C1970DE35AA45FC40EBD0406252FF04C33302DF8F2EDF", "Embedded values were not copied."),
  local("doc-context", "D:/dev/REACT", "docs/react/06-context.md", ["Context curriculum"], 80, 3519, "D26D7FE60D8B94279E3D3E6DEFCE6FEBFCF78591A7E04D638CDB5082AE93DEFB"),
  local("doc-reducer", "D:/dev/REACT", "docs/react/07-usereducer.md", ["useReducer curriculum"], 90, 3570, "6C484A10DDDC517372E00E6D5A29D21147C4AFC1C5822E7E2A3EF074228B90C2"),
  local("doc-zustand", "D:/dev/REACT", "docs/react/10-zustand-basics.md", ["Zustand basics/persist curriculum"], 134, 6356, "36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D"),
  local("doc-zustand-crud", "D:/dev/REACT", "docs/react/11-zustand-auth-crud.md", ["Zustand auth/CRUD curriculum"], 115, 5909, "8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7", "User/domain values were not copied."),
  official("react-state-structure", "React official documentation", "learn/choosing-the-state-structure", "https://react.dev/learn/choosing-the-state-structure", ["normalized essential state"], "React 공식 state structure principles입니다."),
  official("react-sharing", "React official documentation", "learn/sharing-state-between-components", "https://react.dev/learn/sharing-state-between-components", ["lifting and controlled ownership"], "React 공식 shared-state guidance입니다."),
  official("react-reducer", "React official documentation", "learn/extracting-state-logic-into-a-reducer", "https://react.dev/learn/extracting-state-logic-into-a-reducer", ["reducer/action contract"], "React 공식 reducer guidance입니다."),
  official("react-reducer-context", "React official documentation", "learn/scaling-up-with-reducer-and-context", "https://react.dev/learn/scaling-up-with-reducer-and-context", ["reducer/context architecture"], "React 공식 reducer/context guidance입니다."),
  official("react-preserving", "React official documentation", "learn/preserving-and-resetting-state", "https://react.dev/learn/preserving-and-resetting-state", ["state lifetime and reset"], "React 공식 state preservation/reset guidance입니다."),
  official("react-managing", "React official documentation", "learn/managing-state", "https://react.dev/learn/managing-state", ["state architecture progression"], "React 공식 managing-state learning path입니다."),
  official("react-sync-store", "React official API", "reference/react/useSyncExternalStore", "https://react.dev/reference/react/useSyncExternalStore", ["external store snapshot/subscription"], "React 공식 external-store API입니다."),
  official("zustand-create", "Zustand official documentation", "reference/apis/create", "https://zustand.docs.pmnd.rs/reference/apis/create", ["bound store API"], "Zustand 공식 create API입니다."),
  official("zustand-slices", "Zustand official documentation", "learn/guides/slices-pattern", "https://zustand.docs.pmnd.rs/learn/guides/slices-pattern", ["store slice boundaries"], "Zustand 공식 slices guidance입니다."),
  official("zustand-persist", "Zustand official documentation", "reference/middlewares/persist", "https://zustand.docs.pmnd.rs/reference/middlewares/persist", ["persist version/migration"], "Zustand 공식 persist reference입니다."),
  official("zustand-v5-migration", "Zustand official documentation", "reference/migrations/migrating-to-v5", "https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5", ["v5 behavioral distinctions"], "Zustand 공식 v4→v5 migration guidance입니다."),
  official("zustand-flux", "Zustand official documentation", "learn/guides/flux-inspired-practice", "https://zustand.docs.pmnd.rs/learn/guides/flux-inspired-practice", ["actions/store architecture"], "Zustand 공식 Flux-inspired practice guidance입니다."),
  official("zustand-testing", "Zustand official documentation", "learn/guides/testing", "https://zustand.docs.pmnd.rs/learn/guides/testing", ["store reset/test patterns"], "Zustand 공식 testing guidance입니다."),
  official("tanstack-overview", "TanStack Query official documentation", "latest/docs/framework/react/overview", "https://tanstack.com/query/latest/docs/framework/react/overview", ["server-state lifecycle"], "TanStack Query 최신 React overview입니다."),
  official("tanstack-optimistic", "TanStack Query official documentation", "latest/docs/framework/react/guides/optimistic-updates", "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates", ["optimistic mutation and rollback"], "TanStack Query 최신 optimistic-updates guidance입니다."),
  official("tanstack-cancellation", "TanStack Query official documentation", "latest/docs/framework/react/guides/query-cancellation", "https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation", ["AbortSignal/cancellation"], "TanStack Query 최신 query-cancellation guidance입니다."),
  official("tanstack-testing", "TanStack Query official documentation", "latest/docs/framework/react/guides/testing", "https://tanstack.com/query/latest/docs/framework/react/guides/testing", ["server-cache testing"], "TanStack Query 최신 testing guidance입니다."),
  official("html-storage", "WHATWG HTML Standard", "webstorage", "https://html.spec.whatwg.org/multipage/webstorage.html", ["browser storage contract"], "WHATWG Web Storage standard입니다."),
  official("dom-abort", "WHATWG DOM Standard", "#interface-abortcontroller", "https://dom.spec.whatwg.org/#interface-abortcontroller", ["AbortController/AbortSignal contract"], "WHATWG DOM abort APIs입니다."),
  official("otel-web", "OpenTelemetry official documentation", "languages/js/getting-started/browser", "https://opentelemetry.io/docs/languages/js/getting-started/browser/", ["browser telemetry boundary"], "OpenTelemetry 공식 browser JavaScript guidance입니다."),
  official("otel-attributes", "OpenTelemetry specification", "specification/common/attribute-naming", "https://opentelemetry.io/docs/specs/otel/common/attribute-naming/", ["low-cardinality attribute design"], "OpenTelemetry 공식 attribute naming specification입니다."),
];

const session = createExpertSession({
  inventoryId: "react-30-router-routes-link", slug: "react-30-state-management-capstone", courseId: "react", moduleId: "react-state-management", order: 10,
  title: "상태 관리·복구 가능성 capstone", subtitle: "my-app01~03의 67개 state flow를 전수 감사하고 owner·command·async·persist·test·migration·운영을 복구 가능한 하나의 architecture로 완성합니다.",
  level: "고급", estimatedMinutes: 145,
  coreQuestion: "여러 학습 프로젝트에 흩어진 local, Context, reducer, Zustand와 server-backed 상태를 어떻게 전수 감사하고 데이터 무결성·보안·접근성·성능·복구까지 입증한 production-grade architecture로 통합할까요?",
  summary: "my-app01 49, my-app02 7, my-app03 11개, 총 67 state-flow code files의 normalized path, lines, bytes와 SHA-256을 read-only로 전수 감사하고 5개 REACT 학습 문서를 더해 filesRead 72를 고정했습니다. 대표 25 code+5 docs를 깊은 source refs로 연결하고 나머지 42 exact fingerprints도 coverage ledger에 남겼습니다. canonical owner/derived state, architecture boundaries, validated command journal, async/optimistic conflict, secure versioned persistence, selector performance, layered fault tests, incremental migration/recovery, accessible failure UX와 production SLO를 일곱 executable models로 qualification합니다.",
  objectives: ["67 state-flow files의 provenance와 coverage를 설명한다.", "canonical owner·derived selectors·reset invariants를 설계한다.", "local/Context/reducer/Zustand/server cache 경계를 선택한다.", "validated command와 operation journal을 구현한다.", "async race·optimistic conflict·unknown outcome을 복구한다.", "versioned persistence와 account isolation을 검증한다.", "selector/render performance를 correctness 이후 측정한다.", "fault matrix와 deterministic tests를 계층화한다.", "shadow/dual-write/cutover/rollback migration을 rehearsal한다.", "accessible recovery UX와 production SLO/runbook을 완성한다."],
  prerequisites: [{ title: "상태 아키텍처 선택·migration", reason: "state owner 분류, canonical adapters, dual-read/write, reconciliation, cohort cutover와 rollback 원리를 알아야 67-file capstone의 target architecture와 recovery evidence를 완성할 수 있습니다.", sessionSlug: "react-29-state-architecture-migration" }],
  keywords: ["state capstone", "source audit", "canonical state", "command journal", "optimistic update", "account isolation", "selectors", "fault injection", "recovery", "accessibility", "SLO"],
  topics,
  lab: { title: "67-file state architecture qualification과 disaster recovery exercise", scenario: "원본 three apps를 변경하지 않고 synthetic target implementation과 disposable adapters에서 source ledger부터 release evidence packet까지 end-to-end로 재구성합니다.", setup: ["Node.js 20 이상", "project-compatible React/Zustand/query runtime", "fresh stores and accessible component harness", "disposable HTTP/storage/server adapters", "deterministic clock/network/fault injector", "browser and SSR-compatible fixtures", "67 code+5 doc audit ledger", "synthetic secret-free entities/accounts"], steps: ["67-file inventory matcher와 exact fingerprints를 다시 검증합니다.", "field→writer/readers→authority/lifetime/reset/persist map을 완성합니다.", "canonical entities/order/selection schema와 derived selectors를 구현합니다.", "local/lifted/reducer-context/external/server-cache ADR을 승인합니다.", "validated commands, pure transitions, operation journal과 effect adapters를 구축합니다.", "A/B read races, abort, timeout-after-commit, optimistic conflict와 readback을 fault inject합니다.", "persist allowlist/version migration/corruption/quota/account-switch/multi-tab을 qualification합니다.", "selector notification/render/commit과 interaction budgets를 profile합니다.", "pure/store/component/storage/HTTP/browser layers에 fault matrix와 traceability를 실행합니다.", "shadow/dual-write/reconciliation/cohort cutover와 cold rollback restore를 rehearsal합니다.", "pending/error/conflict/offline/recovery UI를 keyboard/screen-reader로 확인합니다.", "source/tests/telemetry/canary/recovery/privacy gates를 evidence packet으로 승인합니다."], expectedResult: ["모든 67 source fingerprints와 30 deep sources가 감사 가능하고 sourceRefs 누락·미사용이 없습니다.", "canonical state와 commands가 duplicate truth, partial update와 stale completion을 차단합니다.", "storage/network/server faults가 data loss나 cross-account leak 없이 explicit recovery state를 만듭니다.", "state architecture가 accessible UX와 representative performance budgets를 통과합니다.", "migration과 rollback이 RTO/RPO, reconciliation과 verified readback evidence를 남깁니다.", "production release packet이 correctness, freshness, telemetry, privacy와 source coverage를 함께 통과합니다."], cleanup: ["stores, subscriptions, timers, requests, DOM roots, query clients와 servers를 종료합니다.", "synthetic storage, caches, journals, accounts/entities와 fault artifacts를 폐기합니다.", "feature flags, clocks, network/storage overrides와 profiler hooks를 원복합니다.", "원본 67 code+5 docs fingerprints와 git status unchanged를 확인합니다."], extensions: ["URL/search/router state를 다음 router module과 연결합니다.", "offline-first conflict-free model과 background sync를 추가합니다.", "SSR streaming/hydration과 request-scoped external stores를 확장합니다.", "policy-as-code로 source coverage, fault and recovery gates를 CI에 강제합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node models를 실행하고 manifest→invariant→command→optimistic→persist→selector→migration→release evidence chain을 설명하세요.", requirements: ["stdout 완전 일치", "67-file total", "canonical invariants", "operation outcomes", "scoped rollback", "persist corpus", "selector matrix", "cleanup gate", "release packet"], hints: ["결정적 model stdout을 실제 browser/server recovery 증거로 과장하지 마세요."], expectedOutcome: "각 model이 증명하는 contract와 실제 integration gap을 구분합니다.", solutionOutline: ["audit→model→fault→recover→operate 순서입니다."] },
    { difficulty: "응용", prompt: "Todo 또는 Memo flow 하나를 capstone architecture로 구현하고 fault qualification하세요.", requirements: ["owner map", "canonical schema", "commands/journal", "server cache", "optimistic conflict", "secure persistence", "accessible recovery", "layered tests", "migration/rollback"], hints: ["전체 list snapshot rollback과 raw credential persistence를 금지하세요."], expectedOutcome: "정상뿐 아니라 race·corrupt storage·offline·conflict·rollback에서도 보존되는 feature가 완성됩니다.", solutionOutline: ["inventory→contract→implement→inject→observe→recover입니다."] },
    { difficulty: "설계", prompt: "조직의 frontend state platform qualification 표준과 evidence packet schema를 작성하세요.", requirements: ["source ledger", "architecture ADR", "state/command schema", "async/persist/security", "selector budgets", "test/fault matrix", "migration/recovery", "a11y UX", "SLO/runbook/privacy"], hints: ["green CI와 HTTP success만으로 state correctness를 정의하지 마세요."], expectedOutcome: "팀과 library가 바뀌어도 같은 기준으로 상태 시스템을 검토·배포·복구할 수 있습니다.", solutionOutline: ["provenance→authority→contracts→evidence→operations→governance 순서입니다."] },
  ],
  nextSessions: ["react-31-router-configuration-layout"], sources,
  sourceCoverage: {
    filesRead: 72, filesUsed: 30,
    uncoveredFiles: [
      "my-app01/src/pages/step08-event2/CounterEx01.jsx|24|848|09C924B2413A7B575D4D11F92691254F136D2F7168D15E5BAAD05F275F8DE988",
      "my-app01/src/pages/step08-event2/CounterEx02.jsx|43|1180|6B906A4670C781F37B02CD712A58BCA8F93B27E21B0ACE48D22439B5ACA361EB",
      "my-app01/src/pages/step08-event2/CounterEx03.jsx|22|728|90BF3C717748A4E113D1E48C02E61CFF921B3FE1517F1E70C8B69082A4B8C507",
      "my-app01/src/pages/step08-event2/CounterEx04.jsx|44|1437|C4F010D78F10F5FEA3AF5206677D8D484927FADF0538E7DB410CA17DC98C11FD",
      "my-app01/src/pages/step08-event2/CounterEx05.jsx|28|662|71A99859DFD83710A4D4C6D2ECD9935CE3C55109ACB7661D8E0A4A27625B81D7",
      "my-app01/src/pages/step08-event2/CounterEx06.jsx|35|1199|1AFF79CE6B5FC793DB483424DB1A7C11B5572D806C3FBCF4F4DEB5534EAA9B62",
      "my-app01/src/pages/step08-event2/CounterEx07.jsx|45|1714|92B6C359106DB12B782942C4ABFE96A52E5C61C21CEF0BCAA3D55F463E169977",
      "my-app01/src/pages/step08-event2/CounterEx08.jsx|42|1245|13E30F2F6B0E82D71BFD0BD42D90978D64654D87FB439356763E2453E7CDD388",
      "my-app01/src/pages/step08-event2/CounterEx09.jsx|59|2011|BE73ECCA553D8E3AF73CE6740020F0EE95BE0C50B74B85889E40CAC105B12D06",
      "my-app01/src/pages/step09-props/Profile.jsx|25|678|75083A9588021E455D87BF5EC4A629ECBC76DB5CFA16D9BB4685EB3E0DC297F9",
      "my-app01/src/pages/step09-props/Profile2.jsx|16|661|08730535452B02658FD047C6947569BA66D83CC192075B9D00185D2FF49E92B1",
      "my-app01/src/pages/step09-props/ProfileSample.jsx|43|1981|38BB0E4E9DAED3F4BB222AFBA1DAE4BE608E9422C5D7779CEC904F6C2AC32843",
      "my-app01/src/pages/step09-props/ProfileSample2.jsx|19|534|948124F7EA6C4F86A480E06AEA43C47A45855D2876C55956C0B3A07E6C9CE980",
      "my-app01/src/pages/step09-props/ProfileSample3.jsx|25|754|59888460C4720CC074ED71AE7CD30D9F2A843132550F2CD4059FA3BF6B069E64",
      "my-app01/src/pages/step10-form/FormSample01.jsx|54|1888|188527F7D90BF37A0098A742734D1335CC985A957D0621BE841F53458632BD02",
      "my-app01/src/pages/step10-form/FormSample02.jsx|81|2931|18EBEC51F418F06276499585C923C8E86DFC4226F53892FC76BC1770B4FC68E1",
      "my-app01/src/pages/step10-form/FormSample03.jsx|58|2242|3D07B45FA295C589418CF02E5A5D14389F3D02E609E2CE8FEECA7EC01DF5AA57",
      "my-app01/src/pages/step11-hook/EffectTest01.jsx|21|634|78AF9AAACAB5D37B6F267C7E2C7BC7B8B88A6CE99AB48AE3D2C781605051C227",
      "my-app01/src/pages/step11-hook/EffectTest02.jsx|20|592|44D8827825CC85A2A83101F2C53EFCDDDD7CEE8CD608D295A6D09C085BE057C3",
      "my-app01/src/pages/step11-hook/EffectTest03.jsx|25|924|686DD021102AC7AEE441B65B8EF33C9B1F8D3172B923C9FB0009C1F9388A45F8",
      "my-app01/src/pages/step11-hook/EffectTest04.jsx|25|942|690B191B18971640CD634B9A18BFF655AC5807CEF3A7D85504B79F9699D8F06C",
      "my-app01/src/pages/step11-hook/UseCallBack01.jsx|27|858|6F880652B0A067CFF5AC100FD94AD971D1A541033C76C332433566FE2AD6FAF6",
      "my-app01/src/pages/step11-hook/UseCallBack02.jsx|30|1091|62154C6FF0297755AB0824708861AACC76463EAF2F132FB934975CCAAB034496",
      "my-app01/src/pages/step11-hook/UseCallBack03.jsx|26|862|016923AD42EC8F686AD82F76951DE978E7021EBBE57FD2021FD75B300BE8E8F4",
      "my-app01/src/pages/step11-hook/UseMemo01.jsx|28|785|2FA410FE35607B921111E0D5E50699FC9DAE382AFF5978917EAFFF1ED6A2C805",
      "my-app01/src/pages/step11-hook/UseMemo02.jsx|29|921|2AC2BE651FABFA1ECEA23524BA0CDC541A0036C4B4E1D2E3BB46CD4F38DE6214",
      "my-app01/src/pages/step11-hook/UseMemo03.jsx|28|875|DC98E468E1581396CC015DA813D494A1317097D89589F2F980BBED9DB3AFA8D0",
      "my-app01/src/pages/step11-hook/UseMemo04.jsx|31|1028|986714249C94F5DE7F1555F58E7ADE3AD79F87091222F2321CA576F0BEB9B29E",
      "my-app01/src/pages/step11-hook/UseRefTest03.jsx|43|1424|7F754489C3DF5D5107CDB34F8506BCB91D2027C667C7ACD656ED95C27A678924",
      "my-app01/src/pages/step13-context/Footer.jsx|23|926|BF7C93E802CE778659939E77B331569B14F73A532E30EC9D52A16B311E075983",
      "my-app01/src/pages/step13-context/Header.jsx|17|593|672B0A9D6BA543FA61330D3F56BDCDA416344ACCA04E7BE070B29FBC77B2C91A",
      "my-app01/src/pages/step13-context/Main.jsx|19|630|12F9DEA20DA4D7320703D201E22BB004EEE4CEAFA2F6884AC776ACEEC519C573",
      "my-app01/src/pages/step17-Fetch/FetchTest01.jsx|25|960|D1369B0BB1ADE1B0C4EA7D785B7A2B791A9E86B59060C5D333C5E6EC4B834F16",
      "my-app01/src/pages/step18-Axios/AxiosTest01.jsx|68|2538|40B3700253746B25105F4BDFBDCF9D7F034513F038CA2A3CE06E67BCF85ADF48",
      "my-app01/src/pages/step18-Axios/AxiosTest02Detail.jsx|42|1408|6FCD097D2F38E36AF911B4F9143091AD296CCF6FC979842EE47491E3F16B385F",
      "my-app03/src/pages/LoginPage.jsx|97|4359|9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8",
      "my-app03/src/pages/MemoPage.jsx|93|4354|F346E532F8546F54BAFB558414CF6A39872EA493807AFF1CAAB54B93227D32D5",
      "my-app03/src/pages/ProfilePage.jsx|155|6304|5A3ED767BA9BEA73D2D76C48266188F73D0570C93AE59DB51179638E24BE567D",
      "my-app03/src/pages/RegisterPage.jsx|96|4659|97E846CDDF471EA415ACB659E344B63889B2364D1A256876816F08B8891D71C4",
      "my-app03/src/pages/TodoPage.jsx|75|3254|E505E755118DC9CFDC7929C063C9F0F9441725D5598DE0B6861A3BED5C7F16C0",
      "my-app03/src/store/useMemoStroe.jsx|36|1363|3CE0CDFAEEC21A71EB551FFC14D0206BB1BEE9941FA09FC45F085EF815462078",
      "my-app03/src/store/useTodoStore.jsx|34|1104|AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9",
    ],
    uncoveredNotes: [
      "uncoveredFiles의 형식은 normalized path|lines|bytes|SHA-256이며 미독이 아니라 67-file 전수 감사에서 대표 SessionSource로 중복 인용하지 않은 42 code files입니다.",
      "inventory matcher는 useState|useReducer|createContext|useContext|create(|persist(|set((|get() 구조를 사용했고 app별 totals는 49/1,669/57,526, 7/352/15,083, 11/901/38,375입니다.",
      "filesRead 72=67 state-flow code+5 REACT docs, filesUsed 30=25 representative code+5 docs이며 모든 30 sources는 executable example sourceRefs에 사용됩니다.",
      "동일 hash를 가진 app2/app3 Memo/Todo store/page copies와 source spelling drift도 원본을 고치지 않고 provenance로 보존했습니다.",
      "source package versions는 React 19.2.x, react-router-dom 7.15 계열과 Zustand 5.0.x snapshot이며 current recommendations와 구분합니다.",
      "실제 user/profile/domain/storage/route/endpoint/token/password-like literals는 source evidence, examples, diagnostics, telemetry와 artifacts에 복사하지 않았습니다.",
      "Node models는 actual React rendering, Zustand/query middleware, browser storage, network/server authority, accessibility와 disaster restore를 대체하지 않으므로 lab evidence를 요구합니다.",
    ],
  },
});

export default session;
