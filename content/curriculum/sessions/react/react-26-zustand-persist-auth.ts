import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-persist-auth-audit", title: "원본 persist·auth 경계와 버전을 먼저 감사합니다",
    lead: "my-app02 package/lock, auth·todo·memo stores와 REACT 문서·archive·integration stores를 read-only·sanitized 감사해 무엇이 저장되고 무엇이 UI 신호인지 분리합니다.",
    mechanism: "원본 세 my-app02 stores는 persist wrapper를 사용하고 explicit partialize/version/migrate가 보이지 않으며 auth store는 user-like UI state와 boolean을 함께 둡니다. integration auth snapshot은 middleware persist 대신 logout에서 browser storage 항목을 직접 제거하고 guestbook snapshot은 persistence가 없습니다.",
    workflow: "dependency exact version, store fields/actions, persist options, storage API use, login/logout transition과 consumers를 값 없는 graph로 만들고 공식 5.x persist contract와 대조합니다.",
    invariants: "원본은 변경되지 않고 실제 profile·storage key·live path·credential·endpoint가 공개되지 않으며 UI authentication indication을 server authorization 보장으로 표현하지 않습니다.",
    edgeCases: "local lock 5.0.13과 current 5.0.14 patch drift, archive 설명 drift, functions의 JSON omission, manually cleared keys와 non-persisted store를 포함합니다.",
    failureModes: "persist wrapper가 있다는 사실만으로 안전한 세션 복원이라 부르거나 boolean isLoggedIn을 권한 증명으로 믿으면 tampering과 stale session이 보안 결함이 됩니다.",
    verification: "line·byte·SHA-256, package tree, persist option inventory, serializable-field allowlist, sourceRefs와 official version을 자동 확인합니다.",
    operations: "store schema/version·hydration result와 source digest drift를 release evidence에 남기고 민감 payload는 수집하지 않습니다.",
    concepts: [c("persist boundary", "store state 중 browser storage에 serialize했다가 rehydrate할 범위를 정한 경계입니다.", ["state 전체와 같지 않습니다.", "보안 경계도 아닙니다."]), c("UI auth state", "화면 표시와 request coordination을 위한 client-side 사용자·상태 신호입니다.", ["변조 가능합니다.", "server 권한 판정을 대체하지 않습니다."]), c("sanitized audit", "원본 값 대신 field/action/options 구조와 digest만 공개 provenance로 남기는 감사입니다.", ["식별 값을 제거합니다.", "재현성을 유지합니다."])],
    codeExamples: [node("react26-source-policy-audit", "persist source policy inventory", "React26SourcePolicyAudit.mjs", "세 store 유형과 explicit hardening option 존재 여부를 값 없이 분류합니다.", String.raw`const stores = [
  { kind: "auth", persist: true, partialize: false, version: false },
  { kind: "entity", persist: true, partialize: false, version: false },
  { kind: "guestbook", persist: false, partialize: false, version: false },
];
const persisted = stores.filter((store) => store.persist).length;
const hardened = stores.filter((store) => store.persist && store.partialize && store.version).length;
console.log("stores=" + stores.length + "|persisted=" + persisted);
console.log("explicit-policy=" + hardened);
console.log("auth-authority=server-required");`, "stores=3|persisted=2\nexplicit-policy=0\nauth-authority=server-required", ["local-react26-package", "local-react26-lock", "local-react26-auth", "local-react26-todo", "local-react26-memo", "local-react26-doc-basics", "local-react26-doc-auth", "local-react26-archive", "local-react26-integration-auth", "local-react26-guestbook", "zustand-repository", "zustand-persist-api"] )],
  }),
  appliedTopic({
    id: "storage-adapter-envelope", title: "storage adapter와 versioned envelope를 설계합니다",
    lead: "persist는 name으로 storage item을 식별하고 storage adapter가 getItem·setItem·removeItem을 제공하지만 browser storage의 가용성·신뢰성·보안은 별도 문제입니다.",
    mechanism: "기본 browser 경로는 JSON storage를 통해 {state, version} envelope를 serialize합니다. localStorage는 origin 단위·동기 API이며 값은 same-origin JavaScript와 local user 환경에서 읽고 바꿀 수 있으므로 untrusted input입니다.",
    workflow: "고유하지만 비밀이 아닌 storage namespace, minimal persisted schema, runtime decoder, size budget, storage availability probe와 failure result를 정의합니다.",
    invariants: "storage name이 다른 store와 충돌하지 않고 deserialize 결과는 unknown에서 schema 검증하며 storage 성공 여부와 in-memory command 성공 여부를 구분합니다.",
    edgeCases: "storage undefined, SecurityError, quota, corrupted JSON, old tab, same origin multiple apps, async adapter와 serialization unsupported types를 포함합니다.",
    failureModes: "storage key를 secret처럼 취급하거나 JSON.parse 결과를 typed state로 단정하면 tampered data가 UI·request 흐름에 들어옵니다.",
    verification: "missing/invalid/oversized/versioned envelopes, get/set/remove throw/reject와 codec round trip을 fake adapter로 시험합니다.",
    operations: "read/write outcome·bytes·schema version·recovery reason만 관찰하고 serialized value 자체는 log·analytics에 보내지 않습니다.",
    concepts: [c("storage adapter", "persist가 state envelope를 읽고 쓰고 지우기 위해 사용하는 getItem·setItem·removeItem interface입니다.", ["sync/async가 가능합니다.", "failure를 주입합니다."]), c("persisted envelope", "state payload와 schema version을 함께 저장하는 외부 데이터 형식입니다.", ["runtime 검증합니다.", "actions는 저장 대상이 아닙니다."]), c("untrusted storage", "client나 script가 읽고 수정할 수 있어 진실·권한 근거로 신뢰할 수 없는 저장소입니다.", ["network input처럼 검증합니다.", "민감정보를 피합니다."])],
  }),
  appliedTopic({
    id: "hydration-state-machine", title: "hydration을 명시적 상태기계로 다룹니다",
    lead: "initial state와 persisted state가 합쳐지는 rehydrate 과정을 idle/loading/ready/error 같은 UI-visible lifecycle로 모델링해 깜빡임과 잘못된 redirect를 막습니다.",
    mechanism: "persist는 storage를 읽고 version/migrate를 처리한 뒤 merge하여 state를 교체하며 onHydrate·onFinishHydration·hasHydrated·onRehydrateStorage로 lifecycle을 관찰할 수 있습니다. sync storage와 async storage는 first render 시점이 다를 수 있습니다.",
    workflow: "server/initial snapshot→hydrating→decoded/migrated→merged→ready 또는 recoverable error 순서를 정의하고 auth routing은 ready 전 anonymous로 단정하지 않습니다.",
    invariants: "ready는 현재 hydration generation이 성공/정책적 fallback으로 끝났을 때만 true이고 오래된 concurrent rehydrate 결과는 최신 generation을 덮지 않습니다.",
    edgeCases: "empty storage, sync/async adapter, duplicate rehydrate, callback error, StrictMode lifecycle, store reset 중 hydration과 logout race를 포함합니다.",
    failureModes: "default false auth flag를 hydration 전 logout으로 해석하면 protected UI가 redirect flicker를 만들고 boolean hydrated 하나로 error와 never-started를 구분하지 못합니다.",
    verification: "state-machine transition table, sync/async timing, duplicate generation, callback order, unsubscribe와 error fallback을 deterministic promises로 시험합니다.",
    operations: "hydrate start/end/error·duration·version·stale-drop을 기록하고 raw state나 user identifier는 telemetry에서 제외합니다.",
    concepts: [c("rehydration", "storage의 persisted envelope를 읽어 current store state와 결합하는 과정입니다.", ["초기화와 구분합니다.", "실패할 수 있습니다."]), c("hydration gate", "persisted-dependent UI가 lifecycle ready 전 최종 결정을 내리지 못하게 하는 경계입니다.", ["loading/error를 표현합니다.", "무한 대기를 방지합니다."]), c("hydration generation", "동시에 시작된 rehydrate 중 최신 결과만 commit하도록 구분하는 식별자입니다.", ["race를 막습니다.", "logout epoch와 결합합니다."])],
    codeExamples: [node("react26-hydration-machine", "hydration lifecycle state machine", "React26HydrationMachine.mjs", "최신 generation만 ready를 commit하고 stale completion을 버립니다.", String.raw`let machine = { phase: "idle", generation: 0, staleDrops: 0 };
const start = () => { machine = { ...machine, phase: "hydrating", generation: machine.generation + 1 }; return machine.generation; };
const finish = (generation) => {
  if (generation !== machine.generation) { machine.staleDrops += 1; return false; }
  machine.phase = "ready"; return true;
};
const first = start();
const second = start();
const accepted = finish(second);
const stale = finish(first);
console.log("phase=" + machine.phase + "|generation=" + machine.generation);
console.log("latest-accepted=" + accepted + "|old-accepted=" + stale);
console.log("stale-drops=" + machine.staleDrops);`, "phase=ready|generation=2\nlatest-accepted=true|old-accepted=false\nstale-drops=1", ["zustand-persist-guide", "zustand-persist-api", "zustand-persist-source", "react-use-sync-external-store"])],
  }),
  appliedTopic({
    id: "partialize-allowlist", title: "partialize를 denylist가 아닌 allowlist로 사용합니다",
    lead: "persist할 fields를 명시적으로 반환해 actions, transient loading/error, request IDs, tokens와 불필요한 profile data가 storage envelope에 들어가지 않게 합니다.",
    mechanism: "partialize는 write 시 current state를 받아 persisted subset을 만듭니다. default는 state 전체를 넘기며 JSON serialization이 functions를 생략하더라도 그것을 보안 정책으로 의존해서는 안 됩니다.",
    workflow: "각 field를 durable preference, reconstructible cache, transient control, sensitive secret, server-authoritative로 분류하고 첫 범주 중 필요한 최소값만 allowlist합니다.",
    invariants: "persisted payload에 credentials/session identifiers/access·refresh tokens, sensitive PII와 actions가 없고 새 state field는 review 없이는 자동 저장되지 않습니다.",
    edgeCases: "nested profile, optional field, rename, dynamic slice, Set/Map codec, large cached list와 partialize type drift를 포함합니다.",
    failureModes: "나중에 추가된 secret field를 rest/spread로 자동 저장하거나 denylist에서 한 field를 빼먹으면 client storage에 민감 데이터가 남습니다.",
    verification: "serialized envelope key allowlist, forbidden-key recursive scan, new-field mutation test, size budget와 clear-after-policy-change를 시험합니다.",
    operations: "persisted schema keys·bytes·version만 관찰하고 policy 변경 때 old storage migration/clear와 privacy review를 실행합니다.",
    concepts: [c("partialize", "store state에서 실제 저장할 subset을 반환하는 persist option입니다.", ["write마다 적용됩니다.", "allowlist를 권장합니다."]), c("data minimization", "기능에 필요한 최소 데이터와 기간만 client storage에 두는 원칙입니다.", ["privacy와 복구를 개선합니다.", "cache도 검토합니다."]), c("forbidden key", "어떤 nesting에서도 persisted envelope에 존재하면 안 되는 credential·token·transient field입니다.", ["recursive scan합니다.", "이름만으로 충분하지 않을 수 있습니다."])],
    codeExamples: [node("react26-partialize-allowlist", "persist allowlist와 forbidden-field scan", "React26PartializeAllowlist.mjs", "synthetic state에서 durable preference만 남기고 token-like field와 action을 제외합니다.", String.raw`const state = { theme: "dark", locale: "ko", accessToken: "SYNTHETIC_ONLY", loading: true, logout: () => {} };
const partialize = ({ theme, locale }) => ({ theme, locale });
const persisted = partialize(state);
const serialized = JSON.stringify({ state: persisted, version: 2 });
console.log("keys=" + Object.keys(persisted).sort().join(","));
console.log("has-token=" + serialized.includes("accessToken"));
console.log("has-action=" + serialized.includes("logout"));`, "keys=locale,theme\nhas-token=false\nhas-action=false", ["zustand-persist-api", "zustand-persist-guide", "zustand-persist-source", "owasp-html5-storage"])],
  }),
  appliedTopic({
    id: "version-migrate-schema", title: "version과 migrate로 persisted schema를 진화시킵니다",
    lead: "store code가 바뀌어도 old browser data는 남으므로 rename·type change·default addition을 명시적 version migration으로 처리합니다.",
    mechanism: "stored version이 configured version과 다르면 persist는 migrate가 있을 때 old unknown state와 old version을 넘깁니다. migrate가 없으면 mismatched stored state를 사용하지 않는 계약을 전제로 fallback을 설계합니다.",
    workflow: "version을 breaking schema change마다 올리고 v0→v1→v2처럼 순차 pure migrations와 runtime decoder를 작성하며 fixture corpus로 모든 supported old versions를 시험합니다.",
    invariants: "migration은 deterministic·idempotent한 목표 schema를 만들고 sensitive/removed fields를 되살리지 않으며 unknown future version을 current decoder로 억지 해석하지 않습니다.",
    edgeCases: "missing version, malformed old state, skipped versions, async migrate, downgrade/rollback, old tab write와 partial migration을 포함합니다.",
    failureModes: "field rename 후 version을 올리지 않으면 default와 old field가 섞이고 migration이 input을 mutate하면 retry/dual-read에서 결과가 달라집니다.",
    verification: "golden v0/v1/current/future/corrupt fixtures, no-mutate freeze, repeat migration, forbidden-field scan과 rollback compatibility를 시험합니다.",
    operations: "migration from/to version, success/failure reason과 fallback count를 관찰하고 payload 값은 log하지 않으며 support window를 문서화합니다.",
    concepts: [c("persist schema version", "serialized state shape의 breaking evolution을 식별하는 정수입니다.", ["app version과 다릅니다.", "envelope에 저장됩니다."]), c("migration", "old unknown persisted state를 검증해 current persisted shape로 변환하는 함수입니다.", ["pure하게 만듭니다.", "fixtures를 보존합니다."]), c("future-version guard", "더 새 code가 쓴 state를 오래된 app이 안전하지 않게 읽지 않도록 거부하는 정책입니다.", ["downgrade를 고려합니다.", "사용자 복구를 안내합니다."])],
    codeExamples: [node("react26-version-migrate", "v0에서 v2로 순차 migration", "React26VersionMigrate.mjs", "rename과 default 추가를 pure migration chain으로 검증합니다.", String.raw`const migrations = {
  0: (state) => ({ theme: state.mode ?? "light" }),
  1: (state) => ({ ...state, locale: "ko" }),
};
const migrate = (input, from, target) => {
  let state = { ...input };
  for (let version = from; version < target; version += 1) state = migrations[version](state);
  return state;
};
const old = { mode: "dark" };
const current = migrate(old, 0, 2);
console.log("keys=" + Object.keys(current).sort().join(","));
console.log("theme=" + current.theme + "|locale=" + current.locale);
console.log("input-unchanged=" + (old.mode === "dark" && !Object.hasOwn(old, "theme")));`, "keys=locale,theme\ntheme=dark|locale=ko\ninput-unchanged=true", ["zustand-persist-api", "zustand-persist-guide", "zustand-persist-source"])],
  }),
  appliedTopic({
    id: "merge-nested-defaults", title: "custom merge로 nested defaults와 persisted subset을 보존합니다",
    lead: "persist의 default merge는 shallow이므로 old persisted nested object가 current code의 새 nested defaults 전체를 덮을 수 있습니다.",
    mechanism: "current state와 persisted state를 root에서 합치되 nested domain마다 schema-aware merge를 수행하고 actions는 current creator에서 유지합니다. persisted object를 그대로 신뢰하지 않고 decoded subset만 사용합니다.",
    workflow: "current defaults, decoded persisted subset, desired result를 key별 truth table로 만들고 shallow default로 손실되는 nested fields만 explicit merge합니다.",
    invariants: "새 current defaults와 actions가 남고 persisted user preference만 의도대로 우선하며 prototype pollution keys와 unexpected fields가 merge되지 않습니다.",
    edgeCases: "null vs missing, arrays replace/merge, deleted field, nested version, function/action, __proto__-like input과 locale defaults를 포함합니다.",
    failureModes: "generic deep merge는 arrays·deletion semantics·untrusted keys를 잘못 처리하고 shallow merge는 새 nested defaults를 지울 수 있습니다.",
    verification: "missing/null/partial/full nested fixtures, action identity, forbidden keys, no input mutation과 old-version result를 시험합니다.",
    operations: "merge fallback reason과 schema mismatch를 version에 연결하고 recoverable stored copy를 일정 기간 quarantine할 수 있게 합니다.",
    concepts: [c("hydration merge", "persisted decoded subset과 current creator state를 최종 rehydrated state로 결합하는 함수입니다.", ["default는 shallow입니다.", "schema-aware하게 대체할 수 있습니다."]), c("current default", "새 code가 모든 fresh store에 제공해야 하는 field/value입니다.", ["old storage 뒤에도 보존합니다.", "migration과 역할을 나눕니다."]), c("merge semantics", "missing/null/array/object 각각에서 어느 값을 우선하고 어떻게 결합할지 정한 규칙입니다.", ["generic deep merge를 피합니다.", "tests로 고정합니다."])],
    codeExamples: [node("react26-nested-merge", "schema-aware nested hydration merge", "React26NestedMerge.mjs", "old preference를 유지하면서 새 nested default와 action을 보존합니다.", String.raw`const action = () => "ok";
const current = { preferences: { theme: "light", density: "comfortable" }, logout: action };
const persisted = { preferences: { theme: "dark" } };
const shallow = { ...current, ...persisted };
const safe = { ...current, ...persisted, preferences: { ...current.preferences, ...persisted.preferences } };
console.log("shallow-density=" + String(shallow.preferences.density));
console.log("safe-theme=" + safe.preferences.theme + "|density=" + safe.preferences.density);
console.log("action-preserved=" + (safe.logout() === "ok"));`, "shallow-density=undefined\nsafe-theme=dark|density=comfortable\naction-preserved=true", ["zustand-persist-api", "zustand-persist-guide", "zustand-persist-source", "react-choosing-state"])],
  }),
  appliedTopic({
    id: "ssr-skip-hydration", title: "SSR에서 skipHydration과 manual rehydrate를 조정합니다",
    lead: "server에는 window storage가 없고 server HTML과 client first render가 달라질 수 있으므로 request-scoped store, initial snapshot parity와 hydration 시점을 함께 설계합니다.",
    mechanism: "skipHydration은 persist가 store initialization 때 자동 hydrate하지 않게 하고 persist.rehydrate를 chosen client lifecycle에서 호출하게 합니다. React hydrateRoot는 server/client 초기 출력의 일치를 요구하며 external store server snapshot도 동일해야 합니다.",
    workflow: "server-safe defaults로 request store를 만들고 동일 serializable initial snapshot을 client에 검증 전달한 뒤 mount 후 storage rehydrate를 시작하며 persisted-dependent UI를 hydration gate 뒤에 둡니다.",
    invariants: "server request 사이 state가 공유되지 않고 server HTML과 first client render가 일치하며 browser storage를 server render 중 읽지 않고 manual rehydrate가 중복 side effect를 만들지 않습니다.",
    edgeCases: "streaming, client-only route, StrictMode effect cycle, slow async storage, old persisted auth, multiple stores와 no-JavaScript rendering을 포함합니다.",
    failureModes: "server에서 module global auth store를 쓰면 privacy leak가 생기고 first client render에서 즉시 persisted user UI를 그리면 hydration mismatch 또는 content flash가 생깁니다.",
    verification: "two-request isolation, server/client markup snapshot, no-window test, delayed rehydrate, duplicate lifecycle와 error fallback을 시험합니다.",
    operations: "hydration mismatch, time-to-ready, request/store instance와 rehydrate count를 관찰하고 user payload는 기록하지 않습니다.",
    concepts: [c("skipHydration", "store 생성 때 persist의 자동 rehydrate를 건너뛰는 option입니다.", ["manual rehydrate가 필요합니다.", "SSR 시점 제어에 씁니다."]), c("first-render parity", "server HTML과 hydration 시 client 첫 render가 같은 사용자 출력 state를 만드는 조건입니다.", ["recoverable mismatch로 넘기지 않습니다.", "stable initial snapshot을 씁니다."]), c("request-scoped store", "각 server request가 독립 mutable store instance를 갖는 구조입니다.", ["cross-user leak를 막습니다.", "client instance와 구분합니다."])],
    codeExamples: [node("react26-ssr-hydration-gate", "SSR first-render와 manual hydration gate", "React26SsrHydrationGate.mjs", "server/client initial output을 같게 두고 storage completion 뒤에만 preference를 노출합니다.", String.raw`const render = (state) => state.phase === "ready" ? "theme:" + state.theme : "shell";
const server = { phase: "idle", theme: "light" };
const firstClient = { phase: "idle", theme: "light" };
const afterHydration = { phase: "ready", theme: "dark" };
console.log("server=" + render(server));
console.log("first-client=" + render(firstClient));
console.log("parity=" + (render(server) === render(firstClient)) + "|after=" + render(afterHydration));`, "server=shell\nfirst-client=shell\nparity=true|after=theme:dark", ["zustand-persist-api", "zustand-persist-guide", "zustand-persist-source", "react-hydrate-root", "react-use-sync-external-store", "zustand-repository"])],
  }),
  appliedTopic({
    id: "auth-authority-boundary", title: "persisted auth UI와 server authorization을 분리합니다",
    lead: "client store의 user/isLoggedIn 값은 편의적 rendering과 request coordination에 쓰되 protected resource·operation 허용은 server가 매 요청 다시 판단합니다.",
    mechanism: "browser 사용자는 DevTools나 script로 storage와 Zustand state를 바꿀 수 있습니다. 신뢰 가능한 authentication/session validity와 resource authorization은 server session/token validation, expiry, revocation과 object-level policy에서 결정됩니다.",
    workflow: "client auth lifecycle을 unknown/hydrating/anonymous/authenticated/refreshing/error로 표현하고 server response가 current identity·authorization의 최종 근거가 되게 합니다.",
    invariants: "persisted boolean/profile만으로 route data나 sensitive action이 허용되지 않고 401/403은 구분되며 account/tenant switch가 cache key와 request epoch를 바꿉니다.",
    edgeCases: "tampered storage, expired/revoked session, server logout, clock skew, offline UI, 401 refresh race, role change와 object ownership을 포함합니다.",
    failureModes: "client role 또는 isLoggedIn으로 button만 숨기고 server check가 없으면 direct request로 우회할 수 있고 stale profile이 다른 account 화면에 남을 수 있습니다.",
    verification: "tampered client state에도 server denial, expired/revoked/role-change matrix, 401 vs 403, cross-account cache isolation과 audit event를 시험합니다.",
    operations: "server auth outcome, session version, denial reason과 client epoch mismatch를 최소 정보로 관찰하며 credential·token·PII는 log하지 않습니다.",
    concepts: [c("authentication", "요청 주체가 누구인지 server가 신뢰 가능한 credential/session으로 확인하는 과정입니다.", ["client boolean과 다릅니다.", "expiry/revocation을 확인합니다."]), c("authorization", "확인된 주체가 특정 resource·operation을 수행할 수 있는지 server가 판단하는 과정입니다.", ["매 요청 적용합니다.", "object-level policy가 필요합니다."]), c("auth lifecycle", "unknown부터 authenticated/anonymous/error까지 client가 UI와 request를 조정하는 상태기계입니다.", ["권한 증명이 아닙니다.", "hydration과 연결합니다."])],
  }),
  appliedTopic({
    id: "credential-storage-boundary", title: "session identifier와 token을 localStorage persist에서 제외합니다",
    lead: "OWASP guidance에 따라 localStorage는 JavaScript가 항상 접근할 수 있고 XSS가 읽거나 변조할 수 있으므로 session identifiers와 민감정보 저장소로 사용하지 않습니다.",
    mechanism: "server-managed session architecture에서는 Secure·HttpOnly·SameSite 등 적절한 cookie attributes와 CSRF 방어를 threat model에 맞게 구성할 수 있습니다. 다른 token architecture도 memory/rotation/sender constraints를 별도 설계해야 하며 Zustand persist 자체는 credential vault가 아닙니다.",
    workflow: "credential transport/retention threat model을 먼저 작성하고 persist allowlist에는 theme·locale 같은 비민감 preference만 두며 authentication 상태는 server 확인으로 복원합니다.",
    invariants: "access/refresh/session tokens와 credentials가 localStorage/sessionStorage/IndexedDB, Zustand devtools, logs와 crash reports에 없고 cookie-based state-changing requests는 CSRF controls를 갖습니다.",
    edgeCases: "XSS, malicious extension, shared device, copied browser profile, subapps on same origin, remember-me, OAuth redirect, native/mobile storage와 service worker cache를 포함합니다.",
    failureModes: "HttpOnly cookie만 설정하면 모든 공격이 해결된다고 생각하거나 localStorage token을 encryption key와 함께 같은 client에 두면 실질 보호가 되지 않을 수 있습니다.",
    verification: "storage/devtools/log forbidden-pattern scan, cookie attribute integration, CSRF negative, XSS tabletop, logout revocation과 shared-device tests를 실행합니다.",
    operations: "credential leak indicator와 unexpected storage keys를 security monitoring에 연결하고 rotation/revocation/incident runbook을 연습합니다.",
    concepts: [c("HttpOnly", "browser script에서 cookie value 접근을 제한하는 attribute입니다.", ["전송·CSRF를 자동 해결하지 않습니다.", "server session과 함께 설계합니다."]), c("Secure", "cookie가 보안 transport에서만 전송되도록 하는 attribute입니다.", ["HTTPS와 함께 씁니다.", "local storage 보호가 아닙니다."]), c("SameSite", "cross-site request에서 cookie 전송 범위를 제한하는 attribute입니다.", ["application flow와 호환성을 검증합니다.", "CSRF defense-in-depth입니다."])],
    codeExamples: [node("react26-auth-storage-policy", "auth storage allowlist gate", "React26AuthStoragePolicy.mjs", "storage field policy가 token-like fields를 거부하고 preferences만 허용하는지 검증합니다.", String.raw`const fields = [
  { name: "theme", class: "preference" },
  { name: "locale", class: "preference" },
  { name: "accessToken", class: "credential" },
  { name: "sessionId", class: "credential" },
];
const allowed = fields.filter((field) => field.class === "preference").map((field) => field.name).sort();
const rejected = fields.filter((field) => field.class === "credential").map((field) => field.name).sort();
console.log("allowed=" + allowed.join(","));
console.log("rejected=" + rejected.join(","));
console.log("server-authorization=required");`, "allowed=locale,theme\nrejected=accessToken,sessionId\nserver-authorization=required", ["owasp-html5-storage", "owasp-session-management", "whatwg-web-storage", "zustand-persist-api"])],
  }),
  appliedTopic({
    id: "logout-epoch-cross-tab", title: "logout·account switch를 epoch와 cross-tab invalidation으로 완결합니다",
    lead: "화면 boolean만 false로 바꾸지 않고 in-flight requests, client caches, persisted envelope, server session과 다른 tabs를 하나의 identity transition으로 정리합니다.",
    mechanism: "logout/account switch 시작 시 authEpoch를 증가시키고 requests가 capture한 old epoch 결과를 폐기합니다. server logout/revocation, abort, cache clear, store reset, persist clear와 cross-context signal을 정의된 순서와 idempotency로 실행합니다.",
    workflow: "local UI lock→epoch increment/abort→server invalidation attempt→sensitive cache/reset→persist clear→other-tab notification→anonymous confirmation 순서와 offline fallback을 설계합니다.",
    invariants: "logout 완료 후 이전 identity의 response/cache/persisted profile이 다시 commit되지 않고 동일 command 반복이 안전하며 다른 tab도 server denial 또는 signal로 수렴합니다.",
    edgeCases: "server logout timeout, offline, storage event가 same document에 안 오는 경우, BroadcastChannel unavailable, simultaneous login/logout, old tab와 account switch를 포함합니다.",
    failureModes: "storage item만 지우면 in-memory/cache와 server session이 남고 async result가 뒤늦게 user state를 되살릴 수 있습니다.",
    verification: "deferred response after logout, two-tab harness, duplicate logout, server failure/offline, cache key isolation과 persisted key absence를 시험합니다.",
    operations: "logout step outcome, epoch mismatch/stale-drop, tabs acknowledgement와 server revocation result를 correlation하되 user/profile/token을 기록하지 않습니다.",
    concepts: [c("auth epoch", "login/logout/account switch마다 증가해 이전 identity 작업을 무효화하는 version입니다.", ["requests와 cache key에 capture합니다.", "commit 전에 비교합니다."]), c("cross-tab invalidation", "한 browsing context의 identity 변화가 같은 origin의 다른 contexts에 전달되는 절차입니다.", ["storage event/BroadcastChannel 등을 검토합니다.", "server validity가 최종 근거입니다."]), c("idempotent logout", "여러 번 또는 일부 실패 뒤 다시 실행해도 anonymous target state와 security outcome이 유지되는 logout입니다.", ["각 step을 재시도 가능하게 합니다.", "partial failure를 기록합니다."])],
    codeExamples: [node("react26-auth-epoch", "logout 뒤 stale response 폐기", "React26AuthEpoch.mjs", "old request가 logout 이후 client identity state를 복원하지 못하게 합니다.", String.raw`let state = { epoch: 7, phase: "authenticated", value: "current", staleDrops: 0 };
const requestEpoch = state.epoch;
const logout = () => { state = { ...state, epoch: state.epoch + 1, phase: "anonymous", value: null }; };
const commit = (epoch, value) => {
  if (epoch !== state.epoch) { state.staleDrops += 1; return false; }
  state.value = value; return true;
};
logout();
const accepted = commit(requestEpoch, "old-response");
console.log("phase=" + state.phase + "|epoch=" + state.epoch);
console.log("old-accepted=" + accepted + "|value=" + String(state.value));
console.log("stale-drops=" + state.staleDrops);`, "phase=anonymous|epoch=8\nold-accepted=false|value=null\nstale-drops=1", ["local-react26-auth", "local-react26-integration-auth", "owasp-session-management", "whatwg-web-storage", "react-choosing-state"])],
  }),
  appliedTopic({
    id: "storage-failure-recovery", title: "corrupt·unavailable·quota storage를 안전하게 복구합니다",
    lead: "persistence는 보조 기능이므로 storage 실패가 앱 전체 crash나 무한 loading을 만들지 않게 typed failure, in-memory fallback과 user-visible recovery를 설계합니다.",
    mechanism: "adapter get/set/remove는 throw 또는 Promise rejection할 수 있고 JSON parse·migration·merge도 실패할 수 있습니다. error를 unavailable/corrupt/incompatible/quota/unknown으로 분류해 데이터 정책에 맞는 복구를 선택합니다.",
    workflow: "operation try→stable error classify→sensitive data quarantine/clear policy→safe current defaults→hydration ready-with-warning 또는 blocking error→retry/backoff 순서로 처리합니다.",
    invariants: "corrupt payload를 부분 신뢰하지 않고 failure 뒤 current action shape가 유지되며 retry loop가 main thread/network를 소진하지 않고 auth는 server 확인 없이 authenticated로 복구되지 않습니다.",
    edgeCases: "private mode, disabled cookies/storage, full quota, malformed JSON, future version, adapter timeout, clear failure와 crash mid-write를 포함합니다.",
    failureModes: "모든 error에서 조용히 clear하면 사용자가 복구할 비민감 preference를 잃고 모든 error에서 old data를 유지하면 incompatible/auth state가 계속 재실행됩니다.",
    verification: "각 failure injection, bounded retry, fallback UI, action availability, telemetry redaction과 restart recovery를 시험합니다.",
    operations: "error class·operation·version·bytes·retry count만 관찰하고 threshold 초과 시 persistence disable flag와 support runbook을 실행합니다.",
    concepts: [c("storage failure class", "가용성·손상·호환성·quota처럼 복구 정책이 다른 stable error 범주입니다.", ["raw exception을 감쌉니다.", "telemetry key로 씁니다."]), c("in-memory fallback", "비민감 persistence가 실패해도 current session 동안 store 기능을 유지하는 임시 state입니다.", ["보안 신뢰를 높이지 않습니다.", "warning을 제공할 수 있습니다."]), c("quarantine", "손상되거나 future-version인 payload를 바로 반복 사용하지 않되 진단/사용자 복구 정책에 따라 격리하는 절차입니다.", ["민감 데이터는 최소화합니다.", "보존 기간을 둡니다."])],
    codeExamples: [node("react26-storage-recovery", "storage failure 분류와 fallback", "React26StorageRecovery.mjs", "malformed JSON을 current defaults로 복구하고 stable failure code를 남깁니다.", String.raw`const decode = (raw, fallback) => {
  try {
    const envelope = JSON.parse(raw);
    if (!envelope || typeof envelope.version !== "number" || typeof envelope.state !== "object") return { state: fallback, code: "invalid-shape" };
    return { state: envelope.state, code: "ok" };
  } catch { return { state: fallback, code: "corrupt-json" }; }
};
const fallback = { theme: "light" };
const result = decode("{broken", fallback);
console.log("code=" + result.code);
console.log("theme=" + result.state.theme);
console.log("fallback-shared=" + (result.state === fallback));`, "code=corrupt-json\ntheme=light\nfallback-shared=true", ["zustand-persist-guide", "zustand-persist-source", "whatwg-web-storage", "owasp-html5-storage"])],
  }),
  appliedTopic({
    id: "qualification-migration-operations", title: "persist/auth를 fixture corpus와 release gate로 운영합니다",
    lead: "happy-path reload만 확인하지 않고 schema corpus, hydration timing, security negatives, SSR, logout races와 rollback을 한 qualification matrix로 묶습니다.",
    mechanism: "pure decoder/migrate/merge tests, fake storage lifecycle tests, React hydration/auth routing tests, browser multi-tab tests와 server authorization integration을 계층별로 실행합니다.",
    workflow: "source audit→persist policy→fixture corpus→old/new dual-read→canary→schema write enable→old code retirement 순서로 deploy하며 downgrade compatibility 또는 storage version fence를 둡니다.",
    invariants: "모든 supported old fixture가 current safe shape로 수렴하고 forbidden data가 어떤 artifact에도 없으며 rollback code가 future payload를 unsafe하게 읽지 않습니다.",
    edgeCases: "mixed app versions, old tabs, mobile async storage, partial deploy, server session version change, offline logout와 rollback을 포함합니다.",
    failureModes: "new schema를 먼저 write하고 old app rollback을 준비하지 않으면 old code가 future state를 오해하며 production payload를 test fixture로 복사하면 privacy incident가 됩니다.",
    verification: "v0/current/future/corrupt fixtures, sync/async hydration, SSR parity, tamper/server denial, forbidden scan, multi-tab logout, canary metrics와 rollback rehearsal를 release gate로 둡니다.",
    operations: "version별 hydrate/migrate/fallback/logout outcomes와 latency를 dashboard/runbook에 연결하고 kill switch, storage clear migration과 server revocation 절차를 연습합니다.",
    concepts: [c("fixture corpus", "supported old/current/future/corrupt persisted envelopes를 synthetic 값으로 모은 regression set입니다.", ["production data를 복사하지 않습니다.", "version마다 보존합니다."]), c("version fence", "호환되지 않는 future persisted state를 old code가 읽거나 덮지 못하게 하는 release 정책입니다.", ["mixed deploy를 고려합니다.", "rollback과 연결합니다."]), c("security negative", "tamper·expired·revoked·forbidden storage처럼 반드시 거부되어야 하는 test case입니다.", ["server denial까지 봅니다.", "UI hide만 검사하지 않습니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-react26-package", repository: "local learning source", path: "my-app02/package.json", usedFor: ["declared React/Zustand ranges", "persist version context"], evidence: "2026-07-14 read-only audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. package names/versions만 구조적으로 사용했습니다." },
  { id: "local-react26-lock", repository: "local learning source", path: "my-app02/package-lock.json", usedFor: ["installed Zustand 5.0.13 evidence", "reproducibility"], evidence: "2026-07-14 read-only audit: 17,419 lines, 674,984 bytes, SHA-256 E7D13FE49A9DD89B4F3528668666B5637145990D7570369FDDF6DF6C1D63C400. installed 5.0.13과 lockfileVersion 3만 사용했습니다." },
  { id: "local-react26-auth", repository: "local learning source", path: "my-app02/src/store/useAuthStore.jsx", usedFor: ["persisted UI auth state/action shape", "logout/update boundary"], evidence: "2026-07-14 read-only sanitized audit: 33 lines, 1,737 bytes, SHA-256 DA8F4C6AB40D340827A8205484AD98EC3693D4BF2073B922D5521E1734FE9653. 실제 profile values와 storage name은 복사하지 않았습니다." },
  { id: "local-react26-todo", repository: "local learning source", path: "my-app02/src/store/useTodoStore.jsx", usedFor: ["default persist scope comparison", "entity state durability"], evidence: "2026-07-14 read-only sanitized audit: 34 lines, 1,104 bytes, SHA-256 AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9. entity values와 storage name은 복사하지 않았습니다." },
  { id: "local-react26-memo", repository: "local learning source", path: "my-app02/src/store/useMemoStroe.jsx", usedFor: ["default persist scope comparison", "date/ID persistence caveats"], evidence: "2026-07-14 read-only sanitized audit: 36 lines, 1,363 bytes, SHA-256 3CE0CDFAEEC21A71EB551FFC14D0206BB1BEE9941FA09FC45F085EF815462078. 실제 content는 복사하지 않았고 filename typo는 provenance로만 유지합니다." },
  { id: "local-react26-doc-basics", repository: "local learning source", path: "REACT/docs/react/10-zustand-basics.md", usedFor: ["persist introduction audit", "reload learning flow"], evidence: "2026-07-14 read-only sanitized audit: 134 lines, 6,356 bytes, SHA-256 36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D. embedded values와 live references는 복사하지 않았습니다." },
  { id: "local-react26-doc-auth", repository: "local learning source", path: "REACT/docs/react/11-zustand-auth-crud.md", usedFor: ["auth/CRUD persistence progression", "security boundary correction"], evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. account-like flow, paths와 endpoint-like text는 복사하지 않았습니다." },
  { id: "local-react26-archive", repository: "local learning source", path: "REACT/docs/archive/notion-raw/react-zustand-2.md", usedFor: ["historical auth/persist structure", "current lifecycle extension"], evidence: "2026-07-14 read-only sanitized audit: 87 lines, 4,581 bytes, SHA-256 D7698A8363617E766850ACBB1D9066420BCF8246C8670D56FD9AD0411B15FBA8. raw values는 인용하지 않았습니다." },
  { id: "local-react26-integration-auth", repository: "local learning source", path: "REACT/code/react/03-integration-my-app03/src/store/useAuthStore.jsx", usedFor: ["manual storage cleanup on logout", "non-persist middleware comparison"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 901 bytes, SHA-256 1B711EB3A35E32B03546AA6A9F1AB5A78D2AC040EC58EC123C7138E4EA376459. 실제 storage keys와 UI values는 복사하지 않았습니다." },
  { id: "local-react26-guestbook", repository: "local learning source", path: "REACT/code/react/03-integration-my-app03/src/store/useGuestbookStore.jsx", usedFor: ["non-persisted entity store comparison", "durability decision boundary"], evidence: "2026-07-14 read-only sanitized audit: 21 lines, 562 bytes, SHA-256 DA1A28E1BD3D8A7632530089011576C1FC7F4BE6A75D9001BFCD04323BABF209. entity values는 복사하지 않았습니다." },
  { id: "zustand-repository", repository: "pmndrs/zustand official repository", path: "README.md", publicUrl: "https://github.com/pmndrs/zustand", usedFor: ["persist middleware overview", "server-component privacy warning", "external store API"], evidence: "Zustand 공식 repository README의 persist와 server usage caution입니다." },
  { id: "zustand-persist-api", repository: "Zustand official documentation", path: "reference/middlewares/persist", publicUrl: "https://zustand.docs.pmnd.rs/reference/middlewares/persist", usedFor: ["persist signature/options", "partialize/version/migrate/merge/skipHydration"], evidence: "Zustand 공식 persist middleware reference입니다." },
  { id: "zustand-persist-guide", repository: "Zustand official documentation", path: "reference/integrations/persisting-store-data", publicUrl: "https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data", usedFor: ["storage adapters", "hydration lifecycle", "manual rehydrate patterns"], evidence: "Zustand 공식 persisting-store-data integration guide입니다." },
  { id: "zustand-persist-source", repository: "pmndrs/zustand official repository", path: "src/middleware/persist.ts", publicUrl: "https://github.com/pmndrs/zustand/blob/main/src/middleware/persist.ts", usedFor: ["current option defaults", "hydration version race guard", "persist API lifecycle"], evidence: "2026-07-14 Zustand 공식 main source에서 default partialize/version/merge, hydration generation과 hasHydrated/listeners contract를 확인했습니다. local installed 5.0.13 source와 동일하다고 단정하지 않습니다." },
  { id: "react-use-sync-external-store", repository: "React official API", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["snapshot immutability", "subscribe cleanup", "server snapshot parity"], evidence: "React 공식 external-store contract입니다." },
  { id: "react-hydrate-root", repository: "React official API", path: "reference/react-dom/client/hydrateRoot", publicUrl: "https://react.dev/reference/react-dom/client/hydrateRoot", usedFor: ["server/client initial output parity", "hydration mismatch handling"], evidence: "React 공식 hydrateRoot API입니다." },
  { id: "react-choosing-state", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["auth lifecycle state design", "derived/duplicated state prevention"], evidence: "React 공식 state structure guide입니다." },
  { id: "whatwg-web-storage", repository: "WHATWG HTML Standard", path: "webstorage", publicUrl: "https://html.spec.whatwg.org/multipage/webstorage.html", usedFor: ["Storage API and origin model", "storage event/cross-context behavior"], evidence: "WHATWG HTML Standard의 Web Storage normative section입니다." },
  { id: "owasp-html5-storage", repository: "OWASP Cheat Sheet Series", path: "HTML5 Security/Local Storage", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", usedFor: ["localStorage sensitive-data prohibition", "JavaScript access and tampering risk"], evidence: "OWASP 공식 HTML5 Security guidance의 Local Storage section입니다." },
  { id: "owasp-session-management", repository: "OWASP Cheat Sheet Series", path: "Session Management", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session lifecycle", "cookie attributes", "logout/revocation security"], evidence: "OWASP 공식 Session Management guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "react-26-zustand-persist-auth", slug: "react-26-zustand-persist-auth",
  courseId: "react", moduleId: "react-state-management", order: 6,
  title: "Zustand persist·인증 상태 생명주기", subtitle: "persisted state를 untrusted versioned envelope로 다루고 hydration·migration·SSR·storage failure와 client/server 인증 경계를 하나의 운영 수명주기로 완성합니다.",
  level: "고급", estimatedMinutes: 130,
  coreQuestion: "새로고침 뒤 편의 상태를 안전하게 복원하면서 old/corrupt storage, SSR hydration, logout race와 server authorization을 어떻게 정확히 분리하고 연결할까요?",
  summary: "my-app02 package/lock과 auth·todo·memo stores, REACT Zustand 기본/auth 문서, archive, integration auth/guestbook stores를 read-only·sanitized 감사했습니다. 원본 persist wrappers와 UI auth boolean/profile shape를 학습 provenance로 보존하되 authentication/authorization 보장으로 과장하지 않습니다. storage envelope·runtime validation, hydration state machine, partialize allowlist, version/migrate, schema-aware merge, SSR skipHydration, client UI와 server authority, credential storage prohibition, auth epoch·cross-tab logout, corrupt/quota recovery와 release qualification을 공식 Zustand source/docs, React, WHATWG와 OWASP 근거 및 여덟 deterministic Node models로 깊게 연결합니다.",
  objectives: ["원본 persist/auth 구조와 installed version을 hash evidence로 감사한다.", "storage adapter/envelope를 untrusted input으로 검증한다.", "sync/async hydration을 상태기계와 generation으로 통제한다.", "partialize allowlist로 최소 비민감 state만 저장한다.", "version/migrate fixture corpus로 schema를 진화시킨다.", "custom merge로 nested defaults와 actions를 보존한다.", "skipHydration, request scope와 first-render parity를 지킨다.", "client auth UI와 server authentication/authorization을 분리한다.", "credential/session identifiers를 client persistence에서 제외한다.", "logout epoch, caches, persistence와 cross-tab invalidation을 조정한다.", "storage failure와 rollback을 운영 evidence로 qualification한다."],
  prerequisites: [{ title: "Zustand selector·slice와 render 경계", reason: "store instance scope, selector subscription과 slice ownership을 알아야 persisted subset·hydration notification·auth consumers를 안전하게 설계할 수 있습니다.", sessionSlug: "react-25-zustand-selector-slices" }],
  keywords: ["Zustand", "persist", "hydration", "partialize", "version", "migrate", "merge", "skipHydration", "authentication", "authorization", "auth epoch", "localStorage", "SSR", "security"],
  topics,
  lab: {
    title: "persisted preference와 server-authoritative auth lifecycle qualification",
    scenario: "원본 files는 변경하지 않고 synthetic preference·identity states, fake sync/async storage와 local authorization test server로 reload, migration, tampering, SSR와 logout races를 재현합니다.",
    setup: ["Node.js 20 이상", "React 19.2 compatible SSR/hydration fixture", "Zustand 5.0.13 local 및 current patch matrix", "fake sync/async/failing storage adapters", "synthetic v0/current/future/corrupt envelopes", "two-tab browser harness", "local authorization stub with no real endpoint/credential", "원본 10 files read-only"],
    steps: ["10 local source line·byte·SHA-256과 persist option inventory를 재검증합니다.", "persisted fields를 preference/transient/sensitive/server-authoritative로 분류하고 allowlist schema를 만듭니다.", "storage envelope decoder와 missing/corrupt/future/quota error taxonomy를 구현합니다.", "sync/async, duplicate generation과 onHydrate/onFinish/error lifecycle을 상태기계로 시험합니다.", "v0→current migrations, forbidden-field removal과 deterministic repeat를 fixture corpus로 검증합니다.", "shallow failure case와 schema-aware nested merge/action preservation을 시험합니다.", "request-scoped server defaults, skipHydration/manual rehydrate와 hydrateRoot first-render parity를 검증합니다.", "tampered client authenticated/role state에도 local server가 protected request를 거부하는지 확인합니다.", "storage/devtools/log에 credential/session identifiers가 없는지 scan하고 cookie/session controls를 integration test합니다.", "logout 중 deferred response, cache reset, persist clear, two-tab signal과 server revocation을 epoch로 검증합니다.", "canary metrics, mixed-version fence, storage failure kill switch와 rollback rehearsal를 통과시킵니다."],
    expectedResult: ["persisted envelope에는 allowlisted non-sensitive fields와 schema version만 있습니다.", "old/corrupt/future storage가 typed migration 또는 safe fallback으로 수렴하고 current action/default shape를 보존합니다.", "server HTML과 first client output이 일치하며 hydration ready 전 auth redirect를 확정하지 않습니다.", "tampered persisted auth state로 protected server operation을 수행할 수 없습니다.", "logout 뒤 old responses/caches/persisted profile이 되살아나지 않고 다른 tabs와 server validity가 anonymous로 수렴합니다.", "storage unavailable/quota/corrupt cases에도 bounded recovery와 redacted evidence가 남습니다."],
    cleanup: ["temporary stores, storage items, cookies/sessions, listeners, channels, React roots, SSR/local servers와 deferred requests를 제거합니다.", "synthetic envelopes, caches, traces와 generated fixtures를 폐기합니다.", "feature flags, fake clocks와 verbose instrumentation을 원복합니다.", "원본 10 files의 hashes와 working-tree unchanged 상태를 확인합니다."],
    extensions: ["Web Crypto를 쓰더라도 browser-held key threat model의 한계를 분석합니다.", "React Native async secure storage adapter를 별도 platform policy로 qualification합니다.", "multi-tenant account switch와 per-tenant cache namespace를 property-based sequence로 시험합니다.", "다음 CRUD/server-sync 세션에 auth epoch와 optimistic request identity를 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node models를 실행하고 actual Zustand persist/React/browser/server fixture의 어느 계약을 축약했는지 표로 연결하세요.", requirements: ["stdout 완전 일치", "source policy audit", "hydration generation", "partialize scan", "migration", "nested merge", "SSR parity", "auth storage policy", "auth epoch", "failure recovery", "model 범위"], hints: ["Node model이 browser storage timing, React hydration 또는 server authorization을 실행했다고 표현하지 마세요."], expectedOutcome: "serialize→read→decode→migrate→merge→hydrate→authorize→logout/recover 전체 수명주기를 설명합니다.", solutionOutline: ["audit→minimize→hydrate→migrate/merge→isolate→authorize→invalidate→recover 순서입니다."] },
    { difficulty: "응용", prompt: "원본 auth store를 non-sensitive persisted preference와 server-authoritative session lifecycle로 재설계하세요.", requirements: ["auth state machine", "partialize allowlist", "runtime decoder", "version/migrate", "custom merge", "skipHydration SSR", "no token persistence", "epoch logout", "cross-tab", "server negatives"], hints: ["isLoggedIn boolean을 안전하게 저장하는 방법보다 왜 권한 근거가 될 수 없는지를 먼저 증명하세요."], expectedOutcome: "reload 편의는 유지하되 tamper·expiry·logout race·SSR에서도 authorization과 privacy를 지키는 lifecycle이 완성됩니다.", solutionOutline: ["threat model→schema→hydration→server confirmation→request/cache epoch→logout/recovery 순서입니다."] },
    { difficulty: "설계", prompt: "팀의 Zustand persistence·authentication 운영 표준과 incident runbook을 작성하세요.", requirements: ["data classification", "storage adapter/error taxonomy", "hydration SLA", "schema support window", "SSR isolation", "credential policy", "server authorization", "logout/revocation", "telemetry redaction", "version fence/rollback"], hints: ["정상 reload뿐 아니라 future version, old tab, quota, XSS와 server revocation을 표준 입력으로 넣으세요."], expectedOutcome: "설계·CI·배포·incident 대응이 같은 persistence/auth invariants를 재검증합니다.", solutionOutline: ["classify→encode→restore→verify authority→invalidate→observe→recover 순서입니다."] },
  ],
  nextSessions: ["react-27-crud-state-server-sync"], sources,
  sourceCoverage: { filesRead: 10, filesUsed: 10, uncoveredNotes: ["my-app02 package/lock과 auth·todo·memo stores, REACT current docs/archive와 integration auth/guestbook stores를 read-only·sanitized 감사했습니다.", "원본 auth user-like fields와 boolean은 UI source observation일 뿐 authentication/session validity 또는 authorization evidence로 사용하지 않습니다.", "원본 profile values, storage names/keys, visible strings, live paths와 endpoint-like text는 공개 content/examples에 복사하지 않았습니다.", "integration auth의 manual storage removals는 key 이름 없이 lifecycle gap 분석에만 사용했고 guestbook store는 persistence가 없는 comparison입니다.", "default persist가 state를 partialize에 넘기고 JSON이 functions를 생략할 수 있어도 actions/secret exclusion을 serializer 우연에 의존하지 않고 explicit allowlist로 교정했습니다.", "Node models는 actual Zustand middleware/browser storage/React SSR·hydration/network/server authorization/cookie policy를 대체하지 않아 lab integration을 별도로 요구합니다.", "Zustand official main persist source에는 hydration generation 개선 등 current behavior가 있으므로 local installed 5.0.13과 동일하다고 단정하지 않고 version matrix를 요구합니다."] },
});

export default session;
