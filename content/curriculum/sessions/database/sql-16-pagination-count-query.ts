import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "sqlite3 memory database 또는 immutable synthetic id 목록을 준비해 외부 DB·credential 없이 page boundary를 재현합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "total order, shared filter, offset drift, composite keyset와 count/list snapshot 차이를 각각 계산합니다." },
      { lines: "마지막 5줄", explanation: "page ids·cursor boundary·count parity·overlap 같은 안정된 evidence만 출력합니다. production plan/isolation은 MySQL·Oracle에서 다시 측정합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite laboratory는 MySQL LIMIT/OFFSET·Oracle row_limiting_clause의 plan/isolation을 대체하지 않습니다."] },
    experiments: [
      { change: "동률 sort key, 중간 insert/delete와 검색 filter를 추가합니다.", prediction: "total order·snapshot·predicate parity가 없으면 duplicate/missing/count drift가 나타납니다.", result: "각 page의 boundary key와 canonical eligible ids를 함께 비교합니다." },
      { change: "OFFSET을 깊게 늘리고 같은 composite index로 keyset query를 실행합니다.", prediction: "offset은 앞 행을 건너뛰는 비용이 증가하지만 keyset은 boundary 이후 range로 시작할 수 있습니다.", result: "EXPLAIN actual rows examined와 latency percentiles로 선택을 증명합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "pagination-public-contract",
    title: "페이징을 page number가 아니라 ordered snapshot slice 계약으로 정의합니다",
    lead: "LIMIT 10은 단지 최대 행 수입니다. 어떤 population의 어느 정렬 snapshot에서 어떤 boundary를 잘랐는지 정의해야 사용자가 중복·누락 없이 탐색할 수 있습니다.",
    explanations: [
      "원본 dbstudy 02_03.sql은 ORDERID DESC에 LIMIT 3 OFFSET 0·3·6과 CEIL(COUNT(*)/3), 검색 join page를 보여 줍니다. Paging.java는 nowPage, nowBlock, numPerPage, pagePerBlock, totalRecord/totalPage/totalBlock, begin/endBlock과 MySQL/MariaDB용 offset을 보관합니다.",
      "공개 API 계약에는 canonical filter, total order, page size maximum/default, offset/page 또는 opaque cursor, direction, snapshot/freshness, total count semantics와 empty/out-of-range behavior를 포함합니다. UI block 계산과 DB row selection을 분리합니다.",
      "page는 집합이 아니라 순서 있는 slice입니다. 정렬 기준이 바뀌거나 authorization/filter version이 달라지면 같은 page number/cursor가 같은 population을 가리키지 않습니다.",
      "nowPage·numPerPage·pagePerBlock은 untrusted request input입니다. 음수, zero, overflow와 지나친 size를 allow-list/range validation하고 arithmetic은 long/checked math로 계산합니다.",
      "정확한 total이 필수가 아닌 infinite scroll에서는 hasNext를 pageSize+1 조회로 계산할 수 있습니다. 반대로 법적 export나 page navigation에서는 consistent exact count가 필요할 수 있으므로 비용과 freshness를 명시합니다.",
    ],
    concepts: [
      c("ordered snapshot slice", "정의된 population과 total order의 한 시점에서 연속 boundary 사이에 있는 행 묶음입니다.", ["order와 snapshot을 포함합니다.", "LIMIT만으로 정의되지 않습니다."]),
      c("navigation metadata", "page/size/hasNext/totalElements/totalPages 또는 cursor를 소비자에게 제공하는 정보입니다.", ["exact와 estimated를 구분합니다.", "DB selection과 UI block을 분리합니다."]),
      c("page contract version", "filter·sort·cursor schema·authorization과 freshness 의미가 호환되는 범위를 나타냅니다.", ["cursor에 포함하거나 서버 상태로 검증합니다.", "변경 시 기존 cursor 처리 방식을 정합니다."]),
    ],
    diagnostics: [
      d("같은 page URL을 새로고침하자 전혀 다른 항목이 보입니다.", "정렬/snapshot/freshness 계약이 없고 live data 변화를 page number만으로 해석했습니다.", ["effective filter/sort", "data mutations", "isolation/snapshot token", "cache/version"], "total order와 consistency mode를 문서화하고 stable browse가 필요하면 snapshot 또는 keyset boundary를 사용합니다.", "mutation interleaving contract tests와 response metadata readback을 둡니다."),
      d("매우 큰 size나 음수 page로 DB가 느려지거나 오류가 납니다.", "page input range와 offset multiplication을 검증하지 않았습니다.", ["parsed numeric range", "page*size overflow", "maximum response bytes", "query timeout"], "server-side maximum/default와 checked arithmetic을 적용하고 invalid input을 일관된 4xx로 거절합니다.", "boundary/fuzz tests와 per-principal query budget을 둡니다."),
    ],
    expertNotes: ["사용자에게 보이는 page block은 presentation concern이고 DB contract의 핵심은 population·order·boundary·consistency입니다.", "정확한 total, estimated total과 unknown total을 같은 숫자 필드로 섞지 않습니다."],
  },
  {
    id: "total-order-tie-null-collation",
    title: "동률·NULL·collation까지 포함한 total order를 만듭니다",
    lead: "created_at DESC처럼 중복 가능한 key 하나만 정렬하면 page boundary에서 동률 행의 상대 순서가 보장되지 않습니다.",
    explanations: [
      "total order는 임의의 서로 다른 두 eligible rows의 선후가 결정되는 정렬입니다. business sort key 뒤에 immutable unique id를 같은 방향 또는 명시한 방향으로 붙여 tie-breaker를 만듭니다.",
      "NULLS FIRST/LAST 기본값은 엔진·direction에 따라 다를 수 있습니다. nullable sort는 CASE null rank 또는 지원 syntax로 정책을 고정하고 keyset predicate에도 같은 null semantics를 반영합니다.",
      "text sort는 collation·case·accent·Unicode normalization에 따라 동률과 순서가 달라집니다. 사용자 locale sort와 안정적 cursor identity를 분리하고 마지막 unique id를 반드시 포함합니다.",
      "JOIN 결과에서 parent가 child 수만큼 반복되면 unique parent id를 tie-breaker로 넣어도 parent page가 아닙니다. parent grain을 DISTINCT로 숨기지 말고 EXISTS, pre-aggregation 또는 parent id page 후 detail fetch를 사용합니다.",
      "order expression과 cursor tuple은 같은 sequence·direction·normalization을 사용해야 합니다. SELECT alias/UI label만 보고 predicate를 따로 작성하면 gap이나 overlap이 생깁니다.",
    ],
    concepts: [
      c("total order", "모든 eligible row pair의 안정적인 상대 순서를 결정하는 sort tuple입니다.", ["unique immutable tie-breaker를 포함합니다.", "cursor tuple과 동일해야 합니다."]),
      c("tie group", "주요 sort key 값이 같은 여러 행입니다.", ["page boundary를 가로지를 수 있습니다.", "id tie-breaker로 순서를 결정합니다."]),
      c("NULL/collation policy", "nullable/text sort의 engine-dependent 순서를 명시적으로 고정하는 규칙입니다.", ["index 호환성을 측정합니다.", "cursor encoding에도 보존합니다."]),
    ],
    codeExamples: [py("sql16-total-order-pages", "동률을 unique id로 끊는 안정적 페이지", "sql16_total_order.py", "중복 score를 score DESC,id DESC로 정렬해 세 page가 겹치지 않고 전체를 정확히 덮는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item(id INTEGER PRIMARY KEY, score INTEGER NOT NULL)")
db.executemany("INSERT INTO item VALUES (?, ?)", [(1, 80), (2, 90), (3, 90), (4, 100), (5, 100)])
pages = []
for offset in (0, 2, 4):
    ids = [row[0] for row in db.execute("SELECT id FROM item ORDER BY score DESC, id DESC LIMIT 2 OFFSET ?", (offset,))]
    pages.append(ids)
for number, ids in enumerate(pages, 1):
    print(f"page{number}=" + ",".join(map(str, ids)))
flat = [item_id for page in pages for item_id in page]
print("unique=" + str(len(flat) == len(set(flat))).lower())
print("covered=" + str(sorted(flat) == [1, 2, 3, 4, 5]).lower())`, "page1=5,4\npage2=3,2\npage3=1\nunique=true\ncovered=true", ["mysql-select", "oracle-select", "sqlite-select"]),
    ],
    diagnostics: [
      d("page 경계의 동률 항목이 반복되거나 사라집니다.", "ORDER BY가 unique하지 않아 optimizer/plan에 따라 tie order가 바뀝니다.", ["sort tuple uniqueness", "tie cardinality", "NULL/collation", "cursor predicate tuple"], "immutable unique id를 final tie-breaker로 추가하고 index/cursor/test에 동일한 tuple을 사용합니다.", "삽입 순서·plan을 바꾸는 tie-heavy fixtures를 둡니다."),
      d("검색 join에서 한 게시물이 여러 page에 나타납니다.", "child match 수가 parent row를 증식시켜 paging grain이 바뀌었습니다.", ["JOIN cardinality", "SELECT row와 target entity grain", "COUNT(*) vs COUNT(DISTINCT parent.id)", "EXISTS 가능성"], "parent ids를 원하는 grain으로 먼저 page하고 details를 별도 fetch/pre-aggregate합니다.", "zero/one/many child fixtures와 entity-id uniqueness assertion을 둡니다."),
    ],
    expertNotes: ["ORDER BY key와 keyset WHERE tuple을 한 정의에서 생성하거나 conformance test로 완전 동일함을 검증합니다.", "random sort는 stable seed/snapshot 없이는 pagination 계약이 아니며 cache와 재현성을 깨뜨립니다."],
  },
  {
    id: "offset-page-arithmetic-boundaries",
    title: "LIMIT·OFFSET과 page/block 산술을 overflow·경계값까지 검증합니다",
    lead: "1-based nowPage를 0-based offset으로 바꾸는 작은 식에도 off-by-one, zero size, integer overflow와 out-of-range 정책이 숨어 있습니다.",
    explanations: [
      "일반적인 offset은 (page-1)*size입니다. page>=1, 1<=size<=max를 먼저 검증하고 곱셈 결과가 DB bind type/driver integer 범위 안인지 checked arithmetic으로 확인합니다.",
      "totalPages는 totalElements=0 정책과 함께 ceil(total/size)로 계산합니다. integer 식 (total+size-1)/size는 addition overflow가 가능하므로 total/size + remainder 방식 또는 safe library를 사용합니다.",
      "Paging.java의 block navigation은 nowBlock, pagePerBlock, beginBlock, endBlock와 totalBlock을 계산합니다. UI block 마지막을 min으로 clamp하고 DB offset과 서로 독립적으로 unit test합니다.",
      "out-of-range page는 empty list, redirect/clamp 또는 404 중 하나를 계약으로 선택합니다. 조용히 마지막 page로 clamp하면 bookmarked URL 의미가 바뀌고 mutation 중 예측하기 어렵습니다.",
      "LIMIT/OFFSET bind 지원과 syntax는 driver/engine별로 확인합니다. 숫자를 SQL 문자열로 연결하지 말고 검증된 integer parameter 또는 framework paging API를 사용합니다.",
    ],
    concepts: [
      c("offset arithmetic", "1-based page와 positive size를 건너뛸 row count로 바꾸는 checked calculation입니다.", ["(page-1)*size입니다.", "validation 후 계산합니다."]),
      c("page block", "UI가 한 번에 표시하는 page-number 구간입니다.", ["DB page selection과 별개입니다.", "totalPage에 맞춰 끝을 clamp합니다."]),
      c("out-of-range policy", "요청 page가 current total을 넘을 때 응답을 어떻게 표현하는지 정한 계약입니다.", ["mutation/freshness와 함께 정의합니다.", "silent clamp를 피합니다."]),
    ],
    diagnostics: [
      d("첫 page가 비거나 두 번째 page가 page size만큼 어긋납니다.", "1-based page와 0-based offset 변환에 off-by-one이 있습니다.", ["page=1 offset", "page=2 offset", "size=1", "last/empty page"], "offset=(page-1)*size를 단일 함수로 만들고 table-driven boundary tests를 둡니다.", "page1/page2/last/beyond/zero invalid fixtures를 고정합니다."),
      d("큰 page 요청에서 offset이 음수가 되거나 query가 비정상입니다.", "integer multiplication overflow 또는 DB/driver bind 범위를 넘었습니다.", ["application numeric type", "checked multiply", "DB LIMIT/OFFSET range", "maximum depth policy"], "maximum page/offset budget을 제한하고 deep navigation은 keyset/search로 유도합니다.", "max-1/max/overflow fuzz tests와 rejected-request telemetry를 둡니다."),
    ],
    expertNotes: ["UI block 계산의 correctness를 DB query가 우연히 보정하게 두지 말고 pure function test로 증명합니다.", "deep offset을 허용할 때는 latency/rows-examined budget과 maximum depth를 API 계약에 포함합니다."],
  },
  {
    id: "count-list-predicate-parity",
    title: "COUNT query와 list query의 population·grain·권한을 한 정의로 유지합니다",
    lead: "목록은 검색된 게시물인데 count는 전체 게시물이라면 totalPages는 문법적으로 계산돼도 의미가 틀립니다.",
    explanations: [
      "count와 list는 tenant, authorization, soft delete, search, status, time boundary와 join existence를 완전히 공유해야 합니다. projection/order/fetch detail만 달라져야 하며 predicate builder/CTE/specification을 재사용합니다.",
      "JOIN child filter는 parent를 중복시킬 수 있습니다. 목록 grain이 parent이면 COUNT(DISTINCT parent.id), EXISTS 또는 parent ids relation을 쓰되 DISTINCT가 join 결함/성능을 숨기지 않는지 검증합니다.",
      "COUNT(*)를 page query의 window COUNT(*) OVER()로 합칠 수 있지만 empty out-of-range page에서는 count row 자체가 없어질 수 있고 모든 matching rows 처리 비용도 남습니다. 두 query와 one-query 방식을 data distribution에서 비교합니다.",
      "exact count가 비싸면 estimated/rounded/unknown을 별도 status와 asOf/watermark로 제공합니다. estimated value를 exact totalElements 필드에 넣지 않습니다.",
      "count와 list가 다른 transaction/snapshot에서 실행되면 mutation으로 불일치할 수 있습니다. consistency requirement에 따라 repeatable snapshot, single query, version/watermark 또는 eventual caveat를 선택합니다.",
    ],
    concepts: [
      c("predicate parity", "count와 page rows가 동일한 canonical eligibility relation에서 계산되는 성질입니다.", ["권한·soft delete를 포함합니다.", "projection과 order만 분리합니다."]),
      c("count grain", "COUNT가 세는 entity/event 단위입니다.", ["join row count와 다를 수 있습니다.", "list item identity와 맞춥니다."]),
      c("count quality", "total이 exact, estimated, lower-bound 또는 unknown인지와 as-of 시점을 나타내는 metadata입니다.", ["숫자만 전달하지 않습니다.", "consumer UI 의미를 구분합니다."]),
    ],
    codeExamples: [py("sql16-count-filter-parity", "검색 목록과 count의 공통 predicate", "sql16_count_parity.py", "status와 title 검색 predicate를 한 곳에서 사용해 page ids, exact count와 total pages가 일치하는지 검증합니다.", String.raw`import math
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE article(id INTEGER PRIMARY KEY, status TEXT, title TEXT)")
db.executemany("INSERT INTO article VALUES (?, ?, ?)", [
    (1, "open", "sql start"), (2, "closed", "sql old"), (3, "open", "java"),
    (4, "open", "advanced sql"), (5, "closed", "css"), (6, "open", "sql plan")
])
where = "status = ? AND title LIKE ?"
params = ("open", "%sql%")
eligible = [row[0] for row in db.execute(f"SELECT id FROM article WHERE {where} ORDER BY id", params)]
count = db.execute(f"SELECT count(*) FROM article WHERE {where}", params).fetchone()[0]
page_size = 2
print("eligible=" + ",".join(map(str, eligible)))
print(f"count={count}")
print(f"total-pages={math.ceil(count / page_size)}")
print("page1=" + ",".join(map(str, eligible[:page_size])))
print("page2=" + ",".join(map(str, eligible[page_size:])))
print("parity=" + str(count == len(eligible)).lower())`, "eligible=1,4,6\ncount=3\ntotal-pages=2\npage1=1,4\npage2=6\nparity=true", ["local-0203", "local-paging-java", "mysql-select", "sqlite-select"]),
    ],
    diagnostics: [
      d("검색 결과는 3개인데 totalElements는 전체 테이블 수입니다.", "count query에 search/tenant/soft-delete predicate가 누락됐습니다.", ["canonical eligibility SQL", "count/list bound params", "authorization context", "generated SQL logs without values"], "공통 predicate/eligible ids relation을 재사용하고 canonical fixture에서 id set과 count를 reconciliation합니다.", "모든 filter 조합에 count==eligible distinct ids property test를 둡니다."),
      d("child join을 추가하자 total이 실제 게시물보다 커졌습니다.", "COUNT(*)가 join rows를 세고 목록은 parent entity를 기대합니다.", ["target grain", "parent ids duplicates", "join cardinality", "EXISTS/pre-aggregation alternative"], "parent id relation을 먼저 정의하고 EXISTS 또는 정확한 distinct parent count를 사용합니다.", "0/1/N child fixtures와 list id uniqueness를 둡니다."),
    ],
    expertNotes: ["query builder 재사용만 믿지 말고 실제 bound filter set과 canonical eligible ids를 acceptance에서 비교합니다.", "COUNT 최적화 때문에 authorization predicate를 생략하는 것은 성능 개선이 아니라 정보 노출입니다."],
  },
  {
    id: "live-mutation-offset-drift",
    title: "insert·delete·update 사이에서 OFFSET duplicate/missing을 재현하고 consistency를 선택합니다",
    lead: "OFFSET은 현재 정렬 결과에서 N개를 건너뜁니다. 앞쪽에 행이 삽입되거나 삭제되면 다음 요청의 N번째 위치가 이동합니다.",
    explanations: [
      "첫 page 후 상단에 새 행이 삽입되면 기존 마지막 행이 한 칸 밀려 offset page2에서 다시 보일 수 있습니다. 삭제되면 원래 page2 첫 행이 offset 앞쪽으로 이동해 누락될 수 있습니다.",
      "sort key update도 delete+insert처럼 위치를 옮깁니다. created_at을 수정 가능하게 두거나 popularity처럼 계속 변하는 sort는 stable browse 계약과 충돌하므로 snapshot/epoch 또는 cursor policy를 정합니다.",
      "한 transaction의 repeatable snapshot은 count/list와 여러 page를 모두 같은 snapshot으로 만들 수 있지만 HTTP 요청 사이 긴 transaction은 connection/undo/resource 문제를 만듭니다. DB snapshot token 지원, materialized search result 또는 keyset의 relative stability를 비교합니다.",
      "live feed에서는 새 항목을 다음 refresh에 보여 주고 이미 본 boundary 이전 items를 건너뛰는 keyset이 자연스럽습니다. numbered archive에서는 versioned snapshot/materialization이 더 적합할 수 있습니다.",
      "중복/누락 acceptance는 화면 text가 아니라 immutable item ids와 page boundary를 mutation sequence마다 합집합/교집합으로 검증합니다.",
    ],
    concepts: [
      c("offset drift", "page 요청 사이 앞선 rows 변화로 동일 offset이 다른 logical boundary를 가리키는 현상입니다.", ["insert는 duplicate를 만들 수 있습니다.", "delete는 missing을 만들 수 있습니다."]),
      c("browse consistency", "여러 page 요청이 하나의 snapshot, live evolving feed 또는 명시한 epoch 중 무엇을 탐색하는지 정한 규칙입니다.", ["product semantics가 결정합니다.", "DB isolation 이름만으로 충분하지 않습니다."]),
      c("mutation interleaving", "page 요청 사이 insert/delete/update를 배치해 boundary invariants를 시험하는 시나리오입니다.", ["id overlap/gap을 검사합니다.", "sort-key update도 포함합니다."]),
    ],
    codeExamples: [py("sql16-offset-drift-keyset", "상단 insert 후 OFFSET duplicate와 keyset 경계 비교", "sql16_offset_drift.py", "첫 page 뒤 새 id가 맨 앞에 추가되었을 때 offset page2는 id 8을 반복하지만 id<8 keyset은 다음 items를 반환함을 재현합니다.", String.raw`initial = list(range(10, 0, -1))
page_size = 3
page1 = initial[:page_size]
after_insert = [11] + initial
offset_page2 = after_insert[page_size:page_size * 2]
boundary = page1[-1]
keyset_page2 = [item_id for item_id in after_insert if item_id < boundary][:page_size]
print("page1=" + ",".join(map(str, page1)))
print("offset-page2=" + ",".join(map(str, offset_page2)))
print("offset-overlap=" + ",".join(map(str, sorted(set(page1) & set(offset_page2)))))
print("keyset-page2=" + ",".join(map(str, keyset_page2)))
print("keyset-overlap=" + str(bool(set(page1) & set(keyset_page2))).lower())`, "page1=10,9,8\noffset-page2=8,7,6\noffset-overlap=8\nkeyset-page2=7,6,5\nkeyset-overlap=false", ["mysql-limit-optimization", "oracle-select", "sqlite-select"]),
    ],
    diagnostics: [
      d("무한 스크롤에서 이미 본 항목이 다시 나타납니다.", "첫 page 뒤 앞쪽 insert/update로 offset boundary가 이동했습니다.", ["page boundary ids", "mutation timeline", "sort tuple changes", "effective offset"], "immutable total-order keyset cursor를 사용하거나 versioned snapshot을 고정합니다.", "insert/delete/update interleaving에서 page id intersection을 검사합니다."),
      d("snapshot을 적용했더니 DB connection/undo 사용량이 커집니다.", "여러 HTTP page 요청 동안 장기 transaction snapshot을 유지했습니다.", ["transaction age", "connection pool occupancy", "undo/version retention", "product consistency need"], "짧은 request snapshot+keyset, materialized result id 또는 DB-supported snapshot token을 선택하고 TTL을 둡니다.", "cursor/snapshot TTL과 resource telemetry·expiry UX를 검증합니다."),
    ],
    expertNotes: ["keyset도 mutable sort key에서는 이동할 수 있습니다. immutable event order 또는 snapshot epoch가 필요한지 결정합니다.", "live feed에서 새 items를 놓치지 않는 refresh cursor와 오래된 items를 내려가는 pagination cursor를 분리할 수 있습니다."],
  },
  {
    id: "composite-keyset-pagination",
    title: "복합 keyset cursor의 비교식·방향·NULL을 ORDER BY와 대칭으로 구현합니다",
    lead: "created_at DESC,id DESC의 다음 page는 마지막 tuple보다 사전식으로 작은 rows를 같은 순서로 가져와야 합니다.",
    explanations: [
      "DESC 두 key의 다음 predicate는 created_at<last_time OR (created_at=last_time AND id<last_id)입니다. row-value comparison 지원과 NULL semantics를 확인하고 각 order direction 조합에 맞게 연산자를 생성합니다.",
      "cursor는 마지막 row의 display offset이 아니라 normalized sort tuple과 query contract version을 담습니다. filter/sort/tenant/pageSize가 바뀐 cursor 재사용을 reject하거나 명시적으로 새 browse를 시작합니다.",
      "이전 page는 order/predicate를 반전해 가져온 뒤 결과를 원래 display order로 다시 뒤집는 방식이 흔합니다. hasNext/hasPrevious를 pageSize+1과 boundary 존재로 일관되게 계산합니다.",
      "nullable key는 null-rank expression을 sort/cursor tuple에 포함하거나 nullable sort를 금지합니다. timezone, decimal, collation과 Unicode normalization을 cursor encode/decode에서 손실 없이 보존합니다.",
      "composite index는 equality filter prefix 뒤 ORDER BY tuple 방향을 지원하도록 설계합니다. index 하나가 모든 dynamic sort 조합을 지원하지 않으므로 allow-listed sort modes와 query budget을 둡니다.",
    ],
    concepts: [
      c("keyset pagination", "마지막 sort tuple을 경계로 다음 rows를 range 조회하는 방식입니다.", ["deep offset scan을 피할 수 있습니다.", "total order가 필수입니다."]),
      c("lexicographic predicate", "sort tuple을 앞 key부터 비교하고 동률일 때 다음 key를 비교하는 조건입니다.", ["ORDER BY direction과 대칭입니다.", "NULL/collation을 동일하게 처리합니다."]),
      c("cursor scope", "cursor가 유효한 tenant·filter·sort·version·snapshot 범위입니다.", ["scope 변경을 검증합니다.", "opaque token이어도 authorization을 대체하지 않습니다."]),
    ],
    codeExamples: [py("sql16-composite-keyset", "동률 timestamp를 id로 잇는 복합 cursor", "sql16_keyset.py", "created_at DESC,id DESC 첫 page의 마지막 tuple을 다음 predicate에 bind해 겹침 없이 모든 event를 탐색합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY, created_at TEXT NOT NULL)")
db.executemany("INSERT INTO event VALUES (?, ?)", [
    (1, "2026-01-01T00:00:00Z"), (2, "2026-01-01T00:00:00Z"),
    (3, "2026-01-02T00:00:00Z"), (4, "2026-01-02T00:00:00Z")
])
page1 = db.execute("SELECT id, created_at FROM event ORDER BY created_at DESC, id DESC LIMIT 2").fetchall()
last_id, last_time = page1[-1]
page2 = db.execute("""
    SELECT id, created_at FROM event
    WHERE created_at < ? OR (created_at = ? AND id < ?)
    ORDER BY created_at DESC, id DESC LIMIT 2
""", (last_time, last_time, last_id)).fetchall()
ids1 = [row[0] for row in page1]
ids2 = [row[0] for row in page2]
print("page1=" + ",".join(map(str, ids1)))
print(f"cursor={last_time}|{last_id}")
print("page2=" + ",".join(map(str, ids2)))
print("overlap=" + str(bool(set(ids1) & set(ids2))).lower())
print("complete=" + str(sorted(ids1 + ids2) == [1, 2, 3, 4]).lower())`, "page1=4,3\ncursor=2026-01-02T00:00:00Z|3\npage2=2,1\noverlap=false\ncomplete=true", ["mysql-select", "oracle-select", "sqlite-rowvalue"]),
    ],
    diagnostics: [
      d("같은 timestamp의 일부 항목이 다음 page에서 누락됩니다.", "cursor/predicate가 timestamp만 비교하고 id tie-breaker를 포함하지 않았습니다.", ["ORDER BY full tuple", "cursor fields", "equality branch", "tie-heavy fixture"], "모든 sort keys와 immutable id를 cursor/predicate에 같은 순서·direction으로 포함합니다.", "page boundary를 큰 tie group 안에 두는 tests를 둡니다."),
      d("DESC/ASC가 섞인 sort mode에서 page가 역행합니다.", "lexicographic predicate 연산자를 전체 tuple에 일괄 적용했습니다.", ["key별 direction", "generated disjunction/row comparison", "previous-page reversal", "NULL rank"], "allow-listed sort mode마다 검증된 predicate builder와 golden ordered ids를 사용합니다.", "모든 direction 조합과 forward/backward round-trip property tests를 둡니다."),
    ],
    expertNotes: ["cursor가 복합 tuple을 담아도 서버는 현재 principal의 filter/authorization을 다시 적용해야 합니다.", "keyset은 random page jump와 exact page number에 약하므로 product navigation 요구와 함께 선택합니다."],
  },
  {
    id: "cursor-token-integrity-evolution",
    title: "opaque cursor를 version·scope·expiry·무결성이 있는 토큰으로 만듭니다",
    lead: "Base64는 은닉도 서명도 아닙니다. 사용자가 sort boundary나 tenant를 변조할 수 없고 schema가 진화해도 안전하게 거절·이관되어야 합니다.",
    explanations: [
      "cursor payload에는 version, normalized sort tuple, direction, filter/sort fingerprint, tenant/principal scope 또는 server-side state id, issued/expiry와 선택한 snapshot/watermark를 포함할 수 있습니다. 민감 raw filter/PII는 최소화합니다.",
      "stateless cursor는 canonical serialization 후 HMAC 또는 authenticated encryption으로 무결성을 보호합니다. signature compare는 constant-time API를 쓰고 key id·rotation과 expiry를 운영합니다. Base64url은 transport encoding일 뿐입니다.",
      "stateful cursor는 random id로 server-side stored search/snapshot을 가리켜 payload 노출을 줄이고 복잡한 state를 유지하지만 storage, TTL, affinity와 cleanup이 필요합니다.",
      "invalid signature, expired, unsupported version, wrong tenant/filter와 deleted boundary를 서로 다른 내부 원인으로 관측하되 외부 오류가 정보를 과도하게 노출하지 않게 합니다.",
      "cursor schema upgrade는 old-version decoder/expiry window 또는 explicit restart UX를 제공합니다. decode 성공 후에도 현재 authorization과 maximum page size를 다시 검증합니다.",
    ],
    concepts: [
      c("opaque cursor", "consumer가 내부 boundary를 해석·수정하지 않고 그대로 반환하는 pagination token입니다.", ["Base64만으로 opaque/security가 되지 않습니다.", "server가 scope와 version을 검증합니다."]),
      c("cursor integrity", "payload 변조를 서명 또는 authenticated encryption으로 검출하는 성질입니다.", ["key rotation을 포함합니다.", "authorization을 대체하지 않습니다."]),
      c("filter fingerprint", "cursor가 생성된 canonical filter/sort contract를 식별하는 digest 또는 server state binding입니다.", ["parameter order를 canonicalize합니다.", "tenant/policy scope를 포함합니다."]),
    ],
    diagnostics: [
      d("cursor의 id를 바꾸면 다른 tenant 데이터가 조회됩니다.", "unsigned payload를 신뢰하고 current tenant authorization을 재적용하지 않았습니다.", ["token signature/authenticated encryption", "tenant/filter binding", "current authorization SQL", "negative cross-tenant tests"], "cursor를 무결성 보호하고 current principal의 tenant/policy를 항상 query에 적용합니다.", "tamper/cross-tenant/replay/expired/version fuzz tests를 둡니다."),
      d("배포 후 모든 기존 cursor가 500 오류를 냅니다.", "version dispatch와 decode error mapping 없이 payload schema를 바꿨습니다.", ["cursor version", "decoder compatibility window", "exception mapping", "TTL/deprecation telemetry"], "versioned decoder와 bounded grace period 또는 명확한 restart response를 제공합니다.", "old/new token fixtures와 rotation rollback drill을 둡니다."),
    ],
    expertNotes: ["cursor token을 로그에 원문으로 남기지 않고 version, validation outcome과 non-sensitive correlation만 기록합니다.", "서명 key 유출/rotation 시 이미 발행된 cursor TTL과 revocation 범위를 incident runbook에 포함합니다."],
  },
  {
    id: "pagination-performance-index-plan",
    title: "deep OFFSET·COUNT·keyset의 실제 plan과 latency/resource budget을 비교합니다",
    lead: "LIMIT 결과가 20행이어도 OFFSET 1,000,000은 앞 rows를 찾고 정렬하고 버리는 작업을 요구할 수 있습니다.",
    explanations: [
      "EXPLAIN actual에서 access path, rows scanned/examined, filesort/temp, index range boundary, lookup 수와 limit stop을 봅니다. wall time 하나는 cache warmness와 concurrency를 숨깁니다.",
      "equality filter columns 뒤 sort tuple과 unique id를 둔 composite index는 keyset range와 ordered retrieval을 지원할 수 있습니다. covering을 위해 넓은 text/payload를 모두 넣으면 write amplification과 cache 효율이 나빠집니다.",
      "two-step late materialization은 narrow index에서 page ids를 고른 뒤 base rows/details를 fetch합니다. 결과 order를 복원하고 같은 snapshot/authorization을 보존하며 N+1 대신 bounded batch join을 사용합니다.",
      "exact COUNT는 broad predicate에서 전체 matching range를 읽을 수 있습니다. hasNext pageSize+1, cached/materialized count, estimate를 요구에 따라 선택하고 freshness/quality를 응답에 명시합니다.",
      "benchmark는 first/middle/deep page, selective/unselective filters, tie/skew, cold/warm cache, concurrent writes와 representative row widths에서 p50/p95/p99, rows examined, I/O/temp와 lock/snapshot cost를 측정합니다.",
    ],
    concepts: [
      c("deep offset cost", "큰 offset 앞의 rows를 찾아 건너뛰는 데 드는 scan/sort/lookup 비용입니다.", ["반환 row 수와 다릅니다.", "maximum depth budget이 필요합니다."]),
      c("pagination index", "filter equality와 total-order tuple을 지원해 boundary range와 ordered limit을 제공하는 composite index입니다.", ["방향/collation을 확인합니다.", "write/storage 비용을 측정합니다."]),
      c("late materialization", "narrow id/order query로 page를 고른 후 필요한 넓은 columns를 batch fetch하는 전략입니다.", ["order를 복원합니다.", "snapshot/authorization을 유지합니다."]),
    ],
    diagnostics: [
      d("마지막 page로 갈수록 latency와 rows examined가 선형 증가합니다.", "deep OFFSET이 앞 rows를 반복 스캔/정렬해 버립니다.", ["offset 대 actual rows examined", "sort/temp", "matching index", "keyset feasibility"], "keyset cursor 또는 bounded page depth를 적용하고 필요한 index를 representative workload에서 검증합니다.", "page depth별 plan/latency budget regression을 둡니다."),
      d("keyset index를 추가했는데 writes와 buffer miss가 악화됐습니다.", "모든 display columns를 covering index에 넣거나 dynamic sort마다 index를 만들었습니다.", ["index width/count", "write amplification", "buffer hit", "late materialization alternative"], "allow-listed high-value sort modes에 narrow index를 두고 id page+batch fetch를 검증합니다.", "read gain과 write/storage/maintenance cost를 함께 capacity review합니다."),
    ],
    expertNotes: ["production-like distribution과 row width 없이 LIMIT query 성능을 승인하지 않습니다.", "count/list 두 query의 합산 DB work와 connection occupancy를 endpoint budget으로 관측합니다."],
  },
  {
    id: "engine-framework-portability",
    title: "MySQL LIMIT·Oracle OFFSET/FETCH·ROW_NUMBER와 Java paging model 경계를 격리합니다",
    lead: "원본 Paging.java가 명시하듯 offset field는 MySQL/MariaDB 친화적이며 Oracle dialect와 오래된 ROWNUM pattern에는 별도 구현이 필요합니다.",
    explanations: [
      "MySQL은 LIMIT row_count OFFSET offset 또는 LIMIT offset,row_count를 제공하고 Oracle은 row_limiting_clause OFFSET ... ROWS FETCH ...를 사용합니다. argument 순서 혼동을 막기 위해 application contract를 page/size 또는 cursor로 통일하고 dialect adapter가 SQL을 만듭니다.",
      "Oracle ROW_NUMBER() OVER(total order)로 numbered pages를 만들 때 analytic ordering과 outer filter/order를 일치시킵니다. ROWNUM은 order evaluation과 중첩 query 구조를 잘못 이해하면 다른 rows를 자릅니다.",
      "Spring Data Page는 content와 exact total query를, Slice는 hasNext 중심을 표현합니다. framework가 generated count에서 fetch join/order를 어떻게 제거하는지 실제 SQL과 grain을 검증합니다.",
      "Paging DTO/entity를 그대로 request binding하면 totalRecord/offset 같은 server-computed fields를 client가 덮을 수 있습니다. request(page,size,sort)와 server response(total/pages/cursors)를 다른 immutable types로 분리합니다.",
      "dialect matrix에는 syntax/binding, NULL/collation order, offset/keyset plan, isolation snapshot, count generation과 max numeric range를 버전·driver별로 기록합니다.",
    ],
    concepts: [
      c("dialect paging adapter", "공통 paging contract를 DB별 LIMIT/OFFSET/FETCH/analytic query로 구현하는 계층입니다.", ["string 치환이 아닙니다.", "semantic fixtures를 공유합니다."]),
      c("Page versus Slice", "exact total navigation과 hasNext-only navigation을 구분하는 application representation입니다.", ["count 비용을 드러냅니다.", "consumer 요구와 맞춥니다."]),
      c("request/response model separation", "client가 제공할 page intent와 server가 계산한 total/offset/cursor metadata를 다른 타입으로 분리하는 설계입니다.", ["mass assignment를 줄입니다.", "validation ownership이 명확해집니다."]),
    ],
    diagnostics: [
      d("Oracle 이관 후 같은 offset/size가 다른 rows를 반환합니다.", "dialect syntax/ROWNUM ordering과 NULL/collation semantics를 단순 치환했습니다.", ["generated SQL", "inner/analytic/outer ORDER BY", "total tie-breaker", "engine golden ids"], "Oracle row_limiting_clause 또는 검증된 ROW_NUMBER adapter를 사용하고 동일 fixtures로 비교합니다.", "MySQL·Oracle page/cursor conformance matrix를 release gate로 둡니다."),
      d("framework count query가 fetch join에서 오류나 과다 count를 냅니다.", "자동 count derivation이 join grain/distinct/group query를 정확히 변환하지 못했습니다.", ["actual generated count SQL", "target entity ids", "fetch/order/group removal", "explicit countQuery"], "canonical eligibility를 사용한 explicit count query 또는 Slice/keyset을 제공하고 id reconciliation합니다.", "복잡 join/search repository tests에서 content ids와 total을 검증합니다."),
    ],
    expertNotes: ["framework abstraction을 써도 DB가 실행한 list/count SQL과 plan을 acceptance evidence로 남깁니다.", "mutable Paging bean은 학습 progression으로 설명하고 공개 권장안은 validated request와 immutable response model로 확장합니다."],
  },
  {
    id: "pagination-operations-accessibility",
    title: "캐시·관측·오류·접근성까지 포함해 pagination을 운영합니다",
    lead: "정확한 SQL도 cursor expiry, cache key 누락, 부분 실패, 스크롤 focus와 링크 의미를 다루지 않으면 안정적인 학습자료·서비스가 아닙니다.",
    explanations: [
      "cache key는 tenant/principal policy, canonical filter/sort, page/size 또는 cursor, snapshot/version과 representation을 포함합니다. total과 content를 별도 cache하면 asOf/version을 맞춰 혼합을 막습니다.",
      "DB timeout 뒤 partial page를 성공으로 캐시하지 않습니다. cursor invalid/expired, out-of-range, snapshot gone, unsupported sort와 backend timeout을 내부 분류하고 retry가 안전한지 결정합니다.",
      "observability에는 page size/depth 또는 cursor mode, filter/sort id, count quality, rows returned/examined, hasNext, query/count latency, plan hash, timeout/invalid cursor와 snapshot age를 두되 raw cursor·검색어·PII는 남기지 않습니다.",
      "numbered pagination은 실제 링크, current page의 aria-current, descriptive labels와 keyboard focus를 제공합니다. infinite scroll은 load-more control, 새 content announcement, focus/URL/history restore와 footer 접근 경로를 고려합니다.",
      "운영 runbook은 느린 deep offset, count/list drift, cursor key rotation, snapshot retention, index regression과 cache poisoning을 재현·rollback하는 절차를 포함합니다.",
    ],
    concepts: [
      c("pagination cache identity", "보안·filter·sort·boundary·snapshot을 포함해 page response를 유일하게 식별하는 key입니다.", ["total/content version을 맞춥니다.", "raw cursor logging을 피합니다."]),
      c("partial-page failure", "일부 rows 또는 metadata만 계산된 상태를 성공과 분리해 폐기·재시도하는 오류 계약입니다.", ["cache하지 않습니다.", "snapshot/retry semantics를 확인합니다."]),
      c("navigation accessibility", "페이지/더보기 컨트롤이 keyboard, screen reader, focus/history에서 현재 위치와 변화를 전달하는 성질입니다.", ["ARIA만으로 끝나지 않습니다.", "URL과 복원 동작을 포함합니다."]),
    ],
    codeExamples: [py("sql16-count-page-live-drift", "count와 page가 다른 live 시점을 볼 때의 불일치", "sql16_count_drift.py", "count 후 상단 insert가 일어나면 totalPages가 예고한 마지막 page item 수와 실제 page가 달라질 수 있음을 재현합니다.", String.raw`import math

items = [5, 4, 3, 2, 1]
page_size = 2
count_before = len(items)
total_pages_before = math.ceil(count_before / page_size)
items_after_insert = [6] + items
last_page_offset = (total_pages_before - 1) * page_size
last_page = items_after_insert[last_page_offset:last_page_offset + page_size]
print(f"count-before={count_before}")
print(f"total-pages-before={total_pages_before}")
print(f"items-after={len(items_after_insert)}")
print("last-page=" + ",".join(map(str, last_page)))
print("expected-last-size-before=1")
print("snapshot-drift=" + str(len(last_page) != 1).lower())`, "count-before=5\ntotal-pages-before=3\nitems-after=6\nlast-page=2,1\nexpected-last-size-before=1\nsnapshot-drift=true", ["mysql-select", "oracle-select", "spring-data-paging"]),
    ],
    diagnostics: [
      d("다른 사용자의 page가 cache에서 반환됩니다.", "cache key에 tenant/principal/policy/filter scope가 누락됐습니다.", ["effective cache key", "authorization context", "cursor/filter fingerprint", "cache invalidation/version"], "security context와 full query contract로 cache를 분리하고 sensitive result는 정책에 맞게 cache를 제한합니다.", "cross-tenant sentinel과 cache readback tests를 둡니다."),
      d("무한 스크롤 후 뒤로 가면 위치와 항목이 복원되지 않습니다.", "cursor/page state와 scroll/focus가 URL/history에 연결되지 않았습니다.", ["history state", "loaded cursor chain", "focus target", "data snapshot expiry"], "복원 가능한 route/state와 load-more semantics를 제공하고 expiry 시 명확한 restart를 안내합니다.", "keyboard/screen-reader/back-forward/session-restore E2E tests를 둡니다."),
    ],
    expertNotes: ["raw cursor와 검색어를 telemetry에 저장하지 않고 validation outcome·mode·depth·plan/resource만 기록합니다.", "page correctness SLO는 latency뿐 아니라 duplicate/missing/count drift/invalid cursor 비율을 포함합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0203", repository: "dbstudy", path: "02_03.sql", usedFor: ["LIMIT/OFFSET pages, ORDERID DESC, CEIL(COUNT), search join progression"], evidence: "원본 파일을 read-only로 확인했고 sample names/literals는 복사하지 않았습니다." },
  { id: "local-paging-java", repository: "2026-springmvc01", path: "src/main/java/org/study/myproject01/common/Paging.java", usedFor: ["nowPage/block/size/total/offset model provenance and dialect note"], evidence: "원본 Java class를 read-only로 확인하고 field structure만 학습 progression에 사용했습니다." },
  { id: "mysql-select", repository: "MySQL 8.4 Reference Manual", path: "SELECT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["LIMIT/OFFSET, ordering and binding semantics"], evidence: "MySQL 공식 SELECT 문서입니다." },
  { id: "mysql-limit-optimization", repository: "MySQL 8.4 Reference Manual", path: "LIMIT Query Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html", usedFor: ["LIMIT plans, ordering and deep-offset performance"], evidence: "MySQL 공식 LIMIT 최적화 문서입니다." },
  { id: "oracle-select", repository: "Oracle Database 26ai SQL Language Reference", path: "SELECT / row_limiting_clause", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["OFFSET/FETCH, ordering and Oracle portability"], evidence: "Oracle 공식 SELECT 문서입니다." },
  { id: "oracle-row-number", repository: "Oracle Database 26ai SQL Language Reference", path: "ROW_NUMBER", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/ROW_NUMBER.html", usedFor: ["analytic numbered paging and total order"], evidence: "Oracle 공식 ROW_NUMBER 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["exact LIMIT/OFFSET/order laboratory"], evidence: "SQLite 공식 SELECT 문서입니다." },
  { id: "sqlite-rowvalue", repository: "SQLite Documentation", path: "Row Values", publicUrl: "https://www.sqlite.org/rowvalue.html", usedFor: ["composite keyset comparison semantics"], evidence: "SQLite 공식 row value 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["index/order/range plan laboratory limits"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "spring-data-paging", repository: "Spring Data Commons Reference", path: "Paging, Iterating Large Results, Sorting", publicUrl: "https://docs.spring.io/spring-data/commons/reference/repositories/query-methods-details.html#repositories.special-parameters", usedFor: ["Page, Slice, Pageable and count boundary"], evidence: "Spring Data 공식 reference 문서입니다." },
  { id: "rfc4648", repository: "IETF", path: "RFC 4648 Base-N Encodings", publicUrl: "https://datatracker.ietf.org/doc/html/rfc4648", usedFor: ["base64url cursor transport encoding boundary"], evidence: "IETF 공식 RFC입니다." },
  { id: "rfc2104", repository: "IETF", path: "RFC 2104 HMAC", publicUrl: "https://datatracker.ietf.org/doc/html/rfc2104", usedFor: ["stateless cursor integrity terminology"], evidence: "IETF 공식 RFC입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-16-pagination-count-query", slug: "sql-16-pagination-count-query", courseId: "database", moduleId: "db-joins-subqueries", order: 7,
  title: "LIMIT/OFFSET 페이징과 전체 건수 계산", subtitle: "페이지 산술을 total order·count parity·snapshot·keyset·cursor integrity·plan·접근성 계약으로 확장합니다.", level: "중급", estimatedMinutes: 900,
  coreQuestion: "데이터가 계속 변하고 검색·권한·조인이 있는 환경에서도 page rows와 total이 중복·누락·노출 없이 일관되며 빠르다는 것을 어떻게 증명할까요?",
  summary: "dbstudy 02_03.sql의 LIMIT/OFFSET 3-page, CEIL(COUNT)와 search join, 2026-springmvc01 Paging.java의 page/block/total/offset fields를 read-only로 감사합니다. pagination public contract, unique total order, safe arithmetic, count/list predicate parity와 grain, mutation drift/snapshot, composite keyset, signed/versioned cursor, deep-offset/index plans, MySQL·Oracle/framework portability와 cache/observability/accessibility까지 확장합니다. 다섯 exact Python/SQLite examples는 tie-safe pages, count/search parity, offset drift, composite cursor와 count/list snapshot drift를 실행합니다.",
  objectives: ["page/size/total/hasNext/cursor와 snapshot/freshness contract를 정의한다.", "동률·NULL·collation에 안전한 unique total order와 page 산술을 구현한다.", "count/list predicate·authorization·grain parity를 증명한다.", "mutation 중 OFFSET drift와 snapshot 선택을 재현한다.", "composite keyset와 versioned integrity-protected cursor를 설계한다.", "deep offset/count/keyset plan·index·resource budget을 비교한다.", "MySQL·Oracle·Spring paging 경계와 cache·관측·접근성을 운영한다."],
  prerequisites: [{ title: "CASE 조건식", reason: "nullable sort rank와 conditional report/search semantics를 이해해야 합니다.", sessionSlug: "sql-15-case-conditional-report" }],
  keywords: ["LIMIT", "OFFSET", "pagination", "COUNT", "total order", "tie-breaker", "keyset", "cursor", "snapshot", "Page", "Slice", "ROW_NUMBER", "deep offset", "hasNext"], topics,
  lab: {
    title: "multi-tenant 게시판의 numbered page와 live cursor를 함께 구축하기",
    scenario: "게시물은 tenant·status·검색어·child tags로 필터되고 createdAt 동률, insert/delete/update와 큰 tenant가 있습니다. 관리자 exact numbered pages와 사용자 live cursor feed를 모두 제공합니다.",
    setup: ["synthetic tenant/post/tag ids, tie/null/skew/mutation fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 representative indexes/stats를 준비합니다.", "canonical eligibility, target grain, total order, count quality, snapshot/cursor scope와 page/byte budgets를 문서화합니다.", "expected ordered id lists와 mutation schedule을 고정합니다."],
    steps: ["request page/size/sort/filter validation과 UI block arithmetic을 boundary-test합니다.", "tie/null/collation을 포함한 total order와 unique id coverage를 readback합니다.", "count/list common eligibility·tenant·soft-delete·join grain을 id set으로 reconciliation합니다.", "첫 page 사이 insert/delete/update에서 OFFSET overlap/gap을 재현합니다.", "archive는 snapshot/version, live feed는 composite keyset으로 consistency mode를 나눕니다.", "forward/backward cursor predicate와 hasNext/hasPrevious를 pageSize+1로 검증합니다.", "cursor version/scope/expiry/integrity/tamper/key rotation을 negative-test합니다.", "first/middle/deep offset·keyset·count EXPLAIN actual과 rows examined/spill/latency를 측정합니다.", "MySQL LIMIT, Oracle OFFSET/FETCH/ROW_NUMBER와 Spring Page/Slice SQL을 golden ids로 비교합니다.", "cache key, partial failure, duplicate/missing/count drift telemetry와 keyboard/history restore를 E2E 검증합니다."],
    expectedResult: ["모든 page/cursor 결과가 canonical ordered ids를 중복·누락 없이 덮습니다.", "count/list가 같은 권한·filter·entity grain과 승인된 snapshot/quality를 사용합니다.", "mutation·tie·NULL·tamper·expiry·deep page 반례가 정확한 실패/전환 경로로 처리됩니다.", "MySQL·Oracle에서 승인된 plan/rows-examined/latency/resource budget을 만족합니다.", "navigation metadata, URL/history, focus와 cache/observability가 raw cursor·PII 없이 운영됩니다."],
    cleanup: ["isolated schemas·synthetic rows·snapshot/search state/cache를 run id로 제거합니다.", "cursor test keys·credentials를 revoke·삭제합니다.", "logs에 raw cursor/search text/tenant data가 없는지 검사합니다.", "production files/data는 변경하지 않습니다."],
    extensions: ["bidirectional cursor와 anchor jump/seek-to-time UX를 구현합니다.", "DB snapshot export 또는 materialized search result ids를 비교합니다.", "approximate count와 confidence/freshness UI를 설계합니다.", "sharded/global order cursor와 partition merge correctness를 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 page의 ordered ids·boundary·count/snapshot을 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "동률을 id가 끊는 이유를 설명합니다.", "count/list predicate parity를 증명합니다.", "insert 후 offset overlap을 재현합니다.", "composite cursor 식을 ORDER BY와 대조합니다.", "count/list drift를 consistency 선택과 연결합니다."], hints: ["화면 label보다 immutable ids의 합집합·교집합을 먼저 보세요."], expectedOutcome: "pagination을 LIMIT 암기가 아니라 ordered consistency contract로 설명합니다.", solutionOutline: ["population→order→boundary→mutation→count→plan→operations 순서입니다."] },
    { difficulty: "응용", prompt: "원본 SQL/Paging.java 흐름을 MySQL·Oracle 지원 multi-tenant API로 재구성하세요.", requirements: ["원본 LIMIT/count/page fields provenance를 보존합니다.", "request/response models와 safe arithmetic을 분리합니다.", "filter/auth/grain count parity를 공유합니다.", "numbered snapshot과 live keyset mode를 설계합니다.", "cursor integrity/version/expiry/scope를 구현합니다.", "join parent ids와 detail fetch를 분리합니다.", "engine/framework plan matrix와 deep-page budget을 실행합니다.", "cache/telemetry/accessibility/history/rollback을 포함합니다."], hints: ["정확한 total이 정말 필요한 화면과 hasNext만 필요한 화면을 먼저 나누세요."], expectedOutcome: "정확성·보안·성능·UX가 검증된 dual-mode pagination이 완성됩니다.", solutionOutline: ["source audit→contract→query adapters→mutation tests→plan tests→E2E readback 순서입니다."] },
    { difficulty: "설계", prompt: "조직 pagination·cursor 표준을 작성하세요.", requirements: ["population/order/tie/null/collation/snapshot schema를 정의합니다.", "page/size/block/count quality/out-of-range 규칙을 둡니다.", "offset/keyset/snapshot 선택 기준을 둡니다.", "cursor scope/version/integrity/expiry/rotation을 정의합니다.", "count/list grain/auth predicate parity를 요구합니다.", "index/depth/rows-examined/latency/resource budgets를 정의합니다.", "cache/error/telemetry/privacy/runbook을 정의합니다.", "URL/history/focus/screen-reader acceptance를 포함합니다."], hints: ["page number는 데이터 snapshot identity가 아닙니다."], expectedOutcome: "DB부터 API와 UI까지 일관된 전문가 pagination governance가 완성됩니다.", solutionOutline: ["validate→order→slice→reconcile→protect→measure→render→observe→recover 순서입니다."] },
  ],
  nextSessions: ["sql-17-cte-window-supplement"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["02_03.sql의 LIMIT/OFFSET 3개, CEIL(COUNT) 1개와 search JOIN+ORDER+LIMIT progression, Paging.java의 11개 page/block/count/offset fields 및 MySQL/MariaDB/Oracle note를 read-only로 확인했습니다.", "원본 sample names/search literals와 application data는 복사하지 않고 구조·clause/field progression만 provenance로 사용했습니다.", "원본은 total-order ties, safe arithmetic, filter/count grain parity, concurrent drift/snapshot, composite keyset, cursor integrity, deep plan/index와 cache/accessibility operations를 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite examples는 MySQL 8.4·Oracle 26ai의 isolation, optimizer, row limiting syntax와 Spring generated SQL을 대체하지 않습니다."] },
});

export default session;
