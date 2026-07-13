import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-15", explanation: "JDK 21 enums·records·Clock와 작은 classes로 entity lifecycle, ID strategy, column validation, time policy와 identity equality를 모델링합니다." },
      { lines: "16-끝에서 6줄 전", explanation: "DB/JPA provider 없이도 persistent identity와 field constraints의 불변식을 결정적으로 계산합니다." },
      { lines: "마지막 6줄", explanation: "state·strategy·validation·timestamp·equality를 exact stdout으로 출력해 설명과 실행 결과를 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "JPA/Hibernate/Lombok/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "교육용 model은 provider proxy, database identity allocation, Bean Validation과 actual column DDL을 대체하지 않습니다."] },
    experiments: [
      { change: "entity state, ID strategy, null/length, Clock zone 또는 assigned id를 바꿉니다.", prediction: "허용 transition, generation 특성, error set, timestamp와 equality가 달라집니다.", result: "model stdout과 disposable persistence context/catalog/SQL의 실제 evidence를 비교합니다." },
      { change: "동일 mapping을 MySQL target와 schema validation/migration test에서 실행합니다.", prediction: "provider/vendor naming, DDL types, ID allocation timing와 constraints가 구체화됩니다.", result: "mapping metadata, generated/approved DDL, insert/readback, negative constraints와 query batching을 함께 기록합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-entity-audit",
    title: "원본 GuestBook entity를 mapping·domain·security·lifecycle 가정으로 분해합니다",
    lead: "annotation이 많다고 mapping이 완성되는 것은 아니므로 각 field가 어떤 database invariant, API boundary와 lifecycle owner를 가지는지 원본에서 하나씩 확인합니다.",
    explanations: [
      "원본은 @Entity/@Table, Long @Id와 IDENTITY, 여러 @Column, LocalDateTime @PrePersist, active flag, file name과 softDelete method를 한 class에 둡니다. 이 구조를 학습 progression으로 사용하지만 실제 table/column/domain 값은 예제로 복사하지 않습니다.",
      "unused import와 Lombok @Data/@Builder/@AllArgsConstructor/@NoArgsConstructor는 compile convenience와 entity semantics가 섞여 있음을 보여 줍니다. provider requirements, proxy/equality, mutation methods와 API DTO 역할을 별도로 검토합니다.",
      "writer/subject/content/email/password/file metadata에 length, nullable, validation, encoding와 exposure 정책이 mapping만으로 명확하지 않습니다. Java nullability, Bean Validation, database constraint와 HTTP validation을 서로 다른 enforcement layers로 정의합니다.",
      "columnDefinition=TEXT는 vendor DDL에 강하게 결합하고 schema migration tool이 실제 column을 소유한다면 annotation DDL hint와 catalog truth가 drift할 수 있습니다. portability와 target optimization을 conscious choice로 남깁니다.",
      "원본 entity는 실제 DB를 실행하지 않고 read-only로 감사했습니다. hash/line count는 source provenance이며 runtime mapping, DDL and persisted data outcome은 disposable DB에서 검증합니다.",
    ],
    concepts: [
      c("entity mapping contract", "Java entity type/attributes와 table/columns/identity/constraints/lifecycle 사이의 versioned 대응 규칙입니다.", ["annotation만이 아니라 migration/catalog를 포함합니다.", "API DTO와 분리합니다."]),
      c("domain invariant", "entity가 생성·변경·삭제되는 모든 경로에서 반드시 유지해야 하는 business/data 조건입니다.", ["DB constraint와 code validation을 조합합니다.", "상태 전이 methods로 표현합니다."]),
      c("mapping provenance", "어떤 source mapping과 migration/catalog snapshot을 기준으로 설명·검증했는지 추적하는 근거입니다.", ["runtime truth와 대조합니다.", "실제 data 복사를 뜻하지 않습니다."]),
    ],
    diagnostics: [
      d("application startup은 되지만 insert에서 DataTooLong/NULL constraint 오류가 납니다.", "entity annotation의 length/nullable/validation과 actual schema가 일치하지 않습니다.", ["catalog column type/nullability/length를 봅니다.", "mapping metadata와 migration ledger를 비교합니다.", "boundary/negative insert test를 실행합니다."], "schema contract를 migration과 typed validation에 명시하고 entity/API constraints를 정렬합니다.", "catalog conformance와 boundary fixtures를 CI/deploy gate에 둡니다."),
      d("entity를 그대로 JSON으로 반환해 password/file/internal fields가 노출됩니다.", "persistence entity와 public response DTO 경계를 분리하지 않았습니다.", ["serialized field set과 getters/Lombok를 봅니다.", "controller return types와 Jackson configuration을 확인합니다.", "logs/caches/client artifacts 노출 범위를 검사합니다."], "explicit response DTO/mapper allowlist를 만들고 sensitive fields를 entity 밖 secret abstraction으로 제한합니다.", "contract tests가 public JSON forbidden fields를 negative assertion합니다."),
    ],
    expertNotes: ["원본 field 이름이 민감해 보인다는 사실만으로 storage algorithm을 추측하지 않고 실제 service/migration을 별도 감사합니다.", "entity class가 compile된다고 schema/data/API/security contract가 맞다는 뜻이 아닙니다."],
  },
  {
    id: "entity-class-requirements-proxy",
    title: "@Entity class 요구사항과 provider proxy/enhancement 경계를 이해합니다",
    lead: "entity는 persistence provider가 생성·추적할 수 있는 class여야 하며 no-arg constructor, non-final type/state access와 proxy/enhancement behavior를 일반 DTO 규칙과 구분합니다.",
    explanations: [
      "Jakarta Persistence 3.2 entity는 top-level 또는 static inner class, non-final, public/protected no-arg constructor를 요구합니다. enum, record, interface는 entity가 될 수 없습니다.",
      "provider는 field/property access와 bytecode enhancement 또는 proxy를 사용할 수 있습니다. final class/method와 private-only constructor는 lazy loading/proxy capability를 제한할 수 있어 specification/provider docs를 함께 봅니다.",
      "public all-args constructor와 setters를 자동 생성하면 invalid state entity를 어디서나 만들 수 있습니다. protected no-arg는 provider용, domain factory/constructor는 required invariants를 만족하는 API로 분리합니다.",
      "entity에는 framework annotation만 모으지 말고 behavior-rich aggregate 또는 persistence model 중 선택을 명시합니다. 어느 경우든 controller request binding 대상으로 직접 쓰지 않습니다.",
      "serialization/cloning across JVM boundaries에서 detached entity와 lazy proxies가 문제를 만들 수 있습니다. DTO snapshot과 explicit fetch boundary를 사용합니다.",
    ],
    concepts: [
      c("entity class", "persistence provider가 identity와 state를 관리하고 primary table에 mapping하는 Java class입니다.", ["specification requirements를 충족합니다.", "public API DTO가 아닙니다."]),
      c("proxy", "lazy loading 또는 interception을 위해 provider가 entity/association을 대리하는 runtime object입니다.", ["concrete class assumptions을 피합니다.", "equals/type checks에 영향 줍니다."]),
      c("provider constructor", "persistence provider가 reflection/instantiation에 사용하는 public 또는 protected no-arg constructor입니다.", ["domain creation API와 분리할 수 있습니다.", "invalid public mutation을 줄입니다."]),
    ],
    diagnostics: [
      d("entity proxy 생성 또는 lazy association 접근에서 final/no-constructor 오류가 납니다.", "entity class/constructor/method가 specification/provider proxy requirements와 맞지 않습니다.", ["class modifiers와 no-arg visibility를 봅니다.", "actual runtime class/proxy strategy를 확인합니다.", "enhancement configuration을 검사합니다."], "non-final entity와 protected no-arg constructor를 사용하고 provider-supported enhancement/proxy config를 정렬합니다.", "mapping bootstrap과 lazy proxy behavior를 integration test합니다."),
      d("request body가 entity setters로 invalid state를 만듭니다.", "entity를 web binding DTO로 재사용하고 Lombok/public setters가 모든 persistent fields를 열었습니다.", ["controller parameter types와 binder allowlist를 봅니다.", "entity setters/constructors를 inventory합니다.", "forbidden field over-posting을 test합니다."], "request DTO validation→service factory/mutation methods→entity mapping 흐름으로 분리합니다.", "mass-assignment negative tests와 entity mutation architecture rules를 둡니다."),
    ],
    expertNotes: ["provider-specific enhancement를 사용해도 specification entity requirements와 public API boundary는 사라지지 않습니다.", "entity를 immutable하게 만들려면 provider/version support와 ID assignment/lazy associations를 실제 test해야 합니다."],
  },
  {
    id: "entity-table-naming-access",
    title: "entity name·table/column name과 field/property access를 query·DDL API로 versioning합니다",
    lead: "Java class name, JPQL entity name, physical table identifier와 JSON name은 서로 다른 namespaces이므로 naming strategy와 explicit mappings를 혼동하지 않습니다.",
    explanations: [
      "@Entity name은 JPQL에서 사용하는 entity name이고 @Table name은 primary table identifier입니다. class rename, entity rename, table rename은 각각 query/API/migration impact가 다릅니다.",
      "예약어, case folding, quoting, catalog/schema defaults와 naming strategy가 environments에서 달라질 수 있습니다. generated SQL과 target catalog의 canonical identifiers를 확인합니다.",
      "@Id와 mapping annotations가 fields에 있으면 field access, getters에 있으면 property access가 기본으로 결정됩니다. hierarchy 전체에서 placement를 일관되게 하고 @Access override는 이유를 문서화합니다.",
      "field access에서는 getter business logic을 거치지 않고 provider가 fields를 읽고 쓸 수 있습니다. property access에서는 getter/setter side effects가 persistence lifecycle에 영향을 줄 수 있어 순수성을 유지합니다.",
      "physical naming strategy를 바꾸는 것은 schema API change입니다. migration과 catalog diff 없이 config만 바꾸지 않습니다.",
    ],
    concepts: [
      c("entity name", "JPQL과 persistence metadata에서 entity를 식별하는 logical name입니다.", ["기본은 unqualified class name입니다.", "table name과 다릅니다."]),
      c("physical table identifier", "database catalog에서 table을 식별하는 schema/catalog/name/quoting 조합입니다.", ["migration tool이 소유합니다.", "vendor case rules를 확인합니다."]),
      c("access type", "provider가 persistent state를 field 직접 또는 property accessor로 읽고 쓰는 방식입니다.", ["@Id placement가 기본을 결정합니다.", "hierarchy에서 일관되게 합니다."]),
    ],
    diagnostics: [
      d("JPQL은 entity를 못 찾지만 table은 존재합니다.", "JPQL entity name과 physical table name을 같은 것으로 사용했습니다.", ["@Entity name/class와 query root를 봅니다.", "EntityManagerFactory managed types를 확인합니다.", "@Table/catalog는 별도로 검사합니다."], "JPQL에는 logical entity name을 사용하고 table changes는 migration/mapping으로 분리합니다.", "compile/startup query validation과 repository contract tests를 둡니다."),
      d("naming strategy 변경 뒤 새 empty tables가 생성되거나 validate가 실패합니다.", "config-only naming change가 existing physical identifiers와 drift했습니다.", ["old/new generated identifiers와 catalog를 diff합니다.", "ddl-auto effective action을 확인합니다.", "migration ledger를 봅니다."], "명시 migration과 compatibility mapping으로 identifiers를 전환하고 auto create/update를 차단합니다.", "naming strategy를 versioned architecture setting으로 보호합니다."),
    ],
    expertNotes: ["globally quoted identifiers는 reserved words를 해결할 수 있지만 모든 generated SQL/case/DDL behavior를 바꾸므로 migration 없이 켜지 않습니다.", "property access getter에서 DB/network/clock side effects를 수행하지 않습니다."],
  },
  {
    id: "entity-lifecycle-identity",
    title: "new·managed·detached·removed lifecycle와 persistent identity를 객체 참조와 구분합니다",
    lead: "같은 database row는 persistence context 안에서 하나의 managed identity로 유지되지만 context 밖 detached/new objects의 Java equality와 synchronization은 별도 설계가 필요합니다.",
    explanations: [
      "new entity는 persistent identity가 없고 context에 속하지 않습니다. persist 후 managed가 되며 changes는 flush에서 DB와 동기화될 수 있습니다.",
      "clear/close/detach 뒤 entity는 detached이고 수정해도 자동 dirty checking되지 않습니다. merge는 passed object를 managed로 바꾸는 것이 아니라 state를 managed instance에 복사해 반환할 수 있으므로 반환값을 사용합니다.",
      "remove된 managed entity는 commit/flush에서 row deletion 대상입니다. soft delete method는 JPA removed state가 아니라 domain column state change이므로 repository queries/constraints/cache에서 explicit policy가 필요합니다.",
      "persistence context는 identity map을 제공하지만 여러 transactions/nodes에서는 같은 row를 서로 다른 Java objects로 가집니다. @Version/locks와 database constraints로 concurrency를 다룹니다.",
      "ID가 null인지 여부만으로 entity lifecycle을 완벽히 판단하지 않습니다. assigned identifiers, detached, unsaved-value와 provider strategy를 repository contract로 검증합니다.",
    ],
    concepts: [
      c("persistent identity", "entity가 database row와 persistence context 안에서 동일성을 갖게 하는 primary key 값/metadata입니다.", ["business key와 다를 수 있습니다.", "context identity map에 사용됩니다."]),
      c("managed entity", "현재 persistence context가 state changes와 lifecycle을 추적하는 entity instance입니다.", ["dirty checking 대상입니다.", "context/transaction boundary가 중요합니다."]),
      c("detached entity", "persistent identity는 있지만 현재 persistence context에서 관리되지 않는 entity instance입니다.", ["수정이 자동 반영되지 않습니다.", "DTO처럼 사용하지 않습니다."]),
    ],
    codeExamples: [java("jpa02-lifecycle", "entity lifecycle transition을 state machine으로 검증", "Jpa02Lifecycle.java", "허용 transition new→managed→detached→managed→removed를 실행하고 invalid removed→managed를 거부합니다.", String.raw`public class Jpa02Lifecycle {
  enum State { NEW, MANAGED, DETACHED, REMOVED }
  static State transition(State state, String operation) {
    return switch (operation) {
      case "persist" -> state == State.NEW ? State.MANAGED : fail(state, operation);
      case "detach" -> state == State.MANAGED ? State.DETACHED : fail(state, operation);
      case "merge" -> state == State.DETACHED ? State.MANAGED : fail(state, operation);
      case "remove" -> state == State.MANAGED ? State.REMOVED : fail(state, operation);
      default -> fail(state, operation);
    };
  }
  static State fail(State state, String operation) {
    throw new IllegalStateException(state + "-" + operation);
  }
  public static void main(String[] args) {
    State state = State.NEW;
    for (var operation : new String[]{"persist", "detach", "merge", "remove"}) {
      state = transition(state, operation);
      System.out.println(operation + "=" + state);
    }
    try { transition(state, "merge"); } catch (IllegalStateException e) { System.out.println("invalid=" + e.getMessage()); }
  }
}`, "persist=MANAGED\ndetach=DETACHED\nmerge=MANAGED\nremove=REMOVED\ninvalid=REMOVED-merge", ["local-guestbook-entity", "jakarta-persistence-spec", "jakarta-entity", "jakarta-table", "jakarta-access", "entitymanager-javadoc", "hibernate-user-guide"] )],
    diagnostics: [
      d("detached entity field를 바꿨는데 UPDATE가 실행되지 않습니다.", "persistence context 밖 object를 managed라고 가정했습니다.", ["transaction/context와 entity state를 확인합니다.", "SQL/flush timing을 봅니다.", "merge 반환 instance 사용 여부를 검사합니다."], "service transaction에서 managed entity를 조회해 explicit domain method로 변경하거나 merge semantics를 정확히 사용합니다.", "detached/managed integration tests와 explicit flush/readback을 둡니다."),
      d("soft-delete된 row가 일반 조회에 계속 나타납니다.", "active flag 변경만 구현하고 모든 query/unique/FK/cache에 deletion visibility policy를 적용하지 않았습니다.", ["repository query predicates를 inventory합니다.", "cache/index/unique constraints를 봅니다.", "restore/retention behavior를 확인합니다."], "explicit status model과 query specifications/repository API, constraints/retention을 일관되게 적용합니다.", "모든 read/write paths의 deleted visibility matrix를 test합니다."),
    ],
    expertNotes: ["merge를 HTTP DTO patch 수단으로 쓰면 over-posting과 stale overwrite를 만들 수 있어 current managed entity에 allowlisted changes를 적용합니다.", "soft delete는 data retention/privacy/legal requirements와 unique key reuse를 함께 설계합니다."],
  },
  {
    id: "id-generation-strategies",
    title: "IDENTITY·SEQUENCE·TABLE·UUID·AUTO의 allocation timing·batching·portability를 비교합니다",
    lead: "@GeneratedValue strategy는 primary key가 언제 어디서 할당되는지, insert batching과 database portability, index/storage characteristics를 바꿉니다.",
    explanations: [
      "IDENTITY는 database identity/auto-increment column이 insert에서 ID를 생성합니다. provider가 generated key를 얻기 위해 insert timing을 앞당길 수 있고 batch insert 최적화가 제한될 수 있습니다.",
      "SEQUENCE는 database sequence에서 ID blocks를 미리 할당할 수 있어 batching과 allocationSize 최적화가 가능하지만 target DB 지원과 sequence migration/config를 확인합니다.",
      "TABLE generator는 별도 table/row coordination으로 portable할 수 있지만 contention과 extra statements가 발생할 수 있습니다. AUTO의 실제 선택은 provider/type/database에 의존합니다.",
      "UUID는 distributed preallocation과 enumeration resistance 일부를 제공하지만 larger random index, storage/order와 public identifier/security를 별도 설계합니다. ID format은 authorization을 대체하지 않습니다.",
      "primary key는 stable/minimal/immutable해야 하며 gaps를 business sequence 결함으로 취급하지 않습니다. rollback/concurrent allocation에서 gaps는 자연스러울 수 있습니다.",
    ],
    concepts: [
      c("IDENTITY", "database identity/auto-increment column이 insert 때 primary key를 생성하는 JPA strategy입니다.", ["ID availability가 insert에 연결됩니다.", "batching trade-off가 있습니다."]),
      c("SEQUENCE", "database sequence에서 identifiers를 얻는 JPA strategy입니다.", ["allocation blocks를 사용할 수 있습니다.", "sequence-supporting DB가 필요합니다."]),
      c("UUID", "provider/application이 UUID primary key를 생성하는 JPA 3.1+ strategy입니다.", ["distributed generation을 돕습니다.", "index/order/storage를 검토합니다."]),
    ],
    codeExamples: [java("jpa02-id-strategies", "ID generation 특성을 decision table로 출력", "Jpa02Ids.java", "다섯 strategy의 pre-insert allocation, database object와 batching 특성을 정렬해 비교합니다.", String.raw`import java.util.*;

public class Jpa02Ids {
  record Strategy(String name, boolean beforeInsert, String databaseObject, boolean batchFriendly) {}
  public static void main(String[] args) {
    var strategies = List.of(
        new Strategy("IDENTITY", false, "identity-column", false),
        new Strategy("SEQUENCE", true, "sequence", true),
        new Strategy("TABLE", true, "generator-table", false),
        new Strategy("UUID", true, "none", true),
        new Strategy("AUTO", false, "provider-choice", false));
    strategies.stream().sorted(Comparator.comparing(Strategy::name)).forEach(s ->
        System.out.println(s.name() + "=before:" + s.beforeInsert() + ",object:" + s.databaseObject() + ",batch:" + s.batchFriendly()));
  }
}`, "AUTO=before:false,object:provider-choice,batch:false\nIDENTITY=before:false,object:identity-column,batch:false\nSEQUENCE=before:true,object:sequence,batch:true\nTABLE=before:true,object:generator-table,batch:false\nUUID=before:true,object:none,batch:true", ["jakarta-id", "jakarta-generated-value", "jakarta-generation-type", "hibernate-user-guide", "mysql-auto-increment"] )],
    diagnostics: [
      d("bulk persist가 기대와 달리 row별 insert로 실행됩니다.", "IDENTITY generation과 immediate generated-key retrieval이 batching을 제한했습니다.", ["actual SQL/batch metrics와 ID timing을 봅니다.", "provider strategy/config와 dialect를 확인합니다.", "transaction flush pattern을 검사합니다."], "target DB에 적합한 sequence/pooled generator 또는 approved bulk path를 검토하고 ID semantics를 migration합니다.", "representative volume에서 statement count/throughput와 ID correctness를 regression test합니다."),
      d("ID gaps를 채우려다 duplicate/corruption이 발생합니다.", "generated surrogate key를 gapless business sequence로 오해하고 MAX+1/reuse를 시도했습니다.", ["generator/database counter와 rollback/concurrency history를 봅니다.", "business numbering requirement를 분리합니다.", "unique/duplicate rows를 검사합니다."], "surrogate ID gaps를 허용하고 gapless 요구는 별도 serialized business numbering/ledger로 설계합니다.", "MAX+1 patterns를 정적/SQL review에서 금지하고 concurrency tests를 둡니다."),
    ],
    expertNotes: ["strategy migration은 primary/foreign keys, replicas, caches, APIs와 data backfill을 포함하는 큰 schema project입니다.", "AUTO의 provider choice를 environments에 맡기지 말고 resolved generator/catalog/SQL을 test합니다."],
  },
  {
    id: "column-contract-null-length-precision",
    title: "@Column name·nullable·length·precision·scale·unique를 migration·validation·DB constraints와 정렬합니다",
    lead: "@Column은 mapping과 schema-generation hint를 제공하지만 actual production constraint는 versioned migration/catalog가 소유하며 HTTP/Jakarta validation을 자동 대체하지 않습니다.",
    explanations: [
      "nullable=false는 provider mapping/DDL hint이며 existing production column의 NOT NULL과 dirty data를 자동 해결하지 않습니다. preflight, backfill, write-path prevention와 online validation을 거쳐 constraint를 추가합니다.",
      "length는 String DDL hint이며 Bean Validation @Size와 JSON request body limit이 별도입니다. bytes/characters, charset/collation와 index prefix limits를 target MySQL에서 확인합니다.",
      "precision/scale은 decimal money/rate semantics와 rounding policy를 명시합니다. floating point를 exact money로 쓰지 않고 Java BigDecimal, column type와 calculations를 정렬합니다.",
      "unique=true 단일 flag보다 named composite/conditional/tenant-aware unique constraints를 @Table/migration으로 명확히 합니다. application check-then-insert race는 DB unique constraint와 error mapping으로 닫습니다.",
      "insertable/updatable=false는 SQL generation participation을 제어하지만 database default/generated column, refresh timing과 stale state를 이해해야 합니다. authorization/immutability security control이 아닙니다.",
    ],
    concepts: [
      c("column mapping", "persistent attribute와 database column identifier/type/nullability/insert-update participation을 연결하는 metadata입니다.", ["migration/catalog와 대조합니다.", "validation과 구분합니다."]),
      c("database constraint", "모든 writers에 적용되는 NOT NULL, UNIQUE, CHECK, FK 등 database-level invariant입니다.", ["concurrency를 닫습니다.", "named migrations로 관리합니다."]),
      c("write participation", "insertable/updatable가 provider-generated INSERT/UPDATE column list에 참여하는지 정하는 mapping 속성입니다.", ["read-only domain rule과 다릅니다.", "DB-generated values를 refresh합니다."]),
    ],
    codeExamples: [java("jpa02-column-validation", "column과 request boundary constraints를 결정적으로 검증", "Jpa02Columns.java", "required writer/subject, length, content bound와 email format category를 safe error codes로 출력합니다.", String.raw`import java.util.*;

public class Jpa02Columns {
  record Input(String writer, String subject, String content, String email) {}
  static List<String> validate(Input value) {
    var errors = new ArrayList<String>();
    if (value.writer() == null || value.writer().isBlank()) errors.add("writer-required");
    else if (value.writer().length() > 40) errors.add("writer-length");
    if (value.subject() == null || value.subject().isBlank()) errors.add("subject-required");
    else if (value.subject().length() > 120) errors.add("subject-length");
    if (value.content() != null && value.content().length() > 4000) errors.add("content-length");
    if (value.email() != null && !value.email().contains("@")) errors.add("email-shape");
    return errors;
  }
  public static void main(String[] args) {
    System.out.println("valid=" + validate(new Input("learner", "mapping", "body", "user@example.test")));
    System.out.println("invalid=" + validate(new Input(" ", "", "body", "invalid")));
  }
}`, "valid=[]\ninvalid=[writer-required, subject-required, email-shape]", ["jakarta-column", "jakarta-basic", "jakarta-validation", "mysql-string-types", "owasp-password-storage", "owasp-cryptographic-storage"] )],
    diagnostics: [
      d("@Column(nullable=false)를 추가했지만 production column은 nullable입니다.", "annotation만 변경하고 schema migration/catalog validation을 실행하지 않았습니다.", ["mapping과 catalog information_schema를 비교합니다.", "migration ledger/pending status를 봅니다.", "existing NULL counts와 writer paths를 확인합니다."], "dirty data repair와 versioned NOT NULL migration을 적용하고 catalog readback합니다.", "mapping↔migration↔catalog conformance를 deploy gate로 둡니다."),
      d("unique check를 통과한 concurrent requests가 duplicate insert를 만듭니다.", "application pre-check만 있고 database UNIQUE constraint 또는 violation mapping이 없습니다.", ["catalog unique constraints를 봅니다.", "concurrent barrier test를 실행합니다.", "SQLState/error translation을 확인합니다."], "DB named unique constraint로 race를 닫고 duplicate violation을 stable 409/domain outcome으로 변환합니다.", "positive/negative/concurrent uniqueness tests를 유지합니다."),
    ],
    expertNotes: ["@Column(columnDefinition=...)은 portable type inference를 우회하므로 vendor coupling과 migration owner를 명시합니다.", "Java String.length는 Unicode code units이며 DB character/byte limits와 완전히 같지 않아 target charset에서 boundary tests가 필요합니다."],
  },
  {
    id: "text-enum-file-metadata",
    title: "TEXT·enum·file metadata를 vendor type·domain code·storage object 경계로 설계합니다",
    lead: "긴 content, status flags와 file names는 단순 String/Integer columns가 아니라 size/search/index, versioned state와 external storage lifecycle을 갖습니다.",
    explanations: [
      "TEXT column은 large content를 저장하지만 row/index/search/backup 비용과 max packet/request body를 고려합니다. 무제한 사용자 content를 허용하지 않고 business/UI/storage bounds와 full-text/search 전략을 둡니다.",
      "active=0/1 integer는 의미가 숨겨지고 invalid states를 허용할 수 있습니다. enum/domain status를 stable database code로 mapping하고 CHECK/lookup, transition method와 unknown-code upgrade policy를 둡니다.",
      "EnumType.ORDINAL은 enum 순서 변경으로 stored meaning이 바뀌므로 피하고 STRING도 Java constant rename이 data migration이 됩니다. explicit AttributeConverter 또는 stable code를 고려합니다.",
      "fileName 하나만 entity에 두면 original/display/storage key/content type/size/digest/scan status/ownership을 구분하지 못합니다. external storage metadata entity/value object와 upload transaction/compensation을 설계합니다.",
      "사용자 제공 filename/path를 filesystem key나 response header에 직접 사용하지 않습니다. generated opaque storage key, basename/Unicode normalization, header encoding와 authorization을 적용합니다.",
    ],
    concepts: [
      c("vendor column definition", "provider type inference 대신 database-specific DDL fragment를 annotation에 직접 지정하는 mapping입니다.", ["portability가 낮습니다.", "migration과 drift를 관리합니다."]),
      c("stable status code", "Java enum display/name과 분리되어 database/API에서 장기간 유지되는 versioned 상태 값입니다.", ["unknown code policy가 필요합니다.", "allowed transitions를 둡니다."]),
      c("storage key", "외부 object/file을 충돌 없이 식별하는 server-generated opaque identifier입니다.", ["display filename과 분리합니다.", "authorization/ownership과 연결합니다."]),
    ],
    diagnostics: [
      d("enum constant 순서를 바꾼 뒤 기존 rows의 의미가 달라집니다.", "EnumType.ORDINAL 또는 implicit numeric state를 사용했습니다.", ["mapping/converter와 stored values를 봅니다.", "release enum history를 비교합니다.", "unknown/invalid counts를 검사합니다."], "stable explicit codes로 migration하고 ordinal mapping을 제거합니다.", "enum reorder/rename compatibility and unknown-code tests를 둡니다."),
      d("file record는 있는데 object가 없거나 반대 orphan이 생깁니다.", "DB row와 external storage를 한 transaction처럼 가정하고 staged/compensation/reconciliation이 없습니다.", ["storage key/status와 object existence/digest를 비교합니다.", "failure timing과 transaction logs를 봅니다.", "orphan counts/retention을 확인합니다."], "temporary upload→DB commit→finalize state machine과 idempotent cleanup/reconciliation을 구현합니다.", "각 failure point fault test와 orphan metrics/runbook을 운영합니다."),
    ],
    expertNotes: ["large text와 file metadata는 entity default eager/basic loading이 use case payload에 미치는 영향을 측정합니다.", "database enum vendor type은 constraint를 강화할 수 있지만 online value addition/migration portability trade-off를 검토합니다."],
  },
  {
    id: "temporal-created-at-clock",
    title: "LocalDateTime·database timestamp·@PrePersist·Clock을 timezone·precision·immutability 계약으로 만듭니다",
    lead: "생성 시각은 JVM wall clock 한 번 호출로 끝나지 않고 instant/local representation, zone, DB precision, clock skew와 source-of-truth를 결정해야 합니다.",
    explanations: [
      "LocalDateTime은 zone/offset 없는 local date-time입니다. 여러 zones/nodes에서 absolute event time이 필요하면 Instant/OffsetDateTime와 UTC storage/serialization policy를 검토합니다.",
      "@PrePersist callback은 persist lifecycle에 invoked되지만 IDENTITY id는 이 시점에 아직 없을 수 있습니다. callback에서 EntityManager/query/relationship mutation 같은 복잡한 work를 하지 않습니다.",
      "LocalDateTime.now()는 system default zone/clock에 결합돼 deterministic tests와 skew handling이 어렵습니다. service/domain factory에 injectable Clock을 사용하거나 database-generated timestamp를 source-of-truth로 선택합니다.",
      "database default/generated timestamp를 쓰며 insertable/updatable=false로 mapping하면 insert 뒤 generated value refresh timing을 검증합니다. entity가 null/stale timestamp를 public response에 내보내지 않게 합니다.",
      "Java nanoseconds와 MySQL temporal fractional precision이 다를 수 있어 round/truncate policy와 equality/range tests를 둡니다. exact equality 대신 approved precision으로 비교합니다.",
    ],
    concepts: [
      c("temporal source of truth", "생성/변경 시각을 결정하는 authoritative clock(JVM, database, event source)과 zone/precision 정책입니다.", ["한 owner를 선택합니다.", "skew를 관측합니다."]),
      c("@PrePersist", "entity가 persist되기 전 lifecycle callback method를 지정하는 annotation입니다.", ["non-relationship state를 초기화할 수 있습니다.", "IDENTITY id는 아직 없을 수 있습니다."]),
      c("temporal precision", "Java와 database가 저장·비교하는 fractional second resolution입니다.", ["round/truncate를 명시합니다.", "round-trip tests를 둡니다."]),
    ],
    codeExamples: [java("jpa02-clock", "고정 Clock에서 UTC 생성 시각을 결정적으로 생성", "Jpa02Clock.java", "Clock.fixed와 UTC로 생성 시각을 만들고 같은 instant의 다른 zone 표현을 비교합니다.", String.raw`import java.time.*;

public class Jpa02Clock {
  static LocalDateTime createdAt(Clock clock) {
    return LocalDateTime.ofInstant(clock.instant(), clock.getZone());
  }
  public static void main(String[] args) {
    var instant = Instant.parse("2026-07-14T03:04:05Z");
    var utc = Clock.fixed(instant, ZoneOffset.UTC);
    var seoul = Clock.fixed(instant, ZoneId.of("Asia/Seoul"));
    System.out.println("instant=" + instant);
    System.out.println("utc=" + createdAt(utc));
    System.out.println("seoul=" + createdAt(seoul));
    System.out.println("sameInstant=" + utc.instant().equals(seoul.instant()));
  }
}`, "instant=2026-07-14T03:04:05Z\nutc=2026-07-14T03:04:05\nseoul=2026-07-14T12:04:05\nsameInstant=true", ["jakarta-pre-persist", "jakarta-persistence-spec", "jdk-clock", "mysql-date-types"] )],
    diagnostics: [
      d("두 servers에서 createdAt 순서가 실제 event 순서와 어긋납니다.", "LocalDateTime.now와 unsynchronized system zones/clocks를 absolute ordering으로 사용했습니다.", ["node zones/NTP offset과 stored precision을 봅니다.", "event/DB commit timestamps를 비교합니다.", "serialization zone assumptions을 확인합니다."], "UTC Instant 또는 authoritative DB/event clock과 explicit zone conversion을 사용합니다.", "clock skew alerts와 fixed-clock/round-trip multi-zone tests를 둡니다."),
      d("persist response의 createdAt이 null인데 DB row에는 값이 있습니다.", "DB default/generated value를 사용하지만 entity refresh/return timing을 고려하지 않았습니다.", ["insertable/updatable/default/generated mapping을 봅니다.", "INSERT RETURNING/generated refresh behavior를 확인합니다.", "transaction flush/readback을 실행합니다."], "provider-supported generated mapping/refresh 또는 service-assigned Clock value로 owner를 하나 정합니다.", "persist→flush→response/readback temporal contract test를 둡니다."),
    ],
    expertNotes: ["timestamp는 security nonce나 total ordering source가 아니며 concurrency에는 version/locks를 사용합니다.", "audit timestamps는 actor/source/reason과 변경 불가능한 audit trail requirements를 별도 설계합니다."],
  },
  {
    id: "sensitive-fields-password-email",
    title: "password·email을 entity String에서 credential hash·contact PII·DTO exposure 정책으로 분리합니다",
    lead: "민감 field 이름을 갖는 String column은 저장 형식과 lifecycle을 설명하지 않으므로 purpose-specific value objects, hashing/encryption, access control와 retention을 명시합니다.",
    explanations: [
      "사용자 password라면 reversible plaintext가 아니라 승인된 adaptive password hashing algorithm, unique salt와 work factor를 사용합니다. 비밀번호 확인용 단기 값이라면 purpose/lifetime/attempt/rate-limits와 one-time invalidation을 별도 model로 둡니다.",
      "entity field가 실제 어떤 용도인지 원본만으로 단정하지 않습니다. service/controller/migration을 감사해 credential, guestbook edit secret, verification code 등 threat model을 확정하고 더 안전한 authentication model로 migration합니다.",
      "email은 contact PII이자 case/Unicode/deliverability가 복잡한 identifier입니다. raw email을 public ID/log/metric label로 사용하지 않고 normalized lookup와 original/display value, verification status를 분리합니다.",
      "encryption at rest가 필요한 PII는 keys와 data의 rotation, deterministic lookup trade-off, access audit와 deletion/retention을 설계합니다. hashing과 encryption을 목적에 따라 구분합니다.",
      "Lombok @Data가 generated toString/equals/hashCode/getters에 sensitive fields를 포함할 수 있습니다. explicit methods와 log redaction, response DTO allowlist를 사용합니다.",
    ],
    concepts: [
      c("password hash", "password를 adaptive one-way KDF와 unique salt로 변환해 검증하는 stored verifier입니다.", ["plaintext/reversible encryption과 다릅니다.", "work factor/version migration이 필요합니다."]),
      c("contact PII", "email처럼 개인을 식별·연락할 수 있어 접근·로그·retention·deletion 통제가 필요한 data입니다.", ["public identifier로 쓰지 않습니다.", "verification status와 분리합니다."]),
      c("sensitive value object", "raw String 대신 purpose, validation, redacted display와 allowed operations를 제한하는 type입니다.", ["accidental logging을 줄입니다.", "persistence converter를 검토합니다."]),
    ],
    diagnostics: [
      d("entity log/toString에 password/email이 출력됩니다.", "@Data 또는 object serialization이 모든 fields를 자동 포함했습니다.", ["generated/explicit toString와 log statements를 봅니다.", "exception/audit/cache outputs를 검사합니다.", "노출 credential/PII 범위를 평가합니다."], "sensitive fields를 explicit exclusion/redacted value object로 바꾸고 노출 credential이면 rotate합니다.", "canary secret/PII zero-leak tests와 forbidden serialization fields를 둡니다."),
      d("database 유출에서 password-like field가 즉시 사용 가능합니다.", "plaintext 또는 fast/general hash로 저장하고 purpose-specific KDF를 사용하지 않았습니다.", ["실제 storage format/algorithm/work factor를 안전하게 확인합니다.", "auth flow와 migration support를 봅니다.", "affected credentials와 account abuse를 조사합니다."], "credential을 reset/rotate하고 approved adaptive hashing과 rehash-on-login migration을 적용합니다.", "password storage policy, format versioning와 offline cracking resistance review를 운영합니다."),
    ],
    expertNotes: ["email normalization은 provider-specific equivalence를 일반화하지 않고 product identity policy를 명시합니다.", "encryption key를 application DB와 같은 credential/path에 두면 compromise isolation이 약해집니다."],
  },
  {
    id: "equals-hashcode-tostring-lombok",
    title: "entity equals/hashCode/toString을 generated ID·proxy·mutable fields·collections에 안전하게 설계합니다",
    lead: "Lombok @Data가 모든 fields로 생성한 equality/hash/toString은 ID가 persist 후 생기고 attributes가 mutable하며 proxies/associations가 있는 entity에서 collection corruption, recursion과 lazy SQL을 만들 수 있습니다.",
    explanations: [
      "new entity 두 개는 business fields가 같아도 같은 persistent row라고 단정할 수 없습니다. generated ID가 null일 때 equality policy를 명시하고 non-null stable ID 또는 immutable natural key를 사용합니다.",
      "entity를 HashSet/HashMap key로 넣은 뒤 persist되어 hashCode가 바뀌면 lookup이 깨집니다. mutable fields/ID를 hash에 쓰는 policy와 collection lifecycle을 실제 test합니다.",
      "Hibernate proxy subclass와 concrete class checks는 equality symmetry를 깨뜨릴 수 있습니다. provider guidance에 맞는 effective class comparison과 identifier access를 사용합니다.",
      "toString에 bidirectional associations를 포함하면 recursion/StackOverflow, lazy loads와 data leakage가 생깁니다. safe ID/status만 bounded하게 출력하고 sensitive/large/association fields를 제외합니다.",
      "entity equality와 API DTO/value object equality를 구분합니다. persistence context identity map만 믿고 detached/nodes equality를 방치하지 않습니다.",
    ],
    concepts: [
      c("identity equality", "동일 entity type과 non-null persistent identifier가 같은지를 기반으로 하는 equality policy입니다.", ["new entity policy가 필요합니다.", "proxy compatibility를 검토합니다."]),
      c("stable hash code", "object가 hash collection에 있는 동안 변경되지 않는 hashCode behavior입니다.", ["mutable fields를 피합니다.", "generated ID timing을 고려합니다."]),
      c("safe toString", "식별/상태의 bounded non-sensitive fields만 출력하고 associations/large/sensitive data를 제외하는 진단 표현입니다.", ["lazy loads를 유발하지 않습니다.", "public serialization과 다릅니다."]),
    ],
    codeExamples: [java("jpa02-equality", "non-null generated ID 기반 entity equality 경계", "Jpa02Equality.java", "새 entity끼리는 다르고 같은 non-null ID의 detached-like objects는 같다는 정책을 실행합니다.", String.raw`public class Jpa02Equality {
  static final class Entity {
    private final Long id;
    private final String subject;
    Entity(Long id, String subject) { this.id = id; this.subject = subject; }
    @Override public boolean equals(Object other) {
      if (this == other) return true;
      if (!(other instanceof Entity that)) return false;
      return id != null && id.equals(that.id);
    }
    @Override public int hashCode() { return Entity.class.hashCode(); }
    @Override public String toString() { return "Entity[id=" + (id == null ? "new" : id) + "]"; }
  }
  public static void main(String[] args) {
    var firstNew = new Entity(null, "same");
    var secondNew = new Entity(null, "same");
    var loaded = new Entity(42L, "old");
    var detached = new Entity(42L, "changed");
    System.out.println("newEqual=" + firstNew.equals(secondNew));
    System.out.println("sameIdEqual=" + loaded.equals(detached));
    System.out.println("safe=" + detached);
  }
}`, "newEqual=false\nsameIdEqual=true\nsafe=Entity[id=42]", ["hibernate-user-guide", "jakarta-persistence-spec", "jdk-object"] )],
    diagnostics: [
      d("persist 후 HashSet에서 entity를 찾을 수 없습니다.", "generated ID가 null→value로 바뀌면서 Lombok-generated hashCode가 변경됐습니다.", ["equals/hashCode fields와 persist 전후 값을 봅니다.", "hash collection insertion timing을 확인합니다.", "proxy/detached equality를 test합니다."], "stable equality/hash policy를 구현하고 entity를 long-lived hash keys로 사용하는 design을 줄입니다.", "new/managed/detached/proxy/hash-collection contract tests를 둡니다."),
      d("로그 한 줄에서 수백 SQL과 StackOverflow가 발생합니다.", "generated toString이 lazy/bidirectional associations를 순회했습니다.", ["toString fields와 association graph를 봅니다.", "SQL count/stack trace recursion을 확인합니다.", "sensitive/large field 노출을 검사합니다."], "explicit safe toString으로 ID/status만 출력하고 associations를 제외합니다.", "logging tests가 query count zero, bounded length와 forbidden fields를 검증합니다."),
    ],
    expertNotes: ["예제 equality는 final simple class model이며 실제 proxies/inheritance에서는 Hibernate version guidance와 symmetry tests가 필요합니다.", "constant class hash는 correctness를 지킬 수 있지만 bucket performance trade-off가 있어 entity collection usage를 측정합니다."],
  },
  {
    id: "defaults-lifecycle-soft-delete",
    title: "Java default·builder default·DB default·@PrePersist와 soft-delete transition의 owner를 하나씩 정합니다",
    lead: "같은 field에 Java initializer, Lombok builder default, lifecycle callback과 database default가 겹치면 생성 경로별 값과 source-of-truth가 달라집니다.",
    explanations: [
      "field initializer는 Java construction에서 적용되지만 reflection/provider hydration과 builder generated code semantics를 확인해야 합니다. @Builder.Default는 Lombok builder에 default를 보존하지만 database direct writers에는 적용되지 않습니다.",
      "DB default는 INSERT column이 omitted/default keyword일 때 적용됩니다. provider가 null column을 explicit insert하면 default가 적용되지 않을 수 있어 insertable/dynamic insert와 generated refresh를 검증합니다.",
      "@PrePersist는 new entity persist 전에 missing default를 채울 수 있지만 bulk SQL/direct database writers와 update에는 적용되지 않습니다. DB invariant가 필요하면 constraint/default를 함께 둡니다.",
      "active integer의 softDelete는 idempotent state transition, deletedAt/deletedBy/reason, retention/restore/legal hold와 concurrency version을 고려합니다. 0/1을 마법 숫자로 노출하지 않습니다.",
      "default value change는 existing rows를 자동 바꾸지 않습니다. new-write default, backfill and read compatibility를 migration phase로 나눕니다.",
    ],
    concepts: [
      c("Java default", "constructor/field initializer/builder가 new object에 제공하는 application-side initial value입니다.", ["DB direct writer에는 적용되지 않습니다.", "creation paths를 test합니다."]),
      c("database default", "INSERT에서 column value가 생략될 때 DB가 생성하는 schema-level default입니다.", ["explicit NULL과 다릅니다.", "generated refresh를 검증합니다."]),
      c("soft-delete transition", "row를 물리 삭제하지 않고 active→deleted state와 audit metadata를 원자적으로 변경하는 domain operation입니다.", ["query visibility와 retention을 포함합니다.", "restore/concurrency를 설계합니다."]),
    ],
    diagnostics: [
      d("builder로 만든 entity만 active가 null입니다.", "field initializer와 builder code generation default semantics가 달랐거나 @Builder.Default가 누락됐습니다.", ["all construction paths를 실행합니다.", "generated builder/constructors를 확인합니다.", "DB default/insert SQL을 봅니다."], "domain factory와 explicit builder default/validation으로 application owner를 고정하고 DB constraint/default를 정렬합니다.", "constructor/builder/deserialization/provider/direct SQL creation matrix를 test합니다."),
      d("soft delete와 update가 동시에 일어나 deleted row 내용이 덮입니다.", "version/conditional update 없이 mutable flag만 변경해 lost update를 허용했습니다.", ["UPDATE predicates/affected rows와 version을 봅니다.", "concurrent barrier test를 실행합니다.", "deleted visibility/cache를 확인합니다."], "@Version 또는 explicit CAS로 status transition을 보호하고 affectedRows=1을 invariant로 둡니다.", "delete/update race, repeat delete, restore와 retention tests를 운영합니다."),
    ],
    expertNotes: ["DB default와 PrePersist를 중복 사용하면 어느 쪽이 authoritative인지 문서화하고 equality/readback을 test합니다.", "soft delete는 physical deletion obligations을 무기한 회피하는 기능이 아니므로 purge pipeline과 backup retention을 포함합니다."],
  },
  {
    id: "mapping-validation-migration-tests",
    title: "mapping metadata→migration DDL→catalog→round-trip/failure tests로 entity 변경을 qualification합니다",
    lead: "entity annotation 변경은 schema/API/data migration이 될 수 있으므로 generated DDL diff만 보지 않고 catalog, existing data와 old/new binary compatibility를 검증합니다.",
    explanations: [
      "mapping change inventory는 table/column/id/type/null/default/constraints/indexes/lifecycle/equality/API exposure를 분류합니다. source-only rename과 physical migration을 구분합니다.",
      "Hibernate validate는 basic mapping compatibility를 찾지만 business constraints/indexes/grants/collation/generated columns를 모두 보증하지 않습니다. canonical catalog conformance를 보완합니다.",
      "versioned migration에는 dirty data preflight, backfill/quarantine, expand-contract, lock/resource budget, postconditions와 forward/rollback route를 둡니다. ddl-auto:update로 자동 적용하지 않습니다.",
      "round-trip tests는 persist→flush→clear→find로 actual DB conversion/default/precision/ID를 확인합니다. negative tests는 null/length/unique/check/FK와 SQLState/domain translation을 검증합니다.",
      "old/new application compatibility와 serialization DTO contract, query plans, batch behavior와 log zero-leak을 canary합니다. entity class diff만 승인하지 않습니다.",
    ],
    concepts: [
      c("round-trip test", "entity를 persist/flush/context clear 후 DB에서 다시 읽어 mapping conversion과 generated values를 검증하는 test입니다.", ["in-memory object assert보다 강합니다.", "target vendor에서 실행합니다."]),
      c("catalog conformance", "actual table/column/type/constraint/index/default가 approved mapping/migration expectation과 일치하는지 비교하는 검사입니다.", ["provider validate를 보완합니다.", "drift를 찾습니다."]),
      c("mapping compatibility matrix", "old/new binaries와 old/expanded/contracted schemas가 어떤 read/write combinations을 지원하는지 정의한 표입니다.", ["rolling deploy/rollback을 지원합니다.", "destructive gate를 제어합니다."]),
    ],
    diagnostics: [
      d("mapping test는 통과하지만 production migration에서 lock timeout이 납니다.", "빈 test schema의 generated DDL만 검증하고 data volume, online DDL, metadata locks와 traffic을 고려하지 않았습니다.", ["target table size/locks/DDL algorithm을 봅니다.", "production-like rehearsal duration/log/lag를 확인합니다.", "timeout/retry/unknown outcome을 분류합니다."], "online/additive migration과 resource budget, maintenance/traffic guard를 적용합니다.", "representative-scale migration canary와 automatic pause/rollback/forward runbook을 둡니다."),
      d("column type 변경 뒤 일부 legacy rows만 읽기 실패합니다.", "existing data preflight와 boundary/encoding conversion을 건너뛰었습니다.", ["failure rows를 privacy-safe category/count로 찾습니다.", "old/new type ranges/collation/encoding을 비교합니다.", "backfill/quarantine ledger를 봅니다."], "bad rows를 approved repair/quarantine하고 staged dual-compatible conversion을 수행합니다.", "full-data precondition queries와 postconversion reconciliation을 migration에 포함합니다."),
    ],
    expertNotes: ["schema diff generator output은 review 초안이며 semantic rename/data conversion과 operational safety를 사람이/정책이 보완해야 합니다.", "test data가 실제 distributions/edge cases를 대표하지 않으면 mapping performance와 conversion risk를 놓칠 수 있습니다."],
  },
  {
    id: "entity-release-governance",
    title: "entity mapping release를 보안·schema·data·API·rollback evidence로 닫습니다",
    lead: "entity 완성의 기준은 annotation 목록이 아니라 approved schema에서 identity, constraints, lifecycle, privacy와 compatibility가 반복 가능하게 증명되는 것입니다.",
    explanations: [
      "preflight에서 provider/DB version, entity scan, mapping metadata, migration ledger/catalog, required constraints, ID generator와 sensitive field policies를 확인합니다.",
      "CI는 compile/mapping bootstrap, schema validate/catalog diff, target-vendor round trip, negative constraints, concurrency, DTO serialization and zero-leak tests를 계층화합니다.",
      "canary는 insert/update/delete/soft-delete, generated ID/time, error taxonomy, query count/batching, pool/lock/latency와 forbidden field exposure를 release별로 봅니다.",
      "rollback은 expanded schema가 old/new binaries를 지원하는지, new enum/status/ID/data가 old code에 안전한지 검증합니다. destructive contract는 zero old usage와 restore evidence 뒤에 수행합니다.",
      "mapping decision record에는 field purpose, source-of-truth, null/default, sensitivity, retention, constraints/index, owner와 migration history를 남겨 다음 세션/release가 원본을 다시 추측하지 않게 합니다.",
    ],
    concepts: [
      c("mapping release", "entity code, migration, catalog/data state와 DTO/security contracts를 하나의 배포 단위로 qualification한 version입니다.", ["artifact diff보다 넓습니다.", "rollback target을 명확히 합니다."]),
      c("field decision record", "persistent field의 meaning, type, null/default, sensitivity, constraints, lifecycle, API exposure와 owner를 기록한 설계 문서입니다.", ["annotation drift를 줄입니다.", "migration history와 연결합니다."]),
      c("destructive contract gate", "old mapping/data consumers가 사라지고 backup/restore·forward recovery가 준비돼야 column/table/status를 제거하도록 하는 승인입니다.", ["telemetry와 inventory가 필요합니다.", "별도 release로 분리합니다."]),
    ],
    diagnostics: [
      d("새 entity release rollback 뒤 unknown status/column data로 old code가 실패합니다.", "forward-written data compatibility와 old binary read path를 test하지 않았습니다.", ["old/new mapping compatibility matrix를 봅니다.", "new status/field population을 확인합니다.", "rollback schema/config release를 검사합니다."], "old code가 unknown data를 안전 처리하도록 먼저 확장하거나 forward migration으로 compatible state를 복원합니다.", "N/N-1 binary-schema-data round-trip tests와 contract gate를 둡니다."),
      d("canary 성공 후 전체 rollout에서 ID/DB capacity 문제가 발생합니다.", "작은 canary가 ID allocation, index locality, sequence/auto-increment contention과 data volume을 대표하지 못했습니다.", ["ID generator waits/batching/index page metrics를 봅니다.", "fleet concurrency와 insert volume을 비교합니다.", "DB lock/IO/replication lag를 확인합니다."], "strategy/pool/batch를 capacity model에 맞추고 progressive load stages로 확대합니다.", "representative throughput qualification과 automatic resource thresholds를 운영합니다."),
    ],
    expertNotes: ["entity mapping은 internal implementation처럼 보여도 database와 events/analytics에 장기 contract를 남깁니다.", "public identifier, audit, privacy deletion과 retention 요구는 surrogate ID/soft-delete mapping만으로 해결되지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-entity", repository: "D:/dev/2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/entity/GuestBook.java", usedFor: ["@Entity/@Table", "IDENTITY/columns", "@PrePersist time", "defaults/soft delete/sensitive fields"], evidence: "2026-07-14 read-only audit: 61 lines, 1,495 bytes, SHA-256 BA0B75DD8DEA41B4A0DFD6F86D3F357ED9AADEF9B2EB336C00BD78B795F10ACF. 실제 domain values는 복사하지 않았습니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "specifications/persistence/3.2/jakarta-persistence-spec-3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["entity requirements", "access type", "lifecycle", "identity generation", "callbacks", "schema mapping"], evidence: "Jakarta Persistence 3.2 entity, identity, access and lifecycle normative contracts를 확인했습니다." },
  { id: "jakarta-entity", repository: "Jakarta Persistence API", path: "jakarta/persistence/Entity", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/entity", usedFor: ["entity class requirements", "entity name", "persistent fields"], evidence: "@Entity API의 non-final/no-arg/top-level requirements와 default persistence semantics를 확인했습니다." },
  { id: "jakarta-id", repository: "Jakarta Persistence API", path: "jakarta/persistence/Id", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/id", usedFor: ["simple primary key", "field/property placement", "identity mapping"], evidence: "@Id annotation contract와 legal primary-key mapping context를 확인했습니다." },
  { id: "jakarta-generated-value", repository: "Jakarta Persistence API", path: "jakarta/persistence/GeneratedValue", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/generatedvalue", usedFor: ["generated simple IDs", "strategy/generator", "allocation"], evidence: "@GeneratedValue strategy/generator contract를 확인했습니다." },
  { id: "jakarta-generation-type", repository: "Jakarta Persistence API", path: "jakarta/persistence/GenerationType", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/generationtype", usedFor: ["AUTO/TABLE/SEQUENCE/IDENTITY/UUID", "strategy portability"], evidence: "JPA 3.2 GenerationType enum의 defined strategies를 확인했습니다." },
  { id: "jakarta-column", repository: "Jakarta Persistence API", path: "jakarta/persistence/Column", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/column", usedFor: ["name/unique/nullable/insertable/updatable", "length/precision/scale", "columnDefinition"], evidence: "@Column mapping elements와 default semantics를 확인했습니다." },
  { id: "jakarta-basic", repository: "Jakarta Persistence API", path: "jakarta/persistence/Basic", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/basic", usedFor: ["basic attribute", "optional/fetch", "supported field mapping"], evidence: "@Basic optional/fetch와 persistent basic attribute contract를 확인했습니다." },
  { id: "jakarta-table", repository: "Jakarta Persistence API", path: "jakarta/persistence/Table", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/table", usedFor: ["table/catalog/schema", "unique constraints/indexes"], evidence: "@Table physical table mapping and constraint/index metadata를 확인했습니다." },
  { id: "jakarta-access", repository: "Jakarta Persistence API", path: "jakarta/persistence/Access", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/access", usedFor: ["field/property access", "explicit override"], evidence: "@Access와 AccessType override contract를 확인했습니다." },
  { id: "jakarta-pre-persist", repository: "Jakarta Persistence API", path: "jakarta/persistence/PrePersist", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/prepersist", usedFor: ["pre-persist callback", "lifecycle timing"], evidence: "@PrePersist callback annotation과 specification lifecycle timing을 확인했습니다." },
  { id: "entitymanager-javadoc", repository: "Jakarta Persistence API", path: "jakarta/persistence/EntityManager", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/entitymanager", usedFor: ["persist/merge/remove/detach", "managed identity", "transaction boundary"], evidence: "EntityManager lifecycle operation API를 확인했습니다." },
  { id: "hibernate-user-guide", repository: "Hibernate ORM", path: "current/userguide/html_single/Hibernate_User_Guide.html", publicUrl: "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html", usedFor: ["identifier strategies", "entity mapping", "proxy/equality", "generated values", "batching"], evidence: "current Hibernate provider guidance for entity/identifier mappings and equality를 확인했습니다." },
  { id: "mysql-auto-increment", repository: "MySQL 8.4", path: "refman/8.4/en/innodb-auto-increment-handling.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-auto-increment-handling.html", usedFor: ["IDENTITY/auto_increment", "InnoDB lock modes", "counter/gaps"], evidence: "InnoDB AUTO_INCREMENT allocation/counter behavior를 확인했습니다." },
  { id: "mysql-string-types", repository: "MySQL 8.4", path: "refman/8.4/en/string-types.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/string-types.html", usedFor: ["VARCHAR/TEXT", "length/storage", "charset/collation boundary"], evidence: "MySQL 8.4 character/string data type families를 확인했습니다." },
  { id: "mysql-date-types", repository: "MySQL 8.4", path: "refman/8.4/en/date-and-time-types.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/date-and-time-types.html", usedFor: ["DATETIME/TIMESTAMP", "range/precision", "timezone/default behavior"], evidence: "MySQL 8.4 temporal types and conversion caveats를 확인했습니다." },
  { id: "jakarta-validation", repository: "Jakarta Validation", path: "specifications/bean-validation/3.1/", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/", usedFor: ["entity lifecycle validation", "@NotNull/@Size", "validation groups"], evidence: "Jakarta Validation 3.1 constraints/lifecycle integration contract를 확인했습니다." },
  { id: "owasp-password-storage", repository: "OWASP Cheat Sheet Series", path: "cheatsheets/Password_Storage_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", usedFor: ["adaptive password hashing", "salt/work factor", "migration"], evidence: "password verifier storage and work-factor guidance를 확인했습니다." },
  { id: "owasp-cryptographic-storage", repository: "OWASP Cheat Sheet Series", path: "cheatsheets/Cryptographic_Storage_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html", usedFor: ["PII encryption", "key separation/rotation", "data minimization"], evidence: "sensitive data cryptographic storage/key lifecycle guidance를 확인했습니다." },
  { id: "jdk-clock", repository: "Oracle Java SE 21", path: "java.base/java/time/Clock.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html", usedFor: ["injectable time source", "fixed tests", "zone/instant"], evidence: "Clock abstraction and fixed/system clocks를 확인했습니다." },
  { id: "jdk-object", repository: "Oracle Java SE 21", path: "java.base/java/lang/Object.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["equals/hashCode contract", "toString boundary"], evidence: "Object equals/hashCode/toString base contracts를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-02-entity-id-column", slug: "jpa-02-entity-id-column", courseId: "spring", moduleId: "spring-data-jpa", order: 2,
  title: "@Entity·@Id·@GeneratedValue와 컬럼 매핑",
  subtitle: "원본 GuestBook entity를 identity·column·time·sensitive data·equality·migration 계약으로 재설계합니다",
  level: "중급", estimatedMinutes: 90,
  coreQuestion: "한 Java class가 안전한 JPA entity가 되려면 persistent identity, ID generation, column constraints, lifecycle/time, sensitive fields와 equals/hashCode를 schema migration과 어떻게 일치시켜야 할까요?",
  summary: "2026-spring-jpa-test의 GuestBook entity 한 파일을 read-only로 감사합니다. 원본의 @Entity/@Table, Long IDENTITY id, explicit columns, TEXT definition, @PrePersist LocalDateTime.now, integer active default, file metadata, softDelete와 Lombok @Data/@Builder를 실제 구현 근거로 삼되 domain/user values는 복사하지 않습니다. entity requirements/proxy, logical/physical naming와 access type, new-managed-detached-removed lifecycle, IDENTITY/SEQUENCE/TABLE/UUID/AUTO allocation, null/length/precision/unique column contracts, TEXT/enum/file metadata, clock/time precision, password/email security, proxy-safe equality/toString, Java/DB/lifecycle defaults, migration/catalog/round-trip tests와 release rollback까지 초급 annotation에서 production mapping governance로 연결합니다. 다섯 JDK 21 examples는 lifecycle, ID strategy, column validation, fixed clock와 identity equality를 exact stdout으로 실행하며 provider/DB 검증과의 경계를 명시합니다.",
  objectives: ["원본 entity의 mapping/domain/security/lifecycle assumptions를 source provenance로 감사한다.", "entity class requirements, proxies와 field/property access를 설명한다.", "new/managed/detached/removed state와 persistent identity를 구분한다.", "IDENTITY/SEQUENCE/TABLE/UUID/AUTO의 allocation/batching/portability를 비교한다.", "Column null/length/precision/unique/write participation을 migration/constraints와 정렬한다.", "time/default/soft-delete와 sensitive fields의 source-of-truth/lifecycle을 설계한다.", "proxy/generated-ID-safe equals/hashCode/toString을 검증한다.", "mapping→migration→catalog→round-trip/concurrency/API tests와 rollback을 운영한다."],
  prerequisites: [{ title: "Spring Data JPA starter·DataSource·ddl-auto", reason: "JPA provider, DataSource, schema owner와 migration baseline을 알아야 entity annotations가 실제 catalog/DDL/runtime에 미치는 영향을 안전하게 검증할 수 있습니다.", sessionSlug: "jpa-01-starter-datasource-ddl" }],
  keywords: ["Entity", "Id", "GeneratedValue", "GenerationType", "Column", "Table", "field access", "persistence identity", "IDENTITY", "SEQUENCE", "UUID", "PrePersist", "LocalDateTime", "Clock", "Bean Validation", "Lombok Data", "equals hashCode", "soft delete", "schema migration"],
  topics,
  lab: {
    title: "원본 GuestBook entity를 안전한 identity·column·lifecycle mapping으로 qualification하기",
    scenario: "원본 file을 변경하지 않고 sanitized entity fixture와 disposable MySQL에서 mapping metadata, migration, catalog, lifecycle, privacy and rollback evidence를 완성합니다.",
    setup: ["JDK 21", "원본과 호환되는 Boot/JPA provider", "disposable MySQL", "versioned migration fixture", "synthetic non-PII data", "원본 entity read-only"],
    steps: ["원본 file hash/annotations/fields/methods만 기록하고 actual domain values는 사용하지 않습니다.", "각 field의 purpose, null/default, sensitivity, source-of-truth, constraints/index/API exposure decision record를 작성합니다.", "entity class/no-arg/access/proxy와 managed lifecycle mapping bootstrap tests를 실행합니다.", "IDENTITY와 alternative generator의 ID timing, batching, gaps와 concurrency를 측정합니다.", "versioned migration으로 column types/null/length/unique/check/default를 만들고 mapping validate/catalog diff를 수행합니다.", "persist→flush→clear→find round trip과 negative constraints/SQLState mapping을 실행합니다.", "fixed Clock/DB timestamp의 zone/precision/generated refresh를 비교합니다.", "sensitive field storage/log/DTO exposure, equals/hashCode/toString zero-query/zero-leak을 test합니다.", "soft delete/update concurrency, query visibility, retention/restore와 orphan file state를 fault-test합니다.", "old/new entity binaries와 expanded/contracted schema rollback compatibility를 canary하고 destructive gate를 승인합니다."],
    expectedResult: ["실제 user/domain values와 sensitive fields가 logs/reports/public DTO에 노출되지 않습니다.", "mapping metadata, migration과 catalog column/constraints가 일치합니다.", "ID/time/default lifecycle과 persist round-trip outputs가 documented policy를 따릅니다.", "new/managed/detached/proxy equality와 soft-delete concurrency invariants가 통과합니다.", "old/new binary-schema rollback/forward recovery가 destructive migration 전에 rehearsal됩니다."],
    cleanup: ["disposable DB/schema/accounts, test data, generated migrations/reports와 processes를 제거합니다.", "debug SQL/parameter logging과 temporary management exposure를 원복합니다.", "synthetic sensitive canaries를 폐기하고 zero-leak readback합니다.", "원본 entity hash/status가 변경되지 않았음을 확인합니다."],
    extensions: ["@Version과 optimistic locking을 entity에 추가해 update/delete race를 확장합니다.", "association aggregate와 proxy-safe equality/N+1 tests를 추가합니다.", "AttributeConverter로 stable status code/encrypted value mapping을 검증합니다.", "entity mapping/catalog decision records를 schema registry와 deployment gate에 자동 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 실제 JPA/DB evidence와 대응 관계를 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "entity lifecycle transition을 설명합니다.", "ID strategy allocation/batching을 비교합니다.", "column validation과 DB constraint 차이를 적습니다.", "Clock zone/instant를 구분합니다.", "new/non-null ID equality를 설명합니다."], hints: ["model 결과를 provider guarantee라고 쓰지 말고 mapping/catalog/SQL test를 함께 적으세요."], expectedOutcome: "annotation 뒤 lifecycle·identity·column behavior를 실행 가능한 불변식으로 설명합니다.", solutionOutline: ["state→ID→columns→time→identity equality 순서입니다."] },
    { difficulty: "응용", prompt: "원본 GuestBook entity를 production-safe mapping으로 migration하는 계획을 작성하세요.", requirements: ["field decision record를 작성합니다.", "sensitive password/email storage/exposure를 교정합니다.", "length/null/constraints migration을 둡니다.", "time/default source-of-truth를 고릅니다.", "ID strategy/batching을 측정합니다.", "explicit equality/toString을 구현합니다.", "soft-delete concurrency/retention을 설계합니다.", "round-trip/catalog/rollback tests를 포함합니다."], hints: ["실제 원본 DB/user values를 sample에 복사하지 마세요."], expectedOutcome: "보안·schema·lifecycle·rollback이 일치하는 implementation-ready entity mapping이 완성됩니다.", solutionOutline: ["audit→field contract→migration→mapping→tests→canary/contract 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JPA entity mapping 표준을 작성하세요.", requirements: ["entity/proxy/access requirements를 정의합니다.", "ID strategy selection과 public ID 정책을 둡니다.", "column null/type/length/unique/default conventions를 둡니다.", "time/audit/clock policy를 둡니다.", "sensitive fields/encryption/hash/DTO exposure를 정의합니다.", "equals/hashCode/toString rules를 둡니다.", "mapping migration/catalog/round-trip tests를 둡니다.", "compatibility/destructive/restore gates를 포함합니다."], hints: ["annotation style guide가 아니라 data lifecycle/compatibility 표준을 만드세요."], expectedOutcome: "entity 생성부터 schema retirement까지 감사 가능한 mapping governance가 완성됩니다.", solutionOutline: ["type/identity→fields→lifecycle→security→schema/tests→release/recovery 순서입니다."] },
  ],
  nextSessions: ["jpa-03-repository-crud"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["원본 entity의 field/table/column names는 structural provenance에만 사용했고 actual persisted user/domain values는 복사하지 않았습니다.", "원본의 password-like/email/file fields가 실제 어떤 business/auth purpose와 storage algorithm을 쓰는지는 한 파일만으로 단정하지 않고 별도 service/controller/migration audit가 필요하다고 명시했습니다.", "연관관계, @Version, stable enum converter, catalog migration, proxy-safe equality와 security/rollback tests는 원본에 충분하지 않아 Jakarta/Hibernate/MySQL/Jakarta Validation/OWASP/JDK 공식 자료와 synthetic examples로 보강했습니다.", "실제 provider/database를 실행하지 않았으므로 generated ID timing, column DDL/constraints, time precision, proxy equality와 query effects는 disposable lab에서 검증해야 합니다."] },
});

export default session;
