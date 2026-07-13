import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-5", explanation: "외부 server·credential·production data 없이 Python sqlite3 메모리 database와 synthetic fixture를 준비합니다. foreign key enforcement는 예제마다 명시적으로 켭니다." },
      { lines: "6-끝에서 4줄 전", explanation: "정상 state와 duplicate·orphan·range·migration 반례를 같은 transaction 경계에서 실행하고 raw vendor error 대신 invariant 판정으로 정규화합니다." },
      { lines: "마지막 4줄", explanation: "정렬된 query 결과와 stable true/false/count만 출력합니다. MySQL 8.4·Oracle 26ai의 NULL·referential action·online validation 차이는 별도 integration test 범위입니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["예제는 constraint가 어떤 invalid state를 차단하는지 exact output으로 보여 줍니다.", "SQLite 결과를 MySQL·Oracle의 오류 코드·locking·DDL semantics로 일반화하지 않고 공식 문서와 vendor tests로 보완합니다."] },
    experiments: [
      { change: "constraint 하나를 제거하고 같은 invalid fixture를 다시 실행합니다.", prediction: "이전에는 거부되던 duplicate·orphan·out-of-range state가 저장될 수 있습니다.", result: "application validation만으로 모든 writer와 race를 막을 수 없는 이유가 드러납니다." },
      { change: "두 writer가 조회 후 같은 unique key를 동시에 insert하는 상황을 만듭니다.", prediction: "둘 다 사전 조회를 통과할 수 있지만 database unique constraint는 최종 commit 경쟁에서 하나를 거부합니다.", result: "constraint violation을 expected concurrency outcome으로 번역해야 합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "constraints-as-invariants",
    title: "constraint를 schema 문법이 아니라 모든 writer가 공유하는 invariant로 봅니다",
    lead: "좋은 constraint는 잘못된 상태가 저장된 뒤 찾는 대신 transaction 경계에서 빠르게 거부하고 어떤 요구사항이 깨졌는지 이름으로 남깁니다.",
    explanations: [
      "PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK, NOT NULL은 서로 다른 invalid state를 차단합니다. 하나를 다른 것으로 대체하지 않습니다. primary key는 row identity, unique는 alternate business key, foreign key는 parent-child reference, check는 row value predicate, not null은 value presence를 담당합니다.",
      "원본 01_26.sql은 BOOKTEST tables에서 primary key 선언 위치와 ALTER 연습을 보여 주고, 01_27_SETTING.sql은 book·customer·orders와 두 foreign keys로 주문 관계를 만듭니다. unique/check/referential action과 negative fixtures는 비어 있어 이번 세션에서 그 공백을 보완합니다.",
      "application validation은 사용자에게 빠르고 문맥 있는 피드백을 주지만 다른 API·batch·migration과 concurrency race를 모두 통제하지 못합니다. database constraint는 모든 write path의 최종 state를 지키고 application은 violation을 stable domain error로 번역합니다.",
      "constraint가 많다고 자동으로 좋은 model은 아닙니다. 실제 business invariant와 연결되지 않은 과도한 restriction은 정상 workflow를 막고, 표현할 수 없는 cross-row·temporal rule을 CHECK 하나로 억지로 넣으면 portability와 진단이 나빠집니다. rule owner와 enforcement boundary를 명시합니다.",
    ],
    concepts: [
      c("integrity constraint", "database가 허용된 rows와 relationships를 제한하는 schema-level rule입니다.", ["모든 writer에 공통으로 적용됩니다.", "요구사항·이름·오류 번역·test와 추적합니다."]),
      c("defense in depth", "application validation과 database constraint가 서로 다른 failure boundary를 보완하는 설계입니다.", ["친절한 사전 오류와 race-safe 최종 판정을 나눕니다.", "constraint violation을 500으로 숨기지 않습니다."]),
    ],
    codeExamples: [py(
      "db04-constraint-matrix",
      "네 constraint가 거부하는 state를 한 matrix로 확인하기",
      "constraint_matrix.py",
      "PRIMARY/UNIQUE/FOREIGN/CHECK 위반을 raw error text 없이 stable category로 분류합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE customer (customer_id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customer(customer_id),
  amount INTEGER NOT NULL CHECK (amount > 0)
);
INSERT INTO customer VALUES (1, 'learner@example.test');
INSERT INTO orders VALUES (10, 1, 3000);
""")

cases = [
    ("primary", "INSERT INTO customer VALUES (1, 'other@example.test')"),
    ("unique", "INSERT INTO customer VALUES (2, 'learner@example.test')"),
    ("foreign", "INSERT INTO orders VALUES (11, 999, 1000)"),
    ("check", "INSERT INTO orders VALUES (12, 1, 0)"),
]
blocked = []
for name, sql in cases:
    try:
        db.execute(sql)
    except sqlite3.IntegrityError:
        blocked.append(name)

print("blocked=" + ",".join(blocked))
print("customer-count=" + str(db.execute("SELECT COUNT(*) FROM customer").fetchone()[0]))
print("order-count=" + str(db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]))
print("raw-errors-exposed=false")`,
      "blocked=primary,unique,foreign,check\ncustomer-count=1\norder-count=1\nraw-errors-exposed=false",
      ["local-db-0126", "local-db-0127-setting", "mysql-create-table", "sqlite-create-table", "sqlite-foreign-key"],
    )],
    diagnostics: [
      d("database에 invalid row가 있는데 application validation test는 모두 통과한다.", "batch·migration·다른 service가 validation을 우회했고 database constraint가 없었습니다.", ["writer inventory와 audit를 확인합니다.", "catalog의 actual constraints를 expected manifest와 비교합니다.", "invalid row count를 read-only query로 측정합니다."], "data를 quarantine/backfill하고 모든 write path를 고친 뒤 schema constraint를 validate합니다.", "negative integration test와 schema drift gate를 둡니다."),
      d("정상 요청의 constraint violation이 500과 raw SQL error로 노출된다.", "violation을 expected domain conflict/validation category로 번역하지 않았습니다.", ["constraint name·SQLState/vendor code mapping을 봅니다.", "response에 schema/table/value가 노출되는지 확인합니다.", "동시 race에서 같은 code path를 쓰는지 test합니다."], "named constraint를 stable domain error와 안전한 사용자 메시지로 변환하고 raw detail은 redacted telemetry에만 둡니다.", "constraint별 contract test와 privacy scan을 둡니다."),
    ],
    expertNotes: ["constraint metadata도 schema API이므로 이름·owner·comment·migration provenance를 관리합니다.", "eventual consistency 경계를 넘는 invariant는 local constraint 대신 idempotency·outbox·reconciliation과 compensation을 설계합니다."],
  },
  {
    id: "primary-key-identity-composite",
    title: "PRIMARY KEY를 stable·minimal·non-null row identity로 설계합니다",
    lead: "primary key는 단순 중복 방지 column이 아니라 모든 reference, index layout, cache와 audit가 row를 다시 찾는 중심 identity입니다.",
    explanations: [
      "candidate keys 중 primary key를 고를 때 uniqueness뿐 아니라 stability, minimality, width, privacy, generation ownership과 join frequency를 봅니다. 변경 가능한 email이나 외부 business code를 primary key로 쓰면 child foreign keys와 cache·event가 함께 변경됩니다.",
      "surrogate key는 stable internal reference를 제공하지만 business duplicate를 막지 않습니다. alternate candidate key를 UNIQUE로 별도 유지합니다. auto increment나 UUID 선택은 다음 세션에서 더 깊게 다루며 여기서는 생성 방식과 identity semantics를 구분합니다.",
      "composite primary key는 association relation에서 두 parents의 연결 자체가 identity일 때 자연스럽습니다. column 순서가 index prefix·foreign key·query에 영향을 주고 child가 긴 composite reference를 반복할 수 있습니다. 관계에 독립 lifecycle·외부 reference가 생기면 surrogate+unique composite를 비교합니다.",
      "InnoDB는 primary key가 physical organization과 secondary index storage에 영향을 주므로 넓고 random한 key의 비용을 workload로 측정합니다. physical trade-off 때문에 logical alternate uniqueness를 포기하지 않습니다.",
    ],
    concepts: [
      c("primary key", "각 row를 유일하고 NULL 없이 식별하는 선택된 candidate key입니다.", ["table당 하나의 primary key constraint가 있습니다.", "single 또는 composite columns로 구성할 수 있습니다."]),
      c("composite key", "둘 이상의 columns를 함께 사용해 identity나 uniqueness를 표현하는 key입니다.", ["column 순서와 NULL/type compatibility를 검토합니다.", "association relation의 중복 연결을 막는 데 유용합니다."]),
    ],
    codeExamples: [py(
      "db04-composite-primary-key",
      "association relation의 composite primary key로 중복 연결 막기",
      "composite_primary.py",
      "같은 학습자·강좌 연결은 한 번만 허용하면서 다른 강좌 연결은 허용합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE enrollment (learner_id INTEGER NOT NULL, course_id INTEGER NOT NULL, enrolled_on TEXT NOT NULL, PRIMARY KEY (learner_id, course_id))")
db.execute("INSERT INTO enrollment VALUES (1, 10, '2026-07-13')")
db.execute("INSERT INTO enrollment VALUES (1, 11, '2026-07-13')")

duplicate_blocked = False
try:
    db.execute("INSERT INTO enrollment VALUES (1, 10, '2026-07-14')")
except sqlite3.IntegrityError:
    duplicate_blocked = True

rows = list(db.execute("SELECT learner_id, course_id FROM enrollment ORDER BY learner_id, course_id"))
print("duplicate-link-blocked=" + str(duplicate_blocked).lower())
print("rows=" + ";".join(f"{a}:{b}" for a, b in rows))
print("key-columns=learner_id,course_id")
print("null-key-allowed=false")`,
      "duplicate-link-blocked=true\nrows=1:10;1:11\nkey-columns=learner_id,course_id\nnull-key-allowed=false",
      ["mysql-primary-key", "mysql-create-table", "sqlite-create-table"],
    )],
    diagnostics: [
      d("email 변경 때 수십 child tables를 cascade update해야 한다.", "변경 가능한 natural attribute를 primary reference identity로 선택했습니다.", ["foreign key graph와 update frequency를 확인합니다.", "audit/event external references를 봅니다.", "immutable candidate가 있는지 검토합니다."], "stable surrogate primary key와 email alternate UNIQUE를 단계적으로 도입합니다.", "key ADR에 stability·privacy·merge·migration criteria를 둡니다."),
      d("association table에 같은 연결이 여러 번 생긴다.", "surrogate id만 있고 relation의 natural composite uniqueness가 없습니다.", ["parent key pair별 duplicate를 집계합니다.", "관계 history인지 current set인지 확인합니다.", "soft-delete/re-enrollment semantics를 검토합니다."], "current relation이면 composite PK/UNIQUE를 추가하고 history라면 effective period와 overlap invariant를 모델링합니다.", "concurrent duplicate insert test를 둡니다."),
    ],
    expertNotes: ["tenant-isolated tables의 primary/alternate keys에 tenant scope를 포함할지 sharding·authorization와 함께 결정합니다.", "public identifier와 internal clustered key를 분리하면 enumeration/privacy와 storage locality를 독립적으로 최적화할 수 있습니다."],
  },
  {
    id: "unique-business-key-null-collation",
    title: "UNIQUE를 business scope·NULL·collation·soft delete 정책으로 설계합니다",
    lead: "UNIQUE(email) 한 줄도 tenant별 중복, 대소문자, NULL 여러 개, 탈퇴 후 재가입 정책에 따라 전혀 다른 의미를 가집니다.",
    explanations: [
      "alternate business key는 surrogate id가 다른 같은 domain entity를 막습니다. multi-tenant 서비스에서 email uniqueness가 tenant 내부인지 전체인지 결정하고 tenant_id+normalized_email 같은 composite UNIQUE로 scope를 표현합니다.",
      "UNIQUE와 NULL의 허용 개수·comparison은 DBMS semantics를 확인합니다. NULL이 여러 rows에 허용되더라도 ‘아직 없음’이 실제 business 상태인지, 빈 문자열·unknown source를 섞지 않는지 검토합니다. NOT NULL과 함께 써야 하는 key가 많습니다.",
      "문자 unique는 charset·collation·normalization에 의존합니다. case-insensitive email, case-sensitive provider subject, Unicode canonical equivalence를 하나의 default collation으로 처리하지 않습니다. normalized key가 충돌할 기존 rows를 migration 전에 찾습니다.",
      "soft delete 후 key 재사용은 audit·account takeover·foreign references에 영향을 줍니다. `(email, deleted)` unique는 여러 deleted rows에서 다시 충돌할 수 있고 boolean toggling race가 생깁니다. active key registry, archived surrogate, generated key 또는 product-specific design을 비교합니다.",
    ],
    concepts: [
      c("alternate key", "primary key로 선택되지 않았지만 business entity를 유일하게 식별하는 candidate key입니다.", ["UNIQUE와 필요한 NOT NULL로 강제합니다.", "surrogate primary key와 함께 유지합니다."]),
      c("uniqueness scope", "어떤 partition·tenant·time/state 안에서 값이 하나여야 하는지의 범위입니다.", ["composite key로 tenant scope를 표현할 수 있습니다.", "soft delete와 temporal history는 단순 boolean보다 복잡할 수 있습니다."]),
    ],
    codeExamples: [py(
      "db04-tenant-unique",
      "tenant 내부 unique와 tenant 간 동일 값 허용하기",
      "tenant_unique.py",
      "composite UNIQUE가 business scope를 어떻게 표현하는지 synthetic account rows로 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account (account_id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, normalized_email TEXT NOT NULL, UNIQUE (tenant_id, normalized_email))")
db.execute("INSERT INTO account VALUES (1, 10, 'learner@example.test')")
db.execute("INSERT INTO account VALUES (2, 20, 'learner@example.test')")

same_tenant_blocked = False
try:
    db.execute("INSERT INTO account VALUES (3, 10, 'learner@example.test')")
except sqlite3.IntegrityError:
    same_tenant_blocked = True

rows = list(db.execute("SELECT account_id, tenant_id FROM account ORDER BY account_id"))
print("same-tenant-duplicate-blocked=" + str(same_tenant_blocked).lower())
print("cross-tenant-same-email-allowed=true")
print("rows=" + ";".join(f"{a}:{t}" for a, t in rows))
print("scope=tenant+normalized_email")`,
      "same-tenant-duplicate-blocked=true\ncross-tenant-same-email-allowed=true\nrows=1:10;2:20\nscope=tenant+normalized_email",
      ["mysql-create-table", "mysql-data-size", "oracle-integrity"],
    )],
    diagnostics: [
      d("tenant A의 이메일 때문에 tenant B 가입이 거부된다.", "전체 table UNIQUE로 tenant-local business scope를 과도하게 넓혔습니다.", ["product identity scope를 확인합니다.", "existing key와 foreign references를 봅니다.", "cross-tenant account linking 요구를 검토합니다."], "tenant_id를 candidate key scope에 포함하거나 의도한 global identity service로 분리합니다.", "tenant isolation·duplicate fixtures를 contract tests에 둡니다."),
      d("collation 변경 migration에서 UNIQUE 생성이 실패한다.", "새 comparison 규칙 아래 같아지는 기존 strings를 preflight하지 않았습니다.", ["target normalization/collation으로 collision groups를 preview합니다.", "case/Unicode variants의 owner를 확인합니다.", "automatic merge가 안전한지 검토합니다."], "collision을 deterministic business workflow로 해소한 뒤 key/collation을 변경합니다.", "collation upgrade·normalization version마다 collision gate를 둡니다."),
    ],
    expertNotes: ["idempotency key uniqueness는 tenant·operation·time window scope와 response retention을 함께 설계합니다.", "distributed global uniqueness는 single database constraint가 닿지 않으므로 authoritative service·reservation·reconciliation trade-off를 정의합니다."],
  },
  {
    id: "foreign-key-reference-compatibility",
    title: "FOREIGN KEY를 type-compatible parent·child와 indexed reference로 설계합니다",
    lead: "foreign key는 column 이름이 같다는 표시가 아니라 child 값이 실제 parent key를 가리키게 하는 referential integrity 계약입니다.",
    explanations: [
      "foreign key는 child columns가 parent primary/unique key를 참조합니다. corresponding types의 size·signedness·character set/collation 호환과 column order를 확인합니다. int parent와 bigint child 같은 drift는 migration과 join coercion 문제를 만듭니다.",
      "MySQL InnoDB는 foreign/referenced keys의 index 요구와 restriction이 있습니다. 자동 생성 index에 기대면 이름·column order·중복 index가 drift할 수 있어 actual catalog와 query workload를 확인합니다. index는 enforcement뿐 아니라 join/delete/update locking 비용에 영향을 줍니다.",
      "FOREIGN KEY는 parent가 존재한다는 것만 보장하고 같은 tenant인지, order owner가 authenticated user인지, parent status가 ACTIVE인지까지 일반적으로 보장하지 않습니다. composite tenant key 또는 service authorization/check boundary를 추가합니다.",
      "bulk load에서 foreign_key_checks를 끄는 관행은 orphan을 만들 수 있습니다. staging table→validation→ordered load 또는 supported deferral 전략을 쓰고 re-enable이 existing invalid data를 자동 정리한다고 가정하지 않습니다.",
    ],
    concepts: [
      c("referential integrity", "child foreign key가 NULL 또는 존재하는 parent candidate key를 가리키도록 유지하는 invariant입니다.", ["orphan child를 방지합니다.", "authorization·status workflow는 별도 rule입니다."]),
      c("referenced key", "foreign key가 가리키는 parent의 primary 또는 unique key입니다.", ["type·column order·index compatibility를 확인합니다.", "nonstandard referenced indexes의 vendor behavior를 피합니다."]),
    ],
    codeExamples: [py(
      "db04-foreign-key-actions",
      "orphan 차단과 RESTRICT delete 확인하기",
      "foreign_key_actions.py",
      "parent 없는 child insert와 child가 있는 parent delete를 모두 거부하는 lifecycle을 실행합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE customer (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
db.execute("CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT)")
db.execute("INSERT INTO customer VALUES (1, '학습자')")
db.execute("INSERT INTO orders VALUES (10, 1)")

orphan_blocked = False
parent_delete_blocked = False
try:
    db.execute("INSERT INTO orders VALUES (11, 999)")
except sqlite3.IntegrityError:
    orphan_blocked = True
try:
    db.execute("DELETE FROM customer WHERE customer_id = 1")
except sqlite3.IntegrityError:
    parent_delete_blocked = True

print("orphan-blocked=" + str(orphan_blocked).lower())
print("parent-delete-blocked=" + str(parent_delete_blocked).lower())
print("customer-count=" + str(db.execute("SELECT COUNT(*) FROM customer").fetchone()[0]))
print("order-count=" + str(db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]))`,
      "orphan-blocked=true\nparent-delete-blocked=true\ncustomer-count=1\norder-count=1",
      ["local-db-0127-setting", "mysql-foreign-key", "sqlite-foreign-key"],
    )],
    diagnostics: [
      d("FOREIGN KEY 생성이 incompatible columns 오류로 실패한다.", "parent/child type·signedness·charset/collation 또는 index shape가 다릅니다.", ["SHOW CREATE TABLE과 catalog metadata를 비교합니다.", "parent key uniqueness·column order를 봅니다.", "기존 out-of-range/orphan data를 확인합니다."], "logical key type을 하나로 정하고 parent/child를 compatible phased migration으로 맞춘 뒤 constraint를 추가합니다.", "schema lint로 FK pair metadata equality를 검사합니다."),
      d("foreign key checks를 다시 켰는데 기존 orphan이 그대로 남는다.", "re-enable이 disabled 기간의 existing rows를 전수 재검증한다고 가정했습니다.", ["anti-join으로 orphan count를 측정합니다.", "load window와 writer logs를 확인합니다.", "constraint/enforcement actual state를 봅니다."], "orphan을 quarantine/repair하고 clean load pipeline과 post-load invariant validation을 적용합니다.", "production에서 constraint disable을 금지하거나 승인·pre/post audit를 강제합니다."),
    ],
    expertNotes: ["high-write parent delete/update는 child index가 없으면 scan·lock 범위가 커질 수 있어 enforcement plan을 측정합니다.", "cross-service database foreign key는 deployment coupling과 ownership을 만들 수 있으므로 shared DB boundary에서만 책임을 명확히 합니다."],
  },
  {
    id: "referential-actions-lifecycle",
    title: "RESTRICT·CASCADE·SET NULL을 domain 수명 주기로 선택합니다",
    lead: "ON DELETE 옵션은 cleanup 편의가 아니라 parent가 사라질 때 child 사실이 무엇을 의미하는지 결정하는 irreversible policy입니다.",
    explanations: [
      "RESTRICT/NO ACTION은 dependent child가 있으면 parent 삭제를 거부해 명시적 workflow를 요구합니다. 주문·결제·감사처럼 parent 삭제 후에도 기록을 보존해야 하는 domain에서 안전한 기본이 될 수 있습니다. MySQL의 NO ACTION과 deferred semantics 차이를 공식 문서로 확인합니다.",
      "CASCADE는 child가 parent에 완전히 owned되고 parent 없이는 의미가 없을 때 유용합니다. 깊은 cascade graph는 한 delete의 row count·lock·replication·audit blast radius를 키웁니다. dry-run impact query, authorization, confirmation과 recovery plan 없이 사용하지 않습니다.",
      "SET NULL은 child reference가 optional이고 ‘과거 parent 없음’ 상태가 유효할 때만 맞습니다. foreign key column이 nullable해야 하며 누가/왜 연결이 사라졌는지 audit가 필요하면 detached_reason·snapshot을 별도로 보존합니다.",
      "soft delete는 referential action을 자동 실행하지 않습니다. parent status를 child queries와 authorization이 일관되게 해석하도록 service policy, filtered views, retention/anonymization jobs를 설계합니다.",
    ],
    concepts: [
      c("referential action", "parent key update/delete 때 related child rows에 적용할 RESTRICT·CASCADE·SET NULL 등의 규칙입니다.", ["domain ownership과 retention을 표현합니다.", "vendor별 timing/semantics를 test합니다."]),
      c("aggregate ownership", "parent가 child의 생성·수명·삭제를 완전히 소유하는 domain 경계입니다.", ["강한 ownership에서 cascade가 자연스러울 수 있습니다.", "독립 audit/retention child에는 맞지 않을 수 있습니다."]),
    ],
    diagnostics: [
      d("사용자 삭제가 수백만 audit rows를 cascade 삭제해 replica lag가 발생한다.", "retention child를 owned child로 잘못 보고 deep CASCADE를 사용했습니다.", ["constraint cascade graph와 예상 row counts를 계산합니다.", "binary/audit log와 lag를 확인합니다.", "legal retention/restore point를 확인합니다."], "삭제를 중단·복구하고 anonymization/partitioned retention workflow와 RESTRICT를 설계합니다.", "cascade depth/row impact gate와 destructive rehearsal을 둡니다."),
      d("SET NULL 뒤 child가 누구의 기록이었는지 추적할 수 없다.", "reference 제거 전에 immutable snapshot/audit requirement를 고려하지 않았습니다.", ["child business 의미와 retention을 확인합니다.", "audit/event에 previous parent id가 있는지 봅니다.", "PII 삭제와 traceability 요구를 조정합니다."], "허용 범위 내 pseudonymous historical key나 snapshot/reason event를 남기고 current FK만 NULL로 만듭니다.", "unlink workflow contract와 restore/audit test를 둡니다."),
    ],
    expertNotes: ["large cascade는 application batch로 나누면 atomicity가 달라지므로 failure/retry/idempotency를 명시합니다.", "privacy erasure는 cascade delete 하나가 아니라 backups, replicas, caches, search, analytics lineage와 legal hold를 포함합니다."],
  },
  {
    id: "check-row-domain-null",
    title: "CHECK로 row-local domain을 표현하고 NULL·expression portability를 검증합니다",
    lead: "CHECK(amount > 0)는 단순 설명 주석이 아니라 invalid value를 거부하는 실행 rule이지만 UNKNOWN과 vendor 지원 범위를 이해해야 합니다.",
    explanations: [
      "CHECK는 같은 row의 값으로 표현 가능한 range, enumeration, cross-column relation을 강제하는 데 적합합니다. amount > 0, end_at > start_at, deleted_at IS NULL 또는 status='DELETED' 같은 rule을 named constraint로 둡니다.",
      "SQL CHECK는 expression이 TRUE 또는 UNKNOWN일 때 통과할 수 있어 nullable column에는 NOT NULL이 별도로 필요할 수 있습니다. CHECK(price > 0)만 두고 NULL을 막았다고 생각하지 않습니다. truth table fixture로 검증합니다.",
      "nondeterministic function, subquery, other table lookup과 application-specific regex는 DBMS별 제한·portability가 큽니다. cross-row/parent state rule은 foreign key, unique, transaction service 또는 trigger/reconciliation 중 적절한 경계를 선택합니다.",
      "기존 CHECK를 stricter하게 바꿀 때 invalid rows와 concurrent writes를 먼저 처리합니다. constraint 이름과 condition version을 migration에 남기고 consumer error mapping을 함께 갱신합니다.",
    ],
    concepts: [
      c("CHECK constraint", "각 row의 expression이 허용 결과가 되도록 강제하는 constraint입니다.", ["range·enumeration·cross-column rule에 사용합니다.", "NULL의 UNKNOWN과 DBMS expression restrictions를 확인합니다."]),
      c("row-local invariant", "한 row의 columns만으로 판정할 수 있는 항상 참이어야 할 조건입니다.", ["CHECK에 적합한 경우가 많습니다.", "다른 rows/시간 history rule과 구분합니다."]),
    ],
    codeExamples: [py(
      "db04-check-null-truth",
      "CHECK와 NOT NULL의 역할을 분리해 검증하기",
      "check_null.py",
      "range CHECK만 있을 때 NULL이 통과할 수 있는 점과 NOT NULL 결합을 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE loose_score (score INTEGER CHECK (score BETWEEN 0 AND 100))")
db.execute("CREATE TABLE strict_score (score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100))")
db.execute("INSERT INTO loose_score VALUES (NULL)")

null_blocked = False
range_blocked = False
try:
    db.execute("INSERT INTO strict_score VALUES (NULL)")
except sqlite3.IntegrityError:
    null_blocked = True
try:
    db.execute("INSERT INTO strict_score VALUES (101)")
except sqlite3.IntegrityError:
    range_blocked = True

print("loose-null-count=" + str(db.execute("SELECT COUNT(*) FROM loose_score WHERE score IS NULL").fetchone()[0]))
print("strict-null-blocked=" + str(null_blocked).lower())
print("strict-range-blocked=" + str(range_blocked).lower())
print("required-pair=NOT NULL+CHECK")`,
      "loose-null-count=1\nstrict-null-blocked=true\nstrict-range-blocked=true\nrequired-pair=NOT NULL+CHECK",
      ["mysql-check", "mysql-create-table", "oracle-integrity", "sqlite-create-table"],
    )],
    diagnostics: [
      d("CHECK(price > 0)가 있는데 NULL 가격 rows가 생긴다.", "CHECK의 UNKNOWN 통과와 NULL 가능성을 고려하지 않았습니다.", ["column nullable metadata를 봅니다.", "CHECK truth table에 NULL을 넣습니다.", "NULL의 business 의미를 확인합니다."], "가격이 필수면 NOT NULL과 CHECK를 함께 적용하고 기존 NULL을 backfill/quarantine합니다.", "constraint review에 NULL truth-table fixture를 필수화합니다."),
      d("application에서는 허용한 값이 DB CHECK에서 거부된다.", "validation과 database rule의 boundary·rounding·normalization version이 drift했습니다.", ["raw/normalized/bound value를 redacted 비교합니다.", "constraint definition과 application version을 봅니다.", "locale/timezone/decimal rounding을 확인합니다."], "하나의 versioned domain contract에서 validation/DDL/tests를 생성하거나 일관되게 갱신합니다.", "cross-layer golden fixtures와 schema/application compatibility matrix를 둡니다."),
    ],
    expertNotes: ["complex CHECK가 이해·운영하기 어렵다면 generated canonical column+simple constraint로 evidence를 명확히 할 수 있습니다.", "constraint evaluation cost도 bulk write와 replication에서 측정하되 integrity를 성능 이유로 제거하기 전에 data model을 재검토합니다."],
  },
  {
    id: "constraint-names-error-contract",
    title: "constraint 이름과 오류를 stable domain contract로 번역합니다",
    lead: "사용자는 uq_account_tenant_email이나 vendor SQL을 알아야 할 필요가 없고, 운영자는 어떤 invariant가 어느 release에서 실패했는지 알아야 합니다.",
    explanations: [
      "pk_, uq_, fk_, ck_ prefix와 domain rule을 담은 deterministic naming을 사용합니다. DBMS identifier length와 schema-wide naming scope를 고려해 abbreviation 규칙을 둡니다. 자동 생성 이름은 environment별 drift와 error mapping을 어렵게 합니다.",
      "driver exception에서 SQLState, vendor code, constraint name을 읽어 DuplicateEmail, UnknownCustomer, InvalidAmount 같은 stable internal error로 바꿉니다. raw SQL, table/column, supplied value, stack trace를 client response에 노출하지 않습니다.",
      "동시성 때문에 unique violation은 정상적인 conflict outcome일 수 있습니다. HTTP/API에서는 409 또는 idempotent existing result, validation range는 400/422처럼 contract에 맞게 처리합니다. 모든 integrity violation을 retry하면 deterministic invalid input을 반복해 load를 키웁니다.",
      "error telemetry에는 constraint category/name, operation, release, tenant-safe identifier, trace id와 count를 남기고 sensitive value는 hash도 함부로 기록하지 않습니다. 급증 alert는 producer drift, attack, bad migration을 구분할 runbook과 연결합니다.",
    ],
    concepts: [
      c("constraint name", "schema invariant를 식별하는 명시적 database object 이름입니다.", ["migration·error·catalog·monitoring을 연결합니다.", "portable length와 uniqueness 규칙을 둡니다."]),
      c("error translation", "vendor-specific database failure를 stable domain/API error category와 안전한 메시지로 변환하는 boundary입니다.", ["raw detail은 redacted internal telemetry에만 둡니다.", "retryable과 deterministic failure를 구분합니다."]),
    ],
    diagnostics: [
      d("duplicate 요청이 모두 500으로 기록돼 장애 alert를 만든다.", "unique conflict를 expected domain outcome으로 분류하지 않았습니다.", ["constraint/SQLState mapping을 확인합니다.", "idempotency key와 request retry를 봅니다.", "실제 DB unavailable과 category를 분리합니다."], "unique conflict를 idempotent response 또는 domain 409로 번역하고 database outage는 별도 5xx로 유지합니다.", "error taxonomy contract tests와 category별 SLO를 둡니다."),
      d("오류 응답에 table 이름과 사용자 이메일이 그대로 노출된다.", "raw database exception을 client에 직렬화했습니다.", ["API error mapper와 logs를 검사합니다.", "APM breadcrumb·SQL parameter capture를 확인합니다.", "이미 저장된 sensitive logs의 retention을 평가합니다."], "stable code와 generic message만 응답하고 values/SQL을 redact하며 노출 logs를 제한·삭제합니다.", "privacy tests와 logging allowlist를 둡니다."),
    ],
    expertNotes: ["constraint rename도 error contract 변경이므로 application mapping의 compatibility window를 둡니다.", "multi-language clients에는 human message보다 stable machine code와 field/path metadata를 제공하고 locale text는 presentation layer가 만듭니다."],
  },
  {
    id: "add-constraint-existing-data",
    title: "기존 data에 constraint를 추가할 때 preflight·repair·online validation을 단계화합니다",
    lead: "constraint DDL을 먼저 실행해 실패한 뒤 data를 고치는 방식은 큰 table에서 lock·downtime·부분 배포를 만들 수 있습니다.",
    explanations: [
      "추가할 rule마다 duplicate GROUP BY, orphan anti-join, NULL/range violation query를 read-only로 먼저 실행합니다. count만이 아니라 owner/source/age/tenant 분포와 repair decision을 보되 PII를 report에 복제하지 않습니다.",
      "repair는 임의 delete가 아닙니다. canonical row merge, parent mapping, quarantine, business reprocessing, user confirmation 중 owner가 승인한 방식으로 idempotent batches를 실행합니다. 모든 변경은 before/after invariant counts와 audit를 남깁니다.",
      "new invalid writes를 먼저 차단하지 않으면 backfill 끝까지 violation이 계속 들어옵니다. application validation/dual-write gate를 배포하고 monitor한 뒤 data cleanup과 constraint validation을 수행합니다. 가능한 DBMS의 not-valid/online 기능과 lock semantics를 exact version에서 확인합니다.",
      "constraint 생성 성공 후 catalog definition과 enforcement state, negative fixtures, query plans, replication lag를 readback합니다. rollback이 constraint drop만으로 끝나는지, application이 새 error mapping에 의존하는지도 확인합니다.",
    ],
    concepts: [
      c("preflight query", "schema change 전에 existing data가 새 invariant를 만족하는지 read-only로 측정하는 query입니다.", ["duplicate·orphan·NULL·range groups를 찾습니다.", "release gate와 repair plan의 input입니다."]),
      c("quarantine", "자동 repair가 안전하지 않은 invalid rows를 정상 data flow에서 분리해 owner가 검토하도록 하는 상태/저장소입니다.", ["원본 provenance와 reason을 보존합니다.", "영구 쓰레기통이 되지 않도록 SLA를 둡니다."]),
    ],
    codeExamples: [py(
      "db04-constraint-preflight",
      "duplicate·orphan·range violation을 DDL 전에 세기",
      "constraint_preflight.py",
      "dirty legacy rows를 constraint 적용 전에 read-only queries로 분류하고 clean 여부를 판정합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE legacy_customer (customer_id INTEGER, email TEXT);
CREATE TABLE legacy_order (order_id INTEGER, customer_id INTEGER, amount INTEGER);
INSERT INTO legacy_customer VALUES (1, 'a@example.test'), (2, 'a@example.test'), (3, NULL);
INSERT INTO legacy_order VALUES (10, 1, 1000), (11, 999, 2000), (12, 1, 0);
""")

duplicate_groups = db.execute("SELECT COUNT(*) FROM (SELECT email FROM legacy_customer WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1)").fetchone()[0]
null_keys = db.execute("SELECT COUNT(*) FROM legacy_customer WHERE email IS NULL").fetchone()[0]
orphans = db.execute("SELECT COUNT(*) FROM legacy_order o LEFT JOIN legacy_customer c ON c.customer_id=o.customer_id WHERE c.customer_id IS NULL").fetchone()[0]
bad_amounts = db.execute("SELECT COUNT(*) FROM legacy_order WHERE amount <= 0 OR amount IS NULL").fetchone()[0]
clean = duplicate_groups == null_keys == orphans == bad_amounts == 0

print("duplicate-groups=" + str(duplicate_groups))
print("null-keys=" + str(null_keys))
print("orphans=" + str(orphans))
print("bad-amounts=" + str(bad_amounts))
print("ready-for-constraints=" + str(clean).lower())`,
      "duplicate-groups=1\nnull-keys=1\norphans=1\nbad-amounts=1\nready-for-constraints=false",
      ["mysql-alter-table", "mysql-foreign-key", "mysql-check", "oracle-integrity"],
    )],
    diagnostics: [
      d("UNIQUE 추가가 production에서 오래 실행된 뒤 duplicate로 실패한다.", "preflight 없이 DDL validation scan부터 실행했습니다.", ["duplicate group count와 largest group을 확인합니다.", "DDL lock/algorithm과 elapsed work를 봅니다.", "concurrent duplicate writes를 확인합니다."], "DDL을 안전하게 중단하고 writer gate→duplicate repair→online validation 순서로 재계획합니다.", "migration CI에 production snapshot preflight와 time budget을 둡니다."),
      d("orphan repair script 재실행이 정상 rows까지 다시 변경한다.", "checkpoint·idempotency·owned predicate 없는 broad update/delete를 사용했습니다.", ["run id와 affected rows를 확인합니다.", "before/after snapshots와 audit를 봅니다.", "WHERE가 stable violation key에 제한되는지 확인합니다."], "repair를 immutable candidate list와 compare-and-set/idempotent batches로 바꾸고 복구합니다.", "dry-run, max affected guard, pause/resume와 reconciliation을 표준화합니다."),
    ],
    expertNotes: ["큰 table validation은 buffer/IO·replica lag·lock wait를 관측하며 adaptive throttle과 abort criteria를 둡니다.", "data repair에는 domain/legal owner 승인이 필요하며 기술적으로 merge 가능하다는 이유로 개인정보·금융 history를 임의 결합하지 않습니다."],
  },
  {
    id: "concurrency-races-constraints",
    title: "constraint를 concurrent write의 최종 판정자로 사용합니다",
    lead: "SELECT로 중복 없음 확인 후 INSERT하는 사이에 다른 transaction이 같은 값을 넣을 수 있습니다. 사전 조회는 최종 exclusivity가 아닙니다.",
    explanations: [
      "check-then-act race에서 두 requests는 같은 snapshot에서 ‘없음’을 보고 모두 insert할 수 있습니다. UNIQUE constraint가 commit/statement에서 하나를 거부하고 application은 winner result를 읽거나 conflict를 반환합니다. lock 없이 조회 결과를 guarantee로 사용하지 않습니다.",
      "idempotency key는 `(tenant, operation, key)` unique로 중복 side effect를 막고 first response를 저장할 수 있습니다. key TTL·payload hash·failed/in-progress/completed state와 retry ownership을 설계합니다.",
      "foreign key와 parent delete race는 isolation과 referential action이 최종 state를 방어하지만 workflow error를 어떻게 사용자에게 보여 줄지 정합니다. retry는 transaction 전체를 새 snapshot에서 실행하고 deterministic constraint failure를 무한 재시도하지 않습니다.",
      "CHECK는 row-local concurrent update를 막지만 여러 rows 합계·겹치지 않는 기간 같은 write skew invariant는 unique representation, explicit lock, serialized aggregate 또는 higher isolation이 필요합니다.",
    ],
    concepts: [
      c("check-then-act race", "상태를 확인한 뒤 행동하기 전 다른 writer가 상태를 바꿔 사전 조건이 낡는 경쟁입니다.", ["application 조회만으로 uniqueness를 보장하지 못합니다.", "constraint/atomic write/CAS로 최종 판정합니다."]),
      c("idempotency key", "같은 logical operation의 retry가 side effect를 한 번만 만들도록 식별하는 unique key입니다.", ["scope·payload·state·retention을 정의합니다.", "database unique와 response persistence를 결합할 수 있습니다."]),
    ],
    diagnostics: [
      d("가입 전 이메일 조회를 했는데도 duplicate accounts가 생긴다.", "조회와 insert 사이 race를 unique constraint 없이 처리했습니다.", ["concurrent trace와 transaction boundary를 확인합니다.", "actual unique constraint/collation을 봅니다.", "retries가 다른 id를 생성하는지 확인합니다."], "normalized scoped key에 UNIQUE를 두고 conflict를 idempotent/domain response로 번역합니다.", "barrier를 사용한 concurrent integration test를 둡니다."),
      d("constraint violation을 retry하다 DB load가 폭증한다.", "deterministic invalid input/duplicate를 transient deadlock·timeout과 같은 retry category로 묶었습니다.", ["SQLState/vendor category와 retry count를 봅니다.", "backoff·budget·idempotency를 확인합니다.", "retry storm의 source endpoints를 찾습니다."], "constraint failures는 즉시 domain error로 처리하고 transient errors만 bounded jitter retry합니다.", "central retry classifier와 retry-budget metrics를 둡니다."),
    ],
    expertNotes: ["upsert는 duplicate handling을 atomic하게 만들지만 어떤 columns를 update하고 lost-update를 허용하는지 별도 contract가 필요합니다.", "serializable isolation도 external side effects를 rollback하지 못하므로 outbox와 idempotency를 유지합니다."],
  },
  {
    id: "catalog-negative-tests-operations",
    title: "catalog·negative tests·metrics·restore로 constraint 운영을 닫습니다",
    lead: "DDL 파일에 constraint가 적혀 있다는 사실보다 모든 instance에서 enforced되고 invalid writes가 안전하게 거부·관측되는지가 중요합니다.",
    explanations: [
      "INFORMATION_SCHEMA와 vendor catalog에서 constraint name, columns/order, referenced target/action, CHECK expression과 enforcement state를 readback해 expected manifest와 diff합니다. migration history만 보고 수동 drift·partial rollout을 놓치지 않습니다.",
      "negative test suite는 duplicate primary/alternate key, NULL, orphan, parent delete, range boundary와 concurrent race를 실제 driver로 실행합니다. production에서는 destructive test를 하지 않고 ephemeral/isolated schema에서 실행하며 synthetic fixture와 owned cleanup을 사용합니다.",
      "constraint violation metrics는 category·constraint·operation·release별 rate를 보고 sensitive values는 기록하지 않습니다. 급증하면 bad deploy·producer drift·attack·unexpected user behavior를 구분하고, zero violations도 constraint가 비활성화된 결과가 아닌지 drift check와 함께 봅니다.",
      "backup/restore 뒤 constraints, indexes, grants, triggers와 enforcement state가 복원되고 application negative tests가 같은 결과를 내는지 확인합니다. data만 복원하고 schema objects가 누락되면 invalid writes가 이후 누적됩니다.",
    ],
    concepts: [
      c("schema drift", "expected migration/manifest와 actual constraint metadata 또는 enforcement가 다른 상태입니다.", ["fleet-wide catalog diff로 탐지합니다.", "수동 hotfix와 partial rollout을 포함합니다."]),
      c("negative fixture", "constraint가 거부해야 하는 최소 invalid data/operation example입니다.", ["boundary와 concurrency cases를 포함합니다.", "raw error 대신 stable category를 assertion합니다."]),
    ],
    diagnostics: [
      d("한 replica/tenant schema에만 foreign key가 없다.", "migration partial failure를 fleet-wide catalog에서 검증하지 않았습니다.", ["instance/tenant별 catalog manifest를 비교합니다.", "migration history와 DDL error를 확인합니다.", "orphan writes가 생겼는지 측정합니다."], "affected scope를 격리하고 data repair 후 idempotent constraint migration을 재실행합니다.", "fleet completeness gate와 drift alert를 둡니다."),
      d("restore는 성공했지만 duplicate data가 다시 들어온다.", "restore validation이 row count만 보고 constraints/enforcement를 확인하지 않았습니다.", ["SHOW CREATE/catalog constraint count를 비교합니다.", "negative fixture를 isolated restored environment에서 실행합니다.", "grants/migration version/indexes를 확인합니다."], "schema objects와 enforcement를 복원·검증하고 invalid rows를 격리합니다.", "restore acceptance에 catalog diff와 application contract tests를 포함합니다."),
    ],
    expertNotes: ["constraint expression canonicalization은 DBMS가 whitespace/order를 바꿀 수 있어 semantic diff 도구가 필요할 수 있습니다.", "sharded/tenant schemas에서는 sampling만으로 drift를 놓치지 않도록 manifest hash와 exception inventory를 운영합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0126", repository: "local dbstudy snapshot", path: "dbstudy/01_26.sql", usedFor: ["BOOKTEST primary key·ALTER exercises"], evidence: "원본 CREATE TABLE 8·PRIMARY KEY 6·ALTER 13 active shapes를 read-only로 확인했습니다." },
  { id: "local-db-0127-setting", repository: "local dbstudy snapshot", path: "dbstudy/01_27_SETTING.sql", usedFor: ["book·customer·orders PK/FK schema"], evidence: "원본 CREATE TABLE 3·PK 3·FK 2 active shapes를 read-only로 확인했습니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["PRIMARY·UNIQUE·FOREIGN·CHECK syntax"], evidence: "MySQL DDL 공식 문서입니다." },
  { id: "mysql-primary-key", repository: "MySQL 8.4 Reference Manual", path: "Primary Key Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/primary-key-optimization.html", usedFor: ["InnoDB clustered primary key trade-off"], evidence: "MySQL primary key 공식 문서입니다." },
  { id: "mysql-foreign-key", repository: "MySQL 8.4 Reference Manual", path: "FOREIGN KEY Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html", usedFor: ["type/index restrictions·referential actions"], evidence: "MySQL foreign key 공식 문서입니다." },
  { id: "mysql-check", repository: "MySQL 8.4 Reference Manual", path: "CHECK Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html", usedFor: ["CHECK syntax·enforcement"], evidence: "MySQL CHECK 공식 문서입니다." },
  { id: "mysql-constraint-differences", repository: "MySQL 8.4 Reference Manual", path: "How MySQL Deals with Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/constraints.html", usedFor: ["SQL standard differences·NULL behavior"], evidence: "MySQL constraint differences 공식 문서입니다." },
  { id: "mysql-alter-table", repository: "MySQL 8.4 Reference Manual", path: "ALTER TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/alter-table.html", usedFor: ["adding/dropping constraints·online migration"], evidence: "MySQL ALTER 공식 문서입니다." },
  { id: "mysql-data-size", repository: "MySQL 8.4 Reference Manual", path: "Optimizing Data Size", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/data-size.html", usedFor: ["keys·normalization·type compatibility"], evidence: "MySQL schema optimization 공식 문서입니다." },
  { id: "oracle-integrity", repository: "Oracle AI Database 26ai Concepts", path: "Data Integrity", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/data-integrity.html", usedFor: ["PK·UK·FK·CHECK·NULL portability"], evidence: "Oracle integrity 공식 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["exact constraint labs"], evidence: "SQLite CREATE TABLE 공식 문서입니다." },
  { id: "sqlite-foreign-key", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["PRAGMA enforcement·referential actions lab"], evidence: "SQLite foreign key 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-04-primary-foreign-unique-check",
  slug: "db-04-primary-foreign-unique-check",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 4,
  title: "기본키·외래키·UNIQUE·CHECK로 무결성 강제하기",
  subtitle: "constraint 문법을 identity·관계 수명 주기·동시성·기존 데이터 정리·오류 계약·운영 증거까지 확장합니다.",
  level: "입문",
  estimatedMinutes: 780,
  coreQuestion: "잘못된 duplicate·orphan·NULL·범위 상태가 어떤 writer와 concurrency에서도 저장되지 않도록 constraint를 어떻게 설계하고 안전하게 도입할까요?",
  summary: "dbstudy/01_26.sql의 BOOKTEST primary key/ALTER 연습과 01_27_SETTING.sql의 book·customer·orders PK/FK 관계를 모두 read-only로 감사합니다. constraint를 모든 writer가 공유하는 invariant로 정의하고, stable/minimal primary·composite key, tenant/collation/soft-delete를 고려한 alternate UNIQUE, type/index-compatible foreign key, RESTRICT·CASCADE·SET NULL lifecycle, CHECK와 NULL의 UNKNOWN, meaningful names와 safe error translation, dirty legacy data preflight·repair·online validation, concurrent check-then-act race와 idempotency, fleet catalog drift·negative tests·metrics·restore까지 연결합니다. 다섯 Python sqlite3 examples는 외부 DB 없이 duplicate·orphan·range와 migration preflight를 exact output으로 재현하며 MySQL 8.4·Oracle 26ai semantics와 경계를 명시합니다.",
  objectives: [
    "PRIMARY·UNIQUE·FOREIGN·CHECK·NOT NULL이 각각 방어하는 invalid state를 구분한다.",
    "stable candidate·surrogate·composite primary key와 alternate business key를 설계한다.",
    "tenant·NULL·collation·soft delete를 포함한 uniqueness scope를 결정한다.",
    "type/index-compatible foreign key와 RESTRICT·CASCADE·SET NULL 수명 주기를 선택한다.",
    "CHECK의 row-local expression, NULL UNKNOWN과 portability 한계를 검증한다.",
    "constraint violation을 privacy-safe한 stable domain/API error로 번역한다.",
    "dirty existing data에 writer gate·preflight·repair·online validation을 단계적으로 적용한다.",
    "concurrency race, catalog drift, negative test, metrics와 restore acceptance를 운영한다.",
  ],
  prerequisites: [{ title: "CREATE TABLE·자료형·NULL·DEFAULT", reason: "constraint columns의 type과 NULL semantics를 먼저 결정해야 합니다.", sessionSlug: "db-03-create-table-types-null-default" }],
  keywords: ["PRIMARY KEY", "composite key", "UNIQUE", "alternate key", "FOREIGN KEY", "referential integrity", "CASCADE", "RESTRICT", "SET NULL", "CHECK", "constraint name", "preflight", "concurrency", "schema drift"],
  topics,
  lab: {
    title: "multi-tenant 학습 주문 schema의 무결성을 constraint와 negative tests로 닫기",
    scenario: "tenant별 학습자 email은 중복될 수 없고, 주문은 같은 tenant의 존재하는 학습자를 참조하며 금액은 양수여야 합니다. 탈퇴해도 주문 감사는 보존하고 동시에 같은 idempotency key로 들어온 결제는 한 번만 생성합니다.",
    setup: ["synthetic tenant·email·order fixture만 사용합니다.", "portable lab은 sqlite3, vendor acceptance는 격리 MySQL 8.4/Oracle 26ai에서 분리합니다.", "expected constraint manifest와 stable domain error mapping을 작성합니다.", "dirty legacy dataset snapshot과 repair 승인 owner를 준비합니다."],
    steps: [
      "entity/association candidate keys와 tenant scope를 문장으로 정의합니다.",
      "surrogate PK와 tenant+normalized_email, tenant+idempotency_key UNIQUE를 설계합니다.",
      "parent/child type·column order·indexes와 composite tenant FK를 검토합니다.",
      "주문 보존 요구에서 parent delete RESTRICT/anonymization workflow를 결정합니다.",
      "amount·status·cross-column NULL rules를 named CHECK/NOT NULL로 표현합니다.",
      "duplicate·NULL·orphan·range·parent delete preflight queries를 실행합니다.",
      "writer gate를 먼저 배포하고 invalid rows를 idempotent repair/quarantine합니다.",
      "constraints를 online budget 안에서 추가하고 catalog/enforcement를 readback합니다.",
      "실제 driver로 positive/negative/concurrent idempotency tests와 safe error mapping을 검증합니다.",
      "violation metrics·drift alert·backup restore 뒤 negative acceptance를 rehearsal합니다.",
    ],
    expectedResult: ["constraint manifest와 actual catalog가 완전히 일치합니다.", "invalid fixtures는 각 named invariant에서 예상 category로 거부됩니다.", "concurrent duplicate requests 중 side effect는 한 번만 생성됩니다.", "parent 삭제는 주문을 잃지 않고 승인된 lifecycle로 처리됩니다.", "migration·repair·restore evidence에 PII/raw SQL value가 없고 rollback/roll-forward가 준비됩니다."],
    cleanup: ["격리 test transactions와 owned fixtures만 제거합니다.", "test schema를 migration identity로 제거하고 foreign key enforcement를 원래 상태로 확인합니다.", "temporary repair candidates와 logs에 PII가 없는지 검사합니다.", "test credential을 revoke하고 instance를 종료합니다."],
    extensions: ["temporal uniqueness와 overlapping booking invariant를 설계합니다.", "sharded global uniqueness와 reconciliation을 비교합니다.", "million-row validation의 lock/lag throttle을 benchmark합니다.", "constraint/driver version upgrade에서 error mapping compatibility를 자동 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 다시 작성하고 각 invalid fixture가 어떤 constraint와 business rule에 연결되는지 표로 만드세요.", requirements: ["모든 stdout을 완전 일치시킵니다.", "foreign_keys enforcement를 명시합니다.", "raw vendor error를 출력하지 않습니다.", "NULL CHECK truth table을 포함합니다.", "preflight 결과가 clean이 아닐 때 DDL을 실행하지 않습니다."], hints: ["constraint를 하나씩 제거해 방어 차이를 확인하세요."], expectedOutcome: "PK·UNIQUE·FK·CHECK의 역할과 migration preflight를 실행 결과로 설명합니다.", solutionOutline: ["rule→DDL→valid fixture→invalid fixture→stable category→catalog 순서입니다."] },
    { difficulty: "응용", prompt: "원본 book·customer·orders schema에 production integrity를 보강하세요.", requirements: ["원본 두 files의 실제 PK/FK를 보존·감사합니다.", "business alternate keys와 NULL policies를 정의합니다.", "money·date range CHECK를 설계합니다.", "foreign key actions와 retention을 결정합니다.", "constraint names/error mapping을 만듭니다.", "dirty data preflight와 staged migration을 작성합니다.", "positive/negative/concurrency tests를 포함합니다."], hints: ["CASCADE를 cleanup 편의로 선택하지 마세요."], expectedOutcome: "교재 schema가 안전한 주문 integrity와 운영 migration을 갖춘 model로 발전합니다.", solutionOutline: ["source audit→invariants→target constraints→preflight/repair→apply/readback→tests/metrics 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 database integrity 표준과 constraint rollout runbook을 작성하세요.", requirements: ["key/FK/CHECK decision criteria를 정의합니다.", "tenant·soft delete·temporal uniqueness를 다룹니다.", "naming·error taxonomy·privacy를 정의합니다.", "online validation·repair owner·quarantine을 정의합니다.", "concurrency/idempotency tests를 정의합니다.", "fleet drift·metrics·restore acceptance를 정의합니다.", "cross-service eventual invariant 대안을 포함합니다."], hints: ["모든 rule이 database constraint로 표현될 수 있다고 가정하지 마세요."], expectedOutcome: "새 schema와 legacy rollout을 일관되게 승인·복구하는 전문가 integrity 표준이 완성됩니다.", solutionOutline: ["rule classes→enforcement boundary→rollout→runtime errors→observability→recovery 순서입니다."] },
  ],
  nextSessions: ["db-05-auto-increment-sequence-portability"],
  sources,
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "inventory의 dbstudy/01_26.sql과 dbstudy/01_27_SETTING.sql을 모두 read-only로 확인했습니다.",
      "01_26 active shape의 CREATE TABLE 8·PK 6·ALTER 13과 01_27_SETTING의 CREATE 3·PK 3·FK 2를 기준선으로 사용했습니다.",
      "원본에는 active UNIQUE·CHECK·CASCADE evidence가 없어 공식 문서와 owned exact examples로 보완하고 원본 실행 사실로 과장하지 않았습니다.",
      "local DB·credential·실제 customer/order data는 사용하지 않았고 모든 examples는 synthetic memory SQLite입니다.",
    ],
  },
});

export default session;
