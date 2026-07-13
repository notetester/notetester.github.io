import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 21 records·collections로 Servlet/MVC request metadata와 delegate registry를 framework 독립적인 작은 모델로 표현합니다." },
      { lines: "19-끝에서 6줄 전", explanation: "servlet mapping, lookup path, context hierarchy, handler selection과 view rendering의 정상·실패 경로를 결정적으로 실행합니다." },
      { lines: "마지막 6줄", explanation: "method/path/status/handler/view/trace처럼 HTTP 계약과 routing evidence만 출력하며 header/body의 민감값은 포함하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/Tomcat jar·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "mini dispatcher는 학습용 상태 모델이며 실제 Servlet container와 Spring MVC strategies를 대체하지 않습니다."] },
    experiments: [
      { change: "context path, servlet mapping, HTTP method, route, static prefix와 view name을 바꿉니다.", prediction: "container mapping과 Spring handler mapping, static/view resolution이 서로 다른 단계에서 404/405/200을 결정합니다.", result: "단계별 입력·선택·status trace를 비교합니다." },
      { change: "동일 시나리오를 MockMvc와 실제 supported Servlet container에서 실행합니다.", prediction: "encoding, normalization, filters, interceptors, exception resolvers와 container defaults가 추가됩니다.", result: "request URI parts, selected handler, status/headers/body와 logs를 correlation id로 readback합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "front-controller-boundary",
    title: "DispatcherServlet을 모든 코드를 실행하는 객체가 아니라 공통 algorithm을 소유한 front controller로 이해합니다",
    lead: "Servlet container가 특정 URL mapping의 request를 DispatcherServlet에 전달하면 servlet은 HandlerMapping·HandlerAdapter·ViewResolver·ExceptionResolver delegates를 조합합니다.",
    explanations: [
      "원본 spring-servlet.xml은 mvc:annotation-driven, controller package scan, JSP view resolver와 /resource/** static mapping을 구성하고 MainController는 '/' 요청에 논리 view name 'home'을 반환합니다.",
      "front controller는 공통 진입점을 제공해 locale, multipart, handler selection, exception과 rendering 순서를 일관되게 적용합니다. business rule과 persistence 작업을 DispatcherServlet에 넣는다는 뜻은 아닙니다.",
      "Servlet container는 socket, HTTP parsing, servlet/filter lifecycle과 mapping을 담당하고 Spring MVC는 선택된 DispatcherServlet 내부의 application routing/binding/controller/rendering을 담당합니다. 두 계층의 404와 startup failure를 구분합니다.",
      "delegate strategies는 Spring beans로 발견됩니다. HandlerMapping이 handler를 찾고 HandlerAdapter가 다양한 handler 형태를 호출하며 반환값을 ModelAndView 또는 response body contract로 처리합니다.",
      "request마다 DispatcherServlet instance를 새로 만들지 않습니다. servlet/controller/service는 보통 shared singleton이므로 request state를 field에 저장하지 않고 arguments/local/context scope로 전달합니다.",
    ],
    concepts: [
      c("front controller", "모든 application request의 공통 진입 알고리즘을 담당하고 실제 작업을 delegates/handlers에 위임하는 pattern입니다.", ["cross-cutting flow를 표준화합니다.", "domain logic을 소유하지 않습니다."]),
      c("DispatcherServlet", "Spring MVC의 central Servlet으로 handler mapping, invocation, exception과 view/response 처리를 조정합니다.", ["Servlet container에 등록·mapping됩니다.", "WebApplicationContext delegates를 사용합니다."]),
      c("delegate strategy", "DispatcherServlet이 특정 단계의 정책을 위임하는 HandlerMapping, HandlerAdapter, ViewResolver 같은 bean contract입니다.", ["여러 구현/order가 가능합니다.", "실제 selected strategy를 관측합니다."]),
    ],
    codeExamples: [java("mvc01-dispatch-trace", "front-controller delegate sequence", "Mvc01Dispatch.java", "작은 dispatcher가 GET / 요청의 mapping→adapter→controller→view resolution→render 순서를 실행하고 missing handler를 404로 분류합니다.", String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Mvc01Dispatch {
  record Response(int status, String body, List<String> trace) {}
  static Response dispatch(String method, String path) {
    List<String> trace = new ArrayList<>();
    trace.add("dispatch:" + method + " " + path);
    Map<String, String> routes = Map.of("GET /", "homeController");
    String handler = routes.get(method + " " + path);
    if (handler == null) { trace.add("handler:none"); return new Response(404, "not-found", List.copyOf(trace)); }
    trace.add("handler:" + handler);
    trace.add("adapter:controller-method");
    String view = "home";
    trace.add("view:/WEB-INF/views/" + view + ".jsp");
    return new Response(200, "rendered:" + view, List.copyOf(trace));
  }
  public static void main(String[] args) {
    Response ok = dispatch("GET", "/");
    Response missing = dispatch("GET", "/missing");
    System.out.println("ok-status=" + ok.status());
    System.out.println("ok-body=" + ok.body());
    System.out.println("ok-trace=" + ok.trace());
    System.out.println("missing-status=" + missing.status());
    System.out.println("missing-trace=" + missing.trace());
  }
}`, "ok-status=200\nok-body=rendered:home\nok-trace=[dispatch:GET /, handler:homeController, adapter:controller-method, view:/WEB-INF/views/home.jsp]\nmissing-status=404\nmissing-trace=[dispatch:GET /missing, handler:none]", ["local-spring-servlet", "local-main-controller", "spring-dispatcher", "spring-dispatch-sequence", "java-list", "java-map"])],
    diagnostics: [
      d("request가 controller log에 전혀 도달하지 않습니다.", "Servlet container mapping/filter/security/connector 단계에서 DispatcherServlet 전에 처리됐습니다.", ["access log", "context path", "servlet registrations/mappings", "filter chain", "dispatcher entry trace"], "container가 선택한 servlet mapping과 request URI parts를 readback하고 충돌 mapping/filter를 수정합니다.", "container-level smoke와 dispatcher-entry metric을 분리합니다."),
      d("동시 요청에서 controller field 값이 섞입니다.", "singleton servlet/controller에 request-specific mutable state를 저장했습니다.", ["instance fields", "bean scope", "request arguments", "thread dumps", "concurrent test"], "request state를 method local/immutable arguments 또는 명시적 request scope에 둡니다.", "concurrent request isolation test와 mutable-controller-field rule을 둡니다."),
    ],
    expertNotes: ["DispatcherServlet은 framework의 template method이며 각 delegate order와 failure semantics가 운영 contract입니다.", "container access log와 application trace를 같은 request id로 연결하되 cookie/authorization/query PII를 그대로 기록하지 않습니다."],
  },
  {
    id: "servlet-registration-mapping",
    title: "Servlet 등록과 URL pattern을 container routing table로 설계합니다",
    lead: "DispatcherServlet은 web.xml, WebApplicationInitializer 또는 Boot registration으로 Servlet container에 name, load order와 mapping을 등록해야 request를 받을 수 있습니다.",
    explanations: [
      "legacy WAR는 web.xml이나 AbstractAnnotationConfigDispatcherServletInitializer를 사용할 수 있고 modern Spring Boot는 embedded container bootstrap 흐름이 다릅니다. 한 배포 방식의 registration 단계를 다른 방식에 그대로 적용하지 않습니다.",
      "mapping '/'는 default servlet mapping을 대체하는 형태이고 '/*'는 path mapping 의미가 달라 JSP forward/static resource 처리까지 가로챌 수 있습니다. prefix '/app/*'와 extension mappings도 lookup path 계산에 영향을 줍니다.",
      "context path는 배포 application 경계, servlet path/path info는 container mapping 결과, Spring lookup path는 handler mapping 입력입니다. URL 문자열 하나로 뭉뚱그리지 않습니다.",
      "load-on-startup은 servlet initialization timing을 조절합니다. eager startup은 context wiring failure를 traffic 전에 발견하지만 migration/remote probe 같은 작업은 별도 startup/readiness budget으로 관리합니다.",
      "여러 DispatcherServlet을 등록하면 각각 child WebApplicationContext와 mappings를 가질 수 있습니다. 동일 pattern 충돌, root services 공유와 lifecycle owner를 명시합니다.",
    ],
    concepts: [
      c("servlet mapping", "Servlet container가 request URL pattern을 특정 Servlet registration에 연결하는 routing rule입니다.", ["Spring handler mapping보다 먼저 적용됩니다.", "exact/path/extension/default patterns를 구분합니다."]),
      c("context path", "한 web application이 container에서 배포된 URL prefix입니다.", ["handler path에서 제외됩니다.", "reverse proxy prefix와 구분합니다."]),
      c("load-on-startup", "container startup 중 Servlet을 미리 초기화하는 순서/활성화 설정입니다.", ["wiring failure timing을 바꿉니다.", "readiness와 함께 검증합니다."]),
    ],
    codeExamples: [java("mvc01-servlet-routing", "longest servlet path mapping 선택", "Mvc01ServletMapping.java", "exact/path/default 후보 중 request에 맞는 가장 구체적인 servlet mapping을 교육용 규칙으로 선택합니다.", String.raw`import java.util.List;

public class Mvc01ServletMapping {
  record Mapping(String servlet, String pattern) {}
  static String select(List<Mapping> mappings, String path) {
    return mappings.stream()
      .filter(m -> m.pattern().equals("/") || (m.pattern().endsWith("/*") && path.startsWith(m.pattern().substring(0, m.pattern().length() - 1))) || m.pattern().equals(path))
      .sorted((a, b) -> Integer.compare(b.pattern().length(), a.pattern().length()))
      .map(m -> m.servlet() + ":" + m.pattern()).findFirst().orElse("none");
  }
  public static void main(String[] args) {
    List<Mapping> mappings = List.of(
      new Mapping("default", "/"),
      new Mapping("app", "/app/*"),
      new Mapping("health", "/health"));
    System.out.println("app=" + select(mappings, "/app/orders"));
    System.out.println("health=" + select(mappings, "/health"));
    System.out.println("asset=" + select(mappings, "/assets/site.css"));
  }
}`, "app=app:/app/*\nhealth=health:/health\nasset=default:/", ["spring-dispatcher", "jakarta-servlet-spec", "jakarta-servlet-registration", "java-list"])],
    diagnostics: [
      d("JSP forward가 다시 DispatcherServlet로 들어가 loop가 납니다.", "servlet을 /*에 mapping해 JSP/default servlet까지 가로챘습니다.", ["servlet patterns", "forward target", "dispatcher type", "view resolver", "container mappings"], "지원 배포 구조에 맞는 '/' 또는 prefix mapping을 사용하고 JSP path/forward integration test를 둡니다.", "REQUEST/FORWARD dispatch trace와 mapping contract test를 둡니다."),
      d("reverse proxy 아래에서 path가 두 번 prefix됩니다.", "external forwarded prefix, context path와 servlet mapping을 혼동했습니다.", ["external URL", "Forwarded headers", "contextPath", "servletPath", "lookupPath"], "trusted proxy/header strategy와 application mapping을 하나의 deployment contract로 고정합니다.", "direct/proxied URL matrix와 spoofed-header security tests를 둡니다."),
    ],
    expertNotes: ["교육용 longest-string 예제는 Servlet specification의 전체 mapping algorithm을 대체하지 않으므로 target container tests가 필수입니다.", "mapping 변경은 public URL compatibility와 cache/security policies까지 영향을 주는 release change입니다."],
  },
  {
    id: "lookup-path-normalization",
    title: "requestURI·contextPath·servletPath·pathInfo에서 안전한 lookup path를 도출합니다",
    lead: "handler mapping은 container가 분해한 path parts와 encoding/normalization을 고려해야 하며 문자열 prefix 삭제만으로 구현하면 보안·이식성 문제가 생깁니다.",
    explanations: [
      "requestURI는 request target의 path 부분을 나타내고 contextPath와 servlet mapping type에 따라 servletPath/pathInfo가 달라집니다. Spring은 mapping prefix를 제외한 lookup path를 handler selection에 사용합니다.",
      "encoded slash, semicolon content, duplicate slash, dot segments와 Unicode normalization을 직접 decode/normalize하면 container와 Spring의 해석이 달라질 수 있습니다. 현재 PathPattern/Servlet mapping 지원 경계를 사용합니다.",
      "reverse proxy가 X-Forwarded-* 또는 Forwarded headers를 보낼 때 trusted proxy에서만 변환하고 외부 client spoof를 차단합니다. routing과 generated links가 같은 external origin contract를 사용해야 합니다.",
      "path variable은 decode된 값일 수 있으므로 filesystem/SQL identifier로 바로 사용하지 않습니다. domain parser와 allow-list, canonicalization 후 authorization을 수행합니다.",
      "404 진단 시 브라우저에 보이는 URL만 보지 말고 raw request target의 안전한 fingerprint, context/servlet/lookup path와 selected mapping type을 기록합니다.",
    ],
    concepts: [
      c("request URI", "HTTP request target에서 scheme/authority/query를 제외한 path를 Servlet API가 제공하는 값입니다.", ["context/servlet parts와 함께 봅니다.", "raw 민감 query를 로그에 포함하지 않습니다."]),
      c("lookup path", "Spring HandlerMapping이 controller route를 찾을 때 사용하는 application-relative path입니다.", ["context/mapping prefix를 고려합니다.", "container mapping type에 의존합니다."]),
      c("path normalization", "encoding과 구조를 canonical form으로 해석하는 과정입니다.", ["container/framework 표준을 따릅니다.", "security authorization 이전 일관성을 검증합니다."]),
    ],
    codeExamples: [java("mvc01-lookup-path", "context·servlet prefix를 제외한 lookup path", "Mvc01LookupPath.java", "명시된 context/path mapping 계약에서 application lookup path를 계산하고 잘못된 prefix를 거부합니다.", String.raw`public class Mvc01LookupPath {
  static String lookup(String requestUri, String contextPath, String servletPrefix) {
    String expected = contextPath + servletPrefix;
    if (!requestUri.startsWith(expected)) throw new IllegalArgumentException("mapping mismatch");
    String value = requestUri.substring(expected.length());
    return value.isEmpty() ? "/" : value;
  }
  public static void main(String[] args) {
    System.out.println("orders=" + lookup("/shop/app/orders/42", "/shop", "/app"));
    System.out.println("root=" + lookup("/shop/app", "/shop", "/app"));
    try { lookup("/other/orders", "/shop", "/app"); }
    catch (IllegalArgumentException error) { System.out.println("invalid=" + error.getMessage()); }
    System.out.println("manual-decode=false");
  }
}`, "orders=/orders/42\nroot=/\ninvalid=mapping mismatch\nmanual-decode=false", ["spring-path-matching", "jakarta-http-servlet-request", "java-string"])],
    diagnostics: [
      d("route는 존재하지만 encoded path에서만 404입니다.", "container/Spring과 application custom decoder가 path 구조를 다르게 해석합니다.", ["raw request target fingerprint", "container path parts", "lookup path", "PathPattern", "proxy normalization"], "custom decode/prefix logic을 제거하고 supported framework path matching과 target-container tests를 사용합니다.", "reserved/encoded/dot/Unicode adversarial path corpus를 둡니다."),
      d("authorization path와 handler path가 다릅니다.", "security filter와 MVC가 서로 다른 normalization/matcher를 사용합니다.", ["security matcher", "handler lookup", "encoded delimiters", "servlet mapping", "container version"], "같은 canonical request contract와 supported matchers를 사용하고 ambiguous paths를 거부합니다.", "security-handler parity tests와 container upgrade corpus를 둡니다."),
    ],
    expertNotes: ["예제는 이미 검증된 prefix inputs를 가정한 모델이며 production URL parsing/decoding 구현으로 사용하지 않습니다.", "path 정보는 PII/secret을 포함할 수 있어 logs/traces에서 raw value 대신 route template/fingerprint를 우선합니다."],
  },
  {
    id: "web-context-hierarchy",
    title: "root와 DispatcherServlet child WebApplicationContext의 가시성·중복·lifecycle을 설계합니다",
    lead: "root context는 공유 services/repositories를, child context는 controller·view/web infrastructure를 담을 수 있으며 child→parent 조회만 가능합니다.",
    explanations: [
      "ContextLoaderListener로 root를 만들고 각 DispatcherServlet이 child context를 가질 수 있습니다. 작은 application은 하나의 context가 더 단순할 수 있으므로 hierarchy를 무조건 만들지 않습니다.",
      "child는 parent bean을 볼 수 있지만 parent는 child controller를 볼 수 없습니다. 동일 name/type을 child에 등록하면 shadowing/ambiguity가 생길 수 있어 definition ownership을 명시합니다.",
      "service/repository가 web controller/request type에 의존하면 root→child 역방향이 되어 architecture가 깨집니다. web adapter가 application port를 호출하도록 dependency direction을 유지합니다.",
      "여러 DispatcherServlet child가 root singleton을 공유하면 thread safety와 tenant/request state를 공유하지 않는지 확인합니다. child shutdown과 root shutdown order도 container lifecycle에 맞춥니다.",
      "context id, parent id, local definition source와 selected bean origin을 startup manifest에 남겨 같은 class/name이 어디서 왔는지 진단합니다.",
    ],
    concepts: [
      c("WebApplicationContext", "ServletContext와 연계된 Spring ApplicationContext로 web infrastructure와 beans를 관리합니다.", ["DispatcherServlet이 자체 context를 가질 수 있습니다.", "parent hierarchy를 지원합니다."]),
      c("root context", "여러 servlets/children이 공유할 수 있는 application-level parent context입니다.", ["services/repositories가 일반적입니다.", "web child types에 의존하지 않습니다."]),
      c("child context", "특정 DispatcherServlet의 MVC configuration과 controllers를 담는 context입니다.", ["parent beans를 조회합니다.", "local shadowing을 검증합니다."]),
    ],
    codeExamples: [java("mvc01-context-hierarchy", "child→parent lookup과 local shadowing", "Mvc01Contexts.java", "두 단계 context map에서 child local bean 우선, 없으면 parent fallback, parent의 child 미가시성을 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc01Contexts {
  static final class Context {
    final String id;
    final Context parent;
    final Map<String, String> local = new LinkedHashMap<>();
    Context(String id, Context parent) { this.id = id; this.parent = parent; }
    String get(String name) { return local.containsKey(name) ? id + ":" + local.get(name) : parent == null ? "missing" : parent.get(name); }
  }
  public static void main(String[] args) {
    Context root = new Context("root", null);
    root.local.put("service", "shared-service");
    Context web = new Context("web", root);
    web.local.put("controller", "home-controller");
    web.local.put("service", "web-shadow");
    System.out.println("controller=" + web.get("controller"));
    System.out.println("service-from-web=" + web.get("service"));
    System.out.println("service-from-root=" + root.get("service"));
    System.out.println("root-sees-controller=" + root.get("controller"));
  }
}`, "controller=web:home-controller\nservice-from-web=web:web-shadow\nservice-from-root=root:shared-service\nroot-sees-controller=missing", ["spring-context-hierarchy", "spring-web-application-context", "java-map"])],
    diagnostics: [
      d("controller가 없거나 두 번 등록됩니다.", "root/child 양쪽 scan 범위가 controller package를 누락 또는 중복 포함했습니다.", ["context ids", "local definitions", "scan roots", "bean names", "parent visibility"], "root는 application/infrastructure, child는 web adapter로 scan/import 경계를 분리합니다.", "context별 definition manifest와 controller cardinality test를 둡니다."),
      d("service가 request/controller type을 요구해 root가 시작되지 않습니다.", "application layer가 web child implementation에 역방향 의존합니다.", ["constructor graph", "context ownership", "module imports", "request types", "cycle"], "application port/input DTO를 root/core에 두고 web controller가 adapter mapping을 담당합니다.", "root module의 web package dependency를 architecture test로 금지합니다."),
    ],
    expertNotes: ["context hierarchy는 package/module architecture를 대신하지 않으므로 compile-time dependency도 함께 검증합니다.", "Boot single-context application과 legacy root/child WAR를 같은 diagram으로 혼합하지 않고 bootstrap baseline을 표시합니다."],
  },
  {
    id: "mvc-infrastructure-enable",
    title: "mvc:annotation-driven 또는 @EnableWebMvc가 등록하는 HandlerMapping·Adapter infrastructure를 읽습니다",
    lead: "annotation controller가 동작하려면 annotations만 존재하는 것이 아니라 MVC configuration이 mapping, adapter, conversion, validation과 return-value handlers를 등록해야 합니다.",
    explanations: [
      "원본 mvc:annotation-driven은 annotated controller methods를 위한 RequestMappingHandlerMapping/RequestMappingHandlerAdapter 등 기본 infrastructure를 활성화합니다. 정확한 bean set은 Spring version/config에 따라 공식 문서를 확인합니다.",
      "@EnableWebMvc는 Java configuration에서 MVC infrastructure를 import하고 WebMvcConfigurer로 formatters, converters, validators, interceptors, resources와 view resolvers를 추가할 수 있습니다.",
      "Spring Boot auto-configuration 위에 @EnableWebMvc를 무심코 추가하면 Boot의 MVC customization back-off/변경이 생길 수 있습니다. plain Framework와 Boot configuration ownership을 구분합니다.",
      "HandlerMapping order가 여러 개면 first matching handler가 선택될 수 있고 HandlerAdapter가 해당 handler type을 지원해야 합니다. mapping은 찾았지만 adapter가 없는 failure를 분리합니다.",
      "custom MessageConverter/ArgumentResolver를 추가할 때 default list를 대체하는지 확장하는지 확인합니다. 정상 JSON만 아니라 media type, validation, malformed body와 size limit을 테스트합니다.",
    ],
    concepts: [
      c("annotation-driven MVC", "annotated controller mapping/invocation에 필요한 MVC infrastructure를 등록하는 XML configuration입니다.", ["annotation만으로 동작하지 않습니다.", "current version defaults를 확인합니다."]),
      c("@EnableWebMvc", "Java configuration에서 MVC infrastructure와 WebMvcConfigurer extension points를 활성화하는 annotation입니다.", ["plain Framework baseline입니다.", "Boot auto-config와 ownership을 구분합니다."]),
      c("HandlerAdapter", "선택된 handler object를 실제로 호출하고 arguments/return value를 처리하는 strategy입니다.", ["handler type별 adapter가 있습니다.", "mapping과 invocation failure를 구분합니다."]),
    ],
    diagnostics: [
      d("@Controller는 bean인데 route가 하나도 등록되지 않습니다.", "MVC annotation infrastructure가 없거나 다른 child context에 등록되었습니다.", ["RequestMappingHandlerMapping", "handler methods", "context id", "@EnableWebMvc/XML", "scan source"], "해당 DispatcherServlet context에 supported MVC configuration과 controllers를 함께 등록합니다.", "mapping manifest와 minimal MockMvc context test를 둡니다."),
      d("Boot에 @EnableWebMvc 추가 후 static/converter 설정이 사라집니다.", "application이 Boot MVC auto-configuration ownership을 명시적으로 가져왔습니다.", ["Boot condition report", "@EnableWebMvc", "WebMvcConfigurer", "resource handlers", "message converters"], "원하는 수준이 customization인지 full control인지 결정하고 Boot 공식 extension pattern을 사용합니다.", "before/after MVC infrastructure manifest와 HTTP corpus를 둡니다."),
    ],
    expertNotes: ["Framework reference와 Boot reference의 bootstrap/configuration semantics를 같은 것으로 설명하지 않습니다.", "delegate bean 목록 전체를 production에 공개하지 않고 count/type/source를 protected diagnostic으로 관리합니다."],
  },
  {
    id: "component-scan-controller",
    title: "controller component scan 범위와 stereotype·mapping 등록을 module 경계로 관리합니다",
    lead: "@Controller class가 classpath에 존재해도 해당 DispatcherServlet context에서 scan/import되어 bean이 되고 mapping metadata가 발견되어야 request를 처리합니다.",
    explanations: [
      "원본은 com.simple.controller만 scan해 web adapter 범위를 좁힙니다. 최상위 package 전체 scan은 service/repository/example/test configurations까지 child context에 중복 등록할 수 있습니다.",
      "@Controller는 component stereotype이고 @RestController는 @Controller+@ResponseBody semantics를 합성합니다. JSP view controller와 JSON API controller의 return contract를 명확히 구분합니다.",
      "mapping path/method가 같은 handler methods는 startup ambiguity로 실패해야 합니다. profile/condition variants와 controller inheritance/interface mappings도 지원 버전에서 검증합니다.",
      "controller는 HTTP input parsing/binding/validation, application use-case 호출과 HTTP output mapping을 소유하고 SQL/session/domain orchestration을 직접 구현하지 않습니다.",
      "scan 결과를 protected startup mapping manifest로 남기되 controller method parameter names, raw paths에 민감 식별자, internal signatures를 무제한 노출하지 않습니다.",
    ],
    concepts: [
      c("@Controller", "Spring MVC web handler class임을 나타내는 component stereotype입니다.", ["bean으로 등록되어야 합니다.", "methods에 request mappings를 둡니다."]),
      c("component scan boundary", "어떤 packages/classes가 자동 BeanDefinition 후보가 되는지 정한 module 범위입니다.", ["context별 ownership을 가집니다.", "test/example 중복을 막습니다."]),
      c("mapping ambiguity", "동일 request condition에 둘 이상의 handler methods가 경쟁해 단일 선택을 할 수 없는 configuration failure입니다.", ["startup에 탐지합니다.", "profile/version matrix를 테스트합니다."]),
    ],
    diagnostics: [
      d("controller class는 있는데 404입니다.", "DispatcherServlet child context scan/import 범위 밖이거나 mapping 조건이 다릅니다.", ["bean definition", "context id", "scan base", "mapping manifest", "lookup path/method"], "controller를 올바른 web config에 explicit import/scan하고 expected mapping을 context test로 확인합니다.", "artifact-level controller/mapping manifest regression을 둡니다."),
      d("startup에 ambiguous mapping 오류가 납니다.", "두 methods/controllers가 같은 path·HTTP condition을 등록했습니다.", ["both handler signatures", "class/method paths", "HTTP methods", "profiles", "custom conditions"], "resource ownership과 route contract를 하나로 정하고 variant는 mutually exclusive condition으로 분리합니다.", "route uniqueness static/context gate를 둡니다."),
    ],
    expertNotes: ["scan이 편리해도 critical route ownership은 API inventory와 tests로 명시합니다.", "controller package를 public API 버전/feature module과 연결하면 route 변경 owner가 분명해집니다."],
  },
  {
    id: "handler-mapping-adapter",
    title: "HandlerMapping의 조건 선택과 HandlerAdapter의 호출을 404·405·media type 실패로 분해합니다",
    lead: "path가 맞는지, HTTP method/content conditions가 맞는지, handler invocation과 argument resolution이 성공하는지는 서로 다른 단계입니다.",
    explanations: [
      "RequestMappingInfo는 path뿐 아니라 HTTP methods, params, headers, consumes와 produces conditions를 결합할 수 있습니다. route table을 method+path만으로 문서화하면 415/406 원인을 놓칩니다.",
      "path는 있지만 method가 다르면 405와 Allow header, consumes가 다르면 415, produces negotiation이 실패하면 406으로 매핑될 수 있습니다. exact outcome은 current Spring resolver/configuration에서 HTTP tests로 확인합니다.",
      "HandlerAdapter는 argument resolvers로 request values를 Java parameters에 만들고 return value handlers로 view/model/body를 처리합니다. binding/validation failure는 controller body 실행 전 발생할 수 있습니다.",
      "custom handler mapping/adapter를 만들기 전에 built-in annotated controller extension points가 충분한지 검토합니다. custom strategy의 order와 unsupported handler behavior를 명시합니다.",
      "mapping cache와 route count는 startup/performance에 영향을 주지만 premature custom lookup 최적화보다 ambiguous/unsafe mappings 제거와 route templates 관측을 우선합니다.",
    ],
    concepts: [
      c("HandlerMapping", "request 조건에 맞는 handler와 interceptor chain을 찾는 DispatcherServlet strategy입니다.", ["path 외 여러 조건을 평가합니다.", "order와 ambiguity를 검증합니다."]),
      c("request condition", "path, method, params, headers, consumes, produces 등 handler 적합성을 정의하는 조건입니다.", ["API contract 일부입니다.", "status/headers tests로 검증합니다."]),
      c("return value handler", "controller method 반환값을 model/view, response body, status 등으로 해석하는 component입니다.", ["annotation/type에 따라 선택됩니다.", "view name과 body string을 구분합니다."]),
    ],
    codeExamples: [java("mvc01-handler-conditions", "path·method 조건의 200/405/404 분류", "Mvc01Handlers.java", "같은 path의 존재 여부와 method match를 분리해 handler, 405 allowed methods와 404를 결정합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public class Mvc01Handlers {
  static String resolve(Map<String, Set<String>> routes, String method, String path) {
    Set<String> allowed = routes.get(path);
    if (allowed == null) return "404:not-found";
    if (!allowed.contains(method)) return "405:allow=" + allowed.stream().sorted().toList();
    return "200:handler=" + method.toLowerCase() + path.replace('/', '-');
  }
  public static void main(String[] args) {
    Map<String, Set<String>> routes = new LinkedHashMap<>();
    routes.put("/orders", Set.of("GET", "POST"));
    routes.put("/health", Set.of("GET"));
    System.out.println("list=" + resolve(routes, "GET", "/orders"));
    System.out.println("wrong-method=" + resolve(routes, "DELETE", "/orders"));
    System.out.println("missing=" + resolve(routes, "GET", "/missing"));
  }
}`, "list=200:handler=get-orders\nwrong-method=405:allow=[GET, POST]\nmissing=404:not-found", ["spring-dispatch-sequence", "spring-handler-mapping-api", "spring-handler-adapter-api", "java-map", "java-set"])],
    diagnostics: [
      d("GET은 되지만 POST가 404/405입니다.", "path 존재와 HTTP method condition 또는 servlet/security mapping을 혼동했습니다.", ["lookup path", "registered methods", "Allow header", "security filter", "handler manifest"], "method별 route contract를 등록하고 404/405/status/header integration tests를 분리합니다.", "OpenAPI/route manifest와 MockMvc corpus를 동기화합니다."),
      d("controller breakpoint 전에 400/415가 납니다.", "argument resolver, converter 또는 consumes condition이 body를 거부했습니다.", ["Content-Type", "consumes", "message converters", "binding errors", "body size/shape"], "media type/DTO/validation contract를 명시하고 malformed/unsupported/oversized body tests를 둡니다.", "safe error response와 converter/config upgrade corpus를 유지합니다."),
    ],
    expertNotes: ["Java Set iteration order는 API Allow header의 canonical order 근거로 사용하지 않으며 실제 framework response를 assertion할 때 semantic set으로 비교합니다.", "route template은 metric label에 적합하지만 raw path/id는 high-cardinality·PII 위험이 있습니다."],
  },
  {
    id: "static-resource-routing",
    title: "static resource handler와 dynamic controller 경계를 cache·traversal·fallback 관점에서 설계합니다",
    lead: "원본 /resource/** mapping은 controller를 거치지 않는다는 설명보다 Spring ResourceHttpRequestHandler가 별도 mapping/handler로 응답한다는 모델이 정확합니다.",
    explanations: [
      "mvc:resources 또는 WebMvcConfigurer resource handlers는 URL pattern을 classpath/file locations에 연결합니다. mapping order가 controller routes와 충돌하지 않도록 dedicated prefix를 둡니다.",
      "default servlet handling은 unresolved requests를 container default servlet로 넘길 수 있어 DispatcherServlet의 no-handler 404 semantics가 달라집니다. SPA/JSP/static 배포 baseline에 맞춰 의도적으로 선택합니다.",
      "path traversal, encoded segments와 symlink/file locations를 방어하고 user uploads를 application static classpath와 같은 handler로 무조건 노출하지 않습니다.",
      "Cache-Control, ETag/Last-Modified, content type, compression와 immutable hashed assets를 CDN/reverse proxy와 함께 설계합니다. HTML entry와 versioned assets의 cache policy를 구분합니다.",
      "없는 asset, wrong media type, range/conditional request와 deployment base path를 실제 container/browser/curl tests로 확인합니다.",
    ],
    concepts: [
      c("resource handler", "URL patterns에 맞는 static resources를 locations에서 찾아 HTTP response로 제공하는 Spring MVC handler입니다.", ["controller와 별도 mapping입니다.", "cache/security를 설정합니다."]),
      c("default servlet handling", "DispatcherServlet이 처리하지 못한 요청을 container의 default Servlet에 위임하는 구성입니다.", ["404 의미를 바꿀 수 있습니다.", "배포 baseline에서 검증합니다."]),
      c("immutable asset", "content hash가 URL에 포함되어 내용이 바뀌면 새 URL을 갖는 정적 파일입니다.", ["long cache에 적합합니다.", "HTML manifest/cutover와 연결합니다."]),
    ],
    diagnostics: [
      d("/resource 파일이 controller 404로 갑니다.", "resource handler가 해당 context에 없거나 mapping/location/base path가 다릅니다.", ["resource mappings", "locations", "lookup path", "artifact contents", "handler order"], "dedicated prefix와 classpath location을 context config에 등록하고 packaged artifact에서 GET/HEAD를 검증합니다.", "static manifest/hash/content-type tests를 둡니다."),
      d("없는 dynamic route가 정적 fallback으로 200을 반환합니다.", "default servlet/SPA fallback이 모든 unresolved requests를 삼켰습니다.", ["fallback mappings", "Accept header", "API prefix", "status/body", "proxy rules"], "API/static/SPA prefixes와 fallback 조건을 분리하고 API missing은 404 problem response를 유지합니다.", "deep-link와 missing-API negative tests를 함께 둡니다."),
    ],
    expertNotes: ["'controller를 안 거친다'는 말은 security filters/CDN/container processing도 안 거친다는 뜻이 아닙니다.", "static handler에서 source map, secret config와 server-only artifacts가 배포되지 않는 allow-list를 둡니다."],
  },
  {
    id: "view-resolution-jsp",
    title: "논리 view name→ViewResolver→JSP forward를 response body와 구분합니다",
    lead: "@Controller method가 'home'을 반환하면 String이 바로 body가 아니라 설정된 return-value handler와 ViewResolver에 의해 view name으로 해석될 수 있습니다.",
    explanations: [
      "원본 InternalResourceViewResolver는 prefix '/WEB-INF/views/'와 suffix '.jsp'를 결합해 'home'을 JSP path로 만듭니다. /WEB-INF 아래는 일반 direct browser access를 막고 servlet forward로 렌더링합니다.",
      "@ResponseBody 또는 @RestController의 String은 message converter를 통해 body가 되므로 같은 return type이라도 annotation/controller semantics가 다릅니다.",
      "InternalResourceViewResolver는 JSP 존재를 resolution 시점에 항상 확인할 수 없고 chain에서 마지막에 두는 것이 권장될 수 있습니다. missing JSP는 forward/render 단계 404/500으로 나타날 수 있습니다.",
      "model attributes는 server-side view에 전달되며 request/session/global scope를 구분합니다. entity/secret/internal exception을 model에 무분별하게 넣지 않습니다.",
      "JSP/EL/JSTL은 legacy WAR learning path에 유효하지만 modern Boot/Jakarta deployment에서 packaging, Jasper/container support와 dependency baseline을 별도로 명시합니다.",
    ],
    concepts: [
      c("logical view name", "controller가 물리 file path 대신 반환하는 view 식별자입니다.", ["ViewResolver가 해석합니다.", "response body String과 구분합니다."]),
      c("ViewResolver", "view name과 locale 등을 실제 View object로 변환하는 DispatcherServlet strategy입니다.", ["여러 resolver order가 가능합니다.", "missing/render failure를 구분합니다."]),
      c("internal forward", "server 내부에서 다른 Servlet/JSP resource로 request를 전달해 렌더링하는 dispatch입니다.", ["browser URL은 그대로일 수 있습니다.", "servlet mapping loop를 검증합니다."]),
    ],
    diagnostics: [
      d("'home' 문자열 자체가 응답됩니다.", "@RestController/@ResponseBody가 view name semantics 대신 body handler를 선택했습니다.", ["controller stereotype", "method annotations", "return handlers", "Content-Type", "selected view"], "HTML view controller와 REST controller를 분리하고 MockMvc에서 forwardedUrl/content를 각각 assertion합니다.", "route별 representation contract tests를 둡니다."),
      d("view name은 resolve되지만 JSP가 404입니다.", "prefix/suffix path, WAR packaging, container JSP support 또는 /* servlet mapping이 잘못됐습니다.", ["resolved path", "artifact entries", "forward dispatcher", "JSP engine", "servlet mappings"], "target container에 JSP를 올바르게 package하고 '/' mapping/forward를 integration test합니다.", "packaged WAR smoke와 missing-view negative test를 둡니다."),
    ],
    expertNotes: ["view name은 user input으로 직접 조립하지 않고 allow-listed controller decisions로 만듭니다.", "JSP 렌더 시간과 template error는 controller 처리 시간과 별도 phase로 관측합니다."],
  },
  {
    id: "errors-observability-security",
    title: "404·405·500과 servlet/container failure를 phase·owner별로 관측하고 안전하게 공개합니다",
    lead: "사용자에게는 안정된 HTTP error contract를 제공하고 내부에는 container mapping→handler→binding→controller→view/exception phase evidence를 남깁니다.",
    explanations: [
      "container 404는 application/context/servlet mapping 전에 발생할 수 있고 MVC no-handler 404는 DispatcherServlet 내부 route 부재입니다. response 모양을 통일할 수 있어도 내부 origin을 구분합니다.",
      "405에는 허용 methods, 415/406에는 representation negotiation, 400에는 binding/validation evidence가 필요합니다. 모두 generic 500으로 바꾸지 않습니다.",
      "exception resolver chain이 controller exception을 처리할 수 있지만 Error dispatch, filter exception과 view render failure는 다른 경로일 수 있습니다. target container dispatch types를 테스트합니다.",
      "request id, route template, method, status, selected handler category, phase duration와 stable error code를 기록하고 Authorization, Cookie, raw query/body/path ids와 model을 기본 로그에서 제외합니다.",
      "health/readiness endpoint는 application context가 떴다는 사실뿐 아니라 critical handler mapping, template/static artifact와 downstream capability를 제한된 synthetic path로 검증합니다.",
    ],
    concepts: [
      c("error origin", "HTTP error가 container mapping, MVC mapping, binding, controller, downstream 또는 rendering 중 어느 phase에서 발생했는지의 분류입니다.", ["runbook owner를 정합니다.", "public error와 내부 evidence를 분리합니다."]),
      c("dispatch type", "REQUEST, FORWARD, INCLUDE, ERROR, ASYNC 등 Servlet request dispatch의 종류입니다.", ["filters/mappings 적용이 달라질 수 있습니다.", "trace loop와 error path를 검증합니다."]),
      c("route template telemetry", "raw URL 대신 /orders/{id} 같은 mapping template을 사용한 bounded 관측 데이터입니다.", ["cardinality/PII를 줄입니다.", "selected handler 이후에만 알 수 있습니다."]),
    ],
    diagnostics: [
      d("모든 오류가 500 한 종류로 보입니다.", "container/MVC/binding/controller/view phases를 한 exception handler/log로 합쳤습니다.", ["status distribution", "dispatch type", "handler selection", "binding errors", "resolver/view trace"], "phase별 stable error taxonomy와 appropriate 4xx/5xx mapping을 적용합니다.", "404/405/400/415/406/500/error-dispatch corpus를 둡니다."),
      d("access log에 token·query PII가 남습니다.", "raw request target/headers를 기본 format으로 기록했습니다.", ["access log format", "proxy logs", "APM capture", "query/header redaction", "retention"], "method, route template, status, bytes, duration와 request id allow-list로 교체합니다.", "credential-shaped canary zero-leak tests를 edge/container/app logs에 실행합니다."),
    ],
    expertNotes: ["404 비율은 route template을 모르는 경우 raw path cardinality 폭발 없이 prefix/fingerprint bucket으로 집계합니다.", "error page 자체가 exception message/stack/model secret을 렌더링하지 않는지 browser-level tests를 둡니다."],
  },
  {
    id: "version-deployment-qualification",
    title: "legacy XML/JSP·javax와 modern Java/Boot·jakarta baseline을 분리해 배포 qualification합니다",
    lead: "학습 원본의 XML schema와 전통 WAR 흐름을 보존하되 현재 Spring은 Jakarta Servlet namespace를 사용하므로 버전·container·JDK를 섞지 않습니다.",
    explanations: [
      "Spring Framework 6+는 Jakarta EE namespace 전환 이후 jakarta.servlet baseline을 사용합니다. javax.servlet compiled code/dependencies와 현재 framework를 단순 import rename 없이 혼합하지 않습니다.",
      "legacy source의 schema version 문자열은 당시 학습 provenance입니다. 공개 example마다 Spring/JDK/Servlet container, packaging WAR/JAR, javax/jakarta와 XML/Java/Boot bootstrap을 표시합니다.",
      "Boot embedded server는 application context가 container를 bootstrap하지만 external WAR는 container가 application/DispatcherServlet lifecycle을 시작합니다. port, context path, servlet registration과 shutdown evidence가 다릅니다.",
      "migration은 dependency graph와 imports, web.xml/initializer, filters/listeners, JSP/JSTL tags, validation/persistence namespaces와 integration tests를 함께 전환합니다.",
      "qualification matrix는 clean artifact deploy, startup, context/mapping manifest, GET/POST/404/405/static/view/error, graceful shutdown, proxy path와 secret-zero logs를 포함합니다.",
    ],
    concepts: [
      c("javax→jakarta migration", "Java EE APIs의 package namespace와 호환 dependency/container baseline을 Jakarta EE로 전환하는 작업입니다.", ["dependency/container 전체를 맞춥니다.", "import rename만으로 끝나지 않습니다."]),
      c("WAR deployment", "web application archive를 external Servlet container에 배포하는 packaging/lifecycle 모델입니다.", ["container가 bootstrap합니다.", "context path/mappings를 검증합니다."]),
      c("embedded container", "application process가 Servlet container를 생성·설정·시작하는 deployment 모델입니다.", ["Boot lifecycle과 통합됩니다.", "external WAR와 운영 절차가 다릅니다."]),
    ],
    diagnostics: [
      d("NoClassDefFoundError javax/jakarta가 startup에 납니다.", "Spring, Servlet API, libraries와 container namespace baseline이 혼합됐습니다.", ["dependency tree", "artifact classes", "container version", "imports", "provided/runtime scopes"], "지원 compatibility matrix로 전 dependency/container를 정렬하고 clean rebuild/deploy합니다.", "forbidden namespace scan과 target-container smoke를 CI에 둡니다."),
      d("IDE에서는 되지만 배포 WAR에서 JSP/route가 실패합니다.", "IDE server classpath/context config와 packaged artifact/container가 다릅니다.", ["WAR contents", "provided dependencies", "web.xml/initializer", "JSP engine", "context path"], "배포 artifact를 clean target container에서 자동 설치해 HTTP corpus를 실행합니다.", "artifact provenance와 container/JDK matrix를 release gate로 둡니다."),
    ],
    expertNotes: ["최신 권장안과 역사적 원본을 같은 code block에 혼합하지 않고 migration link로 연결합니다.", "Spring patch/container upgrade는 route/view/static/error뿐 아니라 path normalization/security parity corpus를 실행합니다."],
  },
  {
    id: "bootstrap-lab-runbook",
    title: "bootstrap→mapping→request→shutdown을 반복 가능한 MVC evidence runbook으로 완성합니다",
    lead: "프로젝트 생성 성공은 화면 한 번 표시가 아니라 artifact, container, contexts, routes, representations, failures와 cleanup을 재현할 수 있다는 뜻입니다.",
    explanations: [
      "build manifest에는 source commit, JDK/Spring/Servlet/container versions, packaging, context/servlet mappings와 configuration sources를 기록합니다.",
      "startup에서 root/child contexts, MVC special beans, controller mappings, resource/view resolvers와 condition/profile manifest를 secret 없이 readback합니다.",
      "HTTP corpus는 direct/proxy paths에서 GET/POST, 404/405, invalid media/body, static GET/HEAD/cache, JSP forward와 exception/error dispatch를 검증합니다.",
      "concurrency/load test는 singleton controller state, thread pools, async dispatch, response time/bytes와 downstream budgets를 확인합니다. raw inputs를 telemetry에 저장하지 않습니다.",
      "shutdown은 traffic drain, async requests, context children/root, executors/pools와 temporary artifacts를 순서대로 닫고 port/thread/file absence를 확인합니다.",
    ],
    concepts: [
      c("MVC bootstrap evidence", "artifact에서 DispatcherServlet contexts/delegates/routes가 준비되었음을 보여 주는 versioned manifest와 tests입니다.", ["traffic 전 검증합니다.", "값 없이 structural data를 사용합니다."]),
      c("HTTP corpus", "정상·경계·실패 request/response cases를 method/path/status/headers/body invariant로 모은 반복 검증 집합입니다.", ["MockMvc와 real container layers를 둡니다.", "upgrade마다 실행합니다."]),
      c("graceful web shutdown", "새 traffic을 중단하고 in-flight/async requests와 web/application resources를 제한 시간 안에 정리하는 절차입니다.", ["context hierarchy 순서를 지킵니다.", "종료 후 absence를 readback합니다."]),
    ],
    diagnostics: [
      d("smoke GET /만 통과했는데 배포 후 오류가 많습니다.", "method/media/error/static/view/proxy/shutdown paths를 검증하지 않았습니다.", ["HTTP corpus coverage", "representations", "failure cases", "proxy", "container version"], "layered MockMvc+target-container+proxy corpus를 만들고 status/headers/body/trace invariants를 gate로 둡니다.", "route changes가 corpus update 없이 merge되지 않게 합니다."),
      d("재배포 때 이전 context thread가 남습니다.", "servlet child/root와 async/resources의 shutdown ownership/order가 없습니다.", ["context close events", "async requests", "executors/pools", "remaining threads", "ports/files"], "traffic drain→child→root→container/resource close runbook을 구현하고 absence를 확인합니다.", "restart/failing-destroy/forced-timeout tests를 둡니다."),
    ],
    expertNotes: ["MockMvc는 controller/MVC integration에 강하지만 실제 container mapping/JSP engine/network proxy를 대체하지 않습니다.", "사이트 학습자료에서는 각 실행 결과의 환경 baseline과 대체하지 못하는 계층을 바로 옆에 표시합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-spring-servlet", repository: "SPRING/SpringMake", path: "webapp/WEB-INF/config/spring-servlet.xml", usedFor: ["annotation-driven MVC, controller scan, JSP resolver and static resource mapping progression"], evidence: "원본을 read-only로 확인했습니다." },
  { id: "local-main-controller", repository: "SPRING/SpringMake", path: "src/main/java/com/simple/controller/MainController.java", usedFor: ["@Controller root mapping and logical home view progression"], evidence: "원본을 read-only로 확인했습니다." },
  { id: "spring-webmvc", repository: "Spring Framework Reference", path: "Spring Web MVC", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc.html", usedFor: ["Servlet-stack MVC architecture baseline"], evidence: "Spring 공식 Web MVC reference입니다." },
  { id: "spring-dispatcher", repository: "Spring Framework Reference", path: "DispatcherServlet", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html", usedFor: ["front controller, registration and Boot distinction"], evidence: "Spring 공식 DispatcherServlet reference입니다." },
  { id: "spring-context-hierarchy", repository: "Spring Framework Reference", path: "Context Hierarchy", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/context-hierarchy.html", usedFor: ["root/child WebApplicationContext visibility"], evidence: "Spring 공식 MVC context hierarchy reference입니다." },
  { id: "spring-dispatch-sequence", repository: "Spring Framework Reference", path: "DispatcherServlet Processing", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/sequence.html", usedFor: ["delegate processing and init parameters"], evidence: "Spring 공식 DispatcherServlet processing reference입니다." },
  { id: "spring-path-matching", repository: "Spring Framework Reference", path: "Path Matching", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-path.html", usedFor: ["request path decomposition, decoding and mapping type"], evidence: "Spring 공식 MVC path matching reference입니다." },
  { id: "spring-enable-mvc", repository: "Spring Framework Reference", path: "Enable MVC Configuration", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/enable.html", usedFor: ["@EnableWebMvc and mvc:annotation-driven infrastructure"], evidence: "Spring 공식 MVC configuration reference입니다." },
  { id: "spring-static-resources", repository: "Spring Framework Reference", path: "Static Resources", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/static-resources.html", usedFor: ["resource handler mapping and cache"], evidence: "Spring 공식 static resources reference입니다." },
  { id: "spring-view-resolvers", repository: "Spring Framework Reference", path: "View Resolvers", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/view-resolvers.html", usedFor: ["JSP/view resolver configuration"], evidence: "Spring 공식 ViewResolver reference입니다." },
  { id: "spring-dispatcher-api", repository: "Spring Framework Javadoc", path: "DispatcherServlet", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html", usedFor: ["DispatcherServlet strategy and context API"], evidence: "Spring 공식 DispatcherServlet API입니다." },
  { id: "spring-handler-mapping-api", repository: "Spring Framework Javadoc", path: "HandlerMapping", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerMapping.html", usedFor: ["handler selection contract"], evidence: "Spring 공식 HandlerMapping API입니다." },
  { id: "spring-handler-adapter-api", repository: "Spring Framework Javadoc", path: "HandlerAdapter", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerAdapter.html", usedFor: ["handler invocation contract"], evidence: "Spring 공식 HandlerAdapter API입니다." },
  { id: "spring-view-resolver-api", repository: "Spring Framework Javadoc", path: "ViewResolver", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/ViewResolver.html", usedFor: ["logical view resolution contract"], evidence: "Spring 공식 ViewResolver API입니다." },
  { id: "spring-web-application-context", repository: "Spring Framework Javadoc", path: "WebApplicationContext", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/context/WebApplicationContext.html", usedFor: ["Servlet-linked context contract"], evidence: "Spring 공식 WebApplicationContext API입니다." },
  { id: "jakarta-servlet-spec", repository: "Jakarta Servlet Specification", path: "Jakarta Servlet 6.1", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/", usedFor: ["Servlet lifecycle, mappings and dispatch baseline"], evidence: "Jakarta EE 공식 Servlet specification입니다." },
  { id: "jakarta-servlet-registration", repository: "Jakarta Servlet API", path: "ServletRegistration.Dynamic", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/servletregistration.dynamic", usedFor: ["programmatic servlet registration and mappings"], evidence: "Jakarta EE 공식 ServletRegistration API입니다." },
  { id: "jakarta-http-servlet-request", repository: "Jakarta Servlet API", path: "HttpServletRequest", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletrequest", usedFor: ["request URI/context/servlet path contracts"], evidence: "Jakarta EE 공식 HttpServletRequest API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["dispatch traces and mapping examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["route and context registries"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["HTTP method condition example"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "java-string", repository: "Java SE 21 API", path: "String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["bounded educational lookup-path example"], evidence: "Oracle JDK 공식 String API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-01-project-bootstrap-dispatcher", slug: "mvc-01-project-bootstrap-dispatcher", courseId: "spring", moduleId: "spring-mvc-request-response", order: 1,
  title: "Spring MVC 프로젝트와 DispatcherServlet 요청 관문", subtitle: "화면 한 번 띄우기를 넘어 container mapping, lookup path, context hierarchy, MVC delegates, static/view/error, javax→jakarta와 배포 증거를 끝까지 추적합니다.", level: "전문가", estimatedMinutes: 1080,
  coreQuestion: "HTTP request가 Servlet container에서 DispatcherServlet과 MVC delegates를 거쳐 controller·view/response가 되고 종료될 때까지 각 단계의 입력·owner·failure·보안·증거를 어떻게 재현할까요?",
  summary: "SpringMake의 spring-servlet.xml과 MainController.java를 read-only로 확인해 annotation-driven MVC, controller scan, JSP resolver, /resource/** mapping과 '/'→'home' progression을 보존했습니다. front controller, servlet registration/mappings, path decomposition/normalization, root/child contexts, MVC infrastructure, controller scan, HandlerMapping/Adapter conditions, static resources, logical view/JSP, error/security/telemetry, legacy javax→modern jakarta deployment와 bootstrap runbook까지 확장합니다. 다섯 JDK 21 exact examples는 dispatch trace, servlet mapping, lookup path, context hierarchy와 200/405/404 handler conditions를 실제 실행합니다.",
  objectives: ["Servlet container와 DispatcherServlet/MVC 책임을 구분한다.", "registration·context path·servlet mappings와 load timing을 설계한다.", "requestURI/context/servlet/lookup path와 normalization을 안전하게 해석한다.", "root/child WebApplicationContext visibility와 lifecycle을 구성한다.", "annotation-driven/@EnableWebMvc가 제공하는 mapping/adapter infrastructure를 설명한다.", "controller scan·route uniqueness와 layer boundary를 검증한다.", "handler conditions와 404/405/415/406/binding failures를 분류한다.", "static resource/default servlet과 JSP view resolution을 운영한다.", "container/MVC/view errors를 secret-zero telemetry로 추적한다.", "javax/jakarta·WAR/embedded baseline과 full deploy/shutdown corpus를 qualification한다."],
  prerequisites: [{ title: "AOP 프록시와 로깅 Advice 실행 순서", reason: "Spring container, proxies와 cross-cutting execution order를 이해하면 MVC servlet/controller/interceptor/error 경계를 정확히 추적할 수 있습니다.", sessionSlug: "spring-core-09-aop-proxy-advice" }],
  keywords: ["Spring MVC", "DispatcherServlet", "front controller", "Servlet mapping", "context path", "lookup path", "WebApplicationContext", "HandlerMapping", "HandlerAdapter", "@EnableWebMvc", "component scan", "static resources", "ViewResolver", "JSP", "Jakarta Servlet", "MockMvc"], topics,
  lab: {
    title: "legacy XML/JSP MVC를 versioned·observable DispatcherServlet application으로 재구성하기",
    scenario: "XML controller scan/JSP/static 설정은 동작하지만 container mapping, context ownership, path/error semantics와 modern jakarta/Boot migration 기준이 없어 환경마다 404·view/static failure가 납니다.",
    setup: ["원본 XML/controller는 read-only로 보존하고 definitions/routes/paths만 inventory합니다.", "JDK 21 exact models, supported Spring/Jakarta container WAR와 별도 Boot embedded target을 준비합니다.", "context/servlet/handler/static/view/error manifests와 HTTP acceptance corpus를 만듭니다.", "실제 cookie/token/query/body/host/credential 없이 synthetic requests와 disposable dependencies만 사용합니다."],
    steps: ["container registration, context path와 servlet mappings를 target별 readback합니다.", "request URI parts와 safe lookup path를 direct/proxy/encoded cases에서 검증합니다.", "root/child contexts와 definition visibility/shadowing을 감사합니다.", "MVC infrastructure mappings/adapters/converters/resolvers를 protected manifest로 만듭니다.", "controller scan과 route conditions의 uniqueness/0/1 cardinality를 검증합니다.", "200/404/405/400/415/406/500 cases를 handler phase별 실행합니다.", "static GET/HEAD/cache/missing/traversal과 API/SPA fallback을 검증합니다.", "logical JSP view forward, missing template와 response body distinction을 테스트합니다.", "javax legacy와 jakarta modern artifacts를 별도 clean containers에서 qualification합니다.", "load/concurrency/graceful shutdown, secret-zero logs와 rollback을 승인합니다."],
    expectedResult: ["모든 public URL이 container mapping→lookup path→handler condition으로 설명됩니다.", "route/static/view/error가 올바른 status·headers·body/forward contract를 반환합니다.", "contexts와 singleton controllers가 동시 request에서 상태를 섞지 않습니다.", "WAR/embedded와 legacy/modern baseline이 섞이지 않고 target artifact에서 재현됩니다.", "logs/traces/manifests에 raw tokens, cookies, query/body PII와 configuration values가 없습니다."],
    cleanup: ["disposable containers/contexts, deployed WARs, generated manifests와 synthetic traffic artifacts를 제거합니다.", "traffic drain 후 child/root/context/container/resources를 닫고 port/thread/file absence를 readback합니다.", "temporary credentials/proxy/diagnostic access를 revoke합니다.", "원본 SPRING/SpringMake files는 변경하지 않습니다."],
    extensions: ["Filter/HandlerInterceptor/async dispatch의 전체 sequence lab을 추가합니다.", "reverse proxy/TLS/forwarded-header와 path normalization security corpus를 확장합니다.", "JSP와 template engine/REST representations를 content negotiation matrix로 비교합니다.", "Spring/Jakarta/container patch differential deploy suite를 CI에 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 container→dispatcher→handler→view 상태 전이를 그리세요.", requirements: ["stdout 완전 일치를 확인합니다.", "front controller trace를 설명합니다.", "servlet mapping과 Spring mapping을 구분합니다.", "lookup path inputs를 적습니다.", "child→parent 가시성을 설명합니다.", "404와 405를 구분합니다."], hints: ["브라우저 URL 하나를 contextPath, servlet mapping, lookup path와 handler condition 네 칸으로 나누세요."], expectedOutcome: "Spring MVC bootstrap을 annotation 암기가 아니라 두 단계 routing/lifecycle로 설명합니다.", solutionOutline: ["container select→lookup→handler→invoke→render/error 순서입니다."] },
    { difficulty: "응용", prompt: "원본 XML/JSP application을 target container에서 end-to-end qualification하세요.", requirements: ["registration/context/mapping manifest를 만듭니다.", "root/child/scan/MVC infrastructure를 검증합니다.", "path encoding/proxy cases를 포함합니다.", "HTTP 200/4xx/5xx corpus를 실행합니다.", "static/view/package cases를 검증합니다.", "concurrency/security telemetry를 확인합니다.", "javax/jakarta target을 분리합니다.", "shutdown/rollback evidence를 작성합니다."], hints: ["MockMvc 통과와 실제 WAR/container/JSP 통과를 같은 증거로 취급하지 마세요."], expectedOutcome: "환경이 바뀌어도 재현 가능한 MVC bootstrap/deploy runbook이 완성됩니다.", solutionOutline: ["artifact→container→contexts→routes→representations→failures→shutdown 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC bootstrap·routing·deployment 표준을 작성하세요.", requirements: ["container/dispatcher 책임과 mappings를 정의합니다.", "path normalization/proxy security를 둡니다.", "context/scan/MVC infrastructure ownership을 둡니다.", "route condition/status contract를 정의합니다.", "static/view/error policies를 둡니다.", "thread safety와 secret-zero observability를 요구합니다.", "legacy/modern compatibility matrix를 둡니다.", "target-container corpus, canary와 rollback을 포함합니다."], hints: ["각 404를 같은 원인으로 보지 말고 container·MVC·static/view phase를 분리하세요."], expectedOutcome: "요청 진입부터 종료·upgrade까지 운영 가능한 MVC governance가 완성됩니다.", solutionOutline: ["register→normalize→map→adapt→render→observe→qualify 순서입니다."] },
  ],
  nextSessions: ["mvc-02-requestmapping-http-method"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["spring-servlet.xml에서 annotation-driven1, controller scan1, InternalResourceViewResolver1과 static resource mapping1을 read-only로 확인했습니다.", "MainController.java에서 @Controller1, root RequestMapping1과 logical view 'home' progression을 확인했습니다.", "원본은 container registration/path decomposition/context hierarchy/handler failures/security/telemetry, modern Jakarta/Boot와 deployment qualification을 다루지 않아 current Spring/Jakarta/JDK 공식 문서와 synthetic examples로 보완했습니다.", "JDK mini dispatcher는 Servlet mapping, Spring path normalization, converters, JSP engine, filters/security와 target container behavior를 대체하지 않습니다."] },
});

export default session;
