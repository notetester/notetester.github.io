import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(6, lineCount)}`, explanation: "외부 서비스와 자격 증명 없이 재현하도록 sqlite3 메모리 DB, 합성 식별자와 제약을 준비합니다." },
      { lines: `${Math.min(7, lineCount)}-${Math.max(7, lineCount - 5)}`, explanation: "scalar cardinality, membership, correlation 또는 실행 계획 불변식을 SQL과 독립 검산으로 비교합니다." },
      { lines: `${Math.max(1, lineCount - 4)}-${lineCount}`, explanation: "정렬된 식별자와 boolean 증거만 출력합니다. SQLite의 scalar 다중 행·optimizer 동작은 MySQL과 Oracle의 오류·계획을 대신하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite 증거와 MySQL 8.4·Oracle 26ai의 cardinality error, semijoin/decorrelation, isolation·plan을 별도 표로 검증합니다."] },
    experiments: [
      { change: "빈 집합, 중복 key, NULL, outer row가 없는 경우와 한 outer row에 여러 inner match를 추가합니다.", prediction: "질문의 cardinality와 NULL 계약이 불명확하면 scalar 오류, row 증식 또는 누락이 나타납니다.", result: "outer identity 집합과 subquery cardinality를 함께 출력해 문법이 아니라 의미를 검증합니다." },
      { change: "복합 index를 제거하고 통계를 갱신한 뒤 correlated query의 plan을 비교합니다.", prediction: "결과는 같아도 repeated scan, materialization 또는 semijoin 전략과 비용은 달라질 수 있습니다.", result: "EXPLAIN actual, rows examined, snapshot과 latency percentile을 대상 엔진에서 승인합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "subquery-shape-and-question-cardinality",
    title: "서브쿼리를 위치가 아니라 질문의 cardinality로 분류합니다",
    lead: "괄호 안 SELECT라는 모양보다 결과가 값 하나인지, 값 집합인지, 단지 행 존재 여부인지 먼저 정해야 scalar·IN·EXISTS 선택이 안정됩니다.",
    explanations: [
      "dbstudy 02_02.sql은 최대·최소·평균을 scalar 비교에 넣고, 주문 key 집합을 IN에 넣으며, 중첩 IN으로 관계를 탐색합니다. 공개 세션은 이 progression만 보존하고 원본 인명·도서명·금액은 전혀 복사하지 않습니다.",
      "scalar subquery의 계약은 정확히 한 column과 최대 한 row입니다. 0 row는 scalar NULL이 될 수 있지만 2 row 이상은 MySQL·Oracle에서 single-row cardinality 오류가 되므로, ‘우연히 첫 행’에 의존하지 말고 uniqueness 또는 aggregate로 증명합니다.",
      "IN은 왼쪽 값이 오른쪽 한-column set의 어느 값과 같은지 묻습니다. EXISTS는 correlated predicate를 만족하는 inner row가 하나라도 있는지만 묻고 SELECT list 값·중복 개수는 질문 결과에 영향을 주지 않습니다.",
      "같은 결과처럼 보이는 JOIN, IN, EXISTS는 outer row grain이 다를 수 있습니다. JOIN은 match 수만큼 outer row를 복제할 수 있지만 semijoin 질문은 outer identity를 최대 한 번만 반환합니다.",
      "선택 순서는 결과 shape, 0/1/N cardinality, NULL 의미, outer grain, correlation key, snapshot, 권한 범위, target-engine plan입니다. 짧아 보이는 SQL보다 이 불변식을 먼저 문서화합니다.",
    ],
    concepts: [
      c("query cardinality", "하나의 query block이 반환할 column 수와 row 수의 허용 범위입니다.", ["scalar는 1 column·0/1 row입니다.", "membership는 1-column set, EXISTS는 boolean existence입니다."], "SQLite scalar subquery의 다중 행 처리는 MySQL·Oracle 오류 계약과 다르므로 이식성 검증이 필요합니다."),
      c("outer grain", "최종 결과 한 행이 나타내는 외부 entity 단위입니다.", ["semijoin은 outer identity를 보존합니다.", "inner join은 match 수만큼 증식할 수 있습니다."]),
      c("subquery boundary", "outer query가 inner 결과를 scalar, set 또는 existence로 소비하는 의미 경계입니다.", ["타입·NULL·snapshot을 포함합니다.", "괄호 위치만으로 정의되지 않습니다."]),
    ],
    codeExamples: [py("sql13-scalar-cardinality-contract", "0·1·N행 scalar 계약을 눈으로 확인하기", "sql13_scalar_cardinality.py", "SQLite가 scalar 다중 행에서 첫 행을 택한다는 이식성 차이를 숨기지 않고, count 사전 조건으로 0·1·N 계약을 명시합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE metric(kind TEXT NOT NULL, amount INTEGER NOT NULL)")
db.executemany("INSERT INTO metric VALUES (?, ?)", [
    ("solo", 25), ("dupe", 10), ("dupe", 20)
])
for kind in ("missing", "solo", "dupe"):
    count = db.execute("SELECT count(*) FROM metric WHERE kind = ?", (kind,)).fetchone()[0]
    value = db.execute("SELECT (SELECT amount FROM metric WHERE kind = ? ORDER BY amount)", (kind,)).fetchone()[0]
    contract = "empty->NULL" if count == 0 else "one" if count == 1 else "many->reject"
    print(f"{kind}:count={count},sqlite-scalar={value},contract={contract}")
print("portable-multirow-policy=reject")`, "missing:count=0,sqlite-scalar=None,contract=empty->NULL\nsolo:count=1,sqlite-scalar=25,contract=one\ndupe:count=2,sqlite-scalar=10,contract=many->reject\nportable-multirow-policy=reject", ["local-0202", "mysql-scalar", "oracle-scalar", "sqlite-expr", "python-sqlite3"])],
    diagnostics: [d("개발 SQLite에서는 scalar query가 실행되는데 MySQL·Oracle 배포에서 다중 행 오류가 납니다.", "subquery가 사실상 unique라는 가정을 constraint로 증명하지 않았고 SQLite의 첫-row 동작을 이식 가능한 계약으로 오해했습니다.", ["subquery 단독 COUNT와 duplicate keys", "unique constraint/index", "0/1/N fixtures", "engine별 error class"], "business key를 UNIQUE로 강제하거나 질문이 aggregate라면 명시적 aggregate로 한 행을 만들고 N행은 조용히 LIMIT하지 않습니다.", "scalar subquery마다 0·1·2행 fixture와 target-engine conformance test를 둡니다.")],
    comparisons: [{ title: "질문 shape별 선택", options: [
      { name: "scalar", chooseWhen: "한 값이 표현 계약이고 0/1행이 증명될 때", avoidWhen: "여러 후보 중 임의 하나를 숨기려 할 때", tradeoffs: ["표현식 결합이 간단함", "cardinality 오류와 NULL 계약 필요"] },
      { name: "IN", chooseWhen: "한 값의 set membership 자체가 질문일 때", avoidWhen: "부정 집합에 NULL이 들어올 수 있을 때", tradeoffs: ["집합 질문이 직접적", "중복·NULL·타입 규칙 필요"] },
      { name: "EXISTS", chooseWhen: "outer row에 match가 하나라도 있는지만 필요할 때", avoidWhen: "inner scalar 값을 실제로 반환해야 할 때", tradeoffs: ["outer grain 보존", "correlation·index 설계 필요"] },
    ] }],
    expertNotes: ["LIMIT 1은 uniqueness 증명이 아니라 경쟁 후보를 숨기는 정책입니다. winner order와 tie-breaker가 진짜 요구일 때만 사용합니다.", "cardinality·outer grain·NULL을 query review template의 첫 세 항목으로 둡니다."],
  },
  {
    id: "scalar-zero-one-many-and-aggregate",
    title: "scalar의 0·1·N행과 aggregate 한 행을 구분합니다",
    lead: "MAX·AVG는 입력이 비어도 집계 행 하나를 만들 수 있지만 일반 SELECT는 0행을 반환하므로 같은 NULL이라도 발생 경로와 검증 방식이 다릅니다.",
    explanations: [
      "일반 scalar subquery 0행은 NULL이 됩니다. 반면 aggregate without GROUP BY는 입력 0행에서도 결과 행 하나를 만들며 MAX·AVG 값이 NULL일 수 있습니다. row 없음과 aggregate 값 NULL을 API에서 구분할 필요가 있는지 정합니다.",
      "GROUP BY를 scalar subquery에 추가하면 group 수만큼 행이 생겨 다시 cardinality 위험이 됩니다. outer key별 aggregate가 목적이면 correlation predicate와 group 범위를 검증하고, 전체 한 값이면 불필요한 GROUP BY를 제거합니다.",
      "최댓값과 같은 값의 모든 행을 찾는 query는 scalar MAX 결과와 outer 비교를 결합하므로 tie가 여러 개여도 정상적으로 여러 outer rows가 반환됩니다. scalar subquery 한 행과 최종 결과 한 행을 혼동하지 않습니다.",
      "NULL aggregate를 0으로 COALESCE하면 ‘관측 없음’과 실제 0을 합칩니다. domain이 둘을 같게 취급한다는 근거가 있을 때만 변환하고 원시 count를 함께 보존합니다.",
      "scalar result type·precision·collation과 driver mapping도 계약입니다. 서로 다른 engine에서 암시적 변환을 기대하지 말고 CAST와 boundary readback을 사용합니다.",
    ],
    concepts: [
      c("aggregate scalar", "GROUP BY 없는 aggregate query가 입력 cardinality와 관계없이 결과 행 하나를 만드는 형태입니다.", ["값은 NULL일 수 있습니다.", "COUNT와 MAX의 empty semantics가 다릅니다."]),
      c("tie-preserving comparison", "scalar 극값과 같은 모든 outer rows를 반환하는 비교입니다.", ["최종 결과는 여러 행일 수 있습니다.", "LIMIT 1과 다른 질문입니다."]),
      c("missing versus zero", "관측 행 없음과 실제 숫자 0을 별도 상태로 보존하는 계약입니다.", ["COUNT를 함께 둡니다.", "COALESCE 정책을 versioning합니다."]),
    ],
    diagnostics: [d("MAX 값을 찾았는데 동률 행 하나만 반환되거나 반대로 scalar 오류가 납니다.", "scalar aggregate의 한 행과 최종 outer 결과 cardinality를 혼동했거나 GROUP BY를 넣어 여러 aggregate rows를 만들었습니다.", ["subquery 단독 row count", "GROUP BY keys", "outer tie fixtures", "LIMIT/ORDER BY 존재"], "전체 극값은 GROUP BY 없는 aggregate 한 값으로 만들고 outer equality로 모든 tie를 반환하거나, 단일 winner가 요구면 total order를 별도 정의합니다.", "빈 입력·단일·동률·다중 group fixtures를 회귀 테스트합니다.")],
    expertNotes: ["0 row→NULL과 aggregate row→NULL은 화면에서 같아도 lineage와 운영 판단이 다릅니다.", "scalar에 GROUP BY가 보이면 예상 group 최대 개수를 먼저 증명합니다."],
  },
  {
    id: "in-membership-duplicates-null-types",
    title: "IN을 중복과 순서가 없는 typed membership으로 읽습니다",
    lead: "IN subquery는 목록을 화면에 출력하는 기능이 아니라 왼쪽 값이 오른쪽 집합에 포함되는지 평가하는 predicate입니다.",
    explanations: [
      "IN의 subquery는 비교 가능한 한 column을 반환해야 합니다. row constructor IN을 쓰는 dialect도 있지만 column 수·타입·NULL·collation을 tuple 위치별로 맞춰야 하며 portability matrix가 필요합니다.",
      "오른쪽 중복은 membership truth를 바꾸지 않습니다. DISTINCT를 습관적으로 넣으면 불필요한 sort/hash가 생길 수 있으므로 optimizer가 semijoin으로 처리하는지 실제 plan을 보고 결정합니다.",
      "IN 결과를 안정적인 출력 순서로 착각하지 않습니다. outer SELECT에는 별도 total ORDER BY가 필요하며, subquery ORDER BY는 membership 의미와 무관하거나 optimizer가 무시할 수 있습니다.",
      "positive IN에서 오른쪽 NULL은 match되는 non-null 값의 TRUE를 막지 않지만, match가 없고 NULL 후보가 있으면 UNKNOWN이 될 수 있습니다. WHERE는 TRUE만 남기므로 false와 unknown이 모두 탈락합니다.",
      "type coercion은 correctness와 index 사용을 함께 바꿀 수 있습니다. 문자열 key와 숫자 parameter를 섞지 말고 schema/parameter type을 일치시킵니다.",
    ],
    concepts: [
      c("membership predicate", "왼쪽 값이 오른쪽 비교 집합의 원소와 같은지를 평가하는 조건입니다.", ["중복·순서는 truth를 바꾸지 않습니다.", "NULL이면 UNKNOWN 경로가 있습니다."]),
      c("typed set", "비교 column의 domain·collation·nullability가 정의된 값 집합입니다.", ["암시적 변환을 피합니다.", "tuple이면 각 위치를 검증합니다."]),
      c("positive semijoin", "match가 있는 outer identity만 한 번 반환하는 관계 연산입니다.", ["일반 inner join의 row 증식과 다릅니다.", "IN이 optimizer에서 변환될 수 있습니다."]),
    ],
    codeExamples: [py("sql13-in-exists-grain", "IN·EXISTS와 JOIN의 outer grain 비교", "sql13_in_exists_grain.py", "중복 inner match가 있어도 IN과 EXISTS는 같은 outer id를 한 번만 반환하고 JOIN은 match 수만큼 증식함을 실제 SQL로 비교합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, label TEXT NOT NULL)")
db.execute("CREATE TABLE activity(id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL)")
db.executemany("INSERT INTO account VALUES (?, ?)", [(1, "A"), (2, "B"), (3, "C"), (4, "D")])
db.executemany("INSERT INTO activity VALUES (?, ?)", [(11, 1), (12, 1), (13, 3)])
in_ids = [r[0] for r in db.execute("SELECT id FROM account WHERE id IN (SELECT account_id FROM activity) ORDER BY id")]
exists_ids = [r[0] for r in db.execute("SELECT a.id FROM account a WHERE EXISTS (SELECT 1 FROM activity x WHERE x.account_id=a.id) ORDER BY a.id")]
join_ids = [r[0] for r in db.execute("SELECT a.id FROM account a JOIN activity x ON x.account_id=a.id ORDER BY a.id,x.id")]
print("IN=" + ",".join(map(str, in_ids)))
print("EXISTS=" + ",".join(map(str, exists_ids)))
print("JOIN=" + ",".join(map(str, join_ids)))
print("semijoin-equal=" + str(in_ids == exists_ids).lower())
print("join-expanded=" + str(len(join_ids) > len(in_ids)).lower())`, "IN=1,3\nEXISTS=1,3\nJOIN=1,1,3\nsemijoin-equal=true\njoin-expanded=true", ["local-0202", "mysql-in", "mysql-exists", "mysql-semijoin", "oracle-in", "oracle-exists", "sqlite-expr"])],
    diagnostics: [d("IN을 JOIN으로 바꾼 뒤 outer row와 합계가 inner 중복 수만큼 늘어납니다.", "membership 질문을 match-detail join으로 바꾸면서 결과 grain이 변했습니다.", ["outer primary keys의 duplicate count", "inner matches per key", "DISTINCT 비용과 손실", "EXISTS/IN plan"], "detail이 필요 없으면 IN/EXISTS semijoin을 유지하고 detail이 필요하면 원하는 grain으로 pre-aggregate하거나 별도 fetch합니다.", "0·1·N inner match fixture에서 outer id uniqueness를 assertion합니다.")],
    expertNotes: ["DISTINCT로 증식을 사후 제거하기 전에 질문이 membership인지 detail join인지 정합니다.", "IN 목록을 동적 SQL 문자열로 조립하지 말고 bind collection·temporary relation·JSON table 등 검증된 adapter를 사용합니다."],
  },
  {
    id: "exists-correlation-and-value-irrelevance",
    title: "EXISTS에서는 correlation predicate와 scope가 전부입니다",
    lead: "EXISTS의 SELECT 1, SELECT NULL, SELECT *는 행 존재 truth에 차이가 없으며, 실제 correctness는 outer key를 inner predicate에 정확히 연결했는지에 달려 있습니다.",
    explanations: [
      "EXISTS는 inner query가 한 행이라도 반환하면 TRUE입니다. projection 값이 NULL이어도 존재는 TRUE이므로 SELECT list를 의미 있는 데이터 반환으로 읽지 않습니다.",
      "correlation predicate가 빠지면 inner table에 단 한 행만 있어도 모든 outer rows가 TRUE가 되는 uncorrelated global existence query가 됩니다. alias-qualified keys와 tenant scope를 리뷰합니다.",
      "복합 identity는 모든 key part를 correlation해야 합니다. tenant_id 없이 local account_id만 비교하면 다른 tenant의 match로 권한 없는 outer row가 포함될 수 있습니다.",
      "EXISTS 안의 ORDER BY는 ‘첫 match’ 의미를 만들지 않습니다. winner가 필요하면 scalar/top-N 질문으로 재정의하고 deterministic total order를 둡니다.",
      "NOT EXISTS는 다음 세션에서 NULL-safe anti-membership의 기본형으로 확장합니다. 여기서는 positive existence가 outer grain과 authorization을 보존하는 이유를 먼저 고정합니다.",
    ],
    concepts: [
      c("correlation predicate", "inner column을 현재 outer row의 key와 연결하는 조건입니다.", ["alias를 명시합니다.", "tenant 등 scope key를 모두 포함합니다."]),
      c("projection irrelevance", "EXISTS는 inner SELECT list의 값이 아니라 row 반환 여부만 소비한다는 성질입니다.", ["SELECT NULL도 존재하면 TRUE입니다.", "값을 원하면 다른 shape를 선택합니다."]),
      c("scope-preserving existence", "현재 principal·tenant의 outer row와 같은 scope의 inner match만 인정하는 계약입니다.", ["복합 key를 사용합니다.", "cache·parameter scope도 맞춥니다."]),
    ],
    codeExamples: [py("sql13-correlated-scalar-aggregate", "outer row별 correlated aggregate와 빈 집합", "sql13_correlated_aggregate.py", "각 team에 대해 MAX와 COUNT를 correlated scalar로 계산해 값 없음과 실제 aggregate를 함께 관찰합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE team(id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE)")
db.execute("CREATE TABLE task(id INTEGER PRIMARY KEY, team_id INTEGER NOT NULL, score INTEGER NOT NULL)")
db.executemany("INSERT INTO team VALUES (?, ?)", [(1, "alpha"), (2, "beta"), (3, "gamma")])
db.executemany("INSERT INTO task VALUES (?, ?, ?)", [(1, 1, 10), (2, 1, 20), (3, 2, 5)])
rows = db.execute("""
    SELECT code,
           (SELECT max(score) FROM task t WHERE t.team_id=team.id),
           (SELECT count(*) FROM task t WHERE t.team_id=team.id)
    FROM team ORDER BY id
""").fetchall()
for code, maximum, count in rows:
    print(f"{code}:max={maximum},tasks={count}")
print("empty-max-is-null=" + str(rows[-1][1] is None).lower())
print("outer-rows=" + str(len(rows)))`, "alpha:max=20,tasks=2\nbeta:max=5,tasks=1\ngamma:max=None,tasks=0\nempty-max-is-null=true\nouter-rows=3", ["mysql-scalar", "mysql-correlated", "oracle-scalar", "sqlite-expr", "python-sqlite3"])],
    diagnostics: [d("EXISTS를 넣었더니 inner table에 데이터가 있는 동안 모든 outer row가 반환됩니다.", "correlation predicate가 누락되어 global existence를 각 outer row에 반복 적용했습니다.", ["inner query에서 outer alias 참조", "tenant와 local key 비교", "inner empty/nonempty fixture", "EXPLAIN dependent/correlated marker"], "outer·inner 복합 identity를 alias-qualified equality로 연결하고 authorization predicate를 inner relation에 포함합니다.", "tenant A/B의 동일 local id와 empty/nonempty inner fixtures를 둡니다.")],
    expertNotes: ["SELECT 1은 성능 주문이 아니라 projection이 의미 없다는 의도를 드러내는 관례입니다.", "correlation scope는 SQL text뿐 아니라 bound tenant/principal과 snapshot에도 이어져야 합니다."],
  },
  {
    id: "semijoin-versus-join-selection",
    title: "IN·EXISTS를 semijoin으로, JOIN을 결합 결과로 구분합니다",
    lead: "match가 있는 outer entity 목록과 inner detail까지 결합한 행 목록은 서로 다른 결과 계약이며 DISTINCT 하나로 오갈 수 없습니다.",
    explanations: [
      "semijoin은 outer row를 반환할지 결정하지만 inner columns를 결과로 내보내지 않습니다. inner join은 양쪽 columns를 결합하고 one-to-many cardinality를 결과에 표현합니다.",
      "IN과 EXISTS 중 어느 것이 항상 빠르다는 규칙은 없습니다. MySQL은 조건에 따라 semijoin, materialization, EXISTS strategy를 선택하고 Oracle도 cost-based transformation을 적용하므로 target data와 plan으로 판단합니다.",
      "inner duplicates를 없애려고 DISTINCT를 subquery에 넣어도 optimizer가 semijoin에서 이를 무시하거나 다른 전략을 선택할 수 있습니다. 결과 의미와 비용을 분리합니다.",
      "inner detail도 일부 필요하다면 먼저 outer ids를 semijoin으로 고르고 separate fetch, aggregate 또는 lateral/analytic pattern을 검토합니다. 무분별한 join 후 DISTINCT는 어떤 inner row가 대표인지 설명하지 못합니다.",
      "ORM relation.exists, join fetch, contains가 내는 실제 SQL과 entity de-duplication 위치를 확인합니다. application identity map이 SQL row 증식을 숨겨 count/paging은 여전히 틀릴 수 있습니다.",
    ],
    concepts: [
      c("semijoin", "inner match 존재로 outer rows만 선택하는 관계 연산입니다.", ["outer identity가 최대 한 번 나옵니다.", "inner projection을 반환하지 않습니다."]),
      c("match-detail join", "outer와 모든 matching inner rows를 결합하는 연산입니다.", ["one-to-many를 행으로 표현합니다.", "aggregate/count grain에 영향을 줍니다."]),
      c("optimizer strategy", "같은 semijoin 의미를 table pullout, first match, duplicate weedout, loose scan 또는 materialization 등으로 실행하는 선택입니다.", ["version·stats에 따라 바뀝니다.", "SQL spelling과 plan은 동일하지 않습니다."]),
    ],
    diagnostics: [d("IN을 EXISTS로 바꿨지만 성능이 좋아지지 않거나 오히려 나빠집니다.", "문법 이름만 바꾸면 optimizer strategy도 바뀐다고 가정했고 데이터 분포·index·statistics를 측정하지 않았습니다.", ["두 query의 canonical ids", "EXPLAIN/EXPLAIN ANALYZE", "outer/inner cardinality와 selectivity", "index key order·statistics"], "의미가 같은 두 형태와 join/pre-aggregation 후보를 target version의 representative data에서 비교하고 승인 plan을 선택합니다.", "plan shape·rows examined·latency와 결과 id parity를 CI/성능 gate에 둡니다.")],
    expertNotes: ["SQL rewrite의 첫 검증은 결과 outer key multiset parity이고 두 번째가 자원 비용입니다.", "ORM이 entity를 한 번만 보여 줘도 DB가 처리한 중복 rows와 count query는 별도로 확인합니다."],
  },
  {
    id: "correlated-evaluation-and-decorrelation",
    title: "correlated subquery의 논리 평가와 optimizer decorrelation을 분리합니다",
    lead: "논리적으로 outer row마다 값을 참조하더라도 optimizer는 semijoin·derived table·materialization으로 다시 쓸 수 있으므로 ‘N번 실행’도 ‘한 번 실행’도 측정 없이 단정하지 않습니다.",
    explanations: [
      "correlated subquery는 outer reference를 포함합니다. 교육용으로 outer row마다 inner query를 평가한다고 이해할 수 있지만 실제 engine은 equality correlation을 decorrelate하거나 cache/materialize할 수 있습니다.",
      "비결정 함수, LIMIT, aggregate, OR, inequality와 복잡한 expression은 transformation eligibility를 제한할 수 있습니다. MySQL version별 subquery_to_derived/semijoin 조건과 Oracle plan notes를 확인합니다.",
      "반대로 uncorrelated scalar/set subquery도 statement snapshot에서 한 번만 계산된다고 무조건 보장하지 않습니다. optimizer와 함수 determinism, side effects restriction을 따르고 값 변경 부작용 함수를 query에 넣지 않습니다.",
      "correlation key의 선두 index와 inner filter·projection을 덮는 composite index는 nested lookup 전략에 중요합니다. 하지만 low selectivity나 큰 outer 집합에서는 scan/materialize가 더 나을 수 있습니다.",
      "decorrelation 여부가 결과를 바꾸어서는 안 됩니다. NULL·duplicate·collation·snapshot과 volatile function이 rewrite-safe한지 target engine에서 negative fixture로 검증합니다.",
    ],
    concepts: [
      c("correlated subquery", "현재 outer row의 column을 참조하는 nested query입니다.", ["논리적 dependency가 있습니다.", "물리 실행 횟수와 동일하지 않습니다."]),
      c("decorrelation", "correlated predicate를 join·derived relation 등 집합 연산으로 변환하는 optimizer rewrite입니다.", ["eligibility 조건이 있습니다.", "plan evidence로 확인합니다."]),
      c("statement semantics", "optimizer rewrite 전후에도 같은 snapshot·NULL·cardinality 결과를 유지해야 하는 계약입니다.", ["volatile side effect를 배제합니다.", "golden ids로 검증합니다."]),
    ],
    diagnostics: [d("작은 데이터에서는 빠른 correlated query가 운영에서 outer 행 수에 비례해 폭증합니다.", "decorrelation되지 않은 repeated inner lookup에 적절한 correlation index가 없거나 cardinality 추정이 틀렸습니다.", ["actual outer loops", "inner rows per loop", "correlation key index", "optimizer transformation trace/plan"], "복합 index, pre-aggregation, semijoin/join rewrite를 결과 parity와 함께 비교하고 representative skew에서 선택합니다.", "outer size·inner skew 구간별 plan/latency benchmark와 regression threshold를 둡니다.")],
    expertNotes: ["‘correlated=항상 느림’, ‘EXISTS=첫 행에서 항상 종료’ 같은 문장은 logical possibility와 chosen physical plan을 혼동합니다.", "upgrade 후 transformation eligibility와 cardinality estimator 변화로 plan이 달라질 수 있으므로 재승인합니다."],
  },
  {
    id: "rewrite-equivalence-and-non-equivalence",
    title: "scalar·IN·EXISTS·JOIN rewrite의 동치 조건을 반례로 검증합니다",
    lead: "문법 간 변환은 key uniqueness, NULL, duplicate, projection, aggregation과 authorization이 같을 때만 안전합니다.",
    explanations: [
      "scalar equality를 IN으로 바꾸면 다중 candidate를 허용하는 질문으로 의미가 넓어집니다. 반대로 IN을 scalar equality로 바꾸면 다중 행 오류가 생깁니다. uniqueness가 증명될 때만 동치입니다.",
      "IN과 EXISTS는 non-null equality membership에서 같은 outer ids를 만들 수 있지만 NULL expression과 tuple comparison, engine-specific truth handling에서 차이를 검토해야 합니다.",
      "EXISTS를 JOIN으로 바꾸려면 inner columns가 필요하지 않고 outer duplicates가 허용되지 않는다는 grain을 보존해야 합니다. UNIQUE inner key가 없으면 JOIN 후 DISTINCT 비용·의미가 추가됩니다.",
      "aggregate correlated scalar를 pre-aggregated derived table LEFT JOIN으로 바꿀 때 inner group 없는 outer row의 NULL, filter placement와 COUNT zero semantics를 동일하게 맞춥니다.",
      "rewrite review에는 before/after outer primary-key multiset, selected values/types, NULL/empty/tie outputs, authorization scope, snapshot, plan과 resource를 포함합니다.",
    ],
    concepts: [
      c("rewrite precondition", "두 SQL 형태가 같은 결과를 내기 위해 필요한 uniqueness·nullability·grain·scope 조건입니다.", ["schema constraint로 증명합니다.", "반례 fixture로 확인합니다."]),
      c("multiset parity", "중복 횟수까지 포함한 결과 key 목록이 rewrite 전후 같은지 비교하는 검증입니다.", ["set equality만으로 부족할 수 있습니다.", "projection 타입도 비교합니다."]),
      c("semantic widening", "scalar를 set membership으로 바꾸는 등 허용 입력·결과 범위가 넓어지는 변화입니다.", ["성능 rewrite로 숨기지 않습니다.", "계약 version을 올립니다."]),
    ],
    diagnostics: [d("rewrite 전후 샘플 결과는 같지만 NULL·duplicate 데이터에서만 결과가 달라집니다.", "동치 조건을 schema와 반례로 증명하지 않고 정상 fixture의 set 결과만 비교했습니다.", ["nullable comparison columns", "duplicate inner keys", "outer key multiset", "empty group·authorization fixtures"], "각 rewrite의 precondition을 constraint와 test로 고정하고 0·1·N·NULL·duplicate·cross-scope fixture를 비교합니다.", "query equivalence test에 ordered values, types, duplicates와 failure class까지 포함합니다.")],
    expertNotes: ["optimizer가 내부적으로 rewrite할 수 있다는 사실과 사람이 임의 SQL로 바꾸어도 동치라는 결론은 다릅니다.", "결과 equality가 아닌 business question equality를 먼저 승인합니다."],
  },
  {
    id: "constraints-indexes-and-explain",
    title: "constraint·복합 index·EXPLAIN으로 가정을 실행 가능한 증거로 만듭니다",
    lead: "scalar uniqueness와 semijoin correlation 성능은 주석이 아니라 schema constraint, index key order, 통계와 실제 실행 계획으로 증명해야 합니다.",
    explanations: [
      "scalar key가 one-row라고 기대하면 PRIMARY KEY 또는 UNIQUE 제약으로 강제합니다. application validation만으로 race 중 duplicate insert를 막을 수 없고 LIMIT 1은 위반을 은폐합니다.",
      "EXISTS inner lookup index는 보통 equality correlation keys를 앞에 두고 추가 filter·range·covering columns를 workload에 맞춰 배치합니다. 모든 column을 넣기보다 write amplification과 cache footprint를 함께 측정합니다.",
      "IN materialization은 distinct temporary relation이나 index lookup을 사용할 수 있습니다. subquery result size, duplicate ratio, outer selectivity와 memory/temp budget이 strategy 선택에 영향을 줍니다.",
      "EXPLAIN은 chosen plan의 추정이고 EXPLAIN ANALYZE는 실제 loops/rows/time을 제공할 수 있으나 statement를 실제 실행할 수 있습니다. production에서는 권한·부하·민감 parameter를 통제합니다.",
      "SQLite EXPLAIN QUERY PLAN은 학습용으로 SEARCH/SCAN과 index 사용을 보여 주지만 output format을 영구 API로 snapshot하지 않습니다. stable boolean invariant와 target-engine plan을 분리합니다.",
    ],
    concepts: [
      c("cardinality constraint", "scalar key의 0/1 최대 행 가정을 DB가 원자적으로 강제하는 제약입니다.", ["UNIQUE/PRIMARY KEY를 사용합니다.", "nullable uniqueness semantics를 엔진별 확인합니다."]),
      c("correlation index", "outer key와 inner filter 순서에 맞춘 lookup용 composite index입니다.", ["leading equality columns를 검토합니다.", "write·storage 비용을 포함합니다."]),
      c("plan invariant", "승인 가능한 access path, loops, rows examined와 temp/spill 범위를 나타내는 검증 기준입니다.", ["plan hash만 고정하지 않습니다.", "데이터 분포별 budget을 둡니다."]),
    ],
    codeExamples: [py("sql13-exists-index-plan", "correlated EXISTS의 index 전후 계획 증거", "sql13_exists_plan.py", "자동 index를 끄고 correlation index 생성 전후 결과 id가 같으면서 inner access가 SCAN에서 indexed SEARCH로 바뀌는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA automatic_index=OFF")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL, score INTEGER NOT NULL)")
db.executemany("INSERT INTO account VALUES (?)", [(1,), (2,), (3,), (4,), (5,)])
db.executemany("INSERT INTO event VALUES (?, ?, ?)", [(11, 1, 70), (12, 3, 80), (13, 5, 90), (14, 5, 20)])
sql = "SELECT a.id FROM account a WHERE EXISTS (SELECT 1 FROM event e WHERE e.account_id=a.id AND e.score>=70) ORDER BY a.id"
before_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql)).upper()
before_ids = [row[0] for row in db.execute(sql)]
db.execute("CREATE INDEX idx_event_account_score ON event(account_id, score)")
after_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql)).upper()
after_ids = [row[0] for row in db.execute(sql)]
print("eligible=" + ",".join(map(str, after_ids)))
print("before-inner-scan=" + str("SCAN E" in before_plan).lower())
print("after-covering-index=" + str("IDX_EVENT_ACCOUNT_SCORE" in after_plan).lower())
print("same-result=" + str(before_ids == after_ids).lower())`, "eligible=1,3,5\nbefore-inner-scan=true\nafter-covering-index=true\nsame-result=true", ["mysql-subquery-opt", "mysql-explain", "mysql-semijoin", "sqlite-eqp", "sqlite-queryplanner", "python-sqlite3"])],
    diagnostics: [d("결과는 맞지만 correlated EXISTS가 inner table을 outer row마다 full scan합니다.", "correlation/filter key를 지원하는 index가 없거나 type/collation mismatch로 index를 사용할 수 없습니다.", ["EXPLAIN actual loops와 access type", "predicate와 index leading columns", "column/parameter type·collation", "statistics와 skew"], "결과 parity를 유지한 채 최소 composite index 또는 pre-aggregated semijoin 후보를 비교하고 write budget과 함께 승인합니다.", "representative outer cardinality·skew에서 rows-examined와 plan invariant를 감시합니다.")],
    expertNotes: ["index 존재 여부가 아니라 query가 해당 index를 어떤 cardinality로 사용하는지 확인합니다.", "통계 갱신·engine upgrade 후에는 SQL text가 같아도 plan을 다시 검증합니다."],
  },
  {
    id: "snapshot-isolation-and-concurrency",
    title: "subquery와 outer query가 같은 statement snapshot을 보는지 확인합니다",
    lead: "하나의 SELECT 안에서 outer와 inner가 어떤 snapshot을 공유하는지, 여러 statement로 분리했을 때 어떤 일관성을 잃는지 isolation 계약으로 설명합니다.",
    explanations: [
      "하나의 statement 안 scalar·IN·EXISTS는 일반적으로 그 statement의 일관된 read view를 전제로 해석하지만 engine/isolation에 따라 locking·consistent read와 concurrent write visibility가 다릅니다.",
      "scalar를 먼저 조회해 application 변수에 담고 다음 SELECT에 쓰면 두 statement 사이 데이터가 바뀔 수 있습니다. 한 statement 유지, transaction snapshot, version predicate 또는 재검증 중 요구에 맞는 것을 선택합니다.",
      "EXISTS check 뒤 insert/update를 수행하는 check-then-act는 동시성 race를 막지 못합니다. UNIQUE/FOREIGN KEY/CHECK와 conditional DML, 적절한 lock을 사용해 invariant를 write 시점에 강제합니다.",
      "long-running correlated query의 statement snapshot은 결과 일관성을 주더라도 undo/WAL retention, purge, replica lag와 timeout 비용을 키울 수 있습니다. batch boundary와 resource budget을 둡니다.",
      "SQLite memory 예제는 concurrency와 MVCC를 대체하지 않습니다. MySQL InnoDB isolation별 consistent read와 Oracle read consistency를 두 connection schedule로 검증합니다.",
    ],
    concepts: [
      c("statement snapshot", "한 SQL statement가 읽는 데이터 버전의 일관된 경계입니다.", ["outer/inner visibility를 연결합니다.", "engine·isolation별 검증이 필요합니다."]),
      c("check-then-act race", "존재 확인과 쓰기 사이 다른 transaction이 invariant를 깨뜨리는 경쟁입니다.", ["SELECT만으로 막지 못합니다.", "constraint/atomic DML로 해결합니다."]),
      c("read-view budget", "긴 snapshot이 undo/WAL·replica·timeout에 주는 운영 비용의 한도입니다.", ["batch 크기와 timeout을 둡니다.", "재시작 가능한 cursor를 설계합니다."]),
    ],
    diagnostics: [d("EXISTS로 중복이 없음을 확인했는데 동시에 같은 key가 두 번 삽입됩니다.", "read predicate와 INSERT가 원자적이지 않고 DB uniqueness constraint가 없습니다.", ["동시 transaction timeline", "unique constraint", "isolation/lock mode", "duplicate error handling"], "UNIQUE constraint를 source of truth로 두고 atomic insert/upsert 또는 conditional DML을 사용하며 conflict를 정상 도메인 결과로 처리합니다.", "barrier를 둔 concurrent insert test와 rollback/readback을 자동화합니다.")],
    expertNotes: ["read query correctness와 write invariant enforcement를 분리합니다.", "여러 query로 rewrite할 때 statement snapshot 하나가 transaction snapshot 여러 statement로 바뀌는지 기록합니다."],
  },
  {
    id: "security-portability-and-operations",
    title: "parameter·tenant scope·dialect·관측·배포를 하나의 운영 계약으로 묶습니다",
    lead: "subquery는 injection을 막아 주지 않으며 nested scope가 권한 predicate, parameter type, cache key와 telemetry에서 빠지면 정확한 문법도 데이터 누출을 만듭니다.",
    explanations: [
      "사용자 값은 outer와 inner 모든 predicate에 parameter binding합니다. column, sort direction, operator와 query shape 같은 identifier는 bind할 수 없으므로 고정 template과 allow-list를 사용합니다.",
      "multi-tenant correlation에는 tenant_id와 entity_id를 함께 비교합니다. inner subquery에 tenant predicate가 빠지면 같은 local id를 가진 다른 tenant의 존재가 authorization oracle이 될 수 있습니다.",
      "cache identity는 principal/tenant, query contract version, filter와 snapshot을 포함해야 합니다. scalar result나 membership ids를 전역 key로 캐시하지 않습니다.",
      "MySQL·Oracle·SQLite는 scalar 다중 행, empty scalar, row-value IN, NULL, optimizer rewrite와 plan 표현이 다릅니다. syntax 호환이 아니라 golden result/error/type/plan/isolation matrix를 유지합니다.",
      "telemetry에는 query shape id, engine/version, outer/inner estimate/actual, plan strategy, rows examined, latency, cardinality/timeout 오류와 snapshot age를 두되 SQL parameter·원시 ids·PII는 기록하지 않습니다.",
    ],
    concepts: [
      c("scope-complete predicate", "authorization에 필요한 tenant·principal·soft-delete·status 조건이 outer와 inner relation에 모두 적용된 상태입니다.", ["복합 identity를 사용합니다.", "cache key에도 이어집니다."]),
      c("dialect conformance matrix", "engine/version별 result·NULL·error·type·plan·isolation을 같은 fixture로 비교한 증거입니다.", ["SQLite 단독 결과로 일반화하지 않습니다.", "driver readback을 포함합니다."]),
      c("privacy-preserving query telemetry", "원시 값 없이 query shape와 cardinality·plan·resource·failure를 관측하는 기록입니다.", ["parameter를 redact합니다.", "low-cardinality label만 사용합니다."]),
    ],
    codeExamples: [py("sql13-tenant-bound-exists", "bound parameter와 복합 tenant correlation", "sql13_tenant_scope.py", "tenant와 local account id를 모두 correlation하고 공격성 문자열도 value parameter로 처리해 scope가 넓어지지 않음을 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(tenant TEXT NOT NULL, local_id INTEGER NOT NULL, PRIMARY KEY(tenant, local_id))")
db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY, tenant TEXT NOT NULL, account_id INTEGER NOT NULL)")
db.executemany("INSERT INTO account VALUES (?, ?)", [("blue", 1), ("blue", 2), ("green", 1), ("green", 2)])
db.executemany("INSERT INTO event VALUES (?, ?, ?)", [(11, "blue", 1), (12, "green", 1), (13, "green", 2)])
sql = """SELECT a.local_id FROM account a WHERE a.tenant=? AND EXISTS (
         SELECT 1 FROM event e WHERE e.tenant=a.tenant AND e.account_id=a.local_id)
         ORDER BY a.local_id"""
blue = [row[0] for row in db.execute(sql, ("blue",))]
attack = [row[0] for row in db.execute(sql, ("blue' OR 1=1 --",))]
wrong_scope = db.execute("SELECT count(*) FROM account a WHERE a.tenant='blue' AND EXISTS (SELECT 1 FROM event e WHERE e.account_id=a.local_id)").fetchone()[0]
print("blue=" + ",".join(map(str, blue)))
print("attack-count=" + str(len(attack)))
print("scoped-count=" + str(len(blue)))
print("unscoped-count=" + str(wrong_scope))
print("scope-leak-detected=" + str(wrong_scope > len(blue)).lower())`, "blue=1\nattack-count=0\nscoped-count=1\nunscoped-count=2\nscope-leak-detected=true", ["mysql-exists", "mysql-consistent-read", "oracle-exists", "sqlite-isolation", "python-sqlite3"])],
    diagnostics: [d("다른 tenant의 inner row 때문에 현재 tenant outer row가 존재한다고 판정됩니다.", "correlation에서 tenant scope key가 빠지고 local id만 비교됐습니다.", ["outer/inner composite keys", "effective tenant parameter", "cross-tenant same-id fixture", "cache key와 generated SQL"], "tenant와 entity key를 모두 correlation하고 DB foreign key/row policy, bound parameter와 cache isolation으로 중복 방어합니다.", "cross-tenant sentinel fixture와 authorization query mutation test를 release gate로 둡니다.")],
    expertNotes: ["SQL text는 telemetry에 shape hash로 남기고 실제 parameter와 inner entity 목록은 남기지 않습니다.", "배포 후 scalar cardinality error·semijoin plan regression·cross-scope denial을 별도 metric으로 관측합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0202", repository: "dbstudy", path: "02_02.sql", usedFor: ["MAX/MIN/AVG scalar comparison, IN and nested IN learning progression"], evidence: "원본을 read-only로 확인했고 인명·도서명·가격 등 sample literals는 복사하지 않았습니다." },
  { id: "mysql-scalar", repository: "MySQL 8.4 Reference Manual", path: "The Subquery as Scalar Operand", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/scalar-subqueries.html", usedFor: ["scalar 0/1/N cardinality and type"], evidence: "MySQL 공식 scalar subquery 문서입니다." },
  { id: "mysql-in", repository: "MySQL 8.4 Reference Manual", path: "Subqueries with ANY, IN, or SOME", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/any-in-some-subqueries.html", usedFor: ["IN membership and row comparison"], evidence: "MySQL 공식 IN subquery 문서입니다." },
  { id: "mysql-exists", repository: "MySQL 8.4 Reference Manual", path: "Subqueries with EXISTS or NOT EXISTS", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html", usedFor: ["EXISTS projection and existence semantics"], evidence: "MySQL 공식 EXISTS 문서입니다." },
  { id: "mysql-correlated", repository: "MySQL 8.4 Reference Manual", path: "Correlated Subqueries", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/correlated-subqueries.html", usedFor: ["correlation and scalar decorrelation"], evidence: "MySQL 공식 correlated subquery 문서입니다." },
  { id: "mysql-semijoin", repository: "MySQL 8.4 Reference Manual", path: "Semijoin and Antijoin Transformations", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/semijoins-antijoins.html", usedFor: ["IN/EXISTS semijoin strategies and duplicate handling"], evidence: "MySQL 공식 semijoin optimizer 문서입니다." },
  { id: "mysql-subquery-opt", repository: "MySQL 8.4 Reference Manual", path: "Optimizing Subqueries", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/subquery-optimization.html", usedFor: ["materialization, EXISTS strategy and rewrites"], evidence: "MySQL 공식 subquery optimization 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["plan and actual execution evidence"], evidence: "MySQL 공식 EXPLAIN 문서입니다." },
  { id: "mysql-consistent-read", repository: "MySQL 8.4 Reference Manual", path: "Consistent Nonlocking Reads", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html", usedFor: ["statement snapshot and isolation"], evidence: "MySQL InnoDB 공식 consistent read 문서입니다." },
  { id: "oracle-scalar", repository: "Oracle Database 26ai SQL Language Reference", path: "Scalar Subquery Expressions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Scalar-Subquery-Expressions.html", usedFor: ["Oracle scalar empty and multirow semantics"], evidence: "Oracle 공식 scalar subquery 문서입니다." },
  { id: "oracle-in", repository: "Oracle Database 26ai SQL Language Reference", path: "IN Condition", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/IN-Condition.html", usedFor: ["IN condition portability"], evidence: "Oracle 공식 IN condition 문서입니다." },
  { id: "oracle-exists", repository: "Oracle Database 26ai SQL Language Reference", path: "EXISTS Condition", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/EXISTS-Condition.html", usedFor: ["EXISTS condition portability"], evidence: "Oracle 공식 EXISTS condition 문서입니다." },
  { id: "sqlite-expr", repository: "SQLite Documentation", path: "SQL Language Expressions: IN, EXISTS, scalar and correlated subqueries", publicUrl: "https://www.sqlite.org/lang_expr.html#subquery_expressions", usedFor: ["exact SQLite subquery laboratory and semantic differences"], evidence: "SQLite 공식 expression 문서의 subquery anchor입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["SEARCH/SCAN laboratory"], evidence: "SQLite 공식 EQP 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["index and planner boundaries"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "sqlite-isolation", repository: "SQLite Documentation", path: "Isolation In SQLite", publicUrl: "https://www.sqlite.org/isolation.html", usedFor: ["SQLite snapshot laboratory limits"], evidence: "SQLite 공식 isolation 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Documentation", path: "sqlite3 DB-API and placeholders", publicUrl: "https://docs.python.org/3/library/sqlite3.html#how-to-use-placeholders-to-bind-values-in-sql-queries", usedFor: ["exact examples and bound parameters"], evidence: "Python 공식 sqlite3 문서의 placeholder anchor입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-13-scalar-in-exists-subquery",
  slug: "sql-13-scalar-in-exists-subquery",
  courseId: "database",
  moduleId: "db-joins-subqueries",
  order: 4,
  title: "스칼라·IN·EXISTS 서브쿼리 선택 기준",
  subtitle: "괄호 문법을 cardinality·outer grain·NULL·decorrelation·snapshot·권한·실행 계획 계약으로 확장합니다.",
  level: "고급",
  estimatedMinutes: 900,
  coreQuestion: "한 값, 값 집합, 존재 여부라는 서로 다른 질문에 scalar·IN·EXISTS를 선택하고 0·1·N행, NULL, outer grain, 권한과 plan이 맞음을 어떻게 증명할까요?",
  summary: "dbstudy 02_02.sql의 MAX/MIN/AVG scalar 비교, IN과 nested IN progression을 read-only로 감사합니다. scalar의 0·1·N cardinality와 aggregate empty semantics, typed IN membership, EXISTS correlation/projection, semijoin과 JOIN grain, correlated evaluation/decorrelation, rewrite 동치 조건, constraint/index/EXPLAIN, statement snapshot과 check-then-act race, tenant scope·parameter·dialect·telemetry까지 확장합니다. 다섯 exact Python/sqlite3 examples는 SQLite scalar 이식성 차이, IN/EXISTS/JOIN grain, correlated aggregate, index plan과 tenant scope를 실제 실행합니다.",
  objectives: ["질문의 결과 shape와 0·1·N cardinality로 scalar·IN·EXISTS를 선택한다.", "scalar empty·multirow·aggregate·tie semantics를 engine별로 검증한다.", "IN/EXISTS semijoin과 JOIN의 outer grain·중복·NULL 차이를 설명한다.", "correlation key와 optimizer decorrelation/materialization을 plan으로 확인한다.", "rewrite 동치 조건을 constraint와 반례 fixture로 증명한다.", "복합 index·EXPLAIN actual·snapshot·동시성 race를 운영 기준으로 만든다.", "parameter binding·tenant scope·dialect matrix·privacy telemetry를 배포 계약에 포함한다."],
  prerequisites: [{ title: "다중 테이블 조인과 별칭", reason: "outer/inner alias, 복합 identity와 join grain을 이해해야 subquery correlation과 semijoin을 정확히 설계할 수 있습니다.", sessionSlug: "sql-12-multi-table-join-alias" }],
  keywords: ["scalar subquery", "IN", "EXISTS", "cardinality", "correlated subquery", "decorrelation", "semijoin", "materialization", "outer grain", "EXPLAIN", "snapshot", "tenant scope"],
  topics,
  lab: {
    title: "multi-tenant 활동 시스템의 scalar·membership·existence query 계약 만들기",
    scenario: "계정별 최신 정책 한 값, 허용 role 집합, qualifying event 존재 여부를 조회합니다. duplicate policy, NULL, 같은 local id의 다른 tenant, skew와 concurrent update가 있습니다.",
    setup: ["합성 tenant/account/policy/event ids와 0·1·N·NULL·duplicate·skew fixture만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schema와 representative statistics/index를 준비합니다.", "각 질문의 scalar/set/existence shape, outer grain, snapshot, authorization과 error contract를 먼저 작성합니다.", "canonical outer id multiset과 scalar value/type/error를 engine별 golden evidence로 고정합니다."],
    steps: ["원본 progression과 공개 합성 예제의 mapping을 기록합니다.", "scalar key를 0·1·2행으로 실행하고 uniqueness/aggregate/NULL 정책을 검증합니다.", "IN과 EXISTS의 outer ids를 JOIN multiset과 비교합니다.", "tenant와 entity 복합 correlation을 누락한 leak 반례를 재현합니다.", "correlated aggregate와 pre-aggregated LEFT JOIN rewrite의 empty/type parity를 비교합니다.", "semijoin/materialization/decorrelation 후보를 EXPLAIN actual로 측정합니다.", "correlation/filter 복합 index 전후 rows examined·loops·latency를 비교합니다.", "동일 statement와 two-statement rewrite의 concurrent visibility를 isolation별 검증합니다.", "bound value와 allow-listed query shape, cache scope, redacted telemetry를 negative-test합니다.", "MySQL·Oracle·SQLite의 result/error/type/plan/isolation matrix와 rollback runbook을 승인합니다."],
    expectedResult: ["scalar 0·1·N과 IN/EXISTS outer grain이 문서 계약과 일치합니다.", "다섯 exact examples의 stdout이 완전히 일치합니다.", "cross-tenant correlation 누락, duplicate scalar, NULL·rewrite·race 반례가 acceptance에서 검출됩니다.", "representative skew에서 승인된 semijoin/decorrelation/index plan과 resource budget을 만족합니다.", "raw identifiers와 parameters를 남기지 않고 query shape·cardinality·plan·failure를 운영 관측할 수 있습니다."],
    cleanup: ["isolated schema·합성 rows·indexes·plan artifacts를 run id로 제거합니다.", "임시 credentials와 query exports를 폐기합니다.", "logs/cache에 raw tenant·account·parameter가 없는지 확인합니다.", "dbstudy 원본 파일과 production data는 변경하지 않습니다."],
    extensions: ["row-value IN과 composite NULL matrix를 engine별 비교합니다.", "lateral join·CTE·window 대안을 scalar correlated query와 비교합니다.", "optimizer trace와 statistics feedback에 따른 plan 전환을 분석합니다.", "replica lag와 read-your-write가 existence query 계약에 미치는 영향을 실험합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 query의 input cardinality·outer ids·NULL·plan 증거를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "SQLite scalar 다중 행과 MySQL·Oracle 오류 차이를 설명합니다.", "IN/EXISTS/JOIN key multiset을 비교합니다.", "correlated aggregate 빈 집합을 구분합니다.", "index 전후 result parity와 plan boolean을 확인합니다.", "tenant 복합 correlation을 검증합니다."], hints: ["SQL 길이보다 0·1·N과 outer primary-key multiset을 먼저 보세요."], expectedOutcome: "서브쿼리를 문법이 아니라 결과 cardinality와 관계 grain으로 설명합니다.", solutionOutline: ["shape→cardinality→null→grain→scope→plan→snapshot 순서입니다."] },
    { difficulty: "응용", prompt: "원본 02_02 progression을 multi-tenant policy API query로 재구성하세요.", requirements: ["원본 clause progression provenance를 보존합니다.", "scalar uniqueness/empty/error를 schema로 강제합니다.", "IN/EXISTS/JOIN 선택 근거와 outer grain을 기록합니다.", "복합 tenant correlation과 authorization을 적용합니다.", "decorrelation/materialization/index 후보를 측정합니다.", "statement snapshot과 check-then-act race를 분리합니다.", "MySQL·Oracle result/error/plan matrix를 실행합니다.", "parameter·cache·redacted telemetry·rollback을 포함합니다."], hints: ["LIMIT 1이나 DISTINCT로 cardinality 결함을 숨기지 마세요."], expectedOutcome: "정확성·보안·성능·동시성 근거가 있는 subquery API가 완성됩니다.", solutionOutline: ["source audit→contract→constraints→queries→counterexamples→plans→conformance→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 scalar·membership·existence SQL 표준을 작성하세요.", requirements: ["0·1·N·NULL·type·error schema를 정의합니다.", "outer grain과 semijoin/join 선택 기준을 둡니다.", "correlation/decorrelation rewrite precondition을 정의합니다.", "constraint/index/EXPLAIN actual budgets를 요구합니다.", "snapshot/isolation/check-then-act 규칙을 둡니다.", "tenant scope·parameter·cache·privacy telemetry를 정의합니다.", "dialect conformance와 upgrade 재승인을 포함합니다.", "rollback과 incident evidence 절차를 작성합니다."], hints: ["같은 결과 한 번이 아니라 반례와 운영 상태에서도 유지되는 불변식을 표준화하세요."], expectedOutcome: "학습 예제부터 운영 query까지 일관된 subquery governance가 완성됩니다.", solutionOutline: ["classify→constrain→correlate→measure→isolate→protect→observe→recover 순서입니다."] },
  ],
  nextSessions: ["sql-14-not-in-null-trap"],
  sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_02.sql에서 MAX/MIN/AVG scalar 비교 3개, positive IN 4개와 nested IN progression을 read-only로 확인했습니다.", "원본 인명·도서명·출판사·가격 등 sample literals와 PII 가능 값은 복사하지 않고 clause progression만 사용했습니다.", "원본은 scalar 0·1·N 오류, IN/EXISTS semijoin, correlation/decorrelation, constraint/index/EXPLAIN, isolation·tenant 보안을 충분히 설명하지 않아 공식 문서와 합성 예제로 보완했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai의 multirow error, optimizer strategy, type·isolation 동작을 대체하지 않습니다."] },
});

export default session;
