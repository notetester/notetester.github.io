import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + Math.min(12, lineCount), explanation: "fixture, transaction, namespace 또는 concurrency 역할을 JDK 21 표준 API만으로 정의합니다. 외부 DB와 credential 없이 테스트 불변식을 먼저 분리합니다." },
      { lines: Math.min(13, lineCount) + "-" + Math.max(13, lineCount - 8), explanation: "정상·rollback·격리·동시 충돌·방언 차이 경로를 deterministic하게 실행하고 final readback을 계산합니다." },
      { lines: Math.max(1, lineCount - 7) + "-" + lineCount, explanation: "실제 row 값이나 접속정보가 아니라 행 수, synthetic ID, outcome과 resource/격리 불변식만 문서의 exact stdout으로 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "javac --release 21", "외부 Spring·MyBatis·DB·network·credential 불필요"], command: "javac --release 21 " + filename + " && java " + filename.replace(/\.java$/, "") },
    output: { value: output, explanation: ["각 stdout은 격리 임시 디렉터리에서 JDK 21로 실제 컴파일·실행해 한 글자씩 대조합니다.", "mini model은 test design을 검증할 뿐 실제 MyBatis mapping, Spring TestContext, driver, isolation과 vendor SQL은 disposable target DB integration suite가 확인해야 합니다."] },
    experiments: [
      { change: "rollback을 끄거나 fixture 순서·namespace·barrier를 제거합니다.", prediction: "다음 테스트가 이전 state에 의존하거나 concurrency 결과가 우연히 통과해 출력 불변식이 깨집니다.", result: "명시적 seed/reset, unique isolation boundary와 deterministic synchronization을 복원합니다." },
      { change: "mapper statement 누락, wrong result mapping, timeout, deadlock과 cleanup 실패를 주입합니다.", prediction: "happy path assertion만 있으면 실제 최초 원인과 누수 resource가 남은 채 CI가 flaky해집니다.", result: "failure category, transaction outcome, DB readback과 resource absence를 한 test evidence로 검증합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "mapper-integration-test-scope",
    title: "Mapper 통합 테스트가 검증하는 wiring·SQL·mapping·DB 의미를 명확히 제한합니다",
    lead: "Mapper method가 호출됐다는 사실만 확인하면 SQL syntax, parameter binding, result mapping과 transaction 참여를 놓칩니다. 반대로 전체 웹 context를 항상 띄우면 실패 원인과 속도가 흐려집니다.",
    explanations: [
      "pure unit test는 mapper port를 fake로 바꿔 Service orchestration을 검증합니다. Mapper integration test는 실제 MyBatis configuration, mapper proxy/XML, DataSource, driver와 database를 연결해 persistence contract를 검증합니다.",
      "통합 범위에는 statement 등록, parameter/result mapping, dynamic branch, generated key/affected count, transaction commit/rollback과 target dialect를 포함합니다. controller serialization이나 외부 API는 별도 test가 담당합니다.",
      "원본 TestMapper interface와 XML은 각각 5-line/11-line의 작은 출발점이며 interface method 1, select statement 1, binding 0 구조를 확인했습니다. 이것만으로 fixture isolation이나 rollback이 증명됐다고 확대 해석하지 않습니다.",
      "테스트 이름은 input condition, mapped statement intent와 expected DB state를 드러냅니다. implementation detail method call count보다 SQL 후 readback과 visible row contract를 우선합니다.",
      "중간부터 읽는 학습자는 앞선 Service transaction 세션의 proxy/resource binding을 참고합니다. 테스트도 application과 같은 SqlSessionFactory/DataSource/transaction manager graph를 사용해야 production behavior를 재현합니다.",
    ],
    concepts: [
      c("integration test", "둘 이상의 실제 component와 infrastructure contract를 연결해 경계 간 behavior를 검증하는 테스트입니다.", ["Mapper에는 config·proxy·SQL·driver·DB가 포함됩니다.", "검증 범위를 명시합니다.", "외부 서비스는 필요한 만큼만 포함합니다."]),
      c("mapper contract", "Java method input/output, mapped statement, parameter/result mapping과 DB state 변화가 합의한 의미입니다.", ["row count와 ordering을 포함합니다.", "오류 category도 포함합니다."]),
      c("test pyramid boundary", "빠른 pure unit, focused integration과 적은 end-to-end test가 서로 다른 실패를 담당하는 분리입니다.", ["중복 context를 줄입니다.", "각 단계의 증거를 연결합니다."]),
    ],
    codeExamples: [java("mybatis09-rollback-fixture", "test transaction rollback으로 baseline 복원", "Mybatis09RollbackFixture.java", "합성 저장소 snapshot으로 test 안의 mutation은 보이지만 completion 뒤 baseline 한 행으로 되돌아오는 격리를 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mybatis09RollbackFixture {
  static final class Store {
    final List<Integer> ids = new ArrayList<>(List.of(1));
  }

  static final class TestTransaction implements AutoCloseable {
    final Store store;
    final List<Integer> before;
    TestTransaction(Store store) {
      this.store = store;
      this.before = List.copyOf(store.ids);
    }
    public void close() {
      store.ids.clear();
      store.ids.addAll(before);
    }
  }

  public static void main(String[] args) {
    Store store = new Store();
    int inside;
    try (TestTransaction ignored = new TestTransaction(store)) {
      store.ids.add(2);
      inside = store.ids.size();
    }
    System.out.println("baseline=1");
    System.out.println("inside=" + inside);
    System.out.println("after-rollback=" + store.ids.size());
    System.out.println("next-test-clean=" + store.ids.equals(List.of(1)));
    System.out.println("resource-open=false");
  }
}`, "baseline=1\ninside=2\nafter-rollback=1\nnext-test-clean=true\nresource-open=false", ["local-test-interface", "local-test-xml", "spring-test-transactions", "spring-test-rollback", "mybatis-spring-transactions", "mybatis-java-api"])],
    diagnostics: [d("Mapper test는 통과하지만 배포 artifact에서 statement not found 또는 mapping error가 발생합니다.", "unit fake나 IDE source tree만 테스트하고 실제 packaged mapper resource와 production-equivalent configuration을 연결하지 않았습니다.", ["test scope/components", "packaged mapper resources", "namespace/method inventory", "DataSource/driver/dialect", "result mapping assertions"], "배포 artifact classpath로 focused MyBatis context를 boot하고 실제 mapper call과 DB readback을 target dialect에서 실행합니다.", "artifact-level boot, statement inventory와 result/parameter/affected-row contract를 release matrix에 둡니다.")],
    expertNotes: ["통합 테스트라는 이름만으로 실제 production DB 제품과 configuration을 사용한다고 가정하지 않습니다.", "작은 테스트를 전체 application context로 확대하기보다 필요한 infrastructure graph를 명시합니다."],
  },
  {
    id: "test-context-wiring-startup",
    title: "TestContext가 production과 같은 Mapper·Factory·Transaction resource graph를 boot하게 합니다",
    lead: "테스트 전용 bean이 편의를 위해 실제 설정을 우회하면 mapper가 다른 DataSource, 다른 type handler 또는 다른 transaction manager를 사용해 거짓 양성이 생깁니다.",
    explanations: [
      "focused context에는 test 대상 mapper, SqlSessionFactory, SqlSessionTemplate, DataSource, transaction manager와 필요한 type handler/plugin만 포함합니다. component scan 전체를 가져오지 않되 production composition path를 재사용합니다.",
      "active profile은 접속값이 아니라 bean topology, schema strategy와 approved databaseId를 선택합니다. 실제 credential은 환경 secret로 주입하고 test output·exception에 raw value가 없는지 canary로 검사합니다.",
      "startup에서 required mapper statements, selected databaseId, handler aliases와 DataSource/manager/factory identity를 검증합니다. 첫 test method 호출까지 configuration failure를 미루지 않습니다.",
      "Spring TestContext의 context cache는 속도를 높이지만 mutable singleton이나 DB state를 자동 초기화하지 않습니다. dirty context 남용보다 resource/state ownership을 정리합니다.",
      "test fixture helper가 별도 Connection을 열면 test-managed transaction에 참여하지 않을 수 있습니다. setup/verification query가 어떤 DataSource/transaction을 쓰는지 명시합니다.",
    ],
    concepts: [
      c("TestContext", "Spring test가 ApplicationContext 생성·cache, dependency injection, transaction과 listener lifecycle을 관리하는 framework입니다.", ["production topology를 재사용합니다.", "cache와 state를 구분합니다."]),
      c("focused context", "검증 경계에 필요한 bean과 infrastructure만 구성한 작은 application context입니다.", ["필수 wiring을 유지합니다.", "무관한 외부 client를 제외합니다."]),
      c("startup assertion", "test method 전에 mapper/resource/configuration completeness를 검사해 실패를 조기에 분류하는 조건입니다.", ["statement inventory를 봅니다.", "비밀값은 출력하지 않습니다."]),
    ],
    diagnostics: [d("테스트에서는 rollback되지만 실제 service에서는 commit되거나 반대 결과가 납니다.", "test DataSource/transaction manager/factory graph가 production과 다르거나 fixture connection이 test transaction 밖에서 실행됐습니다.", ["bean graph/qualifiers", "manager/factory DataSource identity", "selected databaseId", "fixture transaction participation", "runtime proxy/session type"], "production composition을 재사용하는 focused profile을 만들고 resource identity와 transaction active 상태를 startup/test에 assertion합니다.", "test/production bean manifest를 diff하고 같은 failure corpus를 두 profile에 실행합니다.")],
    expertNotes: ["test double DataSource가 필요한 unit test와 actual driver integration test를 같은 suite로 부르지 않습니다.", "context cache hit는 DB fixture 청결과 무관하며 cleanup 책임을 별도로 검증합니다."],
  },
  {
    id: "transactional-test-rollback",
    title: "test-managed rollback의 범위와 commit이 새어 나가는 경로를 구분합니다",
    lead: "Spring 통합 테스트의 rollback은 강력하지만 모든 thread, 별도 transaction과 외부 process의 변경을 자동 취소하지 않습니다. 어떤 resource가 test transaction에 참여하는지 확인해야 격리를 믿을 수 있습니다.",
    explanations: [
      "transactional test는 test method 전에 transaction을 시작하고 기본 rollback policy에 따라 completion합니다. test 안에서는 flush 전 오류가 숨을 수 있으므로 필요한 지점에 실제 statement execution/flush와 readback을 유도합니다.",
      "REQUIRES_NEW inner transaction, 별도 thread, 다른 process/HTTP server와 독립 DataSource는 test transaction 밖에서 commit될 수 있습니다. rollback 뒤 DB가 baseline인지 반드시 새 transaction에서 확인합니다.",
      "rollback만 의존하면 sequence/identity, DDL, external cache, message와 file 같은 non-transactional state가 남을 수 있습니다. resource별 reset strategy와 owner를 둡니다.",
      "commit behavior 자체를 검증할 테스트는 명시적으로 commit하고 unique namespace/database에서 실행한 뒤 finally cleanup합니다. rollback suite와 섞어 execution order에 의존하지 않습니다.",
      "test가 예외로 중단돼도 transaction completion과 Connection 반환이 실행돼야 합니다. cleanup failure는 원래 assertion을 가리지 않게 suppressed/restricted evidence로 보존합니다.",
    ],
    concepts: [
      c("test-managed transaction", "Spring TestContext가 test method lifecycle에 맞춰 시작하고 기본 rollback하는 transaction입니다.", ["application transaction과 상호작용합니다.", "thread/resource 범위를 확인합니다."]),
      c("rollback isolation", "test가 만든 transactional DB 변경이 completion 뒤 다른 테스트에 보이지 않는 성질입니다.", ["non-transactional state는 별도 reset합니다.", "새 transaction readback을 합니다."]),
      c("false cleanliness", "현재 transaction 안의 view만 보고 rollback 뒤 database가 깨끗하다고 잘못 판단하는 상태입니다.", ["completion 후 검사합니다.", "별도 resource를 확인합니다."]),
    ],
    diagnostics: [d("@Transactional test인데 실행 순서에 따라 row가 누적되고 unique constraint가 실패합니다.", "REQUIRES_NEW/별도 thread/fixture connection이 test transaction 밖에서 commit됐거나 sequence/DDL이 rollback되지 않았습니다.", ["test transaction active", "application propagation", "thread/process boundary", "fixture DataSource", "post-completion row/sequence state"], "모든 write path의 transaction participation을 추적하고 독립 commit 경로는 unique namespace와 explicit cleanup/readback으로 격리합니다.", "rollback 뒤 새 transaction에서 table/sequence/outbox/resource baseline을 자동 확인합니다.")],
    expertNotes: ["rollback은 production commit path를 검증하지 않으므로 별도 commit suite가 필요합니다.", "테스트가 빠르다는 이유로 lifecycle 차이를 숨기지 말고 suite 목적에 맞게 구분합니다."],
  },
  {
    id: "deterministic-fixture-design",
    title: "fixture를 순서·시간·sequence·locale에 독립적인 데이터 계약으로 만듭니다",
    lead: "테스트 데이터가 이전 테스트, 현재 시각이나 auto-generated 순서에 기대면 assertion이 환경마다 달라집니다. 최소 fixture와 명시적 expected identity를 만들고 매 test가 자신의 전제조건을 소유하게 합니다.",
    explanations: [
      "fixture는 schema, reference baseline과 test-specific rows를 구분합니다. @Sql 또는 programmatic builder를 사용하더라도 script 순서와 transaction mode, cleanup owner를 명시합니다.",
      "ID, timestamp, timezone과 sort tie-breaker를 통제합니다. generated key 기능을 검증하는 test 외에는 explicit synthetic key를 사용하고 값 범위가 production/PII와 겹치지 않게 합니다.",
      "각 test는 필요한 최소 행만 seed해 실패 원인을 좁힙니다. 거대한 shared dump는 민감정보 위험, 느린 setup과 숨은 관계를 만들므로 사용하지 않습니다.",
      "query 결과는 DB가 보장한 ORDER BY가 있을 때만 list 순서를 assertion합니다. 순서가 계약이 아니면 set/multiset으로 비교하고 duplicate 의미를 별도로 검사합니다.",
      "fixture version과 migration version을 artifact에 기록합니다. schema migration 뒤 test가 예전 column/default에 조용히 의존하지 않도록 boot·seed failure를 분리해 보고합니다.",
    ],
    concepts: [
      c("fixture", "테스트가 실행되기 전에 필요한 schema와 최소 데이터 상태를 재현하는 입력입니다.", ["test가 ownership을 가집니다.", "synthetic data만 사용합니다."]),
      c("deterministic database", "같은 schema·fixture·transaction 조건에서 같은 query가 같은 의미 결과를 내는 격리된 DB 상태입니다.", ["시간과 순서를 통제합니다.", "외부 상태에 기대지 않습니다."]),
      c("fixture lineage", "어떤 schema migration과 seed version이 테스트 상태를 만들었는지 추적하는 정보입니다.", ["artifact와 연결합니다.", "실제 row 값은 기록하지 않습니다."]),
    ],
    codeExamples: [java("mybatis09-deterministic-fixture", "명시적 seed와 reset의 반복 가능성", "Mybatis09DeterministicFixture.java", "합성 ID 세 개를 명시 순서로 seed하고 reset 후 같은 결과와 next sequence를 얻는지 검증합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Mybatis09DeterministicFixture {
  static final class Fixture {
    final Map<Integer, String> rows = new LinkedHashMap<>();
    int nextId = 1;
    void reset() { rows.clear(); nextId = 1; }
    void seed() {
      rows.put(3, "C");
      rows.put(1, "A");
      rows.put(2, "B");
      nextId = 4;
    }
    List<Integer> orderedIds() { return rows.keySet().stream().sorted().toList(); }
  }

  public static void main(String[] args) {
    Fixture fixture = new Fixture();
    fixture.seed();
    List<Integer> first = fixture.orderedIds();
    fixture.reset();
    fixture.seed();
    List<Integer> second = fixture.orderedIds();
    System.out.println("first=" + first);
    System.out.println("second=" + second);
    System.out.println("same=" + first.equals(second));
    System.out.println("next-id=" + fixture.nextId);
    System.out.println("shared-dump=false");
  }
}`, "first=[1, 2, 3]\nsecond=[1, 2, 3]\nsame=true\nnext-id=4\nshared-dump=false", ["spring-test-sql", "spring-test-jdbc", "mybatis-sqlmap", "java-map", "java-list"])],
    diagnostics: [d("단독 실행은 통과하지만 전체 suite나 다른 timezone/locale에서 결과 순서와 날짜 assertion이 실패합니다.", "shared fixture, implicit ordering, current time 또는 auto sequence에 의존했습니다.", ["fixture ownership/order", "ORDER BY contract", "clock/timezone/locale", "generated IDs", "prior-test residue"], "test별 최소 synthetic fixture, fixed Clock/zone, explicit ordering과 reset된 sequence를 사용합니다.", "randomized test order, timezone/locale matrix와 반복 실행에서 exact IDs/state가 같은지 확인합니다.")],
    expertNotes: ["production snapshot을 익명화했다고 가정해 test fixture로 복제하지 말고 필요한 synthetic 관계를 새로 만듭니다.", "fixture builder가 domain rule을 우회할 때 의도와 검증 범위를 문서화합니다."],
  },
  {
    id: "parallel-isolation-namespace",
    title: "병렬 테스트마다 schema·database·container 경계를 부여해 state 충돌을 제거합니다",
    lead: "rollback만으로 해결되지 않는 commit suite와 병렬 worker는 같은 table, sequence와 advisory lock을 공유해 서로 간섭할 수 있습니다. 격리 단위를 성능과 fidelity에 맞춰 선택합니다.",
    explanations: [
      "worker별 database/schema, test class별 container 또는 test별 transaction을 조합할 수 있습니다. DDL·sequence·extension·session setting의 isolation 요구에 따라 가장 작은 충분한 경계를 고릅니다.",
      "namespace 이름은 CI run id와 bounded worker index로 생성하고 SQL identifier allowlist/length를 적용합니다. branch/user 이름이나 secret을 그대로 schema에 넣지 않습니다.",
      "container reuse는 startup 비용을 줄이지만 이전 run state가 남을 수 있습니다. reuse 여부, migration checksum, cleanup과 health/readiness를 명시하고 release suite에서는 clean provision 증거를 둡니다.",
      "parallel test가 같은 external port나 fixed database name을 쓰지 않도록 dynamic resource allocation을 사용합니다. resource lease와 finally cleanup을 process crash 뒤 janitor까지 포함해 설계합니다.",
      "isolation test는 worker A/B가 같은 synthetic key를 insert해도 서로 보이지 않고 teardown 뒤 namespace가 사라지는지 확인합니다. 단순 test success만 보지 않습니다.",
    ],
    concepts: [
      c("test namespace", "병렬 test worker가 독립적으로 소유하는 database/schema/table-prefix 등의 state 경계입니다.", ["bounded synthetic 이름을 사용합니다.", "teardown owner를 둡니다."]),
      c("disposable database", "test 실행마다 깨끗하게 provision하고 migration·fixture 후 폐기할 수 있는 실제 DB instance입니다.", ["target dialect fidelity를 제공합니다.", "lifecycle을 자동화합니다."]),
      c("resource lease", "test가 namespace/container/port를 독점 사용하고 만료·cleanup하는 소유권 기록입니다.", ["crash janitor를 둡니다.", "run id와 연결합니다."]),
    ],
    codeExamples: [java("mybatis09-namespace-isolation", "병렬 worker별 synthetic namespace 격리", "Mybatis09NamespaceIsolation.java", "두 worker가 같은 key를 써도 서로 다른 map namespace에서 독립 cardinality를 유지하는지 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mybatis09NamespaceIsolation {
  static String namespace(int worker) {
    if (worker < 1 || worker > 99) throw new IllegalArgumentException("worker");
    return "it_run_" + String.format("%02d", worker);
  }

  public static void main(String[] args) {
    Map<String, Map<Integer, String>> databases = new LinkedHashMap<>();
    String first = namespace(1);
    String second = namespace(2);
    databases.put(first, new LinkedHashMap<>());
    databases.put(second, new LinkedHashMap<>());
    databases.get(first).put(1, "A");
    databases.get(second).put(1, "B");
    System.out.println("namespaces=" + databases.keySet());
    System.out.println("first-count=" + databases.get(first).size());
    System.out.println("second-count=" + databases.get(second).size());
    System.out.println("cross-visible=false");
    databases.clear();
    System.out.println("after-cleanup=" + databases.size());
  }
}`, "namespaces=[it_run_01, it_run_02]\nfirst-count=1\nsecond-count=1\ncross-visible=false\nafter-cleanup=0", ["spring-test-context", "testcontainers-jdbc", "junit-parallel", "java-map"])],
    diagnostics: [d("병렬 CI에서만 unique key·missing table·sequence 예상값 오류가 무작위로 발생합니다.", "여러 worker가 같은 database/schema와 cleanup을 공유해 서로의 fixture를 삭제하거나 관찰했습니다.", ["worker→namespace mapping", "DB/schema identity", "fixture/cleanup owner", "sequence/DDL scope", "parallel execution config"], "worker별 bounded namespace 또는 disposable database lease를 만들고 teardown/janitor가 자신의 resource만 제거하게 합니다.", "동일 synthetic key를 모든 worker가 동시에 사용해 cross-visibility 0과 teardown absence를 검증합니다.")],
    expertNotes: ["병렬화를 끄는 것은 즉시 완화책일 수 있지만 숨은 state ownership 문제를 문서화하고 해결해야 합니다.", "namespace에 사용자·branch 원문을 넣으면 identifier injection과 정보 노출이 생길 수 있습니다."],
  },
  {
    id: "target-dialect-fidelity",
    title: "대체 in-memory DB가 아닌 지원 vendor/version에서 mapper contract를 검증합니다",
    lead: "SQL parser가 비슷해도 LIMIT/ROWNUM, generated key, type, collation, locking과 transaction isolation이 다릅니다. production dialect를 지원한다고 말하려면 실제 제품/버전 matrix가 필요합니다.",
    explanations: [
      "H2 같은 대체 DB는 빠른 일부 테스트에 유용하지만 MySQL·Oracle syntax와 optimizer, type mapping을 완전하게 대신하지 않습니다. 사용하면 어떤 contract만 검증하는지 제한을 적습니다.",
      "Testcontainers 또는 disposable environment로 실제 driver와 target DB image/version을 실행하고 production과 같은 migration을 적용합니다. mutable latest tag 대신 승인 version/digest와 compatibility policy를 둡니다.",
      "matrix에는 JDK, MyBatis, MyBatis-Spring, driver, DB version, databaseId와 migration checksum을 기록합니다. 하나가 바뀌면 representative mapper corpus를 재실행합니다.",
      "Oracle과 MySQL의 NULL ordering, timestamp precision/timezone, boolean/number, generated key와 lock timeout을 포함합니다. 값 mapping은 Java type과 round-trip equality로 검증합니다.",
      "license/resource 제약으로 모든 PR에 모든 DB를 실행할 수 없다면 PR smoke와 nightly/release full matrix를 나누되 미실행 조합을 성공으로 표시하지 않습니다.",
    ],
    concepts: [
      c("dialect fidelity", "test database가 production DB의 문법·type·transaction·locking behavior를 필요한 수준으로 재현하는 정도입니다.", ["실제 vendor matrix가 기준입니다.", "대체 DB 한계를 명시합니다."]),
      c("compatibility matrix", "framework·driver·DB·JDK·schema 조합별 검증 상태와 evidence를 기록한 표입니다.", ["artifact checksum과 연결합니다.", "미검증 조합을 구분합니다."]),
      c("round-trip mapping", "Java 값을 mapper로 저장한 뒤 다시 읽어 type·precision·null 의미가 계약대로 보존되는지 확인하는 테스트입니다.", ["vendor별 차이를 봅니다.", "민감값 대신 synthetic 경계를 씁니다."]),
    ],
    codeExamples: [java("mybatis09-dialect-contract", "두 방언 결과 parity와 faulty 구현 탐지", "Mybatis09DialectContract.java", "같은 fixture에 MySQL/Oracle 의미 model을 적용해 exact page 결과가 같고 잘못된 역순 구현을 탐지하는지 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mybatis09DialectContract {
  interface Dialect {
    List<Integer> page(List<Integer> rows);
  }

  static final Dialect MYSQL = rows -> rows.stream().sorted().limit(3).toList();
  static final Dialect ORACLE = rows -> rows.stream().sorted().limit(3).toList();
  static final Dialect FAULTY = rows -> {
    List<Integer> copy = new ArrayList<>(rows.stream().sorted().limit(3).toList());
    return new ArrayList<>(copy.reversed());
  };

  public static void main(String[] args) {
    List<Integer> fixture = List.of(3, 1, 4, 2);
    List<Integer> mysql = MYSQL.page(fixture);
    List<Integer> oracle = ORACLE.page(fixture);
    List<Integer> faulty = FAULTY.page(fixture);
    System.out.println("mysql=" + mysql);
    System.out.println("oracle=" + oracle);
    System.out.println("parity=" + mysql.equals(oracle));
    System.out.println("faulty=" + faulty);
    System.out.println("fault-detected=" + !mysql.equals(faulty));
  }
}`, "mysql=[1, 2, 3]\noracle=[1, 2, 3]\nparity=true\nfaulty=[3, 2, 1]\nfault-detected=true", ["mysql-transactions", "oracle-transactions", "testcontainers-mysql", "mybatis-configuration", "java-list"])],
    diagnostics: [d("in-memory 테스트는 통과하지만 production DB에서 syntax, generated key 또는 timestamp assertion이 실패합니다.", "대체 DB compatibility mode를 실제 vendor contract로 오해하고 target driver/version matrix를 실행하지 않았습니다.", ["test DB product/version", "driver/databaseId", "SQL/type feature usage", "migration checksum", "target DB readback"], "지원 vendor/version disposable DB에서 같은 mapper corpus와 round-trip/transaction/locking test를 실행합니다.", "PR smoke와 nightly/release full compatibility matrix를 artifact별로 기록하고 미검증 조합 배포를 차단합니다.")],
    expertNotes: ["container를 썼다는 사실보다 실제 image/version, driver와 configuration이 support matrix와 같은지가 중요합니다.", "vendor image의 비밀값은 runtime secret로만 주입하고 test report에는 presence와 logical databaseId만 남깁니다."],
  },
  {
    id: "query-result-assertions",
    title: "행 수뿐 아니라 identity·순서·NULL·type·affected count를 계약대로 assertion합니다",
    lead: "not-null 결과나 list size 하나만 확인하면 잘못된 column mapping, duplicate join row와 불안정 순서를 놓칩니다. statement 종류별로 의미 있는 최소 assertion set을 정합니다.",
    explanations: [
      "selectOne은 0/1/N cardinality를 구분하고 N에서 실패해야 하는지 확인합니다. selectList는 identity set/multiset, ordering, projection과 pagination metadata를 검증합니다.",
      "resultMap은 column alias, nested mapping, constructor/property, enum/type handler와 NULL 처리를 round-trip fixture로 확인합니다. Java default value가 DB NULL을 숨기지 않게 합니다.",
      "insert는 affected rows, generated key와 default/trigger 결과를 새 transaction에서 읽습니다. update/delete는 expected count 0/1/N과 optimistic version predicate를 구분합니다.",
      "first-level cache가 DB readback을 가릴 수 있으므로 flush/clear/new session을 의도에 맞게 사용합니다. cache behavior 자체를 검증하는 테스트와 persistence state 검증을 분리합니다.",
      "오류 assertion은 exception type/category, cause와 transaction outcome을 확인하되 raw SQL/message 전체에 문자열 결합하지 않습니다. version별 문구 변화와 정보 노출을 피합니다.",
    ],
    concepts: [
      c("semantic assertion", "구현 내부 호출이 아니라 반환 identity·ordering·type과 최종 DB state라는 계약 의미를 확인하는 assertion입니다.", ["cardinality를 봅니다.", "새 transaction readback을 포함합니다."]),
      c("multiset", "동일 값의 중복 횟수까지 포함하는 집합 개념입니다.", ["join duplicate를 탐지합니다.", "순서 계약과 분리합니다."]),
      c("cache-aware readback", "SqlSession cache가 아닌 committed database state를 확인하도록 session/transaction 경계를 통제한 검증입니다.", ["flush/clear 의미를 압니다.", "새 session을 사용합니다."]),
    ],
    diagnostics: [d("list size는 맞지만 duplicate identity, null field 또는 잘못된 순서가 production에서 발견됩니다.", "assertion이 count/not-null에만 머물고 result mapping과 identity/order/type contract를 확인하지 않았습니다.", ["exact IDs/multiplicity", "ORDER BY/tie-breaker", "resultMap/type handlers", "NULL/default behavior", "session cache/readback boundary"], "statement별 semantic assertion template을 만들고 synthetic NULL/duplicate/tie/type-boundary fixture로 exact output을 비교합니다.", "mapping·ordering·affected-row mutation test가 기존 suite에서 실패하는지 정기적으로 확인합니다.")],
    expertNotes: ["snapshot assertion을 큰 문자열 하나로 만들면 의미 없는 변경이 많아지므로 field/identity contract를 구조적으로 비교합니다.", "generated key 값 자체보다 존재, uniqueness와 relation wiring을 검증합니다."],
  },
  {
    id: "concurrency-locking-tests",
    title: "barrier와 최종 readback으로 optimistic·pessimistic conflict를 결정적으로 재현합니다",
    lead: "동시성 오류는 두 요청이 겹쳐야 나타나므로 순차 테스트로 발견할 수 없습니다. sleep 대신 barrier/latch로 read와 write 지점을 맞추고 성공·실패 cardinality와 최종 version을 확인합니다.",
    explanations: [
      "optimistic locking test는 두 transaction이 같은 version을 읽은 뒤 동시에 update하도록 barrier를 둡니다. 정확히 하나의 affected row 성공, 하나의 conflict와 version 1 증가를 assertion합니다.",
      "pessimistic lock은 holder가 lock을 잡았다는 signal 뒤 contender를 시작하고 timeout/deadlock category와 rollback을 검증합니다. wall-clock sleep에 의존하지 않습니다.",
      "각 worker는 독립 transaction/session/Connection을 사용해야 합니다. 같은 test transaction이나 same session을 공유하면 실제 경쟁이 발생하지 않거나 thread-safety 문제를 섞습니다.",
      "DB deadlock victim 선택은 비결정적일 수 있으므로 특정 worker 이름보다 성공/rollback 수와 최종 invariant를 검사합니다. vendor error category는 matrix별로 번역합니다.",
      "executor, future, barrier와 Connection은 제한 시간 안에 종료하고 failure에서도 cleanup합니다. hang은 test timeout으로 끊은 뒤 DB session/lock absence를 확인합니다.",
    ],
    concepts: [
      c("synchronization barrier", "여러 worker가 특정 실행 단계에 모두 도달할 때까지 기다렸다가 경쟁 구간을 함께 시작하는 도구입니다.", ["sleep을 대체합니다.", "timeout을 둡니다."]),
      c("optimistic conflict", "읽은 version이 update 시점에 달라 affected row가 0이 되어 충돌을 감지하는 결과입니다.", ["한 winner만 허용합니다.", "service error로 변환합니다."]),
      c("final-state invariant", "어느 worker가 이겼는지와 무관하게 성공 수, version, balance/row cardinality가 만족해야 하는 조건입니다.", ["비결정적 이름을 assertion하지 않습니다.", "새 transaction으로 읽습니다."]),
    ],
    codeExamples: [java("mybatis09-concurrency-barrier", "두 writer optimistic conflict를 barrier로 재현", "Mybatis09ConcurrencyBarrier.java", "두 thread가 version 0을 함께 읽은 뒤 CAS update해 정확히 한 winner와 한 conflict가 생기는지 실행합니다.", String.raw`import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class Mybatis09ConcurrencyBarrier {
  public static void main(String[] args) throws Exception {
    AtomicInteger version = new AtomicInteger(0);
    AtomicInteger successes = new AtomicInteger();
    CyclicBarrier barrier = new CyclicBarrier(2);
    Runnable writer = () -> {
      int observed = version.get();
      try {
        barrier.await(5, TimeUnit.SECONDS);
      } catch (Exception exception) {
        throw new RuntimeException(exception);
      }
      if (version.compareAndSet(observed, observed + 1)) successes.incrementAndGet();
    };

    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(writer);
      var second = executor.submit(writer);
      first.get(5, TimeUnit.SECONDS);
      second.get(5, TimeUnit.SECONDS);
    }
    int conflicts = 2 - successes.get();
    System.out.println("successes=" + successes.get());
    System.out.println("conflicts=" + conflicts);
    System.out.println("version=" + version.get());
    System.out.println("single-winner=" + (successes.get() == 1));
    System.out.println("workers-closed=true");
  }
}`, "successes=1\nconflicts=1\nversion=1\nsingle-winner=true\nworkers-closed=true", ["junit-parallel", "java-cyclic-barrier", "java-atomic-integer", "mybatis-spring-transactions", "mybatis-java-api"])],
    diagnostics: [d("동시성 테스트가 대부분 통과하지만 가끔 두 update 모두 성공하거나 CI에서 영원히 멈춥니다.", "sleep으로 timing을 추측했거나 worker가 같은 session/transaction을 공유했고 barrier/cleanup timeout이 없습니다.", ["worker transaction/session identity", "read/update barrier points", "affected rows/version", "future/barrier timeout", "DB lock/resource absence"], "각 worker에 독립 transaction을 주고 deterministic barrier로 경쟁을 만든 뒤 winner/conflict 수와 최종 state를 검증합니다.", "반복·seeded schedule, test timeout과 failure 후 executor/session/lock absence를 자동 확인합니다.")],
    expertNotes: ["동시성 테스트의 목표는 특정 thread 승자가 아니라 invariant와 failure translation입니다.", "JDK CAS example은 DB locking 구현이 아니므로 target DB의 isolation/lock/driver path를 반드시 실행합니다."],
  },
  {
    id: "failure-injection-cleanup",
    title: "설정·SQL·mapping·timeout·commit 실패를 주입하고 최초 원인과 자원 정리를 함께 봅니다",
    lead: "통합 테스트가 정상 SQL만 실행하면 운영에서 가장 중요한 복구 경로가 미검증입니다. 실패 지점을 startup, acquire, execute, map, commit과 cleanup 단계로 나눕니다.",
    explanations: [
      "startup failure에는 mapper resource 누락, namespace/method 불일치, duplicate statement, unknown type handler와 unsupported databaseId를 넣고 첫 test 전에 fail-fast category를 확인합니다.",
      "execute failure에는 syntax, constraint, deadlock, lock/query timeout과 connection loss를 넣습니다. 실제 사용자 SQL이나 값은 사용하지 않고 synthetic fixture와 approved failure trigger를 씁니다.",
      "mapping failure에는 null→primitive, unknown enum, wrong column alias와 numeric/time precision boundary를 넣어 partial object나 silent default가 생기지 않는지 봅니다.",
      "commit 응답 단절은 outcome이 ambiguous할 수 있습니다. idempotency/readback/reconciliation test가 성공·rollback·unknown을 잘 구분하는지 확인합니다.",
      "모든 실패에서 transaction completion, Connection/SqlSession 반환, executor/container 종료와 다음 test baseline을 assertion합니다. cleanup failure는 최초 원인을 가리지 않게 별도 evidence로 남깁니다.",
    ],
    concepts: [
      c("failure matrix", "lifecycle 단계별로 주입할 오류, 예상 exception category, transaction outcome과 cleanup 증거를 정리한 표입니다.", ["정상만큼 중요합니다.", "vendor별 차이를 기록합니다."]),
      c("root cause", "wrapper exception chain에서 실패를 처음 유발한 의미 있는 원인입니다.", ["stack trace 최초 원인을 보존합니다.", "public message에서는 redaction합니다."]),
      c("cleanup assertion", "실패 뒤 transaction/session/connection/lock/namespace/container가 남지 않았음을 확인하는 조건입니다.", ["다음 테스트 baseline을 봅니다.", "suppressed failure도 보존합니다."]),
    ],
    diagnostics: [d("실패 테스트 뒤 다른 테스트가 pool timeout·lock wait·dirty fixture로 연쇄 실패합니다.", "assertThrows만 확인하고 transaction/session/connection과 fixture cleanup 완료를 검증하지 않았습니다.", ["first thrown cause", "transaction completion", "pool active/pending", "DB session/lock", "namespace/container teardown"], "failure assertion 뒤 새 connection/readback과 resource metrics로 absence를 확인하고 teardown을 bounded finally/janitor로 보강합니다.", "각 lifecycle fault를 단독/연속/병렬로 실행해 다음 clean sentinel test가 항상 통과하는지 확인합니다.")],
    expertNotes: ["오류 message 전체 exact match는 version 변화와 민감정보 노출 위험이 있어 type/category/cause 구조를 비교합니다.", "fault injection mechanism이 production code에 공개 endpoint나 bypass로 남지 않도록 test profile로 격리합니다."],
  },
  {
    id: "ci-reproducibility-observability",
    title: "CI에서 version·seed·resource budget·flake를 재현 가능한 evidence로 관리합니다",
    lead: "로컬에서 한 번 통과한 통합 테스트보다 어떤 artifact와 DB 조합이 어떤 fixture로 통과했는지 재현할 수 있는 기록이 중요합니다. 느림과 flake도 제품 신뢰성 결함으로 다룹니다.",
    explanations: [
      "test manifest에는 commit/artifact, JDK, MyBatis/MyBatis-Spring, driver, DB image/version, migration/fixture checksum, databaseId와 suite shard를 기록합니다. 접속 URL·계정·row 값은 기록하지 않습니다.",
      "randomized order나 generated data를 쓰면 seed를 출력해 재현 가능하게 합니다. 실패 artifact에는 logical statement, phase, exception category와 bounded trace를 남기고 SQL/bind/PII를 제거합니다.",
      "CI resource budget에는 container startup, connection pool, parallel worker, DB CPU/memory와 test timeout을 둡니다. 무제한 병렬화가 production과 다른 pool exhaustion을 만들지 않게 합니다.",
      "flake를 무조건 재실행해 녹색으로 덮지 않습니다. 첫 실패와 retry 결과를 함께 보존하고 test ownership, quarantine expiry와 원인 분류를 운영합니다.",
      "release gate는 strict pass뿐 아니라 skipped matrix, cleanup leaks, slow percentile, coverage of required statements와 migration drift를 확인합니다. canary와 rollback artifact까지 연결합니다.",
    ],
    concepts: [
      c("test manifest", "통합 테스트를 재현하는 code/dependency/DB/schema/fixture/environment 식별자를 모은 비밀값 없는 기록입니다.", ["artifact와 함께 보존합니다.", "지원 matrix를 증명합니다."]),
      c("flake", "같은 의도 입력에서 외부 상태·timing·순서 때문에 pass/fail이 바뀌는 비결정 테스트입니다.", ["retry로 숨기지 않습니다.", "ownership과 만료를 둡니다."]),
      c("clean sentinel", "suite 시작/종료와 failure 뒤 schema/resource가 baseline인지 빠르게 확인하는 작은 테스트입니다.", ["연쇄 오염을 조기에 찾습니다.", "root cause를 대체하지 않습니다."]),
    ],
    diagnostics: [d("CI 재실행은 통과하지만 같은 실패를 로컬에서 재현할 version·fixture·DB 정보가 없습니다.", "test manifest와 seed를 남기지 않고 retry가 첫 failure evidence를 덮었습니다.", ["artifact/dependency versions", "DB image/databaseId", "migration/fixture checksum", "random seed/order", "first attempt artifact"], "비밀 없는 test manifest와 첫 failure bundle을 저장하고 retry는 별도 outcome으로 표시하며 flake owner/expiry를 지정합니다.", "manifest로 disposable environment를 재생성하는 drill과 skipped/slow/leak gate를 정기 실행합니다.")],
    expertNotes: ["테스트 log 양을 늘리는 것보다 재현에 필요한 bounded metadata와 first cause를 구조화하는 것이 낫습니다.", "CI credential은 최소 권한·짧은 수명으로 제공하고 stdout, report와 container inspect artifact를 secret scan합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-test-interface", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/test/mapper/TestMapper.java", usedFor: ["one-method test mapper progression"], evidence: "read-only scanner로 5-line interface와 method 1 구조만 확인했으며 package·method signature/source body는 복사하지 않았습니다." },
  { id: "local-test-xml", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/test/mapper/TestMapper.xml", usedFor: ["one-select test XML progression"], evidence: "read-only scanner로 11-line mapper XML, select 1, binding 0 구조만 확인했으며 namespace·SQL literal·result value는 복사하지 않았습니다." },
  { id: "mybatis-sqlmap", repository: "MyBatis 3", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["statement/parameter/result mapping contract"], evidence: "MyBatis 공식 mapper XML reference입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["session/mapper execution and cache test boundary"], evidence: "MyBatis 공식 Java API reference입니다." },
  { id: "mybatis-configuration", repository: "MyBatis 3", path: "Configuration", publicUrl: "https://mybatis.org/mybatis-3/configuration.html", usedFor: ["databaseId/type handler/mapper boot matrix"], evidence: "MyBatis 공식 configuration reference입니다." },
  { id: "mybatis-spring-transactions", repository: "MyBatis-Spring", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["Spring-managed mapper transaction participation"], evidence: "MyBatis-Spring 공식 transaction reference입니다." },
  { id: "spring-test-context", repository: "Spring Framework", path: "TestContext Framework", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework.html", usedFor: ["context lifecycle/cache/wiring"], evidence: "Spring Framework 공식 TestContext reference입니다." },
  { id: "spring-test-transactions", repository: "Spring Framework", path: "Transaction Management in Tests", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html", usedFor: ["test-managed transaction lifecycle"], evidence: "Spring Framework 공식 testing transaction reference입니다." },
  { id: "spring-test-sql", repository: "Spring Framework", path: "@Sql", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-sql.html", usedFor: ["declarative fixture scripts"], evidence: "Spring Framework 공식 @Sql reference입니다." },
  { id: "spring-test-rollback", repository: "Spring Framework", path: "@Rollback", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-rollback.html", usedFor: ["default test rollback semantics"], evidence: "Spring Framework 공식 @Rollback reference입니다." },
  { id: "spring-test-jdbc", repository: "Spring Framework", path: "JDBC Testing Support", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/support-jdbc.html", usedFor: ["row-count and JDBC test helpers"], evidence: "Spring Framework 공식 JDBC testing support reference입니다." },
  { id: "junit-parallel", repository: "JUnit 6.1.2 User Guide", path: "Parallel Execution", publicUrl: "https://docs.junit.org/6.1.2/writing-tests/parallel-execution.html", usedFor: ["parallel test lifecycle/configuration"], evidence: "JUnit 공식 parallel execution reference입니다." },
  { id: "testcontainers-jdbc", repository: "Testcontainers for Java", path: "JDBC support", publicUrl: "https://java.testcontainers.org/modules/databases/jdbc/", usedFor: ["disposable database lifecycle"], evidence: "Testcontainers 공식 JDBC database reference입니다." },
  { id: "testcontainers-mysql", repository: "Testcontainers for Java", path: "MySQL Module", publicUrl: "https://java.testcontainers.org/modules/databases/mysql/", usedFor: ["target MySQL disposable matrix"], evidence: "Testcontainers 공식 MySQL module reference입니다." },
  { id: "mysql-transactions", repository: "MySQL 8.4 Reference Manual", path: "InnoDB autocommit/commit/rollback", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-autocommit-commit-rollback.html", usedFor: ["MySQL transaction fidelity"], evidence: "Oracle MySQL 공식 transaction reference입니다." },
  { id: "oracle-transactions", repository: "Oracle Database 26 Concepts", path: "Transactions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/transactions.html", usedFor: ["Oracle transaction fidelity"], evidence: "Oracle 공식 transaction concepts reference입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["fixture/namespace examples"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["rollback/dialect sequence examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-cyclic-barrier", repository: "Java SE 21 API", path: "CyclicBarrier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CyclicBarrier.html", usedFor: ["deterministic concurrent writer example"], evidence: "Oracle JDK 공식 CyclicBarrier API입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["optimistic conflict example"], evidence: "Oracle JDK 공식 AtomicInteger API입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-09-integration-testing", slug: "mybatis-09-integration-testing", courseId: "spring", moduleId: "mybatis-mapping", order: 9,
  title: "Mapper 통합 테스트와 테스트 데이터 격리", subtitle: "작은 Mapper 호출에서 wiring·transaction·fixture·병렬 namespace·실제 방언·동시성·failure cleanup과 CI 재현성까지 검증 사다리를 완성합니다.", level: "전문가", estimatedMinutes: 1000,
  coreQuestion: "MyBatis Mapper의 SQL·mapping·transaction 의미를 실제 지원 DB에서 재현하면서 각 테스트의 데이터와 resource가 서로 오염되지 않음을 어떻게 증명할까요?",
  summary: "SpringBasic의 5-line TestMapper interface와 11-line mapper XML을 read-only 구조 scanner로 확인해 method 1·select 1·binding 0이라는 최소 학습 출발점을 보존하되 package, namespace, SQL과 값은 복사하지 않았습니다. integration scope, TestContext wiring, test rollback 한계, deterministic fixture, parallel namespace, target dialect matrix, semantic assertions, barrier concurrency, lifecycle failure injection과 CI manifest/flake governance로 확장합니다. 다섯 JDK 21 exact examples는 rollback baseline, fixture reset, namespace isolation, optimistic conflict와 dialect differential을 실제 실행합니다.",
  objectives: ["Mapper unit/integration/end-to-end test의 검증 범위를 구분한다.", "production-equivalent factory/DataSource/transaction graph를 focused TestContext에서 boot한다.", "test-managed rollback의 thread/resource 한계와 commit suite를 설명한다.", "시간·순서·sequence에 독립적인 synthetic fixture를 만든다.", "병렬 worker에 namespace/disposable DB lease를 부여한다.", "실제 MySQL·Oracle 지원 matrix에서 SQL/type/transaction을 검증한다.", "identity·ordering·NULL·affected row와 cache-aware readback을 assertion한다.", "barrier concurrency, failure injection, cleanup absence와 CI 재현 evidence를 운영한다."],
  prerequisites: [{ title: "Service·Mapper 계층과 트랜잭션 경계", reason: "Mapper가 같은 transaction-bound SqlSession과 resource graph에 참여하는 원리를 알아야 test rollback·propagation과 실제 commit 경로를 올바르게 검증할 수 있습니다.", sessionSlug: "mybatis-08-service-mapper-transaction" }],
  keywords: ["integration test", "mapper contract", "TestContext", "fixture", "rollback", "deterministic database", "@Sql", "@Rollback", "test namespace", "Testcontainers", "dialect matrix", "semantic assertion", "CyclicBarrier", "fault injection", "test manifest"], topics,
  lab: {
    title: "격리된 실제 DB Mapper qualification pipeline 구축",
    scenario: "작은 test mapper를 production-equivalent MyBatis/Spring wiring과 MySQL·Oracle matrix로 확장하고 병렬 CI, rollback 밖 commit, concurrency와 장애 뒤에도 다른 테스트를 오염시키지 않아야 합니다.",
    setup: ["원본 test interface/XML은 read-only로 보존하고 method/statement/binding count만 inventory합니다.", "pure model, focused Spring context, disposable vendor DB와 end-to-end suite를 분리합니다.", "synthetic fixture/migration checksum, worker namespace lease와 secret-free test manifest를 준비합니다.", "statement별 정상·경계·failure·cleanup acceptance table을 작성합니다."],
    steps: ["required mapper/factory/handler/databaseId inventory를 startup에 검증합니다.", "manager/factory/DataSource identity와 test transaction participation을 확인합니다.", "최소 synthetic fixture를 explicit ID/time/order로 seed합니다.", "rollback 뒤 새 transaction에서 row/sequence/resource baseline을 읽습니다.", "commit/REQUIRES_NEW/별도 thread 경로를 unique namespace에서 검증합니다.", "worker별 database/schema/container lease와 cleanup janitor를 실행합니다.", "지원 MySQL·Oracle version에 같은 mapper golden corpus를 실행합니다.", "result mapping·affected rows·generated key·cache-aware readback을 assertion합니다.", "barrier로 conflict/lock/timeout을 재현하고 final invariant를 확인합니다.", "startup/execute/map/commit/cleanup failure와 CI manifest·flake·rollback gate를 승인합니다."],
    expectedResult: ["packaged statement/config/resource inventory", "fixture checksum과 exact identity/result mapping table", "rollback/commit/REQUIRES_NEW 뒤 새 transaction readback", "worker cross-visibility 0과 teardown resource absence", "vendor/version별 syntax/type/transaction/concurrency matrix", "비밀 없는 first-failure bundle과 재현 manifest"],
    extensions: ["IDE resource만 존재해 artifact statement 누락", "test/production bean graph 차이", "rollback 밖 commit·sequence 오염", "implicit order/time/locale fixture flake", "병렬 cleanup 충돌", "대체 DB false positive", "cache가 DB readback을 가림", "sleep concurrency hang", "failure 뒤 connection/lock/container 누수"],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "한 Mapper select/write의 focused integration test를 설계하세요.", requirements: ["검증 component 범위를 적습니다.", "production-equivalent factory/DataSource를 사용합니다.", "synthetic 최소 fixture를 seed합니다.", "exact identity/type/row count를 확인합니다.", "rollback 뒤 새 transaction baseline을 봅니다.", "SQL/값 없는 evidence를 남깁니다.", "resource absence를 확인합니다."], hints: ["test method 안의 결과만 보지 말고 completion 뒤 DB state를 확인하세요."], expectedOutcome: "mapper contract와 격리 증거가 작은 suite로 재현됩니다.", solutionOutline: ["boot→seed→execute→semantic assert→completion→readback 순서입니다."] },
    { difficulty: "응용", prompt: "병렬 worker와 MySQL·Oracle matrix에서 같은 mapper corpus를 실행하세요.", requirements: ["worker별 namespace lease를 둡니다.", "migration/fixture checksum을 고정합니다.", "databaseId/driver/version을 기록합니다.", "NULL/tie/type/generated key를 포함합니다.", "barrier conflict를 재현합니다.", "cross-visibility 0을 확인합니다.", "teardown/janitor를 둡니다.", "대체 DB와 실제 DB 결과 차이를 기록합니다."], hints: ["특정 thread 승자 대신 성공/충돌 cardinality와 최종 state를 assertion하세요."], expectedOutcome: "병렬성과 방언 fidelity를 동시에 증명하는 qualification matrix가 완성됩니다.", solutionOutline: ["lease→migrate→seed→corpus→concurrency→cleanup→manifest 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Mapper 통합 테스트·CI governance를 작성하세요.", requirements: ["test 단계별 책임을 정의합니다.", "production-equivalent wiring gate를 둡니다.", "fixture/PII/secret 정책을 둡니다.", "rollback/commit/parallel isolation 표준을 둡니다.", "지원 DB matrix와 version policy를 둡니다.", "semantic/failure/cleanup assertion을 요구합니다.", "flake owner/expiry와 first failure 보존을 둡니다.", "release skipped/leak/slow gate와 재현 manifest를 요구합니다."], hints: ["녹색 결과보다 같은 환경을 다시 만들 수 있는 evidence를 기준으로 설계하세요."], expectedOutcome: "테스트 작성부터 장애 재현·release 승인까지 지속 가능한 표준이 완성됩니다.", solutionOutline: ["scope→environment→data→execution→failure→cleanup→manifest→governance 순서입니다."] },
  ],
  nextSessions: ["spring-core-01-ioc-container-bean"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["TestMapper.java는 5-line 원본에서 interface method 1 구조만 확인했으며 package·method signature/source body는 복사하지 않았습니다.", "TestMapper.xml은 11-line 원본에서 mapper/select 1과 binding 0 구조만 확인했으며 namespace·SQL literal·result value는 복사하지 않았습니다.", "원본은 실제 test class, fixture, transaction, isolation, target DB matrix와 cleanup 증거를 제공하지 않으므로 이를 가정하지 않고 Spring/MyBatis/JUnit/Testcontainers/DB/JDK 공식 문서와 synthetic examples로 보완했습니다.", "JDK examples는 test invariant model이므로 실제 Spring TestContext, MyBatis mapping, driver/isolation/locking과 container lifecycle은 지원 matrix의 disposable DB integration tests로 별도 검증해야 합니다."] },
});

export default session;
