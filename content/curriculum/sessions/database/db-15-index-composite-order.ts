import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "sqlite3 memory DB와 anonymized synthetic rows를 만들고 index 전제·constraints·query shape를 격리합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "EXPLAIN QUERY PLAN의 engine-specific text를 search/scan/covering/temp flags로 정규화하고 실제 ids와 대조합니다." },
      { lines: "마지막 5줄", explanation: "계획 flag·ordered ids·uniqueness 같은 안정된 evidence만 출력합니다. MySQL·Oracle의 cost/optimizer/online DDL은 별도 matrix로 측정합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "SQLite plan laboratory는 MySQL 8.4·Oracle 26ai의 B-tree implementation, statistics, concurrency와 DDL lock을 대신하지 않습니다."] },
    experiments: [
      { change: "leading column을 빼거나 range 위치, sort direction과 selected payload를 바꿉니다.", prediction: "search prefix, ordering reuse와 covering 여부가 달라집니다.", result: "EXPLAIN actual, returned ids와 rows examined를 함께 비교합니다." },
      { change: "low/high selectivity, skew와 write concurrency를 늘립니다.", prediction: "같은 index도 cost model과 maintenance 부담 때문에 선택/효과가 달라집니다.", result: "representative distribution에서 read gain과 write/storage/lock cost를 함께 승인합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "btree-lookup-order-mental-model",
    title: "B-tree index를 정렬된 key→row locator 구조와 access path로 이해합니다",
    lead: "index는 마법의 속도 스위치가 아니라 key 순서로 search range를 좁히거나 rows를 정렬된 순서로 읽게 하는 별도 저장 구조입니다.",
    explanations: [
      "원본 USERS.sql은 7개 user/security/activity 계열 tables, primary/foreign/unique constraints와 request/user/status/time/target에 걸친 19개 명시적 secondary index를 포함합니다. 공개 세션은 구조·counts만 사용하고 실제 이메일·token·요청 정보 같은 값은 절대 복사하지 않습니다.",
      "일반 B-tree는 root/branch/leaf를 따라 equality 또는 range의 시작점을 찾고 leaf key order로 이어 읽습니다. secondary leaf가 row locator/primary key를 포함하는 방식은 engine에 따라 다르므로 heap/clustered lookup 비용을 matrix에 기록합니다.",
      "index search는 predicate로 후보를 줄이고 residual filter는 읽은 후보에서 다시 검사합니다. EXPLAIN의 'uses index'만 보지 말고 access condition, rows examined, table lookup과 returned rows 비율을 봅니다.",
      "index order가 ORDER BY와 맞으면 별도 sort를 줄이고 LIMIT에서 일찍 멈출 수 있습니다. NULL ordering, collation, ASC/DESC, mixed direction과 tie-breaker까지 일치해야 합니다.",
      "작은 table, 낮은 selectivity 또는 넓은 결과에서는 sequential/full scan이 더 쌀 수 있습니다. optimizer가 index를 안 쓴다는 사실만으로 강제 hint를 넣지 말고 statistics와 actual workload를 확인합니다.",
    ],
    concepts: [
      c("access path", "table rows를 찾기 위해 optimizer가 선택한 full scan, index range/lookup 등의 실행 방법입니다.", ["index 존재와 선택은 다릅니다.", "actual rows/I/O로 검증합니다."]),
      c("index key order", "여러 key values가 leaf에서 비교·정렬되는 순서입니다.", ["range와 ORDER BY reuse를 결정합니다.", "collation·NULL·direction을 포함합니다."]),
      c("row locator", "secondary index entry가 base row를 찾아가기 위해 보유한 primary key 또는 physical locator입니다.", ["table lookup 비용을 만듭니다.", "engine storage model에 따라 다릅니다."]),
    ],
    codeExamples: [py("db15-composite-search", "tenant·status 복합 index search와 결과 검증", "db15_composite_search.py", "anonymized account rows에서 equality prefix가 composite covering index search를 사용하고 tenant boundary ids만 반환하는지 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, tenant TEXT, status TEXT)")
db.executemany("INSERT INTO account VALUES (?, ?, ?)", [
    (1, "t1", "open"), (2, "t1", "closed"), (3, "t2", "open"), (4, "t1", "open")
])
db.execute("CREATE INDEX idx_account_tenant_status ON account(tenant, status)")
sql = "SELECT id FROM account WHERE tenant = ? AND status = ? ORDER BY id"
detail = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, ("t1", "open")))
ids = [row[0] for row in db.execute(sql, ("t1", "open"))]
print("uses-composite=" + str("idx_account_tenant_status" in detail and "SEARCH" in detail).lower())
print("covering=" + str("COVERING" in detail).lower())
print("ids=" + ",".join(map(str, ids)))
print(f"rows={len(ids)}")
print("tenant-isolated=" + str(ids == [1, 4]).lower())`, "uses-composite=true\ncovering=true\nids=1,4\nrows=2\ntenant-isolated=true", ["local-users", "mysql-indexes", "sqlite-queryplanner"]),
    ],
    diagnostics: [
      d("index가 있는데도 query가 full scan입니다.", "predicate selectivity가 낮거나 type/collation/function mismatch, stale stats 또는 leading key 부재로 index cost가 높습니다.", ["actual predicate/bind types", "index key order", "statistics/data skew", "EXPLAIN estimated vs actual rows"], "query/index/stats를 workload에 맞게 조정하고 scan이 더 싼 경우는 그대로 승인합니다.", "selectivity/skew/bind distribution별 plan budget tests를 둡니다."),
      d("index lookup은 빠르지만 table random I/O가 대부분 시간을 씁니다.", "많은 candidates 또는 wide projection 때문에 secondary→base row lookup이 반복됩니다.", ["rows examined/returned", "table lookup count", "selected columns", "covering/late materialization option"], "filter selectivity를 높이거나 narrow covering/late materialization을 evidence에 따라 적용합니다.", "read gain과 index width/write cost를 함께 benchmark합니다."),
    ],
    expertNotes: ["index 이름보다 key sequence, predicate operator, residual filter와 row locator access를 plan evidence에 남깁니다.", "SQLite plan flag는 교육용이며 production MySQL/Oracle의 actual plan과 buffer/I/O telemetry로 다시 증명합니다."],
  },
  {
    id: "constraint-index-versus-performance-index",
    title: "PRIMARY·UNIQUE·FOREIGN KEY 지원 index와 성능 index의 책임을 구분합니다",
    lead: "index는 검색 성능 구조일 수도 있고 uniqueness를 강제하는 integrity mechanism의 구현일 수도 있어 삭제·변경 영향이 다릅니다.",
    explanations: [
      "PRIMARY KEY와 UNIQUE constraint는 중복을 거절하는 데이터 계약이며 DB가 backing index를 만들 수 있습니다. 단순 CREATE INDEX는 일반적으로 중복을 막지 않으므로 애플리케이션 사전 조회로 uniqueness를 대체하지 않습니다.",
      "UNIQUE에서 NULL을 여러 개 허용하는지, empty string/NULL, case/accent/Unicode normalization과 composite nullable keys가 어떻게 취급되는지 MySQL·Oracle matrix에서 확인합니다.",
      "foreign key child lookup/parent delete-update 검증을 지원하는 index가 필요할 수 있지만 자동 생성/요구 규칙은 엔진별로 다릅니다. USERS.sql의 user_idx·request links처럼 relationship workload와 cascade/cleanup을 측정합니다.",
      "성능 index를 제거할 때는 단순 usage counter만 보지 않습니다. constraint backing, optimizer alternatives, rare month-end/incident queries와 replication/maintenance 작업을 검토합니다.",
      "constraint/index 이름과 ownership을 migration schema에 고정하고 duplicate cleanup, concurrent writes, failure rollback과 readback을 포함한 변경 절차를 둡니다.",
    ],
    concepts: [
      c("unique constraint", "정규화된 key 조합의 중복을 transactionally 거절하는 무결성 계약입니다.", ["backing index와 논리 계약을 구분합니다.", "NULL/collation semantics를 검증합니다."]),
      c("supporting index", "foreign-key validation이나 관계 lookup의 비용을 줄이는 index입니다.", ["engine 자동 생성 규칙을 확인합니다.", "cascade/locking workload를 측정합니다."]),
      c("performance index", "특정 filter/join/order/query shape의 비용을 줄이기 위해 추가한 구조입니다.", ["workload evidence와 owner가 필요합니다.", "삭제 전 rare-path를 감사합니다."]),
    ],
    diagnostics: [
      d("중복 email이 race 중 삽입됩니다.", "SELECT-then-INSERT 검사만 있고 DB UNIQUE contract가 없습니다.", ["schema constraint", "normalization/collation", "concurrent transactions", "duplicate error mapping"], "canonical key에 UNIQUE를 두고 conflict를 domain error/idempotent outcome으로 처리합니다.", "동시 duplicate insertion과 case/Unicode/NULL fixtures를 둡니다."),
      d("unused index를 삭제했더니 parent delete가 lock/time out됩니다.", "foreign-key lookup/maintenance나 rare workload를 usage window에서 놓쳤습니다.", ["constraint dependencies", "parent delete/update plans", "maintenance jobs", "full business cycle usage"], "dependency와 representative rare/cascade workload를 검증하고 staged invisible/rollback 절차를 사용합니다.", "월말/cleanup/incident query replay와 lock budget을 둡니다."),
    ],
    expertNotes: ["무결성 constraint를 성능 튜닝 편의로 제거하지 않고 collision semantics까지 domain 계약으로 문서화합니다.", "USERS.sql처럼 보안 도메인에서는 token/email/request identity index가 개인정보 조회 표면도 넓히므로 access/audit를 함께 검토합니다."],
  },
  {
    id: "composite-leftmost-equality-range",
    title: "복합 index의 leading prefix와 equality→range→order 규칙을 query shape에 맞춥니다",
    lead: "(tenant,status,created_at,id)는 모든 column 조합을 빠르게 만드는 네 개 index가 아닙니다. 앞 key와 operator가 뒤 key의 search/order 활용을 결정합니다.",
    explanations: [
      "일반적으로 leading equality columns는 search range를 좁히고 첫 range 이후 뒤 keys는 filter/order에 제한적으로 사용됩니다. engine의 skip scan 같은 예외를 기본 계약으로 가정하지 않습니다.",
      "multi-tenant query에서는 tenant를 leading key로 두어 보안 predicate와 partition cardinality를 함께 좁히는 경우가 많습니다. 그러나 global admin query와 tenant count, low-cardinality status distribution도 별도 workload로 봅니다.",
      "index column 순서는 where clause text 순서가 아니라 equality/range, selectivity/correlation, join/order/group와 dominant workload로 결정합니다. 중복 index prefix와 alternative indexes 경쟁도 검토합니다.",
      "ORDER BY created_at DESC,id DESC LIMIT N을 equality tenant/status 뒤에 두면 range/order scan으로 일찍 멈출 수 있습니다. sort tuple과 keyset cursor predicate가 index definition과 완전히 일치해야 합니다.",
      "leading key를 빼면 full index/table scan과 sort가 필요할 수 있습니다. dynamic filters/sorts 모든 조합에 index를 만들지 말고 allow-listed query modes, maximum depth와 fallback/search architecture를 설계합니다.",
    ],
    concepts: [
      c("leading prefix", "복합 index key sequence의 첫 column부터 연속된 검색 조건 부분입니다.", ["중간 key를 임의로 건너뛰지 않습니다.", "engine skip-scan은 별도 evidence가 필요합니다."]),
      c("equality-range-order", "leading equality로 scope를 고정한 뒤 range와 ordered scan을 설계하는 heuristic입니다.", ["절대 법칙이 아니라 plan guide입니다.", "actual distribution으로 검증합니다."]),
      c("query-shape allow-list", "지원할 filter/sort/cursor 조합을 제한해 index 폭발과 unbounded query를 막는 계약입니다.", ["UI/API와 공유합니다.", "unsupported mode를 명확히 거절/대체합니다."]),
    ],
    codeExamples: [py("db15-leading-prefix", "복합 index full prefix와 missing leading key 비교", "db15_prefix.py", "tenant,status,created DESC,id DESC index가 full equality prefix에서는 search/order를 지원하지만 status만 조회하면 scan+temporary order가 되는지 정규화합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY, tenant TEXT, status TEXT, created INTEGER)")
db.executemany("INSERT INTO event VALUES (?, ?, ?, ?)", [
    (1, "t1", "ok", 10), (2, "t1", "ok", 20), (3, "t1", "fail", 30), (4, "t2", "ok", 40)
])
db.execute("CREATE INDEX idx_event_scope_order ON event(tenant, status, created DESC, id DESC)")
full_sql = "SELECT id FROM event WHERE tenant = ? AND status = ? ORDER BY created DESC, id DESC"
skip_sql = "SELECT id FROM event WHERE status = ? ORDER BY created DESC, id DESC"
full_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + full_sql, ("t1", "ok")))
skip_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + skip_sql, ("ok",)))
ids = [row[0] for row in db.execute(full_sql, ("t1", "ok"))]
print("full-prefix-search=" + str("SEARCH" in full_plan and "idx_event_scope_order" in full_plan).lower())
print("missing-leading-scan=" + str("SCAN" in skip_plan).lower())
print("missing-leading-temp-order=" + str("TEMP B-TREE" in skip_plan).lower())
print("ids=" + ",".join(map(str, ids)))
print("ordered=" + str(ids == [2, 1]).lower())`, "full-prefix-search=true\nmissing-leading-scan=true\nmissing-leading-temp-order=true\nids=2,1\nordered=true", ["mysql-multiple-column", "oracle-create-index", "sqlite-queryplanner"]),
    ],
    diagnostics: [
      d("복합 index가 있는데 두 번째 column 단독 검색이 느립니다.", "leading prefix가 없어 broad scan/skip-scan 비용이 발생합니다.", ["effective predicates", "index key order", "skip-scan plan/NDV", "separate workload frequency"], "빈번한 독립 query면 별도 index/재설계를 검토하고 드문 query면 bounded scan을 승인합니다.", "full/partial/missing prefix plan matrix를 둡니다."),
      d("range 조건 뒤 ORDER BY column 때문에 sort가 발생합니다.", "range가 넓거나 index direction/key sequence가 filter와 total order를 동시에 지원하지 않습니다.", ["first range position", "ORDER BY tuple/direction", "rows after range", "actual sort/temp"], "query shape와 index 순서를 조정하거나 sort budget/alternative keyset을 선택합니다.", "range width와 tie/skew별 sort plan regression을 둡니다."),
    ],
    expertNotes: ["복합 index column order 결정 근거에 query frequency, bind distribution, rows examined, order/limit와 write cost를 함께 기록합니다.", "tenant leading key는 성능 도움일 수 있지만 authorization 자체는 query/RLS가 강제해야 합니다."],
  },
  {
    id: "covering-index-only-late-materialization",
    title: "covering/index-only scan과 late materialization의 read/write trade-off를 검증합니다",
    lead: "query에 필요한 columns가 index에 모두 있으면 base row lookup을 줄일 수 있지만 index를 넓히면 모든 write와 cache/storage 비용이 증가합니다.",
    explanations: [
      "covering은 query-relative property입니다. 같은 index도 id/status/time만 선택하면 covering이고 large payload를 추가하면 base lookup이 필요합니다. SELECT *는 목적과 비용을 숨깁니다.",
      "Oracle index-only behavior와 MySQL covering/clustered primary key details, visibility map 같은 engine-specific prerequisites를 공식 plan에서 확인합니다. plan label만 아니라 logical/physical reads를 측정합니다.",
      "include columns 또는 composite suffix로 projection을 덮을 때 key comparison/order에 포함되는지 engine syntax를 구분합니다. 민감 columns를 index에 복제하면 storage/encryption/backup/access 범위가 늘어납니다.",
      "late materialization은 narrow index에서 ordered page ids를 고른 뒤 base rows를 bounded batch fetch합니다. 결과 order/snapshot/authorization을 보존하고 N+1로 바뀌지 않게 합니다.",
      "covering index의 read improvement는 p95 lookup count/I/O와 함께 insert/update, page split, buffer hit, backup/replication size와 online rebuild 시간을 비교해 승인합니다.",
    ],
    concepts: [
      c("covering index", "특정 query의 filter/order/projection을 index entries만으로 충족할 수 있는 index입니다.", ["query-relative입니다.", "base lookup 감소를 actual plan으로 확인합니다."]),
      c("index-only scan", "engine이 base table row를 읽지 않거나 최소화해 index로 결과를 반환하는 access path입니다.", ["engine prerequisites가 있습니다.", "logical reads로 검증합니다."]),
      c("late materialization", "narrow ordered ids를 먼저 선택하고 필요한 wide rows를 bounded batch로 나중에 읽는 전략입니다.", ["order/snapshot을 복원합니다.", "N+1을 피합니다."]),
    ],
    codeExamples: [py("db15-covering-projection", "projection에 따른 covering 여부 비교", "db15_covering.py", "같은 composite index와 predicate에서 indexed columns만 고른 query와 payload까지 고른 query의 plan flag를 비교합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY, tenant TEXT, status TEXT, created INTEGER, payload TEXT)")
db.executemany("INSERT INTO event VALUES (?, ?, ?, ?, ?)", [(1, "t1", "ok", 10, "alpha"), (2, "t1", "ok", 20, "beta")])
db.execute("CREATE INDEX idx_event_cover ON event(tenant, status, created DESC, id DESC)")
narrow = "SELECT status, created, id FROM event WHERE tenant = ? AND status = ? ORDER BY created DESC, id DESC"
wide = "SELECT status, created, id, payload FROM event WHERE tenant = ? AND status = ? ORDER BY created DESC, id DESC"
args = ("t1", "ok")
narrow_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + narrow, args))
wide_plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + wide, args))
ids = [row[2] for row in db.execute(narrow, args)]
print("narrow-covering=" + str("COVERING" in narrow_plan).lower())
print("wide-covering=" + str("COVERING" in wide_plan).lower())
print("wide-uses-index=" + str("idx_event_cover" in wide_plan).lower())
print("ids=" + ",".join(map(str, ids)))
print("order-preserved=" + str(ids == [2, 1]).lower())`, "narrow-covering=true\nwide-covering=false\nwide-uses-index=true\nids=2,1\norder-preserved=true", ["mysql-indexes", "oracle-create-index", "sqlite-eqp"]),
    ],
    diagnostics: [
      d("covering index를 만들자 writes와 storage가 크게 악화됩니다.", "large/mutable projection columns를 index에 복제했습니다.", ["index bytes/row", "update frequency/page splits", "buffer/backup/replication", "late materialization alternative"], "narrow high-value columns만 포함하거나 id page+batch fetch를 사용합니다.", "read gain과 write/storage/rebuild cost를 한 capacity report로 승인합니다."),
      d("plan은 index-only인데 logical reads 기대만큼 줄지 않습니다.", "engine visibility/row locator, residual predicates 또는 broad range 때문에 많은 index pages/base checks가 필요합니다.", ["actual logical/physical reads", "rows examined/returned", "residual filter", "engine index-only prerequisites"], "predicate/selectivity/stats/index key를 조정하고 plan label이 아니라 I/O budget으로 판단합니다.", "cold/warm cache와 skew workload에서 actual counters를 regression-test합니다."),
    ],
    expertNotes: ["민감 payload를 covering 목적으로 index에 복제하기 전에 encryption, backup, least-privilege와 삭제/retention 표면을 검토합니다.", "late materialization 두 단계가 같은 authorization/snapshot을 쓰고 result order를 정확히 복원하는지 id 기반으로 검증합니다."],
  },
  {
    id: "sargability-functions-casts-patterns",
    title: "함수·형변환·LIKE·날짜 조건을 searchable range로 작성합니다",
    lead: "index column을 함수/암묵 변환으로 감싸면 원래 key order에서 직접 range를 찾을 수 없어 scan이 될 수 있습니다.",
    explanations: [
      "LOWER(email)=?, DATE(created_at)=?, CAST(id AS text)=? 같은 predicate는 일반 index key와 표현이 다릅니다. canonical stored value, half-open range 또는 engine-supported expression/generated-column index를 선택합니다.",
      "parameter/column type과 collation이 다르면 implicit conversion 방향에 따라 column 변환과 plan 변화가 생깁니다. driver bind type, schema numeric/string와 execution plan predicate를 함께 확인합니다.",
      "prefix LIKE 'abc%'는 collation/escape에 따라 range를 쓸 수 있지만 leading wildcard '%abc%'는 일반 B-tree로 시작점을 찾기 어렵습니다. full-text/trigram/search engine을 요구에 맞게 검토합니다.",
      "날짜 하루 검색은 timezone에서 [startInstant,nextStartInstant) half-open range로 변환해 DST와 fractional seconds를 처리합니다. column에 DATE()를 적용하는 shortcut과 결과/plan을 비교합니다.",
      "expression index는 query expression과 의미·collation·determinism이 정확히 맞아야 합니다. normalization 로직 version과 uniqueness/NULL 정책을 migration·backfill로 관리합니다.",
    ],
    concepts: [
      c("sargable predicate", "index key의 equality/range 경계를 직접 만들 수 있는 검색 조건입니다.", ["함수 없는 것만을 뜻하지 않습니다.", "matching expression index도 가능합니다."]),
      c("implicit conversion", "비교 operand 타입 차이를 DB가 자동 변환하는 과정입니다.", ["column-side conversion은 access path를 깨뜨릴 수 있습니다.", "bind metadata를 봅니다."]),
      c("expression index", "정해진 deterministic expression 결과를 key로 저장하는 index입니다.", ["query expression과 일치해야 합니다.", "logic version/maintenance 비용이 있습니다."]),
    ],
    codeExamples: [py("db15-expression-sargability", "LOWER expression index 전후 scan/search 비교", "db15_expression_index.py", "같은 lower(email) predicate가 expression index 전에는 scan, 후에는 search가 되는지 실제 id와 함께 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE person(id INTEGER PRIMARY KEY, email TEXT)")
db.executemany("INSERT INTO person VALUES (?, ?)", [(1, "A@X.test"), (2, "b@x.test")])
sql = "SELECT id FROM person WHERE lower(email) = ?"
args = ("a@x.test",)
before = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, args))
db.execute("CREATE INDEX idx_person_lower_email ON person(lower(email))")
after = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, args))
ids = [row[0] for row in db.execute(sql, args)]
print("before-scan=" + str("SCAN" in before).lower())
print("after-search=" + str("SEARCH" in after).lower())
print("uses-expression-index=" + str("idx_person_lower_email" in after).lower())
print("ids=" + ",".join(map(str, ids)))
print("same-semantics=" + str(ids == [1]).lower())`, "before-scan=true\nafter-search=true\nuses-expression-index=true\nids=1\nsame-semantics=true", ["mysql-generated-column-index", "oracle-create-index", "sqlite-expridx"]),
    ],
    diagnostics: [
      d("같은 query가 일부 driver/bind에서만 full scan입니다.", "bind type/collation이 column과 달라 implicit column conversion이 발생합니다.", ["prepared parameter metadata", "column type/collation", "plan predicate expression", "literal vs bind plans"], "application 타입과 schema를 일치시키고 unsafe string casting을 제거합니다.", "대표 bind types/values와 plan conformance tests를 둡니다."),
      d("날짜 검색 index가 사용되지 않고 DST 경계 결과도 틀립니다.", "timestamp column에 DATE()를 적용하고 application timezone boundary를 생략했습니다.", ["stored timezone/type", "effective start/end instants", "column function", "fractional/DST fixtures"], "business timezone의 start/next-start를 계산해 column>=? AND column<?로 bind합니다.", "DST gap/overlap·midnight·fractional fixtures와 plan search assertion을 둡니다."),
    ],
    expertNotes: ["sargability 변경은 같은 result ids를 먼저 증명한 뒤 plan/resource improvement를 별도로 승인합니다.", "case-insensitive identity는 LOWER 호출 하나가 아니라 Unicode normalization·collation·domain uniqueness 정책입니다."],
  },
  {
    id: "selectivity-correlation-statistics-skew",
    title: "선택도·column correlation·histogram과 bind skew를 cost model에 반영합니다",
    lead: "status처럼 값 종류가 적어도 tenant와 결합하면 선택적일 수 있고, 평균 분포만 보면 특정 hot tenant의 plan을 잘못 예측할 수 있습니다.",
    explanations: [
      "selectivity는 predicate가 전체 rows 중 반환할 비율이며 cardinality estimate가 join order, scan/index와 memory를 결정합니다. distinct count 하나는 skew와 correlated columns를 충분히 설명하지 못합니다.",
      "tenant와 status, country와 city처럼 columns가 상관되면 independent selectivity 곱 가정이 틀립니다. 엔진의 extended/multi-column statistics 또는 representative composite distribution을 검토합니다.",
      "bind 값에 따라 tiny tenant와 hot tenant 결과가 수천 배 다를 수 있습니다. plan cache/parameter sniffing·bind peeking 정책을 engine/version별로 확인하고 p50뿐 아니라 worst/p95 values를 benchmark합니다.",
      "statistics가 stale하거나 sample이 rare values를 놓치면 rows estimate가 틀려집니다. ANALYZE/stats refresh를 deployment/data growth runbook에 포함하고 auto stats 지연을 관측합니다.",
      "index hint/plan baseline은 emergency stabilization 수단일 수 있지만 data drift와 upgrade를 막을 수 있습니다. 원인 stats/query/index를 고치고 hint owner·expiry·fallback을 둡니다.",
    ],
    concepts: [
      c("selectivity", "predicate를 통과하는 row 비율입니다.", ["값별로 다릅니다.", "index 선택 비용에 영향을 줍니다."]),
      c("column correlation", "두 columns의 값 분포가 독립적이지 않아 결합 조건 cardinality가 단순 곱과 다른 성질입니다.", ["multi-column stats를 고려합니다.", "복합 index workload와 연결합니다."]),
      c("bind skew", "parameter values별 결과 cardinality와 최적 plan이 크게 다른 분포입니다.", ["hot/cold values를 시험합니다.", "plan cache 정책을 확인합니다."]),
    ],
    diagnostics: [
      d("같은 prepared query가 특정 tenant에서만 timeout됩니다.", "hot tenant bind skew와 cached plan/cardinality estimate가 맞지 않습니다.", ["tenant별 counts/latency", "estimated vs actual rows", "plan cache behavior", "composite stats/index"], "representative hot/cold workloads로 stats/query/index와 plan strategy를 조정합니다.", "top-volume/rare bind matrix와 plan/latency budgets를 둡니다."),
      d("대량 적재 후 optimizer가 나쁜 join/index plan을 선택합니다.", "statistics가 적재 이전 분포로 stale하거나 sampling이 skew를 놓쳤습니다.", ["stats timestamp/sample", "row/NDV drift", "estimated vs actual", "auto analyze thresholds"], "적재 후 stats refresh와 plan qualification을 배포 단계에 넣습니다.", "data-volume milestones와 estimate-error alerts를 둡니다."),
    ],
    expertNotes: ["개인별 key 분포를 telemetry에 직접 노출하지 않고 bucketed cardinality/plan metrics로 skew를 관측합니다.", "평균 query 하나로 index를 승인하지 않고 hot/cold, empty, broad, tie와 full business cycle workloads를 포함합니다."],
  },
  {
    id: "order-pagination-index-design",
    title: "정렬·keyset pagination·NULL/collation과 index direction을 하나의 total-order 계약으로 맞춥니다",
    lead: "목록 index는 filter만 빠르게 하는 것이 아니라 안정적인 total order와 cursor range, LIMIT early-stop을 지원해야 합니다.",
    explanations: [
      "equality tenant/status 뒤 created_at DESC,id DESC를 두면 newest-first keyset에 적합할 수 있습니다. 다음 predicate의 lexicographic operators와 index direction을 ORDER BY와 정확히 맞춥니다.",
      "OFFSET은 deep page에서 앞 entries를 읽고 버릴 수 있지만 keyset은 last tuple부터 range search합니다. random jump/exact page 요구, snapshot consistency와 cursor security를 함께 선택합니다.",
      "nullable sort는 CASE null-rank 또는 explicit NULLS FIRST/LAST를 index/expression과 맞춥니다. text collation·case/accent와 Unicode normalization이 cursor encode/decode/DB comparison에서 동일해야 합니다.",
      "mixed ASC/DESC 지원과 backward scan 비용은 engine/version별로 확인합니다. 이전 page는 predicate/order 반전 후 display order 복원이 필요합니다.",
      "LIMIT N plan이 index에서 N개만 읽는지 residual filter 때문에 수천 entries를 건너뛰는지 actual rows examined로 봅니다. covering 여부와 base lookup도 포함합니다.",
    ],
    concepts: [
      c("ordered range scan", "index key 순서와 boundary predicate를 이용해 정렬된 rows를 읽는 access path입니다.", ["별도 sort를 줄일 수 있습니다.", "residual filter 비용을 확인합니다."]),
      c("keyset index", "equality scope와 total-order cursor tuple을 key sequence로 지원하는 복합 index입니다.", ["unique tie-breaker를 포함합니다.", "cursor predicate와 일치합니다."]),
      c("early stop", "ORDER/LIMIT query가 충분한 eligible rows를 찾으면 더 읽지 않고 끝나는 최적화입니다.", ["residual filter가 work를 늘릴 수 있습니다.", "actual scanned entries를 봅니다."]),
    ],
    diagnostics: [
      d("keyset query인데 다음 page가 빠르지 않습니다.", "boundary 앞에 unsupported function/nullable expression이 있거나 residual filter 때문에 많은 entries를 건너뜁니다.", ["index/predicate/order tuple", "range access condition", "rows examined vs returned", "NULL/collation"], "scope/filter/order를 indexable tuple로 맞추고 representative selectivity에서 actual work를 검증합니다.", "cursor depth·sparse filter·tie/null fixtures와 rows-examined budget을 둡니다."),
      d("DB/locale upgrade 후 cursor가 row를 건너뜁니다.", "text collation/normalization 순서가 cursor 발행 때와 달라졌습니다.", ["collation version", "cursor contract version", "normalized sort value", "old/new ordered ids"], "cursor에 version/scope를 묶고 collation upgrade 때 old cursor restart 또는 snapshot migration을 제공합니다.", "Unicode/case/accent golden ordering과 upgrade replay를 둡니다."),
    ],
    expertNotes: ["pagination index는 SQL16의 total-order/cursor contract를 구현하는 물리 구조이며 authorization을 대체하지 않습니다.", "collation/index rebuild와 cursor compatibility를 같은 deployment/change plan으로 관리합니다."],
  },
  {
    id: "write-storage-lock-maintenance-cost",
    title: "index의 insert/update/delete·page split·storage·lock·rebuild 비용을 예산화합니다",
    lead: "read query 하나를 빠르게 만든 index는 모든 관련 write에 key 계산·tree 변경·logging·replication·backup 비용을 추가합니다.",
    explanations: [
      "insert는 각 secondary index entry를 만들고 update는 indexed key가 바뀌면 delete+insert 성격을 가질 수 있습니다. monotonically increasing vs random key의 page locality/contention도 engine storage model에서 측정합니다.",
      "중복/overlapping indexes는 optimizer 선택지를 늘리지만 buffer/cache와 write amplification을 키웁니다. exact prefix, included columns, uniqueness와 실제 workload를 비교해 consolidate 후보를 찾습니다.",
      "index creation/rebuild는 scan, sort, temporary disk, redo/undo, replication lag와 metadata/row locks를 유발할 수 있습니다. online/concurrent option도 무잠금이 아니라 허용 DML/phase별 lock을 문서로 확인합니다.",
      "drop/create migration은 disk headroom, duration, cancel/rollback, failure cleanup과 replicas를 포함합니다. invisible index 또는 replica/canary로 plan impact를 검증하고 instant rollback 경로를 준비합니다.",
      "index lifecycle telemetry에는 size, growth, read/write usage, logical reads saved, DML latency, page split/bloat, rebuild age와 owning queries를 두고 raw indexed sensitive values는 남기지 않습니다.",
    ],
    concepts: [
      c("write amplification", "한 logical DML이 base table과 여러 indexes/log/replicas에 추가 writes를 만드는 비용입니다.", ["index 수/width와 증가합니다.", "latency·I/O·replication을 봅니다."]),
      c("online index DDL", "일부/대부분 DML을 허용하며 index를 생성·재구축하는 engine 기능입니다.", ["phase별 locks가 있을 수 있습니다.", "disk/log/cancel 비용이 남습니다."]),
      c("index ownership", "어떤 query/constraint/SLO가 index 비용을 정당화하는지 연결한 metadata입니다.", ["삭제·변경 review에 사용합니다.", "owner/expiry를 둡니다."]),
    ],
    diagnostics: [
      d("index 추가 후 insert p99와 replication lag가 악화됩니다.", "wide/overlapping index maintenance와 random-key page work가 write budget을 초과했습니다.", ["index count/bytes", "DML logical/physical writes", "page splits/locks", "replica apply lag"], "중복 index를 줄이고 narrow keys/partitioning/async architecture를 workload에 맞게 검토합니다.", "before/after read+write+replication capacity report와 rollback threshold를 둡니다."),
      d("online index 생성이 production을 잠깐 멈춥니다.", "prepare/publish metadata lock phase와 long transaction blockers를 고려하지 않았습니다.", ["engine DDL phases", "active long transactions", "lock wait graph", "disk/log/replica headroom"], "low-risk window, lock timeout, blocker cleanup/canary와 abort/rollback runbook으로 실행합니다.", "staging volume rehearsal와 production lock/lag circuit breaker를 둡니다."),
    ],
    expertNotes: ["index 변경 PR에는 expected query gain뿐 아니라 DML/storage/rebuild/replication 비용과 rollback threshold를 필수로 둡니다.", "unused 판단 기간은 전체 business/maintenance cycle을 포함하고 constraint/rare incident queries를 separately audit합니다."],
  },
  {
    id: "unique-null-collation-privacy",
    title: "UNIQUE의 NULL·collation·정규화와 민감 key 접근 표면을 검증합니다",
    lead: "email·token·request id 같은 identity index는 중복 방지와 빠른 조회를 제공하지만 NULL/case semantics와 개인정보·credential-like values를 별도 구조에 복제합니다.",
    explanations: [
      "원본 USERS.sql은 user_id/email/nickname와 social provider pairs, verification token에 uniqueness를 적용합니다. 공개 예제는 모두 synthetic이며 원본 값·host·token·email을 읽거나 복사하지 않습니다.",
      "UNIQUE nullable column이 여러 NULL을 허용하는지, Oracle empty string과 NULL, MySQL collation의 case/accent equality를 엔진별로 확인합니다. domain이 email 하나/없음이라면 nullable uniqueness와 normalized column 정책을 명시합니다.",
      "application LOWER/trim만으로 canonical identity를 만들면 Unicode·locale·IDN과 version drift가 생깁니다. verification된 canonical identifier, display value와 database comparison key를 분리하고 migration/duplicate quarantine을 설계합니다.",
      "token을 plaintext indexed column에 저장하면 backup/index pages와 DBA query에서 credential-like secret이 노출됩니다. 가능하면 random token의 keyed/cryptographic digest lookup, expiry, single-use와 least privilege를 설계합니다.",
      "unique violation에는 raw conflicting value를 response/log에 내지 않고 stable error code와 correlation만 제공합니다. existence enumeration과 timing/rate abuse를 위협 모델에 포함합니다.",
    ],
    concepts: [
      c("nullable uniqueness", "NULL 또는 missing identity를 허용하면서 non-null canonical values의 중복을 막는 계약입니다.", ["engine NULL semantics를 확인합니다.", "partial/function index option을 검토합니다."]),
      c("canonical identity key", "case/Unicode/domain 규칙을 적용해 uniqueness/lookup에 사용하는 안정된 값입니다.", ["display 값과 분리할 수 있습니다.", "normalizer version을 관리합니다."]),
      c("secret lookup digest", "원문 token 대신 검증 가능한 digest를 indexed lookup key로 저장하는 설계입니다.", ["random high-entropy token에 사용합니다.", "expiry/single-use와 결합합니다."]),
    ],
    codeExamples: [py("db15-unique-null", "UNIQUE 중복 거절과 NULL 경계", "db15_unique.py", "synthetic handle에 UNIQUE를 적용해 동일 non-null은 거절되고 SQLite에서는 두 NULL이 허용되는 engine-specific behavior를 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE identity(id INTEGER PRIMARY KEY, handle TEXT UNIQUE)")
db.execute("INSERT INTO identity VALUES (?, ?)", (1, "alpha"))
error = "none"
try:
    db.execute("INSERT INTO identity VALUES (?, ?)", (2, "alpha"))
except sqlite3.IntegrityError:
    error = "unique-violation"
db.execute("INSERT INTO identity VALUES (?, ?)", (3, None))
db.execute("INSERT INTO identity VALUES (?, ?)", (4, None))
rows = db.execute("SELECT id, handle FROM identity ORDER BY id").fetchall()
null_count = sum(handle is None for _, handle in rows)
print("duplicate=" + error)
print(f"rows={len(rows)}")
print(f"null-rows={null_count}")
print("non-null-handles=" + ",".join(handle for _, handle in rows if handle is not None))
print("sqlite-multiple-null=true")`, "duplicate=unique-violation\nrows=3\nnull-rows=2\nnon-null-handles=alpha\nsqlite-multiple-null=true", ["local-users", "mysql-create-index", "oracle-create-index", "sqlite-create-index"]),
    ],
    diagnostics: [
      d("case가 다른 identifier가 예상과 다르게 중복/허용됩니다.", "DB collation과 application normalization/domain policy가 다릅니다.", ["column/index collation", "canonicalization version", "Unicode/case/accent fixtures", "existing collisions"], "canonical identity column과 명시적 collation/unique contract를 정의하고 collisions를 migration 전에 quarantine합니다.", "engine/driver Unicode golden fixtures와 upgrade replay를 둡니다."),
      d("verification token이 logs/backups/index dump에서 노출됩니다.", "plaintext credential-like value를 indexed/logged하고 access/retention을 제한하지 않았습니다.", ["schema/index contents", "query/error logs", "backup/replica access", "expiry/single-use"], "high-entropy token digest lookup, redaction, least privilege, short TTL와 incident rotation을 적용합니다.", "secret scanner와 backup/log readback, expired/replay tests를 둡니다."),
    ],
    expertNotes: ["로컬 USERS.sql은 구조만 감사하고 real-looking sample/identifier values는 학습자료나 telemetry로 옮기지 않습니다.", "unique/index error를 공개할 때 existence privacy와 idempotency/product UX를 함께 설계합니다."],
  },
  {
    id: "plan-statistics-index-lifecycle",
    title: "EXPLAIN actual·statistics·canary·회귀와 index lifecycle을 운영합니다",
    lead: "index 설계는 CREATE INDEX로 끝나지 않고 plan evidence, production-like 검증, 안전한 배포, drift 관측과 제거/복구까지 이어집니다.",
    explanations: [
      "baseline에는 query fingerprint, bind distribution, schema/index/stats/engine version, result ids/count, EXPLAIN estimated+actual, rows examined/returned, I/O/temp/locks와 latency percentiles를 둡니다.",
      "새 index는 correctness를 바꾸지 않아야 합니다. before/after ordered ids와 transaction visibility를 비교하고 performance는 cold/warm, hot/cold binds, concurrent writes와 realistic volume에서 측정합니다.",
      "staging data가 작거나 균등하면 production skew를 놓칩니다. anonymized distributions 또는 synthetic generator로 cardinality, correlation, row width와 largest tenant를 재현하되 원본 sensitive values를 복사하지 않습니다.",
      "배포는 disk/log/lock/replica headroom, online DDL/canary/invisible exposure, plan cache invalidation, acceptance thresholds와 cancel/rollback을 포함합니다. 생성 성공 후 expected metadata와 target plans를 readback합니다.",
      "운영 중 plan drift, estimate error, latency/rows examined, index size/usage/write cost와 stats age를 관측합니다. regression 시 query/index/stats/engine change를 correlation하고 old index/plan 복구 경로를 실행합니다.",
    ],
    concepts: [
      c("plan baseline", "query·bind·schema·stats·engine context와 expected plan/resource/result를 저장한 비교 기준입니다.", ["plan text만 저장하지 않습니다.", "correctness ids와 budgets를 포함합니다."]),
      c("index canary", "일부 replica/session/workload에서 새 index의 plan·성능·write 영향을 제한 검증하는 배포 단계입니다.", ["engine invisible index 기능을 활용할 수 있습니다.", "rollback threshold를 둡니다."]),
      c("index lifecycle", "제안→검증→생성→관측→재평가→제거/복구의 ownership 과정입니다.", ["owning queries와 expiry를 둡니다.", "full business cycle을 봅니다."]),
    ],
    diagnostics: [
      d("index 배포 직후 일부 query plan이 예상 밖으로 악화됩니다.", "optimizer가 새 index를 다른 queries에도 선택했거나 stats/plan cache가 변했습니다.", ["plan diff across fingerprints", "bind distributions", "stats/cache invalidation", "canary/invisible support"], "visibility/canary를 되돌리고 affected queries를 evidence로 튜닝한 뒤 재승인합니다.", "top query corpus plan qualification과 rollback automation을 둡니다."),
      d("index 제거 후 월말 report가 수 시간 걸립니다.", "짧은 usage window가 rare business-cycle workload를 놓쳤습니다.", ["full-cycle query history", "owner/lineage", "scheduled jobs", "restore build duration/headroom"], "deprecated/invisible 기간을 전체 cycle 유지하고 replay 후 제거하며 rebuild runbook을 준비합니다.", "quarter/month-end/incident query corpus와 removal checklist를 둡니다."),
    ],
    expertNotes: ["index SLO는 단일 query latency가 아니라 endpoint/job total work와 DML/replica/storage 영향까지 포함합니다.", "학습자료에는 raw production SQL values를 싣지 않고 query shape·anonymized distribution·normalized plan evidence를 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-users", repository: "dbstudy", path: "USERS.sql", usedFor: ["7-table identity/security schema and 19 explicit secondary-index workload-shape provenance"], evidence: "원본을 read-only로 구조/개수만 감사했고 email, token, request data 같은 값은 복사하지 않았습니다." },
  { id: "mysql-indexes", repository: "MySQL 8.4 Reference Manual", path: "How MySQL Uses Indexes", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html", usedFor: ["B-tree access, lookup, ordering and covering concepts"], evidence: "MySQL 공식 index 사용 문서입니다." },
  { id: "mysql-multiple-column", repository: "MySQL 8.4 Reference Manual", path: "Multiple-Column Indexes", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html", usedFor: ["composite leading prefix and column order"], evidence: "MySQL 공식 복합 index 문서입니다." },
  { id: "mysql-create-index", repository: "MySQL 8.4 Reference Manual", path: "CREATE INDEX Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-index.html", usedFor: ["unique, expression, descending, invisible and online DDL syntax"], evidence: "MySQL 공식 CREATE INDEX 문서입니다." },
  { id: "mysql-generated-column-index", repository: "MySQL 8.4 Reference Manual", path: "Optimizer Use of Generated Column Indexes", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/generated-column-index-optimizations.html", usedFor: ["expression sargability portability"], evidence: "MySQL 공식 generated-column index 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["estimated and actual plan evidence"], evidence: "MySQL 공식 EXPLAIN 문서입니다." },
  { id: "oracle-create-index", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE INDEX", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-INDEX.html", usedFor: ["Oracle B-tree, function-based, descending and online index portability"], evidence: "Oracle 공식 CREATE INDEX 문서입니다." },
  { id: "oracle-access-paths", repository: "Oracle Database 26ai SQL Tuning Guide", path: "Optimizer Access Paths", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/optimizer-access-paths.html", usedFor: ["index range/full/skip scan and table access evidence"], evidence: "Oracle 공식 SQL tuning 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["exact small index search/order/covering laboratory"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["SEARCH, SCAN, covering and temp-order evidence normalization"], evidence: "SQLite 공식 EXPLAIN QUERY PLAN 문서입니다." },
  { id: "sqlite-create-index", repository: "SQLite Documentation", path: "CREATE INDEX", publicUrl: "https://www.sqlite.org/lang_createindex.html", usedFor: ["unique, collation and NULL laboratory boundaries"], evidence: "SQLite 공식 CREATE INDEX 문서입니다." },
  { id: "sqlite-expridx", repository: "SQLite Documentation", path: "Indexes On Expressions", publicUrl: "https://www.sqlite.org/expridx.html", usedFor: ["expression index exact-match semantics"], evidence: "SQLite 공식 expression index 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-15-index-composite-order", slug: "db-15-index-composite-order", courseId: "database", moduleId: "db-programmability-performance", order: 7,
  title: "인덱스·복합 인덱스와 선택도", subtitle: "B-tree를 prefix·covering·sargability·통계·정렬·write/DDL·privacy·lifecycle 계약으로 운영합니다.", level: "고급", estimatedMinutes: 960,
  coreQuestion: "어떤 query shape와 data distribution을 위해 어떤 key 순서의 index를 만들고, 읽기 개선이 정확성·write·storage·lock·privacy 비용보다 크다는 것을 어떻게 증명할까요?",
  summary: "dbstudy USERS.sql의 user/security/activity 7-table 구조와 primary/foreign/unique, 19개 explicit secondary indexes를 read-only로 감사하되 identifiers/token/request values는 복사하지 않습니다. B-tree access mental model, constraint/support/performance index, composite leading prefix/equality-range-order, covering/late materialization, sargability/functions/casts, selectivity/correlation/bind skew/stats, pagination order, write/storage/online DDL, unique NULL/collation/privacy와 plan/canary lifecycle까지 확장합니다. 다섯 exact Python/SQLite examples는 composite search, missing prefix scan/sort, covering projection, expression index와 UNIQUE NULL semantics를 실제 실행합니다.",
  objectives: ["B-tree key order, access path, row locator와 ORDER/LIMIT early stop을 설명한다.", "constraint/support/performance index 책임과 UNIQUE NULL/collation을 구분한다.", "복합 leading prefix와 equality→range→order key sequence를 설계한다.", "covering/index-only와 late materialization의 read/write trade-off를 검증한다.", "함수·cast·LIKE·date predicate의 sargability와 expression index를 적용한다.", "selectivity·correlation·bind skew·statistics로 plan estimates를 진단한다.", "pagination total order와 index direction/cursor를 맞춘다.", "write/storage/lock/online DDL/privacy/canary/rollback lifecycle을 운영한다."],
  prerequisites: [{ title: "격리·잠금·deadlock", reason: "index access와 online DDL이 row/key/metadata locks와 transaction concurrency에 미치는 영향을 이해해야 합니다.", sessionSlug: "db-14-isolation-locking-deadlock" }],
  keywords: ["B-tree", "index", "composite index", "leading prefix", "selectivity", "covering index", "index-only scan", "sargability", "expression index", "collation", "statistics", "keyset", "write amplification", "online DDL", "EXPLAIN"], topics,
  lab: {
    title: "익명화한 회원·인증·활동 workload의 index portfolio 설계하기",
    scenario: "tenant별 회원 상태, 인증 요청/만료, 활동 이력을 조회·정리·page하며 hot tenant와 concurrent writes가 있습니다. 실제 USERS.sql 값은 사용하지 않고 구조·분포만 synthetic으로 재현합니다.",
    setup: ["synthetic opaque tenant/user/request ids, NULL/case/skew/tie/hot-cold distributions만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 production-like row counts/width/stats를 준비합니다.", "query corpus, filter/join/order/projection, bind distribution, SLO와 write/storage/DDL budgets를 작성합니다.", "before ordered ids/counts와 plan/resource baseline을 고정합니다."],
    steps: ["constraint backing/support/performance indexes와 owning queries를 분류합니다.", "각 query의 equality/range/order/projection과 target grain을 표시합니다.", "single/composite key candidates의 leading prefix와 duplicate overlap을 비교합니다.", "narrow/covering/late-materialization alternatives를 read/write 비용으로 측정합니다.", "function/cast/LIKE/date predicates를 equivalent sargable ranges로 바꾸고 ids를 대조합니다.", "hot/cold/skew/correlated binds에서 estimated/actual rows와 plan을 비교합니다.", "keyset ORDER/cursor tuple과 NULL/collation/index direction을 conformance-test합니다.", "UNIQUE NULL/case/Unicode/token digest와 error privacy를 negative-test합니다.", "online build의 lock/temp/disk/log/replica/DML impact와 abort/rollback을 rehearsal합니다.", "full query corpus correctness, rows examined/I/O/latency와 DML/storage/lag를 canary/readback 후 승인합니다."],
    expectedResult: ["모든 query가 동일한 authorized ordered ids/count를 반환하고 승인 access path를 사용합니다.", "leading prefix, covering/sargability와 pagination index 선택 근거가 actual plan/resource로 설명됩니다.", "UNIQUE/NULL/collation/token privacy와 concurrent duplicate behavior가 domain contract와 일치합니다.", "read SLO 개선이 write/storage/lock/rebuild/replication budgets 안에 있습니다.", "canary·metadata/plan readback·owner/expiry·rollback과 privacy-safe telemetry가 운영됩니다."],
    cleanup: ["isolated schemas·synthetic rows/indexes와 plan artifacts를 run id로 제거합니다.", "temporary credentials/exports를 revoke·삭제합니다.", "logs/artifacts에 real email/token/request/PII와 bind values가 없는지 검사합니다.", "production USERS.sql/data는 변경하지 않습니다."],
    extensions: ["partial/filtered, bitmap/domain, full-text/trigram/vector indexes를 workload별로 비교합니다.", "partitioned/sharded global/local index와 online repartition을 검증합니다.", "automatic indexing advisor recommendations를 workload replay로 반증/승인합니다.", "collation upgrade·key rotation·right-to-erasure 시 index rebuild/retention을 설계합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 predicate→index prefix→plan flag→ordered ids를 표로 쓰세요.", requirements: ["stdout 완전 일치를 확인합니다.", "SEARCH와 SCAN을 result correctness와 분리합니다.", "missing leading key의 temp sort를 설명합니다.", "covering이 projection-dependent임을 보입니다.", "expression index 전후 same ids를 확인합니다.", "UNIQUE non-null/NULL behavior를 engine-specific로 표시합니다."], hints: ["index 사용 여부보다 access condition과 returned ids를 먼저 확인하세요."], expectedOutcome: "index를 이름 암기가 아니라 query/data/cost contract로 설명합니다.", solutionOutline: ["correct ids→query shape→key order→plan→resource→write cost 순서입니다."] },
    { difficulty: "응용", prompt: "원본 USERS.sql 구조를 익명 synthetic workload로 재현해 index portfolio를 재설계하세요.", requirements: ["원본 table/index counts provenance를 보존합니다.", "real values/PII/token을 복사하지 않습니다.", "query corpus와 bind/skew distributions를 정의합니다.", "constraints/support/performance ownership을 분류합니다.", "composite/covering/sargable/page alternatives를 실행합니다.", "MySQL·Oracle actual plan/lock/DDL matrix를 실행합니다.", "UNIQUE/collation/privacy와 write/storage/replica cost를 검증합니다.", "canary/readback/telemetry/rollback/removal lifecycle을 포함합니다."], hints: ["각 index가 어떤 query/SLO를 소유하는지 말할 수 없으면 제거 후보입니다."], expectedOutcome: "정확성·성능·write·privacy·운영이 균형 잡힌 index portfolio가 완성됩니다.", solutionOutline: ["source audit→workload→candidates→correctness→plans→capacity→canary→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 index 설계·변경 governance를 작성하세요.", requirements: ["query shape/key order/selectivity/stats evidence schema를 정의합니다.", "constraint/support/performance ownership을 둡니다.", "covering/expression/pagination/collation 규칙을 둡니다.", "read/rows-examined/I/O와 write/storage/replica/rebuild budgets를 정의합니다.", "sensitive keys/token digest/access/retention을 포함합니다.", "online DDL lock/disk/log/cancel/rollback을 정의합니다.", "canary/plan corpus/stats/upgrade qualification을 요구합니다.", "usage/owner/expiry/full-cycle removal/recovery를 정의합니다."], hints: ["CREATE INDEX 성공은 query improvement나 안전한 운영의 증거가 아닙니다."], expectedOutcome: "제안부터 폐기까지 재현 가능한 전문가 index 표준이 완성됩니다.", solutionOutline: ["justify→model→measure→rehearse→canary→readback→observe→retire 순서입니다."] },
  ],
  nextSessions: ["db-16-explain-query-tuning"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["USERS.sql을 read-only로 감사해 7개 CREATE TABLE, 19개 explicit secondary INDEX/ADD INDEX와 primary/unique/foreign key relationship shapes를 확인했습니다.", "실제 email/token/request/address/user activity 값과 credential-like literals는 읽어 옮기지 않고 table/index counts와 anonymized query shapes만 provenance로 사용했습니다.", "원본은 B-tree access, prefix/covering/sargability, selectivity/correlation/stats, plan evidence와 write/online-DDL/privacy lifecycle을 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai의 clustered/heap storage, cost model/stats, index-only prerequisites, online DDL locks와 concurrency를 대체하지 않습니다."] },
});

export default session;
