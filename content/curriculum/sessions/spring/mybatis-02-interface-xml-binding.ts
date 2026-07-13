import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "합성 mapper interface, XML metadata와 JDK reflection/proxy만 준비해 실제 package·SQL·DB 없이 binding contract를 재현합니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "namespace+method id lookup, InvocationHandler dispatch, overload collision, generic return/cardinality와 default method 경계를 실행합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "method/statement count, missing/extra, call ids와 type category만 출력합니다. SQL text와 parameter value는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 MyBatis jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "JDK dynamic proxy model은 MyBatis MapperProxy/MapperMethod/SqlSession 실행을 재구현하지 않으며 실제 framework 통합 테스트가 필요합니다."] },
    experiments: [
      { change: "namespace, statement id, method 이름·return type 중 하나를 바꾸거나 overload를 추가합니다.", prediction: "compile은 통과해도 startup binding 또는 첫 호출 cardinality/type contract가 실패할 수 있습니다.", result: "interface/XML inventory diff와 actual MyBatis mapper boot test가 mismatch를 fail-fast합니다." },
      { change: "default method, Object method, multi-factory route와 mapper package scan 범위를 바꿉니다.", prediction: "모든 method를 SQL로 dispatch하거나 mapper가 잘못된 factory에 연결되는 경계 오류가 드러납니다.", result: "proxy method classification과 mapper→factory route coverage를 release evidence에 남깁니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "three-name-binding-contract",
    title: "interface FQCN·XML namespace·method/statement id의 세 이름을 하나의 binding key로 이해합니다",
    lead: "Mapper 구현 class가 없어도 method가 실행되는 이유는 MyBatis가 interface의 완전한 이름과 method 이름으로 mapped statement를 찾아 proxy invocation을 SqlSession 실행으로 바꾸기 때문입니다.",
    explanations: [
      "XML mapper의 namespace를 mapper interface의 fully qualified class name과 맞추고 각 statement id를 대응 method 이름과 맞추면 완전한 statement key는 `namespace.id`가 됩니다. 단순 파일명이나 bean 이름으로 결합되는 것이 아닙니다.",
      "interface method compile 성공은 XML registration을 증명하지 않습니다. mapper resource가 classpath에 없거나 namespace/id가 다르면 proxy bean 생성 또는 실제 method 호출에서 bound statement 오류가 발생할 수 있습니다.",
      "원본 interface와 XML에는 세 method/statement가 구조적으로 대응합니다. 이 세션은 method와 id 이름의 대응만 근거로 사용하고 실제 package namespace, SQL literal과 parameter value는 복사하지 않습니다.",
      "binding contract 표에는 interface FQCN, method name, parameter shape, return/cardinality, XML resource checksum, namespace, statement id/type와 target factory를 둡니다. refactor 전후 diff를 자동 생성합니다.",
      "annotation mapper와 XML mapper를 섞을 때 같은 fully qualified statement id가 중복되지 않게 합니다. 어느 source가 statement를 소유하는지 명시하고 duplicate를 startup failure로 처리합니다.",
    ],
    concepts: [
      c("mapper interface", "SQL implementation 없이 method signature로 data-access contract를 선언하고 proxy가 구현하는 Java interface입니다.", ["FQCN이 namespace key가 됩니다.", "method semantics는 직접 설계합니다."]),
      c("namespace", "한 mapper XML의 statement·result map·cache 이름을 묶는 전역 구분자입니다.", ["interface FQCN과 맞춥니다.", "파일명과 다릅니다."]),
      c("statement id", "namespace 안에서 select/insert/update/delete를 유일하게 식별하는 id입니다.", ["mapper method 이름과 결합됩니다.", "overload를 구분하지 못합니다."]),
    ],
    codeExamples: [java("mybatis02-interface-xml-inventory", "interface method와 XML statement id의 완전 일치", "Mybatis02InterfaceXmlInventory.java", "표준 reflection과 DOM으로 합성 interface/XML의 method·id·namespace를 비교합니다.", String.raw`import java.io.StringReader;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

public class Mybatis02InterfaceXmlInventory {
  interface TrainingMapper {
    int create(String label);
    List<String> findAll();
    int remove(long id);
  }

  public static void main(String[] args) throws Exception {
    String xml = """
      <mapper namespace="%s">
        <insert id="create"/>
        <select id="findAll"/>
        <delete id="remove"/>
      </mapper>
      """.formatted(TrainingMapper.class.getName());
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
    var document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
    Element root = document.getDocumentElement();
    Set<String> methods = new TreeSet<>();
    Arrays.stream(TrainingMapper.class.getDeclaredMethods()).map(Method::getName).forEach(methods::add);
    Set<String> ids = new TreeSet<>();
    for (Node node = root.getFirstChild(); node != null; node = node.getNextSibling()) {
      if (node instanceof Element element) ids.add(element.getAttribute("id"));
    }
    List<String> missing = new ArrayList<>(methods); missing.removeAll(ids);
    List<String> extra = new ArrayList<>(ids); extra.removeAll(methods);
    System.out.println("methods=" + String.join(",", methods));
    System.out.println("ids=" + String.join(",", ids));
    System.out.println("missing=" + missing.size());
    System.out.println("extra=" + extra.size());
    System.out.println("namespace-match=" + root.getAttribute("namespace").equals(TrainingMapper.class.getName()));
  }
}`, "methods=create,findAll,remove\nids=create,findAll,remove\nmissing=0\nextra=0\nnamespace-match=true", ["local-config", "local-mapper-xml", "local-mapper-interface", "mybatis-configuration", "mybatis-sqlmap-xml", "mybatis-mapped-statement", "mybatis-configuration-api", "java-document-builder"])],
    diagnostics: [d("mapper bean은 주입됐지만 method 호출에서 Invalid bound statement가 발생합니다.", "interface FQCN, XML namespace, method name과 statement id 중 하나가 다르거나 resource가 factory에 등록되지 않았습니다.", ["mapper interface FQCN", "XML namespace/id", "Configuration statement keys", "mapper→factory/resource checksum"], "세 이름과 packaged resource를 inventory로 비교하고 누락·extra·wrong factory가 있으면 startup을 실패시킵니다.", "interface/XML binding contract test를 rename·package move마다 실행합니다.")],
    expertNotes: ["interface 이름 변경은 Java refactor만이 아니라 XML namespace와 cache/resultMap reference migration입니다.", "statement key를 log할 수는 있지만 raw SQL와 parameter object를 함께 상시 출력하지 않습니다."],
  },
  {
    id: "mapper-xml-anatomy-and-registration",
    title: "mapper XML의 statement·result·cache namespace와 configuration 등록을 분리합니다",
    lead: "XML 파일 내부가 올바른 것과 해당 XML이 원하는 SqlSessionFactory의 Configuration에 정확히 한 번 등록된 것은 서로 다른 검증입니다.",
    explanations: [
      "mapper root namespace 아래에는 cache/cache-ref, resultMap, reusable sql fragment와 CRUD statements가 올 수 있습니다. 선언 순서와 reference dependency를 이해하고 statement id만 grep해 완전성을 판단하지 않습니다.",
      "mappers configuration, SqlSessionFactoryBean mapperLocations, MapperFactoryBean의 동위치 XML 자동 탐색과 package scan은 서로 다른 등록 경로입니다. 한 application에서 source of truth를 명확히 하고 이중 등록을 막습니다.",
      "resultMap·sql fragment와 cache reference는 local id 또는 namespace-qualified id를 사용합니다. rename 시 statement뿐 아니라 모든 reference graph와 cache ownership을 함께 검사합니다.",
      "packaged artifact의 resource path와 checksum을 검증합니다. source tree에서 파일을 발견했다는 사실은 jar/war의 classpath와 여러 module shading 결과를 증명하지 않습니다.",
      "startup inventory에는 mapper interface, XML namespace, CRUD statement count, result map/cache count와 factory route를 둡니다. SQL text, comments와 bind/default values는 별도 제한된 artifact로 유지합니다.",
    ],
    concepts: [
      c("mapper resource", "mapped statements와 mapping metadata를 담아 Configuration에 parsing되는 XML 또는 annotation source입니다.", ["classpath identity를 가집니다.", "중복 등록을 피합니다."]),
      c("resource registration", "mapper source를 특정 Configuration/SqlSessionFactory에 추가하는 boot 과정입니다.", ["multi-factory route를 명시합니다.", "startup에 검증합니다."]),
      c("reference graph", "statement, resultMap, sql fragment와 cache가 id로 서로 참조하는 dependency 관계입니다.", ["rename 범위를 결정합니다.", "cycle/missing을 검사합니다."]),
    ],
    diagnostics: [d("같은 statement가 duplicate 오류를 내거나 XML 수정이 runtime에 반영되지 않습니다.", "mapper가 config와 mapperLocations/package scan에서 이중 등록됐거나 다른 classpath copy가 먼저 로드됐습니다.", ["all mapper registration paths", "resource URL/checksum", "Configuration loaded resources", "duplicate namespace/id"], "등록 source를 하나로 정리하고 packaged artifact에서 namespace별 resource checksum과 statement inventory를 고정합니다.", "duplicate-resource negative test와 artifact classpath audit를 CI에 둡니다.")],
    expertNotes: ["XML resource URL은 local absolute path를 운영 telemetry에 노출하지 않고 module logical id와 checksum으로 표시합니다.", "cache는 namespace binding의 일부이므로 mapper를 split/merge할 때 invalidation과 transaction semantics를 다시 검토합니다."],
  },
  {
    id: "mapper-proxy-dispatch",
    title: "JDK proxy 호출이 MapperMethod와 SqlSession statement execution으로 바뀌는 흐름을 추적합니다",
    lead: "구현 class가 보이지 않는다는 마법을 없애려면 proxy의 InvocationHandler가 Method를 받고 statement key·parameter·return contract를 해석해 session에 위임하는 과정을 이해해야 합니다.",
    explanations: [
      "getMapper는 interface를 구현하는 proxy를 제공합니다. method 호출은 InvocationHandler에 전달되고 Object/default method인지 mapped abstract method인지 분류한 뒤 MapperMethod metadata를 준비합니다.",
      "Mapped method는 interface type과 method name으로 statement key를 만들고 Configuration에서 MappedStatement를 찾습니다. command type에 따라 select/insert/update/delete session API와 return conversion을 선택합니다.",
      "method metadata cache는 reflection 비용을 줄이지만 잘못된 configuration을 고치는 cache가 아닙니다. configuration generation과 proxy/session이 같은 factory에 속하도록 합니다.",
      "proxy는 type-safe method surface를 제공하지만 SQL correctness, authorization predicate, transaction boundary와 result cardinality를 자동 증명하지 않습니다. interface contract test와 actual target DB integration이 필요합니다.",
      "AOP proxy, Spring mapper proxy와 MyBatis proxy가 겹칠 수 있습니다. stack trace에서 가장 바깥 Spring advice부터 실제 MapperProxy/SqlSession/driver cause까지 층을 구분하고 public error에는 내부 SQL/parameter를 노출하지 않습니다.",
    ],
    concepts: [
      c("dynamic proxy", "runtime에 interface 구현 객체를 만들고 method invocation을 handler에 전달하는 Java mechanism입니다.", ["구현 source가 없어도 됩니다.", "Object/default method를 구분합니다."]),
      c("MapperProxy", "SqlSession과 mapper interface를 보유하고 method 호출을 MapperMethod 실행으로 연결하는 MyBatis InvocationHandler입니다.", ["session lifetime을 넘지 않습니다.", "method cache를 사용합니다."]),
      c("MapperMethod", "mapper method의 SQL command와 parameter/return signature를 해석해 SqlSession 호출을 수행하는 metadata/execution 단위입니다.", ["statement key와 결합합니다.", "cardinality 변환을 포함합니다."]),
    ],
    codeExamples: [java("mybatis02-dynamic-proxy-dispatch", "namespace.method로 dispatch하는 mapper proxy model", "Mybatis02DynamicProxyDispatch.java", "JDK Proxy와 합성 executor registry로 두 mapper method가 서로 다른 statement id로 dispatch됨을 실행합니다.", String.raw`import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

public class Mybatis02DynamicProxyDispatch {
  interface TrainingMapper {
    int create(String label);
    List<String> findAll();
  }

  public static void main(String[] args) {
    Map<String, Function<Object[], Object>> executors = new HashMap<>();
    String namespace = TrainingMapper.class.getName();
    executors.put(namespace + ".create", values -> 1);
    executors.put(namespace + ".findAll", values -> List.of("A", "B"));
    List<String> calls = new ArrayList<>();
    TrainingMapper mapper = (TrainingMapper) Proxy.newProxyInstance(
      TrainingMapper.class.getClassLoader(),
      new Class<?>[]{TrainingMapper.class},
      (proxy, method, values) -> {
        if (method.getDeclaringClass() == Object.class) return "training-mapper-proxy";
        String statement = namespace + "." + method.getName();
        calls.add(method.getName());
        return executors.get(statement).apply(values == null ? new Object[0] : values);
      }
    );
    int created = mapper.create("synthetic");
    List<String> rows = mapper.findAll();
    System.out.println("proxy-class=" + Proxy.isProxyClass(mapper.getClass()));
    System.out.println("created=" + created);
    System.out.println("rows=" + rows.size());
    System.out.println("calls=" + String.join(",", calls));
    System.out.println("statement-prefix-match=" + executors.keySet().stream().allMatch(key -> key.startsWith(namespace + ".")));
    System.out.println("values-printed=false");
  }
}`, "proxy-class=true\ncreated=1\nrows=2\ncalls=create,findAll\nstatement-prefix-match=true\nvalues-printed=false", ["mybatis-java-api", "mybatis-mapper-proxy", "mybatis-mapper-method", "mybatis-spring-mappers", "mybatis-spring-mapper-factory", "java-proxy", "java-invocation-handler"])],
    diagnostics: [d("stack trace에는 여러 proxy layer만 보이고 어느 statement가 실패했는지 진단하지 못합니다.", "Spring AOP·mapper proxy·executor·driver 경계를 구분하는 safe operation id와 cause taxonomy가 없습니다.", ["proxy/advice chain", "mapper interface/method id", "Configuration statement command", "root cause category/transaction"], "namespace.method의 safe identifier와 layer별 span을 남기되 SQL/bind는 제외하고 root cause/transaction outcome을 연결합니다.", "synthetic mapper failure로 proxy→session→driver trace와 redaction을 정기 검증합니다.")],
    expertNotes: ["proxy 객체의 equals/hashCode/toString을 mapped SQL method처럼 처리하지 않습니다.", "mapper proxy를 session보다 오래 보관하는 base MyBatis 사용은 proxy가 닫힌 session을 참조할 수 있어 피합니다."],
  },
  {
    id: "method-overload-and-statement-identity",
    title: "method overload를 피하고 statement identity를 동작 이름으로 명확하게 만듭니다",
    lead: "Java는 parameter type으로 overload를 구분하지만 MyBatis XML statement key는 일반적으로 namespace와 method 이름이라 두 overload에 서로 다른 SQL을 안정적으로 연결할 수 없습니다.",
    explanations: [
      "`find(long)`과 `find(String)`은 Java reflection에서는 다른 Method지만 둘 다 같은 `namespace.find`를 찾습니다. parameterType 속성은 overload dispatcher가 아니라 statement parameter mapping hint입니다.",
      "의도별 이름을 `findById`, `findByCode`, `findActiveByOwner`처럼 구분합니다. 이름은 SQL 구현보다 domain query와 cardinality를 드러내고 result/authorization/ordering 계약을 문서화합니다.",
      "method rename은 XML id, annotation/provider, tests, metrics/dashboard와 caller를 한 change set에서 변경합니다. old/new alias를 동시에 둘 때는 compatibility 기간과 제거 gate를 명시합니다.",
      "varargs, generic bridge와 inherited methods도 registry가 보는 method set에 영향을 줄 수 있습니다. mapper interface hierarchy를 얕고 명확하게 유지하고 startup inventory에서 abstract mapped methods만 분류합니다.",
      "overload 금지는 style lint와 reflection test로 자동화합니다. 발견 시 어느 method가 실제로 동작하는지 추측하지 않고 deployment를 중단해 명시 이름으로 refactor합니다.",
    ],
    concepts: [
      c("method overload", "같은 이름에 다른 parameter list를 가진 여러 Java method입니다.", ["JVM signature는 구분됩니다.", "MyBatis statement id는 보통 구분하지 못합니다."]),
      c("statement identity", "Configuration에서 mapped SQL을 찾는 namespace.id key입니다.", ["parameter type을 포함하지 않습니다.", "전역 uniqueness를 가집니다."]),
      c("intention-revealing query", "parameter type이 아니라 조회 목적·filter·cardinality가 이름에 드러나는 mapper method입니다.", ["refactor 안전성을 높입니다.", "operation telemetry에 사용합니다."]),
    ],
    codeExamples: [java("mybatis02-overload-collision", "Java overload와 namespace.method 충돌 탐지", "Mybatis02OverloadCollision.java", "reflection으로 같은 이름 method 수를 세고 명시 이름 interface와 비교합니다.", String.raw`import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class Mybatis02OverloadCollision {
  interface BadMapper {
    String find(long id);
    String find(String code);
  }
  interface GoodMapper {
    String findById(long id);
    String findByCode(String code);
  }

  static Map<String, Long> counts(Class<?> type) {
    return Arrays.stream(type.getDeclaredMethods())
      .collect(Collectors.groupingBy(Method::getName, TreeMap::new, Collectors.counting()));
  }

  public static void main(String[] args) {
    Map<String, Long> bad = counts(BadMapper.class);
    Map<String, Long> good = counts(GoodMapper.class);
    long badOverloads = bad.values().stream().filter(count -> count > 1).count();
    long goodOverloads = good.values().stream().filter(count -> count > 1).count();
    String ambiguous = bad.entrySet().stream().filter(entry -> entry.getValue() > 1).findFirst().orElseThrow().getKey();
    System.out.println("bad-methods=" + BadMapper.class.getDeclaredMethods().length);
    System.out.println("bad-overloads=" + badOverloads);
    System.out.println("ambiguous=" + ambiguous);
    System.out.println("good-methods=" + GoodMapper.class.getDeclaredMethods().length);
    System.out.println("good-overloads=" + goodOverloads);
    System.out.println("statement-rule=namespace.method");
  }
}`, "bad-methods=2\nbad-overloads=1\nambiguous=find\ngood-methods=2\ngood-overloads=0\nstatement-rule=namespace.method", ["mybatis-mapper-method", "mybatis-mapped-statement", "java-method"])],
    diagnostics: [d("두 overload 중 하나가 기대와 다른 SQL/parameter mapping을 사용하거나 startup에서 ambiguous 오류가 납니다.", "Java overload가 statement id에도 signature별로 구분된다고 잘못 가정했습니다.", ["declared methods grouped by name", "fully qualified statement ids", "XML/annotation sources", "caller/cardinality contract"], "overload를 서로 다른 의도 이름으로 바꾸고 XML id·tests·metrics를 원자적으로 migration합니다.", "mapper interface lint에서 abstract method name 중복을 금지합니다.")],
    expertNotes: ["default/private helper method의 이름 중복과 mapped abstract method overload를 같은 severity로 다루지 말고 분류합니다.", "statement id에 parameter type suffix를 임의로 붙여 framework lookup 규칙을 우회하지 않습니다."],
  },
  {
    id: "parameter-shape-at-interface-boundary",
    title: "mapper method parameter를 query command의 명시적 immutable shape로 설계합니다",
    lead: "interface와 XML 이름이 맞아도 여러 primitive parameter, Map key, null과 compiler parameter-name 설정이 다르면 property lookup은 runtime에 실패할 수 있습니다.",
    explanations: [
      "한 개의 단순 값, immutable query/command object, 명시 이름을 가진 여러 parameter와 collection/array는 서로 다른 resolution contract를 가집니다. method마다 XML이 참조할 property 이름을 표로 고정합니다.",
      "여러 unrelated primitive를 늘어놓기보다 search criteria record를 사용하면 optionality, validation, pagination과 versioning이 명확해집니다. 객체가 크다고 전체 domain entity를 parameter로 넘기지는 않습니다.",
      "Map은 빠른 실험에는 편하지만 key typo와 value type을 compile-time에 잡지 못합니다. 운영 mapper에는 record/class 또는 명시 annotation을 우선하고 Map은 동적 구조를 엄격히 검증할 때 제한합니다.",
      "null의 의미를 omitted, SQL NULL, clear field와 no filter로 구분합니다. dynamic SQL에서 null 조건이 빠질 때 tenant/authorization predicate가 함께 사라지지 않는지 negative test합니다.",
      "parameter object의 toString이나 debug serialization을 SQL log에 남기지 않습니다. operation id, parameter count, Java/JDBC type category와 validation outcome만 safe telemetry로 사용합니다.",
    ],
    concepts: [
      c("parameter object", "한 mapper operation의 입력 property를 묶은 immutable query/command type입니다.", ["domain entity와 구분합니다.", "validation/versioning을 지원합니다."]),
      c("parameter name resolution", "method argument를 XML의 property 이름과 연결하는 MyBatis 규칙입니다.", ["single/multiple/annotation을 구분합니다.", "compiler 옵션에 의존할 수 있습니다."]),
      c("null intent", "값 없음이 no filter, SQL NULL, unchanged 또는 clear 중 무엇을 뜻하는지 명시한 contract입니다.", ["dynamic SQL과 연결됩니다.", "authorization filter를 보존합니다."]),
    ],
    diagnostics: [d("XML에서 property not found가 나거나 null filter 때문에 전체 row가 조회/수정됩니다.", "여러 parameter의 실제 이름/annotation과 XML property가 다르고 null intent·mandatory predicate를 정의하지 않았습니다.", ["compiled parameter metadata", "explicit parameter names", "parameter object properties", "rendered predicate inventory"], "immutable criteria/command와 명시 이름을 도입하고 mandatory tenant/key predicate가 없으면 execution을 거부합니다.", "parameter resolution과 null/empty boundary를 mapper contract test에 추가합니다.")],
    expertNotes: ["다음 세션에서 hash-style binding, dollar-style substitution과 ParamNameResolver 규칙을 실행 예제로 더 깊게 다룹니다.", "parameter object가 immutable해도 내부 collection을 caller가 변경할 수 있으므로 defensive copy와 size limit을 검토합니다."],
  },
  {
    id: "return-type-cardinality-contract",
    title: "return type으로 0·1·N과 mutation affected-row 의미를 숨김없이 표현합니다",
    lead: "resultType은 row element mapping을 말하고 mapper method의 List·Optional·single object·int return은 query cardinality와 command outcome을 추가로 결정합니다.",
    explanations: [
      "0..1 query는 Optional 또는 명시 nullable contract, exact-one query는 not-found/duplicate failure, 0..N query는 collection을 사용합니다. single select에 두 row가 오면 첫 row를 임의 선택하지 않습니다.",
      "collection method의 XML resultType은 collection 자체가 아니라 row element type을 의미합니다. generic return type과 resultMap/resultType을 함께 검증해 raw List와 unchecked cast를 피합니다.",
      "insert/update/delete의 int 또는 long은 affected rows로 해석될 수 있습니다. boolean처럼 축약하면 0 no-op, optimistic conflict와 unexpected 2+ rows를 구분하지 못합니다.",
      "generated key, cursor, Map과 custom result handler는 추가 lifecycle/cardinality contract가 필요합니다. cursor는 session을 escape하지 않게 close owner를 API에 드러냅니다.",
      "return conversion 오류는 SQL 실행 성공 뒤에도 발생할 수 있어 transaction을 commit하기 전에 mapping/cardinality를 완료해야 합니다. result size/type 오류가 mutation transaction을 어떻게 rollback하는지 integration test합니다.",
    ],
    concepts: [
      c("cardinality contract", "operation이 허용하는 row 수와 0/1/N 위반 outcome을 정한 규칙입니다.", ["return type에 반영합니다.", "DB constraint와 연결합니다."]),
      c("element type", "collection result의 각 row가 mapping될 Java type입니다.", ["List 자체의 resultType이 아닙니다.", "generic reflection으로 검증합니다."]),
      c("affected rows", "mutation이 실제로 바꾼 row 수이며 domain outcome과 concurrency 신호로 해석할 값입니다.", ["0과 2+를 보존합니다.", "commit 여부와 구분합니다."]),
    ],
    codeExamples: [java("mybatis02-return-contract", "reflection으로 cardinality와 mutation return 분류", "Mybatis02ReturnContract.java", "Optional, List와 int return을 reflection으로 분류해 mapper signature contract를 검증합니다.", String.raw`import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public class Mybatis02ReturnContract {
  interface ContractMapper {
    Optional<String> findOne(long id);
    List<String> findAll();
    int delete(long id);
  }

  public static void main(String[] args) {
    Method[] methods = ContractMapper.class.getDeclaredMethods();
    long optional = Arrays.stream(methods).filter(method -> method.getReturnType() == Optional.class).count();
    long collections = Arrays.stream(methods).filter(method -> method.getReturnType() == List.class).count();
    long mutations = Arrays.stream(methods).filter(method -> method.getReturnType() == int.class).count();
    long parameterized = Arrays.stream(methods).filter(method -> method.getGenericReturnType() instanceof ParameterizedType).count();
    long unsupported = Arrays.stream(methods).filter(method ->
      method.getReturnType() != Optional.class && method.getReturnType() != List.class && method.getReturnType() != int.class
    ).count();
    System.out.println("methods=" + methods.length);
    System.out.println("optional=" + optional);
    System.out.println("collections=" + collections);
    System.out.println("mutations=" + mutations);
    System.out.println("parameterized=" + parameterized);
    System.out.println("unsupported=" + unsupported);
  }
}`, "methods=3\noptional=1\ncollections=1\nmutations=1\nparameterized=2\nunsupported=0", ["mybatis-sqlmap-xml", "mybatis-mapper-method", "java-method", "java-parameterized-type"])],
    diagnostics: [d("selectOne이 duplicate row에서 실패하거나 List method가 row element 대신 collection type mapping 오류를 냅니다.", "return cardinality와 XML resultType element 의미를 구분하지 않았습니다.", ["method generic return", "statement command/resultMap/type", "actual row count", "unique constraints/order"], "operation별 0..1/exact1/N 계약과 element mapping을 명시하고 duplicate/not-found/empty fixtures를 실행합니다.", "interface/XML signature lint와 target DB cardinality tests를 둡니다.")],
    expertNotes: ["Optional을 XML resultType으로 쓰는 것이 아니라 mapper method return adapter가 row result를 Optional semantics로 표현합니다.", "paged result는 List 외에 cursor/next token/total consistency를 별도 aggregate type으로 정의합니다."],
  },
  {
    id: "default-object-and-inherited-methods",
    title: "default·Object·inherited method와 mapped abstract method를 proxy에서 구분합니다",
    lead: "interface에 보이는 모든 method가 mapped statement는 아니며 toString/equals/hashCode와 default helper까지 SQL id로 찾으면 잘못된 bound statement와 proxy identity 문제가 생깁니다.",
    explanations: [
      "Object method는 proxy identity/diagnostic semantics로 처리되고 mapped statement lookup 대상이 아닙니다. equals/hashCode를 domain entity identity처럼 사용하지 않고 proxy reference의 lifecycle을 짧게 유지합니다.",
      "default method는 interface 안의 Java 구현을 가질 수 있으며 다른 mapped method를 조합할 수 있습니다. transaction/session context 안에서 실행되는지, recursion과 hidden extra query가 없는지 검토합니다.",
      "inherited abstract methods는 mapper hierarchy에 포함될 수 있지만 여러 parent의 같은 method name, generic bridge와 default conflict를 startup reflection inventory로 검사합니다.",
      "private/static interface method는 mapper instance call surface와 다릅니다. 단순 getDeclaredMethods count를 statement count로 사용하지 말고 abstract instance mapped methods를 정확히 분류합니다.",
      "default helper에 business transaction logic을 과도하게 넣지 않습니다. service orchestration, authorization과 retry policy는 mapper proxy 경계 밖의 service layer에 두고 mapper는 data operation을 명확하게 유지합니다.",
    ],
    concepts: [
      c("default method", "interface에 구현 body가 있는 instance method입니다.", ["항상 mapped SQL이 아닙니다.", "proxy dispatch가 별도 처리합니다."]),
      c("Object method", "toString, equals, hashCode처럼 모든 객체가 갖는 method이며 mapper statement와 구분됩니다.", ["safe diagnostic을 사용합니다.", "SQL lookup을 하지 않습니다."]),
      c("mapped abstract method", "구현 없이 선언되어 MyBatis statement execution에 연결되는 mapper operation입니다.", ["namespace.id가 필요합니다.", "signature/cardinality를 검증합니다."]),
    ],
    codeExamples: [java("mybatis02-default-method-proxy", "default·Object·mapped method proxy 분기", "Mybatis02DefaultMethodProxy.java", "InvocationHandler.invokeDefault를 사용해 default method를 local 실행하고 abstract method만 statement call로 셉니다.", String.raw`import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Proxy;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicInteger;

public class Mybatis02DefaultMethodProxy {
  interface TrainingMapper {
    String find(long id);
    default String label() { return "local-default"; }
  }

  public static void main(String[] args) {
    AtomicInteger statementCalls = new AtomicInteger();
    TrainingMapper mapper = (TrainingMapper) Proxy.newProxyInstance(
      TrainingMapper.class.getClassLoader(),
      new Class<?>[]{TrainingMapper.class},
      (proxy, method, values) -> {
        if (method.getDeclaringClass() == Object.class) return "mapper-proxy";
        if (method.isDefault()) return InvocationHandler.invokeDefault(proxy, method, values);
        statementCalls.incrementAndGet();
        return "mapped-result";
      }
    );
    String mapped = mapper.find(1L);
    String local = mapper.label();
    String objectText = mapper.toString();
    long abstractMethods = Arrays.stream(TrainingMapper.class.getDeclaredMethods())
      .filter(method -> Modifier.isAbstract(method.getModifiers())).count();
    System.out.println("proxy=" + Proxy.isProxyClass(mapper.getClass()));
    System.out.println("mapped=" + mapped);
    System.out.println("default=" + local);
    System.out.println("object=" + objectText);
    System.out.println("abstract-methods=" + abstractMethods);
    System.out.println("statement-calls=" + statementCalls.get());
  }
}`, "proxy=true\nmapped=mapped-result\ndefault=local-default\nobject=mapper-proxy\nabstract-methods=1\nstatement-calls=1", ["mybatis-mapper-proxy", "mybatis-mapper-method", "java-proxy", "java-invocation-handler", "java-method"])],
    diagnostics: [d("default helper 또는 toString 호출이 mapped statement lookup 오류를 냅니다.", "proxy handler/test double이 모든 interface/Object method를 namespace.method SQL로 dispatch했습니다.", ["method declaring class", "isDefault/abstract/static flags", "proxy handler branch", "statement call inventory"], "Object, default와 mapped abstract method를 분류하고 실제 MyBatis behavior와 같은 contract test를 만듭니다.", "새 interface method가 추가될 때 proxy route classification snapshot을 검사합니다.")],
    expertNotes: ["교육용 handler의 invokeDefault 사용은 MyBatis 내부 구현과 동일하다고 단정하지 않고 observable route contract만 설명합니다.", "default method가 여러 mapper call을 하면 statement count와 transaction/cardinality를 service operation telemetry에 드러냅니다."],
  },
  {
    id: "refactoring-and-versioned-binding",
    title: "package·method·XML refactor를 versioned binding migration으로 수행합니다",
    lead: "IDE가 interface reference를 바꿔도 문자열 namespace/id, XML include/resultMap/cache reference와 dashboard가 자동으로 모두 이동한다고 믿으면 runtime mismatch가 남습니다.",
    explanations: [
      "refactor inventory는 Java interface FQCN/method, XML namespace/id, mapper registration, resultMap/sql/cache refs, annotation/provider, tests, metrics와 operation allow-list를 포함합니다. text search와 runtime Configuration diff를 함께 사용합니다.",
      "package move는 새 interface/XML을 먼저 등록하고 caller 전환 후 old binding을 제거하는 expand-contract가 필요할 수 있습니다. 같은 statement를 두 namespace에서 동시에 실행할 때 cache·transaction과 write duplication을 주의합니다.",
      "method semantics가 바뀌면 단순 rename이 아니라 새 version operation으로 봅니다. parameter/return/cardinality, ordering, authorization와 error outcome을 새 contract로 정의합니다.",
      "compatibility alias를 둘 경우 deadline, usage metric과 removal test를 둡니다. 영구 duplicate statement는 어느 path가 실행되는지 불명확하게 하고 security patch 누락을 만들 수 있습니다.",
      "rollback은 이전 artifact가 새 schema/result contract와 호환되는지 확인합니다. mapper binding rollback만 성공해도 column/constraint migration이 이미 진행됐으면 application이 동작하지 않을 수 있습니다.",
    ],
    concepts: [
      c("binding migration", "interface/XML/registration/caller의 statement identity를 단계적으로 이전하는 변경입니다.", ["compatibility window를 둡니다.", "usage를 측정합니다."]),
      c("configuration diff", "old/new runtime Configuration의 mapper·statement·resultMap registry 차이를 비교한 evidence입니다.", ["raw SQL 없이 가능합니다.", "unexpected extra를 찾습니다."]),
      c("contract version", "parameter·return·cardinality·ordering·error 의미가 달라질 때 구분하는 operation version입니다.", ["이름만 바꾸지 않습니다.", "rollback 호환성을 기록합니다."]),
    ],
    diagnostics: [d("package rename 후 일부 환경만 old namespace를 호출하거나 old statement가 계속 사용됩니다.", "Java compile reference만 변경하고 XML/resource/registration/metrics와 compatibility usage를 inventory하지 않았습니다.", ["old/new Configuration keys", "packaged resource checksums", "operation usage metrics", "schema/application compatibility"], "old/new binding을 명시적으로 deploy·route·measure한 뒤 zero usage와 rollback 조건을 확인하고 old binding을 제거합니다.", "refactor PR에 runtime Configuration diff와 no-old-key test를 요구합니다.")],
    expertNotes: ["statement id를 public API처럼 장기 안정화할지 내부 implementation detail로 둘지 팀 경계를 명확히 합니다.", "metrics cardinality를 낮추기 위해 namespace.method를 승인된 operation id로 normalize하되 collision을 막습니다."],
  },
  {
    id: "spring-mapper-routing-and-multifactory",
    title: "MapperFactoryBean·scan과 여러 SqlSessionFactory route를 명시적으로 연결합니다",
    lead: "Spring이 mapper interface를 bean으로 만들어도 어떤 SqlSessionFactory/Template을 사용하는지는 scan configuration과 bean reference에 의해 결정되며 자동으로 올바른 database를 선택하지 않습니다.",
    explanations: [
      "MapperFactoryBean은 mapper interface와 SqlSessionFactory 또는 SqlSessionTemplate을 결합해 proxy bean을 제공합니다. 동위치 XML 자동 탐색 조건과 별도 mapperLocations를 함께 검증합니다.",
      "MapperScan/package scan은 편리하지만 넓은 base package가 marker가 아닌 interface까지 포함하거나 여러 factory에서 중복 bean을 만들 수 있습니다. marker annotation/interface, explicit base packages와 factory/template ref를 사용합니다.",
      "여러 DataSource에서 같은 mapper type을 두 factory에 연결해야 한다면 bean naming, qualifier, schema contract와 transaction manager를 분명히 합니다. 하나의 service transaction이 두 local DB를 원자적으로 commit한다고 가정하지 않습니다.",
      "lazy mapper initialization은 startup 시간과 첫-call failure 사이 tradeoff가 있습니다. critical mapper는 startup route/statement를 검증하고 lazy dependency/ref graph 제한을 공식 문서와 target version에서 확인합니다.",
      "Spring AOP transaction, exception translation과 mapper proxy route를 integration test에서 함께 실행합니다. mock interface만 주입하면 namespace/id/resource/factory mismatch를 발견하지 못합니다.",
    ],
    concepts: [
      c("MapperFactoryBean", "Spring bean lifecycle에서 mapper interface proxy를 만들고 session factory/template과 연결하는 factory입니다.", ["XML 자동 탐색 조건이 있습니다.", "route를 명시합니다."]),
      c("mapper scan", "지정 package의 mapper interface를 찾아 bean definition을 등록하는 기능입니다.", ["범위를 제한합니다.", "multi-factory ref를 지정합니다."]),
      c("factory route", "mapper bean이 어떤 SqlSessionFactory/DataSource/transaction manager를 사용할지 정한 binding입니다.", ["startup에 검증합니다.", "wrong-target negative test를 둡니다."]),
    ],
    diagnostics: [d("동일 이름 mapper가 충돌하거나 query가 예상과 다른 database/schema를 읽습니다.", "scan 범위와 sqlSessionFactoryRef를 생략해 default/by-type wiring이 multi-factory topology를 임의 선택했습니다.", ["mapper bean definitions", "scan base/marker", "factory/template refs", "DataSource/schema sentinel"], "각 mapper package와 factory/template/transaction manager를 explicit ref와 qualifier로 묶고 wrong-target startup test를 추가합니다.", "지원 route 표와 bean/configuration inventory를 release manifest에 둡니다.")],
    expertNotes: ["같은 interface를 read/write factory에 재사용하면 method별 consistency routing이 숨겨질 수 있어 명시 repository boundary를 고려합니다.", "mapper scan diagnostics에 full connection URL이나 credential을 넣지 않고 logical datasource id만 사용합니다."],
  },
  {
    id: "binding-test-observability-upgrade",
    title: "compile·startup·integration·concurrency 계층으로 mapper binding을 지속 검증합니다",
    lead: "interface mock test는 business caller를 빠르게 검증하지만 XML namespace/id, proxy conversion, target driver와 transaction을 전혀 실행하지 않으므로 단독 release gate가 될 수 없습니다.",
    explanations: [
      "static test는 interface abstract method names, overload 금지, XML namespace/id, missing/extra/duplicate와 return/parameter shape를 검사합니다. XML parser와 Java reflection으로 DB 없이 빠르게 실행할 수 있습니다.",
      "startup test는 production artifact와 actual MyBatis version으로 Configuration을 build하고 mapper proxy를 모두 materialize합니다. multi-factory route와 packaged resource checksum을 함께 검증합니다.",
      "target DB integration은 synthetic schema에서 0/1/N, null/type, affected rows, constraint, transaction rollback과 error translation을 실행합니다. MySQL·Oracle 등 지원 dialect/driver matrix를 분리합니다.",
      "concurrency/failure test는 same mapper bean을 여러 request에서 사용하되 실제 sessions는 독립인지, timeout/deadlock/commit-unknown에서 transaction outcome과 retry/idempotency가 맞는지 확인합니다.",
      "운영 telemetry에는 approved operation id(namespace.method의 안정 alias), duration, rows/affected bucket, error category, transaction outcome와 factory/schema version을 둡니다. raw SQL, arguments, DTO와 identifiers는 제외합니다.",
    ],
    concepts: [
      c("binding contract test", "interface method와 XML namespace/id/parameter/return metadata가 대응하는지 DB 없이 검사하는 테스트입니다.", ["reflection/XML을 사용합니다.", "actual boot로 보완합니다."]),
      c("route coverage", "모든 mapper operation이 지원 factory/dialect/version에서 등록·호출·검증됐는지 나타내는 범위입니다.", ["dead statement를 찾습니다.", "release evidence로 남깁니다."]),
      c("safe operation telemetry", "SQL/parameter 없이 mapper operation의 latency·rows·error·transaction·version을 수집하는 관측입니다.", ["bounded id를 사용합니다.", "PII를 제외합니다."]),
    ],
    diagnostics: [d("mock/compile은 통과했지만 실제 배포에서 return conversion·wrong factory·missing statement가 발생합니다.", "binding test pyramid에서 actual Configuration build와 target DB route/cardinality/failure tests가 빠졌습니다.", ["test layers executed", "artifact/config checksums", "route coverage", "target DB/driver versions"], "production artifact boot와 target matrix를 추가하고 모든 interface/XML operation이 actual proxy로 호출되어야 release를 승인합니다.", "dependency/config change마다 static→boot→target→failure corpus를 순서대로 자동화합니다.")],
    expertNotes: ["SQL snapshot string만 비교하면 DB semantics와 parameter binding을 검증하지 못하므로 golden rows/state와 plan을 함께 봅니다.", "operation id 변경은 dashboard/SLO continuity에 영향을 주므로 binding migration manifest에 포함합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-config", repository: "SPRING/SpringBasic", path: "src/main/resources/mybatis-config/mybatis-config.xml", usedFor: ["mapper type-alias configuration context"], evidence: "read-only scanner로 configuration/typeAliases 구조만 확인했고 attribute value는 복사하지 않았습니다." },
  { id: "local-mapper-xml", repository: "SPRING/SpringBasic", path: "src/main/resources/sqlmap/BoardMapper.xml", usedFor: ["three statement ids and mapper namespace structure provenance"], evidence: "read-only scanner로 CRUD tag/id/binding count만 확인했고 namespace·SQL literal은 복사하지 않았습니다." },
  { id: "local-mapper-interface", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/mapper/BoardMapper.java", usedFor: ["three corresponding mapper method names provenance"], evidence: "read-only scanner로 method count/name 대응만 확인했고 package/source body는 복사하지 않았습니다." },
  { id: "mybatis-configuration", repository: "MyBatis 3 Documentation", path: "Configuration mappers", publicUrl: "https://mybatis.org/mybatis-3/configuration.html", usedFor: ["mapper resource/class/package registration"], evidence: "MyBatis 공식 configuration 문서입니다." },
  { id: "mybatis-sqlmap-xml", repository: "MyBatis 3 Documentation", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["namespace, statement id, parameter and result metadata"], evidence: "MyBatis 공식 mapper XML 문서입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Documentation", path: "Java API Using Mappers", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["getMapper and statement execution contracts"], evidence: "MyBatis 공식 Java API 문서입니다." },
  { id: "mybatis-mapper-proxy", repository: "MyBatis 3 API", path: "MapperProxy", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/binding/MapperProxy.html", usedFor: ["InvocationHandler and method cache behavior"], evidence: "MyBatis 공식 MapperProxy API입니다." },
  { id: "mybatis-mapper-method", repository: "MyBatis 3 API", path: "MapperMethod", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/binding/MapperMethod.html", usedFor: ["method command, parameter and return execution contracts"], evidence: "MyBatis 공식 MapperMethod API입니다." },
  { id: "mybatis-mapped-statement", repository: "MyBatis 3 API", path: "MappedStatement", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/MappedStatement.html", usedFor: ["fully qualified statement metadata"], evidence: "MyBatis 공식 MappedStatement API입니다." },
  { id: "mybatis-configuration-api", repository: "MyBatis 3 API", path: "Configuration", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/session/Configuration.html", usedFor: ["mapper and mapped-statement registry inventory"], evidence: "MyBatis 공식 Configuration API입니다." },
  { id: "mybatis-spring-mappers", repository: "MyBatis-Spring Documentation", path: "Injecting Mappers", publicUrl: "https://mybatis.org/spring/mappers.html", usedFor: ["MapperFactoryBean and mapper scan routing"], evidence: "MyBatis-Spring 공식 mapper 문서입니다." },
  { id: "mybatis-spring-mapper-factory", repository: "MyBatis-Spring API", path: "MapperFactoryBean", publicUrl: "https://mybatis.org/spring/apidocs/org/mybatis/spring/mapper/MapperFactoryBean.html", usedFor: ["Spring mapper proxy factory contract"], evidence: "MyBatis-Spring 공식 MapperFactoryBean API입니다." },
  { id: "java-proxy", repository: "Java SE 21 API", path: "Proxy", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html", usedFor: ["exact mapper proxy examples"], evidence: "Oracle JDK 공식 Proxy API입니다." },
  { id: "java-invocation-handler", repository: "Java SE 21 API", path: "InvocationHandler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/InvocationHandler.html", usedFor: ["exact invocation dispatch/default method example"], evidence: "Oracle JDK 공식 InvocationHandler API입니다." },
  { id: "java-method", repository: "Java SE 21 API", path: "Method", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html", usedFor: ["exact overload/signature method inventory"], evidence: "Oracle JDK 공식 Method API입니다." },
  { id: "java-parameterized-type", repository: "Java SE 21 API", path: "ParameterizedType", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/ParameterizedType.html", usedFor: ["generic collection/optional return inspection"], evidence: "Oracle JDK 공식 ParameterizedType API입니다." },
  { id: "java-document-builder", repository: "Java SE 21 API", path: "DocumentBuilderFactory", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilderFactory.html", usedFor: ["exact mapper XML inventory"], evidence: "Oracle JDK 공식 DocumentBuilderFactory API입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-02-interface-xml-binding", slug: "mybatis-02-interface-xml-binding", courseId: "spring", moduleId: "mybatis-mapping", order: 2,
  title: "Mapper 인터페이스와 XML namespace·id 연결", subtitle: "FQCN·namespace·statement id부터 proxy dispatch·signature·cardinality·Spring route·refactor까지 binding contract로 검증합니다.", level: "전문가", estimatedMinutes: 980,
  coreQuestion: "구현 class가 없는 mapper interface method가 정확한 XML statement와 factory/session에 연결되고 parameter·return·transaction 의미를 보존함을 어떻게 startup과 runtime에서 증명할까요?",
  summary: "SpringBasic의 type-alias config, 세 CRUD statement mapper XML과 세 method mapper interface를 read-only scanner로 구조 감사했습니다. 실제 package namespace, SQL과 parameter values는 복사하지 않았습니다. interface FQCN/XML namespace/method-statement id의 세 이름, mapper resource registration, JDK dynamic proxy와 MapperProxy/MapperMethod dispatch, overload 금지, parameter shape, return/cardinality/affected rows, default/Object/inherited methods, versioned refactor, MapperFactoryBean/multi-factory routing과 test/observability matrix까지 독립적으로 설명합니다. 다섯 JDK 21 examples는 interface/XML exact inventory, proxy dispatch, overload collision, generic return contract와 default/Object method 분기를 실제 실행합니다.",
  objectives: ["interface FQCN·namespace·statement id가 완전한 binding key를 만드는 방식을 설명한다.", "mapper resource/reference graph와 Configuration 등록을 구분한다.", "MapperProxy/MapperMethod/SqlSession dispatch를 JDK proxy model로 추적한다.", "mapper method overload를 탐지하고 intention-revealing id로 바꾼다.", "parameter object/name/null과 return cardinality/affected rows contract를 정의한다.", "default/Object/inherited method를 mapped abstract method와 구분한다.", "package/method/XML refactor를 versioned binding migration으로 수행한다.", "Spring mapper scan과 multi-factory route를 actual boot/target matrix로 검증한다."],
  prerequisites: [{ title: "MyBatis 설정과 SqlSessionFactory 생명주기", reason: "Mapper proxy가 어떤 Configuration, SqlSessionFactory와 unit-of-work session에서 statement를 찾는지 이해해야 합니다.", sessionSlug: "mybatis-01-config-session-factory" }],
  keywords: ["Mapper interface", "namespace", "statement id", "MapperProxy", "MapperMethod", "MappedStatement", "dynamic proxy", "method overload", "parameter object", "cardinality", "MapperFactoryBean", "mapper scan"], topics,
  lab: {
    title: "interface/XML binding과 proxy route certification",
    scenario: "세 method interface와 CRUD XML을 production artifact로 묶어야 하며 package rename, mapper scan, multi-factory와 return/cardinality 변경에서도 wrong statement나 first-call failure가 없어야 합니다.",
    setup: ["로컬 source는 read-only로 보존하고 method/statement/binding count와 checksum만 사용합니다.", "JDK reflection/proxy examples와 실제 MyBatis/MyBatis-Spring ephemeral target 환경을 준비합니다.", "interface/XML/registration/factory/parameter/return binding contract 표를 만듭니다.", "SQL·bind 없이 operation id, route, cardinality와 outcome만 기록하는 telemetry schema를 준비합니다."],
    steps: ["interface FQCN, abstract method set과 XML namespace/id를 missing/extra/duplicate로 비교합니다.", "packaged resource와 Configuration registry에서 mapper/resultMap/sql/cache reference를 readback합니다.", "proxy method가 Object/default/mapped abstract 중 어디로 dispatch되는지 추적합니다.", "overload, bridge/inherited method와 ambiguous statement id를 negative-test합니다.", "parameter object/property/null와 return 0/1/N/affected-row contract를 고정합니다.", "package/method rename의 old/new binding을 expand-contract로 deploy하고 usage를 측정합니다.", "MapperFactoryBean/scan이 올바른 factory/template/DataSource에 연결되는지 sentinel schema로 검증합니다.", "actual MyBatis proxy로 모든 operation을 target DB에서 호출해 mapping/transaction/error를 확인합니다.", "concurrent request와 timeout/deadlock에서 session route와 outcome이 섞이지 않는지 검사합니다.", "artifact/config/route coverage와 safe operation telemetry를 release manifest로 승인합니다."],
    expectedResult: ["모든 abstract mapper method와 XML statement가 정확히 1:1 대응하고 overload·missing·extra가 없습니다.", "다섯 Java examples의 stdout이 완전히 일치합니다.", "Object/default method는 SQL lookup되지 않고 mapped method만 proxy executor로 전달됩니다.", "return/cardinality와 multi-factory route가 actual MyBatis/target DB에서 검증됩니다.", "rename·upgrade 뒤 old binding zero usage와 rollback compatibility가 증명됩니다."],
    cleanup: ["ephemeral schemas, synthetic rows, proxy/config inventories와 traces를 run id로 제거합니다.", "temporary DB credential/factory/pool을 revoke·close합니다.", "operation telemetry에 SQL/bind/DTO/connection value가 없는지 검사합니다.", "로컬 원본 세 파일은 변경하지 않고 structural evidence만 보존합니다."],
    extensions: ["annotation mapper와 XML duplicate/source-of-truth policy를 비교합니다.", "Kotlin/record/default method와 constructor/generic return mapping matrix를 추가합니다.", "mapper package split/merge의 cache/resultMap dependency graph migration을 구현합니다.", "Configuration diff와 route coverage를 CI artifact로 자동 생성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 interface→proxy→statement→return 흐름을 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "method/id/namespace match를 확인합니다.", "proxy statement call을 추적합니다.", "overload collision 원인을 설명합니다.", "Optional/List/int cardinality를 구분합니다.", "default/Object method가 SQL 호출되지 않음을 확인합니다."], hints: ["파일명이 아니라 interface FQCN + method name이 완전한 key라는 점부터 적으세요."], expectedOutcome: "mapper 구현 class 없이도 호출이 실행되는 원리와 failure point를 독립적으로 설명합니다.", solutionOutline: ["inventory→registration→proxy→signature→result→route 순서입니다."] },
    { difficulty: "응용", prompt: "원본 세 method mapper를 production binding package로 검증하세요.", requirements: ["원본 literal 없이 provenance를 보존합니다.", "interface/XML missing/extra/duplicate를 검사합니다.", "packaged Configuration registry를 readback합니다.", "overload·parameter·return cardinality contract를 둡니다.", "default/Object/proxy route를 검증합니다.", "Spring multi-factory binding을 명시합니다.", "target DB transaction/failure corpus를 실행합니다.", "refactor/upgrade/telemetry/rollback을 포함합니다."], hints: ["mock mapper만으로 XML namespace와 registration을 검증할 수 없습니다."], expectedOutcome: "첫 호출 전 모든 binding과 route가 검증되는 mapper package가 완성됩니다.", solutionOutline: ["safe audit→static binding→actual boot→target calls→failure/refactor certification 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 MyBatis mapper contract와 refactor governance를 작성하세요.", requirements: ["namespace/id/interface naming을 정의합니다.", "overload와 registration duplication을 금지합니다.", "parameter/return/cardinality 규칙을 둡니다.", "Object/default/inheritance 정책을 둡니다.", "mapper scan/multi-factory route를 정의합니다.", "binding migration/compatibility window를 둡니다.", "static/boot/target/concurrency test pyramid를 요구합니다.", "safe operation telemetry와 route coverage를 운영합니다."], hints: ["컴파일 가능한 interface와 실행 가능한 mapped statement 사이의 검증 단계를 빠짐없이 나누세요."], expectedOutcome: "mapper 생성부터 package rename과 incident까지 일관된 binding 표준이 완성됩니다.", solutionOutline: ["name→register→dispatch→map→route→measure→migrate 순서입니다."] },
  ],
  nextSessions: ["mybatis-03-parameter-binding"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["mybatis-config.xml은 type alias configuration context만 제공하며 mapper registration 전체 구성을 포함한 것으로 가정하지 않았습니다.", "BoardMapper.xml은 세 statement id와 namespace 구조, hash-style binding 네 곳이 확인됐지만 namespace·SQL·parameter literal을 복사하지 않았습니다.", "BoardMapper.java는 XML id와 대응하는 method 세 개가 확인됐지만 package/source body를 복사하지 않았습니다.", "JDK proxy examples는 binding 원리를 위한 executable model이며 실제 MyBatis MapperProxy/MapperMethod, Spring AOP, target driver와 transaction behavior를 대체하지 않습니다."] },
});

export default session;
