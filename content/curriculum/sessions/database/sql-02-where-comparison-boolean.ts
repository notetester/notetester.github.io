import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory database와 synthetic rows로 비교·AND/OR·parameter·authorization predicate를 준비합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "predicate를 한 요소씩 바꾸고 selected keys·query plan 또는 stable truth category를 비교합니다." },
      { lines: "마지막 5줄", explanation: "정렬된 ids·counts·booleans만 출력합니다. SQLite coercion/collation/planner 결과를 MySQL 8.4·Oracle 26ai에 일반화하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "vendor acceptance는 exact schema/types/collations/indexes와 production-like data distribution에서 별도 실행합니다."] },
    experiments: [
      { change: "AND/OR 괄호 또는 한 boundary operator를 바꿉니다.", prediction: "선택된 row set이 달라지며 counterexample id가 어느 rule을 위반했는지 드러납니다.", result: "predicate를 자연어 requirement와 truth table로 먼저 검토합니다." },
      { change: "column에 function/cast를 적용하거나 parameter type을 바꿉니다.", prediction: "결과 또는 index access path가 달라질 수 있습니다.", result: "correctness와 sargability를 각각 검증합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "where-row-predicate",
    title: "WHERE를 row마다 TRUE인 경우만 통과시키는 predicate boundary로 봅니다",
    lead: "WHERE는 출력 columns를 고르는 SELECT와 달리 source rows의 포함 여부를 결정하며 FALSE뿐 아니라 UNKNOWN도 제외합니다.",
    explanations: [
      "FROM/JOIN이 만든 candidate row마다 WHERE condition을 평가하고 TRUE인 rows만 다음 논리 단계로 보냅니다. SELECT list에서 alias를 만들기 전이므로 portable SQL에서는 same-block alias를 WHERE에 사용하지 않습니다.",
      "원본 01_28.sql은 introductory SELECT를, 01_29.sql은 WHERE 27 occurrences, 01_30.sql은 WHERE 13 occurrences와 joins/groups를 포함합니다. 이번 세션은 비교와 boolean composition 자체에 집중하고 NULL 3값 논리는 SQL04에서 더 깊게 확장합니다.",
      "requirement를 predicate로 옮길 때 field domain, inclusive/exclusive boundary, timezone/collation, actor/tenant scope와 status lifecycle을 함께 씁니다. ‘활성 사용자’처럼 모호한 label을 한 status 비교로 축약하지 않습니다.",
      "query 결과는 selected rows만 보지 않고 excluded boundary fixtures도 검증합니다. 정상·바로 아래/위·NULL·unexpected enum·다른 tenant·soft deleted rows를 synthetic data로 두어 rule coverage를 증명합니다.",
    ],
    concepts: [
      c("predicate", "각 candidate row에 대해 TRUE/FALSE/UNKNOWN을 반환하는 condition expression입니다.", ["WHERE는 TRUE rows만 보존합니다.", "business rule과 scope를 표현합니다."]),
      c("selection", "predicate를 만족하는 rows만 relation/result에 남기는 relational operation입니다.", ["projection과 구분합니다.", "row cardinality를 바꿉니다."]),
    ],
    codeExamples: [py(
      "sql02-row-selection-boundary",
      "가격·상태 predicate의 포함 경계 확인",
      "row_selection_boundary.py",
      "inclusive minimum과 active status를 동시에 만족하는 ids만 선택하고 각 boundary row를 결과로 고정합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson (lesson_id INTEGER PRIMARY KEY, price INTEGER, status TEXT NOT NULL)")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?)", [(1, 9999, "ACTIVE"), (2, 10000, "ACTIVE"), (3, 15000, "PAUSED"), (4, None, "ACTIVE"), (5, 20000, "ACTIVE")])

selected = [row[0] for row in db.execute("SELECT lesson_id FROM lesson WHERE price >= ? AND status = ? ORDER BY lesson_id", (10000, "ACTIVE"))]
all_ids = [row[0] for row in db.execute("SELECT lesson_id FROM lesson ORDER BY lesson_id")]
excluded = [key for key in all_ids if key not in selected]
print("selected=" + ",".join(map(str, selected)))
print("excluded=" + ",".join(map(str, excluded)))
print("minimum-included=" + str(2 in selected).lower())
print("null-included=" + str(4 in selected).lower())
print("selected-count=" + str(len(selected)))`,
      "selected=2,5\nexcluded=1,3,4\nminimum-included=true\nnull-included=false\nselected-count=2",
      ["local-db-0129", "mysql-where", "oracle-conditions", "sqlite-expression"],
    )],
    diagnostics: [
      d("price=10000 boundary row가 누락된다.", "requirement가 inclusive인데 `>`를 사용하거나 unit/rounding을 다르게 해석했습니다.", ["요구사항의 inclusive/exclusive와 unit을 확인합니다.", "bound parameter type/value를 봅니다.", "9999/10000/10001 fixtures를 실행합니다."], "명시 boundary operator와 domain type을 적용하고 영향 reports/API를 reconciliation합니다.", "모든 range predicate에 lower/equal/upper tests를 둡니다."),
      d("status가 NULL인 rows가 TRUE/FALSE 예상과 다르게 빠진다.", "SQL predicate가 UNKNOWN을 만들 수 있음을 고려하지 않았습니다.", ["NULL distribution과 column nullability를 봅니다.", "truth table을 작성합니다.", "COALESCE fallback 의미를 확인합니다."], "NULL을 domain state로 명시해 IS NULL/NOT NULL 또는 required constraint와 explicit policy를 적용합니다.", "predicate review에 TRUE/FALSE/UNKNOWN fixtures를 포함합니다."),
    ],
    expertNotes: ["row-level authorization predicate를 business filter 뒤에 덧붙이는 선택 옵션으로 보지 말고 항상 적용되는 mandatory scope로 구성합니다.", "filter가 강해도 SELECT list가 secrets를 포함하면 최소 data 원칙을 위반하므로 row/column controls를 함께 검토합니다."],
  },
  {
    id: "comparison-type-domain",
    title: "숫자·문자·날짜 비교 전에 양쪽 type·domain·implicit conversion을 맞춥니다",
    lead: "문자열 '10'과 숫자 10, text date와 typed date를 비교할 때 DBMS conversion 규칙에 기대면 결과와 index 사용이 dialect·data에 따라 달라질 수 있습니다.",
    explanations: [
      "column과 parameter의 logical/physical type을 맞추고 application binder가 올바른 JDBC/driver type을 전송하는지 확인합니다. 숫자를 string으로 bind하거나 date를 locale-formatted text로 보내지 않습니다.",
      "implicit conversion은 invalid input에서 error/warning/zero-like coercion을 만들고 column side conversion으로 index access를 방해할 수 있습니다. schema를 고치거나 parameter를 명시적으로 typed 변환하되 column CAST로 모든 rows를 매 query 변환하지 않습니다.",
      "decimal money, integer counts, timestamp/instant, local date와 code/string identifiers는 같은 comparison operator를 써도 의미가 다릅니다. unit/currency/timezone/canonical format과 NULL policy를 domain contract로 둡니다.",
      "heterogeneous legacy values를 migration할 때 query-time cast로 숨기지 말고 valid/invalid distribution을 preflight하고 canonical typed column으로 staged backfill·constraint를 적용합니다.",
    ],
    concepts: [
      c("implicit conversion", "comparison operands types가 다를 때 DBMS가 선택한 규칙으로 하나를 변환하는 과정입니다.", ["결과·error·index use가 달라질 수 있습니다.", "portable code는 type을 맞춥니다."]),
      c("domain-compatible comparison", "양쪽 값이 같은 unit·scope·canonical meaning과 compatible type을 가져 비교가 의미 있는 상태입니다.", ["type equality만으로 충분하지 않습니다.", "currency/timezone/tenant를 포함합니다."]),
    ],
    diagnostics: [
      d("varchar 가격 비교에서 '100'이 '20'보다 작게 정렬/필터된다.", "numeric domain을 text로 저장해 lexicographic comparison을 수행했습니다.", ["catalog column/parameter types를 봅니다.", "invalid/noncanonical values를 profile합니다.", "query plan/conversion warnings를 확인합니다."], "canonical numeric column으로 validation/backfill하고 typed parameter를 사용합니다.", "domain-to-SQL/driver type matrix와 boundary tests를 둡니다."),
      d("date filter가 특정 locale/application에서만 실패한다.", "locale-formatted string을 date/timestamp comparison에 bind했습니다.", ["wire parameter type/value/timezone를 확인합니다.", "session date format을 봅니다.", "DST/date-only boundary fixtures를 실행합니다."], "typed date/time API와 explicit timezone/range semantics를 적용합니다.", "string date binding을 lint하고 cross-timezone integration tests를 둡니다."),
    ],
    expertNotes: ["identifier처럼 leading zero가 의미 있는 값은 숫자로 바꾸지 않고 canonical text domain으로 비교합니다.", "generated/functional index로 legacy normalization을 지원할 수 있지만 canonical write path와 migration 종료 계획을 둡니다."],
  },
  {
    id: "and-or-not-precedence",
    title: "AND·OR·NOT precedence를 외우기보다 괄호로 업무 rule의 grouping을 고정합니다",
    lead: "`tenant=A AND active OR admin`은 `(tenant=A AND active) OR admin`으로 해석되어 다른 tenant admin까지 노출할 수 있습니다.",
    explanations: [
      "MySQL/Oracle operator precedence에서 NOT, AND, OR의 상대 순서를 확인하되 mixed AND/OR predicate는 요구사항 groups에 괄호를 씁니다. 코드 reviewer가 precedence를 기억해야만 안전한 query를 만들지 않습니다.",
      "De Morgan law로 NOT(A OR B)=NOT A AND NOT B 등을 변환할 수 있지만 NULL/UNKNOWN이 포함되면 classical two-valued intuition을 조심합니다. SQL04 truth table과 actual fixtures로 검증합니다.",
      "boolean column을 지원하는 DBMS에서도 `flag = true`, NULL과 status enum의 의미를 명시합니다. MySQL numeric truthiness나 nonzero shortcut을 cross-vendor contract로 사용하지 않습니다.",
      "dynamic optional filters는 string fragments를 순서 없이 이어 붙이지 않고 predicate AST/query builder와 named business groups로 구성합니다. 빈 OR list, absent filter와 deny/allow default를 test합니다.",
    ],
    concepts: [
      c("operator precedence", "괄호가 없을 때 연산자가 결합·평가되는 문법 우선순위입니다.", ["dialect별 표를 확인합니다.", "mixed boolean은 괄호로 intent를 고정합니다."]),
      c("predicate grouping", "여러 conditions를 하나의 business rule unit으로 묶는 괄호/AST 구조입니다.", ["authorization scope 누출을 막습니다.", "truth-table tests와 연결합니다."]),
    ],
    codeExamples: [py(
      "sql02-precedence-counterexample",
      "괄호 없는 AND/OR가 tenant scope를 누출하는 반례",
      "precedence_counterexample.py",
      "vulnerable predicate와 intended grouped predicate가 선택하는 user ids를 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account (account_id INTEGER PRIMARY KEY, tenant TEXT NOT NULL, active INTEGER NOT NULL, role TEXT NOT NULL)")
db.executemany("INSERT INTO account VALUES (?, ?, ?, ?)", [(1, "A", 1, "USER"), (2, "A", 0, "ADMIN"), (3, "B", 1, "ADMIN"), (4, "B", 1, "USER")])

vulnerable = [row[0] for row in db.execute("SELECT account_id FROM account WHERE tenant='A' AND active=1 OR role='ADMIN' ORDER BY account_id")]
intended = [row[0] for row in db.execute("SELECT account_id FROM account WHERE tenant='A' AND (active=1 OR role='ADMIN') ORDER BY account_id")]
leaked = [key for key in vulnerable if key not in intended]
print("vulnerable=" + ",".join(map(str, vulnerable)))
print("intended=" + ",".join(map(str, intended)))
print("leaked=" + ",".join(map(str, leaked)))
print("cross-tenant-leak=" + str(3 in leaked).lower())
print("fix=tenant AND (active OR admin)")`,
      "vulnerable=1,2,3\nintended=1,2\nleaked=3\ncross-tenant-leak=true\nfix=tenant AND (active OR admin)",
      ["mysql-precedence", "mysql-logical", "oracle-conditions", "sqlite-expression"],
    )],
    diagnostics: [
      d("관리자 예외를 추가한 뒤 다른 tenant rows가 보인다.", "OR branch가 mandatory tenant predicate 밖으로 빠졌습니다.", ["predicate AST/SQL과 parameter values를 봅니다.", "actor/tenant별 selected keys를 비교합니다.", "audit/access impact를 조사합니다."], "접근을 containment하고 mandatory scope AND (business alternatives)로 query를 수정한 뒤 영향 data access를 incident 절차로 처리합니다.", "authorization invariants를 query builder root에 강제하고 cross-tenant negative tests를 둡니다."),
      d("NOT을 추가했는데 NULL status rows가 예상과 다르다.", "two-valued De Morgan reasoning을 SQL UNKNOWN에 그대로 적용했습니다.", ["status nullability/distribution을 봅니다.", "TRUE/FALSE/UNKNOWN truth table을 작성합니다.", "NOT/IS NULL alternatives를 실행합니다."], "NULL domain policy를 명시하고 predicate를 IS NULL/IS NOT NULL 포함 형태로 다시 씁니다.", "boolean rewrite에는 NULL fixtures와 equivalence tests를 요구합니다."),
    ],
    expertNotes: ["authorization query는 allow branch보다 deny/mandatory scope가 어떤 OR에도 우회되지 않는 구조를 code review 도구로 검사합니다.", "ORM Criteria/QueryDSL도 grouping API를 잘못 쓰면 같은 논리 오류가 나므로 generated SQL와 counterexamples를 검증합니다."],
  },
  {
    id: "equality-inequality-distinctness",
    title: "=·<>·NULL-safe distinctness와 identity/business equality를 구분합니다",
    lead: "SQL `=`은 NULL에서 UNKNOWN이며, 두 rows가 같은 entity인지 두 attributes가 같은 value인지도 별도 요구사항입니다.",
    explanations: [
      "일반 equality/inequality는 comparable non-NULL values에 사용합니다. NULL 여부는 IS NULL/IS NOT NULL, 두 nullable expressions의 null-safe equality/distinctness는 vendor가 지원하는 IS [NOT] DISTINCT FROM 또는 explicit logic을 portability layer에서 다룹니다.",
      "case/space/Unicode/collation에 따라 text equality가 달라집니다. email/provider subject/code/name마다 canonicalization과 case sensitivity가 다르므로 one default collation을 모든 business key에 적용하지 않습니다.",
      "numeric equality는 scale/representation과 floating approximation을 고려합니다. money는 decimal, measurement는 tolerance/range predicate를 domain 요구에 맞게 쓰고 arbitrary epsilon을 숨기지 않습니다.",
      "entity equality는 primary/candidate key로 판단하고 display name·mutable attribute match를 identity merge 근거로 사용하지 않습니다. duplicate detection은 normalization·scope·time과 human review가 필요할 수 있습니다.",
    ],
    concepts: [
      c("null-safe distinctness", "NULL도 하나의 비교 상태로 취급해 두 operands가 서로 다른지/같은지를 TRUE/FALSE로 반환하는 비교입니다.", ["일반 =와 다릅니다.", "DBMS syntax 지원을 확인합니다."]),
      c("collation-aware equality", "문자 set/collation의 case·accent·normalization 규칙으로 text values를 비교하는 의미입니다.", ["business domain과 맞춰야 합니다.", "index/unique semantics에도 영향이 있습니다."]),
    ],
    diagnostics: [
      d("`phone <> ?`로 제외했는데 NULL phone rows도 사라진다.", "NULL 비교가 TRUE가 아니라 UNKNOWN이라 WHERE에서 제외됐습니다.", ["NULL count와 predicate truth table을 봅니다.", "exclude 요구가 NULL을 포함하는지 확인합니다.", "IS NULL branch/null-safe operator를 test합니다."], "업무 rule에 따라 `phone IS NULL OR phone <> ?` 또는 dialect-safe distinctness를 사용합니다.", "nullable inequality에 NULL fixture를 필수화합니다."),
      d("case-insensitive UNIQUE와 application equality가 달라 duplicate가 생긴다.", "DB collation·application normalization·identity provider rules가 일치하지 않습니다.", ["stored/raw/canonical values와 collations를 봅니다.", "application compare/version을 확인합니다.", "collision groups를 preflight합니다."], "versioned canonical key와 matching UNIQUE를 도입해 existing conflicts를 owner workflow로 해소합니다.", "cross-layer equality golden corpus와 collation upgrade gate를 둡니다."),
    ],
    expertNotes: ["hash 비교는 collision/normalization과 secret side-channel를 고려해야 하며 raw value equality의 일반 대체가 아닙니다.", "floating equality는 DB/driver/application 연산 순서가 달라질 수 있어 stored decimal 또는 explicit tolerance domain을 선호합니다."],
  },
  {
    id: "range-boundaries-open-closed",
    title: "범위를 open/closed와 half-open interval로 표현해 경계 중복·누락을 막습니다",
    lead: "기간·가격·점수의 양 끝을 포함할지 명시하지 않으면 월말·자정·정확한 임계값에서 bug가 발생합니다.",
    explanations: [
      "`>= lower AND < upper` half-open interval은 연속 time buckets가 겹치지 않고 timestamp precision과 무관하게 다음 boundary를 포함하도록 만들기 좋습니다. `BETWEEN`은 양 끝 포함이므로 정확한 요구에만 사용하고 SQL03에서 심화합니다.",
      "date-only와 timestamp/instant를 비교할 때 ‘2026-07-14 전체’는 local timezone에서 start inclusive, next-day start exclusive로 변환합니다. `23:59:59.999` upper bound는 DB precision/DST/leap behavior에서 누락을 만듭니다.",
      "ranges가 겹치면 할인/예약/effective version 중 어느 rule이 우선하는지 결정하고 database exclusion/unique representation, transaction lock 또는 validation을 둡니다. WHERE filter만으로 stored overlap을 방지하지 못합니다.",
      "pagination cursor/range scan에는 sort key+tie-breaker tuple comparison과 direction을 명시합니다. 단일 timestamp `>`만 쓰면 같은 timestamp rows를 누락할 수 있습니다.",
    ],
    concepts: [
      c("half-open interval", "lower는 포함하고 upper는 제외하는 [lower, upper) 범위입니다.", ["연속 buckets를 겹침 없이 연결합니다.", "time precision hack을 피합니다."]),
      c("boundary fixture", "lower 바로 전/같음/후와 upper 바로 전/같음/후를 포함해 범위 rule을 검증하는 test data입니다.", ["unit/timezone/precision을 고정합니다.", "inclusive/exclusive를 실행 증거로 만듭니다."]),
    ],
    diagnostics: [
      d("월말 마지막 milliseconds data가 report에서 빠진다.", "상한을 23:59:59 같은 최대값 추측으로 만들었습니다.", ["column precision/timezone을 확인합니다.", "upper boundary exact/next instant fixtures를 봅니다.", "application date conversion을 추적합니다."], "다음 기간 시작을 exclusive upper로 쓰는 half-open range로 변경하고 reports를 reconciliation합니다.", "기간 query helper와 DST/precision boundary tests를 표준화합니다."),
      d("연속 할인 기간이 boundary 날에 두 번 적용된다.", "두 ranges가 모두 inclusive upper/lower로 같은 instant/date를 포함합니다.", ["effective intervals와 precedence를 봅니다.", "boundary duplicate rows를 조회합니다.", "stored overlap constraint를 확인합니다."], "[start,end) convention과 overlap prevention을 적용해 data를 owner 승인으로 정리합니다.", "temporal model ADR와 adjacent/overlap concurrency tests를 둡니다."),
    ],
    expertNotes: ["Oracle DATE와 TIMESTAMP, MySQL DATE/DATETIME/TIMESTAMP의 timezone/precision semantics를 같은 이름으로 일반화하지 않습니다.", "business day/calendar ranges는 locale holidays와 versioned calendar source를 명시합니다."],
  },
  {
    id: "text-collation-canonicalization",
    title: "문자 비교의 case·accent·Unicode·trailing-space 규칙을 domain별 collation과 canonical key로 고정합니다",
    lead: "화면에서 같은 문자열처럼 보여도 code points와 collation이 다를 수 있고, 반대로 case-insensitive collation은 서로 다른 raw values를 같게 볼 수 있습니다.",
    explanations: [
      "text `=`와 ordering은 column/expression collation과 character set에 영향을 받습니다. 사용자 표시 이름, email, provider subject, coupon code와 cryptographic token은 서로 다른 equality 요구를 가지므로 database default 하나에 모두 맡기지 않습니다.",
      "case-folding과 Unicode normalization은 versioned canonicalization policy로 write boundary에서 수행하고 raw display value와 canonical lookup key를 분리할 수 있습니다. application과 database가 서로 다른 algorithm을 쓰면 UNIQUE와 조회 결과가 drift합니다.",
      "LOWER(column)=LOWER(?)를 모든 query에 적용하면 index와 locale semantics가 불명확해질 수 있습니다. supported collation·generated canonical column·functional index를 비교하고 collision groups를 migration 전에 preflight합니다.",
      "secret/token/opaque identifiers는 case folding, trim, Unicode normalization을 임의 적용하지 않고 protocol이 정의한 exact byte/text comparison을 지킵니다. 사용자의 친절한 검색과 security identifier equality를 분리합니다.",
    ],
    concepts: [
      c("collation", "text values의 equality와 ordering을 결정하는 character comparison 규칙입니다.", ["case/accent/language/version에 영향을 받습니다.", "index·UNIQUE semantics와 연결됩니다."]),
      c("canonical lookup key", "domain normalization을 versioned하게 적용해 비교/uniqueness에 사용하는 별도 표현입니다.", ["raw display value와 분리할 수 있습니다.", "DB/application algorithm을 일치시킵니다."]),
    ],
    codeExamples: [py(
      "sql02-collation-comparison",
      "binary와 case-insensitive text equality 비교",
      "collation_comparison.py",
      "같은 fixture에서 default binary equality와 explicit NOCASE equality가 선택하는 ids를 비교해 collation이 predicate 일부임을 보여 줍니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE tag (tag_id INTEGER PRIMARY KEY, display_name TEXT NOT NULL)")
db.executemany("INSERT INTO tag VALUES (?, ?)", [(1, "SQL"), (2, "sql"), (3, "Sql2")])

binary_ids = [row[0] for row in db.execute("SELECT tag_id FROM tag WHERE display_name = ? ORDER BY tag_id", ("sql",))]
nocase_ids = [row[0] for row in db.execute("SELECT tag_id FROM tag WHERE display_name = ? COLLATE NOCASE ORDER BY tag_id", ("sql",))]
print("binary=" + ",".join(map(str, binary_ids)))
print("nocase=" + ",".join(map(str, nocase_ids)))
print("binary-count=" + str(len(binary_ids)))
print("nocase-count=" + str(len(nocase_ids)))
print("policy-changes-result=" + str(binary_ids != nocase_ids).lower())`,
      "binary=2\nnocase=1,2\nbinary-count=1\nnocase-count=2\npolicy-changes-result=true",
      ["mysql-where", "oracle-conditions", "sqlite-expression"],
    )],
    diagnostics: [
      d("application은 같은 email로 보는데 database query는 찾지 못한다.", "application normalization과 database collation/canonical key가 다릅니다.", ["raw/canonical values와 code points를 safe하게 비교합니다.", "column/query collations를 봅니다.", "algorithm/version과 existing collisions를 확인합니다."], "승인된 canonicalization version과 matching UNIQUE/index를 도입해 collisions를 owner workflow로 해소합니다.", "cross-layer Unicode/case corpus와 collation upgrade tests를 둡니다."),
      d("token 비교가 대소문자 무시로 성공한다.", "opaque security identifier에 user-friendly case-insensitive collation을 적용했습니다.", ["token protocol/encoding을 확인합니다.", "column/expression collation과 normalization path를 봅니다.", "unauthorized acceptance impact를 조사합니다."], "exact binary/protocol-defined comparison과 constant-time verifier boundary를 적용하고 영향을 회수합니다.", "security identifiers의 type/collation/normalization을 schema policy로 고정합니다."),
    ],
    expertNotes: ["collation library/Unicode version upgrade는 equality/order/UNIQUE collision을 바꿀 수 있어 preflight와 index rebuild를 계획합니다.", "accent-insensitive search와 canonical identity equality는 서로 다른 projections/indexes를 사용할 수 있습니다."],
  },
  {
    id: "sargable-predicates-indexes",
    title: "column을 그대로 searchable하게 두는 sargable predicate와 correctness를 함께 검증합니다",
    lead: "`LOWER(email)=?`, `YEAR(created_at)=?`, `CAST(id AS CHAR)=?`는 편리하지만 일반 index range lookup을 막거나 다른 semantics를 만들 수 있습니다.",
    explanations: [
      "sargability는 search argument가 index key에 직접 적용되어 equality/range access를 사용할 수 있는 가능성입니다. `created_at >= start AND created_at < end`는 `DATE(created_at)=day`보다 일반적으로 index-friendly하지만 actual plan은 data/selectivity/stats로 확인합니다.",
      "canonical email 같은 domain은 write 시 normalized column과 UNIQUE/index를 유지하거나 supported functional/generated index를 사용합니다. query마다 function을 적용하면서 application/DB normalization versions가 달라지지 않게 합니다.",
      "OR predicates는 index merge/union 또는 full scan이 될 수 있습니다. small allowlist는 IN, alternative query branches는 UNION ALL+dedup semantics를 비교하되 결과 correctness와 duplicates를 먼저 고정합니다.",
      "index가 있어도 low selectivity, stale statistics, leading composite order와 parameter distribution 때문에 scan이 최적일 수 있습니다. hint보다 EXPLAIN estimates/actuals·rows examined·latency와 plan variance를 측정합니다.",
    ],
    concepts: [
      c("sargable predicate", "index key에 equality/range search argument로 적용될 수 있게 표현한 condition입니다.", ["column side function/cast를 피합니다.", "actual plan을 검증합니다."]),
      c("selectivity", "predicate가 전체 rows 중 얼마나 작은 비율을 선택하는지 나타내는 특성입니다.", ["plan choice에 영향을 줍니다.", "분포/skew와 함께 봅니다."]),
    ],
    codeExamples: [py(
      "sql02-sargable-range-plan",
      "function predicate와 half-open range의 plan 비교",
      "sargable_range_plan.py",
      "same day rows를 고르는 두 queries가 같은 ids를 내면서 range query가 index search plan을 사용하는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event (event_id INTEGER PRIMARY KEY, created_at TEXT NOT NULL)")
db.execute("CREATE INDEX idx_event_created_at ON event(created_at)")
db.executemany("INSERT INTO event VALUES (?, ?)", [(1, "2026-07-13T23:59:59"), (2, "2026-07-14T00:00:00"), (3, "2026-07-14T12:00:00"), (4, "2026-07-15T00:00:00")])

function_ids = [row[0] for row in db.execute("SELECT event_id FROM event WHERE substr(created_at,1,10)='2026-07-14' ORDER BY event_id")]
range_ids = [row[0] for row in db.execute("SELECT event_id FROM event WHERE created_at>=? AND created_at<? ORDER BY event_id", ("2026-07-14", "2026-07-15"))]
plan = " ".join(str(part) for row in db.execute("EXPLAIN QUERY PLAN SELECT event_id FROM event WHERE created_at>=? AND created_at<?", ("2026-07-14", "2026-07-15")) for part in row)
print("function-ids=" + ",".join(map(str, function_ids)))
print("range-ids=" + ",".join(map(str, range_ids)))
print("same-result=" + str(function_ids == range_ids).lower())
print("range-uses-index=" + str("idx_event_created_at" in plan).lower())
print("upper-bound-exclusive=true")`,
      "function-ids=2,3\nrange-ids=2,3\nsame-result=true\nrange-uses-index=true\nupper-bound-exclusive=true",
      ["mysql-range-optimization", "mysql-explain", "oracle-conditions", "sqlite-query-planner"],
    )],
    diagnostics: [
      d("date filter query가 index가 있어도 full scan한다.", "indexed timestamp column에 DATE/function/cast를 적용했습니다.", ["EXPLAIN과 predicate text를 봅니다.", "column/parameter types와 index definition을 확인합니다.", "range rewrite result equivalence를 test합니다."], "typed half-open range로 바꾸거나 approved functional/generated index를 적용하고 plan/result를 재검증합니다.", "query review에 column-side function/cast lint와 plan budget을 둡니다."),
      d("sargable rewrite 후 결과가 달라진다.", "timezone/collation/normalization semantics를 보존하지 않고 performance만 바꿨습니다.", ["old/new selected key set을 diff합니다.", "session timezone/collation을 확인합니다.", "boundary/invalid values를 봅니다."], "canonical domain와 exact conversion boundary를 정의해 equivalent predicate를 만들거나 rewrite를 철회합니다.", "튜닝 gate에서 result equivalence가 plan improvement보다 먼저 통과해야 합니다."),
    ],
    expertNotes: ["prepared statement generic/custom plan과 parameter sniffing/peeking behavior는 DBMS·driver/version별로 검증합니다.", "functional index는 expression version·collation/timezone dependency와 write/storage cost를 운영합니다."],
  },
  {
    id: "parameter-binding-injection",
    title: "values는 parameter binding하고 identifiers·predicate shapes는 server allowlist로 선택합니다",
    lead: "검색어를 quote로 escape해 SQL 문자열에 붙이는 방식은 injection뿐 아니라 type·NULL·plan cache와 logging contract를 모두 약하게 만듭니다.",
    explanations: [
      "PreparedStatement/driver placeholders로 모든 data values를 bind합니다. driver가 value를 SQL code가 아니라 typed data로 전달하도록 하고 wildcard LIKE escape는 SQL03에서 별도 처리합니다. parameterization이 authorization이나 range validation을 자동 제공하지는 않습니다.",
      "table/column/operator/order direction은 일반 value placeholder로 bind할 수 없습니다. client input을 raw identifier/expression에 연결하지 않고 server enum이 known query/predicate fragment를 선택합니다. empty filters와 unknown operators는 deny/error로 처리합니다.",
      "bind type은 column domain과 맞추고 NULL에는 driver-specific setNull/type metadata가 필요할 수 있습니다. list values는 safe placeholder expansion/array/table parameter capability를 사용하며 comma string 한 parameter로 IN을 흉내 내지 않습니다.",
      "SQL/bind values를 debug log/APM에 남기지 않고 normalized query id, parameter count/type category와 safe error만 관측합니다. search terms·emails·tokens는 민감할 수 있습니다.",
    ],
    concepts: [
      c("parameter binding", "SQL structure와 external value를 분리해 driver protocol로 typed data를 전달하는 방식입니다.", ["injection 방어 기본입니다.", "domain validation/authorization은 별도입니다."]),
      c("query shape allowlist", "client choice를 server가 미리 정의한 columns/operators/predicate combinations에만 매핑하는 통제입니다.", ["identifiers를 raw 연결하지 않습니다.", "unknown/default는 안전하게 거부합니다."]),
    ],
    codeExamples: [py(
      "sql02-parameterized-filter",
      "injection-shaped input을 parameter value로 안전하게 비교",
      "parameterized_filter.py",
      "문자열이 SQL 구조가 아니라 literal value로 처리되어 모든 rows를 우회 선택하지 않음을 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account (account_id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, active INTEGER NOT NULL)")
db.executemany("INSERT INTO account VALUES (?, ?, ?)", [(1, "alice", 1), (2, "bob", 1), (3, "carol", 0)])

untrusted = "alice' OR 1=1 --"
rows = list(db.execute("SELECT account_id FROM account WHERE username = ? AND active = ? ORDER BY account_id", (untrusted, 1)))
normal = [row[0] for row in db.execute("SELECT account_id FROM account WHERE username = ? AND active = ?", ("alice", 1))]
print("untrusted-match-count=" + str(len(rows)))
print("normal-match=" + ",".join(map(str, normal)))
print("all-rows-exposed=" + str(len(rows) == 3).lower())
print("value-bound=true")
print("active-scope-preserved=true")`,
      "untrusted-match-count=0\nnormal-match=1\nall-rows-exposed=false\nvalue-bound=true\nactive-scope-preserved=true",
      ["jdbc-prepared-statement", "python-sqlite-parameters", "mysql-where", "oracle-conditions"],
    )],
    diagnostics: [
      d("검색어 quote 입력으로 모든 rows가 반환된다.", "WHERE 문자열을 concatenate해 input이 predicate 구조를 바꿨습니다.", ["query builder와 normalized/raw SQL을 확인합니다.", "prepared binding 여부를 봅니다.", "access logs/affected data를 incident 범위로 조사합니다."], "취약 endpoint를 containment하고 known SQL+typed parameters로 수정하며 authorization을 재검증합니다.", "injection corpus/unknown operator negative tests와 raw concatenation lint를 둡니다."),
      d("parameterized query인데 다른 tenant rows가 보인다.", "injection은 막았지만 mandatory tenant/authorization predicate가 없습니다.", ["actor→tenant context와 generated SQL을 확인합니다.", "row owner/FK scope를 봅니다.", "cross-tenant fixture를 실행합니다."], "authenticated tenant/owner predicate를 server context로 강제하고 object-level authorization을 적용합니다.", "parameterization tests와 별도로 authorization matrix tests를 둡니다."),
    ],
    expertNotes: ["prepared statements도 stored procedure/dynamic SQL 내부에서 문자열 concatenation을 다시 하면 injection이 생길 수 있습니다.", "allowlist query builder는 feature 조합 폭발과 plan variance를 제한하는 complexity/cost budget을 함께 둡니다."],
  },
  {
    id: "mandatory-scope-soft-delete",
    title: "tenant·owner·status·soft-delete를 optional filter가 아닌 mandatory scope로 구성합니다",
    lead: "검색 조건을 잘 만들어도 authorization/tenant predicate가 빠지면 정확한 SQL로 잘못된 data를 빠르게 노출합니다.",
    explanations: [
      "repository/service API는 actor context 없이 broad query를 호출하기 어렵게 설계합니다. tenant_id/owner_id scope는 client parameter가 아니라 authenticated server context에서 bind하고 admin cross-scope는 별도 capability/audit path로 분리합니다.",
      "soft delete `deleted_at IS NULL`을 모든 queries에 암묵적으로 기억하게 하면 누락됩니다. current view/repository policy, row-level security 또는 explicit active/history APIs로 중앙화하고 unique/history semantics를 함께 설계합니다.",
      "status filter는 lifecycle state machine과 맞아야 합니다. ACTIVE만 보이는지 PAUSED/ARCHIVED owner는 볼 수 있는지 role/use-case matrix를 작성하고 unknown/new states를 default allow하지 않습니다.",
      "mandatory predicates가 index leading columns와 cardinality에 미치는 영향을 workload로 측정합니다. `(tenant_id, status, created_at, id)` 같은 index는 query/range/order pattern과 write cost를 함께 검토합니다.",
    ],
    concepts: [
      c("mandatory scope", "모든 query path에 반드시 적용되는 tenant·owner·authorization·lifecycle 제한입니다.", ["client 선택 filter와 분리합니다.", "우회 path를 negative test합니다."]),
      c("soft-delete visibility", "논리 삭제 rows를 current/history/admin use case별로 포함할지 정하는 중앙 query policy입니다.", ["NULL/status semantics를 정의합니다.", "uniqueness/retention과 연결합니다."]),
    ],
    diagnostics: [
      d("검색 API에서 tenant filter가 특정 optional condition일 때만 붙는다.", "mandatory scope와 user-selected filter를 같은 dynamic fragment list로 구성했습니다.", ["모든 generated query shapes를 enumerate합니다.", "empty/one/many filter cases를 cross-tenant fixtures로 실행합니다.", "actor context source를 확인합니다."], "mandatory tenant/authorization predicate를 query root에 고정하고 optional filters를 그 안에만 추가합니다.", "property-based query-shape tests와 cross-tenant canary를 둡니다."),
      d("새 status 추가 뒤 일반 사용자에게 내부 rows가 노출된다.", "unknown status를 default visible로 처리하거나 `status <> 'DELETED'` 같은 broad negative condition을 썼습니다.", ["role/use-case status allowlist를 확인합니다.", "new state rollout과 old clients를 봅니다.", "exposure audit를 수행합니다."], "positive allowlist states와 deny-by-default mapping으로 바꾸고 영향 access를 처리합니다.", "enum/schema changes에 authorization matrix compatibility gate를 둡니다."),
    ],
    expertNotes: ["DB row-level security를 사용해도 connection pool session context leakage와 privileged bypass roles를 test합니다.", "soft delete는 개인정보 삭제/법적 erasure를 자동 충족하지 않으며 retention/anonymization workflow와 구분합니다."],
  },
  {
    id: "predicate-test-observability",
    title: "truth table·selected-key diff·EXPLAIN·privacy-safe telemetry로 WHERE 운영을 닫습니다",
    lead: "predicate test는 결과 count 하나가 아니라 각 rule branch와 boundary·NULL·tenant 반례가 어떤 key를 포함/제외하는지 증명해야 합니다.",
    explanations: [
      "condition마다 equivalence partition과 boundary fixtures를 만들고 expected selected primary keys를 assertion합니다. AND/OR groups은 truth table 또는 decision table로 모든 combinations을 cover하고 mutation처럼 operator/parentheses를 바꿨을 때 test가 실패해야 합니다.",
      "old/new predicate rewrite나 performance tuning에서는 selected key sets와 duplicates/cardinality를 diff합니다. 결과가 같은 작은 sample만 보지 않고 skew, NULL, invalid legacy values와 concurrent visibility를 representative snapshot에서 비교합니다.",
      "EXPLAIN/ANALYZE로 access type, index/range, estimated/actual rows, rows examined와 filter selectivity를 확인합니다. 실행형 explain이 expensive/side-effect query를 실제 실행할 수 있는지 vendor docs와 production permission을 확인합니다.",
      "telemetry는 normalized query id, predicate shape/version, rows examined/returned, latency와 safe error category를 남기고 bind values/PII·tenant id를 high-cardinality labels로 노출하지 않습니다. sudden cardinality change는 data growth, stats drift, authorization bug를 runbook으로 분류합니다.",
    ],
    concepts: [
      c("selected-key oracle", "fixture에서 predicate가 포함해야 하는 stable primary/business key set을 expected result로 사용하는 test 방법입니다.", ["count보다 진단력이 높습니다.", "boundary/authorization 반례를 포함합니다."]),
      c("predicate mutation", "비교 operator·괄호·AND/OR·NULL handling을 일부러 바꿔 tests가 오류를 탐지하는지 확인하는 변형입니다.", ["test 민감도를 평가합니다.", "production SQL을 변경하지 않는 isolated exercise입니다."]),
    ],
    diagnostics: [
      d("WHERE 변경 test가 count만 같아 wrong rows를 놓친다.", "selected identities/attributes 대신 aggregate count 하나만 assertion했습니다.", ["old/new key sets를 diff합니다.", "boundary/tenant/NULL rows를 확인합니다.", "duplicate multiplicity를 봅니다."], "minimal fixtures에서 exact selected keys와 excluded reasons를 assertion하고 affected production data를 reconciliation합니다.", "predicate tests에 key-set oracle과 mutation cases를 둡니다."),
      d("query telemetry에 검색어와 사용자 id가 metric labels로 폭증한다.", "raw parameters를 observability dimensions로 사용했습니다.", ["metrics/logs/APM label cardinality와 content를 검사합니다.", "retention/access/downstream export를 봅니다.", "privacy incident scope를 평가합니다."], "raw values를 제거하고 normalized shape/version·bounded category만 사용하며 노출 records를 승인 절차로 처리합니다.", "telemetry schema allowlist와 cardinality/privacy CI를 둡니다."),
    ],
    expertNotes: ["predicate equivalence proof는 SQL NULL/collation/timezone semantics와 optimizer rewrites를 포함해 target DB에서 실행합니다.", "authorization predicate regression은 performance error보다 severity가 높을 수 있어 key-set canary와 alert escalation을 분리합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0128", repository: "local dbstudy snapshot", path: "dbstudy/01_28.sql", usedFor: ["SELECT foundation before filters"], evidence: "SELECT7 active occurrences를 read-only로 계수했습니다." },
  { id: "local-db-0129", repository: "local dbstudy snapshot", path: "dbstudy/01_29.sql", usedFor: ["WHERE comparison/boolean exercises"], evidence: "SELECT39·WHERE27 active occurrences를 read-only로 계수했습니다." },
  { id: "local-db-0130", repository: "local dbstudy snapshot", path: "dbstudy/01_30.sql", usedFor: ["WHERE in grouped/joined queries"], evidence: "SELECT34·WHERE13·JOIN22 active occurrences를 read-only로 계수했습니다." },
  { id: "mysql-where", repository: "MySQL 8.4 Reference Manual", path: "SELECT WHERE clause", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["WHERE selection syntax"], evidence: "MySQL SELECT/WHERE 공식 문서입니다." },
  { id: "mysql-logical", repository: "MySQL 8.4 Reference Manual", path: "Logical Operators", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/logical-operators.html", usedFor: ["AND·OR·NOT truth behavior"], evidence: "MySQL logical operators 공식 문서입니다." },
  { id: "mysql-precedence", repository: "MySQL 8.4 Reference Manual", path: "Operator Precedence", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/operator-precedence.html", usedFor: ["AND/OR grouping"], evidence: "MySQL operator precedence 공식 문서입니다." },
  { id: "mysql-range-optimization", repository: "MySQL 8.4 Reference Manual", path: "Range Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html", usedFor: ["sargable equality/range access"], evidence: "MySQL range optimizer 공식 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["predicate plan evidence"], evidence: "MySQL EXPLAIN 공식 문서입니다." },
  { id: "oracle-conditions", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Conditions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Conditions.html", usedFor: ["Oracle predicate/comparison/precedence portability"], evidence: "Oracle conditions 공식 문서입니다." },
  { id: "sqlite-expression", repository: "SQLite Documentation", path: "SQL Language Expressions", publicUrl: "https://www.sqlite.org/lang_expr.html", usedFor: ["exact boolean/comparison examples"], evidence: "SQLite expression 공식 문서입니다." },
  { id: "sqlite-query-planner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["exact index range plan boundary"], evidence: "SQLite query planner 공식 문서입니다." },
  { id: "jdbc-prepared-statement", repository: "Java SE 21 API", path: "java.sql.PreparedStatement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html", usedFor: ["typed parameter binding"], evidence: "JDBC prepared statement 공식 API입니다." },
  { id: "python-sqlite-parameters", repository: "Python 3 Documentation", path: "sqlite3 parameter substitution", publicUrl: "https://docs.python.org/3/library/sqlite3.html#how-to-use-placeholders-to-bind-values-in-sql-queries", usedFor: ["exact bound-value example"], evidence: "Python sqlite3 공식 parameter 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-02-where-comparison-boolean", slug: "sql-02-where-comparison-boolean", courseId: "database", moduleId: "db-query-foundations", order: 2,
  title: "WHERE 비교·논리 연산과 조건 조합", subtitle: "비교 문법을 boundary·type·3값·괄호·authorization·sargability·parameter binding·운영 증거까지 확장합니다.", level: "입문", estimatedMinutes: 840,
  coreQuestion: "업무 규칙과 접근 범위를 정확한 predicate로 옮겨 boundary·NULL·AND/OR·type·index·injection에서 잘못된 rows를 포함하거나 제외하지 않으려면 무엇을 검증해야 할까요?",
  summary: "dbstudy 01_28의 SELECT7, 01_29의 WHERE27, 01_30의 WHERE13 progression을 read-only로 감사합니다. WHERE selection/TRUE boundary, domain-compatible comparisons, AND·OR·NOT precedence와 tenant leak, equality/inequality·NULL-safe distinctness, half-open ranges, sargable index conditions, prepared parameter binding, mandatory tenant/status/soft-delete scope, truth-table/key-set testing과 privacy-safe telemetry를 연결합니다. 다섯 exact Python sqlite3 examples는 inclusive boundary, precedence leak, range index plan, injection-shaped value binding과 selected key outcomes을 실행합니다.",
  objectives: ["WHERE selection과 projection을 구분하고 TRUE/FALSE/UNKNOWN boundary를 설명한다.", "column/parameter types·units·collations·timezone을 domain-compatible하게 맞춘다.", "mixed AND/OR를 괄호로 고정해 mandatory tenant/authorization scope 누출을 막는다.", "equality·inequality·NULL-safe distinctness와 text/numeric comparison을 구분한다.", "open/closed·half-open ranges와 boundary fixtures를 설계한다.", "sargable predicate와 actual index plan/result equivalence를 검증한다.", "external values를 typed parameters로 bind하고 dynamic identifiers/operators를 allowlist한다.", "selected-key tests·EXPLAIN·rows examined와 privacy-safe telemetry로 운영한다."],
  prerequisites: [{ title: "SELECT 투영과 별칭", reason: "WHERE가 rows를 고르고 SELECT가 output columns를 만드는 논리 단계를 먼저 구분해야 합니다.", sessionSlug: "sql-01-select-projection-alias" }],
  keywords: ["WHERE", "predicate", "comparison", "AND", "OR", "NOT", "operator precedence", "NULL", "half-open range", "sargable", "parameter binding", "SQL injection", "tenant scope", "soft delete"],
  topics,
  lab: {
    title: "multi-tenant 학습 검색 predicate를 correctness·authorization·index 계약으로 완성하기",
    scenario: "tenant별 lessons를 price/date/status/search options로 필터합니다. 관리자 branch, NULL 가격, 같은 날짜 경계와 injection-shaped input이 있어도 다른 tenant/삭제 rows는 절대 노출되지 않아야 합니다.",
    setup: ["synthetic tenant/status/NULL/boundary/skew fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 matching indexes를 준비합니다.", "actor→tenant/status visibility matrix와 expected selected keys를 작성합니다.", "old/new predicate normalized ids와 rows-examined/returned budgets를 정의합니다."],
    steps: ["모든 mandatory tenant/owner/soft-delete predicates를 query root에 고정합니다.", "optional filters를 typed parameters와 server allowlist operator/query shapes로 추가합니다.", "AND/OR groups를 괄호/AST로 만들고 cross-tenant counterexample을 실행합니다.", "numeric/text/date parameter types와 half-open time ranges를 검증합니다.", "NULL/empty/unknown status의 TRUE/FALSE/UNKNOWN decision table을 작성합니다.", "column-side functions를 canonical fields 또는 sargable ranges로 바꾸고 result key sets를 비교합니다.", "EXPLAIN에서 index/range·estimates/actuals·rows examined를 representative skew로 측정합니다.", "operator/parentheses mutation이 key-set tests에서 반드시 실패하는지 확인합니다.", "old/new queries의 selected keys/cardinality와 authorization audit를 shadow compare합니다.", "query logs/APM이 bind values·PII를 남기지 않고 regression alerts가 작동하는지 readback합니다."],
    expectedResult: ["모든 allowed rows와 boundary exact rows만 선택되고 NULL/unknown behavior가 문서와 일치합니다.", "AND/OR 어떤 branch도 mandatory tenant/authorization scope를 우회하지 않습니다.", "parameterization이 SQL structure를 보존하고 identifiers/operators는 known shapes만 사용합니다.", "tuned predicate는 old result key set과 같고 target index/row budget을 만족합니다.", "telemetry는 query version·rows examined/returned·latency만 안전하게 남깁니다."],
    cleanup: ["isolated schemas·synthetic rows와 test telemetry만 run id로 제거합니다.", "temporary credentials/grants를 revoke합니다.", "logs에 search terms·tenant/user ids·tokens가 없는지 검사합니다.", "production data/source files는 변경하지 않습니다."],
    extensions: ["row-level security policy와 pool session-context leakage를 시험합니다.", "keyset pagination tuple predicate와 concurrent writes를 검증합니다.", "functional indexes와 canonicalization version migration을 설계합니다.", "property-based truth-table generator와 predicate mutation suite를 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 selected/excluded key의 predicate reason을 적으세요.", requirements: ["stdout 완전 일치를 확인합니다.", "inclusive boundary와 NULL exclusion을 설명합니다.", "괄호 없는 cross-tenant leak을 재현합니다.", "half-open range의 index plan을 확인합니다.", "injection-shaped value가 literal로 처리됨을 확인합니다.", "각 key에 business/authorization reason을 붙입니다."], hints: ["count보다 exact key set을 먼저 보세요."], expectedOutcome: "WHERE 조건을 syntax가 아니라 truth table·scope·plan으로 설명합니다.", solutionOutline: ["domain→predicate→fixtures→keys→plan→telemetry 순서입니다."] },
    { difficulty: "응용", prompt: "원본 01_29·01_30 filters를 multi-tenant 검색 repository로 재구성하세요.", requirements: ["원본 WHERE progression/provenance를 보존합니다.", "types/NULL/boundaries를 정의합니다.", "AND/OR 괄호와 authorization scope를 검증합니다.", "typed PreparedStatement를 사용합니다.", "sargable rewrite result equivalence를 증명합니다.", "soft-delete/status allowlist를 중앙화합니다.", "MySQL·Oracle matrix와 selected-key tests를 둡니다.", "privacy-safe plan/metrics evidence를 포함합니다."], hints: ["user filter와 mandatory scope를 같은 fragment list에 두지 마세요."], expectedOutcome: "정확성·보안·성능이 함께 검증된 WHERE layer가 완성됩니다.", solutionOutline: ["requirements→scope→types→boolean→binding→plan→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 SQL predicate와 dynamic query review 표준을 작성하세요.", requirements: ["type/collation/timezone/boundary rules를 정의합니다.", "NULL 3값과 boolean grouping evidence를 요구합니다.", "mandatory authorization scope 구조를 정의합니다.", "parameter/identifier allowlist를 정의합니다.", "sargability와 result-equivalence gate를 둡니다.", "truth-table/key-set/mutation tests를 정의합니다.", "vendor/driver upgrade matrix를 둡니다.", "query telemetry privacy·cardinality·incident runbook을 정의합니다."], hints: ["PreparedStatement가 authorization을 대신하지 않습니다."], expectedOutcome: "새 predicate와 튜닝 변경을 안전하게 승인하는 전문가 표준이 완성됩니다.", solutionOutline: ["semantics→security→performance→verification→operations 순서입니다."] },
  ],
  nextSessions: ["sql-03-between-in-like"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["01_28 SELECT7, 01_29 WHERE27, 01_30 WHERE13·JOIN22 active occurrences를 read-only로 계수했습니다.", "원본 sample literals/개인정보성 values는 사용하지 않고 filter progression과 clause coverage만 provenance로 사용했습니다.", "원본은 type binding, SQL 3값·authorization grouping, sargability·selected-key equivalence, injection/telemetry를 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite exact results/plans는 MySQL 8.4·Oracle 26ai coercion/collation/optimizer/driver semantics를 대체하지 않습니다."] },
});

export default session;
