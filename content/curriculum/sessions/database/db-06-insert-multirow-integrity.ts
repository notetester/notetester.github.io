import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python 표준 sqlite3와 memory database로 synthetic schema를 만들고 외부 credential·실제 학습자 data를 사용하지 않습니다." },
      { lines: "7-끝에서 5줄 전", explanation: "single/multi-row INSERT, defaults, constraints, transaction/savepoint, idempotency 또는 staging policy를 정상·실패 fixtures로 실행합니다." },
      { lines: "마지막 5줄", explanation: "정렬된 rows·counts·stable category만 출력합니다. raw vendor message를 golden으로 고정하지 않고 MySQL 8.4·Oracle 26ai 차이는 별도 integration matrix로 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite exact example은 SQL 무결성 사고 모델을 재현하며 vendor dialect·error code의 대체물이 아닙니다."] },
    experiments: [
      { change: "column list, NULL, duplicate 또는 한 row의 invalid value를 바꿉니다.", prediction: "statement/transaction policy에 따라 전체 rollback 또는 명시한 row 격리가 관찰됩니다.", result: "영향 행 수만 보지 않고 committed state와 reject reason을 함께 검증합니다." },
      { change: "같은 logical request를 같은 idempotency key로 다시 실행합니다.", prediction: "새 row 대신 기존 결과를 반환하거나 payload conflict로 거부해야 합니다.", result: "transport retry와 database insert 횟수를 분리합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "insert-contract-column-list",
    title: "INSERT를 table column order가 아닌 명시적 write contract로 작성합니다",
    lead: "`INSERT INTO table VALUES (...)`는 짧지만 schema에 column 하나가 추가·재배치되면 값의 의미가 바뀌거나 배포가 깨질 수 있습니다.",
    explanations: [
      "INSERT는 target table, target column list, 각 row의 expressions와 conflict/error outcome으로 읽습니다. 원본 01_27.sql에는 전체 column 생략형과 BOOKNAME·PUBLISHER·PRICE 같은 명시 column list가 모두 있어 차이를 비교할 수 있습니다. production code에서는 migration과 writer versions가 겹치므로 column list를 기본값으로 삼습니다.",
      "column list의 순서는 table declaration 순서와 같을 필요가 없지만 VALUES의 각 position은 list와 정확히 대응해야 합니다. 이름과 가격이 모두 문자열/숫자로 coercion 가능하면 잘못된 순서가 즉시 오류가 아니라 silent corruption이 될 수 있어 parameter object→named mapping→DDL contract tests를 둡니다.",
      "ORM·mapper가 SQL을 생성해도 실제 statement와 bind order를 확인합니다. debug log에 값을 노출하지 않고 placeholder position, JDBC type, nullable 여부와 schema version을 추적합니다. schema drift에서는 application mapping과 actual catalog column/type/default를 비교합니다.",
      "한 insert를 성공으로 판정할 때 generated key, affected row count, expected stored canonical values와 constraints를 읽습니다. SQL 실행 예외가 없다는 사실만으로 잘못된 default·truncation·timezone coercion이 없다고 결론내리지 않습니다.",
    ],
    concepts: [
      c("target column list", "INSERT values가 대응할 columns와 순서를 명시하는 계약입니다.", ["schema declaration 순서 의존을 줄입니다.", "writer version compatibility를 검토합니다."]),
      c("bind mapping", "application value와 SQL placeholder·database type을 연결하는 ordered mapping입니다.", ["position/type/nullability를 검증합니다.", "secret values를 log하지 않습니다."]),
    ],
    codeExamples: [py(
      "db06-column-list-default",
      "column list로 default와 값 대응을 고정하기",
      "column_list_default.py",
      "schema에 default column이 있어도 named target columns로 두 writer의 의미를 보존합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson (lesson_id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', minutes INTEGER NOT NULL CHECK (minutes > 0))")
db.execute("INSERT INTO lesson (lesson_id, title, minutes) VALUES (?, ?, ?)", (1, "SQL 기초", 40))
db.execute("INSERT INTO lesson (minutes, title, lesson_id, status) VALUES (?, ?, ?, ?)", (55, "무결성", 2, "READY"))

rows = list(db.execute("SELECT lesson_id, title, status, minutes FROM lesson ORDER BY lesson_id"))
print("count=" + str(len(rows)))
print("row1=" + "|".join(map(str, rows[0])))
print("row2=" + "|".join(map(str, rows[1])))
print("default-applied=" + str(rows[0][2] == "DRAFT").lower())
print("mapping-stable=" + str(rows[1] == (2, "무결성", "READY", 55)).lower())`,
      "count=2\nrow1=1|SQL 기초|DRAFT|40\nrow2=2|무결성|READY|55\ndefault-applied=true\nmapping-stable=true",
      ["local-db-0121", "local-db-0127", "mysql-insert", "oracle-insert", "sqlite-insert"],
    )],
    diagnostics: [
      d("배포 후 title과 publisher 값이 뒤바뀌어 저장된다.", "column list를 생략했거나 mapper bind position이 schema/application model과 drift했습니다.", ["actual SQL target columns와 bind types를 확인합니다.", "migration 전후 catalog order를 봅니다.", "affected rows의 writer version을 추적합니다."], "영향 rows를 격리·복구하고 explicit column list와 mapping contract test를 적용합니다.", "generated SQL snapshot과 schema compatibility gate를 둡니다."),
      d("INSERT는 성공했지만 새 column이 의도치 않은 default를 가진다.", "구 writer가 새 column을 생략했고 migration default를 compatibility contract로 검토하지 않았습니다.", ["column default/nullability와 writer versions를 봅니다.", "stored rows를 release별 sample합니다.", "backfill/future default 정책을 확인합니다."], "안전한 expand default를 적용하고 writer를 갱신한 뒤 backfill·constraint를 단계화합니다.", "expand/contract migration test에 old/new writers를 함께 실행합니다."),
    ],
    expertNotes: ["column rename은 add-copy-dual-read/write-backfill-contract 단계로 다루고 두 이름을 한 statement에서 모호하게 사용하지 않습니다.", "bind metadata도 privacy 대상이므로 값 전체 대신 safe type/cardinality/error category를 관측합니다."],
  },
  {
    id: "omitted-null-default-generated",
    title: "생략·DEFAULT·명시 NULL·빈 문자열·generated value를 구분합니다",
    lead: "값을 안 보냈다는 상태와 NULL을 보냈다는 상태는 동일하지 않으며 database default가 적용되는 조건도 dialect와 statement에 따라 확인해야 합니다.",
    explanations: [
      "column을 target list에서 생략하면 default 또는 implicit behavior가 적용될 수 있고, 명시 NULL은 nullable이면 NULL을 저장하며 NOT NULL이면 실패할 수 있습니다. DEFAULT keyword 지원 위치와 multi-row 문법은 MySQL·Oracle exact version에서 확인합니다. application DTO가 absent와 null을 한 값으로 collapse하면 PATCH/create 의미가 사라집니다.",
      "빈 문자열은 사용자 입력에서 ‘없음’처럼 보이지만 database·dialect·column type에 따라 NULL과 다르게 또는 같게 취급될 수 있습니다. trim·normalization은 field policy로 수행하고 password/token처럼 공백이 의미 있는 secret에 무조건 trim을 적용하지 않습니다.",
      "timestamp default, generated column, identity와 trigger가 값을 공급할 때 application clock/value를 동시에 bind하지 않습니다. database-owned field의 owner를 정하고 returned/stored value를 readback합니다. default expression의 timezone·precision·volatility도 migration tests에 포함합니다.",
      "NOT NULL 실패를 피하려고 placeholder 문자열, 0, 1970 날짜를 넣으면 unknown과 real value를 혼합합니다. business optionality를 model하고 필요한 field는 request validation+NOT NULL, 아직 결정되지 않은 state는 명시 status/relation으로 표현합니다.",
    ],
    concepts: [
      c("omitted value", "INSERT target list에 column 자체가 없어 database default/generation 경계에 맡긴 상태입니다.", ["explicit NULL과 구분합니다.", "old writer compatibility에 사용될 수 있습니다."]),
      c("default ownership", "application과 database 중 누가 값을 생성하고 canonical truth를 정하는지의 계약입니다.", ["동시에 두 clock/generator를 쓰지 않습니다.", "stored value를 API/outbox에 일관되게 사용합니다."]),
    ],
    diagnostics: [
      d("created_at이 application과 DB rows 사이에서 몇 초씩 다르다.", "application timestamp와 database default/trigger가 서로 다른 clock/timezone으로 경쟁합니다.", ["actual INSERT column list를 봅니다.", "DB default/trigger와 server clocks를 확인합니다.", "returned value가 어느 source인지 추적합니다."], "한 owner를 정하고 database-owned이면 column을 생략한 뒤 RETURNING/readback 값을 사용합니다.", "clock ownership과 precision/timezone contract test를 둡니다."),
      d("빈 문자열을 넣은 Oracle 이관 데이터가 NULL로 보여 uniqueness가 달라진다.", "빈 문자열과 NULL의 vendor semantics를 portability review에서 누락했습니다.", ["source value distribution과 target comparison을 봅니다.", "NOT NULL/UNIQUE constraints를 확인합니다.", "application normalization을 버전별로 추적합니다."], "business canonicalization을 명시하고 migration preflight로 collisions/required values를 해소합니다.", "empty/blank/null fixtures를 모든 target DB contract suite에 둡니다."),
    ],
    expertNotes: ["DEFAULT는 historical rows를 자동으로 소급 수정하지 않으므로 existing/future data semantics를 분리합니다.", "generated columns/trigger effects를 retry와 change-data-capture에서 중복 적용하지 않도록 source of truth를 정합니다."],
  },
  {
    id: "single-versus-multirow-atomicity",
    title: "단건·다건 INSERT의 statement 원자성과 실패 범위를 명시합니다",
    lead: "multi-row VALUES는 round trip을 줄이지만 row 하나가 constraint를 어겼을 때 statement 전체가 어떻게 되는지 모르면 부분 성공을 잘못 보고할 수 있습니다.",
    explanations: [
      "한 SQL statement에 여러 value tuples를 넣는 방식과 driver batch로 여러 statements를 보내는 방식은 다릅니다. 전자는 server가 한 statement로 처리하고 후자는 driver/server가 개별 execution counts와 partial failure를 가질 수 있습니다. transaction 경계가 둘을 다시 감싸는지도 별도로 확인합니다.",
      "strict INSERT에서 한 tuple이 NOT NULL·UNIQUE·CHECK·FK를 위반할 때 statement atomicity와 engine behavior를 target DB에서 검증합니다. IGNORE, error logging, conflict clause처럼 실패 정책을 바꾸는 syntax를 섞으면 accepted/rejected rows를 반드시 reconciliation합니다.",
      "대형 multi-row statement는 packet/SQL length, parse memory, lock duration, undo/redo, replication lag와 timeout을 키울 수 있습니다. 무조건 한 statement로 합치지 않고 measured batch size, transaction budget, backpressure와 checkpoint를 사용합니다.",
      "API response는 requested, validated, attempted, committed, rejected, unknown counts를 구분합니다. timeout이면 affected row count를 추측하지 않고 idempotency/correlation key로 authoritative state를 조회합니다.",
    ],
    concepts: [
      c("statement atomicity", "한 SQL statement가 성공한 변경 전체를 적용하거나 실패 시 허용된 단위로 되돌리는 성질입니다.", ["engine·error policy와 함께 검증합니다.", "driver batch atomicity와 다릅니다."]),
      c("partial success", "batch 일부 rows/statements만 committed되고 나머지는 실패하거나 outcome unknown인 상태입니다.", ["row별 correlation과 counts가 필요합니다.", "client success 하나로 축약하지 않습니다."]),
    ],
    codeExamples: [py(
      "db06-multirow-atomicity",
      "다건 INSERT 중 CHECK 위반 시 transaction 전체 rollback",
      "multirow_atomicity.py",
      "세 rows 중 하나가 invalid일 때 명시 transaction을 rollback하고 기존 row만 남기는 정책을 검증합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE score (score_id INTEGER PRIMARY KEY, value INTEGER NOT NULL CHECK (value BETWEEN 0 AND 100))")
db.execute("INSERT INTO score VALUES (1, 80)")
db.commit()

blocked = False
try:
    db.execute("BEGIN")
    db.execute("INSERT INTO score VALUES (2, 90), (3, 101), (4, 70)")
    db.commit()
except sqlite3.IntegrityError:
    blocked = True
    db.rollback()

rows = list(db.execute("SELECT score_id, value FROM score ORDER BY score_id"))
print("batch-blocked=" + str(blocked).lower())
print("committed-count=" + str(len(rows)))
print("rows=" + ";".join(f"{key}:{value}" for key, value in rows))
print("partial-new-rows=" + str(any(key > 1 for key, _ in rows)).lower())
print("policy=all-or-nothing")`,
      "batch-blocked=true\ncommitted-count=1\nrows=1:80\npartial-new-rows=false\npolicy=all-or-nothing",
      ["mysql-insert", "mysql-insert-optimization", "oracle-insert", "sqlite-insert", "sqlite-transaction"],
    )],
    diagnostics: [
      d("100개 요청 중 오류 하나 뒤에 몇 rows가 저장됐는지 알 수 없다.", "multi-row statement와 driver batch, auto-commit/transaction 경계를 구분하지 않고 affected count를 버렸습니다.", ["actual SQL/driver update counts를 확인합니다.", "commit/rollback trace와 constraints를 봅니다.", "correlation keys로 authoritative rows를 조회합니다."], "writer를 중지하지 않고 idempotent reconciliation해 outcome을 분류한 뒤 명시 transaction/batch response contract를 적용합니다.", "mixed valid/invalid/timeout fixtures를 exact connector로 시험합니다."),
      d("큰 multi-row INSERT가 replica lag와 lock wait를 만든다.", "batch 크기를 네트워크 round trip만 보고 정해 transaction/redo/replication budget을 넘겼습니다.", ["statement bytes/rows/latency와 lock time을 봅니다.", "redo/undo and replica apply rate를 확인합니다.", "timeout/retry amplification을 추적합니다."], "bounded chunks와 adaptive backpressure/checkpoint로 분할하고 workload SLO 안에서 재측정합니다.", "batch size를 configuration+benchmark evidence로 관리합니다."),
    ],
    expertNotes: ["한 statement 실패와 transaction rollback은 같은 말이 아니므로 앞서 성공한 statements의 state를 명시적으로 처리합니다.", "atomicity를 높이려고 거대한 transaction을 만들면 availability/recovery가 나빠질 수 있어 business unit of work를 기준으로 정합니다."],
  },
  {
    id: "constraint-failure-taxonomy",
    title: "constraint failure를 SQLState·constraint name·domain error로 읽습니다",
    lead: "duplicate, NULL, orphan, range 오류를 모두 ‘INSERT 실패’로 묶으면 사용자 수정 가능 오류와 운영 장애·retry를 구분할 수 없습니다.",
    explanations: [
      "PRIMARY/UNIQUE violation은 이미 존재하는 business entity 또는 idempotent retry일 수 있고, FOREIGN KEY는 stale/unauthorized parent reference, CHECK/NOT NULL은 validation drift일 수 있습니다. named constraint와 SQLState/vendor code를 stable internal category로 mapping합니다.",
      "raw error 문자열은 locale·version·driver에 따라 달라지고 table/column/value를 포함해 정보 노출을 일으킬 수 있습니다. client에는 stable code와 safe field/message를 반환하고 raw SQL·bind values·stack은 제한된 redacted telemetry에 둡니다.",
      "constraint failure는 대개 같은 payload를 retry해도 성공하지 않는 deterministic error입니다. deadlock, serialization failure, connection reset 같은 transient category만 idempotency와 bounded jitter policy로 transaction 전체를 재시도합니다. duplicate idempotency는 existing result lookup으로 처리합니다.",
      "01_21.sql의 members/members2 schema와 01_27.sql의 book/customer/orders inserts는 defaults·required fields·references를 바꾸며 failures를 학습할 출발점입니다. sample 개인 값이나 plaintext-like fields는 공개 교재에 복제하지 않고 synthetic negative fixtures로 바꿉니다.",
    ],
    concepts: [
      c("SQLState", "database/driver 오류를 class와 condition code로 분류하는 표준화된 식별자입니다.", ["vendor code·constraint name과 함께 사용합니다.", "message 문자열 parsing을 피합니다."]),
      c("domain error translation", "database invariant failure를 API/업무가 이해하는 stable error로 변환하는 boundary입니다.", ["retryability와 user action을 포함합니다.", "schema detail을 노출하지 않습니다."]),
    ],
    diagnostics: [
      d("중복 이메일 요청이 500으로 반환되고 자동 retry된다.", "unique violation을 transient infrastructure error로 잘못 분류했습니다.", ["SQLState/vendor code/constraint name을 확인합니다.", "idempotency key와 existing row ownership을 봅니다.", "retry count와 load를 추적합니다."], "duplicate를 domain conflict 또는 existing idempotent result로 번역하고 반복 retry를 중단합니다.", "constraint별 error-mapping contract test와 retry classifier를 둡니다."),
      d("오류 응답에 schema 이름과 입력값이 노출된다.", "raw SQLException/driver message를 client serializer로 전달했습니다.", ["exception mapper와 response body를 검사합니다.", "logs/APM parameter capture를 확인합니다.", "노출된 데이터 retention을 평가합니다."], "stable safe code/message로 교체하고 SQL/value를 redact하며 이미 노출된 telemetry를 제한합니다.", "privacy scan과 allowlisted error fields를 CI에 둡니다."),
    ],
    expertNotes: ["constraint rename도 application mapping compatibility에 영향을 주므로 schema API change로 versioning합니다.", "오류율 급증은 bad deploy·malicious input·upstream drift를 의미할 수 있어 category/operation/release별 metrics와 runbook을 둡니다."],
  },
  {
    id: "transaction-savepoint-policy",
    title: "transaction·savepoint로 all-or-nothing과 row 격리 정책을 의도적으로 선택합니다",
    lead: "모든 batch를 무조건 전체 rollback하거나 반대로 오류 rows만 조용히 건너뛰는 것은 둘 다 업무 요구를 대체하지 못합니다.",
    explanations: [
      "주문 header와 items처럼 함께 성립해야 하는 aggregate는 한 transaction에서 전부 commit/rollback합니다. 독립적인 CSV rows라면 row별 validation·savepoint·reject ledger로 일부를 받아들일 수 있지만 accepted/rejected 결과와 재처리 가능성을 명시합니다.",
      "savepoint는 transaction 안의 부분 rollback 지점입니다. error 후 connection/driver가 statement 또는 transaction을 어떤 상태로 두는지 target DB에서 확인하고 savepoint release/rollback을 disciplined하게 수행합니다. savepoint per row의 overhead도 benchmark합니다.",
      "auto-commit이 켜진 driver batch는 예상보다 이른 commit을 만들 수 있습니다. framework @Transactional proxy 경계, exception swallowing, checked/unchecked rollback rules와 connection pool reset을 integration test로 확인합니다.",
      "external message/email/file write는 database rollback이 되돌리지 못합니다. entity와 outbox를 같은 transaction에 저장하고 commit 뒤 relay가 side effect를 수행하며 idempotent consumer가 retry를 견디게 합니다.",
    ],
    concepts: [
      c("unit of work", "업무 invariant상 함께 성공하거나 실패해야 하는 변경 집합입니다.", ["SQL statement 수와 동일하지 않을 수 있습니다.", "transaction boundary의 근거가 됩니다."]),
      c("savepoint", "열린 transaction 안에서 그 이후 작업만 rollback할 수 있는 표식입니다.", ["부분 수용 정책에 사용할 수 있습니다.", "DB/driver error-state semantics를 검증합니다."]),
    ],
    codeExamples: [py(
      "db06-savepoint-reject-ledger",
      "row별 savepoint와 reject ledger로 부분 수용하기",
      "savepoint_reject_ledger.py",
      "독립 rows라는 명시 정책에서 invalid row만 rollback하고 stable reason과 accepted ids를 기록합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item (item_id INTEGER PRIMARY KEY, quantity INTEGER NOT NULL CHECK (quantity > 0))")
rows = [(1, 2), (2, 0), (3, 4)]
accepted = []
rejected = []

db.execute("BEGIN")
for item_id, quantity in rows:
    db.execute("SAVEPOINT one_row")
    try:
        db.execute("INSERT INTO item VALUES (?, ?)", (item_id, quantity))
        db.execute("RELEASE one_row")
        accepted.append(item_id)
    except sqlite3.IntegrityError:
        db.execute("ROLLBACK TO one_row")
        db.execute("RELEASE one_row")
        rejected.append((item_id, "INVALID_QUANTITY"))
db.commit()

print("accepted=" + ",".join(map(str, accepted)))
print("rejected=" + ",".join(f"{key}:{reason}" for key, reason in rejected))
print("stored=" + ",".join(str(row[0]) for row in db.execute("SELECT item_id FROM item ORDER BY item_id")))
print("committed-count=" + str(db.execute("SELECT COUNT(*) FROM item").fetchone()[0]))
print("policy=independent-rows")`,
      "accepted=1,3\nrejected=2:INVALID_QUANTITY\nstored=1,3\ncommitted-count=2\npolicy=independent-rows",
      ["oracle-savepoint", "mysql-savepoint", "sqlite-transaction", "sqlite-savepoint"],
    )],
    diagnostics: [
      d("item 하나 실패했는데 order header만 남는다.", "aggregate unit of work를 auto-commit 또는 catch-and-continue로 쪼갰습니다.", ["transaction begin/commit과 connection identity를 봅니다.", "exception handler가 rollback을 삼켰는지 확인합니다.", "orphan/empty orders를 집계합니다."], "불완전 aggregate를 격리·보상하고 header/items/outbox를 하나의 transaction boundary로 묶습니다.", "failure injection으로 각 statement 뒤 rollback state를 검증합니다."),
      d("row별 savepoint import가 너무 느리다.", "모든 row에 round trip/savepoint를 사용해 batch overhead가 지배합니다.", ["row당 SQL/round trips와 constraint failure rate를 측정합니다.", "client validation/staging 가능성을 봅니다.", "transaction/redo/locks를 확인합니다."], "set-based staging validation과 bounded batches로 전환하고 예외 rows만 별도 처리합니다.", "data quality별 benchmark와 fallback threshold를 둡니다."),
    ],
    expertNotes: ["부분 성공은 기술 편의가 아니라 product/API contract이며 caller가 재시도할 최소 단위를 알아야 합니다.", "long transaction은 connection/lock/undo와 recovery 비용을 키우므로 checkpoint가 business consistency를 깨지 않는 범위를 찾습니다."],
  },
  {
    id: "jdbc-batch-update-counts",
    title: "JDBC batch의 update counts·BatchUpdateException·driver rewrite를 검증합니다",
    lead: "addBatch/executeBatch는 multi-row SQL과 같지 않고, 실패 뒤 반환 배열과 계속 실행 여부는 driver/database 설정을 확인해야 합니다.",
    explanations: [
      "JDBC Statement/PreparedStatement batch는 commands를 모아 executeBatch 또는 executeLargeBatch로 실행합니다. 반환 update counts는 성공 행 수, SUCCESS_NO_INFO, EXECUTE_FAILED 같은 결과를 포함할 수 있고 BatchUpdateException에서 실패 전/후 counts가 제공될 수 있습니다. array position을 input correlation과 연결합니다.",
      "driver의 batch rewrite는 여러 prepared statements를 하나의 multi-value statement로 바꿀 수 있어 generated keys, error position, packet size와 atomicity 관찰이 달라집니다. connector version과 properties를 manifest로 기록하고 enabled/disabled 양쪽에서 acceptance tests를 실행합니다.",
      "batch exception을 catch하고 transaction을 commit하면 성공 subset이 남을 수 있습니다. 업무가 all-or-nothing이면 connection autoCommit=false, rollback과 retry boundary를 명시합니다. 독립 rows면 update counts만 믿지 않고 correlation key로 actual committed state를 reconciliation합니다.",
      "PreparedStatement는 SQL injection을 줄이고 type binding을 명확히 하지만 dynamic table/column identifier는 placeholder로 bind할 수 없습니다. identifier는 code allowlist/known statement로 선택하고 values만 parameters로 전달합니다.",
    ],
    concepts: [
      c("batch update count", "JDBC batch 각 command의 실행 결과를 같은 order로 나타내는 count/status 배열입니다.", ["SUCCESS_NO_INFO·EXECUTE_FAILED를 처리합니다.", "commit 여부와 함께 해석합니다."]),
      c("driver rewrite", "connector가 여러 batched commands를 server에 더 효율적인 statement 형태로 변환하는 최적화입니다.", ["semantic equivalence를 test합니다.", "keys/errors/limits가 달라질 수 있습니다."]),
    ],
    diagnostics: [
      d("executeBatch 예외 뒤 일부 rows만 남았지만 API는 전체 실패로 응답했다.", "update counts와 transaction commit state를 보존하지 않고 blind retry했습니다.", ["BatchUpdateException counts를 입력과 map합니다.", "autoCommit/rollback을 확인합니다.", "idempotency keys로 actual rows를 조회합니다."], "새 write를 idempotent하게 만들고 authoritative reconciliation 후 업무 정책대로 전체 rollback 또는 partial result를 반환합니다.", "mixed failure와 network loss를 exact driver versions에서 test합니다."),
      d("driver upgrade 후 generated keys 순서가 달라진다.", "batch rewrite/key-return behavior를 stable 표준으로 가정했습니다.", ["old/new connector properties와 release notes를 봅니다.", "wire SQL와 returned keys/counts를 synthetic ids에 map합니다.", "multi-row triggers/defaults를 확인합니다."], "position arithmetic을 제거하고 RETURNING/correlation token 또는 verified driver contract로 mapping합니다.", "connector upgrade gate에 batch keys/errors matrix를 둡니다."),
    ],
    expertNotes: ["executeLargeBatch는 large counts overflow를 줄이지만 application 자료형과 downstream metrics도 long 범위를 유지해야 합니다.", "JDBC spec·JDK API와 vendor connector 문서를 구분해 portable guarantees와 extensions를 따로 기록합니다."],
  },
  {
    id: "idempotent-insert-conflict",
    title: "중복 retry를 idempotency key와 명시적 conflict policy로 처리합니다",
    lead: "timeout 후 같은 요청을 다시 보내는 것은 흔한 정상 동작이므로 새 surrogate id가 생겼다는 이유만으로 별도 주문을 만들면 안 됩니다.",
    explanations: [
      "idempotency key는 tenant/user, operation type과 key의 composite UNIQUE로 scope를 강제합니다. request canonical payload fingerprint, state(IN_PROGRESS/COMPLETED/FAILED), result entity id와 response metadata를 저장해 같은 key·같은 payload는 기존 outcome을 반환합니다.",
      "같은 key에 다른 payload가 오면 조용히 기존 결과를 반환하지 않고 conflict로 알립니다. attacker가 key를 추측해 다른 사용자의 결과를 읽지 않도록 authorization scope와 unguessable client key, response ownership을 확인합니다.",
      "MySQL INSERT ... ON DUPLICATE KEY UPDATE, INSERT IGNORE, SQLite conflict clauses, Oracle MERGE는 서로 다른 semantics와 hazards가 있습니다. 어떤 unique key가 conflict target인지, update columns/version predicate와 triggers/affected count를 정의하지 않은 broad upsert를 피합니다.",
      "in-progress worker가 crash하면 lease/heartbeat와 takeover policy가 필요합니다. external side effect는 outbox를 통해 commit과 연결하고 consumer도 event id를 deduplicate합니다. idempotency row만 만들어놓고 실제 operation과 다른 transaction에서 commit하지 않습니다.",
    ],
    concepts: [
      c("idempotent create", "같은 logical create retry가 side effect 하나와 같은 결과 identity를 만드는 계약입니다.", ["scoped unique key가 필요합니다.", "ambiguous success를 조회로 복구합니다."]),
      c("conflict target", "upsert/duplicate 처리의 기준이 되는 named unique key 또는 columns입니다.", ["의도하지 않은 unique violation과 구분합니다.", "update policy를 제한합니다."]),
    ],
    codeExamples: [py(
      "db06-idempotent-insert",
      "같은 key·같은 payload retry와 payload conflict 구분",
      "idempotent_insert.py",
      "scoped unique key와 payload fingerprint로 retry는 기존 id를 반환하고 mutation은 거부합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE request (tenant_id INTEGER NOT NULL, idem_key TEXT NOT NULL, payload_hash TEXT NOT NULL, result_id INTEGER NOT NULL, UNIQUE (tenant_id, idem_key))")

def create(tenant_id, key, payload_hash, proposed_id):
    row = db.execute("SELECT payload_hash, result_id FROM request WHERE tenant_id=? AND idem_key=?", (tenant_id, key)).fetchone()
    if row is not None:
        return ("REPLAY", row[1]) if row[0] == payload_hash else ("CONFLICT", None)
    db.execute("INSERT INTO request VALUES (?, ?, ?, ?)", (tenant_id, key, payload_hash, proposed_id))
    return "CREATED", proposed_id

first = create(7, "req-001", "hash-A", 101)
retry = create(7, "req-001", "hash-A", 999)
changed = create(7, "req-001", "hash-B", 102)

print("first=" + f"{first[0]}:{first[1]}")
print("retry=" + f"{retry[0]}:{retry[1]}")
print("changed=" + changed[0])
print("stored-count=" + str(db.execute("SELECT COUNT(*) FROM request").fetchone()[0]))
print("same-result=" + str(first[1] == retry[1]).lower())`,
      "first=CREATED:101\nretry=REPLAY:101\nchanged=CONFLICT\nstored-count=1\nsame-result=true",
      ["mysql-insert-on-duplicate", "sqlite-conflict", "oracle-merge", "mysql-insert"],
    )],
    diagnostics: [
      d("client timeout 재시도마다 주문 id가 새로 생긴다.", "transport request를 새 business operation으로 처리하고 scoped idempotency constraint가 없습니다.", ["same client key/payload와 created rows를 추적합니다.", "commit-response loss 시점을 봅니다.", "external payment/events 중복을 확인합니다."], "중복 side effects를 격리·보상하고 entity/outbox와 같은 transaction의 idempotency record를 도입합니다.", "commit 후 response loss를 주입하는 end-to-end test를 둡니다."),
      d("ON DUPLICATE KEY UPDATE가 예상치 않은 unique constraint에서도 row를 바꾼다.", "conflict target과 update precondition을 특정하지 않은 broad upsert를 사용했습니다.", ["모든 unique indexes와 실제 충돌 name을 봅니다.", "updated columns/triggers/affected count를 확인합니다.", "concurrent version을 추적합니다."], "명시 key lookup+conditional update 또는 target-specific syntax로 좁히고 optimistic version을 적용합니다.", "각 unique constraint 충돌을 별도 negative fixture로 둡니다."),
    ],
    expertNotes: ["idempotency retention은 client retry horizon·법적 보존·storage/privacy cost와 조율합니다.", "payload canonicalization/version이 바뀌면 동일 요청 fingerprint가 달라질 수 있어 algorithm version을 record에 포함합니다."],
  },
  {
    id: "staging-validation-bulk-load",
    title: "대량 입력은 staging→검증→promotion→reconciliation으로 나눕니다",
    lead: "production table에 바로 INSERT IGNORE하는 대신 원본 provenance를 가진 staging에서 schema·domain·reference 오류를 set-based로 분류합니다.",
    explanations: [
      "staging table은 source file/run id, source row number, raw-safe fields, parsed canonical fields와 validation status/reason을 보존합니다. raw payload에 secrets/PII가 있으면 access·encryption·retention을 제한하고 학습/로그에 복제하지 않습니다.",
      "type parse, required/null, range, duplicate-within-file, duplicate-against-target와 foreign reference를 set-based queries로 검사합니다. reject reason은 stable category와 bounded detail로 저장하고 raw DB message를 사용자에게 노출하지 않습니다.",
      "promotion은 valid rows만 bounded transaction으로 target에 넣고 idempotency/correlation key를 유지합니다. validation과 promotion 사이 target이 변할 수 있으므로 target constraints를 최종 판정자로 두고 conflict를 reclassify합니다.",
      "완료 조건은 input=count(valid)+count(rejected), promoted/duplicate/failed/unknown 합계와 target checksum/references가 맞는 것입니다. resume checkpoint는 immutable run/row identity를 사용하고 file offset만 믿지 않습니다.",
    ],
    concepts: [
      c("staging table", "외부 batch data를 target domain에 적용하기 전에 provenance와 validation state로 격리하는 저장 영역입니다.", ["target constraints를 대체하지 않습니다.", "retention·access owner가 필요합니다."]),
      c("promotion", "validated staging rows를 authoritative target에 transactionally 적용하는 단계입니다.", ["idempotent checkpoint를 사용합니다.", "concurrent target conflicts를 다시 판정합니다."]),
    ],
    codeExamples: [py(
      "db06-staging-reconciliation",
      "staging rows를 valid/reject로 분류하고 합계 맞추기",
      "staging_reconciliation.py",
      "required·range·duplicate를 stable reason으로 분류하고 valid rows만 target으로 promotion합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE target (external_key TEXT PRIMARY KEY, amount INTEGER NOT NULL CHECK (amount > 0))")
db.execute("CREATE TABLE staging (row_no INTEGER PRIMARY KEY, external_key TEXT, amount INTEGER)")
db.executemany("INSERT INTO staging VALUES (?, ?, ?)", [(1, "A", 10), (2, "", 20), (3, "B", 0), (4, "A", 30), (5, "C", 40)])

seen = set()
accepted = []
rejected = []
for row_no, key, amount in db.execute("SELECT row_no, external_key, amount FROM staging ORDER BY row_no"):
    reason = "MISSING_KEY" if not key else "INVALID_AMOUNT" if amount is None or amount <= 0 else "DUPLICATE_KEY" if key in seen else None
    if reason:
        rejected.append((row_no, reason))
    else:
        seen.add(key)
        db.execute("INSERT INTO target VALUES (?, ?)", (key, amount))
        accepted.append(row_no)

total = db.execute("SELECT COUNT(*) FROM staging").fetchone()[0]
print("accepted=" + ",".join(map(str, accepted)))
print("rejected=" + ",".join(f"{row}:{reason}" for row, reason in rejected))
print("target=" + ";".join(f"{key}:{amount}" for key, amount in db.execute("SELECT external_key, amount FROM target ORDER BY external_key")))
print("reconciled=" + str(total == len(accepted) + len(rejected)).lower())
print("input-count=" + str(total))`,
      "accepted=1,5\nrejected=2:MISSING_KEY,3:INVALID_AMOUNT,4:DUPLICATE_KEY\ntarget=A:10;C:40\nreconciled=true\ninput-count=5",
      ["mysql-insert-select", "oracle-insert", "oracle-error-logging", "sqlite-insert"],
    )],
    diagnostics: [
      d("INSERT IGNORE 후 몇 rows가 왜 빠졌는지 알 수 없다.", "warning/error categories와 source row correlation 없이 errors를 success로 축약했습니다.", ["requested/affected/warning counts를 확인합니다.", "source row keys와 target constraints를 비교합니다.", "truncation/coercion까지 검사합니다."], "원본을 staging에 재적재하고 stable validation/reject ledger로 reconciliation한 뒤 valid rows만 promote합니다.", "무시 계열 syntax 사용에는 row-level audit와 count invariant를 요구합니다."),
      d("import 재시작이 이미 처리한 rows를 다시 넣는다.", "checkpoint가 file offset/process memory뿐이고 target idempotency key가 없습니다.", ["run id/source row identity를 확인합니다.", "target unique/correlation key를 봅니다.", "partial commit boundaries를 재구성합니다."], "immutable run+row key와 target UNIQUE를 사용해 resume가 existing outcome을 읽도록 합니다.", "kill/restart chaos test와 input-output reconciliation을 둡니다."),
    ],
    expertNotes: ["staging은 quarantine과 달리 정상 promotion 전 pipeline 단계이며 reject rows의 owner/SLA를 명시합니다.", "COPY/loader direct path는 trigger/constraint/logging behavior가 달라질 수 있어 production target acceptance를 별도로 검증합니다."],
  },
  {
    id: "injection-binding-data-safety",
    title: "Prepared statements·allowlist·최소 data로 INSERT 경계를 보호합니다",
    lead: "문자열 연결로 VALUES를 만들면 quote escaping 문제가 아니라 SQL code와 data의 경계 자체가 사라집니다.",
    explanations: [
      "모든 user-controlled values는 PreparedStatement/parameter binding으로 전달합니다. 여러 rows도 placeholders와 batch binding을 사용하고 문자열 escape 함수를 직접 만들지 않습니다. parameterization은 type coercion·length/range validation과 authorization을 자동 제공하지 않으므로 field schema를 별도로 적용합니다.",
      "table/column/sort identifiers는 placeholders로 bind할 수 없으므로 raw input을 SQL에 넣지 않고 code-defined statement 또는 allowlist enum으로 선택합니다. multi-tenant table 이름을 문자열로 조립하기보다 tenant column+row-level authorization 또는 검증된 routing을 사용합니다.",
      "password·token·API key·민감 개인정보를 sample INSERT, SQL history, application logs, APM bind capture와 dead-letter queue에 남기지 않습니다. secret은 목적에 맞는 password hashing/encryption/token vault를 사용하고 synthetic `.test` values로 교육·검증합니다.",
      "mass assignment는 DTO의 모든 fields를 자동 column에 bind해 role/status/owner 같은 server-controlled columns를 client가 바꾸는 문제입니다. command별 allowed fields와 authenticated owner context를 명시하고 server-owned values를 DB default/policy로 공급합니다.",
    ],
    concepts: [
      c("parameter binding", "SQL structure와 data value를 분리해 driver가 typed protocol로 전달하는 방식입니다.", ["injection 방어의 기본입니다.", "validation·authorization은 별도로 필요합니다."]),
      c("mass assignment", "client object의 fields를 허용 목록 없이 persistence columns에 자동 반영해 보호 필드가 변경되는 취약점입니다.", ["command DTO와 allowlist를 사용합니다.", "owner/role/status는 server가 결정합니다."]),
    ],
    diagnostics: [
      d("이름에 작은따옴표가 들어가면 INSERT 오류 또는 injection이 발생한다.", "SQL 문자열에 input을 concatenate하고 수동 escaping에 의존했습니다.", ["query builder와 actual SQL structure를 확인합니다.", "prepared bind 사용 여부를 봅니다.", "identifier dynamic input도 추적합니다."], "known SQL+parameter binding으로 전환하고 identifiers는 allowlist로 선택합니다.", "SQL injection corpus와 quote/Unicode/property tests를 둡니다."),
      d("회원 생성 API가 client가 보낸 role=ADMIN을 저장한다.", "generic entity binding이 server-controlled columns까지 mass assignment했습니다.", ["request DTO와 persistence mapping을 비교합니다.", "owner/role/status source를 추적합니다.", "영향 accounts/audit를 조사합니다."], "권한을 회수·복구하고 create command allowlist와 server-owned role/default policy를 적용합니다.", "forbidden fields negative API tests와 audit alert를 둡니다."),
    ],
    expertNotes: ["PreparedStatement SQL 자체를 logs에 남길 때도 table/operation allowlist와 retention을 검토하고 bind values는 기본 off/redacted로 둡니다.", "DB account에는 필요한 INSERT/SELECT 범위만 부여하고 DDL·다른 tenants/schema 접근을 분리합니다."],
  },
  {
    id: "observability-recovery-contract",
    title: "영향 행 수·catalog·audit·backup restore로 INSERT 운영을 닫습니다",
    lead: "성공률 100%라는 지표도 실제 요청 수, committed rows, duplicates, rejects와 unknown outcomes를 분리하지 않으면 신뢰할 수 없습니다.",
    explanations: [
      "write metrics는 operation, release, statement/batch size, attempted/committed/rejected/replayed/unknown counts, latency와 safe error category를 기록합니다. row values·SQL text·idempotency key 전체는 high-cardinality와 privacy 때문에 label/log에 넣지 않습니다.",
      "catalog drift check는 target columns/types/defaults/generated/constraints/indexes와 grants를 application manifest와 비교합니다. writer deploy 전에 old/new schema compatibility를 test하고 partial migration instance를 fleet-wide로 탐지합니다.",
      "audit는 누가 어떤 authorized operation을 언제 요청했고 stable entity/result id·trace id·outcome이 무엇인지 남기되 before/after PII와 secret payload를 과도하게 복제하지 않습니다. legal/security owner와 tamper resistance·retention·access를 결정합니다.",
      "backup restore acceptance는 row count만 보지 않고 constraints/defaults/identity state/grants, idempotency records, parent-child references와 새 insert·duplicate·rollback tests를 실행합니다. restore 시 allocator가 뒤로 가는 위험은 이전 세션 high-water 절차로 검증합니다.",
    ],
    concepts: [
      c("write reconciliation", "input requests와 authoritative committed/rejected/replayed/unknown outputs의 합계·mapping을 맞추는 검증입니다.", ["timeout과 partial batch를 포함합니다.", "correlation key와 stable category를 사용합니다."]),
      c("write-path drift", "application mapping, actual schema/constraints/grants와 기대 write contract가 다른 상태입니다.", ["fleet catalog diff로 탐지합니다.", "migration/application compatibility를 함께 봅니다."]),
    ],
    diagnostics: [
      d("dashboard success 100%인데 target row 수가 요청보다 적다.", "IGNORE/upsert replay/reject/unknown을 모두 HTTP/driver success로 집계했습니다.", ["attempted/affected/warning/replay counts를 분해합니다.", "idempotency records와 target rows를 reconciliation합니다.", "batch partial failures와 async queue를 봅니다."], "metric taxonomy를 committed/replayed/rejected/unknown으로 바꾸고 불일치 rows를 안전하게 재처리합니다.", "각 release에서 count invariant와 synthetic canary writes를 검증합니다."),
      d("restore 후 insert는 되지만 constraints/defaults가 다르다.", "restore acceptance가 data rows만 확인하고 schema objects/grants를 누락했습니다.", ["expected/actual catalog manifest를 diff합니다.", "negative fixtures와 defaults/generated keys를 실행합니다.", "migration history와 backup scope를 확인합니다."], "격리 상태에서 schema objects를 복구하고 invariant violations를 repair한 뒤 acceptance를 재실행합니다.", "restore drill에 catalog diff와 positive/negative write suite를 포함합니다."),
    ],
    expertNotes: ["unknown outcome은 실패나 성공으로 임의 분류하지 않고 idempotent lookup/reconciliation queue와 SLA를 둡니다.", "canary insert는 production business data를 만들지 않는 owned tenant/schema와 guaranteed cleanup·alert suppression을 사용합니다."],
  },
  {
    id: "portable-insert-matrix",
    title: "MySQL·Oracle·SQLite 문법과 오류 의미를 portability matrix로 격리합니다",
    lead: "INSERT라는 공통 이름 아래 multi-row VALUES, RETURNING, IGNORE/upsert, empty string와 error logging 지원이 다르므로 lowest-common-denominator 추측을 피합니다.",
    explanations: [
      "portable domain repository는 createOne/createMany/idempotentCreate 같은 intent를 표현하고 dialect adapter가 SQL을 책임집니다. application 곳곳에 vendor conditional string을 흩뿌리지 않고 capability matrix와 integration test로 격리합니다.",
      "MySQL 8.4의 multi-row INSERT·ON DUPLICATE KEY UPDATE·IGNORE, Oracle 26ai INSERT/multitable insert·RETURNING/error logging, SQLite INSERT/conflict clauses는 같은 단어라도 conflict target, trigger, generated keys, affected counts와 atomicity가 다릅니다. 사용하지 않는 기능까지 억지로 공통화하지 않습니다.",
      "오류 code는 SQLState 표준 class와 vendor code/name을 internal taxonomy로 번역합니다. raw message exact match를 portability test로 쓰지 않고 duplicate/not-null/fk/check/deadlock/timeout 같은 stable outcomes를 검증합니다.",
      "교육용 SQLite memory test는 빠른 domain feedback을 주지만 MySQL/Oracle charset, decimal/date, lock/isolation, generated keys, statement limits와 execution plan을 증명하지 못합니다. release 전 실제 target containers/isolated schemas에서 같은 fixtures를 실행합니다.",
    ],
    concepts: [
      c("capability matrix", "target DB/driver versions별 지원 syntax와 observed semantics를 비교한 versioned 표입니다.", ["required/optional capability를 표시합니다.", "integration test evidence와 연결합니다."]),
      c("dialect adapter", "domain write intent를 target-specific SQL·binding·error mapping으로 구현하는 경계입니다.", ["vendor syntax를 한 곳에 격리합니다.", "공통 API가 차이를 숨기지 않게 합니다."]),
    ],
    diagnostics: [
      d("SQLite unit tests는 통과하지만 Oracle insert가 배포에서 실패한다.", "SQLite syntax/type/empty-string/generated-key behavior를 production vendor와 동일하다고 가정했습니다.", ["실제 failing SQL/binds를 safe하게 확인합니다.", "capability matrix와 target integration coverage를 봅니다.", "dialect adapter 선택을 확인합니다."], "target-specific adapter를 고치고 Oracle isolated contract suite에 regression fixture를 추가합니다.", "모든 supported DB/driver version을 release matrix에서 실행합니다."),
      d("vendor 교체 뒤 duplicate error가 500으로 바뀐다.", "error mapping이 이전 vendor message/code에 hard-code되어 stable taxonomy를 거치지 않았습니다.", ["SQLState/vendor/constraint name을 비교합니다.", "exception wrapping chain을 봅니다.", "API contract tests를 실행합니다."], "adapter가 새 vendor error를 동일 domain category로 번역하고 unknown은 safe internal error로 처리합니다.", "vendor별 negative fixtures와 unmapped-code alert를 둡니다."),
    ],
    expertNotes: ["portability는 모든 DB에서 동일 SQL 문자열을 쓰는 목표가 아니라 domain invariant와 API outcome을 동일하게 유지하는 목표입니다.", "DB/driver patch upgrade도 behavior drift 가능성이 있으므로 capability evidence에 exact versions와 dates를 남깁니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0121", repository: "local dbstudy snapshot", path: "dbstudy/01_21.sql", usedFor: ["members/members2 single·multi-row insert·defaults baseline"], evidence: "CREATE TABLE 3, INSERT 3, multi-value shapes 2를 read-only로 계수했습니다. sample values와 credential-like fields는 복제하지 않았습니다." },
  { id: "local-db-0127", repository: "local dbstudy snapshot", path: "dbstudy/01_27.sql", usedFor: ["book·customer·orders column-list/omitted-column/multi-row DML baseline"], evidence: "INSERT 10과 여러 column-list/multi-value forms를 read-only로 확인했습니다. 개인·연락처 sample values는 공개하지 않았습니다." },
  { id: "mysql-insert", repository: "MySQL 8.4 Reference Manual", path: "INSERT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/insert.html", usedFor: ["single/multi-row INSERT·defaults·errors"], evidence: "MySQL INSERT 공식 문서입니다." },
  { id: "mysql-insert-optimization", repository: "MySQL 8.4 Reference Manual", path: "Optimizing INSERT Statements", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/insert-optimization.html", usedFor: ["multi-row throughput·bulk trade-off"], evidence: "MySQL INSERT 최적화 공식 문서입니다." },
  { id: "mysql-insert-on-duplicate", repository: "MySQL 8.4 Reference Manual", path: "INSERT ON DUPLICATE KEY UPDATE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html", usedFor: ["upsert conflict semantics"], evidence: "MySQL upsert 공식 문서입니다." },
  { id: "mysql-insert-select", repository: "MySQL 8.4 Reference Manual", path: "INSERT SELECT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/insert-select.html", usedFor: ["staging promotion·set-based insert"], evidence: "MySQL INSERT SELECT 공식 문서입니다." },
  { id: "mysql-savepoint", repository: "MySQL 8.4 Reference Manual", path: "SAVEPOINT, ROLLBACK TO SAVEPOINT, RELEASE SAVEPOINT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/savepoint.html", usedFor: ["partial row rollback"], evidence: "MySQL savepoint 공식 문서입니다." },
  { id: "oracle-insert", repository: "Oracle AI Database 26ai SQL Language Reference", path: "INSERT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/INSERT.html", usedFor: ["Oracle insert·returning·multitable portability"], evidence: "Oracle INSERT 공식 문서입니다." },
  { id: "oracle-merge", repository: "Oracle AI Database 26ai SQL Language Reference", path: "MERGE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/MERGE.html", usedFor: ["Oracle conditional insert/update comparison"], evidence: "Oracle MERGE 공식 문서입니다." },
  { id: "oracle-savepoint", repository: "Oracle AI Database 26ai SQL Language Reference", path: "SAVEPOINT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SAVEPOINT.html", usedFor: ["Oracle partial rollback"], evidence: "Oracle SAVEPOINT 공식 문서입니다." },
  { id: "oracle-error-logging", repository: "Oracle AI Database 26ai PL/SQL Packages and Types Reference", path: "DBMS_ERRLOG", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/DBMS_ERRLOG.html", usedFor: ["bulk DML error logging comparison"], evidence: "Oracle DML error logging package 공식 문서입니다." },
  { id: "jdbc-statement", repository: "Java SE 21 API", path: "java.sql.Statement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html", usedFor: ["executeBatch update counts"], evidence: "JDBC Statement 공식 JDK API입니다." },
  { id: "jdbc-batch-exception", repository: "Java SE 21 API", path: "java.sql.BatchUpdateException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/BatchUpdateException.html", usedFor: ["partial batch failure counts"], evidence: "JDBC batch exception 공식 JDK API입니다." },
  { id: "sqlite-insert", repository: "SQLite Documentation", path: "INSERT", publicUrl: "https://www.sqlite.org/lang_insert.html", usedFor: ["exact memory INSERT examples"], evidence: "SQLite INSERT 공식 문서입니다." },
  { id: "sqlite-conflict", repository: "SQLite Documentation", path: "ON CONFLICT", publicUrl: "https://www.sqlite.org/lang_conflict.html", usedFor: ["conflict policy exact boundary"], evidence: "SQLite conflict 공식 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["exact transaction atomicity"], evidence: "SQLite transaction 공식 문서입니다." },
  { id: "sqlite-savepoint", repository: "SQLite Documentation", path: "SAVEPOINT", publicUrl: "https://www.sqlite.org/lang_savepoint.html", usedFor: ["exact partial rollback"], evidence: "SQLite savepoint 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-06-insert-multirow-integrity",
  slug: "db-06-insert-multirow-integrity",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 6,
  title: "INSERT 단건·다건과 제약조건 실패 읽기",
  subtitle: "column list와 VALUES를 넘어 원자성·오류 분류·batch·savepoint·idempotency·staging·복구까지 write path를 검증합니다.",
  level: "입문",
  estimatedMinutes: 840,
  coreQuestion: "한 건 또는 수백 건을 넣을 때 어떤 값이 실제 commit됐고 왜 거부됐으며, timeout·retry·부분 실패 뒤에도 중복과 데이터 손실 없이 어떻게 증명할까요?",
  summary: "dbstudy/01_21.sql의 members/members2 single·multi-row INSERT와 01_27.sql의 book·customer·orders 전체/명시 column list·생략/default forms를 모두 read-only로 감사합니다. explicit column/bind mapping, omitted·DEFAULT·NULL·generated values, single statement와 driver batch atomicity, named constraint/SQLState domain translation, transaction/savepoint policy, JDBC update counts와 rewrite, idempotent create/upsert, staging validation/promotion, prepared statements와 mass assignment 방어, write reconciliation·catalog/restore, MySQL·Oracle·SQLite portability matrix를 연결합니다. 다섯 Python sqlite3 examples는 default mapping, all-or-nothing multi-row failure, row savepoint reject ledger, idempotent replay와 staging reconciliation을 exact output으로 검증합니다.",
  objectives: [
    "target column list와 bind mapping을 schema version에 안전한 write contract로 작성한다.",
    "생략·DEFAULT·명시 NULL·empty·generated value의 의미와 owner를 구분한다.",
    "multi-row statement, JDBC batch와 transaction의 atomicity·partial success를 구분한다.",
    "constraint error를 SQLState·constraint name으로 stable domain category에 번역한다.",
    "unit of work에 따라 전체 rollback 또는 savepoint/reject-ledger 부분 수용을 설계한다.",
    "timeout·retry를 scoped idempotency key와 authoritative reconciliation으로 복구한다.",
    "대량 입력을 staging·set validation·bounded promotion·checkpoint로 운영한다.",
    "parameter binding·field allowlist·privacy-safe telemetry·restore acceptance를 적용한다.",
  ],
  prerequisites: [{ title: "AUTO_INCREMENT와 Oracle SEQUENCE", reason: "INSERT가 생성한 key와 retry mapping을 먼저 이해해야 합니다.", sessionSlug: "db-05-auto-increment-sequence-portability" }],
  keywords: ["INSERT", "column list", "multi-row VALUES", "DEFAULT", "NULL", "constraint violation", "SQLState", "transaction", "SAVEPOINT", "JDBC batch", "BatchUpdateException", "idempotency", "staging", "PreparedStatement", "reconciliation"],
  topics,
  lab: {
    title: "회원·주문 batch를 retry-safe staging pipeline으로 재설계하기",
    scenario: "CSV/API에서 회원과 주문을 단건·다건으로 적재합니다. 일부 rows는 missing·duplicate·orphan·range 오류가 있고 network timeout과 process restart가 발생해도 같은 주문은 한 번만 만들어져야 합니다.",
    setup: ["01_21/01_27 schema shapes를 synthetic fields로 재구성하고 원본 sample values는 사용하지 않습니다.", "MySQL 8.4·Oracle 26ai·exact JDBC connectors의 isolated schemas를 준비합니다.", "input마다 immutable run id·row number·tenant-scoped idempotency key를 부여합니다.", "expected catalog/error taxonomy/count invariant와 cleanup owner를 정의합니다."],
    steps: [
      "table 순서 의존 INSERT를 explicit column list와 typed parameters로 바꿉니다.",
      "absent/default/null/empty/generated ownership을 field별 truth table로 작성합니다.",
      "single/multi-row statement와 JDBC batch의 update-count/atomicity matrix를 실행합니다.",
      "duplicate/null/fk/check failures를 named constraint→stable domain category로 mapping합니다.",
      "주문 aggregate는 전체 rollback, 독립 import rows는 staging/reject ledger 정책을 적용합니다.",
      "same key/same payload retry는 existing result, changed payload는 conflict가 되게 UNIQUE를 둡니다.",
      "staging에서 parse/required/range/within-file/target-duplicate/orphan을 set-based로 분류합니다.",
      "valid rows만 bounded promotion하고 requested=committed+replayed+rejected+unknown을 맞춥니다.",
      "connection loss·driver batch partial failure·process restart를 주입해 resume/reconciliation을 검증합니다.",
      "catalog·metrics·privacy logs와 backup restore 뒤 positive/negative first-write suite를 readback합니다.",
    ],
    expectedResult: ["column/bind mapping과 stored canonical values가 writer versions에서 같습니다.", "aggregate는 부분 row를 남기지 않고 독립 import는 reject reason과 accepted rows가 정확히 합계됩니다.", "retry는 side effect 하나와 같은 generated result id를 유지합니다.", "vendor별 오류가 동일 stable domain category로 번역되고 raw SQL/value가 노출되지 않습니다.", "restore 뒤 constraints/defaults/identity/idempotency와 새 insert contract가 모두 통과합니다."],
    cleanup: ["격리 schema·staging runs·synthetic rows만 owned run id로 제거합니다.", "temporary DB credentials/grants를 revoke하고 connector test resources를 종료합니다.", "reject/audit/APM에 secrets·raw PII가 없는지 검사합니다.", "production rows·identity values·원본 SQL files는 변경하지 않습니다."],
    extensions: ["million-row adaptive batch size와 replica lag backpressure를 benchmark합니다.", "outbox relay/consumer dedup까지 end-to-end ambiguous success를 주입합니다.", "multi-tenant authorization과 row-level security write path를 설계합니다.", "zero-downtime schema expand/contract에서 old/new INSERT compatibility를 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 다시 실행하고 각 예제의 commit 단위와 count invariant를 표로 만드세요.", requirements: ["stdout 완전 일치를 확인합니다.", "column mapping/default를 검증합니다.", "multi-row all-or-nothing을 설명합니다.", "savepoint 부분 수용이 독립 rows에만 적합함을 설명합니다.", "idempotency replay와 payload conflict를 구분합니다.", "staging input=accepted+rejected를 맞춥니다."], hints: ["SQL 성공 여부와 최종 committed state를 별도 열로 적으세요."], expectedOutcome: "INSERT 결과를 exception 하나가 아니라 row mapping·transaction·reconciliation으로 판정합니다.", solutionOutline: ["prepare→execute→classify→commit/rollback→readback→reconcile 순서입니다."] },
    { difficulty: "응용", prompt: "원본 members·book·customer·orders inserts를 안전한 application repository로 재설계하세요.", requirements: ["두 원본 files의 실제 insert shapes를 보존·감사합니다.", "모든 statements에 column list/parameters를 씁니다.", "default/null/generated ownership을 정의합니다.", "constraint error mapping을 만듭니다.", "JDBC batch partial failure를 처리합니다.", "idempotency/outbox를 같은 transaction에 둡니다.", "PII/secret logging을 차단합니다.", "vendor integration tests를 포함합니다."], hints: ["sample password/연락처를 교재나 test output에 복제하지 마세요."], expectedOutcome: "단건·다건·retry에서 동일한 무결성과 safe error contract를 가진 write layer가 완성됩니다.", solutionOutline: ["source audit→write contract→constraints/errors→transactions→retry→observability 순서입니다."] },
    { difficulty: "설계", prompt: "조직 표준 bulk ingestion/runbook을 작성하세요.", requirements: ["staging provenance와 privacy retention을 정의합니다.", "set-based validation/reject taxonomy를 만듭니다.", "promotion transaction/batch budget을 정합니다.", "idempotent resume/checkpoint를 설계합니다.", "driver/vendor capability matrix를 포함합니다.", "attempted/committed/replayed/rejected/unknown reconciliation을 정의합니다.", "failure injection과 rollback/restore를 rehearsal합니다.", "security authorization·least privilege·audit를 포함합니다."], hints: ["INSERT IGNORE의 warning count를 성공으로 지우지 마세요."], expectedOutcome: "부분 실패와 재시작에서도 누락·중복·정보 노출 없이 운영 가능한 ingestion 표준이 완성됩니다.", solutionOutline: ["ingest→stage→validate→promote→reconcile→observe→recover 순서입니다."] },
  ],
  nextSessions: ["db-07-copy-alter-drop-schema-evolution"],
  sources,
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "dbstudy/01_21.sql은 CREATE TABLE 3·INSERT 3·multi-value shapes 2, 01_27.sql은 INSERT 10과 다양한 column-list/omitted forms를 read-only로 확인했습니다.",
      "원본 sample data에는 개인·연락처·credential-like 값이 있을 수 있어 statement shape와 counts만 사용하고 교재/예제/output에는 synthetic values만 넣었습니다.",
      "원본은 transaction atomicity, SQLState/domain errors, JDBC batch partial counts, idempotency, staging reconciliation·restore를 충분히 다루지 않아 공식 문서와 owned examples로 보완했습니다.",
      "SQLite exact examples는 MySQL 8.4·Oracle 26ai의 dialect·locking·driver semantics를 대체하지 않으며 별도 vendor acceptance가 필요합니다.",
    ],
  },
});

export default session;
