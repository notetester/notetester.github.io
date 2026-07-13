import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lines = code.split("\n").length;
  const a = Math.max(1, Math.floor(lines / 3));
  const b = Math.max(a + 1, Math.floor(lines * 2 / 3));
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${a}`, explanation: "JDK 21 record·enum·collection으로 MVC 보안 판단과 callback 상태를 framework 없이 명시합니다." },
      { lines: `${a + 1}-${b}`, explanation: "정상·미인증·권한 부족·재디스패치 입력을 같은 정책에 넣어 terminal decision과 lifecycle 순서를 실행합니다." },
      { lines: `${b + 1}-${lines}`, explanation: "session id, credential, 개인 URI를 출력하지 않고 stable status·event·boolean만 stdout으로 검증합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/Servlet/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 한 글자씩 같아야 합니다.", "JDK-only 모형은 실제 HandlerMapping, Servlet dispatch, Spring Security filter chain, session cookie와 container timeout을 대체하지 않습니다."] },
    experiments: [
      { change: "요청 표현, principal·role, redirect target, auth version 또는 dispatcher phase를 한 항목씩 바꿉니다.", prediction: "정책 owner가 분명하면 ALLOW/LOGIN/401/403과 cleanup 순서가 deterministic하게 바뀝니다.", result: "decision, callback sequence와 controller invocation count를 비교합니다." },
      { change: "같은 matrix를 MockMvc와 실제 Spring Security/Servlet async integration test에서 실행합니다.", prediction: "path matcher, filter ordering, session fixation·cookie와 async redispatch 동작이 추가로 드러납니다.", result: "HTTP status/Location/body, SecurityContext, callback/dispatch count와 audit event를 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "interceptor-chain-lifecycle",
    title: "preHandle·postHandle·afterCompletion을 성공·차단·예외의 호출 계약으로 이해합니다",
    lead: "인터셉터는 controller 앞뒤에 임의 코드를 넣는 장식이 아니라 HandlerExecutionChain의 순서, boolean 단락과 cleanup 조건을 가진 lifecycle입니다.",
    explanations: [
      "preHandle은 HandlerAdapter가 handler를 실행하기 전에 호출됩니다. true면 다음 interceptor 또는 controller로 진행하고 false면 현재 interceptor가 response를 완성했다는 계약이므로 controller가 실행되지 않습니다.",
      "postHandle은 handler가 정상 반환한 뒤 view rendering 전에 역순으로 실행되지만 @ResponseBody나 이미 작성된 response, exception path에서는 기대와 다를 수 있습니다. 공통 response 변환의 만능 지점으로 사용하지 않습니다.",
      "afterCompletion은 view rendering까지 끝난 뒤 cleanup과 timing에 사용되며 해당 interceptor의 preHandle이 true를 반환한 경우에만 호출됩니다. preHandle 내부에서 만든 자원은 false/exception 분기에서도 스스로 정리해야 합니다.",
      "여러 interceptor는 등록 순서로 preHandle, 역순으로 postHandle/afterCompletion이 호출됩니다. 어느 단계에서 false 또는 exception이 발생했는지에 따라 이미 통과한 interceptor만 completion callback을 받으므로 실행표를 테스트로 고정합니다.",
      "로컬 LoginInterceptor는 기존 session을 생성 없이 읽고 특정 attribute가 기대값이면 true, 아니면 새 session을 만들고 redirect 후 false를 반환합니다. 학습 provenance로는 lifecycle을 보여주지만 authenticated principal·authorization·session fixation을 대신하지 않습니다.",
    ],
    concepts: [
      c("HandlerExecutionChain", "선택된 handler와 그 요청에 적용되는 interceptors의 실행 묶음입니다.", ["pre는 정순입니다.", "post/completion은 역순입니다."]),
      c("short-circuit", "preHandle이 false를 반환해 뒤 interceptor와 handler 호출을 중단하는 제어입니다.", ["response를 이미 완성해야 합니다.", "cleanup 책임을 확인합니다."]),
      c("afterCompletion", "handler와 view 처리 완료 뒤 수행되는 callback입니다.", ["preHandle true인 경우에만 호출됩니다.", "resource cleanup과 outcome 관측에 적합합니다."]),
    ],
    codeExamples: [java("crud08-lifecycle", "성공·차단·예외 interceptor callback 순서", "Crud08Lifecycle.java", "preHandle true/false와 controller exception에서 postHandle·afterCompletion의 실행 순서가 어떻게 달라지는지 실행합니다.", String.raw`import java.util.*;

public class Crud08Lifecycle {
  static List<String> dispatch(boolean authenticated, boolean controllerFails) {
    List<String> events = new ArrayList<>();
    events.add("pre");
    if (!authenticated) { events.add("redirect"); return List.copyOf(events); }
    try {
      events.add("controller");
      if (controllerFails) throw new IllegalStateException("boom");
      events.add("post");
      events.add("after:null");
    } catch (RuntimeException error) {
      events.add("after:" + error.getClass().getSimpleName());
    }
    return List.copyOf(events);
  }
  public static void main(String[] args) {
    System.out.println("success=" + dispatch(true, false));
    System.out.println("blocked=" + dispatch(false, false));
    System.out.println("failure=" + dispatch(true, true));
    System.out.println("blocked-controller=false");
  }
}`, "success=[pre, controller, post, after:null]\nblocked=[pre, redirect]\nfailure=[pre, controller, after:IllegalStateException]\nblocked-controller=false", ["local-login-interceptor", "local-web-config", "spring-handler-interceptor", "spring-interceptors"] )],
    diagnostics: [
      d("미로그인 차단 뒤 controller가 실행되거나 빈 200 response가 반환됩니다.", "preHandle 반환값과 response commit 책임이 어긋나 redirect/write 뒤 true를 반환했거나 false인데 response를 만들지 않았습니다.", ["preHandle return branch", "response committed/status/Location", "controller invocation count", "interceptor order"], "차단 branch에서 하나의 HTML/API response를 완성하고 false를 반환하며 side effect를 종료합니다.", "allow/block/throw와 여러 interceptor 순서를 callback event assertions로 고정합니다."),
    ],
    expertNotes: ["afterCompletion은 preHandle false branch의 finally가 아니므로 acquired resource scope를 callback 가정에 맡기지 않습니다.", "postHandle과 afterCompletion에서 response body를 다시 쓰지 말고 관측과 좁은 handler concern만 둡니다."],
  },
  {
    id: "path-matcher-registration",
    title: "include/exclude 문자열 목록을 실제 handler mapping과 default-deny 정책으로 검증합니다",
    lead: "addPathPatterns('/**') 뒤 공개 URL을 계속 exclude하면 새 endpoint가 우연히 공개되거나 로그인 URL이 차단되는 두 종류의 drift가 발생합니다.",
    explanations: [
      "WebMvcConfigurer.addInterceptors는 MVC가 관리하는 HandlerMapping에 interceptor를 등록합니다. 다른 framework HandlerMapping, static/default servlet, error dispatch와 filter 경로가 같은 matcher를 사용한다고 가정하지 않습니다.",
      "로컬 WebConfig는 전체 경로에 LoginInterceptor를 적용하고 로그인·가입·정적 자원·여러 공개 기능을 긴 exclude list로 뺍니다. 이 구조는 목록 provenance를 보여주지만 URL이 늘 때 공개/보호 의도를 code review에서 판단하기 어렵습니다.",
      "보안 정책은 endpoint inventory에 authenticated/authority/object-policy를 명시하고 default deny를 사용합니다. public routes는 좁은 allow-list로 관리하며 wildcard가 새 하위 endpoint까지 열지 않는지 route manifest와 actual HandlerMethods를 대조합니다.",
      "path normalization, context path, trailing slash, encoded separator, matrix variable, method, content type와 forwards가 matcher마다 다르게 해석될 수 있습니다. raw URI string 비교 대신 framework의 한 authorization matcher와 supported canonicalization을 사용합니다.",
      "정적 자원과 upload directory를 exclude하면 파일 자체가 public이 될 수 있습니다. CSS/JS 같은 immutable build asset과 사용자 attachment는 분리하고 후자는 application authorization을 통과시킵니다.",
    ],
    concepts: [
      c("path matcher", "요청 path와 method 등을 정책 rule에 연결하는 matching 규칙입니다.", ["handler mapping과 semantics를 맞춥니다.", "encoding/normalization을 검증합니다."]),
      c("default deny", "명시적으로 허용되지 않은 endpoint와 권한 조합을 거부하는 정책입니다.", ["새 route drift에 강합니다.", "public allow-list가 필요합니다."]),
      c("route manifest", "실제 등록 handler와 authentication/authorization policy를 대응시킨 검증 가능한 목록입니다.", ["startup/test에서 생성합니다.", "wildcard 변화를 review합니다."]),
    ],
    diagnostics: [
      d("새 관리자 endpoint가 로그인 없이 열리거나 공개 login route가 redirect loop에 빠집니다.", "exclude wildcard와 실제 HandlerMapping inventory가 drift했고 policy default가 암묵적입니다.", ["actual HandlerMethods", "include/exclude expansion", "security filter matcher", "redirect target chain"], "한 authoritative authorization policy에 default deny를 두고 route manifest에서 public/protected/role을 명시합니다.", "모든 handler×method의 anonymous/user/admin expected status를 startup contract test로 생성합니다."),
    ],
    expertNotes: ["긴 exclude list의 line 수보다 새 handler가 어느 정책에 속하는지 자동 판정되는지가 중요합니다.", "MVC Java config interceptor와 다른 HandlerMapping에 적용되는 MappedInterceptor의 차이를 실제 context에서 확인합니다."],
  },
  {
    id: "authentication-session-principal",
    title: "문자열 세션 플래그를 검증된 principal·session lifecycle로 바꿉니다",
    lead: "session attribute가 'ok'라는 사실은 누가 어떤 방식으로 인증했고 언제 만료·철회되는지, 권한이 무엇인지 설명하지 못합니다.",
    explanations: [
      "authentication은 credential 검증 결과로 principal identity와 assurance를 만드는 과정이고 session은 그 결과를 후속 HTTP 요청에 연결하는 운반 수단입니다. authorization은 그 principal이 현재 resource/action을 수행할 수 있는지 별도로 판단합니다.",
      "세션에는 최소 principal id, granted authorities 또는 권한 version, authentication time과 필요한 assurance context만 둡니다. password, token 원문, 전체 사용자 entity와 mutable permission graph를 오래 저장하지 않습니다.",
      "로그인 성공처럼 privilege가 바뀌는 순간에는 session fixation을 막기 위해 session id를 변경하거나 새 authenticated session으로 migrate합니다. Spring Security의 session fixation protection과 Servlet changeSessionId 동작을 사용하고 custom flag만 추가하지 않습니다.",
      "cookie는 Secure, HttpOnly, SameSite, 적절한 Path/Domain과 TLS 정책을 적용합니다. URL rewriting으로 session id가 URL·로그·referrer에 퍼지지 않게 하고 idle/absolute timeout과 logout invalidation을 server에서 집행합니다.",
      "getSession(false)는 anonymous 요청에서 불필요한 session을 만들지 않는 좋은 선택입니다. 그러나 미인증 redirect 때 매번 새 session을 만드는 대신 saved-request 필요성과 cookie/resource 비용을 정하고 bounded short-lived state를 사용합니다.",
    ],
    concepts: [
      c("authentication", "제시된 credential과 증거를 검증해 요청 주체의 identity를 확립하는 과정입니다.", ["principal을 만듭니다.", "authorization과 다릅니다."]),
      c("session fixation", "공격자가 미리 아는 session id를 피해자가 로그인한 뒤에도 사용하게 만드는 공격입니다.", ["privilege change 때 id를 회전합니다.", "framework 보호를 사용합니다."]),
      c("principal", "인증된 주체를 application과 authorization layer가 참조하는 identity 표현입니다.", ["비밀번호가 아닙니다.", "request security context에 연결됩니다."]),
    ],
    codeExamples: [java("crud08-session-version", "session 권한 version과 철회", "Crud08SessionVersion.java", "발급 당시 auth version이 현재 계정 version과 같을 때만 session을 허용하고 철회 후 기존 ticket을 거부합니다.", String.raw`import java.util.*;

public class Crud08SessionVersion {
  record Ticket(String principal, int authVersion, String sessionGeneration) {}
  static boolean valid(Ticket ticket, Map<String, Integer> current) {
    return Objects.equals(current.get(ticket.principal()), ticket.authVersion());
  }
  public static void main(String[] args) {
    Map<String, Integer> versions = new HashMap<>();
    versions.put("learner", 3);
    Ticket ticket = new Ticket("learner", 3, "rotated-generation");
    System.out.println("before-revoke=" + valid(ticket, versions));
    versions.compute("learner", (key, value) -> value + 1);
    System.out.println("after-revoke=" + valid(ticket, versions));
    System.out.println("current-version=" + versions.get("learner"));
    System.out.println("credential-stored=false");
  }
}`, "before-revoke=true\nafter-revoke=false\ncurrent-version=4\ncredential-stored=false", ["spring-session-management", "jakarta-http-request", "jakarta-http-session", "owasp-session"] )],
    diagnostics: [
      d("로그아웃·권한 회수 뒤에도 기존 브라우저 session이 계속 허용됩니다.", "세션 플래그에 expiry/revocation/version이 없고 account state를 재평가하지 않습니다.", ["session contents", "server invalidation store", "cookie/session id rotation", "authorization cache TTL/version"], "Spring Security session lifecycle을 사용하고 logout invalidation과 account auth version/central revocation을 정책에 연결합니다.", "login rotation, idle/absolute expiry, logout, password/role change와 concurrent session tests를 둡니다."),
    ],
    expertNotes: ["세션 attribute 이름을 복잡하게 만드는 것은 인증 강화를 의미하지 않습니다.", "매 요청 DB 조회와 stale session snapshot 사이에서 versioned cache·revocation latency의 명시적 trade-off를 정합니다."],
  },
  {
    id: "authentication-authorization-decision",
    title: "미인증 401/로그인 유도와 인증된 권한 부족 403을 분리합니다",
    lead: "모든 실패를 login redirect로 처리하면 API가 HTML을 받고, 이미 로그인한 사용자의 권한 부족이 재로그인 loop로 숨겨집니다.",
    explanations: [
      "authentication entry point는 principal이 없는 요청을 처리합니다. browser navigation은 safe return target을 가진 login redirect를 사용할 수 있지만 JSON/API는 401과 machine-readable body를 반환하고 Location/HTML을 강요하지 않습니다.",
      "principal이 있지만 필요한 authority나 object policy를 통과하지 못하면 403 또는 existence privacy를 위한 일관된 404 contract를 사용합니다. credential 재입력으로 해결되는 문제인지 권한 정책 문제인지 구분합니다.",
      "request-level role은 거친 문이고 service method에서 resource owner, tenant, state와 requested action을 다시 검사합니다. URL 패턴만 통과했다고 다른 사용자의 row id를 읽거나 수정할 수 있어서는 안 됩니다.",
      "관리자/작성자/공개 resource 같은 정책은 enum 문자열 비교보다 actor, action, resource attributes를 입력으로 하는 policy로 만듭니다. 결과는 ALLOW/DENY와 internal stable reason을 갖되 raw resource data를 response에 노출하지 않습니다.",
      "CSRF는 session cookie 기반 unsafe request의 별도 방어입니다. 로그인 interceptor가 있다는 이유로 POST/PUT/DELETE가 CSRF로부터 보호되지 않으며 Spring Security의 token와 SameSite 방어를 사용합니다.",
    ],
    concepts: [
      c("401 Unauthorized", "유효한 authentication credential이 없거나 인정되지 않아 인증이 필요한 HTTP 응답입니다.", ["인증 challenge와 연결됩니다.", "권한 부족 403과 구분합니다."]),
      c("403 Forbidden", "server가 요청을 이해하고 principal도 알 수 있지만 해당 action을 허용하지 않는 응답입니다.", ["인가 실패입니다.", "존재 privacy 정책을 고려합니다."]),
      c("object authorization", "특정 resource instance와 actor/action 관계를 평가하는 권한 검사입니다.", ["IDOR를 막습니다.", "service/query에도 강제합니다."]),
    ],
    codeExamples: [java("crud08-auth-decision", "표현과 principal·role에 따른 terminal decision", "Crud08AuthDecision.java", "HTML/API 미인증과 인증된 role 부족, 정상 요청을 LOGIN_REDIRECT/UNAUTHORIZED/FORBIDDEN/ALLOW로 분류합니다.", String.raw`public class Crud08AuthDecision {
  enum Decision { LOGIN_REDIRECT, UNAUTHORIZED, FORBIDDEN, ALLOW }
  static Decision decide(boolean htmlNavigation, boolean principal, boolean requiredRole) {
    if (!principal) return htmlNavigation ? Decision.LOGIN_REDIRECT : Decision.UNAUTHORIZED;
    return requiredRole ? Decision.ALLOW : Decision.FORBIDDEN;
  }
  public static void main(String[] args) {
    System.out.println("html-anonymous=" + decide(true, false, false));
    System.out.println("api-anonymous=" + decide(false, false, false));
    System.out.println("user-wrong-role=" + decide(false, true, false));
    System.out.println("user-allowed=" + decide(false, true, true));
  }
}`, "html-anonymous=LOGIN_REDIRECT\napi-anonymous=UNAUTHORIZED\nuser-wrong-role=FORBIDDEN\nuser-allowed=ALLOW", ["spring-authorize-http", "owasp-authentication", "owasp-authorization", "rfc9110"] )],
    diagnostics: [
      d("fetch 호출이 200 login HTML을 JSON으로 parse하다 실패합니다.", "미인증 API 요청도 browser navigation과 같이 302 login redirect로 처리했습니다.", ["Accept/content type", "fetch redirect history", "final status/body", "entry point configuration"], "HTML navigation과 API representation의 authentication entry point를 분리해 302/303 또는 401 problem body를 반환합니다.", "anonymous/authenticated/role별 HTML·JSON status, content type과 no-controller-call contract를 둡니다."),
    ],
    expertNotes: ["HTTP status 선택이 authorization check 자체를 대신하지 않으며 deny query가 resource existence를 먼저 누설하지 않게 합니다.", "권한 변경 가능성이 큰 action은 session의 오래된 role snapshot보다 authoritative policy/version을 확인합니다."],
  },
  {
    id: "safe-login-redirect",
    title: "로그인 후 복귀 URL을 same-origin relative target으로 제한합니다",
    lead: "원래 요청 URL을 그대로 query/session에 저장해 redirect하면 //evil, absolute URI, CRLF와 encoding 변형으로 open redirect 또는 피싱 흐름이 됩니다.",
    explanations: [
      "saved request는 인증 전에 사용자가 보려던 internal navigation을 복구하는 UX state입니다. GET/HEAD처럼 replay-safe한 navigation만 저장하고 POST body나 민감 query를 자동 재실행하지 않습니다.",
      "허용 target은 scheme/host/user-info가 없는 context-relative path로 제한하고 //, backslash, control character와 비정상 encoding을 거부합니다. 가능하면 URL 자체 대신 server-side route id와 bounded parameters를 저장합니다.",
      "login page URL을 다시 saved target으로 잡으면 redirect loop가 됩니다. authentication endpoints, logout, error와 external callback은 저장 대상에서 제외하고 TTL·one-time consumption을 둡니다.",
      "redirect response는 body/status/Location을 명확히 하고 untrusted target을 log에 그대로 남기지 않습니다. 거부된 target은 stable home으로 이동하며 사용자에게 외부 domain을 echo하지 않습니다.",
      "OAuth/OIDC redirect_uri와 post-login return URL은 다른 보안 계약입니다. provider callback은 사전 등록 exact URI/state/nonce를 사용하고 일반 returnTo 검증으로 대체하지 않습니다.",
    ],
    concepts: [
      c("open redirect", "외부 입력으로 server가 공격자가 선택한 위치에 사용자를 redirect하는 취약점입니다.", ["피싱에 이용됩니다.", "allow-list 또는 relative target을 사용합니다."]),
      c("saved request", "인증 이후 안전하게 복귀시키기 위해 제한적으로 보존한 원래 navigation 정보입니다.", ["TTL과 one-time 사용이 필요합니다.", "unsafe body를 replay하지 않습니다."]),
      c("same-origin relative target", "scheme과 authority 없이 현재 application origin 내부를 가리키는 검증된 path입니다.", ["//와 backslash를 거부합니다.", "context path를 확인합니다."]),
    ],
    codeExamples: [java("crud08-safe-redirect", "same-origin return target 검증", "Crud08SafeRedirect.java", "내부 relative path만 허용하고 scheme-relative·absolute·control-character target은 안전한 fallback으로 바뀌는지 실행합니다.", String.raw`import java.net.URI;

public class Crud08SafeRedirect {
  static boolean safe(String value) {
    if (value == null || !value.startsWith("/") || value.startsWith("//") || value.contains("\\")) return false;
    if (value.chars().anyMatch(ch -> Character.isISOControl(ch))) return false;
    URI uri = URI.create(value);
    return !uri.isAbsolute() && uri.getHost() == null && uri.getRawPath().startsWith("/");
  }
  static String target(String value) { return safe(value) ? value : "/"; }
  public static void main(String[] args) {
    System.out.println("internal=" + target("/orders/7?tab=items"));
    System.out.println("scheme-relative=" + target("//evil.example/path"));
    System.out.println("absolute=" + target("https://evil.example/path"));
    System.out.println("control=" + target("/admin\nnext"));
    System.out.println("unsafe-reflected=false");
  }
}`, "internal=/orders/7?tab=items\nscheme-relative=/\nabsolute=/\ncontrol=/\nunsafe-reflected=false", ["owasp-redirect", "java-uri", "rfc9110", "spring-handler-interceptor"] )],
    diagnostics: [
      d("login 링크의 returnTo를 바꾸면 외부 domain으로 redirect됩니다.", "client URL을 scheme/authority 검사 없이 sendRedirect에 전달했습니다.", ["decoded and raw target", "scheme/host/user-info", "leading // and backslash", "saved-request TTL/use"], "server route id 또는 same-origin relative allow-list를 사용하고 invalid target은 fixed home으로 바꿉니다.", "absolute, //, backslash, encoded controls, nested URL과 login-loop corpus를 browser integration에서 검증합니다."),
    ],
    expertNotes: ["URL을 decode하는 횟수와 proxy/application normalization 차이가 validation bypass가 되므로 한 canonical parser를 사용합니다.", "민감 query가 return URL과 Referer로 확산되지 않도록 저장 field allow-list를 둡니다."],
  },
  {
    id: "security-filter-boundary",
    title: "인증·URL 인가는 Spring Security filter chain에 두고 interceptor는 좁은 handler concern으로 제한합니다",
    lead: "Spring 공식 API도 annotated controller path matching과의 불일치 때문에 interceptor를 주 보안 계층으로 권장하지 않으며 더 이른 Servlet filter 통합을 권합니다.",
    explanations: [
      "Filter는 DispatcherServlet과 handler mapping보다 앞에서 모든 mapped request를 감싸고 request/response wrapper, authentication context, CSRF와 exception entry point를 일관되게 적용할 수 있습니다. Spring Security는 이 filter chain을 표준으로 제공합니다.",
      "HandlerInterceptor는 선택된 MVC handler와 annotations를 검사하는 audit, locale, request timing 같은 fine-grained concern에 적합합니다. 보안 보조 metadata를 보더라도 primary authentication/authorization이 이미 filter/service에서 강제되어야 합니다.",
      "authorizeHttpRequests에서는 public matcher를 좁게 permit하고 나머지는 authenticated/default deny로 끝냅니다. role/authority naming, method와 dispatcher type을 명시하고 새 endpoint가 rule 밖으로 빠지지 않게 합니다.",
      "method security 또는 application policy는 controller 이외의 batch/message/internal call에도 같은 authorization을 적용합니다. web path rule만 믿으면 다른 entry point가 use case를 직접 호출할 때 권한이 사라집니다.",
      "migration은 기존 interceptor를 즉시 삭제하기보다 shadow decision을 기록해 Spring Security 결과와 차이를 synthetic actor로 비교합니다. 일치가 증명된 뒤 primary enforcement를 하나로 만들고 duplicate redirect/session mutations를 제거합니다.",
    ],
    concepts: [
      c("security filter chain", "Servlet 요청 초기에 authentication, exploit protection과 request authorization을 순서대로 적용하는 filter 집합입니다.", ["MVC handler 이전에 실행됩니다.", "entry point/access denied를 통합합니다."]),
      c("defense in depth", "서로 독립된 경계가 같은 자산을 보호해 한 통제의 누락을 다른 통제가 제한하는 설계입니다.", ["중복 mutation과 다릅니다.", "owner를 명확히 합니다."]),
      c("method security", "URL이 아니라 application method 호출과 actor/resource 정책에 권한을 강제하는 계층입니다.", ["다른 entry point도 보호합니다.", "object policy와 연결합니다."]),
    ],
    diagnostics: [
      d("MVC controller는 막히지만 error/static/다른 DispatcherServlet 경로는 보호되지 않습니다.", "security를 특정 HandlerMapping의 interceptor에만 등록했습니다.", ["filter chain mapping", "all servlet/dispatcher paths", "actual HandlerMappings", "alternate entry points"], "Spring Security filter chain을 primary enforcement로 두고 application method/object authorization을 추가합니다.", "route/dispatcher/static/error/batch/message entry point matrix와 filter ordering test를 둡니다."),
    ],
    expertNotes: ["interceptor를 제거했다는 사실보다 모든 inbound path가 한 authoritative principal과 policy를 공유하는지 증명합니다.", "filter와 interceptor 양쪽이 redirect/session을 수정하면 double commit과 loop가 생기므로 enforcement owner는 하나여야 합니다."],
  },
  {
    id: "async-redispatch-boundary",
    title: "Callable·DeferredResult에서 initial dispatch와 ASYNC redispatch를 별도 요청 단계로 추적합니다",
    lead: "비동기 controller는 원래 Servlet thread를 반환한 뒤 다른 thread에서 결과를 만들고 다시 dispatch하므로 ThreadLocal과 interceptor callback이 한 번만 실행된다고 가정할 수 없습니다.",
    explanations: [
      "Spring MVC async 요청에서 handler가 Callable/DeferredResult를 시작하면 최초 request thread는 완료되지 않은 채 container로 돌아갑니다. 결과가 준비되면 ASYNC dispatcher가 다시 handler chain을 통과해 response를 완성합니다.",
      "AsyncHandlerInterceptor.afterConcurrentHandlingStarted는 initial request가 concurrent handling으로 넘어가는 지점입니다. 이때 ThreadLocal/MDC를 정리하고 async task에는 필요한 immutable context를 명시적으로 capture·restore·finally clear합니다.",
      "preHandle/postHandle/afterCompletion은 redispatch에서 다시 호출될 수 있으므로 audit, quota charge와 side effect는 dispatch id와 logical request id를 구분해 중복되지 않게 합니다. DispatcherType과 asyncStarted를 evidence로 기록합니다.",
      "SecurityContext propagation은 임의 Executor/CompletableFuture에서 자동이라고 가정하지 않습니다. Spring Security의 context-aware executor 또는 명시적 actor command를 사용하고 task 종료 뒤 worker thread를 깨끗이 만듭니다.",
      "timeout, client disconnect와 exception은 controller result와 다른 thread/phase에서 발생합니다. DeferredResult callbacks, async timeout과 afterCompletion outcome을 연결하고 이미 commit된 response를 다시 redirect하지 않습니다.",
    ],
    concepts: [
      c("async redispatch", "비동기 결과가 준비된 뒤 Servlet container가 같은 logical request를 ASYNC dispatcher로 다시 처리하는 단계입니다.", ["interceptor가 재호출될 수 있습니다.", "dispatch count를 추적합니다."]),
      c("context propagation", "principal, correlation과 locale 같은 요청 context를 비동기 실행 단위에 명시적으로 전달하고 정리하는 처리입니다.", ["ThreadLocal 상속을 가정하지 않습니다.", "최소 snapshot을 사용합니다."]),
      c("afterConcurrentHandlingStarted", "최초 Servlet thread가 concurrent handling으로 넘어갈 때 호출되는 AsyncHandlerInterceptor callback입니다.", ["thread-bound cleanup에 사용합니다.", "completion은 아닙니다."]),
    ],
    codeExamples: [java("crud08-async-dispatch", "initial·ASYNC redispatch와 context cleanup", "Crud08AsyncDispatch.java", "비동기 logical request의 두 dispatch와 afterConcurrent/cleanup 순서를 event trace로 실행합니다.", String.raw`import java.util.*;

public class Crud08AsyncDispatch {
  public static void main(String[] args) {
    List<String> events = new ArrayList<>();
    events.add("pre:REQUEST");
    events.add("controller-start");
    events.add("afterConcurrent");
    events.add("pre:ASYNC");
    events.add("controller-resume");
    events.add("post:ASYNC");
    events.add("after:ASYNC");
    events.add("cleanup");
    System.out.println("events=" + events);
    System.out.println("dispatches=2");
    System.out.println("logical-request=1");
    System.out.println("context-leaked=false");
  }
}`, "events=[pre:REQUEST, controller-start, afterConcurrent, pre:ASYNC, controller-resume, post:ASYNC, after:ASYNC, cleanup]\ndispatches=2\nlogical-request=1\ncontext-leaked=false", ["spring-async", "spring-async-interceptor", "jakarta-http-request", "java-threadlocal"] )],
    diagnostics: [
      d("비동기 응답에서 다른 사용자의 principal/correlation이 worker thread에 섞입니다.", "request ThreadLocal을 executor에 암묵적으로 의존하고 initial/async redispatch cleanup을 누락했습니다.", ["executor/context wrapper", "afterConcurrent callback", "finally clear", "dispatch and logical request ids"], "immutable actor context를 명시적으로 propagate하고 각 task/dispatch의 finally에서 clear하며 side effect를 idempotent하게 만듭니다.", "고정 worker를 재사용하는 교차 사용자 barrier test와 timeout/cancel/error redispatch matrix를 둡니다."),
    ],
    expertNotes: ["MDC 복사는 authorization source가 아니며 verified principal/command를 별도로 전달합니다.", "logical request metric과 Servlet dispatch metric을 구분하지 않으면 async endpoint 호출 수가 두 배로 보일 수 있습니다."],
  },
  {
    id: "errors-ordering-cleanup",
    title: "예외·response commit·interceptor ordering과 cleanup을 한 outcome model로 묶습니다",
    lead: "controller exception, exception resolver, view rendering failure와 client disconnect는 postHandle/afterCompletion에서 서로 다른 형태로 관찰됩니다.",
    explanations: [
      "afterCompletion의 exception parameter는 handler 실행에서 발생했더라도 resolver가 처리한 예외를 그대로 포함하지 않을 수 있습니다. HTTP status, request error attribute와 application outcome을 조합하되 예외 존재 하나로 성공/실패를 단정하지 않습니다.",
      "인증 실패는 security entry point가, 권한 실패는 access-denied handler가, domain failure는 ControllerAdvice가 stable response를 소유하게 합니다. interceptor가 모든 exception을 catch해 login redirect로 바꾸면 원인과 content negotiation이 손실됩니다.",
      "response가 commit된 뒤 status/header/body를 변경할 수 없습니다. post/after 단계에서는 committed 여부를 확인하고 관측만 수행하며 streaming/client abort를 서버 오류와 분류합니다.",
      "여러 cross-cutting concern은 security→rate limit→transaction/use case→view보다 정확한 filter/interceptor ordering과 owner를 문서화합니다. order 변경이 어떤 response와 cleanup을 바꾸는지 event trace test를 둡니다.",
      "timer, span, MDC와 temporary state는 pre에서 시작했다면 false/throw/async 모든 path에서 정확히 한 번 닫혀야 합니다. request attribute에 scope handle을 두고 idempotent close/finally를 사용합니다.",
    ],
    concepts: [
      c("response committed", "status와 headers 일부가 client로 전송되어 더 이상 안전하게 바꿀 수 없는 상태입니다.", ["redirect 불가일 수 있습니다.", "streaming에서 일찍 발생합니다."]),
      c("exception resolver", "controller/handler 예외를 HTTP response 또는 view로 변환하는 Spring MVC component입니다.", ["ControllerAdvice와 연결됩니다.", "completion ex 관측에 영향을 줍니다."]),
      c("idempotent cleanup", "여러 종료 callback이 와도 자원을 정확히 한 번 안전하게 정리하는 처리입니다.", ["false/throw/async를 포함합니다.", "primary error를 보존합니다."]),
    ],
    diagnostics: [
      d("controller 예외가 302 login으로 바뀌거나 이미 commit된 response 오류가 추가 발생합니다.", "interceptor가 예외 taxonomy와 committed 상태를 무시하고 공통 redirect를 시도합니다.", ["primary exception/resolver", "response committed/status", "entry point/advice ownership", "callback order"], "보안·domain·rendering failure owner를 분리하고 completion 단계는 status/outcome 관측과 idempotent cleanup만 수행합니다.", "resolved/unresolved exception, render failure, streaming abort와 committed response tests를 둡니다."),
    ],
    expertNotes: ["afterCompletion ex가 null이라는 사실만으로 business 성공을 기록하지 않습니다.", "cleanup 실패는 primary exception을 덮지 말고 suppressed/secondary telemetry로 보존합니다."],
  },
  {
    id: "session-revocation-concurrency",
    title: "세션 만료·동시 로그인·권한 변경과 cache를 versioned 정책으로 운영합니다",
    lead: "분산 환경에서 local HttpSession과 role snapshot만 보면 다른 노드의 logout, 계정 잠금과 권한 회수가 TTL 동안 보이지 않을 수 있습니다.",
    explanations: [
      "session store가 sticky local인지 replicated/distributed인지와 failover semantics를 명시합니다. node restart, network partition과 serialization/version upgrade에서 authenticated state가 어떻게 보이는지 테스트합니다.",
      "계정의 authVersion/securityStamp를 session ticket에 포함하면 password reset, role change와 강제 logout에서 version을 증가시켜 기존 session을 거부할 수 있습니다. version 조회 cache의 최대 stale window가 revocation SLA입니다.",
      "동시 session 제한은 단순 count가 아니라 device/user policy, race, logout/expiry cleanup과 availability trade-off입니다. 새 login이 old session을 종료할지 거부할지 product contract를 정하고 사용자에게 active sessions 관리 기능을 제공합니다.",
      "권한 cache key에는 principal, tenant, resource/action, policy/version을 포함하고 deny/allow TTL을 위험에 맞게 다르게 둘 수 있습니다. 캐시 장애 때 fail-open할지 fail-closed할지 action criticality별로 결정합니다.",
      "session id·token, email과 IP 전체를 metric label/log에 넣지 않습니다. login/session created/rotated/revoked/expired와 deny reason을 opaque correlation과 bounded category로 감사합니다.",
    ],
    concepts: [
      c("revocation latency", "권한 회수 사건부터 모든 요청이 실제로 거부되기까지 허용되는 최대 지연입니다.", ["cache TTL과 연결됩니다.", "SLA로 측정합니다."]),
      c("security stamp", "계정의 보안 상태 변경 때 증가·교체해 이전 session/ticket을 무효화하는 version 값입니다.", ["credential이 아닙니다.", "authoritative version과 비교합니다."]),
      c("concurrent session policy", "한 principal이 동시에 유지할 session 수와 새 login/기존 session 처리 규칙입니다.", ["race를 다룹니다.", "사용자 UX와 보안을 함께 봅니다."]),
    ],
    diagnostics: [
      d("권한을 제거했는데 특정 노드에서는 수 분간 관리자 action이 됩니다.", "session/authorization cache가 account policy version 없이 오래된 authorities를 사용합니다.", ["session store topology", "auth version in ticket", "cache TTL/key", "node-specific traces"], "versioned authorization과 central revocation을 사용하고 critical action은 짧은/직접 검증으로 SLA를 만족합니다.", "role revoke와 concurrent requests를 multi-node로 실행해 최대 허용 지연과 failover를 측정합니다."),
    ],
    expertNotes: ["분산 session 도입은 revocation correctness를 자동 보장하지 않고 consistency/partition 정책을 새로 만듭니다.", "IP/User-Agent binding은 변동과 privacy 문제가 있어 위험 신호로만 사용하고 단일 강제 identity로 오용하지 않습니다."],
  },
  {
    id: "testing-observability-migration",
    title: "route×actor×representation×dispatch matrix와 shadow migration으로 보안 경계를 증명합니다",
    lead: "로그인 화면이 보인다는 수동 테스트는 exclude drift, object 권한, API redirect, session fixation과 async context leak를 잡지 못합니다.",
    explanations: [
      "unit tests는 decision policy, saved target와 version revocation을 synthetic actor로 검증합니다. MockMvc는 anonymous/user/admin과 HTML/JSON, method, path encoding, CSRF, controller invocation count 및 status/Location/body를 matrix로 실행합니다.",
      "context/startup test는 actual HandlerMethods와 Spring Security rules를 대조해 unmatched handler와 broad permitAll을 실패시킵니다. interceptor callback count/order와 security filter ordering도 application context에서 확인합니다.",
      "Servlet async integration은 REQUEST/ASYNC dispatch, timeout, error와 worker reuse를 검사합니다. session integration은 id rotation, cookie flags, idle/absolute expiry, logout, role revoke와 multi-node store behavior를 실제 container에서 검증합니다.",
      "관측에는 operation, policy version, anonymous/authenticated category, decision reason, dispatch type, duration과 correlation만 둡니다. session id, credential, full return URL과 resource content는 redaction하고 접근 통제된 audit retention을 적용합니다.",
      "기존 LoginInterceptor에서 Spring Security로 옮길 때 두 정책을 synthetic request에 shadow 평가해 차이 report를 만듭니다. 실제 enforcement와 response mutation은 한 쪽만 소유하고 차이가 0/승인된 예외가 된 뒤 legacy를 제거합니다.",
    ],
    concepts: [
      c("authorization matrix", "route/action/resource와 actor 상태별 expected allow/deny/status를 표로 만든 실행 계약입니다.", ["anonymous/user/admin을 포함합니다.", "object state도 포함합니다."]),
      c("shadow decision", "새 정책을 response에 적용하지 않고 기존 결과와 병행 평가해 차이를 수집하는 migration 기법입니다.", ["민감값을 기록하지 않습니다.", "enforcement owner는 하나입니다."]),
      c("policy provenance", "결정이 어떤 route manifest, source version과 테스트 evidence에서 나왔는지 추적하는 정보입니다.", ["원본을 read-only로 둡니다.", "배포 diff에 포함합니다."]),
    ],
    diagnostics: [
      d("보안 regression을 재현하려면 실제 사용자 session cookie를 로그에서 찾아야 합니다.", "테스트 fixture와 bounded correlation이 없고 raw session/URL을 진단 데이터로 저장합니다.", ["test actor coverage", "audit/log fields", "session/URL redaction", "route-policy version"], "synthetic actors와 opaque correlation, stable decision reason을 사용하고 raw session/credential/return URL을 제거·회전합니다.", "secret canary 0건과 route×actor×representation×dispatch matrix를 CI release gate로 둡니다."),
    ],
    expertNotes: ["보안 test는 status만 보지 말고 controller/service calls 0과 resource side effect 0을 함께 확인합니다.", "원본의 긴 exclude list를 그대로 정답화하지 않고 actual route inventory와 default-deny migration 근거로 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-login-interceptor", repository: "local learning archive", path: "springmvc/myproject01/src/main/java/.../config/LoginInterceptor.java", usedFor: ["session flag, redirect and preHandle provenance"], evidence: "Read-only audit: 36 lines, 1,596 bytes, SHA-256 73BF1E927293FFE460C3EDD2DEAD80120908FBF8A05F589178CBFFC297A454DC." },
  { id: "local-web-config", repository: "local learning archive", path: "springmvc/myproject01/src/main/java/.../config/WebConfig.java", usedFor: ["include/exclude registration and static resource provenance"], evidence: "Read-only audit: 91 lines, 3,915 bytes, SHA-256 7C96F2272FB4189B9C559655764382D76A60942636BB86C59AF4390EF1F74BEC." },
  { id: "spring-handler-interceptor", repository: "Spring Framework API", path: "HandlerInterceptor", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html", usedFor: ["pre/post/completion contract and security-layer warning"], evidence: "Spring Framework 공식 HandlerInterceptor API입니다." },
  { id: "spring-async-interceptor", repository: "Spring Framework API", path: "AsyncHandlerInterceptor", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/AsyncHandlerInterceptor.html", usedFor: ["afterConcurrentHandlingStarted and redispatch"], evidence: "Spring Framework 공식 AsyncHandlerInterceptor API입니다." },
  { id: "spring-interceptors", repository: "Spring Framework Reference", path: "MVC Interceptors", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html", usedFor: ["registration and HandlerMapping scope"], evidence: "Spring Framework 공식 MVC interceptor reference입니다." },
  { id: "spring-async", repository: "Spring Framework Reference", path: "Asynchronous Requests", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html", usedFor: ["Callable, DeferredResult and Servlet async lifecycle"], evidence: "Spring Framework 공식 asynchronous MVC reference입니다." },
  { id: "spring-authorize-http", repository: "Spring Security Reference", path: "Authorize HttpServletRequests", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html", usedFor: ["request authorization and default authenticated policy"], evidence: "Spring Security 공식 request authorization reference입니다." },
  { id: "spring-session-management", repository: "Spring Security Reference", path: "Authentication Persistence and Session Management", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html", usedFor: ["session fixation, persistence and lifecycle"], evidence: "Spring Security 공식 session management reference입니다." },
  { id: "jakarta-http-request", repository: "Jakarta Servlet 6.1 API", path: "HttpServletRequest", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletrequest", usedFor: ["getSession(false), changeSessionId and principal"], evidence: "Jakarta Servlet 공식 HttpServletRequest API입니다." },
  { id: "jakarta-http-session", repository: "Jakarta Servlet 6.1 API", path: "HttpSession", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpsession", usedFor: ["session lifecycle and attributes"], evidence: "Jakarta Servlet 공식 HttpSession API입니다." },
  { id: "owasp-authentication", repository: "OWASP Cheat Sheet Series", path: "Authentication Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["authentication and reauthentication controls"], evidence: "OWASP 공식 authentication guidance입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["least privilege and object authorization"], evidence: "OWASP 공식 authorization guidance입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session id, cookie, rotation and expiry"], evidence: "OWASP 공식 session management guidance입니다." },
  { id: "owasp-redirect", repository: "OWASP Cheat Sheet Series", path: "Unvalidated Redirects and Forwards", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", usedFor: ["safe login return target"], evidence: "OWASP 공식 redirect guidance입니다." },
  { id: "rfc9110", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["401, 403 and redirect semantics"], evidence: "IETF 표준 HTTP semantics 문서입니다." },
  { id: "java-uri", repository: "Java SE 21 API", path: "URI", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html", usedFor: ["return target parsing"], evidence: "Oracle JDK 공식 URI API입니다." },
  { id: "java-threadlocal", repository: "Java SE 21 API", path: "ThreadLocal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html", usedFor: ["request context lifetime and cleanup"], evidence: "Oracle JDK 공식 ThreadLocal API입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-08-login-interceptor", slug: "crud-08-login-interceptor", courseId: "spring", moduleId: "spring-layered-crud", order: 8,
  title: "로그인 인터셉터와 요청 전·후 처리", subtitle: "HandlerInterceptor lifecycle을 이해하고 인증·인가·세션·redirect·비동기 경계를 Spring Security와 함께 안전하게 설계합니다.", level: "고급", estimatedMinutes: 90,
  coreQuestion: "controller 전후 공통 처리를 어떻게 구현하되 문자열 세션 플래그와 path exclude 목록을 보안 경계로 오용하지 않고, async·예외·redirect에서도 정확한 principal과 cleanup을 유지할까요?",
  summary: "로컬 LoginInterceptor와 WebConfig를 read-only로 감사해 getSession(false), 특정 attribute 확인, 미인증 session 생성·redirect·false 반환과 전체 path+긴 exclude list 등록 구조를 확인했습니다. 이를 그대로 정답화하지 않고 HandlerExecutionChain의 성공/차단/예외 순서, actual handler route manifest, authentication·session principal·fixation, 401/403/object authorization, same-origin saved request, Spring Security filter/method security, Servlet async redispatch와 context cleanup, exception/commit ordering, multi-node revocation 및 shadow migration 검증으로 확장합니다. 다섯 JDK 21 예제는 callback 순서, session version 철회, 표현별 auth decision, safe redirect와 async dispatch stdout을 실제 실행합니다.",
  objectives: ["pre/post/afterCompletion의 순서와 short-circuit 계약을 설명한다.", "actual HandlerMapping과 include/exclude drift를 검증한다.", "authentication, session과 authorization을 분리한다.", "session fixation, expiry, logout과 revocation을 설계한다.", "HTML login redirect와 API 401, 권한 부족 403을 분리한다.", "same-origin saved request로 open redirect를 막는다.", "Spring Security filter/method security를 primary enforcement로 사용한다.", "Servlet async redispatch와 ThreadLocal cleanup을 검증한다.", "예외·committed response·interceptor ordering을 outcome으로 관측한다.", "route×actor×representation×dispatch matrix로 migration을 증명한다."],
  prerequisites: [{ title: "multipart 파일 업로드·저장·검증", reason: "요청 lifecycle, authorization된 resource, side-effect cleanup과 비동기 처리 경계를 이해해야 interceptor가 보호해야 할 handler와 자원을 정확히 구분할 수 있습니다.", sessionSlug: "crud-07-file-upload" }],
  keywords: ["HandlerInterceptor", "preHandle", "postHandle", "afterCompletion", "authentication", "authorization", "HttpSession", "session fixation", "redirect", "Spring Security", "AsyncHandlerInterceptor", "redispatch", "ThreadLocal", "revocation"],
  topics,
  lab: {
    title: "세션 플래그 interceptor를 versioned Spring Security authorization으로 이관하기",
    scenario: "모든 MVC path에 interceptor를 걸고 공개 URL을 exclude하는 application이 있습니다. HTML·API·async endpoint와 object 권한이 늘어도 redirect loop, 공개 누락, session fixation과 context leak 없이 migration해야 합니다.",
    setup: ["로컬 두 파일은 read-only provenance로 보존하고 실제 사용자/session/config 값을 복사하지 않습니다.", "anonymous, user, owner, admin과 revoked synthetic principals 및 HTML/JSON 요청을 준비합니다.", "actual HandlerMethods에서 route manifest를 생성하고 legacy/new policy expected matrix를 작성합니다.", "MockMvc, actual Servlet async executor와 isolated/distributed session test profile을 준비합니다."],
    steps: ["legacy preHandle의 allow/block/redirect/callback 순서를 event로 고정합니다.", "모든 handler를 public/authenticated/authority/object-policy로 분류합니다.", "Spring Security filter chain에 좁은 public allow-list와 default deny를 구성합니다.", "로그인 성공에서 session id rotation과 principal 최소화를 검증합니다.", "HTML entry point와 API 401/403 problem response를 분리합니다.", "saved request를 safe GET relative target과 one-time TTL로 제한합니다.", "service method에서 actor/action/resource authorization을 적용합니다.", "REQUEST/ASYNC redispatch에 context propagation과 finally cleanup을 적용합니다.", "role revoke/security stamp와 cache stale SLA를 multi-node로 측정합니다.", "legacy와 new decision을 shadow 비교하고 response mutation owner는 하나로 유지합니다.", "controller/service side effect 0, cookie/header와 log secret 0을 검증합니다.", "정책 manifest, callback traces, source hashes와 rollback plan을 제출합니다."],
    expectedResult: ["새 handler는 자동으로 default-deny policy에 포함되고 공개 route는 명시적 allow-list만 가집니다.", "anonymous HTML/API와 authenticated deny가 각각 계약된 redirect/401/403으로 끝나며 controller side effect가 없습니다.", "login·logout·role change에서 session rotation/revocation이 SLA 안에 전 노드에 적용됩니다.", "async timeout/error/redispatch 뒤 worker context가 비어 있고 logical audit가 중복되지 않습니다.", "legacy 제거 전 route/actor/representation matrix와 shadow diff가 재현 가능한 evidence로 남습니다."],
    cleanup: ["synthetic sessions, saved requests, auth-version cache와 audit fixtures를 제거합니다.", "async executors/container를 종료하고 ThreadLocal/MDC residue를 검사합니다.", "logs/traces에서 session id, credential, full return URL과 개인 resource 값이 없는지 확인합니다.", "로컬 학습 원본과 실제 login 설정은 변경하지 않습니다."],
    extensions: ["method security와 batch/message entry point에 같은 policy suite를 적용합니다.", "step-up authentication과 고위험 action transaction authorization을 추가합니다.", "session store partition/failover chaos와 revocation SLO dashboard를 만듭니다.", "route manifest를 CI에서 OpenAPI/UI navigation과 함께 diff합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java 예제를 실행해 callback, auth decision, redirect, session 철회와 async dispatch를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "pre false에서 controller/after가 없음을 설명합니다.", "401/403/login redirect를 구분합니다.", "외부 return target이 fallback인지 확인합니다.", "auth version 증가 뒤 기존 ticket 거부를 확인합니다.", "logical request 1과 dispatch 2를 구분합니다."], hints: ["각 출력 항목을 MockMvc에서 확인할 status, invocation count 또는 context evidence로 바꾸세요."], expectedOutcome: "interceptor를 lifecycle 도구로 이해하고 보안 정책 owner를 분리합니다.", solutionOutline: ["map→authenticate→authorize→respond→redispatch→cleanup 순서입니다."] },
    { difficulty: "응용", prompt: "로컬 interceptor/WebConfig 구조를 Spring Security 중심으로 안전하게 이관하세요.", requirements: ["route manifest/default deny를 둡니다.", "session rotation/revocation을 둡니다.", "HTML/API entry point를 분리합니다.", "safe saved request를 구현합니다.", "object/method authorization을 둡니다.", "async context cleanup을 검증합니다.", "legacy shadow diff를 실행합니다.", "secret-free audit를 확인합니다."], hints: ["exclude list를 옮겨 적기 전에 actual handler inventory와 public 이유를 먼저 만드세요."], expectedOutcome: "모든 entry point와 dispatcher에서 한 principal/policy가 강제되는 migration이 완성됩니다.", solutionOutline: ["inventory→classify→enforce→rotate→propagate→compare→retire 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 Servlet 인증·인가·세션 운영 표준을 작성하세요.", requirements: ["filter/interceptor/method owner를 정합니다.", "401/403/404/redirect 표현 계약을 둡니다.", "cookie/fixation/expiry/logout/revocation을 정합니다.", "saved request와 OAuth callback을 구분합니다.", "async/error dispatcher context를 정의합니다.", "multi-node cache/partition SLA를 둡니다.", "route matrix, chaos, audit/privacy release gate를 둡니다."], hints: ["보안 규칙이 URL, annotation, service와 gateway에 중복될 때 authoritative source와 drift detector를 명시하세요."], expectedOutcome: "새 endpoint와 분산·비동기 실행에도 default deny와 빠른 철회가 유지되는 표준이 완성됩니다.", solutionOutline: ["identify→authenticate→authorize→isolate→expire→observe→prove 순서입니다."] },
  ],
  nextSessions: ["crud-09-websocket-chat"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["LoginInterceptor.java는 read-only로 36 lines/1,596 bytes와 SHA-256 73BF1E927293FFE460C3EDD2DEAD80120908FBF8A05F589178CBFFC297A454DC을 확인했습니다.", "WebConfig.java는 read-only로 91 lines/3,915 bytes와 SHA-256 7C96F2272FB4189B9C559655764382D76A60942636BB86C59AF4390EF1F74BEC을 확인했습니다.", "원본의 session attribute literal, 실제 exclude route 목록과 설정값은 학습자료에 복사하지 않고 session-flag와 broad include/exclude 구조만 provenance로 사용했습니다.", "원본이 다루지 않는 authentication/authorization 분리, fixation, object policy, API entry point, open redirect, Spring Security filter/method boundary, async redispatch, revocation과 migration은 공식 문서와 synthetic examples로 보강했습니다.", "JDK-only examples는 실제 HandlerMapping/path semantics, Servlet session/cookie, Spring Security filter ordering과 async executor context를 대체하지 않습니다."] },
});

export default session;
