import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localClientRefs = ["local-auth-client"];
const localServerRefs = ["local-jwt-filter", "local-jwt-util", "local-members-controller", "local-jwt-config"];

const topics = [
  appliedTopic({
    id: "token-test-threat-matrix",
    title: "sanitized source audit를 token threat·test·incident matrix로 바꿉니다",
    lead: "Auth client, JWT filter·utility·configuration, controller와 YAML을 읽을 때 실제 credential·storage key·route·user·provider·domain·secret 값은 수집하지 않습니다. 대신 credential이 생성·저장·전송·검증·갱신·폐기·기록되는 경계와 각 경계의 실패 후 상태를 구조적 provenance로 남깁니다.",
    mechanism: "현재 snapshot은 browser persistent storage, request/response interceptors, 단일 refresh 잠금과 callback 대기열, server-side refresh persistence·rotation, JWT parsing/signing, 그리고 request header·token·refresh token이 logging 인자로 전달되는 경로를 보여 줍니다. 이는 학습용 동작 관찰이지 안전성 증명이 아니며 raw bearer material의 sink 도달은 값 노출 여부를 확인하기 전부터 credential incident candidate입니다.",
    workflow: "read-only line·byte·SHA snapshot→asset/actor/trust boundary→issuance/storage/transport/validation/refresh/revoke/log sinks→STRIDE형 abuse case→unit/component/contract/browser/incident test→control owner와 evidence age 순으로 matrix를 작성합니다.",
    invariants: "문서·fixture·stdout·screenshot·trace·log·artifact 어디에도 실제 credential이나 식별 값이 없고 source observation, specification guarantee, 목표 architecture와 아직 검증하지 못한 가정을 서로 다른 열에 둡니다.",
    edgeCases: "빈 credential, 잘린 JWT, 잘못된 segment 수, 만료 경계, future clock, algorithm confusion, 중복 refresh, refresh replay, logout 직후 in-flight request, multi-tab, offline 복귀, log collector 지연과 partial revoke를 포함합니다.",
    failureModes: "정상 login과 한 번의 refresh가 성공했다는 이유로 안전하다고 결론 내리면 XSS 탈취, 대기자 누수, replay, logout race, server revoke 전파 지연, raw credential logging과 config credential 유출을 놓칩니다.",
    verification: "각 threat에는 precondition, synthetic input, expected protocol/status/state/side-effect, secret-safe evidence와 cleanup을 연결하고 source hash 및 원본 git status가 감사 전후 동일한지 확인합니다.",
    operations: "risk ID, affected credential class, exposure window, revoke latency SLO, evidence revision, owner와 residual risk를 low-cardinality register로 운영하며 raw 값은 어떤 correlation key로도 사용하지 않습니다.",
    concepts: [
      c("token threat-test matrix", "credential lifecycle의 공격 조건을 검증 계층과 expected recovery evidence에 연결한 표입니다.", ["happy path와 abuse path를 함께 다룹니다.", "control마다 owner와 증거를 둡니다."]),
      c("sanitized provenance", "원본 값을 복제하지 않고 file identity, hash, 구조적 관찰과 검증 시점을 남기는 출처 방식입니다.", ["재현성과 비밀 보호를 함께 지킵니다.", "관찰과 추론을 구분합니다."]),
      c("credential incident candidate", "실제 악용 확인 전이라도 credential이 승인되지 않은 sink에 도달한 사실로 시작하는 사고 조사 단위입니다.", ["노출 범위를 보수적으로 잡습니다.", "contain/revoke/readback으로 닫습니다."]),
    ],
    codeExamples: [node(
      "security14-threat-test-matrix",
      "token threat와 test evidence 우선순위",
      "Security14ThreatTestMatrix.mjs",
      "값 없는 threat records에서 exposure와 복구 공백을 기준으로 실행 우선순위를 결정합니다.",
      String.raw`const risks = [
  { id: "T1", exposure: 5, recoveryGap: 5, test: "secret-sink-scan" },
  { id: "T2", exposure: 4, recoveryGap: 4, test: "refresh-concurrency" },
  { id: "T3", exposure: 4, recoveryGap: 5, test: "theft-revoke-readback" },
  { id: "T4", exposure: 3, recoveryGap: 3, test: "multi-tab-logout" },
];
const ranked = risks
  .map((risk) => ({ ...risk, score: risk.exposure * risk.recoveryGap }))
  .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
for (const risk of ranked) console.log(risk.id + "|" + risk.test + "|score=" + risk.score);
console.log("raw-values-collected=false");`,
      "T1|secret-sink-scan|score=25\nT3|theft-revoke-readback|score=20\nT2|refresh-concurrency|score=16\nT4|multi-tab-logout|score=9\nraw-values-collected=false",
      localClientRefs.concat(localServerRefs, ["local-application-yaml", "rfc9700", "owasp-session", "nist-incident"]),
    )],
    expertNotes: ["해시와 구조만으로도 raw credential logging은 제거·rotation·sink 조사 후보가 되며 로그 값을 다시 열어 확인하지 않습니다."],
  }),
  appliedTopic({
    id: "deterministic-token-fixtures",
    title: "clock·key·claim을 주입해 JWT positive/negative fixture를 결정적으로 만듭니다",
    lead: "실제 발급 토큰을 test fixture로 복사하지 않고 synthetic signing key, 고정 clock, allowlisted algorithm, issuer·audience·subject·time claims와 unique identifier를 test 전용 factory에서 생성합니다. token 문자열보다 verifier의 decision code와 claim validation order가 검증 대상입니다.",
    mechanism: "JWT는 세 구간의 encoded structure일 뿐 자동으로 암호화되거나 신뢰되는 container가 아닙니다. RFC 7519 claims와 RFC 8725의 algorithm verification, explicit typing, issuer/audience validation 및 mutually exclusive validation rules를 적용하고 parser가 읽었다는 사실과 application이 수용해도 된다는 판단을 분리합니다.",
    workflow: "frozen clock→ephemeral test key→minimal valid fixture→한 번에 한 claim/segment/signature 변조→stable reject code→context와 side-effect zero→boundary fuzz/property corpus→실제 library integration 순으로 진행합니다.",
    invariants: "검증 설정이 token header의 algorithm 선택을 그대로 신뢰하지 않고 exp/nbf/iat skew, issuer, audience, token type, subject semantics와 signature를 모두 명시적으로 확인하며 실패 시 principal·refresh·DB mutation이 없습니다.",
    edgeCases: "exp 직전/정각/직후, nbf future, iat future, duplicate claim, empty subject, wrong audience, wrong token type, unknown key ID, rotated key overlap, malformed base64url, oversized payload와 signature bit flip을 포함합니다.",
    failureModes: "현재 시각과 production key에 의존하는 test는 간헐적으로 깨지고, decode-only assertion이나 한 종류 token의 validation rule 재사용은 algorithm/key confusion과 access/refresh substitution을 숨깁니다.",
    verification: "pure decision table, 실제 JWT library parser, server filter/context, HTTP response와 audit event를 층별로 검증하고 clock/key source와 library version을 artifact에 기록합니다.",
    operations: "reject reason, verifier revision, key generation과 bounded clock skew를 집계하되 claims/token/header raw bytes는 기록하지 않고 sudden reason distribution 변화에 alert합니다.",
    concepts: [
      c("deterministic token fixture", "고정된 clock과 synthetic key로 같은 claims·decision을 재현하는 test 전용 credential입니다.", ["운영 credential을 재사용하지 않습니다.", "각 반례는 한 조건만 바꿉니다."]),
      c("algorithm allowlist", "application이 미리 승인한 signature algorithm만 verifier가 수용하는 정책입니다.", ["token header가 정책을 선택하지 못하게 합니다.", "key type과 함께 검증합니다."]),
      c("claim boundary table", "시간·issuer·audience·type·subject claim의 경계값과 expected decision을 표로 고정한 계약입니다.", ["skew를 명시합니다.", "stable reason code를 사용합니다."]),
    ],
    codeExamples: [node(
      "security14-token-fixture-clock",
      "고정 clock 기반 claim boundary 판정",
      "Security14TokenFixtureClock.mjs",
      "암호 구현을 흉내 내지 않고 signature가 별도 검증됐다는 전제 아래 시간·audience·type 경계를 결정적으로 분류합니다.",
      String.raw`const now = 1_700_000_000;
function verify(c) {
  if (!c.signatureValid) return "reject:signature";
  if (c.type !== "access") return "reject:type";
  if (c.audience !== "resource-a") return "reject:audience";
  if (c.notBefore > now + 30) return "reject:not-before";
  if (c.expiresAt <= now - 30) return "reject:expired";
  return "accept";
}
const base = { signatureValid: true, type: "access", audience: "resource-a", notBefore: now, expiresAt: now + 60 };
for (const patch of [{}, { signatureValid: false }, { type: "refresh" }, { audience: "other" }, { notBefore: now + 31 }, { expiresAt: now - 30 }]) {
  console.log(verify({ ...base, ...patch }));
}`,
      "accept\nreject:signature\nreject:type\nreject:audience\nreject:not-before\nreject:expired",
      ["local-jwt-util", "local-jwt-config", "rfc7519", "rfc8725"],
    )],
    expertNotes: ["Node 예제는 실제 JWS cryptography를 구현하지 않으며 production library의 parser·signature·key rotation integration test가 필수입니다."],
  }),
  appliedTopic({
    id: "refresh-interceptor-concurrency",
    title: "interceptor refresh를 single-flight·bounded waiter·replay-safe state machine으로 검증합니다",
    lead: "여러 요청이 동시에 인증 실패를 받았을 때 refresh 한 번만 수행하는 것만으로 충분하지 않습니다. 성공·거부·network failure·timeout·logout·unmount 모든 terminal path가 대기자를 resolve 또는 reject하고, 원래 요청이 안전하게 재생 가능한지 판정해야 합니다.",
    mechanism: "현재 client snapshot의 process-local boolean과 callback array는 한 tab의 happy path를 직관적으로 보여 주지만 failure에서 배열을 비운다고 Promise가 settle되는 것은 아닙니다. waiter마다 reject path, deadline, abort signal과 owner epoch를 두고 refresh 결과가 old logout/session epoch를 되살리지 않게 해야 합니다.",
    workflow: "request classification→single-flight coordinator→bounded queue/deadline→refresh result→atomic credential version install→eligible request one-shot replay→all waiters settle→metrics/cleanup을 explicit transitions로 구현합니다.",
    invariants: "동시에 refresh operation은 session epoch당 하나이고 모든 waiter는 제한 시간 안에 정확히 한 번 settle되며 unsafe/non-idempotent request는 자동 replay하지 않고 logout 후 늦은 success가 credential을 재설치하지 않습니다.",
    edgeCases: "refresh endpoint 자체 실패, logout endpoint 실패, refresh response malformed, tab close, abort, slow first request, second 401 after replay, network offline, duplicate callback, queue overflow와 server already-rotated token을 포함합니다.",
    failureModes: "실패 시 callback array만 초기화하면 기존 Promise가 영원히 pending인 waiter leak가 되고, 모든 401을 refresh하며 모든 method를 replay하면 retry loop와 duplicate mutation이 발생합니다.",
    verification: "fake clock/fault scheduler로 concurrent bursts와 모든 terminal paths를 실행하고 refresh count, waiter settled count, replay count, queue size, session epoch와 side effects를 assertion합니다.",
    operations: "refresh outcome·duration, waiters high-water mark, timeout/abort, replay blocked, second-failure와 epoch discard를 bounded metrics로 관찰하고 queue payload나 credential은 기록하지 않습니다.",
    concepts: [
      c("single-flight refresh", "동일 session epoch의 동시 실패가 하나의 refresh operation 결과를 공유하는 패턴입니다.", ["중복 rotation을 줄입니다.", "failure도 공유해 settle해야 합니다."]),
      c("waiter settlement invariant", "등록된 모든 대기 Promise가 성공·실패·취소 중 하나로 제한 시간 내 정확히 한 번 끝나는 조건입니다.", ["배열 제거와 다릅니다.", "leak counter로 검증합니다."]),
      c("replay eligibility", "원 요청의 method, idempotency key, body 재사용 가능성, 사용자 의도와 server 결과를 바탕으로 자동 재시도 가능 여부를 결정하는 정책입니다.", ["401만으로 결정하지 않습니다.", "mutation 기본값은 block입니다."]),
    ],
    codeExamples: [node(
      "security14-refresh-coordinator",
      "refresh failure에서 모든 waiter를 종료하는 coordinator",
      "Security14RefreshCoordinator.mjs",
      "single-flight refresh가 실패할 때도 등록된 요청이 pending으로 남지 않는 불변식을 모델링합니다.",
      String.raw`function finish(waiters, outcome) {
  return waiters.map((waiter) => ({
    request: waiter.request,
    state: outcome.ok && waiter.replaySafe ? "resolved:replay" : "rejected:" + (outcome.ok ? "replay-blocked" : outcome.code),
  }));
}
const waiters = [
  { request: "read-1", replaySafe: true },
  { request: "write-1", replaySafe: false },
  { request: "read-2", replaySafe: true },
];
for (const result of finish(waiters, { ok: false, code: "refresh-denied" })) {
  console.log(result.request + "|" + result.state);
}
console.log("pending=0");`,
      "read-1|rejected:refresh-denied\nwrite-1|rejected:refresh-denied\nread-2|rejected:refresh-denied\npending=0",
      localClientRefs.concat(["rfc9700", "whatwg-fetch"]),
    )],
    expertNotes: ["원본 callback array의 failure cleanup은 waiter rejection을 호출하지 않는 구조로 보이므로 timeout·reject path를 실제 component/network test로 재현해야 합니다."],
  }),
  appliedTopic({
    id: "browser-storage-xss-csrf",
    title: "browser storage·XSS·CSRF를 credential 접근성과 자동 첨부 모델로 함께 테스트합니다",
    lead: "JWT를 쓴다는 label로 browser threat를 결정하지 않습니다. JavaScript가 읽을 수 있는 persistent storage의 bearer credential은 같은 origin에서 실행되는 XSS에 노출되고, cookie credential은 HttpOnly로 script 접근을 줄일 수 있지만 browser 자동 첨부 때문에 CSRF 대책이 필요합니다.",
    mechanism: "Web Storage는 origin 단위 string store이며 local persistent token의 confidentiality를 제공하지 않습니다. Fetch credentials mode, cookie attributes, CSP와 output encoding, CSRF token/origin checks는 서로 다른 공격 경계를 줄이므로 storage 선택만으로 전체 해결이라고 말할 수 없습니다.",
    workflow: "credential별 storage/readability/automatic-send/lifetime table→XSS source/sink tests→CSRF simple/preflight/navigation cases→separate HTTPS origins→server state readback→logout/cleanup→residual threat 문서화를 수행합니다.",
    invariants: "untrusted script가 credential을 읽거나 재설치할 수 없도록 exposure를 최소화하고 cross-site unsafe request는 server mutation이 0이며 허용 origin/redirect는 exact policy로 검증됩니다.",
    edgeCases: "stored/reflected/DOM XSS, third-party script compromise, service worker, browser extension, form submission, SameSite exceptions, refresh cookie, CORS preflight cache, bfcache, iframe와 open redirect를 포함합니다.",
    failureModes: "persistent storage가 편리하다는 이유로 장기 refresh credential까지 두거나 CORS가 CSRF를 막는다고 믿으면 XSS theft와 cross-site mutation을 동시에 놓칩니다.",
    verification: "real browser의 attacker/victim origins, synthetic canary credential, DOM sink instrumentation, CSP reports, cookie/storage access, network raw metadata와 server-side mutation readback을 결합합니다.",
    operations: "CSP violation category, CSRF deny reason, unexpected cross-origin success, sensitive sink canary와 storage lifetime 정책 drift를 수집하되 URL/query/body/header의 credential은 제거합니다.",
    concepts: [
      c("script-readable credential", "same-origin JavaScript가 직접 읽을 수 있는 bearer material입니다.", ["XSS가 곧 credential theft가 될 수 있습니다.", "수명·권한을 최소화합니다."]),
      c("automatically attached credential", "browser가 대상 request에 애플리케이션 JavaScript의 명시적 header 구성 없이 보내는 credential입니다.", ["CSRF threat model의 핵심입니다.", "cookie policy만으로 끝내지 않습니다."]),
      c("state readback", "공격 request 뒤 server의 authoritative state가 실제로 변하지 않았음을 별도 조회로 증명하는 검증입니다.", ["status code만 믿지 않습니다.", "side-effect zero를 확인합니다."]),
    ],
    codeExamples: [node(
      "security14-browser-credential-model",
      "browser credential threat와 필수 control 매핑",
      "Security14BrowserCredentialModel.mjs",
      "storage/readability/automatic-send 속성으로 XSS·CSRF 검증 요구를 결정합니다.",
      String.raw`const models = [
  { name: "script-store", scriptReadable: true, autoSend: false },
  { name: "protected-cookie", scriptReadable: false, autoSend: true },
  { name: "memory-only", scriptReadable: true, autoSend: false },
];
for (const model of models) {
  const controls = [];
  if (model.scriptReadable) controls.push("xss+short-life");
  if (model.autoSend) controls.push("csrf+origin");
  controls.push("server-revoke");
  console.log(model.name + "|" + controls.join(","));
}`,
      "script-store|xss+short-life,server-revoke\nprotected-cookie|csrf+origin,server-revoke\nmemory-only|xss+short-life,server-revoke",
      ["local-auth-client", "owasp-html5", "owasp-session", "owasp-xss", "owasp-csrf", "whatwg-storage", "whatwg-fetch"],
    )],
    expertNotes: ["browser storage를 변경하는 제안은 UX, multi-tab, refresh와 CSRF assumptions가 함께 달라지므로 threat model과 migration test를 동시에 갱신합니다."],
  }),
  appliedTopic({
    id: "multitab-offline-clock",
    title: "multi-tab·offline·clock skew에서 session epoch와 logout 단조성을 지킵니다",
    lead: "process-local refresh lock은 다른 tab·worker를 조정하지 못합니다. 각 browsing context가 서로 다른 token version과 clock를 볼 수 있으므로 credential 본문 대신 단조 증가 session epoch, event type과 issued-at metadata만 안전한 channel로 전달합니다.",
    mechanism: "Web Storage event와 BroadcastChannel은 동일 origin contexts 사이 통신을 돕지만 전달 보장, durable queue, secret channel 또는 leader election protocol 자체가 아닙니다. offline 복귀 때 stale refresh response와 queued mutation이 최신 logout 결정을 덮어쓰지 않도록 server state와 epoch를 최종 권위로 둡니다.",
    workflow: "server session/revoke version→client epoch snapshot→leader lease or server single-use rotation→broadcast metadata→recipient monotonic compare→offline queue classification→online readback/reconciliation→stale discard 순으로 설계합니다.",
    invariants: "logout/revoke epoch는 단조 증가하고 낮은 epoch의 refresh success나 cached response가 credential을 부활시키지 않으며 credential 본문은 BroadcastChannel/storage event payload에 포함하지 않습니다.",
    edgeCases: "동시 두 tab refresh, leader crash, event loss/reordering, laptop sleep, manual clock change, offline logout, queue replay, cleared storage, bfcache restoration, service worker와 server clock skew를 포함합니다.",
    failureModes: "마지막으로 도착한 response를 무조건 저장하면 logout 뒤 늦은 refresh가 session을 부활시키고, local clock만으로 expiry를 판단하면 device skew에서 조기 logout 또는 expired credential 사용이 생깁니다.",
    verification: "두 개 이상 real browser contexts, virtual clock, network partition, event reorder/drop, refresh rotation과 server readback으로 epoch monotonicity와 no-resurrection을 검증합니다.",
    operations: "epoch mismatch, stale discard, leader turnover, offline duration, reconciliation failure와 server/client clock delta bucket을 관찰하고 per-user identifier와 credential은 수집하지 않습니다.",
    concepts: [
      c("session epoch", "login·rotation·logout·revoke 세대를 비교하는 단조 증가 식별자입니다.", ["credential 본문과 분리합니다.", "낮은 epoch 결과를 폐기합니다."]),
      c("logout monotonicity", "한 번 logout/revoke된 session generation이 늦은 비동기 결과로 다시 authenticated 상태가 되지 않는 불변식입니다.", ["multi-tab에서 검증합니다.", "server readback이 필요합니다."]),
      c("reconciliation", "offline·event loss 후 client snapshot을 server의 authoritative credential 상태와 다시 맞추는 절차입니다.", ["queued mutation을 분류합니다.", "stale state를 버립니다."]),
    ],
    codeExamples: [node(
      "security14-session-epoch",
      "multi-tab stale refresh 폐기 모델",
      "Security14SessionEpoch.mjs",
      "logout 이후 도착한 낮은 epoch refresh 결과가 session을 되살리지 못하게 합니다.",
      String.raw`let state = { epoch: 4, authenticated: true };
function apply(event) {
  if (event.epoch < state.epoch) return "discard:stale";
  if (event.type === "logout") state = { epoch: event.epoch, authenticated: false };
  if (event.type === "refresh" && state.authenticated) state = { epoch: event.epoch, authenticated: true };
  return "apply:" + event.type;
}
console.log(apply({ type: "logout", epoch: 5 }));
console.log(apply({ type: "refresh", epoch: 4 }));
console.log("epoch=" + state.epoch);
console.log("authenticated=" + state.authenticated);`,
      "apply:logout\ndiscard:stale\nepoch=5\nauthenticated=false",
      ["local-auth-client", "whatwg-storage", "whatwg-broadcast", "rfc9700"],
    )],
    expertNotes: ["BroadcastChannel과 storage event는 delivery ordering·durability를 application에 보장하지 않으므로 server revoke/readback 없는 보안 경계로 사용하지 않습니다."],
  }),
  appliedTopic({
    id: "server-revoke-readback",
    title: "server revoke·rotation·introspection을 authoritative readback으로 검증합니다",
    lead: "client가 token을 지웠다는 사실은 server credential이 더 이상 사용될 수 없다는 증명이 아닙니다. access token의 self-contained validation과 refresh record의 server state, account disable·role change·logout·theft 대응을 credential 종류별 revoke latency 계약으로 연결합니다.",
    mechanism: "RFC 7009 revocation은 authorization server의 revoke endpoint semantics를, RFC 7662 introspection은 protected resource가 token active state와 metadata를 조회하는 계약을 정의합니다. self-contained JWT는 offline verification 장점 대신 즉시 revoke가 자동 제공되지 않으므로 짧은 수명, denylist/session version, key rotation 또는 introspection의 비용·일관성 trade-off를 선택해야 합니다.",
    workflow: "credential family/identifier digest→atomic refresh rotation→old credential reuse detection→revoke decision→all verifier propagation→protected action negative probe→authoritative state/read model→audit event와 latency 측정 순으로 실행합니다.",
    invariants: "refresh rotation은 compare-and-consume 또는 transaction으로 한 번만 성공하고 revoke 후 old access/refresh credential의 protected mutation이 0이며 server readback이 inactive/denied 상태를 증명합니다.",
    edgeCases: "동시 refresh, DB commit 뒤 response loss, retry, replica lag, cache partition, account disable, role downgrade, key rotation overlap, revoked token introspection cache와 partial regional outage를 포함합니다.",
    failureModes: "refresh record를 삭제했으니 모든 access token도 즉시 무효라고 가정하거나 response status만 확인하면 stateless access credential과 cache/replica의 residual acceptance window를 놓칩니다.",
    verification: "disposable DB와 실제 server에서 double-submit, stolen-old-token replay, logout/account change, cache failure와 multi-region lag를 주입하고 affected rows, active state, protected action와 event를 readback합니다.",
    operations: "revoke decision-to-enforcement latency, old-token reuse, introspection error/cache age, affected-row anomaly와 regional skew를 관찰하고 token identifier는 keyed digest 또는 incident-scoped opaque handle만 사용합니다.",
    concepts: [
      c("authoritative revocation", "server가 credential family를 inactive로 결정하고 모든 verifier가 그 결정을 집행하는 상태입니다.", ["client deletion과 다릅니다.", "전파 지연을 측정합니다."]),
      c("refresh rotation replay detection", "이미 소비된 refresh credential이 다시 제시될 때 credential family 탈취 가능성으로 식별하는 control입니다.", ["atomic consume가 필요합니다.", "family-wide containment를 고려합니다."]),
      c("sender constraint", "token 사용자가 발급 시 결합된 key의 소유를 request마다 증명하게 해 탈취 bearer token의 재사용 범위를 줄이는 방식입니다.", ["DPoP가 한 예입니다.", "authorization을 대체하지 않습니다."]),
    ],
    codeExamples: [node(
      "security14-revoke-readback",
      "rotation·revoke 후 protected action readback",
      "Security14RevokeReadback.mjs",
      "credential family state와 verifier version을 사용해 revoke 전파 여부를 결정합니다.",
      String.raw`const family = { version: 7, active: true, consumedRefresh: new Set() };
function rotate(id) {
  if (!family.active || family.consumedRefresh.has(id)) return "deny:replay";
  family.consumedRefresh.add(id);
  family.version += 1;
  return "rotated:v" + family.version;
}
console.log(rotate("synthetic-a"));
console.log(rotate("synthetic-a"));
family.active = false;
const action = family.active ? "allow" : "deny:revoked";
console.log("protected-action=" + action);
console.log("readback-active=" + family.active);`,
      "rotated:v8\ndeny:replay\nprotected-action=deny:revoked\nreadback-active=false",
      ["local-members-controller", "rfc7009", "rfc7662", "rfc9449", "rfc9700"],
    )],
    expertNotes: ["DPoP는 token replay 위험을 줄이지만 key theft, XSS가 proof 생성 API를 호출하는 위험, nonce/replay cache와 일반 authorization 검증을 없애지 않습니다."],
  }),
  appliedTopic({
    id: "secret-safe-evidence",
    title: "trace·screenshot·log·test artifact를 secret-safe evidence로 설계합니다",
    lead: "보안 test가 token theft를 재현하면서 실제 token을 console, network archive, CI stdout, screenshot, video, exception, assertion diff나 issue attachment에 남기면 검증 자체가 새로운 사고가 됩니다. synthetic canary와 sink별 allow/deny schema로 evidence를 설계합니다.",
    mechanism: "현재 server snapshot에는 raw request header·derived token과 refresh credential이 logging call 인자로 전달되는 경로가 있습니다. log level이나 collector 설정으로 우연히 안 보일 수 있다는 기대 대신 source에서 인자를 제거하고 structured reason code, incident-scoped correlation과 credential-free state transition만 남겨야 합니다.",
    workflow: "sink inventory→data classification→source-level removal→central sanitizer→structured allowlist→synthetic canary injection→logs/traces/screenshots/videos/reports/archive scan→retention/purge readback→review gate 순으로 수행합니다.",
    invariants: "raw Authorization field, JWT segments, refresh credential, signing/config secret, storage dump와 user/provider/domain values가 모든 evidence sinks에서 0이며 redaction failure는 test failure와 incident trigger가 됩니다.",
    edgeCases: "multiline header, encoded token, exception message, request object toString, debug logging, proxy/APM capture, HAR, screenshot tooltip, CI retry artifact, crash dump, backup, downstream SIEM와 support export를 포함합니다.",
    failureModes: "문자열 일부만 마스킹하면 길이·prefix나 encoded copy가 남고 application log만 검사하면 reverse proxy, APM, CI와 browser artifact의 복제본을 놓칩니다.",
    verification: "실제 값과 형태만 비슷한 synthetic canary를 모든 source/sink 경로에 넣고 exact, encoded, split, case 변형 탐지를 실행하며 sanitizer failure와 purge/readback을 독립 검사합니다.",
    operations: "sensitive-canary findings, sink/revision, sanitizer bypass, retention breach와 purge completion만 수집하고 offending raw payload는 alert나 ticket에 다시 첨부하지 않습니다.",
    concepts: [
      c("secret-safe evidence", "보안 결론을 재현할 수 있지만 credential·PII·private endpoint를 포함하지 않는 logs, traces와 artifacts입니다.", ["구조와 digest를 사용합니다.", "sink별 scan을 통과해야 합니다."]),
      c("allowlist telemetry", "기록 가능한 field와 bounded values를 먼저 정의하고 나머지는 기본 거부하는 관측 계약입니다.", ["redaction보다 강한 기본값입니다.", "schema revision을 관리합니다."]),
      c("synthetic secret canary", "실제 credential이 아니지만 유출 sink를 탐지하기 위한 고유 test marker입니다.", ["production secret을 쓰지 않습니다.", "발견 시 pipeline을 차단합니다."]),
    ],
    codeExamples: [node(
      "security14-secret-safe-evidence",
      "credential-like data를 제거하는 allowlist evidence",
      "Security14SecretSafeEvidence.mjs",
      "raw request 대신 승인된 event fields만 내보내고 recursive sink scan 결과를 판정합니다.",
      String.raw`const raw = {
  event: "refresh-failed",
  reason: "expired",
  credential: "synthetic-canary-never-real",
  header: "synthetic-header-never-real",
  route: "private-route-value",
};
const safe = { event: raw.event, reason: raw.reason, credentialPresent: Boolean(raw.credential) };
const serialized = JSON.stringify(safe);
const forbidden = ["synthetic-canary-never-real", "synthetic-header-never-real", "private-route-value"];
console.log(serialized);
console.log("forbidden-findings=" + forbidden.filter((value) => serialized.includes(value)).length);
console.log("safe-fields=" + Object.keys(safe).sort().join(","));`,
      "{\"event\":\"refresh-failed\",\"reason\":\"expired\",\"credentialPresent\":true}\nforbidden-findings=0\nsafe-fields=credentialPresent,event,reason",
      localServerRefs.concat(["local-application-yaml", "owasp-logging", "owasp-secrets"]),
    )],
    expertNotes: ["과제에 알려진 YAML credential 위험은 scalar 값을 열람·복제하지 않고 rotation·purge 대상이라는 control fact로만 다룹니다."],
  }),
  appliedTopic({
    id: "token-theft-incident",
    title: "token theft를 detect·contain·revoke·rotate·recover하는 시간축으로 훈련합니다",
    lead: "raw credential logging, browser theft canary, refresh replay나 impossible session sequence가 보이면 먼저 실제 값을 모으는 대신 affected credential class, issuance window, scopes/resources, verifier population과 sink replication 범위를 보수적으로 정합니다.",
    mechanism: "NIST SP 800-61 Rev.3의 incident response를 준비·탐지·대응·복구와 지속 개선에 통합하고 token별 containment를 분리합니다. 로그 수집 중지, vulnerable build 차단, refresh family revoke, access-token enforcement, signing key rotation, session/user notification과 evidence purge는 순서와 blast radius가 다릅니다.",
    workflow: "declare/severity→unsafe sink stop→immutable secret-safe evidence→exposure window/credential family scope→revoke/deny deployment→key or credential rotation→protected action negative readback→sink purge→user/service recovery→lessons/control tests 순서로 진행합니다.",
    invariants: "containment 중 새 raw credential 복제가 중단되고 affected credentials는 목표 SLO 안에 모든 verifier에서 거부되며 rotation 뒤 old/new key overlap이 의도한 범위이고 recovery가 revoke를 되돌리지 않습니다.",
    edgeCases: "불명확한 first exposure, shared signing key, long-lived access token, unavailable revoke store, regional partition, logging vendor backup, offline client, privileged token, false positive와 attacker refresh replay를 포함합니다.",
    failureModes: "코드에서 로그 한 줄만 지우고 배포하면 이미 복제된 sinks와 유효 credential은 남고, signing key를 즉시 제거하면 모든 세션과 서비스가 동시에 실패해 사고 영향을 확대할 수 있습니다.",
    verification: "tabletop과 disposable environment에서 detection-to-declaration, collection stop, revoke latency, old credential negative probes, new credential canary, key overlap, sink purge/readback과 rollback 금지 조건을 측정합니다.",
    operations: "MTTD/MTTC/revoke latency, affected verifier coverage, old credential acceptance, purge completion, recovery error와 residual exposure를 incident timeline에 남기며 raw credential은 저장하지 않습니다.",
    concepts: [
      c("containment boundary", "공격자가 더 이상 credential을 획득·갱신·사용하지 못하게 우선 차단하는 시스템 범위입니다.", ["source와 sinks를 함께 막습니다.", "복구보다 먼저 검증합니다."]),
      c("credential exposure window", "credential이 unauthorized sink에 처음 도달했을 가능성부터 모든 사용 가능성이 제거될 때까지의 보수적 시간 범위입니다.", ["불명확하면 넓게 잡습니다.", "issuance records와 연결합니다."]),
      c("negative incident readback", "old credential로 각 protected surface를 실제 호출해 모두 거부되고 side effect가 없음을 확인하는 사고 종료 근거입니다.", ["revoke API 성공과 다릅니다.", "regions/caches를 포함합니다."]),
    ],
    codeExamples: [node(
      "security14-theft-incident-gate",
      "token theft containment 종료 gate",
      "Security14TheftIncidentGate.mjs",
      "revoke·rotation·sink 중지·purge·negative readback이 모두 충족될 때만 containment 완료로 판정합니다.",
      String.raw`const evidence = {
  unsafeCollectionStopped: true,
  refreshFamiliesRevoked: true,
  accessEnforcementCovered: 3,
  accessEnforcementExpected: 3,
  oldCredentialAccepts: 0,
  rotatedCredentialHealthy: true,
  sinkPurgeVerified: true,
};
for (const [key, value] of Object.entries(evidence)) console.log(key + "=" + value);
const pass = evidence.unsafeCollectionStopped &&
  evidence.refreshFamiliesRevoked &&
  evidence.accessEnforcementCovered === evidence.accessEnforcementExpected &&
  evidence.oldCredentialAccepts === 0 &&
  evidence.rotatedCredentialHealthy &&
  evidence.sinkPurgeVerified;
console.log("containment=" + (pass ? "verified" : "open"));`,
      "unsafeCollectionStopped=true\nrefreshFamiliesRevoked=true\naccessEnforcementCovered=3\naccessEnforcementExpected=3\noldCredentialAccepts=0\nrotatedCredentialHealthy=true\nsinkPurgeVerified=true\ncontainment=verified",
      ["local-jwt-filter", "local-members-controller", "rfc7009", "rfc7662", "nist-incident", "owasp-logging"],
    )],
    expertNotes: ["raw credential logging의 운영 노출 여부를 알 수 없더라도 source sink가 확인되면 collection 중지와 exposure assessment를 시작하고 실제 log 값을 검색 결과에 출력하지 않습니다."],
  }),
  appliedTopic({
    id: "configuration-credential-incident",
    title: "known configuration credential를 rotate·purge·provenance 개선으로 복구합니다",
    lead: "application YAML에 알려진 weather-service credential이 hardcoded되었다는 입력은 값을 다시 읽어 확인할 이유가 없습니다. 노출되었다고 가정하고 provider-side rotation, repository/history/artifact/cache/CI/log 복제 범위 조사와 environment/secret-manager indirection으로 전환합니다.",
    mechanism: "credential 문자열 삭제만으로 이미 clone, commit history, build artifact, container layer와 backup에 남은 사용 권한이 사라지지 않습니다. 새 credential 발급과 least privilege, old credential disable, consumers canary migration, secret scanning 및 provenance/readback을 하나의 incident로 다룹니다.",
    workflow: "incident declare→provider access/usage telemetry 보존→new scoped credential 생성→approved secret store→dual-read 또는 staged consumer canary→old credential disable→negative old-handle probe→history/artifact/sink purge→scanner/readback→postincident 순서로 수행합니다.",
    invariants: "문서·command·ticket·test·terminal output에 old/new credential 값이 한 번도 나타나지 않고 consumer는 approved secret reference만 사용하며 old credential은 provider에서 inactive이고 repository/artifact scan findings가 0입니다.",
    edgeCases: "provider가 overlap을 지원하지 않음, shared consumers, unknown owner, cached configuration, container rollback, fork/archive, CI debug output, rate limit, third-party backup와 emergency restore를 포함합니다.",
    failureModes: "YAML을 환경변수로 바꾼 것만으로 해결했다고 판단하면 old credential은 계속 유효하고 history/artifacts의 복제본과 배포된 old container가 재노출합니다.",
    verification: "credential 값을 취급하지 않는 opaque handle로 provider state, consumer revision, last-use bucket, old-handle denial, new-handle canary, secret scan와 artifact provenance를 readback합니다.",
    operations: "credential owner, scope, age bucket, last-rotation, consumer coverage, old-handle accepts와 scanner findings를 관리하고 provider response/body나 secret reference resolution 결과는 기록하지 않습니다.",
    concepts: [
      c("opaque credential handle", "실제 secret을 노출하지 않고 rotation 작업과 상태를 추적하는 incident-scoped 식별자입니다.", ["값으로 되돌릴 수 없어야 합니다.", "provider/readback과 연결합니다."]),
      c("credential provenance", "credential이 생성·보관·주입·소비·회전·폐기되는 승인된 경로와 artifact revision 기록입니다.", ["unknown copies를 줄입니다.", "owner를 명시합니다."]),
      c("purge readback", "repository, history, build artifact, logs, caches와 backups에서 금지 pattern이 제거되었는지 독립 scanner와 retention system으로 확인하는 절차입니다.", ["삭제 명령 성공과 다릅니다.", "복구본도 고려합니다."]),
    ],
    codeExamples: [node(
      "security14-config-credential-rotation",
      "값 없는 credential rotation state machine",
      "Security14ConfigCredentialRotation.mjs",
      "opaque old/new handles만으로 canary, disable, purge와 readback 순서를 검사합니다.",
      String.raw`const steps = [
  ["new-handle-provisioned", true],
  ["consumer-canary-healthy", true],
  ["old-handle-disabled", true],
  ["old-handle-accepts", 0],
  ["artifact-findings", 0],
  ["purge-readback", true],
];
for (const [name, value] of steps) console.log(name + "=" + value);
const pass = steps.every(([name, value]) =>
  name.endsWith("accepts") || name.endsWith("findings") ? value === 0 : value === true);
console.log("credential-incident=" + (pass ? "recovered" : "open"));`,
      "new-handle-provisioned=true\nconsumer-canary-healthy=true\nold-handle-disabled=true\nold-handle-accepts=0\nartifact-findings=0\npurge-readback=true\ncredential-incident=recovered",
      ["local-application-yaml", "owasp-secrets", "nist-incident", "nist-ssdf"],
    )],
    expertNotes: ["이 장과 source evidence는 알려진 weather credential의 실제 scalar를 읽거나 기록하지 않으며, 값이 아니라 노출 가정과 control/readback만 다룹니다."],
  }),
  appliedTopic({
    id: "token-security-release-postincident",
    title: "token controls를 canary·rollback·postincident learning으로 지속 검증합니다",
    lead: "token storage, refresh coordinator, verifier rules, revoke store, logging schema와 key/config injection을 동시에 바꾸는 big-bang 배포는 client 세대·in-flight credential·cache·region 불일치를 키웁니다. compatibility window와 security stop condition을 가진 작은 canary로 전환합니다.",
    mechanism: "security rollback은 단순히 이전 binary로 돌아가는 일이 아닙니다. 이전 build가 raw credential logging이나 취약 storage를 되살리면 rollback forbidden이며, credential/key rotation·DB schema·session epoch는 코드 rollback 뒤에도 forward-only reconciliation이 필요합니다.",
    workflow: "immutable artifact/SBOM→threat-to-test gate→shadow validation→synthetic users/credentials canary→old/new client and verifier matrix→bounded production cohort→security/availability readback→expand/hold/roll-forward-safe rollback→postincident action verification 순서입니다.",
    invariants: "unknown/invalid/revoked token의 unexpected allow와 sensitive sink finding은 0이고 all-waiters-settled, revoke SLO, old/new compatibility와 recovery drill이 통과해야 확대하며 credential exposure를 되살리는 artifact로 rollback하지 않습니다.",
    edgeCases: "old SPA cache, partial DB migration, rotated key overlap, offline client, regional skew, telemetry outage, false-positive secret scanner, rollback during incident, provider outage와 action owner 이탈을 포함합니다.",
    failureModes: "error rate만 보고 canary를 확대하면 rare authorization bypass와 secret leak를 놓치고, postmortem action을 issue 생성으로 끝내면 동일 sink와 waiter leak가 재발합니다.",
    verification: "release마다 synthetic invalid/revoked/replay/concurrency/XSS/CSRF cases, canary protected-action readback, sink scans, rollback rehearsal, reconciliation와 postincident regression tests를 실행합니다.",
    operations: "unexpected allow, credential sink findings, refresh pending, revoke latency, old/new skew, rollback safety와 overdue action evidence를 dashboard/alert/owner에 연결합니다.",
    concepts: [
      c("security canary", "작은 cohort와 synthetic credentials에서 allow/deny·secret-safe evidence·recovery invariants를 먼저 검증하는 배포 단계입니다.", ["가용성 지표만 보지 않습니다.", "확대 조건을 수치화합니다."]),
      c("roll-forward-safe rollback", "취약 credential behavior를 되살리지 않으면서 binary를 되돌리고 forward-only credential/schema state를 reconciliation하는 복구 전략입니다.", ["금지 rollback을 정의합니다.", "drill로 검증합니다."]),
      c("postincident evidence closure", "사고 교훈의 각 action이 code, test, telemetry, runbook과 재현 가능한 readback으로 실제 완료됐음을 확인하는 과정입니다.", ["ticket close와 다릅니다.", "효과를 재검증합니다."]),
    ],
    codeExamples: [node(
      "security14-release-gate",
      "token security canary와 rollback 안전성 gate",
      "Security14ReleaseGate.mjs",
      "availability와 보안 hard invariants를 함께 평가하고 취약 artifact rollback을 차단합니다.",
      String.raw`const gate = {
  testsPassed: true,
  unexpectedAllows: 0,
  secretFindings: 0,
  pendingWaiters: 0,
  revokeP95Seconds: 18,
  revokeBudgetSeconds: 30,
  canaryHealthy: true,
  previousArtifactSafe: false,
  reconciliationReady: true,
  incidentActionsVerified: true,
};
const expand = gate.testsPassed && gate.unexpectedAllows === 0 && gate.secretFindings === 0 &&
  gate.pendingWaiters === 0 && gate.revokeP95Seconds <= gate.revokeBudgetSeconds &&
  gate.canaryHealthy && gate.reconciliationReady && gate.incidentActionsVerified;
console.log("expand=" + expand);
console.log("rollback-previous=" + (gate.previousArtifactSafe ? "allowed" : "forbidden"));
console.log("reconciliation-ready=" + gate.reconciliationReady);
console.log("hard-findings=" + (gate.unexpectedAllows + gate.secretFindings));`,
      "expand=true\nrollback-previous=forbidden\nreconciliation-ready=true\nhard-findings=0",
      ["rfc9700", "rfc8725", "rfc9449", "owasp-asvs", "nist-incident", "nist-ssdf"],
    )],
    expertNotes: ["이 세션의 release gate는 다음 capstone에서 architecture·build·test·incident portfolio evidence와 통합됩니다."],
  }),
];

const sources: SessionSource[] = [
  {
    id: "local-auth-client",
    repository: "D:/dev/my-app03",
    path: "src/api/Auth.jsx",
    usedFor: ["browser storage/request interceptor/refresh coordinator sanitized audit", "concurrency·multi-tab·logout test gap"],
    evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 token, storage key, route, user, provider, domain 값은 복사하지 않았습니다.",
  },
  {
    id: "local-jwt-filter",
    repository: "D:/dev/2026-myproject04-cicd",
    path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java",
    usedFor: ["JWT request filter/context/failure sanitized audit", "raw header/token logging incident risk"],
    evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. Logging call에 raw header와 derived token이 전달되는 구조만 확인했으며 어떤 credential 값도 읽거나 복사하지 않았습니다.",
  },
  {
    id: "local-jwt-util",
    repository: "D:/dev/2026-myproject04-cicd",
    path: "src/main/java/com/study/myproject02/common/jwt/JwtUtil.java",
    usedFor: ["JWT issue/sign/parse/time-claim sanitized audit", "deterministic negative fixture design"],
    evidence: "2026-07-14 read-only sanitized audit: 76 lines, 2,817 bytes, SHA-256 305E21E9D9E251BA7B402BB275C951BBC021F6FB270D6895926AF0CBEFB1AF1D. 실제 subject, token과 signing secret 값은 복사하지 않았습니다.",
  },
  {
    id: "local-members-controller",
    repository: "D:/dev/2026-myproject04-cicd",
    path: "src/main/java/com/study/myproject02/members/controller/MembersController.java",
    usedFor: ["refresh persistence/rotation/logout sanitized audit", "raw refresh credential logging and revoke/readback risk"],
    evidence: "2026-07-14 read-only sanitized audit: 514 lines, 21,038 bytes, SHA-256 72F5F59FCF79C94CDA20546FA25634AE2C8C8F47C43953B45263E07CF3BB246D. 실제 route, token, user, provider, domain 값은 복사하지 않았습니다.",
  },
  {
    id: "local-jwt-config",
    repository: "D:/dev/2026-myproject04-cicd",
    path: "src/main/java/com/study/myproject02/common/jwt/JwtConfig.java",
    usedFor: ["JWT configuration binding/key and lifetime boundary audit"],
    evidence: "2026-07-14 read-only sanitized audit: 24 lines, 689 bytes, SHA-256 018CA97DE544B68571CF48E58BB737BF259040A5E22E5768D69E43F91BD4B5DD. property names와 secret 값은 공개 content에 복사하지 않았습니다.",
  },
  {
    id: "local-application-yaml",
    repository: "D:/dev/2026-myproject04-cicd",
    path: "src/main/resources/application.yaml",
    usedFor: ["configuration provenance snapshot", "known weather credential rotation/purge incident control"],
    evidence: "2026-07-14 metadata/hash-only audit: 41 lines, 1,067 bytes, SHA-256 0D261E132D271707DA4B3285B1B09B3142CC6ECC92B403368213F7A1C76FCEC8. 과제에서 알려진 hardcoded weather credential은 exposed로 가정했으며 scalar를 열람·출력·복제하지 않았습니다.",
  },
  {
    id: "rfc9700",
    repository: "IETF RFC 9700",
    path: "rfc9700.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc9700.html",
    usedFor: ["OAuth token replay/refresh protection/security BCP", "browser and release threat model"],
    evidence: "2025-01 발행된 OAuth 2.0 Security Best Current Practice 공식 RFC입니다.",
  },
  {
    id: "rfc8725",
    repository: "IETF RFC 8725",
    path: "rfc8725.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc8725.html",
    usedFor: ["JWT algorithm/key/claim validation best current practice"],
    evidence: "JSON Web Token Best Current Practices 공식 RFC입니다.",
  },
  {
    id: "rfc7519",
    repository: "IETF RFC 7519",
    path: "rfc7519.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc7519.html",
    usedFor: ["JWT structure and registered claims"],
    evidence: "JSON Web Token 표준 공식 RFC입니다.",
  },
  {
    id: "rfc7009",
    repository: "IETF RFC 7009",
    path: "rfc7009.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc7009.html",
    usedFor: ["OAuth token revocation semantics"],
    evidence: "OAuth 2.0 Token Revocation 공식 RFC입니다.",
  },
  {
    id: "rfc7662",
    repository: "IETF RFC 7662",
    path: "rfc7662.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc7662.html",
    usedFor: ["token active-state introspection/readback"],
    evidence: "OAuth 2.0 Token Introspection 공식 RFC입니다.",
  },
  {
    id: "rfc9449",
    repository: "IETF RFC 9449",
    path: "rfc9449.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc9449.html",
    usedFor: ["DPoP sender-constrained access token and replay reduction"],
    evidence: "OAuth 2.0 Demonstrating Proof of Possession 공식 RFC입니다.",
  },
  {
    id: "owasp-html5",
    repository: "OWASP Cheat Sheet Series",
    path: "HTML5_Security_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html",
    usedFor: ["browser client-side storage and messaging security"],
    evidence: "OWASP 공식 HTML5 Security Cheat Sheet입니다.",
  },
  {
    id: "owasp-session",
    repository: "OWASP Cheat Sheet Series",
    path: "Session_Management_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
    usedFor: ["session identifier lifecycle/storage/logging protection"],
    evidence: "OWASP 공식 Session Management Cheat Sheet입니다.",
  },
  {
    id: "owasp-logging",
    repository: "OWASP Cheat Sheet Series",
    path: "Logging_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
    usedFor: ["credential-safe logging, incident evidence and sink protection"],
    evidence: "OWASP 공식 Logging Cheat Sheet입니다.",
  },
  {
    id: "owasp-secrets",
    repository: "OWASP Cheat Sheet Series",
    path: "Secrets_Management_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
    usedFor: ["configuration credential lifecycle/rotation/provenance"],
    evidence: "OWASP 공식 Secrets Management Cheat Sheet입니다.",
  },
  {
    id: "owasp-xss",
    repository: "OWASP Cheat Sheet Series",
    path: "Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
    usedFor: ["XSS prevention and script-readable token threat"],
    evidence: "OWASP 공식 Cross Site Scripting Prevention Cheat Sheet입니다.",
  },
  {
    id: "owasp-csrf",
    repository: "OWASP Cheat Sheet Series",
    path: "Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
    usedFor: ["automatically attached credential and CSRF defense"],
    evidence: "OWASP 공식 CSRF Prevention Cheat Sheet입니다.",
  },
  {
    id: "owasp-asvs",
    repository: "OWASP ASVS",
    path: "www-project-application-security-verification-standard",
    publicUrl: "https://owasp.org/www-project-application-security-verification-standard/",
    usedFor: ["token security verification and release control framework"],
    evidence: "OWASP 공식 Application Security Verification Standard project입니다.",
  },
  {
    id: "whatwg-fetch",
    repository: "WHATWG Fetch Standard",
    path: "",
    publicUrl: "https://fetch.spec.whatwg.org/",
    usedFor: ["fetch credentials/network error/abort behavior"],
    evidence: "WHATWG Living Standard의 Fetch specification입니다.",
  },
  {
    id: "whatwg-storage",
    repository: "WHATWG HTML Living Standard",
    path: "webstorage.html",
    publicUrl: "https://html.spec.whatwg.org/multipage/webstorage.html",
    usedFor: ["Web Storage API and storage event behavior"],
    evidence: "WHATWG HTML Living Standard의 Web Storage section입니다.",
  },
  {
    id: "whatwg-broadcast",
    repository: "WHATWG HTML Living Standard",
    path: "web-messaging.html#broadcasting-to-other-browsing-contexts",
    publicUrl: "https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts",
    usedFor: ["BroadcastChannel cross-context communication contract"],
    evidence: "WHATWG HTML Living Standard의 BroadcastChannel section입니다.",
  },
  {
    id: "nist-incident",
    repository: "NIST SP 800-61 Rev.3",
    path: "sp/800/61/r3/final",
    publicUrl: "https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    usedFor: ["credential incident preparation/detection/response/recovery/postincident"],
    evidence: "2025-04 발행된 NIST 공식 Incident Response Recommendations and Considerations for Cybersecurity Risk Management입니다.",
  },
  {
    id: "nist-ssdf",
    repository: "NIST SP 800-218",
    path: "sp/800/218/final",
    publicUrl: "https://csrc.nist.gov/pubs/sp/800/218/final",
    usedFor: ["secure build provenance, release evidence and vulnerability response"],
    evidence: "NIST 공식 Secure Software Development Framework publication입니다.",
  },
];

const session = createExpertSession({
  inventoryId: "security-14-token-testing-incident",
  slug: "security-14-token-testing-incident",
  courseId: "devops",
  moduleId: "token-client-integration",
  order: 6,
  title: "token security testing·theft incident recovery",
  subtitle: "JWT fixture와 refresh concurrency부터 browser·multi-tab·server revoke, secret-safe evidence, token/config credential 사고, canary·rollback까지 검증합니다.",
  level: "전문가",
  estimatedMinutes: 195,
  coreQuestion: "token 정상 동작을 어떻게 공격·동시성·browser·revoke·유출 사고까지 견디는 executable evidence와 복구 가능한 운영 계약으로 바꿀까요?",
  summary: "React Auth client와 Spring JWT filter·utility·configuration·controller·YAML 여섯 snapshot을 read-only·sanitized audit합니다. 실제 token, storage key, route, user, provider, domain, secret 값은 복제하지 않습니다. 관찰된 raw header/token/refresh credential logging sink와 과제에서 알려진 hardcoded weather credential을 credential incidents로 다루고, deterministic clock/crypto-negative JWT fixtures, refresh single-flight와 waiter settlement, XSS/CSRF/storage, multi-tab/offline session epoch, server revoke/introspection/readback, secret-safe artifacts, detect/contain/revoke/rotate/purge, security canary와 roll-forward-safe rollback을 IETF·OWASP·WHATWG·NIST 근거 및 열 개의 executable models로 연결합니다.",
  objectives: [
    "sanitized source audit를 token threat·test·incident matrix로 전환한다.",
    "clock·key·claims가 결정적인 JWT positive/negative fixture를 설계한다.",
    "refresh concurrency에서 single-flight·bounded waiters·replay eligibility를 검증한다.",
    "browser storage, XSS, CSRF와 state readback을 하나의 credential model로 분석한다.",
    "multi-tab·offline·clock skew에서 logout monotonicity를 증명한다.",
    "server rotation·revoke·introspection과 protected-action readback을 검증한다.",
    "logs·traces·screenshots·test artifacts에서 credential exposure를 차단한다.",
    "token theft를 detect·contain·revoke·rotate·recover하는 incident drill을 수행한다.",
    "known configuration credential을 값 없이 rotate·purge·readback한다.",
    "token controls를 security canary, rollback과 postincident evidence로 운영한다.",
  ],
  prerequisites: [{
    title: "logout·revocation·multi-tab lifecycle",
    reason: "client cleanup과 server revoke, refresh rotation, session generation 및 cross-context logout의 차이를 알아야 token test와 theft recovery의 authoritative state/readback을 설계할 수 있습니다.",
    sessionSlug: "security-13-logout-revocation",
  }],
  keywords: ["JWT testing", "refresh concurrency", "waiter leak", "token replay", "XSS", "CSRF", "Web Storage", "BroadcastChannel", "revocation", "introspection", "DPoP", "secret-safe logging", "token theft", "credential rotation", "NIST incident response", "canary", "rollback"],
  topics,
  lab: {
    title: "token theft와 refresh race를 값 없는 evidence로 탐지·차단·복구하기",
    scenario: "원본 여섯 files는 변경하지 않고 synthetic users, ephemeral keys와 disposable browser/server/DB/log sinks에서 정상, malformed, concurrent, XSS/CSRF, multi-tab, offline, revoke, credential leak와 rollback 전 과정을 실행합니다.",
    setup: [
      "Node.js 20+ deterministic models와 fake clock/fault scheduler",
      "ephemeral JWT test keys와 synthetic claims only",
      "두 개 이상 isolated HTTPS browser contexts와 attacker origin",
      "disposable Spring-compatible API, refresh store와 protected resource",
      "network partition, cache/replica lag와 clock-skew injectors",
      "structured log/trace/APM/CI/screenshot artifact sinks",
      "synthetic secret canaries와 recursive scanner",
      "immutable secret-safe evidence manifest",
      "원본 여섯 files read-only/hash-locked",
    ],
    steps: [
      "원본 line·byte·SHA와 git status를 고정하고 값 없는 credential lifecycle/threat/test matrix를 만듭니다.",
      "frozen clock와 ephemeral key로 valid, malformed, signature, type, audience와 time-boundary token corpus를 실행합니다.",
      "동시 인증 실패 burst에 refresh success/deny/timeout/abort/logout를 주입하고 모든 waiter settlement와 replay eligibility를 검사합니다.",
      "separate origins에서 storage 접근, XSS canary, CSRF simple/preflight requests와 authoritative mutation readback을 검증합니다.",
      "두 tab, event reorder/drop, offline/sleep와 clock skew에서 session epoch와 logout no-resurrection을 확인합니다.",
      "refresh double-submit/replay, logout/account change와 revoke store/cache failure 뒤 old credential protected-action denial을 readback합니다.",
      "raw credential logging 구조를 제거한 target sink를 구성하고 synthetic canary가 logs, traces, screenshots, CI와 archives에서 0인지 scan합니다.",
      "token theft tabletop에서 collection stop, family revoke, access enforcement, rotation, regional negative probes와 sink purge를 시간 측정합니다.",
      "알려진 config credential을 값 없이 opaque handle로 new canary→old disable→artifact/history purge→provider readback합니다.",
      "old/new client·verifier canary와 rollback rehearsal를 수행하고 취약 artifact rollback 금지 및 reconciliation을 검증합니다.",
      "postincident actions를 regression tests, telemetry, runbook, owner와 evidence expiry에 연결하고 원본 hash/status unchanged를 확인합니다.",
    ],
    expectedResult: [
      "모든 token negative fixture가 stable reject reason과 principal/side-effect zero를 보입니다.",
      "refresh의 모든 concurrent waiter가 bounded time 안에 settle되고 unsafe replay와 logout resurrection이 없습니다.",
      "XSS/CSRF/multi-tab/offline cases에서 credential exposure와 unauthorized server mutation이 0입니다.",
      "revoke·rotation 뒤 old access/refresh credentials가 모든 검증 surface에서 거부되고 readback이 inactive를 증명합니다.",
      "logs, traces, screenshots, reports와 artifacts의 synthetic sensitive findings가 0입니다.",
      "token/config credential incidents가 verified containment, rotation, purge, recovery와 postincident closure로 끝납니다.",
      "security canary가 hard findings 0, revoke SLO와 compatibility를 만족하고 안전하지 않은 rollback을 차단합니다.",
    ],
    cleanup: [
      "ephemeral keys, synthetic credentials, users, sessions, refresh records와 disposable DB를 폐기합니다.",
      "browser contexts, workers/channels, interceptors, timers, queues, network faults와 caches를 종료합니다.",
      "logs, traces, screenshots, videos, CI reports와 archives를 재scan한 뒤 retention policy에 따라 삭제합니다.",
      "incident/rotation/release artifacts에는 값 없는 state, digest와 result만 보존합니다.",
      "provider/config simulation의 old/new opaque handles를 폐기하고 실제 credential을 다루지 않았음을 확인합니다.",
      "원본 여섯 files의 exact hashes와 git status가 시작 snapshot과 같은지 확인합니다.",
    ],
    extensions: [
      "JWT resource server library와 asymmetric rotating keys로 custom verifier migration을 qualification합니다.",
      "DPoP proof nonce·replay cache·key loss를 실제 compatible client/server에서 검증합니다.",
      "regional revoke propagation과 chaos drill을 SLO dashboard에 연결합니다.",
      "secret scanner를 pre-commit, CI, artifact registry와 observability ingestion gate에 통합합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "열 개 Node models를 실행하고 threat, fixture, concurrency, browser, multi-tab, revoke, evidence, theft, config rotation과 release evidence에 연결하세요.",
      requirements: ["stdout 완전 일치", "raw value 0", "각 model의 적용 한계", "actual browser/server integration test 계획"],
      hints: ["Node models는 JWT cryptography, browser policy, network, Spring filter, database와 provider revoke system을 대체하지 않습니다."],
      expectedOutcome: "각 model이 지키는 불변식과 production-like evidence가 추가로 필요한 이유를 설명합니다.",
      solutionOutline: ["source threat→deterministic negative→concurrency/browser/distribution→authoritative revoke→secret-safe incident→release 순서로 연결합니다."],
    },
    {
      difficulty: "응용",
      prompt: "refresh failure waiter leak와 raw credential logging을 동시에 발견한 incident를 재현하고 복구하세요.",
      requirements: ["bounded waiter reject", "unsafe replay block", "collection stop", "refresh family revoke", "access enforcement", "sink purge", "old credential negative readback", "canary/rollback"],
      hints: ["대기열을 비운 사실과 Promise settlement, 소스 로그 제거와 이미 복제된 sink purge를 각각 다른 evidence로 증명하세요."],
      expectedOutcome: "가용성 leak와 credential theft risk를 함께 차단하면서 session을 안전하게 복구합니다.",
      solutionOutline: ["reproduce→stop sinks→settle waiters→revoke/rotate→purge/readback→canary→postincident regression 순서입니다."],
    },
    {
      difficulty: "설계",
      prompt: "조직 공통 token security testing·incident readiness 표준을 작성하세요.",
      requirements: ["threat matrix", "crypto/clock fixtures", "concurrency/replay", "XSS/CSRF/storage", "multi-tab/offline", "revoke/readback", "secret-safe evidence", "incident/config rotation", "canary/rollback", "owners/SLO"],
      hints: ["token format checklist가 아니라 lifecycle의 hard invariants, negative tests와 recovery evidence를 중심으로 작성하세요."],
      expectedOutcome: "여러 SPA/API가 동일한 token 검증 rigor와 사고 복구 기준을 사용합니다.",
      solutionOutline: ["credential classes/boundaries→tests/evidence→operational SLO→incident drills→release/postincident closure 순서입니다."],
    },
  ],
  nextSessions: ["security-15-token-security-capstone"],
  sources,
  sourceCoverage: {
    filesRead: 6,
    filesUsed: 6,
    uncoveredNotes: [
      "실제 token, JWT header payload, refresh credential, storage key, route, user, provider, domain, configuration property와 secret 값은 content, examples, source evidence와 검증 output에 복사하지 않았습니다.",
      "JwtRequestFilter의 raw request header/derived token logging과 MembersController의 refresh credential logging은 값 없이 credential disclosure incident risk로 분류했습니다. 운영 노출 가능성이 있다면 즉시 collection 중지, affected credentials revoke/rotate, sinks containment/purge와 negative readback이 필요합니다.",
      "application.yaml의 알려진 hardcoded weather credential은 과제에서 제공된 incident fact로만 사용하고 scalar를 열람하거나 기록하지 않았습니다. exposed로 가정해 provider rotation, old credential disable, history/artifact/sink purge와 readback이 필요합니다.",
      "client의 process-local refresh lock/callback array는 multi-tab coordination을 제공하지 않고 failure에서 array reset만으로 waiters가 reject되지 않으므로 pending Promise leak, replay와 logout resurrection을 actual integration test로 검증해야 합니다.",
      "현재 server refresh persistence/rotation과 client interceptor 동작을 RFC 7009 revocation endpoint, RFC 7662 introspection 또는 RFC 9449 DPoP의 완전한 구현으로 과장하지 않고 target controls와 별도 qualification으로 구분했습니다.",
      "열 개 Node examples는 actual JWT signature library, Spring filter/DB transaction, real browser XSS/CSRF/storage/events, network partitions, provider credential systems와 incident sinks를 대체하지 않습니다.",
    ],
  },
});

export default session;
