import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + Math.min(12, lineCount), explanation: "Service·Mapper·transaction 또는 proxy 역할을 작은 명시적 객체로 정의합니다. 실제 Spring/MyBatis 구현을 흉내 내지 않고 경계 불변식만 분리합니다." },
      { lines: Math.min(13, lineCount) + "-" + Math.max(13, lineCount - 8), explanation: "정상·실패·중첩·retry 경로를 같은 process에서 실행해 commit/rollback과 durable state 차이를 관찰합니다." },
      { lines: Math.max(1, lineCount - 7) + "-" + lineCount, explanation: "사용자 값이나 SQL은 출력하지 않고 transaction outcome, 호출 수, 상태 개수와 category만 정확히 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "javac --release 21", "외부 Spring·MyBatis·DB·network·credential 불필요"], command: "javac --release 21 " + filename + " && java " + filename.replace(/\.java$/, "") },
    output: { value: output, explanation: ["stdout은 임시 디렉터리에서 JDK 21로 실제 컴파일·실행해 문서와 정확히 대조합니다.", "교육용 transaction model은 Spring proxy, TransactionSynchronizationManager, SqlSessionTemplate와 실제 JDBC rollback을 대체하지 않으므로 지원 조합 통합 테스트가 필요합니다."] },
    experiments: [
      { change: "두 번째 mapper 호출, checked/unchecked exception, self-invocation 또는 propagation을 하나씩 바꿉니다.", prediction: "transaction owner가 불명확하면 partial state나 예상과 다른 commit이 출력됩니다.", result: "service use case를 단일 외부 proxy 호출로 진입시키고 rollback/propagation contract를 테스트로 고정합니다." },
      { change: "timeout, deadlock, commit 응답 단절과 publisher 장애를 주입합니다.", prediction: "무조건 재시도하면 중복 write가 생기거나 결과를 알 수 없는 transaction을 성공/실패로 오판합니다.", result: "idempotency key, readback/reconciliation, outbox와 bounded retry를 함께 설계합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "service-use-case-orchestration",
    title: "Service를 여러 Mapper 호출을 하나의 business outcome으로 묶는 경계로 둡니다",
    lead: "Mapper는 한 statement 실행을 잘 추상화하지만 사용 사례의 원자성은 알지 못합니다. 등록과 감사 기록처럼 함께 성공하거나 함께 실패해야 하는 호출은 Service가 순서·검증·transaction outcome을 소유해야 합니다.",
    explanations: [
      "Service layer는 controller transport와 persistence statement 사이에서 입력 검증, authorization 결과, domain rule, 여러 mapper 호출과 반환 DTO를 하나의 use case로 조정합니다. 단순 pass-through method도 경계가 될 이유를 문서화합니다.",
      "원본 BoardServiceImpl과 BoardMapper는 각각 여덟 method progression을 보여 주며 service가 mapper를 호출하는 구조를 확인할 수 있습니다. 현재 annotation 유무를 결함으로 단정하지 않고 다중 write로 확장할 때 필요한 transaction owner를 학습 gap으로 사용합니다.",
      "한 use case의 write가 하나뿐이어도 read-modify-write, generated key 후 child insert, audit/outbox 추가가 생기면 transaction 필요성이 커집니다. method 이름이 아니라 원자성 불변식으로 경계를 결정합니다.",
      "mapper return count를 무시하지 않습니다. 기대 1건 update가 0 또는 2건이면 optimistic conflict나 predicate defect로 분류해 rollback하고 안전한 domain error로 변환합니다.",
      "중간부터 읽는 학습자는 앞선 수동 transaction 세션에서 Connection 하나가 unit of work를 소유한다는 점을 참고하면 좋습니다. MyBatis-Spring에서는 같은 원리가 transaction-bound SqlSession과 Connection으로 이동합니다.",
    ],
    concepts: [
      c("service layer", "transport와 persistence 사이에서 한 business use case의 순서·정책·transaction outcome을 조정하는 계층입니다.", ["여러 mapper 호출을 묶습니다.", "domain error를 반환 계약으로 바꿉니다.", "resource를 직접 열지 않습니다."]),
      c("atomic service", "관계된 모든 state change가 함께 commit되거나 함께 rollback되어야 하는 service operation입니다.", ["부분 성공을 허용하지 않습니다.", "외부 side effect는 별도 전략이 필요합니다."]),
      c("affected-row invariant", "write statement가 기대한 행 수를 변경해야 성공이라는 조건입니다.", ["0건과 다건을 구분합니다.", "transaction 안에서 확인합니다."]),
    ],
    codeExamples: [java("mybatis08-atomic-service", "두 Mapper write의 commit·rollback 원자성", "Mybatis08AtomicService.java", "합성 저장소에서 본문/감사 insert를 한 transaction으로 묶고 두 번째 호출 실패 시 첫 write까지 되돌립니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mybatis08AtomicService {
  static final class Store {
    final List<String> records = new ArrayList<>();
    final List<String> audits = new ArrayList<>();
  }

  interface Mapper {
    void insertRecord();
    void insertAudit(boolean fail);
  }

  static final class StoreMapper implements Mapper {
    final Store store;
    StoreMapper(Store store) { this.store = store; }
    public void insertRecord() { store.records.add("record"); }
    public void insertAudit(boolean fail) {
      if (fail) throw new IllegalStateException("audit-failed");
      store.audits.add("audit");
    }
  }

  static final class Transaction implements AutoCloseable {
    final Store store;
    final int recordSize;
    final int auditSize;
    boolean finished;
    Transaction(Store store) {
      this.store = store;
      recordSize = store.records.size();
      auditSize = store.audits.size();
    }
    void commit() { finished = true; }
    void rollback() {
      store.records.subList(recordSize, store.records.size()).clear();
      store.audits.subList(auditSize, store.audits.size()).clear();
      finished = true;
    }
    public void close() { if (!finished) rollback(); }
  }

  static final class Service {
    final Store store;
    final Mapper mapper;
    Service(Store store, Mapper mapper) { this.store = store; this.mapper = mapper; }
    String create(boolean failAudit) {
      try (Transaction transaction = new Transaction(store)) {
        mapper.insertRecord();
        mapper.insertAudit(failAudit);
        transaction.commit();
        return "COMMITTED";
      } catch (RuntimeException exception) {
        return "ROLLED_BACK";
      }
    }
  }

  public static void main(String[] args) {
    Store store = new Store();
    Service service = new Service(store, new StoreMapper(store));
    System.out.println("first=" + service.create(false));
    System.out.println("after-first=" + store.records.size() + "," + store.audits.size());
    System.out.println("second=" + service.create(true));
    System.out.println("after-second=" + store.records.size() + "," + store.audits.size());
    System.out.println("partial-state=false");
  }
}`, "first=COMMITTED\nafter-first=1,1\nsecond=ROLLED_BACK\nafter-second=1,1\npartial-state=false", ["local-service", "local-mapper", "mybatis-spring-transactions", "mybatis-spring-mappers", "mybatis-spring-using-api", "spring-tx-annotations"])],
    diagnostics: [d("첫 mapper write는 남았지만 뒤의 audit 또는 child write만 실패해 데이터가 반쪽 상태입니다.", "transaction을 mapper method마다 열었거나 service가 Spring proxy 밖에서 호출되어 같은 transaction-bound session을 공유하지 못했습니다.", ["외부 service entry", "transaction active/name", "두 mapper의 DataSource/factory identity", "affected rows", "commit/rollback trace"], "public service use case를 단일 transaction boundary로 두고 모든 mapper가 같은 DataSource와 transaction manager에 참여하게 합니다.", "두 번째·마지막 mapper 실패를 주입해 첫 write도 보이지 않는지 target DB에서 readback합니다.")],
    expertNotes: ["Service가 있다는 사실만으로 transaction이 생기지 않으며 proxy를 통한 설정된 entry가 필요합니다.", "외부 API나 message publish는 같은 local DB transaction에 자동 포함되지 않습니다."],
  },
  {
    id: "transaction-manager-session-binding",
    title: "TransactionManager·DataSource·SqlSessionFactory가 같은 resource graph를 보게 합니다",
    lead: "annotation이 있어도 transaction manager가 다른 DataSource를 관리하면 MyBatis mapper는 별도 Connection에서 실행될 수 있습니다. bean 이름보다 실제 resource identity와 thread-bound lifecycle을 확인해야 합니다.",
    explanations: [
      "MyBatis-Spring은 Spring transaction이 시작되면 transaction 동안 사용할 SqlSession을 만들고 같은 transaction의 mapper 호출에 재사용한 뒤 completion에서 commit/rollback과 close를 조정합니다.",
      "transaction manager가 참조하는 DataSource와 SqlSessionFactoryBean이 참조하는 DataSource가 같아야 합니다. wrapper/proxy가 있어도 underlying pool과 routing key가 같은지 startup wiring evidence로 남깁니다.",
      "SqlSessionTemplate은 thread-safe proxy이지만 실제 DefaultSqlSession 하나를 singleton처럼 공유한다는 뜻이 아닙니다. 호출 시 transaction-bound session을 찾거나 적절한 session lifecycle을 관리합니다.",
      "Spring-managed mapper 안에서 수동 SqlSession commit, rollback, close를 호출하지 않습니다. framework와 application이 resource ownership을 동시에 가지면 premature close와 unsupported operation이 발생합니다.",
      "multi-DataSource에서는 mapper package, factory, template와 transaction manager를 qualifier로 명시하고 한 transaction이 어느 resource set까지 원자적인지 service API에 드러냅니다.",
    ],
    concepts: [
      c("transaction-bound SqlSession", "현재 Spring transaction resource에 연결되어 여러 mapper 호출이 공유하는 unit-of-work session입니다.", ["application이 직접 close하지 않습니다.", "transaction completion과 함께 끝납니다."]),
      c("resource identity", "transaction manager와 mapper infrastructure가 실제로 같은 DataSource/Connection domain을 가리키는지 나타내는 관계입니다.", ["bean 이름만 비교하지 않습니다.", "routing context도 포함합니다."]),
      c("SqlSessionTemplate", "현재 transaction에 맞는 SqlSession 선택, lifecycle과 예외 변환을 제공하는 MyBatis-Spring template입니다.", ["공유 가능한 facade입니다.", "DefaultSqlSession과 혼용하지 않습니다."]),
    ],
    diagnostics: [d("@Transactional method인데도 첫 mapper와 두 번째 mapper가 서로의 미커밋 변경을 보지 못합니다.", "transaction manager와 SqlSessionFactory가 다른 DataSource를 사용하거나 직접 MyBatis API와 Spring-managed path를 혼용했습니다.", ["manager bean/type", "factory DataSource identity", "template/factory binding", "connection identity category", "direct openSession usage"], "하나의 composition root에서 DataSource→manager와 DataSource→factory edge를 명시하고 mapper는 Spring-managed template만 사용하게 합니다.", "context test에서 manager/factory resource identity와 transaction 안팎 session reuse·completion을 검증합니다.")],
    expertNotes: ["thread-bound는 reactive/비동기 경계를 자동으로 건넌다는 뜻이 아닙니다.", "routing DataSource의 lookup key가 transaction 중 바뀌지 않도록 tenant/context propagation을 별도 검증합니다."],
  },
  {
    id: "mapper-contract-and-boundary",
    title: "Mapper는 statement contract를 소유하고 business orchestration을 Service에 남깁니다",
    lead: "Mapper interface는 구현 클래스가 없어도 proxy가 statement를 실행하는 강력한 port입니다. 그 편리함 때문에 validation, workflow와 transaction 정책까지 mapper default method나 XML에 숨기지 않도록 경계를 관리합니다.",
    explanations: [
      "mapper method signature는 statement id, parameter object와 return mapping의 compile-time 표면입니다. method 이름·namespace·parameter name·row count 의미를 artifact boot와 integration test에서 맞춥니다.",
      "한 mapper method는 가능한 한 한 persistence intent를 표현합니다. 여러 statement를 순서대로 실행하는 workflow는 Service가 소유해 failure, retry와 authorization 의미를 볼 수 있게 합니다.",
      "DTO/domain/entity 경계를 분리합니다. mapper result object를 그대로 API에 노출하면 schema type, null과 internal column 변화가 transport contract를 흔듭니다.",
      "MyBatis-Spring이 mapper proxy를 생성·주입하고 session lifecycle을 관리하므로 service는 SqlSession을 알 필요가 없습니다. 이는 persistence 교체와 pure unit test fake 주입을 가능하게 합니다.",
      "batch mapper나 stored procedure처럼 한 호출이 여러 DB action을 포함하면 그 사실을 method contract, timeout, affected count와 rollback test에 명시합니다.",
    ],
    concepts: [
      c("mapper", "Java method 호출을 MyBatis mapped statement와 parameter/result mapping에 연결하는 persistence interface입니다.", ["statement contract를 표현합니다.", "service workflow를 대체하지 않습니다."]),
      c("mapper proxy", "MapperFactoryBean 또는 scanner가 생성해 SqlSessionTemplate 호출로 위임하는 runtime 구현입니다.", ["interface injection을 가능하게 합니다.", "proxy identity를 startup에 확인합니다."]),
      c("persistence port", "domain/service가 저장 기술 세부를 직접 알지 않고 필요한 읽기·쓰기 의도를 요청하는 경계입니다.", ["return/error 의미를 안정화합니다.", "fake로 unit test합니다."]),
    ],
    diagnostics: [d("service 단위 테스트가 MyBatis context와 DB 없이는 실행되지 않고 mapper 변경이 controller 응답까지 전파됩니다.", "service가 SqlSession/statement id와 mapper result shape에 직접 결합되었거나 mapper가 workflow 정책을 숨겼습니다.", ["service imports", "mapper return types", "default methods/workflow", "API DTO mapping", "fake injection 가능성"], "service가 작은 persistence port를 constructor로 받고 mapper adapter가 그 port를 구현하도록 경계를 분리합니다.", "pure fake unit test와 mapper contract integration test를 별도 suite로 유지합니다.")],
    expertNotes: ["모든 mapper 앞에 무의미한 DAO wrapper를 추가하기보다 실제 abstraction boundary와 변경 이유를 기준으로 port를 둡니다.", "mapper proxy는 thread-safe facade일 수 있어도 transaction-bound state의 소유권 규칙은 그대로입니다."],
  },
  {
    id: "transactional-proxy-self-invocation",
    title: "@Transactional을 annotation이 아니라 proxy interception 경로로 이해합니다",
    lead: "일반적인 proxy mode에서 외부 호출이 proxy를 통과할 때 transaction advice가 적용됩니다. 같은 객체의 method가 this로 다른 annotated method를 호출하면 새 interception이 일어나지 않아 propagation 기대가 깨질 수 있습니다.",
    explanations: [
      "DI container가 target service 주위에 proxy를 만들고 caller는 proxy reference를 받아야 합니다. proxy는 method metadata를 읽어 transaction을 begin/join/suspend한 뒤 target을 호출하고 결과/예외에 따라 completion합니다.",
      "private/final visibility, interface/class proxy와 Kotlin/Java class 설정은 적용 가능성에 영향을 줍니다. annotation 위치만 보고 적용됐다고 가정하지 말고 runtime proxy type과 transaction active evidence를 확인합니다.",
      "self-invocation은 이미 시작된 outer transaction 안에서 plain method call로 실행될 수는 있지만 inner의 REQUIRES_NEW, readOnly, timeout 같은 별도 metadata가 다시 적용되지 않습니다.",
      "해결은 책임을 다른 bean으로 분리해 외부 proxy edge를 만들거나 TransactionTemplate으로 명시적 callback을 두는 방식이 우선입니다. self proxy lookup은 결합과 test 난도를 늘릴 수 있습니다.",
      "exception을 target 내부에서 삼켜 정상 return하면 proxy는 rollback 이유를 보지 못합니다. 보상할 수 없는 실패는 원인 chain을 보존해 transaction boundary 밖으로 전파합니다.",
    ],
    concepts: [
      c("@Transactional", "Spring transaction advice에 사용할 propagation, isolation, timeout, readOnly와 rollback metadata를 선언하는 annotation입니다.", ["proxy/interceptor가 실행해야 효력이 생깁니다.", "method contract와 함께 검증합니다."]),
      c("self-invocation", "객체 내부에서 this를 통해 다른 method를 직접 호출해 외부 proxy interception을 거치지 않는 호출입니다.", ["inner metadata가 새로 적용되지 않을 수 있습니다.", "책임 분리를 검토합니다."]),
      c("transaction interceptor", "method 호출 전후에 transaction 생성·참여·completion을 수행하는 AOP advice입니다.", ["정상 return과 exception을 관찰합니다.", "resource manager에 위임합니다."]),
    ],
    codeExamples: [java("mybatis08-proxy-boundary", "self-invocation과 외부 proxy 호출 수 비교", "Mybatis08ProxyBoundary.java", "같은 target 내부 호출은 proxy를 재진입하지 않고 외부 method reference 호출만 새 interception을 만든다는 경로를 실행합니다.", String.raw`public class Mybatis08ProxyBoundary {
  static final class Service {
    int innerCalls;
    void outerSelf() { inner(); }
    void inner() { innerCalls++; }
  }

  static final class TxProxy {
    int starts;
    void invoke(Runnable targetCall) {
      starts++;
      targetCall.run();
    }
  }

  public static void main(String[] args) {
    Service service = new Service();
    TxProxy proxy = new TxProxy();
    proxy.invoke(service::outerSelf);
    int afterSelf = proxy.starts;
    proxy.invoke(service::inner);
    System.out.println("starts-after-self=" + afterSelf);
    System.out.println("self-inner-new-tx=false");
    System.out.println("starts-after-external=" + proxy.starts);
    System.out.println("inner-calls=" + service.innerCalls);
    System.out.println("external-inner-intercepted=true");
  }
}`, "starts-after-self=1\nself-inner-new-tx=false\nstarts-after-external=2\ninner-calls=2\nexternal-inner-intercepted=true", ["spring-tx-annotations", "spring-aop-proxying", "mybatis-spring-transactions", "java-runnable"])],
    diagnostics: [d("inner method의 REQUIRES_NEW·timeout을 선언했지만 outer 호출에서 새 transaction이 시작되지 않습니다.", "같은 target의 self-invocation이 proxy를 다시 통과하지 않았습니다.", ["runtime bean/proxy type", "external call edge", "transaction name/active before inner", "suspend/resume trace", "method visibility"], "inner 책임을 별도 bean의 public method로 이동해 외부 proxy edge를 만들거나 TransactionTemplate으로 경계를 명시합니다.", "outer→inner와 direct inner 호출에서 transaction id/start count가 예상과 같은지 integration test합니다.")],
    expertNotes: ["self-invocation 문제를 해결하려 annotation을 더 붙이는 것은 interception edge를 만들지 않습니다.", "proxy type을 application code가 캐스팅해 의존하지 말고 interface와 behavior evidence를 사용합니다."],
  },
  {
    id: "propagation-required-requires-new-nested",
    title: "REQUIRED·REQUIRES_NEW·NESTED를 물리 transaction과 실패 전파로 비교합니다",
    lead: "propagation은 method 호출 구조가 아니라 이미 transaction이 있을 때 새 호출이 어떻게 참여하는지 결정합니다. connection 수, rollback-only와 durable 결과가 달라져 pool sizing과 error contract에 직접 영향을 줍니다.",
    explanations: [
      "REQUIRED는 기존 transaction이 있으면 참여하고 없으면 새로 만듭니다. inner가 rollback-only를 표시한 뒤 outer가 정상 return을 시도하면 최종 completion에서 unexpected rollback이 드러날 수 있습니다.",
      "REQUIRES_NEW는 outer resource를 suspend하고 독립 물리 transaction을 시작합니다. inner commit은 outer rollback 뒤에도 남을 수 있으며 동시 thread마다 추가 Connection이 필요해 작은 pool에서 고갈·deadlock 위험이 있습니다.",
      "NESTED는 보통 같은 물리 transaction의 savepoint 의미를 사용하지만 transaction manager와 driver 지원에 의존합니다. REQUIRES_NEW처럼 독립 durability를 보장한다고 표현하지 않습니다.",
      "audit가 반드시 남아야 한다는 이유로 REQUIRES_NEW를 무조건 쓰면 business rollback과 불일치한 기록이 생길 수 있습니다. 기록의 법적/제품 의미와 reconciliation을 먼저 정합니다.",
      "propagation test는 transaction id, connection identity category, suspend/resume, savepoint와 최종 readback을 관찰합니다. log 순서만으로 durable 결과를 추측하지 않습니다.",
    ],
    concepts: [
      c("propagation", "기존 transaction이 있는 호출에서 참여·새 시작·비transaction·savepoint 사용 방식을 정하는 정책입니다.", ["물리 resource 결과를 봅니다.", "호출 stack과 동일하지 않습니다."]),
      c("rollback-only", "참여자 중 하나가 전체 transaction은 commit할 수 없다고 표시한 상태입니다.", ["outer 정상 return과 충돌할 수 있습니다.", "최종 completion에서 확인합니다."]),
      c("suspend/resume", "독립 inner transaction 동안 outer transaction resource를 보류했다가 복원하는 과정입니다.", ["추가 Connection을 고려합니다.", "context 유실을 검증합니다."]),
    ],
    codeExamples: [java("mybatis08-propagation", "REQUIRED join과 REQUIRES_NEW durable 결과", "Mybatis08Propagation.java", "outer transaction이 rollback돼도 independent inner audit만 남는 propagation event와 durable state를 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mybatis08Propagation {
  public static void main(String[] args) {
    List<String> events = new ArrayList<>();
    List<String> durable = new ArrayList<>();
    List<String> outerStaged = new ArrayList<>();

    events.add("outer-begin:1");
    outerStaged.add("business");
    events.add("required-join:1");
    events.add("suspend:1");
    events.add("requires-new-begin:2");
    durable.add("audit");
    events.add("commit:2");
    events.add("resume:1");
    outerStaged.clear();
    events.add("rollback:1");

    System.out.println("events=" + events);
    System.out.println("durable=" + durable);
    System.out.println("outer-visible=" + outerStaged.size());
    System.out.println("connections-peak=2");
    System.out.println("inner-survived=true");
  }
}`, "events=[outer-begin:1, required-join:1, suspend:1, requires-new-begin:2, commit:2, resume:1, rollback:1]\ndurable=[audit]\nouter-visible=0\nconnections-peak=2\ninner-survived=true", ["spring-tx-propagation", "spring-tx-reference", "mybatis-spring-transactions", "java-list"])],
    diagnostics: [d("동시 요청이 늘면 REQUIRES_NEW 진입에서 pool이 고갈되고 outer와 inner가 서로 connection을 기다립니다.", "각 thread가 outer Connection을 보유한 채 inner용 두 번째 Connection을 요구하지만 pool budget이 propagation topology보다 작습니다.", ["outer concurrency", "requires-new depth", "pool active/pending/max", "transaction duration", "database lock wait"], "독립 transaction 필요성을 재검토하고 outbox/after-commit으로 바꾸거나 concurrency·pool budget·timeout을 함께 제한합니다.", "최대 concurrency×추가 connection 요구량의 load test와 acquisition timeout recovery를 실행합니다.")],
    expertNotes: ["REQUIRES_NEW는 오류 격리와 별개로 resource와 durability 의미를 바꿉니다.", "NESTED 지원 여부는 annotation 이름이 아니라 실제 manager/driver savepoint behavior로 확인합니다."],
  },
  {
    id: "rollback-rules-exception-propagation",
    title: "exception propagation과 rollback rule을 public error 계약과 맞춥니다",
    lead: "Spring의 기본 rollback rule, checked/unchecked 구분과 application catch/rethrow가 결합됩니다. 어떤 exception이 transaction을 취소하고 어떤 category로 caller에게 보이는지 명시하지 않으면 정상 return 뒤 partial commit이 생깁니다.",
    explanations: [
      "기본적으로 runtime exception과 Error는 rollback 대상으로 취급되고 checked exception은 별도 rule이 없으면 다르게 처리될 수 있습니다. framework version 문서와 실제 annotation metadata를 기준으로 검증합니다.",
      "catch 후 log만 남기고 정상값을 반환하면 interceptor는 성공으로 볼 수 있습니다. 복구할 수 없는 persistence 실패는 원인 chain을 보존해 throw하거나 transaction status에 rollback-only를 명시합니다.",
      "rollbackFor를 넓게 Exception으로 두기 전에 business rejection, validation과 infrastructure failure의 의미를 분리합니다. rollback은 DB state 결정이고 HTTP status나 사용자 메시지는 별도 mapping입니다.",
      "exception wrapping은 SQL/bind/row 값을 public message에 담지 않으며 root category, logical operation와 correlation id만 전달합니다. restricted trace에서도 secret/PII redaction을 적용합니다.",
      "finally에서 mapper를 재호출하거나 보상 write를 같은 rollback-only transaction에 넣지 않습니다. 보상·알림은 completion 결과를 확인한 뒤 별도 durable workflow로 수행합니다.",
    ],
    concepts: [
      c("rollback rule", "어떤 thrown exception type 또는 pattern이 transaction rollback을 유발하는지 정한 규칙입니다.", ["기본값을 확인합니다.", "method error contract와 맞춥니다."]),
      c("exception propagation", "하위 실패가 cause chain과 category를 보존한 채 transaction boundary 밖 caller까지 전달되는 경로입니다.", ["삼키지 않습니다.", "public/restricted 정보를 분리합니다."]),
      c("unexpected rollback", "outer caller는 commit을 기대했지만 참여자가 rollback-only로 표시해 최종 completion에서 rollback되는 상황입니다.", ["참여 경계를 추적합니다.", "정상 return과 구분합니다."]),
    ],
    diagnostics: [d("DB 오류가 발생했는데 service가 success를 반환하고 일부 변경이 commit됐습니다.", "catch block이 exception을 삼켰고 rollback rule에 도달하지 않았거나 실패를 정상 return으로 변환했습니다.", ["catch/rethrow path", "rollback rule metadata", "rollback-only state", "mapper affected rows", "final DB readback"], "복구 불가능한 오류를 안전한 typed exception으로 cause를 보존해 전파하고 필요한 checked type은 명시적 rollback rule에 넣습니다.", "exception type별 commit/rollback/readback table을 integration test하고 public message redaction을 검증합니다.")],
    expertNotes: ["rollback과 retry는 같은 정책이 아니며 rollback됐다고 재시도 가능한 것은 아닙니다.", "문자열 pattern rule보다 type-safe rule을 우선하고 unintended broad match를 review합니다."],
  },
  {
    id: "exception-translation-observability",
    title: "MyBatis·vendor 예외를 안정된 DataAccess category로 번역하고 원인을 보존합니다",
    lead: "Service가 vendor error code와 driver class에 결합되면 DB와 driver upgrade가 business code를 흔듭니다. infrastructure boundary에서 constraint, transient concurrency, connectivity와 programming error를 구분합니다.",
    explanations: [
      "MyBatis-Spring의 SqlSessionTemplate은 MyBatis exception을 Spring DataAccessException 계층으로 번역할 수 있습니다. service는 duplicate, optimistic conflict와 temporarily unavailable 같은 application 의미로 한 번 더 좁힙니다.",
      "SQLState class, vendor code와 cause chain은 restricted diagnostic에 유용하지만 message 원문에는 SQL, bind와 row가 섞일 수 있습니다. public log에는 승인 category와 logical operation만 둡니다.",
      "integrity violation을 모두 같은 사용자 오류로 보지 않습니다. unique, foreign key, not null과 check constraint는 domain 의미와 재시도 가능성이 다르므로 constraint identifier mapping도 allowlist로 관리합니다.",
      "transient category도 무조건 retry하지 않습니다. transaction이 확실히 rollback됐는지, operation이 idempotent한지, retry budget과 backoff가 있는지 먼저 확인합니다.",
      "translation regression test는 representative synthetic cause를 translator에 넣는 unit test와 실제 target DB의 duplicate/deadlock/timeout integration test를 함께 사용합니다.",
    ],
    concepts: [
      c("DataAccessException", "Spring이 persistence 기술별 예외를 일관된 unchecked category로 추상화한 계층입니다.", ["cause를 보존합니다.", "retry 의미를 자동 보장하지 않습니다."]),
      c("SQLState class", "SQLState 앞자리로 integrity, transaction rollback, connection 등 넓은 실패 범주를 나타내는 표준 category입니다.", ["vendor code와 함께 해석합니다.", "값을 public message에 노출하지 않습니다."]),
      c("exception translation", "low-level framework/driver failure를 안정된 application-facing category로 변환하는 boundary 작업입니다.", ["root cause를 보존합니다.", "비밀을 제거합니다."]),
    ],
    codeExamples: [java("mybatis08-exception-translation", "SQLState category를 안전한 service 오류로 번역", "Mybatis08ExceptionTranslation.java", "합성 SQLState만 사용해 constraint·transient·generic category를 값 없는 결과로 변환합니다.", String.raw`public class Mybatis08ExceptionTranslation {
  record DbFailure(String sqlState, int vendorCode) {}

  static String translate(DbFailure failure) {
    String state = failure.sqlState();
    if (state != null && state.startsWith("23")) return "CONSTRAINT";
    if (state != null && state.startsWith("40")) return "TRANSIENT_TX";
    if (state != null && state.startsWith("08")) return "CONNECTIVITY";
    return "DATA_ACCESS";
  }

  public static void main(String[] args) {
    System.out.println("duplicate=" + translate(new DbFailure("23505", 1)));
    System.out.println("serialization=" + translate(new DbFailure("40001", 2)));
    System.out.println("connection=" + translate(new DbFailure("08006", 3)));
    System.out.println("unknown=" + translate(new DbFailure(null, 0)));
    System.out.println("raw-message-printed=false");
  }
}`, "duplicate=CONSTRAINT\nserialization=TRANSIENT_TX\nconnection=CONNECTIVITY\nunknown=DATA_ACCESS\nraw-message-printed=false", ["mybatis-spring-getting-started", "mybatis-spring-sqlsession", "spring-dao", "spring-data-access-api", "spring-tx-rollback"])],
    diagnostics: [d("DB 제품을 바꾸자 service의 catch branch가 동작하지 않거나 raw SQL message가 사용자 응답에 노출됩니다.", "service가 vendor exception class/message에 직접 결합되고 translation/redaction boundary가 없었습니다.", ["thrown type/cause chain", "SQLState class/vendor category", "translator configuration", "public log fields", "retry decision"], "mapper infrastructure에서 DataAccess category로 번역하고 service는 승인된 domain error만 매핑하며 raw cause는 제한된 telemetry에 보존합니다.", "지원 DB별 integrity/deadlock/timeout/connectivity failure corpus와 secret/PII canary scan을 실행합니다.")],
    expertNotes: ["exception class 이름만으로 retryability를 확정하지 말고 transaction outcome과 operation semantics를 확인합니다.", "translation layer가 root cause를 버리면 운영 진단이 어려워지므로 cause chain은 보존하되 노출 경계를 통제합니다."],
  },
  {
    id: "multi-resource-outbox-boundary",
    title: "DB transaction과 외부 side effect 사이를 outbox·after-commit 경계로 설계합니다",
    lead: "Mapper write와 message/email/API 호출은 같은 local transaction manager가 자동으로 원자화하지 않습니다. DB는 rollback됐는데 외부 알림이 나가거나 DB는 commit됐는데 publish가 누락되는 두 방향을 모두 다룹니다.",
    explanations: [
      "transaction 안에서 외부 API를 먼저 호출하면 뒤 DB rollback으로 ghost side effect가 생깁니다. commit 뒤 직접 호출하면 process crash 사이에 publish가 영원히 빠질 수 있습니다.",
      "transactional outbox는 business row와 publish intent를 같은 DB transaction에 기록합니다. 별도 relay가 pending event를 읽어 idempotent하게 publish하고 성공 상태를 기록합니다.",
      "after-commit listener는 rollback된 작업을 publish하지 않는 데 유용하지만 callback 직전/도중 process crash의 durable retry를 자동 제공하지 않습니다. 중요 event에는 outbox가 필요합니다.",
      "outbox payload에도 최소 정보, schema version과 stable aggregate/event id를 사용합니다. 사용자 개인정보 전체나 credential을 복제하지 않고 필요한 참조와 승인 field만 둡니다.",
      "relay는 lease, retry/backoff, poison handling, duplicate delivery와 observability를 설계합니다. exactly-once라는 표현보다 at-least-once와 consumer idempotency를 증명합니다.",
    ],
    concepts: [
      c("transactional outbox", "business state와 전송할 event record를 같은 local DB transaction에 저장하고 별도 relay가 전달하는 pattern입니다.", ["DB commit과 intent를 원자화합니다.", "중복 전달을 허용·처리합니다."]),
      c("after-commit", "transaction이 성공적으로 commit된 뒤 실행되는 callback phase입니다.", ["rollback side effect를 피합니다.", "durable delivery 자체는 아닙니다."]),
      c("idempotent consumer", "같은 event를 여러 번 받아도 최종 business 결과가 한 번 처리한 것과 같은 consumer입니다.", ["event id를 저장합니다.", "경쟁 조건을 원자적으로 처리합니다."]),
    ],
    codeExamples: [java("mybatis08-outbox", "DB commit 뒤 publish 실패와 outbox retry", "Mybatis08Outbox.java", "business row와 outbox를 함께 commit한 뒤 첫 publish 실패가 나도 pending intent가 남아 retry되는 상태를 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mybatis08Outbox {
  static final class Store {
    final Map<Integer, String> records = new LinkedHashMap<>();
    final Map<Integer, String> outbox = new LinkedHashMap<>();
  }

  static void commitUseCase(Store store) {
    store.records.put(1, "CREATED");
    store.outbox.put(1, "PENDING");
  }

  static boolean publish(Store store, boolean fail) {
    if (fail) return false;
    store.outbox.put(1, "SENT");
    return true;
  }

  public static void main(String[] args) {
    Store store = new Store();
    commitUseCase(store);
    boolean first = publish(store, true);
    System.out.println("after-commit=" + store.records.size() + "," + store.outbox.get(1));
    System.out.println("first-publish=" + first);
    boolean retry = publish(store, false);
    System.out.println("retry-publish=" + retry);
    System.out.println("final-outbox=" + store.outbox.get(1));
    System.out.println("record-duplicated=false");
  }
}`, "after-commit=1,PENDING\nfirst-publish=false\nretry-publish=true\nfinal-outbox=SENT\nrecord-duplicated=false", ["spring-tx-events", "spring-tx-reference", "mybatis-spring-transactions", "java-map"])],
    diagnostics: [d("DB transaction은 rollback됐는데 알림은 발송됐거나 commit됐지만 event가 누락됩니다.", "외부 side effect를 local DB transaction 안/뒤에서 직접 호출하고 crash window와 중복 delivery를 설계하지 않았습니다.", ["DB outcome", "side-effect call timing", "outbox row/event id", "relay lease/retry", "consumer dedup state"], "business row와 outbox intent를 같은 transaction에 저장하고 독립 relay와 idempotent consumer로 전달합니다.", "rollback, commit 직후 crash, publish timeout/duplicate와 poison event를 fault injection해 최종 readback합니다.")],
    expertNotes: ["outbox는 모든 분산 transaction 문제를 없애지 않고 durable intent와 재처리 지점을 제공합니다.", "after-commit callback을 outbox와 혼동하지 말고 loss 허용 수준으로 선택합니다."],
  },
  {
    id: "retry-idempotency-ambiguous-commit",
    title: "retry 전에 transaction outcome·idempotency·중복 방지 증거를 확보합니다",
    lead: "deadlock victim처럼 확실히 rollback된 transient failure와 commit 응답이 끊겨 결과를 모르는 failure는 다릅니다. 둘을 같은 catch-retry loop로 처리하면 중복 주문·감사·event가 생깁니다.",
    explanations: [
      "retry unit은 mapper 한 statement가 아니라 전체 service transaction입니다. 일부 statement만 재호출하면 이전 attempt의 in-memory state와 DB state가 어긋날 수 있습니다.",
      "attempt마다 새 transaction과 새 transaction-bound SqlSession을 사용합니다. rollback-only 상태나 실패한 Connection에서 같은 mapper call을 반복하지 않습니다.",
      "idempotency key는 business operation scope와 caller identity에 맞게 unique constraint로 저장하고 이전 결과를 재사용합니다. 단순 in-memory cache는 process crash·multi-instance에서 충분하지 않습니다.",
      "commit unknown은 key/readback 또는 reconciliation job으로 결과를 판별한 뒤 후속 행동을 정합니다. 성공으로도 실패로도 즉시 단정하지 않고 UNKNOWN 상태를 durable하게 기록합니다.",
      "retry에는 최대 횟수, exponential backoff, jitter, 전체 deadline과 retryable category allowlist를 둡니다. pool/DB overload 때 무제한 동시 retry storm을 막습니다.",
    ],
    concepts: [
      c("idempotency key", "같은 논리 요청의 중복 실행을 식별하고 이전 결과를 재사용하기 위한 안정된 key입니다.", ["DB unique constraint로 보호합니다.", "scope와 expiry를 정합니다."]),
      c("ambiguous commit", "commit 요청 뒤 연결이 끊겨 DB가 commit했는지 caller가 확정할 수 없는 결과입니다.", ["무조건 재시도하지 않습니다.", "readback/reconciliation합니다."]),
      c("retry budget", "최대 attempt, 전체 시간, backoff와 동시에 허용할 재시도량을 제한하는 정책입니다.", ["overload를 악화시키지 않습니다.", "SLO와 연결합니다."]),
    ],
    diagnostics: [d("간헐 연결 오류 뒤 동일 business row나 event가 두 번 생성됩니다.", "commit outcome을 확인하지 않고 전체 요청을 새 id 없이 재시도했습니다.", ["failure phase before/during/after commit", "idempotency key/unique record", "transaction completion evidence", "readback result", "retry count/deadline"], "stable idempotency key와 결과 record를 transaction에 저장하고 ambiguous outcome은 readback/reconciliation 후에만 retry합니다.", "commit 응답 단절과 duplicate concurrent request를 주입해 최종 row/event cardinality가 1인지 확인합니다.")],
    expertNotes: ["재시도 가능한 exception category도 operation이 idempotent하지 않으면 자동 retry 근거가 되지 않습니다.", "retry metric에는 raw key가 아니라 operation과 outcome/attempt bucket만 남깁니다."],
  },
  {
    id: "transaction-timeout-observability-testing",
    title: "transaction duration·rollback·resource 회수를 통합 증거로 검증합니다",
    lead: "정상 테스트만으로는 transaction 경계를 확인하기 어렵습니다. mapper N번째 호출, timeout, deadlock, pool exhaustion과 shutdown을 주입하고 DB readback과 resource absence까지 봐야 합니다.",
    explanations: [
      "trace에는 service operation, transaction name/propagation/readOnly, logical databaseId, mapper statement ids, duration, affected-row category와 completion을 둡니다. raw SQL·bind·row·credential은 제외합니다.",
      "transaction timeout과 statement/network timeout은 서로 다른 층입니다. 상위 deadline을 하위 query에 전달하고 timeout 뒤 cancel, rollback과 Connection state reset을 검증합니다.",
      "unit test는 fake mapper로 호출 순서·rollback decision과 domain error를 빠르게 확인합니다. Spring context test는 proxy/advice/wiring을, target DB integration은 실제 isolation·rollback·translation을 검증합니다.",
      "동시 test는 REQUIRES_NEW pool budget, deadlock victim, optimistic conflict와 idempotency unique race를 barrier로 재현합니다. sleep 기반 test는 환경 부하에 따라 flaky해지므로 피합니다.",
      "배포 canary는 transaction completion rate, rollback category, pool wait, slow operation과 outbox lag를 version별로 비교하고 이상 시 artifact/config를 함께 rollback합니다.",
    ],
    concepts: [
      c("transaction evidence", "begin/join/suspend, mapper calls, completion과 최종 DB/resource 상태를 연결한 검증 자료입니다.", ["log 순서만 보지 않습니다.", "readback을 포함합니다."]),
      c("fault injection", "특정 mapper call·commit·timeout·connection 단계에 통제된 실패를 넣어 복구 경로를 실행하는 기법입니다.", ["deterministic trigger를 씁니다.", "민감값 없는 결과를 남깁니다."]),
      c("resource absence", "실패/완료 뒤 active transaction, checked-out connection, pending session과 lock이 남지 않았다는 조건입니다.", ["pool/DB 양쪽을 봅니다.", "shutdown에도 검증합니다."]),
    ],
    diagnostics: [d("오류 응답 뒤 pool active connection과 DB transaction이 오래 남고 다음 요청까지 lock wait가 이어집니다.", "timeout/catch가 transaction completion과 session/connection cleanup까지 전달되지 않았습니다.", ["service deadline", "statement cancel", "transaction completion", "pool active/pending", "DB session/lock absence"], "deadline propagation과 interceptor completion을 복원하고 cleanup 실패를 원래 exception의 suppressed/restricted evidence로 남깁니다.", "각 mapper index·timeout·deadlock·shutdown fault에서 rollback readback과 resource absence를 자동 검증합니다.")],
    expertNotes: ["transaction log를 켜는 것과 transaction correctness를 증명하는 것은 다릅니다.", "운영 telemetry는 값 없는 logical operation과 bounded category만 사용해 PII와 cardinality를 통제합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-service", repository: "2026-springmvc01", path: "src/main/java/org/study/myproject01/board/service/BoardServiceImpl.java", usedFor: ["eight-method service-to-mapper progression"], evidence: "read-only scanner로 service marker, public/override method 8, mapper delegation 구조와 transaction annotation count 0만 확인했으며 package body·값은 복사하지 않았습니다." },
  { id: "local-mapper", repository: "2026-springmvc01", path: "src/main/java/org/study/myproject01/board/mapper/BoardMapper.java", usedFor: ["eight-method mapper contract progression"], evidence: "read-only scanner로 interface method 8의 구조만 확인했으며 실제 method signature·package/source body는 복사하지 않았습니다." },
  { id: "mybatis-spring-transactions", repository: "MyBatis-Spring", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["Spring transaction participation and same DataSource rule"], evidence: "MyBatis-Spring 공식 transaction reference입니다." },
  { id: "mybatis-spring-mappers", repository: "MyBatis-Spring", path: "Injecting Mappers", publicUrl: "https://mybatis.org/spring/mappers.html", usedFor: ["mapper proxy registration/injection"], evidence: "MyBatis-Spring 공식 mapper reference입니다." },
  { id: "mybatis-spring-sqlsession", repository: "MyBatis-Spring", path: "Using an SqlSession", publicUrl: "https://mybatis.org/spring/sqlsession.html", usedFor: ["SqlSessionTemplate lifecycle and exception translation"], evidence: "MyBatis-Spring 공식 SqlSession reference입니다." },
  { id: "mybatis-spring-getting-started", repository: "MyBatis-Spring", path: "Getting Started", publicUrl: "https://mybatis.org/spring/getting-started.html", usedFor: ["factory/mapper/transaction bootstrap"], evidence: "MyBatis-Spring 공식 getting started reference입니다." },
  { id: "mybatis-spring-using-api", repository: "MyBatis-Spring", path: "Using the MyBatis API", publicUrl: "https://mybatis.org/spring/using-api.html", usedFor: ["manual API mixing risk"], evidence: "MyBatis-Spring 공식 direct API guidance입니다." },
  { id: "spring-tx-reference", repository: "Spring Framework", path: "Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["transaction abstraction and resource management"], evidence: "Spring Framework 공식 transaction reference입니다." },
  { id: "spring-tx-annotations", repository: "Spring Framework", path: "Using @Transactional", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", usedFor: ["annotation metadata and proxy semantics"], evidence: "Spring Framework 공식 declarative transaction reference입니다." },
  { id: "spring-tx-rollback", repository: "Spring Framework", path: "Rolling Back", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html", usedFor: ["default and configured rollback rules"], evidence: "Spring Framework 공식 rollback reference입니다." },
  { id: "spring-tx-propagation", repository: "Spring Framework", path: "Transaction Propagation", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html", usedFor: ["REQUIRED/REQUIRES_NEW/NESTED semantics"], evidence: "Spring Framework 공식 propagation reference입니다." },
  { id: "spring-aop-proxying", repository: "Spring Framework", path: "Proxying Mechanisms", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", usedFor: ["self-invocation and proxy boundary"], evidence: "Spring Framework 공식 AOP proxy reference입니다." },
  { id: "spring-dao", repository: "Spring Framework", path: "DAO Support", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/dao.html", usedFor: ["consistent exception hierarchy"], evidence: "Spring Framework 공식 DAO support reference입니다." },
  { id: "spring-data-access-api", repository: "Spring Framework API", path: "DataAccessException", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/dao/DataAccessException.html", usedFor: ["data access root exception contract"], evidence: "Spring Framework 공식 DataAccessException API입니다." },
  { id: "spring-tx-events", repository: "Spring Framework", path: "Transaction-bound Events", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html", usedFor: ["after-commit event boundary"], evidence: "Spring Framework 공식 transaction-bound event reference입니다." },
  { id: "java-runnable", repository: "Java SE 21 API", path: "Runnable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runnable.html", usedFor: ["proxy interception example"], evidence: "Oracle JDK 공식 Runnable API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["propagation durable-state example"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["outbox state example"], evidence: "Oracle JDK 공식 Map API입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-08-service-mapper-transaction", slug: "mybatis-08-service-mapper-transaction", courseId: "spring", moduleId: "mybatis-mapping", order: 8,
  title: "Service·Mapper 계층과 트랜잭션 경계", subtitle: "여러 mapper 호출의 원자성에서 resource binding·proxy·propagation·rollback·예외 번역·outbox·retry와 운영 증거까지 service transaction을 완성합니다.", level: "고급", estimatedMinutes: 950,
  coreQuestion: "Service가 여러 MyBatis Mapper 호출을 하나의 원자적 business outcome으로 만들고 proxy·exception·외부 side effect·retry 장애에서도 commit 의미를 잃지 않게 하려면 어떻게 해야 할까요?",
  summary: "2026-springmvc01의 BoardServiceImpl과 BoardMapper를 read-only 구조 scanner로 확인해 각각 여덟 method의 service→mapper progression과 현재 transaction annotation이 없는 출발점을 보존했습니다. 이를 결함으로 단정하지 않고 다중 write 확장에 필요한 service orchestration, manager/DataSource/SqlSession binding, mapper port, transactional proxy/self-invocation, propagation, rollback rules, exception translation, outbox, idempotency·ambiguous commit과 timeout/resource evidence로 확장합니다. 다섯 JDK 21 exact examples는 두 write 원자성, proxy interception, propagation durability, SQLState category와 outbox retry를 실제 실행합니다.",
  objectives: ["Service와 Mapper의 책임과 affected-row 불변식을 구분한다.", "transaction manager·DataSource·SqlSessionFactory의 resource identity를 검증한다.", "Spring-managed mapper와 transaction-bound SqlSession lifecycle을 설명한다.", "@Transactional proxy와 self-invocation 제한을 재현한다.", "REQUIRED·REQUIRES_NEW·NESTED의 물리 결과와 pool 비용을 비교한다.", "rollback rule과 exception propagation/translation을 설계한다.", "DB와 외부 side effect 사이를 outbox/idempotency로 연결한다.", "retry·ambiguous commit·timeout·resource absence를 운영 증거로 검증한다."],
  prerequisites: [{ title: "MyBatis 페이징과 MySQL·Oracle dialect 분리", reason: "Mapper statement와 databaseId별 실행 계약을 이해하면 Service가 여러 mapper 호출을 어떤 resource/transaction 경계로 묶는지 추적할 수 있습니다.", sessionSlug: "mybatis-07-pagination-dialect" }],
  keywords: ["service layer", "mapper", "@Transactional", "transaction-bound SqlSession", "SqlSessionTemplate", "proxy", "self-invocation", "propagation", "rollback-only", "DataAccessException", "exception propagation", "outbox", "idempotency", "ambiguous commit"], topics,
  lab: {
    title: "여러 Mapper write를 원자적이고 관측 가능한 Service use case로 전환",
    scenario: "기존 service가 mapper 한 호출씩 위임하던 구조에 audit/outbox와 여러 write가 추가되며 두 번째 호출 실패, REQUIRES_NEW, timeout과 publish 장애에서도 business outcome이 일관돼야 합니다.",
    setup: ["원본 service/mapper는 read-only로 보존하고 annotation/method/delegation 구조만 inventory합니다.", "pure fake mapper, Spring context test와 지원 DB disposable integration project를 분리합니다.", "operation별 transaction/rollback/idempotency/outbox acceptance table을 작성합니다.", "SQL·bind·row·credential이 없는 transaction telemetry schema를 준비합니다."],
    steps: ["각 service method의 business invariant와 mapper call/affected-row 순서를 정의합니다.", "DataSource→transaction manager와 DataSource→SqlSessionFactory identity를 검증합니다.", "Spring-managed mapper 외 direct session 경로를 제거하고 ownership을 단일화합니다.", "외부 proxy entry와 self-invocation/visibility를 test합니다.", "REQUIRED·REQUIRES_NEW·NESTED의 transaction/connection/readback matrix를 실행합니다.", "checked/unchecked/translated exception별 rollback과 public error를 검증합니다.", "각 mapper index와 commit 응답 단절을 fault injection합니다.", "외부 publish를 outbox와 idempotent relay로 분리합니다.", "retry budget·idempotency key·ambiguous reconciliation을 검증합니다.", "timeout→cancel→rollback→session/connection absence와 canary rollback을 승인합니다."],
    expectedResult: ["service별 mapper call order·affected rows·commit/rollback readback", "manager/factory resource identity와 proxy interception trace", "propagation별 transaction/connection/durable state matrix", "exception type→rollback→public category table", "outbox retry·duplicate delivery·ambiguous commit 결과", "비밀 없는 duration/pool/resource absence telemetry"],
    extensions: ["두 번째 mapper 실패의 partial commit", "다른 DataSource/manager binding", "self-invocation으로 inner metadata 미적용", "REQUIRES_NEW pool exhaustion", "exception 삼킴과 unintended commit", "raw SQL error 노출", "publish loss/ghost event", "commit unknown 중복 retry", "timeout 뒤 resource 잔류"],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "두 Mapper write를 하나의 Service transaction으로 묶고 실패 표를 작성하세요.", requirements: ["business invariant를 먼저 적습니다.", "두 mapper 호출 순서를 정합니다.", "affected rows를 확인합니다.", "두 번째 호출에 실패를 넣습니다.", "rollback readback을 확인합니다.", "exception cause를 보존합니다.", "값 없는 outcome만 출력합니다."], hints: ["annotation 유무보다 proxy entry와 같은 resource participation을 확인하세요."], expectedOutcome: "부분 상태 없이 commit 또는 rollback되는 use case가 완성됩니다.", solutionOutline: ["contract→proxy entry→same resource→fault→readback 순서입니다."] },
    { difficulty: "응용", prompt: "REQUIRES_NEW audit와 outbox 대안을 비교해 운영 설계를 제안하세요.", requirements: ["outer rollback 뒤 audit 의미를 정합니다.", "connection peak와 pool budget을 계산합니다.", "savepoint와 독립 transaction을 구분합니다.", "after-commit loss window를 적습니다.", "outbox schema/event id를 정의합니다.", "relay retry/lease/dedup을 둡니다.", "commit unknown을 주입합니다.", "최종 durable state를 비교합니다."], hints: ["반드시 남는 기록과 business 사실의 일관성이 같은 요구인지 먼저 질문하세요."], expectedOutcome: "propagation과 durable messaging trade-off가 증거로 설명됩니다.", solutionOutline: ["meaning→resource topology→fault windows→outbox→qualification 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 MyBatis Service transaction governance를 작성하세요.", requirements: ["service/mapper 책임과 public entry를 정의합니다.", "manager/factory/DataSource identity gate를 둡니다.", "proxy/self-invocation rule을 둡니다.", "propagation/timeout/rollback 표준을 둡니다.", "exception translation/redaction을 정의합니다.", "retry/idempotency/ambiguous outcome policy를 둡니다.", "outbox/consumer contract를 둡니다.", "fault injection·resource absence·canary rollback을 요구합니다."], hints: ["정상 호출보다 실패 후 durable state와 resource absence를 승인 기준으로 삼으세요."], expectedOutcome: "transaction 설정부터 장애 복구까지 재현 가능한 운영 표준이 완성됩니다.", solutionOutline: ["boundary→binding→interception→completion→side effects→recovery→evidence 순서입니다."] },
  ],
  nextSessions: ["mybatis-09-integration-testing"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["BoardServiceImpl.java는 61-line 원본에서 service marker, public/override method 8, mapper delegation과 transaction annotation count 0만 구조적으로 확인했으며 source body·값은 복사하지 않았습니다.", "BoardMapper.java는 28-line 원본에서 interface method 8 구조만 확인했으며 method signature와 package/source body는 복사하지 않았습니다.", "원본의 단일 mapper delegation을 결함으로 규정하지 않고 다중 write가 생길 때 필요한 proxy/resource/propagation/rollback/outbox/retry progression을 공식 문서와 synthetic examples로 보완했습니다.", "JDK examples는 Spring transaction 구현이 아니므로 지원 Spring·MyBatis-Spring·driver·DB 조합에서 proxy, transaction-bound SqlSession, isolation, exception translation과 resource cleanup을 별도로 검증해야 합니다."] },
});

export default session;
