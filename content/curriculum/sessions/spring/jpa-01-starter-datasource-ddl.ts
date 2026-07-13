import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-15", explanation: "JDK 21 records·collections로 starter graph, DDL policy, pool budget, migration ledger와 expand-contract state를 DB 없이 모델링합니다." },
      { lines: "16-끝에서 6줄 전", explanation: "환경·권한·checksum·capacity와 compatibility invariants를 계산하고 destructive/unknown state를 명시적으로 거부합니다." },
      { lines: "마지막 6줄", explanation: "결정 근거를 정렬된 exact stdout으로 출력해 문서 설명과 실행 결과를 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/JPA/Hibernate/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "교육용 model은 Hibernate schema tooling, 실제 connection pool, migration engine과 target MySQL 검증을 대체하지 않습니다."] },
    experiments: [
      { change: "starter, environment, ddl action, DB connection limit, migration checksum 또는 rollout stage를 바꿉니다.", prediction: "feature graph, 승인/거부, pool budget, drift와 compatibility 결과가 달라집니다.", result: "model stdout과 disposable DB의 dependency report, catalog, migration ledger, pool metrics를 비교합니다." },
      { change: "동일 migration을 target MySQL과 disposable test DB에서 fault injection으로 실행합니다.", prediction: "vendor DDL semantics, lock/time, rollback 가능성과 schema metadata 차이가 나타납니다.", result: "pre/postconditions, catalog diff, application read/write tests와 restore evidence를 함께 기록합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-baseline-secret-sql-log",
    title: "원본 build/YAML을 version·dependency·DataSource·DDL·SQL-log·비밀 경계로 감사합니다",
    lead: "JPA가 시작된다는 사실보다 어떤 provider와 driver, database/schema, 권한, DDL owner와 logging policy로 시작되는지를 먼저 고정해야 데이터 손실과 정보 노출을 막을 수 있습니다.",
    explanations: [
      "원본 build.gradle은 Spring Boot 4.1.0, Java 21, data-jpa/jdbc/webmvc starters, MySQL runtime driver와 focused test starters를 선언합니다. 좌표 구조는 provenance로 사용하지만 실제 resolved versions와 compatibility는 dependency report와 해당 release 문서로 다시 검증합니다.",
      "원본 application.yaml은 datasource와 Hibernate ddl-auto:none, show-sql/format_sql 설정을 둡니다. DB 계정의 실제 값은 공개 내용에 복사하지 않았으며 source-controlled plaintext credential은 revoke/rotate, history·CI artifact·backup 범위 조사 대상으로 취급합니다.",
      "ddl-auto:none은 원본 snapshot에서 provider schema action을 끄는 의도를 나타내지만 migration tool이 적용됐는지, existing schema가 entity mapping과 일치하는지 자동 증명하지 않습니다. none과 validate를 구분합니다.",
      "show-sql은 개발 진단에 편리하지만 parameters 또는 주변 logs와 결합해 PII/schema topology를 노출하고 structured logging/trace correlation을 우회할 수 있습니다. production 기본값으로 두지 않고 bounded SQL category/metrics를 사용합니다.",
      "학습 실습은 원본 DB와 credential을 사용하지 않습니다. disposable schema, synthetic data, least-privilege accounts와 read-only source audit로 재현합니다.",
    ],
    concepts: [
      c("persistence baseline", "Boot/JDK/provider/driver/database version, schema ledger, configuration, credentials와 expected mappings를 함께 고정한 실행 기준입니다.", ["source files만으로 충분하지 않습니다.", "artifact와 catalog evidence가 필요합니다."]),
      c("DDL owner", "schema change의 작성·승인·적용·검증·복구를 책임지는 단일 도구와 workflow입니다.", ["Hibernate와 migration tool의 동시 소유를 피합니다.", "ledger를 보존합니다."]),
      c("SQL observability boundary", "query 성능/오류를 진단하면서 SQL literals, bind values, credentials와 PII 노출을 제한하는 logging/metrics 정책입니다.", ["show-sql과 구분합니다.", "bounded identifiers를 사용합니다."]),
    ],
    diagnostics: [
      d("repository scanner가 datasource credential을 탐지합니다.", "real database account를 committed YAML에 저장했습니다.", ["값을 출력하지 않고 current/history/fork/CI artifact 범위를 확인합니다.", "DB connection/audit logs와 account grants를 봅니다.", "모든 consumers와 backup copies를 inventory합니다."], "account를 rotate/revoke하고 workload-specific secret injection으로 옮긴 뒤 history 정리는 별도 협업 계획으로 수행합니다.", "pre-commit/CI secret scanning, short-lived credentials와 scheduled rotation/readback을 운영합니다."),
      d("SQL console log에 사용자 값과 schema 구조가 남습니다.", "show-sql 또는 parameter logging을 production에서 직접 활성화했습니다.", ["logger categories와 appenders/sinks를 봅니다.", "sample logs에서 literals/PII를 안전하게 검사합니다.", "retention/access/export 범위를 확인합니다."], "raw SQL/value logging을 끄고 operation/query-id, duration, rows, outcome과 safe error category로 교체합니다.", "zero-leak log tests와 emergency debug enable→capture→disable runbook을 둡니다."),
    ],
    expertNotes: ["credential을 YAML에서 삭제해도 Git history와 already-issued password의 효력은 남으므로 rotation이 우선입니다.", "source hash는 감사 snapshot을 고정하지만 DB catalog/runtime truth는 별도 readback이 필요합니다."],
  },
  {
    id: "starter-provider-dependency-graph",
    title: "data-jpa starter를 Hibernate·Spring Data JPA·Spring ORM·JDBC/pool graph로 펼칩니다",
    lead: "starter는 JPA API 하나가 아니라 provider, repository abstraction, transaction integration, JDBC driver/pool과 validation/logging dependencies를 연결하는 versioned graph입니다.",
    explanations: [
      "spring-boot-starter-data-jpa는 Jakarta Persistence API, Hibernate ORM, Spring Data JPA와 Spring ORM integration을 포함하는 supported set을 제공합니다. 실제 transitive graph는 Boot BOM과 Gradle conflict resolution 결과를 확인합니다.",
      "jdbc starter를 data-jpa와 함께 선언하면 기능이 중복되는지 graph로 봅니다. direct dependency가 명시적 API intent를 줄 수 있지만 넓은 starter 추가가 classpath/auto-configuration 후보를 바꾸므로 dependencyInsight로 이유를 남깁니다.",
      "MySQL connector는 runtimeOnly여도 packaged runtime에 반드시 있어야 하며 dialect/driver/server compatibility를 target matrix로 검증합니다. driver class를 무조건 수동 지정하지 않고 JDBC URL과 auto-detection result를 확인합니다.",
      "JPA는 specification이고 Hibernate는 provider입니다. jakarta.persistence properties와 hibernate-specific properties를 namespace, portability와 support owner로 분리합니다.",
      "dependency lock/verification/SBOM은 graph 재현성과 provenance를 돕지만 mapping correctness, schema safety와 vulnerability reachability를 따로 검증해야 합니다.",
    ],
    concepts: [
      c("JPA provider", "Jakarta Persistence specification을 구현해 EntityManager, mappings, query, flush와 schema tooling을 제공하는 runtime입니다.", ["원본은 Hibernate를 starter로 사용합니다.", "vendor extensions를 격리합니다."]),
      c("Spring Data repository", "repository interface metadata에서 implementation/query를 생성해 JPA 접근을 추상화하는 Spring Data 계층입니다.", ["transaction 경계를 자동 완성하지 않습니다.", "provider behavior 위에 동작합니다."]),
      c("runtime driver", "DataSource가 target database protocol로 connection을 만들 때 사용하는 JDBC implementation입니다.", ["compile API와 분리할 수 있습니다.", "artifact packaging을 검사합니다."]),
    ],
    codeExamples: [java("jpa01-feature-graph", "JPA starter의 기능 graph를 정렬해 펼치기", "Jpa01Graph.java", "starter 이름과 transitive capability를 분리해 resolved feature set을 출력합니다.", String.raw`import java.util.*;

public class Jpa01Graph {
  static final Map<String, List<String>> GRAPH = Map.of(
      "data-jpa", List.of("jakarta-persistence", "hibernate", "spring-data-jpa", "spring-orm", "jdbc"),
      "jdbc", List.of("jdbc", "pool", "transactions"),
      "mysql-driver", List.of("jdbc-driver"));
  static SortedSet<String> resolve(List<String> roots) {
    var result = new TreeSet<String>();
    roots.forEach(root -> result.addAll(GRAPH.getOrDefault(root, List.of())));
    return result;
  }
  public static void main(String[] args) {
    var roots = List.of("data-jpa", "jdbc", "mysql-driver");
    System.out.println("roots=" + roots);
    System.out.println("features=" + resolve(roots));
    System.out.println("count=" + resolve(roots).size());
  }
}`, "roots=[data-jpa, jdbc, mysql-driver]\nfeatures=[hibernate, jakarta-persistence, jdbc, jdbc-driver, pool, spring-data-jpa, spring-orm, transactions]\ncount=8", ["local-jpa-build", "boot-sql-databases", "spring-data-jpa-reference"] )],
    diagnostics: [
      d("startup에서 EntityManagerFactory class/method linkage 오류가 납니다.", "Boot BOM이 검증한 Hibernate/Spring Data family 일부를 수동 override해 binary compatibility를 깨뜨렸습니다.", ["runtimeClasspath requested/selected graph를 봅니다.", "class origin과 duplicate versions를 확인합니다.", "Boot/Spring Data/provider compatibility release를 대조합니다."], "지원 release set으로 정렬하고 불가피한 override는 최소화해 full integration suite를 실행합니다.", "dependency convergence, lock과 upgrade compatibility matrix를 CI에 둡니다."),
      d("IDE에서는 driver가 있지만 bootJar 실행에서 No suitable driver가 납니다.", "driver가 잘못된 configuration에 있거나 packaged runtime에서 제외됐습니다.", ["runtimeClasspath와 BOOT-INF/lib를 봅니다.", "JDBC URL/driver auto-detection을 확인합니다.", "java -jar clean smoke를 실행합니다."], "supported runtimeOnly driver를 artifact에 포함하고 URL/driver/server matrix를 맞춥니다.", "packaged artifact가 disposable target DB로 connection preflight를 통과하게 합니다."),
    ],
    expertNotes: ["starter 내부 artifact를 모두 직접 versioning하면 BOM의 supported set과 upgrade atomicity를 잃습니다.", "SBOM component presence와 actual loaded provider/driver version을 runtime evidence로 연결합니다."],
  },
  {
    id: "datasource-autoconfiguration-boundary",
    title: "DataSource 자동 구성을 URL·driver·pool·user override conditions와 startup policy로 설명합니다",
    lead: "Boot는 classpath와 spring.datasource properties, user DataSource bean 부재를 조건으로 pooled DataSource를 구성하며 connection을 언제 실제 획득할지는 pool/startup 설정에 따라 달라집니다.",
    explanations: [
      "spring.datasource.url이 없으면 embedded database를 찾을 수 있습니다. production에서 embedded fallback을 허용하면 잘못된 환경이 빈 local DB로 시작할 수 있으므로 required URL/provider profile과 catalog identity assertion을 둡니다.",
      "driver-class-name은 URL에서 추론 가능한 경우 생략할 수 있습니다. 명시한다면 runtime class 존재와 vendor URL compatibility를 확인하고 class name을 오래된 예제에서 복사하지 않습니다.",
      "user-defined DataSource bean은 auto-configuration back-off를 일으킬 수 있습니다. multiple DataSources는 @Primary/qualifiers, EntityManagerFactory와 transaction managers를 명시적으로 연결하고 accidental default를 차단합니다.",
      "startup fail-fast와 lazy connection acquisition은 availability trade-off입니다. DB가 필수라면 readiness 전 connection/catalog/migration check를 bounded timeout으로 수행하고 liveness restart storm은 피합니다.",
      "JDBC URL query parameters도 TLS, timezone, encoding와 authentication behavior를 바꿉니다. password뿐 아니라 URL 전체를 logs/endpoints에 노출하지 않고 allowlisted properties를 typed validation합니다.",
    ],
    concepts: [
      c("DataSource auto-configuration", "driver/classpath/properties와 missing user bean 조건이 맞을 때 Boot가 connection pool DataSource를 구성하는 기능입니다.", ["conditions report로 확인합니다.", "actual DB identity를 검증합니다."]),
      c("back-off", "사용자가 DataSource bean을 제공할 때 Boot default가 중복 생성을 멈추는 조건입니다.", ["multiple beans wiring을 명시합니다.", "exclude와 구분합니다."]),
      c("database identity", "연결된 vendor/version/server/schema가 승인 target인지 확인하는 non-secret runtime fingerprint입니다.", ["raw host/account를 공개하지 않습니다.", "wrong-database 사고를 막습니다."]),
    ],
    diagnostics: [
      d("production profile이 예상 DB 대신 embedded DB로 정상 시작됩니다.", "required datasource URL이 누락됐지만 embedded driver fallback이 classpath에 있었습니다.", ["conditions report와 loaded driver를 봅니다.", "database product/catalog identity를 확인합니다.", "profile/config origin을 검사합니다."], "production에서 URL/identity를 required validation하고 embedded test dependency를 production runtime에서 제외합니다.", "deployment preflight가 expected database identity와 migration ledger를 확인합니다."),
      d("두 DataSource 중 JPA가 잘못된 pool을 사용합니다.", "multiple beans와 EntityManagerFactory/transaction manager binding이 implicit selection에 의존합니다.", ["bean names/types/@Primary와 origin을 봅니다.", "JPA property/unit binding을 확인합니다.", "transaction별 actual connection identity를 safe test합니다."], "persistence unit별 explicit configuration, qualifiers와 transaction manager를 사용합니다.", "integration tests가 각 repository의 database/schema/transaction owner를 검증합니다."),
    ],
    expertNotes: ["health check에서 DB query를 무제한 실행하지 않고 timeout, pool impact와 failure semantics를 제한합니다.", "database identity evidence는 topology를 공격자에게 노출하지 않도록 internal management plane에만 둡니다."],
  },
  {
    id: "credentials-tls-least-privilege",
    title: "DB credential·TLS·network·schema privileges를 application과 migration 역할로 분리합니다",
    lead: "JPA application account에 schema-owner 권한까지 주면 mapping 또는 injection 사고가 DDL/data destruction으로 확대되므로 runtime DML과 migration/backup identities를 분리합니다.",
    explanations: [
      "application account는 필요한 schema의 SELECT/INSERT/UPDATE/DELETE와 최소 routine 권한만 부여하고 CREATE/ALTER/DROP/GRANT는 migration identity에 제한합니다. read-only service도 DB enforcement와 application authorization을 함께 둡니다.",
      "credential은 secret manager/workload identity에서 주입하고 per-environment/per-service로 분리합니다. rotation은 new account/version→pool refresh/rolling restart→old last-used zero→revoke 순서로 실행합니다.",
      "TLS는 encrypt flag 하나가 아니라 certificate chain, hostname verification, trust store, protocol/cipher policy와 expiry rotation을 검증합니다. insecure development parameter를 production URL로 복사하지 않습니다.",
      "network security group/firewall과 DB grants를 defense-in-depth로 결합합니다. application pod/host에서만 DB port 접근을 허용하고 migration runner는 time-bounded elevated path를 사용합니다.",
      "connection error logs에 URL/account/password를 찍지 않습니다. safe category, SQLState class, pool/operation, release와 correlation만 기록합니다.",
    ],
    concepts: [
      c("runtime identity", "application queries에 필요한 최소 DML privileges만 가진 database principal입니다.", ["schema change 권한을 갖지 않습니다.", "service/environment별 분리합니다."]),
      c("migration identity", "승인 migration window에서 schema change 권한을 사용하는 별도 principal입니다.", ["상시 application에 주입하지 않습니다.", "audit와 expiry를 둡니다."]),
      c("transport verification", "DB TLS 연결이 trusted certificate와 expected hostname을 검증하는 보안 속성입니다.", ["암호화만으로 충분하지 않습니다.", "expiry/rotation을 관측합니다."]),
    ],
    diagnostics: [
      d("application account로 DROP TABLE이 실행됩니다.", "runtime principal에 schema-owner/DDL privileges를 부여했습니다.", ["SHOW GRANTS/catalog privilege를 안전하게 확인합니다.", "account usage/audit logs를 봅니다.", "migration/application credentials 배포 경로를 비교합니다."], "runtime 권한에서 DDL/GRANT를 제거하고 별도 short-lived migration identity로 전환합니다.", "least-privilege drift scan과 destructive DDL negative test를 운영합니다."),
      d("TLS를 켰지만 중간자 certificate에도 연결됩니다.", "encryption은 활성화했지만 hostname/certificate verification이 비활성 또는 permissive trust store입니다.", ["driver TLS mode와 certificate chain을 확인합니다.", "wrong-host/untrusted-CA negative test를 실행합니다.", "trust store source/expiry를 봅니다."], "strict hostname verification과 approved CA trust를 사용하고 cert rotation을 rehearsal합니다.", "CI/monitor가 insecure URL parameters와 certificate expiry를 차단합니다."),
    ],
    expertNotes: ["migration 권한 분리는 ddl-auto destructive action의 blast radius도 줄이지만 잘못된 DML/data migration은 별도 review가 필요합니다.", "DB password rotation은 existing pooled connections가 old credential로 계속 살아 있을 수 있어 connection lifecycle readback이 필요합니다."],
  },
  {
    id: "connection-pool-capacity-timeouts",
    title: "connection pool을 instance 수·DB budget·transaction latency·timeouts와 backpressure로 계산합니다",
    lead: "maximumPoolSize를 크게 잡으면 성능이 자동 향상되는 것이 아니라 DB concurrency와 lock/CPU를 포화시키므로 fleet 전체 connection budget에서 instance별 상한을 계산합니다.",
    explanations: [
      "DB max connections에서 administration/migration/replication/emergency reserve를 뺀 application budget을 서비스와 instance 수에 배분합니다. autoscaling 최대 instance와 rolling overlap까지 포함합니다.",
      "pool이 가득 차면 connectionTimeout까지 callers가 대기합니다. request timeout보다 길게 두면 client는 취소됐는데 DB 작업이 시작되는 tail amplification이 생기므로 HTTP→executor→pool→statement/lock timeout budget을 계층화합니다.",
      "long transaction, connection leak와 blocking external call inside transaction은 active count를 점유합니다. pool size를 늘리기 전에 checkout duration, transaction spans와 slow query/lock waits를 줄입니다.",
      "minimumIdle/maxLifetime/keepalive는 DB/network idle timeout과 clock correctness를 고려합니다. fleet connections가 동시에 만료되지 않도록 provider behavior와 canary metrics를 봅니다.",
      "pool metrics는 active/idle/pending/acquire duration/timeouts를 bounded pool name과 service/release로 기록합니다. raw JDBC URL/account를 label에 넣지 않습니다.",
    ],
    concepts: [
      c("connection budget", "DB가 허용하는 총 connections에서 reserve를 제외하고 fleet instances에 배분한 동시 connection 상한입니다.", ["autoscaling/rolling overlap을 포함합니다.", "DB capacity와 함께 조정합니다."]),
      c("connection acquisition timeout", "pool에서 connection을 얻기 위해 caller가 기다릴 최대 시간입니다.", ["request/transaction budgets보다 짧게 정렬합니다.", "backpressure 신호입니다."]),
      c("pool saturation", "active connections가 상한에 도달해 pending callers와 timeout이 증가하는 상태입니다.", ["원인은 slow query/leak/traffic일 수 있습니다.", "size 확대 전에 원인을 분류합니다."]),
    ],
    codeExamples: [java("jpa01-pool-budget", "DB connection budget을 fleet instances에 안전 배분", "Jpa01PoolBudget.java", "DB limit에서 reserve와 다른 service budget을 뺀 뒤 rolling 최대 instances로 나누고 remainder를 남깁니다.", String.raw`public class Jpa01PoolBudget {
  record Budget(int databaseLimit, int reserve, int otherServices, int maxInstances) {}
  static int perInstance(Budget value) {
    int available = value.databaseLimit() - value.reserve() - value.otherServices();
    if (available <= 0 || value.maxInstances() <= 0) throw new IllegalArgumentException("invalid-budget");
    return available / value.maxInstances();
  }
  public static void main(String[] args) {
    var budget = new Budget(200, 40, 40, 6);
    int pool = perInstance(budget);
    int allocated = pool * budget.maxInstances();
    System.out.println("perInstance=" + pool);
    System.out.println("allocated=" + allocated);
    System.out.println("unallocated=" + (budget.databaseLimit() - budget.reserve() - budget.otherServices() - allocated));
  }
}`, "perInstance=20\nallocated=120\nunallocated=0", ["hikari-config", "boot-sql-databases", "jdbc-datasource"] )],
    diagnostics: [
      d("traffic spike 때 pool timeout과 DB CPU가 함께 급증합니다.", "instance별 pool 합이 DB budget을 초과하고 slow transactions가 concurrency를 점유합니다.", ["fleet instance/pool totals와 DB current connections를 봅니다.", "pending/acquire/checkout duration을 확인합니다.", "slow query/locks/transaction spans를 연계합니다."], "pool을 budget 안으로 낮추고 query/transaction을 단축하며 admission/backpressure를 적용합니다.", "autoscaling max와 pool size를 단일 capacity model/alert로 관리합니다."),
      d("배포 때만 connection limit을 초과합니다.", "rolling update의 old+new instances와 migration/admin reserve를 capacity 계산에서 빠뜨렸습니다.", ["deployment surge/unavailable settings를 봅니다.", "old/new pool connections와 drain time을 측정합니다.", "migration job connection use를 확인합니다."], "rolling overlap을 포함한 per-instance pool과 connection drain/termination grace를 설정합니다.", "deployment preflight가 worst-case connection allocation을 계산합니다."),
    ],
    expertNotes: ["단순 나눗셈은 시작점이며 실제 optimal concurrency는 workload latency, DB cores/IO/locks와 load tests로 검증합니다.", "leakDetectionThreshold는 진단 도구이고 false positives/overhead를 고려해 incident window에 사용합니다."],
  },
  {
    id: "jpa-autoconfiguration-entitymanagerfactory",
    title: "EntityManagerFactory·transaction manager·entity scanning 자동 구성을 bean graph로 확인합니다",
    lead: "DataSource와 JPA provider가 있으면 Boot가 persistence infrastructure를 구성할 수 있지만 entity packages, vendor properties, multiple units와 Open-EntityManager-in-View는 명시적 architecture 선택입니다.",
    explanations: [
      "@SpringBootApplication의 auto-configuration package 아래 @Entity, @Embeddable, @MappedSuperclass가 기본 scan 대상입니다. application class 위치가 잘못되면 entities가 누락되므로 entity manager factory의 managed types를 검사합니다.",
      "EntityManagerFactory는 mappings/provider configuration을 compile하고 connection/pool과 transaction integration을 연결합니다. startup 비용과 mapping/schema validation failure를 ready 전 확인합니다.",
      "JpaTransactionManager는 thread-bound EntityManager와 JDBC connection participation을 조정합니다. multiple DataSources/persistence units는 factory/transaction manager/repository packages를 명시적으로 매핑합니다.",
      "spring.jpa.properties.*는 prefix 제거 뒤 provider에 전달됩니다. 오타난 vendor property가 무시될 수 있으므로 supported property registry와 effective provider settings를 test합니다.",
      "Open EntityManager in View는 web rendering 중 lazy loading을 허용할 수 있지만 transaction boundary 밖 query, N+1과 serialization surprise를 만듭니다. API에서는 DTO fetch와 service transaction을 선호하고 명시적으로 정책을 선택합니다.",
    ],
    concepts: [
      c("EntityManagerFactory", "persistence unit mappings/provider settings를 소유하고 EntityManager를 만드는 heavyweight thread-safe factory입니다.", ["startup에 구성합니다.", "managed types를 검증합니다."]),
      c("persistence unit", "entities, provider, DataSource와 configuration을 묶는 JPA 실행 단위입니다.", ["multiple units는 명시 wiring이 필요합니다.", "schema owner와 연결합니다."]),
      c("Open EntityManager in View", "web request 전체에 EntityManager를 열어 view/body rendering까지 lazy loading을 가능하게 하는 pattern입니다.", ["query boundary를 흐릴 수 있습니다.", "명시적으로 enable/disable합니다."]),
    ],
    diagnostics: [
      d("Not a managed type 오류가 startup/repository creation에서 발생합니다.", "entity class가 auto-configuration package 밖이거나 @Entity/scan/persistence unit mapping이 누락됐습니다.", ["application/entity packages를 비교합니다.", "EntityManagerFactory managed types를 봅니다.", "repository가 올바른 persistence unit에 연결됐는지 확인합니다."], "root package 구조를 정리하거나 explicit EntityScan/persistence unit configuration을 최소 범위로 둡니다.", "context test가 expected managed entity set을 고정합니다."),
      d("JSON serialization 중 예상치 못한 SQL과 LazyInitializationException이 번갈아 납니다.", "entity를 controller에 직접 노출하고 OSIV on/off에 behavior를 의존했습니다.", ["transaction/EntityManager close 시점과 SQL trace를 봅니다.", "response serializer가 접근한 fields를 확인합니다.", "OSIV effective config를 봅니다."], "service transaction에서 필요한 data를 DTO projection/fetch로 완성하고 entity serialization을 금지합니다.", "OSIV off integration test와 query-count budget을 운영합니다."),
    ],
    expertNotes: ["EntityManager는 thread-safe가 아니며 request/task 간 공유하지 않습니다.", "provider settings는 internal names를 무작정 복사하지 않고 official versioned Hibernate documentation에 대조합니다."],
  },
  {
    id: "ddl-auto-actions-risk",
    title: "ddl-auto none·validate·update·create·create-drop을 환경별 schema action과 blast radius로 구분합니다",
    lead: "ddl-auto는 entity mapping에서 database schema에 어떤 action을 수행할지 정하는 강력한 startup property이며 production schema migration workflow를 대신하지 않습니다.",
    explanations: [
      "none은 schema action을 하지 않고, validate는 mapping과 existing schema compatibility를 검사합니다. validate도 모든 constraint/index/business invariant와 safe migration history를 증명하지 않습니다.",
      "update는 provider가 발견한 차이를 자동 반영하려 하지만 rename을 drop/add로 오해하거나 data backfill, online DDL, lock/resource budget, rollback과 application compatibility를 표현하지 못합니다.",
      "create와 create-drop은 schema/data 파괴를 일으킬 수 있어 disposable test database에서만 사용합니다. environment profile 문자열에만 의존하지 않고 runtime account의 DDL 권한 제거와 database identity guard를 결합합니다.",
      "property가 잘못된 source/profile에서 override될 수 있으므로 effective value/origin을 value-safe configuration evidence로 보고 production allowlist는 none 또는 validate처럼 명시합니다.",
      "mapping에서 generated DDL/script를 review input으로 활용할 수 있지만 migration author가 vendor syntax, constraints/indexes, data transform, expand-contract와 rollback/forward recovery를 완성합니다.",
    ],
    concepts: [
      c("schema action", "persistence provider가 startup/deployment에서 mapping metadata를 기반으로 schema에 수행하는 none/validate/create/drop/update 계열 동작입니다.", ["migration ledger와 다릅니다.", "환경·권한 guard가 필요합니다."]),
      c("schema validation", "entity mappings가 existing schema와 호환되는지 provider가 startup에 검사하는 동작입니다.", ["전체 database correctness를 증명하지 않습니다.", "drift gate의 한 요소입니다."]),
      c("destructive guard", "wrong environment/config에도 destructive DDL이 실행되지 않도록 identity, least privilege, policy와 tests를 겹쳐 두는 통제입니다.", ["profile 하나에 의존하지 않습니다.", "negative tests를 둡니다."]),
    ],
    codeExamples: [java("jpa01-ddl-policy", "환경과 DDL action allowlist를 실행 가능한 정책으로 검증", "Jpa01DdlPolicy.java", "production/staging/development/test 환경별 allowed action을 명시하고 update/create를 production에서 거부합니다.", String.raw`import java.util.*;

public class Jpa01DdlPolicy {
  static final Map<String, Set<String>> ALLOWED = Map.of(
      "production", Set.of("none", "validate"),
      "staging", Set.of("none", "validate"),
      "development", Set.of("none", "validate"),
      "test", Set.of("none", "validate", "create", "create-drop"));
  static boolean allowed(String environment, String action) {
    return ALLOWED.getOrDefault(environment, Set.of()).contains(action);
  }
  public static void main(String[] args) {
    System.out.println("prod-validate=" + allowed("production", "validate"));
    System.out.println("prod-update=" + allowed("production", "update"));
    System.out.println("test-create-drop=" + allowed("test", "create-drop"));
    System.out.println("unknown-none=" + allowed("unknown", "none"));
  }
}`, "prod-validate=true\nprod-update=false\ntest-create-drop=true\nunknown-none=false", ["boot-sql-databases", "jakarta-persistence-spec", "hibernate-schema-tooling"] )],
    diagnostics: [
      d("production restart 뒤 table/data가 사라집니다.", "create/create-drop이 higher-precedence config에서 활성화되고 application account에 DDL 권한이 있었습니다.", ["즉시 writes를 fence하고 effective ddl action origin을 확인합니다.", "DB audit/binlog/migration ledger와 backup/PITR window를 봅니다.", "account grants와 affected schemas를 확인합니다."], "incident recovery plan으로 restore/PITR하고 destructive property를 제거하며 runtime DDL 권한을 revoke합니다.", "production policy gate, identity assertion, least privilege와 destructive canary DB tests를 겹칩니다."),
      d("ddl-auto:update 후 column rename에서 data가 비거나 old column이 남습니다.", "provider auto-update는 semantic rename/data transform을 알 수 없고 online migration 계획이 없습니다.", ["catalog/data counts와 generated/executed DDL을 비교합니다.", "mapping diff와 migration history를 봅니다.", "old/new application compatibility를 검사합니다."], "명시 expand-contract migration과 backfill/validation/cutover/retirement를 작성합니다.", "update를 production에서 금지하고 every schema change를 versioned migration으로 review합니다."),
    ],
    expertNotes: ["validate가 통과해도 indexes, triggers, grants, collation와 data invariants가 기대와 다를 수 있어 catalog conformance를 보완합니다.", "create-drop test는 connection이 production을 가리키지 않는 disposable identity guard 뒤에서만 실행합니다."],
  },
  {
    id: "versioned-migration-ledger",
    title: "Flyway/Liquibase 같은 단일 migration ledger로 immutable order·checksum·pre/postcondition을 관리합니다",
    lead: "schema evolution은 실행된 version과 checksum을 database에 기록하고 pending/applied/drift를 비교하는 반복 가능한 deployment workflow가 필요합니다.",
    explanations: [
      "versioned migrations는 source control에 순서와 목적을 담고 schema history/changelog table에 적용 결과를 기록합니다. 이미 적용된 migration을 조용히 수정하지 않고 새 forward migration을 추가합니다.",
      "validate는 available migrations와 applied names/types/checksums의 차이를 찾습니다. repair는 실제 schema를 고치는 명령이 아니라 ledger metadata를 변경할 수 있으므로 drift 원인과 database state를 독립 검증한 뒤 승인합니다.",
      "Boot schema.sql/data.sql, Hibernate DDL과 Flyway/Liquibase를 동시에 schema owner로 사용하지 않습니다. test data seeding도 migration history와 별도 fixture owner를 명확히 합니다.",
      "migration에는 expected old schema/data preconditions, post catalog/data invariants, lock/time/resource budget, retry/idempotency와 recovery route를 둡니다. DDL transaction support는 vendor별로 검증합니다.",
      "migration runner는 application startup에 묶거나 별도 deployment job으로 실행할 수 있습니다. 어느 경우든 concurrent instances의 single execution, readiness gating, timeout과 failed/unknown outcome reconciliation을 설계합니다.",
    ],
    concepts: [
      c("migration ledger", "적용된 schema/data migrations의 version, checksum, order, timestamp와 outcome을 database에 기록한 history입니다.", ["drift를 탐지합니다.", "application release와 연결합니다."]),
      c("immutable migration", "적용 후 내용/checksum을 수정하지 않고 새로운 migration으로 변화시키는 규칙입니다.", ["fleet history를 재현합니다.", "repair 남용을 막습니다."]),
      c("migration precondition", "변경 전 schema/data/version/lock 상태가 예상과 일치해야 실행하도록 하는 fail-fast 조건입니다.", ["wrong target을 막습니다.", "postcondition과 쌍을 이룹니다."]),
    ],
    codeExamples: [java("jpa01-migration-ledger", "applied checksum과 available migration drift 탐지", "Jpa01Ledger.java", "version별 expected/applied checksum을 비교해 valid, drift, pending과 missing-source 상태를 분류합니다.", String.raw`import java.util.*;

public class Jpa01Ledger {
  static String state(String version, Map<String, String> available, Map<String, String> applied) {
    if (!available.containsKey(version)) return applied.containsKey(version) ? "missing-source" : "absent";
    if (!applied.containsKey(version)) return "pending";
    return available.get(version).equals(applied.get(version)) ? "valid" : "checksum-drift";
  }
  public static void main(String[] args) {
    var available = Map.of("1", "aaa", "2", "bbb", "3", "ccc");
    var applied = Map.of("1", "aaa", "2", "changed", "0", "legacy");
    System.out.println("v0=" + state("0", available, applied));
    System.out.println("v1=" + state("1", available, applied));
    System.out.println("v2=" + state("2", available, applied));
    System.out.println("v3=" + state("3", available, applied));
  }
}`, "v0=missing-source\nv1=valid\nv2=checksum-drift\nv3=pending", ["flyway-validate", "flyway-migrations", "boot-data-initialization"] )],
    diagnostics: [
      d("migration validate가 checksum mismatch로 배포를 막습니다.", "이미 적용된 versioned migration file이 수정됐거나 target ledger가 다른 history를 가집니다.", ["적용 DB state와 original artifact/checksum을 보존합니다.", "source history와 deployment artifacts를 비교합니다.", "manual schema changes/drift를 조사합니다."], "수정 원인을 확정하고 schema를 explicit forward migration으로 수렴시킵니다. repair는 state 일치가 독립 검증된 경우만 승인합니다.", "applied migrations immutable policy와 protected paths/checksum CI를 둡니다."),
      d("여러 app instances가 startup migration을 동시에 시도합니다.", "migration ownership/locking과 deployment sequencing을 정의하지 않았습니다.", ["ledger locks/jobs/instance logs를 봅니다.", "failed/partial outcome과 DB DDL transaction semantics를 확인합니다.", "readiness/traffic timing을 봅니다."], "single migration job 또는 tool lock을 사용하고 apps는 ledger target version 확인 뒤 ready가 됩니다.", "concurrent startup fault tests와 unknown migration reconciliation runbook을 운영합니다."),
    ],
    expertNotes: ["Flyway/Liquibase 선택보다 단일 owner, immutable ledger와 recovery discipline이 핵심입니다.", "migration checksum 일치가 SQL 안전성이나 data correctness를 보증하지 않으므로 review/pre/postconditions를 별도 둡니다."],
  },
  {
    id: "expand-contract-zero-downtime",
    title: "expand→backfill→dual compatibility→cutover→contract로 rolling schema 변경을 설계합니다",
    lead: "old/new application instances가 동시에 동작하는 배포에서 먼저 additive schema를 만들고 data/traffic을 수렴한 뒤 observation window 후 old schema를 제거해야 합니다.",
    explanations: [
      "column rename은 새 nullable/default-compatible column 추가→old/new dual read/write or transform→bounded backfill→parity validation→read cutover→old write stop→old column drop 순서로 분해합니다.",
      "NOT NULL/UNIQUE/FK 추가는 dirty data preflight와 repair, write-path prevention, online validation을 거칩니다. table scan/lock/log volume과 replication lag budget을 측정합니다.",
      "large backfill은 chunks, stable cursor, idempotency, throttling, pause/resume, progress ledger와 snapshot semantics가 필요합니다. application traffic과 DB resources를 경쟁하므로 SLO guard를 둡니다.",
      "contract/destructive step은 rollback window가 끝나고 old binary/queries/jobs/read replicas/analytics가 zero usage임을 관측한 뒤 별도 release로 수행합니다.",
      "rollback은 schema가 backward compatible한 동안 binary/config rollback이 가능하고, destructive step 뒤에는 backup/PITR 또는 forward fix가 필요할 수 있습니다. 각 phase별 recovery route를 작성합니다.",
    ],
    concepts: [
      c("expand-contract", "호환 가능한 schema를 먼저 추가하고 consumers/data를 전환한 뒤 old schema를 나중에 제거하는 evolution pattern입니다.", ["rolling deploy를 지원합니다.", "observation window가 필요합니다."]),
      c("backfill", "기존 rows를 새 schema/representation으로 bounded chunks에서 변환·검증하는 data migration입니다.", ["idempotent/resumable하게 설계합니다.", "resource budget을 둡니다."]),
      c("contract gate", "old schema 제거 전에 모든 old consumers/writes가 사라지고 복구 기준이 충족됐는지 확인하는 승인 단계입니다.", ["telemetry와 inventory가 필요합니다.", "별도 release로 분리합니다."]),
    ],
    codeExamples: [java("jpa01-expand-contract", "schema rollout phase와 compatibility invariant 확인", "Jpa01ExpandContract.java", "phase마다 old/new readers가 요구하는 columns가 존재하는지 계산해 premature contract를 탐지합니다.", String.raw`import java.util.*;

public class Jpa01ExpandContract {
  record Phase(String name, Set<String> columns, boolean oldReaders, boolean newReaders) {}
  static boolean compatible(Phase phase) {
    boolean oldOk = !phase.oldReaders() || phase.columns().contains("old_name");
    boolean newOk = !phase.newReaders() || phase.columns().contains("new_name");
    return oldOk && newOk;
  }
  public static void main(String[] args) {
    var phases = List.of(
        new Phase("expand", Set.of("old_name", "new_name"), true, true),
        new Phase("cutover", Set.of("old_name", "new_name"), false, true),
        new Phase("contract", Set.of("new_name"), false, true),
        new Phase("premature", Set.of("new_name"), true, true));
    phases.forEach(p -> System.out.println(p.name() + "=" + compatible(p)));
  }
}`, "expand=true\ncutover=true\ncontract=true\npremature=false", ["flyway-migrations", "mysql-atomic-ddl", "jakarta-persistence-spec"] )],
    diagnostics: [
      d("rolling deploy 중 old instance가 unknown column으로 실패합니다.", "destructive rename/drop이 old binary가 drain되기 전에 실행됐습니다.", ["old/new instance versions와 query errors를 봅니다.", "catalog/migration phase를 확인합니다.", "jobs/replicas/analytics consumers를 inventory합니다."], "호환 column/view/alias를 복원하거나 old traffic을 fence하고 safe phase로 forward recover합니다.", "expand-contract compatibility matrix와 old-consumer zero-usage gate를 적용합니다."),
      d("backfill이 DB replication lag와 request latency를 폭증시킵니다.", "unbounded transaction/scan으로 resource budget과 pause/resume가 없습니다.", ["batch size/transaction duration/locks/log volume을 봅니다.", "replication lag/pool/latency를 연계합니다.", "progress cursor/idempotency를 확인합니다."], "stable chunks와 throttling/SLO pause, resumable progress ledger로 다시 실행합니다.", "production-like load rehearsal와 automatic resource guard를 migration runner에 둡니다."),
    ],
    expertNotes: ["online DDL이라는 이름도 metadata locks, copy, disk/log resource와 vendor/version 조건을 확인해야 합니다.", "dual write는 distributed consistency를 만들 수 있어 DB trigger/application transaction/outbox 선택과 reconciliation을 명시합니다."],
  },
  {
    id: "sql-logging-query-observability",
    title: "show-sql 대신 query identity·duration·rows·plan·transaction correlation으로 관측합니다",
    lead: "SQL 전문과 bind values를 콘솔에 출력하는 방식은 privacy·cardinality·성능 문제를 만들므로 query source와 performance evidence를 safe identifiers로 수집합니다.",
    explanations: [
      "Hibernate SQL logging은 학습/short-lived local diagnosis에 제한합니다. production에서는 statement digest/query id, repository operation, duration, rows, timeout/lock/error category와 transaction correlation을 사용합니다.",
      "parameters는 PII, credentials, free text와 tenant identifiers를 담을 수 있어 기본 기록하지 않습니다. cardinality-safe parameter class/bucket과 synthetic reproduction fixtures로 진단합니다.",
      "slow query는 SQL text만 보지 않고 execution plan, indexes/statistics, estimated/actual rows, locks, fetch size와 ORM fetch pattern을 함께 분석합니다. plan capture도 authorized/retained artifact로 둡니다.",
      "N+1은 같은 query digest count와 request/use-case span에서 탐지합니다. query count budget은 cache/lazy behavior에 민감하므로 deterministic integration fixture와 result invariants를 결합합니다.",
      "logging 자체가 latency/IO를 늘리고 async appender drop을 만들 수 있어 sampling, rate limits, retention와 emergency window를 둡니다.",
    ],
    concepts: [
      c("statement digest", "literal 값을 제거·정규화해 같은 query shape를 bounded identifier로 묶은 표현입니다.", ["privacy와 aggregation을 돕습니다.", "원문을 대체하는 진단 key입니다."]),
      c("query-count budget", "한 use case/request가 허용하는 query shapes/count의 regression threshold입니다.", ["N+1을 탐지합니다.", "correctness assertions와 함께 씁니다."]),
      c("plan evidence", "target DB/version/statistics에서 query optimizer가 선택한 access/join/rows/cost 계획과 runtime 관측입니다.", ["SQL만으로 추측하지 않습니다.", "authorized artifact로 보존합니다."]),
    ],
    diagnostics: [
      d("show-sql을 껐더니 slow endpoint 원인을 찾을 수 없습니다.", "raw SQL console만 observability로 사용하고 query id/span/plan 연결이 없습니다.", ["request→transaction→query spans와 duration을 봅니다.", "query digest/count/rows를 확인합니다.", "representative plan을 target DB에서 capture합니다."], "safe query identifiers와 tracing/metrics를 도입하고 slow threshold에서 bounded plan workflow를 실행합니다.", "repository operation/query-id registry와 performance regression tests를 둡니다."),
      d("parameter logging으로 privacy incident가 발생합니다.", "bind values를 default debug output에 포함했습니다.", ["log sinks/backups/tickets 접근 범위를 격리합니다.", "노출 data/subjects/credentials를 분류합니다.", "logger configuration origin을 확인합니다."], "parameter logging을 중단·삭제/retention 대응하고 credential이면 rotate하며 safe category logging으로 바꿉니다.", "canary PII/secret zero-leak tests와 logger policy scan을 운영합니다."),
    ],
    expertNotes: ["statement digest도 schema/table names를 노출할 수 있어 management access를 제한합니다.", "observability sampling으로 rare errors를 놓치지 않도록 error/timeout signals는 별도 bounded capture policy를 둡니다."],
  },
  {
    id: "test-database-initialization-parity",
    title: "disposable test database·schema owner·vendor parity와 초기화 기술을 명시합니다",
    lead: "embedded DB의 빠른 test와 target MySQL의 DDL/type/locking semantics가 다르므로 test pyramid에서 각각 무엇을 증명하는지 분리합니다.",
    explanations: [
      "unit tests는 mapping/domain logic을 DB 없이, repository slice는 mapping/query를 빠르게, Testcontainers/real compatible DB integration은 vendor DDL, indexes, collation, locking과 driver behavior를 검증합니다.",
      "ddl-auto:create-drop은 disposable database identity에서만 사용합니다. shared developer/staging DB를 가리키지 않도록 generated database name, container lifecycle와 account guard를 확인합니다.",
      "schema.sql/data.sql, Hibernate DDL와 Flyway/Liquibase를 동시에 사용하면 initialization order와 drift가 생깁니다. production과 같은 migration ledger를 integration tests에도 적용하고 test data는 별도 fixtures로 넣습니다.",
      "test transaction rollback은 flush/commit constraints, triggers, generated values와 after-commit behavior를 숨길 수 있습니다. explicit flush/clear와 non-transactional/readback tests를 포함합니다.",
      "parallel tests는 schema/database isolation과 pool/container capacity가 필요합니다. test order에 의존하는 shared mutable data를 제거하고 deterministic clock/ids를 주입합니다.",
    ],
    concepts: [
      c("vendor parity", "test database가 production vendor/version의 SQL, types, collation, DDL and locking semantics를 충분히 재현하는 정도입니다.", ["모든 test에 필요하지 않습니다.", "risk 높은 paths에 사용합니다."]),
      c("disposable database", "test 실행마다 생성되고 격리되며 종료 후 폐기 가능한 database/schema입니다.", ["production identity와 분리합니다.", "destructive actions를 허용할 수 있습니다."]),
      c("transactional test false positive", "test rollback/context가 real commit·flush·after-commit behavior를 실행하지 않아 결함을 숨기는 상태입니다.", ["explicit commit/readback을 보완합니다.", "test scope를 이해합니다."]),
    ],
    diagnostics: [
      d("H2 test는 통과하지만 MySQL migration/query가 실패합니다.", "embedded DB의 types/functions/collation/DDL/locking 차이를 target parity test 없이 일반화했습니다.", ["실패 SQL/DDL과 vendor semantics를 비교합니다.", "driver/dialect/version을 확인합니다.", "target-container integration을 실행합니다."], "risk path를 MySQL-compatible disposable DB로 옮기고 embedded test는 portable subset에 제한합니다.", "migration/repository/concurrency suite를 supported DB version matrix에서 실행합니다."),
      d("repository test는 통과하지만 production commit에서 constraint 오류가 납니다.", "test transaction이 flush/commit 전에 rollback되거나 DB constraint/schema가 달랐습니다.", ["explicit flush/commit/readback 여부를 봅니다.", "migration/catalog parity를 확인합니다.", "deferred constraints/triggers를 검사합니다."], "commit boundary를 실행하는 integration test와 catalog/negative constraint assertions를 추가합니다.", "critical writes가 real transaction completion과 restored DB acceptance를 통과합니다."),
    ],
    expertNotes: ["Testcontainers는 vendor parity를 높이지만 production data volume, configuration, topology와 failure를 자동 재현하지 않습니다.", "test images/migrations도 digest/ledger로 고정하고 supply-chain 검증을 적용합니다."],
  },
  {
    id: "backup-restore-forward-recovery",
    title: "schema migration을 backup·PITR·restore acceptance와 forward recovery까지 연결합니다",
    lead: "backup job 성공이 복구 가능성을 증명하지 않으므로 representative restore, migration replay, application read/write invariants와 RTO/RPO를 정기 검증합니다.",
    explanations: [
      "full/incremental/binlog backups와 retention/replication을 RPO에 맞춥니다. schema/data change 전에 recovery point, encryption/key access와 restore capacity를 확인합니다.",
      "restore는 격리 환경에서 database version, users/grants 제외/재생성, migration ledger와 data counts/checksums를 검증합니다. production credential을 restore lab에 복제하지 않습니다.",
      "PITR은 timestamp/binlog position과 timezone/clock/transaction boundaries를 고려합니다. destructive migration 사고 시 writes를 fence하고 target time/position을 evidence로 승인합니다.",
      "schema rollback SQL이 data loss를 만들 수 있으면 forward fix/compatibility restoration이 더 안전할 수 있습니다. migration마다 rollback, forward recovery, restore 중 가능한 routes와 예상 시간을 기록합니다.",
      "application acceptance는 key use cases의 positive/negative writes, JPA validate/catalog drift, query plans와 downstream events를 복구 DB에서 실행합니다.",
    ],
    concepts: [
      c("RPO", "복구 시 허용 가능한 최대 data loss 시간/량 목표입니다.", ["backup/binlog 주기를 결정합니다.", "business 승인이 필요합니다."]),
      c("RTO", "장애 후 service/data를 허용 상태로 복구하는 목표 시간입니다.", ["restore capacity와 runbook을 포함합니다.", "정기 rehearsal로 측정합니다."]),
      c("restore acceptance", "backup을 실제 복원한 DB가 catalog, ledger, data와 application invariants를 충족하는지 검증하는 기준입니다.", ["backup 성공과 구분합니다.", "read/write tests를 포함합니다."]),
    ],
    diagnostics: [
      d("backup은 매일 성공하지만 restore가 migration ledger 오류로 시작되지 않습니다.", "backup artifact 생성만 모니터링하고 restore/version/ledger/application acceptance를 rehearsal하지 않았습니다.", ["restore logs와 database/version compatibility를 봅니다.", "migration history/catalog/data를 비교합니다.", "application validate/startup failure를 확인합니다."], "supported DB version으로 restore하고 ledger/catalog를 approved recovery plan으로 수렴시킨 뒤 acceptance를 실행합니다.", "scheduled restore drills와 RTO/RPO measurement를 운영합니다."),
      d("PITR 뒤 application writes가 duplicate/missing effects를 만듭니다.", "DB recovery point와 external messages/files/caches의 consistency/reconciliation을 고려하지 않았습니다.", ["outbox/message offsets와 external side effects를 inventory합니다.", "idempotency keys/replay windows를 봅니다.", "reconciliation counts를 실행합니다."], "outbox/idempotent consumers와 reconciliation으로 recovered DB와 external state를 수렴합니다.", "cross-system disaster recovery drills와 duplicate/missing acceptance를 둡니다."),
    ],
    expertNotes: ["backup encryption key와 restore permissions가 상실되면 backup bytes가 있어도 복구할 수 없습니다.", "restore 테스트 data는 privacy controls와 deletion/isolated access를 production과 동일하게 적용합니다."],
  },
  {
    id: "qualification-catalog-drift-runbook",
    title: "catalog·ledger·pool·runtime contracts를 canary하고 drift·rollback runbook으로 완료합니다",
    lead: "JPA baseline의 완료는 context startup이 아니라 artifact/config/migration/database identity가 기대 상태이고 traffic·failure·restore에서 invariants가 유지되는지 증명하는 것입니다.",
    explanations: [
      "preflight는 artifact/provider/driver versions, config origins, secret references, DB identity/version, grants, migration pending/validation과 connection budget을 value-safe evidence로 확인합니다.",
      "migration canary는 representative restored/clone DB에서 preconditions→migrate→post catalog/data→old/new application compatibility→performance/lock budget을 실행합니다. production copy privacy를 통제합니다.",
      "deployment readiness는 required migration target version, EntityManagerFactory/schema validation, pool acquisition, critical repository smoke와 no destructive DDL 권한을 확인합니다.",
      "fleet drift는 schema objects/constraints/indexes/grants/ledger와 application/provider settings를 bounded fingerprint로 비교합니다. raw host/account/schema values를 public metrics labels에 넣지 않습니다.",
      "rollback decision은 binary/config/schema compatibility, write activity, data transform와 external side effects를 고려합니다. 자동 rollback 조건과 human approval escalation, forward recovery route를 모두 둡니다.",
    ],
    concepts: [
      c("catalog conformance", "target database objects/columns/types/constraints/indexes/grants가 approved schema expectation과 일치하는지 비교하는 검사입니다.", ["JPA validate를 보완합니다.", "fleet drift를 찾습니다."]),
      c("migration canary", "production 전 representative database에서 migration의 correctness, compatibility와 resource budget을 검증하는 실행입니다.", ["data/privacy를 통제합니다.", "rollback/forward routes를 rehearsal합니다."]),
      c("database rollout gate", "ledger version, catalog, pool, application smoke와 recovery criteria가 모두 충족돼야 traffic/promotion을 허용하는 기준입니다.", ["단일 health check보다 넓습니다.", "evidence를 보존합니다."]),
    ],
    diagnostics: [
      d("일부 instance만 JPA schema validation에 실패합니다.", "fleet가 다른 DB/schema/config/provider version 또는 migration point를 사용합니다.", ["instance artifact/config release와 DB identity를 비교합니다.", "ledger/catalog fingerprints를 봅니다.", "routing/secret version을 확인합니다."], "traffic을 healthy cohort로 제한하고 fleet configuration/database routing을 approved target으로 수렴합니다.", "deployment identity와 catalog/ledger conformance를 promotion 전 강제합니다."),
      d("migration 성공 뒤 p99 latency와 lock waits가 증가합니다.", "correctness만 검증하고 index/statistics/query plan과 online DDL resource budget을 canary하지 않았습니다.", ["release별 query plans/rows/lock waits를 비교합니다.", "new indexes/statistics와 backfill state를 확인합니다.", "pool pending/acquire duration을 봅니다."], "statistics/index/query를 조정하거나 safe forward/rollback route로 복구하고 traffic을 제한합니다.", "migration canary에 representative load, plan and resource thresholds를 포함합니다."),
    ],
    expertNotes: ["schema fingerprint hash만 비교하지 말고 어떤 objects/semantics가 다른지 review 가능한 canonical diff를 보존합니다.", "자동화는 destructive recovery decision의 권한을 확대하지 않으며 explicit approvals와 blast-radius limits를 둡니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-jpa-build", repository: "D:/dev/2026-spring-jpa-test", path: "build.gradle", usedFor: ["Boot 4.1.0/Java 21", "data-jpa/jdbc/webmvc starters", "MySQL runtime/test scopes"], evidence: "2026-07-14 read-only audit: 40 lines, 1,360 bytes, SHA-256 858243C1DF5A2194B53F2A94351C9D491F8046B68310B3B98CE74B0C7132277F." },
  { id: "local-jpa-yaml", repository: "D:/dev/2026-spring-jpa-test", path: "src/main/resources/application.yaml", usedFor: ["DataSource namespace", "ddl-auto none", "show-sql/format_sql", "secret remediation"], evidence: "2026-07-14 read-only audit: 19 lines, 443 bytes, SHA-256 FBAA05E4FD1D9073177ECA54257EF38FE169F4FBEF056944FC8B71439E00A946. 실제 DB URL/account/password는 공개 본문·예제·출력에 복사하지 않았습니다." },
  { id: "boot-sql-databases", repository: "Spring Boot", path: "reference/data/sql.html", publicUrl: "https://docs.spring.io/spring-boot/reference/data/sql.html", usedFor: ["DataSource auto-configuration", "JPA starter", "entity scan", "ddl-auto", "OSIV"], evidence: "2026-07-14 current official Boot SQL/JPA reference에서 DataSource와 schema action defaults/configuration을 확인했습니다." },
  { id: "boot-data-initialization", repository: "Spring Boot", path: "how-to/data-initialization.html", publicUrl: "https://docs.spring.io/spring-boot/how-to/data-initialization.html", usedFor: ["schema.sql/data.sql order", "Hibernate defer", "single initialization technology", "Flyway/Liquibase"], evidence: "script-based initialization과 migration tools를 함께 사용하지 말라는 current guidance를 확인했습니다." },
  { id: "spring-data-jpa-reference", repository: "Spring Data JPA", path: "reference/", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/", usedFor: ["repository support", "JPA integration", "version baseline"], evidence: "Spring Data JPA가 Jakarta Persistence repository support를 제공하는 current official reference를 확인했습니다." },
  { id: "spring-data-jpa-transactions", repository: "Spring Data JPA", path: "reference/jpa/transactions.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html", usedFor: ["repository transaction defaults", "service facade boundary", "readOnly caveat"], evidence: "CRUD repository transaction defaults와 unit-of-work service boundary 권고를 확인했습니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "specifications/persistence/3.2/jakarta-persistence-spec-3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["persistence context", "schema-generation actions", "EntityManager transaction rules", "provider properties"], evidence: "Jakarta Persistence 3.2 specification의 entity/persistence context/schema generation contract를 확인했습니다." },
  { id: "jakarta-schema-manager", repository: "Jakarta Persistence API", path: "jakarta/persistence/SchemaManager", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/schemamanager", usedFor: ["schema create/drop/validate/truncate API", "test boundary"], evidence: "Persistence 3.2 SchemaManager의 schema lifecycle operations를 확인했습니다." },
  { id: "hibernate-schema-tooling", repository: "Hibernate ORM", path: "userguide/html_single/Hibernate_User_Guide.html#schema-generation", publicUrl: "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#schema-generation", usedFor: ["Hibernate schema tooling", "hbm2ddl settings", "provider boundary"], evidence: "current Hibernate user guide의 schema generation/tooling section을 확인했습니다." },
  { id: "hikari-config", repository: "HikariCP", path: "README.md#configuration-knobs-baby", publicUrl: "https://github.com/brettwooldridge/HikariCP#configuration-knobs-baby", usedFor: ["connectionTimeout", "maximumPoolSize", "maxLifetime/keepalive", "pool metrics"], evidence: "HikariCP official project configuration semantics와 pool saturation behavior를 확인했습니다." },
  { id: "jdbc-datasource", repository: "Oracle Java SE 21", path: "java.sql/javax/sql/DataSource.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html", usedFor: ["DataSource contract", "connection acquisition", "login timeout/log writer boundary"], evidence: "JDK DataSource API가 physical connection factory abstraction임을 확인했습니다." },
  { id: "flyway-validate", repository: "Redgate Flyway", path: "reference/commands/validate", publicUrl: "https://documentation.red-gate.com/flyway/reference/commands/validate", usedFor: ["migration checksums", "applied/resolved validation", "drift failure"], evidence: "Flyway validate가 names/types/checksums와 missing/pending states를 검사하는 current product documentation을 확인했습니다." },
  { id: "flyway-migrations", repository: "Redgate Flyway", path: "fd/migrations-271585107.html", publicUrl: "https://documentation.red-gate.com/fd/migrations-271585107.html", usedFor: ["versioned/repeatable migrations", "migrate workflow", "immutable history"], evidence: "migrations가 ordered repeatable deployment workflow와 history를 제공한다는 official documentation을 확인했습니다." },
  { id: "mysql-atomic-ddl", repository: "MySQL 8.4", path: "refman/8.4/en/atomic-ddl.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/atomic-ddl.html", usedFor: ["vendor DDL atomicity", "rollback caveats", "migration testing"], evidence: "MySQL 8.4 atomic DDL support scope를 target-vendor boundary로 확인했습니다." },
  { id: "mysql-backup-recovery", repository: "MySQL 8.4", path: "refman/8.4/en/backup-and-recovery.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html", usedFor: ["backup methods", "PITR/binlog", "restore strategy"], evidence: "MySQL 8.4 backup and recovery/PITR official guide를 확인했습니다." },
  { id: "mysql-account-privileges", repository: "MySQL 8.4", path: "refman/8.4/en/privileges-provided.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/privileges-provided.html", usedFor: ["runtime/migration least privilege", "DDL/DML separation"], evidence: "MySQL privilege categories를 official reference에서 확인했습니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "cheatsheets/Secrets_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["DB credential lifecycle", "rotation", "audit", "least privilege"], evidence: "secret lifecycle와 rotation/least-privilege guidance를 확인했습니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "cheatsheets/Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["SQL/parameter redaction", "security events", "log injection/retention"], evidence: "민감 data를 logs에서 제외하고 security events를 일관되게 기록하는 guidance를 확인했습니다." },
  { id: "spring-transaction", repository: "Spring Framework", path: "reference/data-access/transaction.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["DataSource/JPA transaction integration", "service unit of work", "resource management"], evidence: "Spring transaction abstraction과 data access integration을 확인했습니다." },
  { id: "spring-orm-jpa", repository: "Spring Framework", path: "reference/data-access/orm/jpa.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/orm/jpa.html", usedFor: ["LocalContainerEntityManagerFactoryBean", "JpaTransactionManager", "persistence unit integration"], evidence: "Spring ORM의 JPA bootstrap와 transaction integration을 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-01-starter-datasource-ddl", slug: "jpa-01-starter-datasource-ddl", courseId: "spring", moduleId: "spring-data-jpa", order: 1,
  title: "Spring Data JPA starter·DataSource·ddl-auto",
  subtitle: "원본 Boot 4.1 JPA 설정을 비밀 없이 감사하고 provider·pool·schema ledger·무중단 migration·restore까지 운영 기준으로 확장합니다",
  level: "기초", estimatedMinutes: 85,
  coreQuestion: "data-jpa starter와 datasource 설정이 EntityManagerFactory까지 어떻게 이어지며, ddl-auto의 편의가 production schema/data를 파괴하지 않도록 어떤 migration·권한·복구 증거가 필요할까요?",
  summary: "2026-spring-jpa-test의 build.gradle과 application.yaml을 read-only로 감사합니다. 원본 Boot 4.1.0·Java 21·data-jpa/JDBC/MySQL 구성과 ddl-auto:none은 provenance로 보존하지만 실제 datasource credential은 절대 복사하지 않고 rotate해야 할 plaintext secret risk로만 다룹니다. starter/provider/driver graph, DataSource auto-configuration, TLS·least-privilege identities, fleet pool budget, EntityManagerFactory/transaction/scan, ddl-auto none/validate/update/create/create-drop, immutable migration ledger, expand-contract/backfill, privacy-safe SQL observability, test DB parity, backup/PITR/restore와 catalog canary를 초급 bootstrap에서 production recovery로 연결합니다. 다섯 JDK 21 examples는 dependency graph, pool budget, DDL policy, migration checksum과 schema compatibility를 exact stdout으로 실행하고 실제 Hibernate/MySQL tooling과의 경계를 명시합니다.",
  objectives: ["원본 build/YAML의 dependency·DataSource·DDL/log 구조를 실제 credential 없이 provenance로 설명한다.", "JPA starter를 provider, repository, ORM, JDBC driver/pool graph로 펼친다.", "DataSource auto-configuration/back-off와 database identity를 검증한다.", "runtime/migration DB accounts와 TLS/network least privilege를 분리한다.", "fleet connection budget과 timeout/backpressure를 계산한다.", "ddl-auto actions의 환경별 위험과 destructive guards를 적용한다.", "단일 immutable migration ledger와 expand-contract/backfill을 운영한다.", "SQL privacy, vendor-parity tests, backup/restore와 catalog drift gates를 증명한다."],
  prerequisites: [{ title: "Spring Boot 단위·slice·통합 테스트 전략", reason: "Boot test scopes와 packaged runtime 검증을 알아야 JPA auto-configuration, database migration과 vendor-parity tests를 계층별로 설계할 수 있습니다.", sessionSlug: "boot-09-testing-slices" }],
  keywords: ["Spring Data JPA", "Hibernate", "DataSource", "HikariCP", "JDBC driver", "EntityManagerFactory", "ddl-auto", "schema validation", "Flyway", "migration ledger", "expand-contract", "backfill", "least privilege", "SQL logging", "Testcontainers", "PITR", "catalog drift"],
  topics,
  lab: {
    title: "원본 JPA 설정을 least-privilege migration·pool·restore qualification으로 전환하기",
    scenario: "원본 두 파일을 변경하지 않고 sanitized clone/disposable MySQL에서 dependency→DataSource→JPA→migration→artifact/runtime→restore evidence를 완성합니다.",
    setup: ["JDK 21", "원본과 호환되는 Gradle Wrapper", "disposable MySQL compatible database", "runtime/migration/test synthetic accounts", "원본 files read-only", "production credential/data 접근 금지"],
    steps: ["두 원본 파일의 hash와 dependency/config key 구조만 기록하고 actual values는 수집하지 않습니다.", "노출 가능 datasource credential을 rotation과 history/CI artifact 범위 조사에 등록합니다.", "runtimeClasspath/dependencyInsight로 JPA provider, Spring Data/ORM, driver와 pool versions를 고정합니다.", "disposable DB에서 DataSource conditions, database identity, grants/TLS와 pool budget을 검증합니다.", "ddl-auto actions를 environment policy/least privilege negative tests로 차단하고 none/validate 차이를 실행합니다.", "single migration tool ledger에 pre/postconditions와 additive migration을 작성합니다.", "old/new application과 expand→backfill→cutover→contract compatibility를 fault/load test합니다.", "raw SQL/parameters 없이 query/pool/transaction evidence와 zero-leak logs를 검증합니다.", "same migrations를 target-vendor test DB에 적용해 catalog/constraint/commit/query plans를 확인합니다.", "backup restore/PITR simulation 뒤 ledger, catalog, data and application read/write acceptance와 rollback/forward runbook을 승인합니다."],
    expectedResult: ["실제 DB credential/data가 source, logs, reports와 artifacts에 새로 노출되지 않습니다.", "runtime account는 DDL을 실행할 수 없고 migration account만 time-bounded schema changes를 수행합니다.", "migration ledger/checksums, catalog와 old/new compatibility가 expected state입니다.", "pool capacity/timeouts와 SQL observability가 privacy-safe budgets를 만족합니다.", "restore DB에서 JPA validation과 critical positive/negative read/write acceptance가 통과합니다."],
    cleanup: ["disposable DB/schemas/accounts, pools/processes, migration locks와 test data를 제거합니다.", "synthetic secrets를 revoke하고 debug SQL/Actuator exposure를 원복합니다.", "restore artifacts를 privacy/retention policy에 따라 삭제합니다.", "원본 두 파일이 변경되지 않았음을 hash/status로 readback합니다."],
    extensions: ["Liquibase와 Flyway ledger/rollback workflow를 같은 criteria로 비교합니다.", "online DDL/backfill을 production-scale data와 replication lag guard에서 측정합니다.", "multiple DataSources/persistence units와 cross-database outbox boundary를 설계합니다.", "schema/catalog conformance를 deployment admission과 fleet drift dashboard에 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 각 결과가 실제 JPA/DB evidence의 어느 단계와 대응하는지 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "starter와 provider를 구분합니다.", "pool budget의 가정을 적습니다.", "환경별 DDL allowlist를 설명합니다.", "checksum drift와 pending을 구분합니다.", "expand-contract compatibility를 설명합니다."], hints: ["model을 실제 schema migration engine이라고 쓰지 말고 catalog/ledger/pool evidence를 함께 적으세요."], expectedOutcome: "JPA bootstrap의 숨은 data/schema 위험을 결정 가능한 입력·정책·증거로 설명합니다.", solutionOutline: ["graph→connection budget→DDL policy→ledger→compatibility 순서입니다."] },
    { difficulty: "응용", prompt: "원본 2026-spring-jpa-test를 production-safe schema ownership으로 migration하는 계획을 작성하세요.", requirements: ["credential rotation을 첫 단계로 둡니다.", "runtime/migration identities와 TLS를 분리합니다.", "pool/fleet capacity를 계산합니다.", "ddl-auto none/validate policy를 둡니다.", "single migration ledger와 expand-contract를 작성합니다.", "vendor parity/commit/catalog tests를 둡니다.", "privacy-safe SQL/pool telemetry를 적용합니다.", "backup/PITR/restore/canary/rollback을 포함합니다."], hints: ["원본 DB 값을 답안이나 sample config에 복사하지 마세요."], expectedOutcome: "data loss와 drift를 막고 복구 가능한 implementation-ready JPA baseline이 완성됩니다.", solutionOutline: ["rotate→baseline→permissions/pool→schema owner→migration→tests→restore→rollout 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JPA DataSource·schema evolution 표준을 작성하세요.", requirements: ["지원 Boot/provider/driver/DB matrix를 정의합니다.", "DataSource identity/TLS/least privilege를 둡니다.", "pool/timeout budget을 둡니다.", "ddl-auto environment policy와 destructive guards를 정의합니다.", "migration immutable ledger/review/pre-postconditions를 둡니다.", "expand-contract/backfill/contract gates를 정의합니다.", "SQL privacy/catalog drift/vendor tests를 둡니다.", "RTO/RPO/restore/forward recovery를 포함합니다."], hints: ["ORM mapping, schema migration, data migration과 backup recovery를 서로 다른 책임으로 나누세요."], expectedOutcome: "개발 편의부터 production recovery까지 감사 가능한 persistence governance가 완성됩니다.", solutionOutline: ["compatibility matrix→connection boundary→schema owner→evolution→observe→recover 순서입니다."] },
  ],
  nextSessions: ["jpa-02-entity-id-column"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["원본 application.yaml의 실제 DB URL/username/password는 공개 내용에 복사하지 않았고 plaintext exposure 가능성을 전제로 revoke/rotate와 history/artifact 조사를 요구했습니다.", "원본 ddl-auto:none과 show-sql/format_sql은 snapshot behavior로만 기록했으며 production migration/observability가 이미 안전하다고 가정하지 않았습니다.", "원본에는 versioned migration ledger, expand-contract, pool capacity, least-privilege migration identity와 restore acceptance가 충분하지 않아 current Spring Boot/Data JPA/Jakarta/Hibernate/Hikari/Flyway/MySQL/OWASP 공식 자료와 synthetic examples로 보강했습니다.", "실제 원본 database를 실행·변경하지 않았으므로 provider graph, catalog, grants, pool, migration과 recovery outcomes는 disposable lab에서 검증해야 합니다."] },
});

export default session;
