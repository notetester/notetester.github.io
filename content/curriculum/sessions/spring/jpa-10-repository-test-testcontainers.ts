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
      { lines: `1-${a}`, explanation: "JDK 21 record·collection·Clock으로 test scope, fixture, flush, query budget, concurrency와 CI manifest를 framework 없이 모델링합니다." },
      { lines: `${a + 1}-${b}`, explanation: "false green을 만드는 rollback/cache/shared state를 제거하고 deterministic outcome과 coverage non-goal을 계산합니다." },
      { lines: `${b + 1}-${lines}`, explanation: "synthetic schema·IDs·timing만 출력하며 실제 datasource, credential, 사용자 row와 container host를 사용하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring·JUnit·Docker·DB 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서 예상값과 한 글자씩 같아야 합니다.", "JDK 모형은 Spring TestContext, Hibernate flush, MySQL driver/container, Docker와 CI scheduler를 대신하지 않습니다."] },
    experiments: [
      { change: "test concern, fixture clock, flush point, query budget, interleaving 또는 shard weight를 바꿉니다.", prediction: "선택 layer, validation outcome, query gate, conflict count와 shard totals가 결정적으로 바뀝니다.", result: "scope/real dependencies, rows after cleanup, statements, final state와 manifest union을 비교합니다." },
      { change: "같은 matrix를 @DataJpaTest와 pinned MySQL Testcontainer에서 실행합니다.", prediction: "migration, SQL dialect, constraints, transaction timing, plan과 actual concurrency가 추가 evidence로 드러납니다.", result: "container/image/schema, SQL/rows/plan, exceptions, transaction IDs와 artifacts를 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "provenance-contextloads-gap",
    title: "원본 contextLoads 한 개의 보장과 Repository test gap을 정확히 기록합니다",
    lead: "application context가 한 번 시작됐다는 사실을 query·constraint·transaction·concurrency가 검증됐다는 뜻으로 확대하면 false confidence가 생깁니다.",
    explanations: [
      "read-only 감사에서 test source는 @SpringBootTest와 비어 있는 contextLoads 한 개입니다. @DataJpaTest, repository 호출, assertions, fixture, flush, Testcontainers와 concurrency schedule은 없습니다.",
      "build에는 testing 관련 dependencies가 있지만 dependency 존재가 test 실행 범위와 assertion을 증명하지 않습니다. application YAML에는 datasource/JPA keys가 있으나 실제 values는 읽기 대상일 뿐 학습 자료에 복사하지 않습니다.",
      "Repository에는 derived query와 JPQL methods가 있으므로 query contract를 시험할 후보는 있지만 현재 test가 검증했다고 주장하지 않습니다.",
      "provenance에는 exact relative paths, line/byte counts, hashes와 annotation/method search 결과를 남기고 dependency versions, datasource/table/query literals와 실제 data는 공개 본문에서 제외합니다.",
      "확장 test portfolio는 source를 억지로 정답으로 만드는 것이 아니라 현재 gap→위험→가장 좁은 충분 layer→evidence를 연결합니다.",
    ],
    concepts: [c("context smoke test", "application context가 구성되어 시작 가능한지 확인하는 최소 test입니다.", ["business assertion은 없습니다.", "configuration failure를 찾습니다."]), c("test provenance", "어떤 source와 실행 환경에서 무엇을 실제로 검증했는지 추적하는 기록입니다.", ["dependency와 assertion을 구분합니다.", "hash와 non-goals를 남깁니다."])],
    diagnostics: [d("CI는 green이지만 derived query typo, constraint와 vendor SQL 오류가 배포에서 발견됩니다.", "contextLoads만 있고 repository operation과 database assertions가 없습니다.", ["discovered test count", "assertion count", "repository method coverage", "actual DB engine", "flush/commit evidence"], "context smoke test는 유지하되 risk별 slice/container repository tests를 추가합니다.", "requirement→test ID→layer→real dependency→assertion manifest를 둡니다.")],
    expertNotes: ["test class 수보다 어떤 failure mode를 실제 dependency에서 검출하는지가 중요합니다.", "contextLoads는 가치가 있지만 repository correctness의 대리 지표가 아닙니다."],
  },
  {
    id: "test-layer-selection",
    title: "unit·JPA slice·full context·real server를 risk에 맞게 분리합니다",
    lead: "모든 test를 @SpringBootTest로 만들면 느리고 실패 위치가 넓어지며, 모든 것을 mock하면 mapping·SQL·transaction을 검증하지 못합니다.",
    explanations: [
      "pure validator, specification builder와 retry classifier는 JUnit unit test로 빠르게 검사합니다. EntityManager/provider가 필요 없는 policy에 context를 시작하지 않습니다.",
      "@DataJpaTest는 JPA entities/repositories와 관련 auto-configuration을 좁게 로드해 mapping, query, flush를 검사합니다. imported converters/auditing/configuration 범위를 manifest로 확인합니다.",
      "@SpringBootTest는 service transaction, security/configuration과 application wiring이 필요한 integration에 사용하고 webEnvironment를 선택적으로 구분합니다.",
      "real server test는 HTTP serialization, filter, transaction/thread boundary와 client behavior가 위험일 때만 추가합니다. repository query 자체를 모든 layer에서 반복하지 않습니다.",
      "각 test는 발견하려는 defect, real/mocked dependencies, transaction/context lifetime, non-goals와 예상 실행 시간을 선언합니다.",
    ],
    concepts: [c("test slice", "특정 application layer에 필요한 auto-configuration만 로드하는 좁은 integration context입니다.", ["loaded beans를 확인합니다.", "mock보다 실제 framework가 많습니다."]), c("dependency realness", "test에서 실제로 실행되는 provider, DB, server와 대역의 범위입니다.", ["위험별로 선택합니다.", "문서에 non-goals를 적습니다."])],
    codeExamples: [java("jpa10-layer-selector", "Repository risk별 test layer 선택", "Jpa10LayerSelector.java", "concern을 가장 좁은 충분 test layer와 real dependency로 분류합니다.", String.raw`import java.util.*;

public class Jpa10LayerSelector {
  record Choice(String layer, String realDependency) {}
  static Choice choose(String concern) {
    return switch (concern) {
      case "POLICY" -> new Choice("UNIT", "NONE");
      case "MAPPING", "QUERY" -> new Choice("DATA_JPA_SLICE", "JPA_PROVIDER_DB");
      case "SERVICE_TX" -> new Choice("FULL_CONTEXT", "JPA_PROVIDER_DB");
      case "HTTP_COMMIT" -> new Choice("REAL_SERVER", "SERVER_JPA_DB");
      default -> throw new IllegalArgumentException("unknown concern");
    };
  }
  public static void main(String[] args) {
    for (String concern : List.of("POLICY", "MAPPING", "QUERY", "SERVICE_TX", "HTTP_COMMIT")) {
      Choice c = choose(concern);
      System.out.println(concern + "=" + c.layer() + "|real=" + c.realDependency());
    }
    System.out.println("context-loads-complete=false");
  }
}`, "POLICY=UNIT|real=NONE\nMAPPING=DATA_JPA_SLICE|real=JPA_PROVIDER_DB\nQUERY=DATA_JPA_SLICE|real=JPA_PROVIDER_DB\nSERVICE_TX=FULL_CONTEXT|real=JPA_PROVIDER_DB\nHTTP_COMMIT=REAL_SERVER|real=SERVER_JPA_DB\ncontext-loads-complete=false", ["local-context-test", "boot-testing", "boot-application-tests", "boot-datajpatest-api"])],
    diagnostics: [d("작은 repository query test가 전체 context·network setup 때문에 느리고 원인이 불명확합니다.", "risk보다 넓은 @SpringBootTest layer를 기본값으로 사용했습니다.", ["loaded context/beans", "test target", "real dependencies", "startup timing", "failure localization"], "mapping/query는 JPA slice로 이동하고 full/real tests는 transaction/wiring/HTTP 위험만 남깁니다.", "test architecture review에서 최소 충분 layer와 non-goals를 요구합니다.")],
    expertNotes: ["test pyramid 모양보다 change risk와 feedback latency의 portfolio가 중요합니다.", "slice가 production configuration을 자동으로 모두 반영한다고 가정하지 말고 import/conditions를 검증합니다."],
  },
  {
    id: "deterministic-fixtures-clock-data",
    title: "fixture를 fixed Clock·명시적 factory·독립 namespace로 결정적으로 만듭니다",
    lead: "현재 시각, auto-generated ID, test order와 공유 DB state에 기대면 로컬에서는 통과하고 CI에서 간헐적으로 실패합니다.",
    explanations: [
      "entity lifecycle이 LocalDateTime.now 같은 ambient time을 사용하면 boundary assertion이 흔들립니다. production design에 Clock/creator port를 주입하거나 DB-generated time을 query round-trip tolerance와 함께 검증합니다.",
      "fixture factory는 필요한 field를 명시하고 무의미한 전체-object builder default를 복사하지 않습니다. synthetic values와 test case ID namespace를 사용하며 실제 user/contact/credential을 쓰지 않습니다.",
      "generated ID exact number나 insertion order에 의존하지 않고 returned ID presence, unique business key와 explicit ORDER BY를 assert합니다.",
      "test order/parallelism을 바꿔도 결과가 같도록 transaction/schema/database namespace를 격리하고 setup/cleanup owner를 명시합니다.",
      "locale/timezone/charset, DB session variables와 random seed를 manifest에 고정하고 failure artifact에 값이 아닌 category/version을 남깁니다.",
    ],
    concepts: [c("deterministic fixture", "같은 manifest에서 항상 같은 logical state와 assertion을 만드는 synthetic test data입니다.", ["time/random/order를 주입합니다.", "production data를 복사하지 않습니다."]), c("test namespace", "parallel workers/cases가 서로의 rows와 resources를 침범하지 않게 구분하는 식별 범위입니다.", ["unique constraint와 맞춥니다.", "cleanup owner를 둡니다."])],
    codeExamples: [java("jpa10-deterministic-fixture", "fixed Clock 기반 fixture manifest", "Jpa10DeterministicFixture.java", "고정 시각과 case namespace로 같은 fixture가 재현되는지 출력합니다.", String.raw`import java.time.*;
import java.util.*;

public class Jpa10DeterministicFixture {
  record Fixture(String key, Instant createdAt, List<String> tags) {}
  static Fixture create(Clock clock, String caseId) {
    return new Fixture("case-" + caseId, clock.instant(), List.of("alpha", "beta"));
  }
  public static void main(String[] args) {
    Clock clock = Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC);
    Fixture first = create(clock, "07");
    Fixture second = create(clock, "07");
    System.out.println("key=" + first.key());
    System.out.println("created-at=" + first.createdAt());
    System.out.println("tags=" + first.tags());
    System.out.println("repeat-equal=" + first.equals(second));
    System.out.println("system-clock-used=false");
    System.out.println("production-data-used=false");
  }
}`, "key=case-07\ncreated-at=2026-01-02T03:04:05Z\ntags=[alpha, beta]\nrepeat-equal=true\nsystem-clock-used=false\nproduction-data-used=false", ["local-jpa-build", "local-application-yaml", "java-clock-api", "boot-database-initialization"])],
    diagnostics: [d("자정·timezone 또는 parallel 실행에서 날짜/unique assertion이 간헐 실패합니다.", "system clock, 공유 key와 실행 order가 fixture에 숨어 있습니다.", ["Clock/timezone", "random seed", "worker namespace", "ORDER BY", "shared rows/cache"], "fixed Clock와 case/worker key를 주입하고 explicit ordering과 isolated cleanup을 적용합니다.", "repeat/shuffle/timezone/parallel matrix를 CI에 둡니다.")],
    expertNotes: ["test를 위해 production에서 모든 시간을 fake로 만들지 말고 domain time source와 DB audit time의 owner를 분리합니다.", "민감 production snapshot은 결정적 fixture가 아니라 보안·retention·schema drift 위험입니다."],
  },
  {
    id: "schema-migration-vendor-parity",
    title: "production migration을 container schema의 유일한 source로 사용합니다",
    lead: "test에서 Hibernate create-drop이 만든 schema만 쓰면 실제 migration 순서, constraints, types와 privileges 오류를 건너뜁니다.",
    explanations: [
      "test container도 production과 같은 immutable migration ledger를 empty database에 적용하고 application은 validate 모드로 mapping/catalog drift를 확인합니다.",
      "application YAML의 datasource와 ddl keys는 구조 provenance만 사용하고 실제 URL, account, password와 schema names는 test source나 report에 복사하지 않습니다. dynamic container values는 runtime binding으로 주입합니다.",
      "MySQL dialect, collation, timezone, SQL mode, case sensitivity와 driver version을 production support matrix에 맞춰 pinning합니다. in-memory DB로 대체할 때 non-goals를 명시합니다.",
      "migration test는 empty→latest, supported previous→latest, checksum/history, failed migration recovery와 backward-compatible application window를 검증합니다.",
      "schema reset은 test-owned disposable database/schema만 대상으로 하고 resolved target을 확인한 뒤 수행합니다. shared/local development database를 drop하지 않습니다.",
    ],
    concepts: [c("migration ledger", "적용 순서·version·checksum과 성공 상태를 기록하는 schema 변경 원장입니다.", ["immutable history를 유지합니다.", "test와 production이 공유합니다."]), c("vendor parity", "production DB engine/version/config에서 의존하는 semantics를 test가 실제로 실행하는 정도입니다.", ["dialect/types/locks를 포함합니다.", "지원 matrix를 pin합니다."])],
    diagnostics: [d("H2/create-drop test는 통과하지만 MySQL migration 또는 query가 실패합니다.", "test schema owner와 dialect가 production과 다릅니다.", ["DB engine/version", "migration history/checksum", "ddl-auto", "catalog constraints/types", "driver/session modes"], "pinned MySQL container에 production migrations를 적용하고 application mapping은 validate합니다.", "empty/upgrade migration tests와 catalog snapshot diff를 둡니다.")],
    expertNotes: ["migration tool과 Hibernate가 동시에 schema owner가 되지 않게 환경별 책임을 한 곳으로 고정합니다.", "container parity는 production data volume/topology/privilege를 자동 복제하지 않으므로 별도 acceptance가 필요합니다."],
  },
  {
    id: "testcontainers-mysql-lifecycle",
    title: "Testcontainers MySQL을 pinned image·readiness·dynamic binding으로 격리합니다",
    lead: "개발자 PC의 상시 DB를 공유하면 이전 rows, 수동 설정과 port 충돌 때문에 test가 재현되지 않습니다.",
    explanations: [
      "MySQLContainer는 test-owned disposable database를 제공하며 JUnit lifecycle 또는 Spring Boot service connection으로 application datasource에 연결할 수 있습니다. host/port/account values를 source에 hardcode하지 않습니다.",
      "image tag/digest, Testcontainers/driver versions와 migration checksum을 manifest에 pin하고 의도한 upgrade PR에서만 바꿉니다. latest tag는 재현 가능성을 깨뜨립니다.",
      "container process ready와 database가 migration/query를 받을 준비는 다를 수 있습니다. module wait strategy와 실제 connection/migration 성공을 readiness evidence로 사용합니다.",
      "class/suite/container reuse는 startup 시간과 isolation trade-off가 있습니다. 공유하면 test마다 state reset, sequence/cache/session settings 복원과 parallel namespace를 강제합니다.",
      "Docker unavailable, image pull failure, startup timeout을 assertion failure와 구분하고 CI preflight/artifacts로 진단하되 자동으로 다른 DB로 silent fallback하지 않습니다.",
    ],
    concepts: [c("disposable database", "test가 생성·소유·초기화·폐기하는 격리된 DB instance/schema입니다.", ["known state에서 시작합니다.", "shared service에 의존하지 않습니다."]), c("dynamic binding", "container가 시작한 뒤 얻은 connection properties를 application context에 전달하는 방식입니다.", ["literal을 source에 넣지 않습니다.", "context cache key를 검토합니다."])],
    diagnostics: [d("로컬은 통과하지만 CI container가 다른 port/config를 써 connection이 실패합니다.", "고정 host/port나 external DB profile을 test가 참조합니다.", ["resolved datasource origin without values", "container lifecycle", "service connection/dynamic properties", "context cache", "readiness logs"], "container runtime properties를 dynamic binding하고 external fallback을 금지합니다.", "CI에서 isolated clean environment preflight와 datasource-origin assertion을 둡니다.")],
    expertNotes: ["container reuse는 개발 편의 옵션이며 CI correctness가 reuse state에 의존하면 안 됩니다.", "test logs와 failure reports에도 generated password/URL이 포함될 수 있어 exporter redaction을 검사합니다."],
  },
  {
    id: "transaction-rollback-flush-commit",
    title: "test-managed rollback의 false green을 flush·clear·real commit 경계로 닫습니다",
    lead: "test method 끝에 rollback되면 database constraint가 flush되지 않거나 production commit 이후 동작을 전혀 실행하지 않을 수 있습니다.",
    explanations: [
      "@DataJpaTest의 test-managed transaction은 격리와 cleanup에 유용하지만 application transaction과 동일한 lifecycle이라고 가정하지 않습니다. preemptive timeout/thread 전환도 transaction binding을 벗어날 수 있습니다.",
      "save 뒤 constraint/query behavior를 확인하려면 flush로 SQL을 강제하고 clear한 뒤 다시 조회해 first-level cache 착시를 제거합니다. exception은 transaction을 rollback-only로 만들 수 있습니다.",
      "commit-time constraint, after-commit listener/outbox와 server request transaction은 test rollback 안에서 검증되지 않습니다. 별도 transaction 또는 real-server call로 commit을 실제 수행하고 명시적 cleanup합니다.",
      "rollback되지 않는 test는 test-owned unique namespace와 cleanup ledger를 사용하며 failure 중간에도 finally teardown을 수행합니다.",
      "assertion은 repository returned object만 보지 않고 database rows, constraints, version, emitted outbox와 post-commit observable result를 확인합니다.",
    ],
    concepts: [c("test-managed transaction", "Spring TestContext가 test method를 감싸고 기본 rollback할 수 있는 transaction입니다.", ["application transaction과 상호작용을 봅니다.", "다른 thread를 자동 포함하지 않습니다."]), c("flush/clear round trip", "pending changes를 SQL로 동기화하고 persistence context cache를 비운 뒤 DB에서 다시 읽는 검증입니다.", ["constraint를 드러냅니다.", "managed object 착시를 줄입니다."])],
    codeExamples: [java("jpa10-flush-boundary", "flush 전 false green과 constraint 검출", "Jpa10FlushBoundary.java", "중복 key가 staged 상태에서는 보이지 않고 flush에서만 실패하는 test 모형을 실행합니다.", String.raw`import java.util.*;

public class Jpa10FlushBoundary {
  static String flush(List<String> staged) {
    return staged.size() == new HashSet<>(staged).size() ? "COMMITTABLE" : "UNIQUE_CONSTRAINT";
  }
  public static void main(String[] args) {
    List<String> staged = List.of("case-a", "case-a");
    boolean saveReturned = true;
    System.out.println("save-returned=" + saveReturned);
    System.out.println("assert-before-flush=FALSE_GREEN");
    System.out.println("flush=" + flush(staged));
    System.out.println("clear-required=true");
    System.out.println("rows-after-rollback=0");
    System.out.println("production-commit-tested=false");
  }
}`, "save-returned=true\nassert-before-flush=FALSE_GREEN\nflush=UNIQUE_CONSTRAINT\nclear-required=true\nrows-after-rollback=0\nproduction-commit-tested=false", ["local-guestbook-repository", "spring-test-transactions", "jakarta-persistence-spec"])],
    diagnostics: [d("save test는 통과하지만 production commit에서 constraint/after-commit이 실패합니다.", "flush 없이 managed object만 assert하거나 test rollback이 commit behavior를 숨깁니다.", ["flush/SQL timing", "clear/reload", "transaction owner", "commit callbacks", "database final rows"], "slice test에 flush/clear를 추가하고 commit-only behavior는 별도 real transaction/server test로 검증합니다.", "constraint마다 failure test와 post-commit evidence test를 둡니다.")],
    expertNotes: ["rollback은 cleanup 전략이지 commit semantics의 대체물이 아닙니다.", "assertThrows 뒤 같은 transaction을 계속 쓰지 말고 rollback-only 상태를 확인해 독립 test로 분리합니다."],
  },
  {
    id: "repository-query-contract-budget",
    title: "derived·JPQL query를 결과 semantics와 statement/row budget으로 검증합니다",
    lead: "method가 값을 반환했다는 assertion만으로 filter, null, ordering, duplicate, cardinality와 N+1 회귀를 잡을 수 없습니다.",
    explanations: [
      "원본 repository의 derived query와 explicit JPQL methods는 같은 filter 의도를 가질 수 있으므로 empty/one/many, active/inactive, boundary와 parameter binding matrix를 공유해 결과 set을 비교합니다.",
      "단건 반환은 0건 null/Optional, 2건 이상 non-unique behavior를 명확히 계약합니다. 우연한 insertion order를 기대하지 않고 필요한 ORDER BY를 query와 assertion에 둡니다.",
      "persistence context를 flush/clear하고 query counter를 초기화한 뒤 statement identity/count, rows와 selected graph를 assert합니다. 이전 session cache가 query를 생략하는 착시를 제거합니다.",
      "pagination이면 content와 count query의 filter parity, stable tie-breaker, duplicate roots와 page boundaries를 검증합니다.",
      "query budget은 작은 fixture query 수뿐 아니라 representative cardinality에서 rows/binds/duration/plan을 함께 제한합니다.",
    ],
    concepts: [c("query contract", "repository method의 parameters, filter, result cardinality/order, loaded graph와 failure semantics입니다.", ["boundary matrix로 검증합니다.", "SQL implementation과 분리합니다."]), c("statement budget", "한 use case가 허용하는 normalized SQL statements와 rows/binds 상한입니다.", ["cache를 통제합니다.", "N+1 회귀를 막습니다."])],
    codeExamples: [java("jpa10-query-budget", "repository query count와 row budget", "Jpa10QueryBudget.java", "root와 child access 규모에서 lazy plan이 budget을 넘고 bounded plan은 통과하는지 계산합니다.", String.raw`public class Jpa10QueryBudget {
  record Evidence(int statements, int rows) {
    boolean passes(int maxStatements, int maxRows) {
      return statements <= maxStatements && rows <= maxRows;
    }
  }
  public static void main(String[] args) {
    int roots = 6;
    Evidence lazy = new Evidence(1 + roots, 18);
    Evidence bounded = new Evidence(2, 18);
    System.out.println("roots=" + roots);
    System.out.println("lazy-statements=" + lazy.statements());
    System.out.println("lazy-pass=" + lazy.passes(3, 20));
    System.out.println("bounded-statements=" + bounded.statements());
    System.out.println("bounded-rows=" + bounded.rows());
    System.out.println("bounded-pass=" + bounded.passes(3, 20));
    System.out.println("cache-cleared=true");
  }
}`, "roots=6\nlazy-statements=7\nlazy-pass=false\nbounded-statements=2\nbounded-rows=18\nbounded-pass=true\ncache-cleared=true", ["local-guestbook-repository", "spring-data-query-methods", "mysql-explain"])],
    diagnostics: [d("query result assertion은 통과하지만 statement 수가 fixture root에 비례해 증가합니다.", "result semantics만 검증하고 fetch/query budget과 cache condition을 고정하지 않았습니다.", ["root cardinality", "statement fingerprints", "rows/binds", "persistence/cache clear", "execution plan"], "representative fixture에서 normalized statement/row budget과 plan assertion을 추가합니다.", "query-budget helper와 root-size slope regression test를 둡니다.")],
    expertNotes: ["SQL 문자열 완전 일치는 provider upgrade에 취약하므로 semantic fingerprint와 critical plan properties를 선택합니다.", "count budget을 낮추기 위해 correctness가 다른 query로 바꾸지 말고 result contract를 먼저 고정합니다."],
  },
  {
    id: "deterministic-concurrency-tests",
    title: "독립 transactions와 barrier로 lost update·lock timeout·retry를 결정적으로 재현합니다",
    lead: "threads를 많이 띄우고 가끔 충돌하기를 기다리는 test는 느리고 flaky하며 어떤 schedule을 검증했는지 설명할 수 없습니다.",
    explanations: [
      "각 worker는 별도 transaction/EntityManager/connection을 사용하고 barrier를 read 이후, write/flush 직전에 둬 원하는 interleaving을 강제합니다. test-managed outer transaction을 workers와 공유하지 않습니다.",
      "optimistic test는 같은 version read→one commit→one conflict→fresh retry를, pessimistic test는 lock acquired→wait/timeout→release를 명시적으로 제어합니다.",
      "deadlock test는 opposite order로 two resources를 잠그고 victim 한 건, full rollback/retry와 invariant final state를 assert합니다. sleep은 synchronization contract로 쓰지 않습니다.",
      "timeout에는 test 자체 hard ceiling과 database lock timeout을 구분하고 timeout 뒤 threads/connections/transactions를 취소·종료합니다.",
      "repeat와 randomized schedule은 deterministic core cases 뒤 보조 탐색으로 사용하며 failure seed, interleaving events와 final state를 artifact로 남깁니다.",
    ],
    concepts: [c("controlled interleaving", "barrier/latch로 transaction event 순서를 명시한 concurrency schedule입니다.", ["sleep에 의존하지 않습니다.", "event trace를 남깁니다."]), c("independent transaction", "각 concurrent actor가 별도 persistence context와 physical transaction을 갖는 조건입니다.", ["outer test rollback과 분리합니다.", "fresh retry를 검증합니다."])],
    codeExamples: [java("jpa10-concurrency-schedule", "version conflict와 fresh retry schedule", "Jpa10ConcurrencySchedule.java", "두 actors가 같은 version을 읽은 뒤 한 conflict가 발생하고 fresh retry로 두 변화가 반영되는 event trace를 계산합니다.", String.raw`import java.util.*;

public class Jpa10ConcurrencySchedule {
  record State(int value, int version) {}
  public static void main(String[] args) {
    List<String> events = List.of("read-A-v0", "read-B-v0", "commit-A-v1", "conflict-B-v0", "retry-B-v1", "commit-B-v2");
    State finalState = new State(2, 2);
    long conflicts = events.stream().filter(e -> e.startsWith("conflict")).count();
    System.out.println("events=" + events);
    System.out.println("actors=2");
    System.out.println("independent-transactions=true");
    System.out.println("conflicts=" + conflicts);
    System.out.println("fresh-retries=1");
    System.out.println("final-value=" + finalState.value());
    System.out.println("final-version=" + finalState.version());
  }
}`, "events=[read-A-v0, read-B-v0, commit-A-v1, conflict-B-v0, retry-B-v1, commit-B-v2]\nactors=2\nindependent-transactions=true\nconflicts=1\nfresh-retries=1\nfinal-value=2\nfinal-version=2", ["testcontainers-mysql", "testcontainers-junit5", "java-cyclic-barrier"])],
    diagnostics: [d("concurrency test가 대개 통과하지만 가끔 timeout되고 원하는 conflict가 발생하지 않습니다.", "thread scheduling과 sleep에 의존하며 transaction/context가 실제로 독립인지 불명확합니다.", ["barrier event trace", "transaction/connection IDs", "flush points", "DB timeout", "thread cleanup"], "독립 transactions와 barriers로 read/write 순서를 고정하고 hard timeout/final cleanup을 둡니다.", "각 schedule의 event sequence와 terminal state를 exact assertion합니다.")],
    expertNotes: ["deterministic schedule은 모든 interleaving을 증명하지 않지만 알려진 anomaly를 안정적으로 회귀 검사합니다.", "random stress는 실패 seed를 replay하지 못하면 debugging evidence가 부족합니다."],
  },
  {
    id: "query-plan-index-regression",
    title: "EXPLAIN·catalog와 representative data로 plan/index 회귀를 검증합니다",
    lead: "작은 fixture에서는 full scan도 빠르므로 query duration만 재면 index 누락과 rows estimate drift가 보이지 않습니다.",
    explanations: [
      "critical repository queries는 MySQL EXPLAIN/EXPLAIN ANALYZE의 chosen access/index, estimated/actual rows와 sort/temp behavior를 support version에서 수집합니다.",
      "plan text 전체를 byte-for-byte snapshot하지 않고 must-use predicate/index availability, max rows examined와 forbidden full scan 같은 안정된 properties를 고릅니다.",
      "fixture cardinality, selectivity와 distribution이 production risk를 대표해야 합니다. production rows를 복사하지 않고 deterministic generator와 anonymized distribution specification을 사용합니다.",
      "index 추가는 write amplification, storage, lock footprint와 다른 queries를 바꾸므로 single-query speed만으로 승인하지 않습니다.",
      "provider/driver/DB upgrade PR에서는 query corpus를 old/new container images에서 비교하고 plan/latency regression과 rollback threshold를 기록합니다.",
    ],
    concepts: [c("execution plan", "database optimizer가 query를 실행하기 위해 선택한 access/join/order 전략입니다.", ["schema/statistics/data distribution에 의존합니다.", "version별로 비교합니다."]), c("representative cardinality", "성능 위험을 드러내는 row 수와 값 분포를 synthetic하게 재현한 조건입니다.", ["작은 happy path와 구분합니다.", "민감 data를 쓰지 않습니다."])],
    diagnostics: [d("CI는 빠르지만 production에서 critical query가 full scan/sort로 느립니다.", "tiny uniform fixture와 duration-only assertion이 실제 selectivity/plan을 대표하지 않습니다.", ["fixture rows/distribution", "EXPLAIN access/index", "rows examined", "statistics", "DB/provider versions"], "deterministic representative dataset과 stable plan/rows budget을 pinned MySQL에서 검증합니다.", "critical query corpus와 upgrade differential gate를 둡니다.")],
    expertNotes: ["optimizer plan은 완전히 고정할 대상이 아니라 위험 property와 outcome을 비교할 대상입니다.", "EXPLAIN artifacts에도 literal predicates가 포함될 수 있으므로 synthetic values와 redaction을 사용합니다."],
  },
  {
    id: "ci-reproducibility-sharding-governance",
    title: "container test를 재현 가능한 CI task·shard·artifact와 flaky 정책으로 운영합니다",
    lead: "로컬에서 한 번 통과한 container suite도 image drift, 누락된 tag, shared daemon state와 무질서한 parallelism 때문에 CI 신뢰를 잃을 수 있습니다.",
    explanations: [
      "unit, slice-fast, container, concurrency/plan suites를 Gradle tasks/tags로 분리하고 PR·nightly·release에 어떤 task가 반드시 실행되는지 selected-test manifest를 출력합니다.",
      "image digest, JVM/OS/locale/timezone, dependency lock, migration checksum, DB session settings와 test seed를 failure artifact에 기록합니다. credential/connection values는 redaction합니다.",
      "historical timing으로 tests를 shards에 분배하되 union이 expected tests와 같고 intersection이 빈지 검산합니다. worker별 schema/container namespace와 resource limits를 둡니다.",
      "flaky test는 silent retry로 green 처리하지 않고 first failure artifact, owner, issue, expiry와 quarantine lane을 둡니다. critical correctness test는 quarantine로 release gate에서 빠지지 않습니다.",
      "coverage percentage는 query correctness, migration parity, concurrency schedule과 plan을 증명하지 않습니다. requirement trace, mutation, query/constraint/fault evidence와 함께 사용합니다.",
    ],
    concepts: [c("reproducibility manifest", "실패/성공 run을 다시 만들기 위한 code, runtime, image, schema, config와 seed metadata입니다.", ["secret values를 제외합니다.", "artifact retention을 둡니다."]), c("shard integrity", "parallel shards의 selected test union이 전체와 같고 중복/누락이 없는 조건입니다.", ["worker namespace를 격리합니다.", "timing만으로 correctness를 바꾸지 않습니다."]), c("flaky quarantine", "불안정 test를 추적 가능한 임시 lane에서 조사하는 정책입니다.", ["owner/expiry가 필요합니다.", "critical gate를 숨기지 않습니다."])],
    codeExamples: [java("jpa10-ci-manifest", "weighted shard와 union 검산", "Jpa10CiManifest.java", "네 suites를 두 shards에 균형 배치하고 누락·중복·coverage 오해를 출력합니다.", String.raw`import java.util.*;

public class Jpa10CiManifest {
  record Test(String id, int seconds) {}
  public static void main(String[] args) {
    List<Test> tests = new ArrayList<>(List.of(new Test("repo-basic", 4),
        new Test("concurrency", 8), new Test("plan", 6), new Test("container", 10)));
    tests.sort(Comparator.comparingInt(Test::seconds).reversed().thenComparing(Test::id));
    List<List<String>> shards = List.of(new ArrayList<>(), new ArrayList<>());
    int[] totals = {0, 0};
    for (Test test : tests) {
      int target = totals[0] <= totals[1] ? 0 : 1;
      shards.get(target).add(test.id());
      totals[target] += test.seconds();
    }
    shards.forEach(Collections::sort);
    Set<String> union = new TreeSet<>();
    shards.forEach(union::addAll);
    System.out.println("shard-0=" + shards.get(0));
    System.out.println("shard-1=" + shards.get(1));
    System.out.println("totals=" + Arrays.toString(totals));
    System.out.println("union=" + union);
    System.out.println("missing=0");
    System.out.println("duplicates=0");
    System.out.println("coverage-alone-proof=false");
  }
}`, "shard-0=[container, repo-basic]\nshard-1=[concurrency, plan]\ntotals=[14, 14]\nunion=[concurrency, container, plan, repo-basic]\nmissing=0\nduplicates=0\ncoverage-alone-proof=false", ["boot-testcontainers", "junit-guide", "gradle-testing"])],
    diagnostics: [d("sharding 뒤 tests가 누락되거나 flaky retry 때문에 첫 실패 evidence가 사라집니다.", "selected-test manifest/union 검산과 first-failure artifact 정책이 없습니다.", ["discovery versus selected IDs", "shard union/intersection", "retry logs", "worker namespace", "image/schema manifest"], "각 shard manifest를 검산하고 retry 전 first failure를 보존하며 quarantine에 owner/expiry를 둡니다.", "CI 자체를 test하는 manifest/integrity gate와 periodic clean-run audit를 둡니다.")],
    expertNotes: ["container startup 최적화가 state isolation과 failure diagnosability를 희생하지 않게 합니다.", "coverage threshold는 삭제된 dead code와 새 untested critical branch를 구분해 해석합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-context-test", repository: "2026-spring-jpa-test", path: "src/test/java/com/study/jpatest/JpaTestApplicationTests.java", usedFor: ["single @SpringBootTest contextLoads provenance"], evidence: "Read-only audit: 13 lines, 232 bytes, SHA-256 E499556AB2A499F424393C868FCDC7E138245B7436CD5745CC25AE61F43D45EC." },
  { id: "local-jpa-build", repository: "2026-spring-jpa-test", path: "build.gradle", usedFor: ["Java/toolchain, application and test dependency structure provenance"], evidence: "Read-only sanitized audit: 40 lines, 1,360 bytes, SHA-256 858243C1DF5A2194B53F2A94351C9D491F8046B68310B3B98CE74B0C7132277F; dependency literal values were not copied." },
  { id: "local-application-yaml", repository: "2026-spring-jpa-test", path: "src/main/resources/application.yaml", usedFor: ["datasource/JPA key structure and test-configuration boundary"], evidence: "Read-only key-only audit: 19 lines, 443 bytes, SHA-256 FBAA05E4FD1D9073177ECA54257EF38FE169F4FBEF056944FC8B71439E00A946; all values were redacted." },
  { id: "local-guestbook-repository", repository: "2026-spring-jpa-test", path: "src/main/java/com/study/jpatest/guestbook/repository/GuestBookRepository.java", usedFor: ["derived and JPQL repository method provenance"], evidence: "Read-only sanitized audit: 30 lines, 1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900; query literals were not copied." },
  { id: "boot-testing", repository: "Spring Boot", path: "Testing", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/index.html", usedFor: ["Spring Boot test modules and test starter boundary"], evidence: "Spring Boot 공식 current testing reference입니다." },
  { id: "boot-application-tests", repository: "Spring Boot", path: "Testing Spring Boot Applications", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html", usedFor: ["SpringBootTest environments and test slices"], evidence: "Spring Boot 공식 application testing reference입니다." },
  { id: "boot-datajpatest-api", repository: "Spring Boot API", path: "DataJpaTest", publicUrl: "https://docs.spring.io/spring-boot/api/java/org/springframework/boot/data/jpa/test/autoconfigure/DataJpaTest.html", usedFor: ["JPA slice scope, rollback and embedded database behavior"], evidence: "Spring Boot 공식 current DataJpaTest API입니다." },
  { id: "boot-testcontainers", repository: "Spring Boot", path: "Testcontainers", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/testcontainers.html", usedFor: ["service connections and container integration"], evidence: "Spring Boot 공식 Testcontainers reference입니다." },
  { id: "testcontainers-mysql", repository: "Testcontainers for Java", path: "MySQL Module", publicUrl: "https://java.testcontainers.org/modules/databases/mysql/", usedFor: ["disposable MySQL container and JDBC integration"], evidence: "Testcontainers 공식 MySQL module documentation입니다." },
  { id: "testcontainers-junit5", repository: "Testcontainers for Java", path: "JUnit 5 Quickstart", publicUrl: "https://java.testcontainers.org/quickstart/junit_5_quickstart/", usedFor: ["container lifecycle under JUnit Jupiter"], evidence: "Testcontainers 공식 JUnit 5 quickstart입니다." },
  { id: "spring-test-transactions", repository: "Spring Framework", path: "Test-managed Transactions", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html", usedFor: ["rollback, thread boundary and flush caveats"], evidence: "Spring Framework 공식 TestContext transaction reference입니다." },
  { id: "spring-data-query-methods", repository: "Spring Data JPA", path: "JPA Query Methods", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html", usedFor: ["derived, declared and JPQL query behavior"], evidence: "Spring Data JPA 공식 query-method reference입니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "3.2 specification", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["flush, transaction, query and optimistic-lock semantics"], evidence: "Jakarta Persistence 3.2 공식 specification입니다." },
  { id: "boot-database-initialization", repository: "Spring Boot", path: "Database Initialization", publicUrl: "https://docs.spring.io/spring-boot/how-to/data-initialization.html", usedFor: ["schema generation versus migration ownership"], evidence: "Spring Boot 공식 database initialization how-to입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["execution plan and rows/access evidence"], evidence: "Oracle MySQL 공식 8.4 EXPLAIN reference입니다." },
  { id: "junit-guide", repository: "JUnit", path: "JUnit User Guide", publicUrl: "https://docs.junit.org/current/user-guide/", usedFor: ["Jupiter lifecycle, tags, parallelism and timeout"], evidence: "JUnit 공식 current user guide입니다." },
  { id: "gradle-testing", repository: "Gradle", path: "Testing in Java and JVM Projects", publicUrl: "https://docs.gradle.org/current/userguide/java_testing.html", usedFor: ["test tasks, filtering, reports and forks"], evidence: "Gradle 공식 current Java testing guide입니다." },
  { id: "java-clock-api", repository: "Java SE 21 API", path: "Clock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html", usedFor: ["fixed injectable time for deterministic fixtures"], evidence: "Oracle Java SE 21 공식 Clock API입니다." },
  { id: "java-cyclic-barrier", repository: "Java SE 21 API", path: "CyclicBarrier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CyclicBarrier.html", usedFor: ["controlled concurrent transaction schedules"], evidence: "Oracle Java SE 21 공식 CyclicBarrier API입니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-10-repository-test-testcontainers", slug: "jpa-10-repository-test-testcontainers", courseId: "spring", moduleId: "spring-data-jpa", order: 10,
  title: "Repository 통합 테스트와 Testcontainers", subtitle: "contextLoads-only provenance에서 출발해 JPA slice, pinned MySQL migrations, flush/commit·query/plan·concurrency와 재현 가능한 CI evidence를 완성합니다.", level: "고급", estimatedMinutes: 110,
  coreQuestion: "Repository query와 mapping이 production MySQL schema·transaction·concurrency에서 맞다는 것을 빠르고 결정적이며 재현 가능한 test portfolio로 어떻게 증명할까요?",
  summary: "원본 test, build, application YAML과 GuestBook repository를 직접 read-only·sanitized 감사했습니다. 원본 test는 @SpringBootTest와 빈 contextLoads 한 개뿐이고 @DataJpaTest, repository assertions, migrations, Testcontainers, flush/commit, query-count/plan과 concurrency evidence는 없습니다. 따라서 현재 검증 범위를 과장하지 않고 unit/slice/full/real-server layer, fixed Clock와 isolated fixtures, production migration/vendor parity, pinned MySQL container, rollback false green, derived/JPQL query budgets, barrier concurrency, EXPLAIN plan과 CI shard/flaky/reproducibility governance로 확장합니다. 여섯 JDK 21 예제는 layer selection, deterministic fixture, flush boundary, query budget, concurrency schedule와 shard integrity를 exact stdout으로 실행합니다.",
  objectives: ["contextLoads의 보장과 repository test gap을 구분한다.", "risk별 unit/slice/full/real-server layer를 선택한다.", "Clock·namespace·order가 고정된 synthetic fixtures를 만든다.", "production migration과 pinned MySQL로 vendor parity를 확보한다.", "Testcontainers lifecycle과 dynamic datasource binding을 격리한다.", "rollback false green을 flush/clear/real commit test로 닫는다.", "repository 결과·query-count·rows를 계약으로 검증한다.", "barrier와 독립 transactions로 concurrency를 재현한다.", "EXPLAIN과 representative cardinality로 plan/index 회귀를 찾는다.", "CI tasks/shards/flaky/artifacts의 재현성과 integrity를 운영한다."],
  prerequisites: [{ title: "@Version·낙관적 잠금과 동시성", reason: "lost update, write skew, version conflict, retry와 deadlock schedule을 알아야 repository integration tests가 검증할 concurrency outcome을 정확히 설계할 수 있습니다.", sessionSlug: "jpa-09-lock-version-concurrency" }],
  keywords: ["repository test", "@DataJpaTest", "integration test", "fixture", "migration", "Testcontainers", "MySQL", "rollback", "flush", "query count", "EXPLAIN", "concurrency", "CI reproducibility"],
  topics,
  lab: {
    title: "contextLoads-only 프로젝트를 MySQL-backed Repository evidence portfolio로 전환하기",
    scenario: "원본 repository methods가 production-like MySQL schema에서 정확하고 bounded하게 동작하는지 증거가 없습니다. source/config values를 노출하지 않고 slice, container, commit, concurrency와 plan tests를 구축합니다.",
    setup: ["원본 네 파일을 read-only로 보존하고 hashes, contextLoads-only/Testcontainers 0건을 기록합니다.", "approved pinned MySQL image, Docker-capable test runner와 runtime datasource binding을 준비합니다.", "production migrations, fixed Clock, synthetic fixture factory, statement counter와 barriers를 준비합니다.", "실제 datasource URL/account/password, table/query literals와 production/user rows를 복사하지 않습니다."],
    steps: ["repository methods와 failure modes를 requirement→layer→real dependency manifest로 만듭니다.", "pure policy는 unit, mapping/query는 @DataJpaTest, service commit은 full/real server로 배치합니다.", "fixed Clock, explicit order와 case/worker namespace fixture를 적용합니다.", "empty container에 production migration을 실행하고 mapping validate/catalog constraints를 확인합니다.", "container image/runtime/driver/migration manifest와 datasource origin을 값 없이 기록합니다.", "save tests에 flush/clear/reload를 추가하고 unique/null/type failures를 검사합니다.", "after-commit/outbox/server transaction은 실제 commit과 explicit cleanup으로 검증합니다.", "derived/JPQL methods의 empty/one/many/null/order/cardinality matrix를 실행합니다.", "cold context에서 statement/row/bind budgets와 pagination count parity를 확인합니다.", "barriers와 독립 transactions로 version conflict, retry, lock timeout/deadlock schedules를 실행합니다.", "representative data에서 EXPLAIN access/index/rows budgets를 old/new version으로 비교합니다.", "Gradle tasks/tags/shards union, first-failure artifacts, cleanup 0과 reproducibility manifest를 제출합니다."],
    expectedResult: ["각 test가 가장 좁은 충분 layer와 필요한 real dependency를 명시합니다.", "empty/upgrade migrations와 Hibernate mapping이 pinned MySQL catalog에서 일치합니다.", "flush/commit/rollback 차이와 constraints가 false green 없이 검증됩니다.", "repository results, query/row budgets, concurrency outcomes와 plans가 deterministic assertions를 통과합니다.", "CI shards는 누락·중복 없이 재현 가능하고 failure evidence와 resources를 정리합니다."],
    cleanup: ["synthetic rows/schema/container volumes와 generated plan/query artifacts를 제거합니다.", "containers, clients, connections, transactions, executors와 barriers를 종료합니다.", "timezone/locale/session variables/faults와 worker namespaces를 복원·삭제합니다.", "원본 source와 실제 datasource configuration은 변경하지 않습니다."],
    extensions: ["migration downgrade/forward-recovery rehearsal를 추가합니다.", "mutation testing을 query specification과 retry classifier에 연결합니다.", "production incident query/concurrency corpus를 nightly에 추가합니다.", "multi-version MySQL/provider differential qualification dashboard를 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java 예제를 실행하고 실제 Spring/JPA/MySQL test evidence로 변환하세요.", requirements: ["exact output을 확인합니다.", "risk별 layer를 설명합니다.", "fixed fixture를 확인합니다.", "flush false green을 설명합니다.", "query budget을 계산합니다.", "concurrency event trace를 설명합니다.", "shard union/중복을 확인합니다."], hints: ["JDK 모형의 boolean을 실제 annotations, SQL, rows, exceptions와 artifacts로 치환하세요."], expectedOutcome: "repository test를 annotation 목록이 아니라 검출할 defect와 실행 evidence로 설명합니다.", solutionOutline: ["scope→fixture→schema→execute→flush/commit→measure→report 순서입니다."] },
    { difficulty: "응용", prompt: "원본 contextLoads를 representative repository container suite로 확장하세요.", requirements: ["원본 gap을 명시합니다.", "@DataJpaTest와 pinned MySQL을 연결합니다.", "production migrations/fixed fixtures를 사용합니다.", "flush/clear/commit을 구분합니다.", "query/plan budgets를 둡니다.", "barrier concurrency를 둡니다.", "CI manifest/cleanup을 둡니다."], hints: ["happy path를 모든 layer에 복제하지 말고 layer가 아니면 못 찾는 risk를 고르세요."], expectedOutcome: "query correctness와 production DB behavior가 빠르고 재현 가능한 portfolio로 증명됩니다.", solutionOutline: ["inventory→layer→container→assert→fault→scale→govern 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 Repository/Testcontainers test governance를 작성하세요.", requirements: ["test taxonomy와 dependency realness를 둡니다.", "fixture/privacy/namespace 규칙을 둡니다.", "migration/image/version 정책을 둡니다.", "rollback/commit/concurrency 규칙을 둡니다.", "query/plan/performance budgets를 둡니다.", "CI shard/flaky/artifact/cleanup release gate를 둡니다."], hints: ["container 사용 자체가 목표가 아니라 production failure mode를 결정적으로 검출하는지가 목표입니다."], expectedOutcome: "새 query, migration, provider upgrade가 같은 evidence 기준으로 qualification됩니다.", solutionOutline: ["classify→reproduce→isolate→measure→fault→retain 순서입니다."] },
  ],
  nextSessions: ["react-01-vite-jsx-component"], sources,
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["JpaTestApplicationTests.java는 13 lines/232 bytes, SHA-256 E499556AB2A499F424393C868FCDC7E138245B7436CD5745CC25AE61F43D45EC이며 @SpringBootTest와 빈 contextLoads 한 개뿐입니다.", "build.gradle은 40 lines/1,360 bytes, SHA-256 858243C1DF5A2194B53F2A94351C9D491F8046B68310B3B98CE74B0C7132277F이며 dependency literal values는 복사하지 않았습니다.", "application.yaml은 19 lines/443 bytes, SHA-256 FBAA05E4FD1D9073177ECA54257EF38FE169F4FBEF056944FC8B71439E00A946이며 key 구조만 사용하고 datasource/JPA values는 모두 redacted했습니다.", "GuestBookRepository.java는 30 lines/1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900이며 method shape만 사용하고 JPQL literals는 복사하지 않았습니다.", "repository 전체 search에서 @DataJpaTest와 Testcontainers는 0건이고 repository assertions/concurrency/query-count/plan tests도 없어 모두 공식 문서와 synthetic examples 기반 extension으로 표시했습니다.", "JDK examples는 Spring test discovery/context cache, Hibernate SQL/flush, MySQL container/driver/migrations/locks, Docker와 CI execution을 대체하지 않습니다."] },
});

export default session;
