import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-7", explanation: "Python sqlite3와 synthetic opaque keys로 실제 commit/rollback 가능한 DB fixture를 만들고 host·credential 없이 transaction을 재현합니다." },
      { lines: "8-끝에서 5줄 전", explanation: "autocommit·BEGIN·SAVEPOINT·failure·COMMIT/ROLLBACK·idempotent retry를 실행해 Java Connection service 경계와 같은 invariant를 검증합니다." },
      { lines: "마지막 5줄", explanation: "durable count·balance·outcome만 exact 출력합니다. production Java/Spring/MySQL·Oracle behavior는 공식 API와 실제 integration에서 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite semantic harness는 JDBC driver autocommit/aborted state, Spring proxy rollback과 MySQL·Oracle durability를 대신하지 않습니다."] },
    experiments: [
      { change: "두 번째 write·commit 직전·commit 응답 직후에 각각 실패를 주입합니다.", prediction: "commit 전은 rollback, 응답 손실은 outcome unknown이므로 durable idempotency key 조회가 필요합니다.", result: "exception 문구가 아니라 새 connection의 canonical state로 판정합니다." },
      { change: "같은 request key를 동시에 두 번 보내고 첫 transaction을 deadlock victim으로 만듭니다.", prediction: "전체 unit은 retry되어도 business row와 outbox는 하나만 남아야 합니다.", result: "unique request key·same-transaction outbox·bounded retry를 함께 검증합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "connection-autocommit-unit",
    title: "Connection의 autoCommit을 확인하고 business unit 시작 전에 끕니다",
    lead: "JDBC Connection 기본 autoCommit이 true이면 각 statement가 독립 transaction으로 끝나 첫 성공을 뒤 실패가 되돌릴 수 없습니다.",
    explanations: [
      "transaction은 '한 요청'이나 '한 DAO method'가 아니라 함께 지켜야 할 invariant로 정합니다. parent+children, debit+ledger처럼 전부 성공/실패해야 하는 writes를 한 connection에 묶습니다.",
      "Connection.setAutoCommit(false)는 현재 connection의 이후 statements를 explicit commit/rollback boundary에 둡니다. true로 바꾸는 동작이 pending transaction을 commit할 수 있는지 JDBC/driver 규칙을 확인합니다.",
      "pool connection은 이전 borrower state를 reset할 수 있지만 transaction owner가 시작 시 getAutoCommit/effective isolation을 확인하고 종료 전에 outcome을 명시하는 것이 우선입니다.",
      "DDL의 implicit commit, stored routine 내부 transaction restrictions와 driver batch rewrite는 DBMS별 차이가 있습니다. DML 예제 결과를 schema migration atomicity로 일반화하지 않습니다.",
      "로컬 BoardServiceImpl.java는 56 logical lines에 active service methods3·mapper calls3이 있고 @Transactional·try/catch·commit/rollback은 없습니다. 현재 단일 mapper 호출을 결함으로 단정하지 않고 multi-write service로 확장할 때의 명시적 경계 gap으로 사용합니다.",
    ],
    concepts: [
      c("autoCommit", "각 SQL statement 완료를 자동 transaction 종료로 처리하는 Connection mode입니다.", ["pool/driver default를 readback합니다.", "manual unit 전에 false로 둡니다."]),
      c("atomic service unit", "하나의 business invariant를 만족시키기 위해 같은 connection/transaction에서 실행할 writes 집합입니다.", ["DAO 수와 다릅니다.", "외부 calls를 분리합니다."]),
      c("transaction owner", "autoCommit 변경·commit·rollback·restore·close를 책임지는 service/framework 경계입니다.", ["중첩 owner를 피합니다.", "한 completion path를 둡니다."]),
    ],
    codeExamples: [py("jdbc05-autocommit-gap", "autocommit partial write와 explicit rollback 비교", "jdbc05_autocommit.py", "같은 두 writes에서 autocommit은 parent를 남기고 manual transaction은 모두 되돌리는 차이를 실행합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:", isolation_level=None)
db.execute("CREATE TABLE header(id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE line(id INTEGER PRIMARY KEY, header_id INTEGER, qty INTEGER CHECK(qty>0))")
try:
    db.execute("INSERT INTO header VALUES(1)")
    db.execute("INSERT INTO line VALUES(10, 1, 0)")
except sqlite3.IntegrityError:
    pass
partial_headers = db.execute("SELECT count(*) FROM header").fetchone()[0]
db.execute("DELETE FROM header")
try:
    db.execute("BEGIN")
    db.execute("INSERT INTO header VALUES(2)")
    db.execute("INSERT INTO line VALUES(20, 2, 0)")
    db.execute("COMMIT")
except sqlite3.IntegrityError:
    db.execute("ROLLBACK")
print("autocommit-headers=" + str(partial_headers))
print("atomic-headers=" + str(db.execute("SELECT count(*) FROM header").fetchone()[0]))
print("atomic-lines=" + str(db.execute("SELECT count(*) FROM line").fetchone()[0]))
print("rollback-protected=true")`, "autocommit-headers=1\natomic-headers=0\natomic-lines=0\nrollback-protected=true", ["local-board-service", "jdk-connection", "sqlite-transaction", "python-sqlite3", "mysql-autocommit", "oracle-transactions", "postgres-transactions"])],
    diagnostics: [d("두 번째 mapper가 실패해도 첫 row가 남습니다.", "autoCommit true 또는 서로 다른 connections로 statements가 이미 독립 commit됐습니다.", ["connection identity", "getAutoCommit before writes", "commit timestamps", "mapper resource binding"], "service가 하나의 Connection을 소유해 autoCommit false로 두고 모든 mapper work를 같은 unit에 참여시킵니다.", "두 번째 write failure에서 새 connection으로 모든 related rows가 before state인지 검증합니다.")],
    expertNotes: ["setAutoCommit(false)는 transaction 설계의 시작일 뿐 connection 공유·outcome·cleanup까지 owner가 책임집니다.", "local source의 현재 단일 calls를 과장하지 않고 조합되는 순간 필요한 invariant와 failure test를 먼저 작성합니다."],
  },
  {
    id: "manual-commit-rollback-template",
    title: "commit·rollback·close를 성공/실패/cleanup 단계로 분리한 manual template을 만듭니다",
    lead: "catch에서 rollback하고 finally에서 close하는 고전 pattern도 rollback/close 예외가 primary failure를 덮지 않게 세밀하게 설계해야 합니다.",
    explanations: [
      "정상 path는 all writes·postconditions 뒤 commit, 실패 path는 transaction 전체 rollback, finally는 original autoCommit/state 복원과 close입니다. commit을 중간 DAO가 호출하지 않습니다.",
      "rollback 자체가 SQLException을 던질 수 있습니다. 원래 exception을 primary로 유지하고 rollback/close failures를 suppressed 또는 secure diagnostic으로 붙입니다.",
      "commit이 실패하면 rollback 가능 상태인지, DB가 commit point를 지났는지 error class별로 확인합니다. connection loss at commit은 rolled-back으로 단정하지 않습니다.",
      "try-with-resources는 Connection close를 보장하지만 transaction outcome을 자동 정하지 않습니다. catch에서 rollback 후 rethrow/translate하고 close가 pool에 dirty state를 반환하지 않게 합니다.",
      "affected rows, generated keys와 final state를 commit 전에 invariant로 검증합니다. 0-row optimistic conflict를 성공으로 commit하지 않습니다.",
    ],
    concepts: [
      c("completion protocol", "transaction owner가 success→commit, failure→rollback, always→restore/close를 수행하는 규칙입니다.", ["primary exception을 보존합니다.", "한 곳에서 종료합니다."]),
      c("rollback failure", "rollback 요청 자체가 실패해 transaction/connection 상태가 불확실한 사건입니다.", ["primary를 덮지 않습니다.", "connection을 evict합니다."]),
      c("pre-commit invariant", "commit 직전 affected rows·keys·counts가 business expectation과 일치하는지 확인하는 조건입니다.", ["0/duplicate를 거부합니다.", "trigger effects를 고려합니다."]),
    ],
    codeExamples: [py("jdbc05-service-transaction", "debit과 ledger의 all-or-nothing service", "jdbc05_service.py", "첫 실행은 ledger 전 failure로 rollback되고 두 번째만 두 writes를 commit하는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, balance INTEGER CHECK(balance>=0))")
db.execute("CREATE TABLE ledger(request_id INTEGER PRIMARY KEY, amount INTEGER)")
db.execute("INSERT INTO account VALUES(1, 100)")
db.commit()
def debit(request_id, amount, fail=False):
    try:
        db.execute("BEGIN")
        db.execute("UPDATE account SET balance=balance-? WHERE id=1", (amount,))
        if fail:
            raise RuntimeError("injected")
        db.execute("INSERT INTO ledger VALUES(?, ?)", (request_id, -amount))
        db.commit()
        return "committed"
    except Exception:
        db.rollback()
        return "rolled-back"
print("first=" + debit(1, 25, True))
print("balance-after-first=" + str(db.execute("SELECT balance FROM account").fetchone()[0]))
print("second=" + debit(2, 25))
print("balance-after-second=" + str(db.execute("SELECT balance FROM account").fetchone()[0]))
print("ledger=" + str(db.execute("SELECT count(*) FROM ledger").fetchone()[0]))`, "first=rolled-back\nbalance-after-first=100\nsecond=committed\nbalance-after-second=75\nledger=1", ["jdk-connection", "jdk-datasource", "jdk-sqlexception", "sqlite-transaction", "spring-transaction", "spring-programmatic", "spring-annotations", "spring-rollback", "spring-propagation", "mysql-commit", "oracle-commit"])],
    diagnostics: [d("rollback 중 발생한 SQLException이 원래 business exception을 덮습니다.", "catch/finally에서 새 rollback/close exception을 그대로 throw했습니다.", ["primary/cause/suppressed tree", "rollback attempt/result", "connection health", "transaction outcome"], "원래 error를 primary로 보존하고 rollback/close failure를 suppressed로 추가한 뒤 connection을 폐기합니다.", "body+rollback+close 동시 failure harness와 logging capture test를 둡니다.")],
    expertNotes: ["manual template은 boilerplate라서 한 번 틀리면 모든 DAO에 복제되므로 framework abstraction으로 진화할 기준을 둡니다.", "commit 직전 invariant read가 concurrency에 안전한지는 isolation/locks/constraints와 함께 검증합니다."],
  },
  {
    id: "savepoint-partial-rollback",
    title: "SAVEPOINT는 domain이 허용한 optional sub-operation에만 사용합니다",
    lead: "부분 rollback은 transaction을 작게 나누는 도구가 아니라 outer invariant는 유지하면서 명시적으로 실패 허용된 구간만 취소하는 도구입니다.",
    explanations: [
      "Connection.setSavepoint 뒤 rollback(savepoint)은 그 이후 changes를 취소하지만 transaction 전체를 끝내지 않습니다. releaseSavepoint 지원·locks·error state는 driver/DB별로 확인합니다.",
      "필수 parent와 optional metadata처럼 부분 성공 의미가 명확할 때 사용합니다. debit과 ledger처럼 함께 있어야 하는 writes를 savepoint로 갈라 commit하지 않습니다.",
      "nested service 호출이 savepoint를 소유하면 outer owner와 충돌할 수 있습니다. propagation/nested semantics를 문서화하고 savepoint name/collision을 framework에 맡깁니다.",
      "constraint error 뒤 savepoint rollback으로 회복 가능한지 DB별 차이가 있습니다. transaction-aborting errors·deadlock·connection loss는 전체 rollback과 fresh transaction retry가 필요합니다.",
      "batch partial success API는 accepted/rejected counts와 safe reason, source correlation을 반환합니다. raw input/PII를 error log에 복사하지 않습니다.",
    ],
    concepts: [
      c("Savepoint", "현재 transaction 안의 rollback marker를 나타내는 JDBC object입니다.", ["독립 transaction이 아닙니다.", "Connection owner가 관리합니다."]),
      c("partial success contract", "어떤 sub-operation 실패를 허용하고 무엇을 commit할지 domain이 정의한 결과입니다.", ["silent ignore가 아닙니다.", "consumer에게 상태를 노출합니다."]),
      c("recoverable statement error", "savepoint rollback 뒤 같은 transaction을 계속 사용할 수 있다고 지원 engine이 보장한 error 범주입니다.", ["vendor matrix가 필요합니다.", "unknown은 전체 rollback합니다."]),
    ],
    codeExamples: [py("jdbc05-savepoint", "optional tag만 되돌리고 core row commit", "jdbc05_savepoint.py", "invalid optional tag를 savepoint로 취소하고 core와 valid tag만 commit합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE record(id INTEGER PRIMARY KEY, state TEXT)")
db.execute("CREATE TABLE tag(id INTEGER PRIMARY KEY, record_id INTEGER, weight INTEGER CHECK(weight>0))")
db.execute("BEGIN")
db.execute("INSERT INTO record VALUES(1, 'accepted')")
db.execute("SAVEPOINT optional_tag")
try:
    db.execute("INSERT INTO tag VALUES(10, 1, 0)")
except sqlite3.IntegrityError:
    db.execute("ROLLBACK TO optional_tag")
    db.execute("RELEASE optional_tag")
    optional = "rejected"
db.execute("INSERT INTO tag VALUES(11, 1, 2)")
db.commit()
print("optional=" + optional)
print("records=" + str(db.execute("SELECT count(*) FROM record").fetchone()[0]))
print("tags=" + str(db.execute("SELECT count(*) FROM tag").fetchone()[0]))
print("tag-id=" + str(db.execute("SELECT id FROM tag").fetchone()[0]))
print("committed=true")`, "optional=rejected\nrecords=1\ntags=1\ntag-id=11\ncommitted=true", ["jdk-savepoint", "jdk-connection", "sqlite-transaction", "mysql-savepoint", "oracle-rollback", "postgres-transactions"])],
    diagnostics: [d("savepoint rollback 뒤 commit이 다시 실패합니다.", "해당 error가 전체 transaction을 aborted로 만들었거나 implicit commit으로 savepoint가 사라졌습니다.", ["vendor error/state", "savepoint validity", "transaction status", "DDL/routine boundary"], "회복 승인 error만 partial policy에 포함하고 나머지는 전체 rollback 후 새 transaction으로 재시도합니다.", "constraint/deadlock/timeout/connection-loss별 savepoint conformance를 실제 engine에서 실행합니다.")],
    expertNotes: ["savepoint는 외부 API/message side effect를 보상하지 않습니다.", "부분 성공이 downstream에 혼동을 주면 전체 rollback이 더 단순하고 안전한 계약입니다."],
  },
  {
    id: "service-layer-connection-propagation",
    title: "Service가 Connection을 소유하고 DAO는 commit하지 않는 계층 계약을 세웁니다",
    lead: "각 DAO가 자신만의 connection을 얻고 닫으면 service가 두 DAO 호출을 하나의 원자 transaction으로 묶을 수 없습니다.",
    explanations: [
      "manual design에서는 service가 DataSource에서 Connection을 얻고 transaction을 시작한 뒤 같은 Connection을 DAO methods에 전달하거나 transaction-aware context로 bind합니다.",
      "DAO는 SQL 실행·mapping과 affected rows를 반환하지만 commit/rollback/close를 하지 않습니다. connection 인자 방식은 명시적이지만 signatures가 오염되고 framework synchronization으로 진화할 수 있습니다.",
      "controller가 DAO 둘을 조합하면 HTTP/UI concern과 transaction policy가 섞입니다. service method가 business invariant, timeout, retry/idempotency와 exception translation을 소유합니다.",
      "로컬 BoardServiceImpl의 active methods는 현재 각 mapper call 중심입니다. 첨부·audit·outbox처럼 두 번째 write가 추가되는 변경에서 service transaction test를 동시에 추가합니다.",
      "async thread, executor와 remote service로 Connection을 전달하지 않습니다. JDBC Connection은 일반적으로 thread-confined lexical transaction에서만 사용하고 외부 work는 commit 후 outbox로 이어갑니다.",
    ],
    concepts: [
      c("connection propagation", "하나의 service transaction에 참여하는 DAOs가 같은 Connection/context를 사용하도록 전달하는 방식입니다.", ["manual 인자 또는 framework binding입니다.", "async를 넘지 않습니다."]),
      c("DAO transaction neutrality", "DAO가 transaction 시작/종료를 결정하지 않고 caller-owned Connection에서 SQL만 수행하는 계약입니다.", ["commit을 금지합니다.", "affected outcome을 반환합니다."]),
      c("service invariant", "service 종료 시 반드시 함께 만족해야 하는 여러 repository 상태 조건입니다.", ["pre/postconditions를 둡니다.", "failure injection으로 검증합니다."]),
    ],
    diagnostics: [d("Service rollback 뒤 첫 DAO table은 되돌아갔지만 두 번째는 남습니다.", "DAOs가 서로 다른 connections/autocommit 또는 내부 commit을 사용했습니다.", ["connection identity per DAO", "autoCommit/commit traces", "DataSource/proxy binding", "final related rows"], "service-owned 한 Connection을 명시 전달/bind하고 DAO 내부 transaction completion을 제거합니다.", "두 DAO 각각의 before/after failure point에서 all-or-nothing manifest를 test합니다.")],
    expertNotes: ["Connection을 ThreadLocal에 직접 숨기기보다 Spring transaction synchronization처럼 검증된 context owner로 진화합니다.", "한 service가 두 databases를 호출하면 same Connection local atomicity가 불가능하므로 outbox/saga/2PC 선택이 필요합니다."],
  },
  {
    id: "manual-vs-spring-rollback-rules",
    title: "manual SQLException 처리와 Spring @Transactional rollback rules의 차이를 이해합니다",
    lead: "manual transaction은 catch 경로가 outcome을 정하고 declarative transaction은 proxy가 밖으로 나온 exception과 rollback-only 상태를 해석합니다.",
    explanations: [
      "manual code는 checked SQLException을 catch해 rollback한 뒤 translate/rethrow합니다. exception을 삼키고 success/false를 반환하면 caller가 outcome을 오해할 수 있습니다.",
      "Spring 기본 declarative rollback은 일반적으로 RuntimeException/Error이며 checked exception은 rollbackFor 등 설정이 필요합니다. current framework default/global rule을 실제 version에서 확인합니다.",
      "@Transactional method 내부에서 error를 catch하면 proxy가 정상 반환으로 보아 commit할 수 있습니다. 회복 불가면 밖으로 throw하거나 rollback-only를 표시하고 response와 DB outcome을 맞춥니다.",
      "proxy self-invocation, wrong transaction manager, private method와 resource binding은 annotation 글자만으로 발견되지 않습니다. actual transaction active/name/connection을 integration test합니다.",
      "manual에서 declarative로 옮길 때 DAO가 여전히 setAutoCommit/commit하면 framework owner와 충돌합니다. completion ownership을 한 번에 이전합니다.",
    ],
    concepts: [
      c("exception escape", "transactional boundary 밖으로 실패가 전파되어 completion advice가 rollback을 결정할 수 있는 상태입니다.", ["catch/swallow를 주의합니다.", "domain translation은 cause를 보존합니다."]),
      c("rollback rule", "exception type/pattern에 따라 declarative transaction을 rollback-only로 표시하는 정책입니다.", ["checked/unchecked를 구분합니다.", "type-based를 선호합니다."]),
      c("ownership migration", "manual commit/rollback owner를 Spring transaction manager로 완전히 이전하는 refactoring입니다.", ["DAO completion을 제거합니다.", "behavioral tests를 유지합니다."]),
    ],
    diagnostics: [d("@Transactional service가 실패 응답을 줬지만 DB는 commit됩니다.", "checked exception을 삼켰거나 default rollback rule에 포함되지 않았고 rollback-only도 표시하지 않았습니다.", ["exception type/escape path", "rollbackFor rules", "transaction completion logs", "DB post-state"], "type-based rollback rule을 명시하고 실패를 proxy 밖으로 전파하거나 rollback-only 후 일관된 error를 반환합니다.", "checked/unchecked/caught/wrapped matrix에서 response와 DB outcome을 함께 test합니다.")],
    expertNotes: ["declarative transaction은 manual template을 숨기지만 exception/outcome contract를 없애지 않습니다.", "REQUIRES_NEW는 독립 commit이므로 outer rollback 뒤 남는 effect를 의도적으로 승인한 경우만 사용합니다."],
  },
  {
    id: "commit-unknown-idempotency",
    title: "commit acknowledgement loss를 outcome unknown과 idempotency 조회로 처리합니다",
    lead: "commit 호출에서 network가 끊기면 DB가 commit했을 수도 rollback했을 수도 있어 catch에서 무조건 rollback/retry할 수 없습니다.",
    explanations: [
      "client가 SQLException을 받은 시점과 DB commit point는 다를 수 있습니다. connection failure at commit을 failed가 아니라 unknown으로 분류하고 request/business key를 새 connection에서 조회합니다.",
      "idempotency key는 principal+operation scope에서 unique하고 payload fingerprint와 canonical response/outcome을 함께 저장합니다. 같은 key 다른 payload는 conflict입니다.",
      "request ledger와 business rows를 같은 local transaction에 쓰지 않으면 key만 남거나 business만 남는 partial state가 생깁니다. unique constraint를 최종 guard로 둡니다.",
      "retry는 fresh transaction에서 ledger를 먼저 read/insert하고 unique conflict 뒤 stored result를 반환합니다. generated id를 매 retry 새로 만들지 않습니다.",
      "unknown이 일정 시간 해소되지 않으면 in-progress/unknown status와 조회 endpoint를 제공합니다. 사용자에게 단순 실패로 알려 unsafe retry를 유도하지 않습니다.",
    ],
    concepts: [
      c("commit unknown", "commit 요청 뒤 client가 최종 DB outcome을 확인하지 못한 상태입니다.", ["blind retry를 금지합니다.", "durable key로 해소합니다."]),
      c("request ledger", "idempotency key·payload fingerprint·result/outcome을 DB에 unique하게 보존한 relation입니다.", ["business rows와 함께 commit합니다.", "retention을 정의합니다."]),
      c("canonical response", "duplicate/retry에도 같은 durable business result에서 재구성되는 안정된 응답입니다.", ["transient message를 저장하지 않습니다.", "authorization 후 반환합니다."]),
    ],
    codeExamples: [py("jdbc05-commit-unknown", "commit 후 acknowledgement loss를 DB로 해소", "jdbc05_commit_unknown.py", "temporary file DB에 commit한 뒤 timeout을 흉내 내고 새 connection이 request key를 조회합니다.", String.raw`import sqlite3
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as folder:
    path = Path(folder) / "manual.db"
    db = sqlite3.connect(path)
    db.execute("CREATE TABLE request(key TEXT PRIMARY KEY, result_id INTEGER, state TEXT)")
    db.commit()
    try:
        db.execute("BEGIN")
        db.execute("INSERT INTO request VALUES('req-1', 41, 'committed')")
        db.commit()
        raise TimeoutError("ack-lost")
    except TimeoutError:
        acknowledgement = "unknown"
    observer = sqlite3.connect(path)
    stored = observer.execute("SELECT result_id, state FROM request WHERE key='req-1'").fetchone()
    print("acknowledgement=" + acknowledgement)
    print("resolution=" + stored[1])
    print("result-id=" + str(stored[0]))
    print("rows=" + str(observer.execute("SELECT count(*) FROM request").fetchone()[0]))
    print("retry-needed=false")
    observer.close()
    db.close()`, "acknowledgement=unknown\nresolution=committed\nresult-id=41\nrows=1\nretry-needed=false", ["jdk-connection", "jdk-sqlexception", "sqlite-isolation", "python-sqlite3", "mysql-commit", "oracle-commit", "postgres-transactions"])],
    diagnostics: [d("commit SQLException 뒤 retry가 같은 업무를 두 번 만듭니다.", "outcome unknown을 rollback 확정으로 취급하고 stable request key 없이 새 generated id로 재실행했습니다.", ["request ledger/business row", "failure at commit timeline", "retry keys/payloads", "outbox/consumer effects"], "unknown status를 반환하고 durable key 조회 후 absent일 때만 같은 key로 fresh transaction을 실행합니다.", "commit-before/after acknowledgement loss와 delayed duplicate requests를 fault-injection합니다.")],
    expertNotes: ["rollback 호출이 성공해도 이미 commit된 transaction을 되돌리지 못하므로 unknown 판정은 durable evidence가 필요합니다.", "idempotency record TTL은 client/network retry horizon보다 길고 privacy/erasure policy와 일치해야 합니다."],
  },
  {
    id: "outbox-dual-write-boundary",
    title: "DB와 message/email/remote API의 dual write를 transactional outbox로 분리합니다",
    lead: "JDBC local transaction은 같은 database resource만 atomic하게 묶으며 broker publish나 HTTP call을 rollback할 수 없습니다.",
    explanations: [
      "DB commit 후 publish 전 crash는 missing event, publish 후 DB rollback은 ghost event를 만듭니다. 호출 순서를 바꾸는 것만으로 failure window를 제거하지 못합니다.",
      "business row와 outbox event intent를 같은 transaction에 insert합니다. relay는 committed unprocessed rows를 claim/publish하고 event id로 retry하며 consumer도 idempotent하게 처리합니다.",
      "outbox event id, aggregate id/version, schema version과 minimal facts를 둡니다. raw entity/PII/credential을 payload에 복제하지 않고 encryption/access/retention을 설계합니다.",
      "relay publish acknowledgement loss도 duplicate delivery를 만들 수 있습니다. exactly-once delivery를 주장하기보다 at-least-once+exactly-once effect를 inbox/unique transition으로 검증합니다.",
      "outbox backlog age, claim/publish retries, duplicate consumer outcomes와 business↔outbox↔published watermark reconciliation을 운영합니다.",
    ],
    concepts: [
      c("dual-write gap", "독립 resources 두 곳에 순차 write할 때 한쪽만 성공할 수 있는 crash window입니다.", ["순서로 제거되지 않습니다.", "outbox/2PC/saga를 선택합니다."]),
      c("transactional outbox", "business state와 publish intent를 같은 DB transaction에 기록하는 pattern입니다.", ["relay retry가 필요합니다.", "consumer idempotency를 둡니다."]),
      c("event reconciliation", "business/outbox/published/consumed populations을 watermark와 ids로 비교하는 절차입니다.", ["missing/duplicate를 구분합니다.", "repair를 idempotent하게 합니다."]),
    ],
    codeExamples: [py("jdbc05-outbox-idempotency", "service result와 outbox를 request key로 한 번만 생성", "jdbc05_outbox.py", "같은 request를 두 번 처리해 canonical result와 하나의 outbox만 남는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE request(key TEXT PRIMARY KEY, result_id INTEGER)")
db.execute("CREATE TABLE work(id INTEGER PRIMARY KEY, state TEXT)")
db.execute("CREATE TABLE outbox(event_id TEXT PRIMARY KEY, work_id INTEGER)")
db.commit()
def create_work(key, work_id):
    existing = db.execute("SELECT result_id FROM request WHERE key=?", (key,)).fetchone()
    if existing:
        return "duplicate:" + str(existing[0])
    try:
        db.execute("BEGIN")
        db.execute("INSERT INTO work VALUES(?, 'ready')", (work_id,))
        db.execute("INSERT INTO outbox VALUES(?, ?)", ("evt-" + key, work_id))
        db.execute("INSERT INTO request VALUES(?, ?)", (key, work_id))
        db.commit()
        return "created:" + str(work_id)
    except Exception:
        db.rollback()
        raise
print("first=" + create_work("r1", 7))
print("second=" + create_work("r1", 99))
print("work=" + str(db.execute("SELECT count(*) FROM work").fetchone()[0]))
print("outbox=" + str(db.execute("SELECT count(*) FROM outbox").fetchone()[0]))
print("result=" + str(db.execute("SELECT result_id FROM request").fetchone()[0]))`, "first=created:7\nsecond=duplicate:7\nwork=1\noutbox=1\nresult=7", ["sqlite-transaction", "spring-transaction", "spring-programmatic", "mysql-commit", "oracle-transactions", "postgres-transactions"])],
    diagnostics: [d("business row는 있는데 downstream event가 없습니다.", "DB commit 뒤 direct publish 전에 process가 죽었고 같은 transaction의 outbox가 없습니다.", ["business/outbox counts", "publish attempt/ack", "crash timeline", "replay ids"], "business+outbox를 same local transaction에 쓰고 idempotent relay/consumer와 watermark reconciliation을 운영합니다.", "commit→process kill→relay restart에서 eventually one business effect를 검증합니다.")],
    expertNotes: ["outbox는 duplicate delivery를 허용하므로 consumer unique/inbox가 계약의 일부입니다.", "외부 call을 transaction 안에서 오래 기다리는 것보다 durable intent를 commit하고 비동기 처리합니다."],
  },
  {
    id: "timeout-pool-state-long-transaction",
    title: "manual transaction의 timeout·cancellation·pool state·길이를 bounded하게 운영합니다",
    lead: "manual Connection을 오래 보유하면 DB locks/MVCC와 pool slot을 동시에 점유해 한 요청 장애가 전체 서비스 고갈로 번질 수 있습니다.",
    explanations: [
      "request, transaction, statement/query, lock, socket/connect timeout을 구분하고 inner deadline을 outer보다 짧게 둡니다. timeout 후 rollback/close가 DB까지 전파됐는지 확인합니다.",
      "remote HTTP, 파일 처리, user think time을 connection transaction 안에 넣지 않습니다. 필요한 DB state를 짧게 commit하고 outbox/workflow로 후속 작업을 수행합니다.",
      "pool connection을 반환하기 전에 commit/rollback, autoCommit/readOnly/isolation/schema reset을 확인합니다. close는 logical lease 반환이며 생략하면 acquisition pending이 증가합니다.",
      "fatal SQLException/rollback failure/unknown protocol state connection은 healthy idle로 반환하지 말고 pool이 evict하도록 합니다. 새 borrower에게 오염을 넘기지 않습니다.",
      "manual retries가 outer HTTP/framework retry와 곱해지지 않게 total attempts/deadline을 공유하고 request idempotency를 필수로 둡니다.",
    ],
    concepts: [
      c("transaction duration budget", "Connection acquire부터 commit/rollback/close까지 허용하는 시간 상한입니다.", ["lock/snapshot/pool 비용을 포함합니다.", "operation별 설정합니다."]),
      c("dirty pooled connection", "미완 transaction이나 변경된 session state를 가진 채 다음 borrower에게 반환될 수 있는 connection입니다.", ["owner rollback/reset이 필요합니다.", "fatal이면 evict합니다."]),
      c("deadline composition", "request→transaction→statement→lock의 남은 시간을 순서대로 줄여 전달하는 규칙입니다.", ["retry도 포함합니다.", "orphan work를 막습니다."]),
    ],
    diagnostics: [d("timeout 요청 이후 pool active와 DB locks가 줄지 않습니다.", "client timeout만 났고 statement cancel·transaction rollback·connection close가 실행되지 않았습니다.", ["server active tx/locks", "connection lease trace", "cancel/rollback/close results", "pool active/pending"], "server/client deadlines를 정렬하고 cancel→rollback→close/evict를 finally에서 bounded하게 수행합니다.", "request abort fault test에서 DB/pool resources가 baseline으로 복귀하는지 검증합니다.")],
    expertNotes: ["pool reset은 방어선이지 manual transaction owner의 rollback 책임을 없애지 않습니다.", "long transaction metric에는 raw SQL/key가 아니라 operation, duration, outcome, statements/rows buckets를 사용합니다."],
  },
  {
    id: "isolation-locking-deadlock-retry",
    title: "manual transaction의 isolation·locking·deadlock retry를 invariant와 함께 선택합니다",
    lead: "commit/rollback을 올바르게 호출해도 concurrent transactions가 같은 old state를 읽으면 lost update·write skew·deadlock이 생길 수 있습니다.",
    explanations: [
      "Connection.setTransactionIsolation은 transaction 시작 전에 적용하고 지원 level/effective value를 readback합니다. pool에 반환하기 전 baseline으로 복원되는지도 검증합니다.",
      "lost update는 version predicate, atomic UPDATE 또는 locking read로 해결하고 affected rows0을 conflict로 처리합니다. isolation 이름만 높여 자동 해결된다고 가정하지 않습니다.",
      "여러 rows/resources를 잠글 때 모든 service paths가 stable total order를 따르게 합니다. trigger·FK·secondary index가 추가하는 hidden locks도 actual deadlock report에서 확인합니다.",
      "deadlock/serialization victim은 statement 하나가 아니라 transaction 전체가 rollback된 정상 concurrency outcome입니다. fresh Connection과 fresh reads로 whole unit을 bounded retry합니다.",
      "retry는 stable request key·unique constraints·outbox event id로 idempotent해야 합니다. HTTP/framework retry와 manual retry가 곱해지지 않게 total budget을 공유합니다.",
    ],
    concepts: [
      c("effective isolation", "현재 JDBC transaction이 실제 DB에서 사용하는 가시성/serialization 정책입니다.", ["requested value와 다를 수 있습니다.", "engine matrix로 검증합니다."]),
      c("global lock order", "모든 code paths가 여러 resources를 획득할 때 따르는 stable total order입니다.", ["deadlock cycle을 줄입니다.", "hidden locks를 관측합니다."]),
      c("whole-unit retry", "victim rollback 뒤 새 transaction에서 reads부터 business unit 전체를 다시 실행하는 절차입니다.", ["statement retry와 다릅니다.", "idempotency가 필요합니다."]),
    ],
    diagnostics: [d("deadlock catch에서 마지막 INSERT만 재실행해 balance와 ledger가 어긋납니다.", "DB가 transaction 전체를 rollback했는데 일부 statement만 retry했습니다.", ["victim error/rollback scope", "fresh connection/snapshot", "request idempotency", "final invariant manifest"], "service entry부터 새 transaction으로 전체 unit을 bounded retry하고 stable keys로 one effect를 보장합니다.", "A→B/B→A barrier schedule에서 victim retry 후 exactly-one invariant를 검증합니다.")],
    expertNotes: ["manual retry loop는 transaction owner 바깥에 두어 매 attempt가 새 Connection/context를 얻도록 합니다.", "deadlock retry 성공률보다 repeated signature와 resource order를 수정하는 것이 장기 해법입니다."],
  },
  {
    id: "manual-transaction-observability-testing",
    title: "failure timeline·concurrency·restore·reconciliation으로 manual transaction 운영을 닫습니다",
    lead: "정상 commit 하나만 test하면 partial rollback, commit unknown, pool leakage, deadlock retry와 crash durability를 증명할 수 없습니다.",
    explanations: [
      "failure matrix는 각 SQL 전/후, savepoint, commit 호출 전/후 acknowledgement, rollback/close와 outbox relay 전/후를 포함합니다. expected rows/request/outbox/outcome manifest를 작성합니다.",
      "actual Java integration에서는 같은 Connection identity, autoCommit/isolation, affected rows, transaction duration과 completion status를 capture합니다. credential/JDBC URL/binds는 artifacts에 남기지 않습니다.",
      "두 worker barrier로 lost update/deadlock/serialization failure를 재현하고 victim은 fresh transaction에서 bounded idempotent retry합니다. sleep-only test를 피합니다.",
      "backup/PITR/restore 뒤 business/request/outbox watermarks가 같은 logical point인지 reconciliation합니다. request ledger만 유실되면 duplicate retry 위험이 있습니다.",
      "runbook은 unknown outcome lookup, long transaction/blocker 확인, safe rollback/evict, outbox repair와 previous release rollback을 포함합니다.",
    ],
    concepts: [
      c("transaction manifest", "한 request가 만들 expected related rows·counts·outbox·outcome을 적은 검증 기준입니다.", ["failure point마다 비교합니다.", "raw values를 최소화합니다."]),
      c("completion telemetry", "transaction duration·commit/rollback/unknown·attempts·statements/rows·pool wait를 기록한 bounded signal입니다.", ["SQL/binds를 제외합니다.", "DB trace와 correlation합니다."]),
      c("recovery reconciliation", "restore/restart 뒤 business·request ledger·outbox·consumer가 같은 watermark에서 일치하는지 확인하는 절차입니다.", ["counts/checksums를 씁니다.", "repair가 idempotent해야 합니다."]),
    ],
    diagnostics: [d("테스트는 rollback을 호출했다고 통과하지만 production에는 orphan row가 남습니다.", "mock call count만 검증하고 실제 DB 새 connection의 durable post-state와 triggers/outbox를 보지 않았습니다.", ["actual engine transaction", "new-connection rows", "trigger/outbox effects", "failure timing"], "ephemeral production engine에서 failure-point manifest를 실행하고 commit visibility/reconciliation을 검증합니다.", "driver/DB/Spring upgrade마다 동일 suite를 release gate로 실행합니다.")],
    expertNotes: ["rollback 메서드 호출은 증거가 아니라 최종 durable manifest와 resource baseline이 증거입니다.", "manual code가 반복되기 시작하면 TransactionTemplate/@Transactional로 ownership을 중앙화하되 behavior suite를 보존합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-board-service", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/service/BoardServiceImpl.java", usedFor: ["service-to-mapper boundary and explicit transaction gap"], evidence: "read-only 구조 감사에서 56 logical lines, active public service methods3, mapper calls3, @Transactional/try/catch/commit/rollback0을 확인했습니다. code·sample values는 복사하지 않았습니다." },
  { id: "jdk-connection", repository: "Java SE 21 API", path: "Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["autoCommit, commit, rollback, savepoint, isolation and close"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-savepoint", repository: "Java SE 21 API", path: "Savepoint", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Savepoint.html", usedFor: ["partial rollback marker"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-sqlexception", repository: "Java SE 21 API", path: "SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["manual failure, rollback and commit-unknown classification"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-datasource", repository: "Java SE 21 API", path: "DataSource", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html", usedFor: ["service connection acquisition and pooling boundary"], evidence: "Java SE 21 공식 DataSource API입니다." },
  { id: "spring-transaction", repository: "Spring Framework Reference", path: "Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["transaction abstraction, resource synchronization and service boundary"], evidence: "Spring Framework 공식 transaction 문서입니다." },
  { id: "spring-programmatic", repository: "Spring Framework Reference", path: "Programmatic Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html", usedFor: ["TransactionTemplate and programmatic completion"], evidence: "Spring Framework 공식 programmatic transaction 문서입니다." },
  { id: "spring-annotations", repository: "Spring Framework Reference", path: "Using @Transactional", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", usedFor: ["proxy, propagation, isolation and timeout settings"], evidence: "Spring Framework 공식 @Transactional 문서입니다." },
  { id: "spring-rollback", repository: "Spring Framework Reference", path: "Rolling Back a Declarative Transaction", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html", usedFor: ["checked/unchecked rollback rules"], evidence: "Spring Framework 공식 rollback 문서입니다." },
  { id: "spring-propagation", repository: "Spring Framework Reference", path: "Transaction Propagation", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html", usedFor: ["REQUIRED, REQUIRES_NEW and nested/savepoint boundaries"], evidence: "Spring Framework 공식 propagation 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["exact BEGIN/COMMIT/ROLLBACK/savepoint harnesses"], evidence: "SQLite 공식 transaction 문서입니다." },
  { id: "sqlite-isolation", repository: "SQLite Documentation", path: "Isolation In SQLite", publicUrl: "https://www.sqlite.org/isolation.html", usedFor: ["new-connection visibility and acknowledgement-loss readback"], evidence: "SQLite 공식 isolation 문서입니다." },
  { id: "python-sqlite3", repository: "Python Documentation", path: "sqlite3", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["deterministic transaction harness API"], evidence: "Python 표준 라이브러리 공식 문서입니다." },
  { id: "mysql-autocommit", repository: "MySQL 8.4 Reference Manual", path: "autocommit, Commit, and Rollback", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-autocommit-commit-rollback.html", usedFor: ["MySQL autocommit transaction behavior"], evidence: "MySQL 공식 InnoDB transaction 문서입니다." },
  { id: "mysql-commit", repository: "MySQL 8.4 Reference Manual", path: "COMMIT and ROLLBACK", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["manual commit/rollback and completion"], evidence: "MySQL 공식 COMMIT/ROLLBACK 문서입니다." },
  { id: "mysql-savepoint", repository: "MySQL 8.4 Reference Manual", path: "SAVEPOINT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/savepoint.html", usedFor: ["savepoint lifecycle"], evidence: "MySQL 공식 SAVEPOINT 문서입니다." },
  { id: "oracle-transactions", repository: "Oracle AI Database 26ai Concepts", path: "Transactions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/transactions.html", usedFor: ["transaction control, read consistency and durability"], evidence: "Oracle 공식 transaction concepts입니다." },
  { id: "oracle-commit", repository: "Oracle AI Database 26ai SQL Language Reference", path: "COMMIT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/COMMIT.html", usedFor: ["commit completion and outcome"], evidence: "Oracle 공식 COMMIT 문서입니다." },
  { id: "oracle-rollback", repository: "Oracle AI Database 26ai SQL Language Reference", path: "ROLLBACK", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/ROLLBACK.html", usedFor: ["full/savepoint rollback"], evidence: "Oracle 공식 ROLLBACK 문서입니다." },
  { id: "postgres-transactions", repository: "PostgreSQL Documentation", path: "Transactions tutorial", publicUrl: "https://www.postgresql.org/docs/current/tutorial-transactions.html", usedFor: ["transaction block and savepoint portability"], evidence: "PostgreSQL 공식 transaction tutorial입니다." },
];

const session = createExpertSession({
  inventoryId: "jdbc-05-manual-transaction", slug: "jdbc-05-manual-transaction", courseId: "spring", moduleId: "jdbc-foundations", order: 5,
  title: "JDBC 수동 트랜잭션과 원자적 서비스", subtitle: "Connection autoCommit에서 rollback rules·commit unknown·idempotency·outbox·복구까지 service invariant로 묶습니다.", level: "고급", estimatedMinutes: 940,
  coreQuestion: "여러 DAO writes를 같은 JDBC Connection과 service transaction으로 묶고, 중간 실패·timeout·deadlock·commit acknowledgement loss·중복 retry에도 하나의 business effect만 남는다고 어떻게 증명할까요?",
  summary: "SpringBasic BoardServiceImpl.java를 read-only로 구조 감사해 service→mapper progression과 explicit transaction boundary 부재를 과장 없이 gap으로 기록합니다. Connection autoCommit, manual commit/rollback template, savepoint, service connection propagation, Spring rollback rules, commit unknown/idempotency, transactional outbox, timeout/pool state와 failure/recovery operations를 고급 수준으로 연결합니다. 다섯 exact Python/SQLite examples는 autocommit partial write, atomic service, savepoint, commit acknowledgement loss와 idempotent outbox를 실제 실행하며 production Java/JDBC·MySQL·Oracle·Spring semantics는 공식 문서/engine matrix로 분리합니다.",
  objectives: ["autoCommit과 business transaction unit을 구분한다.", "commit/rollback/restore/close completion protocol을 구현한다.", "savepoint를 허용된 partial success에만 적용한다.", "service-owned Connection으로 여러 DAOs를 한 unit에 참여시킨다.", "manual exception과 Spring rollback rules/propagation 차이를 설명한다.", "commit unknown을 request ledger와 idempotency 조회로 해소한다.", "outbox·timeout·pool state·fault/recovery reconciliation을 운영한다."],
  prerequisites: [{ title: "SQLException과 try-with-resources 자원 정리", reason: "manual completion의 primary/rollback/close errors와 Connection ownership을 안전하게 처리합니다.", sessionSlug: "jdbc-04-exception-resource-trywithresources" }],
  keywords: ["JDBC transaction", "autoCommit", "commit", "rollback", "Savepoint", "service boundary", "Connection propagation", "rollback rule", "commit unknown", "idempotency", "transactional outbox", "deadline", "pool state"], topics,
  lab: {
    title: "게시물·첨부·audit·outbox 등록을 하나의 안전한 service transaction으로 만들기",
    scenario: "한 등록 요청이 parent, attachments, audit, request ledger와 outbox를 쓰며 두 번째 write failure, timeout, deadlock, commit acknowledgement loss와 duplicate request가 발생합니다.",
    setup: ["local source는 read-only provenance로만 사용하고 synthetic opaque ids/payload hashes를 준비합니다.", "Java 21/production driver·Spring context·MySQL/Oracle isolated schemas와 SQLite harness를 준비합니다.", "business invariant, transaction owner, connection propagation, rollback/error rules와 deadlines를 문서화합니다.", "각 statement/savepoint/commit/relay failure point와 expected manifest를 만듭니다."],
    steps: ["service 시작 전 Connection identity·autoCommit·isolation을 readback합니다.", "모든 DAOs가 같은 Connection에서 commit/rollback 없이 실행되는지 추적합니다.", "각 write 실패에서 base/child/audit/request/outbox를 새 connection으로 검증합니다.", "optional sub-operation만 savepoint rollback하고 required writes는 전체 rollback합니다.", "manual checked exception과 Spring caught/wrapped/default rollback rules를 비교합니다.", "commit acknowledgement를 끊고 request ledger로 outcome을 해소합니다.", "same/different payload duplicate retries와 deadlock victim retry를 실행합니다.", "business+outbox atomic commit과 relay/consumer idempotency를 검증합니다.", "timeout/cancel 뒤 rollback/state reset/close/eviction과 pool baseline을 확인합니다.", "restore 후 business/request/outbox/consumer watermark를 reconciliation하고 runbook을 drill합니다."],
    expectedResult: ["여러 DAO writes가 같은 Connection/service invariant와 한 completion owner에 속합니다.", "각 failure point에서 partial durable state가 없고 primary/rollback errors가 보존됩니다.", "commit unknown·duplicate·victim retry가 one business effect와 canonical response로 수렴합니다.", "outbox는 missing 없이 duplicate-tolerant하게 publish/consume됩니다.", "transaction/pool/resource telemetry와 recovery가 민감값 없이 운영됩니다."],
    cleanup: ["isolated schemas·synthetic request/business/outbox rows를 제거합니다.", "active/idle transactions, locks, pool leases와 pending requests가 0인지 확인합니다.", "temporary credentials/topics/exports를 revoke·삭제합니다.", "production과 local source files/data는 변경하지 않습니다."],
    extensions: ["TransactionTemplate와 @Transactional로 completion ownership을 이전합니다.", "two-database XA/2PC와 outbox/saga를 비교합니다.", "reactive transaction context와 JDBC thread confinement 차이를 검증합니다.", "PITR/replica failover 뒤 commit unknown/outbox reconciliation을 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 statement→outcome→durable post-state timeline을 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "autocommit partial과 explicit rollback을 비교합니다.", "service first/second outcomes를 검산합니다.", "savepoint와 전체 rollback을 구분합니다.", "commit unknown을 새 connection으로 해소합니다.", "duplicate outbox counts를 확인합니다."], hints: ["exception message보다 transaction owner와 새 connection post-state를 먼저 보세요."], expectedOutcome: "manual JDBC transaction을 all-or-nothing과 outcome resolution 계약으로 설명합니다.", solutionOutline: ["unit→connection→writes→failure→completion→readback 순서입니다."] },
    { difficulty: "응용", prompt: "BoardServiceImpl progression을 multi-write+outbox service로 확장하세요.", requirements: ["local 구조 계수와 explicit gap을 기록합니다.", "service가 Connection/completion을 소유합니다.", "DAOs는 transaction-neutral하게 만듭니다.", "rollback/savepoint/error rules를 정의합니다.", "request idempotency/commit unknown을 처리합니다.", "outbox relay/consumer를 idempotent하게 만듭니다.", "timeout/pool state를 검증합니다.", "actual engine fault/recovery matrix를 둡니다."], hints: ["DAO마다 commit하지 말고 business invariant 하나에 completion point 하나를 두세요."], expectedOutcome: "실패·중복·crash에도 하나의 durable business effect로 수렴하는 service가 완성됩니다.", solutionOutline: ["audit→invariant→manual owner→faults→idempotency→outbox→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직 manual JDBC transaction 표준을 작성하세요.", requirements: ["unit/owner/autoCommit rules를 둡니다.", "completion/suppressed error template을 정의합니다.", "savepoint 허용 범위를 제한합니다.", "service/DAO connection propagation을 정의합니다.", "Spring migration/rollback rules를 포함합니다.", "commit unknown/idempotency/retention을 정의합니다.", "outbox/relay/consumer/reconciliation을 포함합니다.", "deadline/pool/fault/restore/runbook을 release gate로 둡니다."], hints: ["commit 예외와 rollback 확정을 같은 상태로 두지 마세요."], expectedOutcome: "초급 manual commit부터 운영 recovery까지 일관된 transaction governance가 완성됩니다.", solutionOutline: ["define→bind→complete→resolve→publish→recover→observe 순서입니다."] },
  ],
  nextSessions: ["jdbc-06-hikari-pool"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["BoardServiceImpl.java 56 logical lines/1,521 bytes를 read-only로 감사해 active public methods3·mapper calls3, @Transactional/try/catch/commit/rollback0을 확인했습니다.", "현재 single mapper methods를 결함으로 단정하지 않고 향후 multi-write 조합의 transaction gap으로만 사용했습니다.", "원본 Java code·sample values·host·credentials를 복사하지 않고 구조 계수와 명시적 gaps만 provenance로 사용했습니다.", "SQLite exact harness는 actual JDBC Connection aborted/close behavior, Spring proxy/resource binding과 MySQL/Oracle commit/durability semantics를 대체하지 않습니다."] },
});

export default session;
