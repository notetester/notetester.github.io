import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "JDK 21 record·Map·List와 작은 renderer로 logical view, EL scope, output encoding 또는 tag lifecycle의 핵심 상태를 Spring/JSP container 없이 고립합니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "정상 값뿐 아니라 traversal, missing attribute, untrusted markup와 pooled-instance stale state를 실행해 view 경계의 실패 불변식을 확인합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "logical name·resolved path category·escaped output·scope·lifecycle count만 출력합니다. 실제 사용자 값, container 절대 경로와 object identity는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/JSP/JSTL jar·Servlet container·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "순수 Java 예제는 실제 ViewResolver chain, JSP translation/compilation, ELResolver와 tag container pooling을 대체하지 않으므로 지원 baseline의 MockMvc·embedded/real container test가 추가로 필요합니다."] },
    experiments: [
      { change: "logical view에 leading slash·dot segment를 넣거나 model attribute를 missing/null/mutable object로 바꿉니다.", prediction: "allowlist와 scope/null contract가 없으면 다른 resource forward, 빈 화면 또는 늦은 property 오류가 발생합니다.", result: "controller/model/view contract와 resolver allowlist를 명시하고 context test에서 final forward path를 readback합니다." },
      { change: "markup-shaped text를 raw EL로 출력하거나 pooled tag field를 release/reset하지 않고 두 번째 rendering을 실행합니다.", prediction: "HTML injection 또는 이전 요청 값 누출이 발생합니다.", result: "출력 context별 encoder와 stateless/reset lifecycle을 적용하고 adversarial·reuse test를 release gate에 둡니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "handler-to-logical-view",
    title: "Controller 반환 문자열을 body가 아니라 logical view name으로 해석하는 흐름부터 잡습니다",
    lead: "일반 `@Controller` method가 문자열을 반환하면 Spring MVC의 handler return-value 처리기가 그 값을 logical view name으로 해석할 수 있고, Model과 함께 ViewResolver→View→render 단계로 넘깁니다.",
    explanations: [
      "원본 ResponseController의 첫 화면 method는 `response/res_ex01` 형태의 logical name을 반환하고, servlet-context.xml의 InternalResourceViewResolver가 prefix와 suffix를 합성합니다. 실제 공개 URL과 JSP resource path는 서로 다른 namespace입니다.",
      "DispatcherServlet은 handler 실행 결과인 ModelAndView 또는 view name/model을 모은 뒤 resolver들을 순서대로 조회합니다. controller가 JSP file system path를 직접 열거나 response writer와 view rendering을 동시에 사용하지 않습니다.",
      "일반 `@Controller`의 String, `@ResponseBody`가 붙은 String, `@RestController`의 String은 같은 Java type이지만 처리 의미가 다릅니다. 이 차이는 MVC 08에서 message converter까지 이어지며 test는 body와 forwarded URL을 각각 assertion해야 합니다.",
      "logical name은 user input에서 그대로 만들지 않습니다. allowlisted constant/enum mapping을 사용하고 dot segment, scheme, leading slash와 control character를 거부해 unintended forward와 open redirect 후보를 막습니다.",
      "Model은 render input이지 controller/service가 공유하는 global storage가 아닙니다. view가 필요한 display DTO와 already-formatted public values만 넣고 entity, credential, lazy proxy와 internal exception을 전달하지 않습니다.",
    ],
    concepts: [
      c("logical view name", "controller가 구체 JSP 경로 대신 반환하는 resolver 입력 이름입니다.", ["prefix/suffix와 결합됩니다.", "HTTP public URL과 구분합니다."]),
      c("ViewResolver", "logical name과 locale을 실제 View object로 해소하는 Spring MVC 전략 interface입니다.", ["여러 resolver가 순서를 가질 수 있습니다.", "해소 실패를 처리합니다."]),
      c("render phase", "선택된 View가 Model을 request/response에 적용해 representation을 만드는 단계입니다.", ["handler 실행 뒤 일어납니다.", "response commit 경계를 가집니다."]),
    ],
    codeExamples: [java("mvc06-safe-logical-resolver", "allowlisted logical name과 WEB-INF JSP 합성", "Mvc06SafeResolver.java", "prefix/suffix 합성과 traversal 거부를 deterministic하게 실행해 public route와 internal resource를 구분합니다.", String.raw`public class Mvc06SafeResolver {
  record Resolver(String prefix, String suffix) {
    String resolve(String logical) {
      if (logical.startsWith("/") || logical.contains("..")
          || !logical.matches("[a-z0-9/_-]+")) {
        throw new IllegalArgumentException("invalid-view-name");
      }
      return prefix + logical + suffix;
    }
  }
  public static void main(String[] args) {
    Resolver resolver = new Resolver("/WEB-INF/views/", ".jsp");
    String logical = "response/res_ex01";
    String resolved = resolver.resolve(logical);
    boolean traversalRejected;
    try { resolver.resolve("../private"); traversalRejected = false; }
    catch (IllegalArgumentException expected) { traversalRejected = true; }
    System.out.println("logical=" + logical);
    System.out.println("resolved=" + resolved);
    System.out.println("direct-public=" + !resolved.startsWith("/WEB-INF/"));
    System.out.println("traversal-rejected=" + traversalRejected);
    System.out.println("render-phase=after-handler");
  }
}`, "logical=response/res_ex01\nresolved=/WEB-INF/views/response/res_ex01.jsp\ndirect-public=false\ntraversal-rejected=true\nrender-phase=after-handler", ["local-response-jsp", "local-servlet-context", "spring-view-resolution", "spring-view-resolver", "spring-internal-resource-resolver", "spring-dispatcher-servlet", "jakarta-request-dispatcher"])],
    diagnostics: [d("controller return 문자열이 화면이 아니라 그대로 body에 나오거나 반대로 body 문자열이 JSP 이름으로 해석됩니다.", "@Controller/@ResponseBody/@RestController return-value contract와 selected handler adapter/converter를 구분하지 않았습니다.", ["controller annotations", "method return type/annotations", "selected return-value handler", "forwarded URL vs response body"], "endpoint를 HTML view 또는 body contract로 명시하고 MockMvc에서 view name·forward path와 body를 상호 배타적으로 검사합니다.", "controller architecture test와 handler-result contract snapshot을 둡니다.")],
    expertNotes: ["logical view name을 client-facing API field로 노출하면 resolver refactor가 breaking change가 되므로 server 내부 계약으로 유지합니다.", "view rendering 뒤 response가 commit되면 다른 error representation으로 바꾸기 어려우므로 render failure strategy를 별도 설계합니다."],
  },
  {
    id: "resolver-chain-order-cache",
    title: "ViewResolver chain의 순서·null contract·cache를 운영 가능한 선택 규칙으로 만듭니다",
    lead: "여러 view technology를 함께 쓰면 resolver가 지원하지 않는 이름에서 다음 후보로 넘길지 모든 이름을 잡아버릴지에 따라 실제 View가 달라지므로 ordering과 namespace가 architecture contract가 됩니다.",
    explanations: [
      "ViewResolver는 view name과 Locale을 받아 View를 반환하거나 해소할 수 없음을 표현합니다. resolver별 cache key에 locale/theme/tenant가 필요한지 확인하고 unbounded user-controlled logical name으로 cache cardinality를 키우지 않습니다.",
      "InternalResourceViewResolver는 underlying resource 존재 여부와 무관하게 이름을 해소하려 할 수 있어 chain의 마지막에 두라는 공식 API 주의가 있습니다. 앞 resolver의 namespace와 order를 manifest에 기록합니다.",
      "resolver prefix로 `jsp/`, `report/`, `fragment/` 같은 명시 namespace를 사용하면 후보 ambiguity를 줄일 수 있습니다. 동일 name을 여러 technology가 우연히 처리하게 두지 않습니다.",
      "cache는 View object metadata를 재사용할 수 있지만 JSP output/body를 사용자 사이에 공유하는 application response cache와 다릅니다. locale/config 변경 시 cache invalidation과 deployment generation을 확인합니다.",
      "resolver miss, selected resolver logical id, resolved resource category와 render outcome을 bounded telemetry로 남깁니다. full path, user-controlled name과 Model values는 metric label로 기록하지 않습니다.",
    ],
    concepts: [
      c("resolver chain", "여러 ViewResolver를 priority 순서로 조회해 첫 지원 View를 선택하는 구성입니다.", ["last catch-all을 주의합니다.", "namespace로 ambiguity를 줄입니다."]),
      c("view cache", "동일 resolution key의 View metadata/object 생성 비용을 줄이는 resolver 내부 cache입니다.", ["rendered user body cache와 다릅니다.", "bounded key가 필요합니다."]),
      c("resolver miss", "resolver가 해당 logical name/locale을 지원하지 않아 다음 resolver로 넘기는 결과입니다.", ["404와 같지 않습니다.", "chain trace에 기록합니다."]),
    ],
    diagnostics: [d("새 template resolver를 앞에 추가했는데 기존 JSP가 다른 view로 선택되거나 항상 JSP resolver가 잡습니다.", "resolver namespace/order와 catch-all InternalResourceViewResolver의 위치를 검증하지 않았습니다.", ["Ordered values", "logical namespaces", "resolver null/match behavior", "selected View class"], "technology별 namespace와 explicit order를 정하고 InternalResourceViewResolver를 마지막에 두며 collision fixtures를 실행합니다.", "view-name×locale×resolver compatibility matrix와 graph diff를 CI에 둡니다.")],
    expertNotes: ["cache hit ratio보다 wrong-view zero, bounded entries와 deployment invalidation correctness를 우선합니다.", "resolver가 external template source를 읽는다면 template trust/supply-chain 경계가 application code와 동등하게 중요합니다."],
  },
  {
    id: "internal-resource-web-inf",
    title: "prefix·suffix와 WEB-INF forward의 실제 경계를 이해합니다",
    lead: "InternalResourceViewResolver는 보통 logical name에 prefix/suffix를 붙여 WEB-INF 아래 JSP로 server-side forward하며 browser 주소창과 request lifecycle은 redirect와 다릅니다.",
    explanations: [
      "원본 XML에는 InternalResourceViewResolver bean과 prefix/suffix property가 각각 하나 있으며 WEB-INF/views와 JSP suffix를 사용합니다. 이 구조 증거만 사용하고 machine의 deploy absolute path는 공개하지 않습니다.",
      "WEB-INF 아래 resource는 client가 직접 URL로 가져오지 못하게 두고 controller authorization·model preparation을 거쳐 forward합니다. 하지만 WEB-INF 배치 자체가 JSP 내부 XSS, authorization과 data leak를 해결하지 않습니다.",
      "forward는 같은 request/response 안에서 RequestDispatcher가 target resource를 실행하므로 request attributes가 보입니다. 이미 response body가 commit되었거나 conflicting include/forward가 있으면 lifecycle 오류가 날 수 있습니다.",
      "prefix/suffix 문자열 concatenation은 view name allowlist가 없으면 traversal/resource confusion 위험이 됩니다. resolver configuration뿐 아니라 controller가 생성 가능한 logical names를 정적 inventory합니다.",
      "WAR/external Servlet container의 JSP 지원과 executable JAR/native image 배포는 capability가 다를 수 있습니다. target runtime에서 JSP compiler, tag libraries와 resource packaging을 실제 startup/render test합니다.",
    ],
    concepts: [
      c("InternalResourceViewResolver", "Servlet/JSP 같은 internal resource로 logical view를 해소하는 Spring resolver입니다.", ["prefix/suffix를 설정합니다.", "chain 마지막 배치를 권장합니다."]),
      c("WEB-INF", "Servlet web application에서 client가 직접 resource request로 접근하지 못하는 영역입니다.", ["server forward는 가능합니다.", "authorization을 대체하지 않습니다."]),
      c("server-side forward", "같은 HTTP request/response를 container 내부 target resource로 전달하는 dispatch입니다.", ["주소창이 바뀌지 않습니다.", "request attributes를 공유합니다."]),
    ],
    diagnostics: [d("view name은 맞지만 JSP 404/blank 또는 circular dispatch가 납니다.", "packaged resource 위치, prefix/suffix, container JSP capability 또는 controller URL과 resource path를 혼동했습니다.", ["final resolved path", "artifact resource listing", "Servlet/JSP engine", "forward/include/error dispatch trace"], "supported deployment packaging에 JSP resource와 implementation을 포함하고 final forward path를 context test에서 확인합니다.", "artifact inspection과 real-container happy/missing/circular view smoke를 둡니다.")],
    expertNotes: ["WEB-INF 보호는 direct fetch만 막으므로 model authorization과 output encoding을 별도로 검증합니다.", "container별 JSP precompilation 옵션을 쓰면 build artifact와 runtime taglib baseline을 함께 version 고정합니다."],
  },
  {
    id: "model-request-attributes",
    title: "Model을 request attribute로 노출하는 시점과 display DTO 계약을 고정합니다",
    lead: "View가 render될 때 Model entries는 보통 request attributes로 노출되어 EL/JSTL에서 읽히므로 key 충돌, null, lazy loading, mutable object와 sensitive field가 곧 화면 계약이 됩니다.",
    explanations: [
      "Model key는 view template API입니다. controller와 JSP가 문자열 key를 따로 추측하지 않게 typed view-model builder, constants 또는 template contract test로 required/optional keys를 관리합니다.",
      "entity를 그대로 넣으면 getter를 통해 password digest, internal status와 lazy association이 노출되거나 rendering 중 DB query가 발생할 수 있습니다. 화면에 필요한 escaped 전 단계의 public DTO와 이미 authorization된 links만 전달합니다.",
      "request, session, application 같은 scoped attributes에 같은 이름이 있으면 EL implicit resolution order가 결과에 영향을 줍니다. 가능하면 명시 scope와 collision-free keys를 사용하고 test에서 실제 resolution을 확인합니다.",
      "null/missing은 EL에서 빈 문자열처럼 보이거나 coercion될 수 있어 configuration/error를 숨길 수 있습니다. 필수 model key는 controller/view adapter에서 fail-fast하고 optional은 empty-state UI를 명시합니다.",
      "Model attribute가 mutable collection이면 controller 반환 뒤 interceptor/view가 변경할 수 있습니다. immutable snapshot을 만들고 async rendering이 있다면 request lifecycle과 thread ownership을 검증합니다.",
    ],
    concepts: [
      c("display DTO", "특정 view가 표시할 public fields와 이미 계산된 state만 가진 rendering input입니다.", ["entity와 분리합니다.", "sensitive getter를 제외합니다."]),
      c("model key contract", "view가 기대하는 attribute 이름, type, nullability와 owner를 정의한 계약입니다.", ["controller/view 양쪽을 test합니다.", "충돌을 피합니다."]),
      c("scoped attribute", "page/request/session/application 같은 lifecycle 범위에 name→value로 저장된 JSP/Servlet 값입니다.", ["동일 name precedence가 있습니다.", "scope leakage를 주의합니다."]),
    ],
    codeExamples: [java("mvc06-scope-model-lookup", "명시 scope order와 missing contract", "Mvc06ScopeLookup.java", "네 scope Map을 순서대로 조회해 동일 key precedence, session fallback과 missing 결과를 결정적으로 확인합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc06ScopeLookup {
  record Found(String scope, Object value) {}
  static Found lookup(Map<String, Map<String, Object>> scopes, String key) {
    for (var entry : scopes.entrySet()) {
      if (entry.getValue().containsKey(key)) return new Found(entry.getKey(), entry.getValue().get(key));
    }
    return new Found("missing", "");
  }
  public static void main(String[] args) {
    Map<String, Map<String, Object>> scopes = new LinkedHashMap<>();
    scopes.put("page", Map.of());
    scopes.put("request", Map.of("name", "learner"));
    scopes.put("session", Map.of("name", "stale", "theme", "dark"));
    scopes.put("application", Map.of("product", "archive"));
    Found name = lookup(scopes, "name");
    Found theme = lookup(scopes, "theme");
    Found missing = lookup(scopes, "missing");
    System.out.println("name=" + name.value());
    System.out.println("name-scope=" + name.scope());
    System.out.println("theme=" + theme.value());
    System.out.println("theme-scope=" + theme.scope());
    System.out.println("missing-is-empty=" + missing.value().equals(""));
    System.out.println("method-invoked=false");
  }
}`, "name=learner\nname-scope=request\ntheme=dark\ntheme-scope=session\nmissing-is-empty=true\nmethod-invoked=false", ["local-response-jsp", "spring-model", "spring-view", "jakarta-pages", "jakarta-el", "java-map", "java-linked-hash-map"])],
    diagnostics: [d("JSP에 값이 비거나 오래된 session 값이 표시되고 rendering 중 lazy-load 오류가 납니다.", "required model key/type/scope를 선언하지 않고 entity와 colliding scoped names를 전달했습니다.", ["Model keys/types", "request/session collisions", "entity getters/lazy proxies", "render-time SQL"], "immutable display DTO와 collision-free request keys를 사용하고 required keys를 render 전 검증합니다.", "view contract test와 render query-count/PII getter scan을 둡니다.")],
    expertNotes: ["EL이 getter를 읽을 수 있다는 사실 때문에 public JavaBean surface가 사실상 template data API가 될 수 있습니다.", "session/application scope에 화면용 mutable DTO를 캐시하면 user/version/locale 누출이 생기므로 explicit cache key와 immutable value를 사용합니다."],
  },
  {
    id: "jsp-translation-lifecycle",
    title: "JSP를 매 요청 해석되는 HTML이 아니라 translation·compile·instance lifecycle로 이해합니다",
    lead: "JSP container는 page를 servlet source/class로 translation·compile하고 instance lifecycle을 관리하므로 syntax/taglib 오류, reload와 thread-safety 문제가 controller 성공 뒤 render 단계에서 나타날 수 있습니다.",
    explanations: [
      "최초 요청 또는 precompile 단계에서 JSP directives, taglibs와 template text가 servlet code로 변환됩니다. JSP line과 generated servlet stack frame를 source map/build artifact로 연결해야 장애 위치를 찾기 쉽습니다.",
      "page instance는 요청마다 새로 생성된다고 가정하지 않습니다. declaration field와 thread-unsafe formatter를 JSP에 두면 concurrent requests가 상태를 공유할 수 있으므로 scriptless view와 request-local tag/EL values를 사용합니다.",
      "원본 res_ex01.jsp는 page directive 하나, EL/JSTL/scriptlet 0의 static link/form 화면입니다. 이 세션의 EL/JSTL 예제는 원본에 있었다고 주장하지 않고 다음 단계의 공식-spec 보완으로 구분합니다.",
      "JSP compile failure는 status와 error page가 이미 일부 commit됐는지에 따라 다른 사용자 결과를 냅니다. production에서는 detailed generated source/class path를 공개하지 않고 request id와 safe view category만 보여 줍니다.",
      "precompilation은 first-hit latency와 syntax discovery를 앞당기지만 runtime container/library mismatch를 자동 해결하지 않습니다. build/runtime 동일 JSP/JSTL/EL baseline과 actual rendering smoke를 유지합니다.",
    ],
    concepts: [
      c("JSP translation", "JSP template를 Servlet source와 class로 변환·compile하는 container 단계입니다.", ["최초 요청 또는 build에 수행됩니다.", "line mapping이 필요합니다."]),
      c("scriptless JSP", "Java scriptlet/declaration 대신 EL과 tag libraries로 presentation logic을 표현하는 JSP입니다.", ["thread-shared fields를 피합니다.", "complex domain logic은 controller/service에 둡니다."]),
      c("render failure", "handler 성공 뒤 view resolution/translation/tag execution/output에서 발생하는 실패입니다.", ["response commit 상태를 확인합니다.", "internal path를 숨깁니다."]),
    ],
    diagnostics: [d("개발에서는 되지만 배포 첫 화면에서 JSP compile/taglib class 오류가 납니다.", "build/runtime JSP·EL·JSTL baseline과 resource packaging을 맞추지 않고 first-request compilation에 맡겼습니다.", ["container/Jakarta versions", "taglib API/implementation", "packaged JSP/TLD", "generated servlet root cause"], "지원 matrix로 dependencies/container를 정렬하고 clean artifact precompile 또는 real-container smoke를 실행합니다.", "production-like artifact의 모든 critical views compile/render test를 배포 gate에 둡니다.")],
    expertNotes: ["generated servlet source는 template 내부 표현과 path를 포함할 수 있어 diagnostic artifact 접근·보존을 제한합니다.", "JSP page field에 cache를 두지 말고 application service/cache가 lifecycle과 concurrency를 소유하게 합니다."],
  },
  {
    id: "el-resolution-coercion-security",
    title: "EL의 resolver chain·property access·coercion·null semantics를 안전한 조회 언어로 제한합니다",
    lead: "`${...}`는 단순 문자열 치환이 아니라 scoped variables와 property resolvers, operators, coercion을 실행하므로 missing/null, getter side effect와 untrusted expression source를 엄격히 구분해야 합니다.",
    explanations: [
      "EL은 base/property를 resolver chain에 전달해 Map, List/array, bean property와 implicit objects를 해소합니다. 같은 syntax라도 baseline에 따라 record/Optional 등 resolver 지원이 달라질 수 있습니다.",
      "missing property와 null이 empty string, false 또는 numeric zero로 coercion되는 context가 있어 configuration 오류가 조용히 UI decision을 바꿀 수 있습니다. security/authorization 조건을 view EL에 맡기지 않습니다.",
      "getter는 계산, lazy query 또는 exception을 일으킬 수 있습니다. view DTO getter는 side-effect-free, bounded cost여야 하고 method invocation/custom resolver를 허용할 때 accessible surface를 최소화합니다.",
      "template/EL source 자체를 외부 사용자가 편집하도록 허용하면 application context bean과 method surface에 접근하는 code/template injection 위험이 됩니다. untrusted text는 data로만 전달하고 trusted reviewed templates만 실행합니다.",
      "EL 결과를 HTML에 넣는다고 자동 encoding되지 않습니다. output context가 HTML text, attribute, URL, JavaScript, CSS인지 구분하고 JSP tag/encoder가 제공하는 보장을 확인합니다.",
    ],
    concepts: [
      c("ELResolver", "EL variable/property를 특정 object model에서 해소하고 type/value를 읽거나 쓰는 pluggable API입니다.", ["chain order가 있습니다.", "property surface를 결정합니다."]),
      c("coercion", "EL operation이나 target type 요구에 맞춰 null/string/number/boolean 등을 변환하는 규칙입니다.", ["빈 값 오류를 숨길 수 있습니다.", "spec baseline을 확인합니다."]),
      c("template injection", "외부 입력이 template/EL code로 해석되어 application data나 method에 접근하는 취약 경계입니다.", ["template source를 신뢰 경계로 둡니다.", "data와 code를 분리합니다."]),
    ],
    diagnostics: [d("존재하지 않는 값이 빈 문자열/false로 보여 authorization UI나 계산이 조용히 바뀝니다.", "EL missing/null/coercion을 required model validation 대신 사용했습니다.", ["resolved scope/property", "null/missing distinction", "target coercion", "controller authorization decision"], "security/domain decision은 controller/service에서 수행하고 view에는 explicit public boolean/state를 전달하며 required key를 fail-fast합니다.", "missing/null/blank/zero truth table과 authorization-bypass view test를 둡니다.")],
    expertNotes: ["화면에서 버튼을 숨기는 것은 authorization이 아니므로 server endpoint가 동일 권한을 다시 enforce합니다.", "custom ELResolver는 전체 application property graph를 넓힐 수 있어 allowlist·read-only·cost budget과 fuzz test가 필요합니다."],
  },
  {
    id: "jstl-control-iteration-format",
    title: "JSTL core 반복·조건·URL·formatting을 presentation-only control flow로 사용합니다",
    lead: "JSTL은 scriptlet 없이 조건·반복·출력·URL·국제화를 표현하지만 business query, mutation, SQL tag와 broad catch를 view에 넣지 않고 prepared Model을 렌더링하는 데 제한합니다.",
    explanations: [
      "Jakarta Tags 3.0은 core, formatting, functions 등 library를 제공하며 modern URI와 legacy URI compatibility가 존재합니다. dependency namespace와 container baseline에 맞는 taglib directive를 사용합니다.",
      "`c:forEach`는 Model collection의 encounter order를 따릅니다. UI order가 business 의미라면 service/view-model builder에서 complete order와 empty state를 만들고 JSP가 임의 sort/query하지 않게 합니다.",
      "`c:if/choose`는 display variant를 선택할 수 있지만 authorization과 domain transition을 수행하지 않습니다. 이미 계산된 enum/boolean을 읽고 unknown state를 명시 fallback으로 표시합니다.",
      "`c:url`과 parameter encoding은 context path와 URL component escaping을 돕지만 arbitrary external redirect allowlist를 대신하지 않습니다. link target은 server-controlled route name과 validated identifier로 구성합니다.",
      "formatting tag는 request Locale/timezone을 반영할 수 있어 테스트/캐시 key에 locale·zone을 포함해야 합니다. 저장/도메인 값은 Instant/typed number로 유지하고 presentation에서만 format합니다.",
    ],
    concepts: [
      c("JSTL", "JSP에서 공통 반복·조건·출력·국제화 기능을 tag로 제공하는 Jakarta Standard Tag Library입니다.", ["scriptless view를 돕습니다.", "domain/service를 대체하지 않습니다."]),
      c("c:forEach", "collection/범위를 encounter order로 반복하고 loop status를 제공하는 core tag입니다.", ["빈 collection을 처리합니다.", "order contract가 필요합니다."]),
      c("c:choose", "여러 display condition에서 한 branch를 선택하는 core conditional tags 조합입니다.", ["authorization을 대체하지 않습니다.", "unknown fallback을 둡니다."]),
    ],
    codeExamples: [java("mvc06-jstl-render-model", "forEach·if·out에 대응하는 안전한 model rendering", "Mvc06JstlRender.java", "prepared item list에서 visible 항목만 순서대로 HTML text escape해 JSTL 사용 시 유지할 계약을 실행합니다.", String.raw`import java.util.List;

public class Mvc06JstlRender {
  record Item(String label, boolean visible) {}
  static String escape(String input) {
    return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
  public static void main(String[] args) {
    List<Item> items = List.of(
        new Item("<Admin>", true),
        new Item("Hidden", false),
        new Item("Guide", true));
    StringBuilder html = new StringBuilder();
    int visible = 0;
    for (Item item : items) {
      if (!item.visible()) continue;
      html.append("<li>").append(escape(item.label())).append("</li>");
      visible++;
    }
    System.out.println("html=" + html);
    System.out.println("visible=" + visible);
    System.out.println("hidden=" + (items.size() - visible));
    System.out.println("escaped=" + !html.toString().contains("<Admin>"));
    System.out.println("order-preserved=" + html.toString().endsWith("<li>Guide</li>"));
  }
}`, "html=<li>&lt;Admin&gt;</li><li>Guide</li>\nvisible=2\nhidden=1\nescaped=true\norder-preserved=true", ["spring-jsp-jstl", "spring-jstl-view", "jakarta-tags", "jakarta-tags-core", "java-list", "java-string-builder", "spring-mockmvc"])],
    diagnostics: [d("JSTL tag가 인식되지 않거나 반복 순서/locale 결과가 배포 환경에서 다릅니다.", "tag URI·API/implementation/container baseline 또는 model order/locale contract를 고정하지 않았습니다.", ["taglib URI", "Jakarta Tags API/implementation", "container JSP level", "model encounter order/Locale/timezone"], "지원 matrix의 tag URI/dependencies를 사용하고 prepared ordered DTO와 explicit Locale/Zone으로 render합니다.", "critical JSP tag compile와 locale/order snapshot을 real container에서 실행합니다.")],
    expertNotes: ["SQL/XML import tags를 presentation layer의 repository/client로 사용하지 않고 service가 timeout·transaction·security를 소유합니다.", "formatted string을 다시 parsing하는 round-trip을 피하고 raw typed value와 display text를 명시 분리합니다."],
  },
  {
    id: "contextual-output-encoding",
    title: "EL 출력과 HTML context별 encoding을 분리해 XSS를 차단합니다",
    lead: "untrusted 문자열을 `${value}`로 출력하는 것과 `c:out` 또는 encoder를 쓰는 것은 다르며 HTML text encoding을 URL·attribute·JavaScript·CSS context에 재사용해서도 안 됩니다.",
    explanations: [
      "JSTL `c:out`은 기본 escapeXml behavior로 markup-sensitive characters를 바꾸는 기능을 제공합니다. raw EL output의 exact container behavior를 보안 경계로 추측하지 않고 명시 encoder/tag를 사용합니다.",
      "HTML text context에서는 ampersand, less-than 등 markup characters를 encode합니다. quoted attribute에는 attribute encoding과 safe attribute allowlist, URL에는 URL construction/validation, JavaScript에는 JSON/JS-safe serialization이 각각 필요합니다.",
      "`escapeXml=false`, raw output tag 또는 sanitizer bypass는 trusted pre-sanitized HTML type에만 제한하고 creation policy, sanitizer version와 CSP를 관리합니다. 단순 문자열 flag로 trusted를 표시하지 않습니다.",
      "입력 validation은 XSS output encoding을 대체하지 않습니다. 정상 이름에도 ampersand/quotes가 있을 수 있고 stored data가 다른 context에 재사용되므로 sink context에서 encode합니다.",
      "error message와 flash/session attributes도 untrusted input을 포함할 수 있습니다. validation rejected value, exception message와 query parameter를 JSP에 그대로 출력하지 않고 stable public message와 escaped display data만 사용합니다.",
    ],
    concepts: [
      c("contextual encoding", "값이 삽입되는 HTML text·attribute·URL·JS·CSS grammar에 맞는 escaping/serialization입니다.", ["sink에서 적용합니다.", "context 사이에 재사용하지 않습니다."]),
      c("c:out", "EL 결과를 출력하며 기본적으로 XML/markup-sensitive characters를 escape하는 JSTL core action입니다.", ["escapeXml 설정을 주의합니다.", "모든 context의 만능 encoder는 아닙니다."]),
      c("trusted HTML type", "검토된 sanitizer/policy를 통과한 markup만 일반 문자열과 구분해 운반하는 타입/경계입니다.", ["생성 경로를 제한합니다.", "정책 version을 기록합니다."]),
    ],
    codeExamples: [java("mvc06-html-text-escaping", "HTML text context의 deterministic encoding", "Mvc06HtmlEscaping.java", "markup-shaped synthetic text를 HTML text entity로 바꾸고 raw tags가 남지 않음을 확인합니다.", String.raw`public class Mvc06HtmlEscaping {
  static String escapeHtmlText(String input) {
    StringBuilder output = new StringBuilder();
    for (char character : input.toCharArray()) {
      switch (character) {
        case '&' -> output.append("&amp;");
        case '<' -> output.append("&lt;");
        case '>' -> output.append("&gt;");
        case '"' -> output.append("&#34;");
        case '\'' -> output.append("&#39;");
        default -> output.append(character);
      }
    }
    return output.toString();
  }
  public static void main(String[] args) {
    String raw = "<b data-x=\"1\">A&B</b>";
    String safe = escapeHtmlText(raw);
    System.out.println("safe=" + safe);
    System.out.println("raw-tags-present=" + safe.contains("<b"));
    System.out.println("ampersand-encoded=" + safe.contains("&amp;"));
    System.out.println("attribute-context-reused=false");
    System.out.println("raw-output-used=false");
  }
}`, "safe=&lt;b data-x=&#34;1&#34;&gt;A&amp;B&lt;/b&gt;\nraw-tags-present=false\nampersand-encoded=true\nattribute-context-reused=false\nraw-output-used=false", ["jakarta-tags", "jakarta-tags-core", "owasp-xss", "html-standard", "java-string-builder"])],
    diagnostics: [d("JSP에서 사용자 문자열이 tag/attribute/script로 실행됩니다.", "raw EL/escapeXml=false 또는 HTML text encoder를 다른 grammar context에 사용했습니다.", ["actual sink context", "JSP tag/EL expression", "raw/sanitized type provenance", "CSP/browser console"], "각 sink를 text/attribute/URL/JS/CSS로 분류해 framework-approved contextual encoder/serializer를 적용하고 raw HTML path를 제거합니다.", "OWASP payload corpus와 real-browser DOM/no-execution test를 CI에 둡니다.")],
    expertNotes: ["CSP는 defense in depth이며 unsafe inline/raw DOM sink의 encoding 결함을 대신하지 않습니다.", "double encoding도 display/round-trip 오류를 만들므로 encode-on-output 원칙과 trusted type boundary를 적용합니다."],
  },
  {
    id: "tag-handler-lifecycle-thread-safety",
    title: "custom tag handler의 setter→execute→reset/release와 pooling 안전성을 검증합니다",
    lead: "JSP container가 tag handler instance를 재사용할 수 있으므로 request-specific field를 남기거나 static mutable state를 쓰면 다음 rendering과 다른 thread에 값이 누출될 수 있습니다.",
    explanations: [
      "tag attribute setter는 current use의 입력을 받으며 lifecycle callback에서 body/output을 처리합니다. instance creation per tag use를 가정하지 않고 모든 request state를 명시 초기화/clear합니다.",
      "SimpleTag와 classic Tag lifecycle은 callback contract가 다릅니다. 선택한 API의 공식 specification/Javadoc을 따르고 두 model의 release/reset behavior를 섞지 않습니다.",
      "JspWriter와 PageContext를 field/static에 보존하지 않고 callback scope 안에서만 사용합니다. tag가 service를 호출하면 timeout, failure와 side effect가 partial response commit 전에 어떻게 처리될지 정합니다.",
      "tag body를 여러 번 evaluate하거나 skip할 수 있는 API는 body size와 execution cost가 증폭될 수 있습니다. bounded collection, nesting depth와 render deadline을 검토합니다.",
      "reuse test는 같은 handler instance에 first sensitive-shaped value를 넣고 reset 뒤 second render에서 절대 나타나지 않는지 확인합니다. 병렬 stress는 shared static/cache와 mutable formatter까지 검사합니다.",
    ],
    concepts: [
      c("tag handler", "JSP custom action의 attributes, body와 output을 Java lifecycle callback으로 구현하는 component입니다.", ["container가 lifecycle을 호출합니다.", "pooling 가능성을 고려합니다."]),
      c("instance pooling", "생성 비용을 줄이기 위해 container가 handler instance를 여러 tag use에 재사용할 수 있는 관리입니다.", ["request state를 reset합니다.", "instance identity를 사용자와 묶지 않습니다."]),
      c("lifecycle reset", "한 tag use가 끝난 뒤 request/model/output references와 mutable fields를 제거하는 단계입니다.", ["누출을 막습니다.", "negative reuse test가 필요합니다."]),
    ],
    codeExamples: [java("mvc06-pooled-tag-reset", "재사용 handler의 stale state 제거", "Mvc06PooledTag.java", "한 tag object를 두 번 사용하면서 매번 release로 field를 비우고 이전 값이 다음 output에 섞이지 않음을 검증합니다.", String.raw`import java.util.Objects;

public class Mvc06PooledTag {
  static final class TagHandler {
    private String value;
    private int renders;
    private int releases;
    void setValue(String value) { this.value = Objects.requireNonNull(value); }
    String render() {
      if (value == null) throw new IllegalStateException("missing-value");
      renders++;
      return "[" + value + "]";
    }
    void release() { value = null; releases++; }
  }
  public static void main(String[] args) {
    TagHandler pooled = new TagHandler();
    pooled.setValue("first");
    String first = pooled.render();
    pooled.release();
    pooled.setValue("second");
    String second = pooled.render();
    pooled.release();
    System.out.println("first=" + first);
    System.out.println("second=" + second);
    System.out.println("renders=" + pooled.renders);
    System.out.println("releases=" + pooled.releases);
    System.out.println("stale=" + second.contains("first"));
    System.out.println("value-cleared=" + (pooled.value == null));
  }
}`, "first=[first]\nsecond=[second]\nrenders=2\nreleases=2\nstale=false\nvalue-cleared=true", ["jakarta-pages", "jakarta-tag-api", "spring-jstl-view", "java-objects"])],
    diagnostics: [d("간헐적으로 다른 요청의 tag attribute가 화면에 나타납니다.", "pooled handler field/static cache를 lifecycle 끝에 reset하지 않았거나 thread-unsafe state를 공유했습니다.", ["handler instance/static fields", "setter/callback/release sequence", "container pooling config", "parallel request evidence"], "handler를 stateless하게 만들고 every-use fields를 callback 전 초기화·끝에 clear하며 shared service는 thread-safe contract를 둡니다.", "same-instance reuse와 barrier-based parallel rendering canary를 둡니다.")],
    expertNotes: ["release callback에만 cleanup을 의존하기 전에 chosen tag API/container가 어떤 lifecycle을 보장하는지 확인합니다.", "tag handler에서 remote call을 수행하면 view latency와 partial response failure가 커지므로 controller/service에서 data를 준비하는 편이 기본입니다."],
  },
  {
    id: "links-forms-context-url",
    title: "JSP link·form action을 context path·method·CSRF·URL encoding 계약으로 만듭니다",
    lead: "원본 JSP처럼 relative anchors와 GET form은 작은 예제에서 동작하지만 nested route, context deployment, unsafe operation과 user-controlled parameters가 생기면 URL construction과 HTTP method를 명시해야 합니다.",
    explanations: [
      "relative URL은 현재 request path와 base URL에 따라 해소됩니다. application context path를 포함한 server route는 `c:url` 또는 framework URL builder로 만들고 문자열 slash concatenation을 줄입니다.",
      "검색처럼 safe/idempotent operation은 GET query가 적절하지만 로그인·생성·변경은 POST 등 unsafe method와 CSRF protection이 필요합니다. 원본 GET form을 production authentication pattern으로 복사하지 않습니다.",
      "query parameter는 URL component encoding을 적용하고 HTML attribute context encoding도 별도로 수행합니다. 이미 encoded string을 다시 concatenation하면 double encoding 또는 parameter injection이 생깁니다.",
      "redirect target/return URL을 hidden field나 query에서 받으면 same-origin/path allowlist와 canonicalization을 적용합니다. 화면 link 생성과 server redirect 검증을 한쪽만 구현하지 않습니다.",
      "form 재표시는 non-sensitive values만 Model에 넣고 password, token과 file content를 repopulate하지 않습니다. error summary와 field association은 accessible label/id/aria-describedby로 연결합니다.",
    ],
    concepts: [
      c("context path", "한 host에서 web application이 배치된 URL prefix입니다.", ["resource path와 다릅니다.", "link builder가 반영합니다."]),
      c("URL encoding", "path segment 또는 query component의 reserved characters를 해당 component grammar에 맞게 변환하는 과정입니다.", ["HTML encoding과 다릅니다.", "component별 builder를 사용합니다."]),
      c("safe method", "HTTP semantics상 requested state change를 의도하지 않는 GET/HEAD 등의 method 성질입니다.", ["side effect를 피합니다.", "CSRF/PRG 설계와 연결됩니다."]),
    ],
    diagnostics: [d("context path 배포에서 link/form이 404가 나거나 query 값이 다른 parameter로 분리됩니다.", "relative URL·문자열 concatenation에 의존하고 URL component와 HTML attribute encoding을 구분하지 않았습니다.", ["browser resolved URL", "context path", "path/query builder", "HTML attribute source"], "framework URL builder/c:url로 context-aware path와 encoded parameters를 만들고 quoted attribute context에 안전하게 출력합니다.", "root/non-root context와 reserved-character browser/MockMvc test를 둡니다.")],
    expertNotes: ["GET link가 analytics/cache/prefetch에 의해 실행될 수 있으므로 state-changing operation을 절대 배치하지 않습니다.", "외부 URL이 필요하면 allowed scheme/host/path를 parsed URI component로 검증하고 display text와 destination을 분리합니다."],
  },
  {
    id: "view-testing-observability-performance",
    title: "view name만 확인하지 말고 final forward·DOM·escaping·render cost를 계층별 검증합니다",
    lead: "controller unit test의 반환 문자열 성공만으로 JSP가 compile되고 Model이 올바르게 resolve·escape·render되는지 알 수 없으므로 resolver, real container와 browser evidence를 분리합니다.",
    explanations: [
      "MockMvc는 selected view name, Model keys/types, status/header와 forwarded URL을 빠르게 확인할 수 있습니다. 하지만 container-specific JSP compilation과 final DOM behavior를 모두 대체하지 않습니다.",
      "real container test는 packaged artifact로 JSP/taglib compile, EL resolver, locale, missing view와 render exception을 실행합니다. browser test는 DOM text/attributes, form links, focus/accessibility와 script non-execution을 확인합니다.",
      "snapshot은 whole HTML whitespace보다 semantic DOM, escaped text와 stable components에 집중합니다. generated csrf/id/timestamp처럼 volatile fields는 contract-based assertion을 사용합니다.",
      "render metric은 view logical id, outcome, duration/size bucket, resolver/cache status와 model key count를 bounded하게 기록합니다. Model values, session id, JSP full path와 exception object를 label/log에 넣지 않습니다.",
      "N+1 query, huge collection, recursive tag와 unbounded EL getter가 latency/memory를 키울 수 있습니다. query count, model size, output bytes, tag depth와 render deadline budget을 둡니다.",
    ],
    concepts: [
      c("view contract test", "controller result부터 resolver path, required model과 render output의 public invariant를 검증하는 test입니다.", ["unit/MockMvc/container/browser로 나눕니다.", "failure도 포함합니다."]),
      c("semantic DOM assertion", "HTML serialization whitespace보다 element, accessible name, text와 attribute 의미를 검사하는 browser assertion입니다.", ["escaping 실행 여부를 확인합니다.", "volatile 값에 강합니다."]),
      c("render budget", "view rendering이 허용할 query count, model cardinality, output bytes, depth와 duration 한계입니다.", ["early reject/pagination을 둡니다.", "metric과 연결합니다."]),
    ],
    diagnostics: [d("MockMvc viewName test는 통과하지만 production JSP가 compile 실패하거나 XSS DOM이 생깁니다.", "resolver/controller test만 있고 real container compilation과 browser sink verification이 없습니다.", ["artifact/container smoke", "JSP/taglib errors", "forwarded URL", "browser DOM/script events"], "계층별 test matrix에 packaged real-container render와 adversarial browser DOM/no-execution test를 추가합니다.", "critical views의 compile/render/security/accessibility smoke를 배포 전후 자동화합니다.")],
    expertNotes: ["full HTML snapshot만으로는 script 실행과 browser parser repair를 알기 어려우므로 DOM/event evidence를 함께 봅니다.", "observability를 위해 Model을 serialize하지 말고 logical schema/version과 count만 기록합니다."],
  },
  {
    id: "legacy-modern-view-migration",
    title: "javax/Jakarta JSP baseline과 modern template/API 경계를 단계적으로 migration합니다",
    lead: "legacy Spring XML·javax tag URI/JSP와 modern Jakarta namespace, Spring Boot executable packaging 또는 SPA/REST는 runtime·deployment model이 달라 import만 바꾸는 일괄 치환으로 옮길 수 없습니다.",
    explanations: [
      "원본은 XML MVC namespace, InternalResourceViewResolver와 classic JSP page directive를 사용하는 학습 progression입니다. source evidence를 보존하되 current application은 Spring/JDK/Servlet/Pages/EL/Tags compatibility matrix를 먼저 선택합니다.",
      "Jakarta 전환은 Java package, Servlet container, JSP/EL/Tags API와 implementation, tag URIs 및 deployment descriptor schema를 함께 정렬합니다. javax와 jakarta artifact가 classpath에 섞이면 compile/runtime type mismatch가 생깁니다.",
      "Thymeleaf 등 server template로 옮기면 EL/JSTL expression·escaping·fragment·form binding 의미를 target engine contract로 재작성합니다. file extension 치환보다 model and output behavior corpus를 비교합니다.",
      "SPA/REST로 옮기면 server JSP의 request/session model, CSRF form, locale, authorization display와 flash error를 API schema와 client state로 분해합니다. MVC 08의 response contract와 이어서 migration합니다.",
      "old/new renderer를 같은 synthetic model corpus로 shadow-render해 visible text, link/form targets, escaping, locale, status/header와 accessibility DOM을 비교합니다. canary 후 old view usage와 resource/thread/cache가 0인지 확인합니다.",
    ],
    concepts: [
      c("namespace baseline", "Spring·Servlet·Pages·EL·Tags가 javax 또는 jakarta type family와 지원 version으로 정렬된 조합입니다.", ["dependency/container를 함께 맞춥니다.", "혼합을 금지합니다."]),
      c("view migration corpus", "old/new renderer에 같은 safe model을 넣어 DOM·escaping·link·locale behavior를 비교하는 fixtures입니다.", ["실제 개인정보를 제외합니다.", "semantic diff를 분류합니다."]),
      c("renderer canary", "일부 traffic 또는 offline capture에서 새 view behavior와 성능을 비교하고 rollback 가능한 rollout입니다.", ["logical generation을 기록합니다.", "old resources를 폐기합니다."]),
    ],
    diagnostics: [d("Jakarta 전환 후 taglib를 못 찾거나 일부 JSP만 ClassNotFound/EL behavior 차이가 납니다.", "Spring/container/JSP/EL/JSTL namespace와 versions를 부분적으로만 변경했습니다.", ["dependency tree/imports", "container support matrix", "tag URIs/TLD", "old/new render corpus"], "지원 BOM/runtime matrix로 전체 stack을 정렬하고 clean artifact에서 모든 critical views compile/render한 뒤 canary합니다.", "forbidden mixed namespace scan과 renderer semantic diff를 CI gate에 둡니다.")],
    expertNotes: ["legacy example을 삭제하지 않고 logical view→resolver→JSP render 흐름의 역사적 의미와 modern 대안을 상호 link합니다.", "migration 완료는 page count가 아니라 behavior parity, zero sensitive leak, client compatibility와 old runtime retirement 증거입니다."],
  },
  {
    id: "view-operations-governance",
    title: "view graph·template trust·배포 generation을 운영 규칙으로 관리합니다",
    lead: "view는 presentation file이지만 application beans와 model data에 접근하고 사용자에게 최종 HTML을 보내므로 code와 같은 review, artifact integrity, telemetry와 incident response가 필요합니다.",
    explanations: [
      "view manifest에는 controller/route logical id, logical view, resolver, internal resource category, required model schema, JSP/EL/JSTL baseline와 template hash를 둡니다. absolute deploy path와 Model values는 제외합니다.",
      "template 변경은 output encoding, link/form method, CSRF, accessibility, locale, cache와 CSP 영향을 review합니다. 외부 CMS/user-editable template를 application-context-capable renderer에 직접 넣지 않습니다.",
      "deployment gate는 clean JSP compile, critical view render, adversarial escaping, tag reuse, locale/accessibility, model size/query budget와 mixed namespace scan을 실행합니다.",
      "incident runbook은 wrong resolver, missing resource, compile/taglib, EL/property, encoding/XSS, partial commit, slow render와 stale cache를 분리합니다. 먼저 deployed manifest와 safe request correlation을 보존합니다.",
      "view retirement은 route/controller references, redirects, bookmarks, email links, JSP includes/tag files, error pages와 rollback artifact를 조사합니다. usage zero와 resolver/cache/resource zero 뒤 제거합니다.",
    ],
    concepts: [
      c("view manifest", "route→logical name→resolver→resource와 model schema/baseline/hash를 값 없이 기록한 artifact입니다.", ["drift를 비교합니다.", "internal absolute path를 제외합니다."]),
      c("template trust boundary", "실행 가능한 EL/tag/template source를 누가 작성·검토·배포할 수 있는지 정한 경계입니다.", ["application code와 동급으로 봅니다.", "untrusted data와 분리합니다."]),
      c("view generation", "함께 배포되어 서로 호환되는 controller model, resolver config, template와 tag library version입니다.", ["canary/rollback 단위입니다.", "mixed generation을 감시합니다."]),
    ],
    diagnostics: [d("장애 HTML이 어느 template/resolver generation인지 모르고 rollback 뒤 stale compiled JSP가 남습니다.", "view manifest, artifact hash와 container cache cleanup evidence가 없습니다.", ["deployed view manifest", "logical/resolver generation", "compiled JSP/cache", "rollback render smoke"], "controller-model/template/resolver baseline을 한 generation artifact로 기록하고 deploy/rollback 뒤 cache invalidation과 critical render를 확인합니다.", "manifest diff 승인과 post-rollback old compiled/cache/resource audit를 자동화합니다.")],
    expertNotes: ["template source도 supply-chain artifact이므로 dependency/TLD/container image와 함께 provenance와 hash를 관리합니다.", "view 성공률만 아니라 wrong/missing/unsafe/slow render와 first-hit compilation을 분리해 측정합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-response-jsp", repository: "SPRING/SpringBasic", path: "src/main/webapp/WEB-INF/views/response/res_ex01.jsp", usedFor: ["single page directive, static links and GET form progression"], evidence: "read-only scan으로 20 lines, page directive 1과 EL/JSTL/scriptlet 0을 확인했습니다. form sample values와 개인값은 없었습니다." },
  { id: "local-servlet-context", repository: "SPRING/SpringBasic", path: "src/main/webapp/WEB-INF/config/servlet-context.xml", usedFor: ["InternalResourceViewResolver prefix/suffix and component scan progression"], evidence: "read-only scan으로 resolver bean, prefix/suffix property 각 1과 component-scan 3을 확인했으며 machine absolute path는 사용하지 않았습니다." },
  { id: "spring-view-resolution", repository: "Spring Framework Reference", path: "View Resolution", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/viewresolver.html", usedFor: ["DispatcherServlet view resolution and resolver chaining"], evidence: "Spring 공식 MVC view resolution reference입니다." },
  { id: "spring-jsp-jstl", repository: "Spring Framework Reference", path: "JSP and JSTL", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc-view/mvc-jsp.html", usedFor: ["InternalResourceViewResolver, JstlView and WEB-INF guidance"], evidence: "Spring 공식 JSP/JSTL integration reference입니다." },
  { id: "spring-view-resolver", repository: "Spring Framework Javadoc", path: "ViewResolver", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/ViewResolver.html", usedFor: ["logical name and Locale resolution contract"], evidence: "Spring 공식 ViewResolver API입니다." },
  { id: "spring-internal-resource-resolver", repository: "Spring Framework Javadoc", path: "InternalResourceViewResolver", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/view/InternalResourceViewResolver.html", usedFor: ["prefix/suffix, JSP view and chain-last behavior"], evidence: "Spring 공식 InternalResourceViewResolver API입니다." },
  { id: "spring-jstl-view", repository: "Spring Framework Javadoc", path: "JstlView", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/view/JstlView.html", usedFor: ["JSTL-aware internal resource rendering"], evidence: "Spring 공식 JstlView API입니다." },
  { id: "spring-view", repository: "Spring Framework Javadoc", path: "View", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/View.html", usedFor: ["model rendering contract"], evidence: "Spring 공식 View API입니다." },
  { id: "spring-model", repository: "Spring Framework Javadoc", path: "Model", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/ui/Model.html", usedFor: ["controller model attribute contract"], evidence: "Spring 공식 Model API입니다." },
  { id: "spring-dispatcher-servlet", repository: "Spring Framework Javadoc", path: "DispatcherServlet", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html", usedFor: ["handler-to-view dispatch lifecycle"], evidence: "Spring 공식 DispatcherServlet API입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework Reference", path: "MockMvc", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc.html", usedFor: ["view name, model and forwarded URL tests"], evidence: "Spring 공식 MockMvc reference입니다." },
  { id: "jakarta-pages", repository: "Jakarta EE Specification", path: "Jakarta Server Pages 4.0", publicUrl: "https://jakarta.ee/specifications/pages/4.0/", usedFor: ["JSP translation, lifecycle, EL integration and scriptless pages"], evidence: "Jakarta EE 공식 Server Pages specification release입니다." },
  { id: "jakarta-el", repository: "Jakarta EE Specification", path: "Jakarta Expression Language 6.0", publicUrl: "https://jakarta.ee/specifications/expression-language/6.0/jakarta-expression-language-spec-6.0", usedFor: ["EL syntax, resolver and coercion semantics"], evidence: "Jakarta EE 공식 Expression Language specification입니다." },
  { id: "jakarta-tags", repository: "Jakarta EE Specification", path: "Jakarta Standard Tag Library 3.0", publicUrl: "https://jakarta.ee/specifications/tags/3.0/jakarta-tags-spec-3.0", usedFor: ["JSTL core actions, URIs, escaping and migration"], evidence: "Jakarta EE 공식 Standard Tag Library specification입니다." },
  { id: "jakarta-tags-core", repository: "Jakarta EE Tag Documentation", path: "Tags 3.0 core library", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/c/tld-summary", usedFor: ["c:out, c:forEach and conditional tag catalog"], evidence: "Jakarta EE 공식 Tags core tag documentation입니다." },
  { id: "jakarta-tag-api", repository: "Jakarta EE API", path: "Tag", publicUrl: "https://jakarta.ee/specifications/pages/4.0/apidocs/jakarta.servlet.jsp/jakarta/servlet/jsp/tagext/tag", usedFor: ["classic tag lifecycle and release contract"], evidence: "Jakarta EE 공식 Server Pages Tag API입니다." },
  { id: "jakarta-request-dispatcher", repository: "Jakarta Servlet API", path: "RequestDispatcher", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/requestdispatcher", usedFor: ["forward/include request-response lifecycle"], evidence: "Jakarta EE 공식 RequestDispatcher API입니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["contextual output encoding and dangerous contexts"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
  { id: "html-standard", repository: "WHATWG HTML Standard", path: "Forms and form controls", publicUrl: "https://html.spec.whatwg.org/multipage/forms.html", usedFor: ["HTML form and attribute semantics"], evidence: "WHATWG 공식 HTML living standard입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["scope/model example"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-linked-hash-map", repository: "Java SE 21 API", path: "LinkedHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html", usedFor: ["deterministic scope precedence example"], evidence: "Oracle JDK 공식 LinkedHashMap API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered display model example"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-string-builder", repository: "Java SE 21 API", path: "StringBuilder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html", usedFor: ["bounded deterministic rendering examples"], evidence: "Oracle JDK 공식 StringBuilder API입니다." },
  { id: "java-objects", repository: "Java SE 21 API", path: "Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["tag attribute null guard"], evidence: "Oracle JDK 공식 Objects API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-06-view-resolver-jsp-el-jstl", slug: "mvc-06-view-resolver-jsp-el-jstl", courseId: "spring", moduleId: "spring-mvc-request-response", order: 6,
  title: "ViewResolver, JSP·EL·JSTL 렌더링", subtitle: "logical view에서 WEB-INF forward, Model·EL scope, JSTL control flow, contextual encoding, tag pooling, container baseline과 migration까지 render 경계를 검증합니다.", level: "전문가", estimatedMinutes: 1080,
  coreQuestion: "Controller의 logical view와 Model이 어떤 resolver·JSP·EL·JSTL lifecycle을 거쳐 HTML이 되며, missing data·wrong resolver·XSS·tag state leak·namespace drift를 어떻게 traffic 전에 찾을까요?",
  summary: "SpringBasic의 res_ex01.jsp와 servlet-context.xml을 read-only로 확인해 page directive 1, static links/GET form, EL·JSTL·scriptlet 0, InternalResourceViewResolver prefix/suffix 각 1과 component scans를 progression evidence로 사용했습니다. 따라서 EL/JSTL은 원본에 있었다고 과장하지 않고 current Spring/Jakarta 공식 계약과 synthetic examples로 보완합니다. handler→logical view, resolver chain/cache, WEB-INF forward, immutable display Model, JSP translation/compile/thread lifecycle, EL resolution/coercion/template trust, JSTL iteration/condition/URL/locale, context-aware escaping, pooled tag reset, context-aware forms, layered testing/render budgets, javax→Jakarta/modern migration과 view operations를 초보부터 전문가 수준으로 연결합니다. 다섯 JDK 21 examples는 safe resolver, scope lookup, JSTL-like prepared rendering, HTML text escaping과 pooled tag reset을 exact stdout으로 실행합니다.",
  objectives: ["String body와 logical view return contract를 구분한다.", "ViewResolver chain의 namespace/order/cache를 검증한다.", "InternalResourceViewResolver prefix/suffix와 WEB-INF forward를 설명한다.", "Model을 immutable public display DTO와 key/scope contract로 제한한다.", "JSP translation·compile·instance lifecycle과 render failure를 진단한다.", "EL resolver·coercion·null·template trust 경계를 검증한다.", "JSTL 반복·조건·URL·locale을 presentation logic으로 사용한다.", "HTML/attribute/URL/JS context별 output encoding을 적용한다.", "custom tag pooling/reset/thread safety를 검증한다.", "MockMvc·real container·browser와 render budgets로 release를 승인한다.", "javax/Jakarta와 modern renderer migration을 semantic diff로 운영한다."],
  prerequisites: [{ title: "Bean Validation과 바인딩 오류를 사용자에게 돌려주기", reason: "validated command, BindingResult와 safe public error Model을 알아야 JSP가 어떤 값을 재표시하고 어떤 값을 절대 출력하면 안 되는지 설계할 수 있습니다.", sessionSlug: "mvc-05-validation-errors" }],
  keywords: ["ViewResolver", "logical view", "InternalResourceViewResolver", "WEB-INF", "JSP", "EL", "ELResolver", "JSTL", "c:out", "contextual encoding", "tag lifecycle", "Model", "forward", "javax jakarta migration"], topics,
  lab: {
    title: "res_ex01과 XML resolver를 안전한 JSP rendering pipeline으로 재구성",
    scenario: "legacy MVC가 logical strings와 broad Model을 JSP로 forward하고, EL/JSTL 도입·locale·custom tag·Jakarta migration 과정에서 wrong view, XSS, stale tag state와 first-request compile failure가 발생할 수 있습니다.",
    setup: ["원본 JSP/XML은 read-only로 보존하고 directive/tag counts, resolver prefix/suffix와 hashes만 기록합니다.", "JDK 21 exact examples, supported Spring/Jakarta baseline, MockMvc와 disposable real Servlet container를 준비합니다.", "route→logical view→required Model schema→resolver→resource manifest와 encoding sink inventory를 만듭니다.", "합성 markup-shaped values만 사용하고 실제 user/session/credential과 absolute deploy path를 저장·출력하지 않습니다."],
    steps: ["일반 Controller String과 ResponseBody String endpoints를 inventory해 view/body 계약을 고정합니다.", "logical name allowlist, resolver namespace/order와 InternalResource catch-all 위치를 검증합니다.", "final WEB-INF forward path와 packaged JSP/JSTL/EL/container baseline을 readback합니다.", "entity Model을 immutable public display DTO와 required/optional key contract로 바꿉니다.", "missing/null/scope collision/getter failure와 locale truth table을 실행합니다.", "JSTL forEach/choose/out/url로 scriptless presentation을 만들고 domain/query logic을 제거합니다.", "HTML text/attribute/URL/JS sinks에 맞는 encoding과 raw HTML trusted-type policy를 적용합니다.", "custom tag same-instance reuse/parallel stress와 partial-render failure를 검증합니다.", "MockMvc→real container compile/render→browser DOM/accessibility/no-execution tests를 실행합니다.", "old/new namespace/renderer corpus를 shadow 비교하고 canary·rollback·old cache cleanup을 승인합니다."],
    expectedResult: ["route마다 view name, Model schema, final forward와 rendered DOM이 일치합니다.", "다섯 Java example stdout이 문서와 완전히 같습니다.", "missing/wrong view·compile/taglib·scope·tag reuse 오류가 traffic 전에 stable category로 발견됩니다.", "markup-shaped text가 실행되지 않고 Model/log/metric에 sensitive/raw values가 없습니다.", "Jakarta/renderer migration 뒤 semantic DOM·link/form·locale·encoding parity와 rollback이 증명됩니다."],
    cleanup: ["disposable contexts/container, compiled JSP cache, generated servlet/debug artifacts와 synthetic Models를 제거합니다.", "temporary taglib/profile/diagnostic access와 renderer generations를 폐기합니다.", "active old compiled views, cache entries, threads와 captures가 0인지 확인합니다.", "원본 res_ex01.jsp와 servlet-context.xml은 변경하지 않습니다."],
    extensions: ["view/model schema를 static analyzer와 generated contract test로 연결합니다.", "tag reuse·EL property·Unicode encoding fuzz corpus를 확장합니다.", "JSP precompile artifact와 source line mapping을 CI evidence로 만듭니다.", "JSP→modern server template 또는 REST client semantic renderer diff를 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 logical view→scope→JSTL-like rendering→encoding→tag reset 흐름을 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "WEB-INF path와 public URL을 구분합니다.", "request가 session 동일 key보다 먼저 선택됨을 설명합니다.", "visible collection order와 escaping을 확인합니다.", "HTML text encoding이 다른 context의 만능 encoder가 아님을 설명합니다.", "pooled handler second output에 first 값이 없는지 확인합니다."], hints: ["view 이름이 맞다는 것과 최종 HTML이 안전하다는 것은 서로 다른 evidence입니다."], expectedOutcome: "controller 결과부터 HTML sink와 handler lifecycle까지 독립적으로 설명합니다.", solutionOutline: ["resolve→expose→evaluate→iterate→encode→reset 순서입니다."] },
    { difficulty: "응용", prompt: "원본 JSP/XML 흐름에 EL·JSTL을 도입하고 production-safe view contract로 migration하세요.", requirements: ["원본 EL/JSTL 0 evidence를 보존합니다.", "resolver order/allowlist와 final forward를 검증합니다.", "display DTO/model schema를 둡니다.", "missing/null/scope/locale cases를 처리합니다.", "scriptless JSTL과 contextual encoding을 적용합니다.", "tag pooling/thread safety를 검사합니다.", "MockMvc/container/browser tests를 실행합니다.", "Jakarta baseline, canary/rollback/zero-leak를 포함합니다."], hints: ["원본 정적 JSP에 JSTL이 있었다고 쓰지 말고 공식 보완임을 표시하세요."], expectedOutcome: "source truth를 보존하면서 안전하고 관측 가능한 JSP rendering pipeline이 완성됩니다.", solutionOutline: ["safe inventory→contract→resolve→render safely→qualify→migrate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC server-view 표준을 작성하세요.", requirements: ["view/body return contract와 resolver namespace/order를 정의합니다.", "Model DTO/key/scope/sensitivity policy를 둡니다.", "JSP/EL/JSTL baseline과 scriptless rule을 둡니다.", "contextual encoding/raw HTML policy를 정의합니다.", "tag lifecycle/thread safety를 요구합니다.", "URL/form/CSRF/accessibility rules를 포함합니다.", "MockMvc/container/browser/performance tests를 요구합니다.", "manifest, namespace migration, canary, incident와 retirement를 포함합니다."], hints: ["template를 단순 정적 파일이 아니라 application data를 읽고 code처럼 실행되는 artifact로 취급하세요."], expectedOutcome: "logical view 선언부터 안전한 render·upgrade·폐기까지 적용 가능한 governance가 완성됩니다.", solutionOutline: ["declare→resolve→render→encode→observe→migrate→retire 순서입니다."] },
  ],
  nextSessions: ["mvc-07-redirect-flash-session"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["res_ex01.jsp는 20 lines, page directive 1과 static links/GET form이 있으며 EL/JSTL/scriptlet/expression tag는 0이어서 이 세션의 EL/JSTL 내용은 공식 문서 기반 보완으로 명시했습니다.", "servlet-context.xml은 InternalResourceViewResolver, prefix/suffix property 각 1과 component-scan 3이 확인됐으며 machine absolute path와 sensitive values는 없습니다.", "원본은 resolver chain/cache, Model DTO/scope collision, JSP compilation/thread safety, EL coercion/security, JSTL escaping, custom tag pooling, layered tests와 migration operations를 포함하지 않아 current Spring/Jakarta/WHATWG/OWASP/JDK 공식 sources와 synthetic examples로 확장했습니다.", "JDK examples는 실제 DispatcherServlet, JSP compiler, ELResolver, JSTL tag handler/container pooling과 browser parser를 대체하지 않으므로 supported artifact의 real-container/browser tests가 필요합니다."] },
});

export default session;
