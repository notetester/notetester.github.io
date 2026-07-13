import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory database와 synthetic boundary·membership·wildcard rows만 준비합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "BETWEEN/half-open, IN membership, escaped LIKE와 prefix/contains predicates를 typed parameters로 실행합니다." },
      { lines: "마지막 5줄", explanation: "정렬된 ids·counts·stable booleans만 출력합니다. vendor collation·escape·optimizer details는 MySQL 8.4·Oracle 26ai에서 다시 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "실제 DB acceptance는 exact column types/collations/indexes와 representative distribution을 사용합니다."] },
    experiments: [
      { change: "lower/upper equality, empty list, NULL 또는 `%`·`_`가 있는 search input을 추가합니다.", prediction: "inclusive/member/pattern semantics의 경계가 즉시 드러납니다.", result: "operator를 shorthand가 아니라 explicit set/range/pattern contract로 이해합니다." },
      { change: "prefix를 leading-wildcard contains로 바꿉니다.", prediction: "결과와 index access 가능성이 달라질 수 있습니다.", result: "검색 UX 요구와 storage/index strategy를 함께 설계합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "between-inclusive-boundaries",
    title: "BETWEEN을 양 끝 포함 비교로 풀어 쓰고 type·NULL·reversed bounds를 검증합니다",
    lead: "`x BETWEEN a AND b`는 일반적으로 `x >= a AND x <= b`에 해당하므로 정확히 상한을 제외해야 하는 기간에는 맞지 않습니다.",
    explanations: [
      "BETWEEN은 숫자·date/text 등 comparable operands에서 lower와 upper를 모두 포함합니다. 10~20 범위라면 10과 20 fixtures를 반드시 넣고 requirement가 closed interval인지 확인합니다.",
      "원본 01_29.sql의 SELECT39·WHERE27 progression에는 range/pattern exercises가 포함됩니다. sample literal은 공개하지 않고 operator coverage만 provenance로 사용합니다. query 성공보다 lower-before/equal/inside/equal-upper/after selected keys를 검증합니다.",
      "value 또는 bound가 NULL이면 condition이 UNKNOWN이 될 수 있고, lower>upper를 자동 swap한다고 가정하지 않습니다. input validation에서 range order·units·timezone을 검사하고 invalid interval은 empty result로 조용히 숨기지 말고 domain error를 고려합니다.",
      "text BETWEEN은 collation ordering에 의존해 ‘A~Z’ 같은 locale/name 검색에 부적절할 수 있습니다. prefix 검색은 LIKE range/index 또는 search service를 사용하고 Unicode/collation boundaries를 명시합니다.",
    ],
    concepts: [
      c("closed interval", "lower와 upper boundary를 모두 포함하는 [lower, upper] 범위입니다.", ["BETWEEN의 기본 사고 모델입니다.", "boundary equality tests가 필요합니다."]),
      c("reversed bounds", "lower가 upper보다 큰 invalid/empty interval 입력입니다.", ["자동 swap 여부를 가정하지 않습니다.", "validation/error policy를 둡니다."]),
    ],
    codeExamples: [py(
      "sql03-between-inclusive",
      "BETWEEN lower·upper boundary 포함 확인",
      "between_inclusive.py",
      "9·10·15·20·21 fixture에서 closed interval이 10과 20을 모두 포함하는지 exact ids로 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE score (score_id INTEGER PRIMARY KEY, value INTEGER)")
db.executemany("INSERT INTO score VALUES (?, ?)", [(1, 9), (2, 10), (3, 15), (4, 20), (5, 21), (6, None)])

selected = [row[0] for row in db.execute("SELECT score_id FROM score WHERE value BETWEEN ? AND ? ORDER BY score_id", (10, 20))]
reversed_ids = [row[0] for row in db.execute("SELECT score_id FROM score WHERE value BETWEEN ? AND ? ORDER BY score_id", (20, 10))]
print("selected=" + ",".join(map(str, selected)))
print("lower-included=" + str(2 in selected).lower())
print("upper-included=" + str(4 in selected).lower())
print("null-included=" + str(6 in selected).lower())
print("reversed-count=" + str(len(reversed_ids)))`,
      "selected=2,3,4\nlower-included=true\nupper-included=true\nnull-included=false\nreversed-count=0",
      ["local-db-0129", "mysql-comparison", "oracle-between", "sqlite-expression"],
    )],
    diagnostics: [
      d("상한 100을 제외해야 하는 bucket에 value=100이 들어간다.", "BETWEEN의 inclusive upper semantics가 requirement와 다릅니다.", ["range notation과 adjacent bucket boundaries를 확인합니다.", "99/100/101 fixtures를 봅니다.", "aggregate 중복을 reconciliation합니다."], "`>= lower AND < upper` half-open predicate로 바꾸고 downstream reports를 재검증합니다.", "range API에 interval notation과 exact boundary tests를 둡니다."),
      d("lower>upper 입력이 단순 0건으로 보여 사용자 오류를 놓친다.", "invalid range validation 없이 DB predicate에 그대로 전달했습니다.", ["raw/normalized bounds와 units를 확인합니다.", "UI/API validation을 봅니다.", "reversed inputs frequency를 측정합니다."], "input boundary에서 lower<=upper를 검증하고 stable domain error로 반환합니다.", "reversed/equal/missing bounds contract tests를 둡니다."),
    ],
    expertNotes: ["BETWEEN SYMMETRIC 같은 vendor/standard variants를 일반 BETWEEN으로 추정하지 않고 지원성과 portability를 확인합니다.", "decimal range는 currency/scale, measurement range는 tolerance와 unit conversion owner를 명시합니다."],
  },
  {
    id: "half-open-time-ranges",
    title: "시간·페이지 구간은 [start,end) half-open range로 precision과 인접 bucket 중복을 제거합니다",
    lead: "하루 끝을 23:59:59.999로 계산하면 DB precision·DST·time zone에 따라 rows를 누락하거나 중복시킬 수 있습니다.",
    explanations: [
      "local date 2026-07-14 전체를 조회하려면 business timezone에서 day start를 instant로 변환하고 next day start를 exclusive upper로 사용합니다. column이 UTC instant인지 local datetime인지 먼저 정의합니다.",
      "half-open ranges는 `[Jul14, Jul15)`와 `[Jul15, Jul16)`가 경계를 공유해도 한 row가 한 bucket에만 들어갑니다. timestamp precision을 최대값으로 추측할 필요가 없고 index range access에도 자연스럽습니다.",
      "DST 시작/종료일은 local day가 23/25 hours일 수 있습니다. application의 timezone database/version과 DB session timezone을 고정하고 ambiguous/nonexistent local times를 policy로 다룹니다.",
      "keyset pagination도 `(sort_key,id) > (?,?)` 같은 open lower cursor와 ordered limit을 사용합니다. 같은 timestamp rows를 id tie-breaker 없이 `>`만 쓰면 누락됩니다.",
    ],
    concepts: [
      c("half-open interval", "start는 포함하고 end는 제외하는 [start,end) 범위입니다.", ["인접 buckets가 겹치지 않습니다.", "timestamp 최대 precision 추측을 피합니다."]),
      c("business timezone", "사용자/업무 date boundary를 instant range로 해석할 기준 timezone입니다.", ["DB storage timezone과 구분합니다.", "DST/version을 검증합니다."]),
    ],
    codeExamples: [py(
      "sql03-half-open-date",
      "자정 경계가 한 날짜 bucket에만 포함되는지 확인",
      "half_open_date.py",
      "ISO UTC fixture에서 start 포함·next start 제외와 인접 bucket 분리를 exact output으로 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event (event_id INTEGER PRIMARY KEY, occurred_at TEXT NOT NULL)")
db.executemany("INSERT INTO event VALUES (?, ?)", [(1, "2026-07-13T23:59:59Z"), (2, "2026-07-14T00:00:00Z"), (3, "2026-07-14T23:59:59.999999Z"), (4, "2026-07-15T00:00:00Z")])

day14 = [row[0] for row in db.execute("SELECT event_id FROM event WHERE occurred_at>=? AND occurred_at<? ORDER BY event_id", ("2026-07-14", "2026-07-15"))]
day15 = [row[0] for row in db.execute("SELECT event_id FROM event WHERE occurred_at>=? AND occurred_at<? ORDER BY event_id", ("2026-07-15", "2026-07-16"))]
print("day14=" + ",".join(map(str, day14)))
print("day15=" + ",".join(map(str, day15)))
print("start-included=" + str(2 in day14).lower())
print("next-start-excluded=" + str(4 not in day14).lower())
print("bucket-overlap=" + str(bool(set(day14) & set(day15))).lower())`,
      "day14=2,3\nday15=4\nstart-included=true\nnext-start-excluded=true\nbucket-overlap=false",
      ["mysql-date-time", "oracle-datetime", "sqlite-expression"],
    )],
    diagnostics: [
      d("23:59:59.999999 이후 precision row가 일간 report에서 누락된다.", "inclusive end-of-day 최대값을 DB precision보다 작게 추측했습니다.", ["column/driver precision을 확인합니다.", "last instant/next midnight fixtures를 봅니다.", "application formatting/truncation을 추적합니다."], "next-day start exclusive upper로 바꾸고 누락 기간을 reconciliation합니다.", "기간 helper에 half-open convention과 precision-independent tests를 둡니다."),
      d("DST 전환일 report count가 다른 system과 다르다.", "local date를 고정 24 hours 또는 서로 다른 timezone으로 변환했습니다.", ["business/session/storage timezones와 tzdb versions를 확인합니다.", "DST boundary instants를 출력합니다.", "source event time semantics를 봅니다."], "한 owner가 timezone-aware start/end instants를 계산해 typed values로 bind하도록 통일합니다.", "23/25-hour day와 tzdb upgrade contract tests를 둡니다."),
    ],
    expertNotes: ["MySQL TIMESTAMP/DATETIME와 Oracle DATE/TIMESTAMP WITH TIME ZONE의 저장·session conversion을 같은 것으로 보지 않습니다.", "event time·ingestion time·processing time 중 어떤 timestamp를 filter하는지 query contract에 명시합니다."],
  },
  {
    id: "in-membership-set",
    title: "IN을 OR 축약이 아니라 typed finite membership set으로 이해합니다",
    lead: "`status IN ('READY','RUNNING')`은 허용된 values 집합 membership이며 duplicates·empty list·NULL과 list 크기 정책을 명시해야 합니다.",
    explanations: [
      "small fixed enum allowlist는 IN으로 명확히 표현할 수 있습니다. values는 column domain과 같은 type/collation을 사용하고 server-known business states를 query code/config에서 관리합니다.",
      "IN list duplicates는 membership 의미를 바꾸지 않지만 input 중복은 caller bug 또는 size amplification일 수 있어 normalize·limit합니다. list order는 result order를 정하지 않으며 필요하면 explicit ordering expression/table과 tie-breaker를 둡니다.",
      "empty list는 `IN ()` syntax 지원이 dialect마다 다르므로 query builder가 false predicate/0 rows 또는 optional filter absent 중 무엇인지 contract로 결정합니다. raw string join으로 SQL을 만들지 않습니다.",
      "large list는 statement/parameter limits, parse/plan time와 selectivity를 해칩니다. temporary/staging table, table-valued/array parameter capability 또는 join을 비교하고 ownership/cleanup/idempotency를 설계합니다.",
    ],
    concepts: [
      c("membership predicate", "한 value가 명시/derived set에 포함되는지를 판단하는 condition입니다.", ["IN list/subquery로 표현합니다.", "result ordering과 무관합니다."]),
      c("empty-list policy", "필터 values가 0개일 때 no rows, no filter 또는 validation error 중 무엇을 의미하는지의 API 계약입니다.", ["dialect syntax에 맡기지 않습니다.", "authorization default를 안전하게 정합니다."]),
    ],
    codeExamples: [py(
      "sql03-in-membership",
      "IN membership·중복 input·result order 분리",
      "in_membership.py",
      "중복이 있는 input values를 normalize해 placeholders로 bind하고 allowed statuses의 ids를 stable order로 조회합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE task (task_id INTEGER PRIMARY KEY, status TEXT NOT NULL)")
db.executemany("INSERT INTO task VALUES (?, ?)", [(1, "READY"), (2, "DONE"), (3, "RUNNING"), (4, "READY"), (5, "FAILED")])

requested = ["RUNNING", "READY", "READY"]
normalized = sorted(set(requested))
placeholders = ",".join("?" for _ in normalized)
selected = [row[0] for row in db.execute(f"SELECT task_id FROM task WHERE status IN ({placeholders}) ORDER BY task_id", normalized)]
print("requested-count=" + str(len(requested)))
print("normalized=" + ",".join(normalized))
print("selected=" + ",".join(map(str, selected)))
print("selected-count=" + str(len(selected)))
print("list-order-controls-result=false")`,
      "requested-count=3\nnormalized=READY,RUNNING\nselected=1,3,4\nselected-count=3\nlist-order-controls-result=false",
      ["mysql-comparison", "oracle-in", "sqlite-expression", "python-sqlite-parameters"],
    )],
    diagnostics: [
      d("empty selections가 SQL syntax error 또는 모든 rows 조회로 바뀐다.", "query builder가 empty IN policy를 정의하지 않고 fragment를 제거/빈 괄호로 만들었습니다.", ["API semantics와 generated SQL을 확인합니다.", "authorization filter인지 user optional filter인지 구분합니다.", "empty/missing/null cases를 실행합니다."], "explicit false/no-filter/error policy를 server에서 선택하고 mandatory scope는 제거하지 않습니다.", "empty-list cases를 query-builder property tests에 둡니다."),
      d("수천 ids IN list로 parse/plan latency와 packet error가 발생한다.", "unbounded client list를 SQL literals/placeholders로 확장했습니다.", ["list size/bytes/parameter limits를 봅니다.", "plan/parse/execute time을 분리합니다.", "temporary/table parameter alternatives를 평가합니다."], "bounded list limit과 staging/table-valued join strategy를 적용하고 cleanup/idempotency를 설계합니다.", "request/query size budgets와 overload rejection을 둡니다."),
    ],
    expertNotes: ["IN subquery와 EXISTS의 NULL/cardinality/optimizer trade-off는 SQL13·14에서 심화합니다.", "client-supplied ids membership은 같은 tenant/actor authorization을 각 matched row에 다시 적용해야 합니다."],
  },
  {
    id: "in-null-unknown",
    title: "IN·NOT IN list/subquery의 NULL과 UNKNOWN을 truth table로 분리합니다",
    lead: "`x NOT IN (1, NULL)`은 x가 2여도 TRUE가 되지 않을 수 있어 exclusion query가 예기치 않게 0 rows를 반환합니다.",
    explanations: [
      "`x IN (a,b,NULL)`은 equality OR chain처럼 생각할 수 있어 match가 없고 NULL comparison이 남으면 UNKNOWN입니다. WHERE는 UNKNOWN을 제외합니다. x 자체 NULL도 일반 IN에서 TRUE가 아닙니다.",
      "NOT IN은 IN result의 NOT이므로 subquery/list에 NULL 하나가 섞이면 unmatched values가 UNKNOWN으로 바뀔 수 있습니다. exclusion에는 NOT EXISTS와 nullable source filtering을 비교하며 SQL14에서 심화합니다.",
      "NULL을 sentinel/missing id로 list에 넣지 않고 input validation에서 제거 또는 explicit `IS NULL` branch로 의미를 정의합니다. ‘null means all/none’ 같은 API convention은 authorization filter에서 위험합니다.",
      "nullable foreign key와 exclusion list가 필요한지 data model을 검토합니다. required reference는 NOT NULL+FK로 정리하면 query truth table도 단순해집니다.",
    ],
    concepts: [
      c("UNKNOWN membership", "비교 set에 NULL이 있고 definitive match가 없을 때 IN/NOT IN이 TRUE/FALSE가 아닌 UNKNOWN이 되는 상태입니다.", ["WHERE에서 제외됩니다.", "NULL fixture가 필요합니다."]),
      c("null contamination", "subquery/list의 nullable value 하나가 NOT IN 전체 unmatched 판정에 영향을 주는 현상입니다.", ["NOT EXISTS 대안을 검토합니다.", "source NOT NULL invariant를 확인합니다."]),
    ],
    codeExamples: [py(
      "sql03-not-in-null-trap",
      "NOT IN list의 NULL contamination 재현",
      "not_in_null_trap.py",
      "같은 candidate ids에서 NOT IN(2)와 NOT IN(2,NULL)의 selected keys를 비교해 UNKNOWN 전파를 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE candidate (candidate_id INTEGER PRIMARY KEY)")
db.executemany("INSERT INTO candidate VALUES (?)", [(1,), (2,), (3,)])

without_null = [row[0] for row in db.execute("SELECT candidate_id FROM candidate WHERE candidate_id NOT IN (2) ORDER BY candidate_id")]
with_null = [row[0] for row in db.execute("SELECT candidate_id FROM candidate WHERE candidate_id NOT IN (2, NULL) ORDER BY candidate_id")]
explicit = [row[0] for row in db.execute("SELECT candidate_id FROM candidate WHERE candidate_id <> 2 ORDER BY candidate_id")]
print("without-null=" + ",".join(map(str, without_null)))
print("with-null=" + ",".join(map(str, with_null)))
print("explicit=" + ",".join(map(str, explicit)))
print("null-contaminated=" + str(with_null == []).lower())
print("expected-nonmatches-preserved=" + str(without_null == explicit).lower())`,
      "without-null=1,3\nwith-null=\nexplicit=1,3\nnull-contaminated=true\nexpected-nonmatches-preserved=true",
      ["mysql-comparison", "oracle-in", "sqlite-expression"],
    )],
    diagnostics: [
      d("NOT IN exclusion query가 갑자기 0 rows를 반환한다.", "list/subquery에 NULL이 들어와 모든 non-match가 UNKNOWN이 됐습니다.", ["subquery/list NULL count를 봅니다.", "truth table로 representative ids를 실행합니다.", "source nullability/constraints를 확인합니다."], "domain에 맞게 NOT EXISTS를 사용하거나 NULL을 명시적으로 제외하고 source invariant를 강화합니다.", "NOT IN에는 NULL-containing fixture와 source NOT NULL proof를 요구합니다."),
      d("NULL filter input을 제거했더니 authorization이 broad query가 된다.", "empty/missing filter를 no restriction으로 해석해 deny scope를 삭제했습니다.", ["mandatory vs optional filter를 구분합니다.", "query builder empty policy를 봅니다.", "cross-tenant selected keys를 확인합니다."], "authorization membership이 비면 false/deny로 처리하고 server-derived scope만 사용합니다.", "empty/null authorization context fail-closed tests를 둡니다."),
    ],
    expertNotes: ["SQL04에서 3값 논리를 전체적으로 심화하므로 여기서는 IN/NOT IN의 가장 위험한 NULL boundary를 명시합니다.", "null-safe equality extension을 IN list에 암묵 적용한다고 가정하지 않습니다."],
  },
  {
    id: "like-wildcards-escape",
    title: "LIKE의 `%`·`_`를 pattern syntax로 보고 literal 검색은 ESCAPE policy로 만듭니다",
    lead: "사용자가 입력한 100%나 A_B를 그대로 LIKE pattern에 넣으면 `%`와 `_`가 wildcard가 되어 의도보다 많은 rows가 매칭됩니다.",
    explanations: [
      "LIKE에서 `%`는 0개 이상의 characters, `_`는 한 character pattern입니다. exact character/byte 의미와 case/collation은 DBMS 설정에 따라 확인합니다. SQL regex와 동일하지 않습니다.",
      "literal contains 검색은 escape character 자체를 먼저 escape한 뒤 `%`와 `_`를 escape하고, SQL에 `ESCAPE` clause 또는 dialect-supported behavior를 명시합니다. values는 parameter bind하며 escape된 pattern도 SQL 문자열 연결하지 않습니다.",
      "client가 wildcard 검색 syntax를 의도적으로 사용할 수 있는 advanced feature라면 literal mode와 pattern mode를 분리하고 maximum length/complexity/rate를 제한합니다. accidental wildcard와 authorized search semantics를 혼합하지 않습니다.",
      "LIKE는 text search relevance, tokenization, typo/fuzzy, language morphology를 제공하지 않습니다. 요구가 커지면 DB full-text/search engine을 선택하고 index/update/privacy 운영을 설계합니다.",
    ],
    concepts: [
      c("LIKE pattern", "literal characters와 `%`·`_` wildcard로 구성된 SQL text matching expression입니다.", ["regex와 다릅니다.", "collation/case behavior를 검증합니다."]),
      c("escape contract", "user literal을 pattern metacharacter로 해석하지 않게 escape character와 변환 순서를 고정한 정책입니다.", ["escape 자체를 먼저 처리합니다.", "parameter binding과 함께 사용합니다."]),
    ],
    codeExamples: [py(
      "sql03-like-literal-escape",
      "percent와 underscore를 literal로 검색하기",
      "like_literal_escape.py",
      "raw wildcard pattern과 escaped literal contains pattern이 선택하는 ids를 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE note (note_id INTEGER PRIMARY KEY, title TEXT NOT NULL)")
db.executemany("INSERT INTO note VALUES (?, ?)", [(1, "진행률 100%"), (2, "진행률 1000"), (3, "A_B"), (4, "ACB")])

def escape_like(value):
    return value.replace("!", "!!").replace("%", "!%").replace("_", "!_")

raw_percent = [row[0] for row in db.execute("SELECT note_id FROM note WHERE title LIKE ? ORDER BY note_id", ("%100%%",))]
literal_percent = [row[0] for row in db.execute("SELECT note_id FROM note WHERE title LIKE ? ESCAPE '!' ORDER BY note_id", ("%" + escape_like("100%") + "%",))]
literal_under = [row[0] for row in db.execute("SELECT note_id FROM note WHERE title LIKE ? ESCAPE '!' ORDER BY note_id", ("%" + escape_like("A_B") + "%",))]
print("raw-percent=" + ",".join(map(str, raw_percent)))
print("literal-percent=" + ",".join(map(str, literal_percent)))
print("literal-underscore=" + ",".join(map(str, literal_under)))
print("percent-overmatch=" + str(len(raw_percent) > len(literal_percent)).lower())
print("underscore-overmatch-prevented=" + str(literal_under == [3]).lower())`,
      "raw-percent=1,2\nliteral-percent=1\nliteral-underscore=3\npercent-overmatch=true\nunderscore-overmatch-prevented=true",
      ["mysql-pattern", "oracle-like", "sqlite-expression", "python-sqlite-parameters"],
    )],
    diagnostics: [
      d("100% 검색이 1000까지 매칭한다.", "사용자 literal `%`를 LIKE wildcard로 해석했습니다.", ["raw/escaped pattern을 value 노출 없이 비교합니다.", "ESCAPE character/ordering을 확인합니다.", "underscore/escape-self fixtures도 실행합니다."], "versioned literal escape helper와 explicit ESCAPE clause+parameter binding을 적용합니다.", "%, _, escape character, Unicode corpus를 contract tests에 둡니다."),
      d("LIKE escape를 했는데 injection이 가능하다.", "pattern wildcard escape를 SQL quote escaping/parameterization과 혼동했습니다.", ["SQL structure/value binding을 확인합니다.", "escape helper output을 raw concatenate하는지 봅니다.", "identifier/order inputs를 추적합니다."], "escaped pattern도 parameter로 bind하고 SQL structure는 known statement로 고정합니다.", "LIKE escape와 injection defense를 별도 tests로 검증합니다."),
    ],
    expertNotes: ["escape character는 DB/session modes와 driver layers가 backslash를 다르게 처리할 수 있어 explicit uncommon character와 integration tests를 사용합니다.", "user search terms는 sensitive할 수 있으므로 raw pattern을 logs/APM/metrics에 기록하지 않습니다."],
  },
  {
    id: "prefix-contains-indexing",
    title: "prefix·suffix·contains 검색 요구를 분리하고 index/search architecture를 선택합니다",
    lead: "`LIKE 'abc%'`는 collation과 index 조건이 맞으면 range access 후보지만 `LIKE '%abc%'`는 일반 B-tree leading key를 활용하기 어렵습니다.",
    explanations: [
      "prefix autocomplete, exact code lookup, suffix/domain search와 contains full-text는 서로 다른 UX입니다. 하나의 contains predicate로 모두 구현하지 않고 minimum length, ranking, case/locale와 result limit을 정의합니다.",
      "prefix pattern은 wildcard가 첫 character에 없고 column/parameter collation·type이 compatible해야 index range가 가능할 수 있습니다. actual EXPLAIN과 rows examined를 representative skew로 확인합니다.",
      "leading wildcard contains는 full scan이 될 수 있습니다. small bounded table이면 acceptable할 수 있지만 large catalog에는 full-text, n-gram/trigram, inverted search service 또는 canonical token relation을 비교합니다.",
      "search index는 source truth와 eventual consistency, delete/privacy, reindex/rebuild, analyzer version과 access control filtering을 운영해야 합니다. speed만 보고 authorization data를 broad index에 넣지 않습니다.",
    ],
    concepts: [
      c("prefix search", "문자열이 지정 text로 시작하는지를 찾는 검색입니다.", ["`value%` pattern으로 표현할 수 있습니다.", "B-tree range 후보가 될 수 있습니다."]),
      c("leading wildcard", "pattern 첫 부분이 `%` 등으로 시작해 ordered index의 시작 범위를 정하기 어려운 형태입니다.", ["contains/suffix에 사용됩니다.", "별도 search index를 검토합니다."]),
    ],
    diagnostics: [
      d("contains 검색이 table growth 뒤 timeout난다.", "leading wildcard full scan을 unbounded endpoint에 사용했습니다.", ["EXPLAIN rows examined/returned와 table growth를 봅니다.", "query length/rate/result limit을 확인합니다.", "search architecture 대안을 benchmark합니다."], "temporary limits/rate/backpressure로 보호하고 full-text/trigram/search projection으로 이관합니다.", "search SLO와 size threshold·plan regression alerts를 둡니다."),
      d("prefix query인데 index를 쓰지 않는다.", "collation/type conversion, column function, pattern shape 또는 low selectivity 때문에 range access가 불가능/비효율적입니다.", ["actual bound pattern과 leading wildcard를 확인합니다.", "column/parameter collation/type과 plan을 봅니다.", "distribution/stats를 측정합니다."], "canonical indexed key와 typed `prefix%` bind를 적용하거나 scan이 실제 최적인지 budget으로 승인합니다.", "prefix/contains plan fixtures와 stats refresh policy를 둡니다."),
    ],
    expertNotes: ["full-text relevance와 LIKE substring은 결과 semantics가 다르므로 migration에서 selected ids/UX acceptance를 비교합니다.", "search suggestions는 authorization·tenant scope와 sensitive term logging/rate limiting을 함께 적용합니다."],
  },
  {
    id: "dynamic-list-pattern-binding",
    title: "동적 범위·IN list·LIKE pattern을 typed query builder와 bounded parameters로 구성합니다",
    lead: "optional filters를 문자열로 이어 붙이면 placeholder order, empty-list, parentheses와 authorization scope가 조합마다 달라집니다.",
    explanations: [
      "query builder는 mandatory scope AST를 먼저 만들고 optional range/membership/pattern nodes를 allowlist로 추가합니다. SQL fragments와 parameter list를 한 structure에서 생성해 position drift를 막고 모든 values를 bind합니다.",
      "list size, pattern length, number of optional filters와 OR branches에 budgets를 둡니다. query complexity는 injection이 없어도 CPU/plan/cache denial-of-service를 만들 수 있습니다.",
      "prepared statement shapes가 너무 많으면 plan cache와 observability가 분산됩니다. common shapes를 named repositories로 두고 rare advanced search는 separate endpoint/search backend로 격리합니다.",
      "missing vs empty vs NULL input 의미를 filter별로 정의합니다. mandatory authorization list empty는 deny, optional UI list empty는 no matches/no filter 중 product contract를 선택하며 silent fragment removal을 피합니다.",
    ],
    concepts: [
      c("predicate AST", "AND/OR/range/membership/pattern nodes로 condition grouping과 parameters를 구조화한 표현입니다.", ["string concatenation보다 scope가 명확합니다.", "allowlist와 serialization tests를 적용합니다."]),
      c("query complexity budget", "list length·pattern length·branches·result limit·runtime 등 한 request가 소비할 수 있는 query 자원 한계입니다.", ["DoS를 줄입니다.", "SLO/authorization과 함께 적용합니다."]),
    ],
    diagnostics: [
      d("optional filter 조합에 따라 parameter가 다른 placeholder에 bind된다.", "SQL fragments와 values를 별도 arrays/condition으로 조립해 order가 drift했습니다.", ["generated SQL placeholder count/order와 parameter metadata를 봅니다.", "모든 filter combinations을 재현합니다.", "affected selected keys를 비교합니다."], "predicate node가 SQL+parameters를 함께 생성하도록 builder를 바꾸고 named contract tests를 추가합니다.", "property-based combinations에서 placeholder/params/key sets를 검증합니다."),
      d("IN/LIKE만 parameterized했는데 검색 endpoint가 CPU를 소진한다.", "injection 방어만 있고 list/pattern/branch/result/time budgets가 없습니다.", ["request/query shapes와 rows examined를 봅니다.", "concurrency/rate/cache behavior를 확인합니다.", "abusive/accidental sources를 분류합니다."], "size/complexity/rate/time limits와 indexed/search backend routing을 적용합니다.", "worst-case query cost tests와 per-actor budgets를 둡니다."),
    ],
    expertNotes: ["query builders/ORM도 generated SQL를 inspect하고 logical grouping/empty semantics/authorization을 exact fixtures로 검증합니다.", "list values를 logs/metrics에 남기지 않고 count·type·bounded category만 관측합니다."],
  },
  {
    id: "range-membership-pattern-portability",
    title: "MySQL·Oracle·SQLite의 range·membership·pattern 차이를 capability matrix로 격리합니다",
    lead: "같은 BETWEEN·IN·LIKE spelling도 collation, empty list, escape, parameter limit와 optimizer behavior가 같다고 가정하지 않습니다.",
    explanations: [
      "MySQL 8.4·Oracle 26ai의 comparison/LIKE docs에서 inclusive range, pattern characters, escape syntax, collation/case와 NULL behavior를 확인합니다. SQLite exact lab은 빠른 feedback일 뿐 production vendor semantics를 증명하지 않습니다.",
      "DBMS별 maximum parameters/IN list, array/table-valued alternatives, case-insensitive search와 functional indexes를 matrix에 기록합니다. application repository는 domain `findByStatuses`, `findWithin` intent를 표현하고 dialect adapter가 SQL을 구현합니다.",
      "Oracle empty string/NULL과 MySQL collation/session modes 같은 차이는 search inputs와 optional filters에 영향을 줍니다. cross-vendor fixtures에 empty/blank/NULL/Unicode/wildcard를 포함합니다.",
      "portability success는 SQL 문자열 동일성이 아니라 same allowed/excluded entity keys, stable error categories, authorization와 performance budget을 유지하는 것입니다.",
    ],
    concepts: [
      c("capability matrix", "DB/driver versions별 syntax·limits·collation·observed semantics를 test evidence와 기록한 표입니다.", ["required/optional 기능을 나눕니다.", "upgrade/migration gate로 사용합니다."]),
      c("domain query intent", "vendor syntax가 아니라 `find active lessons in interval`처럼 업무 결과 contract를 표현한 repository operation입니다.", ["dialect adapter가 구현합니다.", "selected-key contract를 공유합니다."]),
    ],
    diagnostics: [
      d("MySQL에서 통과한 LIKE escape가 Oracle에서 다른 결과/오류를 낸다.", "escape/collation/empty-string behavior를 portable하다고 추정했습니다.", ["generated SQL·bound pattern·escape char를 비교합니다.", "target collation/character set을 봅니다.", "same selected-key fixtures를 실행합니다."], "dialect adapter와 explicit capability contract를 수정하고 both targets regression tests를 둡니다.", "DB/driver version matrix에서 wildcard/escape corpus를 실행합니다."),
      d("vendor migration 뒤 large IN query가 limit error를 낸다.", "source parameter/list limit와 extension을 target에도 가정했습니다.", ["list sizes/target limits/driver expansion을 봅니다.", "staging/array alternatives를 평가합니다.", "authorization scope를 재확인합니다."], "bounded chunk가 semantics를 보존하는지 검증하거나 target-supported table/array join으로 이관합니다.", "capability matrix와 max-size acceptance/overload tests를 둡니다."),
    ],
    expertNotes: ["case-insensitive search를 LOWER portable fallback 하나로 해결하지 말고 Unicode/domain/index requirements를 vendor별로 설계합니다.", "migration comparison은 counts만 아니라 exact keys, ordering/pagination과 plans를 포함합니다."],
  },
  {
    id: "search-security-privacy",
    title: "검색 predicate에 authorization·enumeration·privacy·resource controls를 함께 적용합니다",
    lead: "SQL injection을 막아도 broad wildcard·large IN·timing/count differences가 다른 사용자의 존재와 민감 data를 노출할 수 있습니다.",
    explanations: [
      "mandatory tenant/owner/status predicates는 BETWEEN/IN/LIKE optional branches 밖에서 항상 적용합니다. 사용자 input으로 scope list를 만들지 않고 authenticated capabilities에서 server가 allowed ids/tenant를 도출합니다.",
      "email/phone/account search는 exact/prefix responses와 timing/count로 enumeration을 만들 수 있습니다. generic response, rate limit, minimum query length, audit와 authorized admin workflow를 적용합니다.",
      "search terms 자체가 건강·직업·위치 같은 민감 정보를 포함할 수 있어 logs/APM/analytics에 raw pattern/list를 저장하지 않습니다. retention, aggregation과 access를 목적별로 제한합니다.",
      "unbounded contains, wildcard-only `%`, huge lists와 wide date ranges는 resource exhaustion을 만듭니다. maximum interval/list/pattern/result, timeouts, cancellation/backpressure와 per-actor rate를 둡니다.",
    ],
    concepts: [
      c("enumeration", "검색 결과·오류·timing 차이로 특정 account/entity 존재 여부를 대량 확인하는 공격/노출입니다.", ["authorization·generic response·rate limit을 적용합니다.", "audit signal을 둡니다."]),
      c("wildcard-only search", "pattern이 사실상 모든 text rows와 match해 broad scan/result를 만드는 입력입니다.", ["최소 literal length·scope·limit을 둡니다.", "authorization을 항상 유지합니다."]),
    ],
    diagnostics: [
      d("`%` 검색 한 번이 전체 tenant table을 scan/반환한다.", "wildcard-only input과 result/range limits를 허용했습니다.", ["normalized pattern literal length를 확인합니다.", "rows examined/returned와 timeout을 봅니다.", "tenant/actor scope를 확인합니다."], "minimum literal length, bounded result/time/rate와 indexed/search routing을 적용합니다.", "wildcard-only/long-range/huge-list abuse tests를 둡니다."),
      d("email 검색 응답 차이로 가입 여부를 추측할 수 있다.", "unauthenticated/unauthorized search가 count/message/timing을 다르게 노출합니다.", ["known/unknown responses와 timings를 비교합니다.", "rate/audit controls를 봅니다.", "실제 enumeration impact를 조사합니다."], "generic response·authorization·rate limit과 workflow-specific verification으로 바꿉니다.", "enumeration negative tests와 abuse alerts를 둡니다."),
    ],
    expertNotes: ["검색 결과 snippets/highlights도 stored untrusted text를 context-safe encode해야 하며 LIKE escaping이 XSS를 막지 않습니다.", "full-text/search service로 이관해도 tenant/document-level ACL filtering과 delete propagation을 검증합니다."],
  },
  {
    id: "search-contract-tests-plans",
    title: "boundary·wildcard corpus·selected-key diff·EXPLAIN으로 range/search 변경을 검증합니다",
    lead: "몇 개 정상 검색어가 맞는 것보다 경계·NULL·empty·Unicode·escape·large list·authorization 반례가 같은 key set과 budget을 유지하는지가 중요합니다.",
    explanations: [
      "BETWEEN/half-open은 lower-before/equal/inside/upper-equal/after, IN은 zero/one/duplicate/NULL/many, LIKE는 empty/%/_/escape-self/prefix/contains/Unicode/case fixtures를 사용합니다. 각 expected selected key와 excluded reason을 적습니다.",
      "old/new predicate 또는 vendor migration은 selected key sets, multiplicity, order/pagination, errors와 result contract를 diff합니다. count만 같아 wrong rows를 놓치지 않습니다.",
      "EXPLAIN/ANALYZE로 range/prefix/contains/list sizes별 plan, estimates/actuals, rows examined/returned, sort/temp와 latency를 representative distribution에서 비교합니다. 계획을 고정하기 전에 statistics와 parameter skew를 봅니다.",
      "production telemetry는 normalized query shape/version, range width/list count/pattern category(원문 아님), rows examined/returned, timeout/cancel/error를 bounded dimensions로 남깁니다. regression/abuse runbook과 연결합니다.",
    ],
    concepts: [
      c("wildcard corpus", "literal·metacharacter·escape·Unicode·case·empty inputs로 pattern contract를 검증하는 test set입니다.", ["selected keys를 assertion합니다.", "DB/driver versions에 재사용합니다."]),
      c("search selectivity telemetry", "원문을 기록하지 않고 predicate category와 examined/returned ratio로 broad scan/abuse/regression을 관측하는 지표입니다.", ["privacy와 cardinality를 제한합니다.", "SLO/runbook과 연결합니다."]),
    ],
    diagnostics: [
      d("LIKE escape 수정 뒤 정상 Unicode 검색 일부가 빠진다.", "ASCII `%`·`_` cases만 test하고 collation/normalization/code point behavior를 검증하지 않았습니다.", ["old/new selected keys와 code points를 safe corpus에서 비교합니다.", "collation/normalization versions를 봅니다.", "escape transformation ordering을 확인합니다."], "domain-approved normalization+escape order를 복구하고 Unicode corpus를 vendor matrix에 추가합니다.", "wildcard corpus에 combining/full-width/supplementary cases를 포함합니다."),
      d("튜닝 후 plan은 좋아졌지만 authorization rows가 달라진다.", "performance rewrite의 result-equivalence/mandatory scope 검증을 생략했습니다.", ["old/new key sets를 actor/tenant별 diff합니다.", "predicate AST와 query blocks를 봅니다.", "plan-only benchmark를 확인합니다."], "rewrite를 rollback/contain하고 same mandatory scope와 exact key contract를 복원합니다.", "query tuning gate에서 correctness/security tests를 plan budget보다 먼저 실행합니다."),
    ],
    expertNotes: ["plan cache/parameter skew 때문에 one fixture plan만으로 승인하지 않고 small/large ranges와 rare/common prefixes를 비교합니다.", "search telemetry category도 작은 tenant와 결합하면 민감할 수 있어 aggregation/minimum cohort를 검토합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0129", repository: "local dbstudy snapshot", path: "dbstudy/01_29.sql", usedFor: ["BETWEEN·IN·LIKE progression"], evidence: "SELECT39·WHERE27 active occurrences를 read-only로 계수하고 sample literals는 사용하지 않았습니다." },
  { id: "mysql-comparison", repository: "MySQL 8.4 Reference Manual", path: "Comparison Functions and Operators", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html", usedFor: ["BETWEEN·IN·NULL comparison"], evidence: "MySQL comparison 공식 문서입니다." },
  { id: "mysql-pattern", repository: "MySQL 8.4 Reference Manual", path: "Pattern Matching", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/pattern-matching.html", usedFor: ["LIKE wildcard/escape"], evidence: "MySQL pattern 공식 문서입니다." },
  { id: "mysql-date-time", repository: "MySQL 8.4 Reference Manual", path: "Date and Time Functions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html", usedFor: ["date/timestamp range boundary"], evidence: "MySQL date/time 공식 문서입니다." },
  { id: "oracle-between", repository: "Oracle AI Database 26ai SQL Language Reference", path: "BETWEEN Condition", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/BETWEEN-Condition.html", usedFor: ["inclusive range portability"], evidence: "Oracle BETWEEN 공식 문서입니다." },
  { id: "oracle-in", repository: "Oracle AI Database 26ai SQL Language Reference", path: "IN Condition", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/IN-Condition.html", usedFor: ["membership/NULL portability"], evidence: "Oracle IN 공식 문서입니다." },
  { id: "oracle-like", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Pattern-matching Conditions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Pattern-matching-Conditions.html", usedFor: ["LIKE wildcard/escape portability"], evidence: "Oracle pattern 공식 문서입니다." },
  { id: "oracle-datetime", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Datetime Data Types and Time Zone Support", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/nlspg/datetime-data-types-and-time-zone-support.html", usedFor: ["timezone range boundaries"], evidence: "Oracle datetime/timezone 공식 문서입니다." },
  { id: "sqlite-expression", repository: "SQLite Documentation", path: "SQL Language Expressions", publicUrl: "https://www.sqlite.org/lang_expr.html", usedFor: ["exact BETWEEN·IN·LIKE examples"], evidence: "SQLite expression 공식 문서입니다." },
  { id: "python-sqlite-parameters", repository: "Python 3 Documentation", path: "sqlite3 placeholders", publicUrl: "https://docs.python.org/3/library/sqlite3.html#how-to-use-placeholders-to-bind-values-in-sql-queries", usedFor: ["typed/list/pattern binding examples"], evidence: "Python sqlite3 공식 binding 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-03-between-in-like", slug: "sql-03-between-in-like", courseId: "database", moduleId: "db-query-foundations", order: 3,
  title: "BETWEEN·IN·LIKE로 범위와 패턴 검색하기", subtitle: "shorthand 문법을 interval·membership·pattern·escape·authorization·index·resource 계약으로 확장합니다.", level: "입문", estimatedMinutes: 840,
  coreQuestion: "범위·목록·문자 검색에서 경계값·NULL·wildcard·빈 목록·collation·large input을 정확하고 안전하며 index 가능한 predicate로 어떻게 표현할까요?",
  summary: "dbstudy/01_29.sql의 SELECT39·WHERE27 progression을 read-only로 감사합니다. inclusive BETWEEN/reversed bounds, half-open time ranges, typed IN membership와 empty/large list, IN/NOT IN NULL contamination, LIKE wildcard literal escaping, prefix/contains index architecture, bounded predicate AST binding, MySQL·Oracle·SQLite capability matrix, enumeration/privacy/resource controls와 wildcard/key-set/plan tests를 연결합니다. 다섯 exact Python sqlite3 examples는 BETWEEN endpoints, half-open dates, IN normalization, literal wildcard escaping과 exact selected keys를 실행합니다.",
  objectives: ["BETWEEN의 양 끝 포함과 NULL/reversed bounds를 boundary fixtures로 검증한다.", "시간·연속 bucket을 half-open ranges와 timezone-aware instants로 표현한다.", "IN을 typed finite set membership로 사용하고 empty/duplicate/large list policy를 설계한다.", "IN/NOT IN의 NULL·UNKNOWN 함정을 truth table로 진단한다.", "LIKE `%`·`_`를 literal/pattern mode로 분리하고 explicit escape+parameter binding한다.", "prefix·contains 요구에 맞는 B-tree/full-text/search architecture를 선택한다.", "dynamic range/list/pattern queries에 mandatory scope와 complexity budgets를 강제한다.", "vendor matrix·selected-key diff·EXPLAIN·privacy-safe telemetry로 검색을 운영한다."],
  prerequisites: [{ title: "WHERE 비교와 논리 조건", reason: "range/list/pattern도 WHERE predicate이며 type·NULL·authorization grouping을 먼저 알아야 합니다.", sessionSlug: "sql-02-where-comparison-boolean" }],
  keywords: ["BETWEEN", "IN", "NOT IN", "LIKE", "ESCAPE", "wildcard", "half-open interval", "membership", "NULL", "prefix search", "contains search", "parameter list", "search privacy"], topics,
  lab: {
    title: "기간·상태·제목 검색 API를 boundary-safe하고 abuse-resistant하게 만들기",
    scenario: "tenant 학습자료를 기간, status list와 title literal/prefix/contains mode로 검색합니다. 빈/NULL/huge list, `%`·`_`, DST, wildcard-only와 cross-tenant inputs가 있어도 결과와 SLO가 안전해야 합니다.",
    setup: ["synthetic boundary/NULL/Unicode/wildcard/skew rows만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 representative indexes를 준비합니다.", "actor scope, interval/list/pattern input contract와 expected selected keys를 작성합니다.", "range width/list length/pattern category/result/time budgets를 설정합니다."],
    steps: ["BETWEEN closed와 half-open interval requirements를 interval notation으로 정합니다.", "business timezone local dates를 typed start/end instants로 변환합니다.", "status list를 validate/deduplicate/limit하고 empty policy를 fail-safe하게 적용합니다.", "nullable IN/NOT IN truth table과 NOT EXISTS 대안을 검증합니다.", "literal LIKE input의 escape-self→%→_ 순서와 explicit ESCAPE를 적용합니다.", "exact/prefix/contains modes를 분리하고 wildcard-only/minimum-length controls를 둡니다.", "mandatory tenant/soft-delete scope 밖으로 어떤 OR/list branch도 빠지지 않게 AST를 구성합니다.", "small/large range/list와 rare/common prefix/contains의 selected keys와 EXPLAIN을 비교합니다.", "MySQL·Oracle drivers에서 same wildcard/Unicode/empty corpus를 실행합니다.", "query logs에 terms/list ids가 없고 rate/timeout/cancellation/regression alerts가 작동하는지 확인합니다."],
    expectedResult: ["closed/half-open boundaries와 DST/timezone 결과가 contract와 일치합니다.", "empty/NULL/duplicate/large lists가 승인 policy로 처리되고 authorization은 fail closed입니다.", "literal `%`·`_`가 wildcard overmatch를 만들지 않고 pattern mode는 명시적입니다.", "prefix/contains queries가 승인된 plan/result/time budgets를 지킵니다.", "vendor별 dialect 차이에도 same domain keys와 privacy-safe errors/telemetry를 유지합니다."],
    cleanup: ["isolated schemas·synthetic rows와 search telemetry만 run id로 제거합니다.", "temporary credentials/search indexes를 revoke·삭제합니다.", "logs/APM에 search terms·ids·PII가 없는지 검사합니다.", "production source files/DB는 변경하지 않습니다."],
    extensions: ["full-text analyzer/relevance와 ACL-safe search projection을 설계합니다.", "keyset pagination cursor를 range predicate와 결합합니다.", "Unicode normalization/collation upgrade collision·index migration을 rehearsal합니다.", "property-based wildcard/list/range corpus와 query mutation tests를 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 selected/excluded key를 interval·membership·pattern reason으로 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "BETWEEN endpoints와 reversed bounds를 검증합니다.", "half-open adjacent buckets가 겹치지 않음을 확인합니다.", "IN input duplicates와 result order를 구분합니다.", "literal percent/underscore overmatch를 차단합니다.", "NULL/empty behavior를 별도 truth table로 작성합니다."], hints: ["operator 하나마다 boundary/wildcard 반례를 먼저 만드세요."], expectedOutcome: "BETWEEN·IN·LIKE를 shorthand가 아닌 검증 가능한 검색 계약으로 설명합니다.", solutionOutline: ["domain→input policy→predicate→keys→plan→operations 순서입니다."] },
    { difficulty: "응용", prompt: "원본 01_29 range/list/pattern SQL을 multi-tenant search repository로 재구성하세요.", requirements: ["원본 provenance를 보존합니다.", "typed half-open dates를 사용합니다.", "empty/NULL/large IN 정책을 정의합니다.", "literal/pattern LIKE modes와 escape를 구현합니다.", "mandatory authorization scope와 complexity budgets를 둡니다.", "prefix/contains plan architecture를 비교합니다.", "MySQL·Oracle selected-key corpus를 실행합니다.", "privacy-safe logs/abuse runbook을 포함합니다."], hints: ["escape와 parameterization은 서로 다른 문제입니다."], expectedOutcome: "정확성·성능·보안이 함께 검증된 검색 layer가 완성됩니다.", solutionOutline: ["requirements→range/set/pattern→binding→index→security→telemetry 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 SQL search predicate·query-builder 표준을 작성하세요.", requirements: ["interval/list/pattern semantics를 정의합니다.", "NULL/empty/reversed/wildcard policies를 정의합니다.", "typed parameters/identifier allowlist를 요구합니다.", "tenant/authorization fail-closed structure를 정의합니다.", "query size/rate/time/result budgets를 둡니다.", "DB/search backend selection criteria를 정의합니다.", "vendor/Unicode/collation contract tests를 둡니다.", "selected-key/plan/privacy telemetry와 incident runbook을 정의합니다."], hints: ["LIKE contains를 검색 시스템 전체로 일반화하지 마세요."], expectedOutcome: "검색 요구의 성장과 악성 입력을 견디는 전문가 표준이 완성됩니다.", solutionOutline: ["semantics→construction→execution→security→verification→operations 순서입니다."] },
  ],
  nextSessions: ["sql-04-null-three-valued-logic"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["dbstudy/01_29.sql의 SELECT39·WHERE27 progression을 read-only로 계수하고 BETWEEN·IN·LIKE 학습 흐름만 사용했습니다.", "원본 sample literals/개인정보성 values는 예제·출력에 복제하지 않았습니다.", "원본은 NULL contamination, literal wildcard escaping, DST/half-open interval, large-list/search architecture·privacy를 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite exact results는 MySQL 8.4·Oracle 26ai collation/escape/limits/optimizer semantics를 대체하지 않습니다."] },
});

export default session;
