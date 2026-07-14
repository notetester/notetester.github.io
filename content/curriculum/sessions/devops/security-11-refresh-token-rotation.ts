import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefresh = ["local-members-controller", "local-members-service", "local-members-service-impl", "local-refresh-vo", "local-members-mapper", "local-members-mapper-xml", "local-jwt-util", "local-build"];
const officialRefresh = ["rfc6749", "rfc7009", "rfc7662", "rfc8725", "rfc9700", "spring-as-endpoints", "spring-as-core", "owasp-oauth", "owasp-session", "owasp-jwt", "owasp-secrets"];

const topics = [
  appliedTopic({
    id: "refresh-source-state-audit",
    title: "로컬 refresh flow를 persistence·transaction·reuse capability로 값 없이 감사합니다",
    lead: "controller의 login/refresh/logout 흐름과 service/mapper/VO/schema를 연결해 raw credential sink, lookup key, atomicity, token family와 revoke granularity를 source hash로 복원합니다.",
    mechanism: "2026-07-14 snapshot은 refresh credential 원문 기반 저장·조회, user 단위 delete 후 insert, 같은 JWT utility를 통한 access/refresh 생성과 controller의 credential logging path를 보여 줍니다. family, generation, digest, status, reuse metadata와 visible transaction/CAS는 확인되지 않았습니다.",
    workflow: "source hash→issuance→client handoff→storage representation→lookup→validation→old consume/new issue→commit→reuse/revoke→logout/account event→logs/backups를 추적합니다.",
    invariants: "실제 token, header, secret, subject, routes, payload, user/client/device와 endpoint 값을 복사하지 않고 구조적 capability와 위험만 공개합니다.",
    edgeCases: "동시 refresh, response loss, multiple devices, expired/revoked token, account deletion, DB retry, transaction rollback, backup exposure와 log pipeline 복제를 포함합니다.",
    failureModes: "정상 한 번의 delete/insert가 rotation처럼 보여도 lineage와 atomic compare-and-swap이 없으면 replay를 탐지할 수 없고 경쟁 요청이 여러 active descendants를 만들 수 있습니다.",
    verification: "source/mapper hashes, schema capability count, concurrent transaction fixture, credential-sink scan, device/grant revoke matrix와 recovery readback을 재현합니다.",
    operations: "raw credential을 수집하지 않고 family/grant status, generation bucket, stable reason, affected-row count와 incident milestone만 기록합니다.",
    concepts: [
      c("refresh capability audit", "발급·저장·회전·재사용 감지·폐기·복구가 실제 source/data model에 존재하는지 검사하는 감사입니다.", ["hash로 snapshot을 고정합니다.", "관찰과 목표를 분리합니다."]),
      c("raw credential sink", "refresh bearer value가 log, DB, backup, trace 또는 error에 그대로 남는 지점입니다.", ["값을 재수집하지 않습니다.", "노출 대응이 필요합니다."]),
      c("rotation lineage", "한 refresh token이 어느 predecessor를 소비해 어느 successor를 만들었는지 보존하는 계보입니다.", ["reuse detection의 근거입니다.", "family revoke에 사용합니다."]),
    ],
    codeExamples: [node("security11-source-audit", "sanitized refresh-flow capability audit", "Security11SourceAudit.mjs", "로컬 source의 구조적 capability와 gap을 실제 credential 없이 출력합니다.", String.raw`const findings = [
  ["persistence", "raw-lookup", "risk"],
  ["rotation", "delete-then-insert", "non-atomic-visible"],
  ["lineage", "family-generation-status", "gap"],
  ["reuse-detection", "ancestor-replay", "gap"],
  ["multi-device", "user-wide-replacement", "coarse"],
  ["logging", "refresh-credential", "risk"],
];
for (const x of findings) console.log(x.join("|"));
console.log("credential-values-copied=false");
console.log("snapshot-current-guidance=false");`, "persistence|raw-lookup|risk\nrotation|delete-then-insert|non-atomic-visible\nlineage|family-generation-status|gap\nreuse-detection|ancestor-replay|gap\nmulti-device|user-wide-replacement|coarse\nlogging|refresh-credential|risk\ncredential-values-copied=false\nsnapshot-current-guidance=false", localRefresh.concat(["local-jwt-learning", "local-integration-learning"], officialRefresh))],
  }),
  appliedTopic({
    id: "refresh-grant-family-model",
    title: "access token·refresh token·grant·family를 서로 다른 lifecycle로 모델링합니다",
    lead: "refresh token 한 문자열을 사용자 login 상태 전체와 동일시하지 않고 authorization grant, client/device session과 successor chain의 관계를 명시합니다.",
    mechanism: "access token은 resource에 제시되는 짧은 credential이고 refresh token은 authorization server에서 새 access token을 얻는 고가치 credential입니다. 한 grant/device login은 refresh family를 만들고 각 성공 rotation이 정확히 한 다음 generation을 생성합니다.",
    workflow: "account→client authorization grant→device/session family→generation 1..n→issued access tokens를 관계로 만들고 status와 revoke event owner를 정의합니다.",
    invariants: "family에는 최대 하나의 active generation만 있고 used ancestor는 다시 active가 되지 않으며 새 login이 다른 device family를 무조건 삭제하지 않습니다.",
    edgeCases: "여러 browser/device, duplicated login callback, consent scope change, client reinstall, account merge, device loss, grant expiry와 support revoke를 포함합니다.",
    failureModes: "user당 refresh row 하나만 유지하면 새 login이 다른 device를 로그아웃시키고, 사용자 단위 delete는 어느 grant/device에서 replay가 발생했는지 복원하지 못합니다.",
    verification: "account/client/device/grant/family/generation cardinality, simultaneous sessions, current-device/global logout와 lineage graph invariants를 test합니다.",
    operations: "opaque family/grant ID, generation/status, client class와 device label의 비민감 별칭만 관찰하며 subject/token을 metric label로 쓰지 않습니다.",
    concepts: [
      c("authorization grant", "resource owner가 client에 부여한 권한 관계와 token lifecycle의 서버 상태입니다.", ["scope/resource/client에 bind됩니다.", "revoke 단위가 됩니다."]),
      c("token family", "최초 refresh credential과 rotation successors가 속한 하나의 계보입니다.", ["active generation은 하나입니다.", "reuse 시 family를 revoke합니다."]),
      c("generation", "family 안에서 rotation 순서를 나타내는 단조 증가 번호입니다.", ["parent 관계와 함께 검증합니다.", "동시 descendants를 탐지합니다."]),
    ],
    codeExamples: [node("security11-family", "refresh family state invariant", "Security11Family.mjs", "used ancestors와 하나의 active successor를 가진 family 상태를 검증합니다.", String.raw`const family = [
  { generation: 1, status: "used", parent: null },
  { generation: 2, status: "used", parent: 1 },
  { generation: 3, status: "active", parent: 2 },
];
const active = family.filter(x => x.status === "active");
const lineageOk = family.every((x, i) => i === 0 ? x.parent === null : x.parent === family[i - 1].generation);
console.log("generations=" + family.map(x => x.generation + ":" + x.status).join(","));
console.log("active-count=" + active.length);
console.log("lineage-ok=" + lineageOk);
console.log("family-valid=" + (active.length === 1 && lineageOk));`, "generations=1:used,2:used,3:active\nactive-count=1\nlineage-ok=true\nfamily-valid=true", ["rfc6749", "rfc9700", "spring-as-core"])],
  }),
  appliedTopic({
    id: "refresh-opaque-digest-storage",
    title: "고entropy opaque refresh와 keyed digest 저장으로 DB 노출을 제한합니다",
    lead: "refresh token을 JWT로 만들 필요가 있는지 먼저 묻고 서버 조회가 필요한 rotation/revocation에서는 random opaque credential과 verifier digest가 단순하고 강한 선택일 수 있음을 이해합니다.",
    mechanism: "CSPRNG로 충분한 entropy의 opaque value를 한 번 발급하고 DB에는 versioned HMAC digest와 family/grant metadata만 저장합니다. HMAC pepper는 secret manager에 두어 DB-only compromise에서 verifier material을 분리하며 비교는 constant-time을 사용합니다.",
    workflow: "random bytes 생성→client에 한 번 전달→versioned HMAC→digest unique lookup→constant-time verify→raw buffer 최소 lifetime/zero logging→rotation 후 폐기 순서로 처리합니다.",
    invariants: "raw refresh는 ordinary DB/log/trace/error/cache/analytics/backups에 없고 digest key는 signing key와 분리되며 token entropy와 digest version이 migration을 지원합니다.",
    edgeCases: "digest collision, pepper rotation, DB replica lag, backup restore, Unicode/text normalization, base64url variants, accidental truncation과 duplicate issuance를 포함합니다.",
    failureModes: "고entropy token을 password처럼 느린 hash로 매 request 처리하면 불필요한 DoS 비용이 생길 수 있고, plain SHA hash만 저장하면 DB와 다른 leak의 correlation이 쉬워집니다. 반대로 짧고 사람이 정한 token은 어떤 digest로도 안전해지지 않습니다.",
    verification: "entropy/source, raw-column/sink absence, digest uniqueness/version, pepper IAM/rotation, timing-safe compare와 backup scan을 검증합니다.",
    operations: "digest 원문도 일반 telemetry에 넣지 않고 family ID와 keyed short correlation만 제한된 incident store에 보존합니다.",
    concepts: [
      c("opaque refresh token", "서버만 의미를 아는 고entropy random bearer credential입니다.", ["claims를 client가 해석하지 않습니다.", "server state와 lookup합니다."]),
      c("keyed digest", "secret pepper와 refresh value로 계산해 DB lookup/verification에 쓰는 HMAC 결과입니다.", ["raw 저장을 피합니다.", "pepper를 별도 관리합니다."]),
      c("constant-time comparison", "일치 위치에 따라 비교 시간이 달라지지 않도록 하는 byte comparison입니다.", ["길이를 먼저 고정합니다.", "library primitive를 사용합니다."]),
    ],
    codeExamples: [node("security11-digest", "keyed refresh digest verification", "Security11Digest.mjs", "synthetic bytes의 HMAC digest를 저장하되 token/digest 값을 출력하지 않고 일치 결과만 검증합니다.", String.raw`import { createHmac, timingSafeEqual } from "node:crypto";
const pepper = Buffer.alloc(32, 7);
const digest = value => createHmac("sha256", pepper).update(value).digest();
const stored = digest(Buffer.from("synthetic-refresh-a"));
const presented = digest(Buffer.from("synthetic-refresh-a"));
const other = digest(Buffer.from("synthetic-refresh-b"));
console.log("stored-raw=false");
console.log("digest-bytes=" + stored.length);
console.log("presented-match=" + timingSafeEqual(stored, presented));
console.log("other-match=" + timingSafeEqual(stored, other));
console.log("digest-value-output=false");`, "stored-raw=false\ndigest-bytes=32\npresented-match=true\nother-match=false\ndigest-value-output=false", ["owasp-secrets", "owasp-session", "owasp-oauth"])],
  }),
  appliedTopic({
    id: "refresh-schema-invariants",
    title: "family·parent·generation·status·expiry를 DB constraints로 강제합니다",
    lead: "application code의 if문만 믿지 않고 refresh credential digest, grant/family, generation, parent, lifecycle timestamps와 version을 data integrity constraints로 설계합니다.",
    mechanism: "최소 model은 digest/version, family/grant/client/device references, generation, parent, status(active/used/revoked/expired), issued/used/expires/idle timestamps와 row version을 가집니다. family별 active 하나는 partial unique index 또는 별도 family head row/CAS로 강제합니다.",
    workflow: "domain state machine→DDL constraints/indexes→transaction queries→retention/purge→backup/privacy→migration/rollback을 연결합니다.",
    invariants: "digest와 family+generation은 unique이고 parent는 같은 family의 바로 이전 generation이며 terminal status는 active로 되돌아가지 않고 expiry 뒤 사용되지 않습니다.",
    edgeCases: "database가 partial index를 지원하지 않는 경우, clock source, partitioning, replica read, soft delete, restore, purge job race와 schema rollback을 포함합니다.",
    failureModes: "status/generation constraints가 없으면 retry/bug가 두 active rows를 만들고 raw token unique constraint는 credential을 DB/backup에 그대로 보존합니다.",
    verification: "constraint violation tests, transaction isolation/concurrency, affected-row assertions, orphan/duplicate/head reconciliation query와 retention readback을 실행합니다.",
    operations: "active-per-family anomaly, generation gap, orphan parent, terminal resurrection, expired backlog와 purge lag를 지속 점검합니다.",
    concepts: [
      c("family head", "현재 active generation을 원자적으로 가리키는 family-level row 또는 constraint입니다.", ["CAS 대상이 됩니다.", "active uniqueness를 강제합니다."]),
      c("terminal status", "used/revoked/expired처럼 다시 active가 될 수 없는 lifecycle 상태입니다.", ["state transition을 제한합니다.", "audit time을 남깁니다."]),
      c("reconciliation query", "constraints 밖의 drift나 legacy corruption을 찾아 family invariants를 다시 확인하는 검사입니다.", ["read-only로 시작합니다.", "repair owner를 둡니다."]),
    ],
  }),
  appliedTopic({
    id: "refresh-atomic-rotation",
    title: "compare-and-swap와 한 transaction으로 consume→issue를 원자화합니다",
    lead: "old row delete와 new row insert를 분리하지 않고 presented digest가 active head일 때만 old를 used로 바꾸고 정확히 한 successor를 생성해 함께 commit합니다.",
    mechanism: "transaction 안에서 family/head를 lock하거나 status/version 조건 UPDATE를 수행해 affected rows=1을 성공 조건으로 삼습니다. 그 뒤 successor insert와 head advance를 같은 transaction에 넣고 access issuance/outbox의 commit semantics도 정의합니다.",
    workflow: "digest lookup→grant/family/account/client binding→expiry/status→CAS consume→successor generate/digest insert→head advance→audit/outbox→commit→response 순서입니다.",
    invariants: "성공 rotation은 old active→used와 new active 생성을 모두 또는 전혀 하지 않고 affected rows가 정확히 1이며 sibling successor가 없습니다.",
    edgeCases: "deadlock/retry, transaction timeout, insert failure, process crash before/after commit, response serialization failure, replica lag와 outbox publish retry를 포함합니다.",
    failureModes: "delete-old와 save-new 사이 crash는 session을 잃고, 둘 사이 경쟁은 여러 successor 또는 마지막 writer가 다른 family state를 지우는 결과를 만들 수 있습니다.",
    verification: "barrier로 N concurrent requests를 동시에 시작해 success 1, sibling 0, used ancestor 1, active head 1과 commit/rollback/outbox 결과를 readback합니다.",
    operations: "affected-row count, transaction retry/deadlock, generation advance, sibling anomaly와 response-after-commit failures를 관찰합니다.",
    concepts: [
      c("compare-and-swap", "expected status/version이 여전히 맞을 때만 row를 갱신하는 조건부 원자 연산입니다.", ["affected rows를 확인합니다.", "lost update를 막습니다."]),
      c("atomic rotation", "old credential consume와 successor issuance가 하나의 commit 단위로 성립하는 전이입니다.", ["all-or-nothing입니다.", "한 successor만 허용합니다."]),
      c("outbox", "DB state change와 후속 event 발행 의도를 같은 transaction에 저장하는 패턴입니다.", ["event loss를 줄입니다.", "token 원문을 넣지 않습니다."]),
    ],
    codeExamples: [node("security11-atomic-cas", "atomic refresh compare-and-swap model", "Security11AtomicCas.mjs", "같은 expected version의 경쟁 요청 중 하나만 old head를 소비하는지 보여 줍니다.", String.raw`const row = { status: "active", version: 4, generation: 1 };
function rotate(expectedVersion) {
  if (row.status !== "active" || row.version !== expectedVersion) {
    return "reuse-or-race|affected=0";
  }
  row.status = "used";
  row.version += 1;
  return "rotated|affected=1|replacement-generation=" + (row.generation + 1);
}
console.log(rotate(4));
console.log(rotate(4));
console.log("old-status=" + row.status);
console.log("old-version=" + row.version);`, "rotated|affected=1|replacement-generation=2\nreuse-or-race|affected=0\nold-status=used\nold-version=5", ["rfc9700", "spring-as-core", "local-members-service-impl", "local-members-mapper-xml"])],
  }),
  appliedTopic({
    id: "refresh-reuse-family-revoke",
    title: "used ancestor 재제시를 reuse로 탐지해 active family를 폐기합니다",
    lead: "rotation 후 invalidated token과 successor의 관계를 보존하고 old token이 다시 보이면 attacker와 legitimate client를 구분할 수 없다는 전제에서 family 전체를 안전하게 종료합니다.",
    mechanism: "RFC 9700 rotation은 이전 refresh를 invalidating하면서 관계를 유지하고 invalidated token 재사용 시 active refresh를 revoke해 breach를 탐지합니다. 서버는 어느 쪽이 공격자인지 알 수 없으므로 재인증이 안전한 recovery입니다.",
    workflow: "digest lookup→terminal ancestor 확인→family lock→active descendants revoke→grant/account risk event→access revoke policy→client reauthentication→incident correlation을 실행합니다.",
    invariants: "used/revoked/expired token은 새 successor를 만들지 않고 reuse 발견 후 family active count는 0이며 사건 전후 raw credential을 log하지 않습니다.",
    edgeCases: "정상 client retry, network proxy replay, stolen old vs new token, simultaneous family events, false-positive operational bug와 multiple resource regions를 포함합니다.",
    failureModes: "old row를 삭제해 버리면 unknown token으로만 보여 reuse를 탐지하지 못하고, old token만 거부한 채 successor를 유지하면 attacker가 이미 successor를 가진 경우 접근이 계속됩니다.",
    verification: "각 ancestor generation replay, current active duplicate, revoked/expired family, concurrent reuse/rotation과 access revocation propagation을 test합니다.",
    operations: "family/reason/generation distance, descendant revoke count, reauth completion과 incident status를 제한된 audit stream에 남깁니다.",
    concepts: [
      c("reuse detection", "이미 consumed/invalidated refresh credential이 다시 제시된 사건을 식별하는 control입니다.", ["lineage가 필요합니다.", "breach signal로 다룹니다."]),
      c("family revoke", "한 token family의 현재·후속 refresh credentials를 모두 unusable하게 만드는 전이입니다.", ["active count가 0이 됩니다.", "재인증으로 복구합니다."]),
      c("generation distance", "재사용된 ancestor와 당시 active head 사이의 generation 차이입니다.", ["incident severity 신호입니다.", "token 원문 없이 계산합니다."]),
    ],
    codeExamples: [node("security11-reuse", "refresh reuse and family revoke model", "Security11Reuse.mjs", "used ancestor가 제시되면 active descendant를 포함한 family가 revoke되는지 검증합니다.", String.raw`const family = {
  status: "active",
  tokens: [
    { generation: 1, status: "used" },
    { generation: 2, status: "used" },
    { generation: 3, status: "active" },
  ],
};
function present(generation) {
  const token = family.tokens.find(x => x.generation === generation);
  if (!token || token.status !== "active") {
    family.status = "revoked";
    for (const x of family.tokens) if (x.status === "active") x.status = "revoked";
    return "reuse|family-revoked";
  }
  return "rotate";
}
console.log(present(1));
console.log("family-status=" + family.status);
console.log("active-count=" + family.tokens.filter(x => x.status === "active").length);
console.log("head-status=" + family.tokens.at(-1).status);`, "reuse|family-revoked\nfamily-status=revoked\nactive-count=0\nhead-status=revoked", ["rfc9700", "rfc7009", "owasp-oauth"])],
  }),
  appliedTopic({
    id: "refresh-concurrency-idempotency",
    title: "동시 refresh·응답 유실·idempotency를 replay 방어와 함께 설계합니다",
    lead: "SPA가 동시에 여러 401을 받거나 rotation response가 유실될 때 같은 old refresh를 재전송하는 현실을 인정하되 used token을 다시 활성화하거나 여러 successors를 만들지 않습니다.",
    mechanism: "client는 single-flight mutex로 한 refresh만 수행하고 waiting requests가 그 결과를 공유합니다. 서버는 strict reuse revoke를 기본으로 하되 동일한 hashed idempotency key·client binding의 아주 짧은 window에 이미 committed한 동일 response envelope를 재전달할 수 있습니다.",
    workflow: "client single-flight→server idempotency lookup→family CAS→commit→short encrypted response envelope→same-request replay→expiry/delete를 설계하고 다른 request key의 ancestor replay는 family revoke합니다.",
    invariants: "idempotent retry는 새 successor를 추가 발급하지 않고 old token을 active로 되돌리지 않으며 replay cache는 짧고 encrypted/access-controlled이고 family/client/request에 bind됩니다.",
    edgeCases: "two tabs/workers, mobile retry, same idempotency key with different body, attacker가 token만 또는 token+key를 훔친 경우, cache outage, crash after commit before cache와 clock drift를 포함합니다.",
    failureModes: "몇 초 grace 동안 old token으로 매번 새 token을 발급하면 attacker와 client가 sibling chains를 만들고 reuse detection이 무력화됩니다. 모든 retry를 즉시 revoke하면 response loss가 잦은 client UX가 불안정해집니다.",
    verification: "barrier concurrency, same/different request key, response-loss injection, cache expiry/outage, sender/client mismatch와 descendants count를 test합니다.",
    operations: "single-flight miss, same-request replay, different-request reuse, envelope age, family revoke와 reauth success를 관찰합니다.",
    concepts: [
      c("single-flight", "동일 session의 동시 refresh 요청을 client에서 하나로 합치고 결과를 공유하는 제어입니다.", ["race를 줄입니다.", "server CAS를 대체하지 않습니다."]),
      c("idempotency key", "같은 의도 retry를 식별하는 client-generated value의 서버-side digest입니다.", ["family/client/request에 bind합니다.", "token 대체 credential로 만들지 않습니다."]),
      c("response envelope replay", "이미 commit된 rotation 결과를 동일 요청에만 짧게 재전달하는 복구 방식입니다.", ["암호화·TTL이 필요합니다.", "새 successor를 만들지 않습니다."]),
    ],
    codeExamples: [node("security11-idempotency", "bounded refresh idempotency model", "Security11Idempotency.mjs", "동일 request retry는 같은 generation 결과를 재사용하고 다른 request의 old-token replay는 family를 revoke합니다.", String.raw`const state = { family: "active", old: "active", generation: 1, cache: new Map() };
function rotate(requestKey) {
  if (state.cache.has(requestKey)) return "replayed:g" + state.cache.get(requestKey);
  if (state.family !== "active") return "reject:family";
  if (state.old !== "active") {
    state.family = "revoked";
    return "reuse:family-revoked";
  }
  state.old = "used";
  state.generation += 1;
  state.cache.set(requestKey, state.generation);
  return "issued:g" + state.generation;
}
console.log("first|" + rotate("request-a"));
console.log("retry-same|" + rotate("request-a"));
console.log("retry-different|" + rotate("request-b"));
console.log("family=" + state.family);
console.log("successor-count=1");`, "first|issued:g2\nretry-same|replayed:g2\nretry-different|reuse:family-revoked\nfamily=revoked\nsuccessor-count=1", ["rfc9700", "owasp-session", "local-members-controller"])],
  }),
  appliedTopic({
    id: "refresh-binding-lifetime",
    title: "refresh를 client·grant·scope·resource·sender와 idle/absolute lifetime에 bind합니다",
    lead: "refresh possession만으로 무제한 권한과 영구 session을 주지 않고 최초 grant의 client/resource/scope와 현재 account state를 매 rotation에서 다시 확인합니다.",
    mechanism: "RFC 9700은 refresh를 consented scope/resource servers에 bind하고 risk에 따라 inactivity expiry와 sender constraint 또는 rotation을 요구합니다. confidential client는 client authentication을 적용하고 public client는 DPoP/mTLS 같은 sender constraint 또는 rotation을 고려합니다.",
    workflow: "presented credential→family/client/sender binding→grant active→account/device status→requested scope/resource subset→idle timeout→absolute expiry→risk/step-up→rotation을 처리합니다.",
    invariants: "rotation이 scope/resource를 확대하지 않고 client mismatch와 revoked grant/account/device를 거부하며 activity가 absolute lifetime을 연장하지 않습니다.",
    edgeCases: "scope reduction, consent revoke, client secret rotation, public client reinstall, device key loss, step-up requirement, dormant family, clock skew와 offline usage를 포함합니다.",
    failureModes: "refresh할 때 user만 조회하고 client/grant/scope를 무시하면 탈취 token이 다른 client/resource에서 권한을 확장할 수 있고 sliding idle만 있으면 session이 영구화됩니다.",
    verification: "client/sender mismatch, scope escalation, resource change, idle/absolute boundaries, account/password/consent events와 step-up matrix를 실행합니다.",
    operations: "client/grant/family class, idle/absolute age bucket, binding failure reason과 sender-key rotation status만 관찰합니다.",
    concepts: [
      c("sender constraint", "token 사용을 특정 client-held key의 proof와 묶어 bearer theft만으로 사용하지 못하게 하는 제어입니다.", ["rotation과 조합할 수 있습니다.", "key lifecycle이 필요합니다."]),
      c("idle lifetime", "마지막 허용 활동 이후 refresh family가 만료되는 최대 비활성 기간입니다.", ["dormant risk를 줄입니다.", "absolute lifetime을 넘지 않습니다."]),
      c("absolute lifetime", "활동과 무관하게 grant/family가 반드시 종료되는 발급 후 최대 기간입니다.", ["영구 session을 막습니다.", "재인증이 필요합니다."]),
    ],
    codeExamples: [node("security11-binding", "refresh binding and lifetime gate", "Security11Binding.mjs", "client/scope와 idle/absolute lifetime을 fixed clock에서 검증합니다.", String.raw`const now = 1000;
function validate(x) {
  if (x.client !== "bound-client") return "reject:client";
  if (!x.scope.every(s => ["read", "update"].includes(s))) return "reject:scope";
  if (now - x.lastUsed >= 100) return "reject:idle";
  if (now - x.issued >= 500) return "reject:absolute";
  return "accept";
}
const base = { client: "bound-client", scope: ["read"], lastUsed: 950, issued: 700 };
console.log(validate(base));
console.log(validate({ ...base, client: "other" }));
console.log(validate({ ...base, scope: ["admin"] }));
console.log(validate({ ...base, lastUsed: 900 }));
console.log(validate({ ...base, issued: 500 }));`, "accept\nreject:client\nreject:scope\nreject:idle\nreject:absolute", ["rfc6749", "rfc9700", "owasp-oauth"])],
  }),
  appliedTopic({
    id: "refresh-revocation-events",
    title: "logout·device revoke·password/security event를 정확한 family/grant 범위로 전파합니다",
    lead: "logout 버튼 하나를 DB row delete와 동일시하지 않고 current device, all devices, client grant, consent, password reset, account lock/delete와 confirmed compromise의 revoke 범위를 명시합니다.",
    mechanism: "current-device logout은 해당 family, all-devices/security event는 account의 모든 relevant families, consent/client revoke는 해당 grant를 종료합니다. access JWT는 refresh 폐기만으로 즉시 사라지지 않으므로 short expiry, jti denylist 또는 introspection 정책을 함께 적용합니다.",
    workflow: "event classification→authorization/step-up→target family/grant/account select→transactional revoke→access-token action→cookies/client state clear→audit/outbox→propagation readback을 실행합니다.",
    invariants: "revoke는 idempotent하고 target 범위를 넘지 않으며 global security event는 누락 family가 없고 client UI 성공 전에 server outcome을 확인합니다.",
    edgeCases: "offline device, multiple clients, stolen access token, replay during revoke, region lag, failed outbox, account restore와 support mistake를 포함합니다.",
    failureModes: "매 login에서 user 전체 refresh를 지우면 multi-device를 깨고, logout에서 client storage만 지우면 stolen server credential은 계속 사용할 수 있습니다.",
    verification: "event×family/grant/account/access impact matrix, concurrent rotate/revoke, propagation SLO, client cookie/storage와 reconciliation을 test합니다.",
    operations: "event type, authorized actor class, target/revoked counts, propagation lag, idempotent replay와 readback anomalies를 관찰합니다.",
    concepts: [
      c("revoke scope", "security event가 종료해야 하는 family, grant, client 또는 account 범위입니다.", ["최소 범위를 선택합니다.", "global event는 completeness를 검증합니다."]),
      c("access-token residual window", "refresh revoke 뒤 이미 발급된 access token이 expiry/denylist/introspection까지 남을 수 있는 기간입니다.", ["risk에 맞게 제한합니다.", "incident에 측정합니다."]),
      c("revocation readback", "모든 target state와 verifier가 실제 revoke를 반영했는지 후속 조회/시험으로 확인하는 증거입니다.", ["UI 성공과 분리합니다.", "region별로 확인합니다."]),
    ],
    codeExamples: [node("security11-revoke-plan", "refresh revoke-scope planner", "Security11RevokePlan.mjs", "security event를 family/grant/account와 access residual action에 mapping합니다.", String.raw`const plan = {
  "current-device-logout": ["family", "access-expiry"],
  "consent-revoked": ["grant", "access-deny-or-expiry"],
  "password-security-event": ["account-families", "access-deny-or-expiry"],
  "reuse-detected": ["family", "access-risk-policy"],
};
for (const event of Object.keys(plan)) {
  console.log(event + "|refresh=" + plan[event][0] + "|access=" + plan[event][1]);
}
console.log("raw-token-required=false");`, "current-device-logout|refresh=family|access=access-expiry\nconsent-revoked|refresh=grant|access=access-deny-or-expiry\npassword-security-event|refresh=account-families|access=access-deny-or-expiry\nreuse-detected|refresh=family|access=access-risk-policy\nraw-token-required=false", ["rfc7009", "rfc7662", "spring-as-endpoints", "local-members-service"])],
  }),
  appliedTopic({
    id: "refresh-observability-incident",
    title: "rotation·reuse telemetry와 credential exposure incident를 원문 없이 운영합니다",
    lead: "공격 탐지를 위해 raw refresh를 log하는 모순을 피하고 family/generation transition, stable reason과 keyed correlation으로 replay·race·outage를 구분합니다.",
    mechanism: "event에는 opaque family/grant ID, presented generation relation, outcome, policy/build revision, client class와 correlation만 넣고 token/header/digest/subject/payload는 제외합니다. raw credential logging/persistence 노출 가능성이 있으면 revoke scope 평가, forced reauth, pepper/signing key 영향 분석, log/APM/backup purge와 downstream readback을 수행합니다.",
    workflow: "structured event schema→redaction at source→sink allowlist→canary scan→reuse/race baseline→alert triage→family/global revoke→purge/rotate→forensic timeline→recovery readback을 실행합니다.",
    invariants: "민감 sinks는 0이고 reuse alert는 token 값 없이 조사 가능하며 incident 종료에는 credential invalidation과 모든 복제 sink의 purge/readback evidence가 필요합니다.",
    edgeCases: "debug level enable, exception stack context, HTTP body capture, APM auto-instrumentation, database audit log, backup/WAL, support export와 third-party log retention을 포함합니다.",
    failureModes: "token prefix나 평문 digest를 correlation label로 남겨도 credential guessing/cross-log linking 위험이 있고, source log 한 줄만 지워 이미 복제된 logs/backups를 방치하면 노출이 지속됩니다.",
    verification: "synthetic canary를 허가된 fixture에서 흘려 app/proxy/APM/trace/DB/audit/artifact sinks를 scan하고 incident revoke/purge/readback drill을 실행합니다.",
    operations: "rotation success/reuse/race/idempotent replay, family revoke latency, raw-secret finding=0, purge coverage와 reauth completion SLO를 운영합니다.",
    concepts: [
      c("privacy-safe correlation", "원문 credential 없이 같은 family/event를 연결하는 제한된 opaque/keyed identifier입니다.", ["scope와 retention을 제한합니다.", "metrics cardinality를 관리합니다."]),
      c("sink inventory", "credential이 복제될 수 있는 application, proxy, APM, trace, DB, backup와 export 경로 목록입니다.", ["source부터 조사합니다.", "owner/retention을 기록합니다."]),
      c("incident readback", "revoke·rotate·purge·configuration 변경이 실제 모든 대상에 반영됐는지 검증한 결과입니다.", ["명령 성공과 구분합니다.", "증거를 보존합니다."]),
    ],
  }),
  appliedTopic({
    id: "refresh-migration-cutover",
    title: "raw single-row refresh를 digest family model로 안전하게 migration합니다",
    lead: "새 columns를 추가하는 것만으로 기존 raw credential 노출과 lineage 부재가 해결되지 않음을 인정하고 forced reauthentication 또는 제한된 backfill의 위험을 명시합니다.",
    mechanism: "가장 단순하고 강한 cutover는 logging을 먼저 제거하고 기존 refresh를 전부 revoke해 재인증 시 새 family/digest만 발급하는 것입니다. continuity가 필수라면 격리된 transaction에서 raw를 versioned digest로 변환한 뒤 null/drop하고 backup retention까지 처리하지만 과거 lineage는 복원되지 않습니다.",
    workflow: "sink stop/incident assessment→new schema/constraints→new issuance dual-write 금지 또는 bounded compatibility→existing revoke/backfill decision→canary→raw read disable→column/drop/backups→legacy code removal→reconciliation을 수행합니다.",
    invariants: "migration 후 새 raw writes/reads/logs가 0이고 active family head invariant가 성립하며 legacy fallback은 owner/expiry/usage telemetry와 함께 완전히 제거됩니다.",
    edgeCases: "old app nodes, rolling deploy, DB replica/schema lag, rollback, active clients, backup restore, failed backfill, pepper version와 partial force-reauth를 포함합니다.",
    failureModes: "raw와 digest를 장기간 dual-read하면 취약 path가 남고, used history 없이 current row만 family로 포장하면 재사용 감지 가능성을 과장합니다.",
    verification: "old/new artifact compatibility, raw sink/column/query scan, active-family constraints, forced reauth UX, rollback boundary, backup purge와 legacy usage=0 readback을 test합니다.",
    operations: "migration cohort, legacy read/write count, forced reauth success, constraint anomalies, backup expiry와 removal milestone을 관찰합니다.",
    concepts: [
      c("forced reauthentication", "기존 refresh credentials를 모두 무효화하고 사용자가 다시 인증해 새 model로 들어오게 하는 cutover입니다.", ["가장 명확한 security boundary입니다.", "UX/지원 계획이 필요합니다."]),
      c("bounded compatibility", "old/new 형식을 제한된 기간과 cohort에만 허용하고 usage 0 뒤 제거하는 migration입니다.", ["expiry가 필수입니다.", "raw path 확장을 막습니다."]),
      c("legacy readback", "old column/query/code path가 runtime과 backups에서 더 이상 사용되지 않음을 확인하는 증거입니다.", ["source scan과 metrics를 결합합니다.", "rollback 범위를 고정합니다."]),
    ],
  }),
  appliedTopic({
    id: "refresh-qualification-release",
    title: "concurrency·reuse·revoke·migration을 release와 incident gate로 완성합니다",
    lead: "한 번 refresh 성공을 넘어 N-way race, response loss, ancestor replay, device/global logout, DB fault와 raw sink absence를 production-like evidence로 증명합니다.",
    mechanism: "pure state model, database isolation integration, HTTP/client single-flight, multi-region revoke propagation, secret scanning과 incident drill이 서로 다른 보장을 제공합니다. gate는 sibling successor, stale active family, raw sink, undetected reuse와 revoke SLO breach를 hard blocker로 둡니다.",
    workflow: "state-machine properties→DB concurrent harness→Spring endpoint/client integration→fault injection→sink/backup scan→migration rehearsal→canary→rollback/recovery→immutable evidence package를 만듭니다.",
    invariants: "family당 active≤1, 성공 consume당 successor=1, terminal resurrection=0, reuse 후 active=0, raw credential findings=0과 revoke/incident readback=complete입니다.",
    edgeCases: "deadlock retry, cache outage, process crash, response loss, clock skew, region partition, old client, malicious replay burst와 observability outage를 포함합니다.",
    failureModes: "unit-test mock mapper만 통과하면 실제 isolation/affected rows/constraints를 증명하지 못하고 load test만 하면 security outcome을 success latency로 잘못 분류할 수 있습니다.",
    verification: "machine-readable invariant counts와 source/artifact/schema/runtime revisions로 gate를 재계산하고 한 control을 실패시켜 block/rollback/incident runbook을 확인합니다.",
    operations: "rotation/reuse/idempotency/revoke/migration SLO, invariant anomaly, raw sink scan, evidence age와 owner를 dashboard와 release policy에 연결합니다.",
    concepts: [
      c("rotation qualification", "state, DB concurrency, HTTP/client, operations와 incident 층에서 refresh rotation invariants를 증명하는 과정입니다.", ["여러 test layer가 필요합니다.", "artifact revision을 고정합니다."]),
      c("sibling successor", "같은 consumed parent에서 둘 이상 생성된 active 또는 issued refresh descendants입니다.", ["항상 anomaly입니다.", "family를 조사/revoke합니다."]),
      c("hard blocker", "예외로 숨기지 않고 배포를 중지해야 하는 credential/invariant/evidence 실패입니다.", ["owner와 recovery가 있습니다.", "readback 후 해제합니다."]),
    ],
    codeExamples: [node("security11-release-gate", "refresh rotation release evidence gate", "Security11ReleaseGate.mjs", "family invariants, concurrency, reuse, revoke, sinks, migration과 rollback evidence를 판정합니다.", String.raw`const evidence = {
  activePerFamilyMax: 1,
  siblingSuccessors: 0,
  concurrentSuccessesPerParent: 1,
  reuseFamilyActiveAfter: 0,
  terminalResurrections: 0,
  rawCredentialFindings: 0,
  revokeSloVerified: true,
  responseLossVerified: true,
  migrationLegacyWrites: 0,
  rollbackIncidentVerified: true,
};
const pass = evidence.activePerFamilyMax <= 1 &&
  evidence.siblingSuccessors === 0 &&
  evidence.concurrentSuccessesPerParent === 1 &&
  evidence.reuseFamilyActiveAfter === 0 &&
  evidence.terminalResurrections === 0 &&
  evidence.rawCredentialFindings === 0 &&
  evidence.revokeSloVerified && evidence.responseLossVerified &&
  evidence.migrationLegacyWrites === 0 && evidence.rollbackIncidentVerified;
for (const [k, v] of Object.entries(evidence)) console.log(k + "=" + v);
console.log("release=" + (pass ? "pass" : "block"));`, "activePerFamilyMax=1\nsiblingSuccessors=0\nconcurrentSuccessesPerParent=1\nreuseFamilyActiveAfter=0\nterminalResurrections=0\nrawCredentialFindings=0\nrevokeSloVerified=true\nresponseLossVerified=true\nmigrationLegacyWrites=0\nrollbackIncidentVerified=true\nrelease=pass", ["rfc9700", "spring-as-endpoints", "spring-as-core", "owasp-secrets", "local-members-mapper", "local-build"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-members-controller", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/controller/MembersController.java", usedFor: ["login/refresh/logout lifecycle audit", "refresh credential logging and delete-save race risks"], evidence: "2026-07-14 read-only sanitized audit: 514 lines, 21,038 bytes, SHA-256 72F5F59FCF79C94CDA20546FA25634AE2C8C8F47C43953B45263E07CF3BB246D. routes, payload keys, token과 subject 값은 복사하지 않았습니다." },
  { id: "local-members-service", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/service/MembersService.java", usedFor: ["raw lookup/delete/save service contract audit"], evidence: "2026-07-14 read-only sanitized audit: 31 lines, 985 bytes, SHA-256 9BE5C8E16EA473CEE7AF5FA2EE018074651FBECACFC3936B165B715C634D3AF1." },
  { id: "local-members-service-impl", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/service/MembersServiceImpl.java", usedFor: ["transaction/CAS boundary audit"], evidence: "2026-07-14 read-only sanitized audit: 72 lines, 2,147 bytes, SHA-256 46E425BBDEFF3487367E052EF5A76528C2C3C6FEAA45EF6F03E024ED1D842308. direct mapper calls에서 visible transaction/CAS를 확인하지 못했습니다." },
  { id: "local-refresh-vo", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/vo/RefreshTokenVO.java", usedFor: ["refresh persistence fields and family metadata gap"], evidence: "2026-07-14 read-only sanitized audit: 12 lines, 278 bytes, SHA-256 DC5B4A7B79F01985B5EAD311A3F66BE1B6DCDEF802A0DC9C7D5380D0F9908CBD. raw token field 구조를 값 없이 확인했고 family/generation/status/digest/reuse metadata는 확인되지 않았습니다." },
  { id: "local-members-mapper", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/mapper/MembersMapper.java", usedFor: ["persistence API and affected-row contract audit"], evidence: "2026-07-14 read-only sanitized audit: 46 lines, 1,407 bytes, SHA-256 0A5701BDBC8BD3D7830C4FCD42CC0015BF99D701BFF869091DE851F9969B1666." },
  { id: "local-members-mapper-xml", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/resources/mapper/members-mapper.xml", usedFor: ["raw refresh lookup/delete/insert SQL structure audit"], evidence: "2026-07-14 read-only sanitized audit: 82 lines, 3,375 bytes, SHA-256 FB09E79CB3AE98DF37B5D3BC3AFD8991389B8626B917B1DD9B458BB11F54CF06. refresh statements 3개와 hash/digest/family/reuse/status-revoke domain markers 0을 값 없이 확인했습니다." },
  { id: "local-jwt-util", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtUtil.java", usedFor: ["same access/refresh signing-profile audit"], evidence: "2026-07-14 read-only sanitized audit: 76 lines, 2,817 bytes, SHA-256 305E21E9D9E251BA7B402BB275C951BBC021F6FB270D6895926AF0CBEFB1AF1D. token, secret, subject와 claim 값은 복사하지 않았습니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["Boot/JJWT source snapshot boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5. JJWT 0.11.5/Boot 4.0.6을 현재 best practice로 과장하지 않습니다." },
  { id: "local-jwt-learning", repository: "D:/dev/REACT", path: "docs/springboot/03-jwt.md", usedFor: ["prior access/refresh/rotation learning coverage"], evidence: "2026-07-14 read-only sanitized audit: 230 lines, 11,495 bytes, SHA-256 0791CBA92C83E9E933395C0001C18F3CDB7DA7CB5EAEB97D2F73EB6C3ECF097C." },
  { id: "local-integration-learning", repository: "D:/dev/REACT", path: "docs/integration/react-springboot-jwt-flow.md", usedFor: ["client-server refresh flow learning coverage"], evidence: "2026-07-14 read-only sanitized audit: 202 lines, 10,116 bytes, SHA-256 7287E0FA7A3A43E37DA0FEF8FF378CEABB0CE2EDB8404FBF2ACB94C0AE89FE97." },
  { id: "rfc6749", repository: "IETF RFC Editor", path: "RFC 6749", publicUrl: "https://www.rfc-editor.org/rfc/rfc6749.html", usedFor: ["OAuth refresh grant, client binding and scope rules"], evidence: "OAuth 2.0 authorization framework의 refresh token grant 기본 계약입니다." },
  { id: "rfc7009", repository: "IETF RFC Editor", path: "RFC 7009", publicUrl: "https://www.rfc-editor.org/rfc/rfc7009.html", usedFor: ["token/grant revocation lifecycle"], evidence: "OAuth token revocation protocol을 정의합니다." },
  { id: "rfc7662", repository: "IETF RFC Editor", path: "RFC 7662", publicUrl: "https://www.rfc-editor.org/rfc/rfc7662.html", usedFor: ["access-token active state after refresh revoke"], evidence: "OAuth token introspection과 active state를 정의합니다." },
  { id: "rfc8725", repository: "IETF RFC Editor", path: "RFC 8725", publicUrl: "https://www.rfc-editor.org/rfc/rfc8725.html", usedFor: ["JWT access-refresh type/profile separation"], evidence: "JWT explicit typing과 mutually exclusive validation rules를 포함한 보안 BCP입니다." },
  { id: "rfc9700", repository: "IETF RFC Editor", path: "RFC 9700", publicUrl: "https://www.rfc-editor.org/rfc/rfc9700.html", usedFor: ["refresh rotation, relationship retention, reuse detection, sender constraint and expiry"], evidence: "OAuth 2.0 Security Best Current Practice이며 public clients의 sender-constrained refresh 또는 rotation, reuse 시 active refresh revoke를 다룹니다." },
  { id: "spring-as-endpoints", repository: "Spring Authorization Server reference", path: "protocol-endpoints.html", publicUrl: "https://docs.spring.io/spring-authorization-server/reference/protocol-endpoints.html", usedFor: ["token and revocation endpoint architecture"], evidence: "Spring Authorization Server 공식 protocol endpoints reference입니다." },
  { id: "spring-as-core", repository: "Spring Authorization Server reference", path: "core-model-components.html", publicUrl: "https://docs.spring.io/spring-authorization-server/reference/core-model-components.html", usedFor: ["authorization/grant/token model and persistence"], evidence: "Spring Authorization Server 공식 core model components reference입니다." },
  { id: "owasp-oauth", repository: "OWASP Cheat Sheet Series", path: "OAuth2_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html", usedFor: ["OAuth client/token security controls"], evidence: "OWASP 공식 OAuth 2.0 cheat sheet입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["bearer credential lifecycle, logging and timeouts"], evidence: "OWASP 공식 session management cheat sheet입니다." },
  { id: "owasp-jwt", repository: "OWASP Cheat Sheet Series", path: "JSON_Web_Token_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html", usedFor: ["Java JWT storage/revocation considerations"], evidence: "OWASP 공식 JWT cheat sheet입니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "Secrets_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["digest pepper and credential exposure response"], evidence: "OWASP 공식 secrets management cheat sheet입니다." },
];

const session = createExpertSession({
    inventoryId: "sec-09-access-refresh-lifecycle",
  slug: "security-11-refresh-token-rotation",
  courseId: "devops",
  moduleId: "token-client-integration",
  order: 3,
  title: "refresh token rotation·reuse detection·family revoke",
  subtitle: "raw single-row refresh를 digest·family lineage·atomic CAS·reuse/concurrency/idempotency·device/grant revoke model로 재설계합니다.",
  level: "전문가",
  estimatedMinutes: 235,
  coreQuestion: "refresh credential이 탈취·동시 사용·응답 유실·DB 장애를 겪어도 successor가 하나뿐이고 재사용을 탐지해 정확한 family를 폐기했다는 사실을 어떻게 증명할까요?",
  summary: "로컬 controller/service/VO/mapper/JWT와 기존 학습 문서를 값 없이 감사해 raw refresh 저장·조회·logging, user 단위 delete/insert와 lineage/transaction/reuse gap을 확인합니다. 이를 현재 best practice로 과장하지 않고 grant/device family, 고entropy opaque token과 versioned HMAC digest, DB constraints, atomic compare-and-swap, RFC 9700 reuse family revoke, client single-flight와 bounded response idempotency, scope/resource/client/sender binding, idle/absolute expiry, device/global/security-event revoke, access residual window, privacy-safe incident telemetry, forced-reauth migration과 production qualification을 열 개 local snapshots·OAuth/Spring Authorization Server/OWASP 근거 및 여덟 executable models로 완성합니다.",
  objectives: ["grant/family/generation과 access/refresh lifecycle을 구분한다.", "raw refresh 대신 high-entropy opaque credential과 keyed digest를 설계한다.", "DB constraints로 active-head와 terminal-state invariants를 강제한다.", "consume→issue를 transaction/CAS로 원자화한다.", "ancestor reuse를 탐지해 family를 revoke한다.", "동시 refresh와 response-loss idempotency를 안전하게 처리한다.", "client/grant/scope/resource/sender와 idle/absolute lifetime을 검증한다.", "device/logout/password/security event의 revoke scope를 설계한다.", "credential exposure incident를 원문 없이 복구한다.", "legacy raw storage를 강제 재인증 또는 bounded migration으로 종료한다."],
  prerequisites: [{ title: "access token validation·claims·clock", reason: "refresh rotation이 새 access token을 발급하므로 access profile, lifetime, revocation latency와 401 client recovery contract를 먼저 알아야 합니다.", sessionSlug: "security-10-access-token-validation" }],
  keywords: ["refresh token", "rotation", "token family", "reuse detection", "family revoke", "opaque token", "HMAC digest", "compare-and-swap", "single-flight", "idempotency", "logout", "device revoke"],
  topics,
  lab: {
    title: "refresh family atomicity, reuse and incident qualification lab",
    scenario: "disposable Spring/database/client fixture에서 synthetic refresh family를 발급하고 N-way concurrency, response loss, ancestor replay, logout/security events, migration과 credential sink incident를 끝까지 재현합니다.",
    setup: ["Node.js 20 이상", "Java 21/Spring compatible token-service fixture", "transactional disposable database matching production isolation", "CSPRNG opaque synthetic refresh values", "separate versioned HMAC pepper in test secret store", "multi-tab/client single-flight harness", "fault/clock/network controls", "log/APM/DB/backup canary scanner", "원본 local files read-only"],
    steps: ["로컬 source/mapper hashes와 raw/log/lineage/transaction capability matrix를 값 없이 재검증합니다.", "grant/device family, generation/status/parent/head schema와 constraints를 만듭니다.", "opaque token은 한 번만 전달하고 versioned HMAC digest만 DB에 저장되는지 scan합니다.", "CAS consume→successor insert→head advance→outbox를 한 transaction으로 구현합니다.", "N-way barrier race에서 success=1, sibling=0, active head=1을 readback합니다.", "모든 used ancestor generation을 재제시해 family active=0과 reauth outcome을 검증합니다.", "client single-flight와 same-request bounded response replay, different-request revoke를 response-loss fault로 실행합니다.", "client/scope/resource/sender, idle/absolute expiry와 account/grant/device state matrix를 test합니다.", "current-device/global/consent/password/reuse events와 access residual-window 대응을 측정합니다.", "raw sink exposure incident, forced-reauth migration, purge/readback, rollback과 release gate를 연습합니다."],
    expectedResult: ["family당 active generation은 최대 하나이고 성공 consume 하나당 successor가 정확히 하나입니다.", "used ancestor나 다른-request replay는 successor를 만들지 않고 active family를 revoke해 재인증을 요구합니다.", "same-request response-loss recovery는 새 successor를 만들지 않으며 짧고 encrypted/bound envelope 뒤 종료됩니다.", "logout/device/grant/security events가 의도한 범위만 idempotently revoke하고 access residual window가 측정됩니다.", "raw refresh/token/header/digest/secret이 logs, ordinary DB, traces, artifacts와 backups에서 0이며 incident/migration readback이 완료됩니다."],
    cleanup: ["synthetic families/grants/accounts/devices, opaque values, digests, pepper와 encrypted retry envelopes를 폐기합니다.", "disposable database, services, queues/caches와 client workers를 종료합니다.", "raw fault captures와 canaries를 삭제하고 redacted invariant summary/hash만 보존합니다.", "원본 local files hash와 git status가 unchanged인지 확인합니다."],
    extensions: ["DPoP 또는 mTLS sender-constrained refresh fixture를 추가합니다.", "formal state-machine/property-based model과 database linearizability checker를 통합합니다.", "multi-region revoke propagation/partition chaos를 자동화합니다.", "risk-based family step-up와 continuous lineage reconciliation을 운영합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node examples를 실행하고 family/digest/CAS/reuse/idempotency/binding/revoke/gate 불변식에 mapping하세요.", requirements: ["stdout 완전 일치", "raw token/digest 출력 없음", "sourceRefs 추적", "actual DB/Spring 한계 기록"], hints: ["deterministic state model은 database isolation이나 cryptographic entropy를 증명하지 않습니다."], expectedOutcome: "각 model의 authoritative state, race point, security outcome과 필요한 integration evidence를 설명합니다.", solutionOutline: ["source/family→digest/schema/CAS→reuse/idempotency→binding/revoke→gate 순서입니다."] },
    { difficulty: "응용", prompt: "multi-device SPA의 refresh rotation qualification packet을 만드세요.", requirements: ["family schema", "digest/pepper", "CAS transaction", "N-way race", "response loss", "reuse revoke", "device/global logout", "access residual", "sink scan", "incident rollback"], hints: ["grace period에 old token으로 새 successors를 반복 발급하지 마세요."], expectedOutcome: "UX retry와 replay 공격을 구분하면서 successor uniqueness와 breach containment를 증명합니다.", solutionOutline: ["threat/state→data constraints→concurrency/client→events/operations 순서입니다."] },
    { difficulty: "설계", prompt: "raw single-row refresh 시스템의 조직 migration/incident runbook을 작성하세요.", requirements: ["logging stop", "exposure assessment", "new schema", "force-reauth/backfill decision", "rolling compatibility", "backup purge", "legacy removal", "reconciliation", "support communication"], hints: ["과거 lineage는 backfill로 복원할 수 없다는 한계를 명시하세요."], expectedOutcome: "credential 노출과 service continuity trade-off를 숨기지 않고 종료 조건이 있는 migration을 수행합니다.", solutionOutline: ["contain→design→cutover→verify→remove→recover 순서입니다."] },
  ],
  nextSessions: ["security-12-react-token-client"],
  sources,
  sourceCoverage: {
    filesRead: 10,
    filesUsed: 10,
    uncoveredNotes: ["로컬 source/docs의 실제 refresh/access token, header, secret, subject, routes, payload, user/client/device와 endpoint 값을 공개 content에 복사하지 않았습니다.", "MembersController의 refresh credential logging과 raw DB persistence/lookup은 value-free risk로만 기록했습니다. 실제 노출 가능성이 있으면 log 제거만이 아니라 affected token/grant revoke 또는 forced reauth, digest/signing key 영향 평가, log/APM/DB backup purge와 downstream readback이 필요합니다.", "로컬 delete-by-user→save flow에서 visible transaction/CAS/family/reuse metadata를 확인하지 못했으며 이는 해당 snapshot의 source observation이지 실제 배포 DB isolation이나 다른 비공개 controls의 부재를 단정하는 말이 아닙니다.", "Node examples는 actual CSPRNG/HMAC key custody, database isolation/constraints, Spring endpoint, multi-client network와 incident systems를 대체하지 않습니다."],
  },
});

export default session;
