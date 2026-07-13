import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(7, lineCount)}`, explanation: "SQLite 메모리 DB와 합성 row만으로 portability invariant를 재현할 최소 schema를 준비합니다." },
      { lines: `${Math.min(8, lineCount)}-${Math.max(8, lineCount - 6)}`, explanation: "identity, default/null, string/date, pagination, upsert/rollback의 공통 의미를 query와 constraint로 검증합니다." },
      { lines: `${Math.max(1, lineCount - 5)}-${lineCount}`, explanation: "stable ids·count·type·boolean과 checksum만 출력합니다. target dialect의 실제 DDL·plan·lock은 별도 matrix에서 검증해야 합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite 결과는 MySQL 8.4·Oracle 26ai의 type, identity, optimizer, transaction과 locking 동작을 대신하지 않습니다."] },
    experiments: [
      { change: "type·default·ordering 또는 uniqueness invariant 하나를 target별 표현으로 바꿉니다.", prediction: "문법만 변환하고 의미 contract를 고정하지 않으면 null, id, 순서 또는 conflict 결과가 달라집니다.", result: "golden rows, catalog metadata와 transaction trace를 두 target에서 비교합니다." },
      { change: "동시 writer, duplicate key 또는 page 경계 삽입을 주입합니다.", prediction: "single-session 테스트에서는 보이지 않던 lost update, duplicate action과 page skip/repeat가 나타납니다.", result: "lock wait/deadlock, final version/count와 stable page ids를 dialect matrix에 기록합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "semantic-type-mapping",
    title: "타입 이름이 아니라 값 domain·정밀도·비교 의미를 이식 계약으로 정의합니다",
    lead: "VARCHAR를 VARCHAR2로 바꾸는 치환표만으로는 숫자 overflow, 문자열 길이, 빈 문자열, 시간대와 정렬 규칙이 보존되었다고 말할 수 없습니다.",
    explanations: [
      "각 column에 business meaning, allowed range, precision/scale, unit, nullability, default, character repertoire, maximum logical length, comparison/collation, time semantics와 serialization format을 적습니다. 이 의미 계약이 MySQL과 Oracle 물리 타입 선택의 입력입니다.",
      "정수는 signed/unsigned 범위, display와 storage를 분리합니다. Oracle NUMBER와 MySQL integer/DECIMAL의 허용 범위가 같지 않을 수 있으므로 source max/min, arithmetic 결과와 overflow rejection을 boundary fixture로 검증합니다.",
      "금액·비율은 binary floating point를 피하고 명시한 decimal precision/scale, rounding mode와 currency/unit을 둡니다. 계산은 DB, application, JSON serialization에서 같은 rule을 사용하며 합계·세금·할인 boundary를 golden result로 비교합니다.",
      "문자열은 character와 byte 길이, Unicode normalization, trailing spaces, case/accent sensitivity와 empty-string 의미를 함께 검토합니다. Oracle 환경의 empty/null 처리와 target collation은 equality·UNIQUE·ORDER BY 결과를 바꿀 수 있습니다.",
      "LOB, JSON, binary, boolean과 temporal type은 단순 저장 가능성보다 index, constraint, function, driver mapping과 migration streaming 비용을 평가합니다. 지원 여부와 의미는 정확한 target version의 catalog/probe로 확정합니다.",
    ],
    concepts: [
      c("semantic type contract", "값 범위·정밀도·null·비교·serialization 의미를 DB 타입과 독립적으로 정의한 계약입니다.", ["문법 매핑보다 먼저 작성합니다.", "boundary fixture를 포함합니다."]),
      c("lossless mapping", "source의 모든 승인 값을 target에서 같은 의미로 저장·읽기·비교할 수 있는 매핑입니다.", ["cast 성공만으로 충분하지 않습니다.", "round-trip을 검증합니다."]),
      c("type probe", "target version에서 catalog, insert boundary, comparison과 driver round-trip을 실행하는 작은 검증입니다.", ["문서와 함께 사용합니다.", "운영 값을 쓰지 않습니다."]),
    ],
    diagnostics: [d("migration은 성공했지만 큰 숫자가 반올림되거나 빈 문자열·Unicode key의 UNIQUE 결과가 달라집니다.", "타입 이름 치환만 수행하고 range, precision, empty/null, normalization과 collation을 계약으로 고정하지 않았습니다.", ["source/target catalog precision", "boundary round-trip rows", "collation/normalization", "driver serialization type"], "write를 중단하고 semantic contract와 rejected-value policy를 만든 뒤 lossless type 또는 explicit transform으로 새 migration을 수행합니다.", "모든 type mapping에 min/max/rounding/null/Unicode golden matrix를 CI로 실행합니다.")],
    expertNotes: ["target이 더 큰 타입을 제공해도 application/driver가 좁은 타입으로 읽으면 lossless가 아닙니다.", "schema default와 application default가 중복되면 시간·timezone·retry에서 서로 다른 값이 생성될 수 있습니다."],
  },
  {
    id: "identity-sequence-and-key-contract",
    title: "AUTO_INCREMENT·identity·sequence를 key 생성과 공개 식별자 계약으로 분리합니다",
    lead: "자동 증가 문법은 row identity를 생성하는 한 방법일 뿐 연속 번호, 생성 순서, commit 순서 또는 외부 공개 가능성을 보장하지 않습니다.",
    explanations: [
      "MySQL AUTO_INCREMENT와 Oracle identity/sequence의 allocation, cache, rollback gap, explicit value, restart와 concurrency 동작을 target version별 probe로 기록합니다. 번호의 gap을 오류로 간주하는 business rule을 surrogate key에 얹지 않습니다.",
      "database-generated id를 application에서 언제 읽는지 정의합니다. single insert, batch, trigger, RETURNING/generated-keys API와 connection pool에서 정확한 row와 연결되는지 driver integration test를 실행합니다.",
      "Oracle sequence를 사용할 때 sequence object owner, privilege, cache/order, NEXTVAL 사용 위치와 migration start value를 관리합니다. source maximum+1 계산과 concurrent write가 겹치지 않도록 cutover fencing 또는 dual allocation strategy가 필요합니다.",
      "surrogate key, natural/business key, idempotency key와 public opaque id는 목적이 다릅니다. 내부 증가 id를 URL이나 multi-tenant authorization 경계로 그대로 쓰지 않고 별도 접근 통제와 enumeration risk를 검토합니다.",
      "이식 시 source id는 보존하고 새 row generator만 target 다음 범위로 설정합니다. count뿐 아니라 min/max, duplicate, orphan, sequence/identity next allocation과 rollback gap을 postflight에서 확인합니다.",
    ],
    concepts: [
      c("allocation contract", "id 생성 주체·시점·범위·gap·explicit insert·readback 의미를 정한 계약입니다.", ["연속성을 약속하지 않습니다.", "concurrency를 포함합니다."]),
      c("surrogate key", "row identity와 관계 연결을 위한 의미 없는 내부 key입니다.", ["business uniqueness와 다릅니다.", "공개 권한을 제공하지 않습니다."]),
      c("sequence cutover", "source id 보존 뒤 target generator가 충돌 없는 다음 값을 생성하도록 전환하는 절차입니다.", ["concurrent write를 fence합니다.", "first allocation을 검증합니다."]),
    ],
    codeExamples: [py("db21-identity-and-sequence", "gap을 허용하는 identity와 명시적 sequence adapter", "db21_identity.py", "SQLite AUTOINCREMENT와 합성 sequence table을 이용해 삭제 후 id가 재사용되지 않고 두 생성 전략이 같은 key contract를 제공함을 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE auto_item(id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL)")
db.execute("CREATE TABLE sequence_state(name TEXT PRIMARY KEY, next_value INTEGER NOT NULL)")
db.execute("INSERT INTO sequence_state VALUES ('item',100)")
db.executemany("INSERT INTO auto_item(label) VALUES (?)", [("A",),("B",)])
db.execute("DELETE FROM auto_item WHERE id=2")
db.execute("INSERT INTO auto_item(label) VALUES ('C')")

def next_sequence():
    value = db.execute("SELECT next_value FROM sequence_state WHERE name='item'").fetchone()[0]
    db.execute("UPDATE sequence_state SET next_value=? WHERE name='item'", (value + 1,))
    return value

generated = [next_sequence(), next_sequence()]
auto_ids = [row[0] for row in db.execute("SELECT id FROM auto_item ORDER BY id")]
print("auto-ids=" + ",".join(map(str, auto_ids)))
print("sequence-ids=" + ",".join(map(str, generated)))
print("gap-reused=" + str(2 in auto_ids).lower())
print("next-sequence=" + str(db.execute("SELECT next_value FROM sequence_state").fetchone()[0]))
print("strategies=2")`, "auto-ids=1,3\nsequence-ids=100,101\ngap-reused=false\nnext-sequence=102\nstrategies=2", ["local-0126", "local-table", "mysql-create-table", "mysql-auto-increment", "oracle-create-table", "oracle-sequence", "sqlite-autoincrement", "python-sqlite3"])],
    diagnostics: [d("cutover 후 첫 insert가 duplicate key이거나 application이 다른 row의 generated id를 받습니다.", "source max와 generator state를 transaction/fence 없이 맞췄거나 batch/generated-key driver 동작을 검증하지 않았습니다.", ["source/target max and duplicates", "identity/sequence state", "concurrent writers", "driver generated-key trace"], "write를 fence하고 충돌 없는 generator state를 설정한 뒤 isolated insert/rollback/batch readback을 수행합니다.", "cutover rehearsal에 first-N allocation과 generated-key integration test를 포함합니다.")],
    expertNotes: ["sequence cache로 생긴 gap은 데이터 손실 증거가 아니며 row count/checksum과 별도로 판단합니다.", "법적 문서 번호처럼 연속성과 발급 취소 이력이 필요한 값은 별도 business allocator/ledger로 설계합니다."],
  },
  {
    id: "default-boolean-and-null-semantics",
    title: "DEFAULT·boolean·NULL·빈 문자열의 생성·비교 의미를 고정합니다",
    lead: "0/1, Y/N, nullable flag와 DEFAULT를 서로 섞으면 driver와 dialect에 따라 unknown, false, missing과 empty가 다른 상태로 해석됩니다.",
    explanations: [
      "boolean domain은 true, false와 unknown이 실제로 필요한지 먼저 결정합니다. 두 상태라면 NOT NULL과 domain constraint를 사용하고, 세 상태라면 null의 business meaning과 전이·UI·query 규칙을 명시합니다.",
      "target version이 native boolean을 제공하더라도 기존 application/driver가 숫자나 문자열로 binding할 수 있습니다. catalog type, bind parameter, result metadata, ORM converter와 JSON round-trip을 모두 검증합니다.",
      "DEFAULT는 column 생략 시 적용되고 명시적 NULL과 다릅니다. server time/function default의 evaluation time, timezone, statement/row granularity와 retry 결과를 확인하며 application default와 중복 책임을 피합니다.",
      "Oracle 계열 의미에서는 빈 문자열과 NULL의 차이가 MySQL/SQLite와 달라질 수 있으므로 empty가 유효한 business value인지 검사합니다. 필요하면 별도 status/length flag나 canonical non-empty representation을 사용합니다.",
      "migration에서 nullable→NOT NULL은 먼저 default/write path를 배포하고 기존 null을 deterministic batch로 분류·backfill한 뒤 zero-null readback과 constraint validation을 거쳐 contract합니다.",
    ],
    concepts: [
      c("three-valued logic", "SQL predicate가 TRUE, FALSE와 UNKNOWN을 갖는 논리입니다.", ["NULL 비교는 IS NULL을 사용합니다.", "WHERE는 TRUE만 선택합니다."]),
      c("default boundary", "column 생략, 명시적 NULL과 application-supplied value에서 누가 값을 생성하는지 정한 계약입니다.", ["server/application 책임을 분리합니다.", "retry 의미를 검토합니다."]),
      c("boolean domain", "허용 표현·nullability·constraint·driver mapping을 포함한 참/거짓 값 계약입니다.", ["0/1 관행만 믿지 않습니다.", "invalid value를 거부합니다."]),
    ],
    codeExamples: [py("db21-default-boolean-null", "DEFAULT·boolean constraint·NULL/empty 분리", "db21_defaults.py", "합성 flag table에서 omitted default, true, null note, empty note와 invalid boolean rejection을 정확히 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("""
CREATE TABLE feature_flag(
  id INTEGER PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  note TEXT,
  created_on TEXT NOT NULL DEFAULT '2000-01-01'
)
""")
db.execute("INSERT INTO feature_flag(id,note) VALUES (1,NULL)")
db.execute("INSERT INTO feature_flag(id,enabled,note) VALUES (2,1,'')")
try:
    db.execute("INSERT INTO feature_flag(id,enabled) VALUES (3,2)")
    rejected = False
except sqlite3.IntegrityError:
    rejected = True
rows = db.execute("SELECT enabled,note,created_on,typeof(enabled) FROM feature_flag ORDER BY id").fetchall()
print("rows=" + str(len(rows)))
print("default-false=" + str(sum(row[0] == 0 for row in rows)))
print("true=" + str(sum(row[0] == 1 for row in rows)))
print("null-notes=" + str(sum(row[1] is None for row in rows)))
print("empty-notes=" + str(sum(row[1] == "" for row in rows)))
print("invalid-rejected=" + str(rejected).lower())
print("storage-types=" + ",".join(sorted({row[3] for row in rows})))`, "rows=2\ndefault-false=1\ntrue=1\nnull-notes=1\nempty-notes=1\ninvalid-rejected=true\nstorage-types=integer", ["local-table", "mysql-create-table", "mysql-date-types", "oracle-create-table", "oracle-data-types", "sqlite-create-table", "python-sqlite3"])],
    diagnostics: [d("Oracle target에서 empty note가 null이 되거나 flag 2가 저장되어 query 분기가 달라집니다.", "empty/null과 boolean domain을 명시하지 않고 source 표현을 target type으로만 cast했습니다.", ["source empty/null counts", "target CHECK/nullability", "driver bind/result types", "application truth-table tests"], "business state를 다시 분류하고 canonical representation과 constraint를 추가한 뒤 ambiguous rows를 별도 quarantine/backfill합니다.", "모든 flag에 truth table과 empty/null cross-dialect fixture를 둡니다.")],
    expertNotes: ["DEFAULT로 기존 null의 의미를 덮으면 unknown 상태가 false로 조용히 바뀔 수 있습니다.", "CHECK constraint 정의뿐 아니라 target version에서 enabled·validated 상태인지 catalog로 확인합니다."],
  },
  {
    id: "string-functions-collation-and-empty",
    title: "문자열 연결·NULL 대체·부분 추출과 collation을 portable expression으로 격리합니다",
    lead: "CONCAT, 연산자, IFNULL/NVL/COALESCE와 substring 문법은 비슷해 보여도 NULL propagation, argument 수와 index 기준이 달라 결과가 바뀔 수 있습니다.",
    explanations: [
      "공통 service contract에는 normalize, concatenate, null fallback, substring, length, case fold와 compare operation을 의미 단위로 정의합니다. mapper에 dialect function을 흩뿌리지 않고 adapter expression 또는 target별 statement로 격리합니다.",
      "NULL 연결 결과를 empty로 볼지 전체 NULL로 볼지 product 의미를 정합니다. COALESCE도 첫 non-null 값의 타입·length·collation 영향을 받을 수 있어 explicit cast와 golden rows를 사용합니다.",
      "문자열 길이는 character, code point, grapheme와 byte 중 어떤 단위인지 명시합니다. 사용자 화면 자르기와 DB index/prefix length는 같은 문제가 아니며 emoji·combining mark·다국어 fixture로 검증합니다.",
      "case-insensitive 검색은 LOWER 함수 하나로 해결되지 않습니다. locale, accent, normalization, collation과 index 사용성을 함께 검토하고 canonical search key를 만들 경우 원문 display 값과 분리합니다.",
      "dynamic SQL에서 function이나 ORDER BY를 사용자 문자열로 직접 삽입하지 않습니다. 허용된 expression enum을 dialect registry에 매핑하고 값은 bind parameter로 전달해 injection과 plan fragmentation을 줄입니다.",
    ],
    concepts: [
      c("expression adapter", "같은 business operation을 dialect별 안전한 SQL expression으로 매핑하는 경계입니다.", ["값은 bind합니다.", "golden result가 필요합니다."]),
      c("collation contract", "문자열 equality·ordering·case/accent·normalization 의미를 정한 계약입니다.", ["column/index와 맞춰야 합니다.", "locale fixture를 둡니다."]),
      c("NULL propagation", "expression 입력 중 NULL이 있을 때 결과가 NULL 또는 대체 값이 되는 규칙입니다.", ["function마다 확인합니다.", "empty와 구분합니다."]),
    ],
    diagnostics: [d("이식 후 이름 검색 count나 연결된 label이 달라지고 index가 사용되지 않습니다.", "CONCAT/NVL/IFNULL을 기계 치환하고 NULL propagation, collation과 expression-index 가능성을 검증하지 않았습니다.", ["golden null/empty rows", "column/session collation", "expression result type", "EXPLAIN plan/index expression"], "operation 의미를 adapter로 추출하고 explicit COALESCE/cast/collation을 적용한 뒤 result set과 plan을 target별 승인합니다.", "문자열 operation truth table과 multilingual plan test를 mapper CI에 둡니다.")],
    expertNotes: ["UPPER/LOWER 결과는 locale와 Unicode version 영향이 있어 authorization key 정규화에 임의로 사용하지 않습니다.", "Oracle NVL과 표준 COALESCE의 type resolution 차이는 숫자/문자 혼합 fixture로 확인합니다."],
  },
  {
    id: "date-time-and-time-zone-portability",
    title: "날짜·시각·instant·offset·zone과 현재 시각의 책임을 분리합니다",
    lead: "DATE라는 이름만 같다고 시간 성분, timezone과 precision이 같은 것이 아니며 세션 timezone과 driver conversion이 경계 날짜를 바꿀 수 있습니다.",
    explanations: [
      "각 temporal field를 calendar date, local wall time, global instant, offset date-time, named-zone schedule 또는 duration으로 분류합니다. 생일과 event instant를 같은 UTC timestamp로 저장하는 식의 일괄 규칙을 피합니다.",
      "MySQL DATE/DATETIME/TIMESTAMP와 Oracle DATE/TIMESTAMP 계열의 범위, fractional precision, timezone conversion과 session setting을 target version 문서·catalog·driver probe로 확인합니다. 이름이 같아도 의미가 다를 수 있습니다.",
      "DB server current time, application clock과 source event time 중 누가 authoritative한지 정합니다. migration replay에서 CURRENT_*를 사용하면 실행 시점마다 결과가 달라지므로 immutable source time 또는 manifest cutoff를 bind합니다.",
      "DST gap/overlap과 timezone rule update를 다룹니다. future local schedule에는 zone id와 intended local time이 필요할 수 있고, 이미 발생한 event에는 normalized instant와 원본 offset metadata가 유용합니다.",
      "range query는 half-open [start,end) boundary를 권장하고 precision truncation, date cast와 indexed column function wrapping을 확인합니다. month/day boundary, leap day와 DST fixture에서 같은 ids와 plan을 검증합니다.",
    ],
    concepts: [
      c("temporal semantic class", "calendar date, local time, instant, offset/zone schedule처럼 시간 값의 실제 의미를 구분한 유형입니다.", ["DB type 선택 전에 정합니다.", "display zone과 분리합니다."]),
      c("half-open interval", "시작은 포함하고 끝은 제외하는 [start,end) 범위입니다.", ["인접 구간이 겹치지 않습니다.", "precision과 timezone을 고정합니다."]),
      c("clock authority", "현재 시각·event 시각·migration cutoff를 생성하는 승인된 주체입니다.", ["retry에서 안정적이어야 합니다.", "clock skew를 관측합니다."]),
    ],
    codeExamples: [py("db21-string-date-null-adapter", "NULL·문자열·날짜 의미의 portable core", "db21_functions.py", "SQLite 표준에 가까운 COALESCE·연결·trim·date 함수로 합성 row를 normalize하고 값 대신 결과 집합의 안정성을 요약합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY, label TEXT NOT NULL, note TEXT, happened_at TEXT NOT NULL)")
db.executemany("INSERT INTO event VALUES (?,?,?,?)", [
    (1," Alpha ",None,"2026-01-01T01:00:00"),
    (2,"Beta","","2026-01-01T23:00:00"),
    (3,"Gamma",None,"2026-01-02T02:00:00"),
])
rows = db.execute("""
SELECT lower(trim(label)), coalesce(note,'<none>'),
       lower(trim(label)) || ':' || substr(happened_at,1,10), date(happened_at)
FROM event ORDER BY id
""").fetchall()
print("rows=" + str(len(rows)))
print("normalized=" + ",".join(row[0] for row in rows))
print("distinct-days=" + str(len({row[3] for row in rows})))
print("null-replaced=" + str(sum(row[1] == "<none>" for row in rows)))
print("empty-preserved=" + str(sum(row[1] == "" for row in rows)))
print("concat-nonnull=" + str(all(row[2] is not None for row in rows)).lower())`, "rows=3\nnormalized=alpha,beta,gamma\ndistinct-days=2\nnull-replaced=2\nempty-preserved=1\nconcat-nonnull=true", ["mysql-date-functions", "mysql-string-functions", "oracle-concat", "oracle-nvl", "oracle-datetime", "sqlite-date-functions", "python-sqlite3"])],
    diagnostics: [d("자정·DST 주변 row가 다른 날짜로 조회되거나 migration 재실행 때 cutoff 결과가 달라집니다.", "temporal class와 clock/timezone authority를 정하지 않고 implicit session conversion과 CURRENT_*를 사용했습니다.", ["source/target type precision", "DB/session/JVM timezone", "bound parameter/result class", "boundary ids and query plan"], "명시적 temporal contract와 immutable cutoff를 적용해 원본 zone/instant을 lossless transform하고 경계 fixture를 재검증합니다.", "CI에서 여러 timezone, DST overlap/gap과 fractional precision matrix를 실행합니다.")],
    expertNotes: ["문자열 ISO 형식은 저장 의미와 validation이 고정될 때만 temporal type의 대안이 될 수 있습니다.", "session timezone 설정을 connection pool checkout마다 보장하고 관측 가능한 startup assertion으로 확인합니다."],
  },
  {
    id: "stable-pagination-and-ordering",
    title: "LIMIT·ROWNUM·ROW_NUMBER·FETCH를 안정된 total order와 page contract로 통합합니다",
    lead: "행 수만 제한하면 page가 아니라 임의 subset이며 동점·동시 insert·delete에서 OFFSET은 중복과 누락을 만들 수 있습니다.",
    explanations: [
      "page contract에 filter snapshot 의미, total order, page size cap, cursor/offset, next token, total count의 정확도와 consistency를 정의합니다. ORDER BY는 business sort key 뒤에 unique immutable tie-breaker를 포함해야 합니다.",
      "MySQL LIMIT/OFFSET과 Oracle OFFSET/FETCH 또는 analytic ROW_NUMBER를 target version에 맞게 사용합니다. 오래된 ROWNUM wrapper를 유지할 때는 ORDER BY가 올바른 inner query에 적용되고 row-number filtering 순서가 맞는지 golden ids로 검증합니다.",
      "OFFSET pagination은 앞 row를 계속 읽는 비용과 concurrent mutation에 취약합니다. 큰 목록이나 live feed에는 마지막 `(sort_key,id)` 이후를 찾는 keyset predicate를 사용하고 방향·NULL ordering을 cursor에 포함합니다.",
      "count query와 page query가 다른 filter/join을 사용하면 total과 rows가 어긋납니다. MyBatis fragment 재사용은 도움이 되지만 unsafe text substitution 없이 bind와 allow-listed sort expression을 사용합니다.",
      "index는 equality filters, range/keyset tuple과 order 방향을 반영합니다. 두 target에서 EXPLAIN/actual timing, examined rows, sort/temp와 skewed distribution을 비교해 page latency budget을 승인합니다.",
    ],
    concepts: [
      c("total order", "모든 결과 row의 순서를 유일하게 결정하는 ORDER BY입니다.", ["unique tie-breaker를 포함합니다.", "page 안정성의 전제입니다."]),
      c("keyset pagination", "마지막 sort tuple 이후를 predicate로 조회하는 pagination입니다.", ["큰 OFFSET을 피합니다.", "임의 page jump와 tradeoff가 있습니다."]),
      c("pagination adapter", "공통 filter/order/page contract를 dialect별 LIMIT/FETCH/ROW_NUMBER SQL로 만드는 계층입니다.", ["golden ids를 비교합니다.", "sort enum을 allow-list합니다."]),
    ],
    codeExamples: [py("db21-stable-pagination", "OFFSET·ROW_NUMBER·keyset의 동일 page ids", "db21_pagination.py", "동점이 있는 합성 점수 목록에서 unique id tie-breaker를 사용해 세 pagination 전략이 같은 두 id를 내는지 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE ranked_item(id INTEGER PRIMARY KEY, score INTEGER NOT NULL)")
db.executemany("INSERT INTO ranked_item VALUES (?,?)", [(1,10),(2,20),(3,20),(4,30),(5,30),(6,40)])
order_clause = "score DESC, id DESC"
offset_ids = [row[0] for row in db.execute(f"SELECT id FROM ranked_item ORDER BY {order_clause} LIMIT 2 OFFSET 2")]
window_ids = [row[0] for row in db.execute(f"""
SELECT id FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY {order_clause}) AS rn FROM ranked_item
) WHERE rn BETWEEN 3 AND 4 ORDER BY rn
""")]
after_score, after_id = 30, 5
keyset_ids = [row[0] for row in db.execute("""
SELECT id FROM ranked_item
WHERE score < ? OR (score = ? AND id < ?)
ORDER BY score DESC, id DESC LIMIT 2
""", (after_score, after_score, after_id))]
render = lambda values: ",".join(map(str, values))
print("offset=" + render(offset_ids))
print("window=" + render(window_ids))
print("keyset=" + render(keyset_ids))
print("all-equal=" + str(offset_ids == window_ids == keyset_ids).lower())
print("total-order=true")`, "offset=4,3\nwindow=4,3\nkeyset=4,3\nall-equal=true\ntotal-order=true", ["local-board", "mysql-select", "oracle-select", "oracle-rownum", "mybatis-dynamic", "sqlite-select", "python-sqlite3"])],
    diagnostics: [d("페이지를 넘길 때 같은 row가 반복되거나 일부 row가 사라지고 Oracle 결과 순서가 MySQL과 다릅니다.", "unique tie-breaker가 없거나 ROWNUM/ORDER BY 처리 순서가 잘못됐고 concurrent mutation에서 OFFSET snapshot 의미를 정의하지 않았습니다.", ["rendered SQL and bind order", "ORDER BY uniqueness/NULL order", "golden ids across pages", "EXPLAIN sort/index"], "stable total order를 추가하고 target별 pagination adapter를 golden ids로 검증하며 live 목록은 keyset cursor로 전환합니다.", "동점·insert/delete·NULL·양방향 cursor fixture를 cross-dialect CI에 둡니다.")],
    expertNotes: ["cursor에는 임의 SQL을 넣지 말고 signed/versioned sort tuple과 filter fingerprint를 담습니다.", "정확한 total count가 비싸면 product 계약에서 approximate/unknown을 명시하고 page query와 독립적으로 다룹니다."],
  },
  {
    id: "upsert-merge-and-idempotency",
    title: "ON DUPLICATE KEY·MERGE·ON CONFLICT를 conflict target과 idempotency 계약으로 비교합니다",
    lead: "upsert라는 한 단어는 어느 unique key가 충돌했는지, update expression이 몇 번 평가되는지와 동시 실행 결과를 충분히 설명하지 못합니다.",
    explanations: [
      "operation contract에 business key/conflict target, insert values, update fields, immutable fields, version transition, returned result와 retry idempotency를 적습니다. 모든 UNIQUE conflict를 같은 update로 처리하는지 명시적으로 검토합니다.",
      "MySQL INSERT ... ON DUPLICATE KEY UPDATE와 Oracle MERGE는 syntax뿐 아니라 multiple match, trigger, affected-row reporting, source duplication과 concurrency behavior가 다릅니다. target version 문서와 two-session probe로 확인합니다.",
      "counter 증가처럼 `value = value + delta`는 같은 request 재시도에서 중복 반영될 수 있습니다. request id/idempotency table 또는 expected version을 사용하고 ambiguous commit 뒤에는 결과를 readback합니다.",
      "MERGE source가 target 한 row에 여러 번 match하거나 target unique rule이 예상과 다르면 error 또는 비결정 결과가 생깁니다. source를 business key로 deduplicate하고 rejected duplicates count를 migration evidence로 남깁니다.",
      "upsert 뒤 generated id, inserted/updated classification과 final version을 application에 일관되게 반환합니다. affected row count만으로 action을 추론하지 말고 명시적 readback 또는 target-supported returning pattern을 adapter에 캡슐화합니다.",
    ],
    concepts: [
      c("conflict target", "insert 충돌을 판정하는 candidate/business key 또는 constraint입니다.", ["명시적으로 문서화합니다.", "다른 UNIQUE와 구분합니다."]),
      c("idempotency key", "같은 logical request의 retry를 한 번의 효과로 제한하는 안정된 식별자입니다.", ["DB transaction과 함께 기록합니다.", "TTL/범위를 정합니다."]),
      c("optimistic version", "update가 읽은 version과 일치할 때만 적용하고 증가시키는 concurrency token입니다.", ["lost update를 탐지합니다.", "retry에서 재조회합니다."]),
    ],
    codeExamples: [py("db21-upsert-dialect-contract", "upsert 결과와 rollback을 분리한 dialect registry", "db21_upsert.py", "SQLite ON CONFLICT로 합성 inventory를 갱신한 뒤 failed release transaction을 rollback하고 MySQL/Oracle adapter contract 개수를 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE inventory(sku TEXT PRIMARY KEY, quantity INTEGER NOT NULL, version INTEGER NOT NULL)")
db.execute("INSERT INTO inventory VALUES ('training-item',2,1)")
db.execute("""
INSERT INTO inventory(sku,quantity,version) VALUES ('training-item',3,1)
ON CONFLICT(sku) DO UPDATE SET
  quantity=inventory.quantity + excluded.quantity,
  version=inventory.version + 1
""")
db.commit()
after_upsert = db.execute("SELECT quantity,version FROM inventory").fetchone()
db.execute("BEGIN")
db.execute("UPDATE inventory SET quantity=99,version=version+1")
db.rollback()
after_rollback = db.execute("SELECT quantity,version FROM inventory").fetchone()
dialects = {
    "mysql": {"identity":"AUTO_INCREMENT", "page":"LIMIT", "upsert":"ON DUPLICATE KEY UPDATE"},
    "oracle": {"identity":"SEQUENCE", "page":"ROW_NUMBER", "upsert":"MERGE"},
}
print(f"after-upsert={after_upsert[0]}:{after_upsert[1]}")
print(f"after-rollback={after_rollback[0]}:{after_rollback[1]}")
print("rollback-preserved=" + str(after_upsert == after_rollback).lower())
print("dialects=" + ",".join(sorted(dialects)))
print("contracts=" + str(len(dialects["mysql"])))`, "after-upsert=5:2\nafter-rollback=5:2\nrollback-preserved=true\ndialects=mysql,oracle\ncontracts=3", ["mysql-insert", "mysql-commit", "oracle-merge", "mybatis-config", "sqlite-upsert", "python-sqlite3"])],
    diagnostics: [d("network timeout 재시도 후 quantity가 두 번 증가하거나 다른 UNIQUE 충돌이 예상치 않은 row를 update합니다.", "upsert syntax를 idempotency로 오해했고 conflict target, request identity와 ambiguous commit readback이 없습니다.", ["all UNIQUE constraints", "request/idempotency record", "target final version/value", "two-session lock/trigger trace"], "자동 재시도를 멈추고 request id로 결과를 조회한 뒤 명시한 conflict target과 expected version을 사용하는 adapter로 수정합니다.", "duplicate request, multi-unique, duplicate source와 timeout-after-commit tests를 두 target에 실행합니다.")],
    expertNotes: ["MERGE와 upsert는 대량 동기화의 만능 해법이 아니며 source deduplication과 transaction budget이 필요합니다.", "operation이 increment인지 replace인지에 따라 retry 의미가 다르므로 mapper 이름에도 의도를 드러냅니다."],
  },
  {
    id: "ddl-transactions-and-migration-order",
    title: "DDL implicit commit·object dependency와 expand-contract 순서를 target별로 설계합니다",
    lead: "SQLite에서 rollback된 ALTER가 MySQL이나 Oracle에서도 같은 방식으로 복구된다고 가정하면 partial schema와 incompatible application이 남을 수 있습니다.",
    explanations: [
      "statement별 transaction capability matrix에 implicit commit before/after, rollback support, metadata lock, online algorithm, lock timeout, replication effect와 tool autocommit을 target version별로 기록합니다. migration 시작 시 실제 session settings를 readback합니다.",
      "dependency graph는 sequence/table, PK/UNIQUE, FK, index, view, trigger, mapper/application deploy와 data backfill 순서를 포함합니다. dump의 원래 순서를 그대로 신뢰하지 않고 target catalog precondition을 사용합니다.",
      "breaking change는 expand→dual-compatible application→backfill→validate→read switch→old write stop→contract 순서로 나눕니다. 각 단계에 old/new version compatibility와 rollback/forward-fix를 명시합니다.",
      "type change는 shadow column/table, deterministic conversion, rejected-row quarantine, dual write 또는 change capture와 checksum reconciliation을 검토합니다. 한 번의 blocking ALTER가 data size와 uptime budget을 넘지 않는지 staging 분포에서 측정합니다.",
      "부분 실패 뒤 down migration을 무조건 실행하지 않습니다. catalog/history/data를 새 read-only session으로 분류해 resume, corrective forward migration, application rollback, restore/PITR를 RTO/RPO와 손실 기준으로 선택합니다.",
    ],
    concepts: [
      c("implicit commit", "DDL 등 특정 statement가 명시 transaction 경계와 별개로 commit을 발생시키는 동작입니다.", ["target/version별 확인합니다.", "client rollback을 믿지 않습니다."]),
      c("expand-contract", "호환 구조 추가와 전환을 완료한 뒤 이전 구조를 제거하는 단계적 migration입니다.", ["application compatibility를 추적합니다.", "관측 가능한 gate가 필요합니다."]),
      c("dependency-ordered release", "catalog object, data와 application 의존성을 DAG 순서로 적용하는 release입니다.", ["checksum을 고정합니다.", "postflight를 포함합니다."]),
    ],
    diagnostics: [d("rollback 명령 뒤 일부 DDL은 남고 schema history와 application 기대가 서로 다릅니다.", "target의 implicit commit/online DDL 의미를 SQLite나 다른 dialect에서 추론했고 postfailure readback을 생략했습니다.", ["catalog object definitions", "schema history/checksum", "session autocommit/tool logs", "compatible application versions"], "write를 중단하고 실제 state를 classify해 corrective migration 또는 restore를 선택하며 history를 기존 id 수정 없이 복구합니다.", "target version별 DDL fault-injection과 expand-contract compatibility tests를 release gate로 둡니다.")],
    expertNotes: ["online DDL이라는 이름도 lock zero를 보장하지 않으므로 준비·완료 metadata lock을 측정합니다.", "Oracle sequence나 MySQL generated objects의 privilege/owner도 dependency manifest에 포함합니다."],
  },
  {
    id: "locking-isolation-and-concurrency",
    title: "transaction isolation·locking·deadlock을 문법이 아닌 동시 실행 invariant로 비교합니다",
    lead: "같은 SELECT와 UPDATE가 한 session에서는 맞아도 두 writer의 snapshot, predicate lock과 wait 정책에 따라 lost update·write skew·duplicate action이 발생할 수 있습니다.",
    explanations: [
      "operation별 invariant와 anomaly를 정의합니다. inventory nonnegative, 한 account당 하나의 active record, aggregate version monotonic 같은 조건을 two-session schedule로 표현하고 final state를 검증합니다.",
      "isolation level 이름만 비교하지 않고 consistent read, current/locking read, read-your-writes, phantom, write conflict와 retry signal을 target별로 probe합니다. connection pool이 session setting을 재사용하는지도 확인합니다.",
      "SELECT ... FOR UPDATE는 읽은 row를 잠그지만 존재하지 않는 row, predicate 범위와 join 대상 잠금은 engine/index/plan에 따라 달라질 수 있습니다. uniqueness constraint와 atomic write를 우선하고 lock query를 보조로 사용합니다.",
      "deadlock은 무조건 버그가 아니라 concurrency control의 정상 해제 방식일 수 있습니다. transaction을 작게 유지하고 일관된 lock order, bounded timeout, transient classification과 idempotent retry를 적용합니다.",
      "migration lock budget에는 wait duration뿐 아니라 blocked sessions, connection pool saturation, replica lag와 application tail latency를 포함합니다. kill/cancel 뒤 ambiguous state를 새 connection으로 readback합니다.",
    ],
    concepts: [
      c("concurrency invariant", "여러 transaction이 interleave되어도 반드시 유지되어야 하는 business 조건입니다.", ["final state로 검증합니다.", "single-session test로 부족합니다."]),
      c("locking read", "현재 row를 읽고 동시 변경을 제한하기 위해 lock을 획득하는 read입니다.", ["범위와 plan을 확인합니다.", "timeout/deadlock을 처리합니다."]),
      c("retry taxonomy", "deadlock/serialization 같은 transient와 constraint/syntax/drift 같은 permanent failure를 구분한 정책입니다.", ["bounded backoff를 씁니다.", "idempotency가 전제입니다."]),
    ],
    diagnostics: [d("부하에서 간헐적 lost update나 negative count가 생기지만 단위 테스트는 모두 통과합니다.", "single-session read-modify-write만 검사했고 isolation, atomic predicate/version과 retry idempotency를 검증하지 않았습니다.", ["two-session schedule", "isolation/session settings", "lock/deadlock trace", "final invariant/version"], "atomic conditional update 또는 optimistic version/constraint로 invariant를 DB에 표현하고 conflict를 명시적 retry 결과로 처리합니다.", "deterministic concurrency harness와 deadlock/timeout chaos test를 target별 CI에 둡니다.")],
    expertNotes: ["분산 lock을 추가하기 전에 단일 DB constraint와 atomic statement로 해결 가능한지 확인합니다.", "lock diagnostic에 SQL bind 값이나 사용자 식별자를 기록하지 않고 query fingerprint와 transaction state만 사용합니다."],
  },
  {
    id: "mybatis-dialect-boundary-and-test-matrix",
    title: "MyBatis databaseId 경계와 cross-dialect test matrix로 이식성을 지속 검증합니다",
    lead: "한 mapper XML에 조건문과 문자열 치환을 계속 추가하면 dialect 차이, parameter 안전성과 result mapping이 결합되어 어느 경로가 실행되는지 알기 어려워집니다.",
    explanations: [
      "공통 mapper contract는 statement id, parameter object, result shape, ordering, affected-row/action과 error semantics를 정의합니다. dialect SQL은 databaseIdProvider로 선택되는 동일 id statement 또는 명시 adapter namespace에 두고 application service는 dialect string을 알지 못하게 합니다.",
      "databaseId는 실제 DataSource vendor/version과 startup assertion으로 확인합니다. 누락·오인식 시 공통 statement로 조용히 fallback하지 않도록 필수 statement inventory와 selected resource를 startup/test에서 출력하되 connection 정보는 숨깁니다.",
      "`${}` 문자열 substitution은 allow-listed identifier/sort enum처럼 불가피한 제한된 경우만 사용하고 값은 `#{}` bind를 사용합니다. dynamic SQL fragment는 WHERE/SET comma 처리를 돕지만 authorization filter와 tenant predicate 누락을 자동으로 막지는 않습니다.",
      "test matrix는 schema migration, catalog assertions, mapper CRUD, null/empty/Unicode/numeric/time boundaries, generated key, pagination golden ids, upsert action, rollback, two-session locking, explain plan과 failure translation을 MySQL·Oracle 지원 버전에서 실행합니다.",
      "release artifact에는 mapper/source checksum, databaseId route coverage, executed statement ids, result/invariant summary와 target versions를 둡니다. SQL snapshot 문자열만 비교하지 않고 실제 catalog/data/transaction behavior를 검증합니다.",
    ],
    concepts: [
      c("databaseIdProvider", "DataSource vendor에 따라 같은 statement id의 dialect variant를 선택하게 하는 MyBatis 구성입니다.", ["startup assertion을 둡니다.", "모든 variant를 test합니다."]),
      c("mapper contract test", "parameter·result·ordering·affected action·error 의미가 dialect variant에서 같은지 검증하는 테스트입니다.", ["실제 target DB에서 실행합니다.", "golden ids/state를 씁니다."]),
      c("dialect route coverage", "지원 operation마다 MySQL·Oracle statement가 선택·실행·검증되었는지 나타내는 coverage입니다.", ["dead mapper를 찾습니다.", "target version을 기록합니다."]),
    ],
    diagnostics: [d("Oracle에서 MySQL용 statement가 선택되거나 특정 mapper id가 startup 후에야 not found로 실패합니다.", "databaseId 감지와 variant inventory가 없고 fallback behavior·resource loading 순서를 검증하지 않았습니다.", ["resolved databaseId", "loaded statement ids/databaseIds", "mapper resource checksum", "target integration-test route coverage"], "startup을 fail-fast로 바꾸고 동일 contract의 vendor variants를 명시해 각 target에서 실제 선택 statement와 result를 검증합니다.", "지원 operation×dialect×version matrix와 no-fallback assertion을 CI/release evidence에 둡니다.")],
    expertNotes: ["XML mapper의 실제 pagination 구조는 학습용으로 literal 복사하지 않고 statement id와 ROWNUM 사용 사실만 provenance에 기록했습니다.", "dialect abstraction은 최소 공통 기능으로 축소하는 일이 아니라 공통 의미와 의도적 차이를 명시하는 일입니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0126", repository: "dbstudy", path: "01_26.sql", usedFor: ["mixed DDL and automatic-increment portability provenance"], evidence: "read-only safe scanner로 8 CREATE, 13 ALTER, 6 PRIMARY KEY와 1 auto-increment structure를 값 없이 확인했습니다." },
  { id: "local-board", repository: "SPRING/TESTER", path: "src/main/resources/sqlmap/BoardMapper.xml", usedFor: ["six mapper statement ids and Oracle-style row limiting provenance"], evidence: "read-only safe scanner로 statement id count와 ROWNUM 사용 사실만 확인했으며 SQL bind/sample 값은 복사하지 않았습니다." },
  { id: "local-table", repository: "SPRING/MyWeb", path: "src/main/resources/TABLE.sql", usedFor: ["Oracle table, sequence and server-time default provenance"], evidence: "read-only safe scanner로 2 tables, 2 sequences와 server-time function count만 확인했으며 object/sample literal은 예제로 복사하지 않았습니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["type, default, constraint and automatic-increment DDL"], evidence: "MySQL 공식 CREATE TABLE 문서입니다." },
  { id: "mysql-auto-increment", repository: "MySQL 8.4 Reference Manual", path: "InnoDB AUTO_INCREMENT Handling", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-auto-increment-handling.html", usedFor: ["identity allocation and concurrency semantics"], evidence: "MySQL 공식 InnoDB auto-increment 문서입니다." },
  { id: "mysql-date-types", repository: "MySQL 8.4 Reference Manual", path: "Date and Time Data Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/date-and-time-types.html", usedFor: ["temporal type and default mapping"], evidence: "MySQL 공식 date/time type 문서입니다." },
  { id: "mysql-date-functions", repository: "MySQL 8.4 Reference Manual", path: "Date and Time Functions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html", usedFor: ["date expression portability"], evidence: "MySQL 공식 date/time function 문서입니다." },
  { id: "mysql-string-functions", repository: "MySQL 8.4 Reference Manual", path: "String Functions and Operators", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/string-functions.html", usedFor: ["string expression and NULL behavior"], evidence: "MySQL 공식 string function 문서입니다." },
  { id: "mysql-select", repository: "MySQL 8.4 Reference Manual", path: "SELECT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["LIMIT/OFFSET and ordering"], evidence: "MySQL 공식 SELECT 문서입니다." },
  { id: "mysql-insert", repository: "MySQL 8.4 Reference Manual", path: "INSERT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/insert.html", usedFor: ["ON DUPLICATE KEY update contract"], evidence: "MySQL 공식 INSERT 문서입니다." },
  { id: "mysql-commit", repository: "MySQL 8.4 Reference Manual", path: "COMMIT and ROLLBACK", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["transaction/autocommit and rollback"], evidence: "MySQL 공식 transaction control 문서입니다." },
  { id: "oracle-create-table", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-TABLE.html", usedFor: ["Oracle type, identity, default and constraint DDL"], evidence: "Oracle 공식 CREATE TABLE 문서입니다." },
  { id: "oracle-sequence", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE SEQUENCE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-SEQUENCE.html", usedFor: ["sequence allocation contract"], evidence: "Oracle 공식 CREATE SEQUENCE 문서입니다." },
  { id: "oracle-data-types", repository: "Oracle Database 26ai SQL Language Reference", path: "Data Types", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Types.html", usedFor: ["Oracle type and boolean/null mapping"], evidence: "Oracle 공식 data type 문서입니다." },
  { id: "oracle-concat", repository: "Oracle Database 26ai SQL Language Reference", path: "CONCAT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CONCAT.html", usedFor: ["string concatenation portability"], evidence: "Oracle 공식 CONCAT 문서입니다." },
  { id: "oracle-nvl", repository: "Oracle Database 26ai SQL Language Reference", path: "NVL", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/NVL.html", usedFor: ["NULL fallback portability"], evidence: "Oracle 공식 NVL 문서입니다." },
  { id: "oracle-datetime", repository: "Oracle Database 26ai Globalization Support Guide", path: "Datetime Data Types and Time Zone Support", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/nlspg/datetime-data-types-and-time-zone-support.html", usedFor: ["Oracle temporal and timezone semantics"], evidence: "Oracle 공식 datetime/timezone 문서입니다." },
  { id: "oracle-select", repository: "Oracle Database 26ai SQL Language Reference", path: "SELECT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["Oracle ordering and row limiting"], evidence: "Oracle 공식 SELECT 문서입니다." },
  { id: "oracle-rownum", repository: "Oracle Database 26ai SQL Language Reference", path: "ROWNUM Pseudocolumn", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/ROWNUM-Pseudocolumn.html", usedFor: ["legacy pagination evaluation order"], evidence: "Oracle 공식 ROWNUM 문서입니다." },
  { id: "oracle-merge", repository: "Oracle Database 26ai SQL Language Reference", path: "MERGE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/MERGE.html", usedFor: ["Oracle merge/upsert contract"], evidence: "Oracle 공식 MERGE 문서입니다." },
  { id: "mybatis-config", repository: "MyBatis 3 Documentation", path: "databaseIdProvider", publicUrl: "https://mybatis.org/mybatis-3/configuration.html#databaseIdProvider", usedFor: ["vendor statement routing"], evidence: "MyBatis 공식 configuration 문서입니다." },
  { id: "mybatis-dynamic", repository: "MyBatis 3 Documentation", path: "Dynamic SQL", publicUrl: "https://mybatis.org/mybatis-3/dynamic-sql.html", usedFor: ["safe dynamic mapper and pagination fragments"], evidence: "MyBatis 공식 dynamic SQL 문서입니다." },
  { id: "sqlite-autoincrement", repository: "SQLite Documentation", path: "AUTOINCREMENT", publicUrl: "https://www.sqlite.org/autoinc.html", usedFor: ["exact identity laboratory"], evidence: "SQLite 공식 AUTOINCREMENT 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["exact default, CHECK and NULL laboratory"], evidence: "SQLite 공식 CREATE TABLE 문서입니다." },
  { id: "sqlite-date-functions", repository: "SQLite Documentation", path: "Date And Time Functions", publicUrl: "https://www.sqlite.org/lang_datefunc.html", usedFor: ["exact date expression laboratory"], evidence: "SQLite 공식 date/time function 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["exact window and pagination laboratory"], evidence: "SQLite 공식 SELECT 문서입니다." },
  { id: "sqlite-upsert", repository: "SQLite Documentation", path: "UPSERT", publicUrl: "https://www.sqlite.org/lang_upsert.html", usedFor: ["exact conflict-update laboratory"], evidence: "SQLite 공식 UPSERT 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Documentation", path: "sqlite3", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["all exact isolated portability examples"], evidence: "Python 공식 sqlite3 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-21-mysql-oracle-portability", slug: "db-21-mysql-oracle-portability", courseId: "database", moduleId: "db-project-schema-portability", order: 5,
  title: "MySQL과 Oracle의 자동 증가·페이징·함수 이식", subtitle: "문법 치환을 넘어 type·identity·NULL·시간·pagination·upsert·DDL transaction·locking·MyBatis contract를 두 엔진에서 증명합니다.", level: "전문가", estimatedMinutes: 1080,
  coreQuestion: "MySQL과 Oracle의 다른 타입·id 생성·함수·pagination·transaction 문법을 같은 business invariant와 application contract로 어떻게 이식하고 계속 검증할까요?",
  summary: "dbstudy 01_26.sql, SPRING/TESTER BoardMapper.xml과 SPRING/MyWeb TABLE.sql을 read-only 안전 방식으로 구조만 감사해 mixed DDL, automatic increment, mapper statement와 ROWNUM, Oracle sequence/server-time pattern을 확인했습니다. 실제 table/sample/bind literal은 예제로 복사하지 않았습니다. semantic type contract, AUTO_INCREMENT/identity/sequence, default/boolean/null/empty, string/date/timezone functions, stable LIMIT/ROWNUM/ROW_NUMBER/keyset pagination, upsert/MERGE idempotency, DDL implicit commit과 expand-contract, locking/isolation, MyBatis databaseId route와 target test matrix를 전문가 수준으로 연결합니다. 다섯 exact Python/sqlite3 examples는 identity allocation, default/boolean/null, string/date normalization, 세 pagination 전략의 golden ids와 upsert/rollback dialect contract를 실행합니다.",
  objectives: ["값 domain·정밀도·collation·시간 의미로 lossless type mapping을 정의한다.", "AUTO_INCREMENT, identity와 sequence의 allocation/readback/cutover를 검증한다.", "DEFAULT, boolean, NULL와 empty-string truth table을 고정한다.", "CONCAT/NVL/COALESCE/date function을 semantic adapter로 격리한다.", "calendar date, instant, offset/zone과 clock authority를 구분한다.", "LIMIT/OFFSET, ROWNUM/ROW_NUMBER/FETCH와 keyset을 stable total order로 검증한다.", "ON DUPLICATE KEY와 MERGE를 conflict target·idempotency로 비교한다.", "DDL implicit commit, dependency와 expand-contract recovery를 target별 설계한다.", "locking/isolation/deadlock을 two-session invariant로 검증한다.", "MyBatis databaseId route와 MySQL·Oracle test matrix를 release gate로 운영한다."],
  prerequisites: [{ title: "덤프·마이그레이션·샘플 데이터의 비밀값 위생", reason: "로컬 DDL·mapper를 값 없이 감사하고 synthetic fixture와 immutable migration evidence를 만드는 능력이 필요합니다.", sessionSlug: "db-20-schema-migration-secret-hygiene" }],
  keywords: ["MySQL Oracle portability", "AUTO_INCREMENT", "sequence", "boolean null", "CONCAT NVL", "timezone", "ROWNUM", "keyset pagination", "MERGE upsert", "implicit commit", "locking isolation", "MyBatis databaseId"], topics,
  lab: {
    title: "MySQL↔Oracle schema·mapper semantic parity release",
    scenario: "MySQL 중심 DDL과 Oracle sequence/table, ROWNUM mapper가 공존하며 같은 service contract를 두 DB에서 제공해야 합니다. 단순 regex 변환은 null, id, page, upsert와 transaction 결과를 바꿉니다.",
    setup: ["세 로컬 source는 read-only로 보존하고 statement/id/function count만 provenance로 사용합니다.", "MySQL 8.4와 Oracle 26ai disposable target, 동일 application/driver와 synthetic boundary fixture를 준비합니다.", "operation별 semantic contract, type/transaction matrix, mapper databaseId registry와 golden result를 만듭니다.", "catalog/count/checksum/plan/lock trace와 rollback acceptance criterion을 값 없이 기록합니다."],
    steps: ["모든 column을 range/precision/null/collation/temporal 의미로 분류하고 target type probe를 실행합니다.", "source id를 보존하고 AUTO_INCREMENT/identity/sequence next allocation과 generated-key readback을 검증합니다.", "boolean/default/null/empty/Unicode boundary를 insert·query·driver round-trip으로 비교합니다.", "string/null/date operation을 adapter로 만들고 golden rows·result types·plans를 비교합니다.", "pagination total order를 정의하고 LIMIT, ROW_NUMBER/ROWNUM과 keyset이 같은 ids를 내는지 검증합니다.", "upsert conflict target, source duplicate, optimistic version, timeout-after-commit과 returned action을 검사합니다.", "DDL implicit commit/lock matrix로 expand-backfill-validate-contract와 partial failure를 rehearsal합니다.", "two-session lost-update/deadlock schedules에서 final invariant와 retry idempotency를 확인합니다.", "MyBatis databaseId별 모든 statement route, bind/result/error semantics를 target matrix에서 실행합니다.", "catalog/history/count/checksum/plan/application smoke를 postflight하고 old path 제거와 rollback/forward-fix를 승인합니다."],
    expectedResult: ["두 target에서 type round-trip과 rejected boundary가 semantic contract와 일치합니다.", "다섯 exact examples의 stdout이 완전히 일치합니다.", "generated id, default/null, pagination golden ids와 upsert final version이 dialect 간 동등합니다.", "DDL partial failure와 concurrency anomaly가 자동 gate에서 탐지됩니다.", "MyBatis route coverage와 target version별 evidence가 release manifest에 남습니다."],
    cleanup: ["disposable target schemas, synthetic rows, sequences, indexes와 mapper test artifacts를 run id로 삭제합니다.", "temporary DB credentials와 network access를 revoke합니다.", "로컬 source 세 파일은 변경하지 않고 checksum/count provenance만 보존합니다.", "EXPLAIN/lock logs는 query fingerprint와 bounded metadata만 남기고 fixture value를 폐기합니다."],
    extensions: ["LOB/JSON/spatial type과 driver streaming matrix를 추가합니다.", "bidirectional migration과 rollback 뒤 identity/sequence collision을 검사합니다.", "cursor token signing·NULL ordering·backward pagination을 구현합니다.", "Testcontainers 또는 승인된 CI DB로 dialect route·deadlock nightly suite를 운영합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 공통 의미와 target-specific 표현을 구분하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "identity gap과 sequence next를 설명합니다.", "DEFAULT/NULL/empty truth table을 작성합니다.", "string/date adapter 결과를 해석합니다.", "세 pagination 전략의 ids가 같은 이유를 설명합니다.", "upsert final version과 rollback을 확인합니다."], hints: ["SQLite 문법을 정답으로 보지 말고 결과 invariant를 MySQL/Oracle adapter의 계약으로 사용하세요."], expectedOutcome: "문법보다 관측 가능한 결과를 기준으로 portability를 설명합니다.", solutionOutline: ["types→identity→values/functions→pages→writes/transactions 순서입니다."] },
    { difficulty: "응용", prompt: "세 로컬 source의 MySQL·Oracle portability backlog와 mapper variants를 설계하세요.", requirements: ["type/range/null/collation matrix를 만듭니다.", "identity/sequence cutover를 작성합니다.", "string/date/default adapter를 정의합니다.", "stable pagination과 index plan을 비교합니다.", "upsert idempotency와 conflict target을 둡니다.", "DDL implicit commit/expand-contract를 설계합니다.", "two-session locking tests를 포함합니다.", "databaseId route coverage와 postflight를 완성합니다."], hints: ["원본 SQL을 복사하기보다 안전 scanner가 확인한 구조적 특징에서 contract test를 도출하세요."], expectedOutcome: "target별 SQL과 공통 service semantics가 분리된 실행 가능한 roadmap이 완성됩니다.", solutionOutline: ["inventory→semantic matrix→adapters→fixtures→fault tests→release evidence 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 SQL portability 표준과 지원 DB certification process를 정의하세요.", requirements: ["지원 version과 semantic type catalog를 둡니다.", "identity/default/function/pagination/upsert contract를 정의합니다.", "DDL/transaction/locking capability matrix를 운영합니다.", "mapper databaseId 구조와 bind 안전 규칙을 둡니다.", "golden rows·plans·two-session tests를 요구합니다.", "drift/postflight/rollback evidence를 정의합니다.", "deprecation과 compatibility window를 둡니다.", "정기 target patch-version certification을 운영합니다."], hints: ["최소 공통 문법이 아니라 공통 invariant와 의도적 차이를 승인하세요."], expectedOutcome: "DB 추가·upgrade 때 재사용 가능한 portability governance가 완성됩니다.", solutionOutline: ["contract catalog→dialect implementation→certification matrix→release gates→deprecation 순서입니다."] },
  ],
  nextSessions: [], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["01_26.sql은 read-only safe scanner에서 8 CREATE, 13 ALTER, 6 PRIMARY KEY와 1 automatic-increment structure가 확인되었으며 sample literal은 복사하지 않았습니다.", "BoardMapper.xml은 6 mapper statement ids와 Oracle-style ROWNUM pattern이 확인되었지만 실제 namespace, SQL predicate와 bind/sample value는 학습 예제로 복사하지 않았습니다.", "TABLE.sql은 2 tables, 2 sequences와 server-time default pattern이 확인되었지만 실제 object/sample literal은 복사하지 않았습니다.", "SQLite exact examples는 semantic core를 실행할 뿐 MySQL 8.4·Oracle 26ai의 type coercion, optimizer, implicit commit, generated keys와 locking을 대체하지 않으므로 target test matrix를 필수화했습니다."] },
});

export default session;
