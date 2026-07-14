import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "sqlite3 memory DB와 synthetic distribution을 구성해 production 값·credential 없이 query shape를 재현합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "EXPLAIN QUERY PLAN을 SEARCH/SCAN/COVERING/TEMP flags로 정규화하거나 statement/result cardinality를 직접 계수합니다." },
      { lines: "마지막 5줄", explanation: "same-results, plan/work counters와 ids만 출력합니다. MySQL EXPLAIN ANALYZE·Oracle DBMS_XPLAN의 timing/I/O는 별도 environment에서 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite의 요약 plan은 MySQL·Oracle actual rows/loops/I/O/memory/locks evidence를 대체하지 않습니다."] },
    experiments: [
      { change: "row count·skew·bind·join multiplicity·cache state와 index를 바꿉니다.", prediction: "같은 SQL text도 estimates, chosen plan과 work가 달라집니다.", result: "result equivalence를 먼저 지키고 estimated/actual rows, loops, I/O/temp/latency를 비교합니다." },
      { change: "한 번에 한 가지 query/index/stats change만 적용하고 되돌립니다.", prediction: "개선 원인과 부작용을 분리할 수 있습니다.", result: "baseline→hypothesis→change→same-result→representative benchmark→canary evidence를 남깁니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "performance-contract-before-plan",
    title: "EXPLAIN 전에 correctness·workload·SLO·resource 성능 계약을 고정합니다",
    lead: "느리다는 말만으로 query를 고치면 결과 의미를 바꾸거나 테스트 한 번만 빠른 변경을 만들기 쉽습니다.",
    explanations: [
      "원본 USERS.sql은 7개 identity/security tables와 19개 explicit secondary indexes, Trip.sql은 31개 tables·31 primary keys·25 unique·40 secondary keys·41 foreign keys의 큰 관계 graph를 보여 줍니다. 공개 자료는 구조/count만 쓰고 실제 user/token/request/travel values는 복사하지 않습니다.",
      "성능 계약은 exact result grain/ids/order, authorization/filter/snapshot, representative bind distributions와 row widths, p50/p95/p99 latency, throughput/concurrency, rows examined/I/O/temp/memory/locks와 timeout/cancel을 포함합니다.",
      "환경에는 engine/driver/schema/index/stats/config version, hardware/storage, buffer/cache warmness, replicas와 concurrent workload를 기록합니다. laptop 10 rows 결과를 production 승인 근거로 쓰지 않습니다.",
      "baseline query fingerprint와 bound value class는 남기되 raw email/token/search/PII는 redact/bucket합니다. query text 자체에도 literal secrets가 없도록 parameter binding을 유지합니다.",
      "개선 우선순위는 전체 endpoint/job critical path의 cumulative time·frequency·resource와 user impact로 정합니다. 가장 느린 단일 execution보다 자주 실행되는 N+1이 더 큰 비용일 수 있습니다.",
    ],
    concepts: [
      c("performance contract", "정확한 결과와 workload context에서 허용 latency·throughput·resource를 수치로 정한 기준입니다.", ["correctness와 authorization을 포함합니다.", "percentiles와 concurrency를 사용합니다."]),
      c("query fingerprint", "literal을 제거/정규화해 같은 query shape를 집계하는 식별자입니다.", ["raw sensitive binds를 저장하지 않습니다.", "plan/latency lineage에 사용합니다."]),
      c("representative workload", "row counts/width, distributions, binds, cache와 concurrency가 실제 운영 범위를 재현하는 workload입니다.", ["hot/cold/skew를 포함합니다.", "synthetic/anonymized로 만듭니다."]),
    ],
    diagnostics: [
      d("개발 DB에서는 5ms인데 운영에서 5초입니다.", "data volume/skew, row width, cache/concurrency와 stats가 대표적이지 않습니다.", ["row/partition cardinality", "bind distribution", "cold/warm cache", "concurrent load and hardware"], "anonymized/synthetic production-like distribution으로 baseline과 actual plan을 재현합니다.", "volume/skew/cache/concurrency matrix를 performance gate로 둡니다."),
      d("튜닝 후 빨라졌지만 일부 rows가 사라집니다.", "DISTINCT/filter/join rewrite가 target grain이나 NULL/authorization semantics를 바꿨습니다.", ["before/after ordered ids", "NULL/duplicate/tie fixtures", "tenant/policy predicates", "snapshot"], "result equivalence와 domain invariants를 먼저 복원하고 성능 변경을 한 가지씩 적용합니다.", "golden ids/checksums와 negative authorization tests를 gate로 둡니다."),
    ],
    expertNotes: ["plan은 성능 원인 evidence이지 correctness 정의가 아닙니다. 결과 계약을 먼저 고정합니다.", "local schema로 distribution shape를 만들되 raw USERS/Trip values는 benchmark seed나 logs로 옮기지 않습니다."],
  },
  {
    id: "explain-versus-explain-analyze",
    title: "EXPLAIN estimates와 EXPLAIN ANALYZE actual 실행 증거·위험을 구분합니다",
    lead: "estimated plan은 실행하지 않을 수 있고 actual 분석은 query를 실제 실행하므로 DML·expensive query·locks에 안전 경계가 필요합니다.",
    explanations: [
      "EXPLAIN은 optimizer estimates, join/access/order와 cost를 보여 주지만 actual row counts, loops와 wall/I/O를 보장하지 않습니다. estimate error가 다음 plan 선택을 어떻게 왜곡했는지 추적합니다.",
      "MySQL EXPLAIN ANALYZE와 Oracle DBMS_XPLAN DISPLAY_CURSOR ALLSTATS LAST 등 actual evidence는 실행된 cursor의 rows/starts/time/buffers를 보여 줍니다. syntax와 overhead는 version별 공식 문서로 확인합니다.",
      "DML 분석은 실제 변경·trigger·locks를 만들 수 있습니다. production에서 무심코 실행하지 말고 read-only replica, rollback 가능한 isolated transaction과 승인된 statement/time/resource limits를 사용합니다.",
      "timing instrumentation 자체 overhead, parallel worker aggregation, cache warming과 early termination을 해석합니다. 한 번의 actual time을 stable benchmark로 오해하지 않습니다.",
      "plan capture에는 SQL/query id, child cursor/plan hash, bind class, schema/stats/config version과 timestamp를 연결합니다. text plan만 붙여 맥락을 잃지 않습니다.",
    ],
    concepts: [
      c("estimated cardinality", "optimizer가 operation에서 예상하는 rows 수입니다.", ["statistics/assumptions에 의존합니다.", "actual과 차이를 진단합니다."]),
      c("actual rows and loops", "실제 execution에서 operation이 출력한 rows와 반복 시작 횟수입니다.", ["cumulative work를 계산합니다.", "join inner loops를 해석합니다."]),
      c("instrumentation safety", "actual execution이 데이터·locks·resource에 미칠 영향을 통제하는 절차입니다.", ["DML/volatile query를 격리합니다.", "timeout/cancel과 rollback을 둡니다."]),
    ],
    diagnostics: [
      d("EXPLAIN cost가 낮은데 실제로 매우 느립니다.", "estimate error, I/O/cache, loops, spill/lock 또는 remote/application work가 cost/estimated plan에 드러나지 않았습니다.", ["actual rows/loops", "buffers/I/O/temp", "lock/wait profile", "end-to-end query count/network"], "safe actual plan과 wait/resource evidence를 수집해 첫 큰 divergence를 고칩니다.", "estimated/actual error ratio와 resource/wait budgets를 관측합니다."),
      d("운영에서 분석하다 data가 바뀌거나 lock incident가 납니다.", "actual-plan command가 statement를 실행한다는 위험을 무시했습니다.", ["statement type/triggers", "transaction/autocommit", "target environment", "timeout/lock footprint"], "read-only/clone/replay 또는 rollback-isolated 승인 절차로 전환하고 production capture는 최소화합니다.", "DML explain safety checklist와 abort drill을 둡니다."),
    ],
    expertNotes: ["actual plan도 그 실행의 evidence일 뿐이며 representative bind/cache/concurrency 반복이 필요합니다.", "plan artifacts에 literals/PII가 포함되지 않도록 capture/export/redaction을 검증합니다."],
  },
  {
    id: "scan-search-access-path",
    title: "full scan·index search·range·lookup·covering을 rows examined/returned로 읽습니다",
    lead: "SCAN은 항상 나쁘고 SEARCH는 항상 좋다는 규칙 대신 읽을 population 비율, row width, locality와 lookup 비용을 비교합니다.",
    explanations: [
      "full scan은 대부분 rows를 읽거나 table이 작고 sequential I/O가 유리할 때 합리적입니다. broad index lookup은 random base-row fetch 때문에 더 비쌀 수 있습니다.",
      "index access condition은 시작/끝 range를 만들고 residual predicate는 후보를 다시 거릅니다. plan의 key 이름만 보지 말고 어떤 columns/operators가 access와 filter에 쓰였는지 확인합니다.",
      "secondary index search 뒤 table lookup, covering/index-only path와 clustered primary access의 차이를 logical/physical reads와 row widths로 측정합니다.",
      "rows examined/returned 비율이 큰 곳은 missing predicate/index, low selectivity 또는 residual filter 신호입니다. 그러나 authorization/soft-delete 조건을 제거해 비율을 개선하지 않습니다.",
      "before/after index에서 ordered result ids/counts가 같고 plan/work가 개선됐음을 증명합니다. stats refresh/cache warming과 index build cost를 따로 기록합니다.",
    ],
    concepts: [
      c("full scan", "relation 또는 index의 넓은 범위를 순차적으로 읽는 access path입니다.", ["항상 결함은 아닙니다.", "bytes/rows와 sequential efficiency를 봅니다."]),
      c("range search", "index key boundary에서 시작해 해당 range entries만 읽는 access path입니다.", ["access predicate를 확인합니다.", "residual filter가 남을 수 있습니다."]),
      c("filter efficiency", "examined candidates 중 result로 남는 비율과 그 비용입니다.", ["rows/bytes를 함께 봅니다.", "보안 predicates를 보존합니다."]),
    ],
    codeExamples: [py("db16-scan-to-search", "index 전 SCAN과 후 SEARCH의 같은 결과 검증", "db16_scan_search.py", "tenant/status query가 composite index 추가 전 scan, 후 search를 쓰면서 ids는 완전히 같음을 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE task(id INTEGER PRIMARY KEY, tenant TEXT, status TEXT)")
db.executemany("INSERT INTO task VALUES (?, ?, ?)", [(1, "t1", "open"), (2, "t1", "done"), (3, "t2", "open"), (4, "t1", "open")])
sql = "SELECT id FROM task WHERE tenant = ? AND status = ? ORDER BY id"
args = ("t1", "open")
before_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, args))
before_ids = [row[0] for row in db.execute(sql, args)]
db.execute("CREATE INDEX idx_task_tenant_status ON task(tenant, status)")
after_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, args))
after_ids = [row[0] for row in db.execute(sql, args)]
print("before-scan=" + str("SCAN" in before_plan).lower())
print("after-search=" + str("SEARCH" in after_plan).lower())
print("uses-index=" + str("idx_task_tenant_status" in after_plan).lower())
print("ids=" + ",".join(map(str, after_ids)))
print("same-results=" + str(before_ids == after_ids).lower())`, "before-scan=true\nafter-search=true\nuses-index=true\nids=1,4\nsame-results=true", ["mysql-explain", "oracle-access-paths", "sqlite-eqp"]),
    ],
    diagnostics: [
      d("index search인데 rows examined가 반환 rows보다 수천 배 큽니다.", "low-selectivity prefix 또는 residual filter가 대부분 candidates를 버립니다.", ["access vs filter predicates", "key order/selectivity", "examined/returned by bind", "covering/base lookups"], "query shape/key order/stats를 조정하거나 broad scan이 더 나은지 actual work로 비교합니다.", "hot/cold/broad binds의 examined/returned budget을 둡니다."),
      d("full scan을 억지로 index hint했더니 더 느려집니다.", "large result에서 random lookup/poor locality가 sequential scan보다 비쌉니다.", ["result fraction/row width", "logical/physical reads", "cache state", "hint ownership/expiry"], "hint를 제거하고 projection/filter/partition/precompute를 workload로 검토합니다.", "scan/index alternatives를 cold/warm volume에서 benchmark합니다."),
    ],
    expertNotes: ["plan node label보다 access boundary, rows/loops, bytes/I/O와 result equivalence를 읽습니다.", "index 변경은 DB15의 write/storage/lock/lifecycle 비용을 함께 승인합니다."],
  },
  {
    id: "join-order-cardinality-fanout",
    title: "join order·estimated/actual cardinality·loops와 fan-out의 첫 divergence를 찾습니다",
    lead: "여러 table query는 앞 단계의 작은 estimate error가 inner operation 반복과 intermediate rows를 폭발시킬 수 있습니다.",
    explanations: [
      "optimizer는 join graph, filters, indexes와 estimates로 access/join order를 고릅니다. SQL text table 순서와 physical join order를 동일시하지 않으며 outer join/semantics reorder 제약을 확인합니다.",
      "nested-loop에서 inner operation actual rows가 outer loops만큼 반복됩니다. per-loop rows가 작아도 starts/loops 곱의 cumulative work가 큰지 봅니다.",
      "1:N child 두 개를 동시에 join하면 N×M fan-out이 생겨 rows, sort/aggregate와 network를 증식시킵니다. target grain을 정의하고 EXISTS, pre-aggregation, separate batch fetch를 비교합니다.",
      "foreign key·unique·NOT NULL constraints와 multi-column stats는 cardinality 근거를 줄 수 있습니다. 데이터 계약이 실제로 강제되지 않은 상태에서 optimizer/reviewer가 uniqueness를 가정하지 않습니다.",
      "estimate와 actual rows가 처음 크게 갈라지는 operation의 data/skew/predicate/stats를 고칩니다. 마지막 느린 sort만 튜닝하면 upstream fan-out을 숨길 수 있습니다.",
    ],
    concepts: [
      c("join cardinality", "두 input 관계를 조건으로 결합한 output row 수와 target grain입니다.", ["0/1/N multiplicity를 봅니다.", "entity count와 join row count를 구분합니다."]),
      c("join loops", "physical join에서 inner operation이 outer rows에 따라 반복 시작된 횟수입니다.", ["cumulative work를 계산합니다.", "batched/hash alternatives를 비교합니다."]),
      c("cardinality divergence", "estimated rows와 actual rows가 처음 큰 비율로 달라지는 plan 지점입니다.", ["root cause 후보입니다.", "stats/constraints/correlation을 조사합니다."]),
    ],
    codeExamples: [py("db16-join-fanout", "독립 child join fan-out과 EXISTS entity grain 비교", "db16_fanout.py", "하나의 parent에 tags 2개와 notes 3개가 있을 때 raw join 6 rows와 EXISTS parent 1 row를 비교합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE parent(id INTEGER PRIMARY KEY);
CREATE TABLE tag(id INTEGER PRIMARY KEY, parent_id INTEGER);
CREATE TABLE note(id INTEGER PRIMARY KEY, parent_id INTEGER);
""")
db.execute("INSERT INTO parent VALUES (1)")
db.executemany("INSERT INTO tag VALUES (?, 1)", [(1,), (2,)])
db.executemany("INSERT INTO note VALUES (?, 1)", [(1,), (2,), (3,)])
fanout = db.execute("SELECT p.id, t.id, n.id FROM parent p JOIN tag t ON t.parent_id=p.id JOIN note n ON n.parent_id=p.id").fetchall()
entities = db.execute("SELECT p.id FROM parent p WHERE EXISTS(SELECT 1 FROM tag t WHERE t.parent_id=p.id) AND EXISTS(SELECT 1 FROM note n WHERE n.parent_id=p.id)").fetchall()
print(f"fanout-rows={len(fanout)}")
print("fanout-parent-ids=" + ",".join(str(row[0]) for row in fanout))
print(f"entity-rows={len(entities)}")
print("entity-ids=" + ",".join(str(row[0]) for row in entities))
print("grain-preserved=" + str(entities == [(1,)]).lower())`, "fanout-rows=6\nfanout-parent-ids=1,1,1,1,1,1\nentity-rows=1\nentity-ids=1\ngrain-preserved=true", ["local-trip", "mysql-optimization", "oracle-query-optimizer", "sqlite-queryplanner"]),
    ],
    diagnostics: [
      d("join 뒤 sort/aggregate 메모리가 예상보다 수십 배 큽니다.", "upstream independent 1:N joins가 fan-out을 만들었습니다.", ["target grain", "child match counts", "first cardinality jump", "EXISTS/pre-aggregation alternatives"], "parent ids/grain을 먼저 고정하고 child를 EXISTS/pre-aggregate/batch fetch합니다.", "0/1/N×0/1/M fixtures와 id/count reconciliation을 둡니다."),
      d("join order가 hot bind에서만 나쁩니다.", "correlated/skewed filters의 estimate가 평균 stats와 달라 inner loops가 폭발했습니다.", ["bind class", "estimated/actual first divergence", "multi-column stats", "alternative join/access"], "representative stats/query/index를 개선하고 hot/cold plan strategy를 검증합니다.", "top-volume/rare bind actual-plan matrix를 둡니다."),
    ],
    expertNotes: ["Trip schema처럼 관계가 많은 query는 target entity grain과 zero/one/many edges를 먼저 표로 그립니다.", "DISTINCT로 fan-out을 숨기면 work는 이미 발생하고 합법적 동일 값도 잃을 수 있습니다."],
  },
  {
    id: "sort-group-temp-spill",
    title: "ORDER BY·GROUP BY·DISTINCT·window의 sort/hash/temp/spill을 진단합니다",
    lead: "result rows가 적어도 upstream rows를 정렬·그룹화해야 하면 memory/temp I/O가 query 비용을 지배할 수 있습니다.",
    explanations: [
      "plan에서 explicit sort, temporary table, hash/sort aggregate, window sort와 spill/disk signal을 찾습니다. input rows/width, key width, groups/peers와 memory grant/budget을 함께 봅니다.",
      "matching index order가 sort를 줄일 수 있지만 filter/order direction/collation/NULL과 total tie-breaker가 맞아야 합니다. broad scan vs index lookup과 write 비용을 함께 비교합니다.",
      "GROUP BY/DISTINCT를 fan-out 수리로 추가하면 잘못된 upstream rows를 모두 만든 뒤 sort/hash합니다. target grain과 joins를 먼저 고칩니다.",
      "큰 text/JSON payload를 SELECT에 포함한 채 sort하면 row width와 temp를 키웁니다. ids/order keys를 먼저 page/rank한 뒤 bounded details를 fetch하는 late materialization을 검증합니다.",
      "spill은 평균이 아니라 largest tenant/group, concurrency와 memory pressure에서 발생합니다. temp tablespace/disk headroom, timeout/cancel과 workload admission을 운영합니다.",
    ],
    concepts: [
      c("sort operation", "input rows를 key 순서로 재배열하는 memory/temp 작업입니다.", ["input cardinality/width가 비용을 좌우합니다.", "index ordering으로 줄일 수 있습니다."]),
      c("temporary B-tree/table", "정렬·그룹·중간 결과를 위해 만든 임시 구조입니다.", ["memory 또는 disk에 있을 수 있습니다.", "plan/runtime signal을 봅니다."]),
      c("spill", "operation state가 memory budget을 넘어 temporary disk로 내려가는 현상입니다.", ["latency/I/O가 급증합니다.", "concurrency와 함께 예산화합니다."]),
    ],
    codeExamples: [py("db16-sort-elimination", "ORDER BY temp B-tree 전후 index ordering 비교", "db16_sort.py", "tenant 내 created DESC,id DESC query가 index 전에는 temporary sort, 후에는 ordered search를 사용하며 ids가 같은지 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE activity(id INTEGER PRIMARY KEY, tenant TEXT, created INTEGER)")
db.executemany("INSERT INTO activity VALUES (?, ?, ?)", [(1, "t1", 10), (2, "t1", 30), (3, "t2", 40), (4, "t1", 20)])
sql = "SELECT id FROM activity WHERE tenant = ? ORDER BY created DESC, id DESC"
args = ("t1",)
before = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, args))
before_ids = [row[0] for row in db.execute(sql, args)]
db.execute("CREATE INDEX idx_activity_order ON activity(tenant, created DESC, id DESC)")
after = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, args))
after_ids = [row[0] for row in db.execute(sql, args)]
print("before-temp-sort=" + str("TEMP B-TREE" in before).lower())
print("after-temp-sort=" + str("TEMP B-TREE" in after).lower())
print("after-index-search=" + str("idx_activity_order" in after and "SEARCH" in after).lower())
print("ids=" + ",".join(map(str, after_ids)))
print("same-results=" + str(before_ids == after_ids == [2, 4, 1]).lower())`, "before-temp-sort=true\nafter-temp-sort=false\nafter-index-search=true\nids=2,4,1\nsame-results=true", ["mysql-explain", "oracle-access-paths", "sqlite-eqp"]),
    ],
    diagnostics: [
      d("ORDER BY LIMIT 20 query가 큰 temp file을 만듭니다.", "filter 후 rows가 많고 matching total-order index가 없어 전체 후보를 정렬합니다.", ["sort input rows/width", "top-N optimization", "filter/order index match", "payload columns"], "narrow ordered index/late materialization 또는 bounded search architecture를 workload로 검증합니다.", "largest bind에서 temp/rows/latency budget을 둡니다."),
      d("메모리를 늘리면 한 query는 빨라지지만 서버 전체가 불안정합니다.", "per-operation grant 증가가 concurrent queries의 aggregate memory를 초과합니다.", ["concurrency×grant", "spill vs OOM", "largest groups", "admission/timeout"], "query/grain/index를 먼저 고치고 workload-level memory/admission budget을 설정합니다.", "concurrent stress에서 memory/temp/p99와 cancel recovery를 검증합니다."),
    ],
    expertNotes: ["sort elimination index의 read gain과 DB15의 write/storage/online build 비용을 같이 승인합니다.", "temp/spill telemetry에 raw sort keys나 PII를 남기지 않고 bytes/rows/operation/fingerprint만 기록합니다."],
  },
  {
    id: "sargability-stats-bind-skew",
    title: "sargability·statistics·correlation·bind skew에서 estimate 오류를 진단합니다",
    lead: "함수/형변환과 stale/불충분 statistics는 optimizer가 access path와 join order를 잘못 평가하게 만들며 parameter 값에 따라 최적 plan도 달라집니다.",
    explanations: [
      "column을 LOWER/DATE/CAST로 감싸거나 type/collation이 다른 bind를 비교하면 original index range를 만들지 못할 수 있습니다. equivalent result를 유지하며 canonical value, half-open range 또는 expression index로 바꿉니다.",
      "table/index statistics는 row count, distinct values, distribution/histogram과 correlation 정보를 optimizer에 제공합니다. 대량 적재·delete·skew 변화 후 stats age와 sample을 확인합니다.",
      "tenant/status처럼 correlated columns는 독립 selectivity 가정을 깨뜨립니다. multi-column/extended stats 지원과 composite index, actual distributions를 engine별로 검토합니다.",
      "prepared bind의 hot/cold values가 result cardinality를 수천 배 바꾸면 shared cached plan이 한쪽에 부적합할 수 있습니다. parameter sniffing/peeking, adaptive/custom plan과 query split을 evidence로 선택합니다.",
      "statistics/hint/plan baseline change에는 owner, scope, version, expiry와 regression suite를 둡니다. 한 bind를 고치고 다른 cohort를 악화시키지 않게 corpus를 실행합니다.",
    ],
    concepts: [
      c("sargability", "predicate가 index access boundary를 만들 수 있는 성질입니다.", ["matching expression index도 가능합니다.", "same-result를 먼저 증명합니다."]),
      c("statistics", "optimizer cardinality/cost 추정을 위한 row/distribution metadata입니다.", ["stale/sample/correlation 한계가 있습니다.", "actual과 비교합니다."]),
      c("bind skew", "parameter 값별 result cardinality와 optimal plan이 크게 달라지는 현상입니다.", ["hot/cold matrix가 필요합니다.", "raw sensitive values 대신 class로 관측합니다."]),
    ],
    codeExamples: [py("db16-bind-skew", "같은 plan과 다른 bind cardinality 비교", "db16_bind_skew.py", "tenant index query가 hot/cold bind에서 같은 search plan을 쓰지만 반환 rows가 크게 다름을 작은 fixture로 보여 줍니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item(id INTEGER PRIMARY KEY, tenant TEXT)")
db.executemany("INSERT INTO item VALUES (?, ?)", [(1, "hot"), (2, "hot"), (3, "hot"), (4, "hot"), (5, "cold")])
db.execute("CREATE INDEX idx_item_tenant ON item(tenant)")
sql = "SELECT id FROM item WHERE tenant = ? ORDER BY id"
hot_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, ("hot",)))
cold_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, ("cold",)))
hot_ids = [row[0] for row in db.execute(sql, ("hot",))]
cold_ids = [row[0] for row in db.execute(sql, ("cold",))]
print("hot-rows=" + str(len(hot_ids)))
print("cold-rows=" + str(len(cold_ids)))
print("hot-ids=" + ",".join(map(str, hot_ids)))
print("cold-ids=" + ",".join(map(str, cold_ids)))
print("same-plan-class=" + str("SEARCH" in hot_plan and hot_plan == cold_plan).lower())`, "hot-rows=4\ncold-rows=1\nhot-ids=1,2,3,4\ncold-ids=5\nsame-plan-class=true", ["mysql-optimizer-statistics", "oracle-optimizer-statistics", "sqlite-analyze"]),
    ],
    diagnostics: [
      d("estimated rows 10인데 actual은 100만입니다.", "stale stats, skew/correlation 또는 non-sargable/unknown bind selectivity가 큽니다.", ["first estimate divergence", "stats timestamp/sample/histogram", "column correlation", "bind/type/expression"], "stats/query/index 또는 multi-column statistics를 고치고 representative binds를 재검증합니다.", "estimate-error ratio와 stats/data-drift alert를 둡니다."),
      d("hot bind 개선 후 cold bind가 느려집니다.", "한 parameter plan/hint를 전체 distribution에 강제했습니다.", ["bind cardinality cohorts", "plan cache policy", "hot/cold resource", "query split/adaptive option"], "cohort별 strategy 또는 robust compromise를 workload frequency/SLO로 승인합니다.", "hot/cold/empty/broad corpus와 plan/latency thresholds를 둡니다."),
    ],
    expertNotes: ["bind telemetry에는 raw tenant/email/token 값을 남기지 않고 cardinality bucket과 fingerprint만 둡니다.", "statistics refresh 후 critical query corpus plan/result/read budgets를 다시 qualification합니다."],
  },
  {
    id: "nplusone-network-application-boundary",
    title: "DB plan 밖의 N+1·round trip·mapping·serialization 비용을 함께 측정합니다",
    lead: "각 SQL이 빠르더라도 parent 1번 뒤 child N번을 호출하면 network/connection/parse/lock snapshot과 application work가 endpoint를 느리게 만듭니다.",
    explanations: [
      "APM/driver trace에서 request당 SQL count, fingerprints, rows/bytes, connection wait와 total DB time을 봅니다. EXPLAIN 한 query만 보면 N+1을 놓칩니다.",
      "join fetch는 round trips를 줄이지만 child fan-out과 duplicated parent payload를 만들 수 있습니다. parent ids page 후 WHERE child.parent_id IN bounded batch, pre-aggregation/JSON과 separate endpoint를 비교합니다.",
      "JDBC/ORM fetch size, result streaming, row mapper object allocation, JSON serialization/compression과 client rendering도 critical path에 포함합니다. DB server time과 end-to-end latency를 분리합니다.",
      "count+list, retry, lazy loading과 observability queries도 query budget에 포함합니다. timeout/retry가 partial side effect나 load amplification을 만들지 않게 idempotency/backoff를 설계합니다.",
      "query-count test는 static maximum만 두지 않고 requested entities/relationships에 따른 expected formula와 result equivalence를 검증합니다. pagination size maximum으로 batch bound를 유지합니다.",
    ],
    concepts: [
      c("N+1 query", "한 parent query 뒤 각 result마다 유사한 child query를 반복하는 access pattern입니다.", ["각 query가 빨라도 cumulative cost가 큽니다.", "request SQL count로 검출합니다."]),
      c("round-trip cost", "application↔DB 요청마다 생기는 network, pool, parse, context와 latency 비용입니다.", ["server plan 시간 밖에 있습니다.", "batch/stream과 비교합니다."]),
      c("query budget", "endpoint/job가 허용하는 SQL count, rows/bytes, DB time와 connection occupancy 기준입니다.", ["result size와 연동합니다.", "retries/count queries를 포함합니다."]),
    ],
    codeExamples: [py("db16-nplusone", "N+1과 한 번의 join query count/결과 비교", "db16_nplusone.py", "trace callback으로 parent+3 child queries와 single join query를 계수하고 최종 mapping이 같은지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE parent(id INTEGER PRIMARY KEY); CREATE TABLE child(id INTEGER PRIMARY KEY, parent_id INTEGER, value TEXT);")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?, ?)", [(1, 1, "a"), (2, 1, "b"), (3, 2, "c")])
statements = []
db.set_trace_callback(lambda sql: statements.append(sql) if sql.lstrip().upper().startswith("SELECT") else None)
parents = [row[0] for row in db.execute("SELECT id FROM parent ORDER BY id")]
nplus = {parent_id: [row[0] for row in db.execute("SELECT value FROM child WHERE parent_id=? ORDER BY id", (parent_id,))] for parent_id in parents}
nplus_count = len(statements)
statements.clear()
rows = db.execute("SELECT p.id, c.value FROM parent p LEFT JOIN child c ON c.parent_id=p.id ORDER BY p.id,c.id").fetchall()
joined = {parent_id: [] for parent_id in parents}
for parent_id, value in rows:
    if value is not None: joined[parent_id].append(value)
join_count = len(statements)
print(f"nplus-queries={nplus_count}")
print(f"join-queries={join_count}")
print("parent1=" + ",".join(joined[1]))
print("parent2=" + ",".join(joined[2]))
print("parent3-empty=" + str(joined[3] == []).lower())
print("same-results=" + str(nplus == joined).lower())`, "nplus-queries=4\njoin-queries=1\nparent1=a,b\nparent2=c\nparent3-empty=true\nsame-results=true", ["local-trip", "mysql-optimization", "oracle-query-optimizer", "sqlite-queryplanner"]),
    ],
    diagnostics: [
      d("DB slow query log에는 문제가 없지만 endpoint가 느립니다.", "N+1, pool wait, network/serialization 또는 client rendering이 critical path를 지배합니다.", ["request SQL count/time", "connection wait", "rows/bytes", "mapping/serialization/client spans"], "bounded batch/join/endpoint shape를 result grain에 맞게 적용하고 end-to-end budget을 검증합니다.", "request-level distributed trace와 query-count/bytes regression을 둡니다."),
      d("join fetch로 N+1을 고쳤더니 memory/network가 폭증합니다.", "multiple child fan-out과 repeated parent payload가 생겼습니다.", ["parent/child cardinality", "wire bytes", "object dedup/memory", "parent-page+batch alternative"], "parent ids를 page하고 child를 bounded batch/pre-aggregate하거나 separate endpoint로 가져옵니다.", "0/1/N×M fixtures와 rows/bytes/heap budgets를 둡니다."),
    ],
    expertNotes: ["query tuning 단위는 SQL 한 문장뿐 아니라 endpoint/job의 query graph와 network/application work입니다.", "trace에는 raw SQL binds/child values를 저장하지 않고 fingerprint·count·rows/bytes/timing만 사용합니다."],
  },
  {
    id: "concurrency-lock-cache-variance",
    title: "lock waits·MVCC·pool·buffer cache·concurrency가 만드는 latency variance를 분리합니다",
    lead: "좋은 plan도 lock 대기, long snapshot, connection pool 고갈, cold cache와 I/O contention에서 느릴 수 있어 wait evidence가 필요합니다.",
    explanations: [
      "query elapsed time을 CPU, storage I/O, lock/latch, temp, network, connection pool과 application wait로 분해합니다. DB server execution plan만으로 대기 원인을 추측하지 않습니다.",
      "SELECT도 isolation/locking clause, metadata/DDL, MVCC old versions와 long transactions의 영향을 받을 수 있습니다. blocker/waiter transaction id, age, locked resource를 privacy-safe하게 수집합니다.",
      "cold cache benchmark는 physical I/O capacity를, warm cache는 steady-state CPU/logical reads를 보여 줍니다. benchmark마다 cache state를 기록하고 운영 cache를 임의 flush하지 않습니다.",
      "concurrency에서 각 query의 p50은 좋아도 aggregate CPU/I/O/memory/pool이 포화돼 p99가 폭증할 수 있습니다. closed/open workload, arrival rate와 queueing을 구분합니다.",
      "timeout은 resource 보호 장치이지만 cancel propagation, connection usability, transaction rollback와 retry backoff/idempotency를 검증해야 합니다. timeout을 늘리는 것만으로 튜닝하지 않습니다.",
    ],
    concepts: [
      c("wait profile", "elapsed time을 CPU/I/O/lock/pool/network 등 실제 대기 범주로 분해한 evidence입니다.", ["plan과 결합합니다.", "추측 대신 측정합니다."]),
      c("cache state", "필요 pages/data가 DB/OS/application cache에 있는 warm/cold 조건입니다.", ["benchmark metadata로 기록합니다.", "운영 cache flush를 피합니다."]),
      c("queueing saturation", "arrival work가 처리 capacity를 넘어 대기열과 tail latency가 급증하는 상태입니다.", ["concurrency/resource total을 봅니다.", "per-query 평균만으로 찾기 어렵습니다."]),
    ],
    diagnostics: [
      d("같은 plan인데 p50은 20ms, p99는 5초입니다.", "lock/I/O/pool queue 또는 spill/concurrency saturation이 일부 실행에만 발생합니다.", ["slow spans wait classes", "blocker/transaction age", "pool queue", "cache/temp/resource saturation"], "dominant wait 원인을 transaction/query/index/capacity/admission 수준에서 고칩니다.", "load+mutation test와 wait-class p99 alerts를 둡니다."),
      d("timeout 후 connection과 다음 request가 이상합니다.", "driver cancel/rollback이 완료되지 않았거나 transaction state가 pool로 반환됐습니다.", ["cancel acknowledgement", "transaction/autocommit state", "connection validation/reset", "retry side effects"], "timeout 시 statement cancel→rollback/reset/discard contract를 구현하고 commit-unknown을 별도 처리합니다.", "timeout/cancel/network-break integration tests와 pool readback을 둡니다."),
    ],
    expertNotes: ["lock/blocker telemetry도 raw business keys/SQL literals를 최소화하고 operation/fingerprint/age/resource class로 수집합니다.", "concurrency tuning은 DB14 isolation/deadlock retry와 함께 검증하고 correctness를 낮춰 성능을 위조하지 않습니다."],
  },
  {
    id: "systematic-tuning-change-validation",
    title: "한 가설씩 변경하고 result·plan·resource·write 부작용을 재검증합니다",
    lead: "query rewrite, index, statistics, schema/cache/precompute를 동시에 바꾸면 무엇이 개선했고 무엇이 깨졌는지 알 수 없습니다.",
    explanations: [
      "workflow는 observe/fingerprint→reproduce→result contract→actual plan/waits→first divergence→hypothesis→one change→equivalence→representative benchmark→side effects 순서입니다.",
      "rewrite에서는 NULL/three-valued logic, duplicates/grain, ordering/ties, precision/timezone, snapshot/authorization과 affected rows를 golden fixtures로 비교합니다.",
      "index는 read gain과 write/storage/locks/rebuild/replica costs, stats refresh는 other-query plan drift, materialization/cache는 freshness/invalidation/recovery를 함께 측정합니다.",
      "microbenchmark는 warmup, multiple repetitions, randomized/interleaved alternatives와 stable summary(percentiles/confidence)를 사용합니다. 결과를 버리거나 client fetch를 생략해 실제 workload와 다르게 만들지 않습니다.",
      "실패/rollback 조건을 미리 정합니다. latency만 좋아져도 errors/timeouts/locks/replication/result drift/resource가 threshold를 넘으면 되돌립니다.",
    ],
    concepts: [
      c("first divergence", "plan 위에서 estimated/expected work와 actual work가 처음 크게 달라지는 operation입니다.", ["root-cause 시작점입니다.", "upstream부터 봅니다."]),
      c("result equivalence", "변경 전후 ordered entity ids, values, NULL/duplicate/precision와 authorization이 계약상 같은 성질입니다.", ["performance보다 먼저 검증합니다.", "approved semantic change는 versioned합니다."]),
      c("one-change experiment", "다른 조건을 고정하고 하나의 query/index/stats/config 가설만 바꾸는 검증입니다.", ["인과 근거를 높입니다.", "rollback이 단순해집니다."]),
    ],
    diagnostics: [
      d("세 가지 튜닝을 적용해 빨라졌지만 어떤 것이 필요한지 모릅니다.", "변경을 묶어 baseline/ablation과 rollback 단위를 잃었습니다.", ["individual diffs", "per-change plans/results", "index/write costs", "stats/config effects"], "변경을 분리해 one-change experiments와 필요한 최소 조합을 재검증합니다.", "performance PR template에 hypothesis/isolated evidence/rollback을 요구합니다."),
      d("평균 latency는 개선됐지만 오류/timeout/replica lag가 늘었습니다.", "success-only mean만 보고 tail/resource/side effects를 acceptance에 넣지 않았습니다.", ["p95/p99/errors/timeouts", "rows/I/O/temp/locks", "DML/replica", "result reconciliation"], "다차원 acceptance/rollback thresholds로 canary를 재평가합니다.", "SLO/resource/error/result guardrail을 deployment automation에 둡니다."),
    ],
    expertNotes: ["튜닝 산출물은 query diff보다 재현 가능한 fixture, plan/wait/resource와 before/after results가 핵심입니다.", "변경이 metric 의미를 바꾸면 최적화가 아니라 versioned product/contract change로 처리합니다."],
  },
  {
    id: "canary-observability-regression-runbook",
    title: "canary·plan corpus·관측·drift·rollback으로 튜닝을 운영합니다",
    lead: "검증된 개선도 data/stats/version/workload drift로 퇴화할 수 있으므로 배포 readback과 지속 회귀·복구가 필요합니다.",
    explanations: [
      "canary는 일부 replica/session/traffic에서 new query/index/stats를 실행하고 result shadow/checksum, latency/resource/error/lock와 write/replica impact를 비교합니다. shadow query의 추가 부하와 민감 결과 저장을 제한합니다.",
      "critical query corpus는 fingerprints, representative bind classes, golden result invariants, expected plan features와 resource budgets를 DB/driver/schema/stats upgrade 때 실행합니다.",
      "observability에는 query/plan hash, schema/stats/engine version, rows examined/returned, loops, I/O/temp/lock, elapsed/DB/pool/network, error/timeout와 bind cardinality bucket을 둡니다. raw values/SQL literals는 redact합니다.",
      "plan drift alert는 hash 변화 자체보다 SLO/resource/result regression과 결합합니다. 같은 plan hash도 data growth로 느려지고 다른 plan도 더 좋을 수 있습니다.",
      "runbook은 stats regression, missing/unused index, blocker/deadlock, spill/disk, N+1 release, replica lag와 commit/timeout incident를 증거 수집→circuit breaker→rollback→reconciliation 순서로 다룹니다.",
    ],
    concepts: [
      c("query corpus", "중요 query shapes와 representative bind/result/plan/resource expectations의 회귀 묶음입니다.", ["upgrade qualification에 사용합니다.", "PII 없는 synthetic binds를 사용합니다."]),
      c("plan drift", "schema/stats/version/data 변화로 optimizer plan이 바뀌는 현상입니다.", ["hash보다 영향에 alert합니다.", "same plan data drift도 봅니다."]),
      c("performance rollback", "query/index/stats/config/cache/materialization을 이전 승인 상태로 복구하고 결과/부하를 readback하는 절차입니다.", ["DDL build time을 고려합니다.", "data/report reconciliation을 포함합니다."]),
    ],
    diagnostics: [
      d("DB upgrade 뒤 일부 query만 느려졌지만 늦게 발견합니다.", "critical corpus/plan-resource baseline과 version-tagged telemetry가 없습니다.", ["upgrade plan diffs", "fingerprint p99", "stats/schema version", "bind cohorts"], "upgrade 전후 corpus replay와 canary guardrail을 실행하고 drift를 version에 연결합니다.", "engine/driver upgrade qualification을 release gate로 둡니다."),
      d("index rollback이 필요하지만 재생성에 수 시간이 걸립니다.", "drop 전에 invisible/deprecation 기간, rebuild time/headroom과 rollback artifact를 준비하지 않았습니다.", ["DDL duration/disk/log", "old definition", "replica/canary option", "owner/approval"], "full-cycle invisible/deprecated 상태를 거치고 rebuild/cancel/restore runbook을 검증합니다.", "index lifecycle rehearsal와 restore-time objective를 둡니다."),
    ],
    expertNotes: ["tuning 완료 기준은 배포 성공이 아니라 canary/readback와 지속 SLO/resource/result evidence입니다.", "성능 artifacts를 공개 학습자료에 넣을 때 schema names/values/hosts/query literals를 anonymize하고 provenance 범위를 명시합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-users", repository: "dbstudy", path: "USERS.sql", usedFor: ["7-table security schema and 19-index tuning-workload provenance"], evidence: "원본을 read-only로 구조/count만 감사했고 email/token/request 값은 복사하지 않았습니다." },
  { id: "local-trip", repository: "dbstudy", path: "Trip.sql", usedFor: ["31-table, 41-foreign-key, 40-secondary-key join/cardinality workload provenance"], evidence: "원본을 read-only로 schema counts만 감사했고 user/travel/content values는 복사하지 않았습니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["estimated plans and plan fields"], evidence: "MySQL 공식 EXPLAIN 문서입니다." },
  { id: "mysql-explain-analyze", repository: "MySQL 8.4 Reference Manual", path: "15.8.2 EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["actual rows, loops and timing safety"], evidence: "MySQL 공식 EXPLAIN 및 EXPLAIN ANALYZE 문서입니다." },
  { id: "mysql-optimization", repository: "MySQL 8.4 Reference Manual", path: "Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/optimization.html", usedFor: ["access, join, sort and systematic optimization"], evidence: "MySQL 공식 optimizer 문서입니다." },
  { id: "mysql-optimizer-statistics", repository: "MySQL 8.4 Reference Manual", path: "Optimizer Statistics", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/optimizer-statistics.html", usedFor: ["statistics and histogram estimates"], evidence: "MySQL 공식 optimizer statistics 문서입니다." },
  { id: "oracle-dbms-xplan", repository: "Oracle Database 26ai PL/SQL Packages and Types Reference", path: "DBMS_XPLAN", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/DBMS_XPLAN.html", usedFor: ["Oracle estimated/actual cursor plan display"], evidence: "Oracle 공식 DBMS_XPLAN 문서입니다." },
  { id: "oracle-query-optimizer", repository: "Oracle Database 26ai SQL Tuning Guide", path: "Query Optimizer Concepts", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/query-optimizer-concepts.html", usedFor: ["cost, join order and cardinality concepts"], evidence: "Oracle 공식 optimizer guide입니다." },
  { id: "oracle-access-paths", repository: "Oracle Database 26ai SQL Tuning Guide", path: "Optimizer Access Paths", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/optimizer-access-paths.html", usedFor: ["scan, index and table access paths"], evidence: "Oracle 공식 access path 문서입니다." },
  { id: "oracle-optimizer-statistics", repository: "Oracle Database 26ai SQL Tuning Guide", path: "Optimizer Statistics Concepts", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/optimizer-statistics-concepts.html", usedFor: ["cardinality, histograms and statistics"], evidence: "Oracle 공식 optimizer statistics 문서입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["exact small SEARCH/SCAN/TEMP plan laboratory"], evidence: "SQLite 공식 EXPLAIN QUERY PLAN 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["small index/join/order plan laboratory"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "sqlite-analyze", repository: "SQLite Documentation", path: "ANALYZE", publicUrl: "https://www.sqlite.org/lang_analyze.html", usedFor: ["statistics laboratory boundary"], evidence: "SQLite 공식 ANALYZE 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-16-explain-query-tuning", slug: "db-16-explain-query-tuning", courseId: "database", moduleId: "db-programmability-performance", order: 8,
  title: "EXPLAIN으로 느린 쿼리 측정·개선하기", subtitle: "계획을 result·actual work·wait·N+1·canary·drift 증거와 연결하는 재현 가능한 튜닝 절차입니다.", level: "전문가", estimatedMinutes: 1020,
  coreQuestion: "느린 query의 첫 실제 병목을 결과 의미를 바꾸지 않고 찾아, 개선이 representative workload에서 빠르고 안전하며 운영 중에도 유지된다는 것을 어떻게 증명할까요?",
  summary: "dbstudy USERS.sql의 7-table/19-index security workload와 Trip.sql의 31-table/41-FK/40-secondary-key graph를 read-only로 schema counts만 감사합니다. performance contract, EXPLAIN estimates와 actual execution safety, scans/searches, join cardinality/fan-out/loops, sort/temp/spill, sargability/stats/bind skew, N+1/network/application boundary, lock/cache/concurrency waits, one-change methodology와 canary/query-corpus/rollback operations까지 연결합니다. 다섯 exact Python/SQLite examples는 scan→search, join fan-out, sort elimination, bind skew와 N+1 query count를 실행합니다.",
  objectives: ["correctness·workload·SLO·resource baseline을 EXPLAIN 전에 정의한다.", "estimated plan과 actual rows/loops/I/O/time 및 instrumentation 위험을 구분한다.", "scan/search/index/lookup과 join cardinality/fan-out의 첫 divergence를 찾는다.", "sort/group/temp/spill과 ordering index trade-off를 진단한다.", "sargability·statistics·correlation·bind skew를 개선한다.", "N+1·network·mapping과 lock/cache/pool concurrency waits를 측정한다.", "한 변경씩 result equivalence·read/write 부작용을 검증한다.", "canary·query corpus·versioned telemetry·drift·rollback을 운영한다."],
  prerequisites: [{ title: "인덱스와 선택도", reason: "access path, composite prefix, covering, statistics와 write/DDL cost를 이해해야 plan을 해석할 수 있습니다.", sessionSlug: "db-15-index-composite-order" }],
  keywords: ["EXPLAIN", "EXPLAIN ANALYZE", "DBMS_XPLAN", "cardinality", "actual rows", "loops", "scan", "index search", "fan-out", "sort", "spill", "statistics", "bind skew", "N+1", "wait profile", "canary", "plan drift"], topics,
  lab: {
    title: "익명화한 회원·여행 community 목록 endpoint를 evidence-first로 튜닝하기",
    scenario: "tenant/auth/status/search, comments/tags/images와 pagination/count가 있는 목록이 production-like skew에서 느립니다. 실제 USERS/Trip 값 없이 관계와 분포만 synthetic으로 재현합니다.",
    setup: ["synthetic opaque tenant/user/post ids, 0/1/N child, hot/cold/skew/tie/wide-row distributions만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 representative volume/index/stats/hardware limits를 준비합니다.", "ordered entity ids/count/auth/snapshot correctness와 latency/throughput/rows/I/O/temp/locks/query-count budgets를 작성합니다.", "query fingerprint/bind classes와 before actual-plan/wait/end-to-end trace를 고정합니다."],
    steps: ["source schema counts/provenance와 target entity grain/zero-one-many joins를 표로 만듭니다.", "safe EXPLAIN/actual plan에서 first estimated→actual cardinality divergence를 찾습니다.", "scan/search/access/residual/lookup의 rows examined/returned와 I/O를 비교합니다.", "join loops/fan-out을 EXISTS/pre-aggregate/parent-page batch alternatives와 비교합니다.", "sort/group/window temp/spill input rows/width와 ordered index/late materialization을 측정합니다.", "functions/casts/date ranges와 stats/correlation/hot-cold binds를 한 변경씩 검증합니다.", "request SQL count, N+1, pool/network/row bytes/mapping/serialization spans를 측정합니다.", "concurrent mutations에서 lock/wait/cache/temp/pool/p99와 timeout-cancel recovery를 검증합니다.", "before/after ordered ids와 read/write/storage/replica/resource를 full corpus로 대조합니다.", "canary result shadow, plan/SLO guardrails, metadata readback와 rollback/reconciliation runbook을 실행합니다."],
    expectedResult: ["튜닝 전후 authorized ordered ids/count/NULL/duplicate/snapshot semantics가 같습니다.", "첫 cardinality/work/wait divergence와 선택한 변경의 인과 근거가 actual evidence로 설명됩니다.", "대표 binds/volume/cache/concurrency에서 endpoint SLO와 rows/I/O/temp/lock/query budgets를 만족합니다.", "다른 query/DML/storage/replica에 승인되지 않은 regression이 없습니다.", "canary·query corpus·version-tagged privacy-safe telemetry와 tested rollback이 운영됩니다."],
    cleanup: ["isolated schemas·synthetic rows/indexes/stats와 trace/plan artifacts를 run id로 제거합니다.", "temporary credentials/exports를 revoke·삭제합니다.", "plans/logs/artifacts에 raw email/token/search/user/travel/host/PII가 없는지 검사합니다.", "production USERS.sql/Trip.sql과 data는 변경하지 않습니다."],
    extensions: ["distributed tracing과 DB wait events를 one critical-path flame graph로 연결합니다.", "adaptive plans/query store/baseline/hints의 owner·expiry·rollback을 비교합니다.", "shard/partition pruning과 distributed join/network shuffle를 튜닝합니다.", "automatic tuning/advisor recommendation을 workload corpus로 반증·승인합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 result ids와 plan/work flags를 before/after 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "scan→search가 same results임을 증명합니다.", "fan-out row/entity grain을 구분합니다.", "sort temp 제거와 order ids를 확인합니다.", "hot/cold bind rows 차이를 설명합니다.", "N+1과 join query count/result를 대조합니다."], hints: ["plan label만 보지 말고 결과와 실제 수행한 work의 proxy를 함께 적으세요."], expectedOutcome: "EXPLAIN을 속도 점수표가 아니라 검증 가능한 diagnosis evidence로 사용합니다.", solutionOutline: ["contract→plan/work→first divergence→one change→same result→representative test 순서입니다."] },
    { difficulty: "응용", prompt: "USERS/Trip 구조를 익명 synthetic workload로 재현해 느린 endpoint를 튜닝하세요.", requirements: ["원본 schema counts provenance와 no-value-copy를 보존합니다.", "target grain/auth/order/count snapshot을 고정합니다.", "actual rows/loops/I/O/temp/waits를 수집합니다.", "join/sort/sargability/stats/bind/N+1 hypotheses를 분리합니다.", "result equivalence와 full query corpus를 실행합니다.", "index read/write/storage/DDL/replica 부작용을 측정합니다.", "concurrency/timeout/cancel/rollback을 검증합니다.", "canary/telemetry/drift/runbook을 포함합니다."], hints: ["마지막 비싼 node보다 upstream 첫 cardinality divergence를 찾으세요."], expectedOutcome: "재현·설명·rollback 가능한 production-grade 튜닝 산출물이 완성됩니다.", solutionOutline: ["observe→reproduce→contract→actual evidence→experiment→capacity→canary→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직 SQL 성능 진단·변경 표준을 작성하세요.", requirements: ["correctness/workload/SLO/resource baseline schema를 정의합니다.", "EXPLAIN actual safety/redaction/retention을 둡니다.", "cardinality/access/join/sort/stats/wait diagnosis 순서를 정의합니다.", "N+1/network/application query budget을 포함합니다.", "one-change/equivalence/representative benchmark 규칙을 둡니다.", "read/write/storage/lock/replica side-effect budgets를 정의합니다.", "canary/query corpus/upgrade qualification/plan drift를 둡니다.", "rollback/reconciliation/owner/expiry/runbook을 정의합니다."], hints: ["EXPLAIN cost 숫자는 서로 다른 query/engine의 보편적 시간 단위가 아닙니다."], expectedOutcome: "증거에서 운영 복구까지 일관된 전문가 튜닝 governance가 완성됩니다.", solutionOutline: ["measure→explain→hypothesize→isolate→verify→canary→observe→recover 순서입니다."] },
  ],
  nextSessions: ["db-17-theater-capstone"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["USERS.sql의 7 tables/19 explicit secondary indexes와 Trip.sql의 31 tables/31 primary/25 unique/40 secondary keys/41 foreign keys를 read-only로 구조·개수만 감사했습니다.", "실제 user/email/token/request/travel/community values, hosts와 credentials는 읽어 옮기지 않고 anonymized relation/query/distribution shapes만 사용했습니다.", "원본은 actual plans/cardinality/waits, representative methodology, N+1/application boundary와 canary/drift/runbook을 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite summary plans는 MySQL 8.4·Oracle 26ai actual rows/loops/buffers, parallelism, locks/waits, statistics/cost와 concurrency를 대체하지 않습니다."] },
});

export default session;
