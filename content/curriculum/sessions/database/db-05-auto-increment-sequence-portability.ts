import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id,
    title,
    language: "python",
    filename,
    purpose,
    code,
    walkthrough: [
      { lines: "1-6", explanation: "외부 database·network·credential 없이 identity allocator의 핵심 상태만 deterministic Python 자료구조로 모델링합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "commit·rollback·crash·retry·동시 session처럼 번호 생성에서 놓치기 쉬운 실패 경계를 synthetic fixture로 재현합니다." },
      { lines: "마지막 5줄", explanation: "stable boolean·정렬된 mapping·count만 출력합니다. 이 결과는 개념 불변식을 증명하며 vendor locking·transaction semantics는 MySQL 8.4·Oracle 26ai 통합 시험으로 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리만 사용", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["문서의 stdout과 실제 실행 결과가 완전히 같아야 합니다.", "예제 allocator는 교육용 model이며 production identifier generator 구현으로 복사하지 않습니다."] },
    experiments: [
      { change: "rollback·process crash·retry 위치를 하나씩 바꿉니다.", prediction: "business row가 없더라도 이미 배정되거나 예약된 번호에는 공백이 생길 수 있습니다.", result: "identifier uniqueness와 gapless numbering은 다른 요구사항임을 확인합니다." },
      { change: "두 logical sessions의 실행 순서를 뒤섞습니다.", prediction: "global MAX나 마지막 global allocation은 자신의 insert 결과를 안정적으로 가리키지 않습니다.", result: "driver가 같은 connection/statement에서 반환한 generated key를 사용해야 합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "identity-versus-business-number",
    title: "내부 identity와 사람이 읽는 business number를 분리합니다",
    lead: "PRIMARY KEY의 임무는 row를 안정적으로 참조하는 것이고, 영수증 번호나 접수 순번의 임무는 별도의 법적·업무 규칙을 만족하는 것입니다.",
    explanations: [
      "AUTO_INCREMENT와 SEQUENCE는 unique surrogate identity를 만들기 위한 allocation mechanism입니다. 값이 증가하는 모양 때문에 시간 순서, 처리 순서, 누락 없는 일련번호, 보안상 추측 불가능한 공개 식별자를 동시에 보장한다고 해석하면 안 됩니다. rollback 전에 번호가 소비되거나 concurrent transaction의 commit 순서가 뒤바뀌고 cache·crash로 예약 구간이 사라질 수 있습니다.",
      "원본 dbstudy/01_26_HomeWork.sql은 MySQL book·customer·orders 세 table에 AUTO_INCREMENT primary key를 두고, SPRING/MyWeb/TABLE.sql은 Oracle FREEBOARD_SEQ·FREEREPLY_SEQ와 DEFAULT sequence.NEXTVAL로 게시글·댓글 번호를 만듭니다. 두 자료는 동일한 surrogate identity 목적을 서로 다른 dialect로 구현하지만, gaplessness·외부 공개 정책·migration 기준은 설명하지 않아 이번 세션에서 보완합니다.",
      "법적으로 연속적인 invoice number가 필요하다면 일반 row id와 분리된 business-number service, scope별 lock/serialization, 취소 번호 보존, 감사 trail과 재발행 정책을 설계합니다. 번호가 취소됐다는 사실을 삭제해서 연속처럼 보이게 만드는 대신 왜 사용되지 않았는지 증거를 남깁니다. 정확한 규제 요구는 관할·업무 owner와 확인합니다.",
      "public URL에 1, 2, 3 같은 내부 id를 그대로 노출하면 enumeration이 쉬워질 수 있습니다. authorization은 어떤 id 형식이든 반드시 적용하고, 필요하면 random public id를 별도 UNIQUE column으로 둡니다. 공개 id를 추가해도 접근 통제가 대체되지는 않습니다.",
    ],
    concepts: [
      c("surrogate identity", "business 속성과 독립적으로 row reference를 안정화하는 artificial key입니다.", ["AUTO_INCREMENT·SEQUENCE·UUID 등이 후보입니다.", "business duplicate는 별도 UNIQUE constraint로 막습니다."]),
      c("business number", "사용자·회계·업무 절차가 의미와 형식·scope·감사 규칙을 부여한 번호입니다.", ["internal primary key와 요구사항이 다릅니다.", "취소·재발행·법적 보존 규칙을 포함합니다."]),
    ],
    codeExamples: [py(
      "db05-identity-gap-model",
      "rollback 뒤에도 identity 공백이 생기는 allocator 모델",
      "identity_gap_model.py",
      "번호 배정과 row commit을 분리해 AUTO_INCREMENT·SEQUENCE가 gapless counter가 아닌 이유를 확인합니다.",
      String.raw`next_value = 1
committed = []

def allocate():
    global next_value
    value = next_value
    next_value += 1
    return value

first = allocate()
committed.append(first)
rolled_back = allocate()
third = allocate()
committed.append(third)

print("allocated=" + ",".join(map(str, [first, rolled_back, third])))
print("committed=" + ",".join(map(str, committed)))
print("rollback-consumed=" + str(rolled_back not in committed).lower())
print("gapless=" + str(committed == list(range(1, len(committed) + 1))).lower())
print("next-value=" + str(next_value))`,
      "allocated=1,2,3\ncommitted=1,3\nrollback-consumed=true\ngapless=false\nnext-value=4",
      ["local-db-homework", "local-spring-table", "mysql-auto-example", "mysql-integer-types", "mysql-create-table", "oracle-create-sequence"],
    )],
    diagnostics: [
      d("삭제하거나 rollback한 적이 없는데 id 104 다음이 107이다.", "allocator가 transaction commit과 독립적으로 값을 소비했거나 concurrent insert·cache·failed statement가 중간 값을 사용했습니다.", ["database error/rollback과 concurrent writers를 확인합니다.", "sequence cache와 restart history를 봅니다.", "replica/import가 명시 id를 썼는지 확인합니다."], "데이터 손실로 단정하지 말고 row count·business audit로 확인하며, gapless 요구는 별도 business-number workflow로 구현합니다.", "id monitoring에서 gap 자체를 corruption alert로 쓰지 않고 uniqueness·reference·audit completeness를 검사합니다."),
      d("고객에게 연속 주문 id를 약속했는데 취소 후 번호가 비었다.", "internal surrogate allocator를 업무상 gapless 번호로 재사용했습니다.", ["약관·규제·업무 scope를 확인합니다.", "번호 배정 시점과 취소 기록을 봅니다.", "여러 tenant/연도 scope를 확인합니다."], "internal id를 유지하고 승인된 serialized business numbering과 cancellation ledger를 별도로 도입합니다.", "schema ADR에 identity와 business numbering 요구사항을 분리합니다."),
    ],
    expertNotes: ["순차 id의 크기나 공백을 처리량·사용자 수·민감한 사건의 proxy로 외부에 노출하지 않습니다.", "identity 값은 의미 없는 key로 취급하고 생성 시각·정렬·상태는 명시 columns와 constraints로 모델링합니다."],
  },
  {
    id: "mysql-auto-increment-allocation",
    title: "MySQL AUTO_INCREMENT의 table·statement·transaction 경계를 이해합니다",
    lead: "AUTO_INCREMENT는 column declaration 한 줄이지만 실제 안전성은 storage engine, statement shape, lock mode, replication과 version에 의해 결정됩니다.",
    explanations: [
      "MySQL에서 AUTO_INCREMENT column은 INSERT 시 값을 생략하거나 적절한 자동 생성 표현을 사용하면 새 값을 배정합니다. 직접 큰 값을 insert하거나 table을 재구성·restart할 때 다음 값의 결정이 달라질 수 있으므로 ‘항상 max+1을 transactionally 계산한다’고 가르치지 않습니다. exact behavior는 MySQL 8.4와 사용하는 InnoDB 설정에서 확인합니다.",
      "InnoDB auto-increment locking은 simple insert, bulk/mixed-mode insert, concurrent execution과 replication safety 사이 trade-off가 있습니다. lock mode 이름만 외우기보다 statement가 필요한 row 수를 미리 아는지, interleaving을 허용하는지, statement-based replication에서 deterministic해야 하는지로 판정합니다. 운영 설정을 변경할 때 benchmark와 replication topology를 함께 검토합니다.",
      "allocation과 transaction durability는 다른 경계입니다. INSERT가 이후 rollback돼도 allocator 값을 되돌려 재사용한다고 기대하지 않습니다. uniqueness를 위해 이미 관찰·배정된 값을 재사용하지 않는 정책이 일반적이며, 공백을 메우는 batch는 race·wrong reference·audit 훼손을 만듭니다.",
      "AUTO_INCREMENT column의 signedness·width와 예상 insert rate로 exhaustion horizon을 계산합니다. INT에서 BIGINT로 확장은 큰 table rebuild·foreign key type change·replica lag를 동반할 수 있으므로 사용률이 임계치에 닿기 전에 online migration rehearsal을 수행합니다.",
    ],
    concepts: [
      c("AUTO_INCREMENT", "MySQL이 insert 시 numeric column의 새 surrogate value를 배정하는 column attribute입니다.", ["table·engine·statement context에서 동작합니다.", "연속성이나 commit ordering을 보장하는 business counter가 아닙니다."]),
      c("allocation boundary", "새 id가 예약·반환되는 시점과 row transaction이 commit되는 시점의 구분입니다.", ["rollback이 allocation을 취소한다고 가정하지 않습니다.", "failure injection으로 gap과 retry를 검증합니다."]),
    ],
    diagnostics: [
      d("bulk INSERT 이후 id가 예상보다 크게 건너뛴다.", "bulk/mixed statement가 값을 예약했거나 일부 rows가 실패·무시됐으며 allocator와 committed row 수를 동일시했습니다.", ["statement form과 affected/warning count를 확인합니다.", "sql_mode와 IGNORE/upsert를 봅니다.", "auto-increment lock mode·replication을 확인합니다."], "값을 되돌리지 말고 실제 rows와 domain outcome을 reconciliation하며 필요하면 statement를 staging+validated batches로 바꿉니다.", "bulk acceptance test에 failure·duplicate·rollback 뒤 generated-key mapping을 포함합니다."),
      d("AUTO_INCREMENT가 최대값 근처에서 insert를 거부한다.", "type capacity와 growth horizon을 monitoring하지 않았습니다.", ["actual column type/signedness와 current high-water mark를 봅니다.", "explicit high ids와 partitions/shards를 확인합니다.", "referencing foreign key types를 inventory합니다."], "write freeze·capacity runbook을 적용하고 호환 foreign keys와 함께 더 넓은 type으로 검증된 online migration을 수행합니다.", "percentage뿐 아니라 remaining inserts/time-to-exhaustion alert와 rehearsal을 둡니다."),
    ],
    expertNotes: ["auto_increment_increment/offset을 multi-writer 해법으로 사용할 때 failover·collision·capacity를 현재 topology에서 검증합니다.", "statement/row-based replication, Group Replication과 managed-service defaults는 배포 환경의 공식 문서를 추가로 확인합니다."],
  },
  {
    id: "generated-key-session-scope",
    title: "생성된 키는 같은 connection·statement의 반환값으로 받습니다",
    lead: "INSERT 후 SELECT MAX(id)를 실행하면 내 row가 아니라 그 사이 다른 session이 넣은 row를 받을 수 있습니다.",
    explanations: [
      "driver의 generated keys API나 MySQL LAST_INSERT_ID()처럼 현재 connection에 결부된 mechanism을 사용합니다. connection pool에서는 INSERT를 실행한 logical operation이 같은 physical connection에서 key를 읽도록 framework 계약을 지키고, connection을 반환한 뒤 다시 빌려 LAST_INSERT_ID를 조회하지 않습니다.",
      "SELECT MAX(id), ORDER BY id DESC LIMIT 1, 현재 sequence 값 조회는 자신의 insert 결과를 식별하지 못합니다. 두 transactions의 allocation·commit·query 순서가 섞이면 다른 사용자의 row를 후속 child insert에 연결하는 심각한 integrity/privacy 사고가 됩니다. foreign key는 존재하는 잘못된 parent를 가리키는 오류까지 막지 못합니다.",
      "multi-row insert에서 반환되는 keys의 개수·순서와 driver 지원은 JDBC·connector·statement rewrite 설정에 따라 검증합니다. 첫 key에 +1을 해서 나머지를 추측하면 interleaving·increment 설정·triggers 때문에 틀릴 수 있습니다. API가 완전한 mapping을 제공하지 않으면 client correlation token을 staging row에 넣어 readback합니다.",
      "retry 시 첫 insert가 commit됐지만 response를 잃었을 수 있습니다. 무조건 새 id로 재삽입하지 말고 scoped idempotency key UNIQUE와 stored outcome으로 원래 row를 찾습니다. generated key는 retry identity가 아니라 성공한 storage row identity입니다.",
    ],
    concepts: [
      c("generated key", "database가 특정 insert statement에 배정해 driver/API로 반환한 row identity입니다.", ["같은 operation과 connection context에서 수신합니다.", "global maximum으로 재구성하지 않습니다."]),
      c("connection scope", "session state와 generated-key function이 묶이는 physical database connection 경계입니다.", ["pool 반환 전 읽습니다.", "transaction/context propagation을 test합니다."]),
    ],
    codeExamples: [py(
      "db05-session-key-race",
      "global maximum과 session-scoped key의 race 비교",
      "session_key_race.py",
      "두 sessions가 교차 insert할 때 MAX가 첫 session의 row를 잘못 선택하지만 statement 반환 key는 유지됨을 보여 줍니다.",
      String.raw`rows = []
next_id = 1
session_keys = {}

def insert(session, value):
    global next_id
    row = {"id": next_id, "owner": session, "value": value}
    next_id += 1
    rows.append(row)
    session_keys[session] = row["id"]

insert("A", "alpha")
insert("B", "beta")
global_max_for_a = max(row["id"] for row in rows)
scoped_for_a = session_keys["A"]

print("rows=" + ";".join(f'{row["id"]}:{row["owner"]}' for row in rows))
print("global-max-for-a=" + str(global_max_for_a))
print("session-key-for-a=" + str(scoped_for_a))
print("max-selected-wrong-owner=" + str(rows[global_max_for_a - 1]["owner"] != "A").lower())
print("scoped-selected-correct-owner=" + str(rows[scoped_for_a - 1]["owner"] == "A").lower())`,
      "rows=1:A;2:B\nglobal-max-for-a=2\nsession-key-for-a=1\nmax-selected-wrong-owner=true\nscoped-selected-correct-owner=true",
      ["mysql-last-insert-id", "mysql-auto-example", "mysql-innodb-auto", "jakarta-generation-type"],
    )],
    diagnostics: [
      d("주문 생성 직후 엉뚱한 고객의 상세가 반환된다.", "generated key 대신 SELECT MAX(id) 또는 global latest row를 조회했습니다.", ["trace의 connection/statement ordering을 확인합니다.", "후속 SELECT와 concurrent insert를 봅니다.", "child foreign key가 어느 parent를 참조했는지 audit합니다."], "영향 rows를 격리·복구하고 driver generated-key API/RETURNING에 기반한 atomic mapping으로 수정합니다.", "barrier를 둔 concurrent integration test와 MAX(id) anti-pattern lint를 추가합니다."),
      d("connection pool을 켠 뒤 LAST_INSERT_ID 결과가 0이거나 다른 값이다.", "INSERT connection을 pool에 반환한 뒤 다른 physical connection에서 session function을 호출했습니다.", ["pool connection identity와 borrow/return trace를 봅니다.", "transaction proxy 경계를 확인합니다.", "framework generated-key configuration을 검토합니다."], "insert와 key read를 하나의 driver statement/transaction API 경계로 묶습니다.", "pool size를 늘린 concurrent test에서 key-owner mapping을 반복 검증합니다."),
    ],
    expertNotes: ["trigger가 다른 auto-generated row를 만들 때 driver/function이 무엇을 반환하는지 exact connector version에서 test합니다.", "generated key와 domain response를 outbox/idempotency record와 같은 transaction에 저장하면 ambiguous success 복구가 쉬워집니다."],
  },
  {
    id: "oracle-sequence-semantics",
    title: "Oracle SEQUENCE를 table 밖의 독립 allocator로 이해합니다",
    lead: "SEQUENCE.NEXTVAL은 row와 별도로 새 값을 반환하며 여러 tables·sessions가 사용할 수 있는 schema object입니다.",
    explanations: [
      "CREATE SEQUENCE는 START WITH, INCREMENT BY, MINVALUE/MAXVALUE, CYCLE/NOCYCLE, CACHE/NOCACHE 등의 속성으로 generator를 정의합니다. 원본 TABLE.sql은 INCREMENT BY 1 START WITH 1 NOCACHE를 사용하고 column DEFAULT FREEBOARD_SEQ.NEXTVAL·FREEREPLY_SEQ.NEXTVAL로 값을 공급합니다. NOCACHE가 gaplessness를 보장한다는 뜻은 아닙니다.",
      "NEXTVAL을 참조하면 sequence가 증가하고 값을 반환합니다. CURRVAL은 현재 session이 먼저 NEXTVAL을 얻은 뒤 그 session에서 의미가 있습니다. 다른 session의 가장 최근 값을 찾는 global function으로 사용하지 않습니다. 사용 가능한 SQL 위치·제약은 Oracle 26ai 공식 Sequence Pseudocolumns 문서로 확인합니다.",
      "sequence는 특정 table에 소유된 primary key constraint가 아닙니다. 잘못된 code가 같은 sequence를 여러 entity에 공유할 수도 있고 반대로 복제된 sequences가 collision을 만들 수도 있습니다. DDL ownership, grants, synonyms, schema qualification과 사용처 inventory를 관리합니다.",
      "DEFAULT sequence.NEXTVAL은 insert에서 id를 생략하는 편의와 database-owned default를 제공합니다. 명시 NULL·ORM binding·trigger/default precedence가 어떻게 동작하는지 통합 test하고, 생성된 값을 RETURNING 또는 driver generated keys로 받아 후속 operation에 사용합니다.",
    ],
    concepts: [
      c("sequence", "Oracle schema가 독립적으로 관리하는 numeric value generator입니다.", ["NEXTVAL로 값을 소비합니다.", "table row transaction과 동일한 rollback 의미를 갖지 않습니다."]),
      c("NEXTVAL/CURRVAL", "NEXTVAL은 새 sequence 값을 반환하고 증가시키며 CURRVAL은 session이 얻은 현재 값을 참조합니다.", ["CURRVAL 전에 같은 session의 NEXTVAL이 필요합니다.", "global latest row 검색 기능이 아닙니다."]),
    ],
    diagnostics: [
      d("ORA 오류로 CURRVAL을 바로 읽을 수 없다.", "현재 session에서 NEXTVAL을 먼저 참조하지 않았습니다.", ["같은 physical session인지 확인합니다.", "pool이 connection을 바꿨는지 봅니다.", "insert가 default로 sequence를 실제 소비했는지 확인합니다."], "RETURNING/generated keys를 우선 사용하고 CURRVAL이 필요하면 같은 session의 명시 NEXTVAL 계약을 지킵니다.", "pool·default·trigger 조합의 integration test를 둡니다."),
      d("두 application schema에서 sequence 값이 충돌한다.", "서로 독립인 sequences가 같은 target keyspace에 값을 생성하거나 shared sequence qualification이 drift했습니다.", ["owner.sequence와 synonym/grant를 확인합니다.", "target unique scope와 ingestion path를 봅니다.", "environment clone/reset history를 확인합니다."], "하나의 authoritative allocator 또는 충돌 없는 shard/range design으로 통합하고 existing collision을 mapping합니다.", "sequence ownership manifest와 cross-schema negative test를 둡니다."),
    ],
    expertNotes: ["ALTER SEQUENCE로 START WITH를 단순 재설정한다고 생각하지 말고 exact version syntax·existing values·concurrency를 확인합니다.", "identity column도 내부 sequence-like mechanism과 ORM behavior가 있으므로 DDL 표현만 보고 allocation semantics를 추정하지 않습니다."],
  },
  {
    id: "sequence-cache-crash-order",
    title: "CACHE·crash·ORDER trade-off를 처리량과 공백 허용으로 결정합니다",
    lead: "sequence cache는 매 값마다 persistent state를 갱신하지 않아 throughput을 높이지만 instance failure 시 아직 쓰지 않은 예약 값이 사라질 수 있습니다.",
    explanations: [
      "CACHE는 일정 구간을 memory에서 빠르게 제공하도록 준비합니다. crash·shutdown·failover 때 사용하지 않은 cached values가 건너뛰어 보일 수 있습니다. 이는 committed row 손실과 구분해야 하며, NOCACHE로 바꿔도 rollback·failed statement·concurrent ordering에서 공백이 완전히 없어지지 않습니다.",
      "cache size는 peak allocation rate, restart/failover frequency, 허용 가능한 lost range, latch/redo overhead와 recovery expectation으로 benchmark합니다. 단순히 공백이 보기 싫다는 이유로 NOCACHE를 선택해 hot sequence 병목을 만들지 않습니다. 반대로 드물게 쓰는 통제 번호라면 처리량보다 audit rule이 중요할 수 있습니다.",
      "multiple instances에서 요청 순서와 numeric order를 맞추려는 ORDER 옵션은 scalability cost를 가질 수 있습니다. sequence number order는 transaction commit time, event time, causal order를 완전히 나타내지 않습니다. ordering이 필요한 domain은 explicit timestamp+tie-breaker, log offset 또는 consensus-owned sequence를 설계합니다.",
      "monitoring은 last/high value만 보지 않고 allocation rate, cache settings, instance restart, failed writes, maxvalue horizon을 함께 봅니다. cache jump를 데이터 유실 alert로 오인하지 않고 business row/event completeness를 별도로 reconciliation합니다.",
    ],
    concepts: [
      c("sequence cache", "미리 확보한 sequence values를 memory에서 제공해 allocation overhead를 낮추는 설정입니다.", ["crash 때 unused cached values가 사라질 수 있습니다.", "cache size는 workload evidence로 정합니다."]),
      c("ordering illusion", "증가하는 identifier가 실제 commit·event·causal 순서를 그대로 뜻한다고 잘못 해석하는 현상입니다.", ["concurrent transactions의 commit 순서는 달라질 수 있습니다.", "정렬 요구에는 별도 data를 둡니다."]),
    ],
    codeExamples: [py(
      "db05-sequence-cache-crash",
      "sequence cache 일부 사용 후 crash 공백 모델",
      "sequence_cache_crash.py",
      "두 cache block 중 사용되지 않은 첫 block 값이 restart 뒤 재사용되지 않는 안전한 allocator model을 실행합니다.",
      String.raw`cache_size = 5
persistent_next = 1

def reserve_block():
    global persistent_next
    block = list(range(persistent_next, persistent_next + cache_size))
    persistent_next += cache_size
    return block

first_block = reserve_block()
used_before_crash = first_block[:2]
lost_on_crash = first_block[2:]
second_block = reserve_block()
used_after_restart = second_block[:2]

print("used-before=" + ",".join(map(str, used_before_crash)))
print("lost-cache=" + ",".join(map(str, lost_on_crash)))
print("used-after=" + ",".join(map(str, used_after_restart)))
print("persistent-next=" + str(persistent_next))
print("duplicate-after-restart=" + str(bool(set(used_before_crash) & set(used_after_restart))).lower())`,
      "used-before=1,2\nlost-cache=3,4,5\nused-after=6,7\npersistent-next=11\nduplicate-after-restart=false",
      ["oracle-create-sequence", "oracle-sequence-pseudocolumns"],
    )],
    diagnostics: [
      d("instance restart 후 sequence가 cache 크기만큼 점프했다.", "crash 시 unused cached range가 폐기됐습니다.", ["sequence CACHE 설정과 restart time을 확인합니다.", "commit된 rows/audit events를 reconciliation합니다.", "다른 explicit allocation도 확인합니다."], "business data가 온전하면 번호를 되감지 말고 expected allocator behavior로 기록합니다.", "runbook에 cache-gap 판정과 data-loss 판정을 분리합니다."),
      d("hot sequence에서 insert latency와 contention이 증가한다.", "NOCACHE·ORDER 또는 지나치게 작은 cache로 allocation serialization cost가 커졌습니다.", ["wait events와 allocation rate를 봅니다.", "instance topology와 ORDER 요구를 확인합니다.", "sequence를 공유하는 entities를 inventory합니다."], "실제 ordering 요구를 제거·분리하고 benchmark로 cache/sequence partitioning을 조정합니다.", "peak-load failure/restart benchmark와 SLO를 유지합니다."),
    ],
    expertNotes: ["cache tuning 전후에 throughput만 아니라 crash recovery, maxvalue, observability와 audit 해석을 함께 승인합니다.", "RAC·Data Guard·managed Oracle topology의 구체 동작은 해당 배포 버전 공식 문서와 rehearsal로 확인합니다."],
  },
  {
    id: "bulk-insert-retry-idempotency",
    title: "bulk insert와 retry에서 key-to-row mapping을 보존합니다",
    lead: "여러 rows를 빠르게 넣는 것보다 각 입력이 어느 저장 row가 되었는지, 실패·재시도 뒤에도 side effect가 하나인지 증명하는 일이 먼저입니다.",
    explanations: [
      "batch의 generated keys가 input order와 정확히 대응하는지 driver·rewriteBatchedStatements·RETURNING 지원을 exact version에서 시험합니다. partial failure 때 성공 rows, failed rows, retried rows를 correlation id로 구분하지 못하면 generated id list만으로 복구할 수 없습니다.",
      "client_request_id 같은 scoped idempotency key에 UNIQUE를 두고 normalized payload hash와 result id를 같은 transaction에 저장합니다. 같은 key·같은 payload retry는 저장된 result를 반환하고, 같은 key·다른 payload는 conflict로 거부합니다. in-progress lease와 timeout takeover도 state machine으로 정의합니다.",
      "INSERT IGNORE나 broad upsert는 오류를 숨기고 ‘성공’처럼 보일 수 있습니다. 어떤 constraint가 duplicate를 의미하는지, update할 columns와 version predicate, warning count를 명시합니다. identity가 새로 배정됐다는 사실과 domain operation이 새로 수행됐다는 사실을 혼동하지 않습니다.",
      "outbox event는 entity와 같은 transaction에서 generated entity id·idempotency key를 기록합니다. commit 후 publish 실패는 outbox relay가 재시도하고 consumer는 event id를 deduplicate합니다. database insert를 재시도해 duplicate entity를 만드는 방식으로 message failure를 보상하지 않습니다.",
    ],
    concepts: [
      c("correlation key", "batch input과 저장된 output row를 retry 이후에도 연결하는 client-owned stable token입니다.", ["generated numeric id와 별도로 둡니다.", "scope와 uniqueness를 constraint로 강제합니다."]),
      c("ambiguous success", "server가 commit했는지 client가 알기 전에 timeout/connection loss가 발생한 상태입니다.", ["새 insert 전에 idempotency record를 조회합니다.", "blind retry를 피합니다."]),
    ],
    diagnostics: [
      d("batch timeout 재시도 후 같은 주문이 두 개 생겼다.", "첫 transaction의 commit 여부를 확인하지 않고 새 generated id로 전체 batch를 재삽입했습니다.", ["idempotency/correlation keys를 확인합니다.", "server commit log와 timeout 시점을 봅니다.", "partial success와 retry subset을 재구성합니다."], "duplicate side effects를 격리하고 scoped UNIQUE idempotency record 기반으로 existing result를 반환하도록 수정합니다.", "commit-response loss를 주입하는 integration test를 둡니다."),
      d("batch generated key 수와 input row 수가 다르다.", "partial failure·duplicate-ignore·driver rewrite 또는 connector 반환 계약을 고려하지 않았습니다.", ["update counts/warnings/exceptions를 row별 확인합니다.", "driver and server versions/settings를 기록합니다.", "input correlation tokens로 actual rows를 조회합니다."], "position 추측을 중단하고 RETURNING/correlation-token staging으로 deterministic mapping을 만듭니다.", "version matrix마다 mixed success batch contract test를 실행합니다."),
    ],
    expertNotes: ["idempotency records의 retention을 너무 짧게 잡으면 늦은 retry가 새 operation이 되며 너무 길면 storage/privacy cost가 생깁니다.", "payload hash에는 secret·raw PII를 그대로 저장하지 말고 canonicalization version과 safe comparison policy를 설계합니다."],
  },
  {
    id: "jpa-generation-strategy-portability",
    title: "JPA GenerationType을 dialect convenience가 아니라 allocation contract로 선택합니다",
    lead: "IDENTITY·SEQUENCE·TABLE·AUTO는 annotation 이름보다 flush timing, batching, round trips, allocation size와 target database capability가 더 중요합니다.",
    explanations: [
      "GenerationType.IDENTITY는 identity column에 의존하며 insert가 실행돼야 id를 알 수 있는 흐름이 batching과 persistence context flush timing에 영향을 줄 수 있습니다. GenerationType.SEQUENCE는 sequence-capable database에서 insert 전에 값을 확보할 수 있고 allocationSize와 provider optimizer가 database sequence increment/cache와 맞아야 합니다.",
      "GenerationType.AUTO는 provider와 dialect가 전략을 선택하므로 MySQL에서 Oracle로 옮기면 같은 source annotation이 다른 DDL·round trip·id pattern을 만들 수 있습니다. portability는 컴파일 성공이 아니라 schema generation, migration, batching, retry, generated-key mapping, performance가 두 target에서 acceptance를 통과하는 상태입니다.",
      "TABLE generator는 별도 table row를 update해 값을 할당할 수 있어 contention과 transaction coordination을 검토합니다. vendor-neutral처럼 보여도 hot row와 failure recovery cost가 큽니다. native capability를 숨기는 추상화가 운영 semantics까지 동일하게 만들지는 않습니다.",
      "ORM이 schema를 자동 생성하게 두기보다 production migrations에서 sequence/table/column과 increment·allocation settings를 명시하고 application mapping과 catalog를 cross-check합니다. 여러 service/provider versions가 같은 generator를 쓴다면 allocation ranges가 충돌하지 않는지 compatibility window를 둡니다.",
    ],
    concepts: [
      c("GenerationType", "Jakarta Persistence가 entity primary key 생성 전략을 표현하는 enum 계약입니다.", ["IDENTITY·SEQUENCE·TABLE·AUTO를 제공합니다.", "provider·database별 runtime behavior를 검증합니다."]),
      c("allocationSize", "ORM generator가 한 번에 확보·관리하는 id allocation 단위입니다.", ["database sequence increment/cache와 조율합니다.", "provider optimizer version을 test합니다."]),
    ],
    diagnostics: [
      d("Oracle 이관 뒤 entity id가 크게 뛰거나 duplicate 오류가 난다.", "@SequenceGenerator allocationSize와 actual sequence increment/기존 high value가 맞지 않거나 여러 versions가 다른 optimizer를 사용합니다.", ["annotation·provider metadata와 catalog sequence definition을 비교합니다.", "deployment versions와 shared writers를 봅니다.", "existing max/high-water and reserved ranges를 확인합니다."], "writes를 통제하고 collision-free high value로 정렬한 뒤 한 compatibility configuration으로 단계 배포합니다.", "schema/application generator manifest와 mixed-version concurrency test를 둡니다."),
      d("MySQL IDENTITY 사용 뒤 JDBC batch throughput이 급락한다.", "id를 얻기 위해 insert/flush 경계가 앞당겨져 provider batching 최적화가 제한됐습니다.", ["SQL/flush trace와 batch sizes를 봅니다.", "provider/driver generated-key support를 확인합니다.", "business transaction ordering 요구를 검토합니다."], "정확성을 유지하며 provider-supported batching, sequence-capable target 또는 application-owned alternatives를 benchmark합니다.", "strategy별 latency/round trips/failure behavior를 release benchmark로 유지합니다."),
    ],
    expertNotes: ["Jakarta Persistence spec/API와 사용하는 Hibernate/EclipseLink exact version 문서를 함께 읽고 provider extension을 표준 behavior로 과장하지 않습니다.", "equals/hashCode에 generated id만 사용하면 transient entity의 id-null lifecycle 문제가 생길 수 있어 entity identity 설계와 함께 검토합니다."],
  },
  {
    id: "hilo-block-allocation",
    title: "hi/lo와 block allocation의 처리량·공백·충돌 조건을 계산합니다",
    lead: "여러 application instances가 allocator에 매 row 접근하지 않도록 구간을 예약할 수 있지만, block 소유권과 설정 불일치는 대규모 collision을 만듭니다.",
    explanations: [
      "hi/lo 계열은 database에서 high value를 얻고 process가 low range를 locally 생성합니다. round trips와 contention은 줄지만 process crash 시 남은 block이 공백이 되고, allocationSize 변경이나 서로 다른 algorithm이 같은 sequence를 공유하면 ranges가 겹칠 수 있습니다.",
      "block의 식은 provider마다 다를 수 있으므로 `(hi-1)*size + low` 같은 예시를 production 계약으로 추정하지 않습니다. exact provider version의 algorithm, initial value, database increment, pooled/pooled-lo optimizer와 migration behavior를 official docs/source와 black-box tests로 확인합니다.",
      "rolling deployment 중 old size 50과 new size 100이 동시에 실행될 때 안전한지 증명해야 합니다. 설정 변경은 application config 한 줄이 아니라 allocator protocol change입니다. compatibility phase, reserved cutover range, writer drain 또는 새 sequence가 필요할 수 있습니다.",
      "allocated block은 process-local cache이므로 transaction rollback과 독립적입니다. 번호 공백을 줄이려고 shutdown 때 unused ids를 global pool에 반환하면 stale process·network partition에서 재사용 collision이 생길 수 있습니다. uniqueness를 공백보다 우선합니다.",
    ],
    concepts: [
      c("hi/lo allocation", "global high value와 local low counter를 결합해 id 구간을 client/process에서 생성하는 기법입니다.", ["allocator round trips를 줄입니다.", "crash gaps와 configuration compatibility를 수용합니다."]),
      c("allocator protocol", "여러 writers가 중복 없는 ranges를 해석·예약하는 versioned 규칙입니다.", ["size·formula·initial value를 포함합니다.", "rolling upgrade compatibility가 필요합니다."]),
    ],
    codeExamples: [py(
      "db05-hilo-allocation",
      "두 workers의 겹치지 않는 block allocation",
      "hilo_allocation.py",
      "global block number와 local offsets로 두 workers가 disjoint ids를 생성하고 crash unused range를 재사용하지 않는 model입니다.",
      String.raw`block_size = 4
next_block = 0

def reserve(worker):
    global next_block
    start = next_block * block_size + 1
    next_block += 1
    return {"worker": worker, "ids": list(range(start, start + block_size))}

a = reserve("A")
b = reserve("B")
used_a = a["ids"][:2]
unused_a_after_crash = a["ids"][2:]
used_b = b["ids"]

print("worker-a=" + ",".join(map(str, used_a)))
print("worker-b=" + ",".join(map(str, used_b)))
print("unused-a=" + ",".join(map(str, unused_a_after_crash)))
print("overlap=" + str(bool(set(a["ids"]) & set(b["ids"]))).lower())
print("next-block=" + str(next_block))`,
      "worker-a=1,2\nworker-b=5,6,7,8\nunused-a=3,4\noverlap=false\nnext-block=2",
      ["jakarta-sequence-generator", "jakarta-generation-type", "oracle-create-sequence"],
    )],
    diagnostics: [
      d("rolling deploy 직후 primary key collision이 발생한다.", "old/new applications가 allocation size·formula·sequence increment를 다르게 해석해 ranges가 겹쳤습니다.", ["각 instance version/config와 allocated ranges를 수집합니다.", "sequence catalog/history를 확인합니다.", "collision rows와 external effects를 격리합니다."], "writers를 안전하게 중지하고 authoritative mapping으로 복구한 뒤 새 non-overlapping allocator protocol로 cutover합니다.", "mixed-version soak test와 generator configuration compatibility gate를 둡니다."),
      d("instance crash마다 수십 개 id 공백이 생긴다.", "process가 block을 미리 예약하고 일부만 사용했습니다.", ["allocation size와 crash/redeploy rate를 봅니다.", "실제 uniqueness/data completeness를 확인합니다.", "block throughput benefit을 측정합니다."], "공백이 허용되면 정상으로 문서화하고, 비용이 크면 안전한 범위에서 block size를 benchmark 조정합니다.", "공백을 corruption으로 오인하지 않는 dashboard와 business-number 분리를 유지합니다."),
    ],
    expertNotes: ["autoscaling·serverless 환경은 process churn이 커서 큰 local blocks의 waste와 exhaustion horizon을 다시 계산합니다.", "allocator state를 backup/restore할 때 application snapshot보다 뒤로 돌아가면 collision하므로 data high-water와 함께 복구합니다."],
  },
  {
    id: "alternative-identifiers",
    title: "UUID·time-sortable·distributed ids를 locality·privacy·clock failure로 비교합니다",
    lead: "AUTO_INCREMENT와 SEQUENCE의 대안도 ‘분산이라 안전하다’가 아니라 collision model, index cost, 정보 노출과 운영 복구를 증명해야 합니다.",
    explanations: [
      "random UUID는 database round trip 없이 생성하고 enumeration을 어렵게 할 수 있지만 넓은 key와 random insertion이 index locality·secondary indexes·cache에 비용을 줍니다. 충분한 randomness와 CSPRNG가 필요하며 UUID를 사용해도 authorization을 생략할 수 없습니다.",
      "time-sortable identifiers는 대략적인 생성 시간 순서와 index locality를 개선할 수 있지만 timestamp bits가 생성 시각·처리량을 노출하고 같은 tick의 ordering/randomness 규칙이 필요합니다. clock rollback, leap behavior, node restart와 monotonicity failure를 test합니다.",
      "Snowflake-like ids는 timestamp, node/worker, per-tick sequence를 조합합니다. node id leasing이 중복되거나 clock이 뒤로 가고 per-tick capacity를 넘으면 collision·stall이 생길 수 있습니다. bit layout이 lifetime·nodes·rate를 제한하므로 capacity equation과 rollover date를 문서화합니다.",
      "internal clustered bigint와 external random public id를 함께 쓰면 storage locality와 privacy를 분리할 수 있지만 두 unique indexes와 lookup 비용이 생깁니다. public id rotation/alias, logging redaction, API validation과 incident enumeration controls를 포함해 결정합니다.",
    ],
    concepts: [
      c("collision domain", "identifier uniqueness를 보장해야 하는 writers·time·namespace의 전체 범위입니다.", ["node assignment와 restore clone을 포함합니다.", "확률과 운영 failure를 모두 평가합니다."]),
      c("index locality", "새 key가 기존 B-tree pages와 가까운 위치에 들어가 write/cache 효율에 주는 특성입니다.", ["random keys는 분산 insert를 만들 수 있습니다.", "실제 engine/workload benchmark가 필요합니다."]),
    ],
    diagnostics: [
      d("복제한 test environment가 production으로 events를 보내 UUID/id collision을 만든다.", "environment namespace·credentials·event sinks가 격리되지 않았거나 deterministic seed를 재사용했습니다.", ["id generator entropy/node config를 봅니다.", "clone 시 secrets/endpoints를 확인합니다.", "collision domain과 affected consumers를 추적합니다."], "잘못된 producer를 차단하고 namespace-aware identity와 environment isolation으로 재발급·mapping합니다.", "restore/clone acceptance에 outbound deny와 generator uniqueness test를 둡니다."),
      d("time-based id generator가 clock rollback 뒤 멈추거나 중복된다.", "wall clock monotonicity를 가정했고 rollback policy·persisted last timestamp가 없습니다.", ["NTP/VM clock events를 확인합니다.", "generator last timestamp/node lease를 봅니다.", "same-tick capacity와 fallback을 재현합니다."], "검증된 library/protocol의 wait/fail/alternate epoch policy를 적용하고 ambiguous ids를 격리합니다.", "clock rollback·node duplication·rate saturation chaos tests를 둡니다."),
    ],
    expertNotes: ["식별자 format은 API contract가 되므로 type/length/case/canonical text와 validation을 versioning합니다.", "보안 목적이면 identifier unpredictability는 보조 통제일 뿐 object-level authorization·rate limiting·audit가 핵심입니다."],
  },
  {
    id: "cross-database-migration",
    title: "MySQL AUTO_INCREMENT에서 Oracle SEQUENCE로 의미를 보존해 이관합니다",
    lead: "DDL 치환보다 기존 key 보존, next high-water, foreign references, generated-key API와 rolling writers를 함께 옮겨야 합니다.",
    explanations: [
      "기존 primary keys는 가능한 그대로 보존해 child foreign keys, external references, cache와 events를 깨지 않습니다. target table을 explicit ids로 load한 뒤 sequence 시작점을 imported maximum보다 안전하게 높이고, concurrent source writes가 있다면 change data capture와 cutover watermark를 반영합니다.",
      "`AUTO_INCREMENT`를 `DEFAULT sequence.NEXTVAL`로 문법 치환하는 동안 ORM GenerationType, JDBC generated keys/RETURNING, batch behavior, trigger/default precedence와 error mapping이 바뀝니다. source와 target dual-run contract tests에서 create→child reference→retry→rollback→bulk mapping을 비교합니다.",
      "sequence name, owner, grants, cache, increment, maxvalue와 table default는 migration manifest로 관리합니다. sequence만 생성하고 default/grant를 빼먹거나 schema-qualified name이 달라져 application insert가 실패하는 partial DDL을 catalog readback으로 차단합니다.",
      "rollback은 target에서 새로 생성된 ids가 source의 future AUTO_INCREMENT range와 충돌하지 않게 해야 합니다. cutover 전 high range reservation, write fencing 또는 one-way migration을 결정하고, 양쪽에서 동시에 같은 keyspace에 write하지 않습니다.",
    ],
    concepts: [
      c("high-water mark", "이미 사용·예약됐거나 이관될 수 있어 새 allocator가 넘어야 하는 최대 identity 경계입니다.", ["committed MAX만 보지 않습니다.", "CDC in-flight·reserved blocks·explicit imports를 포함합니다."]),
      c("write fencing", "cutover 중 두 allocators가 같은 authoritative keyspace에 동시에 write하지 못하게 하는 통제입니다.", ["lease/epoch/read-only gate를 사용할 수 있습니다.", "rollback 조건과 함께 검증합니다."]),
    ],
    codeExamples: [py(
      "db05-migration-key-map",
      "기존 ids를 보존하고 target next value를 계산하는 migration model",
      "migration_key_map.py",
      "parent/child references를 그대로 유지하고 imported·reserved high-water 위에서 target allocation을 시작합니다.",
      String.raw`source_parents = [{"id": 3, "name": "A"}, {"id": 8, "name": "B"}]
source_children = [{"id": 20, "parent_id": 8}]
reserved_source_high = 10

target_parents = [dict(row) for row in source_parents]
target_children = [dict(row) for row in source_children]
target_next = max(reserved_source_high, *(row["id"] for row in target_parents)) + 1
new_parent = {"id": target_next, "name": "C"}
target_parents.append(new_parent)

parent_ids = {row["id"] for row in target_parents}
references_valid = all(row["parent_id"] in parent_ids for row in target_children)
old_ids_preserved = target_parents[:2] == source_parents

print("source-ids=" + ",".join(str(row["id"]) for row in source_parents))
print("target-next=" + str(target_next))
print("new-id=" + str(new_parent["id"]))
print("old-ids-preserved=" + str(old_ids_preserved).lower())
print("references-valid=" + str(references_valid).lower())`,
      "source-ids=3,8\ntarget-next=11\nnew-id=11\nold-ids-preserved=true\nreferences-valid=true",
      ["local-db-homework", "local-spring-table", "mysql-auto-example", "oracle-create-sequence", "oracle-insert-returning", "jakarta-generation-type"],
    )],
    diagnostics: [
      d("이관 직후 target insert가 기존 primary key와 충돌한다.", "sequence start가 imported/reserved/CDC high-water보다 낮았습니다.", ["target sequence LAST_NUMBER/state와 table keys를 확인합니다.", "late source writes·reserved ORM blocks를 봅니다.", "explicit import/trigger behavior를 확인합니다."], "writes를 fence하고 모든 high-water evidence보다 큰 검증된 경계로 allocator를 이동한 뒤 충돌 rows를 reconciliation합니다.", "cutover preflight에 table max만 아닌 reserved/in-flight ranges를 포함합니다."),
      d("rollback 후 source DB에서 target이 만든 id와 충돌한다.", "두 allocators가 같은 미래 range를 썼고 rollback range reservation이 없었습니다.", ["cutover 이후 양쪽 생성 ids를 비교합니다.", "source AUTO_INCREMENT high-water를 봅니다.", "external writes와 replay events를 확인합니다."], "split-brain writes를 중단하고 authoritative mapping/epoch로 복구하며 source allocator를 안전 범위 위로 이동합니다.", "write fencing과 rollback drill 없이는 양방향 cutover를 승인하지 않습니다."),
    ],
    expertNotes: ["zero-downtime migration에서 key generation은 data copy보다 먼저 합의해야 하는 distributed ownership 문제입니다.", "identity mapping table을 만들 경우 원본/대상 key, migration run, checksum을 보존하고 PII와 결합하지 않습니다."],
  },
  {
    id: "capacity-observability-recovery",
    title: "capacity·catalog·backup·restore·보안으로 allocator 운영을 닫습니다",
    lead: "키 생성이 평소 잘 되는 것만으로 충분하지 않습니다. exhaustion, drift, restore rollback, clone과 emergency failover에서도 중복 없이 계속되어야 합니다.",
    explanations: [
      "catalog에서 column type/signedness/identity attributes, sequence owner·increment·cache·cycle·max, table default, grants와 ORM expected configuration을 정기적으로 diff합니다. CYCLE은 primary key에서 기존 값과 재충돌할 수 있으므로 단순 수명 연장 옵션으로 켜지 않습니다.",
      "capacity는 current high-water, remaining values, peak/average allocation rate, reserved blocks와 growth acceleration로 time-to-exhaustion을 계산합니다. alert가 울린 뒤 emergency ALTER를 하는 대신 wider type/new sequence migration과 foreign key compatibility를 충분히 rehearsal합니다.",
      "backup에서 data와 sequence/identity state의 시점이 어긋나 target allocator가 restored maximum 아래로 돌아갈 수 있습니다. restore acceptance에서 모든 tables의 used/reserved high-water를 계산하고 새 insert·concurrent insert·rollback·generated-key mapping을 isolated environment에서 시험합니다.",
      "DDL grants는 application이 NEXTVAL 또는 insert default에 필요한 최소 권한만 갖도록 합니다. PUBLIC synonym/broad grants와 shared schema sequence는 blast radius를 키웁니다. observability에는 id 값 전체나 고객 correlation을 무분별하게 기록하지 않고 allocator name, rate, remaining horizon, error category를 남깁니다.",
    ],
    concepts: [
      c("exhaustion horizon", "현재 allocator 범위가 workload growth에서 소진될 것으로 예상되는 시간입니다.", ["reserved/unused blocks를 고려합니다.", "migration lead time보다 일찍 alert합니다."]),
      c("restore monotonicity", "복구된 allocator가 이미 존재하거나 외부에 발행된 identity와 충돌하지 않는 방향으로 계속되는 조건입니다.", ["data MAX만으로 충분하지 않을 수 있습니다.", "events·reserved ranges·failover writers를 포함합니다."]),
    ],
    diagnostics: [
      d("backup restore 후 첫 insert들이 duplicate key로 실패한다.", "restored sequence/identity state가 restored data 또는 외부 발행 high-water보다 뒤입니다.", ["table max와 allocator state를 비교합니다.", "backup consistency point와 sequence metadata 포함 여부를 봅니다.", "reserved blocks·downstream events를 확인합니다."], "격리 상태에서 allocator를 모든 known high-water 위로 안전하게 조정하고 negative/concurrent tests 후 service를 엽니다.", "restore runbook에 allocator catalog/readback와 first-write acceptance를 필수화합니다."),
      d("sequence 사용 권한 오류가 일부 instance에서만 발생한다.", "owner/grant/synonym이 environment별 drift했거나 application이 다른 schema qualification을 사용합니다.", ["effective user와 object grants를 비교합니다.", "default expression owner와 synonyms를 봅니다.", "fleet catalog manifest를 확인합니다."], "명시 schema-owned object와 least-privilege grant migration을 idempotently 적용합니다.", "배포 전 모든 instance에서 catalog/grant smoke test를 수행합니다."),
    ],
    expertNotes: ["allocator SLO는 값의 연속성이 아니라 unique allocation availability, collision zero, mapping correctness와 recovery time으로 정의합니다.", "emergency manual sequence jump·explicit id insert는 change ticket와 before/after catalog evidence를 남기고 자동 drift detection에 반영합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-homework", repository: "local dbstudy snapshot", path: "dbstudy/01_26_HomeWork.sql", usedFor: ["MySQL book·customer·orders AUTO_INCREMENT baseline"], evidence: "세 table이 AUTO_INCREMENT primary keys를 사용하는 active DDL을 read-only로 확인했습니다. sample data/credential은 인용하지 않았습니다." },
  { id: "local-spring-table", repository: "local SPRING snapshot", path: "SPRING/MyWeb/src/main/resources/TABLE.sql", usedFor: ["Oracle FREEBOARD_SEQ·FREEREPLY_SEQ·DEFAULT NEXTVAL baseline"], evidence: "두 sequences의 INCREMENT BY 1 START WITH 1 NOCACHE와 두 table defaults를 read-only로 확인했습니다." },
  { id: "mysql-auto-example", repository: "MySQL 8.4 Reference Manual", path: "Using AUTO_INCREMENT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/example-auto-increment.html", usedFor: ["AUTO_INCREMENT insert·generated value baseline"], evidence: "MySQL AUTO_INCREMENT 공식 문서입니다." },
  { id: "mysql-innodb-auto", repository: "MySQL 8.4 Reference Manual", path: "InnoDB AUTO_INCREMENT Handling", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-auto-increment-handling.html", usedFor: ["lock modes·statement classes·concurrency·replication"], evidence: "InnoDB allocator 공식 문서입니다." },
  { id: "mysql-last-insert-id", repository: "MySQL 8.4 Reference Manual", path: "LAST_INSERT_ID()", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/information-functions.html#function_last-insert-id", usedFor: ["connection-scoped generated key"], evidence: "MySQL information function 공식 문서입니다." },
  { id: "mysql-integer-types", repository: "MySQL 8.4 Reference Manual", path: "Integer Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/integer-types.html", usedFor: ["identity capacity·signedness"], evidence: "MySQL numeric type 공식 문서입니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["AUTO_INCREMENT DDL·index constraints"], evidence: "MySQL CREATE TABLE 공식 문서입니다." },
  { id: "oracle-create-sequence", repository: "Oracle AI Database 26ai SQL Language Reference", path: "CREATE SEQUENCE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-SEQUENCE.html", usedFor: ["START·INCREMENT·CACHE·ORDER·CYCLE semantics"], evidence: "Oracle sequence DDL 공식 문서입니다." },
  { id: "oracle-sequence-pseudocolumns", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Sequence Pseudocolumns", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Sequence-Pseudocolumns.html", usedFor: ["NEXTVAL·CURRVAL session/statement semantics"], evidence: "Oracle NEXTVAL/CURRVAL 공식 문서입니다." },
  { id: "oracle-insert-returning", repository: "Oracle AI Database 26ai SQL Language Reference", path: "INSERT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/INSERT.html", usedFor: ["generated value 반환·insert integration"], evidence: "Oracle INSERT 공식 문서입니다." },
  { id: "jakarta-generation-type", repository: "Jakarta Persistence 3.2 API", path: "GenerationType", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/generationtype", usedFor: ["AUTO·IDENTITY·SEQUENCE·TABLE strategy"], evidence: "Jakarta Persistence key strategy 공식 API입니다." },
  { id: "jakarta-sequence-generator", repository: "Jakarta Persistence 3.2 API", path: "SequenceGenerator", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/sequencegenerator", usedFor: ["sequenceName·allocationSize mapping"], evidence: "Jakarta Persistence sequence generator 공식 API입니다." },
];

const session = createExpertSession({
  inventoryId: "db-05-auto-increment-sequence-portability",
  slug: "db-05-auto-increment-sequence-portability",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 5,
  title: "AUTO_INCREMENT와 Oracle SEQUENCE의 차이",
  subtitle: "번호 생성 문법을 넘어 공백·동시성·generated keys·cache·JPA·이관·복구까지 identity 수명 주기를 설계합니다.",
  level: "입문",
  estimatedMinutes: 840,
  coreQuestion: "MySQL과 Oracle에서 충돌 없는 row identity를 만들고, rollback·crash·retry·ORM·database migration 이후에도 올바른 row를 어떻게 찾고 복구할까요?",
  summary: "dbstudy/01_26_HomeWork.sql의 MySQL AUTO_INCREMENT 세 table과 SPRING/MyWeb/TABLE.sql의 Oracle FREEBOARD_SEQ·FREEREPLY_SEQ 및 DEFAULT NEXTVAL을 모두 read-only로 감사합니다. internal identity와 business number를 분리하고, MySQL InnoDB allocation/locking, same-connection generated keys와 MAX(id) race, Oracle NEXTVAL·CURRVAL, CACHE·NOCACHE·crash gap, batch retry·idempotency, Jakarta Persistence IDENTITY·SEQUENCE·TABLE·AUTO와 allocationSize, hi/lo blocks, UUID·distributed alternatives, MySQL→Oracle high-water/write fencing migration, exhaustion·catalog drift·backup restore까지 연결합니다. 다섯 deterministic Python examples는 rollback gap, session key race, cache crash, block allocation과 migration mapping을 exact output으로 증명합니다.",
  objectives: [
    "surrogate identity와 gapless business number의 요구사항을 분리한다.",
    "MySQL AUTO_INCREMENT allocation·locking·rollback·capacity를 설명하고 시험한다.",
    "같은 statement/connection의 generated key를 사용하고 MAX(id) race를 제거한다.",
    "Oracle SEQUENCE의 NEXTVAL·CURRVAL·CACHE·ORDER·NOCYCLE 의미를 구분한다.",
    "bulk retry·ambiguous success를 idempotency/correlation contract로 복구한다.",
    "JPA GenerationType과 allocationSize를 target database·batch·flush behavior에 맞춘다.",
    "hi/lo·UUID·distributed identifiers의 collision·locality·privacy trade-off를 평가한다.",
    "MySQL→Oracle migration과 restore에서 high-water·write fencing·catalog evidence를 검증한다.",
  ],
  prerequisites: [{ title: "기본키·외래키·UNIQUE·CHECK", reason: "생성된 값도 PRIMARY/UNIQUE와 reference integrity 안에서 의미가 있습니다.", sessionSlug: "db-04-primary-foreign-unique-check" }],
  keywords: ["AUTO_INCREMENT", "SEQUENCE", "NEXTVAL", "CURRVAL", "LAST_INSERT_ID", "generated keys", "CACHE", "NOCACHE", "IDENTITY", "GenerationType", "allocationSize", "hi/lo", "idempotency", "high-water mark", "write fencing"],
  topics,
  lab: {
    title: "MySQL 주문 identity를 Oracle sequence로 무중단 이관하고 retry-safe하게 검증하기",
    scenario: "MySQL AUTO_INCREMENT 주문/항목 schema를 Oracle DEFAULT sequence.NEXTVAL로 옮깁니다. 기존 ids와 references는 보존하고 API timeout retry는 같은 주문을 반환해야 하며, source rollback 계획도 collision 없이 준비해야 합니다.",
    setup: ["production data 대신 동일 분포의 synthetic parent/child fixtures를 사용합니다.", "MySQL 8.4·Oracle 26ai isolated instances와 exact JDBC/provider versions를 기록합니다.", "source/target catalog manifest, idempotency schema와 CDC cutover watermark를 준비합니다.", "rollback·crash·connection loss를 주입할 disposable environment를 사용합니다."],
    steps: [
      "internal id와 public/business number 요구사항을 분리해 ADR로 씁니다.",
      "source AUTO_INCREMENT type/high-water, foreign keys, explicit ids와 ORM reserved blocks를 inventory합니다.",
      "target sequence owner/start/increment/cache/max/grants와 table DEFAULT를 migration으로 정의합니다.",
      "기존 parent/child ids를 그대로 load하고 checksums·reference integrity를 검증합니다.",
      "CDC in-flight와 reserved ranges를 포함한 safe high-water 위로 target allocator를 맞춥니다.",
      "generated keys/RETURNING으로 create→child mapping을 검증하고 MAX(id) query를 제거합니다.",
      "same idempotency key의 timeout retry가 stored result를 반환하고 다른 payload를 거부하는지 시험합니다.",
      "single/multi-row insert, rollback, crash cache gap, concurrent writers와 provider allocationSize를 시험합니다.",
      "source writes를 fence하고 cutover한 뒤 target catalog·metrics·first writes를 readback합니다.",
      "backup restore와 rollback rehearsal에서 allocator가 이미 발행된 high-water 아래로 가지 않는지 증명합니다.",
    ],
    expectedResult: ["모든 imported ids와 child references가 보존됩니다.", "새 target ids는 known/reserved high-water보다 크고 중복이 없습니다.", "concurrent inserts가 자신의 generated key를 정확히 받아 wrong-owner mapping이 없습니다.", "timeout retry는 side effect 하나와 같은 response id를 유지합니다.", "cache/restart 공백은 허용하되 data loss와 구분되고 exhaustion·drift·restore alerts가 동작합니다."],
    cleanup: ["격리 instances와 synthetic schemas만 migration identity로 제거합니다.", "temporary credentials·grants·CDC slots/queues를 revoke·삭제합니다.", "failure-injection logs에 raw payload/PII가 없는지 검사합니다.", "production source sequence/AUTO_INCREMENT 값을 reset하거나 되감지 않습니다."],
    extensions: ["multi-tenant business-number service와 cancellation ledger를 설계합니다.", "UUID/public id와 internal bigint의 index·privacy benchmark를 수행합니다.", "mixed ORM versions의 allocationSize rolling-upgrade protocol을 검증합니다.", "RAC/failover와 backup point-in-time recovery에서 allocator recovery를 rehearsal합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 출력이 반박하는 번호 생성 오해를 설명하세요.", requirements: ["stdout을 완전 일치시킵니다.", "rollback gap과 data loss를 구분합니다.", "MAX(id) race의 wrong owner를 설명합니다.", "cache crash에서 unused values를 되돌리지 않습니다.", "block overlap과 migration reference를 검증합니다."], hints: ["allocation과 commit을 서로 다른 사건으로 그리세요."], expectedOutcome: "identity generator의 uniqueness·scope·failure 불변식을 실행 결과로 설명합니다.", solutionOutline: ["allocate→commit/rollback→observe→retry/restart→reconcile 순서입니다."] },
    { difficulty: "응용", prompt: "원본 AUTO_INCREMENT와 SEQUENCE DDL을 production-ready key generation contract로 확장하세요.", requirements: ["두 원본 files의 실제 constructs를 보존·인용합니다.", "business/public/internal ids를 구분합니다.", "generated-key API와 pool boundary를 정의합니다.", "cache·capacity·grants·monitoring을 정합니다.", "idempotency·bulk mapping tests를 포함합니다.", "ORM strategy/allocationSize를 catalog와 맞춥니다.", "rollback·restore acceptance를 포함합니다."], hints: ["NOCACHE와 연속 번호는 동의어가 아닙니다."], expectedOutcome: "MySQL·Oracle 양쪽에서 검증 가능한 identity 표준과 test matrix가 완성됩니다.", solutionOutline: ["requirements→allocator→API mapping→failure/retry→ORM→operations 순서입니다."] },
    { difficulty: "설계", prompt: "MySQL에서 Oracle로 identity를 이관하는 zero-data-loss cutover runbook을 작성하세요.", requirements: ["parent/child/external key 보존을 정의합니다.", "reserved/in-flight high-water를 계산합니다.", "target sequence/default/grant catalog를 정의합니다.", "write fencing과 CDC watermark를 설계합니다.", "dual database contract tests를 만듭니다.", "ambiguous success/idempotency를 다룹니다.", "forward/rollback allocator collision을 방지합니다.", "restore·capacity·observability evidence를 포함합니다."], hints: ["MAX(table.id)만으로 next value를 정하지 마세요."], expectedOutcome: "split-brain allocation 없이 cutover·rollback·복구 가능한 실행 runbook이 완성됩니다.", solutionOutline: ["inventory→reserve→copy→catch up→fence→verify→cutover→restore drill 순서입니다."] },
  ],
  nextSessions: ["db-06-insert-single-multi-constraint-failures"],
  sources,
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "dbstudy/01_26_HomeWork.sql의 book·customer·orders AUTO_INCREMENT key와 SPRING/MyWeb/TABLE.sql의 두 Oracle sequences·DEFAULT NEXTVAL을 모두 read-only로 확인했습니다.",
      "원본의 sample personal/customer values는 학습 세션에 복제하지 않았고 DDL shape와 identity concepts만 사용했습니다.",
      "원본은 gap·rollback·locking·generated-key API·cache failure·JPA·migration·restore를 다루지 않아 MySQL 8.4·Oracle 26ai·Jakarta Persistence 3.2 공식 문서와 deterministic examples로 보완했습니다.",
      "Python models는 vendor database의 정확한 lock/transaction behavior를 대체하지 않으며 isolated MySQL/Oracle integration tests의 expected invariant를 설명합니다.",
    ],
  },
});

export default session;
