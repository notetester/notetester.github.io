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
      { lines: `1-${first}`, explanation: "sqlite3 메모리 DB와 합성 key로 procedure가 받아야 할 input·state를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "SQLite에 native stored procedure가 없음을 전제로 Python 함수가 IN/OUT/result-set/transaction/idempotency 계약만 의미론적으로 재현합니다." },
      { lines: `${second + 1}-${lineCount}`, explanation: "정렬된 ids, typed output, rollback state와 replay 여부처럼 deterministic evidence만 출력합니다. 실제 CALL/privilege/handler는 MySQL·Oracle integration matrix에서 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "이 harness는 stored routine engine, JDBC CallableStatement, definer rights나 server transaction semantics를 대신하지 않습니다."] },
    experiments: [
      { change: "NULL·경계값·중복 retry와 중간 statement failure를 추가합니다.", prediction: "validation·atomicity·idempotency 계약이 빠진 구현은 partial write 또는 다른 output을 냅니다.", result: "호출 전후 canonical rows, output envelope와 audit state를 비교합니다." },
      { change: "동일 contract를 MySQL 8.4 CALL과 Oracle PL/SQL/JDBC에서 실행합니다.", prediction: "OUT registration, result-set iteration, error/transaction/privilege에 승인된 차이가 나타납니다.", result: "engine/driver version, bound types, SQLSTATE/vendor code, commits와 readback을 evidence로 남깁니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "procedure-command-boundary",
    title: "저장 프로시저를 호출 가능한 명령 계약으로 정의합니다",
    lead: "프로시저는 SQL 여러 줄을 저장한 편의 기능을 넘어 입력·출력·권한·transaction·오류를 하나의 database command boundary로 묶습니다.",
    explanations: [
      "원본 dbstudy 02_04.sql은 DELIMITER를 바꿔 SP_CUSTOMER_ALL을 생성하고 CALL하며, 고객·도서별 조회, 주문 추가/삭제와 총매출 OUT으로 단계적으로 확장합니다. 이 세션은 object progression을 보존하되 원본 sample 고객·주문 값은 복사하지 않고 synthetic key만 사용합니다.",
      "DELIMITER는 mysql client가 compound body 내부 semicolon을 서버에 보내기 전에 문장을 자르지 않도록 하는 client-side 지시어입니다. stored procedure 문법 자체가 아니므로 migration tool/JDBC에서 그대로 보내면 오류가 날 수 있습니다.",
      "command contract에는 qualified name/version, IN/OUT/INOUT name·type·null/range, result sets 순서와 schema, affected business entities, transaction ownership, retry/idempotency, SQLSTATE/vendor errors, security mode와 latency budget을 기록합니다.",
      "조회 SELECT 하나는 prepared query가 더 투명할 수 있고, 복수 DML invariant나 privilege encapsulation은 procedure가 유용할 수 있습니다. 모든 SQL을 procedure로 옮기는 것이 목표가 아니라 change boundary와 ownership이 명확한지 판단합니다.",
      "CALL 성공은 business 성공과 같지 않습니다. returned status, OUT values, result sets, affected rows와 committed state를 함께 readback하고, warning이나 swallowed exception이 없는지 diagnostics area를 확인합니다.",
    ],
    concepts: [
      c("stored procedure", "database catalog에 저장되고 CALL 또는 engine-specific invocation으로 실행되는 named subprogram입니다.", ["여러 SQL/flow control을 가질 수 있습니다.", "function과 반환/호출 위치가 다릅니다."]),
      c("client delimiter", "compound statement를 전송하는 client parser의 statement terminator 설정입니다.", ["서버 SQL grammar와 구분합니다.", "배포 도구별 처리 방식을 확인합니다."]),
      c("command contract", "입력·출력·state transition·error·transaction·security·retry의 공개 약속입니다.", ["routine body보다 넓습니다.", "consumer/owner/version을 가집니다."]),
    ],
    diagnostics: [
      d("Workbench에서는 생성되지만 migration runner에서 DELIMITER syntax error가 납니다.", "client directive를 server SQL로 전송했습니다.", ["runner statement splitter", "raw transmitted SQL", "driver multi-query option", "body delimiter handling"], "도구가 지원하는 migration syntax/statement API로 compound DDL을 한 단위로 전송합니다.", "실제 deployment runner로 clean-schema create/drop rehearsal를 CI에 둡니다."),
      d("CALL은 성공했지만 기대한 state가 없습니다.", "return transport 성공만 보고 affected rows·OUT·commit/readback을 확인하지 않았습니다.", ["warnings/diagnostics", "OUT/result sets", "transaction owner", "canonical state query"], "명시적 success envelope와 committed-state readback을 acceptance에 포함합니다.", "호출 결과와 business invariant를 분리한 contract test를 둡니다."),
    ],
    expertNotes: ["routine name은 구현 동사가 아니라 business command와 version을 드러내고 fully qualified하게 호출합니다.", "DDL script와 application invocation test는 서로 다른 parser/driver를 지나므로 둘 다 검증합니다."],
  },
  {
    id: "in-parameter-validation-binding",
    title: "IN 파라미터를 type·범위·NULL·권한까지 검증해 binding합니다",
    lead: "IN은 읽기 전용 방향이라는 뜻이지 값이 안전하거나 올바른 tenant 범위라는 뜻은 아닙니다.",
    explanations: [
      "parameter 이름은 P_CUSTID처럼 local column과 충돌하지 않게 convention을 두고, SQL에서는 alias-qualified column과 parameter를 구분합니다. 이름 resolution 오해는 `WHERE custid = custid` 같은 전체 행 노출을 만들 수 있습니다.",
      "DB type INT만으로 positive id, allowed status, maximum page size와 tenant ownership이 검증되지는 않습니다. NULL policy, numeric bounds, enum allow-list와 authorization lookup을 routine 시작부에서 검사하고 stable error code로 거부합니다.",
      "application은 값과 SQL을 문자열 연결하지 말고 CallableStatement/driver bind를 사용합니다. parameter index/name, JDBC type, precision/scale, charset/timezone을 routine metadata와 맞추고 null은 setNull/register type을 명시합니다.",
      "optional parameter를 `p IS NULL OR column=p`로 처리하면 plan selectivity가 불안정할 수 있습니다. command를 분리하거나 dynamic SQL을 안전하게 bind하고 representative null/non-null distributions에서 actual plan을 측정합니다.",
      "IN parameter는 호출 로그에 그대로 남기기 쉽습니다. 이름·주소·token·자유 입력을 routine telemetry에서 제외하고 request id, synthetic entity key, validation class와 count만 최소 수집합니다.",
    ],
    concepts: [
      c("IN parameter", "호출자가 routine에 전달하고 routine이 입력으로 읽는 parameter 방향입니다.", ["초기값이 필요합니다.", "validation/authorization이 별도입니다."]),
      c("parameter shadowing", "parameter/local variable와 column 이름이 겹쳐 의도와 다른 name resolution이 발생하는 위험입니다.", ["prefix와 table alias를 씁니다.", "full-row fixtures로 잡습니다."]),
      c("typed binding", "driver가 값과 자료형을 SQL text와 분리해 server에 전달하는 호출 방식입니다.", ["injection을 줄입니다.", "precision/null/timezone을 검증합니다."]),
    ],
    codeExamples: [py("db10-in-filter-contract", "IN key 검증과 parameterized 조회", "db10_in_filter.py", "procedure 의미를 함수로 모델링해 positive integer IN만 허용하고 tenant 범위에서 정렬된 학습 ids를 반환합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson(id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, title TEXT NOT NULL)")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?)", [(1, 10, "SQL"), (2, 20, "Java"), (3, 10, "View")])
def lessons_by_tenant(p_tenant_id):
    if type(p_tenant_id) is not int or p_tenant_id <= 0:
        raise ValueError("tenant-id-invalid")
    return list(db.execute("SELECT id, title FROM lesson WHERE tenant_id = ? ORDER BY id", (p_tenant_id,)))
rows = lessons_by_tenant(10)
print("ids=" + ",".join(str(row[0]) for row in rows))
print("titles=" + ",".join(row[1] for row in rows))
try:
    lessons_by_tenant(0)
except ValueError as error:
    print("rejected=" + str(error))
print("other-tenant-visible=" + str(any(row[0] == 2 for row in rows)).lower())`, "ids=1,3\ntitles=SQL,View\nrejected=tenant-id-invalid\nother-tenant-visible=false", ["local-0204", "mysql-create-routine", "mysql-call", "oracle-subprogram-parameters", "jdbc-callable-statement"])],
    diagnostics: [
      d("특정 고객 procedure가 모든 행을 반환합니다.", "parameter와 column이 같은 이름이라 predicate 양쪽이 column으로 resolve됐습니다.", ["routine SHOW CREATE/source", "qualified aliases", "parameter/local names", "two-key fixture"], "p_ prefix와 table alias를 사용하고 서로 다른 tenant keys로 negative assertion을 둡니다.", "static lint와 multi-tenant full-row leakage test를 적용합니다."),
      d("NULL 호출이 전체 scan 후 timeout입니다.", "optional predicate와 NULL policy가 불명확해 non-sargable OR plan이 선택됐습니다.", ["bound null type", "actual plan null/non-null", "rows examined", "contract default"], "NULL을 거부하거나 별도 routine/query shape로 분리하고 각 plan을 budget으로 관리합니다.", "parameter class별 plan/latency regression을 둡니다."),
    ],
    expertNotes: ["IN 값의 유효성과 호출자의 entity 권한은 별개 검사입니다.", "parameter metadata는 source DDL, driver bind code와 generated API contract에서 한 정의로 관리합니다."],
  },
  {
    id: "out-inout-scalar-contract",
    title: "OUT·INOUT을 초기값·단일 대입·type-safe 결과 계약으로 만듭니다",
    lead: "OUT은 함수 return의 대체 문법이 아니라 호출 transport를 통해 이름 붙은 여러 scalar를 전달하는 별도 계약입니다.",
    explanations: [
      "MySQL CALL에서 OUT/INOUT은 보통 user variable 또는 driver registered parameter로 받습니다. Oracle parameter mode와 copy/value semantics는 다를 수 있으므로 동일한 호출 코드라고 가정하지 않습니다.",
      "OUT은 모든 정상·empty·handled-error path에서 정확히 대입되어야 합니다. 이전 session variable 값이 남아 성공처럼 보이지 않게 초기값과 status를 명확히 하고, `SUM` no-row의 NULL과 business zero를 구분합니다.",
      "INOUT은 입력 state를 받아 변경 결과를 돌려주지만 hidden mutation과 retry 혼란을 키울 수 있습니다. accumulator 같은 명확한 경우가 아니면 separate IN request와 OUT response가 더 설명 가능합니다.",
      "money total은 INT보다 DECIMAL precision/scale과 currency가 필요하고 count는 overflow 범위를 고려합니다. driver registerOutParameter type과 DB declared type이 일치하는지 min/max/NULL/rounding fixtures로 확인합니다.",
      "여러 OUT은 positional 의미가 깨지기 쉽습니다. stable names, status/error와 payload separation, versioned response record/result set을 고려하고 old driver가 새 OUT을 처리할 수 있는지 검증합니다.",
    ],
    concepts: [
      c("OUT parameter", "routine이 값을 대입하고 호출자에게 전달하는 output 방향입니다.", ["모든 exit path에서 정의해야 합니다.", "driver registration이 필요할 수 있습니다."]),
      c("INOUT parameter", "호출자가 초기값을 주고 routine이 변경한 값을 다시 반환하는 양방향 parameter입니다.", ["retry semantics를 명시합니다.", "hidden accumulator를 피합니다."]),
      c("output envelope", "status·typed scalar·warnings·version을 일관된 구조로 표현한 결과 계약입니다.", ["transport success와 business result를 구분합니다.", "old/new consumer compatibility를 관리합니다."]),
    ],
    codeExamples: [py("db10-out-aggregate", "OUT aggregate의 zero·count·scale 계약", "db10_out_aggregate.py", "합성 구매 대신 학습 점수를 집계해 OUT record가 no-row에서도 완전하게 대입되는 의미를 검증합니다.", String.raw`import sqlite3
from decimal import Decimal

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE score(learner_key TEXT, points INTEGER NOT NULL)")
db.executemany("INSERT INTO score VALUES (?, ?)", [("L-01", 10), ("L-01", 25), ("L-02", 8)])
def score_summary(p_learner_key):
    count, total = db.execute("SELECT count(*), coalesce(sum(points), 0) FROM score WHERE learner_key = ?", (p_learner_key,)).fetchone()
    average = (Decimal(total) / Decimal(count)).quantize(Decimal("0.00")) if count else Decimal("0.00")
    return {"count": count, "total": total, "average": average}
for key in ("L-01", "L-99"):
    out = score_summary(key)
    print(f"{key}=count:{out['count']}|total:{out['total']}|average:{out['average']}")
print("all-assigned=true")`, "L-01=count:2|total:35|average:17.50\nL-99=count:0|total:0|average:0.00\nall-assigned=true", ["local-0204", "mysql-create-routine", "mysql-call", "mysql-select-into", "oracle-subprogram-parameters", "jdbc-callable-statement"])],
    diagnostics: [
      d("no-row 호출에서 OUT이 이전 호출 값으로 남습니다.", "empty/handler exit path가 OUT에 대입하지 않았거나 session variable 재사용을 오해했습니다.", ["모든 RETURN/handler path", "initial user variable", "SELECT INTO no-row behavior", "driver wasNull"], "entry에서 safe default를 정하고 각 exit path가 status와 output을 대입하도록 구조화합니다.", "empty/error/repeated-call sequence test를 둡니다."),
      d("총액 OUT이 큰 데이터에서 음수 또는 반올림됩니다.", "INT/driver type 또는 DECIMAL scale이 contract 범위를 수용하지 못합니다.", ["declared precision/scale", "aggregate promotion", "registerOutParameter", "max fixture"], "업무 범위를 포함하는 DECIMAL과 명시적 rounding/currency를 사용합니다.", "boundary/overflow/rounding conformance를 엔진·driver별 실행합니다."),
    ],
    expertNotes: ["OUT 수가 늘어나면 named result record/result set이 더 versionable한지 검토합니다.", "OUT 값과 committed state가 같은 transaction outcome을 설명하는지 readback합니다."],
  },
  {
    id: "ordered-result-sets-driver-consumption",
    title: "복수 result set의 순서·schema·affected count를 driver 계약으로 고정합니다",
    lead: "프로시저 안의 SELECT는 화면 출력이 아니라 호출자에게 전달되는 result set이며 여러 SELECT와 DML count가 섞이면 소비 순서가 API가 됩니다.",
    explanations: [
      "첫 SELECT가 summary, 두 번째가 details라면 result set index, column names/types/order, cardinality와 empty behavior를 문서화합니다. routine에 debug SELECT를 추가하는 순간 production consumer의 next result가 밀릴 수 있습니다.",
      "JDBC CallableStatement.execute 이후 getResultSet, getUpdateCount와 getMoreResults를 종료 sentinel까지 반복해야 합니다. OUT 값을 읽는 시점과 server/driver buffering requirements도 vendor별로 확인합니다.",
      "result set이 큰 경우 network buffering, fetch size, connection hold와 transaction lifetime을 관리합니다. procedure가 여러 unrelated lists를 한 번에 반환하면 partial consumption과 memory pressure가 생기므로 endpoint 책임을 다시 분리합니다.",
      "column alias와 type은 SELECT expression 추론에 맡기지 않고 명시합니다. result set v2에 열을 추가할 때 positional mappers와 generated clients가 호환되는지 real driver contract test를 실행합니다.",
      "debugging은 result set에 print SELECT를 삽입하지 말고 diagnostics area, structured audit table 또는 trace context를 사용합니다. 민감 parameter/row values는 관측 payload에서 제외합니다.",
    ],
    concepts: [
      c("result-set sequence", "CALL이 반환하는 result sets와 update counts의 순서 있는 stream입니다.", ["순서가 계약입니다.", "종료까지 소비합니다."]),
      c("result schema", "각 result set의 column name/type/nullability/order와 row grain입니다.", ["alias/cast로 고정합니다.", "driver metadata를 readback합니다."]),
      c("driver consumption loop", "result set과 update count를 getMoreResults 등으로 끝까지 순회하는 client 동작입니다.", ["connection reuse에 필요합니다.", "vendor behavior를 검증합니다."]),
    ],
    codeExamples: [py("db10-result-set-sequence", "summary와 detail result set의 명시적 순서", "db10_result_sets.py", "native procedure 대신 ordered result channels를 모델링해 schema와 empty behavior를 정확히 고정합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson(id INTEGER PRIMARY KEY, course_key TEXT, title TEXT)")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?)", [(1, "C-SQL", "Select"), (2, "C-SQL", "View"), (3, "C-JAVA", "Class")])
def course_results(p_course_key):
    summary = db.execute("SELECT ? AS course_key, count(*) AS lesson_count FROM lesson WHERE course_key = ?", (p_course_key, p_course_key)).fetchall()
    details = db.execute("SELECT id AS lesson_id, title FROM lesson WHERE course_key = ? ORDER BY id", (p_course_key,)).fetchall()
    return [("summary", ("course_key", "lesson_count"), summary), ("details", ("lesson_id", "title"), details)]
for index, (name, columns, rows) in enumerate(course_results("C-SQL"), 1):
    print(f"set{index}={name}|columns=" + ",".join(columns) + f"|rows={len(rows)}")
    for row in rows:
        print("row=" + "|".join(map(str, row)))
print("sequence-complete=true")`, "set1=summary|columns=course_key,lesson_count|rows=1\nrow=C-SQL|2\nset2=details|columns=lesson_id,title|rows=2\nrow=1|Select\nrow=2|View\nsequence-complete=true", ["mysql-call", "mysql-create-routine", "jdbc-callable-statement", "oracle-create-procedure"])],
    diagnostics: [
      d("첫 result만 읽은 뒤 다음 pooled 호출이 protocol 오류입니다.", "driver result/update-count stream을 끝까지 소비하거나 닫지 않았습니다.", ["getMoreResults loop", "update counts", "ResultSet close", "driver buffering docs"], "종료 sentinel까지 소비·close하고 large results에는 explicit fetch/timeout 정책을 둡니다.", "복수/empty/update-count fixtures와 pool reuse test를 둡니다."),
      d("debug SELECT 추가 뒤 client가 detail을 summary로 parse합니다.", "result set sequence를 비호환하게 바꿨습니다.", ["routine diff", "result index/schema", "client mapper", "unexpected result count"], "debug output을 별도 telemetry로 옮기고 result contract 변경은 새 routine version으로 배포합니다.", "exact result count/order/schema contract test를 둡니다."),
    ],
    expertNotes: ["result set 한 개의 row grain과 result sets 사이 consistency snapshot을 모두 명시합니다.", "많은 result sets는 round trip을 줄일 수 있지만 coupling과 memory를 늘리므로 workload evidence로 선택합니다."],
  },
  {
    id: "transaction-ownership-atomicity",
    title: "프로시저와 호출자 사이 transaction ownership을 하나로 정합니다",
    lead: "routine 안의 COMMIT은 편리해 보여도 호출자가 더 큰 unit of work를 rollback할 권리를 빼앗을 수 있습니다.",
    explanations: [
      "procedure가 transaction을 시작·commit하는 self-contained command인지, caller transaction에 참여하는 composable unit인지 계약합니다. 두 모델을 섞으면 nested call, connection autocommit과 retry에서 partial commit이 생깁니다.",
      "MySQL stored program에서 transaction statements와 implicit commit DDL 제한을 공식 문서로 확인합니다. Oracle transaction control과 exception propagation도 별도 matrix로 검증하며, procedure/function/trigger 허용 범위를 같은 것으로 보지 않습니다.",
      "여러 DML은 business invariant 기준으로 atomic해야 합니다. 잔액/이력, 주문/포인트 같은 paired state는 중간 failure를 주입하고 호출 전 상태로 완전히 돌아오는지 canonical key/count/sum으로 확인합니다.",
      "SAVEPOINT는 부분 복구를 도울 수 있지만 outer caller savepoint 이름과 충돌하거나 routine이 예상 밖 rollback을 할 수 있습니다. 내부 이름 convention과 ownership을 정하고 보상 transaction과 혼동하지 않습니다.",
      "lock order, isolation, deadlock victim과 timeout은 contract의 failure mode입니다. retry 가능 여부는 idempotency와 함께 판단하고 transaction을 result-set streaming 동안 불필요하게 오래 유지하지 않습니다.",
    ],
    concepts: [
      c("transaction owner", "BEGIN/COMMIT/ROLLBACK과 retry unit을 결정하는 한 계층입니다.", ["caller 또는 procedure 중 하나를 명시합니다.", "nested composition을 고려합니다."]),
      c("atomic invariant", "routine의 모든 state transition이 전부 보이거나 전부 보이지 않아야 하는 업무 규칙입니다.", ["중간 failure로 검증합니다.", "affected rows만 보지 않습니다."]),
      c("savepoint", "transaction 전체를 끝내지 않고 일부 작업 지점으로 rollback할 수 있는 marker입니다.", ["outer transaction은 유지됩니다.", "name/lifecycle을 관리합니다."]),
    ],
    codeExamples: [py("db10-transaction-rollback", "중간 실패에서 전체 command rollback", "db10_transaction.py", "두 table을 갱신하는 command에서 두 번째 constraint failure를 주입해 첫 write도 남지 않는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE learner(id INTEGER PRIMARY KEY, credits INTEGER NOT NULL CHECK(credits >= 0))")
db.execute("CREATE TABLE credit_log(id INTEGER PRIMARY KEY, learner_id INTEGER, delta INTEGER NOT NULL CHECK(delta <> 0))")
db.execute("INSERT INTO learner VALUES (1, 10)")
db.commit()
try:
    with db:
        db.execute("UPDATE learner SET credits = credits + 5 WHERE id = 1")
        db.execute("INSERT INTO credit_log VALUES (1, 1, 0)")
except sqlite3.IntegrityError as error:
    print("error=" + str(error))
credits = db.execute("SELECT credits FROM learner WHERE id = 1").fetchone()[0]
logs = db.execute("SELECT count(*) FROM credit_log").fetchone()[0]
print("credits=" + str(credits))
print("log-count=" + str(logs))
print("atomic=" + str(credits == 10 and logs == 0).lower())`, "error=CHECK constraint failed: delta <> 0\ncredits=10\nlog-count=0\natomic=true", ["mysql-transaction", "mysql-stored-restrictions", "sqlite-transaction", "sqlite-savepoint", "oracle-error-handling"])],
    diagnostics: [
      d("procedure 실패 뒤 첫 table 변경만 남습니다.", "autocommit 또는 내부 COMMIT이 atomic boundary를 둘로 나눴습니다.", ["connection autocommit", "routine transaction statements", "implicit commit DDL", "exception handler rollback"], "한 transaction owner 아래 DML만 두고 injected failure에서 전체 state를 readback합니다.", "statement-by-statement fault injection과 invariant reconciliation을 둡니다."),
      d("outer service rollback이 procedure 변경을 되돌리지 못합니다.", "procedure가 독자적으로 COMMIT해 caller composition을 깨뜨렸습니다.", ["routine source", "nested call path", "autocommit/session state", "documented owner"], "composable procedure에서는 transaction control을 caller에 두거나 self-contained command임을 API로 분리합니다.", "outer rollback integration test와 transaction-lint rule을 둡니다."),
    ],
    expertNotes: ["transaction boundary는 SQL body가 아니라 business command와 retry boundary가 만나는 곳에 둡니다.", "오류를 handler가 삼켜도 transaction이 rollback-only인지, OUT status와 state가 일치하는지 확인합니다."],
  },
  {
    id: "condition-errors-diagnostics",
    title: "조건 handler·SQLSTATE·예외 전파를 안정적인 실패 계약으로 만듭니다",
    lead: "모든 오류를 `status=0`으로 바꾸면 호출자는 retry·수정·alert 중 무엇을 해야 하는지 알 수 없고 원인도 잃습니다.",
    explanations: [
      "expected validation/not-found/conflict와 unexpected database failure를 분류합니다. business error에는 stable application code와 safe message를 주고, SQLSTATE/vendor code는 내부 diagnostics와 correlation id에 보존합니다.",
      "MySQL DECLARE CONDITION/HANDLER, GET DIAGNOSTICS, SIGNAL/RESIGNAL의 scope와 CONTINUE/EXIT 동작을 확인합니다. handler가 OUT을 채운 뒤 계속 실행해 추가 DML을 하는지, RESIGNAL이 원래 context를 보존하는지 fault injection으로 검증합니다.",
      "Oracle exception handler와 raise/application error semantics는 별도입니다. portable contract는 error class와 transaction outcome을 정의하고 engine adapter가 native codes를 매핑합니다.",
      "not found는 SELECT INTO no row, cursor end와 business entity missing에서 의미가 다릅니다. 넓은 NOT FOUND handler가 정상 loop 종료와 required lookup failure를 같은 것으로 처리하지 않게 scope를 좁힙니다.",
      "오류 message에 parameter, dynamic SQL, table row를 그대로 넣지 않습니다. caller에는 safe code, 운영 log에는 최소 context와 stack/cause chain을 남기고 access/retention을 통제합니다.",
    ],
    concepts: [
      c("condition handler", "특정 SQLSTATE/condition class가 발생했을 때 실행할 stored program 제어 흐름입니다.", ["CONTINUE/EXIT scope를 가집니다.", "transaction 결과를 명시합니다."]),
      c("RESIGNAL", "현재 처리 중인 condition을 보존하거나 보강해 상위 호출자에게 다시 전달하는 동작입니다.", ["원인 손실을 줄입니다.", "safe message를 유지합니다."]),
      c("error taxonomy", "validation·not-found·conflict·transient·permanent·internal을 호출자 행동에 맞춰 나눈 분류입니다.", ["stable application code를 가집니다.", "native code mapping을 보존합니다."]),
    ],
    diagnostics: [
      d("duplicate key인데 procedure가 성공 status를 반환합니다.", "CONTINUE handler가 오류를 삼키고 success OUT을 덮어썼습니다.", ["handler order/scope", "OUT assignment paths", "affected rows", "transaction state"], "expected conflict만 명시적으로 map하고 나머지는 RESIGNAL하며 success는 마지막 invariant 확인 뒤 설정합니다.", "각 constraint/deadlock/timeout fault injection과 exact error mapping test를 둡니다."),
      d("운영 로그에 전체 SQL과 민감 input이 노출됩니다.", "diagnostics를 안전한 code로 변환하지 않고 message/text를 그대로 기록했습니다.", ["log fields", "SQL parameter capture", "caller response", "access/retention"], "correlation id, routine version, error class/native code와 synthetic key만 allow-list logging합니다.", "PII/secret pattern scan과 log contract review를 배포 gate에 둡니다."),
    ],
    expertNotes: ["오류 contract에는 state가 committed, rolled back, unknown 중 무엇인지 포함합니다.", "retryable 분류는 error code만이 아니라 idempotency와 transaction outcome evidence를 함께 봅니다."],
  },
  {
    id: "routine-privilege-security",
    title: "EXECUTE와 base 권한을 분리하고 definer/invoker privilege closure를 검증합니다",
    lead: "procedure는 좁은 명령만 허용하는 privilege boundary가 될 수 있지만 강한 definer와 dynamic SQL은 더 큰 공격면도 만듭니다.",
    explanations: [
      "consumer에게 base INSERT/DELETE를 주지 않고 procedure EXECUTE만 주면 validation과 audit를 강제할 수 있습니다. 하지만 routine owner가 가진 권한 중 body가 실제로 필요한 object/action만 direct grant합니다.",
      "MySQL SQL SECURITY DEFINER/INVOKER와 routine privilege, automatic grant behavior를 공식 문서로 확인합니다. Oracle AUTHID DEFINER/CURRENT_USER, roles와 direct privileges는 같은 단어로 단순 치환하지 않습니다.",
      "dynamic SQL의 object name은 value bind로 처리할 수 없습니다. allow-listed identifiers와 fixed statement templates를 사용하고 caller input이 schema/table/ORDER BY text로 연결되지 않게 합니다.",
      "definer account drop/rename, password expiry와 restore 환경은 orphan routine을 만들 수 있습니다. immutable deployment owner, orphan scan과 clean-room restore에서 create→grant→execute negative/positive readback을 수행합니다.",
      "authorization은 procedure entry만 검사하고 nested helper가 다른 tenant key를 받아 우회할 수 있습니다. effective principal/tenant context가 모든 base access predicate에 닫혀 있는 privilege closure를 threat-model합니다.",
    ],
    concepts: [
      c("EXECUTE privilege", "사용자가 routine을 호출할 수 있게 하는 object privilege입니다.", ["base table privilege와 분리할 수 있습니다.", "output/side effects를 review합니다."]),
      c("routine security context", "body의 name resolution과 object privilege를 definer 또는 invoker 문맥으로 검사하는 모델입니다.", ["engine별 의미가 다릅니다.", "nested calls를 포함합니다."]),
      c("privilege encapsulation", "base 권한 대신 검증된 좁은 procedure command만 노출하는 설계입니다.", ["owner 최소 권한이 필요합니다.", "dynamic SQL을 제한합니다."]),
    ],
    diagnostics: [
      d("EXECUTE만 가진 사용자가 임의 table을 수정합니다.", "dynamic identifier를 caller input으로 연결했고 definer가 광범위한 DML 권한을 가졌습니다.", ["routine source/dynamic SQL", "definer grants", "identifier allow-list", "audit target objects"], "fixed statement와 object allow-list를 사용하고 dedicated owner grant를 command 대상에만 제한합니다.", "unauthorized identifier/tenant negative tests와 privilege diff scan을 둡니다."),
      d("새 환경에서 routine 호출만 access denied입니다.", "definer/direct grants/EXECUTE grant의 생성 순서가 복원되지 않았습니다.", ["definer existence", "SHOW grants", "base direct privileges", "consumer EXECUTE"], "environment owner를 먼저 만들고 base direct grants→routine→EXECUTE 순으로 배포·readback합니다.", "empty-environment restore rehearsal와 orphan-definer alert를 둡니다."),
    ],
    expertNotes: ["EXECUTE surface마다 가능한 base state transition을 inventory하고 generic admin procedure를 피합니다.", "권한 테스트는 admin 계정이 아니라 최소 소비자 identity의 실제 connection으로 실행합니다."],
  },
  {
    id: "idempotency-retry-concurrency",
    title: "idempotency key와 unique claim으로 안전한 retry를 설계합니다",
    lead: "network timeout 뒤 응답을 못 받았다고 procedure가 실행되지 않은 것은 아니므로 write command는 unknown outcome에서 재호출을 견뎌야 합니다.",
    explanations: [
      "caller-generated idempotency key를 tenant+operation 범위 unique로 claim하고 request fingerprint와 completed response를 저장합니다. 같은 key·같은 request는 이전 결과를 재생하고 같은 key·다른 request는 conflict로 거부합니다.",
      "`SELECT then INSERT`는 concurrent calls가 모두 없음으로 판단하는 race가 있습니다. unique constraint/atomic insert를 arbitration point로 사용하고 loser가 committed result를 읽거나 pending/failed 상태를 처리합니다.",
      "transaction에는 idempotency record와 business writes를 함께 넣어야 합니다. claim만 commit되고 write가 rollback되거나 반대이면 retry state가 거짓이 됩니다. long-running work는 explicit state machine과 lease/recovery를 설계합니다.",
      "deadlock/serialization/connection loss는 retry candidate지만 transaction outcome이 unknown일 수 있습니다. key 없이 자동 retry하지 않고 max attempts, jitter, timeout budget과 permanent error 분류를 둡니다.",
      "response replay에는 OUT/result set schema version과 authorization 재검사가 필요합니다. 다른 principal이 key를 추측해 결과를 읽지 못하게 scope를 principal/tenant에 묶고 retention을 제한합니다.",
    ],
    concepts: [
      c("idempotency key", "동일 logical command의 재시도를 식별하는 caller-generated unique token입니다.", ["tenant/operation 범위가 필요합니다.", "request fingerprint와 묶습니다."]),
      c("atomic claim", "동시 호출 중 하나만 command key를 소유하도록 unique constraint로 결정하는 write입니다.", ["check-then-act race를 막습니다.", "state machine을 가질 수 있습니다."]),
      c("unknown outcome", "caller가 timeout/disconnect 때문에 commit 여부를 알 수 없는 상태입니다.", ["중복 실행 가능성을 가정합니다.", "read-by-key/replay가 필요합니다."]),
    ],
    codeExamples: [py("db10-idempotent-command", "같은 key의 exact response replay와 mismatch 거부", "db10_idempotency.py", "idempotency record와 학습 credit write를 한 transaction에 넣고 동일 retry는 중복 없이 재생되는지 검증합니다.", String.raw`import hashlib
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE credit(id INTEGER PRIMARY KEY AUTOINCREMENT, learner_key TEXT, amount INTEGER)")
db.execute("CREATE TABLE command_log(command_key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, credit_id INTEGER NOT NULL)")
def add_credit(command_key, learner_key, amount):
    fingerprint = hashlib.sha256(f"{learner_key}|{amount}".encode()).hexdigest()
    prior = db.execute("SELECT fingerprint, credit_id FROM command_log WHERE command_key = ?", (command_key,)).fetchone()
    if prior:
        if prior[0] != fingerprint:
            raise ValueError("idempotency-mismatch")
        return prior[1], True
    with db:
        credit_id = db.execute("INSERT INTO credit(learner_key, amount) VALUES (?, ?)", (learner_key, amount)).lastrowid
        db.execute("INSERT INTO command_log VALUES (?, ?, ?)", (command_key, fingerprint, credit_id))
    return credit_id, False
for _ in range(2):
    credit_id, replayed = add_credit("CMD-001", "L-01", 5)
    print(f"credit-id={credit_id}|replayed={str(replayed).lower()}")
try:
    add_credit("CMD-001", "L-01", 7)
except ValueError as error:
    print("rejected=" + str(error))
print("credit-count=" + str(db.execute("SELECT count(*) FROM credit").fetchone()[0]))`, "credit-id=1|replayed=false\ncredit-id=1|replayed=true\nrejected=idempotency-mismatch\ncredit-count=1", ["mysql-transaction", "mysql-condition-handling", "sqlite-transaction", "oracle-error-handling"])],
    diagnostics: [
      d("timeout retry 뒤 같은 credit가 두 번 추가됩니다.", "write procedure에 stable idempotency key/unique claim이 없습니다.", ["caller retry log", "commit timestamps", "business duplicate keys", "command record"], "tenant-scoped key와 request fingerprint를 business write와 같은 transaction에서 atomic claim합니다.", "timeout-after-commit fault test와 concurrent same-key test를 둡니다."),
      d("같은 key에 다른 amount가 조용히 이전 결과를 반환합니다.", "key만 비교하고 request fingerprint를 검증하지 않았습니다.", ["stored fingerprint", "canonical request encoding", "principal/tenant scope", "response version"], "canonical request hash mismatch를 conflict로 거부하고 보안 scope를 재검사합니다.", "same-key same/different payload와 cross-tenant negative tests를 둡니다."),
    ],
    expertNotes: ["idempotent는 여러 번 실행해도 row count가 같다는 뜻보다 동일 logical effect와 response를 보장한다는 뜻입니다.", "key/response 보존 기간이 client retry window보다 짧지 않도록 정하되 민감 payload는 저장하지 않습니다."],
  },
  {
    id: "versioned-routine-deployment",
    title: "routine DDL·signature·grants를 versioned하고 무중단 배포합니다",
    lead: "procedure body 교체는 호출 순간의 API와 transaction logic을 바꾸므로 table migration만큼 엄격한 compatibility와 rollback이 필요합니다.",
    explanations: [
      "signature의 parameter 추가·순서·type·mode 변경, result schema/order와 error mapping은 breaking change일 수 있습니다. `sp_command_v2`를 병행하고 supported drivers/clients의 실제 invocation을 모두 테스트합니다.",
      "CREATE OR REPLACE 지원과 routine ALTER 범위는 engine마다 다릅니다. MySQL에서는 drop/create가 필요한 변경에서 잠시 object 부재, grants와 prepared metadata가 어떻게 되는지 deployment tool로 확인합니다.",
      "expand-contract는 helper/table 선배포→v2 routine create/grants→synthetic smoke/negative/fault/readback→canary callers→usage drain→v1 revoke/drop 순서입니다. 한 migration에 destructive base DDL까지 묶지 않습니다.",
      "definition source, normalized SHOW/source hash, definer/security mode, sql_mode/charset, grants와 dependency version을 artifact로 보존합니다. source DDL만 같아도 environment modes가 다르면 behavior가 달라질 수 있습니다.",
      "rollback은 previous routine과 grants 재생성, base backward compatibility, idempotency records와 in-flight calls를 포함합니다. long-running CALL 중 replace/drop의 lock/behavior를 staging concurrency에서 확인합니다.",
    ],
    concepts: [
      c("signature compatibility", "기존 caller가 parameter/result/error contract를 같은 의미로 계속 사용할 수 있는 범위입니다.", ["mode/order/type을 포함합니다.", "driver metadata로 검증합니다."]),
      c("routine artifact", "DDL source, definition hash, security context, grants와 test evidence를 묶은 배포 단위입니다.", ["환경 modes를 기록합니다.", "rollback artifact를 함께 보존합니다."]),
      c("canary invocation", "일부 synthetic/low-risk traffic만 새 routine version에 보내 state와 result를 readback하는 단계입니다.", ["idempotency를 사용합니다.", "old version으로 routing rollback이 가능합니다."]),
    ],
    diagnostics: [
      d("body 재배포 뒤 EXECUTE 권한이 사라졌습니다.", "drop/create 과정에서 object grants를 재적용·readback하지 않았습니다.", ["deployment statements", "pre/post grants", "definer", "consumer smoke identity"], "routine artifact에 grants를 포함하고 최소 소비자 connection으로 CALL까지 확인합니다.", "clean schema install/upgrade/rollback grant diff test를 둡니다."),
      d("v2 parameter를 끝에 추가했는데 old positional caller가 실패합니다.", "default/overload/driver support를 확인하지 않고 additive라 판단했습니다.", ["old call text", "parameter metadata/order", "named binding support", "result schema"], "새 qualified routine version을 병행하고 old binaries로 contract suite를 실행합니다.", "지원 client matrix를 deprecation 종료까지 CI에 유지합니다."),
    ],
    expertNotes: ["routine deployment 완료는 DDL 성공이 아니라 grants, signature, CALL result와 committed state readback까지입니다.", "production hotfix는 source artifact로 즉시 capture/reconcile하지 않으면 다음 migration에서 사라집니다."],
  },
  {
    id: "observability-performance-portability",
    title: "CALL의 latency·rows·locks·errors와 엔진 차이를 privacy-safe하게 운영합니다",
    lead: "procedure는 내부 SQL을 숨기므로 관측과 plan evidence가 없으면 느린 statement, lock wait와 결과 drift가 하나의 CALL latency로 뭉개집니다.",
    explanations: [
      "routine version/hash, caller class, correlation/idempotency key hash, duration, outcome/error class, rows read/affected, result counts/bytes, lock/deadlock/retry와 transaction outcome을 기록합니다. raw parameters/result rows는 기본적으로 제외합니다.",
      "statement별 actual plan과 representative parameter classes를 분리합니다. parameter-sensitive selectivity, optional NULL, tenant skew와 statistics change가 routine 전체 p95/p99를 어떻게 만드는지 봅니다.",
      "MySQL·Oracle matrix에는 CREATE/CALL syntax, IN/OUT/INOUT binding, multiple results, rights model, handler/error mapping, transaction control, DDL atomicity, metadata와 driver behavior를 포함합니다. SQLite harness는 native procedure가 없다는 gap을 명시합니다.",
      "timeout은 server query timeout, lock timeout, client socket와 service deadline을 계층적으로 정렬합니다. client가 먼저 끊긴 뒤 server CALL이 계속 commit할 수 있으므로 cancellation과 unknown outcome/idempotency를 함께 테스트합니다.",
      "SLO 초과 시 query/index 최적화 전에 input population, authorization와 business invariant가 동일한지 reconciliation합니다. optimization이 handler/lock order/result order를 바꾸면 semantic release로 취급합니다.",
    ],
    concepts: [
      c("routine telemetry", "한 CALL의 version·outcome·resource·transaction 증거를 민감 값 없이 구조화한 관측입니다.", ["내부 statement와 연결합니다.", "high-cardinality raw values를 피합니다."]),
      c("parameter class", "plan과 cardinality가 유사한 입력 범주입니다.", ["NULL/non-null, small/large tenant를 구분합니다.", "raw 값을 저장하지 않습니다."]),
      c("routine conformance matrix", "engine/driver별 invocation·output·error·transaction·security 계약 결과를 비교한 표입니다.", ["동일 syntax가 목표가 아닙니다.", "approved differences를 version합니다."]),
    ],
    diagnostics: [
      d("CALL p99가 높지만 어느 statement가 원인인지 모릅니다.", "routine-level duration만 있고 statement plan/lock/result metrics가 없습니다.", ["statement digest/plan", "rows/loops", "lock waits", "parameter class/result bytes"], "safe statement identifiers와 resource metrics를 correlation id로 연결하고 representative plans를 capture합니다.", "routine/statement SLO와 plan/lock regression alert를 둡니다."),
      d("SQLite exact test 통과 후 Oracle OUT 호출이 실패합니다.", "semantic harness를 native parameter mode/driver evidence로 오해했습니다.", ["engine/driver versions", "register/bind types", "AUTHID/transaction", "native error/result behavior"], "실제 MySQL/Oracle integration suite에서 contract matrix를 실행하고 SQLite는 작은 state invariant에만 사용합니다.", "지원 engine/driver 조합을 release gate로 유지합니다."),
    ],
    expertNotes: ["procedure abstraction은 내부 SQL 관측을 없애는 이유가 아니라 safe telemetry를 설계할 이유입니다.", "운영 dashboard에는 success rate뿐 아니라 rollback/unknown outcome, replay와 privilege-denied를 분리합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0204", repository: "dbstudy", path: "02_04.sql", usedFor: ["DELIMITER, CREATE PROCEDURE, IN, OUT, CALL, SELECT INTO and DML progression"], evidence: "read-only로 251 logical lines를 확인했으며 sample customer/order literals는 복사하지 않았습니다." },
  { id: "mysql-create-routine", repository: "MySQL 8.4 Reference Manual", path: "CREATE PROCEDURE and CREATE FUNCTION Statements", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-procedure.html", usedFor: ["routine syntax, parameter modes, characteristics and body"], evidence: "MySQL 공식 stored routine DDL 문서입니다." },
  { id: "mysql-call", repository: "MySQL 8.4 Reference Manual", path: "CALL Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/call.html", usedFor: ["OUT/INOUT invocation and result handling"], evidence: "MySQL 공식 CALL 문서입니다." },
  { id: "mysql-routine-privileges", repository: "MySQL 8.4 Reference Manual", path: "Stored Routines and MySQL Privileges", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/stored-routines-privileges.html", usedFor: ["CREATE ROUTINE, ALTER ROUTINE and EXECUTE privileges"], evidence: "MySQL 공식 routine privilege 문서입니다." },
  { id: "mysql-condition-handling", repository: "MySQL 8.4 Reference Manual", path: "Condition Handling", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/condition-handling.html", usedFor: ["conditions, handlers, diagnostics, SIGNAL and RESIGNAL"], evidence: "MySQL 공식 condition handling 문서입니다." },
  { id: "mysql-stored-restrictions", repository: "MySQL 8.4 Reference Manual", path: "Restrictions on Stored Programs", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/stored-program-restrictions.html", usedFor: ["transaction, prepared statement and stored program restrictions"], evidence: "MySQL 공식 stored program restrictions 문서입니다." },
  { id: "mysql-select-into", repository: "MySQL 8.4 Reference Manual", path: "SELECT ... INTO Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select-into.html", usedFor: ["scalar assignment and no-row behavior"], evidence: "MySQL 공식 SELECT INTO 문서입니다." },
  { id: "mysql-transaction", repository: "MySQL 8.4 Reference Manual", path: "START TRANSACTION, COMMIT, and ROLLBACK", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["transaction ownership and atomicity"], evidence: "MySQL 공식 transaction 문서입니다." },
  { id: "mysql-object-security", repository: "MySQL 8.4 Reference Manual", path: "Stored Object Access Control", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/stored-objects-security.html", usedFor: ["definer and invoker rights"], evidence: "MySQL 공식 stored object security 문서입니다." },
  { id: "oracle-create-procedure", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE PROCEDURE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-PROCEDURE.html", usedFor: ["Oracle procedure DDL and editioning"], evidence: "Oracle 공식 CREATE PROCEDURE 문서입니다." },
  { id: "oracle-subprogram-parameters", repository: "Oracle Database 26ai PL/SQL Language Reference", path: "Subprogram Parameters", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/subprogram-parameters.html", usedFor: ["IN, OUT, IN OUT and parameter semantics"], evidence: "Oracle 공식 subprogram parameters 문서입니다." },
  { id: "oracle-error-handling", repository: "Oracle Database 26ai PL/SQL Language Reference", path: "PL/SQL Error Handling", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/plsql-error-handling.html", usedFor: ["exception mapping and propagation"], evidence: "Oracle 공식 PL/SQL error handling 문서입니다." },
  { id: "oracle-rights", repository: "Oracle Database 26ai PL/SQL Language Reference", path: "Invoker's Rights and Definer's Rights", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/invokers-rights-and-definers-rights-authid-property.html", usedFor: ["AUTHID and privilege portability"], evidence: "Oracle 공식 AUTHID 문서입니다." },
  { id: "jdbc-callable-statement", repository: "Java SE 8 API", path: "java.sql.CallableStatement", publicUrl: "https://docs.oracle.com/javase/8/docs/api/java/sql/CallableStatement.html", usedFor: ["typed IN/OUT binding and multiple result consumption"], evidence: "Oracle 공식 Java CallableStatement API 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["exact atomicity and idempotency semantic harness"], evidence: "SQLite 공식 transaction 문서입니다." },
  { id: "sqlite-savepoint", repository: "SQLite Documentation", path: "Savepoints", publicUrl: "https://www.sqlite.org/lang_savepoint.html", usedFor: ["partial rollback model"], evidence: "SQLite 공식 savepoint 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-10-procedure-in-out", slug: "db-10-procedure-in-out", courseId: "database", moduleId: "db-programmability-performance", order: 2,
  title: "저장 프로시저와 IN·OUT 파라미터", subtitle: "CALL 문법을 입력·출력·result set·transaction·error·권한·retry·배포·관측이 검증된 database command로 확장합니다.", level: "고급", estimatedMinutes: 860,
  coreQuestion: "저장 프로시저가 편리한 SQL 묶음을 넘어 데이터 손실·중복 실행·권한 상승·부분 commit 없이 여러 application과 엔진에서 유지되는 명령 계약이 되려면 무엇을 고정해야 할까요?",
  summary: "dbstudy 02_04.sql의 DELIMITER, procedure 생성, IN별 조회, DML, OUT aggregate와 CALL progression을 read-only로 감사합니다. client delimiter와 server DDL, IN validation/binding, OUT·INOUT assignment/type, ordered result sets와 JDBC consumption, transaction ownership/atomicity, condition handler/error taxonomy, EXECUTE와 definer/invoker 최소 권한, idempotency/unknown outcome, signature versioning/deploy/rollback, performance·privacy-safe telemetry와 MySQL·Oracle·SQLite gap을 전문가 수준으로 연결합니다. 다섯 exact Python/SQLite examples는 native procedure를 흉내 내지 않고 IN, OUT, result sequence, rollback과 idempotent retry의 작은 상태 불변식을 실행합니다.",
  objectives: ["procedure를 versioned command contract로 정의하고 delimiter/tool 경계를 설명한다.", "IN의 type/range/NULL/authorization과 typed binding을 검증한다.", "OUT/INOUT assignment·precision·empty/error semantics를 설계한다.", "multiple result sets와 driver consumption loop를 고정한다.", "transaction owner, handler와 committed/rollback/unknown outcome을 증명한다.", "EXECUTE/definer/invoker 최소 권한과 dynamic SQL 위험을 통제한다.", "idempotency, deploy, rollback, plan/SLO와 privacy-safe observability를 운영한다."],
  prerequisites: [{ title: "VIEW로 조회 계약 만들고 갱신 한계 이해하기", reason: "조회 projection·security·write boundary를 알아야 procedure가 맡을 command 책임을 구분할 수 있습니다.", sessionSlug: "db-09-view-abstraction" }],
  keywords: ["PROCEDURE", "DELIMITER", "IN", "OUT", "INOUT", "CALL", "CallableStatement", "result set", "transaction owner", "handler", "SQLSTATE", "EXECUTE", "DEFINER", "idempotency", "deployment", "observability"], topics,
  lab: {
    title: "학습 credit 등록 procedure를 안전한 command v2로 배포하기",
    scenario: "서비스가 learner credit와 audit를 한 번에 등록하고 summary OUT과 detail result를 받습니다. timeout retry, concurrent duplicate, invalid tenant, constraint failure와 old JDBC caller가 존재합니다.",
    setup: ["synthetic tenant/learner/command keys와 zero/max/NULL/duplicate/concurrent/failure fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai 격리 schemas, 최소 EXECUTE users와 supported JDBC drivers를 준비합니다.", "v1/v2 IN/OUT/result/error/transaction/idempotency/security contract를 작성합니다.", "expected base rows, audit, command record, output envelope와 grants를 고정합니다."],
    steps: ["실제 migration runner로 routine DDL을 clean schema에 생성하고 definition hash를 readback합니다.", "valid/NULL/range/cross-tenant IN binding을 low-privilege identity로 실행합니다.", "empty/max/rounding/handled-error path에서 모든 OUT과 result schema를 확인합니다.", "getMoreResults/update-count loop로 모든 result channels를 끝까지 소비하고 pool을 재사용합니다.", "각 DML 사이 failure를 주입해 credit/audit/idempotency가 전부 rollback되는지 확인합니다.", "duplicate/deadlock/timeout을 native code에서 stable taxonomy로 map하고 원인을 보존합니다.", "same-key concurrent/timeout-after-commit retry에서 한 effect와 exact response replay를 검증합니다.", "definer/invoker, direct grants, dynamic identifier와 cross-tenant denied path를 실행합니다.", "v1/v2 canary의 schema/state/latency/plan을 dual-run하고 routing rollback을 rehearsal합니다.", "routine/statement SLO, rows/locks/errors/replay/unknown telemetry와 raw-value 비수집을 readback합니다."],
    expectedResult: ["모든 input class가 명시한 success 또는 stable error로 끝나며 다른 tenant data를 보지 못합니다.", "OUT/result sets는 모든 path에서 typed·ordered·complete하고 driver connection이 재사용됩니다.", "중간 실패는 business/audit/idempotency state를 모두 rollback합니다.", "retry/concurrency에도 command당 정확히 한 effect와 replayable response가 있습니다.", "v2 signature/grants/plans/SLO가 승인되고 v1 rollback이 실제 동작합니다."],
    cleanup: ["격리 routines, grants/users, synthetic tables/command logs와 telemetry fixtures를 제거합니다.", "temporary DB credentials와 exported traces를 revoke·삭제합니다.", "logs에 raw parameters, 원본 이름·주소·전화번호 또는 SQL value가 없는지 검사합니다.", "D:\\dev\\dbstudy\\02_04.sql과 production data는 변경하지 않습니다."],
    extensions: ["batch command의 per-item status와 all-or-nothing/partial-success 계약을 비교합니다.", "outbox와 procedure transaction을 결합해 message delivery를 검증합니다.", "long-running command lease/state machine과 crash recovery를 구현합니다.", "generated client contract와 routine metadata drift detection을 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 IN·OUT·results·transaction·idempotency evidence를 표로 정리하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "invalid IN 거부와 tenant isolation을 설명합니다.", "OUT empty와 precision을 확인합니다.", "result set index/schema를 적습니다.", "failure 뒤 두 table state를 읽습니다.", "same key 두 호출의 response/effect를 비교합니다."], hints: ["호출 성공과 state commit을 같은 칸에 쓰지 마세요."], expectedOutcome: "procedure의 transport와 business command 의미를 분리해 설명합니다.", solutionOutline: ["validate→bind→execute→consume→readback→retry 순서입니다."] },
    { difficulty: "응용", prompt: "원본 주문 추가 procedure 흐름을 synthetic 학습 credit command v2로 재설계하세요.", requirements: ["원본 provenance와 sample 비복사를 기록합니다.", "IN/OUT/result/error schema를 version합니다.", "caller-owned transaction과 fault injection을 둡니다.", "EXECUTE 최소 권한/tenant negative test를 실행합니다.", "idempotency key/fingerprint/atomic claim을 구현합니다.", "JDBC multiple-results/pool reuse를 검증합니다.", "v1/v2 canary/rollback을 rehearsal합니다.", "plan/SLO/privacy-safe telemetry를 포함합니다."], hints: ["응답을 받지 못한 호출도 commit됐을 수 있습니다."], expectedOutcome: "중복·부분 commit·권한 노출 없이 배포 가능한 command가 완성됩니다.", solutionOutline: ["contract→fault/security tests→idempotency→driver matrix→canary→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 stored procedure governance와 engine/driver conformance 표준을 작성하세요.", requirements: ["naming/version/signature/owner 규칙을 둡니다.", "IN validation/OUT assignment/result sequence를 정의합니다.", "transaction owner/error taxonomy/unknown outcome을 요구합니다.", "EXECUTE/definer/invoker/dynamic SQL 정책을 둡니다.", "idempotency/retry/concurrency controls를 정의합니다.", "clean install/upgrade/rollback/grant readback을 요구합니다.", "MySQL·Oracle·JDBC approved differences를 기록합니다.", "SLO/plan/locks/privacy/retirement controls를 포함합니다."], hints: ["DELIMITER는 서버 기능이 아니라 도구 경계입니다."], expectedOutcome: "초급 CALL에서 운영 database command platform까지 일관된 전문가 표준이 완성됩니다.", solutionOutline: ["define→authorize→execute atomically→replay→version→measure→retire 순서입니다."] },
  ],
  nextSessions: ["db-11-stored-function"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_04.sql 251 logical lines(5,670 bytes)을 read-only로 확인했습니다. SHA-256은 B65DEA6AA74E68FFD8EA8365F7BE120D5152B139965EE23DEA71ABC65589E2C8입니다.", "원본의 DELIMITER, CREATE PROCEDURE, IN/OUT, CALL, SELECT INTO와 DML progression만 사용하고 고객·주문 sample literals는 복사하지 않았습니다.", "SQLite에는 native stored procedure가 없으므로 exact examples는 Python function+sqlite3로 input/output/state invariant만 재현하며 MySQL·Oracle routine engine·권한·handler·driver 증거를 대체하지 않습니다.", "MySQL 8.4·Oracle 26ai·JDBC 공식 문서를 primary source로 사용하고 실제 engine/driver conformance를 lab release gate로 명시했습니다."] },
});

export default session;
