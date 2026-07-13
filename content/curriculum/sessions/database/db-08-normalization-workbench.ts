import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python 표준 sqlite3 또는 작은 immutable dependency fixtures로 비정규·정규 relation을 synthetic하게 구성합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "insert/update/delete anomaly, functional dependency, decomposition, junction integrity 또는 derived-data reconciliation을 실행합니다." },
      { lines: "마지막 5줄", explanation: "정렬된 tuples·stable booleans·counts만 출력합니다. 실제 Workbench model과 MySQL/Oracle plans는 별도 catalog·DDL integration으로 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "예제는 정규형의 목적과 반례를 보여 주며 자동 schema 정규화 도구가 아닙니다."] },
    experiments: [
      { change: "functional dependency 또는 candidate key 하나를 바꿉니다.", prediction: "같은 decomposition이 더는 lossless/dependency-preserving하지 않거나 다른 normal form 판정이 나옵니다.", result: "table 모양이 아니라 실제 business rule에서 정규화를 시작해야 함을 확인합니다." },
      { change: "denormalized derived value를 한 writer에서만 갱신합니다.", prediction: "source truth와 cache/snapshot 사이 mismatch가 생깁니다.", result: "성능 최적화에는 owner·refresh·reconciliation이 필요합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "requirements-relations-invariants",
    title: "화면·엑셀·ERD보다 먼저 사실·식별자·불변식을 문장으로 씁니다",
    lead: "정규화는 column을 기계적으로 쪼개는 규칙이 아니라 어떤 사실이 무엇에 의해 결정되는지 명확히 해 중복과 모순을 줄이는 설계 과정입니다.",
    explanations: [
      "relation을 만들기 전에 entity, event, association, attribute와 lifecycle을 구분합니다. ‘주문’은 customer와 book의 단순 중간 행이 아니라 가격·주문 시각·상태·감사 수명을 가진 event일 수 있습니다. 같은 이름이라도 현재값인지 이력인지, tenant scope와 삭제/보존 규칙이 무엇인지 owner에게 확인합니다.",
      "원본 MODEL01.mwb와 MODEL02.mwb는 Workbench archive 내부의 MySQL table·column·foreign-key·index objects를 포함하고 StudyWork.sql은 CREATE TABLE 1·PK 1·UNIQUE 4·INSERT 1을 담습니다. 파일이 열리고 diagram이 보인다는 사실보다 actual objects와 business dependencies, generated DDL·live catalog가 일치하는지를 검토합니다.",
      "각 relation은 candidate key와 row가 나타내는 한 사실을 문장으로 씁니다. `order_id -> customer_id, ordered_at`와 `(order_id, product_id) -> quantity, unit_price`처럼 결정 관계를 명시하면 header/item 분리 근거가 생깁니다. surrogate id는 business dependencies를 자동 제거하지 않습니다.",
      "정규화 목표는 update/insert/delete anomaly 감소와 integrity enforcement, 이해 가능한 ownership입니다. table 수 최소화나 join 제거가 목적이 아니며, 모든 중복이 나쁜 것도 아닙니다. 승인된 snapshot/cache는 provenance·refresh·reconciliation을 가진 의도적 중복입니다.",
    ],
    concepts: [
      c("relation", "같은 heading의 tuples 집합으로 한 종류의 사실을 표현하는 논리 구조입니다.", ["candidate keys와 constraints를 갖습니다.", "physical table 구현과 구분해 사고할 수 있습니다."]),
      c("functional dependency", "attribute set X의 값이 같으면 attribute set Y 값도 반드시 같다는 business constraint X→Y입니다.", ["sample data 우연이 아니라 모든 valid states의 규칙입니다.", "normal form 판정의 입력입니다."]),
    ],
    diagnostics: [
      d("ERD에는 table이 많지만 각 row가 어떤 사실인지 설명하지 못한다.", "화면 fields를 table로 옮기고 keys/dependencies/lifecycle 분석을 생략했습니다.", ["각 table의 one-row sentence를 요구합니다.", "candidate keys와 update owner를 확인합니다.", "NULL·repeating fields와 cross-row contradictions를 찾습니다."], "domain owner와 facts/dependencies를 다시 모델링하고 decomposition/constraints를 근거로 ERD를 수정합니다.", "schema review template에 row meaning·keys·FDs·lifecycle을 필수화합니다."),
      d("surrogate id를 추가했으니 3NF라고 판단한다.", "새 id가 원래 business dependencies와 duplicate anomaly를 없앤다고 오해했습니다.", ["non-key determinants를 목록화합니다.", "business candidate keys/UNIQUE를 확인합니다.", "같은 fact가 여러 rows에 반복되는지 봅니다."], "surrogate PK와 별도로 actual FDs를 분석해 relations와 alternate constraints를 설계합니다.", "normal-form 판정에 surrogate를 제외한 business dependencies를 포함합니다."),
    ],
    expertNotes: ["business 규칙이 불명확하면 model을 확정하지 말고 가정·owner·반례를 ADR에 기록합니다.", "event history와 current projection을 한 table에 섞지 않고 source event와 rebuildable view/projection의 역할을 분리합니다."],
  },
  {
    id: "first-normal-form-domains",
    title: "1NF를 쉼표 분리 문자열 금지가 아니라 row·attribute·domain의 관계 모델로 이해합니다",
    lead: "한 cell에 여러 phone·tag·item을 저장하면 cardinality·reference·검색·update를 database가 독립 facts로 강제하기 어렵습니다.",
    explanations: [
      "1NF 설명에서 ‘atomic’은 문자열을 더 쪼갤 수 없다는 철학적 뜻이 아니라 해당 domain/operation에서 attribute가 하나의 value로 취급되고 repeating group이 relation으로 표현되는지 봅니다. 주소를 언제 구조화할지는 검색·validation·locale 요구에 달렸습니다.",
      "phone1, phone2, phone3 columns는 최대 개수를 schema에 박고 순서·type·verified_at을 표현하기 어렵습니다. comma-separated phones는 delimiter escaping, uniqueness, foreign references와 index use가 깨집니다. customer_phone(customer_id, phone, label, position, verified_at) association으로 cardinality를 모델링합니다.",
      "JSON/array column이 무조건 비정규라는 단순 규칙도 피합니다. 값 전체가 한 aggregate로만 읽고 쓰이며 내부 요소를 관계 query/constraint/reference하지 않는다면 bounded document가 적절할 수 있습니다. 내부 items를 join·unique·부분 update한다면 child relation이 더 명확합니다.",
      "domain constraints에는 type, NULL/empty, canonicalization, range, units, timezone와 code set을 포함합니다. 1NF table도 comma field를 제거했을 뿐 domain validation이 없으면 잘못된 values를 얼마든지 저장합니다.",
    ],
    concepts: [
      c("repeating group", "한 entity row 안에 같은 의미의 여러 values를 numbered columns나 encoded list로 반복한 구조입니다.", ["child/association relation 후보입니다.", "cardinality와 element constraints를 모델링합니다."]),
      c("domain", "attribute가 취할 수 있는 값의 의미·표현·제약 집합입니다.", ["type만이 아니라 unit·format·NULL policy를 포함합니다.", "같은 물리 type도 다른 domains일 수 있습니다."]),
    ],
    codeExamples: [py(
      "db08-first-normal-form",
      "쉼표 phone field를 child rows로 분해해 개별 uniqueness 확보",
      "first_normal_form.py",
      "encoded list와 normalized child relation을 비교하고 중복 phone을 constraint로 차단합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE customer (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
db.execute("CREATE TABLE customer_phone (customer_id INTEGER NOT NULL REFERENCES customer(customer_id), phone TEXT NOT NULL, label TEXT NOT NULL, UNIQUE (customer_id, phone))")
db.execute("INSERT INTO customer VALUES (1, '학습자')")
db.executemany("INSERT INTO customer_phone VALUES (?, ?, ?)", [(1, "010-0000-0001", "mobile"), (1, "02-000-0002", "home")])

duplicate_blocked = False
try:
    db.execute("INSERT INTO customer_phone VALUES (1, '010-0000-0001', 'other')")
except sqlite3.IntegrityError:
    duplicate_blocked = True

phones = list(db.execute("SELECT phone, label FROM customer_phone WHERE customer_id=1 ORDER BY phone"))
print("phone-count=" + str(len(phones)))
print("phones=" + ";".join(f"{phone}:{label}" for phone, label in phones))
print("duplicate-blocked=" + str(duplicate_blocked).lower())
print("element-queryable=true")
print("repeating-columns=0")`,
      "phone-count=2\nphones=010-0000-0001:mobile;02-000-0002:home\nduplicate-blocked=true\nelement-queryable=true\nrepeating-columns=0",
      ["codd-1970", "mysql-create-table", "mysql-foreign-key", "sqlite-create-table", "sqlite-foreign-key"],
    )],
    diagnostics: [
      d("태그 검색이 LIKE '%sql%'로 되어 sql2도 함께 나온다.", "여러 독립 tags를 delimiter string 하나에 저장했습니다.", ["tag cardinality/identity를 확인합니다.", "delimiter/escaping/case normalization을 봅니다.", "tag별 uniqueness/reference/query 요구를 확인합니다."], "tag와 entity_tag association relations로 분해하고 canonical unique keys/indexes를 둡니다.", "repeating-domain fields를 schema review에서 탐지하고 query/constraint 요구를 묻습니다."),
      d("child table로 분리했지만 같은 phone이 여러 번 들어간다.", "1NF decomposition만 하고 candidate key와 canonicalization을 정의하지 않았습니다.", ["duplicate scope가 customer/global/tenant인지 확인합니다.", "normalized phone domain을 봅니다.", "NULL/verified history 정책을 확인합니다."], "domain canonicalization과 scope에 맞는 UNIQUE/temporal model을 추가합니다.", "정규화 exercise마다 keys·constraints·negative fixtures를 함께 요구합니다."),
    ],
    expertNotes: ["EAV는 유연해 보이지만 type/FK/required/query constraints를 application metadata로 밀어내므로 제한된 sparse-extension use case와 governance가 필요합니다.", "localized name/address처럼 구조가 지역별로 다른 domain은 검증된 library·versioned representation과 원문 보존을 함께 검토합니다."],
  },
  {
    id: "candidate-keys-dependency-discovery",
    title: "candidate key와 functional dependency를 sample uniqueness가 아닌 domain rule로 발견합니다",
    lead: "현재 데이터에서 값이 우연히 겹치지 않는다고 UNIQUE나 determinant로 선언하면 미래의 정상 입력을 막거나 중복을 놓칩니다.",
    explanations: [
      "candidate key는 relation tuple을 유일하게 결정하는 minimal attribute set입니다. superkey에서 불필요 attribute를 제거해 minimality를 확인하고 natural/business key의 stability·privacy와 surrogate reference key를 비교합니다. surrogate를 선택해도 candidate key는 UNIQUE로 남겨야 합니다.",
      "FD는 질문으로 찾습니다. ‘같은 course_code이면 title/owner가 항상 같은가? campus별로 달라지는가? 시간이 지나면 바뀌는가?’ scope·time·status를 포함해야 합니다. `(tenant_id, code) -> ...`처럼 multi-tenant 범위를 놓치지 않습니다.",
      "NULL을 포함한 optional identifiers는 relational FD와 SQL UNIQUE semantics가 다를 수 있습니다. absent/unknown/not-applicable 상태를 구분하고 required candidate는 NOT NULL+UNIQUE, conditional/current uniqueness는 vendor feature나 registry relation을 검토합니다.",
      "profiling query는 candidate를 발견하는 증거일 뿐 규칙을 확정하지 않습니다. duplicate groups, determinant→multiple dependent count와 NULL distribution을 측정하고 domain owner·source contracts로 승인한 뒤 constraints를 staged migration으로 적용합니다.",
    ],
    concepts: [
      c("candidate key", "모든 attributes를 결정하며 그 어떤 proper subset도 key가 아닌 minimal determinant입니다.", ["여러 candidate keys가 있을 수 있습니다.", "선택되지 않은 keys도 alternate constraints가 됩니다."]),
      c("minimality", "determinant/key에서 attribute 하나라도 제거하면 uniqueness/결정성이 깨지는 성질입니다.", ["불필요하게 넓은 composite key를 막습니다.", "business scope를 누락하지 않습니다."]),
    ],
    diagnostics: [
      d("email UNIQUE가 해외 계정 합병/변경 workflow를 막는다.", "현재 sample에서 unique한 mutable contact를 immutable identity로 확정했습니다.", ["email ownership/change/reuse rules를 확인합니다.", "tenant/provider/time scope를 봅니다.", "account identity와 contact method를 구분합니다."], "stable account id와 versioned/verified contact relation으로 재모델링하고 의도한 current uniqueness를 적용합니다.", "candidate key ADR에 stability·scope·reuse·privacy 반례를 요구합니다."),
      d("복합키에 모든 columns를 넣어 중복은 없지만 참조가 너무 넓다.", "minimal candidate key를 찾지 않고 row 전체를 superkey로 사용했습니다.", ["columns를 하나씩 제거해 determinant를 검토합니다.", "association fact와 attributes를 구분합니다.", "referencing FKs/index width를 봅니다."], "minimal business key를 UNIQUE로 정하고 필요하면 narrow surrogate PK를 참조용으로 둡니다.", "model review에서 superkey와 candidate key를 구분합니다."),
    ],
    expertNotes: ["probabilistic data profiling은 hidden duplicates/NULL을 찾지만 domain의 모든 미래 states를 증명하지 못합니다.", "sensitive natural keys를 wide FKs/logs/events에 반복하지 않고 internal surrogate와 protected alternate lookup을 분리합니다."],
  },
  {
    id: "second-normal-form-partial-dependency",
    title: "2NF에서 composite key 일부에만 의존하는 facts를 분리합니다",
    lead: "(order_id, product_id)가 key인 item row에 product_name을 반복하면 product_id만으로 결정되는 사실이 주문마다 중복됩니다.",
    explanations: [
      "2NF는 1NF이고 모든 non-prime attribute가 candidate key의 proper subset에 부분 의존하지 않는 상태입니다. single-attribute candidate key relation은 정의상 partial dependency가 없지만 transitive/other anomalies는 남을 수 있습니다.",
      "enrollment(student_id, course_id, student_name, course_title, grade)에서 student_name은 student_id, course_title은 course_id에 의존하고 grade만 pair에 의존합니다. student, course, enrollment로 분해하면 이름/제목 update가 한 곳으로 모이고 enrollment는 association fact만 가집니다.",
      "주문의 unit_price는 현재 product_price와 같아 보여도 주문 시점 snapshot이라는 별도 fact일 수 있어 order_item에 남아야 합니다. dependency 판정은 attribute 이름이 아니라 시간 의미와 business invariant를 봅니다. current price를 join해 history를 바꾸지 않습니다.",
      "decomposition 후 parent keys/FKs, association composite UNIQUE와 optionality를 constraints로 구현합니다. relation을 나눴지만 application이 이름/제목을 child에 다시 복제해 쓰면 anomaly가 돌아오므로 write ownership을 명시합니다.",
    ],
    concepts: [
      c("partial dependency", "composite candidate key의 proper subset이 non-prime attribute를 결정하는 FD입니다.", ["2NF violation의 핵심입니다.", "subset fact를 별도 relation으로 분리합니다."]),
      c("prime attribute", "어떤 candidate key에라도 포함되는 attribute입니다.", ["2NF/3NF formal 판정에 사용합니다.", "primary key 구성원만을 뜻하지 않습니다."]),
    ],
    codeExamples: [py(
      "db08-second-normal-form",
      "enrollment partial dependencies를 student·course로 분해",
      "second_normal_form.py",
      "association grade와 student/course facts를 분리해 한 이름 변경이 모든 enrollment에 반영되는 구조를 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE student (student_id INTEGER PRIMARY KEY, student_name TEXT NOT NULL)")
db.execute("CREATE TABLE course (course_id INTEGER PRIMARY KEY, course_title TEXT NOT NULL)")
db.execute("CREATE TABLE enrollment (student_id INTEGER REFERENCES student, course_id INTEGER REFERENCES course, grade TEXT NOT NULL, PRIMARY KEY (student_id, course_id))")
db.executemany("INSERT INTO student VALUES (?, ?)", [(1, "민준"), (2, "서연")])
db.executemany("INSERT INTO course VALUES (?, ?)", [(10, "DB"), (11, "Java")])
db.executemany("INSERT INTO enrollment VALUES (?, ?, ?)", [(1, 10, "A"), (1, 11, "B"), (2, 10, "A")])
db.execute("UPDATE student SET student_name='민준-수정' WHERE student_id=1")

rows = list(db.execute("SELECT e.student_id, s.student_name, e.course_id, c.course_title, e.grade FROM enrollment e JOIN student s USING(student_id) JOIN course c USING(course_id) ORDER BY e.student_id, e.course_id"))
print("enrollments=" + str(len(rows)))
print("student1-name-copies=" + str(sum(name == "민준-수정" for sid, name, *_ in rows if sid == 1)))
print("stored-student-name-columns=1")
print("stored-course-title-columns=1")
print("association-key=student_id+course_id")`,
      "enrollments=3\nstudent1-name-copies=2\nstored-student-name-columns=1\nstored-course-title-columns=1\nassociation-key=student_id+course_id",
      ["codd-1970", "mysql-create-table", "mysql-foreign-key", "sqlite-create-table"],
    )],
    diagnostics: [
      d("한 학생 이름 수정 뒤 enrollment rows마다 다른 이름이 보인다.", "student_name이 composite enrollment key의 student_id subset에 부분 의존해 반복 저장됐습니다.", ["student_id별 distinct names를 집계합니다.", "authoritative student owner를 확인합니다.", "history snapshot 요구인지 봅니다."], "student relation을 authoritative로 분리하고 enrollment가 FK로 참조하게 migration합니다.", "composite-key relations의 subset determinants를 review합니다."),
      d("정규화 후 주문 과거 가격이 현재 가격으로 바뀌었다.", "order-time snapshot unit_price를 product current-price partial dependency로 잘못 분류했습니다.", ["가격의 effective time/contract를 확인합니다.", "invoice/audit requirements를 봅니다.", "source price와 order line provenance를 확인합니다."], "current catalog price와 immutable order-line agreed price를 서로 다른 facts로 복구·모델링합니다.", "dependency 문장에 시점과 lifecycle을 포함합니다."),
    ],
    expertNotes: ["association에 자체 lifecycle/외부 reference가 생기면 surrogate PK를 추가해도 pair UNIQUE를 유지해 duplicate relation을 막습니다.", "snapshot attribute는 source id/version/effective time를 함께 보존해 의도적 중복임을 추적합니다."],
  },
  {
    id: "third-normal-form-transitive",
    title: "3NF에서 non-key determinant를 분리해 이행 종속 anomaly를 제거합니다",
    lead: "employee_id가 department_id를, department_id가 department_name/location을 결정한다면 department facts를 employee rows에 반복하지 않습니다.",
    explanations: [
      "3NF의 실무적 설명은 key가 아닌 attribute가 다른 non-key attribute를 통해 key에 이행 의존하지 않게 하는 것입니다. formal 정의는 모든 non-trivial FD X→A에서 X가 superkey이거나 A가 prime attribute인 조건입니다. 단순 slogan보다 모든 candidate keys/FDs로 판정합니다.",
      "employee(employee_id, department_id, department_name)에서 department_name update anomaly, 새 department without employee insert anomaly, 마지막 employee delete 시 department loss anomaly가 생깁니다. department relation과 FK로 분리하면 각 fact의 lifecycle과 constraint owner가 명확해집니다.",
      "우편번호→도시 같은 규칙은 국가/시점/외부 authoritative dataset에 따라 항상 성립하지 않을 수 있습니다. sample data로 transitive FD를 확정하지 않고 domain service/version과 user override policy를 검토합니다.",
      "decomposition은 lossless join이어야 하며 필요한 dependencies를 constraints/triggers/application boundary에서 유지할 수 있는지 봅니다. join 결과가 원래 valid tuples를 재구성하면서 spurious rows를 만들지 않는지 candidate key/FK로 증명합니다.",
    ],
    concepts: [
      c("transitive dependency", "key가 non-key determinant를 거쳐 다른 non-key attribute를 결정하는 의존입니다.", ["update/insert/delete anomaly를 만들 수 있습니다.", "determinant fact를 별도 relation으로 분리합니다."]),
      c("lossless decomposition", "분해한 relations를 natural/key join했을 때 원래 relation의 valid tuples를 정확히 복원하고 가짜 tuples를 만들지 않는 성질입니다.", ["공통 attribute가 한쪽 key가 되는 조건 등을 사용합니다.", "fixture와 constraints로 검증합니다."]),
    ],
    codeExamples: [py(
      "db08-third-normal-form",
      "department fact를 employee에서 분리해 anomaly 제거",
      "third_normal_form.py",
      "department 이름을 한 row에서 수정하고 모든 employees가 join으로 같은 canonical 값을 보는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE department (department_id INTEGER PRIMARY KEY, department_name TEXT NOT NULL UNIQUE)")
db.execute("CREATE TABLE employee (employee_id INTEGER PRIMARY KEY, employee_name TEXT NOT NULL, department_id INTEGER NOT NULL REFERENCES department)")
db.execute("INSERT INTO department VALUES (10, '플랫폼')")
db.executemany("INSERT INTO employee VALUES (?, ?, ?)", [(1, "A", 10), (2, "B", 10)])
db.execute("UPDATE department SET department_name='데이터플랫폼' WHERE department_id=10")

rows = list(db.execute("SELECT e.employee_id, d.department_name FROM employee e JOIN department d USING(department_id) ORDER BY e.employee_id"))
names = {name for _, name in rows}
print("employees=" + str(len(rows)))
print("department-names=" + ",".join(sorted(names)))
print("canonical-name-count=" + str(len(names)))
print("employee-stores-department-name=false")
print("lossless-join=" + str(len(rows) == 2).lower())`,
      "employees=2\ndepartment-names=데이터플랫폼\ncanonical-name-count=1\nemployee-stores-department-name=false\nlossless-join=true",
      ["codd-1970", "mysql-create-table", "mysql-foreign-key", "sqlite-create-table", "sqlite-foreign-key"],
    )],
    diagnostics: [
      d("department 이름이 employee rows마다 다르다.", "department_id→department_name fact를 employee table에 반복 저장했습니다.", ["department_id별 distinct names를 집계합니다.", "authoritative owner와 history 요구를 봅니다.", "동시 writers를 확인합니다."], "department relation을 만들고 canonical mapping/backfill 후 FK로 참조하도록 단계 이관합니다.", "non-key determinants와 update fan-out을 schema review에서 검사합니다."),
      d("분해 후 join에서 원래 없던 조합이 생긴다.", "lossless join 조건과 keys를 확인하지 않고 attributes를 임의로 나눴습니다.", ["공통 attributes와 각 relation candidate keys를 봅니다.", "spurious tuple fixture를 만듭니다.", "FK/UNIQUE constraints를 확인합니다."], "dependency 근거로 decomposition을 다시 설계하고 공통 determinant를 key/constraint로 강제합니다.", "normalization review에 lossless/dependency-preservation proof 또는 counterexample을 요구합니다."),
    ],
    expertNotes: ["3NF는 모든 anomaly를 제거하지 않으며 multi-valued/join dependencies나 temporal overlap은 추가 모델링이 필요합니다.", "reference/master data는 별도 relation이어도 source synchronization과 effective-date/version 정책을 운영해야 합니다."],
  },
  {
    id: "bcnf-dependency-preservation",
    title: "BCNF와 dependency preservation의 trade-off를 반례로 검토합니다",
    lead: "3NF보다 강한 BCNF는 모든 non-trivial FD의 determinant가 superkey이길 요구하지만 decomposition이 모든 dependencies를 개별 constraints로 보존하지 못할 수 있습니다.",
    explanations: [
      "BCNF는 모든 non-trivial X→Y에서 X가 superkey인 relation입니다. multiple overlapping candidate keys가 있는 scheduling/teaching 관계에서 3NF지만 BCNF가 아닌 사례가 생길 수 있습니다. 초급 slogan 대신 실제 FDs·keys를 closure로 계산합니다.",
      "BCNF decomposition은 anomaly를 더 줄일 수 있지만 어떤 FD가 두 relations를 join해야만 검사되는 경우 dependency preservation을 잃습니다. 3NF synthesis는 dependency preservation을 우선할 수 있어 둘 사이 trade-off를 workload·constraint enforcement로 결정합니다.",
      "모든 business rule을 foreign key/unique/check 하나로 표현할 수 없습니다. cross-row temporal overlap, capacity와 distributed ownership은 exclusion/locking/higher isolation/service reconciliation이 필요합니다. normal form label이 운영 invariant를 자동 보장하지 않습니다.",
      "4NF/5NF는 independent multivalued facts와 join dependencies를 다룹니다. course에 instructors와 textbooks가 독립적으로 여러 개 있을 때 한 table에 모든 combinations를 저장하면 cross-product duplicate가 생기므로 두 associations로 분리합니다. 실제 dependency가 독립인지 확인합니다.",
    ],
    concepts: [
      c("BCNF", "모든 non-trivial functional dependency의 determinant가 superkey인 normal form입니다.", ["3NF보다 강합니다.", "dependency preservation trade-off가 있을 수 있습니다."]),
      c("dependency preservation", "분해된 각 relation의 constraints만 검사해 원래 functional dependencies를 모두 강제할 수 있는 성질입니다.", ["join 없이 enforcement 가능한지 봅니다.", "lossless와 별개입니다."]),
    ],
    diagnostics: [
      d("BCNF로 나눈 뒤 원래 업무 규칙 위반을 두 table 각각은 허용한다.", "decomposition이 dependency-preserving인지 검토하지 않았습니다.", ["원래 FD projection을 각 relation에 계산합니다.", "join해야만 드러나는 violation fixture를 만듭니다.", "enforcement owner/cost를 확인합니다."], "3NF 대안 또는 transaction/service constraint를 선택하고 explicit invariant test를 둡니다.", "BCNF 승인에 lossless와 dependency preservation 분석을 모두 요구합니다."),
      d("4NF라고 주장하며 associations를 나눴지만 실제로 instructor별 교재 제약이 사라졌다.", "두 multivalued facts가 독립이라는 가정이 틀렸습니다.", ["instructor-textbook dependency를 domain owner에게 확인합니다.", "valid/invalid combinations를 봅니다.", "association에 추가 attributes/lifecycle이 있는지 확인합니다."], "실제 ternary relationship 또는 constraints를 모델링하고 독립한 facts만 분리합니다.", "고급 정규화에서 independence assumption과 counterexample을 문서화합니다."),
    ],
    expertNotes: ["formal closure/minimal cover 도구는 입력 FDs가 정확할 때만 유용하므로 domain 검증을 대체하지 않습니다.", "정규형 이름보다 어떤 anomalies가 남고 어디서 enforcement되는지를 ADR에 명시하는 것이 운영에 더 중요합니다."],
  },
  {
    id: "relationship-cardinality-association",
    title: "1:1·1:N·N:M의 cardinality·optionality·association lifecycle을 keys와 FKs로 구현합니다",
    lead: "ERD의 crow's-foot 그림은 방향을 보여 주지만 NULL, UNIQUE, delete action과 concurrent duplicate를 실제로 막는 것은 schema constraints입니다.",
    explanations: [
      "1:N은 child에 NOT NULL 또는 nullable FK를 두어 mandatory/optional relationship을 표현합니다. parent 없는 child, child 있는 parent 삭제와 tenant-cross reference를 FK/action/composite key로 결정합니다. CASCADE를 cleanup 편의로 선택하지 않습니다.",
      "N:M은 junction relation으로 분해하고 두 parent keys의 composite PK/UNIQUE를 둡니다. association 자체의 role, quantity, enrolled_at, status와 history가 있으면 그것이 독립 fact이며 surrogate id를 추가해도 natural pair/time uniqueness를 유지합니다.",
      "1:1은 FK에 UNIQUE를 추가하거나 shared primary key로 구현합니다. 실제로 항상 1:1인지, optional extension·security boundary·vertical partition 때문인지 검토합니다. 근거 없는 1:1 table split은 joins와 lifecycle complexity만 늘립니다.",
      "ERD cardinality는 minimum/maximum과 시점 규칙을 포함합니다. ‘주문은 항목을 하나 이상 가져야 한다’는 child FK만으로 parent의 최소 child 수를 보장하지 못해 aggregate transaction/workflow constraint가 필요합니다.",
    ],
    concepts: [
      c("cardinality", "한 entity instance가 다른 entity instances와 연결될 수 있는 최소·최대 개수 규칙입니다.", ["1:1·1:N·N:M과 optionality를 포함합니다.", "keys/FKs/workflow로 구현합니다."]),
      c("junction relation", "N:M relationship의 pair와 그 관계 자체 attributes를 tuples로 표현하는 relation입니다.", ["duplicate pair를 constraint로 막습니다.", "association lifecycle을 모델링합니다."]),
    ],
    codeExamples: [py(
      "db08-junction-integrity",
      "N:M enrollment를 junction relation과 composite key로 강제",
      "junction_integrity.py",
      "parent 존재와 duplicate association을 동시에 막고 관계 자체 enrolled_on을 저장합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE learner (learner_id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE course (course_id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE enrollment (learner_id INTEGER REFERENCES learner, course_id INTEGER REFERENCES course, enrolled_on TEXT NOT NULL, PRIMARY KEY (learner_id, course_id))")
db.execute("INSERT INTO learner VALUES (1)")
db.execute("INSERT INTO course VALUES (10)")
db.execute("INSERT INTO enrollment VALUES (1, 10, '2026-07-14')")

duplicate_blocked = orphan_blocked = False
try:
    db.execute("INSERT INTO enrollment VALUES (1, 10, '2026-07-15')")
except sqlite3.IntegrityError:
    duplicate_blocked = True
try:
    db.execute("INSERT INTO enrollment VALUES (1, 99, '2026-07-15')")
except sqlite3.IntegrityError:
    orphan_blocked = True

print("relations=" + str(db.execute("SELECT COUNT(*) FROM enrollment").fetchone()[0]))
print("duplicate-blocked=" + str(duplicate_blocked).lower())
print("orphan-blocked=" + str(orphan_blocked).lower())
print("key=learner_id+course_id")
print("relationship-attribute=enrolled_on")`,
      "relations=1\nduplicate-blocked=true\norphan-blocked=true\nkey=learner_id+course_id\nrelationship-attribute=enrolled_on",
      ["local-model01", "local-model02", "mysql-foreign-key", "sqlite-create-table", "sqlite-foreign-key"],
    )],
    diagnostics: [
      d("junction table에 같은 learner-course pair가 여러 번 생긴다.", "surrogate id만 있고 relationship candidate uniqueness가 없습니다.", ["pair별 duplicates와 history semantics를 확인합니다.", "soft delete/re-enrollment 규칙을 봅니다.", "concurrent inserts를 재현합니다."], "current relation이면 pair UNIQUE/PK, history면 effective period와 overlap invariant를 설계합니다.", "association마다 natural uniqueness와 concurrency negative test를 둡니다."),
      d("parent 삭제가 예상치 않게 많은 child/history를 cascade 삭제한다.", "relationship lifecycle/retention 검토 없이 ON DELETE CASCADE를 사용했습니다.", ["FK graph와 affected row counts를 dry-run합니다.", "audit/legal history 요구를 확인합니다.", "soft/anonymize/restrict 대안을 봅니다."], "영향을 복구하고 parent lifecycle에 맞는 RESTRICT/anonymization/explicit workflow로 변경합니다.", "referential action review에 blast-radius fixture와 owner approval를 요구합니다."),
    ],
    expertNotes: ["multi-tenant 관계는 두 parent가 같은 tenant인지 composite FK 또는 server authorization으로 보장합니다.", "polymorphic `(type,id)` foreign key는 database referential integrity를 잃으므로 separate nullable FKs/checks, subtype tables 또는 registry를 비교합니다."],
  },
  {
    id: "workbench-model-review-drift",
    title: "Workbench EER model을 versioned schema source로 검토하고 DDL·live catalog drift를 탐지합니다",
    lead: ".mwb 파일이 열리고 선이 그려졌다는 사실보다 model object·generated DDL·migration·실제 database가 같은 invariant를 표현하는지가 중요합니다.",
    explanations: [
      "MODEL01.mwb archive의 XML에는 table objects 14, column objects 59, foreign-key objects 12, index objects 33이 있고 MODEL02에는 각각 4, 15, 3, 9가 있습니다. 이 수치는 모델 구조의 read-only inventory일 뿐 정상성 증명이 아니며 object names/sample data는 필요 이상 공개하지 않습니다.",
      "Workbench에서 table columns/types/null/default, PK/UK/index order, FK referenced columns/actions, relationship cardinality와 comments를 검토합니다. diagram의 위치/선만 보고 identifying relationship, optionality와 generated constraint names를 놓치지 않습니다.",
      "forward engineering SQL은 version control에 text artifact로 저장해 destructive DROP, charset/collation, engine, schema qualifier, auto-increment, grants와 environment options를 review합니다. GUI에서 production에 직접 synchronize하기 전에 dry-run diff, backup/recovery와 migration tool workflow를 사용합니다.",
      "reverse engineering은 actual catalog snapshot을 가져오지만 business meaning/unknown external consumers를 자동 복구하지 못합니다. expected model→migration→live catalog와 live→reverse diff를 양방향으로 보고 manual hotfix·partial rollout을 corrective migration으로 수렴합니다.",
    ],
    concepts: [
      c("EER model", "Workbench가 entities/tables, columns, indexes와 relationships를 시각·metadata로 표현하는 model artifact입니다.", ["generated DDL을 review합니다.", "business constraints를 자동 보장하지 않습니다."]),
      c("model drift", "versioned Workbench/DDL/migration expectation과 live database catalog가 다른 상태입니다.", ["forward/reverse diff로 탐지합니다.", "manual sync 대신 corrective migration을 남깁니다."]),
    ],
    diagnostics: [
      d("Workbench model은 최신인데 production FK 하나가 없다.", "GUI/model 저장과 migration fleet 적용을 동일시하고 live catalog readback이 없습니다.", ["model/generated DDL/migration ledger/catalog를 diff합니다.", "affected instances/tenants를 확인합니다.", "orphan writes를 측정합니다."], "data를 preflight/repair한 뒤 idempotent corrective migration으로 FK를 validate합니다.", "fleet catalog manifest와 drift alert를 둡니다."),
      d("Synchronize Model 실행이 의도치 않은 DROP을 제안한다.", "environment objects와 model scope/rename mapping이 달라 destructive diff가 생성됐습니다.", ["generated SQL을 실행 전 review합니다.", "rename을 drop+create로 인식했는지 봅니다.", "data/dependent objects/backup을 확인합니다."], "직접 sync를 중단하고 expand-contract migration으로 필요한 변화만 명시합니다.", "GUI sync에도 text dry-run, destructive guard와 approval를 강제합니다."),
    ],
    expertNotes: ["binary/zip .mwb만 code review하기 어려우면 generated canonical DDL·model inventory를 함께 version control하되 충돌 시 actual intent를 human review합니다.", "Workbench version upgrade가 model serialization/generated SQL을 바꿀 수 있어 tool version과 reproducible export를 기록합니다."],
  },
  {
    id: "denormalization-performance-evidence",
    title: "denormalization은 측정된 read 병목에 owner·refresh·reconciliation을 붙인 의도적 중복입니다",
    lead: "join이 있다는 이유만으로 column을 복사하면 write fan-out과 stale data를 만들고, 정규화만 고집하면 hot analytical workload의 비용을 놓칠 수 있습니다.",
    explanations: [
      "먼저 representative query, data distribution, indexes, statistics와 EXPLAIN/ANALYZE evidence로 병목을 확인합니다. N+1 application queries, missing index, over-fetch와 network round trips를 고치지 않고 denormalization부터 하지 않습니다.",
      "선택지는 covering/composite index, query rewrite, cache, materialized view/summary table, event-driven projection, partitioning과 warehouse입니다. 각 option의 freshness, write amplification, storage, rebuild, failure/consistency와 operational owner를 비교합니다.",
      "denormalized value에는 authoritative source, refresh trigger/job/event, max staleness SLO, version/watermark, mismatch metric, full rebuild와 backfill procedure를 둡니다. dual writes가 한 transaction이 아니면 outbox/change stream과 reconciliation으로 eventual consistency를 명시합니다.",
      "snapshot value는 현재값 cache와 다릅니다. 주문 당시 product_name/unit_price처럼 역사적 사실이면 원본 provenance와 immutable contract를 유지하며, 현재 product 수정으로 덮지 않습니다. naming/comment로 snapshot/cache/canonical을 구분합니다.",
    ],
    concepts: [
      c("denormalization", "읽기 성능·availability 같은 측정된 목표를 위해 파생/중복 data를 의도적으로 저장하는 설계입니다.", ["authoritative source가 따로 있습니다.", "freshness·rebuild·reconciliation이 필요합니다."]),
      c("materialized projection", "source facts에서 계산해 read pattern에 맞게 저장하고 다시 만들 수 있는 derived representation입니다.", ["watermark/version을 추적합니다.", "source truth를 대체하지 않습니다."]),
    ],
    codeExamples: [py(
      "db08-denormalized-reconciliation",
      "source 합계와 summary projection mismatch 탐지·복구",
      "denormalized_reconciliation.py",
      "canonical order_items에서 derived total을 계산해 stale summary를 검출하고 deterministic rebuild합니다.",
      String.raw`orders = {1: [{"quantity": 2, "unit_price": 1000}, {"quantity": 1, "unit_price": 500}]}
summary = {1: 2000}

def canonical_total(order_id):
    return sum(item["quantity"] * item["unit_price"] for item in orders[order_id])

before = {order_id: summary[order_id] != canonical_total(order_id) for order_id in summary}
for order_id in sorted(before):
    if before[order_id]:
        summary[order_id] = canonical_total(order_id)
after = {order_id: summary[order_id] != canonical_total(order_id) for order_id in summary}

print("canonical-total=" + str(canonical_total(1)))
print("summary-before=2000")
print("mismatch-before=" + str(before[1]).lower())
print("summary-after=" + str(summary[1]))
print("mismatch-after=" + str(after[1]).lower())`,
      "canonical-total=2500\nsummary-before=2000\nmismatch-before=true\nsummary-after=2500\nmismatch-after=false",
      ["mysql-explain", "mysql-data-size", "oracle-materialized-views"],
    )],
    diagnostics: [
      d("복사한 customer_name이 주문 rows마다 다르다.", "현재 이름을 denormalize했지만 update owner·freshness·reconciliation이 없습니다.", ["canonical customer row와 mismatch를 집계합니다.", "snapshot인지 current cache인지 확인합니다.", "writer/event failures를 추적합니다."], "의미가 current이면 join/projection을 재설계·rebuild하고 snapshot이면 immutable provenance로 명확히 분리합니다.", "모든 denormalized field에 source/freshness/rebuild contract를 요구합니다."),
      d("join 제거 후 reads는 빨라졌지만 writes가 timeout난다.", "read benchmark만 보고 index/storage/update fan-out과 replication cost를 무시했습니다.", ["write amplification·locks·redo/lag를 측정합니다.", "denormalized indexes와 refresh path를 봅니다.", "read benefit/SLO를 재확인합니다."], "projection을 async/rebuildable store로 분리하거나 불필요 중복/index를 제거해 read/write trade-off를 재설계합니다.", "성능 ADR에 read·write·failure·rebuild benchmark를 함께 둡니다."),
    ],
    expertNotes: ["CQRS/read model은 normal forms를 폐기하는 구호가 아니라 canonical write model과 rebuildable projections의 ownership 분리입니다.", "cache invalidation 실패가 business money/authorization에 영향을 주면 stale 허용을 낮추고 authoritative read/transactional constraint를 우선합니다."],
  },
  {
    id: "normalization-migration-validation",
    title: "legacy table을 preflight·mapping·dual-write·reconciliation으로 lossless하게 정규화합니다",
    lead: "새 ERD를 그리는 것보다 중복·모순된 기존 rows를 어떤 canonical entities와 relationships로 옮길지 결정하는 일이 더 어렵습니다.",
    explanations: [
      "legacy profiling은 candidate key duplicates, determinant→multiple dependents, NULL/blank/sentinel, orphan/repeating groups와 conflicting facts를 read-only로 측정합니다. 자동 merge가 안전하지 않은 충돌은 quarantine하고 domain owner가 canonical mapping을 승인합니다.",
      "target parent entities를 먼저 만들고 legacy→canonical id mapping table에 source key, target id, decision/reason, run/checksum을 보존합니다. mapping은 idempotent하며 PII를 필요 이상 복제하지 않고 모든 child association migration이 같은 mapping을 사용합니다.",
      "cutover 동안 old/new schema dual-write 또는 change capture를 사용하되 ordering, retry/idempotency, delete와 backfill watermark를 정의합니다. two-way sync는 loop/conflict가 복잡하므로 authoritative direction과 write fencing을 정합니다.",
      "완료 조건은 source facts와 target join의 lossless reconciliation, constraints/catalog parity, duplicate/orphan zero, application old/new result comparison과 query plan/SLO입니다. rollback에서 new facts가 old representation으로 손실되는지 평가해 forward-only point를 승인합니다.",
    ],
    concepts: [
      c("canonical mapping", "중복·legacy identifiers를 승인된 target entity identity로 연결하는 auditable 결정표입니다.", ["idempotent migration에 사용합니다.", "자동 merge와 owner decision을 구분합니다."]),
      c("lossless reconciliation", "source가 표현한 승인된 facts와 target relations를 join한 결과가 count·keys·values에서 보존되는지 검증하는 과정입니다.", ["invalid/quarantine를 별도 합계합니다.", "row count 하나로 축약하지 않습니다."]),
    ],
    diagnostics: [
      d("정규화 migration 후 child rows가 잘못된 canonical parent에 연결된다.", "이름/이메일 같은 mutable value로 즉석 join하고 versioned mapping/충돌 검토가 없습니다.", ["source→target mapping과 decision provenance를 봅니다.", "duplicate/conflicting candidates를 재구성합니다.", "affected references를 격리합니다."], "authoritative mapping을 owner 승인으로 복구하고 child FKs를 idempotent remap/reconcile합니다.", "immutable mapping table과 ambiguous-match quarantine를 사용합니다."),
      d("target row counts는 맞지만 source 조합 일부가 사라졌다.", "table별 count만 비교하고 join facts·NULL/duplicate policy를 reconciliation하지 않았습니다.", ["source fact keys와 target joined keys를 set diff합니다.", "dedup/quarantine counts를 봅니다.", "transformation/checksum version을 확인합니다."], "missing facts를 분류·복구하고 source=target+approved-reject invariant를 다시 검증합니다.", "migration acceptance에 key/value/join checksums와 domain samples를 둡니다."),
    ],
    expertNotes: ["정규화 migration은 data governance 결정이므로 duplicate merge·erasure·retention을 기술자가 임의 결정하지 않습니다.", "cutover 이후 legacy tables는 consumer observation/rollback retention이 끝난 뒤 destructive guard로 제거하고 mapping/audit는 승인 기간 보존합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-model01", repository: "local dbstudy snapshot", path: "dbstudy/MODEL01.mwb", usedFor: ["larger Workbench model object inventory"], evidence: "archive document.mwb.xml에서 table14·column59·foreign-key12·index33 object records를 read-only로 계수했습니다." },
  { id: "local-model02", repository: "local dbstudy snapshot", path: "dbstudy/MODEL02.mwb", usedFor: ["smaller Workbench relationship model inventory"], evidence: "archive document.mwb.xml에서 table4·column15·foreign-key3·index9 object records를 read-only로 계수했습니다." },
  { id: "local-studywork", repository: "local dbstudy snapshot", path: "dbstudy/StudyWork.sql", usedFor: ["table/key/unique modeling practice"], evidence: "CREATE TABLE1·PK1·UNIQUE4·INSERT1 active shapes를 read-only로 계수하고 sample values는 사용하지 않았습니다." },
  { id: "codd-1970", repository: "Communications of the ACM", path: "A Relational Model of Data for Large Shared Data Banks", publicUrl: "https://doi.org/10.1145/362384.362685", usedFor: ["relational foundations·normalization provenance"], evidence: "관계 모델의 원 논문 DOI입니다." },
  { id: "workbench-modeling", repository: "MySQL Workbench Manual", path: "Data Modeling", publicUrl: "https://dev.mysql.com/doc/workbench/en/wb-data-modeling.html", usedFor: ["Workbench model lifecycle"], evidence: "MySQL Workbench 공식 data modeling 문서입니다." },
  { id: "workbench-eer", repository: "MySQL Workbench Manual", path: "Creating EER Diagrams", publicUrl: "https://dev.mysql.com/doc/workbench/en/wb-creating-eer-diagram.html", usedFor: ["EER table/relationship review"], evidence: "MySQL Workbench 공식 EER 문서입니다." },
  { id: "workbench-forward", repository: "MySQL Workbench Manual", path: "Forward Engineering Using an SQL Script", publicUrl: "https://dev.mysql.com/doc/workbench/en/wb-forward-engineering-sql-scripts.html", usedFor: ["generated DDL review"], evidence: "MySQL Workbench 공식 forward engineering 문서입니다." },
  { id: "workbench-reverse", repository: "MySQL Workbench Manual", path: "Reverse Engineering a Live Database", publicUrl: "https://dev.mysql.com/doc/workbench/en/wb-reverse-engineering.html", usedFor: ["catalog reverse engineering·drift"], evidence: "MySQL Workbench 공식 reverse engineering 문서입니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["keys/domains/constraints implementation"], evidence: "MySQL CREATE TABLE 공식 문서입니다." },
  { id: "mysql-foreign-key", repository: "MySQL 8.4 Reference Manual", path: "FOREIGN KEY Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html", usedFor: ["relationship integrity"], evidence: "MySQL foreign key 공식 문서입니다." },
  { id: "mysql-data-size", repository: "MySQL 8.4 Reference Manual", path: "Optimizing Data Size", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/data-size.html", usedFor: ["normalization/denormalization storage trade-off"], evidence: "MySQL data-size optimization 공식 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["performance evidence before denormalization"], evidence: "MySQL EXPLAIN 공식 문서입니다." },
  { id: "oracle-materialized-views", repository: "Oracle AI Database 26ai Data Warehousing Guide", path: "Basic Materialized Views", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/dwhsg/basic-materialized-views.html", usedFor: ["materialized projection trade-off"], evidence: "Oracle materialized view 공식 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["exact normalized schema examples"], evidence: "SQLite CREATE TABLE 공식 문서입니다." },
  { id: "sqlite-foreign-key", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["exact relationship integrity"], evidence: "SQLite foreign key 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-08-normalization-workbench",
  slug: "db-08-normalization-workbench",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 8,
  title: "정규화와 MySQL Workbench ER 모델 검토",
  subtitle: "1NF·2NF·3NF·BCNF를 functional dependencies와 anomalies로 증명하고 EER model·DDL·live catalog·성능 이관까지 연결합니다.",
  level: "고급",
  estimatedMinutes: 960,
  coreQuestion: "중복과 모순을 줄이면서 업무 사실·history·관계를 보존하고, Workbench 모델이 실제 DDL·운영 database와 일치함을 어떻게 증명할까요?",
  summary: "MODEL01.mwb·MODEL02.mwb archive의 table/column/FK/index objects와 StudyWork.sql의 table/key/unique 형태를 모두 read-only로 감사합니다. relation facts와 functional dependencies, 1NF repeating groups/domains, candidate keys, 2NF partial dependency, 3NF transitive dependency/lossless join, BCNF/dependency preservation·4NF 경계, cardinality/junction lifecycle, Workbench EER forward/reverse engineering drift, evidence-based denormalization/materialized projections, canonical mapping·dual-write·lossless migration을 연결합니다. 다섯 exact Python/sqlite3 examples는 1NF child values, 2NF association decomposition, 3NF canonical department, N:M integrity와 derived summary reconciliation을 실행합니다.",
  objectives: [
    "relation의 한-row fact, candidate keys와 functional dependencies를 domain rule로 작성한다.",
    "1NF의 repeating groups/domain 문제를 child 또는 bounded document 선택으로 해결한다.",
    "2NF partial dependency와 3NF transitive dependency를 anomalies와 decomposition으로 증명한다.",
    "BCNF·dependency preservation·lossless join과 4NF 독립성 trade-off를 반례로 검토한다.",
    "1:1·1:N·N:M cardinality/optionality를 PK·UNIQUE·FK·workflow로 구현한다.",
    "Workbench EER objects·generated DDL·migration·live catalog drift를 검증한다.",
    "denormalization을 측정된 성능 목표와 freshness·rebuild·reconciliation으로 운영한다.",
    "legacy facts를 canonical mapping·dual-write·checksums로 lossless하게 이관한다.",
  ],
  prerequisites: [{ title: "테이블 복제·ALTER·DROP", reason: "정규화 decomposition을 existing data에 안전하게 이관하려면 schema evolution 절차가 필요합니다.", sessionSlug: "db-07-copy-alter-drop-schema-evolution" }],
  keywords: ["1NF", "2NF", "3NF", "BCNF", "functional dependency", "candidate key", "partial dependency", "transitive dependency", "lossless decomposition", "dependency preservation", "cardinality", "junction table", "EER", "Workbench", "denormalization"],
  topics,
  lab: {
    title: "비정규 수강·주문 worksheet를 3NF write model과 검증된 read projection으로 이관하기",
    scenario: "한 row에 학생·과목·부서 이름, 쉼표 연락처, 반복 주문 item과 계산 total이 섞인 legacy table을 무중단 정규화하고 Workbench EER·generated DDL·live schema를 일치시킵니다.",
    setup: ["모든 fixtures는 synthetic하며 원본 model/sample values를 복제하지 않습니다.", "legacy FD assumptions와 domain owners, anomaly examples를 문서화합니다.", "Workbench exact version, generated DDL repository와 isolated MySQL 8.4 schema를 준비합니다.", "mapping/quarantine/dual-write/reconciliation run id와 rollback criteria를 정의합니다."],
    steps: [
      "legacy row가 표현하는 facts와 candidate keys·FDs·time/tenant scope를 작성합니다.",
      "repeating phone/items를 child relations로 옮기고 domains·cardinality constraints를 정의합니다.",
      "partial dependencies를 student/course/product relations로 분리하고 association keys를 둡니다.",
      "transitive department/reference facts를 분리하고 lossless join·dependency preservation을 검증합니다.",
      "1:1·1:N·N:M optionality와 delete/history lifecycle을 EER·DDL constraints로 구현합니다.",
      "Workbench model object inventory와 generated DDL을 review하고 migration files로 고정합니다.",
      "legacy duplicates/conflicts를 canonical mapping 또는 quarantine로 owner 승인합니다.",
      "target expand→parent/map→child backfill→dual-write/read shadow→constraints 순서로 이관합니다.",
      "source facts=target joins+approved rejects checksums와 old/new application results를 비교합니다.",
      "측정된 hot read에만 rebuildable summary projection을 만들고 freshness/mismatch/restore를 시험합니다.",
    ],
    expectedResult: ["각 relation이 한 fact와 minimal candidate keys/constraints를 가집니다.", "repeating/partial/transitive anomalies의 negative fixtures가 target schema에서 차단됩니다.", "Workbench model·generated DDL·migration·live catalog가 required objects에서 일치합니다.", "legacy facts와 target joined facts가 canonical mappings/reject ledger까지 완전히 reconciliation됩니다.", "read projection은 SLO를 개선하며 stale mismatch를 탐지·rebuild할 수 있습니다."],
    cleanup: ["isolated schema/model exports와 synthetic mapping/quarantine rows만 run id로 제거합니다.", "temporary Workbench/DB credentials와 grants를 revoke합니다.", "generated artifacts/logs에 real PII·credentials가 없는지 검사합니다.", "migration/reconciliation evidence는 승인 retention에 따라 보존합니다."],
    extensions: ["temporal effective-date와 overlapping relationship constraints를 모델링합니다.", "4NF multivalued dependencies와 5NF join dependency 사례를 반례로 검증합니다.", "OLTP 3NF→star schema warehouse pipeline과 slowly changing dimensions를 설계합니다.", "schema/model drift와 FD profiling을 CI report로 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 anomaly와 이를 제거한 key/constraint를 표로 정리하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "1NF element uniqueness를 설명합니다.", "2NF에서 subset determinants를 찾습니다.", "3NF에서 non-key determinant를 분리합니다.", "junction pair/FKs를 검증합니다.", "denormalized mismatch를 rebuild합니다."], hints: ["각 row가 어떤 한 사실인지 먼저 한 문장으로 쓰세요."], expectedOutcome: "정규형 이름을 외우지 않고 anomaly·FD·constraint·실행 결과로 설명합니다.", solutionOutline: ["facts→keys/FDs→anomaly→decompose→constraints→reconcile 순서입니다."] },
    { difficulty: "응용", prompt: "MODEL01·MODEL02·StudyWork를 production schema review packet으로 재구성하세요.", requirements: ["세 원본 files의 object/count provenance를 보존합니다.", "table마다 row sentence/candidate keys/FDs를 작성합니다.", "1NF~BCNF와 lossless/dependency preservation을 검토합니다.", "cardinality/optionality/FK actions를 검증합니다.", "generated DDL과 actual catalog diff를 포함합니다.", "sensitive sample data를 복제하지 않습니다.", "denormalization에는 EXPLAIN/freshness/rebuild 근거를 둡니다.", "migration/reconciliation plan을 작성합니다."], hints: ["Workbench 선 모양만으로 관계 제약을 승인하지 마세요."], expectedOutcome: "모델 의미·DDL·운영 evidence가 연결된 전문가 schema review가 완성됩니다.", solutionOutline: ["archive inventory→domain facts→normal forms→EER/DDL→catalog→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 data modeling·normalization·denormalization 표준을 작성하세요.", requirements: ["facts/FD/key discovery 절차를 정의합니다.", "1NF·2NF·3NF·BCNF review evidence를 요구합니다.", "temporal/multivalued/distributed invariant 경계를 다룹니다.", "Workbench/model-as-code와 drift governance를 정의합니다.", "denormalization SLO/owner/reconciliation을 정의합니다.", "legacy canonical mapping/quarantine를 정의합니다.", "online migration/rollback/restore를 포함합니다.", "privacy/security/retention을 포함합니다."], hints: ["table 수나 join 수를 quality score로 쓰지 마세요."], expectedOutcome: "새 모델과 legacy migration을 일관되게 판단·검증하는 조직 표준이 완성됩니다.", solutionOutline: ["discover→formalize→decompose→implement→measure→migrate→govern 순서입니다."] },
  ],
  nextSessions: ["sql-01-select-projection-alias"],
  sources,
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "MODEL01.mwb의 table14·column59·FK12·index33, MODEL02.mwb의 table4·column15·FK3·index9 object records를 archive XML에서 read-only로 계수했습니다.",
      "StudyWork.sql의 CREATE TABLE1·PK1·UNIQUE4·INSERT1 active shapes를 확인하고 sample values는 사용하지 않았습니다.",
      "원본 model/SQL은 formal FD·normal-form proof, lossless/dependency preservation, catalog drift·denormalization reconciliation·legacy migration을 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.",
      "Workbench object counts는 model correctness가 아니라 coverage provenance이며 generated DDL·live catalog·domain owner evidence가 추가로 필요합니다.",
    ],
  },
});

export default session;
