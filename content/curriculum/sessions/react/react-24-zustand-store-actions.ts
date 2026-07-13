import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-version-contract", title: "원본 store와 설치 버전을 먼저 감사합니다",
    lead: "my-app02와 REACT archive를 read-only·sanitized 방식으로 읽고, 예제의 실제 Zustand 버전과 현재 문서 계약을 분리해 기록합니다.",
    mechanism: "package manifest의 semver range, lockfile의 resolved version, store factory와 consumer graph를 각각 증거로 고정합니다. 로컬 manifest는 ^5.0.13, lockfile은 5.0.13이며 2026-07-14 공식 npm/GitHub 기준 현재 배포는 5.0.14이므로 patch 차이를 명시합니다.",
    workflow: "파일별 line·byte·SHA-256을 기록하고 create/persist/set/get 사용 위치, state field, action, storage 경계를 값이 아닌 구조로 추출한 뒤 공식 API와 대조합니다.",
    invariants: "원본 파일은 변경되지 않고 공개 본문에는 credential·개인정보·실제 endpoint·식별 가능한 UI 문자열이 없으며 local observation과 current official contract를 같은 버전처럼 섞지 않습니다.",
    edgeCases: "^5.0.13 같은 caret range가 같은 major 안의 이후 minor·patch를 허용하는 경우, lockfile 누락, workspace 중복 설치, transitive duplicate, 문서 main branch와 설치 package 차이를 포함합니다.",
    failureModes: "manifest만 보고 실행 버전을 단정하거나 archive 설명을 현재 API의 보장으로 인용하면 재현성과 upgrade 판단이 동시에 무너집니다.",
    verification: "npm dependency tree, lockfile exact version, source hash 재계산, official package version과 모든 sourceRef의 존재를 자동 확인합니다.",
    operations: "source digest drift와 dependency update를 release evidence로 남기고 patch upgrade 때 examples·types·React integration suite를 다시 qualification합니다.",
    concepts: [c("version evidence", "실제로 실행되는 dependency 버전을 manifest·lockfile·runtime에서 교차확인한 기록입니다.", ["range와 exact version을 구분합니다.", "확인 날짜를 남깁니다."]), c("structural provenance", "민감한 원본 값을 복사하지 않고 API·state·action 구조와 digest만 보존하는 출처 추적입니다.", ["원본 변경 여부를 확인합니다.", "공개 안전성을 지킵니다."]), c("contract drift", "설치 버전과 최신 문서 또는 archive 설명 사이의 의미 차이입니다.", ["patch라도 test합니다.", "관찰과 보장을 분리합니다."])],
    codeExamples: [node("react24-version-gate", "설치·현재 버전 차이 gate", "React24VersionGate.mjs", "세 가지 version evidence를 비교하고 자동 upgrade 여부를 결정합니다.", String.raw`const evidence = { requested: "^5.0.13", locked: "5.0.13", official: "5.0.14" };
const lockedParts = evidence.locked.split(".").map(Number);
const officialParts = evidence.official.split(".").map(Number);
const sameMajorMinor = lockedParts[0] === officialParts[0] && lockedParts[1] === officialParts[1];
const patchDrift = sameMajorMinor && lockedParts[2] !== officialParts[2];
const decision = patchDrift ? "retest-before-upgrade" : "investigate-range";
console.log("requested=" + evidence.requested);
console.log("locked=" + evidence.locked + "|official=" + evidence.official);
console.log("patch-drift=" + patchDrift + "|decision=" + decision);`, "requested=^5.0.13\nlocked=5.0.13|official=5.0.14\npatch-drift=true|decision=retest-before-upgrade", ["local-react24-package", "local-react24-lock", "local-react24-doc", "local-react24-archive", "zustand-npm", "zustand-repository", "zustand-create-api"])],
  }),
  appliedTopic({
    id: "create-state-creator-api", title: "create와 state creator의 실행 경계를 해부합니다",
    lead: "Zustand store를 전역 객체라는 막연한 말 대신 state creator가 set·get·store API를 받아 state와 actions를 반환하는 external-store contract로 설명합니다.",
    mechanism: "create(stateCreator)는 React hook과 getState·setState·getInitialState·subscribe가 붙은 store API를 만듭니다. component selector read와 event handler의 imperative read는 같은 state owner를 보지만 subscription 수명은 다릅니다.",
    workflow: "state shape, command actions, derived selectors, external effects를 분리하고 hook selector는 render read에, getState는 snapshot만 필요한 non-reactive path에, subscribe는 명시적 cleanup이 있는 integration에 배치합니다.",
    invariants: "state creator는 동일 초기 입력에서 예측 가능한 shape를 만들고 action 이름은 business transition을 표현하며 component render 중 imperative mutation을 실행하지 않습니다.",
    edgeCases: "store를 module singleton으로 둘 수 없는 SSR request, tests 간 state leak, multiple roots, action이 get으로 다른 action을 조합하는 경우를 포함합니다.",
    failureModes: "getState로 읽은 값을 UI에 사용하면서 subscribe하지 않으면 stale UI가 되고, component body에서 setState를 호출하면 render loop와 순서 의존이 생깁니다.",
    verification: "initial state shape, hook selector result, imperative snapshot, subscribe/unsubscribe count와 per-request store isolation을 별도 test로 확인합니다.",
    operations: "store instance 수, listener 수, action reason과 unexpected module singleton reuse를 관찰하고 instance factory로 rollback할 수 있게 합니다.",
    concepts: [c("state creator", "set·get·store API를 받아 초기 state와 actions를 반환하는 함수입니다.", ["store 생성 시 실행됩니다.", "side effect를 최소화합니다."]), c("bound store hook", "React selector subscription과 vanilla store API가 결합된 create의 반환값입니다.", ["hook 규칙을 따릅니다.", "attached API는 React 밖에서도 씁니다."]), c("non-reactive read", "getState로 현재 값을 읽되 이후 변화에 자동 구독하지 않는 읽기입니다.", ["event·adapter에 유용합니다.", "render UI에는 selector가 기본입니다."])],
  }),
  appliedTopic({
    id: "set-merge-replace", title: "set의 shallow merge와 replace flag를 구분합니다",
    lead: "짧은 set({count})가 안전한 이유와 set(next, true)가 actions까지 지울 수 있는 이유를 key-level transition으로 추적합니다.",
    mechanism: "기본 set은 반환한 partial object를 root state에 한 단계 shallow merge합니다. 두 번째 인자 true는 전체 state를 교체하므로 누락된 state와 action keys가 제거됩니다.",
    workflow: "action마다 before keys, returned partial, replace flag, after keys를 표로 만들고 reset·logout·entity clear가 merge인지 replace인지 명시합니다.",
    invariants: "일반 action 뒤에는 store API가 요구하는 모든 action keys가 남고 replace를 쓸 때는 완전한 state shape 또는 의도한 terminal state가 제공됩니다.",
    edgeCases: "undefined field, nested object partial, function key, reset initial state, devtools middleware와 persisted rehydrate가 replace를 사용하는 경우를 포함합니다.",
    failureModes: "nested patch가 자동 deep merge된다고 믿으면 sibling field가 사라지고, set({}, true)로 data만 비운다고 생각하면 다음 UI event에서 action이 undefined가 됩니다.",
    verification: "key-set snapshot, action callable assertion, nested sibling preservation과 reset 후 selector contract를 정상·replace 양쪽에서 시험합니다.",
    operations: "missing-action error와 replace reason을 기록하고 destructive replace는 code review allowlist와 rollback test로 제한합니다.",
    concepts: [c("shallow merge", "partial state의 root keys만 current state에 합치는 기본 set 동작입니다.", ["한 단계만 병합합니다.", "nested copy는 직접 만듭니다."]), c("replace flag", "set의 두 번째 인자를 true로 주어 전체 state를 반환값으로 바꾸는 선택입니다.", ["actions도 제거될 수 있습니다.", "완전한 shape를 검증합니다."]), c("shape invariant", "어떤 transition 뒤에도 반드시 존재해야 하는 state·action key 집합입니다.", ["runtime test로 지킵니다.", "migration에도 적용합니다."])],
    codeExamples: [node("react24-merge-replace", "shallow merge와 destructive replace", "React24MergeReplace.mjs", "root merge·nested replacement·action 소실을 결정적으로 보여 줍니다.", String.raw`const action = () => "ok";
const initial = { count: 1, profile: { label: "A", mode: "light" }, increment: action };
const merge = (state, patch) => ({ ...state, ...patch });
const merged = merge(initial, { count: 2 });
const nestedWrong = merge(initial, { profile: { mode: "dark" } });
const replaced = { count: 0 };
console.log("merged-keys=" + Object.keys(merged).sort().join(",") + "|action=" + merged.increment());
console.log("nested-label=" + String(nestedWrong.profile.label) + "|mode=" + nestedWrong.profile.mode);
console.log("replace-has-action=" + (typeof replaced.increment === "function"));`, "merged-keys=count,increment,profile|action=ok\nnested-label=undefined|mode=dark\nreplace-has-action=false", ["zustand-create-api", "zustand-merge-guide", "zustand-repository"])],
  }),
  appliedTopic({
    id: "functional-update-get", title: "functional set과 get으로 transition을 원자적으로 계산합니다",
    lead: "이전 state에 의존하는 update는 captured 값이 아니라 set callback의 current state에서 계산하고, action 조합은 get의 최신 API를 의도적으로 사용합니다.",
    mechanism: "set(state => partial)은 action 실행 시점의 state를 입력으로 받습니다. get은 같은 store의 최신 state와 actions를 읽어 cross-action orchestration을 가능하게 하지만 여러 set 호출은 여러 notification을 만들 수 있습니다.",
    workflow: "command 입력을 검증하고 하나의 transition 함수에서 next를 계산한 뒤 set을 한 번 호출합니다. 여러 action을 조합할 때 중간 state가 관찰되어도 되는지 먼저 결정합니다.",
    invariants: "동일 command와 동일 before state는 동일 next state를 만들고 rapid sequential commands가 서로의 update를 덮어쓰지 않으며 failed validation은 state를 바꾸지 않습니다.",
    edgeCases: "double click, batched React events, external synchronous subscription, reentrant listener, action 내부 get 후 await가 있는 경우를 포함합니다.",
    failureModes: "render에서 읽은 count를 closure로 잡아 set({count: count+1})를 반복하면 lost update가 생기고 두 actions를 순서 호출하면 consumer가 invalid intermediate state를 볼 수 있습니다.",
    verification: "100회 sequential update, duplicate command, rejected input, intermediate notification count와 final invariant를 deterministic test로 확인합니다.",
    operations: "action name, before/after version과 notification count를 privacy-safe trace로 남기고 fan-out 급증을 alert합니다.",
    concepts: [c("functional updater", "current state를 인자로 받아 partial next state를 계산하는 set 형태입니다.", ["이전 값 의존 update에 씁니다.", "closure stale을 줄입니다."]), c("action composition", "get으로 최신 action/state를 읽어 여러 domain transition을 조정하는 방식입니다.", ["중간 notification을 고려합니다.", "cycle을 금지합니다."]), c("transition atomicity", "observer가 business invariant를 깨는 중간 상태를 보지 않게 한 번의 commit으로 변경하는 성질입니다.", ["한 set을 선호합니다.", "server transaction과는 다릅니다."])],
    codeExamples: [node("react24-functional-actions", "functional action과 단일 commit", "React24FunctionalActions.mjs", "rapid updates와 compound action을 pure transition으로 검증합니다.", String.raw`let state = { count: 0, pending: 2, completed: 0 };
const set = (recipe) => { state = { ...state, ...recipe(state) }; };
for (let index = 0; index < 3; index += 1) set((current) => ({ count: current.count + 1 }));
set((current) => ({ pending: 0, completed: current.completed + current.pending }));
const invariant = state.pending >= 0 && state.completed === 2;
console.log("count=" + state.count);
console.log("pending=" + state.pending + "|completed=" + state.completed);
console.log("invariant=" + invariant);`, "count=3\npending=0|completed=2\ninvariant=true", ["zustand-create-api", "zustand-update-guide", "react-choosing-state"])],
  }),
  appliedTopic({
    id: "immutable-array-entities", title: "todo·memo 배열을 immutable entity transition으로 바꿉니다",
    lead: "원본 add/filter/map/spread 패턴을 보존하되 Date.now 식별자와 전체 배열 탐색의 한계를 드러내고 stable ID·normalization·no-op identity를 설계합니다.",
    mechanism: "추가는 새 배열, 삭제는 filter, toggle/update는 map과 대상 object copy로 변경된 경로만 새 reference를 만듭니다. 대상이 없으면 기존 reference를 반환해 selector와 persistence의 불필요한 일을 막습니다.",
    workflow: "command schema와 stable unique ID provider를 주입하고 entity 존재·revision을 확인한 뒤 changed path만 copy하며 derived count는 저장하지 않고 selector에서 계산합니다.",
    invariants: "ID는 충돌하지 않고 input object를 mutate하지 않으며 한 entity update가 다른 entity reference를 보존하고 missing ID는 명시적 no-op 또는 typed failure가 됩니다.",
    edgeCases: "빈 제목, duplicate ID, same-value update, stale edit, large list, reordered list, locale-dependent timestamp와 concurrent server echo를 포함합니다.",
    failureModes: "push나 직접 property assignment는 reference equality 기반 notification을 놓치게 하고 Date.now만 ID로 쓰면 같은 millisecond action이 collision할 수 있습니다.",
    verification: "deep-freeze input, before/after reference matrix, duplicate/missing/stale cases, 10k entities cost와 selector notification을 시험합니다.",
    operations: "command failure code, entity count, transition duration과 collision counter를 수집하고 raw title/content는 telemetry에 남기지 않습니다.",
    concepts: [c("structural sharing", "변경된 경로만 새 reference로 만들고 나머지를 재사용하는 immutable update 전략입니다.", ["selector 최적화에 중요합니다.", "mutation과 구분합니다."]), c("stable identifier", "시간·순서 충돌 없이 entity 수명 동안 유지되는 식별자입니다.", ["주입해 test합니다.", "server ID와 mapping합니다."]), c("no-op identity", "실제 변화가 없을 때 기존 state/reference를 그대로 반환하는 계약입니다.", ["불필요한 notification을 줄입니다.", "성공과 not-found를 구분합니다."])],
    codeExamples: [node("react24-immutable-todos", "immutable entity transition", "React24ImmutableTodos.mjs", "추가·toggle·missing no-op의 reference 불변식을 검증합니다.", String.raw`const initial = [{ id: "T-001", done: false }, { id: "T-002", done: false }];
const toggle = (items, id) => items.some((item) => item.id === id)
  ? items.map((item) => item.id === id ? { ...item, done: !item.done } : item)
  : items;
const next = toggle(initial, "T-002");
const missing = toggle(next, "T-999");
console.log("array-changed=" + (next !== initial) + "|first-shared=" + (next[0] === initial[0]));
console.log("second-done=" + next[1].done + "|second-changed=" + (next[1] !== initial[1]));
console.log("missing-noop=" + (missing === next));`, "array-changed=true|first-shared=true\nsecond-done=true|second-changed=true\nmissing-noop=true", ["local-react24-todo", "local-react24-memo", "local-react24-integration-todo", "zustand-update-guide", "zustand-merge-guide", "react-updating-arrays", "react-choosing-state"])],
  }),
  appliedTopic({
    id: "nested-map-set", title: "nested object·Map·Set을 reference-safe하게 갱신합니다",
    lead: "root shallow merge가 deep merge가 아니라는 사실을 nested preference와 normalized Map/Set 사례에서 반복 검증합니다.",
    mechanism: "nested object는 각 변경 경로를 spread하고 Map/Set은 new Map(old)·new Set(old)로 복사한 뒤 수정합니다. same-value command는 original collection을 반환합니다.",
    workflow: "state graph에서 mutation path와 subscriber selector path를 표시하고 최소 copy set을 계산하며 non-serializable collection을 persist할 때 explicit codec을 둡니다.",
    invariants: "변경된 collection reference는 새롭고 untouched sibling은 공유되며 Map key와 Set membership type이 schema와 일치합니다.",
    edgeCases: "NaN key, object key identity, Set duplicate add, nested undefined, JSON serialization, hydration reviver와 large collection을 포함합니다.",
    failureModes: "기존 Map에 set한 뒤 같은 reference를 반환하면 selector가 변화를 놓치고 JSON.stringify는 Map/Set 내용을 그대로 보존하지 않습니다.",
    verification: "reference assertions, membership/value assertions, duplicate no-op, serialize/deserialize round trip과 selector equality를 시험합니다.",
    operations: "collection cardinality와 codec version을 관찰하고 hydration decode failure를 clear가 아닌 recoverable quarantine로 처리합니다.",
    concepts: [c("nested copy", "root부터 변경 leaf까지 각 object/collection을 새 reference로 만드는 update입니다.", ["sibling은 공유합니다.", "deep clone은 피합니다."]), c("collection identity", "Map·Set의 내용 변화가 selector에 보이도록 outer reference를 교체하는 계약입니다.", ["new Map/Set을 씁니다.", "no-op은 재사용합니다."]), c("serialization codec", "JSON이 직접 표현하지 못하는 type을 versioned plain data로 변환하고 복원하는 규칙입니다.", ["round trip을 시험합니다.", "untrusted input을 검증합니다."])],
    codeExamples: [node("react24-map-set-copy", "Map·Set immutable copy", "React24MapSetCopy.mjs", "collection reference와 untouched sibling sharing을 검증합니다.", String.raw`const initial = { scores: new Map([["A", 1]]), tags: new Set(["core"]), meta: { version: 1 } };
const scores = new Map(initial.scores);
scores.set("A", 2);
const tags = initial.tags.has("core") ? initial.tags : new Set([...initial.tags, "core"]);
const next = { ...initial, scores, tags };
console.log("scores-changed=" + (next.scores !== initial.scores) + "|value=" + next.scores.get("A"));
console.log("tags-noop=" + (next.tags === initial.tags) + "|size=" + next.tags.size);
console.log("meta-shared=" + (next.meta === initial.meta));`, "scores-changed=true|value=2\ntags-noop=true|size=1\nmeta-shared=true", ["zustand-map-set-guide", "zustand-update-guide", "react-updating-objects"])],
  }),
  appliedTopic({
    id: "derived-state-actions", title: "저장 state와 파생 selector·command를 분리합니다",
    lead: "remaining count나 isEmpty처럼 state에서 계산 가능한 값은 별도 writable field로 복제하지 않고 selector 또는 action 내부 계산으로 둡니다.",
    mechanism: "authoritative entities와 filter criteria만 저장하고 count·filtered list·status label은 selector가 current snapshot에서 계산합니다. action은 UI event가 아니라 domain command 이름과 검증을 소유합니다.",
    workflow: "각 field를 source·derived·ephemeral·server-authoritative로 분류하고 두 source에서 같은 값을 갱신해야 하는 field를 제거하거나 하나의 atomic transition으로 묶습니다.",
    invariants: "파생 값은 항상 source state와 일치하고 action 입력은 component마다 중복 검증되지 않으며 selector는 mutation이나 I/O 없는 pure function입니다.",
    edgeCases: "expensive sort/filter, locale formatting, unstable array output, user preference, optimistic server state와 memo cache invalidation을 포함합니다.",
    failureModes: "todos와 remaining을 따로 set하면 한 action 누락으로 모순이 생기고 selector가 매번 새 object를 반환하면 관련 없는 update에도 render가 늘어납니다.",
    verification: "property-based invariant, selector purity, same snapshot repeat identity 전략과 action validation matrix를 시험합니다.",
    operations: "invariant violation과 selector compute cost를 관찰하며 파생 field 제거 migration을 reversible release로 수행합니다.",
    concepts: [c("authoritative state", "한 사실의 쓰기를 소유하는 유일한 state입니다.", ["복제를 피합니다.", "server owner를 명시합니다."]), c("derived selector", "current snapshot에서 저장하지 않은 값을 pure하게 계산하는 함수입니다.", ["동기화 bug를 줄입니다.", "출력 identity를 고려합니다."]), c("domain action", "UI gesture가 아니라 business transition과 validation을 표현하는 store command입니다.", ["여러 UI가 재사용합니다.", "effect boundary를 명시합니다."])],
  }),
  appliedTopic({
    id: "async-action-race", title: "async action의 request identity와 stale commit을 통제합니다",
    lead: "Zustand는 async action을 허용하지만 fetch 성공 순서, cancel, logout과 server authorization을 자동 해결하지 않으므로 generation contract를 직접 설계합니다.",
    mechanism: "요청 시작 시 requestId·authEpoch를 capture하고 pending state를 commit한 뒤 결과 시 current generation과 일치할 때만 success를 반영합니다. AbortController는 자원 절약이고 epoch check는 correctness gate입니다.",
    workflow: "validate→start generation→request→parse/schema validate→generation compare→commit/error classify 순서로 action을 구성하고 network client를 주입합니다.",
    invariants: "늦게 도착한 이전 요청과 logout 전 결과는 current state를 덮지 않고 pending/error는 같은 request identity에 귀속되며 server response는 runtime schema를 통과합니다.",
    edgeCases: "out-of-order success, abort 후 response, double submit, retry, offline, 401 refresh, account switch와 unmount를 포함합니다.",
    failureModes: "마지막으로 끝난 요청을 무조건 commit하면 오래된 결과가 최신 입력을 덮고 boolean loading 하나는 여러 concurrent request를 표현하지 못합니다.",
    verification: "deferred promises로 두 요청 순서를 뒤집고 abort/logout/account switch, malformed payload와 retry backoff를 deterministic clock에서 시험합니다.",
    operations: "request outcome·latency·stale-drop count·epoch mismatch만 기록하고 payload·token·개인정보는 log에서 배제합니다.",
    concepts: [c("request generation", "비동기 결과가 어느 최신 요청에 속하는지 판별하는 단조 증가 식별자입니다.", ["start 때 capture합니다.", "commit 전에 비교합니다."]), c("stale commit", "이전 요청 결과가 더 최신 state를 덮는 race입니다.", ["generation으로 차단합니다.", "cancel만 믿지 않습니다."]), c("effect injection", "network·clock·ID provider를 action 외부에서 주입해 transition을 결정적으로 test하는 방식입니다.", ["fake로 실패를 재현합니다.", "실제 endpoint를 공개하지 않습니다."])],
    codeExamples: [node("react24-async-generation", "비동기 stale result gate", "React24AsyncGeneration.mjs", "out-of-order completion에서 최신 generation만 commit합니다.", String.raw`let state = { generation: 0, value: "none", staleDrops: 0 };
const start = () => ++state.generation;
const commit = (generation, value) => {
  if (generation !== state.generation) { state.staleDrops += 1; return false; }
  state.value = value; return true;
};
const first = start();
const second = start();
const secondAccepted = commit(second, "new");
const firstAccepted = commit(first, "old");
console.log("second=" + secondAccepted + "|first=" + firstAccepted);
console.log("value=" + state.value);
console.log("stale-drops=" + state.staleDrops);`, "second=true|first=false\nvalue=new\nstale-drops=1", ["zustand-create-api", "zustand-repository", "react-choosing-state"])],
  }),
  appliedTopic({
    id: "vanilla-subscribe-lifecycle", title: "getState·setState·subscribe의 수명을 관리합니다",
    lead: "React component 밖의 adapter, telemetry, storage bridge에서 store API를 사용할 때 synchronous notification과 unsubscribe ownership을 명시합니다.",
    mechanism: "subscribe는 state change를 관찰하고 unsubscribe 함수를 반환합니다. imperative getState는 현재 snapshot을 주지만 future updates를 알려주지 않으며 external setState도 listeners를 깨웁니다.",
    workflow: "integration mount가 subscribe를 소유하고 cleanup에서 정확히 한 번 unsubscribe하며 listener 내부 side effect는 queue·dedupe·reentrancy policy를 갖습니다.",
    invariants: "mount/unmount 뒤 listener count가 baseline으로 돌아가고 한 committed transition은 정의된 listener 횟수만 만들며 listener가 민감한 state를 raw log하지 않습니다.",
    edgeCases: "StrictMode setup-cleanup 재실행, duplicate mount, listener가 set을 호출하는 reentrancy, exception, HMR와 test reuse를 포함합니다.",
    failureModes: "unsubscribe를 버리면 memory leak와 duplicate side effect가 쌓이고 listener에서 무조건 set하면 synchronous recursion이 발생합니다.",
    verification: "listener count, order, cleanup idempotence, reentrant guard, exception isolation과 StrictMode-like mount cycle을 시험합니다.",
    operations: "active listener·notification fan-out·long handler를 관찰하고 circuit breaker와 integration disable flag를 둡니다.",
    concepts: [c("subscription ownership", "누가 listener를 등록하고 언제 해제할지 정한 lifecycle 계약입니다.", ["unsubscribe를 보존합니다.", "StrictMode를 시험합니다."]), c("synchronous notification", "store commit 직후 같은 call flow에서 listener가 호출될 수 있는 성질입니다.", ["reentrancy를 고려합니다.", "long work를 분리합니다."]), c("imperative adapter", "React render 밖에서 store API와 외부 시스템을 연결하는 명시적 boundary입니다.", ["cleanup이 필수입니다.", "payload를 최소화합니다."])],
    codeExamples: [node("react24-subscription-cleanup", "subscription lifecycle", "React24SubscriptionCleanup.mjs", "listener notification과 cleanup 후 무통지를 검증합니다.", String.raw`let state = 0;
const listeners = new Set();
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const set = (next) => { state = next; for (const listener of [...listeners]) listener(state); };
const seen = [];
const unsubscribe = subscribe((value) => seen.push(value));
set(1); unsubscribe(); set(2); unsubscribe();
console.log("seen=" + seen.join(","));
console.log("listeners=" + listeners.size);
console.log("state=" + state);`, "seen=1\nlisteners=0\nstate=2", ["zustand-create-api", "zustand-testing-guide", "local-react24-integration-todo"])],
  }),
  appliedTopic({
    id: "testing-reset-isolation", title: "store contract를 reset·isolation test로 고정합니다",
    lead: "component screenshot보다 state transition, reference, notification과 cleanup을 작은 store contract suite에서 먼저 검증합니다.",
    mechanism: "getInitialState 또는 factory의 initial value를 기준으로 each test마다 store instance를 만들거나 safe reset하고 React integration은 사용자 행동과 selector 결과를 확인합니다.",
    workflow: "pure transition tests→vanilla store API tests→React hook/component tests→browser integration 순으로 넓히고 fake clock·ID·network를 주입합니다.",
    invariants: "tests는 순서 독립이고 shared singleton residue가 없으며 failure path가 partial state를 남기지 않고 test reset이 action shape를 보존합니다.",
    edgeCases: "parallel test workers, StrictMode, fake timers, rejected promise, HMR, persisted state와 middleware order를 포함합니다.",
    failureModes: "module singleton을 suite 전체에서 공유하면 앞 test가 다음 test를 통과/실패시키고 set({}, true) reset은 actions를 지울 수 있습니다.",
    verification: "randomized order, repeated run, listener leak, freeze mutation, reset shape와 integration behavior를 CI에서 확인합니다.",
    operations: "flaky seed, worker, store instance ID와 listener delta를 남기고 quarantined test가 product gate를 우회하지 않게 합니다.",
    concepts: [c("contract suite", "구현 내부보다 action 입력·state 결과·notification 불변식을 고정하는 tests입니다.", ["refactor 내성이 있습니다.", "integration을 보완합니다."]), c("test isolation", "각 test가 독립 store·clock·effects를 가져 순서에 영향받지 않는 조건입니다.", ["factory를 선호합니다.", "global reset을 검증합니다."]), c("safe reset", "초기 state와 action shape를 모두 보존하며 listener 정책까지 명확한 초기화입니다.", ["replace 위험을 점검합니다.", "persist와 구분합니다."])],
  }),
  appliedTopic({
    id: "typescript-middleware-boundary", title: "TypeScript와 middleware 순서를 공개 API로 설계합니다",
    lead: "state interface, action input/result와 middleware가 확장하는 store API를 명시해 추론이 우연히 맞는 코드에서 review 가능한 계약으로 이동합니다.",
    mechanism: "StateCreator generic과 middleware mutator는 set/get/store type을 바꿀 수 있습니다. persist·devtools·subscribeWithSelector를 조합할 때 combined boundary에서 한 번 적용하고 exported selector/action types를 좁힙니다.",
    workflow: "domain state/action types를 먼저 정의하고 middleware를 outer composition에 배치하며 inferred public hook과 vanilla API를 type tests로 고정합니다.",
    invariants: "action input과 failure result가 any가 아니고 persisted shape는 runtime schema와 맞으며 slice가 middleware를 중복 적용하지 않습니다.",
    edgeCases: "middleware order, curried create type, partialize narrowed type, JavaScript 원본에서 TypeScript migration과 package minor typing change를 포함합니다.",
    failureModes: "as any로 mutator mismatch를 덮으면 runtime persist/subscribe API가 예상 shape와 달라지고 slice마다 middleware를 적용하면 예상하지 못한 wrapping이 생깁니다.",
    verification: "tsc noEmit, negative type fixtures, runtime store shape, middleware order integration과 installed version matrix를 시험합니다.",
    operations: "type dependency upgrade를 source change처럼 review하고 lockfile·generated declaration·bundle을 같은 release evidence에 묶습니다.",
    concepts: [c("public store type", "components와 adapters가 의존해도 되는 selector·action·API의 좁은 type surface입니다.", ["implementation field를 숨깁니다.", "negative type test를 둡니다."]), c("middleware mutator", "store creator 또는 API의 type과 runtime behavior를 확장하는 wrapper입니다.", ["순서가 의미를 가집니다.", "combined store에 적용합니다."]), c("runtime schema", "TypeScript가 확인하지 못하는 storage/network input을 실행 시점에 검증하는 규칙입니다.", ["unknown에서 시작합니다.", "version과 연결합니다."])],
  }),
  appliedTopic({
    id: "migration-observability-release", title: "작은 migration과 운영 evidence로 store를 배포합니다",
    lead: "원본 whole-store hooks를 한 번에 재작성하지 않고 action contract, immutable update, selector boundary를 단계적으로 적용해 rollback 가능한 release를 만듭니다.",
    mechanism: "행동 parity tests를 먼저 고정하고 ID provider·no-op identity·typed result를 도입한 뒤 component consumers를 새 action으로 이동하며 old adapter를 기간 제한으로 유지합니다.",
    workflow: "inventory→contract tests→new store adapter→dual-read comparison→consumer cutover→old path removal 순서로 각 단계에 exit criteria와 rollback commit을 둡니다.",
    invariants: "migration 중 user-visible behavior와 stored data가 보존되고 한 command가 old/new path에 이중 side effect를 만들지 않으며 metrics는 content-free입니다.",
    edgeCases: "mixed deploy, old tab, HMR, persisted old schema, in-flight action, rollback과 package patch upgrade를 포함합니다.",
    failureModes: "dual write를 idempotency 없이 켜면 중복 entity가 생기고 error rate만 보면서 render·listener·data invariant를 놓치면 조용한 regression이 남습니다.",
    verification: "golden transition matrix, old/new snapshot diff, canary cohort, rollback rehearsal, source hash와 all examples exact stdout을 release gate로 실행합니다.",
    operations: "action outcome, stale/no-op, listener count, transition latency와 invariant failure를 version에 연결하고 threshold 초과 시 feature flag를 되돌립니다.",
    concepts: [c("behavior parity", "구현 교체 전후 동일 입력이 같은 사용자 관찰 결과를 만드는 조건입니다.", ["내부 shape는 달라도 됩니다.", "failure도 비교합니다."]), c("dual-read", "같은 command 뒤 old/new 계산 결과를 side effect 없이 비교하는 migration 관찰 방식입니다.", ["차이를 기록합니다.", "민감 값은 hash/shape로 비교합니다."]), c("release qualification", "correctness·security·performance·rollback evidence를 모두 통과해야 배포하는 gate입니다.", ["버전과 묶습니다.", "canary를 사용합니다."])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-react24-package", repository: "local learning source", path: "my-app02/package.json", usedFor: ["React/Zustand declared ranges", "source version boundary"], evidence: "2026-07-14 read-only audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. React ^19.2.6, Zustand ^5.0.13 구조만 사용했습니다." },
  { id: "local-react24-lock", repository: "local learning source", path: "my-app02/package-lock.json", usedFor: ["exact installed Zustand version", "reproducible dependency evidence"], evidence: "2026-07-14 read-only audit: 17,419 lines, 674,984 bytes, SHA-256 E7D13FE49A9DD89B4F3528668666B5637145990D7570369FDDF6DF6C1D63C400. lockfileVersion 3과 installed Zustand 5.0.13만 구조적으로 기록했습니다." },
  { id: "local-react24-todo", repository: "local learning source", path: "my-app02/src/store/useTodoStore.jsx", usedFor: ["create/persist/set store shape", "array add/filter/map transitions"], evidence: "2026-07-14 read-only sanitized audit: 34 lines, 1,104 bytes, SHA-256 AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9. 실제 storage name과 UI values는 복사하지 않았습니다." },
  { id: "local-react24-memo", repository: "local learning source", path: "my-app02/src/store/useMemoStroe.jsx", usedFor: ["memo add/remove/update transitions", "Date.now/locale caveats"], evidence: "2026-07-14 read-only sanitized audit: 36 lines, 1,363 bytes, SHA-256 3CE0CDFAEEC21A71EB551FFC14D0206BB1BEE9941FA09FC45F085EF815462078. filename의 원본 철자는 provenance로만 유지하고 실제 content는 복사하지 않았습니다." },
  { id: "local-react24-doc", repository: "local learning source", path: "REACT/docs/react/10-zustand-basics.md", usedFor: ["learning progression", "store/action/persist claims audit"], evidence: "2026-07-14 read-only sanitized audit: 134 lines, 6,356 bytes, SHA-256 36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D. embedded paths, visible values와 live references는 공개 예제로 복사하지 않았습니다." },
  { id: "local-react24-archive", repository: "local learning source", path: "REACT/docs/archive/notion-raw/react-zustand-1.md", usedFor: ["historical lesson structure", "current-contract drift audit"], evidence: "2026-07-14 read-only sanitized audit: 58 lines, 3,215 bytes, SHA-256 A8237B9635D36C35B116302A9BFB69A8E2AB15D2623B0A1DE475509D167FEFE1. raw text는 인용하지 않고 구조만 사용했습니다." },
  { id: "local-react24-integration-todo", repository: "local learning source", path: "REACT/code/react/03-integration-my-app03/src/store/useTodoStore.jsx", usedFor: ["archive integration store comparison", "unchanged immutable transition evidence"], evidence: "2026-07-14 read-only sanitized audit: 34 lines, 1,104 bytes, SHA-256 AE45BA721FC62EC55C72A3DEB00FFFA9E5077ED07839D7F996DC5F81EE8AE5E9. duplicate snapshot임을 digest로 확인했고 values는 복사하지 않았습니다." },
  { id: "zustand-npm", repository: "npm official registry", path: "zustand/latest", publicUrl: "https://registry.npmjs.org/zustand/latest", usedFor: ["current released version on 2026-07-14", "version drift gate"], evidence: "2026-07-14 npm 공식 registry metadata에서 current 5.0.14를 확인했습니다. local lock 5.0.13과 구분합니다." },
  { id: "zustand-repository", repository: "pmndrs/zustand official repository", path: "README.md", publicUrl: "https://github.com/pmndrs/zustand", usedFor: ["whole-store caveat", "set merge/replace", "attached store API"], evidence: "Zustand 공식 repository README의 create, selectors, overwrite, getState/setState/subscribe와 middleware examples입니다." },
  { id: "zustand-create-api", repository: "Zustand official documentation", path: "reference/apis/create", publicUrl: "https://zustand.docs.pmnd.rs/reference/apis/create", usedFor: ["state creator set/get/store arguments", "bound hook and attached API"], evidence: "Zustand 공식 create API 계약입니다." },
  { id: "zustand-update-guide", repository: "Zustand official documentation", path: "learn/guides/updating-state", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/updating-state", usedFor: ["flat and nested updates", "functional set"], evidence: "Zustand 공식 state update guide입니다." },
  { id: "zustand-merge-guide", repository: "Zustand official documentation", path: "learn/guides/immutable-state-and-merging", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/immutable-state-and-merging", usedFor: ["one-level merge", "replace flag and immutable nested copy"], evidence: "Zustand 공식 immutable state·merging guide입니다." },
  { id: "zustand-map-set-guide", repository: "Zustand official documentation", path: "learn/guides/maps-and-sets-usage", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/maps-and-sets-usage", usedFor: ["Map/Set new-reference updates", "collection typing caveats"], evidence: "Zustand 공식 Map·Set usage guide입니다." },
  { id: "zustand-testing-guide", repository: "Zustand official documentation", path: "learn/guides/testing", publicUrl: "https://zustand.docs.pmnd.rs/learn/guides/testing", usedFor: ["store reset", "test framework integration"], evidence: "Zustand 공식 testing guide입니다." },
  { id: "react-updating-arrays", repository: "React official documentation", path: "learn/updating-arrays-in-state", publicUrl: "https://react.dev/learn/updating-arrays-in-state", usedFor: ["immutable array transitions", "map/filter/spread"], evidence: "React 공식 array state update guide입니다." },
  { id: "react-updating-objects", repository: "React official documentation", path: "learn/updating-objects-in-state", publicUrl: "https://react.dev/learn/updating-objects-in-state", usedFor: ["nested object copy", "mutation avoidance"], evidence: "React 공식 object state update guide입니다." },
  { id: "react-choosing-state", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["derived-state elimination", "state normalization and contradictions"], evidence: "React 공식 state structure guide입니다." },
];

const session = createExpertSession({
  inventoryId: "react-24-zustand-store-actions", slug: "react-24-zustand-store-actions",
  courseId: "react", moduleId: "react-state-management", order: 4,
  title: "Zustand store·action과 immutable update", subtitle: "원본 todo·memo store를 versioned evidence로 감사하고 create/set/get, immutable entity transition, async race와 store lifecycle을 운영 가능한 계약으로 확장합니다.",
  level: "고급", estimatedMinutes: 120,
  coreQuestion: "Zustand의 간결한 create와 set을 상태 무결성·동시성·subscription 수명·upgrade까지 견디는 store/action 계약으로 어떻게 설계할까요?",
  summary: "my-app02의 package/lock, todo·memo stores와 REACT 기본 문서·archive·integration snapshot을 read-only·sanitized 감사했습니다. 로컬 installed Zustand 5.0.13과 2026-07-14 공식 current 5.0.14를 구분하고, create state creator, root shallow merge와 destructive replace, functional set/get, immutable array·nested Map/Set, derived state, async generation, subscription cleanup, test isolation, TypeScript middleware와 release migration을 공식 Zustand·React 근거와 일곱 deterministic Node models로 연결합니다. 원본 storage name, 실제 화면 값, 개인정보, credential과 endpoint는 포함하지 않습니다.",
  objectives: ["원본 store와 package evidence를 hash·version으로 재현한다.", "create의 hook과 attached store API 경계를 설명한다.", "set의 root shallow merge와 replace 위험을 검증한다.", "functional set/get으로 atomic domain transition을 만든다.", "array·nested object·Map·Set을 structural sharing으로 갱신한다.", "derived state와 actions의 ownership을 분리한다.", "async stale commit과 subscription leak를 차단한다.", "reset·isolation·middleware type tests를 구축한다.", "canary와 rollback evidence로 migration한다."],
  prerequisites: [{ title: "Context 성능·selector와 external store", reason: "React external store의 snapshot·subscription·render 경계를 이해해야 Zustand action과 API를 정확히 배치할 수 있습니다.", sessionSlug: "react-23-context-performance-selector" }],
  keywords: ["Zustand", "create", "set", "get", "immutable update", "structural sharing", "action", "subscribe", "async race", "Map", "Set", "migration"],
  topics,
  lab: {
    title: "원본 todo·memo store를 production action contract로 qualification하기",
    scenario: "원본 파일은 변경하지 않고 synthetic IDs와 내용 없는 fixtures로 동일 transition을 재현한 뒤 vanilla store와 React selector integration에서 correctness·notification·cleanup을 검증합니다.",
    setup: ["Node.js 20 이상", "React 19.2 compatible disposable fixture", "local Zustand 5.0.13와 current 5.0.14 version matrix", "fake ID·clock·network", "StrictMode test root", "원본 7 files read-only", "credential·PII·network endpoint 없음"],
    steps: ["manifest/lock/source line·byte·SHA-256과 sourceRefs를 재검증합니다.", "원본 state/action graph와 storage boundary를 structural inventory로 만듭니다.", "create hook, getState/setState/subscribe의 reactive/non-reactive 경계를 fixture에서 확인합니다.", "merge/replace와 missing-action negative test를 실행합니다.", "todo·memo add/remove/toggle/update를 stable ID, validation, no-op identity로 재구현합니다.", "nested object·Map·Set reference matrix와 serialization round trip을 검증합니다.", "rapid functional updates와 compound action의 notification count를 측정합니다.", "out-of-order async results, abort와 generation mismatch를 재현합니다.", "StrictMode-like mount/unmount와 parallel tests에서 listener/reset isolation을 확인합니다.", "installed/current versions에서 type, component, browser, performance gates와 rollback rehearsal를 통과시킵니다."],
    expectedResult: ["모든 transition이 input mutation 없이 shape·entity invariants를 지킵니다.", "관련 없는 entity/sibling은 reference를 공유하고 missing/same-value command는 정의된 no-op을 만듭니다.", "늦은 async 결과는 current generation을 덮지 않고 listener는 cleanup 뒤 baseline으로 돌아갑니다.", "local 5.0.13 observation과 current 5.0.14 contract 차이가 evidence에 남습니다.", "공개 artifacts에 storage value·credential·PII·실제 endpoint가 없습니다."],
    cleanup: ["temporary stores, listeners, roots, timers, deferred promises와 traces를 제거합니다.", "synthetic storage, IDs, caches와 generated fixtures를 폐기합니다.", "feature flags와 verbose instrumentation을 원복합니다.", "원본 7 files의 digest와 working-tree unchanged 상태를 확인합니다."],
    extensions: ["normalized entity Map과 ordered ID list를 100k workload에서 비교합니다.", "property-based command sequence로 invariants를 검증합니다.", "devtools·persist·subscribeWithSelector middleware order type matrix를 추가합니다.", "다음 세션의 atomic selector/slice render budget suite와 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node models를 실행하고 각 결과를 실제 Zustand 5.0.13/5.0.14 fixture의 store transition과 대조하세요.", requirements: ["stdout 완전 일치", "version evidence", "merge/replace keys", "reference matrix", "async stale drop", "listener cleanup", "sourceRefs 전수 확인", "model 범위 기록"], hints: ["Node object model을 Zustand middleware나 React scheduler 구현이라고 표현하지 마세요."], expectedOutcome: "짧은 set 호출 뒤의 state shape·reference·notification을 단계별로 설명합니다.", solutionOutline: ["audit→create API→transition→identity→race→cleanup→version matrix 순서입니다."] },
    { difficulty: "응용", prompt: "원본 todo·memo stores를 stable ID와 typed action result를 가진 production-safe store로 재설계하세요.", requirements: ["immutable no-op identity", "nested copies", "derived selectors", "validation", "generation guard", "injected effects", "reset/isolation", "behavior parity"], hints: ["UI event handler와 domain command를 같은 함수로 취급하지 마세요."], expectedOutcome: "rapid·missing·stale·failure cases에도 data와 action shape가 일관된 store가 완성됩니다.", solutionOutline: ["classify state→define commands→implement pure transitions→wrap effects→integrate selectors→qualify 순서입니다."] },
    { difficulty: "설계", prompt: "팀의 Zustand store/action 설계와 upgrade 운영 표준을 작성하세요.", requirements: ["version provenance", "ownership", "merge/replace policy", "immutability", "async race", "subscription lifecycle", "testing", "privacy", "canary/rollback"], hints: ["library 사용법 목록이 아니라 enforcement와 evidence owner를 명시하세요."], expectedOutcome: "설계·리뷰·CI·운영에서 같은 store invariants를 검증하는 표준이 됩니다.", solutionOutline: ["inventory→contract→enforce→observe→migrate→recover 순서입니다."] },
  ],
  nextSessions: ["react-25-zustand-selector-slices"], sources,
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["my-app02 package/lock과 todo·memo stores, REACT 기본 문서, notion archive, integration todo snapshot을 read-only로 감사했습니다.", "REACT archive integration todo는 my-app02 todo store와 동일 SHA-256이며 duplicate provenance로 기록했습니다.", "원본 Date.now ID와 locale date는 source observation이고 uniqueness·determinism을 보장한다고 과장하지 않습니다.", "원본 persist 설정의 storage name과 실제 UI/content values는 공개 자료에 복사하지 않았습니다.", "Node models는 actual Zustand middleware, React scheduler/DOM, browser storage, network와 server authorization을 대체하지 않아 lab integration을 별도로 요구합니다.", "Zustand 5.0.13 local lock과 5.0.14 current official version 차이는 2026-07-14 시점 evidence이며 upgrade 뒤 다시 확인해야 합니다."] },
});

export default session;
