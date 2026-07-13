import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-13", explanation: "JDK 21 URI·record·set으로 browser가 비교하는 origin과 CORS/CSRF policy input을 명시적으로 모델링합니다." },
      { lines: "14-끝에서 6줄 전", explanation: "suffix 비교, wildcard credentials, preflight cache 누락, proxy 신뢰와 CSRF 혼동을 피하는 결정 규칙을 계산합니다." },
      { lines: "마지막 6줄", explanation: "허용·거부 이유와 policy evidence를 안정된 stdout으로 출력해 예상 결과와 정확히 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "browser·Spring·React·network·실제 cookie 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서의 예상 결과와 완전히 같아야 합니다.", "순수 Java policy model은 실제 browser Fetch CORS algorithm, Spring Security filter chain, reverse proxy와 cookie integration을 대체하지 않습니다."] },
    experiments: [
      { change: "scheme, host suffix, default/non-default port, method, requested header와 credentials를 하나씩 바꿉니다.", prediction: "exact tuple allowlist와 preflight decision의 허용·거부 이유가 달라집니다.", result: "실제 browser network panel과 server access/security logs에서 OPTIONS와 본 요청을 함께 확인합니다." },
      { change: "proxy trust, Vary 또는 CSRF token 검사를 제거합니다.", prediction: "spoofed origin, cache cross-contamination 또는 credentialed state-change 위험이 재현됩니다.", result: "gateway를 포함한 end-to-end negative tests와 cache isolation evidence로 차단을 확인합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-client-server-cors-audit",
    title: "원본 AppConfig와 React HTTP client를 양쪽에서 감사하고 추측과 실제 선언을 구분합니다",
    lead: "CORS는 client option 한 줄이나 server annotation 한 줄만 보면 진단할 수 없으므로 browser request, MVC/Security policy와 proxy response를 하나의 evidence chain으로 봅니다.",
    explanations: [
      "원본 AppConfig에는 password encoder bean만 있고 CorsRegistry, CorsConfigurationSource, @CrossOrigin 같은 CORS 선언은 없습니다. 따라서 이 파일이 origin을 허용한다고 말할 근거가 없으며 다른 security config, filter, gateway 또는 deployment platform의 policy를 추가로 조사해야 합니다.",
      "원본 React Http.jsx는 환경에서 base URL을 읽는 Axios instance, JSON Content-Type과 withCredentials: true를 설정합니다. 실제 환경 변수 값이나 사설 domain은 학습자료에 복사하지 않고, credentials 요청 의도와 preflight 가능성만 source evidence로 사용합니다.",
      "withCredentials는 server가 CORS를 허용하게 만드는 스위치가 아닙니다. browser가 cross-origin request에 credentials를 포함하고 credentialed response를 노출할 수 있게 하는 client-side mode이며 server는 exact origin과 Access-Control-Allow-Credentials를 별도로 승인해야 합니다.",
      "진단 시 browser console 문구만 복사하지 말고 request URL/method/origin, OPTIONS request/response, 본 요청 전송 여부, response headers, cookie attributes, Security filter logs와 proxy rewrite를 timestamp로 연결합니다.",
    ],
    concepts: [
      c("CORS evidence chain", "page origin부터 preflight, server/gateway policy와 final response까지 허용 결정에 참여한 관찰 증거의 연결입니다.", ["console 한 줄보다 넓습니다.", "OPTIONS와 actual request를 구분합니다."]),
      c("withCredentials", "Axios/XHR가 cross-site request에서 credential mode를 사용하도록 요청하는 client 설정입니다.", ["server 허가를 대신하지 않습니다.", "cookie SameSite/Secure도 별도입니다."]),
      c("configuration absence", "감사한 파일에 특정 정책 선언이 없다는 사실이며 전체 system에 정책이 없다는 결론과는 다릅니다.", ["다른 filters/gateway를 조사합니다.", "source 범위를 명시합니다."]),
    ],
    diagnostics: [
      d("React에서 CORS 오류가 나는데 AppConfig를 보면 원인을 모르겠습니다.", "감사한 AppConfig에는 CORS policy가 없고 실제 policy가 Security 또는 proxy에 있을 수 있습니다.", ["전체 repository에서 CORS/CorsConfigurationSource/@CrossOrigin을 찾습니다.", "OPTIONS raw response를 봅니다.", "gateway/CDN response header 설정을 확인합니다."], "policy owner를 한 곳으로 정하고 exact allowlist를 MVC/Security/gateway 중 실제 enforcement 지점에 구성합니다.", "architecture test와 deployment header smoke test를 둡니다."),
      d("withCredentials를 true로 했는데 cookie도 없고 응답도 막힙니다.", "client credential mode만 켰고 server credentials/origin 허가 또는 cookie attributes가 맞지 않습니다.", ["Set-Cookie와 stored cookie를 봅니다.", "Allow-Origin/Allow-Credentials를 봅니다.", "SameSite/Secure/domain/path를 확인합니다."], "TLS와 cookie policy를 맞추고 exact origin 및 credentials CORS를 최소 범위로 허용합니다.", "browser matrix credentialed integration test를 둡니다."),
    ],
    expertNotes: ["실제 base URL, cookie 이름과 credential 값을 공개 예제에 복사하지 않습니다.", "CORS response header가 중복으로 붙으면 browser가 거부할 수 있으므로 application과 gateway의 이중 소유를 피합니다."],
  },
  {
    id: "origin-same-origin-policy",
    title: "origin을 scheme·host·port tuple로 계산하고 same-origin policy와 CORS를 구분합니다",
    lead: "host 문자열이 같아 보여도 scheme이나 effective port가 다르면 다른 origin이며 path는 origin 구성 요소가 아닙니다.",
    explanations: [
      "RFC 6454와 Fetch model에서 origin은 scheme, host, port tuple로 이해합니다. https://app.example과 http://app.example, 같은 host의 443과 8443은 다른 origin이며 /api path나 query는 origin을 바꾸지 않습니다.",
      "same-origin policy는 browser가 다른 origin resource의 response를 script가 읽는 것을 제한하는 핵심 경계입니다. CORS는 target server가 특정 cross-origin read를 opt in하는 protocol이지 SOP를 끄는 기능이 아닙니다.",
      "Origin header는 browser가 직렬화한 source origin이며 server는 parsed canonical tuple을 exact allowlist와 비교합니다. endsWith, contains, regex dot escaping 실수와 Host header 조합은 attacker-controlled sibling/suffix를 허용할 수 있습니다.",
      "null origin은 sandboxed iframe, file/data URL 등 여러 상황에서 나타날 수 있어 문자열 null을 wildcard처럼 허용하지 않습니다. 명확한 사용 사례와 threat model이 없으면 거부하고 별도 trusted application protocol을 설계합니다.",
    ],
    concepts: [
      c("origin", "scheme, host와 effective port로 구성되는 web security principal입니다.", ["path/query는 포함하지 않습니다.", "opaque/null origin도 존재합니다."]),
      c("same-origin policy", "한 origin의 script가 다른 origin resource와 상호작용하는 범위를 browser가 제한하는 보안 정책입니다.", ["서버 간 HTTP에는 적용되지 않습니다.", "CORS가 제한적으로 완화합니다."]),
      c("exact allowlist", "canonical origin tuple 전체가 사전 승인 entry와 정확히 일치할 때만 허용하는 정책입니다.", ["suffix/contains를 피합니다.", "scheme과 port를 포함합니다."]),
    ],
    codeExamples: [java("boot04-origin-allowlist", "scheme·host·effective port exact allowlist", "Boot04OriginAllowlist.java", "host suffix가 아니라 canonical origin tuple로 production과 local development origin을 판정합니다.", String.raw`import java.net.URI;
import java.util.*;

public class Boot04OriginAllowlist {
record Origin(String scheme, String host, int port) {
    static Origin parse(String value) {
        URI uri = URI.create(value);
        int port = uri.getPort();
        if (port == -1) port = uri.getScheme().equalsIgnoreCase("https") ? 443 : 80;
        return new Origin(uri.getScheme().toLowerCase(Locale.ROOT),
                uri.getHost().toLowerCase(Locale.ROOT), port);
    }
}

    static final Set<Origin> ALLOWED = Set.of(
            new Origin("https", "app.example", 443),
            new Origin("http", "localhost", 5173));
    static boolean allowed(String value) {
        try { return ALLOWED.contains(Origin.parse(value)); }
        catch (RuntimeException ex) { return false; }
    }
    public static void main(String[] args) {
        System.out.println("prod=" + allowed("https://app.example"));
        System.out.println("wrong-scheme=" + allowed("http://app.example"));
        System.out.println("suffix=" + allowed("https://app.example.evil.test"));
        System.out.println("wrong-port=" + allowed("https://app.example:8443"));
        System.out.println("local=" + allowed("http://localhost:5173"));
    }
}`, "prod=true\nwrong-scheme=false\nsuffix=false\nwrong-port=false\nlocal=true", ["rfc6454", "fetch-cors", "spring-cors-configuration"])],
    diagnostics: [
      d("https page는 되지만 http 개발 page 또는 다른 port에서 실패합니다.", "origin tuple의 scheme/port가 allowlist와 다릅니다.", ["page location.origin을 봅니다.", "request Origin을 봅니다.", "server canonical allowed origins를 확인합니다."], "환경별 exact origins를 명시하고 TLS/port를 deployment config와 일치시킵니다.", "scheme/host/default/non-default port matrix를 둡니다."),
      d("app.example.evil.test가 허용됩니다.", "host endsWith/contains 또는 부정확한 regex를 사용했습니다.", ["allowlist matcher 코드를 봅니다.", "URI components를 출력합니다.", "userinfo/punycode/trailing-dot variants를 시험합니다."], "검증된 URI parser와 canonical exact tuple 또는 엄격히 소유한 subdomain 정책을 사용합니다.", "origin parser adversarial fixtures를 둡니다."),
    ],
    expertNotes: ["등록 가능한 domain 전체를 wildcard로 허용하면 subdomain takeover와 tenant isolation 문제가 생길 수 있습니다.", "IDNA/punycode와 trailing dot normalization은 target server/browser parser behavior에 맞춘 differential test가 필요합니다."],
  },
  {
    id: "simple-request-preflight-trigger",
    title: "CORS-safelisted request와 preflight trigger를 method·headers·Content-Type으로 판정합니다",
    lead: "브라우저는 모든 cross-origin 요청에 OPTIONS를 보내지 않으며 safelisted 범위를 벗어날 때 본 요청 전에 permission을 확인합니다.",
    explanations: [
      "GET/HEAD/POST 일부와 safelisted request headers/content types만 조건을 만족하면 preflight 없이 actual request가 갈 수 있습니다. application/json Content-Type, Authorization 또는 custom header는 일반적으로 preflight를 유발합니다.",
      "preflight request는 OPTIONS와 Origin, Access-Control-Request-Method, 필요하면 Access-Control-Request-Headers를 포함합니다. server는 requested method/header를 검증한 response를 보내고 application business handler까지 통과시키지 않을 수 있습니다.",
      "preflight가 없다는 것은 CORS가 없다는 뜻이 아닙니다. actual response에도 Access-Control-Allow-Origin이 필요하고 browser는 response 노출을 결정합니다. 반대로 OPTIONS 200만 성공해도 actual response header가 틀리면 script는 읽지 못합니다.",
      "JSON API에서 preflight를 억지로 없애려고 content type을 text/plain으로 위장하면 server parsing, CSRF threat와 observability가 나빠집니다. 올바른 media type과 최소 policy를 구성하고 latency는 cache/architecture로 다룹니다.",
    ],
    concepts: [
      c("CORS-safelisted request", "특정 method/header/content-type 제약을 만족해 CORS preflight가 필요하지 않은 request입니다.", ["actual response CORS 검사는 남습니다.", "Fetch Standard 정의를 따릅니다."]),
      c("preflight", "browser가 OPTIONS로 실제 cross-origin method와 headers 사용 허가를 미리 확인하는 요청입니다.", ["business request와 구분합니다.", "credentials 처리도 구분합니다."]),
      c("Access-Control-Request-Headers", "actual request가 사용할 non-safelisted header names를 preflight에 알리는 header입니다.", ["server allowHeaders와 비교합니다.", "header names는 case-insensitive입니다."]),
    ],
    codeExamples: [java("boot04-preflight-trigger", "method·Content-Type·custom header로 preflight 필요성 판정", "Boot04PreflightTrigger.java", "일반적인 safelist 핵심을 교육용으로 축소해 JSON/Authorization이 preflight를 일으키는 이유를 보여 줍니다.", String.raw`import java.util.*;

public class Boot04PreflightTrigger {
    static boolean needs(String method, String contentType, Set<String> headers) {
        if (!Set.of("GET", "HEAD", "POST").contains(method)) return true;
        if (contentType != null && !Set.of(
                "application/x-www-form-urlencoded", "multipart/form-data", "text/plain").contains(contentType)) return true;
        for (String header : headers) {
            if (!Set.of("accept", "accept-language", "content-language", "content-type")
                    .contains(header.toLowerCase(Locale.ROOT))) return true;
        }
        return false;
    }
    public static void main(String[] args) {
        System.out.println("get=" + needs("GET", null, Set.of("Accept")));
        System.out.println("json=" + needs("POST", "application/json", Set.of("Content-Type")));
        System.out.println("auth=" + needs("GET", null, Set.of("Authorization")));
        System.out.println("put=" + needs("PUT", "application/json", Set.of("Content-Type")));
        System.out.println("plain=" + needs("POST", "text/plain", Set.of("Content-Type")));
    }
}`, "get=false\njson=true\nauth=true\nput=true\nplain=false", ["fetch-cors", "spring-cors-reference"])],
    diagnostics: [
      d("GET은 되는데 JSON POST만 OPTIONS에서 막힙니다.", "application/json 또는 custom header가 preflight를 유발했고 OPTIONS policy가 method/header를 허용하지 않습니다.", ["POST 전에 OPTIONS가 있는지 봅니다.", "Access-Control-Request-Method/Headers를 봅니다.", "server allowMethods/allowHeaders를 확인합니다."], "필요한 POST와 Content-Type만 exact 허용하고 OPTIONS가 security chain보다 적절히 처리되게 합니다.", "simple/preflight endpoint matrix를 browser test로 둡니다."),
      d("OPTIONS는 200인데 actual GET response를 JavaScript가 읽지 못합니다.", "actual response에 matching Allow-Origin/credentials/Vary가 없거나 redirect/error path가 policy를 건너뜁니다.", ["OPTIONS와 actual raw headers를 각각 봅니다.", "redirect와 exception response를 봅니다.", "gateway header stripping을 확인합니다."], "모든 relevant response path에 일관된 CORS processing을 적용합니다.", "success/error/redirect actual-response CORS tests를 둡니다."),
    ],
    expertNotes: ["예제는 Fetch safelist의 모든 byte/value 제한을 재현하지 않습니다. 실제 기준은 versioned Fetch Standard와 browser integration입니다.", "OPTIONS endpoint를 application business API처럼 인증 redirect하면 preflight가 실패할 수 있어 Security CORS integration 순서를 확인합니다."],
  },
  {
    id: "server-preflight-decision",
    title: "preflight를 origin·method·requested headers의 교집합으로 결정하고 이유를 기록합니다",
    lead: "Access-Control-Allow-*를 무조건 크게 반환하는 대신 요청된 capability가 endpoint policy 안에 있는지 각각 검증합니다.",
    explanations: [
      "server는 Origin을 exact allowlist와 비교하고 Access-Control-Request-Method가 허용 method인지, 모든 requested header names가 허용 set 안인지 확인합니다. 하나라도 실패하면 permissive headers를 덧붙이지 않고 거부합니다.",
      "allowedHeaders=*는 요청 headers를 광범위하게 승인할 수 있어 Authorization, custom admin headers와 future additions의 범위를 키웁니다. 실제 client가 필요한 Content-Type, Authorization, CSRF header 등을 inventory하고 endpoint risk에 맞춰 제한합니다.",
      "allowedMethods는 controller mapping과 일치해야 합니다. CORS에서 DELETE를 허용해도 endpoint가 없으면 405이고, endpoint가 있어도 authorization이 실패할 수 있습니다. protocol permission과 application permission은 독립 층입니다.",
      "거부 telemetry는 raw origin 전체를 high-cardinality label로 쓰지 않고 policy id, reason과 sampled sanitized origin을 사용합니다. 허용되지 않은 origin에도 Allow-Origin을 반사해 debugging하는 실수를 피합니다.",
    ],
    concepts: [
      c("capability intersection", "요청 origin/method/headers가 server가 선언한 각각의 허용 집합에 모두 포함될 때만 승인하는 결정입니다.", ["한 조건 성공으로 전체를 허용하지 않습니다.", "endpoint policy와 연결합니다."]),
      c("allowed headers", "cross-origin actual request에서 browser가 보낼 수 있도록 server가 승인한 non-safelisted header names입니다.", ["response exposed headers와 다릅니다.", "최소 집합을 유지합니다."]),
      c("policy reason code", "CORS 거부 원인을 origin, method, header 등 안정된 낮은 cardinality 값으로 기록하는 진단 코드입니다.", ["client 공개 detail과 분리할 수 있습니다.", "metrics 집계에 적합합니다."]),
    ],
    codeExamples: [java("boot04-preflight-policy", "origin·method·headers 교집합 preflight 판정", "Boot04PreflightPolicy.java", "세 조건을 순서대로 검사해 최소 허용과 거부 reason을 반환합니다.", String.raw`import java.util.*;

public class Boot04PreflightPolicy {
    record Preflight(String origin, String method, Set<String> headers) {}
    static final Set<String> ORIGINS = Set.of("https://app.example");
    static final Set<String> METHODS = Set.of("GET", "POST");
    static final Set<String> HEADERS = Set.of("content-type", "x-csrf-token");
    static String decide(Preflight request) {
        if (!ORIGINS.contains(request.origin())) return "deny:origin";
        if (!METHODS.contains(request.method())) return "deny:method";
        for (String value : request.headers()) {
            if (!HEADERS.contains(value.toLowerCase(Locale.ROOT))) return "deny:header";
        }
        return "allow";
    }
    public static void main(String[] args) {
        System.out.println(decide(new Preflight("https://app.example", "POST", Set.of("Content-Type", "X-CSRF-Token"))));
        System.out.println(decide(new Preflight("https://evil.test", "POST", Set.of("Content-Type"))));
        System.out.println(decide(new Preflight("https://app.example", "DELETE", Set.of())));
        System.out.println(decide(new Preflight("https://app.example", "GET", Set.of("X-Admin"))));
    }
}`, "allow\ndeny:origin\ndeny:method\ndeny:header", ["source-app-config", "source-react-http", "fetch-cors", "spring-cors-reference", "spring-cors-configuration", "spring-webmvc-configurer", "spring-security-cors"])],
    diagnostics: [
      d("모든 origin에서 X-Admin 같은 header가 허용됩니다.", "allowedHeaders wildcard 또는 요청 header 반사를 사용했습니다.", ["preflight Allow-Headers를 봅니다.", "requested headers와 policy inventory를 대조합니다.", "gateway가 추가하는 headers를 확인합니다."], "client에 필요한 명시적 header allowlist를 endpoint 범위에 적용합니다.", "미승인 future/custom header negative tests를 둡니다."),
      d("CORS는 POST를 허용하지만 endpoint는 405를 반환합니다.", "CORS allowedMethods와 MVC handler mappings가 drift했습니다.", ["Allow-Methods와 actual mapping을 봅니다.", "OPTIONS Allow header를 확인합니다.", "deployment version을 대조합니다."], "CORS policy를 route inventory와 같은 configuration source에서 관리하거나 conformance check를 둡니다.", "route×CORS method architecture test를 둡니다."),
    ],
    expertNotes: ["CORS denial response의 exact status는 framework/browser 관찰과 조직 정책으로 고정하되 허용 headers를 실패 origin에 반사하지 않습니다.", "Access-Control-Expose-Headers는 response headers를 script가 읽게 하는 별도 목록이며 Allow-Headers와 혼동하지 않습니다."],
  },
  {
    id: "credentialed-cors-wildcards-cookies",
    title: "credentialed CORS에서 wildcard 금지, exact origin 반사와 cookie attributes를 함께 검증합니다",
    lead: "cookie나 HTTP authentication이 포함되는 cross-origin 요청은 더 강한 origin 제한과 browser cookie 정책을 동시에 만족해야 합니다.",
    explanations: [
      "credentialed request에 Access-Control-Allow-Origin: *를 사용할 수 없습니다. server는 승인된 request origin 하나를 exact 검증한 뒤 그 값을 응답하고 Access-Control-Allow-Credentials: true를 보냅니다. 미승인 origin에는 반사하지 않습니다.",
      "withCredentials가 true여도 cookie가 SameSite 정책에서 cross-site 전송되지 않거나 Secure가 필요한데 HTTP이면 포함되지 않습니다. origin과 site는 같은 개념이 아니므로 same-site cross-origin, cross-site를 별도 표로 시험합니다.",
      "cookie Domain/Path는 어느 request에 cookie가 붙는지, HttpOnly는 script read를, Secure는 transport를 제한합니다. CORS는 이 속성을 설정하거나 authentication을 수행하지 않습니다.",
      "credentialed responses는 사용자별일 가능성이 높아 shared cache와 origin variation에 주의합니다. Vary: Origin, private/no-store와 cache key를 검토하고 CDN이 Allow-Origin을 임의 캐시하지 않게 합니다.",
    ],
    concepts: [
      c("credentialed CORS", "cookies, HTTP authentication 또는 TLS client credential과 함께 수행되는 cross-origin Fetch/CORS mode입니다.", ["wildcard origin과 함께 사용할 수 없습니다.", "CSRF 방어가 별도입니다."]),
      c("SameSite", "cookie가 cross-site context에서 전송되는 범위를 제한하는 cookie attribute입니다.", ["origin과 site는 다릅니다.", "None은 Secure 요구와 browser 정책을 확인합니다."]),
      c("origin reflection", "request Origin을 검증 후 Allow-Origin에 그대로 반환하는 방식입니다.", ["검증 없는 반사는 wildcard와 같습니다.", "Vary: Origin이 필요할 수 있습니다."]),
    ],
    codeExamples: [java("boot04-credentials", "credentials와 origin wildcard 조합 검증", "Boot04Credentials.java", "credential mode에서 wildcard를 거부하고 승인된 exact origin만 반사합니다.", String.raw`import java.util.*;

public class Boot04Credentials {
record CorsPolicy(Set<String> origins, boolean wildcard, boolean credentials) {
    String responseOrigin(String requestOrigin) {
        if (credentials && wildcard) return "invalid:wildcard-with-credentials";
        if (wildcard) return "*";
        return origins.contains(requestOrigin) ? requestOrigin : "denied";
    }
}

    public static void main(String[] args) {
        CorsPolicy invalid = new CorsPolicy(Set.of(), true, true);
        CorsPolicy session = new CorsPolicy(Set.of("https://app.example"), false, true);
        CorsPolicy publicRead = new CorsPolicy(Set.of(), true, false);
        System.out.println(invalid.responseOrigin("https://app.example"));
        System.out.println(session.responseOrigin("https://app.example"));
        System.out.println(session.responseOrigin("https://evil.test"));
        System.out.println(publicRead.responseOrigin("https://any.example"));
    }
}`, "invalid:wildcard-with-credentials\nhttps://app.example\ndenied\n*", ["fetch-cors", "spring-cors-configuration", "axios-request-config"])],
    diagnostics: [
      d("browser가 credential mode에서 Allow-Origin * 응답을 거부합니다.", "credentials=true와 wildcard origin을 함께 구성했습니다.", ["request credentials mode를 봅니다.", "Allow-Origin/Allow-Credentials를 봅니다.", "framework allowOrigins/patterns를 확인합니다."], "exact approved origin을 검증·반사하고 Vary를 설정하거나 credentials가 불필요한 public endpoint로 분리합니다.", "wildcard+credentials configuration test를 둡니다."),
      d("Set-Cookie는 보이지만 다음 API request에 cookie가 없습니다.", "SameSite/Secure/Domain/Path 또는 browser third-party cookie 정책이 맞지 않습니다.", ["browser cookie exclusion reason을 봅니다.", "request site/origin/TLS를 계산합니다.", "cookie attributes와 storage를 확인합니다."], "HTTPS와 최소 domain/path, HttpOnly/Secure 및 의도한 SameSite를 적용하고 token 방식 대안도 평가합니다.", "실제 supported browser의 cross-site cookie tests를 둡니다."),
    ],
    expertNotes: ["allowedOriginPatterns를 넓은 wildcard로 쓰면서 credentials를 켜면 syntax상 동작해도 security scope가 과도할 수 있습니다.", "third-party cookie 정책은 browser/vendor 변화 가능성이 있어 현재 지원 matrix를 실제 브라우저로 주기적으로 재검증합니다."],
  },
  {
    id: "preflight-cache-vary",
    title: "preflight cache와 HTTP cache를 구분하고 Origin variation을 Vary·cache key에 포함합니다",
    lead: "Access-Control-Max-Age는 browser의 CORS-preflight cache에 영향을 주며 일반 response freshness와 같은 cache가 아닙니다.",
    explanations: [
      "preflight result는 target, origin, credentials mode, method와 header names 같은 dimensions에 따라 달라집니다. 한 origin의 POST permission을 다른 origin이나 DELETE permission으로 재사용하면 안 됩니다.",
      "Access-Control-Max-Age를 길게 하면 latency는 줄지만 policy revoke가 browser cache 만료까지 지연될 수 있습니다. browser별 cap과 failure behavior가 다를 수 있어 보안 변경의 propagation requirement로 값을 선택합니다.",
      "dynamic Allow-Origin을 반환하는 actual/preflight response는 Vary: Origin을 고려합니다. 요청 method/header에 따라 preflight response가 달라지는 cache/proxy라면 Access-Control-Request-Method/Headers variation도 보존합니다.",
      "CDN과 reverse proxy가 OPTIONS를 cache할 때 application CORS processor와 다른 key/default TTL을 쓰면 사고가 납니다. cache ownership, key, TTL, purge와 header normalization을 문서화하고 cross-origin poisoning tests를 둡니다.",
    ],
    concepts: [
      c("CORS-preflight cache", "browser가 성공한 preflight permission을 제한된 기간 재사용하는 Fetch-defined cache입니다.", ["일반 HTTP cache와 구분합니다.", "method/header credentials dimensions가 있습니다."]),
      c("Access-Control-Max-Age", "preflight 결과를 cache할 수 있는 시간을 seconds로 알리는 response header입니다.", ["browser cap이 있을 수 있습니다.", "policy revoke 지연과 tradeoff입니다."]),
      c("Vary", "어떤 request header 값에 따라 selected representation/response가 달라지는지 cache에 알리는 response header입니다.", ["Origin variation에 중요합니다.", "existing values를 덮지 않고 병합합니다."]),
    ],
    codeExamples: [java("boot04-preflight-cache", "preflight permission의 안전한 cache key 구성", "Boot04PreflightCache.java", "origin, method와 normalized requested header set을 포함해 permission을 다른 capability에 재사용하지 않게 합니다.", String.raw`import java.util.*;

public class Boot04PreflightCache {
    static String key(String target, String origin, String method, Collection<String> headers) {
        TreeSet<String> normalized = new TreeSet<>();
        for (String header : headers) normalized.add(header.toLowerCase(Locale.ROOT));
        return target + "|" + origin + "|" + method.toUpperCase(Locale.ROOT) + "|" + String.join(",", normalized);
    }
    public static void main(String[] args) {
        String a = key("/api/guests", "https://app.example", "post", List.of("X-CSRF-Token", "Content-Type"));
        String b = key("/api/guests", "https://app.example", "POST", List.of("content-type", "x-csrf-token"));
        String otherOrigin = key("/api/guests", "https://other.example", "POST", List.of("content-type", "x-csrf-token"));
        String delete = key("/api/guests", "https://app.example", "DELETE", List.of("content-type", "x-csrf-token"));
        System.out.println(a);
        System.out.println("normalized-equal=" + a.equals(b));
        System.out.println("origin-isolated=" + !a.equals(otherOrigin));
        System.out.println("method-isolated=" + !a.equals(delete));
    }
}`, "/api/guests|https://app.example|POST|content-type,x-csrf-token\nnormalized-equal=true\norigin-isolated=true\nmethod-isolated=true", ["fetch-cors", "rfc9111", "spring-cors-reference"])],
    diagnostics: [
      d("CORS allowlist에서 origin을 제거했는데 일부 browser는 계속 요청합니다.", "긴 preflight max-age 또는 intermediary cache가 이전 permission을 보유합니다.", ["response Max-Age와 browser timing을 봅니다.", "CDN OPTIONS caching을 확인합니다.", "policy rollout 시간을 대조합니다."], "revoke 전 max-age를 낮추고 cache purge/credential revocation과 병행하며 emergency deny를 enforcement layer에 둡니다.", "policy revocation rehearsal과 bounded TTL을 둡니다."),
      d("한 origin의 Allow-Origin 응답이 다른 origin에 재사용됩니다.", "shared cache key에 Origin이 없거나 Vary가 누락됐습니다.", ["Age/Via/Vary를 봅니다.", "CDN cache key를 확인합니다.", "두 origin 순서를 바꿔 재현합니다."], "Vary: Origin과 origin-aware cache key를 적용하거나 credentialed response caching을 금지합니다.", "cross-origin cache-order tests를 둡니다."),
    ],
    expertNotes: ["Vary: *나 과도한 dimensions는 cache 효율을 없앨 수 있어 public/credentialed endpoints를 분리하는 설계를 고려합니다.", "application이 Vary 값을 설정할 때 proxy가 기존 Accept-Encoding 등을 덮어쓰지 않는지 raw response로 확인합니다."],
  },
  {
    id: "spring-mvc-security-filter-order",
    title: "Spring MVC CORS와 Spring Security filter order를 한 정책으로 통합합니다",
    lead: "preflight에는 session cookie가 없을 수 있으므로 CORS 처리가 authentication보다 뒤에 오면 유효한 origin도 먼저 거부될 수 있습니다.",
    explanations: [
      "Spring Security 공식 문서는 CORS가 Security보다 먼저 처리되어야 한다고 설명합니다. CorsConfigurationSource 또는 MVC CORS configuration을 Security가 인식하도록 연결하고 중복 custom filter를 피합니다.",
      "WebMvcConfigurer#addCorsMappings는 MVC handler mappings에 global policy를 적용할 수 있고 @CrossOrigin은 local policy입니다. local annotations가 넓은 예외를 축적하지 않도록 centralized ownership과 merge semantics를 검증합니다.",
      "SecurityFilterChain에서 http.cors를 활성화해도 configuration source가 기대한 값인지 확인해야 합니다. actuator/management port, error dispatcher, static resources와 WebFlux는 별도 stack일 수 있어 같은 설정이 자동 적용된다고 단정하지 않습니다.",
      "OPTIONS를 무조건 permitAll하는 것만으로는 안전한 CORS가 아닙니다. CORS processor가 origin/method/header를 검증하게 하고 actual request는 authentication, authorization와 CSRF를 정상 통과시킵니다.",
    ],
    concepts: [
      c("CorsConfigurationSource", "request에 적용할 Spring CorsConfiguration을 제공하는 전략 interface입니다.", ["Security integration에 사용됩니다.", "path별 policy를 만들 수 있습니다."]),
      c("filter ordering", "request가 여러 filters를 통과하는 순서로 preflight, authentication, CSRF와 response headers 결과를 바꿉니다.", ["실제 chain을 관찰합니다.", "중복 filter를 피합니다."]),
      c("policy ownership", "MVC, Security, gateway 중 누가 CORS allowlist와 headers의 authoritative source인지 정한 책임입니다.", ["이중 설정 drift를 줄입니다.", "deployment tests가 필요합니다."]),
    ],
    diagnostics: [
      d("preflight가 401 또는 login redirect를 반환합니다.", "CORS processor보다 authentication filter가 먼저 실행됐습니다.", ["Security debug filter chain을 봅니다.", "OPTIONS response status/Location을 봅니다.", "CorsConfigurationSource와 http.cors 연결을 확인합니다."], "CORS를 Security 앞에서 처리하도록 공식 integration을 구성하고 valid preflight에 인증을 요구하지 않습니다.", "unauthenticated OPTIONS와 authenticated actual request pair test를 둡니다."),
      d("일부 controller만 지나치게 넓은 origin을 허용합니다.", "@CrossOrigin local overrides가 중앙 policy와 누적·drift했습니다.", ["annotations를 repository 전체에서 찾습니다.", "global/local combination 결과를 test합니다.", "route inventory와 owner를 확인합니다."], "중앙 path-based policy로 통합하고 local exception은 승인·만료를 요구합니다.", "architecture lint와 effective policy snapshot을 둡니다."),
    ],
    expertNotes: ["Servlet MVC와 reactive WebFlux의 CORS components를 혼용하지 말고 실제 application stack을 확인합니다.", "preflight permission과 endpoint authorization은 독립이므로 OPTIONS 성공을 업무 접근 성공으로 해석하지 않습니다."],
  },
  {
    id: "cors-is-not-csrf",
    title: "CORS와 CSRF를 분리하고 cookie 기반 state change에 token·Origin 검증을 적용합니다",
    lead: "CORS는 response를 다른 origin script가 읽는 권한을 제어하지만 browser가 credentialed request를 보내는 모든 경로를 막아 주지는 않습니다.",
    explanations: [
      "HTML form처럼 preflight 없는 cross-site request도 cookie를 포함해 state를 변경할 수 있습니다. 공격자가 response를 읽지 못해도 action이 실행되면 CSRF이므로 strict CORS만으로 방어했다고 말할 수 없습니다.",
      "Spring Security CSRF protection은 synchronizer token 등 expected token을 state-changing request에서 검증합니다. SPA는 cookie/session authentication 방식에 맞는 token repository와 header 전달, token rotation/login/logout lifecycle을 설계합니다.",
      "SameSite cookie는 강한 defense-in-depth지만 browser/site/navigation semantics와 legacy clients를 고려합니다. Origin/Referer 검증도 보조로 사용할 수 있으나 proxy normalization, privacy stripping과 trusted origin policy를 명시해야 합니다.",
      "Authorization bearer token을 JS가 header에 넣는 architecture는 classical ambient-cookie CSRF 위험을 바꾸지만 XSS/token storage·refresh·CORS preflight 위험을 가져옵니다. 한 위협을 없앴다고 전체 authentication이 안전해진 것은 아닙니다.",
    ],
    concepts: [
      c("CSRF", "사용자의 ambient credential을 이용해 의도하지 않은 state-changing request를 보내게 하는 공격입니다.", ["response read가 없어도 성공할 수 있습니다.", "CORS와 별도 방어합니다."]),
      c("CSRF token", "공격 origin이 알기 어려운 request-bound value를 state-changing 요청에 요구해 의도를 검증하는 방어입니다.", ["session/user binding과 lifecycle이 필요합니다.", "XSS를 해결하지 않습니다."]),
      c("ambient credential", "browser가 대상 site request에 자동으로 붙이는 cookie 같은 credential입니다.", ["사용자 action 의도와 무관할 수 있습니다.", "SameSite/token으로 제한합니다."]),
    ],
    codeExamples: [java("boot04-csrf", "CORS read permission과 CSRF state-change permission 분리", "Boot04Csrf.java", "trusted origin과 CSRF token을 state-changing credentialed request에서 별도 검사합니다.", String.raw`import java.util.*;

public class Boot04Csrf {
    record Request(String method, String origin, boolean cookie, String csrfToken) {}
    static final Set<String> TRUSTED = Set.of("https://app.example");
    static boolean stateChanging(String method) {
        return Set.of("POST", "PUT", "PATCH", "DELETE").contains(method);
    }
    static String authorize(Request request) {
        if (!stateChanging(request.method())) return "allow:read";
        if (!request.cookie()) return "deny:unauthenticated";
        if (!TRUSTED.contains(request.origin())) return "deny:origin";
        if (!"token-expected".equals(request.csrfToken())) return "deny:csrf";
        return "allow:change";
    }
    public static void main(String[] args) {
        System.out.println(authorize(new Request("GET", "https://evil.test", true, null)));
        System.out.println(authorize(new Request("POST", "https://evil.test", true, "token-expected")));
        System.out.println(authorize(new Request("POST", "https://app.example", true, null)));
        System.out.println(authorize(new Request("POST", "https://app.example", true, "token-expected")));
    }
}`, "allow:read\ndeny:origin\ndeny:csrf\nallow:change", ["spring-security-csrf", "owasp-csrf", "fetch-cors"])],
    diagnostics: [
      d("CORS allowlist는 엄격한데 cross-site form으로 데이터가 변경됩니다.", "CORS를 CSRF 방어로 오해하고 state-changing cookie request에 token을 요구하지 않았습니다.", ["form-compatible method/content type을 재현합니다.", "cookie SameSite를 봅니다.", "Security CSRF configuration을 확인합니다."], "state-changing requests에 CSRF token과 적절한 SameSite/Origin defense를 적용합니다.", "cross-site form과 missing/invalid token tests를 둡니다."),
      d("SPA 로그인 후 모든 POST가 403 CSRF입니다.", "client가 token을 받거나 올바른 header/cookie pair로 돌려보내지 않습니다.", ["token issuance response/cookie를 봅니다.", "Axios header interceptor를 봅니다.", "login/logout token rotation을 확인합니다."], "선택한 token repository 계약에 맞춰 client가 token을 읽고 approved header로 보내게 합니다.", "login-refresh-logout와 expired token browser tests를 둡니다."),
    ],
    expertNotes: ["예제의 GET 허용은 CORS response read 허용을 뜻하지 않으며 authorization도 생략한 model입니다.", "CORS 오류를 해결하려고 CSRF를 disable하는 변경은 별도 threat model과 대체 통제 없이 승인하지 않습니다."],
  },
  {
    id: "reverse-proxy-forwarded-origin",
    title: "reverse proxy에서 public origin, forwarded headers와 CORS header 소유권을 신뢰 경계로 관리합니다",
    lead: "application이 보는 내부 scheme/host가 browser의 public origin과 다를 때 proxy metadata를 무조건 신뢰하거나 무시하면 redirect, cookie와 origin 검증이 깨집니다.",
    explanations: [
      "TLS termination proxy 뒤 application은 http와 내부 host를 볼 수 있습니다. public URL 생성과 secure cookie 판단에 Forwarded/X-Forwarded-*를 사용할 수 있지만 오직 trusted proxy가 외부 입력을 제거·재작성한 경우에만 신뢰합니다.",
      "client가 직접 보낸 X-Forwarded-Host를 application이 신뢰하면 host poisoning, redirect와 origin allowlist bypass가 가능합니다. network allowlist, hop count와 proxy sanitation policy를 명시합니다.",
      "gateway와 application이 모두 Access-Control-Allow-Origin을 쓰면 comma-separated/multiple values로 browser가 거부하거나 더 넓은 gateway policy가 app denial을 덮을 수 있습니다. authoritative layer 하나와 header strip/replace rule을 둡니다.",
      "preview deployment와 ephemeral hostname을 broad wildcard로 허용하지 말고 signed deployment registry, expiry와 environment isolation을 사용합니다. production credentials가 preview origin으로 전송되지 않게 별도 identity/cookie scope를 둡니다.",
    ],
    concepts: [
      c("trusted proxy", "직접 연결 source와 sanitation policy로 신뢰가 성립해 forwarded metadata를 authoritative하게 제공하는 intermediary입니다.", ["header 존재만으로 신뢰하지 않습니다.", "hop topology를 고정합니다."]),
      c("public origin", "browser 사용자가 실제로 접속한 외부 scheme, host, port tuple입니다.", ["internal upstream address와 다를 수 있습니다.", "redirect/cookie/CORS에 영향 줍니다."]),
      c("header ownership", "CORS 또는 forwarded response header를 어느 한 layer가 생성하고 다른 layer가 보존/제거하는지 정한 규칙입니다.", ["중복을 방지합니다.", "raw edge response로 검증합니다."]),
    ],
    codeExamples: [java("boot04-proxy-trust", "trusted proxy에서만 forwarded public origin 사용", "Boot04ProxyTrust.java", "연결 source가 trusted일 때만 sanitized forwarded tuple을 사용하고 direct spoof는 internal request metadata로 제한합니다.", String.raw`import java.util.*;

public class Boot04ProxyTrust {
    record Incoming(String peer, String directScheme, String directHost, String forwardedScheme, String forwardedHost) {}
    static final Set<String> TRUSTED_PROXIES = Set.of("10.0.0.10");
    static String publicOrigin(Incoming request) {
        boolean trusted = TRUSTED_PROXIES.contains(request.peer());
        String scheme = trusted ? request.forwardedScheme() : request.directScheme();
        String host = trusted ? request.forwardedHost() : request.directHost();
        return scheme + "://" + host;
    }
    public static void main(String[] args) {
        Incoming edge = new Incoming("10.0.0.10", "http", "service.internal", "https", "api.example");
        Incoming spoof = new Incoming("203.0.113.9", "https", "api.example", "https", "evil.test");
        System.out.println("edge=" + publicOrigin(edge));
        System.out.println("direct=" + publicOrigin(spoof));
        System.out.println("spoof-blocked=" + !publicOrigin(spoof).contains("evil.test"));
    }
}`, "edge=https://api.example\ndirect=https://api.example\nspoof-blocked=true", ["rfc9110", "spring-cors-reference"])],
    diagnostics: [
      d("application이 redirect를 http 내부 주소로 만들거나 Secure cookie를 놓칩니다.", "trusted proxy의 public scheme/host metadata를 처리하지 않았습니다.", ["edge와 app request scheme/host를 비교합니다.", "forwarded header sanitation을 봅니다.", "Spring forwarded-header strategy를 확인합니다."], "trusted proxy topology에서만 forwarded metadata를 사용하도록 framework와 proxy를 함께 구성합니다.", "edge TLS redirect/cookie/public URL smoke tests를 둡니다."),
      d("직접 request의 X-Forwarded-Host로 allowlist/redirect가 바뀝니다.", "모든 source의 forwarded headers를 신뢰했습니다.", ["direct backend 접근을 시험합니다.", "peer IP/hop trust를 봅니다.", "proxy가 inbound forwarded headers를 제거하는지 확인합니다."], "backend 직접 접근을 차단하고 trusted proxy가 headers를 strip/replace하게 하며 app trust 범위를 제한합니다.", "spoofed forwarded-header negative tests를 둡니다."),
    ],
    expertNotes: ["peer IP 신뢰만으로 충분한지는 cloud load balancer topology와 spoof resistance를 검토합니다.", "CORS allowlist는 public frontend origins이며 API 자신의 public origin 목록과 혼동하지 않습니다."],
  },
  {
    id: "react-axios-client-contract",
    title: "React Axios instance를 environment URL·credential·timeout·error 계약으로 제한합니다",
    lead: "client wrapper는 server policy를 우회할 수 없지만 request URL, headers, credentials와 실패 표현을 일관되게 만들어 진단 가능성을 높입니다.",
    explanations: [
      "baseURL은 build/runtime environment에서 주입하되 absolute HTTPS origin을 schema-validate하고 production bundle에 private host나 secret을 넣지 않습니다. 공개 browser bundle의 환경 변수는 비밀 저장소가 아닙니다.",
      "모든 request에 Content-Type: application/json을 강제하면 body 없는 GET도 의미 없는 header를 보내고 preflight를 유발할 수 있습니다. JSON body가 있는 request에서 serializer가 적절히 설정하게 하고 Accept는 기대 representation으로 명시합니다.",
      "withCredentials는 cookie session architecture에서 필요한 API scope에만 적용합니다. public read client와 credentialed command client를 분리하면 wildcard/public cache와 private security policy를 더 명확히 할 수 있습니다.",
      "Axios error를 response 있음(status/body), request 전송됐으나 response 없음(timeout/network/CORS), configuration error로 나눕니다. CORS blocked response는 JavaScript가 상세 status/body를 못 볼 수 있으므로 correlation과 server logs가 필요합니다.",
    ],
    concepts: [
      c("browser bundle configuration", "client build 또는 runtime에 포함되어 최종 사용자도 읽을 수 있는 공개 설정입니다.", ["secret을 넣지 않습니다.", "URL allowlist와 schema를 검증합니다."]),
      c("credential scope", "어떤 API instance/request가 cookie 또는 authorization credential을 포함할지 제한한 범위입니다.", ["public/ private client를 분리할 수 있습니다.", "least privilege를 적용합니다."]),
      c("client error taxonomy", "HTTP response, network/timeout/CORS opaque failure와 local request configuration 실패를 구분하는 분류입니다.", ["retry/UI가 달라집니다.", "server correlation을 사용합니다."]),
    ],
    diagnostics: [
      d("GET 요청까지 preflight가 생기고 latency가 늘었습니다.", "Axios defaults에서 모든 요청에 non-safelisted Content-Type/custom header를 강제했습니다.", ["actual request headers를 봅니다.", "interceptor/defaults를 확인합니다.", "preflight requested headers를 봅니다."], "body가 있는 요청에만 필요한 Content-Type을 설정하고 불필요 custom headers를 제거합니다.", "method별 emitted-header snapshot tests를 둡니다."),
      d("client console에는 Network Error만 있고 server status를 볼 수 없습니다.", "browser가 CORS 위반 response를 script에 노출하지 않았거나 실제 network/TLS 실패입니다.", ["DevTools OPTIONS/actual request를 봅니다.", "server/gateway access log와 correlation을 봅니다.", "DNS/TLS/mixed content를 확인합니다."], "원인을 network, preflight, actual-response CORS로 분리해 server policy 또는 transport를 수정합니다.", "end-to-end browser diagnostic runbook을 둡니다."),
    ],
    expertNotes: ["실제 환경 변수명/값을 복사하지 않고 baseURL-from-environment라는 구조만 사용합니다.", "client-side origin allowlist는 사용자 변조가 가능하므로 server enforcement를 대신하지 않습니다."],
  },
  {
    id: "cors-testing-observability-release",
    title: "browser·MockMvc·gateway·cache를 포함한 CORS matrix와 안전한 rollout을 운영합니다",
    lead: "curl 한 번의 OPTIONS 성공은 browser credentials, redirect, cookies와 cache variation을 증명하지 못하므로 실제 stack별 evidence가 필요합니다.",
    explanations: [
      "test matrix는 allowed/denied origin, scheme/port variants, simple/preflight, methods, requested headers, credentials, success/error/redirect, CSRF valid/invalid와 cache 순서를 포함합니다. origin A 다음 B와 B 다음 A를 모두 실행해 cache contamination을 찾습니다.",
      "MockMvc는 application policy를 빠르게 검증하고 browser automation은 Fetch/Cookie enforcement를 검증합니다. staging edge test는 CDN/proxy header ownership, TLS와 forwarded metadata를 확인하므로 세 층을 상호 대체하지 않습니다.",
      "metrics에는 policy id, decision/reason, route template, method와 preflight latency를 두고 raw Origin은 sampled sanitized log에 제한합니다. denied origin cardinality 공격으로 metrics backend가 손상되지 않게 합니다.",
      "allowlist 변경은 code/config review, owner/expiry, canary, browser matrix와 rollback을 거칩니다. wildcard 확대를 incident quick fix로 쓰지 않고 정확한 failing tuple과 필요한 capability만 임시 승인하며 자동 만료시킵니다.",
    ],
    concepts: [
      c("CORS test matrix", "origin, method, headers, credentials, response path와 intermediary 순서를 조합한 positive/negative integration cases입니다.", ["OPTIONS와 actual을 짝으로 봅니다.", "browser enforcement를 포함합니다."]),
      c("effective policy", "application, Security와 gateway를 모두 통과한 edge response에서 실제로 관찰되는 CORS 허용 규칙입니다.", ["source config와 다를 수 있습니다.", "deployment마다 readback합니다."]),
      c("temporary allowlist grant", "명시 owner, reason, scope와 expiry를 가진 제한적 origin capability 승인입니다.", ["wildcard보다 좁습니다.", "자동 제거와 audit가 필요합니다."]),
    ],
    diagnostics: [
      d("local MockMvc는 통과하지만 production browser는 CORS 실패합니다.", "gateway header rewrite, TLS/public origin, cookie 또는 cache가 application test에 포함되지 않았습니다.", ["edge raw response를 봅니다.", "browser cookie/preflight를 봅니다.", "app와 gateway headers를 diff합니다."], "staging public-origin browser test와 edge header conformance를 release gate에 추가합니다.", "application/browser/edge 삼층 tests를 유지합니다."),
      d("긴급 대응으로 wildcard를 열었고 원복 시점을 잃었습니다.", "allowlist 변경에 owner, expiry와 automated rollback이 없습니다.", ["config audit를 봅니다.", "허용 origin usage를 확인합니다.", "credential/CSRF exposure를 평가합니다."], "필요 tuple만 time-bound grant로 바꾸고 wildcard를 제거하며 credential logs를 조사합니다.", "policy-as-code approval, expiry controller와 periodic review를 둡니다."),
    ],
    expertNotes: ["CORS error rate 감소만 성공 기준으로 삼으면 과도한 허용도 성공처럼 보입니다. denied-negative tests와 effective allowlist diff가 함께 필요합니다.", "browser console message 문구는 변할 수 있으므로 raw request/response와 policy decision code를 durable evidence로 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "source-app-config", repository: "nohssam springboot/MyProject01 학습 원본", path: "springboot\\MyProject01\\src\\main\\java\\com\\study\\myproject01\\config\\AppConfig.java", usedFor: ["configuration audit", "password encoder bean", "CORS declaration absence"], evidence: "2026-07-14 read-only audit에서 password encoder @Bean만 있고 CorsRegistry, CorsConfigurationSource 또는 @CrossOrigin 선언이 없음을 확인했습니다. SHA-256 AC512C77EE10389F46EFEA6C150649AAE81673A0CDC15B28C9A627DCFA2C2D6B." },
  { id: "source-react-http", repository: "nohssam my-app03 학습 원본", path: "my-app03\\src\\api\\Http.jsx", usedFor: ["Axios instance", "environment base URL", "JSON header", "withCredentials true"], evidence: "2026-07-14 read-only audit에서 environment-derived baseURL, JSON Content-Type와 withCredentials true를 확인했습니다. 실제 environment 값은 복사하지 않았습니다. SHA-256 AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987." },
  { id: "spring-cors-reference", repository: "Spring Framework Reference", path: "web/webmvc-cors.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html", usedFor: ["MVC CORS processing", "@CrossOrigin", "global configuration", "credentials and maxAge"], evidence: "current official Spring MVC CORS reference에서 preflight/actual processing과 local/global configuration을 확인했습니다." },
  { id: "spring-cors-configuration", repository: "Spring Framework Javadoc", path: "org/springframework/web/cors/CorsConfiguration.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/cors/CorsConfiguration.html", usedFor: ["allowed origins", "methods", "headers", "credentials", "max age"], evidence: "CorsConfiguration의 origin/method/header/credential configuration API와 validation 경계를 확인했습니다." },
  { id: "spring-webmvc-configurer", repository: "Spring Framework Javadoc", path: "org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html", usedFor: ["addCorsMappings", "MVC Java configuration"], evidence: "WebMvcConfigurer extension point와 CORS mapping configuration 위치를 확인했습니다." },
  { id: "spring-security-cors", repository: "Spring Security Reference", path: "servlet/integrations/cors.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html", usedFor: ["CORS before Security", "CorsConfigurationSource", "Security integration"], evidence: "preflight에 cookies가 없을 수 있어 CORS가 Security보다 먼저 처리되어야 한다는 공식 지침을 확인했습니다." },
  { id: "spring-security-csrf", repository: "Spring Security Reference", path: "servlet/exploits/csrf.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html", usedFor: ["CSRF threat", "token protection", "SPA integration boundary"], evidence: "Spring Security의 servlet CSRF 보호와 token lifecycle 개념을 확인했습니다." },
  { id: "fetch-cors", repository: "WHATWG Fetch Standard", path: "#http-cors-protocol", publicUrl: "https://fetch.spec.whatwg.org/#http-cors-protocol", usedFor: ["CORS protocol", "preflight", "credentials", "safelisted requests", "preflight cache"], evidence: "current Fetch Standard의 HTTP CORS protocol anchor에서 Origin, preflight, credentials와 cache model을 확인했습니다." },
  { id: "rfc6454", repository: "IETF RFC Editor", path: "rfc/rfc6454.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6454.html", usedFor: ["web origin", "scheme host port", "Origin header", "security considerations"], evidence: "Web Origin Concept와 Origin header serialization/security considerations를 RFC 원문에서 확인했습니다." },
  { id: "rfc9110", repository: "IETF RFC Editor", path: "rfc/rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP methods", "headers", "Vary semantics", "forwarded intermediary context"], evidence: "HTTP semantics와 header field/intermediary 기본 규칙을 확인했습니다." },
  { id: "rfc9111", repository: "IETF RFC Editor", path: "rfc/rfc9111.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["HTTP cache keys", "freshness", "Vary", "shared/private cache"], evidence: "HTTP caching의 cache key, freshness와 Vary 동작을 RFC 원문에서 확인했습니다." },
  { id: "axios-request-config", repository: "Axios Documentation", path: "docs/req_config", publicUrl: "https://axios-http.com/docs/req_config", usedFor: ["baseURL", "headers", "timeout", "withCredentials"], evidence: "Axios official request configuration에서 baseURL, headers, timeout과 withCredentials options를 확인했습니다." },
  { id: "owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross_Site_Request_Forgery_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["CSRF tokens", "SameSite", "Origin verification", "defense in depth"], evidence: "CSRF 방어에서 token, SameSite와 origin verification을 결합하는 primary security guidance를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "boot-04-cors-client-server", slug: "boot-04-cors-client-server", courseId: "spring", moduleId: "spring-boot-rest-integration", order: 4,
  title: "React 연동 CORS와 preflight 진단",
  subtitle: "Origin tuple부터 credentials·CSRF·preflight cache·Security filter·proxy까지 실제 browser evidence로 연결합니다",
  level: "고급", estimatedMinutes: 90,
  coreQuestion: "React와 Spring이 다른 origin에 있을 때 browser가 어떤 요청을 preflight하고, credentialed response를 누가 어떤 evidence로 허용하며, CORS·CSRF·proxy·cache 경계를 어떻게 혼동 없이 운영할까요?",
  summary: "AppConfig와 React Http.jsx 두 원본을 read-only로 감사합니다. AppConfig에는 CORS 선언이 없고 Http.jsx에는 environment baseURL, JSON Content-Type와 withCredentials true가 있음을 확인하되 실제 domain/config 값은 공개하지 않습니다. origin의 scheme-host-port tuple과 same-origin policy, safelisted/preflight trigger, Origin·Access-Control-Request-*와 Allow-* 교집합, credentials와 wildcard 금지, cookie SameSite/Secure/Domain/Path, preflight cache와 Vary, Spring MVC/Security filter order, CORS와 CSRF 분리, reverse proxy forwarded-header 신뢰, Axios request/error taxonomy 및 browser-edge test/observability/rollout을 단계별로 다룹니다. 여섯 JDK 21 exact examples는 exact origin, preflight trigger/policy, credentials wildcard, cache key, CSRF와 trusted proxy를 실행하며 실제 browser/Spring integration 한계를 명시합니다.",
  objectives: ["원본 server/client CORS 관련 선언과 부재를 source evidence로 정확히 구분한다.", "origin을 scheme·host·effective port tuple로 계산하고 exact allowlist를 구현한다.", "simple request와 preflight trigger, OPTIONS/actual response를 분리 진단한다.", "requested method/headers를 최소 server policy와 교집합으로 검증한다.", "credentialed CORS, wildcard 금지와 cookie SameSite/Secure를 함께 검증한다.", "preflight cache, Vary와 CDN/proxy cache isolation을 설계한다.", "Spring MVC/Security CORS 순서와 CORS/CSRF 독립 방어를 적용한다.", "React, browser, application과 edge를 아우르는 test/telemetry/rollout을 운영한다."],
  prerequisites: [{ title: "REST Controller와 JSON 직렬화 계약", reason: "CORS는 허용된 response의 status, media type과 body contract를 바꾸지 않으므로 HTTP/JSON 계약을 먼저 알아야 preflight와 application 오류를 구분할 수 있습니다.", sessionSlug: "boot-03-rest-json-contract" }],
  keywords: ["CORS", "same-origin policy", "Origin", "preflight", "OPTIONS", "Access-Control-Allow-Origin", "Access-Control-Request-Method", "credentials", "withCredentials", "SameSite", "CSRF", "CorsConfigurationSource", "Spring Security", "Vary", "reverse proxy", "Axios"],
  topics,
  lab: {
    title: "React credentialed client와 Spring API의 최소 CORS·CSRF policy 구축",
    scenario: "synthetic origins와 cookies를 사용하는 격리 환경에서 application, Security, browser와 reverse proxy를 통과하는 effective policy를 증명합니다.",
    setup: ["JDK 21", "원본과 호환되는 Spring Boot/Security fixture", "loopback React 또는 browser test page", "두 허용/거부 synthetic origins와 TLS test endpoint", "disposable cookie/CSRF tokens", "실제 domain·credential 접근 금지", "원본 두 파일 read-only"],
    steps: ["원본 AppConfig/Http.jsx hash와 CORS absence/withCredentials evidence를 기록합니다.", "page/API origins를 scheme-host-effective-port로 표로 만들고 exact environment allowlist를 정의합니다.", "GET, JSON POST, Authorization/custom header, PUT/DELETE의 preflight trigger matrix를 capture합니다.", "OPTIONS에서 Origin, requested method와 normalized requested headers의 교집합을 검증합니다.", "credentialed policy에서 wildcard를 거부하고 exact Allow-Origin, Allow-Credentials와 Vary를 확인합니다.", "cookie SameSite/Secure/Domain/Path와 browser storage/exclusion reasons를 검증합니다.", "CorsConfigurationSource가 Spring Security 앞에서 처리되는지 filter trace로 확인합니다.", "cross-site form, missing/invalid CSRF token과 valid state change를 실행해 CORS와 CSRF를 분리합니다.", "trusted proxy에서만 forwarded metadata를 사용하고 application/gateway CORS header 소유권을 하나로 만듭니다.", "origin order/cache, success/error/redirect와 supported browser matrix를 canary하고 rollback/expiry를 rehearsal합니다."],
    expectedResult: ["허용된 exact origin만 필요한 method/header capability와 response를 읽습니다.", "credentialed response에는 wildcard가 없고 cookie와 CSRF lifecycle이 검증됩니다.", "denied origin, method, header와 CSRF failure는 stable reason으로 관측됩니다.", "preflight cache와 shared cache가 다른 origin/method permission을 섞지 않습니다.", "application test와 public edge browser 결과가 같은 effective policy를 보입니다."],
    cleanup: ["synthetic cookies, CSRF tokens, browser storage와 disposable certificates를 제거합니다.", "temporary origins/proxy routes와 verbose Security/CORS logging을 원복합니다.", "captured headers에서 token/cookie values를 제거하고 sanitized matrix만 보존합니다.", "원본 두 파일 hash/status unchanged를 readback합니다."],
    extensions: ["ephemeral preview origin registry에 owner/expiry/signature를 추가합니다.", "WebFlux 또는 API gateway stack에서 같은 matrix를 재구현합니다.", "third-party cookie 제한 환경의 BFF/token architecture를 비교합니다.", "공공데이터 외부 호출은 browser direct CORS가 아니라 Boot05 server-side adapter로 이전합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples와 실제 browser preflight를 실행해 허용·거부 근거를 표로 작성하세요.", requirements: ["scheme/host/port exact match를 확인합니다.", "JSON/Authorization/PUT preflight를 확인합니다.", "origin/method/header denial을 각각 재현합니다.", "credentials+wildcard를 거부합니다.", "cache key가 origin/method/header를 포함함을 확인합니다.", "CORS와 CSRF 결과를 분리합니다.", "forwarded spoof가 무시됨을 확인합니다."], hints: ["console message가 아니라 OPTIONS와 actual raw headers를 각각 저장하세요."], expectedOutcome: "browser request가 어느 층에서 왜 허용/거부됐는지 evidence chain으로 설명합니다.", solutionOutline: ["origin→trigger→preflight→credentials→cache→CSRF→proxy 순서입니다."] },
    { difficulty: "응용", prompt: "원본 React/Spring 조합의 production-ready CORS·CSRF migration plan을 작성하세요.", requirements: ["실제 값 없는 origin inventory를 만듭니다.", "public/credentialed clients를 분리합니다.", "exact path/method/header policy를 둡니다.", "Security filter order를 검증합니다.", "cookie/CSRF lifecycle을 설계합니다.", "Vary/CDN/cache ownership을 둡니다.", "trusted proxy sanitation을 정의합니다.", "browser-edge canary와 time-bound rollback을 포함합니다."], hints: ["withCredentials를 무조건 제거하거나 wildcard를 여는 것으로 끝내지 마세요."], expectedOutcome: "최소 권한과 운영 복구가 있는 end-to-end CORS policy가 완성됩니다.", solutionOutline: ["inventory→separate→allowlist→secure→cache→proxy→test→rollout 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 browser-to-API origin governance를 설계하세요.", requirements: ["origin 등록 owner/expiry를 정합니다.", "credentials/public endpoint 분리 기준을 둡니다.", "method/header/expose/max-age 정책을 둡니다.", "CORS/CSRF/auth 책임을 분리합니다.", "proxy/CDN header ownership과 trust를 둡니다.", "browser/application/edge test matrix를 표준화합니다.", "low-cardinality telemetry와 incident runbook을 둡니다.", "preview/tenant/custom-domain lifecycle을 포함합니다."], hints: ["header snippets가 아니라 origin capability의 신청부터 폐기까지 관리하세요."], expectedOutcome: "origin 권한이 감사·만료·검증되는 platform 표준이 완성됩니다.", solutionOutline: ["register→validate→enforce→observe→revoke 순서입니다."] },
  ],
  nextSessions: ["boot-05-public-data-json-xml"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["원본 AppConfig에는 CORS 선언이 없다는 사실만 확인했으며 전체 application의 Security filters나 deployment gateway까지 없다고 과장하지 않았습니다.", "원본 Http.jsx의 실제 environment base URL/domain 값은 공개 학습자료에 복사하지 않고 environment-derived URL, JSON default와 withCredentials 구조만 사용했습니다.", "JDK examples는 policy decision을 deterministic하게 설명하며 browser Fetch safelist의 모든 세부, Spring filter ordering, cookie vendor 정책과 proxy behavior는 실제 target stack tests가 필요합니다.", "CORS/CSRF/browser cookie 권고는 target Spring/Security/browser/CDN version과 organization threat model에 주기적으로 다시 대조해야 합니다."] },
});

export default session;
