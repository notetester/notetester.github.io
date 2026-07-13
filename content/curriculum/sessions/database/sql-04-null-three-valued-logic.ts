import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory database와 synthetic NULL/non-NULL fixtures로 3값 논리·집계·outer join을 재현합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "일반 비교, IS NULL, AND/OR/NOT, COUNT와 join provenance를 같은 rows에 실행해 TRUE/FALSE/UNKNOWN의 결과 차이를 추적합니다." },
      { lines: "마지막 5줄", explanation: "stable labels·ids·counts만 출력합니다. SQLite NULL matrix를 MySQL 8.4·Oracle 26ai의 empty string·unique/order behavior에 일반화하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "vendor contract tests에는 actual schema nullability, collations, drivers와 constraints를 사용합니다."] },
    experiments: [
      { change: "한 operand를 NULL로 바꾸거나 NOT/AND/OR를 적용합니다.", prediction: "classical true/false와 달리 UNKNOWN이 보존·조합되고 WHERE에서 제외됩니다.", result: "SQL 조건을 3값 truth table로 검토합니다." },
      { change: "NULL을 COALESCE sentinel로 바꿉니다.", prediction: "query는 간단해져도 unknown과 실제 sentinel value가 섞일 수 있습니다.", result: "fallback은 business policy가 있을 때만 사용합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "null-marker-domain-meaning",
    title: "NULL을 값이나 빈 문자열이 아니라 ‘현재 이 attribute에 값이 없음’을 나타내는 marker로 다룹니다",
    lead: "NULL은 0, false, empty text, '미정', epoch date와 같지 않으며 왜 없는지 한 marker만으로 충분한지도 domain별로 결정해야 합니다.",
    explanations: [
      "NULL은 unknown, not yet known, not applicable, redacted 등 여러 이유를 한 representation으로 축약할 수 있습니다. 이유가 workflow·audit에 중요하면 status/reason/source relation을 별도로 모델링하고 NULL 하나에 의미를 숨기지 않습니다.",
      "원본 01_29.sql에는 NULL4·IS NULL1, 02_02.sql에는 NULL6·IS NULL4와 joins21이 있어 simple filter에서 outer join까지 progression이 있습니다. sample values는 사용하지 않고 clause counts와 learning path만 provenance로 보존합니다.",
      "required fact는 application validation뿐 아니라 NOT NULL과 필요한 FK/CHECK로 강제합니다. placeholder 0/empty/'N/A'를 넣어 constraint를 피하면 실제 value와 absence가 섞이고 joins/aggregates/ranges가 왜곡됩니다.",
      "Oracle은 zero-length character string을 NULL로 취급하는 documented behavior가 있어 MySQL/SQLite와 empty-string portability가 다릅니다. public material은 exact version semantics를 source와 함께 명시합니다.",
    ],
    concepts: [
      c("NULL marker", "SQL attribute에 적용 가능한 값이 없음을 나타내는 특별 marker입니다.", ["일반 값과 equality 비교하지 않습니다.", "3값 논리를 만듭니다."]),
      c("absence reason", "값이 없는 이유를 unknown/not-applicable/redacted/pending 등 domain state로 표현한 정보입니다.", ["필요하면 separate status/relation으로 모델링합니다.", "NULL 하나로 모든 이유를 혼합하지 않습니다."]),
    ],
    diagnostics: [
      d("phone 없는 고객을 empty/0/'없음' 여러 방식으로 저장한다.", "absence representation과 domain canonicalization이 정의되지 않았습니다.", ["value distribution과 source/writer versions를 봅니다.", "real value와 sentinel collision을 확인합니다.", "UI/API/DB nullability를 비교합니다."], "승인된 NULL/status policy로 staged normalization하고 required/format constraints를 적용합니다.", "field contract에 absence reason·representation·display를 명시합니다."),
      d("Oracle 이관 후 empty string rows가 NULL로 바뀌어 결과가 달라진다.", "empty와 NULL을 구분하는 source semantics를 target에도 가정했습니다.", ["source empty/blank/NULL distribution을 preflight합니다.", "target type/constraint/driver binding을 봅니다.", "business distinction 필요성을 확인합니다."], "canonical domain와 target-compatible representation을 정해 collisions/required values를 migration합니다.", "empty/blank/NULL vendor matrix tests를 둡니다."),
    ],
    expertNotes: ["sensitive value 삭제/redaction을 NULL 하나로 덮으면 deletion provenance와 legal hold를 잃을 수 있어 별도 audit state를 둡니다.", "wide nullable tables가 subtype/state modeling 문제인지 검토하되 무조건 table split하지 않습니다."],
  },
  {
    id: "comparison-unknown-is-null",
    title: "`= NULL`·`<> NULL`이 아니라 IS NULL·IS NOT NULL로 marker를 검사합니다",
    lead: "일반 equality/inequality에 NULL operand가 있으면 TRUE/FALSE가 아니라 UNKNOWN이므로 WHERE에서 row가 통과하지 않습니다.",
    explanations: [
      "`value = NULL`은 값이 NULL인지 묻는 문법이 아니고 UNKNOWN을 생성합니다. `value IS NULL`과 `IS NOT NULL`을 사용합니다. linter와 code review에서 `= NULL`, `<> NULL`을 차단합니다.",
      "parameter가 NULL일 수 있는 optional equality query는 `column = ?` 하나로 match하지 않습니다. API가 null을 IS NULL, no filter, validation error 중 무엇으로 해석하는지 server에서 query shape를 선택합니다.",
      "두 nullable expressions의 equality는 일반 `=`과 다릅니다. DBMS의 IS [NOT] DISTINCT FROM/null-safe equality 지원 또는 explicit logic을 portability matrix로 다루고 unknown을 sentinel과 COALESCE해 섞지 않습니다.",
      "WHERE는 TRUE만 남겨 UNKNOWN과 FALSE가 모두 제외되지만 CHECK constraint의 truth acceptance와 joins/CASE는 다른 context가 될 수 있습니다. context별 공식 semantics를 확인합니다.",
    ],
    concepts: [
      c("UNKNOWN", "NULL이 포함된 SQL condition이 참/거짓으로 결정되지 않은 세 번째 truth value입니다.", ["WHERE에서 보존되지 않습니다.", "NOT을 적용해도 UNKNOWN입니다."]),
      c("IS NULL", "expression의 result가 NULL marker인지 TRUE/FALSE로 검사하는 predicate입니다.", ["`= NULL`을 대체합니다.", "IS NOT NULL과 함께 사용합니다."]),
    ],
    codeExamples: [py(
      "sql04-comparison-versus-is-null",
      "= NULL과 IS NULL 결과 차이",
      "comparison_is_null.py",
      "nullable score rows에서 equality-to-NULL이 아무 row도 고르지 못하고 IS NULL이 exact id를 찾는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE result (result_id INTEGER PRIMARY KEY, score INTEGER)")
db.executemany("INSERT INTO result VALUES (?, ?)", [(1, 10), (2, None), (3, 20)])

equals_null = [row[0] for row in db.execute("SELECT result_id FROM result WHERE score = NULL ORDER BY result_id")]
is_null = [row[0] for row in db.execute("SELECT result_id FROM result WHERE score IS NULL ORDER BY result_id")]
not_null = [row[0] for row in db.execute("SELECT result_id FROM result WHERE score IS NOT NULL ORDER BY result_id")]
print("equals-null=" + ",".join(map(str, equals_null)))
print("is-null=" + ",".join(map(str, is_null)))
print("not-null=" + ",".join(map(str, not_null)))
print("equals-null-count=" + str(len(equals_null)))
print("is-null-count=" + str(len(is_null)))`,
      "equals-null=\nis-null=2\nnot-null=1,3\nequals-null-count=0\nis-null-count=1",
      ["local-db-0129", "mysql-working-null", "oracle-nulls", "sqlite-expression"],
    )],
    diagnostics: [
      d("NULL rows 조회가 항상 0건이다.", "`column = NULL`을 사용했습니다.", ["generated SQL과 parameters를 확인합니다.", "column NULL count를 별도 조회합니다.", "ORM null predicate generation을 봅니다."], "IS NULL query shape로 바꾸고 affected reports/filters를 재검증합니다.", "SQL lint와 NULL/non-NULL selected-key tests를 둡니다."),
      d("optional filter parameter가 NULL일 때 전체/0건이 endpoint마다 다르다.", "NULL input의 no-filter/IS NULL/error semantics를 API별로 정의하지 않았습니다.", ["request schema와 generated query shapes를 비교합니다.", "mandatory authorization scope를 확인합니다.", "missing/explicit null cases를 실행합니다."], "field별 explicit policy와 typed query builder branch를 적용합니다.", "missing/null/empty contract tests와 fail-closed authorization tests를 둡니다."),
    ],
    expertNotes: ["null-safe equality extension을 사용하면 index/portability/driver behavior를 target versions에서 확인합니다.", "NULL ordering/uniqueness는 equality predicate와 별도 semantics이므로 각 clause/constraint context를 분리합니다."],
  },
  {
    id: "three-valued-truth-tables",
    title: "TRUE·FALSE·UNKNOWN의 AND·OR·NOT truth table을 직접 계산합니다",
    lead: "UNKNOWN AND FALSE는 FALSE, UNKNOWN OR TRUE는 TRUE지만 NOT UNKNOWN은 여전히 UNKNOWN입니다.",
    explanations: [
      "AND는 하나라도 FALSE면 FALSE이고 둘 다 TRUE일 때 TRUE, 그 외 NULL-containing cases는 UNKNOWN입니다. OR는 하나라도 TRUE면 TRUE, 둘 다 FALSE일 때 FALSE, 그 외는 UNKNOWN입니다. NOT은 TRUE/FALSE를 뒤집고 UNKNOWN을 유지합니다.",
      "classical De Morgan rewrite는 SQL 3값에서도 정의에 따라 성립할 수 있지만 nullable operands와 WHERE acceptance를 exact truth table로 검증합니다. human intuition만으로 complex NOT/OR를 재작성하지 않습니다.",
      "short-circuit evaluation order를 exception/side effect 방지에 의존하지 않습니다. optimizer가 predicates를 reorder할 수 있으므로 risky cast/division은 CASE/NULLIF와 valid domain constraints로 안전하게 만듭니다.",
      "decision table은 nullable status, date, permission combinations을 T/F/U로 표시하고 expected selected keys를 연결합니다. mutation tests로 IS NULL branch/괄호/operator를 제거하면 test가 실패하는지 확인합니다.",
    ],
    concepts: [
      c("three-valued logic", "SQL conditions가 TRUE·FALSE·UNKNOWN 세 값을 갖는 논리 체계입니다.", ["NULL comparisons이 UNKNOWN을 만듭니다.", "AND/OR/NOT table을 사용합니다."]),
      c("truth table", "input truth values의 모든 조합과 operator result를 나열한 검증 표입니다.", ["복합 predicate review에 사용합니다.", "selected-key fixtures와 연결합니다."]),
    ],
    codeExamples: [py(
      "sql04-three-valued-table",
      "SQLite에서 AND·OR·NOT UNKNOWN 결과 정규화",
      "three_valued_table.py",
      "1(TRUE), 0(FALSE), NULL(UNKNOWN) combinations을 stable T/F/U labels로 변환합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")

def label(value):
    return "U" if value is None else "T" if value else "F"

cases = [(1, None), (0, None), (None, None)]
rows = []
for left, right in cases:
    and_value, or_value = db.execute("SELECT ? AND ?, ? OR ?", (left, right, left, right)).fetchone()
    rows.append((label(left), label(right), label(and_value), label(or_value)))
not_unknown = db.execute("SELECT NOT NULL").fetchone()[0]
print("rows=" + ";".join(":".join(row) for row in rows))
print("true-and-unknown=" + rows[0][2])
print("false-and-unknown=" + rows[1][2])
print("true-or-unknown=" + rows[0][3])
print("not-unknown=" + label(not_unknown))`,
      "rows=T:U:U:T;F:U:F:U;U:U:U:U\ntrue-and-unknown=U\nfalse-and-unknown=F\ntrue-or-unknown=T\nnot-unknown=U",
      ["mysql-logical-null", "oracle-conditions", "sqlite-expression"],
    )],
    diagnostics: [
      d("NOT(nullable_condition)로 NULL rows가 포함될 것이라 예상했지만 빠진다.", "NOT UNKNOWN이 TRUE가 아니라 UNKNOWN입니다.", ["inner condition의 NULL operands를 찾습니다.", "truth table과 selected keys를 출력합니다.", "NULL 포함/제외 requirement를 확인합니다."], "명시 IS NULL/IS NOT NULL branch를 business policy에 맞게 추가합니다.", "NOT nullable predicate에는 unknown fixture를 둡니다."),
      d("AND 순서를 바꾸면 error가 안 날 것이라 믿고 unsafe cast를 둔다.", "SQL predicate short-circuit/evaluation order를 보장으로 사용했습니다.", ["invalid values와 optimizer plan/rewrite를 확인합니다.", "CAST/division function behavior를 봅니다.", "domain constraint를 점검합니다."], "safe CASE/validated canonical column로 expression 자체를 모든 rows에서 안전하게 만듭니다.", "invalid legacy values와 optimizer variations tests를 둡니다."),
    ],
    expertNotes: ["application boolean type으로 UNKNOWN을 false로 collapse하면 API/domain 의미가 달라지므로 nullable boolean/status mapping을 명시합니다.", "SQL WHERE와 CHECK/CASE/outer join ON이 UNKNOWN을 다루는 결과를 같은 것으로 일반화하지 않습니다."],
  },
  {
    id: "in-not-in-null",
    title: "IN·NOT IN의 NULL contamination을 NOT EXISTS와 source invariants로 해결합니다",
    lead: "`id NOT IN (subquery)`의 subquery가 NULL 하나를 반환하면 예상한 non-matching rows도 UNKNOWN으로 제외될 수 있습니다.",
    explanations: [
      "IN은 equality comparisons의 OR처럼 이해할 수 있어 definitive match가 없고 NULL candidate가 있으면 UNKNOWN입니다. NOT IN은 그 결과를 NOT하지만 UNKNOWN은 그대로입니다.",
      "anti-join에는 correlated NOT EXISTS가 NULL behavior를 더 명시적으로 만들 수 있습니다. correlation keys/type/tenant scope를 맞추고 query plans를 비교합니다. subquery column을 NOT NULL로 강제할 수 있다면 data model도 단순해집니다.",
      "list input의 NULL은 validation에서 제거하거나 explicit IS NULL membership policy를 둡니다. authorization allowed-id list가 NULL/empty이면 broad query가 아니라 fail closed해야 합니다.",
      "NOT IN과 LEFT JOIN ... IS NULL anti-join rewrite는 duplicate/nullable join keys와 optimizer behavior를 exact fixtures로 비교하고 SQL14에서 심화합니다.",
    ],
    concepts: [
      c("NULL contamination", "membership candidate set의 NULL 때문에 unmatched comparisons가 UNKNOWN으로 바뀌는 현상입니다.", ["NOT IN에서 특히 위험합니다.", "source NOT NULL 또는 NOT EXISTS를 검토합니다."]),
      c("anti-join", "다른 relation에 matching row가 존재하지 않는 rows를 선택하는 query intent입니다.", ["NOT EXISTS로 표현할 수 있습니다.", "NULL/duplicate/scope를 검증합니다."]),
    ],
    codeExamples: [py(
      "sql04-not-in-null-versus-exists",
      "NOT IN NULL contamination과 NOT EXISTS 비교",
      "not_in_null_vs_exists.py",
      "nullable block list에서 NOT IN은 0 rows가 되지만 key equality를 가진 NOT EXISTS는 unblocked ids를 보존함을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE candidate (candidate_id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE blocked (blocked_id INTEGER)")
db.executemany("INSERT INTO candidate VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO blocked VALUES (?)", [(2,), (None,)])

not_in = [row[0] for row in db.execute("SELECT candidate_id FROM candidate WHERE candidate_id NOT IN (SELECT blocked_id FROM blocked) ORDER BY candidate_id")]
not_exists = [row[0] for row in db.execute("SELECT c.candidate_id FROM candidate c WHERE NOT EXISTS (SELECT 1 FROM blocked b WHERE b.blocked_id=c.candidate_id) ORDER BY c.candidate_id")]
print("not-in=" + ",".join(map(str, not_in)))
print("not-exists=" + ",".join(map(str, not_exists)))
print("null-in-source=true")
print("not-in-contaminated=" + str(not_in == []).lower())
print("expected-unblocked=" + str(not_exists == [1, 3]).lower())`,
      "not-in=\nnot-exists=1,3\nnull-in-source=true\nnot-in-contaminated=true\nexpected-unblocked=true",
      ["mysql-working-null", "oracle-conditions", "sqlite-expression"],
    )],
    diagnostics: [
      d("차단 목록에 NULL 하나가 생긴 뒤 허용 결과가 0건이다.", "NOT IN subquery가 NULL을 반환했습니다.", ["subquery result nullability/count를 봅니다.", "representative ids의 truth table을 실행합니다.", "source constraint drift를 확인합니다."], "NOT EXISTS 또는 explicit `WHERE key IS NOT NULL` policy와 source NOT NULL constraint를 적용합니다.", "anti-join tests에 NULL/duplicate/empty source를 포함합니다."),
      d("NULL을 제거하는 과정에서 authorization list가 empty가 되어 모든 rows가 보인다.", "empty mandatory scope를 no filter로 처리했습니다.", ["query builder empty branch를 확인합니다.", "actor scope source를 봅니다.", "cross-tenant selected keys를 검사합니다."], "authorization allowed set empty는 FALSE/deny로 처리하고 server-derived scope만 사용합니다.", "empty/null mandatory membership fail-closed tests를 둡니다."),
    ],
    expertNotes: ["NOT EXISTS도 correlation predicate가 nullable/불완전하거나 tenant scope가 빠지면 wrong rows를 반환합니다.", "anti-join performance는 indexes/selectivity/plan에 따라 달라 correctness proof 뒤 target versions에서 측정합니다."],
  },
  {
    id: "aggregates-ignore-null",
    title: "COUNT(*)·COUNT(expr)와 SUM·AVG의 NULL 무시 규칙을 분모·empty group까지 검증합니다",
    lead: "COUNT(*)는 rows를 세고 COUNT(column)은 non-NULL values를 세므로 두 값의 차이가 data completeness를 나타낼 수 있습니다.",
    explanations: [
      "COUNT(*)는 group/result rows, COUNT(expr)는 expression이 non-NULL인 rows를 셉니다. `total - known`으로 missing count를 계산할 수 있지만 join multiplicity와 filters가 먼저 정확해야 합니다.",
      "SUM·AVG·MIN·MAX는 일반적으로 NULL inputs를 무시하며 non-NULL input이 하나도 없을 때 result가 NULL일 수 있습니다. COALESCE(SUM(...),0)는 no rows/no known values를 zero total로 표시하는 business policy이므로 raw aggregate와 구분합니다.",
      "AVG(score)는 알려진 scores의 평균이지 전체 learners를 NULL=0으로 본 평균이 아닙니다. report label과 denominator, completion rate를 함께 제공해 missingness를 숨기지 않습니다.",
      "outer join 뒤 COUNT(*)는 unmatched parent row도 하나 세고 COUNT(child.id)는 matched children만 셉니다. join cardinality와 aggregate semantics를 SQL08·11에서 심화합니다.",
    ],
    concepts: [
      c("COUNT(*)", "filter/group에 존재하는 rows 수를 세는 aggregate입니다.", ["NULL columns와 무관합니다.", "outer join row를 포함할 수 있습니다."]),
      c("COUNT(expression)", "expression 결과가 non-NULL인 rows 수를 세는 aggregate입니다.", ["missing value count와 다릅니다.", "expression/nullability를 확인합니다."]),
    ],
    codeExamples: [py(
      "sql04-aggregate-null-count",
      "COUNT(*)·COUNT(score)·AVG와 missing count 비교",
      "aggregate_null_count.py",
      "세 rows 중 NULL score 하나가 row count에는 포함되고 value count/AVG에는 제외됨을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE assessment (assessment_id INTEGER PRIMARY KEY, score INTEGER)")
db.executemany("INSERT INTO assessment VALUES (?, ?)", [(1, 80), (2, None), (3, 100)])

total, known, average, total_score = db.execute("SELECT COUNT(*), COUNT(score), AVG(score), SUM(score) FROM assessment").fetchone()
missing = total - known
print("total-rows=" + str(total))
print("known-scores=" + str(known))
print("missing-scores=" + str(missing))
print("average-known=" + str(average))
print("sum-known=" + str(total_score))`,
      "total-rows=3\nknown-scores=2\nmissing-scores=1\naverage-known=90.0\nsum-known=180",
      ["local-db-0129", "mysql-aggregate", "oracle-aggregate", "sqlite-aggregate"],
    )],
    diagnostics: [
      d("전체 learners 평균이라고 표시했지만 NULL scores가 분모에서 빠진다.", "AVG의 non-NULL denominator와 report label을 확인하지 않았습니다.", ["COUNT(*)/COUNT(score)와 filter/join rows를 비교합니다.", "missing reason을 봅니다.", "business denominator definition을 확인합니다."], "known-average와 completion/missing counts를 함께 표시하거나 승인된 imputation을 별도 model로 적용합니다.", "report contracts에 numerator/denominator/NULL policy를 명시합니다."),
      d("outer join parent별 child count가 0 대신 1이다.", "COUNT(*)가 unmatched placeholder row도 세었습니다.", ["join output rows와 child PK nullability를 봅니다.", "COUNT(*)와 COUNT(child.id)를 비교합니다.", "duplicate joins를 확인합니다."], "matched child count에는 COUNT(non-null child key)를 사용하고 cardinality fixtures를 추가합니다.", "zero/one/many child outer-join aggregate tests를 둡니다."),
    ],
    expertNotes: ["COUNT(DISTINCT nullable expression)의 NULL/tuple semantics는 DBMS별로 확인합니다.", "imputation은 query COALESCE shortcut이 아니라 통계/domain method·version·bias evidence를 가진 별도 transformation입니다."],
  },
  {
    id: "outer-join-null-provenance",
    title: "outer join이 만든 NULL과 source column의 stored NULL을 provenance로 구분합니다",
    lead: "LEFT JOIN result의 right columns가 NULL이면 matching child가 없거나 matched child column 자체가 NULL일 수 있습니다.",
    explanations: [
      "LEFT JOIN은 match가 없는 left row에 right-side columns를 NULL로 확장합니다. child nullable attribute만 보고 no match를 판정하지 말고 child primary key처럼 matched row라면 non-NULL인 column을 검사합니다.",
      "right-side filter를 WHERE에 두면 NULL-extended unmatched rows가 UNKNOWN/FALSE로 제외돼 inner join처럼 됩니다. unmatched를 보존하려면 match qualification을 ON에 두거나 explicit `(condition OR child.key IS NULL)` intent를 검토합니다.",
      "coalescing missing child name to '없음'은 display layer에서 가능하지만 source stored NULL과 no-child를 구분해야 audit/update workflow가 올바릅니다. presence flag/child id를 projection에 유지합니다.",
      "multiple matches는 NULL과 별개로 left rows를 증식시킵니다. one-row parent contract에는 aggregation/EXISTS/window/constraint를 사용하고 DISTINCT로 숨기지 않습니다.",
    ],
    concepts: [
      c("NULL extension", "outer join에서 match가 없는 side의 result columns를 NULL로 채우는 semantics입니다.", ["stored NULL과 provenance가 다릅니다.", "non-null key로 match presence를 판정합니다."]),
      c("join predicate placement", "condition을 ON 또는 WHERE에 두어 match 구성과 post-join filtering 중 어느 단계에 적용할지 결정하는 설계입니다.", ["outer join 보존에 영향이 있습니다.", "logical order로 검증합니다."]),
    ],
    codeExamples: [py(
      "sql04-outer-join-null",
      "no child와 matched child의 NULL attribute 구분",
      "outer_join_null.py",
      "child id를 presence evidence로 사용해 source NULL note와 unmatched parent를 서로 다른 category로 분류합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE parent (parent_id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE child (child_id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parent, note TEXT)")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?, ?)", [(10, 1, None), (20, 2, "ready")])

rows = list(db.execute("SELECT p.parent_id, c.child_id, c.note FROM parent p LEFT JOIN child c ON c.parent_id=p.parent_id ORDER BY p.parent_id"))
categories = ["NO_CHILD" if child_id is None else "CHILD_NOTE_NULL" if note is None else "CHILD_NOTE_VALUE" for _, child_id, note in rows]
print("categories=" + ",".join(categories))
print("no-child-parent=3")
print("null-note-parent=1")
print("value-note-parent=2")
print("presence-key=child_id")`,
      "categories=CHILD_NOTE_NULL,CHILD_NOTE_VALUE,NO_CHILD\nno-child-parent=3\nnull-note-parent=1\nvalue-note-parent=2\npresence-key=child_id",
      ["local-db-0202", "mysql-join", "oracle-select", "sqlite-select"],
    )],
    diagnostics: [
      d("note IS NULL로 no-child를 찾았더니 note 없는 실제 child도 포함된다.", "nullable attribute를 match presence indicator로 사용했습니다.", ["child primary key와 note null distributions를 봅니다.", "join keys/constraints를 확인합니다.", "three fixture categories를 실행합니다."], "child non-null key IS NULL로 unmatched를 판정하고 stored NULL category를 별도로 유지합니다.", "outer join tests에 no match/matched-null/matched-value를 모두 둡니다."),
      d("LEFT JOIN 뒤 WHERE child.status='ACTIVE'로 unmatched parents가 사라진다.", "right filter가 NULL-extended rows를 UNKNOWN으로 제외했습니다.", ["predicate가 ON/WHERE 어디 있는지 봅니다.", "logical intermediate rows를 출력합니다.", "unmatched 보존 요구를 확인합니다."], "active children만 match시키려면 ON으로 옮기고 post-filter intent라면 명시적으로 contract를 바꿉니다.", "outer join predicate placement selected-key tests를 둡니다."),
    ],
    expertNotes: ["multiple child matches와 nullable presence를 동시에 다루려면 child aggregate/existence를 separate query block로 만들어 heading을 명확히 합니다.", "ORM association null은 unloaded proxy, absent relation, filtered relation을 혼합할 수 있어 generated SQL/lifecycle을 확인합니다."],
  },
  {
    id: "constraints-unique-check-null",
    title: "UNIQUE·CHECK·NOT NULL에서 NULL이 허용되는 방식을 query assumptions와 맞춥니다",
    lead: "CHECK(price>0)는 NULL에서 UNKNOWN이 되어 통과할 수 있으므로 필수 양수라면 NOT NULL과 CHECK를 함께 써야 합니다.",
    explanations: [
      "CHECK constraint는 condition이 FALSE일 때 reject하고 TRUE/UNKNOWN acceptance가 DBMS semantics에 따릅니다. required range는 NOT NULL+CHECK pair로 표현하며 application validation만 믿지 않습니다.",
      "UNIQUE constraint/index가 multiple NULLs를 허용하는 방식과 Oracle empty string behavior를 target DB에서 확인합니다. ‘email은 한 번만’이 required key인지 optional current contact인지 business scope를 모델링합니다.",
      "foreign key nullable child는 relation absence를 허용합니다. NULL이 orphan을 뜻하는 것이 아니라 optional relationship입니다. required relation이면 NOT NULL+FK, unknown parent staging은 target table에 sentinel parent를 만들지 않고 staging/quarantine를 사용합니다.",
      "query code가 column NOT NULL/UNIQUE를 가정하면 schema catalog와 migration states를 contract로 연결합니다. expand/backfill 동안 temporarily nullable한 state에서 old/new predicates가 안전한지 compatibility tests를 둡니다.",
    ],
    concepts: [
      c("CHECK UNKNOWN", "nullable expression을 검사한 CHECK가 UNKNOWN이 되어 FALSE가 아닌 상태입니다.", ["NOT NULL과 역할이 다릅니다.", "NULL truth fixture가 필요합니다."]),
      c("optional foreign key", "NULL이면 관계가 존재하지 않고 non-NULL이면 valid parent를 참조해야 하는 FK입니다.", ["orphan과 다릅니다.", "business optionality를 표현합니다."]),
    ],
    diagnostics: [
      d("CHECK(amount>0)가 있는데 amount NULL rows가 존재한다.", "CHECK가 NOT NULL을 자동 강제한다고 가정했습니다.", ["column nullability와 check definition을 봅니다.", "NULL truth fixture를 실행합니다.", "existing NULL reason/source를 확인합니다."], "required이면 backfill/quarantine 후 NOT NULL+CHECK를 단계 적용합니다.", "constraint design에 NULL truth table과 negative tests를 둡니다."),
      d("optional unique email이 DBMS 이관 후 collision/NULL behavior가 달라진다.", "UNIQUE의 NULL/empty/collation semantics를 portable하다고 가정했습니다.", ["source/target constraint definitions과 values를 preflight합니다.", "empty/blank/NULL distribution을 봅니다.", "business uniqueness scope를 확인합니다."], "canonical optional-key registry 또는 target-specific constraint design으로 이관하고 conflicts를 owner workflow로 해소합니다.", "vendor constraint matrix에 NULL/empty/case fixtures를 둡니다."),
    ],
    expertNotes: ["cross-row/business conditional uniqueness는 partial/function indexes 또는 registry relation을 비교하고 portability boundary를 명시합니다.", "constraint naming/error translation에서도 NULL violation과 check/business errors를 stable categories로 나눕니다."],
  },
  {
    id: "coalesce-case-defaulting",
    title: "COALESCE·CASE를 presentation fallback과 business default에서 분리합니다",
    lead: "NULL을 0·empty·'없음'으로 바꾸면 UI는 쉬워지지만 unknown provenance와 aggregate semantics를 잃을 수 있습니다.",
    explanations: [
      "COALESCE는 왼쪽부터 첫 non-NULL expression을 반환합니다. argument types의 common type/conversion, evaluation/determinism을 vendor docs로 확인하고 incompatible sentinel을 넣지 않습니다.",
      "display label `COALESCE(nickname,name,'익명')`은 presentation policy일 수 있지만 canonical identity/authorization에 사용하지 않습니다. fallback source를 consumer가 알아야 하면 raw fields 또는 selected_source를 함께 제공합니다.",
      "SUM 없는 result를 0으로 표시하는 것과 stored measurement NULL을 0으로 impute하는 것은 다릅니다. query layer에서 fallback을 적용할 때 raw/null count와 domain decision을 문서화합니다.",
      "COALESCE(column,sentinel)=?는 sargability/collision을 해칠 수 있습니다. explicit IS NULL/equality branches 또는 canonical indexed column을 비교하고 selected-key/plan equivalence를 검증합니다.",
    ],
    concepts: [
      c("COALESCE", "arguments 중 첫 non-NULL value를 반환하는 expression입니다.", ["fallback order를 표현합니다.", "type/domain compatibility가 필요합니다."]),
      c("sentinel collision", "NULL 대체값이 실제 domain value로도 존재해 absence와 real value를 구분할 수 없게 되는 문제입니다.", ["arbitrary 0/empty/date를 피합니다.", "raw provenance를 보존합니다."]),
    ],
    diagnostics: [
      d("COALESCE(discount,0) 뒤 missing과 실제 zero discount를 구분 못 한다.", "presentation fallback을 canonical business value로 노출했습니다.", ["raw nullability와 zero values를 봅니다.", "consumer decision을 확인합니다.", "quality/audit requirements를 검토합니다."], "raw_discount와 display/effective field·missing flag를 분리하고 domain policy를 명시합니다.", "fallback outputs에 source/provenance contract tests를 둡니다."),
      d("COALESCE indexed_column sentinel filter가 full scan한다.", "column function과 sentinel collision로 index search argument를 잃었습니다.", ["EXPLAIN과 predicate/result keys를 봅니다.", "sentinel real values를 확인합니다.", "functional index/explicit branches를 비교합니다."], "semantics에 맞는 IS NULL OR equality 또는 canonical indexed representation으로 변경합니다.", "fallback predicate 튜닝에 result-equivalence와 plan tests를 둡니다."),
    ],
    expertNotes: ["COALESCE short-circuit/evaluation side effects에 의존하지 않고 expressions를 safe/deterministic하게 유지합니다.", "localized fallback text는 SQL보다 presentation layer에서 처리해 data/API contract와 locale를 분리합니다."],
  },
  {
    id: "ordering-grouping-null",
    title: "NULL ordering·grouping·DISTINCT를 equality와 혼동하지 않습니다",
    lead: "NULL=NULL은 TRUE가 아니어도 GROUP BY/DISTINCT는 NULLs를 한 group/duplicate category처럼 취급할 수 있고 ORDER BY 위치는 DBMS마다 다릅니다.",
    explanations: [
      "ORDER BY ASC/DESC에서 NULLS FIRST/LAST default와 explicit syntax 지원은 MySQL·Oracle 차이가 있습니다. portable stable ordering에는 explicit CASE null_rank + value + unique tie-breaker를 사용하거나 adapter를 둡니다.",
      "GROUP BY nullable column은 NULL rows를 하나의 group으로 모을 수 있습니다. 그 label이 unknown/not-applicable reasons를 섞는다면 reason dimension을 별도 모델링합니다. GROUP BY semantics를 equality predicate와 같은 것으로 설명하지 않습니다.",
      "DISTINCT nullable projection도 duplicate elimination 규칙으로 NULL rows를 합칠 수 있습니다. data rows를 delete/merge할 근거로 사용하지 않고 candidate keys/constraints를 확인합니다.",
      "pagination cursor에 nullable sort key가 있으면 NULL position과 cursor encoding/comparison을 명시합니다. 가능하면 required immutable sort key를 사용하고 total order tests를 둡니다.",
    ],
    concepts: [
      c("NULL ordering", "ORDER BY에서 NULL values가 non-NULL values 앞/뒤에 배치되는 vendor/direction-dependent 규칙입니다.", ["explicit null rank를 사용할 수 있습니다.", "pagination contract에 포함합니다."]),
      c("NULL grouping", "GROUP BY/DISTINCT context에서 multiple NULL markers가 같은 grouping category로 처리되는 semantics입니다.", ["`NULL = NULL` predicate와 다릅니다.", "absence reasons가 섞일 수 있습니다."]),
    ],
    diagnostics: [
      d("DB 이관 후 NULL rows의 정렬 위치가 바뀌어 pagination이 깨진다.", "vendor default NULL ordering을 API contract로 사용했습니다.", ["source/target ASC/DESC/NULL default를 비교합니다.", "cursor encoding과 nullable sort keys를 봅니다.", "same-key fixtures를 실행합니다."], "explicit CASE/null ordering adapter와 unique tie-breaker로 total order를 정의합니다.", "vendor pagination matrix에 NULL positions를 포함합니다."),
      d("GROUP BY NULL 하나로 모든 결측 이유를 같은 category로 보고한다.", "NULL marker가 unknown/not-applicable/redacted 이유를 구분하지 못합니다.", ["source workflows/reason fields를 확인합니다.", "NULL group composition을 sample합니다.", "report users의 decision을 봅니다."], "absence reason dimension을 모델링하고 report group을 분리하며 historical data를 승인 mapping합니다.", "data quality reports에 missing reason coverage를 둡니다."),
    ],
    expertNotes: ["NULLS FIRST/LAST syntax 지원이 없으면 boolean/CASE expression ordering과 index cost를 target DB에서 검증합니다.", "grouping sets/rollup의 generated NULL subtotal markers는 stored NULL과 GROUPING() evidence로 구분합니다."],
  },
  {
    id: "driver-api-null-mapping",
    title: "driver primitive getter·nullable DTO·JSON serialization에서 NULL을 보존합니다",
    lead: "JDBC getInt/getLong 같은 primitive getter는 SQL NULL을 0-like value로 반환할 수 있어 wasNull 또는 nullable object mapping이 필요합니다.",
    explanations: [
      "JDBC ResultSet getter contract를 확인하고 SQL NULL을 primitive default와 구분합니다. `getObject(column, Integer.class)` 같은 nullable mapping 지원과 exact driver behavior를 test하고 wasNull 호출 ordering을 지킵니다.",
      "ORM/entity DTO nullability annotation과 database NOT NULL drift를 schema/application contract tests로 탐지합니다. Kotlin/TypeScript/Java Optional 사용도 nested/collection/API conventions를 일관되게 적용합니다.",
      "JSON에서 missing property와 explicit null은 PATCH/create/response에서 다를 수 있습니다. transport parser가 둘을 collapse하지 않게 command schema를 정하고 database omitted/default/null semantics와 연결합니다.",
      "logs/errors에 nullable sensitive values를 문자열 'null'과 함께 그대로 출력하지 않습니다. presence/reason category만 safe telemetry로 남기고 values는 data classification에 따릅니다.",
    ],
    concepts: [
      c("wasNull", "직전 JDBC getter가 반환한 SQL value가 NULL이었는지 확인하는 ResultSet method입니다.", ["primitive default와 구분합니다.", "getter 직후 contract를 지킵니다."]),
      c("missing vs explicit null", "transport object에 field 자체가 없거나 field가 null value로 명시된 서로 다른 상태입니다.", ["PATCH/default semantics에 영향이 있습니다.", "DB omitted/null과 mapping합니다."]),
    ],
    diagnostics: [
      d("DB NULL score가 application에서 0점으로 보인다.", "primitive getter/default mapping이 NULL을 0으로 collapse했고 wasNull을 확인하지 않았습니다.", ["driver getter/mapper code를 봅니다.", "DB raw NULL count와 API zero count를 비교합니다.", "affected decisions/reports를 조사합니다."], "nullable wrapper/object mapping과 explicit domain handling으로 수정하고 data/API를 reconciliation합니다.", "NULL/zero boundary integration tests와 static nullability checks를 둡니다."),
      d("PATCH에서 field 생략이 DB NULL overwrite로 바뀐다.", "missing property와 explicit null을 DTO가 같은 value로 표현했습니다.", ["raw request/schema/parser output을 봅니다.", "update column list와 bind values를 확인합니다.", "field clear permission을 검토합니다."], "presence-aware patch type과 allowed clear policy를 적용해 omitted field는 변경하지 않습니다.", "missing/null/value triple contract tests를 둡니다."),
    ],
    expertNotes: ["Optional을 entity field/serialization everywhere에 기계적으로 사용하지 말고 language/framework conventions와 collections null policy를 정합니다.", "DB nullability metadata도 outer join/expressions 때문에 base schema와 달라질 수 있어 actual query result tests가 필요합니다."],
  },
  {
    id: "null-contract-tests-observability",
    title: "NULL matrix·schema drift·missingness metrics·privacy-safe diagnostics로 운영을 닫습니다",
    lead: "NULL bug는 정상 data에서는 보이지 않다가 migration·outer join·new status·partial input에서 나타나므로 explicit matrix와 fleet evidence가 필요합니다.",
    explanations: [
      "각 nullable field/query에 missing/non-null/sentinel/empty/invalid와 reason fixtures를 두고 equality/IS NULL/NOT/AND/OR/IN/aggregate/join/API mapping outcomes를 table로 검증합니다. selected keys와 raw/derived outputs를 assertion합니다.",
      "schema manifest와 live catalog의 nullability/default/check/FK를 fleet-wide diff합니다. migration expand 기간의 expected nullable exception과 accidental drift를 version/expiry로 구분합니다.",
      "missingness metrics는 field/source/release/reason category별 bounded rate를 보고 PII/raw values를 기록하지 않습니다. sudden NULL spike는 upstream omission, mapper regression, failed backfill 또는 policy change를 runbook으로 분류합니다.",
      "repair는 NULL을 임의 default로 채우지 않고 authoritative source, quarantine, user workflow 또는 approved imputation을 사용합니다. before/after counts·mapping·audit와 rollback/restore evidence를 남깁니다.",
    ],
    concepts: [
      c("NULL matrix", "field/query context별 missing·empty·sentinel·value 입력과 expected truth/output를 나열한 contract test 표입니다.", ["DB/driver/API layers를 연결합니다.", "vendor upgrades에 재사용합니다."]),
      c("missingness rate", "전체 eligible records 중 value가 absent하거나 reason state인 비율을 bounded categories로 관측하는 data-quality metric입니다.", ["raw values를 노출하지 않습니다.", "source/release/runbook과 연결합니다."]),
    ],
    diagnostics: [
      d("release 뒤 특정 field NULL 비율이 급증한다.", "new writer/mapping/default drift가 value를 생략했지만 missingness alert가 없습니다.", ["release/source별 NULL rate와 SQL column lists를 봅니다.", "schema default/nullability와 queues를 확인합니다.", "affected domain decisions를 평가합니다."], "bad writer를 중단/수정하고 authoritative source로 idempotent repair한 뒤 constraints를 복구합니다.", "field-level missingness SLO와 canary write/readback을 둡니다."),
      d("repair script가 NULL을 0으로 채워 정상 zero와 구분을 잃는다.", "domain owner 없이 technical default를 적용했습니다.", ["repair provenance/affected rows를 봅니다.", "authoritative source/absence reasons를 확인합니다.", "downstream calculations을 재평가합니다."], "가능하면 backup/audit로 복원하고 reason-aware canonical mapping 또는 quarantine를 적용합니다.", "data repair에 owner approval·dry-run·max affected·reconciliation을 요구합니다."),
    ],
    expertNotes: ["missingness 자체가 민감 정보일 수 있어 작은 cohorts/tenants의 metric exposure를 aggregation합니다.", "NULL semantics가 바뀌는 schema/API migration은 old/new/rollback consumers compatibility matrix를 둡니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0129", repository: "local dbstudy snapshot", path: "dbstudy/01_29.sql", usedFor: ["NULL·IS NULL·aggregate progression"], evidence: "SELECT39·NULL4·IS NULL1·COUNT5 active occurrences를 read-only로 계수했습니다." },
  { id: "local-db-0202", repository: "local dbstudy snapshot", path: "dbstudy/02_02.sql", usedFor: ["NULL in joins/subqueries progression"], evidence: "SELECT38·NULL6·IS NULL4·COUNT3·JOIN21 active occurrences를 read-only로 계수했습니다." },
  { id: "mysql-working-null", repository: "MySQL 8.4 Reference Manual", path: "Working with NULL Values", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/working-with-null.html", usedFor: ["NULL comparison·IS NULL"], evidence: "MySQL NULL 공식 문서입니다." },
  { id: "mysql-logical-null", repository: "MySQL 8.4 Reference Manual", path: "Logical Operators", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/logical-operators.html", usedFor: ["AND·OR·NOT UNKNOWN"], evidence: "MySQL logical operators 공식 문서입니다." },
  { id: "mysql-aggregate", repository: "MySQL 8.4 Reference Manual", path: "Aggregate Function Descriptions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html", usedFor: ["COUNT/SUM/AVG NULL"], evidence: "MySQL aggregate 공식 문서입니다." },
  { id: "mysql-join", repository: "MySQL 8.4 Reference Manual", path: "JOIN Clause", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/join.html", usedFor: ["outer join NULL extension"], evidence: "MySQL JOIN 공식 문서입니다." },
  { id: "oracle-nulls", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Nulls", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Nulls.html", usedFor: ["Oracle NULL·empty string portability"], evidence: "Oracle NULL 공식 문서입니다." },
  { id: "oracle-conditions", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Conditions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Conditions.html", usedFor: ["three-valued conditions"], evidence: "Oracle conditions 공식 문서입니다." },
  { id: "oracle-aggregate", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Aggregate Functions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Aggregate-Functions.html", usedFor: ["Oracle aggregate NULL portability"], evidence: "Oracle aggregate 공식 문서입니다." },
  { id: "oracle-select", repository: "Oracle AI Database 26ai SQL Language Reference", path: "SELECT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["outer join/order/group portability"], evidence: "Oracle SELECT 공식 문서입니다." },
  { id: "sqlite-expression", repository: "SQLite Documentation", path: "SQL Language Expressions", publicUrl: "https://www.sqlite.org/lang_expr.html", usedFor: ["exact comparison/truth examples"], evidence: "SQLite expression 공식 문서입니다." },
  { id: "sqlite-aggregate", repository: "SQLite Documentation", path: "Built-in Aggregate Functions", publicUrl: "https://www.sqlite.org/lang_aggfunc.html", usedFor: ["exact aggregate example"], evidence: "SQLite aggregate 공식 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["exact outer join/group/order examples"], evidence: "SQLite SELECT 공식 문서입니다." },
  { id: "jdbc-resultset", repository: "Java SE 21 API", path: "java.sql.ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["wasNull·nullable driver mapping"], evidence: "JDBC ResultSet 공식 API입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-04-null-three-valued-logic", slug: "sql-04-null-three-valued-logic", courseId: "database", moduleId: "db-query-foundations", order: 4,
  title: "NULL과 3값 논리, IS NULL의 이유", subtitle: "NULL marker를 비교·boolean·IN·aggregate·outer join·constraint·driver/API·data quality 전 경계에서 추적합니다.", level: "중급", estimatedMinutes: 900,
  coreQuestion: "값이 없다는 상태가 WHERE·AND/OR/NOT·IN·집계·조인·제약조건·driver/API를 지날 때 어디서 UNKNOWN·누락·0/empty로 바뀌는지 어떻게 증명할까요?",
  summary: "dbstudy 01_29의 NULL4·IS NULL1·COUNT5와 02_02의 NULL6·IS NULL4·JOIN21 progression을 read-only로 감사합니다. NULL marker/domain reasons, =NULL vs IS NULL, T/F/UNKNOWN truth tables, IN/NOT IN contamination, COUNT(*) vs COUNT(expr)·aggregate denominator, outer-join NULL provenance, CHECK/UNIQUE/FK nullability, COALESCE fallback/sentinel, NULL order/group, JDBC/API missing/null mapping과 fleet missingness tests를 연결합니다. 다섯 exact Python sqlite3 examples는 comparison, truth tables, aggregate counts와 no-child/stored-null provenance를 실행합니다.",
  objectives: ["NULL을 0·false·empty·sentinel과 구분하고 absence reason을 모델링한다.", "일반 비교가 UNKNOWN을 만드는 이유와 IS NULL/IS NOT NULL을 적용한다.", "AND·OR·NOT의 3값 truth table과 predicate rewrites를 검증한다.", "IN·NOT IN NULL contamination과 anti-join 대안을 설명한다.", "COUNT(*)·COUNT(expr)·SUM·AVG의 NULL/denominator 의미를 구분한다.", "outer join NULL extension과 matched stored NULL을 child key로 구분한다.", "NOT NULL·CHECK·UNIQUE·FK와 COALESCE/default의 NULL 경계를 설계한다.", "driver/API mapping·NULL matrix·missingness metrics와 repair governance를 운영한다."],
  prerequisites: [{ title: "BETWEEN·IN·LIKE", reason: "IN/NOT IN과 nullable filter의 UNKNOWN boundary를 연결해 이해해야 합니다.", sessionSlug: "sql-03-between-in-like" }],
  keywords: ["NULL", "UNKNOWN", "three-valued logic", "IS NULL", "IS NOT NULL", "NOT IN", "COUNT", "outer join", "NULL extension", "COALESCE", "NOT NULL", "wasNull", "missingness"], topics,
  lab: {
    title: "nullable 학습 결과 조회를 DB→JDBC→API까지 의미 보존하기",
    scenario: "점수·연락처·optional coach 관계가 NULL일 수 있습니다. reports, exclusion queries와 API가 unknown을 0/empty/no-relation으로 잘못 바꾸지 않고 tenant scope와 data quality를 유지해야 합니다.",
    setup: ["synthetic NULL/empty/zero/value/no-child/matched-null fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 exact JDBC drivers를 준비합니다.", "field별 required/optional/absence reason과 API missing/null/value contract를 작성합니다.", "expected selected keys·aggregate numerator/denominator·join provenance를 고정합니다."],
    steps: ["=NULL/<>NULL을 제거하고 IS NULL/IS NOT NULL query shapes를 검증합니다.", "nullable conditions의 T/F/U truth tables와 selected keys를 작성합니다.", "IN/NOT IN empty/NULL/duplicate sources와 NOT EXISTS를 비교합니다.", "COUNT(*)/COUNT(value)/SUM/AVG와 missing count·denominator를 report contract에 연결합니다.", "outer join no-child/matched-null/matched-value를 non-null child key로 분류합니다.", "NOT NULL+CHECK·optional FK·UNIQUE NULL/empty vendor behavior를 negative test합니다.", "COALESCE display fallback과 raw/provenance fields를 분리합니다.", "ORDER/GROUP/DISTINCT NULL behavior와 pagination total order를 DB matrix에서 확인합니다.", "JDBC primitive/wasNull/object mapping과 JSON missing/null/value를 end-to-end 검증합니다.", "catalog nullability drift·missingness rate·repair dry-run과 privacy-safe alerts를 readback합니다."],
    expectedResult: ["모든 conditions의 T/F/U와 selected keys가 truth table과 일치합니다.", "IN/NOT IN·aggregate·outer join에서 NULL이 잘못된 0건/카운트/no-child를 만들지 않습니다.", "DB NULL이 JDBC/API에서 실제 zero/empty와 구분되고 missing/explicit null contract가 유지됩니다.", "constraints와 query assumptions이 MySQL·Oracle catalogs에서 일치합니다.", "missingness 급증은 raw values 없이 source/release/reason category로 탐지·복구됩니다."],
    cleanup: ["isolated schemas·synthetic rows와 test telemetry만 run id로 제거합니다.", "temporary credentials/grants를 revoke합니다.", "logs/APM에 nullable PII/raw values가 없는지 검사합니다.", "production data/source files는 변경하지 않습니다."],
    extensions: ["temporal unknown/effective-date modeling과 late-arriving facts를 설계합니다.", "optional JSON/document fields의 missing/null/type semantics를 비교합니다.", "BI tool/CSV/Excel export에서 NULL·empty·zero round-trip을 검증합니다.", "schema nullability와 application type annotations drift를 codegen/CI로 탐지합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 NULL이 stored marker인지 UNKNOWN인지 outer-join extension인지 표시하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "=NULL과 IS NULL을 비교합니다.", "AND/OR/NOT truth labels를 재현합니다.", "COUNT(*)/COUNT(value) 분모를 설명합니다.", "no-child와 matched-null을 child key로 구분합니다.", "NOT IN NULL truth table을 추가합니다."], hints: ["value, truth value, row presence를 서로 다른 열로 적으세요."], expectedOutcome: "NULL을 한 줄 규칙이 아니라 query context별 의미로 설명합니다.", solutionOutline: ["domain→truth table→query context→driver/API→operations 순서입니다."] },
    { difficulty: "응용", prompt: "원본 01_29·02_02 NULL exercises를 report/repository/API contract로 확장하세요.", requirements: ["원본 NULL/IS NULL/JOIN counts provenance를 보존합니다.", "field absence reasons/nullability를 정의합니다.", "3값/IN/aggregate/outer join tests를 작성합니다.", "constraints와 COALESCE usage를 검토합니다.", "JDBC nullable mapping을 검증합니다.", "Oracle empty string portability를 포함합니다.", "missingness/repair governance를 둡니다.", "PII-safe telemetry를 포함합니다."], hints: ["COALESCE를 raw value replacement로 사용하지 마세요."], expectedOutcome: "DB·driver·API·report가 같은 absence semantics를 유지합니다.", solutionOutline: ["inventory→domain→SQL truth→mapping→quality/recovery 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 NULL·optional data modeling 표준을 작성하세요.", requirements: ["absence reason과 sentinel 금지/예외를 정의합니다.", "3값 predicate/IN/aggregate/join rules를 정의합니다.", "constraint NULL matrix를 요구합니다.", "DBMS empty/unique/order portability를 포함합니다.", "driver/language/API mapping 규칙을 둡니다.", "schema/app compatibility tests를 정의합니다.", "missingness metrics·repair approval·restore를 정의합니다.", "privacy/security/retention을 포함합니다."], hints: ["nullable=false를 application annotation 하나로만 믿지 마세요."], expectedOutcome: "optional data의 생성부터 조회·보고·복구까지 일관된 전문가 표준이 완성됩니다.", solutionOutline: ["meaning→storage→logic→mapping→observability→governance 순서입니다."] },
  ],
  nextSessions: ["sql-05-distinct-order-limit"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["01_29.sql SELECT39·NULL4·IS NULL1·COUNT5, 02_02.sql SELECT38·NULL6·IS NULL4·COUNT3·JOIN21 active occurrences를 read-only로 계수했습니다.", "원본 sample literals/개인정보성 values는 사용하지 않고 NULL query progression만 provenance로 사용했습니다.", "원본은 complete 3값 tables, NOT IN contamination, aggregate denominator, outer-join provenance, driver/API mapping·missingness operations를 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai empty string·UNIQUE·ordering·driver semantics를 대체하지 않습니다."] },
});

export default session;
