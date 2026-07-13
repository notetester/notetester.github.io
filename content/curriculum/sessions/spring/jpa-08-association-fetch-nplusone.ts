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
      { lines: `1-${a}`, explanation: "JDK 21 record·collection으로 association, fetch plan, query count와 API projection 규칙을 framework 없이 명시합니다." },
      { lines: `${a + 1}-${b}`, explanation: "정상 경로뿐 아니라 orphan, N+1, 중복 row, pagination과 closed persistence context 경계를 결정적으로 계산합니다." },
      { lines: `${b + 1}-${lines}`, explanation: "synthetic 식별자와 구조 정보만 출력하며 실제 table, 사용자 값, DB 주소와 credential은 사용하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring·Hibernate·DB 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서의 예상 결과와 완전히 같아야 합니다.", "JDK 모형은 실제 SQL 생성, proxy 초기화, persistence context와 JDBC driver 동작을 대신하지 않습니다."] },
    experiments: [
      { change: "cardinality, ownership, page size, batch size 또는 serialization field를 하나씩 바꿉니다.", prediction: "명시한 invariant와 query budget에 따라 mapping 거부, query 수 변화 또는 DTO field 변화가 발생합니다.", result: "owner, delete decision, query count, unique roots와 public fields를 비교합니다." },
      { change: "같은 matrix를 synthetic rows를 가진 실제 JPA integration test로 옮깁니다.", prediction: "provider SQL, duplicate roots, lazy initialization과 pagination warning이 추가 evidence로 드러납니다.", result: "statement count, bind count, rows, page ids와 transaction/context lifetime을 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "provenance-gap-synthetic-association",
    title: "원본 GuestBook의 scalar entity와 synthetic association 모델을 분리합니다",
    lead: "연관관계 수업을 위해 원본에 없는 annotation과 domain을 이미 구현된 것처럼 쓰면 provenance와 실행 기대가 모두 어긋납니다.",
    explanations: [
      "read-only 감사에서 GuestBook은 @Entity와 scalar columns, 생성 ID, lifecycle callback, soft-delete method를 가지지만 @OneToOne, @OneToMany, @ManyToOne, @ManyToMany, @JoinColumn, mappedBy와 FetchType은 한 건도 없습니다.",
      "Repository는 scalar predicate와 JPQL 단건·목록 조회를 제공하고 controller는 entity/list를 응답 data에 담습니다. 따라서 현재 source만으로 N+1이 발생했다고 단정할 수 없고, 관계를 추가할 때 생길 risk를 synthetic Entry–Attachment 모델로 학습합니다.",
      "synthetic model은 source 변경안이 아니라 cardinality·ownership·fetch experiment입니다. 실제 적용 전에는 업무 invariant, FK nullability, unique constraint, 삭제 정책과 API shape를 별도 결정해야 합니다.",
      "provenance에는 exact relative path, line/byte count와 hash를 남기되 table/column literal, 요청 route, 사용자 데이터와 datasource 값을 본문이나 실행 예제에 복사하지 않습니다.",
      "이 구분을 유지하면 ‘원본에서 관찰한 사실’, ‘공식 명세가 보장하는 동작’, ‘Hibernate 구현 전략’, ‘교육용 설계 제안’을 각각 검증할 수 있습니다.",
    ],
    concepts: [
      c("provenance gap", "학습 주제가 원본 source에 실제로 존재하지 않는 차이입니다.", ["없는 relation을 명시합니다.", "synthetic model의 범위를 표시합니다."]),
      c("synthetic model", "특정 위험과 불변식을 재현하려고 만든 비실데이터 domain 모형입니다.", ["실제 schema라고 주장하지 않습니다.", "framework test로 다음 검증을 명시합니다."]),
      c("scalar entity", "다른 entity reference 없이 basic fields 중심으로 mapping된 entity입니다.", ["collection fetch risk가 자동으로 생기지 않습니다.", "API 노출 위험은 별개입니다."]),
    ],
    diagnostics: [d("N+1 개선 코드를 넣었지만 원본 entity에는 collection이나 to-one relation이 없습니다.", "source 관찰과 향후 설계 예제를 구분하지 않았습니다.", ["relation annotation count", "repository return graph", "controller response type", "generated SQL evidence"], "현재 원본에는 relation/N+1 증거가 없다고 기록하고 synthetic model과 실제 migration proposal을 분리합니다.", "source capability manifest와 각 문서 claim을 자동 대조합니다.")],
    expertNotes: ["N+1은 entity가 많다는 뜻이 아니라 한 use case가 graph navigation 때문에 반복 SQL을 발생시키는 관찰 결과입니다.", "원본 gap은 부족함을 숨길 이유가 아니라 실험 가정을 정확히 세울 기회입니다."],
  },
  {
    id: "cardinality-ownership-foreign-key",
    title: "업무 cardinality와 association owner를 FK·unique·nullability로 증명합니다",
    lead: "Java collection 모양만 보고 일대다를 선택하면 실제 FK 변경 책임과 데이터 무결성이 보이지 않습니다.",
    explanations: [
      "to-many의 일반적인 FK는 many side table에 있고, 그 FK를 mapping한 @ManyToOne side가 관계 변경의 owner입니다. inverse collection의 mappedBy는 owner field 이름을 가리킬 뿐 별도 FK를 만들지 않습니다.",
      "one-to-one은 단순 reference annotation이 아니라 FK에 unique constraint가 있어야 동시 insert까지 cardinality가 보장됩니다. optional=false와 DB NOT NULL도 함께 맞춰야 합니다.",
      "many-to-many join table은 편리하지만 관계 자체의 상태·순서·생성 시각·soft delete가 생기면 명시적 association entity로 승격해야 합니다.",
      "unidirectional one-to-many가 어떤 join table/FK SQL을 만드는지는 provider default에 맡기지 말고 migration과 mapping을 명시적으로 대조합니다.",
      "owner method 한 곳에서 양쪽 in-memory graph를 동기화하되 DB write 책임과 객체 편의 method를 혼동하지 않습니다.",
    ],
    concepts: [
      c("cardinality", "한 entity가 반대편 entity 몇 개와 연결될 수 있는지의 업무·schema 제약입니다.", ["min/max를 적습니다.", "unique/NOT NULL/FK로 검증합니다."]),
      c("association owner", "FK 또는 join table 변경을 persistence provider에 전달하는 mapping side입니다.", ["mappedBy 반대편입니다.", "객체 graph 편의 owner와 구분합니다."]),
      c("association entity", "관계 자체의 identity와 attributes를 표현하는 별도 entity입니다.", ["many-to-many 확장에 적합합니다.", "unique pair constraint를 둡니다."]),
    ],
    codeExamples: [java("jpa08-ownership", "cardinality와 FK owner 계약", "Jpa08Ownership.java", "synthetic Entry–Attachment 관계에서 owner, FK side와 삭제 설정을 출력합니다.", String.raw`public class Jpa08Ownership {
  record Mapping(String one, String many, String owner, String mappedBy,
                 boolean cascadeRemove, boolean orphanRemoval) {}
  public static void main(String[] args) {
    Mapping mapping = new Mapping("Entry", "Attachment", "Attachment.entryId", "entry",
        false, true);
    System.out.println("owner=" + mapping.owner());
    System.out.println("cardinality=ONE_TO_MANY");
    System.out.println("foreign-key-side=MANY");
    System.out.println("mapped-by=" + mapping.mappedBy());
    System.out.println("cascade-remove=" + mapping.cascadeRemove());
    System.out.println("orphan-delete=" + mapping.orphanRemoval());
  }
}`, "owner=Attachment.entryId\ncardinality=ONE_TO_MANY\nforeign-key-side=MANY\nmapped-by=entry\ncascade-remove=false\norphan-delete=true", ["local-guestbook-entity", "jakarta-persistence-spec", "jakarta-onetomany-api"])],
    diagnostics: [d("collection에는 child가 추가됐지만 commit 뒤 FK가 바뀌지 않습니다.", "inverse mappedBy side만 변경했거나 mappedBy가 owner field와 다릅니다.", ["owning field assignment", "mappedBy spelling", "flush SQL/binds", "FK catalog"], "aggregate method에서 owner reference와 inverse collection을 함께 갱신하고 flush SQL을 검증합니다.", "mapping metamodel과 bidirectional helper contract test를 둡니다.")],
    expertNotes: ["ORM owner는 domain ownership·authorization owner와 같은 단어지만 서로 다른 책임입니다.", "cardinality는 application pre-check만으로 보장하지 말고 database constraint를 최종 arbiter로 둡니다."],
  },
  {
    id: "bidirectional-invariants-identity",
    title: "양방향 graph helper와 entity identity를 collection invariant에 맞춥니다",
    lead: "양쪽 reference가 다른 상태면 같은 transaction 안에서도 검증, serialization과 orphan 판단이 서로 다른 graph를 봅니다.",
    explanations: [
      "addChild는 child.parent를 설정하고 parent.children에 추가하며, removeChild는 두 방향을 함께 해제합니다. public mutable collection setter로 이 invariant를 우회하지 않습니다.",
      "generated ID 기반 equals/hashCode를 persistent collection에 넣은 뒤 hash가 변하면 remove가 실패할 수 있습니다. immutable natural key가 없다면 entity equality 전략과 collection type을 명시적으로 시험합니다.",
      "List는 order가 업무 의미인지, 중복을 허용하는지, order column을 유지할지 결정해야 합니다. Set은 중복 의미와 stable hash를 요구합니다.",
      "helper는 association update만 담당하고 cascade persist/remove authorization까지 암묵적으로 결정하지 않습니다. aggregate boundary 밖 child 이동은 별도 use case로 둡니다.",
      "detached graph를 그대로 merge하면 stale collection 전체가 덮어쓰일 수 있으므로 command ID와 현재 managed graph를 다시 조회해 의도한 delta만 적용합니다.",
    ],
    concepts: [c("graph invariant", "in-memory 양방향 reference가 같은 관계 사실을 나타내는 조건입니다.", ["helper method로 유지합니다.", "flush 전 검사합니다."]), c("persistent identity", "database row와 entity instance를 장기간 식별하는 값입니다.", ["object reference와 다릅니다.", "hash stability를 검토합니다."])],
    diagnostics: [d("removeChild를 호출했는데 collection에서 남거나 반대 reference가 그대로입니다.", "한쪽만 수정했거나 mutable/generated fields가 hashCode에 들어갔습니다.", ["helper method path", "equals/hashCode fields", "collection implementation", "managed/detached state"], "양방향 helper를 단일 진입점으로 만들고 stable identity 전략으로 collection 동작을 재검증합니다.", "pre/post graph invariant와 persist round-trip test를 둡니다.")],
    expertNotes: ["Lombok 전체-field @Data는 association까지 toString/equals에 포함해 recursion과 lazy load를 유발할 수 있으므로 entity에 신중히 사용합니다.", "양방향 mapping은 navigation 요구가 실제로 양쪽에 있을 때만 비용을 감수합니다."],
  },
  {
    id: "cascade-orphan-delete-boundary",
    title: "cascade와 orphanRemoval을 생명주기 소유권·삭제 정책으로 제한합니다",
    lead: "cascade는 편의 옵션이 아니라 parent operation이 어떤 child state transition까지 전파되는지 정하는 위험한 계약입니다.",
    explanations: [
      "CascadeType.PERSIST/MERGE/REMOVE는 각 entity operation 전파를 뜻하며 DB ON DELETE와 동일하지 않습니다. ALL을 습관적으로 쓰지 않고 필요한 transition만 선택합니다.",
      "orphanRemoval=true는 owner collection/reference에서 빠진 private child를 삭제하는 aggregate semantics에 맞습니다. 여러 parent가 공유하거나 재사용되는 entity에는 맞지 않습니다.",
      "parent soft delete와 child physical delete를 섞으면 복구와 감사가 깨집니다. retention, legal hold, file/object cleanup과 outbox side effect를 별도 lifecycle로 설계합니다.",
      "bulk JPQL delete/update는 persistence context callbacks와 cascade를 우회할 수 있습니다. affected rows, stale context clear와 child cleanup을 별도 검증합니다.",
      "DB cascade를 쓰면 ORM이 이미 child를 delete하지 않도록 mapping/DDL을 조정하고, 실제 constraint action을 catalog에서 확인합니다.",
    ],
    concepts: [c("cascade", "entity lifecycle operation을 연결된 entity에 전파하는 mapping 규칙입니다.", ["operation별로 선택합니다.", "authorization을 대신하지 않습니다."]), c("orphan removal", "aggregate 관계에서 제거된 private child를 delete로 해석하는 규칙입니다.", ["shared child에는 금지합니다.", "reparenting을 시험합니다."])],
    codeExamples: [java("jpa08-orphan-policy", "cascade·orphan transition 결정표", "Jpa08OrphanPolicy.java", "unlink, parent delete, reassign과 shared child에 대한 삭제 결정을 분류합니다.", String.raw`public class Jpa08OrphanPolicy {
  static String decide(String action, boolean privateChild, boolean orphanRemoval) {
    if (action.equals("UNLINK") && privateChild && orphanRemoval) return "DELETE_CHILD";
    if (action.equals("DELETE_PARENT") && privateChild) return "DELETE_CHILDREN_FIRST";
    if (action.equals("REASSIGN") && privateChild) return "UPDATE_FK";
    if (action.equals("UNLINK") && !privateChild && orphanRemoval) return "REJECT_ORPHAN_REMOVAL";
    return "NO_DELETE";
  }
  public static void main(String[] args) {
    System.out.println("unlink=" + decide("UNLINK", true, true));
    System.out.println("delete-parent=" + decide("DELETE_PARENT", true, false));
    System.out.println("reassign=" + decide("REASSIGN", true, true));
    System.out.println("shared-child=" + decide("UNLINK", false, true));
    System.out.println("database-cascade-assumed=false");
  }
}`, "unlink=DELETE_CHILD\ndelete-parent=DELETE_CHILDREN_FIRST\nreassign=UPDATE_FK\nshared-child=REJECT_ORPHAN_REMOVAL\ndatabase-cascade-assumed=false", ["local-guestbook-entity", "jakarta-persistence-spec", "hibernate-user-guide"])],
    diagnostics: [d("parent 삭제 한 번이 공유 데이터나 예상 밖 row까지 지웁니다.", "aggregate ownership 확인 없이 REMOVE/ALL 또는 orphanRemoval을 적용했습니다.", ["relationship sharing", "cascade mapping", "DDL cascade", "delete SQL/order", "backup/audit requirements"], "cascade를 최소 operation으로 줄이고 shared entity 삭제를 별도 authorized use case로 분리합니다.", "삭제 graph snapshot과 affected-row upper bound gate를 둡니다.")],
    expertNotes: ["orphanRemoval은 garbage collector가 아니라 명시적 domain lifecycle 정책입니다.", "large collection cascade delete는 긴 transaction·lock·redo를 만들므로 chunk/outbox/archive 설계가 필요할 수 있습니다."],
  },
  {
    id: "fetch-default-context-lifetime",
    title: "FetchType은 보장과 힌트를 구분하고 persistence context 안에서만 graph를 완성합니다",
    lead: "EAGER를 붙이면 N+1이 사라지고 LAZY를 붙이면 항상 proxy라는 단순 규칙은 명세와 실제 query plan을 모두 놓칩니다.",
    explanations: [
      "Jakarta Persistence의 to-one 기본은 EAGER, to-many 기본은 LAZY지만 EAGER는 반드시 이용 가능해야 한다는 요구이고 SQL 한 번을 보장하지 않습니다. LAZY는 provider가 지연할 수 있다는 hint입니다.",
      "transaction/persistence context가 닫힌 뒤 초기화되지 않은 association을 접근하면 사용할 수 없습니다. view나 serializer가 우연히 초기화하도록 context lifetime을 늘리지 않습니다.",
      "use case가 필요한 graph를 repository query, entity graph 또는 projection으로 transaction 안에서 명시하고 application DTO로 변환합니다.",
      "proxy class, bytecode enhancement와 field access는 provider/version 설정에 따라 달라질 수 있으므로 proxy 타입을 domain contract나 JSON schema로 노출하지 않습니다.",
      "fetch plan acceptance는 association loaded 여부만이 아니라 statement count, rows, duplicate roots, selected columns와 heap size를 함께 봅니다.",
    ],
    concepts: [c("fetch plan", "한 use case에서 어떤 root·association·columns를 어떤 query들로 가져올지 정한 계획입니다.", ["mapping default와 분리합니다.", "query budget을 둡니다."]), c("persistence context lifetime", "managed entity와 lazy loading이 유효한 작업 범위입니다.", ["transaction boundary와 대조합니다.", "web rendering까지 연장하지 않습니다."])],
    diagnostics: [d("LAZY로 바꿨더니 응답 생성 중 초기화 예외가 납니다.", "필요 graph를 transaction 안에서 materialize/DTO mapping하지 않고 serializer가 entity를 탐색합니다.", ["transaction end", "loaded attributes", "DTO mapping location", "serializer path", "OSIV setting"], "use-case query로 필요한 graph만 조회하고 transaction 안에서 DTO를 만든 뒤 entity serialization을 중단합니다.", "OSIV-off integration test와 query-count assertion을 둡니다.")],
    expertNotes: ["fetch type은 API 응답 설계가 아닙니다.", "모든 relation EAGER는 correctness shortcut이 아니라 workload와 무관한 global fetch policy입니다."],
  },
  {
    id: "nplusone-detection-budget",
    title: "N+1을 query identity·count·rows와 use-case budget으로 재현합니다",
    lead: "개발 데이터 두 건에서는 빠르더라도 root 수에 비례해 association query가 늘면 production latency와 DB load가 선형 폭증합니다.",
    explanations: [
      "root list query 한 번 뒤 각 root의 lazy association을 순회하며 같은 shape의 select가 N번 실행되면 1+N입니다. to-one EAGER도 JPQL root query 방식에 따라 secondary selects를 만들 수 있습니다.",
      "SQL text 전체와 bind 값을 무제한 log하지 않고 normalized query identity, count, duration, rows와 transaction/use-case correlation을 수집합니다. 민감 values는 기록하지 않습니다.",
      "테스트 fixture는 association 0, 1, 여러 개와 root 1, page size 이상을 포함해야 합니다. warm cache를 비우고 persistence context를 clear해 accidental first-level cache를 제거합니다.",
      "budget은 ‘query 1개’만 강제하지 않습니다. root+count+bounded batch처럼 의도한 plan을 명시하고 row explosion, heap과 latency도 상한으로 둡니다.",
      "production sampling은 endpoint/operation과 query fingerprint cardinality를 제한하며 release 전 old/new plan 차이를 비교합니다.",
    ],
    concepts: [c("N+1", "root 조회 뒤 각 root마다 같은 association query가 반복되는 query amplification입니다.", ["root N에 대한 증가를 측정합니다.", "cache를 통제합니다."]), c("query budget", "use case가 허용하는 statement·rows·duration·payload 상한입니다.", ["fixture 규모를 명시합니다.", "회귀 gate로 사용합니다."])],
    codeExamples: [java("jpa08-query-budget", "N+1·fetch join·batch query 수", "Jpa08QueryBudget.java", "root 수와 batch size에 따른 statement 수를 계산해 N+1 증폭을 눈에 보이게 합니다.", String.raw`public class Jpa08QueryBudget {
  static int lazyQueries(int roots) { return 1 + roots; }
  static int fetchJoinQueries() { return 1; }
  static int batchQueries(int roots, int batchSize) {
    return 1 + (roots + batchSize - 1) / batchSize;
  }
  public static void main(String[] args) {
    int roots = 5;
    System.out.println("roots=" + roots);
    System.out.println("lazy-queries=" + lazyQueries(roots));
    System.out.println("fetch-join-queries=" + fetchJoinQueries());
    System.out.println("batch-size=2");
    System.out.println("batch-queries=" + batchQueries(roots, 2));
    System.out.println("lazy-budget-pass=" + (lazyQueries(roots) <= 3));
  }
}`, "roots=5\nlazy-queries=6\nfetch-join-queries=1\nbatch-size=2\nbatch-queries=4\nlazy-budget-pass=false", ["local-guestbook-repository", "local-guestbook-controller", "hibernate-user-guide", "spring-data-query-methods"])],
    diagnostics: [d("목록 크기가 커질수록 같은 query fingerprint count가 함께 증가합니다.", "loop/serializer가 각 root의 지연 association을 개별 초기화합니다.", ["root count", "query fingerprint/count", "call stack", "persistence context cache", "rows and duration"], "use-case fetch plan을 projection/entity graph/fetch join/batch 중 적합한 방식으로 명시합니다.", "root size별 query-count slope test와 telemetry budget을 둡니다.")],
    expertNotes: ["N+1을 SQL 로그 눈대중으로만 찾지 말고 statement inspector 또는 datasource proxy의 deterministic counter로 검사합니다.", "query 수가 줄어도 join rows가 폭증하면 더 나쁜 plan일 수 있습니다."],
  },
  {
    id: "fetch-join-entity-graph-projection",
    title: "fetch join·EntityGraph·projection을 결과 shape와 재사용성에 맞게 선택합니다",
    lead: "모든 association을 한 거대한 fetch join에 넣으면 query 수는 줄어도 Cartesian row, 중복 root와 메모리 사용이 커집니다.",
    explanations: [
      "fetch join은 특정 JPQL query에서 association을 함께 초기화합니다. collection 여러 개를 동시에 join하거나 깊은 graph를 가져오면 row 곱셈과 provider 제약을 확인해야 합니다.",
      "EntityGraph는 find/query의 attribute graph를 선언적으로 바꾸고 repository method별 fetch plan을 재사용할 수 있습니다. fetchgraph/loadgraph semantics와 provider 추가 fetch 가능성을 구분합니다.",
      "closed projection은 화면/API가 필요한 scalar만 가져와 entity graph와 dirty checking을 피할 수 있습니다. nested/open projection이 다시 association traversal을 만들지 SQL로 검증합니다.",
      "distinct는 JPQL root 중복 제거와 SQL DISTINCT/row 비용이 다를 수 있습니다. Java Set으로 결과만 숨기기 전에 SQL rows와 pagination count를 확인합니다.",
      "한 endpoint에 summary와 detail fetch plan을 분리하고 이름·query identity·expected statements를 계약으로 versioning합니다.",
    ],
    concepts: [c("fetch join", "query 결과 root를 반환하면서 지정 association을 함께 fetch하는 JPQL join입니다.", ["row multiplication을 측정합니다.", "pagination을 별도 검토합니다."]), c("entity graph", "operation별로 fetch할 attribute path를 지정하는 표준 graph template입니다.", ["mapping default를 override/augment합니다.", "named/dynamic 형태가 있습니다."]), c("projection", "use case가 필요한 field shape로 직접 조회하는 결과 계약입니다.", ["API DTO와 연결합니다.", "entity mutation용이 아닙니다."])],
    diagnostics: [d("query는 한 번인데 반환 row와 heap이 root×children으로 폭증합니다.", "여러 to-many를 한 fetch join에 묶거나 필요 없는 graph를 가져왔습니다.", ["join cardinalities", "SQL rows", "unique root ids", "selected columns", "heap/serialization size"], "summary projection, split query, bounded graph 또는 batch fetch로 use case를 분리합니다.", "representative cardinality fixture와 row/heap budget을 둡니다.")],
    expertNotes: ["fetch plan은 repository 전역 annotation보다 use-case별 named contract가 review하기 쉽습니다.", "entity graph는 query 수 1을 보장하는 API가 아니라 load semantics를 전달하는 API입니다."],
  },
  {
    id: "pagination-two-phase-fetch",
    title: "to-many fetch와 pagination을 ID page→bounded graph의 두 단계로 분리합니다",
    lead: "collection fetch join 결과 row에 offset/limit를 적용하면 root page가 잘리거나 provider가 memory pagination으로 후퇴할 수 있습니다.",
    explanations: [
      "page의 단위가 root entity라면 먼저 stable order와 unique tie-breaker로 root IDs를 조회하고, 두 번째 query에서 그 IDs의 graph를 가져옵니다.",
      "두 번째 IN query는 결과 order를 보존하지 않을 수 있으므로 ID→position map으로 다시 정렬합니다. count query는 collection join을 제거하고 동일 filter semantics만 유지합니다.",
      "keyset pagination은 large offset 비용과 concurrent insert drift를 줄이지만 sort columns와 ID tie-breaker, forward/back cursor 계약을 요구합니다.",
      "fetch join row를 root distinct로 바꿀 때 page size, total elements와 duplicate roots를 각각 검증합니다. warning을 숨기거나 fail-on-pagination 설정을 끄지 않습니다.",
      "page 크기와 child cardinality upper bound를 곱해 두 번째 query rows와 API payload budget을 계산합니다.",
    ],
    concepts: [c("two-phase fetch", "root page 식별자와 해당 page graph 조회를 분리하는 전략입니다.", ["stable order를 복원합니다.", "두 query 사이 consistency를 정의합니다."]), c("keyset pagination", "마지막 sort key 이후를 조건으로 다음 page를 찾는 방식입니다.", ["unique tie-breaker가 필요합니다.", "임의 page jump와 trade-off가 있습니다."])],
    codeExamples: [java("jpa08-two-phase-page", "join row 중복과 ID page 복원", "Jpa08TwoPhasePage.java", "synthetic join rows에서 unique root page를 만들고 두 번째 graph 결과를 원래 ID 순서로 복원합니다.", String.raw`import java.util.*;

public class Jpa08TwoPhasePage {
  record Row(long rootId, String child) {}
  public static void main(String[] args) {
    List<Row> joined = List.of(new Row(11, "a"), new Row(11, "b"),
        new Row(12, "c"), new Row(13, "d"));
    List<Long> pageIds = List.of(11L, 12L);
    Map<Long, Long> rows = new TreeMap<>();
    joined.stream().filter(r -> pageIds.contains(r.rootId()))
        .forEach(r -> rows.merge(r.rootId(), 1L, Long::sum));
    System.out.println("join-rows=" + joined.size());
    System.out.println("page-ids=" + pageIds);
    System.out.println("unique-page-roots=" + rows.size());
    System.out.println("children-per-root=" + rows);
    System.out.println("order-restored=" + rows.keySet().stream().toList().equals(pageIds));
    System.out.println("queries=2");
  }
}`, "join-rows=4\npage-ids=[11, 12]\nunique-page-roots=2\nchildren-per-root={11=2, 12=1}\norder-restored=true\nqueries=2", ["hibernate-user-guide", "spring-data-query-methods", "spring-data-entitygraph", "spring-data-projections", "java-collection-api"])],
    diagnostics: [d("page size는 20인데 root가 7개만 보이거나 memory pagination warning이 납니다.", "to-many join rows에 pagination을 직접 적용했습니다.", ["generated SQL limit", "provider warning", "join row/root counts", "count query", "sort uniqueness"], "stable root ID page와 bounded graph query를 분리하고 order를 복원합니다.", "duplicate-child fixture와 page boundary regression test를 둡니다.")],
    expertNotes: ["두 query 사이 consistency가 중요하면 transaction isolation과 snapshot 요구를 함께 정의합니다.", "count가 비싸면 정확 total이 정말 필요한지 product contract부터 검토합니다."],
  },
  {
    id: "batch-fetch-cache-tradeoffs",
    title: "batch fetch를 bounded secondary-query 전략으로 사용하고 cache 착시를 제거합니다",
    lead: "batch size를 크게 올리면 N+1이 줄어 보여도 IN list, parameter limit, unused loads와 heap이 커질 수 있습니다.",
    explanations: [
      "batch fetch는 초기화할 proxies/collections의 IDs를 묶어 secondary selects 수를 줄입니다. root query 한 번과 ceil(N/batch) 근사만 믿지 말고 provider batch style과 actual statements를 봅니다.",
      "global default batch size와 association-specific size는 workload가 다릅니다. page size, expected access ratio, DB parameter limit와 plan cache를 기준으로 조정합니다.",
      "subselect fetch는 같은 original result의 collections를 묶을 수 있지만 persistence context 범위와 query shape에 결합됩니다. pagination/large result에서 rows를 측정합니다.",
      "first/second-level cache hit가 test query 수를 감추지 않도록 cold/warm 시나리오를 분리합니다. cache는 stale data와 invalidation 비용을 동반합니다.",
      "query count, rows, bind count, duration p95와 heap을 old/new fetch plan에서 함께 비교하고 regression threshold를 version-controlled manifest로 남깁니다.",
    ],
    concepts: [c("batch fetch", "여러 lazy proxies/collections의 키를 모아 bounded secondary query로 초기화하는 provider 전략입니다.", ["batch size를 측정합니다.", "fetch join과 다릅니다."]), c("cache warmness", "동일 entity/query가 persistence/cache 계층에 이미 존재하는 실험 조건입니다.", ["cold/warm을 분리합니다.", "correctness를 cache에 의존하지 않습니다."])],
    diagnostics: [d("query 수는 줄었지만 bind 수와 DB CPU, heap이 증가했습니다.", "batch size가 page/access ratio보다 크거나 필요 없는 association까지 초기화합니다.", ["batch size", "IN binds", "access ratio", "rows/heap", "cold versus warm"], "association별 bounded batch를 조정하거나 projection/split fetch로 필요한 graph만 조회합니다.", "representative cardinality의 query·bind·heap multi-budget benchmark를 둡니다.")],
    expertNotes: ["batch fetch는 mapping 오류를 숨기는 마법이 아니라 선택 가능한 query plan입니다.", "second-level cache를 켜기 전 invalidation, tenant isolation과 memory ownership을 먼저 설계합니다."],
  },
  {
    id: "osiv-serialization-release",
    title: "OSIV를 끄고 entity graph 대신 transaction 안에서 만든 DTO를 직렬화합니다",
    lead: "web response serialization까지 EntityManager를 열어 두면 controller 이후에도 숨은 SQL이 실행되어 transaction과 query ownership이 흐려집니다.",
    explanations: [
      "Spring Boot web application은 기본 OSIV 동작을 제공할 수 있으므로 설정을 명시적으로 확인합니다. OSIV를 끈 test에서 필요한 graph가 service transaction 안에 완성되는지 검증합니다.",
      "entity를 직접 JSON으로 내보내면 bidirectional cycle, lazy proxy internals, hidden SQL, sensitive/basic fields와 unbounded collection이 API에 스며듭니다. annotation으로 cycle만 가리는 것은 query/API contract를 완성하지 않습니다.",
      "application DTO는 endpoint별 fields, nullability, ordering, child count/page link를 명시하고 transaction 안에서 projection/mapping합니다. serializer는 persistence layer를 호출하지 않습니다.",
      "summary/detail endpoint에 statement/row/payload budget을 두고, persistence context close 뒤 DTO serialization이 동일한 결과인지 검사합니다.",
      "release evidence에는 source gap, mapping/DDL diff, query plans, OSIV setting, lazy failure tests, API schema와 rollback plan을 함께 남깁니다.",
    ],
    concepts: [c("OSIV", "web request 동안 EntityManager를 열어 view/serializer의 lazy loading을 허용하는 pattern입니다.", ["transaction과 동일하지 않습니다.", "숨은 query ownership을 검토합니다."]), c("API projection DTO", "persistence graph와 분리된 public response schema입니다.", ["필요 fields만 노출합니다.", "context close 뒤 직렬화합니다."])],
    codeExamples: [java("jpa08-api-boundary", "closed context와 DTO 직렬화 경계", "Jpa08ApiBoundary.java", "entity serialization을 거부하고 transaction 안에서 만든 summary DTO만 공개하는 정책을 실행합니다.", String.raw`import java.util.*;

public class Jpa08ApiBoundary {
  record Summary(long id, String title, int attachmentCount) {}
  public static void main(String[] args) {
    Summary dto = new Summary(7L, "synthetic", 2);
    List<String> fields = List.of("id", "title", "attachmentCount");
    System.out.println("entity-json=REJECT");
    System.out.println("lazy-after-close=UNAVAILABLE");
    System.out.println("dto-fields=" + fields);
    System.out.println("dto-count=" + dto.attachmentCount());
    System.out.println("back-reference=false");
    System.out.println("osiv-required=false");
    System.out.println("query-budget=2");
  }
}`, "entity-json=REJECT\nlazy-after-close=UNAVAILABLE\ndto-fields=[id, title, attachmentCount]\ndto-count=2\nback-reference=false\nosiv-required=false\nquery-budget=2", ["local-guestbook-controller", "boot-sql-databases", "spring-oemiv-filter", "jackson-annotations"] )],
    diagnostics: [d("controller는 끝났는데 JSON 변환 중 SQL이 실행되거나 순환 참조 오류가 납니다.", "entity를 직접 반환하고 OSIV/serializer가 association graph를 탐색합니다.", ["response type", "OSIV setting", "SQL call stack", "bidirectional references", "public fields/payload"], "transaction 안에서 bounded DTO를 만들고 OSIV-off 상태에서 serializer가 DB에 접근하지 못하게 합니다.", "entity response 금지 architecture test와 serialization query-count 0 gate를 둡니다.")],
    expertNotes: ["Jackson cycle annotation은 aggregate/API/fetch 설계를 대신하지 않습니다.", "OSIV를 끄는 것만으로 완성되지 않으며 각 use case의 explicit fetch plan과 DTO mapping이 필요합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-entity", repository: "2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/entity/GuestBook.java", usedFor: ["scalar entity provenance and absence of association mappings"], evidence: "Read-only sanitized audit: 61 lines, 1,495 bytes, SHA-256 BA0B75DD8DEA41B4A0DFD6F86D3F357ED9AADEF9B2EB336C00BD78B795F10ACF." },
  { id: "local-guestbook-repository", repository: "2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/repository/GuestBookRepository.java", usedFor: ["scalar derived/JPQL query provenance and absence of fetch plans"], evidence: "Read-only sanitized audit: 30 lines, 1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900." },
  { id: "local-guestbook-controller", repository: "2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/controller/GeustBookController.java", usedFor: ["entity/list response wrapping provenance and serialization boundary"], evidence: "Read-only sanitized audit: 103 lines, 3,884 bytes, SHA-256 3C5E5BD6333256AA156EBC61C80E562D6ECC17A18A1261678A85D7FC79C0758E." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "3.2 specification", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["association ownership, cardinality, fetch semantics, entity graphs and lifecycle"], evidence: "Jakarta Persistence 3.2 공식 specification의 relationship mapping과 entity graph 규칙을 기준으로 사용했습니다." },
  { id: "jakarta-onetomany-api", repository: "Jakarta Persistence API", path: "OneToMany", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/onetomany", usedFor: ["mappedBy, cascade, fetch and orphanRemoval members"], evidence: "Jakarta Persistence 3.2 공식 OneToMany API 문서입니다." },
  { id: "hibernate-user-guide", repository: "Hibernate ORM", path: "current user guide", publicUrl: "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html", usedFor: ["association implementation, fetching, batch, join and pagination behavior"], evidence: "Hibernate ORM 공식 current user guide를 provider-specific 검증 경계로 사용했습니다." },
  { id: "spring-data-query-methods", repository: "Spring Data JPA", path: "JPA Query Methods", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html", usedFor: ["JPQL, entity graph and repository query contracts"], evidence: "Spring Data JPA 공식 query-method reference입니다." },
  { id: "spring-data-entitygraph", repository: "Spring Data JPA API", path: "EntityGraph", publicUrl: "https://docs.spring.io/spring-data/data-jpa/docs/current/api/org/springframework/data/jpa/repository/EntityGraph.html", usedFor: ["repository method entity graph annotation"], evidence: "Spring Data JPA 공식 current API 문서입니다." },
  { id: "spring-data-projections", repository: "Spring Data Commons", path: "Projections", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html", usedFor: ["closed and nested repository projections"], evidence: "Spring Data 공식 projection reference입니다." },
  { id: "boot-sql-databases", repository: "Spring Boot", path: "SQL Databases", publicUrl: "https://docs.spring.io/spring-boot/reference/data/sql.html", usedFor: ["JPA configuration and Open EntityManager in View default"], evidence: "Spring Boot 공식 SQL database reference의 OSIV 설명을 확인했습니다." },
  { id: "spring-oemiv-filter", repository: "Spring Framework API", path: "OpenEntityManagerInViewFilter", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/support/OpenEntityManagerInViewFilter.html", usedFor: ["request-scoped EntityManager lifecycle and lazy loading boundary"], evidence: "Spring Framework 공식 current API 문서입니다." },
  { id: "jackson-annotations", repository: "FasterXML", path: "jackson-annotations", publicUrl: "https://github.com/FasterXML/jackson-annotations", usedFor: ["serialization annotation scope and API-boundary caveat"], evidence: "FasterXML 공식 annotation project documentation입니다." },
  { id: "java-collection-api", repository: "Java SE 21 API", path: "Collection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collection.html", usedFor: ["collection equality, ordering and executable graph models"], evidence: "Oracle Java SE 21 공식 Collection API입니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-08-association-fetch-nplusone", slug: "jpa-08-association-fetch-nplusone", courseId: "spring", moduleId: "spring-data-jpa", order: 8,
  title: "연관관계·fetch 전략과 N+1", subtitle: "원본에 없는 관계 mapping을 synthetic model로 분리하고 ownership·cascade·fetch plan·query budget·pagination·OSIV/API 경계를 운영 evidence로 완성합니다.", level: "고급", estimatedMinutes: 110,
  coreQuestion: "원본 scalar GuestBook에서 출발해 association을 추가할 때 FK owner와 생명주기를 어떻게 보장하고, N+1과 row explosion 없이 use-case graph를 transaction 안에서 가져올까요?",
  summary: "GuestBook entity, repository와 controller를 read-only·sanitized 방식으로 직접 감사했습니다. 원본에는 association annotation, mappedBy, cascade, orphanRemoval, FetchType, EntityGraph와 fetch join이 없으므로 현재 N+1이 존재한다고 과장하지 않습니다. 대신 synthetic Entry–Attachment 모델로 cardinality·owner/FK·bidirectional invariant·cascade/orphan, fetch defaults/context lifetime, N+1 query slope, fetch join/entity graph/projection, to-many pagination, batch/cold-cache와 OSIV-off DTO serialization을 전문가 수준으로 연결합니다. 다섯 JDK 21 예제는 mapping contract, delete decision, query amplification, two-phase page와 closed-context API boundary를 정확한 stdout으로 실행합니다.",
  objectives: ["원본 scalar entity와 synthetic association model을 구분한다.", "cardinality와 owner를 FK·unique·nullability로 증명한다.", "양방향 helper와 entity identity invariant를 유지한다.", "cascade/orphanRemoval을 aggregate lifecycle에만 적용한다.", "fetch default와 persistence context lifetime을 구분한다.", "N+1을 statement/row slope와 query budget으로 탐지한다.", "fetch join·EntityGraph·projection을 use case에 맞게 선택한다.", "to-many pagination을 stable ID page와 graph query로 분리한다.", "batch/cache trade-off를 query·bind·heap evidence로 검증한다.", "OSIV 없이 transaction 안에서 DTO를 완성한다."],
  prerequisites: [{ title: "엔티티 노출을 피하는 DTO 응답과 오류 처리", reason: "entity/DTO serialization 경계, bounded pagination과 HTTP 오류 계약을 알아야 association fetch plan과 OSIV-off 응답 graph를 안전하게 설계할 수 있습니다.", sessionSlug: "jpa-07-dto-controller-error" }],
  keywords: ["association", "cardinality", "mappedBy", "cascade", "orphanRemoval", "fetch", "N+1", "entity graph", "fetch join", "pagination", "batch fetch", "OSIV", "serialization", "DTO"],
  topics,
  lab: {
    title: "scalar GuestBook에서 query-budgeted synthetic association으로 안전하게 확장하기",
    scenario: "원본에는 관계가 없지만 summary/detail 요구를 위해 private attachment association을 검토합니다. 실제 이름·데이터·설정을 복사하지 않고 migration/mapping/fetch/API 계약과 반례를 작성합니다.",
    setup: ["원본 세 파일은 read-only로 보존하고 hash와 relation annotation 0건을 기록합니다.", "synthetic parent/child rows를 0·1·many cardinality와 duplicate page boundary로 준비합니다.", "statement counter, persistence context clear, OSIV-off test profile과 DTO serializer를 준비합니다.", "실제 table/column/route/domain/credential/user values는 fixture와 문서에 사용하지 않습니다."],
    steps: ["cardinality, owner, FK, unique, nullability와 delete/reparent 정책을 decision table로 만듭니다.", "mapping과 migration을 작성하고 catalog constraints를 대조합니다.", "bidirectional helper의 add/remove/reassign invariant와 equals/hash behavior를 검증합니다.", "cascade/orphan/soft-delete/bulk-delete transition matrix를 실행합니다.", "summary/detail use case별 fetch plan과 query/row/payload budget을 선언합니다.", "root size 1·5·page+1에서 lazy traversal의 N+1 slope를 재현합니다.", "projection, entity graph, fetch join과 batch를 같은 fixture에서 비교합니다.", "to-many page를 stable ID query와 ordered graph query로 분리합니다.", "persistence context/cache cold/warm을 나눠 statement·bind·rows·heap을 기록합니다.", "OSIV를 끄고 transaction 안에서 DTO를 만든 뒤 closed-context serialization query 0을 확인합니다.", "cycles, lazy failure, duplicate roots, oversized child와 delete faults를 검사합니다.", "source gap, mapping/DDL/API/query evidence와 rollback plan을 제출합니다."],
    expectedResult: ["원본과 synthetic relation claim이 혼동 없이 구분됩니다.", "FK/unique/nullability와 owner graph가 같은 cardinality를 보장합니다.", "summary/detail/page가 명시한 query·row·payload budget을 지킵니다.", "cascade/orphan이 shared data를 삭제하지 않고 reparent/soft-delete 정책과 맞습니다.", "OSIV-off closed context에서 DTO가 추가 SQL과 cycle 없이 직렬화됩니다."],
    cleanup: ["synthetic schema/data/query counters와 caches를 제거합니다.", "EntityManager, executors와 datasource를 닫고 open connection/thread가 0인지 확인합니다.", "OSIV/profile/provider settings를 복원하고 generated SQL artifacts를 삭제합니다.", "원본 source와 실제 datasource configuration은 변경하지 않습니다."],
    extensions: ["association entity와 temporal history를 설계합니다.", "keyset cursor와 snapshot consistency를 구현합니다.", "multiple collection graph의 split-query planner를 비교합니다.", "production query fingerprint canary와 regression dashboard를 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java 예제를 실행하고 각 stdout을 JPA integration evidence로 바꾸세요.", requirements: ["exact output을 확인합니다.", "owner와 FK side를 설명합니다.", "cascade/orphan 결정을 설명합니다.", "root 증가에 따른 query slope를 계산합니다.", "two-phase page order를 확인합니다.", "entity JSON 거부와 DTO boundary를 설명합니다."], hints: ["JDK 모형은 mapping/SQL을 실행하지 않으므로 실제 provider test에서 확인할 항목을 적으세요."], expectedOutcome: "association과 fetch를 annotation 암기가 아니라 schema·query·context·API 불변식으로 설명합니다.", solutionOutline: ["provenance→mapping→lifecycle→fetch→page→serialize 순서입니다."] },
    { difficulty: "응용", prompt: "원본 보존 상태에서 synthetic one-to-many summary/detail 기능을 설계하세요.", requirements: ["원본 relation 0건을 명시합니다.", "FK/owner/migration을 둡니다.", "helper/cascade/orphan을 시험합니다.", "summary/detail fetch plan을 분리합니다.", "N+1/query/row budget을 둡니다.", "two-phase pagination을 적용합니다.", "OSIV-off DTO를 사용합니다."], hints: ["한 query로 만들기보다 workload별 bounded plan을 선택하세요."], expectedOutcome: "cardinality와 API 결과가 안전하고 성능 회귀가 검출되는 relation 설계가 완성됩니다.", solutionOutline: ["model→constraint→transition→query→measure→publish 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 JPA association/fetch governance를 작성하세요.", requirements: ["provenance와 schema ownership을 둡니다.", "cascade/orphan 승인 기준을 둡니다.", "fetch-plan naming/versioning을 둡니다.", "query/row/bind/heap budgets를 둡니다.", "pagination/cache/OSIV 정책을 둡니다.", "DTO/serialization 보안과 release evidence를 둡니다."], hints: ["provider hint와 Jakarta 보장을 분리하고 실제 SQL evidence를 요구하세요."], expectedOutcome: "새 relation마다 correctness·performance·API 위험이 같은 기준으로 review됩니다.", solutionOutline: ["classify→constrain→fetch→measure→isolate→govern 순서입니다."] },
  ],
  nextSessions: ["jpa-09-lock-version-concurrency"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["GuestBook.java는 61 lines/1,495 bytes, SHA-256 BA0B75DD8DEA41B4A0DFD6F86D3F357ED9AADEF9B2EB336C00BD78B795F10ACF입니다.", "GuestBookRepository.java는 30 lines/1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900입니다.", "GeustBookController.java는 103 lines/3,884 bytes, SHA-256 3C5E5BD6333256AA156EBC61C80E562D6ECC17A18A1261678A85D7FC79C0758E입니다.", "read-only search에서 관계 annotation, JoinColumn, mappedBy, cascade, orphanRemoval, FetchType, EntityGraph와 fetch join은 모두 0건이므로 association과 N+1은 synthetic extension으로만 다뤘습니다.", "원본 table/column/query/route/message와 사용자·datasource literal은 복사하지 않고 scalar entity→repository→response 구조만 provenance로 사용했습니다.", "JDK examples는 실제 JPA metamodel, Hibernate SQL/proxy, database constraints, persistence context와 serializer behavior를 대체하지 않습니다."] },
});

export default session;
