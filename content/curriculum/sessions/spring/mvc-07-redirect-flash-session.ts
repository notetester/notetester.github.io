import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "JDK 21 record·Map·Instant와 작은 store로 request boundary, PRG, flash, session rotation 또는 concurrent state를 Servlet container 없이 모델링합니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "refresh/retry, wrong flash target, expiry, privilege change와 parallel update 같은 실패 일정을 실행해 one-request와 multi-request state contract를 검증합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "status·Location category·write/count·consumption·rotation·version boolean만 출력합니다. session id, CSRF value, credential과 stored object 전체는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/Servlet jar·browser·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "교육용 store는 실제 browser redirect, Spring FlashMap matching, Servlet HttpSession, cookie flags와 distributed session repository를 대체하지 않으므로 MockMvc·real browser/container·multi-node tests가 필요합니다."] },
    experiments: [
      { change: "POST response를 302/303/307로 바꾸고 refresh/network retry/뒤로가기를 실행합니다.", prediction: "method 전환과 duplicate-write 결과가 status/user agent/idempotency 정책에 따라 달라집니다.", result: "method semantics를 명시하고 mutation에는 idempotency·DB constraint와 PRG를 함께 검증합니다." },
      { change: "두 tab의 flash target을 같게 하거나 session object를 병렬 변경·node failover·expiry시킵니다.", prediction: "flash 오소비, lost update, serialization/version 오류 또는 stale authenticated state가 나타날 수 있습니다.", result: "target stamping, bounded expiry, immutable/versioned state와 rotation/invalidation evidence를 사용합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "forward-versus-redirect-boundary",
    title: "forward와 redirect를 같은 화면 이동이 아니라 request boundary로 구분합니다",
    lead: "forward는 server 내부에서 같은 request/response를 다른 resource에 dispatch하지만 redirect는 3xx와 Location을 client에 보내 새 HTTP request를 만들므로 method, Model, URL과 failure 지점이 달라집니다.",
    explanations: [
      "forward에서는 request attributes와 같은 request id가 target JSP/servlet에 이어지고 browser 주소는 바뀌지 않습니다. redirect에서는 기본 Model이 그대로 전달되지 않으며 client가 Location을 해소해 두 번째 요청을 보내야 합니다.",
      "원본 ResponseController는 실패 branch에서 RedirectAttributes에 flash message를 추가하고 `redirect:` view name을 반환하며, 성공 branch는 logical JSP view를 반환합니다. 이 차이를 source progression으로 사용하되 authentication 구현 예로 복사하지 않습니다.",
      "redirect response가 성공해도 target GET이 404/500이거나 client가 follow하지 않을 수 있습니다. source POST outcome과 target retrieval outcome을 서로 다른 request id와 trace link로 관찰합니다.",
      "forward는 같은 request에서 controller→JSP presentation에 적합하고 redirect는 canonical resource URL, PRG와 cross-request navigation에 적합합니다. server 내부 layer 호출을 redirect로 분해하지 않습니다.",
      "user-provided return URL을 forward/redirect target으로 그대로 사용하지 않습니다. parsed URI의 scheme/host/path allowlist, canonicalization과 CR/LF/control character를 검증해 open redirect와 header injection을 막습니다.",
    ],
    concepts: [
      c("forward", "같은 HTTP request/response를 server 내부 resource로 전달하는 RequestDispatcher operation입니다.", ["request attributes를 공유합니다.", "browser URL은 바뀌지 않습니다."]),
      c("redirect", "3xx status와 Location으로 client에게 다른 resource request를 지시하는 HTTP response입니다.", ["새 request가 생깁니다.", "method semantics는 status에 따라 다릅니다."]),
      c("request boundary", "request-scoped state·method·correlation·transaction이 끝나고 새 request가 시작되는 경계입니다.", ["Model은 자동 보존되지 않습니다.", "trace를 link합니다."]),
    ],
    codeExamples: [java("mvc07-forward-redirect-boundary", "같은 request forward와 새 request redirect 비교", "Mvc07ForwardRedirect.java", "합성 request/model로 forward state 유지와 303 redirect 새 request/Location을 결정적으로 비교합니다.", String.raw`import java.util.Map;

public class Mvc07ForwardRedirect {
  record Request(String id, String method, Map<String, String> attributes) {}
  record Redirect(int status, String location, Request next) {}
  static Request forward(Request request) { return request; }
  static Redirect redirect(Request request, String location) {
    return new Redirect(303, location, new Request("request-b", "GET", Map.of()));
  }
  public static void main(String[] args) {
    Request original = new Request("request-a", "POST", Map.of("notice", "saved"));
    Request forwarded = forward(original);
    Redirect redirected = redirect(original, "/items/7");
    System.out.println("forward-request-same=" + forwarded.id().equals(original.id()));
    System.out.println("forward-model-visible=" + forwarded.attributes().containsKey("notice"));
    System.out.println("redirect-request-new=" + !redirected.next().id().equals(original.id()));
    System.out.println("redirect-model-visible=" + redirected.next().attributes().containsKey("notice"));
    System.out.println("redirect-status=" + redirected.status());
    System.out.println("redirect-method=" + redirected.next().method());
    System.out.println("location=" + redirected.location());
  }
}`, "forward-request-same=true\nforward-model-visible=true\nredirect-request-new=true\nredirect-model-visible=false\nredirect-status=303\nredirect-method=GET\nlocation=/items/7", ["local-response-controller", "spring-redirect-reference", "spring-redirect-view", "jakarta-request-dispatcher", "jakarta-servlet", "rfc9110", "java-uri", "java-map"])],
    diagnostics: [d("redirect target에서 Model 값이 사라지거나 address bar가 안 바뀌었다고 보고합니다.", "forward와 redirect의 request/client boundary를 같은 navigation으로 취급했습니다.", ["response status/Location", "forwarded URL", "client follow-up request", "request vs session/flash attributes"], "같은 render면 forward/view, 새 canonical request면 redirect를 선택하고 cross-request data는 explicit URI/flash/persistent state로 전달합니다.", "MockMvc redirect/forward assertions와 browser network two-request test를 둡니다.")],
    expertNotes: ["redirect target은 authorization을 다시 수행해야 하며 source request의 controller decision을 신뢰하지 않습니다.", "trace correlation은 두 request id를 유지하고 redirect-cause link를 별도 attribute로 기록하되 URL에 내부 trace를 넣지 않습니다."],
  },
  {
    id: "redirect-status-method-semantics",
    title: "302·303·307·308의 method 보존 의미를 의도에 맞게 선택합니다",
    lead: "모든 redirect가 POST를 GET으로 바꾸는 것은 아니며 historical 302 user-agent behavior와 명시적 303/307/308 의미가 다르므로 API/browser contract에 status와 next method를 함께 기록해야 합니다.",
    explanations: [
      "303 See Other는 original method의 간접 결과 resource를 GET/HEAD로 조회하도록 하는 PRG에 명확합니다. mutation 처리 후 result page를 bookmark/cache 가능한 GET으로 보여 줄 때 적합합니다.",
      "307 Temporary Redirect와 308 Permanent Redirect는 method와 request body를 보존하도록 정의되어 upstream endpoint relocation 등에 쓰입니다. 결제/생성 POST를 의도치 않게 재전송하지 않도록 target 신뢰·idempotency를 검토합니다.",
      "301/302는 historical client behavior 때문에 POST→GET 전환이 가능할 수 있습니다. browser UI에서는 framework default가 무엇인지 확인하고 machine client API에는 ambiguous behavior를 문서로 맡기지 않습니다.",
      "Location은 absolute 또는 relative URI reference일 수 있으며 reverse proxy context, Forwarded headers와 external base URL 신뢰를 검토합니다. Host/header spoofing으로 attacker host URL을 만들지 않습니다.",
      "redirect body는 짧은 hypertext note를 가질 수 있지만 client contract의 핵심은 status와 Location입니다. error detail, session id와 user input을 Location query에 넣지 않습니다.",
    ],
    concepts: [
      c("303 See Other", "original request의 간접 결과를 다른 URI에서 retrieval하도록 지시하는 redirect status입니다.", ["POST 뒤 GET에 적합합니다.", "Location을 제공합니다."]),
      c("307/308", "temporary/permanent redirect이면서 request method와 body를 보존하는 status입니다.", ["재전송 side effect를 검토합니다.", "target trust가 필요합니다."]),
      c("Location", "redirect target URI reference를 전달하는 HTTP response field입니다.", ["URI validation을 적용합니다.", "민감값을 넣지 않습니다."]),
    ],
    diagnostics: [d("POST redirect가 target에 POST body를 다시 보내 중복 mutation하거나 일부 client만 GET으로 바꿉니다.", "302의 historical behavior를 명시 method contract 대신 사용했습니다.", ["actual status", "client follow method/body", "framework RedirectView setting", "target idempotency"], "PRG는 303처럼 의도가 분명한 status를 사용하고 method 보존이 필요할 때만 307/308과 target idempotency를 검증합니다.", "browser와 supported HTTP clients별 redirect-method contract test를 둡니다.")],
    expertNotes: ["permanent redirect는 client/cache에 오래 남을 수 있어 rollback과 URL ownership을 확보한 뒤 사용합니다.", "proxy가 status/Location을 rewrite하는 deployment라면 application test와 edge integration test를 분리합니다."],
  },
  {
    id: "post-redirect-get-idempotency",
    title: "PRG가 새로고침 재제출은 줄여도 network retry·double click·동시 중복을 막지 못함을 증명합니다",
    lead: "Post/Redirect/Get은 성공한 POST 뒤 GET을 표시해 browser refresh가 GET을 반복하게 하지만 POST가 두 번 도착하는 일정에는 idempotency key, unique constraint와 transaction outcome이 별도로 필요합니다.",
    explanations: [
      "정상 PRG는 POST에서 validate/authorize/transaction commit 후 result resource URI를 얻고 303 Location을 반환합니다. target GET은 side effect 없이 committed state를 읽고 bookmark 가능한 representation을 제공합니다.",
      "double click, mobile retry, load balancer retry와 timeout 후 client 재시도는 redirect를 받기 전 POST를 반복할 수 있습니다. logical command idempotency key와 authenticated owner/scope/expiry를 저장해 same command 결과를 재사용합니다.",
      "DB UNIQUE와 idempotency record는 목적이 다릅니다. unique constraint는 domain duplicate를 막고 idempotency는 같은 request의 response/outcome을 재현하며 key reuse with different payload를 conflict로 거부해야 합니다.",
      "transaction commit 성공 뒤 303 전송이 실패할 수 있습니다. client retry에서 idempotency lookup이 committed resource를 반환하도록 command result와 key record를 atomic하게 저장하거나 reconciliation합니다.",
      "validation 실패는 보통 같은 POST response에서 form view를 render해 field errors를 보존할 수 있고, redirect하려면 flash/session에 rejected sensitive values를 넣지 않는 별도 error strategy가 필요합니다.",
    ],
    concepts: [
      c("Post/Redirect/Get", "mutation POST 뒤 redirect하고 결과를 safe GET으로 조회하는 browser interaction pattern입니다.", ["refresh 재제출을 줄입니다.", "POST retry는 별도 처리합니다."]),
      c("idempotency key", "같은 logical command retry를 인식해 한 번의 effect와 재사용 가능한 outcome으로 묶는 scoped identifier입니다.", ["payload fingerprint를 확인합니다.", "expiry/owner를 둡니다."]),
      c("commit-before-redirect", "DB/domain mutation을 확정한 뒤 그 resource Location을 redirect로 반환하는 순서입니다.", ["전송 실패를 고려합니다.", "reconciliation이 필요할 수 있습니다."]),
    ],
    codeExamples: [java("mvc07-prg-idempotent-command", "POST retry와 GET refresh를 분리한 PRG", "Mvc07Prg.java", "동일 command key로 POST가 두 번 와도 write 한 번, redirect target GET을 두 번 읽어도 추가 write가 없음을 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc07Prg {
  static final class Store {
    private final Map<String, Integer> outcomes = new LinkedHashMap<>();
    private int writes;
    private int gets;
    int create(String key) {
      Integer existing = outcomes.get(key);
      if (existing != null) return existing;
      int id = 7;
      outcomes.put(key, id);
      writes++;
      return id;
    }
    void get(int id) { if (!outcomes.containsValue(id)) throw new IllegalArgumentException(); gets++; }
  }
  public static void main(String[] args) {
    Store store = new Store();
    int first = store.create("request-a");
    int retry = store.create("request-a");
    store.get(first);
    store.get(first);
    System.out.println("post-attempts=2");
    System.out.println("post-status=303");
    System.out.println("location=/orders/" + first);
    System.out.println("writes=" + store.writes);
    System.out.println("get-count=" + store.gets);
    System.out.println("same-outcome=" + (first == retry));
    System.out.println("duplicate=false");
  }
}`, "post-attempts=2\npost-status=303\nlocation=/orders/7\nwrites=1\nget-count=2\nsame-outcome=true\nduplicate=false", ["spring-redirect-reference", "rfc9110", "spring-mockmvc", "java-map", "java-linked-hash-map"])],
    diagnostics: [d("PRG를 적용했는데도 주문/글이 두 번 생성됩니다.", "refresh GET만 고려하고 redirect 전에 반복 도착한 POST와 timeout-unknown outcome을 처리하지 않았습니다.", ["POST attempt timeline", "idempotency key/payload/owner", "DB unique/transaction", "commit vs response send"], "scoped idempotency record와 domain constraints를 transaction outcome에 연결하고 same key different payload를 conflict 처리합니다.", "double-click, concurrent retry와 commit-success/response-fail schedule test를 둡니다.")],
    expertNotes: ["idempotency key를 URL/query/log에 민감 토큰처럼 노출하지 않고 bounded length와 random/uniqueness를 검증합니다.", "GET target이 eventual consistency replica를 읽으면 redirect 직후 404가 날 수 있어 read-your-write policy나 202/status resource를 설계합니다."],
  },
  {
    id: "redirect-attributes-url-versus-flash",
    title: "redirect URI attributes와 flash attributes의 공개·수명·크기 차이를 분리합니다",
    lead: "RedirectAttributes의 addAttribute는 URI template/query에 사용될 수 있고 addFlashAttribute는 보통 session-backed FlashMap에 잠시 저장되므로 값의 공개성, bookmarkability, 소비와 실패가 완전히 다릅니다.",
    explanations: [
      "resource id, filter와 page처럼 URL의 일부여야 하는 작은 non-sensitive 값은 redirect attribute가 될 수 있습니다. object/model 전체를 default Model에서 query로 자동 노출하지 않도록 explicit allowlist를 사용합니다.",
      "flash는 success notice나 one-time public error summary처럼 다음 request에만 필요한 값에 적합합니다. password, token, full command/entity와 large collection을 저장하지 않습니다.",
      "flash가 session을 사용하면 cookie/session availability, expiry와 distributed serialization의 영향을 받습니다. redirect 성공과 flash delivery 성공을 동일 outcome으로 가정하지 않고 target이 missing notice를 견딥니다.",
      "RedirectAttributes는 method가 redirect하지 않으면 사용되지 않는 의미를 가집니다. validation view forward와 redirect branches에서 어떤 model이 사용되는지 signature/return path test를 둡니다.",
      "message text를 flash contract로 고정하지 않고 stable public code와 minimal parameters를 저장해 target이 locale/escaping을 적용합니다. 사용자 입력을 message template로 실행하지 않습니다.",
    ],
    concepts: [
      c("redirect attribute", "redirect URI template expansion 또는 query에 노출하도록 명시한 Model attribute입니다.", ["client-visible입니다.", "non-sensitive small values만 둡니다."]),
      c("flash attribute", "redirect 전 저장해 다음 matching request Model에 한 번 전달되는 temporary attribute입니다.", ["보통 session-backed입니다.", "expiry/consumption이 있습니다."]),
      c("RedirectAttributes", "redirect용 URI attributes와 flash attributes를 명시적으로 선택하는 Spring MVC Model specialization입니다.", ["redirect branch에서 사용됩니다.", "default Model leakage를 줄입니다."]),
    ],
    diagnostics: [d("redirect URL에 내부 Model/PII가 query로 붙거나 flash에 큰 entity가 저장됩니다.", "default Model과 redirect attributes를 구분하지 않고 convenience object 전체를 전달했습니다.", ["Location query", "RedirectAttributes calls", "flash object graph/size", "session serialization/logs"], "URI에는 allowlisted public scalar만, flash에는 stable code/minimal display parameters만 저장하고 ignore-default-model 정책을 검토합니다.", "Location/flash schema privacy·size·serialization contract tests를 둡니다.")],
    expertNotes: ["flash message가 없어도 core operation 결과가 변하지 않아야 하며 notice delivery를 transaction outcome으로 사용하지 않습니다.", "query parameter는 browser history, referrer, proxy/access logs와 analytics에 남을 수 있으므로 공개 데이터로 취급합니다."],
  },
  {
    id: "flashmap-target-expiry-tabs",
    title: "FlashMap의 target stamping·one-time consumption·expiry와 multi-tab 경쟁을 검증합니다",
    lead: "flash는 단순 session key가 아니라 target path/parameters와 expiry를 가진 one-time message이며 concurrent tabs, asset/prefetch request와 redirect race가 있으면 엉뚱한 요청이 소비하지 않게 matching해야 합니다.",
    explanations: [
      "Spring의 FlashMap은 redirect 전에 저장되고 target request에서 Model로 노출된 뒤 제거됩니다. RedirectView는 target URL 정보를 사용해 matching specificity를 높일 수 있습니다.",
      "target 정보가 없으면 session의 다음 request가 flash를 가져갈 수 있어 favicon, polling, 다른 tab navigation 같은 경쟁이 문제가 됩니다. path와 stable target parameters를 stamp하고 unrelated request가 소비하지 않는지 test합니다.",
      "one-time은 exactly-once delivery가 아닙니다. target response가 render 실패해도 flash는 이미 소비됐을 수 있고 client가 target을 요청하지 않으면 expiry됩니다. core business result는 persistent resource에서 조회합니다.",
      "여러 outstanding flash entries가 같은 target을 가질 수 있으면 conversation/operation id를 non-sensitive signed/scoped reference로 구분하거나 UI가 notice absence/ordering을 견디게 합니다.",
      "expiry cleanup은 session growth를 막고 system clock drift를 고려합니다. flash count/age/expired/consumed/mismatch만 metric으로 기록하고 message/body/session id는 기록하지 않습니다.",
    ],
    concepts: [
      c("FlashMap", "다음 request로 전달할 attributes와 target request metadata·expiration을 가진 Spring map입니다.", ["one-time입니다.", "matching을 지원합니다."]),
      c("target stamping", "redirect target path와 parameters를 flash entry에 붙여 올바른 후속 request만 선택하게 하는 과정입니다.", ["multi-tab race를 줄입니다.", "민감 target data를 피합니다."]),
      c("at-most-once notice", "소비 후 제거되어 재전달을 보장하지 않는 UI notification 성질입니다.", ["business state 저장소가 아닙니다.", "render 실패 시 유실될 수 있습니다."]),
    ],
    codeExamples: [java("mvc07-flash-target-expiry", "target match·one-time consume·expiry", "Mvc07Flash.java", "wrong target은 소비하지 않고 right target은 한 번만 읽으며 expired entry가 제거되는 small FlashMap store를 실행합니다.", String.raw`import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class Mvc07Flash {
  record Entry(String path, String operation, String message, Instant expiresAt) {}
  static final class Store {
    private final List<Entry> entries = new ArrayList<>();
    void add(Entry entry) { entries.add(entry); }
    Optional<String> consume(String path, String operation, Instant now) {
      entries.removeIf(entry -> !entry.expiresAt().isAfter(now));
      for (int index = 0; index < entries.size(); index++) {
        Entry entry = entries.get(index);
        if (entry.path().equals(path) && entry.operation().equals(operation)) {
          entries.remove(index);
          return Optional.of(entry.message());
        }
      }
      return Optional.empty();
    }
  }
  public static void main(String[] args) {
    Instant now = Instant.parse("2026-01-01T00:00:00Z");
    Store store = new Store();
    store.add(new Entry("/items/7", "op-a", "Saved", now.plusSeconds(30)));
    store.add(new Entry("/expired", "old", "Old", now.minusSeconds(1)));
    boolean wrong = store.consume("/other", "op-a", now).isPresent();
    String right = store.consume("/items/7", "op-a", now).orElse("missing");
    boolean second = store.consume("/items/7", "op-a", now).isPresent();
    System.out.println("wrong-consumed=" + wrong);
    System.out.println("right=" + right);
    System.out.println("second-consumed=" + second);
    System.out.println("remaining=" + store.entries.size());
    System.out.println("expired-removed=true");
  }
}`, "wrong-consumed=false\nright=Saved\nsecond-consumed=false\nremaining=0\nexpired-removed=true", ["local-response-controller", "spring-flash-reference", "spring-redirect-attributes", "spring-flash-map", "spring-session-flash-manager", "java-instant", "java-list", "java-optional"])],
    diagnostics: [d("다른 tab/polling request가 flash를 먼저 먹거나 success notice가 반복됩니다.", "target path/parameters 없이 generic next-request session value를 사용하거나 consume/remove가 원자적이지 않습니다.", ["output/input FlashMaps", "target path/params", "request race timeline", "consume/remove/expiry"], "RedirectView target stamping과 atomic matching consumption을 사용하고 operation-specific identifier/expiry를 둡니다.", "parallel tabs, favicon/prefetch, wrong/right target와 render-failure schedules를 test합니다.")],
    expertNotes: ["operation id를 flash target query에 넣으면 URL에 공개되므로 authorization secret로 사용하지 않고 bounded opaque correlation만 허용합니다.", "multi-node session repository의 consistency가 flash one-time semantics에 미치는 영향을 failover test로 확인합니다."],
  },
  {
    id: "http-session-cookie-boundary",
    title: "HttpSession을 cookie id와 server state의 연결로 이해하고 최소 상태만 보관합니다",
    lead: "HTTP는 요청마다 독립적이고 HttpSession은 container가 생성한 opaque identifier를 cookie 또는 URL rewriting으로 client와 교환해 server-side attributes를 연결하므로 id 자체와 stored data의 보안 경계가 다릅니다.",
    explanations: [
      "session cookie는 identifier이지 사용자 profile/권한 전체를 담는 보통의 HttpSession 구현과 다릅니다. identifier가 탈취되면 server state를 가장할 수 있으므로 TLS, Secure, HttpOnly, SameSite, narrow Domain/Path와 rotation이 필요합니다.",
      "URL rewriting은 session id를 URL, history, logs와 Referer에 노출할 수 있어 cookie-only tracking을 우선하고 container가 다른 tracking mode를 수용하는지 검증합니다.",
      "session attribute에는 stable principal reference, small conversation state와 flash 정도만 둡니다. entity graph, DB connection, request/response, non-thread-safe service, uploaded bytes와 credential을 저장하지 않습니다.",
      "session 존재 자체를 authentication으로 보지 않습니다. authenticated principal, authorization version, recent reauthentication와 revocation state를 server security layer가 검증합니다.",
      "stateless API라도 browser credential cookie를 쓰면 CSRF/CORS/cache가 관련됩니다. 'REST' label로 session/cookie threat가 사라지지 않으며 actual credential transport를 inventory합니다.",
    ],
    concepts: [
      c("HttpSession", "여러 HTTP requests에 걸쳐 server-side attributes와 lifecycle metadata를 연결하는 Servlet abstraction입니다.", ["opaque id로 연계됩니다.", "expiry/invalidation이 있습니다."]),
      c("session cookie", "client가 opaque session identifier를 server로 돌려보내는 cookie입니다.", ["Secure/HttpOnly/SameSite를 설정합니다.", "identifier를 노출하지 않습니다."]),
      c("session tracking mode", "cookie 또는 URL rewriting 등 request가 session id를 전달하는 mechanism입니다.", ["cookie-only를 우선합니다.", "accepted modes를 test합니다."]),
    ],
    diagnostics: [d("session id가 URL/log에 나타나거나 같은 session에 큰 entity/connection이 쌓입니다.", "URL rewriting을 허용하고 attribute size/type/lifecycle policy가 없습니다.", ["accepted tracking modes", "Set-Cookie flags", "session attribute inventory/serialized size", "resource references"], "cookie-only secure tracking과 minimal serializable identifiers/value state를 사용하고 resource는 request/service scope에 둡니다.", "tracking-mode adversarial test와 session size/type budget scan을 둡니다.")],
    expertNotes: ["sticky session은 serialization/consistency 문제를 숨길 수 있어 node loss/failover recovery와 logout propagation을 별도 검증합니다.", "session id를 metric label이나 application log에 기록하지 않고 privacy-safe correlation을 분리합니다."],
  },
  {
    id: "session-fixation-privilege-change",
    title: "로그인·권한 상승 시 session id와 CSRF state를 회전해 fixation을 차단합니다",
    lead: "공격자가 미리 정한 anonymous session id가 로그인 뒤에도 유지되면 피해자의 authenticated session을 재사용할 수 있으므로 authentication success와 privilege change에서 container-supported id rotation을 적용합니다.",
    explanations: [
      "HttpServletRequest.changeSessionId는 현재 session state를 유지하면서 id를 바꾸는 Servlet API입니다. Spring Security의 session fixation protection strategy와 custom login flow가 충돌하지 않는지 확인합니다.",
      "원본 login branch는 두 request parameter를 단순 비교하고 redirect/flash를 설명하는 학습용이며 password hashing, authentication manager, rotation, rate limit와 CSRF가 없습니다. 이를 production login pattern으로 재사용하지 않습니다.",
      "rotation 전후 유지할 attributes를 allowlist합니다. pre-auth cart/locale은 정책에 따라 유지할 수 있지만 anonymous authorization hints, CSRF value와 untrusted session data는 재검증·회전합니다.",
      "login success뿐 아니라 MFA 완료, role elevation, impersonation start/end, password reset와 account recovery 같은 privilege boundary에서 id/token generation policy를 검토합니다.",
      "old id rejection, concurrent old/new requests와 multi-node replication을 test합니다. rotation event에는 old/new identifier를 log하지 않고 outcome, auth transition category와 request correlation만 남깁니다.",
    ],
    concepts: [
      c("session fixation", "공격자가 아는/정한 session id가 피해자 인증 뒤에도 유지되어 authenticated state를 탈취하는 공격입니다.", ["privilege change 때 id를 회전합니다.", "old id를 거부합니다."]),
      c("changeSessionId", "현재 HttpSession의 identifier를 새 값으로 바꾸는 Servlet request operation입니다.", ["container가 수행합니다.", "session 존재가 필요합니다."]),
      c("privilege boundary", "anonymous→authenticated 또는 일반→elevated처럼 authority가 커지거나 바뀌는 state transition입니다.", ["rotation/reauth를 적용합니다.", "audit category를 남깁니다."]),
    ],
    codeExamples: [java("mvc07-session-rotation", "privilege change에서 id·CSRF generation 회전", "Mvc07SessionRotation.java", "synthetic pre-auth session을 authenticated generation으로 바꾸고 old invalid, allowlisted locale 유지와 secret values 미출력을 확인합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc07SessionRotation {
  static final class Session {
    private final String id;
    private final Map<String, String> attributes;
    private boolean valid = true;
    Session(String id, Map<String, String> attributes) {
      this.id = id;
      this.attributes = new LinkedHashMap<>(attributes);
    }
  }
  static Session authenticate(Session old) {
    old.valid = false;
    Map<String, String> next = new LinkedHashMap<>();
    next.put("locale", old.attributes.getOrDefault("locale", "ko"));
    next.put("principal", "user-7");
    next.put("csrf-generation", "2");
    return new Session("session-after", next);
  }
  public static void main(String[] args) {
    Session before = new Session("session-before", Map.of("locale", "ko", "csrf-generation", "1"));
    Session after = authenticate(before);
    System.out.println("id-changed=" + !before.id.equals(after.id));
    System.out.println("old-valid=" + before.valid);
    System.out.println("authenticated=" + after.attributes.containsKey("principal"));
    System.out.println("retained-locale=" + after.attributes.get("locale"));
    System.out.println("csrf-rotated=" + after.attributes.get("csrf-generation").equals("2"));
    System.out.println("session-id-printed=false");
  }
}`, "id-changed=true\nold-valid=false\nauthenticated=true\nretained-locale=ko\ncsrf-rotated=true\nsession-id-printed=false", ["local-response-controller", "jakarta-http-request", "jakarta-http-session", "jakarta-servlet", "spring-security-session", "owasp-session", "owasp-csrf", "rfc6265", "java-map", "java-linked-hash-map"])],
    diagnostics: [d("로그인 전후 session id가 같거나 old id로도 authenticated page가 열립니다.", "custom authentication success flow가 container/security framework fixation protection을 우회했습니다.", ["Set-Cookie/id timeline", "changeSessionId/security strategy", "old-id request outcome", "multi-node replication"], "모든 privilege transition에서 container-supported rotation을 적용하고 old id를 즉시 거부하며 CSRF/authority state를 재생성합니다.", "pre-fixed id login, concurrent old/new, failover와 elevation/de-elevation tests를 둡니다.")],
    expertNotes: ["invalidate+new session 방식과 changeSessionId 방식의 attribute preservation 차이를 chosen security baseline에서 확인합니다.", "rotation 횟수 metric은 유용하지만 id 값/해시를 telemetry에 남기지 않습니다."],
  },
  {
    id: "distributed-session-serialization",
    title: "분산 session의 serialization schema·class evolution·size와 failure를 계약으로 만듭니다",
    lead: "session을 Redis/DB/다른 node로 복제하면 in-memory object reference가 bytes/schema가 되어 class version, serializer allowlist, expiry와 partial write가 배포 호환성 문제로 바뀝니다.",
    explanations: [
      "Java Serializable 구현 여부만으로 안전한 schema가 되지 않습니다. gadget risk, serialVersionUID/class rename, library version과 mutable graph가 있어 explicit small DTO와 versioned serializer를 우선합니다.",
      "rolling deployment에서 old node가 쓴 session을 new node가 읽고 반대 방향도 가능한지 compatibility window를 정합니다. additive schema/default와 incompatible reset/reauth UX를 계획합니다.",
      "session size가 커지면 매 request network/serialization latency, storage cost와 eviction pressure가 증가합니다. attribute별 logical type, approximate bytes, read/write frequency와 TTL을 bounded telemetry로 봅니다.",
      "repository timeout/partial failure에서 fail-open authenticated state를 만들지 않습니다. 읽기 실패, write 실패, stale version과 store unavailable을 stable security/availability policy로 구분합니다.",
      "serialization payload는 principal/profile data를 포함할 수 있어 encryption at rest, TLS, access control, backup retention과 incident deletion을 적용합니다. debug dump와 DLQ에 raw session을 남기지 않습니다.",
    ],
    concepts: [
      c("session schema", "분산 저장소에 기록되는 attribute names, value types, version와 compatibility contract입니다.", ["small explicit DTO를 사용합니다.", "rolling compatibility를 검증합니다."]),
      c("serialization", "in-memory session value를 저장·전송 가능한 representation으로 바꾸고 복원하는 과정입니다.", ["untrusted bytes를 제한합니다.", "version/type allowlist를 둡니다."]),
      c("session repository", "여러 application instances가 session state를 읽고 쓰는 external store abstraction입니다.", ["consistency/TTL이 있습니다.", "failure policy가 필요합니다."]),
    ],
    diagnostics: [d("rolling deploy 뒤 session deserialize 오류로 전체 사용자가 logout되거나 old object가 실행됩니다.", "versioned schema/serializer allowlist와 bidirectional compatibility test가 없습니다.", ["serializer/type metadata", "old↔new payload corpus", "session size/TTL", "fallback/reset policy"], "minimal versioned DTO와 safe serializer를 사용하고 rolling window compatibility 또는 explicit safe reauthentication migration을 설계합니다.", "golden payload old/new read-write와 malicious type/oversize/store-failure tests를 둡니다.")],
    expertNotes: ["Java native serialization을 선택하면 공식 serialization filtering과 gadget surface를 검토하지만 session DTO schema를 작게 유지하는 것이 기본 방어입니다.", "store TTL과 application idle/absolute expiry가 달라 zombie session이 생기지 않게 한 owner가 lifecycle을 정의합니다."],
  },
  {
    id: "session-concurrency-lost-update",
    title: "같은 session의 병렬 requests를 versioned immutable state로 처리합니다",
    lead: "browser는 AJAX, multiple tabs와 HTTP multiplexing으로 같은 session에 동시에 요청할 수 있어 mutable cart/wizard field의 read-modify-write가 lost update와 stale authorization state를 만들 수 있습니다.",
    explanations: [
      "HttpSession attributes Map이 thread-safe하게 접근된다고 해도 attribute 내부 mutable object의 compound update는 원자적이지 않습니다. `get quantity; quantity++; set` 두 requests가 같은 old 값을 읽을 수 있습니다.",
      "한 node에서는 session mutex/synchronized를 쓸 수 있지만 distributed store와 long request에서는 throughput과 failover 문제가 있습니다. immutable value+version CAS, domain DB transaction 또는 operation log를 state 성격에 맞게 선택합니다.",
      "cart 같은 business state를 session에만 두면 node/store loss, expiry와 multi-device consistency가 어렵습니다. 중요한 state는 authenticated domain store에 두고 session에는 cart id/conversation id만 둘 수 있습니다.",
      "flash consume와 @SessionAttributes wizard completion도 concurrent tab에서 race합니다. conversation id와 version을 사용해 서로 다른 workflow instances를 격리합니다.",
      "stress test는 sleep에 의존하지 않고 barrier, many tasks와 invariant를 사용합니다. final quantity/version, no duplicate effect, monotonic authorization generation과 zero leaked resource를 확인합니다.",
    ],
    concepts: [
      c("lost update", "둘 이상의 request가 같은 old state를 읽고 각각 써서 한 변경이 사라지는 concurrency anomaly입니다.", ["compound update에서 생깁니다.", "version/CAS로 감지합니다."]),
      c("immutable session state", "한 version의 attributes/value가 생성 뒤 변하지 않고 update가 새 object를 만드는 state입니다.", ["snapshot 일관성을 줍니다.", "atomic replace가 필요합니다."]),
      c("conversation id", "동일 session 안 여러 wizard/operation instances를 구분하는 bounded identifier입니다.", ["authorization secret가 아닙니다.", "version/expiry를 가집니다."]),
    ],
    codeExamples: [java("mvc07-concurrent-session-state", "AtomicReference로 lost update 없는 session value", "Mvc07ConcurrentSession.java", "여덟 concurrent increments를 immutable serializable Cart version에 CAS해 final invariant와 expiry를 확인합니다.", String.raw`import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicReference;

public class Mvc07ConcurrentSession {
  record Cart(int version, int quantity) implements Serializable {}
  public static void main(String[] args) throws Exception {
    AtomicReference<Cart> state = new AtomicReference<>(new Cart(0, 0));
    ExecutorService pool = Executors.newFixedThreadPool(4);
    try {
      List<Future<?>> tasks = new ArrayList<>();
      for (int index = 0; index < 8; index++) {
        tasks.add(pool.submit(() -> state.updateAndGet(
            old -> new Cart(old.version() + 1, old.quantity() + 1))));
      }
      for (Future<?> task : tasks) task.get();
      Cart result = state.get();
      Instant created = Instant.parse("2026-01-01T00:00:00Z");
      boolean expired = created.plus(Duration.ofMinutes(20)).isBefore(created.plus(Duration.ofMinutes(21)));
      System.out.println("parallel-updates=8");
      System.out.println("quantity=" + result.quantity());
      System.out.println("version=" + result.version());
      System.out.println("lost-updates=" + (result.quantity() != 8));
      System.out.println("serializable=" + Serializable.class.isAssignableFrom(Cart.class));
      System.out.println("expired=" + expired);
    } finally {
      pool.shutdown();
    }
  }
}`, "parallel-updates=8\nquantity=8\nversion=8\nlost-updates=false\nserializable=true\nexpired=true", ["jakarta-http-session", "spring-session-flash-manager", "spring-session-attributes", "spring-session-attributes-api", "java-serializable", "java-atomic-reference", "java-executor-service", "java-instant", "java-duration", "java-list"])],
    diagnostics: [d("두 tab에서 cart/wizard 값을 바꾸면 한 변경이 사라지거나 flash/session completion이 꼬입니다.", "mutable session attribute에 version 없이 compound read-modify-write를 수행했습니다.", ["parallel request timeline", "attribute internal mutability", "repository atomicity/version", "conversation ids"], "immutable versioned value와 CAS/domain transaction을 사용하고 workflows를 conversation id로 격리합니다.", "barrier-based parallel updates, stale-version reject와 multi-node retry tests를 둡니다.")],
    expertNotes: ["AtomicReference 예제는 한 JVM reference만 다루므로 distributed repository의 CAS/transaction semantics는 실제 integration test가 필요합니다.", "session-level global lock은 correctness를 줄 수 있지만 slow request가 모든 tab을 막으므로 critical section과 state location을 재설계합니다."],
  },
  {
    id: "expiry-logout-invalidation-cache",
    title: "idle·absolute expiry, logout invalidation과 browser/cache cleanup을 구분합니다",
    lead: "session timeout은 마지막 access 기준 idle expiry일 수 있고 high-risk applications은 absolute lifetime·reauthentication·server revocation이 추가로 필요하며 cookie 삭제만으로 server session이 끝난 것은 아닙니다.",
    explanations: [
      "idle timeout은 활동이 없으면 만료시키고 absolute timeout은 계속 활동해도 최대 lifetime을 제한합니다. user-facing warning/renewal은 security policy를 약화하지 않게 server clock이 authoritative합니다.",
      "logout은 server session invalidation/revocation, authentication cookies expiry, CSRF state 폐기와 relevant browser storage/cache cleanup을 함께 다룹니다. redirect만 로그인 페이지로 보내는 것은 logout이 아닙니다.",
      "back button/browser cache에 private page representation이 남을 수 있습니다. authenticated sensitive responses에는 policy에 맞는 Cache-Control을 적용하되 HTTP cache directive와 server session revocation을 서로 대체하지 않습니다.",
      "multi-device/global logout은 한 session invalidate와 다릅니다. user security version 또는 session registry로 active sessions를 찾고 revoke propagation delay/partial failure를 관측합니다.",
      "expiry 직전 concurrent request, long-running operation와 node clock skew에서 outcome을 정합니다. request 시작/commit 양쪽 검증, grace window와 idempotent cleanup을 risk에 맞게 설계합니다.",
    ],
    concepts: [
      c("idle timeout", "마지막 유효 activity 뒤 일정 기간이 지나면 session을 만료시키는 정책입니다.", ["server clock을 사용합니다.", "activity 정의가 필요합니다."]),
      c("absolute timeout", "activity와 무관하게 session creation/authentication 뒤 최대 lifetime을 제한하는 정책입니다.", ["reauthentication과 연결합니다.", "sliding expiry와 다릅니다."]),
      c("invalidation", "server가 session을 더 이상 valid state lookup에 사용하지 못하게 폐기하는 operation입니다.", ["cookie deletion과 다릅니다.", "cluster propagation이 필요합니다."]),
    ],
    diagnostics: [d("logout 뒤 back button에서 private page가 보이거나 다른 node에서 session이 계속 valid합니다.", "client redirect/cookie 삭제만 하고 server invalidation, cache policy와 cluster revocation을 완료하지 않았습니다.", ["server session registry", "Set-Cookie expiry", "Cache-Control/history", "other-node/global-session checks"], "server invalidation/revocation을 먼저 수행하고 cookie/CSRF/cache cleanup과 propagation readback을 실행합니다.", "logout replay, back/forward cache, node failover와 global revoke tests를 둡니다.")],
    expertNotes: ["Clear-Site-Data 같은 broad cleanup은 다른 application state까지 지울 수 있어 origin ownership과 UX를 검토합니다.", "expiry metric에 session/user identifiers를 label로 넣지 않고 reason, age bucket와 outcome만 기록합니다."],
  },
  {
    id: "redirect-failure-transaction-security",
    title: "validation·transaction·redirect·flash 실패를 한 성공처럼 묶지 않습니다",
    lead: "mutation commit, 3xx 전송, flash 저장, target GET/render는 서로 다른 실패 지점이므로 operation truth는 persistent state에 두고 UI notice와 navigation은 recoverable delivery로 설계합니다.",
    explanations: [
      "validation 실패는 mutation zero를 보장하고 같은 form view 또는 safe error contract를 반환합니다. invalid raw command를 flash/session에 저장해 redirect하는 방식은 크기·sensitive data·stale replay 위험이 큽니다.",
      "transaction rollback이면 success flash/redirect를 만들지 않고 commit callback/order를 확인합니다. commit 성공 후 response network failure는 idempotency outcome 조회로 복구합니다.",
      "flash repository write failure에서 operation을 rollback할지 notice 없이 성공할지는 product criticality에 따라 정하지만 감사/결제 truth를 flash에 두지 않습니다.",
      "open redirect, CRLF Location injection과 login CSRF를 방지하기 위해 target allowlist, security framework CSRF, privilege rotation과 authentication manager를 사용합니다. 원본 parameter equality branch를 security code로 확장하지 않습니다.",
      "target GET은 resource가 없거나 권한이 바뀌었을 때 404/403를 안정적으로 반환하고 flash message가 있다고 authorization을 우회하지 않습니다.",
    ],
    concepts: [
      c("operation truth", "mutation이 committed됐는지와 생성된 resource/version을 저장한 durable domain state입니다.", ["flash와 분리합니다.", "idempotency가 참조합니다."]),
      c("delivery failure", "operation outcome은 존재하지만 redirect/flash/target representation이 client에 전달되지 않은 실패입니다.", ["retry/reconcile합니다.", "중복 mutation을 피합니다."]),
      c("open redirect", "공격자가 redirect target을 조작해 사용자를 외부 malicious location으로 보내는 취약점입니다.", ["parsed allowlist를 사용합니다.", "login return URL을 검증합니다."]),
    ],
    diagnostics: [d("DB commit은 됐지만 client가 retry해 중복되고 success flash는 없거나 반대 결과가 납니다.", "transaction, idempotency record, flash 저장과 response send를 하나의 atomic success로 가정했습니다.", ["commit/idempotency timeline", "flash save", "response send", "retry target lookup"], "durable operation outcome을 idempotency key에 연결하고 navigation/notice delivery failure에서 같은 outcome을 재사용합니다.", "commit-success/send-fail, flash-fail, target-fail fault injection과 reconciliation test를 둡니다.")],
    expertNotes: ["transaction synchronization callback에서 response/session을 변경할 때 exception과 commit ordering을 supported framework에서 검증합니다.", "redirect failure logs에 Location query, flash contents와 session identifiers를 남기지 않습니다."],
  },
  {
    id: "redirect-session-testing-observability",
    title: "두 요청·cookie jar·multi-tab·multi-node를 포함한 contract test와 관측을 만듭니다",
    lead: "redirect/flash/session은 한 controller invocation test로 보이지 않으므로 status/Location, follow-up request, cookie rotation, flash consumption과 repository state를 시간순으로 검증해야 합니다.",
    explanations: [
      "MockMvc test는 POST response status/redirectedUrl, output flash, target GET input model과 session lifecycle을 빠르게 검사합니다. redirect follow를 자동으로 숨기지 않고 각 response를 별도 assertion합니다.",
      "real browser test는 method 전환, cookie flags/rotation, refresh/back/multi-tab, cache와 external redirect blocking을 확인합니다. DevTools에 보이는 session id를 test report/log에 복사하지 않습니다.",
      "multi-node integration은 node A POST→node B GET, repository timeout, rolling schema, stale read와 invalidation propagation을 실행합니다. sticky routing만으로 pass하지 않습니다.",
      "telemetry는 source/target route logical id, status, redirect reason, flash outcome, session generation/rotation boolean, repository latency category와 expiry reason을 bounded하게 기록합니다. Location query와 identifiers는 제외합니다.",
      "load test는 session size/read-write bytes, flash outstanding count/age, lock contention, CAS conflicts, serializer latency와 store saturation을 봅니다. user count를 session object dump로 측정하지 않습니다.",
    ],
    concepts: [
      c("two-request test", "source mutation response와 redirect target request를 독립적으로 실행해 연결 contract를 검사하는 test입니다.", ["status/Location을 먼저 봅니다.", "flash one-time을 확인합니다."]),
      c("cookie jar", "supported client가 Set-Cookie와 다음 Cookie request를 실제 browser 규칙처럼 유지하는 test state입니다.", ["rotation/flags를 검증합니다.", "값을 report에 노출하지 않습니다."]),
      c("session generation", "privilege/schema/config 변화와 연결된 session state version입니다.", ["raw id가 아닙니다.", "rotation/expiry 관측에 씁니다."]),
    ],
    diagnostics: [d("controller test는 통과하지만 browser/node failover에서 flash가 없거나 old session이 살아 있습니다.", "한 request mock만 검증하고 client cookie/redirect와 distributed repository timeline을 생략했습니다.", ["separate source/target assertions", "cookie jar/rotation", "node routing/store consistency", "flash consume/expiry"], "MockMvc two-request, real browser cookie/refresh/tab와 multi-node repository tests를 계층화합니다.", "배포 전 canary에 303 follow, one-time flash, old-id reject와 failover invalidation을 포함합니다.")],
    expertNotes: ["test framework가 redirect를 자동 follow하면 intermediate status/Location/Set-Cookie assertion이 사라지지 않게 raw response를 보존합니다.", "production sampling에서도 flash/session values 대신 schema logical id와 outcome category만 수집합니다."],
  },
  {
    id: "session-migration-governance",
    title: "legacy flash/session을 versioned 최소 state로 migration하고 안전하게 폐기합니다",
    lead: "controller-specific session attributes, manual HttpSession, security context와 distributed repository를 한 번에 바꾸면 rolling compatibility와 logout이 깨지므로 attribute inventory·schema adapter·canary·retirement를 단계화합니다.",
    explanations: [
      "attribute inventory에는 logical name, owner controller/security/domain, type/schema, sensitivity, size, read/write routes, TTL, concurrency와 serialization 여부를 값 없이 기록합니다. unknown attributes는 자동 복사하지 않습니다.",
      "@SessionAttributes는 controller conversation model에 쓰고 completion 시 SessionStatus로 정리하는 contract이며 permanent authentication state용 annotation으로 오용하지 않습니다.",
      "new repository/schema는 old payload reader와 new writer, 또는 explicit forced reauthentication policy를 정합니다. dual write가 필요하면 partial divergence와 rollback source of truth를 정의합니다.",
      "migration canary는 rotation, flash one-time, session size/latency, deserialize errors, concurrency conflicts, expiry/logout와 multi-node failover를 비교합니다. identifier/value는 capture하지 않습니다.",
      "legacy attribute 제거는 code search뿐 아니라 active stored sessions, rollback artifact와 long TTL을 고려합니다. max lifetime 후 usage zero, old serializer/type allowlist와 storage key zero를 확인합니다.",
    ],
    concepts: [
      c("session inventory", "attribute별 owner·schema·sensitivity·size·TTL·routes·concurrency를 값 없이 기록한 migration evidence입니다.", ["unknown state를 드러냅니다.", "retirement와 연결합니다."]),
      c("rolling compatibility", "old/new nodes가 migration window의 session/flash schema를 안전하게 읽고 쓰는 능력입니다.", ["bidirectional 여부를 정합니다.", "rollback을 보장합니다."]),
      c("forced reauthentication", "incompatible security/session migration에서 unsafe state 변환 대신 session을 폐기하고 다시 인증시키는 정책입니다.", ["UX/availability를 계획합니다.", "민감 state를 추측 변환하지 않습니다."]),
    ],
    diagnostics: [d("배포 롤백 후 new session을 old node가 못 읽거나 삭제한 attribute가 TTL 동안 계속 나타납니다.", "bidirectional schema/serializer와 max-session-lifetime retirement window를 계획하지 않았습니다.", ["old/new read-write matrix", "active TTL/key counts", "rollback artifact", "deprecated attribute telemetry"], "versioned adapter 또는 explicit reauthentication 정책을 두고 max lifetime+usage zero 뒤 old schema/type를 제거합니다.", "rolling old→new→old test와 stored-session retirement audit를 gate로 둡니다.")],
    expertNotes: ["session modernization의 성공 지표는 external store 도입이 아니라 fixation/lost-update/schema/expiry/zero-leak evidence입니다.", "long-lived authentication을 session serialization convenience로 설계하지 말고 revocable credential/session registry policy와 함께 검토합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-response-controller", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/controller/ResponseController.java", usedFor: ["logical view success versus redirect failure branch and flash attribute progression"], evidence: "read-only scan으로 Controller, RedirectAttributes, one POST login branch, one flash addition과 redirect return을 확인했습니다. 실제 credential values는 없으며 parameter comparison은 production authentication으로 사용하지 않습니다." },
  { id: "spring-redirect-reference", repository: "Spring Framework Reference", path: "Redirect Attributes", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/redirecting-passing-data.html", usedFor: ["redirect view names, explicit URI and flash attributes"], evidence: "Spring 공식 redirect attributes reference입니다." },
  { id: "spring-flash-reference", repository: "Spring Framework Reference", path: "Flash Attributes", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/flash-attributes.html", usedFor: ["input/output FlashMap, one-time delivery and target stamping"], evidence: "Spring 공식 flash attributes reference입니다." },
  { id: "spring-redirect-view", repository: "Spring Framework Javadoc", path: "RedirectView", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/view/RedirectView.html", usedFor: ["redirect URL, status and model exposure"], evidence: "Spring 공식 RedirectView API입니다." },
  { id: "spring-redirect-attributes", repository: "Spring Framework Javadoc", path: "RedirectAttributes", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/support/RedirectAttributes.html", usedFor: ["URI versus flash attribute contract"], evidence: "Spring 공식 RedirectAttributes API입니다." },
  { id: "spring-flash-map", repository: "Spring Framework Javadoc", path: "FlashMap", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/FlashMap.html", usedFor: ["target path/parameters, expiration and comparison"], evidence: "Spring 공식 FlashMap API입니다." },
  { id: "spring-session-flash-manager", repository: "Spring Framework Javadoc", path: "SessionFlashMapManager", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/support/SessionFlashMapManager.html", usedFor: ["session-backed FlashMap storage and mutex"], evidence: "Spring 공식 SessionFlashMapManager API입니다." },
  { id: "spring-session-attributes", repository: "Spring Framework Reference", path: "@SessionAttributes", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/sessionattributes.html", usedFor: ["controller conversation model lifecycle"], evidence: "Spring 공식 SessionAttributes reference입니다." },
  { id: "spring-session-attributes-api", repository: "Spring Framework Javadoc", path: "SessionAttributes", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/SessionAttributes.html", usedFor: ["temporary controller model versus permanent session state"], evidence: "Spring 공식 SessionAttributes API입니다." },
  { id: "spring-security-session", repository: "Spring Security Reference", path: "Session Management", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html", usedFor: ["session fixation protection and authentication session lifecycle"], evidence: "Spring Security 공식 session management reference입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework Reference", path: "MockMvc", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc.html", usedFor: ["redirected URL, flash and session two-request tests"], evidence: "Spring 공식 MockMvc reference입니다." },
  { id: "jakarta-request-dispatcher", repository: "Jakarta Servlet API", path: "RequestDispatcher", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/requestdispatcher", usedFor: ["forward versus redirect lifecycle"], evidence: "Jakarta EE 공식 RequestDispatcher API입니다." },
  { id: "jakarta-http-session", repository: "Jakarta Servlet API", path: "HttpSession", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpsession", usedFor: ["session attributes, expiry and invalidation"], evidence: "Jakarta EE 공식 HttpSession API입니다." },
  { id: "jakarta-http-request", repository: "Jakarta Servlet API", path: "HttpServletRequest", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletrequest", usedFor: ["getSession and changeSessionId"], evidence: "Jakarta EE 공식 HttpServletRequest API입니다." },
  { id: "jakarta-servlet", repository: "Jakarta EE Specification", path: "Jakarta Servlet 6.1", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/", usedFor: ["dispatch, session tracking, lifecycle and concurrency baseline"], evidence: "Jakarta EE 공식 Servlet specification release입니다." },
  { id: "rfc9110", repository: "RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["3xx, 303, 307, 308, Location and method semantics"], evidence: "IETF/RFC Editor 공식 HTTP semantics standard입니다." },
  { id: "rfc6265", repository: "RFC Editor", path: "RFC 6265 HTTP State Management Mechanism", publicUrl: "https://www.rfc-editor.org/rfc/rfc6265.html", usedFor: ["cookie state management baseline"], evidence: "IETF/RFC Editor 공식 cookie standard입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session Management", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["fixation, rotation, cookie flags, expiry and cache cleanup"], evidence: "OWASP 공식 session security guidance입니다." },
  { id: "owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site Request Forgery Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["unsafe methods, CSRF rotation and cookie-based sessions"], evidence: "OWASP 공식 CSRF prevention guidance입니다." },
  { id: "java-uri", repository: "Java SE 21 API", path: "URI", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html", usedFor: ["redirect target parsing and validation"], evidence: "Oracle JDK 공식 URI API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["request/session/idempotency state examples"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-linked-hash-map", repository: "Java SE 21 API", path: "LinkedHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html", usedFor: ["deterministic idempotency/session examples"], evidence: "Oracle JDK 공식 LinkedHashMap API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["flash and concurrent task examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-optional", repository: "Java SE 21 API", path: "Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["flash one-time lookup result"], evidence: "Oracle JDK 공식 Optional API입니다." },
  { id: "java-serializable", repository: "Java SE 21 API", path: "Serializable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html", usedFor: ["distributed session schema boundary"], evidence: "Oracle JDK 공식 Serializable API입니다." },
  { id: "java-atomic-reference", repository: "Java SE 21 API", path: "AtomicReference", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html", usedFor: ["versioned immutable session update example"], evidence: "Oracle JDK 공식 AtomicReference API입니다." },
  { id: "java-executor-service", repository: "Java SE 21 API", path: "ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["parallel session requests example"], evidence: "Oracle JDK 공식 ExecutorService API입니다." },
  { id: "java-instant", repository: "Java SE 21 API", path: "Instant", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html", usedFor: ["flash/session fixed-clock expiry examples"], evidence: "Oracle JDK 공식 Instant API입니다." },
  { id: "java-duration", repository: "Java SE 21 API", path: "Duration", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["session timeout example"], evidence: "Oracle JDK 공식 Duration API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-07-redirect-flash-session", slug: "mvc-07-redirect-flash-session", courseId: "spring", moduleId: "spring-mvc-request-response", order: 7,
  title: "redirect·flash attribute·session PRG 흐름", subtitle: "request boundary와 3xx method semantics부터 PRG/idempotency, FlashMap target, fixation 방어, 분산 직렬화·동시성·expiry와 migration까지 검증합니다.", level: "전문가", estimatedMinutes: 1100,
  coreQuestion: "POST 뒤 새 request로 안전하게 이동하면서 one-time message와 authenticated conversation을 보존하되 중복 mutation, flash 오소비, session fixation·lost update·serialization·expiry 실패를 어떻게 막을까요?",
  summary: "SpringBasic ResponseController를 read-only로 확인해 일반 logical JSP success, parameter comparison의 학습용 POST branch, RedirectAttributes flash 1회 추가와 redirect return progression을 사용했습니다. 원본에는 secure authentication, PRG idempotency, target-stamped flash, fixation rotation, distributed serialization/concurrency와 expiry operations가 없어 current Spring/Spring Security/Jakarta Servlet/HTTP/OWASP/JDK 공식 sources와 synthetic examples로 보완합니다. forward vs redirect boundary, 302/303/307/308, PRG와 retry idempotency, URI attributes vs flash, FlashMap target/expiry/tabs, HttpSession/cookie, privilege rotation/CSRF, versioned distributed schema, parallel lost update, idle/absolute expiry/logout/cache, transaction/delivery failure, layered two-request tests와 migration governance를 독립적으로 설명합니다. 다섯 JDK 21 examples는 forward/redirect, idempotent PRG, target flash, session rotation과 concurrent immutable state를 exact stdout으로 실행합니다.",
  objectives: ["forward와 redirect의 request/client state boundary를 구분한다.", "302/303/307/308의 next-method 의미에 맞게 status를 고른다.", "PRG와 POST idempotency/DB constraint를 함께 설계한다.", "redirect URI attribute와 one-time flash의 공개성·수명을 구분한다.", "FlashMap target matching·expiry·multi-tab race를 검증한다.", "HttpSession cookie, minimal attributes와 tracking modes를 설명한다.", "privilege change에서 session id와 CSRF state를 회전한다.", "distributed session schema·serialization·rolling compatibility를 운영한다.", "parallel requests의 lost update를 versioned immutable state로 막는다.", "idle/absolute expiry, logout/invalidation/cache cleanup을 구분한다.", "transaction·redirect·flash delivery failures와 layered tests/migration을 증명한다."],
  prerequisites: [{ title: "ViewResolver, JSP·EL·JSTL 렌더링", reason: "같은 request의 Model/JSP forward와 새 request의 redirect가 어떻게 다른지 알아야 flash/session에 무엇을 보존할지 판단할 수 있습니다.", sessionSlug: "mvc-06-view-resolver-jsp-el-jstl" }],
  keywords: ["redirect", "forward", "303 See Other", "PRG", "RedirectAttributes", "FlashMap", "HttpSession", "session fixation", "changeSessionId", "idempotency", "CSRF", "serialization", "lost update", "expiry", "logout"], topics,
  lab: {
    title: "legacy login redirect를 secure PRG·flash·session lifecycle로 재구성",
    scenario: "POST mutation/login이 logical view와 redirect를 혼용하고 generic session/flash에 state를 저장해 refresh 중복, wrong-tab notice, fixation, cluster failover와 logout leak가 발생할 수 있습니다.",
    setup: ["원본 controller는 read-only로 보존하고 annotations, branches, flash/redirect structure와 hash만 기록합니다.", "JDK 21 exact examples, supported Spring/Security/Servlet baseline, MockMvc browser cookie jar와 disposable multi-node session repository를 준비합니다.", "endpoint별 method/status/Location, idempotency, redirect/flash/session schema·sensitivity·TTL·owner matrix를 작성합니다.", "합성 identifiers만 사용하고 password, session id, CSRF value, user profile과 store payload는 출력·capture하지 않습니다."],
    steps: ["forward/view와 redirect routes를 inventory하고 source/target request contract를 분리합니다.", "PRG status/method를 303 중심으로 고정하고 307/308 use cases를 별도 검증합니다.", "mutation에 scoped idempotency key, payload fingerprint, DB constraint와 commit-before-redirect를 적용합니다.", "URI에는 public scalars만, flash에는 stable notice code/minimal parameters만 둡니다.", "flash target path/operation/expiry와 wrong request/multi-tab/one-time consumption을 test합니다.", "session attributes를 minimal versioned DTO/reference로 줄이고 cookie flags/tracking modes를 검사합니다.", "authentication/elevation에서 session id/CSRF generation을 회전하고 old id를 거부합니다.", "parallel request CAS/version, rolling serialization와 node failover/store failures를 실행합니다.", "idle/absolute expiry, logout/global revoke, browser cache/back와 cluster propagation을 검증합니다.", "two-request MockMvc, real browser와 multi-node canary·rollback·old schema retirement를 승인합니다."],
    expectedResult: ["POST refresh/duplicate retry가 domain effect를 한 번만 만들고 target GET은 side effect가 없습니다.", "다섯 Java example stdout이 문서와 완전히 같습니다.", "flash가 올바른 target에서 한 번만 소비되고 없어도 business truth가 유지됩니다.", "privilege change 뒤 old session id가 거부되고 multi-node parallel updates/expiry/logout가 일관됩니다.", "URL/log/metric/test artifact에 credential, session/CSRF values와 raw session payload가 없습니다."],
    cleanup: ["disposable sessions/store keys, flash entries, idempotency fixtures, browser cookies와 traces를 run id로 제거합니다.", "old serializer/schema, test security principals와 temporary diagnostics를 폐기합니다.", "active old sessions/flash/resources/threads와 credential-shaped canary가 0인지 확인합니다.", "원본 ResponseController.java는 변경하지 않습니다."],
    extensions: ["operation-id target stamping과 multi-tab property tests를 확장합니다.", "Redis/JDBC session repository rolling schema/failover chaos matrix를 만듭니다.", "global logout/revocation propagation SLO와 privacy-safe metrics를 구현합니다.", "stateful JSP flow를 signed one-time result resource 또는 stateless API/client flow와 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 request boundary→PRG→flash→rotation→concurrency 상태 전이를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "forward request와 redirect request 차이를 설명합니다.", "POST 두 번에도 write가 하나임을 확인합니다.", "wrong flash target이 소비하지 않음을 확인합니다.", "old session invalid와 id/CSRF rotation을 설명합니다.", "parallel quantity/version이 모두 8인지 확인합니다."], hints: ["화면 notice 전달 성공과 domain mutation 성공을 같은 칸에 쓰지 마세요."], expectedOutcome: "여러 HTTP requests와 session generations를 독립 state transition으로 설명합니다.", solutionOutline: ["dispatch→redirect→deduplicate→match/consume→rotate→version/update 순서입니다."] },
    { difficulty: "응용", prompt: "원본 redirect branch를 secure PRG·FlashMap·session flow로 migration하세요.", requirements: ["원본 parameter comparison을 auth로 재사용하지 않습니다.", "303/Location/method 계약을 둡니다.", "idempotency/DB commit failure schedules를 test합니다.", "URI/flash schema와 target/expiry를 정의합니다.", "session fixation/CSRF rotation을 적용합니다.", "minimal versioned session과 parallel update를 구현합니다.", "expiry/logout/cache/failover를 검증합니다.", "two-request/browser/multi-node canary와 rollback을 포함합니다."], hints: ["flash는 one-time UI notice이지 mutation result 저장소가 아닙니다."], expectedOutcome: "중복·오소비·fixation·lost update·serialization leak 없는 cross-request flow가 완성됩니다.", solutionOutline: ["inventory→HTTP contract→durable outcome→temporary delivery→secure session→qualify 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 redirect·flash·session 표준을 작성하세요.", requirements: ["forward/redirect와 3xx method 기준을 정의합니다.", "PRG/idempotency/transaction 규칙을 둡니다.", "URI와 flash sensitivity/size/expiry를 제한합니다.", "target matching/multi-tab semantics를 정의합니다.", "cookie/tracking/fixation/CSRF 정책을 둡니다.", "session schema/serialization/concurrency/TTL을 정의합니다.", "logout/cache/global revocation을 포함합니다.", "two-request/browser/multi-node tests, telemetry, migration/retirement를 포함합니다."], hints: ["session이라는 단어 대신 각 state의 owner, lifetime, consistency와 exposure를 적으세요."], expectedOutcome: "POST 시작부터 notice delivery·authenticated session 폐기까지 운영 가능한 governance가 완성됩니다.", solutionOutline: ["classify→mutate once→redirect→deliver once→rotate/version→expire/retire 순서입니다."] },
  ],
  nextSessions: ["mvc-08-responsebody-status-headers"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["ResponseController.java는 75 lines, Controller/ModelAttribute/RequestMapping/RequestParam annotations, 여러 logical view returns, one POST login branch, RedirectAttributes flash addition과 redirect return이 확인됐습니다.", "원본 parameter comparison은 학습용 branch이고 authentication manager, password hashing, CSRF, fixation rotation, rate limiting과 idempotency를 포함하지 않아 production login으로 사용하지 않았습니다.", "원본은 303/307 semantics, PRG retry, target-stamped flash, session tracking/security/schema/concurrency/expiry, multi-node tests와 migration을 다루지 않아 current official Spring/Security/Jakarta/RFC/OWASP/JDK sources와 synthetic examples로 보완했습니다.", "JDK stores는 browser redirect/cookies, real FlashMapManager, HttpSession/container locking, distributed repository consistency와 security framework를 대체하지 않습니다."] },
});

export default session;
