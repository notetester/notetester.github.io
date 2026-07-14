import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefs = [
  "local-http", "local-auth-api", "local-auth-store", "local-login",
  "local-members-controller", "local-members-service", "local-refresh-model", "local-jwt-filter",
];

const officialRefs = [
  "react-external-store", "axios-interceptors", "fetch-standard", "html-webstorage",
  "html-broadcast-channel", "rfc7009", "rfc7662", "rfc9700", "rfc7519",
  "rfc8725", "rfc6750", "rfc6265", "rfc9110", "rfc9457",
  "oidc-rp-logout", "oidc-backchannel-logout", "owasp-session", "owasp-html5",
  "owasp-authentication", "owasp-logging", "owasp-rest",
];

const topics = [
  appliedTopic({
    id: "logout-source-callgraph-audit", title: "local clear·server endpoint·refresh record를 sanitized logout call graph로 감사합니다",
    lead: "logout 함수와 버튼이 각각 존재한다는 사실을 end-to-end revocation으로 착각하지 않고 UI event에서 server record 삭제와 모든 verifier 반영까지 실제로 연결되는지 source call graph와 runtime evidence를 분리합니다.",
    mechanism: "React snapshot은 API module에 server logout wrapper가 있고 auth store action은 browser storage와 display state를 지웁니다. 로그인 화면의 observed logout button은 store action을 직접 호출하므로 이 경로에서 server wrapper 호출은 증명되지 않습니다. backend logout handler는 authenticated principal로 refresh record를 삭제하며 refresh flow도 lookup·validate·delete-then-save합니다. 단일 record shape는 보이지만 device/family/reuse metadata, hash-at-rest, all-device epoch와 access-token immediate invalidation이 이미 구현됐다고 주장할 수 없습니다.",
    workflow: "UI event→client state/credential→network request→authentication filter→controller→service/data record→access verifier/cache→other tab/device/provider까지 graph를 그려 observed edge, missing edge와 proposed edge를 각각 표시합니다.",
    invariants: "실제 route, storage key, identity/member/provider/domain, credential/secret/log value를 복사하지 않고 server wrapper 존재를 runtime invocation으로 계산하지 않으며 source files는 read-only로 유지합니다.",
    edgeCases: "already logged out, expired access credential, refresh in flight, offline click, duplicate tabs, other device, account disable, external identity-provider session과 partial server failure를 inventory합니다.",
    failureModes: "localStorage 삭제와 boolean false만으로 완료를 표시하면 stolen/other-device credential이 계속 유효할 수 있고, server row 하나 삭제만으로 signed access token까지 즉시 무효가 된다고 가정하면 revoke latency를 숨깁니다.",
    verification: "exact hashes, static call graph, browser network observation, server revoke write/readback, protected-resource negative request, tab/device convergence와 raw secret sink scan을 실행합니다.",
    operations: "logout intent, scope, server decision, revoke propagation duration, client convergence와 safe reason만 관찰하고 token/session ID/user/device raw values는 기록하지 않습니다.",
    concepts: [
      c("logout call graph", "사용자 action이 local cleanup, server revoke와 모든 verifier/client convergence까지 이어지는 실행 경로입니다.", ["함수 존재와 호출을 구분합니다.", "missing edge를 찾습니다."]),
      c("local clear", "현재 browser context에서 UI state와 client-held credential reference를 제거하는 단계입니다.", ["server revoke가 아닙니다.", "즉시 수행할 수 있습니다."]),
      c("revocation evidence", "server-side credential/session 상태 변경과 이후 protected use 거부를 readback한 증거입니다.", ["쓰기 성공만으로 부족합니다.", "전파 지연을 측정합니다."]),
    ],
    codeExamples: [node("security13-source-audit", "redacted logout/revocation capability audit", "Security13SourceAudit.mjs", "local clear, wrapper, server deletion과 확인되지 않은 연결을 값 없이 표시합니다.", String.raw`const observed = {
  clientServerLogoutWrapperExists: true,
  uiLogoutDirectlyClearsLocalStore: true,
  uiPathServerCallProven: false,
  serverDeletesRefreshRecord: true,
  accessRevocationCheckProven: false,
  multiTabConvergenceProven: false,
  allDeviceEpochProven: false,
  rawCredentialLoggingRisk: true,
};
for (const key of Object.keys(observed).sort()) console.log(key + "=" + observed[key]);
console.log("actual-values-copied=false");`, "accessRevocationCheckProven=false\nallDeviceEpochProven=false\nclientServerLogoutWrapperExists=true\nmultiTabConvergenceProven=false\nrawCredentialLoggingRisk=true\nserverDeletesRefreshRecord=true\nuiLogoutDirectlyClearsLocalStore=true\nuiPathServerCallProven=false\nactual-values-copied=false", localRefs.concat(["rfc7009", "owasp-session", "owasp-logging"]))],
  }),
  appliedTopic({
    id: "logout-semantic-state-machine", title: "logout을 idempotent local·server·provider state machine으로 정의합니다",
    lead: "logout 버튼 클릭을 navigation side effect로 끝내지 않고 intent가 한 번 선언된 뒤 local authority가 즉시 사라지고 server와 외부 session이 성공·이미 폐기·일시 실패 중 어느 결과로 끝났는지 명확히 표현합니다.",
    mechanism: "client states는 authenticated→logging-out→local-anonymous와 server-revoke-pending|confirmed를 직교하게 관리합니다. 같은 logout request는 여러 번 와도 안전한 idempotent outcome을 주며 server는 current session/family 또는 all-device scope를 인증된 action으로 폐기합니다. external provider logout은 application session과 별도 계약이며 RP-initiated/back-channel behavior와 사용자 기대를 문서화합니다.",
    workflow: "intent 수락→auth epoch 증가/새 protected work 차단→pending requests abort→server revoke best effort→local credentials/profile/cache clear→tab broadcast→server readback/terminal outcome→accessible confirmation 순서로 transition을 설계합니다.",
    invariants: "logout intent 뒤 late refresh/login response가 authenticated를 복원하지 않고 local sensitive access는 즉시 차단되며 duplicate request가 new credential을 만들거나 error detail을 노출하지 않습니다.",
    edgeCases: "anonymous request, expired/malformed credential, server timeout, already revoked, multiple clicks, back navigation, external provider iframe failure, account deletion과 browser crash를 포함합니다.",
    failureModes: "server 응답을 기다린 뒤 local clear하면 offline/slow server 동안 UI가 credential을 계속 사용하고, local clear를 먼저 하면서 server revoke 재시도 수단을 모두 잃으면 장기 credential이 남으며, provider logout을 자동 가정하면 single sign-out 기대가 어긋납니다.",
    verification: "pure state transition, duplicate/reordered response, abort/epoch race, server idempotency, provider contract, focus/live-status와 readback을 검사합니다.",
    operations: "scope, local completion, server/provider outcome, latency와 retry state를 기록하되 session/credential/provider subject는 기록하지 않습니다.",
    concepts: [
      c("logout intent", "사용자가 현재 또는 모든 session authority를 끝내겠다는 monotonic security event입니다.", ["취소로 되돌리지 않습니다.", "epoch를 증가시킵니다."]),
      c("idempotent revoke", "같은 대상의 폐기 요청을 반복해도 최종 폐기 상태와 안전한 response가 유지되는 성질입니다.", ["retry를 가능하게 합니다.", "존재 여부 노출을 제한합니다."]),
      c("split completion", "local anonymous 완료와 server/provider revocation 확인을 별도 상태로 추적하는 방식입니다.", ["offline truth를 표현합니다.", "UI가 과장하지 않습니다."]),
    ],
    codeExamples: [node("security13-logout-machine", "idempotent logout state machine", "Security13LogoutMachine.mjs", "server timeout 뒤 local anonymous를 유지하고 retry confirmation이 상태를 수렴시키는 model입니다.", String.raw`let state = { local: "authenticated", server: "active", epoch: 8 };
function reduce(event) {
  if (event.type === "INTENT") state = { local: "anonymous", server: "pending", epoch: state.epoch + 1 };
  if (event.type === "SERVER_TIMEOUT") state = { ...state, server: "pending" };
  if (event.type === "SERVER_CONFIRMED") state = { ...state, server: "revoked" };
  if (event.type === "LATE_REFRESH" && event.epoch !== state.epoch) return "ignored-stale";
  return state.local + "|" + state.server + "|" + state.epoch;
}
const oldEpoch = state.epoch;
console.log(reduce({ type: "INTENT" }));
console.log(reduce({ type: "SERVER_TIMEOUT" }));
console.log(reduce({ type: "LATE_REFRESH", epoch: oldEpoch }));
console.log(reduce({ type: "SERVER_CONFIRMED" }));`, "anonymous|pending|9\nanonymous|pending|9\nignored-stale\nanonymous|revoked|9", ["local-auth-api", "local-auth-store", "local-login", "rfc7009", "oidc-rp-logout"])],
  }),
  appliedTopic({
    id: "server-revocation-model", title: "session·family·user epoch와 access-token revoke latency를 server model로 설계합니다",
    lead: "refresh row 한 건 삭제를 모든 credential 폐기로 일반화하지 않고 현재 session, credential family, device와 user-wide epoch 각각의 scope·storage·lookup cost·전파 SLO를 결정합니다.",
    mechanism: "opaque refresh/session record는 random identifier의 digest, family/session ID, subject reference, issue/expiry/revoked/reason/replaced-by metadata를 갖고 transactional rotation/reuse detection과 연결됩니다. JWT access credential은 self-contained validation만 하면 삭제된 refresh record를 보지 않으므로 short lifetime, per-session/user epoch check, denylist/introspection 또는 sender constraint 중 threat에 맞는 strategy가 필요합니다. RFC 7009 revoke response와 RFC 7662 introspection semantics는 endpoint privacy와 active state readback의 기준이 됩니다.",
    workflow: "logout scope를 current session|family|all user sessions로 정규화하고 authorization→atomic revoke/epoch increment→cache/event propagation→introspection/protected request readback→audit를 수행합니다.",
    invariants: "raw refresh credential을 DB/log/index에 저장하지 않고 revoke decision은 authenticated subject와 server record 관계로 이루어지며 already revoked/not found response가 공격자 enumeration oracle이 되지 않습니다.",
    edgeCases: "rotation race, refresh reuse, access token without session ID, cache lag, clock skew, database partition, emergency user disable, device record merge와 key rotation을 포함합니다.",
    failureModes: "access JWT expiry가 길면서 refresh row만 삭제하면 stolen access는 계속 사용되고, every request DB lookup은 availability bottleneck이 될 수 있으며, distributed cache invalidation을 즉시라고 가정하면 revoke gap을 놓칩니다.",
    verification: "transaction race, same/family/all scope matrix, digest lookup, revoked refresh replay, access use before/after propagation, cache partition, introspection privacy와 affected rows를 검증합니다.",
    operations: "scope/reason, affected session count bucket, propagation percentile, unexpected active readback와 cache/version skew를 수집하고 raw IDs/credentials는 제외합니다.",
    concepts: [
      c("revocation scope", "폐기하는 authority의 범위를 현재 credential, family/session, device 또는 사용자 전체로 정의한 값입니다.", ["사용자 의도와 맞춥니다.", "API authorization에 포함합니다."]),
      c("session epoch", "credential이 가진 generation과 server의 current generation을 비교해 오래된 access를 거부하는 값입니다.", ["all-device logout에 유용합니다.", "cache propagation을 관리합니다."]),
      c("revoke latency", "server revoke 결정부터 모든 검증 경계가 credential 사용을 거부할 때까지의 시간입니다.", ["SLO로 측정합니다.", "JWT lifetime과 연결합니다."]),
    ],
    codeExamples: [node("security13-revoke-scope", "session family and user-epoch revocation model", "Security13RevokeScope.mjs", "세 synthetic sessions에 current/family/all scopes를 적용해 affected set을 계산합니다.", String.raw`const sessions = [
  { id: "s1", family: "f1", user: "u1", active: true },
  { id: "s2", family: "f1", user: "u1", active: true },
  { id: "s3", family: "f2", user: "u1", active: true },
  { id: "s4", family: "f3", user: "u2", active: true },
];
function affected(scope, current) {
  return sessions.filter((s) =>
    scope === "current" ? s.id === current.id :
    scope === "family" ? s.family === current.family :
    s.user === current.user
  ).map((s) => s.id);
}
for (const scope of ["current", "family", "all-user"]) console.log(scope + "=" + affected(scope, sessions[0]).join(","));
console.log("raw-credentials-stored=false");`, "current=s1\nfamily=s1,s2\nall-user=s1,s2,s3\nraw-credentials-stored=false", ["local-refresh-model", "local-members-controller", "local-members-service", "rfc7009", "rfc7662", "rfc9700", "rfc7519"])],
  }),
  appliedTopic({
    id: "client-logout-transaction", title: "client logout을 freeze·abort·revoke·clear·broadcast·readback transaction으로 구현합니다",
    lead: "store action에서 storage 한 곳만 지우는 대신 새 authenticated work를 먼저 차단하고 in-flight refresh/request를 무효화하며 server revoke와 모든 local sinks 정리를 순서·실패 policy와 함께 실행합니다.",
    mechanism: "logout coordinator는 single instance로 intent를 deduplicate하고 auth epoch를 즉시 증가시킵니다. AbortControllers와 refresh promise가 captured epoch로 stale가 되며 dedicated revoke call은 browser-managed credential 또는 current server session을 사용합니다. memory/store, Web Storage remnants, caches, query clients, service worker messages와 sensitive UI를 clear하고 credential 없는 epoch event를 tabs에 보냅니다.",
    workflow: "compare-and-set logout coordinator→epoch/freeze→snapshot of cleanup owners→bounded revoke call→all local cleanup with allSettled→broadcast→server probe/readback→navigate/focus/status→pending retry/runbook 순서를 사용합니다.",
    invariants: "cleanup 한 단계 실패가 나머지를 막지 않고 raw credential을 cleanup report에 넣지 않으며 revoke response가 늦어도 authenticated state를 복원하지 않고 logout endpoint는 일반 response-refresh interceptor를 재귀 호출하지 않습니다.",
    edgeCases: "revoke timeout, storage denied/corrupt, cache clear failure, service worker asleep, interceptor error, React unmount, two logout clicks, refresh completing simultaneously와 browser close를 포함합니다.",
    failureModes: "try 블록 하나에 revoke와 clear를 묶으면 첫 예외 뒤 다른 sinks가 남고, clear 후 request header가 old closure에서 계속 주입되거나 pending query가 sensitive response를 cache에 쓰면 logout 뒤 data가 되살아납니다.",
    verification: "fault per cleanup owner, epoch/abort, allSettled counts, header provider after clear, cache/query/service-worker sinks, duplicate coordinator와 late response tests를 실행합니다.",
    operations: "cleanup owner별 success/failure, local completion/server pending, duration과 convergence를 기록하고 values/snapshots는 secret-safe summary로 제한합니다.",
    concepts: [
      c("logout coordinator", "logout intent를 한 번 처리하고 server revoke, local cleanup과 convergence를 orchestration하는 component입니다.", ["중복을 합칩니다.", "epoch를 소유합니다."]),
      c("freeze first", "logout 시작 즉시 새 protected action/credential attachment를 막는 ordering invariant입니다.", ["server latency와 분리합니다.", "data resurrection을 막습니다."]),
      c("all-settled cleanup", "독립된 cleanup owner를 모두 실행하고 각각의 결과를 모아 partial failure를 복구하는 방식입니다.", ["첫 오류에서 멈추지 않습니다.", "값 없는 summary를 남깁니다."]),
    ],
    codeExamples: [node("security13-client-logout", "fault-tolerant client logout transaction", "Security13ClientLogout.mjs", "한 cleanup owner가 실패해도 나머지 clear와 epoch broadcast가 완료되는 model입니다.", String.raw`const owners = [
  ["memory", true],
  ["web-storage", true],
  ["query-cache", false],
  ["service-worker", true],
];
let epoch = 12;
const frozen = true;
epoch += 1;
const settled = owners.map(([name, ok]) => ({ name, status: ok ? "cleared" : "failed" }));
for (const x of settled) console.log(x.name + "=" + x.status);
console.log("frozen=" + frozen);
console.log("broadcast-epoch=" + epoch);
console.log("local-anonymous=true");
console.log("raw-values-reported=false");`, "memory=cleared\nweb-storage=cleared\nquery-cache=failed\nservice-worker=cleared\nfrozen=true\nbroadcast-epoch=13\nlocal-anonymous=true\nraw-values-reported=false", ["local-http", "local-auth-api", "local-auth-store", "axios-interceptors", "fetch-standard", "html-webstorage"])],
  }),
  appliedTopic({
    id: "multi-tab-convergence", title: "multi-tab logout을 credential-free event와 monotonic epoch로 수렴시킵니다",
    lead: "localStorage 삭제 event 하나 또는 BroadcastChannel message delivery를 보장으로 보지 않고 각 tab이 missed/reordered/duplicated events와 bfcache restore 뒤에도 server state를 확인해 같은 anonymous epoch에 도달하게 합니다.",
    mechanism: "logout event에는 version, type, scope, server/local auth epoch, event ID와 coarse time만 포함하고 credential, identity, provider, route를 넣지 않습니다. receiver는 schema와 higher epoch를 확인해 freeze/abort/clear하며 ack를 security requirement로 기다리지 않습니다. visibility/pageshow/online과 protected 401은 missed event를 보완하는 session probe trigger입니다.",
    workflow: "originating tab이 server revoke 또는 pending intent를 기록하고 epoch event를 publish합니다. receiving tabs는 highest epoch를 atomically 적용하고 cleanup한 뒤 server readback하며 lower/equal event를 무시합니다. channel unavailable이면 storage tombstone 또는 polling/session probe를 fallback으로 사용합니다.",
    invariants: "event payload는 authority가 아닌 hint이며 event loss가 security bypass가 되지 않고 message receipt가 server revoke 확인을 대체하지 않으며 user-visible profile을 channel에 담지 않습니다.",
    edgeCases: "publisher crash, event before server commit, event after rollback, channel construction failure, storage event not firing same tab, background throttling, bfcache, duplicate tab와 different app on same origin을 포함합니다.",
    failureModes: "token을 BroadcastChannel로 보내면 compromise blast radius가 커지고 event timestamp만 비교하면 clock skew로 stale가 이기며 모든 tab ack를 기다리면 suspended tab 때문에 logout UX가 hang합니다.",
    verification: "message permutation/loss/duplicate, higher/lower epoch, publisher/receiver crash, visibility restore, channel/storage fallback와 server probe를 deterministic browser contexts에서 검증합니다.",
    operations: "event version/type, epoch delta, convergence percentile, missed-event probe와 stale count만 수집하고 payload 원문은 저장하지 않습니다.",
    concepts: [
      c("logout tombstone", "로그아웃 epoch가 최소 이 값 이상임을 알리는 credential-free persistent hint입니다.", ["missed events를 보완합니다.", "server authority가 아닙니다."]),
      c("monotonic convergence", "각 context가 더 높은 auth epoch만 받아 결국 같은 security state로 전진하는 성질입니다.", ["순서 뒤바뀜에 안전합니다.", "rollback으로 낮추지 않습니다."]),
      c("revalidation trigger", "visibility, online, 401 같은 시점에 server session truth를 다시 확인하도록 하는 사건입니다.", ["event loss를 보완합니다.", "bounded probe를 사용합니다."]),
    ],
    codeExamples: [node("security13-tab-events", "multi-tab logout event convergence", "Security13TabEvents.mjs", "세 tab에 reorder/duplicate logout events를 적용해 highest epoch로 수렴시킵니다.", String.raw`const tabs = { A: 2, B: 3, C: 1 };
const events = [{ epoch: 4 }, { epoch: 3 }, { epoch: 5 }, { epoch: 5 }];
for (const event of events) {
  for (const key of Object.keys(tabs)) if (event.epoch > tabs[key]) tabs[key] = event.epoch;
}
for (const key of Object.keys(tabs)) console.log(key + "=anonymous@" + tabs[key]);
console.log("converged=" + new Set(Object.values(tabs)).size);
console.log("credential-in-events=false");`, "A=anonymous@5\nB=anonymous@5\nC=anonymous@5\nconverged=1\ncredential-in-events=false", ["react-external-store", "html-broadcast-channel", "html-webstorage", "owasp-html5"])],
  }),
  appliedTopic({
    id: "device-session-convergence", title: "current·selected·all-device logout과 external session을 서로 다른 scopes로 운영합니다",
    lead: "한 사용자당 refresh row 하나를 최신 값으로 교체하는 학습 model을 multi-device session management로 과장하지 않고 사용자가 어떤 browser/device/application/provider authority를 끝내는지 선택하고 확인할 수 있게 합니다.",
    mechanism: "server session registry는 opaque session ID, credential-family digest reference, user epoch, created/last-used/expiry, coarse device label, assurance와 revoke metadata를 갖습니다. current session logout은 하나를, selected device revoke는 지정 session들을, logout all은 user epoch를 증가시키고 모든 family를 폐기합니다. external identity-provider session은 application session과 별개이며 RP-initiated logout 또는 back-channel logout의 issuer/audience/session binding을 검증합니다.",
    workflow: "사용자에게 안전한 session inventory를 보여 주고 sensitive scope에는 recent authentication/step-up을 요구합니다. server가 atomic revoke/epoch update→events/cache invalidation→client convergence→protected request readback을 수행하며 provider logout은 별도 confirmed|pending|unsupported 결과로 표시합니다.",
    invariants: "client-supplied subject/provider/session ownership을 신뢰하지 않고 device fingerprint를 stable surveillance identifier로 만들지 않으며 all-device logout이 lower epoch rollback 또는 old refresh reuse로 되돌아가지 않습니다.",
    edgeCases: "same browser multiple profiles, duplicate labels, lost device, stolen refresh, password reset, account disable, provider unavailable, back-channel replay, long-lived native client와 support-initiated revoke를 포함합니다.",
    failureModes: "최신 refresh 하나만 저장하면 새 login이 의도치 않게 다른 device를 로그아웃시키거나 공격자 login이 기존 defense를 바꿀 수 있고, device name/IP를 과도하게 수집하면 privacy risk가 커지며, provider logout success를 application revoke로 대신하면 scope가 어긋납니다.",
    verification: "current/selected/all actor-resource authorization, user epoch monotonicity, registry affected rows, concurrent device rotation, provider logout token validation/replay와 each client readback을 검증합니다.",
    operations: "session count bucket, scope/reason, provider outcome class, convergence/revoke latency와 unusual churn만 수집하고 raw session/subject/device fingerprint는 제한합니다.",
    concepts: [
      c("session registry", "사용자의 독립 로그인 context와 credential family 상태를 server에서 관리하는 목록입니다.", ["current/selected/all scope를 지원합니다.", "raw credential은 저장하지 않습니다."]),
      c("user auth epoch", "사용자 전체 credential generation을 나타내며 all-device logout/disable 때 증가하는 값입니다.", ["old access를 거부합니다.", "절대 낮추지 않습니다."]),
      c("federated logout boundary", "application session과 외부 identity-provider session의 폐기 책임과 protocol 경계입니다.", ["각 결과를 따로 확인합니다.", "issuer/session binding을 검증합니다."]),
    ],
    codeExamples: [node("security13-device-scope", "multi-device revocation registry model", "Security13DeviceScope.mjs", "current, selected와 all-device scopes가 revoking하는 synthetic sessions를 비교합니다.", String.raw`const registry = [
  { session: "a", user: "u1", active: true },
  { session: "b", user: "u1", active: true },
  { session: "c", user: "u1", active: true },
  { session: "d", user: "u2", active: true },
];
function revoke(scope, current, selected = []) {
  return registry.filter((x) =>
    scope === "current" ? x.session === current.session :
    scope === "selected" ? x.user === current.user && selected.includes(x.session) :
    x.user === current.user
  ).map((x) => x.session);
}
console.log("current=" + revoke("current", registry[0]).join(","));
console.log("selected=" + revoke("selected", registry[0], ["b", "c"]).join(","));
console.log("all=" + revoke("all", registry[0]).join(","));
console.log("other-user-revoked=false");`, "current=a\nselected=b,c\nall=a,b,c\nother-user-revoked=false", ["local-members-controller", "local-members-service", "local-refresh-model", "rfc9700", "oidc-rp-logout", "oidc-backchannel-logout", "owasp-authentication"])],
  }),
  appliedTopic({
    id: "offline-partial-logout", title: "offline·timeout·browser-close에서 local logout과 server revoke uncertainty를 정직하게 처리합니다",
    lead: "network가 없을 때 server revoke를 성공했다고 표시하거나 raw refresh credential을 retry queue에 보관하지 않고 local access는 즉시 끝내되 server 상태가 pending일 수 있음을 이해 가능한 UX와 recovery policy로 표현합니다.",
    mechanism: "logout intent는 auth epoch를 증가시키고 local memory/UI/cache를 즉시 clear합니다. HttpOnly rotation cookie는 JavaScript가 삭제할 수 없으므로 offline에서는 server Set-Cookie와 revoke를 받을 수 없습니다. credential-free tombstone과 revoke-pending state만 보관하고 reconnect 또는 다음 app start에서 protected work 전에 dedicated logout/session probe를 먼저 수행합니다. browser가 영구 닫히면 server-side short expiry, inactivity, rotation/reuse detection와 다른 authenticated device의 all-session revoke가 residual risk를 제한합니다.",
    workflow: "online hint와 무관하게 bounded revoke를 시도하고 timeout/network failure면 local anonymous+server pending으로 전환합니다. service worker/background sync에 raw credential/body를 저장하지 않고 reconnect에서 cookie/session authority로 idempotent revoke를 재시도한 뒤 introspection/protected readback으로 confirmed를 기록합니다.",
    invariants: "offline logout 뒤 local protected action과 cached sensitive data 접근은 막히고 pending 상태가 authenticated로 rollback되지 않으며 navigator.onLine 또는 queued request existence를 server success로 계산하지 않습니다.",
    edgeCases: "captive portal, DNS failure, partial region outage, request committed but response lost, cookie expired during offline, tab/browser close, background sync disabled, logout all from another device와 clock jump를 포함합니다.",
    failureModes: "raw credential을 IndexedDB retry queue에 넣으면 XSS/profile theft surface가 남고, local clear만 하고 pending을 잊으면 stolen server credential이 장기 유효하며, endless retry는 account lock/outage와 battery/network cost를 악화시킵니다.",
    verification: "offline before/after dispatch, server commit-response loss, reconnect, browser restart, tombstone schema, no-secret offline store, bounded attempts, readback와 accessibility status를 검증합니다.",
    operations: "pending age bucket, retry attempt/outcome, local clear completion, residual revoke deadline와 reconnect convergence를 기록하되 queued payload/cookie를 기록하지 않습니다.",
    concepts: [
      c("revoke uncertainty", "client가 server revoke의 적용 여부를 네트워크/response loss 때문에 확정하지 못하는 상태입니다.", ["local anonymous와 병존합니다.", "readback으로 해소합니다."]),
      c("credential-free retry intent", "raw credential이나 request body 없이 logout/revalidation이 필요하다는 사실만 저장한 marker입니다.", ["XSS exposure를 줄입니다.", "server session/cookie로 재인증합니다."]),
      c("residual logout risk", "offline client가 server revoke를 못한 뒤 credential expiry나 다른 channel revoke 전까지 남는 사용 가능성입니다.", ["문서화합니다.", "lifetime/SLO로 제한합니다."]),
    ],
    codeExamples: [node("security13-offline-policy", "offline logout pending/readback policy", "Security13OfflinePolicy.mjs", "network 결과별 local/server 상태와 next action을 계산합니다.", String.raw`function logoutOutcome(network) {
  if (network === "confirmed") return ["anonymous", "revoked", "none"];
  if (network === "response-lost") return ["anonymous", "unknown", "readback"];
  return ["anonymous", "pending", "retry-on-reconnect"];
}
for (const value of ["confirmed", "response-lost", "offline"]) {
  console.log(value + "=" + logoutOutcome(value).join("|"));
}
console.log("credential-in-retry-intent=false");`, "confirmed=anonymous|revoked|none\nresponse-lost=anonymous|unknown|readback\noffline=anonymous|pending|retry-on-reconnect\ncredential-in-retry-intent=false", ["fetch-standard", "html-webstorage", "rfc7009", "rfc7662", "owasp-html5", "owasp-session"])],
  }),
  appliedTopic({
    id: "revocation-propagation-readback", title: "filter·cache·JWT verifier의 revoke propagation을 측정하고 readback합니다",
    lead: "backend refresh record 삭제와 현재 JWT filter의 signature/expiry validation 사이의 간극을 인정하고 어떤 verifier가 언제 session/user revoke를 보는지 architecture와 SLO로 관리합니다.",
    mechanism: "관찰된 custom filter는 bearer header를 파싱하고 JWT signature/expiry로 context를 설정하지만 refresh data store 또는 revocation epoch 조회는 보이지 않습니다. 따라서 refresh revoke는 새 발급을 막아도 기존 access의 남은 lifetime 동안 즉시 거부를 증명하지 않습니다. target은 short-lived access, session/user epoch claim과 cache, denylist/introspection 또는 high-risk online check를 risk/cost별로 선택합니다.",
    workflow: "revoke transaction이 versioned event를 발행하고 local caches를 invalidate하며 verifier가 current epoch/status를 읽습니다. test는 t0 decision, cache/event arrival, each region/verifier deny와 client convergence 시간을 측정하고 protected resource 또는 introspection으로 최종 readback합니다.",
    invariants: "cache miss/error를 active로 fail-open하지 않고 old event가 new active state를 만들지 않으며 rollback/deploy가 revoked session row와 user epoch를 복원하지 않고 raw token을 cache key/log로 사용하지 않습니다.",
    edgeCases: "event loss/duplicate/reorder, cache partition, cold start, region lag, key rotation, expired token, old clients, database failover와 emergency deny-all을 포함합니다.",
    failureModes: "access expiry만 기다리면서 즉시 로그아웃을 약속하면 사용자 기대와 incident containment가 어긋나고, every-request DB query를 무계획 도입하면 availability/latency가 악화되며, cache invalidation success만 보고 actual verifier deny를 확인하지 않으면 false assurance입니다.",
    verification: "before/after revoke protected calls, session/user epoch mismatch, cache fault, event permutation, multi-region percentile, unknown status fail-closed policy와 final readback을 실행합니다.",
    operations: "decision/reason, verifier/cache revision, propagation latency, unexpected active after deadline와 fallback mode를 관찰하고 raw credential/session identifier는 제외합니다.",
    concepts: [
      c("revocation propagation", "revoke state가 data store에서 모든 credential verifier와 clients로 전달되는 과정입니다.", ["event/cache가 관여합니다.", "실제 deny로 확인합니다."]),
      c("online revocation check", "request 시 server-side current session/epoch/status를 조회해 self-contained credential 외의 폐기 상태를 확인하는 방식입니다.", ["latency/availability cost가 있습니다.", "high-risk 경계에 선택할 수 있습니다."]),
      c("readback", "상태 변경 뒤 독립된 조회나 protected action으로 기대한 폐기가 실제 적용됐는지 확인하는 절차입니다.", ["write response와 다릅니다.", "incident evidence가 됩니다."]),
    ],
    codeExamples: [node("security13-verifier-gate", "access credential epoch and revocation verifier", "Security13VerifierGate.mjs", "expiry, session status와 user epoch를 함께 검사하는 synthetic verifier를 실행합니다.", String.raw`function active(x) {
  if (!x.signatureValid || x.now >= x.expiresAt) return "deny:cryptographic";
  if (x.sessionStatus !== "active") return "deny:session";
  if (x.credentialEpoch !== x.currentEpoch) return "deny:epoch";
  return "allow";
}
const base = { signatureValid: true, now: 10, expiresAt: 20, sessionStatus: "active", credentialEpoch: 4, currentEpoch: 4 };
console.log(active(base));
console.log(active({ ...base, sessionStatus: "revoked" }));
console.log(active({ ...base, currentEpoch: 5 }));
console.log(active({ ...base, now: 20 }));`, "allow\ndeny:session\ndeny:epoch\ndeny:cryptographic", ["local-jwt-filter", "local-members-controller", "rfc7519", "rfc8725", "rfc7662", "owasp-rest"])],
  }),
  appliedTopic({
    id: "logout-privacy-audit-ux", title: "logout UX·device inventory·audit를 credential-safe하고 접근 가능하게 만듭니다",
    lead: "로그아웃 성공 toast 하나보다 현재 device만인지 모든 sessions인지, server revoke가 pending인지, 사용자가 다음에 무엇을 해야 하는지 focus와 assistive technology로 이해시키면서 audit에는 민감 값을 남기지 않습니다.",
    mechanism: "UI는 action scope, local completion, server/provider pending/confirmed와 recovery link를 semantic status/alert로 제공합니다. session inventory는 coarse browser/device label, created/last-used time bucket과 current marker만 최소 공개하고 exact IP, user agent fingerprint와 location을 신뢰/노출하지 않습니다. audit event는 actor class, scope, policy/reason, outcome, correlation, server epoch와 affected-count bucket을 포함하되 access/refresh/session IDs, cookies, headers, identity/profile과 raw exception을 제외합니다.",
    workflow: "confirmation/step-up→disable/freeze control→progress/status→success/pending/error focus→session list refresh→audit event schema validation→sink redaction/canary scan→retention/access review를 구현합니다.",
    invariants: "logout endpoint response와 UI가 account/session existence oracle이 되지 않고 failed server revoke에도 local anonymous를 유지하며 raw credentials가 console, APM, browser trace, screenshot, HAR와 support export에 없습니다.",
    edgeCases: "screen reader, keyboard only, multiple clicks, reduced motion, localization, slow/offline, provider pending, shared device, user-renamed session과 support investigation을 포함합니다.",
    failureModes: "raw Authorization/refresh values를 debug log에 남기면 logout 후에도 sink 복사본이 bearer credential이 되고, exact device fingerprint/location을 표시하면 privacy와 false attribution 문제가 생기며, 강제 redirect만 하면 pending/error 설명과 focus가 사라집니다.",
    verification: "accessible name/status/focus, device data minimization, enumeration cases, log/trace/HAR secret canaries, retention deletion, support export와 audit query를 검사합니다.",
    operations: "redacted event schema, access controls, retention, anomaly thresholds와 on-call dashboard/runbook을 운영하고 credential 발견은 immediate incident trigger로 처리합니다.",
    concepts: [
      c("security state UX", "인증/폐기 상태와 사용자가 취할 다음 행동을 정확하고 접근 가능하게 전달하는 interaction입니다.", ["pending을 성공으로 숨기지 않습니다.", "focus/status를 검증합니다."]),
      c("device data minimization", "session 관리에 필요한 최소한의 coarse device metadata만 수집·표시하는 원칙입니다.", ["fingerprint를 피합니다.", "사용자 편집 label을 고려합니다."]),
      c("credential-safe audit", "누가 어떤 scope의 revoke를 어떤 결과로 수행했는지 증명하면서 bearer values를 제외한 event입니다.", ["incident에 사용합니다.", "sink redaction을 검증합니다."]),
    ],
    codeExamples: [node("security13-audit-schema", "credential-safe logout audit allowlist", "Security13AuditSchema.mjs", "raw credential/session fields를 거부하고 승인된 audit keys만 남깁니다.", String.raw`const input = {
  event: "logout",
  scope: "all-user",
  outcome: "confirmed",
  epoch: 7,
  affectedBucket: "2-5",
  credential: "synthetic-secret-canary",
  rawSession: "synthetic-session-canary",
};
const allow = new Set(["event", "scope", "outcome", "epoch", "affectedBucket"]);
const safe = Object.fromEntries(Object.entries(input).filter(([key]) => allow.has(key)));
console.log("keys=" + Object.keys(safe).sort().join(","));
console.log("credential-present=" + ("credential" in safe));
console.log("raw-session-present=" + ("rawSession" in safe));`, "keys=affectedBucket,epoch,event,outcome,scope\ncredential-present=false\nraw-session-present=false", ["local-jwt-filter", "local-members-controller", "owasp-logging", "owasp-session"])],
  }),
  appliedTopic({
    id: "logout-release-rollback", title: "race·device·provider·readback evidence와 monotonic rollback으로 logout을 release합니다",
    lead: "happy-path 버튼 test가 아니라 refresh-vs-logout race, partial revoke, event loss, all-device, external provider와 secret sinks를 한 release packet으로 검증하고 rollback이 old sessions를 부활시키지 않게 합니다.",
    mechanism: "unit state tests는 epoch/transition, component tests는 accessible pending/error, integration은 DB transaction/revoke/readback, browser E2E는 tabs/offline/cookies/cache, multi-client lab은 devices/provider back-channel, chaos는 event/cache/region failure를 담당합니다. rollout은 new revoke schema/events를 backward-compatible expand→dual-read no-dual-authority→backfill→canary→contract 단계로 진행합니다.",
    workflow: "threat/requirement IDs→scope/race/failure matrix→deterministic fixtures→artifact redaction→canary SLO→unexpected-active stop condition→rollback/roll-forward decision→session/epoch reconciliation→post-release audit를 수행합니다.",
    invariants: "critical unexpected active, raw credential artifact, lower epoch, revive/reinsert old family, deny-after-logout side effect와 unreconciled region은 release blocker이며 rollback은 code/config만 되돌리고 revoke facts는 보존합니다.",
    edgeCases: "old client without event support, mixed DB schema, long-lived access, provider outage, telemetry loss, partial cache rollout, emergency disable, support revoke와 dependency rollback을 포함합니다.",
    failureModes: "old code rollback이 deleted record를 복원하거나 epoch check를 제거하면 stolen credential이 재활성화되고, flaky tab tests를 retry로 숨기면 실제 race가 남으며, status 200만 보고 server active state를 읽지 않으면 false pass입니다.",
    verification: "all test layers, exact artifacts/digests, sourceRef coverage, secret scan, canary stop/rollback rehearsal, before/after protected use와 region/tab/device convergence를 독립 재실행합니다.",
    operations: "revoke SLO, pending age, unexpected active, convergence, secret-sink count, rollout revision와 residual risk owner를 dashboard/runbook에 연결합니다.",
    concepts: [
      c("monotonic security rollback", "software를 되돌려도 이미 증가한 epoch와 revoke/incident facts는 되돌리지 않는 rollback 원칙입니다.", ["credential resurrection을 막습니다.", "schema compatibility가 필요합니다."]),
      c("unexpected active", "revoke deadline 뒤 credential/session이 protected verifier에서 여전히 허용되는 critical signal입니다.", ["release/incident trigger입니다.", "readback으로 검출합니다."]),
      c("logout evidence packet", "source, contracts, tests, browser/device/provider traces, redaction, SLO와 rollback 결과를 연결한 release 근거입니다.", ["independent rerun이 가능합니다.", "값은 secret-safe합니다."]),
    ],
    codeExamples: [node("security13-readiness-gate", "logout and revocation production readiness gate", "Security13ReadinessGate.mjs", "call graph, server model, client transaction, convergence, privacy와 rollback evidence를 판정합니다.", String.raw`const evidence = {
  sourceCallGraph: true,
  idempotentStateMachine: true,
  sessionFamilyAndUserEpoch: true,
  faultTolerantClientCleanup: true,
  multiTabConvergence: true,
  multiDeviceAndProviderScope: true,
  offlinePendingReadback: true,
  verifierPropagationSlo: true,
  credentialSafeAudit: true,
  monotonicRollback: true,
  unexpectedActive: 0,
};
const missing = Object.entries(evidence).filter(([key, value]) => key === "unexpectedActive" ? value !== 0 : value !== true).map(([key]) => key);
console.log("checks=" + Object.keys(evidence).length);
console.log("missing=" + (missing.join(",") || "none"));
console.log("actual-values-copied=false");
console.log("release=" + (missing.length === 0 ? "pass" : "block"));`, "checks=11\nmissing=none\nactual-values-copied=false\nrelease=pass", localRefs.concat(officialRefs))],
  }),
];

const sources: SessionSource[] = [
  { id: "local-http", repository: "D:/dev/my-app03", path: "src/api/Http.jsx", usedFor: ["credentialed Axios instance", "cookie/CORS/logout transport boundary"], evidence: "2026-07-14 read-only sanitized audit: 18 lines, 872 bytes, SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987. 실제 base URL, domain와 header values는 복사하지 않았습니다." },
  { id: "local-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["server logout wrapper and refresh race current-state", "browser credential/retry cleanup boundary"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 routes, storage key, credentials, identity fields, domain와 response values는 복사하지 않았습니다." },
  { id: "local-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["local display-state and browser-storage clear", "server revocation linkage gap"], evidence: "2026-07-14 read-only sanitized audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA. 실제 storage key와 identity values는 복사하지 않았습니다." },
  { id: "local-login", repository: "D:/dev/my-app03", path: "src/pages/LoginPage.jsx", usedFor: ["observed UI logout direct local action", "accessible logout transaction target gap"], evidence: "2026-07-14 read-only sanitized audit: 97 lines, 4,359 bytes, SHA-256 9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8. 실제 input, credential, member, route와 UI values는 복사하지 않았습니다." },
  { id: "local-members-controller", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/controller/MembersController.java", usedFor: ["refresh lookup/rotation and server logout deletion", "credential logging and multi-device gaps"], evidence: "2026-07-14 read-only sanitized audit: 514 lines, 21,038 bytes, SHA-256 72F5F59FCF79C94CDA20546FA25634AE2C8C8F47C43953B45263E07CF3BB246D. 실제 routes, identities, providers, credentials, messages와 log values는 복사하지 않았습니다." },
  { id: "local-members-service", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/service/MembersServiceImpl.java", usedFor: ["refresh record save/find/delete service flow", "revocation transaction and readback target"], evidence: "2026-07-14 read-only sanitized audit: 72 lines, 2,147 bytes, SHA-256 46E425BBDEFF3487367E052EF5A76528C2C3C6FEAA45EF6F03E024ED1D842308. 실제 user/provider/credential values는 복사하지 않았습니다." },
  { id: "local-refresh-model", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/vo/RefreshTokenVO.java", usedFor: ["minimal refresh record shape", "digest/family/device/revoke metadata target gap"], evidence: "2026-07-14 read-only sanitized audit: 12 lines, 278 bytes, SHA-256 DC5B4A7B79F01985B5EAD311A3F66BE1B6DCDEF802A0DC9C7D5380D0F9908CBD. 실제 field/token values는 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["signature/expiry-only observed access validation", "raw header/token logging risk and revoke gap"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. 실제 header, token, subject, route와 response values는 복사하지 않았습니다." },
  { id: "react-external-store", repository: "React official documentation", path: "reference/react/useSyncExternalStore", publicUrl: "https://react.dev/reference/react/useSyncExternalStore", usedFor: ["external auth state subscription and browser event integration"], evidence: "React 19.2 공식 현행 useSyncExternalStore 문서입니다." },
  { id: "axios-interceptors", repository: "Axios official documentation", path: "docs/interceptors", publicUrl: "https://axios-http.com/docs/interceptors", usedFor: ["logout/refresh interceptor lifecycle and ejection"], evidence: "Axios 공식 interceptor 문서의 current redirect target까지 2026-07-14 확인했습니다." },
  { id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "Fetch", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["credentialed request, abort, response-loss and network behavior"], evidence: "WHATWG Living Standard의 Fetch 규범입니다." },
  { id: "html-webstorage", repository: "WHATWG HTML Living Standard", path: "webstorage.html", publicUrl: "https://html.spec.whatwg.org/multipage/webstorage.html", usedFor: ["storage scope, cleanup and cross-context event"], evidence: "WHATWG HTML Living Standard의 Web Storage 규범입니다." },
  { id: "html-broadcast-channel", repository: "WHATWG HTML Living Standard", path: "web-messaging.html#broadcasting-to-other-browsing-contexts", publicUrl: "https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts", usedFor: ["credential-free multi-tab logout messaging"], evidence: "WHATWG HTML Living Standard의 BroadcastChannel 규범입니다." },
  { id: "rfc7009", repository: "IETF RFC 7009", path: "rfc7009.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7009.html", usedFor: ["OAuth token revocation endpoint semantics and privacy"], evidence: "OAuth 2.0 Token Revocation 표준입니다." },
  { id: "rfc7662", repository: "IETF RFC 7662", path: "rfc7662.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7662.html", usedFor: ["active-state introspection/readback semantics"], evidence: "OAuth 2.0 Token Introspection 표준입니다." },
  { id: "rfc9700", repository: "IETF RFC 9700", path: "rfc9700.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9700.html", usedFor: ["refresh rotation, replay/reuse and credential lifecycle BCP"], evidence: "2025 Best Current Practice for OAuth 2.0 Security입니다." },
  { id: "rfc7519", repository: "IETF RFC 7519", path: "rfc7519.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7519.html", usedFor: ["JWT expiry/claims and access revoke latency"], evidence: "JSON Web Token 표준입니다." },
  { id: "rfc8725", repository: "IETF RFC 8725", path: "rfc8725.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc8725.html", usedFor: ["JWT validation and cross-context/replay best practices"], evidence: "JSON Web Token Best Current Practices입니다." },
  { id: "rfc6750", repository: "IETF RFC 6750", path: "rfc6750.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6750.html", usedFor: ["bearer failure and challenge semantics"], evidence: "OAuth 2.0 Bearer Token Usage 표준입니다." },
  { id: "rfc6265", repository: "IETF RFC 6265", path: "rfc6265.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6265.html", usedFor: ["browser-managed session cookie scope and logout expiry"], evidence: "HTTP State Management Mechanism 표준입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["idempotent request and authentication status semantics"], evidence: "HTTP Semantics 표준입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["stable logout/revocation problem details"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "oidc-rp-logout", repository: "OpenID Foundation", path: "openid-connect-rpinitiated-1_0.html", publicUrl: "https://openid.net/specs/openid-connect-rpinitiated-1_0.html", usedFor: ["RP-initiated federated logout boundary"], evidence: "OpenID Connect RP-Initiated Logout 1.0 Final specification입니다." },
  { id: "oidc-backchannel-logout", repository: "OpenID Foundation", path: "openid-connect-backchannel-1_0.html", publicUrl: "https://openid.net/specs/openid-connect-backchannel-1_0.html", usedFor: ["back-channel logout session binding and replay controls"], evidence: "OpenID Connect Back-Channel Logout 1.0 Final specification입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["logout/session invalidation and cookie lifecycle"], evidence: "OWASP 공식 Session Management guidance입니다." },
  { id: "owasp-html5", repository: "OWASP Cheat Sheet Series", path: "HTML5_Security_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", usedFor: ["Web Storage and messaging secret risks"], evidence: "OWASP 공식 HTML5 Security guidance입니다." },
  { id: "owasp-authentication", repository: "OWASP Cheat Sheet Series", path: "Authentication_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["reauthentication and account/session lifecycle"], evidence: "OWASP 공식 Authentication guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["credential-safe audit and incident sinks"], evidence: "OWASP 공식 Logging guidance입니다." },
  { id: "owasp-rest", repository: "OWASP Cheat Sheet Series", path: "REST_Security_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html", usedFor: ["access/revoke validation and REST security errors"], evidence: "OWASP 공식 REST Security guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "security-13-logout-revocation", slug: "security-13-logout-revocation", courseId: "devops", moduleId: "token-client-integration", order: 5,
  title: "logout·revocation·multi-tab/device convergence",
  subtitle: "local clear에서 server family/user revoke, tab·device·provider·offline propagation, privacy audit와 monotonic rollback까지 logout을 검증 가능한 lifecycle로 만듭니다.",
  level: "전문가", estimatedMinutes: 195,
  coreQuestion: "한 React tab에서 로그아웃을 눌렀다는 사건이 어떻게 server credential families, 이미 발급된 access, 다른 tabs/devices와 외부 provider까지 값 유출 없이 수렴하고 독립적으로 확인될 수 있을까요?",
  summary: "my-app03의 Axios/auth/store/login과 2026-myproject04-cicd의 refresh controller/service/model/JWT filter 여덟 files를 read-only·sanitized audit했습니다. API logout wrapper와 server refresh deletion은 존재하지만 observed UI button은 local store action을 직접 호출하며 해당 path에서 server wrapper 호출이 증명되지 않습니다. refresh record 삭제도 signature/expiry-only access filter에서 이미 발급된 JWT를 즉시 거부한다고 증명하지 않습니다. 실제 route/storage key/identity/provider/domain/credential/secret/log values는 복사하지 않았습니다. idempotent split-completion logout, session/family/user epoch, fault-tolerant client transaction, credential-free multi-tab events, selected/all-device와 federated logout, offline revoke uncertainty, verifier propagation/readback, accessible/privacy-safe audit와 monotonic canary/rollback을 IETF·OpenID·WHATWG·React·Axios·OWASP 근거 및 열 executable models로 확장합니다.",
  objectives: ["UI에서 server/data/verifier까지 실제 logout call graph를 감사한다.", "logout을 local/server/provider split-completion state machine으로 정의한다.", "session/family/user epoch revocation model과 access revoke latency를 설계한다.", "freeze·abort·revoke·clear·broadcast·readback client transaction을 구현한다.", "credential-free events로 multi-tab이 monotonic epoch에 수렴하게 한다.", "current·selected·all-device와 federated logout scopes를 운영한다.", "offline/response-loss에서 local anonymous와 server pending을 정직하게 처리한다.", "cache/event/JWT verifier propagation과 readback SLO를 검증한다.", "accessible logout UX와 credential-safe audit/device privacy를 구현한다.", "race/device/provider evidence와 monotonic rollback을 release gate로 묶는다."],
  prerequisites: [{ title: "React token client·storage·interceptor", reason: "credential storage, epoch auth state, bounded single-flight refresh, replay, XSS/CSRF와 tab/offline hints를 알아야 logout이 late refresh에 되살아나지 않고 client/server authority를 안전하게 폐기할 수 있습니다.", sessionSlug: "security-12-react-token-client" }],
  keywords: ["logout", "token revocation", "session family", "auth epoch", "multi-tab", "BroadcastChannel", "multi-device", "RP-initiated logout", "back-channel logout", "offline revoke", "introspection", "revocation latency", "credential-safe audit", "monotonic rollback"],
  topics,
  lab: {
    title: "local click에서 all-device verifier deny까지 logout convergence qualification",
    scenario: "원본 files는 변경하지 않고 synthetic accounts/sessions/credential families, disposable auth store, multiple HTTPS browser contexts/devices와 simulated external identity service에서 current/sibling/all/offline logout을 실행합니다.",
    setup: ["Node.js current supported runtime", "React/Zustand/Axios logout coordinator fixture", "disposable session-family/user-epoch server and database", "JWT verifier/cache/event bus/introspection fixture", "multiple isolated HTTPS tabs and device profiles", "simulated RP/back-channel identity provider", "deterministic clock/network/cache/event fault injectors", "accessible UI and secret-canary artifact tools", "원본 8 files read-only"],
    steps: ["원본 fingerprints와 UI→local→network→server→data→verifier call graph를 값 없이 고정합니다.", "local/server/provider split states, idempotent outcomes와 logout scopes를 state machine으로 작성합니다.", "digest-based session/family registry, user epoch, atomic revoke와 readback endpoint를 구현합니다.", "client coordinator가 freeze/epoch/abort/revoke/allSettled-clear/broadcast/readback을 수행하게 합니다.", "BroadcastChannel/storage loss·duplicate·reorder와 bfcache/visibility에서 tabs를 highest epoch로 수렴시킵니다.", "current/selected/all-device, password/account events와 RP/back-channel provider logout을 검증합니다.", "offline/timeout/response-loss/browser-close에서 local anonymous, credential-free pending와 reconnect readback을 시험합니다.", "event/cache/region faults에서 JWT/session/user epoch verifier deny와 revoke latency SLO를 측정합니다.", "keyboard/screen-reader pending UX, session inventory minimization과 log/trace/HAR canary redaction을 검사합니다.", "mixed old/new clients/schema에서 canary stop, rollback과 revoked-state reconciliation을 rehearsal합니다."],
    expectedResult: ["UI logout intent 즉시 local protected work가 멈추고 late refresh/request가 authenticated state나 sensitive cache를 되살리지 못합니다.", "current/family/selected/all-device scope가 정확한 server records/epoch만 폐기하고 다른 사용자의 sessions에 영향 주지 않습니다.", "offline과 response-loss가 local anonymous+server pending/unknown으로 표현되고 reconnect readback에서 confirmed로 수렴합니다.", "모든 tab/device/verifier가 측정된 deadline 안에 deny하며 event/cache failure에서도 stale credential이 fail-open되지 않습니다.", "federated application/provider logout 결과가 분리되고 back-channel replay/issuer/session binding을 검증합니다.", "UI/audit/release artifacts에 credential/session/identity raw values가 없고 rollback이 revoke facts나 epoch를 낮추지 않습니다."],
    cleanup: ["synthetic users/sessions/families/access credentials와 provider states를 전부 revoke·폐기합니다.", "browser tabs/device profiles, channels/storage/cookies/caches/service workers와 pending requests를 제거합니다.", "database/cache/event bus/introspection/provider/fault fixtures와 timers를 종료합니다.", "traces/HAR/logs/screenshots를 secret scan/redaction 후 retention policy에 따라 삭제합니다.", "원본 8 files exact hashes와 source repository statuses unchanged를 확인합니다."],
    extensions: ["sender-constrained access credential과 device-bound keys의 logout/revoke semantics를 qualification합니다.", "risk-based session inventory와 suspicious-session one-click revoke를 privacy constraints와 함께 추가합니다.", "regional revoke propagation chaos drill과 emergency global epoch bump를 자동화합니다.", "native/mobile client 및 shared-device kiosk logout semantics를 같은 evidence model로 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "열 Node models를 실행하고 source graph, state, revoke scope, client transaction, tab/device/offline, verifier, audit와 release evidence에 대응시키세요.", requirements: ["stdout 완전 일치", "source call graph", "idempotent state", "session/family/user scope", "all-settled cleanup", "tab convergence", "device scope", "offline policy", "verifier gate", "audit allowlist", "readiness gate"], hints: ["Node models는 actual browser, server transaction, JWT crypto, event/cache propagation, external provider와 device를 대체하지 않습니다."], expectedOutcome: "logout의 각 단계가 무엇을 폐기하고 무엇을 아직 확정하지 못하는지 설명합니다.", solutionOutline: ["audit→intent/model→client/tabs/devices→offline/propagate→audit/release 순서입니다."] },
    { difficulty: "응용", prompt: "현재 local-only UI logout path를 current/all-device server revocation으로 단계 강화하세요.", requirements: ["call graph proof", "idempotent endpoint", "session/family/user epoch", "freeze/abort/allSettled", "tab events", "offline pending", "access verifier readback", "secret-safe audit", "canary/rollback"], hints: ["refresh row deletion이 access JWT 즉시 거부를 자동 보장한다고 가정하지 마세요."], expectedOutcome: "local UX와 server revoke가 partial failure에도 안전하게 분리·수렴하고 protected use로 검증됩니다.", solutionOutline: ["server model/readback→client coordinator→tabs/offline→verifier SLO→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 web session logout·revocation standard를 작성하세요.", requirements: ["scope semantics", "session registry/epoch", "access revoke strategy", "client transaction", "tab/device/provider", "offline", "privacy/audit", "SLO/readback", "incident/canary/rollback"], hints: ["logout success를 status code 하나가 아니라 모든 relevant authority의 confirmed/pending 상태와 deadline으로 정의하세요."], expectedOutcome: "여러 clients/services/providers가 같은 revocation scope, privacy와 recovery 계약을 공유합니다.", solutionOutline: ["assets/scopes→state/records→propagation/readback→UX/audit→release/revalidation 순서입니다."] },
  ],
  nextSessions: ["security-14-token-testing-incident"], sources,
  sourceCoverage: { filesRead: 8, filesUsed: 8, uncoveredNotes: ["API logout wrapper와 server refresh deletion이 존재하지만 observed UI logout path가 local store action을 직접 호출하므로 end-to-end server revoke를 완료로 주장하지 않았습니다.", "관찰된 access filter의 signature/expiry 검증을 refresh-row deletion과 연결된 immediate access revocation으로 과장하지 않았습니다.", "실제 route, storage key, identity/member/provider/domain, credential/secret, header/body, response와 log values는 공개 content·examples·evidence에 복사하지 않았습니다.", "raw Authorization/access/refresh logging은 값 없이 credential disclosure risk로 분류했으며 실제 운영 노출 시 collection stop, revoke/rotate, sink purge와 readback이 필요합니다.", "Node models는 actual React/Axios/browser tabs/devices, server DB/JWT/cache/event/provider와 revocation을 대체하지 않으므로 lab integration evidence를 요구합니다."] },
});

export default session;
