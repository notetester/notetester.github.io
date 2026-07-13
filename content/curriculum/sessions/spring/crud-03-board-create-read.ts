import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "JDK 21 records·maps·atomic primitives로 create command, repository-generated identity, detail result와 HTTP-like response를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "validation, insert/key assignment, transaction-like publication, not-found/soft-delete, concurrent key와 idempotent replay를 실제 경로로 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "raw content/password 대신 status, Location, id presence, call counts, stable error와 visibility/event evidence만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/JPA/MyBatis/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "in-memory store/HTTP model은 actual Spring MVC response building, transaction proxy, generated-key driver/JPA provider와 DB concurrency를 대체하지 않습니다."] },
    experiments: [
      { change: "blank/duplicate/missing/deleted input, concurrent key allocation과 replay payload를 바꿉니다.", prediction: "create/read contract가 명확하면 insert count, generated id, status/Location, 404와 conflict가 deterministic하게 분리됩니다.", result: "insert/read calls, ids, response, visibility와 committed state를 비교합니다." },
      { change: "동일 corpus를 MockMvc/HTTP→service transaction→MyBatis/JPA→supported database로 실행합니다.", prediction: "binding, generated-key timing, isolation/constraint, commit과 response resolver evidence가 추가됩니다.", result: "wire status/headers/body, SQL binds/row counts/keys, transaction outcome와 DB readback을 연결합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "resource-create-read-lifecycle",
    title: "등록과 상세 조회를 하나의 resource lifecycle과 두 개의 HTTP 계약으로 봅니다",
    lead: "POST 성공과 GET 상세는 연결되지만 create command, 저장 identity, public representation과 read visibility는 각각 다른 책임을 가집니다.",
    explanations: [
      "create 흐름은 POST representation→binding/validation→CreateBoard command→service transaction→repository insert/generated identity→commit→201 response 또는 PRG redirect입니다. read 흐름은 GET /boards/{id}→typed id→authorization/visibility query→detail projection→200 또는 404입니다.",
      "등록 성공은 mapper가 호출됐다는 사실이 아니라 expected row 1, 실제 generated identity, transaction commit과 후속 readback/representation이 일치함을 뜻합니다. commit 전 만든 success response를 먼저 전송하지 않습니다.",
      "상세 조회는 어떤 row든 select한 뒤 controller가 숨기는 방식보다 repository query 자체에 active/tenant/authorization scope를 반영하고 service가 absent를 명시적으로 처리합니다. 관리자/삭제 조회는 별도 capability로 분리합니다.",
      "원본 controller/service/mapper XML의 등록→redirect와 hit update→detail select를 read-only로 추적했습니다. maintained flow는 exact route/method/package를 복제하지 않고 create/read structure와 발견된 key/visibility/side-effect 문제를 교정합니다.",
      "HTML/JSP와 JSON API는 같은 service result를 사용해도 성공 representation이 다릅니다. page form은 PRG와 flash/form errors, REST는 201/Location/body/problem response를 사용하되 domain/persistence code를 중복하지 않습니다.",
    ],
    concepts: [
      c("resource lifecycle", "새 resource가 입력에서 identity를 얻어 저장·공개되고 이후 visibility policy로 조회되는 일련의 상태입니다.", ["create/read를 연결합니다.", "delete/update로 확장됩니다."]),
      c("create contract", "유효 입력, 생성 identity, atomic side effects와 성공/error HTTP representation을 정의한 계약입니다.", ["POST semantics를 가집니다.", "commit 후 성공합니다."]),
      c("detail contract", "resource key와 actor를 받아 visible resource representation 또는 명시적 absence/error를 반환하는 조회 계약입니다.", ["404 policy가 있습니다.", "soft-delete를 포함합니다."]),
    ],
    codeExamples: [java("crud03-create-read", "repository-generated ID로 등록 후 상세 조회", "Crud03CreateRead.java", "in-memory repository가 ID를 생성해 immutable detail을 저장하고 같은 ID로 즉시 조회하는 create→read lifecycle을 실행합니다.", String.raw`import java.util.*;

public class Crud03CreateRead {
  record CreateCommand(String writer, String title) {}
  record Board(long id, String writer, String title) {}
  static final class Repository {
    private long sequence = 100;
    private final Map<Long, Board> rows = new LinkedHashMap<>();
    Board insert(CreateCommand command) {
      long id = ++sequence;
      Board board = new Board(id, command.writer(), command.title());
      rows.put(id, board);
      return board;
    }
    Optional<Board> findVisible(long id) { return Optional.ofNullable(rows.get(id)); }
    int size() { return rows.size(); }
  }
  public static void main(String[] args) {
    Repository repository = new Repository();
    Board created = repository.insert(new CreateCommand("learner", "create-read"));
    Board found = repository.findVisible(created.id()).orElseThrow();
    System.out.println("created=" + created);
    System.out.println("found=" + found);
    System.out.println("same-id=" + (created.id()==found.id()));
    System.out.println("rows=" + repository.size());
  }
}`, "created=Board[id=101, writer=learner, title=create-read]\nfound=Board[id=101, writer=learner, title=create-read]\nsame-id=true\nrows=1", ["local-board-controller", "local-board-service", "local-board-mapper", "spring-request-mapping", "mybatis-mapper-xml", "java-optional"] )],
    diagnostics: [
      d("등록 success 화면은 보이지만 생성 ID로 상세 조회하면 404입니다.", "insert result/key/commit을 확인하지 않고 redirect/response를 먼저 확정했습니다.", ["affected/generated result", "transaction commit", "Location/redirect id", "DB readback"], "actual generated ID와 committed result로 success representation을 만들고 representative readback을 검증합니다.", "create→commit→GET round-trip integration test를 둡니다."),
      d("deleted/다른 tenant row가 상세 endpoint에서 노출됩니다.", "generic findById 뒤 controller에서 불완전한 visibility 검사를 합니다.", ["query predicates", "actor/tenant context", "soft-delete", "cache keys"], "findVisibleById(actor,id) query/port와 관리자 전용 query를 분리합니다.", "visible/deleted/other-tenant/missing matrix와 existence-leak tests를 둡니다."),
    ],
    expertNotes: ["create와 read가 같은 model을 반환해도 command와 projection type은 분리해 over-posting/over-fetch를 막습니다.", "read-after-write consistency는 primary/replica routing과 transaction/replication lag를 포함해 검증합니다."],
  },
  {
    id: "create-input-validation-authorization",
    title: "Create는 validation·actor authorization·domain construction을 insert 전에 끝냅니다",
    lead: "빈 제목·초과 본문·위조 작성자·server-owned id/status를 받은 뒤 파일/암호/SQL을 실행하면 실패가 늦고 cleanup이 복잡해집니다.",
    explanations: [
      "request DTO에는 create에서 허용하는 title/content/optional attachment handle만 두고 writer/owner는 가능한 한 authenticated principal에서 가져옵니다. 클라이언트가 보낸 owner role/id/hit/active/createdAt을 신뢰하지 않습니다.",
      "binding/type/length/format은 controller validation, title/content invariants는 domain construction, actor가 게시할 수 있는지와 quota/duplicate policy는 service authorization에서 확인합니다. 각 실패는 insert/upload finalization calls 0이어야 합니다.",
      "HTML form은 BindingResult와 입력 재표시가 필요하더라도 password/file bytes를 model/flash/session에 보관하지 않습니다. JSON error는 field/code 중심으로 제한하고 rejected content를 반사하지 않습니다.",
      "validation 후 insert 사이에도 quota/unique state가 바뀔 수 있으므로 database constraint/transaction을 최종 보장으로 둡니다. 사전 check만으로 uniqueness를 보장하지 않고 conflict를 정확히 번역합니다.",
      "payload/body size, Unicode code points와 DB charset/column bytes를 지원 database에서 검증합니다. controller annotation과 DB constraint가 다르면 가장 늦은 failure가 internal 500이 되지 않게 domain/schema를 정렬합니다.",
    ],
    concepts: [
      c("create command", "검증된 actor intent와 새 resource에 필요한 client-provided fields만 담은 application input입니다.", ["server fields를 제외합니다.", "transport와 분리합니다."]),
      c("authorization before side effect", "actor capability를 확인한 뒤에만 DB/file/external mutation을 시작하는 순서 규칙입니다.", ["existence leak도 고려합니다.", "transaction constraint와 함께 씁니다."]),
      c("validation short-circuit", "invalid input에서 repository와 다른 side effect를 호출하지 않고 terminal error를 반환하는 동작입니다.", ["call count로 증명합니다.", "cleanup을 줄입니다."]),
    ],
    codeExamples: [java("crud03-create-validation", "유효성 실패의 insert 0 보장", "Crud03CreateValidation.java", "blank/oversized title은 stable 400 code로 종료되고 valid title만 repository insert를 한 번 호출하는 경로를 실행합니다.", String.raw`import java.util.concurrent.atomic.*;

public class Crud03CreateValidation {
  record Result(int status, String code) {}
  static Result create(String title, AtomicInteger inserts) {
    if (title == null || title.isBlank()) return new Result(400, "TITLE_REQUIRED");
    String normalized = title.strip();
    if (normalized.codePointCount(0, normalized.length()) > 10) return new Result(400, "TITLE_TOO_LONG");
    inserts.incrementAndGet();
    return new Result(201, "CREATED");
  }
  public static void main(String[] args) {
    AtomicInteger inserts = new AtomicInteger();
    System.out.println("blank=" + create("   ", inserts));
    System.out.println("long=" + create("12345678901", inserts));
    System.out.println("inserts-after-invalid=" + inserts.get());
    System.out.println("valid=" + create("board", inserts));
    System.out.println("inserts-final=" + inserts.get());
  }
}`, "blank=Result[status=400, code=TITLE_REQUIRED]\nlong=Result[status=400, code=TITLE_TOO_LONG]\ninserts-after-invalid=0\nvalid=Result[status=201, code=CREATED]\ninserts-final=1", ["spring-validation", "spring-handler-methods", "owasp-input-validation", "owasp-mass-assignment"] )],
    diagnostics: [
      d("사용자가 writer/active/id를 바꿔 다른 소유자/상태로 글을 만듭니다.", "request fields를 entity/row에 자동 복사하고 actor/server-owned fields를 신뢰했습니다.", ["request schema", "principal mapping", "insert columns", "persisted owner/state"], "authenticated actor와 server defaults를 service에서 주입하고 create DTO/SQL을 allow-list합니다.", "malicious extra-field와 cross-user persisted-state tests를 둡니다."),
      d("invalid input인데 DB sequence가 소비되거나 temp file이 남습니다.", "ID/file allocation과 insert를 validation/authorization 전에 시작했습니다.", ["event order", "repository/upload calls", "temporary leases", "cleanup"], "cheap validation/auth를 먼저 수행하고 unavoidable allocation은 lease/finally cleanup과 non-gap identity semantics로 처리합니다.", "각 validation/side-effect 단계 fault injection과 residual=0 test를 둡니다."),
    ],
    expertNotes: ["sequence gap은 rollback/crash에서 정상일 수 있으므로 연속 번호를 업무 요구와 혼동하지 않습니다.", "author display name과 authenticated owner identity를 같은 request String으로 취급하지 않습니다."],
  },
  {
    id: "generated-identity-strategies",
    title: "Generated ID는 database/provider가 원자적으로 할당하고 실제 값을 service result로 회수합니다",
    lead: "새 ID를 MAX(id)+1로 계산하면 동시 transaction이 같은 값을 보고 충돌하며 sequence gap을 피하려다 correctness를 잃습니다.",
    explanations: [
      "auto-increment/identity, sequence, table generator, UUID/ULID-like application ID는 할당 시점, round trip, batching, ordering/index, portability와 disclosure 특성이 다릅니다. target DB/provider와 업무 identity 요구를 기준으로 선택합니다.",
      "MyBatis는 JDBC generated keys의 useGeneratedKeys/keyProperty/keyColumn, database sequence를 사용하는 selectKey BEFORE/AFTER 또는 RETURNING-style statement를 지원합니다. driver/database별 실제 key population과 multi-row behavior를 integration test로 확인합니다.",
      "JPA @GeneratedValue strategy도 persist/flush/insert timing과 batching에 영향을 줍니다. persist 호출 직후 id가 항상 있다고 가정하지 말고 provider/strategy contract와 service response timing을 테스트합니다.",
      "원본 primary key는 database auto increment라고 설명하지만 별도 계층형 그룹 번호를 insert 전에 MAX(primary id)+1로 계산합니다. 이 값은 primary key가 아니어도 concurrent creates가 같은 group을 받아 thread structure를 섞을 수 있으므로 database sequence/unique constraint/insert 후 actual id 사용으로 교정합니다.",
      "ID를 URL에 노출할 때는 syntax/range를 검증하고 authorization을 항상 적용합니다. 난수 ID가 authorization을 대신하지 않고 sequential ID가 있다는 이유만으로 바로 취약한 것도 아니며 enumeration impact를 threat model로 판단합니다.",
    ],
    concepts: [
      c("generated key", "insert 과정에서 database/provider가 원자적 mechanism으로 생성해 호출자에게 돌려주는 식별 값입니다.", ["실제 값을 회수합니다.", "driver 지원을 검증합니다."]),
      c("identity strategy", "resource key의 생성 주체, algorithm, timing과 storage/index 특성을 정한 정책입니다.", ["DB/provider별 차이가 있습니다.", "migration/portability를 고려합니다."]),
      c("allocation race", "동시 요청이 공유 최대값/카운터를 읽고 같은 다음 값을 계산해 충돌하는 경쟁 상태입니다.", ["MAX+1이 대표적입니다.", "atomic DB primitive를 씁니다."]),
    ],
    codeExamples: [java("crud03-key-race", "MAX+1 중복과 원자 sequence 비교", "Crud03KeyRace.java", "두 create가 같은 snapshot max를 읽어 같은 group을 계산하는 lost allocation과 AtomicLong sequence의 서로 다른 값을 deterministic하게 비교합니다.", String.raw`import java.util.concurrent.atomic.*;

public class Crud03KeyRace {
  public static void main(String[] args) {
    long observedMaxByA = 7;
    long observedMaxByB = 7;
    long guessedA = observedMaxByA + 1;
    long guessedB = observedMaxByB + 1;
    System.out.println("max-plus-one=" + guessedA + "," + guessedB);
    System.out.println("duplicate=" + (guessedA==guessedB));
    AtomicLong sequence = new AtomicLong(7);
    long allocatedA = sequence.incrementAndGet();
    long allocatedB = sequence.incrementAndGet();
    System.out.println("atomic-sequence=" + allocatedA + "," + allocatedB);
    System.out.println("distinct=" + (allocatedA!=allocatedB));
  }
}`, "max-plus-one=8,8\nduplicate=true\natomic-sequence=8,9\ndistinct=true", ["local-board-mapper", "mybatis-mapper-xml", "jakarta-generated-value"] )],
    diagnostics: [
      d("동시 등록 두 건이 같은 group/order ID를 가져 thread 구조가 합쳐집니다.", "insert 전 SELECT MAX(...)+1을 application/mapper에서 계산했습니다.", ["selectKey SQL/order", "concurrent transaction timeline", "constraints", "duplicate groups"], "database sequence/identity/atomic counter 또는 insert-generated primary ID를 group key로 사용하고 uniqueness를 제약합니다.", "barrier concurrent insert와 uniqueness/readback tests를 둡니다."),
      d("insert는 성공했지만 response/redirect ID가 null 또는 다른 값입니다.", "generated key 설정/driver support/keyProperty가 없거나 추정 값을 사용했습니다.", ["useGeneratedKeys/selectKey/RETURNING", "keyProperty/keyColumn", "flush timing", "actual row"], "supported key-return mechanism으로 실제 ID를 service result에 담고 commit 후 Location을 구성합니다.", "DB/driver별 create ID round-trip tests를 둡니다."),
    ],
    expertNotes: ["업무상 보이는 문서 번호가 gapless여야 하면 primary key와 분리해 serialization/locking/audit 요구를 별도 설계합니다.", "UUID 문자열 형태를 받는 것과 유효한 owned resource를 조회하는 것은 다른 검증입니다."],
  },
  {
    id: "mybatis-jpa-create-semantics",
    title: "MyBatis INSERT와 JPA persist의 다른 identity·lifecycle semantics를 같은 service contract로 감쌉니다",
    lead: "service가 기술별 key/flush/entity 상태를 직접 가정하면 MyBatis↔JPA 전환이나 테스트 double이 create 결과를 다르게 만듭니다.",
    explanations: [
      "MyBatis mapper INSERT는 parameter object/key property와 affected rows를 중심으로 동작하고 SqlSession/Spring transaction에 참여합니다. dynamic column/nullable/type handlers와 generated key 회수를 XML/interface contract로 검증합니다.",
      "JPA persist는 entity를 persistence context에 managed로 만들고 provider가 strategy에 따라 INSERT/ID assignment를 수행하며 flush/commit에 제약 오류가 날 수 있습니다. dirty checking/proxy/lifecycle callbacks가 추가됩니다.",
      "application port는 CreatedBoard(id, snapshot) 또는 BoardId create(NewBoard)처럼 technology-neutral result를 정의합니다. adapter는 key/flush/row count/provider exceptions를 그 contract로 변환하고 service는 commit 완료 뒤 응답을 만듭니다.",
      "MyBatis/JPA를 한 transaction에서 무심코 혼용하면 같은 DataSource/transaction manager, flush ordering, caches와 connection participation을 검증해야 합니다. 교육용 비교를 production dual-write로 오해하지 않습니다.",
      "adapter test는 mock이 아닌 actual MyBatis/JPA provider+supported database에서 insert, generated id, constraints, rollback, time precision과 readback을 동일 contract corpus로 실행합니다.",
    ],
    concepts: [
      c("persistence adapter parity", "서로 다른 storage technologies가 동일 application port의 성공·absence·failure·transaction semantics를 만족하는 성질입니다.", ["contract suite로 비교합니다.", "내부 mechanics는 다릅니다."]),
      c("flush", "persistence context의 pending changes를 database statements로 동기화하는 단계입니다.", ["commit 전에도 발생할 수 있습니다.", "실패 시점을 바꿉니다."]),
      c("create result", "실제로 저장된 identity와 공개/후속 처리에 필요한 최소 snapshot을 담은 application output입니다.", ["affected rows만이 아닙니다.", "HTTP를 모릅니다."]),
    ],
    diagnostics: [
      d("JPA port test는 persist 호출 후 성공하지만 commit에서 unique error가 납니다.", "flush/commit 전을 create 성공으로 간주했습니다.", ["flush timing", "transaction boundary", "constraint exception", "response timing"], "service transaction 전체가 완료된 뒤 success를 확정하고 adapter contract에 commit failure scenario를 둡니다.", "persist/flush/commit 단계 fault tests를 둡니다."),
      d("MyBatis와 JPA adapter가 같은 invalid input에 서로 다른 public error를 만듭니다.", "vendor exceptions가 service/controller까지 새고 translation parity가 없습니다.", ["adapter exceptions", "application error codes", "rollback", "HTTP bodies"], "각 adapter에서 stable Conflict/Integrity/Unavailable category로 번역합니다.", "동일 contract corpus를 두 adapters에 적용합니다."),
    ],
    expertNotes: ["technology-neutral port가 lowest-common-denominator가 되지 않게 application에 필요한 identity/result를 먼저 정의합니다.", "JPA flush를 억지로 호출해 모든 failure를 당기는 선택은 batching/performance와 함께 평가합니다."],
  },
  {
    id: "transaction-side-effect-publication",
    title: "게시글·attachment metadata·outbox를 원자화하고 외부 side effect는 staged publication으로 처리합니다",
    lead: "controller가 파일을 final path에 저장한 뒤 DB insert하면 DB 실패에 고아 파일이 남고, DB 먼저 commit하면 파일 실패에 깨진 link가 남습니다.",
    explanations: [
      "DB 안의 board row, attachment metadata, outbox event는 하나의 service transaction에 묶을 수 있습니다. object/file storage는 같은 ACID resource가 아니므로 temporary quarantine lease와 after-commit promote, outbox consumer 또는 compensation/reconciliation을 사용합니다.",
      "create service는 validate/auth→temporary resource 확인→DB insert/key→metadata/outbox→commit 순서와 각 실패 cleanup owner를 정의합니다. controller는 Multipart resource를 adapter command/lease로 바꾸고 final path I/O를 직접 소유하지 않습니다.",
      "after-commit callback도 process crash를 견디지 못할 수 있어 durable outbox/worker와 idempotent promotion이 필요합니다. promote가 중복돼도 같은 content/key 결과를 내고 missing temp를 reconciliation category로 처리합니다.",
      "password encoding/secret processing은 DB transaction 전후 latency와 failure를 측정합니다. hash verifier만 저장하고 평문은 DTO/log/retry/outbox에 남기지 않습니다.",
      "public response는 board가 committed되고 attachment 상태가 READY/PENDING 중 어떤 contract인지 명시합니다. 비동기 처리를 201 success로 숨기지 말고 representation/status link와 retry expectations를 제공합니다.",
    ],
    concepts: [
      c("staged publication", "외부 resource를 temporary 상태에 두고 DB commit/outbox 결과에 따라 final visibility로 승격하는 protocol입니다.", ["부분 실패를 관리합니다.", "idempotent promote가 필요합니다."]),
      c("outbox", "domain state와 같은 DB transaction에 durable event row를 쓰고 별도 worker가 외부 side effect를 수행하는 pattern입니다.", ["dual-write를 줄입니다.", "중복 처리를 고려합니다."]),
      c("reconciliation", "DB와 external storage의 기대 상태를 주기적으로 비교해 누락/고아를 완료·정리하는 운영 절차입니다.", ["crash를 다룹니다.", "safe metrics를 남깁니다."]),
    ],
    diagnostics: [
      d("등록 실패 뒤 final upload files가 계속 증가합니다.", "file transfer가 validation/transaction보다 먼저이고 cleanup/reconciliation이 없습니다.", ["file/DB timeline", "temporary/final paths", "exception branches", "orphan inventory"], "quarantine lease→DB metadata/outbox commit→idempotent promote와 TTL cleanup을 적용합니다.", "각 단계 crash/failure injection과 orphan/ready parity tests를 둡니다."),
      d("DB row는 있지만 attachment link가 영구 404입니다.", "DB와 storage dual write 중 storage failure를 기록/재시도하지 않았습니다.", ["metadata status", "outbox", "worker attempts", "storage readback"], "PENDING/READY/FAILED state와 durable outbox/retry/dead-letter/reconciliation을 둡니다.", "commit 후 worker crash/retry/missing temp matrix를 둡니다."),
    ],
    expertNotes: ["파일 없이 게시글만 성공시킬지 전체 실패시킬지는 product invariant이며 controller catch의 즉흥 결정이 아닙니다.", "outbox가 exactly-once delivery를 보장한다고 표현하지 말고 at-least-once와 idempotent consumer를 설계합니다."],
  },
  {
    id: "http-created-location-prg",
    title: "REST의 201 Created·Location과 화면 폼의 POST/Redirect/GET을 분리합니다",
    lead: "등록 뒤 무조건 목록 view를 직접 렌더링하거나 302 문자열 redirect만 쓰면 새 resource identity, reload 중복과 proxy prefix를 잃습니다.",
    explanations: [
      "REST create가 새 resource를 만들면 201 Created와 Location으로 primary resource URI를 알려주고 필요한 최소 representation을 body에 반환할 수 있습니다. URI는 실제 generated ID와 trusted request/application base configuration으로 구성합니다.",
      "HTML form은 POST 성공 뒤 303 See Other 등 명시적 redirect로 GET detail/list를 수행해 reload 재제출을 줄입니다. validation failure는 redirect하지 않고 form errors와 safe entered fields를 같은 request에 렌더링하는 것이 일반적입니다.",
      "Spring의 ResponseEntity/ServletUriComponentsBuilder 또는 route link builder를 사용하되 forwarded headers는 trusted proxy configuration에서만 반영합니다. user-provided Host/X-Forwarded-*를 무검증 Location에 사용하면 host injection이 됩니다.",
      "Location path segment에는 typed generated id를 encode/build하고 문자열 연결 query에 raw title/message를 넣지 않습니다. context path, reverse proxy prefix와 API version을 deployment integration에서 확인합니다.",
      "redirect가 성공했다는 사실과 transaction commit/read-after-write availability를 연결합니다. replica lag가 있으면 write result snapshot, sticky/read-primary 또는 retry contract를 설계합니다.",
    ],
    concepts: [
      c("201 Created", "요청 결과 새 resource가 생성됐음을 나타내는 HTTP 성공 status입니다.", ["Location과 함께 사용할 수 있습니다.", "commit 후 반환합니다."]),
      c("Location", "응답과 관련된 resource를 식별하는 URI reference를 담는 HTTP field입니다.", ["trusted base로 구성합니다.", "generated id를 사용합니다."]),
      c("POST/Redirect/GET", "form mutation 성공 뒤 redirect해 새 GET representation을 표시하고 reload 재POST를 줄이는 flow입니다.", ["idempotency를 보장하지 않습니다.", "validation failure와 구분합니다."]),
    ],
    codeExamples: [java("crud03-http-contract", "201 Location과 303 PRG 비교", "Crud03HttpContract.java", "같은 created result를 REST 201 response와 page 303 redirect로 mapping해 status/Location/body 차이를 실행합니다.", String.raw`public class Crud03HttpContract {
  record Created(long id, String title) {}
  record Response(int status, String location, String body) {}
  static Response rest(Created created) {
    return new Response(201, "/boards/" + created.id(), "id=" + created.id() + "|title=" + created.title());
  }
  static Response page(Created created) {
    return new Response(303, "/boards/" + created.id(), "");
  }
  public static void main(String[] args) {
    Created created = new Created(55L, "http-contract");
    System.out.println("rest=" + rest(created));
    System.out.println("page=" + page(created));
    System.out.println("location-from-generated-id=true");
    System.out.println("post-reload-target=GET");
  }
}`, "rest=Response[status=201, location=/boards/55, body=id=55|title=http-contract]\npage=Response[status=303, location=/boards/55, body=]\nlocation-from-generated-id=true\npost-reload-target=GET", ["spring-response-entity", "spring-uri-builder", "spring-handler-methods", "rfc-http-semantics"] )],
    diagnostics: [
      d("reverse proxy 환경의 Location이 내부 host/path를 가리킵니다.", "request host/forwarded headers 또는 context path를 잘못 신뢰/조합했습니다.", ["generated Location", "proxy trusted headers", "application base URL", "external contract test"], "trusted proxy forwarding configuration과 URI builder/application canonical base를 사용합니다.", "direct/proxy/context/version matrix에서 external Location을 검증합니다."),
      d("새로고침/뒤로가기에서 같은 글이 다시 등록됩니다.", "POST 성공에서 view를 직접 렌더링하고 PRG/idempotency가 없습니다.", ["success response status", "browser network/reload", "duplicate rows", "idempotency key"], "page flow는 303 PRG를 사용하고 critical creates에는 idempotency protocol/unique invariant를 추가합니다.", "double-click/reload/network retry tests를 둡니다."),
    ],
    expertNotes: ["PRG는 브라우저 UX pattern이지 동일 POST가 중복 생성되지 않는다는 보장이 아닙니다.", "201 body에 entity 전체를 넣지 말고 공개 response projection과 authorization을 유지합니다."],
  },
  {
    id: "detail-not-found-soft-delete",
    title: "상세 조회의 found·missing·deleted·forbidden을 정보 노출 정책과 함께 구분합니다",
    lead: "mapper null을 error view로 보내는 것만으로는 삭제/권한/DB 장애를 구분하지 못하고 existence가 사용자에게 새어 나갈 수 있습니다.",
    explanations: [
      "repository는 visible row를 Optional/typed result로 반환하고 dependency timeout/mapping failure는 exception으로 구분합니다. Optional.empty를 모든 오류의 fallback으로 사용하지 않습니다.",
      "missing/deleted/다른 tenant를 외부에 모두 404로 숨길지 authenticated owner/admin에게 403/410/state를 줄지는 threat model과 product contract로 정합니다. 내부 audit category는 외부 detail과 분리합니다.",
      "soft delete predicate는 count/list/detail/search/attachment/cache에 일관되게 적용하고 admin recycle-bin query는 별도 port로 둡니다. 원본 detail query처럼 primary id만 보는 SQL을 public read에 사용하지 않습니다.",
      "id path variable의 type/range/format failure는 400 또는 route-level 404 정책으로 정하고 DB에 invalid 값이 도달하지 않게 합니다. negative/overflow/too-long identifier와 encoded path를 테스트합니다.",
      "detail response는 entity/row가 아니라 public projection이며 password hash, internal file key, deletion reason과 audit fields를 제외합니다. HTML text/attribute/URL 문맥에서 output encoding을 적용합니다.",
    ],
    concepts: [
      c("not found", "요청한 actor/visibility 범위에서 resource representation을 제공할 수 없는 application result입니다.", ["absence와 DB failure가 다릅니다.", "외부 disclosure policy가 있습니다."]),
      c("soft delete", "row를 물리 제거하지 않고 상태로 숨기며 제한된 recovery/audit use case에서만 접근하는 정책입니다.", ["모든 query에 적용합니다.", "authorization이 필요합니다."]),
      c("existence disclosure", "status/message/timing 차이가 보호 resource의 존재 여부를 권한 없는 사용자에게 알려주는 위험입니다.", ["404/403 정책을 정합니다.", "timing/cache도 봅니다."]),
    ],
    codeExamples: [java("crud03-detail-visibility", "visible·deleted·missing 상세 status", "Crud03DetailVisibility.java", "공개 detail query가 visible만 200으로 반환하고 deleted/missing은 동일 404 code로 처리하는 정책을 실행합니다.", String.raw`import java.util.*;

public class Crud03DetailVisibility {
  enum State { VISIBLE, DELETED }
  record Board(long id, String title, State state) {}
  record Result(int status, String code, String title) {}
  static Result detail(Map<Long,Board> rows, long id) {
    Board board = rows.get(id);
    if (board == null || board.state()!=State.VISIBLE) return new Result(404,"BOARD_NOT_FOUND",null);
    return new Result(200,"OK",board.title());
  }
  public static void main(String[] args) {
    Map<Long,Board> rows = Map.of(1L,new Board(1,"visible",State.VISIBLE), 2L,new Board(2,"deleted",State.DELETED));
    System.out.println("visible=" + detail(rows,1));
    System.out.println("deleted=" + detail(rows,2));
    System.out.println("missing=" + detail(rows,3));
    System.out.println("deleted-equals-missing=" + detail(rows,2).equals(detail(rows,3)));
  }
}`, "visible=Result[status=200, code=OK, title=visible]\ndeleted=Result[status=404, code=BOARD_NOT_FOUND, title=null]\nmissing=Result[status=404, code=BOARD_NOT_FOUND, title=null]\ndeleted-equals-missing=true", ["local-board-mapper", "spring-error-responses", "rfc-http-semantics", "java-optional", "owasp-xss"] )],
    diagnostics: [
      d("deleted row는 list에서 없지만 direct detail로 보입니다.", "detail SQL/cache에 active visibility predicate가 없습니다.", ["list/detail/count SQL", "cache loader", "admin/public ports", "fixtures"], "public findVisibleById에 shared visibility/tenant policy를 적용하고 admin query를 분리합니다.", "list/detail/search/cache soft-delete consistency tests를 둡니다."),
      d("DB timeout이 BOARD_NOT_FOUND 404로 변환됩니다.", "repository catch가 모든 exception을 Optional.empty/null로 바꿨습니다.", ["catch/fallback", "driver exception", "transaction status", "HTTP code"], "no row만 empty, dependency/mapping/transaction errors는 typed exceptions로 보존합니다.", "no-row/timeout/connection/mapping/commit matrix를 둡니다."),
    ],
    expertNotes: ["404로 존재를 숨겨도 authorization check와 audit를 생략하지 않습니다.", "soft delete는 개인정보 retention/법적 삭제 요구를 자동 충족하지 않으므로 별도 purge policy가 필요합니다."],
  },
  {
    id: "safe-get-view-count",
    title: "상세 GET의 안전성과 조회수·분석 event의 약한 side effect를 분리합니다",
    lead: "GET에서 row hit를 필수 update하면 crawler, prefetch, HEAD, retry와 cache가 실제 사용자 조회수를 왜곡하고 read transaction에 write lock을 추가합니다.",
    explanations: [
      "RFC HTTP semantics의 safe method는 client가 요청한 semantics가 read-only임을 뜻합니다. server logging/metrics 같은 부수 효과는 있을 수 있지만 resource business state 변경을 GET의 성공 조건으로 만들면 retry/cache/tooling 기대와 충돌합니다.",
      "view count가 제품 기능이라면 deduplicated analytics event, time-window unique view, async counter 또는 explicit command를 고려합니다. 정확성, freshness, abuse/bot filtering과 loss tolerance를 먼저 정합니다.",
      "원본 detail handler는 hit update 후 detail select가 둘 다 성공해야 view를 반환합니다. maintained read는 detail 200/404를 조회 DB contract로 결정하고 metrics/counter failure가 content availability를 막지 않는 bounded policy를 둡니다.",
      "HEAD는 GET과 같은 representation metadata를 주되 body가 없고 view event를 카운트할지 정책이 필요합니다. browser prefetch/link preview/crawler와 repeated refresh corpus를 실행합니다.",
      "analytics event에는 raw title/content/password/IP 전체를 넣지 않고 resource stable id의 적절한 pseudonymization, actor category, timestamp bucket과 bot/privacy/retention policy를 적용합니다.",
    ],
    concepts: [
      c("safe method", "요청 semantics가 resource state 변경을 요구하지 않는 HTTP method 성질입니다.", ["GET/HEAD가 대표적입니다.", "server logs는 가능할 수 있습니다."]),
      c("view event", "resource representation이 실제로 소비됐다는 분석 신호로 counter row와 별도 수명/정확성 정책을 갖습니다.", ["deduplication이 필요할 수 있습니다.", "실패가 read를 막지 않을 수 있습니다."]),
      c("weak side effect", "주 업무 성공의 원자적 조건은 아니며 실패/중복/loss tolerance를 명시한 부수 처리입니다.", ["metrics/analytics 등이 있습니다.", "bounded failure를 둡니다."]),
    ],
    codeExamples: [java("crud03-view-events", "read와 deduplicated view event 분리", "Crud03ViewEvents.java", "같은 viewer/resource/window의 반복 GET은 content를 매번 반환하지만 view event는 한 번만 기록되는 최소 policy를 실행합니다.", String.raw`import java.util.*;

public class Crud03ViewEvents {
  static final class Reader {
    private final Set<String> views = new HashSet<>();
    String get(long boardId, String viewer, String window) {
      views.add(boardId + "|" + viewer + "|" + window);
      return "board-" + boardId;
    }
    int uniqueViews() { return views.size(); }
  }
  public static void main(String[] args) {
    Reader reader = new Reader();
    System.out.println("first=" + reader.get(9,"viewer-a","2026-01-01T10"));
    System.out.println("second=" + reader.get(9,"viewer-a","2026-01-01T10"));
    System.out.println("same-window-views=" + reader.uniqueViews());
    System.out.println("third=" + reader.get(9,"viewer-a","2026-01-01T11"));
    System.out.println("next-window-views=" + reader.uniqueViews());
    System.out.println("board-mutated=false");
  }
}`, "first=board-9\nsecond=board-9\nsame-window-views=1\nthird=board-9\nnext-window-views=2\nboard-mutated=false", ["local-board-controller", "local-board-mapper", "rfc-http-semantics"] )],
    diagnostics: [
      d("crawler/link preview만으로 hit가 급증하고 row locks가 생깁니다.", "GET detail마다 synchronous DB counter update를 수행했습니다.", ["user agents/prefetch", "update QPS/locks", "GET retries", "counter requirements"], "content read와 analytics event를 분리하고 dedup/bot/privacy/async policy를 적용합니다.", "HEAD/prefetch/crawler/retry/load fixtures와 counter accuracy budget을 둡니다."),
      d("counter DB 장애 때문에 상세 페이지도 500입니다.", "optional analytics update를 read success invariant로 묶었습니다.", ["call order", "transaction", "counter failure", "response"], "detail query 성공을 primary result로 두고 view event는 bounded outbox/async/fail-safe policy로 처리합니다.", "counter unavailable/timeout에서도 read contract가 유지되는지 검증합니다."),
    ],
    expertNotes: ["조회수 정확도가 결제/정산처럼 강한 invariant라면 GET 부수 효과가 아니라 별도 authenticated command/event product로 설계합니다.", "deduplication key에 raw IP/session secret을 그대로 저장하지 않습니다."],
  },
  {
    id: "duplicate-post-idempotency",
    title: "중복 POST를 PRG가 아니라 idempotency key·unique invariant·replay result로 통제합니다",
    lead: "double-click, mobile retry, proxy timeout 뒤 재전송은 같은 create를 여러 번 실행할 수 있으며 POST 자체는 일반적으로 idempotent하지 않습니다.",
    explanations: [
      "critical create에는 actor+operation 범위의 idempotency key를 받고 normalized request fingerprint와 result/status를 durable store에 transactionally 연결합니다. 같은 key+same payload는 같은 result를 replay하고 same key+different payload는 conflict로 거부합니다.",
      "key는 충분한 entropy/length를 갖고 expiration과 abuse quota를 둡니다. 외부 key를 resource ID나 authorization으로 사용하지 않고 logs/metrics high-cardinality labels에서 제외합니다.",
      "동시에 같은 key가 들어오면 unique constraint/atomic insert로 한 owner를 정하고 loser는 committed result를 읽거나 bounded in-progress/retry response를 받습니다. check-then-insert Map logic만으로 production 원자성을 보장하지 않습니다.",
      "response replay는 최초 status, Location와 public body 의미를 보존하되 현재 authorization/retention 정책을 고려합니다. raw password/file bytes를 fingerprint/idempotency record에 저장하지 않습니다.",
      "PRG는 browser reload UX를 줄이고 unique business key는 특정 duplicate를 막으며 idempotency key는 request replay를 통제합니다. 세 기능의 범위와 failure modes를 구분합니다.",
    ],
    concepts: [
      c("idempotency key", "client가 같은 logical mutation retry를 식별하도록 보내는 operation-scoped token입니다.", ["payload/result와 연결합니다.", "authorization을 대신하지 않습니다."]),
      c("request fingerprint", "같은 key가 같은 semantic command인지 비교하는 canonical non-secret digest/metadata입니다.", ["canonicalization을 정합니다.", "secret bytes를 보관하지 않습니다."]),
      c("replay result", "이미 완료된 동일 operation의 status, resource identity와 public response를 재사용하는 결과입니다.", ["새 row를 만들지 않습니다.", "Location을 보존합니다."]),
    ],
    codeExamples: [java("crud03-idempotency", "같은 key replay와 다른 payload conflict", "Crud03Idempotency.java", "같은 key/title retry는 동일 generated ID를 반환하고 같은 key의 다른 title은 conflict가 되는 최소 idempotency registry를 실행합니다.", String.raw`import java.util.*;

public class Crud03Idempotency {
  record Stored(String fingerprint, long boardId) {}
  static final class Service {
    private long sequence = 200;
    private final Map<String,Stored> registry = new HashMap<>();
    long create(String key, String title) {
      String fingerprint = "title:" + title;
      Stored prior = registry.get(key);
      if (prior != null) {
        if (!prior.fingerprint().equals(fingerprint)) throw new IllegalStateException("IDEMPOTENCY_CONFLICT");
        return prior.boardId();
      }
      long id = ++sequence;
      registry.put(key, new Stored(fingerprint,id));
      return id;
    }
    int operations() { return registry.size(); }
  }
  public static void main(String[] args) {
    Service service = new Service();
    long first = service.create("key-7","same");
    long replay = service.create("key-7","same");
    System.out.println("first=" + first);
    System.out.println("replay=" + replay);
    System.out.println("same-result=" + (first==replay));
    System.out.println("operations=" + service.operations());
    try { service.create("key-7","different"); }
    catch (IllegalStateException error) { System.out.println("conflict=" + error.getMessage()); }
  }
}`, "first=201\nreplay=201\nsame-result=true\noperations=1\nconflict=IDEMPOTENCY_CONFLICT", ["rfc-http-semantics", "spring-transactions", "owasp-input-validation"] )],
    diagnostics: [
      d("double-click/timeout retry가 같은 게시글을 두 번 만듭니다.", "POST retry identity, unique invariant와 atomic idempotency store가 없습니다.", ["client retries", "request keys", "duplicate rows", "transaction constraints"], "critical create에 scoped idempotency key+fingerprint+result를 unique transactionally 저장합니다.", "concurrent same-key/same-different-payload/crash-before-after-commit tests를 둡니다."),
      d("같은 idempotency key로 다른 사용자의 result가 반환됩니다.", "registry key가 actor/tenant/operation scope를 포함하지 않거나 authorization을 재검증하지 않았습니다.", ["registry primary key", "actor/tenant", "operation", "replay authorization"], "actor/tenant+operation+key로 scope하고 replay에서도 authenticated context/policy를 적용합니다.", "cross-user/tenant/key reuse isolation tests를 둡니다."),
    ],
    expertNotes: ["idempotency registry retention이 끝난 뒤 retry semantics를 client에게 문서화합니다.", "in-memory example은 atomicity를 설명하지 않으므로 실제 구현은 DB unique constraint와 transaction/concurrent test가 필수입니다."],
  },
  {
    id: "security-output-data-minimization",
    title: "create/read 전 구간에서 password·content·attachment와 SQL/error 노출을 최소화합니다",
    lead: "게시글 등록은 자유 텍스트와 비밀번호·파일을 받을 수 있어 DTO, mapper, logs, view/JSON과 error 모든 경계가 민감 sink가 됩니다.",
    explanations: [
      "평문 password는 dedicated input으로 받고 encoder에 즉시 전달하며 hash/verifier만 persistence port에 보냅니다. hash도 detail response/JSP model/log에 포함하지 않고 verification use case에서만 읽습니다.",
      "title/content validation은 XSS 방어와 다릅니다. 저장은 업무 정책에 맞는 text를 보존하고 HTML/JSP/attribute/URL/JSON 각 출력 context에서 안전하게 encoding합니다. rich text가 필요하면 별도 sanitizer policy와 allow-list를 둡니다.",
      "attachment original filename/content type은 신뢰하지 않고 CRUD07의 upload validation/storage protocol로 분리합니다. detail에는 authorized download URL/metadata만 projection하고 storage path/key를 노출하지 않습니다.",
      "mapper SQL은 #{} bound parameters와 명시 columns를 사용하고 error response에 SQL/table/constraint/value를 포함하지 않습니다. logs에는 operation, validation/error category, generated id presence, affected rows와 duration bucket만 둡니다.",
      "not-found/forbidden/validation timing과 message가 secret/resource existence를 과도하게 드러내지 않는지 테스트합니다. public errors는 stable code/correlation, internal restricted event는 safe cause/phase를 가집니다.",
    ],
    concepts: [
      c("data minimization", "operation 목적에 필요한 field만 수집·전달·저장·반환·기록하는 원칙입니다.", ["secret lifetime을 줄입니다.", "public projection을 사용합니다."]),
      c("contextual output encoding", "텍스트를 최종 HTML/attribute/URL/JavaScript 등의 parser context에 맞게 안전한 표현으로 변환하는 처리입니다.", ["입력 validation과 다릅니다.", "renderer가 소유합니다."]),
      c("safe error", "외부에는 stable code와 필요한 detail만 주고 SQL/stack/secret/internal topology를 제외한 오류 표현입니다.", ["internal evidence와 분리합니다.", "correlation을 포함합니다."]),
    ],
    diagnostics: [
      d("detail response/JSP/log에 password hash 또는 storage path가 보입니다.", "entity/VO 전체를 model/response/logger에 전달했습니다.", ["handler model/return", "serializer/EL", "toString/logger", "actual response/log"], "dedicated detail projection과 safe event schema를 사용하고 노출 secret을 rotate/삭제합니다.", "forbidden field/value canary를 HTTP/view/log/APM 끝까지 검사합니다."),
      d("게시글 제목의 markup이 JSP 구조/script를 바꿉니다.", "입력 validation만 믿고 출력 context encoding 없이 raw EL/HTML을 렌더링했습니다.", ["view sinks", "escaping tags/functions", "rich-text sanitizer", "CSP"], "plain text는 context encoder/tag로 출력하고 rich text는 reviewed sanitizer+allow-list를 적용합니다.", "HTML/attribute/URL/script hostile payload browser tests를 둡니다."),
    ],
    expertNotes: ["SQL parameter binding은 SQL injection을 줄이지만 authorization, stored XSS와 mass assignment를 해결하지 않습니다.", "오류에서 입력을 되돌려 줄 때도 password/file bytes/internal fields를 repopulate하지 않습니다."],
  },
  {
    id: "read-performance-cache-consistency",
    title: "create/read의 query·cache·replica·payload budget을 identity와 visibility contract에 맞춥니다",
    lead: "등록 직후 404, 상세 N+1, deleted cache 잔존과 unbounded content는 기능 테스트에서는 보이지 않지만 운영 신뢰를 무너뜨립니다.",
    explanations: [
      "create는 예상 insert/metadata/outbox/key-return statements와 transaction duration을, detail은 1개의 bounded projection query와 payload size를 budget으로 둡니다. generated key를 위해 불필요한 MAX/reselect를 반복하지 않습니다.",
      "read replica를 사용하면 commit 직후 Location GET이 lag로 404가 될 수 있습니다. read-your-write를 primary/sticky/session token으로 보장할지 client retry/representation body로 완화할지 계약합니다.",
      "detail cache key는 tenant/authorization/representation version과 visibility를 고려하고 create/update/delete commit 뒤 invalidation/event order를 검증합니다. 404 negative cache가 create 후 남거나 deleted response가 public cache에 남지 않게 합니다.",
      "ETag/Last-Modified 같은 validators는 representation version과 authorization을 고려해 생성하고 다음 CRUD04의 optimistic concurrency와 연결합니다. password/internal update가 public validator에 secret를 노출하지 않습니다.",
      "large content/attachment는 detail projection과 download/streaming을 분리하고 body/row/serialization/time budgets를 둡니다. SELECT *와 entity graph serialization을 피합니다.",
    ],
    concepts: [
      c("read-your-write", "client가 성공한 write 직후 자신의 새 state를 후속 read에서 관찰하는 consistency 기대입니다.", ["replica lag를 고려합니다.", "routing/token/retry로 구현합니다."]),
      c("negative cache", "not-found 같은 absence 결과를 일정 기간 저장하는 cache입니다.", ["create 뒤 invalidation이 필요합니다.", "권한 scope를 포함합니다."]),
      c("representation validator", "ETag/Last-Modified처럼 client/cache가 representation freshness를 비교하는 metadata입니다.", ["공개 projection 기준입니다.", "조건부 요청과 연결됩니다."]),
    ],
    diagnostics: [
      d("201 Location을 즉시 GET하면 간헐적으로 404입니다.", "write primary와 read replica lag/negative cache를 고려하지 않았습니다.", ["DB routing", "replication lag", "cache", "response body/read token"], "read-your-write policy로 primary/sticky/token을 사용하거나 documented retry/body snapshot을 제공합니다.", "commit 직후 Location GET을 replica/cache 조건별로 검증합니다."),
      d("새 글 생성 후 기존 404 cache가 TTL까지 유지됩니다.", "negative cache invalidation이 create commit과 연결되지 않았습니다.", ["cache key", "create event order", "transaction commit", "TTL"], "after-commit invalidation/event와 scoped cache key를 적용합니다.", "negative-cache→create→immediate-read와 event loss reconciliation tests를 둡니다."),
    ],
    expertNotes: ["캐시를 넣기 전 detail query/payload budget과 DB index/plan을 먼저 측정합니다.", "read-your-write를 모든 사용자/리전에서 강하게 보장하면 latency/availability 비용이 있어 product SLA로 결정합니다."],
  },
  {
    id: "create-read-testing-operations",
    title: "wire·service·adapter·DB·concurrency·operation evidence로 create/read를 qualification합니다",
    lead: "happy-path mock 하나와 수동 브라우저 확인만으로는 generated key, commit failure, double POST, soft delete, replica/cache와 secret leak을 검증할 수 없습니다.",
    explanations: [
      "controller/MockMvc tests는 POST method/content, request validation, service command, 201/Location 또는 303 redirect, error schema와 GET 200/404/encoding을 exact wire contract로 검증합니다.",
      "service tests는 validation/auth short-circuit, repository calls, generated result, transaction-triggering exception, idempotency replay/conflict와 external side-effect protocol을 fake/spy ports로 검증합니다.",
      "MyBatis/JPA integration은 actual supported DB에서 generated key/flush, affected rows, constraints, soft-delete predicates, timestamp/charset, rollback과 concurrent MAX+1/idempotency unique race를 실행합니다.",
      "full flow는 create→commit→Location GET, deleted/missing/forbidden, invalid, duplicate, timeout/commit failure, view counter failure와 cache/replica variants를 synthetic data로 연결합니다.",
      "운영 runbook은 request id로 status/Location→service outcome→transaction→statement/key/rows→cache/replica를 추적하되 raw content/password/SQL values를 기록하지 않습니다. source hashes와 framework/DB version을 evidence에 포함합니다.",
    ],
    concepts: [
      c("round-trip test", "create wire request에서 committed identity를 얻고 Location/detail read representation까지 이어 검증하는 테스트입니다.", ["transaction/read path를 연결합니다.", "wire exactness를 봅니다."]),
      c("concurrency qualification", "동시 create/replay/delete/read에서 identity, uniqueness, visibility와 transaction 결과를 barrier/load로 검증하는 과정입니다.", ["race를 deterministic하게 만듭니다.", "actual DB가 필요합니다."]),
      c("operational evidence", "장애 시 request→transaction→DB/cache 결과를 재구성할 수 있는 bounded logs/metrics/traces/readback입니다.", ["secret를 제외합니다.", "runbook과 연결합니다."]),
    ],
    diagnostics: [
      d("generated key test가 mock에서만 통과하고 운영 driver에서 null입니다.", "actual MyBatis/JPA/DB key mechanism integration을 생략했습니다.", ["driver/database versions", "keyProperty/strategy", "flush/commit", "readback"], "지원 DB container/isolated schema에서 create ID→row→Location round trip을 실행합니다.", "DB/driver/provider version matrix를 release gate로 둡니다."),
      d("장애 후 duplicate/orphan/deleted exposure 여부를 판단할 수 없습니다.", "failure stage, transaction/idempotency/cache/storage readback과 correlation evidence가 없습니다.", ["request events", "transaction outcome", "idempotency registry", "DB/cache/storage state"], "failure matrix runbook과 safe correlation/readback commands를 만들고 reconciliation을 실행합니다.", "synthetic incident drill에서 expected final state를 자동 비교합니다."),
    ],
    expertNotes: ["MockMvc status만 보지 말고 service/mapper calls, transaction/row/cache side effects까지 각 경계 테스트로 연결합니다.", "원본 학습 흐름과 교정된 권장 flow를 모두 보존하되 실제 운영 판단은 현재 versions의 official docs와 integration evidence를 따릅니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-board-controller", repository: "local learning archive", path: "2026-springmvc01/src/main/java/org/study/myproject01/board/controller/BoardController.java", usedFor: ["create redirect, upload/password and GET hit/detail provenance"], evidence: "Read-only audit: 220 lines, 8,293 bytes, SHA-256 FA77CD0DF48BCFBDF7332BF9D222599D2323BEAD5B369E818757128058CB83F9." },
  { id: "local-board-service", repository: "local learning archive", path: "2026-springmvc01/src/main/java/org/study/myproject01/board/service/BoardServiceImpl.java", usedFor: ["insert/hit/detail mapper flow provenance"], evidence: "Read-only audit: 61 lines, 1,688 bytes, SHA-256 431770CE49E24D0A546BD4B2850139313AF1CE5444EE82A9159B735944A7DF30." },
  { id: "local-board-mapper", repository: "local learning archive", path: "2026-springmvc01/src/main/resources/mapper/BoardMapper.xml", usedFor: ["insert selectKey, generated/group identity and detail visibility provenance"], evidence: "Read-only audit: 68 lines, 3,161 bytes, SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6." },
  { id: "spring-request-mapping", repository: "Spring Framework Reference", path: "Mapping Requests", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", usedFor: ["POST/GET mappings and HTTP method contract"], evidence: "Spring Framework 공식 request mapping reference입니다." },
  { id: "spring-handler-methods", repository: "Spring Framework Reference", path: "Handler Methods", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods.html", usedFor: ["request arguments, model and response values"], evidence: "Spring Framework 공식 handler methods reference입니다." },
  { id: "spring-validation", repository: "Spring Framework Reference", path: "MVC Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["create validation short-circuit"], evidence: "Spring Framework 공식 MVC validation reference입니다." },
  { id: "spring-error-responses", repository: "Spring Framework Reference", path: "Error Responses", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["400/404/409/5xx representation"], evidence: "Spring Framework 공식 error response reference입니다." },
  { id: "spring-response-entity", repository: "Spring Framework Javadoc", path: "ResponseEntity", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ResponseEntity.html", usedFor: ["201 status, headers and body construction"], evidence: "Spring Framework 공식 ResponseEntity API입니다." },
  { id: "spring-uri-builder", repository: "Spring Framework Javadoc", path: "ServletUriComponentsBuilder", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/support/ServletUriComponentsBuilder.html", usedFor: ["Location URI construction"], evidence: "Spring Framework 공식 servlet URI builder API입니다." },
  { id: "spring-transactions", repository: "Spring Framework Reference", path: "Declarative Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html", usedFor: ["create commit/rollback and idempotency transaction"], evidence: "Spring Framework 공식 declarative transaction reference입니다." },
  { id: "mybatis-mapper-xml", repository: "MyBatis 3 Reference", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["insert, useGeneratedKeys/selectKey, parameters/results"], evidence: "MyBatis 공식 mapper XML reference입니다." },
  { id: "mybatis-transactions", repository: "MyBatis-Spring Reference", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["Spring-managed mapper transaction"], evidence: "MyBatis-Spring 공식 transactions reference입니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence Specification", path: "Persistence 3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["persist/flush/entity lifecycle comparison"], evidence: "Jakarta Persistence 공식 specification입니다." },
  { id: "jakarta-generated-value", repository: "Jakarta Persistence API", path: "GeneratedValue", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/generatedvalue", usedFor: ["JPA generated identity strategies"], evidence: "Jakarta Persistence 공식 GeneratedValue API입니다." },
  { id: "rfc-http-semantics", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["POST/GET safety, 201/303/404, Location and idempotency semantics"], evidence: "IETF Standards Track HTTP semantics입니다." },
  { id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input Validation", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["create input allow-list and failure handling"], evidence: "OWASP 공식 input validation guidance입니다." },
  { id: "owasp-mass-assignment", repository: "OWASP Cheat Sheet Series", path: "Mass Assignment", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html", usedFor: ["server-owned create fields"], evidence: "OWASP 공식 mass assignment guidance입니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["detail view contextual output encoding"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
  { id: "java-optional", repository: "Java SE 21 API", path: "Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["explicit visible/missing detail result"], evidence: "Oracle JDK 공식 Optional API입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-03-board-create-read", slug: "crud-03-board-create-read", courseId: "spring", moduleId: "spring-layered-crud", order: 3,
  title: "게시글 등록·상세 조회와 식별자", subtitle: "validation부터 generated ID·commit·201/Location 또는 PRG, visible detail·404, GET 안전성·idempotency·cache까지 create/read lifecycle을 완결합니다.", level: "중급", estimatedMinutes: 90,
  coreQuestion: "새 게시글을 정확히 한 번 생성해 실제 ID와 commit을 응답하고, 안전한 GET에서 visible resource 또는 올바른 404를 어떻게 일관되게 제공할까요?",
  summary: "로컬 controller/service/mapper XML을 read-only로 감사해 등록 후 목록 redirect, mapper insert/selectKey, auto-increment 설명, MAX(primary id)+1 기반 group 선할당, 상세 GET의 hit update→select와 visibility 차이를 provenance로 사용합니다. maintained 자료는 create/read resource lifecycle, validation/authorization short-circuit, database/provider-generated identity와 MyBatis/JPA semantics, concurrent MAX+1 교정, DB/outbox/file publication, REST 201+Location과 page PRG, visible/missing/deleted detail, GET/view event 분리, duplicate POST idempotency, secret/output minimization, read-after-write/cache budgets와 wire/service/adapter/DB/concurrency qualification으로 확장합니다. 일곱 JDK 21 예제는 generated create-read, invalid insert 0, key race, HTTP mapping, 404 policy, deduplicated views와 idempotent replay를 실제 실행합니다.",
  objectives: ["POST create와 GET detail의 end-to-end lifecycle을 단계별로 설명한다.", "validation/authorization 실패에서 insert와 side effect를 0으로 만든다.", "generated identity strategy와 actual key 회수를 설계한다.", "MAX+1 경쟁 상태와 MyBatis/JPA create semantics를 구분한다.", "DB transaction과 file/outbox staged publication을 운영한다.", "REST 201/Location과 HTML PRG를 정확히 구성한다.", "missing/deleted/forbidden과 GET view-count policy를 분리한다.", "idempotent replay, secret-free responses, cache/replica consistency와 tests를 구현한다."],
  prerequisites: [{ title: "Controller→Service→Mapper 호출 흐름 추적", reason: "HTTP adapter, service transaction과 mapper/generated result의 호출·예외 경계를 알아야 create commit과 detail read를 끝까지 연결할 수 있습니다.", sessionSlug: "crud-02-controller-service-mapper-flow" }],
  keywords: ["create", "read detail", "generated id", "not found", "201 Created", "Location", "PRG", "selectKey", "useGeneratedKeys", "soft delete", "safe GET", "idempotency key", "read-your-write", "outbox"], topics,
  lab: {
    title: "transactional 게시글 create→Location GET과 visible detail gate 구축",
    scenario: "등록은 추정 group ID와 목록 redirect를 사용하고 상세 GET은 counter update와 visibility가 다른 select를 묶어 동시 등록, reload duplicate, missing/deleted, file/DB 부분 실패와 read-after-write 404가 발생합니다.",
    setup: ["세 원본 파일은 read-only hashes로 보존하고 exact package/routes/configuration/data는 maintained code에 복사하지 않습니다.", "CreateRequest/Command, BoardId/CreatedResult, visible Detail projection, application errors와 REST/page adapters를 준비합니다.", "지원 DB의 identity/sequence/generated keys와 JPA/MyBatis profiles, MockMvc와 proxy/cache/replica simulation을 준비합니다.", "blank/extra fields, concurrent creates, duplicate key replay, missing/deleted/other actor, file/commit/cache failures와 synthetic secrets를 fixture로 둡니다."],
    steps: ["원본 create/hit/detail/selectKey timeline과 side effects를 표시합니다.", "request allow-list, validation/auth와 invalid downstream calls 0을 검증합니다.", "DB/provider-generated identity를 선택하고 actual key/affected row를 service result로 회수합니다.", "MAX+1 group allocation을 concurrent test로 재현하고 atomic strategy/constraint로 교정합니다.", "board+metadata+outbox transaction과 temporary upload promotion/cleanup을 fault-test합니다.", "REST 201/Location/body와 page 303 PRG/form-error wire contracts를 실행합니다.", "visible/deleted/missing/forbidden detail query와 404 disclosure policy를 검증합니다.", "GET content와 deduplicated/bounded view event를 분리합니다.", "actor-scoped idempotency key same/different payload와 concurrent replay를 검증합니다.", "public response/view/log/APM에서 password/hash/path/raw content/SQL 값을 제거합니다.", "commit 직후 Location GET, replica lag, negative cache와 query/payload budgets를 검증합니다.", "wire/service/MyBatis/JPA/DB/concurrency/source provenance artifacts와 incident runbook을 제출합니다."],
    expectedResult: ["invalid/unauthorized create는 insert/key/file/outbox calls 0이고 stable 4xx/form error를 반환합니다.", "정상 create는 DB가 부여한 실제 identity, expected row 1와 commit 뒤 201+Location 또는 303 PRG를 반환합니다.", "동시 등록과 duplicate retry에서도 identity/group/idempotency invariants가 유지됩니다.", "GET은 visible resource만 200으로 반환하고 deleted/missing disclosure, view event와 dependency failure를 분리합니다.", "create→Location read가 cache/replica 정책을 포함해 작동하며 response/log artifacts에 secret/internal values가 없습니다."],
    cleanup: ["synthetic board/idempotency/outbox rows, caches, temporary/final test files와 test schemas를 제거합니다.", "workers/transactions/DataSource/test containers를 종료하고 orphan/connection/thread residual을 확인합니다.", "logs/traces/artifacts에서 synthetic password/hash/content/path/SQL markers가 0인지 검사합니다.", "로컬 원본 controller/service/mapper 파일은 변경하지 않습니다."],
    extensions: ["PostgreSQL RETURNING, MySQL generated keys와 Oracle sequence adapter parity를 비교합니다.", "ETag/If-Match를 CRUD04 optimistic concurrency로 연결합니다.", "durable outbox worker와 attachment reconciliation dashboard를 추가합니다.", "multi-region idempotency/read-your-write와 cache invalidation chaos test를 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java 예제를 실행하고 create/read의 identity·status·call count·visibility·replay invariant를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "created/found same id를 확인합니다.", "invalid insert 0을 확인합니다.", "MAX+1 duplicate와 atomic distinct를 비교합니다.", "201/303 Location을 비교합니다.", "deleted/missing 404 parity를 설명합니다.", "same-window view dedup을 확인합니다.", "same-key replay와 different payload conflict를 설명합니다."], hints: ["각 성공 출력 옆에 commit 전에는 확정할 수 없는 값이 무엇인지 표시하세요."], expectedOutcome: "등록과 상세를 HTTP·service·DB 증거로 끝까지 연결합니다.", solutionOutline: ["allow→validate→allocate→persist→commit→locate→read→observe 순서입니다."] },
    { difficulty: "응용", prompt: "원본 게시판 등록/상세 흐름을 generated-key, PRG/201, visible query와 idempotency가 있는 운영 설계로 교정하세요.", requirements: ["원본은 structural provenance로만 사용합니다.", "actual DB key strategy와 concurrent test를 둡니다.", "transaction/outbox/upload failure matrix를 실행합니다.", "REST/page wire contract를 분리합니다.", "soft-delete/404/GET metric 정책을 둡니다.", "idempotency/secret/cache/replica gates를 포함합니다.", "MockMvc+MyBatis/JPA+DB round trip을 통과합니다."], hints: ["등록 handler를 먼저 고치지 말고 생성된 resource identity와 최종 상태를 누가 확정하는지부터 정하세요."], expectedOutcome: "retry·동시성·부분 실패·cache/replica에서도 일관된 create/read 기능이 완성됩니다.", solutionOutline: ["audit→contract→generate→transact→publish→redirect→filter→replay→qualify 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 resource create/read governance와 release/incident gate를 작성하세요.", requirements: ["validation/auth/server-owned field 규칙을 둡니다.", "identity/key portability와 URL policy를 둡니다.", "transaction/external side-effect/outbox 규칙을 둡니다.", "201/Location/PRG/error/not-found 계약을 둡니다.", "GET safety/view analytics/idempotency를 정의합니다.", "secret/output/cache/replica/query budgets를 둡니다.", "wire/adapter/DB/concurrency/chaos/provenance gates와 runbook을 포함합니다."], hints: ["happy path뿐 아니라 client가 응답을 받지 못했지만 commit은 된 모호한 상태를 중심에 두세요."], expectedOutcome: "생성 여부와 조회 가능성을 장애 뒤에도 증명·복구할 수 있는 표준이 완성됩니다.", solutionOutline: ["identify→constrain→commit→represent→hide→deduplicate→observe→reconcile 순서입니다."] },
  ],
  nextSessions: ["crud-04-update-delete-concurrency"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["BoardController.java는 read-only로 220 lines/8,293 bytes, SHA-256 FA77CD0DF48BCFBDF7332BF9D222599D2323BEAD5B369E818757128058CB83F9를 확인했습니다.", "BoardServiceImpl.java는 read-only로 61 lines/1,688 bytes, SHA-256 431770CE49E24D0A546BD4B2850139313AF1CE5444EE82A9159B735944A7DF30을 확인했습니다.", "BoardMapper.xml은 read-only로 68 lines/3,161 bytes, SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6을 확인했습니다.", "원본의 create→redirect, auto-increment 설명과 insert-before MAX(primary-id)+1 group selectKey, detail GET의 hit update→select와 visibility 차이를 structural provenance로 사용했으며 package/route/configuration/data literals는 maintained examples에 복사하지 않았습니다.", "원본이 충분히 다루지 않는 actual generated-key return, concurrent allocation, REST 201+Location/explicit PRG, commit/external publication, idempotency, not-found disclosure, GET safety, output minimization, replica/cache와 failure qualification은 현재 공식 Spring/MyBatis/Jakarta/IETF/OWASP/JDK 문서와 synthetic examples로 보강했습니다.", "JDK-only examples는 Spring MVC wire behavior, AOP transaction, MyBatis/JPA generated-key timing, driver/database isolation, unique constraints, cache/replica와 crash behavior를 대체하지 않습니다."] },
});

export default session;
