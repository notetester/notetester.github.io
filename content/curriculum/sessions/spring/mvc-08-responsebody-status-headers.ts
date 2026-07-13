import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "JDK 21 record·Map·List·URI로 body/view classification, HTTP response, negotiation, conditional cache 또는 CORS/problem contract를 Spring 없이 선언합니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "success뿐 아니라 unsupported media, invalid header, conditional request, untrusted origin과 safe public error 경로를 실행해 status·headers·body의 결합을 검증합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "status, allowlisted headers, media type, stable public code와 body presence만 출력합니다. credential, origin reflection, internal exception, object identity와 raw request는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/Jackson/Servlet jar·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "예제의 작은 codec/negotiator/CORS 함수는 actual Spring return-value handlers, HttpMessageConverters, browser Fetch CORS와 proxy/cache behavior를 대체하지 않으므로 supported application integration tests가 필요합니다."] },
    experiments: [
      { change: "Accept/Content-Type을 unsupported·wildcard·quality tie로 바꾸고 status/body 조합과 Vary를 변형합니다.", prediction: "negotiation·cache key·client parser contract가 불명확하면 406/415 대신 wrong representation 또는 shared-cache mix가 생깁니다.", result: "produces/consumes, server preference, Vary와 406/415/error media type을 명시해 matrix test합니다." },
      { change: "untrusted header/origin/internal exception과 authenticated response를 넣고 cache/CORS 정책을 변경합니다.", prediction: "header injection, origin over-sharing, sensitive cache와 implementation leak가 발생할 수 있습니다.", result: "typed headers, exact origin allowlist, authorization/CSRF, no-store와 stable Problem Details allowlist를 적용합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "responsebody-versus-view",
    title: "같은 String 반환도 logical view와 response body로 갈리는 return-value contract를 구분합니다",
    lead: "일반 `@Controller`의 String은 logical view name이 될 수 있지만 method/class `@ResponseBody` 또는 `@RestController`에서는 HttpMessageConverter가 response body에 쓰므로 annotation과 selected handler가 의미를 결정합니다.",
    explanations: [
      "원본 RestBasicController는 @RestController, one @GetMapping, explicit text/plain UTF-8 produces와 짧은 text return을 가집니다. read-only 구조 증거만 사용하고 이를 JSON API나 secure endpoint로 과장하지 않습니다.",
      "@RestController는 @Controller와 @ResponseBody 의미를 결합한 meta-annotation입니다. class 전체가 body contract가 되므로 HTML view method를 같은 class에 섞을 때 return type만 보고 판단하면 오류가 납니다.",
      "return value handler는 method annotations/type을 보고 converter/view path를 선택합니다. body가 이미 write/commit되면 ViewResolver로 되돌아가지 않으며, body와 ModelAndView를 동시에 의도하지 않습니다.",
      "String body는 StringHttpMessageConverter가 처리할 수 있고 Java object는 JSON/XML converter가 처리할 수 있습니다. `toString()` 결과가 자동 JSON schema가 아니며 configured converter와 selected media type을 확인합니다.",
      "test는 일반 Controller String의 viewName/forward와 RestController String의 status·Content-Type·body를 서로 다른 assertions로 검증합니다. 단순 반환값 unit test만으로 HTTP contract를 증명하지 않습니다.",
    ],
    concepts: [
      c("@ResponseBody", "handler return value를 View가 아니라 HttpMessageConverter를 통해 HTTP response body에 쓰도록 표시하는 annotation입니다.", ["method/class level이 가능합니다.", "media type selection이 뒤따릅니다."]),
      c("@RestController", "@Controller와 @ResponseBody를 결합해 기본적으로 모든 handler return을 body로 처리하는 annotation입니다.", ["view controller와 구분합니다.", "converter가 필요합니다."]),
      c("return-value handler", "controller method 결과 type/annotations를 해석해 view, body, async 등 다음 처리 전략을 선택하는 MVC component입니다.", ["String type만으로 의미가 정해지지 않습니다.", "integration test가 필요합니다."]),
    ],
    codeExamples: [java("mvc08-body-view-classification", "String logical view와 body text의 처리 차이", "Mvc08BodyView.java", "같은 String type을 explicit VIEW/BODY mode로 분류해 resolver와 Content-Type contract가 상호 배타적임을 실행합니다.", String.raw`public class Mvc08BodyView {
  enum Mode { VIEW, BODY }
  record Result(String kind, String value, String contentType, boolean resolverUsed) {}
  static Result handle(String value, Mode mode) {
    if (mode == Mode.VIEW) return new Result("view", value, "none", true);
    return new Result("body", value, "text/plain;charset=UTF-8", false);
  }
  public static void main(String[] args) {
    Result controller = handle("greeting", Mode.VIEW);
    Result rest = handle("hello", Mode.BODY);
    System.out.println("controller-kind=" + controller.kind());
    System.out.println("controller-value=" + controller.value());
    System.out.println("rest-kind=" + rest.kind());
    System.out.println("rest-body=" + rest.value());
    System.out.println("rest-content-type=" + rest.contentType());
    System.out.println("resolver-used-for-rest=" + rest.resolverUsed());
  }
}`, "controller-kind=view\ncontroller-value=greeting\nrest-kind=body\nrest-body=hello\nrest-content-type=text/plain;charset=UTF-8\nresolver-used-for-rest=false", ["local-rest-controller", "spring-response-body", "spring-response-body-api", "spring-rest-controller-api", "spring-message-conversion", "spring-http-message-converter"])],
    diagnostics: [d("API가 `hello` 대신 hello.jsp 404를 내거나 HTML endpoint가 text body만 보냅니다.", "@Controller/@ResponseBody/@RestController와 return-value handler contract를 혼동했습니다.", ["class/method annotations", "selected handler", "view name/forward", "Content-Type/body"], "HTML view와 body endpoints를 명시 분리하고 return contract에 맞는 annotations/types를 사용합니다.", "MockMvc에서 viewName/forward와 body/contentType의 상호 배타적 contract tests를 둡니다.")],
    expertNotes: ["annotation을 proxy/interface 어디에 선언하는지는 supported Spring mapping contract를 따라 일관되게 배치합니다.", "body method에서 직접 response writer와 ResponseEntity를 함께 사용하면 commit/ownership이 모호해지므로 한 abstraction을 선택합니다."],
  },
  {
    id: "message-converter-schema",
    title: "HttpMessageConverter 선택과 serialization schema를 API 계약으로 고정합니다",
    lead: "@ResponseBody object는 selected media type을 쓸 수 있는 converter에 전달되므로 classpath/config 순서, supported media types, generic type과 serializer settings가 wire representation을 바꿉니다.",
    explanations: [
      "converter는 Java type과 media type에 대해 canWrite를 판단하고 response body stream에 씁니다. String, byte array, Resource, JSON object와 XML object는 서로 다른 converter/lifecycle을 가질 수 있습니다.",
      "default converters를 custom configure로 대체하면 기존 String/form/resource/JSON 지원을 실수로 제거할 수 있습니다. extend와 replace semantics를 확인하고 actual registered list를 startup manifest로 기록합니다.",
      "entity/ORM proxy를 직접 serialize하면 lazy queries, cycles, internal fields와 password digest가 노출될 수 있습니다. versioned response DTO와 explicit property allowlist, bounded nested depth/collection을 사용합니다.",
      "serializer module/date/enum/null/naming settings은 public schema입니다. JVM locale/timezone/default mapper에 맡기지 않고 OpenAPI/JSON schema와 golden consumer corpus를 연결합니다.",
      "serialization은 handler 성공 뒤 실패할 수 있고 일부 bytes가 이미 commit됐을 수 있습니다. object graph를 prevalidate/bound하고 streaming/large response의 failure semantics를 별도 설계합니다.",
    ],
    concepts: [
      c("HttpMessageConverter", "HTTP input/output body와 Java object 사이를 media type에 맞게 읽고 쓰는 Spring abstraction입니다.", ["type/media compatibility를 검사합니다.", "여러 implementation이 있습니다."]),
      c("wire schema", "client가 실제 bytes에서 보는 field names, types, null/enum/date와 nesting contract입니다.", ["DTO로 고정합니다.", "versioning이 필요합니다."]),
      c("serialization failure", "handler result가 준비된 뒤 converter가 object graph를 bytes로 만들지 못한 실패입니다.", ["commit 여부를 확인합니다.", "internal detail을 숨깁니다."]),
    ],
    diagnostics: [d("개발에서는 JSON인데 배포에서 converter가 없거나 날짜/field가 다르게 직렬화됩니다.", "registered converter/mapper modules와 response DTO schema를 artifact로 고정하지 않았습니다.", ["selected converter", "supported media types", "dependency/mapper modules", "actual wire body schema"], "supported converter/mapper baseline과 versioned response DTO를 고정하고 clean artifact contract test를 실행합니다.", "registered-converter manifest와 golden schema/consumer tests를 CI에 둡니다.")],
    expertNotes: ["custom converter canWrite가 너무 넓으면 다른 representation을 가로챌 수 있어 exact type/media predicates와 order를 검증합니다.", "error response converter도 success mapper와 다른 classpath/config를 사용할 수 있으므로 동일 media matrix를 test합니다."],
  },
  {
    id: "responseentity-complete-response",
    title: "ResponseEntity로 status·headers·body를 한 immutable HTTP 결과로 구성합니다",
    lead: "ResponseEntity는 body만 반환하는 편의보다 status와 HttpHeaders를 함께 표현해 201 Location, 204 empty, cache validators와 retry hints 같은 HTTP semantics를 controller return contract에 드러냅니다.",
    explanations: [
      "resource 생성은 보통 201 Created와 client가 조회할 canonical Location을 반환할 수 있습니다. body를 포함할지는 API contract이며 Location을 user-controlled Host 문자열 concatenation으로 만들지 않습니다.",
      "200 with empty body, 204 No Content와 404는 다릅니다. 204/304처럼 content restrictions가 있는 status에 JSON error/body를 섞지 않고 client가 status를 먼저 해석하게 합니다.",
      "ResponseEntity builder는 typed status/header helpers를 제공하지만 arbitrary header value를 신뢰해도 된다는 뜻은 아닙니다. CR/LF/control character, oversized values와 restricted/hop-by-hop headers를 거부합니다.",
      "headers는 case-insensitive field names와 multiple values semantics를 가지므로 일반 `Map<String,String>`로 완전히 대체하지 않습니다. example Map은 교육용 allowlist snapshot임을 명시합니다.",
      "controller마다 security/cache headers를 복사하지 않고 global filter/security/cache policy와 endpoint-specific metadata를 분리합니다. 중복 headers가 충돌할 때 owner와 precedence를 정합니다.",
    ],
    concepts: [
      c("ResponseEntity", "HTTP status code, headers와 optional body를 함께 표현하는 Spring HttpEntity subtype입니다.", ["builder를 제공합니다.", "controller return으로 사용합니다."]),
      c("Location", "새 resource 또는 redirect target URI reference를 나타내는 HTTP field입니다.", ["canonical URI를 사용합니다.", "민감 query를 피합니다."]),
      c("response invariant", "status·headers·body가 함께 지켜야 하는 조건입니다. 예: 201 Location, 204/304 no content입니다.", ["builder/test로 검사합니다.", "proxy 후에도 확인합니다."]),
    ],
    codeExamples: [java("mvc08-response-entity-contract", "201·Location·Content-Type와 header injection 거부", "Mvc08ResponseEntity.java", "small immutable response record를 만들어 created response와 untrusted CR/LF header rejection을 실행합니다.", String.raw`import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc08ResponseEntity {
  record Item(int id, String name) {}
  record Response<T>(int status, Map<String, String> headers, T body) {}
  static String safeHeader(String value) {
    if (value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0) {
      throw new IllegalArgumentException("invalid-header");
    }
    return value;
  }
  public static void main(String[] args) {
    URI location = URI.create("/api/items/7");
    Map<String, String> headers = new LinkedHashMap<>();
    headers.put("Location", location.toString());
    headers.put("Content-Type", "application/json");
    headers.put("Cache-Control", "no-store");
    Response<Item> response = new Response<>(201, Map.copyOf(headers), new Item(7, "guide"));
    boolean rejected;
    try { safeHeader("ok\r\nInjected: value"); rejected = false; }
    catch (IllegalArgumentException expected) { rejected = true; }
    System.out.println("status=" + response.status());
    System.out.println("location=" + response.headers().get("Location"));
    System.out.println("content-type=" + response.headers().get("Content-Type"));
    System.out.println("cache-control=" + response.headers().get("Cache-Control"));
    System.out.println("body-id=" + response.body().id());
    System.out.println("header-injection-rejected=" + rejected);
  }
}`, "status=201\nlocation=/api/items/7\ncontent-type=application/json\ncache-control=no-store\nbody-id=7\nheader-injection-rejected=true", ["spring-response-entity-reference", "spring-response-entity-api", "spring-http-headers", "spring-http-status-code", "spring-media-type", "jakarta-http-response", "rfc9110", "owasp-http-headers", "java-uri", "java-map", "java-linked-hash-map"])],
    diagnostics: [d("resource가 생성됐는데 200만 오거나 201 Location이 attacker host/개행 header를 포함합니다.", "status/header invariant와 trusted URI/header construction boundary가 없습니다.", ["status/body", "Location source/base URL", "CR/LF/control characters", "proxy Forwarded trust"], "typed URI/HttpHeaders builder와 external-base allowlist를 사용하고 201/204/304 invariants를 contract test합니다.", "header injection corpus와 proxy-integrated Location readback을 둡니다.")],
    expertNotes: ["ResponseEntity를 모든 endpoint에 기계적으로 쓰기보다 default 200 body와 non-default status/header가 필요한 경우의 명시성을 활용합니다.", "custom raw status도 HttpStatusCode로 표현할 수 있지만 client/proxy support와 registry semantics를 검토합니다."],
  },
  {
    id: "http-status-domain-semantics",
    title: "상태 코드를 message 문구가 아니라 method·resource·retry 의미로 선택합니다",
    lead: "모든 성공을 200, 모든 실패를 500으로 보내면 caches, browsers와 clients가 retry·authentication·conflict를 판단할 수 없으므로 domain outcome을 표준 HTTP semantics에 안정적으로 mapping합니다.",
    explanations: [
      "200은 representation을 동반한 성공, 201은 resource 생성, 202는 아직 완료되지 않은 processing acceptance, 204는 body 없는 성공입니다. 202는 완료를 보장하지 않으므로 status resource/retry protocol이 필요합니다.",
      "400 malformed request, 401 authentication 필요, 403 authenticated but forbidden, 404 absent/hidden resource, 409 current-state conflict, 412 precondition failure, 422 semantic content와 429 rate limit을 API policy로 구분합니다.",
      "status는 domain exception class 이름과 일대일이 아닙니다. controller advice/error adapter가 stable public code와 status를 mapping하고 implementation exception/SQL message를 숨깁니다.",
      "retry 가능성은 status만으로 충분하지 않을 수 있습니다. 429/503 Retry-After, idempotency와 deadline을 함께 정의하고 unsafe mutation을 client가 무조건 retry하게 만들지 않습니다.",
      "authorization 때문에 resource 존재를 숨길지 403/404를 선택할 수 있지만 같은 endpoint/user state에서 consistent하게 적용해 enumeration side channel을 줄입니다.",
    ],
    concepts: [
      c("status semantics", "request method와 target resource에 대한 처리 결과를 machine-readable 3-digit code로 표현하는 HTTP 계약입니다.", ["body message와 독립적입니다.", "retry/cache에 영향 줍니다."]),
      c("precondition", "If-Match 등 client가 요구한 resource version 조건이 충족되어야 mutation을 수행하는 계약입니다.", ["lost update를 막습니다.", "412로 표현할 수 있습니다."]),
      c("Retry-After", "적절한 status에서 client가 다음 시도를 기다릴 시간/date를 전달하는 HTTP field입니다.", ["budget/idempotency와 결합합니다.", "무한 retry를 지시하지 않습니다."]),
    ],
    diagnostics: [d("validation/conflict/not-found가 모두 200 error body 또는 500으로 반환됩니다.", "domain outcome→HTTP status/public code registry가 없고 exception message를 response 계약으로 사용했습니다.", ["actual status distribution", "domain outcome taxonomy", "client retry/parser", "cache/proxy behavior"], "method/resource semantics에 따른 status registry와 stable problem code를 만들고 unknown server failure만 5xx로 normalize합니다.", "outcome×method status table과 consumer retry contract tests를 둡니다.")],
    expertNotes: ["status code 수를 줄이는 것이 단순성은 아니며 client가 반드시 구분해야 하는 action을 안정된 최소 taxonomy로 제공합니다.", "custom nonstandard status보다 standard status+documented problem type/code를 우선합니다."],
  },
  {
    id: "headers-trust-proxy-security",
    title: "HttpHeaders의 multi-value·case-insensitive 의미와 proxy trust를 통제합니다",
    lead: "HTTP fields는 representation, caching, authentication, CORS와 routing metadata를 운반하지만 untrusted request/header values를 response에 반사하거나 Forwarded를 무조건 신뢰하면 injection과 wrong-origin URL이 생깁니다.",
    explanations: [
      "field names는 case-insensitive이고 일부 fields는 여러 values를 결합할 수 있지만 Set-Cookie처럼 결합 규칙이 다릅니다. typed HttpHeaders methods와 RFC semantics를 사용하고 comma split을 모든 field에 적용하지 않습니다.",
      "CR/LF가 header value에 들어가면 response splitting 위험이 있으므로 container/framework validation을 유지하고 user input을 arbitrary field name/value로 노출하지 않습니다.",
      "Host, Forwarded와 X-Forwarded-*는 trusted reverse proxy가 정제했을 때만 external base URI에 사용합니다. direct client가 spoof한 scheme/host로 Location, CORS와 secure link를 만들지 않습니다.",
      "hop-by-hop fields와 Content-Length/Transfer-Encoding을 application에서 임의 복사하지 않습니다. proxy/container가 connection framing을 소유하고 body bytes와 Content-Length 불일치를 피합니다.",
      "security headers는 response type과 browser usage에 맞춰 central policy로 적용합니다. JSON API에 CSP가 모든 위협을 해결한다고 보지 않고 Content-Type/nosniff, TLS, cache, CORS와 authorization을 각각 검증합니다.",
    ],
    concepts: [
      c("HttpHeaders", "case-insensitive names와 multi-value HTTP fields를 표현하고 common fields의 typed accessors를 제공하는 Spring type입니다.", ["일반 Map과 다릅니다.", "immutable/read-only 경계를 사용합니다."]),
      c("response splitting", "개행이 포함된 untrusted header value가 추가 response fields/body boundary를 주입하는 공격입니다.", ["framework validation을 유지합니다.", "반사를 allowlist합니다."]),
      c("trusted proxy boundary", "어떤 upstream proxy만 forwarded scheme/host/client metadata를 설정·정제할 수 있는지 정한 network/application contract입니다.", ["direct spoof를 제거합니다.", "deployment test가 필요합니다."]),
    ],
    diagnostics: [d("Location/CORS host가 request Host나 X-Forwarded-Host에 따라 attacker domain으로 바뀝니다.", "trusted proxy allowlist/sanitization 없이 forwarded headers를 external origin truth로 사용했습니다.", ["network path/proxy list", "Forwarded header sanitization", "application filter config", "generated Location/allow-origin"], "edge에서 untrusted forwarded headers를 제거하고 trusted proxy만 canonical external origin metadata를 주입하도록 구성합니다.", "direct/spoofed/trusted-proxy integration matrix와 generated-header assertions를 둡니다.")],
    expertNotes: ["header values도 개인정보/credential을 담을 수 있어 debug dump와 APM capture allowlist가 필요합니다.", "header size/count limits와 431/400 behavior를 edge와 application에서 정렬해 resource exhaustion을 줄입니다."],
  },
  {
    id: "content-negotiation-406-415-vary",
    title: "Accept·Content-Type·produces·consumes를 406/415와 Vary까지 연결합니다",
    lead: "request Content-Type은 client가 보낸 body format이고 Accept는 원하는 response representations이므로 둘을 섞지 않고 available converters와 handler mapping 조건으로 협상합니다.",
    explanations: [
      "`consumes`는 request body media ranges와 mapping을 제한하고 converter read capability가 없으면 415 Unsupported Media Type이 될 수 있습니다. body sniffing이나 file extension으로 type을 추측하지 않습니다.",
      "`produces`와 Accept quality/specificity는 response representation 후보를 좁힙니다. mutually acceptable representation이 없으면 silent JSON/default 200이 아니라 406 Not Acceptable policy를 검증합니다.",
      "wildcard와 missing Accept에는 documented server default를 사용하고 equal-quality tie에는 stable server preference를 둡니다. registered converter order 우연에 public API를 맡기지 않습니다.",
      "Accept에 따라 body가 달라지는 cacheable response는 Vary: Accept 등 cache key 영향을 표시합니다. Origin/Accept-Encoding/locale까지 representation을 바꾸면 정확한 Vary와 cache strategy가 필요합니다.",
      "path extension negotiation은 reflected file download와 ambiguity 위험 때문에 current Spring defaults/guidance를 확인하고 Accept 중심 또는 explicit safe parameter mapping을 사용합니다.",
    ],
    concepts: [
      c("content negotiation", "request preferences와 server capabilities에서 response media type/representation을 선택하는 HTTP 과정입니다.", ["Accept quality/specificity를 봅니다.", "Vary와 연결됩니다."]),
      c("406 Not Acceptable", "target resource는 있지만 client Accept 조건을 만족하는 representation을 제공하지 못한 결과입니다.", ["supported types를 문서화합니다.", "error representation도 협상합니다."]),
      c("415 Unsupported Media Type", "request content format을 endpoint/converter가 지원하지 않아 처리할 수 없는 결과입니다.", ["Content-Type을 확인합니다.", "payload validation과 다릅니다."]),
    ],
    codeExamples: [java("mvc08-content-negotiation", "quality 기반 Accept 선택과 406", "Mvc08Negotiation.java", "두 supported media type 중 q값이 높은 representation을 선택하고 wildcard default와 unsupported 406을 실행합니다.", String.raw`import java.util.Comparator;
import java.util.List;

public class Mvc08Negotiation {
  record Offer(String mediaType, double quality) {}
  static String select(String accept) {
    if (accept.equals("*/*")) return "application/json";
    List<String> supported = List.of("application/json", "text/plain");
    return List.of(accept.split(",")).stream()
        .map(String::strip)
        .map(part -> {
          String[] pieces = part.split(";q=");
          return new Offer(pieces[0], pieces.length == 2 ? Double.parseDouble(pieces[1]) : 1.0);
        })
        .filter(offer -> supported.contains(offer.mediaType()) && offer.quality() > 0)
        .sorted(Comparator.comparingDouble(Offer::quality).reversed()
            .thenComparingInt(offer -> supported.indexOf(offer.mediaType())))
        .map(Offer::mediaType)
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("406"));
  }
  public static void main(String[] args) {
    String selected = select("text/plain;q=0.5,application/json;q=0.9");
    int unsupported;
    try { select("application/xml"); unsupported = 200; }
    catch (IllegalArgumentException expected) { unsupported = 406; }
    System.out.println("selected=" + selected);
    System.out.println("vary=Accept");
    System.out.println("unsupported-status=" + unsupported);
    System.out.println("wildcard-default=" + select("*/*"));
    System.out.println("server-preference=json-before-text");
  }
}`, "selected=application/json\nvary=Accept\nunsupported-status=406\nwildcard-default=application/json\nserver-preference=json-before-text", ["spring-content-negotiation", "spring-message-conversion", "spring-message-converter-config", "spring-http-message-converter", "spring-media-type", "rfc9110", "java-list", "java-comparator"])],
    diagnostics: [d("Accept가 다른데 같은 cached body가 오거나 unsupported type도 200 JSON으로 옵니다.", "negotiation policy와 Vary/cache key, 406/415 mapping을 명시하지 않았습니다.", ["request Accept/Content-Type", "handler produces/consumes", "selected converter/media", "Vary/cache response"], "supported media matrix, quality/tie default, 406/415와 exact Vary fields를 계약으로 고정합니다.", "Accept/Content-Type wildcard/q/unsupported와 cache replay matrix를 둡니다.")],
    expertNotes: ["예제 parser는 quoted parameters와 full RFC matching을 구현하지 않으므로 production에서는 Spring/HTTP parser를 사용합니다.", "vendor media type/version parameter를 쓰면 converter compatibility와 deprecation/consumer telemetry를 명시합니다."],
  },
  {
    id: "representation-charset-streaming",
    title: "Content-Type·charset·Content-Length와 streaming resource lifecycle을 정확히 맞춥니다",
    lead: "body bytes는 media type과 charset으로 해석되고 streaming은 response commit·client disconnect·resource close를 바꾸므로 String 작은 응답과 file/large stream을 같은 처리로 보지 않습니다.",
    explanations: [
      "원본은 explicit text/plain;charset=utf-8을 produces에 선언해 short text representation을 명확히 합니다. modern constants/config에서 media type과 charset behavior를 supported Spring version으로 확인합니다.",
      "JSON은 RFC/media type과 serializer가 Unicode bytes를 정의하며 임의 charset parameter를 붙이는 legacy behavior를 client와 검토합니다. text response는 encoding과 actual bytes가 일치해야 합니다.",
      "Content-Length는 encoded bytes 길이이지 Java String length가 아닙니다. container가 transfer framing을 처리하게 두고 body 변경 뒤 stale length를 수동 유지하지 않습니다.",
      "Resource/InputStream streaming은 stream을 lazy acquire하고 success, converter failure와 client disconnect에서 close해야 합니다. controller가 이미 닫은 stream handle을 return하지 않습니다.",
      "large collection JSON을 한 object graph로 만들면 heap/latency가 증가합니다. pagination, NDJSON/SSE/streaming 중 client/error semantics에 맞는 protocol과 backpressure/disconnect handling을 선택합니다.",
    ],
    concepts: [
      c("representation metadata", "Content-Type, encoding, length 등 body bytes를 해석하는 HTTP fields입니다.", ["actual bytes와 일치해야 합니다.", "negotiation 결과입니다."]),
      c("response commit", "status/headers가 전송되어 더 이상 안전하게 변경하기 어려운 response lifecycle 지점입니다.", ["streaming에서 빠릅니다.", "error contract에 영향 줍니다."]),
      c("stream ownership", "InputStream/resource를 누가 언제 열고 write 완료/실패/disconnect에 닫는지에 대한 책임입니다.", ["lazy acquisition을 고려합니다.", "leak test를 둡니다."]),
    ],
    diagnostics: [d("한글 text가 깨지거나 다운로드가 truncated되고 stream/resource가 남습니다.", "declared charset/Content-Length가 actual bytes와 다르거나 stream open/close owner가 모호합니다.", ["selected converter/charset", "actual byte length", "commit/write events", "stream close on success/failure/disconnect"], "converter가 consistent representation metadata를 생성하게 하고 lazy resource handle과 try/final completion lifecycle을 사용합니다.", "Unicode byte contract, partial write/client abort와 resource-zero tests를 둡니다.")],
    expertNotes: ["streaming 중 exception은 이미 200 headers가 나간 뒤라 Problem Details로 바꿀 수 없을 수 있어 protocol-level trailer/abort/retry를 설계합니다.", "compression이 있으면 Content-Length/ETag variant와 Vary: Accept-Encoding을 edge 포함해 검증합니다."],
  },
  {
    id: "http-cache-validators",
    title: "Cache-Control·ETag·Last-Modified·304를 representation version과 privacy에 맞춥니다",
    lead: "GET response caching은 성능을 높이지만 user-specific body가 shared cache에 섞이거나 Accept variant가 잘못 재사용되면 data leak가 되므로 freshness·validator·Vary를 resource/representation 단위로 설계합니다.",
    explanations: [
      "Cache-Control max-age는 freshness lifetime, no-cache는 재사용 전 validation 요구, no-store는 저장 금지입니다. 이름만 보고 no-cache를 no-store로 오해하지 않습니다.",
      "ETag는 selected representation version의 opaque validator이며 If-None-Match와 일치하면 GET/HEAD에 304로 body 없이 metadata를 갱신할 수 있습니다. user input을 그대로 ETag에 넣거나 internal version/secret을 노출하지 않습니다.",
      "strong/weak validator는 byte-equivalence와 semantic equivalence 의미가 다릅니다. compression/media/locale variant마다 validator와 Vary key가 일관적인지 검증합니다.",
      "authenticated/private response는 user authorization과 cache topology를 고려해 private/no-store를 선택합니다. shared cache key에 Authorization/user identity가 빠진 상태로 public freshness를 주지 않습니다.",
      "unsafe mutation 성공은 related cached resources를 invalidate하거나 version을 바꿉니다. CDN/browser/application cache가 다른 TTL을 가질 때 purge/revalidation과 eventual consistency를 운영합니다.",
    ],
    concepts: [
      c("ETag", "selected representation version을 나타내는 opaque HTTP validator입니다.", ["If-None-Match와 사용합니다.", "민감 내부 id를 노출하지 않습니다."]),
      c("304 Not Modified", "conditional GET/HEAD에서 cached representation이 여전히 valid함을 body 없이 알리는 status입니다.", ["validator metadata를 포함합니다.", "일반 empty 200과 다릅니다."]),
      c("Cache-Control", "cache storage, freshness와 revalidation behavior를 지시하는 HTTP field입니다.", ["no-cache와 no-store를 구분합니다.", "private/shared를 검토합니다."]),
    ],
    codeExamples: [java("mvc08-conditional-cache", "ETag conditional GET과 private no-store", "Mvc08ConditionalCache.java", "same ETag에서 304 empty body를 만들고 public freshness와 authenticated no-store 정책을 분리합니다.", String.raw`import java.util.Optional;

public class Mvc08ConditionalCache {
  record Response(int status, String etag, Optional<String> body, String cacheControl) {}
  static Response get(String ifNoneMatch) {
    String etag = "\"item-v3\"";
    if (etag.equals(ifNoneMatch)) return new Response(304, etag, Optional.empty(), "public,max-age=60");
    return new Response(200, etag, Optional.of("item"), "public,max-age=60");
  }
  public static void main(String[] args) {
    Response fresh = get("");
    Response notModified = get("\"item-v3\"");
    System.out.println("fresh-status=" + fresh.status());
    System.out.println("fresh-body=" + fresh.body().isPresent());
    System.out.println("conditional-status=" + notModified.status());
    System.out.println("conditional-body=" + notModified.body().isPresent());
    System.out.println("etag-preserved=" + fresh.etag().equals(notModified.etag()));
    System.out.println("cache-control=" + fresh.cacheControl());
    System.out.println("authenticated-cache=no-store");
  }
}`, "fresh-status=200\nfresh-body=true\nconditional-status=304\nconditional-body=false\netag-preserved=true\ncache-control=public,max-age=60\nauthenticated-cache=no-store", ["spring-cache-control", "spring-http-headers", "rfc9110", "rfc9111", "java-optional"])],
    diagnostics: [d("다른 사용자의 JSON이 cache hit로 보이거나 conditional GET이 304와 body를 함께 보냅니다.", "authorization/representation variants를 cache key/Vary/ETag에 반영하지 않고 status-body invariant를 위반했습니다.", ["cache topology/key", "Cache-Control/Vary", "ETag variant", "304 headers/body bytes"], "user-specific data는 private/no-store 또는 safe per-user key로 제한하고 representation별 validator와 304 no-body를 적용합니다.", "two-user shared-cache, Accept/encoding variants와 conditional response tests를 둡니다.")],
    expertNotes: ["ETag를 DB row version 그대로 공개할 때 information leakage/guessability가 acceptable한지 검토하고 opaque representation hash/version으로 분리합니다.", "cache purge 성공 response만 믿지 않고 edge readback와 maximum stale exposure를 SLO로 관리합니다."],
  },
  {
    id: "cors-origin-preflight-security",
    title: "CORS를 authentication이 아닌 browser response-sharing 정책으로 이해합니다",
    lead: "same-origin policy는 browser script가 cross-origin response를 읽는 것을 제한하고 CORS는 server가 특정 origins/methods/headers에 그 공유를 허용하는 protocol이므로 endpoint authorization과 CSRF를 대신하지 않습니다.",
    explanations: [
      "simple/actual request와 preflight OPTIONS가 있으며 Spring HandlerMapping은 configured CORS를 handler mapping과 결합해 처리할 수 있습니다. preflight 성공이 actual operation authorization 성공을 보장하지 않습니다.",
      "credentialed request에서 arbitrary origin reflection과 wildcard 조합을 피하고 exact scheme/host/port allowlist를 사용합니다. suffix string match 대신 parsed canonical origin을 비교합니다.",
      "Origin은 browser security signal이지만 non-browser client가 spoof할 수 있습니다. resource access control은 authenticated principal, object ownership과 domain permission을 항상 enforce합니다.",
      "allowed methods/headers/exposed headers/max-age를 필요한 최소로 제한합니다. sensitive response headers를 expose하지 않고 preflight cache 변경의 rollout/rollback 시간을 고려합니다.",
      "origin에 따라 response가 달라지면 Vary: Origin 등 cache correctness를 확인합니다. CDN이 one origin의 Access-Control-Allow-Origin을 다른 origin에 재사용하지 않게 edge test합니다.",
    ],
    concepts: [
      c("origin", "scheme, host와 port tuple로 정의되는 browser security boundary입니다.", ["path는 포함하지 않습니다.", "canonical parsed 값으로 비교합니다."]),
      c("CORS preflight", "browser가 non-simple cross-origin request 전에 OPTIONS로 method/headers 허용을 확인하는 protocol request입니다.", ["actual authorization과 다릅니다.", "cache될 수 있습니다."]),
      c("Access-Control-Allow-Origin", "어떤 requesting origin이 browser script로 response를 공유받을 수 있는지 나타내는 response field입니다.", ["exact allowlist를 우선합니다.", "Vary를 검토합니다."]),
    ],
    diagnostics: [d("credentialed API가 request Origin을 그대로 반사해 어떤 site에서도 읽히거나 CDN이 wrong allow-origin을 반환합니다.", "canonical origin allowlist와 Vary/cache policy 없이 dynamic reflection했습니다.", ["allowedOrigins/patterns", "allowCredentials", "Origin canonicalization", "Vary/CDN key"], "필요한 exact origins만 allowlist하고 credentials/methods/headers를 최소화하며 Vary: Origin과 edge behavior를 검증합니다.", "trusted/untrusted/null/lookalike origins, preflight/actual와 shared-cache tests를 둡니다.")],
    expertNotes: ["CORS reject가 browser reading을 막아도 server가 state change를 이미 수행하지 않게 CSRF/authorization과 actual handler order를 검증합니다.", "development localhost wildcard를 production configuration과 분리하고 broad pattern exception에 owner/expiry를 둡니다."],
  },
  {
    id: "problem-details-error-contract",
    title: "실패를 status와 RFC 9457 public Problem Details로 normalize합니다",
    lead: "stack trace·exception message·SQL을 body에 내보내지 않고 type/title/status/detail/instance와 stable extensions의 allowlist로 client가 행동할 수 있는 오류 계약을 제공합니다.",
    explanations: [
      "Problem Details는 implementation debugging dump가 아니라 HTTP interface 문제 표현입니다. type URI는 문서화되고 stable하며 status는 actual HTTP status와 일치해야 합니다.",
      "detail은 이 occurrence를 이해하는 safe public 설명이고 localization 가능하지만 client가 parsing할 stable machine code/path는 extension schema로 분리합니다. rejected value와 internal class를 포함하지 않습니다.",
      "instance/request correlation을 client에 제공할 때 global trace/session/user id를 그대로 노출하지 않고 public incident reference를 별도 생성합니다. server logs와 최소 권한으로 mapping합니다.",
      "error representation도 Accept negotiation 대상이며 application/problem+json 같은 media type과 406/serialization failure fallback을 test합니다. error handler가 다시 실패하는 loop를 막습니다.",
      "같은 domain outcome이 HTML view와 REST problem으로 표현될 수 있지만 authorization/status/stable code 의미는 공유하고 display-specific fields/escaping만 adapter가 담당합니다.",
    ],
    concepts: [
      c("Problem Details", "HTTP API 오류를 type, title, status, detail, instance와 extensions로 표현하는 RFC 9457 object입니다.", ["debug dump가 아닙니다.", "status와 일치합니다."]),
      c("problem type", "특정 오류 class의 semantics와 해결 방법을 문서화하는 stable URI identifier입니다.", ["client behavior와 연결됩니다.", "version/retirement를 관리합니다."]),
      c("public error code", "client가 branching/localization에 사용할 bounded stable extension 값입니다.", ["exception class/message와 분리합니다.", "registry를 관리합니다."]),
    ],
    diagnostics: [d("API 오류 body에 stack trace/SQL/class name이 나오거나 status=200인데 problem.status=400입니다.", "framework exception object를 직접 serialize하고 HTTP/public error normalization invariant가 없습니다.", ["actual status/body", "problem fields/extensions", "exception serialization", "logs/public correlation"], "allowlisted Problem DTO와 central mapping registry를 사용해 actual status 일치, stable code와 safe detail만 반환합니다.", "exception corpus의 zero-internal-leak, status/media/schema contract tests를 둡니다.")],
    expertNotes: ["about:blank은 status 이상 semantics가 없을 때 사용하고 domain-specific recovery가 필요하면 documented type URI를 정의합니다.", "problem type URI availability가 runtime error response 생성의 blocking remote dependency가 되지 않게 static stable documentation으로 운영합니다."],
  },
  {
    id: "cors-problem-executable-contract",
    title: "CORS reject와 public error schema를 actual status·headers·body로 함께 검증합니다",
    lead: "security policy는 annotation 존재가 아니라 trusted origin preflight response와 untrusted origin rejection이 cache-safe headers, stable public problem과 internal leak zero로 관찰되는지로 증명합니다.",
    explanations: [
      "allowed preflight는 configured origin/method/header에 필요한 allow fields만 반환하고 credentials false/true를 policy에 맞게 표시합니다. simple actual request도 같은 origin policy와 endpoint authorization을 적용합니다.",
      "rejected preflight/body의 exact status와 CORS headers는 browser가 body를 노출하지 않을 수 있으므로 client UX가 error body만 의존하지 않게 합니다. server telemetry에는 stable reject reason을 남깁니다.",
      "lookalike subdomain, mixed-case host, default port, punycode와 null/file origins을 parsed canonical test corpus로 다룹니다. suffix/contains comparison을 사용하지 않습니다.",
      "problem detail에는 submitted origin 전체를 echo하지 않고 category와 documentation type만 제공합니다. allowlist와 internal exception/config를 공개하지 않습니다.",
      "MockMvc는 status/headers/body를 확인하고 real browser는 Fetch가 response를 읽거나 차단하는지를 확인하며 CDN test는 Vary: Origin을 검증합니다.",
    ],
    concepts: [
      c("CORS contract test", "origin/method/header/credential 조합별 preflight·actual status와 access-control fields를 검증하는 test입니다.", ["browser와 server 관측을 나눕니다.", "cache를 포함합니다."]),
      c("origin allowlist", "cross-origin response sharing을 허용한 canonical origins의 최소 집합입니다.", ["wildcard reflection을 피합니다.", "owner/expiry를 관리합니다."]),
      c("safe rejection", "요청을 처리/공유하지 않으면서 attacker input과 internal policy를 echo하지 않는 stable error 결과입니다.", ["bounded reason을 기록합니다.", "authorization을 계속 enforce합니다."]),
    ],
    codeExamples: [java("mvc08-cors-problem", "exact origin allowlist와 safe Problem rejection", "Mvc08CorsProblem.java", "trusted synthetic origin의 preflight와 untrusted origin의 403 public problem을 실행해 wildcard/internal detail이 없음을 확인합니다.", String.raw`import java.util.Set;

public class Mvc08CorsProblem {
  record Cors(int status, String allowOrigin, boolean credentials, String vary) {}
  record Problem(int status, String code, boolean internalMessageIncluded) {}
  static Cors preflight(String origin, String method, Set<String> allowedOrigins) {
    if (!allowedOrigins.contains(origin) || !method.equals("GET")) {
      return new Cors(403, "none", false, "Origin");
    }
    return new Cors(204, origin, false, "Origin");
  }
  public static void main(String[] args) {
    Set<String> allowed = Set.of("https://ui.example");
    Cors accepted = preflight("https://ui.example", "GET", allowed);
    Cors rejected = preflight("https://lookalike.example", "GET", allowed);
    Problem problem = new Problem(rejected.status(), "origin_denied", false);
    System.out.println("allowed-status=" + accepted.status());
    System.out.println("allow-origin=" + accepted.allowOrigin());
    System.out.println("credentials=" + accepted.credentials());
    System.out.println("rejected-status=" + rejected.status());
    System.out.println("problem-code=" + problem.code());
    System.out.println("internal-message=" + problem.internalMessageIncluded());
    System.out.println("vary=" + accepted.vary());
  }
}`, "allowed-status=204\nallow-origin=https://ui.example\ncredentials=false\nrejected-status=403\nproblem-code=origin_denied\ninternal-message=false\nvary=Origin", ["spring-cors", "fetch-cors", "spring-error-responses", "spring-problem-detail", "rfc9457", "owasp-rest", "spring-mockmvc", "java-set"])],
    diagnostics: [d("unit test는 allowlist를 통과하지만 browser는 차단하거나 rejected body가 내부 CORS config를 노출합니다.", "server function 결과만 보고 real Fetch/preflight/cache와 safe error serialization을 검증하지 않았습니다.", ["preflight network exchange", "actual access-control headers", "browser console/readability", "problem/log fields"], "MockMvc header/body test에 real-browser Fetch와 edge Vary test를 추가하고 rejection DTO를 allowlist합니다.", "trusted/lookalike/null origin, credentials와 internal-error canary를 배포 gate에 둡니다.")],
    expertNotes: ["example.invalid 대신 학습용 `.example` origin을 사용했지만 production allowlist는 configuration provenance와 review가 필요합니다.", "CORS error response 자체가 cross-origin으로 읽히지 않을 수 있으므로 client는 network error UX를 제공해야 합니다."],
  },
  {
    id: "async-streaming-disconnect",
    title: "async·streaming response의 timeout·disconnect·backpressure·resource cleanup을 설계합니다",
    lead: "large/slow body를 async나 streaming으로 보내면 controller thread 반환과 operation 완료가 달라지고 response가 commit된 뒤 실패할 수 있어 normal ResponseEntity error mapping만으로 충분하지 않습니다.",
    explanations: [
      "Callable/DeferredResult/streaming types는 Servlet async lifecycle, timeout와 dispatch를 사용합니다. request context/security/MDC를 다른 thread에 암묵 전달하지 않고 explicit context와 cleanup을 적용합니다.",
      "client disconnect는 write exception/cancellation로 나타날 수 있고 backend query/producer를 취소하지 않으면 wasted work/resource가 남습니다. cancellation을 domain operation까지 전달할 수 있는지와 non-cancellable commit을 구분합니다.",
      "streaming JSON array는 middle failure에서 invalid document가 될 수 있습니다. pagination, NDJSON, SSE와 file range 중 recovery/resume/error framing 요구에 맞는 representation을 선택합니다.",
      "producer가 consumer/network보다 빠르면 bounded buffer/backpressure가 필요합니다. unbounded queue로 전체 dataset을 heap에 저장하지 않고 max items/bytes/time을 enforce합니다.",
      "partial response에는 stack trace/problem JSON을 덧붙이지 않습니다. connection abort/trailer/protocol event와 request id를 관측하고 client retry가 mutation을 중복하지 않도록 idempotency를 적용합니다.",
    ],
    concepts: [
      c("async response", "Servlet request thread 밖에서 결과를 완료하고 다시 dispatch/write할 수 있는 response lifecycle입니다.", ["timeout/cancellation이 있습니다.", "context propagation을 관리합니다."]),
      c("backpressure", "consumer 처리 속도에 맞춰 producer emission/buffer를 제한하는 flow control입니다.", ["bounded memory를 유지합니다.", "protocol 지원을 확인합니다."]),
      c("partial commit", "status/headers와 body 일부가 전송된 뒤 failure가 발생해 정상 error response로 교체할 수 없는 상태입니다.", ["protocol-specific recovery가 필요합니다.", "internal detail을 덧붙이지 않습니다."]),
    ],
    diagnostics: [d("client 취소 뒤에도 DB/stream task가 돌고 heap/threads가 증가하거나 partial JSON 뒤 stack trace가 붙습니다.", "disconnect cancellation, bounded buffer와 committed-response failure policy가 없습니다.", ["async lifecycle callbacks", "client disconnect/write errors", "producer cancellation", "buffer/resource/thread counts"], "cancellation-aware producer와 bounded buffers를 사용하고 commit 후 failure는 connection/protocol event로 종료하며 resources를 close합니다.", "slow client, abort, timeout, mid-stream serializer error와 zero-resource stress tests를 둡니다.")],
    expertNotes: ["virtual threads도 network backpressure와 resource pool cardinality를 없애지 않으므로 concurrency budgets를 유지합니다.", "streaming endpoint observability에서 item payload를 sample/log하지 않고 count/bytes/duration/outcome만 기록합니다."],
  },
  {
    id: "response-testing-observability-security",
    title: "status·headers·wire bytes·cache/CORS를 계층별 test하고 privacy-safe하게 관측합니다",
    lead: "controller method return object assertion만으로 converter bytes, proxy headers, browser CORS/cache와 serialization failure를 알 수 없으므로 unit→MockMvc→server/edge→browser/consumer test를 연결합니다.",
    explanations: [
      "unit test는 domain outcome→ResponseEntity/problem mapping을 빠르게 확인하고 MockMvc는 selected media, status, headers와 exact JSON/text schema를 검증합니다. 실제 mapper/custom modules를 포함한 context를 사용합니다.",
      "real server test는 charset/streaming/commit/client abort와 container limits를 실행하고 edge test는 TLS, forwarded trust, compression, cache/CDN, CORS Vary와 security headers를 readback합니다.",
      "consumer contract test는 required/additive fields, enum unknown, error schema, retry/idempotency와 version deprecation을 확인합니다. snapshot은 field order/whitespace가 아닌 semantic JSON과 exact required headers를 봅니다.",
      "telemetry는 route/version, status family+bounded exact codes, media type, converter logical id, response-size/duration bucket, cache/CORS/outcome category를 기록합니다. body, Authorization/Cookie, query PII와 arbitrary header는 수집하지 않습니다.",
      "cardinality/size/time budgets는 huge JSON, error fan-out, Accept explosion, header count와 CORS configuration을 제한합니다. failure에서도 metrics/log serialization이 response를 두 번 실패시키지 않게 합니다.",
    ],
    concepts: [
      c("wire contract test", "HTTP client가 보는 status, selected fields, content type와 serialized body schema를 검증하는 test입니다.", ["converter를 포함합니다.", "success/error를 함께 봅니다."]),
      c("edge readback", "reverse proxy/CDN/TLS를 거친 실제 response의 headers, cache와 body metadata를 확인하는 검증입니다.", ["application result와 비교합니다.", "민감 fields를 저장하지 않습니다."]),
      c("bounded response telemetry", "route/status/media/size/duration/cache/CORS처럼 제한된 non-sensitive dimensions만 기록하는 관측입니다.", ["body/header dump를 피합니다.", "SLO와 연결합니다."]),
    ],
    diagnostics: [d("MockMvc는 통과하지만 CDN/browser에서 wrong media/cache/CORS가 나거나 logs에 body/Authorization이 남습니다.", "application context test만 있고 edge/browser readback과 telemetry allowlist가 없습니다.", ["MockMvc wire result", "edge transformed headers", "browser cache/CORS", "APM/log capture fields"], "server/edge/browser contract stages를 추가하고 response observability를 bounded allowlist schema로 제한합니다.", "two-user cache, trusted/untrusted origin, Unicode/abort와 credential-shaped zero-leak tests를 둡니다.")],
    expertNotes: ["status=200 비율보다 semantic outcome, 4xx client-correctable, 5xx root category와 degraded/cache behavior를 분리합니다.", "body size histogram은 payload를 보지 않고도 serialization/load regressions를 탐지할 수 있습니다."],
  },
  {
    id: "legacy-api-migration-governance",
    title: "plain text·legacy controller를 versioned ResponseEntity API로 단계적으로 migration합니다",
    lead: "짧은 @RestController text example에서 JSON/status/header/error contract로 발전할 때 기존 client, charset, path, cache와 failure behavior를 baseline하고 compatibility window와 rollback을 운영해야 합니다.",
    explanations: [
      "먼저 current endpoint의 method/path, status, Content-Type/charset, exact body, cache/CORS/security headers와 consumers를 capture합니다. 원본 one text endpoint를 더 큰 REST architecture 증거로 과장하지 않습니다.",
      "new response DTO와 stable status/problem schemas를 version하거나 additive하게 도입합니다. Accept/vendor media/path version 중 하나를 선택하고 unsupported/deprecation behavior를 문서화합니다.",
      "String→JSON 전환은 Content-Type과 body shape breaking change입니다. dual representation negotiation 또는 new route/version을 두고 consumers가 media type을 확인하도록 migration합니다.",
      "global converter/security/cache/CORS 설정 변경은 모든 body endpoint에 blast radius가 있습니다. registered converter/route response manifest diff와 representative contract corpus로 canary 범위를 잡습니다.",
      "old representation 제거 전 consumer Accept/path usage, cache/CDN entries, docs/SDK/webhooks와 rollback artifact를 확인합니다. max cache TTL+usage zero 뒤 converter/media/version을 retire합니다.",
    ],
    concepts: [
      c("response manifest", "route별 method/status/media/schema/cache/CORS/security/converter version을 기록한 배포 evidence입니다.", ["body values를 제외합니다.", "old/new diff에 씁니다."]),
      c("representation migration", "같은 resource의 text/JSON/versioned wire schema를 compatibility 기간 동안 전환하는 과정입니다.", ["content negotiation을 사용할 수 있습니다.", "cache/consumers를 포함합니다."]),
      c("consumer retirement", "old media/path/schema를 사용하는 known clients와 cached artifacts가 0임을 증명한 뒤 제거하는 단계입니다.", ["telemetry와 TTL을 봅니다.", "rollback window를 닫습니다."]),
    ],
    diagnostics: [d("text를 JSON으로 바꾸자 old client가 parse 실패하거나 cache가 두 representation을 섞습니다.", "Content-Type/body schema breaking change와 Accept/Vary/cache TTL을 migration plan에 포함하지 않았습니다.", ["consumer Accept/parser", "old/new media routes", "Vary/cache entries", "deprecation usage"], "dual media/new version과 exact Vary를 제공하고 usage zero+max cache TTL 뒤 old representation을 제거합니다.", "old/new consumers, cache replay와 rollback contract tests를 gate로 둡니다.")],
    expertNotes: ["API maturity를 ResponseEntity 사용 횟수로 보지 말고 semantic status/schema/security/cache/operability evidence로 측정합니다.", "unknown consumers가 있는 public API는 removal보다 explicit long-lived version compatibility가 더 안전할 수 있습니다."],
  },
  {
    id: "response-operations-governance",
    title: "response contract를 schema registry·배포 diff·incident·retirement로 운영합니다",
    lead: "status·headers·media·body schema는 application과 clients/caches/browsers 사이의 public protocol이므로 code review를 넘어 machine-readable inventory와 runtime readback이 필요합니다.",
    explanations: [
      "route response registry에는 method/path logical id, success/error statuses, media types/schema versions, required headers, cache/Vary, CORS/security, converter와 ownership을 둡니다. actual body/example credential은 제외합니다.",
      "CI diff는 removed/required field, enum narrowing, status/media/header/cache/CORS change와 converter order를 breaking/risky/additive로 분류합니다. generated OpenAPI만 믿지 않고 actual MockMvc/server wire와 비교합니다.",
      "deployment canary는 status/media/schema, serialization errors, size/latency, conditional cache, CORS and Problem parity를 old/new generation에서 비교합니다. rollback 뒤 CDN/cache와 converter config도 되돌립니다.",
      "incident runbook은 handler mapping, converter/serialization, negotiation, invalid status/header, cache poisoning/leak, CORS, streaming partial commit와 error-handler failure를 분리합니다. raw payload 수집 전 privacy/authority를 확인합니다.",
      "retirement은 clients, SDK/docs, cached variants, webhooks, async jobs와 rollback artifact를 포함합니다. usage zero, max TTL와 error-rate readback 뒤 old media/schema/status exception을 제거합니다.",
    ],
    concepts: [
      c("response registry", "route별 status·media·schema·headers·cache·CORS·converter와 owner를 기록한 protocol catalog입니다.", ["CI/operations가 공유합니다.", "민감값을 제외합니다."]),
      c("contract diff", "old/new response registry와 actual wire 결과의 compatibility 변화를 분류하는 검증입니다.", ["status/header도 포함합니다.", "consumer 영향에 연결합니다."]),
      c("response generation", "함께 배포되어 호환되는 controller mapping, DTO/schema, converters, cache/CORS/security와 edge config version입니다.", ["canary/rollback 단위입니다.", "mixed generation을 감시합니다."]),
    ],
    diagnostics: [d("장애 response가 어느 converter/cache/CORS generation에서 만들어졌는지 모르고 rollback 후 CDN이 old/new를 섞습니다.", "application과 edge를 아우르는 response registry/generation/readback이 없습니다.", ["deployed registry", "converter/config generation", "edge cache/Vary", "actual wire canary"], "controller부터 edge까지 한 response generation manifest로 묶고 deploy/rollback 후 representative wire/cache/CORS readback을 실행합니다.", "contract diff approval과 post-rollback cache purge/generation audit를 자동화합니다.")],
    expertNotes: ["response registry는 실제 runtime behavior와 drift할 수 있어 generated spec, context introspection과 black-box wire test를 삼각 검증합니다.", "HTTP contract owner는 controller team만 아니라 security, edge/cache와 consumer teams의 변경 승인 경계를 포함합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-rest-controller", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/controller/RestBasicController.java", usedFor: ["RestController, single GetMapping, explicit text/plain UTF-8 and String body progression"], evidence: "read-only scan으로 13 lines, RestController/GetMapping, one method/return과 produces media declaration을 확인했습니다. credential, endpoint secret과 개인값은 없었습니다." },
  { id: "spring-response-body", repository: "Spring Framework Reference", path: "@ResponseBody", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html", usedFor: ["body return-value handling and RestController semantics"], evidence: "Spring 공식 ResponseBody reference입니다." },
  { id: "spring-response-entity-reference", repository: "Spring Framework Reference", path: "ResponseEntity", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html", usedFor: ["status, headers and body controller returns"], evidence: "Spring 공식 ResponseEntity reference입니다." },
  { id: "spring-message-conversion", repository: "Spring Framework Reference", path: "HTTP Message Conversion", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html", usedFor: ["type/media converter implementations and body writing"], evidence: "Spring 공식 HTTP message conversion reference입니다." },
  { id: "spring-message-converter-config", repository: "Spring Framework Reference", path: "Message Converters", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/message-converters.html", usedFor: ["registered converter customization"], evidence: "Spring 공식 MVC converter configuration reference입니다." },
  { id: "spring-content-negotiation", repository: "Spring Framework Reference", path: "Content Types", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/content-negotiation.html", usedFor: ["Accept strategy and path-extension guidance"], evidence: "Spring 공식 content negotiation reference입니다." },
  { id: "spring-cors", repository: "Spring Framework Reference", path: "CORS", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html", usedFor: ["preflight/actual processing, credentials and origin configuration"], evidence: "Spring 공식 MVC CORS reference입니다." },
  { id: "spring-error-responses", repository: "Spring Framework Reference", path: "Error Responses", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["Problem Details and error response customization"], evidence: "Spring 공식 MVC error responses reference입니다." },
  { id: "spring-response-body-api", repository: "Spring Framework Javadoc", path: "ResponseBody", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ResponseBody.html", usedFor: ["method/type response body annotation"], evidence: "Spring 공식 ResponseBody API입니다." },
  { id: "spring-rest-controller-api", repository: "Spring Framework Javadoc", path: "RestController", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestController.html", usedFor: ["Controller and ResponseBody composed annotation"], evidence: "Spring 공식 RestController API입니다." },
  { id: "spring-response-entity-api", repository: "Spring Framework Javadoc", path: "ResponseEntity", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ResponseEntity.html", usedFor: ["builders, status, headers and body API"], evidence: "Spring 공식 ResponseEntity API입니다." },
  { id: "spring-http-headers", repository: "Spring Framework Javadoc", path: "HttpHeaders", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/HttpHeaders.html", usedFor: ["multi-value typed HTTP fields"], evidence: "Spring 공식 HttpHeaders API입니다." },
  { id: "spring-http-status-code", repository: "Spring Framework Javadoc", path: "HttpStatusCode", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/HttpStatusCode.html", usedFor: ["HTTP status abstraction"], evidence: "Spring 공식 HttpStatusCode API입니다." },
  { id: "spring-media-type", repository: "Spring Framework Javadoc", path: "MediaType", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/MediaType.html", usedFor: ["media range parsing and compatibility"], evidence: "Spring 공식 MediaType API입니다." },
  { id: "spring-http-message-converter", repository: "Spring Framework Javadoc", path: "HttpMessageConverter", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/converter/HttpMessageConverter.html", usedFor: ["canRead/canWrite and body conversion contract"], evidence: "Spring 공식 HttpMessageConverter API입니다." },
  { id: "spring-cache-control", repository: "Spring Framework Javadoc", path: "CacheControl", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/CacheControl.html", usedFor: ["typed Cache-Control construction"], evidence: "Spring 공식 CacheControl API입니다." },
  { id: "spring-problem-detail", repository: "Spring Framework Javadoc", path: "ProblemDetail", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ProblemDetail.html", usedFor: ["RFC 9457 problem representation"], evidence: "Spring 공식 ProblemDetail API입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework Reference", path: "MockMvc", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc.html", usedFor: ["status, headers, content, CORS and error tests"], evidence: "Spring 공식 MockMvc reference입니다." },
  { id: "jakarta-http-response", repository: "Jakarta Servlet API", path: "HttpServletResponse", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletresponse", usedFor: ["status/header/body commit and URL encoding lifecycle"], evidence: "Jakarta EE 공식 HttpServletResponse API입니다." },
  { id: "rfc9110", repository: "RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["status codes, fields, content negotiation, validators and Vary"], evidence: "IETF/RFC Editor 공식 HTTP semantics standard입니다." },
  { id: "rfc9111", repository: "RFC Editor", path: "RFC 9111 HTTP Caching", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["cache storage, freshness, validation and sensitive information"], evidence: "IETF/RFC Editor 공식 HTTP caching standard입니다." },
  { id: "rfc9457", repository: "RFC Editor", path: "RFC 9457 Problem Details", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["problem fields, type definitions and security considerations"], evidence: "IETF/RFC Editor 공식 Problem Details standard입니다." },
  { id: "fetch-cors", repository: "WHATWG Fetch Standard", path: "HTTP CORS protocol", publicUrl: "https://fetch.spec.whatwg.org/#http-cors-protocol", usedFor: ["browser CORS preflight and response sharing"], evidence: "WHATWG 공식 Fetch living standard CORS section입니다." },
  { id: "owasp-rest", repository: "OWASP Cheat Sheet Series", path: "REST Security", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html", usedFor: ["status, content type, security headers, CORS and error exposure"], evidence: "OWASP 공식 REST security guidance입니다." },
  { id: "owasp-http-headers", repository: "OWASP Cheat Sheet Series", path: "HTTP Headers", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html", usedFor: ["browser response security headers and CORS field guidance"], evidence: "OWASP 공식 HTTP security headers guidance입니다." },
  { id: "java-uri", repository: "Java SE 21 API", path: "URI", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html", usedFor: ["typed Location and origin URI boundaries"], evidence: "Oracle JDK 공식 URI API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["immutable teaching response headers"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-linked-hash-map", repository: "Java SE 21 API", path: "LinkedHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html", usedFor: ["deterministic header construction example"], evidence: "Oracle JDK 공식 LinkedHashMap API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["media offers and server preference"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-comparator", repository: "Java SE 21 API", path: "Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["quality and server preference ordering"], evidence: "Oracle JDK 공식 Comparator API입니다." },
  { id: "java-optional", repository: "Java SE 21 API", path: "Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["conditional response body presence"], evidence: "Oracle JDK 공식 Optional API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["exact CORS origin allowlist example"], evidence: "Oracle JDK 공식 Set API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-08-responsebody-status-headers", slug: "mvc-08-responsebody-status-headers", courseId: "spring", moduleId: "spring-mvc-request-response", order: 8,
  title: "@ResponseBody, ResponseEntity와 상태·헤더 제어", subtitle: "body/view 분기에서 converter·status·headers·negotiation·cache·CORS·Problem Details·streaming과 response contract 운영까지 검증합니다.", level: "전문가", estimatedMinutes: 1120,
  coreQuestion: "Controller 결과를 정확한 status·headers·media·body bytes로 만들고 negotiation/cache/CORS/security/error/streaming을 client·browser·proxy에서도 일관되게 유지하려면 어떤 계약과 evidence가 필요할까요?",
  summary: "SpringBasic RestBasicController를 read-only로 확인해 RestController, one GetMapping, one String return과 explicit text/plain UTF-8 produces progression을 사용했습니다. 이 작은 source를 JSON/ResponseEntity/security architecture가 이미 존재한 것처럼 과장하지 않고 current Spring/Jakarta/HTTP/Fetch/OWASP/JDK official sources와 synthetic examples로 확장합니다. ResponseBody vs logical view, return-value handler와 message converter/schema, ResponseEntity status/header/body invariant, semantic status registry, header/proxy trust, Accept/Content-Type negotiation와 406/415/Vary, charset/streaming lifecycle, Cache-Control/ETag/304/privacy, CORS preflight/credentials/cache, RFC 9457 public errors, async/backpressure/disconnect, layered wire/edge/browser tests, representation migration과 operations governance를 초보부터 전문가 단계로 독립 설명합니다. 다섯 JDK 21 examples는 view/body classification, 201 response/header validation, quality negotiation, conditional cache와 CORS/problem rejection을 exact stdout으로 실행합니다.",
  objectives: ["일반 Controller String view와 ResponseBody/RestController body를 구분한다.", "HttpMessageConverter와 versioned response DTO wire schema를 고정한다.", "ResponseEntity status·headers·body invariants를 구성한다.", "domain outcomes를 semantic HTTP statuses와 retry policy로 mapping한다.", "HttpHeaders multi-value와 trusted proxy/header injection 경계를 검증한다.", "Accept/Content-Type/produces/consumes, 406/415와 Vary를 연결한다.", "charset, stream ownership, commit/disconnect/backpressure를 운영한다.", "Cache-Control·ETag·304와 authenticated privacy를 적용한다.", "CORS origin/preflight/credentials를 authorization·CSRF와 분리한다.", "RFC 9457 public error schema에서 internal/rejected values를 제거한다.", "wire→edge→browser tests와 response registry/migration을 증명한다."],
  prerequisites: [{ title: "redirect·flash attribute·session PRG 흐름", reason: "새 request, session/cookie, 3xx status와 headers를 알아야 body response의 status·cache·CORS·error 계약을 redirect/view와 혼동하지 않습니다.", sessionSlug: "mvc-07-redirect-flash-session" }],
  keywords: ["@ResponseBody", "@RestController", "ResponseEntity", "HttpMessageConverter", "status code", "HttpHeaders", "Content-Type", "Accept", "content negotiation", "Vary", "ETag", "Cache-Control", "CORS", "Problem Details", "streaming"], topics,
  lab: {
    title: "plain text RestController를 production-grade versioned HTTP response contract로 확장",
    scenario: "legacy endpoint가 String body만 반환하고 client가 status/content type을 추측하며 JSON converter, cache, CORS, error, proxy와 streaming 설정 변경이 전체 API behavior를 흔들 수 있습니다.",
    setup: ["원본 RestBasicController는 read-only로 보존하고 annotations, mapping/produces/return shape와 hash만 기록합니다.", "JDK 21 exact examples, supported Spring/Jackson/Servlet baseline, MockMvc/real server/browser와 disposable edge cache fixture를 준비합니다.", "route별 outcomes→status, media/schema, required headers, cache/Vary, CORS/security와 error registry를 만듭니다.", "합성 values/origins만 사용하고 Authorization/Cookie/session, raw request/body/internal exception을 capture·출력하지 않습니다."],
    steps: ["view-return과 body-return controllers를 inventory하고 return-value handler contract를 고정합니다.", "response DTO/schema와 registered converters/mapper modules를 manifest로 만듭니다.", "success/validation/not-found/conflict/precondition/rate/server outcomes를 statuses/Problem types에 mapping합니다.", "ResponseEntity Location/headers/body invariants와 header/proxy trust corpus를 실행합니다.", "Accept/Content-Type quality/wildcard/unsupported matrix와 exact Vary/cache key를 검증합니다.", "Unicode charset, large/stream response, timeout/disconnect와 resource-zero를 실행합니다.", "public/private/no-store, ETag/If-None-Match/304와 two-user shared-cache를 test합니다.", "trusted/lookalike/null origins의 preflight/actual/credentials/authorization/CSRF를 browser/edge에서 검증합니다.", "error mapper/serializer failure에서 status/media/schema와 internal leak zero를 검사합니다.", "old/new representation consumers와 response generation을 canary·rollback하고 old media/cache를 retire합니다."],
    expectedResult: ["route마다 actual status·headers·media·wire schema가 response registry와 일치합니다.", "다섯 Java example stdout이 문서와 완전히 같습니다.", "unsupported media, wrong precondition/origin과 internal failure가 stable status/problem으로 처리됩니다.", "shared cache/CORS/proxy/streaming에서 cross-user leak, header injection와 resource leak가 없습니다.", "body/log/metric/test artifact에 credentials, raw payload와 internal stack/SQL/class names가 없습니다."],
    cleanup: ["disposable server/edge/browser cache, converter profiles, schemas, captures와 synthetic origin fixtures를 제거합니다.", "streams/executors, conditional cache entries와 old response generations를 close/purge합니다.", "active old converter/cache/resource/thread와 credential-shaped canary가 0인지 확인합니다.", "원본 RestBasicController.java는 변경하지 않습니다."],
    extensions: ["OpenAPI/JSON Schema와 actual wire response registry drift checker를 만듭니다.", "Accept/header/CORS/cache/property-based fuzz corpus를 확장합니다.", "slow-client/abort/mid-stream serialization chaos와 SLO를 자동화합니다.", "consumer-driven contract와 CDN cache-key/CORS canary를 release pipeline에 통합합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 body/view→ResponseEntity→negotiation→cache→CORS/problem 흐름을 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "String view와 body의 resolver 사용 차이를 설명합니다.", "201 Location와 CR/LF 거부를 확인합니다.", "q값과 406/wildcard default를 설명합니다.", "304 body가 없고 ETag가 유지됨을 확인합니다.", "exact origin만 허용되고 rejection에 internal message가 없음을 확인합니다."], hints: ["body JSON만 보지 말고 status와 모든 의미 있는 headers를 같은 response 행에 적으세요."], expectedOutcome: "controller return부터 browser/cache가 해석하는 complete HTTP response를 설명합니다.", solutionOutline: ["classify→convert→construct→negotiate→validate/cache/share safely 순서입니다."] },
    { difficulty: "응용", prompt: "원본 text endpoint를 versioned JSON/ResponseEntity API로 migration하세요.", requirements: ["원본 exact text contract를 baseline합니다.", "response DTO/converter manifest를 둡니다.", "semantic status와 RFC 9457 error registry를 만듭니다.", "typed headers/proxy trust를 검증합니다.", "Accept/Content-Type/406/415/Vary를 적용합니다.", "ETag/cache privacy와 CORS/CSRF를 test합니다.", "stream/disconnect/resource cleanup을 검증합니다.", "old/new consumer/cache canary와 rollback/retirement를 포함합니다."], hints: ["String에서 JSON으로 바꾸는 것은 body뿐 아니라 Content-Type과 client parser가 바뀌는 breaking change입니다."], expectedOutcome: "client·browser·proxy/cache에서 일관되고 보안·복구 가능한 response contract가 완성됩니다.", solutionOutline: ["baseline→schema/status→converter/header→cache/CORS/error→qualify→migrate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC HTTP response 표준을 작성하세요.", requirements: ["view/body/async return rules를 정의합니다.", "DTO/converter/schema/version 정책을 둡니다.", "status/header/Location/retry invariants를 정의합니다.", "negotiation/406/415/Vary를 둡니다.", "cache/ETag/privacy와 CORS/authorization/CSRF를 분리합니다.", "Problem Details/internal leak policy를 둡니다.", "streaming/backpressure/cleanup을 정의합니다.", "wire/edge/browser tests, telemetry, registry, migration/retirement를 포함합니다."], hints: ["HTTP response를 Java object가 아니라 status line, fields와 bytes 전체로 review하세요."], expectedOutcome: "handler 성공부터 representation 폐기까지 적용 가능한 response governance가 완성됩니다.", solutionOutline: ["declare→select→serialize→protect/cache→observe→evolve→retire 순서입니다."] },
  ],
  nextSessions: ["mvc-09-exception-handling"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["RestBasicController.java는 13 lines, RestController/GetMapping annotations, one method/return과 explicit text/plain;charset=utf-8 produces가 확인됐습니다.", "원본은 short text body progression이며 ResponseEntity, JSON DTO/converter config, semantic status/headers, negotiation/cache/CORS/error/streaming을 포함하지 않아 해당 기능이 있었다고 과장하지 않았습니다.", "current official Spring/Jakarta/RFC/Fetch/OWASP/JDK sources와 synthetic executable examples로 body/view, converters, status/header, 406/415, cache, CORS, Problem Details, resource lifecycle와 migration을 보완했습니다.", "JDK examples는 actual Spring return-value handler/converter order, Jackson bytes, Servlet commit, browser CORS, proxy/CDN cache와 streaming disconnect를 대체하지 않습니다."] },
});

export default session;
