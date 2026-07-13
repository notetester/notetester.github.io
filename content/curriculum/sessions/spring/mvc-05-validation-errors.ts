import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 21 records·collections·time으로 HTTP 입력 binding과 validation 결과를 외부 Jakarta/Spring jar 없이 분리해 실행합니다." },
      { lines: "19-끝에서 6줄 전", explanation: "허용 field binding, type conversion, property/cross-field/group 검증과 public error normalization을 결정적 순서로 수행합니다." },
      { lines: "마지막 6줄", explanation: "field path, stable code, rejected-value 포함 여부와 status처럼 사용자/API에 안전한 evidence만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/Jakarta Validator jar·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "교육용 validator는 Jakarta Validation provider와 Spring MVC BindingResult/exception behavior를 대체하지 않습니다."] },
    experiments: [
      { change: "missing, blank, malformed, boundary, unknown field, group와 cross-field 값을 추가합니다.", prediction: "binding/type errors와 constraint/domain errors가 서로 다른 stable code/path로 분리됩니다.", result: "예상 error set과 실제 stdout을 순서 독립적으로 비교합니다." },
      { change: "동일 command를 MockMvc와 실제 supported validator provider에서 실행합니다.", prediction: "message interpolation, property paths, method validation exception과 locale 처리가 추가됩니다.", result: "status, BindingResult/ProblemDetail fields, service 미호출과 logs zero-leak을 readback합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "binding-validation-domain",
    title: "binding·type conversion·Bean Validation·domain invariant를 순서와 책임으로 분리합니다",
    lead: "HTTP 문자열을 command object로 만드는 과정, 형식·범위 constraints, 현재 business state 규칙과 DB 무결성은 서로 다른 evidence와 error owner를 가집니다.",
    explanations: [
      "Spring MVC binding은 request values를 target properties/constructor parameters에 연결하고 Converter/Formatter로 Java types를 만듭니다. 숫자로 바꿀 수 없는 입력은 constraint 실행 전에 typeMismatch 계열 binding error가 될 수 있습니다.",
      "Bean Validation은 object graph에 선언된 metadata constraints를 검사합니다. @Email이 계정이 실제 존재하는지, @Size가 비밀번호 유출 목록인지, @NotBlank가 business uniqueness를 증명하지 않습니다.",
      "domain invariant는 aggregate/current state와 operation 의미를 검증합니다. 같은 DTO라도 create, profile update, admin transition에서 허용 규칙이 다를 수 있어 service command를 분리합니다.",
      "DB UNIQUE/FK/CHECK는 concurrent requests 사이의 최종 무결성 경계입니다. 사전 validation이 통과해도 commit 때 제약 위반이 발생할 수 있으므로 stable conflict outcome을 처리합니다.",
      "validation 실패 시 service/repository를 호출하지 않고, binding/constraint 성공 뒤에도 authorization과 domain transition을 별도로 수행합니다. 순서를 request trace와 tests로 증명합니다.",
    ],
    concepts: [
      c("data binding", "request의 text/multipart values를 command object properties나 constructor parameters에 연결하고 type conversion하는 과정입니다.", ["unknown/disallowed/type errors가 있습니다.", "validation보다 먼저 실패할 수 있습니다."]),
      c("Bean Validation", "annotations/metadata와 Validator를 이용해 Java object와 executable constraints를 검사하는 표준입니다.", ["형식·범위·cross-field를 표현합니다.", "DB/current-state 규칙을 대체하지 않습니다."]),
      c("domain invariant", "특정 use case와 current domain state에서 항상 지켜야 하는 business rule입니다.", ["service/aggregate가 소유합니다.", "concurrent final state는 DB constraint와 결합합니다."]),
    ],
    codeExamples: [java("mvc05-binding-pipeline", "허용 field binding·conversion·constraint 오류 분리", "Mvc05Binding.java", "문자열 Map을 command로 binding하면서 unknown field를 거부하고 age 변환과 name/email 검증 오류를 stable code로 분리합니다.", String.raw`import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Mvc05Binding {
  record Command(String name, String email, Integer age) {}
  record Result(Command command, List<String> errors, List<String> rejectedFields) {}
  static Result bind(Map<String, String> input) {
    List<String> errors = new ArrayList<>();
    List<String> rejected = input.keySet().stream().filter(key -> !Set.of("name", "email", "age").contains(key)).sorted().toList();
    Integer age = null;
    try { age = Integer.valueOf(input.getOrDefault("age", "")); } catch (NumberFormatException error) { errors.add("age:type"); }
    String name = input.getOrDefault("name", "").strip();
    String email = input.getOrDefault("email", "").strip();
    if (name.isEmpty()) errors.add("name:required");
    if (!email.matches("^[^@ ]+@[^@ ]+\\.[^@ ]+$")) errors.add("email:format");
    if (age != null && (age < 0 || age > 150)) errors.add("age:range");
    return new Result(new Command(name, email, age), List.copyOf(errors), rejected);
  }
  public static void main(String[] args) {
    Map<String, String> input = new LinkedHashMap<>();
    input.put("name", " "); input.put("email", "invalid"); input.put("age", "many"); input.put("role", "admin");
    Result result = bind(input);
    System.out.println("command=" + result.command());
    System.out.println("errors=" + result.errors());
    System.out.println("rejected-fields=" + result.rejectedFields());
    System.out.println("service-called=false");
  }
}`, "command=Command[name=, email=invalid, age=null]\nerrors=[age:type, name:required, email:format]\nrejected-fields=[role]\nservice-called=false", ["local-member-vo", "spring-data-binding", "spring-mvc-validation", "jakarta-validation-spec", "java-map", "java-set"])],
    diagnostics: [
      d("@Min을 붙였는데 숫자가 아닌 입력이 constraint message가 아닙니다.", "type conversion이 먼저 실패해 target value를 만들지 못했습니다.", ["BindingResult field errors", "error codes", "property editor/converter", "raw input safe class", "constraint execution"], "typeMismatch와 constraint violations를 별도 message/code로 설계합니다.", "malformed와 numeric boundary cases를 각각 MockMvc test합니다."),
      d("validation은 통과했는데 DB UNIQUE 오류가 납니다.", "사전 중복 조회를 concurrent uniqueness 보장으로 오해했습니다.", ["concurrent requests", "unique constraint", "transaction commit", "exception mapping", "idempotency"], "DB constraint를 최종 경계로 유지하고 conflict를 stable domain/HTTP outcome으로 변환합니다.", "동시 insert schedule과 commit-time exception integration tests를 둡니다."),
    ],
    expertNotes: ["validation을 한 layer에 모두 넣지 않고 error를 고칠 수 있는 owner와 필요한 state에 따라 배치합니다.", "binding error rejectedValue는 password/token/PII일 수 있으므로 기본 로그/response에 직렬화하지 않습니다."],
  },
  {
    id: "command-dto-overposting",
    title: "화면/use-case별 command DTO로 MemberVO 전체 binding과 over-posting을 차단합니다",
    lead: "원본 MemberVO처럼 identity, password, contact, active state, timestamps와 provider fields가 한 mutable object에 있으면 요청이 수정하면 안 되는 fields까지 binding될 위험이 있습니다.",
    explanations: [
      "원본 MemberVO는 여러 member/auth/profile fields와 public setters를 가졌지만 validation annotations는 없습니다. 공개 세션은 field category 구조만 사용하고 실제 개인 값은 읽거나 예제로 옮기지 않습니다.",
      "회원가입, 로그인, 주소 변경, 관리자 활성화와 OAuth callback은 required/allowed fields와 권한이 다릅니다. RegisterCommand, ProfileUpdateCommand, AdminStatusCommand처럼 input types를 나눕니다.",
      "entity/VO를 @ModelAttribute/@RequestBody로 직접 받으면 role, active, id, createdAt 같은 server-owned fields가 mass assignment될 수 있습니다. allow-list DTO와 explicit mapping으로 막습니다.",
      "password confirmation은 request-only field이고 password digest는 response/model/log에 절대 포함하지 않습니다. raw password lifetime을 request/service hashing 경계까지 최소화합니다.",
      "unknown/disallowed fields를 조용히 무시할지 실패할지는 compatibility/security policy입니다. security-sensitive commands는 fail-closed하고 public stable code만 반환합니다.",
    ],
    concepts: [
      c("command DTO", "특정 HTTP/use-case가 받을 수 있는 fields와 validation contract만 표현하는 input object입니다.", ["entity/response DTO와 분리합니다.", "server-owned fields를 제외합니다."]),
      c("over-posting", "client가 허용되지 않은 object properties까지 전송해 binder가 수정하는 mass-assignment 취약점입니다.", ["allow-list DTO로 차단합니다.", "authorization을 별도 수행합니다."]),
      c("server-owned field", "id, role, status, audit time처럼 server/domain만 결정해야 하는 property입니다.", ["request DTO에서 제외합니다.", "service command에서 authority를 검증합니다."]),
    ],
    diagnostics: [
      d("일반 사용자가 active/role을 바꿉니다.", "mutable MemberVO/entity 전체를 request에 binding했습니다.", ["request DTO", "allowed fields", "binder config", "mapping code", "authorization"], "use-case command allow-list로 받고 server-owned fields는 authenticated authority/domain transition에서만 설정합니다.", "unknown privileged field adversarial tests와 object-level authorization을 둡니다."),
      d("password가 BindingResult/log에 보입니다.", "rejectedValue나 DTO toString 전체를 error telemetry에 기록했습니다.", ["BindingResult logging", "record/Lombok toString", "exception payload", "APM capture", "retention"], "sensitive field metadata를 deny-list가 아닌 response/log allow-list에서 완전히 제외합니다.", "credential-shaped canary로 logs/traces/error pages를 검사합니다."),
    ],
    expertNotes: ["DTO가 많아지는 것은 use-case contracts가 실제로 다르다는 명시성 비용이며 자동 mapper로 권한 차이를 숨기지 않습니다.", "field 이름 자체도 PII classification에 쓰일 수 있으므로 API schema와 telemetry 접근을 관리합니다."],
  },
  {
    id: "constraint-null-semantics",
    title: "built-in constraints의 null·blank·Unicode·boundary semantics를 조합해 검증합니다",
    lead: "@Size와 @Email 같은 많은 constraints는 null을 허용할 수 있으므로 required 여부는 @NotNull/@NotBlank와 별도로 선언하고 provider behavior를 테스트합니다.",
    explanations: [
      "@NotNull은 null만 거부하고 @NotEmpty는 null/size 0, @NotBlank는 null과 whitespace-only character sequences를 거부합니다. 사용자가 보는 이름과 machine identifier의 whitespace policy를 구분합니다.",
      "@Size는 collection/string length contract이고 DB column byte/character limit과 같지 않을 수 있습니다. Unicode code units/code points/graphemes와 target DB encoding boundary를 통합 테스트합니다.",
      "@Email은 syntax constraint이며 주소 소유·deliverability를 증명하지 않습니다. 확인 token lifecycle, normalization, uniqueness와 provider case rules를 별도 처리합니다.",
      "@Pattern regex는 catastrophic backtracking과 Unicode/canonicalization 위험이 있습니다. bounded length를 먼저 적용하고 linear/anchored pattern과 timeout/performance corpus를 둡니다.",
      "숫자/시간 constraints는 type conversion과 Clock/timezone을 고려합니다. floating equality와 server/client locale text를 validation type에 직접 섞지 않습니다.",
    ],
    concepts: [
      c("constraint null semantics", "각 constraint가 null을 valid로 보는지 별도 required constraint가 필요한지의 규칙입니다.", ["constraint 조합을 설계합니다.", "provider/spec version을 확인합니다."]),
      c("message template", "constraint violation message를 직접 문장 또는 resource key/interpolation template로 표현하는 metadata입니다.", ["public 문구와 stable code를 분리합니다.", "사용자 값을 안전하게 escape합니다."]),
      c("constraint composition", "여러 constraints/meta-annotation을 하나의 domain-specific constraint로 조합하는 방식입니다.", ["single/multiple violation 의미를 정합니다.", "validator 성능을 검증합니다."]),
    ],
    codeExamples: [java("mvc05-error-codes", "binding/constraint error code resolution hierarchy", "Mvc05Codes.java", "field error의 specific→type→generic code 후보를 만들고 message catalog에서 첫 match를 결정합니다.", String.raw`import java.util.List;
import java.util.Map;

public class Mvc05Codes {
  static List<String> codes(String error, String object, String field, String type) {
    return List.of(error + "." + object + "." + field, error + "." + field, error + "." + type, error);
  }
  static String resolve(List<String> codes, Map<String, String> messages) {
    return codes.stream().filter(messages::containsKey).map(messages::get).findFirst().orElse("invalid value");
  }
  public static void main(String[] args) {
    List<String> codes = codes("typeMismatch", "register", "age", "Integer");
    Map<String, String> messages = Map.of("typeMismatch.age", "age must be a number", "typeMismatch", "invalid type");
    System.out.println("codes=" + codes);
    System.out.println("message=" + resolve(codes, messages));
    System.out.println("rejected-value-included=false");
  }
}`, "codes=[typeMismatch.register.age, typeMismatch.age, typeMismatch.Integer, typeMismatch]\nmessage=age must be a number\nrejected-value-included=false", ["spring-binding-result", "spring-field-error", "spring-message-codes", "java-list", "java-map"])],
    diagnostics: [
      d("@Size만 붙였더니 null이 통과합니다.", "required와 size semantics를 하나의 constraint로 가정했습니다.", ["constraint annotations", "spec null behavior", "binding required", "group", "tests"], "필요하면 @NotNull/@NotBlank와 @Size를 함께 선언하고 missing/empty/blank/boundary를 분리합니다.", "constraint truth-table tests를 둡니다."),
      d("긴 악성 문자열에서 validation CPU가 치솟습니다.", "복잡한 regex를 길이 제한 전에 실행하거나 backtracking pattern을 사용했습니다.", ["input length", "regex", "constraint order/groups", "CPU profile", "timeouts"], "request/body/field length gate를 먼저 적용하고 bounded linear pattern으로 교체합니다.", "adversarial regex performance tests와 request budgets를 둡니다."),
    ],
    expertNotes: ["built-in constraint annotation 이름만 보고 semantics를 추측하지 않고 current spec/Javadoc과 provider tests를 확인합니다.", "message interpolation에 사용자 input을 포함할 때 HTML/JSON context escaping과 log redaction을 별도로 적용합니다."],
  },
  {
    id: "mvc-valid-validated",
    title: "@Valid·@Validated, object validation과 method validation 경로를 현재 Spring MVC 기준으로 구분합니다",
    lead: "controller signature에 따라 개별 command validation과 method-level constraints가 다른 exception/result 경로를 사용하므로 둘 다 처리·테스트해야 합니다.",
    explanations: [
      "@Valid는 cascading marker이며 자체 constraint가 아닙니다. @ModelAttribute/@RequestBody/@RequestPart command에 constraints를 실행하도록 Spring MVC validation과 함께 사용됩니다.",
      "@Validated는 Spring의 validation groups를 지정할 수 있습니다. controller class-level @Validated AOP와 Spring MVC 6.1+ built-in method validation의 차이를 current reference에서 확인합니다.",
      "method parameter에 @Min/@NotBlank 같은 direct constraint가 있으면 method validation이 필요할 수 있고 HandlerMethodValidationException 경로가 개별 MethodArgumentNotValidException과 다릅니다.",
      "nested object/list/map container elements는 @Valid/cascade와 element constraints를 정확한 위치에 선언합니다. null nested object와 empty collection semantics를 분리합니다.",
      "global Validator와 @InitBinder local validator를 조합할 때 중복 실행, applicability, order와 error codes를 검증합니다.",
    ],
    concepts: [
      c("@Valid", "object property/parameter/return value의 nested validation을 cascade하도록 표시하는 Jakarta annotation입니다.", ["constraint 자체가 아닙니다.", "object graph cycle semantics를 확인합니다."]),
      c("@Validated", "Spring validation groups와 method validation integration에 쓰이는 annotation입니다.", ["groups를 지정할 수 있습니다.", "MVC built-in/AOP 경계를 확인합니다."]),
      c("method validation", "handler method parameters와 return value에 선언된 executable constraints를 함께 검증하는 과정입니다.", ["exception path가 다를 수 있습니다.", "Errors adjacency와 signature를 테스트합니다."]),
    ],
    diagnostics: [
      d("@Valid를 붙였는데 nested field가 검증되지 않습니다.", "nested property/type-use에 cascade 또는 element constraint가 없습니다.", ["@Valid location", "nested null", "container element annotations", "Validator", "violations paths"], "object graph의 ownership 지점에 @Valid와 element constraints를 선언하고 null/empty/nested cases를 테스트합니다.", "constraint metadata inspection과 MVC integration tests를 둡니다."),
      d("Spring upgrade 후 다른 validation exception이 발생합니다.", "controller signature/direct constraints가 built-in method validation 경로로 바뀌었습니다.", ["Spring version", "class-level @Validated", "parameter constraints", "BindingResult placement", "exception type"], "current MVC validation reference에 맞춰 두 exception shapes를 공통 public error contract로 normalize합니다.", "지원 버전별 object/method validation corpus를 둡니다."),
    ],
    expertNotes: ["@Valid와 @Validated를 무작정 동시에 붙이지 않고 필요한 cascade/groups/method semantics를 signature별로 설명합니다.", "return-value validation failure는 server contract violation일 수 있어 client input 400과 같은 메시지로 처리하지 않습니다."],
  },
  {
    id: "bindingresult-error-model",
    title: "BindingResult의 field·object errors와 message code hierarchy를 안정된 public contract로 변환합니다",
    lead: "BindingResult는 binding과 validation 결과를 target 옆에 보존하지만 rejected values와 internal object names를 그대로 공개하지 않습니다.",
    explanations: [
      "MVC handler에서 Errors/BindingResult는 일반적으로 검증 대상 argument 바로 뒤에 두어 해당 결과를 controller가 처리하도록 합니다. signature가 달라지면 exception path가 될 수 있으므로 current rules를 테스트합니다.",
      "FieldError는 object name, field, rejectedValue, bindingFailure와 codes/messages를 가질 수 있고 ObjectError는 cross-field/global violation을 표현합니다.",
      "DefaultMessageCodesResolver는 object/field/type specificity가 다른 code candidates를 만들 수 있습니다. public API code는 framework-generated 배열 전체가 아니라 versioned domain/API error code로 normalize합니다.",
      "같은 field에 binding error와 constraint error가 중복되지 않도록 invalid converted value에서 validator가 어떻게 동작하는지 확인합니다. 사용자에게 가장 actionable한 one/multiple messages 정책을 둡니다.",
      "error 순서는 provider/reflection 순서에 의존할 수 있습니다. UI는 field layout 순서, API/tests는 path+code stable sort 또는 set semantics를 정의합니다.",
    ],
    concepts: [
      c("BindingResult", "data binding과 validation의 target, field/global errors와 model integration을 제공하는 Spring contract입니다.", ["target argument와 연결됩니다.", "rejectedValue 노출을 통제합니다."]),
      c("FieldError", "특정 object property의 binding/validation failure를 나타내는 ObjectError subtype입니다.", ["bindingFailure를 구분합니다.", "codes와 rejected value가 있습니다."]),
      c("ObjectError", "특정 field 하나가 아닌 object/cross-field/global validation failure입니다.", ["public path/code를 설계합니다.", "message localization을 적용합니다."]),
    ],
    diagnostics: [
      d("BindingResult가 있는데도 controller가 호출되지 않습니다.", "Errors parameter가 검증 대상 바로 뒤가 아니거나 다른 method parameter validation error가 있습니다.", ["handler signature", "argument order", "direct constraints", "exception type", "Spring version"], "공식 signature rules에 맞추고 처리하려는 errors 범위를 명시적으로 테스트합니다.", "signature mutation과 method-validation integration tests를 둡니다."),
      d("API가 framework message codes 배열을 그대로 노출합니다.", "internal resolution metadata를 public error schema로 사용했습니다.", ["response schema", "codes", "object names", "types", "client dependencies"], "stable application code/path/message key로 normalize하고 framework codes는 내부 diagnostics에 제한합니다.", "API contract/version compatibility tests를 둡니다."),
    ],
    expertNotes: ["BindingResult를 log할 때 target/rejectedValue까지 포함하는 default toString/serialization을 사용하지 않습니다.", "UI field name과 domain property path가 달라도 mapping table로 accessibility focus와 API path를 일관되게 만듭니다."],
  },
  {
    id: "groups-sequences",
    title: "validation groups와 group sequence를 use-case 차이와 비용 순서에 제한적으로 사용합니다",
    lead: "create/update/admin에서 constraints가 다를 수 있지만 groups가 class 하나에 모든 workflows를 얽어 놓지 않도록 command DTO 분리를 먼저 검토합니다.",
    explanations: [
      "groups는 constraint가 어떤 validation invocation에 포함되는지 지정합니다. Default group을 빠뜨리거나 wrong group을 호출하면 required constraint가 조용히 실행되지 않을 수 있습니다.",
      "Create는 password required, Update는 id/version required 같은 차이가 작다면 groups가 가능하지만 fields/authorization가 크게 다르면 command types를 분리하는 편이 명확합니다.",
      "group sequence는 앞 group이 실패하면 뒤 group 실행을 막아 basic shape 이후 expensive/custom checks를 수행할 수 있습니다. DB/network validation은 그래도 Bean Validation validator에 넣지 않는 것이 일반적으로 안전합니다.",
      "group conversion은 cascaded child가 parent use-case와 다른 group을 쓸 때 유용하지만 graph가 복잡해져 metadata tests와 documentation이 필요합니다.",
      "클라이언트가 group을 선택하게 하지 않습니다. endpoint/use-case가 server-side group/command를 결정하고 authorization과 domain rule을 별도 적용합니다.",
    ],
    concepts: [
      c("validation group", "constraint들을 named subset으로 분류해 특정 Validator invocation에서 선택하는 marker type입니다.", ["Default 포함 여부를 관리합니다.", "use-case command 분리와 비교합니다."]),
      c("group sequence", "groups를 순서대로 검증하고 앞 group 실패 시 뒤 group을 생략하는 contract입니다.", ["비용/의존 순서를 표현합니다.", "순환 sequence를 금지합니다."]),
      c("group conversion", "cascaded association validation에서 현재 group을 child의 다른 group으로 변환하는 metadata입니다.", ["object graph use case에 사용합니다.", "복잡성/coverage를 관리합니다."]),
    ],
    codeExamples: [java("mvc05-groups", "create/update validation group 차이", "Mvc05Groups.java", "같은 교육용 Member command에서 create와 update group의 required fields를 분리해 error sets를 실행합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mvc05Groups {
  enum Group { CREATE, UPDATE }
  record Member(String id, String password, String displayName) {}
  static List<String> validate(Member member, Group group) {
    List<String> errors = new ArrayList<>();
    if (member.displayName() == null || member.displayName().isBlank()) errors.add("displayName:required");
    if (group == Group.CREATE && (member.password() == null || member.password().length() < 8)) errors.add("password:size");
    if (group == Group.UPDATE && (member.id() == null || member.id().isBlank())) errors.add("id:required");
    return List.copyOf(errors);
  }
  public static void main(String[] args) {
    Member command = new Member(null, "short", "member");
    System.out.println("create=" + validate(command, Group.CREATE));
    System.out.println("update=" + validate(command, Group.UPDATE));
    System.out.println("client-selected-group=false");
  }
}`, "create=[password:size]\nupdate=[id:required]\nclient-selected-group=false", ["jakarta-validation-spec", "jakarta-validator", "spring-validated-api", "java-list"])],
    diagnostics: [
      d("group을 지정하자 @NotBlank가 실행되지 않습니다.", "constraint가 Default group에만 있고 invocation은 다른 group만 요청했습니다.", ["constraint groups", "invoked groups", "Default", "sequence", "violations"], "group truth table을 만들고 required common constraints를 의도한 groups/sequence에 포함합니다.", "각 endpoint group metadata/behavior tests를 둡니다."),
      d("groups가 수십 개라 DTO 규칙을 이해할 수 없습니다.", "서로 다른 use cases를 하나의 mutable command type에 압축했습니다.", ["groups matrix", "field differences", "authorization", "mapping", "change coupling"], "use-case command types로 분리하고 소수 공통 group만 유지합니다.", "group count/co-change architecture review를 둡니다."),
    ],
    expertNotes: ["validation groups는 authorization groups/roles가 아니며 client privilege를 결정하지 않습니다.", "sequence로 비용을 최적화하기 전 basic correctness와 stable error contract를 먼저 고정합니다."],
  },
  {
    id: "cross-field-cascade-clock",
    title: "class-level·nested·container constraints로 관계를 검증하고 Clock·state 경계를 주입합니다",
    lead: "start≤end, password confirmation, conditional required처럼 여러 properties가 함께 필요한 rule은 field annotation 하나가 아니라 object-level validator가 적합합니다.",
    explanations: [
      "class-level constraint validator는 전체 command를 받고 violation을 object 또는 특정 property node에 연결할 수 있습니다. public path를 UI focus/API error와 맞춥니다.",
      "validator는 thread-safe하게 사용될 수 있으므로 request-specific mutable fields를 저장하지 않습니다. dependency injection된 services를 validator에서 호출할 때 provider/lifecycle/thread safety를 확인합니다.",
      "@Valid nested graph는 recursion/cycle과 collection size를 고려합니다. 매우 큰 collection을 먼저 bounded request limit 없이 전부 validate하면 CPU/memory DoS가 될 수 있습니다.",
      "@Past/@Future 같은 time constraints는 ValidatorFactory ClockProvider 또는 application Clock/timezone baseline을 고정해 midnight/DST/flaky tests를 막습니다.",
      "current database state나 external API가 필요한 rule은 request Bean Validation에서 I/O하지 않고 service/domain validation과 DB constraint로 이동합니다.",
    ],
    concepts: [
      c("class-level constraint", "한 object의 여러 properties 관계를 검사하도록 type에 선언하는 validation constraint입니다.", ["cross-field rule에 적합합니다.", "property node error path를 선택할 수 있습니다."]),
      c("ClockProvider", "시간 기반 constraints가 현재 시각을 얻는 Jakarta Validation SPI contract입니다.", ["test clock을 고정합니다.", "timezone policy를 명시합니다."]),
      c("container element constraint", "List<T>의 T, Map key/value 등 container 내부 elements에 선언하는 constraint입니다.", ["@Valid cascade와 구분합니다.", "collection size budget을 먼저 둡니다."]),
    ],
    codeExamples: [java("mvc05-cross-field", "시작·종료 날짜 object-level validation", "Mvc05CrossField.java", "LocalDate range에서 missing과 end-before-start를 stable object/property error로 분리합니다.", String.raw`import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Mvc05CrossField {
  record DateRange(LocalDate start, LocalDate end) {}
  static List<String> validate(DateRange range) {
    List<String> errors = new ArrayList<>();
    if (range.start() == null) errors.add("start:required");
    if (range.end() == null) errors.add("end:required");
    if (range.start() != null && range.end() != null && range.end().isBefore(range.start())) errors.add("end:not-before-start");
    return List.copyOf(errors);
  }
  public static void main(String[] args) {
    DateRange valid = new DateRange(LocalDate.parse("2026-07-01"), LocalDate.parse("2026-07-03"));
    DateRange invalid = new DateRange(LocalDate.parse("2026-07-03"), LocalDate.parse("2026-07-01"));
    System.out.println("valid=" + validate(valid));
    System.out.println("invalid=" + validate(invalid));
    System.out.println("error-path=end");
  }
}`, "valid=[]\ninvalid=[end:not-before-start]\nerror-path=end", ["jakarta-constraint-validator", "jakarta-validation-spec", "java-local-date", "java-list"])],
    diagnostics: [
      d("cross-field error가 화면 어느 field인지 알 수 없습니다.", "object-level violation을 global error로만 만들고 property node/public path mapping이 없습니다.", ["violation path", "BindingResult object/field errors", "UI focus", "API path", "message code"], "사용자가 수정할 field node에 stable error path를 연결하고 필요하면 global summary도 유지합니다.", "HTML/API accessibility/error-path tests를 둡니다."),
      d("validation 중 DB timeout이 발생합니다.", "ConstraintValidator가 uniqueness/current-state query를 수행했습니다.", ["validator dependencies", "I/O traces", "timeouts", "transaction", "concurrency"], "constraint validator를 local deterministic checks로 제한하고 stateful rule은 service+DB constraint로 이동합니다.", "no-I/O validator architecture rule와 concurrent domain tests를 둡니다."),
    ],
    expertNotes: ["cross-field validator의 null 처리와 field-level required errors가 중복되지 않도록 truth table을 만듭니다.", "fixed example dates는 synthetic이며 current date가 필요한 rule은 injected Clock으로 실행합니다."],
  },
  {
    id: "html-error-accessibility",
    title: "JSP/HTML form에 값·field error·global summary를 안전하고 접근 가능하게 되돌립니다",
    lead: "검증 실패 응답은 입력을 보존하되 password/token/file은 재표시하지 않고, 오류 summary와 field association, escaping을 제공해야 합니다.",
    explanations: [
      "PRG는 성공 submit 중복을 막는 데 유용하지만 validation 실패는 보통 같은 request에서 command/BindingResult를 view로 렌더링해 사용자가 입력을 수정하게 합니다. flash/session에 민감 DTO를 넣지 않습니다.",
      "field input에는 aria-invalid와 aria-describedby로 error element를 연결하고 page 상단 summary가 각 field anchor로 이동하도록 합니다. 색상만으로 error를 표시하지 않습니다.",
      "사용자 입력과 message arguments는 HTML text/attribute context에 맞게 escape합니다. 서버-side validation은 XSS output encoding을 대체하지 않습니다.",
      "password, confirmation, token, card/secret fields는 rejected value/model에 재표시하지 않고 browser autocomplete와 transport/cache policies를 함께 설계합니다.",
      "여러 locale에서 message length, placeholder, plural/formatting과 fallback key를 테스트합니다. stable error code와 translated display message를 분리합니다.",
    ],
    concepts: [
      c("error summary", "페이지의 모든 validation errors를 나열하고 사용자가 관련 field로 이동할 수 있게 하는 접근성 UI입니다.", ["field errors와 함께 제공합니다.", "focus management를 테스트합니다."]),
      c("output encoding", "사용자/외부 데이터를 HTML, attribute, URL, JS 등 출력 context에 맞게 안전하게 표현하는 처리입니다.", ["input validation과 별도입니다.", "framework escaping defaults를 검증합니다."]),
      c("repopulation policy", "검증 실패 시 어떤 submitted values를 form에 다시 표시하고 어떤 sensitive fields를 비우는지의 규칙입니다.", ["password/token은 제외합니다.", "PII cache/session을 관리합니다."]),
    ],
    diagnostics: [
      d("검증 오류 페이지에서 script가 실행됩니다.", "rejected/user value 또는 message argument를 HTML context에 raw 출력했습니다.", ["template escaping", "raw output tags", "message interpolation", "attributes", "CSP"], "context-aware output encoding을 적용하고 raw HTML message/value를 금지합니다.", "XSS payload corpus를 browser/template tests에 둡니다."),
      d("screen reader가 오류 field를 찾지 못합니다.", "label, summary, aria-describedby/id와 focus 연결이 없습니다.", ["labels", "aria-invalid", "describedby target", "summary links", "focus order"], "field마다 stable ids와 accessible error association을 만들고 submit 후 summary/first-error focus를 관리합니다.", "axe/manual keyboard/screen-reader checks를 둡니다."),
    ],
    expertNotes: ["HTML escaping된 문자열을 여러 context에 재사용하지 않고 template engine의 context-aware encoding을 사용합니다.", "validation message에 개인정보를 반복하면 analytics/screenshot/support ticket로 확산될 수 있습니다."],
  },
  {
    id: "rest-problem-contract",
    title: "REST validation 오류를 status·stable code·field path·locale가 있는 Problem Details로 정규화합니다",
    lead: "framework exception/object names를 그대로 JSON으로 내보내지 않고 client가 field를 표시하고 retry 여부를 판단할 수 있는 versioned public schema를 만듭니다.",
    explanations: [
      "malformed JSON/type conversion과 Bean Validation failure는 보통 400 계열로 처리할 수 있고 일부 APIs는 semantic 422를 선택합니다. 조직 contract를 일관되게 적용하고 documentation/tests와 맞춥니다.",
      "RFC 9457 Problem Details는 type, title, status, detail, instance와 extension members 구조를 제공합니다. validation errors extension의 path/code/message schema를 versioned합니다.",
      "field path는 JSON property naming/nested array index와 맞아야 하며 Java class/property/object name을 누출하지 않습니다. index가 high-cardinality/PII가 되지 않게 제한합니다.",
      "rejected value, request body, password/token과 raw constraint message template을 포함하지 않습니다. correlation id도 추측 불가능하고 server logs와 안전하게 연결되게 합니다.",
      "locale message는 user display용이고 automation은 stable code를 사용합니다. client가 arbitrary locale/message key를 injection하지 않도록 supported locales/fallback을 둡니다.",
    ],
    concepts: [
      c("Problem Details", "HTTP API error를 type/title/status/detail/instance와 extensions로 표현하는 표준 object입니다.", ["RFC 9457을 따릅니다.", "validation extension schema를 정의합니다."]),
      c("stable error code", "display message와 framework code에서 분리된 client automation용 versioned identifier입니다.", ["locale와 무관합니다.", "deprecation/compatibility를 관리합니다."]),
      c("field path", "client payload에서 오류가 발생한 property/element 위치를 나타내는 public path입니다.", ["Java internal names와 분리합니다.", "nested/container mapping을 테스트합니다."]),
    ],
    codeExamples: [java("mvc05-problem", "validation errors를 값 없는 public problem으로 정규화", "Mvc05Problem.java", "내부 errors를 field+stable code로 정렬하고 rejected values 없는 400 response evidence를 만듭니다.", String.raw`import java.util.Comparator;
import java.util.List;

public class Mvc05Problem {
  record Error(String field, String code) {}
  record Problem(int status, String type, String detail, List<Error> errors, boolean rejectedValuesIncluded) {}
  static Problem normalize(List<Error> errors) {
    List<Error> sorted = errors.stream().sorted(Comparator.comparing(Error::field).thenComparing(Error::code)).toList();
    return new Problem(400, "urn:problem:request-validation", "request validation failed", sorted, false);
  }
  public static void main(String[] args) {
    Problem problem = normalize(List.of(new Error("name", "required"), new Error("email", "format")));
    System.out.println("status=" + problem.status());
    System.out.println("type=" + problem.type());
    System.out.println("detail=" + problem.detail());
    System.out.println("errors=" + problem.errors());
    System.out.println("rejected-values-included=" + problem.rejectedValuesIncluded());
  }
}`, "status=400\ntype=urn:problem:request-validation\ndetail=request validation failed\nerrors=[Error[field=email, code=format], Error[field=name, code=required]]\nrejected-values-included=false", ["spring-error-responses", "spring-problem-detail", "rfc9457", "java-comparator", "java-list"])],
    diagnostics: [
      d("client가 message 문장을 parsing합니다.", "stable error code/schema가 없어 locale/framework message에 결합했습니다.", ["response schema", "codes", "locales", "client branches", "versioning"], "field별 versioned code를 제공하고 message는 display-only로 명시합니다.", "consumer contract tests와 code registry/deprecation을 둡니다."),
      d("validation JSON에 password rejectedValue가 포함됩니다.", "BindingResult/FieldError를 자동 직렬화했습니다.", ["serializer", "rejectedValue", "target", "logs/APM", "response snapshots"], "explicit allow-list Error DTO로 path/code/message만 mapping하고 target/rejected values를 제외합니다.", "credential canary response/log zero-leak tests를 둡니다."),
    ],
    expertNotes: ["Problem type URI는 client contract이며 문서와 compatibility policy를 제공합니다.", "status 400/422 선택보다 같은 failure가 endpoint마다 흔들리지 않고 transport/domain conflict를 구분하는 것이 중요합니다."],
  },
  {
    id: "stateful-rules-concurrency",
    title: "중복·권한·상태 전이와 DB 제약을 Bean Validation 이후 service transaction에서 검증합니다",
    lead: "현재 사용자/DB state가 필요한 rule은 request object 형식과 달리 authorization·transaction·locking·idempotency를 요구합니다.",
    explanations: [
      "이메일 사용 가능 조회는 UX에 도움을 주지만 check와 insert 사이 race가 있습니다. 최종 UNIQUE constraint와 commit exception mapping을 유지합니다.",
      "현재 사용자 권한, resource ownership과 state transition은 authenticated principal과 loaded aggregate가 필요하므로 controller DTO constraint로 표현하지 않습니다.",
      "optimistic version/affected rows로 update/delete concurrency conflict를 감지하고 validation error, not-found, forbidden와 conflict를 별도 HTTP/domain outcome으로 만듭니다.",
      "외부 verification service를 request validation 중 동기 호출하면 latency/availability와 retry side effects가 binding 단계에 섞입니다. service workflow/outbox/async 상태로 분리합니다.",
      "같은 idempotency key/request replay에서 validation·domain result와 commit outcome을 reconcile하고 timeout-after-commit을 무작정 재실행하지 않습니다.",
    ],
    concepts: [
      c("stateful validation", "current database, authenticated principal 또는 external state가 필요한 rule 검사입니다.", ["service transaction에서 수행합니다.", "Bean Validation local constraints와 분리합니다."]),
      c("time-of-check race", "사전 확인과 실제 변경 사이에 다른 transaction이 state를 바꿔 결론이 무효가 되는 경쟁입니다.", ["DB constraints/locking으로 최종 보장합니다.", "conflict를 처리합니다."]),
      c("optimistic version", "read한 version이 update 시점에도 같은지 조건으로 검증해 concurrent modification을 탐지하는 값입니다.", ["affected rows/@Version으로 구현합니다.", "conflict contract를 둡니다."]),
    ],
    diagnostics: [
      d("중복 확인 통과 후 회원가입이 500입니다.", "concurrent insert의 UNIQUE violation을 예상 conflict로 변환하지 않았습니다.", ["unique constraint", "commit exception", "SQLState/category", "response", "logs"], "constraint violation을 stable duplicate/conflict outcome으로 translate하고 입력값은 redacted합니다.", "two-request race integration test를 둡니다."),
      d("validator가 느린 외부 API 때문에 request thread를 점유합니다.", "ConstraintValidator에 remote I/O를 넣었습니다.", ["validator trace", "timeouts", "thread pool", "retry", "availability"], "local validation 뒤 application workflow에서 bounded client/async verification state로 분리합니다.", "remote fault/load tests와 circuit/queue budgets를 둡니다."),
    ],
    expertNotes: ["사용자에게 field error처럼 보이더라도 내부 보장 경계가 DB/domain이면 error origin을 보존합니다.", "중복 conflict 응답이 기존 account 존재 여부를 과도하게 노출하는 enumeration 위험을 위협 모델링합니다."],
  },
  {
    id: "tests-observability-performance",
    title: "constraint metadata→controller→service→DB race의 증거 사다리와 zero-leak observability를 운영합니다",
    lead: "validator unit tests만으로 binding, method validation, error rendering, localization, DB concurrency와 log hygiene를 증명할 수 없습니다.",
    explanations: [
      "constraint unit tests는 null/blank/boundary/Unicode/cross-field/group/Clock truth table을 빠르게 실행하고 constraint descriptor metadata도 검사합니다.",
      "MockMvc tests는 form/JSON binding, BindingResult adjacency, service 미호출, status/view/model/problem schema, locale와 XSS/accessibility rendering을 검증합니다.",
      "integration tests는 actual provider/message source, DB constraints, transaction commit, concurrent duplicate/version schedules와 exception translation을 실행합니다.",
      "observability는 endpoint/route template, validation phase, stable code, error count와 duration bucket을 기록하고 raw values, field PII, target/rejectedValue, body/header를 제외합니다.",
      "performance corpus는 input/body/collection limits, regex worst cases, deeply nested graph, message interpolation과 error fan-out cap을 측정해 validation DoS를 막습니다.",
    ],
    concepts: [
      c("validation truth table", "각 field/object/group에 대해 missing, malformed, boundaries와 expected stable errors를 표로 만든 검증 corpus입니다.", ["unit과 MVC layers에서 재사용합니다.", "Unicode/time/concurrency를 포함합니다."]),
      c("error fan-out cap", "하나의 request에서 수집·반환·기록할 violation 수를 제한하는 budget입니다.", ["DoS와 huge responses를 막습니다.", "truncated indicator를 설계합니다."]),
      c("zero-leak validation telemetry", "실제 입력/rejected values 없이 phase, route, code, count, duration만 기록하는 관측 정책입니다.", ["PII/credentials를 보호합니다.", "bounded cardinality를 유지합니다."]),
    ],
    diagnostics: [
      d("validation error metric cardinality가 폭증합니다.", "raw field path/index/message/value를 metric label로 사용했습니다.", ["metric labels", "array indices", "messages", "route paths", "series count"], "route template와 allow-listed stable code/field category만 labels로 사용하고 details는 sampled protected logs에 제한합니다.", "cardinality budget tests와 dashboards를 둡니다."),
      d("MockMvc는 통과하지만 provider upgrade 후 message/path가 달라집니다.", "framework/provider-specific details를 public contract로 직접 assertion했습니다.", ["provider versions", "violation paths", "message interpolation", "normalizer", "API schema"], "provider output을 stable application error model로 normalize하고 provider differential corpus를 실행합니다.", "Spring/Jakarta/provider patch qualification과 rollback을 둡니다."),
    ],
    expertNotes: ["모든 invalid input을 로그로 남기는 대신 code/count sampling과 security event 정책을 분리합니다.", "브라우저 form tests는 keyboard/focus/escaping을 포함하고 JSON contract tests와 목적을 분리합니다."],
  },
  {
    id: "version-migration-runbook",
    title: "javax→jakarta Validation과 mutable VO→use-case command migration을 versioned runbook으로 완성합니다",
    lead: "legacy package/DTO를 한 번에 annotation 추가로 고치지 않고 framework/provider/JDK baseline, public errors와 DB behavior를 단계적으로 전환합니다.",
    explanations: [
      "Spring 6+ baseline에서는 Bean Validation package가 jakarta.validation입니다. javax.validation annotations/provider와 jakarta-based framework를 혼합하지 않고 dependency tree와 compiled imports를 확인합니다.",
      "원본 MemberVO는 provenance로 보존하되 endpoint별 commands를 만들고 explicit mapping을 추가합니다. response/model에는 password/auth/audit server-owned fields를 제외합니다.",
      "각 command에 constraint truth table과 stable error codes를 먼저 정의하고 controller method signature/@Valid/@Validated/BindingResult behavior를 current Spring에서 검증합니다.",
      "HTML/JSON clients가 새 error schema를 함께 지원하는 compatibility window를 두고 old message parsing을 telemetry로 찾아 제거합니다.",
      "release gate는 unit/MockMvc/provider/DB concurrency/browser accessibility/security/performance/secret-zero evidence와 rollback 가능한 artifact/schema를 포함합니다.",
    ],
    concepts: [
      c("validation baseline", "Spring, Jakarta Validation API/provider, JDK와 namespace의 지원 조합입니다.", ["artifact dependency와 맞춥니다.", "session code block에 표시합니다."]),
      c("command migration", "범용 mutable VO/entity input을 use-case별 allow-listed immutable command contracts로 전환하는 과정입니다.", ["over-posting을 줄입니다.", "client compatibility를 관리합니다."]),
      c("error contract migration", "framework/display message 중심 오류를 stable code/path/Problem Details 또는 accessible field model로 전환하는 과정입니다.", ["client dual support를 둡니다.", "telemetry와 deprecation을 운영합니다."]),
    ],
    diagnostics: [
      d("jakarta annotations를 붙였는데 validation이 실행되지 않습니다.", "javax/jakarta API/provider 또는 Spring baseline이 혼합됐습니다.", ["imports", "dependency tree", "provider bootstrap", "Spring version", "Validator bean"], "지원 matrix로 API/provider/framework를 정렬하고 clean artifact context test를 실행합니다.", "forbidden javax/jakarta mix scan과 provider smoke를 CI에 둡니다."),
      d("DTO 분리 후 기존 client가 unknown field 오류를 냅니다.", "over-posting 차단을 breaking schema change로 계획하지 않았습니다.", ["client payloads", "unknown policy", "version", "telemetry", "compatibility window"], "API version/deprecation window와 allow-list migration을 운영하되 privileged fields는 즉시 fail-closed합니다.", "consumer contract tests와 unknown-field telemetry를 둡니다."),
    ],
    expertNotes: ["과거 VO를 삭제해 학습 흐름을 잃지 말고 왜 command DTO/constraints가 필요해졌는지 migration link로 연결합니다.", "validation migration 완료는 annotations 수가 아니라 over-posting/PII/DB race/error compatibility까지 증명된 상태입니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-member-vo", repository: "2026-springmvc01", path: "src/main/java/org/study/myproject01/members/vo/MemberVO.java", usedFor: ["mutable member/auth/profile/audit field grouping and missing validation progression"], evidence: "원본을 read-only로 구조만 확인했으며 실제 member values는 존재하지도 읽지도 않았습니다." },
  { id: "spring-data-binding", repository: "Spring Framework Reference", path: "Validation, Data Binding, and Type Conversion", publicUrl: "https://docs.spring.io/spring-framework/reference/core/validation.html", usedFor: ["Spring Validator, binding and conversion boundaries"], evidence: "Spring 공식 validation/binding reference입니다." },
  { id: "spring-bean-validation", repository: "Spring Framework Reference", path: "Java Bean Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html", usedFor: ["LocalValidatorFactoryBean and provider integration"], evidence: "Spring 공식 Bean Validation integration reference입니다." },
  { id: "spring-mvc-validation", repository: "Spring Framework Reference", path: "Spring MVC Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["@Valid/@Validated object and method validation paths"], evidence: "Spring 공식 MVC validation reference입니다." },
  { id: "spring-mvc-validator-config", repository: "Spring Framework Reference", path: "MVC Validation Configuration", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/validation.html", usedFor: ["global and local Validator configuration"], evidence: "Spring 공식 MVC validator config reference입니다." },
  { id: "spring-error-responses", repository: "Spring Framework Reference", path: "Error Responses", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["MVC validation exceptions and error response customization"], evidence: "Spring 공식 error responses reference입니다." },
  { id: "spring-binding-result", repository: "Spring Framework Javadoc", path: "BindingResult", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/BindingResult.html", usedFor: ["binding/validation error result contract"], evidence: "Spring 공식 BindingResult API입니다." },
  { id: "spring-field-error", repository: "Spring Framework Javadoc", path: "FieldError", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/FieldError.html", usedFor: ["field error, rejected value and binding failure"], evidence: "Spring 공식 FieldError API입니다." },
  { id: "spring-message-codes", repository: "Spring Framework Javadoc", path: "DefaultMessageCodesResolver", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/DefaultMessageCodesResolver.html", usedFor: ["message code hierarchy"], evidence: "Spring 공식 message codes API입니다." },
  { id: "spring-validated-api", repository: "Spring Framework Javadoc", path: "Validated", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/validation/annotation/Validated.html", usedFor: ["validation groups and method validation"], evidence: "Spring 공식 Validated API입니다." },
  { id: "spring-problem-detail", repository: "Spring Framework Javadoc", path: "ProblemDetail", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ProblemDetail.html", usedFor: ["RFC 9457 problem representation"], evidence: "Spring 공식 ProblemDetail API입니다." },
  { id: "jakarta-validation-spec", repository: "Jakarta Validation Specification", path: "Jakarta Validation 3.1", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/", usedFor: ["constraints, groups, cascade, executable and provider semantics"], evidence: "Jakarta EE 공식 Validation specification입니다." },
  { id: "jakarta-validator", repository: "Jakarta Validation API", path: "Validator", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/apidocs/jakarta/validation/validator", usedFor: ["thread-safe Validator and validation operations"], evidence: "Jakarta EE 공식 Validator API입니다." },
  { id: "jakarta-valid", repository: "Jakarta Validation API", path: "Valid", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/apidocs/jakarta/validation/valid", usedFor: ["nested cascade marker"], evidence: "Jakarta EE 공식 Valid API입니다." },
  { id: "jakarta-constraint-validator", repository: "Jakarta Validation API", path: "ConstraintValidator", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/apidocs/jakarta/validation/constraintvalidator", usedFor: ["custom validator contract"], evidence: "Jakarta EE 공식 ConstraintValidator API입니다." },
  { id: "rfc9457", repository: "RFC Editor", path: "RFC 9457 Problem Details for HTTP APIs", publicUrl: "https://www.rfc-editor.org/info/rfc9457/", usedFor: ["standard HTTP problem object fields and extensions"], evidence: "IETF/RFC Editor 공식 specification입니다." },
  { id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input Validation Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allow-list, syntactic/semantic validation and regex boundaries"], evidence: "OWASP 공식 cheat sheet입니다." },
  { id: "owasp-mass-assignment", repository: "OWASP Cheat Sheet Series", path: "Mass Assignment Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html", usedFor: ["over-posting and DTO allow-list defense"], evidence: "OWASP 공식 mass assignment guidance입니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["context-aware output encoding"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["deterministic validation error examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["binding input and message catalog examples"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["allowed-field binding example"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "java-comparator", repository: "Java SE 21 API", path: "Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["stable public error sorting"], evidence: "Oracle JDK 공식 Comparator API입니다." },
  { id: "java-local-date", repository: "Java SE 21 API", path: "LocalDate", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html", usedFor: ["cross-field date range example"], evidence: "Oracle JDK 공식 LocalDate API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-05-validation-errors", slug: "mvc-05-validation-errors", courseId: "spring", moduleId: "spring-mvc-request-response", order: 5,
  title: "Bean Validation과 바인딩 오류를 사용자에게 돌려주기", subtitle: "annotation 나열을 넘어 binding/type/constraint/domain/DB 경계, command DTO, groups, cross-field, accessible HTML와 Problem Details까지 안전하게 연결합니다.", level: "전문가", estimatedMinutes: 1120,
  coreQuestion: "잘못된 HTTP 입력을 어느 단계에서 어떤 code/path/status로 거부하고, 사용자가 고칠 수 있으면서도 비밀번호·PII·내부 구조를 노출하지 않는 HTML/API 오류 계약을 어떻게 증명할까요?",
  summary: "2026-springmvc01 MemberVO를 read-only로 확인해 identity/password/profile/contact/status/audit/provider fields가 한 mutable object에 있고 validation annotations가 없는 progression을 보존했습니다. binding→conversion→constraint→domain→DB 경계, use-case command DTO/over-posting, built-in constraint semantics, @Valid/@Validated object/method paths, BindingResult/code hierarchy, groups/sequences, cross-field/cascade/Clock, accessible escaped HTML, RFC 9457 REST problem, stateful/concurrent rules, layered tests/zero-leak performance와 javax→jakarta migration까지 확장합니다. 다섯 JDK 21 exact examples는 binding, codes, groups, date range와 public problem normalization을 실제 실행합니다.",
  objectives: ["binding/type conversion, Bean Validation, domain rule와 DB constraint를 분리한다.", "use-case command DTO로 over-posting과 sensitive/server-owned fields를 차단한다.", "built-in constraints의 null/blank/Unicode/regex/time semantics를 검증한다.", "@Valid/@Validated object/method validation과 exception paths를 구분한다.", "BindingResult field/object/code/rejected-value를 안전한 error model로 변환한다.", "groups/sequences와 command 분리의 trade-off를 선택한다.", "cross-field/cascade/container/Clock constraints를 thread-safe하게 구현한다.", "JSP/HTML 오류를 escaped·accessible·non-sensitive하게 렌더링한다.", "REST errors를 RFC 9457 status/code/path schema로 normalize한다.", "stateful/concurrent rules와 layered tests/telemetry/performance/migration을 운영한다."],
  prerequisites: [{ title: "Model·command object와 화면 데이터 전달", reason: "request command binding과 Model/redirect/session lifecycle을 알아야 BindingResult가 어떤 object/view에 연결되는지 해석할 수 있습니다.", sessionSlug: "mvc-04-model-command-object" }],
  keywords: ["Bean Validation", "Jakarta Validation", "@Valid", "@Validated", "BindingResult", "FieldError", "ObjectError", "command DTO", "over-posting", "validation groups", "cross-field constraint", "ClockProvider", "ProblemDetail", "RFC 9457", "error code", "output encoding"], topics,
  lab: {
    title: "MemberVO 기반 회원 흐름을 command·validation·error contract로 재구성하기",
    scenario: "범용 mutable member object가 register/profile/admin/OAuth input에 재사용되고 binding/type/constraint/domain/DB errors와 HTML/JSON responses가 섞여 over-posting, PII 노출과 concurrent duplicate 문제가 있습니다.",
    setup: ["원본 MemberVO는 read-only로 보존하고 field categories만 inventory합니다.", "JDK 21 exact examples, supported Spring/Jakarta validator, MockMvc/JSP와 disposable DB를 준비합니다.", "endpoint별 allowed/sensitive/server-owned fields, constraint truth table과 stable error registry를 만듭니다.", "synthetic values와 credential-shaped canary만 사용하고 raw password/contact/token은 저장·출력하지 않습니다."],
    steps: ["register/profile/admin commands와 explicit mapping을 만들고 unknown privileged fields를 거부합니다.", "binding/type/constraint/domain/DB errors의 owner, status, code/path를 정의합니다.", "missing/blank/malformed/boundary/Unicode/regex/nested/group/cross-field corpus를 실행합니다.", "@Valid/@Validated/BindingResult와 method-validation exception paths를 검증합니다.", "HTML field summary/focus/escaping/repopulation과 sensitive omission을 browser test합니다.", "JSON errors를 RFC 9457 public DTO로 normalize하고 rejected values를 제외합니다.", "concurrent duplicate/version schedules에서 DB constraint/conflict를 검증합니다.", "message locale/provider/framework patch differential tests를 실행합니다.", "input/error fan-out/performance budgets와 zero-leak logs/traces/responses를 검사합니다.", "javax→jakarta/client error migration, canary와 rollback evidence를 승인합니다."],
    expectedResult: ["invalid request는 service/DB를 불필요하게 호출하지 않고 수정 가능한 stable errors를 반환합니다.", "privileged/server-owned fields는 request binding으로 변경되지 않습니다.", "HTML과 JSON 어디에도 password/token/rejected PII/internal class/message codes가 노출되지 않습니다.", "concurrent uniqueness/version conflict가 500이 아닌 승인된 domain/HTTP outcome입니다.", "Spring/Jakarta/provider/locale 변경 후에도 public code/path/status contract가 유지됩니다."],
    cleanup: ["disposable contexts/DB rows, generated problem snapshots와 synthetic canary artifacts를 제거합니다.", "temporary validator/provider/profile/diagnostic access를 폐기합니다.", "logs/traces/responses에 canary 또는 raw input이 없는지 최종 scan합니다.", "원본 2026-springmvc01 files는 변경하지 않습니다."],
    extensions: ["container element/group conversion/method return validation corpus를 확장합니다.", "custom domain constraints의 metadata/TCK-style contract tests를 만듭니다.", "API schema/OpenAPI와 stable error registry/client SDK를 연결합니다.", "property-based/fuzz tests로 Unicode/regex/nested graph/error fan-out을 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 binding→code→group→cross-field→problem 흐름을 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "type error와 constraint error를 구분합니다.", "unknown role field가 거부되는 이유를 설명합니다.", "message code hierarchy를 읽습니다.", "create/update group 차이를 설명합니다.", "Problem에 rejected value가 없는지 확인합니다."], hints: ["'유효하지 않다'를 한 칸으로 쓰지 말고 누가 고칠 수 있고 어떤 state가 필요한지 나누세요."], expectedOutcome: "validation annotation을 안전한 end-to-end error contract로 연결합니다.", solutionOutline: ["bind→convert→validate→normalize→render/return 순서입니다."] },
    { difficulty: "응용", prompt: "원본 MemberVO 입력을 use-case commands와 HTML/REST validation으로 migration하세요.", requirements: ["field sensitivity/ownership matrix를 만듭니다.", "register/profile/admin DTO를 분리합니다.", "truth table/groups/cross-field constraints를 구현합니다.", "BindingResult/method exceptions를 normalize합니다.", "accessible escaped HTML을 렌더링합니다.", "RFC 9457 public schema를 적용합니다.", "DB concurrency/conflict를 검증합니다.", "zero-leak/performance/canary/rollback을 포함합니다."], hints: ["원본 field 이름만 보고 실제 개인정보 값을 찾거나 예제로 복사하지 마세요."], expectedOutcome: "over-posting과 정보 노출 없이 사용자가 수정 가능한 회원 validation 흐름이 완성됩니다.", solutionOutline: ["safe inventory→commands→constraints→error adapters→DB race→clients→canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC validation·error contract 표준을 작성하세요.", requirements: ["binding/constraint/domain/DB 책임을 정의합니다.", "DTO allow-list/sensitive/server-owned policy를 둡니다.", "constraint/group/cross-field/Clock 규칙을 둡니다.", "BindingResult/method validation paths를 둡니다.", "HTML accessibility/escaping을 요구합니다.", "RFC 9457 status/code/path/versioning을 둡니다.", "concurrency/provider/performance tests를 요구합니다.", "zero-leak telemetry, namespace migration과 rollback을 포함합니다."], hints: ["정상 값만 아니라 rejected values가 어디까지 복사되는지 data-flow로 추적하세요."], expectedOutcome: "요청 입력부터 DB conflict·client 표시·upgrade까지 운영 가능한 validation governance가 완성됩니다.", solutionOutline: ["classify→constrain→resolve→publish safely→enforce state→qualify 순서입니다."] },
  ],
  nextSessions: ["mvc-06-view-resolver-jsp-el-jstl"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["MemberVO.java에서 여러 identity/auth/profile/contact/status/audit/provider-shaped String fields와 public mutable accessors, validation annotation 0을 read-only로 확인했습니다.", "실제 member/contact/password/token/sample values는 파일에 없고 어떤 값도 학습자료로 복사하지 않았습니다.", "원본은 binding errors, constraints, groups, cross-field, error UI/API, over-posting, DB concurrency, observability와 namespace migration을 다루지 않아 current Spring/Jakarta/RFC/OWASP/JDK 공식 자료와 synthetic examples로 보완했습니다.", "JDK validators는 실제 Spring BindingResult, Jakarta provider message/path/order, JSP/JSON rendering과 DB constraints를 대체하지 않습니다."] },
});

export default session;
