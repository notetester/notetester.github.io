import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-12", explanation: "JDK 21 record·enum·collection으로 HTTP와 JSON 계약의 핵심 상태를 framework 없이 작게 모델링합니다." },
      { lines: "13-끝에서 5줄 전", explanation: "원본의 Object·항상 200·예외 문자열 노출을 대체하는 typed mapping, negotiation, validation 또는 compatibility 규칙을 결정적으로 계산합니다." },
      { lines: "마지막 5줄", explanation: "관찰해야 할 wire 불변식을 고정 순서 stdout으로 출력해 문서의 예상 결과와 완전히 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring·Jackson·network·실제 개인정보 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 줄바꿈과 대소문자까지 예상 결과와 같아야 합니다.", "교육용 순수 Java model은 실제 Spring MVC HandlerAdapter·Jackson ObjectMapper·security filter 통합 테스트를 대체하지 않습니다."] },
    experiments: [
      { change: "정상·없음·충돌·검증 실패·지원하지 않는 media type 입력을 하나씩 추가합니다.", prediction: "body 내부 성공 flag가 아니라 HTTP status, media type과 typed body가 함께 달라집니다.", result: "MockMvc 또는 실제 HTTP client로 status, headers, JSON schema와 금지 field 부재를 확인합니다." },
      { change: "새 optional field를 추가하거나 기존 field type/name을 바꿉니다.", prediction: "additive change는 구 client가 계속 읽지만 destructive change는 compatibility test에서 실패합니다.", result: "consumer fixture와 OpenAPI diff를 release gate에 연결합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-controller-contract-audit",
    title: "원본 Controller와 DataVO를 HTTP 계약·Java type·정보 노출 세 층으로 감사합니다",
    lead: "@RestController가 객체를 JSON으로 바꿔 준다는 편리함 뒤에는 status, media type, field shape와 오류 공개 범위를 API 소유자가 명시해야 하는 책임이 있습니다.",
    explanations: [
      "원본 GuestBookController는 조회·등록 요청을 DataVO에 담아 반환하고 모든 예외를 catch합니다. DataVO는 success, message, Object data를 가진 mutable Lombok 객체라 endpoint마다 data의 실제 shape가 달라도 compiler가 계약 차이를 잡지 못합니다. source hash는 읽은 snapshot의 provenance일 뿐 설계 승인이 아닙니다.",
      "Controller가 ResponseEntity나 예외 변환 없이 DataVO를 정상 반환하면 service 실패도 대개 HTTP 200으로 직렬화됩니다. client는 transport 성공과 업무 성공을 별도 flag로 재해석해야 하고 proxy, retry, monitoring, cache는 body 의미를 모르므로 잘못된 성공으로 집계할 수 있습니다.",
      "catch에서 e.getMessage()를 public message에 넣으면 SQL, filesystem path, 내부 식별자 또는 dependency 문구가 응답으로 흘러갈 수 있습니다. 사용자에게는 안정된 code와 안전한 detail을 주고, 내부 exception은 request correlation과 함께 server log/trace에 제한적으로 보존합니다.",
      "교정은 단지 DataVO의 이름을 바꾸는 일이 아닙니다. resource DTO와 command DTO, 성공 representation, HTTP status/headers, RFC 9457 problem, validation, version compatibility를 하나의 wire contract로 정의하고 contract test로 고정해야 합니다.",
    ],
    concepts: [
      c("wire contract", "client가 실제로 관찰하는 method, URI, status, headers, media type, JSON field/type/requiredness와 오류 의미의 versioned 합의입니다.", ["Java signature보다 넓습니다.", "proxy와 non-Java client도 소비합니다."]),
      c("representation", "resource의 현재 상태나 처리 결과를 특정 media type bytes로 표현한 것입니다.", ["domain object 자체가 아닙니다.", "projection과 공개 정책을 가집니다."]),
      c("provenance", "어떤 원본 snapshot과 공식 규칙에서 교육 결론을 도출했는지 추적하는 근거입니다.", ["hash는 내용 고정에 유용합니다.", "runtime 동작은 별도 검증합니다."]),
    ],
    diagnostics: [
      d("DB 오류인데 network 패널에는 200 OK가 보입니다.", "Controller가 예외를 catch한 뒤 실패 DataVO를 정상 return했습니다.", ["status와 response body를 함께 봅니다.", "Controller return type과 exception handler를 봅니다.", "monitoring success 기준이 status인지 확인합니다."], "예외를 typed domain/application error로 변환하고 적절한 4xx/5xx ResponseEntity 또는 global handler에서 ProblemDetail로 응답합니다.", "정상·없음·충돌·dependency 실패별 status/body contract tests를 둡니다."),
      d("응답 message에 SQL 문구나 내부 class 이름이 나타납니다.", "e.getMessage()를 public JSON에 직접 넣었습니다.", ["response capture에서 sensitive tokens를 찾습니다.", "catch와 error mapper를 추적합니다.", "server log correlation이 있는지 확인합니다."], "외부에는 allowlisted error code와 안전한 문구만 보내고 원인은 access-controlled log/trace로 분리합니다.", "forbidden-field/string 검사와 exception redaction review를 CI에 둡니다."),
    ],
    expertNotes: ["원본 파일의 실제 개인·환경 값을 공개 예제에 복사하지 않고 구조적 결함과 source path만 보존합니다.", "HTTP 200 envelope 전략이 항상 불가능한 것은 아니지만 일반 REST API에서 intermediaries와 표준 도구가 실패를 이해하지 못하는 비용을 명시적으로 감수해야 합니다."],
  },
  {
    id: "rest-controller-message-converter-pipeline",
    title: "@RestController에서 handler return value가 JSON bytes가 되는 전체 pipeline을 추적합니다",
    lead: "annotation 하나가 직렬화를 수행하는 것이 아니라 handler 선택, return-value handling, content negotiation과 HttpMessageConverter가 협력합니다.",
    explanations: [
      "@RestController는 @Controller와 @ResponseBody 의미를 결합합니다. DispatcherServlet이 handler를 찾고 argument resolvers가 입력을 만들며 handler가 반환한 Java value는 return value handler와 선택된 HttpMessageConverter를 거쳐 response body bytes가 됩니다.",
      "Jackson converter가 classpath에 있다는 사실만으로 모든 object가 안전한 계약이 되지는 않습니다. getter, record component, annotation, module, naming strategy와 ObjectMapper 설정에 따라 공개 field가 바뀌며 lazy proxy나 순환 graph는 성능·직렬화 오류를 만들 수 있습니다.",
      "domain entity를 그대로 반환하면 persistence 구조와 public API가 결합됩니다. controller boundary에서 immutable response DTO로 projection하고 authorization 이후 허용 field만 복사하면 schema와 데이터 최소화 정책을 명확히 할 수 있습니다.",
      "실제 pipeline 검증은 unit method call만으로 부족합니다. MockMvc 또는 deployed HTTP test가 selected handler, status, Content-Type, charset, converter output과 advice/filter 영향을 관찰해야 합니다.",
    ],
    concepts: [
      c("@RestController", "모든 handler method의 return value를 기본적으로 response body에 쓰는 controller stereotype입니다.", ["view name resolution과 다릅니다.", "method별 ResponseEntity도 사용할 수 있습니다."]),
      c("HttpMessageConverter", "Java value와 HTTP representation bytes 사이를 media type에 따라 읽고 쓰는 Spring MVC 전략입니다.", ["converter order와 supported media types가 선택에 관여합니다.", "Jackson JSON converter는 그중 하나입니다."]),
      c("response DTO", "외부에 공개할 field와 JSON type을 의도적으로 고정한 boundary type입니다.", ["entity와 분리합니다.", "immutable record가 유용할 수 있습니다."]),
    ],
    diagnostics: [
      d("객체는 채워졌는데 406 또는 converter not found가 발생합니다.", "Accept와 produces에 맞는 converter/media type 조합이 없습니다.", ["request Accept를 봅니다.", "handler produces와 converter supportedMediaTypes를 봅니다.", "classpath/ObjectMapper customizer를 확인합니다."], "지원 media type을 명시하고 해당 converter를 구성하며 client가 올바른 Accept를 보내게 합니다.", "media type matrix integration test를 둡니다."),
      d("entity 직렬화 중 무한 recursion 또는 대량 query가 발생합니다.", "양방향 graph나 lazy association을 public representation으로 직접 순회했습니다.", ["serialized field graph를 봅니다.", "query count와 stack trace를 확인합니다.", "DTO projection 경계를 확인합니다."], "조회 목적 DTO로 필요한 field만 projection하고 query fetch plan을 맞춥니다.", "serialization test와 query-budget test를 함께 둡니다."),
    ],
    expertNotes: ["Jackson annotation으로 entity graph를 계속 가리는 방식은 persistence-public coupling을 남깁니다.", "converter 선택 문제와 JSON schema 문제를 같은 오류로 뭉뚱그리지 말고 handler→negotiation→converter→bytes 순서로 진단합니다."],
  },
  {
    id: "typed-envelope-resource-shape",
    title: "Object data를 resource-specific DTO 또는 generic typed envelope로 교체합니다",
    lead: "컴파일 시점 type과 wire schema가 가까울수록 endpoint별 shape drift, unsafe cast와 문서 불일치를 더 일찍 잡을 수 있습니다.",
    explanations: [
      "Object data는 단일 객체, 목록, 숫자, null과 임의 map을 모두 허용합니다. controller 구현은 편하지만 consumer는 endpoint 문서를 보며 runtime cast를 해야 하고 schema generator도 구체 type을 잃기 쉽습니다.",
      "resource endpoint는 가능한 한 GuestResponse, List<GuestSummary>처럼 body 자체가 표현이 되게 합니다. 조직 표준이 metadata envelope를 요구하면 ApiResponse<T>처럼 generic type parameter를 유지하고 pagination/correlation metadata의 의미를 versioned schema로 고정합니다.",
      "success와 error를 같은 mutable envelope에 넣으면 success=false인데 data가 존재하거나 success=true인데 error code가 있는 모순 상태를 만들 수 있습니다. 성공과 실패 body를 별도 types/media type/status로 분리하거나 sealed model로 불가능한 상태를 표현합니다.",
      "DTO의 String/number/boolean/array/object/null 구분은 Java field declaration과 OpenAPI/JSON Schema에 반영합니다. 식별자나 금액을 무심코 number/string 사이에서 바꾸면 JavaScript precision, sorting과 cache key가 달라질 수 있습니다.",
    ],
    concepts: [
      c("generic envelope", "공통 metadata와 구체 payload T를 함께 운반하는 parameterized response type입니다.", ["Object보다 schema 정보를 보존합니다.", "모든 endpoint에 강제할 필요는 없습니다."]),
      c("impossible state", "type 설계상 생성할 수 없어야 하는 모순된 상태 조합입니다.", ["success/error 분리로 줄일 수 있습니다.", "runtime validation만으로도 보완합니다."]),
      c("projection", "domain/persistence model에서 특정 API 사용 사례에 필요한 공개 field만 새 DTO로 옮기는 변환입니다.", ["data minimization을 돕습니다.", "query shape와 맞춰야 합니다."]),
    ],
    codeExamples: [java("boot03-typed-envelope", "Object 대신 generic payload와 불변 조건 사용", "Boot03TypedEnvelope.java", "ApiResponse<T>가 payload type을 보존하고 success/error 모순 상태를 생성 시점에 막는 최소 model입니다.", String.raw`public class Boot03TypedEnvelope {
record GuestSummary(long id, String displayName) {}

record ApiResponse<T>(boolean success, String code, T data) {
    ApiResponse {
        if (success == (code != null)) {
            throw new IllegalArgumentException("success/code invariant");
        }
    }
    static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, data);
    }
    static <T> ApiResponse<T> failure(String code) {
        return new ApiResponse<>(false, code, null);
    }
}

    public static void main(String[] args) {
        ApiResponse<GuestSummary> ok = ApiResponse.ok(new GuestSummary(7, "learner"));
        ApiResponse<GuestSummary> missing = ApiResponse.failure("GUEST_NOT_FOUND");
        System.out.println("ok=" + ok.success() + ",id=" + ok.data().id());
        System.out.println("missing=" + missing.success() + ",code=" + missing.code());
        System.out.println("missing-data=" + missing.data());
    }
}`, "ok=true,id=7\nmissing=false,code=GUEST_NOT_FOUND\nmissing-data=null", ["source-data-vo", "spring-responsebody", "spring-mvc-controller", "spring-restcontroller-javadoc", "openapi-311"])],
    diagnostics: [
      d("OpenAPI에 data가 object 하나로만 나오고 client type이 unknown입니다.", "DataVO.data가 Object라 concrete generic/schema 정보를 잃었습니다.", ["controller declared return type을 봅니다.", "generated schema를 봅니다.", "runtime samples가 endpoint마다 다른지 봅니다."], "resource DTO 또는 ApiResponse<ConcreteDto>로 return type을 구체화합니다.", "schema generation과 compiled consumer test를 CI에 둡니다."),
      d("success=false인데 data가 채워진 응답이 생성됩니다.", "mutable envelope가 상호 배타 field 불변식을 강제하지 않습니다.", ["constructor/setter call sites를 찾습니다.", "success-code-data 조합을 property test합니다.", "JSON examples를 검사합니다."], "immutable factory와 별도 success/problem types로 유효 조합만 생성합니다.", "invalid combination tests와 setter 금지 규칙을 둡니다."),
    ],
    expertNotes: ["generic wrapper는 trace metadata 같은 조직 요구가 있을 때 유용하지만 resource representation을 불필요하게 중첩해 모든 client가 unwrap하게 만드는 비용도 평가합니다.", "DTO projection 뒤에도 authorization은 필요합니다. field가 DTO에 없다는 사실은 object-level access control을 대신하지 않습니다."],
  },
  {
    id: "http-status-method-semantics",
    title: "업무 결과를 body flag가 아니라 HTTP status·method semantics와 함께 표현합니다",
    lead: "status code는 client, cache, gateway와 monitoring이 공통으로 이해하는 protocol signal이므로 정확한 분류가 복구 동작을 바꿉니다.",
    explanations: [
      "성공 조회는 200과 representation, 생성은 보통 201과 Location, body가 없는 성공은 204를 고려합니다. 존재하지 않는 resource는 404, 현재 상태와 충돌은 409, syntactically valid하지만 semantic validation이 실패하면 조직 계약에 맞춘 400 계열을 사용합니다.",
      "인증되지 않음과 권한 없음은 401/403으로 구분하고 upstream timeout/unavailable은 504/503처럼 retry 가능성을 드러낼 수 있습니다. 모든 exception을 500으로 바꾸거나 모든 실패를 200으로 숨기면 client 정책이 왜곡됩니다.",
      "GET, PUT, DELETE의 idempotent semantics와 POST의 일반적 non-idempotence를 retry 설계에 연결합니다. status만 맞아도 duplicate create가 가능하므로 idempotency key나 natural uniqueness 같은 application guarantee가 별도로 필요합니다.",
      "ResponseEntity는 status와 headers, body를 함께 명시하게 하지만 아무 status나 임의로 고르는 허가가 아닙니다. RFC 9110 의미, resource lifecycle과 consumer action을 기준으로 mapping table을 유지합니다.",
    ],
    concepts: [
      c("status semantics", "응답 결과 class와 client가 취할 수 있는 protocol-level 의미를 세 자리 code로 표현하는 규칙입니다.", ["body와 함께 해석합니다.", "monitoring과 retry에 영향을 줍니다."]),
      c("idempotent method", "동일 요청을 여러 번 적용해도 의도된 server state 효과가 한 번 적용한 것과 같은 method 특성입니다.", ["response가 매번 같다는 뜻은 아닙니다.", "network retry safety와 연결됩니다."]),
      c("Location", "생성되었거나 redirect 대상인 resource URI를 전달하는 response header입니다.", ["201에서 새 resource 식별에 사용합니다.", "open redirect와는 별도 검증합니다."]),
    ],
    codeExamples: [java("boot03-status-map", "도메인 결과를 HTTP status로 명시적으로 매핑", "Boot03StatusMap.java", "항상 200 envelope 대신 결과별 status와 retry 분류를 고정합니다.", String.raw`public class Boot03StatusMap {
    enum Outcome { FOUND, CREATED, INVALID, MISSING, CONFLICT, DEPENDENCY_DOWN }
    static int status(Outcome value) {
        return switch (value) {
            case FOUND -> 200;
            case CREATED -> 201;
            case INVALID -> 400;
            case MISSING -> 404;
            case CONFLICT -> 409;
            case DEPENDENCY_DOWN -> 503;
        };
    }
    static boolean retryable(int status) {
        return status == 503;
    }
    public static void main(String[] args) {
        for (Outcome value : Outcome.values()) {
            int status = status(value);
            System.out.println(value + "=" + status + ",retry=" + retryable(status));
        }
    }
}`, "FOUND=200,retry=false\nCREATED=201,retry=false\nINVALID=400,retry=false\nMISSING=404,retry=false\nCONFLICT=409,retry=false\nDEPENDENCY_DOWN=503,retry=true", ["rfc9110", "spring-responseentity"])],
    diagnostics: [
      d("APM 성공률은 100%인데 사용자는 계속 실패합니다.", "업무 실패를 200 body flag로 반환해 status 기반 telemetry가 성공으로 셌습니다.", ["status별 body code를 교차 집계합니다.", "controller error mapping을 봅니다.", "gateway health 기준을 확인합니다."], "실패 class를 표준 status로 매핑하고 domain error code를 보조 신호로 둡니다.", "status×error-code SLO와 contract test를 둡니다."),
      d("client가 validation 오류를 재시도해 부하가 커집니다.", "4xx/5xx 또는 error code의 retryability 계약이 불명확합니다.", ["실제 status와 retry middleware를 봅니다.", "method idempotence를 확인합니다.", "Retry-After 존재를 봅니다."], "permanent client failure와 transient server failure를 분류하고 retry budget을 제한합니다.", "status/method별 retry policy fixtures를 둡니다."),
    ],
    expertNotes: ["status mapping은 endpoint마다 즉흥적으로 쓰지 말고 domain error taxonomy와 중앙 handler가 같은 표를 공유하게 합니다.", "404와 빈 collection은 다릅니다. collection 자체가 존재하고 결과가 0개면 보통 200과 []가 더 자연스럽습니다."],
  },
  {
    id: "json-wire-types-normalization",
    title: "JSON field 이름·type·null·number·date·Unicode를 wire 수준에서 고정합니다",
    lead: "Java 객체가 비슷해 보여도 JSON number와 string, absent와 null, local date와 instant 차이는 client 계산과 호환성을 바꿉니다.",
    explanations: [
      "JSON은 object, array, number, string, boolean과 null을 가집니다. Java long을 number로 내보낼지 opaque ID string으로 내보낼지, BigDecimal scale을 어떻게 보존할지 consumer runtime까지 고려해 결정합니다.",
      "field absent는 값을 보내지 않았다는 뜻이고 explicit null은 알려진 empty/unknown 상태라는 뜻으로 설계할 수 있습니다. PATCH에서는 omitted와 null이 update/no-change를 가를 수 있으므로 serialization inclusion 정책을 무심코 global 변경하지 않습니다.",
      "시간은 Instant/OffsetDateTime과 ISO 8601 offset을 우선하고 server local timezone에 기대지 않습니다. LocalDate는 날짜 자체가 business concept일 때만 사용하며 epoch unit seconds/millis를 혼합하지 않습니다.",
      "JSON text 교환은 RFC 8259의 UTF-8 interoperable expectation을 따르고 field order에 의미를 두지 않습니다. canonical signature가 필요하면 일반 serializer 출력 순서가 아니라 별도 canonicalization 규격을 선택합니다.",
    ],
    concepts: [
      c("absent vs null", "JSON member 자체가 없는 상태와 member가 null 값으로 존재하는 상태의 계약 차이입니다.", ["PATCH에서 특히 중요합니다.", "client language별 decode 차이를 시험합니다."]),
      c("wire type", "serialized JSON에서 실제 관찰되는 primitive/container type입니다.", ["Java declared type과 serializer 설정의 결과입니다.", "destructive 변경을 피합니다."]),
      c("temporal normalization", "시간 값을 명시적 offset/zone/unit을 가진 공통 형식으로 표현하는 정책입니다.", ["Clock을 test에 주입합니다.", "display timezone은 client concern일 수 있습니다."]),
    ],
    codeExamples: [java("boot03-json-shape", "JSON primitive와 absent/null contract 검사", "Boot03JsonShape.java", "간단한 schema map으로 field별 허용 wire type과 requiredness를 판정합니다.", String.raw`import java.util.*;

public class Boot03JsonShape {
    static String type(Object value) {
        if (value == null) return "null";
        if (value instanceof String) return "string";
        if (value instanceof Number) return "number";
        if (value instanceof Boolean) return "boolean";
        if (value instanceof List<?>) return "array";
        return "object";
    }
    static String check(Map<String, Object> body) {
        if (!body.containsKey("id")) return "missing:id";
        if (!type(body.get("id")).equals("string")) return "type:id";
        if (!body.containsKey("name")) return "missing:name";
        return "ok:name=" + type(body.get("name"));
    }
    public static void main(String[] args) {
        System.out.println(check(Map.of("id", "9007199254740993", "name", "Kim")));
        System.out.println(check(Map.of("id", 7, "name", "Kim")));
        Map<String, Object> nullable = new LinkedHashMap<>();
        nullable.put("id", "8"); nullable.put("name", null);
        System.out.println(check(nullable));
        System.out.println(check(Map.of("name", "Kim")));
    }
}`, "ok:name=string\ntype:id\nok:name=null\nmissing:id", ["rfc8259", "openapi-311"])],
    diagnostics: [
      d("큰 식별자가 browser에서 다른 숫자로 보입니다.", "정밀도 범위를 넘는 integer를 JSON number와 JavaScript Number로 전달했습니다.", ["wire token type을 봅니다.", "consumer runtime precision을 재현합니다.", "OpenAPI schema format을 확인합니다."], "산술하지 않는 큰 opaque identifier는 합의된 string 표현을 사용합니다.", "경계값 consumer contract test를 둡니다."),
      d("field가 null일 때만 client crash가 발생합니다.", "required, nullable와 absent 정책이 schema/client code와 다릅니다.", ["실제 body에 member가 있는지 봅니다.", "serializer inclusion을 봅니다.", "generated client nullability를 확인합니다."], "field별 required/null 의미를 문서·DTO·schema에서 일치시키고 migration default를 제공합니다.", "absent/null/empty fixtures를 모두 둡니다."),
    ],
    expertNotes: ["JSON object member order와 whitespace는 semantic contract가 아닙니다. snapshot test는 structural comparison을 우선합니다.", "숫자를 전부 string으로 바꾸는 것도 해결이 아닙니다. 계산 의미, range, precision과 consumer 생태계에 따라 field별 선택합니다."],
  },
  {
    id: "request-dto-validation-mass-assignment",
    title: "요청 DTO를 allowlist로 설계하고 binding과 validation 실패를 field-safe contract로 만듭니다",
    lead: "입력 JSON을 entity나 광범위한 mutable VO에 직접 bind하면 client가 수정하면 안 되는 field까지 전달하는 mass assignment 경계가 흐려집니다.",
    explanations: [
      "CreateGuestRequest와 UpdateGuestRequest는 같은 resource라도 허용 field와 requiredness가 다릅니다. id, owner, role, audit timestamp처럼 server가 소유하는 field는 request DTO에 두지 않고 authenticated principal과 server policy에서 채웁니다.",
      "JSON syntax 오류, type mismatch, missing required field와 domain constraint 위반은 서로 다른 단계입니다. parser/binder/Bean Validation/domain service가 낸 오류를 안정된 public code와 field pointer로 정규화합니다.",
      "unknown field는 forward compatibility와 typo 탐지 사이 tradeoff가 있습니다. security-sensitive command에서는 reject를 고려하고, 일반 additive evolution에서는 ignore하되 telemetry로 관찰할 수 있습니다. 정책을 endpoint별로 우연히 달라지게 두지 않습니다.",
      "검증 메시지는 raw rejected value나 내부 annotation dump를 노출하지 않습니다. field path, machine code와 localized safe message를 보내며 cross-field/business validation은 resource state와 race를 고려해 service/transaction 경계에서도 다시 확인합니다.",
    ],
    concepts: [
      c("mass assignment", "client 입력을 넓은 object에 자동 binding해 권한 없는 속성까지 변경할 수 있게 되는 취약한 패턴입니다.", ["request DTO allowlist로 줄입니다.", "authorization도 별도로 필요합니다."]),
      c("binding error", "JSON token을 target Java property/type으로 변환하지 못한 boundary 오류입니다.", ["Bean Validation 이전일 수 있습니다.", "stable field pointer로 변환합니다."]),
      c("constraint violation", "형식 변환은 됐지만 declared 또는 domain invariant를 만족하지 못한 상태입니다.", ["field와 object-level 조건이 있습니다.", "race-sensitive 조건은 transaction에서 재검증합니다."]),
    ],
    diagnostics: [
      d("client가 role 필드를 보내 관리자 권한을 얻습니다.", "entity 전체를 request body로 bind하고 허용 field를 제한하지 않았습니다.", ["request DTO fields를 봅니다.", "mapping code와 authorization을 봅니다.", "unknown fields 처리 정책을 확인합니다."], "command-specific DTO에 writable fields만 두고 privileged values는 server context에서 결정합니다.", "hostile extra-field tests와 object-level authorization tests를 둡니다."),
      d("잘못된 숫자 입력이 generic 500으로 반환됩니다.", "deserialization/type mismatch와 application exception을 구분해 처리하지 않았습니다.", ["exception type과 handler order를 봅니다.", "request media type/body를 확인합니다.", "ProblemDetail mapping을 봅니다."], "syntax/binding/validation/domain failures를 안정된 4xx problem types로 나눕니다.", "malformed JSON·wrong type·missing·cross-field matrix를 둡니다."),
    ],
    expertNotes: ["validation은 authorization이 아닙니다. 유효한 다른 사용자의 resource ID도 접근 허가를 별도로 검사해야 합니다.", "rejected value를 그대로 error detail에 넣으면 개인정보와 injection payload가 log/response로 확산될 수 있습니다."],
  },
  {
    id: "content-negotiation-media-types",
    title: "Content-Type·Accept·produces·consumes를 request/response 방향으로 구분합니다",
    lead: "Content-Type은 현재 message body의 형식이고 Accept는 client가 받을 수 있는 형식이므로 두 header를 뒤섞으면 415와 406을 진단할 수 없습니다.",
    explanations: [
      "POST JSON 요청의 Content-Type은 application/json이며 server consumes와 맞아야 합니다. 응답 선택에서는 Accept와 handler produces, converter supported media type을 비교해 가장 적절한 representation을 선택합니다.",
      "요청 형식이 지원되지 않으면 415, 응답할 acceptable representation이 없으면 406이 자연스럽습니다. body flag 실패로 200을 보내거나 무조건 JSON을 보내면 client와 intermediary가 계약 위반을 조기에 알 수 없습니다.",
      "application/problem+json은 오류 representation에 사용할 수 있고 성공 application/json과 같은 status라도 body 의미가 다릅니다. vendor media type 또는 URI versioning을 선택할 때 cache Vary와 documentation/tooling 영향을 함께 평가합니다.",
      "browser, curl, generated client 각각 기본 Accept가 다를 수 있어 개발 환경에서 우연히 성공한 결과를 계약으로 간주하지 않습니다. q value, wildcard와 charset parameter까지 target Spring version의 negotiation behavior를 integration test합니다.",
    ],
    concepts: [
      c("Content-Type", "현재 request 또는 response body representation의 media type을 선언하는 header입니다.", ["body가 없을 때 의미가 제한됩니다.", "request consumes 판정에 사용됩니다."]),
      c("Accept", "client가 응답으로 수용할 media ranges와 선호도를 전달하는 request header입니다.", ["q value와 wildcard가 있습니다.", "406 판단에 관여합니다."]),
      c("content negotiation", "available representations와 request preferences를 비교해 response media type을 선택하는 과정입니다.", ["URL suffix 전략은 신중히 사용합니다.", "Vary/caching을 함께 봅니다."]),
    ],
    codeExamples: [java("boot03-negotiation", "Accept media range 선택과 406 판정", "Boot03Negotiation.java", "지원 목록과 Accept tokens를 비교해 JSON, Problem JSON 또는 not-acceptable을 결정합니다.", String.raw`import java.util.*;

public class Boot03Negotiation {
    static String choose(String accept, List<String> available) {
        for (String raw : accept.split(",")) {
            String range = raw.trim().split(";", 2)[0];
            if (range.equals("*/*")) return available.getFirst();
            for (String candidate : available) {
                if (range.equals(candidate)) return candidate;
                if (range.endsWith("/*") && candidate.startsWith(range.substring(0, range.length() - 1))) return candidate;
            }
        }
        return "406";
    }
    public static void main(String[] args) {
        List<String> success = List.of("application/json");
        List<String> problem = List.of("application/problem+json");
        System.out.println(choose("application/json", success));
        System.out.println(choose("application/*", problem));
        System.out.println(choose("text/html", success));
        System.out.println(choose("*/*", success));
    }
}`, "application/json\napplication/problem+json\n406\napplication/json", ["spring-message-converters", "spring-requestmapping", "rfc9110", "rfc9457"])],
    diagnostics: [
      d("JSON POST가 415 Unsupported Media Type입니다.", "request Content-Type이 없거나 consumes와 맞지 않습니다.", ["network raw request headers를 봅니다.", "body bytes와 charset을 봅니다.", "handler consumes/converter를 확인합니다."], "client가 실제 body에 맞는 Content-Type을 보내고 server supported formats를 명시합니다.", "Content-Type positive/negative matrix를 둡니다."),
      d("Accept: text/html 요청에도 JSON 200이 옵니다.", "Accept negotiation을 무시하거나 overly broad produces를 사용했습니다.", ["request Accept를 봅니다.", "selected handler/produces를 봅니다.", "converter fallback 설정을 확인합니다."], "지원 representation과 negotiation 정책을 명시하고 불가능하면 406을 반환합니다.", "wildcard/q-value/unsupported Accept integration tests를 둡니다."),
    ],
    expertNotes: ["이 예제는 q-value 정렬을 생략한 교육 model입니다. 실제 Spring MVC 결과를 해당 framework version test로 고정해야 합니다.", "Content-Type을 모든 GET 요청에 습관적으로 넣는 client 설정은 body 없는 request 의미를 혼란스럽게 할 수 있습니다."],
  },
  {
    id: "problem-details-safe-errors",
    title: "RFC 9457 Problem Details로 안전하고 기계 판독 가능한 오류를 설계합니다",
    lead: "오류 body는 stack trace나 예외 문자열 덤프가 아니라 문제 유형, status, 안전한 detail과 request instance를 연결하는 공개 계약이어야 합니다.",
    explanations: [
      "Problem Details는 type, title, status, detail, instance 기본 members를 제공하고 application-specific extension을 허용합니다. type URI는 문제 class의 안정된 식별자이며 title 번역이나 문구 변경과 분리됩니다.",
      "status member와 실제 HTTP status line이 다르면 두 진실이 생깁니다. handler가 한 mapping table에서 둘을 만들고 tests가 일치를 검증합니다. instance에는 민감 query나 내부 path를 복사하지 않고 opaque occurrence reference를 사용할 수 있습니다.",
      "e.getMessage()는 public detail이 아닙니다. known domain exception을 allowlisted code/detail로 변환하고 unknown exception은 일반 500 detail과 correlation ID만 반환합니다. stack, SQL, class, host와 secret은 response에서 금지합니다.",
      "field validation errors extension은 JSON Pointer 또는 안정된 field path, code와 safe message 배열로 정의합니다. localization이 필요하면 machine code는 유지하고 message만 locale에 따라 바꾸며 logs에는 원본 payload 전체를 기본 수집하지 않습니다.",
    ],
    concepts: [
      c("ProblemDetail", "Spring이 RFC 9457 problem representation을 모델링하는 HTTP API error container입니다.", ["status와 properties를 가질 수 있습니다.", "global exception handling과 결합합니다."]),
      c("problem type", "문제 class를 안정적으로 식별하는 URI reference입니다.", ["사람용 title과 분리됩니다.", "client branching key로 사용할 수 있습니다."]),
      c("correlation identifier", "client-visible occurrence와 server-side log/trace를 연결하는 opaque 식별자입니다.", ["secret이 아니어도 추측·노출 범위를 제한합니다.", "원인 문자열을 대체합니다."]),
    ],
    codeExamples: [java("boot03-problem", "내부 예외를 안전한 Problem Details로 변환", "Boot03Problem.java", "known/unknown failure를 안정된 type과 안전한 detail로 매핑하고 내부 message가 body에 없는지 보여 줍니다.", String.raw`public class Boot03Problem {
    record Failure(String kind, String internalMessage) {}
    record Problem(String type, String title, int status, String detail, String occurrence) {}
    static Problem map(Failure failure, String occurrence) {
        return switch (failure.kind()) {
            case "missing" -> new Problem("urn:problem:guest-not-found", "Guest not found", 404,
                    "The requested guest does not exist.", occurrence);
            case "conflict" -> new Problem("urn:problem:guest-conflict", "Guest conflict", 409,
                    "The guest changed; reload and retry.", occurrence);
            default -> new Problem("about:blank", "Internal Server Error", 500,
                    "The request could not be completed.", occurrence);
        };
    }
    public static void main(String[] args) {
        Problem known = map(new Failure("missing", "row 7 absent"), "req-a1");
        Problem unknown = map(new Failure("sql", "password=hidden; table=guest"), "req-b2");
        System.out.println(known.status() + " " + known.type() + " " + known.occurrence());
        System.out.println(unknown.status() + " " + unknown.detail() + " " + unknown.occurrence());
        System.out.println("leaked=" + unknown.detail().contains("password"));
    }
}`, "404 urn:problem:guest-not-found req-a1\n500 The request could not be completed. req-b2\nleaked=false", ["spring-rest-exceptions", "spring-problemdetail", "rfc9457", "source-guest-controller"])],
    diagnostics: [
      d("problem.status는 404인데 HTTP status line은 200입니다.", "body와 ResponseEntity status를 별도 경로에서 만들었습니다.", ["raw status line과 JSON member를 비교합니다.", "exception handler return type을 봅니다.", "proxy rewrite가 있는지 확인합니다."], "하나의 typed mapping 결과에서 status와 ProblemDetail을 함께 생성합니다.", "모든 error fixture에서 line/body status equality를 assert합니다."),
      d("오류 응답에 stack trace 또는 credential fragment가 보입니다.", "unknown exception과 rejected input을 그대로 serialize/log했습니다.", ["response forbidden strings를 scan합니다.", "error attributes 설정을 봅니다.", "observability exporter fields를 확인합니다."], "public allowlist mapper와 safe generic 500을 적용하고 내부 원인은 접근 통제된 telemetry에 둡니다.", "secret canary와 hostile exception tests를 둡니다."),
    ],
    expertNotes: ["type URI가 반드시 클릭 가능한 문서일 필요는 없지만 조직은 lifecycle과 ownership을 관리해야 합니다.", "Problem Details는 오류 taxonomy를 대신 만들지 않습니다. domain errors를 먼저 분류한 뒤 HTTP mapping을 적용합니다."],
  },
  {
    id: "collection-notfound-pagination",
    title: "단건·collection·empty·not found·pagination 의미를 resource 관점에서 나눕니다",
    lead: "데이터가 0건이라는 같은 관찰도 단건 resource 부재, 존재하는 collection의 빈 결과와 page 범위 초과에서는 다른 계약이 필요합니다.",
    explanations: [
      "GET /guests/{id}가 resource를 찾지 못하면 404가 자연스럽지만 GET /guests?query=x에서 match가 없으면 200과 []가 일반적입니다. null, 빈 object와 빈 array를 임의로 섞지 않습니다.",
      "목록 response는 stable item schema와 deterministic ordering을 정의합니다. DB의 우연한 row order에 기대면 page 사이에서 중복·누락이 생기므로 unique tiebreaker가 있는 sort를 사용합니다.",
      "offset pagination은 단순하지만 concurrent insert/delete에서 drift가 생길 수 있고 큰 offset 비용이 큽니다. cursor는 ordering key와 filter snapshot 의미를 포함해 opaque·tamper-resistant하게 설계합니다.",
      "total count는 비싸거나 snapshot과 불일치할 수 있습니다. exact/estimated/absent 의미를 metadata에 명시하고 Link 또는 next cursor가 소비자에게 필요한지 계약 중심으로 선택합니다.",
    ],
    concepts: [
      c("empty collection", "collection resource는 존재하지만 현재 filter에 맞는 item이 0개인 정상 representation입니다.", ["보통 []를 사용합니다.", "404와 구분합니다."]),
      c("stable ordering", "동일 dataset과 query에서 page 경계가 결정적으로 유지되도록 unique tiebreaker까지 포함한 정렬입니다.", ["pagination correctness에 필요합니다.", "DB index와 맞춥니다."]),
      c("cursor", "다음 page를 이어 읽기 위한 server-defined opaque continuation token입니다.", ["filter/order binding이 필요합니다.", "민감 값을 그대로 노출하지 않습니다."]),
    ],
    diagnostics: [
      d("검색 결과 0건에서 client가 error toast를 띄웁니다.", "empty collection을 404 또는 null로 반환했습니다.", ["endpoint가 item인지 collection인지 구분합니다.", "status/body schema를 봅니다.", "client empty-state 처리를 봅니다."], "collection query는 200과 [] 및 일관된 page metadata를 반환합니다.", "zero/one/many fixtures를 둡니다."),
      d("페이지 이동 중 같은 항목이 중복되거나 빠집니다.", "비결정적 ordering 또는 offset 중 concurrent mutation이 있었습니다.", ["ORDER BY와 unique tiebreaker를 봅니다.", "request 사이 write timeline을 봅니다.", "cursor contents/version을 확인합니다."], "stable keyset ordering과 versioned opaque cursor 또는 snapshot 정책을 사용합니다.", "concurrent insert/delete pagination tests를 둡니다."),
    ],
    expertNotes: ["204는 response body를 가질 수 없으므로 빈 JSON array 계약과 바꿔 쓰지 않습니다.", "pagination metadata를 generic envelope에 넣을 때 item schema T와 metadata version을 모두 문서화합니다."],
  },
  {
    id: "api-versioning-compatibility",
    title: "버전 번호보다 먼저 additive compatibility와 consumer migration 정책을 설계합니다",
    lead: "API versioning은 breaking change를 마음대로 만드는 도구가 아니라 여러 consumer가 다른 속도로 이동할 시간을 관리하는 운영 계약입니다.",
    explanations: [
      "optional field 추가는 대체로 additive지만 client가 unknown field를 거부하거나 enum을 exhaustive하게 처리하면 깨질 수 있습니다. field rename, type 변경, required field 추가, enum value 추가와 semantics 변경을 consumer fixtures로 검증합니다.",
      "URI /v1, media type parameter/vendor type, header versioning은 각각 routing, caching, discoverability와 tooling tradeoff가 있습니다. 한 조직에서 일관된 정책과 sunset/deprecation observability를 가져야 합니다.",
      "server는 expand-and-contract를 사용해 새 field를 먼저 추가하고 dual-read/write 또는 adapter를 거쳐 구 field를 충분한 기간 유지한 뒤 usage evidence로 제거합니다. database migration과 API removal 시점을 결합하지 않습니다.",
      "OpenAPI diff는 유용하지만 semantic change와 실제 consumer assumption을 완전히 알지 못합니다. golden JSON, tolerant/strict clients, generated SDK compile, production version usage와 canary rollback을 함께 둡니다.",
    ],
    concepts: [
      c("backward compatibility", "새 server가 기존 client의 유효 요청을 계속 처리하고 기대한 response 의미를 유지하는 성질입니다.", ["syntax와 semantics 모두 봅니다.", "consumer evidence가 필요합니다."]),
      c("expand-and-contract", "새 계약을 additive하게 병행한 뒤 consumer migration을 확인하고 오래된 계약을 제거하는 단계적 변화입니다.", ["rollback window를 보존합니다.", "usage telemetry가 필요합니다."]),
      c("consumer-driven contract", "실제 consumer가 의존하는 요청·응답 interaction을 provider 검증에 전달하는 테스트 방식입니다.", ["전체 API spec을 대체하지 않습니다.", "consumer ownership이 필요합니다."]),
    ],
    codeExamples: [java("boot03-versioning", "V1 consumer를 보존하는 additive V2 projection", "Boot03Versioning.java", "canonical domain record에서 V1/V2 DTO를 동시에 만들고 기존 field 의미가 보존되는지 검사합니다.", String.raw`public class Boot03Versioning {
    record Guest(long id, String givenName, String familyName, String locale) {}
    record GuestV1(String id, String name) {}
    record GuestV2(String id, String displayName, String locale) {}
    static GuestV1 v1(Guest guest) {
        return new GuestV1(Long.toString(guest.id()), guest.givenName() + " " + guest.familyName());
    }
    static GuestV2 v2(Guest guest) {
        return new GuestV2(Long.toString(guest.id()), guest.givenName() + " " + guest.familyName(), guest.locale());
    }
    public static void main(String[] args) {
        Guest guest = new Guest(9, "Ada", "Kim", "ko-KR");
        GuestV1 oldView = v1(guest);
        GuestV2 newView = v2(guest);
        System.out.println("v1=" + oldView.id() + "," + oldView.name());
        System.out.println("v2=" + newView.id() + "," + newView.displayName() + "," + newView.locale());
        System.out.println("old-fields-preserved=" + (oldView.id().equals(newView.id()) && oldView.name().equals(newView.displayName())));
    }
}`, "v1=9,Ada Kim\nv2=9,Ada Kim,ko-KR\nold-fields-preserved=true", ["openapi-311", "rfc9110"])],
    diagnostics: [
      d("optional field 하나를 추가했는데 구 mobile client가 parse 실패합니다.", "consumer가 unknown fields를 거부하는 strict decoder를 사용했습니다.", ["실패 client/version을 식별합니다.", "decoder policy를 재현합니다.", "contract fixtures를 봅니다."], "consumer tolerance를 개선하거나 새 version/negotiated representation을 병행해 migration합니다.", "supported consumer versions의 real decoder tests를 둡니다."),
      d("구 field를 제거한 뒤 rollback해도 일부 요청이 실패합니다.", "expand-and-contract 없이 server/database/API를 동시에 destructive 변경했습니다.", ["deployment와 schema timeline을 봅니다.", "version usage를 확인합니다.", "N-1 compatibility를 시험합니다."], "dual contract와 rollback-compatible storage를 유지하고 usage zero evidence 뒤 제거합니다.", "forward/backward compatibility rehearsal을 release gate로 둡니다."),
    ],
    expertNotes: ["enum value 추가도 exhaustive switch consumer에는 breaking일 수 있습니다. unknown fallback 정책을 계약에 둡니다.", "version을 endpoint마다 남발하지 말고 bounded context와 representation evolution 단위를 정합니다."],
  },
  {
    id: "security-privacy-cache-boundary",
    title: "직렬화 계약에 authorization·개인정보 최소화·cache 안전성을 포함합니다",
    lead: "JSON이 기술적으로 유효해도 다른 사용자의 데이터, secret, 내부 식별자나 cache-private response가 공개되면 API 계약은 실패입니다.",
    explanations: [
      "object-level authorization은 path/body의 ID가 authenticated principal에게 허용되는지 resource마다 검사합니다. 목록 query도 tenant/user scope를 repository query에 포함하고 DTO projection만 믿지 않습니다.",
      "response DTO는 필요한 개인정보만 포함하고 password hash, token, secret answer, internal notes와 운영 host를 애초에 field로 만들지 않습니다. log, trace attribute와 test snapshot도 같은 data classification을 따릅니다.",
      "개인화 응답은 Cache-Control: private/no-store 등 요구를 검토하고 authorization/cookie에 따라 달라지는 response를 shared cache가 섞지 않도록 합니다. ETag는 representation과 권한 scope를 누설하지 않는지 확인합니다.",
      "JSON hijacking 같은 역사적 맥락보다 현재는 올바른 Content-Type, nosniff, CORS/CSRF/authentication과 XSS-safe client rendering을 분리해 적용합니다. API 응답 encoding 하나가 모든 browser 위협을 해결하지 않습니다.",
    ],
    concepts: [
      c("object-level authorization", "요청자가 특정 resource instance를 읽거나 변경할 권한이 있는지 검증하는 통제입니다.", ["인증과 다릅니다.", "ID를 추측하기 어렵게 하는 것으로 대체하지 않습니다."]),
      c("data minimization", "목적 수행에 필요한 최소한의 field와 보존 기간만 사용하는 원칙입니다.", ["DTO와 logs 모두 적용합니다.", "분류와 owner가 필요합니다."]),
      c("cache scope", "response가 private browser, shared proxy 또는 어떤 key dimensions 안에서 재사용 가능한지 정한 경계입니다.", ["authorization과 Vary를 봅니다.", "민감 응답은 no-store가 필요할 수 있습니다."]),
    ],
    diagnostics: [
      d("ID만 바꾸면 다른 사용자의 guest record가 조회됩니다.", "인증은 했지만 object-level authorization을 하지 않았습니다.", ["repository query에 owner/tenant predicate가 있는지 봅니다.", "policy decision을 추적합니다.", "negative ID tests를 실행합니다."], "resource lookup과 authorization을 같은 service boundary에서 enforce하고 existence leakage 정책을 정합니다.", "두 사용자/tenant 교차 접근 tests를 둡니다."),
      d("공유 proxy가 A 사용자의 JSON을 B에게 반환합니다.", "private response에 shared-cacheable directives 또는 불완전 cache key를 사용했습니다.", ["Age/Via/Cache-Control/Vary를 봅니다.", "Authorization/cookie keying을 확인합니다.", "CDN rule을 봅니다."], "민감 응답을 private/no-store로 제한하고 필요한 public cache는 안전한 key와 sanitized representation만 사용합니다.", "cross-user cache isolation test와 CDN config review를 둡니다."),
    ],
    expertNotes: ["에러 응답도 개인정보 최소화 대상이며 존재 여부 자체가 민감한 resource는 403/404 노출 정책을 일관되게 정합니다.", "CORS 허용 여부는 authorization 결과가 아닙니다. Boot04에서 browser origin policy와 credential/CSRF 경계를 분리합니다."],
  },
  {
    id: "contract-testing-openapi",
    title: "MockMvc·JSON assertions·OpenAPI·consumer tests로 계약을 실행 가능한 증거로 만듭니다",
    lead: "문서 예시 한 장은 정상 happy path만 보여 주므로 status/header/schema/security와 호환성 회귀를 자동 검사해야 합니다.",
    explanations: [
      "controller unit test는 mapping logic을 빠르게 검증하지만 serialization, advice, filters와 negotiation을 놓칩니다. MockMvc slice, full context와 deployed HTTP test를 위험에 따라 층으로 배치합니다.",
      "JSON 문자열 전체 비교는 field order/whitespace에 취약하고 forbidden field 누락을 놓칠 수 있습니다. structural assertions로 required/type/value와 금지 paths를 검사하고 selected golden samples는 의미 있는 canonical fixture로 관리합니다.",
      "OpenAPI 3.1은 paths, operations, parameters, responses와 JSON Schema를 machine-readable하게 기록합니다. annotation만 믿지 말고 generated document가 실제 response와 맞는지 schema validation과 diff로 확인합니다.",
      "contract tests에는 malformed JSON, wrong Content-Type/Accept, validation, unauthorized/forbidden, missing/conflict, dependency failure, unknown exception redaction, empty list와 version compatibility가 포함되어야 합니다.",
    ],
    concepts: [
      c("contract test", "provider와 consumer가 합의한 observable HTTP interaction을 자동 실행해 회귀를 탐지하는 테스트입니다.", ["implementation detail보다 wire를 검증합니다.", "positive와 negative cases가 필요합니다."]),
      c("schema validation", "JSON instance가 declared field/type/requiredness/constraints를 만족하는지 machine-readable schema로 판정합니다.", ["business semantics 전체를 보장하지 않습니다.", "runtime sample과 spec drift를 잡습니다."]),
      c("OpenAPI", "HTTP API operations와 request/response schemas를 기술하는 표준 description 형식입니다.", ["documentation와 code generation에 사용합니다.", "실제 behavior 대조가 필요합니다."]),
    ],
    diagnostics: [
      d("OpenAPI에는 404가 있지만 실제 endpoint는 200 failure body를 보냅니다.", "문서와 implementation을 독립적으로 수동 관리했습니다.", ["deployed response를 capture합니다.", "generated spec source를 확인합니다.", "contract tests가 spec을 쓰는지 봅니다."], "actual HTTP fixtures를 schema/status spec과 양방향 검증하고 diff를 release gate로 둡니다.", "spec-behavior conformance tests를 자동화합니다."),
      d("refactor 뒤 secret field가 JSON에 추가됐지만 tests가 통과합니다.", "happy-path expected fields만 검사하고 forbidden paths를 검사하지 않았습니다.", ["DTO와 ObjectMapper visibility를 봅니다.", "snapshot diff를 확인합니다.", "data classification list를 대조합니다."], "allowlisted response DTO와 forbidden-field assertions를 적용합니다.", "sensitive naming/custom canary serialization tests를 둡니다."),
    ],
    expertNotes: ["schema는 authorization, temporal semantics와 cross-resource invariants를 모두 표현하지 못하므로 별도 behavioral tests가 필요합니다.", "golden sample update를 자동 승인하지 말고 field/type/status change의 consumer 영향 설명을 요구합니다."],
  },
  {
    id: "observability-performance-release",
    title: "status·error code·latency·payload 크기를 관측하고 안전하게 점진 배포합니다",
    lead: "좋은 JSON 계약은 운영에서 결과 class를 집계하고 느린 serialization, 과대 payload와 consumer 오류를 역추적할 수 있어야 완성됩니다.",
    explanations: [
      "metrics는 route template, method, status class, stable error code와 latency를 사용하고 raw URI ID, message, user input을 label로 쓰지 않습니다. high-cardinality label은 비용과 개인정보 위험을 동시에 만듭니다.",
      "trace에는 controller/service/dependency spans와 correlation을 남기되 request/response body 전체를 기본 기록하지 않습니다. 필요하면 sampling, field allowlist, size limit, access control과 retention을 적용합니다.",
      "payload size, serialization time, query count와 allocation을 측정합니다. DTO projection, pagination, compression은 각각 CPU·latency·cache tradeoff가 있으며 압축만으로 unbounded collection을 정당화하지 않습니다.",
      "새 contract는 shadow/schema validation, canary와 version별 error rate를 보며 배포하고 rollback 시 N-1 server/client가 새·구 representations를 견디는지 확인합니다. deprecation은 usage evidence와 소비자 연락 경로를 갖습니다.",
    ],
    concepts: [
      c("low-cardinality dimension", "가능한 값 종류가 제한되어 metrics 집계 비용과 개인정보 위험을 통제할 수 있는 label입니다.", ["route template과 status class가 예입니다.", "raw ID/message는 피합니다."]),
      c("serialization budget", "response mapping과 JSON encoding에 허용한 latency, CPU, allocation과 bytes 한도입니다.", ["query budget과 구분해 측정합니다.", "percentile로 관찰합니다."]),
      c("canary contract rollout", "일부 traffic/consumer에 새 representation을 적용하고 conformance·error 지표를 확인한 뒤 확대하는 배포입니다.", ["rollback 기준을 미리 둡니다.", "version usage를 관찰합니다."]),
    ],
    diagnostics: [
      d("metrics backend 비용이 급증하고 dashboard가 느립니다.", "raw path, exception message나 user ID를 label로 사용했습니다.", ["label cardinality top values를 봅니다.", "route instrumentation을 확인합니다.", "PII classification을 대조합니다."], "route template/status/stable code만 label로 사용하고 상세 occurrence는 sampled trace/log로 이동합니다.", "telemetry schema review와 cardinality budget을 둡니다."),
      d("새 JSON 배포 뒤 구 client 오류율이 증가했지만 원인을 구분할 수 없습니다.", "client/API version dimension과 compatibility canary가 없습니다.", ["version별 status/parser errors를 봅니다.", "payload diff를 확인합니다.", "rollback compatibility를 재현합니다."], "consumer version별 canary와 schema/decoder tests를 적용하고 destructive change를 되돌립니다.", "N/N-1 client-server matrix와 automated abort threshold를 둡니다."),
    ],
    expertNotes: ["response body logging을 켜는 것은 빠른 진단처럼 보여도 credential·개인정보와 저장 비용을 크게 늘리므로 default-off가 안전합니다.", "latency만 줄이고 status/error taxonomy가 깨지면 운영 자동화 품질은 악화됩니다. protocol correctness와 performance를 함께 gate합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "source-guest-controller", repository: "nohssam springboot/MyProject01 학습 원본", path: "springboot\\MyProject01\\src\\main\\java\\com\\study\\myproject01\\guestbook\\controller\\GuestBookController.java", usedFor: ["@RestController", "DataVO returns", "always-200 risk", "e.getMessage exposure"], evidence: "2026-07-14 read-only audit에서 GET/POST handlers가 mutable DataVO를 반환하고 catch한 Exception message를 public message로 넣으며 ResponseEntity status mapping이 없음을 확인했습니다. SHA-256 8BD567E9DFFF88A42A2098B90A6E800350FC548A925E6C96D1587028D4422160." },
  { id: "source-data-vo", repository: "nohssam springboot/MyProject01 학습 원본", path: "springboot\\MyProject01\\src\\main\\java\\com\\study\\myproject01\\common\\vo\\DataVO.java", usedFor: ["mutable envelope", "boolean success", "String message", "Object data"], evidence: "2026-07-14 read-only audit에서 Lombok mutable fields success/message/Object data를 확인했습니다. SHA-256 0E2E920F6AA7B905D88793BBD33D9AE139B0BD7B421BFAC98F9C7F81BDBCDAC8." },
  { id: "spring-mvc-controller", repository: "Spring Framework Reference", path: "web/webmvc/mvc-controller.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html", usedFor: ["annotated controller pipeline", "handler methods", "MVC request processing"], evidence: "current official reference의 annotated controller model과 handler method processing을 확인했습니다." },
  { id: "spring-responsebody", repository: "Spring Framework Reference", path: "web/webmvc/mvc-controller/ann-methods/responsebody.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html", usedFor: ["@ResponseBody", "message conversion", "REST body"], evidence: "return value가 HttpMessageConverter를 통해 response body에 serialized되는 공식 계약을 확인했습니다." },
  { id: "spring-message-converters", repository: "Spring Framework Reference", path: "web/webmvc/message-converters.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html", usedFor: ["JSON conversion", "supported media types", "converter configuration"], evidence: "Spring MVC message converter abstraction과 JSON converter 경계를 확인했습니다." },
  { id: "spring-responseentity", repository: "Spring Framework Reference", path: "web/webmvc/mvc-controller/ann-methods/responseentity.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html", usedFor: ["status", "headers", "body", "ResponseEntity"], evidence: "handler가 status, headers와 body를 함께 제어하는 ResponseEntity 계약을 확인했습니다." },
  { id: "spring-rest-exceptions", repository: "Spring Framework Reference", path: "web/webmvc/mvc-ann-rest-exceptions.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["REST exception handling", "ProblemDetail", "ErrorResponse"], evidence: "REST API exception을 ProblemDetail/ErrorResponse로 렌더링하는 공식 MVC 지원을 확인했습니다." },
  { id: "spring-requestmapping", repository: "Spring Framework Reference", path: "web/webmvc/mvc-controller/ann-requestmapping.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", usedFor: ["methods", "consumes", "produces", "mapping conditions"], evidence: "HTTP method와 media type mapping conditions의 공식 동작을 확인했습니다." },
  { id: "spring-restcontroller-javadoc", repository: "Spring Framework Javadoc", path: "org/springframework/web/bind/annotation/RestController.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestController.html", usedFor: ["@Controller plus @ResponseBody semantics"], evidence: "@RestController의 composed annotation 의미를 current official API에서 확인했습니다." },
  { id: "spring-problemdetail", repository: "Spring Framework Javadoc", path: "org/springframework/http/ProblemDetail.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ProblemDetail.html", usedFor: ["ProblemDetail fields", "properties", "status"], evidence: "ProblemDetail API의 status, type, title, detail, instance와 properties 지원을 확인했습니다." },
  { id: "rfc8259", repository: "IETF RFC Editor", path: "rfc/rfc8259.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc8259.html", usedFor: ["JSON grammar", "object/array primitives", "UTF-8 interoperability", "number caveats"], evidence: "JSON data interchange syntax와 interoperability requirements를 RFC 원문에서 확인했습니다." },
  { id: "rfc9457", repository: "IETF RFC Editor", path: "rfc/rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["Problem Details", "application/problem+json", "problem members", "security considerations"], evidence: "HTTP API Problem Details의 current RFC 9457 members와 extension/security 경계를 확인했습니다." },
  { id: "rfc9110", repository: "IETF RFC Editor", path: "rfc/rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP semantics", "methods", "status codes", "content negotiation"], evidence: "HTTP method, status, representation과 negotiation semantics를 RFC 원문에서 확인했습니다." },
  { id: "openapi-311", repository: "OpenAPI Initiative", path: "oas/v3.1.1.html", publicUrl: "https://spec.openapis.org/oas/v3.1.1.html", usedFor: ["operation descriptions", "response schemas", "JSON Schema alignment", "compatibility evidence"], evidence: "OpenAPI 3.1.1 specification의 paths, operations, media types와 schema description 구조를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "boot-03-rest-json-contract", slug: "boot-03-rest-json-contract", courseId: "spring", moduleId: "spring-boot-rest-integration", order: 3,
  title: "REST Controller와 JSON 직렬화 계약",
  subtitle: "Object·항상 200·예외 메시지 노출을 typed DTO, HTTP semantics, RFC 9457와 호환성 증거로 교정합니다",
  level: "중급", estimatedMinutes: 90,
  coreQuestion: "Spring MVC가 Java 값을 JSON으로 쓰는 편리함을 유지하면서 status, media type, schema, 오류, 보안과 버전 호환성을 어떻게 하나의 실행 가능한 wire contract로 만들까요?",
  summary: "GuestBookController와 DataVO 두 원본을 read-only로 감사합니다. 원본의 boolean success/String message/Object data envelope, 모든 Exception catch, e.getMessage public 노출과 ResponseEntity 부재로 인한 always-200 위험을 정확히 드러냅니다. 이어 @RestController→return value handler→HttpMessageConverter pipeline, resource DTO와 generic T, HTTP status/method semantics, JSON primitive·null·time 계약, request allowlist/validation, Content-Type·Accept negotiation, RFC 9457 Problem Details, 단건·빈 collection·pagination, additive versioning, authorization/privacy/cache, OpenAPI/contract tests와 운영 관측·canary까지 확장합니다. 여섯 JDK 21 exact examples는 typed envelope, status mapping, wire type, media negotiation, safe problem mapping과 V1/V2 projection을 실행하며 실제 Spring/Jackson 통합 범위를 분명히 구분합니다.",
  objectives: ["원본 Controller/DataVO의 wire contract와 정보 노출 위험을 source evidence로 설명한다.", "@RestController와 HttpMessageConverter의 JSON serialization pipeline을 추적한다.", "Object data를 resource DTO 또는 generic typed envelope로 교체하고 모순 상태를 제거한다.", "업무 결과를 HTTP status, headers와 method semantics에 일관되게 매핑한다.", "JSON field/type/null/time과 request binding/validation 계약을 schema로 고정한다.", "Content-Type·Accept·406·415와 application/problem+json을 정확히 구분한다.", "예외 문자열을 노출하지 않는 RFC 9457 error taxonomy를 구현한다.", "OpenAPI, provider/consumer tests, telemetry와 canary로 호환성을 증명한다."],
  prerequisites: [{ title: "application.yaml·환경변수·profile 설정 분리", reason: "ObjectMapper, error exposure와 runtime behavior도 environment configuration에 의해 달라질 수 있으므로 effective config와 secret 경계를 알아야 합니다.", sessionSlug: "boot-02-application-yaml-profiles" }],
  keywords: ["@RestController", "@ResponseBody", "HttpMessageConverter", "Jackson", "JSON contract", "DTO", "ResponseEntity", "HTTP status", "content negotiation", "Content-Type", "Accept", "ProblemDetail", "RFC 9457", "validation", "OpenAPI", "backward compatibility", "data minimization"],
  topics,
  lab: {
    title: "DataVO 기반 guestbook API를 typed HTTP·JSON contract로 안전하게 이관하기",
    scenario: "원본을 변경하지 않는 격리 fixture에서 기존 observable behavior를 고정한 뒤 response/request DTO, status, problem, schema와 compatibility rollout을 구현합니다.",
    setup: ["JDK 21", "원본과 호환되는 Spring Boot/Gradle Wrapper", "MockMvc 또는 실제 loopback HTTP fixture", "synthetic guest records", "real DB·credential·개인정보 접근 금지", "원본 두 파일 read-only"],
    steps: ["원본 두 파일 hash와 handler/field/catch evidence를 기록하고 source를 변경하지 않습니다.", "GET list/detail과 POST create의 current status/body/media samples를 synthetic service로 capture합니다.", "resource별 immutable request/response DTO와 allowed/forbidden fields를 정의합니다.", "Object envelope를 제거하거나 ApiResponse<T>로 구체화하고 invalid success-code-data 조합을 차단합니다.", "found/created/empty/missing/invalid/conflict/dependency/unknown 결과의 status/header/body table을 작성합니다.", "Content-Type/Accept와 consumes/produces의 positive·406·415 matrix를 실행합니다.", "binding/validation/domain/unknown errors를 RFC 9457 problem types와 safe field errors로 변환합니다.", "e.getMessage, stack, SQL, host, secret과 raw rejected values가 response/log fixture에 없는지 canary scan합니다.", "OpenAPI 3.1 schema와 actual JSON instances, forbidden paths 및 V1 consumer decoder를 검증합니다.", "status×error-code latency/size metrics로 canary하고 N-1 rollback compatibility를 rehearsal합니다."],
    expectedResult: ["성공과 실패가 HTTP status, Content-Type과 typed body에서 일치합니다.", "data payload는 concrete schema를 가지며 Object cast와 모순 상태가 없습니다.", "unknown exception의 내부 message와 sensitive fields가 public body에 나타나지 않습니다.", "empty collection, missing item, validation과 conflict가 서로 다른 tested contract를 가집니다.", "구 consumer fixture가 additive rollout과 rollback 동안 계속 동작합니다."],
    cleanup: ["synthetic records, disposable context와 captured bodies를 제거합니다.", "temporary verbose logging/body capture를 원복하고 sanitized conformance report만 보존합니다.", "local OpenAPI/client build artifacts를 제거합니다.", "원본 두 파일의 hash/status가 unchanged인지 readback합니다."],
    extensions: ["ETag/If-Match optimistic concurrency를 추가합니다.", "consumer-driven contract broker와 deprecation usage dashboard를 연결합니다.", "JSON Schema fuzzing으로 depth/size/type/unknown-field limits를 검증합니다.", "CORS와 credentialed React client 통합을 다음 Boot04 lab으로 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행하고 각 model을 실제 Spring MVC/MockMvc assertion으로 번역하세요.", requirements: ["exact stdout을 모두 확인합니다.", "typed envelope invariant를 설명합니다.", "결과별 status를 raw response에서 확인합니다.", "string ID와 absent/null fixtures를 추가합니다.", "406/415를 각각 재현합니다.", "unknown exception message가 leak되지 않음을 검사합니다.", "V1 consumer compatibility를 실행합니다."], hints: ["method return 객체만 보지 말고 status line, headers와 raw JSON을 함께 보세요."], expectedOutcome: "Java type부터 HTTP bytes와 consumer decode까지 한 계약으로 검증합니다.", solutionOutline: ["type→status→wire type→negotiation→problem→version 순서로 evidence를 연결합니다."] },
    { difficulty: "응용", prompt: "원본 guestbook endpoints의 migration-ready contract와 implementation patch plan을 작성하세요.", requirements: ["현재 DataVO behavior를 characterization test로 고정합니다.", "request/response DTO를 endpoint별로 정의합니다.", "Object와 mutable setters를 제거합니다.", "status/error mapping table을 둡니다.", "RFC 9457 field errors와 redaction을 설계합니다.", "authorization/privacy/cache policy를 둡니다.", "OpenAPI diff와 consumer migration을 포함합니다.", "canary/rollback 기준을 정의합니다."], hints: ["기존 client를 즉시 깨지 말고 adapter와 expand-and-contract 기간을 설계하세요."], expectedOutcome: "보안과 호환성을 동시에 유지하는 단계별 REST contract migration이 완성됩니다.", solutionOutline: ["characterize→model→map→test→dual serve→observe→remove 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 Spring REST·JSON contract 표준을 설계하세요.", requirements: ["URI/method/status/header conventions를 정합니다.", "DTO/field/type/null/time rules를 정합니다.", "content negotiation과 supported media types를 정합니다.", "validation/problem taxonomy와 safe error rules를 정합니다.", "authorization/data minimization/cache를 포함합니다.", "OpenAPI/consumer/schema tests를 gate로 둡니다.", "version/deprecation/sunset과 N-1 compatibility를 정합니다.", "metrics/traces/cardinality/body retention을 정합니다."], hints: ["style guide가 아니라 개발·배포·사고 복구까지 실행 가능한 표준을 만드세요."], expectedOutcome: "API 계약의 설계부터 폐기까지 감사 가능한 governance가 완성됩니다.", solutionOutline: ["model→protocol→schema→security→verify→rollout→observe→retire 순서입니다."] },
  ],
  nextSessions: ["boot-04-cors-client-server"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["원본 GuestBookController와 DataVO는 read-only로 감사했고 실제 DB 또는 개인정보를 실행·복사하지 않았습니다.", "원본의 Object data, mutable success/message, catch Exception, e.getMessage와 ResponseEntity 부재는 source evidence이며 modern DTO/status/problem/version 설계는 current Spring, IETF와 OpenAPI 공식 자료로 보강했습니다.", "JDK examples는 HTTP/Jackson framework 없이 계약 규칙을 deterministic하게 설명하므로 실제 annotation binding, converter order, ObjectMapper modules, filters와 security는 MockMvc/deployed tests가 필요합니다.", "RFC와 Spring current documentation은 target production Spring Boot/Framework version, organization privacy policy와 supported consumer matrix에 다시 고정해야 합니다."] },
});

export default session;
