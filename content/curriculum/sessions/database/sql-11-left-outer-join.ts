import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory schema와 0/1/many optional child·NULL payload rows를 합성합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "LEFT JOIN의 match·null extension·ON/WHERE·COUNT·anti join·pre-aggregation과 keyset query를 실행합니다." },
      { lines: "마지막 5줄", explanation: "보존된 parent keys·matched counts·stable booleans만 출력합니다. production literals·PII와 vendor-dependent plan text는 출력하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "실제 DB에서는 isolation·constraints·statistics·NULL ordering과 plan을 target version에서 검증합니다."] },
    experiments: [
      { change: "right table에 같은 parent key row를 하나 더 추가합니다.", prediction: "left preservation은 유지되지만 matching parent output은 한 행 더 fan-out됩니다.", result: "LEFT JOIN은 left를 최소 한 번 보존할 뿐 parent당 정확히 한 행을 보장하지 않습니다." },
      { change: "right-side filter를 ON과 WHERE 사이에서 옮깁니다.", prediction: "WHERE의 null-rejecting predicate는 unmatched rows를 제거해 accidental inner join을 만듭니다.", result: "match eligibility와 final row filter를 분리합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "left-preserved-relation-contract",
    title: "LEFT JOIN을 왼쪽 relation의 모든 rows를 최소 한 번 보존하는 operation으로 정의합니다",
    lead: "‘왼쪽 표 기준’이라는 암기에서 벗어나 matched pairs와 unmatched left row의 null-extended output을 합집합으로 검산합니다.",
    explanations: [
      "LEFT OUTER JOIN은 ON이 TRUE인 pairs를 만들고, match가 하나도 없는 left row마다 right columns가 NULL인 한 row를 추가합니다. left 한 행당 정확히 한 결과가 아니라 최소 한 결과라는 점이 핵심입니다.",
      "지정 원본 02_02.sql은 read-only 구조 계수에서 JOIN20 중 LEFT JOIN8, INNER JOIN12, IS NULL4를 포함합니다. sample literals와 원문 SQL은 복사하지 않고 optional relationship progression만 provenance로 사용합니다.",
      "result grain은 matched 때 left-right pair, unmatched 때 left-null placeholder입니다. right에 여러 matches가 있으면 left columns가 반복되므로 left entity 목록과 detail 목록을 같은 query shape로 취급하지 않습니다.",
      "LEFT JOIN의 left/right 선택은 보존 요구사항으로 결정합니다. 모든 customers를 보여야 하면 customer가 left이고, 모든 facts 보존이 목표면 fact가 left일 수 있습니다. query text 위치가 business primacy를 자동 의미하지 않습니다.",
      "검산은 left key set이 output에 모두 포함되는지, matched pair count와 unmatched count 합이 output count인지 확인합니다. left duplicate keys가 있다면 key constraint와 bag semantics를 먼저 기록합니다.",
    ],
    concepts: [
      c("preserved side", "outer join에서 match 유무와 상관없이 source rows가 output에 남는 relation side입니다.", ["LEFT JOIN에서는 left입니다.", "row당 최소 한 output을 보장합니다."]),
      c("null extension", "unmatched preserved row를 표현하기 위해 non-preserved side columns를 NULL로 채운 output row입니다.", ["stored NULL과 provenance가 다릅니다.", "right key NULL 여부로 match를 구분합니다."]),
    ],
    codeExamples: [py(
      "sql11-preserve-unmatched",
      "0/1/2 child에서 모든 parent 보존 확인",
      "left_preserve_rows.py",
      "세 parents 중 하나가 unmatched여도 결과에 남고 multi-child parent는 두 rows로 반복되는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE parent(parent_id INTEGER PRIMARY KEY); CREATE TABLE child(child_id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL);")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?)", [(11, 1), (21, 2), (22, 2)])

rows = list(db.execute("SELECT p.parent_id, c.child_id FROM parent AS p LEFT JOIN child AS c ON c.parent_id=p.parent_id ORDER BY p.parent_id, c.child_id"))
matched = sum(child is not None for _, child in rows)
unmatched = [parent for parent, child in rows if child is None]
print("left=1,2,3")
print("rows=" + ",".join(f"{parent}:{'NULL' if child is None else child}" for parent, child in rows))
print("output-count=" + str(len(rows)))
print("matched=" + str(matched))
print("unmatched=" + ",".join(map(str, unmatched)))`,
      "left=1,2,3\nrows=1:11,2:21,2:22,3:NULL\noutput-count=4\nmatched=3\nunmatched=3",
      ["local-db-0202", "sqlite-select", "postgres-table-expressions", "mysql-join", "oracle-joins"],
    )],
    diagnostics: [
      d("LEFT JOIN인데 output rows가 left rows보다 많다.", "preservation을 one-row-per-left guarantee로 오해했고 right에 multiple matches가 있습니다.", ["left key별 right count를 측정합니다.", "expected result grain을 확인합니다.", "right uniqueness constraint를 봅니다."], "detail이면 fan-out을 문서화하고 left grain이면 pre-aggregate/select-one/semi join으로 query shape를 바꿉니다.", "0/1/many match fixtures와 max multiplicity assertion을 둡니다."),
    ],
    expertNotes: ["left input 자체에 duplicate keys가 있으면 outer join이 이를 제거하지 않습니다.", "FULL OUTER JOIN이 필요한 양쪽 orphan reconciliation은 vendor support와 emulation semantics를 별도 검토합니다."],
  },
  {
    id: "match-provenance-stored-null",
    title: "null-extended NULL과 실제 matched row의 stored NULL을 right non-null key로 구분합니다",
    lead: "right payload가 NULL이라는 이유만으로 unmatched라고 판단하면 존재하는 child를 누락시킵니다.",
    explanations: [
      "unmatched left row에서는 모든 right projected columns가 NULL입니다. 그러나 matched right row의 nullable note/status/date도 NULL일 수 있어 payload 하나만으로 match provenance를 판정할 수 없습니다.",
      "right primary key 또는 ON match에서 반드시 non-NULL인 constrained column을 projection해 `right_id IS NULL`로 unmatched를 식별합니다. composite key면 appropriate non-null component 또는 explicit matched marker를 사용합니다.",
      "COALESCE(payload, '없음')은 presentation label일 뿐 stored NULL과 unmatched를 합칠 수 있습니다. API에는 matched boolean/reason과 nullable payload를 별도 fields로 모델링합니다.",
      "schema가 right key NULL을 허용하거나 derived query가 key를 잃으면 provenance marker를 query block에서 명시적으로 만듭니다. `CASE WHEN right_key IS NULL THEN 0 ELSE 1 END`도 key invariant가 증명되어야 합니다.",
      "telemetry와 report는 unmatched relationship, matched-but-missing-data, redacted와 not-applicable reasons를 분리해 data quality owner가 행동할 수 있게 합니다.",
    ],
    concepts: [
      c("match provenance", "outer join output row가 actual right match에서 왔는지 null extension에서 왔는지 나타내는 정보입니다.", ["non-null right key로 판단합니다.", "nullable payload와 분리합니다."]),
      c("stored NULL", "실제 base/derived row의 column value가 NULL인 상태입니다.", ["unmatched null extension과 다릅니다.", "reason/domain policy가 필요합니다."]),
    ],
    diagnostics: [
      d("note가 NULL인 실제 child가 ‘child 없음’으로 표시된다.", "nullable payload column으로 match 여부를 판정했습니다.", ["right PK/UNIQUE nullability를 확인합니다.", "matched row with NULL payload fixture를 실행합니다.", "API가 matched flag를 갖는지 봅니다."], "match는 non-null right key로 판단하고 nullable payload와 unmatched label을 분리합니다.", "matched-null/unmatched/non-null 세 fixtures를 contract test에 둡니다."),
    ],
    expertNotes: ["derived tables에서 aggregate가 NULL을 반환하는 경우 row existence와 aggregate no-value를 또 분리합니다.", "privacy redaction NULL을 relationship absence로 해석하지 않습니다."],
  },
  {
    id: "right-filter-on-versus-where",
    title: "right-side match filter는 ON에 두고 WHERE의 null-rejection을 의도적으로 결정합니다",
    lead: "active child만 연결하면서 child 없는 left도 보존하려면 `ON ... AND child.active=1`이 필요합니다.",
    explanations: [
      "`LEFT JOIN child ON key AND child.status='ACTIVE'`는 active child만 match시키고 없는 left는 null-extended로 보존합니다. 같은 status predicate를 WHERE에 두면 NULL rows가 UNKNOWN이 되어 제거됩니다.",
      "WHERE에서 `status='ACTIVE' OR child_id IS NULL`로 보존을 흉내 낼 수 있지만 inactive child만 있는 left의 semantics를 주의해야 합니다. ON filter가 ‘eligible match 없음’을 명확히 표현합니다.",
      "base left filters(tenant, created range)는 WHERE에 둡니다. relationship validity·right effective time/status는 ON에 두는 convention이 review와 optional chain에서 유리합니다.",
      "predicate pushdown/reorder는 optimizer가 semantics를 보존하는 범위에서 수행합니다. SQL text 위치와 physical evaluation timing을 혼동하지 않고 result counterexamples와 plan을 모두 봅니다.",
      "right filter가 authorization 정책이면 ON 위치만으로 충분하다고 가정하지 않습니다. policy가 모든 access paths와 nested queries에 강제되는지 negative tests로 증명합니다.",
    ],
    concepts: [
      c("match eligibility", "right row가 left와 outer-join match를 형성할 추가 status/time/scope 조건입니다.", ["ON에 둡니다.", "eligible match가 없으면 left는 보존됩니다."]),
      c("accidental inner join", "outer join 뒤 WHERE가 null-extended rows를 제거해 사실상 inner join 결과가 되는 오류입니다.", ["right-side null-rejecting predicate가 원인입니다.", "unmatched fixture로 탐지합니다."]),
    ],
    codeExamples: [py(
      "sql11-on-where-filter",
      "active filter를 ON과 WHERE에 둔 결과 비교",
      "left_filter_placement.py",
      "active child가 없는 parents가 ON filter에서는 보존되고 WHERE filter에서는 제거되는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE parent(parent_id INTEGER PRIMARY KEY); CREATE TABLE child(child_id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL, status TEXT NOT NULL);")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?, ?)", [(11, 1, "ACTIVE"), (21, 2, "INACTIVE")])

on_rows = list(db.execute("SELECT p.parent_id, c.child_id FROM parent AS p LEFT JOIN child AS c ON c.parent_id=p.parent_id AND c.status='ACTIVE' ORDER BY p.parent_id"))
where_rows = list(db.execute("SELECT p.parent_id, c.child_id FROM parent AS p LEFT JOIN child AS c ON c.parent_id=p.parent_id WHERE c.status='ACTIVE' ORDER BY p.parent_id"))
fmt = lambda rows: ",".join(f"{parent}:{'NULL' if child is None else child}" for parent, child in rows)
print("on=" + fmt(on_rows))
print("on-count=" + str(len(on_rows)))
print("where=" + fmt(where_rows))
print("where-count=" + str(len(where_rows)))
print("preserved=" + str(len(on_rows) == 3).lower())`,
      "on=1:11,2:NULL,3:NULL\non-count=3\nwhere=1:11\nwhere-count=1\npreserved=true",
      ["local-db-0202", "sqlite-select", "postgres-table-expressions", "mysql-join", "oracle-joins"],
    )],
    diagnostics: [
      d("LEFT JOIN을 썼지만 child 없는 parent가 검색 결과에서 사라진다.", "right-side filter가 WHERE에서 null-extended rows를 거부했습니다.", ["predicate가 참조하는 alias를 분류합니다.", "ON version과 WHERE version을 unmatched fixture로 비교합니다.", "inactive-only와 no-child를 구분합니다."], "eligible right match filter를 ON으로 옮기고 final WHERE는 preserved-side 요구에 맞춥니다.", "active/inactive/no-child 세 상태의 expected parents를 자동화합니다."),
    ],
    expertNotes: ["right filter를 ON으로 옮기는 것이 모든 outer join bug의 답은 아니며 최종 population 요구를 먼저 정의합니다.", "temporal validity는 half-open interval과 query as-of time을 ON contract에 포함합니다."],
  },
  {
    id: "outer-aggregate-count-null",
    title: "LEFT JOIN 집계에서 COUNT(*)와 COUNT(right_key)를 분리합니다",
    lead: "unmatched parent도 null-extended row 한 개를 가지므로 COUNT(*)는 child가 0이어도 1이 됩니다.",
    explanations: [
      "parent별 child count는 `COUNT(child.child_id)`처럼 matched right row에서 non-NULL인 key를 세야 합니다. COUNT(*)는 output rows를 세어 unmatched group도 1입니다.",
      "SUM/AVG of right measure는 no match와 all-matched-values-NULL에서 둘 다 NULL일 수 있습니다. matched count·known-value count·sum을 함께 보고 presentation COALESCE를 늦춥니다.",
      "right filter는 ON에 두어 eligible child count가 0인 parent도 group으로 보존합니다. WHERE right status를 사용하면 zero groups 자체가 사라집니다.",
      "multiple independent child tables를 raw left join한 뒤 aggregate하면 measures가 곱으로 증식합니다. 각 child를 parent grain으로 pre-aggregate하고 summaries를 left join합니다.",
      "GROUP BY parent key와 projected attributes의 functional dependency를 constraints로 증명합니다. vendor strict grouping mode와 dimension history를 확인합니다.",
    ],
    concepts: [
      c("outer row count", "LEFT JOIN 후 null-extended rows까지 포함한 COUNT(*) 값입니다.", ["0-child parent에서도 1입니다.", "child entity count와 다릅니다."]),
      c("matched child count", "non-NULL right key를 세어 actual matched rows만 측정한 count입니다.", ["COUNT(right_pk)를 사용합니다.", "eligible filter를 ON에 둡니다."]),
    ],
    codeExamples: [py(
      "sql11-count-star-key",
      "COUNT(*)와 COUNT(child_id)의 0-child 차이",
      "left_join_counts.py",
      "0/1/2 child parents에서 output row count와 matched child count가 어떻게 다른지 exact 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE parent(parent_id INTEGER PRIMARY KEY); CREATE TABLE child(child_id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL, amount INTEGER);")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?, ?)", [(11, 1, 10), (12, 1, None), (21, 2, 20)])

rows = list(db.execute("SELECT p.parent_id, COUNT(*) AS output_rows, COUNT(c.child_id) AS matched, COUNT(c.amount) AS known_amounts, SUM(c.amount) FROM parent AS p LEFT JOIN child AS c ON c.parent_id=p.parent_id GROUP BY p.parent_id ORDER BY p.parent_id"))
for parent, output_rows, matched, known, total in rows:
    print(f"p{parent}=rows:{output_rows},matched:{matched},known:{known},sum:{'NULL' if total is None else total}")
print("parents=" + str(len(rows)))
print("zero-child=" + str(rows[-1][2]))`,
      "p1=rows:2,matched:2,known:1,sum:10\np2=rows:1,matched:1,known:1,sum:20\np3=rows:1,matched:0,known:0,sum:NULL\nparents=3\nzero-child=0",
      ["sqlite-select", "postgres-table-expressions", "postgres-constraints", "mysql-join"],
    )],
    diagnostics: [
      d("child가 없는 parent의 child_count가 1로 나온다.", "LEFT JOIN output에 존재하는 null-extended row를 COUNT(*)로 셌습니다.", ["COUNT(*)와 COUNT(right_pk)를 나란히 출력합니다.", "right key nullability를 확인합니다.", "ON filter와 group preservation을 봅니다."], "matched child count에는 COUNT(non-null right key)를 사용하고 output row count와 이름을 분리합니다.", "0/1/many child와 all-null measure fixtures를 둡니다."),
    ],
    expertNotes: ["COUNT(DISTINCT right_id)는 fan-out을 숨길 수 있으므로 먼저 join graph를 고칩니다.", "zero와 no-data NULL의 UI 표시는 raw measures와 별도 presentation contract로 관리합니다."],
  },
  {
    id: "single-child-selection-preaggregation",
    title: "여러 right rows 중 하나를 선택하거나 요약할 때 deterministic rule을 먼저 정의합니다",
    lead: "‘최신 상태 하나’는 LEFT JOIN만으로 해결되지 않으며 order·tie-breaker와 parent당 최대 한 row proof가 필요합니다.",
    explanations: [
      "status history에서 최신 row를 선택하려면 changed_at DESC와 unique tie-breaker를 사용합니다. MAX(timestamp)만 join하면 동률 rows가 여러 개 match할 수 있습니다.",
      "ROW_NUMBER() OVER (PARTITION BY parent ORDER BY changed_at DESC, status_id DESC)=1 또는 correlated/lateral top-one pattern을 vendor와 indexes에 맞게 사용합니다. output parent당 최대 한 row를 assertion합니다.",
      "합계/count/list가 목적이면 right를 parent grain으로 GROUP BY/pre-aggregate한 뒤 LEFT JOIN합니다. raw history와 tags처럼 independent children을 동시에 join하지 않습니다.",
      "pre-aggregation filter가 base child population을 바꾸는지 확인합니다. active-only count, all-time latest, as-of latest는 서로 다른 query contracts입니다.",
      "materialized current-state table은 빠르지만 event history와 idempotent update·rebuild reconciliation이 필요합니다. stale projection과 source truth를 구분합니다.",
    ],
    concepts: [
      c("deterministic top-one", "group별 정렬 규칙과 unique tie-breaker로 정확히 한 row를 선택하는 operation입니다.", ["ROW_NUMBER/lateral query를 사용합니다.", "동률 fixture를 검증합니다."]),
      c("pre-aggregation", "many-side rows를 parent key별 한 summary row로 줄인 뒤 join하는 방식입니다.", ["independent fan-out을 막습니다.", "summary grain과 filter를 명시합니다."]),
    ],
    diagnostics: [
      d("최신 timestamp를 join했는데 같은 parent가 두 번 나온다.", "maximum timestamp가 동률인데 unique tie-breaker가 없습니다.", ["parent별 max-time row count를 봅니다.", "candidate order columns와 uniqueness를 확인합니다.", "ROW_NUMBER 결과를 비교합니다."], "timestamp 뒤 stable unique id를 정렬 tie-breaker로 사용해 rn=1만 join합니다.", "same-timestamp fixtures와 parent당 output<=1 assertion을 둡니다."),
    ],
    expertNotes: ["latest by ingestion time과 business effective time은 다를 수 있습니다.", "pre-aggregated JSON/list는 deterministic element order와 size limit을 명시합니다."],
  },
  {
    id: "anti-join-null-marker",
    title: "미매칭 parent는 right non-null key IS NULL 또는 NOT EXISTS로 찾습니다",
    lead: "nullable payload IS NULL은 matched-null과 unmatched를 동시에 선택해 anti-join 결과를 오염시킵니다.",
    explanations: [
      "`LEFT JOIN child ... WHERE child.child_id IS NULL`은 child_id가 non-NULL key라는 proof 아래 anti-join입니다. 더 직접적인 `WHERE NOT EXISTS (...)`는 right columns를 projection하지 않는 intent를 표현합니다.",
      "nullable note/status/date를 IS NULL로 검사하면 실제 matching child의 NULL payload도 포함됩니다. match provenance와 business NULL search를 분리합니다.",
      "NOT IN subquery에 NULL이 있으면 left value comparisons가 UNKNOWN이 되어 예상과 달리 rows가 사라질 수 있습니다. nullable source에는 NOT EXISTS를 기본으로 합니다.",
      "anti join predicate에는 tenant·effective status·authorization scope를 complete하게 포함합니다. ‘아무 child 없음’과 ‘eligible active child 없음’은 다른 질문입니다.",
      "orphan 탐지 report는 concurrent insert/delete snapshot과 FK enforcement state를 기록합니다. repair 전에 source-of-truth와 race를 확인합니다.",
    ],
    concepts: [
      c("anti join", "right match가 존재하지 않는 left rows만 보존하는 operation입니다.", ["NOT EXISTS가 명시적입니다.", "LEFT JOIN+non-null key IS NULL로도 표현됩니다."]),
      c("anti marker", "LEFT anti join에서 unmatched를 판정하는 right-side non-null constrained column입니다.", ["보통 primary key입니다.", "nullable payload를 사용하지 않습니다."]),
    ],
    codeExamples: [py(
      "sql11-anti-marker",
      "nullable payload와 primary-key anti marker 비교",
      "left_anti_join.py",
      "matched note NULL row가 payload 검사에는 섞이지만 right key/NOT EXISTS에는 포함되지 않는지 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE parent(parent_id INTEGER PRIMARY KEY); CREATE TABLE child(child_id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL, note TEXT);")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?, ?)", [(11, 1, None), (21, 2, "known")])

wrong = [row[0] for row in db.execute("SELECT p.parent_id FROM parent AS p LEFT JOIN child AS c ON c.parent_id=p.parent_id WHERE c.note IS NULL ORDER BY p.parent_id")]
key_marker = [row[0] for row in db.execute("SELECT p.parent_id FROM parent AS p LEFT JOIN child AS c ON c.parent_id=p.parent_id WHERE c.child_id IS NULL ORDER BY p.parent_id")]
not_exists = [row[0] for row in db.execute("SELECT p.parent_id FROM parent AS p WHERE NOT EXISTS (SELECT 1 FROM child AS c WHERE c.parent_id=p.parent_id) ORDER BY p.parent_id")]
print("payload-null=" + ",".join(map(str, wrong)))
print("key-null=" + ",".join(map(str, key_marker)))
print("not-exists=" + ",".join(map(str, not_exists)))
print("equivalent=" + str(key_marker == not_exists).lower())
print("false-positive=" + str(1 in wrong and 1 not in not_exists).lower())`,
      "payload-null=1,3\nkey-null=3\nnot-exists=3\nequivalent=true\nfalse-positive=true",
      ["local-db-0202", "sqlite-select", "postgres-table-expressions", "postgres-constraints"],
    )],
    diagnostics: [
      d("child 없음 report에 note만 NULL인 실제 child parent가 포함된다.", "nullable payload를 anti marker로 사용했습니다.", ["right PK가 NULL인지 payload가 NULL인지 분리합니다.", "NOT EXISTS 결과와 비교합니다.", "ON predicate scope를 확인합니다."], "right non-null key IS NULL 또는 complete correlated NOT EXISTS를 사용합니다.", "matched-null/matched-value/unmatched fixtures를 anti-join test에 둡니다."),
    ],
    expertNotes: ["optimizer가 두 anti forms를 다르게 계획할 수 있으므로 result equivalence 뒤 representative plan을 비교합니다.", "absence 자체가 민감한 정보일 수 있어 report authorization와 minimum disclosure를 검토합니다."],
  },
  {
    id: "outer-join-chain-optionality",
    title: "여러 LEFT JOIN chain에서 어느 단계가 optional인지 괄호와 predicates로 고정합니다",
    lead: "A LEFT JOIN B LEFT JOIN C에서 C가 B에 종속될 때 C filter 하나가 A 보존까지 깨뜨릴 수 있습니다.",
    explanations: [
      "join operations는 table expression을 만들며 associativity를 무조건 가정할 수 없습니다. `(A LEFT JOIN B ON ...) LEFT JOIN C ON C.b_id=B.id`의 null-extended B에서는 C도 match하지 않습니다.",
      "C condition을 WHERE에 두면 A-without-B와 B-without-C를 모두 제거할 수 있습니다. optionality마다 ON clause와 expected states를 truth table로 만듭니다.",
      "B가 없지만 C가 A에 직접 연결될 수 있다면 join edge를 C.a_id=A.id로 설계해야 합니다. alias convenience로 wrong intermediate key를 선택하지 않습니다.",
      "inner join을 outer chain 안에 섞을 때 괄호/derived table로 intended preserved set을 명확히 합니다. optimizer rewrite가 semantic equivalence를 유지하는지 vendor docs와 counterexamples로 확인합니다.",
      "debugging은 A count→A-B result→A-B-C result를 CTE/query blocks로 단계화하고 key별 multiplicity/unmatched counts를 기록합니다.",
    ],
    concepts: [
      c("optionality chain", "여러 relationships에서 각 right side가 없을 수 있는 상태 조합과 preservation contract입니다.", ["단계별 ON과 NULL provenance가 필요합니다.", "WHERE null-rejection을 검사합니다."]),
      c("outer join associativity boundary", "outer join grouping을 바꾸면 unmatched preservation 결과가 달라질 수 있는 성질입니다.", ["괄호/derived relation으로 intent를 표시합니다.", "inner join처럼 자유롭게 재배열하지 않습니다."]),
    ],
    diagnostics: [
      d("세 번째 table filter를 추가하자 첫 table의 unmatched rows까지 사라진다.", "optional C predicate를 WHERE에 두거나 join grouping을 바꿨습니다.", ["A-only/A+B/A+B+C state fixtures를 실행합니다.", "predicate aliases와 null truth를 봅니다.", "join parentheses/derived blocks를 확인합니다."], "C match eligibility를 해당 ON에 두고 required final state만 WHERE에서 명시합니다.", "optionality state matrix와 단계별 preserved-key assertions를 둡니다."),
    ],
    expertNotes: ["ORM eager loading이 만드는 outer-join chain도 generated SQL과 result grain을 직접 검토합니다.", "optional chain이 길면 separate batched queries가 correctness·pagination·maintainability에 더 나을 수 있습니다."],
  },
  {
    id: "outer-index-plan-estimates",
    title: "outer join constraints·indexes·EXPLAIN에서 preserved order와 cardinality를 검증합니다",
    lead: "optimizer가 outer semantics를 보존하며 선택한 search loops와 right multiplicity estimates를 representative data에서 읽습니다.",
    explanations: [
      "right lookup index는 complete join key와 ON status/effective predicates를 지원해야 합니다. left filters/order index와 right lookup index의 역할을 분리합니다.",
      "right UNIQUE는 parent당 최대 한 match proof가 되고 non-unique FK index는 many relationship access만 개선합니다. nullable unique·partial index semantics는 vendor별로 확인합니다.",
      "EXPLAIN에서 left scan/search, right lookup, estimated/actual matches per left, join filter와 temp sort를 봅니다. outer join simplification이 null-rejecting WHERE 때문에 inner로 변한 것은 query bug 신호일 수 있습니다.",
      "statistics가 right zero-heavy/skew distribution을 표현하지 못하면 join order와 algorithm estimates가 틀립니다. extended statistics/vendor capabilities와 hot/cold keys를 검토합니다.",
      "index build/constraint validation은 production locks·write amplification·replica lag를 만들 수 있어 online rollout, cancellation, rollback과 readback을 계획합니다.",
    ],
    concepts: [
      c("outer join simplification", "predicates가 unmatched rows를 제거함을 optimizer가 증명해 outer join을 inner join으로 바꾸는 rewrite입니다.", ["semantic equivalent일 수 있습니다.", "의도하지 않은 WHERE filter를 드러낼 수 있습니다."]),
      c("matches-per-left estimate", "preserved left row 하나당 예상 right matches 수입니다.", ["zero-heavy와 skew를 반영해야 합니다.", "memory/loops/cardinality를 좌우합니다."]),
    ],
    diagnostics: [
      d("right index를 추가했는데 LEFT JOIN report가 여전히 느리다.", "left population이 너무 크거나 right fan-out/skew·sort·projection width가 병목입니다.", ["actual left rows와 right loops/matches를 봅니다.", "temp sort/heap fetch/unused columns를 확인합니다.", "zero-heavy/hot-key distribution을 측정합니다."], "left filter/grain을 줄이고 right pre-aggregation/index/statistics와 report architecture를 조정합니다.", "representative zero/one/skew growth benchmark와 plan budgets를 둡니다."),
    ],
    expertNotes: ["EXPLAIN ANALYZE가 실제 query를 실행하므로 writes와 expensive reports는 isolated 환경에서 사용합니다.", "outer join hints는 semantics proof 뒤에도 upgrade/data drift lifecycle을 가진 last resort입니다."],
  },
  {
    id: "latest-summary-plan-keyset",
    title: "pre-aggregated optional data와 deterministic latest row를 parent grain으로 결합합니다",
    lead: "history와 tags를 raw outer join해 곱하지 않고 각 many-side를 한 parent row로 줄인 뒤 stable pagination합니다.",
    explanations: [
      "independent status history와 tags를 account에 동시에 left join하면 per-account rows가 status_count×tag_count로 늘어납니다. 각 source를 필요한 grain으로 먼저 요약합니다.",
      "latest status는 ROW_NUMBER with unique tie-breaker, tag count는 GROUP BY account_id처럼 서로 다른 reduction rule을 사용합니다. summary row key uniqueness를 query와 assertion으로 검증합니다.",
      "derived summaries의 absent row는 outer join 뒤 NULL이고 zero count presentation은 COALESCE할 수 있습니다. latest status absence와 count zero를 같은 domain value로 합치지 않습니다.",
      "supporting index는 status(account_id, changed_at DESC, status_id DESC), tag(account_id)처럼 partition/order/probe를 맞춥니다. SQLite/PostgreSQL/MySQL/Oracle syntax와 descending/null ordering을 확인합니다.",
      "parent page를 먼저 stable keyset으로 고르고 summaries를 결합하면 child fan-out이 page boundary를 깨지 않습니다. count/page/detail은 같은 snapshot 또는 versioned extract를 사용합니다.",
    ],
    concepts: [
      c("independent fan-out", "한 parent에 연결된 서로 다른 many relations를 동시에 join해 multiplicities가 곱해지는 현상입니다.", ["각 child를 parent grain으로 pre-aggregate합니다.", "source totals와 reconciliation합니다."]),
      c("parent-first pagination", "parent keys를 stable order로 먼저 page한 뒤 optional details/summaries를 join하는 방식입니다.", ["page grain을 보존합니다.", "snapshot과 token을 명시합니다."]),
    ],
    codeExamples: [py(
      "sql11-preaggregate-latest-page",
      "independent fan-out과 parent-grain latest/count/page 교정",
      "left_preaggregate_page.py",
      "raw history×tag join rows와 one-row-per-parent summaries, keyset page 및 index 존재를 exact 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE account(account_id INTEGER PRIMARY KEY); CREATE TABLE status_log(status_id INTEGER PRIMARY KEY, account_id INTEGER, changed_at INTEGER, state TEXT); CREATE TABLE tag(tag_id INTEGER PRIMARY KEY, account_id INTEGER); CREATE INDEX idx_status_account_time ON status_log(account_id, changed_at DESC, status_id DESC);")
db.executemany("INSERT INTO account VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO status_log VALUES (?, ?, ?, ?)", [(11, 1, 1, "OLD"), (12, 1, 2, "NEW"), (21, 2, 1, "ONLY")])
db.executemany("INSERT INTO tag VALUES (?, ?)", [(101, 1), (102, 1)])

raw_count = db.execute("SELECT COUNT(*) FROM account AS a LEFT JOIN status_log AS s ON s.account_id=a.account_id LEFT JOIN tag AS t ON t.account_id=a.account_id").fetchone()[0]
summary = list(db.execute("WITH ranked AS (SELECT account_id, state, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY changed_at DESC, status_id DESC) AS rn FROM status_log), tag_count AS (SELECT account_id, COUNT(*) AS n FROM tag GROUP BY account_id) SELECT a.account_id, r.state, COALESCE(t.n,0) FROM account AS a LEFT JOIN ranked AS r ON r.account_id=a.account_id AND r.rn=1 LEFT JOIN tag_count AS t ON t.account_id=a.account_id ORDER BY a.account_id"))
plan = [row[3] for row in db.execute("EXPLAIN QUERY PLAN SELECT * FROM status_log WHERE account_id=? ORDER BY changed_at DESC, status_id DESC LIMIT 1", (1,))]
page = [row[0] for row in db.execute("SELECT account_id FROM account WHERE account_id>? ORDER BY account_id LIMIT 2", (1,))]
print("raw-rows=" + str(raw_count))
print("summary=" + ",".join(f"{account}:{state or 'NULL'}:{tags}" for account, state, tags in summary))
print("summary-rows=" + str(len(summary)))
print("latest-index=" + str(any("idx_status_account_time" in detail for detail in plan)).lower())
print("page=" + ",".join(map(str, page)))`,
      "raw-rows=6\nsummary=1:NEW:2,2:ONLY:0,3:NULL:0\nsummary-rows=3\nlatest-index=true\npage=2,3",
      ["sqlite-window", "sqlite-eqp", "sqlite-transaction", "postgres-indexes", "postgres-explain", "postgres-transaction", "postgres-limit", "mysql-explain"],
    )],
    diagnostics: [
      d("parent page size를 20으로 요청했는데 history/tags join 뒤 20보다 적은 entities가 보인다.", "pair rows에 LIMIT/OFFSET을 적용한 뒤 UI/ORM이 duplicate parents를 합쳤습니다.", ["SQL rows와 unique parent count를 비교합니다.", "independent child multiplicities를 봅니다.", "pagination subquery grain을 확인합니다."], "parent keys를 먼저 stable paginate하고 latest/pre-aggregated child summaries를 join합니다.", "0/1/many independent children에서 page unique parents와 token continuity를 검증합니다."),
    ],
    expertNotes: ["window-function tie-breaker는 immutable unique id와 business ordering을 함께 사용합니다.", "parent-first follow-up queries는 N+1이 되지 않도록 bounded batch와 same-snapshot/version strategy를 사용합니다."],
  },
  {
    id: "outer-snapshot-report-operations",
    title: "LEFT JOIN report를 snapshot·pagination·reconciliation·privacy-safe telemetry로 운영합니다",
    lead: "unmatched 상태가 concurrent change로 이동할 수 있으므로 count·pages·export가 어느 visibility point를 나타내는지 기록합니다.",
    explanations: [
      "parent count, matched/unmatched counts, pages와 details가 same logical snapshot을 요구하는지 정의합니다. child가 중간에 insert되면 한 parent가 unmatched page와 matched page에 모두 나타날 수 있습니다.",
      "MVCC/isolation semantics는 DBMS별로 다르고 긴 read transaction은 vacuum/undo/replica resources를 유지합니다. bounded export transaction, replica snapshot 또는 materialized extract를 SLO와 비교합니다.",
      "stable order는 unique parent key와 explicit NULL/collation order를 포함합니다. keyset token에는 query version, filters, sort directions, last key와 expiry/integrity를 포함하고 raw sensitive values 노출을 피합니다.",
      "reconciliation은 left source count, matched left distinct count, unmatched count, pair output count와 right orphan count를 분리합니다. `matched+unmatched=left`는 distinct left grain에서 확인합니다.",
      "telemetry에는 report/version, bounded input/output/matched/unmatched/fan-out buckets, duration/plan hash/snapshot age를 남깁니다. names/emails/raw notes와 high-cardinality ids를 labels/logs에 넣지 않습니다.",
      "partial export·timeout·failover에는 idempotent run id, cancellation, temp artifact cleanup, completed marker와 retry/reconciliation이 필요합니다. outdated unmatched list로 destructive repair를 자동 실행하지 않습니다.",
    ],
    concepts: [
      c("unmatched snapshot", "특정 visibility point에서 eligible right match가 없다는 시간 의존 상태입니다.", ["영구 orphan과 다를 수 있습니다.", "snapshot/version metadata가 필요합니다."]),
      c("outer reconciliation", "left entities를 matched/unmatched로 분할하고 pair fan-out·right orphans를 별도 검증하는 통제입니다.", ["distinct left grain으로 계산합니다.", "repair 전 재확인합니다."]),
    ],
    diagnostics: [
      d("unmatched export를 처리하는 동안 일부 rows가 이미 matched로 바뀌었다.", "long-running workflow가 snapshot timestamp와 revalidation 없이 stale absence를 action으로 사용했습니다.", ["export snapshot/run id를 확인합니다.", "action 직전 current relationship을 재조회합니다.", "transaction/isolation과 delay를 측정합니다."], "export는 evidence로 보존하고 destructive action은 current complete-key predicate와 authorization를 transaction 안에서 재검증합니다.", "concurrent insert fixture와 stale-action prevention/idempotency tests를 둡니다."),
    ],
    expertNotes: ["absence reports can reveal sensitive participation and require authorization/minimum disclosure.", "replica lag가 unmatched를 과대 보고할 수 있어 consistency/freshness metadata를 consumer에게 제공합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0202", repository: "local dbstudy snapshot", path: "dbstudy/02_02.sql", usedFor: ["LEFT JOIN progression", "ON/WHERE and NULL patterns", "subquery comparison"], evidence: "read-only 구조 계수에서 SELECT48·JOIN20(LEFT8/INNER12)·ON20·WHERE24·IS NULL4·IN subquery6을 확인했습니다. sample literals는 사용하지 않았습니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["LEFT OUTER JOIN", "ON/WHERE", "GROUP BY", "EXISTS"], evidence: "모든 exact SQLite outer-join examples의 공식 SELECT 기준입니다." },
  { id: "sqlite-window", repository: "SQLite Documentation", path: "Window Functions", publicUrl: "https://www.sqlite.org/windowfunctions.html", usedFor: ["ROW_NUMBER", "partition/order", "latest-one selection"], evidence: "deterministic latest-row example의 공식 기준입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["outer lookup plan", "index observation", "SCAN/SEARCH"], evidence: "latest lookup index example의 plan 기준입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["read snapshots", "transaction lifecycle", "export boundary"], evidence: "snapshot/pagination lab의 SQLite 공식 기준입니다." },
  { id: "postgres-table-expressions", repository: "PostgreSQL Documentation", path: "Table Expressions", publicUrl: "https://www.postgresql.org/docs/current/queries-table-expressions.html", usedFor: ["LEFT OUTER JOIN", "joined-table nesting", "ON/WHERE"], evidence: "outer join portability의 PostgreSQL 공식 기준입니다." },
  { id: "postgres-constraints", repository: "PostgreSQL Documentation", path: "Constraints", publicUrl: "https://www.postgresql.org/docs/current/ddl-constraints.html", usedFor: ["right uniqueness", "PK/FK", "nullability"], evidence: "match provenance와 cardinality proof의 공식 기준입니다." },
  { id: "postgres-indexes", repository: "PostgreSQL Documentation", path: "Indexes", publicUrl: "https://www.postgresql.org/docs/current/indexes.html", usedFor: ["outer lookup indexes", "multicolumn order", "write cost"], evidence: "latest/pre-aggregate access path의 공식 기준입니다." },
  { id: "postgres-explain", repository: "PostgreSQL Documentation", path: "Using EXPLAIN", publicUrl: "https://www.postgresql.org/docs/current/using-explain.html", usedFor: ["estimated/actual rows", "outer plan", "join loops"], evidence: "outer plan 검증의 공식 기준입니다." },
  { id: "postgres-transaction", repository: "PostgreSQL Documentation", path: "Transaction Isolation", publicUrl: "https://www.postgresql.org/docs/current/transaction-iso.html", usedFor: ["MVCC", "consistent report", "concurrent unmatched state"], evidence: "snapshot operations portability의 공식 기준입니다." },
  { id: "postgres-limit", repository: "PostgreSQL Documentation", path: "LIMIT and OFFSET", publicUrl: "https://www.postgresql.org/docs/current/queries-limit.html", usedFor: ["stable ordering", "parent-first pagination", "page consistency"], evidence: "pagination contract의 공식 기준입니다." },
  { id: "mysql-join", repository: "MySQL 8.4 Reference Manual", path: "JOIN Clause", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/join.html", usedFor: ["LEFT JOIN", "ON", "outer syntax"], evidence: "MySQL 8.4 outer join portability의 공식 기준입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["outer join plans", "access methods", "row estimates"], evidence: "MySQL plan 검증의 공식 기준입니다." },
  { id: "oracle-joins", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Joins", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Joins.html", usedFor: ["outer joins", "join conditions", "Cartesian boundary"], evidence: "Oracle outer join semantics portability의 공식 기준입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-11-left-outer-join", slug: "sql-11-left-outer-join", courseId: "database", moduleId: "db-joins-subqueries", order: 2,
  title: "LEFT JOIN과 매칭되지 않은 행 보존", subtitle: "left preservation과 null extension을 ON/WHERE·COUNT·anti join·pre-aggregation·snapshot 운영으로 확장합니다.", level: "전문가", estimatedMinutes: 930,
  coreQuestion: "optional relationship이 없어도 left entities를 보존하면서 stored NULL·fan-out·filters·aggregate·concurrency 때문에 unmatched 의미가 왜곡되지 않게 하려면 무엇을 증명할까요?",
  summary: "dbstudy 02_02.sql의 LEFT JOIN8·INNER JOIN12·IS NULL4 progression을 read-only provenance로 사용합니다. preserved side와 null extension, match provenance, right filter ON/WHERE, COUNT(*) vs COUNT(right key), deterministic latest/pre-aggregation, safe anti marker, optional join chains, constraints/index/EXPLAIN과 snapshot parent-first pagination을 연결합니다. 다섯 exact Python sqlite3 examples는 0/1/many preservation, filter placement, outer aggregates, anti join marker와 independent fan-out 교정을 실행합니다.",
  objectives: ["LEFT JOIN의 matched pairs와 null-extended rows를 left key set으로 검산한다.", "unmatched NULL과 matched stored NULL을 non-null right key로 구분한다.", "right eligibility predicate를 ON에 두고 accidental inner join을 진단한다.", "COUNT(*)·COUNT(right_key)와 no-match/all-null aggregates를 구분한다.", "deterministic top-one과 pre-aggregation으로 parent grain을 보존한다.", "NOT EXISTS와 safe anti marker를 사용하고 NOT IN NULL 함정을 피한다.", "outer chain optionality와 constraints/index/plan estimates를 검증한다.", "same snapshot과 parent-first keyset pagination으로 unmatched reports를 운영한다."],
  prerequisites: [{ title: "카티션 곱에서 INNER JOIN 조건 이해하기", reason: "matched pair와 fan-out/cardinality 모델을 outer preservation에 적용합니다.", sessionSlug: "sql-10-cartesian-inner-join" }, { title: "NULL과 3값 논리", reason: "null extension과 null-rejecting predicates를 구분합니다.", sessionSlug: "sql-04-null-three-valued-logic" }],
  keywords: ["LEFT JOIN", "outer join", "preserved side", "null extension", "ON versus WHERE", "COUNT right key", "unmatched", "NOT EXISTS", "anti join", "pre-aggregation", "ROW_NUMBER", "optional chain", "parent-first pagination", "snapshot"], topics,
  lab: {
    title: "모든 accounts를 보존하는 optional profile·status·tag report 구축",
    scenario: "accounts 중 일부만 profile/status/tags를 갖고 history와 tags는 many-side입니다. inactive/missing/stored-null을 구분하고 account page·unmatched export가 같은 snapshot에서 정확해야 합니다.",
    setup: ["02_02.sql은 read-only provenance로만 사용하고 synthetic keys/payloads를 준비합니다.", "0/1/many child, matched-null, inactive-only, same-time history와 independent many fixtures를 만듭니다.", "SQLite exact harness와 MySQL/PostgreSQL/Oracle isolated schemas를 준비합니다.", "required/optional edges, right key nullability와 expected states를 문서화합니다."],
    steps: ["left key preservation과 matched-pair/unmatched reconciliation을 실행합니다.", "stored NULL과 null extension을 right PK marker로 분리합니다.", "active/effective right filters의 ON/WHERE counterexample을 확인합니다.", "COUNT(*)·COUNT(right key)·known measure·SUM NULL을 group별 검산합니다.", "latest history를 unique tie-breaker ROW_NUMBER로 한 row로 줄입니다.", "independent many relations를 각각 pre-aggregate해 multiplicative fan-out을 제거합니다.", "unmatched는 right PK IS NULL과 NOT EXISTS로 비교합니다.", "optional A-B-C chain state matrix와 predicates를 검증합니다.", "constraints/indexes와 vendor estimated/actual matches-per-left를 측정합니다.", "parent-first keyset과 bounded snapshot에서 count/pages/export reconciliation을 완료합니다."],
    expectedResult: ["모든 eligible left keys가 최소 한 번 보존되고 intentional fan-out만 남습니다.", "matched-null·unmatched·inactive-only가 안정된 domain states로 구분됩니다.", "0-child count는 0이고 independent child measures가 곱으로 증식하지 않습니다.", "latest/anti/optional chain results가 constraints와 vendor plan budgets를 만족합니다.", "unmatched export는 snapshot/freshness metadata와 revalidation 없이 destructive action에 쓰이지 않습니다."],
    cleanup: ["isolated schemas·synthetic rows·temporary indexes/plans를 제거합니다.", "read snapshots와 pending exports를 종료하고 partial artifacts를 삭제합니다.", "temporary credentials/page tokens를 revoke합니다.", "local source/production data는 변경하지 않고 telemetry에 raw keys/payload가 없는지 확인합니다."],
    extensions: ["FULL OUTER JOIN orphan reconciliation과 vendor emulation을 비교합니다.", "as-of temporal outer join과 late-arriving dimensions를 구현합니다.", "materialized current-state projection의 rebuild/reconciliation을 추가합니다.", "GraphQL/ORM optional eager-loading과 parent pagination parity를 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 matched·stored-null·unmatched provenance를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "0/1/many child preservation을 설명합니다.", "ON/WHERE active filter 차이를 비교합니다.", "COUNT(*)와 COUNT(right key)를 검산합니다.", "payload-null anti 오류를 재현합니다.", "raw fan-out과 parent summary/page를 비교합니다."], hints: ["right primary key NULL과 payload NULL을 반드시 분리하세요."], expectedOutcome: "LEFT JOIN을 syntax가 아니라 preservation/provenance contract로 설명합니다.", solutionOutline: ["left set→matches→null extension→filter→grain→snapshot 순서입니다."] },
    { difficulty: "응용", prompt: "02_02 join 흐름을 optional account report로 재설계하세요.", requirements: ["read-only provenance counts를 보존합니다.", "right filters를 ON에 배치합니다.", "matched/null/unmatched states를 모델링합니다.", "top-one/pre-aggregation을 적용합니다.", "anti join과 optional chain을 검증합니다.", "constraints/index/vendor plans를 확인합니다.", "snapshot/keyset/reconciliation을 포함합니다."], hints: ["LEFT JOIN 뒤 DISTINCT로 many-side를 숨기지 마세요."], expectedOutcome: "보존·성능·운영 의미가 명확한 optional report가 완성됩니다.", solutionOutline: ["audit→state matrix→query blocks→tests→plans→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 outer-join·absence-report 표준을 작성하세요.", requirements: ["preserved side/result grain을 요구합니다.", "match marker와 stored NULL policy를 정의합니다.", "ON/WHERE·COUNT·anti rules를 둡니다.", "top-one/pre-aggregation/optional chains를 검토합니다.", "constraints/index/EXPLAIN budgets를 포함합니다.", "snapshot/freshness/revalidation/privacy를 포함합니다."], hints: ["unmatched는 영구 사실이 아니라 snapshot state일 수 있습니다."], expectedOutcome: "초급 LEFT JOIN부터 안전한 absence workflow까지 review 표준이 완성됩니다.", solutionOutline: ["preserve→classify→reduce→plan→snapshot→act 순서입니다."] },
  ],
  nextSessions: ["sql-12-multi-table-join-alias"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_02.sql의 SELECT48·JOIN20(LEFT8/INNER12)·ON20·WHERE24·IS NULL4·maximum join chain2를 read-only로 계수했습니다.", "local sample literals·원문 SQL·식별 가능 values는 복사하지 않고 LEFT/INNER/subquery progression만 사용했습니다.", "원본은 null-extension provenance, COUNT(right key), deterministic top-one, independent fan-out, optional chains와 snapshot absence operations를 충분히 설명하지 않아 primary vendor docs와 synthetic examples로 보강했습니다.", "SQLite exact examples는 MySQL/PostgreSQL/Oracle outer-join rewrite·locking·isolation·NULL ordering을 대체하지 않습니다."] },
});

export default session;
