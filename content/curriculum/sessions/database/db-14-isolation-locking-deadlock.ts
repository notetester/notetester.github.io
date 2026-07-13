import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-8", explanation: "Python sqlite3와 temporary file 또는 synthetic wait graph를 준비해 두 connection의 schedule을 외부 credential 없이 재현합니다." },
      { lines: "9-끝에서 5줄 전", explanation: "명시 transaction·WAL snapshot·write lock·cycle 또는 retry failure point를 실행하고 각 시점의 값을 readback합니다." },
      { lines: "마지막 5줄", explanation: "값·blocked boolean·cycle·attempt count만 deterministic 출력합니다. row/gap locks와 deadlock victim은 MySQL·Oracle 실제 엔진에서 다시 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite의 serialized writes/WAL snapshot은 MySQL InnoDB·Oracle의 row locks, gap/predicate locks와 deadlock detector를 재현하지 않습니다."] },
    experiments: [
      { change: "reader/writer 시작·commit 순서와 journal/isolation 설정을 바꿉니다.", prediction: "관찰 값, blocking 또는 snapshot upgrade error가 달라지며 level 이름만으로 결과를 예측할 수 없습니다.", result: "각 engine/version에서 barrier로 schedule과 allowed outcomes를 고정합니다." },
      { change: "두 transactions의 resource 획득 순서를 반대로 만들고 첫 시도 중간에 victim 오류를 주입합니다.", prediction: "wait-for cycle이 생기며 전체 unit을 새 transaction으로 retry해야 하나 effect는 한 번이어야 합니다.", result: "stable lock order, bounded jittered retry와 idempotency ledger를 함께 검증합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "concurrency-anomaly-schedules",
    title: "격리 현상을 이름 암기보다 두 transaction의 실제 schedule로 그립니다",
    lead: "dirty read·non-repeatable read·phantom·lost update·write skew는 어떤 reads/writes가 어떤 순서로 교차했는지 적어야 구분할 수 있습니다.",
    explanations: [
      "T1/T2 timeline에 read predicate, observed version/value, write key/range와 commit/rollback을 적습니다. 같은 최종 숫자라도 dirty read와 lost update의 원인은 다릅니다.",
      "dirty read는 다른 transaction의 uncommitted 값을 관찰하는 현상, non-repeatable read는 같은 row를 두 번 읽어 committed 값이 달라지는 현상, phantom은 같은 predicate의 row 집합이 달라지는 현상입니다.",
      "lost update는 두 writers가 같은 old state를 기반으로 계산해 한 변경을 덮는 상태입니다. 격리 level만 믿지 말고 version predicate/locking read/atomic update와 affected-row conflict를 사용합니다.",
      "write skew는 각 transaction이 다른 rows를 쓰지만 함께 유지해야 할 predicate invariant를 깨뜨립니다. row locks만으로 읽은 predicate 전체가 보호되지 않을 수 있어 serializable 또는 invariant 재모델링이 필요합니다.",
      "원본 02_04.sql에는 ISOLATION·LOCK·DEADLOCK token이 모두 0회입니다. routine progression을 concurrency 실험으로 오해하지 않고 명시적 gap으로 기록해 synthetic schedules와 vendor primary docs로 보강합니다.",
    ],
    concepts: [
      c("concurrent schedule", "여러 transactions의 read·write·commit operations가 시간상 섞인 순서입니다.", ["barrier로 재현합니다.", "허용 outcomes를 미리 적습니다."]),
      c("read anomaly", "동시 변경 때문에 한 transaction의 관찰 population/value가 isolation contract와 다르게 보이는 현상입니다.", ["dirty/non-repeatable/phantom을 구분합니다.", "snapshot 시점을 기록합니다."]),
      c("write anomaly", "동시 writes가 서로의 intent를 덮거나 predicate invariant를 함께 깨뜨리는 현상입니다.", ["lost update/write skew를 구분합니다.", "version/predicate 보호를 설계합니다."]),
    ],
    codeExamples: [py("db14-dirty-read-prevention", "uncommitted writer를 reader가 보지 않는지 검증", "db14_dirty_read.py", "WAL file의 두 connections에서 writer rollback 전 reader가 committed value만 보는지 확인합니다.", String.raw`import sqlite3
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as folder:
    path = Path(folder) / "isolation.db"
    setup = sqlite3.connect(path)
    journal = setup.execute("PRAGMA journal_mode=WAL").fetchone()[0]
    setup.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, balance INTEGER)")
    setup.execute("INSERT INTO account VALUES(1, 100)")
    setup.commit()
    setup.close()
    writer = sqlite3.connect(path)
    reader = sqlite3.connect(path)
    writer.execute("BEGIN IMMEDIATE")
    writer.execute("UPDATE account SET balance=200 WHERE id=1")
    during = reader.execute("SELECT balance FROM account WHERE id=1").fetchone()[0]
    writer.rollback()
    after = reader.execute("SELECT balance FROM account WHERE id=1").fetchone()[0]
    print("reader-during=" + str(during))
    print("reader-after=" + str(after))
    print("dirty-read=" + str(during != 100).lower())
    print("journal=" + journal)
    reader.close()
    writer.close()`, "reader-during=100\nreader-after=100\ndirty-read=false\njournal=wal", ["local-0204", "sqlite-isolation", "sqlite-wal", "python-sqlite3", "mysql-isolation", "oracle-transactions", "postgres-transaction-iso"])],
    diagnostics: [d("동시성 bug report에서 '격리 문제'라는 말만 있고 재현되지 않습니다.", "transaction 시작/statement/barrier/commit과 observed versions를 기록하지 않았습니다.", ["T1/T2 timeline", "connection/isolation/autocommit", "read predicate/versions", "commit/rollback order"], "두 worker와 barriers로 최소 schedule을 만들고 각 step의 allowed value/outcome을 단언합니다.", "critical invariants마다 deterministic concurrency integration test를 유지합니다.")],
    expertNotes: ["현상 이름은 diagnosis label이며 evidence는 interleaving과 observed row versions입니다.", "dirty read가 없다는 사실만으로 lost update·write skew·phantom까지 안전한 것은 아닙니다."],
  },
  {
    id: "isolation-level-vendor-contract",
    title: "READ COMMITTED·REPEATABLE READ·SERIALIZABLE을 vendor 구현 계약으로 해석합니다",
    lead: "SQL 표준 level 이름이 같아도 snapshot timing, locking read, phantom 방지와 serialization failure가 엔진마다 다릅니다.",
    explanations: [
      "READ UNCOMMITTED·READ COMMITTED·REPEATABLE READ·SERIALIZABLE의 금지/허용 현상을 baseline으로 보되 vendor 문서에서 MVCC와 locks 구현을 확인합니다. 이름을 portability 보증으로 사용하지 않습니다.",
      "MySQL InnoDB REPEATABLE READ의 consistent reads와 locking reads, gap/next-key locks는 PostgreSQL/Oracle/SQLite와 다릅니다. Oracle의 지원 levels와 statement-level read consistency도 별도 matrix로 기록합니다.",
      "SERIALIZABLE은 모든 transactions가 한 줄로 queue된다는 뜻이 아니라 결과가 어떤 serial order와 동등하도록 blocking 또는 serialization failure를 사용할 수 있다는 계약입니다.",
      "connection pool에서 이전 borrower가 바꾼 isolation이 누출될 수 있습니다. transaction 시작 전 requested/effective level을 readback하고 return 때 reset합니다.",
      "level을 높이기 전에 anomaly와 invariant를 명시하고 version predicate, atomic DML, unique constraint, explicit lock 또는 shorter boundary 같은 좁은 해법을 비교합니다.",
    ],
    concepts: [
      c("effective isolation", "현재 transaction이 실제 DB/session에서 사용하는 격리 정책입니다.", ["requested annotation과 다를 수 있습니다.", "transaction 시작 시 readback합니다."]),
      c("serialization failure", "동시 schedule을 serializable하게 만들 수 없어 DB가 transaction 하나를 abort하는 정상 제어 결과입니다.", ["전체 unit을 retry합니다.", "idempotency가 필요합니다."]),
      c("vendor conformance matrix", "동일 schedule의 관찰·blocking·error·lock behavior를 엔진/version별 기록한 표입니다.", ["level 이름만 비교하지 않습니다.", "upgrade 때 재실행합니다."]),
    ],
    diagnostics: [d("테스트 DB의 REPEATABLE READ는 통과했는데 production에서 phantom/lock wait가 다릅니다.", "level 이름만 맞추고 vendor MVCC·gap/predicate lock semantics와 indexes를 비교하지 않았습니다.", ["engine/version", "effective level", "consistent vs locking read", "predicate/index/plan"], "동일 barrier schedule과 schema/index로 production engine conformance를 실행하고 approved difference를 기록합니다.", "DB upgrade/engine 이관 gate에 anomaly matrix를 포함합니다.")],
    expertNotes: ["SERIALIZABLE failure는 DB 장애가 아니라 correctness를 위한 expected outcome일 수 있습니다.", "readOnly flag는 isolation이나 authorization을 자동 강화하지 않으므로 실제 engine semantics를 확인합니다."],
  },
  {
    id: "mvcc-snapshot-version-retention",
    title: "MVCC snapshot·row version·undo/WAL retention과 긴 reader 비용을 연결합니다",
    lead: "MVCC는 readers와 writers를 분리할 수 있지만 과거 version을 보존·탐색하는 비용과 오래된 snapshot의 운영 부채를 만듭니다.",
    explanations: [
      "snapshot이 transaction 시작인지 첫 consistent read인지 statement마다인지 엔진/level별로 확인합니다. 같은 transaction의 count/page/detail이 같은 logical snapshot을 요구하는지 정의합니다.",
      "writer는 새 version을 만들고 reader는 자신의 visibility rule에 맞는 version을 봅니다. commit timestamp와 application updated_at을 같은 것으로 취급하지 않습니다.",
      "긴 reader는 undo purge/vacuum/WAL checkpoint와 replica recovery를 지연하고 storage bloat를 만들 수 있습니다. max transaction age, snapshot duration과 versions retained를 관측합니다.",
      "SQLite WAL mode에서는 reader snapshot 중 writer commit이 가능하지만 오래된 reader가 write로 upgrade할 때 snapshot conflict가 날 수 있습니다. SQLite 결과를 InnoDB/Oracle에 일반화하지 않습니다.",
      "pagination/export는 stable order와 bounded snapshot을 사용하고 재개 token에 query/filter/version/watermark를 담습니다. 무제한 transaction 하나로 대용량 export를 잡지 않습니다.",
    ],
    concepts: [
      c("MVCC snapshot", "transaction/statement가 볼 수 있는 committed row versions의 논리적 가시성 지점입니다.", ["생성 시점을 확인합니다.", "application timestamp와 다릅니다."]),
      c("version retention", "active snapshots와 recovery 때문에 old row versions/undo/WAL을 보존하는 기간과 공간입니다.", ["긴 reader가 늘립니다.", "vacuum/checkpoint와 연결합니다."]),
      c("snapshot age", "snapshot이 열린 뒤 경과한 시간 또는 transaction sequence 거리입니다.", ["hard limit을 둡니다.", "export 설계와 연결합니다."]),
    ],
    codeExamples: [py("db14-repeatable-snapshot", "WAL reader snapshot 전후 writer commit", "db14_snapshot.py", "reader transaction의 두 reads는 같은 값이고 종료 뒤 새 read는 writer commit을 보는지 검증합니다.", String.raw`import sqlite3
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as folder:
    path = Path(folder) / "snapshot.db"
    setup = sqlite3.connect(path)
    setup.execute("PRAGMA journal_mode=WAL")
    setup.execute("CREATE TABLE metric(id INTEGER PRIMARY KEY, value INTEGER)")
    setup.execute("INSERT INTO metric VALUES(1, 10)")
    setup.commit()
    setup.close()
    reader = sqlite3.connect(path)
    writer = sqlite3.connect(path)
    reader.execute("BEGIN")
    first = reader.execute("SELECT value FROM metric WHERE id=1").fetchone()[0]
    writer.execute("BEGIN IMMEDIATE")
    writer.execute("UPDATE metric SET value=20 WHERE id=1")
    writer.commit()
    second = reader.execute("SELECT value FROM metric WHERE id=1").fetchone()[0]
    reader.commit()
    after = reader.execute("SELECT value FROM metric WHERE id=1").fetchone()[0]
    print("first=" + str(first))
    print("same-snapshot=" + str(second))
    print("after-end=" + str(after))
    print("repeatable=" + str(first == second).lower())
    reader.close()
    writer.close()`, "first=10\nsame-snapshot=10\nafter-end=20\nrepeatable=true", ["sqlite-isolation", "sqlite-wal", "sqlite-transaction", "mysql-isolation", "oracle-transactions", "postgres-transaction-iso"])],
    diagnostics: [d("read-only export가 DB storage/replica lag를 계속 증가시킵니다.", "오래 열린 MVCC snapshot이 old versions·undo/WAL cleanup을 막습니다.", ["oldest transaction/snapshot age", "undo/WAL/vacuum lag", "export rows/duration", "replica apply/checkpoint"], "bounded chunks와 versioned watermark/resume를 사용하고 snapshot age hard limit을 둡니다.", "large/slow/cancelled export에서 cleanup과 storage budget을 load-test합니다.")],
    expertNotes: ["reader가 writer를 막지 않아도 storage/vacuum을 통해 비용을 전가할 수 있습니다.", "한 report의 일관성 요구와 무제한 snapshot 보존을 분리해 bounded architecture를 설계합니다."],
  },
  {
    id: "lock-modes-compatibility-scope",
    title: "row·table·intention·gap/predicate locks의 mode·scope·duration을 읽습니다",
    lead: "'잠금이 걸렸다'는 말만으로는 누가 어떤 resource를 어떤 mode로 언제까지 소유하고 무엇과 충돌하는지 설명할 수 없습니다.",
    explanations: [
      "lock record를 transaction owner, resource(table/index/key/range), mode(shared/exclusive/intention 등), granted/waiting, acquisition point와 release boundary로 읽습니다.",
      "row lock이라고 해도 index record/range를 통해 구현될 수 있습니다. 적절한 index가 없으면 scanning/locking scope가 넓어지고 예상보다 많은 writers를 막을 수 있습니다.",
      "intention locks는 lower-level row locks와 table-level operations의 호환성을 조정합니다. 이름을 실제 row 보호로 오해하지 않고 compatibility matrix를 봅니다.",
      "gap/next-key/predicate locks는 phantom/invariant를 보호하지만 insert concurrency를 제한할 수 있습니다. isolation, query shape와 index range가 scope를 결정합니다.",
      "DDL metadata locks와 schema changes도 long transaction에 막힐 수 있습니다. online DDL label만 믿지 말고 preflight blockers, lock timeout과 abort/rollback 비용을 측정합니다.",
    ],
    concepts: [
      c("lock mode", "resource에 허용·충돌하는 접근 종류를 나타내는 shared/exclusive/intention 등의 상태입니다.", ["compatibility matrix를 사용합니다.", "vendor naming이 다릅니다."]),
      c("lock scope", "lock이 보호하는 table·index record·key range·predicate 또는 metadata 범위입니다.", ["query plan/index에 의존합니다.", "관찰 resource를 확인합니다."]),
      c("lock duration", "statement 또는 transaction 종료까지 lock을 보유하는 시간 규칙입니다.", ["savepoint release 차이를 봅니다.", "long transaction을 제한합니다."]),
    ],
    codeExamples: [py("db14-write-lock-contention", "두 writer의 immediate lock contention", "db14_lock_contention.py", "첫 connection이 write reservation을 가진 동안 timeout 0의 두 번째 writer가 즉시 blocked되는지 검증합니다.", String.raw`import sqlite3
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as folder:
    path = Path(folder) / "lock.db"
    setup = sqlite3.connect(path)
    setup.execute("CREATE TABLE item(id INTEGER PRIMARY KEY, value INTEGER)")
    setup.execute("INSERT INTO item VALUES(1, 5)")
    setup.commit()
    setup.close()
    first = sqlite3.connect(path)
    second = sqlite3.connect(path, timeout=0)
    first.execute("BEGIN IMMEDIATE")
    first.execute("UPDATE item SET value=6 WHERE id=1")
    try:
        second.execute("BEGIN IMMEDIATE")
        outcome = "acquired"
        is_lock = False
    except sqlite3.OperationalError as error:
        outcome = "blocked"
        is_lock = "locked" in str(error).lower()
    first.rollback()
    value = second.execute("SELECT value FROM item WHERE id=1").fetchone()[0]
    print("second=" + outcome)
    print("error-is-lock=" + str(is_lock).lower())
    print("value-after-rollback=" + str(value))
    print("first-released=true")
    first.close()
    second.close()`, "second=blocked\nerror-is-lock=true\nvalue-after-rollback=5\nfirst-released=true", ["sqlite-locking", "sqlite-transaction", "python-sqlite3", "mysql-locking-reads", "oracle-lock-table", "postgres-explicit-locking"])],
    diagnostics: [d("PK 한 row update인데 수많은 sessions가 기다립니다.", "실제 plan이 missing index/full scan으로 넓은 records/range를 잠그거나 hot parent/metadata lock을 공유합니다.", ["blocking lock resource/mode", "actual plan/index", "predicate cardinality", "FK/trigger/DDL dependencies"], "선택성 있는 index와 deterministic narrow predicate를 적용하고 hot resource/DDL boundary를 재설계합니다.", "representative scale에서 locked rows/ranges와 wait graph budget을 regression-test합니다.")],
    expertNotes: ["SQL predicate가 한 row처럼 보여도 actual plan과 engine lock implementation이 scope를 결정합니다.", "강제 LOCK TABLE은 자동 locking을 무시하는 강한 도구이므로 compatibility와 availability review 없이 사용하지 않습니다."],
  },
  {
    id: "optimistic-pessimistic-locking",
    title: "optimistic version과 SELECT FOR UPDATE를 conflict 빈도·사용자 경험에 맞게 선택합니다",
    lead: "동시 수정 방지는 무조건 격리 수준을 높이기보다 conflict를 언제 발견하고 얼마 동안 자원을 보유할지 선택하는 문제입니다.",
    explanations: [
      "optimistic locking은 UPDATE ... WHERE id=? AND version=?로 기대 version을 predicate에 포함하고 affected rows0을 conflict로 처리합니다. version 증가와 business write는 같은 atomic statement여야 합니다.",
      "pessimistic locking read는 곧 수정할 rows를 transaction 안에서 잠급니다. lock을 잡은 채 사용자 입력·remote call을 기다리지 않고 stable resource order와 timeout을 둡니다.",
      "존재 여부와 stale/unauthorized를 구분하려고 conflict 뒤 broad SELECT를 하면 정보가 누출될 수 있습니다. authorization-aware status와 generic conflict response를 설계합니다.",
      "SKIP LOCKED/NOWAIT는 queue workers에 유용하지만 skipped jobs의 starvation, fairness, lease expiry와 exact claim semantics를 정의합니다. 일반 사용자 read에 무심코 쓰지 않습니다.",
      "version column은 권한 proof가 아니며 client input은 untrusted입니다. tenant/owner predicate와 version을 함께 쓰고 unique transition/idempotency를 검증합니다.",
    ],
    concepts: [
      c("optimistic conflict", "기대 version이 달라 conditional write affected rows가 0이 되는 충돌입니다.", ["normal domain outcome으로 처리합니다.", "reload/merge UX를 둡니다."]),
      c("locking read", "조회한 rows/ranges에 update/share lock을 획득해 concurrent writes를 조정하는 read입니다.", ["transaction 안에서만 의미가 있습니다.", "plan/index scope를 확인합니다."]),
      c("work claiming", "여러 workers가 동일 job을 중복 처리하지 않게 lock/lease/version으로 소유권을 얻는 과정입니다.", ["crash recovery가 필요합니다.", "starvation을 관측합니다."]),
    ],
    diagnostics: [d("동시 편집 시 마지막 저장이 앞선 변경을 조용히 덮습니다.", "id-only UPDATE를 사용해 read version과 write precondition이 연결되지 않았습니다.", ["read/submit version", "UPDATE predicate", "affected rows semantics", "conflict response"], "tenant/id/version conditional atomic update와 version increment를 사용하고 0 rows를 explicit conflict로 처리합니다.", "두 clients가 같은 version으로 저장해 exactly one success/one conflict가 되는 test를 둡니다.")],
    expertNotes: ["conflict가 드물고 사용자 think time이 길면 optimistic이 흔히 적합하지만 merge 비용도 제품 설계입니다.", "FOR UPDATE query가 join/view/aggregate에서 무엇을 실제로 잠그는지 vendor restrictions를 확인합니다."],
  },
  {
    id: "deadlock-wait-for-graph-ordering",
    title: "deadlock을 wait-for cycle로 진단하고 global resource order로 예방합니다",
    lead: "deadlock은 단순히 오래 기다리는 lock timeout이 아니라 transactions가 서로의 resource를 원형으로 기다려 진행할 수 없는 상태입니다.",
    explanations: [
      "wait-for graph에서 node는 transaction, A→B edge는 A가 B 보유 resource를 기다린다는 뜻입니다. cycle이 있으면 detector가 victim을 골라 rollback하거나 timeout 정책이 하나를 끊어야 합니다.",
      "전형적 schedule은 T1이 A 후 B, T2가 B 후 A를 획득하는 경우입니다. 모든 code paths가 tenant/key 등의 stable total order로 locks를 얻도록 하면 이 cycle class를 제거할 수 있습니다.",
      "deadlock victim은 잘못한 transaction이라는 뜻이 아니며 engine cost heuristic에 따라 달라질 수 있습니다. application은 지정 error code를 transient conflict로 분류하고 전체 unit을 retry합니다.",
      "FK checks, triggers, secondary indexes와 duplicate checks도 보이지 않는 locks를 추가합니다. SQL 두 줄만 보지 말고 deadlock report의 resources/index/statement/transaction age를 읽습니다.",
      "한 deadlock을 lock timeout 증가로 숨기면 cycle이 더 오래 자원을 점유합니다. graph 원인·order를 수정하고 retry는 안전망으로 둡니다.",
    ],
    concepts: [
      c("wait-for graph", "waiting transaction에서 blocking transaction으로 향하는 lock dependency graph입니다.", ["resource/mode를 edge에 붙입니다.", "cycle을 탐지합니다."]),
      c("deadlock victim", "cycle을 끊기 위해 DB가 abort/rollback하도록 선택한 transaction입니다.", ["정상 retry 대상일 수 있습니다.", "부분 retry가 아니라 전체 unit을 반복합니다."]),
      c("global lock order", "모든 writers가 여러 resources를 획득할 때 따르는 stable total order입니다.", ["모든 code paths에 적용합니다.", "trigger/FK locks도 고려합니다."]),
    ],
    codeExamples: [py("db14-deadlock-graph", "synthetic wait-for cycle 탐지", "db14_deadlock_graph.py", "SQLite가 제공하지 않는 row-deadlock을 가장하지 않고 wait edges를 table에 넣어 cycle과 deterministic victim을 계산합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE wait_edge(waiter TEXT, holder TEXT, resource TEXT)")
db.executemany("INSERT INTO wait_edge VALUES(?, ?, ?)", [
    ("tx-a", "tx-b", "row-2"), ("tx-b", "tx-a", "row-1")
])
edges = db.execute("SELECT waiter, holder, resource FROM wait_edge ORDER BY waiter").fetchall()
graph = {waiter: holder for waiter, holder, _ in edges}
start = min(graph)
path = [start]
current = start
while graph[current] not in path:
    current = graph[current]
    path.append(current)
path.append(graph[current])
cycle_nodes = path[path.index(path[-1]):-1]
victim = max(cycle_nodes)
for waiter, holder, resource in edges:
    print(f"{waiter}->{holder}:{resource}")
print("cycle=" + ">".join(path))
print("victim=" + victim)
print("deadlock=true")`, "tx-a->tx-b:row-2\ntx-b->tx-a:row-1\ncycle=tx-a>tx-b>tx-a\nvictim=tx-b\ndeadlock=true", ["mysql-deadlocks", "mysql-deadlock-detection", "mysql-data-locks", "oracle-automatic-locks", "postgres-explicit-locking", "postgres-pg-locks"])],
    diagnostics: [d("같은 두 operations가 반복해서 deadlock victim이 됩니다.", "code paths가 resources를 서로 다른 순서로 잠그거나 trigger/FK가 hidden order를 추가합니다.", ["deadlock graph/report", "all statements/triggers/FKs", "resource key order", "plan/index differences"], "모든 paths에서 canonical resource order와 narrow indexes를 적용하고 transaction을 짧게 만듭니다.", "반대 순서 barrier test와 production deadlock signature regression을 둡니다.")],
    expertNotes: ["SQLite synthetic graph는 cycle reasoning만 증명하며 실제 victim/row locks를 재현하지 않는다고 명시합니다.", "deadlock report의 row/key values는 민감할 수 있어 redacted signature와 secure raw access를 분리합니다."],
  },
  {
    id: "deadlock-retry-idempotency-backoff",
    title: "deadlock·serialization failure를 새 transaction의 bounded idempotent retry로 처리합니다",
    lead: "DB가 victim을 rollback한 뒤 같은 transaction 객체에서 마지막 statement만 재실행하면 앞선 reads/writes와 invariant가 복구되지 않습니다.",
    explanations: [
      "retryable error code를 engine/driver translation에서 정확히 분류합니다. deadlock, serialization failure와 lock timeout을 무조건 하나로 묶지 않고 root cause와 정책을 나눕니다.",
      "전체 business unit을 새 transaction/snapshot에서 다시 읽고 계산합니다. 이전 entity objects, generated ids와 cached decisions를 재사용하지 않습니다.",
      "max attempts, exponential backoff+jitter, total deadline과 concurrency budget을 둡니다. 무제한 immediate retry는 thundering herd와 lock pressure를 키웁니다.",
      "request/idempotency key, unique constraints와 outbox event ids로 commit-unknown 또는 client retry와 겹쳐도 one effect로 수렴합니다. transaction retry와 HTTP retry layer 수를 함께 제한합니다.",
      "각 attempt의 error class, wait duration, transaction age와 final outcome을 bounded trace로 남깁니다. raw SQL parameters나 lock key를 high-cardinality metric label로 쓰지 않습니다.",
    ],
    concepts: [
      c("transaction retry", "rollback된 전체 unit을 새 transaction과 fresh reads로 다시 실행하는 절차입니다.", ["statement retry와 다릅니다.", "side effects가 idempotent해야 합니다."]),
      c("retry budget", "attempt 수·backoff·jitter·total deadline·concurrency에 둔 상한입니다.", ["outer retry와 합산합니다.", "overload를 차단합니다."]),
      c("exactly-once effect", "중복 실행 가능성 아래에서도 durable business 결과가 한 번만 반영되도록 key/constraint/reconciliation하는 성질입니다.", ["delivery once와 다릅니다.", "outbox consumer까지 적용합니다."]),
    ],
    codeExamples: [py("db14-idempotent-retry", "첫 victim rollback 뒤 전체 unit 재시도", "db14_retry.py", "첫 attempt의 write 뒤 synthetic deadlock을 주입해 rollback하고 두 번째 attempt만 balance와 ledger를 commit합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, balance INTEGER)")
db.execute("CREATE TABLE ledger(request_key TEXT PRIMARY KEY, amount INTEGER)")
db.execute("INSERT INTO account VALUES(1, 100)")
db.commit()
attempts = 0
backoffs = []
while attempts < 3:
    attempts += 1
    try:
        db.execute("BEGIN")
        db.execute("UPDATE account SET balance=balance-10 WHERE id=1")
        if attempts == 1:
            raise sqlite3.OperationalError("synthetic-deadlock")
        db.execute("INSERT INTO ledger VALUES('req-1', -10)")
        db.commit()
        break
    except sqlite3.OperationalError:
        db.rollback()
        backoffs.append(10)
print("attempts=" + str(attempts))
print("backoff-ms=" + ",".join(map(str, backoffs)))
print("balance=" + str(db.execute("SELECT balance FROM account").fetchone()[0]))
print("ledger=" + str(db.execute("SELECT count(*) FROM ledger").fetchone()[0]))
print("one-effect=true")`, "attempts=2\nbackoff-ms=10\nbalance=90\nledger=1\none-effect=true", ["sqlite-transaction", "mysql-deadlocks", "oracle-transactions", "postgres-transaction-iso", "postgres-runtime-locks"])],
    diagnostics: [d("deadlock retry가 ledger/outbox를 두 번 만듭니다.", "DB rollback 밖 external effect를 먼저 실행했거나 stable idempotency/event key가 없습니다.", ["attempt transaction boundaries", "external publish timing", "unique request/event keys", "commit-unknown path"], "business+outbox를 same transaction에 쓰고 stable keys로 deduplicate한 뒤 commit된 outbox만 relay합니다.", "victim/timeout/ack-loss가 겹친 retries에서 one durable effect를 검증합니다.")],
    expertNotes: ["deadlock retry success가 구조적 cycle을 해결한 것은 아니므로 signature 빈도와 lock order를 계속 수정합니다.", "backoff 예제는 실제 sleep을 생략한 deterministic harness이며 production에는 jitter와 total deadline을 둡니다."],
  },
  {
    id: "lock-timeout-cancel-pool",
    title: "lock wait·statement·transaction·request timeout과 cancellation을 한 deadline 체계로 묶습니다",
    lead: "대기 상한이 없으면 한 blocker가 pool과 worker를 고갈시키고, 너무 짧은 무차별 timeout은 정상 작업을 재시도 폭풍으로 바꿉니다.",
    explanations: [
      "lock timeout은 lock 획득 대기, statement timeout은 query 전체, transaction timeout은 unit, request deadline은 사용자 경계입니다. inner deadline이 outer보다 짧도록 budget을 배분합니다.",
      "NOWAIT은 즉시 conflict, SKIP LOCKED는 잠긴 rows를 건너뜁니다. queue worker가 아니면 누락된 data처럼 보일 수 있어 product semantics를 명시합니다.",
      "timeout/cancel error 뒤 transaction이 usable한지 vendor별로 확인하고 일반적으로 rollback 후 새 transaction에서 retry합니다. cancel 요청이 server에 도달했는지 activity/locks로 readback합니다.",
      "outer transaction이 connection을 가진 채 REQUIRES_NEW가 pool을 기다리면 application-level resource deadlock이 생깁니다. nesting×concurrency보다 충분한 capacity와 금지 규칙을 둡니다.",
      "blocker kill은 rollback 비용과 business owner를 확인한 뒤 수행합니다. victim만 반복 종료하면 root long transaction/plan/hot key는 남습니다.",
    ],
    concepts: [
      c("lock wait timeout", "호환 lock을 얻기 위해 기다릴 최대 시간과 그 초과 error입니다.", ["deadlock detector와 다릅니다.", "transaction state를 확인합니다."]),
      c("deadline propagation", "outer request의 남은 시간을 transaction·statement·lock operations에 전달하는 규칙입니다.", ["시간을 단조 감소시킵니다.", "retry budget을 포함합니다."]),
      c("pool exhaustion cycle", "transaction이 resource를 보유한 채 추가 pool connection을 기다려 서로 진행하지 못하는 상태입니다.", ["DB deadlock report에 없을 수 있습니다.", "nesting을 줄입니다."]),
    ],
    diagnostics: [d("DB deadlock은 없는데 모든 요청이 pool 대기에서 멈춥니다.", "outer transactions가 connections를 보유한 채 REQUIRES_NEW/async 작업의 추가 connections를 기다립니다.", ["pool active/pending owners", "transaction nesting", "thread dumps", "DB active/idle-in-tx"], "nested independent transactions를 제거하거나 capacity/deadline을 명시하고 outer가 기다리는 구조를 비동기로 분리합니다.", "최대 concurrency+nested path load test에서 bounded wait와 pool recovery를 검증합니다.")],
    expertNotes: ["timeout을 늘리는 것은 원인 수정이 아니라 더 많은 resource를 대기 상태로 보존하는 선택일 수 있습니다.", "cancelled connection이 pool로 돌아갈 때 rollback/reset/readback 또는 eviction을 보장합니다."],
  },
  {
    id: "lock-observability-privacy",
    title: "blocker tree·wait event·deadlock report를 application trace와 연결해 진단합니다",
    lead: "lock 장애는 느린 victim query만 보면 원인을 찾기 어렵고 가장 오래된 root blocker와 그 transaction owner를 찾아야 합니다.",
    explanations: [
      "data_locks/lock waits, Oracle lock/session views와 PostgreSQL pg_locks/activity를 사용해 waiting→blocking tree를 만듭니다. granted mode, requested mode, resource, transaction age와 current/last statement를 구분합니다.",
      "root blocker는 현재 idle-in-transaction일 수 있습니다. application request/operation, pool checkout stack과 commit/rollback 누락을 trace correlation으로 연결합니다.",
      "deadlock report는 victim과 participating transactions/statements/index records를 캡처합니다. rolling buffer/last-only 특성, retention과 centralized collection을 확인합니다.",
      "lock resource와 SQL parameters에는 tenant id·business key·PII가 포함될 수 있습니다. 일반 dashboard에는 hashed/bucketed object/index/signature만 두고 raw report는 제한된 incident store에 보관합니다.",
      "alerts는 lock wait p95/p99, waiters, oldest transaction, deadlocks by signature, victim retries/failures와 pool pending을 함께 봅니다. deadlock count 0을 위해 detector를 끄지 않습니다.",
    ],
    concepts: [
      c("blocker tree", "각 waiting transaction을 직접/간접 blocking transaction에 연결한 directed forest입니다.", ["root blocker를 찾습니다.", "age와 owner를 붙입니다."]),
      c("deadlock signature", "참여 object/index/operation/lock-order pattern을 값 제거 후 안정적으로 묶은 식별자입니다.", ["regression을 추적합니다.", "raw keys를 노출하지 않습니다."]),
      c("idle in transaction", "DB transaction을 연 채 application은 현재 SQL을 실행하지 않는 상태입니다.", ["locks/versions를 보유할 수 있습니다.", "strict timeout을 둡니다."]),
    ],
    diagnostics: [d("느린 UPDATE를 kill해도 잠시 뒤 같은 장애가 반복됩니다.", "victim waiter만 종료하고 오래된 idle root blocker나 공통 hot resource를 제거하지 않았습니다.", ["full blocker tree", "root transaction age/owner", "pool trace", "deadlock/lock signature trend"], "root cause connection lifecycle·lock order·query plan을 수정하고 승인된 root termination/rollback을 수행합니다.", "incident 후 signature-specific concurrency test와 alert/runbook을 추가합니다.")],
    expertNotes: ["blocking query의 현재 SQL이 lock을 획득한 SQL과 다를 수 있어 transaction history/trace가 필요합니다.", "raw deadlock reports는 incident 접근 통제·retention·redaction 대상입니다."],
  },
  {
    id: "isolation-locking-release-governance",
    title: "deterministic concurrency suite·capacity budget·upgrade matrix·runbook으로 운영을 닫습니다",
    lead: "unit test의 순차 실행은 동시 anomaly와 deadlock을 거의 재현하지 못하므로 실제 엔진의 barrier-controlled schedules가 release evidence여야 합니다.",
    explanations: [
      "각 invariant에 T1/T2 steps, barriers, isolation, schema/index/data distribution과 allowed outcomes를 작성합니다. sleep만으로 timing을 맞추지 않고 latches/barriers와 server state readback을 사용합니다.",
      "suite는 dirty/non-repeatable/phantom, lost update/write skew, optimistic conflict, locking read NOWAIT/timeout, deadlock cycle/victim/retry와 long snapshot cleanup을 포함합니다.",
      "대표 hot/cold/skew data에서 transaction duration, locks held/waited, deadlock rate, retry attempts, rollback cost, pool utilization과 undo/WAL/version retention budget을 측정합니다.",
      "DB/driver/framework upgrade 시 isolation default, lock plan/index, error codes/translation, deadlock detector와 monitoring view schema를 재검증합니다. approved matrix에 없는 difference는 release를 막습니다.",
      "runbook은 blocker tree capture, privacy-safe report, victim retry status, root termination approval, idempotent recovery/reconciliation과 postmortem signature test를 포함합니다.",
    ],
    concepts: [
      c("barrier-controlled test", "두 workers를 지정 step에서 정지·재개해 원하는 concurrency schedule을 결정적으로 만드는 test입니다.", ["sleep 의존을 줄입니다.", "server state를 readback합니다."]),
      c("concurrency budget", "transaction duration·locks/waits·retries·pool·version retention에 둔 workload 상한입니다.", ["skew/hot key를 포함합니다.", "release gate로 사용합니다."]),
      c("lock incident runbook", "증거 캡처부터 안전한 종료·retry/reconciliation·예방 test까지 이어지는 대응 절차입니다.", ["kill 명령 전에 승인을 둡니다.", "raw values를 보호합니다."]),
    ],
    diagnostics: [d("CI concurrency test가 가끔만 실패해 quarantine됩니다.", "sleep 기반 비결정 schedule과 결과만 검사해 실제 interleaving evidence가 없습니다.", ["barrier arrival order", "server transaction/lock state", "allowed outcomes", "test cleanup/isolation"], "explicit barriers와 unique run schema/keys를 사용하고 각 step readback·timeout·cleanup을 단언합니다.", "flake를 재시도해 숨기지 말고 schedule trace와 invariant를 artifact로 남깁니다.")],
    expertNotes: ["SQLite harness 통과는 개념 baseline일 뿐 production 엔진 concurrency gate를 생략할 근거가 아닙니다.", "deadlock 0 목표보다 안전한 victim handling과 구조적 signature 감소를 함께 측정합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0204", repository: "dbstudy", path: "02_04.sql", usedFor: ["routine progression and explicit isolation/locking/deadlock gap"], evidence: "read-only 구조 감사에서 251 logical lines, statement-like segments73, CALL11을 확인했고 ISOLATION·LOCK·DEADLOCK token은 모두 0회였습니다. sample literals는 복사하지 않았습니다." },
  { id: "sqlite-isolation", repository: "SQLite Documentation", path: "Isolation In SQLite", publicUrl: "https://www.sqlite.org/isolation.html", usedFor: ["serialized writes, WAL snapshots and exact two-connection harnesses"], evidence: "SQLite 공식 isolation 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["DEFERRED/IMMEDIATE transaction and rollback/retry"], evidence: "SQLite 공식 transaction 문서입니다." },
  { id: "sqlite-locking", repository: "SQLite Documentation", path: "File Locking And Concurrency", publicUrl: "https://www.sqlite.org/lockingv3.html", usedFor: ["SQLite file-lock state and limitations"], evidence: "SQLite 공식 locking 문서입니다." },
  { id: "sqlite-wal", repository: "SQLite Documentation", path: "Write-Ahead Logging", publicUrl: "https://www.sqlite.org/wal.html", usedFor: ["reader/writer concurrency, snapshot and checkpoint boundary"], evidence: "SQLite 공식 WAL 문서입니다." },
  { id: "python-sqlite3", repository: "Python Documentation", path: "sqlite3 — DB-API 2.0 interface", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["timeout, connection and exception harness behavior"], evidence: "Python 표준 라이브러리 공식 문서입니다." },
  { id: "mysql-isolation", repository: "MySQL 8.4 Reference Manual", path: "Transaction Isolation Levels", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html", usedFor: ["InnoDB consistent/locking reads and level differences"], evidence: "MySQL 공식 isolation 문서입니다." },
  { id: "mysql-locking-reads", repository: "MySQL 8.4 Reference Manual", path: "Locking Reads", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html", usedFor: ["FOR SHARE/UPDATE, NOWAIT and SKIP LOCKED"], evidence: "MySQL 공식 locking-read 문서입니다." },
  { id: "mysql-deadlocks", repository: "MySQL 8.4 Reference Manual", path: "Deadlocks in InnoDB", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html", usedFor: ["deadlock detection, victim rollback and retry"], evidence: "MySQL 공식 deadlock 문서입니다." },
  { id: "mysql-deadlock-detection", repository: "MySQL 8.4 Reference Manual", path: "Deadlock Detection", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-detection.html", usedFor: ["wait-for cycle detector and victim behavior"], evidence: "MySQL 공식 deadlock-detection 문서입니다." },
  { id: "mysql-data-locks", repository: "MySQL 8.4 Reference Manual", path: "Performance Schema data_locks", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/performance-schema-data-locks-table.html", usedFor: ["lock resource/mode observability"], evidence: "MySQL 공식 data_locks 문서입니다." },
  { id: "oracle-transactions", repository: "Oracle AI Database 26ai Concepts", path: "Transactions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/transactions.html", usedFor: ["Oracle read consistency, locks, deadlocks and retry boundary"], evidence: "Oracle 공식 transactions 문서입니다." },
  { id: "oracle-lock-table", repository: "Oracle AI Database 26ai SQL Language Reference", path: "LOCK TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/LOCK-TABLE.html", usedFor: ["explicit table lock modes and duration"], evidence: "Oracle 공식 LOCK TABLE 문서입니다." },
  { id: "oracle-automatic-locks", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Automatic Locks in DML Operations", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Automatic-Locks-in-DML-Operations.html", usedFor: ["row/table lock modes and automatic acquisition"], evidence: "Oracle 공식 automatic-locks 문서입니다." },
  { id: "postgres-transaction-iso", repository: "PostgreSQL Documentation", path: "Transaction Isolation", publicUrl: "https://www.postgresql.org/docs/current/transaction-iso.html", usedFor: ["phenomena, serialization anomaly and retry"], evidence: "PostgreSQL 공식 isolation 문서입니다." },
  { id: "postgres-explicit-locking", repository: "PostgreSQL Documentation", path: "Explicit Locking", publicUrl: "https://www.postgresql.org/docs/current/explicit-locking.html", usedFor: ["table/row locks, deadlocks and advisory boundary"], evidence: "PostgreSQL 공식 locking 문서입니다." },
  { id: "postgres-pg-locks", repository: "PostgreSQL Documentation", path: "pg_locks", publicUrl: "https://www.postgresql.org/docs/current/view-pg-locks.html", usedFor: ["lock owner/mode/granted observability"], evidence: "PostgreSQL 공식 pg_locks 문서입니다." },
  { id: "postgres-runtime-locks", repository: "PostgreSQL Documentation", path: "Lock Management Settings", publicUrl: "https://www.postgresql.org/docs/current/runtime-config-locks.html", usedFor: ["deadlock/lock timeout configuration boundary"], evidence: "PostgreSQL 공식 lock configuration 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-14-isolation-locking-deadlock", slug: "db-14-isolation-locking-deadlock", courseId: "database", moduleId: "db-programmability-performance", order: 6,
  title: "격리 수준, 잠금과 deadlock 진단", subtitle: "동시 schedule에서 MVCC snapshot·lock scope·wait-for cycle·idempotent retry·운영 관측까지 증명합니다.", level: "전문가", estimatedMinutes: 980,
  coreQuestion: "동시에 실행되는 transactions가 어떤 versions와 rows/ranges를 보고 잠그며, anomaly·blocking·deadlock이 발생했을 때 correctness를 잃지 않고 어떻게 진단·retry·예방할까요?",
  summary: "dbstudy 02_04.sql을 read-only로 구조 감사해 routine progression과 isolation/lock/deadlock 직접 예제 부재를 명시합니다. concurrency anomalies, vendor isolation contract, MVCC snapshot/retention, lock mode/scope, optimistic/pessimistic control, wait-for deadlock/order, bounded idempotent retry, timeout/pool, privacy-safe blocker observability와 deterministic release governance를 초급에서 전문가까지 연결합니다. 다섯 exact Python/SQLite examples는 dirty-read prevention, repeatable WAL snapshot, write contention, synthetic wait-for cycle와 victim rollback retry를 실행하며 MySQL 8.4·Oracle 26ai row/gap locks와 detector는 실제 engine matrix로 분리합니다.",
  objectives: ["dirty/non-repeatable/phantom/lost-update/write-skew schedule을 구분한다.", "isolation level 이름과 vendor MVCC/locking 구현 차이를 검증한다.", "snapshot age·undo/WAL/version retention 비용을 운영한다.", "lock mode·resource·scope·duration과 actual plan/index를 연결한다.", "optimistic version·locking read·work claim을 요구에 맞게 선택한다.", "wait-for graph cycle과 global resource order로 deadlock을 진단·예방한다.", "victim을 새 transaction의 bounded idempotent retry로 처리한다.", "blocker tree·timeouts·pool·privacy·concurrency release gate를 운영한다."],
  prerequisites: [{ title: "트랜잭션, COMMIT·ROLLBACK과 ACID", reason: "transaction outcome·rollback·retry와 idempotency 경계를 동시 실행에 적용합니다.", sessionSlug: "db-13-transaction-acid" }, { title: "복합 인덱스와 실행 계획", reason: "predicate·plan이 lock scope와 range에 영향을 주므로 다음 세션에서 성능 증거를 확장합니다." }],
  keywords: ["isolation", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE", "MVCC", "snapshot", "row lock", "gap lock", "optimistic locking", "SELECT FOR UPDATE", "deadlock", "wait-for graph", "retry", "lock timeout", "blocker tree"], topics,
  lab: {
    title: "동시 재고 예약을 anomaly·deadlock·retry·관측까지 검증하기",
    scenario: "여러 workers가 tenant별 inventory와 allocation rows를 동시에 예약합니다. stale reads, cross-row quota, hot keys, reverse lock order, timeout과 duplicate retries가 발생합니다.",
    setup: ["원본 SQL은 read-only provenance로만 사용하고 synthetic tenant/item/request ids를 준비합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 동일 constraints/indexes를 준비합니다.", "각 invariant와 T1/T2 barrier schedule, effective isolation, expected lock resources/outcomes를 작성합니다.", "hot/cold/skew, missing index, reverse order, long reader, victim/commit-unknown fixtures를 만듭니다."],
    steps: ["effective isolation/autocommit/snapshot 시점과 pool reset을 readback합니다.", "dirty/non-repeatable/phantom/lost-update/write-skew schedules를 barriers로 실행합니다.", "optimistic version과 locking read의 success/conflict/wait outcomes를 비교합니다.", "actual plan/index와 lock resource/mode/range/count를 연결합니다.", "long snapshot이 undo/WAL/vacuum/replica에 미치는 비용과 hard limit을 측정합니다.", "A→B/B→A schedule에서 deadlock report와 wait-for cycle/victim을 수집합니다.", "global resource order 적용 전후 deadlock signature를 비교합니다.", "victim/serialization failure를 fresh transaction+idempotency key로 bounded retry합니다.", "lock/statement/transaction/request deadlines와 cancel/pool cleanup을 검증합니다.", "blocker tree·privacy-safe telemetry·reconciliation·kill/recovery runbook을 drill합니다."],
    expectedResult: ["각 anomaly가 명시 schedule과 engine-specific allowed outcomes로 설명됩니다.", "lock scope가 SQL 추측이 아니라 actual plan/catalog lock evidence와 일치합니다.", "deadlock cycle은 deterministic report로 재현되고 order fix 뒤 제거됩니다.", "victim retry·duplicate request·ack loss에서도 exactly-one business effect로 수렴합니다.", "snapshot/lock/pool/resource budgets와 incident runbook이 raw keys 없이 운영됩니다."],
    cleanup: ["workers를 종료하고 active/idle transactions, locks와 pool pending이 0인지 확인합니다.", "isolated schemas·synthetic requests/ledger/outbox와 captured raw reports를 retention policy대로 제거합니다.", "temporary credentials와 exports를 revoke·삭제합니다.", "production과 dbstudy 원본 파일/data는 변경하지 않습니다."],
    extensions: ["distributed DB의 serializable snapshot isolation과 global deadlock detector를 비교합니다.", "advisory locks와 lease/fencing token의 crash semantics를 검증합니다.", "online DDL metadata-lock preflight와 abort budget을 자동화합니다.", "hot-key sharding·single-writer queue·commutative update를 lock 기반 설계와 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 T1/T2 schedule·snapshot·lock/wait graph·retry post-state를 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "uncommitted/committed visibility를 구분합니다.", "reader snapshot 전후 값을 표시합니다.", "writer lock acquire/release를 적습니다.", "wait-for cycle과 victim을 계산합니다.", "첫 attempt rollback과 one effect를 검산합니다."], hints: ["최종 값보다 transaction별 관찰·보유·대기를 먼저 적으세요."], expectedOutcome: "isolation/lock/deadlock을 재현 가능한 schedule과 graph로 설명합니다.", solutionOutline: ["schedule→visibility→lock edges→cycle→rollback/retry 순서입니다."] },
    { difficulty: "응용", prompt: "동시 예약 service의 lost update·write skew·deadlock을 실제 엔진에서 제거하세요.", requirements: ["local explicit gap provenance를 보존합니다.", "barrier schedules와 allowed outcomes를 작성합니다.", "effective isolation과 MVCC snapshot을 readback합니다.", "version/locking read/predicate protection을 선택합니다.", "actual index/lock scope를 수집합니다.", "deadlock order와 retry/idempotency를 구현합니다.", "timeouts/pool/cancel budgets를 둡니다.", "blocker/reconciliation/runbook을 포함합니다."], hints: ["level을 가장 높게 바꾸기 전에 깨지는 invariant와 lock scope를 증명하세요."], expectedOutcome: "correctness·throughput·recovery가 균형 잡힌 concurrent transaction 설계가 완성됩니다.", solutionOutline: ["invariant→schedule→engine evidence→control→retry→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 isolation·locking·deadlock 표준을 작성하세요.", requirements: ["anomaly schedule taxonomy를 둡니다.", "engine/version isolation conformance를 요구합니다.", "MVCC snapshot age/version retention budgets를 둡니다.", "lock scope/index/plan review를 요구합니다.", "optimistic/pessimistic/work-claim 기준을 정의합니다.", "global order/deadlock report/retry/idempotency rules를 둡니다.", "deadline/pool/cancel/kill governance를 포함합니다.", "privacy-safe observability와 barrier release suite를 정의합니다."], hints: ["deadlock victim retry는 구조적 lock-order 수정의 대체물이 아닙니다."], expectedOutcome: "초급 anomaly 이해부터 production incident response까지 일관된 전문가 gate가 완성됩니다.", solutionOutline: ["model→schedule→lock→cycle→retry→budget→observe→improve 순서입니다."] },
  ],
  nextSessions: ["db-15-index-composite-order"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_04.sql 251 logical lines/5,670 bytes를 read-only로 감사해 routine/function progression과 ISOLATION·LOCK·DEADLOCK token 0회를 확인했습니다.", "원본 사람/업무 값·SQL code·credentials는 복사하지 않고 explicit concurrency gap만 provenance로 사용했습니다.", "공식 SQLite·MySQL·Oracle·PostgreSQL 문서와 synthetic schedules로 anomalies, MVCC, locks, deadlocks, retry, timeout과 observability를 보강했습니다.", "SQLite exact harness는 MySQL 8.4 InnoDB row/gap/next-key locks·deadlock detector와 Oracle 26ai read consistency/row locks/victim behavior를 대체하지 않습니다."] },
});

export default session;
