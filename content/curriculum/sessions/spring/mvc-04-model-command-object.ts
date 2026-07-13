import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + Math.min(12, lineCount), explanation: "command, Model, validation result, redirect/flash 또는 session lifecycle을 JDK 21 collection과 record로 정의합니다." },
      { lines: Math.min(13, lineCount) + "-" + Math.max(13, lineCount - 8), explanation: "GET 준비, POST bind/validate, same-request render, redirect와 다음 request/session completion 경로를 결정적으로 실행합니다." },
      { lines: Math.max(1, lineCount - 7) + "-" + lineCount, explanation: "attribute key, view/location, status, one-time/session state만 출력하고 실제 form 값·cookie·session id는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "javac --release 21", "Spring·JSP container·network·credential 불필요"], command: "javac --release 21 " + filename + " && java " + filename.replace(/\.java$/, "") },
    output: { value: output, explanation: ["stdout은 격리 JDK 21 실행 결과와 정확히 같아야 합니다.", "mini lifecycle은 Spring ModelFactory, WebDataBinder, FlashMapManager, HttpSession과 ViewResolver를 대체하지 않으므로 MockMvc와 target container/JSP test가 필요합니다."] },
    experiments: [
      { change: "attribute name, validation result 위치, redirect/flash 또는 session complete를 하나씩 바꿉니다.", prediction: "view가 command/error를 찾지 못하거나 URL leakage·duplicate submit·stale session state가 남습니다.", result: "request→model→view/redirect→next request/session lifecycle trace와 key manifest를 비교합니다." },
      { change: "동시 탭, large model/session object, unknown field와 template output을 주입합니다.", prediction: "shared session overwrite, serialization/replication 비용 또는 over-posting/XSS surface가 드러납니다.", result: "operation DTO, minimal view model, workflow token/version과 output encoding/size limits를 적용합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "model-request-lifecycle",
    title: "Model을 controller와 view 사이 한 request의 이름→값 계약으로 이해합니다",
    lead: "Model은 arbitrary object store가 아니라 선택한 view가 rendering에 필요한 data를 attribute name으로 받는 request-scope contract입니다. session이나 database처럼 장기 상태를 자동 보존하지 않습니다.",
    explanations: [
      "controller는 Model에 command, view DTO, lookup options와 safe status message를 넣고 logical view name을 반환할 수 있습니다. ViewResolver/renderer는 같은 request에서 attributes를 읽어 representation을 만듭니다.",
      "원본 QuizController는 ModelAttribute, Model과 RedirectAttributes progression을 보여 주고 Quiz01VO는 3개 private field와 getter/setter를 가진 mutable command 출발점입니다. 실제 attribute/view/form 값은 복제하지 않고 구조만 provenance로 사용합니다.",
      "Model attribute는 request lifetime이 기본이며 redirect는 새 request라 그대로 전달되지 않습니다. redirect query attribute, flash와 session 중 필요한 lifetime을 명시적으로 선택합니다.",
      "Model에 persistence entity, lazy proxy, Connection/stream 또는 거대한 graph를 넣지 않습니다. view에 필요한 immutable projection만 만들고 rendering 전에 resource work를 끝냅니다.",
      "동시 request마다 Model instance는 분리돼야 하며 singleton controller field에 model/command를 저장하지 않습니다. request isolation을 concurrent test로 확인합니다.",
    ],
    concepts: [
      c("Model", "controller가 view rendering에 전달할 attribute 이름과 값을 보관하는 Spring MVC contract입니다.", ["기본 request scope입니다.", "view-specific data만 둡니다.", "redirect/session과 lifetime을 구분합니다."]),
      c("model attribute", "Model에서 이름으로 참조되는 command 또는 view data object입니다.", ["stable 이름을 정합니다.", "output exposure를 검토합니다."]),
      c("view model", "화면에 필요한 값과 표현 상태만 담아 domain/persistence object를 직접 노출하지 않는 projection입니다.", ["최소 field를 사용합니다.", "output encoding과 연결합니다."]),
    ],
    codeExamples: [java("mvc04-model-lifecycle", "command와 view result를 request Model에 전달", "Mvc04ModelLifecycle.java", "합성 command를 같은 request Model에 이름으로 넣고 controller result와 view가 관찰할 key를 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc04ModelLifecycle {
  record QuizCommand(String choice) {}
  record Response(int status, String view, Map<String, Object> model) {}

  static Response handle(QuizCommand command) {
    Map<String, Object> model = new LinkedHashMap<>();
    model.put("quizForm", command);
    model.put("resultCode", "accepted");
    return new Response(200, "quiz/result", Map.copyOf(model));
  }

  public static void main(String[] args) {
    Response response = handle(new QuizCommand("A"));
    System.out.println("status=" + response.status());
    System.out.println("view=" + response.view());
    System.out.println("keys=" + response.model().keySet().stream().sorted().toList());
    System.out.println("command-type=" + response.model().get("quizForm").getClass().getSimpleName());
    System.out.println("request-scoped=true");
  }
}`, "status=200\nview=quiz/result\nkeys=[quizForm, resultCode]\ncommand-type=QuizCommand\nrequest-scoped=true", ["local-quiz-controller", "local-quiz-command", "spring-model-methods", "spring-return-values", "spring-model-api", "java-map"])],
    diagnostics: [d("controller에서는 attribute를 넣었지만 JSP/template에서 null이거나 다른 request 값이 섞입니다.", "attribute name/view contract가 불일치하거나 singleton controller field/session에 request state를 저장했습니다.", ["selected view", "model key/type manifest", "request vs session scope", "controller fields", "concurrent request trace"], "stable public attribute name과 request-local immutable view model을 사용하고 renderer contract를 test합니다.", "동시 두 request의 model identity/key/value category와 view output isolation을 검증합니다.")],
    expertNotes: ["Model은 MVC transport object이며 domain model이라는 용어와 혼동하지 않습니다.", "attribute에 넣은 object의 toString이나 debugger dump가 PII를 노출하지 않도록 telemetry를 구조화합니다."],
  },
  {
    id: "attribute-name-collision",
    title: "attribute name을 view schema로 관리하고 implicit naming·collision을 통제합니다",
    lead: "command type에서 유추된 이름은 편리하지만 type rename, 여러 같은 type과 ControllerAdvice attribute가 만나면 view contract가 흔들립니다. public template key를 명시적으로 관리합니다.",
    explanations: [
      "@ModelAttribute 이름을 명시하지 않으면 type/convention으로 이름이 유추될 수 있습니다. form tag나 template가 기대하는 이름과 controller signature를 같은 contract test에 둡니다.",
      "controller-level @ModelAttribute method는 handler 전에 공통 model을 준비할 수 있고 ControllerAdvice도 attributes를 추가할 수 있습니다. 같은 key override 순서에 의존하지 않도록 ownership을 정합니다.",
      "Model.addAttribute의 naming convention은 collection/anonymous/empty value에서 의도가 불명확할 수 있습니다. 중요한 command와 error/status key는 explicit name을 사용합니다.",
      "framework reserved 또는 security-sensitive key와 충돌하지 않게 prefix/naming policy를 둡니다. client가 attribute name을 정하게 하거나 arbitrary map 전체를 model에 복사하지 않습니다.",
      "route별 model schema에는 key, safe type, required/optional, scope와 view consumer를 기록합니다. renderer migration 때 old/new key를 differential test합니다.",
    ],
    concepts: [
      c("attribute name", "Model에서 command/view data를 식별하고 view expression/form binding이 참조하는 key입니다.", ["public view schema로 관리합니다.", "명시적 이름을 우선합니다."]),
      c("@ModelAttribute method", "handler 실행 전에 model attribute를 준비하는 controller/advice method입니다.", ["공통 lookup data에 사용합니다.", "I/O/override를 통제합니다."]),
      c("model schema", "특정 view가 요구하는 attribute key·type·scope·필수성을 정의한 계약입니다.", ["route와 version에 연결합니다.", "renderer test로 검증합니다."]),
    ],
    diagnostics: [d("class rename 또는 공통 advice 추가 뒤 form binding key가 바뀌고 view가 빈 객체를 만듭니다.", "implicit attribute naming과 key collision/override 순서에 의존했습니다.", ["handler argument attribute name", "ModelAttribute methods/advice order", "final model keys/types", "view form modelAttribute", "framework upgrade diff"], "command/view attribute 이름을 명시하고 route별 model schema와 duplicate-key startup/test gate를 둡니다.", "old/new controller/renderer에 같은 request를 실행해 final model key/type와 form redisplay를 비교합니다.")],
    expertNotes: ["attribute key는 template 내부 구현처럼 보여도 controller-view 사이 호환성 contract입니다.", "global advice model I/O가 모든 request latency/failure surface를 넓히지 않게 최소화합니다."],
  },
  {
    id: "command-object-creation-binding",
    title: "command object의 생성→binding→validation→service 변환 lifecycle을 분리합니다",
    lead: "@ModelAttribute command는 request parameter가 JavaBean property에 자동 반영되는 편리함을 제공하지만 creation source와 writable surface를 명시하지 않으면 over-posting과 stale state가 생깁니다.",
    explanations: [
      "command는 default constructor/property binding 또는 constructor binding, model/session lookup, converter 등으로 준비될 수 있습니다. 어떤 source가 object identity를 정하고 request가 어떤 field만 바꾸는지 명시합니다.",
      "원본 Quiz01VO는 3개 mutable field, 3 getter와 3 setter progression을 보입니다. 교육 자료는 field 이름/값을 복사하지 않고 mutable JavaBean binding surface가 세 개라는 구조만 사용합니다.",
      "operation-specific input DTO는 public field만 포함하고 server-owned id, owner, role, status와 audit를 제외합니다. validation 뒤 service command/domain object로 explicit mapping합니다.",
      "BindingResult는 command 바로 뒤에서 binding/validation errors를 받도록 handler signature를 구성합니다. error가 있으면 service/transaction을 호출하지 않고 같은 form view에 command와 safe errors를 전달합니다.",
      "session에서 기존 object를 가져와 bind하는 경우 stale/unauthorized object를 직접 mutate하기 전에 current principal, workflow token과 version을 검증합니다.",
    ],
    concepts: [
      c("command object", "한 form/API operation의 입력을 binding·validation하기 위한 dedicated web object입니다.", ["entity와 분리합니다.", "public field만 포함합니다.", "service command로 변환합니다."]),
      c("WebDataBinder", "request 값을 target command property에 conversion/binding하고 field policy를 적용하는 binder입니다.", ["request마다 분리됩니다.", "allowed fields를 둡니다."]),
      c("BindingResult", "command binding·validation errors와 suppressed field를 같은 request의 view/controller에 제공하는 결과입니다.", ["target 바로 뒤에 둡니다.", "service 호출 전 확인합니다."]),
    ],
    diagnostics: [d("검증 error가 있는데 service가 실행되거나 form 재표시에서 사용자가 입력한 안전한 값과 error가 사라집니다.", "BindingResult 위치/분기와 same-request Model lifecycle을 지키지 않고 즉시 redirect 또는 새 command를 만들었습니다.", ["handler argument order", "binding/validation error count", "service-called flag", "model command identity", "selected view/redirect"], "error path는 same-request form view와 기존 command/BindingResult를 사용하고 success만 transaction 후 redirect합니다.", "field/global/unknown/type error마다 service 호출 0, model key/error와 rendered field를 검증합니다.")],
    expertNotes: ["검증 실패의 command를 session에 장기 보관하지 말고 필요한 safe form state만 request model에 유지합니다.", "mutable command setter 수가 곧 public 허용 field 수가 되지 않도록 DTO/allowlist를 사용합니다."],
  },
  {
    id: "validation-redisplay-boundary",
    title: "검증 실패는 같은 request에서 form을 재표시하고 성공만 PRG로 전환합니다",
    lead: "validation error 뒤 redirect하면 BindingResult와 command가 사라져 flash/session 복제가 필요해지고 새 request가 stale state를 만들 수 있습니다. 기본 흐름은 같은 request에서 view를 render하는 것입니다.",
    explanations: [
      "GET은 빈/default command와 lookup options를 Model에 넣어 form을 준비합니다. POST는 command를 bind/validate하고 errors가 있으면 같은 logical form view를 반환합니다.",
      "error response status를 200 또는 400으로 정하는 정책은 browser UX, monitoring과 cache에 영향을 줍니다. 어느 것을 선택하든 route 전체에서 일관되게 test합니다.",
      "field errors는 public field/code/message로 제한하고 rejected raw value, class/constraint internals를 view/log에 노출하지 않습니다. global error는 cross-field/domain-safe rule을 표현합니다.",
      "성공 path는 service transaction을 완료한 뒤 redirect해 refresh 재제출을 줄이고 flash success code를 전달할 수 있습니다. commit 전 redirect/location을 확정 성공으로 보내지 않습니다.",
      "lookup option처럼 form 재표시에 필요한 model attributes도 error path에 준비합니다. @ModelAttribute method 또는 명시적 helper의 I/O/실패를 bounded하게 유지합니다.",
    ],
    concepts: [
      c("form redisplay", "binding/validation 실패 시 같은 request command와 errors로 입력 화면을 다시 render하는 흐름입니다.", ["service를 호출하지 않습니다.", "lookup model을 복원합니다."]),
      c("field error", "특정 public command field의 binding/constraint 실패를 나타내는 safe code/message입니다.", ["raw value를 숨깁니다.", "attribute name과 연결됩니다."]),
      c("Post/Redirect/Get", "성공한 unsafe POST 뒤 GET location으로 redirect해 browser refresh의 form 재제출을 줄이는 pattern입니다.", ["validation error에는 보통 redirect하지 않습니다.", "network idempotency를 대체하지 않습니다."]),
    ],
    codeExamples: [java("mvc04-validation-flow", "검증 실패 view와 성공 redirect 분기", "Mvc04ValidationFlow.java", "합성 command의 empty/valid 입력을 검사해 error path service 미호출과 success 303 redirect를 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Mvc04ValidationFlow {
  record Command(String answer) {}
  record Response(int status, String target, boolean serviceCalled, Map<String, Object> model) {}

  static Response submit(Command command) {
    if (command.answer() == null || command.answer().isBlank()) {
      Map<String, Object> model = new LinkedHashMap<>();
      model.put("quizForm", command);
      model.put("errors", List.of("answer.required"));
      return new Response(400, "quiz/form", false, Map.copyOf(model));
    }
    return new Response(303, "/quiz/result", true, Map.of());
  }

  public static void main(String[] args) {
    Response invalid = submit(new Command(""));
    Response valid = submit(new Command("A"));
    System.out.println("invalid=" + invalid.status() + "," + invalid.target());
    System.out.println("invalid-keys=" + invalid.model().keySet().stream().sorted().toList());
    System.out.println("invalid-service=" + invalid.serviceCalled());
    System.out.println("valid=" + valid.status() + "," + valid.target());
    System.out.println("valid-service=" + valid.serviceCalled());
  }
}`, "invalid=400,quiz/form\ninvalid-keys=[errors, quizForm]\ninvalid-service=false\nvalid=303,/quiz/result\nvalid-service=true", ["local-quiz-controller", "local-quiz-command", "spring-model-attribute", "spring-mockmvc", "spring-validation", "rfc9110-redirect", "java-list"])],
    diagnostics: [d("validation 실패 뒤 redirect되어 error와 입력이 사라지거나 stale flash data가 다른 tab에 보입니다.", "error path와 success PRG를 구분하지 않고 모든 POST 결과를 redirect했습니다.", ["BindingResult errors", "selected view vs redirect", "same-request model command", "flash/session use", "service/commit outcome"], "error는 same-request form render, 성공은 commit 뒤 303 redirect로 분리하고 각 lifecycle을 test합니다.", "invalid/valid/double-submit/concurrent tab에서 model/errors/service-called/location/flash 결과를 검증합니다.")],
    expertNotes: ["HTML form 400 사용 여부는 UX/monitoring 계약으로 정하고 template가 정상 render되는지 확인합니다.", "PRG는 duplicate network request나 commit unknown을 막지 않으므로 idempotency가 별도로 필요합니다."],
  },
  {
    id: "minimal-view-model-output",
    title: "domain/entity를 최소 view model로 투영하고 template output을 안전하게 render합니다",
    lead: "Model에 entity를 그대로 넣으면 lazy relation, internal status, owner와 credential-shaped field가 template expression에 노출될 수 있습니다. view가 요구하는 field만 explicit projection으로 전달합니다.",
    explanations: [
      "view model은 display label, safe identifier, formatted presentation value와 UI state만 포함합니다. persistence annotation/lazy proxy와 transaction resource를 view layer에 넘기지 않습니다.",
      "input command와 output view model은 방향이 다릅니다. command는 client가 보낼 field, view model은 server가 보여 줄 field이므로 하나의 양방향 DTO로 합치지 않습니다.",
      "template engine/JSP EL output은 context-aware escaping을 기본으로 사용하고 raw HTML 출력은 trusted sanitized content만 허용합니다. URL/JS/CSS context는 HTML text와 encoding 규칙이 다릅니다.",
      "collection view는 pagination, maximum rows와 nested graph depth를 제한합니다. view rendering이 추가 lazy SQL을 발생시키지 않도록 service transaction 안에서 projection을 완성합니다.",
      "model telemetry에는 key/type/count/size bucket만 남기고 object toString, full JSON과 rendered HTML을 일반 log에 넣지 않습니다.",
    ],
    concepts: [
      c("projection", "domain/persistence state에서 특정 view가 필요한 safe field만 선택해 새 object로 만드는 변환입니다.", ["lazy resource를 끊습니다.", "최소 field를 노출합니다."]),
      c("output encoding", "값이 삽입될 HTML/attribute/URL/JS 등의 문맥에 맞춰 특수 문자를 안전하게 표현하는 처리입니다.", ["validation과 별개입니다.", "raw output을 제한합니다."]),
      c("N+1 rendering", "view가 lazy relation을 반복 접근해 row마다 추가 query를 발생시키는 문제입니다.", ["projection/query plan으로 막습니다.", "render phase DB 접근 0을 검증합니다."]),
    ],
    codeExamples: [java("mvc04-view-model", "server-owned field를 제외한 view projection", "Mvc04ViewModel.java", "합성 domain map에서 승인된 public field만 immutable view map으로 복사하고 internal key가 빠졌는지 검증합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public class Mvc04ViewModel {
  static Map<String, Object> project(Map<String, Object> domain) {
    Set<String> visible = Set.of("id", "title", "statusLabel");
    Map<String, Object> view = new LinkedHashMap<>();
    visible.stream().sorted().forEach(key -> view.put(key, domain.get(key)));
    return Map.copyOf(view);
  }

  public static void main(String[] args) {
    Map<String, Object> domain = Map.of(
        "id", 7, "title", "Lesson", "statusLabel", "Ready",
        "ownerInternal", "hidden", "secretToken", "hidden");
    Map<String, Object> view = project(domain);
    System.out.println("view-keys=" + view.keySet().stream().sorted().toList());
    System.out.println("owner-visible=" + view.containsKey("ownerInternal"));
    System.out.println("secret-visible=" + view.containsKey("secretToken"));
    System.out.println("view-size=" + view.size());
    System.out.println("raw-domain-logged=false");
  }
}`, "view-keys=[id, statusLabel, title]\nowner-visible=false\nsecret-visible=false\nview-size=3\nraw-domain-logged=false", ["spring-data-binding", "spring-view-resolution", "spring-model-api", "java-map"])],
    diagnostics: [d("view rendering 중 추가 SQL이 폭증하거나 내부 field가 HTML/JSON에 노출됩니다.", "persistence entity/lazy graph를 Model에 직접 넣고 output projection/encoding 경계를 두지 않았습니다.", ["model value runtime types", "view field expressions", "render-phase SQL", "response secret/PII scan", "collection/depth size"], "service에서 bounded immutable view model을 만들고 template는 approved field와 context-aware encoding만 사용합니다.", "render-phase DB query 0, model key allowlist, malicious text encoding과 response secret canary를 검증합니다.")],
    expertNotes: ["view model 이름은 domain model과 달리 representation change cadence에 맞춰 versioning합니다.", "hidden input으로 되돌아오는 값도 client-controlled이므로 server-owned state로 신뢰하지 않습니다."],
  },
  {
    id: "handler-return-modelandview",
    title: "String view·ModelAndView·void·response body 반환을 rendering 계약별로 구분합니다",
    lead: "Controller return type은 단순 Java 문법이 아니라 HandlerMethodReturnValueHandler가 Model, view resolution 또는 response body를 어떻게 처리할지 결정합니다.",
    explanations: [
      "String은 일반 @Controller에서 logical view name이 될 수 있고 ModelAndView는 view와 model을 함께 표현합니다. @ResponseBody/RestController의 object는 message conversion path로 가므로 같은 type을 문맥 없이 해석하지 않습니다.",
      "원본 ResponseController의 ModelAndView와 Model/redirect progression은 여러 반환 style을 비교할 학습 근거입니다. 실제 view/attribute literal은 복사하지 않습니다.",
      "logical view name은 configured resolver의 prefix/suffix와 결합됩니다. view name을 request input에서 직접 만들면 path traversal/template selection 위험이 있어 allowlist를 둡니다.",
      "ResponseEntity는 explicit status/header/body에 적합하고 HTML form rendering은 Model+view가 자연스럽습니다. 한 controller에서 반환 style을 섞을 때 public representation contract를 분명히 합니다.",
      "async return, streaming과 exception은 Model lifetime과 resource ownership을 바꿀 수 있습니다. 이 세션의 synchronous JSP model과 별도 qualification합니다.",
    ],
    concepts: [
      c("ModelAndView", "logical/actual view와 model attributes를 함께 보유하는 Spring MVC return object입니다.", ["String+Model과 비교합니다.", "view contract를 명시합니다."]),
      c("return value handler", "controller return type/annotation을 해석해 ModelAndView, response body 또는 async 처리로 연결하는 MVC strategy입니다.", ["selected handler를 관측합니다.", "representation마다 다릅니다."]),
      c("logical view name", "ViewResolver가 실제 template/JSP resource로 해석하는 application-level view identifier입니다.", ["request input으로 직접 만들지 않습니다.", "resolver chain을 검증합니다."]),
    ],
    diagnostics: [d("같은 String return이 어떤 handler에서는 view로, 다른 handler에서는 body로 나가거나 view path가 노출됩니다.", "Controller/ResponseBody context와 return value handler/view resolver 계약을 구분하지 않았습니다.", ["controller annotations", "return type/handler", "selected ViewResolver", "logical/physical view", "Content-Type/body"], "HTML view와 body controller 경계를 명시하고 return style별 route contract와 resolver allowlist를 둡니다.", "String/ModelAndView/ResponseEntity success와 missing view/406/render 5xx를 actual configuration에서 검증합니다.")],
    expertNotes: ["ModelAndView가 더 명시적이라고 항상 더 좋은 것은 아니며 팀의 view contract와 testability에 맞춰 일관성을 선택합니다.", "physical JSP/template path와 server filesystem 구조를 public error에 노출하지 않습니다."],
  },
  {
    id: "redirect-prg-uri-attributes",
    title: "redirect를 새 request로 보고 URI attribute·status·commit 순서를 설계합니다",
    lead: "redirect: view는 server-side forward가 아니라 client에게 Location을 보내 새 request를 유도합니다. 기존 request Model과 BindingResult는 사라지고 URL에 넣은 값은 외부에 노출됩니다.",
    explanations: [
      "성공한 POST 뒤 303 See Other를 사용하면 다음 retrieval을 GET으로 분명히 할 수 있습니다. framework/browser의 302 처리도 qualification하되 contract에는 의도한 status와 method를 명시합니다.",
      "RedirectAttributes의 일반 attribute는 URI template/query에 사용될 수 있어 public stable ID, page 같은 값만 넣습니다. object, message, PII와 secret을 URL에 넣지 않습니다.",
      "redirect target은 allowlisted internal route 또는 안전한 URI builder로 생성합니다. client-supplied returnUrl은 host/scheme/path policy를 검증해 open redirect를 막습니다.",
      "service transaction commit 성공 뒤 Location/flash success를 만듭니다. commit outcome unknown이면 성공 redirect를 보내지 않고 idempotency/readback으로 reconciliation합니다.",
      "redirect loop, stale route와 proxy public base URL을 test합니다. untrusted Host/Forwarded header로 external Location을 만들지 않습니다.",
    ],
    concepts: [
      c("redirect", "3xx와 Location으로 client가 다른 URI에 새 request를 보내도록 하는 HTTP response입니다.", ["Model request lifetime이 끝납니다.", "open redirect를 막습니다."]),
      c("redirect attribute", "redirect URI template 또는 query에 포함할 명시적 값입니다.", ["URL에 노출됩니다.", "public primitive만 사용합니다."]),
      c("Post/Redirect/Get", "성공한 POST 후 retrieval GET으로 이동해 browser refresh 재제출을 줄이는 lifecycle입니다.", ["commit 뒤 실행합니다.", "중복 transport retry는 별도 처리합니다."]),
    ],
    diagnostics: [d("redirect URL에 command/object field나 내부 host가 붙거나 외부 사이트로 이동합니다.", "default Model 전체를 redirect에 노출하거나 untrusted host/returnUrl을 검증 없이 사용했습니다.", ["Location status/URI", "RedirectAttributes keys", "default model redirect policy", "forwarded host trust", "open redirect allowlist"], "redirect에 필요한 public ID만 explicit RedirectAttributes로 넣고 target/base URI를 trusted configuration으로 만듭니다.", "PII model, hostile Host/Forwarded/returnUrl과 redirect loop corpus에서 Location allowlist·query leakage 0을 검증합니다.")],
    expertNotes: ["redirect는 view rendering 방식이 아니라 별도 HTTP round trip입니다.", "default Model을 redirect URL에 자동 노출하는 legacy behavior를 명시적으로 검토합니다."],
  },
  {
    id: "flash-attribute-one-time",
    title: "flash attribute를 redirect 사이 한 번만 전달되는 짧은 session-backed 상태로 다룹니다",
    lead: "성공 메시지나 새 resource reference를 URL에 넣지 않으려 flash를 사용할 수 있지만 보통 session을 임시 저장소로 사용합니다. 동시 request와 matching이 있어 durable queue나 workflow state로 쓰면 안 됩니다.",
    explanations: [
      "output FlashMap은 redirect 전에 저장되고 다음 matching request가 input FlashMap으로 소비합니다. 한 번 소비되면 이후 refresh에는 없어야 합니다.",
      "flash에는 작은 safe code와 public reference만 둡니다. 전체 command, validation errors, entity, upload와 민감정보를 넣으면 session size·동시 탭·leakage 위험이 커집니다.",
      "동시 tab/request가 같은 target으로 redirect하면 어느 flash가 어느 request에 매칭되는지 실제 FlashMapManager와 session policy를 검증합니다. 중요한 workflow state는 URL token/database에 명시적으로 저장합니다.",
      "session이 없거나 만료되고 node affinity/replication이 바뀌면 flash delivery가 실패할 수 있습니다. flash 메시지는 best-effort UX인지 durable business requirement인지 구분합니다.",
      "metric에는 flash created/consumed/expired count와 safe type만 둡니다. session id, message text와 command payload를 기록하지 않습니다.",
    ],
    concepts: [
      c("flash attribute", "redirect 전 임시 저장되어 다음 matching request Model에 한 번 전달되는 attribute입니다.", ["보통 session을 사용합니다.", "URL에 나타나지 않습니다.", "durable state가 아닙니다."]),
      c("FlashMap", "target request 정보와 flash attributes를 보유하는 Spring MVC 구조입니다.", ["output/input lifecycle이 있습니다.", "concurrency matching을 검증합니다."]),
      c("one-time consumption", "다음 적합한 request가 값을 사용한 뒤 반복 request에서는 다시 보이지 않는 성질입니다.", ["refresh를 test합니다.", "loss 허용을 정합니다."]),
    ],
    codeExamples: [java("mvc04-flash", "303 redirect 뒤 flash 1회 소비", "Mvc04Flash.java", "작은 FlashStore가 target path용 safe code를 저장하고 첫 GET에서만 소비하는 lifecycle을 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc04Flash {
  static final class FlashStore {
    final Map<String, String> pending = new LinkedHashMap<>();
    void put(String target, String code) { pending.put(target, code); }
    String consume(String target) { return pending.remove(target); }
  }

  public static void main(String[] args) {
    FlashStore flash = new FlashStore();
    String location = "/quiz/result";
    flash.put(location, "quiz.saved");
    String firstGet = flash.consume(location);
    String refresh = flash.consume(location);
    System.out.println("post-status=303");
    System.out.println("location=" + location);
    System.out.println("first-get=" + firstGet);
    System.out.println("refresh=" + refresh);
    System.out.println("pending=" + flash.pending.size());
  }
}`, "post-status=303\nlocation=/quiz/result\nfirst-get=quiz.saved\nrefresh=null\npending=0", ["local-quiz-controller", "spring-redirect-attributes", "spring-flash-attributes", "spring-redirect-api", "rfc9110-redirect", "java-map"])],
    diagnostics: [d("다른 tab의 성공 메시지가 보이거나 refresh마다 flash가 반복되고 session이 커집니다.", "flash target matching/one-time consumption을 검증하지 않고 큰 command/entity를 저장했습니다.", ["flash target/path", "created/consumed/expired counts", "payload type/size", "concurrent requests/tabs", "session replication/expiry"], "flash를 small safe code로 제한하고 exact target·one-time consume를 검증하며 workflow state는 durable store/token으로 분리합니다.", "동시 tab, same target, refresh, back, session expiry와 multi-node에서 flash delivery/loss/size를 qualification합니다.")],
    expertNotes: ["flash delivery 실패가 business correctness를 깨뜨리면 flash가 아니라 durable workflow가 필요합니다.", "flash가 URL에 없다고 자동으로 비밀 저장소가 되는 것은 아니며 session 보안 정책을 따릅니다."],
  },
  {
    id: "session-attributes-lifecycle",
    title: "@SessionAttributes를 conversation scope로 제한하고 SessionStatus 완료를 명시합니다",
    lead: "여러 request form wizard처럼 model attribute를 session에 승격할 수 있지만 완료를 호출하지 않으면 stale command가 사용자 session에 남습니다. HttpSession 전체와 controller conversation의 owner를 구분합니다.",
    explanations: [
      "@SessionAttributes는 controller가 사용하는 특정 model attribute name/type을 request 사이 session에 보존합니다. global session store처럼 arbitrary state를 넣는 annotation이 아닙니다.",
      "workflow 시작 시 command/version/token을 만들고 각 step은 current user/tenant/workflow token을 검증합니다. 완료·취소·timeout에서 SessionStatus.setComplete와 관련 resource cleanup을 수행합니다.",
      "browser 두 tab이 같은 attribute name을 공유하면 서로의 step/state를 overwrite할 수 있습니다. workflow instance id별 server-side state 또는 tab-specific token과 optimistic version을 사용합니다.",
      "session에는 작은 serializable state만 두고 entity/lazy proxy, upload bytes와 credential을 넣지 않습니다. cluster replication, serialization compatibility와 logout/session fixation policy를 고려합니다.",
      "session expiration/error 뒤 recovery는 safe restart 또는 durable draft readback으로 설계합니다. stale command를 조용히 새 request에 재사용하지 않습니다.",
    ],
    concepts: [
      c("@SessionAttributes", "특정 controller model attribute를 여러 request 동안 HttpSession에 보존하는 annotation입니다.", ["conversation에 제한합니다.", "name/type ownership을 명시합니다."]),
      c("SessionStatus", "controller conversation이 끝났음을 알려 session-stored model attributes를 정리하도록 하는 contract입니다.", ["setComplete를 호출합니다.", "HttpSession 전체 invalidate와 다릅니다."]),
      c("conversation scope", "여러 HTTP request로 이어지는 한 workflow instance의 제한된 상태 lifetime입니다.", ["workflow token/version을 둡니다.", "완료·취소·만료를 정의합니다."]),
    ],
    codeExamples: [java("mvc04-session-conversation", "wizard session attribute 생성·진행·완료", "Mvc04SessionConversation.java", "합성 session map에서 workflow command를 두 step 동안 유지하고 complete에서 제거하는 lifecycle을 실행합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Mvc04SessionConversation {
  record Wizard(String token, int step) {}

  public static void main(String[] args) {
    Map<String, Object> session = new LinkedHashMap<>();
    session.put("wizard", new Wizard("synthetic", 1));
    Wizard first = (Wizard) session.get("wizard");
    session.put("wizard", new Wizard(first.token(), 2));
    Wizard second = (Wizard) session.get("wizard");
    boolean sameToken = first.token().equals(second.token());
    session.remove("wizard");
    System.out.println("first-step=" + first.step());
    System.out.println("second-step=" + second.step());
    System.out.println("same-token=" + sameToken);
    System.out.println("complete=true");
    System.out.println("session-attribute-present=" + session.containsKey("wizard"));
  }
}`, "first-step=1\nsecond-step=2\nsame-token=true\ncomplete=true\nsession-attribute-present=false", ["spring-session-attributes", "spring-session-status-api", "spring-security-session", "jakarta-servlet", "java-map"])],
    diagnostics: [d("완료한 wizard 값이 새 작업에 남거나 두 tab이 서로의 command를 덮습니다.", "고정 session attribute name을 workflow instance 구분 없이 사용하고 setComplete/timeout cleanup을 하지 않았습니다.", ["session attribute keys/types/size", "workflow token/version", "tab/request sequence", "SessionStatus completion", "expiry/logout cleanup"], "workflow별 token/version과 bounded state를 사용하고 완료·취소·timeout에 conversation attribute를 정리합니다.", "두 tab concurrent steps, stale version, complete/cancel/expiry/logout과 cluster serialization을 검증합니다.")],
    expertNotes: ["SessionStatus.setComplete는 보통 session 전체 logout/invalidate가 아니라 해당 conversation attributes 완료 의미입니다.", "session state가 늘수록 horizontal scaling, fixation/hijacking impact와 serialization migration 비용이 커집니다."],
  },
  {
    id: "model-lifecycle-observability-testing",
    title: "Model·view·redirect·flash·session을 request sequence와 secret-zero evidence로 검증합니다",
    lead: "한 controller method unit test만으로 redirect 다음 request와 session cleanup을 증명할 수 없습니다. GET→invalid POST→valid POST→redirect GET→refresh→complete/expiry sequence를 외부 관점에서 실행합니다.",
    explanations: [
      "pure test는 command validation/projection을, MockMvc는 Model/BindingResult/view/redirect/flash/session을, actual container/JSP test는 HttpSession cookie, ViewResolver와 rendering/encoding을 검증합니다.",
      "assertion에는 status, view name/location, model key/type, field/global error code, flash input/output, session attribute presence/version, service-called와 state effect를 포함합니다.",
      "model/session dump를 log에 남기지 않고 normalized route, selected return handler/view category, key count/type allowlist, flash/session size bucket과 lifecycle outcome만 관측합니다.",
      "failure corpus는 missing view/template exception, flash save failure, session expiry/serialization, concurrent tab conflict, commit unknown과 renderer encoding을 포함합니다.",
      "framework/JSP/template migration은 old/new request sequence를 differential 실행해 view model schema, HTML semantics, redirect/flash/session behavior와 security headers를 비교합니다.",
    ],
    concepts: [
      c("request sequence test", "여러 HTTP request와 redirect/session 변화를 순서대로 실행해 전체 conversation outcome을 검증하는 테스트입니다.", ["cookie/session을 유지합니다.", "refresh/동시 tab을 포함합니다."]),
      c("model evidence", "raw 값 없이 attribute key/type/count, selected view와 error/flash/session lifecycle을 나타내는 bounded 증거입니다.", ["PII를 제외합니다.", "route/version과 연결합니다."]),
      c("renderer qualification", "logical view와 model이 target JSP/template engine에서 encoding·status·content contract대로 render되는지 검증하는 과정입니다.", ["MockMvc만으로 대체하지 않습니다.", "actual container를 사용합니다."]),
    ],
    diagnostics: [d("MockMvc 단일 호출은 통과하지만 실제 redirect/refresh/session expiry나 JSP render에서 state/error가 사라지거나 노출됩니다.", "request sequence, target ViewResolver/renderer와 session/flash lifecycle을 포함하지 않았습니다.", ["test configuration/return handler", "view resolver/template artifact", "redirect follow-up", "flash/session before/after", "rendered response security scan"], "GET→invalid/valid POST→redirect GET→refresh/complete sequence를 actual configuration과 container에서 실행합니다.", "동시 tab, expiry, missing view, encoding payload와 renderer/framework upgrade differential을 release gate에 둡니다.")],
    expertNotes: ["view name assertion만 맞아도 rendered HTML과 encoding이 틀릴 수 있습니다.", "test artifact의 session/model dump도 production과 같은 secret/PII policy를 적용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-quiz-controller", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/controller/QuizController.java", usedFor: ["ModelAttribute/Model/RedirectAttributes quiz flow progression"], evidence: "read-only scanner로 49-line, public method6, ModelAttribute5, Model6, RedirectAttributes2와 mapping 구조만 확인했으며 route/view/attribute/form 값은 복사하지 않았습니다." },
  { id: "local-quiz-command", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/command/Quiz01VO.java", usedFor: ["three-field mutable command progression"], evidence: "read-only scanner로 32-line, private field3, getter3, setter3와 public method7 구조만 확인했으며 field 이름·값/source body는 복사하지 않았습니다." },
  { id: "spring-model-methods", repository: "Spring Framework", path: "Model Methods", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-modelattrib-methods.html", usedFor: ["ModelAttribute initialization before handlers"], evidence: "Spring Framework 공식 model methods reference입니다." },
  { id: "spring-model-attribute", repository: "Spring Framework", path: "@ModelAttribute Method Argument", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/modelattrib-method-args.html", usedFor: ["command creation/binding/validation"], evidence: "Spring Framework 공식 ModelAttribute argument reference입니다." },
  { id: "spring-data-binding", repository: "Spring Framework", path: "Web MVC Data Binding", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-data-binding.html", usedFor: ["safe command/view model design"], evidence: "Spring Framework 공식 MVC data binding reference입니다." },
  { id: "spring-validation", repository: "Spring Framework", path: "Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["validation and BindingResult lifecycle"], evidence: "Spring Framework 공식 MVC validation reference입니다." },
  { id: "spring-return-values", repository: "Spring Framework", path: "Return Values", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html", usedFor: ["String/ModelAndView/body return handling"], evidence: "Spring Framework 공식 handler return values reference입니다." },
  { id: "spring-view-resolution", repository: "Spring Framework", path: "View Resolution", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/viewresolver.html", usedFor: ["logical view and resolver lifecycle"], evidence: "Spring Framework 공식 view resolution reference입니다." },
  { id: "spring-redirect-attributes", repository: "Spring Framework", path: "Redirect Attributes", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/redirecting-passing-data.html", usedFor: ["redirect URI and flash attributes"], evidence: "Spring Framework 공식 redirect attributes reference입니다." },
  { id: "spring-flash-attributes", repository: "Spring Framework", path: "Flash Attributes", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/flash-attributes.html", usedFor: ["FlashMap one-time redirect lifecycle"], evidence: "Spring Framework 공식 flash attributes reference입니다." },
  { id: "spring-session-attributes", repository: "Spring Framework", path: "@SessionAttributes", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/sessionattributes.html", usedFor: ["controller conversation persistence/completion"], evidence: "Spring Framework 공식 SessionAttributes reference입니다." },
  { id: "spring-model-api", repository: "Spring Framework API", path: "Model", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/ui/Model.html", usedFor: ["model attribute map contract"], evidence: "Spring Framework 공식 Model API입니다." },
  { id: "spring-redirect-api", repository: "Spring Framework API", path: "RedirectAttributes", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/support/RedirectAttributes.html", usedFor: ["redirect and flash API"], evidence: "Spring Framework 공식 RedirectAttributes API입니다." },
  { id: "spring-session-status-api", repository: "Spring Framework API", path: "SessionStatus", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/support/SessionStatus.html", usedFor: ["conversation completion API"], evidence: "Spring Framework 공식 SessionStatus API입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework", path: "MockMvc", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc.html", usedFor: ["model/view/redirect/session request tests"], evidence: "Spring Framework 공식 MockMvc reference입니다." },
  { id: "spring-security-session", repository: "Spring Security", path: "Session Management", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html", usedFor: ["session fixation/concurrency/security lifecycle"], evidence: "Spring Security 공식 session management reference입니다." },
  { id: "jakarta-servlet", repository: "Jakarta Servlet 6.1", path: "Specification", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1.html", usedFor: ["HttpSession/request/redirect container lifecycle"], evidence: "Jakarta Servlet 공식 specification입니다." },
  { id: "rfc9110-redirect", repository: "IETF HTTP Semantics", path: "303 See Other", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.4", usedFor: ["POST redirect status/method semantics"], evidence: "IETF RFC 9110 공식 303 redirect 절입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["model/view/flash/session examples"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["validation error example"], evidence: "Oracle JDK 공식 List API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-04-model-command-object", slug: "mvc-04-model-command-object", courseId: "spring", moduleId: "spring-mvc-request-response", order: 4,
  title: "Model·command object와 화면 데이터 전달", subtitle: "request Model과 command binding에서 validation redisplay·view projection·return handler·PRG·flash·session conversation·renderer evidence까지 화면 상태 생명주기를 완성합니다.", level: "중급", estimatedMinutes: 950,
  coreQuestion: "form command와 view data를 request Model, redirect/flash와 session conversation의 정확한 lifetime에 배치해 validation·동시 탭·보안·rendering 장애에서도 상태가 섞이거나 노출되지 않게 하려면 어떻게 해야 할까요?",
  summary: "SpringBasic QuizController와 Quiz01VO를 read-only 구조 scanner로 확인해 ModelAttribute5, Model6, RedirectAttributes2의 controller progression과 3-field/3-getter/3-setter mutable command 구조를 보존하되 route/view/attribute/field 값은 복사하지 않았습니다. request Model, attribute naming, command binding, validation redisplay, minimal view projection/output encoding, return handlers/view resolution, PRG/redirect, flash one-time 전달, SessionAttributes/SessionStatus conversation과 request-sequence observability를 독립적으로 설명합니다. 다섯 JDK 21 exact examples는 Model key, invalid/success flow, safe projection, flash consume와 session completion을 실제 실행합니다.",
  objectives: ["Model의 request lifetime과 view attribute schema를 설명한다.", "implicit/explicit attribute naming과 collision을 통제한다.", "command 생성·binding·validation·service 변환을 분리한다.", "validation error same-request render와 success PRG를 구현한다.", "domain/entity를 최소 view model로 projection하고 output encoding한다.", "String/ModelAndView/body return과 ViewResolver를 구분한다.", "RedirectAttributes와 flash의 URL/one-time lifetime을 설계한다.", "SessionAttributes conversation·동시 탭·complete/expiry와 sequence test를 운영한다."],
  prerequisites: [{ title: "요청 파라미터·PathVariable·객체 바인딩", reason: "request 값이 command object로 conversion/binding/validation되는 단계를 알아야 command와 BindingResult가 Model·view·redirect/session에서 어떤 lifetime을 가져야 하는지 설계할 수 있습니다.", sessionSlug: "mvc-03-request-param-path-variable" }],
  keywords: ["Model", "command object", "attribute name", "view model", "@ModelAttribute", "BindingResult", "ModelAndView", "ViewResolver", "Post/Redirect/Get", "RedirectAttributes", "FlashMap", "flash attribute", "@SessionAttributes", "SessionStatus", "output encoding", "request scope"], topics,
  lab: {
    title: "form command→Model/view→PRG/flash/session conversation lifecycle 구축",
    scenario: "quiz form이 GET 준비, invalid POST 재표시, valid POST commit/redirect, success flash와 여러 step session workflow를 제공하며 동시 tab·expiry·renderer 장애에도 다른 request와 상태가 섞이지 않아야 합니다.",
    setup: ["원본 controller/command는 read-only로 보존하고 annotation/model/method/field 구조만 inventory합니다.", "JDK exact models, MockMvc request sequence와 actual supported Servlet/JSP environment를 준비합니다.", "route별 model key/type/scope와 command/view field allowlist를 작성합니다.", "model/session/body raw 값 없는 lifecycle telemetry와 secret canary를 준비합니다."],
    steps: ["GET form의 explicit command/lookup model schema를 정의합니다.", "POST command binding, BindingResult와 invalid same-request view를 검증합니다.", "service 성공/commit 뒤 303 Location으로 PRG를 수행합니다.", "redirect URI attribute를 public allowlist로 제한하고 hostile target을 거부합니다.", "small safe flash code의 target match·one-time consume를 검증합니다.", "domain object를 bounded view model로 projection하고 render-phase SQL 0을 확인합니다.", "String/ModelAndView/body return과 view resolver/renderer를 qualification합니다.", "workflow token/version으로 session conversation과 두 tab conflict를 제어합니다.", "complete/cancel/expiry/logout에서 SessionStatus와 resource cleanup을 검증합니다.", "전체 GET→invalid/valid POST→redirect GET→refresh/complete sequence와 canary/rollback을 승인합니다."],
    expectedResult: ["route별 Model key/type/scope와 view schema", "invalid service-call0/command/errors/view evidence", "valid commit→303 Location→GET sequence", "flash first-consume/refresh-absent 결과", "view projection allowlist와 render SQL0/encoding evidence", "session token/version·complete/expiry·동시 tab 결과"],
    cleanup: ["synthetic model/flash/session/workflow state를 제거합니다.", "test server/session/executor를 종료하고 active resource absence를 확인합니다."],
    extensions: ["multipart form command와 upload metadata lifecycle을 분리합니다.", "server-side durable draft와 session token을 결합합니다.", "JSP에서 modern template/JSON으로 view schema differential migration을 수행합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "GET form, invalid POST와 valid PRG의 Model lifecycle을 구현하세요.", requirements: ["explicit command attribute name을 씁니다.", "lookup model schema를 둡니다.", "BindingResult error를 같은 view에 전달합니다.", "invalid service 호출 0을 확인합니다.", "valid transaction 뒤 303을 반환합니다.", "Location을 검증합니다.", "redirect 후 refresh state를 확인합니다."], hints: ["validation error와 success redirect는 같은 lifetime을 쓰지 않습니다."], expectedOutcome: "command/error/view/redirect가 정확한 request 경계에서 보존·소멸됩니다.", solutionOutline: ["GET prepare→POST bind→invalid render 또는 commit→redirect→GET 순서입니다."] },
    { difficulty: "응용", prompt: "flash와 SessionAttributes wizard를 동시 tab까지 안전하게 확장하세요.", requirements: ["flash payload를 safe code로 제한합니다.", "target/one-time consume를 확인합니다.", "workflow token/version을 둡니다.", "session state size/type을 제한합니다.", "두 tab stale update를 거부합니다.", "complete/cancel/expiry를 처리합니다.", "logout/fixation policy를 검증합니다.", "multi-node serialization을 test합니다."], hints: ["flash는 durable workflow storage가 아니며 fixed session key는 tab을 구분하지 못합니다."], expectedOutcome: "짧은 UX 메시지와 multi-request workflow state가 서로 다른 lifetime으로 관리됩니다.", solutionOutline: ["flash one-shot→workflow identity→version→completion→expiry/security 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC Model·view·redirect/session governance를 작성하세요.", requirements: ["model key/type/scope schema를 둡니다.", "command/view DTO와 field allowlist를 요구합니다.", "validation redisplay/PRG status를 표준화합니다.", "view return/resolver/encoding policy를 둡니다.", "redirect target/query allowlist를 둡니다.", "flash/session size/lifetime/concurrency를 정의합니다.", "secret-zero lifecycle telemetry와 sequence corpus를 둡니다.", "renderer/framework migration·canary·rollback을 포함합니다."], hints: ["어떤 값이 어느 request까지 살아야 하는지부터 표로 그리세요."], expectedOutcome: "화면 상태 생성부터 render·redirect·session 종료·upgrade까지 운영 가능한 표준이 완성됩니다.", solutionOutline: ["schema→bind→render→redirect→conversation→security→evidence→rollout 순서입니다."] },
  ],
  nextSessions: ["mvc-05-validation-errors"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["QuizController.java는 49-line 원본에서 public method6, ModelAttribute5, Model6, RedirectAttributes2와 mapping 구조만 확인했으며 route/view/attribute/form 값은 복사하지 않았습니다.", "Quiz01VO.java는 32-line 원본에서 private field3, getter3, setter3와 public method7 구조만 확인했으며 field 이름/값/source body는 복사하지 않았습니다.", "로컬 source에는 BindingResult/validation/SessionAttributes annotation이 확인되지 않아 있다고 가정하지 않고 Spring/Security/Jakarta/IETF/JDK 공식 문서와 synthetic exact examples로 보완했습니다.", "JDK model은 Spring ModelFactory/WebDataBinder/FlashMapManager/HttpSession/ViewResolver와 JSP output encoding을 대체하지 않으므로 MockMvc와 target container/renderer request-sequence tests를 별도로 요구합니다."] },
});

export default session;
