import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split("\n").length;
  const first = Math.max(1, Math.floor(lineCount / 3));
  const second = Math.max(first + 1, Math.floor((lineCount * 2) / 3));
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "외부 서버·계정·개인 데이터가 없는 sqlite3 메모리 DB에 합성 스키마와 view 계약을 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "projection, visibility, DML mapping, check invariant 또는 snapshot refresh라는 한 가지 의미를 실행합니다." },
      { lines: `${second + 1}-${lineCount}`, explanation: "정렬된 식별자·schema·오류·version처럼 재현 가능한 증거만 stdout으로 출력합니다. MySQL·Oracle 고유 DDL은 공식 matrix에서 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite semantic harness는 MySQL SQL SECURITY/ALGORITHM과 Oracle BEQUEATH/materialized refresh를 흉내 내지 않으며 계약의 작은 의미만 고정합니다."] },
    experiments: [
      { change: "열 이름·predicate·base constraint를 하나씩 바꾸고 이전 consumer query를 다시 실행합니다.", prediction: "호환 계약이 깨지면 schema 또는 visibility assertion이 즉시 실패합니다.", result: "변경 전후 view metadata와 canonical synthetic rows를 diff합니다." },
      { change: "같은 fixture를 MySQL 8.4와 Oracle 26ai 격리 schema에서 실행합니다.", prediction: "updatability, security context, check option과 materialization 동작에 승인된 차이가 나타납니다.", result: "engine/version, DDL, grants, plan과 readback을 conformance evidence로 보존합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "view-as-query-contract",
    title: "VIEW를 저장된 SELECT가 아니라 소비자 조회 계약으로 정의합니다",
    lead: "view는 데이터를 복사하지 않는 이름 붙은 관계식이면서, 소비자에게는 열·행·타입·권한·갱신 가능성까지 약속하는 API입니다.",
    explanations: [
      "원본 dbstudy 02_03.sql은 V_BOOKNAME, V_BOOKNAME2, V_ORDER_NAME, VW_CUSTOMER와 VW_ORDERS를 만들고 조회·join·drop하는 흐름을 보여 줍니다. 이 세션은 그 출발점을 보존하되 원본의 사람 이름·주소·전화번호 같은 sample literal은 복사하지 않고 합성 식별자만 사용합니다.",
      "CREATE VIEW name AS SELECT는 query text를 catalog에 등록합니다. 일반 view는 보통 결과 행을 저장하지 않으므로 base table 변경이 다음 조회에 반영됩니다. 그래서 table처럼 보인다는 UI와 물리 snapshot이라는 오해를 먼저 분리해야 합니다.",
      "조회 계약에는 view owner, intended consumers, row grain, key 후보, column name/order/type/nullability 의미, row predicate, freshness, security mode, write policy와 compatibility version을 기록합니다. SELECT *는 base 변화와 계약 변화를 분리하기 어려우므로 공개 view에서는 명시적 열과 alias를 기본으로 합니다.",
      "view 이름은 구현 테이블 이름이 아니라 업무 의미를 표현해야 합니다. active_learning_item_v1처럼 population과 version을 드러내고, 내부 helper view와 외부 contract view를 namespace 또는 schema로 구분하면 dependency graph가 읽기 쉬워집니다.",
      "실행됐다는 사실은 계약이 맞다는 증거가 아닙니다. zero/one/many rows, NULL, duplicate join, unauthorized tenant, old/new schema와 consumer prepared statement를 golden fixtures로 검증해야 합니다.",
    ],
    concepts: [
      c("logical relation", "query가 평가될 때 만들어지는 열과 행의 관계이며 일반 view 자체에 결과 데이터가 저장된다는 뜻은 아닙니다.", ["base relation 위의 이름 붙은 표현입니다.", "materialized view와 구분합니다."]),
      c("조회 계약", "소비자가 의존하는 schema·population·grain·security·freshness·write 의미의 명시적 약속입니다.", ["DDL text보다 넓습니다.", "version과 owner를 가집니다."]),
      c("row grain", "view 한 행이 무엇 하나를 나타내는지 정한 단위입니다.", ["join으로 증식되는지 확인합니다.", "key와 count 의미를 결정합니다."]),
    ],
    codeExamples: [py("db09-view-contract", "명시적 열과 row grain을 가진 view", "db09_view_contract.py", "합성 enrollment에서 공개 열만 내보내고 catalog schema와 정렬된 결과를 함께 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE enrollment(id INTEGER PRIMARY KEY, learner_key TEXT, course_key TEXT, status TEXT, internal_note TEXT)")
db.executemany("INSERT INTO enrollment VALUES (?, ?, ?, ?, ?)", [
    (1, "L-01", "C-SQL", "active", "private-a"),
    (2, "L-02", "C-JAVA", "paused", "private-b"),
])
db.execute("CREATE VIEW learning_enrollment_v1(enrollment_id, learner_key, course_key, status) AS SELECT id, learner_key, course_key, status FROM enrollment")
columns = [row[1] for row in db.execute("PRAGMA table_info(learning_enrollment_v1)")]
rows = list(db.execute("SELECT enrollment_id, learner_key, course_key, status FROM learning_enrollment_v1 ORDER BY enrollment_id"))
print("columns=" + ",".join(columns))
for row in rows:
    print("row=" + "|".join(map(str, row)))
print("grain-unique=" + str(len(rows) == len({row[0] for row in rows})).lower())`, "columns=enrollment_id,learner_key,course_key,status\nrow=1|L-01|C-SQL|active\nrow=2|L-02|C-JAVA|paused\ngrain-unique=true", ["local-0203", "mysql-create-view", "oracle-create-view", "sqlite-create-view"])],
    diagnostics: [
      d("base table에는 두 entity인데 view count가 다섯입니다.", "one-to-many join이 consumer가 기대한 parent grain을 child grain으로 증식했습니다.", ["정의 SQL의 join cardinality", "candidate key uniqueness", "COUNT(*)와 COUNT(DISTINCT key)", "zero/one/many child fixture"], "EXISTS·pre-aggregation 또는 parent key relation으로 grain을 먼저 고정하고 view contract에 key를 기록합니다.", "view마다 grain/key invariant와 duplicate-heavy conformance test를 둡니다."),
      d("view를 table snapshot으로 믿은 보고서가 재조회 때 달라집니다.", "일반 view의 freshness가 base query 시점이라는 사실을 계약하지 않았습니다.", ["object type", "base mutation 시각", "transaction isolation", "cache/materialized layer"], "live view와 materialized snapshot을 이름·metadata·SLA로 구분합니다.", "freshness/as-of를 consumer response와 runbook에 표시합니다."),
    ],
    expertNotes: ["view DDL의 SELECT text와 소비자 계약 문서를 함께 version control하고 schema+row golden test를 실행합니다.", "열을 숨겼다는 사실만으로 row-level authorization이 완성되지는 않습니다."],
  },
  {
    id: "projection-alias-type-stability",
    title: "projection·alias·type·NULL 의미를 안정적인 schema로 고정합니다",
    lead: "view의 가장 작은 가치도 열 목록을 관리하는 데서 시작하지만, 이름만 같고 타입·단위·NULL 의미가 바뀌면 consumer는 조용히 오동작합니다.",
    explanations: [
      "공개 view는 `SELECT *` 대신 열을 명시하고 expression에는 짧고 안정적인 alias를 붙입니다. base column 추가가 자동 공개되는 것과 column drop이 늦게 runtime failure로 드러나는 것을 막고 review diff를 읽을 수 있게 합니다.",
      "amount 같은 이름에는 currency와 scale이 없고 date 같은 이름에는 timezone과 boundary가 없습니다. total_amount_minor, occurred_at_utc처럼 단위·시간 의미를 schema 또는 contract 문서에 넣고 cast로 engine의 expression type 추론을 고정합니다.",
      "NULL은 unknown, not-applicable, not-yet-computed를 구분하지 못합니다. COALESCE로 0을 만들기 전에 business 의미를 정하고, old consumer가 nullable을 처리하지 못하면 새 version에서 non-null guarantee와 backfill 근거를 제공합니다.",
      "열 순서에 의존하는 `SELECT *` consumer와 positional mapper는 이름 기반 mapper보다 취약합니다. JDBC/ORM mapping을 포함해 metadata readback으로 column name/type/nullability를 release gate에서 비교합니다.",
      "표시용 문자열 조합은 정렬·검색·locale 요구를 숨길 수 있습니다. 원자 열을 유지하고 display expression은 명확히 파생 열로 표기하며 collation과 normalization을 engine matrix에서 확인합니다.",
    ],
    concepts: [
      c("projection allow-list", "view가 외부에 노출할 열을 명시적으로 선택한 목록입니다.", ["민감 열의 accidental exposure를 줄입니다.", "schema diff를 명확하게 합니다."]),
      c("semantic type", "DB 자료형뿐 아니라 단위·scale·timezone·NULL 의미까지 포함한 소비자 타입입니다.", ["cast와 문서가 함께 필요합니다.", "driver mapping을 검증합니다."]),
      c("column compatibility", "기존 consumer가 동일 의미로 계속 읽을 수 있는 이름·type·nullability·order 범위입니다.", ["additive라도 SELECT *에는 위험합니다.", "contract test로 판정합니다."]),
    ],
    diagnostics: [
      d("배포 후 JSON 숫자가 문자열 또는 반올림된 값으로 바뀝니다.", "view expression type/scale 추론을 engine에 맡겼거나 driver mapping을 검증하지 않았습니다.", ["SHOW/describe view metadata", "explicit CAST", "decimal scale", "driver returned type"], "계약 타입으로 명시적 CAST하고 boundary value를 각 driver에서 readback합니다.", "schema metadata snapshot과 min/max/rounding golden fixtures를 둡니다."),
      d("base 열 추가 뒤 의도하지 않은 내부 열이 export에 보입니다.", "공개 view 또는 consumer가 SELECT *를 사용했습니다.", ["view definition", "consumer select list", "generated DTO", "export headers"], "공개 projection과 consumer select list를 명시하고 새 열은 별도 version에서 승인합니다.", "민감 열 이름 deny test와 schema diff approval을 둡니다."),
    ],
    expertNotes: ["호환성은 DDL 성공이 아니라 old consumer binary/read query의 재실행으로 판정합니다.", "alias에는 화면 번역문보다 안정적인 machine name을 쓰고 표시명은 presentation layer에서 처리합니다."],
  },
  {
    id: "security-definer-invoker-boundary",
    title: "DEFINER·INVOKER와 최소 권한을 실제 실행 주체로 검증합니다",
    lead: "view는 base table 직접 권한을 감출 수 있지만 잘못된 definer나 느슨한 predicate는 권한 상승 통로가 됩니다.",
    explanations: [
      "MySQL CREATE VIEW의 SQL SECURITY DEFINER/INVOKER는 reference object 권한을 어느 계정 문맥으로 검사할지 결정합니다. Oracle view의 owner privilege와 BEQUEATH는 완전히 같은 문법이 아니므로 이름만 대응시키지 말고 name resolution, direct grant, invoked function context를 matrix로 기록합니다.",
      "DEFINER view는 consumer에게 base SELECT를 주지 않고 좁은 projection을 제공할 수 있습니다. 그러나 definer가 광범위한 권한을 갖고 predicate가 빠지면 그 권한이 데이터 노출로 이어집니다. dedicated owner, direct 최소 grant와 immutable deployment identity를 사용합니다.",
      "INVOKER는 호출자의 권한을 존중하지만 role activation, current schema와 nested routine/view가 섞이면 예상이 달라질 수 있습니다. low/high privilege synthetic users로 success와 denied path를 모두 실제 로그인해 검증합니다.",
      "tenant_id를 view에 넣지 않고 current-user 기반 function만 호출하면 plan/cache/identity semantics를 설명하기 어렵습니다. 가능하면 RLS/VPD 같은 엔진 기능 또는 application에서 검증된 tenant context와 defense-in-depth predicate를 사용하고 connection-pool context reset을 테스트합니다.",
      "SHOW CREATE VIEW, backup, restore와 dependency introspection에 필요한 운영 권한도 별도입니다. 소비자 조회 권한과 관리자 metadata 권한을 섞지 않고, orphan definer와 expired account가 배포·복구를 깨지 않는지 검사합니다.",
    ],
    concepts: [
      c("definer rights", "저장 객체 소유자/지정자의 권한 문맥으로 참조 객체 접근을 검사하는 모델입니다.", ["최소 권한 owner가 필요합니다.", "orphan identity를 관리합니다."]),
      c("invoker rights", "호출 사용자의 권한 문맥을 사용하도록 설계한 실행 모델입니다.", ["role/current schema 차이를 확인합니다.", "nested object까지 추적합니다."]),
      c("privilege closure", "view에서 base object·함수·nested view까지 실제 필요한 권한의 전체 graph입니다.", ["직접 grant 여부를 포함합니다.", "배포/restore 계정도 분리합니다."]),
    ],
    codeExamples: [py("db09-projection-security", "공개 projection과 행 범위의 최소 노출", "db09_projection_security.py", "SQLite에서 engine privilege를 흉내 내지 않고 공개 view가 secret 열을 제외하고 허용 tenant 행만 보이는 계약을 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson(id INTEGER PRIMARY KEY, tenant_key TEXT, title TEXT, secret_note TEXT)")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?, ?)", [
    (1, "TENANT-A", "SQL basics", "internal-1"),
    (2, "TENANT-B", "Java basics", "internal-2"),
    (3, "TENANT-A", "View design", "internal-3"),
])
db.execute("CREATE VIEW tenant_a_lesson_v1(lesson_id, title) AS SELECT id, title FROM lesson WHERE tenant_key = 'TENANT-A'")
columns = [row[1] for row in db.execute("PRAGMA table_info(tenant_a_lesson_v1)")]
rows = list(db.execute("SELECT lesson_id, title FROM tenant_a_lesson_v1 ORDER BY lesson_id"))
print("columns=" + ",".join(columns))
print("ids=" + ",".join(str(row[0]) for row in rows))
print("secret-exposed=" + str("secret_note" in columns).lower())
print("visible-count=" + str(len(rows)))`, "columns=lesson_id,title\nids=1,3\nsecret-exposed=false\nvisible-count=2", ["mysql-create-view", "mysql-object-security", "oracle-create-view", "sqlite-create-view"])],
    diagnostics: [
      d("낮은 권한 사용자가 view를 통해 다른 tenant 행을 봅니다.", "definer 권한은 좁혔지만 row predicate 또는 session tenant context가 누락·잔류했습니다.", ["effective user/role", "view definition predicate", "pool context reset", "nested function rights"], "전용 최소권한 owner와 강제 row policy를 적용하고 tenant 전환 connection test를 실행합니다.", "two-tenant negative fixtures와 denied-query audit를 배포 gate로 둡니다."),
      d("복원 후 view가 invalid 또는 access denied가 됩니다.", "dump에 기록된 definer가 대상 환경에 없거나 direct grant가 복원되지 않았습니다.", ["SHOW CREATE VIEW/DDL", "definer existence", "direct grants", "restore order"], "환경 독립 deployment owner를 만들고 objects→grants→view→consumer grants 순서로 readback합니다.", "orphan-definer scan과 clean-room restore rehearsal을 정기 실행합니다."),
    ],
    expertNotes: ["column hiding은 confidentiality의 한 층일 뿐이며 inference, aggregation, predicate와 side channel을 함께 review합니다.", "권한 matrix에는 create/replace/show/backup/restore와 runtime select/DML을 분리합니다."],
  },
  {
    id: "inherent-updatability-key-preservation",
    title: "갱신 가능성을 key-preserved row mapping으로 판단합니다",
    lead: "view에서 SELECT가 된다는 사실과 INSERT·UPDATE·DELETE가 어느 base row를 바꾸는지 유일하다는 사실은 다릅니다.",
    explanations: [
      "단일 base table의 단순 열 projection과 predicate는 흔히 inherently updatable이지만 aggregate, DISTINCT, GROUP BY, UNION, 일부 join과 expression은 엔진 규칙에 따라 read-only입니다. 암기 목록만 두지 말고 각 view column이 어느 base column/row에 일대일 대응하는지 먼저 그립니다.",
      "join view는 한 result row가 여러 base rows를 합칩니다. key-preserved table이 무엇인지, INSERT에 필요한 NOT NULL/default columns가 모두 제공되는지, delete가 어느 table을 목표로 하는지 engine별로 확인합니다.",
      "파생 열 total_price는 조회할 수 있어도 직접 update할 수 없습니다. 소비자에게 모든 열이 writable하다는 착각을 주지 않도록 read-only view와 command procedure/API를 분리하거나 writable column allow-list를 metadata로 제공합니다.",
      "SQLite view는 기본적으로 read-only이지만 INSTEAD OF trigger로 명시적 DML mapping을 정의할 수 있습니다. Oracle도 INSTEAD OF trigger를 지원하지만 CREATE OR REPLACE가 trigger lifecycle에 미치는 영향처럼 engine 운영 차이를 별도 검증합니다.",
      "DML through view는 affected-row count, trigger side effects, constraints, audit와 optimistic locking까지 base 직접 DML과 비교합니다. 조회 편의를 위해 만든 view에 우연히 write path를 열지 말고 default deny 후 필요한 명령만 설계합니다.",
    ],
    concepts: [
      c("inherently updatable view", "엔진이 view row와 base row의 직접 대응을 판정해 별도 trigger 없이 DML을 허용하는 view입니다.", ["dialect 규칙이 다릅니다.", "열별 write 가능성도 봅니다."]),
      c("key preservation", "join 결과에서도 특정 base table의 key가 중복되지 않아 result row가 해당 base row를 유일하게 가리키는 성질입니다.", ["join cardinality 증거가 필요합니다.", "optimizer 추측과 구분합니다."]),
      c("INSTEAD OF mapping", "view DML을 가로채 명시한 base DML로 변환하는 trigger 계약입니다.", ["validation과 affected rows를 정의합니다.", "replace lifecycle을 확인합니다."]),
    ],
    codeExamples: [py("db09-instead-of-update", "INSTEAD OF trigger로 명시한 write mapping", "db09_instead_of_update.py", "SQLite read-only view에 허용된 title update만 base row로 전달하고 archived row는 view 밖에 남는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson(id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL)")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?)", [(1, "SQL old", "active"), (2, "Java old", "archived")])
db.execute("CREATE VIEW active_lesson(lesson_id, title) AS SELECT id, title FROM lesson WHERE status = 'active'")
db.execute("CREATE TRIGGER active_lesson_update INSTEAD OF UPDATE OF title ON active_lesson BEGIN UPDATE lesson SET title = NEW.title WHERE id = OLD.lesson_id AND status = 'active'; END")
db.execute("UPDATE active_lesson SET title = 'SQL revised' WHERE lesson_id = 1")
base = list(db.execute("SELECT id, title, status FROM lesson ORDER BY id"))
visible = list(db.execute("SELECT lesson_id, title FROM active_lesson ORDER BY lesson_id"))
for row in base:
    print("base=" + "|".join(map(str, row)))
for row in visible:
    print("view=" + "|".join(map(str, row)))
print("visible-count=" + str(len(visible)))`, "base=1|SQL revised|active\nbase=2|Java old|archived\nview=1|SQL revised\nvisible-count=1", ["mysql-view-updatable", "oracle-create-view", "sqlite-create-view", "sqlite-create-trigger"])],
    diagnostics: [
      d("aggregate view UPDATE가 syntax error 또는 read-only 오류입니다.", "집계 결과 열이 단일 base row/column에 대응하지 않습니다.", ["GROUP BY/DISTINCT/UNION", "target column lineage", "engine updatability metadata", "intended command semantics"], "aggregate view는 read-only로 선언하고 변경은 검증된 command procedure/API로 분리합니다.", "모든 contract view에 read/write classification과 negative DML tests를 둡니다."),
      d("join view DELETE가 기대와 다른 table을 지웁니다.", "삭제 target과 key-preserved table을 명시하지 않고 engine 허용 동작에 의존했습니다.", ["join keys/cardinality", "target base key", "trigger definition", "affected rows/audit"], "delete command를 명시적 procedure 또는 INSTEAD OF mapping으로 만들고 exact target key를 검증합니다.", "multi-match fixture와 unauthorized/wrong-target rollback test를 둡니다."),
    ],
    expertNotes: ["updatable은 view 전체의 단순 boolean이 아니라 operation·column·base mapping별 계약입니다.", "조회 계약과 명령 계약을 분리하면 trigger에 숨은 business logic을 줄일 수 있습니다."],
  },
  {
    id: "check-option-visibility-invariant",
    title: "WITH CHECK OPTION으로 쓴 행이 view에 남는다는 불변식을 지킵니다",
    lead: "predicate view를 통해 status를 바꿨더니 행이 성공적으로 수정된 뒤 화면에서 사라지는 문제는 DML 성공과 사용자 의도가 다르다는 신호입니다.",
    explanations: [
      "WITH CHECK OPTION은 view를 통한 INSERT/UPDATE 결과가 view predicate를 만족하도록 제한합니다. active-only view에서 status='archived'로 바꾸는 요청은 성공 후 행이 사라지므로 check option이 있으면 거부할 수 있습니다.",
      "nested views에서는 LOCAL과 CASCADED가 어느 수준 predicate까지 검사하는지 다릅니다. MySQL과 Oracle syntax/지원 범위를 공식 문서로 확인하고 inner/outer predicate를 각각 깨는 fixtures를 둡니다.",
      "check option은 모든 business constraint의 대체가 아닙니다. base table CHECK/foreign key/unique가 data integrity를 지키고, view option은 그 view의 visibility contract를 보강합니다.",
      "NULL과 three-valued logic을 포함해 predicate가 TRUE여야 하는지 NOT FALSE인지 engine behavior를 확인합니다. nullable tenant/status를 조용히 허용하지 말고 NOT NULL과 explicit predicate를 함께 설계합니다.",
      "INSTEAD OF trigger로 check behavior를 구현할 때는 validation과 base write가 같은 transaction에 있어야 합니다. 오류 code/message를 stable contract로 만들고 partial side effect가 없는지 readback합니다.",
    ],
    concepts: [
      c("visibility invariant", "view를 통해 쓴 결과 행이 해당 view population predicate를 계속 만족해야 한다는 규칙입니다.", ["write-after-read 혼란을 줄입니다.", "base constraints와 병행합니다."]),
      c("LOCAL CHECK OPTION", "직접 view predicate 중심으로 갱신 결과를 검사하는 dialect option입니다.", ["nested semantics를 공식 문서로 확인합니다.", "engine별 차이를 승인합니다."]),
      c("CASCADED CHECK OPTION", "기반이 된 nested view predicate까지 연쇄 검사하는 option입니다.", ["default 여부를 가정하지 않습니다.", "각 layer 반례를 둡니다."]),
    ],
    codeExamples: [py("db09-check-option", "CHECK OPTION 의미를 trigger로 검증하는 semantic harness", "db09_check_option.py", "SQLite INSTEAD OF trigger로 active-only insert의 visibility invariant를 강제하고 성공·거부 결과를 정확히 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson(id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL)")
db.execute("CREATE VIEW active_lesson AS SELECT id, title, status FROM lesson WHERE status = 'active'")
db.execute("CREATE TRIGGER active_lesson_insert INSTEAD OF INSERT ON active_lesson BEGIN SELECT CASE WHEN NEW.status <> 'active' THEN RAISE(ABORT, 'visibility-check-failed') END; INSERT INTO lesson(id, title, status) VALUES(NEW.id, NEW.title, NEW.status); END")
db.execute("INSERT INTO active_lesson VALUES (1, 'View contract', 'active')")
try:
    db.execute("INSERT INTO active_lesson VALUES (2, 'Hidden write', 'archived')")
except sqlite3.IntegrityError as error:
    print("rejected=" + str(error))
rows = list(db.execute("SELECT id, title, status FROM active_lesson ORDER BY id"))
for row in rows:
    print("visible=" + "|".join(map(str, row)))
print("base-count=" + str(db.execute("SELECT count(*) FROM lesson").fetchone()[0]))`, "rejected=visibility-check-failed\nvisible=1|View contract|active\nbase-count=1", ["mysql-view-check", "oracle-create-view", "sqlite-create-trigger"])],
    diagnostics: [
      d("view UPDATE는 성공했지만 즉시 재조회하면 행이 없습니다.", "predicate를 깨는 DML을 허용했고 CHECK OPTION이 없습니다.", ["view predicate", "new row values", "check option mode", "base constraints"], "visibility invariant가 요구되면 CHECK OPTION 또는 atomic trigger validation을 적용합니다.", "predicate boundary·NULL·nested view DML negative tests를 둡니다."),
      d("outer view에서는 허용됐지만 inner tenant predicate가 깨집니다.", "nested view에서 LOCAL/CASCADED 의미를 잘못 선택했습니다.", ["view dependency chain", "각 layer predicate", "explicit option", "engine/version behavior"], "전체 invariant가 필요하면 지원되는 CASCADED semantics를 사용하고 모든 layer를 golden test합니다.", "nested predicate conformance matrix를 engine upgrade마다 실행합니다."),
    ],
    expertNotes: ["CHECK OPTION의 목적은 보안 전체가 아니라 view DML과 visibility의 일관성입니다.", "거부된 write가 audit·sequence·trigger side effect를 남기는지도 engine별로 확인합니다."],
  },
  {
    id: "dependency-lineage-invalidations",
    title: "base→view→consumer dependency와 invalidation을 배포 전에 계산합니다",
    lead: "base column을 rename/drop해도 DDL이 성공한 뒤 view 조회 시점에야 실패하는 엔진이 있으므로 dependency는 runtime 사고 전에 확인해야 합니다.",
    explanations: [
      "dependency graph에는 base tables, nested views, functions, materialized views, grants, ORM queries, reports와 exports를 포함합니다. catalog dependency만으로 dynamic SQL과 외부 BI consumer를 모두 찾을 수 없으므로 query telemetry·repository search·owner registry를 합칩니다.",
      "MySQL 문서처럼 base DROP/ALTER가 view를 invalid하게 만들면서 즉시 경고하지 않을 수 있습니다. Oracle은 invalid object와 dependent materialized view 상태가 다르게 나타날 수 있어 clean schema migration 후 compile/check/readback이 필요합니다.",
      "column rename은 name만 바꾸는 일이 아니라 type, nullability, unit과 ordinal consumer를 함께 깨뜨릴 수 있습니다. expand-contract로 새 base column과 v2 view를 추가하고 dual-read/consumer migration 후 v1을 제거합니다.",
      "nested view depth는 재사용을 늘리지만 lineage와 plan을 숨깁니다. 각 layer가 새로운 안정 계약을 제공하지 않는다면 helper를 합치고, public boundary에는 owner와 removal date를 둡니다.",
      "dependency evidence는 단순 object count가 아니라 dependent id, expected status, compiled definition hash와 canonical query result입니다. rollback도 old view DDL과 grants, base compatibility window가 남아 있어야 가능합니다.",
    ],
    concepts: [
      c("dependency graph", "view 정의가 참조하는 객체와 view를 소비하는 객체·코드의 방향 graph입니다.", ["DB catalog와 외부 consumer를 합칩니다.", "배포 순서를 결정합니다."]),
      c("invalidation", "참조 객체 변경으로 저장 객체가 더 이상 유효하게 compile/execute되지 않는 상태입니다.", ["DDL 시점과 조회 시점이 다를 수 있습니다.", "readback이 필요합니다."]),
      c("expand-contract", "새 계약을 병행 추가하고 소비자를 이동한 뒤 old 계약을 제거하는 호환 migration 방식입니다.", ["rollback window를 보존합니다.", "usage telemetry로 종료를 판단합니다."]),
    ],
    diagnostics: [
      d("migration은 성공했지만 첫 사용자 조회에서 unknown column 오류입니다.", "base 변경 뒤 dependent view compile/check/query를 실행하지 않았습니다.", ["catalog dependency", "view status/check table", "definition hash", "canonical consumer queries"], "격리 schema에서 전체 graph를 순서대로 배포하고 compile/check/readback 후 전환합니다.", "destructive DDL gate에 dependent object/consumer zero 확인을 둡니다."),
      d("v1 view를 삭제하자 사용처가 없다는 예상과 달리 야간 report가 실패합니다.", "repository 검색에 잡히지 않는 BI/dynamic SQL consumer가 있었습니다.", ["query audit/history", "owner registry", "last-used telemetry", "scheduled jobs"], "deprecation 기간에 usage를 측정하고 owner 확인 뒤 revoke→observe→drop 단계로 진행합니다.", "public view inventory와 consumer registration을 운영합니다."),
    ],
    expertNotes: ["DROP VIEW는 dependency 정리의 마지막 단계이며 usage evidence 없는 삭제는 추측입니다.", "definition hash가 같아도 grants/security context가 다르면 같은 배포가 아닙니다."],
  },
  {
    id: "versioned-view-contract-migration",
    title: "v1·v2 병행과 consumer 전환으로 무중단 schema 진화를 설계합니다",
    lead: "CREATE OR REPLACE는 편리하지만 같은 이름의 계약을 순간적으로 바꾸므로 기존 consumer가 호환되는지 자동으로 보장하지 않습니다.",
    explanations: [
      "additive column도 positional consumer, SELECT * export와 checksum을 깨뜨릴 수 있습니다. compatible change 기준을 이름 기반 consumer만 가정하지 말고 실제 client matrix로 정합니다.",
      "breaking change는 contract_view_v2를 만들고 동일 synthetic fixture에서 v1/v2 mapping을 비교합니다. 새 consumer를 canary로 전환하고 error/row/count/latency를 확인한 뒤 v1 호출을 차단하거나 제거합니다.",
      "CREATE OR REPLACE가 grants를 보존하는지, INSTEAD OF trigger나 dependent materialized object 상태를 어떻게 바꾸는지 엔진별로 확인합니다. DDL transactional behavior와 implicit commit도 rollback runbook에 포함합니다.",
      "version은 이름 숫자만이 아니라 schema fingerprint, population definition, security mode, freshness와 owner를 묶습니다. 같은 v1 이름에서 tenant predicate를 바꾸는 것은 보안상 breaking change일 수 있습니다.",
      "rollback은 previous DDL 재실행만이 아닙니다. base old columns, grants, synonyms/routing, materialized data와 consumer compatibility가 남아 있는지 rehearsed clean-room에서 검증합니다.",
    ],
    concepts: [
      c("contract version", "schema·population·security·freshness 의미가 서로 호환되는 view 세대입니다.", ["이름 또는 routing으로 구분합니다.", "semantic diff를 기록합니다."]),
      c("dual read", "같은 canonical inputs를 old/new view에서 읽어 결과와 성능을 비교하는 migration 단계입니다.", ["PII 대신 합성/canonical keys를 씁니다.", "approved differences를 명시합니다."]),
      c("consumer cutover", "등록된 소비자를 새 view version으로 원자적 또는 단계적으로 이동하는 과정입니다.", ["canary와 rollback이 필요합니다.", "usage telemetry로 완료를 증명합니다."]),
    ],
    codeExamples: [py("db09-version-compatibility", "v1과 v2의 호환 projection 비교", "db09_version_compatibility.py", "v2에 derived label을 추가해도 v1 열과 값이 보존되는지 이름 기반으로 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE course(id INTEGER PRIMARY KEY, code TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL)")
db.executemany("INSERT INTO course VALUES (?, ?, ?, ?)", [(1, "SQL-1", "SQL start", "active"), (2, "JAVA-1", "Java start", "paused")])
db.execute("CREATE VIEW course_v1(course_id, code, title) AS SELECT id, code, title FROM course")
db.execute("CREATE VIEW course_v2(course_id, code, title, status_label) AS SELECT id, code, title, upper(status) FROM course")
v1_columns = [row[1] for row in db.execute("PRAGMA table_info(course_v1)")]
v2_columns = [row[1] for row in db.execute("PRAGMA table_info(course_v2)")]
v1_rows = list(db.execute("SELECT course_id, code, title FROM course_v1 ORDER BY course_id"))
v2_prefix = list(db.execute("SELECT course_id, code, title FROM course_v2 ORDER BY course_id"))
print("v1-columns=" + ",".join(v1_columns))
print("v2-columns=" + ",".join(v2_columns))
print("prefix-compatible=" + str(v1_rows == v2_prefix).lower())
print("v2-labels=" + ",".join(row[0] for row in db.execute("SELECT status_label FROM course_v2 ORDER BY course_id")))`, "v1-columns=course_id,code,title\nv2-columns=course_id,code,title,status_label\nprefix-compatible=true\nv2-labels=ACTIVE,PAUSED", ["mysql-create-view", "mysql-view-restrictions", "oracle-create-view", "sqlite-create-view"])],
    diagnostics: [
      d("OR REPLACE 직후 old application mapper가 실패합니다.", "같은 view 이름에서 열/type/order를 breaking하게 바꿨습니다.", ["old prepared query", "metadata before/after", "positional mappings", "grant/trigger state"], "v2 병행 view를 배포하고 old consumer conformance 후 단계적으로 전환합니다.", "supported client versions 전부를 schema contract CI에서 실행합니다."),
      d("rollback DDL은 성공했지만 새 base data 때문에 old view가 실패합니다.", "forward migration이 old constraint/type 범위를 이미 깨뜨렸습니다.", ["old base compatibility", "new-only values", "backfill reversibility", "consumer routing"], "compatibility window 동안 dual-write validation 또는 reversible transform을 유지하고 rollback readback을 rehearsal합니다.", "migration마다 roll-forward/rollback data invariants를 문서화합니다."),
    ],
    expertNotes: ["CREATE OR REPLACE는 배포 수단이지 compatibility 전략이 아닙니다.", "v1 제거 기준은 날짜만이 아니라 zero usage, owner 승인, restore evidence와 rollback 종료 승인입니다."],
  },
  {
    id: "merge-temptable-plan-performance",
    title: "MERGE·TEMPTABLE과 predicate pushdown을 실제 plan으로 검증합니다",
    lead: "view는 성능을 자동으로 개선하지 않으며, abstraction layer가 optimizer rewrite를 돕거나 가로막는지는 definition과 엔진에 달려 있습니다.",
    explanations: [
      "MySQL view ALGORITHM MERGE는 가능할 때 outer query와 view definition을 합쳐 predicate와 index 사용 기회를 만들고, TEMPTABLE은 중간 결과를 materialize할 수 있습니다. UNDEFINED는 엔진 선택이므로 version/통계 변화에 plan이 달라질 수 있습니다.",
      "aggregate, DISTINCT, GROUP BY, LIMIT과 일부 expression은 merge를 막거나 optimization fence처럼 동작할 수 있습니다. view 자체에 index를 만든다고 가정하지 말고 base table indexes와 rewritten query의 access path를 EXPLAIN ANALYZE로 봅니다.",
      "nested view를 여러 번 참조하면 같은 계산이 반복되거나 materialized intermediate가 커질 수 있습니다. plan에서 rows, loops, filter position, temp/spill와 final sort를 구분하고 representative tenant skew를 포함합니다.",
      "security barrier와 predicate pushdown은 때로 충돌합니다. 성능을 위해 row policy가 우회되거나 사용자 predicate/function evaluation 순서가 side channel을 만들지 않도록 correctness/security를 먼저 고정합니다.",
      "plan hint/algorithm을 고정하면 예측 가능성이 생길 수 있지만 data distribution이 바뀔 때 최적이 아닐 수 있습니다. plan baseline, latency/rows-read budget과 versioned exception을 함께 운영합니다.",
    ],
    concepts: [
      c("view merging", "outer query와 view query block을 optimizer가 하나의 query처럼 재작성하는 처리입니다.", ["predicate pushdown 기회가 생깁니다.", "항상 가능한 것은 아닙니다."]),
      c("temporary materialization", "view 결과를 중간 저장소에 만든 뒤 outer query가 읽는 처리입니다.", ["temp I/O와 row width를 측정합니다.", "materialized view와 동일하지 않습니다."]),
      c("optimization fence", "predicate/order rewrite가 경계를 넘어가지 못해 불필요한 rows를 먼저 처리하게 하는 구조입니다.", ["semantic 필요성인지 확인합니다.", "actual plan으로 판정합니다."]),
    ],
    diagnostics: [
      d("base query는 빠른데 같은 조건을 view에 적용하면 전체 scan입니다.", "aggregate/temptable 경계 밖에 consumer predicate가 남아 pushdown되지 않았습니다.", ["view algorithm", "actual plan rows/loops", "predicate location", "base composite indexes"], "안전하면 predicate를 view input으로 이동하거나 parameterized query/API, summary table을 사용하고 plan을 비교합니다.", "critical view별 plan/rows-read/latency budget regression을 둡니다."),
      d("작은 tenant는 빠르지만 큰 tenant에서 temp disk가 급증합니다.", "materialized intermediate가 tenant skew와 wide projection 때문에 memory를 넘었습니다.", ["max/p95 tenant rows", "selected row width", "temp/spill counters", "concurrency"], "초기 filter와 좁은 projection을 적용하고 필요한 summary/materialization을 설계합니다.", "largest-partition fixture와 concurrency spill alert를 둡니다."),
    ],
    expertNotes: ["EXPLAIN estimated cost만으로 승인하지 말고 synthetic representative distribution의 actual rows/loops/temp를 봅니다.", "성능 rewrite 전후에 authorization population과 row grain이 동일한지 먼저 reconciliation합니다."],
  },
  {
    id: "materialized-view-refresh-freshness",
    title: "logical view와 materialized snapshot의 refresh·staleness 계약을 분리합니다",
    lead: "비싼 집계 결과를 저장하면 조회는 빨라질 수 있지만 이제 freshness, refresh 원자성, 실패 복구와 저장 비용을 직접 운영해야 합니다.",
    explanations: [
      "materialized view는 query result를 물리적으로 보유합니다. Oracle은 refresh mode/timing과 query rewrite 같은 기능을 제공하지만 MySQL의 일반 view에는 동일 native object가 없으므로 summary table+refresh job 같은 별도 pattern을 설계해야 합니다.",
      "freshness 계약은 on commit, interval, on demand, maximum staleness와 as-of watermark 중 하나를 명확히 합니다. 사용자가 live라고 믿는 숫자에 timestamp만 작게 붙이는 것으로 의미를 대신하지 않습니다.",
      "full refresh는 단순하지만 비용과 availability가 크고, fast/incremental refresh는 log·key·aggregate 제한과 late correction을 관리해야 합니다. source count/sum과 refreshed result를 watermark 단위로 reconciliation합니다.",
      "refresh in place는 partial/empty state를 노출할 수 있습니다. staging container에 완성하고 validation 후 synonym/pointer 또는 transaction으로 교체하며 previous good snapshot을 rollback용으로 보존합니다.",
      "query rewrite가 materialized object를 자동 선택하면 consumer SQL은 같아도 freshness와 plan이 바뀔 수 있습니다. rewrite eligibility, stale tolerance와 used-object evidence를 plan/telemetry에 남깁니다.",
    ],
    concepts: [
      c("materialized view", "query 결과를 물리적으로 저장하고 정의된 규칙으로 갱신하는 database object 또는 운영 pattern입니다.", ["일반 view와 다릅니다.", "storage와 refresh 책임이 생깁니다."]),
      c("refresh watermark", "materialized 결과에 반영된 source 변경의 상한 시점·sequence입니다.", ["freshness를 측정합니다.", "reconciliation 기준이 됩니다."]),
      c("atomic publish", "완성·검증된 새 snapshot만 소비자에게 한 번에 보이도록 전환하는 방식입니다.", ["partial refresh 노출을 막습니다.", "previous snapshot을 보존합니다."]),
    ],
    codeExamples: [py("db09-materialized-refresh", "summary table snapshot의 stale과 atomic refresh", "db09_materialized_refresh.py", "SQLite table로 materialized snapshot 의미를 모델링해 source 변경 전후 stale 값과 refresh watermark를 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE completion(learner_key TEXT, points INTEGER NOT NULL)")
db.executemany("INSERT INTO completion VALUES (?, ?)", [("L-01", 10), ("L-01", 20), ("L-02", 15)])
db.execute("CREATE TABLE completion_summary(learner_key TEXT PRIMARY KEY, total_points INTEGER NOT NULL, watermark INTEGER NOT NULL)")
def refresh(watermark):
    with db:
        db.execute("DELETE FROM completion_summary")
        db.execute("INSERT INTO completion_summary SELECT learner_key, sum(points), ? FROM completion GROUP BY learner_key", (watermark,))
refresh(1)
print("snapshot-1=" + ",".join(f"{key}:{total}" for key, total in db.execute("SELECT learner_key, total_points FROM completion_summary ORDER BY learner_key")))
db.execute("INSERT INTO completion VALUES ('L-02', 5)")
print("stale-l02=" + str(db.execute("SELECT total_points FROM completion_summary WHERE learner_key='L-02'").fetchone()[0]))
refresh(2)
print("snapshot-2=" + ",".join(f"{key}:{total}" for key, total in db.execute("SELECT learner_key, total_points FROM completion_summary ORDER BY learner_key")))
print("watermark=" + str(db.execute("SELECT min(watermark) FROM completion_summary").fetchone()[0]))`, "snapshot-1=L-01:30,L-02:15\nstale-l02=15\nsnapshot-2=L-01:30,L-02:20\nwatermark=2", ["oracle-create-materialized-view", "sqlite-transaction", "sqlite-query-planner"])],
    diagnostics: [
      d("대시보드 수치가 source보다 오래됐지만 정상으로 표시됩니다.", "refresh watermark와 maximum staleness를 response/alert에 연결하지 않았습니다.", ["last successful refresh", "source watermark", "job failure/retry", "consumer freshness requirement"], "as-of/watermark와 stale status를 공개하고 SLA 초과 시 fail closed 또는 명시적 degraded mode를 적용합니다.", "freshness lag SLO와 stale-read acceptance test를 둡니다."),
      d("refresh 중 report가 0건 또는 절반만 보입니다.", "live container를 delete/insert하며 partial state를 노출했습니다.", ["refresh transaction", "DDL implicit commit", "reader isolation", "staging/pointer design"], "staging snapshot을 완성·reconcile한 뒤 atomic publish하고 previous good version을 유지합니다.", "refresh 중 concurrent read와 injected failure test를 반복합니다."),
    ],
    expertNotes: ["materialization은 성능 기능이면서 data product이므로 owner, lineage, freshness, retention과 correction 정책을 가집니다.", "refresh 성공 로그보다 consumer가 새 watermark를 실제 읽었다는 readback이 더 강한 증거입니다."],
  },
  {
    id: "mysql-oracle-sqlite-view-matrix",
    title: "MySQL·Oracle·SQLite의 VIEW 의미를 syntax가 아닌 conformance matrix로 비교합니다",
    lead: "세 엔진 모두 CREATE VIEW라는 단어를 쓰지만 security, updatability, check option, replace와 materialization의 지원 범위는 같지 않습니다.",
    explanations: [
      "MySQL matrix에는 ALGORITHM, DEFINER, SQL SECURITY, LOCAL/CASCADED CHECK OPTION, updatability rules, metadata privileges와 base alter invalidation을 넣습니다. server minor version과 sql_mode도 evidence에 기록합니다.",
      "Oracle matrix에는 owner direct grants, BEQUEATH, inherent updatability, INSTEAD OF triggers, FORCE/invalid objects, editioning view와 materialized view/refresh를 넣습니다. MySQL 용어를 억지로 일대일 대응시키지 않습니다.",
      "SQLite view는 read-only가 기본이고 INSTEAD OF trigger가 write mapping을 제공합니다. built-in user/role privilege model과 native materialized view가 없으므로 application/file access와 summary table harness를 production security/refresh 대체물로 오해하지 않습니다.",
      "conformance fixture는 projection schema, row grain, predicate/NULL, attempted DML, nested check, dependency break, prepared consumer와 plan을 포함합니다. exact output이 같아야 하는 항목과 승인된 차이를 먼저 선언합니다.",
      "migration은 common denominator만 강요하지 않습니다. 필요한 engine 기능을 adapter/runbook으로 캡슐화하고 portable contract와 engine-specific operational implementation을 분리합니다.",
    ],
    concepts: [
      c("semantic conformance", "서로 다른 구현이 동일 fixtures에서 계약한 schema·rows·errors·security 결과를 만족하는 성질입니다.", ["동일 SQL text를 요구하지 않습니다.", "승인된 차이를 기록합니다."]),
      c("capability matrix", "engine/version별 지원 syntax와 실제 동작·제약·검증 방법을 정리한 표입니다.", ["unknown을 unsupported로 단정하지 않습니다.", "공식 문서와 실행 evidence를 연결합니다."]),
      c("semantic harness", "production 고유 기능을 대체하지 않고 작은 불변식을 재현하는 로컬 실행 예제입니다.", ["한계를 명시합니다.", "production conformance가 별도로 필요합니다."]),
    ],
    diagnostics: [
      d("SQLite 테스트는 통과했는데 MySQL 배포에서 view DML이 다릅니다.", "semantic harness 결과를 dialect updatability 규칙의 증거로 오해했습니다.", ["engine/version", "actual CREATE VIEW DDL", "updatability metadata", "trigger/check option"], "portable invariant와 engine-specific DDL test를 분리해 실제 서버 conformance를 실행합니다.", "지원 엔진 matrix를 CI/격리 integration suite로 유지합니다."),
      d("Oracle 이관에서 DEFINER/INVOKER를 단어 치환했더니 권한 오류입니다.", "BEQUEATH, owner direct grants와 nested function rights가 MySQL SQL SECURITY와 동일하지 않습니다.", ["name resolution", "object owner grants", "AUTHID/BEQUEATH", "enabled roles"], "각 엔진 공식 권한 모델로 privilege closure를 다시 계산하고 low/high user readback을 실행합니다.", "권한 matrix에 positive/negative identity tests를 둡니다."),
    ],
    expertNotes: ["SQLite exact examples는 schema와 relational invariant 교육용이며 server security/optimizer/DDL transaction의 증거가 아닙니다.", "capability 차이를 숨기는 abstraction보다 차이를 명시한 adapter와 conformance report가 안전합니다."],
  },
  {
    id: "view-deploy-observe-govern",
    title: "VIEW를 inventory·배포·관측·폐기 가능한 운영 자산으로 관리합니다",
    lead: "좋은 view도 owner 없이 쌓이면 서로 다른 정의의 진실, 깊은 dependency와 사용되지 않는 privilege surface가 됩니다.",
    explanations: [
      "inventory에는 fully qualified name, contract version, owner, purpose, consumers, base dependencies, security mode/definer, write classification, freshness, SLO, created/deprecation dates와 source migration id를 기록합니다.",
      "배포 순서는 prerequisite base changes→owner/direct grants→new view→consumer grant→metadata/schema/row/negative security readback→routing입니다. destructive replace/drop은 usage와 dependency evidence가 준비된 별도 단계로 둡니다.",
      "관측에는 query count/error/latency/rows-read/temp, consumer identity, definition hash, invalid status, privilege drift와 materialized freshness를 남깁니다. SQL parameter와 원본 행 값은 log에서 제외하거나 최소화합니다.",
      "view definition drift는 source control DDL과 SHOW CREATE/catalog normalization을 비교해 탐지합니다. emergency console change도 승인·capture·reconcile하지 않으면 다음 배포가 되돌리므로 break-glass 절차를 둡니다.",
      "폐기는 announce→deny new consumers→usage measurement→revoke canary→error observation→drop→backup restore 확인 순서로 진행합니다. CASCADE를 편의로 사용하지 않고 dependent object를 소유자와 함께 명시적으로 정리합니다.",
    ],
    concepts: [
      c("view inventory", "저장 view의 계약·owner·dependency·security·lifecycle metadata를 모은 운영 목록입니다.", ["catalog 자동 수집과 사람 책임을 결합합니다.", "orphan을 탐지합니다."]),
      c("definition drift", "source-controlled 기대 DDL과 실제 database definition/grants가 달라진 상태입니다.", ["정규화 hash와 semantic readback을 씁니다.", "break-glass 변경을 포함합니다."]),
      c("safe retirement", "실제 사용과 dependency가 없음을 증명하고 권한을 단계적으로 회수한 뒤 object를 제거하는 절차입니다.", ["revoke canary를 활용합니다.", "restore evidence를 보존합니다."]),
    ],
    diagnostics: [
      d("같은 이름의 view가 환경마다 다른 결과를 냅니다.", "수동 변경 또는 배포 누락으로 definition/grant drift가 생겼습니다.", ["normalized SHOW/DDL hash", "grants/definer", "base schema version", "canonical rows"], "source migration을 authoritative하게 재적용하고 readback이 일치할 때만 routing합니다.", "정기 drift scan과 break-glass reconciliation SLA를 둡니다."),
      d("view latency가 증가했지만 원인을 base table에서만 찾습니다.", "definition/plan/consumer predicate/materialization 변화 telemetry가 없습니다.", ["definition hash", "plan hash and rows", "consumer query shapes", "statistics/index changes"], "view 단위 SLO와 representative plan capture를 두고 security population parity 후 optimization합니다.", "release별 rows-read/temp/latency regression과 alert owner를 둡니다."),
    ],
    expertNotes: ["view 수보다 owner 없는 public contract 수와 dependency depth를 건강성 지표로 봅니다.", "관측 log에는 raw 학습자 이름·주소·전화번호·자유 입력을 넣지 않고 synthetic key와 aggregate count를 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0203", repository: "dbstudy", path: "02_03.sql", usedFor: ["CREATE/DROP VIEW, projection, filter and join progression"], evidence: "read-only로 121 logical lines와 view 구간을 확인했으며 sample 사람 정보는 복사하지 않았습니다." },
  { id: "local-0204", repository: "dbstudy", path: "02_04.sql", usedFor: ["view 이후 procedure/function progression and boundary"], evidence: "read-only로 251 logical lines를 확인하고 view와 routine 책임 분리 근거로만 사용했습니다." },
  { id: "local-0205", repository: "dbstudy", path: "02_05.sql", usedFor: ["trigger progression and INSTEAD OF distinction"], evidence: "read-only로 51 logical lines를 확인하고 base trigger와 view DML trigger 차이를 보강했습니다." },
  { id: "mysql-create-view", repository: "MySQL 8.4 Reference Manual", path: "CREATE VIEW Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-view.html", usedFor: ["syntax, ALGORITHM, DEFINER, SQL SECURITY and CHECK OPTION"], evidence: "MySQL 공식 CREATE VIEW 문서입니다." },
  { id: "mysql-view-updatable", repository: "MySQL 8.4 Reference Manual", path: "Updatable and Insertable Views", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/view-updatability.html", usedFor: ["inherent DML eligibility and column restrictions"], evidence: "MySQL 공식 updatable view 문서입니다." },
  { id: "mysql-view-check", repository: "MySQL 8.4 Reference Manual", path: "The View WITH CHECK OPTION Clause", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/view-check-option.html", usedFor: ["LOCAL/CASCADED visibility invariants"], evidence: "MySQL 공식 CHECK OPTION 문서입니다." },
  { id: "mysql-view-algorithms", repository: "MySQL 8.4 Reference Manual", path: "View Processing Algorithms", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/view-algorithms.html", usedFor: ["MERGE, TEMPTABLE and optimizer boundaries"], evidence: "MySQL 공식 view algorithm 문서입니다." },
  { id: "mysql-object-security", repository: "MySQL 8.4 Reference Manual", path: "Stored Object Access Control", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/stored-objects-security.html", usedFor: ["definer/invoker privilege context"], evidence: "MySQL 공식 stored object access 문서입니다." },
  { id: "mysql-view-restrictions", repository: "MySQL 8.4 Reference Manual", path: "Restrictions on Views", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/view-restrictions.html", usedFor: ["dependency invalidation, indexing and operational restrictions"], evidence: "MySQL 공식 view restrictions 문서입니다." },
  { id: "oracle-create-view", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE VIEW", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-VIEW.html", usedFor: ["Oracle privileges, BEQUEATH, updatability, check and editioning"], evidence: "Oracle 공식 CREATE VIEW 문서입니다." },
  { id: "oracle-create-materialized-view", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE MATERIALIZED VIEW", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-MATERIALIZED-VIEW.html", usedFor: ["physical results, refresh and query rewrite"], evidence: "Oracle 공식 materialized view 문서입니다." },
  { id: "sqlite-create-view", repository: "SQLite Documentation", path: "CREATE VIEW", publicUrl: "https://www.sqlite.org/lang_createview.html", usedFor: ["exact logical view laboratory and read-only default"], evidence: "SQLite 공식 CREATE VIEW 문서입니다." },
  { id: "sqlite-create-trigger", repository: "SQLite Documentation", path: "CREATE TRIGGER", publicUrl: "https://www.sqlite.org/lang_createtrigger.html", usedFor: ["INSTEAD OF mapping and check semantic harness"], evidence: "SQLite 공식 trigger 문서입니다." },
  { id: "sqlite-query-planner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["small-lab plan limitations"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["atomic snapshot harness"], evidence: "SQLite 공식 transaction 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-09-view-abstraction", slug: "db-09-view-abstraction", courseId: "database", moduleId: "db-programmability-performance", order: 1,
  title: "VIEW로 조회 계약 만들고 갱신 한계 이해하기", subtitle: "저장 SELECT를 projection·grain·보안·갱신·의존성·성능·version·materialization까지 운영 가능한 조회 API로 확장합니다.", level: "고급", estimatedMinutes: 820,
  coreQuestion: "VIEW를 편리한 SELECT 별칭이 아니라 데이터 손실·권한 상승·호환성 파괴·stale 결과 없이 오래 유지되는 조회 계약으로 만들려면 무엇을 정의하고 검증해야 할까요?",
  summary: "dbstudy 02_03.sql의 view 생성·조회·join·drop 흐름과 02_04/02_05의 routine/trigger 경계를 read-only로 감사합니다. 일반 view의 논리 관계와 projection/grain/type 계약, DEFINER·INVOKER 최소 권한, inherent updatability와 INSTEAD OF mapping, LOCAL/CASCADED CHECK OPTION, dependency invalidation과 v1/v2 migration, MERGE/TEMPTABLE plan, materialized refresh/watermark, MySQL·Oracle·SQLite conformance와 lifecycle governance를 전문가 수준으로 연결합니다. 여섯 exact Python/SQLite examples는 일반 관계 의미, 최소 projection, 명시적 view DML, visibility check, version compatibility와 snapshot refresh의 여섯 축을 실행합니다.",
  objectives: ["view의 logical relation·row grain·column schema·freshness 계약을 정의한다.", "DEFINER/INVOKER privilege closure와 tenant negative path를 검증한다.", "operation·column별 updatability와 INSTEAD OF mapping을 설계한다.", "CHECK OPTION과 base constraints의 책임을 구분한다.", "dependency graph와 expand-contract v1/v2 migration을 운영한다.", "MERGE/TEMPTABLE·predicate pushdown·materialized refresh를 actual evidence로 측정한다.", "엔진 conformance, drift observation, safe retirement와 privacy를 통합한다."],
  prerequisites: [],
  keywords: ["CREATE VIEW", "logical abstraction", "projection contract", "row grain", "DEFINER", "INVOKER", "updatable view", "INSTEAD OF", "WITH CHECK OPTION", "dependency", "contract version", "MERGE", "TEMPTABLE", "materialized view", "refresh watermark", "DROP VIEW"], topics,
  lab: {
    title: "학습 이력 공개 view를 v1에서 보안·갱신·성능 검증된 v2로 전환하기",
    scenario: "여러 tenant의 학습 이력 base table에서 report/API용 view를 제공합니다. 내부 note는 숨겨야 하고 active 행만 제한적으로 수정할 수 있으며, old consumer와 집계 dashboard를 중단 없이 새 schema로 이동해야 합니다.",
    setup: ["사람 이름·주소·전화번호 없이 synthetic tenant/learner/course keys와 zero/one/many/NULL/duplicate/skew fixtures를 만듭니다.", "MySQL 8.4·Oracle 26ai 격리 schemas와 low/high privilege users를 준비합니다.", "v1 schema/population/grain/security/freshness/write contract와 consumer registry를 작성합니다.", "base→nested view→materialized/report→consumer dependency와 expected grants를 고정합니다."],
    steps: ["명시적 projection·alias·cast와 key/grain schema metadata를 readback합니다.", "low/high user로 definer/invoker positive/negative tenant queries를 실행합니다.", "INSERT/UPDATE/DELETE를 view별로 시도해 operation/column updatability matrix를 기록합니다.", "inner/outer predicate와 NULL을 깨뜨려 LOCAL/CASCADED check behavior를 확인합니다.", "base rename/drop rehearsal에서 invalid objects와 consumer query failure를 전환 전에 검출합니다.", "v1/v2 dual read의 schema·ids·counts·types와 approved difference를 reconciliation합니다.", "EXPLAIN actual로 merge/materialization, predicate position, rows/loops/temp와 largest tenant latency를 측정합니다.", "summary snapshot을 staging refresh하고 source watermark/count/sum 검증 뒤 atomic publish합니다.", "definition/grant hash와 runtime SLO telemetry를 확인한 뒤 canary consumer를 v2로 전환합니다.", "v1 usage zero와 restore evidence를 확인하고 revoke observation 후 safe drop합니다."],
    expectedResult: ["공개 열·row grain·tenant population과 type/null/freshness가 contract와 일치합니다.", "허용 identity만 조회·DML에 성공하고 denied path에는 base 정보가 노출되지 않습니다.", "view DML은 명시한 base key만 바꾸고 predicate를 깨는 write는 atomic하게 거부됩니다.", "v1/v2 consumer와 dependency가 plan/latency budget 안에서 무중단 전환됩니다.", "materialized 결과는 watermark와 reconciliation 상태를 표시하며 partial refresh가 노출되지 않습니다."],
    cleanup: ["격리 schemas, synthetic users/grants, views/triggers/summary tables를 dependency 역순으로 제거합니다.", "temporary credentials와 exports를 revoke·삭제합니다.", "audit/log에 raw row values나 원본 sample 개인 정보가 없는지 검사합니다.", "D:\\dev\\dbstudy 원본 파일과 production data는 변경하지 않습니다."],
    extensions: ["Oracle editioning view와 edition-based redefinition migration을 비교합니다.", "row-level security/VPD와 security-barrier view의 predicate/side-channel 모델을 확장합니다.", "incremental materialized refresh와 late correction/restate를 구현합니다.", "view lineage를 catalog+query telemetry로 자동 생성하고 ownerless contract를 차단합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 exact examples를 실행하고 logical view·DML mapping·check·version·snapshot의 불변식을 표로 정리하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "각 view의 row grain/key를 적습니다.", "공개/비공개 열을 구분합니다.", "view DML이 바꾸는 base key를 추적합니다.", "거부 write 뒤 base count를 확인합니다.", "v1/v2 schema와 snapshot watermark를 비교합니다."], hints: ["table처럼 보이는 것과 table처럼 저장되는 것은 다릅니다."], expectedOutcome: "VIEW의 조회·쓰기·freshness 경계를 실행 결과로 설명합니다.", solutionOutline: ["schema→population→security→write mapping→version→freshness 순서로 증거를 연결합니다."] },
    { difficulty: "응용", prompt: "원본 V_ORDER_NAME 흐름을 synthetic multi-tenant 학습 주문 contract v2로 재설계하세요.", requirements: ["원본 provenance와 sample 비복사를 기록합니다.", "projection/grain/type/null contract를 작성합니다.", "definer/invoker low/high tests를 실행합니다.", "operation별 updatability/check option을 분류합니다.", "dependency와 v1/v2 dual read를 검증합니다.", "actual plan과 largest tenant budget을 측정합니다.", "materialized freshness/reconciliation/atomic publish를 둡니다.", "drift/usage/retirement telemetry를 포함합니다."], hints: ["한 view에 조회·명령·snapshot 책임을 모두 넣지 마세요."], expectedOutcome: "보안·호환·성능·운영 근거가 있는 공개 조회 계약이 완성됩니다.", solutionOutline: ["audit→contract→negative security/DML→dual read→plan→publish→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 VIEW governance 표준과 엔진 conformance gate를 작성하세요.", requirements: ["naming/owner/grain/schema/version 규칙을 둡니다.", "security mode/direct grants/orphan definer 정책을 정의합니다.", "read/write/check/trigger 분류를 요구합니다.", "dependency/expand-contract/rollback 절차를 둡니다.", "MERGE/materialize/plan/spill budgets를 정의합니다.", "freshness/watermark/reconciliation을 요구합니다.", "MySQL·Oracle·SQLite approved differences를 기록합니다.", "drift/privacy/safe retirement controls를 포함합니다."], hints: ["CREATE OR REPLACE는 governance가 아니라 하나의 DDL 동작입니다."], expectedOutcome: "초급 view부터 materialized data product까지 일관된 전문가 운영 기준이 완성됩니다.", solutionOutline: ["define→authorize→map writes→version→measure→publish→observe→retire 순서입니다."] },
  ],
  nextSessions: ["db-10-procedure-in-out"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["02_03.sql의 CREATE/DROP VIEW와 projection/filter/join progression을 read-only로 확인했습니다. SHA-256은 07FA8F4DCDDBDE2C45B7011B3DB71F1255C2C448954D461D176A2E9BBB2060C5입니다.", "02_04.sql 251 logical lines(5,670 bytes, SHA-256 B65DEA6AA74E68FFD8EA8365F7BE120D5152B139965EE23DEA71ABC65589E2C8)와 02_05.sql 51 logical lines(1,403 bytes, SHA-256 EEE7457137C97287BC3BA74FA56A6E90552666C8CB5C3120BC3ADF3928C9487F)를 read-only로 확인해 routine/trigger 경계를 보강했습니다.", "원본의 사람 이름·주소·전화번호·주문 값은 복사하지 않고 object progression만 provenance로 사용했습니다.", "SQLite exact examples는 MySQL SQL SECURITY/ALGORITHM/CHECK와 Oracle BEQUEATH/edition/materialized refresh/security/optimizer 동작을 대체하지 않습니다."] },
});

export default session;
