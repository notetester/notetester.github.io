import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-15", explanation: "JDK 21 collections·record·enum과 mutable entity fixture로 persistence context identity, lifecycle와 snapshot을 명시적으로 모델링합니다." },
      { lines: "16-끝에서 6줄 전", explanation: "find/manage/change/flush/clear/detach/merge/bulk/batch transition을 provider 없이 deterministic하게 수행합니다." },
      { lines: "마지막 6줄", explanation: "context size, SQL-like writes, Java identity와 fresh readback을 exact stdout으로 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/JPA/Hibernate/DB/network/실데이터 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 한 글자씩 같아야 합니다.", "교육용 context model은 actual EntityManager/provider snapshots, flush ordering, proxies, SQL와 database isolation을 대체하지 않습니다."] },
    experiments: [
      { change: "같은 ID 재조회, mutation, flush/clear 순서, detached input과 bulk update를 바꿉니다.", prediction: "identity reuse, dirty set, lost pending change 또는 stale managed value가 달라집니다.", result: "@DataJpaTest와 지원 DB에서 EntityManager.contains, SQL count, flush/clear와 새 transaction readback을 비교합니다." },
      { change: "1만 건 batch에 flush/clear chunk 크기를 바꿉니다.", prediction: "peak managed count, SQL batching, heap과 transaction duration이 달라집니다.", result: "provider statistics, heap, query/flush/commit latency와 DB locks를 함께 측정합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-service-context-gap",
    title: "원본 Service의 class-level transaction과 실제 read-only behavior를 분리해 감사합니다",
    lead: "@Transactional이 붙었다는 사실만으로 dirty checking 예제가 되는 것은 아니므로 method body에서 어떤 entity state transition이 실제 일어나는지 확인합니다.",
    explanations: [
      "원본 GuestBookServiceImpl은 @Service와 class-level jakarta.transaction.Transactional을 사용하고 field injection으로 repository를 받습니다. 네 public methods는 repository의 active 목록 또는 ID 단건 query 결과를 그대로 반환할 뿐 entity를 수정하거나 EntityManager.flush/clear/detach/merge를 호출하지 않습니다.",
      "따라서 원본은 repository calls가 transaction interceptor 아래 실행될 의도와 managed entity가 반환될 수 있는 출발점은 보여 주지만 dirty checking SQL, identity map hit, flush timing이나 detached behavior의 직접 실행 evidence는 아닙니다.",
      "원본이 entity를 service 밖으로 반환하면 transaction-scoped context가 끝난 뒤 detached가 될 수 있고 lazy state/serialization 문제가 생길 수 있습니다. 이번 세션은 synthetic entity/context로 lifecycle을 설명하고 실제 provider test에서 검증하도록 경계를 분명히 합니다.",
      "field injection은 context semantics 자체를 바꾸지 않지만 dependency와 test construction을 숨깁니다. maintained 설계는 constructor injection, method-specific transaction intent와 DTO projection을 사용하며 원본 absolute path, user data와 configuration values는 복사하지 않습니다.",
    ],
    concepts: [
      c("source behavior gap", "annotation/호출 구조는 존재하지만 학습 목표의 상태 변화나 실행 결과가 원본에 없는 간극입니다.", ["공식 계약과 fixture로 보강합니다.", "원본 evidence라고 쓰지 않습니다."]),
      c("transaction-scoped persistence context", "일반적인 Spring JPA transaction 동안 EntityManager가 제공하는 managed entity identity/state 범위입니다.", ["transaction 종료 후 entities가 detached될 수 있습니다.", "OSIV와 혼동하지 않습니다."]),
      c("managed-return boundary", "service가 persistence context가 관리한 entity를 외부 layer로 반환해 state/lazy/serialization 책임이 새는 경계입니다.", ["DTO projection으로 줄입니다.", "context 종료 시점을 명시합니다."]),
    ],
    diagnostics: [
      d("문서에는 원본이 dirty checking으로 수정한다고 되어 있지만 source에는 setter/domain mutation이 없습니다.", "class-level transaction을 실제 mutation evidence로 과장했습니다.", ["service method bodies를 한 줄씩 봅니다.", "save/mutation/flush call을 검색합니다.", "SQL update 실행 fixture가 있는지 확인합니다."], "원본은 transactional read delegation으로 기록하고 dirty checking은 공식 계약+새 integration fixture로 분리합니다.", "source coverage와 execution-evidence review를 둡니다."),
      d("service 반환 entity를 controller에서 접근할 때 lazy initialization failure가 납니다.", "transaction-scoped context가 닫힌 뒤 detached entity graph를 탐색했습니다.", ["transaction 종료와 serialization timeline을 봅니다.", "loaded attributes/query count를 확인합니다.", "OSIV 설정을 봅니다."], "transaction 안에서 필요한 DTO/projection을 완성하고 lazy association을 public serialization에 넘기지 않습니다.", "context-closed response mapping tests를 둡니다."),
    ],
    expertNotes: ["Spring이 jakarta.transaction.Transactional을 지원하는 범위와 semantics는 target Spring version/transaction manager에서 integration test합니다.", "원본 service 한 파일만으로 실제 proxy 적용 여부, 호출 경로와 database commit 결과를 단정하지 않습니다."],
  },
  {
    id: "persistence-context-identity-map",
    title: "persistence context를 entity identity당 하나의 managed Java 인스턴스를 유지하는 identity map으로 이해합니다",
    lead: "같은 context에서 같은 entity type과 primary key를 조회하면 별도 DB row copy가 아니라 이미 관리 중인 instance가 반환될 수 있습니다.",
    explanations: [
      "Jakarta Persistence는 persistence context에서 하나의 persistent identity에 최대 하나의 entity instance가 존재한다고 정의합니다. identity는 entity class/type과 primary key의 조합이며 business equality와 별개입니다.",
      "첫 find가 database row를 materialize하고 context에 등록하면 다음 find는 1차 cache에서 같은 Java reference를 반환할 수 있습니다. query가 실행되더라도 result identity는 existing managed instance로 canonicalize될 수 있습니다.",
      "1차 cache는 application-wide cache가 아니라 EntityManager/context 범위입니다. 다른 transaction/context에서는 별도 instance와 DB round trip이 생기며 second-level/query cache와 수명·일관성 owner가 다릅니다.",
      "identity map 때문에 같은 transaction 안에서 한 reference의 mutation이 다른 reference에서도 보입니다. 이를 DTO copy나 immutable value처럼 취급하면 예상 밖 shared mutable state가 되므로 entity owner를 service unit-of-work로 제한합니다.",
    ],
    concepts: [
      c("persistence context", "persistent identities와 managed instances, pending lifecycle operations를 추적하는 EntityManager의 논리적 작업 공간입니다.", ["transaction과 연계됩니다.", "DB/cache 자체와 다릅니다."]),
      c("identity map", "entity type+primary key를 key로 하나의 canonical managed instance를 보존하는 context 구조입니다.", ["동일 ID reference equality를 만들 수 있습니다.", "context마다 별도입니다."]),
      c("first-level cache", "persistence context 내부에서 managed entity를 재사용하는 mandatory identity cache입니다.", ["clear/close로 비워집니다.", "query cache/second-level cache와 구분합니다."]),
    ],
    codeExamples: [java("jpa04-identity-map", "같은 context의 동일 ID가 같은 Java instance로 귀결됨", "Jpa04IdentityMap.java", "database row를 copy해 최초 load하고 이후 같은 key는 identity map에서 반환하는 최소 model입니다.", String.raw`import java.util.*;

public class Jpa04IdentityMap {
    static final class Entry {
        final long id; String subject;
        Entry(long id, String subject) { this.id = id; this.subject = subject; }
    }
    static final class Context {
        final Map<Long, String> database;
        final Map<Long, Entry> managed = new HashMap<>();
        int selects;
        Context(Map<Long, String> database) { this.database = database; }
        Entry find(long id) {
            return managed.computeIfAbsent(id, key -> { selects++; return new Entry(key, database.get(key)); });
        }
    }
    public static void main(String[] args) {
        Context context = new Context(Map.of(7L, "first"));
        Entry a = context.find(7L);
        Entry b = context.find(7L);
        a.subject = "changed";
        System.out.println("same-instance=" + (a == b));
        System.out.println("selects=" + context.selects);
        System.out.println("b-subject=" + b.subject);
        System.out.println("managed=" + context.managed.size());
    }
}`, "same-instance=true\nselects=1\nb-subject=changed\nmanaged=1", ["local-guestbook-service", "jakarta-persistence-spec", "jakarta-entity-manager", "jakarta-persistence-context", "jakarta-persistence-unit-util", "hibernate-user-guide"])],
    diagnostics: [
      d("같은 transaction에서 DB를 직접 수정한 뒤 find가 이전 값을 반환합니다.", "persistence context의 managed instance가 database external change보다 우선했습니다.", ["EntityManager.contains와 context lifetime을 봅니다.", "external/native/bulk update timing을 봅니다.", "refresh/clear 필요성을 확인합니다."], "외부 변경과 ORM unit-of-work를 섞지 않거나 명시 flush/clear/refresh 후 fresh read를 수행합니다.", "native/bulk/external update 뒤 stale-context tests를 둡니다."),
      d("두 find가 같은 reference라 한 코드의 변경이 다른 코드에도 보입니다.", "managed entity를 independent DTO copies로 오해했습니다.", ["reference identity와 ID를 출력합니다.", "mutation owner를 추적합니다.", "service method scope를 확인합니다."], "entity mutation을 aggregate service 안에서 제한하고 외부에는 immutable DTO를 반환합니다.", "aliasing/unauthorized mutation tests를 둡니다."),
    ],
    expertNotes: ["find가 1차 cache hit여도 flush mode나 lock request에 따라 DB interaction이 생길 수 있으므로 SQL 0을 절대 규칙으로 일반화하지 않습니다.", "같은 DB row를 서로 다른 entity mappings/class hierarchies로 표현할 때 identity semantics는 mapping/spec/provider를 검증합니다."],
  },
  {
    id: "entity-lifecycle-state-machine",
    title: "new·managed·detached·removed 상태를 method 이름이 아니라 context association으로 전이시킵니다",
    lead: "entity 객체는 Java heap에 계속 존재해도 persistence context와의 관계에 따라 자동 동기화 여부와 허용 operation이 달라집니다.",
    explanations: [
      "new/transient entity는 persistent identity/context association이 없고 persist되면 managed가 됩니다. database에서 find한 entity도 managed이며 direct mutation이 dirty checking 대상이 될 수 있습니다.",
      "detach, clear, context close 또는 transaction-scoped context 종료 후 entity는 detached가 됩니다. 객체와 ID는 남지만 후속 mutation은 이전 context가 추적하지 않습니다.",
      "remove는 managed entity를 removed state로 표시해 flush/commit 때 deletion 대상으로 만듭니다. rollback이나 persist 규칙에 따라 상태 전이가 달라질 수 있으므로 remove 직후 row absence를 외부에 확정하지 않습니다.",
      "EntityManager.contains는 특정 instance가 현재 context에서 managed인지 확인하는 진단에 유용하지만 business logic의 매 call 분기로 남용하지 않습니다. commands가 transaction 안에서 load/manage/mutate하도록 구조를 단순화합니다.",
    ],
    concepts: [
      c("new entity", "아직 persistence context와 persistent identity에 연결되지 않은 entity instance입니다.", ["persist 대상입니다.", "ID strategy에 따라 ID가 있을 수도 있습니다."]),
      c("detached entity", "persistent identity는 있지만 현재 persistence context가 관리하지 않는 instance입니다.", ["mutation이 자동 동기화되지 않습니다.", "merge 입력이 될 수 있습니다."]),
      c("removed entity", "현재 context에서 관리되며 transaction completion 시 삭제 대상으로 표시된 instance입니다.", ["Java 객체는 남아 있습니다.", "rollback/cascade를 고려합니다."]),
    ],
    codeExamples: [java("jpa04-lifecycle", "entity lifecycle의 합법/불법 상태 전이", "Jpa04Lifecycle.java", "new→managed→detached→managed copy→removed→commit 전이를 명시적으로 실행합니다.", String.raw`public class Jpa04Lifecycle {
    enum State { NEW, MANAGED, DETACHED, REMOVED, GONE }
    static State persist(State state) { if (state != State.NEW) throw new IllegalStateException(); return State.MANAGED; }
    static State detach(State state) { return state == State.MANAGED ? State.DETACHED : state; }
    static State merge(State state) { if (state != State.DETACHED) throw new IllegalStateException(); return State.MANAGED; }
    static State remove(State state) { if (state != State.MANAGED) throw new IllegalStateException(); return State.REMOVED; }
    static State commit(State state) { return state == State.REMOVED ? State.GONE : State.DETACHED; }
    public static void main(String[] args) {
        State state = State.NEW;
        state = persist(state); System.out.println("after-persist=" + state);
        state = detach(state); System.out.println("after-detach=" + state);
        state = merge(state); System.out.println("merge-return=" + state);
        state = remove(state); System.out.println("after-remove=" + state);
        state = commit(state); System.out.println("after-commit=" + state);
    }
}`, "after-persist=MANAGED\nafter-detach=DETACHED\nmerge-return=MANAGED\nafter-remove=REMOVED\nafter-commit=GONE", ["jakarta-persistence-spec", "jakarta-entity-manager", "jakarta-persistence-context-type", "hibernate-session-javadoc"])],
    diagnostics: [
      d("transaction 밖에서 entity를 수정했지만 update SQL이 없습니다.", "entity가 detached여서 persistence context가 mutation을 추적하지 않았습니다.", ["transaction/context 종료 시점을 봅니다.", "EntityManager.contains를 test합니다.", "mutation call path를 추적합니다."], "transactional service에서 ID로 다시 load한 managed entity에 domain method를 호출합니다.", "managed/detached mutation integration tests를 둡니다."),
      d("detached entity를 remove에 전달해 IllegalArgumentException이 납니다.", "remove는 managed entity를 요구하는데 context association을 확인하지 않았습니다.", ["instance source와 context를 봅니다.", "find/merge/remove 순서를 확인합니다.", "repository implementation SQL을 봅니다."], "현재 transaction에서 scoped find한 managed entity를 remove하고 missing/concurrency를 처리합니다.", "detached/remove와 concurrent deletion tests를 둡니다."),
    ],
    expertNotes: ["예제의 commit→DETACHED는 transaction-scoped context 교육 model이며 extended context/rollback semantics는 spec과 runtime으로 별도 확인합니다.", "state enum을 entity field로 저장하지 말고 lifecycle은 persistence infrastructure의 association입니다."],
  },
  {
    id: "dirty-checking-snapshot-domain-method",
    title: "managed snapshot과 현재 state 차이를 dirty checking으로 UPDATE 후보로 만듭니다",
    lead: "JPA에는 일반 entity update 메서드가 없으며 managed persistent attributes의 변경을 flush 때 감지해 database update로 동기화합니다.",
    explanations: [
      "provider는 managed entity의 loaded snapshot 또는 enhanced dirty tracking 정보를 유지하고 flush 때 current persistent state와 비교합니다. 변경된 entity가 UPDATE 대상이 되며 exact column list는 mapping/provider dynamic-update 설정에 따릅니다.",
      "setter를 무제한 노출하기보다 changeSubject, softDelete처럼 invariant를 지키는 domain method로 mutation을 제한합니다. dirty checking은 유효하지 않은 state를 막지 않으므로 input/domain validation과 database constraints가 필요합니다.",
      "non-persistent/transient fields, inverse association와 mutable value의 in-place 변경은 mapping에 따라 추적 방식이 다릅니다. embeddable/collection ownership, converters와 enhancement를 actual provider test로 확인합니다.",
      "dirty checking 성공은 commit 성공이 아니며 constraint, optimistic lock와 transaction rollback이 뒤에 남습니다. service가 exception을 숨기지 않고 transaction completion까지 application success를 확정하지 않습니다.",
    ],
    concepts: [
      c("loaded snapshot", "managed entity를 load/flush한 시점의 persistent attribute 기준값으로 current state와 비교하는 provider 추적 정보입니다.", ["implementation detail은 provider마다 다릅니다.", "clear하면 사라집니다."]),
      c("dirty checking", "managed persistent state가 snapshot에서 바뀌었는지 감지해 flush SQL 대상에 반영하는 기능입니다.", ["detached state에는 적용되지 않습니다.", "validation/authorization이 아닙니다."]),
      c("domain mutation method", "entity invariant와 허용 state transition을 이름과 검증으로 캡슐화한 변경 operation입니다.", ["generic setter보다 의도를 드러냅니다.", "transactional service가 호출합니다."]),
    ],
    codeExamples: [java("jpa04-dirty-check", "snapshot 대비 변경 필드와 flush writes 계산", "Jpa04DirtyCheck.java", "managed entry의 snapshot/current state를 비교해 변경된 fields만 dirty set으로 만들고 flush 후 snapshot을 갱신합니다.", String.raw`import java.util.*;

public class Jpa04DirtyCheck {
    static final class Entry {
        String subject; int active;
        Entry(String subject, int active) { this.subject = subject; this.active = active; }
    }
    record Snapshot(String subject, int active) {}
    static Set<String> dirty(Entry value, Snapshot snapshot) {
        Set<String> fields = new TreeSet<>();
        if (!Objects.equals(value.subject, snapshot.subject())) fields.add("subject");
        if (value.active != snapshot.active()) fields.add("active");
        return fields;
    }
    public static void main(String[] args) {
        Entry entry = new Entry("before", 0);
        Snapshot snapshot = new Snapshot(entry.subject, entry.active);
        System.out.println("initial=" + dirty(entry, snapshot));
        entry.subject = "after";
        System.out.println("after-subject=" + dirty(entry, snapshot));
        entry.active = 1;
        Set<String> atFlush = dirty(entry, snapshot);
        System.out.println("at-flush=" + atFlush);
        snapshot = new Snapshot(entry.subject, entry.active);
        System.out.println("after-flush=" + dirty(entry, snapshot));
    }
}`, "initial=[]\nafter-subject=[subject]\nat-flush=[active, subject]\nafter-flush=[]", ["local-guestbook-service", "jakarta-persistence-spec", "jakarta-entity-manager", "hibernate-user-guide", "hibernate-session-javadoc"])],
    diagnostics: [
      d("managed entity를 바꿨는데 UPDATE가 없습니다.", "entity가 detached, transaction readOnly/flush mode, field non-persistent 또는 mutation이 되돌아갔습니다.", ["contains/context/transaction을 봅니다.", "persistent mapping과 snapshot을 봅니다.", "flush/rollback/readOnly provider behavior를 확인합니다."], "write transaction 안에서 managed persistent field를 domain method로 변경하고 flush/commit/readback합니다.", "managed/detached/readOnly/transient-field matrix를 둡니다."),
      d("의도하지 않은 여러 columns가 UPDATE됩니다.", "provider가 entity-wide UPDATE를 생성하거나 setter/mapping callback이 추가 fields를 변경했습니다.", ["dirty attributes와 SQL columns를 봅니다.", "callbacks/converters를 확인합니다.", "dynamic update 설정/plan cache tradeoff를 봅니다."], "mutation 범위를 줄이고 mapping/callback을 교정하며 dynamic update는 측정 후 선택합니다.", "field별 mutation SQL/result tests와 query-plan budget을 둡니다."),
    ],
    expertNotes: ["dirty checking algorithm과 bytecode enhancement는 provider implementation 영역이므로 spec 보장과 Hibernate 최적화를 분리합니다.", "entity setter를 호출했다고 곧바로 SQL이 실행되는 것이 아니며 flush timing이 observability의 핵심입니다."],
  },
  {
    id: "flush-mode-query-commit-order",
    title: "AUTO·COMMIT flush mode와 query/commit synchronization 순서를 evidence로 확인합니다",
    lead: "flush는 명시 호출뿐 아니라 commit과 query correctness를 위해 provider가 자동 수행할 수 있으므로 SQL 시점을 source line과 동일시하지 않습니다.",
    explanations: [
      "FlushModeType.AUTO는 default이며 unflushed changes가 query 결과에 영향을 줄 수 있을 때 query 전에 flush해야 할 수 있습니다. COMMIT은 commit 전 flush하되 query 전 visibility semantics가 다릅니다.",
      "provider는 spec이 허용하는 범위에서 명시 flush 이전에도 database write를 수행할 수 있으므로 flush를 write 시작점이 아니라 synchronization guarantee로 이해합니다. transaction isolation이 다른 transaction visibility를 결정합니다.",
      "native query, JPQL, stored procedure와 provider-specific manual/readOnly modes는 flush interaction이 다를 수 있습니다. target provider/version과 query type별 SQL timeline을 test합니다.",
      "flush failure는 transaction을 rollback-only로 만들 수 있으며 같은 transaction에서 복구해 계속 쓰려 하지 않습니다. exception을 service boundary 밖으로 보존하고 새 unit-of-work에서 명시적으로 retry합니다.",
    ],
    concepts: [
      c("FlushModeType.AUTO", "commit뿐 아니라 affected query의 정확성을 위해 provider가 flush할 수 있는 기본 JPA mode입니다.", ["exact SQL timing은 provider가 결정합니다.", "transaction 안에서 동작합니다."]),
      c("FlushModeType.COMMIT", "transaction commit 시 synchronization을 요구하고 query 전 flush 영향이 제한되는 mode입니다.", ["stale query possibility를 이해합니다.", "provider extensions와 구분합니다."]),
      c("synchronization point", "persistence context state가 database operations로 반영되도록 요구되는 flush/commit/query 경계입니다.", ["durable commit과 다릅니다.", "constraints가 드러날 수 있습니다."]),
    ],
    diagnostics: [
      d("조회만 호출했는데 그 직전에 UPDATE SQL과 constraint failure가 납니다.", "AUTO flush가 pending changes가 query 결과에 영향을 줄 수 있어 먼저 동기화했습니다.", ["flush mode와 pending dirty entities를 봅니다.", "query spaces/provider trace를 확인합니다.", "transaction call timeline을 봅니다."], "query 전에 invalid pending state를 만들지 않고 unit-of-work를 명확히 하며 필요한 failure mapping을 둡니다.", "mutation→JPQL/native query flush-order tests를 둡니다."),
      d("COMMIT mode에서 query가 방금 변경한 조건을 반영하지 않습니다.", "query 전 flush를 보장한다고 가정했습니다.", ["flush mode와 provider behavior를 봅니다.", "explicit flush 유무를 확인합니다.", "query가 DB/managed overlay를 어떻게 처리하는지 봅니다."], "read-your-writes가 필요한 지점에 명시 flush 또는 in-memory decision을 사용하고 mode를 성능 이유만으로 바꾸지 않습니다.", "AUTO/COMMIT query visibility contract tests를 둡니다."),
    ],
    expertNotes: ["flush 호출 횟수보다 생성 SQL, rows, constraint timing과 transaction duration을 함께 관찰합니다.", "manual/never modes는 Jakarta FlushModeType가 아니라 provider/Spring optimization일 수 있어 portability를 표시합니다."],
  },
  {
    id: "flush-clear-reload-readback",
    title: "flush→clear→find로 1차 cache를 제거하고 실제 DB round trip을 검증합니다",
    lead: "같은 context에서 entity를 다시 읽으면 managed instance가 반환되어 mapping, trigger, converter와 database default가 맞는지 증명하지 못할 수 있습니다.",
    explanations: [
      "flush는 pending changes를 DB에 보내고 clear는 모든 managed entities를 detached로 만듭니다. 이후 find는 새 materialization을 요구해 database representation을 다시 읽게 합니다.",
      "integration test에서 save 후 같은 instance field만 assert하면 setter 전 값이 그대로 보여 false positive가 됩니다. flush/clear/reload 또는 새 transaction/context를 사용해 column mapping, generated/default, converter와 precision을 검증합니다.",
      "clear 전에 flush하지 않으면 pending unflushed changes가 영구 반영되지 않을 수 있습니다. 다만 provider가 이미 write했을 가능성도 있어 portable application은 explicit ordering으로 의도를 고정합니다.",
      "fresh readback도 commit을 대체하지 않습니다. same transaction isolation 안의 uncommitted row를 읽을 수 있으므로 durable behavior는 실제 commit 후 새 transaction에서 다시 확인합니다.",
    ],
    concepts: [
      c("clear", "persistence context의 모든 managed entities를 detach하고 identity map/snapshots를 비우는 EntityManager operation입니다.", ["pending changes를 잃을 수 있습니다.", "database rows를 지우지 않습니다."]),
      c("fresh readback", "1차 cache를 제거한 뒤 DB에서 entity를 다시 materialize해 persistence mapping 결과를 확인하는 검증입니다.", ["flush가 선행합니다.", "commit readback과 구분합니다."]),
      c("false-positive persistence test", "managed in-memory 값을 DB round trip 결과로 오인해 mapping/constraint 오류를 놓치는 테스트입니다.", ["clear/reload로 방지합니다.", "target DB를 사용합니다."]),
    ],
    codeExamples: [java("jpa04-flush-clear", "flush·clear·reload와 unflushed clear 차이", "Jpa04FlushClear.java", "managed current state를 database에 flush한 뒤 clear/reload하고, unflushed 변경은 clear에서 잃는 model입니다.", String.raw`import java.util.*;

public class Jpa04FlushClear {
    static final class Context {
        final Map<Long, String> db; final Map<Long, String> managed = new HashMap<>();
        Context(Map<Long, String> db) { this.db = db; }
        String find(long id) { return managed.computeIfAbsent(id, db::get); }
        void change(long id, String value) { managed.put(id, value); }
        void flush() { db.putAll(managed); }
        void clear() { managed.clear(); }
    }
    public static void main(String[] args) {
        Map<Long, String> db = new HashMap<>(Map.of(1L, "db-before"));
        Context context = new Context(db);
        context.find(1L); context.change(1L, "flushed"); context.flush(); context.clear();
        System.out.println("reload-after-flush=" + context.find(1L));
        context.change(1L, "unflushed"); context.clear();
        System.out.println("reload-after-clear=" + context.find(1L));
        System.out.println("database=" + db.get(1L));
        System.out.println("managed-size=" + context.managed.size());
    }
}`, "reload-after-flush=flushed\nreload-after-clear=flushed\ndatabase=flushed\nmanaged-size=1", ["jakarta-entity-manager", "jakarta-persistence-spec", "jakarta-flush-mode", "spring-orm-jpa", "hibernate-user-guide"])],
    diagnostics: [
      d("save integration test는 성공하지만 실제 column readback은 null입니다.", "같은 managed instance만 assert해 DB mapping을 읽지 않았습니다.", ["clear/new context가 있는지 봅니다.", "SQL binds/result를 확인합니다.", "catalog column/default/converter를 대조합니다."], "flush-clear-find 또는 commit 후 새 transaction으로 round trip을 검증합니다.", "모든 mapping/constraint test에 fresh-context readback을 둡니다."),
      d("clear 호출 뒤 방금 수정한 값이 사라졌습니다.", "pending dirty state를 flush하기 전에 전체 context를 비웠습니다.", ["flush/clear call order를 봅니다.", "dirty entity counts를 확인합니다.", "bulk operation helper를 추적합니다."], "unit-of-work 의도에 따라 flush한 뒤 clear하거나 변경을 rollback할 것임을 명시합니다.", "unflushed clear data-loss negative test를 둡니다."),
    ],
    expertNotes: ["clear는 특정 entity만이 아니라 context 전체를 detach하므로 공유 unit-of-work에서 side effect가 큽니다.", "database trigger/default가 insert/update 뒤 값을 바꾸면 refresh 또는 fresh read가 필요하며 provider generated-value support를 검토합니다."],
  },
  {
    id: "detached-merge-return-copy",
    title: "detached mutation과 merge의 state-copy·반환 managed instance semantics를 분리합니다",
    lead: "merge는 detached 객체를 다시 붙이는 단순 attach가 아니라 state를 current context의 managed instance에 복사해 반환하는 operation입니다.",
    explanations: [
      "transaction 밖으로 entity를 전달해 수정하면 detached input은 자동 dirty checking 대상이 아닙니다. 다음 request에서 merge하면 stale fields 전체가 current database state를 덮을 수 있어 lost update와 over-posting 위험이 있습니다.",
      "EntityManager.merge는 같은 persistent identity의 managed instance를 찾거나 만들고 input state를 복사한 뒤 그 managed instance를 반환합니다. input 자체는 detached로 남을 수 있으므로 반환값을 사용합니다.",
      "web update에서는 detached request entity merge보다 ID로 authorized managed entity를 load하고 command의 허용 fields만 domain methods로 patch하는 방식이 안전합니다. @Version으로 stale revision을 검증합니다.",
      "merge cascade는 association graph로 전파되어 예상치 못한 insert/update를 만들 수 있습니다. cascade=MERGE ownership과 request graph 크기를 제한하고 SQL/entity counts를 test합니다.",
    ],
    concepts: [
      c("merge", "new/detached state를 current persistence context의 managed instance에 복사하고 그 instance를 반환하는 operation입니다.", ["input attach가 아닙니다.", "cascade와 version을 고려합니다."]),
      c("lost update", "두 actor가 같은 이전 state를 읽고 나중 write가 앞선 변경을 덮어 손실시키는 concurrency anomaly입니다.", ["@Version이 탐지할 수 있습니다.", "blind merge를 피합니다."]),
      c("load-and-patch", "현재 authorized managed entity를 조회한 뒤 command가 허용한 fields만 변경하는 update 방식입니다.", ["mass assignment를 줄입니다.", "dirty checking과 version을 사용합니다."]),
    ],
    codeExamples: [java("jpa04-merge", "detached input과 merge 반환 managed copy의 identity 차이", "Jpa04Merge.java", "context가 DB current state를 load한 뒤 detached 허용 state를 managed copy로 반영하고 input은 관리하지 않는 model입니다.", String.raw`import java.util.*;

public class Jpa04Merge {
    static final class Entry {
        final long id; String subject;
        Entry(long id, String subject) { this.id = id; this.subject = subject; }
    }
    static final class Context {
        final Map<Long, Entry> managed = new HashMap<>();
        Entry merge(Entry detached) {
            Entry target = managed.computeIfAbsent(detached.id, id -> new Entry(id, "database-current"));
            target.subject = detached.subject;
            return target;
        }
        boolean contains(Entry value) { return managed.get(value.id) == value; }
    }
    public static void main(String[] args) {
        Entry detached = new Entry(5L, "client-change");
        Context context = new Context();
        Entry returned = context.merge(detached);
        System.out.println("same-instance=" + (detached == returned));
        System.out.println("input-managed=" + context.contains(detached));
        System.out.println("returned-managed=" + context.contains(returned));
        detached.subject = "later-detached-change";
        System.out.println("managed-subject=" + returned.subject);
    }
}`, "same-instance=false\ninput-managed=false\nreturned-managed=true\nmanaged-subject=client-change", ["spring-data-entity-persistence", "jakarta-entity-manager", "jakarta-persistence-spec", "hibernate-session-javadoc"])],
    diagnostics: [
      d("merge 후 input을 수정했는데 DB update에 포함되지 않습니다.", "merge input이 managed가 되었다고 오해하고 반환 instance를 버렸습니다.", ["input/return reference identity를 봅니다.", "EntityManager.contains를 비교합니다.", "후속 mutation target을 추적합니다."], "merge 반환값을 사용하거나 load-and-patch로 detached merge 자체를 제거합니다.", "merge identity와 post-merge mutation tests를 둡니다."),
      d("사용자가 보내지 않은 field가 old detached 값으로 덮였습니다.", "전체 detached entity를 merge해 stale/untrusted graph를 복사했습니다.", ["request→entity binding을 봅니다.", "version과 changed fields를 확인합니다.", "merge cascade SQL을 봅니다."], "request DTO allowlist와 current managed load-and-patch, @Version conflict를 적용합니다.", "partial request/stale version/hostile field tests를 둡니다."),
    ],
    expertNotes: ["merge가 DB SELECT를 수행하는지와 timing은 entity state/context/provider에 따라 달라지므로 SQL을 측정합니다.", "merge 반환값 규칙은 repository save(existing) 반환값을 사용해야 하는 JPA03 교훈과 연결됩니다."],
  },
  {
    id: "bulk-dml-stale-context",
    title: "JPQL bulk update/delete가 managed snapshots와 callbacks를 우회하는 문제를 재현합니다",
    lead: "bulk DML은 database rows를 직접 바꾸며 persistence context의 개별 entity state를 자동으로 수정하지 않습니다.",
    explanations: [
      "@Modifying @Query update/delete 또는 JpaRepository batch delete는 single statement로 효율적이지만 이미 load한 managed entity는 이전 값을 유지할 수 있습니다. 이후 dirty flush가 bulk 결과를 덮는 위험도 있습니다.",
      "Spring Data는 modifying query 뒤 EntityManager를 자동 clear하지 않을 수 있는데 clear가 unflushed changes를 버리기 때문입니다. flushAutomatically/clearAutomatically 또는 명시 flush→bulk→clear를 operation별로 결정합니다.",
      "bulk DML은 entity callbacks, cascade와 domain mutation methods를 거치지 않습니다. audit, soft-delete events와 outbox가 필요하면 동일 transaction에서 명시적으로 생성하거나 lifecycle path를 선택합니다.",
      "bulk operation은 짧은 전용 service method/transaction에 격리하고 affected rows, predicate scope와 새 context readback을 검증합니다. controller가 arbitrary predicate를 전달하지 않게 command allowlist를 둡니다.",
    ],
    concepts: [
      c("JPQL bulk DML", "entity instances를 materialize하지 않고 JPQL update/delete로 여러 database rows를 직접 바꾸는 operation입니다.", ["managed state를 자동 갱신하지 않습니다.", "callbacks를 우회합니다."]),
      c("clearAutomatically", "@Modifying 실행 뒤 persistence context를 clear할지 지정하는 Spring Data option입니다.", ["pending changes 손실을 고려합니다.", "flushAutomatically와 순서를 봅니다."]),
      c("stale overwrite", "bulk로 변경된 DB row를 오래된 managed snapshot의 후속 flush가 다시 덮는 위험입니다.", ["context를 격리/clear합니다.", "version/affected rows를 사용합니다."]),
    ],
    codeExamples: [java("jpa04-bulk-stale", "bulk update 뒤 managed entity stale과 clear/reload", "Jpa04BulkStale.java", "DB를 직접 바꾼 bulk operation이 context 값을 갱신하지 않고 clear 뒤에야 fresh value를 읽는 model입니다.", String.raw`import java.util.*;

public class Jpa04BulkStale {
    static final class Context {
        final Map<Long, Integer> db; final Map<Long, Integer> managed = new HashMap<>();
        Context(Map<Long, Integer> db) { this.db = db; }
        int find(long id) { return managed.computeIfAbsent(id, db::get); }
        int bulkSet(int value) { int count = db.size(); db.replaceAll((id, old) -> value); return count; }
        void clear() { managed.clear(); }
    }
    public static void main(String[] args) {
        Map<Long, Integer> db = new HashMap<>(Map.of(1L, 0, 2L, 0));
        Context context = new Context(db);
        System.out.println("before=" + context.find(1L));
        System.out.println("affected=" + context.bulkSet(1));
        System.out.println("managed-stale=" + context.find(1L));
        System.out.println("database=" + db.get(1L));
        context.clear();
        System.out.println("after-clear=" + context.find(1L));
    }
}`, "before=0\naffected=2\nmanaged-stale=0\ndatabase=1\nafter-clear=1", ["spring-data-query-methods", "spring-data-modifying", "spring-data-transactions", "jakarta-entity-manager", "hibernate-user-guide"])],
    diagnostics: [
      d("bulk soft delete 후 같은 service에서 entity.active가 이전 값입니다.", "bulk query가 managed instance를 수정하지 않았습니다.", ["bulk affected rows와 context prior loads를 봅니다.", "clearAutomatically 설정을 확인합니다.", "후속 dirty mutations를 추적합니다."], "pending state를 flush한 뒤 bulk하고 clear/reload하거나 bulk를 별도 transaction으로 격리합니다.", "load→bulk→read/mutate context tests를 둡니다."),
      d("clearAutomatically를 켠 뒤 다른 변경이 사라졌습니다.", "bulk 전에 unrelated unflushed managed changes가 있었고 clear가 전부 detach했습니다.", ["dirty entities와 flush count를 봅니다.", "transaction에 여러 업무가 섞였는지 봅니다.", "flushAutomatically 순서를 확인합니다."], "bulk unit-of-work를 작게 분리하고 필요한 changes를 먼저 flush하되 partial commit 의미를 검토합니다.", "unrelated dirty entity+bulk clear negative test를 둡니다."),
    ],
    expertNotes: ["bulk update에 @Version increment/check가 자동 적용된다고 가정하지 말고 concurrency policy를 명시합니다.", "affected row count가 예상과 다르면 transaction을 중단하는 guard를 destructive operations에 적용합니다."],
  },
  {
    id: "readonly-context-lazy-boundary",
    title: "readOnly transaction, managed reads와 lazy state를 최적화 hint·correctness boundary로 구분합니다",
    lead: "readOnly는 일반적으로 provider/driver 최적화 hint이며 entity를 immutable로 만들거나 write를 보안상 차단하는 절대 규칙이 아닙니다.",
    explanations: [
      "Spring Data inherited read operations는 readOnly 설정을 가질 수 있고 Hibernate에서는 flush mode/dirty checking 최적화가 적용될 수 있습니다. 그러나 database/provider에 따라 write가 거부되거나 조용히 동작할 수 있어 correctness guard로 의존하지 않습니다.",
      "원본 class-level jakarta.transaction.Transactional은 Spring @Transactional의 readOnly 속성을 표현하지 않습니다. maintained service는 query methods에 Spring readOnly=true를 명시할지 target stack과 정책에 맞춰 선택합니다.",
      "read transaction 안에서 entity가 managed여도 lazy association이 반드시 필요한 것은 아닙니다. use-case query/projection으로 필요한 graph만 load하고 transaction 안에서 DTO로 materialize합니다.",
      "Open Session/EntityManager in View로 web serialization까지 context를 늘리면 lazy failure는 줄어도 query location, N+1과 transaction/data consistency가 숨을 수 있습니다. service boundary에서 query count와 DTO contract를 고정합니다.",
    ],
    concepts: [
      c("readOnly hint", "transaction manager가 JDBC/provider에 전달해 flush/dirty-check 최적화 등에 사용할 수 있는 읽기 의도입니다.", ["write security control이 아닙니다.", "target behavior를 검증합니다."]),
      c("lazy attribute", "entity/association state 접근을 실제 load 시점까지 미룰 수 있는 provider-managed representation입니다.", ["context가 필요할 수 있습니다.", "serialization에서 N+1을 주의합니다."]),
      c("OSIV", "web request 동안 persistence context를 view rendering까지 열어 두는 pattern/configuration입니다.", ["service transaction과 다릅니다.", "query ownership/N+1 tradeoff가 있습니다."]),
    ],
    diagnostics: [
      d("readOnly method에서 entity를 바꿨는데 환경별로 반영 여부가 다릅니다.", "readOnly를 portable write prohibition으로 오해했습니다.", ["annotation 종류와 transaction manager를 봅니다.", "provider flush mode/DB read-only를 확인합니다.", "commit readback을 실행합니다."], "write methods와 read methods를 구조적으로 분리하고 domain mutation은 readOnly path에서 금지하는 tests/review를 둡니다.", "provider/DB readOnly mutation matrix를 둡니다."),
      d("OSIV를 끄자 JSON serialization이 실패합니다.", "controller가 entity lazy graph에 의존했습니다.", ["uninitialized attributes와 serialization stack을 봅니다.", "service query/projection을 확인합니다.", "N+1 count를 측정합니다."], "service transaction 안에서 DTO/projection을 완성하고 필요한 fetch plan을 use-case별로 정의합니다.", "OSIV-off context-closed serialization tests를 둡니다."),
    ],
    expertNotes: ["jakarta.transaction.Transactional과 Spring @Transactional은 available attributes가 다르므로 import를 review 규칙으로 확인합니다.", "lazy loading 자체를 나쁘다고 하지 말고 접근 시점, transaction, query budget과 public model ownership을 설계합니다."],
  },
  {
    id: "large-batch-context-memory",
    title: "대량 insert/update에서 persistence context 크기를 chunk flush·clear로 제한합니다",
    lead: "write-behind를 위해 managed entities를 모두 보관하면 rows가 늘수록 snapshots, collections와 entity graph가 heap을 점유합니다.",
    explanations: [
      "saveAll은 모든 entities를 한 SQL로 보내거나 memory를 자동 제한한다는 보장이 아닙니다. IDENTITY strategy, JDBC batching와 provider ordering 설정이 SQL batch 가능성을 바꾸며 actual statistics를 측정합니다.",
      "긴 loop는 일정 chunk마다 flush한 뒤 clear해 managed count를 제한할 수 있습니다. clear 후 entities는 detached이므로 후속 graph references, generated IDs와 mutation logic이 이를 기대하도록 설계합니다.",
      "chunk flush는 아직 같은 transaction이면 commit 전 locks/undo/log가 계속 쌓일 수 있습니다. transaction chunking은 partial progress와 restart/idempotency checkpoint가 필요하므로 단순 clear 최적화와 구분합니다.",
      "batch failure에서 어느 item/chunk가 반영됐는지, retry가 duplicate를 만들지, outbox/audit가 일치하는지 설계합니다. request thread에서 거대 batch를 동기 처리하지 않고 bounded job worker를 고려합니다.",
    ],
    concepts: [
      c("managed-count budget", "한 persistence context가 동시에 추적하도록 허용한 entity/snapshot 수의 상한입니다.", ["heap과 dirty checking 비용을 제한합니다.", "metrics로 측정합니다."]),
      c("chunk flush-clear", "일정 개수의 writes를 flush한 뒤 context를 clear해 1차 cache를 비우는 batch 처리 방식입니다.", ["commit chunking과 다릅니다.", "detached references를 주의합니다."]),
      c("restartable batch", "중간 failure 뒤 중복 없이 안전한 checkpoint부터 재개할 수 있는 job 설계입니다.", ["idempotency key가 필요합니다.", "partial commit을 기록합니다."]),
    ],
    codeExamples: [java("jpa04-batch-context", "chunk flush-clear로 peak managed count 제한", "Jpa04BatchContext.java", "열 개 items를 chunk 3으로 처리해 flush/clear 횟수와 peak context size를 계산합니다.", String.raw`public class Jpa04BatchContext {
    static final class Batch {
        int managed; int peak; int flushes; int clears; int written;
        void persist() { managed++; peak = Math.max(peak, managed); }
        void flushClear() { written += managed; flushes++; managed = 0; clears++; }
    }
    public static void main(String[] args) {
        Batch batch = new Batch();
        int total = 10; int chunk = 3;
        for (int i = 1; i <= total; i++) {
            batch.persist();
            if (i % chunk == 0) batch.flushClear();
        }
        if (batch.managed > 0) batch.flushClear();
        System.out.println("written=" + batch.written);
        System.out.println("peak-managed=" + batch.peak);
        System.out.println("flushes=" + batch.flushes);
        System.out.println("clears=" + batch.clears);
        System.out.println("remaining=" + batch.managed);
    }
}`, "written=10\npeak-managed=3\nflushes=4\nclears=4\nremaining=0", ["jakarta-entity-manager", "hibernate-user-guide", "hibernate-session-javadoc", "spring-orm-jpa"])],
    diagnostics: [
      d("batch 처리 중 heap이 계속 증가합니다.", "모든 processed entities/graphs를 persistence context와 application list가 계속 참조합니다.", ["managed entity count와 heap dominators를 봅니다.", "flush/clear cadence를 확인합니다.", "input/result collections를 봅니다."], "bounded streaming input과 chunk flush-clear를 적용하고 references를 release합니다.", "large-volume heap/GC/managed-count load test를 둡니다."),
      d("flush-clear 최적화 뒤 후반 entity 관계가 transient/detached 오류를 냅니다.", "clear 후 이전 chunk entities를 managed라고 가정해 association을 만들었습니다.", ["chunk boundary와 references를 봅니다.", "cascade/ID availability를 확인합니다.", "getReference/load strategy를 봅니다."], "chunk 간에는 IDs/immutable data만 전달하고 필요 시 current context reference를 다시 획득합니다.", "cross-chunk association tests를 둡니다."),
    ],
    expertNotes: ["peak managed count를 줄여도 database transaction log/locks와 application input list가 memory를 계속 쓸 수 있습니다.", "IDENTITY는 batching을 제한할 수 있으므로 generator/provider/DB matrix를 JPA02 evidence와 연결합니다."],
  },
  {
    id: "context-tests-observability-concurrency",
    title: "identity·dirty·flush·detach·bulk semantics를 fresh-context, SQL budget와 concurrency tests로 고정합니다",
    lead: "한 transaction의 in-memory assertion만으로는 persistence context가 DB와 올바르게 동기화됐는지, 다른 transaction과 충돌하는지 알 수 없습니다.",
    explanations: [
      "identity test는 같은 context 동일 ID의 reference equality와 select count를 확인하고 새 context에서는 다른 Java instance와 같은 persistent identity를 확인합니다. equals/hashCode와 reference equality를 구분합니다.",
      "dirty test는 managed mutation→flush SQL→clear→reload를 검증하고 detached/readOnly/no-change에서는 예상 UPDATE 0을 확인합니다. SQL 문자열 전체보다 operation/affected fields/rows와 outcome을 중심으로 assertion합니다.",
      "bulk test는 prior managed load, pending changes, bulk affected rows, callback/event count, clear/no-clear와 readback matrix를 실행합니다. parser/test transaction의 automatic rollback이 commit-time failures를 숨기지 않게 합니다.",
      "두 transaction이 같은 row를 수정하면 persistence context 각각은 내부적으로 일관돼도 lost update가 생길 수 있습니다. @Version/locking은 JPA09에서 깊게 다루되 지금부터 concurrent barrier fixture와 version column 필요성을 기록합니다.",
      "telemetry는 transaction/context ID를 raw user data 없이 correlation하고 entity loads, managed/dirty counts, flushes, SQL/rows, batch/cache hits와 stable failure category를 수집합니다. entity toString/payload 전체를 기록하지 않습니다.",
    ],
    concepts: [
      c("context conformance matrix", "same/new context, managed/detached, flush/clear/bulk/readOnly 조합의 expected identity, SQL와 DB 결과 cases입니다.", ["provider upgrade에 재실행합니다.", "target DB를 포함합니다."]),
      c("no-op dirty check", "persistent state가 snapshot과 같아 UPDATE가 없어야 하는 검증입니다.", ["setter 호출 여부와 다릅니다.", "callbacks/converters를 고려합니다."]),
      c("provider statistics", "entity load/flush/update, query와 cache behavior를 측정하는 provider-specific observability입니다.", ["production overhead를 검토합니다.", "spec semantics와 구분합니다."]),
    ],
    diagnostics: [
      d("provider upgrade 뒤 query/update 수가 늘었지만 tests가 잡지 못합니다.", "결과 값만 검사하고 context/flush/query budget을 두지 않았습니다.", ["before/after provider stats를 봅니다.", "mapping/fetch/flush mode diff를 확인합니다.", "representative dataset을 대조합니다."], "semantic assertions와 허용 query/flush/rows budgets를 version matrix에 추가합니다.", "provider/DB upgrade performance conformance gate를 둡니다."),
      d("동시 수정에서 마지막 commit이 앞선 값을 덮습니다.", "각 context의 dirty checking만 믿고 inter-transaction concurrency control이 없습니다.", ["두 transaction read/version/commit timeline을 봅니다.", "@Version과 affected rows를 확인합니다.", "retry/idempotency policy를 봅니다."], "@Version optimistic locking 또는 명시 lock/atomic update를 적용하고 conflict를 stable outcome으로 처리합니다.", "barrier-based lost-update/optimistic-conflict tests를 둡니다."),
    ],
    expertNotes: ["provider statistics는 디버그 도구이며 metrics cardinality와 overhead를 통제합니다.", "first-level cache hit ratio를 높이는 것보다 transaction/context를 짧고 business-consistent하게 유지하는 것이 우선입니다."],
  },
  {
    id: "context-release-recovery",
    title: "persistence context 변경을 canary·rollback·incident recovery까지 연결합니다",
    lead: "flush mode, bulk strategy, readOnly와 batch 설정 변화는 SQL 순서와 failure timing을 바꾸므로 코드 review만으로 배포하지 않습니다.",
    explanations: [
      "release artifact에는 provider/version, bytecode enhancement, flush/readOnly/batch settings와 schema migration ID를 연결합니다. architecture docs보다 runtime effective settings와 startup evidence를 우선합니다.",
      "canary에서 update/query/flush counts, transaction p95/p99, managed peak, DB locks/log/replication lag와 stable error categories를 baseline과 비교합니다. SQL logging에 bind/user data를 노출하지 않습니다.",
      "bulk/clear 변경 rollback은 새 code만 되돌린다고 끝나지 않습니다. 이미 bulk-updated data, missed callbacks/outbox/cache와 forward-written values를 reconcile하고 old binary가 읽을 수 있는지 확인합니다.",
      "incident runbook은 offending query/transaction을 식별하고 traffic/job을 중지한 뒤 DB snapshot/ledger, outbox/audit와 cache를 비교합니다. 데이터 수정은 backup/PITR와 forward repair rehearsal 후 승인합니다.",
    ],
    concepts: [
      c("effective persistence settings", "실제 runtime에 적용된 provider, flush, batch, readOnly, cache와 enhancement configuration입니다.", ["source default와 다를 수 있습니다.", "deployment마다 readback합니다."]),
      c("data reconciliation", "DB rows, entity-derived projections, callbacks/events/outbox/cache가 기대한 동일 business state인지 비교·복구하는 과정입니다.", ["bulk incident에 필요합니다.", "audit evidence를 보존합니다."]),
      c("forward recovery", "rollback보다 새 migration/patch로 data와 application을 호환 가능한 상태로 전진 복구하는 전략입니다.", ["destructive changes에서 유용합니다.", "rehearsal이 필요합니다."]),
    ],
    diagnostics: [
      d("bulk release rollback 후 DB와 cache/event 상태가 계속 다릅니다.", "code만 rollback하고 이미 우회된 callbacks/outbox/cache를 reconcile하지 않았습니다.", ["affected rows와 event/outbox counts를 봅니다.", "cache invalidation을 확인합니다.", "old/new binary data compatibility를 시험합니다."], "writes를 격리하고 ledger 기반 forward repair/replay와 cache rebuild를 수행합니다.", "bulk rollback/reconciliation rehearsal을 release gate로 둡니다."),
      d("flush mode 변경 뒤 commit latency와 deadlock이 급증합니다.", "SQL timing/lock duration 변화를 representative concurrency에서 canary하지 않았습니다.", ["flush/SQL/lock timeline을 비교합니다.", "transaction duration과 pool을 봅니다.", "query ordering/provider settings를 확인합니다."], "이전 effective setting으로 안전하게 되돌리거나 transaction/write ordering을 교정하고 점진 재배포합니다.", "flush-mode concurrency load test와 automatic abort threshold를 둡니다."),
    ],
    expertNotes: ["SQL 순서는 provider optimization에 따라 달라질 수 있어 business invariants와 lock order를 모두 관찰합니다.", "원본 hash와 maintained session provenance를 보존하되 원본 repository/service를 자동 수정하지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-service", repository: "local learning source", path: "2026-spring-jpa-test\\src\\main\\java\\com\\study\\jpatest\\guestbook\\service\\GuestBookServiceImpl.java", usedFor: ["@Service", "class-level jakarta.transaction.Transactional", "field-injected repository", "four read delegations", "dirty-checking inventory gap"], evidence: "2026-07-14 read-only audit: 36 lines, 1,023 bytes, SHA-256 376951E8323A82D287BD6AFD288CB6FB5BDA4E36D2B22ABDD984A59EB39BB5F5. 실제 rows/config/local absolute path는 복사하지 않았습니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "specifications/persistence/3.2/jakarta-persistence-spec-3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["persistence context identity", "entity lifecycle", "flush synchronization", "detached/merge", "locking"], evidence: "Jakarta Persistence 3.2 normative context, lifecycle, synchronization와 concurrency contracts를 확인했습니다." },
  { id: "jakarta-entity-manager", repository: "Jakarta Persistence API", path: "jakarta/persistence/EntityManager", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/entitymanager", usedFor: ["find/persist/merge/remove", "contains/detach/clear", "flush/refresh", "identity map"], evidence: "EntityManager가 context/lifecycle/synchronization을 관리하는 공식 API와 method semantics를 확인했습니다." },
  { id: "jakarta-persistence-context", repository: "Jakarta Persistence API", path: "jakarta/persistence/PersistenceContext", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/persistencecontext", usedFor: ["container-managed EntityManager dependency", "context type/synchronization"], evidence: "@PersistenceContext의 container-managed EntityManager와 context configuration 계약을 확인했습니다." },
  { id: "jakarta-persistence-context-type", repository: "Jakarta Persistence API", path: "jakarta/persistence/PersistenceContextType", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/persistencecontexttype", usedFor: ["TRANSACTION vs EXTENDED context lifetime"], evidence: "transaction-scoped와 extended persistence context enum semantics를 확인했습니다." },
  { id: "jakarta-flush-mode", repository: "Jakarta Persistence API", path: "jakarta/persistence/FlushModeType", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/flushmodetype", usedFor: ["AUTO", "COMMIT", "query/commit synchronization"], evidence: "FlushModeType AUTO/COMMIT의 official synchronization semantics를 확인했습니다." },
  { id: "jakarta-persistence-unit-util", repository: "Jakarta Persistence API", path: "jakarta/persistence/PersistenceUnitUtil", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/persistenceunitutil", usedFor: ["identifier/version/load-state diagnostics", "provider-neutral utility"], evidence: "PersistenceUnitUtil의 identifier, version와 loaded-state inspection boundary를 확인했습니다." },
  { id: "spring-data-transactions", repository: "Spring Data JPA Reference", path: "jpa/transactions.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html", usedFor: ["repository/service transaction", "readOnly optimization", "managed mutation", "declared query methods"], evidence: "current repository transaction defaults, facade unit-of-work와 Hibernate readOnly optimization note를 확인했습니다." },
  { id: "spring-data-entity-persistence", repository: "Spring Data JPA Reference", path: "jpa/entity-persistence.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html", usedFor: ["persist/merge", "new-state detection", "save return"], evidence: "save가 EntityManager persist/merge를 선택하는 current official behavior를 확인했습니다." },
  { id: "spring-data-query-methods", repository: "Spring Data JPA Reference", path: "jpa/query-methods.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html", usedFor: ["@Modifying bulk DML", "clear caveat", "derived vs bulk delete callbacks"], evidence: "bulk modifying query가 context를 stale하게 만들 수 있고 automatic clear가 pending changes를 잃을 수 있다는 공식 설명을 확인했습니다." },
  { id: "spring-data-modifying", repository: "Spring Data JPA API", path: "org/springframework/data/jpa/repository/Modifying.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/api/java/org/springframework/data/jpa/repository/Modifying.html", usedFor: ["flushAutomatically", "clearAutomatically", "modifying query marker"], evidence: "current @Modifying API의 flush/clear options와 적용 범위를 확인했습니다." },
  { id: "spring-orm-jpa", repository: "Spring Framework Reference", path: "data-access/orm/jpa.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/orm/jpa.html", usedFor: ["Spring JPA integration", "EntityManager/transaction proxy", "exception translation"], evidence: "Spring의 JPA EntityManagerFactory/EntityManager transaction integration boundary를 확인했습니다." },
  { id: "hibernate-user-guide", repository: "Hibernate ORM", path: "current/userguide/html_single/Hibernate_User_Guide.html", publicUrl: "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html", usedFor: ["provider persistence context", "dirty checking", "flushing", "batching/readOnly"], evidence: "current official Hibernate provider guide의 persistence context, flush, dirty checking와 batching guidance를 확인했습니다." },
  { id: "hibernate-session-javadoc", repository: "Hibernate ORM API", path: "org/hibernate/Session.html", publicUrl: "https://docs.jboss.org/hibernate/orm/current/javadocs/org/hibernate/Session.html", usedFor: ["provider session identity", "managed/detached operations", "flush/clear", "thread confinement"], evidence: "current Hibernate Session API의 persistence context lifecycle와 non-thread-safe usage boundary를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-04-persistence-context-dirty-check", slug: "jpa-04-persistence-context-dirty-check", courseId: "spring", moduleId: "spring-data-jpa", order: 4,
  title: "영속성 컨텍스트·변경 감지·flush",
  subtitle: "원본의 transactional read에서 identity map·entity states·dirty snapshot·flush-clear·detached·bulk/batch caveat까지 확장합니다",
  level: "고급", estimatedMinutes: 100,
  coreQuestion: "JPA가 같은 entity identity와 변경을 persistence context에서 어떻게 추적하고, flush·clear·detach·merge·bulk DML·readOnly·batch가 DB 결과와 memory를 어떻게 바꾸는지 실행 증거로 어떻게 설명할까요?",
  summary: "2026-spring-jpa-test의 GuestBookServiceImpl 한 파일을 read-only로 감사합니다. 원본은 @Service, class-level jakarta.transaction.Transactional, field-injected repository와 네 read delegation만 가지며 실제 entity mutation, dirty checking, flush/clear/merge는 보여 주지 않는다는 inventory gap을 명시합니다. 이를 출발점으로 persistence context/identity map, transaction-scoped identity, new-managed-detached-removed state, snapshot/enhancement dirty checking, AUTO/COMMIT flush timing, flush-clear-reload false-positive 방지, detached merge 반환 instance, bulk DML stale context/callback 우회, readOnly/lazy/OSIV boundary, chunk flush-clear memory, provider/DB/context/concurrency tests와 canary/recovery까지 확장합니다. 일곱 JDK 21 examples는 identity map, lifecycle, dirty set, flush-clear, merge, bulk stale와 batch peak context를 exact stdout으로 실행합니다.",
  objectives: ["원본 transactional read와 dirty-checking inventory gap을 source evidence로 구분한다.", "persistence context와 entity identity당 canonical managed instance를 설명한다.", "new/managed/detached/removed lifecycle state를 operation별로 전이한다.", "snapshot 기반 dirty checking과 domain mutation/validation을 결합한다.", "AUTO/COMMIT, query/commit/explicit flush timing과 failure를 구분한다.", "flush-clear-reload, detached merge 반환값과 false-positive tests를 검증한다.", "bulk DML stale context/callback과 readOnly/lazy/OSIV caveat를 통제한다.", "대량 batch memory, target DB/concurrency/telemetry와 release recovery를 운영한다."],
  prerequisites: [{ title: "JpaRepository가 제공하는 CRUD와 Optional", reason: "Repository save/find/delete가 EntityManager lifecycle operation으로 연결되는 방식을 알아야 persistence context와 flush 결과를 추적할 수 있습니다.", sessionSlug: "jpa-03-repository-crud" }],
  keywords: ["persistence context", "identity map", "first-level cache", "managed entity", "detached entity", "removed entity", "dirty checking", "snapshot", "flush", "FlushModeType", "clear", "refresh", "merge", "bulk DML", "readOnly", "lazy loading", "OSIV", "batch processing"],
  topics,
  lab: {
    title: "원본 transactional reads를 persistence context state laboratory로 확장하기",
    scenario: "synthetic entity와 disposable supported DB에서 identity, dirty changes, flush/clear/detach/merge/bulk/batch를 같은 context timeline과 SQL/readback으로 증명합니다.",
    setup: ["JDK 21", "원본과 호환되는 Boot/Spring Data JPA/Hibernate", "migration이 적용된 disposable supported DB", "synthetic non-PII entities", "provider statistics/SQL count collector", "원본 service read-only", "실제 credential/row 접근 금지"],
    steps: ["원본 service hash/annotation/method bodies를 기록하고 mutation/flush가 없다는 gap을 표시합니다.", "같은 transaction/context에서 동일 ID를 두 번 find해 reference identity와 SQL count를 확인합니다.", "new→persist/managed→detach/clear→merge return→remove lifecycle과 contains를 실행합니다.", "managed domain mutation의 dirty attributes, flush SQL와 no-change UPDATE 0을 검증합니다.", "AUTO/COMMIT에서 mutation 뒤 JPQL/native query와 commit flush ordering을 capture합니다.", "mapping/default/constraint tests를 flush-clear-find 및 실제 commit 후 새 transaction readback으로 수행합니다.", "detached full merge와 authorized load-and-patch/@Version을 비교합니다.", "prior load/pending changes 뒤 bulk DML, callbacks, affected rows와 clear/no-clear matrix를 실행합니다.", "readOnly mutation provider behavior와 OSIV-off DTO/lazy/query-count를 검증합니다.", "대량 writes의 managed peak/heap을 측정하고 chunk flush-clear와 transaction checkpoint를 비교합니다.", "두 transaction lost update barrier와 optimistic version 필요성을 기록합니다.", "provider/schema/effective settings canary와 bulk incident reconciliation/rollback을 rehearsal합니다."],
    expectedResult: ["source evidence와 synthetic/provider 보강이 분리되어 추적됩니다.", "같은 context identity와 lifecycle/contains results가 Jakarta contract와 일치합니다.", "dirty/no-op/detached/readOnly/bulk cases의 SQL와 fresh DB state가 예상대로입니다.", "flush-clear tests가 1차 cache false positive와 pending-change loss를 잡습니다.", "batch peak context, query/flush/transaction budgets와 concurrency conflict가 측정됩니다.", "bulk/callback/outbox/cache reconciliation과 rollback이 반복 가능합니다."],
    cleanup: ["disposable schema/data/accounts, contexts, processes와 provider reports를 제거합니다.", "SQL/bind/provider debug logging을 원복하고 sanitized counts만 보존합니다.", "synthetic canaries와 heap dump/test artifacts를 policy에 맞게 폐기합니다.", "원본 service hash/status unchanged를 readback합니다."],
    extensions: ["bytecode enhancement dirty tracking과 snapshot mode를 provider version별 비교합니다.", "@Version optimistic locking과 conflict retry를 JPA09 corpus로 확장합니다.", "association collection dirty/cascade/orphanRemoval과 N+1을 JPA08로 확장합니다.", "transaction propagation/rollback/lazy/outbox를 다음 JPA05로 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java examples를 실행하고 actual EntityManager/SQL evidence를 대응시키세요.", requirements: ["stdout 완전 일치를 확인합니다.", "identity map reference와 select count를 확인합니다.", "lifecycle transitions를 contains와 대조합니다.", "dirty/no-op fields를 검증합니다.", "flush-clear와 unflushed loss를 재현합니다.", "merge input/return identity를 비교합니다.", "bulk stale/clear를 재현합니다.", "batch peak managed count를 측정합니다."], hints: ["같은 in-memory instance assertion을 DB persistence evidence로 쓰지 말고 fresh-context readback을 추가하세요."], expectedOutcome: "entity state에서 SQL/DB/readback까지 context timeline으로 설명합니다.", solutionOutline: ["identity→state→dirty→flush/clear→merge→bulk→batch 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Service에 안전한 update/soft-delete/bulk maintenance methods를 설계하세요.", requirements: ["constructor injection과 method transaction intent를 둡니다.", "scoped managed load-and-patch를 사용합니다.", "flush/commit failure mapping을 둡니다.", "detached entity return/merge를 제거합니다.", "bulk flush-clear/callback/outbox policy를 둡니다.", "readOnly/DTO/OSIV-off query plan을 둡니다.", "batch memory/checkpoint를 설계합니다.", "provider/target DB/concurrency/canary tests를 포함합니다."], hints: ["save 호출 추가보다 entity가 언제 managed이고 누가 mutation하는지부터 표시하세요."], expectedOutcome: "context state와 DB 결과가 예측 가능한 service implementation plan이 완성됩니다.", solutionOutline: ["audit→scope→load→mutate→flush/readback→bulk/batch→verify 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JPA persistence-context governance를 작성하세요.", requirements: ["transaction-scoped context와 entity escape rules를 정의합니다.", "identity/lifecycle/domain mutation rules를 둡니다.", "flush mode/explicit flush/error timing을 둡니다.", "clear/refresh/merge policy를 둡니다.", "bulk DML/callback/context safeguards를 둡니다.", "readOnly/lazy/OSIV/DTO policy를 둡니다.", "batch managed-count/transaction checkpoint를 둡니다.", "provider/DB/concurrency/telemetry/canary/recovery gates를 포함합니다."], hints: ["EntityManager API 목록이 아니라 state ownership부터 사고 복구까지 표준을 만드세요."], expectedOutcome: "JPA의 숨은 상태와 SQL timing을 감사·검증·복구 가능한 조직 표준이 완성됩니다.", solutionOutline: ["scope→track→synchronize→detach/bulk→observe→recover 순서입니다."] },
  ],
  nextSessions: ["jpa-05-transaction-service-boundary"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["원본 GuestBookServiceImpl.java는 read-only로 36 lines/1,023 bytes, SHA-256 376951E8323A82D287BD6AFD288CB6FB5BDA4E36D2B22ABDD984A59EB39BB5F5를 확인했습니다.", "원본은 class-level jakarta.transaction.Transactional 아래 repository read delegation만 제공하며 entity mutation, dirty checking, flush, clear, detach, merge 또는 bulk DML 실행 evidence는 없습니다.", "원본이 entities를 service 밖으로 반환하는 구조는 context 종료/lazy/DTO boundary 위험의 출발점으로만 사용했고 실제 user rows/config/local absolute path는 복사하지 않았습니다.", "identity map, lifecycle, dirty snapshot, flush modes, bulk stale state, readOnly/OSIV와 batch handling은 Jakarta/Spring Data/Spring ORM/Hibernate 공식 자료와 synthetic examples로 보강했습니다.", "실제 provider/database를 실행하지 않았으므로 SQL timing, snapshots/enhancement, readOnly optimization, constraints, locks와 heap/managed counts는 disposable supported DB lab에서 검증해야 합니다."] },
});

export default session;
