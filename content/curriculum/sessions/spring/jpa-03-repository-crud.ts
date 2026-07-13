import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-15", explanation: "JDK 21 record·Optional·LinkedHashMap·enum으로 Repository CRUD의 type, identity와 unit-of-work 상태를 framework 없이 명시합니다." },
      { lines: "16-끝에서 6줄 전", explanation: "persist/merge 선택, Optional absence, flush constraint, lifecycle/bulk delete 또는 race 결과를 결정적으로 계산합니다." },
      { lines: "마지막 6줄", explanation: "호출 횟수와 observable 결과를 stable stdout으로 출력해 문서의 기대값과 정확히 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring Data JPA·provider·DB·network·실데이터 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 줄바꿈과 대소문자까지 예상 결과와 같아야 합니다.", "in-memory model은 actual SimpleJpaRepository, EntityManager, provider flush, SQL과 database constraints를 대체하지 않습니다."] },
    experiments: [
      { change: "null/existing/missing ID, duplicate value, delete 종류와 호출 순서를 바꿉니다.", prediction: "Optional, persist/merge, flush failure, callback과 context stale 결과가 달라집니다.", result: "같은 corpus를 @DataJpaTest와 지원 DB에서 SQL, lifecycle callback, context state와 commit readback으로 대조합니다." },
      { change: "두 worker가 같은 uniqueness key를 동시에 precheck 후 저장하게 합니다.", prediction: "둘 다 absent를 관찰해도 database unique constraint에서 하나만 성공합니다.", result: "constraint exception translation, rollback과 idempotent conflict response를 확인합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-repository-inventory-gap",
    title: "원본 Repository의 명시 메서드와 상속 CRUD를 분리해 inventory 간극을 기록합니다",
    lead: "interface에 코드가 짧다고 CRUD 의미가 단순한 것은 아니며, 직접 선언한 query와 상위 interface에서 상속한 계약을 각각 근거로 확인해야 합니다.",
    explanations: [
      "원본 GuestBookRepository는 JpaRepository<GuestBook, Long>를 상속하므로 runtime proxy를 통해 save, findById, findAll, delete와 flush 계열을 제공받습니다. 그러나 원본 파일에는 이 CRUD를 호출하는 코드나 Optional 처리 예제가 없으므로 실행 evidence라고 과장하지 않습니다.",
      "원본이 직접 선언한 것은 active 조건의 derived query 한 개, active=0 JPQL 한 개, 위치/이름 parameter를 쓰는 ID 단건 JPQL 두 개입니다. 두 단건 custom methods는 GuestBook을 직접 반환하므로 no result가 null이 될 수 있고, inherited findById는 Optional<GuestBook>을 반환한다는 차이를 문서화합니다.",
      "원본의 실제 package/type/query/column-like 이름은 provenance path와 구조 설명에만 사용합니다. persisted user values, credential, local absolute path와 private environment 정보는 maintained examples에 복사하지 않습니다.",
      "이번 세션의 CRUD/Optional/flush/delete 설명은 current Spring Data JPA/Data Commons/Jakarta Persistence 공식 계약으로 보강합니다. target project가 사용하는 실제 Boot/Spring Data/provider version에서는 method semantics와 SQL을 별도 integration test로 고정합니다.",
    ],
    concepts: [
      c("inherited repository method", "하위 repository interface가 직접 선언하지 않아도 상위 CrudRepository/JpaRepository 계약으로 노출되는 operation입니다.", ["implementation은 proxy/base repository가 제공합니다.", "declared query와 transaction defaults가 다를 수 있습니다."]),
      c("inventory gap", "학습 목표에는 있지만 연결 원본에서 직접 실행 evidence를 찾지 못한 항목입니다.", ["공식 자료와 새 fixture로 보강합니다.", "원본 사실과 구분합니다."]),
      c("repository contract", "aggregate type과 ID type을 기준으로 expose한 저장·조회·삭제 operation, absence와 exception 의미의 합의입니다.", ["SQL shape 전체를 보장하지 않습니다.", "service boundary와 결합합니다."]),
    ],
    diagnostics: [
      d("문서에는 Optional 처리 원본이라고 적혔지만 source에는 Optional이 없습니다.", "JpaRepository 상속 계약과 직접 선언된 nullable custom query를 같은 source evidence로 합쳤습니다.", ["interface의 extends와 declared methods를 분리합니다.", "call sites를 검색합니다.", "generated proxy contract를 공식 API와 대조합니다."], "원본은 상속 가능성과 custom query evidence로 기록하고 Optional 예제는 공식 계약 기반 보강으로 표시합니다.", "sourceRefs, filesRead/filesUsed와 inventory-gap note를 review gate로 둡니다."),
      d("custom findBy…가 no result에서 NullPointerException을 만듭니다.", "직접 entity return을 inherited findById의 Optional과 같은 것으로 오해했습니다.", ["method declared return type을 봅니다.", "0/1/2 row fixtures를 실행합니다.", "nullability package 설정을 확인합니다."], "단건 absence를 Optional 또는 명시된 nullable contract로 통일하고 service에서 not-found로 변환합니다.", "zero/one/multiple result contract tests를 둡니다."),
    ],
    expertNotes: ["repository interface 한 파일만으로 실제 transaction manager, provider SQL와 database constraints를 단정하지 않습니다.", "custom 단건 JPQL은 2개 이상 결과에서 IncorrectResultSize 계열 failure가 될 수 있으므로 unique predicate/constraint를 확인합니다."],
  },
  {
    id: "repository-type-hierarchy-proxy",
    title: "Repository→CrudRepository→JpaRepository type hierarchy와 runtime proxy 책임을 펼칩니다",
    lead: "Spring Data는 domain/ID metadata와 method signature를 읽어 proxy를 만들고 matching CRUD는 base implementation, query methods는 query engine으로 route합니다.",
    explanations: [
      "Repository<T, ID>는 marker 역할을 하며 CrudRepository가 generic CRUD를, ListCrudRepository가 List 반환을, JpaRepository가 flush, saveAndFlush, batch delete와 reference 조회 같은 JPA-specific operations를 추가합니다.",
      "repository bean은 source에 구현 class가 없어도 scanning과 factory가 proxy를 등록합니다. inherited CRUD signatures는 SimpleJpaRepository에 route되고, method-name query와 @Query는 query lookup/creation 경로로 route됩니다.",
      "T와 ID type은 compile-time documentation이면서 runtime entity metadata 선택의 입력입니다. ID type이 entity @Id와 다르거나 repository가 scan 밖이면 startup/call time failure가 나므로 context boot test를 둡니다.",
      "repository를 web layer에서 직접 호출하면 authorization, transaction unit-of-work와 exception translation이 endpoint마다 흩어집니다. controller는 application service를 호출하고 service가 aggregate repository operations를 조합하게 합니다.",
    ],
    concepts: [
      c("repository proxy", "repository interface의 method 호출을 base CRUD 또는 generated/declared query 실행으로 위임하는 Spring bean입니다.", ["implementation source가 interface에 보이지 않습니다.", "AOP/transaction advice와 결합합니다."]),
      c("domain type and ID type", "repository가 관리할 aggregate root class와 persistent identifier class의 generic metadata입니다.", ["entity mapping과 일치해야 합니다.", "public ID parsing과 구분합니다."]),
      c("base repository", "여러 repository가 공유하는 CRUD implementation과 transaction defaults를 제공하는 component입니다.", ["현재 Spring Data version의 SimpleJpaRepository를 확인합니다.", "custom base class는 upgrade 부담이 있습니다."]),
    ],
    diagnostics: [
      d("application 시작 시 repository bean이 생성되지 않습니다.", "scan base package, entity metadata 또는 repository generic type이 잘못됐습니다.", ["main package와 EnableJpaRepositories 범위를 봅니다.", "entity scan/persistence unit을 봅니다.", "condition/startup failure chain을 확인합니다."], "application root 아래 package 구조를 맞추거나 명시 scan을 최소 범위로 구성하고 generic ID를 entity와 일치시킵니다.", "context bootstrap과 repository metadata test를 둡니다."),
      d("같은 이름의 method가 예상과 다른 implementation으로 route됩니다.", "CRUD signature, default/custom implementation fragment와 query derivation 우선순위를 이해하지 못했습니다.", ["declaring interface와 signature를 봅니다.", "repository factory/query lookup logs를 봅니다.", "custom fragment naming/bean을 확인합니다."], "operation을 명확한 이름/signature로 분리하고 custom behavior는 fragment interface/implementation으로 명시합니다.", "repository proxy invocation integration test를 둡니다."),
    ],
    expertNotes: ["proxy 구현 class에 cast하거나 internal method를 호출하지 말고 public repository interface 계약만 소비합니다.", "모든 aggregate에 JpaRepository 전체를 노출할 필요는 없으며 조직 base interface로 필요한 operations만 선택할 수 있습니다."],
  },
  {
    id: "save-new-detection-persist-merge",
    title: "save의 new detection, persist·merge 선택과 반드시 반환 인스턴스를 쓰는 이유를 검증합니다",
    lead: "save는 SQL INSERT의 별명이 아니라 entity가 새 것인지 판정해 EntityManager.persist 또는 merge로 route하는 repository operation입니다.",
    explanations: [
      "Spring Data JPA는 기본적으로 nullable @Version을 먼저 보고, 없으면 identifier null 여부로 new state를 판정합니다. manually assigned ID처럼 null ID 기준이 맞지 않으면 Persistable.isNew 또는 custom entity information을 검토합니다.",
      "new entity는 persist 경로로 managed가 되고 existing/detached로 판단되면 merge 경로가 될 수 있습니다. merge는 전달 객체를 managed로 바꾸는 보장이 아니라 state가 복사된 managed instance를 반환하므로 이후 identity와 값은 save 반환값을 사용합니다.",
      "save 호출이 즉시 SQL/constraint 성공을 의미하지 않습니다. IDENTITY 전략은 insert timing에 영향을 주고 다른 writes는 flush/commit까지 지연될 수 있으므로 HTTP 성공을 transaction completion 이전에 확정하지 않습니다.",
      "이미 managed entity를 같은 transaction에서 수정하면 JPA dirty checking에 별도 save가 엄밀히 필요하지 않을 수 있지만 repository abstraction의 일관성, domain event publication과 code convention을 고려합니다. 다음 세션에서 managed state를 더 깊게 다룹니다.",
    ],
    concepts: [
      c("new-state detection", "save가 persist와 merge 중 어느 operation을 사용할지 entity version/ID/Persistable contract로 판정하는 과정입니다.", ["assigned ID에서 주의합니다.", "provider DB existence query와 동일하지 않습니다."]),
      c("persist", "new entity를 current persistence context에 managed로 만들고 동기화 시 insert 대상으로 만드는 operation입니다.", ["generated ID timing은 strategy/provider에 따릅니다.", "transaction이 필요합니다."]),
      c("merge return instance", "detached/new state를 managed instance에 복사하고 그 managed instance를 반환하는 merge 결과입니다.", ["입력과 Java identity가 다를 수 있습니다.", "반환값을 계속 사용합니다."]),
    ],
    codeExamples: [java("jpa03-save-semantics", "new detection과 persist·merge 반환 인스턴스", "Jpa03SaveSemantics.java", "null ID는 persist, non-null ID는 merge copy로 모델링하고 caller가 반환 객체를 사용해야 함을 보여 줍니다.", String.raw`public class Jpa03SaveSemantics {
    record Entry(Long id, String subject) {}
    record Saved(Entry value, String action, boolean sameInstance) {}

    static Saved save(Entry input) {
        if (input.id() == null) {
            Entry managed = new Entry(101L, input.subject());
            return new Saved(managed, "persist", input == managed);
        }
        Entry managedCopy = new Entry(input.id(), input.subject());
        return new Saved(managedCopy, "merge", input == managedCopy);
    }
    public static void main(String[] args) {
        Saved created = save(new Entry(null, "first"));
        Entry detached = new Entry(7L, "renamed");
        Saved updated = save(detached);
        System.out.println("create=" + created.action() + ",id=" + created.value().id());
        System.out.println("create-same=" + created.sameInstance());
        System.out.println("update=" + updated.action() + ",id=" + updated.value().id());
        System.out.println("merge-input-same=" + updated.sameInstance());
        System.out.println("use-returned=" + (updated.value() != detached));
    }
}`, "create=persist,id=101\ncreate-same=false\nupdate=merge,id=7\nmerge-input-same=false\nuse-returned=true", ["local-guestbook-repository", "spring-data-entity-persistence", "spring-data-simple-jpa", "jakarta-entity-manager", "jakarta-persistence-spec"])],
    diagnostics: [
      d("assigned ID의 새 entity가 INSERT 대신 SELECT/merge 경로로 갑니다.", "ID non-null을 existing으로 판단하는 default new detection이 domain ID strategy와 맞지 않습니다.", ["@Version/ID/Persistable.isNew를 봅니다.", "save SQL/EntityManager path를 trace합니다.", "ID assignment 시점을 확인합니다."], "nullable version 또는 audited Persistable lifecycle로 new state를 명시하고 create/update commands를 분리합니다.", "assigned-ID new/existing/duplicate integration tests를 둡니다."),
      d("save 후 전달 객체를 수정했는데 DB에 반영되지 않습니다.", "merge 반환 managed instance 대신 detached input을 계속 사용했습니다.", ["save 반환값 identity와 EntityManager.contains를 봅니다.", "transaction/context 경계를 봅니다.", "후속 mutation target을 확인합니다."], "save/merge 반환값을 사용하거나 transaction 안에서 find한 managed entity를 domain method로 수정합니다.", "detached merge identity test와 clear/reload readback을 둡니다."),
    ],
    expertNotes: ["예제는 semantics를 강조한 model이며 실제 persist 경로는 같은 instance를 managed로 만들 수 있습니다. provider behavior는 EntityManager.contains로 검증합니다.", "save를 upsert API처럼 사용하면 존재/권한/optimistic-lock 의미가 흐려질 수 있어 create와 update application commands를 분리합니다."],
  },
  {
    id: "findbyid-optional-absence",
    title: "findById Optional을 absence contract로 사용하고 null·getReference·custom 단건을 구분합니다",
    lead: "Optional은 entity가 없을 수 있다는 사실을 method signature에 드러내지만 authorization, lazy reference와 HTTP 404 정책을 자동 해결하지 않습니다.",
    explanations: [
      "CrudRepository.findById는 null이 아닌 ID를 받고 결과가 없으면 Optional.empty를 반환합니다. Optional.get을 바로 호출하지 말고 orElseThrow, map, ifPresent 등 호출 목적에 맞는 흐름으로 absence를 처리합니다.",
      "원본 custom entity-return methods는 no result에서 null이 될 수 있어 inherited findById와 다릅니다. 단건 query가 2행 이상이면 incorrect result failure가 될 수 있으므로 predicate uniqueness를 database constraint와 정렬합니다.",
      "getReferenceById는 즉시 row를 읽는 Optional lookup이 아니라 lazy reference를 반환할 수 있고 state 접근 때 EntityNotFound가 나타날 수 있습니다. foreign-key association 설정처럼 reference가 필요한 경우와 존재 확인을 구분합니다.",
      "service는 missing, forbidden과 deleted visibility를 threat model에 따라 404/403 domain error로 변환하고 entity 자체가 아니라 authorized response DTO를 반환합니다. Optional을 controller JSON으로 직렬화하지 않습니다.",
    ],
    concepts: [
      c("Optional.empty", "findById가 해당 identifier의 entity를 찾지 못했음을 null 대신 나타내는 value state입니다.", ["business error로 변환합니다.", "field나 parameter에 무분별하게 쓰지 않습니다."]),
      c("getReferenceById", "identifier를 가진 entity reference를 반환해 state loading을 지연할 수 있는 JPA-specific repository operation입니다.", ["존재 확인과 다릅니다.", "context 밖 접근을 주의합니다."]),
      c("absence policy", "missing, hidden, deleted resource를 application/HTTP에서 어떤 안전한 결과로 나타낼지 정한 규칙입니다.", ["authorization leakage를 고려합니다.", "collection empty와 단건 missing을 구분합니다."]),
    ],
    codeExamples: [java("jpa03-optional", "Optional을 200/404 domain result로 변환", "Jpa03Optional.java", "null이나 Optional.get 대신 map/orElse로 deterministic response를 생성합니다.", String.raw`import java.util.*;

public class Jpa03Optional {
    record Entry(long id, String subject) {}
    record Result(int status, String body) {}
    static Result detail(Map<Long, Entry> store, long id) {
        return Optional.ofNullable(store.get(id))
                .map(value -> new Result(200, "subject=" + value.subject()))
                .orElseGet(() -> new Result(404, "code=ENTRY_NOT_FOUND"));
    }
    public static void main(String[] args) {
        Map<Long, Entry> store = Map.of(1L, new Entry(1L, "hello"));
        Result found = detail(store, 1L);
        Result missing = detail(store, 9L);
        System.out.println("found=" + found.status() + "," + found.body());
        System.out.println("missing=" + missing.status() + "," + missing.body());
        System.out.println("optional-present=" + Optional.ofNullable(store.get(1L)).isPresent());
        System.out.println("optional-empty=" + Optional.ofNullable(store.get(9L)).isEmpty());
    }
}`, "found=200,subject=hello\nmissing=404,code=ENTRY_NOT_FOUND\noptional-present=true\noptional-empty=true", ["local-guestbook-repository", "spring-data-crud", "spring-data-null-handling", "spring-data-return-types", "jdk-optional"])],
    diagnostics: [
      d("missing ID에서 NoSuchElementException이 500으로 나갑니다.", "Optional.get을 presence 검사 없이 호출했습니다.", ["findById call chain을 봅니다.", "Optional terminal operation을 봅니다.", "exception-to-HTTP mapping을 확인합니다."], "orElseThrow로 stable domain NotFound를 만들고 global error contract로 404를 반환합니다.", "missing ID service/HTTP contract test를 둡니다."),
      d("getReferenceById 직후에는 성공했는데 DTO mapping에서 EntityNotFound가 납니다.", "lazy reference를 존재하는 loaded entity로 오해했습니다.", ["SQL 실행 시점과 reference state를 봅니다.", "mapping이 transaction/context 안인지 봅니다.", "row deletion race를 확인합니다."], "존재가 필요한 read는 findById를 사용하고 reference 사용 시 state 접근/constraint failure 계약을 명시합니다.", "reference missing과 context-close integration tests를 둡니다."),
    ],
    expertNotes: ["Optional은 absence를 표현하지 접근 권한을 증명하지 않으므로 owner/tenant predicate를 repository query에 포함합니다.", "entity-return custom methods를 Optional로 바꿀 때 callers, nullability annotations와 query result multiplicity를 함께 migration합니다."],
  },
  {
    id: "collection-findall-order-resource",
    title: "findAll·findAllById의 empty·순서·규모와 Stream resource contract를 명시합니다",
    lead: "collection CRUD는 null을 반환하지 않는 편의 뒤에 ordering 부재, unbounded memory와 partial ID match 의미가 있습니다.",
    explanations: [
      "findAll은 모든 instances를 반환하므로 운영 대형 table의 기본 목록 API로 쓰지 않습니다. Pageable/Sort와 visibility predicate를 다음 JPA06에서 설계하며 이번 세션에서는 unbounded call을 금지하는 repository boundary를 둡니다.",
      "findAllById는 input IDs 중 존재하는 entities만 반환할 수 있고 결과 order가 input order와 같다는 보장이 없습니다. API가 요청 순서를 요구하면 ID→entity map으로 재구성하고 missing IDs 정책을 명시합니다.",
      "collection query 결과는 no match에서 null이 아니라 empty collection을 사용합니다. 단건 Optional.empty, collection []와 dependency/query failure를 서로 다른 상태로 유지합니다.",
      "Stream return은 ResultSet/EntityManager 같은 closeable resources와 transaction에 묶일 수 있어 try-with-resources와 bounded processing이 필요합니다. Stream을 controller로 그대로 반환하지 않습니다.",
    ],
    concepts: [
      c("partial ID result", "findAllById가 요청 IDs 중 존재하는 subset만 반환해 result size가 input보다 작을 수 있는 의미입니다.", ["missing IDs를 따로 계산합니다.", "order를 가정하지 않습니다."]),
      c("unbounded repository read", "page/limit 없이 aggregate 전체를 materialize하는 조회입니다.", ["memory와 transaction을 점유합니다.", "관리 작업도 batch합니다."]),
      c("resource-backed stream", "database cursor/session resources가 stream consumption과 close에 결합된 query result입니다.", ["transaction 안에서 소비합니다.", "try-with-resources를 사용합니다."]),
    ],
    codeExamples: [java("jpa03-findallbyid", "partial·unordered findAllById 결과를 요청 순서로 재구성", "Jpa03FindAllById.java", "repository가 반환한 subset/order와 client가 요구한 ordered result/missing IDs를 분리합니다.", String.raw`import java.util.*;

public class Jpa03FindAllById {
    record Entry(long id, String subject) {}
    public static void main(String[] args) {
        List<Long> requested = List.of(3L, 1L, 9L, 2L);
        List<Entry> repositoryResult = List.of(
                new Entry(1L, "one"), new Entry(2L, "two"), new Entry(3L, "three"));
        Map<Long, Entry> byId = new HashMap<>();
        repositoryResult.forEach(value -> byId.put(value.id(), value));
        List<Long> orderedFound = requested.stream().filter(byId::containsKey).toList();
        List<Long> missing = requested.stream().filter(id -> !byId.containsKey(id)).toList();
        System.out.println("repository-order=" + repositoryResult.stream().map(Entry::id).toList());
        System.out.println("requested=" + requested);
        System.out.println("ordered-found=" + orderedFound);
        System.out.println("missing=" + missing);
        System.out.println("complete=" + missing.isEmpty());
    }
}`, "repository-order=[1, 2, 3]\nrequested=[3, 1, 9, 2]\nordered-found=[3, 1, 2]\nmissing=[9]\ncomplete=false", ["spring-data-core-concepts", "spring-data-crud", "spring-data-return-types", "spring-data-repository-definition"])],
    diagnostics: [
      d("findAll 호출 뒤 heap과 response가 급증합니다.", "대형 table을 pagination/projection 없이 모두 entity로 materialize했습니다.", ["returned rows/bytes와 heap을 봅니다.", "query/page parameters를 봅니다.", "entity graph/lazy access를 확인합니다."], "bounded Page/Slice/projection 또는 batch cursor로 바꾸고 maximum page size를 enforce합니다.", "row/bytes/query/time budgets와 large-dataset tests를 둡니다."),
      d("findAllById 결과를 input index와 zip했더니 다른 entity가 연결됩니다.", "result order와 missing IDs를 보장한다고 가정했습니다.", ["requested/result IDs를 출력합니다.", "repository API contract를 봅니다.", "duplicate input IDs를 시험합니다."], "ID로 map을 만든 뒤 explicit requested order와 missing/duplicate policy로 재구성합니다.", "reordered/partial/duplicate IDs fixtures를 둡니다."),
    ],
    expertNotes: ["collection entities가 persistence context에 쌓이는 비용은 result list bytes보다 클 수 있습니다.", "query Stream이 incremental fetch인지 provider/driver 설정과 fetch size를 실제로 측정하고 close를 fault test합니다."],
  },
  {
    id: "exists-count-race-semantics",
    title: "existsById·count를 편의 조회로 사용하되 write correctness와 race guard로 오해하지 않습니다",
    lead: "존재 확인 후 쓰기는 두 SQL 사이에 다른 transaction이 개입할 수 있으므로 uniqueness와 authorization을 database/atomic write로 보장해야 합니다.",
    explanations: [
      "existsById는 현재 transaction/isolation에서 해당 ID가 보이는지 묻지만 다음 순간의 존재를 예약하지 않습니다. create-before-check, update-after-check와 delete race에서 결과가 바뀔 수 있습니다.",
      "중복 방지를 exists query에 의존하면 두 요청이 동시에 false를 보고 둘 다 insert를 시도합니다. database unique constraint를 최종 invariant로 두고 violation을 stable conflict로 번역합니다.",
      "count는 entity 수를 반환하지만 soft-delete/tenant/authorization predicate가 빠지면 public count와 다릅니다. 큰 table count 비용과 isolation snapshot 의미를 확인하고 analytics estimate와 transactional exact count를 구분합니다.",
      "exists로 entity fetch를 피하는 optimization은 authorization이나 state 검증이 필요 없는 경우에만 사용합니다. 곧 entity를 수정한다면 한 번의 scoped find/lock/version path가 query와 race를 줄일 수 있습니다.",
    ],
    concepts: [
      c("check-then-act race", "존재/조건을 읽은 뒤 별도 write를 수행하는 사이 다른 transaction이 상태를 바꾸는 경쟁입니다.", ["database constraint/atomic statement로 막습니다.", "isolation과 locks를 이해합니다."]),
      c("unique constraint", "동시 transaction에서도 중복 key/value의 commit을 database가 거부하는 schema invariant입니다.", ["application validation과 함께 씁니다.", "exception translation이 필요합니다."]),
      c("count semantics", "어떤 visibility predicate와 snapshot에서 행 수를 계산했는지 포함하는 조회 의미입니다.", ["soft delete와 tenant를 포함합니다.", "비용과 정확도를 명시합니다."]),
    ],
    codeExamples: [java("jpa03-exists-race", "동시 exists false 뒤 unique constraint가 최종 중복을 막음", "Jpa03ExistsRace.java", "두 request의 stale precheck와 atomic unique insert 결과를 순차 model로 재현합니다.", String.raw`import java.util.*;

public class Jpa03ExistsRace {
    static final class UniqueStore {
        private final Set<String> keys = new HashSet<>();
        boolean exists(String key) { return keys.contains(key); }
        boolean insert(String key) { return keys.add(key); }
        int count() { return keys.size(); }
    }
    public static void main(String[] args) {
        UniqueStore store = new UniqueStore();
        boolean requestAObserved = store.exists("same-key");
        boolean requestBObserved = store.exists("same-key");
        boolean aInserted = store.insert("same-key");
        boolean bInserted = store.insert("same-key");
        System.out.println("a-precheck=" + requestAObserved);
        System.out.println("b-precheck=" + requestBObserved);
        System.out.println("a-inserted=" + aInserted);
        System.out.println("b-inserted=" + bInserted);
        System.out.println("rows=" + store.count());
    }
}`, "a-precheck=false\nb-precheck=false\na-inserted=true\nb-inserted=false\nrows=1", ["spring-data-crud", "jakarta-persistence-spec", "spring-data-access-exception"])],
    diagnostics: [
      d("중복 검사 통과 후 duplicate rows가 생성됩니다.", "exists-then-save를 atomic invariant로 사용하고 DB unique constraint가 없습니다.", ["concurrent request timeline을 봅니다.", "catalog unique indexes를 확인합니다.", "constraint exception mapping을 봅니다."], "canonical uniqueness key에 DB constraint를 추가하고 insert violation을 idempotent replay 또는 409 conflict로 분류합니다.", "barrier-based concurrent insert test를 둡니다."),
      d("count가 사용자 화면의 row 수보다 큽니다.", "soft-delete/tenant/authorization filter 없는 repository count를 공개했습니다.", ["count SQL predicate를 봅니다.", "visibility query와 비교합니다.", "transaction snapshot/replica를 확인합니다."], "동일 visibility specification/projection으로 count하고 approximate analytics는 별도 field로 표시합니다.", "tenant/deleted/concurrent snapshot count tests를 둡니다."),
    ],
    expertNotes: ["unique violation은 정상 경쟁 결과일 수 있어 500으로만 기록하지 말고 stable conflict metric을 둡니다.", "existsById가 SELECT COUNT를 쓰는지 optimized query를 쓰는지는 current implementation/DB plan으로 확인하고 API semantics와 분리합니다."],
  },
  {
    id: "flush-saveandflush-commit",
    title: "flush·saveAndFlush와 commit을 구분하고 제약 오류를 필요한 경계에서만 앞당깁니다",
    lead: "flush는 persistence context 변경을 DB에 동기화하지만 transaction을 commit하지 않으므로 이후 rollback될 수 있습니다.",
    explanations: [
      "JpaRepository.flush는 pending changes를 database로 보내며 saveAndFlush는 save 후 즉시 flush합니다. flush 성공은 durable commit 성공이 아니고 transaction이 rollback되면 writes는 사라집니다.",
      "AUTO flush mode에서는 commit 전뿐 아니라 pending changes가 query 결과에 영향을 줄 수 있는 query 전에 flush될 수 있습니다. SQL이 service code의 save line과 정확히 같은 시점에 나간다고 가정하지 않습니다.",
      "unique, FK, not-null과 optimistic lock failures는 save가 아니라 flush/commit에서 나타날 수 있습니다. 같은 transaction 안에서 오류를 분류하거나 generated/default state를 읽어야 할 때 명시 flush를 고려하지만 모든 save를 saveAndFlush로 바꾸면 batching과 성능이 악화됩니다.",
      "HTTP handler가 transaction advice 밖에서 success body를 만들거나 async side effect를 먼저 보내면 commit failure와 모순됩니다. service transaction이 완료된 뒤 adapter가 성공을 확정하고 external side effects는 JPA05의 outbox로 다룹니다.",
    ],
    concepts: [
      c("flush", "managed state와 pending operations를 database에 동기화하는 과정입니다.", ["commit과 다릅니다.", "constraint/SQL이 실행될 수 있습니다."]),
      c("saveAndFlush", "entity를 save하고 persistence context changes를 즉시 flush하는 JpaRepository operation입니다.", ["transaction은 계속 열려 있을 수 있습니다.", "필요한 경우에만 사용합니다."]),
      c("commit", "transaction의 database changes를 성공적으로 확정하는 경계입니다.", ["flush 이후에도 실패할 수 있습니다.", "외부 success와 순서를 맞춥니다."]),
    ],
    codeExamples: [java("jpa03-flush", "pending save, flush constraint와 rollback/commit 구분", "Jpa03Flush.java", "save는 pending, flush는 constraint 검증, commit은 durable rows 확정이라는 timeline을 실행합니다.", String.raw`import java.util.*;

public class Jpa03Flush {
    static final class UnitOfWork {
        private final Set<String> committed;
        private final List<String> pending = new ArrayList<>();
        UnitOfWork(Set<String> committed) { this.committed = committed; }
        void save(String value) { pending.add(value); }
        void flush() {
            Set<String> seen = new HashSet<>(committed);
            for (String value : pending) if (!seen.add(value)) throw new IllegalStateException("duplicate");
        }
        void commit() { flush(); committed.addAll(pending); pending.clear(); }
        void rollback() { pending.clear(); }
        int pending() { return pending.size(); }
    }
    public static void main(String[] args) {
        Set<String> database = new HashSet<>(Set.of("used"));
        UnitOfWork bad = new UnitOfWork(database);
        bad.save("used");
        System.out.println("after-save=pending:" + bad.pending() + ",rows:" + database.size());
        try { bad.flush(); } catch (IllegalStateException ex) { System.out.println("flush=" + ex.getMessage()); }
        bad.rollback();
        UnitOfWork good = new UnitOfWork(database);
        good.save("new"); good.commit();
        System.out.println("after-rollback=rows:" + (database.size() - 1));
        System.out.println("after-commit=rows:" + database.size());
        System.out.println("contains-new=" + database.contains("new"));
    }
}`, "after-save=pending:1,rows:1\nflush=duplicate\nafter-rollback=rows:1\nafter-commit=rows:2\ncontains-new=true", ["spring-data-jpa-repository", "spring-data-simple-jpa", "jakarta-entity-manager", "jakarta-persistence-spec", "spring-data-transactions"])],
    diagnostics: [
      d("save test는 통과하지만 endpoint 종료 시 unique constraint가 납니다.", "flush/commit을 강제하지 않는 test가 pending state만 검사했습니다.", ["SQL/flush/commit timing을 봅니다.", "test transaction rollback behavior를 봅니다.", "database catalog constraint를 확인합니다."], "failure를 검증하는 test에서 flush하고 실제 commit 경로/새 context readback을 별도로 실행합니다.", "constraint tests에 flush-clear-reload와 non-rollback commit fixture를 둡니다."),
      d("모든 saveAndFlush 적용 후 insert throughput이 떨어집니다.", "각 row마다 강제 flush해 batching/write-behind를 깨뜨렸습니다.", ["flush count와 batch size를 봅니다.", "SQL round trips를 측정합니다.", "명시 flush의 business reason을 확인합니다."], "constraint timing/ID가 필요한 지점만 flush하고 batch loop는 chunk 단위로 flush/clear합니다.", "query/flush/round-trip budgets와 load test를 둡니다."),
    ],
    expertNotes: ["flush가 transaction isolation 밖의 다른 transaction에게 visibility를 보장하지 않습니다.", "commit failure를 controller advice에서 안전하게 mapping하되 이미 external response/side effect가 전송되지 않았는지 architecture를 확인합니다."],
  },
  {
    id: "delete-entity-lifecycle-soft-delete",
    title: "delete(entity)·deleteById와 domain soft delete의 lifecycle·absence·cascade 의미를 나눕니다",
    lead: "삭제 API 이름이 같아도 entity loading, callback, cascade, optimistic locking과 missing ID 처리 비용이 다를 수 있습니다.",
    explanations: [
      "EntityManager.remove는 managed entity를 removed state로 표시하고 flush/commit에서 row delete를 실행합니다. detached entity remove는 직접 허용되지 않으므로 repository implementation이 find/reference/merge 등 어떤 path를 쓰는지 current version에서 검증합니다.",
      "CrudRepository deleteById의 current contract는 missing entity를 silently ignore할 수 있습니다. application이 missing을 404로 구분해야 하면 scoped find와 authorization 후 delete하거나 affected/version evidence를 명시합니다.",
      "entity-by-entity delete는 @PreRemove와 cascade/orphan semantics를 수행할 수 있지만 query/loads가 늘어납니다. batch delete는 빠르지만 callbacks/cascade와 persistence context synchronization을 우회할 수 있습니다.",
      "원본 entity의 softDelete 같은 field 변경은 JPA removed state가 아니라 managed update입니다. 모든 queries, uniqueness, cache, retention, restore와 authorization에서 visibility policy를 일관되게 적용해야 하며 hard purge는 별도 workflow입니다.",
    ],
    concepts: [
      c("removed state", "managed entity가 transaction commit 때 row deletion 대상이 된 lifecycle 상태입니다.", ["flush 전 context에 존재할 수 있습니다.", "cascade/callback이 적용될 수 있습니다."]),
      c("lifecycle delete", "entity를 materialize하고 remove하여 entity callbacks와 cascade semantics가 참여하는 삭제입니다.", ["query/memory 비용이 있습니다.", "optimistic lock을 고려합니다."]),
      c("soft delete", "row를 물리 삭제하지 않고 visibility/state column을 변경하는 domain transition입니다.", ["모든 queries가 policy를 따라야 합니다.", "retention/purge를 별도 둡니다."]),
    ],
    codeExamples: [java("jpa03-delete", "entity lifecycle delete와 bulk delete의 callback/context 차이", "Jpa03Delete.java", "lifecycle delete는 callback/context 제거를 수행하고 bulk delete는 DB만 바꿔 managed snapshot이 stale해지는 model입니다.", String.raw`import java.util.*;

public class Jpa03Delete {
    static final class Store {
        final Set<Long> database = new HashSet<>(Set.of(1L, 2L));
        final Map<Long, String> context = new HashMap<>(Map.of(1L, "one", 2L, "two"));
        int callbacks;
        void lifecycleDelete(long id) { if (database.remove(id)) { context.remove(id); callbacks++; } }
        void bulkDelete(long id) { database.remove(id); }
    }
    public static void main(String[] args) {
        Store store = new Store();
        store.lifecycleDelete(1L);
        System.out.println("lifecycle-db=" + store.database.contains(1L));
        System.out.println("lifecycle-context=" + store.context.containsKey(1L));
        System.out.println("callbacks=" + store.callbacks);
        store.bulkDelete(2L);
        System.out.println("bulk-db=" + store.database.contains(2L));
        System.out.println("bulk-context-stale=" + store.context.containsKey(2L));
    }
}`, "lifecycle-db=false\nlifecycle-context=false\ncallbacks=1\nbulk-db=false\nbulk-context-stale=true", ["spring-data-crud", "spring-data-jpa-repository", "spring-data-query-methods", "jakarta-entity-manager", "jakarta-persistence-spec"])],
    diagnostics: [
      d("deleteById missing ID가 성공처럼 보이는데 API는 404를 요구합니다.", "repository의 idempotent/silent absence semantics를 application contract와 그대로 결합했습니다.", ["current CrudRepository contract를 봅니다.", "service lookup/authorization을 봅니다.", "HTTP delete idempotence 정책을 확인합니다."], "서비스에서 required existence를 scoped find로 검증하거나 delete result contract를 별도로 구현합니다.", "existing/missing/forbidden/concurrent-delete cases를 둡니다."),
      d("soft-deleted row가 custom JPQL 목록에 다시 나타납니다.", "visibility predicate를 각 query에 수동으로 넣다가 하나를 누락했습니다.", ["모든 repository queries를 inventory합니다.", "active/deleted state와 cache를 봅니다.", "restore/purge rules를 확인합니다."], "specification/base repository/filter 또는 explicit visible query convention으로 일관되게 적용하고 admin path를 분리합니다.", "모든 query 종류에 deleted visibility contract tests를 둡니다."),
    ],
    expertNotes: ["hard delete와 privacy erase는 동일하지 않을 수 있으며 backups, files, events와 legal retention을 포함합니다.", "cascade REMOVE는 aggregate ownership이 명확한 관계에만 적용하고 shared child를 삭제하지 않게 실제 FK/catalog를 검증합니다."],
  },
  {
    id: "batch-delete-context-staleness",
    title: "batch delete/update가 callbacks와 1차 cache를 우회한다는 caveat를 운영 규칙으로 만듭니다",
    lead: "single bulk JPQL은 빠르지만 이미 managed인 entities의 in-memory state와 database를 자동으로 맞추지 않습니다.",
    explanations: [
      "JpaRepository deleteAllInBatch 계열은 single query를 사용할 수 있지만 JPA first-level cache와 database를 out of sync로 남길 수 있고 cascade/lifecycle events를 보장하지 않습니다. operation 전 pending changes의 flush 여부를 결정합니다.",
      "@Modifying bulk update/delete도 managed snapshots를 개별 갱신하지 않습니다. clearAutomatically를 켜면 stale을 줄이지만 unflushed changes를 잃을 수 있어 flushAutomatically 또는 명시적 flush→bulk→clear 순서를 검토합니다.",
      "bulk operation 뒤 같은 transaction에서 managed entity를 읽거나 수정하면 stale value가 다시 쓰여 삭제/변경을 덮을 수 있습니다. 가능하면 bulk를 전용 짧은 transaction으로 격리하고 이후 새 context에서 readback합니다.",
      "callbacks/domain events/audit/outbox가 필요한 aggregate는 entity lifecycle path 또는 database-side audited bulk workflow를 선택합니다. 성능만으로 semantics를 바꾸지 않습니다.",
    ],
    concepts: [
      c("bulk DML", "entities를 개별 lifecycle operation으로 처리하지 않고 하나의 update/delete query로 여러 rows를 변경하는 방식입니다.", ["빠르지만 context/callback caveat가 있습니다.", "affected rows를 검증합니다."]),
      c("first-level cache staleness", "persistence context의 managed snapshot이 bulk 변경 후 database row와 달라진 상태입니다.", ["clear/reload가 필요할 수 있습니다.", "unflushed changes를 먼저 보호합니다."]),
      c("flush-clear ordering", "pending changes를 먼저 동기화한 뒤 bulk DML을 실행하고 context를 비워 fresh state를 보장하는 순서입니다.", ["항상 정답은 아닙니다.", "transaction/unit-of-work를 작게 유지합니다."]),
    ],
    diagnostics: [
      d("bulk delete 후 find가 삭제된 entity를 같은 transaction에서 반환합니다.", "persistence context에 기존 managed instance가 남았습니다.", ["bulk SQL과 EntityManager.contains를 봅니다.", "clearAutomatically/clear를 확인합니다.", "같은 context의 prior load를 찾습니다."], "pending changes를 flush한 뒤 bulk를 실행하고 clear/reload하거나 operation을 격리 transaction으로 옮깁니다.", "load→bulk→find와 clear/no-clear integration tests를 둡니다."),
      d("bulk update 뒤 audit callback/outbox가 생성되지 않습니다.", "bulk DML이 entity lifecycle callbacks와 per-aggregate code를 우회했습니다.", ["operation path를 봅니다.", "callback/event counts를 확인합니다.", "DB audit trigger/ledger를 봅니다."], "semantics가 필요한 변경은 lifecycle path로 수행하거나 bulk용 명시적 audit/outbox SQL을 같은 transaction에 설계합니다.", "bulk affected rows와 audit/outbox parity tests를 둡니다."),
    ],
    expertNotes: ["clear는 모든 managed entities를 detach하므로 다른 aggregate의 pending state까지 영향을 줄 수 있습니다.", "bulk delete의 memory 이득과 lost callbacks, cache invalidation, replication 부하를 함께 측정합니다."],
  },
  {
    id: "repository-transactions-exceptions",
    title: "repository transaction defaults보다 service unit-of-work와 stable exception taxonomy를 우선합니다",
    lead: "개별 CRUD method에 transaction이 붙어도 여러 repository 호출과 domain decision이 하나의 원자적 업무가 되는 것은 아닙니다.",
    explanations: [
      "Spring Data JPA inherited read operations는 기본 readOnly transaction, modifying operations는 일반 transaction configuration을 가질 수 있습니다. declared query methods는 별도 transaction configuration이 필요할 수 있으므로 current reference를 확인합니다.",
      "service가 여러 repository calls를 조합하면 outer service transaction이 실제 unit-of-work를 정의합니다. repository별 짧은 transaction 사이에 business invariant가 깨지지 않게 JPA05에서 boundary/propagation을 확장합니다.",
      "Spring은 provider/database exceptions를 DataAccessException hierarchy로 translate할 수 있지만 public API에 class/SQL/message를 노출하지 않습니다. duplicate, optimistic conflict, invalid state와 unavailable을 stable application errors로 변환합니다.",
      "catch하고 null/false를 반환하면 transaction이 rollback돼야 할 failure를 성공처럼 만들 수 있습니다. 원인을 보존해 throw하거나 명시 rollback-only를 사용하며 idempotent expected conflict만 좁게 처리합니다.",
    ],
    concepts: [
      c("transactional repository default", "base repository implementation이 CRUD method에 제공하는 readOnly 또는 read-write transaction 속성입니다.", ["service outer transaction이 우선할 수 있습니다.", "declared query는 확인이 필요합니다."]),
      c("exception translation", "provider/JDBC exceptions를 Spring data-access category로 변환해 기술 의존을 줄이는 과정입니다.", ["public error와 한 번 더 분리합니다.", "SQL/values를 노출하지 않습니다."]),
      c("unit of work", "하나의 business invariant를 만족하거나 전부 취소되어야 하는 reads/writes의 transaction 범위입니다.", ["repository method 하나와 같지 않을 수 있습니다.", "external side effects를 분리합니다."]),
    ],
    diagnostics: [
      d("첫 repository write는 commit되고 두 번째 실패만 rollback됩니다.", "서비스 transaction 없이 각 repository call이 별도 transaction으로 끝났습니다.", ["transaction begin/commit IDs를 봅니다.", "service proxy entry를 확인합니다.", "resource/manager를 대조합니다."], "business method를 public service transaction 경계로 만들고 두 operations가 같은 resource transaction에 참여하게 합니다.", "second-write failure atomicity integration test를 둡니다."),
      d("constraint exception message와 SQL이 REST body에 나타납니다.", "DataAccessException/vendor cause를 그대로 사용자 message로 직렬화했습니다.", ["exception mapper를 봅니다.", "response/log/APM fields를 scan합니다.", "stable error code taxonomy를 확인합니다."], "allowlisted application error code와 안전한 detail로 변환하고 내부 cause는 correlation 기반 protected telemetry에 둡니다.", "synthetic secret/SQL forbidden-output tests를 둡니다."),
    ],
    expertNotes: ["readOnly는 write를 반드시 차단하는 security control이 아니라 driver/provider optimization hint일 수 있습니다.", "repository interface에 transaction policy를 흩뿌리기보다 application service가 unit-of-work를 소유하게 합니다."],
  },
  {
    id: "aggregate-authorization-dto-boundary",
    title: "CRUD repository를 aggregate·authorization·DTO 경계 안에 가두고 over-posting을 막습니다",
    lead: "JpaRepository의 generic save/delete 편의가 web client에게 임의 entity graph 수정 권한을 의미하지 않습니다.",
    explanations: [
      "controller request를 entity로 직접 bind하고 save하면 ID, owner, active, audit와 secret-like fields를 client가 덮는 mass assignment가 생깁니다. command-specific request DTO allowlist와 authenticated owner를 service에서 결합합니다.",
      "repository query는 tenant/owner/visibility predicate를 포함해 unauthorized entity가 persistence context에 들어오기 전에 범위를 좁힙니다. findById 후 늦은 authorization도 필요하지만 ID-only repository를 모든 service에 공개하지 않습니다.",
      "aggregate root repository는 transaction invariant를 지키는 entry point입니다. child entity repository를 indiscriminately 노출하면 aggregate rules와 cascade/orphan semantics를 우회할 수 있습니다.",
      "entity를 REST JSON으로 직접 반환하면 lazy graph, password-like/internal state와 persistence changes가 wire contract로 샙니다. transaction 안에서 authorized projection DTO를 만들고 controller는 immutable response만 serialize합니다.",
    ],
    concepts: [
      c("aggregate repository", "aggregate root 단위로 load/save하며 내부 consistency boundary를 존중하는 persistence abstraction입니다.", ["child direct mutation을 제한합니다.", "transaction과 domain methods를 결합합니다."]),
      c("scoped lookup", "ID뿐 아니라 tenant/owner/visibility 조건을 함께 적용해 접근 가능한 entity만 조회하는 operation입니다.", ["object-level authorization을 돕습니다.", "not-found disclosure policy가 필요합니다."]),
      c("mass assignment", "외부 input을 entity fields에 광범위하게 bind하여 server-owned 속성까지 변경하게 되는 취약한 패턴입니다.", ["request DTO allowlist를 사용합니다.", "authorization과 validation을 함께 둡니다."]),
    ],
    diagnostics: [
      d("request JSON의 active/owner 필드로 다른 상태를 저장할 수 있습니다.", "web payload를 entity에 직접 binding해 repository.save했습니다.", ["request/Entity fields를 diff합니다.", "mapping과 authenticated principal 사용을 봅니다.", "unknown fields policy를 확인합니다."], "Create/Update command DTO에 writable fields만 두고 server-owned state는 domain method/context에서 결정합니다.", "hostile extra-field와 cross-tenant tests를 둡니다."),
      d("목록 serialization에서 N+1과 secret-like field 노출이 발생합니다.", "managed entity graph를 controller까지 반환했습니다.", ["response schema와 serializer access를 봅니다.", "query count/lazy loads를 확인합니다.", "sensitive field inventory를 대조합니다."], "repository projection 또는 service DTO mapping으로 필요한 fields만 transaction 안에서 materialize합니다.", "forbidden-field, query-count와 context-closed serialization tests를 둡니다."),
    ],
    expertNotes: ["JpaRepository method가 public Java API라는 사실과 외부 HTTP capability는 별개입니다.", "repository projection도 authorization/semantic mapping을 자동 해결하지 않으므로 service owner를 유지합니다."],
  },
  {
    id: "repository-testing-observability",
    title: "fake·@DataJpaTest·지원 DB·commit/concurrency tests를 층으로 나눠 repository 계약을 증명합니다",
    lead: "mock으로 save가 호출됐다는 사실은 mapping, SQL, flush, constraints, transaction과 context semantics가 맞다는 증거가 아닙니다.",
    explanations: [
      "pure fake는 service branching/Optional/error mapping을 빠르게 검증하지만 persist/merge, proxy, cascade와 SQL을 흉내 내지 못합니다. fake contract가 actual adapter와 같은 corpus를 통과하는지 확인합니다.",
      "@DataJpaTest는 repository proxy, entity mapping과 provider를 실행하되 기본 rollback 때문에 commit-time failure/after-commit behavior를 숨길 수 있습니다. 필요하면 TransactionTemplate/별도 context로 real commit과 fresh readback을 수행합니다.",
      "H2 같은 다른 database는 target MySQL의 IDENTITY, collation, constraint, lock와 SQL dialect 증거를 대체하지 않습니다. 지원 DB container/isolated schema와 migration/catalog를 사용합니다.",
      "tests에는 new/existing save, merge return, Optional zero/one, multiple custom result, partial findAllById, flush/commit constraint, lifecycle/bulk delete, optimistic conflict와 concurrent uniqueness가 포함됩니다.",
      "observability는 route가 아닌 repository operation/query fingerprint, rows, duration, flush count와 stable exception category를 낮은 cardinality로 기록합니다. raw JPQL/SQL parameters, entity toString과 user values를 default log에 넣지 않습니다.",
    ],
    concepts: [
      c("adapter contract corpus", "fake와 actual repository implementation에 동일하게 적용하는 operation/result/error scenarios 모음입니다.", ["기술-specific evidence를 추가합니다.", "behavior drift를 잡습니다."]),
      c("fresh-context readback", "flush/clear 또는 새 transaction/context에서 database를 다시 읽어 1차 cache가 아닌 persisted 결과를 확인하는 검증입니다.", ["mapping/default/trigger를 확인합니다.", "commit과 결합합니다."]),
      c("query budget", "operation당 허용한 query/rows/bytes/latency/flush 횟수의 정량 기준입니다.", ["large fixtures에서 검증합니다.", "privacy-safe fingerprints를 사용합니다."]),
    ],
    diagnostics: [
      d("repository tests는 통과하지만 운영 DB에서 save/delete가 실패합니다.", "mock/H2와 rollback-only tests만 사용해 target constraints/commit/dialect를 검증하지 않았습니다.", ["test database/provider/version을 봅니다.", "migration/catalog를 비교합니다.", "commit/fresh readback 여부를 확인합니다."], "지원 DB에 migrations를 적용한 integration test에서 flush/commit/clear/reload와 negative constraints를 실행합니다.", "DB/provider version matrix를 release gate로 둡니다."),
      d("query metrics label이 entity ID마다 늘어납니다.", "raw ID/SQL/exception message를 metric dimension으로 사용했습니다.", ["top cardinality labels를 봅니다.", "instrumentation field schema를 확인합니다.", "PII/secret classification을 대조합니다."], "repository operation/normalized query fingerprint/status category만 label로 쓰고 occurrence detail은 sampled protected trace로 이동합니다.", "telemetry schema/cardinality budget tests를 둡니다."),
    ],
    expertNotes: ["SQL statement count는 provider batching/flush mode/version에 따라 달라질 수 있어 supported matrix에서 budget과 semantic assertions를 함께 둡니다.", "test가 기대 SQL 문자열 전체에 과결합하지 않도록 result, constraints, query count와 plan risk를 목적에 맞게 선택합니다."],
  },
  {
    id: "repository-performance-release-governance",
    title: "CRUD 편의성을 capacity·schema compatibility·canary·rollback governance로 마무리합니다",
    lead: "repository 변경은 Java interface 한 줄이어도 query plan, transaction duration, cache와 database load를 바꾸므로 배포 증거가 필요합니다.",
    explanations: [
      "새 CRUD/query method는 representative data volume에서 generated SQL, index use, rows scanned/returned와 locks를 검토합니다. findAll, exists+save, per-row delete와 saveAndFlush loop를 성능 anti-pattern으로 탐지합니다.",
      "entity/schema 변화와 repository rollout은 expand-contract로 진행해 old/new binary가 같은 schema/data를 읽게 합니다. 새 code가 쓰는 값을 old code가 해석할 수 있는지 rollback compatibility를 시험합니다.",
      "canary는 operation별 success/conflict/not-found/error, p95/p99 latency, DB CPU/locks/replica lag와 query/flush counts를 봅니다. success rate만 보면 잘못된 empty/always-success 결과를 놓칩니다.",
      "destructive delete/batch operation은 actor, scope, expected affected rows, dry-run/count, approval와 backup/restore runbook을 갖습니다. repository method 이름만 믿고 production maintenance를 실행하지 않습니다.",
    ],
    concepts: [
      c("repository release evidence", "새 persistence operation이 correctness, query/lock/resource budget과 compatibility를 만족한다는 test/canary 자료입니다.", ["interface compile보다 넓습니다.", "DB readback을 포함합니다."]),
      c("affected-row guard", "bulk/destructive operation이 예상 범위를 벗어나면 중단하도록 최소/최대 rows를 검증하는 통제입니다.", ["dry run과 approval을 결합합니다.", "transaction rollback 가능성을 확인합니다."]),
      c("rollback compatibility", "새 code/schema/data 배포 뒤 이전 binary로 되돌려도 안전하게 read/write할 수 있는 성질입니다.", ["forward-written data를 포함합니다.", "expand-contract가 돕습니다."]),
    ],
    diagnostics: [
      d("새 repository method 배포 뒤 DB CPU와 lock waits가 급증합니다.", "representative plan/cardinality 없이 derived/generated query를 배포했습니다.", ["normalized query plan과 rows examined를 봅니다.", "index/catalog와 data distribution을 확인합니다.", "transaction/flush counts를 대조합니다."], "query/projection/index 또는 bounded pagination을 설계하고 canary threshold에서 자동 중단합니다.", "production-like data plan/load tests와 plan regression gate를 둡니다."),
      d("batch delete가 예상보다 많은 rows를 제거했습니다.", "scope predicate, affected-row guard와 fresh backup/restore 검증이 없었습니다.", ["executed query/config/version을 보존합니다.", "affected rows/audit를 확인합니다.", "backup/PITR 복구점을 검증합니다."], "write를 중지·격리하고 verified restore/forward repair를 수행한 뒤 scoped dry-run/approval workflow로 교체합니다.", "destructive-operation rehearsal와 maximum affected-row policy를 둡니다."),
    ],
    expertNotes: ["Repository 편의 API는 운영 maintenance console의 안전장치를 제공하지 않습니다.", "query plan은 data distribution과 DB version에 따라 바뀌므로 canary/continuous observation이 필요합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-repository", repository: "local learning source", path: "2026-spring-jpa-test\\src\\main\\java\\com\\study\\jpatest\\guestbook\\repository\\GuestBookRepository.java", usedFor: ["JpaRepository<entity, Long> inheritance", "derived active query", "JPQL positional/named parameters", "nullable custom single-result returns", "inventory gap"], evidence: "2026-07-14 read-only audit: 30 lines, 1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900. 실제 row, credential과 local absolute path는 공개 내용에 복사하지 않았습니다." },
  { id: "spring-data-core-concepts", repository: "Spring Data JPA Reference", path: "repositories/core-concepts.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/core-concepts.html", usedFor: ["Repository abstraction", "CrudRepository hierarchy", "aggregate persistence boundary"], evidence: "current official reference에서 Spring Data repository의 core abstraction과 interface hierarchy를 확인했습니다." },
  { id: "spring-data-repository-definition", repository: "Spring Data JPA Reference", path: "repositories/definition.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/definition.html", usedFor: ["repository interface definition", "selective CRUD exposure", "base repository routing"], evidence: "repository interfaces와 matching CRUD method가 store base implementation으로 route되는 계약을 확인했습니다." },
  { id: "spring-data-crud", repository: "Spring Data Commons API", path: "org/springframework/data/repository/CrudRepository.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/CrudRepository.html", usedFor: ["save/findById/findAllById/exists/count/delete contracts", "Optional", "missing delete"], evidence: "current CrudRepository API의 generic CRUD return/absence/argument/optimistic-lock contracts를 확인했습니다." },
  { id: "spring-data-jpa-repository", repository: "Spring Data JPA API", path: "org/springframework/data/jpa/repository/JpaRepository.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/api/java/org/springframework/data/jpa/repository/JpaRepository.html", usedFor: ["flush/saveAndFlush", "getReferenceById", "batch delete caveats"], evidence: "current JpaRepository JPA-specific operations와 first-level cache/callback caveats를 확인했습니다." },
  { id: "spring-data-simple-jpa", repository: "Spring Data JPA API", path: "org/springframework/data/jpa/repository/support/SimpleJpaRepository.html", publicUrl: "https://docs.spring.io/spring-data/data-jpa/docs/current/api/org/springframework/data/jpa/repository/support/SimpleJpaRepository.html", usedFor: ["base implementation", "transaction defaults", "save/delete implementation boundary"], evidence: "current SimpleJpaRepository가 CRUD base implementation과 transactional behavior를 제공하는 공식 API를 확인했습니다." },
  { id: "spring-data-entity-persistence", repository: "Spring Data JPA Reference", path: "jpa/entity-persistence.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html", usedFor: ["save persist/merge selection", "new-state detection", "Persistable"], evidence: "save가 new state에 따라 EntityManager.persist 또는 merge를 호출하는 current official contract를 확인했습니다." },
  { id: "spring-data-transactions", repository: "Spring Data JPA Reference", path: "jpa/transactions.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html", usedFor: ["CRUD transaction defaults", "service facade boundary", "readOnly", "declared query transaction"], evidence: "repository method defaults와 service facade unit-of-work guidance를 확인했습니다." },
  { id: "spring-data-null-handling", repository: "Spring Data JPA Reference", path: "repositories/null-handling.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/null-handling.html", usedFor: ["Optional absence", "nullable single result", "empty collections", "nullability annotations"], evidence: "single-result Optional/null과 collection non-null behavior를 current official reference에서 확인했습니다." },
  { id: "spring-data-return-types", repository: "Spring Data JPA Reference", path: "repositories/query-return-types-reference.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/query-return-types-reference.html", usedFor: ["T/Optional/List/Stream semantics", "multiple results", "stream resources"], evidence: "repository query return types와 Stream resource/transaction caveat를 확인했습니다." },
  { id: "spring-data-query-methods", repository: "Spring Data JPA Reference", path: "jpa/query-methods.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html", usedFor: ["derived/declared queries", "@Modifying", "bulk DML stale context", "derived delete callbacks"], evidence: "query creation, modifying query clear behavior와 derived/bulk delete lifecycle 차이를 확인했습니다." },
  { id: "jakarta-entity-manager", repository: "Jakarta Persistence API", path: "jakarta/persistence/EntityManager", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/entitymanager", usedFor: ["persist/merge/find/reference/remove", "flush/clear/detach", "managed identity"], evidence: "Jakarta Persistence 3.2 EntityManager lifecycle와 synchronization contracts를 확인했습니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "specifications/persistence/3.2/jakarta-persistence-spec-3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["persistence context", "entity lifecycle", "flush/commit", "locking/concurrency"], evidence: "Jakarta Persistence 3.2 normative entity operation, lifecycle와 transaction synchronization semantics를 확인했습니다." },
  { id: "jdk-optional", repository: "Oracle Java SE 21 API", path: "java.base/java/util/Optional.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["Optional empty/present", "map/orElseThrow", "value-based class"], evidence: "JDK 21 Optional value/absence와 safe terminal operations를 확인했습니다." },
  { id: "spring-data-access-exception", repository: "Spring Framework API", path: "org/springframework/dao/DataAccessException.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/dao/DataAccessException.html", usedFor: ["data access exception translation", "stable category boundary"], evidence: "Spring의 root data-access exception abstraction과 unchecked translation boundary를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-03-repository-crud", slug: "jpa-03-repository-crud", courseId: "spring", moduleId: "spring-data-jpa", order: 3,
  title: "JpaRepository가 제공하는 CRUD와 Optional",
  subtitle: "상속 CRUD의 persist·merge·absence·flush·delete 의미를 source gap부터 DB/transaction evidence까지 검증합니다",
  level: "중급", estimatedMinutes: 85,
  coreQuestion: "짧은 JpaRepository interface가 제공하는 save/find/delete 편의를 entity state, Optional absence, flush/commit, lifecycle, concurrency와 service 보안 경계까지 어떻게 정확히 예측하고 검증할까요?",
  summary: "2026-spring-jpa-test의 GuestBookRepository 한 파일을 read-only로 감사합니다. 원본은 JpaRepository<GuestBook, Long>를 상속하고 active derived query, active=0 JPQL과 positional/named ID query를 선언하지만 save/findById/Optional 호출은 직접 보여 주지 않고 custom 단건은 entity를 반환합니다. 이 source evidence와 inventory gap을 분리한 뒤 repository hierarchy/proxy, save new detection과 persist/merge 반환값, findById Optional/null/reference, collection/partial order/stream, exists-count race, flush/saveAndFlush/commit, lifecycle delete/soft delete, batch DML stale context, repository/service transaction과 exception translation, aggregate/authorization/DTO, actual DB tests·telemetry·release governance까지 확장합니다. 여섯 JDK 21 examples는 save semantics, Optional, partial findAllById, uniqueness race, flush constraint와 lifecycle/bulk delete를 exact stdout으로 실행합니다.",
  objectives: ["원본 declared queries와 inherited CRUD/Optional inventory gap을 구분한다.", "Repository hierarchy, proxy와 domain/ID generic metadata를 설명한다.", "save의 new detection, persist/merge 선택과 반환 인스턴스를 올바르게 사용한다.", "findById Optional, nullable custom query와 getReferenceById를 구분한다.", "collection empty/partial/order/resource와 unbounded read 위험을 통제한다.", "exists/count의 race 한계를 DB constraints와 transaction으로 보완한다.", "flush/saveAndFlush/commit과 lifecycle/batch/soft-delete semantics를 검증한다.", "service/aggregate/security/test/observability/canary 경계로 repository를 운영한다."],
  prerequisites: [{ title: "@Entity·@Id·@GeneratedValue와 컬럼 매핑", reason: "Repository CRUD의 persist/merge/identity/delete 의미는 entity ID, lifecycle와 column constraints를 알아야 정확히 예측할 수 있습니다.", sessionSlug: "jpa-02-entity-id-column" }],
  keywords: ["JpaRepository", "CrudRepository", "SimpleJpaRepository", "save", "persist", "merge", "findById", "Optional", "getReferenceById", "findAllById", "existsById", "flush", "saveAndFlush", "deleteById", "batch delete", "soft delete", "DataAccessException", "repository proxy"],
  topics,
  lab: {
    title: "원본 GuestBookRepository를 CRUD·absence·flush·delete 계약으로 qualification하기",
    scenario: "원본을 변경하지 않고 synthetic entity와 disposable supported DB에서 inherited/custom methods, transaction/constraint timing과 security boundary를 증명합니다.",
    setup: ["JDK 21", "원본과 호환되는 Boot/Spring Data JPA/provider", "migration이 적용된 disposable supported DB", "synthetic non-PII rows", "barrier-based concurrent test", "원본 repository read-only", "실제 credential/row 접근 금지"],
    steps: ["원본 hash, extends와 declared query methods를 기록하고 CRUD/Optional direct call이 없다는 gap을 표시합니다.", "repository proxy metadata와 entity/Long ID type, scan/bootstrap을 검증합니다.", "new/null-ID, assigned-ID, managed/detached save paths와 returned-instance identity를 확인합니다.", "findById zero/one, custom entity-return zero/one/multiple와 getReference missing timing을 실행합니다.", "findAllById reordered/partial/duplicate IDs와 empty collection/Stream close를 검증합니다.", "두 transaction이 같은 uniqueness key를 precheck 후 insert하도록 barrier를 걸어 DB constraint를 확인합니다.", "save→flush/commit constraint와 rollback, saveAndFlush 필요/불필요 시나리오를 분리합니다.", "entity/deleteById/soft-delete와 lifecycle callbacks/cascade/missing policy를 검증합니다.", "load→bulk delete/update→stale context와 flush/clear/readback을 실행합니다.", "request DTO allowlist, owner/tenant scoped lookup, response projection과 forbidden fields를 검증합니다.", "fake/@DataJpaTest/real commit/supported DB corpus를 실행하고 query/flush/rows budgets를 측정합니다.", "canary, N/N-1 schema/data rollback과 destructive-operation runbook을 승인합니다."],
    expectedResult: ["원본 evidence와 공식 보강 내용이 sourceRefs/coverage에서 구분됩니다.", "save/merge/Optional/flush/delete 결과가 actual provider/DB와 documented contract에 맞습니다.", "constraint/concurrency failure가 rollback되고 stable application error로 번역됩니다.", "batch/soft delete 뒤 context, callbacks와 visibility가 명시된 policy를 따릅니다.", "entity/secret/internal state가 web response/log에 없고 repository query budgets가 통과합니다.", "rollback/restore와 destructive operation safeguards가 rehearsal됩니다."],
    cleanup: ["disposable schema, rows, accounts, processes와 generated reports를 제거합니다.", "temporary SQL/bind/transaction logging을 원복하고 sanitized metrics만 보존합니다.", "synthetic secret canary와 test artifacts를 폐기합니다.", "원본 repository hash/status unchanged를 readback합니다."],
    extensions: ["Persistable assigned-ID strategy와 domain event behavior를 actual provider에서 비교합니다.", "optimistic @Version과 delete/update conflict를 JPA09 corpus로 확장합니다.", "custom base repository로 unsafe findAll/batch operations를 선택적으로 숨깁니다.", "Pageable/Sort와 derived query를 다음 JPA06 세션으로 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행하고 actual repository test의 대응 SQL/context evidence를 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "persist/merge와 반환 identity를 설명합니다.", "Optional 200/404를 재현합니다.", "findAllById partial/order를 검증합니다.", "exists race에서 constraint 하나만 성공하게 합니다.", "flush와 commit을 구분합니다.", "lifecycle/bulk delete context 차이를 확인합니다."], hints: ["model output을 provider 보장으로 쓰지 말고 flush-clear-reload와 SQL evidence를 추가하세요."], expectedOutcome: "각 CRUD operation의 Java signature부터 DB/transaction observable 결과까지 설명합니다.", solutionOutline: ["source→proxy→save→find→race→flush→delete 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Repository와 service/controller callers를 production-safe CRUD boundary로 이관하세요.", requirements: ["custom nullable 단건을 Optional/scoped lookup으로 migration합니다.", "create/update와 save semantics를 분리합니다.", "request/response DTO allowlist를 둡니다.", "flush/constraint/error taxonomy를 둡니다.", "soft/lifecycle/bulk delete policy를 정의합니다.", "unique/optimistic concurrency를 DB로 보장합니다.", "target DB commit/readback tests를 실행합니다.", "query/canary/rollback/destructive runbook을 포함합니다."], hints: ["모든 method를 JpaRepository에서 그대로 노출하지 말고 application에 필요한 capability부터 고르세요."], expectedOutcome: "보안·동시성·실패·성능이 service contract 안에서 통제되는 repository가 완성됩니다.", solutionOutline: ["audit→narrow→type→transact→constrain→verify→rollout 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring Data JPA repository governance를 작성하세요.", requirements: ["base interfaces와 allowed CRUD를 정의합니다.", "save/new-state/assigned-ID rules를 둡니다.", "Optional/null/collection/reference contracts를 둡니다.", "flush/commit/error translation rules를 둡니다.", "lifecycle/soft/bulk delete와 affected-row safeguards를 둡니다.", "aggregate/authorization/DTO rules를 둡니다.", "fake/provider/target DB/concurrency tests와 query budgets를 둡니다.", "schema compatibility/canary/rollback/restore를 포함합니다."], hints: ["repository naming style가 아니라 capability 생성부터 폐기까지 lifecycle 표준을 만드세요."], expectedOutcome: "Repository 편의가 데이터 무결성과 운영 복구를 해치지 않는 조직 표준이 완성됩니다.", solutionOutline: ["define→constrain→execute→observe→evolve→recover 순서입니다."] },
  ],
  nextSessions: ["jpa-04-persistence-context-dirty-check"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["원본 GuestBookRepository.java는 read-only로 30 lines/1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900을 확인했습니다.", "원본은 JpaRepository 상속과 custom derived/JPQL queries를 보여 주지만 save/findById/Optional/flush/delete 호출 결과는 직접 보여 주지 않으므로 inventory gap으로 분리했습니다.", "custom 단건 methods가 entity를 직접 반환한다는 nullable/multiple-result 위험을 보존하고 Optional 예제는 current Spring Data 공식 계약 기반 보강으로 명시했습니다.", "실제 source의 persisted values, database credentials와 local absolute path는 공개 내용에 복사하지 않았습니다.", "persist/merge selection, flush/commit timing, callbacks/cascade, batch stale context, constraints/locking/query plans는 actual provider와 supported database에서 검증해야 합니다."] },
});

export default session;
