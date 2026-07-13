import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory database에 synthetic rows를 넣고 외부 DB·credential·실제 개인정보 없이 SELECT contract를 재현합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "projection, expression, alias, bag duplicate 또는 result metadata를 같은 fixture에서 실행해 input rows와 output heading/cardinality를 비교합니다." },
      { lines: "마지막 5줄", explanation: "column names·ordered tuples·stable booleans만 출력합니다. SQLite syntax visibility를 MySQL 8.4·Oracle 26ai에 그대로 일반화하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "실제 vendor에서는 동일 logical contract를 dialect-specific integration tests로 다시 확인합니다."] },
    experiments: [
      { change: "SELECT list의 column 순서·expression·alias를 하나씩 바꿉니다.", prediction: "row source가 같아도 output heading과 value/type contract가 달라집니다.", result: "projection은 API/view contract라는 점을 확인합니다." },
      { change: "ORDER BY를 제거하고 같은 query를 여러 번 실행합니다.", prediction: "현재 보이는 순서가 반복될 수 있어도 SQL contract상 안정 순서를 주장할 수 없습니다.", result: "row order 요구는 명시적 total ordering으로 별도 설계합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "select-result-relation",
    title: "SELECT를 table 출력 명령이 아니라 새 result heading과 rows를 만드는 query로 읽습니다",
    lead: "FROM의 source columns를 그대로 보는 것이 아니라 SELECT list가 caller에게 제공할 columns·순서·표현식·이름을 새로 정의합니다.",
    explanations: [
      "`SELECT bookname, price FROM book`은 source table의 모든 정보를 반환하지 않고 두 expressions를 지정한 순서로 투영합니다. result는 base table이 아니며 key·constraint·row order가 자동 상속되지 않습니다. cursor/API가 보는 heading과 values가 query contract입니다.",
      "원본 01_28.sql의 SELECT 7, 01_29.sql의 SELECT 39, 01_30.sql의 SELECT 34를 read-only로 계수했습니다. DISTINCT·WHERE·ORDER BY·GROUP BY·JOIN으로 발전하기 전에 SELECT list와 source/row cardinality의 관계를 독립적으로 이해해야 이후 결과를 정확히 진단할 수 있습니다.",
      "SQL은 declarative하므로 문장에 적힌 순서가 physical execution 순서가 아닙니다. optimizer는 같은 semantics를 유지하며 access/join/expression evaluation을 바꿀 수 있습니다. side effect가 있는 function이나 evaluation order에 의존하지 않고 documented deterministic expressions만 result contract에 둡니다.",
      "query 성공은 expected heading, types/nullability conventions, row cardinality와 values를 만족할 때 판정합니다. GUI grid가 보기 좋다는 사실보다 driver metadata와 consumer mapping을 exact tests로 검증합니다.",
    ],
    concepts: [
      c("projection", "input rows에서 선택한 expressions를 output columns로 구성하는 relational query operation입니다.", ["column 순서와 names를 정의합니다.", "row filtering과 다른 차원입니다."]),
      c("result heading", "query result columns의 이름·순서·type/metadata 계약입니다.", ["base table schema와 같지 않을 수 있습니다.", "API/mapper compatibility에 영향을 줍니다."]),
    ],
    codeExamples: [py(
      "sql01-projection-contract",
      "같은 source에서 다른 projection heading 만들기",
      "projection_contract.py",
      "explicit SELECT list가 output columns와 순서를 어떻게 고정하는지 cursor metadata와 rows로 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE book (book_id INTEGER PRIMARY KEY, title TEXT NOT NULL, price INTEGER NOT NULL, internal_note TEXT)")
db.executemany("INSERT INTO book VALUES (?, ?, ?, ?)", [(1, "SQL", 12000, "draft"), (2, "Java", 15000, "review")])

cursor = db.execute("SELECT title AS book_title, price FROM book ORDER BY book_id")
columns = [item[0] for item in cursor.description]
rows = cursor.fetchall()

print("columns=" + ",".join(columns))
print("row-count=" + str(len(rows)))
print("rows=" + ";".join(f"{title}:{price}" for title, price in rows))
print("internal-note-exposed=" + str("internal_note" in columns).lower())
print("column-order=book_title,price")`,
      "columns=book_title,price\nrow-count=2\nrows=SQL:12000;Java:15000\ninternal-note-exposed=false\ncolumn-order=book_title,price",
      ["local-db-0128", "mysql-select", "oracle-select", "sqlite-select", "python-sqlite-cursor"],
    )],
    diagnostics: [
      d("mapper가 title과 price를 반대로 읽는다.", "SELECT list 순서/alias와 positional mapper contract가 drift했습니다.", ["actual result metadata와 mapper fields를 비교합니다.", "최근 query/schema changes를 봅니다.", "name-based/positional access를 확인합니다."], "explicit aliases와 name-based mapping 또는 generated contract를 적용하고 영향 responses를 검증합니다.", "heading/order snapshot과 mapper integration tests를 둡니다."),
      d("조회 응답에 internal_note가 노출된다.", "SELECT * 또는 entity auto-serialization으로 최소 projection을 잃었습니다.", ["actual SQL/result columns를 봅니다.", "DTO/entity mapping을 확인합니다.", "logs/cache/downstream exposure를 추적합니다."], "필요한 columns만 explicit projection하고 response DTO allowlist를 적용합니다.", "sensitive-column deny tests와 query review를 둡니다."),
    ],
    expertNotes: ["result columns도 data classification·authorization 경계이므로 row 접근 허용과 column 노출 허용을 따로 검토합니다.", "view/API query의 heading 변경은 schema가 그대로여도 consumer-breaking change가 될 수 있습니다."],
  },
  {
    id: "avoid-select-star",
    title: "SELECT *를 탐색 편의와 production contract에서 분리합니다",
    lead: "별표는 table이 현재 가진 columns 전체를 declaration order로 확장하므로 미래 schema change와 join 중복 이름을 query contract로 끌어옵니다.",
    explanations: [
      "ad-hoc exploration에서 작은 owned table을 확인할 때 `*`는 편리하지만 application/query view에서는 over-fetch, sensitive exposure, ambiguous duplicate names와 mapper breakage를 만듭니다. 필요한 expressions를 명시하고 aliases를 stable contract로 관리합니다.",
      "schema에 큰 text/blob/json 또는 generated audit field가 추가되면 SELECT *의 network, buffer, serialization과 cache 비용이 갑자기 커집니다. covering index 가능성도 줄고 consumer가 사용하지 않는 values의 권한·retention까지 부담합니다.",
      "JOIN에서 `a.*, b.*`는 같은 `id`, `created_at` names를 반복해 driver/map의 first/last-wins behavior에 의존하게 합니다. entity별 필요한 fields에 `customer_id`, `order_id`처럼 의미 있는 aliases를 둡니다.",
      "existence check에는 `SELECT 1`/EXISTS처럼 intent를 표현하고 count/detail queries를 분리합니다. 단, optimizer folklore를 맹신하지 않고 plan과 API semantics로 선택합니다.",
    ],
    concepts: [
      c("over-fetch", "caller가 사용하지 않는 columns/rows까지 읽고 전송·직렬화하는 낭비와 노출입니다.", ["성능과 최소권한 모두에 영향이 있습니다.", "explicit projection으로 줄입니다."]),
      c("projection drift", "base table columns 변화가 wildcard result heading에 자동 반영되어 consumer contract가 의도 없이 바뀌는 현상입니다.", ["migration과 독립 release를 깨뜨립니다.", "contract tests로 탐지합니다."]),
    ],
    diagnostics: [
      d("column 추가 migration 뒤 old client JSON에 새 field가 나타난다.", "SELECT *와 generic serialization이 base schema를 public response에 자동 반영했습니다.", ["query/result/DTO mapping을 확인합니다.", "cache/schema versions를 봅니다.", "field sensitivity와 clients를 평가합니다."], "versioned explicit projection/DTO로 되돌리고 노출된 field를 incident policy에 따라 처리합니다.", "response allowlist와 contract snapshots를 CI에 둡니다."),
      d("상세 조회가 작은 rows인데도 느리고 network payload가 크다.", "unused blob/json/audit columns까지 wildcard로 가져옵니다.", ["result bytes와 column access telemetry를 봅니다.", "query plan/index coverage를 확인합니다.", "serialization time/memory를 측정합니다."], "list/detail/use-case별 projections로 분리하고 large field를 명시 요청에서만 가져옵니다.", "query budget에 columns/result bytes를 포함합니다."),
    ],
    expertNotes: ["ORM lazy/eager 설정이 explicit SQL projection을 대체하지 않으며 generated SELECT를 trace해 실제 columns를 확인합니다.", "admin export도 권한이 높다는 이유로 모든 secrets를 포함하지 않고 목적·승인·encryption·retention을 따릅니다."],
  },
  {
    id: "expressions-types-null",
    title: "SELECT list의 literal·산술·CASE·함수 expressions와 NULL·type 계약을 추적합니다",
    lead: "result column은 stored column뿐 아니라 계산식이며 DBMS의 type promotion, NULL propagation, division과 overflow semantics가 output을 결정합니다.",
    explanations: [
      "`price * quantity AS amount`, literals, concatenation과 functions는 새 values를 만듭니다. input type, implicit conversion, precision/scale, collation/charset과 NULL을 truth table로 확인합니다. money에는 floating-point shortcut 대신 적절한 decimal domain을 사용합니다.",
      "대부분의 산술/문자 expressions는 NULL input에서 NULL을 만들지만 COALESCE로 0/empty를 임의 대체하면 unknown과 실제 zero/empty를 섞습니다. presentation fallback인지 business calculation default인지 구분하고 API nullability를 명시합니다.",
      "division by zero, integer division, modulo, overflow와 non-finite values의 behavior는 DBMS와 SQL mode에 따라 다를 수 있습니다. risky denominator는 NULLIF/CASE와 domain constraint로 정책을 표현하고 warnings/errors를 integration test합니다.",
      "functions on columns는 projection cost뿐 아니라 WHERE/index use에도 영향을 줄 수 있습니다. expression reuse를 위해 alias에 의존하기 전에 logical phase와 dialect visibility를 확인하고 CTE/subquery/generated column을 비교합니다.",
    ],
    concepts: [
      c("derived column", "stored input columns·literals·functions에서 query 시 계산한 output column입니다.", ["alias로 heading을 정합니다.", "type/nullability와 determinism을 문서화합니다."]),
      c("NULL propagation", "unknown/missing input이 expression 결과를 NULL/UNKNOWN으로 전파하는 규칙입니다.", ["함수별 behavior를 확인합니다.", "COALESCE는 business 의미를 바꿀 수 있습니다."]),
    ],
    codeExamples: [py(
      "sql01-derived-expression",
      "산술 expression과 NULL fallback을 분리해 출력",
      "derived_expression.py",
      "stored price/quantity에서 amount를 계산하고 missing discount를 표시용 fallback과 raw value로 함께 보존합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item (item_id INTEGER PRIMARY KEY, price INTEGER NOT NULL, quantity INTEGER NOT NULL, discount INTEGER)")
db.executemany("INSERT INTO item VALUES (?, ?, ?, ?)", [(1, 1000, 2, 100), (2, 500, 3, None)])

cursor = db.execute("SELECT item_id, price * quantity AS gross_amount, discount AS raw_discount, COALESCE(discount, 0) AS display_discount, price * quantity - COALESCE(discount, 0) AS net_amount FROM item ORDER BY item_id")
rows = cursor.fetchall()
print("columns=" + ",".join(item[0] for item in cursor.description))
print("row1=" + "|".join(map(str, rows[0])))
print("row2=" + "|".join("NULL" if value is None else str(value) for value in rows[1]))
print("raw-null-preserved=" + str(rows[1][2] is None).lower())
print("net-total=" + str(sum(row[4] for row in rows)))`,
      "columns=item_id,gross_amount,raw_discount,display_discount,net_amount\nrow1=1|2000|100|100|1900\nrow2=2|1500|NULL|0|1500\nraw-null-preserved=true\nnet-total=3400",
      ["mysql-select-list", "mysql-type-conversion", "oracle-select", "sqlite-expression"],
    )],
    diagnostics: [
      d("평균/총액이 NULL 또는 예상과 다른 정밀도로 나온다.", "NULL propagation과 implicit numeric conversion/scale를 정의하지 않았습니다.", ["input types/null distribution을 봅니다.", "expression/result metadata를 확인합니다.", "vendor mode/version과 boundary fixtures를 실행합니다."], "명시 CAST/decimal domain과 NULL business policy를 적용하고 stored/report totals를 reconciliation합니다.", "type/null/overflow boundary golden tests를 둡니다."),
      d("COALESCE로 결측을 0 처리한 뒤 데이터 품질 문제가 사라져 보인다.", "presentation fallback을 canonical business value로 사용했습니다.", ["raw nullable field와 fallback 소비처를 추적합니다.", "missing reason/source를 확인합니다.", "aggregate/report semantics를 봅니다."], "raw unknown을 보존하고 표시/계산 정책을 별도 derived field와 quality metric으로 분리합니다.", "fallback 사용에는 의미·owner·raw exposure policy를 요구합니다."),
    ],
    expertNotes: ["deterministic expression도 collation/timezone/session settings에 의존할 수 있어 query contract의 session environment를 고정합니다.", "derived values를 API에서 number/string 중 무엇으로 직렬화할지 precision 손실과 client language 범위를 포함해 정의합니다."],
  },
  {
    id: "alias-heading-scope",
    title: "alias를 표시용 별명보다 stable heading으로 설계하고 clause별 scope를 확인합니다",
    lead: "alias는 result name을 정하지만 WHERE·GROUP BY·HAVING·ORDER BY에서 보이는 범위와 quoted identifier 규칙은 DBMS마다 차이가 있습니다.",
    explanations: [
      "`expression AS alias`로 계산 column과 중복 column names에 의미를 부여합니다. AS 생략은 가능해도 source 표현식과 alias 경계가 모호해지지 않도록 style을 통일합니다. API/mapper가 사용하는 alias는 rename 시 breaking change입니다.",
      "SELECT alias는 logical processing상 WHERE보다 뒤에 만들어지므로 WHERE에서 재사용할 수 없다고 가르치는 것이 portable한 출발점입니다. ORDER BY·GROUP BY·HAVING alias visibility와 ambiguities는 MySQL/Oracle exact 문서를 확인하고 cross-vendor code는 CTE/subquery로 명시합니다.",
      "quoted identifier의 case sensitivity, spaces, reserved words와 quote characters가 vendor/session settings에 따라 달라집니다. machine contract에는 portable snake_case aliases를 쓰고 localized column labels는 presentation layer에서 만듭니다.",
      "같은 alias가 input column name과 충돌하면 clause가 어느 value를 참조하는지 모호할 수 있습니다. source-qualified names와 unique result aliases를 쓰고 negative fixtures로 확인합니다.",
    ],
    concepts: [
      c("column alias", "SELECT expression의 output heading을 지정하는 query-local identifier입니다.", ["consumer mapping contract가 될 수 있습니다.", "clause visibility는 dialect별로 확인합니다."]),
      c("identifier quoting", "reserved word·case·special characters를 identifier로 표현하기 위한 DBMS 문법입니다.", ["string literal quoting과 다릅니다.", "portable aliases는 단순하게 유지합니다."]),
    ],
    codeExamples: [py(
      "sql01-alias-metadata",
      "computed alias와 duplicate source names를 stable heading으로 바꾸기",
      "alias_metadata.py",
      "join 없이도 두 raw names에 의미 있는 aliases를 주고 name-based row mapping을 검증합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
db.execute("CREATE TABLE sale (sale_id INTEGER PRIMARY KEY, amount INTEGER NOT NULL, tax INTEGER NOT NULL)")
db.execute("INSERT INTO sale VALUES (1, 10000, 1000)")

row = db.execute("SELECT sale_id AS order_id, amount AS net_amount, tax AS tax_amount, amount + tax AS gross_amount FROM sale").fetchone()
columns = list(row.keys())
print("columns=" + ",".join(columns))
print("order-id=" + str(row["order_id"]))
print("net-amount=" + str(row["net_amount"]))
print("tax-amount=" + str(row["tax_amount"]))
print("gross-amount=" + str(row["gross_amount"]))`,
      "columns=order_id,net_amount,tax_amount,gross_amount\norder-id=1\nnet-amount=10000\ntax-amount=1000\ngross-amount=11000",
      ["local-db-0128", "mysql-select", "mysql-alias", "oracle-select", "sqlite-select"],
    )],
    diagnostics: [
      d("WHERE total > 1000에서 unknown column 오류가 난다.", "같은 SELECT list에서 정의한 alias를 logical earlier WHERE가 볼 수 있다고 가정했습니다.", ["alias 정의와 clause를 확인합니다.", "dialect alias rules를 봅니다.", "expression duplication/CTE option을 검토합니다."], "portable하게 expression을 WHERE에 명시하거나 subquery/CTE boundary에서 alias를 materialize합니다.", "clause별 alias visibility test와 SQL style guide를 둡니다."),
      d("driver upgrade 뒤 quoted alias case가 달라 mapper가 실패한다.", "quoted/mixed-case alias와 driver normalization behavior에 의존했습니다.", ["result metadata exact names를 old/new driver에서 비교합니다.", "database identifier settings를 봅니다.", "mapper case strategy를 확인합니다."], "portable unquoted stable aliases와 explicit mapping으로 전환하고 compatibility response를 유지합니다.", "DB/driver version matrix에서 heading snapshot을 검증합니다."),
    ],
    expertNotes: ["human-readable Korean/spaced heading은 report export layer에서 만들고 reusable SQL/API contract에는 stable machine names를 둡니다.", "alias가 data classification을 숨기지 않으므로 원본 lineage를 catalog/query metadata에서 추적합니다."],
  },
  {
    id: "logical-query-processing",
    title: "FROM→WHERE→GROUP→HAVING→SELECT→DISTINCT→ORDER/LIMIT 논리 순서로 오류를 진단합니다",
    lead: "SQL 작성 순서 SELECT→FROM과 논리적으로 rows가 만들어지는 순서를 구분하면 alias scope·aggregate·outer join filter 문제를 체계적으로 설명할 수 있습니다.",
    explanations: [
      "교육용 logical processing model은 FROM/JOIN에서 row source, WHERE에서 pre-group filter, GROUP BY/aggregate, HAVING group filter, SELECT projection, DISTINCT, ORDER BY와 pagination 순서로 reasoning합니다. exact standard/dialect details와 optimizer physical plan은 별개입니다.",
      "이 model은 SELECT alias가 WHERE에서 보이지 않는 이유, aggregate를 WHERE에 직접 쓰지 않는 이유, LEFT JOIN right filter를 WHERE에 두면 unmatched rows가 사라지는 이유를 설명합니다. 이후 join/group sessions에서 같은 사고 순서를 재사용합니다.",
      "optimizer는 predicate pushdown, join reorder, expression simplification을 수행할 수 있지만 observable semantics를 지켜야 합니다. volatile/user functions, error timing과 floating expression은 rewrite에서 차이가 보일 수 있어 side-effect-free SQL을 우선합니다.",
      "EXPLAIN의 physical nodes를 logical clause와 일대일 대응시키지 않습니다. query block, access paths, join order와 estimates/actuals를 읽되 result contract부터 별도 fixtures로 검증합니다.",
    ],
    concepts: [
      c("logical query processing", "SQL result를 이해하기 위한 clause별 conceptual row transformation 순서입니다.", ["작성/physical execution 순서와 다릅니다.", "alias·filter·aggregate scope를 설명합니다."]),
      c("query block", "하나의 SELECT-FROM-WHERE-GROUP 단위로 scope와 optimization을 형성하는 query 영역입니다.", ["subquery/CTE는 별도 blocks를 만들 수 있습니다.", "alias가 block boundary에서 column이 됩니다."]),
    ],
    diagnostics: [
      d("HAVING과 WHERE를 바꿨더니 결과/성능이 달라졌다.", "row-level pre-group filter와 group-level post-aggregate filter의 의미를 구분하지 않았습니다.", ["predicate가 individual row인지 aggregate group인지 분류합니다.", "intermediate cardinalities를 측정합니다.", "EXPLAIN estimates/actuals를 봅니다."], "row predicate는 WHERE, aggregate predicate는 HAVING에 두고 expected groups를 fixture로 검증합니다.", "query review에 logical intermediate row counts를 기록합니다."),
      d("optimizer plan 순서를 SQL 의미 순서로 설명해 잘못된 결론을 낸다.", "logical semantics와 physical execution strategy를 동일시했습니다.", ["expected result contract를 먼저 확인합니다.", "query blocks/plan nodes를 분리해 봅니다.", "statistics/version/settings를 기록합니다."], "논리 row transformations와 physical access/join operations를 두 diagram으로 설명합니다.", "튜닝 문서에 semantics test와 plan evidence를 별도 항목으로 둡니다."),
    ],
    expertNotes: ["logical order는 강력한 교육 model이지만 dialect의 QUALIFY/window/recursive clauses는 해당 공식 문서로 확장합니다.", "optimizer hint로 physical order를 강제하기 전에 statistics/schema/query 문제와 upgrade cost를 측정합니다."],
  },
  {
    id: "bag-duplicates-cardinality",
    title: "SQL의 bag 결과와 projection-induced duplicate를 row cardinality로 추적합니다",
    lead: "관계 이론의 set 이미지와 달리 SQL SELECT는 기본적으로 duplicate rows를 보존하므로 column을 줄이면 서로 다른 source rows가 같은 output tuple이 될 수 있습니다.",
    explanations: [
      "두 books가 같은 publisher를 가지면 `SELECT publisher`는 같은 값 두 rows를 반환합니다. DISTINCT는 output 전체 tuple의 duplicates를 제거하며 특정 column만 임의로 대표 row를 선택하는 기능이 아닙니다.",
      "duplicate가 보이면 무조건 DISTINCT를 붙이기 전에 source candidate key, projection에서 key를 뺐는지, join cardinality가 1:N/N:M인지, data integrity duplicate인지 분류합니다. DISTINCT는 symptom을 숨기고 sort/hash 비용과 nondeterministic representative 문제를 만들 수 있습니다.",
      "row count는 FROM/JOIN, WHERE, GROUP/DISTINCT와 pagination 단계마다 측정합니다. query가 entity one-row-per-order를 약속한다면 order key uniqueness assertion을 integration test로 두고 child join은 aggregate/EXISTS/separate query로 intent를 표현합니다.",
      "COUNT(*), COUNT(column), COUNT(DISTINCT ...)는 NULL과 duplicate 처리 의미가 다릅니다. 이후 aggregate session에서 더 깊게 다루며 여기서는 projection cardinality를 output contract 일부로 기록합니다.",
    ],
    concepts: [
      c("bag semantics", "동일한 tuple이 여러 번 나타날 수 있는 SQL query result 기본 의미입니다.", ["SELECT는 자동 dedup하지 않습니다.", "multiplicity가 joins/aggregates에 전달됩니다."]),
      c("projection-induced duplicate", "서로 다른 input rows가 구분하던 columns를 projection에서 제거해 같은 output tuple로 보이는 현상입니다.", ["integrity duplicate와 다릅니다.", "DISTINCT 목적을 설명합니다."]),
    ],
    codeExamples: [py(
      "sql01-bag-projection",
      "projection duplicate와 DISTINCT를 cardinality로 비교",
      "bag_projection.py",
      "source keys가 다른 rows가 publisher projection에서 같은 tuple이 되고 DISTINCT가 output tuple만 줄임을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE book (book_id INTEGER PRIMARY KEY, title TEXT NOT NULL, publisher TEXT NOT NULL)")
db.executemany("INSERT INTO book VALUES (?, ?, ?)", [(1, "SQL", "A출판"), (2, "DB", "A출판"), (3, "Java", "B출판")])

bag = [row[0] for row in db.execute("SELECT publisher FROM book ORDER BY book_id")]
distinct = [row[0] for row in db.execute("SELECT DISTINCT publisher FROM book ORDER BY publisher")]
print("source-rows=3")
print("bag=" + ",".join(bag))
print("bag-count=" + str(len(bag)))
print("distinct=" + ",".join(distinct))
print("distinct-count=" + str(len(distinct)))`,
      "source-rows=3\nbag=A출판,A출판,B출판\nbag-count=3\ndistinct=A출판,B출판\ndistinct-count=2",
      ["local-db-0128", "local-db-0129", "mysql-select", "oracle-select", "sqlite-select"],
    )],
    diagnostics: [
      d("join query에 DISTINCT를 붙이니 중복은 없어졌지만 느리다.", "1:N join으로 entity rows가 늘어난 원인을 해결하지 않고 global dedup을 추가했습니다.", ["join keys/cardinality와 projected key를 봅니다.", "DISTINCT sort/hash plan과 row counts를 측정합니다.", "필요한 child data shape를 확인합니다."], "EXISTS/aggregate/separate child query 또는 correct join constraint로 one-row contract를 표현합니다.", "DISTINCT 사용에 duplicate provenance와 plan evidence를 요구합니다."),
      d("같은 이름 rows를 data corruption으로 삭제했다.", "projection이 key를 숨겨 같아 보이는 정상 entities를 실제 duplicate로 오인했습니다.", ["primary/business keys와 full rows를 안전하게 확인합니다.", "domain uniqueness scope를 봅니다.", "delete audit/backup을 확인합니다."], "삭제를 중단·복구하고 key 포함 diagnostic query로 integrity duplicate와 presentation duplicate를 구분합니다.", "data repair 전 candidate-key evidence와 dry-run approval를 요구합니다."),
    ],
    expertNotes: ["DISTINCT ON 같은 vendor extension은 representative row ordering을 명시해야 하며 portable DISTINCT와 구분합니다.", "API pagination 전에 duplicate multiplicity가 변하면 page size/total count가 달라져 count/data queries가 같은 entity contract를 써야 합니다."],
  },
  {
    id: "determinism-order-separation",
    title: "projection과 row ordering을 분리하고 ORDER BY 없는 결과 순서를 약속하지 않습니다",
    lead: "primary key나 insertion order처럼 보이는 출력은 optimizer·index·parallelism·upgrade에 따라 바뀔 수 있으며 SELECT list 순서와 row 순서는 전혀 다른 축입니다.",
    explanations: [
      "SELECT list는 columns의 left-to-right heading을 정하지만 rows의 순서는 ORDER BY만 보장합니다. GUI에서 같은 순서가 반복돼도 heap/index scan 선택, statistics와 concurrent changes가 바뀌면 달라질 수 있습니다.",
      "stable pagination/export에는 business sort와 unique tie-breaker를 결합해 total order를 만듭니다. `ORDER BY created_at, id`처럼 동률을 해소하고 NULL placement/collation/timezone을 target DB에서 명시합니다.",
      "ORDER BY ordinal(1,2)은 projection reorder 시 의미가 바뀌므로 reusable queries에서는 aliases/qualified expressions를 선호합니다. alias ambiguity와 dialect NULLS FIRST/LAST 지원을 portability matrix로 둡니다.",
      "random/current time/session-dependent function을 projection에 쓰면 cache/test/replay가 달라집니다. 기준 시각·seed·timezone을 parameter로 주거나 nondeterminism을 response contract에 명시합니다.",
    ],
    concepts: [
      c("total order", "모든 result rows의 순서를 동률 없이 결정하는 sort key 계약입니다.", ["unique tie-breaker를 포함합니다.", "pagination 안정성에 필요합니다."]),
      c("nondeterministic expression", "같은 logical row/input에서도 시간·random·session/environment에 따라 값이 달라질 수 있는 expression입니다.", ["cache/replay/test에 영향을 줍니다.", "기준 context를 명시합니다."]),
    ],
    diagnostics: [
      d("같은 query의 rows가 배포 후 다른 순서로 나온다.", "ORDER BY 없이 관찰된 access order를 API contract로 사용했습니다.", ["actual SQL과 order clause를 확인합니다.", "plan/index/statistics change를 봅니다.", "consumer가 요구하는 business order를 정의합니다."], "business sort+unique tie-breaker를 명시하고 count/pagination queries에 같은 contract를 적용합니다.", "unordered fixture를 shuffle해도 tests가 order assumption을 드러내게 합니다."),
      d("ORDER BY created_at만 쓴 pagination에서 rows가 중복/누락된다.", "동일 timestamp rows에 total order가 없고 offset 사이 concurrent writes도 발생했습니다.", ["timestamp duplicates와 precision을 봅니다.", "unique tie-breaker와 isolation/cursor를 확인합니다.", "page requests 사이 writes를 재현합니다."], "created_at+id keyset cursor와 snapshot/freshness policy를 설계합니다.", "duplicate sort-key/concurrent insert pagination tests를 둡니다."),
    ],
    expertNotes: ["collation/version 변경은 text ordering을 바꿀 수 있어 cursor tokens와 index rebuild compatibility를 검토합니다.", "ORDER BY가 subquery 내부에 있어도 outer query order를 자동 보장하지 않으므로 최종 consumer boundary에서 명시합니다."],
  },
  {
    id: "result-metadata-mapping",
    title: "driver result metadata와 DTO mapping을 name·type·nullability contract로 검증합니다",
    lead: "SQL grid에서 값이 맞아도 driver가 반환한 label/type precision과 application converter가 어긋나면 overflow·truncation·null crash가 발생합니다.",
    explanations: [
      "JDBC ResultSetMetaData/Python cursor description 같은 API에서 column count, label/name, type/precision/scale와 nullable metadata를 읽습니다. driver가 expression type을 추론하는 방식과 application language type range를 target connector에서 확인합니다.",
      "name-based mapping은 column reorder에 강하지만 duplicate aliases/case normalization에서 위험하고 positional mapping은 빠르고 명확할 수 있어도 order change에 취약합니다. generated mapper/row schema와 compile/integration tests로 선택을 고정합니다.",
      "DB BIGINT/DECIMAL/DATE/TIMESTAMP/JSON을 JavaScript number/string, Java long/BigDecimal/Instant 등으로 옮길 때 precision/timezone/null contract를 명시합니다. display formatting된 문자열을 canonical numeric/date field로 재사용하지 않습니다.",
      "query contract versioning은 SQL file/hash, result schema와 consumers를 연결합니다. view change·alias rename·type widening도 API compatibility review와 rollout window를 거칩니다.",
    ],
    concepts: [
      c("column label", "driver가 SELECT item의 alias 또는 derived name으로 consumer에 제공하는 result identifier입니다.", ["base column name과 다를 수 있습니다.", "mapper contract에 사용됩니다."]),
      c("row mapper", "result metadata/values를 typed application DTO/domain object로 변환하는 boundary입니다.", ["name/type/null handling을 검증합니다.", "entity auto-mapping과 query contract를 구분합니다."]),
    ],
    codeExamples: [py(
      "sql01-result-metadata",
      "result heading과 row dictionary mapping 검증",
      "result_metadata.py",
      "cursor.description에서 aliases를 읽고 expected schema와 정확히 비교한 뒤 rows를 named mappings로 변환합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson (lesson_id INTEGER PRIMARY KEY, title TEXT NOT NULL, minutes INTEGER NOT NULL)")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?)", [(1, "SQL", 45), (2, "Java", 60)])

cursor = db.execute("SELECT lesson_id AS id, title AS name, minutes AS duration_minutes FROM lesson ORDER BY lesson_id")
labels = [column[0] for column in cursor.description]
rows = [dict(zip(labels, row, strict=True)) for row in cursor.fetchall()]
expected = ["id", "name", "duration_minutes"]
print("labels=" + ",".join(labels))
print("schema-match=" + str(labels == expected).lower())
print("first=" + f'{rows[0]["id"]}:{rows[0]["name"]}:{rows[0]["duration_minutes"]}')
print("row-count=" + str(len(rows)))
print("null-values=" + str(sum(value is None for row in rows for value in row.values())))`,
      "labels=id,name,duration_minutes\nschema-match=true\nfirst=1:SQL:45\nrow-count=2\nnull-values=0",
      ["python-sqlite-cursor", "jdbc-result-metadata", "mysql-select", "oracle-select"],
    )],
    diagnostics: [
      d("DECIMAL 합계가 application에서 반올림된다.", "driver value를 binary floating/JavaScript number로 변환해 precision contract를 잃었습니다.", ["database result type/precision/scale metadata를 봅니다.", "driver/application conversion을 추적합니다.", "boundary/max fractional fixtures를 실행합니다."], "BigDecimal 또는 canonical decimal string/minor-unit contract로 변환하고 영향 totals를 reconciliation합니다.", "DB→language type mapping matrix와 precision golden tests를 둡니다."),
      d("alias 하나 변경했더니 runtime mapper만 실패한다.", "result schema가 compile/versioned contract가 아니라 ad-hoc 문자열 mapping입니다.", ["SQL hash/metadata와 mapper expected labels를 비교합니다.", "consumers와 deployment order를 봅니다.", "old alias compatibility를 확인합니다."], "compatible dual alias/view/API version 또는 mapper update를 단계 배포하고 contract test를 추가합니다.", "query result schema를 generated/typesafe artifact로 관리합니다."),
    ],
    expertNotes: ["metadata nullability는 outer join/expression 때문에 base schema와 달라질 수 있어 actual query fixtures로 검증합니다.", "driver upgrades는 labels/types/timezone mappings을 바꿀 수 있어 connector version matrix를 release gate에 둡니다."],
  },
  {
    id: "query-security-least-data",
    title: "projection을 column-level authorization·masking·least-data 경계로 사용합니다",
    lead: "row를 볼 수 있다는 사실이 email·phone·secret hash·internal status까지 모두 볼 권한을 뜻하지 않습니다.",
    explanations: [
      "use case마다 필요한 columns와 purpose를 정의하고 public/profile/admin/export projections을 분리합니다. application DTO allowlist, views/column privileges와 database roles를 defense in depth로 사용하되 masking이 authorization을 대체하지 않습니다.",
      "password hashes, reset tokens, API secrets와 encryption material은 일반 SELECT projections에서 제외하고 전용 verification/service boundary에서도 raw values를 반환·로그하지 않습니다. `SELECT *` 금지는 성능보다 secret minimization에서 더 중요할 수 있습니다.",
      "masked email/phone도 작은 population과 다른 attributes를 결합하면 재식별될 수 있습니다. data minimization, purpose limitation, aggregation thresholds와 audit/retention을 privacy owner와 결정합니다.",
      "dynamic column selection을 client strings로 SQL에 연결하지 않습니다. server allowlist가 known projections/statements를 선택하고 values는 parameter binding합니다. GraphQL/field selection도 backend authorization과 query cost limits를 거칩니다.",
    ],
    concepts: [
      c("column-level authorization", "같은 rows 안에서도 actor/use case별로 읽을 수 있는 attributes를 제한하는 통제입니다.", ["DTO/view/privilege로 구현할 수 있습니다.", "row authorization과 함께 적용합니다."]),
      c("data minimization", "명시 목적에 필요한 최소 data만 조회·처리·보존하는 원칙입니다.", ["projection과 retention에 적용합니다.", "민감 파생값도 평가합니다."]),
    ],
    diagnostics: [
      d("profile API가 password_hash column도 DB에서 읽는다.", "entity-wide SELECT/mapper를 재사용해 response에서만 field를 지웠습니다.", ["actual SQL/result columns와 logs/APM을 확인합니다.", "hash가 cache/heap/serialization에 남는지 봅니다.", "DB privileges를 검토합니다."], "query 단계에서 secret column을 제외하고 verification repository/role를 분리하며 노출 흔적을 제한합니다.", "least-column integration tests와 sensitive-column query audit를 둡니다."),
      d("client columns 파라미터로 SQL injection이 가능하다.", "column identifiers를 raw request에서 SELECT list에 연결했습니다.", ["dynamic SQL builder를 확인합니다.", "allowed fields와 authorization mapping을 봅니다.", "logs에서 exploit/impact를 조사합니다."], "client field를 server enum/known query projection에 매핑하고 raw identifier concatenation을 제거합니다.", "unknown/unauthorized field negative tests와 query complexity limits를 둡니다."),
    ],
    expertNotes: ["database column privilege만으로 application object-level authorization을 완성할 수 없지만 compromised service account blast radius를 줄일 수 있습니다.", "analytics exports는 목적별 de-identification과 minimum cohort를 검토하고 ad-hoc SELECT 권한을 broad production role에 주지 않습니다."],
  },
  {
    id: "explain-tests-observability",
    title: "EXPLAIN·result contract tests·query telemetry로 projection 운영을 닫습니다",
    lead: "projection은 단순해 보여도 table scan, expression cost, bytes, mapper errors와 contract drift를 지속적으로 관측해야 합니다.",
    explanations: [
      "EXPLAIN으로 access path, estimated rows, covering index 가능성과 expression materialization을 봅니다. `SELECT fewer columns`가 항상 빠르다고 과장하지 않지만 large fields/network/covering potential을 representative data에서 측정합니다.",
      "contract test는 expected labels/order/types/nulls/cardinality와 boundary values를 실제 driver로 검증합니다. 결과 rows 전체 golden은 data 변화에 취약하므로 minimal owned fixtures와 invariant assertions를 사용합니다.",
      "telemetry에는 normalized query id/hash, operation, release, rows/bytes, latency, timeout/error category를 남기고 SQL literals/PII는 캡처하지 않습니다. high-cardinality aliases/values를 metric labels로 넣지 않습니다.",
      "schema/query release 후 plan regression, result bytes, mapper failures와 unauthorized columns를 canary/shadow에서 확인합니다. rollback도 old query가 new schema에서 호환되는지 expand-contract matrix로 검증합니다.",
    ],
    concepts: [
      c("query contract test", "owned fixture에서 result heading·types·values/cardinality와 error policy를 driver boundary까지 검증하는 test입니다.", ["schema/API drift를 탐지합니다.", "DB vendor/version matrix를 포함합니다."]),
      c("normalized query identity", "literal values를 제거/parameterized한 query shape를 telemetry에서 안정적으로 식별하는 값입니다.", ["PII cardinality를 줄입니다.", "release/plan regression을 연결합니다."]),
    ],
    diagnostics: [
      d("projection 변경 뒤 DB latency는 같지만 API memory가 급증한다.", "row count/DB time만 보고 result bytes와 serialization/mapper allocation을 관측하지 않았습니다.", ["columns/result bytes/large values를 측정합니다.", "application heap/serialization trace를 봅니다.", "cache/network payload를 확인합니다."], "필요 projection으로 줄이고 streaming/pagination을 설계하며 end-to-end budgets를 재검증합니다.", "query telemetry에 rows+bytes와 application latency/memory를 연결합니다."),
      d("query logs에 이메일과 검색어가 그대로 저장된다.", "debug SQL/bind logging을 production telemetry로 사용했습니다.", ["DB slow/general logs, APM와 app logs를 확인합니다.", "retention/access/downstream copies를 추적합니다.", "incident/privacy owner에게 보고합니다."], "literal/bind capture를 끄고 normalized query id와 safe metadata만 남기며 노출 data를 승인 절차로 제한합니다.", "logging configuration privacy tests와 deployment guard를 둡니다."),
    ],
    expertNotes: ["EXPLAIN ANALYZE류는 query를 실제 실행할 수 있으므로 destructive/expensive statements와 production 사용 권한·budget을 확인합니다.", "plan stability보다 result correctness가 우선이며 hint/index change 후 동일 contract/edge cases를 먼저 검증합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0128", repository: "local dbstudy snapshot", path: "dbstudy/01_28.sql", usedFor: ["intro SELECT·DISTINCT projection progression"], evidence: "SELECT7·DISTINCT4 active occurrences를 read-only로 계수했습니다." },
  { id: "local-db-0129", repository: "local dbstudy snapshot", path: "dbstudy/01_29.sql", usedFor: ["projection with filters/order/group progression"], evidence: "SELECT39·WHERE27·ORDER BY5·GROUP BY4 active occurrences를 read-only로 계수했습니다." },
  { id: "local-db-0130", repository: "local dbstudy snapshot", path: "dbstudy/01_30.sql", usedFor: ["projection over grouping/join progression"], evidence: "SELECT34·GROUP BY17·JOIN22 active occurrences를 read-only로 계수했습니다." },
  { id: "mysql-select", repository: "MySQL 8.4 Reference Manual", path: "SELECT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["SELECT list·aliases·DISTINCT·ORDER syntax"], evidence: "MySQL SELECT 공식 문서입니다." },
  { id: "mysql-select-list", repository: "MySQL 8.4 Reference Manual", path: "Problems with Column Aliases", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/problems-with-alias.html", usedFor: ["alias clause visibility/quoting"], evidence: "MySQL alias 공식 문서입니다." },
  { id: "mysql-alias", repository: "MySQL 8.4 Reference Manual", path: "Schema Object Names", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/identifiers.html", usedFor: ["identifier/alias portability"], evidence: "MySQL identifier 공식 문서입니다." },
  { id: "mysql-type-conversion", repository: "MySQL 8.4 Reference Manual", path: "Type Conversion in Expression Evaluation", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/type-conversion.html", usedFor: ["expression result types·implicit conversion"], evidence: "MySQL conversion 공식 문서입니다." },
  { id: "oracle-select", repository: "Oracle AI Database 26ai SQL Language Reference", path: "SELECT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["Oracle projection·alias·ordering portability"], evidence: "Oracle SELECT 공식 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["exact projection/bag/alias examples"], evidence: "SQLite SELECT 공식 문서입니다." },
  { id: "sqlite-expression", repository: "SQLite Documentation", path: "SQL Language Expressions", publicUrl: "https://www.sqlite.org/lang_expr.html", usedFor: ["exact expressions·NULL"], evidence: "SQLite expression 공식 문서입니다." },
  { id: "python-sqlite-cursor", repository: "Python 3 Documentation", path: "sqlite3 Cursor objects", publicUrl: "https://docs.python.org/3/library/sqlite3.html#cursor-objects", usedFor: ["cursor description·exact row execution"], evidence: "Python sqlite3 공식 문서입니다." },
  { id: "jdbc-result-metadata", repository: "Java SE 21 API", path: "java.sql.ResultSetMetaData", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSetMetaData.html", usedFor: ["driver result heading/type mapping"], evidence: "JDBC result metadata 공식 API입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-01-select-projection-alias",
  slug: "sql-01-select-projection-alias",
  courseId: "database",
  moduleId: "db-query-foundations",
  order: 1,
  title: "SELECT 투영, 별칭과 논리적 실행 순서",
  subtitle: "SELECT list를 columns·expressions·aliases·cardinality·driver metadata·least-data가 결합된 result contract로 이해합니다.",
  level: "입문",
  estimatedMinutes: 780,
  coreQuestion: "source table에서 어떤 columns와 계산값을 어떤 이름·type·순서로 제공하며, caller가 그 결과를 안정적이고 안전한 계약으로 사용할 수 있게 어떻게 검증할까요?",
  summary: "dbstudy 01_28·01_29·01_30의 SELECT 7·39·34 progression을 read-only로 감사합니다. projection/result heading, SELECT * drift·over-fetch, derived expression type/NULL, aliases와 clause scope, logical query processing, SQL bag semantics와 projection duplicates, row ordering/determinism, driver metadata/DTO mapping, column authorization/data minimization, EXPLAIN·contract tests·privacy-safe query telemetry를 연결합니다. 다섯 exact Python sqlite3 examples는 explicit projection, NULL-aware arithmetic, alias metadata, bag/DISTINCT cardinality와 typed named mapping을 실행합니다.",
  objectives: [
    "SELECT list를 output heading·expression·row contract를 만드는 projection으로 설명한다.",
    "SELECT *의 schema drift·over-fetch·sensitive exposure·duplicate label 위험을 제거한다.",
    "derived expression의 type·precision·NULL propagation과 fallback 의미를 검증한다.",
    "stable aliases와 clause별 visibility·identifier portability를 설계한다.",
    "logical query processing과 optimizer physical plan을 구분한다.",
    "bag semantics·projection-induced duplicates와 DISTINCT의 정확한 범위를 판정한다.",
    "ORDER BY 없는 순서를 약속하지 않고 total ordering을 별도 설계한다.",
    "driver metadata·DTO mapping·column authorization·query telemetry를 운영한다.",
  ],
  prerequisites: [{ title: "정규화와 Workbench ER 모델", reason: "source relations·keys·columns가 어떤 사실을 표현하는지 알아야 projection contract를 판단할 수 있습니다.", sessionSlug: "db-08-normalization-workbench" }],
  keywords: ["SELECT", "projection", "SELECT list", "alias", "derived column", "logical query processing", "bag semantics", "DISTINCT", "result metadata", "SELECT star", "data minimization", "EXPLAIN"],
  topics,
  lab: {
    title: "학습 도서 조회를 최소·typed·versioned result contract로 만들기",
    scenario: "book table에는 public fields, large description, internal moderation note와 price data가 있습니다. list/detail/admin API가 서로 필요한 columns만 가져오고 old/new mapper가 schema 변경 중에도 안전해야 합니다.",
    setup: ["synthetic book/author rows와 boundary NULL/decimal/text fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai·exact JDBC drivers의 isolated schemas를 준비합니다.", "public/detail/admin field allowlists와 expected result schema를 작성합니다.", "query normalized id, rows/bytes/latency budget과 privacy-safe logs를 설정합니다."],
    steps: ["SELECT *를 use-case별 explicit projection으로 바꿉니다.", "각 expression의 type/null/precision과 stable machine alias를 정의합니다.", "driver metadata labels/order/types를 DTO mapping과 contract test합니다.", "projection에서 key 제거로 생기는 duplicate를 bag semantics로 재현합니다.", "WHERE/GROUP/HAVING/SELECT alias scope를 logical order로 설명합니다.", "row ordering이 필요하면 business sort+unique tie-breaker를 별도 추가합니다.", "public projection에서 internal/secret/large fields가 조회되지 않음을 trace로 확인합니다.", "schema column 추가·rename/type widening에서 old/new queries compatibility를 시험합니다.", "EXPLAIN과 result rows/bytes/application memory를 representative data에서 측정합니다.", "canary 배포 뒤 mapper errors·contract drift·unauthorized column·query logs privacy를 readback합니다."],
    expectedResult: ["각 API의 labels/order/types/nullability와 row cardinality가 versioned schema와 일치합니다.", "base column 추가가 public response나 mapper를 자동 변경하지 않습니다.", "internal/secret/unused large fields가 query result·logs·cache에 나타나지 않습니다.", "duplicate와 order는 명시 semantics로 처리되고 DISTINCT/observed order에 기대지 않습니다.", "MySQL·Oracle drivers에서 같은 domain result contract와 safe error/metrics를 유지합니다."],
    cleanup: ["isolated schemas·synthetic rows와 test query telemetry만 run id로 제거합니다.", "temporary credentials/grants를 revoke합니다.", "logs/APM에 literals·PII·internal notes가 없는지 검사합니다.", "production source files/DB는 변경하지 않습니다."],
    extensions: ["GraphQL field selection을 authorized prepared projections로 compile합니다.", "column-level database privileges/views와 application object authorization을 결합합니다.", "large result streaming/backpressure와 CSV export injection 방어를 추가합니다.", "query result schema를 codegen해 Java/TypeScript compile-time mapping을 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 source schema와 result heading/cardinality 차이를 표로 쓰세요.", requirements: ["stdout 완전 일치를 확인합니다.", "internal column 미노출을 확인합니다.", "raw NULL과 display fallback을 분리합니다.", "alias labels/order를 검증합니다.", "bag와 DISTINCT counts를 비교합니다.", "metadata mapping을 expected schema와 비교합니다."], hints: ["rows와 columns 변화를 별도 축으로 적으세요."], expectedOutcome: "SELECT를 표 보기 명령이 아니라 검증 가능한 result contract로 설명합니다.", solutionOutline: ["source→projection→metadata→mapping→authorization→observability 순서입니다."] },
    { difficulty: "응용", prompt: "원본 01_28~01_30 SELECT progression을 list/detail/report API queries로 재구성하세요.", requirements: ["세 원본 files의 실제 counts/provenance를 보존합니다.", "SELECT star를 제거합니다.", "aliases/type/null contracts를 정의합니다.", "bag duplicates/cardinality를 설명합니다.", "logical order와 clause visibility를 검증합니다.", "driver metadata/DTO tests를 작성합니다.", "least-column authorization을 적용합니다.", "MySQL·Oracle portability와 plan/bytes evidence를 포함합니다."], hints: ["localized labels는 presentation layer에 두세요."], expectedOutcome: "학습 SQL이 production-grade typed query boundary로 발전합니다.", solutionOutline: ["inventory→intent→projection→mapping→security→performance 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 SELECT result contract와 query review 표준을 작성하세요.", requirements: ["wildcard/alias/type/null/cardinality rules를 정의합니다.", "logical semantics와 physical plan evidence를 분리합니다.", "ordering/pagination contract를 정의합니다.", "driver/language mapping matrix를 둡니다.", "column authorization/data minimization을 포함합니다.", "contract/version/rollback tests를 정의합니다.", "rows/bytes/latency/privacy telemetry를 정의합니다.", "supported DB/driver upgrade gate를 포함합니다."], hints: ["query exit0을 성공의 전부로 두지 마세요."], expectedOutcome: "새 query와 schema 변경을 일관되게 승인·관측하는 전문가 표준이 완성됩니다.", solutionOutline: ["semantics→schema→mapping→security→performance→operations 순서입니다."] },
  ],
  nextSessions: ["sql-02-where-comparison-boolean"],
  sources,
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "01_28.sql SELECT7, 01_29.sql SELECT39·WHERE27·ORDER5·GROUP4, 01_30.sql SELECT34·GROUP17·JOIN22 active occurrences를 read-only로 계수했습니다.",
      "원본 sample literals/개인정보성 values는 교재·예제·출력에 복제하지 않고 SELECT progression과 clause coverage만 사용했습니다.",
      "원본은 driver metadata, API versioning, column authorization, bag/cardinality 진단과 query telemetry를 충분히 설명하지 않아 공식 문서와 synthetic exact examples로 보완했습니다.",
      "SQLite exact examples는 MySQL 8.4·Oracle 26ai alias/type/optimizer/driver behavior를 대체하지 않으며 vendor contract tests가 필요합니다.",
    ],
  },
});

export default session;
