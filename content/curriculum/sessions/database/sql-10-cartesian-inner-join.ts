import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 in-memory database와 합성 key·NULL·duplicate rows를 준비합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "CROSS/INNER JOIN·composite predicate·EXISTS·index/plan·keyset query를 실행하고 input/output cardinality를 계산합니다." },
      { lines: "마지막 5줄", explanation: "sample value 대신 bounded count·key tuple·stable boolean만 출력합니다. MySQL·PostgreSQL·Oracle plan과 locking은 각 공식 문서와 target version에서 다시 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "실제 schema에서는 representative distribution·constraints·statistics·isolation과 vendor plan을 별도 검증합니다."] },
    experiments: [
      { change: "각 relation에 같은 join key를 가진 row를 하나 더 추가합니다.", prediction: "pair 수와 fan-out이 key multiplicity의 곱으로 증가합니다.", result: "JOIN 뒤 DISTINCT로 숨기기 전에 input key별 multiplicity를 측정합니다." },
      { change: "join predicate의 tenant 또는 composite-key component 하나를 제거합니다.", prediction: "다른 scope의 rows가 교차 매칭되어 cardinality와 권한 경계가 깨집니다.", result: "모든 key component와 mandatory scope predicate를 schema constraint에서 query까지 추적합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "cartesian-product-pair-space",
    title: "카티션 곱을 두 relation의 가능한 모든 row pair 공간으로 이해합니다",
    lead: "JOIN은 두 표를 옆으로 붙이는 문법이 아니라 먼저 가능한 pair를 생각하고 predicate가 허용 pair를 남기는 relational operation입니다.",
    explanations: [
      "A에 m rows, B에 n rows가 있으면 Cartesian product A×B는 m×n pairs입니다. 실제 optimizer가 모든 pairs를 materialize해야 한다는 뜻은 아니지만 INNER JOIN 결과 의미를 검산하는 정확한 출발점입니다.",
      "원본 01_30.sql은 active INNER JOIN 22회와 GROUP BY 17회, 02_02.sql은 JOIN 20회 중 LEFT 8회, 02_03.sql은 JOIN 4회 중 LEFT 3회를 포함합니다. literal data는 복사하지 않고 explicit join으로 발전하는 구조만 provenance로 사용합니다.",
      "CROSS JOIN은 intentional pair generation을 표현합니다. 달력×지역, 상품×가격등급 같은 dense matrix가 요구사항이면 허용되지만 accidental Cartesian product는 작은 fixture에서 통과하고 production에서 폭발합니다.",
      "cardinality estimate는 |A|×|B|에 predicate selectivity를 적용합니다. key distribution·NULL·skew·correlation 때문에 uniform assumption이 빗나갈 수 있어 estimated와 actual rows를 representative fixture에서 비교합니다.",
      "결과 grain을 한 문장으로 적습니다. ‘account 한 행’인지 ‘account-event pair 한 행’인지 정하지 않으면 같은 SQL row count를 entity count로 오해합니다.",
    ],
    concepts: [
      c("Cartesian product", "두 relation의 모든 ordered row pairs로 구성된 relation입니다.", ["row 수는 m×n입니다.", "CROSS JOIN이 의도를 명시합니다."]),
      c("result grain", "결과 한 row가 나타내는 업무 entity 또는 entity tuple의 최소 단위입니다.", ["join 전후 바뀔 수 있습니다.", "count·pagination·aggregation contract의 기준입니다."]),
    ],
    codeExamples: [py(
      "sql10-cartesian-filter",
      "전체 pair와 key가 같은 INNER JOIN pair 비교",
      "cartesian_inner_pairs.py",
      "3×3 Cartesian pairs에서 foreign-key equality가 세 valid pairs만 남기는지 exact 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE account(account_id INTEGER PRIMARY KEY); CREATE TABLE activity(activity_id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL);")
db.executemany("INSERT INTO account VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO activity VALUES (?, ?)", [(101, 1), (102, 1), (103, 2)])

cartesian = db.execute("SELECT COUNT(*) FROM account CROSS JOIN activity").fetchone()[0]
joined = list(db.execute("SELECT a.account_id, x.activity_id FROM account AS a INNER JOIN activity AS x ON x.account_id = a.account_id ORDER BY a.account_id, x.activity_id"))
print("left=3")
print("right=3")
print("cartesian=" + str(cartesian))
print("joined=" + ",".join(f"{account}:{activity}" for account, activity in joined))
print("joined-count=" + str(len(joined)))`,
      "left=3\nright=3\ncartesian=9\njoined=1:101,1:102,2:103\njoined-count=3",
      ["local-db-0130", "sqlite-select", "postgres-table-expressions", "mysql-join", "oracle-joins"],
    )],
    diagnostics: [
      d("두 작은 tables를 join했는데 row 수가 갑자기 수백 배 늘어난다.", "join predicate가 없거나 항상 참이고 m×n pair space가 그대로 남았습니다.", ["각 input count와 output count를 기록합니다.", "ON predicate와 aliases를 확인합니다.", "expected result grain과 key multiplicity를 표로 만듭니다."], "intentional이면 CROSS JOIN으로 이름 붙이고 budget을 두며, 아니면 complete key predicate를 복원합니다.", "join review에서 input counts·expected max cardinality·actual ratio를 자동 검사합니다."),
    ],
    expertNotes: ["optimizer physical join algorithm과 relational Cartesian-product semantics를 구분합니다.", "CROSS JOIN으로 생성한 dense matrix도 tenant scope·date range·maximum rows를 먼저 제한합니다."],
  },
  {
    id: "explicit-inner-join-on-contract",
    title: "comma join의 WHERE 조건을 explicit INNER JOIN과 ON 계약으로 분리합니다",
    lead: "legacy `FROM A, B WHERE ...`가 동작해도 relation 연결 조건과 결과 filter가 섞여 누락 review가 어렵습니다.",
    explanations: [
      "INNER JOIN의 ON은 어떤 left/right pair가 match인지 정의하고 WHERE는 만들어진 rows를 추가로 filter합니다. inner join에서는 많은 deterministic predicates를 서로 옮겨도 결과가 같을 수 있지만 intent·outer-join migration·optimizer 진단을 위해 역할을 분리합니다.",
      "지정된 01_30 원본에서 comma-style occurrence 3회와 explicit INNER JOIN 22회를 구조적으로 확인했습니다. 강의 자료에서는 literal/query 전체를 복사하지 않고 explicit form으로의 progression만 설명합니다.",
      "qualified aliases는 `a.id = b.account_id`처럼 source를 드러냅니다. 너무 짧은 a,b,c가 세 tables 이상에서 의미를 잃으면 account/activity처럼 domain 축약을 사용하고 aliases를 query block마다 일관되게 유지합니다.",
      "ON 1=1, 서로 같은 table column 비교, alias typo는 문법상 실행되어도 accidental cross join을 만듭니다. join graph에서 모든 relation node가 expected edge로 연결되는지 검사합니다.",
      "NATURAL JOIN과 USING은 column-name 변화가 semantics를 바꿀 수 있어 교육·운영 표준에서 explicit column list와 qualifications를 우선합니다. 사용한다면 schema evolution contract와 output duplicate-column behavior를 고정합니다.",
    ],
    concepts: [
      c("join predicate", "두 relation rows가 같은 result tuple을 형성할 조건입니다.", ["key·scope·time 조건을 포함할 수 있습니다.", "결과 filter와 분리해 review합니다."]),
      c("join graph", "tables/query blocks를 nodes, join predicates를 edges로 표현한 구조입니다.", ["disconnected node는 Cartesian 위험입니다.", "edge별 cardinality와 optionality를 기록합니다."]),
    ],
    diagnostics: [
      d("WHERE가 길어 어느 조건이 join이고 어느 조건이 report filter인지 알 수 없다.", "comma join과 row predicates를 한 WHERE에 혼합했습니다.", ["column sources를 qualify합니다.", "relation 간 predicates와 single-relation predicates를 분류합니다.", "outer join으로 바꿀 가능성과 NULL behavior를 봅니다."], "explicit INNER JOIN ... ON으로 relation edges를 옮기고 WHERE에는 post-match business filters를 둡니다.", "lint/review에서 comma FROM과 unqualified multi-table columns를 금지합니다."),
    ],
    expertNotes: ["inner join predicate placement equivalence를 outer join에 일반화하지 않습니다.", "row-level security/tenant predicate가 optimizer rewrite 후에도 모든 join paths에 적용되는지 실제 plan과 negative tests로 검증합니다."],
  },
  {
    id: "composite-key-scope-predicate",
    title: "composite key와 tenant scope의 모든 component를 ON에 포함합니다",
    lead: "한 column이 개발 data에서 unique해 보여도 schema key가 여러 columns이면 일부만 join할 때 다른 scope rows가 교차 매칭됩니다.",
    explanations: [
      "foreign key `(tenant_id, owner_id)`는 referenced unique key의 column 순서와 의미를 함께 가집니다. `owner_id` 하나만 join하면 tenant마다 반복되는 local identifier가 서로 match합니다.",
      "composite temporal key는 entity id뿐 아니라 version/effective period 조건이 필요할 수 있습니다. current flag 하나가 unique constraint로 보장되지 않으면 여러 versions가 match합니다.",
      "sample coincidence는 constraint가 아닙니다. PK/UNIQUE/FK metadata와 duplicate query로 parent uniqueness·child validity를 확인하고 missing scope negative fixture를 둡니다.",
      "mandatory tenant/authorization predicate는 user-supplied filter와 별도로 query builder가 강제합니다. join 이후 WHERE tenant filter만으로 중간 cross-scope association이 안전하다고 가정하지 않습니다.",
      "composite index order는 equality prefix와 following range/order를 고려합니다. constraint index와 access-path index의 목적을 분리하고 write cost·statistics를 함께 측정합니다.",
    ],
    concepts: [
      c("composite key", "둘 이상의 columns가 함께 row identity 또는 reference target을 구성하는 key입니다.", ["모든 component가 equality/temporal contract에 필요합니다.", "column order와 NULL 규칙을 확인합니다."]),
      c("scope predicate", "tenant·organization·security realm처럼 같은 local id를 분리하는 mandatory condition입니다.", ["join edge마다 보존합니다.", "authorization negative test를 둡니다."]),
    ],
    codeExamples: [py(
      "sql10-composite-scope",
      "tenant key 누락이 만드는 cross-scope fan-out",
      "composite_scope_join.py",
      "두 tenants가 같은 local owner id를 쓸 때 owner_id-only join과 complete composite join cardinality를 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("CREATE TABLE member(tenant_id TEXT, member_id INTEGER, PRIMARY KEY(tenant_id, member_id)); CREATE TABLE task(tenant_id TEXT, task_id INTEGER, owner_id INTEGER, PRIMARY KEY(tenant_id, task_id), FOREIGN KEY(tenant_id, owner_id) REFERENCES member(tenant_id, member_id));")
db.executemany("INSERT INTO member VALUES (?, ?)", [("T1", 1), ("T2", 1)])
db.executemany("INSERT INTO task VALUES (?, ?, ?)", [("T1", 11, 1), ("T2", 22, 1)])

wrong = db.execute("SELECT COUNT(*) FROM task AS t INNER JOIN member AS m ON m.member_id = t.owner_id").fetchone()[0]
correct_rows = list(db.execute("SELECT t.tenant_id, t.task_id FROM task AS t INNER JOIN member AS m ON m.tenant_id=t.tenant_id AND m.member_id=t.owner_id ORDER BY t.tenant_id"))
print("tasks=2")
print("partial-key=" + str(wrong))
print("complete-key=" + str(len(correct_rows)))
print("rows=" + ",".join(f"{tenant}:{task}" for tenant, task in correct_rows))
print("isolated=" + str(wrong != len(correct_rows)).lower())`,
      "tasks=2\npartial-key=4\ncomplete-key=2\nrows=T1:11,T2:22\nisolated=true",
      ["local-db-0202", "local-db-0203", "sqlite-foreign-keys", "postgres-constraints", "postgres-indexes"],
    )],
    diagnostics: [
      d("tenant별 count는 맞는데 joined detail에 다른 tenant metadata가 섞인다.", "local id만 join하고 tenant component를 누락했습니다.", ["PK/FK column tuples를 schema에서 읽습니다.", "same local id across tenants fixture를 만듭니다.", "joined pair tenant equality를 assertion합니다."], "ON에 complete composite key와 scope predicate를 포함하고 FK/UNIQUE로 schema에 강제합니다.", "cross-tenant same-id negative test와 query-shape lint를 둡니다."),
    ],
    expertNotes: ["privacy/authorization incident가 될 수 있으므로 cross-scope mismatch를 단순 데이터 품질 오류로만 처리하지 않습니다.", "row-value comparisons의 NULL·dialect semantics는 target vendor에서 검증합니다."],
  },
  {
    id: "one-to-many-cardinality-fanout",
    title: "one-to-many join이 parent를 child 수만큼 반복하는 것을 오류와 요구사항으로 구분합니다",
    lead: "INNER JOIN 결과 중복은 SQL engine이 만든 임의 duplicate가 아니라 matching pair가 여러 개인 관계 cardinality일 수 있습니다.",
    explanations: [
      "parent 1개에 child k개가 match하면 parent columns가 k rows에서 반복됩니다. detail grain이 parent-child pair라면 정상이고 parent grain report라면 aggregate·semi join·single-row selection이 필요합니다.",
      "input key별 multiplicity를 `GROUP BY key HAVING COUNT(*)>1`로 측정합니다. output duplicate projection만 보지 말고 어느 edge에서 cardinality가 증가했는지 단계별 counts를 기록합니다.",
      "DISTINCT는 projected columns가 같은 rows를 제거할 뿐 relationship 원인을 고치지 않습니다. child-specific data를 projection에 추가하면 duplicates가 다시 나타나고 aggregate measures는 이미 증식했을 수 있습니다.",
      "one-to-one 기대는 referenced UNIQUE와 child foreign key만으로 충분하지 않을 수 있습니다. child FK에 UNIQUE가 있어야 parent당 child 최대 하나가 schema로 보장됩니다.",
      "pagination은 joined pair grain에서 수행하면 같은 parent가 pages에 분산됩니다. parent list가 요구사항이면 parent keys를 먼저 stable paginate하고 child를 별도/pre-aggregated query로 가져옵니다.",
    ],
    concepts: [
      c("join fan-out", "한 input entity가 여러 matching rows 때문에 join output에서 반복되는 현상입니다.", ["key별 multiplicity로 측정합니다.", "detail grain인지 오류인지 contract로 결정합니다."]),
      c("key preservation", "join 뒤에도 특정 relation key가 result rows를 유일하게 식별하는 성질입니다.", ["one-to-many에서는 parent key가 보존되지 않습니다.", "projection/aggregation 설계에 사용합니다."]),
    ],
    diagnostics: [
      d("JOIN 뒤 parent count가 child count에 따라 커진다.", "one-to-many relationship의 pair grain을 parent entity grain으로 셌습니다.", ["parent key별 joined COUNT를 봅니다.", "child uniqueness constraint를 확인합니다.", "report가 detail/parent 중 어느 grain인지 확인합니다."], "detail은 pair grain으로 이름 붙이고 parent existence는 EXISTS, parent metrics는 child pre-aggregation을 사용합니다.", "0/1/many child fixtures와 expected max multiplicity를 테스트합니다."),
    ],
    expertNotes: ["ORM identity map이 repeated parent objects를 합쳐 보여도 SQL row/aggregate fan-out은 남아 있습니다.", "pagination total count와 data query가 같은 grain·filters·snapshot을 사용하는지 검증합니다."],
  },
  {
    id: "null-three-valued-inner-match",
    title: "NULL join key는 equality가 TRUE가 아니므로 INNER JOIN match에서 제외됩니다",
    lead: "NULL=NULL을 같은 unknown 값이라고 생각하지 말고 ON predicate가 TRUE인 pairs만 inner result에 남는 three-valued logic을 적용합니다.",
    explanations: [
      "SQL equality에서 NULL이 관여하면 UNKNOWN이며 INNER JOIN은 ON이 TRUE인 pairs만 보존합니다. 양쪽 NULL rows도 `=`로 match하지 않습니다.",
      "NULL-safe equality operator는 vendor별 문법과 index behavior가 다릅니다. 업무에서 unknown identifiers를 서로 같은 entity로 묶는 것이 정말 맞는지 먼저 정하고 portable explicit logic을 검토합니다.",
      "nullable foreign key는 relationship 부재를 표현할 수 있지만 invalid reference와 구분됩니다. FK는 NULL을 허용할 수 있으며 non-NULL references만 parent 존재를 강제합니다.",
      "COALESCE(key, sentinel) equality는 실제 sentinel value와 collision할 수 있고 type/collation/index를 바꿉니다. missing key를 synthetic equality로 만들기보다 data model과 requirement를 고칩니다.",
      "NULL match loss는 inner join row 감소로 나타납니다. source key NULL count, matched count, unmatched non-NULL count를 함께 reconciliation합니다.",
    ],
    concepts: [
      c("UNKNOWN join predicate", "NULL 때문에 equality truth value가 TRUE/FALSE로 결정되지 않은 상태입니다.", ["INNER JOIN에서 match로 남지 않습니다.", "WHERE도 TRUE rows만 보존합니다."]),
      c("nullable relationship", "foreign/reference key가 NULL로 관계 부재를 표현하도록 허용된 model입니다.", ["invalid reference와 다릅니다.", "outer join/read model 정책이 필요합니다."]),
    ],
    codeExamples: [py(
      "sql10-null-inner-match",
      "NULL·non-NULL key의 INNER JOIN truth 결과",
      "null_inner_join.py",
      "양쪽 NULL이 equality로 match하지 않고 두 known keys만 결과에 남는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE left_row(left_id INTEGER PRIMARY KEY, join_key INTEGER); CREATE TABLE right_row(right_id INTEGER PRIMARY KEY, join_key INTEGER);")
db.executemany("INSERT INTO left_row VALUES (?, ?)", [(1, 10), (2, None), (3, 20)])
db.executemany("INSERT INTO right_row VALUES (?, ?)", [(101, 10), (102, None), (103, 20)])

rows = list(db.execute("SELECT l.left_id, r.right_id FROM left_row AS l INNER JOIN right_row AS r ON r.join_key = l.join_key ORDER BY l.left_id"))
null_equality = db.execute("SELECT NULL = NULL").fetchone()[0]
print("left=3")
print("right=3")
print("matches=" + ",".join(f"{left}:{right}" for left, right in rows))
print("match-count=" + str(len(rows)))
print("null-equality=" + ("NULL" if null_equality is None else str(null_equality)))`,
      "left=3\nright=3\nmatches=1:101,3:103\nmatch-count=2\nnull-equality=NULL",
      ["sqlite-select", "postgres-table-expressions", "mysql-join", "oracle-joins"],
    )],
    diagnostics: [
      d("양쪽에 NULL key row가 있는데 inner join 결과에는 없다.", "NULL equality가 TRUE라고 가정했습니다.", ["ON expression을 SELECT로 truth-table 확인합니다.", "양쪽 key NULL counts를 셉니다.", "relationship absence와 unknown-equals-unknown requirement를 분리합니다."], "normal equality semantics를 문서화하고 관계 부재는 outer join/explicit model로 다룹니다.", "known/left-null/right-null/both-null fixtures를 join tests에 둡니다."),
    ],
    expertNotes: ["IS NOT DISTINCT FROM·NULL-safe equality의 portability와 index plan을 vendor matrix에서 확인합니다.", "NULL을 문자열/0 sentinel로 변환하면 identity와 constraint semantics가 바뀝니다."],
  },
  {
    id: "on-where-inner-boundary",
    title: "INNER JOIN에서는 ON과 WHERE 역할을 분리하고 LEFT JOIN 전환 경계를 미리 표시합니다",
    lead: "결과가 우연히 같더라도 relationship predicate와 row eligibility를 분리해야 outer join·security·plan 변경에서 의미를 지킬 수 있습니다.",
    explanations: [
      "inner join에서 right status predicate를 ON 또는 WHERE에 둘 때 같은 TRUE pairs만 남아 결과가 같을 수 있습니다. 그러나 LEFT JOIN으로 바꾸면 WHERE right.status는 null-extended rows를 제거해 accidental inner join이 됩니다.",
      "relationship validity·effective-date overlap은 ON, 최종 result population은 WHERE에 두는 convention을 사용합니다. mandatory tenant predicate는 join edge와 base filter 양쪽 threat model에서 검토합니다.",
      "optimizer는 semantic equivalence가 있을 때 predicates를 push down/reorder할 수 있습니다. SQL text 위치와 physical evaluation 순서를 동일시하지 말고 logical result와 EXPLAIN evidence를 분리합니다.",
      "non-deterministic function, error-prone casts, user-defined functions은 rewrite와 evaluation 횟수에 민감할 수 있습니다. portable safe conversion과 deterministic expressions를 boundary에 둡니다.",
    ],
    concepts: [
      c("relationship predicate", "두 rows가 같은 relationship instance인지 정하는 ON condition입니다.", ["keys·scope·effective time을 포함합니다.", "post-result filter와 구분합니다."]),
      c("null-rejecting predicate", "NULL input에서 TRUE가 되지 않아 outer join의 null-extended row를 제거하는 predicate입니다.", ["WHERE right.column 조건이 흔한 예입니다.", "LEFT JOIN에서 특히 검토합니다."]),
    ],
    diagnostics: [
      d("INNER JOIN을 LEFT JOIN으로 바꿨는데 unmatched rows가 여전히 사라진다.", "right-side null-rejecting filter를 WHERE에 남겼습니다.", ["ON과 WHERE predicates의 referenced aliases를 분류합니다.", "unmatched fixture에서 truth value를 봅니다.", "required/optional relationship을 확인합니다."], "match eligibility는 ON으로 옮기고 WHERE에는 null-preserving requirement를 명시합니다.", "inner→left migration test에 unmatched/filtered-right fixtures를 포함합니다."),
    ],
    expertNotes: ["security predicate 위치 변경은 결과 equivalence뿐 아니라 policy enforcement proof가 필요합니다.", "outer join 상세는 sql-11에서 null extension과 aggregate semantics로 확장합니다."],
  },
  {
    id: "semi-anti-join-boundary",
    title: "존재 여부 질문에는 semi/anti join을 사용하고 JOIN+DISTINCT의 fan-out을 피합니다",
    lead: "child column이 필요하지 않고 ‘하나라도 있는 parent’만 묻는다면 INNER JOIN은 pair rows를 만들기 때문에 grain이 과합니다.",
    explanations: [
      "EXISTS는 matching child의 존재만 반환하는 semi-join intent이며 parent를 최대 한 번 보존합니다. INNER JOIN은 matching child마다 parent를 반복하고 DISTINCT로 후처리해야 할 수 있습니다.",
      "NOT EXISTS는 no matching child를 표현하는 anti-join입니다. `NOT IN` subquery에 NULL이 있으면 UNKNOWN 때문에 예상과 달리 빈 결과가 될 수 있어 nullable contract를 확인합니다.",
      "LEFT JOIN ... WHERE child.primary_key IS NULL도 anti-join idiom이지만 검사 column은 matched row에서 절대 NULL이 아닌 key여야 합니다. nullable business column을 검사하면 실제 matched NULL row를 unmatched로 오분류합니다.",
      "optimizer가 EXISTS를 semi-join strategy로 변환할 수 있지만 plan shape보다 결과 grain과 early-stop 가능성을 먼저 정의합니다. representative data에서 indexes와 estimates를 측정합니다.",
      "authorization membership 확인은 duplicate membership rows를 JOIN으로 증식시키지 말고 constraints와 EXISTS를 사용합니다. timing·row-level security·tenant scope도 같은 predicate에 포함합니다.",
    ],
    concepts: [
      c("semi join", "left rows 중 right match가 하나 이상 존재하는 rows만 한 번 보존하는 operation입니다.", ["SQL에서는 EXISTS/IN으로 표현됩니다.", "right columns를 projection하지 않습니다."]),
      c("anti join", "right match가 존재하지 않는 left rows를 보존하는 operation입니다.", ["NOT EXISTS가 명시적입니다.", "NOT IN의 NULL 함정을 검토합니다."]),
    ],
    codeExamples: [py(
      "sql10-semi-join-exists",
      "INNER JOIN 반복과 EXISTS parent grain 비교",
      "semi_join_exists.py",
      "여러 child가 있는 parent가 JOIN에서는 반복되지만 EXISTS에서는 한 번만 반환되는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE account(account_id INTEGER PRIMARY KEY); CREATE TABLE event(event_id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL);")
db.executemany("INSERT INTO account VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO event VALUES (?, ?)", [(11, 1), (12, 1), (21, 2)])

joined = [row[0] for row in db.execute("SELECT a.account_id FROM account AS a INNER JOIN event AS e ON e.account_id=a.account_id ORDER BY a.account_id, e.event_id")]
exists_rows = [row[0] for row in db.execute("SELECT a.account_id FROM account AS a WHERE EXISTS (SELECT 1 FROM event AS e WHERE e.account_id=a.account_id) ORDER BY a.account_id")]
missing = [row[0] for row in db.execute("SELECT a.account_id FROM account AS a WHERE NOT EXISTS (SELECT 1 FROM event AS e WHERE e.account_id=a.account_id) ORDER BY a.account_id")]
print("join=" + ",".join(map(str, joined)))
print("join-count=" + str(len(joined)))
print("exists=" + ",".join(map(str, exists_rows)))
print("exists-count=" + str(len(exists_rows)))
print("missing=" + ",".join(map(str, missing)))`,
      "join=1,1,2\njoin-count=3\nexists=1,2\nexists-count=2\nmissing=3",
      ["local-db-0202", "sqlite-select", "postgres-table-expressions", "mysql-join"],
    )],
    diagnostics: [
      d("child가 있는 parent 목록에 DISTINCT를 빼면 duplicates가 생긴다.", "existence 질문을 pair-producing INNER JOIN으로 작성했습니다.", ["right columns가 실제 projection에 필요한지 봅니다.", "parent별 child count를 측정합니다.", "EXISTS result와 비교합니다."], "존재 여부만 필요하면 correlated EXISTS를 사용하고 complete scope predicate를 포함합니다.", "0/1/many child에서 parent가 최대 한 번 나오는지 테스트합니다."),
    ],
    expertNotes: ["EXISTS subquery의 SELECT list 값은 존재 판정에 중요하지 않지만 access control predicates는 중요합니다.", "semi/anti join 결과도 concurrent changes와 pagination snapshot contract를 정의합니다."],
  },
  {
    id: "constraints-indexes-cardinality-proof",
    title: "PK·UNIQUE·FK와 indexes로 join correctness와 access path를 각각 증명합니다",
    lead: "index가 있다고 relationship이 올바른 것은 아니고, constraint가 있다고 모든 조회가 빠른 것도 아닙니다.",
    explanations: [
      "PK/UNIQUE는 referenced side uniqueness를 보장하고 FK는 non-NULL child reference가 parent에 존재함을 강제합니다. child FK column의 uniqueness가 없으면 one-to-many가 정상입니다.",
      "SQLite는 foreign_keys pragma가 connection별로 필요하고 vendor마다 validation·deferrability·NULL semantics가 다릅니다. migration 후 orphan/duplicate audit와 enforcement state를 readback합니다.",
      "join probe index는 child foreign-key columns와 mandatory scope/equality components를 선두에 둡니다. following range/order columns를 고려하되 wide covering index의 write/storage cost를 측정합니다.",
      "partial/filtered indexes는 active rows lookup에 도움될 수 있지만 predicate implication과 portability를 확인합니다. functional cast·collation mismatch가 index 사용과 match semantics를 바꿀 수 있습니다.",
      "constraints는 optimizer cardinality 추론에도 도움을 줄 수 있지만 disabled/untrusted/not-valid 상태나 stale statistics에서는 plan을 검증해야 합니다.",
    ],
    concepts: [
      c("referential integrity", "child reference가 유효한 parent key를 가리키도록 schema가 강제하는 성질입니다.", ["NULL/deferrability/enforcement를 확인합니다.", "join result grain은 별도입니다."]),
      c("join access index", "join key lookup과 filtering/order를 효율적으로 지원하도록 설계한 index입니다.", ["constraint와 목적이 다를 수 있습니다.", "write/storage/selectivity 비용을 측정합니다."]),
    ],
    diagnostics: [
      d("foreign key가 있는데 join이 느리다.", "FK constraint가 child lookup index를 자동 보장한다고 가정했습니다.", ["child index metadata와 column order를 봅니다.", "EXPLAIN estimated/actual probes를 확인합니다.", "scope/filter/order predicates와 statistics를 점검합니다."], "representative query에 맞는 child join index를 추가하고 write cost와 plan을 재측정합니다.", "schema review에서 constraint와 supporting index를 별도 체크합니다."),
    ],
    expertNotes: ["index를 추가하기 전에 wrong cardinality query를 먼저 고칩니다. 빠른 잘못된 결과는 개선이 아닙니다.", "online index/constraint migration의 locks·replication lag·rollback을 vendor별 runbook으로 검증합니다."],
  },
  {
    id: "explain-join-algorithm-estimates",
    title: "EXPLAIN에서 join order·access path·estimated/actual cardinality를 분리해 읽습니다",
    lead: "SQL text의 table 순서가 physical join order라는 가정 대신 optimizer가 선택한 probes와 estimates를 evidence로 확인합니다.",
    explanations: [
      "nested loop, hash join, merge join은 physical strategies이며 vendor·version·statistics·memory에 따라 선택됩니다. SQLite는 주로 nested loops를 사용하고 EXPLAIN QUERY PLAN의 SCAN/SEARCH tree로 access를 요약합니다.",
      "EXPLAIN estimated rows와 EXPLAIN ANALYZE actual rows·loops를 비교해 skew/correlation/stale statistics를 찾습니다. 분석 실행형 명령은 실제 query를 실행할 수 있어 production side effect·load를 확인합니다.",
      "join order를 hint로 고정하기 전에 statistics, predicate sargability, type/collation mismatch와 missing indexes를 고칩니다. hint는 versioned last resort이며 data growth benchmark를 둡니다.",
      "plan은 text snapshot만 비교하면 harmless id 변경에 취약합니다. critical invariants인 full scan 금지 범위, index identity, max actual rows/loops, temp/spill과 latency budget을 구조화합니다.",
      "prepared parameter distribution이 크게 다르면 generic/parameter-sensitive plan 문제가 생길 수 있습니다. hot/cold keys를 따로 benchmark하고 plan cache invalidation을 운영합니다.",
    ],
    concepts: [
      c("join order", "optimizer가 physical plan에서 relations를 결합하는 순서입니다.", ["SQL text 순서와 다를 수 있습니다.", "intermediate cardinality를 좌우합니다."]),
      c("cardinality estimate error", "optimizer predicted rows와 runtime actual rows의 차이입니다.", ["join algorithm/index 선택을 왜곡합니다.", "skew·correlation·stats를 조사합니다."]),
    ],
    codeExamples: [py(
      "sql10-index-explain-keyset",
      "join index 확인과 stable keyset page",
      "join_plan_keyset.py",
      "child composite index가 plan detail에 나타나고 pair keyset이 stable 순서로 다음 세 rows를 반환하는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE parent(parent_id INTEGER PRIMARY KEY); CREATE TABLE child(child_id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL); CREATE INDEX idx_child_parent ON child(parent_id, child_id);")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?)", [(11, 1), (12, 1), (21, 2), (22, 2), (31, 3)])

plan = [row[3] for row in db.execute("EXPLAIN QUERY PLAN SELECT c.child_id FROM parent AS p INNER JOIN child AS c ON c.parent_id=p.parent_id WHERE p.parent_id=? ORDER BY c.child_id", (2,))]
uses_index = any("idx_child_parent" in detail for detail in plan)
page = list(db.execute("SELECT p.parent_id, c.child_id FROM parent AS p INNER JOIN child AS c ON c.parent_id=p.parent_id WHERE p.parent_id > ? OR (p.parent_id=? AND c.child_id>?) ORDER BY p.parent_id, c.child_id LIMIT 3", (1, 1, 11)))
print("index-present=" + str(uses_index).lower())
print("page=" + ",".join(f"{parent}:{child}" for parent, child in page))
print("page-size=" + str(len(page)))
print("first=" + f"{page[0][0]}:{page[0][1]}")
print("last=" + f"{page[-1][0]}:{page[-1][1]}")`,
      "index-present=true\npage=1:12,2:21,2:22\npage-size=3\nfirst=1:12\nlast=2:22",
      ["sqlite-eqp", "sqlite-transaction", "postgres-explain", "postgres-indexes", "postgres-transaction", "postgres-limit", "mysql-explain"],
    )],
    diagnostics: [
      d("EXPLAIN은 index를 쓰는데 production latency가 불안정하다.", "estimated selectivity가 hot/cold keys와 concurrency를 대표하지 못하거나 actual loops가 폭증합니다.", ["estimated/actual rows와 loops를 비교합니다.", "parameter distribution·stats age·cache state를 봅니다.", "lock/wait/IO/temp를 함께 측정합니다."], "representative distributions에서 stats/index/query grain을 조정하고 resource budgets를 둡니다.", "cold/warm·hot/cold·growth-scale plan/latency regression tests를 운영합니다."),
    ],
    expertNotes: ["SQLite plan description text는 release별로 바뀔 수 있어 교육 외 automated test는 stable behavioral invariant를 우선합니다.", "vendor EXPLAIN ANALYZE가 query를 실행하는지 확인하고 write statements에는 isolated rollback 환경을 사용합니다."],
  },
  {
    id: "snapshot-pagination-report-operations",
    title: "transaction snapshot·stable pagination·reconciliation으로 join report 운영을 닫습니다",
    lead: "정확한 join SQL도 여러 pages/count/detail이 서로 다른 snapshot을 읽으면 duplicates·누락·total mismatch를 만들 수 있습니다.",
    explanations: [
      "한 report의 count, page keys, joined detail과 aggregate가 같은 logical snapshot을 요구하는지 정의합니다. autocommit에서 statement마다 다른 snapshot을 읽으면 concurrent insert/delete로 page total과 rows가 어긋날 수 있습니다.",
      "isolation 이름만 믿지 말고 DBMS의 consistent-read, MVCC, locking과 read-only transaction semantics를 확인합니다. 긴 snapshot은 vacuum/undo retention·replica lag·resource cost가 있으므로 bounded export architecture를 사용합니다.",
      "OFFSET pagination은 앞 rows 변화와 큰 offset scan에 취약합니다. unique deterministic order tuple과 last-seen key를 사용하는 keyset pagination을 선호하고 NULL ordering·collation·sort direction을 token contract에 포함합니다.",
      "joined pair를 paginate할지 parent entities를 paginate할지 grain을 고정합니다. parent page라면 parent keys를 snapshot에서 먼저 선택하고 children을 complete key로 fetch합니다.",
      "report acceptance는 source counts, matched pairs, unmatched/null keys, fan-out distribution, page union/no-overlap과 final checksum을 reconciliation합니다. telemetry에는 bounded counts/plan version만 두고 raw keys·PII를 넣지 않습니다.",
      "query timeout, cancellation, replica/failover, schema/index rollout과 rollback을 runbook에 포함합니다. partial CSV/export는 completed marker와 snapshot metadata가 없으면 publish하지 않습니다.",
    ],
    concepts: [
      c("consistent snapshot", "관련 statements가 같은 database visibility point의 rows를 관찰하는 읽기 계약입니다.", ["isolation/vendor semantics를 확인합니다.", "긴 snapshot 비용을 제한합니다."]),
      c("keyset pagination", "마지막 unique order key보다 뒤 rows를 predicate로 선택하는 pagination입니다.", ["stable total order가 필요합니다.", "join result grain과 token version을 명시합니다."]),
    ],
    diagnostics: [
      d("page를 넘길 때 joined row가 중복되거나 사라진다.", "non-unique ORDER BY·OFFSET과 concurrent changes, 또는 parent/pair grain 혼동이 겹쳤습니다.", ["ORDER BY가 total order인지 확인합니다.", "pages가 같은 snapshot인지 봅니다.", "page token이 complete key와 filter/version을 담는지 검사합니다."], "stable unique keyset과 bounded consistent snapshot을 사용하고 parent/pair pagination contract를 분리합니다.", "concurrent insert/delete fixture에서 page union·no-overlap·checksum을 검증합니다."),
    ],
    expertNotes: ["API page token에는 raw sensitive key 대신 integrity-protected opaque encoding과 query version/expiry를 검토합니다.", "snapshot retry는 같은 request를 중복 publish하지 않도록 idempotent export id와 finalization을 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0130", repository: "local dbstudy snapshot", path: "dbstudy/01_30.sql", usedFor: ["INNER JOIN progression", "comma-to-explicit join", "grouped join reports"], evidence: "read-only 구조 계수에서 SELECT34·JOIN22(모두 explicit INNER)·GROUP BY17·comma FROM pattern3을 확인했습니다. sample literals는 사용하지 않았습니다." },
  { id: "local-db-0202", repository: "local dbstudy snapshot", path: "dbstudy/02_02.sql", usedFor: ["inner/outer boundary", "subquery comparison", "NULL filtering"], evidence: "read-only 구조 계수에서 SELECT48·JOIN20(INNER12·LEFT8)·IS NULL4·IN subquery6을 확인했습니다. sample literals는 사용하지 않았습니다." },
  { id: "local-db-0203", repository: "local dbstudy snapshot", path: "dbstudy/02_03.sql", usedFor: ["multi-join continuation", "left join preview", "ordering"], evidence: "read-only 구조 계수에서 SELECT35·JOIN4(LEFT3)·ORDER BY4·maximum join chain2를 확인했습니다. sample literals는 사용하지 않았습니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["CROSS/INNER JOIN", "ON/WHERE", "NULL", "EXISTS"], evidence: "실행 예제의 SQLite SELECT/JOIN semantics 기준입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["SCAN/SEARCH", "nested loops", "index plan observation"], evidence: "exact plan example에서 index identity를 관찰하는 공식 기준입니다." },
  { id: "sqlite-foreign-keys", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["composite FK", "enforcement", "supporting indexes"], evidence: "composite tenant reference example의 integrity 기준입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["read transactions", "snapshot boundary", "commit/rollback"], evidence: "pagination/report snapshot의 SQLite 경계 기준입니다." },
  { id: "postgres-table-expressions", repository: "PostgreSQL Documentation", path: "Table Expressions", publicUrl: "https://www.postgresql.org/docs/current/queries-table-expressions.html", usedFor: ["joined tables", "INNER/CROSS", "ON/WHERE", "qualified aliases"], evidence: "portable relational join 설명의 PostgreSQL 공식 기준입니다." },
  { id: "postgres-constraints", repository: "PostgreSQL Documentation", path: "Constraints", publicUrl: "https://www.postgresql.org/docs/current/ddl-constraints.html", usedFor: ["PK/UNIQUE/FK", "composite keys", "NULL"], evidence: "join cardinality를 schema로 증명하는 공식 기준입니다." },
  { id: "postgres-indexes", repository: "PostgreSQL Documentation", path: "Indexes", publicUrl: "https://www.postgresql.org/docs/current/indexes.html", usedFor: ["join indexes", "multicolumn design", "write tradeoffs"], evidence: "join access-path 설계의 공식 기준입니다." },
  { id: "postgres-explain", repository: "PostgreSQL Documentation", path: "Using EXPLAIN", publicUrl: "https://www.postgresql.org/docs/current/using-explain.html", usedFor: ["estimated/actual rows", "join algorithms", "plan evidence"], evidence: "cardinality estimate와 runtime evidence를 구분하는 공식 기준입니다." },
  { id: "postgres-transaction", repository: "PostgreSQL Documentation", path: "Transaction Isolation", publicUrl: "https://www.postgresql.org/docs/current/transaction-iso.html", usedFor: ["MVCC snapshot", "isolation", "concurrent pagination"], evidence: "report snapshot portability의 공식 기준입니다." },
  { id: "postgres-limit", repository: "PostgreSQL Documentation", path: "LIMIT and OFFSET", publicUrl: "https://www.postgresql.org/docs/current/queries-limit.html", usedFor: ["stable ordering", "pagination", "OFFSET boundary"], evidence: "pagination ordering 요구의 공식 기준입니다." },
  { id: "mysql-join", repository: "MySQL 8.4 Reference Manual", path: "JOIN Clause", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/join.html", usedFor: ["INNER/CROSS JOIN", "ON", "join syntax"], evidence: "MySQL 8.4 join portability의 공식 기준입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["join order", "access type", "estimated rows"], evidence: "MySQL plan 검증의 공식 기준입니다." },
  { id: "oracle-joins", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Joins", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Joins.html", usedFor: ["inner/equijoin", "Cartesian products", "join conditions"], evidence: "Oracle join semantics portability의 공식 기준입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-10-cartesian-inner-join", slug: "sql-10-cartesian-inner-join", courseId: "database", moduleId: "db-joins-subqueries", order: 1,
  title: "카티션 곱에서 INNER JOIN 조건 이해하기", subtitle: "모든 row pair에서 시작해 complete key predicate·grain·NULL·fan-out·semi join·plan·snapshot으로 INNER JOIN을 증명합니다.", level: "전문가", estimatedMinutes: 920,
  coreQuestion: "두 relation에서 어떤 pairs가 왜 match하는지, join 뒤 grain과 cardinality가 constraints·NULL·scope·concurrency 아래에서도 요구사항과 일치함을 어떻게 증명할까요?",
  summary: "dbstudy 01_30·02_02·02_03을 read-only로 구조 감사해 JOIN·LEFT JOIN·GROUP BY·subquery progression만 provenance로 사용합니다. Cartesian pair space, explicit INNER JOIN, composite tenant keys, one-to-many fan-out, NULL three-valued matching, ON/WHERE boundary, semi/anti join, constraints/indexes, EXPLAIN cardinality와 snapshot/keyset reporting을 연결합니다. 다섯 Python sqlite3 examples는 pair count, composite-scope 오류, NULL non-match, JOIN 대 EXISTS와 index/keyset plan을 exact stdout으로 검증합니다.",
  objectives: ["Cartesian product와 INNER JOIN predicate selectivity를 row-pair 수준으로 설명한다.", "legacy comma join을 explicit join graph와 qualified ON/WHERE로 재구성한다.", "composite key·tenant scope의 모든 components를 constraint와 predicate로 보존한다.", "one-to-many fan-out과 result grain을 계산하고 DISTINCT 오용을 피한다.", "NULL three-valued join semantics와 nullable relationship을 검증한다.", "existence 질문을 semi/anti join으로 표현하고 NOT IN NULL 경계를 설명한다.", "constraints/indexes/EXPLAIN으로 correctness와 performance를 별도 증명한다.", "consistent snapshot과 stable keyset pagination으로 joined reports를 운영한다."],
  prerequisites: [{ title: "COUNT·SUM·AVG, GROUP BY와 HAVING", reason: "join fan-out이 aggregate grain과 totals를 어떻게 바꾸는지 검산합니다.", sessionSlug: "sql-08-aggregate-group-having" }, { title: "NULL과 3값 논리", reason: "NULL join key와 WHERE/ON truth behavior를 이해합니다.", sessionSlug: "sql-04-null-three-valued-logic" }],
  keywords: ["Cartesian product", "CROSS JOIN", "INNER JOIN", "join predicate", "grain", "cardinality", "composite key", "fan-out", "NULL", "EXISTS", "anti join", "foreign key", "EXPLAIN", "keyset pagination", "snapshot"], topics,
  lab: {
    title: "tenant별 account-activity INNER JOIN을 pair proof부터 운영 report까지 구축하기",
    scenario: "accounts와 activities가 composite tenant key로 연결되고 일부 nullable 관계와 여러 child rows가 있습니다. detail·existence·paginated report가 cross-scope leakage와 fan-out 없이 같은 snapshot을 읽어야 합니다.",
    setup: ["원본 세 SQL files는 read-only provenance로만 사용하고 synthetic ids만 준비합니다.", "SQLite exact harness와 MySQL 8.4·PostgreSQL·Oracle isolated schemas를 준비합니다.", "각 relation PK/UNIQUE/FK·nullable·tenant scope와 expected cardinality를 기록합니다.", "0/1/many child, both-null, same local id across tenants, skew fixtures를 만듭니다."],
    steps: ["input counts의 Cartesian upper bound와 expected result grain을 작성합니다.", "comma join을 explicit aliases/ON/WHERE로 분리하고 disconnected join graph를 검사합니다.", "composite key와 tenant predicate를 하나씩 제거한 counterexample을 실행합니다.", "parent별 child multiplicity와 output fan-out distribution을 계산합니다.", "NULL truth table과 matched/unmatched reconciliation을 확인합니다.", "entity existence는 EXISTS, absence는 NOT EXISTS로 parent grain을 보존합니다.", "PK/UNIQUE/FK enforcement와 supporting indexes를 readback합니다.", "vendor EXPLAIN estimated/actual rows·join order·access path를 representative skew에서 비교합니다.", "parent/pair pagination grain과 unique keyset token을 정의합니다.", "bounded consistent snapshot에서 count/pages/detail checksum을 reconciliation하고 privacy-safe metrics만 남깁니다."],
    expectedResult: ["모든 join edge가 complete key·scope predicate와 schema constraint로 증명됩니다.", "detail pair와 parent entity counts가 이름과 cardinality assertion으로 구분됩니다.", "NULL·0/1/many·cross-tenant fixtures에서 leakage와 accidental Cartesian product가 없습니다.", "plans는 승인 index/resource budget을 만족하고 parameter skew를 설명합니다.", "pagination/export는 같은 snapshot·stable order에서 no-overlap/no-gap reconciliation을 통과합니다."],
    cleanup: ["isolated schemas·synthetic rows·temporary plans를 run id로 제거합니다.", "test transactions와 report snapshots를 종료하고 locks/readers를 확인합니다.", "temporary credentials와 exported page tokens를 revoke/삭제합니다.", "production source files/data는 변경하지 않고 logs에 raw keys가 없는지 검사합니다."],
    extensions: ["temporal as-of joins와 interval overlap cardinality를 추가합니다.", "partition-wise/distributed joins와 data movement budget을 비교합니다.", "join order hints와 extended statistics의 lifecycle을 실험합니다.", "row-level security가 join reorder에서도 scope를 보존하는지 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 query의 input keys·pair upper bound·output grain을 표로 작성하세요.", requirements: ["stdout을 완전 일치시킵니다.", "Cartesian 9와 matched 3을 pairs로 설명합니다.", "partial composite key 4와 complete key 2를 비교합니다.", "NULL equality와 match count를 기록합니다.", "JOIN repetition과 EXISTS parent grain을 비교합니다.", "index/keyset page invariants를 확인합니다."], hints: ["결과 columns보다 먼저 한 row가 무엇을 뜻하는지 적으세요."], expectedOutcome: "INNER JOIN을 syntax가 아니라 pair·predicate·grain contract로 설명합니다.", solutionOutline: ["relations→keys→pairs→predicate→grain→cardinality 순서입니다."] },
    { difficulty: "응용", prompt: "세 local SQL source의 join progression을 tenant-safe report query로 재구성하세요.", requirements: ["read-only counts provenance를 보존합니다.", "complete composite keys와 aliases를 사용합니다.", "fan-out과 NULL reconciliation을 포함합니다.", "EXISTS/NOT EXISTS boundary를 적용합니다.", "constraints/indexes/vendor plans를 검증합니다.", "snapshot/keyset/report metrics를 설계합니다."], hints: ["sample literals나 원본 rows를 복사하지 마세요."], expectedOutcome: "정확성·격리·성능·운영 증거를 갖춘 join report가 완성됩니다.", solutionOutline: ["audit→model→counterexample→query→plan→operation 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 multi-table join review 표준을 작성하세요.", requirements: ["result grain과 cardinality budget을 요구합니다.", "complete key/scope/temporal predicates를 검사합니다.", "NULL·fan-out·semi/anti rules를 둡니다.", "constraints/index/stats/plan gates를 정의합니다.", "snapshot/pagination/reconciliation을 포함합니다.", "privacy·authorization·rollback을 포함합니다."], hints: ["빠른 query보다 먼저 올바른 pair set을 증명하세요."], expectedOutcome: "초급 equijoin부터 운영 reporting까지 일관된 review gate가 완성됩니다.", solutionOutline: ["prove semantics→measure plan→operate safely 순서입니다."] },
  ],
  nextSessions: ["sql-11-left-outer-join"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["01_30.sql은 SELECT34·JOIN22(INNER22)·GROUP BY17·comma FROM3, 02_02.sql은 SELECT48·JOIN20(INNER12/LEFT8)·IS NULL4, 02_03.sql은 SELECT35·JOIN4(LEFT3)·ORDER BY4를 read-only로 계수했습니다.", "local sample literals·식별 가능 values·원문 query를 복사하지 않고 join form과 progression만 사용했습니다.", "원본은 composite scope, cardinality budgets, semi/anti boundary, constraint/index proof, snapshot pagination과 privacy-safe operations를 충분히 설명하지 않아 vendor primary docs와 synthetic sqlite3 examples로 보강했습니다.", "SQLite exact stdout은 MySQL/PostgreSQL/Oracle optimizer·NULL-safe operators·isolation·locking behavior를 대체하지 않습니다."] },
});

export default session;
