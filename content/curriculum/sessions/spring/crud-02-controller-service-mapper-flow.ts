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
      { lines: `1-${first}`, explanation: "JDK 21 interfaces·records와 in-memory adapters로 HTTP adapter, application service와 persistence port를 분리합니다." },
      { lines: `${first + 1}-${second}`, explanation: "성공, validation short-circuit, mapper failure, transaction rollback, exception translation과 consistency path를 event/count로 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "민감 payload/SQL values 대신 layer·operation·outcome·call count·transaction state만 출력해 호출 흐름을 증명합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/MyBatis/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "mini adapters는 DispatcherServlet argument resolution, Spring transaction proxy, MyBatis SqlSession/driver와 real DB behavior를 대체하지 않습니다."] },
    experiments: [
      { change: "blank/duplicate/not-found/dependency failure와 mapper call count를 바꿉니다.", prediction: "layer contract가 명확하면 실패가 가장 가까운 owner에서 stable category로 멈추고 downstream call/commit이 제한됩니다.", result: "event order, status/category, calls, staged/committed rows와 rollback을 비교합니다." },
      { change: "같은 scenario를 MockMvc→actual service proxy→MyBatis mapper→supported DB로 실행합니다.", prediction: "binding, exception resolver, transaction synchronization과 SQL/driver evidence가 추가됩니다.", result: "HTTP status/headers/body, advisor/transaction events, statement id/binds/count를 request id로 연결합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "end-to-end-call-pipeline",
    title: "요청을 Controller→Service→Mapper→DB→응답의 유향 실행 그래프로 추적합니다",
    lead: "레이어 이름을 외우는 대신 입력·출력·예외·transaction·side effect가 어느 경계에서 바뀌는지 한 요청의 event timeline으로 증명합니다.",
    explanations: [
      "DispatcherServlet이 mapping된 controller를 호출하면 controller는 HTTP method/path/content와 transport DTO를 application command로 바꿉니다. service는 use-case invariant와 transaction을 소유하고 mapper port를 호출하며 mapper adapter는 statement id, bound parameters와 row/affected count를 persistence result로 변환합니다.",
      "정상 create path를 request received→binding→validation→service begin→mapper insert→key/result→commit→response/redirect 순서로 적습니다. 실패는 validation 전, mapper execution, transaction commit, view rendering처럼 phase마다 다른 side effect와 HTTP ownership을 가집니다.",
      "원본 controller/service/mapper XML을 read-only로 연결해 handler가 service를 호출하고 service가 mapper를 호출하는 실제 진행을 확인했습니다. maintained 설계에서는 원본 package/method literal을 복제하지 않고 structural flow와 책임 혼재를 provenance로 사용합니다.",
      "call graph는 source code만 보지 않고 runtime proxy와 transaction/advice를 포함합니다. caller→controller bean→service proxy→target→mapper proxy→SqlSession→driver→DB의 실제 class/advisor/statement를 안전한 metadata로 readback합니다.",
      "response가 200/redirect였다는 사실만으로 DB commit을 증명하지 못하고 SQL log 한 줄만으로 HTTP 성공을 증명하지 못합니다. request correlation, transaction outcome, affected/generated result와 final response를 하나의 synthetic scenario에서 함께 검증합니다.",
    ],
    concepts: [
      c("call pipeline", "한 요청이 adapter, use case, persistence와 response 단계를 통과하는 실행 순서입니다.", ["return/throw unwind를 포함합니다.", "phase별 owner가 있습니다."]),
      c("execution graph", "source dependency와 runtime proxy/advice/driver를 포함한 실제 호출 nodes와 edges입니다.", ["trace로 검증합니다.", "순환 의존을 찾습니다."]),
      c("correlation", "HTTP·service·transaction·SQL·response evidence가 같은 요청/operation임을 연결하는 식별 관계입니다.", ["raw user id와 다릅니다.", "bounded id를 사용합니다."]),
    ],
    codeExamples: [java("crud02-layer-trace", "세 계층 성공 호출과 반환 unwind", "Crud02LayerTrace.java", "controller adapter가 command를 만들고 service가 repository port를 호출한 뒤 created response로 돌아오는 event 순서를 실제 객체로 실행합니다.", String.raw`import java.util.*;

public class Crud02LayerTrace {
  record Request(String title) {}
  record Command(String title) {}
  record Created(long id, String title) {}
  interface BoardPort { long insert(String title); }
  static final class MapperAdapter implements BoardPort {
    private final List<String> events;
    MapperAdapter(List<String> events) { this.events=events; }
    public long insert(String title) { events.add("mapper:insert"); return 31L; }
  }
  static final class Service {
    private final BoardPort port; private final List<String> events;
    Service(BoardPort port, List<String> events) { this.port=port; this.events=events; }
    Created create(Command command) { events.add("service:begin"); long id=port.insert(command.title()); events.add("service:return"); return new Created(id, command.title()); }
  }
  static final class Controller {
    private final Service service; private final List<String> events;
    Controller(Service service, List<String> events) { this.service=service; this.events=events; }
    Created post(Request request) { events.add("controller:bind"); Created result=service.create(new Command(request.title().strip())); events.add("controller:response"); return result; }
  }
  public static void main(String[] args) {
    List<String> events = new ArrayList<>();
    Controller controller = new Controller(new Service(new MapperAdapter(events), events), events);
    Created created = controller.post(new Request(" layered flow "));
    System.out.println("created=" + created);
    System.out.println("events=" + events);
    System.out.println("direction=controller>service>port");
  }
}`, "created=Created[id=31, title=layered flow]\nevents=[controller:bind, service:begin, mapper:insert, service:return, controller:response]\ndirection=controller>service>port", ["local-board-controller", "local-board-service", "local-board-mapper", "spring-controller", "spring-handler-methods", "mybatis-mappers"] )],
    diagnostics: [
      d("로그에는 controller와 SQL이 있지만 어느 요청의 service/commit인지 연결되지 않습니다.", "각 계층이 독립 문장/값을 기록하고 correlation·phase schema가 없습니다.", ["request id propagation", "service/transaction events", "statement id", "response completion"], "server-generated bounded correlation과 operation/phase/outcome schema를 filter→controller→service→SQL observation에 연결합니다.", "한 synthetic request의 complete ordered event assertion을 둡니다."),
      d("200 response인데 실제 row가 없거나 rollback됐습니다.", "mapper return/transaction outcome 전에 response를 확정했거나 exception을 삼켰습니다.", ["return/commit order", "transaction status", "affected rows", "exception resolver"], "service proxy invocation과 commit이 완료된 뒤 result를 response로 mapping하고 rollback exception을 보존합니다.", "commit-failure와 readback contract test를 둡니다."),
    ],
    expertNotes: ["trace span은 설계를 보여주는 증거이지 잘못된 dependency direction을 정당화하지 않습니다.", "SQL text/value 전체 대신 statement id, duration bucket, row count와 error category를 사용합니다."],
  },
  {
    id: "controller-http-adapter",
    title: "Controller를 HTTP 해석·validation 결과·응답 선택에 한정합니다",
    lead: "controller가 pagination 계산, 파일 I/O, 암호화, SQL 결과 해석과 업무 상태 전이를 모두 수행하면 HTTP 테스트가 느리고 transaction/cleanup 경계가 찢어집니다.",
    explanations: [
      "controller는 path/query/header/body를 typed request DTO로 받고 BindingResult/validation을 확인해 service command를 호출합니다. 성공 result를 view model/redirect/ResponseEntity로, typed application failure를 exception handling contract로 넘깁니다.",
      "GET/POST mapping과 consumes/produces, required/default query parameters를 명시해 handler ambiguity와 silent coercion을 줄입니다. 같은 mutation을 @RequestMapping without method로 열지 않고 CSRF/authentication policy와 함께 unsafe method를 제한합니다.",
      "원본 controller에는 파일 경로/transfer, password encoding, page math, hit increment와 detail 조회가 함께 있습니다. 학습용 동작은 provenance로 설명하되 maintained controller는 UploadPort, encoder/policy, Paging use case와 view adapter로 분리합니다.",
      "validation 실패는 service 호출 없이 같은 form view/400 problem으로 종료하고 성공 redirect에는 context-safe URI builder와 flash message code를 사용합니다. user input을 redirect URL/message에 문자열 연결하지 않습니다.",
      "controller가 mapper/domain exception class를 직접 catch하지 않습니다. application-level NotFound/Conflict/Validation/Dependency categories를 global handler가 HTTP로 mapping해 transport와 persistence vocabulary를 분리합니다.",
    ],
    concepts: [
      c("HTTP adapter", "HTTP representation과 application input/output을 상호 변환하는 inbound adapter입니다.", ["business rule을 최소화합니다.", "status/header/view를 소유합니다."]),
      c("handler contract", "method/path/consumes/produces/arguments/return과 validation/error를 합친 request mapping 계약입니다.", ["명시적으로 테스트합니다.", "method security와 연결합니다."]),
      c("short-circuit", "binding/validation/authentication 실패에서 use case와 side effect를 호출하지 않고 응답을 확정하는 동작입니다.", ["terminal해야 합니다.", "call count로 증명합니다."]),
    ],
    codeExamples: [java("crud02-validation-short-circuit", "invalid request에서 service 호출 0", "Crud02ValidationShortCircuit.java", "controller adapter가 blank title을 transport error로 종료하고 valid request만 service에 전달하는 두 경로를 실행합니다.", String.raw`import java.util.concurrent.atomic.*;

public class Crud02ValidationShortCircuit {
  record Request(String title) {}
  record HttpResult(int status, String code) {}
  interface UseCase { void create(String title); }
  static HttpResult post(Request request, UseCase useCase) {
    if (request.title() == null || request.title().isBlank()) return new HttpResult(400, "TITLE_REQUIRED");
    useCase.create(request.title().strip());
    return new HttpResult(201, "CREATED");
  }
  public static void main(String[] args) {
    AtomicInteger calls = new AtomicInteger();
    UseCase service = title -> calls.incrementAndGet();
    System.out.println("invalid=" + post(new Request("  "), service));
    System.out.println("calls-after-invalid=" + calls.get());
    System.out.println("valid=" + post(new Request("layered"), service));
    System.out.println("calls-after-valid=" + calls.get());
  }
}`, "invalid=HttpResult[status=400, code=TITLE_REQUIRED]\ncalls-after-invalid=0\nvalid=HttpResult[status=201, code=CREATED]\ncalls-after-valid=1", ["spring-request-mapping", "spring-handler-methods", "spring-validation", "owasp-input-validation"] )],
    diagnostics: [
      d("빈 제목인데 file write/password encode/SQL이 먼저 실행됩니다.", "validation보다 side effects가 앞서거나 controller가 BindingResult를 무시했습니다.", ["handler statement order", "service/upload/encoder calls", "binding errors", "cleanup"], "validation/auth success 뒤 하나의 use-case command만 호출하고 side effects를 service protocol로 이동합니다.", "invalid input→all downstream calls 0 test를 둡니다."),
      d("같은 URL이 GET으로도 저장을 수행합니다.", "method를 제한하지 않은 broad mapping 또는 link-triggered mutation입니다.", ["RequestMapping methods", "route inventory", "CSRF policy", "access logs"], "safe read와 unsafe mutation을 GET/POST 등 HTTP semantics에 맞게 분리하고 CSRF/auth을 적용합니다.", "method matrix와 405/Allow contract tests를 둡니다."),
    ],
    expertNotes: ["thin controller는 줄 수가 적다는 뜻이 아니라 transport concern만 충분히 명시한다는 뜻입니다.", "view name과 redirect도 response contract이므로 magic string을 테스트와 route manifest로 관리합니다."],
  },
  {
    id: "service-usecase-owner",
    title: "Service를 use-case invariant·orchestration·transaction의 단일 owner로 만듭니다",
    lead: "mapper를 한 줄 호출하는 service도 dependency boundary를 만들 수 있지만 규칙과 transaction이 controller/XML에 흩어지면 이름뿐인 계층이 됩니다.",
    explanations: [
      "application service method는 createBoard, readBoard처럼 사용자가 인식하는 원자적 작업을 표현합니다. actor/command를 받고 authorization, domain construction, repository calls, side-effect protocol과 result를 orchestration합니다.",
      "service는 HttpServletRequest, Model, redirect view 이름과 HTTP status를 알지 않고 mapper XML/SQLException 세부도 알지 않습니다. transport와 persistence failure를 application vocabulary로 바꾸는 adapter/policy를 둡니다.",
      "transaction boundary는 여러 mapper calls가 하나의 업무 invariant를 만드는 service public method에 둡니다. controller에서 각각 hit update와 detail select를 호출하거나 mapper마다 transaction을 열면 atomicity와 isolation 목적을 설명하기 어렵습니다.",
      "원본 service는 mapper pass-through와 page map 조립을 수행합니다. 이는 call path provenance로 유용하지만 maintained design은 typed query/command와 explicit result, affected row checks, visibility policy와 transaction을 service contract에 둡니다.",
      "service instance는 보통 singleton이므로 request-specific mutable fields를 저장하지 않습니다. command/result/local variables를 사용하고 caches/counters가 필요하면 thread-safe dedicated component와 consistency policy를 둡니다.",
    ],
    concepts: [
      c("application service", "하나의 사용자 use case를 domain/persistence ports로 조정하는 application-layer component입니다.", ["HTTP와 SQL을 모릅니다.", "transaction 후보입니다."]),
      c("use-case invariant", "operation이 성공으로 끝날 때 반드시 함께 성립해야 하는 업무 조건과 side effects입니다.", ["transaction/compensation을 정합니다.", "result에 반영합니다."]),
      c("orchestration", "여러 domain operations와 ports를 순서·failure policy에 맞게 호출해 use case를 완성하는 일입니다.", ["controller에서 분리합니다.", "workflow를 테스트합니다."]),
    ],
    diagnostics: [
      d("controller마다 같은 password/visibility/affected-row 규칙이 다릅니다.", "use-case policy가 application service가 아니라 handlers에 복제됐습니다.", ["duplicate checks", "service API", "alternate entry points", "batch/message paths"], "규칙을 service/domain policy에 모으고 모든 inbound adapter가 같은 command를 호출합니다.", "HTTP/batch/message entry point parity tests를 둡니다."),
      d("동시 요청의 제목/사용자 정보가 다른 응답에 섞입니다.", "singleton service/controller field에 request state를 저장했습니다.", ["mutable instance fields", "bean scope", "parallel trace", "caches"], "request data를 immutable command/local variables로 전달하고 shared state를 제거하거나 thread-safe store로 분리합니다.", "barrier 기반 cross-request isolation test를 둡니다."),
    ],
    expertNotes: ["pass-through service가 항상 불필요한 것은 아니며 stable application port와 향후 정책 owner로서 가치가 있는지 설명해야 합니다.", "service method가 커지면 layer를 더 만드는 대신 use case/aggregate/side-effect protocol을 먼저 분해합니다."],
  },
  {
    id: "mapper-persistence-adapter",
    title: "Mapper를 typed persistence port의 구현으로 두고 SQL contract를 좁힙니다",
    lead: "mapper는 단순 DAO 이름이 아니라 statement id·parameter·result·row count·database error를 application port로 번역하는 outbound adapter입니다.",
    explanations: [
      "service는 BoardRepository/BoardQuery 같은 application-owned interface에 의존하고 MyBatis mapper adapter가 이를 구현하거나 mapper interface를 narrow port로 사용합니다. dependency direction은 framework adapter가 application contract를 향합니다.",
      "mapper XML namespace/id, Java method parameter names/@Param, #{binding}, resultMap/type와 return cardinality를 하나의 contract로 검증합니다. Map parameter는 편하지만 key typo/type drift를 compile time에 잡지 못하므로 query record를 우선합니다.",
      "INSERT/UPDATE/DELETE 반환값은 affected rows로 해석하고 create generated key는 별도 contract로 회수합니다. 0 rows, >1 rows와 driver batch count를 성공 1과 구분해 service가 NotFound/Conflict/Integrity failure로 처리합니다.",
      "SQLException/vendor exception은 Spring/MyBatis translation이 제공하는 분류를 확인하되 constraint name/message를 HTTP에 직접 노출하지 않습니다. repository adapter가 duplicate/foreign-key/transient dependency를 stable persistence error로 바꿉니다.",
      "SELECT *와 broad result object는 schema coupling/over-fetch를 만들고 `${}`는 raw substitution 위험이 있습니다. 명시 columns, #{}, bounded sort allow-list와 query-specific projection을 사용합니다.",
    ],
    concepts: [
      c("persistence port", "application이 필요로 하는 저장/조회 capability를 domain-friendly input/output으로 정의한 outbound interface입니다.", ["SQL 기술을 숨깁니다.", "adapter가 구현합니다."]),
      c("statement contract", "mapper method와 XML statement의 id, parameter binding, SQL, result/row count를 합친 계약입니다.", ["startup/integration에서 검증합니다.", "cardinality를 포함합니다."]),
      c("affected rows", "DML이 실제로 변경했다고 driver/database가 보고한 행 수입니다.", ["업무 성공과 비교합니다.", "0/>1을 처리합니다."]),
    ],
    codeExamples: [java("crud02-affected-rows", "mapper row count를 application result로 변환", "Crud02AffectedRows.java", "update/delete adapter의 1/0/2 row 결과를 UPDATED/NOT_FOUND/INTEGRITY_ERROR로 변환하는 cardinality contract를 실행합니다.", String.raw`public class Crud02AffectedRows {
  enum Outcome { UPDATED, NOT_FOUND, INTEGRITY_ERROR }
  static Outcome interpret(int affected) {
    if (affected == 1) return Outcome.UPDATED;
    if (affected == 0) return Outcome.NOT_FOUND;
    return Outcome.INTEGRITY_ERROR;
  }
  public static void main(String[] args) {
    System.out.println("rows-1=" + interpret(1));
    System.out.println("rows-0=" + interpret(0));
    System.out.println("rows-2=" + interpret(2));
    System.out.println("blind-success=false");
  }
}`, "rows-1=UPDATED\nrows-0=NOT_FOUND\nrows-2=INTEGRITY_ERROR\nblind-success=false", ["local-board-service", "local-board-mapper", "mybatis-mapper-xml", "mybatis-java-api"] )],
    diagnostics: [
      d("mapper update가 0 rows인데 service/controller가 성공 redirect를 보냅니다.", "DML return count를 무시하거나 void로 감췄습니다.", ["mapper return type", "service branch", "where predicates", "actual row state"], "expected cardinality를 port contract에 두고 0→NotFound/Conflict, >1→integrity incident로 변환합니다.", "0/1/>1 affected-row integration tests를 둡니다."),
      d("parameter 이름 변경 뒤 BindingException 또는 null SQL bind가 납니다.", "Map/string key와 XML #{name} contract가 compile-time 연결되지 않았습니다.", ["mapper signature/@Param", "XML placeholders", "compiled parameter metadata", "bound SQL"], "typed query record 또는 explicit @Param을 사용하고 mapper context startup/DB integration을 실행합니다.", "mapper interface/XML contract test와 statement inventory gate를 둡니다."),
    ],
    expertNotes: ["application port와 MyBatis mapper interface를 반드시 두 겹으로 만들 필요는 없지만 vendor/cardinality/error vocabulary가 새면 adapter를 분리합니다.", "statement timeout/fetch size는 global magic 값이 아니라 use-case latency/row budget과 연결합니다."],
  },
  {
    id: "dependency-direction-constructor-injection",
    title: "Constructor injection과 application-owned interfaces로 의존 방향을 고정합니다",
    lead: "field injection은 객체가 완성되기 전 null 상태와 숨은 dependencies를 만들고 controller→service→mapper 패키지 참조만으로 architecture를 보장하지 못합니다.",
    explanations: [
      "controller constructor는 CreateBoardUseCase 같은 inbound application interface를, service constructor는 BoardRepository/Clock/Encoder/UploadPort 같은 outbound ports를 요구합니다. required dependency가 생성 시점에 보이고 final field로 유지됩니다.",
      "application layer가 MyBatis/Spring MVC class를 import하지 않게 module/package architecture test를 둡니다. adapter가 application interface를 구현하며 composition root/Spring configuration이 concrete bean을 연결합니다.",
      "interface를 모든 class 앞에 기계적으로 만들지 않습니다. 대체 구현, technology boundary, test seam 또는 module API라는 이유가 있는 곳에 사용하고 내부 pure collaborator는 concrete final class도 가능합니다.",
      "circular dependency는 service 책임이 뒤섞였거나 event/workflow boundary가 없다는 신호입니다. lazy injection으로 숨기기 전에 use case, query와 command, policy/port를 분리합니다.",
      "원본 controller/service의 field injection을 그대로 답습하지 않고 constructor graph를 unit test에서 직접 조립합니다. Spring context test에서는 bean count, proxy interface/runtime target과 cycle absence를 확인합니다.",
    ],
    concepts: [
      c("dependency direction", "고수준 application policy가 저수준 web/DB implementation에 의존하지 않고 adapter가 policy contract를 향하는 구조입니다.", ["ports가 경계를 만듭니다.", "architecture test로 고정합니다."]),
      c("constructor injection", "필수 collaborator를 constructor parameter로 받아 완전한 객체만 생성하는 주입 방식입니다.", ["final field가 가능합니다.", "unit wiring이 쉽습니다."]),
      c("composition root", "concrete adapters와 application components를 선택해 object graph를 조립하는 최외곽 설정 지점입니다.", ["business code와 분리합니다.", "profiles를 검증합니다."]),
    ],
    diagnostics: [
      d("unit test에서 service를 new 했더니 mapper null로 늦게 NPE가 납니다.", "required dependency가 field injection으로 숨겨졌습니다.", ["constructors", "Autowired fields", "null failure phase", "test setup"], "required dependencies를 non-null constructor parameters/final fields로 옮깁니다.", "constructor null rejection과 no-field-injection architecture rule을 둡니다."),
      d("application service가 HttpServletRequest/Model/SqlSession을 직접 import합니다.", "ports/adapters boundary 없이 framework types가 core API로 침투했습니다.", ["module imports", "method signatures", "test dependencies", "technology replacement impact"], "primitive/domain command/result와 application-owned ports로 감싸고 framework adapter에서 mapping합니다.", "forbidden package dependency tests를 둡니다."),
    ],
    expertNotes: ["constructor parameter가 너무 많으면 service가 많은 policy/side effect를 소유한다는 설계 feedback입니다.", "test double이 쉽다는 이유만으로 port를 만들기보다 architecture ownership과 contract를 먼저 정의합니다."],
  },
  {
    id: "layer-mapping-contracts",
    title: "계층 사이마다 transport command·domain·row·result를 명시적으로 mapping합니다",
    lead: "BoardVO 하나가 controller parameter와 mapper parameter/result, JSP model을 모두 맡으면 한 계층의 field가 모든 호출 signature를 오염시킵니다.",
    explanations: [
      "controller는 CreateRequest→CreateCommand와 CreatedResult→Response/redirect를 mapping합니다. service는 command→domain/value objects와 domain→port input을 조정하고 mapper adapter는 persistence row/keys를 domain-friendly result로 바꿉니다.",
      "mapping 방향마다 field allow-list, default, null/unknown, sensitivity와 failure owner를 정합니다. controller가 DB active code를 해석하거나 mapper가 localized HTTP message를 만들지 않습니다.",
      "list/detail/create/update가 같은 object를 공유하지 않고 query/use-case별 projection을 사용합니다. 필요한 field만 fetch/return하면 over-posting, over-fetch와 accidental serialization을 함께 줄입니다.",
      "Map<String,Object>는 동적 query에 유연하지만 key/type contract가 약합니다. PageQuery(limit, offset), BoardKey(id), CreateRow(...) 같은 records와 mapper @Param/resultMap을 사용해 compiler와 tests가 경계를 봅니다.",
      "mapping cost가 보인다는 이유로 entity를 반환하는 shortcut을 쓰지 않습니다. mapper benchmark보다 query count, payload size, change blast radius와 secret exposure risk를 함께 측정합니다.",
    ],
    concepts: [
      c("command", "검증된 actor intent와 use-case input을 transport 기술과 분리해 표현한 application object입니다.", ["server-owned context를 포함할 수 있습니다.", "entity가 아닙니다."]),
      c("result", "use case 성공 결과를 HTTP/CLI/message 같은 adapter가 각 representation으로 바꿀 수 있게 한 application output입니다.", ["HTTP status를 모를 수 있습니다.", "secret를 최소화합니다."]),
      c("query object", "mapper/repository 조회 조건을 typed fields와 invariant로 표현한 persistence port input입니다.", ["Map key typo를 줄입니다.", "pagination/sort bounds를 가집니다."]),
    ],
    diagnostics: [
      d("pagination Map의 limit/offset key typo가 운영 SQL에서만 null로 드러납니다.", "string-key Map을 계층 contract로 사용했습니다.", ["Map construction", "XML placeholders", "null JDBC types", "test coverage"], "typed PageQuery record와 explicit mapper binding으로 바꿉니다.", "compile-visible query object와 boundary/null/overflow DB tests를 둡니다."),
      d("detail response에 create-only password/file input이 남습니다.", "operation-specific types 대신 all-purpose BoardVO를 재사용했습니다.", ["request/result class fields", "serializer/view", "mapper projection", "log toString"], "CreateRequest/BoardDetail/BoardRow 등 use-case projection으로 분리하고 forbidden fields를 제거합니다.", "operation별 schema snapshots와 secret canary를 둡니다."),
    ],
    expertNotes: ["DTO 폭증은 use-case 수가 보이는 정상 결과일 수 있지만 이름/mapper owner/generation policy로 탐색성을 유지합니다.", "query-side projection과 command-side domain model을 다르게 두는 것은 full CQRS를 도입한다는 뜻이 아닙니다."],
  },
  {
    id: "transaction-boundary-rollback",
    title: "Transaction을 service use-case 경계에 두고 commit·rollback을 반환 경로와 연결합니다",
    lead: "여러 mapper call 중 앞 단계만 commit되거나 controller가 transaction 밖에서 side effect를 수행하면 부분 성공을 error view 하나로 되돌릴 수 없습니다.",
    explanations: [
      "Spring declarative transaction은 service proxy method invocation을 감싸 begin→business mapper calls→commit/rollback을 수행합니다. self-invocation, checked exception rules, read-only/isolation/propagation과 commit-time failure를 actual advisor/test에서 확인합니다.",
      "DB transaction 안에는 동일 DataSource/transaction manager에 참여하는 mapper calls를 둡니다. file/object storage/email 같은 외부 side effect는 rollback되지 않으므로 quarantine/outbox/idempotency/compensation protocol로 분리합니다.",
      "예외를 catch해 null/0을 반환하면 transaction interceptor가 정상 완료로 보고 commit할 수 있습니다. 복구 가능한 expected failure가 아니면 typed exception을 보존하고 rollback rule을 business hierarchy와 맞춥니다.",
      "read method의 @Transactional(readOnly=true)는 provider/driver 최적화 hint일 수 있으며 consistency snapshot을 자동 보장한다고 단정하지 않습니다. database isolation, query count와 replica routing을 별도 검증합니다.",
      "transaction completion 뒤에만 response success를 확정합니다. target return 후 commit이 실패할 수 있으므로 controller가 service invocation 전체의 exception handling을 거쳐 2xx/redirect를 만듭니다.",
    ],
    concepts: [
      c("transaction boundary", "함께 commit 또는 rollback되어야 할 DB operations를 감싸는 application use-case 범위입니다.", ["service public method가 후보입니다.", "외부 side effect와 구분합니다."]),
      c("unit of work", "한 업무 작업에서 변경을 모아 성공 시 적용하고 실패 시 버리는 상태/자원 집합입니다.", ["persistence context/session과 연결됩니다.", "commit phase가 있습니다."]),
      c("commit-time failure", "business method가 정상 반환한 뒤 transaction commit/flush 단계에서 제약·연결 오류가 발생하는 실패입니다.", ["response 전 처리합니다.", "target return과 성공을 구분합니다."]),
    ],
    codeExamples: [java("crud02-transaction", "두 저장 단계의 commit과 rollback", "Crud02Transaction.java", "in-memory unit of work가 두 row를 staging한 뒤 성공하면 함께 commit하고 두 번째 단계 실패 시 모두 rollback하는 경로를 실행합니다.", String.raw`import java.util.*;

public class Crud02Transaction {
  static final class Store {
    final List<String> committed = new ArrayList<>();
    void transact(boolean failSecond) {
      List<String> staged = new ArrayList<>();
      try {
        staged.add("board");
        if (failSecond) throw new IllegalStateException("AUDIT_INSERT_FAILED");
        staged.add("audit");
        committed.addAll(staged);
        System.out.println("tx=COMMIT|staged=" + staged);
      } catch (RuntimeException error) {
        staged.clear();
        System.out.println("tx=ROLLBACK|cause=" + error.getMessage());
      }
    }
  }
  public static void main(String[] args) {
    Store success = new Store(); success.transact(false);
    System.out.println("success-rows=" + success.committed);
    Store failure = new Store(); failure.transact(true);
    System.out.println("failure-rows=" + failure.committed);
    System.out.println("partial-commit=false");
  }
}`, "tx=COMMIT|staged=[board, audit]\nsuccess-rows=[board, audit]\ntx=ROLLBACK|cause=AUDIT_INSERT_FAILED\nfailure-rows=[]\npartial-commit=false", ["spring-transactions", "mybatis-transactions", "local-board-service"] )],
    diagnostics: [
      d("게시글 row는 생겼지만 audit/attachment metadata는 없습니다.", "관련 mapper calls가 서로 다른/no transaction이거나 exception을 삼켰습니다.", ["service proxy/annotation", "DataSource/transaction manager", "auto-commit/session", "exception path"], "하나의 service transaction에 DB invariant를 묶고 외부 side effects는 outbox/compensation으로 설계합니다.", "각 mapper/commit 단계 fault injection과 row-state reconciliation tests를 둡니다."),
      d("service가 exception을 catch해 error code를 반환했는데 row가 commit됩니다.", "transaction interceptor까지 Throwable이 전파되지 않아 정상 return으로 처리됐습니다.", ["catch/return code", "rollback rules", "transaction status", "commit events"], "typed exception을 재throw하거나 명시 rollback-only policy를 제한적으로 사용하고 controller handler에서 변환합니다.", "exception type별 commit/rollback matrix를 둡니다."),
    ],
    expertNotes: ["transaction을 길게 늘여 HTTP/file/network wait를 포함하지 말고 DB lock duration과 retry semantics를 측정합니다.", "transaction annotation이 보인다는 사실보다 실제 proxy 진입, manager/resource participation과 outcome이 증거입니다."],
  },
  {
    id: "exception-translation-http-contract",
    title: "Persistence 실패를 application category로 번역하고 HTTP 표현은 controller advice가 소유합니다",
    lead: "SQLException/MyBatis exception이나 mapper의 null을 controller가 직접 해석하면 vendor detail이 노출되고 같은 실패가 endpoint마다 다른 status가 됩니다.",
    explanations: [
      "repository adapter는 duplicate key, foreign key, timeout/connection, invalid mapping과 unknown database failure를 stable persistence/application exception으로 번역합니다. constraint/message/SQL을 public error에 넣지 않습니다.",
      "service는 NotFound, Conflict, Validation, Forbidden, DependencyUnavailable와 Bug처럼 use-case 의미를 보존하고 transaction rollback signal을 유지합니다. fallback/null은 method contract에 명시된 경우만 사용합니다.",
      "@ControllerAdvice는 application category를 400/403/404/409/503/500과 HTML error view 또는 ProblemDetail JSON으로 렌더링합니다. Accept/route별 representation은 달라도 stable error code와 correlation은 같습니다.",
      "commit-time exception도 mapper 호출 line이 아니라 service proxy unwind에서 발생할 수 있습니다. controller local try/catch가 mapper만 감싸는 설계로는 처리되지 않으므로 global resolver boundary를 사용합니다.",
      "error logs는 category, operation, request id, dependency/transaction phase와 safe cause class를 한 번 기록합니다. raw params, password/content, SQL/stack은 restricted diagnostics policy 밖에 노출하지 않습니다.",
    ],
    concepts: [
      c("exception translation", "저수준 technology/vendor failure를 상위 계층이 이해하는 stable category로 바꾸되 cause와 rollback 의미를 보존하는 처리입니다.", ["adapter 경계에서 합니다.", "public message와 분리합니다."]),
      c("application error", "특정 HTTP/DB 기술 없이 use case 실패 의미를 나타내는 typed error/result입니다.", ["NotFound/Conflict 등이 있습니다.", "controller advice가 표현합니다."]),
      c("error representation", "동일 error taxonomy를 HTML view나 structured API body와 status/header로 렌더링한 외부 계약입니다.", ["content negotiation을 따릅니다.", "내부 cause를 숨깁니다."]),
    ],
    codeExamples: [java("crud02-error-translation", "mapper failure→application error→HTTP status", "Crud02ErrorTranslation.java", "duplicate/dependency/unknown persistence failures가 application category를 거쳐 409/503/500으로 변환되고 raw message는 출력되지 않는 경로를 실행합니다.", String.raw`public class Crud02ErrorTranslation {
  enum DbFailure { DUPLICATE, UNAVAILABLE, UNKNOWN }
  static final class AppError extends RuntimeException {
    final String code; AppError(String code) { this.code=code; }
  }
  static AppError translate(DbFailure failure) {
    return switch (failure) {
      case DUPLICATE -> new AppError("BOARD_CONFLICT");
      case UNAVAILABLE -> new AppError("DEPENDENCY_UNAVAILABLE");
      case UNKNOWN -> new AppError("INTERNAL_ERROR");
    };
  }
  static int status(AppError error) {
    return switch (error.code) { case "BOARD_CONFLICT" -> 409; case "DEPENDENCY_UNAVAILABLE" -> 503; default -> 500; };
  }
  public static void main(String[] args) {
    for (DbFailure failure : DbFailure.values()) {
      AppError error = translate(failure);
      System.out.println(failure + "=" + status(error) + "|" + error.code);
    }
    System.out.println("sql-message-exposed=false");
  }
}`, "DUPLICATE=409|BOARD_CONFLICT\nUNAVAILABLE=503|DEPENDENCY_UNAVAILABLE\nUNKNOWN=500|INTERNAL_ERROR\nsql-message-exposed=false", ["spring-error-responses", "spring-transactions", "mybatis-transactions", "rfc-http-semantics"] )],
    diagnostics: [
      d("API body에 SQL, table/constraint와 stack trace가 보입니다.", "controller가 persistence exception message를 그대로 response로 반환했습니다.", ["exception handler body", "cause/message", "logs/APM", "response samples"], "stable application code와 generic public detail만 반환하고 restricted internal event에 safe cause를 연결합니다.", "synthetic SQL/secret marker가 public response 0건인지 검사합니다."),
      d("DB timeout이 404 또는 200 empty로 보입니다.", "dependency failure를 not found/null과 같은 결과로 뭉갰습니다.", ["mapper exception handling", "Optional/null path", "transaction outcome", "HTTP mapping"], "absent row와 dependency failure를 distinct result/errors로 유지해 404와 503/500을 구분합니다.", "no-row/timeout/connection/commit failure matrix를 둡니다."),
    ],
    expertNotes: ["exception translation이 원 cause를 지운다는 뜻은 아니며 cause chain은 restricted diagnostics에서 보존합니다.", "재시도 가능 여부는 status 하나가 아니라 operation idempotency, Retry-After와 attempt budget을 포함합니다."],
  },
  {
    id: "read-consistency-query-policy",
    title: "count·list·detail·status 변경이 같은 visibility와 snapshot 정책을 쓰게 합니다",
    lead: "원본 SQL은 count에서 active 조건을 적용하지만 list/detail에 동일 조건이 없어 삭제 상태가 화면마다 다르게 보일 수 있습니다.",
    explanations: [
      "count와 list는 동일 search/visibility predicate와 authorization scope를 공유해야 pagination total과 rows가 일치합니다. SQL fragment reuse만 믿지 말고 두 query의 semantic predicate contract를 테스트합니다.",
      "detail query도 active/deleted/tenant/owner visibility를 적용하고 관리자 조회는 별도 explicit query로 분리합니다. controller가 조회 뒤 active를 검사하면 existence leak과 over-fetch/cache inconsistency가 생깁니다.",
      "count→list 사이 concurrent insert/delete가 있으면 READ COMMITTED에서 total과 page가 달라질 수 있습니다. product가 허용할지 same transaction/snapshot, cursor pagination 또는 approximate total을 쓸지 정합니다.",
      "조회수 증가와 상세 조회를 GET 한 경로에 묶으면 safe method, cache/prefetch/retry가 side effect를 반복할 수 있습니다. view metric을 analytics/event/deduplicated command로 분리하거나 명시된 약한 consistency를 채택합니다.",
      "visibility predicate와 query count는 integration fixtures에서 active/deleted/other tenant, boundary page와 concurrent change를 포함해 검증합니다. SQL text snapshot보다 반환 semantics를 우선합니다.",
    ],
    concepts: [
      c("visibility policy", "어떤 actor/use case가 어떤 상태/tenant의 row를 조회할 수 있는지 정한 공통 predicate입니다.", ["list/detail/count에 일관됩니다.", "관리자 query를 분리합니다."]),
      c("read snapshot", "여러 query가 관찰하는 database state의 일관성 범위입니다.", ["isolation에 의존합니다.", "product tolerance를 정합니다."]),
      c("safe method", "요청 의도가 server state 변경이 아닌 HTTP method 성질입니다.", ["GET/HEAD 등이 해당합니다.", "analytics side effect를 별도 평가합니다."]),
    ],
    codeExamples: [java("crud02-visibility-consistency", "count·list·detail 공통 visibility", "Crud02VisibilityConsistency.java", "VISIBLE/DELETED rows에서 동일 predicate를 사용한 count, list와 detail 결과가 일치하는 read policy를 실행합니다.", String.raw`import java.util.*;

public class Crud02VisibilityConsistency {
  enum State { VISIBLE, DELETED }
  record Row(long id, String title, State state) {}
  static boolean visible(Row row) { return row.state() == State.VISIBLE; }
  static long count(List<Row> rows) { return rows.stream().filter(Crud02VisibilityConsistency::visible).count(); }
  static List<Long> list(List<Row> rows) { return rows.stream().filter(Crud02VisibilityConsistency::visible).map(Row::id).toList(); }
  static Optional<Row> detail(List<Row> rows, long id) { return rows.stream().filter(row -> row.id()==id).filter(Crud02VisibilityConsistency::visible).findFirst(); }
  public static void main(String[] args) {
    List<Row> rows = List.of(new Row(1,"one",State.VISIBLE), new Row(2,"two",State.DELETED), new Row(3,"three",State.VISIBLE));
    System.out.println("count=" + count(rows));
    System.out.println("list=" + list(rows));
    System.out.println("detail-1=" + detail(rows,1).isPresent());
    System.out.println("detail-2=" + detail(rows,2).isPresent());
    System.out.println("predicate-shared=true");
  }
}`, "count=2\nlist=[1, 3]\ndetail-1=true\ndetail-2=false\npredicate-shared=true", ["local-board-controller", "local-board-mapper", "mybatis-mapper-xml", "rfc-http-semantics"] )],
    diagnostics: [
      d("total은 10인데 page에 삭제 row가 섞이거나 detail로 접근됩니다.", "count/list/detail SQL의 visibility predicates가 다릅니다.", ["three statements", "active/tenant filters", "fixtures", "cache"], "application-owned visibility query policy와 shared tested predicates를 적용하고 관리자 path를 분리합니다.", "same fixture count/list/detail semantic tests를 둡니다."),
      d("링크 preview/crawler만으로 조회수가 증가합니다.", "GET detail handler가 mandatory counter mutation을 함께 수행합니다.", ["GET side effects", "prefetch/cache/retry", "counter deduplication", "analytics requirements"], "조회 metric을 deduplicated event/analytics로 분리하거나 explicit mutation contract를 설계합니다.", "HEAD/prefetch/retry/crawler fixtures와 counter policy tests를 둡니다."),
    ],
    expertNotes: ["SQL fragment 재사용은 predicate drift를 줄이지만 authorization context와 query plan을 함께 검증합니다.", "count exactness는 비용이 크므로 UX가 approximate/no-total을 허용하는지 CRUD05에서 확장합니다."],
  },
  {
    id: "safe-observability-request-correlation",
    title: "계층 관측성을 값 없는 operation·phase·outcome·cardinality schema로 설계합니다",
    lead: "controller DTO, mapper parameter와 SQL을 통째로 로그에 넣으면 password·content가 유출되고 요청량만큼 고유 label이 늘어납니다.",
    explanations: [
      "server가 생성하거나 엄격히 검증한 request/trace id를 filter에서 시작해 application context와 SQL observation까지 전달합니다. 외부 header를 길이/문자 제한 없이 metric label/log key로 사용하지 않습니다.",
      "controller event는 method/route template/status/validation category, service는 operation/outcome/transaction phase, mapper는 statement id/duration bucket/row count/error category를 기록합니다. raw path id, writer/title/content/password와 SQL bind values는 기본적으로 제외합니다.",
      "duration은 monotonic clock difference, timestamps는 wall clock을 사용하고 high-cardinality fields를 metrics tags에서 제거합니다. trace sample의 restricted attributes에도 sensitivity/retention policy를 적용합니다.",
      "동일 error를 controller/service/mapper에서 세 번 stack trace로 기록하지 않습니다. 가장 의미 있는 boundary가 한 번 structured error를 기록하고 하위 spans/events는 status/category만 남깁니다.",
      "관측 backend failure가 business result/exception을 덮지 않게 bounded fail-safe를 둡니다. logging/metric exporter latency와 allocation을 load test하고 sampling/drop behavior를 명시합니다.",
    ],
    concepts: [
      c("route template", "실제 resource id 값이 아닌 /boards/{id}처럼 bounded HTTP operation label입니다.", ["cardinality를 제한합니다.", "metrics에 적합합니다."]),
      c("structured event", "고정 schema의 operation, phase, outcome와 bounded metadata로 기록한 관측 단위입니다.", ["값 allow-list를 둡니다.", "계층 correlation을 지원합니다."]),
      c("cardinality budget", "metric/log/trace field가 만들 수 있는 distinct values의 허용 범위입니다.", ["IDs를 tag로 피합니다.", "production alert를 둡니다."]),
    ],
    codeExamples: [java("crud02-safe-events", "세 계층의 bounded correlation events", "Crud02SafeEvents.java", "raw payload 없이 동일 request id와 route/operation/statement/outcome만 연결한 event schema를 출력합니다.", String.raw`import java.util.*;

public class Crud02SafeEvents {
  record Event(String requestId, String layer, String operation, String outcome, Map<String,String> fields) {}
  public static void main(String[] args) {
    String requestId = "req-0007";
    List<Event> events = List.of(
      new Event(requestId,"controller","POST /boards","ACCEPTED",Map.of("validation","valid")),
      new Event(requestId,"service","board.create","COMMITTED",Map.of("transaction","commit")),
      new Event(requestId,"mapper","board.insert","SUCCESS",Map.of("rows","1")),
      new Event(requestId,"controller","POST /boards","CREATED",Map.of("status","201")));
    events.forEach(System.out::println);
    System.out.println("same-correlation=" + (events.stream().map(Event::requestId).distinct().count()==1));
    System.out.println("raw-values-present=false");
  }
}`, "Event[requestId=req-0007, layer=controller, operation=POST /boards, outcome=ACCEPTED, fields={validation=valid}]\nEvent[requestId=req-0007, layer=service, operation=board.create, outcome=COMMITTED, fields={transaction=commit}]\nEvent[requestId=req-0007, layer=mapper, operation=board.insert, outcome=SUCCESS, fields={rows=1}]\nEvent[requestId=req-0007, layer=controller, operation=POST /boards, outcome=CREATED, fields={status=201}]\nsame-correlation=true\nraw-values-present=false", ["spring-controller", "spring-transactions", "mybatis-java-api", "rfc-http-semantics"] )],
    diagnostics: [
      d("로그/APM에 password/content와 SQL bind가 남습니다.", "DTO/parameter/SQL을 전체 직렬화하고 sensitivity allow-list가 없습니다.", ["logger calls", "MyBatis SQL logger", "APM attributes", "retention/export"], "route/operation/statement id, counts와 categories만 허용하고 raw values를 drop하며 노출 secret을 rotate합니다.", "synthetic secret canary가 exporters/backups에서 0건인지 검사합니다."),
      d("user/resource/request id가 metric labels가 되어 series가 폭증합니다.", "unbounded identifiers를 tags로 사용했습니다.", ["top labels", "unique series", "route vs raw path", "memory/drop"], "route template, operation enum, outcome/error class와 duration buckets만 tags로 사용합니다.", "cardinality unit budget와 production series alert를 둡니다."),
    ],
    expertNotes: ["correlation id는 authorization credential가 아니며 로그 검색 편의 때문에 신뢰하면 안 됩니다.", "observability schema도 versioned public-ish contract처럼 review하고 field 추가의 sensitivity/cardinality를 평가합니다."],
  },
  {
    id: "performance-concurrency-budgets",
    title: "레이어별 latency·query·row·lock budget과 singleton thread safety를 함께 검증합니다",
    lead: "계층 분리가 잘 되어도 N+1, unbounded rows, long transaction과 mutable singleton state가 있으면 운영 흐름은 깨집니다.",
    explanations: [
      "controller budget은 body/binding/view size와 timeout, service는 end-to-end/use-case deadline과 transaction/side-effect, mapper는 query count/rows/duration/plan과 pool wait를 소유합니다. 한 timeout 숫자를 모든 계층에 복사하지 않습니다.",
      "list/detail/create path마다 expected mapper calls와 row cardinality를 정하고 source/controller log가 아니라 integration observation으로 검증합니다. pagination query와 count, generated key reselect가 추가되면 budget에 반영합니다.",
      "controller/service/mapper proxy는 보통 singleton이므로 request-specific Map/list/current user를 instance field에 저장하지 않습니다. method-local immutable objects, bounded cache와 thread-safe metrics를 사용합니다.",
      "transaction 안에서 file/network와 view rendering을 수행하면 DB connection/lock을 오래 잡습니다. DB work를 짧게 하고 outbox/after-commit/async의 consistency와 cancellation을 명시합니다.",
      "load test는 평균만 보지 않고 p95/p99, pool saturation, lock waits, retry amplification, error rate와 consistency를 함께 봅니다. synthetic payload와 secret-free diagnostics를 사용합니다.",
    ],
    concepts: [
      c("query budget", "한 use case가 허용하는 statement count, rows/bytes, duration과 plan 범위입니다.", ["regression gate가 됩니다.", "endpoint별로 다릅니다."]),
      c("transaction residency", "요청이 connection/transaction/locks를 점유하는 시간과 그 안의 작업입니다.", ["외부 I/O를 줄입니다.", "pool capacity와 연결합니다."]),
      c("stateless singleton", "request-specific mutable state를 instance fields에 저장하지 않아 concurrent calls를 독립적으로 처리하는 shared bean입니다.", ["local immutable data를 씁니다.", "shared cache는 별도 정책입니다."]),
    ],
    diagnostics: [
      d("부하에서 다른 요청의 paging/query 조건이 섞입니다.", "singleton service/mapper helper의 mutable Map을 재사용했습니다.", ["instance fields", "parallel request traces", "bound SQL", "thread dumps"], "query objects를 method-local immutable records로 만들고 shared mutable state를 제거합니다.", "barrier 기반 cross-request SQL/result isolation tests를 둡니다."),
      d("간단한 create가 connection pool을 오래 점유합니다.", "transaction 안에 file transfer/network/log blocking 또는 불필요한 selects가 있습니다.", ["transaction span", "pool wait/hold", "query count", "external I/O timing"], "DB transaction을 bounded mapper work로 줄이고 외부 side effect를 staged/outbox protocol로 이동합니다.", "pool saturation/timeout/failure load tests와 query budget gate를 둡니다."),
    ],
    expertNotes: ["layer count 자체보다 network/DB round trips와 serialization size가 주된 비용인 경우가 많아 측정 없이 계층을 합치지 않습니다.", "timeout은 cancellation이 실제 JDBC/transaction/file side effect까지 전파되는지 검증해야 합니다."],
  },
  {
    id: "layered-testing-source-provenance",
    title: "Controller·Service·Mapper를 격리하고 다시 연결하는 failure matrix를 운영합니다",
    lead: "mock 하나로 모든 호출을 success 처리하거나 giant E2E 하나만 두면 책임 위반과 mapper contract 실패를 빠르게 찾을 수 없습니다.",
    explanations: [
      "controller slice는 route/method/content negotiation, binding/validation short-circuit, service command와 status/view/error representation을 검증합니다. service는 fake/spy ports로 rules, call order/count, transaction-triggering exceptions와 result를 검증합니다.",
      "mapper integration은 actual MyBatis configuration/XML과 supported DB schema에서 statement binding, SQL semantics, generated/affected rows, null/type/visibility와 exception translation을 검증합니다. SQL 문자열 unit snapshot만으로 driver/database를 증명하지 않습니다.",
      "full flow test는 MockMvc/HTTP→service proxy→mapper→DB→response를 synthetic data로 실행하고 request id, transaction outcome, row readback와 response를 연결합니다. 모든 case를 E2E로 복제하지 않고 대표 경계 위험을 선택합니다.",
      "failure matrix는 invalid input, no row, duplicate, mapper binding, timeout/connection, transaction commit, file/side-effect, response/view failure를 phase별로 주입합니다. 각 case의 downstream calls, rollback/cleanup와 public/internal error를 기록합니다.",
      "세 원본 파일은 read-only hash/line/byte provenance로 보존합니다. 원본에 보이는 field injection, controller side effects, broad row object와 visibility drift는 학습 관찰이며 maintained examples의 권장 contract와 분리합니다.",
    ],
    concepts: [
      c("slice test", "특정 adapter/layer와 framework integration만 로드해 그 경계 계약을 빠르게 검증하는 테스트입니다.", ["controller/mapper slice가 있습니다.", "full flow를 보완합니다."]),
      c("failure matrix", "단계별 주입 실패와 예상 error, call count, transaction, cleanup, response를 행렬화한 검증 표입니다.", ["정상만 보지 않습니다.", "owner를 드러냅니다."]),
      c("source provenance", "현재 학습 설명이 어떤 local source hash/structure와 공식 reference에 근거하는지 추적하는 기록입니다.", ["원본을 변경하지 않습니다.", "교정 내용을 분리합니다."]),
    ],
    diagnostics: [
      d("controller mock test는 통과하지만 MyBatis startup에서 statement not found가 납니다.", "service mock만 사용하고 mapper interface/XML namespace/id integration을 실행하지 않았습니다.", ["mapper context startup", "namespace/id", "resource packaging", "DB test"], "actual mapper XML과 DataSource를 로드하는 integration suite를 필수화합니다.", "모든 mapper methods의 startup+representative execution inventory gate를 둡니다."),
      d("E2E가 실패하지만 controller/service/mapper 중 원인을 알 수 없습니다.", "단계 event와 layer-specific contract tests가 없습니다.", ["failure phase", "request correlation", "unit/slice coverage", "transaction/SQL evidence"], "adapter/service/mapper tests로 contract를 나누고 full flow에 phase events와 safe evidence를 남깁니다.", "failure가 가장 가까운 owner test에서 먼저 재현되는 pyramid를 유지합니다."),
    ],
    expertNotes: ["mock interaction count는 implementation detail이 될 수 있으므로 중요한 side-effect/cardinality contract에만 사용합니다.", "local source audit는 사실을 보존하지만 현재 supported Spring/MyBatis version의 운영 정답으로 승격하지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-board-controller", repository: "local learning archive", path: "2026-springmvc01/src/main/java/org/study/myproject01/board/controller/BoardController.java", usedFor: ["legacy HTTP, upload, password, paging and board call-flow audit"], evidence: "Read-only audit: 220 lines, 8,293 bytes, SHA-256 FA77CD0DF48BCFBDF7332BF9D222599D2323BEAD5B369E818757128058CB83F9." },
  { id: "local-board-service", repository: "local learning archive", path: "2026-springmvc01/src/main/java/org/study/myproject01/board/service/BoardServiceImpl.java", usedFor: ["service-to-mapper pass-through and query map provenance"], evidence: "Read-only audit: 61 lines, 1,688 bytes, SHA-256 431770CE49E24D0A546BD4B2850139313AF1CE5444EE82A9159B735944A7DF30." },
  { id: "local-board-mapper", repository: "local learning archive", path: "2026-springmvc01/src/main/resources/mapper/BoardMapper.xml", usedFor: ["mapped statements, parameter/result and visibility flow provenance"], evidence: "Read-only audit: 68 lines, 3,161 bytes, SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6." },
  { id: "spring-controller", repository: "Spring Framework Reference", path: "Annotated Controllers", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html", usedFor: ["controller adapter model"], evidence: "Spring Framework 공식 annotated controller reference입니다." },
  { id: "spring-handler-methods", repository: "Spring Framework Reference", path: "Handler Methods", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods.html", usedFor: ["handler arguments and return values"], evidence: "Spring Framework 공식 handler methods reference입니다." },
  { id: "spring-request-mapping", repository: "Spring Framework Reference", path: "Mapping Requests", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", usedFor: ["HTTP method/path/consumes/produces mapping"], evidence: "Spring Framework 공식 request mapping reference입니다." },
  { id: "spring-validation", repository: "Spring Framework Reference", path: "MVC Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["validation short-circuit"], evidence: "Spring Framework 공식 MVC validation reference입니다." },
  { id: "spring-error-responses", repository: "Spring Framework Reference", path: "Error Responses", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["application error to HTTP representation"], evidence: "Spring Framework 공식 error response reference입니다." },
  { id: "spring-transactions", repository: "Spring Framework Reference", path: "Declarative Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html", usedFor: ["service transaction boundary and rollback"], evidence: "Spring Framework 공식 declarative transaction reference입니다." },
  { id: "mybatis-mapper-xml", repository: "MyBatis 3 Reference", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["statement, parameter, result and row count contracts"], evidence: "MyBatis 공식 mapper XML reference입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Reference", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["SqlSession execution and transaction control boundaries"], evidence: "MyBatis 공식 Java API reference입니다." },
  { id: "mybatis-mappers", repository: "MyBatis-Spring Reference", path: "Mapper injection", publicUrl: "https://mybatis.org/spring/mappers.html", usedFor: ["mapper proxy registration and injection"], evidence: "MyBatis-Spring 공식 mappers reference입니다." },
  { id: "mybatis-transactions", repository: "MyBatis-Spring Reference", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["Spring transaction participation"], evidence: "MyBatis-Spring 공식 transactions reference입니다." },
  { id: "rfc-http-semantics", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP methods, statuses and response semantics"], evidence: "IETF Standards Track HTTP semantics입니다." },
  { id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input Validation", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allow-list validation and safe errors"], evidence: "OWASP 공식 input validation guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-02-controller-service-mapper-flow", slug: "crud-02-controller-service-mapper-flow", courseId: "spring", moduleId: "spring-layered-crud", order: 2,
  title: "Controller→Service→Mapper 호출 흐름 추적", subtitle: "HTTP adapter, use-case/transaction owner와 typed persistence port를 실제 성공·검증·rollback·오류·관측 흐름으로 연결합니다.", level: "중급", estimatedMinutes: 90,
  coreQuestion: "한 HTTP 요청이 controller, service proxy와 mapper/DB를 통과해 commit 후 응답이 되기까지 책임·값·예외·관측 증거를 어떻게 잃지 않을까요?",
  summary: "로컬 controller/service/mapper XML 세 파일을 read-only로 감사해 handler→service→mapper call path, field injection, controller의 upload/password/paging/hit/detail 책임 혼재, service pass-through/query Map과 mapper statement/visibility drift를 provenance로 사용합니다. 이를 그대로 복제하지 않고 end-to-end execution graph, thin HTTP adapter와 validation short-circuit, use-case/transaction service, typed persistence port/affected rows, constructor injection/dependency direction, layer-specific mapping, rollback/commit-time failure, exception translation/HTTP contract, shared read visibility, secret-zero correlation events, latency/query/thread-safety budgets와 layer/failure-matrix testing으로 확장합니다. 일곱 JDK 21 예제는 실제 objects로 호출 trace, validation call 0, affected rows, rollback, exception mapping, visibility consistency와 safe events를 실행합니다.",
  objectives: ["controller→service→mapper→DB→response 실행 순서를 phase/owner로 추적한다.", "controller를 HTTP mapping/binding/validation/response에 한정한다.", "service가 use-case invariant와 transaction을 소유하게 한다.", "mapper를 typed persistence port와 row-count/error adapter로 설계한다.", "constructor injection과 dependency direction을 고정한다.", "transport/domain/query/result mapping을 계층별로 분리한다.", "commit/rollback과 application error→HTTP contract를 검증한다.", "visibility, 관측성, concurrency/query budgets와 failure tests를 운영한다."],
  prerequisites: [{ title: "VO·DTO·Entity 역할과 경계 분리", reason: "각 계층이 전달할 request command, domain model, persistence query와 response result를 구분해야 호출 흐름의 책임과 변환을 추적할 수 있습니다.", sessionSlug: "crud-01-vo-dto-entity-boundaries" }],
  keywords: ["controller", "service", "mapper", "dependency direction", "constructor injection", "application service", "persistence port", "transaction", "affected rows", "exception translation", "request correlation", "query budget"], topics,
  lab: {
    title: "게시판 create/detail 흐름을 traceable layered use case로 재구성하기",
    scenario: "controller가 validation·file·password·page/hit logic과 view를 모두 처리하고 service는 mapper를 전달하며 SQL visibility/error/row-count contract가 endpoint마다 달라 장애 원인을 추적하기 어렵습니다.",
    setup: ["세 원본은 read-only hashes로 보존하고 maintained packages/methods에는 exact literals를 복사하지 않습니다.", "HTTP route→request DTO→command→service→port→statement→row/result→response의 owner/value/error 표를 만듭니다.", "constructor-wired controller/service/fake ports와 actual MockMvc/MyBatis/supported DB profile을 준비합니다.", "blank, no row, duplicate, binding error, timeout, commit failure, deleted row와 synthetic secret fixtures를 준비합니다."],
    steps: ["원본 handler부터 XML statement까지 call graph와 책임 혼재를 표시합니다.", "controller mapping/method/validation을 명시하고 invalid downstream call=0을 검증합니다.", "service use-case interface와 constructor dependencies를 정의합니다.", "typed query/command/result와 mapper port/adapter를 만듭니다.", "affected row 0/1/>1와 generated result를 application outcome으로 변환합니다.", "service transaction에서 DB invariant를 묶고 각 단계 rollback을 주입합니다.", "dependency/commit/not-found/conflict를 application errors와 HTTP representations로 연결합니다.", "count/list/detail visibility와 GET side-effect 정책을 검증합니다.", "route/operation/statement/outcome correlation events와 cardinality budget을 적용합니다.", "controller/service/mapper slices와 full HTTP→DB representative scenarios를 실행합니다.", "latency/query/row/pool/transaction budgets와 concurrent request isolation을 검증합니다.", "source provenance, failure matrix, schema/log artifacts와 rollback runbook을 제출합니다."],
    expectedResult: ["invalid request는 service/mapper/side-effect 호출 없이 정확한 4xx/form contract로 종료됩니다.", "정상 요청은 controller→service proxy→mapper→commit→response 순서와 row/result가 일치합니다.", "mapper/commit 실패는 partial DB success 없이 stable application/HTTP error로 변환됩니다.", "count/list/detail visibility와 request isolation이 일관되고 query/row/transaction budgets를 지킵니다.", "events와 artifacts는 동일 request를 연결하면서 password/content/SQL values를 포함하지 않습니다."],
    cleanup: ["synthetic rows, transactions, temporary upload/side-effect fixtures와 test schemas를 정리합니다.", "logs/traces/artifacts에서 synthetic secret와 raw payload가 0건인지 확인합니다.", "DataSource/test containers/executors를 종료하고 connection/thread residual을 확인합니다.", "로컬 원본 controller/service/mapper 파일은 변경하지 않습니다."],
    extensions: ["ArchUnit/module tests로 web→application→adapter dependency direction을 자동화합니다.", "OpenTelemetry spans와 transaction/statement observations를 safe schema에 연결합니다.", "outbox 기반 file/email side-effect protocol을 추가합니다.", "Testcontainers DB/version/dialect와 connection pool saturation matrix를 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java 예제를 실행하고 각 event/call count/transaction/status가 어느 계층 계약인지 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "성공 call/unwind 순서를 적습니다.", "invalid service calls 0을 확인합니다.", "affected 0/1/>1을 분류합니다.", "rollback 뒤 committed rows 0을 확인합니다.", "DB failure HTTP mapping을 설명합니다.", "visibility predicate 일치를 확인합니다.", "safe event correlation과 raw values 0을 확인합니다."], hints: ["요청 흐름을 아래 방향 호출과 위 방향 return/throw 두 화살표로 그리세요."], expectedOutcome: "layer 이름이 아니라 실행 evidence로 책임을 설명합니다.", solutionOutline: ["bind→validate→invoke→persist→commit→translate→respond 순서입니다."] },
    { difficulty: "응용", prompt: "원본 call path를 constructor-wired layered use case와 actual mapper integration으로 리팩터링하세요.", requirements: ["원본을 structural provenance로만 사용합니다.", "controller/service/port 책임표를 만듭니다.", "typed mapping과 row-count contract를 둡니다.", "transaction/failure matrix를 실행합니다.", "visibility drift와 GET mutation을 교정합니다.", "safe request correlation을 적용합니다.", "slice+DB+full-flow tests와 budgets를 통과합니다."], hints: ["controller 줄 수보다 framework type/side effect가 어느 계층에 있는지 먼저 줄이세요."], expectedOutcome: "정상·실패·동시 요청에서 추적 가능하고 transaction-safe한 CRUD 흐름이 완성됩니다.", solutionOutline: ["audit→port→wire→validate→transact→translate→observe→qualify 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Controller-Service-Mapper architecture와 release gate를 작성하세요.", requirements: ["dependency/import/constructor rules를 둡니다.", "HTTP/application/persistence vocabulary를 분리합니다.", "transaction/side-effect/rollback rules를 둡니다.", "mapper statement/row/error contract를 둡니다.", "observability sensitivity/cardinality schema를 둡니다.", "latency/query/row/concurrency budgets를 둡니다.", "slice/integration/full-flow/failure/provenance gates를 포함합니다."], hints: ["각 계층마다 받아도 되는 type과 절대 알아서는 안 되는 type을 함께 적으세요."], expectedOutcome: "기술 교체와 장애에도 use-case contract와 증거가 유지되는 layered 표준이 완성됩니다.", solutionOutline: ["constrain→direct→orchestrate→adapt→commit→expose→measure→prove 순서입니다."] },
  ],
  nextSessions: ["crud-03-board-create-read"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["BoardController.java는 read-only로 220 lines/8,293 bytes, SHA-256 FA77CD0DF48BCFBDF7332BF9D222599D2323BEAD5B369E818757128058CB83F9를 확인했습니다.", "BoardServiceImpl.java는 read-only로 61 lines/1,688 bytes, SHA-256 431770CE49E24D0A546BD4B2850139313AF1CE5444EE82A9159B735944A7DF30을 확인했습니다.", "BoardMapper.xml은 read-only로 68 lines/3,161 bytes, SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6을 확인했습니다.", "원본의 field injection, controller-owned file/password/paging/hit/detail flows, mapper pass-through/Map parameter와 count/list/detail visibility 차이를 structural provenance로 사용했으며 package/configuration/data literals는 maintained examples에 복사하지 않았습니다.", "원본이 충분히 다루지 않는 constructor dependency direction, typed ports, validation short-circuit, affected row semantics, service transaction/commit failure, exception translation, safe correlation, concurrency/query budgets와 test pyramid는 현재 공식 Spring/MyBatis/IETF/OWASP 문서와 synthetic examples로 보강했습니다.", "JDK-only adapters는 DispatcherServlet binding, Spring AOP transaction, MyBatis SqlSession/JDBC driver와 actual DB isolation/commit behavior를 대체하지 않습니다."] },
});

export default session;
