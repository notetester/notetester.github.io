import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "실제 이름·이메일·token·IP 없이 synthetic principal keys와 sqlite3 schema를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "canonical identifier, nullable uniqueness, social binding, token lifecycle, erasure 또는 index invariant를 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "raw secret 대신 digest/status/count/plan처럼 deterministic하고 최소화된 증거만 출력합니다. production KMS·lock·partition은 별도 engine matrix에서 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3/hashlib/hmac", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "Synthetic token harness는 production entropy, secret manager, email delivery, MySQL/Oracle locking과 개인정보 법률 판단을 대체하지 않습니다."] },
    experiments: [
      { change: "NULL·Unicode/case·동시 consume·만료 경계·account erasure를 추가합니다.", prediction: "canonicalization·unique·single-use·retention 경계가 빠지면 중복 identity, token replay 또는 PII 잔존이 나타납니다.", result: "canonical keys, affected-row counts, FK state와 privacy inventory를 비교합니다." },
      { change: "같은 contract를 MySQL 8.4와 Oracle 26ai 격리 schema에서 실행합니다.", prediction: "NULL unique, collation, partial/function index, partition와 online migration에 승인된 차이가 나타납니다.", result: "engine/version, DDL metadata, isolation/plan and readback을 conformance evidence로 남깁니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "auth-domain-boundaries",
    title: "회원·로그인 identity·credential·verification·activity 경계를 분리합니다",
    lead: "USERS 한 행에 로그인 방식과 모든 이력을 넣으면 선택적 email/social, password 상태, 보안 사건과 삭제 보존 요구가 서로 충돌합니다.",
    explanations: [
      "원본 USERS.sql은 USERS, USER_SOCIAL, USER_LOGIN_HISTORY, EMAIL_VERIFICATION, EMAIL_VERIFICATION_REQUEST, USER_SECURITY_HISTORY와 USER_ACTIVITY_LOG로 확장됩니다. 이 세션은 402줄 progression을 read-only로 감사하되 실제처럼 보이는 email/token/identifier/IP/user-agent/message는 복사하지 않습니다.",
      "account는 서비스 주체와 상태를, login identifier는 ID/email 같은 이름→account mapping을, credential은 password/social provider binding을, verification request/token은 단기 proof workflow를, security event와 activity event는 서로 다른 감사/분석 목적을 가집니다.",
      "authentication은 누구인지 증명하고 authorization은 무엇을 할 수 있는지 결정합니다. email_verified, password_enabled와 email_login_enabled boolean 조합만으로 policy를 흩뜨리지 말고 credential/status transition과 effective policy를 정의합니다.",
      "각 table의 grain을 적습니다. account 한 행, social binding 한 provider-subject, login attempt 한 시도, verification request 한 business workflow, token 한 credential, security event 한 민감 사건, activity event 한 최소화된 request 관찰입니다.",
      "PII/secret inventory에는 raw email/user id/nickname/nationality/IP/user-agent/session/request query/token/password digest가 어떤 목적·owner·access·retention·erasure rule을 갖는지 기록합니다. 편의를 위한 범용 detail_message/query_string 저장을 기본 금지합니다.",
    ],
    concepts: [
      c("account principal", "서비스가 권한·상태·lifecycle을 부여하는 내부 주체입니다.", ["로그인 identifier와 분리합니다.", "opaque immutable key를 가집니다."]),
      c("credential binding", "password 또는 외부 provider subject가 한 principal을 인증하도록 연결된 관계입니다.", ["credential별 lifecycle을 가집니다.", "account row와 분리합니다."]),
      c("data boundary", "identity·secret·security audit·product analytics를 목적과 접근 권한에 따라 분리한 저장 경계입니다.", ["retention이 다릅니다.", "cross-purpose reuse를 제한합니다."]),
    ],
    diagnostics: [
      d("사용자 삭제 요청 뒤 여러 log와 token table에 email이 남습니다.", "PII lineage/retention/erasure inventory 없이 raw identifier를 모든 경계에 복제했습니다.", ["column-level inventory", "FK/delete actions", "backups/exports", "logs/detail fields"], "raw PII를 authoritative identity boundary에 최소화하고 event에는 opaque keys/reason codes를 사용해 erasure workflow를 실행합니다.", "schema PII lint와 delete-subject restore/backup policy tests를 둡니다."),
      d("password disabled인데 email login boolean 때문에 인증됩니다.", "여러 boolean 조합에 effective credential policy가 분산됐습니다.", ["credential rows/status", "account status", "verification state", "authentication query"], "credential type별 ACTIVE/REVOKED/PENDING state와 central policy transition을 사용합니다.", "모든 boolean/state 조합의 deny-by-default truth-table test를 둡니다."),
    ],
    expertNotes: ["보안 schema의 첫 질문은 열 목록이 아니라 secret/PII가 어느 경계에 왜 존재하는지입니다.", "범용 활동 로그와 보안 감사 로그는 access·retention·integrity 요구가 달라 분리합니다."],
  },
  {
    id: "canonical-identifiers-email-policy",
    title: "표시 identifier와 versioned canonical lookup key를 분리합니다",
    lead: "공백·대소문자·Unicode·domain IDN을 정의하지 않은 UNIQUE email은 DB collation과 application 경로에 따라 중복 또는 오탐을 만듭니다.",
    explanations: [
      "display_email은 사용자에게 보여 줄 원문, email_canonical은 product가 로그인/중복 판정에 쓰는 versioned key입니다. trim, Unicode normalization, domain IDNA/lowercase와 local-part case policy를 명시하고 임의 provider-specific dot/plus 제거를 하지 않습니다.",
      "RFC email syntax를 완벽히 regex로 재현하려 하지 않습니다. 가입에서는 service가 지원하는 길이/문자/transport 정책을 명확히 하고 실제 mailbox ownership은 verification으로 증명합니다.",
      "user_id/nickname도 Unicode normalization, case/accent/width와 reserved/confusable policy가 필요합니다. display name과 로그인 key를 같은 collation에 의존하지 않고 canonicalizer version을 저장합니다.",
      "MySQL column collation이 case-insensitive인지 binary인지에 따라 UNIQUE 결과가 달라집니다. application canonicalization과 DB unique expression/generated column을 같은 golden corpus로 검증하고 Oracle/SQLite 차이를 matrix화합니다.",
      "canonical algorithm 변경은 기존 keys와 unique collisions를 만듭니다. v2 key column/index를 병행 backfill하고 collision owner resolution 후 dual lookup→atomic cutover→v1 retire를 수행합니다.",
    ],
    concepts: [
      c("display identifier", "사용자에게 재표시하기 위해 보존하는 검증된 입력 표현입니다.", ["lookup key와 다릅니다.", "access/erasure 대상입니다."]),
      c("canonical identifier", "정의한 normalization/case/domain 규칙으로 만든 검색·unique key입니다.", ["algorithm version을 가집니다.", "원문을 대체하지 않습니다."]),
      c("collision report", "old/new canonicalization에서 여러 accounts가 같은 key로 합쳐지는 후보 목록입니다.", ["자동 merge하지 않습니다.", "PII 제한 환경에서 처리합니다."]),
    ],
    codeExamples: [py("db18-canonical-email", "명시적 email canonicalization policy", "db18_canonical.py", "합성 TEST domain address의 trim/local-case policy와 IDNA lowercase domain을 고정하고 같은 lookup key를 검증합니다.", String.raw`import unicodedata

def canonical_email(value):
    value = unicodedata.normalize("NFC", value.strip())
    local, domain = value.rsplit("@", 1)
    domain_ascii = domain.encode("idna").decode("ascii").lower()
    return local.casefold() + "@" + domain_ascii
values = [" Learner@EXAMPLE.TEST ", "learner@example.test", "LEARNER@Example.Test"]
keys = [canonical_email(value) for value in values]
for index, key in enumerate(keys, 1):
    print(f"key{index}={key}")
print("all-equal=" + str(len(set(keys)) == 1).lower())
print("policy=local-casefold-domain-idna-v1")`, "key1=learner@example.test\nkey2=learner@example.test\nkey3=learner@example.test\nall-equal=true\npolicy=local-casefold-domain-idna-v1", ["local-users", "mysql-charset", "rfc5321", "rfc5322", "python-hashlib"])],
    diagnostics: [
      d("가입과 로그인에서 같은 email을 다르게 판단합니다.", "각 code path가 서로 다른 trim/case/Unicode 규칙을 구현했습니다.", ["canonicalizer version", "raw/canonical columns", "DB collation/index", "all entry paths"], "하나의 versioned canonicalizer와 DB UNIQUE key를 사용하고 가입/login/reset/link가 같은 corpus를 실행합니다.", "cross-path property tests와 drift hash를 둡니다."),
      d("canonicalizer 업그레이드 중 unique violation이 발생합니다.", "새 규칙의 collision을 조사하지 않고 in-place UPDATE했습니다.", ["v1→v2 collision groups", "account status/owner", "FK/credential bindings", "rollback column"], "v2 key를 nullable 병행 backfill해 collisions를 수동 해결한 뒤 unique index와 routing을 전환합니다.", "migration preflight collision zero gate와 reversible v1 보존을 둡니다."),
    ],
    expertNotes: ["email local-part case 정책은 product decision이며 RFC를 핑계로 무조건 lower한다고 숨기지 않습니다.", "canonical key도 개인정보이므로 hashing/encryption/access/erasure inventory에 포함합니다."],
  },
  {
    id: "optional-identifiers-unique-null-social",
    title: "선택적 ID·email의 UNIQUE NULL과 social provider-subject key를 정확히 모델링합니다",
    lead: "UNIQUE nullable 열은 여러 NULL을 허용할 수 있지만 엔진 semantics를 확인해야 하며, 빈 문자열을 미등록 sentinel로 쓰면 중복·조회 의미가 깨집니다.",
    explanations: [
      "password-only, email-only와 social-only 계정이 있다면 user_id/email은 NULL일 수 있습니다. absence는 SQL NULL로 표현하고 empty string/'NONE'을 sentinel로 저장하지 않습니다.",
      "MySQL·Oracle·SQLite의 UNIQUE와 NULL semantics, composite key와 collation을 conformance합니다. product invariant가 'verified active email만 unique'라면 unconditional raw email UNIQUE가 아니라 canonical identifier table/state-specific index pattern을 설계합니다.",
      "social identity의 stable candidate key는 provider+provider_subject입니다. provider username/email은 바뀌거나 재사용될 수 있으므로 로그인 key로 사용하지 않고 issuer/audience/tenant까지 필요한 federation scope를 문서화합니다.",
      "한 account당 provider 하나만 허용할지는 제품 정책입니다. 원본 UNIQUE(user_idx,provider)는 provider 계정 여러 개 linking을 막으므로 요구가 없다면 over-constraint가 될 수 있습니다.",
      "account merge/link에는 source/target credentials를 transaction으로 옮기고 conflicting provider/email, active sessions, audit lineage와 rollback을 처리합니다. social callback은 state/nonce 검증 후 binding UNIQUE를 최종 arbitration으로 사용합니다.",
    ],
    concepts: [
      c("nullable unique", "값이 존재할 때만 중복을 금지하고 absence는 NULL로 여러 행에 허용하는 패턴입니다.", ["engine semantics를 확인합니다.", "empty sentinel을 금지합니다."]),
      c("provider subject", "외부 identity provider가 issuer scope에서 부여하는 안정 사용자 식별자입니다.", ["display email과 다릅니다.", "provider/issuer와 composite key입니다."]),
      c("identity binding", "로그인 identifier 또는 external subject를 internal principal에 연결하는 행입니다.", ["state/verified timestamps를 가집니다.", "merge/revoke가 가능합니다."]),
    ],
    codeExamples: [py("db18-null-social-unique", "여러 NULL과 provider-subject uniqueness", "db18_identity_keys.py", "선택 identifier NULL은 여러 개 허용하고 동일 provider-subject binding은 한 account만 차지하는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, user_id TEXT UNIQUE, email_key TEXT UNIQUE)")
db.execute("CREATE TABLE social(id INTEGER PRIMARY KEY, account_id INTEGER, provider TEXT, subject TEXT, UNIQUE(provider, subject))")
db.executemany("INSERT INTO account VALUES (?, ?, ?)", [(1, None, None), (2, None, None), (3, "learner-3", "l3@example.test")])
print("null-user-ids=" + str(db.execute("SELECT count(*) FROM account WHERE user_id IS NULL").fetchone()[0]))
db.execute("INSERT INTO social VALUES (1, 1, 'OIDC-A', 'SUB-001')")
try:
    db.execute("INSERT INTO social VALUES (2, 2, 'OIDC-A', 'SUB-001')")
except sqlite3.IntegrityError:
    print("provider-subject-duplicate=rejected")
db.execute("INSERT INTO social VALUES (3, 2, 'OIDC-B', 'SUB-001')")
print("social-count=" + str(db.execute("SELECT count(*) FROM social").fetchone()[0]))
print("empty-sentinel-used=false")`, "null-user-ids=2\nprovider-subject-duplicate=rejected\nsocial-count=2\nempty-sentinel-used=false", ["mysql-create-table", "mysql-create-index", "oracle-create-table", "sqlite-create-table", "sqlite-create-index"])],
    diagnostics: [
      d("social-only 두 사용자가 empty user_id unique에서 충돌합니다.", "미등록 identifier를 NULL 대신 빈 문자열로 저장했습니다.", ["NULL/empty counts", "defaults", "application serialization", "unique index"], "absence는 NULL로 저장하고 present canonical keys만 unique하게 강제합니다.", "multiple optional-identifier accounts와 empty rejection tests를 둡니다."),
      d("다른 account가 같은 social identity에 연결됩니다.", "provider subject에 DB UNIQUE가 없고 callback check-then-insert race가 있습니다.", ["provider/issuer/subject columns", "unique constraint", "concurrent callback timeline", "merge audit"], "정확한 issuer scope composite UNIQUE를 최종 arbitration으로 두고 conflict를 secure link/merge flow로 처리합니다.", "two-connection binding race와 cross-provider positive fixtures를 둡니다."),
    ],
    expertNotes: ["NULL과 빈 문자열의 구분은 optional identity contract의 일부입니다.", "external email claim보다 verified provider subject와 issuer/audience validation을 신뢰 경계로 봅니다."],
  },
  {
    id: "password-credential-account-security",
    title: "password credential·account status·session revoke를 독립 lifecycle로 관리합니다",
    lead: "비밀번호 문자열과 enabled boolean만으로는 hash algorithm, 변경·폐기·재인증·잠금과 session 무효화를 설명할 수 없습니다.",
    explanations: [
      "password credential은 account_id, password_hash, algorithm/parameters, set_at, expires/revoked_at와 rehash_needed를 가집니다. plaintext 또는 reversible password를 저장하지 않고 memory-hard password hashing policy를 적용합니다.",
      "salt는 password별 random이고 hash encoding에 포함할 수 있으며, optional pepper는 DB 밖 secret manager/KMS에 보관하고 rotation/version을 설계합니다. ordinary SHA-256 한 번은 password hashing이 아닙니다.",
      "account ACTIVE/DORMANT/LOCKED/DELETED와 credential ACTIVE/REVOKED, email VERIFIED와 session ACTIVE/REVOKED는 서로 다른 상태입니다. 인증 query는 모두 deny-by-default policy로 조합합니다.",
      "실패 횟수 global counter는 distributed race와 account enumeration/DoS를 만들 수 있습니다. rate limit은 account/IP/device risk boundary에서 privacy-safe하게 운영하고 성공/실패 응답 시간을 균질화합니다.",
      "password reset/change는 token single-use, recent authentication, all-or-selected session revoke와 security event/outbox를 한 business transition으로 처리합니다. hash나 reset token을 audit에 복제하지 않습니다.",
    ],
    concepts: [
      c("password verifier", "salt와 cost parameters를 포함한 one-way password hashing 결과입니다.", ["plaintext를 복원하지 않습니다.", "algorithm agility를 가집니다."]),
      c("credential lifecycle", "PENDING·ACTIVE·REVOKED와 set/used/revoked timestamps로 인증 수단 상태를 관리합니다.", ["account status와 분리합니다.", "rotation/rehash를 지원합니다."]),
      c("session revocation", "credential compromise/change 뒤 발급된 sessions/tokens의 사용을 종료하는 통제입니다.", ["version/revoked_at을 확인합니다.", "cache propagation SLO가 필요합니다."]),
    ],
    diagnostics: [
      d("DB 유출 뒤 password를 빠르게 대입 공격할 수 있습니다.", "fast unsalted hash 또는 낮은 cost를 사용했습니다.", ["hash encoding/algorithm", "salt uniqueness", "cost/memory", "pepper storage"], "승인된 memory-hard KDF와 per-password salt, calibrated cost와 algorithm agility를 적용해 로그인 시 rehash합니다.", "hash policy unit/integration test와 정기 cost review를 둡니다."),
      d("password reset 후 기존 session이 계속 유효합니다.", "credential 변경과 session revocation/version이 연결되지 않았습니다.", ["credential/session versions", "cache TTL", "reset transaction/outbox", "read path"], "reset transition에서 session generation/revoked_at을 갱신하고 모든 verifier가 즉시/정의된 SLO로 확인합니다.", "reset-vs-concurrent-session race와 cache propagation test를 둡니다."),
    ],
    expertNotes: ["password hash parameter는 schema/API contract이며 향후 algorithm upgrade를 위해 row별 metadata를 보존합니다.", "로그인 history에 raw entered identifier/password/token을 절대 저장하지 않습니다."],
  },
  {
    id: "verification-token-digest-expiry-single-use",
    title: "검증 token은 고entropy 원문 대신 digest·만료·single-use 상태를 저장합니다",
    lead: "EMAIL_VERIFICATION.token 원문이 DB에 있으면 read-only 유출만으로 공격자가 인증 링크를 사용할 수 있습니다.",
    explanations: [
      "token 원문은 CSPRNG로 충분한 entropy를 생성해 사용자에게 한 번 보내고 DB에는 HMAC/cryptographic digest와 key version만 저장합니다. lookup 시 받은 token을 같은 방식으로 digest해 constant-time 비교/unique lookup합니다.",
      "purpose, subject/account, pending canonical email, issued/expired/consumed/cancelled_at와 request id를 한 credential grain에 묶습니다. token 하나를 email verify와 password reset 등 다른 purpose에 재사용하지 않습니다.",
      "single-use는 `UPDATE ... SET consumed_at=now WHERE digest=? AND purpose=? AND consumed_at IS NULL AND cancelled_at IS NULL AND expires_at>now` 같은 atomic claim의 affected row=1로 판정합니다. SELECT 후 UPDATE는 동시 double-use race가 있습니다.",
      "expiry는 authoritative DB/application clock과 UTC instant를 사용하고 경계 `now < expires_at`를 정의합니다. delivery delay, resend와 clock skew를 고려하며 expired token을 delete하기 전 security evidence retention을 분리합니다.",
      "resend는 old active token을 cancel하고 new token을 발급하는 transaction이며 사용자가 여러 devices에서 최신/모든 active token 중 무엇을 쓸 수 있는지 정책을 명시합니다. response는 account/email 존재 여부를 노출하지 않습니다.",
    ],
    concepts: [
      c("token digest", "raw bearer token을 one-way keyed/unkeyed hash로 변환해 저장하는 lookup 값입니다.", ["raw token을 복구하지 않습니다.", "key version/rotation을 관리합니다."]),
      c("atomic consume", "valid+unused predicate와 consumed update를 한 conditional statement로 실행해 한 요청만 성공시키는 동작입니다.", ["affected row=1을 요구합니다.", "replay를 거부합니다."]),
      c("purpose binding", "token을 발급한 정확한 작업·subject·pending value에 묶어 다른 흐름에서 쓰지 못하게 하는 규칙입니다.", ["cross-purpose replay를 막습니다.", "request id와 연결합니다."]),
    ],
    codeExamples: [py("db18-token-single-use", "digest-only token의 만료와 atomic single-use", "db18_token.py", "고정 synthetic token을 HMAC digest로만 저장하고 첫 consume만 성공하며 raw token이 DB에 없는지 검증합니다.", String.raw`import hashlib
import hmac
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE verification(id INTEGER PRIMARY KEY, digest TEXT UNIQUE, purpose TEXT, expires_at INTEGER, consumed_at INTEGER)")
pepper = b"synthetic-test-pepper"
raw_token = "SYNTHETIC-ONE-TIME-TOKEN"
def digest(token):
    return hmac.new(pepper, token.encode(), hashlib.sha256).hexdigest()
db.execute("INSERT INTO verification VALUES (1, ?, 'EMAIL_VERIFY', 2000, NULL)", (digest(raw_token),))
def consume(token, now):
    changed = db.execute("UPDATE verification SET consumed_at=? WHERE digest=? AND purpose='EMAIL_VERIFY' AND consumed_at IS NULL AND expires_at>?", (now, digest(token), now)).rowcount
    db.commit()
    return changed == 1
print("first=" + str(consume(raw_token, 1500)).lower())
print("replay=" + str(consume(raw_token, 1501)).lower())
stored = db.execute("SELECT digest, consumed_at FROM verification").fetchone()
print("raw-stored=" + str(stored[0] == raw_token).lower())
print("digest-length=" + str(len(stored[0])))
print("consumed-at=" + str(stored[1]))`, "first=true\nreplay=false\nraw-stored=false\ndigest-length=64\nconsumed-at=1500", ["local-users", "python-secrets", "python-hashlib", "python-hmac", "sqlite-transaction", "nist-800-63b"])],
    diagnostics: [
      d("동일 email link를 동시에 눌러 두 요청이 성공합니다.", "SELECT unused 후 별도 UPDATE를 수행해 race가 열렸습니다.", ["consume SQL", "affected rows", "transaction/isolation", "security events"], "validity predicate를 포함한 conditional UPDATE/delete로 atomic claim하고 rowcount=1만 성공으로 인정합니다.", "barrier two-connection consume test와 replay audit를 둡니다."),
      d("DB read 권한만 유출됐는데 live token이 사용됩니다.", "bearer token 원문을 저장/log/export했습니다.", ["token columns", "application/mail logs", "backup/replica access", "digest/key design"], "raw token은 생성 시 한 번만 전달하고 DB에는 keyed digest/key version을 저장해 기존 tokens를 revoke합니다.", "secret pattern scan과 backup/log read-role negative test를 둡니다."),
    ],
    expertNotes: ["token digest도 correlation 가능한 보안 데이터이므로 access와 retention을 제한합니다.", "password hash와 random bearer token digest는 위협/비용 모델이 다르므로 같은 algorithm policy를 맹목적으로 공유하지 않습니다."],
  },
  {
    id: "verification-request-state-concurrency",
    title: "이메일 변경 요청을 request-token-account의 상태 기계로 처리합니다",
    lead: "pending_email과 token을 여러 tables에 중복 저장하고 boolean used/status를 따로 갱신하면 VERIFIED인데 적용되지 않거나 old token이 새 요청을 덮어씁니다.",
    explanations: [
      "verification_request는 account+purpose+pending canonical value를 가진 business workflow, token은 그 request에 속한 one-time credential입니다. request_id를 두 table에 문자열 중복 저장하기보다 stable FK를 사용하고 correlation용 public id를 별도로 둡니다.",
      "REQUESTED→VERIFIED→APPLIED와 EXPIRED/CANCELLED 전이를 정의합니다. verified는 mailbox proof, applied는 account email unique claim까지 commit됨을 뜻하므로 둘을 한 boolean로 합치지 않습니다.",
      "새 email 변경 요청이 old request를 cancel할지 병행 허용할지 정책을 정합니다. account+purpose의 active request uniqueness를 generated/partial/function-based index 또는 active slot table로 강제합니다.",
      "apply transaction은 request를 lock/conditional claim하고 pending canonical email UNIQUE를 획득하며 account identifier를 변경하고 request APPLIED/security event/session policy를 함께 기록합니다. unique conflict는 다른 account가 선점한 안전한 실패입니다.",
      "원본 token equality backfill은 historical 연결에 사용할 수 있지만 raw token comparison을 장기 설계로 유지하지 않습니다. migration 시 request-token mapping confidence와 orphan/duplicate를 report하고 새 digest model로 회전합니다.",
    ],
    concepts: [
      c("verification request", "특정 account·purpose·pending value를 검증하고 적용하는 business workflow 행입니다.", ["token과 one-to-many일 수 있습니다.", "상태 transition을 가집니다."]),
      c("active request uniqueness", "한 account-purpose에 동시에 허용하는 active workflow 수를 강제하는 규칙입니다.", ["resend 정책과 연결합니다.", "partial/generated index pattern을 사용합니다."]),
      c("verify-apply split", "proof 획득과 실제 identity 변경/unique claim을 서로 다른 상태로 표현하는 설계입니다.", ["race/conflict를 설명합니다.", "APPLIED만 current identity입니다."]),
    ],
    codeExamples: [py("db18-verify-apply", "VERIFIED에서 APPLIED로의 conditional transition", "db18_verify_apply.py", "검증 요청이 expected state일 때만 email key를 적용하고 replay는 거부되는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, email_key TEXT UNIQUE)")
db.execute("CREATE TABLE request(id INTEGER PRIMARY KEY, account_id INTEGER, pending_key TEXT, status TEXT, version INTEGER)")
db.execute("INSERT INTO account VALUES (1, NULL)")
db.execute("INSERT INTO request VALUES (101, 1, 'learner@example.test', 'VERIFIED', 1)")
def apply(request_id, expected_version):
    with db:
        row = db.execute("SELECT account_id, pending_key FROM request WHERE id=? AND status='VERIFIED' AND version=?", (request_id, expected_version)).fetchone()
        if row is None:
            return False
        db.execute("UPDATE account SET email_key=? WHERE id=?", (row[1], row[0]))
        changed = db.execute("UPDATE request SET status='APPLIED', version=version+1 WHERE id=? AND status='VERIFIED' AND version=?", (request_id, expected_version)).rowcount
        if changed != 1:
            raise RuntimeError("stale-request")
    return True
print("first-apply=" + str(apply(101, 1)).lower())
print("replay=" + str(apply(101, 1)).lower())
print("email-key=" + db.execute("SELECT email_key FROM account WHERE id=1").fetchone()[0])
print("request=" + "|".join(map(str, db.execute("SELECT status,version FROM request WHERE id=101").fetchone())))`, "first-apply=true\nreplay=false\nemail-key=learner@example.test\nrequest=APPLIED|2", ["local-users", "mysql-transaction", "mysql-create-index", "oracle-create-index", "sqlite-transaction"])],
    diagnostics: [
      d("인증 완료 뒤 email은 바뀌지 않았는데 verified=true입니다.", "proof state와 account apply/unique claim이 다른 transaction 또는 boolean로 분리됐습니다.", ["request status/version", "account email key", "transaction log", "unique conflict"], "VERIFIED와 APPLIED를 분리하고 apply command에서 account change+request transition+audit를 atomic하게 commit합니다.", "각 statement fault injection과 state/account parity test를 둡니다."),
      d("old email request가 새 요청 후 account를 덮어씁니다.", "active request uniqueness/cancellation과 expected version이 없습니다.", ["requests by account/purpose", "created/cancelled times", "conditional update", "token-request FK"], "새 요청 시 old active workflow를 atomic cancel하거나 one-active constraint를 두고 apply에 version/status guard를 사용합니다.", "old/new link race와 resend policy tests를 둡니다."),
    ],
    expertNotes: ["request public correlation id와 DB PK/token digest는 서로 다른 exposure boundary입니다.", "APPLIED transition만 current account identity의 source of truth를 변경합니다."],
  },
  {
    id: "security-vs-activity-audit-minimization",
    title: "security audit와 product activity log를 목적·무결성·PII 최소화로 나눕니다",
    lead: "login_identifier, input_identifier, target_email, query_string, IP와 user-agent를 무제한 저장하면 보안 분석 table 자체가 고가치 개인정보 저장소가 됩니다.",
    explanations: [
      "security event는 credential 변경·reset·verification·deny·admin action처럼 조사/경보가 필요한 사건이며 restricted access, stable reason code, actor/subject opaque ids, occurred_at와 correlation id를 가집니다.",
      "activity event는 product/운영 분석 목적의 route/action category와 latency/status입니다. full query string, referer, handler detail과 arbitrary message를 기본 저장하지 않고 allow-listed normalized route/code만 사용합니다.",
      "실패 identifier/email은 enumeration 조사에 유용하지만 raw 저장은 위험합니다. keyed pseudonymous digest, prefix-free category와 short retention을 사용하고 security team access/audit를 제한합니다.",
      "IP/user-agent/session은 개인정보/온라인 identifier일 수 있습니다. 목적·법적 근거·retention을 정하고 truncation/pseudonymization/rotation을 적용하며 fingerprinting 목적으로 무단 결합하지 않습니다.",
      "audit tamper evidence는 append-only permissions, immutable storage/export sequence와 gap detection으로 강화합니다. application admin도 UPDATE/DELETE할 수 없게 writer/reader/retention roles를 분리합니다.",
    ],
    concepts: [
      c("security event", "인증·credential·권한에 관한 조사 가능한 상태 변화/시도 기록입니다.", ["stable codes와 actors를 가집니다.", "restricted retention/access를 적용합니다."]),
      c("activity event", "제품 사용과 성능을 이해하기 위한 최소화된 행동 category 기록입니다.", ["보안 원장과 분리합니다.", "raw request data를 피합니다."]),
      c("pseudonymous digest", "원문 없이 같은 입력의 제한적 correlation을 가능하게 하는 keyed digest입니다.", ["여전히 개인정보일 수 있습니다.", "key rotation과 retention을 둡니다."]),
    ],
    diagnostics: [
      d("로그 export에 email과 reset token이 포함됩니다.", "범용 detail/query/identifier 필드에 raw request를 직렬화했습니다.", ["event schemas", "logging middleware", "exports/backups", "access/retention"], "allow-listed codes/opaque ids만 저장하고 raw secrets/PII redaction을 source에서 강제해 노출 데이터를 purge/rotate합니다.", "canary secret/PII pattern scan과 export contract test를 둡니다."),
      d("보안 사건 조사에서 누가 audit를 수정했는지 모릅니다.", "application role에 audit UPDATE/DELETE가 있고 sequence/gap evidence가 없습니다.", ["DB grants", "update/delete logs", "event ids/hash chain/export", "clock source"], "append-only writer와 separate reader/retention roles, immutable export/gap alert를 사용합니다.", "unauthorized mutation negative tests와 restore integrity drill을 둡니다."),
    ],
    expertNotes: ["관측 가능성과 raw 데이터 최대 수집은 같은 뜻이 아닙니다.", "실패 reason code도 account existence를 외부 response로 누설하지 않도록 내부/외부 taxonomy를 분리합니다."],
  },
  {
    id: "fk-retention-erasure-pseudonymization",
    title: "FK delete action·retention·erasure·backup 잔존을 함께 설계합니다",
    lead: "ON DELETE CASCADE는 편리하지만 보안 audit를 지우고, SET NULL만으로는 복제된 raw identifier가 삭제되지 않습니다.",
    explanations: [
      "credential/token처럼 account 없이는 의미·보존 근거가 없는 data는 cascade/short retention, security ledger는 subject FK SET NULL과 separately minimized evidence, activity logs는 목적 기간 뒤 partition drop 등 경계별 정책을 둡니다.",
      "erasure는 account row DELETE 하나가 아니라 identity bindings, raw/canonical email, profile, sessions, tokens, free text/logs, caches/search/exports와 downstream processors를 포함한 lineage workflow입니다.",
      "audit를 보존해야 하면 opaque erased_subject_ref 또는 keyed pseudonym을 남기되 재식별 key access/retention을 제한합니다. raw email/nickname/IP를 남긴 채 user_idx만 NULL로 만드는 것을 anonymization이라 부르지 않습니다.",
      "legal hold, fraud/security retention과 사용자 삭제 권리를 조직 정책/법률 검토로 결정합니다. schema는 hold scope, retention_until, erased_at와 policy version을 지원하고 engineer가 임의 기간을 정하지 않습니다.",
      "backup은 즉시 row-level 삭제가 어려울 수 있으므로 immutable backup expiry/access, restore 후 erasure replay/tombstone과 downstream deletion ledger를 문서화합니다. 복구가 삭제된 PII를 다시 활성화하지 않게 합니다.",
    ],
    concepts: [
      c("retention class", "목적·법적 근거·최대 보존기간과 disposal method가 같은 데이터 묶음입니다.", ["table/partition 설계를 이끕니다.", "policy version을 가집니다."]),
      c("erasure workflow", "subject data lineage 전체에서 삭제·익명화·processor 통지를 추적하는 상태 기계입니다.", ["idempotent/restartable해야 합니다.", "backup restore를 포함합니다."]),
      c("pseudonymization", "추가 정보 없이는 subject에 귀속하기 어렵게 identifier를 대체하는 처리입니다.", ["익명화와 다릅니다.", "key/access가 통제 대상입니다."]),
    ],
    codeExamples: [py("db18-erasure-boundary", "account 삭제 뒤 credential 제거와 최소 audit 보존", "db18_erasure.py", "FK CASCADE/SET NULL을 켜고 raw identity 없이 security reason만 보존되는 synthetic erasure boundary를 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, email_key TEXT)")
db.execute("CREATE TABLE credential(id INTEGER PRIMARY KEY, account_id INTEGER REFERENCES account(id) ON DELETE CASCADE, verifier TEXT)")
db.execute("CREATE TABLE security_event(id INTEGER PRIMARY KEY, account_id INTEGER REFERENCES account(id) ON DELETE SET NULL, event_code TEXT NOT NULL)")
db.execute("INSERT INTO account VALUES (1, 'synthetic@example.test')")
db.execute("INSERT INTO credential VALUES (10, 1, 'SYNTHETIC-VERIFIER')")
db.execute("INSERT INTO security_event VALUES (20, 1, 'CREDENTIAL_CREATED')")
db.execute("DELETE FROM account WHERE id=1")
print("accounts=" + str(db.execute("SELECT count(*) FROM account").fetchone()[0]))
print("credentials=" + str(db.execute("SELECT count(*) FROM credential").fetchone()[0]))
event = db.execute("SELECT account_id,event_code FROM security_event").fetchone()
print("event-account=" + (str(event[0]) if event[0] is not None else "NULL"))
print("event-code=" + event[1])
print("raw-email-in-event=false")`, "accounts=0\ncredentials=0\nevent-account=NULL\nevent-code=CREDENTIAL_CREATED\nraw-email-in-event=false", ["mysql-foreign-keys", "oracle-constraints", "sqlite-foreign-keys", "sqlite-create-table"])],
    diagnostics: [
      d("account DELETE 후 security/activity rows의 raw email은 남습니다.", "FK만 SET NULL하고 denormalized PII columns를 erasure lineage에서 누락했습니다.", ["schema PII inventory", "rows by subject correlation", "free text/exports", "backup/caches"], "raw PII 복제를 제거하고 필요한 legacy columns를 erasure job에서 purge/pseudonymize합니다.", "synthetic subject deletion 후 schema-wide PII absence test를 둡니다."),
      d("backup restore 후 삭제된 계정이 다시 나타납니다.", "restore 과정에 erasure tombstone/replay가 없습니다.", ["backup snapshot time", "deletion ledger", "restore runbook", "downstream replay watermark"], "restore access를 격리하고 backup 이후 erasure ledger를 재적용한 뒤 traffic을 엽니다.", "정기 restore+erasure replay drill과 deleted-subject canary를 둡니다."),
    ],
    expertNotes: ["FK action은 retention 결정을 자동으로 대신하지 않습니다.", "삭제/보존 정책은 법률 자문이 필요한 조직 결정이며 교재 schema는 policy evidence와 execution을 지원합니다."],
  },
  {
    id: "activity-partition-index-query",
    title: "고용량 activity/security event를 시간 partition·query-shaped index로 운영합니다",
    lead: "USER_ACTIVITY_LOG의 많은 단일/복합 indexes는 쓰기 비용을 키우고 request_uri 같은 긴 문자열 index가 실제 조사 query를 돕지 않을 수 있습니다.",
    explanations: [
      "먼저 access patterns를 정의합니다. account 최근 security events, request_id trace, event code 시간 범위, retention purge와 aggregate counts가 핵심이면 `(account_id,occurred_at)`, `(event_code,occurred_at)`와 unique/public correlation을 workload로 검증합니다.",
      "created_at range partition은 retention class와 volume이 충분할 때 partition pruning/drop을 돕습니다. 모든 unique key에 partition key가 필요한 dialect 제약, late events와 global lookup을 검토하고 작은 table에는 불필요한 complexity를 피합니다.",
      "긴 query_string/referer/user_agent를 index하거나 보존하지 않습니다. normalized route/template, coarse client class와 allow-listed activity code를 dimension/id로 저장하고 raw diagnostic은 short-lived restricted system으로 분리합니다.",
      "partial/function/generated index로 active verification request/token만 빠르게 찾을 수 있지만 engine semantics가 다릅니다. MySQL generated active key, Oracle function-based index, SQLite partial index를 같은 logical fixture로 conformance합니다.",
      "EXPLAIN actual/pruning, rows/loops, index bytes, insert latency, page splits와 purge/partition drop time을 대표 분포와 concurrency에서 측정합니다. 중복/unused indexes를 정기 제거합니다.",
    ],
    concepts: [
      c("retention partition", "같은 기간의 event rows를 물리적으로 묶어 pruning과 빠른 lifecycle disposal을 돕는 구조입니다.", ["policy와 경계를 맞춥니다.", "unique/FK dialect 제약을 검토합니다."]),
      c("query-shaped index", "실제 equality/range/order pattern과 selectivity에 맞춘 최소 composite index입니다.", ["write/storage 비용을 측정합니다.", "긴 raw PII 열을 피합니다."]),
      c("active-row index", "현재 유효한 workflow/token subset만 빠르게 찾도록 만든 partial/generated/function-based index pattern입니다.", ["engine별 구현이 다릅니다.", "state transition과 coupling됩니다."]),
    ],
    codeExamples: [py("db18-active-index", "active token partial index와 query plan", "db18_active_index.py", "SQLite partial index가 unused/uncancelled token lookup에 사용되고 consumed row는 제외되는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE token(id INTEGER PRIMARY KEY, digest TEXT, purpose TEXT, consumed_at INTEGER, cancelled_at INTEGER)")
db.execute("CREATE UNIQUE INDEX token_active_digest_idx ON token(digest) WHERE consumed_at IS NULL AND cancelled_at IS NULL")
db.executemany("INSERT INTO token VALUES (?, ?, ?, ?, ?)", [
    (1, "D-ACTIVE", "EMAIL", None, None),
    (2, "D-USED", "EMAIL", 100, None),
    (3, "D-CANCEL", "EMAIL", None, 101),
])
plan = db.execute("EXPLAIN QUERY PLAN SELECT id FROM token WHERE digest=? AND consumed_at IS NULL AND cancelled_at IS NULL", ("D-ACTIVE",)).fetchall()
active = [row[0] for row in db.execute("SELECT id FROM token WHERE consumed_at IS NULL AND cancelled_at IS NULL ORDER BY id")]
print("active=" + ",".join(map(str, active)))
print("uses-index=" + str(any("token_active_digest_idx" in row[3] for row in plan)).lower())
print("all-rows=" + str(db.execute("SELECT count(*) FROM token").fetchone()[0]))
print("indexed-policy=unused-and-uncancelled")`, "active=1\nuses-index=true\nall-rows=3\nindexed-policy=unused-and-uncancelled", ["mysql-create-index", "mysql-partitioning", "oracle-create-index", "sqlite-partial-index", "sqlite-create-index"])],
    diagnostics: [
      d("로그 insert latency가 index 추가마다 증가합니다.", "access evidence 없이 많은 low-selectivity/긴 문자열 indexes를 유지합니다.", ["index usage/size", "write latency/page splits", "query predicates", "duplicate prefixes"], "핵심 investigation/retention queries에 필요한 최소 composite indexes만 actual workload로 채택합니다.", "read/write/storage budget과 unused-index review를 둡니다."),
      d("retention DELETE가 오래 lock하고 storage를 즉시 회수하지 못합니다.", "고용량 event를 row-by-row 삭제하며 time lifecycle과 물리 구조가 맞지 않습니다.", ["volume/time distribution", "partition boundaries", "FK/global indexes", "delete/undo/replica lag"], "법적 retention과 맞는 time partitions/batched purge를 설계하고 dialect 제약을 rehearsal합니다.", "partition drop/purge load와 replica/storage recovery SLO를 둡니다."),
    ],
    expertNotes: ["partition은 index/retention 설계를 대신하지 않으며 충분한 volume과 lifecycle 근거가 있을 때 사용합니다.", "activity analytics에는 raw event보다 privacy-preserving aggregates와 definition/watermark를 우선합니다."],
  },
  {
    id: "migration-concurrency-security-operations",
    title: "USERS schema를 digest·state·retention 모델로 무중단 이관하고 복구합니다",
    lead: "token/identifier 열을 in-place 변경하면 live links, concurrent login, duplicate email과 old application이 동시에 깨질 수 있습니다.",
    explanations: [
      "migration은 inventory/PII classification→new nullable canonical/digest/state columns/tables→chunked backfill→collision/orphan mapping→dual write/read→constraints validate→canary→cutover→old raw columns purge 순서로 진행합니다.",
      "기존 raw token을 digest로 backfill하는 동안 application이 raw/digest 두 lookup을 지원하되 new issuance는 digest-only로 합니다. 짧은 TTL 뒤 old raw live tokens가 모두 expire/revoke되면 raw column과 logs/backups retention을 종료합니다.",
      "email canonical uniqueness는 duplicate accounts를 자동 merge하지 않습니다. verified credential, social bindings, security risk, ownership proof와 sessions를 restricted workflow에서 해결하고 merge event/rollback을 기록합니다.",
      "concurrent login/link/verify/apply/delete에서 DB unique와 conditional transition을 arbitration으로 둡니다. online index/constraint build, lock timeout, replica lag와 rollback artifact를 MySQL·Oracle matrix에서 rehearsal합니다.",
      "운영에는 credential/token/security/activity schema drift, active/expired/consumed counts, consume conflict/replay, login success/failure category, partition age, erasure lag와 backup restore+deletion replay를 privacy-safe하게 관측합니다.",
    ],
    concepts: [
      c("dual lookup", "migration 기간 old/new identifier 또는 token representation을 안전한 순서로 함께 조회하는 compatibility 단계입니다.", ["new writes는 new format을 우선합니다.", "종료 조건을 둡니다."]),
      c("security migration", "credential/PII representation을 active sessions/tokens와 공격면을 관리하며 교체하는 versioned rollout입니다.", ["raw secret exposure window를 줄입니다.", "rollback과 rotation을 포함합니다."]),
      c("erasure replay", "backup/restore 또는 downstream 재구축 뒤 삭제 ledger를 재적용해 이미 삭제된 subject를 다시 제거하는 절차입니다.", ["traffic 전 gate입니다.", "watermark를 기록합니다."]),
    ],
    diagnostics: [
      d("digest migration 뒤 기존 인증 link가 모두 실패합니다.", "live raw token TTL/dual lookup/reissue 계획 없이 column을 교체했습니다.", ["token issue/expiry distribution", "old/new lookup", "application versions", "raw column/logs"], "new tokens는 digest-only로 발급하고 TTL 동안 controlled dual lookup 후 old tokens revoke/expire와 raw purge를 진행합니다.", "old/new link canary와 expiry-boundary rollback test를 둡니다."),
      d("email canonical backfill이 중간에 멈춰 일부 로그인만 실패합니다.", "restartable batch/watermark와 null fallback, collision quarantine가 없습니다.", ["backfill high-watermark", "null/v1/v2 counts", "collision table", "dual read order"], "idempotent key-range batch와 collision quarantine, per-batch reconciliation을 사용해 재시작합니다.", "kill/restart fault test와 account-by-account lookup parity를 둡니다."),
    ],
    expertNotes: ["보안 migration은 data conversion과 live credential attack surface 전환을 함께 다룹니다.", "복구 완료는 DB consistency뿐 아니라 erasure replay, key availability와 active token/session 정책 readback까지입니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-users", repository: "dbstudy", path: "USERS.sql", usedFor: ["account/social/login/security/activity/email verification schema and migration progression"], evidence: "read-only로 402 logical lines를 확인했으며 sample identifiers, emails, tokens, IPs, user agents and messages는 복사하지 않았습니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["account, credential, event keys and constraints"], evidence: "MySQL 공식 CREATE TABLE 문서입니다." },
  { id: "mysql-foreign-keys", repository: "MySQL 8.4 Reference Manual", path: "FOREIGN KEY Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html", usedFor: ["delete actions and lifecycle integrity"], evidence: "MySQL 공식 FK 문서입니다." },
  { id: "mysql-create-index", repository: "MySQL 8.4 Reference Manual", path: "CREATE INDEX Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-index.html", usedFor: ["canonical, active and event indexes"], evidence: "MySQL 공식 CREATE INDEX 문서입니다." },
  { id: "mysql-charset", repository: "MySQL 8.4 Reference Manual", path: "Character Sets and Collations in General", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/charset-general.html", usedFor: ["identifier collation and canonicalization"], evidence: "MySQL 공식 charset/collation 문서입니다." },
  { id: "mysql-transaction", repository: "MySQL 8.4 Reference Manual", path: "START TRANSACTION, COMMIT, and ROLLBACK", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["single-use token and identity apply atomicity"], evidence: "MySQL 공식 transaction 문서입니다." },
  { id: "mysql-partitioning", repository: "MySQL 8.4 Reference Manual", path: "Overview of Partitioning", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/partitioning-overview.html", usedFor: ["activity retention partitioning"], evidence: "MySQL 공식 partitioning 문서입니다." },
  { id: "mysql-encryption", repository: "MySQL 8.4 Reference Manual", path: "InnoDB Data-at-Rest Encryption", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-data-encryption.html", usedFor: ["credential/PII storage and backup protection"], evidence: "MySQL 공식 data-at-rest encryption 문서입니다." },
  { id: "oracle-create-table", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-TABLE.html", usedFor: ["Oracle identity/event table portability"], evidence: "Oracle 공식 CREATE TABLE 문서입니다." },
  { id: "oracle-constraints", repository: "Oracle Database 26ai SQL Language Reference", path: "constraint", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/constraint.html", usedFor: ["Oracle unique/FK/check portability"], evidence: "Oracle 공식 constraint 문서입니다." },
  { id: "oracle-create-index", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE INDEX", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-INDEX.html", usedFor: ["function-based active/identifier indexes"], evidence: "Oracle 공식 CREATE INDEX 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["exact identity/token schema harness"], evidence: "SQLite 공식 CREATE TABLE 문서입니다." },
  { id: "sqlite-foreign-keys", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["exact erasure boundary harness"], evidence: "SQLite 공식 FK 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["exact consume/apply transaction harness"], evidence: "SQLite 공식 transaction 문서입니다." },
  { id: "sqlite-create-index", repository: "SQLite Documentation", path: "CREATE INDEX", publicUrl: "https://www.sqlite.org/lang_createindex.html", usedFor: ["exact unique and query plan harness"], evidence: "SQLite 공식 CREATE INDEX 문서입니다." },
  { id: "sqlite-partial-index", repository: "SQLite Documentation", path: "Partial Indexes", publicUrl: "https://www.sqlite.org/partialindex.html", usedFor: ["active token index laboratory"], evidence: "SQLite 공식 partial index 문서입니다." },
  { id: "python-secrets", repository: "Python 3 Standard Library", path: "secrets", publicUrl: "https://docs.python.org/3/library/secrets.html", usedFor: ["cryptographically strong token generation guidance"], evidence: "Python 공식 secrets 문서입니다." },
  { id: "python-hashlib", repository: "Python 3 Standard Library", path: "hashlib", publicUrl: "https://docs.python.org/3/library/hashlib.html", usedFor: ["message digest harness and caveats"], evidence: "Python 공식 hashlib 문서입니다." },
  { id: "python-hmac", repository: "Python 3 Standard Library", path: "hmac", publicUrl: "https://docs.python.org/3/library/hmac.html", usedFor: ["keyed token digest and comparison"], evidence: "Python 공식 hmac 문서입니다." },
  { id: "rfc5321", repository: "IETF", path: "RFC 5321 Simple Mail Transfer Protocol", publicUrl: "https://datatracker.ietf.org/doc/html/rfc5321", usedFor: ["email mailbox transport and local/domain semantics"], evidence: "IETF 공식 RFC 문서입니다." },
  { id: "rfc5322", repository: "IETF", path: "RFC 5322 Internet Message Format", publicUrl: "https://datatracker.ietf.org/doc/html/rfc5322", usedFor: ["email address syntax context"], evidence: "IETF 공식 RFC 문서입니다." },
  { id: "rfc9106", repository: "IETF", path: "RFC 9106 Argon2", publicUrl: "https://datatracker.ietf.org/doc/html/rfc9106", usedFor: ["memory-hard password hashing primitive"], evidence: "IETF 공식 RFC 문서입니다." },
  { id: "nist-800-63b", repository: "NIST", path: "SP 800-63B Authentication and Authenticator Management", publicUrl: "https://pages.nist.gov/800-63-4/sp800-63b.html", usedFor: ["password, recovery and authenticator lifecycle"], evidence: "NIST 공식 digital identity guideline입니다." },
];

const session = createExpertSession({
  inventoryId: "db-18-user-auth-schema", slug: "db-18-user-auth-schema", courseId: "database", moduleId: "db-project-schema-portability", order: 2,
  title: "회원·이메일 검증·활동 로그 스키마 설계", subtitle: "회원 DDL을 canonical identity·credential·digest token·single-use workflow·최소 감사·retention·erasure까지 검증된 인증 data architecture로 확장합니다.", level: "고급", estimatedMinutes: 1120,
  coreQuestion: "회원·social·email 인증·보안/활동 이력을 중복 identity, token replay, 개인정보 과수집과 삭제 후 잔존 없이 설계하고 migration·동시성·복구 뒤에도 증명하려면 무엇을 고정해야 할까요?",
  summary: "USERS.sql의 account/social/login history, verification token/request, security history와 activity log progression을 read-only로 감사합니다. account principal·identifier·credential·verification·security/activity boundaries, display/canonical identifier와 Unicode/email policy, optional UNIQUE NULL과 provider-subject key, password verifier/account/session lifecycle, raw token 대신 HMAC digest·expiry·atomic single-use·purpose binding, request VERIFIED/APPLIED state와 concurrent apply, privacy-minimized append-only audit/activity, FK retention/erasure/backup replay, time partition/query-shaped/active indexes, digest/canonical expand-contract migration·collision·recovery operations까지 전문가 수준으로 통합합니다. 여섯 exact Python/SQLite examples는 canonical email, nullable/social unique, token single-use, verify/apply, erasure boundary와 active index를 실행합니다.",
  objectives: ["account, identifier, credential, verification, security와 activity grains를 분리한다.", "versioned canonical lookup key와 email/Unicode/collation policy를 설계한다.", "optional UNIQUE NULL과 provider-subject identity binding을 검증한다.", "password/session/account lifecycle과 secret storage boundary를 설명한다.", "token digest·expiry·purpose·atomic single-use와 request state를 구현한다.", "audit minimization, FK retention, erasure와 backup replay를 운영한다.", "partition/index, concurrency, secure migration와 engine conformance를 검증한다."],
  prerequisites: [{ title: "극장·상영관·예약 스키마 SQL 종합 과제", reason: "grain·key·transaction·migration·recovery 종합 설계를 보안 identity domain에 적용합니다.", sessionSlug: "db-17-theater-capstone" }],
  keywords: ["identity schema", "social login", "canonical email", "UNIQUE NULL", "provider subject", "password hashing", "token digest", "expiry", "single use", "verification state", "security audit", "activity log", "retention", "erasure", "partition", "migration"], topics,
  lab: {
    title: "회원 인증 schema v2를 digest·state·privacy·erasure 모델로 이관하기",
    scenario: "기존 schema가 raw email/token/identifier/IP/query를 여러 tables에 저장하고 boolean 상태가 분산돼 있습니다. live social/password/email flows를 유지하며 canonical identity, single-use token, 최소 audit와 삭제/복구를 도입해야 합니다.",
    setup: ["실제 이름/email/token/IP 없이 synthetic principal/provider/request keys와 collision/replay/expiry fixtures를 만듭니다.", "MySQL 8.4·Oracle 26ai 격리 schemas와 SQLite exact harness를 준비합니다.", "column-level PII/secret purpose·owner·access·retention·erasure inventory를 작성합니다.", "identity/credential/request/token/event grains, states, keys와 allowed transitions를 고정합니다."],
    steps: ["display/canonical identifier v1/v2 corpus와 DB collation/unique results를 비교합니다.", "optional ID/email NULL, provider-subject binding과 concurrent link conflict를 검증합니다.", "password verifier metadata, account/credential/session deny-by-default truth table를 실행합니다.", "CSPRNG issuance design과 digest-only storage/read roles/log secret scan을 검증합니다.", "expiry/replay/two-connection atomic consume와 purpose/subject binding을 테스트합니다.", "request cancel/verify/apply/email unique conflict와 fault-injected transaction parity를 검증합니다.", "security/activity schemas에서 raw identifiers/query/secret 부재와 append-only grants를 확인합니다.", "account delete/erasure에서 credentials/tokens/caches/exports와 retained pseudonymous audit를 검사합니다.", "active/event queries의 index/partition pruning, write/storage/purge budgets를 actual plans로 측정합니다.", "dual canonical/digest migration, collision quarantine, restore+erasure replay와 rollback을 rehearsal합니다."],
    expectedResult: ["한 external/internal identity가 정확히 한 principal binding과 versioned canonical key로 판정됩니다.", "token은 raw 저장 없이 valid window에서 한 purpose/subject에 정확히 한 번 소비됩니다.", "security/activity events가 조사에 충분하면서 raw secret/불필요 PII를 포함하지 않습니다.", "retention/erasure/backup replay가 schema-wide subject data를 policy대로 처리합니다.", "engine별 constraint/index/partition/migration 차이가 승인되고 restore/readback이 통과합니다."],
    cleanup: ["격리 schemas/users/keys, synthetic identities/tokens/events와 migration/restore artifacts를 제거합니다.", "temporary peppers/credentials/backups/exports를 revoke·crypto-erase/삭제합니다.", "logs/fixtures에 원본 identifiers, email, tokens, IP/user-agent/detail messages가 없는지 검사합니다.", "dbstudy/USERS.sql과 production data는 변경하지 않습니다."],
    extensions: ["WebAuthn/passkey credential와 authenticator counter/backup eligibility를 모델링합니다.", "multi-tenant issuer/audience와 account linking threat model을 확장합니다.", "tamper-evident audit export와 privacy-preserving risk features를 구현합니다.", "KMS pepper rotation, backup crypto-erasure와 incident recovery를 rehearsal합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 exact examples를 실행하고 identity/token/state/privacy/index 불변식을 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "display/canonical key를 구분합니다.", "NULL과 provider-subject UNIQUE를 설명합니다.", "raw token과 stored digest를 구분합니다.", "consume/apply replay 결과를 확인합니다.", "erasure FK 결과와 retained event를 추적합니다.", "active index plan을 확인합니다."], hints: ["인증 데이터는 값 하나보다 lifecycle과 exposure boundary가 중요합니다."], expectedOutcome: "회원 인증 schema의 보안·동시성·privacy 계약을 실행 결과로 설명합니다.", solutionOutline: ["separate→canonicalize→bind→digest→transition→minimize→erase 순서입니다."] },
    { difficulty: "응용", prompt: "USERS.sql을 production-ready auth schema v2로 무중단 이관하세요.", requirements: ["원본 PII/sample 비복사 provenance를 기록합니다.", "identity/credential/request/token/event grains를 분리합니다.", "canonical collision/social link race를 검증합니다.", "password/session policy와 digest-only token을 구현합니다.", "atomic consume/apply와 fault tests를 둡니다.", "audit minimization/retention/erasure lineage를 작성합니다.", "partition/index read-write budgets를 측정합니다.", "dual migration/restore/erasure replay/rollback을 rehearsal합니다."], hints: ["raw token을 digest로 바꾸는 migration도 live link TTL을 고려해야 합니다."], expectedOutcome: "보안·privacy·동시성·이관이 검증된 인증 data platform이 완성됩니다.", solutionOutline: ["inventory→new boundaries→dual write/read→collision/replay tests→cutover→purge/recover 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 authentication data architecture review 표준을 작성하세요.", requirements: ["principal/identifier/credential/token/event boundaries를 정의합니다.", "canonicalization/collation/UNIQUE NULL/provider key 규칙을 둡니다.", "password/token secret storage와 key rotation을 정의합니다.", "state transition/concurrency/idempotency/error taxonomy를 요구합니다.", "PII purpose/access/retention/erasure/legal hold를 기록합니다.", "partition/index/capacity/write budgets를 둡니다.", "engine migration/backup/restore/erasure replay를 포함합니다.", "negative security/privacy evidence와 incident runbook을 요구합니다."], hints: ["로그에 남겨 두면 언젠가 유용하다는 말은 목적·기간·권한을 대신하지 못합니다."], expectedOutcome: "회원 인증 schema를 전문가 수준으로 review하는 일관된 기준이 완성됩니다.", solutionOutline: ["classify→minimize→constrain→serialize→observe→erase→recover 순서입니다."] },
  ],
  nextSessions: [], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["USERS.sql 402 logical lines, 15,236 bytes, active 241 lines를 read-only로 확인했습니다. SHA-256은 A505DF70BBEEAF694C6A05DD9B7CA35DF32422C7D3D57F4E55E6E0D2835CF1FB입니다.", "원본 account/social/login/security/activity/verification schema와 alter/backfill progression만 provenance로 사용하고 sample identifiers, email, token, IP, user-agent, message values는 복사하지 않았습니다.", "raw unique token 저장, 분산 boolean/status, duplicated request/token columns와 범용 raw activity fields를 digest/state/privacy boundary 보강 대상으로 기록했습니다.", "SQLite exact examples는 production entropy/KMS, MySQL/Oracle concurrency/collation/partition/online migration, email delivery와 조직의 법적 retention 판단을 대체하지 않습니다."] },
});

export default session;
