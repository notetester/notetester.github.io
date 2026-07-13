import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function javaExample(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-8", explanation: "JDK 21 표준 library로 pool capacity·Semaphore·lease·lifetime·recovery state를 모델링해 실제 host·credential 없이 핵심 불변식을 재현합니다." },
      { lines: "9-끝에서 5줄 전", explanation: "borrow/wait/timeout/close/leak/retire/validate/outage/shutdown transition을 실행하고 active·pending·retired를 계산합니다." },
      { lines: "마지막 5줄", explanation: "bounded counts·booleans·stable outcomes만 출력합니다. 실제 Hikari timing/network/driver behavior는 production version integration과 metrics로 재검증합니다." },
    ],
    run: { environment: ["JDK 21", "외부 library·DB·network·credential 불필요"], command: `javac --release 21 ${filename} && java ${filename.replace(/\.java$/, "")}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "synthetic model은 HikariCP ConcurrentBag, housekeeper, driver validation, socket failure와 physical connection lifecycle을 대체하지 않습니다."] },
    experiments: [
      { change: "arrival rate·connection hold time·instance 수·DB connection budget을 바꿉니다.", prediction: "pool을 무조건 키우면 DB contention이 증가하고 너무 작으면 pending/acquisition timeout이 증가합니다.", result: "Little's-law 관찰값은 시작점으로만 쓰고 throughput/latency/DB waits load test로 결정합니다." },
      { change: "lease를 반환하지 않거나 DB를 down/up하고 connection age를 infrastructure timeout보다 길게 둡니다.", prediction: "active/pending·leak candidates·invalid retirements가 증가하고 recovery가 지연됩니다.", result: "try-with-resources, bounded acquisition, maxLifetime/keepalive, validation과 rapid-recovery matrix를 함께 검증합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "datasource-pool-physical-logical",
    title: "DataSource·HikariDataSource·logical Connection·physical session을 구분합니다",
    lead: "커넥션 풀은 Connection을 새로 만드는 문법이 아니라 제한된 physical DB sessions를 여러 요청이 짧게 대여·반환하는 자원 관리자입니다.",
    explanations: [
      "application은 DataSource.getConnection으로 logical proxy/lease를 얻습니다. HikariDataSource가 underlying driver/DataSource로 physical connection을 만들고 pool에 보관하며 proxy close를 반환으로 해석합니다.",
      "logical Connection identity와 physical session identity는 다릅니다. 한 physical connection이 여러 requests에 순차 재사용되므로 transaction/session state isolation이 필수입니다.",
      "Connection pool은 query cache나 transaction manager가 아닙니다. SQL plan/latency, DB locks와 service transaction boundary 문제를 pool size로 해결하지 않습니다.",
      "root-context.xml은 41 logical lines에서 beans5, HikariConfig/HikariDataSource와 같은 DataSource를 주입받는 JdbcTemplate·SqlSessionFactory 구조를 가집니다. property names만 확인하고 JDBC URL·username·password 값은 복사하지 않습니다.",
      "JDBCHIKARI.java는 33 logical lines에서 injected DataSource와 getConnection1·plain try/catch1이 있지만 close0입니다. 연결 획득 smoke test를 비난하지 않고 pool lease 반환 gap으로 보강합니다.",
    ],
    concepts: [
      c("physical connection", "DB server session/socket과 driver state를 가진 실제 연결입니다.", ["생성 비용이 큽니다.", "pool이 lifecycle을 관리합니다."]),
      c("logical connection", "borrower에게 반환되는 proxy handle로 close 시 physical connection을 pool에 돌려주는 lease입니다.", ["thread/transaction scope에 제한합니다.", "unwrap 보관을 피합니다."]),
      c("DataSource owner", "pool 생성·configuration·health·shutdown을 application lifecycle에 맞춰 관리하는 component입니다.", ["singleton lifecycle을 둡니다.", "JdbcTemplate/MyBatis가 공유할 수 있습니다."]),
    ],
    diagnostics: [d("getConnection을 호출할 때마다 DB session이 새로 생긴다고 오해해 close를 생략합니다.", "logical proxy 반환과 physical close를 구분하지 못했습니다.", ["DataSource class/proxy", "pool active/idle/total", "physical session ids", "close paths"], "모든 borrower를 try-with-resources로 닫고 pool metrics에서 active가 scope 종료 뒤 감소하는지 확인합니다.", "연속 borrow에서 logical/physical identity와 active/idle transition을 integration test합니다.")],
    expertNotes: ["pool은 공유하되 Connection lease는 request/transaction lexical scope 밖으로 공유하지 않습니다.", "JdbcTemplate/MyBatis가 같은 DataSource를 쓴다고 transaction 참여가 자동인지는 Spring transaction manager/resource binding으로 검증합니다."],
  },
  {
    id: "pool-sizing-db-budget-littles-law",
    title: "maximumPoolSize를 사용자 수가 아니라 DB budget·hold time·throughput으로 산정합니다",
    lead: "connection을 많이 열수록 빠르다는 가정은 DB CPU·I/O·locks/context switching을 포화시켜 오히려 throughput과 tail latency를 악화시킬 수 있습니다.",
    explanations: [
      "DB max connections에서 admin/migration/monitoring/other services reserve를 빼고 application instances에 budget을 나눕니다. autoscaling 최대 instances와 rolling deploy old+new 동시 수를 포함합니다.",
      "Little's Law의 평균 in-use≈arrival rate×average hold time은 starting observation입니다. p95/p99 hold, burst, transaction mix와 DB CPU/I/O/wait event를 load test해 headroom을 정합니다.",
      "Hikari 공식 sizing guide도 작은 saturated pool을 출발점으로 권합니다. 특정 core formula를 보편 정답으로 복사하지 않고 실제 database/workload에서 주변 sizes를 비교합니다.",
      "긴 batch/report와 짧은 request가 같은 pool이면 head-of-line blocking이 생깁니다. workload를 분리할 때도 각 pools 합계가 DB budget을 넘지 않고 cross-pool transaction을 만들지 않게 합니다.",
      "minimumIdle을 명시하면 dynamic behavior가 생기며 default는 maximumPoolSize와 같은 fixed-size 성격입니다. startup spike, idle cost와 recovery 요구로 선택합니다.",
    ],
    concepts: [
      c("DB connection budget", "database가 안정적으로 처리할 total sessions에서 예약분과 다른 workloads를 제외한 application 몫입니다.", ["instances에 나눕니다.", "failover/rolling deploy를 포함합니다."]),
      c("connection hold time", "borrow부터 close/return까지 Connection lease를 보유한 시간입니다.", ["query time만이 아닙니다.", "remote/user wait를 제거합니다."]),
      c("pool saturation", "모든 slots가 active이고 새 borrowers가 pending queue에서 기다리는 상태입니다.", ["항상 나쁜 것은 아닙니다.", "bounded wait/throughput을 함께 봅니다."]),
    ],
    codeExamples: [javaExample("jdbc06-pool-sizing", "DB budget과 observed demand의 per-instance 계산", "Jdbc06PoolSizing.java", "DB reserve·최대 instances와 arrival×hold를 계산해 load-test 후보를 출력합니다.", String.raw`import java.util.Locale;

public class Jdbc06PoolSizing {
    public static void main(String[] args) {
        int databaseLimit = 18;
        int reserved = 6;
        int maxInstances = 4;
        int applicationBudget = databaseLimit - reserved;
        int perInstance = applicationBudget / maxInstances;
        double arrivalPerSecond = 40.0;
        double averageHoldSeconds = 0.075;
        double averageInUse = arrivalPerSecond * averageHoldSeconds;
        System.out.println("application-budget=" + applicationBudget);
        System.out.println("per-instance=" + perInstance);
        System.out.printf(Locale.ROOT, "observed-average-in-use=%.2f%n", averageInUse);
        System.out.println("candidate-covers-average=" + (perInstance >= averageInUse));
        System.out.println("decision=load-test-around-candidate");
    }
}`, "application-budget=12\nper-instance=3\nobserved-average-in-use=3.00\ncandidate-covers-average=true\ndecision=load-test-around-candidate", ["local-root-context", "hikari-readme", "hikari-pool-sizing", "spring-jdbc-connections"])],
    diagnostics: [d("pool을 두 배로 늘렸는데 throughput은 그대로이고 DB CPU/lock waits만 증가합니다.", "frontend concurrency를 database parallel capacity로 착각했습니다.", ["pool size vs TPS/latency", "DB CPU/I/O/waits", "connection hold distribution", "instance count/total sessions"], "DB budget 안에서 작은 sizes 주변을 load-test하고 hold time/slow transaction을 먼저 줄입니다.", "capacity test에 total sessions, TPS, p99, DB waits와 pending time을 함께 기록합니다.")],
    expertNotes: ["평균 in-use가 3이라고 pool3이 모든 burst를 만족한다는 뜻은 아니므로 tail/deadline을 load-test합니다.", "autoscaling이 늘어날수록 instance별 pool을 자동 축소하거나 global admission control로 DB budget을 지킵니다."],
  },
  {
    id: "acquisition-timeout-backpressure",
    title: "connectionTimeout으로 무한 대기를 끊고 application backpressure를 설계합니다",
    lead: "pool이 가득 찼을 때 getConnection은 빈 slot을 기다리므로 acquisition timeout은 DB query timeout과 다른 queue wait budget입니다.",
    explanations: [
      "Hikari connectionTimeout은 idle Connection을 얻기 위해 기다릴 최대 시간이며 초과 시 SQLException을 냅니다. request remaining deadline보다 짧게 두고 units/minimum 제한을 공식 config에서 확인합니다.",
      "pending이 증가하면 pool size 부족, leak/long transaction, DB slowdown 또는 traffic spike 중 무엇인지 active hold time·DB waits와 함께 진단합니다.",
      "timeout을 무조건 늘리면 request threads가 더 오래 쌓여 memory/queue와 upstream timeout을 악화합니다. bounded queue, concurrency limit, load shedding와 retry-after를 설계합니다.",
      "acquisition timeout은 DB에 statement를 보내기 전일 수 있어 write outcome은 없지만 outer retry budget과 idempotency 정책을 일관되게 적용합니다.",
      "virtual threads가 대기를 싸게 만들어도 DB connections는 그대로 희소합니다. 더 많은 parked callers가 database capacity를 늘리지 않으므로 admission control이 필요합니다.",
    ],
    concepts: [
      c("acquisition wait", "DataSource.getConnection 호출이 idle lease를 받을 때까지 pending queue에서 기다리는 시간입니다.", ["query time과 분리합니다.", "p95/p99를 관측합니다."]),
      c("connectionTimeout", "pool에서 connection 획득을 기다리는 최대 기간과 timeout SQLException 정책입니다.", ["outer deadline보다 짧게 둡니다.", "Hikari minimum을 확인합니다."]),
      c("backpressure", "DB 처리 능력을 넘는 요청을 bounded wait·reject·defer해 overload 확산을 막는 제어입니다.", ["pool 크기만으로 끝나지 않습니다.", "user-safe response를 둡니다."]),
    ],
    codeExamples: [javaExample("jdbc06-acquisition-timeout", "한 slot 포화와 bounded 대기 회복", "Jdbc06AcquireTimeout.java", "Semaphore 한 slot을 pool로 모델링해 second borrow timeout과 반환 뒤 recovery를 검증합니다.", String.raw`import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public class Jdbc06AcquireTimeout {
    public static void main(String[] args) throws Exception {
        Semaphore slots = new Semaphore(1, true);
        slots.acquire();
        boolean secondAcquired = slots.tryAcquire(5, TimeUnit.MILLISECONDS);
        int pending = secondAcquired ? 0 : 1;
        System.out.println("active=1");
        System.out.println("pending=" + pending);
        System.out.println("timed-out=" + (!secondAcquired));
        slots.release();
        boolean recovered = slots.tryAcquire(5, TimeUnit.MILLISECONDS);
        System.out.println("recovered=" + recovered);
        if (recovered) slots.release();
        System.out.println("available=" + slots.availablePermits());
    }
}`, "active=1\npending=1\ntimed-out=true\nrecovered=true\navailable=1", ["hikari-readme", "hikari-config-source", "jdk-datasource", "jdk-transient-connection", "jdk-semaphore"])],
    diagnostics: [d("pending threads와 request timeout이 증가해 pool을 키웠지만 다시 고갈됩니다.", "root cause인 leaked/long-held connections나 DB slowdown을 queue capacity로 숨겼습니다.", ["active hold-time traces", "pending/acquisition p99", "DB query/lock waits", "close/transaction completion paths"], "leak/slow transaction을 수정하고 request concurrency/backpressure를 DB budget에 맞춘 뒤 size를 load-test합니다.", "outage/slow DB/spike scenarios에서 bounded pending과 fast recovery를 검증합니다.")],
    expertNotes: ["pool timeout response에 재시도 가능성을 표시할 때 retry storm을 막는 jitter/backoff/admission 정책을 둡니다.", "connectionTimeout과 initializationFailTimeout은 startup vs borrow의 다른 경계입니다."],
  },
  {
    id: "lease-ownership-leak-detection",
    title: "try-with-resources 소유권과 leakDetectionThreshold를 증거 수집 도구로 사용합니다",
    lead: "Connection close 누락은 physical 연결을 잃는 것이 아니라 pool active lease를 영구 점유해 결국 모든 borrowers를 막습니다.",
    explanations: [
      "getConnection 호출과 같은 lexical service/repository scope에서 try-with-resources로 닫습니다. ResultSet/Statement도 먼저 닫고 transaction outcome 후 Connection을 반환합니다.",
      "local JDBCHIKARI test는 connection 획득 뒤 close가 없어 smoke test 반복/실서비스 패턴으로 복사하면 leak가 됩니다. 원본 host/credentials는 사용하지 않고 ownership gap만 provenance로 삼습니다.",
      "leakDetectionThreshold는 lease가 임계시간 이상 pool 밖에 있을 때 acquisition stack을 진단하는 도구이지 connection을 자동 회수하는 correctness 기능이 아닙니다.",
      "threshold가 정상 장기 query보다 짧으면 false positive, 너무 길면 장애 전에 경고하지 못합니다. operation별 hold p99와 transaction deadline을 기준으로 incident 기간에 신중히 사용합니다.",
      "Connection을 field, static, cache, async callback이나 stream/lazy iterator에 보관하지 않습니다. ownership을 넘길 때는 bounded callback abstraction을 사용합니다.",
    ],
    concepts: [
      c("connection leak", "borrowed logical Connection이 owner scope 종료 뒤 close/return되지 않아 active slot을 계속 점유하는 상태입니다.", ["physical session은 살아 있을 수 있습니다.", "pool 고갈을 만듭니다."]),
      c("leak candidate", "lease age가 diagnostic threshold를 넘어서 stack capture 대상으로 표시된 connection입니다.", ["확정 leak와 다릅니다.", "자동 회수가 아닙니다."]),
      c("lexical lease", "try-with-resources block과 동일하게 보이는 짧은 scope에 Connection ownership을 제한하는 규칙입니다.", ["async 전달을 막습니다.", "close를 자동화합니다."]),
    ],
    codeExamples: [javaExample("jdbc06-lease-ownership", "AutoCloseable lease 반환과 leak candidate", "Jdbc06LeaseOwnership.java", "정상 try scope와 의도적 unclosed lease의 active counter를 비교하고 최종 반환합니다.", String.raw`public class Jdbc06LeaseOwnership {
    static final class Pool {
        int active;
        Lease borrow() { active++; return new Lease(this); }
    }
    static final class Lease implements AutoCloseable {
        private final Pool pool;
        private boolean closed;
        Lease(Pool pool) { this.pool = pool; }
        @Override public void close() {
            if (!closed) { closed = true; pool.active--; }
        }
    }
    public static void main(String[] args) {
        Pool pool = new Pool();
        try (Lease ignored = pool.borrow()) {
            System.out.println("inside-active=" + pool.active);
        }
        System.out.println("after-scope=" + pool.active);
        Lease leaked = pool.borrow();
        System.out.println("leak-candidates=" + (pool.active > 0 ? 1 : 0));
        leaked.close();
        System.out.println("after-return=" + pool.active);
        System.out.println("all-returned=" + (pool.active == 0));
    }
}`, "inside-active=1\nafter-scope=0\nleak-candidates=1\nafter-return=0\nall-returned=true", ["local-jdbc-hikari", "hikari-datasource-source", "jdk-connection", "spring-jdbc-connections"])],
    diagnostics: [d("active가 maximum에 붙고 pending만 늘지만 DB query는 거의 없습니다.", "borrow 후 application/remote work에서 connection을 field로 보관하거나 close path가 누락됐습니다.", ["lease acquisition stacks/ages", "request/thread ownership", "active DB statements", "finally/try-with-resources paths"], "DB work lexical scope로 borrow를 늦추고 즉시 close하며 external work를 scope 밖으로 이동합니다.", "success/error/cancel/early-return과 async rejection에서 active가 baseline으로 돌아오는 test를 둡니다.")],
    expertNotes: ["leak detector stack에는 code path가 있지만 business key를 넣지 않아도 원인을 찾을 수 있게 operation correlation을 별도로 둡니다.", "강제로 leaked connection을 회수하면 사용 중인 transaction을 깨뜨릴 수 있어 owner bug 수정이 우선입니다."],
  },
  {
    id: "lifetime-idle-keepalive-clock",
    title: "maxLifetime·idleTimeout·keepaliveTime을 infrastructure timeout과 clock 기준으로 정렬합니다",
    lead: "pool이 DB·load balancer·firewall보다 오래 physical connection을 보존하면 stale socket이 borrower에게 전달되어 burst failure가 생깁니다.",
    explanations: [
      "maxLifetime은 physical connection의 최대 수명이며 infrastructure/database connection limit보다 여유 있게 짧게 둡니다. in-use connection은 일반적으로 반환될 때 retirement되므로 장기 lease를 강제로 끊는 timeout이 아닙니다.",
      "idleTimeout은 minimumIdle보다 많은 idle connections를 줄이는 정책이고 fixed-size default에서는 의미가 다릅니다. minimumIdle/maxPool 관계와 timer variation을 공식 config에서 확인합니다.",
      "keepaliveTime은 idle connection을 pool 밖으로 잠시 빼 validation/ping해 network idle kill을 방지합니다. maxLifetime보다 짧고 DB/network 부하를 고려합니다.",
      "모든 instances가 같은 순간 connection을 교체하는 mass extinction을 막는 attenuation/jitter와 startup stagger를 관찰합니다. database failover 때 reconnect storm을 rate-limit합니다.",
      "Hikari는 정확한 timers에 의존하므로 VM/container host clock sync를 운영합니다. wall-clock jump를 timeout correctness로 가정하지 않고 monotonic/internal implementation release notes를 확인합니다.",
    ],
    concepts: [
      c("maxLifetime", "physical connection을 pool에서 retirement할 최대 나이 설정입니다.", ["infra timeout보다 짧게 둡니다.", "in-use 강제 kill과 다릅니다."]),
      c("idleTimeout", "minimumIdle를 초과한 unused connections를 줄이기 위한 idle 기간 설정입니다.", ["fixed-size 관계를 봅니다.", "minimum/variation을 확인합니다."]),
      c("keepaliveTime", "idle physical connection을 주기적으로 validation해 network/database idle termination을 예방하는 설정입니다.", ["maxLifetime보다 짧습니다.", "idle connection에만 적용됩니다."]),
    ],
    codeExamples: [javaExample("jdbc06-lifetime-validation", "expired·invalid physical candidates 폐기", "Jdbc06LifetimeValidation.java", "합성 connection 세 개 중 lifetime 초과와 invalid를 retired하고 healthy id를 빌립니다.", String.raw`import java.util.List;

public class Jdbc06LifetimeValidation {
    record Physical(int id, long age, boolean valid) { }
    public static void main(String[] args) {
        long maxLifetime = 100;
        List<Physical> candidates = List.of(
                new Physical(1, 120, true),
                new Physical(2, 20, false),
                new Physical(3, 30, true));
        int retired = 0;
        Physical borrowed = null;
        for (Physical candidate : candidates) {
            if (candidate.age() >= maxLifetime || !candidate.valid()) {
                retired++;
                continue;
            }
            borrowed = candidate;
            break;
        }
        System.out.println("retired=" + retired);
        System.out.println("borrowed=" + borrowed.id());
        System.out.println("valid=" + borrowed.valid());
        System.out.println("age=" + borrowed.age());
        System.out.println("max-lifetime=" + maxLifetime);
    }
}`, "retired=2\nborrowed=3\nvalid=true\nage=30\nmax-lifetime=100", ["hikari-readme", "hikari-config-source", "hikari-rapid-recovery", "mysql-driver-properties", "oracle-jdbc-troubleshooting", "pgjdbc-use"])],
    diagnostics: [d("매일 비슷한 시각에 connection errors가 burst로 발생합니다.", "pool maxLifetime/keepalive가 firewall/DB idle/lifetime보다 길거나 instances가 동시에 stale connections를 교체합니다.", ["physical age/error timestamps", "infra idle/lifetime", "keepalive/retirement logs", "instance restart/clock sync"], "maxLifetime을 infra limit보다 짧게, keepalive를 적절히 설정하고 reconnect를 stagger/rate-limit합니다.", "idle-kill/failover/time-skew fault test에서 error burst와 recovery time을 측정합니다.")],
    expertNotes: ["예제의 숫자는 단위 없는 state model이며 실제 Hikari time properties는 milliseconds와 documented minimums를 사용합니다.", "connectionTestQuery는 JDBC4 isValid가 없는 legacy driver에서만 검토하고 불필요한 validation SQL을 추가하지 않습니다."],
  },
  {
    id: "validation-initialization-rapid-recovery",
    title: "validation·initializationFailTimeout·driver network settings으로 outage와 복구를 설계합니다",
    lead: "pool은 database outage를 없애지 않으며 stale/broken connection을 빠르게 버리고 bounded하게 새 connections를 만들 수 있어야 합니다.",
    explanations: [
      "JDBC4 driver는 Connection.isValid 기반 validation을 우선하고 legacy driver만 connectionTestQuery를 검토합니다. validation timeout이 request/acquisition deadline 안에 들어오게 합니다.",
      "initializationFailTimeout은 startup에서 initial connection을 확보하지 못할 때 fail-fast 또는 background retry 선택을 결정합니다. readiness가 DB dependent인지와 orchestrator restart storm을 함께 설계합니다.",
      "driver connect/socket/read timeout과 OS TCP keepalive가 없으면 half-open network에서 thread가 pool timeout보다 오래 멈출 수 있습니다. Hikari 설정만으로 network recovery를 완성할 수 없습니다.",
      "fatal SQLState/driver error와 validation failure physical connection은 evict하고 replacement rate를 제한합니다. DB down 동안 무한 creation loop/log storm을 막습니다.",
      "failover 후 DNS, TLS, credentials, read/write role과 session initialization이 새 target에서 맞는지 canary transaction으로 확인합니다. connection 획득 성공만 readiness로 보지 않습니다.",
    ],
    concepts: [
      c("connection validation", "physical connection이 borrower에게 안전하게 사용 가능한지 driver/server round trip으로 확인하는 절차입니다.", ["isValid를 우선합니다.", "deadline을 둡니다."]),
      c("initialization failure policy", "startup 시 initial DB connection 실패를 application start 실패 또는 background recovery로 처리하는 선택입니다.", ["readiness와 연결합니다.", "restart storm을 피합니다."]),
      c("rapid recovery", "outage/failover 뒤 broken connections를 폐기하고 bounded reconnect로 healthy pool을 회복하는 능력입니다.", ["driver/OS timeouts가 필요합니다.", "recovery SLO를 측정합니다."]),
    ],
    diagnostics: [d("DB는 복구됐지만 pool이 오래 0이거나 threads가 socket read에 묶입니다.", "driver/network timeout·TCP keepalive가 없고 stale connections가 신속히 evict/recreate되지 않습니다.", ["connect/socket timeout", "TCP keepalive", "pool total/creation failures", "DNS/TLS/role after failover"], "driver/OS network settings과 Hikari recovery configuration을 정렬하고 bounded background reconnect/readiness를 검증합니다.", "DB kill/network blackhole/DNS failover에서 time-to-detect/recover와 request shedding을 측정합니다.")],
    expertNotes: ["readiness가 false여도 running instance가 자동 restart loop로 DB를 더 압박하지 않게 orchestration policy를 설계합니다.", "validation query에 write/transaction side effect나 sensitive schema 의존성을 두지 않습니다."],
  },
  {
    id: "transaction-session-state-reset",
    title: "반환 전 transaction·autocommit·isolation·readOnly·schema state를 초기화합니다",
    lead: "physical connection 재사용은 이전 borrower의 session state가 다음 요청에 절대 누출되지 않는다는 전제 위에만 안전합니다.",
    explanations: [
      "service owner는 success commit/failure rollback 뒤 close합니다. pool이 uncommitted transaction을 rollback할 수 있어도 이를 business completion owner로 의존하지 않습니다.",
      "Hikari proxy는 알려진 JDBC state 변경을 추적/reset할 수 있지만 raw SQL SET, vendor session variables, temporary objects와 application context는 자동 감지되지 않을 수 있습니다.",
      "tenant schema/role, timezone, locale, application name과 audit context를 변경하면 checkout마다 set/readback하고 return마다 reset하거나 아예 per-query qualified design을 사용합니다.",
      "Connection을 여러 threads/async tasks에서 동시에 사용하지 않습니다. transaction context는 thread/reactive owner와 함께 제한하고 work가 끝나기 전 lease를 반환하지 않습니다.",
      "close/rollback/reset 실패 physical connection은 evict하며 다음 borrower negative test에서 autoCommit/isolation/schema/context가 baseline인지 확인합니다.",
    ],
    concepts: [
      c("session state leakage", "이전 borrower의 transaction/schema/role/settings가 physical connection 재사용으로 다음 borrower에게 보이는 현상입니다.", ["cross-tenant 위험입니다.", "checkout/readback test를 둡니다."]),
      c("known JDBC state", "pool proxy가 setter 호출로 추적하고 반환 때 baseline으로 복원할 수 있는 Connection properties입니다.", ["raw SET과 구분합니다.", "version별 확인합니다."]),
      c("connection confinement", "한 logical lease를 한 transaction/thread scope에서만 사용하는 규칙입니다.", ["field/cache 저장을 피합니다.", "async boundary를 넘지 않습니다."]),
    ],
    diagnostics: [d("다음 요청이 이전 tenant schema나 readOnly/isolation을 상속합니다.", "custom session state를 raw SQL로 바꾸고 reset하지 않은 physical connection을 재사용했습니다.", ["same physical session sequential requests", "checkout/return state", "pool reset logs", "custom SET/temp/context"], "session mutation을 중앙화하고 checkout set/readback+return reset 또는 connection eviction을 적용합니다.", "같은 physical connection을 강제 재사용하는 cross-tenant negative test를 둡니다.")],
    expertNotes: ["root-context의 하나의 DataSource 공유는 효율적이지만 JdbcTemplate/MyBatis 모든 code가 같은 state hygiene를 지켜야 합니다.", "temporary tables/session variables를 사용하는 legacy code는 pool compatibility review와 cleanup procedure가 필요합니다."],
  },
  {
    id: "pool-metrics-jmx-health-observability",
    title: "active·idle·pending·total·acquisition·usage metrics와 DB evidence를 함께 봅니다",
    lead: "pool 하나의 active 숫자만으로 고갈 원인이 size·leak·slow DB·lock·outage 중 무엇인지 구분할 수 없습니다.",
    explanations: [
      "HikariPoolMXBean의 active/idle/total/threadsAwaiting과 metrics tracker의 acquire/usage/creation 등을 지원 version에서 확인합니다. management operations은 순간 snapshot이며 자동 sizing control로 남용하지 않습니다.",
      "acquisition wait, connection usage/hold, timeout count와 leak candidates를 request operation별 histogram으로 수집합니다. JDBC URL/user/query/bind를 high-cardinality label로 쓰지 않습니다.",
      "DB active sessions, query/lock waits, CPU/I/O, transaction age와 pool metrics를 같은 time window에서 correlation합니다. active high+DB idle이면 application hold/leak 가능성이 큽니다.",
      "health check는 pool에서 connection 한 개를 얻어 DB role/간단 invariant를 확인하되 traffic과 같은 timeout/backpressure를 존중합니다. health probe가 pool을 고갈시키지 않게 별도 budget을 둡니다.",
      "alerts는 pending/acquire p99/timeouts, usage p99, total<expected, creation failures와 DB waits/recovery SLO를 조합합니다. 일시 spike 한 점보다 sustained window와 error budget을 사용합니다.",
    ],
    concepts: [
      c("pool state vector", "active·idle·pending·total을 같은 시점에 본 pool capacity 상태입니다.", ["합계 invariant를 봅니다.", "단일 gauge로 진단하지 않습니다."]),
      c("acquisition histogram", "borrow 요청이 lease를 얻기까지 걸린 시간의 분포입니다.", ["tail을 관측합니다.", "request deadline과 비교합니다."]),
      c("usage histogram", "Connection을 대여한 뒤 반환할 때까지 hold duration 분포입니다.", ["leak/long transaction을 찾습니다.", "query time과 구분합니다."]),
    ],
    diagnostics: [d("active=max alert만 보고 pool을 키우는 조치가 반복됩니다.", "pending/acquire/usage와 DB waits/throughput을 보지 않아 saturation 원인을 분류하지 않았습니다.", ["state vector", "acquire/usage distributions", "DB sessions/waits/TPS", "leak/long transaction traces"], "application hold·DB capacity·traffic별 evidence를 함께 보고 size/bug/query/backpressure 중 맞는 조치를 선택합니다.", "outage/leak/slow query/traffic spike별 expected metric signature와 runbook을 rehearsal합니다.")],
    expertNotes: ["MXBean suspend/resume 같은 management operation은 일반 autoscaling loop가 아니라 승인된 운영 도구입니다.", "metrics backend가 poolName을 bounded deployment identity로 유지하고 pod/random IDs로 cardinality를 폭증시키지 않게 합니다."],
  },
  {
    id: "credentials-configuration-lifecycle",
    title: "credential·configuration·rotation·shutdown을 application lifecycle과 보안 경계로 관리합니다",
    lead: "JDBC URL·username·password를 XML/source/example에 넣으면 repository·logs·diagnostic dump로 확산되고 rotation이 재배포 의존으로 굳습니다.",
    explanations: [
      "root-context는 property placeholder와 HikariConfig property names를 사용합니다. 실제 values는 environment/secret manager에서 주입하고 학습/CI에는 synthetic placeholders만 사용합니다.",
      "config dump/JMX/log에 password, token, full URL query properties와 host topology를 출력하지 않습니다. startup validation은 required key presence와 safe fingerprint만 기록합니다.",
      "credential rotation은 새 connections가 new credential을 쓰고 old physical connections가 maxLifetime/soft eviction/drain으로 사라지는 overlap을 설계합니다. 즉시 revoke 전에 active transactions를 고려합니다.",
      "application shutdown은 traffic/readiness를 먼저 차단하고 in-flight transactions/leases를 bounded drain한 뒤 HikariDataSource.close로 pool/housekeeper/physical connections를 종료합니다.",
      "redeploy/test context에서 DataSource를 반복 생성하고 close하지 않으면 threads/connections/classloader leak가 납니다. singleton owner와 lifecycle callback/readback을 둡니다.",
    ],
    concepts: [
      c("externalized credential", "source/XML artifact 밖의 secret channel에서 runtime에 주입되는 DB authentication material입니다.", ["값을 로그하지 않습니다.", "rotation owner를 둡니다."]),
      c("pool drain", "new borrows를 막고 in-flight leases가 반환될 bounded 시간을 준 뒤 physical resources를 종료하는 절차입니다.", ["readiness/traffic과 연결합니다.", "force deadline을 둡니다."]),
      c("credential overlap", "rotation 중 old/new credentials와 connections가 짧은 기간 함께 유효한 migration window입니다.", ["revoke 순서를 정의합니다.", "old sessions를 관측합니다."]),
    ],
    diagnostics: [d("credential rotation 후 일부 requests만 authentication 실패합니다.", "old pool connections/instances와 new secret 적용 시점·revocation이 조정되지 않았습니다.", ["instance config version", "physical connection ages", "old/new auth failures", "deployment/drain timeline"], "new credential 배포·canary→new connection 검증→old pool drain/soft eviction→old credential revoke 순서를 사용합니다.", "rolling deploy와 long transaction을 포함한 rotation rehearsal를 실행합니다.")],
    expertNotes: ["source에는 property names가 있어도 actual local password/URL/host 값을 교육 content에 복사하지 않습니다.", "pool shutdown hook 순서가 Spring context와 request server lifecycle에 맞는지 통합 테스트합니다."],
  },
  {
    id: "outage-shutdown-recovery-governance",
    title: "outage·failover·shutdown·capacity change를 fault matrix와 runbook으로 검증합니다",
    lead: "pool은 정상 steady state뿐 아니라 DB down/slow/half-open, credential revoke, DNS/TLS failover와 rolling shutdown에서 bounded하게 실패·회복해야 합니다.",
    explanations: [
      "fault matrix는 DB process stop, network reject/blackhole, stale socket, DNS target change, TLS/auth failure, slow validation, maxLifetime turnover와 application shutdown을 포함합니다.",
      "각 fault에 detection time, pending bound, acquisition error, request shedding, physical eviction/recreation, time-to-recover와 duplicate/transaction outcome을 정의합니다.",
      "recovery 중 모든 callers가 동시에 reconnect/retry하지 않게 backoff/jitter/admission을 둡니다. DB warmup/replica promotion capacity보다 connection creation rate를 제한합니다.",
      "HikariDataSource close 뒤 new borrows는 실패하고 active transactions는 app drain deadline에 따라 commit/rollback되어야 합니다. force shutdown의 business effect를 reconciliation합니다.",
      "runbook은 pool/DB metric capture, long lease owner, safe soft eviction/restart, credential/DNS/TLS check, commit-unknown resolution과 staged recovery를 포함합니다.",
    ],
    concepts: [
      c("failure recovery SLO", "outage 감지부터 healthy borrow/transaction이 안정적으로 회복될 때까지 허용 시간과 error budget입니다.", ["fault 종류별 둡니다.", "pending/retry bound를 포함합니다."]),
      c("reconnect storm", "많은 instances/threads가 outage 후 동시에 physical connections를 만들며 DB를 다시 과부하하는 현상입니다.", ["jitter/rate limit을 둡니다.", "admission을 유지합니다."]),
      c("graceful pool shutdown", "new borrows를 차단하고 in-flight leases를 bounded drain한 뒤 pool resources를 close하는 lifecycle입니다.", ["readiness와 순서를 맞춥니다.", "force fallback을 둡니다."]),
    ],
    codeExamples: [javaExample("jdbc06-outage-shutdown", "outage timeout·recovery·shutdown state machine", "Jdbc06Recovery.java", "합성 pool이 DB down에서 timeout, up에서 acquire, close 뒤 borrow reject로 전이하는지 검증합니다.", String.raw`public class Jdbc06Recovery {
    static final class Pool implements AutoCloseable {
        boolean databaseUp = true;
        boolean closed;
        int active;
        int created;
        String borrow() {
            if (closed) return "closed";
            if (!databaseUp) return "timeout";
            active++;
            created++;
            return "acquired";
        }
        void release() { if (active > 0) active--; }
        @Override public void close() { closed = true; }
    }
    public static void main(String[] args) {
        Pool pool = new Pool();
        pool.databaseUp = false;
        System.out.println("outage=" + pool.borrow());
        pool.databaseUp = true;
        System.out.println("recovery=" + pool.borrow());
        pool.release();
        pool.close();
        System.out.println("shutdown=" + pool.borrow());
        System.out.println("active=" + pool.active);
        System.out.println("created=" + pool.created);
    }
}`, "outage=timeout\nrecovery=acquired\nshutdown=closed\nactive=0\ncreated=1", ["hikari-datasource-source", "hikari-mxbean-source", "hikari-faq", "hikari-dropwizard", "hikari-rapid-recovery", "spring-jdbc-core"])],
    diagnostics: [d("DB 복구 직후 connection creation과 retries가 몰려 다시 장애가 납니다.", "instances/threads가 동일 backoff 없이 동시에 reconnect하고 readiness가 warmup 전에 traffic을 열었습니다.", ["creation/retry rate", "DB recovery CPU/sessions", "instance readiness timeline", "backoff/jitter/admission"], "global DB budget과 per-instance creation/retry rate를 제한하고 canary validation 후 traffic을 단계적으로 엽니다.", "multi-instance outage/recovery load test에서 recovery SLO와 no-storm budget을 검증합니다.")],
    expertNotes: ["state-machine example은 Hikari 내부를 복제하지 않고 운영 transition의 allowed outcomes만 설명합니다.", "pool restart 전에 in-flight commit-unknown requests와 outbox를 reconciliation해 duplicate retry를 방지합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-jdbc-hikari", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/basic/JDBCHIKARI.java", usedFor: ["injected DataSource acquisition baseline and missing logical close"], evidence: "read-only 구조 감사에서 33 logical lines, DataSource2, getConnection1, plain try/catch1, close0을 확인했습니다. context path·values는 복사하지 않았습니다." },
  { id: "local-root-context", repository: "SPRING/SpringBasic", path: "src/main/webapp/WEB-INF/config/root-context.xml", usedFor: ["HikariConfig/HikariDataSource shared wiring and external property names"], evidence: "read-only 구조 감사에서 41 logical lines, beans5와 HikariConfig·HikariDataSource·JdbcTemplate·SqlSessionFactory shared DataSource wiring을 확인했습니다. JDBC URL·host·username·password values는 복사하지 않았습니다." },
  { id: "hikari-readme", repository: "HikariCP", path: "README configuration", publicUrl: "https://github.com/brettwooldridge/HikariCP", usedFor: ["configuration properties, defaults, timing and lifecycle"], evidence: "HikariCP 공식 repository 문서입니다." },
  { id: "hikari-pool-sizing", repository: "HikariCP Wiki", path: "About Pool Sizing", publicUrl: "https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing", usedFor: ["small-pool rationale, workload sizing and pool-locking"], evidence: "HikariCP 공식 sizing guide입니다." },
  { id: "hikari-rapid-recovery", repository: "HikariCP Wiki", path: "Rapid Recovery", publicUrl: "https://github.com/brettwooldridge/HikariCP/wiki/Rapid-Recovery", usedFor: ["driver/network timeout, keepalive and outage recovery"], evidence: "HikariCP 공식 recovery guide입니다." },
  { id: "hikari-faq", repository: "HikariCP Wiki", path: "FAQ", publicUrl: "https://github.com/brettwooldridge/HikariCP/wiki/FAQ", usedFor: ["common lifecycle and database configuration boundaries"], evidence: "HikariCP 공식 FAQ입니다." },
  { id: "hikari-config-source", repository: "HikariCP", path: "HikariConfig.java", publicUrl: "https://github.com/brettwooldridge/HikariCP/blob/dev/src/main/java/com/zaxxer/hikari/HikariConfig.java", usedFor: ["configuration validation and documented runtime properties"], evidence: "HikariCP 공식 source입니다." },
  { id: "hikari-datasource-source", repository: "HikariCP", path: "HikariDataSource.java", publicUrl: "https://github.com/brettwooldridge/HikariCP/blob/dev/src/main/java/com/zaxxer/hikari/HikariDataSource.java", usedFor: ["DataSource acquisition and close lifecycle"], evidence: "HikariCP 공식 source입니다." },
  { id: "hikari-mxbean-source", repository: "HikariCP", path: "HikariPoolMXBean.java", publicUrl: "https://github.com/brettwooldridge/HikariCP/blob/dev/src/main/java/com/zaxxer/hikari/HikariPoolMXBean.java", usedFor: ["active/idle/total/pending metrics and management boundary"], evidence: "HikariCP 공식 source입니다." },
  { id: "hikari-dropwizard", repository: "HikariCP Wiki", path: "Dropwizard Metrics", publicUrl: "https://github.com/brettwooldridge/HikariCP/wiki/Dropwizard-Metrics", usedFor: ["pool metric instrumentation"], evidence: "HikariCP 공식 metrics guide입니다." },
  { id: "spring-jdbc-connections", repository: "Spring Framework Reference", path: "Controlling Database Connections", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/jdbc/connections.html", usedFor: ["DataSource, SmartDataSource and transaction-aware connection access"], evidence: "Spring Framework 공식 JDBC connection 문서입니다." },
  { id: "spring-jdbc-core", repository: "Spring Framework Reference", path: "Using the JDBC Core Classes", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/jdbc/core.html", usedFor: ["JdbcTemplate DataSource/resource ownership"], evidence: "Spring Framework 공식 JdbcTemplate 문서입니다." },
  { id: "jdk-datasource", repository: "Java SE 21 API", path: "DataSource", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html", usedFor: ["connection factory/pooling contract"], evidence: "Java SE 21 공식 DataSource API입니다." },
  { id: "jdk-connection", repository: "Java SE 21 API", path: "Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["logical close, validity and session state"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-transient-connection", repository: "Java SE 21 API", path: "SQLTransientConnectionException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLTransientConnectionException.html", usedFor: ["acquisition timeout/failure classification"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-semaphore", repository: "Java SE 21 API", path: "Semaphore", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Semaphore.html", usedFor: ["deterministic bounded-slot harness"], evidence: "Java SE 21 공식 concurrency API입니다." },
  { id: "mysql-driver-properties", repository: "MySQL Connector/J Developer Guide", path: "Driver/Datasource Class Configuration Properties", publicUrl: "https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html", usedFor: ["connect/socket/keepalive driver settings"], evidence: "MySQL Connector/J 공식 configuration 문서입니다." },
  { id: "oracle-jdbc-troubleshooting", repository: "Oracle AI Database 26ai JDBC Developer's Guide", path: "Troubleshooting", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/JDBC-troubleshooting.html", usedFor: ["network adapter/timeout diagnosis boundary"], evidence: "Oracle 공식 JDBC troubleshooting 문서입니다." },
  { id: "pgjdbc-use", repository: "PostgreSQL JDBC Driver", path: "Setting up the JDBC Driver", publicUrl: "https://jdbc.postgresql.org/documentation/use/", usedFor: ["pgJDBC connection URL/properties, timeouts and SSL boundary"], evidence: "PostgreSQL JDBC 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "jdbc-06-hikari-pool", slug: "jdbc-06-hikari-pool", courseId: "spring", moduleId: "jdbc-foundations", order: 6,
  title: "HikariCP 커넥션 풀과 고갈 진단", subtitle: "logical lease에서 sizing·pending·leak·lifetime·validation·metrics·credential rotation·outage recovery까지 운영합니다.", level: "고급", estimatedMinutes: 940,
  coreQuestion: "제한된 physical DB connections를 여러 instances/requests가 안전하게 공유하면서 leak·slow DB·outage·rotation·shutdown에서도 pool 고갈을 빠르게 분류하고 bounded하게 회복하려면 무엇을 측정하고 고정해야 할까요?",
  summary: "SpringBasic JDBCHIKARI.java와 root-context.xml을 read-only로 구조 감사해 injected DataSource/Hikari wiring·JdbcTemplate/MyBatis sharing과 logical close gap을 민감값 없이 provenance로 사용합니다. physical/logical connection, DB-budget sizing, acquisition backpressure, lease/leak, maxLifetime/idle/keepalive, validation/rapid recovery, transaction/session reset, metrics/health, credential rotation/shutdown과 outage governance를 고급 수준으로 연결합니다. 다섯 exact JDK 21 examples는 sizing, acquisition timeout, lease ownership, lifetime/validation과 outage/shutdown state를 compile/run하며 실제 Hikari/driver behavior는 공식 docs와 fault integration으로 분리합니다.",
  objectives: ["physical connection·logical lease·DataSource owner를 구분한다.", "DB budget·hold time·instances·load test로 pool size를 결정한다.", "connectionTimeout·pending·backpressure와 request deadline을 정렬한다.", "try-with-resources와 leak detection으로 ownership을 검증한다.", "maxLifetime·idleTimeout·keepalive·validation을 infrastructure timeout과 맞춘다.", "transaction/session state reset과 fatal eviction을 검증한다.", "active/idle/pending/total·acquire/usage와 DB evidence로 고갈 원인을 분류한다.", "credential rotation·graceful shutdown·outage/reconnect runbook을 운영한다."],
  prerequisites: [{ title: "JDBC 수동 트랜잭션과 원자적 서비스", reason: "pooled Connection 반환 전 commit/rollback·state reset과 lease ownership을 안전하게 완료합니다.", sessionSlug: "jdbc-05-manual-transaction" }],
  keywords: ["HikariCP", "HikariDataSource", "connection pool", "maximumPoolSize", "connectionTimeout", "minimumIdle", "maxLifetime", "idleTimeout", "keepaliveTime", "leakDetectionThreshold", "pool exhaustion", "active", "pending", "validation", "rapid recovery", "credential rotation"], topics,
  lab: {
    title: "Spring JDBC/MyBatis 공유 Hikari pool을 capacity·failure·security까지 운영하기",
    scenario: "여러 application instances가 하나의 DB budget을 공유하고 short requests와 batch가 섞입니다. connection leak, slow query/locks, DB/network outage, credential rotation과 rolling shutdown이 발생합니다.",
    setup: ["local XML/Java는 read-only provenance로만 사용하고 actual URL/host/user/password를 복사하지 않습니다.", "지원 Hikari/driver/Spring versions와 ephemeral MySQL/Oracle, network fault proxy를 준비합니다.", "DB total reserve·max instances·workload arrival/hold/deadline과 pool budget을 작성합니다.", "leak/slow DB/blackhole/stale socket/failover/rotation/shutdown failure matrix를 만듭니다."],
    steps: ["DataSource/HikariConfig/JdbcTemplate/MyBatis가 하나의 lifecycle owner를 공유하는지 확인합니다.", "borrow→transaction→close에서 logical/physical identity와 active/idle transition을 readback합니다.", "sizes 주변 load test로 TPS/p99/DB waits/pending/hold를 비교합니다.", "maximum saturation에서 bounded acquisition timeout/backpressure를 검증합니다.", "각 exception/cancel/async path에서 leak candidate와 active baseline을 확인합니다.", "maxLifetime/idle/keepalive를 DB/firewall timeout보다 안전하게 정렬합니다.", "DB stop/blackhole/failover에서 validation·eviction·reconnect/recovery SLO를 측정합니다.", "same physical connection 재사용에서 transaction/schema/role/context reset을 검증합니다.", "active/idle/pending/total·acquire/usage와 DB sessions/waits를 correlation합니다.", "new credential canary→old pool drain→revoke와 traffic drain→DataSource.close runbook을 실행합니다."],
    expectedResult: ["모든 leases가 bounded scope에서 반환되고 pool/server resources가 baseline으로 복귀합니다.", "pool size 합계가 DB budget 안에서 workload throughput/tail 목표를 만족합니다.", "고갈 원인이 leak·long transaction·DB waits·outage·traffic으로 evidence 기반 분류됩니다.", "outage/failover/rotation/shutdown이 reconnect storm·state leakage·credential 노출 없이 회복됩니다.", "metrics/alerts/runbook이 high-cardinality DB values 없이 운영됩니다."],
    cleanup: ["traffic을 차단하고 in-flight leases/transactions를 bounded drain한 뒤 DataSource를 close합니다.", "ephemeral DB/fault proxy/synthetic metrics와 restricted diagnostics를 제거합니다.", "temporary credentials를 revoke하고 old physical sessions가 0인지 확인합니다.", "production과 local source files/data는 변경하지 않습니다."],
    extensions: ["read/write 또는 batch/request pools 분리의 total budget과 routing을 검증합니다.", "Spring Boot Hikari auto-configuration/property binding과 XML lifecycle을 비교합니다.", "multi-region proxy/failover의 DNS/TLS/role validation을 자동화합니다.", "adaptive admission control을 pool pending+DB waits 신호로 설계하되 pool size 자동 진동을 방지합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 JDK 21 examples를 compile/run하고 pool state transition을 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "DB budget/per-instance/average demand를 계산합니다.", "active/pending/acquisition timeout을 추적합니다.", "try scope와 leak candidate active를 비교합니다.", "expired/invalid retirement를 구분합니다.", "outage→recovery→shutdown outcomes를 설명합니다."], hints: ["Connection 객체 수보다 lease owner와 active/pending/physical lifecycle을 먼저 보세요."], expectedOutcome: "pool을 단순 설정 bean이 아니라 bounded resource state machine으로 설명합니다.", solutionOutline: ["budget→borrow→hold→return→retire→recover→close 순서입니다."] },
    { difficulty: "응용", prompt: "local Hikari wiring을 production-safe shared DataSource로 확장하세요.", requirements: ["local 구조 계수와 민감값 미복사를 기록합니다.", "모든 getConnection paths를 try-with-resources로 닫습니다.", "DB budget/instances/load로 size를 검증합니다.", "acquisition/leak/hold/DB waits metrics를 연결합니다.", "lifetime/keepalive/validation/network timeouts를 정렬합니다.", "session reset/fatal eviction을 검증합니다.", "credential rotation/shutdown을 구현합니다.", "outage/recovery fault matrix와 runbook을 둡니다."], hints: ["pool을 키우기 전에 hold time과 DB wait root cause를 분류하세요."], expectedOutcome: "성능·격리·보안·복구가 검증된 Hikari lifecycle이 완성됩니다.", solutionOutline: ["audit→budget→ownership→timers→metrics→faults→rotate/drain 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JDBC pool governance 표준을 작성하세요.", requirements: ["DataSource/physical/logical owner를 정의합니다.", "DB budget/autoscaling/sizing load gate를 둡니다.", "acquisition/backpressure/deadline rules를 둡니다.", "lease/leak/async confinement을 정의합니다.", "lifetime/idle/keepalive/validation/network matrix를 둡니다.", "session reset/eviction을 요구합니다.", "metrics/privacy/alerts/signature runbook을 정의합니다.", "credentials/rotation/outage/shutdown/recovery SLO를 포함합니다."], hints: ["active=max는 조치가 아니라 diagnosis를 시작할 신호입니다."], expectedOutcome: "초급 DataSource부터 production recovery까지 일관된 pool 고급 gate가 완성됩니다.", solutionOutline: ["own→budget→bound→return→refresh→observe→recover→retire 순서입니다."] },
  ],
  nextSessions: ["jdbc-07-jdbctemplate-rowmapper"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["JDBCHIKARI.java 33 logical lines/952 bytes를 read-only로 감사해 injected DataSource, getConnection1, plain try/catch1, close0을 확인했습니다.", "root-context.xml 41 logical lines/2,564 bytes를 read-only로 감사해 beans5와 HikariConfig/HikariDataSource/JdbcTemplate/SqlSessionFactory shared DataSource wiring 및 property names만 확인했습니다.", "원본 JDBC URL·host·username·password·context values·Java/XML code는 복사하지 않고 wiring shape와 explicit ownership gap만 provenance로 사용했습니다.", "JDK synthetic models는 actual Hikari ConcurrentBag/housekeeper/timer, JDBC driver validation/network recovery, Spring lifecycle과 physical DB session behavior를 대체하지 않습니다."] },
});

export default session;
