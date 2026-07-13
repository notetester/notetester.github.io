import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 메모리 DB와 synthetic rows/graph를 준비해 외부 DB·credential 없이 CTE와 window semantics를 재현합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "CTE pipeline, recursive anchor/step/guard, ranking과 explicit frame을 실행하고 intermediate keys를 정렬합니다." },
      { lines: "마지막 5줄", explanation: "path·depth·rank·running total 같은 deterministic evidence만 출력합니다. vendor optimizer/materialization/recursion limits는 MySQL·Oracle에서 재검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite laboratory는 MySQL 8.4·Oracle 26ai의 optimizer, parallelism, memory와 recursion safety를 대체하지 않습니다."] },
    experiments: [
      { change: "동률 order key, cycle, deep chain, duplicate edge와 frame 종류를 바꿉니다.", prediction: "total order·cycle guard·termination·frame이 없으면 결과 cardinality나 누적값이 달라집니다.", result: "최종 row뿐 아니라 iteration depth, path와 frame membership을 함께 검증합니다." },
      { change: "CTE를 inline subquery/temp table로 바꾸고 representative data에서 plan을 비교합니다.", prediction: "materialization/inlining과 repeated references에 따라 scan·sort·spill 비용이 달라집니다.", result: "가독성 가정이 아니라 EXPLAIN actual과 resource budget으로 선택합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "nonrecursive-cte-query-pipeline",
    title: "비재귀 CTE를 이름 붙은 관계와 검증 가능한 query pipeline으로 사용합니다",
    lead: "WITH는 임시 결과를 무조건 저장하는 문법이 아니라 한 statement 안에서 population·grain 변환을 단계별 관계로 표현하는 장치입니다.",
    explanations: [
      "원본 dbstudy 02_03.sql은 aggregate, paging, join과 view까지 다루지만 CTE·window의 직접 예제는 없습니다. 이 세션은 그 명시적 gap을 공식 문서와 synthetic examples로 전문가 보강하며 원본 sample literals는 복사하지 않습니다.",
      "각 CTE는 이름, input grain, output columns/keys, eligibility predicate와 row-count invariant를 가져야 합니다. filtered, deduplicated, aggregated 같은 의미를 이름에 드러내고 SELECT *로 숨기지 않습니다.",
      "CTE scope는 한 statement이며 위에서 정의된 CTE를 뒤 단계가 참조하는 dataflow를 만듭니다. 동일 alias shadowing, column list mismatch와 forward/mutual reference 지원은 dialect별로 확인합니다.",
      "긴 query를 CTE로 나눈다고 자동으로 정확해지지 않습니다. 각 단계의 grain을 바꾸는 GROUP BY/JOIN/UNION, NULL 처리와 authorization predicate가 어디에서 적용되는지 주석과 tests로 증명합니다.",
      "debug에서는 최종 SELECT를 중간 CTE 대상으로 바꿔 ids/counts를 readback할 수 있지만 production query text와 plan이 달라질 수 있습니다. acceptance에는 full statement 결과와 plan을 사용합니다.",
    ],
    concepts: [
      c("named relation", "한 SQL statement 안에서 이름으로 참조하는 row/column relation입니다.", ["grain과 keys를 문서화합니다.", "procedural step이나 영구 table이 아닙니다."]),
      c("CTE pipeline", "filter→normalize→join→aggregate처럼 관계 변환을 명시적 단계로 연결한 구조입니다.", ["각 단계 invariant를 둡니다.", "authorization을 초기에 적용합니다."]),
      c("grain transition", "CTE 단계가 한 행의 의미와 cardinality를 바꾸는 지점입니다.", ["GROUP BY·join·UNION을 감사합니다.", "다음 단계 key를 재정의합니다."]),
    ],
    codeExamples: [py("sql17-cte-pipeline", "eligibility와 aggregate grain을 분리한 CTE", "sql17_cte_pipeline.py", "tenant-safe eligible rows와 category aggregate를 두 CTE로 나누고 source/aggregate totals를 reconciliation합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE sale(tenant TEXT, category TEXT, amount INTEGER, status TEXT)")
db.executemany("INSERT INTO sale VALUES (?, ?, ?, ?)", [
    ("t1", "A", 10, "ok"), ("t1", "A", 20, "ok"), ("t1", "B", 7, "ok"),
    ("t1", "B", 99, "void"), ("t2", "A", 500, "ok")
])
rows = db.execute("""
    WITH eligible AS (
      SELECT category, amount FROM sale WHERE tenant = ? AND status = 'ok'
    ), totals AS (
      SELECT category, count(*) AS n, sum(amount) AS total FROM eligible GROUP BY category
    )
    SELECT category, n, total FROM totals ORDER BY category
""", ("t1",)).fetchall()
for category, count, total in rows:
    print(f"{category}={count}:{total}")
print("groups=" + str(len(rows)))
print("total=" + str(sum(row[2] for row in rows)))
print("tenant-isolated=true")`, "A=2:30\nB=1:7\ngroups=2\ntotal=37\ntenant-isolated=true", ["mysql-with", "oracle-select", "sqlite-with"]),
    ],
    diagnostics: [
      d("CTE를 추가한 뒤 total이 두 배가 됩니다.", "중간 join/grain transition이 rows를 증식시켰지만 단계 이름만 믿고 cardinality를 검사하지 않았습니다.", ["CTE별 primary/entity keys", "input/output row counts", "join match multiplicity", "aggregate grain"], "각 CTE에 expected grain·unique key와 row-count reconciliation을 두고 child를 pre-aggregate/EXISTS로 바꿉니다.", "0/1/N match fixtures와 intermediate id uniqueness tests를 둡니다."),
      d("다른 tenant row가 마지막 aggregate에 섞입니다.", "authorization predicate가 늦은 CTE나 최종 결과에만 적용됐습니다.", ["첫 canonical input CTE", "join 전 tenant keys", "view/RLS context", "cache/materialization scope"], "권한 적용 relation을 첫 단계로 만들고 모든 joins에 tenant key를 포함합니다.", "cross-tenant sentinel과 intermediate lineage audit를 둡니다."),
    ],
    expertNotes: ["CTE 이름은 실행 순서를 암시하기보다 relation 의미와 grain을 설명해야 합니다.", "중간 CTE readback은 diagnosis 도구이며 실제 production statement의 plan/correctness를 별도로 검증합니다."],
  },
  {
    id: "cte-inlining-materialization-plan",
    title: "CTE inlining·materialization·다중 참조의 optimizer 경계를 측정합니다",
    lead: "WITH를 썼다는 사실만으로 한 번 계산되거나 index가 생기거나 optimization fence가 된다고 가정하면 엔진·버전 변경에 취약합니다.",
    explanations: [
      "optimizer는 nonrecursive CTE를 outer query에 merge/inline하거나 temporary materialization할 수 있습니다. predicate pushdown, repeated scan, sort/aggregate reuse와 cardinality estimate가 달라지므로 공식 문서와 EXPLAIN actual을 봅니다.",
      "같은 expensive CTE를 두 번 참조해도 한 번 계산된다고 보장하지 않습니다. 반대로 materialization은 repeated work를 줄이지만 temp I/O, lost indexes/statistics와 전체 population 선계산을 유발할 수 있습니다.",
      "engine이 MATERIALIZED/NOT MATERIALIZED hint를 지원해도 correctness에 의존하지 않고 대표 데이터에서 evidence가 있을 때 제한적으로 사용합니다. upgrade 시 hint semantics와 plan을 재검증합니다.",
      "volatile/nondeterministic functions, sequence/current time과 side-effect-like constructs는 inlining/materialization 차이가 관찰값을 바꿀 수 있습니다. query 안에서 한 시점 값이 필요한지 parameter/outer single-row relation으로 명시합니다.",
      "CTE, derived table, temporary table와 materialized view는 lifetime, indexes/stats, transaction visibility, reuse와 cleanup이 다릅니다. 이름이 아니라 workload와 consistency 요구로 선택합니다.",
    ],
    concepts: [
      c("CTE inlining", "CTE definition을 outer query tree에 합쳐 optimizer가 함께 변환하는 전략입니다.", ["predicate pushdown이 가능할 수 있습니다.", "다중 참조가 반복 계산될 수 있습니다."]),
      c("CTE materialization", "CTE 결과를 temporary structure로 계산해 참조하는 전략입니다.", ["reuse 가능성이 있습니다.", "temp I/O·memory와 optimization boundary가 생깁니다."]),
      c("optimization evidence", "EXPLAIN actual의 scans, rows, loops, sort/temp/spill과 representative latency를 통해 plan 선택을 증명하는 자료입니다.", ["문법 추측을 대체합니다.", "engine/version별로 기록합니다."]),
    ],
    diagnostics: [
      d("CTE로 정리했더니 query가 갑자기 전체 table을 여러 번 읽습니다.", "CTE가 inline되어 다중 참조마다 반복되거나 filter pushdown이 막힌 materialization plan이 선택됐습니다.", ["EXPLAIN CTE scans/loops", "predicate pushdown", "materialize/temp", "reference count와 estimates"], "CTE 구조·index/stats를 조정하거나 evidence에 따라 temp/materialized strategy를 선택합니다.", "engine/version별 plan shape와 rows/loops budget을 regression-test합니다."),
      d("업그레이드 후 같은 SQL의 latency가 크게 바뀝니다.", "CTE merge/materialization heuristic과 cardinality estimates가 달라졌습니다.", ["old/new plans", "statistics/version/config", "CTE hints", "representative parameter distributions"], "stats를 갱신하고 plan difference를 workload로 검증한 뒤 query/hint/index를 조정합니다.", "DB upgrade qualification에 critical CTE plan suite를 포함합니다."),
    ],
    expertNotes: ["CTE는 가독성 도구와 optimizer 입력 둘 다이므로 semantic tests와 plan/resource tests를 분리합니다.", "temporary table을 도입하면 transaction cleanup, connection pooling과 name collision까지 운영 범위가 확장됩니다."],
  },
  {
    id: "recursive-cte-anchor-step-termination",
    title: "재귀 CTE의 anchor·recursive step·termination·UNION semantics를 불변식으로 설계합니다",
    lead: "재귀 CTE는 anchor frontier에서 시작해 recursive member로 새 rows를 반복 생성하므로 종료와 중복 정책이 correctness와 resource safety를 결정합니다.",
    explanations: [
      "anchor member는 시작 rows와 초기 depth/path/state를 정의합니다. recursive member는 이전 iteration rows에서 다음 frontier를 만들며 anchor와 column count/type가 호환되어야 합니다.",
      "termination은 depth limit, finite acyclic graph, monotonic bound 또는 visited-state exclusion처럼 증명 가능한 조건이어야 합니다. 데이터가 정상일 것이라는 가정만으로 WHERE guard를 생략하지 않습니다.",
      "UNION ALL은 duplicates를 보존해 빠를 수 있지만 cycle/duplicate path가 폭발합니다. UNION은 full row 중복을 제거하지만 depth/path가 다르면 같은 node도 다른 row이며 cycle guard를 대신하지 못합니다.",
      "recursion depth·row/time/memory limits를 request와 DB resource policy에 둡니다. hierarchy depth가 domain bound를 넘으면 partial success가 아니라 explicit error/quarantine과 diagnosis metadata를 제공합니다.",
      "recursive traversal order는 result order가 아닙니다. depth-first/breadth-first display가 필요하면 depth/path/sort keys를 계산하고 최종 ORDER BY로 명시합니다.",
    ],
    concepts: [
      c("anchor member", "재귀의 초기 result/frontier와 state를 만드는 nonrecursive query입니다.", ["시작 scope와 authorization을 적용합니다.", "depth/path 초기값을 정의합니다."]),
      c("recursive member", "이전 iteration relation을 참조해 다음 frontier를 생성하는 query입니다.", ["진전 measure가 있어야 합니다.", "join cardinality와 duplicates를 감사합니다."]),
      c("termination invariant", "각 iteration이 finite bound에 가까워지거나 visited state를 제외해 반드시 끝난다는 조건입니다.", ["depth limit만으로 correctness가 되지는 않습니다.", "resource limits도 둡니다."]),
    ],
    codeExamples: [py("sql17-recursive-hierarchy", "anchor와 depth/path가 있는 계층 순회", "sql17_recursive_tree.py", "parent-child tree를 root에서 내려가며 stable path와 depth를 계산하고 최종 path order로 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE node(id INTEGER PRIMARY KEY, parent_id INTEGER, name TEXT)")
db.executemany("INSERT INTO node VALUES (?, ?, ?)", [
    (1, None, "root"), (2, 1, "alpha"), (3, 1, "beta"), (4, 2, "leaf")
])
rows = db.execute("""
    WITH RECURSIVE tree(id, name, depth, path) AS (
      SELECT id, name, 0, printf('%04d', id) FROM node WHERE parent_id IS NULL
      UNION ALL
      SELECT child.id, child.name, tree.depth + 1, tree.path || '/' || printf('%04d', child.id)
      FROM node child JOIN tree ON child.parent_id = tree.id
      WHERE tree.depth < 10
    )
    SELECT id, name, depth, path FROM tree ORDER BY path
""").fetchall()
for node_id, name, depth, path in rows:
    print(f"{node_id}:{name}:depth={depth}:path={path}")
print("nodes=" + str(len(rows)))
print("max-depth=" + str(max(row[2] for row in rows)))`, "1:root:depth=0:path=0001\n2:alpha:depth=1:path=0001/0002\n4:leaf:depth=2:path=0001/0002/0004\n3:beta:depth=1:path=0001/0003\nnodes=4\nmax-depth=2", ["mysql-with", "oracle-select", "sqlite-with"]),
    ],
    diagnostics: [
      d("재귀 query가 끝나지 않거나 recursion limit에 도달합니다.", "cycle, self-edge 또는 진전하지 않는 recursive predicate에 visited/termination guard가 없습니다.", ["anchor rows", "iteration별 new ids", "self/cycle edges", "depth/time/row limits"], "visited identity/path cycle check와 domain depth bound를 적용하고 malformed graph를 quarantine합니다.", "self-loop·2/3-node cycle·deep chain fixtures와 resource timeout을 둡니다."),
      d("같은 node가 여러 번 나타나 row 수가 지수적으로 늘어납니다.", "multiple parents/duplicate edges와 UNION ALL path semantics를 node uniqueness로 오해했습니다.", ["graph model DAG/tree", "edge uniqueness", "node vs path grain", "UNION row columns"], "원하는 grain이 node인지 path인지 정의하고 edge unique constraint, visited set 또는 canonical parent policy를 적용합니다.", "diamond graph·duplicate edge fixtures에서 expected path/node counts를 검증합니다."),
    ],
    expertNotes: ["재귀 query acceptance에는 결과 rows뿐 아니라 max depth, expanded edges, cycles rejected와 termination reason을 포함합니다.", "사용자 제공 graph/start id는 권한 범위를 anchor와 recursive join 모두에 적용해야 합니다."],
  },
  {
    id: "recursive-cycle-depth-resource-safety",
    title: "cycle detection·depth/row/time budget과 path representation을 보안 경계로 만듭니다",
    lead: "재귀 CTE는 작은 cycle이나 고차수 graph로 DB 자원을 소진할 수 있으므로 논리 correctness와 denial-of-service 방어를 함께 설계합니다.",
    explanations: [
      "path string에서 delimiter로 id를 감싸 membership을 검사하는 방식은 학습용으로 명확하지만 길이·collation·substring 비용과 delimiter escaping 문제가 있습니다. 엔진의 CYCLE clause, array/JSON state 또는 별도 visited table 지원을 비교합니다.",
      "depth limit은 무한 루프를 멈추지만 정상 깊은 결과를 조용히 잘라낼 수 있습니다. truncated flag/reason과 frontier count를 반환하거나 limit 도달을 오류로 처리해 완전 결과처럼 캐시하지 않습니다.",
      "branching factor가 높으면 cycle이 없어도 rows가 폭발합니다. max expanded edges/nodes, statement timeout, temp/memory budget, concurrency/rate limit과 query cancellation을 둡니다.",
      "path에 사용자 label이나 PII를 누적하면 temp/log/error에 민감 정보가 복제됩니다. stable opaque ids만 state로 쓰고 display label은 최종 authorized join에서 붙입니다.",
      "cycle 정책은 reject, stop-at-repeat, emit-cycle-marker 또는 SCC analysis 중 domain에 맞게 선택합니다. 조직 hierarchy와 dependency graph는 같은 정책을 갖지 않을 수 있습니다.",
    ],
    concepts: [
      c("visited identity", "현재 traversal path 또는 전체 탐색에서 이미 본 node를 식별하는 state입니다.", ["path cycle와 global dedup을 구분합니다.", "stable id를 사용합니다."]),
      c("recursion budget", "depth·expanded rows/edges·time·memory와 concurrency에 둔 hard limit입니다.", ["limit 도달을 관측합니다.", "partial 결과 상태를 구분합니다."]),
      c("cycle policy", "반복 node를 발견했을 때 reject/stop/mark/analyze 중 선택한 domain 규칙입니다.", ["결과 completeness와 연결합니다.", "silent drop을 피합니다."]),
    ],
    codeExamples: [py("sql17-cycle-safe-graph", "path visited guard로 cycle을 차단하는 graph 순회", "sql17_cycle_guard.py", "1→2→3→1 cycle과 2→4 edge에서 path membership을 검사해 각 reachable node를 유한하게 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE edge(src INTEGER, dst INTEGER, UNIQUE(src, dst))")
db.executemany("INSERT INTO edge VALUES (?, ?)", [(1, 2), (2, 3), (3, 1), (2, 4)])
rows = db.execute("""
    WITH RECURSIVE walk(node, depth, path) AS (
      VALUES(1, 0, ',1,')
      UNION ALL
      SELECT edge.dst, walk.depth + 1, walk.path || edge.dst || ','
      FROM walk JOIN edge ON edge.src = walk.node
      WHERE walk.depth < 10 AND instr(walk.path, ',' || edge.dst || ',') = 0
    )
    SELECT node, depth, path FROM walk ORDER BY depth, node
""").fetchall()
for node, depth, path in rows:
    print(f"node={node}:depth={depth}:path={path}")
print("reachable=" + ",".join(map(str, sorted({row[0] for row in rows}))))
print("rows=" + str(len(rows)))
print("terminated=true")`, "node=1:depth=0:path=,1,\nnode=2:depth=1:path=,1,2,\nnode=3:depth=2:path=,1,2,3,\nnode=4:depth=2:path=,1,2,4,\nreachable=1,2,3,4\nrows=4\nterminated=true", ["mysql-with", "oracle-select", "sqlite-with"]),
    ],
    diagnostics: [
      d("depth limit에 걸린 partial graph가 완전한 결과로 저장됩니다.", "limit reached 상태를 result metadata와 cache key에 보존하지 않았습니다.", ["max depth/rows reached", "remaining frontier", "response/cache status", "consumer completeness assumption"], "limit 도달을 explicit incomplete/error로 만들고 승인된 resume/async path를 제공합니다.", "limit-1/limit/limit+1 chains와 cache readback tests를 둡니다."),
      d("재귀 endpoint 하나가 DB CPU/temp를 독점합니다.", "branching graph에 row/time/memory/concurrency budgets와 cancellation이 없습니다.", ["expanded rows per depth", "statement runtime/temp", "principal rate/concurrency", "query cancel propagation"], "hard resource limits, async job/quota와 allow-listed traversal scope를 적용합니다.", "high-branch adversarial graph load test와 circuit-breaker drill을 둡니다."),
    ],
    expertNotes: ["cycle-free는 cheap query를 의미하지 않습니다. branching과 path count를 별도 예산으로 둡니다.", "path state는 raw labels가 아니라 opaque ids로 최소화하고 telemetry에는 depth/count/reason만 남깁니다."],
  },
  {
    id: "row-number-rank-dense-rank",
    title: "ROW_NUMBER·RANK·DENSE_RANK를 total order와 tie semantics에 맞게 선택합니다",
    lead: "세 함수는 같은 PARTITION/ORDER를 사용해도 동률에 부여하는 번호와 gap이 다르며 top-N·dedup·pagination 의미가 달라집니다.",
    explanations: [
      "ROW_NUMBER는 partition 안 각 row에 고유 연속 번호를 주지만 ORDER BY가 total order가 아니면 동률 rows의 번호가 비결정적입니다. dedup winner에는 business priority+event time+immutable id를 완전하게 둡니다.",
      "RANK는 동률에 같은 순위를 주고 다음 순위에 gap이 생깁니다. DENSE_RANK는 gap 없이 distinct sort value 순위를 줍니다. '상위 3명'과 '상위 3개 점수 등급'이 어떤 cardinality를 원하는지 정의합니다.",
      "top N per group은 ROW_NUMBER<=N이면 정확히 최대 N rows, RANK<=N이면 N번째와 동률인 추가 rows를 포함할 수 있습니다. UI/API maximum size와 공정성 정책을 함께 결정합니다.",
      "최신 row dedup에서 rn=1은 데이터를 삭제하지 않고 query view를 선택합니다. source duplicates 원인, late events, corrected versions와 deterministic winner lineage를 보존합니다.",
      "ranking partition key는 tenant/authorization scope와 entity grain을 포함해야 합니다. tenant를 빼면 다른 tenant rows가 서로 rank를 밀어내고 결과 cardinality 정보가 누출됩니다.",
    ],
    concepts: [
      c("ROW_NUMBER", "partition order의 각 row에 1부터 고유 연속 번호를 부여하는 window 함수입니다.", ["total order가 determinism에 필요합니다.", "exact-N/dedup에 적합합니다."]),
      c("RANK", "동률 rows에 같은 순위를 주고 다음 순위에 동률 수만큼 gap을 두는 함수입니다.", ["competition ranking입니다.", "top-N rows 수가 N을 넘을 수 있습니다."]),
      c("DENSE_RANK", "동률 rows에 같은 순위를 주되 다음 distinct value에 gap 없는 순위를 주는 함수입니다.", ["distinct tiers에 적합합니다.", "row cardinality와 rank count를 구분합니다."]),
    ],
    codeExamples: [py("sql17-ranking-ties", "ROW_NUMBER·RANK·DENSE_RANK 동률 비교", "sql17_ranking.py", "team별 score DESC,id ASC에서 동률 rows의 세 ranking 결과와 rank gaps를 정확히 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE score(id INTEGER PRIMARY KEY, team TEXT, points INTEGER)")
db.executemany("INSERT INTO score VALUES (?, ?, ?)", [
    (1, "A", 100), (2, "A", 100), (3, "A", 90), (4, "A", 80),
    (5, "B", 70), (6, "B", 60)
])
rows = db.execute("""
    SELECT team, id, points,
           row_number() OVER (PARTITION BY team ORDER BY points DESC, id) AS rn,
           rank() OVER (PARTITION BY team ORDER BY points DESC) AS rnk,
           dense_rank() OVER (PARTITION BY team ORDER BY points DESC) AS dense
    FROM score ORDER BY team, rn
""").fetchall()
for team, item_id, points, rn, rank, dense in rows:
    print(f"{team}:{item_id}:points={points}:row={rn}:rank={rank}:dense={dense}")
print("a-ranks=" + ",".join(str(row[4]) for row in rows if row[0] == "A"))
print("a-dense=" + ",".join(str(row[5]) for row in rows if row[0] == "A"))`, "A:1:points=100:row=1:rank=1:dense=1\nA:2:points=100:row=2:rank=1:dense=1\nA:3:points=90:row=3:rank=3:dense=2\nA:4:points=80:row=4:rank=4:dense=3\nB:5:points=70:row=1:rank=1:dense=1\nB:6:points=60:row=2:rank=2:dense=2\na-ranks=1,1,3,4\na-dense=1,1,2,3", ["mysql-window-descriptions", "oracle-row-number", "sqlite-window"]),
    ],
    diagnostics: [
      d("최신 row dedup winner가 실행마다 바뀝니다.", "ROW_NUMBER ORDER BY에 unique tie-breaker가 없거나 mutable/non-normalized key를 썼습니다.", ["partition entity key", "sort tuple uniqueness", "NULL/collation", "winner source id"], "business priority와 immutable event/id로 total order를 만들고 winner lineage를 출력합니다.", "tie-heavy shuffled-insert fixtures와 repeated-plan tests를 둡니다."),
      d("top 10 query가 18 rows를 반환합니다.", "RANK<=10이 10번째 동률을 모두 포함했지만 API는 exact 10 rows를 기대했습니다.", ["RANK vs ROW_NUMBER", "tie policy", "response maximum", "fairness/product wording"], "exact-N이면 ROW_NUMBER total order를, include-ties면 RANK와 명시적 size semantics를 사용합니다.", "N boundary tie fixtures와 UI/API contract tests를 둡니다."),
    ],
    expertNotes: ["ranking 함수 선택은 문법이 아니라 tie fairness와 output cardinality 계약입니다.", "dedup winner를 사용해도 discarded source rows와 reason을 audit/reconciliation할 수 있어야 합니다."],
  },
  {
    id: "window-partition-order-frame",
    title: "window의 PARTITION BY·ORDER BY·frame을 독립 축으로 이해합니다",
    lead: "GROUP BY와 달리 window 함수는 input row를 보존하면서 partition 내 관련 rows를 봅니다. 같은 order라도 frame 기본값이 누적 결과를 바꿉니다.",
    explanations: [
      "PARTITION BY는 window state를 독립 group으로 나누지만 rows를 축약하지 않습니다. tenant/entity boundary가 빠지면 계산이 섞이고 다른 partition cardinality가 정보로 노출됩니다.",
      "window ORDER BY는 frame/rank/offset 계산 순서를 정의하며 최종 result ORDER BY와 별개입니다. 최종 표시 순서도 명시하고 두 order가 다를 때 의도를 설명합니다.",
      "ROWS는 물리적 ordered rows 수, RANGE는 current order value의 peers/value 범위, GROUPS는 peer groups 단위입니다. 기본 frame은 함수/엔진과 ORDER BY 존재에 따라 달라질 수 있으므로 누적/이동 계산에는 명시합니다.",
      "ROWS frame에서 order ties가 total order가 아니면 어떤 동률 row가 먼저 누적되는지 비결정적입니다. RANGE는 peers를 함께 포함할 수 있어 같은 key rows가 같은 누적값을 받습니다.",
      "frame exclusion, NULL ordering, multiple order expressions와 interval RANGE 지원은 dialect별 차이가 큽니다. portability matrix에서 syntax뿐 아니라 member rows를 golden fixture로 비교합니다.",
    ],
    concepts: [
      c("window partition", "각 current row가 계산할 관련 row 집합을 partition keys로 나눈 범위입니다.", ["rows는 결과에 남습니다.", "tenant/entity scope를 포함합니다."]),
      c("peer group", "window ORDER BY expressions가 같은 rows 집합입니다.", ["RANK와 RANGE/GROUPS에 중요합니다.", "unique id를 더하면 peer 정의가 바뀝니다."]),
      c("window frame", "partition 안 current row 주변에서 aggregate/value 함수가 실제로 읽는 rows 범위입니다.", ["ROWS/RANGE/GROUPS를 구분합니다.", "bounds를 명시합니다."]),
    ],
    codeExamples: [py("sql17-window-frame-peers", "ROWS와 RANGE peer 누적합 비교", "sql17_frames.py", "중복 order key에서 ROWS는 한 row씩, RANGE는 peer group 전체를 포함하는 차이를 id order로 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE metric(id INTEGER PRIMARY KEY, bucket INTEGER, value INTEGER)")
db.executemany("INSERT INTO metric VALUES (?, ?, ?)", [(1, 1, 10), (2, 1, 20), (3, 2, 5)])
rows = db.execute("""
    SELECT id, bucket, value,
           sum(value) OVER (ORDER BY bucket, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS rows_sum,
           sum(value) OVER (ORDER BY bucket RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS range_sum
    FROM metric ORDER BY bucket, id
""").fetchall()
for item_id, bucket, value, rows_sum, range_sum in rows:
    print(f"id={item_id}:bucket={bucket}:value={value}:rows={rows_sum}:range={range_sum}")
print("rows-series=" + ",".join(str(row[3]) for row in rows))
print("range-series=" + ",".join(str(row[4]) for row in rows))
print("peer-difference=true")`, "id=1:bucket=1:value=10:rows=10:range=30\nid=2:bucket=1:value=20:rows=30:range=30\nid=3:bucket=2:value=5:rows=35:range=35\nrows-series=10,30,35\nrange-series=30,30,35\npeer-difference=true", ["mysql-window", "oracle-analytic", "sqlite-window"]),
    ],
    diagnostics: [
      d("같은 날짜의 첫 row 누적합이 전체 날짜 합으로 나옵니다.", "기본 RANGE frame이 같은 order-key peers를 함께 포함했습니다.", ["effective frame", "peer groups", "ROWS/RANGE", "total order/tie policy"], "row-by-row 누적이면 explicit ROWS와 unique order를, value-group 누적이면 RANGE 의도를 문서화합니다.", "duplicate order-key fixtures에서 frame member ids를 검증합니다."),
      d("window 계산은 tenant별이어야 하는데 전체 평균이 섞입니다.", "PARTITION BY에 tenant/security key가 누락됐습니다.", ["partition keys", "input authorization", "cross-tenant rows", "result/cache scope"], "authorized input relation과 tenant-inclusive partition을 사용합니다.", "cross-tenant sentinel과 partition count reconciliation을 둡니다."),
    ],
    expertNotes: ["window 함수마다 frame을 쓰는지 무시하는지 공식 문서로 확인하고 공통 WINDOW clause의 의도를 과대 일반화하지 않습니다.", "window result가 row grain을 유지한다는 사실을 이용해 source id와 계산 evidence를 함께 출력합니다."],
  },
  {
    id: "running-moving-offset-analytics",
    title: "누적·이동 평균·LAG/LEAD를 time/event grain과 boundary policy로 계산합니다",
    lead: "running total, rolling average와 이전 값 비교는 window frame/offset이 어떤 관측을 포함하는지 정의해야 시간 간격과 missing data를 올바르게 해석합니다.",
    explanations: [
      "running total은 UNBOUNDED PRECEDING..CURRENT ROW, rolling N rows는 N-1 PRECEDING..CURRENT ROW 같은 explicit ROWS frame을 씁니다. N calendar days가 N rows와 같지 않음을 구분합니다.",
      "LAG/LEAD offset은 ordered row 위치를 이동하며 missing dates를 자동 생성하지 않습니다. 일별 series가 필요하면 calendar relation을 만들고 left join/filled/missing policy를 정의합니다.",
      "first row의 LAG NULL은 원본 측정 NULL과 구분할 수 있도록 hasPrevious 또는 row_number를 함께 사용합니다. default zero는 percentage change denominator와 의미를 왜곡할 수 있습니다.",
      "division by zero, negative/corrected values, timezone/DST와 event-time late arrivals를 처리합니다. published rolling window가 late event로 바뀌면 watermark/restatement policy가 필요합니다.",
      "moving calculations에서 intermediate rounding을 피하고 display 경계에서 scale을 적용합니다. decimal/numeric promotion과 sample/population frame size를 engine matrix에서 검증합니다.",
    ],
    concepts: [
      c("running aggregate", "partition 시작부터 current row까지 확장되는 frame의 집계입니다.", ["명시적 frame을 사용합니다.", "total order가 필요합니다."]),
      c("rolling row window", "current row 주변 고정 row 수를 포함하는 이동 frame입니다.", ["calendar 기간과 다릅니다.", "초기 partial frame 정책을 둡니다."]),
      c("LAG/LEAD boundary", "partition 처음/끝에서 이전/다음 row가 없어 NULL/default가 생기는 경계입니다.", ["data NULL과 구분합니다.", "offset/order를 명시합니다."]),
    ],
    diagnostics: [
      d("7일 이동 평균인데 휴일이 빠진 7개 관측을 사용합니다.", "ROWS 6 PRECEDING을 calendar 7일로 오해했습니다.", ["row timestamps/gaps", "ROWS/RANGE/interval support", "calendar relation", "missing fill policy"], "calendar/date spine을 만들고 기간 eligibility와 missing behavior를 정의합니다.", "missing-day·DST·late-event fixtures와 frame member ids를 둡니다."),
      d("첫 row의 변화율이 0%로 표시됩니다.", "LAG missing boundary를 zero/default로 합쳐 denominator/previous value를 위조했습니다.", ["row_number/hasPrevious", "source NULL", "LAG default", "division policy"], "previous missing을 NULL/status로 보존하고 계산 불가를 명시합니다.", "first/source-null/zero/negative previous fixtures를 고정합니다."),
    ],
    expertNotes: ["rolling metric metadata에는 frame type/width, observation grain, timezone, missing/late/rounding policy를 포함합니다.", "window 결과를 재집계할 때 row grain과 overlap을 고려해 평균의 평균 오류를 피합니다."],
  },
  {
    id: "topn-gaps-islands-sessionization",
    title: "top-N per group·gaps-and-islands·sessionization을 여러 window 단계로 구성합니다",
    lead: "복합 분석은 한 SELECT에 window를 중첩하기보다 CTE 단계마다 ordering signal, boundary flag와 group id를 만들면 검증하기 쉽습니다.",
    explanations: [
      "top-N per group은 ranking CTE에서 rn/rank를 계산한 뒤 outer filter로 제한합니다. 대부분 dialect에서 같은 SELECT WHERE가 window output보다 논리적으로 먼저이므로 alias를 직접 filter하지 않습니다.",
      "gaps-and-islands는 LAG로 이전 값과 연속성 차이를 계산하고 boundary flag의 running SUM으로 island id를 만듭니다. 연속의 domain 정의가 날짜 1일, id+1, 시간 threshold 중 무엇인지 명시합니다.",
      "sessionization은 user/tenant partition에서 event time gap>threshold를 새 session flag로 만들고 누적합으로 id를 부여합니다. 동률 time에 immutable event id를 붙이고 late/out-of-order events와 watermark를 다룹니다.",
      "window output을 다른 window input으로 사용할 때 CTE/subquery 단계가 필요합니다. 각 단계의 row grain은 유지되지만 flags/group ids가 추가되므로 intermediate results를 golden table로 검증합니다.",
      "top-N, islands와 sessions는 authorization/privacy를 강화해야 합니다. cross-tenant partition 누락, user activity re-identification과 작은 cohort export를 위협 모델에 포함합니다.",
    ],
    concepts: [
      c("boundary flag", "현재 row가 새 island/session을 시작하는지 0/1로 나타내는 값입니다.", ["LAG와 domain threshold로 계산합니다.", "첫 row policy를 둡니다."]),
      c("island id", "ordered boundary flags의 running sum으로 연속 구간을 식별하는 값입니다.", ["partition별로 재시작합니다.", "late data에 따라 바뀔 수 있습니다."]),
      c("top-N per partition", "각 group에서 ranking 의미에 따라 상위 rows/tiers를 선택하는 pattern입니다.", ["ROW_NUMBER/RANK cardinality를 구분합니다.", "outer filter 단계가 필요합니다."]),
    ],
    diagnostics: [
      d("window alias를 WHERE에 써서 오류가 나거나 예상보다 먼저 filter됩니다.", "SQL logical order에서 WHERE가 window 계산보다 앞입니다.", ["query blocks", "window alias scope", "outer CTE/subquery", "QUALIFY 지원 여부"], "ranking/flag를 CTE에서 계산하고 outer query에서 filter합니다.", "dialect별 generated SQL과 golden ids를 검증합니다."),
      d("late event가 들어오자 과거 session ids가 대량 변경됩니다.", "session id가 full history running sum이고 watermark/restatement/version 정책이 없습니다.", ["event-time order", "late arrival window", "published session ids", "downstream foreign references"], "stable external session identity 또는 versioned recomputation/restatement window를 설계합니다.", "out-of-order/late fixtures와 downstream reconciliation을 둡니다."),
    ],
    expertNotes: ["복합 window query는 CTE별 expected boundary flags와 group ids를 표로 제시하면 중간 궁금증만 봐도 이해할 수 있습니다.", "sessionization 결과는 행동 개인정보가 될 수 있으므로 access, retention과 minimum cohort를 설계합니다."],
  },
  {
    id: "window-performance-sort-spill-index",
    title: "partition sort·buffer·spill과 index/order reuse를 EXPLAIN actual로 검증합니다",
    lead: "window 함수는 rows를 보존하면서 partition/order/frame state를 계산하므로 큰 partition, wide rows와 여러 다른 window order가 sort·memory·temp를 지배할 수 있습니다.",
    explanations: [
      "plan에서 input filter, partition/order sort, window stages, temp/spill, rows/loops와 final sort를 구분합니다. CTE materialization과 window sort가 겹치는지 actual plan을 봅니다.",
      "equality filter/partition keys와 order tuple을 맞춘 composite index가 ordered input을 제공할 수 있지만 engine이 window sort를 생략하는지는 version/plan별로 확인합니다. wide covering index 비용도 함께 측정합니다.",
      "서로 다른 PARTITION/ORDER를 가진 여러 windows는 여러 sort를 요구할 수 있습니다. compatible windows를 named WINDOW/spec으로 공유하되 frame 차이와 함수 semantics가 같은지 검증합니다.",
      "largest tenant/user partition skew는 평균 partition 크기보다 중요합니다. max/p95 partition rows, row width, frame state, memory/temp와 concurrency를 representative fixtures로 측정합니다.",
      "top-N만 필요해도 window가 전체 partition을 rank할 수 있습니다. alternative lateral/correlated index lookup, precomputed summary 또는 engine-specific optimization을 정확성/complexity와 함께 비교합니다.",
    ],
    concepts: [
      c("window sort", "partition/order key에 따라 window input을 배열하는 plan operation입니다.", ["final display sort와 다를 수 있습니다.", "index ordering reuse를 확인합니다."]),
      c("partition skew", "일부 partition이 대부분 rows/memory/time을 차지하는 분포입니다.", ["max와 percentiles를 봅니다.", "tenant resource isolation과 연결합니다."]),
      c("window spill", "sort/frame state가 memory를 넘어서 temporary storage를 사용하는 실행 상태입니다.", ["latency/I/O가 급증할 수 있습니다.", "runtime counters를 관측합니다."]),
    ],
    diagnostics: [
      d("window query가 특정 tenant에서만 temp disk를 폭증시킵니다.", "largest partition skew와 wide row sort가 memory budget을 초과했습니다.", ["tenant별 partition rows/width", "actual sort/spill", "filter pushdown", "selected columns/index"], "권한/filter를 먼저 적용하고 narrow columns, 적절한 index와 partition/resource limit 또는 precompute를 사용합니다.", "largest-partition load test와 spill budget alert를 둡니다."),
      d("window를 하나 더 추가하자 sort가 두 배가 됩니다.", "새 window spec의 partition/order/direction이 기존 sort와 호환되지 않습니다.", ["window specs diff", "plan sort stages", "final order", "named window reuse"], "의미가 같다면 spec을 통합하고 다르면 query split/materialization 비용을 workload로 비교합니다.", "critical query plan shape와 sort/spill count regression을 둡니다."),
    ],
    expertNotes: ["window performance acceptance는 반환 rows뿐 아니라 input/partition cardinality, sort bytes, spill과 concurrency를 포함합니다.", "index 추가는 ranking read gain과 insert/update/storage/cache cost를 함께 capacity review합니다."],
  },
  {
    id: "engine-portability-window-operations",
    title: "MySQL·Oracle·SQLite 차이와 versioned analytics 운영·검증을 통합합니다",
    lead: "WITH RECURSIVE syntax, recursion controls, frame/exclusion, NULL ordering과 optimizer behavior가 엔진마다 달라 동일 SQL text보다 semantic conformance가 중요합니다.",
    explanations: [
      "MySQL WITH RECURSIVE와 Oracle subquery factoring/recursive 기능의 syntax·type inference·cycle/depth controls를 공식 문서로 비교합니다. anchor의 좁은 string type 때문에 recursive path가 overflow될 수 있어 explicit cast와 long-path fixtures를 둡니다.",
      "window functions/frame 지원, default NULL ordering, RANGE/GROUPS/exclusion와 named window syntax를 compatibility matrix에 기록합니다. unsupported feature는 equivalent query의 method와 performance 차이를 승인합니다.",
      "SQLite examples는 exact small semantics를 보여 주지만 production MySQL/Oracle의 parallelism, temp tablespaces, numeric/JSON types와 optimizer를 대신하지 않습니다. engine/driver versions를 output evidence에 포함합니다.",
      "analytics definition에는 input population, grain, partition/order/frame, ranking/tie, recursion anchor/edge/cycle/budget, timezone/unit/rounding와 owner/version을 둡니다. SQL hash만으로 semantic version을 대체하지 않습니다.",
      "운영 관측에는 source/eligible/partition counts, max depth/expanded/cycle/limit reason, sort/spill/latency, window/CTE plan hash, watermark/version과 reconciliation status를 남기되 raw path/user labels는 제외합니다.",
    ],
    concepts: [
      c("analytic conformance matrix", "동일 fixtures에서 CTE/window 의미·type·order·frame·limits가 engine별 계약을 만족하는지 기록한 표입니다.", ["syntax만 비교하지 않습니다.", "approved differences를 명시합니다."]),
      c("analytics definition version", "population·partition/order/frame/recursion/tie semantics가 호환되는 범위입니다.", ["backfill/restatement와 연결합니다.", "consumer metric label을 보호합니다."]),
      c("analytics reconciliation", "source ids/counts와 partitions/ranks/window outputs/recursive paths가 정의된 invariants와 일치함을 확인하는 과정입니다.", ["intermediate CTE evidence를 씁니다.", "partial/truncated 상태를 구분합니다."]),
    ],
    diagnostics: [
      d("엔진 이관 후 recursive path가 잘리거나 error가 납니다.", "anchor가 path column type/length를 좁게 추론하거나 string aggregation limits가 다릅니다.", ["anchor CAST/type metadata", "max path depth/bytes", "driver mapping", "engine recursion limit"], "portable 충분한 type/cast와 explicit depth/byte budget을 정의하고 long-path fixtures를 실행합니다.", "engine matrix에 type inference와 boundary depth를 포함합니다."),
      d("metric 값이 배포 후 달라졌지만 SQL diff만으로 이유를 찾지 못합니다.", "partition/frame/tie/watermark 또는 source population semantics가 version 없이 변경됐습니다.", ["definition version diff", "intermediate counts", "plan/engine upgrade", "late-data restatement"], "새 analytics version을 dual-run하고 historical golden data와 reconciliation한 뒤 atomic publish합니다.", "semantic diff/replay와 previous-version rollback을 release gate로 둡니다."),
    ],
    expertNotes: ["window/recursive results에는 complete/truncated, definition/watermark와 engine version을 설명 가능한 metadata로 둡니다.", "rollout은 staging calculation→intermediate reconciliation→consumer readback→atomic pointer 전환→rollback 보존 순서로 운영합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0203", repository: "dbstudy", path: "02_03.sql", usedFor: ["aggregate, paging, join and view progression; explicit CTE/window source gap"], evidence: "원본을 read-only로 확인했으며 CTE/window 직접 예제가 없음을 보강 범위로 기록했습니다." },
  { id: "mysql-with", repository: "MySQL 8.4 Reference Manual", path: "WITH (Common Table Expressions)", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/with.html", usedFor: ["nonrecursive/recursive CTE syntax, type and recursion boundaries"], evidence: "MySQL 공식 WITH 문서입니다." },
  { id: "mysql-window", repository: "MySQL 8.4 Reference Manual", path: "Window Function Concepts and Syntax", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/window-functions-usage.html", usedFor: ["partition, order, frames and window evaluation"], evidence: "MySQL 공식 window syntax 문서입니다." },
  { id: "mysql-window-descriptions", repository: "MySQL 8.4 Reference Manual", path: "Window Function Descriptions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/window-function-descriptions.html", usedFor: ["ROW_NUMBER, RANK, DENSE_RANK, LAG and LEAD"], evidence: "MySQL 공식 window 함수 문서입니다." },
  { id: "oracle-select", repository: "Oracle Database 26ai SQL Language Reference", path: "SELECT / subquery factoring", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["Oracle CTE, recursive and query-block portability"], evidence: "Oracle 공식 SELECT 문서입니다." },
  { id: "oracle-row-number", repository: "Oracle Database 26ai SQL Language Reference", path: "ROW_NUMBER", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/ROW_NUMBER.html", usedFor: ["deterministic ranking and top-N"], evidence: "Oracle 공식 ROW_NUMBER 문서입니다." },
  { id: "oracle-analytic", repository: "Oracle Database 26ai SQL Language Reference", path: "Analytic Functions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Analytic-Functions.html", usedFor: ["partition/order/frame and evaluation semantics"], evidence: "Oracle 공식 analytic functions 문서입니다." },
  { id: "sqlite-with", repository: "SQLite Documentation", path: "The WITH Clause", publicUrl: "https://www.sqlite.org/lang_with.html", usedFor: ["exact CTE and recursive laboratory"], evidence: "SQLite 공식 WITH 문서입니다." },
  { id: "sqlite-window", repository: "SQLite Documentation", path: "Window Functions", publicUrl: "https://www.sqlite.org/windowfunctions.html", usedFor: ["exact ranking and frame laboratory"], evidence: "SQLite 공식 window functions 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["query block, ordering and compound semantics"], evidence: "SQLite 공식 SELECT 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["small-lab index and plan limitations"], evidence: "SQLite 공식 query planner 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-17-cte-window-supplement", slug: "sql-17-cte-window-supplement", courseId: "database", moduleId: "db-joins-subqueries", order: 8,
  title: "CTE·재귀 CTE·윈도 함수 전문가 보강", subtitle: "WITH와 window를 grain·termination·cycle·tie·frame·plan·이식·운영 계약으로 완성합니다.", level: "전문가", estimatedMinutes: 960,
  coreQuestion: "복잡한 관계 변환·재귀 graph·ranking과 이동 통계를 중복·무한 재귀·비결정 순서·frame 오류·resource 폭발 없이 설명하고 검증하려면 무엇을 고정해야 할까요?",
  summary: "dbstudy 02_03.sql의 aggregate/paging/join/view progression을 read-only로 감사하고 직접 CTE/window 예제가 없는 gap을 명시합니다. named relation/grain pipeline, optimizer inlining/materialization, recursive anchor/step/termination과 cycle/resource safety, ROW_NUMBER/RANK/DENSE_RANK tie semantics, PARTITION/ORDER/ROWS·RANGE frames, rolling/LAG, top-N/gaps/islands/sessionization, sort/spill/index와 MySQL·Oracle·SQLite conformance/operations까지 전문가 보강합니다. 다섯 exact Python/SQLite examples는 CTE aggregate, recursive tree, cycle guard, ranking ties와 ROWS/RANGE peers를 실행합니다.",
  objectives: ["CTE 단계의 population·grain·keys와 optimizer materialization boundary를 설명한다.", "재귀 anchor/step/termination/cycle/row-depth-time budget을 설계한다.", "ROW_NUMBER·RANK·DENSE_RANK의 tie/cardinality 차이를 적용한다.", "PARTITION·ORDER·ROWS/RANGE frame과 total order를 검증한다.", "running/rolling/LAG·top-N·gaps-and-islands/sessionization을 단계별로 구성한다.", "sort/spill/index/partition skew와 dialect conformance를 측정한다.", "version/watermark/reconciliation/privacy-safe operations를 운영한다."],
  prerequisites: [{ title: "페이징과 COUNT", reason: "total order, tie-breaker, snapshot과 keyset boundary를 이해해야 ranking/window ordering을 정확히 설계할 수 있습니다.", sessionSlug: "sql-16-pagination-count-query" }],
  keywords: ["WITH", "CTE", "recursive CTE", "anchor", "cycle detection", "ROW_NUMBER", "RANK", "DENSE_RANK", "PARTITION BY", "ROWS", "RANGE", "LAG", "running total", "gaps and islands", "sessionization", "window spill"], topics,
  lab: {
    title: "조직 hierarchy와 학습 event analytics를 안전하게 계산하기",
    scenario: "tenant별 조직 graph를 cycle-safe하게 펼치고 learner event에서 latest row, top-N, rolling completion, activity sessions를 계산합니다. malformed cycles, ties, late events와 largest partition이 존재합니다.",
    setup: ["synthetic tenant/node/edge/event ids와 tree/cycle/diamond/deep/skew/tie/late fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 representative indexes/stats를 준비합니다.", "각 CTE grain/key, recursion cycle/budget, window partition/order/frame/tie/watermark definition을 작성합니다.", "expected intermediate ids/depth/path/ranks/frame members와 canonical outputs를 고정합니다."],
    steps: ["authorized input→normalized→aggregate CTE별 ids/count/grain을 readback합니다.", "CTE inline/materialize plans의 scans/loops/filter pushdown/temp를 비교합니다.", "anchor/recursive step의 iteration depth/frontier와 termination invariant를 검증합니다.", "self/2-node/diamond/deep/high-branch graph에서 visited/cycle/budget/partial status를 검증합니다.", "ROW_NUMBER/RANK/DENSE_RANK tie groups와 exact/include-ties top-N cardinality를 비교합니다.", "PARTITION/ORDER/ROWS/RANGE의 frame member ids와 running values를 검증합니다.", "calendar gaps, LAG boundary, zero/NULL/late events와 restatement를 처리합니다.", "top-N/gaps/islands/sessionization CTE별 boundary flags/group ids를 golden table과 비교합니다.", "largest partition의 EXPLAIN actual sort/spill/rows/memory/latency와 index/write cost를 측정합니다.", "MySQL·Oracle conformance, source→partition/rank/path reconciliation과 versioned atomic publish를 readback합니다."],
    expectedResult: ["CTE intermediate/final relations가 문서화한 grain·keys·authorization과 일치합니다.", "재귀 traversal이 cycle/depth/row/time budget에서 완전 또는 명시적 incomplete 상태로 종료합니다.", "ranking/window 결과가 tie/frame/boundary golden fixtures와 정확히 일치합니다.", "engine별 approved plan/sort/spill/latency budget과 semantic matrix를 만족합니다.", "metric/version/watermark/reconciliation/rollback telemetry가 raw path·PII 없이 운영됩니다."],
    cleanup: ["isolated schemas·synthetic graph/events와 staged reports/cache를 run id로 제거합니다.", "temporary credentials/exports를 revoke·삭제합니다.", "logs에 raw node/user labels와 traversal paths가 없는지 검사합니다.", "production source files/data는 변경하지 않습니다."],
    extensions: ["strongly connected components와 transitive closure materialization을 비교합니다.", "approximate/streaming window state와 late-event retractions를 구현합니다.", "distributed partition/shuffle/skew와 merge correctness를 검증합니다.", "Oracle CYCLE/SEARCH와 MySQL manual path guard의 conformance를 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 CTE grain, recursive frontier/path, ranks와 frame members를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "eligible/aggregate CTE grain을 구분합니다.", "anchor/recursive/termination을 설명합니다.", "cycle guard가 3→1을 막는 근거를 추적합니다.", "rank/dense gaps를 계산합니다.", "ROWS/RANGE peer membership을 비교합니다."], hints: ["최종 숫자보다 각 current row가 본 input ids를 먼저 적으세요."], expectedOutcome: "CTE/window를 문법 암기가 아니라 관계·state·order/frame contract로 설명합니다.", solutionOutline: ["relation grain→recursion state→ranking tie→frame members→plan→operations 순서입니다."] },
    { difficulty: "응용", prompt: "원본 aggregate/paging 흐름을 hierarchy+event analytics pipeline으로 확장하세요.", requirements: ["원본 direct CTE/window gap provenance를 보존합니다.", "각 CTE keys/grain/auth를 문서화합니다.", "cycle/depth/row/time/incomplete policy를 구현합니다.", "ranking total order와 top-N tie policy를 둡니다.", "rolling/calendar/LAG/sessionization frame을 정의합니다.", "late watermark/version/restatement를 운영합니다.", "MySQL·Oracle plan/semantic matrix를 실행합니다.", "reconciliation/privacy-safe telemetry/atomic publish/rollback을 포함합니다."], hints: ["한 query로 압축하기보다 intermediate evidence가 설명 가능한 단계를 우선하세요."], expectedOutcome: "정확성·안전성·성능·이식성·운영성이 검증된 analytics pipeline이 완성됩니다.", solutionOutline: ["source audit→CTE contracts→adversarial graph/time tests→plans→publish/readback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 CTE·recursive·window SQL 표준을 작성하세요.", requirements: ["CTE naming/grain/keys/auth/inlining evidence를 정의합니다.", "anchor/step/termination/cycle/partial/resource budgets를 둡니다.", "partition/order/tie/frame/null/timezone/rounding schema를 정의합니다.", "top-N/gaps/session/late-data version rules를 둡니다.", "engine conformance와 type/depth/frame matrix를 요구합니다.", "sort/spill/skew/index/write/latency budgets를 정의합니다.", "reconciliation/telemetry/privacy/access/retention을 포함합니다.", "staging/atomic publish/backfill/rollback runbook을 정의합니다."], hints: ["WITH를 썼다는 사실과 한 번 계산된다는 사실은 같지 않습니다."], expectedOutcome: "초급 CTE부터 운영 graph/window analytics까지 일관된 전문가 governance가 완성됩니다.", solutionOutline: ["define→bound→order→compute→reconcile→measure→publish→observe→correct 순서입니다."] },
  ],
  nextSessions: ["db-09-view-security-updatability"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_03.sql의 aggregate/paging/join/view progression을 read-only로 확인했으며 CTE, recursive CTE와 window function active examples가 없음을 전문가 보강 gap으로 기록했습니다.", "원본 sample names/literals는 복사하지 않고 preceding SQL progression과 explicit absence만 provenance로 사용했습니다.", "공식 MySQL·Oracle·SQLite 문서와 synthetic examples로 CTE grain/optimizer, recursion/cycle/budgets, ranking/ties, frames/window analytics와 plan/operations를 보완했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai의 recursive type inference, cycle facilities, parallel/window plan, memory/temp와 isolation behavior를 대체하지 않습니다."] },
});

export default session;
