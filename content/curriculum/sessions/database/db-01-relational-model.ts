import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

function concept(term: string, definition: string, detail: string[], caveat?: string): SessionConcept {
  return { term, definition, detail, caveat };
}

function diagnostic(
  symptom: string,
  likelyCause: string,
  checks: string[],
  fix: string,
  prevention: string,
): DiagnosticCase {
  return { symptom, likelyCause, checks, fix, prevention };
}

function pythonExample(
  id: string,
  title: string,
  filename: string,
  purpose: string,
  code: string,
  output: string,
  sourceRefs: string[],
): DetailedCodeExample {
  return {
    id,
    title,
    language: "python",
    filename,
    purpose,
    code,
    walkthrough: [
      { lines: "1-4", explanation: "메모리 SQLite 연결을 열고 foreign key 검사를 명시적으로 활성화해 외부 서버·계정·영구 데이터를 사용하지 않는 재현 환경을 만듭니다." },
      { lines: "5-끝에서 4줄 전", explanation: "DDL과 fixture를 작은 transaction 안에서 실행합니다. 예제마다 schema·행·관계의 한 불변식만 관찰해 우연한 출력과 검증 근거를 구분합니다." },
      { lines: "마지막 4줄", explanation: "정렬된 query 결과와 명시적 판정 문자열만 stdout에 기록합니다. vendor 고유 오류 문구나 실행 시각처럼 환경에 따라 달라지는 값은 정답에 넣지 않습니다." },
    ],
    run: {
      environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "네트워크·외부 DB·credential 불필요"],
      command: `python ${filename}`,
    },
    output: {
      value: output,
      explanation: [
        "출력은 예제 내부의 고정 fixture와 명시적 ORDER BY 또는 판정 문자열로 결정됩니다.",
        "SQLite는 관계 모델의 portable subset을 실행하는 학습 도구입니다. MySQL·Oracle의 자료형, DDL, constraint timing 차이를 같은 것으로 과장하지 않습니다.",
      ],
    },
    experiments: [
      { change: "fixture 한 행의 key를 이미 존재하는 값으로 바꿉니다.", prediction: "PRIMARY KEY 또는 UNIQUE 불변식이 중복 상태를 거부합니다.", result: "예외를 삼키지 말고 어떤 constraint와 요구사항이 연결되는지 기록해야 합니다." },
      { change: "query의 ORDER BY를 제거합니다.", prediction: "현재 작은 실행에서는 같은 순서처럼 보일 수 있지만 결과 순서 계약은 사라집니다.", result: "표의 물리적 저장 순서나 우연한 plan을 비즈니스 순서로 사용하면 안 됩니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "relation-tuple-attribute-domain",
    title: "relation·tuple·attribute·domain을 표 화면과 구분합니다",
    lead: "행과 열이 보인다는 이유만으로 모든 표가 좋은 관계형 schema가 되는 것은 아닙니다. 값의 의미·허용 범위·row identity와 operation 계약까지 있어야 합니다.",
    explanations: [
      "관계 모델에서 relation은 같은 heading을 공유하는 tuple의 집합으로 생각할 수 있습니다. SQL table은 이를 구현하지만 bag semantics, NULL, duplicate 허용, 물리 저장 순서 같은 현실적 차이가 있습니다. 따라서 ‘엑셀처럼 생겼다’가 아니라 column마다 하나의 의미와 domain이 있고 row가 같은 종류의 사실을 표현하는지부터 확인합니다.",
      "tuple은 한 엔티티의 모든 정보를 무조건 넣는 그릇이 아닙니다. 주문 row에는 주문 시점의 판매 사실을, 고객 row에는 고객 identity와 현재 상태를 둡니다. 서로 수명 주기와 변경 이유가 다른 사실을 한 row에 섞으면 값 반복, NULL 무더기, 부분 update와 삭제 anomaly가 생깁니다.",
      "attribute 이름은 개발자 편의용 label이 아니라 데이터 계약의 일부입니다. amount가 원화 정수인지 세전 decimal인지, status가 자유 문자열인지 제한된 code인지, occurred_at이 어느 timezone의 instant인지까지 domain을 정의해야 같은 column을 생산자와 소비자가 같은 뜻으로 읽습니다.",
      "원본 01_21.sql은 members와 members2를 반복 정의하며 회원 identity, contact, role, provider, soft-delete, timestamp를 한 table에 모읍니다. 학습 출발점으로 유용하지만 credential·전화번호 sample은 공개 자료에 복제하지 않고, nullable/default/check와 수명 주기를 별도 요구사항으로 재검토해야 합니다.",
    ],
    concepts: [
      concept("relation", "같은 attribute 집합과 의미 계약을 공유하는 tuple들의 논리적 집합입니다.", ["SQL table은 관계 모델의 실용적 구현이지만 duplicate와 NULL 때문에 수학적 relation과 완전히 같지 않습니다.", "query result도 heading과 rows를 가지는 새로운 relation-like value로 읽을 수 있습니다."], "ORDER BY가 없으면 row 순서는 relation의 의미에 포함되지 않습니다."),
      concept("domain", "attribute가 가질 수 있는 값의 타입·단위·범위·형식·의미 규칙입니다.", ["VARCHAR(45)만으로 email 형식이나 대소문자 비교 정책까지 표현되지는 않습니다.", "application validation과 database constraint가 같은 business rule을 서로 다른 경계에서 방어할 수 있습니다."]),
    ],
    codeExamples: [pythonExample(
      "db01-relation-projection",
      "하나의 relation을 selection·projection으로 관찰하기",
      "relation_projection.py",
      "customer table의 heading, tuple, domain과 query result가 어떻게 연결되는지 외부 DB 없이 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE customer (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL, tier TEXT NOT NULL CHECK (tier IN ('BASIC', 'PRO'))) ")
db.executemany("INSERT INTO customer VALUES (?, ?, ?)", [(1, "민준", "BASIC"), (2, "서연", "PRO"), (3, "도윤", "PRO")])

heading = [row[1] for row in db.execute("PRAGMA table_info(customer)")]
projection = list(db.execute("SELECT customer_id, name FROM customer WHERE tier = 'PRO' ORDER BY customer_id"))
print("heading=" + ",".join(heading))
print("tuple-count=" + str(db.execute("SELECT COUNT(*) FROM customer").fetchone()[0]))
print("pro-customers=" + ";".join(f"{row[0]}:{row[1]}" for row in projection))
print("order-contract=explicit")`,
      "heading=customer_id,name,tier\ntuple-count=3\npro-customers=2:서연;3:도윤\norder-contract=explicit",
      ["local-db-0121", "sqlite-create-table", "mysql-create-table"],
    )],
    diagnostics: [
      diagnostic("한 column에 전화번호, 이메일, 메신저 id가 형식 구분 없이 섞인다.", "attribute의 domain과 의미가 하나로 고정되지 않았습니다.", ["서로 다른 값 종류와 format 비율을 집계합니다.", "값마다 적용되는 validation·index·retention 규칙을 비교합니다.", "하나의 row에 여러 연락처가 필요한 cardinality를 확인합니다."], "contact_method 같은 별도 relation으로 type·value·verified 상태를 모델링하거나 정말 단일 값이면 명확한 domain을 강제합니다.", "schema review에 단위·timezone·format·enumeration·cardinality 항목을 포함합니다."),
      diagnostic("같은 논리적 고객이 여러 row로 보이는데 어느 것이 최신인지 알 수 없다.", "entity identity와 중복 판정 key가 정의되지 않았고 snapshot과 event를 섞었습니다.", ["후보 key별 duplicate를 집계합니다.", "row가 현재 상태인지 변경 event인지 확인합니다.", "source system과 effective time column을 찾습니다."], "현재 상태 table과 변경 history/event를 분리하고 stable key와 유효 시간 계약을 둡니다.", "ingestion 단계에서 deduplication rule과 late-arrival test를 자동화합니다."),
    ],
    expertNotes: ["관계 모델 검토는 column 목록이 아니라 functional dependency와 business invariant를 문장으로 먼저 적는 작업입니다.", "논리 모델과 물리 index 선택을 분리하면 요구사항 변경 때문에 storage tuning을 곧바로 다시 하지 않아도 됩니다."],
  },
  {
    id: "entity-identity-candidate-primary-key",
    title: "entity identity를 candidate key와 primary key로 고정합니다",
    lead: "row를 찾기 위한 편리한 번호와 현실의 대상을 식별하는 business identity는 같은 문제일 수도, 서로 다른 문제일 수도 있습니다.",
    explanations: [
      "candidate key는 현재 요구사항에서 row를 유일하게 식별할 수 있는 최소 attribute 집합입니다. 회원 id, 검증·정규화된 email, 국가 code와 사업자 번호 조합처럼 여러 후보가 있을 수 있습니다. primary key는 그 후보 중 참조와 저장의 중심으로 선택한 하나이고 나머지 후보 key도 UNIQUE로 보존해야 중복 business entity를 막을 수 있습니다.",
      "auto increment surrogate key는 짧고 변경되지 않아 join과 foreign key에 편리하지만 business 중복을 자동으로 막지 않습니다. id가 다르더라도 같은 provider와 provider_id가 두 번 들어갈 수 있다면 별도 composite UNIQUE가 필요합니다. 반대로 변경 가능한 email을 primary key로 쓰면 모든 child reference와 audit가 변경 정책에 결합됩니다.",
      "key는 값이 유일해 보인다는 표본 관찰만으로 결정하지 않습니다. 재사용 가능성, 발급 주체, tenant scope, 개인정보 노출, offline 생성, merge, 삭제 후 재가입까지 요구사항을 확인합니다. UUID도 충돌 확률을 낮추는 생성 방식일 뿐 어떤 domain object를 대표하는지에 대한 business 계약을 대신하지 않습니다.",
      "원본 members는 auto_increment id와 unique email을 함께 사용해 surrogate와 alternate key의 기본 형태를 보여 줍니다. 그러나 provider_id는 provider와 함께 unique인지, soft-deleted email을 재사용할 수 있는지, email comparison collation이 무엇인지가 드러나지 않으므로 production schema에서는 정책을 더 명시해야 합니다.",
    ],
    concepts: [
      concept("candidate key", "tuple을 유일하게 식별하는 최소 attribute 집합의 후보입니다.", ["superkey에서 불필요한 attribute를 제거했을 때도 uniqueness가 유지되는지 확인합니다.", "현재 data uniqueness가 아니라 모든 허용 상태에서의 business uniqueness를 표현합니다."]),
      concept("surrogate key", "domain 밖에서 생성해 row identity로 사용하는 인공 key입니다.", ["작고 immutable한 참조를 제공하지만 alternate business key constraint는 별도로 필요합니다.", "외부 API에 그대로 노출하면 enumeration과 결합 위험이 있어 public identifier를 나눌 수 있습니다."]),
    ],
    codeExamples: [pythonExample(
      "db01-key-invariants",
      "surrogate key와 alternate business key를 함께 검증하기",
      "key_invariants.py",
      "서로 다른 id만으로 business duplicate가 막히지 않는 이유와 composite UNIQUE의 역할을 재현합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE account (account_id INTEGER PRIMARY KEY, provider TEXT NOT NULL, provider_subject TEXT NOT NULL, UNIQUE (provider, provider_subject))")
db.execute("INSERT INTO account VALUES (1, 'local', 'learner-1')")

duplicate_blocked = False
try:
    db.execute("INSERT INTO account VALUES (2, 'local', 'learner-1')")
except sqlite3.IntegrityError:
    duplicate_blocked = True
db.execute("INSERT INTO account VALUES (2, 'google', 'learner-1')")

rows = list(db.execute("SELECT account_id, provider, provider_subject FROM account ORDER BY account_id"))
print("duplicate-business-key-blocked=" + str(duplicate_blocked).lower())
print("rows=" + ";".join(f"{row[0]}:{row[1]}:{row[2]}" for row in rows))
print("primary-key=account_id")
print("alternate-key=provider+provider_subject")`,
      "duplicate-business-key-blocked=true\nrows=1:local:learner-1;2:google:learner-1\nprimary-key=account_id\nalternate-key=provider+provider_subject",
      ["local-db-0121", "mysql-primary-key", "sqlite-create-table"],
    )],
    diagnostics: [
      diagnostic("auto increment id는 모두 다른데 같은 이메일 계정이 여러 개 생긴다.", "surrogate primary key만 만들고 alternate business key를 constraint로 표현하지 않았습니다.", ["정규화한 이메일 기준 duplicate를 찾습니다.", "case/collation과 tenant scope를 확인합니다.", "soft delete 후 재사용 정책을 확인합니다."], "정책에 맞는 normalized key 또는 tenant+email UNIQUE를 추가하고 기존 duplicate를 먼저 해소합니다.", "migration 전 duplicate detector와 이후 constraint violation metric을 둡니다."),
      diagnostic("사용자가 이메일을 바꾸자 여러 child table update와 cache miss가 발생한다.", "변경 가능한 natural attribute를 모든 reference의 primary key로 사용했습니다.", ["foreign key graph를 조회합니다.", "key 변경 frequency와 cascade 범위를 측정합니다.", "audit에서 이전 identity를 추적할 수 있는지 봅니다."], "immutable surrogate key로 내부 identity를 분리하고 email은 versioned/unique business attribute로 관리합니다.", "key 선택 ADR에 stability·privacy·merge·migration 기준을 기록합니다."),
    ],
    expertNotes: ["multi-tenant key는 tenant_id를 scope에 포함하지 않으면 한 tenant의 uniqueness가 전체 system으로 과도하게 확장될 수 있습니다.", "분산 id 생성은 collision뿐 아니라 정렬 locality, clock rollback, shard leakage, observability trade-off를 함께 검토합니다."],
  },
  {
    id: "relationship-cardinality-optionality",
    title: "관계의 cardinality와 optionality를 foreign key로 번역합니다",
    lead: "‘고객이 주문한다’는 문장만으로는 부족합니다. 한 고객의 주문 수, 주문 없는 고객, 고객 없는 주문 허용 여부와 삭제 정책을 각각 결정해야 합니다.",
    explanations: [
      "one-to-many는 parent primary/unique key를 child foreign key가 참조하는 형태로 구현합니다. child 쪽 foreign key가 NOT NULL이면 각 child는 반드시 parent 하나를 가져야 하고 nullable이면 아직 연결되지 않은 상태를 허용합니다. parent가 child를 반드시 하나 이상 가져야 한다는 최소 cardinality는 단순 foreign key만으로 강제되지 않아 transaction/service 규칙이나 더 복잡한 constraint가 필요할 수 있습니다.",
      "many-to-many는 두 foreign key를 가진 association relation으로 풀어냅니다. 단순 연결만 있더라도 composite primary key 또는 unique constraint로 같은 연결의 중복을 막습니다. 수강일, 역할, 수량처럼 관계 자체의 attribute가 생기면 association row가 독립적인 business 사실이 되며 수명 주기와 key 전략을 별도로 설계합니다.",
      "ON DELETE CASCADE는 편리한 정리 옵션이 아니라 domain 삭제 의미입니다. parent 삭제가 child 사실까지 실제로 무효화할 때만 사용합니다. 결제·감사 기록처럼 보존해야 하는 child는 RESTRICT, anonymization, status transition, retention job 등 다른 정책이 필요합니다. SET NULL은 foreign key가 nullable이고 ‘과거에는 연결됐지만 현재 참조 없음’이 유효한 상태일 때만 맞습니다.",
      "관계를 application object reference로만 구현하면 다른 writer, batch, migration이 무결성을 우회할 수 있습니다. database foreign key는 모든 write 경로에 공통인 마지막 방어선이고, application은 더 친절한 error와 authorization, cross-aggregate 정책을 담당합니다. 두 층의 역할을 중복이 아니라 서로 다른 failure boundary로 이해합니다.",
    ],
    concepts: [
      concept("cardinality", "한 entity instance가 관계 반대편 instance 몇 개와 연결될 수 있는지 나타내는 제약입니다.", ["1:1, 1:N, N:M 최대 cardinality와 0 또는 1 이상의 최소 cardinality를 함께 봅니다.", "시간에 따라 관계가 바뀌면 현재 상태와 history cardinality를 나눠야 합니다."]),
      concept("referential integrity", "child foreign key가 허용된 parent key 또는 NULL만 가리키게 유지하는 불변식입니다.", ["parent 없는 orphan child를 차단합니다.", "delete/update referential action은 domain 수명 주기를 표현합니다."], "foreign key가 authorization이나 business workflow 순서를 대신하지는 않습니다."),
    ],
    codeExamples: [pythonExample(
      "db01-relationship-integrity",
      "1:N과 N:M 관계에서 orphan과 중복 연결 막기",
      "relationship_integrity.py",
      "foreign key와 association composite key가 서로 다른 불변식을 방어하는 과정을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE learner (learner_id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE course (course_id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE);
CREATE TABLE enrollment (
  learner_id INTEGER NOT NULL REFERENCES learner(learner_id) ON DELETE RESTRICT,
  course_id INTEGER NOT NULL REFERENCES course(course_id) ON DELETE RESTRICT,
  enrolled_on TEXT NOT NULL,
  PRIMARY KEY (learner_id, course_id)
);
""")
db.execute("INSERT INTO learner VALUES (1, '민준')")
db.execute("INSERT INTO course VALUES (10, 'SQL 기초')")
db.execute("INSERT INTO enrollment VALUES (1, 10, '2026-07-13')")

orphan_blocked = False
duplicate_blocked = False
try:
    db.execute("INSERT INTO enrollment VALUES (2, 10, '2026-07-13')")
except sqlite3.IntegrityError:
    orphan_blocked = True
try:
    db.execute("INSERT INTO enrollment VALUES (1, 10, '2026-07-14')")
except sqlite3.IntegrityError:
    duplicate_blocked = True

print("orphan-blocked=" + str(orphan_blocked).lower())
print("duplicate-link-blocked=" + str(duplicate_blocked).lower())
print("enrollment-count=" + str(db.execute("SELECT COUNT(*) FROM enrollment").fetchone()[0]))
print("relationship=learner-N:M-course")`,
      "orphan-blocked=true\nduplicate-link-blocked=true\nenrollment-count=1\nrelationship=learner-N:M-course",
      ["mysql-foreign-key", "sqlite-foreign-key", "oracle-relational-structures"],
    )],
    diagnostics: [
      diagnostic("주문 table에 존재하지 않는 customer_id가 들어간다.", "foreign key가 없거나 비활성화됐거나 bulk load가 검사를 우회했습니다.", ["constraint metadata와 enforcement 상태를 봅니다.", "orphan count를 anti-join으로 측정합니다.", "최근 migration·import 설정을 확인합니다."], "orphan을 격리·복구한 뒤 올바른 type/index의 foreign key를 활성화합니다.", "schema drift 검사와 orphan invariant query를 배포 gate에 둡니다."),
      diagnostic("고객 한 명을 삭제했더니 결제·감사 기록까지 연쇄 삭제됐다.", "관계 수명 주기 검토 없이 ON DELETE CASCADE를 선택했습니다.", ["constraint graph와 cascade depth를 확인합니다.", "삭제 dry-run row counts를 계산합니다.", "retention·법적 보존 요구를 확인합니다."], "삭제를 status/anonymization workflow로 바꾸고 보존 child에는 RESTRICT 또는 별도 archive 정책을 적용합니다.", "destructive migration과 delete endpoint에 영향 범위 preview·승인·복구 rehearsal을 둡니다."),
    ],
    expertNotes: ["foreign key column type·signedness·collation 호환성은 vendor별 제약이 있으므로 migration에서 metadata를 비교합니다.", "aggregate boundary를 넘는 강한 일관성이 불가능한 분산 system에서는 outbox·reconciliation·idempotency로 orphan-like 상태의 수렴을 설계합니다."],
  },
  {
    id: "normalization-dependencies-anomalies",
    title: "functional dependency와 변경 anomaly로 정규화를 판단합니다",
    lead: "정규화는 table을 많이 나누는 의식이 아니라 한 사실을 한 곳에서 관리해 서로 모순되는 상태를 구조적으로 줄이는 과정입니다.",
    explanations: [
      "functional dependency X→Y는 같은 X 값을 가진 허용 가능한 모든 tuple이 같은 Y 값을 가져야 한다는 business 규칙입니다. order_id→ordered_at은 주문 identity가 시점을 결정한다는 뜻이고 publisher_id→publisher_name은 출판사 identity가 이름을 결정한다는 뜻입니다. 표본 데이터가 우연히 같은 것과 domain 규칙을 구분해야 합니다.",
      "한 주문 row마다 고객 주소를 복제하면 주소 변경 때 여러 row를 모두 update해야 하는 update anomaly가 생깁니다. 주문이 아직 없는 고객을 저장할 수 없으면 insertion anomaly, 마지막 주문 삭제로 고객 정보까지 사라지면 deletion anomaly입니다. anomaly를 구체적인 business 시나리오로 재현하면 왜 relation을 분리하는지 설명할 수 있습니다.",
      "1NF는 반복 group을 atomic attribute와 별도 rows로 표현하는 출발점이고, 2NF·3NF는 composite key의 일부 또는 non-key를 통한 dependency를 분리합니다. BCNF는 모든 determinant가 candidate key인지 더 엄격히 봅니다. 정규형 이름을 암기하기보다 key·dependency·lossless join·dependency preservation을 검증합니다.",
      "비정규화는 금지어가 아니라 측정된 read 성능과 운영 비용을 교환하는 의도적 결정입니다. summary table, materialized view, cache를 둘 수 있지만 canonical source, refresh/failure semantics, stale tolerance, reconciliation query와 rollback을 함께 설계해야 합니다. 중복 column 하나를 추가하는 순간 두 copy가 다를 때 어느 것이 진실인지 정의해야 합니다.",
    ],
    concepts: [
      concept("functional dependency", "attribute 집합 X의 값이 정해지면 attribute 집합 Y의 값이 하나로 결정되는 business 제약 X→Y입니다.", ["candidate key는 모든 non-key attribute를 결정합니다.", "dependency는 현재 sample이 아니라 허용 가능한 전체 state에 대한 주장입니다."]),
      concept("update anomaly", "같은 사실을 여러 곳에 저장해 일부만 변경되면 모순 상태가 되는 구조적 위험입니다.", ["insert·delete anomaly와 함께 실제 workflow로 재현합니다.", "transaction 하나로 묶는 것만으로 모든 future writer의 중복 규칙을 없애지는 못합니다."]),
    ],
    codeExamples: [pythonExample(
      "db01-normalization-update",
      "출판사 사실을 분리해 한 번만 변경하기",
      "normalization_update.py",
      "반복 문자열을 publisher relation과 foreign key로 분리했을 때 update 지점과 join 결과를 관찰합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE publisher (publisher_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE book (book_id INTEGER PRIMARY KEY, title TEXT NOT NULL, publisher_id INTEGER NOT NULL REFERENCES publisher(publisher_id));
INSERT INTO publisher VALUES (1, '배움출판');
INSERT INTO book VALUES (10, 'SQL 첫걸음', 1), (11, '관계 모델', 1);
""")

affected = db.execute("UPDATE publisher SET name = '배움미디어' WHERE publisher_id = 1").rowcount
rows = list(db.execute("SELECT b.title, p.name FROM book b JOIN publisher p USING (publisher_id) ORDER BY b.book_id"))

print("publisher-update-count=" + str(affected))
print("books=" + str(len(rows)))
print("joined=" + ";".join(f"{title}:{publisher}" for title, publisher in rows))
print("canonical-publisher-rows=" + str(db.execute("SELECT COUNT(*) FROM publisher").fetchone()[0]))`,
      "publisher-update-count=1\nbooks=2\njoined=SQL 첫걸음:배움미디어;관계 모델:배움미디어\ncanonical-publisher-rows=1",
      ["mysql-data-size", "local-db-model01", "sqlite-foreign-key"],
    )],
    diagnostics: [
      diagnostic("같은 출판사의 이름이 row마다 조금씩 다르고 일괄 수정이 누락된다.", "publisher 사실을 book rows에 반복해 update anomaly를 만들었습니다.", ["정규화·공백·대소문자 후 distinct 값을 봅니다.", "publisher identity 후보와 merge 규칙을 찾습니다.", "write path가 몇 개인지 inventory합니다."], "publisher relation을 만들고 book은 stable publisher_id를 참조하도록 backfill·dual-read·cutover합니다.", "canonical writer와 duplicate quality metric, foreign key를 둡니다."),
      diagnostic("정규화 후 join이 느려졌다는 이유로 이름 column을 무계획하게 다시 복제했다.", "query plan과 workload 측정 없이 denormalization을 적용했습니다.", ["실제 slow query와 cardinality estimate를 확인합니다.", "필요 index와 query shape를 먼저 검토합니다.", "stale 허용 시간과 refresh failure를 정의했는지 봅니다."], "index/query를 먼저 검증하고, 필요하면 owner·refresh·reconciliation이 있는 summary/read model로 분리합니다.", "denormalization ADR에 benchmark, consistency SLA, backfill, rollback을 포함합니다."),
    ],
    expertNotes: ["temporal data에서는 현재 값만 분리하는 정규화와 유효 기간을 가진 history modeling을 함께 판단합니다.", "analytics star schema의 intentional redundancy는 OLTP 3NF와 목적이 다르며 pipeline lineage와 refresh contract가 핵심입니다."],
  },
  {
    id: "schema-instance-catalog",
    title: "schema·instance·catalog를 분리해 변화와 현재 상태를 읽습니다",
    lead: "CREATE TABLE 문장은 허용 상태의 규칙을 정의하고, INSERT 결과는 그 규칙 아래 특정 시점의 instance를 만듭니다. 둘을 섞으면 migration과 data bug를 구분할 수 없습니다.",
    explanations: [
      "schema는 table·column·type·constraint·view 같은 구조와 규칙이고 instance는 특정 시점에 저장된 rows입니다. 같은 schema에 오늘 3개, 내일 3만 개의 row가 있을 수 있습니다. schema test는 column·constraint 존재와 migration 순서를 검증하고 data test는 duplicate·orphan·range·distribution을 검증하므로 증거와 복구 방법이 다릅니다.",
      "catalog 또는 data dictionary는 database가 자신의 schema metadata를 relation처럼 제공하는 경계입니다. MySQL INFORMATION_SCHEMA, Oracle data dictionary views, SQLite PRAGMA를 이용하면 기대 schema와 actual schema drift를 자동 비교할 수 있습니다. 단, 권한에 따라 보이는 metadata 범위와 vendor별 이름·상태 표현이 다릅니다.",
      "schema version은 application release와 별도로 추적해야 합니다. migration table에 순서·checksum·성공 상태를 남기고, application이 요구하는 최소/최대 호환 version을 readiness에서 검사합니다. 코드가 먼저 배포되거나 일부 instance만 migration된 상태를 고려해 expand-and-contract로 additive change, backfill, reader/writer 전환, old column 제거를 나눕니다.",
      "ERD와 실제 DDL은 쉽게 어긋납니다. MODEL01.mwb 같은 model artifact는 의도와 관계를 검토하는 근거이고 production catalog는 실행 사실의 근거입니다. 둘의 table·column·key·cardinality diff를 자동화하고, 수동 수정이 발견되면 migration source of truth로 되돌려야 합니다.",
    ],
    concepts: [
      concept("schema", "데이터 구조와 허용 상태를 정의하는 이름·type·constraint·관계의 계약입니다.", ["DDL과 migration으로 version을 변경합니다.", "schema가 맞아도 instance가 business rule을 위반할 수 있습니다."]),
      concept("instance", "특정 시점에 schema 아래 저장된 실제 tuple 집합입니다.", ["transaction마다 관찰 가능한 snapshot이 달라질 수 있습니다.", "row count와 값 분포는 schema가 아니라 data quality 증거입니다."]),
    ],
    codeExamples: [pythonExample(
      "db01-schema-instance-catalog",
      "catalog로 schema를 읽고 instance count와 분리하기",
      "schema_instance.py",
      "PRAGMA metadata와 row query를 나눠 실행해 구조 drift와 data state가 다른 검사임을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE lesson (lesson_id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE, level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5))")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?)", [(1, "관계 모델", 1), (2, "정규화", 3)])

schema = [(row[1], row[2], row[3], row[5]) for row in db.execute("PRAGMA table_info(lesson)")]
instance = list(db.execute("SELECT lesson_id, title, level FROM lesson ORDER BY lesson_id"))

print("schema-columns=" + ";".join(f"{name}:{kind}:notnull={notnull}:pk={pk}" for name, kind, notnull, pk in schema))
print("instance-count=" + str(len(instance)))
print("instance-levels=" + ",".join(str(row[2]) for row in instance))
print("checks=schema-and-data-separated")`,
      "schema-columns=lesson_id:INTEGER:notnull=0:pk=1;title:TEXT:notnull=1:pk=0;level:INTEGER:notnull=1:pk=0\ninstance-count=2\ninstance-levels=1,3\nchecks=schema-and-data-separated",
      ["sqlite-pragma", "mysql-information-schema", "oracle-relational-structures"],
    )],
    diagnostics: [
      diagnostic("개발 DB에는 column이 있는데 운영 한 instance에서만 unknown column 오류가 난다.", "migration version 또는 checksum이 instance 간 drift했습니다.", ["모든 instance의 migration history를 비교합니다.", "catalog에서 actual column/type/default를 조회합니다.", "실패 release의 요구 schema 범위를 확인합니다."], "traffic을 안전하게 격리하고 누락 migration을 idempotent하게 적용하거나 호환 application version으로 rollback합니다.", "readiness schema compatibility와 fleet-wide migration dashboard를 둡니다."),
      diagnostic("ERD에는 foreign key가 있지만 실제 database에는 orphan rows가 있다.", "model artifact와 DDL migration이 동기화되지 않았거나 constraint가 비활성화됐습니다.", ["actual catalog constraint를 조회합니다.", "model export와 migration diff를 봅니다.", "orphan anti-join과 최근 load job을 확인합니다."], "data를 정리한 뒤 migration으로 constraint를 만들고 ERD는 migration에서 재생성하거나 diff gate로 관리합니다.", "diagram-only 변경을 금지하고 model/catalog consistency check를 CI에 둡니다."),
    ],
    expertNotes: ["zero-downtime schema change는 old/new application이 동시에 동작하는 compatibility window를 명시적으로 테스트해야 합니다.", "catalog query 자체도 권한과 lock/metadata 비용이 있으므로 production health check는 최소 query와 cache 전략을 사용합니다."],
  },
  {
    id: "requirements-conceptual-logical-physical",
    title: "요구사항을 conceptual·logical·physical model로 단계적으로 번역합니다",
    lead: "바로 CREATE TABLE을 쓰면 화면 field와 우연한 구현 제약이 domain model로 굳습니다. 먼저 사실·행위·불변식을 언어로 합의합니다.",
    explanations: [
      "conceptual model은 stakeholder 언어로 entity, relationship, 중요한 business event를 표현합니다. ‘회원은 여러 소셜 계정을 연결할 수 있다’, ‘예약 좌석은 같은 상영 회차에서 한 번만 판매된다’처럼 기술 독립적 문장을 만듭니다. 화면 한 장의 입력 field가 아니라 수명 주기 전체를 인터뷰합니다.",
      "logical model은 relation, candidate key, foreign key, cardinality, optionality, functional dependency로 요구사항을 정교화합니다. 아직 MySQL AUTO_INCREMENT나 Oracle SEQUENCE 같은 제품 선택을 섞지 않습니다. 같은 logical invariant가 여러 physical implementation으로 옮겨질 수 있어야 portability와 리뷰가 쉬워집니다.",
      "physical model은 선택한 engine의 data type, index, partition, generated column, naming, tablespace와 migration 전략을 결정합니다. varchar 길이와 index column 순서는 실제 query와 storage 특성에 근거해야 하고, business 의미는 logical model과 traceable해야 합니다.",
      "각 단계에는 추적표가 필요합니다. requirement id가 logical constraint와 application policy로, 다시 DDL/migration/test/monitor로 연결돼야 합니다. database가 직접 강제할 수 없는 cross-row·temporal rule도 owner와 consistency boundary를 잃지 않습니다.",
    ],
    concepts: [
      concept("conceptual model", "기술 선택 전에 domain의 대상·관계·사건을 stakeholder 언어로 표현한 모델입니다.", ["요구사항 누락과 용어 충돌을 발견하는 데 집중합니다.", "화면 navigation이나 table name에 일찍 결합하지 않습니다."]),
      concept("physical model", "특정 DBMS와 workload에 맞춘 type·index·storage·migration 구현입니다.", ["logical invariant를 보존해야 합니다.", "성능 선택은 benchmark와 query plan 증거로 되돌릴 수 있어야 합니다."]),
    ],
    diagnostics: [
      diagnostic("화면 개편 때마다 table column을 대량 rename·add해야 한다.", "UI form을 conceptual domain model로 그대로 복사했습니다.", ["column이 business fact인지 presentation state인지 분류합니다.", "다른 channel/API에서도 같은 fact를 쓰는지 봅니다.", "entity 수명 주기와 화면 수명을 비교합니다."], "stable domain facts와 UI-specific draft/read model을 분리하고 mapping boundary를 둡니다.", "schema 제안서에 requirement trace와 non-UI use case를 포함합니다."),
      diagnostic("MySQL에서 Oracle로 옮길 때 key·boolean·timestamp 의미가 바뀐다.", "logical rule과 vendor physical syntax를 한 문서에 섞고 portability boundary를 정의하지 않았습니다.", ["logical type과 vendor type mapping을 만듭니다.", "generated key·timezone·empty string·NULL 차이를 test합니다.", "vendor-specific DDL/functions를 inventory합니다."], "logical contract를 먼저 고정하고 dialect별 migration adapter와 contract tests를 둡니다.", "지원 DBMS별 compatibility matrix와 continuous integration을 운영합니다."),
    ],
    expertNotes: ["event storming과 temporal modeling은 CRUD 명사만으로 놓치기 쉬운 발생 시점·책임·history 요구를 드러냅니다.", "physical model review에는 예상 cardinality, growth, hot keys, retention, backup/restore 목표와 tenant isolation을 포함합니다."],
  },
  {
    id: "null-missing-unknown",
    title: "NULL을 빈 문자열·0·미수집·해당 없음과 구분합니다",
    lead: "NULL 하나에 여러 business 상태를 몰아넣으면 query의 3값 논리뿐 아니라 API, 통계, migration과 의사결정이 모두 모호해집니다.",
    explanations: [
      "NULL은 SQL에서 값이 없거나 알 수 없음을 나타내는 marker이고 일반 값처럼 = NULL로 비교하지 않습니다. predicate 결과는 TRUE, FALSE뿐 아니라 UNKNOWN이 될 수 있으며 WHERE는 TRUE인 rows만 남깁니다. NOT IN subquery에 NULL이 섞였을 때 예상보다 결과가 사라지는 문제도 이 3값 논리에서 나옵니다.",
      "빈 문자열은 길이 0인 알려진 문자열이고 0은 알려진 수치입니다. ‘전화번호 미수집’, ‘전화번호 없음’, ‘privacy 삭제’, ‘legacy import 실패’를 모두 NULL로 저장하면 원인과 후속 workflow를 구분할 수 없습니다. 필요한 경우 status/reason/effective time을 별도 attribute로 모델링합니다.",
      "NOT NULL은 값의 품질을 모두 보장하지 않습니다. 공백 문자열, sentinel 9999, 잘못된 timezone을 막으려면 CHECK, reference table, application validation과 ingestion quarantine이 필요합니다. default를 넣는 것은 누락을 해결하는 것이 아니라 작성자의 의도를 가릴 수도 있으므로 의미 있는 system-generated value에만 사용합니다.",
      "optional 관계의 nullable foreign key와 domain attribute의 NULL은 다르게 리뷰합니다. 관계가 아직 형성되지 않은 valid state인지, parent 삭제 후 흔적만 남긴 state인지, transaction 중간의 불완전 상태인지에 따라 constraint와 workflow가 달라집니다.",
    ],
    concepts: [
      concept("three-valued logic", "SQL predicate가 TRUE·FALSE·UNKNOWN 세 결과를 가질 수 있는 논리입니다.", ["NULL과 산술·비교한 결과는 대개 UNKNOWN입니다.", "IS NULL, EXISTS, NULL-safe 연산을 의도에 맞게 사용합니다."]),
      concept("sentinel value", "값 없음이나 오류를 표현하려고 정상 domain 안의 특수 값을 빌려 쓰는 방식입니다.", ["0, -1, 9999-12-31 같은 sentinel은 aggregate와 range query를 오염시킵니다.", "별도 status 또는 nullable+reason contract가 더 명확한지 검토합니다."]),
    ],
    diagnostics: [
      diagnostic("WHERE phone != ''로 찾았는데 NULL 전화번호 rows가 빠진다.", "NULL 비교가 UNKNOWN이 되어 WHERE를 통과하지 않았습니다.", ["NULL/empty/whitespace 분포를 각각 집계합니다.", "predicate truth table을 작성합니다.", "ingestion normalization을 확인합니다."], "business 의미에 맞춰 phone IS NOT NULL AND TRIM(phone) <> ''처럼 명시하고 source에서 상태를 정규화합니다.", "nullable column마다 상태 의미와 canonicalization contract tests를 둡니다."),
      diagnostic("NOT IN subquery를 추가하자 결과가 0건이 됐다.", "subquery 결과에 NULL이 포함되어 비교 전체가 UNKNOWN으로 전파됐습니다.", ["subquery key의 NULL count를 봅니다.", "NOT EXISTS equivalent와 결과를 비교합니다.", "foreign key nullable 정책을 확인합니다."], "상관 NOT EXISTS를 사용하거나 NULL을 명시적으로 제외하되 business semantics를 먼저 확정합니다.", "NULL fixture가 포함된 query regression tests를 유지합니다."),
    ],
    expertNotes: ["Oracle은 SQL에서 빈 문자열을 NULL처럼 취급하는 등 vendor 차이가 있어 portability contract에서 반드시 test합니다.", "analytics metric은 unknown을 denominator에서 제외할지 별도 category로 둘지 명시하지 않으면 dashboard가 서로 다른 답을 냅니다."],
  },
  {
    id: "constraints-business-invariants",
    title: "constraint를 오류 장치가 아니라 business invariant의 실행 문서로 사용합니다",
    lead: "좋은 constraint는 잘못된 write를 빠르게 거부하고 모든 writer에게 같은 규칙을 적용하며, 실패 메시지를 요구사항까지 추적할 수 있게 합니다.",
    explanations: [
      "PRIMARY KEY, UNIQUE, NOT NULL, CHECK, FOREIGN KEY는 서로 다른 불변식을 담당합니다. email UNIQUE가 형식까지 보장하지 않고 CHECK가 다른 table의 현재 상태까지 일반적으로 검증하지 못하듯 각 constraint의 표현 범위를 압니다. 표현할 수 없는 규칙은 transaction service, serialized workflow, trigger 또는 asynchronous reconciliation 중 owner를 선택합니다.",
      "constraint 이름은 운영 진단 API입니다. ck_order_amount_positive, uq_account_provider_subject처럼 rule을 드러내면 오류에서 어떤 요구사항이 실패했는지 찾기 쉽습니다. application은 vendor error string 전체를 사용자에게 노출하지 않고 constraint/category를 stable domain error로 번역합니다.",
      "constraint 추가 migration은 기존 data가 이미 규칙을 만족하는지 먼저 감사해야 합니다. invalid rows를 quarantine/backfill하고 write path를 고친 뒤 constraint를 validate합니다. 큰 table에서는 lock, validation scan, replication lag와 rollback 시간을 측정해 online DDL 전략을 선택합니다.",
      "application validation은 사용자에게 빠르고 문맥 있는 피드백을 주고 database constraint는 race와 우회 writer를 막습니다. 둘이 같은 핵심 rule을 방어하더라도 책임이 다릅니다. validation 후 insert 사이에 다른 transaction이 같은 key를 쓸 수 있으므로 uniqueness의 최종 판정은 database가 합니다.",
    ],
    concepts: [
      concept("invariant", "허용된 모든 system state에서 항상 참이어야 하는 business·technical 조건입니다.", ["예: 한 상영 회차의 좌석은 동시에 두 예약에 배정되지 않습니다.", "요구사항→constraint/service→test→metric으로 추적합니다."]),
      concept("defense in depth", "서로 다른 failure boundary에서 같은 중요 규칙을 보완적으로 방어하는 설계입니다.", ["UI validation만으로 API·batch write를 막을 수 없습니다.", "database constraint만으로 친절한 오류나 authorization을 제공할 수 없습니다."]),
    ],
    diagnostics: [
      diagnostic("동시 가입 요청 두 개가 validation을 모두 통과해 중복 이메일이 생긴다.", "check-then-insert race를 application 조회만으로 막았습니다.", ["UNIQUE constraint 존재를 확인합니다.", "동시 request trace와 transaction boundary를 봅니다.", "error translation이 duplicate category를 처리하는지 확인합니다."], "database UNIQUE를 최종 arbiter로 두고 conflict를 idempotent domain response로 변환합니다.", "동시성 integration test와 constraint violation metric을 둡니다."),
      diagnostic("CHECK 추가 배포가 오래 잠기거나 중간에 실패한다.", "기존 data audit와 vendor online validation 전략 없이 즉시 validation했습니다.", ["invalid row count를 read-only query로 측정합니다.", "table size·lock algorithm·replication lag를 봅니다.", "constraint validation 분리 기능을 확인합니다."], "write path 수정→backfill/quarantine→nonblocking constraint 생성→validate 순서로 단계화합니다.", "migration rehearsal과 time/lock budget, abort criterion을 release checklist에 둡니다."),
    ],
    expertNotes: ["cross-row invariant는 unique partial index, exclusion constraint, serialized transaction 등 vendor capability와 isolation 수준을 함께 검토합니다.", "constraint violation 급증은 단순 4xx가 아니라 producer drift·attack·rollback 신호일 수 있어 structured telemetry가 필요합니다."],
  },
  {
    id: "transaction-state-concurrency",
    title: "relation의 유효 상태를 transaction과 concurrency까지 확장합니다",
    lead: "각 SQL 문장이 맞아도 여러 문장 사이에 부분 상태가 노출되거나 concurrent write가 불변식을 깨면 database 모델은 완성되지 않습니다.",
    explanations: [
      "transaction은 여러 read/write를 atomic state transition으로 묶습니다. 예약 생성과 좌석 점유, 주문과 재고 차감처럼 둘 중 하나만 성공하면 유효하지 않은 workflow를 한 commit boundary로 설계합니다. rollback 가능한 기술 범위와 외부 결제·메일 같은 irreversible side effect는 outbox·saga로 분리합니다.",
      "isolation level은 concurrent transaction이 서로의 중간/변경 상태를 어떻게 관찰하는지 결정합니다. lost update, write skew, phantom 같은 anomaly는 single-user 예제로 보이지 않습니다. business invariant가 row 하나인지 여러 rows의 합계인지에 따라 lock, compare-and-set version, unique constraint, serializable transaction을 선택합니다.",
      "autocommit은 문장마다 transaction을 만들 수 있어 다문장 workflow의 atomicity를 제공하지 않습니다. 반대로 긴 transaction은 lock과 version retention을 늘립니다. 사용자 생각 시간이나 network call을 transaction 안에 넣지 말고 필요한 snapshot/read validation과 짧은 write transition으로 나눕니다.",
      "constraint는 commit 또는 statement 시점에 검사될 수 있고 vendor별 deferred constraint 지원이 다릅니다. migration과 batch에서 일시적으로 invalid한 중간 상태가 필요한지, 순서를 바꿔 모든 statement 뒤에도 valid하게 유지할 수 있는지 검토합니다.",
    ],
    concepts: [
      concept("atomic state transition", "여러 변경이 모두 적용되거나 하나도 적용되지 않아 유효 상태 사이만 이동하는 transaction 경계입니다.", ["commit 전 failure path와 retry를 함께 설계합니다.", "외부 side effect는 database rollback과 같은 방식으로 되돌릴 수 없습니다."]),
      concept("isolation anomaly", "각 transaction이 단독으로는 맞아도 interleaving 때문에 의도하지 않은 결과가 생기는 현상입니다.", ["lost update·write skew·phantom을 invariant별로 test합니다.", "isolation 이름만 믿지 말고 DBMS의 실제 locking/MVCC semantics를 확인합니다."]),
    ],
    diagnostics: [
      diagnostic("주문 row는 생겼지만 재고가 줄지 않은 상태가 남는다.", "두 write가 같은 transaction이 아니거나 중간 failure를 삼켰습니다.", ["connection/transaction owner를 추적합니다.", "autocommit과 exception rollback 설정을 확인합니다.", "재시도 시 중복 주문 가능성을 봅니다."], "하나의 local transaction으로 묶고 실패를 rollback하며 request idempotency key를 둡니다.", "fault injection으로 각 statement 전후 failure와 retry를 검증합니다."),
      diagnostic("두 관리자가 같은 row를 수정해 먼저 저장한 변경이 사라진다.", "read-modify-write에 version 비교나 lock이 없어 lost update가 발생했습니다.", ["UPDATE WHERE에 version predicate가 있는지 봅니다.", "affected row count를 검사하는지 확인합니다.", "concurrent trace의 read version을 비교합니다."], "optimistic version column과 affected=1 검사를 사용하거나 충돌 비용이 높으면 적절한 pessimistic lock을 선택합니다.", "동시 update integration test와 conflict metric을 둡니다."),
    ],
    expertNotes: ["hot aggregate는 lock contention을 숨기지 말고 queueing, partitioning, escrow/counter design을 workload로 검증합니다.", "retry는 transaction 전체를 새 snapshot에서 재실행해야 하며 non-idempotent 외부 호출을 무심코 반복하면 안 됩니다."],
  },
  {
    id: "model-review-evolution-evidence",
    title: "ERD·DDL·data·query·운영 증거를 함께 리뷰합니다",
    lead: "모델 검토는 선 연결이 예쁜지 보는 회의가 아닙니다. 요구사항의 반례와 실제 workload, migration·복구 가능성을 증거로 확인하는 engineering review입니다.",
    explanations: [
      "review packet에는 domain glossary, entity/relationship, candidate keys, cardinality/optionality, sensitive data classification, retention, expected volume와 top queries를 포함합니다. 각 relation이 표현하는 한 문장 사실과 owner를 적으면 이름만 보고 생기는 해석 충돌을 줄일 수 있습니다.",
      "반례 중심으로 검토합니다. 같은 이메일의 다른 tenant, provider subject 재사용, 주문 없는 고객, 삭제된 parent의 history, timezone 경계, duplicate webhook, concurrent reservation을 넣어 schema가 허용해야 할 상태와 거부해야 할 상태를 구분합니다. happy path fixture만으로는 key와 NULL 정책의 오류가 드러나지 않습니다.",
      "DDL은 query와 함께 봅니다. 예상 cardinality·selectivity·join direction·sort/pagination을 바탕으로 index 후보를 만들고 EXPLAIN과 representative data로 검증합니다. 모든 foreign key나 status column에 무조건 index를 붙이지 않고 write amplification·storage·cache 효과와 교환합니다.",
      "변경 가능한 schema에는 migration, backfill, verification, observation, rollback/roll-forward가 포함돼야 합니다. backup 존재만이 아니라 목표 RPO/RTO 안에서 restore rehearsal이 성공했는지 확인하고, destructive change 전에 data export·retention·legal hold를 검토합니다.",
    ],
    concepts: [
      concept("schema review", "domain 불변식·data lifecycle·workload·migration·복구를 여러 역할이 근거로 검토하는 과정입니다.", ["ERD와 DDL만이 아니라 negative fixtures와 query plans를 봅니다.", "결정과 미해결 위험을 ADR로 남깁니다."]),
      concept("schema drift", "기대 migration 상태와 실제 database 구조가 달라진 상태입니다.", ["수동 hotfix, 부분 배포, checksum 변경으로 생길 수 있습니다.", "fleet catalog diff와 migration history로 탐지합니다."]),
    ],
    diagnostics: [
      diagnostic("ERD 검토는 통과했지만 첫 production query가 full scan과 timeout을 일으킨다.", "expected workload와 representative cardinality 없이 구조만 검토했습니다.", ["slow query와 actual plan을 수집합니다.", "estimate와 actual rows 차이를 봅니다.", "predicate·join·sort에 맞는 index 후보를 비교합니다."], "query contract와 data distribution fixture로 index/query를 benchmark하고 regression gate를 둡니다.", "schema review에 top query plans·latency budget·growth scenario를 필수화합니다."),
      diagnostic("column 삭제 후 rollback했지만 이전 application이 읽을 data를 복원할 수 없다.", "destructive migration과 code rollback 가능성을 동일하다고 가정했습니다.", ["backup/restore point와 drop 시각을 확인합니다.", "old/new binary의 schema compatibility를 봅니다.", "backfill source가 남아 있는지 확인합니다."], "expand-and-contract와 deprecation window를 사용하고 destructive step 전 restore rehearsal·roll-forward plan을 준비합니다.", "migration마다 reversibility class와 data-loss approval를 기록합니다."),
    ],
    expertNotes: ["PII column은 목적·법적 근거·retention·encryption·masking·access audit를 model metadata와 운영 policy에 연결합니다.", "대규모 schema에서 ownership과 data contract를 명확히 하지 않으면 central review가 bottleneck이 되므로 automated policy와 domain review를 결합합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0121", repository: "local dbstudy snapshot", path: "dbstudy/01_21.sql", usedFor: ["members table 원본", "surrogate·unique·NULL·default·check 감사"], evidence: "원본을 read-only로 읽고 plaintext credential·연락처 fixture는 공개 세션에 복제하지 않았습니다." },
  { id: "local-db-model01", repository: "local dbstudy snapshot", path: "dbstudy/MODEL01.mwb", usedFor: ["Workbench ER model provenance", "model artifact와 DDL 구분"], evidence: "binary model은 SHA-256과 metadata만 확인하고 내부 개인정보를 출력하지 않았습니다." },
  { id: "mysql-reference", repository: "MySQL 8.4 Reference Manual", path: "Reference Manual", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/", usedFor: ["MySQL LTS 기준", "database·table·query 용어"], evidence: "MySQL 8.4 공식 제품 문서입니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["table·column·primary·unique·check"], evidence: "MySQL DDL 공식 문서입니다." },
  { id: "mysql-foreign-key", repository: "MySQL 8.4 Reference Manual", path: "FOREIGN KEY Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html", usedFor: ["parent/child", "referential action", "index/type restrictions"], evidence: "InnoDB foreign key 공식 문서입니다." },
  { id: "mysql-primary-key", repository: "MySQL 8.4 Reference Manual", path: "Primary Key Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/primary-key-optimization.html", usedFor: ["InnoDB primary key physical trade-off"], evidence: "primary key와 clustered storage 관련 공식 문서입니다." },
  { id: "mysql-data-size", repository: "MySQL 8.4 Reference Manual", path: "Optimizing Data Size", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/data-size.html", usedFor: ["3NF", "의도적 비정규화 trade-off"], evidence: "중복 제거와 denormalization을 다루는 공식 문서입니다." },
  { id: "mysql-information-schema", repository: "MySQL 8.4 Reference Manual", path: "INFORMATION_SCHEMA COLUMNS", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html", usedFor: ["catalog", "schema drift"], evidence: "column metadata 조회 공식 문서입니다." },
  { id: "oracle-relational-structures", repository: "Oracle AI Database 26ai Concepts", path: "Oracle Relational Structures", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/oracle-relational-structures.html", usedFor: ["table·row·column", "integrity", "data dictionary"], evidence: "Oracle 관계 구조 공식 개념 문서입니다." },
  { id: "oracle-integrity", repository: "Oracle AI Database 26ai Concepts", path: "Data Integrity", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/data-integrity.html", usedFor: ["NOT NULL·unique·primary·foreign·check"], evidence: "Oracle integrity constraint 공식 개념 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["메모리 portable lab DDL", "constraint behavior"], evidence: "SQLite 공식 문서이며 exact lab의 실행 engine 경계를 설명합니다." },
  { id: "sqlite-foreign-key", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["PRAGMA foreign_keys", "referential integrity lab"], evidence: "SQLite foreign key 공식 문서입니다." },
  { id: "sqlite-pragma", repository: "SQLite Documentation", path: "PRAGMA table_info", publicUrl: "https://www.sqlite.org/pragma.html#pragma_table_info", usedFor: ["catalog lab", "schema metadata"], evidence: "SQLite PRAGMA 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-01-relational-model",
  slug: "db-01-relational-model",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 1,
  title: "테이블·행·열·관계로 현실 문제 모델링하기",
  subtitle: "표 문법을 넘어 relation·identity·cardinality·dependency·constraint·transaction을 하나의 검증 가능한 데이터 계약으로 설계합니다.",
  level: "입문",
  estimatedMinutes: 720,
  coreQuestion: "현실의 대상과 사건을 어떤 기준으로 relation, tuple, attribute와 relationship으로 나누어야 변경·동시성·운영에서도 모순되지 않을까요?",
  summary: "원본 dbstudy/01_21.sql과 MODEL01.mwb를 개인정보·credential을 복제하지 않는 read-only provenance로 감사합니다. members 예제를 출발점으로 relation·tuple·attribute·domain, entity identity와 candidate/surrogate key, 1:N·N:M cardinality와 foreign key, functional dependency와 정규화, schema·instance·catalog, NULL과 3값 논리, constraint defense in depth, transaction·concurrency, ERD·DDL·query·migration review까지 연결합니다. 다섯 Python sqlite3 예제는 외부 DB나 계정 없이 portable 관계 불변식을 exact stdout으로 재현하고, MySQL 8.4·Oracle 26ai와 SQLite의 dialect 차이를 명시적으로 분리합니다.",
  objectives: [
    "relation·tuple·attribute·domain과 SQL table·row·column의 대응 및 차이를 설명한다.",
    "business identity에서 candidate key·primary key·alternate key·surrogate key를 구분해 선택한다.",
    "cardinality·optionality·association relation을 foreign key와 constraint로 번역한다.",
    "functional dependency와 insertion·update·deletion anomaly를 이용해 정규화를 검토한다.",
    "schema·instance·catalog와 conceptual·logical·physical model을 서로 다른 증거로 관리한다.",
    "NULL 3값 논리, constraint, transaction, concurrent anomaly를 포함한 데이터 불변식을 설계한다.",
    "ERD·DDL·data quality·query plan·migration·복구를 묶은 production schema review를 수행한다.",
  ],
  prerequisites: [
    { title: "파일과 표의 기본 개념", reason: "행·열이 있는 표를 읽고 파일을 실행할 수 있으면 시작할 수 있습니다. SQL 선수 지식은 요구하지 않습니다." },
    { title: "Python 실행 환경", reason: "외부 DB 없이 sqlite3 exact lab을 실행하려면 Python 3.11 이상이 필요합니다.", sessionSlug: "python-001-output-names-types" },
  ],
  keywords: ["관계 모델", "relation", "tuple", "attribute", "domain", "entity", "candidate key", "primary key", "foreign key", "cardinality", "normalization", "functional dependency", "NULL", "constraint", "transaction", "ERD"],
  topics,
  lab: {
    title: "학습 플랫폼의 수강·진도 모델을 요구사항에서 검증 가능한 schema로 설계하기",
    scenario: "학습자는 여러 강좌에 등록하고 세션별 진도를 기록합니다. 같은 강좌 중복 등록은 막고, 완료율은 event와 현재 상태 중 어느 것을 source of truth로 둘지 결정하며, 탈퇴 후에도 법적·통계상 보존할 기록의 범위를 정합니다.",
    setup: ["새 작업 폴더와 UTF-8 문서를 만듭니다.", "Python 3.11 이상의 sqlite3를 사용할 수 있는지 확인합니다.", "실명·이메일·전화번호 대신 learner-1 같은 synthetic fixture만 사용합니다.", "요구사항·logical model·physical DDL·검증 결과를 별도 절로 나눕니다."],
    steps: [
      "학습자·강좌·수강·세션·진도 event를 각각 한 문장 사실로 정의합니다.",
      "각 entity의 candidate key와 변경·재사용·tenant scope를 검토합니다.",
      "모든 관계의 최소/최대 cardinality와 parent 삭제 정책을 표로 작성합니다.",
      "functional dependency를 적고 반복 사실에서 세 가지 anomaly를 재현합니다.",
      "logical model을 learner, course, enrollment, lesson, progress_event relations로 옮깁니다.",
      "SQLite portable subset DDL과 MySQL·Oracle dialect 결정표를 별도로 만듭니다.",
      "정상·duplicate·orphan·NULL·out-of-order event·concurrent completion fixtures를 작성합니다.",
      "catalog query로 actual schema와 기대 schema를 비교하고 data invariant queries를 실행합니다.",
      "top read/write query와 예상 cardinality에서 index 후보를 만들고 과잉 index를 제거합니다.",
      "expand-and-contract migration, backfill, verification, rollback/roll-forward, restore rehearsal을 문서화합니다.",
    ],
    expectedResult: ["모든 relation이 표현하는 사실과 owner가 한 문장으로 설명됩니다.", "candidate/alternate key와 cardinality/optionality가 constraint에 추적됩니다.", "invalid fixtures는 기대한 invariant 이름으로 거부되고 정상 fixtures는 exact query 결과를 냅니다.", "schema metadata와 data quality가 서로 다른 검사로 기록됩니다.", "dialect 차이·PII·retention·concurrency·migration·복구 위험이 미해결 항목 없이 결정되거나 owner와 기한을 가집니다."],
    cleanup: ["메모리 SQLite 연결을 닫습니다.", "synthetic fixture 외 data가 없는지 확인합니다.", "임시 database file을 만들었다면 작업 폴더 내부인지 확인한 뒤 제거합니다."],
    extensions: ["multi-tenant isolation을 key와 row policy에 추가합니다.", "progress event에서 current progress projection을 만들어 재생·reconciliation합니다.", "MySQL 8.4와 Oracle 26ai test container에서 dialect contract를 비교합니다.", "10만 학습자·1000강좌 분포로 query plan과 hot key를 benchmark합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 sqlite3 예제를 빈 파일에서 다시 작성하고 각 출력이 어떤 relation invariant를 증명하는지 주석으로 연결하세요.", requirements: ["코드를 복사하지 않고 DDL과 fixture를 다시 입력합니다.", "각 query에 명시적 ORDER BY를 둡니다.", "duplicate와 orphan 예외를 판정 문자열로 출력합니다.", "schema와 instance 검사를 분리합니다.", "실행 환경과 exact stdout을 기록합니다."], hints: ["먼저 heading과 key를 종이에 적으세요.", "vendor 오류 원문보다 어떤 불변식이 거부했는지 기록하세요."], expectedOutcome: "relation·key·relationship·normalization·catalog의 최소 실행 증거를 스스로 재현합니다.", solutionOutline: ["요구사항→DDL→fixture→정상 query→반례→catalog 순서로 작성합니다."] },
    { difficulty: "응용", prompt: "원본 members 모델을 credential·연락처·소셜 identity·soft delete 수명 주기 관점에서 안전하게 재설계하세요.", requirements: ["plaintext password fixture를 어떤 산출물에도 복제하지 않습니다.", "account와 external_identity의 cardinality를 결정합니다.", "email·provider subject의 alternate key와 재사용 정책을 적습니다.", "soft delete·anonymization·retention을 구분합니다.", "기존 data 감사와 expand/backfill/cutover 계획을 만듭니다.", "동시 가입 duplicate test를 포함합니다."], hints: ["한 회원이 여러 provider를 연결할 수 있는지부터 결정하세요.", "deleted_at의 NULL/default 의미를 검토하세요."], expectedOutcome: "보안·identity·retention·migration까지 추적 가능한 회원 logical/physical model이 완성됩니다.", solutionOutline: ["domain glossary→identity→relations→constraints→migration→negative tests 순서로 구성합니다."] },
    { difficulty: "설계", prompt: "예약 좌석 system의 production schema ADR과 증거 packet을 작성하세요.", requirements: ["상영 회차와 좌석의 composite identity를 정의합니다.", "동시 예약 한 건만 성공하는 invariant를 설계합니다.", "결제 외부 side effect와 local transaction/outbox 경계를 둡니다.", "취소·환불·만료·재예약 history를 모델링합니다.", "top queries와 index benchmark를 포함합니다.", "PII·retention·backup/restore RPO/RTO를 포함합니다.", "zero-downtime migration과 rollback/roll-forward를 작성합니다."], hints: ["현재 예약 row만으로 audit와 재현이 가능한지 질문하세요.", "UNIQUE와 isolation/locking을 함께 검토하세요."], expectedOutcome: "domain 불변식에서 동시성·운영·복구까지 닫힌 전문가 수준 schema 설계가 완성됩니다.", solutionOutline: ["invariants→temporal model→transaction→physical design→evidence→operations 순서로 ADR을 작성합니다."] },
  ],
  nextSessions: ["db-02-mysql-database-user-grant"],
  sources,
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "inventory의 dbstudy/01_21.sql과 MODEL01.mwb 두 파일을 모두 read-only로 확인했습니다.",
      "01_21.sql의 plaintext credential·실명·email·전화번호 sample은 학습 자료와 실행 output에 복제하지 않고 구조적 위험만 기록했습니다.",
      "MODEL01.mwb는 binary model provenance와 hash만 확인했으며 내부 값을 공개하거나 임의 변환하지 않았습니다.",
      "다섯 exact lab은 Python sqlite3의 메모리 database를 사용하며 MySQL·Oracle 서버 실행 증거로 주장하지 않습니다.",
    ],
  },
});

export default session;
