import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lines = code.split("\n").length;
  const a = Math.max(1, Math.floor(lines / 3));
  const b = Math.max(a + 1, Math.floor(lines * 2 / 3));
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${a}`, explanation: "JDK 21 value types로 version snapshot, invariant, retry attempt, lock order와 HTTP precondition을 명시합니다." },
      { lines: `${a + 1}-${b}`, explanation: "의도적으로 stale write, write skew, deadlock order와 replay를 재현한 뒤 terminal outcome을 계산합니다." },
      { lines: `${b + 1}-${lines}`, explanation: "synthetic IDs·versions·상태만 출력하고 실제 row, 사용자 값, DB 주소와 credential은 사용하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring·JPA·MySQL 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서 예상값과 완전히 일치해야 합니다.", "JDK 모형은 provider flush timing, 실제 isolation/locks, SQLState와 HTTP adapter를 대신하지 않습니다."] },
    experiments: [
      { change: "version, contention, retry count, lock order 또는 precondition 값을 바꿉니다.", prediction: "commit, conflict, exhausted, timeout과 HTTP status가 정책표에 따라 달라집니다.", result: "final value/version, attempts/effects, cycle과 status를 비교합니다." },
      { change: "CyclicBarrier와 독립 transaction을 사용하는 MySQL integration test로 같은 schedule을 실행합니다.", prediction: "OptimisticLockException, deadlock victim, lock timeout과 실제 commit 순서가 evidence로 드러납니다.", result: "SQL/row count, exception cause/SQLState, transaction id, latency와 final rows를 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "provenance-no-version",
    title: "원본 GuestBook에 @Version이 없다는 사실에서 concurrency gap을 시작합니다",
    lead: "entity를 JPA로 저장한다는 사실만으로 concurrent stale write가 자동 검출된다고 가정하면 조용한 lost update를 놓칩니다.",
    explanations: [
      "read-only 감사에서 GuestBook entity에는 @Version field가 없고 repository에도 @Lock/LockModeType이 없습니다. service는 repository 조회를 위임하는 transaction facade지만 version conflict/retry 정책은 구현하지 않습니다.",
      "따라서 원본이 낙관적 잠금을 사용한다고 표현하지 않습니다. 이 세션의 @Version, pessimistic lock, retry와 HTTP precondition은 원본 gap을 메우기 위한 synthetic extension입니다.",
      "현재 scalar 조회가 즉시 문제를 일으킨다는 주장도 하지 않습니다. 위험은 같은 row 또는 invariant를 여러 transaction/request가 read→decide→write할 때 생깁니다.",
      "source provenance에는 exact path, line/byte count와 hash, annotation search 0건만 기록하고 JPQL literal, table/column, 실제 요청·DB values는 복사하지 않습니다.",
      "변경 전에는 어떤 write use case가 contention을 갖는지, client가 stale version을 전달하는지, DB isolation과 retry owner가 누구인지 inventory로 만듭니다.",
    ],
    concepts: [c("concurrency gap", "동시 write의 충돌·불변식을 검출하고 복구할 명시적 계약이 없는 상태입니다.", ["source evidence로 확인합니다.", "workload가 있을 때 위험을 평가합니다."]), c("stale snapshot", "다른 transaction이 갱신하기 전 읽은 revision을 기반으로 만든 command입니다.", ["version과 함께 전달합니다.", "merge 전에 재검증합니다."])],
    diagnostics: [d("문서는 낙관적 잠금을 설명하지만 source의 entity에는 @Version이 없습니다.", "교육 확장과 실제 구현을 혼동했습니다.", ["entity annotations", "schema version column", "update WHERE clause", "conflict tests", "HTTP version field"], "원본에는 version 없음과 그 결과를 명시하고 synthetic migration/mapping/API proposal을 분리합니다.", "source-to-claim manifest와 schema catalog gate를 둡니다.")],
    expertNotes: ["@Transactional은 atomic boundary를 제공하지만 stale snapshot을 자동으로 식별하는 version token은 아닙니다.", "gap 기록은 구현 여부와 위험도를 정직하게 연결하는 provenance입니다."],
  },
  {
    id: "lost-update-read-modify-write",
    title: "lost update를 두 snapshot의 read→modify→write schedule로 재현합니다",
    lead: "각 요청이 성공 응답을 받아도 마지막 write가 먼저 반영된 값을 덮으면 업무 변화 하나가 사라집니다.",
    explanations: [
      "T1과 T2가 같은 value/version을 읽고 각자 새 값을 계산한 뒤 조건 없는 UPDATE를 실행하면 최종 값은 두 변화의 합이 아닐 수 있습니다.",
      "단일 counter 증가는 원자적 UPDATE expression으로 해결할 수 있지만, 복잡한 domain transition은 expected version을 WHERE에 포함해 affected rows 1을 확인해야 합니다.",
      "read-only transaction, isolation 이름 또는 JVM synchronized 하나만으로 여러 application instance의 DB row lost update를 해결하지 못합니다.",
      "test는 두 transaction을 barrier로 read 이후 정지시키고 write order를 제어해야 합니다. 단순 parallel loop 결과에 의존하면 race가 재현되지 않아 false green이 됩니다.",
      "final row뿐 아니라 각 attempt가 읽은 revision, update row count, exception과 client-visible outcome을 함께 assert합니다.",
    ],
    concepts: [c("lost update", "두 writer가 같은 이전 상태를 바탕으로 갱신해 한 writer의 변화가 덮이는 anomaly입니다.", ["schedule로 재현합니다.", "affected rows를 확인합니다."]), c("compare-and-set update", "expected revision을 조건으로 일치할 때만 state와 revision을 함께 바꾸는 write입니다.", ["row count 1을 요구합니다.", "실패는 conflict입니다."])],
    codeExamples: [java("jpa09-optimistic-version", "version compare-and-set과 lost update", "Jpa09OptimisticVersion.java", "두 writer가 같은 revision을 읽을 때 무조건 write와 version 검증 결과를 비교합니다.", String.raw`public class Jpa09OptimisticVersion {
  record State(int value, long version) {}
  record Result(String outcome, State state) {}
  static Result update(State database, long expectedVersion, int delta) {
    if (database.version() != expectedVersion) return new Result("CONFLICT", database);
    return new Result("COMMIT", new State(database.value() + delta, database.version() + 1));
  }
  public static void main(String[] args) {
    State initial = new State(0, 0);
    int staleA = initial.value() + 1;
    int staleB = initial.value() + 1;
    Result first = update(initial, 0, 1);
    Result second = update(first.state(), 0, 1);
    System.out.println("without-version-final=" + staleB);
    System.out.println("expected-with-two-writes=2");
    System.out.println("lost-updates=" + (2 - staleB));
    System.out.println("first=" + first.outcome() + "|value=" + first.state().value() + "|version=" + first.state().version());
    System.out.println("second=" + second.outcome() + "|current-version=" + second.state().version());
  }
}`, "without-version-final=1\nexpected-with-two-writes=2\nlost-updates=1\nfirst=COMMIT|value=1|version=1\nsecond=CONFLICT|current-version=1", ["local-guestbook-entity", "jakarta-persistence-spec", "jakarta-version-api", "hibernate-user-guide"])],
    diagnostics: [d("동시에 두 번 증가시켰는데 최종 값은 한 번만 증가했습니다.", "같은 snapshot에서 계산한 값을 version/atomic predicate 없이 저장했습니다.", ["read revisions", "generated UPDATE WHERE", "affected rows", "transaction schedule", "final value"], "@Version 또는 explicit compare-and-set/atomic DML을 적용하고 conflict를 public outcome으로 처리합니다.", "barrier 기반 two-writer regression test와 row-count assertion을 둡니다.")],
    expertNotes: ["낙관적 잠금은 blocking을 제거하는 대신 conflict 검출과 retry/user resolution 책임을 드러냅니다.", "repository save 호출 성공만 보지 말고 flush/commit에서 conflict가 발생할 수 있음을 시험합니다."],
  },
  {
    id: "version-mapping-flush-contract",
    title: "@Version column을 migration·flush·detached command와 하나의 revision 계약으로 만듭니다",
    lead: "version field를 추가해도 schema, API와 conflict handling이 맞지 않으면 stale command가 의미 있게 복구되지 않습니다.",
    explanations: [
      "portable version type과 mapping은 Jakarta 명세를 따르고 application code가 managed entity의 version을 직접 증가시키지 않습니다. provider가 update와 함께 revision을 관리합니다.",
      "migration은 existing rows의 non-null initial version, default ownership과 rollback compatibility를 정의합니다. application code와 schema를 rolling deployment 순서에 맞춥니다.",
      "conflict는 merge/save 호출이 아니라 flush 또는 commit에서 나타날 수 있습니다. transaction 밖에서 catch하면 이미 rollback-only인 context를 재사용하지 않습니다.",
      "client command에는 resource ID와 expected version 또는 ETag를 포함하고 server가 current entity를 다시 조회해 authorized delta를 적용합니다. detached entity graph 전체를 blind merge하지 않습니다.",
      "conflict telemetry는 entity type, operation, expected/current revision 차이 category와 attempt를 남기되 raw business fields를 기록하지 않습니다.",
    ],
    concepts: [c("version attribute", "provider가 optimistic verification과 revision 증가에 사용하는 persistent field/property입니다.", ["application이 직접 수정하지 않습니다.", "root entity에 둡니다."]), c("flush-time conflict", "SQL synchronization 때 affected row가 없어 optimistic failure가 드러나는 시점입니다.", ["transaction rollback을 요구합니다.", "새 transaction에서만 재시도합니다."])],
    diagnostics: [d("save 호출은 성공했지만 commit에서 OptimisticLockException이 나고 retry도 계속 실패합니다.", "flush timing을 놓쳤거나 rollback-only EntityManager/transaction을 재사용합니다.", ["flush point", "exception cause", "transaction status", "entity manager lifetime", "retry transaction boundary"], "attempt 전체를 새 transaction과 fresh read로 다시 실행하고 terminal conflict를 분류합니다.", "flush-before-response test와 retry transaction identity assertion을 둡니다.")],
    expertNotes: ["version은 audit history가 아니라 충돌 검출 revision입니다. 변경자·변경 전후가 필요하면 별도 audit ledger를 둡니다.", "version을 public field로 노출할 때 authorization과 representation versioning을 함께 검토합니다."],
  },
  {
    id: "write-skew-multirow-invariant",
    title: "@Version 하나로 막히지 않는 write skew를 aggregate invariant로 검증합니다",
    lead: "서로 다른 rows를 각 transaction이 갱신하면 각 row version은 정상이어도 전체 ‘최소 한 명 활성’ 같은 불변식은 깨질 수 있습니다.",
    explanations: [
      "T1과 T2가 두 rows가 모두 active인 snapshot을 보고 서로 다른 row를 inactive로 바꾸면 version conflict 없이 active 0이 될 수 있습니다. 이것이 lost update와 다른 write skew입니다.",
      "해결은 invariant row/aggregate root 하나를 versioning하거나, 적절한 pessimistic lock/serializable transaction, constraint/atomic statement 또는 업무 serialization을 선택하는 것입니다.",
      "CHECK constraint는 단일 row 표현에 강하지만 여러 rows의 count invariant를 일반적으로 직접 보장하지 못합니다. invariant를 어떤 schema object가 소유하는지 재설계합니다.",
      "test는 두 transaction이 같은 predicate snapshot을 읽은 뒤 각자 다른 row를 쓰게 barrier를 둡니다. final count와 각 version 성공만 함께 확인해야 anomaly가 보입니다.",
      "retry는 fresh snapshot에서 decision을 다시 계산해야 하며 이전 decision/managed entity를 그대로 재사용하지 않습니다.",
    ],
    concepts: [c("write skew", "같은 predicate를 읽은 transactions가 서로 다른 rows를 써서 집합 불변식을 깨는 anomaly입니다.", ["row version만으로 부족할 수 있습니다.", "predicate/aggregate owner를 찾습니다."]), c("invariant owner", "여러 state를 가로지르는 규칙을 atomic하게 검증·변경할 schema/domain 경계입니다.", ["version 또는 lock point가 됩니다.", "한 transaction에 둡니다."])],
    codeExamples: [java("jpa09-write-skew", "서로 다른 row의 write skew", "Jpa09WriteSkew.java", "두 actor가 같은 active count를 보고 각각 내려갈 때 깨지는 집합 불변식과 serialized guard를 비교합니다.", String.raw`public class Jpa09WriteSkew {
  record Pair(boolean first, boolean second) {
    int active() { return (first ? 1 : 0) + (second ? 1 : 0); }
  }
  static Pair guardedOff(Pair state, int actor) {
    if (state.active() <= 1) return state;
    return actor == 1 ? new Pair(false, state.second()) : new Pair(state.first(), false);
  }
  public static void main(String[] args) {
    Pair snapshot = new Pair(true, true);
    boolean firstDecision = snapshot.active() > 1;
    boolean secondDecision = snapshot.active() > 1;
    Pair skewed = new Pair(!firstDecision, !secondDecision);
    Pair serialized = guardedOff(guardedOff(snapshot, 1), 2);
    System.out.println("snapshot-active=" + snapshot.active());
    System.out.println("both-decided-off=" + (firstDecision && secondDecision));
    System.out.println("skewed-active=" + skewed.active());
    System.out.println("invariant-broken=" + (skewed.active() < 1));
    System.out.println("guarded-active=" + serialized.active());
    System.out.println("row-version-alone-sufficient=false");
  }
}`, "snapshot-active=2\nboth-decided-off=true\nskewed-active=0\ninvariant-broken=true\nguarded-active=1\nrow-version-alone-sufficient=false", ["local-guestbook-repository", "jakarta-persistence-spec", "mysql-consistent-read"])],
    diagnostics: [d("각 row update/version은 성공했지만 집합 count·한도·잔액 invariant가 깨집니다.", "여러 rows predicate를 읽고 서로 다른 rows를 쓰는 write skew를 row-level lost update로만 봤습니다.", ["read predicate", "written rows", "isolation", "aggregate/version owner", "final invariant"], "invariant를 한 atomic owner/statement/lock 또는 serializable boundary로 이동하고 conflict/retry를 처리합니다.", "barrier 기반 multi-row schedule과 final invariant assertion을 둡니다.")],
    expertNotes: ["isolation 이름보다 실제 anomaly test와 DB 문서를 근거로 선택합니다.", "aggregate를 너무 크게 잡으면 contention이 커지므로 invariant가 요구하는 최소 serialization point를 찾습니다."],
  },
  {
    id: "retry-new-transaction-backoff",
    title: "optimistic conflict와 deadlock retry를 fresh transaction·bounded backoff로 실행합니다",
    lead: "rollback된 transaction 안에서 같은 entity를 다시 save하면 fresh state도 얻지 못하고 side effect를 중복할 수 있습니다.",
    explanations: [
      "retry unit은 transaction method 전체입니다. 새 attempt가 새 persistence context에서 current state를 읽고 authorization/invariant를 다시 평가한 뒤 write/flush/commit합니다.",
      "OptimisticLockException, deadlock victim과 일부 transient lock timeout만 분류해 재시도합니다. validation, authorization, unique business conflict와 syntax/data errors는 retry하지 않습니다.",
      "attempt와 total deadline을 함께 제한하고 exponential backoff+jitter를 사용합니다. request thread·connection을 무제한 점유하지 않도록 queue/backpressure를 둡니다.",
      "외부 mail/payment/event를 DB transaction 안 retry하면 중복 side effect가 생깁니다. transactional outbox 또는 idempotent external operation으로 commit 이후 전달합니다.",
      "retry metrics에는 operation, classified cause, attempt, backoff bucket, terminal outcome과 contention key category만 남깁니다.",
    ],
    concepts: [c("retry unit", "충돌 뒤 완전히 다시 실행할 fresh read→decision→write transaction 범위입니다.", ["rollback된 context를 버립니다.", "side effect를 격리합니다."]), c("retry budget", "attempt 수와 전체 시간, backoff가 넘지 못할 상한입니다.", ["terminal conflict를 정의합니다.", "deadline과 연결합니다."])],
    diagnostics: [d("conflict 때마다 재시도하지만 같은 version으로 즉시 반복 실패하거나 mail이 중복됩니다.", "managed state/transaction을 재사용하거나 외부 side effect가 retry unit 안에 있습니다.", ["transaction identity", "fresh SELECT/version", "attempt deadline", "external call count", "outbox/idempotency"], "fresh transaction에서 decision을 재계산하고 외부 effect를 outbox/idempotent consumer로 분리합니다.", "forced-conflict test에서 transaction IDs와 effect exactly-once를 assert합니다.")],
    expertNotes: ["자동 retry는 사용자 편의 기능이지만 업무 의도가 stale해질 수 있는 command는 client conflict resolution이 더 적합합니다.", "jitter 값과 최대 attempt도 release configuration이므로 관찰·rollback 가능하게 versioning합니다."],
  },
  {
    id: "idempotency-replay-unknown-outcome",
    title: "idempotency key로 request replay와 commit-unknown을 같은 operation으로 수렴시킵니다",
    lead: "client timeout 뒤 다시 보낸 요청과 server 내부 conflict retry가 겹치면 business effect가 두 번 실행될 수 있습니다.",
    explanations: [
      "idempotency key는 actor/tenant와 operation scope 안에서 unique하며 request payload fingerprint, processing/committed/failed 상태와 canonical response를 저장합니다.",
      "같은 key와 다른 payload는 conflict로 거부하고, committed key는 저장된 결과를 replay합니다. processing lease와 expiry는 느린 첫 요청과 takeover race를 시험해야 합니다.",
      "DB commit 응답을 잃으면 결과가 unknown입니다. blind write를 반복하지 않고 key ledger와 resource state/outbox를 조회해 reconcile합니다.",
      "optimistic retry attempts는 같은 logical operation key를 공유하지만 각 DB transaction은 새 identity를 가집니다. effect ledger unique constraint가 최종 중복 방지선입니다.",
      "key와 fingerprint 원문을 log에 남기지 않고 hash/category, attempt와 replay 여부만 telemetry로 기록합니다.",
    ],
    concepts: [c("idempotency key", "동일 logical operation의 retry/replay를 식별하는 caller 제공 token입니다.", ["scope와 TTL을 둡니다.", "payload fingerprint를 묶습니다."]), c("unknown outcome", "timeout/connection failure 때문에 commit 여부를 caller가 확정할 수 없는 상태입니다.", ["ledger로 reconcile합니다.", "즉시 실패/성공으로 단정하지 않습니다."])],
    codeExamples: [java("jpa09-retry-idempotency", "bounded retry와 exactly-once effect", "Jpa09RetryIdempotency.java", "두 conflict 뒤 commit하고 같은 logical key replay가 effect를 늘리지 않는지 확인합니다.", String.raw`import java.util.*;

public class Jpa09RetryIdempotency {
  public static void main(String[] args) {
    Deque<String> outcomes = new ArrayDeque<>(List.of("CONFLICT", "CONFLICT", "COMMIT"));
    List<Integer> backoffs = new ArrayList<>();
    int attempts = 0;
    int effects = 0;
    String terminal = "EXHAUSTED";
    while (attempts < 3) {
      attempts++;
      String outcome = outcomes.removeFirst();
      if (outcome.equals("COMMIT")) { effects++; terminal = outcome; break; }
      if (attempts < 3) backoffs.add(10 * (1 << (attempts - 1)));
    }
    boolean replay = terminal.equals("COMMIT");
    System.out.println("attempts=" + attempts);
    System.out.println("backoff-ms=" + backoffs);
    System.out.println("terminal=" + terminal);
    System.out.println("effects=" + effects);
    System.out.println("replay=" + (replay ? "CACHED_RESPONSE" : "NONE"));
    System.out.println("effects-after-replay=" + effects);
  }
}`, "attempts=3\nbackoff-ms=[10, 20]\nterminal=COMMIT\neffects=1\nreplay=CACHED_RESPONSE\neffects-after-replay=1", ["local-guestbook-service", "spring-tx-propagation", "java-duration-api"])],
    diagnostics: [d("timeout 뒤 재요청하자 같은 업무 row/event가 두 번 생성됩니다.", "logical operation ledger 없이 transport retry와 transaction retry를 별개 요청으로 처리했습니다.", ["idempotency scope/key", "payload fingerprint", "unique effect ledger", "commit/outbox state", "replay response"], "operation key ledger를 transaction과 묶고 committed response replay와 unknown reconciliation을 구현합니다.", "lost-response·duplicate-request·takeover race fault tests를 둡니다.")],
    expertNotes: ["HTTP method의 추상적 idempotence와 application operation의 exactly-once-effect ledger를 구분합니다.", "TTL 삭제 뒤 늦은 replay가 가능한 업무라면 durable business key가 필요합니다."],
  },
  {
    id: "pessimistic-lock-scope-timeout",
    title: "비관적 잠금을 indexed target·짧은 transaction·명시적 timeout으로 제한합니다",
    lead: "충돌을 기다리게 만들면 retry가 사라지는 것이 아니라 lock wait, timeout, throughput 저하와 deadlock으로 이동합니다.",
    explanations: [
      "PESSIMISTIC_WRITE는 selected entity rows의 concurrent modification을 막는 선택지지만 provider와 DB가 실제 어떤 index records/gaps를 잠그는지 SQL/plan/isolation로 확인합니다.",
      "repository query에 @Lock을 선언해도 transaction 밖이면 lock lifetime이 의미 없고, broad predicate·missing index는 예상보다 많은 records/ranges를 잠글 수 있습니다.",
      "lock을 얻은 뒤 remote API, 사용자 입력이나 큰 serialization을 기다리지 않습니다. 필요한 rows를 canonical order로 잠그고 짧게 검증·갱신·commit합니다.",
      "jakarta.persistence.lock.timeout hint는 provider/DB 지원과 단위가 다를 수 있으므로 실제 elapsed time과 exception mapping을 integration test로 검증합니다.",
      "NOWAIT/SKIP LOCKED 같은 vendor 기능은 queue claim 등 적합한 semantics에서만 사용하고 portable JPA 보장처럼 문서화하지 않습니다.",
    ],
    concepts: [c("pessimistic lock", "transaction 완료까지 database row/range access를 제한하는 lock mode입니다.", ["scope를 측정합니다.", "timeout을 둡니다."]), c("lock footprint", "한 query가 실제로 잠그는 index records, gaps와 관련 rows의 범위입니다.", ["index/isolation에 의존합니다.", "plan과 wait graph로 확인합니다."])],
    diagnostics: [d("단일 row를 잠근다고 생각했지만 unrelated writes도 오래 기다립니다.", "predicate/index/isolation 때문에 range/gap 또는 넓은 scan을 잠급니다.", ["locking SQL", "EXPLAIN/index", "isolation", "lock wait graph", "transaction duration"], "unique indexed lookup과 최소 rows로 lock scope를 줄이고 short timeout/transaction을 적용합니다.", "contention integration test와 lock-footprint/latency budget을 둡니다.")],
    expertNotes: ["pessimistic은 더 안전한 상위 단계가 아니라 contention shape가 높은 경우의 다른 trade-off입니다.", "lock timeout은 user-visible latency budget보다 짧고 분류 가능한 값이어야 합니다."],
  },
  {
    id: "deadlock-order-victim-retry",
    title: "deadlock을 canonical lock order로 줄이고 victim transaction 전체를 재시도합니다",
    lead: "서로 다른 순서로 여러 rows를 잠그면 각 transaction이 상대가 가진 lock을 기다리는 cycle이 생깁니다.",
    explanations: [
      "T1이 A→B, T2가 B→A 순서로 exclusive locks를 얻으면 wait-for cycle이 가능합니다. 모든 code path가 stable key order로 잠그면 대표적인 cycle surface가 줄어듭니다.",
      "deadlock은 DB가 정상적으로 한 victim을 rollback해 진행성을 회복하는 concurrency outcome입니다. application은 classified exception을 fresh transaction에서 bounded retry해야 합니다.",
      "canonical order만으로 predicate/gap/foreign-key/secondary-index locks의 모든 deadlock을 없앨 수는 없습니다. transaction을 짧게 하고 indexes와 affected rows를 줄입니다.",
      "deadlock evidence에는 sanitized statements/query IDs, held/waited resources, transaction age와 victim을 수집하고 raw row values는 제한합니다.",
      "test는 두 connections와 barriers로 opposite order를 강제하고 timeout에 기대지 않으며, final state·one victim·retry success와 resource cleanup을 확인합니다.",
    ],
    concepts: [c("wait-for graph", "transaction이 보유한 lock과 기다리는 lock의 의존성 graph입니다.", ["cycle이 deadlock입니다.", "DB가 victim을 선택합니다."]), c("canonical lock order", "모든 transaction이 여러 resources를 같은 stable 순서로 획득하는 규칙입니다.", ["cycle surface를 줄입니다.", "모든 code path에 적용합니다."])],
    codeExamples: [java("jpa09-deadlock-order", "opposite order와 canonical order", "Jpa09DeadlockOrder.java", "두 transaction의 lock order가 역순이면 cycle 가능, 정렬하면 같은 순서가 되는지 출력합니다.", String.raw`import java.util.*;

public class Jpa09DeadlockOrder {
  static boolean inverse(List<Integer> a, List<Integer> b) {
    return a.size() == 2 && a.get(0).equals(b.get(1)) && a.get(1).equals(b.get(0));
  }
  public static void main(String[] args) {
    List<Integer> first = List.of(7, 9);
    List<Integer> second = List.of(9, 7);
    List<Integer> canonical = first.stream().sorted().toList();
    List<Integer> secondCanonical = second.stream().sorted().toList();
    System.out.println("unordered-a=" + first);
    System.out.println("unordered-b=" + second);
    System.out.println("cycle=" + inverse(first, second));
    System.out.println("canonical=" + canonical);
    System.out.println("cycle-after-order=" + inverse(canonical, secondCanonical));
    System.out.println("timeout-ms=250");
    System.out.println("retry-whole-transaction=true");
  }
}`, "unordered-a=[7, 9]\nunordered-b=[9, 7]\ncycle=true\ncanonical=[7, 9]\ncycle-after-order=false\ntimeout-ms=250\nretry-whole-transaction=true", ["spring-data-locking", "mysql-innodb-locking", "mysql-deadlocks", "java-cyclic-barrier"])],
    diagnostics: [d("간헐적으로 deadlock victim이 발생하고 재시도 뒤 일부 side effect만 중복됩니다.", "여러 rows를 반대 order로 잠그고 transaction 밖 side effect까지 attempt에 포함했습니다.", ["lock acquisition order", "deadlock report", "transaction size", "victim rollback", "external effect ledger"], "canonical order와 short transaction을 적용하고 victim의 전체 DB unit을 idempotently 재시도합니다.", "forced opposite-order test와 outbox exactly-once assertion을 둡니다.")],
    expertNotes: ["deadlock 0을 무조건 KPI로 삼기보다 rate·retry success·latency와 hot paths를 관리합니다.", "deadlock report는 민감 SQL values를 포함할 수 있어 접근·retention/redaction 정책이 필요합니다."],
  },
  {
    id: "strategy-selection-hotspot",
    title: "낙관적·비관적·atomic DML·queue를 contention과 업무 semantics로 선택합니다",
    lead: "모든 write에 한 lock 전략을 적용하면 low-contention workload는 느려지고 hotspot은 retry storm에 빠집니다.",
    explanations: [
      "낙관적 잠금은 충돌이 드물고 stale edit를 사용자에게 보여야 할 때 적합합니다. conflict rate가 높으면 반복 작업·latency·DB load가 커집니다.",
      "비관적 잠금은 짧고 예측 가능한 critical section에서 contention을 serialize하지만 connection/lock wait budget과 deadlock handling이 필요합니다.",
      "counter·inventory decrement처럼 조건을 SQL predicate에 표현할 수 있으면 atomic UPDATE와 affected row가 가장 작은 serialization surface가 될 수 있습니다.",
      "극단적 hot key는 partitioned queue/single-writer, reservation ledger 또는 domain redesign이 더 적합할 수 있습니다. JVM mutex는 multi-instance DB coordination을 대신하지 않습니다.",
      "strategy review에는 conflict/wait rate, attempts, p95/p99 latency, throughput, fairness, invariant failures와 operational complexity를 비교합니다.",
    ],
    concepts: [c("contention", "같은 logical resource를 겹치는 시간에 변경하려는 경쟁 정도입니다.", ["key distribution과 duration을 봅니다.", "평균만 보지 않습니다."]), c("atomic DML", "검증 predicate와 state transition을 한 database statement에 표현하는 방식입니다.", ["affected rows로 outcome을 판정합니다.", "복잡한 workflow에는 한계가 있습니다."])],
    diagnostics: [d("낙관적 retry attempts와 latency가 hotspot에서 폭증합니다.", "충돌이 드물다는 가정과 실제 key distribution/critical duration이 맞지 않습니다.", ["conflict rate by operation", "hot key distribution", "attempts/latency", "atomic predicate feasibility", "queue/lock alternatives"], "hot operation만 atomic DML, bounded pessimistic lock 또는 single-writer로 전환하고 비교 canary를 실행합니다.", "strategy별 load test와 rollback threshold를 둡니다.")],
    expertNotes: ["correctness를 유지한 여러 전략 중 workload evidence로 성능을 선택합니다.", "fairness와 starvation은 throughput 수치만으로 보이지 않으므로 별도 metric과 test가 필요합니다."],
  },
  {
    id: "http-precondition-conflict-observability",
    title: "DB revision을 HTTP precondition·명확한 conflict 응답과 연결합니다",
    lead: "server 내부에서 conflict를 잡아 500이나 무조건 200으로 바꾸면 client는 refresh, merge와 retry 중 무엇을 해야 할지 모릅니다.",
    explanations: [
      "representation revision을 ETag로 제공하고 unsafe update에 If-Match를 요구하면 missing precondition은 428, stale tag는 412로 구분할 수 있습니다. server가 expected revision을 DB @Version과 연결합니다.",
      "현재 revision이지만 업무 invariant가 충돌하면 409 Problem Details처럼 별도 code와 remediation을 제공합니다. internal exception/class/SQL과 current sensitive state를 그대로 노출하지 않습니다.",
      "자동 retry가 성공하면 정상 응답을 반환하되 retry count를 public semantics로 노출할 필요는 없습니다. exhausted conflict는 client refresh/merge 가능한 representation link와 stable code를 줍니다.",
      "ETag 생성은 representation variant와 authorization을 고려하고 version 번호를 cache/security token으로 과신하지 않습니다. If-Match evaluation과 resource existence ordering을 명세대로 시험합니다.",
      "dashboard는 conflict/precondition missing/retry/deadlock/lock-timeout을 operation·release별로 분리하고 SLO와 rollback threshold를 둡니다.",
    ],
    concepts: [c("HTTP precondition", "resource revision이 client 기대와 맞을 때만 unsafe method를 실행하는 조건입니다.", ["If-Match/ETag를 사용할 수 있습니다.", "DB version과 adapter에서 연결합니다."]), c("conflict contract", "stale revision, business invariant, lock timeout 등 수정 가능한 충돌을 stable status/code로 표현한 API 계약입니다.", ["internal exception을 숨깁니다.", "client remediation을 제공합니다."])],
    codeExamples: [java("jpa09-http-precondition", "If-Match와 conflict status 분류", "Jpa09HttpPrecondition.java", "missing, stale, business conflict와 정상 update를 deterministic HTTP status로 분류합니다.", String.raw`public class Jpa09HttpPrecondition {
  static int status(String ifMatch, String current, boolean invariantPasses) {
    if (ifMatch == null) return 428;
    if (!ifMatch.equals(current)) return 412;
    if (!invariantPasses) return 409;
    return 204;
  }
  public static void main(String[] args) {
    String current = "v4";
    System.out.println("missing=" + status(null, current, true));
    System.out.println("stale=" + status("v3", current, true));
    System.out.println("business-conflict=" + status(current, current, false));
    System.out.println("updated=" + status(current, current, true));
    System.out.println("response-etag=" + current);
    System.out.println("raw-exception=false");
  }
}`, "missing=428\nstale=412\nbusiness-conflict=409\nupdated=204\nresponse-etag=v4\nraw-exception=false", ["rfc9110", "rfc6585", "hibernate-user-guide"])],
    diagnostics: [d("stale update가 500 또는 200으로 반환되어 client가 변경 손실을 모릅니다.", "optimistic exception을 transport/business contract로 분류하지 않았습니다.", ["flush exception mapping", "ETag/If-Match", "status/problem code", "response data exposure", "client refresh path"], "428/412/409와 stable problem codes를 명시하고 expected version을 DB revision과 연결합니다.", "MockMvc/real-server precondition matrix와 concurrent update test를 둡니다.")],
    expertNotes: ["409와 412 선택은 API contract에 일관되게 문서화하고 client tests로 고정합니다.", "current representation을 conflict response에 넣을 때 field-level authorization과 cache policy를 다시 적용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-entity", repository: "2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/entity/GuestBook.java", usedFor: ["entity provenance and verified absence of @Version"], evidence: "Read-only sanitized audit: 61 lines, 1,495 bytes, SHA-256 BA0B75DD8DEA41B4A0DFD6F86D3F357ED9AADEF9B2EB336C00BD78B795F10ACF; @Version count is zero." },
  { id: "local-guestbook-repository", repository: "2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/repository/GuestBookRepository.java", usedFor: ["repository provenance and verified absence of @Lock"], evidence: "Read-only sanitized audit: 30 lines, 1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900; @Lock/LockModeType count is zero." },
  { id: "local-guestbook-service", repository: "2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/service/GuestBookServiceImpl.java", usedFor: ["transactional repository delegation provenance and absence of conflict retry"], evidence: "Read-only sanitized audit: 36 lines, 1,023 bytes, SHA-256 376951E8323A82D287BD6AFD288CB6FB5BDA4E36D2B22ABDD984A59EB39BB5F5." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "3.2 specification", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["entity versions, optimistic/pessimistic locking and exceptions"], evidence: "Jakarta Persistence 3.2 공식 specification의 locking and concurrency 규칙입니다." },
  { id: "jakarta-version-api", repository: "Jakarta Persistence API", path: "Version", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/version", usedFor: ["portable version attribute annotation"], evidence: "Jakarta Persistence 3.2 공식 Version API 문서입니다." },
  { id: "spring-data-locking", repository: "Spring Data JPA", path: "Locking", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html", usedFor: ["repository @Lock declaration"], evidence: "Spring Data JPA 공식 locking reference입니다." },
  { id: "hibernate-user-guide", repository: "Hibernate ORM", path: "current user guide", publicUrl: "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html", usedFor: ["provider optimistic and pessimistic locking behavior"], evidence: "Hibernate ORM 공식 current user guide입니다." },
  { id: "mysql-innodb-locking", repository: "MySQL 8.4 Reference", path: "InnoDB Locking", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html", usedFor: ["record, gap, next-key and intention lock behavior"], evidence: "Oracle MySQL 공식 8.4 InnoDB locking reference입니다." },
  { id: "mysql-consistent-read", repository: "MySQL 8.4 Reference", path: "Consistent Nonlocking Reads", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html", usedFor: ["snapshot reads and multi-row write-skew context"], evidence: "Oracle MySQL 공식 consistent read 문서입니다." },
  { id: "mysql-deadlocks", repository: "MySQL 8.4 Reference", path: "Deadlocks in InnoDB", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html", usedFor: ["deadlock victim, order reduction and retry requirement"], evidence: "Oracle MySQL 공식 deadlock guidance입니다." },
  { id: "spring-tx-propagation", repository: "Spring Framework", path: "Transaction Propagation", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html", usedFor: ["physical transaction boundaries and retry isolation"], evidence: "Spring Framework 공식 declarative transaction reference입니다." },
  { id: "rfc9110", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["If-Match, 412 and 409 semantics"], evidence: "IETF Standards Track HTTP Semantics입니다." },
  { id: "rfc6585", repository: "IETF RFC Editor", path: "RFC 6585 Additional HTTP Status Codes", publicUrl: "https://www.rfc-editor.org/rfc/rfc6585.html", usedFor: ["428 Precondition Required"], evidence: "IETF RFC 6585 공식 문서입니다." },
  { id: "java-duration-api", repository: "Java SE 21 API", path: "Duration", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["retry and lock deadline budgets"], evidence: "Oracle Java SE 21 공식 Duration API입니다." },
  { id: "java-cyclic-barrier", repository: "Java SE 21 API", path: "CyclicBarrier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CyclicBarrier.html", usedFor: ["deterministic concurrent transaction schedules"], evidence: "Oracle Java SE 21 공식 CyclicBarrier API입니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-09-lock-version-concurrency", slug: "jpa-09-lock-version-concurrency", courseId: "spring", moduleId: "spring-data-jpa", order: 9,
  title: "@Version·낙관적 잠금과 동시성", subtitle: "원본의 version/lock 부재를 정확히 기록하고 lost update·write skew·retry/idempotency·pessimistic lock·deadlock과 HTTP conflict를 하나의 concurrency contract로 설계합니다.", level: "고급", estimatedMinutes: 105,
  coreQuestion: "동시에 도착한 stale commands가 서로의 변경이나 집합 invariant를 잃지 않게 하고, 충돌·deadlock·unknown outcome을 bounded retry와 명확한 HTTP 결과로 어떻게 수렴시킬까요?",
  summary: "GuestBook entity, repository와 transactional service implementation을 read-only·sanitized 방식으로 감사했습니다. 원본에는 @Version, @Lock, LockModeType, optimistic conflict와 retry evidence가 없으므로 실제 낙관적 잠금 구현으로 과장하지 않습니다. synthetic schedules로 lost update와 compare-and-set revision, flush-time conflict, multi-row write skew, fresh-transaction retry, idempotency/commit-unknown, indexed pessimistic lock, deadlock/canonical order, contention별 strategy 선택과 ETag·If-Match 기반 428/412/409 API 계약을 연결합니다. 다섯 JDK 21 예제는 lost update, write skew, retry replay, deadlock order와 HTTP precondition을 exact stdout으로 실행합니다.",
  objectives: ["원본에 @Version/@Lock이 없음을 provenance로 증명한다.", "lost update를 deterministic schedule로 재현한다.", "version column·flush·API revision을 하나의 계약으로 만든다.", "row version만으로 막히지 않는 write skew를 설명한다.", "fresh transaction과 bounded backoff로 transient conflict를 retry한다.", "idempotency ledger로 replay와 unknown outcome을 reconcile한다.", "pessimistic lock scope·index·timeout을 검증한다.", "canonical order와 victim retry로 deadlock을 다룬다.", "contention별 optimistic/pessimistic/atomic/queue 전략을 선택한다.", "DB conflict를 HTTP precondition과 stable problem code로 변환한다."],
  prerequisites: [{ title: "연관관계·fetch 전략과 N+1", reason: "association owner, aggregate boundary와 persistence-context fetch/flush를 알아야 version이 보호하는 state 범위와 lock graph를 정확히 설계할 수 있습니다.", sessionSlug: "jpa-08-association-fetch-nplusone" }],
  keywords: ["@Version", "optimistic lock", "lost update", "write skew", "retry", "idempotency", "pessimistic lock", "deadlock", "lock timeout", "If-Match", "ETag", "conflict"],
  topics,
  lab: {
    title: "version 없는 scalar entity에 conflict-safe update protocol 설계하기",
    scenario: "원본에는 concurrent write protocol이 없습니다. source를 변경하지 않고 synthetic state와 MySQL test schema에서 version migration, two-writer anomalies, retry/idempotency와 HTTP conflict contract를 qualification합니다.",
    setup: ["원본 세 파일을 read-only로 보존하고 @Version/@Lock 검색 0건과 hashes를 기록합니다.", "synthetic rows, fixed operation keys, two independent connections와 barriers를 준비합니다.", "version column migration, optimistic/pessimistic/atomic variants와 sanitized statement counter를 준비합니다.", "실제 table/query/route/user/datasource/credential values는 복사하지 않습니다."],
    steps: ["read→decide→write command와 invariant owner를 inventory합니다.", "두 writers의 lost update와 다른-row write skew schedule을 먼저 재현합니다.", "non-null version migration과 @Version mapping, API expected revision을 설계합니다.", "flush/commit conflict를 catch하고 fresh transaction retry boundary를 만듭니다.", "retryable/non-retryable exception matrix와 total deadline/backoff를 적용합니다.", "operation ledger로 duplicate request와 lost response를 reconcile합니다.", "pessimistic query의 index, lock footprint, timeout과 transaction duration을 측정합니다.", "opposite/canonical order deadlock test와 victim retry를 실행합니다.", "optimistic/pessimistic/atomic DML의 conflict/wait/throughput/latency를 비교합니다.", "ETag/If-Match 428·412·409·success response matrix를 구현합니다.", "raw values 없는 conflict/deadlock/retry telemetry와 rollback threshold를 확인합니다.", "source gap, migration, tests, API schema, runbook과 recovery evidence를 제출합니다."],
    expectedResult: ["stale same-row write는 version conflict로 검출되고 변경이 조용히 유실되지 않습니다.", "multi-row invariant는 명시한 serialization owner에서 보장됩니다.", "retry는 fresh transactions 안에서 bounded하며 external effect는 exactly-once ledger로 수렴합니다.", "pessimistic wait/deadlock은 timeout·victim retry와 canonical order로 운영됩니다.", "client는 missing/stale/business conflict를 안정된 HTTP 상태와 code로 구분합니다."],
    cleanup: ["synthetic rows, operation/outbox ledgers와 test schema를 제거합니다.", "connections, barriers, executors와 datasource를 종료하고 locks/threads가 0인지 확인합니다.", "faults/timeouts/isolation/settings를 복원하고 deadlock artifacts의 retention을 적용합니다.", "원본 source와 실제 datasource configuration은 변경하지 않습니다."],
    extensions: ["aggregate version과 event-sourced expected revision을 비교합니다.", "hot-key single-writer queue와 fairness test를 추가합니다.", "multi-region leader/fencing token 전략을 모델링합니다.", "production conflict/deadlock canary와 adaptive strategy dashboard를 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java 예제를 실행하고 각 stdout을 실제 JPA/DB/HTTP evidence에 연결하세요.", requirements: ["exact output을 확인합니다.", "lost update와 version conflict를 구분합니다.", "write skew가 row version을 통과하는 이유를 설명합니다.", "retry effect 1을 확인합니다.", "deadlock order를 설명합니다.", "428/412/409/204를 구분합니다."], hints: ["JDK model의 decision을 실제 SQL row count, exceptions와 final database state로 바꾸세요."], expectedOutcome: "concurrency를 annotation 이름이 아니라 schedule·invariant·outcome으로 설명합니다.", solutionOutline: ["schedule→detect→rollback→retry/reconcile→respond 순서입니다."] },
    { difficulty: "응용", prompt: "version 없는 update use case를 conflict-safe protocol로 전환하세요.", requirements: ["source gap을 명시합니다.", "version migration/API token을 둡니다.", "barrier anomaly tests를 둡니다.", "fresh retry와 idempotency를 둡니다.", "pessimistic/deadlock 대안을 비교합니다.", "HTTP conflict와 telemetry를 둡니다."], hints: ["자동 retry가 사용자 의도를 보존하는 command인지 먼저 판단하세요."], expectedOutcome: "lost update·replay·deadlock에도 effect와 client 상태가 일관됩니다.", solutionOutline: ["audit→version→schedule→classify→retry→publish 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 database concurrency governance를 작성하세요.", requirements: ["anomaly/invariant inventory를 둡니다.", "version/lock/atomic/queue 선택 기준을 둡니다.", "retry/idempotency/outbox 표준을 둡니다.", "deadlock/order/timeout 기준을 둡니다.", "HTTP precondition contract를 둡니다.", "load/fault/telemetry/rollback gates를 둡니다."], hints: ["DB isolation 이름만 나열하지 말고 재현 schedule과 acceptance outcome을 요구하세요."], expectedOutcome: "각 write 기능이 concurrency risk와 evidence를 일관되게 제출합니다.", solutionOutline: ["identify→serialize→detect→recover→expose→observe 순서입니다."] },
  ],
  nextSessions: ["jpa-10-repository-test-testcontainers"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["GuestBook.java는 61 lines/1,495 bytes, SHA-256 BA0B75DD8DEA41B4A0DFD6F86D3F357ED9AADEF9B2EB336C00BD78B795F10ACF이며 @Version은 없습니다.", "GuestBookRepository.java는 30 lines/1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900이며 @Lock/LockModeType은 없습니다.", "GuestBookServiceImpl.java는 36 lines/1,023 bytes, SHA-256 376951E8323A82D287BD6AFD288CB6FB5BDA4E36D2B22ABDD984A59EB39BB5F5이며 repository delegation 외 conflict/retry policy evidence는 없습니다.", "@Version, @Lock, LockModeType와 concurrency test는 repository 전체 read-only search에서 0건이므로 모든 locking protocol은 synthetic extension으로 표시했습니다.", "원본 JPQL/table/column/route/message와 실제 row/datasource values는 복사하지 않고 annotations, method shape와 transaction boundary만 provenance로 사용했습니다.", "JDK examples는 실제 provider flush/version SQL, MySQL isolation/locks/deadlock, Spring transaction proxy와 HTTP adapter를 대체하지 않습니다."] },
});

export default session;
