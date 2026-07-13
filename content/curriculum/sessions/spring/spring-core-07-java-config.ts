import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 21 records·functions·collections로 Java configuration의 factory metadata와 composition 결정을 작은 실행 모델로 만듭니다." },
      { lines: "19-끝에서 5줄 전", explanation: "bean name/type, method-parameter graph, cached identity, configuration validation과 condition selection을 결정적으로 실행합니다." },
      { lines: "마지막 5줄", explanation: "instance identity, creation count, selected variant와 redacted validation category만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring jar·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "mini composition model은 Spring @Configuration enhancement와 @Bean lifecycle 구현을 대체하지 않습니다."] },
    experiments: [
      { change: "factory 호출 방식, scope, bean name, environment와 condition을 바꿉니다.", prediction: "container-managed identity와 Java direct-call identity, 등록 후보와 validation failure가 다른 단계에서 드러납니다.", result: "definition과 instance evidence를 구분해 기록합니다." },
      { change: "동일 graph를 실제 AnnotationConfigApplicationContext에서 실행합니다.", prediction: "configuration enhancement, post-processing, proxy와 lifecycle callback이 추가됩니다.", result: "BeanDefinition source, runtime type, singleton identity와 close outcome을 readback합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "java-composition-root",
    title: "Java configuration을 XML 치환 문법이 아니라 type-aware composition root로 사용합니다",
    lead: "@Configuration class는 object graph의 concrete implementations, factory arguments, scopes와 infrastructure policies를 한 경계에서 선언합니다.",
    explanations: [
      "원본 JavaConfig.java는 XML의 test, chef, hotel, data source-shaped object와 DAO 조립을 @Bean methods로 옮기고 MainClass는 AnnotationConfigApplicationContext로 bootstrap합니다. 이 progression만 사용하고 원본에 포함된 접속값 형태는 복사하지 않습니다.",
      "configuration code도 production code입니다. compiler type checking과 refactor 도구의 도움을 받지만 arbitrary Java branch, side effect와 hidden global state를 넣을 수 있으므로 deterministic composition 원칙이 필요합니다.",
      "composition root는 concrete implementation 선택을 집중하고 business service는 interface/constructor contract에 의존합니다. 여러 module의 세부 object creation이 application code 전역에 퍼지지 않게 합니다.",
      "@Configuration class가 domain policy를 계산하거나 remote API를 호출하면 bootstrap과 business 책임이 섞입니다. factory는 validated configuration과 dependencies로 object를 만들고 동작은 생성된 object에 둡니다.",
      "Java config와 component scan은 함께 사용할 수 있지만 explicit factory와 implicit discovery의 ownership을 정합니다. critical infrastructure는 explicit @Bean으로 name/type/lifecycle을 드러내는 편이 진단에 유리할 수 있습니다.",
    ],
    concepts: [
      c("Java configuration", "@Configuration과 @Bean methods로 BeanDefinitions와 object graph를 선언하는 Spring configuration 방식입니다.", ["type-aware factory arguments를 사용합니다.", "container lifecycle에 참여합니다."]),
      c("composition root", "application의 concrete objects와 configuration을 조립하는 최상위 경계입니다.", ["implementation 선택을 집중합니다.", "business code의 service locator를 막습니다."]),
      c("configuration purity", "같은 승인 입력이 같은 definitions와 policies를 만들고 bootstrap 중 불필요한 외부 side effect가 없는 성질입니다.", ["재현성과 testability를 높입니다.", "remote readiness는 별도 probe로 둡니다."]),
    ],
    codeExamples: [java("core07-composition", "factory arguments로 명시한 object graph", "Core07Composition.java", "config factory가 concrete repository를 만들고 service constructor에 명시적으로 전달하는 composition root를 실행합니다.", String.raw`public class Core07Composition {
  interface Repository { String find(int id); }
  record MemoryRepository() implements Repository {
    public String find(int id) { return "item-" + id; }
  }
  static final class CatalogService {
    private final Repository repository;
    CatalogService(Repository repository) { this.repository = repository; }
    String item(int id) { return repository.find(id); }
  }
  static final class AppConfig {
    Repository repository() { return new MemoryRepository(); }
    CatalogService catalogService(Repository repository) { return new CatalogService(repository); }
  }
  public static void main(String[] args) {
    AppConfig config = new AppConfig();
    Repository repository = config.repository();
    CatalogService service = config.catalogService(repository);
    System.out.println("repository=" + repository.getClass().getSimpleName());
    System.out.println("result=" + service.item(7));
    System.out.println("explicit-graph=true");
  }
}`, "repository=MemoryRepository\nresult=item-7\nexplicit-graph=true", ["local-java-config", "local-java-main", "spring-java-basic", "java-records-jls"])],
    diagnostics: [
      d("configuration class가 business rule을 중복 구현합니다.", "factory method가 object creation을 넘어 계산·workflow를 소유합니다.", ["@Bean bodies", "domain logic", "external calls", "test duplication", "change owners"], "configuration은 validation된 inputs와 dependencies를 조립하고 policy는 명시적 service/value object로 옮깁니다.", "configuration package의 복잡도·I/O architecture rule을 둡니다."),
      d("object graph 생성 위치가 여러 main/test/config에 흩어졌습니다.", "composition root 경계가 정의되지 않았습니다.", ["new call sites", "context creation", "test builders", "module configs", "implementation selection"], "production root와 test composition helpers를 명시하고 concrete selection은 configuration modules에 집중합니다.", "implementation new/context lookup을 architecture test로 제한합니다."),
    ],
    expertNotes: ["Java config는 type safety를 주지만 semantic correctness와 lifecycle을 자동 보장하지 않습니다.", "configuration method 이름과 package 구조는 운영 graph를 읽는 documentation이므로 의도적으로 설계합니다."],
  },
  {
    id: "bean-method-metadata",
    title: "@Bean method의 이름·return type·parameters를 definition 계약으로 설계합니다",
    lead: "factory method signature는 bean name, predicted type와 dependency edges를 표현하며 body는 instance creation만 담당해야 합니다.",
    explanations: [
      "기본 bean name은 method name이지만 annotation name/aliases로 명시할 수 있습니다. internal bean name과 domain/public route key를 분리하고 rename에는 alias/deprecation을 둡니다.",
      "return type은 candidate resolution과 AOT 분석에 사용됩니다. interface return은 abstraction을 드러내지만 implementation-specific lifecycle/type prediction이 필요할 때 contract를 검토합니다.",
      "method parameters로 dependencies를 받으면 Spring이 type/qualifier rules로 resolve하고 graph edge가 signature에 보입니다. 같은 configuration의 다른 @Bean method를 직접 호출하는 방식보다 lite/full 차이에 덜 의존합니다.",
      "@Bean method는 constructor, static/instance factory semantics와 init/destroy metadata를 가질 수 있습니다. resource를 생성하면 close method, failure cleanup과 context owner를 명시합니다.",
      "factory에서 null을 반환하거나 서로 다른 runtime types를 condition 없이 바꾸면 type prediction과 consumer invariant가 흔들립니다. variant는 조건별 definitions 또는 stable interface strategy로 분리합니다.",
    ],
    concepts: [
      c("bean method", "container가 BeanDefinition/factory로 해석하는 @Bean annotated method입니다.", ["기본 이름은 method name입니다.", "parameters는 dependencies입니다."]),
      c("predicted type", "bean을 완전히 생성하기 전 factory signature/metadata에서 container가 알 수 있는 type입니다.", ["candidate resolution에 중요합니다.", "runtime proxy/product type과 비교합니다."]),
      c("method parameter wiring", "@Bean method parameters를 container가 다른 bean candidates로 해결하는 composition 방식입니다.", ["dependency edge를 명시합니다.", "configuration enhancement 의존을 줄입니다."]),
    ],
    codeExamples: [java("core07-names-types", "factory name·type·dependency metadata manifest", "Core07Metadata.java", "bean factory metadata를 정규화해 이름, return contract와 dependencies를 비밀값 없이 출력합니다.", String.raw`import java.util.List;

public class Core07Metadata {
  record BeanMethod(String name, String returnType, List<String> dependencies) {}
  public static void main(String[] args) {
    List<BeanMethod> methods = List.of(
      new BeanMethod("repository", "Repository", List.of()),
      new BeanMethod("catalogService", "CatalogService", List.of("repository")),
      new BeanMethod("healthIndicator", "HealthIndicator", List.of("repository")));
    System.out.println("names=" + methods.stream().map(BeanMethod::name).toList());
    System.out.println("catalog-deps=" + methods.get(1).dependencies());
    System.out.println("types=" + methods.stream().map(BeanMethod::returnType).toList());
  }
}`, "names=[repository, catalogService, healthIndicator]\ncatalog-deps=[repository]\ntypes=[Repository, CatalogService, HealthIndicator]", ["spring-bean-annotation", "spring-bean-api", "spring-java-basic", "java-list"])],
    diagnostics: [
      d("@Bean return type을 Object로 선언해 autowiring이 실패합니다.", "container가 creation 전에 필요한 application type을 충분히 예측하지 못합니다.", ["method signature", "actual return", "injection type", "FactoryBean/proxy", "candidate manifest"], "factory return을 안정된 application interface/concrete contract로 좁히고 context resolution test를 둡니다.", "@Bean signature lint와 type candidate snapshot을 둡니다."),
      d("bean method rename 후 문자열 lookup이 깨집니다.", "기본 method name을 외부/public identity로 사용했습니다.", ["bean aliases", "getBean strings", "SpEL", "saved routes", "metrics"], "external stable key를 별도 contract로 만들고 필요한 기간 explicit alias를 제공합니다.", "string bean-name usage와 deprecation telemetry를 관리합니다."),
    ],
    expertNotes: ["@Bean method signature는 composition API이므로 IDE convenience보다 candidate/lifecycle contract를 우선합니다.", "method parameter name fallback에 의존하지 않고 type·qualifier를 명시합니다."],
  },
  {
    id: "full-lite-proxybeanmethods",
    title: "full @Configuration enhancement와 lite @Bean direct-call 차이를 instance identity로 증명합니다",
    lead: "@Configuration의 proxyBeanMethods와 일반 component의 @Bean은 inter-bean method 호출이 container lookup인지 순수 Java 호출인지가 달라질 수 있습니다.",
    explanations: [
      "full configuration의 기본 enhancement는 같은 class 안에서 @Bean method를 호출할 때 container-managed instance semantics를 보존하도록 subclass interception을 사용할 수 있습니다.",
      "proxyBeanMethods=false 또는 non-@Configuration lite mode에서는 `chef()` 같은 direct Java call이 매번 새 object를 만들 수 있습니다. singleton definition과 factory method 직접 호출을 혼동하지 않습니다.",
      "method parameters로 collaborator를 받으면 full/lite self-invocation 차이를 피하고 dependency graph가 더 명시적입니다. AOT와 configuration startup 최적화에도 단순한 factory semantics가 유리할 수 있습니다.",
      "configuration class/method가 final, visibility 제약 또는 early instantiation을 가지면 enhancement expectations가 깨질 수 있습니다. 현재 지원 버전 @Configuration API constraints를 확인합니다.",
      "identity test는 getBean 두 번, dependency 내부 reference와 direct method call을 각각 비교해야 합니다. `@Bean` annotation이 모든 직접 Java 호출을 singleton으로 만든다고 설명하지 않습니다.",
    ],
    concepts: [
      c("full configuration", "@Configuration class enhancement를 통해 inter-bean method calls에 container semantics를 적용하는 mode입니다.", ["proxyBeanMethods 설정을 확인합니다.", "runtime subclass/proxy를 사용할 수 있습니다."]),
      c("lite mode", "@Bean methods가 일반 factory methods처럼 처리되고 class 내부 direct call이 interception되지 않는 configuration 형태입니다.", ["method parameter wiring을 선호합니다.", "direct call은 새 instance를 만들 수 있습니다."]),
      c("inter-bean call", "한 @Bean method body가 같은 configuration의 다른 factory method를 직접 호출하는 패턴입니다.", ["mode에 따라 identity가 달라질 수 있습니다.", "explicit parameters로 대체할 수 있습니다."]),
    ],
    codeExamples: [java("core07-full-lite", "cached registry와 direct factory 호출 identity", "Core07Identity.java", "container cache를 거친 singleton lookup과 순수 Java factory direct call의 생성 수/identity 차이를 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;

public class Core07Identity {
  static final class Config {
    int creations;
    Object dependency() { creations++; return new Object(); }
  }
  static final class Registry {
    final Map<String, Object> singletons = new LinkedHashMap<>();
    Object get(String name, Supplier<Object> factory) { return singletons.computeIfAbsent(name, ignored -> factory.get()); }
  }
  public static void main(String[] args) {
    Config config = new Config();
    Registry registry = new Registry();
    Object managed1 = registry.get("dependency", config::dependency);
    Object managed2 = registry.get("dependency", config::dependency);
    Object direct1 = config.dependency();
    Object direct2 = config.dependency();
    System.out.println("managed-same=" + (managed1 == managed2));
    System.out.println("direct-same=" + (direct1 == direct2));
    System.out.println("creations=" + config.creations);
  }
}`, "managed-same=true\ndirect-same=false\ncreations=3", ["spring-configuration-api", "spring-java-basic", "spring-bean-annotation", "java-supplier", "java-map"])],
    diagnostics: [
      d("dependency가 singleton인데 내부 reference가 다른 object입니다.", "lite/proxyBeanMethods=false configuration에서 다른 @Bean method를 직접 호출했습니다.", ["configuration annotation", "proxyBeanMethods", "factory body calls", "getBean identity", "creation count"], "dependency를 @Bean method parameter로 받아 container resolution에 맡깁니다.", "managed/direct/dependency identity context tests를 둡니다."),
      d("configuration class enhancement가 실패합니다.", "full mode proxy 제약과 class/method visibility/finality 또는 너무 이른 instance creation이 충돌합니다.", ["runtime config class", "proxyBeanMethods", "final/private methods", "creation warnings", "Spring version"], "method-parameter wiring과 lite-safe factory 구조로 단순화하거나 공식 constraints를 충족합니다.", "configuration mode별 compile/context upgrade tests를 둡니다."),
    ],
    expertNotes: ["proxyBeanMethods=false는 단순 성능 플래그가 아니라 factory body 작성 계약입니다.", "singleton identity는 annotation 표면이 아니라 container lookup/cache와 scope에서 나옵니다."],
  },
  {
    id: "modular-import-boundaries",
    title: "@Import와 module configuration으로 graph ownership·의존 방향을 구조화합니다",
    lead: "하나의 거대 configuration 대신 domain/application/infrastructure modules가 제공하는 definitions와 import 방향을 명시해 변경 범위와 test slice를 줄입니다.",
    explanations: [
      "@Import는 configuration classes, selectors와 registrars를 조합할 수 있습니다. 단순 module composition과 dynamic registration을 구분하고 extension에는 versioned contract를 둡니다.",
      "하위 infrastructure config가 상위 application config를 import하는 역방향을 피합니다. top-level application root가 modules를 선택하고 하위 modules는 필요한 ports/types만 제공합니다.",
      "package-private factory helpers와 public configuration API를 구분해 다른 module이 internal bean name에 의존하지 않게 합니다.",
      "component scanning을 module config 안에 제한하고 exclude/include filters를 검증합니다. test/example implementation이 production artifact에 accidental candidate로 들어오지 않게 합니다.",
      "configuration module마다 focused context test, definition manifest와 owner를 두고 전체 application test는 module 간 graph와 conditions를 검증합니다.",
    ],
    concepts: [
      c("@Import", "다른 configuration class 또는 selector/registrar를 현재 context 구성에 포함하는 annotation입니다.", ["module composition에 사용합니다.", "dynamic registration은 별도 검증합니다."]),
      c("configuration module", "관련 bean definitions, external inputs와 lifecycle policies를 하나의 architecture 경계로 묶은 구성 단위입니다.", ["owner와 public ports를 둡니다.", "focused context test를 가집니다."]),
      c("import direction", "어떤 configuration module이 다른 module의 definitions를 선택·포함하는지의 dependency 방향입니다.", ["top-level root가 조합합니다.", "cycle을 금지합니다."]),
    ],
    diagnostics: [
      d("@Import chain이 순환하거나 어떤 config가 bean을 등록했는지 모릅니다.", "module ownership과 import 방향이 정의되지 않았습니다.", ["import graph", "definition sources", "selectors/registrars", "module owners", "cycles"], "top-level root→feature→infrastructure의 DAG를 만들고 source manifest를 기록합니다.", "configuration import cycle/module boundary tests를 둡니다."),
      d("test configuration bean이 production에 등록됩니다.", "scan/import 범위가 test/example package 또는 artifact를 포함했습니다.", ["artifact contents", "scan roots", "imports", "profiles", "definition role/source"], "test configuration을 test source/artifact로 격리하고 explicit imports와 production manifest allow-list를 둡니다.", "production artifact context smoke와 forbidden definition gate를 둡니다."),
    ],
    expertNotes: ["configuration modularity는 file split이 아니라 graph ownership과 public composition contract 분리입니다.", "ImportSelector/registrar는 framework extension code이므로 direct @Import보다 강한 upgrade/observability tests가 필요합니다."],
  },
  {
    id: "externalized-validated-config",
    title: "설정값을 source code 밖에서 주입하고 typed validation·redaction·rotation을 적용합니다",
    lead: "Java config에 URL·사용자·비밀번호·token을 literal로 쓰지 않고 Environment/config properties/secret provider 경계에서 typed immutable settings를 만듭니다.",
    explanations: [
      "원본 JavaConfig에는 학습용 접속값 형태가 직접 들어 있습니다. 공개 세션은 값 자체를 재사용·출력하지 않고 'source literal을 externalized validated secret/config로 이동해야 한다'는 구조적 lesson만 사용합니다.",
      "non-secret endpoint, timeout와 pool size도 environment별 configuration이지만 secret과 같은 저장·노출 정책은 아닙니다. data class를 public/non-secret, sensitive, credential로 분류합니다.",
      "Environment.getProperty를 factory body 곳곳에서 호출하면 key 문자열, default와 validation이 분산됩니다. 한 번 bind/validate한 immutable settings object를 dependencies로 전달합니다.",
      "missing, malformed, out-of-range와 unauthorized credential을 구분합니다. syntax/range는 local startup validation, credential validity는 bounded external probe로 처리합니다.",
      "로그에는 key, source layer, presence, validation category와 version만 남기고 actual value, URI user-info, token, password와 full exception payload를 기록하지 않습니다.",
    ],
    concepts: [
      c("externalized configuration", "배포 environment가 값을 제공하고 source code는 key/schema와 사용 contract만 정의하는 구성 방식입니다.", ["artifact 재사용성을 높입니다.", "source precedence를 관리합니다."]),
      c("typed settings", "문자열 입력을 domain type/range/required rules로 변환·검증한 immutable configuration object입니다.", ["factory에 전달합니다.", "raw environment lookup을 분산시키지 않습니다."]),
      c("secret redaction", "민감 값 자체 대신 presence/version/category 같은 최소 evidence만 관측하는 정책입니다.", ["toString/exception도 검사합니다.", "rotation과 revoke를 지원합니다."]),
    ],
    codeExamples: [java("core07-config-validation", "값을 출력하지 않는 typed configuration validation", "Core07Settings.java", "synthetic input을 typed settings로 변환하면서 성공 시 민감값 존재 여부만, 실패 시 안정된 category만 출력합니다.", String.raw`import java.time.Duration;
import java.util.Map;

public class Core07Settings {
  record Settings(Duration timeout, int poolSize, String secret) {
    static Settings from(Map<String, String> input) {
      int pool = Integer.parseInt(input.getOrDefault("POOL_SIZE", "0"));
      if (pool < 1 || pool > 100) throw new IllegalArgumentException("pool range");
      String secret = input.get("APP_SECRET");
      if (secret == null || secret.isBlank()) throw new IllegalArgumentException("secret missing");
      return new Settings(Duration.ofSeconds(2), pool, secret);
    }
    String safeSummary() { return "timeout=" + timeout + ",pool=" + poolSize + ",secret-present=" + !secret.isBlank(); }
  }
  public static void main(String[] args) {
    Settings ok = Settings.from(Map.of("POOL_SIZE", "8", "APP_SECRET", "synthetic-placeholder"));
    System.out.println("valid=" + ok.safeSummary());
    try { Settings.from(Map.of("POOL_SIZE", "0", "APP_SECRET", "synthetic-placeholder")); }
    catch (IllegalArgumentException error) { System.out.println("invalid=" + error.getMessage()); }
    System.out.println("secret-value-printed=false");
  }
}`, "valid=timeout=PT2S,pool=8,secret-present=true\ninvalid=pool range\nsecret-value-printed=false", ["local-java-config", "spring-environment", "spring-property-source", "java-duration", "java-map"])],
    diagnostics: [
      d("production secret이 Java config와 git history에 남았습니다.", "factory method에 credential literal을 작성했습니다.", ["source/history", "build artifacts", "logs", "secret issuer usage", "fork/cache"], "secret을 즉시 revoke/rotate하고 history/artifacts를 incident 절차로 처리한 뒤 short-lived provider로 외부화합니다.", "secret scanning, push protection와 synthetic-only examples를 둡니다."),
      d("설정 오류가 첫 요청까지 발견되지 않습니다.", "raw property를 lazy method에서 읽고 typed startup validation이 없습니다.", ["binding time", "required keys", "range/type", "readiness", "first-use path"], "critical settings를 startup에 bind/validate하고 external validity는 readiness probe로 검증합니다.", "missing/malformed/boundary/profile configuration tests를 둡니다."),
    ],
    expertNotes: ["환경변수는 secret manager가 아니며 process inspection, crash dump와 child inheritance 위험을 별도 관리합니다.", "redacted log도 key 이름 자체가 민감할 수 있어 allow-list schema를 사용합니다."],
  },
  {
    id: "profiles-conditions-variants",
    title: "@Profile·@Conditional로 variant definitions를 만들되 지원 matrix와 exactly-one invariant를 검증합니다",
    lead: "환경별 구현 선택은 Java if문보다 container condition metadata로 표현해 definition 등록 근거와 후보 cardinality를 관측할 수 있습니다.",
    explanations: [
      "@Profile은 environment profile expression으로 configuration/@Bean 등록을 제한합니다. profile 이름을 secret이나 세부 host와 결합하지 않고 지원 product variant로 관리합니다.",
      "@Conditional은 custom predicate와 meta-annotations를 만들 수 있지만 property/classpath state가 hidden global input이 되므로 condition outcome과 version을 기록합니다.",
      "local memory, production remote와 test fake가 동시에 또는 모두 비활성화되지 않도록 required port마다 지원 environment에서 정확히 한 후보를 검증합니다.",
      "fallback bean은 명시적 optional capability에만 사용합니다. critical implementation creation failure를 no-op/fallback으로 조용히 대체하면 outage가 정상처럼 보입니다.",
      "condition logic을 @Bean body의 if/else로 숨기면 반환 type/lifecycle과 definition provenance가 하나의 이름 아래 바뀝니다. variant별 named definitions와 common interface를 선호합니다.",
    ],
    concepts: [
      c("profile expression", "active profiles를 기준으로 configuration/bean 등록 여부를 정하는 boolean expression입니다.", ["지원 조합을 문서화합니다.", "matrix test를 둡니다."]),
      c("condition outcome", "특정 definition condition이 어떤 metadata/input에서 match 또는 no-match였는지의 결과입니다.", ["비밀값 없이 관측합니다.", "candidate manifest에 연결합니다."]),
      c("variant invariant", "지원 environment마다 required capability 구현이 정확히 하나이고 승인된 policy를 가진다는 조건입니다.", ["0/N을 startup 실패시킵니다.", "optional capability와 구분합니다."]),
    ],
    codeExamples: [java("core07-variant-matrix", "environment별 exactly-one configuration variant", "Core07Variants.java", "variant의 environment set을 평가해 local/prod는 단일 선택, broken은 중복, test는 누락으로 분류합니다.", String.raw`import java.util.List;
import java.util.Set;

public class Core07Variants {
  record Variant(String name, Set<String> environments) {}
  static String select(List<Variant> all, String environment) {
    List<String> active = all.stream().filter(v -> v.environments().contains(environment)).map(Variant::name).sorted().toList();
    return active.size() == 1 ? "selected:" + active.getFirst() : "invalid:" + active;
  }
  public static void main(String[] args) {
    List<Variant> variants = List.of(
      new Variant("memoryCatalog", Set.of("local")),
      new Variant("remoteCatalog", Set.of("prod", "broken")),
      new Variant("legacyCatalog", Set.of("broken")));
    System.out.println("local=" + select(variants, "local"));
    System.out.println("prod=" + select(variants, "prod"));
    System.out.println("broken=" + select(variants, "broken"));
    System.out.println("test=" + select(variants, "test"));
  }
}`, "local=selected:memoryCatalog\nprod=selected:remoteCatalog\nbroken=invalid:[legacyCatalog, remoteCatalog]\ntest=invalid:[]", ["spring-profile-api", "spring-conditional-api", "spring-environment", "java-list", "java-set"])],
    diagnostics: [
      d("특정 profile에서 required bean이 0개 또는 2개입니다.", "variant conditions가 exhaustive/mutually exclusive하지 않습니다.", ["active profiles", "condition outcomes", "candidate manifest", "artifact classpath", "fallback"], "지원 matrix에서 exactly-one invariant를 parameterized context test로 강제합니다.", "condition truth table과 production artifact smoke를 release gate로 둡니다."),
      d("fallback이 critical adapter 장애를 숨깁니다.", "creation failure와 configured absence를 같은 no-op path로 처리했습니다.", ["definition matched", "creation exception", "fallback condition", "readiness", "feature criticality"], "critical candidate matched 후 실패하면 startup/readiness를 실패시키고 fallback은 명시적 policy absence에만 사용합니다.", "missing/matched-failed/degraded tests를 분리합니다."),
    ],
    expertNotes: ["profile 수가 조합 폭발하면 typed configuration/feature management와 module variants를 재설계합니다.", "condition 결과에는 property 실제 값 대신 key, source, match category와 config version을 남깁니다."],
  },
  {
    id: "scope-lifecycle-resource",
    title: "@Bean이 만든 resource의 scope·init·destroy와 partial-failure ownership을 정의합니다",
    lead: "DataSource, client, executor 같은 factory 결과는 단순 object가 아니라 생성·warmup·사용·종료와 failure cleanup을 가진 resource입니다.",
    explanations: [
      "singleton @Bean은 context당 identity를 재사용하지만 thread safety를 자동 제공하지 않습니다. factory가 mutable per-request state를 singleton에 캡처하지 않게 합니다.",
      "prototype은 container가 생성은 해도 destruction 전체를 추적하지 않을 수 있으므로 caller/factory가 close ownership을 갖습니다. resource-bearing prototype은 lease API가 더 명확할 수 있습니다.",
      "@Bean destroyMethod inference와 명시적 method를 사용할 수 있지만 AutoCloseable/Closeable method 존재, proxy와 external ownership을 확인해 이중 close를 피합니다.",
      "init method에서 external migration/remote call을 수행하면 retry/timeout/partial creation을 관리해야 합니다. local object construction, validation, warmup/readiness를 phase로 분리합니다.",
      "configuration refresh 실패 시 이미 만들어진 resources가 역순 정리되는지, destroy 한 곳 실패가 나머지를 막지 않는지 fault integration test를 둡니다.",
    ],
    concepts: [
      c("destroy method", "context 종료 시 @Bean resource 정리를 위해 호출되는 lifecycle callback입니다.", ["명시/inference semantics를 확인합니다.", "timeout/error policy를 둡니다."]),
      c("scope", "bean instance가 생성·공유되는 identity/lifetime 경계입니다.", ["singleton/prototype/request 등을 구분합니다.", "resource ownership과 연결합니다."]),
      c("partial bootstrap", "context refresh 도중 일부 beans/resources는 생성됐지만 뒤 단계가 실패한 상태입니다.", ["생성 완료 목록을 정리합니다.", "traffic readiness를 열지 않습니다."]),
    ],
    diagnostics: [
      d("context close 후 executor/pool thread가 남습니다.", "@Bean resource의 destroy callback 또는 context close ownership이 없습니다.", ["bean return type", "destroy method", "context owner", "remaining threads", "callback errors"], "AutoCloseable/destroy contract를 명시하고 context를 close하며 종료 후 absence를 readback합니다.", "normal/failed-start/failing-destroy lifecycle tests를 둡니다."),
      d("prototype resource가 누적됩니다.", "provider로 매번 생성하지만 caller가 close하지 않습니다.", ["scope", "lookup count", "creator/caller", "AutoCloseable", "resource metrics"], "lease/factory API로 close ownership을 type에 포함하거나 managed scope로 재설계합니다.", "creation-close count invariant와 leak budget을 둡니다."),
    ],
    expertNotes: ["@Bean method가 반환하는 third-party type은 우리가 lifecycle adapter contract를 정의해야 할 수 있습니다.", "destroyMethod 추론은 편리하지만 critical resource에서는 명시적 contract/test가 더 안전합니다."],
  },
  {
    id: "aot-native-optimization",
    title: "AOT·native image와 proxyBeanMethods 최적화를 reflection 없는 graph contract로 준비합니다",
    lead: "정적 분석 가능한 factory signatures와 explicit imports는 AOT가 graph와 runtime hints를 계산하기 쉽게 만들지만 dynamic registration은 별도 metadata가 필요합니다.",
    explanations: [
      "AOT processing은 build time에 bean factory initialization 일부와 hints를 생성할 수 있습니다. runtime environment-dependent arbitrary registration은 분석 가능성을 낮춥니다.",
      "proxyBeanMethods=false와 method-parameter wiring은 configuration class enhancement를 줄일 수 있지만 identity/lifecycle correctness가 먼저이며 benchmark와 native tests로 이득을 확인합니다.",
      "reflection, resources, serialization와 proxies가 필요한 third-party beans에는 runtime hints가 필요할 수 있습니다. compile 성공만 아니라 native executable context/startup/business path를 실행합니다.",
      "build-time condition과 runtime external config를 구분합니다. secret이나 배포별 값을 native image에 bake하지 않고 runtime secure source로 전달합니다.",
      "AOT generated artifacts와 hint changes는 source/Framework/JDK/native toolchain version과 함께 provenance를 남기고 patch upgrade differential tests를 실행합니다.",
    ],
    concepts: [
      c("AOT processing", "build time에 application context metadata를 분석·생성해 runtime bootstrap을 준비하는 과정입니다.", ["정적 graph를 선호합니다.", "dynamic behavior에는 hints/tests가 필요합니다."]),
      c("runtime hint", "native/reflection/resource/proxy 접근에 필요한 metadata를 AOT/native toolchain에 알려 주는 contract입니다.", ["최소 범위로 등록합니다.", "native execution으로 검증합니다."]),
      c("configuration enhancement", "full @Configuration semantics를 위해 runtime subclass/proxy behavior를 적용하는 처리입니다.", ["lite mode와 구분합니다.", "optimization 전 identity를 검증합니다."]),
    ],
    diagnostics: [
      d("JVM에서는 되지만 native image에서 bean 생성이 실패합니다.", "reflection/resource/proxy hint 또는 dynamic registration metadata가 없습니다.", ["native stack", "AOT report", "runtime hints", "factory signatures", "resources/proxies"], "공식 hints API/registrar로 최소 metadata를 추가하고 native context/business tests를 실행합니다.", "JVM+native support matrix를 CI에 둡니다."),
      d("proxyBeanMethods=false 전환 후 singleton identity가 바뀝니다.", "inter-bean direct calls를 method parameters로 바꾸지 않았습니다.", ["factory body calls", "creation count", "dependency references", "scope", "mode"], "self-calls를 explicit method parameter wiring으로 전환하고 identity differential test를 통과시킵니다.", "configuration-mode mutation tests를 둡니다."),
    ],
    expertNotes: ["AOT 친화성은 application architecture를 단순화하는 feedback이지 hints로 모든 dynamic design을 숨기는 작업이 아닙니다.", "native image build에 secret을 입력하지 않고 build/run configuration 경계를 attestation합니다."],
  },
  {
    id: "xml-migration-tests",
    title: "XML→Java config를 definition/identity/lifecycle differential test로 migration합니다",
    lead: "class가 같은지만 비교하지 않고 name·alias·scope·lazy·constructor/property·init/destroy·post-processing과 실패 의미를 보존합니다.",
    explanations: [
      "원본 XML과 Java config를 동시에 read-only inventory해 BeanDefinition manifest를 만듭니다. property 실제 값은 기록하지 않고 key/type/presence와 source만 남깁니다.",
      "XML constructor-arg ref는 @Bean method parameter로, property injection은 가능하면 validated constructor settings로 바꿉니다. mutable setter 의미를 그대로 복제하기 전에 required/optional을 재분류합니다.",
      "old/new contexts를 따로 띄워 bean names, aliases, predicted/runtime types, scopes, lazy/eager identity, dependencies와 lifecycle events를 비교합니다.",
      "동시에 같은 bean names를 등록해 override로 전환하지 않습니다. module별 cutover, compatibility aliases와 rollback-able configuration import를 둡니다.",
      "완료 후 XML을 즉시 삭제하기보다 provenance link, 지원 종료 설명과 migration decision을 학습자료에 남겨 과거 예제와 현재 권장안을 연결합니다.",
    ],
    concepts: [
      c("definition parity", "old/new configuration이 같은 의도적 BeanDefinition metadata와 object behavior를 제공하는 상태입니다.", ["manifest와 tests로 증명합니다.", "의도적 변경은 승인합니다."]),
      c("parallel context", "old와 new configuration을 별도 contexts에서 실행해 graph/behavior를 비교하는 migration test 구조입니다.", ["name collision을 피합니다.", "동일 fixture를 사용합니다."]),
      c("configuration cutover", "application root가 old configuration import에서 new configuration import로 전환되는 release 단계입니다.", ["rollback path를 둡니다.", "compatibility window를 관리합니다."]),
    ],
    diagnostics: [
      d("Java config 전환 후 prototype이 singleton입니다.", "class/factory 결과만 비교하고 scope metadata를 누락했습니다.", ["old/new definitions", "scope", "identity tests", "provider use", "lifecycle owner"], "manifest checklist에 scope/lazy/init/destroy를 포함하고 반복 lookup identity를 검증합니다.", "configuration differential corpus를 cutover gate로 둡니다."),
      d("두 config를 함께 import해 어느 bean이 쓰이는지 모릅니다.", "같은 이름 override order로 migration을 시도했습니다.", ["definition sources", "override policy", "import order", "aliases", "runtime type"], "old/new contexts 또는 module별 unique names로 비교하고 명시적 root cutover를 수행합니다.", "override를 기본 실패시키고 의도적 replacement만 승인합니다."),
    ],
    expertNotes: ["migration은 표현 형식 변경이면서 hidden secret/optional/cycle 문제를 바로잡을 기회입니다.", "과거 XML 예제를 틀렸다고 지우기보다 해당 Spring/JDK baseline과 현대 migration link를 제공합니다."],
  },
  {
    id: "observability-qualification",
    title: "Java config graph를 비밀값 없이 관측하고 framework/configuration upgrade를 qualification합니다",
    lead: "configuration이 code가 되면 commit diff만으로 충분하지 않으며 build artifact에서 실제 definitions, conditions, identities와 lifecycle을 readback해야 합니다.",
    explanations: [
      "startup manifest에는 config class/method, bean name/type/scope/lazy, dependency names, condition id/outcome, source commit과 framework/JDK version을 기록합니다.",
      "factory duration과 error를 관측하되 constructor arguments, environment values와 bean toString을 span attributes에 넣지 않습니다. bounded name/phase/category만 사용합니다.",
      "BeanCreationException에서는 failed @Bean method, dependency path와 innermost cause를 구조화합니다. local validation, candidate resolution, factory exception와 external readiness failure를 분류합니다.",
      "upgrade corpus는 full/lite identity, method-parameter resolution, aliases/types, profiles/conditions, lifecycle close, AOT/native와 XML parity cases를 포함합니다.",
      "canary에서 graph hash, startup budget, critical readiness, threads/pools와 secret-zero scans를 확인하고 threshold 위반 시 artifact+configuration을 함께 rollback합니다.",
    ],
    concepts: [
      c("configuration manifest", "실제 artifact에서 Java config가 만든 definitions와 dependencies를 정규화한 비밀값 없는 evidence입니다.", ["배포 간 graph를 비교합니다.", "condition/source provenance를 포함합니다."]),
      c("factory span", "@Bean factory/initialization phase의 duration과 stable outcome category를 기록한 trace입니다.", ["raw arguments를 제외합니다.", "slow/failing owner를 찾습니다."]),
      c("configuration qualification", "Spring/JDK/config/AOT 변경 뒤 graph·identity·lifecycle·failure가 승인 기준을 지키는지 반복 검증하는 과정입니다.", ["negative cases를 포함합니다.", "canary/rollback과 연결합니다."]),
    ],
    diagnostics: [
      d("@Bean method가 느리지만 원인을 찾을 수 없습니다.", "context refresh total만 측정하고 factory/dependency critical path를 기록하지 않았습니다.", ["factory spans", "dependency graph", "external calls", "class init", "thread state"], "definition name/phase 기반 bounded spans와 critical path를 기록하고 외부 probe를 분리합니다.", "startup performance corpus와 phase budget을 둡니다."),
      d("manifest에 secret/property value가 포함됩니다.", "definition property/arguments를 전체 직렬화했습니다.", ["manifest schema", "factory args", "environment", "toString", "artifact access"], "name/type/presence/source/version/hash allow-list만 유지하고 value fields를 제외합니다.", "credential-shaped canary로 manifest/log/trace zero-leak tests를 둡니다."),
    ],
    expertNotes: ["graph hash는 구성 drift를 찾지만 외부 dependency behavior를 증명하지 않으므로 readiness/integration tests를 병행합니다.", "configuration code coverage보다 지원 variant와 failure graph coverage가 더 중요합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-java-config", repository: "SPRING/SpringDI", path: "src/main/java/ex08/javaconfig/JavaConfig.java", usedFor: ["XML-to-@Configuration/@Bean progression and inter-bean factory calls"], evidence: "원본을 read-only로 확인했으며 접속값 형태의 literals는 복사·출력하지 않았습니다." },
  { id: "local-java-main", repository: "SPRING/SpringDI", path: "src/main/java/ex08/javaconfig/MainClass.java", usedFor: ["AnnotationConfigApplicationContext bootstrap progression"], evidence: "원본을 read-only로 확인했으며 출력되는 설정값은 학습자료에 사용하지 않았습니다." },
  { id: "spring-java-basic", repository: "Spring Framework Reference", path: "Basic Concepts: @Bean and @Configuration", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/java/basic-concepts.html", usedFor: ["Java configuration and full/lite mode basics"], evidence: "Spring 공식 Java configuration reference입니다." },
  { id: "spring-bean-annotation", repository: "Spring Framework Reference", path: "Using the @Bean Annotation", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/java/bean-annotation.html", usedFor: ["bean names, aliases, dependencies, lifecycle and scope"], evidence: "Spring 공식 @Bean reference입니다." },
  { id: "spring-composing-config", repository: "Spring Framework Reference", path: "Composing Java-based Configurations", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/java/composing-configuration-classes.html", usedFor: ["@Import and modular configuration"], evidence: "Spring 공식 configuration composition reference입니다." },
  { id: "spring-environment", repository: "Spring Framework Reference", path: "Environment Abstraction", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/environment.html", usedFor: ["profiles, properties and externalized configuration"], evidence: "Spring 공식 Environment reference입니다." },
  { id: "spring-configuration-api", repository: "Spring Framework Javadoc", path: "Configuration", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Configuration.html", usedFor: ["full/lite and proxyBeanMethods contract"], evidence: "Spring 공식 Configuration API입니다." },
  { id: "spring-bean-api", repository: "Spring Framework Javadoc", path: "Bean", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Bean.html", usedFor: ["factory naming, init/destroy and profile contract"], evidence: "Spring 공식 Bean API입니다." },
  { id: "spring-import-api", repository: "Spring Framework Javadoc", path: "Import", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Import.html", usedFor: ["configuration module imports"], evidence: "Spring 공식 Import API입니다." },
  { id: "spring-profile-api", repository: "Spring Framework Javadoc", path: "Profile", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Profile.html", usedFor: ["profile variant registration"], evidence: "Spring 공식 Profile API입니다." },
  { id: "spring-conditional-api", repository: "Spring Framework Javadoc", path: "Conditional", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Conditional.html", usedFor: ["condition-based definition registration"], evidence: "Spring 공식 Conditional API입니다." },
  { id: "spring-property-source", repository: "Spring Framework Javadoc", path: "PropertySource", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/env/PropertySource.html", usedFor: ["configuration source precedence/provenance"], evidence: "Spring 공식 PropertySource API입니다." },
  { id: "spring-annotation-context", repository: "Spring Framework Javadoc", path: "AnnotationConfigApplicationContext", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/AnnotationConfigApplicationContext.html", usedFor: ["programmatic Java configuration bootstrap"], evidence: "Spring 공식 AnnotationConfigApplicationContext API입니다." },
  { id: "spring-aot", repository: "Spring Framework Reference", path: "Ahead of Time Optimizations", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aot.html", usedFor: ["AOT processing and runtime hints boundaries"], evidence: "Spring 공식 AOT reference입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["configuration manifests and variant examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["environment variant sets"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["singleton registry and typed settings examples"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-supplier", repository: "Java SE 21 API", path: "Supplier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Supplier.html", usedFor: ["factory and registry example"], evidence: "Oracle JDK 공식 Supplier API입니다." },
  { id: "java-duration", repository: "Java SE 21 API", path: "Duration", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["typed timeout settings"], evidence: "Oracle JDK 공식 Duration API입니다." },
  { id: "java-records-jls", repository: "Java Language Specification 21", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["immutable configuration/example records"], evidence: "Oracle JLS 공식 records specification입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-07-java-config", slug: "spring-core-07-java-config", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 7,
  title: "@Configuration·@Bean Java 설정으로 전환", subtitle: "XML 치환을 넘어 composition root, bean factory metadata, full/lite identity, typed external config, conditions, lifecycle, AOT와 differential migration을 증명합니다.", level: "전문가", estimatedMinutes: 1040,
  coreQuestion: "Java configuration이 type-safe하면서도 결정적이고 비밀값이 없으며, full/lite·profile·lifecycle·AOT·migration에서 동일한 object graph 계약을 지킨다는 것을 어떻게 검증할까요?",
  summary: "SpringDI의 JavaConfig.java와 MainClass.java를 read-only로 확인해 XML→@Configuration/@Bean과 AnnotationConfigApplicationContext progression을 보존했습니다. composition root/purity, @Bean name/type/parameters, full-vs-lite proxyBeanMethods identity, @Import module boundaries, typed external configuration/secret redaction, profile/condition variant matrix, scope/init/destroy/partial failure, AOT/native optimization, XML differential migration과 secret-zero observability/qualification까지 확장합니다. 다섯 JDK 21 exact examples는 explicit graph, bean metadata, managed/direct identity, typed settings와 environment variants를 실제 실행합니다.",
  objectives: ["Java configuration을 composition root와 BeanDefinition factory로 설명한다.", "@Bean name·return type·parameters와 lifecycle metadata를 설계한다.", "full/lite·proxyBeanMethods와 direct-call identity 차이를 증명한다.", "@Import configuration modules와 graph ownership/import DAG를 만든다.", "source literal을 typed external configuration과 secret redaction으로 전환한다.", "profile/condition variant의 exactly-one invariant를 검증한다.", "resource scope/init/destroy와 partial bootstrap cleanup을 운영한다.", "AOT/native hints와 configuration optimization을 qualification한다.", "XML→Java config name/scope/identity/lifecycle parity를 비교한다.", "manifest·factory spans·canary로 framework/config upgrade를 검증한다."],
  prerequisites: [{ title: "@Autowired·@Qualifier와 후보 충돌 해결", reason: "@Bean method parameters와 profile variants가 후보 resolution에 어떻게 참여하는지 이해해야 explicit Java graph를 설계할 수 있습니다.", sessionSlug: "spring-core-06-autowired-qualifier" }],
  keywords: ["@Configuration", "@Bean", "JavaConfig", "composition root", "factory method", "proxyBeanMethods", "full configuration", "lite mode", "@Import", "Environment", "externalized configuration", "@Profile", "@Conditional", "destroyMethod", "Spring AOT", "definition parity"], topics,
  lab: {
    title: "legacy XML/JavaConfig를 secret-zero modular Java configuration으로 재구성하기",
    scenario: "XML과 초기 JavaConfig가 함께 있고 inter-bean direct calls, source literals, 거대 config, 환경 if문과 resource lifecycle이 섞여 있어 supported modern configuration으로 안전하게 전환해야 합니다.",
    setup: ["원본 XML/Java files는 read-only로 보존하고 values가 아닌 definition/factory/signature graph만 inventory합니다.", "JDK 21 exact examples와 지원 Spring/JDK JVM/AOT disposable contexts를 준비합니다.", "old/new name/type/scope/lazy/dependency/lifecycle/condition manifest schema를 만듭니다.", "실제 credential/host/sample은 읽거나 복사하지 않고 synthetic config와 short-lived test resources만 사용합니다."],
    steps: ["Java configuration factories와 XML definitions를 secret-zero manifest로 추출합니다.", "configuration body에서 business logic, remote I/O와 global side effects를 제거합니다.", "inter-bean self calls를 explicit @Bean method parameters로 전환합니다.", "feature/infrastructure modules와 top-level @Import DAG를 설계합니다.", "raw properties를 typed immutable settings로 bind/validate/redact합니다.", "profile/condition 지원 matrix의 exactly-one candidate를 negative-test합니다.", "resource init/readiness/destroy와 failed-refresh cleanup을 검증합니다.", "full/lite identity와 JVM/AOT/native behavior를 differential test합니다.", "old/new contexts의 definition/instance/lifecycle/failure parity를 비교합니다.", "canary graph hash, startup budgets, secret-zero artifacts와 rollback cutover를 승인합니다."],
    expectedResult: ["모든 @Bean dependencies가 signature/manifest에 명시되고 hidden self-call identity 차이가 없습니다.", "source/history/log/artifact에 credential/host 실제 값이 새로 노출되지 않습니다.", "지원 environment마다 required implementation이 정확히 하나이며 condition 근거가 관측됩니다.", "normal/partial failure/close에서 resources가 역순으로 정리됩니다.", "XML→Java와 JVM→AOT 변경이 name/type/scope/behavior acceptance criteria를 지킵니다."],
    cleanup: ["disposable contexts/resources, generated manifests와 synthetic configurations를 run id로 제거합니다.", "contexts와 pools/executors/clients를 close하고 remaining resources absence를 readback합니다.", "temporary credentials/diagnostic access를 revoke합니다.", "원본 SPRING/SpringDI files는 변경하지 않습니다."],
    extensions: ["configuration manifest diff를 architecture CI와 deployment provenance에 연결합니다.", "custom RuntimeHintsRegistrar와 native image support matrix를 추가합니다.", "module configuration을 reusable test slices와 contract tests로 배포합니다.", "Spring/JDK patch별 factory/condition/lifecycle differential suite를 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 factory metadata→identity→configuration→variant 증거를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "composition root와 business logic을 구분합니다.", "bean method name/type/dependencies를 읽습니다.", "managed/direct identity 차이를 설명합니다.", "typed settings가 secret value를 출력하지 않음을 확인합니다.", "variant 0/1/N을 분류합니다."], hints: ["@Bean annotation보다 factory가 어떤 definition과 object identity를 만드는지 먼저 적으세요."], expectedOutcome: "Java config를 단순 XML 대체가 아닌 검증 가능한 composition system으로 설명합니다.", solutionOutline: ["declare→resolve→create→validate→operate→close 순서입니다."] },
    { difficulty: "응용", prompt: "원본 JavaConfig/XML을 modular secret-zero Java configuration으로 migration하세요.", requirements: ["값 없는 definition inventory를 만듭니다.", "method-parameter wiring으로 self-call을 제거합니다.", "config modules/import DAG를 설계합니다.", "typed external settings와 redaction을 적용합니다.", "variant candidate matrix를 테스트합니다.", "resource lifecycle/failure를 검증합니다.", "old/new JVM/AOT parity를 비교합니다.", "cutover/rollback evidence를 작성합니다."], hints: ["원본의 접속 관련 literal은 어떤 형태라도 공개 예제로 복사하지 마세요."], expectedOutcome: "type-safe하고 재현 가능하며 운영 가능한 modern configuration이 완성됩니다.", solutionOutline: ["safe audit→factory contracts→modules→config validation→differential tests→canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring Java configuration·migration·AOT 표준을 작성하세요.", requirements: ["composition root/config purity 규칙을 둡니다.", "@Bean signature/name/type/lifecycle 정책을 둡니다.", "full/lite/self-call gate를 둡니다.", "module/import/scan ownership을 정의합니다.", "typed config/secret hygiene를 요구합니다.", "profile/condition matrix를 둡니다.", "resource/AOT/native tests를 요구합니다.", "manifest/canary/rollback과 XML provenance를 포함합니다."], hints: ["type checking으로 잡히지 않는 identity, secret, condition과 lifecycle 실패를 각각 gate로 만드세요."], expectedOutcome: "configuration source부터 native 배포·rollback까지 일관된 governance가 완성됩니다.", solutionOutline: ["model→compose→validate→qualify→observe→migrate 순서입니다."] },
  ],
  nextSessions: ["spring-core-08-scope-lifecycle"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["JavaConfig.java에서 @Configuration1, @Bean5, inter-bean direct calls2와 source-embedded connection-shaped literals를 read-only로 확인했지만 실제 literals는 복사·출력하지 않았습니다.", "MainClass.java에서 AnnotationConfigApplicationContext bootstrap과 bean lookup/output progression을 확인했지만 설정값 출력은 학습자료에 사용하지 않았습니다.", "원본은 full/lite, module imports, typed config/secret hygiene, variants, lifecycle failure, AOT/native, differential migration과 operation evidence를 다루지 않아 현재 Spring/JDK 공식 문서와 synthetic examples로 보완했습니다.", "mini Java models는 실제 Spring enhancement, BeanDefinition, profiles, AOT와 lifecycle을 대체하지 않으므로 지원 버전 contexts에서 검증해야 합니다."] },
});

export default session;
