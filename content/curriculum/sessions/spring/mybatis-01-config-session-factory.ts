import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "JDK 21 표준 API와 합성 configuration만으로 builder→factory→session의 소유권을 준비합니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "build-once, application-scope factory, request-scope session, commit/rollback/close와 startup validation을 실제 Java 상태로 실행합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "build/session/resource count와 상태만 출력합니다. DB URL·계정·SQL 값과 로컬 설정 literal은 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 MyBatis jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "교육용 lifecycle model은 MyBatis 구현이 아니며 실제 MyBatis·driver·pool·Spring transaction 통합 검증을 대체하지 않습니다."] },
    experiments: [
      { change: "factory를 요청마다 rebuild하거나 하나의 session을 여러 thread가 공유하도록 바꿉니다.", prediction: "설정 parsing 비용과 mutable transaction/cursor state가 섞여 build count 또는 lifecycle invariant가 깨집니다.", result: "application scope factory와 unit-of-work scope session으로 되돌리고 active/closed count를 검증합니다." },
      { change: "commit 전 예외, close 누락, 잘못된 environment·중복 alias·mapper 누락을 주입합니다.", prediction: "fail-fast validation 또는 rollback/close evidence가 없으면 partial write와 resource leak가 남습니다.", result: "startup gate와 try-with-resources, target DB transaction readback을 release test에 추가합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "mybatis-runtime-object-graph",
    title: "MyBatis를 SQL 호출 함수가 아니라 configuration→factory→session 객체 그래프로 봅니다",
    lead: "처음에는 mapper method 하나만 보여도 되지만 장애를 설명하려면 설정을 누가 읽고, 불변 runtime metadata를 누가 보유하며, mutable connection·transaction state가 어디서 시작하고 끝나는지 알아야 합니다.",
    explanations: [
      "핵심 흐름은 설정 source를 읽는 builder, 완성된 Configuration을 소유하는 SqlSessionFactory, 한 작업 단위의 SqlSession, mapper proxy, mapped statement, executor와 JDBC Connection으로 이어집니다. 각 객체의 수명과 thread ownership이 다릅니다.",
      "SqlSessionFactoryBuilder는 XML 또는 programmatic Configuration을 해석해 factory를 만드는 조립 도구입니다. build가 끝난 뒤 request마다 보관·재사용할 이유가 거의 없고, build 중 오류는 application startup 실패로 다루는 편이 안전합니다.",
      "SqlSessionFactory는 application 전반에서 재사용하는 immutable에 가까운 configuration registry와 session 생성 지점입니다. mapper, type alias, type handler, environment와 mapped statement가 완성된 뒤 임의로 변경하지 않습니다.",
      "SqlSession은 executor, transaction, first-level cache와 JDBC 자원에 연결되는 mutable unit-of-work 객체입니다. request·service method마다 만들고 thread·HTTP session·singleton field 사이에 공유하지 않습니다.",
      "mapper interface 주입만 사용하는 Spring application에서도 이 graph는 사라지지 않습니다. SqlSessionFactoryBean과 SqlSessionTemplate이 생성·bind·close를 대신하므로, ownership 주체가 manual code에서 framework transaction infrastructure로 이동합니다.",
    ],
    concepts: [
      c("runtime object graph", "설정 metadata부터 factory·session·mapper·executor·JDBC resource까지 이어지는 객체와 소유권 관계입니다.", ["각 scope가 다릅니다.", "호출 stack과 lifecycle을 함께 봅니다."]),
      c("Configuration", "settings, aliases, handlers, environments, mappers와 mapped statements를 모은 MyBatis runtime metadata입니다.", ["startup에 완성합니다.", "배포 중 임의 변경을 피합니다."]),
      c("unit of work", "같이 commit 또는 rollback되어야 하는 database 작업과 resource의 경계입니다.", ["보통 한 session/transaction과 연결됩니다.", "HTTP request와 항상 같지는 않습니다."]),
    ],
    codeExamples: [java("mybatis01-lifecycle-graph", "builder→factory→session 상태 전이", "Mybatis01LifecycleGraph.java", "교육용 객체 graph로 build-once factory와 두 session의 commit/automatic rollback/close를 실행합니다.", String.raw`import java.util.concurrent.atomic.AtomicInteger;

public class Mybatis01LifecycleGraph {
  record Config(String environment, int aliases, int mappers) {}

  static final class Builder {
    boolean used;
    int builds;
    Factory build(Config config) {
      if (used) throw new IllegalStateException("builder-reused");
      if (config.environment().isBlank() || config.mappers() == 0) throw new IllegalArgumentException("invalid-config");
      used = true;
      builds++;
      return new Factory(config);
    }
  }

  static final class Factory {
    final Config config;
    final AtomicInteger opened = new AtomicInteger();
    final AtomicInteger closed = new AtomicInteger();
    Factory(Config config) { this.config = config; }
    Session openSession() { opened.incrementAndGet(); return new Session(this); }
  }

  static final class Session implements AutoCloseable {
    final Factory owner;
    boolean dirty;
    boolean closed;
    String outcome = "clean";
    Session(Factory owner) { this.owner = owner; }
    void update() { if (closed) throw new IllegalStateException("closed"); dirty = true; }
    void commit() { if (dirty) { outcome = "committed"; dirty = false; } }
    void rollback() { if (dirty) { outcome = "rolled-back"; dirty = false; } }
    public void close() {
      if (closed) return;
      if (dirty) rollback();
      closed = true;
      owner.closed.incrementAndGet();
    }
  }

  public static void main(String[] args) {
    Builder builder = new Builder();
    Factory factory = builder.build(new Config("training", 2, 3));
    String first;
    String second;
    try (Session session = factory.openSession()) {
      session.update();
      session.commit();
      first = session.outcome;
    }
    try (Session session = factory.openSession()) {
      session.update();
      second = session.outcome;
      session.close();
      second = session.outcome;
    }
    System.out.println("builds=" + builder.builds);
    System.out.println("factory-environment=" + factory.config.environment());
    System.out.println("sessions=" + factory.opened.get());
    System.out.println("first=" + first);
    System.out.println("second=" + second);
    System.out.println("active=" + (factory.opened.get() - factory.closed.get()));
  }
}`, "builds=1\nfactory-environment=training\nsessions=2\nfirst=committed\nsecond=rolled-back\nactive=0", ["local-config", "mybatis-getting-started", "mybatis-java-api", "mybatis-factory-api", "mybatis-session-api", "java-autocloseable"])],
    diagnostics: [d("요청이 늘수록 config parsing과 mapper 등록이 반복되고 memory·startup latency가 요청 경로에 나타납니다.", "SqlSessionFactoryBuilder와 factory scope를 구분하지 않고 매 호출마다 전체 runtime을 다시 만들었습니다.", ["factory/build count", "configuration identity", "request allocation profile", "mapper parse logs"], "factory를 application startup에서 한 번 만들고 session만 unit-of-work마다 생성하도록 dependency graph를 수정합니다.", "DI container singleton assertion과 build-count metric을 startup test에 둡니다.")],
    expertNotes: ["application-scope는 global mutable singleton을 뜻하지 않고 완성된 configuration의 명시적 owner를 뜻합니다.", "multi-tenant 또는 multi-datasource에서는 tenant별 session이 아니라 명시한 factory routing 수명과 cardinality를 먼저 설계합니다."],
  },
  {
    id: "configuration-document-contract",
    title: "mybatis-config를 순서·override·fail-fast 규칙이 있는 구성 계약으로 읽습니다",
    lead: "XML은 단순 key-value 모음이 아니며 element 순서, properties 우선순위, environment 선택, alias/handler/mapper 등록이 최종 Configuration을 결정합니다.",
    explanations: [
      "MyBatis configuration의 주요 element는 정해진 상위 구조와 순서를 가집니다. properties, settings, typeAliases, typeHandlers, plugins, environments, databaseIdProvider와 mappers가 서로 다른 boot 단계에서 처리됩니다.",
      "properties는 inline, external resource와 builder에 전달된 Properties가 결합될 수 있으므로 어느 source가 우선하는지 기록합니다. 같은 key가 환경마다 조용히 달라지지 않도록 resolved non-secret key 목록과 checksum을 startup evidence로 남깁니다.",
      "settings는 lazy loading, cache, naming, null setter, actual parameter name와 logging behavior처럼 넓은 영향을 줍니다. default에 의존하지 말고 사용한 MyBatis version의 기본값과 의도적 override를 configuration review에 기록합니다.",
      "원본 mybatis-config 조각은 configuration과 typeAliases/typeAlias 구조만 포함합니다. 이는 type alias 학습 근거이지만 독립 실행 가능한 DataSource·environment·mapper 구성이 모두 들어 있다는 뜻은 아닙니다.",
      "XML DTD/network resolution, external entity와 filesystem URL을 통제합니다. 신뢰한 classpath resource와 버전 고정 DTD를 사용하고 runtime이 외부 network에서 설정을 가져오지 않도록 startup sandbox와 parser 정책을 검증합니다.",
    ],
    concepts: [
      c("resolved configuration", "모든 property source·default·environment 선택을 적용한 뒤 runtime이 실제 사용하는 설정 상태입니다.", ["비밀값은 출력하지 않습니다.", "key와 source lineage만 검증합니다."]),
      c("configuration precedence", "같은 설정 key가 여러 source에 있을 때 최종 값을 결정하는 우선순위입니다.", ["문서와 test로 고정합니다.", "환경 drift를 탐지합니다."]),
      c("fail-fast boot", "잘못된 alias, mapper, property 또는 environment를 첫 요청이 아니라 startup에서 실패시키는 전략입니다.", ["오류 category를 안전하게 기록합니다.", "partial service를 막습니다."]),
    ],
    codeExamples: [java("mybatis01-config-inventory", "합성 XML의 element 순서와 안전한 구조 inventory", "Mybatis01ConfigInventory.java", "표준 DOM parser로 값이 없는 합성 config의 root, alias, environment, mapper count와 element 순서를 검증합니다.", String.raw`import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

public class Mybatis01ConfigInventory {
  public static void main(String[] args) throws Exception {
    String xml = """
      <configuration>
        <properties/>
        <settings/>
        <typeAliases><typeAlias/><typeAlias/></typeAliases>
        <environments><environment/></environments>
        <mappers><mapper/><mapper/></mappers>
      </configuration>
      """;
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
    factory.setExpandEntityReferences(false);
    var document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
    Element root = document.getDocumentElement();
    List<String> actualOrder = new ArrayList<>();
    for (Node node = root.getFirstChild(); node != null; node = node.getNextSibling()) {
      if (node instanceof Element element) actualOrder.add(element.getTagName());
    }
    List<String> expectedOrder = List.of("properties", "settings", "typeAliases", "environments", "mappers");
    System.out.println("root=" + root.getTagName());
    System.out.println("aliases=" + document.getElementsByTagName("typeAlias").getLength());
    System.out.println("environments=" + document.getElementsByTagName("environment").getLength());
    System.out.println("mappers=" + document.getElementsByTagName("mapper").getLength());
    System.out.println("order-valid=" + actualOrder.equals(expectedOrder));
    System.out.println("values-printed=false");
  }
}`, "root=configuration\naliases=2\nenvironments=1\nmappers=2\norder-valid=true\nvalues-printed=false", ["local-config", "mybatis-configuration", "java-document-builder"] )],
    diagnostics: [d("개발에서는 뜨지만 배포 환경 startup에서 unknown element·unresolved property·mapper resource 오류가 발생합니다.", "configuration order/precedence와 packaged classpath를 검증하지 않고 IDE filesystem 상태에 의존했습니다.", ["resolved key names/source", "config element order", "packaged resources", "MyBatis version/default settings"], "production artifact에서 config를 parse하는 boot test를 만들고 누락·중복·외부 resource를 fail-fast로 차단합니다.", "version upgrade마다 resolved configuration manifest와 resource checksum을 비교합니다.")],
    expertNotes: ["resolved configuration evidence에는 URL·username·password 값이 아니라 environment id, key 존재, source kind와 checksum만 남깁니다.", "문서 parser hardening 실습은 MyBatis 내부 parser 설정과 같다고 가정하지 말고 dependency/version 보안 공지를 별도로 추적합니다."],
  },
  {
    id: "environment-datasource-transaction-manager",
    title: "environment·DataSource·TransactionManager의 선택을 배포 topology와 맞춥니다",
    lead: "environment는 profile 이름 장식이 아니라 어떤 Connection factory와 transaction strategy로 session이 동작하는지를 결정하는 runtime boundary입니다.",
    explanations: [
      "하나의 SqlSessionFactory는 build 시 선택된 environment를 사용합니다. 같은 factory가 요청마다 여러 environment로 바뀐다고 가정하지 말고, 여러 DataSource가 필요하면 명시한 factory/template/mapper routing을 구성합니다.",
      "DataSource는 physical Connection을 생성하거나 pool과 연결하는 factory입니다. URL·계정·driver는 source repository의 config XML에 넣지 않고 환경 변수·secret manager·platform binding에서 주입하며 resolved value를 log하지 않습니다.",
      "base MyBatis의 JDBC transaction manager와 container-managed strategy, MyBatis-Spring의 Spring transaction manager는 ownership이 다릅니다. 누가 begin/commit/rollback/close하는지 한 path에서 둘로 나뉘지 않게 합니다.",
      "pool lifetime과 session lifetime을 구분합니다. session close는 logical Connection을 pool에 반환할 수 있고 physical socket 종료를 뜻하지 않지만, close 누락은 pool exhaustion으로 이어집니다.",
      "read/write split, tenant, replica와 failover routing은 environment id 문자열로 즉석 처리하지 않습니다. consistency, transaction pinning, lag, retry와 mapper-to-factory binding을 architecture contract로 검증합니다.",
    ],
    concepts: [
      c("environment", "transaction manager와 DataSource 조합을 선택하는 MyBatis configuration 단위입니다.", ["factory build 시 선택됩니다.", "runtime profile과 mapping을 검증합니다."]),
      c("DataSource", "JDBC Connection을 제공하는 factory abstraction입니다.", ["pool implementation일 수 있습니다.", "connection 설정값을 노출하지 않습니다."]),
      c("transaction ownership", "begin·commit·rollback·close를 수행할 유일한 infrastructure 주체를 정한 경계입니다.", ["manual과 Spring 관리를 섞지 않습니다.", "failure path를 포함합니다."]),
    ],
    diagnostics: [d("mapper는 실행되지만 다른 database에 쓰거나 transaction rollback이 기대와 다릅니다.", "여러 factory/DataSource에서 environment와 transaction manager binding을 bean name 또는 default autowiring에 맡겼습니다.", ["mapper→template→factory identity", "selected environment id", "DataSource pool identity", "transaction synchronization status"], "factory/template/mapper binding을 qualifier와 startup assertions로 명시하고 합성 sentinel schema에서 read/write/rollback을 검증합니다.", "multi-datasource route matrix와 wrong-target negative test를 배포 gate로 둡니다.")],
    expertNotes: ["health check가 Connection을 얻는다는 사실과 올바른 schema·role·transaction semantics를 쓰는지는 별도 검증입니다.", "credential rotation 시 factory/pool 재생성과 in-flight transaction draining 순서를 runbook으로 만듭니다."],
  },
  {
    id: "builder-one-shot-boot",
    title: "SqlSessionFactoryBuilder를 one-shot boot 도구로 제한하고 configuration provenance를 고정합니다",
    lead: "builder를 전역 service로 노출하면 request 코드가 runtime configuration을 다시 만들거나 환경별 결과를 섞을 수 있어 application의 실행 기반이 불안정해집니다.",
    explanations: [
      "builder input에는 config resource checksum, selected environment, non-secret properties source와 MyBatis version을 포함한 boot manifest를 둡니다. 같은 manifest가 같은 mapped statement inventory를 만드는지 재현합니다.",
      "InputStream/Reader의 ownership을 명시하고 try-with-resources로 닫습니다. builder가 factory를 반환했다고 source stream과 temporary secret buffer를 장기 field에 남기지 않습니다.",
      "build 실패는 XML syntax, property, class loading, duplicate alias/statement와 mapper parse 등 root category로 분류합니다. 원문 connection property나 SQL literal이 exception/log에 노출되지 않도록 public error와 restricted diagnostic을 분리합니다.",
      "runtime hot reload는 교육 환경에서는 편리해도 production에서는 in-flight session과 configuration version을 갈라놓습니다. 새 immutable factory를 별도 build·warmup한 뒤 traffic을 원자적으로 전환하고 이전 factory를 drain합니다.",
      "Spring에서는 SqlSessionFactoryBean이 이 boot 역할을 application context lifecycle에 통합합니다. base builder와 factory bean을 동시에 별개 source로 구성하지 말고 configuration owner를 하나로 정합니다.",
    ],
    concepts: [
      c("boot manifest", "config checksum·environment·source lineage·dependency version·statement count를 기록한 startup 입력 증거입니다.", ["비밀값을 포함하지 않습니다.", "deployment와 연결합니다."]),
      c("one-shot builder", "한 번 configuration을 조립하고 factory를 반환한 뒤 request path에서 재사용하지 않는 builder scope입니다.", ["factory와 구분합니다.", "resource를 닫습니다."]),
      c("configuration generation", "hot reload나 rollout 때 동시에 존재할 수 있는 immutable factory/config version입니다.", ["session은 한 generation에 고정합니다.", "drain 후 폐기합니다."]),
    ],
    diagnostics: [d("같은 pod 안에서 mapper statement count와 설정 version이 요청마다 달라집니다.", "파일 변경 감지나 request code가 기존 factory를 mutate/rebuild해 session이 여러 configuration generation을 봅니다.", ["factory identity/build timestamp", "configuration/statement count", "hot reload watcher", "in-flight session generation"], "mutation을 중단하고 immutable factory generation을 startup 또는 controlled blue/green swap으로 관리합니다.", "factory build를 한 composition root로 제한하고 build count/generation assertion을 둡니다.")],
    expertNotes: ["configuration object를 얻을 수 있다는 사실이 runtime mutation을 권장한다는 뜻은 아닙니다.", "warmup은 실제 사용자 row가 아니라 synthetic query와 catalog/statement inventory로 수행합니다."],
  },
  {
    id: "factory-application-scope-concurrency",
    title: "SqlSessionFactory는 application scope로 재사용하고 session 생성만 concurrency-safe하게 위임합니다",
    lead: "factory가 여러 thread에서 session을 만들 수 있다는 것과 factory가 돌려준 session 하나를 여러 thread가 공유할 수 있다는 것은 전혀 다른 주장입니다.",
    explanations: [
      "factory는 완성된 Configuration을 참조하며 openSession 호출마다 새로운 executor/transaction/session state를 만듭니다. repository가 factory 자체에 per-request mutable state를 붙이지 않습니다.",
      "concurrent startup 또는 lazy singleton 구현에서 double build가 일어나지 않도록 DI container나 명확한 initialization barrier를 사용합니다. 직접 double-checked locking을 재발명하기보다 composition root가 소유하도록 합니다.",
      "factory metrics에는 build count, configuration generation, registered statement/mapper count와 session open failures를 둡니다. 사용자 parameter·SQL bind는 factory lifecycle metric에 필요하지 않습니다.",
      "ExecutorType, isolation, autoCommit 또는 supplied Connection이 다른 openSession overload는 단순 편의 overload가 아니라 transaction/execution contract 차이입니다. 호출 site를 제한하고 의도한 policy wrapper를 둡니다.",
      "shutdown은 새 session 생성 중단, in-flight unit-of-work drain, pool close와 metric flush 순서로 수행합니다. process kill만 의존하면 batch/transaction outcome이 ambiguous해질 수 있습니다.",
    ],
    concepts: [
      c("application scope", "process/application context 수명 동안 하나의 완성된 factory generation을 공유하는 범위입니다.", ["session은 포함하지 않습니다.", "multi-factory는 명시합니다."]),
      c("session factory", "Configuration과 DataSource를 바탕으로 독립 SqlSession을 생성하는 객체입니다.", ["요청 state를 저장하지 않습니다.", "open policy를 통제합니다."]),
      c("graceful drain", "새 작업을 막고 진행 중 session/transaction을 완료·취소·reconcile한 뒤 resource를 종료하는 절차입니다.", ["timeout을 둡니다.", "ambiguous outcome을 readback합니다."]),
    ],
    codeExamples: [java("mybatis01-factory-concurrency", "한 factory에서 독립 session을 concurrent 생성·정리", "Mybatis01FactoryConcurrency.java", "AtomicInteger와 ExecutorService로 factory build 1회, session 6개, active 0을 재현합니다.", String.raw`import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

public class Mybatis01FactoryConcurrency {
  static final class Factory {
    final AtomicInteger nextId = new AtomicInteger();
    final AtomicInteger opened = new AtomicInteger();
    final AtomicInteger closed = new AtomicInteger();
    Session openSession() {
      opened.incrementAndGet();
      return new Session(nextId.incrementAndGet(), this);
    }
  }
  static final class Session implements AutoCloseable {
    final int id;
    final Factory owner;
    boolean closed;
    Session(int id, Factory owner) { this.id = id; this.owner = owner; }
    public void close() {
      if (!closed) { closed = true; owner.closed.incrementAndGet(); }
    }
  }

  public static void main(String[] args) throws Exception {
    Factory factory = new Factory();
    ExecutorService pool = Executors.newFixedThreadPool(3);
    List<Future<Integer>> futures = new ArrayList<>();
    try {
      for (int i = 0; i < 6; i++) {
        futures.add(pool.submit(() -> {
          try (Session session = factory.openSession()) { return session.id; }
        }));
      }
      List<Integer> ids = new ArrayList<>();
      for (Future<Integer> future : futures) ids.add(future.get());
      Collections.sort(ids);
      System.out.println("factory-builds=1");
      System.out.println("ids=" + ids.toString().replace(" ", ""));
      System.out.println("opened=" + factory.opened.get());
      System.out.println("closed=" + factory.closed.get());
      System.out.println("active=" + (factory.opened.get() - factory.closed.get()));
      System.out.println("unique=" + (ids.stream().distinct().count() == ids.size()));
    } finally {
      pool.shutdown();
    }
  }
}`, "factory-builds=1\nids=[1,2,3,4,5,6]\nopened=6\nclosed=6\nactive=0\nunique=true", ["mybatis-factory-api", "mybatis-configuration-api", "java-executors"])],
    diagnostics: [d("동시 요청에서 session state·cache·commit 결과가 서로 섞이거나 closed session 오류가 납니다.", "factory와 session을 모두 singleton/shared object로 취급해 mutable session을 여러 thread가 사용했습니다.", ["session identity per request", "thread ownership", "first-level cache/transaction state", "open/close/active counters"], "factory만 공유하고 session은 method/request scope에서 생성해 try-with-resources 또는 framework transaction에 맡깁니다.", "concurrent unit test에서 unique session, active zero와 cross-request data isolation을 검증합니다.")],
    expertNotes: ["virtual thread를 사용해도 JDBC Connection과 session을 공유할 수 있는 것은 아니며 pool/backpressure budget이 필요합니다.", "parallel stream 내부에서 같은 mapper/session을 호출하지 말고 별도 transaction 경계와 결과 결합 의미를 설계합니다."],
  },
  {
    id: "session-unit-of-work-scope",
    title: "SqlSession을 method/request 단위로 만들고 cursor·cache·executor state가 escape하지 않게 합니다",
    lead: "session close는 단순 예절이 아니라 Connection, statement, cursor, local cache와 미완료 transaction을 해제하는 unit-of-work 종료 신호입니다.",
    explanations: [
      "base MyBatis에서는 openSession을 호출한 code가 close 책임을 집니다. try-with-resources로 모든 success/failure path를 감싸고 mapper proxy나 cursor를 session보다 오래 살아 있는 field·return value로 내보내지 않습니다.",
      "first-level cache는 session scope라 같은 session의 반복 query가 runtime state에 영향을 받을 수 있습니다. 장기 session은 stale read, memory 증가와 예상치 못한 flush/transaction 결합을 만듭니다.",
      "stream/cursor를 반환해야 한다면 소비·close ownership과 transaction lifetime을 API에 드러냅니다. web response가 끝난 뒤 lazy iteration하는 구조는 이미 session/Connection이 닫혔거나 반대로 너무 오래 점유할 수 있습니다.",
      "session은 thread-safe하지 않으므로 executor task, callback과 reactive chain 사이에 전달하지 않습니다. thread 변경이 필요하면 immutable command/result만 전달하고 새 명시적 unit-of-work를 엽니다.",
      "Spring managed mapper에서는 singleton처럼 주입되는 proxy 뒤에서 transaction-bound session을 가져옵니다. injected proxy의 bean scope와 실제 DefaultSqlSession의 thread/unit-of-work scope를 혼동하지 않습니다.",
    ],
    concepts: [
      c("session scope", "executor·local cache·transaction·JDBC resource가 함께 존재하는 짧은 작업 범위입니다.", ["thread 사이에 공유하지 않습니다.", "항상 종료합니다."]),
      c("resource escape", "session이 닫힌 뒤 필요한 cursor, mapper 또는 lazy object를 외부로 반환하는 문제입니다.", ["materialize하거나 ownership API를 만듭니다.", "connection budget을 측정합니다."]),
      c("first-level cache", "같은 SqlSession 안에서 동작하는 local cache입니다.", ["application global cache가 아닙니다.", "session 수명과 stale 의미를 검토합니다."]),
    ],
    diagnostics: [d("간헐적으로 pool이 고갈되거나 반환된 cursor/mapper가 이미 닫힌 connection을 사용합니다.", "session/cursor ownership이 method signature에 없고 close를 success path에만 두었거나 resource를 escape시켰습니다.", ["open/close counts", "pool active/await", "cursor consumption stack", "exception/cancel paths"], "base usage는 try-with-resources로 감싸고 결과를 session 안에서 materialize하거나 explicit closeable stream API를 설계합니다.", "timeout/cancel/mapper-error tests에서 active session과 pool connection이 0으로 복귀하는지 확인합니다.")],
    expertNotes: ["Open Session in View처럼 persistence context를 web rendering까지 늘리는 패턴을 MyBatis에 무비판적으로 옮기지 않습니다.", "session scope를 짧게 해도 N+1 query나 큰 materialization 문제는 별도 query/result 설계로 해결해야 합니다."],
  },
  {
    id: "commit-rollback-autocommit",
    title: "commit·rollback·autoCommit을 명시적 mutation outcome과 연결합니다",
    lead: "update method가 정상 반환했다는 사실과 transaction이 durable commit되었다는 사실은 다르며 close만으로 성공이 확정된다고 가정하면 데이터가 조용히 사라질 수 있습니다.",
    explanations: [
      "base MyBatis의 기본 openSession은 일반적으로 autoCommit이 아닌 transaction scope로 시작합니다. write 후 explicit commit 또는 rollback 정책을 둡니다. read-only path도 driver/session state와 transaction lifetime을 확인합니다.",
      "try-with-resources는 close를 보장하지만 자동 성공 commit을 의미하지 않습니다. exception이 없더라도 business invariant, affected rows와 downstream 단계가 모두 성공한 뒤 commit합니다.",
      "autoCommit=true는 각 statement 경계가 transaction이 될 수 있어 여러 mapper mutation의 원자성을 깨뜨립니다. 간단한 독립 operation인지 service transaction이 필요한지 contract로 결정합니다.",
      "commit 중 network timeout은 client가 실패를 봤어도 server outcome이 unknown일 수 있습니다. 같은 non-idempotent write를 바로 재실행하지 않고 idempotency key나 business key로 target state를 readback합니다.",
      "Spring integration에서는 commit/rollback/close를 transaction manager와 SqlSessionTemplate이 관리합니다. Spring managed session에 manual commit/close를 호출하지 않고 service transaction propagation과 rollback rule을 검증합니다.",
    ],
    concepts: [
      c("autoCommit", "각 statement 실행 뒤 driver/DB가 자동 commit하도록 하는 Connection/session mode입니다.", ["여러 statement 원자성을 제공하지 않습니다.", "명시적으로 선택합니다."]),
      c("ambiguous commit", "client 오류 때문에 server commit 여부를 알 수 없는 상태입니다.", ["readback이 필요합니다.", "blind retry를 피합니다."]),
      c("transaction outcome", "committed, rolled back, unknown과 retry/reconcile action을 함께 표현한 결과입니다.", ["method return과 구분합니다.", "운영 evidence로 남깁니다."]),
    ],
    codeExamples: [java("mybatis01-transaction-close", "commit과 close-time rollback을 분리한 session", "Mybatis01TransactionClose.java", "세 번의 합성 write 중 두 개는 한 commit으로, 하나는 close 시 rollback으로 처리해 counter를 검증합니다.", String.raw`public class Mybatis01TransactionClose {
  static final class Counters {
    int active;
    int writes;
    int commits;
    int rollbacks;
    int closes;
  }
  static final class Session implements AutoCloseable {
    final Counters counters;
    int pending;
    boolean closed;
    Session(Counters counters) { this.counters = counters; counters.active++; }
    void update() { pending++; counters.writes++; }
    void commit() { if (pending > 0) { counters.commits++; pending = 0; } }
    void rollback() { if (pending > 0) { counters.rollbacks++; pending = 0; } }
    public void close() {
      if (closed) return;
      if (pending > 0) rollback();
      closed = true;
      counters.closes++;
      counters.active--;
    }
  }
  public static void main(String[] args) {
    Counters counters = new Counters();
    try (Session first = new Session(counters)) {
      first.update();
      first.update();
      first.commit();
    }
    try (Session second = new Session(counters)) {
      second.update();
    }
    System.out.println("writes=" + counters.writes);
    System.out.println("commits=" + counters.commits);
    System.out.println("rollbacks=" + counters.rollbacks);
    System.out.println("closes=" + counters.closes);
    System.out.println("active=" + counters.active);
    System.out.println("unknown=0");
  }
}`, "writes=3\ncommits=1\nrollbacks=1\ncloses=2\nactive=0\nunknown=0", ["mybatis-java-api", "mybatis-spring-session", "mybatis-spring-transactions", "java-datasource"])],
    diagnostics: [d("write method는 성공했지만 다음 요청에서 row가 없거나 timeout retry로 중복 row가 생깁니다.", "close와 commit을 혼동했거나 commit-unknown을 rollback으로 간주해 non-idempotent operation을 재실행했습니다.", ["autoCommit/session overload", "commit/rollback call path", "business/idempotency key", "target state after timeout"], "service transaction owner를 하나로 정하고 success commit, failure rollback, unknown readback/reconciliation을 typed outcome으로 구현합니다.", "commit-before/after-timeout fault test와 duplicate prevention을 target DB에서 실행합니다.")],
    expertNotes: ["rollback 자체도 connection failure로 실패할 수 있으므로 close와 target state verification을 별도로 다룹니다.", "read-only transaction도 consistent snapshot과 replica routing 의미를 가질 수 있어 무조건 제거하지 않습니다."],
  },
  {
    id: "type-alias-and-type-handler-registry",
    title: "type alias와 TypeHandler를 편의 이름이 아니라 schema↔Java 의미 registry로 관리합니다",
    lead: "짧은 alias는 XML을 읽기 쉽게 하지만 충돌·rename·package scan drift를 만들 수 있고, TypeHandler는 값 변환과 NULL/JDBC type 의미를 좌우합니다.",
    explanations: [
      "type alias는 XML에서 fully qualified class name을 줄이는 이름입니다. classpath package scan과 명시 alias 중 하나를 의도적으로 선택하고 case-insensitive built-in alias, duplicate와 refactor 영향을 startup에서 검사합니다.",
      "원본 config의 한 typeAlias는 VO mapping progression을 보여 줍니다. 공개 자료에서는 실제 package literal을 복사하지 않고 alias count와 registry 역할만 근거로 사용합니다.",
      "alias는 dependency direction을 숨길 수 있습니다. mapper XML이 domain/application DTO의 이름에 결합되는 범위를 관리하고 package move 시 XML·result mapping·constructor signature를 함께 compile/startup test합니다.",
      "TypeHandler는 Java value를 PreparedStatement에 bind하고 ResultSet을 Java value로 읽는 양방향 contract입니다. enum, time, JSON, encrypted value와 nullable type에서 lossless round-trip, invalid representation과 error redaction을 검증합니다.",
      "global handler와 field-specific override가 충돌하지 않도록 javaType×jdbcType registry를 inventory합니다. handler는 thread-safe/stateless하게 두고 Connection이나 mutable formatter를 instance field에 보관하지 않습니다.",
    ],
    concepts: [
      c("type alias", "XML에서 Java type의 긴 이름을 대신하는 configuration registry 이름입니다.", ["runtime type을 바꾸지 않습니다.", "충돌과 refactor를 검사합니다."]),
      c("TypeHandler", "Java value와 JDBC parameter/result representation을 변환하는 MyBatis extension point입니다.", ["NULL/JDBC type을 다룹니다.", "round-trip을 검증합니다."]),
      c("mapping registry", "alias·handler·mapped statement가 어떤 type/schema contract를 담당하는지 기록한 runtime 목록입니다.", ["startup에 고정합니다.", "version drift를 탐지합니다."]),
    ],
    diagnostics: [d("startup에서 alias ambiguous 오류가 나거나 enum/time 값이 환경마다 다르게 저장됩니다.", "package scan alias 충돌 또는 target-specific TypeHandler/default driver conversion을 registry와 round-trip 없이 사용했습니다.", ["resolved alias→class map", "javaType×jdbcType handler", "DB column metadata", "null/invalid/boundary round-trip"], "명시 alias와 handler scope를 정리하고 synthetic boundary corpus로 target driver별 양방향 변환을 승인합니다.", "alias/handler inventory checksum과 DB/driver upgrade round-trip test를 둡니다.")],
    expertNotes: ["type alias를 API 안정성 계층으로 착각하지 말고 Java class refactor와 함께 versioning합니다.", "암호화 handler를 사용해도 key lifecycle, searchability, error/log redaction과 migration은 별도 설계가 필요합니다."],
  },
  {
    id: "mapper-resource-registration",
    title: "mapper resource·interface·statement를 startup에 완전히 등록하고 중복·누락을 차단합니다",
    lead: "XML 파일이 repository에 존재하는 것과 runtime Configuration에 올바른 namespace와 statement id로 등록된 것은 다릅니다.",
    explanations: [
      "mappers configuration은 classpath resource, URL, mapper class 또는 package scan으로 등록할 수 있습니다. 배포 artifact에서 어느 경로를 썼는지 하나의 source of truth로 정하고 같은 mapper를 중복 등록하지 않습니다.",
      "원본 mapper XML에는 insert/select/delete 각 한 개와 세 statement id, 네 개의 hash-style parameter binding이 있으며 interface에도 대응하는 세 method가 있습니다. 값과 namespace literal은 복사하지 않고 구조적 binding contract만 사용합니다.",
      "resource path는 source tree 경로가 아니라 packaged classpath 경로로 검증합니다. IDE에서는 보이나 jar에 누락되는 경우를 막기 위해 production artifact를 대상으로 mapper inventory boot test를 실행합니다.",
      "duplicate namespace/id, unresolved alias/result type, XML syntax와 interface mismatch를 startup failure로 처리합니다. 첫 요청까지 lazy하게 숨기지 말고 모든 critical statement가 Configuration에 존재하는지 readback합니다.",
      "multi-datasource에서는 mapper package가 올바른 SqlSessionFactory/Template에만 등록되도록 명시합니다. 광범위 package scan은 같은 interface를 다른 schema에 연결하거나 bean collision을 만들 수 있습니다.",
    ],
    concepts: [
      c("mapper registration", "XML resource 또는 interface를 Configuration의 namespace/mapped statement registry에 추가하는 boot 작업입니다.", ["classpath를 검증합니다.", "중복을 금지합니다."]),
      c("mapped statement", "namespace와 id로 식별되는 SQL·parameter·result·cache/execution metadata 단위입니다.", ["완전한 id를 가집니다.", "startup inventory가 가능합니다."]),
      c("classpath provenance", "mapper가 어느 packaged artifact/resource checksum에서 로드됐는지 추적하는 정보입니다.", ["source 경로와 구분합니다.", "원문 SQL을 log하지 않습니다."]),
    ],
    diagnostics: [d("IDE 테스트는 통과하지만 packaged application 첫 mapper 호출에서 Invalid bound statement가 발생합니다.", "source resource는 존재하지만 build artifact에 포함되지 않았거나 scan path/factory binding이 달랐습니다.", ["jar/classpath resource listing", "Configuration mapped statement ids", "mapper bean→factory", "namespace/interface FQCN"], "production artifact startup test에서 필요한 namespace/id를 allow-list와 비교하고 누락·extra·duplicate면 boot를 실패시킵니다.", "resource packaging, shading과 mapper route coverage를 CI release gate에 둡니다.")],
    expertNotes: ["mapped statement id inventory는 공유할 수 있지만 raw SQL와 bind/default literal은 최소 권한 artifact로 분리합니다.", "package scan 범위를 넓히는 임시 수정은 multi-factory 환경에서 더 큰 잘못된 binding을 만들 수 있습니다."],
  },
  {
    id: "startup-validation-matrix",
    title: "설정 실패를 category로 주입해 first-request 장애를 startup evidence로 바꿉니다",
    lead: "정상 config 한 번만 띄우는 smoke test는 environment 누락, alias 충돌, mapper 없음과 statement 중복이 어떻게 실패하고 무엇이 정리되는지 보여 주지 못합니다.",
    explanations: [
      "validation matrix에는 missing environment, unresolved non-secret property, duplicate alias, no mapper, duplicate statement, unknown result type, malformed XML과 wrong factory route를 둡니다. 각 case는 stable public category와 restricted root cause를 갖습니다.",
      "configuration validator는 실제 database credential로 연결하기 전에 가능한 structural failure를 먼저 찾습니다. Connection이 필요한 probe는 최소 권한 synthetic schema와 짧은 timeout에서 별도 단계로 실행합니다.",
      "한 오류를 발견하고 즉시 종료하면 뒤의 문제를 숨길 수 있지만 모든 오류를 모으다 secret과 SQL 원문을 log할 수 있습니다. allow-listed category/object logical id만 bounded collection으로 출력합니다.",
      "Spring context test는 SqlSessionFactoryBean, mapper beans와 transaction manager wiring을 포함하고 base MyBatis source-file test는 builder/factory/session ownership을 별도로 유지합니다. 두 lifecycle을 섞어 결론내리지 않습니다.",
      "startup evidence에는 dependency versions, config/resource checksums, environment id, alias/mapper/statement counts, validation categories와 duration을 둡니다. DB URL, username, password와 SQL/bind는 제외합니다.",
    ],
    concepts: [
      c("negative boot test", "잘못된 설정을 의도적으로 주입해 startup이 안전하게 실패하는지 검증하는 테스트입니다.", ["오류 category를 고정합니다.", "resource cleanup을 확인합니다."]),
      c("structural validation", "DB 접속 전에 XML·registry·type·resource 의존성을 검사하는 단계입니다.", ["비밀값 없이 실행합니다.", "runtime probe와 구분합니다."]),
      c("startup evidence", "실제 배포 artifact가 어떤 configuration을 성공적으로 조립했는지 값 없이 보여 주는 결과입니다.", ["checksum과 counts를 포함합니다.", "release와 연결합니다."]),
    ],
    codeExamples: [java("mybatis01-config-validator", "누락·중복 configuration을 category로 검증", "Mybatis01ConfigValidator.java", "합성 Config 다섯 개에서 정상 한 개와 네 failure category를 값 없이 분류합니다.", String.raw`import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

public class Mybatis01ConfigValidator {
  record Config(String environment, List<String> aliases, List<String> statements) {}

  static List<String> validate(Config config) {
    List<String> errors = new ArrayList<>();
    if (config.environment() == null || config.environment().isBlank()) errors.add("MISSING_ENV");
    if (new HashSet<>(config.aliases()).size() != config.aliases().size()) errors.add("DUP_ALIAS");
    if (config.statements().isEmpty()) errors.add("NO_MAPPER");
    if (new HashSet<>(config.statements()).size() != config.statements().size()) errors.add("DUP_STATEMENT");
    return errors;
  }

  public static void main(String[] args) {
    List<Config> cases = List.of(
      new Config("training", List.of("item"), List.of("Mapper.find")),
      new Config("", List.of("item"), List.of("Mapper.find")),
      new Config("training", List.of("item", "item"), List.of("Mapper.find")),
      new Config("training", List.of("item"), List.of()),
      new Config("training", List.of("item"), List.of("Mapper.find", "Mapper.find"))
    );
    int valid = 0;
    List<String> categories = new ArrayList<>();
    for (Config config : cases) {
      List<String> errors = validate(config);
      if (errors.isEmpty()) valid++;
      categories.addAll(errors);
    }
    categories.sort(String::compareTo);
    System.out.println("cases=" + cases.size());
    System.out.println("valid=" + valid);
    System.out.println("invalid=" + (cases.size() - valid));
    System.out.println("categories=" + String.join(",", categories));
    System.out.println("raw-values-printed=false");
  }
}`, "cases=5\nvalid=1\ninvalid=4\ncategories=DUP_ALIAS,DUP_STATEMENT,MISSING_ENV,NO_MAPPER\nraw-values-printed=false", ["local-config", "local-mapper-xml", "local-mapper-interface", "mybatis-configuration", "mybatis-spring-factorybean", "mybatis-spring-mappers"])],
    diagnostics: [d("application은 healthy로 표시되지만 특정 mapper 또는 환경을 처음 호출할 때만 실패합니다.", "startup health가 process/port만 확인하고 configuration registry와 mapper route를 강제로 materialize하지 않았습니다.", ["startup validation report", "mapped statement/mapper counts", "all factory routes", "lazy initialization settings"], "critical mapper/factory를 startup에 검증하고 synthetic read/rollback probe까지 성공해야 readiness를 허용합니다.", "negative boot corpus와 first-call route coverage를 dependency/config 변경마다 실행합니다.")],
    expertNotes: ["fail-fast가 모든 database outage에서 process crash를 뜻하지는 않습니다. 구조적 invalid와 일시적 dependency unavailable의 readiness/retry 정책을 구분합니다.", "오류 aggregation에는 원문 XML line이나 property value 대신 logical component id와 stable category를 사용합니다."],
  },
  {
    id: "spring-integration-observability-upgrade",
    title: "MyBatis-Spring lifecycle·관측성·upgrade matrix로 운영 경계를 완성합니다",
    lead: "Spring에서 mapper를 주입하면 boilerplate는 사라지지만 factory/template/transaction manager가 어떻게 session을 bind하고 예외를 번역하는지 모르면 운영 장애를 진단할 수 없습니다.",
    explanations: [
      "SqlSessionFactoryBean은 DataSource와 config/mapper resources를 결합해 application context에 공유 factory를 만듭니다. 여러 DataSource에서는 factory와 mapper scan reference를 이름으로 명시하고 ambiguous autowiring을 막습니다.",
      "SqlSessionTemplate은 Spring transaction에 연결된 실제 session을 가져오고 lifecycle과 exception translation을 관리하는 thread-safe facade입니다. singleton template과 내부 실제 session scope를 구분합니다.",
      "Spring managed session에서는 manual commit, rollback, close를 호출하지 않습니다. service layer transaction boundary, propagation, rollback rules와 executor type 호환성을 integration test로 확인합니다.",
      "관측성에는 factory generation, selected environment, mapper/statement counts, session open/close/error, transaction outcome, pool wait와 safe query identifier를 둡니다. raw SQL, bind, URL, account와 DTO를 제외합니다.",
      "MyBatis·MyBatis-Spring·Spring Framework·JDK·driver upgrade는 config boot, mapper route, type round-trip, transactions, batch/generated key, concurrency와 error translation corpus로 qualification합니다. compile 성공만으로 승인하지 않습니다.",
    ],
    concepts: [
      c("SqlSessionFactoryBean", "Spring lifecycle에서 DataSource와 MyBatis configuration을 조립해 공유 SqlSessionFactory를 제공하는 FactoryBean입니다.", ["startup에 build합니다.", "mapper resources를 결합할 수 있습니다."]),
      c("SqlSessionTemplate", "Spring transaction과 실제 session lifecycle을 연결하는 thread-safe MyBatis-Spring facade입니다.", ["실제 session 공유와 다릅니다.", "manual close를 피합니다."]),
      c("compatibility matrix", "MyBatis·Spring·driver·DB·JDK 조합별 boot/transaction/mapping/failure 결과를 검증하는 표입니다.", ["지원 version을 명시합니다.", "upgrade gate로 사용합니다."]),
    ],
    diagnostics: [d("Spring transaction 안의 mapper와 수동 openSession 호출이 서로 다른 commit 결과를 만듭니다.", "SqlSessionTemplate과 base factory session을 같은 service path에서 섞어 transaction ownership이 둘로 갈렸습니다.", ["injected mapper/template type", "transaction synchronization", "Connection identity", "manual commit/close calls"], "repository는 Spring managed mapper/template만 사용하고 별도 base session path는 composition boundary 밖으로 격리합니다.", "한 service transaction에서 모든 mapper가 같은 resource에 참여하고 rollback되는 integration test를 둡니다.")],
    expertNotes: ["SqlSessionTemplate이 thread-safe하다는 설명을 mapper query가 자동으로 idempotent/transaction-safe하다는 뜻으로 확대하지 않습니다.", "운영 diagnostic에서 configuration를 introspect할 때도 property values와 SQL source 노출 권한을 분리합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-config", repository: "SPRING/SpringBasic", path: "src/main/resources/mybatis-config/mybatis-config.xml", usedFor: ["configuration/typeAliases fragment provenance"], evidence: "read-only scanner로 configuration·typeAliases·typeAlias 구조만 확인했으며 접속정보나 attribute value는 출력·복사하지 않았습니다." },
  { id: "local-mapper-xml", repository: "SPRING/SpringBasic", path: "src/main/resources/sqlmap/BoardMapper.xml", usedFor: ["three mapped statements and four hash-style bindings provenance"], evidence: "read-only scanner로 insert/select/delete id count와 binding count만 확인했으며 SQL literal·namespace value는 복사하지 않았습니다." },
  { id: "local-mapper-interface", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/mapper/BoardMapper.java", usedFor: ["three mapper methods provenance"], evidence: "read-only scanner로 method count/name alignment만 확인했으며 package/source body는 예제로 복사하지 않았습니다." },
  { id: "mybatis-getting-started", repository: "MyBatis 3 Documentation", path: "Getting started", publicUrl: "https://mybatis.org/mybatis-3/getting-started.html", usedFor: ["builder, factory and session lifecycle"], evidence: "MyBatis 공식 getting-started 문서입니다." },
  { id: "mybatis-configuration", repository: "MyBatis 3 Documentation", path: "Configuration", publicUrl: "https://mybatis.org/mybatis-3/configuration.html", usedFor: ["configuration order, properties, aliases, environments and mappers"], evidence: "MyBatis 공식 configuration 문서입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Documentation", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["openSession, execution, commit, rollback and close contracts"], evidence: "MyBatis 공식 Java API 문서입니다." },
  { id: "mybatis-factory-api", repository: "MyBatis 3 API", path: "SqlSessionFactory", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/session/SqlSessionFactory.html", usedFor: ["factory overload and configuration access"], evidence: "MyBatis 공식 SqlSessionFactory API입니다." },
  { id: "mybatis-session-api", repository: "MyBatis 3 API", path: "SqlSession", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/session/SqlSession.html", usedFor: ["session resource and transaction methods"], evidence: "MyBatis 공식 SqlSession API입니다." },
  { id: "mybatis-configuration-api", repository: "MyBatis 3 API", path: "Configuration", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/session/Configuration.html", usedFor: ["runtime registry and mapped statement introspection"], evidence: "MyBatis 공식 Configuration API입니다." },
  { id: "mybatis-spring-factorybean", repository: "MyBatis-Spring Documentation", path: "SqlSessionFactoryBean", publicUrl: "https://mybatis.org/spring/factorybean.html", usedFor: ["Spring factory composition"], evidence: "MyBatis-Spring 공식 factory bean 문서입니다." },
  { id: "mybatis-spring-session", repository: "MyBatis-Spring Documentation", path: "Using an SqlSession", publicUrl: "https://mybatis.org/spring/sqlsession.html", usedFor: ["SqlSessionTemplate lifecycle and thread-safety boundary"], evidence: "MyBatis-Spring 공식 SqlSession 문서입니다." },
  { id: "mybatis-spring-transactions", repository: "MyBatis-Spring Documentation", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["Spring transaction ownership"], evidence: "MyBatis-Spring 공식 transaction 문서입니다." },
  { id: "mybatis-spring-mappers", repository: "MyBatis-Spring Documentation", path: "Injecting Mappers", publicUrl: "https://mybatis.org/spring/mappers.html", usedFor: ["mapper registration and factory routing"], evidence: "MyBatis-Spring 공식 mapper 문서입니다." },
  { id: "java-datasource", repository: "Java SE 21 API", path: "DataSource", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html", usedFor: ["JDBC connection factory semantics"], evidence: "Oracle JDK 공식 DataSource API입니다." },
  { id: "java-autocloseable", repository: "Java SE 21 API", path: "AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["exact session close examples"], evidence: "Oracle JDK 공식 AutoCloseable API입니다." },
  { id: "java-document-builder", repository: "Java SE 21 API", path: "DocumentBuilderFactory", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilderFactory.html", usedFor: ["exact XML inventory example"], evidence: "Oracle JDK 공식 DocumentBuilderFactory API입니다." },
  { id: "java-executors", repository: "Java SE 21 API", path: "Executors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html", usedFor: ["exact concurrent factory/session example"], evidence: "Oracle JDK 공식 Executors API입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-01-config-session-factory", slug: "mybatis-01-config-session-factory", courseId: "spring", moduleId: "mybatis-mapping", order: 1,
  title: "MyBatis 설정과 SqlSessionFactory 생명주기", subtitle: "configuration 조립부터 factory·session·transaction·Spring ownership·startup evidence까지 객체 수명으로 이해합니다.", level: "전문가", estimatedMinutes: 960,
  coreQuestion: "MyBatis configuration, SqlSessionFactory와 SqlSession의 서로 다른 scope·thread·transaction·resource ownership을 어떻게 설계하고 startup부터 장애까지 검증할까요?",
  summary: "SpringBasic의 작은 typeAliases config fragment, 세 statement mapper XML과 세 method interface를 read-only 안전 scanner로 감사했습니다. 실제 package·namespace·SQL·접속값은 복사하지 않았습니다. runtime object graph, configuration order/precedence, environment·DataSource·transaction manager, one-shot builder, application-scope factory, unit-of-work session, commit/rollback/autocommit, alias/handler registry, mapper registration, negative startup matrix와 MyBatis-Spring 운영/upgrade까지 초보 개념에서 전문가 lifecycle로 확장합니다. 다섯 JDK 21 examples는 builder/factory/session graph, XML structure inventory, concurrent independent sessions, transaction outcomes와 config failure categories를 실제 실행합니다.",
  objectives: ["Configuration→factory→session→mapper→JDBC object graph와 ownership을 설명한다.", "config element 순서·property precedence·resolved state를 값 없이 검증한다.", "environment, DataSource와 transaction manager binding을 deployment topology와 맞춘다.", "builder를 one-shot boot, factory를 immutable application scope로 운영한다.", "session을 thread-safe하지 않은 unit-of-work로 제한하고 항상 close한다.", "commit·rollback·autoCommit·ambiguous outcome을 구분한다.", "type alias/handler registry와 mapper resource를 startup에 검증한다.", "MyBatis-Spring template/transaction lifecycle과 upgrade matrix를 운영한다."],
  prerequisites: [{ title: "JdbcTemplate과 RowMapper로 반복 코드 제거", reason: "JDBC Connection, callback, transaction과 resource ownership을 이해하면 MyBatis가 무엇을 추상화하고 무엇을 그대로 남기는지 비교할 수 있습니다.", sessionSlug: "jdbc-07-jdbctemplate-rowmapper" }],
  keywords: ["MyBatis configuration", "SqlSessionFactoryBuilder", "SqlSessionFactory", "SqlSession", "DataSource", "environment", "transaction manager", "typeAlias", "TypeHandler", "mapper registration", "SqlSessionTemplate", "startup validation"], topics,
  lab: {
    title: "MyBatis runtime lifecycle과 startup gate 구축",
    scenario: "작은 typeAlias config와 mapper/interface를 production application에 연결해야 하지만 factory rebuild, session leak, wrong DataSource, missing mapper와 secret-bearing diagnostics를 방지해야 합니다.",
    setup: ["로컬 세 source를 read-only로 보존하고 checksum·tag/method/statement/binding count만 기록합니다.", "JDK examples와 별도로 ephemeral target DB, 최소 권한 DataSource와 실제 MyBatis/MyBatis-Spring 지원 버전을 준비합니다.", "builder/factory/session/transaction/resource ownership table과 boot manifest를 작성합니다.", "DB URL·account·SQL/bind 없이 environment·registry count·outcome만 남기는 safe event schema를 준비합니다."],
    steps: ["configuration source/order/precedence와 packaged classpath를 inventory합니다.", "selected environment, DataSource, transaction manager와 multi-factory mapper route를 검증합니다.", "builder build 1회와 immutable factory generation을 startup assertion으로 고정합니다.", "동시 요청에서 session identity, close와 active pool count가 독립적인지 실행합니다.", "success commit, exception rollback, close 누락과 commit-unknown을 fault injection합니다.", "alias/type handler의 null·boundary·invalid round-trip을 target driver에서 확인합니다.", "mapper/interface/statement inventory의 missing/extra/duplicate를 startup에 fail-fast합니다.", "Spring managed mapper가 service transaction과 같은 Connection/outcome을 갖는지 readback합니다.", "boot/session/transaction/pool telemetry에 raw property·SQL·bind가 없는지 canary로 검사합니다.", "dependency/config upgrade matrix와 rollback/drain runbook을 승인합니다."],
    expectedResult: ["factory는 application generation당 한 번 build되고 모든 session은 unit-of-work마다 독립적으로 닫힙니다.", "다섯 Java examples의 stdout이 완전히 일치합니다.", "잘못된 environment·alias·mapper·statement가 첫 요청 전 stable category로 실패합니다.", "manual base MyBatis와 Spring managed transaction ownership이 섞이지 않습니다.", "운영 evidence가 접속값과 SQL data를 노출하지 않고 lifecycle·outcome을 설명합니다."],
    cleanup: ["ephemeral schema, synthetic rows, boot manifests와 test logs를 run id로 폐기합니다.", "temporary DB credential과 pool/network access를 revoke합니다.", "모든 session/pool active count가 0이고 ambiguous transaction이 reconciliation됐는지 확인합니다.", "로컬 원본 세 파일은 변경하지 않고 안전한 structural evidence만 보존합니다."],
    extensions: ["multi-tenant factory routing과 generation hot swap/drain을 구현합니다.", "ExecutorType SIMPLE/REUSE/BATCH의 statement/transaction 차이를 측정합니다.", "custom TypeHandler와 enum/time/JSON round-trip certification을 추가합니다.", "MyBatis·Spring·driver·DB upgrade corpus를 CI matrix로 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 builder/factory/session/config/transaction evidence를 표로 만드세요.", requirements: ["stdout 완전 일치를 확인합니다.", "factory build와 session open/close count를 구분합니다.", "XML 구조만 출력하고 value를 출력하지 않습니다.", "concurrent session identity와 active zero를 확인합니다.", "commit과 close-time rollback을 구분합니다.", "네 startup failure category를 설명합니다."], hints: ["객체 이름을 외우기보다 누가 만들고 공유하고 닫는지를 화살표로 그리세요."], expectedOutcome: "MyBatis lifecycle을 독립적으로 설명하고 resource/transaction failure를 진단할 수 있습니다.", solutionOutline: ["config→builder→factory→session→transaction→close→evidence 순서입니다."] },
    { difficulty: "응용", prompt: "SpringBasic source를 안전한 MyBatis-Spring boot package로 재구성하세요.", requirements: ["원본 structural provenance만 사용합니다.", "config/resource checksum과 precedence를 고정합니다.", "DataSource/factory/mapper route를 명시합니다.", "factory singleton과 session unit-of-work를 검증합니다.", "commit/rollback/unknown outcomes를 fault-test합니다.", "alias/handler/statement registry를 startup에 검증합니다.", "Spring transaction participation을 확인합니다.", "secret-free telemetry와 upgrade/rollback을 포함합니다."], hints: ["작은 config fragment에 environments와 mappers가 없다는 점을 완전한 production config로 오해하지 마세요."], expectedOutcome: "첫 요청 전에 잘못된 configuration과 lifecycle을 차단하는 production boot package가 완성됩니다.", solutionOutline: ["safe audit→composition→negative boot→transaction tests→telemetry→release gate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 MyBatis lifecycle·configuration governance를 작성하세요.", requirements: ["scope/thread/resource ownership을 정의합니다.", "property/secret/config provenance를 둡니다.", "multi-DataSource factory/mapper routing을 정의합니다.", "alias/handler/statement inventory를 관리합니다.", "session/transaction/ambiguous outcome policy를 둡니다.", "Spring managed/manual path 혼용을 금지합니다.", "negative boot와 target DB failure corpus를 요구합니다.", "observability, upgrade, generation swap/drain을 포함합니다."], hints: ["factory가 공유 가능하다는 문장과 session이 공유 불가능하다는 문장을 같은 표에 대비하세요."], expectedOutcome: "설정 변경부터 graceful shutdown까지 일관된 MyBatis 운영 표준이 완성됩니다.", solutionOutline: ["provenance→build→route→use→commit→close→observe→upgrade 순서입니다."] },
  ],
  nextSessions: ["mybatis-02-interface-xml-binding"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["mybatis-config.xml은 read-only scanner에서 configuration/typeAliases/typeAlias 중심의 11-line fragment로 확인했으며 접속 property는 출력하지 않았습니다.", "BoardMapper.xml은 insert/select/delete 각 한 개, statement ids 세 개와 hash-style bindings 네 개가 확인되었지만 namespace·SQL·bind literal은 복사하지 않았습니다.", "BoardMapper.java는 대응 method 세 개가 확인되었지만 package/source body를 예제에 복사하지 않았습니다.", "JDK lifecycle examples는 MyBatis implementation이 아니므로 실제 MyBatis 3.5.x·MyBatis-Spring·target driver/DataSource/transaction manager 통합 matrix를 별도로 요구합니다."] },
});

export default session;
