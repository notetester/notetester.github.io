import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory schema에 합성 multi-hop·duplicate·independent-many rows와 constraints/indexes를 준비합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "qualified aliases·complete join graph·fan-out diagnosis·pre-aggregation·window duplicates·EXPLAIN/keyset을 실행합니다." },
      { lines: "마지막 5줄", explanation: "bounded tuple·count·stable boolean만 출력하고 local source literals나 PII를 복사하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "production에서는 vendor optimizer·isolation·collation·partition/statistics와 representative distribution을 추가 검증합니다."] },
    experiments: [
      { change: "한 join edge의 key component를 제거하거나 alias를 잘못 연결합니다.", prediction: "disconnected/cross-scope pairs 또는 multiplicative fan-out이 증가합니다.", result: "join graph edge별 input/output cardinality와 complete key를 다시 증명합니다." },
      { change: "many-side relation을 parent grain으로 pre-aggregate한 query block으로 교체합니다.", prediction: "independent multiplicity 곱이 사라지고 source totals와 reconciliation됩니다.", result: "DISTINCT가 아니라 grain reduction으로 duplicate 원인을 해결합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "multi-table-join-graph-grain",
    title: "세 개 이상 tables를 join graph와 edge별 cardinality로 설계합니다",
    lead: "FROM 순서대로 왼쪽에서 오른쪽으로 읽는 데 그치지 않고 relation nodes·join edges·result grain을 먼저 그립니다.",
    explanations: [
      "multi-table query는 각 table/derived block을 node, ON predicates를 edge로 표현합니다. 모든 node가 expected relationship edge로 연결되어야 하며 disconnected component는 Cartesian product 위험입니다.",
      "01_30.sql은 active JOIN22와 maximum join chain2, 02_02.sql도 JOIN20/max chain2, 02_03.sql은 JOIN4/max chain2를 포함합니다. 지정 세 files의 progression만 provenance로 사용하고 원문 literals/query는 복사하지 않습니다.",
      "각 edge에 1:1, 1:N, N:1, N:M 기대와 nullable/required, scope/time 조건을 적습니다. 전체 result grain은 edge cardinality가 합성된 entity tuple입니다.",
      "A→B→C join에서 C key가 B를 통해서만 유효한지 A에 직접 연결되는지 schema FK를 봅니다. 이름이 비슷한 columns를 편의상 연결하지 않습니다.",
      "단계별 CTE를 debugging scaffold로 사용해 A count, A-B pairs, A-B-C pairs와 distinct keys를 기록합니다. final query가 inline되더라도 proof artifacts를 tests에 남깁니다.",
    ],
    concepts: [
      c("multi-table join graph", "relations를 nodes, complete join predicates를 edges로 나타낸 query 구조입니다.", ["disconnected nodes를 찾습니다.", "edge마다 cardinality·optionality·scope를 기록합니다."]),
      c("composed grain", "여러 join edges를 거친 결과 한 row가 나타내는 entity tuple입니다.", ["각 many edge에서 세분화됩니다.", "aggregation/pagination 전에 고정합니다."]),
    ],
    codeExamples: [py(
      "sql12-three-table-graph",
      "account→project→task complete join graph",
      "three_table_join.py",
      "세 relations의 two edges가 세 task tuples를 만들고 disconnected Cartesian upper bound보다 작음을 exact 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE account(account_id INTEGER PRIMARY KEY); CREATE TABLE project(project_id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL); CREATE TABLE task(task_id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL);")
db.executemany("INSERT INTO account VALUES (?)", [(1,), (2,)])
db.executemany("INSERT INTO project VALUES (?, ?)", [(10, 1), (20, 2)])
db.executemany("INSERT INTO task VALUES (?, ?)", [(101, 10), (102, 10), (201, 20)])

rows = list(db.execute("SELECT a.account_id, p.project_id, t.task_id FROM account AS a INNER JOIN project AS p ON p.account_id=a.account_id INNER JOIN task AS t ON t.project_id=p.project_id ORDER BY a.account_id, p.project_id, t.task_id"))
cartesian = db.execute("SELECT COUNT(*) FROM account CROSS JOIN project CROSS JOIN task").fetchone()[0]
print("edges=2")
print("rows=" + ",".join(f"{account}:{project}:{task}" for account, project, task in rows))
print("result-count=" + str(len(rows)))
print("cartesian-upper=" + str(cartesian))
print("grain=account-project-task")`,
      "edges=2\nrows=1:10:101,1:10:102,2:20:201\nresult-count=3\ncartesian-upper=12\ngrain=account-project-task",
      ["local-db-0130", "local-db-0202", "local-db-0203", "sqlite-select", "postgres-table-expressions", "mysql-join", "oracle-joins"],
    )],
    diagnostics: [
      d("세 번째 table을 추가하자 output이 예상보다 크게 늘어난다.", "새 node의 edge가 누락되었거나 N:M cardinality를 1:N으로 가정했습니다.", ["join graph disconnected components를 확인합니다.", "edge별 input/output count와 key multiplicity를 측정합니다.", "PK/UNIQUE/FK metadata를 봅니다."], "complete edge predicate를 복원하고 intentional N:M이면 bridge grain과 cardinality budget을 명시합니다.", "각 join 추가 단계의 max output ratio와 duplicate-key fixtures를 테스트합니다."),
    ],
    expertNotes: ["optimizer physical join order와 logical join graph를 구분합니다.", "graph가 복잡하면 stable domain views/query blocks로 ownership을 나누되 hidden fan-out을 view 안에 숨기지 않습니다."],
  },
  {
    id: "aliases-qualified-column-contract",
    title: "aliases와 모든 shared column qualification으로 source·scope·self-join role을 명시합니다",
    lead: "id·status·created_at 같은 중복 column names는 모호성 오류뿐 아니라 잘못된 source를 조용히 선택하는 review 위험을 만듭니다.",
    explanations: [
      "multi-table SELECT/ON/WHERE/ORDER BY의 shared names는 alias로 qualify합니다. `account.account_id AS account_id`, `task.status AS task_status`처럼 output aliases도 consumer contract에 맞게 고유하게 만듭니다.",
      "table alias를 선언하면 많은 DBMS에서 원래 table name으로 더 이상 참조할 수 없습니다. query block마다 alias scope를 이해하고 correlated subquery의 outer alias shadowing을 피합니다.",
      "self join은 manager/employee, previous/current처럼 동일 table의 서로 다른 역할을 role-based aliases로 구분합니다. a,b보다 employee/manager가 predicate review에 유리합니다.",
      "SELECT *는 duplicate output names, schema drift, wide rows와 ORM mapping overwrite를 만듭니다. 필요한 columns를 qualified projection하고 API/export names를 명시합니다.",
      "ORDER BY output alias/ordinal과 GROUP BY alias 지원은 dialect별로 다릅니다. reusable query는 explicit qualified expression 또는 named query block을 사용합니다.",
    ],
    concepts: [
      c("table alias", "query block 안에서 relation instance와 role을 식별하는 local name입니다.", ["self join roles를 분리합니다.", "column qualification의 source가 됩니다."]),
      c("output alias", "result column의 consumer-facing 이름입니다.", ["source table alias와 목적이 다릅니다.", "duplicate names와 schema drift를 방지합니다."]),
    ],
    codeExamples: [py(
      "sql12-ambiguous-qualified",
      "중복 status의 ambiguous 오류와 qualified projection",
      "alias_qualification.py",
      "두 tables가 status를 공유할 때 unqualified projection을 stable category로 포착하고 qualified aliases가 정확한 values를 반환하는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE account(account_id INTEGER PRIMARY KEY, status TEXT); CREATE TABLE task(task_id INTEGER PRIMARY KEY, account_id INTEGER, status TEXT);")
db.execute("INSERT INTO account VALUES (1, 'OPEN')")
db.execute("INSERT INTO task VALUES (10, 1, 'DONE')")

try:
    db.execute("SELECT status FROM account AS a INNER JOIN task AS t ON t.account_id=a.account_id").fetchall()
    ambiguous = False
except sqlite3.OperationalError as error:
    ambiguous = "ambiguous" in str(error).lower()
row = db.execute("SELECT a.status AS account_status, t.status AS task_status FROM account AS a INNER JOIN task AS t ON t.account_id=a.account_id").fetchone()
print("ambiguous=" + str(ambiguous).lower())
print("account-status=" + row[0])
print("task-status=" + row[1])
print("columns=account_status,task_status")
print("qualified=" + str(row == ("OPEN", "DONE")).lower())`,
      "ambiguous=true\naccount-status=OPEN\ntask-status=DONE\ncolumns=account_status,task_status\nqualified=true",
      ["sqlite-select", "postgres-table-expressions", "mysql-join", "oracle-joins"],
    )],
    diagnostics: [
      d("query에 table을 하나 추가한 뒤 ambiguous column 오류 또는 잘못된 status mapping이 발생한다.", "shared column을 unqualified SELECT/WHERE/ORDER로 사용하거나 duplicate output names를 만들었습니다.", ["schema의 shared column names를 나열합니다.", "모든 references와 output metadata를 inspect합니다.", "ORM/export mapping collision을 확인합니다."], "role-based table aliases와 unique output aliases로 필요한 columns만 명시합니다.", "multi-table SQL lint에서 SELECT *와 unqualified shared columns를 금지합니다."),
    ],
    expertNotes: ["generated SQL도 aliases가 stable하다는 가정 대신 bound parameters/result mappings을 검사합니다.", "aliases는 identifier quoting/case-folding rules를 target DB에서 확인합니다."],
  },
  {
    id: "multi-hop-composite-scope",
    title: "multi-hop join에서 composite tenant key와 bridge scope를 모든 edge에 전달합니다",
    lead: "첫 edge에 tenant 조건이 있어도 다음 edge가 local id만 사용하면 cross-scope rows가 다시 유입됩니다.",
    explanations: [
      "tenant-scoped project/task처럼 각 PK가 `(tenant_id, local_id)`이면 account→project와 project→task 모든 edges에 tenant component가 필요합니다. 한 edge의 누락이 전체 path authorization를 깨뜨립니다.",
      "bridge table의 PK/UNIQUE는 양쪽 foreign keys 조합과 business uniqueness를 표현합니다. enrollment/user-role 같은 N:M bridge에서 surrogate id만 join하고 scope를 잃지 않습니다.",
      "composite foreign keys는 referenced unique tuple과 types/collations를 맞춥니다. nullable component가 있으면 MATCH semantics와 relationship absence policy를 vendor별로 확인합니다.",
      "query builder가 base tenant filter를 적용해도 join edge에서 wrong tenant metadata를 match한 후 projection할 수 있습니다. same-local-id-across-tenants negative fixture가 필요합니다.",
      "index는 `(tenant_id, parent_id, child_order)`처럼 equality scope/key를 선두에 두고 filter/order를 이어 설계합니다. global analytics와 tenant lookup에 필요한 별도 indexes를 비교합니다.",
    ],
    concepts: [
      c("scope propagation", "tenant/security realm key를 multi-hop join의 모든 relevant edges와 query blocks에 유지하는 규칙입니다.", ["base WHERE 하나로 대체되지 않습니다.", "cross-scope negative tests가 필요합니다."]),
      c("bridge grain", "N:M relationship table 한 row가 나타내는 left-right key tuple과 optional attributes입니다.", ["composite uniqueness를 정의합니다.", "양쪽 join cardinality를 분리합니다."]),
    ],
    codeExamples: [py(
      "sql12-multihop-tenant-scope",
      "마지막 edge의 tenant 누락 fan-out 진단",
      "multihop_tenant_join.py",
      "두 tenants가 같은 project/task local ids를 쓸 때 last edge의 scope 누락이 rows를 배가하는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE project(tenant TEXT, project_id INTEGER, PRIMARY KEY(tenant, project_id)); CREATE TABLE task(tenant TEXT, task_id INTEGER, project_id INTEGER, PRIMARY KEY(tenant, task_id), FOREIGN KEY(tenant, project_id) REFERENCES project(tenant, project_id)); CREATE TABLE note(tenant TEXT, note_id INTEGER, task_id INTEGER, PRIMARY KEY(tenant, note_id), FOREIGN KEY(tenant, task_id) REFERENCES task(tenant, task_id));")
db.executemany("INSERT INTO project VALUES (?, ?)", [("T1", 1), ("T2", 1)])
db.executemany("INSERT INTO task VALUES (?, ?, ?)", [("T1", 10, 1), ("T2", 10, 1)])
db.executemany("INSERT INTO note VALUES (?, ?, ?)", [("T1", 100, 10), ("T2", 100, 10)])

wrong = db.execute("SELECT COUNT(*) FROM project AS p JOIN task AS t ON t.tenant=p.tenant AND t.project_id=p.project_id JOIN note AS n ON n.task_id=t.task_id").fetchone()[0]
correct = list(db.execute("SELECT p.tenant, n.note_id FROM project AS p JOIN task AS t ON t.tenant=p.tenant AND t.project_id=p.project_id JOIN note AS n ON n.tenant=t.tenant AND n.task_id=t.task_id ORDER BY p.tenant"))
print("projects=2")
print("missing-scope=" + str(wrong))
print("complete-scope=" + str(len(correct)))
print("rows=" + ",".join(f"{tenant}:{note}" for tenant, note in correct))
print("leak-prevented=" + str(wrong != len(correct)).lower())`,
      "projects=2\nmissing-scope=4\ncomplete-scope=2\nrows=T1:100,T2:100\nleak-prevented=true",
      ["local-db-0130", "local-db-0202", "sqlite-foreign-keys", "postgres-constraints", "postgres-indexes"],
    )],
    diagnostics: [
      d("첫 join은 tenant-safe인데 세 번째 table에서 다른 tenant row가 섞인다.", "multi-hop 마지막 edge가 local id만 비교하고 scope를 전파하지 않았습니다.", ["모든 edge predicate의 composite tuple을 표로 만듭니다.", "same local ids across scopes를 실행합니다.", "joined rows의 tenant equality를 assertion합니다."], "각 edge에 complete tenant+local key를 적용하고 composite FK/UNIQUE로 schema에 강제합니다.", "query graph의 모든 nodes에 scope reachability와 cross-tenant negative tests를 둡니다."),
    ],
    expertNotes: ["cross-scope join은 보안 incident로 분류하고 logs/exports의 exposure를 평가합니다.", "sharded/distributed joins에서는 routing key와 data movement가 scope proof 일부입니다."],
  },
  {
    id: "multiplicative-fanout-independent-many",
    title: "서로 독립적인 many-side joins가 measures를 multiplicatively 증식시키는 원리를 계산합니다",
    lead: "invoice lines 2개와 payments 2개를 한 invoice에 raw join하면 4 pairs가 되고 양쪽 금액이 각각 반복됩니다.",
    explanations: [
      "parent P에 child A가 m개, child B가 n개이고 A/B 사이 직접 edge가 없으면 P-A-B output은 m×n rows입니다. SUM(A.amount)와 SUM(B.amount)가 각각 다른 side multiplicity만큼 중복됩니다.",
      "SUM(DISTINCT amount)는 같은 금액의 실제 rows까지 제거하므로 fan-out correction이 아닙니다. DISTINCT entity id로 count를 고쳐도 sums·averages·pagination은 여전히 왜곡될 수 있습니다.",
      "각 many relation을 parent grain으로 pre-aggregate해 `(parent_id, line_total)`과 `(parent_id, payment_total)` 한 row씩 만든 뒤 parent에 join합니다. source detail totals와 summaries를 reconciliation합니다.",
      "one side의 detail columns와 other side aggregate를 동시에 요구하면 window/aggregate grain을 명확히 하고 measures를 independent subqueries에서 계산합니다. 반복된 summary value를 UI에서 다시 합산하지 않습니다.",
      "fan-out budget은 max/percentile child counts와 skew를 포함합니다. 한 parent의 extreme multiplicity가 query memory/temp/network를 지배할 수 있습니다.",
    ],
    concepts: [
      c("multiplicative fan-out", "같은 parent에 독립적으로 연결된 many relations의 row counts가 곱해지는 join cardinality입니다.", ["m×n으로 계산합니다.", "measures를 반복시킵니다."]),
      c("measure lineage", "집계 값이 어느 base fact rows와 변환을 거쳐 계산됐는지 추적하는 정보입니다.", ["pre-aggregation grain을 포함합니다.", "source totals와 reconciliation합니다."]),
    ],
    codeExamples: [py(
      "sql12-fanout-preaggregate",
      "lines×payments raw totals와 pre-aggregated totals 비교",
      "multitable_fanout.py",
      "한 parent의 2×2 raw join이 양쪽 totals를 두 배로 만들고 independent pre-aggregation이 canonical totals를 복원하는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE invoice(invoice_id INTEGER PRIMARY KEY); CREATE TABLE line(line_id INTEGER PRIMARY KEY, invoice_id INTEGER, amount INTEGER); CREATE TABLE payment(payment_id INTEGER PRIMARY KEY, invoice_id INTEGER, amount INTEGER);")
db.execute("INSERT INTO invoice VALUES (1)")
db.executemany("INSERT INTO line VALUES (?, 1, ?)", [(11, 10), (12, 20)])
db.executemany("INSERT INTO payment VALUES (?, 1, ?)", [(21, 5), (22, 25)])

raw = db.execute("SELECT COUNT(*), SUM(l.amount), SUM(p.amount) FROM invoice AS i JOIN line AS l ON l.invoice_id=i.invoice_id JOIN payment AS p ON p.invoice_id=i.invoice_id").fetchone()
fixed = db.execute("WITH lt AS (SELECT invoice_id, SUM(amount) total FROM line GROUP BY invoice_id), pt AS (SELECT invoice_id, SUM(amount) total FROM payment GROUP BY invoice_id) SELECT lt.total, pt.total FROM invoice AS i LEFT JOIN lt ON lt.invoice_id=i.invoice_id LEFT JOIN pt ON pt.invoice_id=i.invoice_id").fetchone()
print("raw-pairs=" + str(raw[0]))
print("raw-line-total=" + str(raw[1]))
print("raw-payment-total=" + str(raw[2]))
print("fixed=" + f"line:{fixed[0]},payment:{fixed[1]}")
print("canonical=" + str(fixed == (30, 30)).lower())`,
      "raw-pairs=4\nraw-line-total=60\nraw-payment-total=60\nfixed=line:30,payment:30\ncanonical=true",
      ["local-db-0130", "sqlite-select", "postgres-table-expressions", "mysql-join", "oracle-joins"],
    )],
    diagnostics: [
      d("두 child totals를 한 query로 계산하자 둘 다 정확히 두 배가 된다.", "independent 1:N relations를 parent에서 raw join해 2×2 pairs를 집계했습니다.", ["parent별 각 child count와 joined count를 비교합니다.", "base detail sums와 raw joined sums를 봅니다.", "query grain과 CTE output uniqueness를 확인합니다."], "각 child를 parent key별 pre-aggregate한 one-row summaries로 만든 뒤 join합니다.", "1×N, M×1, M×N과 equal-amount fixtures로 DISTINCT 오용을 방지합니다."),
    ],
    expertNotes: ["pre-aggregate predicates/time windows/currency units가 각 source에서 같은 report contract를 사용하는지 검증합니다.", "decimal rounding은 source measure aggregation과 presentation 사이 정확한 stage에 적용합니다."],
  },
  {
    id: "preaggregation-query-block-contract",
    title: "CTE·derived table의 input filter·grain·key uniqueness를 interface처럼 검증합니다",
    lead: "pre-aggregation은 문법 trick이 아니라 many facts를 어떤 population과 key로 한 row에 요약하는 query-block contract입니다.",
    explanations: [
      "각 query block에 input population, output grain, key, measures, NULL/empty behavior를 적습니다. `GROUP BY parent_id` summary는 parent_id당 최대 한 row임을 duplicate assertion으로 검증합니다.",
      "CTE materialization/inlining은 vendor·version에 따라 달라질 수 있어 correctness와 physical behavior를 분리합니다. 동일 CTE 반복 reference와 expensive calculation의 plan을 확인합니다.",
      "filters를 summary 안/밖에 두는 위치가 measure population을 바꿉니다. report date/status/tenant를 source fact에 먼저 적용하고 parent preservation filters와 구분합니다.",
      "no child일 때 summary row 자체가 없고 outer join 후 measures가 NULL입니다. count display 0과 no-data sum NULL 정책을 consumer contract에 맞게 처리합니다.",
      "summary reuse가 많으면 governed view/materialized projection을 검토하되 freshness, incremental updates, deletes, rebuild와 row-level access를 운영합니다.",
    ],
    concepts: [
      c("query-block interface", "derived relation의 input population·output columns·grain·key·NULL semantics를 명시한 계약입니다.", ["CTE/view/subquery 모두 적용합니다.", "consumer join cardinality를 예측하게 합니다."]),
      c("summary uniqueness", "pre-aggregated output에서 group key가 row를 유일하게 결정하는 성질입니다.", ["GROUP BY/constraint로 증명합니다.", "join 전에 duplicate assertion을 둡니다."]),
    ],
    diagnostics: [
      d("pre-aggregation을 했는데 totals가 여전히 다르다.", "summary filters/grain이 report contract와 다르거나 summary key가 실제로 unique하지 않습니다.", ["CTE input keys/filters와 source detail을 diff합니다.", "summary key별 COUNT(*)>1을 확인합니다.", "units/timezone/currency를 비교합니다."], "query-block contract를 명시하고 canonical source totals와 key uniqueness를 통과한 summary만 join합니다.", "CTE별 golden inputs/outputs와 reconciliation assertions를 둡니다."),
    ],
    expertNotes: ["CTE는 자동 성능 최적화가 아니며 plan에서 scans/materialization/spill을 확인합니다.", "materialized summary access policy가 base rows보다 넓어지지 않게 authorization를 재검증합니다."],
  },
  {
    id: "duplicate-root-cause-window-diagnostics",
    title: "duplicate rows를 natural-key groups와 ROW_NUMBER lineage로 원인 table까지 추적합니다",
    lead: "final SELECT DISTINCT 전에 어느 base/bridge key가 몇 번 반복되고 어떤 rows가 extra인지 표시합니다.",
    explanations: [
      "duplicate는 exact row duplicate, projection duplicate, business natural-key duplicate, intentional one-to-many pair를 구분합니다. 각 정의마다 key columns와 action이 다릅니다.",
      "`GROUP BY natural_key HAVING COUNT(*)>1`은 duplicate groups를 찾고 ROW_NUMBER partition/order는 canonical candidate와 extra rows를 표시합니다. order에는 deterministic unique tie-breaker를 포함합니다.",
      "join 단계별 `COUNT(*)`, `COUNT(DISTINCT key)`와 key multiplicity histogram으로 first exploding edge를 찾습니다. final output만 보면 root cause가 여러 tables 뒤에 숨습니다.",
      "duplicate cleanup 전에 FK references, child merge policy, timestamps, audit/legal retention과 concurrent writers를 조사합니다. 단순 delete는 data loss를 만들 수 있습니다.",
      "재발 방지는 canonicalization 후 UNIQUE constraint/index와 transactional upsert/idempotency key로 설계합니다. application precheck만으로 race를 막지 못합니다.",
    ],
    concepts: [
      c("natural-key duplicate", "업무적으로 하나여야 하는 key tuple을 둘 이상의 rows가 공유하는 상태입니다.", ["schema UNIQUE로 예방합니다.", "cleanup merge policy가 필요합니다."]),
      c("duplicate lineage", "어느 source row·join edge가 repeated output에 기여했는지 추적하는 evidence입니다.", ["stage counts와 ROW_NUMBER를 사용합니다.", "DISTINCT 전에 수집합니다."]),
    ],
    codeExamples: [py(
      "sql12-window-duplicate-diagnosis",
      "natural key duplicate groups와 extra row ids 표시",
      "duplicate_lineage.py",
      "registration natural key가 두 번씩 나타나는 groups와 rn>1 extra ids, join fan-out을 exact 진단합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE course(course_id INTEGER PRIMARY KEY); CREATE TABLE registration(registration_id INTEGER PRIMARY KEY, course_id INTEGER, member_id INTEGER);")
db.executemany("INSERT INTO course VALUES (?)", [(10,), (20,)])
db.executemany("INSERT INTO registration VALUES (?, ?, ?)", [(1, 10, 100), (2, 10, 100), (3, 20, 200), (4, 20, 200), (5, 20, 201)])

groups = list(db.execute("SELECT course_id, member_id, COUNT(*) FROM registration GROUP BY course_id, member_id HAVING COUNT(*)>1 ORDER BY course_id"))
extras = [row[0] for row in db.execute("SELECT registration_id FROM (SELECT registration_id, ROW_NUMBER() OVER (PARTITION BY course_id, member_id ORDER BY registration_id) rn FROM registration) WHERE rn>1 ORDER BY registration_id")]
joined = db.execute("SELECT COUNT(*) FROM course AS c JOIN registration AS r ON r.course_id=c.course_id").fetchone()[0]
print("groups=" + ",".join(f"{course}:{member}:{count}" for course, member, count in groups))
print("extra-ids=" + ",".join(map(str, extras)))
print("base-rows=5")
print("joined-rows=" + str(joined))
print("duplicate-groups=" + str(len(groups)))`,
      "groups=10:100:2,20:200:2\nextra-ids=2,4\nbase-rows=5\njoined-rows=5\nduplicate-groups=2",
      ["sqlite-window", "sqlite-select", "postgres-constraints", "postgres-table-expressions"],
    )],
    diagnostics: [
      d("DISTINCT를 제거하면 duplicates가 나오지만 어느 table 문제인지 모른다.", "projection만 비교하고 base natural keys와 join-stage multiplicity를 측정하지 않았습니다.", ["각 base natural key duplicate groups를 찾습니다.", "join edge별 row/distinct key counts를 기록합니다.", "ROW_NUMBER로 contributing extra ids를 표시합니다."], "first cardinality explosion 또는 violated uniqueness를 수정하고 필요한 relationship fan-out은 grain으로 명시합니다.", "stage-cardinality assertions와 UNIQUE/idempotency concurrency tests를 둡니다."),
    ],
    expertNotes: ["ROW_NUMBER rn=1을 자동 canonical row로 삭제 기준 삼지 말고 business merge policy를 승인받습니다.", "duplicate evidence에 raw PII를 노출하지 않고 governed surrogate/run ids를 사용합니다."],
  },
  {
    id: "semi-anti-existence-in-graph",
    title: "join graph에서 existence/absence branches는 semi·anti joins로 cardinality를 격리합니다",
    lead: "right detail이 필요 없는 eligibility relation까지 raw join하면 main grain과 aggregates가 불필요하게 세분화됩니다.",
    explanations: [
      "‘active membership이 있는 projects’는 membership columns가 필요 없으면 EXISTS로 filter합니다. multiple memberships가 project rows를 반복시키지 않습니다.",
      "absence는 NOT EXISTS로 표현하고 complete tenant/status/effective predicates를 subquery에 포함합니다. NOT IN nullable result와 LEFT JOIN nullable payload anti marker를 피합니다.",
      "detail branch와 existence branch를 분리합니다. 예를 들어 task detail은 join하고 permission existence는 EXISTS로 확인해 task grain을 유지합니다.",
      "multiple EXISTS predicates는 optimizer가 semi-join strategies로 변환할 수 있습니다. 각 branch의 selectivity/index와 correlated scope를 EXPLAIN에서 확인합니다.",
      "authorization existence와 reporting filter를 같은 query에 섞을 때 row-level security와 parameter binding을 검증합니다. missing permission을 데이터 없음과 같은 UI로 표현할지도 threat model로 정합니다.",
    ],
    concepts: [
      c("existence branch", "main result에 columns를 추가하지 않고 related row 존재 여부만 eligibility로 사용하는 join-graph branch입니다.", ["EXISTS semi join으로 표현합니다.", "main grain을 보존합니다."]),
      c("absence branch", "complete correlated predicate에 match가 없음을 요구하는 anti-join branch입니다.", ["NOT EXISTS를 사용합니다.", "snapshot과 NULL semantics를 검증합니다."]),
    ],
    diagnostics: [
      d("permission table을 추가한 뒤 task rows와 totals가 membership 수만큼 늘어난다.", "existence-only relationship을 raw INNER JOIN으로 projection graph에 포함했습니다.", ["permission columns가 consumer에 필요한지 확인합니다.", "task별 membership multiplicity를 봅니다.", "EXISTS result/count와 비교합니다."], "permission은 complete-scope EXISTS로 filter하고 main task/detail joins와 grain을 분리합니다.", "0/1/many memberships에서 main keys가 한 번만 나오는지 테스트합니다."),
    ],
    expertNotes: ["EXISTS가 빨리 멈출 수 있어도 missing index와 high outer cardinality에서는 비쌀 수 있습니다.", "security existence predicate를 client가 선택적으로 제거할 수 없는 server-owned query boundary에 둡니다."],
  },
  {
    id: "multitable-index-explain-statistics",
    title: "edge별 indexes와 EXPLAIN actual cardinality로 join order·spill·skew를 검증합니다",
    lead: "한 개 composite index로 전체 graph를 해결하려 하지 말고 각 probe·filter·order와 intermediate cardinality를 측정합니다.",
    explanations: [
      "각 join edge의 inner/probe side에 complete equality keys와 scope를 지원하는 index를 검토합니다. outer driving filters/order에는 별도 index가 필요할 수 있습니다.",
      "optimizer는 estimated relation sizes와 selectivity로 join order/algorithm을 선택합니다. correlated tenant+status·skewed hot parent는 single-column stats가 오판할 수 있어 extended/multicolumn statistics capability를 확인합니다.",
      "EXPLAIN ANALYZE에서 node별 actual rows×loops, estimates, index condition, join filter rows removed, sort/hash memory·spill을 봅니다. final latency만으로 first explosion을 찾기 어렵습니다.",
      "CTE/materialized summaries와 window top-one이 sort/temp를 만들 수 있습니다. index order와 partition keys를 맞추고 wide projection을 늦춥니다.",
      "hints/forced order는 data/version drift와 plan cache lifecycle을 가진 last resort입니다. stats refresh, query rewrite, appropriate indexes 뒤 hot/cold regression을 둡니다.",
    ],
    concepts: [
      c("intermediate cardinality", "join graph의 중간 plan node가 생성하는 rows 수입니다.", ["final rows보다 훨씬 클 수 있습니다.", "memory/loops/spill을 좌우합니다."]),
      c("edge index", "특정 join graph edge의 complete key lookup과 filters를 지원하는 index입니다.", ["모든 graph에 하나로 충분하지 않습니다.", "write/storage와 stats를 운영합니다."]),
    ],
    diagnostics: [
      d("final 결과는 100 rows인데 plan 중간에서 수백만 rows가 생성된다.", "late filter 또는 independent fan-out, wrong join order/estimate가 큰 intermediate를 만들었습니다.", ["actual rows×loops가 처음 폭증하는 node를 찾습니다.", "edge predicate/grain/index와 stats를 확인합니다.", "pre-aggregation/filter pushdown equivalence를 검증합니다."], "correct edge/grain을 복원하고 early safe filters/pre-aggregation과 indexes/statistics를 적용합니다.", "intermediate cardinality/spill/latency budgets를 growth-scale CI에 둡니다."),
    ],
    expertNotes: ["vendor plan output은 version별로 바뀌므로 node identity보다 cardinality/resource invariants를 우선합니다.", "EXPLAIN ANALYZE가 실제 writes를 수행할 수 있으므로 isolated transaction/rollback과 permissions를 확인합니다."],
  },
  {
    id: "snapshot-keyset-parent-first",
    title: "parent-first keyset·consistent snapshot으로 multi-table pages와 totals를 일치시킵니다",
    lead: "joined pairs에 LIMIT/OFFSET을 적용한 뒤 parents를 deduplicate하면 page size·순서·total이 깨집니다.",
    explanations: [
      "API가 parent entities를 page한다면 eligible parent keys를 unique deterministic order로 먼저 선택합니다. 그 bounded keys에 details/pre-aggregates를 join하고 response에서 page grain을 유지합니다.",
      "keyset predicate는 full order tuple과 sort direction, NULL/collation semantics를 반영합니다. non-unique timestamp만 token으로 쓰면 ties에서 rows가 빠지거나 반복됩니다.",
      "count query와 parent page, detail batches가 같은 snapshot/freshness를 요구하는지 정합니다. statements 사이 concurrent writes가 있으면 count와 pages가 달라질 수 있습니다.",
      "transaction isolation과 MVCC snapshot은 vendor별로 다르고 long snapshots는 vacuum/undo/replica 비용을 만듭니다. large export는 bounded materialized key set와 run id를 검토합니다.",
      "page token에는 query/report version·filters·order·last key·expiry/integrity를 포함합니다. raw tenant/user ids를 노출하지 않고 authorization를 매 request 재검증합니다.",
    ],
    concepts: [
      c("parent-first query", "target entity keys를 먼저 filter/order/page한 뒤 related details를 join하는 query shape입니다.", ["entity page grain을 보존합니다.", "many-side fan-out을 page 이후에 격리합니다."]),
      c("total order tuple", "동률 없이 모든 page rows의 앞뒤를 결정하는 ordered key components입니다.", ["unique tie-breaker를 포함합니다.", "token과 predicate가 같은 semantics를 사용합니다."]),
    ],
    codeExamples: [py(
      "sql12-parent-first-keyset-plan",
      "parent page 뒤 summary join과 supporting index plan",
      "multitable_parent_page.py",
      "cursor 뒤 두 accounts를 먼저 고르고 task summary를 join하며 edge index가 plan에 보이는지 exact 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE account(account_id INTEGER PRIMARY KEY); CREATE TABLE task(task_id INTEGER PRIMARY KEY, account_id INTEGER, points INTEGER); CREATE INDEX idx_task_account ON task(account_id, task_id);")
db.executemany("INSERT INTO account VALUES (?)", [(1,), (2,), (3,), (4,)])
db.executemany("INSERT INTO task VALUES (?, ?, ?)", [(11, 1, 2), (12, 1, 3), (21, 2, 5), (41, 4, 7)])

rows = list(db.execute("WITH page AS (SELECT account_id FROM account WHERE account_id>? ORDER BY account_id LIMIT 2), totals AS (SELECT account_id, COUNT(*) n, SUM(points) points FROM task GROUP BY account_id) SELECT p.account_id, COALESCE(t.n,0), COALESCE(t.points,0) FROM page AS p LEFT JOIN totals AS t ON t.account_id=p.account_id ORDER BY p.account_id", (1,)))
plan = [row[3] for row in db.execute("EXPLAIN QUERY PLAN SELECT task_id FROM task WHERE account_id=? ORDER BY task_id", (2,))]
print("page=" + ",".join(str(account) for account, _, _ in rows))
print("summaries=" + ",".join(f"{account}:{count}:{points}" for account, count, points in rows))
print("page-size=" + str(len(rows)))
print("task-index=" + str(any("idx_task_account" in detail for detail in plan)).lower())
print("next-token=" + str(rows[-1][0]))`,
      "page=2,3\nsummaries=2:1:5,3:0:0\npage-size=2\ntask-index=true\nnext-token=3",
      ["sqlite-eqp", "sqlite-transaction", "postgres-indexes", "postgres-explain", "postgres-transaction", "postgres-limit", "mysql-explain"],
    )],
    diagnostics: [
      d("LIMIT 20 query가 ORM deduplication 뒤 7 parents만 반환한다.", "many-side joined rows를 page하고 application에서 parent identity를 합쳤습니다.", ["SQL row count와 distinct parent count를 비교합니다.", "ORDER BY total order와 LIMIT 위치를 봅니다.", "count/page/detail snapshot을 확인합니다."], "parent keys를 stable keyset으로 먼저 page하고 related summaries/details를 bounded join/batch로 가져옵니다.", "0/1/many child에서 exact page entity count·no-overlap·token continuity를 테스트합니다."),
    ],
    expertNotes: ["parent-first CTE가 optimizer에서 inline되어도 LIMIT/order semantics와 plan actual rows를 검증합니다.", "count가 비싸면 approximate/omitted total UX를 명시하고 stale exact count로 오해시키지 않습니다."],
  },
  {
    id: "join-report-reconciliation-operations",
    title: "join report를 schema version·reconciliation·rollback·privacy-safe telemetry로 운영합니다",
    lead: "정확한 SQL text 하나보다 join graph·grain·constraints·snapshot·metric definitions와 correction workflow가 함께 있어야 합니다.",
    explanations: [
      "report definition에는 join graph/version, each edge key/cardinality/optionality, population, result grain, measures, NULL policy, sort/page, snapshot/freshness와 owner를 기록합니다.",
      "reconciliation은 base entity counts, edge matched/unmatched, key multiplicity, independent source totals, summary totals, page union/checksum을 독립 controls로 수행합니다. DISTINCT count 하나로 모든 문제를 숨기지 않습니다.",
      "schema/index/query rollout은 shadow query, result diff, plan/resource budget, canary, rollback을 포함합니다. constraint validation과 duplicate cleanup을 순서화하고 failed partial index/summary artifacts를 제거합니다.",
      "production telemetry에는 query/report version, bounded table/input/intermediate/output counts, unmatched/fan-out buckets, duration/spill/plan hash/snapshot age만 기록합니다. raw SQL parameters·names·emails·notes·tenant ids를 high-cardinality labels로 넣지 않습니다.",
      "timeouts/cancellation/failover/retry는 idempotent report run id와 partial artifact isolation을 사용합니다. stale/export mismatch를 감지하면 publish를 막고 source-of-truth reconciliation 후 restate합니다.",
      "small groups와 join-derived attributes는 re-identification 위험이 있습니다. authorization, column minimization, cohort suppression, retention/export access를 aggregate 여부와 무관하게 검토합니다.",
    ],
    concepts: [
      c("join contract", "edge keys·cardinality·optionality·grain·NULL·snapshot을 versioned하게 설명하는 query/report specification입니다.", ["schema and plans와 연결합니다.", "consumer changes를 관리합니다."]),
      c("join reconciliation", "base facts와 intermediate/final rows·measures 사이 key/count/sum invariants를 독립적으로 검증하는 통제입니다.", ["fan-out/omission을 탐지합니다.", "publish/rollback과 연결합니다."]),
    ],
    diagnostics: [
      d("dashboard와 export가 같은 join report 이름인데 totals가 다르다.", "join graph/filter/grain/snapshot/query versions가 서로 다르고 reconciliation metadata가 없습니다.", ["SQL/report versions와 parameters/snapshot times를 비교합니다.", "edge cardinality와 source/summary totals를 diff합니다.", "page/export completion markers를 확인합니다."], "canonical versioned join contract를 공유하거나 다른 metrics로 명명하고 historical outputs를 restate합니다.", "cross-channel golden facts·plan budgets·snapshot reconciliation을 release gate에 둡니다."),
    ],
    expertNotes: ["report correction은 downstream caches/downloads/decisions에 version/restatement communication을 전달합니다.", "raw duplicate/orphan evidence는 governed access에서 최소 기간만 보존합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0130", repository: "local dbstudy snapshot", path: "dbstudy/01_30.sql", usedFor: ["multi-table INNER JOIN progression", "grouped reports", "legacy comma boundary"], evidence: "read-only 구조 계수에서 SELECT34·JOIN22(INNER22)·GROUP BY17·maximum join chain2를 확인했습니다. sample literals는 사용하지 않았습니다." },
  { id: "local-db-0202", repository: "local dbstudy snapshot", path: "dbstudy/02_02.sql", usedFor: ["mixed INNER/LEFT joins", "subquery comparison", "NULL diagnostics"], evidence: "read-only 구조 계수에서 SELECT48·JOIN20(INNER12/LEFT8)·IS NULL4·IN subquery6·maximum join chain2를 확인했습니다. sample literals는 사용하지 않았습니다." },
  { id: "local-db-0203", repository: "local dbstudy snapshot", path: "dbstudy/02_03.sql", usedFor: ["multi-table continuation", "LEFT JOIN", "stable ordering"], evidence: "read-only 구조 계수에서 SELECT35·JOIN4(LEFT3)·ORDER BY4·maximum join chain2를 확인했습니다. sample literals는 사용하지 않았습니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["multi-table joins", "aliases", "CTE/GROUP", "EXISTS"], evidence: "exact sqlite3 join examples의 공식 SELECT 기준입니다." },
  { id: "sqlite-window", repository: "SQLite Documentation", path: "Window Functions", publicUrl: "https://www.sqlite.org/windowfunctions.html", usedFor: ["ROW_NUMBER", "duplicate lineage", "deterministic partition order"], evidence: "duplicate diagnosis example의 공식 기준입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["edge index observation", "SCAN/SEARCH", "join loops"], evidence: "parent-first plan example의 공식 기준입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["read snapshot", "report transaction", "rollback"], evidence: "pagination/report operation의 SQLite 기준입니다." },
  { id: "sqlite-foreign-keys", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["composite scope FKs", "enforcement", "bridge integrity"], evidence: "multi-hop scope example의 integrity 기준입니다." },
  { id: "postgres-table-expressions", repository: "PostgreSQL Documentation", path: "Table Expressions", publicUrl: "https://www.postgresql.org/docs/current/queries-table-expressions.html", usedFor: ["joined-table graph", "aliases", "ON/WHERE", "outer/inner nesting"], evidence: "portable multi-table semantics의 공식 기준입니다." },
  { id: "postgres-constraints", repository: "PostgreSQL Documentation", path: "Constraints", publicUrl: "https://www.postgresql.org/docs/current/ddl-constraints.html", usedFor: ["composite keys", "UNIQUE/FK", "duplicate prevention"], evidence: "join graph cardinality를 schema로 증명하는 공식 기준입니다." },
  { id: "postgres-indexes", repository: "PostgreSQL Documentation", path: "Indexes", publicUrl: "https://www.postgresql.org/docs/current/indexes.html", usedFor: ["edge indexes", "multicolumn access", "write tradeoffs"], evidence: "multi-table access path의 공식 기준입니다." },
  { id: "postgres-explain", repository: "PostgreSQL Documentation", path: "Using EXPLAIN", publicUrl: "https://www.postgresql.org/docs/current/using-explain.html", usedFor: ["intermediate cardinality", "estimated/actual rows", "spills/loops"], evidence: "plan diagnosis의 공식 기준입니다." },
  { id: "postgres-transaction", repository: "PostgreSQL Documentation", path: "Transaction Isolation", publicUrl: "https://www.postgresql.org/docs/current/transaction-iso.html", usedFor: ["MVCC snapshot", "concurrent pages", "consistent report"], evidence: "snapshot operations portability의 공식 기준입니다." },
  { id: "postgres-limit", repository: "PostgreSQL Documentation", path: "LIMIT and OFFSET", publicUrl: "https://www.postgresql.org/docs/current/queries-limit.html", usedFor: ["total order", "parent-first pagination", "OFFSET risk"], evidence: "pagination contract의 공식 기준입니다." },
  { id: "mysql-join", repository: "MySQL 8.4 Reference Manual", path: "JOIN Clause", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/join.html", usedFor: ["multi-table JOIN", "aliases", "ON"], evidence: "MySQL 8.4 multi-table portability의 공식 기준입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["join order", "access methods", "row estimates"], evidence: "MySQL plan 검증의 공식 기준입니다." },
  { id: "oracle-joins", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Joins", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Joins.html", usedFor: ["multiple joins", "equijoin/outer", "Cartesian boundary"], evidence: "Oracle join semantics portability의 공식 기준입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-12-multi-table-join-alias", slug: "sql-12-multi-table-join-alias", courseId: "database", moduleId: "db-joins-subqueries", order: 3,
  title: "여러 테이블 조인과 별칭·중복 행 진단", subtitle: "join graph·aliases·scope·fan-out·pre-aggregation·duplicate lineage·plan·parent-first operation을 연결합니다.", level: "전문가", estimatedMinutes: 980,
  coreQuestion: "세 개 이상 relation을 결합할 때 각 edge와 alias·result grain을 증명하고, 중복·fan-out·cross-scope·pagination 오류를 root cause에서 제거하려면 어떻게 진단할까요?",
  summary: "dbstudy 01_30·02_02·02_03의 INNER/LEFT multi-join progression과 ordering/grouping counts를 read-only provenance로 사용합니다. join graph와 composed grain, qualified aliases, multi-hop composite scope, independent many fan-out, query-block pre-aggregation, ROW_NUMBER duplicate lineage, semi/anti existence branches, edge indexes/EXPLAIN intermediate cardinality, parent-first snapshot pagination과 report reconciliation을 다룹니다. 여섯 exact Python sqlite3 examples는 three-table graph, ambiguous columns, tenant leakage, multiplicative totals, duplicate groups와 parent page/index를 실행합니다.",
  objectives: ["multi-table relations를 join graph와 edge별 cardinality/optionality로 표현한다.", "role-based aliases와 unique output names로 ambiguous/source mapping을 제거한다.", "composite tenant scope를 모든 multi-hop edges에 전파한다.", "independent many joins의 multiplicative fan-out과 measure lineage를 계산한다.", "pre-aggregation query blocks의 population·grain·key uniqueness를 검증한다.", "natural-key/window lineage로 duplicate root cause를 추적하고 constraints로 예방한다.", "existence-only branches를 semi/anti joins로 격리한다.", "edge indexes·EXPLAIN intermediate cardinality·snapshot parent-first pagination을 운영한다."],
  prerequisites: [{ title: "LEFT JOIN과 매칭되지 않은 행 보존", reason: "multi-table graph에서 optional edges와 null provenance를 유지합니다.", sessionSlug: "sql-11-left-outer-join" }, { title: "COUNT·SUM·AVG, GROUP BY와 HAVING", reason: "join fan-out이 independent measures를 어떻게 증식시키는지 검산합니다.", sessionSlug: "sql-08-aggregate-group-having" }],
  keywords: ["multi-table join", "join graph", "alias", "qualified column", "composite scope", "bridge", "multiplicative fan-out", "pre-aggregation", "duplicate lineage", "ROW_NUMBER", "semi join", "EXPLAIN", "parent-first pagination", "reconciliation"], topics,
  lab: {
    title: "tenant account-project-task와 independent facts를 안전한 multi-table report로 구축",
    scenario: "tenant-scoped accounts/projects/tasks에 history·tags·payments 같은 independent many relations가 있고 natural-key duplicates도 존재할 수 있습니다. entity page와 totals가 cross-scope·fan-out·duplicate 없이 같은 snapshot에서 일치해야 합니다.",
    setup: ["세 local SQL files는 read-only provenance로만 사용하고 synthetic ids/amounts만 준비합니다.", "same local ids across tenants, 0/1/many, 2×2 independent facts, duplicate natural keys와 skew fixtures를 만듭니다.", "SQLite exact harness와 MySQL/PostgreSQL/Oracle isolated schemas를 준비합니다.", "join graph, each edge PK/FK/UNIQUE·scope·optionality와 expected grain/cardinality budget을 작성합니다."],
    steps: ["relations/edges를 graph로 그리고 disconnected components와 pair upper bounds를 확인합니다.", "shared columns를 qualify하고 output aliases를 consumer schema로 고정합니다.", "multi-hop edge마다 complete tenant/local key를 negative fixtures로 검증합니다.", "edge별 row/distinct-key counts로 first fan-out explosion을 찾습니다.", "independent many facts를 parent grain CTE로 pre-aggregate하고 source totals와 reconciliation합니다.", "natural-key duplicates를 GROUP/ROW_NUMBER lineage로 표시하고 cleanup 없이 constraints migration을 계획합니다.", "existence-only permission/status branches를 EXISTS/NOT EXISTS로 격리합니다.", "edge indexes와 vendor EXPLAIN actual rows×loops·spills·stats skew를 측정합니다.", "parent keys를 stable keyset/snapshot에서 먼저 page하고 summaries/details를 결합합니다.", "report version·snapshot·base/intermediate/final checksums와 privacy-safe telemetry를 readback합니다."],
    expectedResult: ["모든 graph nodes가 complete scope edges에 연결되고 ambiguous outputs가 없습니다.", "intentional detail grain 외 duplicates와 cross-tenant matches가 없습니다.", "independent measures는 canonical source totals와 일치하고 parent summaries가 unique합니다.", "plans는 intermediate cardinality·spill·latency budgets를 만족합니다.", "entity pages/export는 same snapshot·total order에서 no-overlap/no-gap reconciliation을 통과합니다."],
    cleanup: ["isolated schemas·synthetic duplicates·temporary indexes/CTEs/plans를 제거합니다.", "read snapshots·partial reports와 temp artifacts를 종료/삭제합니다.", "temporary credentials/page tokens를 revoke합니다.", "local source/production data는 변경하지 않고 logs/metrics에 raw keys·PII가 없는지 검사합니다."],
    extensions: ["N:M bridge temporal validity와 slowly changing dimensions를 추가합니다.", "distributed/sharded join의 routing/data movement budgets를 분석합니다.", "extended statistics와 parameter-sensitive plans를 비교합니다.", "materialized graph summaries의 incremental refresh/rebuild를 구현합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 exact examples를 실행하고 graph edge·grain·multiplicity·source lineage를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "three-table graph와 Cartesian upper bound를 설명합니다.", "ambiguous/qualified outputs를 비교합니다.", "last-edge tenant 누락을 재현합니다.", "2×2 fan-out과 pre-aggregated totals를 검산합니다.", "duplicate groups/extra ids를 추적합니다.", "parent-first page/index invariants를 확인합니다."], hints: ["final DISTINCT 전에 first exploding edge를 찾으세요."], expectedOutcome: "multi-table duplicate를 결과가 아니라 graph/root-cause에서 설명합니다.", solutionOutline: ["graph→aliases→scope→stage counts→reduce→plan→page 순서입니다."] },
    { difficulty: "응용", prompt: "세 local SQL source의 join progression을 versioned tenant report로 재구성하세요.", requirements: ["read-only provenance counts를 보존합니다.", "complete graph/aliases/scope를 사용합니다.", "fan-out/pre-aggregation과 duplicate lineage를 포함합니다.", "semi/anti branches를 분리합니다.", "constraints/indexes/vendor plans를 검증합니다.", "snapshot/keyset/reconciliation/privacy metrics를 포함합니다."], hints: ["sample literals나 원문 query를 복사하지 마세요."], expectedOutcome: "정확성·성능·감사 가능성을 갖춘 multi-table report가 완성됩니다.", solutionOutline: ["audit→model→counterexamples→query blocks→plans→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 multi-table SQL review·report governance 표준을 작성하세요.", requirements: ["join graph/edge/grain schema를 정의합니다.", "aliases/qualification/scope rules를 둡니다.", "fan-out/pre-aggregation/duplicate/semi-anti gates를 둡니다.", "constraints/index/stats/EXPLAIN budgets를 포함합니다.", "snapshot/pagination/version/reconciliation을 포함합니다.", "authorization/privacy/rollout/rollback을 포함합니다."], hints: ["query가 실행된다는 사실은 graph가 올바르다는 증거가 아닙니다."], expectedOutcome: "초급 aliases부터 운영 join governance까지 일관된 표준이 완성됩니다.", solutionOutline: ["prove graph→control grain→measure plan→operate/reconcile 순서입니다."] },
  ],
  nextSessions: ["sql-13-subquery-semi-anti"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["01_30.sql은 SELECT34·JOIN22(INNER22)·GROUP BY17, 02_02.sql은 SELECT48·JOIN20(INNER12/LEFT8)·IN subquery6, 02_03.sql은 SELECT35·JOIN4(LEFT3)·ORDER BY4를 read-only로 계수했고 각 max join chain은2였습니다.", "local sample literals·원문 query·식별 가능 values는 복사하지 않고 multi-join/alias/group/order progression만 사용했습니다.", "원본은 complete multi-hop scope, multiplicative fan-out, query-block contracts, duplicate lineage, intermediate plan budgets와 snapshot parent pagination을 충분히 설명하지 않아 primary vendor docs와 synthetic examples로 보강했습니다.", "SQLite exact examples는 MySQL/PostgreSQL/Oracle join reordering·parallel/hash/merge plans·isolation·collation을 대체하지 않습니다."] },
});

export default session;
