import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(7, lineCount)}`, explanation: "실제 dump·계정·개인정보를 열거나 복사하지 않고 합성 metadata 또는 메모리 DB만 준비합니다." },
      { lines: `${Math.min(8, lineCount)}-${Math.max(8, lineCount - 6)}`, explanation: "분류·hash 검증·합성 seed·transaction migration·backup/scan 불변식을 표준 라이브러리로 실행합니다." },
      { lines: `${Math.max(1, lineCount - 5)}-${lineCount}`, explanation: "count·algorithm·boolean·checksum만 출력합니다. credential, digest, PII, host와 원문 match는 출력하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3·hashlib·secrets", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "합성 실습은 실제 MySQL·Oracle backup, redaction, transaction·recovery 의미를 대체하지 않습니다."] },
    experiments: [
      { change: "새 field class 또는 migration step을 하나 추가하고 fail-closed 분류·rollback을 실행합니다.", prediction: "분류되지 않은 field나 불완전 step은 publish·commit gate를 통과하지 못합니다.", result: "원문을 남기지 않고 category count, schema version과 checksum 차이만 evidence로 보존합니다." },
      { change: "backup 시점, batch 경계 또는 scanner rule version을 바꿉니다.", prediction: "artifact checksum과 expected manifest가 바뀌어 같은 승인 결과를 재사용할 수 없습니다.", result: "새 restore·scan evidence를 만들고 이전 temporary artifact와 credential을 폐기합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "classify-before-reading-values",
    title: "값을 읽기 전에 secret·PII·token·hash의 처리 등급을 분류합니다",
    lead: "덤프와 migration을 안전하게 다루는 첫 단계는 민감한 문자열을 찾아 화면에 보여 주는 일이 아니라 field·statement·artifact의 처리 규칙을 값과 분리해 선언하는 일입니다.",
    explanations: [
      "USERS.sql과 Trip.sql은 read-only 안전 스캐너로 구조와 pattern category의 존재만 확인했습니다. 실제 사용자 식별자, credential material, digest, contact 정보, network 표현과 INSERT literal은 출력하거나 이 학습 자료로 복사하지 않았습니다.",
      "분류표는 direct identifier, quasi-identifier, authentication secret, recovery token, password digest, authorization material, operational metadata와 public reference를 구분합니다. 이름이 비슷해도 위협·보존 기간·공개 가능 범위가 다르므로 단순히 sensitive 하나로 합치지 않습니다.",
      "schema-only artifact도 안전하다고 단정할 수 없습니다. DEFAULT, COMMENT, DEFINER, endpoint, object name, sample migration과 exception message에 값이 스며들 수 있으므로 모든 export 경로에 같은 정책을 적용합니다.",
      "처리 등급마다 read authority, in-memory use, encryption, redaction, allowed destination, retention, deletion, rotation과 incident owner를 정합니다. unclassified field는 공개 가능이 아니라 처리 중단을 뜻하는 fail-closed 상태여야 합니다.",
      "감사 결과에는 field category와 count, scanner/rule version, artifact checksum, reviewer와 판정만 남깁니다. 원문 match·주변 context·부분 마스킹 문자열도 재식별과 credential oracle이 될 수 있으므로 기본 evidence에서 제외합니다.",
    ],
    concepts: [
      c("data handling class", "값의 의미와 위험에 따라 접근·출력·보존·삭제·회전을 결정하는 정책 단위입니다.", ["column type과 다릅니다.", "unknown은 fail-closed입니다."]),
      c("secret material", "인증·서명·복구·권한 획득에 사용되어 노출 시 회전 또는 폐기가 필요한 정보입니다.", ["password digest도 보호 대상입니다.", "log·fixture에 복사하지 않습니다."]),
      c("zero-value inventory", "실제 값이나 match context를 보지 않고 field name·DDL class·count만 수집하는 감사 방식입니다.", ["checksum으로 artifact를 연결합니다.", "출력 allow-list를 사용합니다."]),
    ],
    codeExamples: [py("db20-zero-value-classifier", "field 이름만 사용하는 fail-closed 분류", "db20_classify.py", "합성 field 이름만 분류하고 category count와 values-read=0을 증명합니다.", String.raw`fields = [
    "account_id", "login_name", "credential_digest", "session_credential",
    "recovery_credential", "contact_address", "network_origin", "created_at",
]

def classify(name):
    if "credential" in name:
        return "secret"
    if name in {"login_name", "contact_address", "network_origin"}:
        return "pii"
    if name in {"account_id", "created_at"}:
        return "operational"
    return "unclassified"

counts = {kind: 0 for kind in ("secret", "pii", "operational", "unclassified")}
for field in fields:
    counts[classify(field)] += 1
print("fields=" + str(len(fields)))
print("secret=" + str(counts["secret"]))
print("pii=" + str(counts["pii"]))
print("operational=" + str(counts["operational"]))
print("unclassified=" + str(counts["unclassified"]))
print("values-read=0")`, "fields=8\nsecret=3\npii=3\noperational=2\nunclassified=0\nvalues-read=0", ["local-users", "local-trip", "oracle-redaction", "owasp-logging"])],
    diagnostics: [d("dump scan 결과에 실제 계정·contact·digest 또는 network 문자열이 보입니다.", "원문 grep이나 match context 출력을 분류 전에 수행했고 구조 정보는 안전하다고 가정했습니다.", ["terminal/CI artifact history", "scanner output allow-list", "field classification coverage", "access audit와 cache"], "출력을 즉시 격리하고 노출 가능 secret을 회전한 뒤 checksum·category count만 내보내는 scanner로 다시 검사합니다.", "canary 값으로 zero-leak test를 자동화하고 unclassified field가 있으면 pipeline을 중단합니다.")],
    expertNotes: ["마스킹은 익명화가 아니며 짧거나 규칙적인 값에서는 원문을 추론하게 할 수 있습니다.", "분류표는 schema change review의 필수 입력이며 application log와 analytics export에도 재사용합니다."],
  },
  {
    id: "dump-artifact-threat-model",
    title: "덤프를 단순 파일이 아니라 실행 코드와 데이터가 결합된 고위험 artifact로 위협 모델링합니다",
    lead: "SQL dump는 table row뿐 아니라 DDL, privilege, trigger, routine, event, DEFINER와 환경 종속 option을 포함할 수 있어 열람·복원·전송 각각에 별도 통제가 필요합니다.",
    explanations: [
      "source→developer machine→CI artifact→object storage→restore target→log라는 흐름을 그리고 각 경계의 actor, credential, encryption, retention과 delete authority를 기록합니다. 한 단계라도 공개 cache나 장기 보존 artifact로 빠지면 전체 통제가 무너집니다.",
      "read-only source 보존, cryptographic checksum, byte/line/statement count와 scanner version으로 chain of custody를 만듭니다. 분석 도구가 원본을 normalize하거나 newline을 바꾸지 않도록 immutable copy와 working copy의 역할을 분리합니다.",
      "restore는 outbound network 차단, production credential 부재, 최소 privilege, CPU/disk/time limit와 disposable database에서 수행합니다. routine·trigger·event·external function·file access 가능성은 데이터 적재와 별도로 검토합니다.",
      "mysqldump나 Data Pump option은 일관성, lock, transaction, privilege, metadata 포함 범위를 바꿉니다. 명령이 성공했다는 사실만으로 point-in-time consistency와 restore 가능성이 증명되지는 않습니다.",
      "artifact registry에는 owner, purpose, source/target environment class, encryption key reference, expiry, legal hold, restore test와 destruction evidence를 둡니다. 파일명에 날짜만 적는 관행은 provenance와 만료 통제를 제공하지 못합니다.",
    ],
    concepts: [
      c("dump threat model", "dump의 생성·전송·보관·복원·폐기 경계에서 자산, actor와 공격 경로를 정리한 모델입니다.", ["SQL 실행 위험을 포함합니다.", "backup과 개발 fixture를 구분합니다."]),
      c("chain of custody", "artifact가 언제 누구에게 어떤 checksum과 권한으로 전달되었는지 추적하는 기록입니다.", ["원본 값을 기록하지 않습니다.", "변환본은 새 identity를 갖습니다."]),
      c("restore sandbox", "production network·credential과 분리된 일회성 복원 환경입니다.", ["outbound를 차단합니다.", "DDL/code review 후 적재합니다."]),
    ],
    diagnostics: [d("백업은 존재하지만 생성 옵션·시점·checksum·restore 결과를 아무도 설명하지 못합니다.", "backup을 파일 복사로만 취급하고 consistency boundary와 provenance를 기록하지 않았습니다.", ["artifact registry", "export option manifest", "source transaction state", "최근 restore rehearsal"], "새 manifest로 승인된 snapshot을 만들고 격리 target에 복원해 catalog·count·checksum을 readback합니다.", "정기 restore test와 expiry/destruction evidence를 backup SLO에 포함합니다.")],
    expertNotes: ["backup confidentiality와 restore availability는 별도 목표이며 둘 다 검증해야 합니다.", "운영 dump를 로컬 학습 fixture로 쓰지 말고 schema-only 또는 합성 seed를 새로 만듭니다."],
  },
  {
    id: "password-hash-and-token-lifecycle",
    title: "비밀번호 hash·salt·pepper와 token lifecycle을 서로 다른 계약으로 설계합니다",
    lead: "비밀번호를 암호화한다고 표현하거나 token을 hash column에 넣는 식의 모호함은 algorithm agility, compromise response와 검증 경계를 모두 흐립니다.",
    explanations: [
      "password는 복호화하는 값이 아니라 memory-hard 또는 승인된 password hashing scheme으로 검증하는 입력입니다. 저장 record에는 algorithm, cost/iteration parameters, salt와 derived output을 self-describing format으로 관리하되 문서·로그·fixture에는 실제 record를 복사하지 않습니다.",
      "salt는 사용자마다 달라야 하는 비밀이 아닌 난수이고, pepper는 DB 밖의 secret manager에 두는 선택적 방어층입니다. 두 값을 합치거나 pepper를 dump와 함께 저장하면 compromise boundary가 사라집니다.",
      "로그인 시 constant-time comparison, rate limiting, MFA·risk control과 upgrade-on-success를 결합합니다. cost를 높일 때 latency와 denial-of-service budget을 측정하며 모든 row를 한 번에 재해시하려 하지 않습니다.",
      "session·recovery·API credential은 목적, audience, scope, expiry, one-time use, revocation과 rotation이 필요합니다. plaintext를 재표시해야 하는 credential과 verifier만 보관해도 되는 token을 구분하고, 가능한 경우 저장소에는 verifier만 둡니다.",
      "노출 사고에서는 password reset, token revoke, signing key rotation, session invalidation과 audit를 각각 수행합니다. hash라는 이름이 붙었다고 회전이 불필요하거나 공개 가능해지는 것은 아닙니다.",
    ],
    concepts: [
      c("password verifier", "입력 비밀번호를 승인된 KDF와 parameter로 계산해 비교할 수 있게 저장한 record입니다.", ["복호화 대상이 아닙니다.", "algorithm agility가 필요합니다."]),
      c("pepper", "DB와 별도 신뢰 경계에 둔 선택적 서버 측 비밀값입니다.", ["salt와 다릅니다.", "회전 전략이 필요합니다."]),
      c("token lifecycle", "발급·표시·저장·사용·만료·회수·회전·감사를 목적별로 정의한 상태 전이입니다.", ["TTL만으로 충분하지 않습니다.", "scope와 audience를 최소화합니다."]),
    ],
    codeExamples: [py("db20-pbkdf2-verifier", "digest를 출력하지 않는 PBKDF2 검증 실습", "db20_verifier.py", "명백한 합성 입력과 고정 lab salt로 verifier를 계산하되 algorithm·parameter·길이·검증 결과만 출력합니다.", String.raw`import hashlib
import secrets

candidate = b"training-passphrase-only"
wrong = b"different-training-input"
salt = bytes.fromhex("00112233445566778899aabbccddeeff")
iterations = 600_000

def derive(value):
    return hashlib.pbkdf2_hmac("sha256", value, salt, iterations, dklen=32)

stored = derive(candidate)
verified = secrets.compare_digest(derive(candidate), stored)
rejected = not secrets.compare_digest(derive(wrong), stored)
print("algorithm=pbkdf2-sha256")
print("iterations=" + str(iterations))
print("salt-bytes=" + str(len(salt)))
print("derived-bytes=" + str(len(stored)))
print("verified=" + str(verified).lower())
print("wrong-rejected=" + str(rejected).lower())
print("digest-printed=false")`, "algorithm=pbkdf2-sha256\niterations=600000\nsalt-bytes=16\nderived-bytes=32\nverified=true\nwrong-rejected=true\ndigest-printed=false", ["owasp-password", "nist-authenticators", "python-hashlib", "python-secrets"])],
    diagnostics: [d("migration이나 debug log에 실제 password verifier·recovery credential이 남습니다.", "hash는 안전하게 공개할 수 있다는 오해와 parameter/lifecycle 분리가 없는 공용 logging 때문입니다.", ["log and artifact sinks", "algorithm/cost metadata", "token purpose/expiry/revocation", "secret manager audit"], "출력을 삭제·격리하고 영향을 받은 credential을 목적별로 revoke/reset하며 verifier format과 logging contract를 분리합니다.", "민감 field serialization deny-list, structured redaction test와 upgrade-on-login policy를 둡니다.")],
    expertNotes: ["이 PBKDF2 실습은 parameter record와 constant-time compare 구조를 보여 주며 환경별 password hashing 선택을 대신하지 않습니다.", "실제 verifier를 테스트 fixture로 재사용하지 말고 합성 account와 새 parameter로 생성합니다."],
  },
  {
    id: "redaction-and-safe-observability",
    title: "redaction을 문자열 치환이 아니라 구조화된 출력 계약으로 만듭니다",
    lead: "로그를 남긴 뒤 정규식으로 가리는 방식은 serialization, exception, multiline SQL, binary encoding과 새 field에서 반복적으로 실패하므로 source에서 안전한 event를 구성해야 합니다.",
    explanations: [
      "allow-listed event schema에는 run id, migration id, artifact checksum prefix가 아닌 승인된 opaque reference, statement class, batch number, duration, affected count, status와 error class만 둡니다. query text, bind values, row samples와 connection string은 기본 제외합니다.",
      "field-level redaction은 remove, fixed replacement, tokenize, bucket, hash와 aggregate 중 목적에 맞게 선택합니다. key 없는 일반 hash는 작은 domain에서 역산 가능하고 동일인 correlation을 만들 수 있어 익명화로 간주하지 않습니다.",
      "exception handler는 driver message와 nested cause가 SQL/bind/endpoint를 포함할 수 있음을 가정합니다. 사용자 메시지, operator detail과 restricted forensic record를 분리하고 forensic 접근에는 별도 승인·짧은 retention을 적용합니다.",
      "metric label에 account, query, table row value 또는 unbounded error message를 넣으면 privacy와 cardinality 문제가 함께 생깁니다. bounded enum과 count/histogram을 사용하고 trace baggage 전파 범위를 검사합니다.",
      "redaction test는 representative secret classes와 Unicode, quoting, multiline, encoded form을 canary로 주입해 모든 sink에서 원문과 부분 문자열이 0회인지 확인합니다. 새 schema field가 추가되면 분류 없이는 build가 실패해야 합니다.",
    ],
    concepts: [
      c("safe event schema", "운영에 필요한 비민감 count·state·duration·error class만 허용하는 구조화 로그 계약입니다.", ["raw SQL을 제외합니다.", "versioning이 필요합니다."]),
      c("tokenization", "원문 대신 제한된 vault mapping의 대체 식별자를 사용하는 처리입니다.", ["접근 통제가 필요합니다.", "익명화와 다릅니다."]),
      c("redaction canary", "log·trace·artifact sink 누출을 자동 검출하기 위해 합성한 명백한 테스트 표식입니다.", ["실제 secret을 쓰지 않습니다.", "부분 match도 검사합니다."]),
    ],
    diagnostics: [d("application log는 가려졌지만 trace, CI annotation 또는 driver exception에 bind 값이 남습니다.", "stdout 한 sink만 검사했고 nested exception·telemetry exporter·artifact를 threat model에서 빠뜨렸습니다.", ["all configured exporters", "exception serialization", "CI annotations/artifacts", "metric labels와 baggage"], "sink inventory를 만들고 source allow-list event로 교체한 뒤 canary로 전체 경로 zero-match를 검증합니다.", "관측성 schema review와 data-class lint를 release gate로 둡니다.")],
    expertNotes: ["마스킹된 마지막 몇 글자도 낮은 entropy identifier에서는 식별 가능할 수 있습니다.", "감사 가능성은 원문 보관량이 아니라 승인·변경·count·state evidence의 연결성에서 나옵니다."],
  },
  {
    id: "deterministic-synthetic-seeds",
    title: "운영 복사본 대신 결정적 합성 seed와 invariant fixture를 만듭니다",
    lead: "재현 가능한 테스트 데이터는 실제 row를 익명화한 사본이 아니라 schema invariant와 분포를 의도적으로 표현하는 합성 생성 규칙이어야 합니다.",
    explanations: [
      "fixture specification에는 entity counts, key/cardinality, null/duplicate/skew boundary, time window, expected checksum과 generator version을 둡니다. 사람처럼 보이는 실제 이름이나 주소가 아니라 명백한 reserved namespace와 synthetic identifier를 사용합니다.",
      "deterministic seed는 같은 code와 version에서 같은 fixture를 만들어 migration diff를 재현합니다. 보안 token이나 cryptographic key 생성에는 사용하면 안 되며, 테스트 목적의 데이터 생성과 credential 생성 경계를 API와 review에서 분리합니다.",
      "referential integrity가 있는 graph는 parent→child dependency order, deterministic key allocation과 orphan/duplicate negative fixture를 명시합니다. 랜덤 성공 case만 많으면 중요한 constraint failure와 rollback이 검증되지 않습니다.",
      "distribution은 production row를 복사하지 않고 bucket count, quantile, null ratio와 relationship degree 같은 승인된 aggregate에서 모델링합니다. 작은 집단이나 희귀 조합은 재식별 가능성을 검토하고 coarse bucket으로 제한합니다.",
      "golden fixture는 generator source hash, seed, schema version과 expected assertions로 관리합니다. generated file 자체를 장기 보관할 필요가 없다면 CI에서 만들고 파기하며 secret scanner를 합성 fixture에도 동일 적용합니다.",
    ],
    concepts: [
      c("synthetic fixture", "실제 사람·계정·credential에서 유래하지 않고 테스트 invariant를 위해 생성한 데이터 집합입니다.", ["명백한 synthetic namespace를 씁니다.", "negative case를 포함합니다."]),
      c("deterministic seed", "같은 generator version에서 같은 순서와 결과를 재현하는 테스트 입력입니다.", ["보안 난수에 사용하지 않습니다.", "version과 함께 기록합니다."]),
      c("distribution contract", "row 복사 없이 count·null·skew·degree·boundary 특성을 재현하는 명세입니다.", ["희귀 bucket을 제한합니다.", "expected assertion을 포함합니다."]),
    ],
    codeExamples: [py("db20-deterministic-synthetic-seed", "값을 출력하지 않는 결정적 합성 fixture", "db20_seed.py", "고정 seed로 명백한 합성 identifier와 relationship을 만들고 count·uniqueness·checksum만 출력합니다.", String.raw`import hashlib
import random

rng = random.Random(20260714)
accounts = []
for index in range(12):
    synthetic_id = f"training_{rng.randrange(100000, 999999)}_{index:02d}"
    segment = (index * 3 + rng.randrange(0, 4)) % 5
    accounts.append((index + 1, synthetic_id, segment))

payload = "|".join(f"{row[0]}:{row[1]}:{row[2]}" for row in accounts).encode()
checksum = hashlib.sha256(payload).hexdigest()[:12]
print("rows=" + str(len(accounts)))
print("unique-ids=" + str(len({row[1] for row in accounts})))
print("segments=" + str(len({row[2] for row in accounts})))
print("checksum=" + checksum)
print("values-printed=false")
print("production-derived=false")`, "rows=12\nunique-ids=12\nsegments=5\nchecksum=d7c9b6156938\nvalues-printed=false\nproduction-derived=false", ["owasp-secrets", "python-secrets", "python-hashlib"])],
    diagnostics: [d("테스트 데이터가 실제 사용자처럼 보이거나 production row count와 rare combination을 그대로 재현합니다.", "익명화 label만 붙이고 provenance·reidentification risk·synthetic generation 여부를 검증하지 않았습니다.", ["fixture provenance", "reserved synthetic namespace", "rare bucket sizes", "generator seed/version"], "실제 사본을 폐기하고 invariant·aggregate distribution 기반 generator와 명백한 synthetic identifiers로 교체합니다.", "fixture PR에 production-derived=false attestation과 scanner/reidentification review를 요구합니다.")],
    expertNotes: ["deterministic는 공개 가능과 동의어가 아니며 generator 입력에 production-derived 값이 없어야 합니다.", "실패 fixture는 constraint 이름과 error class를 검증하되 rejected row 값을 로그하지 않습니다."],
  },
  {
    id: "reproducible-migration-manifest",
    title: "migration을 순서·checksum·precondition·postcondition이 있는 재현 가능한 package로 만듭니다",
    lead: "수동으로 수정한 SQL 파일과 성공 캡처만으로는 어느 환경에 무엇이 적용됐는지, 부분 실패를 어떻게 복구할지 증명할 수 없습니다.",
    explanations: [
      "각 migration에는 immutable id, parent version, source checksum, target dialect/version, owner, risk class, expected locks, transaction capability, precondition, statements, backfill checkpoints, validation, rollback/forward-fix와 compatible application range를 둡니다.",
      "schema history table은 applied id/checksum/time/tool version/status를 저장하며 실제 SQL literal이나 operator credential을 저장하지 않습니다. 같은 id의 checksum이 다르면 자동 수정하지 않고 drift incident로 중단합니다.",
      "precondition은 object existence, type/nullability, duplicate/orphan counts, free space, active transaction과 application version을 검사합니다. 이미 적용됨과 일부 적용됨을 명시적으로 구분해 idempotency라는 말로 불완전 상태를 감추지 않습니다.",
      "backfill은 stable key range, deterministic transform, bounded transaction, checkpoint와 expected count/checksum으로 재시작 가능해야 합니다. OFFSET이나 현재 시간에 의존하면 retry에서 row를 건너뛰거나 중복 처리할 수 있습니다.",
      "postcondition은 catalog definition, constraint validation, row/checksum reconciliation, query plan과 application smoke를 readback합니다. deploy command exit code보다 target state evidence를 성공 기준으로 사용합니다.",
    ],
    concepts: [
      c("migration manifest", "migration identity·checksum·dependency·pre/postcondition·recovery를 묶은 승인 단위입니다.", ["환경별 결과와 분리합니다.", "immutable합니다."]),
      c("schema drift", "승인 manifest와 실제 catalog/history/checksum이 다른 상태입니다.", ["자동 덮어쓰지 않습니다.", "원인을 조사합니다."]),
      c("checkpointed backfill", "stable key 범위별 count·checksum과 status를 기록해 안전하게 재시작하는 변환입니다.", ["batch를 작게 유지합니다.", "transform은 deterministic해야 합니다."]),
    ],
    codeExamples: [py("db20-transactional-migration", "rollback 후 재적용하는 합성 migration", "db20_migration.py", "SQLite transactional DDL에서 column 추가와 backfill을 rollback한 뒤 새 transaction으로 적용하고 postcondition을 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE work_item(id INTEGER PRIMARY KEY, title TEXT NOT NULL)")
db.executemany("INSERT INTO work_item VALUES (?,?)", [(1,"A"),(2,"BB"),(3,"CCC")])
db.commit()

db.execute("BEGIN")
db.execute("ALTER TABLE work_item ADD COLUMN state TEXT NOT NULL DEFAULT 'pending'")
db.execute("UPDATE work_item SET state='ready' WHERE id <= 2")
db.rollback()
rollback_column = "state" in {row[1] for row in db.execute("PRAGMA table_info(work_item)")}

db.execute("BEGIN")
db.execute("ALTER TABLE work_item ADD COLUMN state TEXT NOT NULL DEFAULT 'pending'")
db.execute("UPDATE work_item SET state='ready' WHERE id <= 2")
db.commit()
columns = {row[1] for row in db.execute("PRAGMA table_info(work_item)")}
rows = db.execute("SELECT id,state FROM work_item ORDER BY id").fetchall()
checksum = sum(row[0] * 10 + len(row[1]) for row in rows)
print("rollback-column=" + str(rollback_column).lower())
print("applied-column=" + str("state" in columns).lower())
print("ready=" + str(sum(row[1] == "ready" for row in rows)))
print("rows=" + str(len(rows)))
print("checksum=" + str(checksum))`, "rollback-column=false\napplied-column=true\nready=2\nrows=3\nchecksum=77", ["mysql-commit", "mysql-consistent-read", "python-sqlite3"])],
    diagnostics: [d("같은 migration id가 환경마다 다른 SQL이거나 재실행 후 일부 row만 변환됩니다.", "checksum immutability, stable checkpoint와 postcondition이 없고 수동 hotfix가 history 밖에 존재합니다.", ["migration id/checksum", "catalog/history drift", "checkpoint ranges", "expected/actual reconciliation"], "write를 중단하고 실제 state를 readback해 새 corrective migration으로 lineage를 복구하며 기존 id를 덮어쓰지 않습니다.", "immutable artifact signing, drift gate와 deterministic retry test를 CI에 둡니다.")],
    expertNotes: ["SQLite transactional DDL 성공은 MySQL·Oracle의 implicit commit과 online DDL 특성을 증명하지 않습니다.", "rollback 가능성은 syntax가 아니라 data loss, application compatibility와 target engine 동작으로 판단합니다."],
  },
  {
    id: "transaction-boundaries-and-rollback",
    title: "DDL·DML·backfill의 transaction 경계와 실패 상태를 dialect별로 명시합니다",
    lead: "BEGIN과 ROLLBACK을 파일 앞뒤에 붙였다고 모든 migration이 원자적이 되는 것은 아니며 engine·statement·tool의 autocommit 의미가 다릅니다.",
    explanations: [
      "statement matrix에 transactional DDL 여부, implicit commit 전후, lock acquisition, metadata visibility, online algorithm, retry safety와 replica effect를 target version별로 기록합니다. 문서의 일반론 대신 staging에서 실제 behavior probe를 실행합니다.",
      "data backfill은 하나의 거대한 transaction보다 bounded batch와 durable checkpoint를 사용합니다. batch key range, selected/changed/skipped/error counts와 checksum을 남기고 다음 batch는 committed checkpoint 이후에서 시작합니다.",
      "rollback plan은 down SQL만이 아닙니다. old application traffic 복구, dual-read/write flag, restore/PITR, transform inverse, event replay와 forward-fix 중 데이터 손실과 RTO/RPO를 기준으로 선택합니다.",
      "timeout과 cancellation 후 connection state를 확인하지 않고 다음 statement를 실행하면 open transaction이나 ambiguous commit이 남습니다. connection을 폐기하고 target catalog/data/history를 새 session으로 readback해야 합니다.",
      "retry는 deadlock·serialization failure처럼 transient하고 operation이 idempotent한 경우에만 bounded backoff로 수행합니다. syntax, constraint, checksum drift와 permission failure는 자동 재시도하지 않습니다.",
    ],
    concepts: [
      c("ambiguous commit", "client는 실패를 보았지만 server commit 여부를 확정할 수 없는 상태입니다.", ["재실행 전에 readback합니다.", "idempotency key가 필요할 수 있습니다."]),
      c("transaction capability matrix", "dialect/version/statement별 atomicity·implicit commit·lock·retry 특성을 기록한 표입니다.", ["실제 probe로 검증합니다.", "tool autocommit도 포함합니다."]),
      c("recovery ladder", "traffic rollback부터 forward-fix·restore/PITR까지 손실과 시간에 따라 선택하는 복구 단계입니다.", ["RTO/RPO를 사용합니다.", "정기 rehearsal이 필요합니다."]),
    ],
    diagnostics: [d("timeout 뒤 migration을 재실행했더니 duplicate object나 이중 backfill이 발생합니다.", "client error를 server rollback으로 간주했고 ambiguous commit을 catalog/history에서 readback하지 않았습니다.", ["server session/transaction", "schema history row", "target object/postcondition", "batch idempotency key"], "재시도를 멈추고 새 read-only session으로 state를 분류해 resume, corrective migration 또는 restore를 선택합니다.", "timeout fault injection과 ambiguous-commit runbook을 release rehearsal에 포함합니다.")],
    expertNotes: ["DDL lock wait 동안 application tail latency와 pool exhaustion도 migration 위험에 포함합니다.", "rollback rehearsal은 destructive target의 별도 격리 copy에서 수행하고 production dump 값을 사용하지 않습니다."],
  },
  {
    id: "backup-restore-and-key-rotation",
    title: "backup·restore·credential rotation을 하나의 복구 증거 사슬로 연결합니다",
    lead: "암호화된 backup 파일이 있다는 사실은 필요한 시점으로 복원되고 노출된 credential이 제거되며 삭제 정책까지 재적용된다는 뜻이 아닙니다.",
    explanations: [
      "backup policy는 full/incremental/log, consistency point, encryption key ownership, destination, immutability, retention, legal hold와 RPO를 정의합니다. application config나 별도 secret manager의 복구 의존성도 함께 기록합니다.",
      "restore test는 격리 target에 catalog objects, constraints, row/count checksum, schema history, application smoke와 recovery time을 검증합니다. 성공 메시지나 파일 크기만 확인하지 않습니다.",
      "backup encryption key는 data credential과 별도 lifecycle을 갖고 dual control, rotation, escrow와 disaster access를 검토합니다. key를 backup 옆 manifest에 넣거나 한 사람이 export와 decrypt 권한을 모두 갖지 않도록 합니다.",
      "노출된 database password, token 또는 signing material은 artifact 삭제만으로 해결되지 않습니다. 발급자에서 revoke/rotate하고 dependent service를 staged rollout한 뒤 이전 credential의 사용 0과 unauthorized access를 readback합니다.",
      "복원된 오래된 snapshot에는 이미 삭제된 account나 철회된 credential state가 되살아날 수 있습니다. deletion/revocation ledger를 checkpoint 이후부터 replay하고 retention cutoff와 secondary indexes를 재검증합니다.",
    ],
    concepts: [
      c("restore evidence", "backup을 격리 target에 복원해 catalog·data·application·time 목표를 검증한 기록입니다.", ["정기 갱신합니다.", "민감 row를 포함하지 않습니다."]),
      c("credential rotation", "새 credential 발급·dependent rollout·old revoke·사용 0 확인을 포함하는 상태 전이입니다.", ["파일 삭제와 다릅니다.", "rollback credential 정책이 필요합니다."]),
      c("deletion replay", "snapshot 이후의 삭제·철회 사건을 복원본에 재적용해 현재 정책 상태를 만드는 절차입니다.", ["ordered checkpoint를 씁니다.", "reconciliation합니다."]),
    ],
    codeExamples: [py("db20-backup-and-safe-scan", "backup snapshot과 원문 없는 scanner evidence", "db20_backup_scan.py", "SQLite online backup의 snapshot 차이와 합성 설정 scanner가 match 값 없이 finding count만 내는지 검증합니다.", String.raw`import re
import sqlite3

source = sqlite3.connect(":memory:")
source.execute("CREATE TABLE sample_item(id INTEGER PRIMARY KEY, state TEXT NOT NULL)")
source.executemany("INSERT INTO sample_item VALUES (?,?)", [(1,"ready"),(2,"pending")])
source.commit()
backup = sqlite3.connect(":memory:")
source.backup(backup)
source.execute("INSERT INTO sample_item VALUES (?,?)", (3,"ready"))
source.commit()

synthetic_config = 'database_credential = "<training-placeholder>"\nmode = "lab"'
finding_count = len(re.findall(r"(?im)^\s*database_credential\s*=", synthetic_config))
backup_state = backup.execute("SELECT count(*),sum(id) FROM sample_item").fetchone()
source_state = source.execute("SELECT count(*),sum(id) FROM sample_item").fetchone()
safe_event = {"run_id": "training-run", "finding_count": finding_count}
print(f"backup={backup_state[0]}:{backup_state[1]}")
print(f"source={source_state[0]}:{source_state[1]}")
print("findings=" + str(safe_event["finding_count"]))
print("logged-fields=" + str(len(safe_event)))
print("matched-value-printed=false")
print("snapshot-isolated=true")`, "backup=2:3\nsource=3:6\nfindings=1\nlogged-fields=2\nmatched-value-printed=false\nsnapshot-isolated=true", ["mysql-backup", "mysql-mysqldump", "oracle-data-pump", "github-push-protection", "owasp-secrets", "python-sqlite3"])],
    diagnostics: [d("backup restore 후 철회된 credential이나 이미 삭제된 record가 다시 활성 상태가 됩니다.", "snapshot 이후의 revocation/deletion event를 replay하지 않고 backup 시점 상태를 현재 상태로 간주했습니다.", ["backup checkpoint", "revocation/deletion ledger", "restored active credential count", "retention reconciliation"], "격리 상태를 유지하고 ledger를 순서대로 replay해 old credential 사용 0과 deletion cutoff를 검증한 뒤 traffic을 허용합니다.", "restore runbook에 rotation·deletion replay와 sentinel assertions를 필수화합니다.")],
    expertNotes: ["backup 테스트용 stdout에는 row 값 대신 count와 비민감 checksum만 사용합니다.", "push protection은 보조 방어층이며 이미 commit된 값의 revoke와 history incident 처리를 대신하지 않습니다."],
  },
  {
    id: "ci-secret-scanning-and-history-response",
    title: "CI secret scanning을 예방 gate와 이미 노출된 history 대응 절차로 분리합니다",
    lead: "scanner가 green이라는 사실은 모든 secret을 찾았다는 뜻이 아니며, red가 된 뒤 commit을 지우는 것만으로 발급자 측 위험이 사라지지도 않습니다.",
    explanations: [
      "pre-commit, pre-receive/push protection, pull request, default branch, release artifact, container image와 log storage를 서로 다른 scan 지점으로 둡니다. 각 지점은 탐지 시점과 bypass authority가 다릅니다.",
      "pattern, entropy, structured parser와 provider verification을 결합하되 실제 값을 중앙 log로 전송하지 않습니다. finding에는 opaque fingerprint, category, file/line, commit, detector version과 state만 제한적으로 보관합니다.",
      "false positive suppression은 값 자체가 아니라 rule id, safe test path, bounded scope, owner, reason와 expiry로 관리합니다. 영구 global ignore나 credential처럼 보이는 예제 문자열은 detector 품질을 떨어뜨립니다.",
      "confirmed exposure response는 contain, provider revoke/rotate, dependency rollout, access audit, history/artifact cleanup, rescan과 lessons learned 순서입니다. history rewrite는 collaborator coordination과 cache/fork limitation을 포함한 별도 변경입니다.",
      "CI는 migration artifact checksum, source classification coverage, unclassified count zero, redaction canary zero, sourceRef provenance와 generated fixture attestation도 검사해야 합니다. secret regex 하나만으로 dump 위생을 대표할 수 없습니다.",
    ],
    concepts: [
      c("push protection", "repository에 secret 가능 값을 쓰기 전에 차단하거나 명시적 bypass를 요구하는 예방 제어입니다.", ["사후 rotation을 대체하지 않습니다.", "bypass를 감사합니다."]),
      c("opaque finding fingerprint", "scanner가 원문을 저장하지 않고 동일 finding을 추적하기 위한 제한된 식별자입니다.", ["scope와 access를 제한합니다.", "공개 hash로 쓰지 않습니다."]),
      c("exposure response", "탐지 이후 revoke·rotate·감사·artifact/history 처리·재검증을 수행하는 incident 절차입니다.", ["삭제보다 회전이 먼저입니다.", "fork/cache 한계를 기록합니다."]),
    ],
    diagnostics: [d("repository에서 문자열을 삭제했는데 이전 credential 사용 흔적이 계속 나타납니다.", "history cleanup을 revoke로 오해했고 fork, CI artifact, clone과 provider state를 조사하지 않았습니다.", ["issuer revocation state", "credential last-used audit", "repository/fork/artifact scope", "dependent deployment versions"], "issuer에서 즉시 revoke/rotate하고 dependent rollout과 사용 0을 확인한 뒤 coordinated history cleanup과 전체 재검사를 수행합니다.", "short-lived scoped credential, push protection과 incident drill을 운영합니다.")],
    expertNotes: ["scanner bypass는 비상구가 아니라 expiry와 reviewer가 있는 audited exception입니다.", "탐지 정확도 지표는 원문 수집 없이 precision, time-to-revoke와 repeat class로 관리합니다."],
  },
  {
    id: "retention-governance-and-audit",
    title: "원본·변환본·backup·log의 retention과 삭제 증거를 동일한 governance로 운영합니다",
    lead: "안전하게 변환한 파일도 목적이 끝난 뒤 무기한 남으면 새로운 shadow dataset이 되므로 모든 copy의 생성 이유와 expiry가 연결되어야 합니다.",
    explanations: [
      "artifact class별 purpose, lawful/contractual basis, owner, approved location, readers, created/checkpoint time, expiry, legal hold, delete method와 verification을 registry에 둡니다. local download와 temporary CI workspace도 scope에 포함합니다.",
      "원본 dump, schema-only sanitized artifact, synthetic seed, backup, migration log와 forensic record는 서로 다른 위험과 retention을 가집니다. 변환본이라는 이유로 자동 장기 보존하지 않고 목적 제한을 다시 적용합니다.",
      "delete job은 대상 count, succeeded/failed/skipped, hold exception, secondary copy와 backup expiry를 reconciliation합니다. 개인정보를 checksum 입력으로 다시 노출하지 않고 stable internal id count와 aggregate evidence를 사용합니다.",
      "access review는 group membership뿐 아니라 service account, CI runner, object-store presigned capability, local cache와 support export를 확인합니다. 마지막 사용과 business owner가 없는 권한은 제거합니다.",
      "audit report는 정책 version, artifact opaque id, checksum, lifecycle state, 승인, scan/restore/delete result와 exception expiry를 연결합니다. 실제 sample row나 credential fragment를 증거로 붙이지 않습니다.",
    ],
    concepts: [
      c("artifact lifecycle registry", "모든 dump·변환본·backup·log의 목적·위치·owner·expiry·state를 관리하는 목록입니다.", ["temporary copy를 포함합니다.", "원문을 색인하지 않습니다."]),
      c("purpose limitation", "승인된 목적에 필요한 범위와 기간만 데이터를 처리하는 원칙입니다.", ["재사용은 새 검토가 필요합니다.", "변환본에도 적용합니다."]),
      c("deletion evidence", "대상·실행·예외·secondary/backup expiry가 정책과 일치함을 값 없이 보여 주는 결과입니다.", ["count reconciliation을 씁니다.", "hold를 별도 기록합니다."]),
    ],
    diagnostics: [d("migration은 끝났지만 developer download, CI artifact와 restore copy의 owner·expiry를 찾을 수 없습니다.", "production storage만 inventory하고 temporary/derived copy를 lifecycle registry에서 제외했습니다.", ["local/CI/object-store inventory", "artifact owner/purpose", "expiry/hold status", "destruction readback"], "새 접근을 막고 copy를 registry에 편입해 목적·hold를 검토한 뒤 승인되지 않은 artifact를 검증 가능하게 폐기합니다.", "creation API가 owner·expiry 없이는 artifact를 만들지 못하도록 policy gate를 둡니다.")],
    expertNotes: ["접근 로그 자체도 identifier와 network metadata를 포함할 수 있어 별도 retention과 redaction이 필요합니다.", "삭제 성공은 command exit code가 아니라 target과 secondary copy의 readback으로 판정합니다."],
  },
  {
    id: "secure-migration-release-runbook",
    title: "비밀값 위생을 preflight부터 rollback 이후까지 이어지는 release runbook으로 완성합니다",
    lead: "정책 문서가 있어도 실제 배포 순서와 중단 조건, 연락 책임과 증거 형식이 없으면 시간 압박 속에서 원문 출력과 unsafe retry가 반복됩니다.",
    explanations: [
      "preflight는 artifact checksum/provenance, classification coverage, unclassified zero, scanner result, temporary credential, backup restore recency, target version, schema drift, capacity, lock/replica 상태와 application compatibility를 확인합니다.",
      "execution은 run id와 approved manifest를 고정하고 batch마다 시작/종료, count/checksum, duration, checkpoint와 bounded error class만 기록합니다. operator가 편의를 위해 SELECT sample이나 environment dump를 남기지 못하도록 tooling을 제한합니다.",
      "중단 조건은 checksum mismatch, unexpected sensitive class, backup stale, lock/lag budget 초과, ambiguous commit, constraint/checksum drift와 canary leak입니다. 중단 후 새 evidence 없이 같은 command를 반복하지 않습니다.",
      "postflight는 catalog/history, constraint, count/checksum, application smoke, error/latency, replica, scanner, old credential usage와 artifact lifecycle state를 독립 read-only session에서 확인합니다.",
      "cleanup은 temporary account revoke, sandbox/data/artifact destroy, local cache와 CI log 확인, backup/deletion ledger update를 포함합니다. review에서는 실제 값을 공유하지 않고 state transition과 증거 completeness를 평가합니다.",
    ],
    concepts: [
      c("secure release gate", "민감도·backup·migration·runtime evidence가 모두 충족되어야 write를 허용하는 중단 가능한 절차입니다.", ["승인과 실행을 분리합니다.", "fail-closed입니다."]),
      c("bounded operational evidence", "원문 없이 run state·count·checksum·duration·error class만 남긴 검증 자료입니다.", ["schema가 versioned됩니다.", "retention을 가집니다."]),
      c("cleanup readback", "temporary access와 artifact가 실제로 폐기되었는지 issuer·storage·target에서 다시 확인하는 단계입니다.", ["명령 성공만 믿지 않습니다.", "owner를 기록합니다."]),
    ],
    diagnostics: [d("배포는 성공했지만 temporary credential, sandbox와 raw CI log가 그대로 남아 있습니다.", "cleanup을 선택적 마지막 단계로 두고 revoke/destroy/readback owner와 acceptance criterion을 정하지 않았습니다.", ["issuer active credentials", "sandbox/storage inventory", "CI log/artifact scan", "lifecycle registry state"], "traffic 영향과 별개로 새 접근을 막고 temporary resource를 revoke/destroy한 뒤 각 system에서 absence를 readback합니다.", "cleanup을 release success condition과 automated expiry에 포함하고 정기 game day로 검증합니다.")],
    expertNotes: ["emergency change도 evidence를 생략하지 않고 더 작은 scope와 사후 reconciliation deadline을 사용합니다.", "runbook의 screen capture에는 terminal environment나 raw query result가 들어가지 않도록 structured report를 생성합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-users", repository: "dbstudy", path: "USERS.sql", usedFor: ["seven-table identity DDL structure and sensitive-pattern-category provenance"], evidence: "read-only 안전 scanner로 DDL·constraint count와 category 존재만 확인했으며 identifier·credential·digest·PII literal은 출력하거나 복사하지 않았습니다." },
  { id: "local-trip", repository: "dbstudy", path: "Trip.sql", usedFor: ["large mixed-domain dump and embedded-data risk provenance"], evidence: "read-only 안전 scanner로 statement 종류와 risk category만 확인했으며 INSERT value·credential·PII·host match는 출력하지 않았습니다." },
  { id: "mysql-backup", repository: "MySQL 8.4 Reference Manual", path: "Backup and Recovery", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html", usedFor: ["backup strategy and restore verification"], evidence: "MySQL 공식 backup/recovery 문서입니다." },
  { id: "mysql-mysqldump", repository: "MySQL 8.4 Reference Manual", path: "mysqldump", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html", usedFor: ["logical dump option and consistency boundaries"], evidence: "MySQL 공식 mysqldump 문서입니다." },
  { id: "mysql-commit", repository: "MySQL 8.4 Reference Manual", path: "COMMIT and ROLLBACK", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["transaction boundaries and recovery"], evidence: "MySQL 공식 transaction control 문서입니다." },
  { id: "mysql-consistent-read", repository: "MySQL 8.4 Reference Manual", path: "Consistent Nonlocking Reads", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html", usedFor: ["snapshot consistency and repeatable read reasoning"], evidence: "MySQL 공식 InnoDB consistent read 문서입니다." },
  { id: "oracle-data-pump", repository: "Oracle Database 26ai Utilities", path: "Oracle Data Pump Overview", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-data-pump-overview.html", usedFor: ["Oracle export/import artifact and operation model"], evidence: "Oracle 공식 Data Pump 문서입니다." },
  { id: "oracle-redaction", repository: "Oracle Database 26ai Security Guide", path: "Oracle Data Redaction Policies", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/dbred/oracle-data-redaction-policies.html", usedFor: ["redaction policy boundaries"], evidence: "Oracle 공식 Data Redaction 문서입니다." },
  { id: "github-push-protection", repository: "GitHub Docs", path: "Push protection", publicUrl: "https://docs.github.com/en/code-security/concepts/secret-security/push-protection", usedFor: ["pre-push secret prevention and bypass governance"], evidence: "GitHub 공식 push protection 문서입니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "Secrets Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["secret lifecycle, rotation and logging controls"], evidence: "OWASP 공식 community project guidance입니다." },
  { id: "owasp-password", repository: "OWASP Cheat Sheet Series", path: "Password Storage Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", usedFor: ["password hash, salt, pepper and upgrade guidance"], evidence: "OWASP 공식 community project guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["safe observability and sensitive data exclusion"], evidence: "OWASP 공식 community project guidance입니다." },
  { id: "nist-authenticators", repository: "NIST SP 800-63B", path: "Authenticator Requirements", publicUrl: "https://pages.nist.gov/800-63-4/sp800-63b/authenticators/", usedFor: ["password verifier and authenticator lifecycle requirements"], evidence: "NIST 공식 digital identity guidance입니다." },
  { id: "python-hashlib", repository: "Python 3 Documentation", path: "hashlib", publicUrl: "https://docs.python.org/3/library/hashlib.html", usedFor: ["exact PBKDF2 and checksum laboratories"], evidence: "Python 공식 hashlib 문서입니다." },
  { id: "python-secrets", repository: "Python 3 Documentation", path: "secrets", publicUrl: "https://docs.python.org/3/library/secrets.html", usedFor: ["constant-time comparison and security-random boundary"], evidence: "Python 공식 secrets 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Documentation", path: "sqlite3", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["exact isolated transaction and backup laboratories"], evidence: "Python 공식 sqlite3 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-20-schema-migration-secret-hygiene", slug: "db-20-schema-migration-secret-hygiene", courseId: "database", moduleId: "db-project-schema-portability", order: 4,
  title: "덤프·마이그레이션·샘플 데이터의 비밀값 위생", subtitle: "실제 값을 다시 노출하지 않고 분류·합성 seed·transaction·backup·scan·rotation·retention을 검증 가능한 release 계약으로 만듭니다.", level: "전문가", estimatedMinutes: 1040,
  coreQuestion: "덤프와 migration의 구조를 학습·복구에 사용하면서 credential, PII, digest, token과 host 값이 source·log·fixture·history 어디에도 새로 노출되지 않았음을 어떻게 증명할까요?",
  summary: "dbstudy USERS.sql과 Trip.sql을 read-only safe scanner로 확인하되 실제 sample·credential·PII·digest·host 값을 한 번도 출력하거나 복사하지 않았습니다. data handling classification, dump threat model, password verifier와 token lifecycle, structured redaction, deterministic synthetic fixture, immutable migration manifest, dialect transaction/rollback, backup·restore·rotation, CI scanning/history incident response, retention governance와 secure release runbook을 처음부터 운영 수준까지 연결합니다. 다섯 exact Python examples는 zero-value classification, digest를 공개하지 않는 PBKDF2 verification, synthetic seed checksum, transactional migration rollback/reapply와 backup snapshot·safe scan evidence를 실행합니다.",
  objectives: ["값을 읽지 않는 field/artifact classification과 fail-closed policy를 만든다.", "dump 생성·전송·복원·폐기 경계와 chain of custody를 위협 모델링한다.", "password verifier, salt·pepper와 목적별 token lifecycle을 구분한다.", "raw SQL·bind·exception을 배제한 safe observability schema를 설계한다.", "production-derived row가 없는 deterministic synthetic fixture를 생성한다.", "checksum·pre/postcondition·checkpoint가 있는 migration package를 운영한다.", "dialect별 transaction·ambiguous commit·rollback/recovery ladder를 검증한다.", "backup restore, key/credential rotation과 deletion replay를 연결한다.", "CI secret scanning과 confirmed exposure incident response를 분리한다.", "모든 원본·변환본·backup·log의 retention과 cleanup readback을 증명한다."],
  prerequisites: [{ title: "여행 도메인 대형 덤프에서 경계와 관계 찾기", reason: "대형 dump를 실행하지 않고 checksum·metadata·constraint graph로 감사하는 방법을 알아야 민감 artifact를 값 없이 다룰 수 있습니다.", sessionSlug: "db-19-trip-domain-schema" }],
  keywords: ["secret hygiene", "PII classification", "password verifier", "token rotation", "redaction", "synthetic seed", "migration checksum", "transaction rollback", "backup restore", "push protection", "retention", "incident response"], topics,
  lab: {
    title: "zero-leak schema migration release rehearsal",
    scenario: "identity DDL과 대형 travel dump를 이용해 migration을 준비해야 하지만 sample row, credential, digest, contact와 network 값은 어떤 출력·fixture·artifact에도 복사할 수 없습니다.",
    setup: ["원본 두 파일을 read-only로 보존하고 checksum·statement/category count만 허용하는 scanner를 준비합니다.", "실제 값과 연동되지 않은 synthetic generator, disposable SQLite와 target-engine staging을 준비합니다.", "artifact registry, data-class matrix, migration manifest, safe event schema와 incident contact를 만듭니다.", "backup restore target와 temporary credential에 자동 expiry·outbound 차단을 적용합니다."],
    steps: ["field·statement·artifact를 secret/PII/operational/public로 값 없이 분류합니다.", "dump flow와 restore execution을 threat model링하고 chain of custody를 고정합니다.", "password verifier·token 목적/TTL/revoke/rotation과 log deny-list를 검토합니다.", "deterministic synthetic fixture의 provenance=false, counts, boundary와 checksum을 검증합니다.", "migration id/checksum/precondition/backfill checkpoint/postcondition과 compatible application range를 승인합니다.", "dialect transaction/implicit commit/lock matrix에서 partial failure와 ambiguous commit을 주입합니다.", "backup을 격리 복원하고 catalog/count/checksum, recovery time과 deletion/revocation replay를 확인합니다.", "모든 log/trace/CI artifact에 canary zero-match와 unclassified zero gate를 실행합니다.", "노출 사고를 합성해 revoke→rollout→usage-zero→history/artifact 처리 순서를 rehearsal합니다.", "temporary access·sandbox·local/CI artifact를 폐기하고 issuer/storage/registry에서 absence를 readback합니다."],
    expectedResult: ["실제 원본 값은 terminal, commit, fixture, log와 report에 0회 노출됩니다.", "다섯 exact examples의 stdout이 완전히 일치합니다.", "migration은 checksum·checkpoint·postcondition으로 재현되고 rollback/forward-fix 판단 근거가 남습니다.", "backup은 restore와 revocation/deletion replay까지 검증됩니다.", "secret scan finding과 cleanup은 opaque state/count evidence로 추적됩니다."],
    cleanup: ["temporary credential을 issuer에서 revoke하고 old usage zero를 확인합니다.", "sandbox DB, generated fixture, scan cache와 CI artifact를 run id로 파기합니다.", "원본은 변경하지 않고 승인 위치에만 두며 checksum·category count evidence만 보존합니다.", "exception과 legal hold는 owner·scope·expiry가 있는 registry state로 남깁니다."],
    extensions: ["target-engine native dump의 consistency option과 restore time을 비교합니다.", "redaction canary를 trace, metric label과 exception chain까지 확장합니다.", "schema history signing과 artifact provenance attestation을 추가합니다.", "backup restore 후 revocation/deletion ledger replay를 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 값 없는 evidence contract를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "classification values-read=0을 확인합니다.", "verifier digest가 출력되지 않음을 확인합니다.", "synthetic provenance와 checksum을 기록합니다.", "rollback 후 column absence를 readback합니다.", "backup/source snapshot 차이와 finding count만 기록합니다."], hints: ["실습 출력에 원문 대신 count, boolean, algorithm과 checksum만 남기는 이유를 먼저 설명하세요."], expectedOutcome: "secret을 예제로 복사하지 않고도 핵심 lifecycle과 migration 불변식을 검증합니다.", solutionOutline: ["classify→verify→synthesize→migrate→backup/scan 순서로 evidence를 연결합니다."] },
    { difficulty: "응용", prompt: "두 로컬 SQL artifact를 위한 zero-leak migration package를 설계하세요.", requirements: ["read-only checksum과 zero-value inventory를 둡니다.", "모든 field/artifact class와 unknown gate를 정의합니다.", "synthetic fixture generator/provenance를 작성합니다.", "migration checksum·checkpoint·postcondition을 둡니다.", "dialect transaction/rollback matrix를 작성합니다.", "backup restore와 credential/deletion replay를 검증합니다.", "CI scanner·canary·incident response를 포함합니다.", "artifact expiry와 cleanup readback을 완료합니다."], hints: ["실제 match 예시는 보고서에 필요하지 않습니다. category와 처리 state가 충분한지 검토하세요."], expectedOutcome: "원본 값을 노출하지 않는 재현 가능한 migration/recovery runbook이 완성됩니다.", solutionOutline: ["contain→classify→synthesize→manifest→rehearse→restore→scan→destroy 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 dump·migration secret hygiene 표준과 release gate를 정의하세요.", requirements: ["data handling taxonomy와 owner를 둡니다.", "dump threat model/chain of custody를 정의합니다.", "password/token lifecycle과 rotation을 분리합니다.", "safe logging schema와 canary test를 둡니다.", "synthetic-only fixture policy를 둡니다.", "immutable migration/history/checkpoint를 정의합니다.", "backup restore/RTO/RPO/deletion replay를 요구합니다.", "push protection, exposure response와 retention registry를 운영합니다."], hints: ["예방, 탐지, 대응, 복구와 폐기를 각각 독립된 evidence로 정의하세요."], expectedOutcome: "값을 덜 보면서 더 강하게 검증하는 end-to-end governance가 완성됩니다.", solutionOutline: ["policy→tooling→release gates→incident→restore→retention audit 순서입니다."] },
  ],
  nextSessions: ["db-21-mysql-oracle-portability"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["USERS.sql은 read-only safe scanner에서 7 CREATE TABLE, 8 FOREIGN KEY와 7 PRIMARY/UNIQUE/AUTO_INCREMENT 구조가 확인되었으며 실제 identifier·credential·digest 값은 출력하지 않았습니다.", "Trip.sql은 31 CREATE TABLE, 41 FOREIGN KEY와 embedded-data statement 및 민감 가능 category가 존재하는 대형 artifact로 확인했지만 실제 row·host·contact·hash·credential match는 복사하지 않았습니다.", "공개 문서는 policy와 product capability의 기준이며 조직별 법적 보존 기간·key custody·incident authority는 별도 승인해야 합니다.", "SQLite exact examples는 MySQL·Oracle의 dump consistency, implicit commit, online DDL, redaction과 recovery semantics를 대체하지 않습니다."] },
});

export default session;
