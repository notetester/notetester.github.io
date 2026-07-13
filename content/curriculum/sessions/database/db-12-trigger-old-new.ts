import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 메모리 DB와 synthetic rows를 준비해 운영 데이터·credential 없이 trigger 의미를 재현합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "trigger DDL과 DML을 실행하고 OLD·NEW, row firing, chain, rollback 또는 catalog 상태를 readback합니다." },
      { lines: "마지막 5줄", explanation: "정렬된 synthetic key·bounded count·boolean만 출력합니다. MySQL·Oracle의 statement/compound trigger와 security는 실제 엔진에서 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite row-trigger harness는 MySQL 8.4·Oracle 26ai의 privileges, binary log, compound trigger와 mutating-table 동작을 대체하지 않습니다."] },
    experiments: [
      { change: "한 statement가 0개·1개·여러 rows를 바꾸도록 fixture를 바꿉니다.", prediction: "row trigger event 수는 실제 affected rows와 같지만 statement trigger 지원·순서는 엔진별로 다릅니다.", result: "base affected count와 audit/outbox count를 별도로 reconciliation합니다." },
      { change: "trigger body 두 번째 write가 constraint 오류를 내도록 만듭니다.", prediction: "trigger와 원래 DML의 모든 side effects가 같은 transaction에서 되돌아가야 합니다.", result: "base·audit·outbox·child를 새 connection에서 모두 readback합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "trigger-event-timing-granularity",
    title: "트리거를 event·timing·granularity·target의 네 축으로 읽습니다",
    lead: "트리거는 호출문이 보이지 않아도 DML·DDL·database event에 반응해 실행되는 저장 프로그램이므로 발화 조건과 transaction owner를 먼저 고정해야 합니다.",
    explanations: [
      "INSERT·UPDATE·DELETE 중 어떤 event가 어느 table/view에서 발화하는지, BEFORE·AFTER·INSTEAD OF 중 언제인지, statement당 한 번인지 row마다인지 표로 적습니다. 같은 CREATE TRIGGER 문법처럼 보여도 MySQL은 row trigger 중심이고 Oracle은 statement·row·compound timing을 지원하며 SQLite는 FOR EACH ROW 의미만 제공합니다.",
      "BEFORE는 새 값 검증·정규화가 가능한 엔진에서 사용하지만 이미 존재하는 constraint/default/generated column과 ownership이 충돌하지 않아야 합니다. AFTER는 최종 저장 값을 감사·outbox에 기록하기 좋지만 그 기록 역시 원래 DML이 실패하면 함께 rollback되는지 확인합니다.",
      "INSTEAD OF는 주로 view write를 base commands로 명시적으로 mapping합니다. 단순 감사 trigger와 달리 원래 DML을 대체하므로 허용 columns, affected-row 의미, optimistic version과 authorization을 command contract로 설계합니다.",
      "DDL/system trigger는 application row trigger와 권한·가용성 위험이 훨씬 큽니다. login/schema/database event를 broad하게 가로채면 장애가 전체 instance에 번질 수 있어 최소 privilege, break-glass disable과 별도 review가 필요합니다.",
      "trigger를 business service의 숨은 대체물로 늘리지 않습니다. cross-service call, 사용자 상호작용, 느린 network와 retry가 필요한 작업은 transaction outbox·worker처럼 관측 가능한 경계로 이동합니다.",
    ],
    concepts: [
      c("triggering event", "database가 trigger 실행 여부를 판정하는 INSERT·UPDATE·DELETE·DDL·system 사건입니다.", ["target object와 columns를 포함합니다.", "MERGE가 어떤 events로 분해되는지 엔진별 확인합니다."]),
      c("timing point", "원래 event 전·후 또는 대신 실행되는 BEFORE·AFTER·INSTEAD OF 위치입니다.", ["보이는 row image가 다릅니다.", "오류 전파와 constraint 순서를 검증합니다."]),
      c("granularity", "statement 한 번 또는 영향을 받은 각 row마다 trigger가 실행되는 단위입니다.", ["multi-row 비용을 결정합니다.", "SQLite/MySQL/Oracle 차이를 기록합니다."]),
    ],
    codeExamples: [py("db12-old-new-lifecycle", "INSERT·UPDATE·DELETE의 OLD·NEW lifecycle", "db12_old_new.py", "세 row trigger가 operation별 before/after image를 어떻게 기록하는지 synthetic status 하나로 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item(id INTEGER PRIMARY KEY, status TEXT NOT NULL)")
db.execute("CREATE TABLE audit(seq INTEGER PRIMARY KEY, op TEXT, before_value TEXT, after_value TEXT)")
db.executescript("""
CREATE TRIGGER item_ai AFTER INSERT ON item BEGIN
  INSERT INTO audit(op, before_value, after_value) VALUES('I', NULL, NEW.status);
END;
CREATE TRIGGER item_au AFTER UPDATE OF status ON item BEGIN
  INSERT INTO audit(op, before_value, after_value) VALUES('U', OLD.status, NEW.status);
END;
CREATE TRIGGER item_ad AFTER DELETE ON item BEGIN
  INSERT INTO audit(op, before_value, after_value) VALUES('D', OLD.status, NULL);
END;
""")
db.execute("INSERT INTO item VALUES(?, ?)", (1, "draft"))
db.execute("UPDATE item SET status=? WHERE id=?", ("ready", 1))
db.execute("DELETE FROM item WHERE id=?", (1,))
rows = db.execute("SELECT op, before_value, after_value FROM audit ORDER BY seq").fetchall()
for op, before, after in rows:
    print(f"{op}:{before or '-'}:{after or '-'}")
print("events=" + str(len(rows)))`, "I:-:draft\nU:draft:ready\nD:ready:-\nevents=3", ["local-0205", "sqlite-trigger", "mysql-create-trigger", "oracle-create-trigger", "postgres-create-trigger", "postgres-trigger-function"])],
    diagnostics: [d("UPDATE를 실행했는데 예상하지 않은 audit·summary rows가 생깁니다.", "application query만 보고 같은 target의 trigger inventory와 timing을 확인하지 않았습니다.", ["catalog의 enabled triggers", "event/timing/granularity", "trigger body dependencies", "transaction id와 affected rows"], "trigger contract를 manifest로 만들고 DML trace에서 base와 side effects를 같은 correlation으로 readback합니다.", "schema drift check와 synthetic DML contract suite를 배포 gate로 둡니다.")],
    expertNotes: ["trigger 존재 자체보다 event×timing×granularity×owner matrix가 설명 가능해야 합니다.", "view INSTEAD OF trigger는 query abstraction이 아니라 command API이므로 별도 권한·version 계약을 둡니다."],
  },
  {
    id: "old-new-operation-matrix",
    title: "OLD·NEW pseudorecord의 operation별 존재성과 수정 가능성을 구분합니다",
    lead: "INSERT에는 OLD가 없고 DELETE에는 NEW가 없으며 UPDATE에는 둘 다 있지만, NULL column과 존재하지 않는 row image를 같은 것으로 취급하면 감사 기록이 모호해집니다.",
    explanations: [
      "operation별 matrix를 만듭니다. INSERT는 NEW, DELETE는 OLD, UPDATE는 OLD와 NEW를 비교합니다. 엔진 문법의 colon, REFERENCING alias와 BEFORE NEW 수정 가능성은 다르므로 한 dialect 예제를 그대로 이식하지 않습니다.",
      "값이 SQL NULL인 것과 해당 operation에서 pseudorecord가 정의되지 않는 것은 다릅니다. audit schema에는 op와 changed-columns 또는 before/after presence를 함께 두어 null→value, value→null과 row creation/deletion을 구분합니다.",
      "UPDATE OF column은 statement에 column이 언급됐다는 뜻인지 값이 실제 달라졌다는 뜻인지 엔진 규칙을 확인합니다. no-op update를 감사하지 않으려면 OLD와 NEW의 NULL-safe 비교가 필요하며 연산자도 dialect별 차이가 있습니다.",
      "generated/default/database-owned columns의 최종 값을 기록하려면 어느 timing에서 확정되는지 확인합니다. application supplied value와 trigger normalization이 경쟁하면 API response와 저장 row가 다를 수 있으므로 RETURNING/readback을 사용합니다.",
      "wide row 전체를 audit에 복제하면 PII·secret·retention 비용이 커집니다. allow-listed business fields, actor/request metadata와 변경 reason을 최소화하고 암호화·access·삭제 정책을 원본보다 엄격하게 설계합니다.",
    ],
    concepts: [
      c("OLD image", "UPDATE/DELETE 이전 affected row의 column 값을 노출하는 pseudorecord입니다.", ["INSERT에는 일반적으로 없습니다.", "읽기/수정 가능성은 timing·engine별로 다릅니다."]),
      c("NEW image", "INSERT/UPDATE가 만들려는 또는 만든 affected row 값을 노출하는 pseudorecord입니다.", ["DELETE에는 일반적으로 없습니다.", "default/generated 적용 시점을 확인합니다."]),
      c("NULL-safe change", "두 row image에서 NULL 전이를 포함해 값이 실제 달라졌는지 판정하는 비교입니다.", ["UPDATE OF와 다릅니다.", "dialect operator를 matrix로 검증합니다."]),
    ],
    diagnostics: [d("NULL에서 값으로 바뀐 update가 audit에 누락됩니다.", "OLD <> NEW가 UNKNOWN이 되어 change predicate가 참이 아니었습니다.", ["OLD/NEW raw null state", "trigger WHEN predicate", "NULL-safe operator", "UPDATE OF firing 여부"], "engine의 NULL-safe distinct comparison 또는 명시적 null transition 조건을 사용합니다.", "null→null/null→value/value→null/value→value fixtures를 operation matrix에 둡니다.")],
    expertNotes: ["audit에는 raw row dump보다 operation·field allowlist·presence·reason을 명시합니다.", "pseudorecord는 일반 row variable이 아니므로 지원되지 않는 assignment·parameter passing을 공식 문서로 확인합니다."],
  },
  {
    id: "multirow-row-statement-semantics",
    title: "multi-row DML에서 row trigger 횟수와 statement-level 집계를 분리합니다",
    lead: "한 UPDATE가 천 rows를 바꾸면 row trigger가 천 번 실행될 수 있어 기능적으로 맞아도 N+1 writes·locks·log volume이 폭발할 수 있습니다.",
    explanations: [
      "affected rows N, row trigger firings N, statement trigger firings 1이라는 기대를 엔진 기능과 비교합니다. SQLite와 MySQL의 row trigger를 Oracle compound/statement trigger처럼 설명하지 않습니다.",
      "row trigger에서 매번 summary를 조회·갱신하면 같은 index/pages를 반복 잠그고 hot row contention을 만듭니다. set-based statement transition tables나 compound trigger state가 필요하면 지원 엔진에서 사용하고, 없으면 별도 outbox/reconciliation을 검토합니다.",
      "row 처리 순서는 business order가 아닙니다. 여러 rows의 audit sequence나 balance calculation이 물리 처리 순서에 의존하지 않게 stable key와 set invariant로 설계합니다.",
      "bulk loader, replication apply, partition exchange, cascade와 MERGE가 trigger를 발화하는지 matrix를 실행합니다. maintenance가 trigger를 끄는 경우 disabled window의 reconciliation owner와 SLA가 필수입니다.",
      "multi-row acceptance는 base affected count, trigger event count, distinct base keys, duplicates, downstream aggregate checksum과 latency/log bytes를 함께 측정합니다.",
    ],
    concepts: [
      c("row firing", "한 affected row마다 trigger body가 실행되는 의미입니다.", ["0-row DML에는 실행되지 않습니다.", "순서를 보장하지 않습니다."]),
      c("statement firing", "한 DML statement 전체에 대해 trigger section이 한 번 실행되는 의미입니다.", ["row image 접근 방식이 다릅니다.", "모든 엔진이 지원하지 않습니다."]),
      c("transition set", "statement가 바꾼 OLD/NEW rows 전체를 set으로 다루는 기능 또는 설계입니다.", ["bulk aggregate에 유리합니다.", "vendor syntax를 확인합니다."]),
    ],
    codeExamples: [py("db12-multirow-firing", "한 UPDATE의 row trigger firing 수", "db12_multirow.py", "세 rows를 한 statement로 갱신하고 affected rows와 per-row audit를 reconciliation합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item(id INTEGER PRIMARY KEY, qty INTEGER NOT NULL)")
db.execute("CREATE TABLE audit(item_id INTEGER, old_qty INTEGER, new_qty INTEGER)")
db.executemany("INSERT INTO item VALUES(?, ?)", [(1, 1), (2, 2), (3, 3)])
db.execute("""
CREATE TRIGGER item_qty_au AFTER UPDATE OF qty ON item
WHEN NEW.qty <> OLD.qty
BEGIN
  INSERT INTO audit VALUES(NEW.id, OLD.qty, NEW.qty);
END
""")
cursor = db.execute("UPDATE item SET qty=qty+1 WHERE id<=3")
rows = db.execute("SELECT item_id, old_qty, new_qty FROM audit ORDER BY item_id").fetchall()
print("affected=" + str(cursor.rowcount))
print("events=" + str(len(rows)))
print("ids=" + ",".join(str(row[0]) for row in rows))
print("old-sum=" + str(sum(row[1] for row in rows)))
print("new-sum=" + str(sum(row[2] for row in rows)))`, "affected=3\nevents=3\nids=1,2,3\nold-sum=6\nnew-sum=9", ["local-0205", "sqlite-trigger", "mysql-trigger-syntax", "oracle-dml-triggers", "postgres-create-trigger"])],
    diagnostics: [d("bulk UPDATE 뒤 latency와 redo/binlog가 rows 수보다 훨씬 크게 증가합니다.", "row trigger가 각 row마다 additional queries/writes를 수행합니다.", ["affected/firing counts", "trigger statement counts", "hot locks/waits", "log/temp/latency per row"], "set-based transition/compound 처리나 minimal outbox insert로 바꾸고 비동기 aggregate를 reconciliation합니다.", "1/100/10000-row scale test와 per-row side-effect budget을 둡니다.")],
    expertNotes: ["row order를 사용해 sequence-dependent 결과를 만들지 말고 set invariant로 검산합니다.", "statement-level 기능이 없는 엔진에서는 기능을 흉내 내기보다 요구를 재배치하는 편이 안전할 수 있습니다."],
  },
  {
    id: "validation-derivation-audit-boundary",
    title: "constraint·generated column·trigger·service 중 invariant owner를 하나로 정합니다",
    lead: "트리거로 모든 규칙을 구현할 수 있다는 사실은 모든 규칙을 트리거에 넣어야 한다는 뜻이 아닙니다.",
    explanations: [
      "같은 row의 단순 도메인 규칙은 NOT NULL·CHECK·generated column을 우선합니다. 관계 존재는 FK, uniqueness는 UNIQUE가 catalog·optimizer·도구에 더 잘 드러납니다.",
      "cross-row/table invariant는 isolation과 concurrency를 고려해야 합니다. trigger SELECT로 검사해도 phantoms/lost update를 막지 못할 수 있어 constraint, serialization, explicit locking 또는 single-writer boundary를 검토합니다.",
      "감사 trigger는 누가·왜 바꿨는지 자동으로 알지 못합니다. DB principal이 connection pool 하나라면 actor/request reason을 verified session context로 전달하되 spoofing·pool leakage를 막습니다.",
      "파생 summary를 sync trigger로 유지하면 write amplification과 repair가 어려워집니다. 즉시 일관성이 정말 필요한지 결정하고 outbox+idempotent projection+reconciliation을 대안으로 비교합니다.",
      "오류는 stable code와 safe message로 application에 전달합니다. raw row values, SQL text와 내부 object 이름을 사용자에게 노출하지 않고 로그에도 최소 metadata만 남깁니다.",
    ],
    concepts: [
      c("invariant owner", "한 business rule을 최종적으로 강제하고 오류를 정의하는 단일 계층입니다.", ["중복 검증은 UX용과 enforcement를 구분합니다.", "catalog-visible constraint를 우선합니다."]),
      c("audit context", "actor·request·reason·source 같은 change 해석 metadata입니다.", ["connection pool에서 reset합니다.", "application input을 무조건 신뢰하지 않습니다."]),
      c("derived side effect", "base write에서 계산되어 summary·history·notification 등에 추가되는 변경입니다.", ["sync/async consistency를 명시합니다.", "rebuild와 reconciliation이 필요합니다."]),
    ],
    diagnostics: [d("동시 요청 두 개가 trigger 검사를 모두 통과해 합계 제한을 깨뜨립니다.", "검사 SELECT와 writes가 필요한 predicate/range를 직렬화하지 못했습니다.", ["isolation level", "predicate/index locks", "unique/exclusion 가능성", "concurrent schedule"], "declarative constraint 또는 올바른 lock/serializable single-writer transaction으로 invariant를 강제합니다.", "barrier를 둔 two-session race test에서 exactly-one 또는 bounded result를 검증합니다.")],
    expertNotes: ["트리거는 constraint의 대체 문법이 아니라 constraint로 표현하기 어려운 좁은 자동 반응에 사용합니다.", "audit actor를 connection-local context로 전달하면 pool checkout/checkin마다 set/reset/readback을 검증합니다."],
  },
  {
    id: "cascade-chain-recursion-order",
    title: "cascade·trigger chain·recursion을 dependency graph와 종료 조건으로 통제합니다",
    lead: "한 trigger가 다른 table을 바꾸고 그 table trigger가 다시 실행되면 한 줄 DML이 보이지 않는 graph traversal이 됩니다.",
    explanations: [
      "base DML→foreign-key action→trigger writes→다음 triggers를 directed graph로 그립니다. edge마다 event/timing, max rows, lock order와 termination invariant를 기록합니다.",
      "recursive trigger 설정과 자기 table update 허용은 엔진·설정별로 다릅니다. disabled라고 가정하지 말고 actual session/database setting을 catalog와 negative fixture로 확인합니다.",
      "동일 timing의 여러 triggers 순서는 명시 기능이 없으면 의존하지 않습니다. Oracle FOLLOWS/PRECEDES 같은 기능도 edition/type restrictions가 있으므로 가능하면 하나의 owner 또는 독립 commutative effects로 만듭니다.",
      "FK cascade와 custom trigger cascade를 겹치면 중복 변경·audit·deadlock이 생깁니다. referential action owner를 하나로 정하고 child count·visited keys·depth를 예산화합니다.",
      "chain에서 오류가 나면 원래 statement까지 rollback되는지, autonomous/remote work처럼 별도 commit 경계가 있는지 확인합니다. 외부 network call은 trigger body에서 금지합니다.",
    ],
    concepts: [
      c("trigger chain", "한 trigger side effect가 다른 trigger event를 발생시키는 dependency 경로입니다.", ["깊이와 fan-out을 제한합니다.", "transaction/lock owner를 추적합니다."]),
      c("recursive firing", "trigger가 직접 또는 간접적으로 같은 trigger/table event를 다시 발생시키는 상태입니다.", ["termination guard가 필요합니다.", "engine setting을 확인합니다."]),
      c("firing order", "같은 statement/timing에서 여러 trigger sections가 실행되는 상대 순서입니다.", ["비명시 순서에 의존하지 않습니다.", "독립 effects를 선호합니다."]),
    ],
    codeExamples: [py("db12-trigger-chain", "parent 변경에서 child·outbox·audit로 이어지는 chain", "db12_trigger_chain.py", "recursive trigger를 명시적으로 켜고 두 단계 side effects의 bounded counts를 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA recursive_triggers=ON")
db.execute("CREATE TABLE parent(id INTEGER PRIMARY KEY, status TEXT)")
db.execute("CREATE TABLE child(id INTEGER PRIMARY KEY, parent_id INTEGER, status TEXT)")
db.execute("CREATE TABLE outbox(parent_id INTEGER, event TEXT)")
db.execute("CREATE TABLE audit(child_id INTEGER, status TEXT)")
db.executescript("""
CREATE TRIGGER parent_au AFTER UPDATE OF status ON parent BEGIN
  UPDATE child SET status=NEW.status WHERE parent_id=NEW.id;
  INSERT INTO outbox VALUES(NEW.id, 'parent-status');
END;
CREATE TRIGGER child_au AFTER UPDATE OF status ON child BEGIN
  INSERT INTO audit VALUES(NEW.id, NEW.status);
END;
""")
db.execute("INSERT INTO parent VALUES(1, 'open')")
db.executemany("INSERT INTO child VALUES(?, 1, 'open')", [(11,), (12,)])
db.execute("UPDATE parent SET status='closed' WHERE id=1")
print("parent=" + db.execute("SELECT status FROM parent").fetchone()[0])
print("children=" + str(db.execute("SELECT count(*) FROM child WHERE status='closed'").fetchone()[0]))
print("outbox=" + str(db.execute("SELECT count(*) FROM outbox").fetchone()[0]))
print("audit=" + str(db.execute("SELECT count(*) FROM audit").fetchone()[0]))
print("recursive=" + str(bool(db.execute("PRAGMA recursive_triggers").fetchone()[0])).lower())`, "parent=closed\nchildren=2\noutbox=1\naudit=2\nrecursive=true", ["sqlite-recursive-trigger", "sqlite-foreignkeys", "mysql-triggers", "oracle-trigger-order", "postgres-trigger-function"])],
    diagnostics: [d("한 row update가 반복 실행되다가 trigger recursion limit에 도달합니다.", "chain이 같은 state를 다시 쓰며 decreasing measure나 visited/version guard가 없습니다.", ["trigger dependency graph", "recursive setting/depth", "OLD/NEW no-op guard", "affected keys per depth"], "idempotent state-transition predicate와 hard depth/fan-out budget을 두고 cycle을 제거합니다.", "self/2-node cycle과 same-value update fixtures에서 bounded firing을 단언합니다.")],
    expertNotes: ["chain graph는 schema manifest 일부로 생성해 migration diff에서 새 edge를 review합니다.", "trigger recursion을 끄는 설정만으로 correctness를 만들지 말고 활성·비활성 양쪽을 negative test합니다."],
  },
  {
    id: "hidden-side-effects-cdc-counts",
    title: "affected rows·generated keys·CDC·replication에서 숨은 side effects를 드러냅니다",
    lead: "application이 본 rowcount 하나는 trigger가 바꾼 child·audit·summary rows와 downstream events의 전체 결과를 설명하지 않습니다.",
    explanations: [
      "driver affected rows가 matched rows인지 changed base rows인지 확인하고 trigger side-effect rows를 포함한다고 가정하지 않습니다. business outcome은 base key set과 downstream counters를 별도 readback합니다.",
      "generated key를 연속 숫자로 추측하면 trigger가 sequence/identity를 소비하거나 connector가 batch를 rewrite할 때 틀립니다. RETURNING/driver mapping과 client correlation을 사용합니다.",
      "row/statement based binary logging과 replication에서 trigger가 source와 replica 어디에서 실행되는지 공식 문서와 actual topology로 확인합니다. 이중 실행 또는 replica schema drift는 데이터 불일치를 만듭니다.",
      "CDC consumer가 base event와 trigger outbox/audit event를 모두 처리하면 duplicate business notification이 생길 수 있습니다. source event type, aggregate id, idempotency key와 ordering contract를 정의합니다.",
      "관측에는 trigger name/version, base operation/count, side-effect table별 bounded count, duration/error와 transaction id를 남기되 OLD/NEW raw values는 기본적으로 기록하지 않습니다.",
    ],
    concepts: [
      c("affected-row ambiguity", "driver가 보고한 count와 trigger를 포함한 전체 business 변경 집합이 다른 상태입니다.", ["matched/changed 설정도 봅니다.", "readback invariant를 둡니다."]),
      c("CDC duplication", "하나의 business change가 base와 derived events 또는 재실행으로 여러 번 전달되는 현상입니다.", ["stable event identity를 둡니다.", "consumer를 idempotent하게 합니다."]),
      c("trigger telemetry", "실행 version·count·latency·error·transaction correlation을 값 노출 없이 측정하는 신호입니다.", ["cardinality를 제한합니다.", "PII row image를 제외합니다."]),
    ],
    diagnostics: [d("replica에서 audit rows가 두 배가 됩니다.", "source에서 기록된 trigger side effect가 replicated된 뒤 replica trigger/consumer가 다시 만들었습니다.", ["binlog/redo mode", "replica trigger enablement", "CDC source events", "event id/count by transaction"], "topology별 trigger execution owner를 하나로 정하고 idempotency key와 schema parity를 적용합니다.", "source→replica integration에서 base/audit/outbox exactly-once-effect count를 검증합니다.")],
    expertNotes: ["rowcount는 protocol 신호이지 business transaction manifest가 아닙니다.", "trigger telemetry label에 row key나 raw SQL을 넣지 말고 bounded object/version/error code를 사용합니다."],
  },
  {
    id: "atomic-error-rollback",
    title: "트리거 오류가 원래 statement와 모든 side effects를 원자적으로 되돌리는지 증명합니다",
    lead: "AFTER trigger가 첫 row의 audit를 쓴 뒤 두 번째 row에서 실패하더라도 statement·transaction 정책에 따라 partial 흔적이 남지 않아야 합니다.",
    explanations: [
      "trigger는 보통 triggering statement의 transaction context에서 실행됩니다. body의 constraint/RAISE 오류가 statement만 취소하는지 전체 transaction을 abort하는지 API와 engine error semantics를 확인합니다.",
      "statement rollback 뒤 application이 exception을 잡고 계속 commit하면 이전 성공 statements는 남을 수 있습니다. transaction 전체 실패가 요구되면 rollback-only 정책과 service boundary를 명시합니다.",
      "autonomous transaction이나 remote side effect는 원래 rollback과 분리될 수 있습니다. 오류 감사 목적으로 autonomous commit을 쓰면 failed business write의 민감 payload를 영구화하지 않도록 최소 metadata와 별도 retention을 둡니다.",
      "trigger에서 network/message publish를 직접 호출하면 DB rollback으로 취소할 수 없습니다. 같은 transaction에 outbox row를 insert하고 commit된 row만 relay합니다.",
      "failure injection은 first/middle/last affected row, base constraint, trigger 첫/둘째 side effect와 timeout/cancel에서 base·audit·outbox·child의 post-state를 새 connection으로 검증합니다.",
    ],
    concepts: [
      c("statement atomicity", "한 SQL statement가 영향을 준 모든 rows와 trigger effects가 전부 적용되거나 전부 취소되는 성질입니다.", ["transaction 전체 rollback과 구분합니다.", "engine 오류 class를 확인합니다."]),
      c("rollback-only", "현재 transaction이 더 이상 commit될 수 없고 종료 시 rollback되어야 하는 상태입니다.", ["exception catch가 해제하지 않습니다.", "framework 규칙과 연결합니다."]),
      c("transactional outbox", "business rows와 publish 예정 event를 같은 local transaction에 기록하는 pattern입니다.", ["relay는 idempotent해야 합니다.", "commit visibility만 처리합니다."]),
    ],
    codeExamples: [py("db12-atomic-trigger-rollback", "두 번째 실패가 첫 side effect까지 되돌리는지 검증", "db12_atomic_rollback.py", "AFTER audit와 BEFORE validation을 결합해 transaction 실패 뒤 base와 audit가 원상태인지 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE stock(id INTEGER PRIMARY KEY, qty INTEGER CHECK(qty>=0))")
db.execute("CREATE TABLE audit(stock_id INTEGER, old_qty INTEGER, new_qty INTEGER)")
db.executemany("INSERT INTO stock VALUES(?, ?)", [(1, 5), (2, 1)])
db.executescript("""
CREATE TRIGGER stock_bu BEFORE UPDATE OF qty ON stock
WHEN NEW.qty < 0 BEGIN SELECT RAISE(ABORT, 'negative-qty'); END;
CREATE TRIGGER stock_au AFTER UPDATE OF qty ON stock
BEGIN INSERT INTO audit VALUES(NEW.id, OLD.qty, NEW.qty); END;
""")
db.commit()
try:
    db.execute("BEGIN")
    db.execute("UPDATE stock SET qty=qty-2 WHERE id=1")
    db.execute("UPDATE stock SET qty=qty-2 WHERE id=2")
    db.commit()
except sqlite3.IntegrityError as error:
    print("rejected=" + str(error))
    db.rollback()
rows = db.execute("SELECT id, qty FROM stock ORDER BY id").fetchall()
print("values=" + ",".join(f"{row[0]}:{row[1]}" for row in rows))
print("audit-count=" + str(db.execute("SELECT count(*) FROM audit").fetchone()[0]))
print("atomic=true")`, "rejected=negative-qty\nvalues=1:5,2:1\naudit-count=0\natomic=true", ["sqlite-trigger", "sqlite-transaction", "mysql-stored-logging", "oracle-trigger-restrictions"])],
    diagnostics: [d("trigger 오류를 잡은 뒤 commit했더니 transaction의 앞선 변경은 남았습니다.", "statement 실패와 전체 transaction rollback을 같은 것으로 가정하고 rollback-only/explicit rollback을 하지 않았습니다.", ["error class와 transaction state", "앞선 statements", "framework rollback rule", "new-connection post-state"], "service 단위 실패면 exception을 transaction boundary 밖으로 전파하거나 명시 rollback-only 후 종료합니다.", "각 failure point에서 전체 business manifest가 before state인지 검증합니다.")],
    expertNotes: ["trigger의 RAISE 문구를 public API 전체로 노출하지 말고 stable domain error로 translate합니다.", "autonomous error log는 원자성을 깨는 의도적 예외이므로 payload 최소화와 별도 reconciliation이 필요합니다."],
  },
  {
    id: "trigger-security-privileges",
    title: "definer·invoker 권한과 session context를 privilege escalation 관점에서 검토합니다",
    lead: "낮은 권한 사용자의 DML이 높은 권한 trigger body를 실행할 수 있으므로 trigger owner와 직접 grants는 보안 경계입니다.",
    explanations: [
      "MySQL DEFINER와 Oracle trigger owner가 어떤 권한으로 body object에 접근하는지 확인합니다. broad owner, orphan definer와 CREATE ANY TRIGGER 같은 시스템 권한을 application 계정에 주지 않습니다.",
      "dynamic SQL, object name과 session context를 trigger에서 조립하면 injection·confused deputy가 됩니다. trigger body는 정적 allow-listed objects와 bind values를 사용하고 untrusted text를 SQL로 해석하지 않습니다.",
      "audit actor를 application-provided header 하나로 믿지 않습니다. authenticated principal에서 server가 생성한 context를 connection에 설정하고 trigger가 allow-listed context만 읽으며 pool 반환 때 reset합니다.",
      "trigger가 보안 row를 복사할 때 source table보다 약한 grants·retention을 가진 audit/outbox table을 만들지 않습니다. column-level encryption, masking, support access와 erasure/legal hold를 함께 설계합니다.",
      "disable/alter/drop trigger privileges는 data integrity를 우회할 수 있습니다. migration role을 분리하고 catalog DDL audit, two-person approval와 post-deploy negative DML을 둡니다.",
    ],
    concepts: [
      c("trigger execution context", "trigger body가 object에 접근할 때 적용되는 owner/definer/invoker 권한 집합입니다.", ["dialect별로 다릅니다.", "direct grants 요구를 확인합니다."]),
      c("confused deputy", "높은 권한 trigger가 낮은 권한 caller의 입력을 대신 실행해 권한을 오용하는 상태입니다.", ["dynamic identifiers를 금지합니다.", "scope를 재검증합니다."]),
      c("integrity administration", "trigger DDL을 생성·교체·disable할 수 있는 권한과 감사 절차입니다.", ["runtime DML role과 분리합니다.", "catalog drift를 감시합니다."]),
    ],
    diagnostics: [d("일반 application 계정이 trigger를 바꿔 audit를 우회할 수 있습니다.", "runtime role에 CREATE/ALTER/DROP TRIGGER 또는 broad schema privilege가 부여됐습니다.", ["effective grants/roles", "trigger owner/definer", "DDL audit", "break-glass history"], "runtime DML과 migration DDL roles를 분리하고 최소 direct grants·승인된 deployment만 허용합니다.", "권한 negative tests와 unauthorized ALTER/DISABLE alert를 운영합니다.")],
    expertNotes: ["trigger가 권한을 상속하는 방식은 엔진별 공식 문서와 실제 계정 matrix로 검증합니다.", "감사 table은 원본보다 더 민감한 before/after history가 될 수 있어 더 강한 접근·retention이 필요합니다."],
  },
  {
    id: "trigger-deployment-version-drift",
    title: "트리거를 versioned schema object로 배포하고 catalog·행동을 함께 readback합니다",
    lead: "CREATE 문이 성공해도 trigger가 invalid·disabled이거나 old/new application과 비호환이면 쓰기 전체를 막거나 조용히 audit를 누락합니다.",
    explanations: [
      "manifest에는 name, target, event, timing, granularity, enabled/valid state, owner/security mode, normalized definition hash와 dependencies를 둡니다. source file만 아니라 live catalog를 비교합니다.",
      "가능한 엔진에서는 disabled/invalid 상태로 compile 검증 후 enable하고, old/new columns가 공존하는 expand-contract 기간을 거칩니다. OR REPLACE·DROP/CREATE의 grants/order/implicit commit 차이를 확인합니다.",
      "trigger code와 target schema를 한 migration transaction으로 바꿀 수 있는지 dialect DDL semantics를 확인합니다. 불가능하면 compatibility-first 단계, writer drain 또는 feature flag와 forward repair를 설계합니다.",
      "backfill이 trigger를 발화하면 audit 폭증·double projection이 생길 수 있습니다. 우회가 필요하면 승인된 maintenance context와 missed-effect reconciliation을 사용하고 global disable window를 최소화합니다.",
      "canary synthetic DML에서 insert/update/delete, multirow, NULL, constraint failure와 chain을 실행하고 base/side-effect catalog·rows를 readback한 뒤 traffic을 전환합니다.",
    ],
    concepts: [
      c("trigger manifest", "live trigger의 identity·definition·state·owner·dependencies를 선언한 배포 기준입니다.", ["definition hash를 포함합니다.", "행동 fixtures와 연결합니다."]),
      c("expand-contract trigger", "old/new application과 schema가 공존하도록 additive한 trigger version을 먼저 배포하고 후에 제거하는 전략입니다.", ["dual-write 중복을 검증합니다.", "rollback window를 둡니다."]),
      c("catalog readback", "배포 후 DB metadata에서 실제 enabled/valid/definition/owner를 다시 확인하는 절차입니다.", ["migration 성공 로그를 대체합니다.", "replicas도 확인합니다."]),
    ],
    codeExamples: [py("db12-trigger-deployment", "실패한 DDL 전환 rollback과 version catalog readback", "db12_trigger_deploy.py", "SQLite transactional DDL harness로 v1 보존과 v2 atomic 전환을 검증하되 다른 엔진에 일반화하지 않습니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item(id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE audit(version TEXT, item_id INTEGER)")
db.execute("CREATE TRIGGER item_audit_v1 AFTER INSERT ON item BEGIN INSERT INTO audit VALUES('v1', NEW.id); END")
db.commit()
try:
    db.execute("BEGIN")
    db.execute("DROP TRIGGER item_audit_v1")
    db.execute("CREATE TRIGGER item_audit_v2 AFTER INSERT ON item BEGIN INSERT INTO audit VALUES('v2', NEW.id); END")
    raise RuntimeError("failed-readback")
except RuntimeError:
    db.rollback()
failed_names = [row[0] for row in db.execute("SELECT name FROM sqlite_schema WHERE type='trigger' ORDER BY name")]
db.execute("BEGIN")
db.execute("DROP TRIGGER item_audit_v1")
db.execute("CREATE TRIGGER item_audit_v2 AFTER INSERT ON item BEGIN INSERT INTO audit VALUES('v2', NEW.id); END")
db.commit()
db.execute("INSERT INTO item VALUES(1)")
deployed_names = [row[0] for row in db.execute("SELECT name FROM sqlite_schema WHERE type='trigger' ORDER BY name")]
print("after-failed=" + ",".join(failed_names))
print("after-deploy=" + ",".join(deployed_names))
print("audit-version=" + db.execute("SELECT version FROM audit").fetchone()[0])
print("inventory-count=" + str(len(deployed_names)))`, "after-failed=item_audit_v1\nafter-deploy=item_audit_v2\naudit-version=v2\ninventory-count=1", ["sqlite-transaction", "mysql-trigger-metadata", "oracle-create-trigger", "oracle-trigger-restrictions"])],
    diagnostics: [d("배포 직후 모든 write가 trigger compile/runtime 오류로 실패합니다.", "DDL 성공만 확인하고 valid/enabled state와 dependency 권한을 readback하지 않았습니다.", ["catalog status/errors", "owner direct grants", "target columns/types", "canary DML rollback"], "traffic 전 disabled compile/readback과 compatibility canary를 수행하고 승인된 old definition으로 즉시 복구합니다.", "migration CI에 catalog manifest diff와 old/new app DML matrix를 둡니다.")],
    expertNotes: ["SQLite transactional DDL 결과를 Oracle/MySQL implicit commit·invalid object semantics로 일반화하지 않습니다.", "trigger definition hash만 같아도 session settings·referenced routines/grants가 달라질 수 있어 dependency manifest가 필요합니다."],
  },
  {
    id: "trigger-observability-testing-governance",
    title: "synthetic matrix·성능 예산·reconciliation·runbook으로 트리거 운영을 닫습니다",
    lead: "트리거는 application call graph에 드러나지 않으므로 catalog inventory, adversarial DML과 결과 reconciliation이 문서보다 더 중요한 운영 증거입니다.",
    explanations: [
      "테스트 matrix는 operation×0/1/N rows×NULL transitions×constraint success/failure×cascade/recursion×bulk/replication path를 포함합니다. base와 모든 side-effect tables의 expected keys/count/checksum을 고정합니다.",
      "성능은 trigger 없는 baseline과 p50/p95/p99, statements per row, lock waits, redo/binlog, temp와 hot-key contention을 비교합니다. trigger time이 DB statement latency에 포함되는지 관측 도구 semantics도 확인합니다.",
      "nightly reconciliation은 base business events와 audit/outbox/summary의 missing·duplicate·orphan counts를 bounded window/watermark로 비교합니다. auto-repair는 idempotent하고 원본보다 더 큰 손상을 만들지 않게 dry-run manifest를 냅니다.",
      "장애 runbook은 offending trigger/version 식별, writer 영향 차단, safe disable 여부, queue/backlog, forward repair/backfill, replica parity와 re-enable criteria를 포함합니다. disable을 즉시 해결책으로 쓰기 전에 누락 effects를 계산합니다.",
      "교육 harness는 SQLite의 작은 deterministic row trigger 의미만 증명합니다. release gate는 MySQL 8.4·Oracle 26ai에서 privileges, order, compound/statement behavior, binary logging, invalidation과 load를 실행합니다.",
    ],
    concepts: [
      c("behavioral manifest", "각 DML fixture가 만들 base·side-effect keys/counts/errors를 명시한 executable 계약입니다.", ["catalog manifest와 짝을 이룹니다.", "failure post-state를 포함합니다."]),
      c("trigger reconciliation", "base change population과 derived audit/outbox/summary population의 누락·중복·orphan을 비교하는 과정입니다.", ["watermark를 사용합니다.", "repair를 idempotent하게 합니다."]),
      c("disable debt", "trigger를 끈 기간 누락된 side effects와 integrity 검증을 나중에 복구해야 하는 의무입니다.", ["window와 owner를 기록합니다.", "재활성 전 처리합니다."]),
    ],
    diagnostics: [d("trigger를 disable해 latency는 회복했지만 audit/outbox가 영구 누락됩니다.", "emergency action에 disable window manifest와 backfill/reconciliation owner가 없었습니다.", ["disable/enable timestamps", "base keys changed", "downstream watermark", "repair idempotency/status"], "affected key manifest를 만들고 idempotent repair→reconciliation→re-enable 순서로 복구합니다.", "runbook drill에서 disable debt count가 0이 될 때까지 gate를 유지합니다.")],
    expertNotes: ["운영 dashboard는 raw OLD/NEW values보다 trigger version별 calls/errors/duration/fan-out과 reconciliation gaps를 표시합니다.", "trigger 제거도 consumer가 없다는 catalog 증거와 observation window 뒤에 수행하는 schema retirement입니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0205", repository: "dbstudy", path: "02_05.sql", usedFor: ["AFTER row-trigger progression", "OLD/NEW occurrence audit", "trigger gap analysis"], evidence: "read-only 구조 감사에서 51 logical lines, trigger3, AFTER3, FOR EACH ROW3, OLD6, NEW3을 확인했으며 sample literals와 원문 query는 복사하지 않았습니다." },
  { id: "sqlite-trigger", repository: "SQLite Documentation", path: "CREATE TRIGGER", publicUrl: "https://www.sqlite.org/lang_createtrigger.html", usedFor: ["OLD/NEW, WHEN, RAISE and exact row-trigger harnesses"], evidence: "SQLite 공식 trigger 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["atomic rollback and transactional DDL laboratory"], evidence: "SQLite 공식 transaction 문서입니다." },
  { id: "sqlite-foreignkeys", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["cascade ownership and action ordering boundary"], evidence: "SQLite 공식 foreign-key 문서입니다." },
  { id: "sqlite-recursive-trigger", repository: "SQLite Documentation", path: "PRAGMA recursive_triggers", publicUrl: "https://www.sqlite.org/pragma.html#pragma_recursive_triggers", usedFor: ["recursive trigger setting and chain harness"], evidence: "SQLite 공식 PRAGMA 문서입니다." },
  { id: "mysql-create-trigger", repository: "MySQL 8.4 Reference Manual", path: "CREATE TRIGGER", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-trigger.html", usedFor: ["MySQL timing, event, order and definer semantics"], evidence: "MySQL 공식 CREATE TRIGGER 문서입니다." },
  { id: "mysql-trigger-syntax", repository: "MySQL 8.4 Reference Manual", path: "Trigger Syntax and Examples", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/trigger-syntax.html", usedFor: ["OLD/NEW and per-row multirow semantics"], evidence: "MySQL 공식 trigger syntax 문서입니다." },
  { id: "mysql-triggers", repository: "MySQL 8.4 Reference Manual", path: "Using Triggers", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/triggers.html", usedFor: ["trigger lifecycle and chain portability"], evidence: "MySQL 공식 trigger overview입니다." },
  { id: "mysql-trigger-metadata", repository: "MySQL 8.4 Reference Manual", path: "INFORMATION_SCHEMA TRIGGERS", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/information-schema-triggers-table.html", usedFor: ["catalog readback and drift manifest"], evidence: "MySQL 공식 trigger metadata 문서입니다." },
  { id: "mysql-stored-logging", repository: "MySQL 8.4 Reference Manual", path: "Binary Logging of Stored Programs", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/stored-programs-logging.html", usedFor: ["binary logging, replication and trigger side effects"], evidence: "MySQL 공식 stored-program logging 문서입니다." },
  { id: "oracle-create-trigger", repository: "Oracle AI Database 26ai PL/SQL Language Reference", path: "CREATE TRIGGER Statement", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/CREATE-TRIGGER-statement.html", usedFor: ["Oracle timing, row/statement/compound, privileges and deployment"], evidence: "Oracle 공식 CREATE TRIGGER 문서입니다." },
  { id: "oracle-dml-triggers", repository: "Oracle AI Database 26ai PL/SQL Language Reference", path: "DML Triggers", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/dml-triggers.html", usedFor: ["row/statement/compound trigger semantics"], evidence: "Oracle 공식 DML trigger 문서입니다." },
  { id: "oracle-trigger-restrictions", repository: "Oracle AI Database 26ai PL/SQL Language Reference", path: "Trigger Restrictions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/trigger-restrictions.html", usedFor: ["transaction-control, mutating-table and body restrictions"], evidence: "Oracle 공식 trigger restrictions 문서입니다." },
  { id: "oracle-trigger-order", repository: "Oracle AI Database 26ai PL/SQL Language Reference", path: "Order in Which Triggers Fire", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/order-which-triggers-fire.html", usedFor: ["firing order and compound-trigger guidance"], evidence: "Oracle 공식 trigger-order 문서입니다." },
  { id: "postgres-create-trigger", repository: "PostgreSQL Documentation", path: "CREATE TRIGGER", publicUrl: "https://www.postgresql.org/docs/current/sql-createtrigger.html", usedFor: ["row/statement, transition relations and trigger order comparison"], evidence: "PostgreSQL 공식 CREATE TRIGGER 문서입니다." },
  { id: "postgres-trigger-function", repository: "PostgreSQL Documentation", path: "PL/pgSQL Trigger Functions", publicUrl: "https://www.postgresql.org/docs/current/plpgsql-trigger.html", usedFor: ["OLD/NEW operation variables and return behavior"], evidence: "PostgreSQL 공식 trigger-function 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-12-trigger-old-new", slug: "db-12-trigger-old-new", courseId: "database", moduleId: "db-programmability-performance", order: 4,
  title: "트리거의 OLD·NEW와 연쇄 부작용", subtitle: "발화 event에서 OLD·NEW·multi-row·chain·rollback·security·deployment까지 숨은 write를 설명 가능한 계약으로 만듭니다.", level: "고급", estimatedMinutes: 900,
  coreQuestion: "보이지 않는 trigger 실행이 어떤 row image를 읽고 무엇을 얼마나 바꾸며, 오류·권한·배포·replication 상황에서도 원래 DML과 같은 원자적 계약을 지킨다고 어떻게 증명할까요?",
  summary: "dbstudy 02_05.sql을 read-only로 구조 감사해 AFTER row trigger3·OLD6·NEW3의 progression만 provenance로 사용합니다. event/timing/granularity, operation별 OLD·NEW, multi-row firing, invariant ownership, cascade/recursion/order, affected rows·CDC, atomic rollback, definer privilege, versioned deployment와 reconciliation/runbook을 초급에서 운영 전문가까지 연결합니다. 다섯 exact Python/SQLite examples는 OLD/NEW lifecycle, multi-row counts, trigger chain, failure rollback과 transactional DDL catalog readback을 실행하며 MySQL 8.4·Oracle 26ai 차이는 공식 matrix로 분리합니다.",
  objectives: ["trigger event·timing·row/statement granularity를 엔진별로 구분한다.", "INSERT·UPDATE·DELETE에서 OLD·NEW와 NULL transition을 정확히 사용한다.", "multi-row firing·cascade·recursion·order의 fan-out과 종료를 검증한다.", "constraint/service/outbox와 trigger 사이 invariant owner를 선택한다.", "trigger 오류가 base·audit·child·outbox를 원자적으로 rollback하는지 증명한다.", "definer privilege·audit privacy·CDC/replication 경계를 위협 모델링한다.", "catalog manifest·canary·reconciliation·disable-debt runbook으로 배포한다."],
  prerequisites: [{ title: "저장 함수의 반환값과 결정성", reason: "database stored code의 실행 컨텍스트, side effect와 deployment 경계를 trigger 자동 실행에 확장합니다.", sessionSlug: "db-11-stored-function" }, { title: "VIEW의 쓰기 경계", reason: "INSTEAD OF trigger가 view command를 어떻게 base DML로 mapping하는지 구분합니다.", sessionSlug: "db-09-view-abstraction" }],
  keywords: ["trigger", "OLD", "NEW", "BEFORE", "AFTER", "INSTEAD OF", "row trigger", "statement trigger", "cascade", "recursive trigger", "audit", "transactional outbox", "definer", "CDC", "rollback"], topics,
  lab: {
    title: "inventory·audit·outbox trigger를 원자적이고 배포 가능한 계약으로 재설계하기",
    scenario: "base item 변경이 audit와 outbox를 만들고 parent 상태가 children에 전파됩니다. multi-row update, NULL 전이, recursion, constraint failure, schema rollout과 replica apply가 존재합니다.",
    setup: ["원본 SQL은 read-only provenance로만 사용하고 synthetic opaque ids/status만 준비합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 SQLite exact harness를 준비합니다.", "trigger event/timing/granularity/owner/dependency/privilege manifest를 작성합니다.", "0/1/N rows, NULL transitions, chain/cycle, first/middle/last failure와 old/new application fixtures를 만듭니다."],
    steps: ["live catalog에서 enabled/valid triggers와 normalized definition/dependencies를 readback합니다.", "operation별 OLD/NEW presence와 NULL-safe changed fields를 검증합니다.", "multi-row base affected keys와 trigger firing/side-effect counts를 reconciliation합니다.", "constraint/generated/service/trigger/outbox 중 invariant owner를 기록합니다.", "cascade graph의 depth/fan-out/order/recursive setting과 termination을 검증합니다.", "base·audit·outbox·child·CDC/replica event counts를 transaction별 비교합니다.", "각 failure point에서 새 connection으로 atomic rollback을 확인합니다.", "runtime/migration role, owner direct grants와 audit privacy negative tests를 실행합니다.", "disabled compile→canary→catalog readback→traffic→replica parity 순으로 v2를 배포합니다.", "latency/log/lock budgets와 reconciliation gaps를 관측하고 rollback/repair drill을 수행합니다."],
    expectedResult: ["trigger inventory와 실행 graph가 event·timing·granularity·privilege까지 설명됩니다.", "OLD/NEW·NULL·multi-row·chain fixtures가 exact base/side-effect counts와 일치합니다.", "어느 failure point에서도 partial base/audit/outbox/child state가 남지 않습니다.", "MySQL·Oracle approved differences와 production plan/log/replication evidence가 기록됩니다.", "versioned deploy·disable debt·repair·reconciliation이 raw PII 없이 운영됩니다."],
    cleanup: ["isolated schemas·synthetic rows·triggers·audit/outbox를 dependency 역순으로 제거합니다.", "temporary grants/credentials와 exports를 revoke·삭제합니다.", "logs/CDC samples에 raw OLD/NEW values나 원본 sample literals가 없는지 확인합니다.", "production과 dbstudy 원본 파일/data는 변경하지 않습니다."],
    extensions: ["Oracle compound trigger로 statement aggregate와 mutating-table 회피를 비교합니다.", "PostgreSQL transition relations와 MySQL row-only 전략을 conformance합니다.", "online schema change tool의 capture triggers와 application triggers 충돌을 실험합니다.", "event sourcing·temporal table·native audit와 trigger history의 선택 기준을 작성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 base DML→OLD/NEW→side effects→commit/rollback 표를 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "operation별 OLD/NEW matrix를 적습니다.", "multi-row affected/events를 계산합니다.", "chain graph와 bounded counts를 그립니다.", "failed transaction의 base/audit post-state를 검증합니다.", "failed/deployed trigger inventory를 비교합니다."], hints: ["application SQL 한 줄이 아니라 catalog에서 시작하세요."], expectedOutcome: "trigger를 숨은 마법이 아니라 실행·권한·원자성 계약으로 설명합니다.", solutionOutline: ["inventory→event/image→fan-out→failure→readback 순서입니다."] },
    { difficulty: "응용", prompt: "02_05.sql의 trigger progression을 production audit+outbox 설계로 확장하세요.", requirements: ["원본 구조 계수 provenance만 사용합니다.", "event/timing/granularity와 NULL-safe changes를 정의합니다.", "multi-row/chain/recursion budgets를 둡니다.", "constraint/service/outbox owner를 선택합니다.", "rollback/CDC/replication tests를 둡니다.", "definer/grants/privacy를 검증합니다.", "versioned catalog manifest와 canary를 만듭니다.", "reconciliation/disable-debt runbook을 포함합니다."], hints: ["감사 row가 남는 것과 business transaction이 commit된 것은 같은 사실이어야 합니다."], expectedOutcome: "원자적이고 관측 가능하며 이식 차이를 정직하게 기록한 trigger package가 완성됩니다.", solutionOutline: ["audit→model→adversarial DML→vendor matrix→deploy→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 trigger governance 표준을 작성하세요.", requirements: ["허용 use cases와 constraint/service 대안을 정의합니다.", "OLD/NEW·timing·granularity rules를 둡니다.", "fan-out/recursion/order/latency/log budgets를 둡니다.", "atomicity/outbox/remote-call prohibition을 명시합니다.", "definer/grants/audit privacy/retention을 포함합니다.", "catalog/version/compatibility/rollback 절차를 둡니다.", "CDC/replica conformance와 reconciliation을 요구합니다.", "disable emergency와 debt closure criteria를 정의합니다."], hints: ["트리거를 추가한 이유뿐 아니라 제거·복구 방법도 같은 변경에 포함하세요."], expectedOutcome: "초급 row audit부터 운영 schema automation까지 일관된 review gate가 완성됩니다.", solutionOutline: ["justify→bound→secure→test→deploy→observe→reconcile→retire 순서입니다."] },
  ],
  nextSessions: ["db-13-transaction-acid"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_05.sql 51 logical lines/1,403 bytes를 read-only로 구조 감사해 trigger3·AFTER3·FOR EACH ROW3·OLD6·NEW3을 확인했습니다.", "원본 사람 이름·업무 값·sample literals·query 원문을 복사하지 않고 trigger progression과 명시적 gaps만 provenance로 사용했습니다.", "원본이 다루지 않는 multi-row budgets, recursion/order, atomic failure, definer security, deployment/CDC/reconciliation은 공식 SQLite·MySQL·Oracle·PostgreSQL 문서와 synthetic examples로 보강했습니다.", "SQLite exact harness는 MySQL 8.4의 DEFINER/binlog/row-only 모델과 Oracle 26ai의 statement/compound/mutating-table/invalid-object semantics를 대체하지 않습니다."] },
});

export default session;
