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
      { lines: `1-${first}`, explanation: "외부 서버·credential·개인 데이터 없이 sqlite3와 합성 입력에 scalar function contract를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "pure return, NULL, precision, collation, call count 또는 deterministic-index eligibility 중 하나를 실행합니다." },
      { lines: `${second + 1}-${lineCount}`, explanation: "stable scalar·rows·call count·query plan처럼 재현 가능한 evidence만 출력합니다. MySQL/Oracle declaration·replication·privilege는 실제 엔진 matrix에서 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3/decimal/unicodedata", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "Python/SQLite deterministic flag와 expression index는 MySQL stored function 또는 Oracle PL/SQL의 purity·optimizer·replication을 대체하지 않습니다."] },
    experiments: [
      { change: "NULL, Unicode 동등 문자열, boundary decimal, row 순서와 반복 호출을 추가합니다.", prediction: "숨은 session/data/time 의존성이 있으면 같은 logical input에서 결과 또는 call count가 달라집니다.", result: "입력 canonical form, exact return, function calls와 indexed query result를 대조합니다." },
      { change: "같은 계약을 MySQL 8.4와 Oracle 26ai 격리 schema에서 실행합니다.", prediction: "type/collation, declared determinism, function-based index, rights와 binary logging에 승인된 차이가 나타납니다.", result: "engine/version, DDL, metadata, plans, replica/readback과 errors를 conformance evidence로 보존합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "function-scalar-contract",
    title: "저장 함수를 표현식 안에서 호출되는 scalar 계약으로 정의합니다",
    lead: "함수는 RETURN이 있다는 문법보다 SELECT·WHERE·ORDER BY·constraint·index 계산 중 몇 번 호출돼도 안전한 값 계약이어야 합니다.",
    explanations: [
      "원본 dbstudy 02_04.sql은 FN_ORDER_COUNT, FN_BOOK_TOTAL, 주문 여부와 평균을 RETURNS/RETURN/DETERMINISTIC로 만들고 SELECT projection에서 호출합니다. 이 세션은 progression을 보존하되 sample 고객·주문 값은 복사하지 않고 합성 학습 key만 사용합니다.",
      "function contract에는 qualified name/version, input type/null/collation, return type/null/precision, deterministic/purity claim, data/session/time dependencies, allowed SQL contexts, error mapping, security context와 cost를 기록합니다.",
      "procedure는 명령·result sets·OUT에 적합하고 function은 한 expression value에 적합합니다. 여러 rows를 반환하거나 transaction을 관리하고 audit를 쓰는 작업을 scalar function에 숨기면 optimizer 호출 횟수와 side effects가 충돌합니다.",
      "SELECT list의 함수는 input row마다 실행될 수 있고 WHERE와 ORDER BY에 반복되거나 optimizer가 재배치할 수 있습니다. 한 번 호출될 것이라는 제어 흐름 기대를 버리고 같은 입력의 여러 호출이 관찰 가능 state를 바꾸지 않아야 합니다.",
      "function 실행 성공은 return 의미가 맞다는 증거가 아닙니다. zero/one/many related rows, NULL, min/max/rounding, equivalent Unicode, changed base snapshot과 engine upgrades를 golden fixtures로 검증합니다.",
    ],
    concepts: [
      c("stored function", "database catalog에 저장되고 SQL/PL expression에서 scalar 값을 반환하는 named subprogram입니다.", ["RETURNS와 RETURN이 필요합니다.", "procedure command와 책임이 다릅니다."]),
      c("scalar contract", "각 input tuple에 대해 하나의 typed value 또는 명시적 error를 정의하는 약속입니다.", ["NULL/precision/collation을 포함합니다.", "호출 context를 정의합니다."]),
      c("referential transparency", "같은 관찰 가능한 환경과 입력을 값으로 치환해도 query 의미가 바뀌지 않는 성질입니다.", ["side effect가 없어야 합니다.", "optimizer 안전성과 연결됩니다."]),
    ],
    codeExamples: [py("db11-pure-scalar", "pure scalar 함수의 같은 입력·같은 출력", "db11_pure_scalar.py", "합성 점수와 상한만으로 level을 반환하는 순수 함수를 반복 호출해 exact scalar contract를 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
def mastery(points, maximum):
    if points is None or maximum is None or maximum <= 0:
        return None
    ratio = points / maximum
    return "advanced" if ratio >= 0.8 else "intermediate" if ratio >= 0.5 else "beginner"
db.create_function("mastery", 2, mastery, deterministic=True)
db.execute("CREATE TABLE score(learner_key TEXT, points INTEGER, maximum INTEGER)")
db.executemany("INSERT INTO score VALUES (?, ?, ?)", [("L-01", 90, 100), ("L-02", 55, 100), ("L-03", 20, 100), ("L-04", None, 100)])
for row in db.execute("SELECT learner_key, mastery(points, maximum) FROM score ORDER BY learner_key"):
    print(f"{row[0]}={row[1] if row[1] is not None else 'NULL'}")
first = db.execute("SELECT mastery(90, 100)").fetchone()[0]
second = db.execute("SELECT mastery(90, 100)").fetchone()[0]
print("repeat-equal=" + str(first == second).lower())`, "L-01=advanced\nL-02=intermediate\nL-03=beginner\nL-04=NULL\nrepeat-equal=true", ["local-0204", "mysql-create-routine", "oracle-create-function", "sqlite-deterministic", "python-sqlite3"])],
    diagnostics: [
      d("SELECT projection에서 함수가 예상보다 여러 번 실행됩니다.", "함수를 imperative one-call command처럼 설계했고 optimizer expression evaluation을 고려하지 않았습니다.", ["query plan/expression occurrences", "rows input", "function side effects", "optimizer rewrite"], "scalar function을 pure/read-only로 만들고 command side effect는 procedure/API로 이동합니다.", "call-count variation에서도 result/state가 같은 property test를 둡니다."),
      d("함수 한 개가 여러 결과와 status를 반환해야 합니다.", "scalar value와 command/result-record 책임을 한 함수에 넣었습니다.", ["consumer use context", "return schema needs", "side effects", "error/status fields"], "한 scalar 계산으로 좁히거나 versioned view/result set/procedure로 분리합니다.", "function review에서 one-value meaning과 allowed contexts를 필수로 기록합니다."),
    ],
    expertNotes: ["함수는 표현식 어디서든 재평가될 수 있다는 전제로 설계합니다.", "함수 이름은 구현 동사가 아니라 unit과 NULL 의미가 드러나는 값 변환을 표현합니다."],
  },
  {
    id: "return-type-precision-overflow",
    title: "RETURNS type·precision·scale·overflow와 driver mapping을 고정합니다",
    lead: "계산식이 맞아도 반환 자료형이 좁으면 truncation·overflow·rounding으로 다른 값을 전달합니다.",
    explanations: [
      "COUNT는 data growth를 고려한 integer 범위를, 금액/평균은 DECIMAL precision·scale·currency와 rounding mode를 정의합니다. 원본의 총매출 INT는 학습 예제로는 간단하지만 production 범위에는 부족할 수 있습니다.",
      "division은 integer/decimal promotion과 scale 규칙이 엔진마다 다릅니다. numerator/denominator를 explicit cast하고 zero denominator와 negative input policy를 먼저 정의합니다.",
      "RETURN expression type이 declared RETURNS에 coercion될 때 warning 또는 error가 나는지 sql_mode/engine/version별로 확인합니다. silent truncation을 정상 결과로 승인하지 않습니다.",
      "문자열 return은 length, character set, collation과 normalization을 contract에 넣습니다. byte length와 character length를 혼동하지 않고 emoji·combining mark·최대 길이 fixtures를 사용합니다.",
      "JDBC/ORM에서는 DECIMAL을 float/double로 바꾸지 않고 BigDecimal 같은 exact type으로 읽습니다. wasNull, signed range, timezone/temporal mapping을 driver metadata와 end-to-end serialization에서 검증합니다.",
    ],
    concepts: [
      c("declared return type", "RETURNS 절이 호출자와 engine에 약속하는 scalar 자료형입니다.", ["expression coercion을 검증합니다.", "NULL/charset/collation을 포함합니다."]),
      c("precision and scale", "DECIMAL 전체 유효 자릿수와 소수점 이하 자릿수입니다.", ["업무 최대값을 수용합니다.", "rounding mode를 정합니다."]),
      c("type conformance", "engine 결과와 driver/application representation이 contract 범위·정밀도를 보존하는 성질입니다.", ["boundary fixtures를 씁니다.", "warning까지 확인합니다."]),
    ],
    codeExamples: [py("db11-decimal-return", "평균 반환의 exact DECIMAL과 rounding", "db11_decimal_return.py", "Decimal로 입력 단위·scale·ROUND_HALF_UP을 고정하고 empty와 boundary 결과를 exact 문자열로 검증합니다.", String.raw`from decimal import Decimal, ROUND_HALF_UP

def average_points(values):
    if not values:
        return None
    total = sum((Decimal(value) for value in values), Decimal("0"))
    return (total / Decimal(len(values))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
cases = [
    ("normal", [10, 11, 12]),
    ("round-up", [10, 11]),
    ("single", [999999]),
    ("empty", []),
]
for name, values in cases:
    result = average_points(values)
    print(f"{name}={result if result is not None else 'NULL'}")
print("float-used=false")`, "normal=11.00\nround-up=10.50\nsingle=999999.00\nempty=NULL\nfloat-used=false", ["mysql-create-routine", "oracle-create-function", "jdbc-callable-statement"])],
    diagnostics: [
      d("평균이 17.49 대신 17 또는 binary floating 오차로 보입니다.", "integer division 또는 application float mapping이 precision을 잃었습니다.", ["operand types/casts", "RETURNS precision/scale", "sql_mode warnings", "driver/application type"], "DECIMAL operands와 explicit rounding을 사용하고 exact decimal type으로 end-to-end 전달합니다.", "half-boundary/max/empty fixtures를 engine·driver·JSON까지 검증합니다."),
      d("데이터 증가 뒤 count function이 overflow합니다.", "현재 sample 크기에 맞춘 좁은 return integer를 사용했습니다.", ["declared range", "aggregate return type", "growth forecast", "driver signed mapping"], "업무 수명 최대 cardinality를 수용하는 type으로 versioned function을 배포합니다.", "near-max synthetic metadata test와 overflow alert를 둡니다."),
    ],
    expertNotes: ["RETURNS type은 implementation detail이 아니라 consumer API schema입니다.", "rounding 위치가 query/함수/application에 중복되지 않도록 한 owner와 한 rule을 정합니다."],
  },
  {
    id: "actual-determinism-dependencies",
    title: "DETERMINISTIC 선언과 실제 결정성을 dependency graph로 구분합니다",
    lead: "같은 parameter로 table을 조회하는 함수는 base data가 바뀌면 값이 달라지므로 선언 한 줄만으로 수학적 결정성이 생기지 않습니다.",
    explanations: [
      "원본의 FN_ORDER_COUNT/FN_BOOK_TOTAL은 orders table을 읽으면서 DETERMINISTIC로 표시합니다. 동일 argument라도 table snapshot이 변하면 result가 달라지므로 이 표기는 실제 dependency와 optimizer/replication 요구를 다시 검토해야 하는 중요한 반례입니다.",
      "결정성은 input tuple뿐 아니라 table data, current time, random, sequence, session variables, current user/schema, locale/NLS/timezone, collation과 external state 의존성을 포함해 판단합니다.",
      "MySQL routine characteristic은 optimizer에 모든 의미를 자동 증명하지 않으며 잘못된 선언은 binary logging/replication 안전성에 영향을 줄 수 있습니다. Oracle DETERMINISTIC 역시 programmer assertion이며 function-based index/query rewrite에서 잘못된 결과 위험이 있습니다.",
      "stable within statement, stable within transaction과 globally immutable은 다릅니다. data lookup function이 필요하면 result cache/index context에 쓰지 않고 explicit snapshot/version parameter를 포함하거나 join/view로 dependency를 드러냅니다.",
      "determinism test는 같은 input 반복만으로 부족합니다. row order, session timezone/collation/user, base mutation, restart/replica와 engine version을 바꾸고 approved environment scope에서 동일함을 검증합니다.",
    ],
    concepts: [
      c("deterministic function", "정의한 환경 범위에서 같은 입력이 항상 같은 반환 또는 오류를 만드는 함수입니다.", ["숨은 state가 없어야 합니다.", "선언은 증명이 아닙니다."]),
      c("dependency closure", "함수 결과에 영향을 주는 table·session·time·locale·external state의 전체 집합입니다.", ["transitive helper calls를 포함합니다.", "version 계약에 기록합니다."]),
      c("stability scope", "statement·transaction·snapshot·deployment lifetime 중 결과 동일성을 보장하는 범위입니다.", ["deterministic와 구분합니다.", "cache/index eligibility를 결정합니다."]),
    ],
    diagnostics: [
      d("DETERMINISTIC 함수로 만든 index가 base data 변경 후 잘못된 결과를 냅니다.", "table lookup/time/session 의존 함수를 거짓으로 deterministic 선언했습니다.", ["function source/callees", "base/session/time dependencies", "index/generated expression", "mutation timeline"], "index expression에는 input-only pure function만 허용하고 data lookup은 join/materialized pipeline으로 분리해 index를 rebuild합니다.", "dependency lint와 mutate-environment determinism suite를 둡니다."),
      d("primary와 replica에서 같은 호출 결과가 다릅니다.", "non-deterministic/state-dependent function과 logging format/replication order가 결합했습니다.", ["routine characteristics", "binlog format/events", "data/watermark", "session settings"], "replication-safe statement/row strategy와 explicit dependencies를 사용하고 replica reconciliation을 실행합니다.", "engine 공식 restrictions 기반 release gate와 primary/replica golden calls를 둡니다."),
    ],
    expertNotes: ["함수가 table을 읽는 순간 parameter만의 순수 함수라는 설명을 중단하고 snapshot dependency를 문서화합니다.", "결정성 annotation을 성능 hint로 거짓 사용하지 말고 proof checklist와 owner 승인을 요구합니다."],
  },
  {
    id: "null-empty-error-semantics",
    title: "NULL 입력·빈 집합·오류·업무 0을 서로 다른 결과로 설계합니다",
    lead: "NULL을 무조건 0으로 바꾸면 unknown과 실제 zero가 합쳐지고, 호출자는 data quality와 business 상태를 구분할 수 없습니다.",
    explanations: [
      "strict/NULL-propagating function은 필수 input 중 하나가 NULL이면 NULL을 반환합니다. defaulting function은 NULL을 특정 값으로 해석하지만 그 정책이 이름/contract에 드러나야 합니다.",
      "COUNT empty는 0이 자연스럽지만 AVG/SUM empty는 '관측 없음'일 수 있습니다. 원본 IFNULL(SUM(...),0)은 하나의 업무 선택이며 모든 aggregate에 자동 적용할 rule은 아닙니다.",
      "invalid denominator, out-of-range enum과 malformed text는 NULL 반환, stable validation error, sentinel 중 하나를 선택합니다. NULL 하나로 invalid와 absent를 모두 숨기면 diagnostics가 불가능합니다.",
      "SQL three-valued logic에서 `fn(x)=value`는 fn이 NULL이면 UNKNOWN이라 WHERE에서 제외됩니다. JOIN key, CHECK, UNIQUE/index와 ORDER NULL placement에 미치는 효과를 fixtures로 확인합니다.",
      "driver가 SQL NULL과 문자열 'NULL', numeric zero를 구분하는지 wasNull/nullable mapping을 검증합니다. JSON에서 omitted/null/0도 별도 API 의미로 유지합니다.",
    ],
    concepts: [
      c("NULL propagation", "필수 input이 unknown이면 결과도 unknown으로 반환하는 함수 정책입니다.", ["strict semantics를 명시합니다.", "predicate UNKNOWN을 고려합니다."]),
      c("empty aggregate", "eligible row가 하나도 없는 집계 입력 상태입니다.", ["COUNT 0과 SUM/AVG NULL 의미가 다를 수 있습니다.", "업무 default를 승인합니다."]),
      c("sentinel collision", "0·빈 문자열 같은 특별값이 실제 업무 값과 구분되지 않는 문제입니다.", ["NULL 또는 typed error를 검토합니다.", "consumer mapping을 테스트합니다."]),
    ],
    codeExamples: [py("db11-null-contract", "NULL propagation과 empty aggregate 구분", "db11_null_contract.py", "SQLite function에서 missing input은 NULL, empty count는 0, empty average는 NULL로 분리해 predicate 결과까지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
def safe_ratio(numerator, denominator):
    if numerator is None or denominator is None or denominator == 0:
        return None
    return round(numerator / denominator, 2)
db.create_function("safe_ratio", 2, safe_ratio, deterministic=True)
db.execute("CREATE TABLE sample(id INTEGER PRIMARY KEY, earned INTEGER, possible INTEGER)")
db.executemany("INSERT INTO sample VALUES (?, ?, ?)", [(1, 8, 10), (2, None, 10), (3, 0, 0)])
for row in db.execute("SELECT id, safe_ratio(earned, possible) FROM sample ORDER BY id"):
    print(f"id={row[0]}|ratio={row[1] if row[1] is not None else 'NULL'}")
count, average = db.execute("SELECT count(*), avg(earned) FROM sample WHERE id > 99").fetchone()
print("empty-count=" + str(count))
print("empty-average=" + (str(average) if average is not None else "NULL"))
matched = db.execute("SELECT count(*) FROM sample WHERE safe_ratio(earned, possible) >= 0.5").fetchone()[0]
print("matched=" + str(matched))`, "id=1|ratio=0.8\nid=2|ratio=NULL\nid=3|ratio=NULL\nempty-count=0\nempty-average=NULL\nmatched=1", ["mysql-create-routine", "oracle-create-function", "sqlite-deterministic", "python-sqlite3"])],
    diagnostics: [
      d("학습 기록이 없는 사용자와 실제 점수 0 사용자가 모두 0으로 보입니다.", "empty/NULL을 COALESCE 0으로 합쳐 업무 상태를 잃었습니다.", ["source row existence", "aggregate semantics", "function default", "API nullable mapping"], "no-observation은 NULL/status로, observed zero는 0으로 분리하고 consumer UI를 계약합니다.", "empty vs zero golden fixtures와 serialization test를 둡니다."),
      d("WHERE function(...) 조건에서 예상 행이 조용히 빠집니다.", "NULL return이 comparison에서 UNKNOWN이 되는 것을 고려하지 않았습니다.", ["function NULL paths", "predicate truth table", "JOIN/CHECK context", "NULL placement"], "predicate에서 NULL 정책을 명시적으로 처리하거나 input constraints로 impossible함을 증명합니다.", "TRUE/FALSE/UNKNOWN truth-table test를 모든 사용 context에 둡니다."),
    ],
    expertNotes: ["NULL policy는 함수 작성자가 임의로 정하지 않고 data product owner와 consumer가 합의합니다.", "error를 NULL로 축약하면 retryable/internal failure까지 data absence처럼 보일 수 있습니다."],
  },
  {
    id: "collation-normalization-locale",
    title: "문자열 함수의 collation·Unicode normalization·locale을 계약합니다",
    lead: "겉보기 같은 문자열도 code points와 collation이 다르면 함수 반환·비교·index key가 달라집니다.",
    explanations: [
      "case fold, accent sensitivity, width/kana와 trailing spaces는 database collation마다 다릅니다. 함수가 canonical key를 만든다면 input character set/collation과 output normalization form을 명시합니다.",
      "Unicode NFC/NFD의 `é` 같은 동등 표현은 byte가 다릅니다. lower/upper만으로 normalization이 되지 않으며 locale-sensitive Turkish I 같은 사례에서 general-purpose case conversion이 identity key를 깨뜨릴 수 있습니다.",
      "MySQL function parameter/return collation derivation과 coercibility, Oracle NLS settings, SQLite registered collation/function 차이를 matrix로 확인합니다. session setting 의존은 결정성 claim 범위를 좁힙니다.",
      "검색 표시용 fold와 security identifier/password/token 비교를 같은 함수로 처리하지 않습니다. 보안 identifier에는 protocol이 정한 exact canonicalization을 쓰고 임의 locale 변환을 금지합니다.",
      "canonical function 변경은 이미 저장된 generated/index keys와 unique collisions를 만들 수 있습니다. v2 function·new column/index를 병행 backfill하고 collision report를 승인한 뒤 전환합니다.",
    ],
    concepts: [
      c("collation", "문자열 비교·정렬·동등성을 결정하는 규칙 집합입니다.", ["charset과 다릅니다.", "case/accent/locale 민감도를 가집니다."]),
      c("Unicode normalization", "동일 문자를 나타내는 code-point sequence를 NFC/NFD 등 정규형으로 바꾸는 과정입니다.", ["case folding과 다릅니다.", "index key version과 연결합니다."]),
      c("canonical key", "정의한 normalization/case 규칙으로 만든 안정 비교용 문자열입니다.", ["version이 필요합니다.", "display 원문을 대체하지 않습니다."]),
    ],
    codeExamples: [py("db11-unicode-canonical", "NFC와 casefold로 만든 versioned canonical key", "db11_unicode.py", "precomposed/decomposed Unicode와 case 차이를 같은 합성 key로 만들고 원문 bytes 차이를 함께 확인합니다.", String.raw`import unicodedata

def canonical_key(value):
    if value is None:
        return None
    return unicodedata.normalize("NFC", value).casefold()
values = ["CAFÉ", "cafe\u0301", "Cafe"]
for index, value in enumerate(values, 1):
    print(f"v{index}={canonical_key(value)}")
print("first-second-equal=" + str(canonical_key(values[0]) == canonical_key(values[1])).lower())
print("first-third-equal=" + str(canonical_key(values[0]) == canonical_key(values[2])).lower())
print("raw-first-second-equal=" + str(values[0].encode("utf-8") == values[1].encode("utf-8")).lower())
print("null=" + str(canonical_key(None)))`, "v1=café\nv2=café\nv3=cafe\nfirst-second-equal=true\nfirst-third-equal=false\nraw-first-second-equal=false\nnull=None", ["mysql-charset-general", "mysql-collation-names", "oracle-create-function", "python-sqlite3"])],
    diagnostics: [
      d("겉보기 같은 두 제목이 unique key에서 중복으로 처리되지 않습니다.", "NFC/NFD와 collation/case 규칙이 canonical function에 고정되지 않았습니다.", ["code points/bytes", "column/function collation", "normalization form", "generated/index expression version"], "versioned canonicalization을 적용하고 existing data collision을 보고한 뒤 새 index로 전환합니다.", "Unicode equivalence/accent/case/locale golden corpus를 둡니다."),
      d("서버 locale 변경 뒤 함수 결과가 달라집니다.", "session NLS/collation에 암묵적으로 의존하면서 deterministic로 선언했습니다.", ["session settings", "explicit collation", "function dependencies", "index/replica outputs"], "locale을 explicit input/version으로 고정하거나 locale-independent primitive를 사용합니다.", "서로 다른 session locale/timezone에서 determinism suite를 실행합니다."),
    ],
    expertNotes: ["canonicalization은 한번 저장되면 data migration 책임이 생기므로 algorithm version을 보존합니다.", "사용자 표시 원문과 비교용 key를 별도 열/값으로 유지합니다."],
  },
  {
    id: "side-effects-rights-purity",
    title: "side effect·table DML·session state를 scalar 함수 밖으로 밀어냅니다",
    lead: "함수가 audit row를 쓰거나 session variable을 바꾸면 optimizer의 호출·재배치·실패가 business state를 예측 불가능하게 만듭니다.",
    explanations: [
      "원본의 FN_BOOK_TOTAL2/3은 user variables를 함수 내부 SELECT INTO 대상으로 사용합니다. session 공유 state는 호출 순서·connection pool·concurrency에 의존하므로 scalar return 외 관찰 가능한 결과를 만들지 않는 것이 안전합니다.",
      "stored function의 DML/transaction/dynamic SQL 제한은 MySQL·Oracle context마다 다릅니다. 문법적으로 허용되는 경우에도 SELECT expression이 몇 번 실행될지, statement failure에서 side effect가 rollback되는지 설명할 수 없으면 command로 분리합니다.",
      "definer-rights function을 view/index/predicate에서 호출하면 caller가 간접적으로 넓은 데이터나 timing을 관찰할 수 있습니다. function privilege closure, invoker/definer context와 input allow-list를 low/high identity로 검증합니다.",
      "sequence, random, current timestamp와 external API는 모두 side effect 또는 non-deterministic dependency입니다. 값을 caller가 input으로 전달하거나 procedure가 한 번 생성한 뒤 저장·반환하게 합니다.",
      "audit는 function call이 아니라 business command boundary에서 한 번 기록합니다. query observability는 DB telemetry를 사용하고 SELECT 안에서 log table을 쓰지 않습니다.",
    ],
    concepts: [
      c("side effect", "return 값 외에 table·session·sequence·external state를 바꾸는 관찰 가능한 동작입니다.", ["호출 횟수와 순서에 민감합니다.", "scalar function에서 피합니다."]),
      c("session state", "user variable, locale, current schema처럼 connection에 남아 다음 호출에 영향을 주는 상태입니다.", ["pool에서 누출될 수 있습니다.", "결정성을 깨뜨립니다."]),
      c("purity boundary", "함수는 input→value 계산만, procedure/API는 state transition을 맡도록 나누는 설계 경계입니다.", ["optimizer 자유를 보존합니다.", "audit/idempotency를 명확히 합니다."]),
    ],
    codeExamples: [py("db11-call-count-side-effect", "함수 호출 횟수에 의존하면 안 되는 이유", "db11_call_count.py", "SQLite registered function의 호출 횟수를 관찰하되 query result 외 state에 business 의미를 두지 않아야 함을 재현합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE score(id INTEGER PRIMARY KEY, points INTEGER)")
db.executemany("INSERT INTO score VALUES (?, ?)", [(1, 30), (2, 60), (3, 90)])
calls = {"count": 0}
def band(points):
    calls["count"] += 1
    return "high" if points >= 80 else "mid" if points >= 50 else "low"
db.create_function("band", 1, band)
rows = list(db.execute("SELECT id, band(points) FROM score WHERE band(points) <> 'low' ORDER BY id"))
for row in rows:
    print("row=" + "|".join(map(str, row)))
print("rows=" + str(len(rows)))
print("calls=" + str(calls["count"]))
print("calls-equal-rows=" + str(calls["count"] == len(rows)).lower())`, "row=2|mid\nrow=3|high\nrows=2\ncalls=5\ncalls-equal-rows=false", ["mysql-stored-restrictions", "mysql-function-optimization", "oracle-create-function", "python-sqlite3"])],
    diagnostics: [
      d("함수로 audit를 남겼더니 한 SELECT에 audit가 여러 건입니다.", "projection/predicate에서 같은 function이 여러 번 평가될 수 있음을 무시했습니다.", ["expression occurrences", "actual calls", "optimizer plan", "audit transaction"], "audit/state change를 idempotent procedure command로 옮기고 function을 pure하게 만듭니다.", "동일 query의 plan/call-count 변형에서도 business state unchanged를 검증합니다."),
      d("pooled connection마다 함수 결과가 다릅니다.", "user variable/NLS/current schema 같은 session state가 초기화되지 않았습니다.", ["function source", "pool checkout/reset", "session variables/settings", "effective user"], "session state 의존을 explicit input으로 바꾸거나 checkout reset과 scope를 강제합니다.", "connection reuse/identity switch determinism test를 둡니다."),
    ],
    expertNotes: ["call count는 optimizer implementation detail일 수 있으므로 함수 correctness가 그 수에 의존하면 안 됩니다.", "read-only 함수도 민감 data를 infer할 수 있으므로 EXECUTE와 base privilege closure를 review합니다."],
  },
  {
    id: "function-cost-query-performance",
    title: "row-by-row 함수 비용과 optimizer visibility를 set-based 대안과 비교합니다",
    lead: "간단한 SELECT가 함수 내부 table lookup 때문에 N번 query를 실행하면 코드가 짧아져도 latency와 lock 비용은 폭증합니다.",
    explanations: [
      "`SELECT customer..., fn_count(id)` pattern은 input row마다 related table aggregate를 실행하는 correlated N+1이 될 수 있습니다. join+GROUP BY, pre-aggregation CTE/view 또는 materialized summary와 동일 result를 비교합니다.",
      "function body가 optimizer에 opaque하면 predicate pushdown, join reordering과 cost estimation이 제한될 수 있습니다. MySQL function call optimization 공식 동작과 Oracle optimizer/function cost 특성을 실제 plan으로 확인합니다.",
      "deterministic라고 선언해도 모든 row에서 자동 memoization된다고 가정하지 않습니다. repeated argument cardinality, call count, CPU, logical reads와 locks를 측정하고 cache가 필요하면 key/version/invalidation을 명시합니다.",
      "WHERE fn(column)=constant는 base index를 사용하기 어렵고 expression index가 정확히 같은 expression을 지원할 때만 개선될 수 있습니다. 가능한 경우 predicate를 sargable base range로 rewrite합니다.",
      "성능 acceptance에는 small/large tenant, skew, NULL, repeated keys와 concurrent queries를 넣습니다. function 단독 microbenchmark보다 containing query의 rows/loops/calls/p95를 봅니다.",
    ],
    concepts: [
      c("row-by-row execution", "input row마다 scalar function을 평가해 내부 작업 비용이 반복되는 실행 형태입니다.", ["N+1 lookup을 만들 수 있습니다.", "call count를 측정합니다."]),
      c("optimizer opacity", "함수 내부 관계/비용을 optimizer가 충분히 재작성·추정하지 못하는 상태입니다.", ["plan quality를 떨어뜨릴 수 있습니다.", "set-based 대안을 비교합니다."]),
      c("sargability", "predicate가 index search range로 변환될 수 있는 성질입니다.", ["column wrapping을 피합니다.", "expression index는 exact match가 필요합니다."]),
    ],
    diagnostics: [
      d("100개 행 조회가 함수 추가 뒤 수천 번 reads를 냅니다.", "각 row에서 related aggregate를 다시 실행하는 scalar N+1입니다.", ["function call count", "internal statement rows/loops", "repeated argument cardinality", "join/pre-aggregate plan"], "eligible keys를 한 번 join·aggregate하거나 versioned summary를 사용하고 result parity를 확인합니다.", "query-level calls/reads/latency budget과 large fixture를 둡니다."),
      d("함수 predicate 때문에 index가 있는데도 full scan입니다.", "indexed column을 opaque expression으로 감싸 range를 만들 수 없습니다.", ["predicate expression", "available expression/generated indexes", "actual access path", "equivalent base range"], "sargable predicate로 rewrite하거나 truly deterministic exact expression index를 검토합니다.", "critical predicate plan shape와 rows-read regression을 둡니다."),
    ],
    expertNotes: ["함수 추출로 SQL text가 짧아지는 것과 DB 작업량 감소는 별개입니다.", "cache/materialization 전 source version과 invalidation/reconciliation 책임을 먼저 정합니다."],
  },
  {
    id: "expression-index-generated-column",
    title: "식 인덱스·generated column에는 증명된 deterministic 함수만 사용합니다",
    lead: "index key는 나중 query에서도 같은 expression value를 재현해야 하므로 time·table·session 의존 함수가 들어가면 저장된 key와 현재 계산이 갈라집니다.",
    explanations: [
      "SQLite expression index는 deterministic function만 허용하고 registered application function은 deterministic flag가 필요합니다. generated column도 scalar deterministic expression 제한을 갖습니다. 이는 작은 laboratory에서 purity invariant를 명확히 보여 줍니다.",
      "MySQL generated column/index와 Oracle function-based index의 허용 함수·type·collation·owner privileges를 공식 문서로 확인합니다. dialect support를 같은 DDL로 추상화하지 않습니다.",
      "query expression은 index definition과 syntactically/semantically 맞아야 합니다. function name/version, argument order, cast/collation과 literal units를 한 definition에서 생성하고 EXPLAIN에서 실제 index 사용을 확인합니다.",
      "함수 algorithm을 변경하면 기존 index/generated values는 old semantics입니다. v2 function+new expression column/index를 만들고 backfill/collision/result reconciliation 후 query를 전환하며 old index를 rebuild/drop합니다.",
      "unique expression index는 canonicalization collision을 business constraint로 만듭니다. 기존 데이터 collision, NULL uniqueness와 case/accent policy를 배포 전에 report하고 자동 merge/delete하지 않습니다.",
    ],
    concepts: [
      c("expression index", "column 원값이 아니라 deterministic expression 결과를 key로 저장하는 index입니다.", ["query expression 일치가 필요합니다.", "함수 변경 시 rebuild합니다."]),
      c("generated column", "다른 열의 표현식으로 계산되는 virtual 또는 stored column입니다.", ["허용 함수 제한이 있습니다.", "index와 contract version을 관리합니다."]),
      c("function-index coupling", "함수 의미가 저장 index/generated values의 correctness와 직접 묶이는 관계입니다.", ["algorithm version을 고정합니다.", "rollout/rebuild 순서를 요구합니다."]),
    ],
    codeExamples: [py("db11-expression-index", "deterministic 함수 기반 expression index와 plan", "db11_expression_index.py", "SQLite deterministic registered function으로 canonical key index를 만들고 query plan과 exact matches를 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
def canonical(value):
    return value.strip().casefold() if value is not None else None
db.create_function("canonical", 1, canonical, deterministic=True)
db.execute("CREATE TABLE course(id INTEGER PRIMARY KEY, code TEXT NOT NULL)")
db.executemany("INSERT INTO course VALUES (?, ?)", [(1, " SQL-101 "), (2, "Java-101"), (3, "sql-201")])
db.execute("CREATE INDEX course_canonical_code_idx ON course(canonical(code))")
plan = db.execute("EXPLAIN QUERY PLAN SELECT id FROM course WHERE canonical(code) = ?", ("sql-101",)).fetchall()
ids = [row[0] for row in db.execute("SELECT id FROM course WHERE canonical(code) = ? ORDER BY id", ("sql-101",))]
print("ids=" + ",".join(map(str, ids)))
print("uses-index=" + str(any("course_canonical_code_idx" in row[3] for row in plan)).lower())
print("canonical-1=" + db.execute("SELECT canonical(code) FROM course WHERE id=1").fetchone()[0])
print("deterministic-declared=true")`, "ids=1\nuses-index=true\ncanonical-1=sql-101\ndeterministic-declared=true", ["sqlite-deterministic", "sqlite-expression-index", "sqlite-generated-column", "python-sqlite3", "mysql-generated-column-index", "oracle-create-index"])],
    diagnostics: [
      d("함수 수정 뒤 index query와 full scan 결과가 다릅니다.", "stored index keys가 old function semantics로 남았습니다.", ["function definition/version", "index build time", "full-scan forced result", "rebuild status"], "새 version expression index를 build·reconcile하고 atomic query 전환 후 old index를 제거합니다.", "function artifact가 바뀌면 dependent indexes/generated columns를 차단하는 dependency gate를 둡니다."),
      d("식 인덱스가 있는데 optimizer가 사용하지 않습니다.", "query expression의 cast/collation/argument가 index definition과 일치하지 않습니다.", ["normalized expressions", "collation", "bound parameter type", "actual plan/statistics"], "한 canonical expression builder를 사용하고 exact plan을 representative values로 검증합니다.", "expression fingerprint와 plan regression test를 둡니다."),
    ],
    expertNotes: ["deterministic flag는 index 생성 허가 조건일 수 있지만 실제 purity proof를 대체하지 않습니다.", "index rebuild 전후에 forced indexed/full scan result parity를 비교합니다."],
  },
  {
    id: "replication-cache-generated-values",
    title: "복제·binary log·cache·stored values에서 함수 재평가 시점을 통제합니다",
    lead: "함수가 source와 replica, write와 read, cache build와 lookup에서 서로 다른 시점에 평가되면 같은 SQL이 다른 데이터를 만들 수 있습니다.",
    explanations: [
      "statement-based logging은 replica가 함수를 다시 평가할 수 있고 row-based logging은 계산된 row image를 전달할 수 있지만 routine DDL/dependencies와 mixed mode 규칙을 공식 문서로 확인해야 합니다. 무조건 특정 format이면 안전하다고 단정하지 않습니다.",
      "current timestamp, random, session user/NLS와 table lookup 함수는 source/replica state 차이에 민감합니다. 값이 command 시점에 한 번 정해져야 한다면 application/procedure가 생성해 column에 저장하고 provenance/timezone/version을 함께 기록합니다.",
      "result cache/memoization key에는 모든 semantic inputs와 function version, locale/timezone, source watermark가 포함되어야 합니다. 숨은 dependency가 있으면 invalidation이 불가능하므로 cache를 사용하지 않거나 dependency를 explicit input으로 바꿉니다.",
      "generated stored column과 expression index는 write 시점 값을 보유하며 virtual expression은 read 시점에 평가될 수 있습니다. update/backfill/restore/upgrade에서 어느 시점 semantics인지 inventory합니다.",
      "replica verification은 row count만 비교하지 않고 canonical input sample의 function result, generated/index lookup parity, routine definition/security/settings와 lag/watermark를 비교합니다.",
    ],
    concepts: [
      c("evaluation time", "함수 값이 write, statement, transaction, read, refresh 중 언제 계산되는지 정한 시점입니다.", ["stored/virtual을 구분합니다.", "replica와 cache에 중요합니다."]),
      c("replication safety", "logging/replica 재평가에서도 source가 의도한 committed state와 결과가 보존되는 성질입니다.", ["함수 dependencies를 포함합니다.", "format/version으로 검증합니다."]),
      c("cache key completeness", "함수 결과에 영향을 주는 모든 explicit semantic input과 version이 cache key에 들어간 상태입니다.", ["숨은 state가 있으면 달성하기 어렵습니다.", "watermark/invalidation을 연결합니다."]),
    ],
    diagnostics: [
      d("replica generated value가 source와 다릅니다.", "non-deterministic/session/data-dependent function이 다른 환경·시점에 평가됐습니다.", ["logging format/event", "function/source hash", "session timezone/collation", "data watermark"], "pure explicit-input 계산 또는 write-once stored value로 바꾸고 affected rows/index를 rebuild·reconcile합니다.", "source/replica canonical result and lookup parity를 release/upgrade마다 실행합니다."),
      d("함수 cache가 설정 변경 후 오래된 값을 반환합니다.", "locale/timezone/source version이 cache key와 invalidation에 없습니다.", ["dependency closure", "cache key fields", "function version", "invalidation events"], "모든 semantic dependency를 key/version에 포함하거나 cache를 제거합니다.", "environment mutation과 version bump cache-miss tests를 둡니다."),
    ],
    expertNotes: ["복제 correctness는 함수 선언 문자열보다 실제 logging events와 replica readback으로 증명합니다.", "재현 불가능한 값은 계산 결과뿐 아니라 source inputs/version/evaluation time provenance를 저장합니다."],
  },
  {
    id: "function-portability-deployment-observability",
    title: "MySQL·Oracle·SQLite 차이와 함수 lifecycle을 한 운영 체계로 관리합니다",
    lead: "CREATE FUNCTION이라는 공통 단어 아래 parameter mode, SQL 사용, purity declaration, rights, indexing과 배포 방식이 다르므로 semantic contract와 구현 adapter를 분리해야 합니다.",
    explanations: [
      "MySQL matrix에는 RETURNS, routine characteristics, SQL SECURITY, data access, restrictions, function call optimization, generated index와 binary logging을 넣습니다. server sql_mode, charset/collation과 definer를 artifact에 기록합니다.",
      "Oracle matrix에는 CREATE FUNCTION, AUTHID, DETERMINISTIC assertion, SQL-invoked restrictions, function-based index와 editioning/dependency를 넣습니다. package function과 standalone function lifecycle 차이도 owner가 선택합니다.",
      "SQLite/Python matrix에는 application-defined function registration lifetime, deterministic flag, NULL/type mapping, expression index/generated restrictions와 connection pool registration을 넣습니다. native stored function이 아니라 connection-bound extension이라는 gap을 명시합니다.",
      "배포는 dependency scan→v2 function create/grants→normal/boundary/environment mutation tests→dependent index/new column build→full-scan parity→canary query plans→atomic routing→v1 usage drain 순서입니다. function replace만 먼저 하지 않습니다.",
      "관측에는 function version/hash, containing query digest, calls/input rows, duration/CPU/reads, error/null rate, plan/index usage, replica parity와 privilege denied를 남기되 raw argument/return text는 수집하지 않습니다.",
    ],
    concepts: [
      c("function conformance matrix", "engine/version별 return·NULL·determinism·rights·index·replication 계약 결과를 비교한 표입니다.", ["동일 SQL text를 요구하지 않습니다.", "approved differences를 기록합니다."]),
      c("dependent rebuild", "함수 의미 변경에 따라 expression index, generated values, cache와 materialized outputs를 다시 계산하는 migration입니다.", ["result parity를 검증합니다.", "rollback copy를 보존합니다."]),
      c("function telemetry", "함수와 containing query의 호출·cost·errors·NULL·plan·replica evidence를 민감 입력 없이 연결한 관측입니다.", ["version/hash를 포함합니다.", "high-cardinality 값을 제외합니다."]),
    ],
    diagnostics: [
      d("SQLite 예제는 통과했지만 MySQL CREATE FUNCTION이 거부됩니다.", "connection-defined deterministic function과 stored routine privilege/logging restrictions를 같은 것으로 봤습니다.", ["engine/version", "CREATE/EXECUTE grants", "routine characteristics", "binary logging settings"], "실제 server DDL/identity/replication conformance를 별도 실행하고 SQLite는 scalar invariant에만 사용합니다.", "지원 엔진 clean-install matrix를 release gate로 둡니다."),
      d("v2 함수 배포 뒤 old expression index가 조용히 남습니다.", "function→index/generated/cache dependency를 migration artifact에 포함하지 않았습니다.", ["catalog dependency", "index expression/hash", "generated stored rows", "cache/materialized versions"], "v2 dependencies를 병행 build·reconcile하고 routing 후 old artifacts를 명시적으로 retire합니다.", "function semantic diff가 dependent rebuild plan 없이는 merge되지 않게 합니다."),
    ],
    expertNotes: ["함수 배포 완료는 DDL 성공이 아니라 dependent values/index/replica/client readback까지입니다.", "원본 sample 개인 정보와 실제 함수 argument를 observability에 복사하지 않고 synthetic class/count만 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0204", repository: "dbstudy", path: "02_04.sql", usedFor: ["CREATE FUNCTION, RETURNS, RETURN, DETERMINISTIC, SELECT usage, aggregates and user-variable progression"], evidence: "read-only로 251 logical lines를 확인했으며 sample customer/order literals는 복사하지 않았습니다." },
  { id: "mysql-create-routine", repository: "MySQL 8.4 Reference Manual", path: "CREATE PROCEDURE and CREATE FUNCTION Statements", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-procedure.html", usedFor: ["stored function syntax, RETURNS and characteristics"], evidence: "MySQL 공식 stored routine DDL 문서입니다." },
  { id: "mysql-function-optimization", repository: "MySQL 8.4 Reference Manual", path: "Function Call Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/function-optimization.html", usedFor: ["function evaluation and optimizer behavior"], evidence: "MySQL 공식 function call optimization 문서입니다." },
  { id: "mysql-binary-log", repository: "MySQL 8.4 Reference Manual", path: "The Binary Log", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/binary-log.html", usedFor: ["logging format and replication evidence"], evidence: "MySQL 공식 binary log 문서입니다." },
  { id: "mysql-stored-restrictions", repository: "MySQL 8.4 Reference Manual", path: "Restrictions on Stored Programs", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/stored-program-restrictions.html", usedFor: ["stored function SQL, transaction and dynamic restrictions"], evidence: "MySQL 공식 stored program restrictions 문서입니다." },
  { id: "mysql-object-security", repository: "MySQL 8.4 Reference Manual", path: "Stored Object Access Control", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/stored-objects-security.html", usedFor: ["definer/invoker privilege closure"], evidence: "MySQL 공식 stored object access 문서입니다." },
  { id: "mysql-generated-column-index", repository: "MySQL 8.4 Reference Manual", path: "Optimizer Use of Generated Column Indexes", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/generated-column-index-optimizations.html", usedFor: ["generated expression index matching"], evidence: "MySQL 공식 generated column index 문서입니다." },
  { id: "mysql-generated-column", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE and Generated Columns", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-generated-columns.html", usedFor: ["generated expression restrictions and storage"], evidence: "MySQL 공식 generated column 문서입니다." },
  { id: "mysql-charset-general", repository: "MySQL 8.4 Reference Manual", path: "Character Sets and Collations in General", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/charset-general.html", usedFor: ["charset/collation contract"], evidence: "MySQL 공식 charset/collation 문서입니다." },
  { id: "mysql-collation-names", repository: "MySQL 8.4 Reference Manual", path: "Collation Naming Conventions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/charset-collation-names.html", usedFor: ["collation sensitivity matrix"], evidence: "MySQL 공식 collation naming 문서입니다." },
  { id: "oracle-create-function", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE FUNCTION", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-FUNCTION.html", usedFor: ["Oracle function DDL, AUTHID and DETERMINISTIC"], evidence: "Oracle 공식 CREATE FUNCTION 문서입니다." },
  { id: "oracle-subprograms", repository: "Oracle Database 26ai PL/SQL Language Reference", path: "PL/SQL Subprograms", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/plsql-subprograms.html", usedFor: ["function and procedure semantic boundary"], evidence: "Oracle 공식 PL/SQL subprogram 문서입니다." },
  { id: "oracle-rights", repository: "Oracle Database 26ai PL/SQL Language Reference", path: "Invoker's Rights and Definer's Rights", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/invokers-rights-and-definers-rights-authid-property.html", usedFor: ["AUTHID rights portability"], evidence: "Oracle 공식 rights 문서입니다." },
  { id: "oracle-create-index", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE INDEX", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-INDEX.html", usedFor: ["function-based index requirements"], evidence: "Oracle 공식 CREATE INDEX 문서입니다." },
  { id: "sqlite-deterministic", repository: "SQLite Documentation", path: "Deterministic SQL Functions", publicUrl: "https://www.sqlite.org/deterministic.html", usedFor: ["determinism and schema expression eligibility"], evidence: "SQLite 공식 deterministic function 문서입니다." },
  { id: "sqlite-expression-index", repository: "SQLite Documentation", path: "Indexes On Expressions", publicUrl: "https://www.sqlite.org/expridx.html", usedFor: ["exact expression index laboratory"], evidence: "SQLite 공식 expression index 문서입니다." },
  { id: "sqlite-generated-column", repository: "SQLite Documentation", path: "Generated Columns", publicUrl: "https://www.sqlite.org/gencol.html", usedFor: ["generated deterministic expression restrictions"], evidence: "SQLite 공식 generated columns 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Standard Library", path: "sqlite3.Connection.create_function", publicUrl: "https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.create_function", usedFor: ["application function registration, deterministic flag and exact harness"], evidence: "Python 공식 sqlite3 문서입니다." },
  { id: "jdbc-callable-statement", repository: "Java SE 8 API", path: "java.sql.CallableStatement", publicUrl: "https://docs.oracle.com/javase/8/docs/api/java/sql/CallableStatement.html", usedFor: ["typed function/routine result mapping context"], evidence: "Oracle 공식 Java JDBC API 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-11-stored-function", slug: "db-11-stored-function", courseId: "database", moduleId: "db-programmability-performance", order: 3,
  title: "저장 함수의 반환값과 결정성", subtitle: "RETURN 문법을 type·NULL·실제 결정성·collation·purity·비용·식 인덱스·복제까지 검증된 scalar 계약으로 확장합니다.", level: "고급", estimatedMinutes: 900,
  coreQuestion: "저장 함수가 같은 입력에 정확한 값을 돌려준다는 약속을 type·NULL·환경·optimizer·index·replica까지 지키고, 잘못된 DETERMINISTIC 선언으로 데이터를 손상시키지 않으려면 무엇을 증명해야 할까요?",
  summary: "dbstudy 02_04.sql의 function/RETURNS/RETURN/DETERMINISTIC, aggregate와 SELECT usage progression을 read-only로 감사합니다. scalar contract와 procedure 경계, precision/overflow, NULL·empty·error, 실제 determinism dependency closure, Unicode/collation, session/user-variable side effects, row-by-row cost와 sargability, expression index/generated column coupling, binary log/replica/cache evaluation time, MySQL·Oracle·SQLite deployment/observability를 전문가 수준으로 연결합니다. 원본의 table-reading 함수를 DETERMINISTIC로 표시한 부분은 같은 parameter라도 base snapshot이 바뀌면 result가 변한다는 핵심 반례로 다룹니다. 여섯 exact examples는 pure scalar, exact decimal, NULL truth, Unicode canonicalization, call count와 deterministic expression index를 실행합니다.",
  objectives: ["function을 one-value scalar contract와 allowed SQL contexts로 정의한다.", "RETURNS precision/scale/range/charset과 driver mapping을 검증한다.", "실제 dependency closure와 stability scope로 determinism claim을 증명한다.", "NULL/empty/error/zero와 collation/Unicode canonicalization을 구분한다.", "side effect/session state를 procedure command로 분리한다.", "row-by-row cost, sargability와 function-based index coupling을 측정한다.", "replication/cache/generated evaluation과 versioned rebuild/observability를 운영한다."],
  prerequisites: [{ title: "저장 프로시저와 IN·OUT 파라미터", reason: "명령·transaction·side effect·권한을 procedure에 두는 이유를 알아야 scalar function의 purity 경계를 설계할 수 있습니다.", sessionSlug: "db-10-procedure-in-out" }],
  keywords: ["FUNCTION", "RETURNS", "RETURN", "DETERMINISTIC", "purity", "NULL propagation", "DECIMAL", "collation", "Unicode normalization", "side effects", "sargability", "expression index", "generated column", "binary logging", "replication", "portability"], topics,
  lab: {
    title: "학습 점수 canonicalization·등급 함수를 index/replica-safe v2로 전환하기",
    scenario: "기존 함수가 score table과 session locale을 읽고 DETERMINISTIC로 선언되어 expression index와 report에 사용됩니다. Unicode 중복, NULL/rounding, row-by-row latency와 source/replica 차이를 무중단으로 바로잡아야 합니다.",
    setup: ["이름·주소 없이 synthetic learner/course/code/score keys와 NULL/zero/max/Unicode equivalent/skew fixtures를 만듭니다.", "MySQL 8.4·Oracle 26ai 격리 schemas/replica-equivalent environments와 low/high users를 준비합니다.", "v1/v2 input/return/type/null/collation/determinism/dependency/security contract를 작성합니다.", "function→query/view/index/generated/cache/materialized consumer graph와 expected results를 고정합니다."],
    steps: ["function source/callees에서 table/time/session/user/locale/random dependencies를 inventory합니다.", "normal/NULL/empty/zero/max/rounding input의 exact return과 driver mapping을 검증합니다.", "NFC/NFD/case/accent/locale sessions에서 canonical keys와 collisions를 report합니다.", "base data/timezone/current user/row order를 바꿔 v1 determinism claim의 반례를 재현합니다.", "SELECT/WHERE/ORDER에서 function calls, rows/loops/reads/latency와 set-based alternative를 비교합니다.", "v2 pure function으로 new generated column/expression index를 build하고 full scan result parity를 확인합니다.", "same expression/cast/collation query의 actual index plan과 mismatched expression 반례를 측정합니다.", "source/replica-equivalent sessions에서 definition/settings/results/generated/index lookup을 reconciliation합니다.", "v1/v2 canary query와 error/null/latency/collision telemetry를 비교하고 atomic routing합니다.", "usage zero 뒤 old index/cache/function grants를 revoke observation 후 dependency 역순으로 retire합니다."],
    expectedResult: ["모든 scalar input class가 contract type·NULL·rounding·collation과 정확히 일치합니다.", "v2는 explicit input 외 관찰 가능한 dependency/side effect가 없고 환경 mutation에서도 결정성을 유지합니다.", "set-based 또는 indexed v2가 result parity와 plan/latency budget을 만족합니다.", "source/replica와 full-scan/indexed lookup이 같은 canonical results를 냅니다.", "dependent artifacts가 versioned rebuild되고 v1 rollback/retirement evidence가 보존됩니다."],
    cleanup: ["격리 functions, grants/users, synthetic tables, expression indexes/generated columns와 caches를 dependency 역순으로 제거합니다.", "temporary credentials, collision reports와 traces를 revoke·삭제합니다.", "logs에 raw text/argument/return 또는 원본 sample 개인 정보가 없는지 검사합니다.", "D:\\dev\\dbstudy\\02_04.sql과 production data는 변경하지 않습니다."],
    extensions: ["Oracle result cache와 MySQL generated stored/virtual evaluation matrix를 확장합니다.", "ICU/locale version upgrade에 따른 canonical key migration을 rehearsal합니다.", "function dependency static analyzer와 deterministic proof manifest를 구현합니다.", "replica/binlog format 전환과 point-in-time restore conformance를 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 exact examples를 실행하고 return·NULL·Unicode·call count·index evidence를 표로 정리하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "pure scalar repeat 결과를 비교합니다.", "DECIMAL/empty return을 구분합니다.", "TRUE/FALSE/UNKNOWN predicate를 설명합니다.", "NFC/NFD raw bytes와 canonical key를 비교합니다.", "rows와 function calls가 다른 이유를 적습니다.", "EXPLAIN에서 expression index 이름을 확인합니다."], hints: ["DETERMINISTIC 표시는 proof의 결론이지 시작점이 아닙니다."], expectedOutcome: "함수의 값 계약과 optimizer/index 조건을 실행 증거로 설명합니다.", solutionOutline: ["type→NULL→dependencies→purity→cost→stored keys 순서입니다."] },
    { difficulty: "응용", prompt: "원본 table-reading count/total function을 안전한 학습 progress v2로 재설계하세요.", requirements: ["원본 provenance와 sample 비복사를 기록합니다.", "base snapshot 의존 반례를 재현합니다.", "return range/NULL/rounding/collation을 계약합니다.", "side effect/session variable을 제거합니다.", "join/pre-aggregate와 row-by-row plan을 비교합니다.", "pure canonical function+new index를 병행 build합니다.", "replica/full-scan/index parity를 검증합니다.", "versioned deploy/rebuild/rollback/privacy telemetry를 포함합니다."], hints: ["table aggregate는 함수 parameter만의 deterministic 계산이 아닙니다."], expectedOutcome: "정확성·성능·index·replica 근거가 있는 scalar/data pipeline이 완성됩니다.", solutionOutline: ["dependency audit→counterexample→pure split→set-based/index→reconcile→cutover 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 stored function purity·determinism·index governance를 작성하세요.", requirements: ["scalar responsibility와 prohibited side effects를 정의합니다.", "return type/null/collation/version schema를 둡니다.", "dependency closure/stability scope/proof fixtures를 요구합니다.", "expression index/generated/cache eligibility를 규정합니다.", "function change dependent rebuild/rollback을 정의합니다.", "MySQL·Oracle·SQLite/driver approved differences를 기록합니다.", "replication/logging/source-replica reconciliation을 요구합니다.", "calls/plan/errors/null/privacy/safe retirement telemetry를 포함합니다."], hints: ["문법적으로 허용됨과 index/replica에서 안전함은 다릅니다."], expectedOutcome: "초급 RETURN에서 운영 결정성 플랫폼까지 일관된 전문가 표준이 완성됩니다.", solutionOutline: ["declare→prove→bind type→exclude effects→measure→rebuild→reconcile→retire 순서입니다."] },
  ],
  nextSessions: ["db-12-trigger-old-new"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_04.sql 251 logical lines(5,670 bytes)을 read-only로 확인했습니다. SHA-256은 B65DEA6AA74E68FFD8EA8365F7BE120D5152B139965EE23DEA71ABC65589E2C8입니다.", "원본의 CREATE FUNCTION/RETURNS/RETURN/DETERMINISTIC, aggregates, SELECT usage와 user-variable progression만 provenance로 사용하고 sample 고객·주문 literals는 복사하지 않았습니다.", "table을 읽는 FN_ORDER_COUNT/FN_BOOK_TOTAL류는 같은 parameter라도 base snapshot 변경으로 result가 달라질 수 있어 DETERMINISTIC declaration을 실제 purity proof로 취급하지 않는 반례로 기록했습니다.", "Python/SQLite exact examples는 MySQL/Oracle stored function rights, optimizer, expression index, binary logging/replica behavior를 대체하지 않으며 실제 engine conformance를 lab gate로 요구합니다."] },
});

export default session;
