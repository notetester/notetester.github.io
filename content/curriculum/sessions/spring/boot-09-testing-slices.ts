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
      { lines: `1-${a}`, explanation: "JDK 21 record·collection으로 test scope, HTTP/DB contract와 deterministic dependency를 Spring 없이 모델링합니다." },
      { lines: `${a + 1}-${b}`, explanation: "정상뿐 아니라 validation·security·flush·race·fault·CI 경계 사례를 실행해 false positive를 드러냅니다." },
      { lines: `${b + 1}-${lines}`, explanation: "실제 DB/credential/domain 값을 사용하지 않고 status, call count, state, shard와 stable failure category만 stdout으로 검증합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/JUnit/DB/Docker/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 한 글자씩 일치해야 합니다.", "JDK-only 모형은 실제 JUnit engine, Spring TestContext/slice, Servlet/Jackson/Security, DB transaction와 Docker network를 대체하지 않습니다."] },
    experiments: [
      { change: "concern, actor/CSRF/body, flush 시점, clock/seed, interleaving 또는 shard count를 하나씩 바꿉니다.", prediction: "적절한 test layer와 expected failure가 deterministic하게 바뀌고 숨은 side effect가 드러납니다.", result: "selected layer, HTTP status/calls, persisted rows, version/count와 shard manifest를 비교합니다." },
      { change: "동일 contract를 @WebMvcTest, @SpringBootTest RANDOM_PORT와 supported DB Testcontainer에서 실행합니다.", prediction: "실제 mapping/converter/filter/container/driver/isolation/fault behavior가 추가로 드러납니다.", result: "context manifest, wire response, SQL/commit, network trace와 cleanup evidence를 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "baseline-context-loads-gap",
    title: "contextLoads를 시작점으로 보되 동작·계약·운영 준비의 증거로 과대평가하지 않습니다",
    lead: "ApplicationContext가 한 번 시작됐다는 테스트는 bean wiring의 일부를 확인하지만 controller mapping, JSON, security, SQL, 외부 API와 concurrency 결과는 확인하지 않습니다.",
    explanations: [
      "두 로컬 test 파일은 각각 @SpringBootTest와 비어 있는 contextLoads 한 개를 가진 13-line smoke skeleton입니다. package와 primary configuration 탐색이 성공하는지는 보여주지만 어떤 bean/endpoint/use case가 올바른지는 assertion하지 않습니다.",
      "test objective를 pure policy, web contract, persistence mapping, application wiring, real container/network와 system workflow로 분해하고 가장 좁으면서 필요한 실제 adapter를 포함하는 test type을 선택합니다.",
      "Spring Boot test support는 core test와 auto-configuration/focused test modules 및 starter를 제공합니다. dependency 이름만 기억하지 말고 현재 Boot version의 resolved test runtime, JUnit engine과 security/container modules를 dependency report로 고정합니다.",
      "context failure는 configuration regression을 빨리 찾지만 broad context test 수가 늘면 cache key drift와 startup time이 suite를 지배합니다. 공유 config를 정규화하고 필요한 distinct contexts와 failure threshold를 관측합니다.",
      "모든 test는 검증할 contract, system under test, real/fake dependencies, isolation, failure modes와 비검증 범위를 이름과 문서에 남깁니다. 통과 숫자만으로 confidence를 계산하지 않습니다.",
    ],
    concepts: [
      c("context smoke test", "Spring ApplicationContext가 test configuration으로 생성되는지 확인하는 넓고 얕은 검사입니다.", ["wiring 일부를 봅니다.", "behavior assertion을 대신하지 않습니다."]),
      c("test scope", "한 test가 실제로 포함한 production code, framework, process와 external resources의 경계입니다.", ["명시적으로 기록합니다.", "false confidence를 줄입니다."]),
      c("evidence gap", "test가 통과해도 요구사항의 특정 failure/adapter가 실행되지 않아 남는 미검증 영역입니다.", ["비검증 범위를 문서화합니다.", "다른 layer test로 닫습니다."]),
    ],
    codeExamples: [java("boot09-layer-selection", "검증 concern별 최소 충분 test layer", "Boot09LayerSelection.java", "pure policy, MVC binding, SQL mapping, Boot wiring과 real container behavior를 각 test layer로 분류합니다.", String.raw`public class Boot09LayerSelection {
  enum Concern { PURE_POLICY, MVC_BINDING, SQL_MAPPING, BOOT_WIRING, CONTAINER_HTTP }
  enum Layer { UNIT, WEB_SLICE, DATA_SLICE, FULL_CONTEXT, REAL_SERVER }
  static Layer choose(Concern concern) {
    return switch (concern) {
      case PURE_POLICY -> Layer.UNIT;
      case MVC_BINDING -> Layer.WEB_SLICE;
      case SQL_MAPPING -> Layer.DATA_SLICE;
      case BOOT_WIRING -> Layer.FULL_CONTEXT;
      case CONTAINER_HTTP -> Layer.REAL_SERVER;
    };
  }
  public static void main(String[] args) {
    System.out.println("policy=" + choose(Concern.PURE_POLICY));
    System.out.println("mvc=" + choose(Concern.MVC_BINDING));
    System.out.println("sql=" + choose(Concern.SQL_MAPPING));
    System.out.println("wiring=" + choose(Concern.BOOT_WIRING));
    System.out.println("container=" + choose(Concern.CONTAINER_HTTP));
    System.out.println("context-loads-is-complete=false");
  }
}`, "policy=UNIT\nmvc=WEB_SLICE\nsql=DATA_SLICE\nwiring=FULL_CONTEXT\ncontainer=REAL_SERVER\ncontext-loads-is-complete=false", ["local-boot-context-test", "local-mvc-context-test", "spring-boot-testing", "spring-boot-app-tests", "junit-guide"] )],
    diagnostics: [
      d("CI가 green인데 첫 HTTP 요청에서 mapping/serializer/security 오류가 납니다.", "contextLoads만 있고 endpoint contract와 security filter를 실제 DispatcherServlet 경로로 실행하지 않았습니다.", ["tests and assertions inventory", "loaded context/beans", "MockMvc/real server coverage", "first failing production path"], "요구사항별 unit/slice/full/real-server matrix를 만들고 missing adapter contract를 추가합니다.", "route/use-case→test evidence manifest와 contextLoads-only release gate 금지를 둡니다."),
    ],
    expertNotes: ["contextLoads 삭제가 목표가 아니라 그 test가 보장하는 좁은 wiring contract를 이름과 assertion으로 분명히 하는 것이 목표입니다.", "test 수보다 독립 failure modes와 production adapter를 어느 layer에서 검증하는지가 중요합니다."],
  },
  {
    id: "unit-tests-doubles-ports",
    title: "unit test는 pure policy와 orchestration을 빠르게 검증하고 test double의 계약을 제한합니다",
    lead: "Spring context 없이 constructor로 service를 조립하면 정상·경계·failure를 빠르게 전수할 수 있지만 mock이 실제 provider/DB semantics를 발명하면 거짓 확신이 됩니다.",
    explanations: [
      "value object, validator, authorization, quota/retry classifier와 mapper pure function은 JUnit parameterized/property tests로 입력 domain을 넓게 검증합니다. Clock, id generator와 ports를 constructor에 주입해 fixed input→fixed result를 만듭니다.",
      "application service unit test는 repository/provider port의 fake/mock으로 call order, arguments, no-call-on-invalid, result/error translation과 compensation을 확인합니다. HTTP status, JSON과 SQL string은 adapter tests가 소유합니다.",
      "mock은 production interface에 없는 behavior를 허용하지 않고 strict unexpected call, cardinality와 failure taxonomy를 둡니다. broad deep stubs와 implementation method count assertions는 refactor에 취약합니다.",
      "fake repository는 uniqueness, generated id, transaction과 concurrency를 단순화한 사실을 명시합니다. 그 차이로 중요한 invariant는 supported DB integration에서 다시 검증합니다.",
      "unit test 실패 이름은 input·expected invariant·actual outcome을 설명하고 secret/raw personal data를 fixture나 assertion message에 넣지 않습니다. fixture builders는 safe defaults와 의도한 변화만 드러냅니다.",
    ],
    concepts: [
      c("test double", "실제 collaborator 대신 test가 제어하는 stub, fake, mock 또는 spy 구현입니다.", ["종류와 한계를 구분합니다.", "production contract를 발명하지 않습니다."]),
      c("interaction contract", "어떤 port를 어떤 인자·횟수·순서로 호출하거나 호출하지 않아야 하는지 정의한 약속입니다.", ["orchestration에 사용합니다.", "구현 세부 결합을 피합니다."]),
      c("pure policy", "외부 상태 없이 명시적 입력에서 결과/실패를 계산하는 업무 규칙입니다.", ["빠른 전수 검증이 가능합니다.", "Clock/random도 입력으로 둡니다."]),
    ],
    diagnostics: [
      d("mock 기반 unit tests는 통과하지만 실제 DB/provider의 null, row count와 status가 다릅니다.", "test double이 production adapter contract보다 관대하거나 잘못된 semantics를 구현했습니다.", ["mock setup/defaults", "real adapter contract", "unverified return/error cases", "integration failures"], "port contract를 명시하고 strict doubles와 provider/DB contract suite를 같은 cases로 실행합니다.", "fake와 actual adapter의 shared contract tests 및 unconfigured-call failure를 둡니다."),
    ],
    expertNotes: ["mock 호출 검증이 많아질수록 observable result/invariant 대신 구현 순서를 테스트하는지 점검합니다.", "unit test가 빠르다는 이유로 serializer, transaction과 concurrency contract를 fake 안에 숨기지 않습니다."],
  },
  {
    id: "web-slice-mockmvc-security",
    title: "@WebMvcTest와 MockMvc로 mapping·binding·validation·serialization·security를 한 HTTP 계약으로 검증합니다",
    lead: "controller method를 직접 호출하면 @RequestMapping, converter, Bean Validation, ControllerAdvice, Jackson과 Security filter 결과를 건너뜁니다.",
    explanations: [
      "@WebMvcTest는 MVC 관련 components와 제한된 auto-configuration만 로드하고 controller collaborator는 @MockitoBean/TestBean 등으로 대체합니다. 무엇이 scan되지 않는지 현재 Boot reference와 actual context manifest로 확인합니다.",
      "MockMvc는 실제 server 없이 DispatcherServlet과 mock Servlet API를 통과합니다. method/path/query/header/body/content negotiation, charset, binding, validation, exception mapping과 status/headers/body를 실제 wire contract처럼 assertion합니다.",
      "JSON은 문자열 포함 여부보다 JSONPath/typed schema로 field presence, null, number/time format, unknown/secret fields와 stable problem body를 검사합니다. custom Jackson module/converter/advice가 slice에 포함되는지 명시적으로 import/verify합니다.",
      "Spring Security가 있으면 anonymous/user/role, CSRF valid/missing/invalid, authentication result와 forbidden fields를 filter chain 포함 상태에서 테스트합니다. 빠르게 하려고 filters를 끈 test만 release evidence로 쓰지 않습니다.",
      "MockMvc는 lower-level Servlet container behavior, network/TLS, compression, proxy, real port와 error page를 완전히 재현하지 않습니다. 필요한 경우 RANDOM_PORT real-server test를 별도로 둡니다.",
    ],
    concepts: [
      c("test slice", "특정 application layer에 필요한 components와 auto-configuration만 로드하는 제한된 Spring context입니다.", ["빠른 adapter integration입니다.", "누락 components를 명시합니다."]),
      c("MockMvc", "running server 없이 DispatcherServlet과 mock Servlet request/response로 MVC 처리를 실행하는 test framework입니다.", ["mapping/conversion을 봅니다.", "container/network는 대체하지 않습니다."]),
      c("security test context", "synthetic authenticated principal, CSRF와 filter 결과를 HTTP test에 제공·검증하는 support입니다.", ["filters를 유지합니다.", "권한 matrix를 실행합니다."]),
    ],
    codeExamples: [java("boot09-web-contract", "인증·CSRF·validation을 포함한 HTTP decision matrix", "Boot09WebContract.java", "anonymous, CSRF 누락, invalid body와 정상 POST가 401/403/400/201로 갈리고 invalid service call이 0인지 실행합니다.", String.raw`public class Boot09WebContract {
  record Request(boolean authenticated, boolean csrf, boolean validBody) {}
  record Result(int status, int serviceCalls, String contentType) {}
  static Result handle(Request request) {
    if (!request.authenticated()) return new Result(401, 0, "application/problem+json");
    if (!request.csrf()) return new Result(403, 0, "application/problem+json");
    if (!request.validBody()) return new Result(400, 0, "application/problem+json");
    return new Result(201, 1, "application/json");
  }
  public static void main(String[] args) {
    System.out.println("anonymous=" + handle(new Request(false, false, true)).status());
    System.out.println("no-csrf=" + handle(new Request(true, false, true)).status());
    Result invalid = handle(new Request(true, true, false));
    System.out.println("invalid=" + invalid.status() + "|calls=" + invalid.serviceCalls());
    Result created = handle(new Request(true, true, true));
    System.out.println("created=" + created.status() + "|calls=" + created.serviceCalls());
    System.out.println("content-type=" + created.contentType());
    System.out.println("secret-field=false");
  }
}`, "anonymous=401\nno-csrf=403\ninvalid=400|calls=0\ncreated=201|calls=1\ncontent-type=application/json\nsecret-field=false", ["spring-boot-app-tests", "spring-mockmvc", "spring-security-mockmvc", "spring-boot-testing"] )],
    diagnostics: [
      d("@WebMvcTest가 security를 꺼야만 통과하거나 production JSON field와 다릅니다.", "filter/Jackson/advice/config를 slice에서 빠뜨리고 controller direct assumptions를 assertion했습니다.", ["loaded slice beans/auto-config", "filter chain and CSRF", "ObjectMapper modules", "actual response schema"], "production MVC/security configuration을 포함한 WebApplicationContext slice를 만들고 actor×method×body contract를 실행합니다.", "context bean manifest, secret-field negative assertions와 full-context parity tests를 둡니다."),
    ],
    expertNotes: ["standalone MockMvc는 집중된 debug/unit-like test에 유용하지만 application MVC config parity를 별도 증명합니다.", "status만 맞는 test보다 service call 0/1, headers, schema와 forbidden fields를 함께 봅니다."],
  },
  {
    id: "data-slice-transaction-false-positive",
    title: "data slice에서 실제 flush·constraint·commit을 확인하고 자동 rollback의 false positive를 막습니다",
    lead: "test-managed transaction이 끝날 때 rollback되면 flush/commit에서 발생할 constraint와 serialization 문제가 assertion 전에 숨겨질 수 있습니다.",
    explanations: [
      "repository/JPA/MyBatis/JDBC slice는 migration/schema, entity/row mapping, query, generated keys, affected rows와 exceptions를 supported database semantics로 검증합니다. H2 같은 다른 engine을 production DB의 대체 증거로 일반화하지 않습니다.",
      "JPA persistence context는 writes를 flush까지 지연할 수 있으므로 constraint/error test는 flush하고 필요하면 clear/reload해 DB round trip을 강제합니다. first-level cache의 같은 object 반환을 DB mapping 성공으로 오인하지 않습니다.",
      "test-managed @Transactional은 보통 test 끝에 rollback되어 isolation을 돕지만 production commit path와 외부 side effect를 검증하지 않습니다. commit-time behavior는 explicit commit/새 transaction 또는 real-server use case로 별도 확인합니다.",
      "preemptive timeout이 test를 다른 thread에서 실행하면 ThreadLocal 기반 test transaction 밖에서 writes가 수행되어 rollback되지 않을 수 있다는 Spring 공식 경고를 반영합니다. timeout mode와 cleanup을 실제 runner에서 검증합니다.",
      "RANDOM_PORT server는 test client와 server가 별 thread/transaction이므로 test method rollback이 HTTP 처리 transaction을 되돌리지 않습니다. unique namespace와 explicit cleanup/reconciliation을 사용합니다.",
    ],
    concepts: [
      c("test-managed transaction", "Spring TestContext가 test method 전후에 시작하고 기본 rollback할 수 있는 transaction입니다.", ["thread-bound입니다.", "production commit과 다릅니다."]),
      c("flush", "persistence context의 pending SQL을 database로 보내 constraint와 mapping을 실제로 평가하는 단계입니다.", ["commit 전에도 실행할 수 있습니다.", "false positive를 줄입니다."]),
      c("transactional false positive", "test rollback/cache/lazy flush 때문에 production에서 실패할 동작이 test에서 통과해 보이는 결과입니다.", ["flush/reload/commit으로 찾습니다.", "real-server thread를 구분합니다."]),
    ],
    codeExamples: [java("boot09-flush", "flush 전 숨은 constraint 실패와 rollback", "Boot09Flush.java", "duplicate row가 staging만 하면 통과처럼 보이지만 flush에서 실패하고 rollback 뒤 committed row가 없는지 실행합니다.", String.raw`import java.util.*;

public class Boot09Flush {
  static final class UnitOfWork {
    final Set<String> database = new HashSet<>();
    final List<String> pending = new ArrayList<>();
    void persist(String value) { pending.add(value); }
    void flush() {
      Set<String> seen = new HashSet<>(database);
      for (String value : pending) if (!seen.add(value)) throw new IllegalStateException("UNIQUE_CONSTRAINT");
      database.addAll(pending); pending.clear();
    }
    void rollback() { pending.clear(); database.clear(); }
  }
  public static void main(String[] args) {
    UnitOfWork work = new UnitOfWork();
    work.persist("synthetic-key"); work.persist("synthetic-key");
    System.out.println("without-flush-false-positive=true");
    try { work.flush(); }
    catch (IllegalStateException error) { System.out.println("flush=" + error.getMessage()); }
    work.rollback();
    System.out.println("rows-after-rollback=" + work.database.size());
    System.out.println("production-commit-tested=false");
  }
}`, "without-flush-false-positive=true\nflush=UNIQUE_CONSTRAINT\nrows-after-rollback=0\nproduction-commit-tested=false", ["spring-test-transactions", "spring-boot-testcontainers", "testcontainers-databases"] )],
    diagnostics: [
      d("repository test는 통과하지만 production commit에서 unique/not-null error가 납니다.", "test가 flush/clear/commit을 하지 않고 rollback transaction과 first-level cache 안에서 assertion했습니다.", ["SQL/flush timing", "persistence context clear/reload", "test rollback/commit path", "actual DB schema/dialect"], "constraint cases에서 explicit flush·clear/reload를 수행하고 supported DB와 commit boundary를 별도 integration test로 검증합니다.", "migration→insert/update→flush/commit→reload와 0/1/>1 row contract tests를 둡니다."),
    ],
    expertNotes: ["rollback convenience는 isolation 도구이며 production side-effect semantics의 증거가 아닙니다.", "Testcontainers를 썼다는 사실만으로 migration, collation, timezone와 engine config가 production과 같아지지 않습니다."],
  },
  {
    id: "full-context-real-server",
    title: "@SpringBootTest MOCK과 RANDOM_PORT를 wiring·container·network 관심사에 맞게 선택합니다",
    lead: "full context는 모든 것이 실제라는 뜻이 아니며 기본 MOCK 환경과 embedded real server는 thread, port, error handling과 transaction 경계가 다릅니다.",
    explanations: [
      "@SpringBootTest는 SpringApplication을 통해 primary configuration과 Boot features를 로드합니다. 기본 MOCK은 web context를 만들 수 있지만 server socket을 시작하지 않아 MockMvc/WebTestClient adapter와 함께 사용합니다.",
      "RANDOM_PORT는 실제 embedded server를 random port에 띄워 HTTP client, Servlet container, filters, codecs, error pages, compression/streaming과 thread boundary를 더 현실적으로 봅니다. TLS/proxy/CDN은 여전히 별도 environment입니다.",
      "full context에서도 DB/provider를 mock하면 end-to-end가 아닙니다. test graph manifest에 real, container, stub, mock dependencies와 excluded auto-config를 기록해 이름보다 실제 scope를 설명합니다.",
      "server start/readiness와 graceful shutdown, startup failure, port binding과 configuration property precedence를 대표 tests에서 확인합니다. application context cache와 dirty context 사용을 최소화합니다.",
      "real server test data는 test transaction rollback에 기대지 않고 run/test-worker scoped tenant/id와 API cleanup을 사용합니다. parallel runs가 같은 queue/files/cache를 공유하지 않게 namespace를 주입합니다.",
    ],
    concepts: [
      c("full context test", "application primary configuration과 넓은 bean graph를 SpringApplication으로 로드하는 test입니다.", ["dependency realness는 별도입니다.", "wiring/conditions에 적합합니다."]),
      c("RANDOM_PORT", "embedded server를 임의 포트에서 실제로 시작해 network HTTP 요청을 받는 SpringBootTest 환경입니다.", ["thread/transaction이 분리됩니다.", "proxy/TLS 전체는 아닙니다."]),
      c("test graph manifest", "각 dependency가 production, container, stub, mock 중 무엇인지와 version/config를 기록한 목록입니다.", ["scope를 설명합니다.", "오해를 줄입니다."]),
    ],
    diagnostics: [
      d("full integration test라 불리지만 server/DB/provider가 모두 mock이고 container 오류가 production에서만 납니다.", "annotation 이름으로 scope를 추정하고 실제 test graph와 webEnvironment를 기록하지 않았습니다.", ["webEnvironment/server port", "bean overrides/mocks", "DB/provider endpoints", "container/proxy behavior"], "관심사에 따라 MOCK 또는 RANDOM_PORT와 real/container/stub dependencies를 선택하고 graph manifest를 test report에 남깁니다.", "server readiness, error page, streaming/cancel과 per-dependency realness assertions를 둡니다."),
    ],
    expertNotes: ["넓은 context가 더 좋은 test라는 순서는 없으며 실패 localization과 비용을 함께 봅니다.", "RANDOM_PORT의 localhost 성공은 production reverse proxy, TLS와 network policy 검증을 대체하지 않습니다."],
  },
  {
    id: "testcontainers-migrations-contracts",
    title: "Testcontainers로 supported DB·broker를 실행하고 migration·contract를 production artifact와 연결합니다",
    lead: "in-memory fake는 빠르지만 dialect, collation, generated keys, locks와 network protocol 차이를 숨기므로 중요한 adapter는 실제 engine family에서 검증해야 합니다.",
    explanations: [
      "Testcontainers는 JUnit과 Docker containers의 lifecycle을 관리해 실제 DB/broker/API dependency를 격리 실행할 수 있습니다. image는 floating latest가 아닌 검토된 digest/version과 compatibility matrix로 고정합니다.",
      "container가 ready라는 port-open 신호와 application schema readiness를 구분합니다. production migration artifact를 빈 DB와 N-1 snapshot에 적용하고 constraints/index/seed/rollback·forward-fix를 검증합니다.",
      "Spring Boot service connection은 container connection details를 auto-config에 전달할 수 있지만 어떤 bean/property가 대체됐는지 context report로 확인합니다. real credential/domain 값을 test config에 복사하지 않습니다.",
      "shared static container는 속도를 높일 수 있지만 database/schema/tenant namespace와 cleanup을 test worker별로 분리합니다. reuse가 CI machine의 이전 state를 숨기지 않게 clean baseline을 정기 실행합니다.",
      "provider/consumer HTTP schema는 Spring Cloud Contract 같은 executable contract와 versioned stubs로 검증합니다. contract 통과는 provider의 semantics/latency/authorization 전체가 아니라 합의한 request/response boundary만 증명합니다.",
    ],
    concepts: [
      c("service connection", "test container가 제공한 host/port/credential details를 application auto-configuration에 안전하게 연결하는 정보입니다.", ["test-only입니다.", "실제 bean binding을 확인합니다."]),
      c("migration rehearsal", "production migration artifact를 representative old/empty schema에 적용해 forward/compatibility를 검증하는 test입니다.", ["schema diff를 남깁니다.", "rollback/forward-fix를 준비합니다."]),
      c("consumer contract", "consumer가 의존하는 provider request/response 사례를 executable schema와 generated verification/stub로 표현한 계약입니다.", ["versioning합니다.", "semantic E2E를 대체하지 않습니다."]),
    ],
    diagnostics: [
      d("container test는 통과하지만 production migration이나 collation에서 query가 깨집니다.", "container image/config와 migration artifact가 production과 다르거나 schema를 ORM이 자동 생성했습니다.", ["image digest/engine config", "migration file/digest", "collation/timezone/extensions", "schema diff and startup path"], "지원 engine version/config에 production migration을 그대로 적용하고 metadata/query/constraint contract를 검증합니다.", "empty/N-1 schema, Unicode/collation/timezone, generated key와 migration failure recovery matrix를 둡니다."),
    ],
    expertNotes: ["container realism은 dependency process에 대한 것이며 production data volume/topology/managed-service behavior는 별도 qualification이 필요합니다.", "contract stub version과 provider deployment compatibility를 artifact registry와 release gate에 연결합니다."],
  },
  {
    id: "fault-concurrency-eventual",
    title: "fault injection과 deterministic interleaving으로 timeout·race·retry·eventual convergence를 검증합니다",
    lead: "정상 순차 test는 connection reset, partial response, duplicate callback과 두 요청의 같은 row update처럼 운영에서 중요한 interleaving을 재현하지 못합니다.",
    explanations: [
      "stub/fault server와 Toxiproxy를 사용해 latency, timeout, reset, bandwidth, partial body와 dependency partition을 protocol 수준에서 주입합니다. production URL에 chaos를 보내지 않고 isolated test graph와 total deadline을 둡니다.",
      "concurrency test는 sleep으로 운을 기다리지 않고 barriers/latches로 read-read-write-write, lock order와 callback timing을 강제합니다. 최종 count뿐 아니라 version, affected rows, duplicates와 invariants를 assertion합니다.",
      "retry test는 attempt count, backoff/deadline, idempotency key, side-effect count와 unknown outcome reconciliation을 함께 봅니다. mock이 첫 번 실패/두 번째 성공만 반환하는 것으로 DB/network semantics를 완결하지 않습니다.",
      "async/eventual flow는 polling with total timeout으로 durable state를 확인하고 fixed sleep을 사용하지 않습니다. intermediate states, duplicate/out-of-order events와 dead-letter/manual repair를 검증합니다.",
      "fault test cleanup은 primary failure와 독립적으로 proxy toxic, connections, threads, containers와 data를 제거합니다. leaked fault가 다음 test의 flaky failure로 번지지 않게 after-each readback을 둡니다.",
    ],
    concepts: [
      c("fault injection", "특정 dependency/phase에 지연·reset·failure를 의도적으로 만들어 recovery contract를 검증하는 기법입니다.", ["격리 환경에서 실행합니다.", "관측 가능한 fault id를 둡니다."]),
      c("deterministic interleaving", "barrier 등으로 concurrent operations의 실행 순서를 재현 가능하게 강제한 schedule입니다.", ["sleep race를 피합니다.", "불변식을 검증합니다."]),
      c("eventual assertion", "정해진 deadline 안에서 상태를 반복 조회해 최종 수렴과 intermediate failure를 확인하는 assertion입니다.", ["fixed sleep과 다릅니다.", "timeout artifact를 남깁니다."]),
    ],
    codeExamples: [java("boot09-concurrency", "lost update interleaving과 atomic update 비교", "Boot09Concurrency.java", "두 요청이 같은 0을 읽어 각각 1을 쓰는 lost update와 atomic increment 결과 2를 비교합니다.", String.raw`import java.util.concurrent.atomic.AtomicInteger;

public class Boot09Concurrency {
  public static void main(String[] args) {
    int initial = 0;
    int firstRead = initial;
    int secondRead = initial;
    int afterFirstWrite = firstRead + 1;
    int afterSecondWrite = secondRead + 1;
    AtomicInteger atomic = new AtomicInteger(0);
    atomic.incrementAndGet(); atomic.incrementAndGet();
    System.out.println("schedule=readA,readB,writeA,writeB");
    System.out.println("non-atomic-final=" + afterSecondWrite);
    System.out.println("expected=" + 2);
    System.out.println("lost-updates=" + (2 - afterSecondWrite));
    System.out.println("atomic-final=" + atomic.get());
    System.out.println("first-write-observed=" + afterFirstWrite);
  }
}`, "schedule=readA,readB,writeA,writeB\nnon-atomic-final=1\nexpected=2\nlost-updates=1\natomic-final=2\nfirst-write-observed=1", ["testcontainers-toxiproxy", "spring-cloud-contract", "java-atomic-integer"] )],
    diagnostics: [
      d("parallel/CI에서만 count·version이 가끔 틀리고 sleep을 늘리면 통과합니다.", "race schedule을 제어하지 않고 timing luck과 shared mutable fixture에 의존했습니다.", ["shared resources/static state", "read/write interleaving", "affected rows/version", "thread dump/failure seed"], "barrier로 충돌 schedule을 고정하고 atomic SQL/optimistic lock/unique constraint와 retry invariant를 actual DB에서 검증합니다.", "same-row, unique insert, lock order, duplicate event와 worker reuse concurrency suite를 둡니다."),
    ],
    expertNotes: ["AtomicInteger 예제는 lost-update 개념만 보이며 여러 DB rows/side effects의 transaction invariant를 대체하지 않습니다.", "fault를 많이 넣는 것보다 각 fault가 어떤 recovery invariant를 검증하는지 명확히 합니다."],
  },
  {
    id: "deterministic-time-random-state",
    title: "Clock·seeded generator·explicit executor와 test namespace로 비결정성을 주입 가능하게 만듭니다",
    lead: "System.currentTimeMillis, random UUID, default timezone, shared executor와 global static state를 production code가 직접 읽으면 경계 test가 자정·병렬·실행 순서에 따라 흔들립니다.",
    explanations: [
      "업무 시간은 Clock/InstantSource를 constructor에 주입하고 test는 fixed/offset clock으로 expiry, rollover, DST와 boundary를 결정적으로 만듭니다. timezone/precision을 명시하고 실제 scheduler integration은 virtual/fake clock 지원 범위를 확인합니다.",
      "일반 simulation/random choice는 seeded test generator와 실패 seed를 기록해 재현합니다. security token/id는 SecureRandom/production generator를 사용하되 test에서 injectable port로 deterministic fake를 제공하며 약한 seed를 production에 사용하지 않습니다.",
      "executor/scheduler는 direct/manual executor로 task enqueue·run 순서를 제어하고 timeout/cancel/cleanup을 assertion합니다. production thread pool size, queue와 context propagation은 integration/load test에서 검증합니다.",
      "default locale/timezone, environment variables, system properties, static caches와 temp directories를 test가 변경하면 finally 복원하고 parallel 격리를 적용합니다. 가능하면 global mutation 대신 explicit config parameter를 사용합니다.",
      "test data identity는 worker/run-specific prefix와 monotonic sequence를 사용하고 actual email/domain/account를 복사하지 않습니다. failure artifact에는 seed, clock, config digest와 synthetic ids를 남깁니다.",
    ],
    concepts: [
      c("fixed clock", "항상 지정된 instant를 반환해 시간 경계 test를 재현 가능하게 하는 Clock입니다.", ["production system clock과 교체합니다.", "timezone을 명시합니다."]),
      c("failure seed", "pseudo-random test 입력을 재생할 수 있도록 실패 실행에 기록한 초기 seed입니다.", ["CI artifact에 남깁니다.", "security entropy가 아닙니다."]),
      c("test namespace", "병렬 실행이 file, schema, topic과 id를 공유하지 않도록 run/worker별로 분리한 이름 범위입니다.", ["cleanup을 단순화합니다.", "collision을 막습니다."]),
    ],
    codeExamples: [java("boot09-determinism", "fixed Clock과 seeded random fixture", "Boot09Determinism.java", "고정 시각과 seed 7의 pseudo-random sequence가 실행마다 같은 expiry/id fixture를 만드는지 확인합니다.", String.raw`import java.time.*;
import java.util.Random;

public class Boot09Determinism {
  public static void main(String[] args) {
    Clock clock = Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC);
    Random random = new Random(7L);
    Instant now = clock.instant();
    Instant expires = now.plus(Duration.ofMinutes(5));
    System.out.println("now=" + now);
    System.out.println("expires=" + expires);
    System.out.println("seed=7");
    System.out.println("fixture-number=" + random.nextInt(100));
    System.out.println("system-clock-used=false");
    System.out.println("production-security-random=false");
  }
}`, "now=2026-01-02T03:04:05Z\nexpires=2026-01-02T03:09:05Z\nseed=7\nfixture-number=36\nsystem-clock-used=false\nproduction-security-random=false", ["java-clock", "java-random", "junit-guide"] )],
    diagnostics: [
      d("자정·DST·실행 순서 또는 CI worker에 따라 같은 test가 실패합니다.", "production code가 system time/random/global state와 shared names를 직접 사용합니다.", ["static now/random/env calls", "timezone/locale", "shared files/schema/topics", "failure seed and order"], "Clock/generator/executor/config를 주입하고 fixed seed/time, worker namespace와 global-state restore를 적용합니다.", "expiry max-1/max/max+1, DST/period rollover, randomized seed replay와 shuffled/parallel suite를 둡니다."),
    ],
    expertNotes: ["seeded Random은 test reproducibility용이며 credential/token 보안성을 검증하지 않습니다.", "Clock을 주입해도 database current timestamp와 distributed nodes time은 actual integration/operations에서 별도 검증합니다."],
  },
  {
    id: "ci-sharding-flaky-quarantine",
    title: "test taxonomy·sharding·context cache와 flaky quarantine을 CI 운영 계약으로 만듭니다",
    lead: "suite가 느려지면 무작정 parallelism을 높이거나 flaky test를 rerun/ignore해 green으로 만들기 쉽지만 shared state와 regression signal을 숨길 수 있습니다.",
    explanations: [
      "unit, web/data slice, integration, contract, real-server, migration, fault/load를 별도 Gradle test suites/tasks와 JUnit tags로 분류합니다. PR/nightly/release gate와 timeout/resource requirements를 manifest에 둡니다.",
      "sharding은 stable test id와 historical duration을 사용해 균형을 맞추고 shard마다 test selection manifest를 저장합니다. 0 tests selected, duplicate/missing classes와 fail-fast로 미실행 tests가 숨는 것을 검증합니다.",
      "maxParallelForks와 JUnit parallelism은 DB/container/ports/files/contexts capacity 안에서 조정합니다. worker-specific namespaces, resource locks와 container reuse policy 없이 parallelism만 올리지 않습니다.",
      "flaky failure는 rerun 횟수, seed, environment, first failure artifact와 owner/issue/expiry를 기록합니다. quarantine은 별도 blocking signal과 제한된 기간이며 main gate에서 조용히 ignoreFailures로 바꾸지 않습니다.",
      "Spring context cache hit/miss, context count/startup time, container pull/start와 test duration p50/p95를 profile해 느린 원인을 줄입니다. dirty context와 unique property combinations을 과도하게 만들지 않습니다.",
    ],
    concepts: [
      c("test sharding", "전체 test ids를 여러 CI workers에 중복·누락 없이 분배해 wall-clock을 줄이는 실행 전략입니다.", ["manifest를 저장합니다.", "duration 균형을 고려합니다."]),
      c("flaky quarantine", "재현되지 않는 test를 owner·issue·expiry와 함께 격리하되 failure signal을 유지하는 임시 절차입니다.", ["무기한 skip이 아닙니다.", "release risk를 추적합니다."]),
      c("context cache key", "Spring TestContext가 ApplicationContext 재사용 가능성을 판단하는 configuration identity입니다.", ["불필요한 drift를 줄입니다.", "cache hit를 관측합니다."]),
    ],
    codeExamples: [java("boot09-ci-policy", "stable sharding과 quarantine metadata gate", "Boot09CiPolicy.java", "test ids를 세 shards에 중복 없이 나누고 owner/issue/expiry가 있는 quarantine만 임시 승인하는 policy를 실행합니다.", String.raw`import java.time.*;
import java.util.*;

public class Boot09CiPolicy {
  record Quarantine(String owner, String issue, LocalDate expires) {}
  static int shard(String id, int count) { return id.chars().sum() % count; }
  static boolean eligible(Quarantine value, LocalDate today) {
    return !value.owner().isBlank() && value.issue().startsWith("TEST-") && value.expires().isAfter(today);
  }
  public static void main(String[] args) {
    List<String> ids = List.of("unit-a", "web-b", "db-c", "server-d");
    for (int shard = 0; shard < 3; shard++) {
      int current = shard;
      System.out.println("shard-" + shard + "=" + ids.stream().filter(id -> shard(id, 3) == current).toList());
    }
    Quarantine q = new Quarantine("team-a", "TEST-42", LocalDate.parse("2026-02-01"));
    System.out.println("quarantine-eligible=" + eligible(q, LocalDate.parse("2026-01-01")));
    System.out.println("coverage-90-is-proof=false");
    System.out.println("ignored-failures=false");
  }
}`, "shard-0=[db-c]\nshard-1=[server-d]\nshard-2=[unit-a, web-b]\nquarantine-eligible=true\ncoverage-90-is-proof=false\nignored-failures=false", ["gradle-testing", "junit-guide", "jacoco-counters"] )],
    diagnostics: [
      d("CI는 빨라졌지만 일부 tests가 실행되지 않거나 parallel에서만 flaky해집니다.", "shard selection manifest와 shared-resource isolation 없이 filters/maxParallelForks를 바꿨습니다.", ["discovered vs selected test ids", "duplicate/missing shard union", "worker resource names", "first failure vs rerun outcomes"], "stable id/duration sharding, zero-test/missing gate와 worker namespaces를 적용하고 flaky는 owner/issue/expiry로 추적합니다.", "shard union/intersection, shuffled order, parallel resource contention과 quarantine expiry tests를 둡니다."),
    ],
    expertNotes: ["rerun 후 green은 첫 실패를 지우지 않고 flaky evidence와 build risk로 남겨야 합니다.", "CI wall-clock 개선이 test coverage/evidence 손실로 얻어진 것이 아닌지 selected manifest를 diff합니다."],
  },
  {
    id: "coverage-mutation-governance",
    title: "coverage를 실행 지도 하나로 사용하고 mutation·contract·failure evidence와 함께 release를 판단합니다",
    lead: "line coverage 90%는 assertion 품질, exception branch, concurrency, SQL semantics와 보안 요구가 검증됐다는 뜻이 아닙니다.",
    explanations: [
      "JaCoCo instruction/branch/line/method counters가 무엇을 세는지 이해하고 generated/synthetic code와 exception handling의 한계를 봅니다. 숫자는 미실행 area를 찾는 navigation이지 품질 점수 하나가 아닙니다.",
      "critical policy는 mutation testing 또는 의도적 fault를 넣어 assertion이 실제 behavior change를 잡는지 확인합니다. mutation score도 equivalent mutants/환경 비용이 있어 risk-based module에 적용합니다.",
      "requirements→tests traceability에 status/schema, authorization, transaction, timeout/retry, concurrency와 cleanup invariants를 연결합니다. 한 E2E가 여러 요구를 우연히 지나갔다고 모두 검증한 것으로 표시하지 않습니다.",
      "failure artifact는 test id/seed, layer/graph manifest, versions, clock, request category, sanitized response, SQL/error category와 thread/container logs를 남깁니다. credential, personal/domain values와 raw production data는 제외합니다.",
      "release dashboard는 pass/fail, skipped/quarantined/never-run, duration, context/cache, flakes, coverage/mutation, contract drift와 environment health를 함께 보여 줍니다. 실패 test를 삭제·완화하는 변경도 review와 expiry를 요구합니다.",
    ],
    concepts: [
      c("coverage counter", "bytecode의 instruction/branch/line/method가 test 중 실행됐는지 측정하는 지표입니다.", ["assertion quality는 측정하지 않습니다.", "미실행 area 탐색에 씁니다."]),
      c("mutation testing", "production code를 작은 결함 형태로 바꿔 tests가 그 behavior change를 실패로 잡는지 확인하는 기법입니다.", ["risk 기반으로 적용합니다.", "equivalent mutant를 검토합니다."]),
      c("test evidence manifest", "요구·layer·dependency versions·fixtures·results·비검증 범위를 연결한 release artifact입니다.", ["재현성을 높입니다.", "단일 percent를 보완합니다."]),
    ],
    diagnostics: [
      d("coverage threshold는 높지만 authorization deny나 retry 중복 side effect regression을 잡지 못합니다.", "line 실행을 requirement assertion과 동일시하고 negative/fault/mutation cases가 없습니다.", ["covered lines vs assertions", "negative/failure matrix", "mutation survivors", "requirement traceability"], "critical invariants에 negative/fault/mutation tests를 추가하고 coverage를 evidence manifest의 한 지표로만 사용합니다.", "권한/transaction/retry/concurrency mutations와 forbidden side-effect assertions를 release gate에 둡니다."),
    ],
    expertNotes: ["coverage 하락을 무조건 막기보다 삭제된 dead code와 새 critical untested branch를 구분합니다.", "테스트가 측정 대상을 바꾸도록 production 설계를 왜곡하지 말고 observable ports/outcomes를 개선합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-boot-context-test", repository: "local learning archive", path: "springboot/MyProject01/src/test/java/com/study/myproject01/MyProject01ApplicationTests.java", usedFor: ["minimal SpringBootTest contextLoads provenance"], evidence: "Read-only audit: 13 lines, 227 bytes, SHA-256 2E099C132495777DE2D74E6B67FA4FFEED70D4C70B6FD3424CBE20F7215B2E08." },
  { id: "local-mvc-context-test", repository: "local learning archive", path: "springmvc/myproject01/src/test/java/org/study/myproject01/Myproject01ApplicationTests.java", usedFor: ["second minimal SpringBootTest contextLoads provenance"], evidence: "Read-only audit: 13 lines, 227 bytes, SHA-256 65ACB5A7BE52C1E9D8E71B178355610FD474659F91AEA502E7A3A92D4D139409." },
  { id: "spring-boot-testing", repository: "Spring Boot Reference", path: "Testing", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/index.html", usedFor: ["test modules, starter and overall Boot test support"], evidence: "Spring Boot 공식 testing reference입니다." },
  { id: "spring-boot-app-tests", repository: "Spring Boot Reference", path: "Testing Spring Boot Applications", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html", usedFor: ["SpringBootTest web environments, slices and context behavior"], evidence: "Spring Boot 공식 application testing reference입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework Reference", path: "MockMvc Overview", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc/overview.html", usedFor: ["DispatcherServlet-based MVC testing without running server"], evidence: "Spring Framework 공식 MockMvc reference입니다." },
  { id: "spring-security-mockmvc", repository: "Spring Security Reference", path: "Spring MVC Test Integration", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/", usedFor: ["authenticated users, CSRF and security assertions"], evidence: "Spring Security 공식 MockMvc integration reference입니다." },
  { id: "spring-test-transactions", repository: "Spring Framework Reference", path: "Test-managed Transactions", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html", usedFor: ["rollback, flush false positives and preemptive timeout warning"], evidence: "Spring Framework 공식 TestContext transaction reference입니다." },
  { id: "spring-boot-testcontainers", repository: "Spring Boot Reference", path: "Testcontainers", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/testcontainers.html", usedFor: ["container lifecycle and service connections"], evidence: "Spring Boot 공식 Testcontainers reference입니다." },
  { id: "testcontainers-databases", repository: "Testcontainers for Java", path: "Database Containers", publicUrl: "https://java.testcontainers.org/modules/databases/", usedFor: ["real supported database testing"], evidence: "Testcontainers 공식 database module documentation입니다." },
  { id: "testcontainers-toxiproxy", repository: "Testcontainers for Java", path: "Toxiproxy Module", publicUrl: "https://java.testcontainers.org/modules/toxiproxy/", usedFor: ["network latency/reset fault injection"], evidence: "Testcontainers 공식 Toxiproxy module documentation입니다." },
  { id: "spring-cloud-contract", repository: "Spring Cloud Contract Reference", path: "Spring Cloud Contract", publicUrl: "https://docs.spring.io/spring-cloud-contract/reference/index.html", usedFor: ["consumer and producer HTTP contract tests"], evidence: "Spring Cloud Contract 공식 reference입니다." },
  { id: "junit-guide", repository: "JUnit", path: "JUnit User Guide", publicUrl: "https://docs.junit.org/current/user-guide/", usedFor: ["Jupiter tests, tags, timeout and parallel execution"], evidence: "JUnit 공식 current user guide입니다." },
  { id: "gradle-testing", repository: "Gradle User Manual", path: "Testing in Java and JVM projects", publicUrl: "https://docs.gradle.org/current/userguide/java_testing.html", usedFor: ["test tasks, filtering, reports and parallel forks"], evidence: "Gradle 공식 Java testing guide입니다." },
  { id: "jacoco-counters", repository: "JaCoCo", path: "Coverage Counters", publicUrl: "https://www.jacoco.org/jacoco/trunk/doc/counters.html", usedFor: ["instruction, branch, line and complexity coverage limitations"], evidence: "JaCoCo 공식 counter documentation입니다." },
  { id: "java-clock", repository: "Java SE 21 API", path: "Clock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html", usedFor: ["fixed injectable time"], evidence: "Oracle JDK 공식 Clock API입니다." },
  { id: "java-random", repository: "Java SE 21 API", path: "Random", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html", usedFor: ["seeded deterministic test fixtures and security caveat"], evidence: "Oracle JDK 공식 Random API입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["atomic counter comparison"], evidence: "Oracle JDK 공식 AtomicInteger API입니다." },
];

const session = createExpertSession({
  inventoryId: "boot-09-testing-slices", slug: "boot-09-testing-slices", courseId: "spring", moduleId: "spring-boot-rest-integration", order: 9,
  title: "Spring Boot 단위·slice·통합 테스트 전략", subtitle: "contextLoads에서 출발해 unit, MVC/data slice, full/real server, container·contract·fault·concurrency와 CI evidence를 계층별로 완성합니다.", level: "전문가", estimatedMinutes: 105,
  coreQuestion: "어떤 요구를 unit·slice·full context·real server 중 어디서 검증해야 하며, transaction rollback·mock·coverage와 flaky green이 만드는 false confidence를 어떻게 제거할까요?",
  summary: "두 로컬 test 파일을 read-only로 감사해 각각 @SpringBootTest와 빈 contextLoads 한 개뿐인 13-line smoke skeleton임을 확인했습니다. 이를 완성된 suite로 과장하지 않고 test objective/scope matrix, pure unit과 strict doubles, @WebMvcTest/MockMvc serialization·security, data slice flush/transaction false positives, @SpringBootTest MOCK/RANDOM_PORT thread 경계, Testcontainers migration/real DB, consumer contract와 network fault, deterministic concurrency/time/random, CI taxonomy/sharding/flaky quarantine와 coverage/mutation limits로 확장합니다. 여섯 JDK 21 예제는 layer selection, HTTP security matrix, flush failure, lost update, fixed dependencies와 CI shard policy를 실제 실행합니다.",
  objectives: ["contextLoads가 보장하는 범위와 evidence gap을 설명한다.", "pure unit test와 strict test double의 contract를 설계한다.", "@WebMvcTest/MockMvc로 mapping·validation·JSON·security를 검증한다.", "data slice에서 flush·clear·commit과 actual DB false positives를 제거한다.", "SpringBootTest MOCK과 RANDOM_PORT의 server/thread/transaction 경계를 구분한다.", "Testcontainers와 production migration/engine configuration을 연결한다.", "consumer contract, fault injection과 concurrency schedule을 검증한다.", "Clock/random/executor/global state를 deterministic dependency로 만든다.", "test taxonomy, sharding, context cache와 flaky quarantine을 운영한다.", "coverage/mutation/requirement evidence를 release gate로 통합한다."],
  prerequisites: [{ title: "번역·AI 외부 API의 요청 계약과 보안", reason: "외부 provider의 schema, timeout/retry/idempotency, quota, privacy와 nondeterministic output을 알아야 unit stub, contract, fault와 live integration test의 경계를 정확히 설계할 수 있습니다.", sessionSlug: "boot-08-translation-ai-api" }],
  keywords: ["JUnit", "unit test", "test double", "@WebMvcTest", "MockMvc", "@SpringBootTest", "test slice", "transactional test", "Testcontainers", "contract test", "fault injection", "concurrency test", "deterministic Clock", "CI sharding", "flaky quarantine", "JaCoCo"],
  topics,
  lab: {
    title: "contextLoads-only 프로젝트를 risk-based multi-layer test portfolio로 전환하기",
    scenario: "두 프로젝트에 context start smoke만 있습니다. 게시판/외부 API 같은 대표 use case를 선택해 빠른 unit부터 MVC/data slices, real server/DB와 fault/concurrency까지 중복보다 evidence gap을 기준으로 확장합니다.",
    setup: ["두 원본 test는 read-only provenance로 보존하고 실제 application secret/domain/database values를 fixture에 복사하지 않습니다.", "synthetic request/actor/data, fixed Clock/seed, strict ports와 provider stubs를 준비합니다.", "supported DB image와 production migration, Testcontainers/Toxiproxy 및 random-port profile을 격리합니다.", "requirement→layer→dependency realness→assertions→non-goals test evidence manifest를 만듭니다."],
    steps: ["contextLoads가 로드한 config와 assertion 0인 gap을 기록합니다.", "validator/policy/service orchestration을 constructor unit tests와 strict doubles로 분리합니다.", "@WebMvcTest에서 mapping, body/validation, JSON/problem, anonymous/roles/CSRF와 service call count를 검증합니다.", "data slice에 production migration과 supported DB를 적용하고 flush/clear/reload/affected rows를 검사합니다.", "full MOCK context에서 conditions/wiring과 slice parity를 확인합니다.", "RANDOM_PORT에서 real container HTTP, error/streaming과 server transaction cleanup을 검증합니다.", "provider/consumer contracts와 malformed/slow/reset/429/5xx faults를 주입합니다.", "barrier로 same-row/unique/retry interleavings와 eventual convergence를 실행합니다.", "Clock/random/executor/worker namespace로 repeat/shuffle/parallel 결과를 고정합니다.", "suite를 PR/nightly/release tasks/tags/shards로 나누고 selected manifest를 검산합니다.", "flaky first-failure artifact, owner/issue/expiry와 coverage/mutation/requirement dashboard를 생성합니다.", "secret/PII canary 0, container/thread/data cleanup 0과 source hashes를 제출합니다."],
    expectedResult: ["각 요구가 가장 좁은 충분 layer와 필요한 real dependency에서 검증되고 non-goals가 문서화됩니다.", "MVC status/schema/security와 DB flush/commit/driver behaviors가 unit mocks 밖의 evidence로 증명됩니다.", "timeout/reset/duplicate/race와 async convergence가 deterministic fault/schedule로 재현됩니다.", "parallel/sharded suite가 tests를 중복·누락하지 않고 shared state 없이 같은 결과를 냅니다.", "coverage 하나가 아닌 assertions, mutation, contracts, flakes, timings와 cleanup이 release report에 연결됩니다."],
    cleanup: ["synthetic rows/topics/files/contracts, test schemas와 container volumes를 제거합니다.", "clients/servers/proxies/containers/executors를 종료하고 open connections/threads/ports가 없는지 확인합니다.", "system properties/timezone/locale/fault toxics를 복원하고 shard namespaces를 삭제합니다.", "로컬 원본 test와 actual application configuration은 변경하지 않습니다."],
    extensions: ["architecture tests와 dependency/module boundaries를 추가합니다.", "mutation testing을 authorization/retry/transaction critical modules에 적용합니다.", "performance regression budget과 representative load dataset을 nightly에 연결합니다.", "production incident regression corpus와 test evidence manifest를 양방향 trace합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java 예제를 실행하고 각 결과를 실제 Spring test layer에서 확인할 evidence로 연결하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "concern별 layer를 설명합니다.", "401/403/400/201과 call count를 설명합니다.", "flush false positive를 설명합니다.", "lost update schedule을 설명합니다.", "fixed clock/seed를 확인합니다.", "shard union과 quarantine metadata를 확인합니다."], hints: ["JDK model이 실제 Spring/DB를 대신한다고 쓰지 말고 다음 adapter test를 명시하세요."], expectedOutcome: "test annotation 이름이 아니라 실행 범위·failure mode·evidence로 전략을 설명합니다.", solutionOutline: ["classify→isolate→exercise→flush→fault→replay→report 순서입니다."] },
    { difficulty: "응용", prompt: "contextLoads-only 원본을 대표 CRUD/외부 API use case의 multi-layer suite로 확장하세요.", requirements: ["원본은 read-only로 둡니다.", "unit/slice/full/real scopes를 기록합니다.", "MockMvc serialization/security를 검증합니다.", "actual DB migration/flush/commit을 검증합니다.", "Testcontainers/contract/fault를 실행합니다.", "concurrency/time/random을 deterministic하게 합니다.", "CI shard/flaky/cleanup gates를 둡니다.", "coverage 한계를 evidence manifest에 기록합니다."], hints: ["같은 happy path를 모든 layer에 복제하지 말고 각 layer에서만 발견 가능한 risk를 선택하세요."], expectedOutcome: "빠르고 실패 위치가 분명하면서 production adapter gap이 닫힌 test portfolio가 완성됩니다.", solutionOutline: ["inventory→risk→layer→realness→fault→parallelize→govern 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 Spring Boot test architecture와 CI governance를 작성하세요.", requirements: ["test taxonomy/starter/version policy를 둡니다.", "unit/double contract를 둡니다.", "web/data/full/real-server acceptance를 정의합니다.", "Testcontainers/migration/contract/fault policy를 둡니다.", "transaction/concurrency/determinism rules를 둡니다.", "sharding/cache/flaky quarantine를 정의합니다.", "coverage/mutation/evidence/privacy/retention release gate를 둡니다."], hints: ["속도, fidelity, localization과 maintenance를 함께 최적화하고 test pyramid 모양 자체를 KPI로 만들지 마세요."], expectedOutcome: "새 기능·dependency·incident마다 검증 위치와 evidence가 일관되게 추가되는 표준이 완성됩니다.", solutionOutline: ["scope→contract→isolation→realism→failure→scale→evidence 순서입니다."] },
  ],
  nextSessions: ["jpa-01-starter-datasource-ddl"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["springboot MyProject01ApplicationTests.java는 read-only로 13 lines/227 bytes, SHA-256 2E099C132495777DE2D74E6B67FA4FFEED70D4C70B6FD3424CBE20F7215B2E08을 확인했습니다.", "springmvc Myproject01ApplicationTests.java는 read-only로 13 lines/227 bytes, SHA-256 65ACB5A7BE52C1E9D8E71B178355610FD474659F91AEA502E7A3A92D4D139409을 확인했습니다.", "두 원본은 @SpringBootTest와 빈 contextLoads 한 개뿐이므로 context startup skeleton 이상으로 과장하지 않았습니다.", "원본이 다루지 않는 unit/slice/MockMvc/security, DB flush/commit, real server/Testcontainers, contract/fault/concurrency, deterministic dependencies, CI/flaky/coverage governance는 현재 공식 Spring/JUnit/Testcontainers/Gradle/JDK 문서와 synthetic examples로 보강했습니다.", "JDK-only examples는 JUnit discovery, Spring TestContext/MockMvc/security, 실제 Servlet server, DB driver/container/network fault와 CI runner behavior를 대체하지 않습니다."] },
});

export default session;
