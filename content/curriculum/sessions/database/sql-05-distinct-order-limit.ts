import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "Python sqlite3 memory database와 synthetic rows를 준비해 원본의 query progression만 재현합니다." },
      { lines: `${first + 1}-${second}`, explanation: "DISTINCT·ORDER BY·LIMIT/OFFSET 또는 cursor predicate를 실행하고 selected keys와 경계 상태를 수집합니다." },
      { lines: `${second + 1}-${count}`, explanation: "정렬된 key·count·boolean을 stable stdout으로 기록합니다. 실제 MySQL·Oracle semantics는 공식 문서와 vendor contract test로 분리합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "fixture는 synthetic identifier와 상태만 사용하며 원본 sample 인물·연락처를 복제하지 않습니다."] },
    experiments: [
      { change: "마지막 ORDER BY unique key를 제거하고 동점 row를 추가합니다.", prediction: "row 수는 같아도 동점 내부 순서와 page 경계가 실행마다 달라질 수 있습니다.", result: "API pagination에는 unique tie-breaker가 포함된 total order를 사용합니다." },
      { change: "page 사이에 새 row를 삽입하거나 삭제합니다.", prediction: "OFFSET은 위치가 밀려 중복·누락이 생기고 keyset은 cursor 이전의 새 row를 다음 page에 섞지 않습니다.", result: "일관성 요구에 따라 snapshot·keyset·count 정책을 명시합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "bag-distinct-projection",
    title: "SQL 결과를 기본적으로 bag으로 보고 DISTINCT가 선택한 전체 projection tuple에 적용됨을 증명합니다",
    lead: "중복은 저장 오류라는 뜻이 아니라 join·projection 뒤 동일 tuple이 여러 번 나타날 수 있는 SQL 결과의 정상 상태이며, DISTINCT는 화면에 보이는 한 column만 몰래 정리하지 않습니다.",
    explanations: [
      "관계 이론의 relation은 duplicate tuple을 허용하지 않지만 실제 SQL query result는 기본적으로 bag semantics를 가집니다. `SELECT publisher`는 동일 publisher를 row 수만큼 반환하고 `SELECT DISTINCT publisher`가 projection tuple 전체의 duplicate를 제거합니다. 여러 column을 고르면 두 column 조합이 같아야 한 row로 줄어듭니다.",
      "원본 01_29.sql은 active SELECT39·DISTINCT1·ORDER BY4를 통해 projection, COUNT(DISTINCT), 정렬로 이동합니다. 이 세션은 sample 서점 이름을 옮기지 않고 그 progression과 occurrence evidence만 보존하며 synthetic publisher rows에서 bag count와 distinct count를 분리합니다.",
      "DISTINCT는 NULL을 equality value로 바꾸지는 않지만 duplicate elimination 문맥에서는 여러 NULL projections가 하나의 결과 tuple로 축약될 수 있습니다. WHERE의 `NULL = NULL`이 UNKNOWN이라는 규칙과 DISTINCT의 not-distinct grouping semantics를 같은 규칙으로 오해하지 않습니다.",
      "중복의 원인이 잘못된 join cardinality라면 DISTINCT로 증상을 덮지 않습니다. expected grain, primary/foreign keys, join multiplicity를 먼저 확인하고, 사용자 요구가 실제 unique values일 때만 DISTINCT를 사용합니다. DISTINCT 추가 전후 row 수와 representative duplicated keys를 PII 없이 기록합니다.",
    ],
    concepts: [
      c("bag semantics", "동일한 projected tuple이 여러 번 존재할 수 있는 SQL 결과 모델입니다.", ["SELECT 기본 동작입니다.", "row multiplicity가 count와 join 의미를 가집니다."]),
      c("duplicate elimination", "projection tuple 전체가 서로 not distinct인 rows를 하나로 줄이는 연산입니다.", ["DISTINCT로 요청합니다.", "join bug의 만능 수정이 아닙니다."]),
    ],
    codeExamples: [py(
      "sql05-bag-distinct-null",
      "bag row와 DISTINCT publisher·NULL 축약을 함께 계수",
      "bag_distinct_null.py",
      "동일 publisher와 NULL이 반복되는 synthetic rows에서 입력 multiplicity와 distinct projection을 exact 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE book (book_id INTEGER PRIMARY KEY, publisher TEXT)")
db.executemany("INSERT INTO book VALUES (?, ?)", [(1, "Alpha"), (2, "Alpha"), (3, "Beta"), (4, None), (5, None)])

bag = [row[0] for row in db.execute("SELECT publisher FROM book ORDER BY book_id")]
distinct = [row[0] for row in db.execute("SELECT DISTINCT publisher FROM book ORDER BY publisher IS NULL, publisher")]
def fmt(values):
    return ",".join("NULL" if value is None else str(value) for value in values)
print("bag-count=" + str(len(bag)))
print("bag=" + fmt(bag))
print("distinct-count=" + str(len(distinct)))
print("distinct=" + fmt(distinct))`,
      "bag-count=5\nbag=Alpha,Alpha,Beta,NULL,NULL\ndistinct-count=3\ndistinct=Alpha,Beta,NULL",
      ["local-db-0129", "mysql-distinct", "sqlite-select"],
    )],
    diagnostics: [d("join 결과가 예상보다 많아 모든 SELECT에 DISTINCT를 붙였더니 숫자는 맞지만 일부 합계가 줄었다.", "result grain과 join cardinality를 확인하지 않고 duplicate symptoms를 projection 단계에서 제거했습니다.", ["expected one-row-per 무엇인지 적습니다.", "join 전후 key multiplicity와 unmatched rows를 셉니다.", "DISTINCT 전후 제거된 tuple samples를 synthetic/redacted key로 봅니다."], "join condition 또는 aggregation grain을 교정하고 실제 unique projection 요구가 있는 절에만 DISTINCT를 둡니다.", "query review에 grain·key·multiplicity 표와 no-accidental-DISTINCT lint를 둡니다.")],
    expertNotes: ["DISTINCT on wide text/blob projections는 sort/hash memory와 spill 비용이 크므로 필요한 key를 먼저 결정합니다.", "ORM entity deduplication과 SQL row deduplication은 collection identity·fetch join 경계가 달라 actual generated SQL과 hydrated count를 함께 봅니다."],
  },
  {
    id: "distinct-aggregate-group-boundary",
    title: "DISTINCT projection·COUNT(DISTINCT expression)·GROUP BY를 서로 다른 질문으로 구분합니다",
    lead: "고유 결과 rows, 고유 non-NULL values의 개수, category별 aggregate는 화면이 비슷해도 NULL·multi-column·execution cost가 다릅니다.",
    explanations: [
      "`SELECT DISTINCT category`는 고유 category rows를 반환하고 `COUNT(DISTINCT category)`는 고유 non-NULL category 수 하나를 반환합니다. NULL inclusion과 empty input result를 공식 aggregate semantics로 확인합니다. 여러 expression의 distinct aggregate 지원 문법은 DBMS마다 다르므로 tuple encoding을 문자열 concat으로 흉내 내지 않습니다.",
      "GROUP BY는 group별 aggregate를 계산하는 연산이며 DISTINCT를 붙여 group rows를 다시 줄이는 패턴은 대개 grain이 불명확하다는 신호입니다. selected non-aggregate expressions, functional dependency, ONLY_FULL_GROUP_BY와 Oracle grouping 규칙을 target version에서 검증합니다.",
      "approximate distinct counting, sketches와 data warehouse engine 기능은 exact DISTINCT의 drop-in replacement가 아닙니다. 허용 오차, mergeability, privacy threshold와 refresh window를 product contract에 명시합니다.",
      "운영에서는 distinct cardinality가 갑자기 변하면 upstream normalization·collation·join cardinality·late rows를 확인합니다. raw sensitive values를 metric label로 보내지 않고 bounded category와 count only evidence를 남깁니다.",
    ],
    concepts: [c("COUNT DISTINCT", "expression의 고유 non-NULL values 개수를 반환하는 aggregate입니다.", ["projection DISTINCT와 result shape가 다릅니다.", "NULL 정책을 확인합니다."]), c("result grain", "결과 한 row가 나타내는 business entity·기간·category의 최소 단위입니다.", ["join과 group 설계의 기준입니다.", "문서와 test key에 명시합니다."])],
    diagnostics: [d("고유 고객 수와 DISTINCT 고객 목록 row 수가 NULL category 때문에 다르다.", "projection DISTINCT와 COUNT(DISTINCT)의 NULL 처리 차이를 같은 것으로 가정했습니다.", ["NULL·empty input fixtures를 실행합니다.", "count denominator와 eligible population을 적습니다.", "DBMS multi-expression syntax를 확인합니다."], "report에 population·NULL inclusion·exact/approximate contract를 명시하고 알맞은 query를 분리합니다.", "aggregate golden dataset에 duplicate·NULL·empty cases를 포함합니다.")],
    expertNotes: ["COUNT(DISTINCT) memory pressure는 cardinality와 parallel aggregation plan에 따라 달라 EXPLAIN/actual metrics로 봅니다.", "collation이나 normalization 변경은 distinct cardinality migration이므로 preflight distribution과 rollback을 준비합니다."],
  },
  {
    id: "order-by-logical-contract",
    title: "ORDER BY를 결과 순서 계약으로 사용하고 table 물리 순서·우연한 index 순서를 버립니다",
    lead: "ORDER BY가 없는 SQL result는 특정 순서를 약속하지 않으므로 어제 primary-key 순으로 보였다는 관찰은 API 계약이 아닙니다.",
    explanations: [
      "optimizer는 scan path, join order, parallelism, statistics와 version에 따라 rows를 다른 순서로 만들 수 있습니다. ORDER BY가 없는 query는 tests에서도 set/bag으로 비교하거나 실제 product order를 명시해야 합니다. subquery 내부 ORDER BY는 LIMIT/window 등 의미가 연결되지 않으면 outer result order를 보장하지 않습니다.",
      "ORDER BY expression은 SELECT alias, ordinal, column/expression 지원 범위와 DISTINCT restriction이 DBMS마다 다릅니다. ordinal `ORDER BY 2`는 projection refactor에 취약하므로 public query와 migration에서는 의미 있는 expression/alias를 선호합니다.",
      "text ordering은 collation, character set, locale, case/accent sensitivity와 normalization에 의존합니다. binary order와 사용자 언어 정렬을 구분하고, collation upgrade가 cursor order와 cache key를 바꿀 수 있음을 versioned contract에 남깁니다.",
      "order direction은 각 key마다 독립적입니다. `ORDER BY created_at DESC, id DESC`와 `created_at DESC, id ASC`는 다른 cursor predicate를 요구합니다. query, cursor encode/decode, index direction, client display를 한 specification으로 test합니다.",
    ],
    concepts: [c("ORDER BY contract", "결과 rows의 비교 key·direction·NULL/collation·tie-breaker를 명시한 순서 계약입니다.", ["물리 저장 순서와 다릅니다.", "pagination cursor와 결합됩니다."]), c("collation", "문자열 비교와 정렬에서 문자 간 순서를 결정하는 DB 규칙입니다.", ["locale/case/accent에 영향받습니다.", "index와 DISTINCT에도 연결됩니다."])],
    diagnostics: [d("같은 query가 staging에서는 id 순인데 production에서는 날짜 순처럼 보인다.", "ORDER BY 없이 우연한 access path를 기대했습니다.", ["generated SQL 마지막 ORDER BY를 확인합니다.", "EXPLAIN과 index/statistics 차이를 봅니다.", "test가 sequence인지 set인지 확인합니다."], "사용자 요구에 맞는 explicit total ORDER BY를 추가하고 index/latency를 검증합니다.", "ordered endpoint test는 exact key sequence와 ORDER BY presence를 assertion합니다.")],
    expertNotes: ["sort가 memory를 넘으면 temp spill과 latency tail이 커지므로 rows/width/work memory를 실제 plan에서 관찰합니다.", "ordered aggregation이나 window 결과도 최종 presentation order는 outer ORDER BY로 별도 선언합니다."],
  },
  {
    id: "total-order-null-tie-breaker",
    title: "동점과 NULL까지 포함한 unique tie-breaker로 total order를 만듭니다",
    lead: "business sort key가 같을 수 있으면 page boundary가 한 row 위치를 결정하지 못하므로 immutable unique key를 마지막 비교 key로 추가해야 합니다.",
    explanations: [
      "partial order는 points=90인 두 rows의 상대 순서를 정하지 않습니다. `ORDER BY points DESC, item_id ASC`처럼 unique key까지 포함하면 모든 row pair의 순서를 결정하는 total order가 됩니다. tie-breaker는 stable·immutable하고 authorization scope 안에서 unique해야 합니다.",
      "NULL default position은 MySQL·Oracle·SQLite와 ASC/DESC에 따라 다를 수 있습니다. `ORDER BY points IS NULL, points DESC, item_id` 또는 CASE로 explicit null bucket을 먼저 정하면 의도가 드러나지만 expression index/cost와 vendor syntax를 검증해야 합니다.",
      "nullable cursor key는 NULL bucket, value, tie-breaker를 모두 encode해야 합니다. 단순 `(points,id) < (?,?)` row-value comparison이 NULL에서 UNKNOWN을 만들 수 있으므로 generated predicate를 null matrix로 test합니다.",
      "tie-breaker로 random UUID를 쓰면 uniqueness는 얻지만 insertion locality와 index page behavior가 달라질 수 있습니다. 순서 의미·노출 보안·index 비용을 함께 고려하고 opaque cursor에는 raw sequential identifier 노출을 피할 수 있습니다.",
    ],
    concepts: [c("total order", "모든 서로 다른 결과 rows의 선후가 하나로 결정되는 순서입니다.", ["unique tie-breaker가 필요합니다.", "pagination 안정성의 전제입니다."]), c("NULL placement", "nullable sort key rows를 non-NULL rows 앞/뒤 어느 bucket에 놓을지 정한 정책입니다.", ["vendor default에 의존하지 않습니다.", "cursor predicate와 일치시킵니다."])],
    codeExamples: [py(
      "sql05-total-order-null",
      "NULL-last·points DESC·unique id 순서 검사",
      "total_order_null.py",
      "동점 points와 NULL rows를 explicit bucket 및 item_id tie-breaker로 완전히 정렬합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE score (item_id INTEGER PRIMARY KEY, points INTEGER)")
db.executemany("INSERT INTO score VALUES (?, ?)", [(11, 90), (12, None), (13, 90), (14, 80), (15, None)])

rows = list(db.execute("SELECT item_id, points FROM score ORDER BY points IS NULL, points DESC, item_id"))
ordered = ",".join(f"{item_id}:{'NULL' if points is None else points}" for item_id, points in rows)
print("ordered=" + ordered)
print("unique-positions=" + str(len({item_id for item_id, _ in rows}) == len(rows)).lower())
print("nulls-last=" + str([item_id for item_id, points in rows if points is None] == [12, 15]).lower())`,
      "ordered=11:90,13:90,14:80,12:NULL,15:NULL\nunique-positions=true\nnulls-last=true",
      ["local-db-0129", "mysql-order", "oracle-select", "sqlite-select"],
    )],
    diagnostics: [d("동점 rows가 page 1과 2 사이에서 중복되거나 사라진다.", "ORDER BY가 non-unique business key에서 끝나 total order가 아닙니다.", ["sort key duplicate/NULL distribution을 셉니다.", "actual SQL과 cursor keys를 비교합니다.", "same-key rows를 반복 실행합니다."], "immutable unique tie-breaker와 explicit NULL placement를 query·cursor·index에 같은 direction으로 추가합니다.", "pagination fixtures에 동점·NULL·concurrent insert/delete를 포함합니다.")],
    expertNotes: ["distributed shards에서는 shard-local id만으로 global total order가 되지 않아 shard key 또는 globally unique sequence가 필요합니다.", "tie-breaker가 update되면 keyset traversal 중 row가 앞뒤로 이동하므로 cursor 기간 동안 immutable한 key를 고릅니다."],
  },
  {
    id: "limit-top-n-boundary",
    title: "LIMIT/FETCH를 top-N 경계로 보고 ORDER BY·ties·optimizer early-out를 함께 검토합니다",
    lead: "LIMIT 10은 앞의 10 rows를 자를 뿐 어떤 10 rows인지 정의하지 않으므로 반드시 순서와 selection scope가 먼저 완성되어야 합니다.",
    explanations: [
      "MySQL/SQLite LIMIT, Oracle row_limiting_clause/FETCH FIRST는 문법이 다르지만 logical 요구는 filtered result를 total order로 정렬한 뒤 N rows를 반환하는 것입니다. LIMIT만 있으면 arbitrary sample이며 repeatability를 기대하지 않습니다.",
      "top-N query는 full sort 대신 matching index scan과 early stop을 사용할 수 있습니다. 그러나 selected columns, filter selectivity, NULL/collation expression 때문에 covering/order index가 무효가 될 수 있어 EXPLAIN과 actual row reads를 확인합니다.",
      "WITH TIES는 boundary sort key와 같은 rows를 더 반환해 요청 N보다 많아질 수 있습니다. support와 syntax가 DBMS마다 다르고 unique tie-breaker까지 ORDER BY에 넣으면 ties가 사라지는 의미 차이가 있으므로 product 요구를 먼저 정의합니다.",
      "LIMIT 값은 validated bounded integer parameter로 처리합니다. 매우 큰 page size는 memory, response, lock/snapshot lifetime과 데이터 유출 범위를 키우므로 server maximum과 streaming/export 별도 경로를 둡니다.",
    ],
    concepts: [c("top-N query", "정의된 순서에서 처음 N rows를 선택하는 query입니다.", ["ORDER BY가 의미를 제공합니다.", "matching index로 early stop할 수 있습니다."]), c("WITH TIES", "N번째 row와 sort key가 같은 rows를 함께 반환하는 boundary policy입니다.", ["row 수가 N을 넘을 수 있습니다.", "vendor 지원을 확인합니다."])],
    diagnostics: [d("LIMIT 20 endpoint 결과가 deploy 후 전혀 다른 20 rows가 된다.", "ORDER BY가 없거나 optimizer access path 변화가 arbitrary prefix를 바꿨습니다.", ["query의 explicit total order를 봅니다.", "before/after plan과 indexes를 비교합니다.", "cache key에 order/filter/page size를 확인합니다."], "요구 기반 total order와 bounded limit를 추가하고 selected-key regression을 수행합니다.", "top-N API contract test에 plan-independent ordered keys를 둡니다.")],
    expertNotes: ["optimizer의 LIMIT cost heuristic은 전체 결과 query와 다른 plan을 고를 수 있어 limit별 plan regression을 봅니다.", "export/analytics에서 LIMIT을 safety guard로 몰래 넣으면 incomplete 결과가 정상처럼 소비되므로 truncation metadata를 명시합니다."],
  },
  {
    id: "offset-pagination-drift",
    title: "OFFSET의 선형 건너뛰기 비용과 concurrent insert/delete에 의한 위치 drift를 재현합니다",
    lead: "page 번호는 사용하기 쉽지만 OFFSET이 커질수록 앞 rows를 읽어 버려야 하고 page 사이 변화가 위치를 밀어 중복·누락을 만듭니다.",
    explanations: [
      "OFFSET pagination은 `LIMIT size OFFSET (page-1)*size`로 random page 접근을 제공합니다. 그러나 database는 보통 skipped rows를 찾아 지나가야 하므로 deep page latency와 scanned rows가 선형으로 증가합니다. total order와 matching index가 있어도 offset 자체의 작업은 남습니다.",
      "client가 page1을 읽은 뒤 더 앞에 새 row가 삽입되면 기존 마지막 row가 page2로 밀려 중복될 수 있습니다. 삭제는 반대로 row를 당겨 누락을 만들 수 있습니다. 하나의 repeatable-read snapshot, versioned materialization 또는 product가 drift를 허용한다는 명시가 필요합니다.",
      "원본 02_03.sql은 active LIMIT4·OFFSET4·ORDER BY4와 counted pagination을 순차적으로 제시합니다. 이 세션은 original identifiers를 복제하지 않고 synthetic score rows로 page1/page2와 insert 뒤 page2의 exact key 차이를 실행합니다.",
      "OFFSET은 관리자 소규모 table, low depth, stable snapshot, direct page requirement에는 실용적일 수 있습니다. 무조건 금지하지 말고 p95 depth·rows examined·change rate·user navigation을 측정해 keyset 전환 기준을 정합니다.",
    ],
    concepts: [c("OFFSET pagination", "정렬 결과 앞의 k rows를 건너뛰고 다음 N rows를 반환하는 page 방식입니다.", ["random page가 쉽습니다.", "deep scan과 mutation drift가 있습니다."]), c("pagination drift", "page 요청 사이 insert/delete/update로 row position이 이동해 중복·누락이 생기는 현상입니다.", ["total order만으로 막지 못합니다.", "snapshot 또는 keyset 정책이 필요합니다."])],
    codeExamples: [py(
      "sql05-offset-drift",
      "page 사이 insert가 OFFSET 중복·누락을 만드는 exact 재현",
      "offset_drift.py",
      "첫 page 이후 상위 row를 삽입하고 기존 page2와 새 page2 selected ids를 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item (item_id INTEGER PRIMARY KEY, score INTEGER NOT NULL)")
db.executemany("INSERT INTO item VALUES (?, ?)", [(1, 100), (2, 90), (3, 80), (4, 70)])
def page(offset):
    return [row[0] for row in db.execute("SELECT item_id FROM item ORDER BY score DESC, item_id DESC LIMIT 2 OFFSET ?", (offset,))]

page1 = page(0)
page2 = page(2)
db.execute("INSERT INTO item VALUES (?, ?)", (5, 95))
page2_after = page(2)
print("page1-before=" + ",".join(map(str, page1)))
print("page2-before=" + ",".join(map(str, page2)))
print("page2-after-insert=" + ",".join(map(str, page2_after)))
print("duplicate-across-requests=" + ",".join(map(str, sorted(set(page1) & set(page2_after)))))
print("missed-from-original=" + ",".join(map(str, sorted(set(page2) - set(page2_after)))))`,
      "page1-before=1,2\npage2-before=3,4\npage2-after-insert=2,3\nduplicate-across-requests=2\nmissed-from-original=4",
      ["local-db-0203", "mysql-limit", "sqlite-limit", "python-sqlite3"],
    )],
    diagnostics: [d("deep page가 느리고 사용자가 앞 page에서 본 row를 다음 page에서 다시 본다.", "large OFFSET scan과 page 요청 사이 insert/delete drift가 동시에 발생했습니다.", ["offset별 rows examined/latency를 측정합니다.", "order keys의 mutation log를 봅니다.", "client request timestamps와 duplicate ids를 비교합니다."], "deep sequential browsing은 keyset으로 전환하고 random page가 필요하면 snapshot/materialized result 또는 bounded OFFSET을 사용합니다.", "pagination SLO에 depth·drift·duplicate rate와 전환 threshold를 둡니다.")],
    expertNotes: ["transaction snapshot을 오래 유지하면 undo/retention/resource 비용이 생겨 무한 scrolling 전체를 한 transaction으로 묶는 것도 정답이 아닙니다.", "search relevance score가 재계산되면 insert/delete가 없어도 order key update로 OFFSET과 keyset 모두 product-level snapshot 차이가 납니다."],
  },
  {
    id: "keyset-pagination-cursor",
    title: "마지막 sort tuple을 cursor로 전달해 keyset/seek pagination을 설계합니다",
    lead: "keyset은 몇 rows를 건너뛸지가 아니라 마지막으로 본 key보다 뒤에 있는 rows를 total order predicate로 찾습니다.",
    explanations: [
      "`ORDER BY score DESC, item_id DESC`에서 cursor `(90,3)` 뒤 조건은 `score < 90 OR (score = 90 AND item_id < 3)`입니다. direction이 섞이면 각 lexicographic branch를 정확히 생성해야 하며 tuple comparison 지원과 NULL semantics를 target DB에서 확인합니다.",
      "cursor는 filter, tenant/authorization scope, sort version, page size policy와 함께 cryptographically authenticated opaque token으로 encode합니다. raw SQL, unchecked column name, user-controlled direction을 cursor에서 직접 조립하지 않습니다.",
      "새로운 더 앞 row는 이미 발급된 cursor의 다음 page에 나타나지 않는 것이 keyset의 일반적 특성입니다. feed refresh에서 새 rows를 별도 알리고 backward navigation, jump-to-page, total count 요구를 product와 합의합니다.",
      "index는 equality filter prefix 뒤에 sort keys와 directions를 맞추고 필요한 projection을 고려합니다. generated predicate branch와 index range가 실제 SEARCH/INDEX RANGE SCAN을 만드는지 explain/actual rows로 확인합니다.",
    ],
    concepts: [c("keyset pagination", "마지막 row의 ordered key tuple 뒤 범위를 seek해 다음 N rows를 찾는 방식입니다.", ["deep offset을 피합니다.", "random page 번호에는 부적합합니다."]), c("opaque cursor", "client가 내부 sort key를 임의 수정하지 못하도록 version·scope·keys를 encode/authenticate한 token입니다.", ["SQL fragment가 아닙니다.", "expiry와 key rotation을 둡니다."])],
    codeExamples: [py(
      "sql05-keyset-composite",
      "DESC composite cursor와 상위 insert 이후 다음 page",
      "keyset_composite.py",
      "동점 score를 item_id로 나눈 cursor predicate가 page overlap 없이 다음 keys를 찾는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item (item_id INTEGER PRIMARY KEY, score INTEGER NOT NULL)")
db.executemany("INSERT INTO item VALUES (?, ?)", [(1, 100), (2, 90), (3, 90), (4, 80), (5, 70)])

page1 = list(db.execute("SELECT item_id, score FROM item ORDER BY score DESC, item_id DESC LIMIT 2"))
cursor = page1[-1]
db.execute("INSERT INTO item VALUES (?, ?)", (6, 95))
page2 = list(db.execute("SELECT item_id, score FROM item WHERE score < ? OR (score = ? AND item_id < ?) ORDER BY score DESC, item_id DESC LIMIT 2", (cursor[1], cursor[1], cursor[0])))
print("page1=" + ",".join(str(item_id) for item_id, _ in page1))
print(f"cursor={cursor[1]}:{cursor[0]}")
print("page2-after-insert=" + ",".join(str(item_id) for item_id, _ in page2))
print("overlap=" + str(bool({item_id for item_id, _ in page1} & {item_id for item_id, _ in page2})).lower())
print("newer-row-deferred=" + str(6 not in [item_id for item_id, _ in page2]).lower())`,
      "page1=1,3\ncursor=90:3\npage2-after-insert=2,4\noverlap=false\nnewer-row-deferred=true",
      ["mysql-select", "oracle-select", "sqlite-query-planner", "jdbc-resultset"],
    )],
    diagnostics: [d("ASC/DESC가 섞인 cursor에서 동점 일부가 영원히 나오지 않는다.", "lexicographic predicate의 comparison direction 또는 equality branch가 ORDER BY와 다릅니다.", ["order keys/directions과 cursor tuple을 표로 적습니다.", "boundary 전후 동점 fixtures를 실행합니다.", "generated SQL bind 순서와 plan range를 봅니다."], "ORDER BY specification에서 predicate와 index를 codegen하고 forward/backward golden sequence를 검증합니다.", "cursor property tests에 모든 direction·NULL bucket·tie cases를 포함합니다.")],
    expertNotes: ["cursor token에 PII나 tenant identifier를 평문으로 노출하지 않고 integrity·confidentiality 필요를 threat model로 결정합니다.", "cursor format을 versioning해 collation/order change 시 old token을 명시적으로 reject 또는 migrate합니다."],
  },
  {
    id: "counted-pagination-consistency",
    title: "filtered COUNT와 page query의 동일 scope·snapshot·rounding policy를 맞춥니다",
    lead: "totalPages는 `ceil(filteredCount/pageSize)`이지만 count와 rows가 다른 filter·tenant·시점을 보면 empty last page와 정보 노출이 생깁니다.",
    explanations: [
      "count query는 page query와 동일한 authorization, filters, joins, soft-delete, time boundary를 사용해야 합니다. copy-paste SQL 두 개의 drift를 막기 위해 shared predicate specification, CTE 또는 tested repository API를 사용합니다.",
      "count와 page rows 사이 mutation은 READ COMMITTED에서 서로 다른 snapshot을 볼 수 있습니다. strict consistency가 필요한 export/admin workflow는 suitable transaction/snapshot을 사용하고 일반 feed는 approximate/stale count 또는 `hasNext`를 선택할 수 있습니다.",
      "empty result에서는 totalPages를 0 또는 UI상 1로 보일지, out-of-range page를 empty/404/last page redirect로 처리할지 API contract로 정합니다. integer arithmetic `(count + size - 1) // size`는 positive bounded size 전제와 overflow를 검토합니다.",
      "count가 비싼 join/search에서는 exact count를 매 page마다 강제하지 않습니다. limited count, cached/materialized count, estimate, cursor `hasNext`를 사용자 decision에 맞춰 선택하고 staleness/accuracy metadata를 제공합니다.",
    ],
    concepts: [c("counted pagination", "page rows와 별도 filtered total count로 page 수와 위치를 제공하는 방식입니다.", ["동일 scope가 필수입니다.", "snapshot/staleness를 정의합니다."]), c("hasNext probe", "page size보다 한 row 더 읽거나 continuation 존재를 검사해 다음 page 여부만 반환하는 방식입니다.", ["exact total count를 피합니다.", "추가 row는 response에서 제외합니다."])],
    codeExamples: [py(
      "sql05-counted-pagination",
      "filtered count·ceil page 수·두 번째 page keys 검사",
      "counted_pagination.py",
      "동일 status predicate를 count와 page query에 적용해 totalPages와 ordered ids를 기록합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE task (task_id INTEGER PRIMARY KEY, status TEXT NOT NULL)")
db.executemany("INSERT INTO task VALUES (?, ?)", [(1, "open"), (2, "done"), (3, "open"), (4, "open"), (5, "done"), (6, "open"), (7, "open"), (8, "open"), (9, "open")])

size = 3
count = db.execute("SELECT count(*) FROM task WHERE status = 'open'").fetchone()[0]
pages = (count + size - 1) // size
page2 = [row[0] for row in db.execute("SELECT task_id FROM task WHERE status = 'open' ORDER BY task_id LIMIT ? OFFSET ?", (size, size))]
empty = db.execute("SELECT count(*) FROM (SELECT task_id FROM task WHERE status = 'missing' LIMIT 3)").fetchone()[0]
print("filtered-count=" + str(count))
print("page-size=" + str(size))
print("total-pages=" + str(pages))
print("page2=" + ",".join(map(str, page2)))
print("empty-page=" + str(empty))`,
      "filtered-count=7\npage-size=3\ntotal-pages=3\npage2=6,7,8\nempty-page=0",
      ["local-db-0203", "mysql-limit", "oracle-select", "sqlite-limit", "python-sqlite3", "jdbc-resultset"],
    )],
    diagnostics: [d("API totalCount는 120인데 마지막 page가 비거나 다른 tenant row count가 추론된다.", "count/page filter·authorization drift 또는 서로 다른 snapshot이 발생했습니다.", ["두 generated SQL과 binds를 canonical diff합니다.", "tenant/soft-delete/search scope를 확인합니다.", "transaction isolation과 request timeline을 봅니다."], "shared scoped predicate와 일관성 정책을 적용하고 exact count가 불필요하면 hasNext/approximate metadata로 바꿉니다.", "count/page parity tests와 cross-tenant noninterference tests를 둡니다.")],
    expertNotes: ["COUNT(*) 결과도 authorization 대상 정보이며 작은 filtered cohorts는 existence oracle이 될 수 있습니다.", "window COUNT(*) OVER()는 한 query snapshot을 주지만 empty page에서는 count row 자체가 없고 plan 비용도 별도 검토가 필요합니다."],
  },
  {
    id: "index-sort-distinct-plan",
    title: "DISTINCT·ORDER BY·LIMIT의 sort/hash/index plan과 memory·spill 비용을 측정합니다",
    lead: "문법이 같은 query도 composite index, selected width, cardinality와 statistics에 따라 index walk·filesort·hash aggregate·temp spill로 달라집니다.",
    explanations: [
      "filter equality prefix와 ORDER BY keys/directions를 맞춘 composite index는 sort를 피하고 LIMIT에서 early stop할 수 있습니다. 하지만 low-selectivity leading column, expression NULL bucket, mixed direction 지원, collation과 projection coverage를 target DB version에서 검증합니다.",
      "DISTINCT는 ordered index에서 adjacent duplicate elimination을 하거나 hash/sort를 사용할 수 있습니다. EXPLAIN label 하나보다 actual rows, temp bytes, spill, memory grant, elapsed distribution과 result correctness를 함께 봅니다.",
      "index를 page query마다 추가하면 write amplification, storage, cache pressure와 optimizer choice가 늘어납니다. representative workload에서 before/after plans와 insert/update cost를 비교하고 redundant prefix indexes를 inventory합니다.",
      "statistics drift, bind selectivity와 LIMIT 값에 따라 plan이 바뀔 수 있습니다. production-safe explain/trace, plan history와 canary를 사용하고 PII literal이 plan repository나 logs에 남지 않게 bind/redaction policy를 적용합니다.",
    ],
    concepts: [c("covering order index", "filter와 ordered keys 및 필요한 projection을 index만으로 공급할 수 있는 index입니다.", ["sort/lookup을 줄일 수 있습니다.", "write/storage 비용이 있습니다."]), c("spill", "sort/hash 작업이 memory budget을 넘어 temporary storage로 내려가는 현상입니다.", ["latency tail을 키웁니다.", "rows·width·memory를 관측합니다."])],
    diagnostics: [d("LIMIT 20인데도 전체 table sort와 temp spill이 발생한다.", "filter/order에 맞는 index가 없거나 expression/collation/projection이 index order 사용을 막았습니다.", ["EXPLAIN actual rows/sort/temp를 봅니다.", "index key order/direction/collation을 query와 비교합니다.", "selected columns와 table lookup 비용을 확인합니다."], "workload에 맞는 bounded composite index 또는 query shape를 적용하고 write/read tradeoff를 benchmark합니다.", "plan regression에 rows examined·spill bytes·p95와 result sequence를 함께 둡니다.")],
    expertNotes: ["MySQL filesort라는 이름은 반드시 disk file을 뜻하지 않으므로 status/trace metrics로 실제 spill을 확인합니다.", "Oracle/SQLite/MySQL explain terminology를 그대로 비교하지 말고 logical operations와 observed work로 mapping합니다."],
  },
  {
    id: "pagination-api-observability-security",
    title: "cursor validation·scope binding·rate limits·sequence telemetry로 pagination 운영을 닫습니다",
    lead: "정확한 SQL만으로는 forged cursor, unbounded page size, cross-tenant count, stale tokens와 duplicate incidents를 막을 수 없습니다.",
    explanations: [
      "request schema는 supported sort/filter allowlist, page size min/max, OFFSET depth max, cursor version/expiry를 검증합니다. column/direction을 user string으로 SQL에 interpolation하지 않고 typed mapping으로 query fragments를 선택합니다.",
      "cursor는 tenant/user authorization scope와 filter hash에 bind해 다른 query에서 replay하지 못하게 합니다. signing/encryption keys는 secret manager와 rotation을 사용하고 error response는 token 내부나 raw SQL을 노출하지 않습니다.",
      "telemetry는 route·sort version·page method·bounded depth/size·latency·rows examined·duplicate/missing detector를 기록하되 selected business ids, search terms와 raw cursor를 log하지 않습니다. cursor parse failures와 expiry는 bounded reason codes로 집계합니다.",
      "contract tests는 empty/single/exact-boundary/last/out-of-range, duplicate sort keys, NULLs, insert/delete/update, forward/backward, authorization change, collation/version upgrade를 포함합니다. evidence에는 exact ordered synthetic keys와 plan budget을 함께 남깁니다.",
    ],
    concepts: [c("cursor scope binding", "cursor가 발급된 authorization·filter·sort version 밖에서 재사용되지 않도록 context를 token integrity에 포함하는 설계입니다.", ["cross-tenant replay를 막습니다.", "raw cursor logging을 피합니다."]), c("pagination invariant", "page를 이어 읽을 때 order·scope·cursor·row overlap/coverage가 만족해야 하는 검증 조건입니다.", ["synthetic keys로 assertion합니다.", "mutation policy와 함께 정의합니다."])],
    diagnostics: [d("한 tenant에서 받은 cursor를 다른 tenant query에 붙였더니 row existence나 count가 노출된다.", "cursor integrity는 확인했지만 authorization/filter scope에 bind하지 않았습니다.", ["token claims와 query scope hash를 비교합니다.", "repository mandatory tenant predicate를 확인합니다.", "logs에 raw cursor/ids가 남았는지 조사합니다."], "cursor에 versioned scope digest와 expiry를 포함하고 매 요청 current authorization과 constant-time 검증 후 fail closed합니다.", "cross-scope replay negative tests·key rotation·privacy-safe audit를 둡니다.")],
    expertNotes: ["pagination consistency는 UX 선택이기도 하므로 duplicate-free, snapshot-exact, freshest-first 중 우선순위를 product SLO로 정합니다.", "API gateway cache key에 cursor/filter/sort/authorization variation이 빠지면 올바른 DB query도 다른 사용자의 page를 반환할 수 있습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0129", repository: "local dbstudy snapshot", path: "dbstudy/01_29.sql", usedFor: ["DISTINCT·ORDER BY progression"], evidence: "99 logical lines·6,349 bytes·SHA-256 15595B98D5FC2187DE0CCBBB0CEAF44D0AF87E03EE12CA263258CF7C6ED6B9C4; comments를 제외한 active SELECT39·DISTINCT1·ORDER BY4를 read-only로 계수했습니다." },
  { id: "local-db-0203", repository: "local dbstudy snapshot", path: "dbstudy/02_03.sql", usedFor: ["LIMIT/OFFSET·counted pagination progression"], evidence: "121 logical lines·4,913 bytes·SHA-256 07FA8F4DCDDBDE2C45B7011B3DB71F1255C2C448954D461D176A2E9BBB2060C5; active LIMIT4·OFFSET4·ORDER BY4·COUNT2를 read-only로 계수했습니다." },
  { id: "mysql-distinct", repository: "MySQL 8.4 Reference Manual", path: "DISTINCT Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/distinct-optimization.html", usedFor: ["DISTINCT behavior·optimization"], evidence: "MySQL 8.4 DISTINCT 공식 문서입니다." },
  { id: "mysql-order", repository: "MySQL 8.4 Reference Manual", path: "ORDER BY Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html", usedFor: ["ORDER BY·index·filesort"], evidence: "MySQL 8.4 ORDER BY 공식 문서입니다." },
  { id: "mysql-select", repository: "MySQL 8.4 Reference Manual", path: "SELECT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["SELECT·ORDER·LIMIT syntax"], evidence: "MySQL 8.4 SELECT 공식 문서입니다." },
  { id: "mysql-limit", repository: "MySQL 8.4 Reference Manual", path: "LIMIT Query Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html", usedFor: ["LIMIT early stop·order stability"], evidence: "MySQL 8.4 LIMIT 공식 문서입니다." },
  { id: "oracle-select", repository: "Oracle AI Database 26ai SQL Language Reference", path: "SELECT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["DISTINCT·order_by·row_limiting_clause portability"], evidence: "Oracle 26ai SELECT 공식 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["SQLite DISTINCT·ORDER BY exact examples"], evidence: "SQLite SELECT 공식 문서입니다." },
  { id: "sqlite-limit", repository: "SQLite Documentation", path: "SELECT LIMIT/OFFSET", publicUrl: "https://www.sqlite.org/lang_select.html#limitoffset", usedFor: ["SQLite LIMIT/OFFSET exact examples"], evidence: "SQLite LIMIT/OFFSET 공식 fragment입니다." },
  { id: "sqlite-query-planner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["keyset range·ordered index plan"], evidence: "SQLite query planner 공식 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Documentation", path: "sqlite3 — DB-API 2.0 interface", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["synthetic exact execution harness"], evidence: "Python sqlite3 공식 문서입니다." },
  { id: "jdbc-resultset", repository: "Java SE 21 API", path: "java.sql.ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["ordered row/cursor driver mapping"], evidence: "JDBC ResultSet 공식 API입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-05-distinct-order-limit", slug: "sql-05-distinct-order-limit", courseId: "database", moduleId: "db-query-foundations", order: 5,
  title: "DISTINCT·ORDER BY·LIMIT/OFFSET의 안정적인 결과", subtitle: "bag과 duplicate elimination에서 total order, NULL/tie-breaker, OFFSET drift, keyset cursor와 counted pagination 운영까지 연결합니다.", level: "기초", estimatedMinutes: 780,
  coreQuestion: "중복·동점·NULL·동시 변경이 있는 결과에서 어떤 rows가 어떤 순서와 page에 나타나는지 재현 가능하게 어떻게 정의하고 검증할까요?",
  summary: "authoritative inventory의 01_29.sql·02_03.sql을 read-only로 감사해 active DISTINCT1·ORDER BY4와 LIMIT4·OFFSET4·COUNT2 progression을 보존했습니다. SQL bag/tuple DISTINCT, aggregate·GROUP BY 경계, ORDER BY와 collation, total order와 explicit NULL placement, LIMIT top-N, OFFSET drift, composite keyset cursor, counted pagination consistency, sort/index/spill plan과 cursor security/observability를 독립 장으로 설명합니다. 다섯 Python sqlite3 예제는 duplicate/NULL 축약, 동점 total order, insert 뒤 OFFSET 중복·누락, keyset continuation과 filtered total pages를 exact stdout으로 실행합니다.",
  objectives: ["SQL bag과 DISTINCT projection tuple의 의미를 구분한다.", "DISTINCT·COUNT(DISTINCT)·GROUP BY의 result grain과 NULL 차이를 설명한다.", "ORDER BY 없는 결과가 순서를 보장하지 않는 이유를 plan과 연결한다.", "NULL·collation·unique tie-breaker를 포함한 total order를 설계한다.", "LIMIT top-N과 OFFSET deep-scan·mutation drift를 재현한다.", "복합 ASC/DESC keyset predicate와 opaque cursor scope를 설계한다.", "count/page scope·snapshot·empty/out-of-range 정책을 검증한다.", "index·sort/hash·spill·security telemetry로 pagination을 운영한다."],
  prerequisites: [{ title: "NULL과 3값 논리, IS NULL의 이유", reason: "DISTINCT의 NULL 축약과 ORDER BY NULL placement, nullable cursor predicate를 3값 논리와 구분해야 합니다.", sessionSlug: "sql-04-null-three-valued-logic" }],
  keywords: ["DISTINCT", "bag", "ORDER BY", "total order", "NULLS FIRST", "LIMIT", "OFFSET", "pagination drift", "keyset", "cursor", "COUNT", "top-N", "collation", "spill"], topics,
  lab: {
    title: "학습자료 목록 API를 OFFSET에서 scope-bound keyset pagination으로 전환하기",
    scenario: "동일 score·nullable publishedAt·concurrent publish/delete가 있는 multi-tenant 자료 목록이 deep page에서 느리고 중복됩니다. random-page 관리자 view와 sequential learner feed 요구를 분리해 안전하게 전환합니다.",
    setup: ["synthetic tenant·score·time·unique id fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 SQLite reference harness를 준비합니다.", "authorization/filter/order/null/page-size/count consistency contract를 작성합니다.", "OFFSET depth·rows examined·duplicate rate baseline을 수집합니다."],
    steps: ["result grain과 DISTINCT 필요 여부를 join key로 감사합니다.", "collation·NULL bucket·immutable unique key를 포함한 total order를 정합니다.", "OFFSET empty/boundary/deep/concurrent insert-delete fixtures를 실행합니다.", "ORDER BY와 같은 direction의 composite keyset predicate를 생성합니다.", "cursor에 version·tenant/filter/sort digest·expiry를 bind하고 forge/replay를 거부합니다.", "matching composite index 전후 explain/rows/spill/write cost를 비교합니다.", "counted 관리자 page와 hasNext learner feed의 snapshot/staleness 정책을 분리합니다.", "forward/backward·newer row notification·out-of-range UX를 검증합니다.", "p50/p95 depth/latency/rows examined와 privacy-safe cursor error metrics를 배포 gate에 연결합니다.", "old cursor expiry·key rotation·rollback read path를 rehearsal합니다."],
    expectedResult: ["모든 page가 explicit total order와 authorization scope를 유지합니다.", "same-key·NULL rows에서 overlap이 없고 mutation 정책이 문서와 일치합니다.", "deep sequential page는 offset scan 없이 index range seek를 사용합니다.", "count와 rows가 같은 filter/snapshot policy를 따르며 cross-tenant 정보가 노출되지 않습니다.", "synthetic ordered keys·plans·latency·cursor rejection evidence가 재현됩니다."],
    cleanup: ["isolated rows/indexes·temporary tokens와 test telemetry를 run id로 제거합니다.", "cursor signing test keys를 폐기하고 secrets/logs를 검사합니다.", "원본 SQL·production data는 변경하지 않습니다.", "raw cursor·search terms·business ids가 artifacts에 남지 않았는지 확인합니다."],
    extensions: ["search relevance score version과 cursor invalidation을 설계합니다.", "distributed shard merge에서 global total order와 per-shard cursor를 비교합니다.", "CDC/materialized snapshot 기반 random-page export를 설계합니다.", "property-based test로 arbitrary duplicate/NULL/mutation sequence를 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 bag·total order·OFFSET/keyset/count 불변식을 표로 만드세요.", requirements: ["python -I -X utf8 stdout을 완전 대조합니다.", "DISTINCT NULL 결과를 설명합니다.", "동점 tie-breaker를 제거한 반례를 만듭니다.", "insert 뒤 OFFSET duplicate/missing ids를 기록합니다.", "keyset predicate direction을 추적합니다.", "count/page filter를 대조합니다."], hints: ["row value, row position, page membership을 다른 열로 기록하세요."], expectedOutcome: "page 안정성을 문법이 아니라 ordered key sequence로 설명합니다.", solutionOutline: ["bag→order→boundary→mutation→cursor/count 순서입니다."] },
    { difficulty: "응용", prompt: "기존 page-number repository를 learner feed와 admin search 두 경로로 재설계하세요.", requirements: ["query grain과 DISTINCT를 감사합니다.", "unique total order와 NULL/collation policy를 둡니다.", "OFFSET 사용 허용 depth를 정의합니다.", "keyset cursor scope/expiry/version을 설계합니다.", "matching index와 write tradeoff를 검증합니다.", "count consistency/approximation을 명시합니다.", "cross-tenant negative tests를 둡니다.", "privacy-safe telemetry와 rollback을 포함합니다."], hints: ["모든 화면에 같은 pagination 방식이 필요하지 않습니다."], expectedOutcome: "UX와 consistency 요구에 맞는 두 pagination contract가 완성됩니다.", solutionOutline: ["요구→order→method→index→security→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 ordered-query와 pagination 표준을 작성하세요.", requirements: ["ORDER BY 없는 sequence assertion을 금지합니다.", "NULL/collation/tie-breaker total-order 규칙을 정의합니다.", "OFFSET/keyset/snapshot 선택표를 만듭니다.", "cursor integrity/scope/key rotation을 정의합니다.", "count/hasNext/approximate semantics를 정의합니다.", "plan/spill/write budget을 포함합니다.", "mutation·upgrade property tests를 요구합니다.", "privacy·authorization·incident runbook을 포함합니다."], hints: ["정확성·일관성·성능·UX를 한 지표로 합치지 마세요."], expectedOutcome: "DBMS와 API 경계를 아우르는 검증 가능한 pagination 표준이 완성됩니다.", solutionOutline: ["semantics→query→token→plan→telemetry/governance 순서입니다."] },
  ],
  nextSessions: ["sql-06-string-number-functions"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["dbstudy/01_29.sql: 99 logical lines·6,349 bytes·SHA-256 15595B98D5FC2187DE0CCBBB0CEAF44D0AF87E03EE12CA263258CF7C6ED6B9C4; active SELECT39·DISTINCT1·ORDER BY4를 read-only로 계수했습니다.", "dbstudy/02_03.sql: 121 logical lines·4,913 bytes·SHA-256 07FA8F4DCDDBDE2C45B7011B3DB71F1255C2C448954D461D176A2E9BBB2060C5; active LIMIT4·OFFSET4·ORDER BY4·COUNT2를 read-only로 계수했습니다.", "원본 sample 인물·주소·연락처·업무 값을 복제하지 않고 clause progression과 counts/hash만 provenance로 사용했습니다.", "원본에 없는 bag/NULL distinct, total order·collation, OFFSET mutation, keyset cursor·scope security, counted snapshot과 plan/spill 운영은 공식 문서와 synthetic exact examples로 보완했습니다.", "SQLite exact output은 MySQL 8.4·Oracle 26ai syntax·NULL order·optimizer behavior를 대신하지 않으므로 vendor contract matrix를 별도로 요구합니다."] },
});

export default session;
