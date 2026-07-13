import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-7", explanation: "Python sqlite3와 synthetic opaque keys로 transaction fixture를 만들고 외부 service·credential 없이 경계를 재현합니다." },
      { lines: "8-끝에서 5줄 전", explanation: "BEGIN·SAVEPOINT·COMMIT·ROLLBACK 또는 failure/retry를 실행하고 새 connection이나 reconciliation query로 결과를 확인합니다." },
      { lines: "마지막 5줄", explanation: "count·status·balance·idempotency outcome만 deterministic 출력합니다. Spring proxy와 MySQL·Oracle durability는 실제 stack에서 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "작은 SQLite harness는 MySQL 8.4·Oracle 26ai의 redo, group commit, distributed outcome과 Spring proxy semantics를 대신하지 않습니다."] },
    experiments: [
      { change: "두 번째 write 직후 exception 또는 connection loss를 주입합니다.", prediction: "commit 전이면 전체 rollback, commit 응답만 잃었으면 outcome은 unknown이므로 key로 조회해야 합니다.", result: "오류 종류가 아니라 durable transaction/idempotency record로 결과를 판정합니다." },
      { change: "같은 request key로 동일·상이한 payload를 재전송합니다.", prediction: "동일 요청은 같은 결과를 반환하고 payload mismatch는 충돌로 거부되어 duplicate effects가 없어야 합니다.", result: "unique key, request hash와 stored response를 같은 transaction에서 관리합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "transaction-unit-autocommit",
    title: "트랜잭션을 business 불변식을 보존하는 최소 논리 작업 단위로 정의합니다",
    lead: "여러 SQL을 한 메서드에 적는 것과 하나의 transaction으로 실행하는 것은 다르며 autocommit은 statement마다 경계를 끝낼 수 있습니다.",
    explanations: [
      "transaction boundary는 '게시글 등록과 첨부 연결', '재고 차감과 주문 생성'처럼 함께 성공하거나 함께 실패해야 하는 business invariant에서 출발합니다. 화면 요청 전체나 한 table DAO 전체를 무조건 transaction으로 잡지 않습니다.",
      "autocommit이 켜져 있으면 각 statement 성공 직후 commit될 수 있습니다. 첫 write 뒤 두 번째가 실패하면 application에서 rollback을 호출해도 이미 확정된 첫 변경은 되돌릴 수 없습니다.",
      "driver/framework가 언제 implicit transaction을 시작하고 DDL·connection close·pool return에서 어떤 commit/rollback을 하는지 version별로 확인합니다. SQL text에 BEGIN이 없다고 transaction이 없는 것도 아닙니다.",
      "read-only query도 여러 statements가 같은 snapshot을 봐야 하면 명시 boundary가 필요합니다. 반대로 긴 사용자 think time·remote call을 포함하면 locks/undo/version retention과 pool 점유가 커집니다.",
      "원본 02_04.sql은 routine/function progression은 풍부하지만 COMMIT·ROLLBACK·SAVEPOINT·TRANSACTION token이 0회입니다. 이 부재를 transaction 예제로 과장하지 않고 synthetic harness와 공식 문서로 학습 공백을 보강합니다.",
    ],
    concepts: [
      c("unit of work", "하나의 business invariant 관점에서 전부 반영되거나 전부 취소되어야 하는 reads/writes 집합입니다.", ["table 수와 같지 않습니다.", "외부 side effect 경계를 명시합니다."]),
      c("autocommit", "각 SQL statement 뒤 transaction을 자동 종료하는 connection mode입니다.", ["driver/pool default를 확인합니다.", "DDL implicit commit과 구분합니다."]),
      c("transaction owner", "begin·commit·rollback과 connection lifecycle을 책임지는 계층입니다.", ["service/framework/driver 중 하나로 정합니다.", "nested ownership을 피합니다."]),
    ],
    codeExamples: [py("db13-commit-rollback", "ROLLBACK과 COMMIT의 새 connection 가시성", "db13_commit_rollback.py", "같은 insert를 rollback/commit해 connection-local state와 durable visibility를 구분합니다.", String.raw`import sqlite3
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as folder:
    path = Path(folder) / "tx.db"
    db = sqlite3.connect(path)
    db.execute("CREATE TABLE task(id INTEGER PRIMARY KEY, state TEXT)")
    db.commit()
    db.execute("BEGIN")
    db.execute("INSERT INTO task VALUES(?, ?)", (1, "pending"))
    before_rollback = db.execute("SELECT count(*) FROM task").fetchone()[0]
    db.rollback()
    after_rollback = db.execute("SELECT count(*) FROM task").fetchone()[0]
    db.execute("BEGIN")
    db.execute("INSERT INTO task VALUES(?, ?)", (2, "ready"))
    db.commit()
    observer = sqlite3.connect(path)
    visible = observer.execute("SELECT id, state FROM task").fetchall()
    print("local-before-rollback=" + str(before_rollback))
    print("after-rollback=" + str(after_rollback))
    print("committed=" + ",".join(f"{row[0]}:{row[1]}" for row in visible))
    print("observer-count=" + str(len(visible)))
    observer.close()
    db.close()`, "local-before-rollback=1\nafter-rollback=0\ncommitted=2:ready\nobserver-count=1", ["local-0204", "sqlite-transaction", "python-sqlite3", "mysql-commit", "mysql-autocommit", "oracle-commit", "postgres-begin", "postgres-commit"])],
    diagnostics: [d("두 번째 DAO가 실패했는데 첫 번째 row는 남습니다.", "autocommit 또는 서로 다른 connections로 statements가 이미 별도 commit됐습니다.", ["transaction synchronization/connection id", "autocommit before/after", "commit timestamps", "pool/DAO resource binding"], "service boundary에서 하나의 transaction owner와 같은 bound connection을 사용하고 failure를 밖으로 전파합니다.", "두 번째 write failure injection에서 첫 row도 0인지 새 connection으로 검증합니다.")],
    expertNotes: ["transaction 길이는 method lines가 아니라 lock/snapshot/connection 보유 시간으로 측정합니다.", "transaction이 필요한 이유를 '데이터 일관성'이 아니라 깨지면 안 되는 구체적 invariant로 적습니다."],
  },
  {
    id: "begin-commit-rollback-visibility",
    title: "BEGIN·COMMIT·ROLLBACK과 connection별 가시성·종료 상태를 추적합니다",
    lead: "COMMIT은 단순 저장 버튼이 아니라 변경을 다른 transactions에 공개하고 savepoint를 지우며 locks를 해제하는 경계입니다.",
    explanations: [
      "BEGIN은 엔진에 따라 즉시 lock을 잡거나 첫 statement에서 transaction을 시작합니다. SQLite DEFERRED/IMMEDIATE/EXCLUSIVE, MySQL START TRANSACTION과 Oracle implicit 시작을 같은 것으로 설명하지 않습니다.",
      "COMMIT 성공 응답은 transaction 종료를 뜻하지만 durability guarantee는 storage/config/replication 정책과 연결됩니다. fsync·redo·group commit·synchronous replica 설정을 제품 SLO에 맞춰 실제 fault test합니다.",
      "ROLLBACK은 uncommitted changes를 취소하고 전체 transaction을 끝냅니다. statement error가 자동으로 전체 rollback하는지, transaction이 aborted 상태로 남는지는 engine/error class별로 다릅니다.",
      "한 connection에서 자신의 uncommitted row가 보인다고 다른 connection에 공개된 것이 아닙니다. 새 connection과 선택한 isolation에서 visibility를 검증합니다.",
      "connection close/pool return을 implicit rollback 안전망으로 의존하지 않습니다. success path의 explicit commit, all failure/cancel paths의 rollback과 finally cleanup을 코드·metrics로 증명합니다.",
    ],
    concepts: [
      c("commit point", "DB가 transaction outcome을 committed로 결정해 이후 rollback할 수 없게 되는 논리 시점입니다.", ["client acknowledgement와 다를 수 있습니다.", "durability config를 확인합니다."]),
      c("uncommitted visibility", "현재 transaction의 변경이 자신과 다른 transactions에 보이는 범위입니다.", ["isolation/MVCC와 연결됩니다.", "새 connection으로 test합니다."]),
      c("aborted state", "오류 뒤 추가 statements나 commit이 허용되지 않고 rollback만 필요한 transaction 상태입니다.", ["engine별 차이가 있습니다.", "error translation이 숨기지 않게 합니다."]),
    ],
    diagnostics: [d("timeout exception 뒤 같은 connection의 다음 요청까지 계속 실패합니다.", "취소된/aborted transaction을 rollback하지 않고 pool에 반환했습니다.", ["connection transaction state", "rollback/finally path", "pool validation/reset", "next borrower trace"], "모든 error/cancel path에서 rollback하고 pool이 dirty state를 reset/reject하도록 구성합니다.", "timeout 뒤 같은 pooled connection 재대여 integration test를 둡니다.")],
    expertNotes: ["client가 COMMIT 응답을 보지 못한 것과 DB가 rollback한 것은 같은 사건이 아닙니다.", "pool return 시 cleanup은 방어선이며 business outcome 판정은 durable record에 의존합니다."],
  },
  {
    id: "acid-properties-evidence",
    title: "ACID를 표어가 아니라 실패·동시성·복구에서 관찰할 수 있는 증거로 바꿉니다",
    lead: "Atomicity·Consistency·Isolation·Durability는 엔진을 쓰면 자동 완성되는 체크박스가 아니라 schema·transaction·configuration·운영이 함께 만드는 계약입니다.",
    explanations: [
      "Atomicity는 transaction의 writes와 DB 내부 side effects가 전부 또는 전무인 성질입니다. 외부 HTTP·email은 local rollback에 포함되지 않으므로 outbox/saga 경계를 따로 설계합니다.",
      "Consistency는 DB가 모든 business truth를 자동 안다는 뜻이 아닙니다. PK/FK/UNIQUE/CHECK, correct transaction program과 serialization이 선언한 invariants를 valid state에서 valid state로 옮깁니다.",
      "Isolation은 concurrent schedule이 허용할 현상과 결과를 정의합니다. level 이름만 아니라 lost update, write skew, phantom과 lock/MVCC behavior를 실제 engine에서 검증합니다.",
      "Durability는 commit된 변경이 crash/restart 후 보존되는 보장입니다. storage flush, redo/archive, synchronous replica, backup/restore와 acknowledged durability mode를 SLO로 명시합니다.",
      "ACID acceptance에는 mid-write process kill, DB restart, network partition/commit acknowledgement loss, concurrent interleaving과 restore drill을 포함합니다. SQLite memory example은 crash durability 증거가 아닙니다.",
    ],
    concepts: [
      c("atomicity", "한 transaction의 DB effects가 모두 반영되거나 모두 취소되는 성질입니다.", ["외부 system은 자동 포함되지 않습니다.", "failure point마다 test합니다."]),
      c("consistency", "선언한 invariants를 만족하는 상태 사이로 transaction이 이동하는 성질입니다.", ["규칙 정의는 설계자의 책임입니다.", "constraints와 serialization을 사용합니다."]),
      c("durability", "commit된 outcome이 지정한 failure model 뒤에도 복구되는 성질입니다.", ["설정/SLO에 의존합니다.", "crash·restore drill로 검증합니다."]),
    ],
    diagnostics: [d("ACID DB인데도 주문 total과 line 합계가 다릅니다.", "해당 invariant를 constraint/transaction program/reconciliation 어디에도 구현하지 않았거나 fan-out 계산이 틀렸습니다.", ["invariant specification", "all writers/transactions", "constraints/triggers", "source-line reconciliation"], "authoritative line 합계와 total ownership을 정하고 같은 transaction 또는 versioned projection으로 강제합니다.", "모든 writer path와 concurrent retries에서 checksum invariant를 test합니다.")],
    expertNotes: ["Consistency의 C는 application invariant이지 모든 입력이 의미상 옳다는 마법이 아닙니다.", "Durability level을 'commit됨' 한 단어로 숨기지 말고 acknowledged failure model을 문서화합니다."],
  },
  {
    id: "savepoint-partial-rollback",
    title: "SAVEPOINT로 transaction 전체가 아닌 선택 구간을 되돌리고 상태를 계속 관리합니다",
    lead: "savepoint는 부분 실패를 무시하는 장치가 아니라 outer invariant를 보존하면서 optional sub-operation을 취소하는 명시적 경계입니다.",
    explanations: [
      "SAVEPOINT는 현재 transaction 안 marker이며 ROLLBACK TO는 이후 변경을 취소하지만 보통 transaction 자체를 끝내지 않습니다. RELEASE와 전체 COMMIT/ROLLBACK의 관계를 엔진별로 확인합니다.",
      "필수 header와 optional import line처럼 domain이 부분 성공을 허용할 때만 사용합니다. 결제 차감과 주문 생성처럼 함께 성공해야 하는 writes를 savepoint로 갈라 partial commit하지 않습니다.",
      "nested framework transaction이 실제 nested DB transaction이 아니라 savepoint일 수 있습니다. PROPAGATION_NESTED·REQUIRES_NEW는 resource/commit/rollback semantics가 다르므로 이름으로 추측하지 않습니다.",
      "ROLLBACK TO 뒤 exception/transaction state와 locks가 어떻게 남는지 확인합니다. 어떤 errors는 전체 transaction을 unusable하게 만들어 savepoint 회복이 불가능할 수 있습니다.",
      "batch import에서는 reject row의 safe reason과 source offset을 quarantine하고 accepted count/checksum을 commit합니다. raw PII나 full SQL을 error table에 복사하지 않습니다.",
    ],
    concepts: [
      c("savepoint", "transaction 안 특정 상태에 이름을 붙여 이후 변경만 취소할 수 있게 한 marker입니다.", ["독립 commit이 아닙니다.", "전체 rollback에서 사라집니다."]),
      c("partial rollback", "outer transaction을 유지하며 savepoint 이후 DB changes를 취소하는 동작입니다.", ["domain이 partial success를 허용해야 합니다.", "error state를 확인합니다."]),
      c("nested transaction illusion", "framework 중첩 호출이 독립 transaction처럼 보여도 실제로 savepoint/shared context일 수 있는 상태입니다.", ["propagation을 확인합니다.", "test에서 connection/outcome을 추적합니다."]),
    ],
    codeExamples: [py("db13-savepoint", "optional line 실패를 savepoint로 되돌리기", "db13_savepoint.py", "필수 batch header는 유지하고 invalid optional line만 rollback한 뒤 valid line을 commit합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE batch(id INTEGER PRIMARY KEY, state TEXT)")
db.execute("CREATE TABLE line(id INTEGER PRIMARY KEY, batch_id INTEGER, qty INTEGER CHECK(qty>0))")
db.execute("BEGIN")
db.execute("INSERT INTO batch VALUES(?, ?)", (1, "accepted"))
db.execute("SAVEPOINT optional_line")
try:
    db.execute("INSERT INTO line VALUES(?, ?, ?)", (10, 1, 0))
except sqlite3.IntegrityError:
    db.execute("ROLLBACK TO optional_line")
    db.execute("RELEASE optional_line")
    print("optional=rejected")
db.execute("INSERT INTO line VALUES(?, ?, ?)", (11, 1, 2))
db.commit()
print("batches=" + str(db.execute("SELECT count(*) FROM batch").fetchone()[0]))
print("lines=" + str(db.execute("SELECT count(*) FROM line").fetchone()[0]))
print("line-ids=" + ",".join(str(row[0]) for row in db.execute("SELECT id FROM line ORDER BY id")))
print("committed=true")`, "optional=rejected\nbatches=1\nlines=1\nline-ids=11\ncommitted=true", ["sqlite-transaction", "mysql-savepoint", "oracle-rollback", "postgres-tutorial-transactions", "postgres-rollback"])],
    diagnostics: [d("부분 rollback 후에도 transaction commit이 실패합니다.", "해당 DB error가 transaction 전체를 aborted 상태로 만들었거나 savepoint를 이미 잃었습니다.", ["error class/vendor code", "transaction/savepoint state", "implicit commit DDL", "next statement result"], "회복 가능한 errors만 savepoint policy에 허용하고 나머지는 전체 rollback 후 새 transaction으로 재시작합니다.", "constraint/deadlock/timeout/connection-loss별 savepoint recovery matrix를 실제 엔진에서 실행합니다.")],
    expertNotes: ["savepoint는 보상 transaction이 아니며 외부 side effect를 되돌리지 않습니다.", "batch partial success API는 accepted/rejected counts, reason taxonomy와 replay identity를 명시합니다."],
  },
  {
    id: "spring-service-transaction-boundary",
    title: "Spring service 경계에서 여러 mapper 호출을 하나의 transaction으로 묶습니다",
    lead: "`@Transactional` annotation은 proxy가 가로채는 호출 경계와 transaction manager가 실제 resource를 bind할 때만 의미가 있습니다.",
    explanations: [
      "로컬 BoardServiceImpl.java는 56 logical lines, active public methods 3개와 mapper calls 3개가 있지만 @Transactional·try/catch·throw가 없습니다. 현재 단일 calls를 곧바로 결함이라 단정하지 않고, 향후 한 business operation이 여러 writes를 조합할 때 필요한 boundary gap으로 사용합니다.",
      "service public method를 business unit owner로 두고 mapper/DAO는 같은 transaction-bound connection/session을 사용합니다. controller에서 mapper 둘을 따로 호출하거나 DAO가 독자 commit하면 atomicity가 깨집니다.",
      "proxy mode에서는 같은 class의 self-invocation이 transactional advice를 우회할 수 있습니다. private method annotation, final/class proxy restrictions와 bean 밖 호출 여부를 current Spring 설정에서 확인합니다.",
      "transaction manager가 여러 개인 application은 qualifier를 명시합니다. JDBC와 message broker에 같은 @Transactional을 붙였다고 분산 atomic commit이 자동으로 생기지 않습니다.",
      "readOnly, timeout, propagation, isolation은 최적화 힌트/정책이며 권한 보안이나 business correctness를 자동 보장하지 않습니다. actual connection state와 SQL behavior를 integration test합니다.",
    ],
    concepts: [
      c("service boundary", "한 business use case의 transaction 시작·성공·실패를 소유하는 application 계층 경계입니다.", ["controller/DAO보다 안정적입니다.", "remote call을 짧게 분리합니다."]),
      c("transactional proxy", "method invocation을 가로채 resource transaction을 시작·종료하는 Spring advice 객체입니다.", ["self-invocation을 주의합니다.", "실제 bean 호출을 test합니다."]),
      c("resource binding", "현재 thread/reactive context의 mapper들이 같은 connection/entity manager를 사용하게 연결하는 상태입니다.", ["transaction manager와 맞아야 합니다.", "async 경계를 자동 넘지 않습니다."]),
    ],
    codeExamples: [py("db13-service-atomicity", "두 mapper write를 흉내 낸 service transaction", "db13_service_atomicity.py", "debit과 ledger insert 사이 failure를 주입해 rollback하고 success path만 두 writes를 함께 commit합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE account(id INTEGER PRIMARY KEY, balance INTEGER CHECK(balance>=0))")
db.execute("CREATE TABLE ledger(id INTEGER PRIMARY KEY, account_id INTEGER, amount INTEGER)")
db.execute("INSERT INTO account VALUES(1, 100)")
db.commit()
def debit(request_id, amount, fail=False):
    try:
        db.execute("BEGIN")
        db.execute("UPDATE account SET balance=balance-? WHERE id=1", (amount,))
        if fail:
            raise RuntimeError("injected")
        db.execute("INSERT INTO ledger VALUES(?, 1, ?)", (request_id, -amount))
        db.commit()
        return "committed"
    except Exception:
        db.rollback()
        return "rolled-back"
print("first=" + debit(1, 30, True))
print("after-first=" + str(db.execute("SELECT balance FROM account").fetchone()[0]))
print("second=" + debit(2, 30))
print("after-second=" + str(db.execute("SELECT balance FROM account").fetchone()[0]))
print("ledger=" + str(db.execute("SELECT count(*) FROM ledger").fetchone()[0]))`, "first=rolled-back\nafter-first=100\nsecond=committed\nafter-second=70\nledger=1", ["local-board-service", "sqlite-transaction", "spring-transaction", "spring-annotations", "spring-rollback"])],
    diagnostics: [d("@Transactional을 붙였는데 self 호출 경로에서 일부 writes가 남습니다.", "transactional method를 같은 객체 내부에서 호출해 proxy advice를 거치지 않았거나 잘못된 manager를 사용했습니다.", ["caller bean/proxy class", "transaction active/name", "manager/resource binding", "autocommit/connection ids"], "외부 bean 경계로 호출 구조를 바꾸거나 적절한 weaving/programmatic boundary를 선택하고 manager를 명시합니다.", "실제 container를 띄운 failure injection test에서 같은 transaction/connection을 단언합니다.")],
    expertNotes: ["annotation 존재 scan은 충분하지 않으며 proxy invocation과 resource participation evidence가 필요합니다.", "local source의 단일 mapper methods를 문제로 단정하지 않고 multi-write 확장 시점의 설계 gap으로 설명합니다."],
  },
  {
    id: "rollback-rules-exception-propagation",
    title: "exception 종류·catch·rollback-only·propagation이 실제 outcome을 결정하는 규칙을 고정합니다",
    lead: "오류를 로그로 남겼다는 사실과 transaction을 rollback했다는 사실은 다르며, exception을 삼키면 proxy는 정상 반환으로 보고 commit할 수 있습니다.",
    explanations: [
      "Spring 기본 rollback은 보통 unchecked RuntimeException/Error에 적용되고 checked exception은 설정이 필요합니다. current version의 global/default rule과 method별 rollbackFor/noRollbackFor를 명시합니다.",
      "transactional method 안에서 exception을 catch하고 success/false를 반환하면 boundary 밖에 실패가 보이지 않습니다. recover할 수 없으면 다시 throw하거나 rollback-only를 설정하고 response와 DB outcome을 일치시킵니다.",
      "catch 후 다른 repository writes를 계속하면 원래 오류가 transaction을 aborted로 만들었는지 확인해야 합니다. DB별 error class에 따라 다음 SQL까지 실패하거나 statement만 rollback될 수 있습니다.",
      "REQUIRED 내부가 rollback-only를 표시했는데 outer가 commit하려 하면 unexpected rollback이 발생할 수 있습니다. 호출자가 실패를 성공으로 오해하지 않게 exception/outcome contract를 문서화합니다.",
      "retry annotation과 transaction annotation의 advice 순서가 중요합니다. deadlock transaction을 같은 aborted context에서 재시도하지 말고 새 transaction으로 전체 idempotent unit을 반복합니다.",
    ],
    concepts: [
      c("rollback rule", "어떤 exception/error가 transaction을 rollback-only로 만드는지 정한 framework 정책입니다.", ["checked/unchecked를 구분합니다.", "pattern보다 type을 선호합니다."]),
      c("exception swallowing", "실패를 catch한 뒤 boundary에 정상 반환해 rollback advice가 실패를 관찰하지 못하는 상태입니다.", ["rollback-only를 명시합니다.", "API outcome과 맞춥니다."]),
      c("propagation", "호출된 method가 기존 transaction에 참여·새로 시작·중단·savepoint를 사용할지 정한 규칙입니다.", ["resource별 지원을 확인합니다.", "REQUIRES_NEW pool 비용을 봅니다."]),
    ],
    diagnostics: [d("서비스는 실패 응답을 냈는데 DB 변경은 commit됐습니다.", "exception을 내부 catch해 정상 반환했고 rollback-only를 표시하지 않았습니다.", ["caught exception path", "rollback rules", "transaction completion status", "response mapping"], "실패를 boundary 밖으로 throw하거나 명시 rollback-only 후 일관된 failure response를 반환합니다.", "checked/unchecked/caught/wrapped exception matrix에서 final DB state와 response를 함께 test합니다.")],
    expertNotes: ["rollbackFor 이름 pattern은 의도치 않은 nested/similar exception까지 match할 수 있어 type-based 규칙을 우선합니다.", "REQUIRES_NEW는 독립 commit이므로 outer rollback 뒤 남아야 하는 효과인지 명시적으로 승인합니다."],
  },
  {
    id: "commit-unknown-idempotency",
    title: "COMMIT 응답을 잃은 unknown outcome을 재실행이 아니라 조회·idempotency로 해결합니다",
    lead: "network가 끊겼을 때 DB는 commit했을 수도 rollback했을 수도 있으므로 같은 주문을 무조건 다시 실행하면 중복 효과가 생깁니다.",
    explanations: [
      "client acknowledgement 전후와 DB commit point는 분리됩니다. timeout/connection reset은 outcome=failed가 아니라 outcome=unknown으로 분류하고 durable transaction/request key를 조회합니다.",
      "idempotency key는 principal·operation scope에서 unique하고 request payload hash와 stored response/outcome을 함께 보존합니다. 같은 key의 다른 payload는 conflict로 거부합니다.",
      "business rows, idempotency record와 outbox를 같은 transaction에 기록해야 합니다. key row만 먼저 commit하거나 external cache에 두면 partial state에서 중복을 막지 못합니다.",
      "retry는 전체 unit을 새 transaction에서 수행하며 unique conflict 뒤 canonical response를 readback합니다. generated ids를 새로 만들어 duplicate parent가 생기지 않게 client/server stable identity를 둡니다.",
      "idempotency record retention이 retry horizon보다 짧으면 오래 지연된 retry가 새 요청으로 처리됩니다. TTL, archival, privacy와 key guessing/rate limit을 API contract에 포함합니다.",
    ],
    concepts: [
      c("commit unknown", "client가 commit 성공/실패 응답을 확정하지 못했지만 DB outcome은 이미 결정됐을 수 있는 상태입니다.", ["blind retry를 금지합니다.", "durable key로 조회합니다."]),
      c("idempotency record", "request identity·payload fingerprint·business result/outcome을 unique하게 저장한 row입니다.", ["business write와 함께 commit합니다.", "scope와 retention을 명시합니다."]),
      c("outcome reconciliation", "unknown 요청이 committed/rolled-back/in-progress 중 무엇인지 authoritative DB state로 판정하는 절차입니다.", ["safe polling/timeout을 둡니다.", "ambiguous status를 숨기지 않습니다."]),
    ],
    codeExamples: [py("db13-commit-unknown", "acknowledgement loss 뒤 durable key로 outcome 해소", "db13_commit_unknown.py", "commit 직후 synthetic timeout을 만들고 새 connection이 request key를 조회해 중복 write 없이 committed로 판정합니다.", String.raw`import sqlite3
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as folder:
    path = Path(folder) / "outcome.db"
    db = sqlite3.connect(path)
    db.execute("CREATE TABLE request(key TEXT PRIMARY KEY, amount INTEGER, state TEXT)")
    db.commit()
    try:
        db.execute("BEGIN")
        db.execute("INSERT INTO request VALUES(?, ?, ?)", ("req-1", 40, "committed"))
        db.commit()
        raise TimeoutError("ack-lost")
    except TimeoutError:
        acknowledgement = "unknown"
    observer = sqlite3.connect(path)
    stored = observer.execute("SELECT amount, state FROM request WHERE key=?", ("req-1",)).fetchone()
    if stored is None:
        resolution = "retry-safe"
    else:
        resolution = stored[1]
    print("acknowledgement=" + acknowledgement)
    print("resolution=" + resolution)
    print("amount=" + str(stored[0]))
    print("rows=" + str(observer.execute("SELECT count(*) FROM request").fetchone()[0]))
    print("duplicate=false")
    observer.close()
    db.close()`, "acknowledgement=unknown\nresolution=committed\namount=40\nrows=1\nduplicate=false", ["sqlite-isolation", "python-sqlite3", "mysql-commit", "oracle-commit", "postgres-commit"])],
    diagnostics: [d("timeout retry가 같은 결제를 두 번 만듭니다.", "connection error를 rollback 확정으로 오해하고 stable idempotency key 없이 새 identity로 재실행했습니다.", ["DB commit/request record", "retry keys/payload hashes", "unique conflicts", "external provider id"], "unknown으로 응답하고 durable key로 조회한 뒤 same-payload canonical result만 반환합니다.", "commit-before-ack/after-ack connection loss와 delayed duplicate requests를 fault-injection test합니다.")],
    expertNotes: ["exactly-once delivery보다 at-least-once 요청에서 exactly-once effect를 idempotency/reconciliation으로 만듭니다.", "unknown 상태를 500 실패로 단순화하면 caller가 unsafe retry하므로 API status와 조회 경로를 제공합니다."],
  },
  {
    id: "outbox-multi-resource-boundary",
    title: "DB와 message·email·remote service를 한 local transaction처럼 다루지 않고 outbox로 연결합니다",
    lead: "DB commit과 broker publish 사이에는 crash window가 있어 둘을 순서대로 호출하는 dual write는 반드시 missing 또는 duplicate event 가능성을 가집니다.",
    explanations: [
      "DB→publish 순서는 commit 후 publish 전 crash에서 missing event, publish→DB 순서는 publish 후 rollback에서 ghost event를 만듭니다. local transaction만으로 두 resource를 원자화할 수 없습니다.",
      "transactional outbox는 business row와 event intent를 같은 DB transaction에 insert합니다. relay는 committed rows만 claim/publish하고 event id로 retry하며 consumer도 inbox/dedup 또는 idempotent state transition을 사용합니다.",
      "outbox payload에는 최소 immutable event facts와 schema version을 두고 민감 snapshot을 복제하지 않습니다. tenant authorization, encryption, retention과 redaction/backfill 정책을 둡니다.",
      "ordering은 global이 아니라 aggregate/partition별 sequence를 정의합니다. concurrent transactions의 commit order, relay parallelism과 broker partition을 conformance합니다.",
      "2PC/XA는 coordinator, prepared transaction recovery와 availability tradeoff가 있어 필요한 경우에만 선택합니다. saga는 compensation이 가능한 business actions와 irreversible effect boundary를 명시합니다.",
    ],
    concepts: [
      c("dual-write gap", "두 독립 resources에 순차 write할 때 한쪽만 성공할 수 있는 failure window입니다.", ["호출 순서로 제거되지 않습니다.", "outbox/2PC/saga를 선택합니다."]),
      c("transactional outbox", "business state와 publish intent를 같은 DB transaction에 durable하게 기록하는 pattern입니다.", ["relay retry가 필요합니다.", "consumer effect도 idempotent하게 합니다."]),
      c("reconciliation watermark", "business/outbox/published/consumed populations을 일정 지점까지 비교하는 progress marker입니다.", ["late/in-flight를 구분합니다.", "gap repair와 연결합니다."]),
    ],
    codeExamples: [py("db13-idempotent-outbox", "business row·request key·outbox의 원자적 생성", "db13_outbox.py", "동일 request를 두 번 처리해 하나의 business row와 outbox event만 commit되는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE request(key TEXT PRIMARY KEY, result_id INTEGER)")
db.execute("CREATE TABLE job(id INTEGER PRIMARY KEY, state TEXT)")
db.execute("CREATE TABLE outbox(event_id TEXT PRIMARY KEY, job_id INTEGER, kind TEXT)")
db.commit()
def create_job(key, job_id):
    existing = db.execute("SELECT result_id FROM request WHERE key=?", (key,)).fetchone()
    if existing:
        return "duplicate:" + str(existing[0])
    try:
        db.execute("BEGIN")
        db.execute("INSERT INTO job VALUES(?, 'ready')", (job_id,))
        db.execute("INSERT INTO outbox VALUES(?, ?, 'job-ready')", ("evt-" + key, job_id))
        db.execute("INSERT INTO request VALUES(?, ?)", (key, job_id))
        db.commit()
        return "created:" + str(job_id)
    except Exception:
        db.rollback()
        raise
print("first=" + create_job("r1", 7))
print("second=" + create_job("r1", 99))
print("jobs=" + str(db.execute("SELECT count(*) FROM job").fetchone()[0]))
print("events=" + str(db.execute("SELECT count(*) FROM outbox").fetchone()[0]))
print("result=" + str(db.execute("SELECT result_id FROM request").fetchone()[0]))`, "first=created:7\nsecond=duplicate:7\njobs=1\nevents=1\nresult=7", ["sqlite-transaction", "mysql-acid", "oracle-transactions", "postgres-tutorial-transactions"])],
    diagnostics: [d("DB row는 있는데 downstream event가 없습니다.", "business commit 뒤 direct publish 전에 process가 죽었고 durable outbox가 없습니다.", ["business/outbox counts by watermark", "publish attempts/acks", "crash timeline", "manual replay ids"], "business row와 outbox를 같은 transaction에 기록하고 idempotent relay/consumer와 reconciliation을 운영합니다.", "commit→process-kill→restart relay test에서 eventually one effect를 검증합니다.")],
    expertNotes: ["outbox는 delivery 중복을 없애지 않고 중복을 식별·재처리 가능하게 만듭니다.", "relay claim/lease가 만료되면 concurrent publishers가 같은 event를 보낼 수 있으므로 consumer idempotency가 필요합니다."],
  },
  {
    id: "timeout-cancel-pool-resource-lifecycle",
    title: "timeout·cancellation·connection pool·long transaction을 자원 수명주기로 관리합니다",
    lead: "transaction은 DB rows뿐 아니라 connection, locks, undo/MVCC versions와 downstream capacity를 점유하므로 반드시 bounded해야 합니다.",
    explanations: [
      "transaction timeout, statement/query timeout, lock timeout과 HTTP request timeout은 서로 다른 clocks와 취소 범위입니다. outer request가 끝나도 DB query가 계속되는 orphan work를 막도록 cancellation propagation을 검증합니다.",
      "timeout exception 뒤 server statement가 실제 취소됐는지, transaction이 aborted/rollback-only인지 확인합니다. client thread interrupt만으로 DB work가 멈췄다고 가정하지 않습니다.",
      "remote HTTP, file upload와 user think time을 DB transaction 안에 두지 않습니다. 필요한 데이터를 검증·예약한 뒤 commit하고 durable workflow/outbox로 다음 단계를 진행합니다.",
      "REQUIRES_NEW나 nested calls는 outer가 connection을 쥔 채 추가 pool slot을 기다려 pool deadlock을 만들 수 있습니다. 최대 nesting×concurrency와 timeout을 capacity model에 반영합니다.",
      "pool checkout 때 autocommit/isolation/readOnly/schema/session context를 설정하고 return 때 rollback/reset합니다. 누출 검사는 다음 borrower가 dirty state를 관찰하는 adversarial test로 수행합니다.",
    ],
    concepts: [
      c("timeout hierarchy", "request·transaction·statement·lock 대기의 서로 다른 제한 시간과 취소 전파 관계입니다.", ["inner가 outer보다 짧아야 합니다.", "error taxonomy를 보존합니다."]),
      c("orphan transaction", "caller는 포기했지만 DB/session에서 계속 실행·대기하는 transaction입니다.", ["server-side activity를 확인합니다.", "cancel/rollback을 전파합니다."]),
      c("pool state hygiene", "connection 재사용 전 transaction과 session 설정을 안전한 baseline으로 되돌리는 규칙입니다.", ["rollback/reset/readback합니다.", "borrower 간 context leakage를 막습니다."]),
    ],
    diagnostics: [d("요청 timeout 뒤에도 locks가 오래 남아 다른 writers를 막습니다.", "HTTP timeout만 발생하고 JDBC statement cancel/transaction rollback이 DB까지 전파되지 않았습니다.", ["server active transaction/query", "lock wait/blocker", "client cancel/rollback logs", "pool lease owner"], "server statement/transaction timeout을 두고 cancellation에서 cancel→rollback→close/evict를 보장합니다.", "request abort fault test에서 bounded 시간 안에 active tx/locks가 0인지 확인합니다.")],
    expertNotes: ["timeout은 실패를 예방하는 correctness 도구가 아니라 resource bound이며 retry/idempotency와 함께 설계합니다.", "transaction metrics에 raw SQL/parameters 대신 operation, duration, outcome, retry, lock-wait buckets를 사용합니다."],
  },
  {
    id: "transaction-observability-recovery-governance",
    title: "transaction outcome·복구·reconciliation·fault injection으로 운영 계약을 닫습니다",
    lead: "평상시 성공 test만으로는 rollback, commit unknown, crash durability와 concurrent invariant를 증명할 수 없습니다.",
    explanations: [
      "telemetry에는 operation/version, transaction duration, statements/rows, commit/rollback/unknown, retry count/reason, lock wait와 idempotency outcome을 bounded labels로 남깁니다. payload·SQL parameter·PII는 제외합니다.",
      "database activity/lock views와 application trace를 transaction/request id로 연결하되 cardinality를 제한합니다. sampled spans가 outcome audit의 source of truth가 되지 않게 durable reconciliation을 둡니다.",
      "fault injection은 각 write 전후, commit 전/후 acknowledgement, deadlock/timeout/cancel, process/DB restart와 relay crash를 포함합니다. test마다 before/after manifest와 allowed outcomes를 정의합니다.",
      "backup/restore와 point-in-time recovery는 durability의 일부입니다. restored business rows, idempotency records, outbox watermarks와 consumers가 같은 logical point인지 reconciliation합니다.",
      "runbook은 unknown outcome query, stuck/long transaction termination approval, deadlock retry, poisoned connection eviction, outbox repair와 rollback release를 포함합니다. 수동 SQL은 idempotent manifest/readback을 요구합니다.",
    ],
    concepts: [
      c("transaction outcome taxonomy", "committed·rolled-back·unknown·in-progress를 구분하는 안정된 상태 분류입니다.", ["transport error와 분리합니다.", "durable evidence로 판정합니다."]),
      c("fault manifest", "주입 지점, expected DB/outbox/idempotency state와 허용 outcome을 적은 검증 문서입니다.", ["자동 readback을 포함합니다.", "engine/version별 유지합니다."]),
      c("recovery reconciliation", "복구된 business, request, outbox와 downstream state가 같은 logical watermark에서 일치하는지 확인하는 절차입니다.", ["counts와 checksums를 사용합니다.", "repair가 idempotent해야 합니다."]),
    ],
    diagnostics: [d("모니터에는 rollback으로 보이지만 고객은 이미 결과를 받았거나 반대입니다.", "transport/application 로그를 authoritative DB outcome으로 사용하고 commit unknown을 분류하지 않았습니다.", ["durable request/business row", "DB transaction outcome", "response/ack timeline", "outbox/consumer state"], "outcome taxonomy와 idempotency 조회를 적용하고 사용자 status를 authoritative row에서 재구성합니다.", "commit 전후 network cut matrix에서 API status와 DB/outbox state 허용 조합을 검증합니다.")],
    expertNotes: ["rollback rate가 낮다는 사실보다 unknown이 안전하게 해소되고 invariants가 reconciliation되는지가 중요합니다.", "장기 transaction 종료는 업무 손상 가능성이 있어 blocker/victim, rollback cost와 owner 승인을 확인합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0204", repository: "dbstudy", path: "02_04.sql", usedFor: ["routine/function progression and explicit transaction-control gap"], evidence: "read-only 구조 감사에서 251 logical lines, statement-like segments73, CALL11을 확인했고 COMMIT·ROLLBACK·SAVEPOINT·TRANSACTION은 0회였습니다. sample literals는 복사하지 않았습니다." },
  { id: "local-board-service", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/service/BoardServiceImpl.java", usedFor: ["service-to-mapper boundary and explicit @Transactional gap"], evidence: "read-only 구조 감사에서 56 logical lines, active public service methods3, active mapper calls3, @Transactional/try/catch/throw0을 확인했습니다. code·literals는 복사하지 않았습니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["BEGIN/COMMIT/ROLLBACK, savepoint-adjacent and exact transaction harnesses"], evidence: "SQLite 공식 transaction 문서입니다." },
  { id: "sqlite-isolation", repository: "SQLite Documentation", path: "Isolation In SQLite", publicUrl: "https://www.sqlite.org/isolation.html", usedFor: ["connection visibility and commit-unknown readback boundary"], evidence: "SQLite 공식 isolation 문서입니다." },
  { id: "python-sqlite3", repository: "Python Documentation", path: "sqlite3 — DB-API 2.0 interface", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["Python connection, commit, rollback and context behavior"], evidence: "Python 표준 라이브러리 공식 문서입니다." },
  { id: "mysql-acid", repository: "MySQL 8.4 Reference Manual", path: "InnoDB and the ACID Model", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/mysql-acid.html", usedFor: ["ACID configuration and durability model"], evidence: "MySQL 공식 ACID 문서입니다." },
  { id: "mysql-commit", repository: "MySQL 8.4 Reference Manual", path: "COMMIT and ROLLBACK", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["transaction end, chain/release and commit outcome"], evidence: "MySQL 공식 COMMIT/ROLLBACK 문서입니다." },
  { id: "mysql-autocommit", repository: "MySQL 8.4 Reference Manual", path: "autocommit, Commit, and Rollback", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-autocommit-commit-rollback.html", usedFor: ["autocommit and implicit transaction behavior"], evidence: "MySQL 공식 InnoDB transaction 문서입니다." },
  { id: "mysql-savepoint", repository: "MySQL 8.4 Reference Manual", path: "SAVEPOINT, ROLLBACK TO SAVEPOINT, RELEASE SAVEPOINT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/savepoint.html", usedFor: ["partial rollback and savepoint lifecycle"], evidence: "MySQL 공식 SAVEPOINT 문서입니다." },
  { id: "oracle-transactions", repository: "Oracle AI Database 26ai Concepts", path: "Transactions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/transactions.html", usedFor: ["transaction control, ACID, undo and commit outcome"], evidence: "Oracle 공식 transaction concepts 문서입니다." },
  { id: "oracle-commit", repository: "Oracle AI Database 26ai SQL Language Reference", path: "COMMIT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/COMMIT.html", usedFor: ["Oracle commit semantics and outcome"], evidence: "Oracle 공식 COMMIT 문서입니다." },
  { id: "oracle-rollback", repository: "Oracle AI Database 26ai SQL Language Reference", path: "ROLLBACK", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/ROLLBACK.html", usedFor: ["Oracle full/savepoint rollback semantics"], evidence: "Oracle 공식 ROLLBACK 문서입니다." },
  { id: "postgres-tutorial-transactions", repository: "PostgreSQL Documentation", path: "Transactions tutorial", publicUrl: "https://www.postgresql.org/docs/current/tutorial-transactions.html", usedFor: ["transaction blocks and savepoints"], evidence: "PostgreSQL 공식 transaction tutorial입니다." },
  { id: "postgres-begin", repository: "PostgreSQL Documentation", path: "BEGIN", publicUrl: "https://www.postgresql.org/docs/current/sql-begin.html", usedFor: ["explicit transaction start"], evidence: "PostgreSQL 공식 BEGIN 문서입니다." },
  { id: "postgres-commit", repository: "PostgreSQL Documentation", path: "COMMIT", publicUrl: "https://www.postgresql.org/docs/current/sql-commit.html", usedFor: ["commit completion and chaining"], evidence: "PostgreSQL 공식 COMMIT 문서입니다." },
  { id: "postgres-rollback", repository: "PostgreSQL Documentation", path: "ROLLBACK", publicUrl: "https://www.postgresql.org/docs/current/sql-rollback.html", usedFor: ["full rollback semantics"], evidence: "PostgreSQL 공식 ROLLBACK 문서입니다." },
  { id: "spring-transaction", repository: "Spring Framework Reference", path: "Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["Spring transaction abstraction and resource synchronization"], evidence: "Spring Framework 공식 transaction 문서입니다." },
  { id: "spring-annotations", repository: "Spring Framework Reference", path: "Using @Transactional", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", usedFor: ["proxy annotation settings, propagation, isolation and timeout"], evidence: "Spring Framework 공식 @Transactional 문서입니다." },
  { id: "spring-rollback", repository: "Spring Framework Reference", path: "Rolling Back a Declarative Transaction", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html", usedFor: ["rollback rules and exception propagation"], evidence: "Spring Framework 공식 rollback 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-13-transaction-acid", slug: "db-13-transaction-acid", courseId: "database", moduleId: "db-programmability-performance", order: 5,
  title: "트랜잭션, COMMIT·ROLLBACK과 ACID", subtitle: "autocommit 한 줄에서 service 원자성·rollback rules·commit unknown·idempotency·outbox·복구까지 연결합니다.", level: "고급", estimatedMinutes: 940,
  coreQuestion: "여러 DB 변경과 외부 효과를 어떤 경계에서 묶고, 실패·timeout·connection loss·retry·crash에서도 all-or-nothing과 정확한 사용자 outcome을 어떻게 증명할까요?",
  summary: "dbstudy 02_04.sql과 SpringBasic BoardServiceImpl.java를 read-only로 구조 감사해 routine/service progression과 명시적 transaction-control/@Transactional 부재를 학습 gap으로 기록합니다. unit/autocommit, BEGIN·COMMIT·ROLLBACK visibility, ACID evidence, savepoint, Spring service/proxy, rollback rules, commit unknown/idempotency, transactional outbox, timeout/pool과 recovery/reconciliation을 초급에서 운영 고급까지 연결합니다. 다섯 exact Python/SQLite examples는 commit/rollback, savepoint, multi-write service, idempotent outbox와 acknowledgement-loss resolution을 실행하고 MySQL 8.4·Oracle 26ai·Spring 차이를 공식 문서로 분리합니다.",
  objectives: ["business invariant에서 transaction unit과 owner를 정의한다.", "autocommit·BEGIN·COMMIT·ROLLBACK·SAVEPOINT의 가시성과 종료 상태를 설명한다.", "ACID를 failure/concurrency/recovery test evidence로 전환한다.", "Spring service/proxy/resource binding과 rollback rules를 검증한다.", "commit unknown을 idempotency key와 outcome query로 안전하게 해소한다.", "DB+message dual write를 transactional outbox와 idempotent relay로 운영한다.", "timeout·pool·fault injection·reconciliation·restore runbook을 설계한다."],
  prerequisites: [{ title: "트리거의 OLD·NEW와 연쇄 부작용", reason: "transaction 안에서 자동 실행되는 DB side effects와 rollback 범위를 추적합니다.", sessionSlug: "db-12-trigger-old-new" }, { title: "PreparedStatement와 DAO 트랜잭션", reason: "connection·commit·rollback의 application 경계를 Spring service 수준으로 확장합니다.", sessionSlug: "jdbc-02-prepared-transaction-dao" }],
  keywords: ["transaction", "autocommit", "BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "ACID", "@Transactional", "rollback rule", "commit unknown", "idempotency", "outbox", "timeout", "connection pool", "reconciliation"], topics,
  lab: {
    title: "multi-write 등록 service를 commit-unknown과 outbox까지 안전하게 운영하기",
    scenario: "등록 요청이 parent·children·request ledger·outbox를 쓰고 broker relay를 시작합니다. 중간 constraint failure, checked exception, timeout, commit acknowledgement loss와 duplicate retry가 발생합니다.",
    setup: ["로컬 source는 read-only provenance로만 사용하고 synthetic opaque request/entity ids를 준비합니다.", "Spring 실제 container+MySQL 8.4·Oracle 26ai isolated schemas와 SQLite semantic harness를 준비합니다.", "business invariant, transaction owner, rollback rules, timeout과 idempotency scope/retention을 작성합니다.", "각 write 전후·commit 전후·relay claim/publish 전후 fault points와 expected manifest를 만듭니다."],
    steps: ["autocommit/connection/resource binding을 transaction 시작 전후 readback합니다.", "parent·children·ledger writes를 service boundary 하나에 묶고 mapper connection ids를 확인합니다.", "checked/unchecked/caught/wrapped exceptions와 rollback-only 결과를 matrix로 실행합니다.", "savepoint 허용 optional step과 전체 rollback 필수 step을 분류합니다.", "ACID invariant를 process kill·DB restart·concurrent schedule에서 검증합니다.", "commit acknowledgement를 끊고 request key로 committed/rollback/unknown을 해소합니다.", "same/different payload duplicate retry에서 exactly-one business effect를 검증합니다.", "business+outbox atomic commit과 relay/consumer idempotency를 fault-injection합니다.", "request/transaction/statement/lock timeout과 pool reset/cancel을 검증합니다.", "restore 후 request/business/outbox/downstream watermark를 reconciliation하고 runbook을 drill합니다."],
    expectedResult: ["모든 mapper writes가 하나의 명시 service transaction/connection과 invariant에 속합니다.", "각 exception/failure point가 승인된 commit·rollback·unknown outcome과 exact post-state를 만듭니다.", "duplicate/commit-unknown 요청은 durable key로 하나의 effect와 canonical response를 반환합니다.", "outbox relay는 crash/retry에도 missing 없이 duplicate-tolerant하게 수렴합니다.", "timeout/pool/recovery metrics와 reconciliation이 raw payload 없이 운영됩니다."],
    cleanup: ["isolated schemas·synthetic requests/business/outbox/inbox rows를 run id로 제거합니다.", "temporary credentials와 message topics/exports를 revoke·삭제합니다.", "pool의 active/idle transactions와 locks가 0인지 확인합니다.", "production과 로컬 원본 파일/data는 변경하지 않습니다."],
    extensions: ["saga compensation과 irreversible payment/email boundary를 모델링합니다.", "XA/2PC prepared transaction recovery를 outbox와 비교합니다.", "reactive transaction context와 coroutine/async propagation을 검증합니다.", "PITR 뒤 outbox/consumer exactly-once-effect reconciliation을 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 transaction timeline과 durable post-state를 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "rollback/commit observer visibility를 구분합니다.", "savepoint와 전체 transaction 종료를 구분합니다.", "service failure/success balances를 검산합니다.", "duplicate outbox counts를 확인합니다.", "acknowledgement unknown을 DB key로 해소합니다."], hints: ["exception message보다 새 connection의 durable state를 먼저 보세요."], expectedOutcome: "transaction을 API 호출 묶음이 아니라 outcome·visibility·recovery 계약으로 설명합니다.", solutionOutline: ["boundary→write timeline→failure→outcome→readback 순서입니다."] },
    { difficulty: "응용", prompt: "BoardServiceImpl progression을 multi-write 등록+outbox service로 확장하세요.", requirements: ["local 구조 계수와 transaction gap provenance를 보존합니다.", "service transaction owner와 proxy 호출을 검증합니다.", "rollback rule/savepoint/timeout을 정의합니다.", "request key/payload hash/canonical response를 저장합니다.", "business+outbox atomicity와 relay retry를 구현합니다.", "commit unknown 조회 API를 제공합니다.", "MySQL·Oracle durability/isolation matrix를 실행합니다.", "fault/restore reconciliation runbook을 포함합니다."], hints: ["@Transactional 글자보다 실제 connection과 최종 outcome을 검증하세요."], expectedOutcome: "실패·중복·crash에도 한 번의 business effect로 수렴하는 service가 완성됩니다.", solutionOutline: ["invariant→boundary→rollback matrix→idempotency→outbox→fault/recovery 순서입니다."] },
    { difficulty: "설계", prompt: "조직 transaction governance 표준을 작성하세요.", requirements: ["unit/owner/autocommit rules를 둡니다.", "ACID evidence와 durability SLO를 정의합니다.", "Spring proxy/manager/propagation/rollback rules를 둡니다.", "savepoint 허용 use case를 제한합니다.", "commit unknown/idempotency/retention API를 정의합니다.", "outbox/relay/consumer/reconciliation을 포함합니다.", "timeout/cancel/pool capacity를 정의합니다.", "fault injection/restore/runbook/telemetry를 release gate로 둡니다."], hints: ["transport error와 transaction outcome을 분리하세요."], expectedOutcome: "초급 commit/rollback부터 분산 side-effect 복구까지 일관된 운영 표준이 완성됩니다.", solutionOutline: ["define→atomize→fail→resolve→publish→recover→observe 순서입니다."] },
  ],
  nextSessions: ["db-14-isolation-locking-deadlock"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["02_04.sql 251 logical lines/5,670 bytes를 read-only로 감사해 routine/function progression과 COMMIT·ROLLBACK·SAVEPOINT·TRANSACTION token 0회를 확인했습니다.", "BoardServiceImpl.java 56 logical lines를 read-only로 감사해 active public methods3·mapper calls3, @Transactional/try/catch/throw0을 확인했으며 현재 단일 mapper methods를 결함으로 단정하지 않았습니다.", "원본 sample 사람/업무 값·SQL/Java code·credentials는 복사하지 않고 구조와 명시적 transaction gaps만 provenance로 사용했습니다.", "SQLite exact harness는 MySQL 8.4·Oracle 26ai redo/durability/distributed outcome과 Spring proxy/rollback/resource-binding behavior를 대체하지 않습니다."] },
});

export default session;
