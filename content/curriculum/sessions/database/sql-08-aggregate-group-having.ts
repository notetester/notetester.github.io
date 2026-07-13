import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory database와 synthetic group/null/join-skew rows를 준비합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "COUNT·SUM·AVG·GROUP BY·HAVING·conditional/pre-aggregation을 실행해 input rows·groups·denominators를 추적합니다." },
      { lines: "마지막 5줄", explanation: "정렬된 group labels·counts·totals·stable booleans만 출력합니다. vendor numeric precision·grouping/optimizer는 MySQL 8.4·Oracle 26ai에서 재검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "실제 report acceptance에는 exact DB/driver decimal·timezone·collation과 representative data distribution을 사용합니다."] },
    experiments: [
      { change: "NULL·duplicate child·empty group 또는 HAVING boundary row를 추가합니다.", prediction: "분자·분모·group cardinality가 달라져 잘못된 집계 가정이 드러납니다.", result: "aggregate output만 아니라 input lineage와 group key를 함께 검증합니다." },
      { change: "join 전에 각 child를 pre-aggregate합니다.", prediction: "fan-out multiplication이 사라지고 independent totals가 canonical source와 일치합니다.", result: "join cardinality를 먼저 고정해야 집계가 정확합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "aggregate-input-output-contract",
    title: "aggregate를 많은 input rows에서 한 summary value/group row를 만드는 축약으로 이해합니다",
    lead: "COUNT·SUM·AVG 결과만 보지 말고 어떤 filtered rows와 expression values가 input이었는지, 결과가 1행인지 group별 여러 행인지 정의합니다.",
    explanations: [
      "aggregate without GROUP BY는 filtered input 전체를 하나의 group처럼 요약하고, GROUP BY는 distinct group key tuples별로 summary row를 만듭니다. WHERE가 먼저 rows를 제한하고 aggregate/HAVING/SELECT가 이어지는 logical model을 사용합니다.",
      "원본 01_29.sql은 GROUP BY4·COUNT5, 01_30.sql은 GROUP BY17·JOIN22로 single-table aggregate에서 joined reports까지 발전합니다. sample literals는 사용하지 않고 clause counts와 progression만 provenance로 보존합니다.",
      "report contract에는 input population/filter time, group dimensions, measure expression/unit/currency, NULL policy, numerator/denominator, refresh time와 ordering을 포함합니다. ‘평균 매출’ 같은 label 하나로 의미를 숨기지 않습니다.",
      "empty input에서 COUNT는 0, 다른 aggregates는 NULL일 수 있습니다. 한 row 반환/0 group rows behavior는 query shape와 grouping에 따라 확인하고 API가 no data와 zero를 구분하도록 합니다.",
    ],
    concepts: [
      c("aggregate function", "여러 input expression values를 COUNT·SUM·AVG·MIN·MAX 같은 한 summary value로 축약하는 function입니다.", ["NULL 처리와 type을 확인합니다.", "group context에서 실행됩니다."]),
      c("measure", "group별로 집계할 수량·금액·duration·count expression과 unit입니다.", ["dimension/group key와 구분합니다.", "분자·분모·currency/time을 명시합니다."]),
    ],
    codeExamples: [py(
      "sql08-aggregate-population",
      "전체 rows·known values·sum·average와 empty 결과 비교",
      "aggregate_population.py",
      "NULL score가 COUNT(*)에는 포함되고 COUNT(score)/AVG에는 제외되며 empty SUM은 NULL임을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE result (result_id INTEGER PRIMARY KEY, score INTEGER)")
db.executemany("INSERT INTO result VALUES (?, ?)", [(1, 70), (2, None), (3, 90)])

total, known, summed, average = db.execute("SELECT COUNT(*), COUNT(score), SUM(score), AVG(score) FROM result").fetchone()
empty_count, empty_sum = db.execute("SELECT COUNT(*), SUM(score) FROM result WHERE result_id > 99").fetchone()
print("total=" + str(total))
print("known=" + str(known))
print("sum=" + str(summed))
print("average=" + str(average))
print("empty=" + f"count:{empty_count},sum:{'NULL' if empty_sum is None else empty_sum}")`,
      "total=3\nknown=2\nsum=160\naverage=80.0\nempty=count:0,sum:NULL",
      ["local-db-0129", "mysql-aggregate", "oracle-aggregate", "sqlite-aggregate"],
    )],
    diagnostics: [
      d("report total이 같은 SQL인데 endpoint마다 다르다.", "input filters/timezone/status/tenant population 또는 join cardinality가 contract에 명시되지 않았습니다.", ["normalized SQL/parameters와 snapshot time을 비교합니다.", "pre-aggregate input keys/counts를 봅니다.", "group/measure definitions를 확인합니다."], "versioned report definition과 common source query를 만들고 historical outputs를 reconciliation합니다.", "report tests에 population keys·measure formula·refresh context를 둡니다."),
      d("no data가 0으로 표시되어 실제 zero와 구분되지 않는다.", "empty SUM/AVG NULL을 presentation에서 무조건 COALESCE했습니다.", ["raw aggregate/null count를 봅니다.", "consumer decision을 확인합니다.", "zero-value rows와 empty filters를 비교합니다."], "raw no-data indicator와 optional display fallback을 분리합니다.", "empty/zero/all-null fixtures를 aggregate contract에 둡니다."),
    ],
    expertNotes: ["approximate aggregates는 error bounds·determinism·mergeability를 명시한 별도 capability로 다룹니다.", "재무 report는 rounding 시점·currency·reconciliation과 audit owner를 aggregate definition에 포함합니다."],
  },
  {
    id: "group-key-functional-dependency",
    title: "GROUP BY key가 한 output row를 유일하게 결정하도록 모든 non-aggregate projection을 검증합니다",
    lead: "group마다 여러 title/name 값이 가능한데 하나를 임의로 SELECT하면 DBMS mode에 따라 오류 또는 nondeterministic representative가 됩니다.",
    explanations: [
      "portable starting rule은 SELECT의 non-aggregate expressions가 GROUP BY에 있거나 group key에 의해 기능적으로 결정됨을 schema constraints로 증명하는 것입니다. MySQL ONLY_FULL_GROUP_BY의 FD detection과 Oracle rules를 exact docs에서 확인합니다.",
      "`GROUP BY customer_id`에서 customer_name을 선택하려면 customer_id가 joined customer relation의 key이고 join이 one-to-one임을 증명합니다. duplicate dimensions나 slowly changing names가 있으면 name grouping/history semantics를 다시 설계합니다.",
      "ANY_VALUE/MIN/MAX로 오류를 감추면 어떤 representative를 선택하는지 business 근거가 사라집니다. latest/first가 필요하면 window/order/tie-breaker와 temporal contract를 명시합니다.",
      "group alias/ordinal 사용은 dialect와 projection reorder에 민감합니다. reusable report에는 explicit qualified group expressions 또는 query block aliases를 사용합니다.",
    ],
    concepts: [
      c("group key", "GROUP BY가 input rows를 같은 group으로 묶는 expression tuple입니다.", ["output group row를 식별합니다.", "NULL/collation/time bucket semantics를 포함합니다."]),
      c("functional dependency in grouping", "group key value가 같으면 projected non-aggregate value도 하나로 결정되는 schema/domain 제약입니다.", ["keys/unique joins로 증명합니다.", "sample coincidence와 다릅니다."]),
    ],
    diagnostics: [
      d("개발 DB에서는 group query가 실행되지만 strict production에서 오류다.", "non-grouped non-aggregate column과 sql_mode/DBMS 차이에 의존했습니다.", ["SELECT/GROUP expressions와 functional dependencies를 봅니다.", "ONLY_FULL_GROUP_BY/mode를 확인합니다.", "dimension key/duplicates를 검사합니다."], "portable explicit grouping 또는 key-preserving dimension join/query block로 수정합니다.", "strict target modes와 vendor matrix에서 report queries를 test합니다."),
      d("group별 name이 실행마다 달라진다.", "group 안 여러 values 중 arbitrary representative를 선택했습니다.", ["group key별 distinct names를 집계합니다.", "temporal/current name requirement를 확인합니다.", "query plan/mode를 봅니다."], "canonical dimension key join 또는 ordered deterministic selection with tie-breaker를 설계합니다.", "group invariant negative fixture와 representative selection contract를 둡니다."),
    ],
    expertNotes: ["functional dependency inference가 optimizer/mode에서 지원돼도 schema constraints가 실제 business uniqueness를 표현하는지 검증합니다.", "dimension attributes가 시간에 따라 변하면 effective-date join과 snapshot/current semantics를 report별로 정합니다."],
  },
  {
    id: "where-versus-having",
    title: "WHERE는 group 전 row를, HAVING은 aggregate 후 group을 걸러냅니다",
    lead: "개별 sale amount 조건과 customer total 조건은 서로 다른 단계이며 잘못 옮기면 분자·분모와 group 존재 자체가 바뀝니다.",
    explanations: [
      "WHERE는 input rows를 aggregate 전에 제거하고 HAVING은 group key/aggregate 결과로 groups를 제거합니다. `WHERE amount >= 100`은 작은 거래를 total에서 빼고 `HAVING SUM(amount)>=100`은 모든 거래를 합산한 뒤 customer를 선택합니다.",
      "row predicate를 HAVING에 넣어도 일부 DBMS가 허용할 수 있지만 intent와 pushdown/portability가 흐려집니다. aggregate가 아닌 deterministic row predicates는 WHERE에 두고 logical plan을 명시합니다.",
      "HAVING alias visibility는 dialect별로 다를 수 있어 portable queries는 aggregate expression 반복 또는 subquery/CTE에서 named measure를 만든 뒤 outer WHERE를 사용합니다.",
      "threshold boundary는 >=/>와 decimal/rounding을 검증합니다. display rounding된 total로 HAVING하지 않고 canonical precision에서 filter한 뒤 presentation을 format합니다.",
    ],
    concepts: [
      c("pre-aggregate filter", "group/aggregate 전에 input rows를 제거하는 WHERE predicate입니다.", ["measure population을 바꿉니다.", "row-level rule에 사용합니다."]),
      c("group filter", "aggregate 후 group key/measure를 기준으로 output groups를 제거하는 HAVING predicate입니다.", ["group-level rule에 사용합니다.", "threshold boundary를 검증합니다."]),
    ],
    codeExamples: [py(
      "sql08-where-having",
      "WHERE row filter와 HAVING group threshold 비교",
      "where_having.py",
      "같은 transactions에서 small rows 제거와 full total group filter가 서로 다른 customer totals를 만드는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE sale (sale_id INTEGER PRIMARY KEY, customer TEXT NOT NULL, amount INTEGER NOT NULL)")
db.executemany("INSERT INTO sale VALUES (?, ?, ?)", [(1, "A", 60), (2, "A", 50), (3, "B", 100), (4, "B", 10)])

where_rows = list(db.execute("SELECT customer, SUM(amount) FROM sale WHERE amount >= 100 GROUP BY customer ORDER BY customer"))
having_rows = list(db.execute("SELECT customer, SUM(amount) FROM sale GROUP BY customer HAVING SUM(amount) >= 100 ORDER BY customer"))
fmt = lambda rows: ";".join(f"{key}:{total}" for key, total in rows)
print("where=" + fmt(where_rows))
print("having=" + fmt(having_rows))
print("where-groups=" + str(len(where_rows)))
print("having-groups=" + str(len(having_rows)))
print("different-population=" + str(where_rows != having_rows).lower())`,
      "where=B:100\nhaving=A:110;B:110\nwhere-groups=1\nhaving-groups=2\ndifferent-population=true",
      ["local-db-0129", "mysql-group-by", "oracle-select", "sqlite-select"],
    )],
    diagnostics: [
      d("소액 거래를 제외하려다 고객 총액 report 자체가 달라진다.", "WHERE와 HAVING requirement를 혼동해 aggregate population을 변경했습니다.", ["input row keys/amounts와 group totals를 비교합니다.", "business rule이 row/group 중 무엇인지 확인합니다.", "old/new selected groups를 diff합니다."], "row eligibility와 group threshold를 별도 predicates로 명시하고 report를 reconciliation합니다.", "WHERE/HAVING counterexample fixtures를 둡니다."),
      d("HAVING threshold boundary에서 report와 UI total이 다르다.", "필터는 raw decimal, UI는 rounded value 또는 그 반대로 적용했습니다.", ["stored/aggregate precision과 rounding layer를 봅니다.", "equal/below/above threshold fixtures를 실행합니다.", "currency unit을 확인합니다."], "canonical precision에서 threshold를 적용하고 display rounding을 분리합니다.", "decimal boundary·rounding policy golden tests를 둡니다."),
    ],
    expertNotes: ["optimizer가 HAVING predicate를 pushdown해도 SQL semantics가 안전한 경우만 수행하므로 manual move는 result equivalence를 증명합니다.", "authorization/tenant filters는 aggregate 전에 mandatory WHERE/ON scope로 적용합니다."],
  },
  {
    id: "count-distinct-null-cardinality",
    title: "COUNT(*)·COUNT(expr)·COUNT(DISTINCT expr)의 row/value/entity cardinality를 구분합니다",
    lead: "세 count는 각각 rows, non-NULL expression values, distinct non-NULL categories/entities를 셀 수 있어 report label과 분모가 달라집니다.",
    explanations: [
      "COUNT(*)는 joined/filter rows, COUNT(child.id)는 matched child rows, COUNT(DISTINCT entity_id)는 duplicate join 뒤 entities를 셀 수 있습니다. DISTINCT를 붙이기 전에 왜 duplicates가 생겼는지 join cardinality를 설명합니다.",
      "COUNT(DISTINCT nullable expression)은 NULL을 count하지 않는 behavior와 multi-expression support/NULL semantics가 DBMS마다 다를 수 있습니다. target official docs와 fixtures로 확인합니다.",
      "distinct users/devices/sessions는 identity scope와 bot/test/internal exclusions, timezone window가 필요합니다. identifier changes/merge와 privacy-preserving analytics도 정의합니다.",
      "대규모 exact distinct는 memory/sort/hash가 비쌀 수 있어 approximate algorithm을 선택할 수 있지만 error bounds·merge/seed·small-cardinality bias와 audit requirements를 분리합니다.",
    ],
    concepts: [
      c("row cardinality", "filter/join 후 result/input rows 수입니다.", ["entity count와 다를 수 있습니다.", "COUNT(*)로 측정할 수 있습니다."]),
      c("distinct cardinality", "expression/group 안 서로 다른 non-NULL categories/identities 수입니다.", ["identity scope를 정의합니다.", "COUNT(DISTINCT ...) semantics를 검증합니다."]),
    ],
    diagnostics: [
      d("join 후 사용자 수가 실제보다 크게 나온다.", "one user가 multiple child rows로 증식했는데 COUNT(*)/COUNT(user_id)를 사용했습니다.", ["user별 joined multiplicity를 봅니다.", "candidate key와 join predicates를 확인합니다.", "pre-join canonical entity count를 비교합니다."], "correct join/pre-aggregation 또는 intentional COUNT(DISTINCT user_id)를 사용하고 provenance를 문서화합니다.", "zero/one/many child fixtures와 cardinality assertions를 둡니다."),
      d("distinct count가 NULL category를 포함한다고 잘못 표시한다.", "COUNT(DISTINCT expr)의 NULL exclusion을 report label에서 설명하지 않았습니다.", ["COUNT(*)/COUNT(expr)/COUNT(DISTINCT expr)와 NULL count를 비교합니다.", "unknown category requirement를 확인합니다.", "vendor behavior를 test합니다."], "missing/unknown count를 별도 measure로 보고하고 distinct known count와 분리합니다.", "report schema에 known/distinct/missing measures를 명시합니다."),
    ],
    expertNotes: ["distinct entity key가 PII이면 raw 값을 analytics logs/intermediate exports에 노출하지 않고 governed surrogate를 사용합니다.", "approximate distinct는 재무/권한/audit decisions에 exact와 동일하게 사용하지 않습니다."],
  },
  {
    id: "conditional-aggregation",
    title: "CASE와 aggregate로 여러 조건 measures를 한 group에서 계산하되 denominator를 명시합니다",
    lead: "`SUM(CASE WHEN status='OK' THEN 1 ELSE 0 END)`는 row count이고 `AVG(CASE...)`는 chosen denominator에 따라 rate가 됩니다.",
    explanations: [
      "conditional COUNT/SUM은 one scan에서 status별 metrics를 만들 수 있습니다. ELSE 0, ELSE NULL, COUNT(CASE WHEN ... THEN 1 END)의 NULL 처리와 denominator 차이를 truth table로 확인합니다.",
      "rates는 numerator/eligible denominator를 별도 expressions로 계산하고 division by zero를 NULLIF/CASE로 정의합니다. percentage rounding은 final presentation에서 수행합니다.",
      "conditions가 mutually exclusive/exhaustive인지 검증하고 unknown/new status를 `OTHER`/quality metric으로 잡습니다. 여러 categories 합계가 total eligible과 맞는 reconciliation invariant를 둡니다.",
      "조건이 반복·복잡하면 query block에서 category/eligibility를 한 번 정의하거나 governed dimension relation을 사용합니다. duplicated CASE definitions drift를 방지합니다.",
    ],
    concepts: [
      c("conditional aggregate", "CASE/FILTER condition을 통해 subset values만 aggregate하는 measure입니다.", ["분자/분모를 명시합니다.", "NULL/ELSE behavior를 검증합니다."]),
      c("reconciliation invariant", "category counts/sums와 total/eligible measures 사이에 항상 성립해야 하는 합계 관계입니다.", ["unknown/overlap을 탐지합니다.", "report acceptance에 사용합니다."]),
    ],
    codeExamples: [py(
      "sql08-conditional-aggregation",
      "status별 count와 성공률 denominator 계산",
      "conditional_aggregation.py",
      "OK·FAIL·PENDING rows에서 completed denominator와 all-row denominator를 분리해 rate 차이를 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE job (job_id INTEGER PRIMARY KEY, status TEXT NOT NULL)")
db.executemany("INSERT INTO job VALUES (?, ?)", [(1, "OK"), (2, "FAIL"), (3, "OK"), (4, "PENDING")])

total, ok_count, fail_count, pending_count = db.execute("SELECT COUNT(*), SUM(CASE WHEN status='OK' THEN 1 ELSE 0 END), SUM(CASE WHEN status='FAIL' THEN 1 ELSE 0 END), SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) FROM job").fetchone()
completed = ok_count + fail_count
completed_rate = ok_count / completed
all_rate = ok_count / total
print("counts=" + f"ok:{ok_count},fail:{fail_count},pending:{pending_count},total:{total}")
print("reconciled=" + str(ok_count + fail_count + pending_count == total).lower())
print("completed-denominator=" + str(completed))
print("completed-rate=" + f"{completed_rate:.3f}")
print("all-rate=" + f"{all_rate:.3f}")`,
      "counts=ok:2,fail:1,pending:1,total:4\nreconciled=true\ncompleted-denominator=3\ncompleted-rate=0.667\nall-rate=0.500",
      ["mysql-control-flow", "mysql-aggregate", "oracle-case", "sqlite-expression"],
    )],
    diagnostics: [
      d("성공률이 팀마다 다른 denominator를 사용한다.", "PENDING/UNKNOWN eligibility를 명시하지 않고 AVG/COUNT formulas가 drift했습니다.", ["numerator/denominator row keys를 비교합니다.", "status lifecycle와 report definitions를 봅니다.", "category reconciliation을 실행합니다."], "versioned eligible/completed condition과 numerator/denominator measures를 중앙화합니다.", "rate contract tests에 each status와 zero denominator를 둡니다."),
      d("새 status 추가 뒤 category 합계가 total보다 작다.", "CASE가 known statuses만 처리하고 unknown/new state를 놓쳤습니다.", ["status distinct values와 counts를 봅니다.", "ELSE/quality bucket을 확인합니다.", "deployment versions를 추적합니다."], "positive categories+OTHER/ERROR quality metric과 enum compatibility를 적용합니다.", "schema enum/status changes에 report reconciliation gate를 둡니다."),
    ],
    expertNotes: ["SQL FILTER clause 지원은 vendor matrix로 관리하고 CASE fallback과 NULL semantics를 비교합니다.", "conditional metrics가 authorization/tenant branches를 중복 구현하지 않게 mandatory scope를 outer input query에 둡니다."],
  },
  {
    id: "numeric-precision-weighted-average",
    title: "SUM·AVG의 type·overflow·decimal precision과 weighted average 공식을 검증합니다",
    lead: "평균들의 단순 평균은 group sizes가 다르면 전체 평균이 아니며 integer division·rounding·overflow가 silently 결과를 바꿀 수 있습니다.",
    explanations: [
      "weighted average는 `SUM(value*weight)/SUM(weight)`이며 denominator zero/NULL policy를 둡니다. subgroup averages를 다시 평균내려면 각 subgroup count/weight를 보존해야 합니다.",
      "integer inputs의 AVG/SUM return type, decimal precision/scale, overflow behavior는 DBMS별로 확인합니다. currency는 smallest unit integer 또는 DECIMAL로 저장하고 floating output을 authoritative money로 쓰지 않습니다.",
      "rounding은 각 row, subgroup, final total 중 언제 하는지 결과가 달라집니다. regulation/business policy와 rounding mode를 명시하고 display formatting과 canonical calculation을 분리합니다.",
      "large sums와 multiplication은 intermediate overflow를 고려해 explicit wider/decimal CAST를 사용합니다. application driver mapping도 BigDecimal/range를 보존합니다.",
    ],
    concepts: [
      c("weighted average", "각 value에 weight를 곱한 합을 weights 합으로 나눈 평균입니다.", ["subgroup size를 보존합니다.", "zero denominator를 처리합니다."]),
      c("rounding stage", "row/group/final 어느 단계에서 precision을 줄이고 어떤 mode를 적용하는지의 계산 계약입니다.", ["결과/reconciliation에 영향이 있습니다.", "presentation과 분리합니다."]),
    ],
    codeExamples: [py(
      "sql08-weighted-average",
      "평균의 평균과 weighted overall average 비교",
      "weighted_average.py",
      "크기가 다른 두 groups에서 simple group-average mean이 전체 row average와 다름을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE score (group_name TEXT NOT NULL, value INTEGER NOT NULL)")
db.executemany("INSERT INTO score VALUES (?, ?)", [("A", 100), ("B", 0), ("B", 0), ("B", 0)])

groups = list(db.execute("SELECT group_name, COUNT(*), AVG(value) FROM score GROUP BY group_name ORDER BY group_name"))
simple_mean = sum(row[2] for row in groups) / len(groups)
weighted = sum(row[1] * row[2] for row in groups) / sum(row[1] for row in groups)
direct = db.execute("SELECT AVG(value) FROM score").fetchone()[0]
print("groups=" + ";".join(f"{name}:{count}:{avg:.1f}" for name, count, avg in groups))
print("simple-group-mean=" + f"{simple_mean:.1f}")
print("weighted=" + f"{weighted:.1f}")
print("direct=" + f"{direct:.1f}")
print("weighted-matches-direct=" + str(weighted == direct).lower())`,
      "groups=A:1:100.0;B:3:0.0\nsimple-group-mean=50.0\nweighted=25.0\ndirect=25.0\nweighted-matches-direct=true",
      ["mysql-aggregate", "oracle-aggregate", "sqlite-aggregate"],
    )],
    diagnostics: [
      d("지점 평균을 다시 평균내 전체 평균이 틀린다.", "subgroup sizes를 무시한 unweighted mean-of-means를 사용했습니다.", ["group counts/sums/averages를 봅니다.", "direct raw-row result와 비교합니다.", "eligible weights definition을 확인합니다."], "SUM(value*weight)/SUM(weight) 또는 total sum/count로 계산하고 report를 reconciliation합니다.", "unequal group size fixtures와 zero weight tests를 둡니다."),
      d("큰 합계가 overflow/precision loss를 일으킨다.", "input/intermediate/result type capacity와 driver mapping을 확인하지 않았습니다.", ["catalog/result metadata와 max volume을 계산합니다.", "CAST/implicit promotion을 봅니다.", "boundary rows로 DB/driver를 test합니다."], "wider DECIMAL/integer type과 safe application mapping을 적용해 affected totals를 복구합니다.", "capacity horizon·max-value aggregate tests와 alerts를 둡니다."),
    ],
    expertNotes: ["statistical variance/stddev functions의 population/sample distinction과 numeric stability는 SQL09에서 심화합니다.", "financial reconciliation에서는 line/item/tax rounding rule과 ledger totals를 authoritative policy로 연결합니다."],
  },
  {
    id: "join-fanout-preaggregation",
    title: "여러 1:N joins의 fan-out multiplication을 pre-aggregation과 keys로 차단합니다",
    lead: "order 하나에 items 2개와 payments 3개를 동시에 join하면 6 rows가 되어 item total과 payment total이 각각 반복 합산됩니다.",
    explanations: [
      "aggregate 전에 join graph cardinality를 그립니다. independent child collections를 raw rows로 동시에 join하면 Cartesian within parent가 생깁니다. COUNT(DISTINCT) 하나로 모든 measures를 고칠 수 없습니다.",
      "각 child를 parent key로 pre-aggregate한 query block/CTE 뒤 one-row-per-parent 결과를 join하거나 separate queries를 사용합니다. zero-child parent를 보존하려면 LEFT JOIN과 COALESCE display policy를 명시합니다.",
      "pre-aggregation group key와 join key에 tenant scope를 포함하고 child duplicate/integrity를 constraints로 방어합니다. derived total과 canonical ledger를 reconciliation합니다.",
      "optimizer가 subquery를 merge/pushdown해도 semantics는 유지되어야 하며 EXPLAIN에서 input cardinalities, temp/materialization과 indexes를 측정합니다.",
    ],
    concepts: [
      c("fan-out multiplication", "독립적인 1:N child relations를 동시에 join해 parent당 row 수가 child counts의 곱으로 늘어나는 현상입니다.", ["aggregates를 과대 계산합니다.", "pre-aggregate/separate query를 사용합니다."]),
      c("pre-aggregation", "child relation을 parent key별 one-row summary로 먼저 축약한 뒤 다른 relations와 join하는 pattern입니다.", ["measure multiplicity를 보호합니다.", "zero/missing semantics를 검증합니다."]),
    ],
    codeExamples: [py(
      "sql08-fanout-preaggregate",
      "items·payments fan-out 잘못된 합계와 pre-aggregate 정답 비교",
      "fanout_preaggregate.py",
      "2 items×3 payments join이 totals를 반복시키고 각 child pre-aggregation이 canonical totals를 복구함을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE orders(order_id INTEGER PRIMARY KEY); CREATE TABLE item(order_id INTEGER, amount INTEGER); CREATE TABLE payment(order_id INTEGER, amount INTEGER);")
db.execute("INSERT INTO orders VALUES (1)")
db.executemany("INSERT INTO item VALUES (1, ?)", [(10,), (20,)])
db.executemany("INSERT INTO payment VALUES (1, ?)", [(5,), (10,), (15,)])

wrong = db.execute("SELECT SUM(i.amount), SUM(p.amount), COUNT(*) FROM orders o JOIN item i USING(order_id) JOIN payment p USING(order_id) WHERE o.order_id=1").fetchone()
correct = db.execute("SELECT i.total, p.total FROM orders o JOIN (SELECT order_id,SUM(amount) total FROM item GROUP BY order_id) i USING(order_id) JOIN (SELECT order_id,SUM(amount) total FROM payment GROUP BY order_id) p USING(order_id) WHERE o.order_id=1").fetchone()
print("fanout-rows=" + str(wrong[2]))
print("wrong=" + f"items:{wrong[0]},payments:{wrong[1]}")
print("correct=" + f"items:{correct[0]},payments:{correct[1]}")
print("canonical-item-total=30")
print("canonical-payment-total=30")`,
      "fanout-rows=6\nwrong=items:90,payments:60\ncorrect=items:30,payments:30\ncanonical-item-total=30\ncanonical-payment-total=30",
      ["local-db-0130", "mysql-join", "mysql-group-by", "oracle-select", "sqlite-select"],
    )],
    diagnostics: [
      d("items와 payments를 추가한 뒤 두 합계가 모두 몇 배 커진다.", "independent child collections를 raw join한 뒤 aggregate했습니다.", ["parent별 child counts와 joined row count를 비교합니다.", "measure lineage를 봅니다.", "canonical child-only totals를 계산합니다."], "각 child를 parent/tenant key로 pre-aggregate한 뒤 join하고 affected reports를 reconciliation합니다.", "0/1/many×0/1/many fan-out fixtures를 report suite에 둡니다."),
      d("COUNT(DISTINCT item.id)는 맞지만 SUM(item.amount)는 여전히 크다.", "distinct identity count correction을 amount multiplicity에도 적용했다고 착각했습니다.", ["joined item id multiplicity와 sum contributions를 봅니다.", "sum distinct value collision을 검토합니다.", "pre-aggregate result를 비교합니다."], "SUM(DISTINCT amount) shortcut을 피하고 item relation에서 one-row-per-item/parent aggregate를 계산합니다.", "measure마다 grain과 additive dimensions를 문서화합니다."),
    ],
    expertNotes: ["star schema에서 facts 간 joins도 conformed dimensions/bridge와 grain을 명시하지 않으면 double counting이 생깁니다.", "pre-aggregate materialized projection을 쓰면 freshness/watermark/rebuild/reconciliation을 운영합니다."],
  },
  {
    id: "time-buckets-null-groups",
    title: "시간 bucket·NULL group·timezone·late data를 report dimension 계약으로 만듭니다",
    lead: "DATE(timestamp) GROUP BY는 session timezone과 function/index cost, DST·late events를 숨길 수 있습니다.",
    explanations: [
      "UTC instant를 business timezone의 local day/week/month으로 bucket할 owner를 정하고 timezone/version을 query/report metadata에 남깁니다. half-open bucket boundaries와 calendar dimension을 비교합니다.",
      "function(column) grouping/filter는 index와 CPU에 영향을 줄 수 있어 generated bucket column, calendar join, range predicate+projection 또는 warehouse transformation을 benchmark합니다.",
      "NULL dimension values는 한 unknown group에 모이므로 missing reason/source를 별도 dimension으로 보고합니다. outer join generated NULL subtotal과 GROUPING SETS subtotal NULL도 GROUPING() 등 evidence로 구분합니다.",
      "late-arriving/corrected events가 historical buckets를 바꾸면 watermark/finalization/restate policy가 필요합니다. report snapshot/version과 rebuild/reconciliation을 운영합니다.",
    ],
    concepts: [
      c("time bucket", "event timestamp를 business timezone/calendar의 day/week/month 등 reporting dimension으로 매핑한 값입니다.", ["boundary/timezone을 명시합니다.", "late data policy가 필요합니다."]),
      c("report watermark", "어느 event time/ingestion progress까지 report가 포함·안정화되었는지 나타내는 경계입니다.", ["late arrivals/rebuild를 설명합니다.", "snapshot metadata에 포함합니다."]),
    ],
    diagnostics: [
      d("같은 UTC events의 일별 count가 region마다 다르다.", "session/default timezone이 달라 local date bucket이 바뀌었습니다.", ["storage/session/business timezone과 tzdb versions를 봅니다.", "boundary instants를 region별 변환합니다.", "report query context를 비교합니다."], "report별 business timezone을 명시해 one layer에서 bucket하고 historical outputs를 restate합니다.", "DST/timezone matrix와 report metadata tests를 둡니다."),
      d("NULL dimension group이 너무 커져 원인을 알 수 없다.", "unknown/not-applicable/redacted/failed-lookup reasons를 NULL 하나로 합쳤습니다.", ["source/reason distributions를 봅니다.", "FK/ETL errors와 late dimension을 확인합니다.", "report users의 action을 정의합니다."], "reason/status dimension과 data quality metrics로 분리하고 safe backfill/reconciliation을 수행합니다.", "missing reason completeness SLO와 owner를 둡니다."),
    ],
    expertNotes: ["week numbering/year boundary는 ISO/business calendar 규칙을 명시하고 locale formatting과 구분합니다.", "GROUPING SETS/ROLLUP/CUBE는 SQL09에서 보강하되 subtotal marker를 stored NULL과 구분합니다."],
  },
  {
    id: "aggregate-performance-plans",
    title: "aggregate plan·memory·sort/hash·index·spill·parallelism을 representative data로 측정합니다",
    lead: "GROUP BY가 맞는 결과를 내도 high-cardinality keys와 wide rows, join fan-out은 memory/temp spill·replica lag·timeout을 만들 수 있습니다.",
    explanations: [
      "EXPLAIN/ANALYZE에서 input rows, grouping strategy, sort/hash, temp/spill, indexes, parallel workers와 estimates/actuals를 봅니다. DBMS가 stream/index aggregate를 선택할 조건과 statistics를 target docs로 확인합니다.",
      "WHERE mandatory/pushable filters와 minimal grouping/projection으로 input width/cardinality를 줄이되 result equivalence를 key/measure checksums로 증명합니다. DISTINCT를 performance patch로 남용하지 않습니다.",
      "대형 reports는 replica/warehouse/materialized summary, incremental aggregation과 cache를 비교합니다. freshness, transaction consistency, rebuild, failover와 authorization가 architecture 일부입니다.",
      "concurrency/resource governance에는 statement timeout, work memory/temp/storage budgets, cancellation, admission/rate limits와 query priorities를 둡니다. one user report가 OLTP를 고갈시키지 않게 분리합니다.",
    ],
    concepts: [
      c("aggregate spill", "grouping/sort/hash state가 memory budget을 넘어 temp/disk에 기록되는 실행 상태입니다.", ["latency/IO를 높입니다.", "cardinality estimates와 budgets를 봅니다."]),
      c("incremental aggregate", "new/changed source facts만 반영해 summary를 갱신하는 projection입니다.", ["watermark/idempotency가 필요합니다.", "full rebuild/reconciliation을 유지합니다."]),
    ],
    diagnostics: [
      d("GROUP BY가 data growth 뒤 temp disk를 소진한다.", "group cardinality/row width를 과소 추정하고 spill/storage budget이 없습니다.", ["actual groups/input rows/temp/spill을 봅니다.", "join fan-out와 unused columns를 확인합니다.", "stats freshness/skew를 측정합니다."], "input/filter/grain을 줄이고 appropriate index/summary architecture와 resource limits를 적용합니다.", "growth-scale benchmark·temp alerts·abort criteria를 둡니다."),
      d("materialized summary는 빠르지만 totals가 source와 다르다.", "incremental refresh가 duplicate/missing events를 처리하지 못하고 reconciliation/rebuild가 없습니다.", ["watermark/event ids/source totals를 비교합니다.", "failed retries/deletes/updates를 추적합니다.", "refresh ownership을 봅니다."], "idempotent change processing과 full checksum/rebuild로 projection을 복구합니다.", "summary freshness/mismatch SLO와 scheduled reconciliation을 둡니다."),
    ],
    expertNotes: ["EXPLAIN ANALYZE류가 실제 query를 실행하므로 production report 비용/permissions와 cancellation을 확인합니다.", "parallel aggregate는 floating summation order/determinism과 resource competition을 report tolerance에 포함합니다."],
  },
  {
    id: "report-contract-tests-operations",
    title: "report golden facts·reconciliation·versioning·privacy-safe telemetry로 집계 운영을 닫습니다",
    lead: "aggregate SQL 파일 하나보다 measure definition, expected source facts, version, refresh/correction과 consumer contract가 함께 있어야 수치를 신뢰할 수 있습니다.",
    explanations: [
      "minimal fixtures는 zero/one/many groups, all-null/mixed, duplicate join, threshold equality, unknown status, unequal weights와 time boundary를 포함합니다. expected input keys와 group rows/measures를 assertion합니다.",
      "production reconciliation은 detail sum→group totals→grand total, category sums=eligible total, source facts=summary+approved excludes를 확인합니다. sampled only가 아니라 money/audit-critical metrics는 exact owned controls를 둡니다.",
      "report definition은 id/version, SQL hash, schema/driver versions, population/measure formulas, timezone/currency/rounding, freshness/watermark와 owner를 기록합니다. breaking metric changes는 side-by-side period와 restatement policy를 둡니다.",
      "telemetry에는 report id/version, input/group/output counts, latency/spill/refresh lag와 safe error category를 남기고 group keys/PII/raw SQL values를 high-cardinality labels에 넣지 않습니다.",
    ],
    concepts: [
      c("report definition", "population·dimensions·measures·NULL/rounding/time/freshness를 versioned하게 설명하는 contract입니다.", ["SQL hash/owner와 연결합니다.", "consumer change를 관리합니다."]),
      c("reconciliation control", "detail/source facts와 aggregate outputs 사이 합계·count·checksum invariant를 독립적으로 검증하는 통제입니다.", ["double count/missing refresh를 탐지합니다.", "repair/restate와 연결합니다."]),
    ],
    diagnostics: [
      d("dashboard와 재무 export가 같은 이름인데 다른 값을 낸다.", "measure/population/timezone/rounding versions가 문서화·공유되지 않았습니다.", ["report definitions/SQL hashes/parameters를 비교합니다.", "source keys and reconciliation totals를 봅니다.", "refresh timestamps를 확인합니다."], "canonical versioned metric 또는 명시적으로 다른 metrics로 rename하고 historical outputs를 restate합니다.", "metric registry와 cross-output reconciliation tests를 둡니다."),
      d("report logs에 group별 email/tenant ids가 대량 저장된다.", "debug group values를 telemetry dimensions로 사용했습니다.", ["logs/APM/metrics cardinality와 content를 검사합니다.", "access/retention/exports를 추적합니다.", "privacy incident scope를 평가합니다."], "raw dimensions를 제거하고 bounded report/version/count/error metrics만 남기며 노출 data를 승인 절차로 처리합니다.", "telemetry schema allowlist와 privacy/cardinality CI를 둡니다."),
    ],
    expertNotes: ["metric corrections/restatements는 old dashboards/caches/downloads와 decision audit에 전달하는 communication/version policy가 필요합니다.", "report access control은 aggregate여도 small groups/re-identification 위험을 minimum cohort/suppression으로 검토합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0129", repository: "local dbstudy snapshot", path: "dbstudy/01_29.sql", usedFor: ["aggregate/GROUP BY introduction"], evidence: "SELECT39·GROUP BY4·COUNT5 active occurrences를 read-only로 계수했습니다." },
  { id: "local-db-0130", repository: "local dbstudy snapshot", path: "dbstudy/01_30.sql", usedFor: ["joined/grouped report progression"], evidence: "SELECT34·GROUP BY17·JOIN22 active occurrences를 read-only로 계수했습니다." },
  { id: "mysql-aggregate", repository: "MySQL 8.4 Reference Manual", path: "Aggregate Function Descriptions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html", usedFor: ["COUNT·SUM·AVG·DISTINCT NULL/types"], evidence: "MySQL aggregate 공식 문서입니다." },
  { id: "mysql-group-by", repository: "MySQL 8.4 Reference Manual", path: "MySQL Handling of GROUP BY", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html", usedFor: ["functional dependency·ONLY_FULL_GROUP_BY"], evidence: "MySQL GROUP BY 공식 문서입니다." },
  { id: "mysql-control-flow", repository: "MySQL 8.4 Reference Manual", path: "Flow Control Functions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/flow-control-functions.html", usedFor: ["conditional aggregate CASE"], evidence: "MySQL flow control 공식 문서입니다." },
  { id: "mysql-join", repository: "MySQL 8.4 Reference Manual", path: "JOIN Clause", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/join.html", usedFor: ["fan-out/pre-aggregation inputs"], evidence: "MySQL JOIN 공식 문서입니다." },
  { id: "oracle-aggregate", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Aggregate Functions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Aggregate-Functions.html", usedFor: ["Oracle aggregate portability"], evidence: "Oracle aggregate 공식 문서입니다." },
  { id: "oracle-select", repository: "Oracle AI Database 26ai SQL Language Reference", path: "SELECT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["GROUP BY/HAVING/join/report portability"], evidence: "Oracle SELECT 공식 문서입니다." },
  { id: "oracle-case", repository: "Oracle AI Database 26ai SQL Language Reference", path: "CASE Expressions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CASE-Expressions.html", usedFor: ["conditional aggregate portability"], evidence: "Oracle CASE 공식 문서입니다." },
  { id: "sqlite-aggregate", repository: "SQLite Documentation", path: "Built-in Aggregate Functions", publicUrl: "https://www.sqlite.org/lang_aggfunc.html", usedFor: ["exact aggregate examples"], evidence: "SQLite aggregate 공식 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["exact GROUP BY/HAVING/join examples"], evidence: "SQLite SELECT 공식 문서입니다." },
  { id: "sqlite-expression", repository: "SQLite Documentation", path: "SQL Language Expressions", publicUrl: "https://www.sqlite.org/lang_expr.html", usedFor: ["exact CASE/null/division expressions"], evidence: "SQLite expression 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-08-aggregate-group-having", slug: "sql-08-aggregate-group-having", courseId: "database", moduleId: "db-query-foundations", order: 8,
  title: "COUNT·SUM·AVG, GROUP BY와 HAVING", subtitle: "집계 문법을 population·grain·NULL·denominator·fan-out·precision·time bucket·plan·reconciliation 계약으로 확장합니다.", level: "중급", estimatedMinutes: 900,
  coreQuestion: "어떤 source rows를 어떤 group grain과 measure/denominator로 요약했는지 증명하고, NULL·join fan-out·rounding·time·refresh로 수치가 왜곡되지 않게 하려면 무엇을 검증할까요?",
  summary: "dbstudy 01_29의 GROUP BY4·COUNT5와 01_30의 GROUP BY17·JOIN22 progression을 read-only로 감사합니다. aggregate population/empty/NULL, group key functional dependency, WHERE vs HAVING, COUNT row/value/distinct cardinality, CASE conditional rates, weighted averages/precision, independent 1:N join fan-out와 pre-aggregation, time buckets/NULL groups/watermarks, aggregate spill/plans와 versioned report reconciliation을 연결합니다. 다섯 exact Python sqlite3 examples는 population, WHERE/HAVING, conditional rates, weighted average와 fan-out correction을 실행합니다.",
  objectives: ["aggregate input population·group dimensions·measure·empty/NULL contract를 정의한다.", "group keys가 non-aggregate projections를 기능적으로 결정함을 증명한다.", "WHERE pre-filter와 HAVING group-filter의 measure 차이를 구분한다.", "COUNT(*)·COUNT(expr)·COUNT(DISTINCT)의 row/value/entity cardinality를 설명한다.", "conditional aggregate의 numerator/denominator와 category reconciliation을 검증한다.", "weighted average·decimal precision·rounding·overflow를 올바르게 계산한다.", "join fan-out을 grain 분석과 child pre-aggregation으로 제거한다.", "time buckets·plans/spills·summary freshness와 report reconciliation을 운영한다."],
  prerequisites: [{ title: "날짜·시간 함수", reason: "time bucket과 half-open report population을 정확히 정의해야 합니다.", sessionSlug: "sql-07-date-time-functions" }],
  keywords: ["COUNT", "SUM", "AVG", "GROUP BY", "HAVING", "grain", "functional dependency", "conditional aggregation", "weighted average", "fan-out", "pre-aggregation", "time bucket", "reconciliation"], topics,
  lab: {
    title: "주문·결제·학습 완료 KPI를 double-count 없이 구축하기",
    scenario: "tenant별 order items, payments, learner results와 statuses를 일/월/tenant로 요약합니다. NULL scores, pending jobs, 여러 items/payments와 late events가 있어도 KPI가 canonical facts와 일치해야 합니다.",
    setup: ["synthetic zero/one/many/null/skew/time-boundary fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 representative indexes/stats를 준비합니다.", "각 report population·grain·measure·denominator·timezone·currency·freshness definition을 작성합니다.", "source detail checksums와 expected group rows를 고정합니다."],
    steps: ["filtered input keys/rows와 aggregate empty/all-null behavior를 검증합니다.", "group key/non-aggregate FDs와 strict GROUP BY compatibility를 확인합니다.", "row eligibility WHERE와 group threshold HAVING counterexamples를 실행합니다.", "COUNT row/non-null/distinct entity와 missing measure를 분리합니다.", "status별 conditional numerators/eligible denominator와 reconciliation을 정의합니다.", "weighted averages·decimal casts·rounding stage와 zero denominator를 검증합니다.", "items/payments를 parent별 pre-aggregate해 raw join fan-out totals와 비교합니다.", "business timezone half-open buckets와 late-event watermark/restatement를 적용합니다.", "EXPLAIN에서 input/groups/spill/temp/index/rows examined과 SLO를 측정합니다.", "source facts=groups+excludes, category totals=eligible와 summary freshness/privacy telemetry를 readback합니다."],
    expectedResult: ["모든 group rows가 versioned population/grain/measure contract와 일치합니다.", "NULL/missing/empty와 numerator/denominator가 명시되고 zero로 collapse되지 않습니다.", "independent child joins가 measures를 증식시키지 않고 canonical detail totals와 같습니다.", "weighted/rounded/time-bucket results가 MySQL·Oracle matrix에서 승인 policy와 일치합니다.", "report version·watermark·reconciliation·plan/spill telemetry가 raw PII 없이 운영됩니다."],
    cleanup: ["isolated schemas·synthetic rows와 summary/test telemetry만 run id로 제거합니다.", "temporary credentials/materialized objects를 revoke·삭제합니다.", "logs/exports에 group keys·PII가 없는지 검사합니다.", "production source data/files는 변경하지 않습니다."],
    extensions: ["GROUPING SETS·ROLLUP·CUBE와 subtotal NULL provenance를 설계합니다.", "incremental/materialized aggregates와 late correction rebuild를 구현합니다.", "warehouse star schema grain·slowly changing dimensions를 비교합니다.", "approximate distinct/percentile error bounds와 exact audit path를 평가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 measure의 input rows·group key·분자·분모를 표로 쓰세요.", requirements: ["stdout 완전 일치를 확인합니다.", "empty/all-null aggregate를 구분합니다.", "WHERE와 HAVING populations를 비교합니다.", "conditional categories를 total과 reconciliation합니다.", "weighted average가 direct average와 같음을 확인합니다.", "fan-out wrong/correct totals를 비교합니다."], hints: ["결과 값보다 grain과 input key list를 먼저 적으세요."], expectedOutcome: "집계를 함수 호출이 아니라 검증 가능한 report contract로 설명합니다.", solutionOutline: ["population→grain→measure→filter→precision→reconciliation 순서입니다."] },
    { difficulty: "응용", prompt: "원본 01_29·01_30 aggregates를 tenant KPI report layer로 재구성하세요.", requirements: ["원본 GROUP/COUNT/JOIN counts provenance를 보존합니다.", "strict group FDs를 검증합니다.", "WHERE/HAVING과 NULL/COUNT meanings를 정의합니다.", "conditional/weighted formulas를 문서화합니다.", "fan-out pre-aggregation을 적용합니다.", "time/calendar/watermark를 정의합니다.", "MySQL·Oracle plan/precision matrix를 실행합니다.", "version/reconciliation/privacy-safe telemetry를 포함합니다."], hints: ["SUM(DISTINCT amount)로 fan-out을 숨기지 마세요."], expectedOutcome: "정확성·성능·감사 가능성을 갖춘 KPI queries가 완성됩니다.", solutionOutline: ["source audit→metric contract→query grain→tests→plans→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 SQL reporting·metric governance 표준을 작성하세요.", requirements: ["population/grain/dimension/measure/denominator schema를 정의합니다.", "NULL/empty/distinct/conditional/weighted rules를 둡니다.", "join fan-out과 pre-aggregation review를 요구합니다.", "timezone/currency/rounding/watermark를 정의합니다.", "exact/approximate 선택 기준을 둡니다.", "plan/spill/resource budgets를 정의합니다.", "version/restatement/reconciliation/restore를 정의합니다.", "privacy/access/minimum cohort를 포함합니다."], hints: ["같은 metric 이름이 같은 SQL 결과를 보장하지 않습니다."], expectedOutcome: "초급 GROUP BY부터 운영 KPI까지 일관된 전문가 표준이 완성됩니다.", solutionOutline: ["define→compute→verify→publish→observe→correct 순서입니다."] },
  ],
  nextSessions: ["sql-09-json-and-statistical-aggregates"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["01_29.sql SELECT39·GROUP BY4·COUNT5, 01_30.sql SELECT34·GROUP BY17·JOIN22 active occurrences를 read-only로 계수했습니다.", "원본 sample literals/개인정보성 values는 사용하지 않고 aggregate progression만 provenance로 사용했습니다.", "원본은 grain/FD, denominator/precision, join fan-out, weighted averages, watermark·reconciliation·spill operations를 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai numeric precision, grouping modes/plans/parallelism을 대체하지 않습니다."] },
});

export default session;
