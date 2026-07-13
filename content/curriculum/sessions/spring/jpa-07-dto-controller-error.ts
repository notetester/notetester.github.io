import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lines = code.split("\n").length;
  const first = Math.max(1, Math.floor(lines / 3));
  const second = Math.max(first + 1, Math.floor((lines * 2) / 3));
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "JDK 21 records·enums·collections로 request/response DTO와 HTTP·error·concurrency 계약을 framework 없이 모델링합니다." },
      { lines: `${first + 1}-${second}`, explanation: "field allow-list, validation, status/header, negotiation, links, version/idempotency 또는 redaction 규칙을 결정적으로 적용합니다." },
      { lines: `${second + 1}-${lines}`, explanation: "actual entity/user/error/credential 값을 출력하지 않고 stable public outcome만 exact stdout으로 증명합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/Jackson/JPA/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 제시된 결과와 완전히 같아야 합니다.", "JDK-only model은 MockMvc/Jackson/Bean Validation/JPA transaction과 deployed HTTP behavior를 대신하지 않습니다."] },
    experiments: [
      { change: "DTO fields, invalid command, result state, media type, page, version 또는 duplicate operation을 바꿉니다.", prediction: "allow-listed representation과 stable status/problem/concurrency outcome이 규칙에 따라 달라집니다.", result: "exact output과 MockMvc/schema/integration evidence를 비교합니다." },
      { change: "같은 계약을 Spring MVC+Jackson+JPA disposable integration test로 실행합니다.", prediction: "status, headers, content type, JSON fields, exception translation과 transaction outcome이 실제 wire evidence로 나타납니다.", result: "응답 bytes와 database state를 함께 검증하되 actual values와 exception text는 저장하지 않습니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "controller-datavo-source-audit",
    title: "원본 Controller·DataVO를 HTTP·serialization·persistence 경계별로 감사합니다",
    lead: "boolean success가 있다는 이유만으로 transport status, JSON shape와 오류 노출이 안전해지는 것은 아닙니다.",
    explanations: [
      "원본 GeustBookController는 /guestbook 아래 list/list2/detail/detail2 GET handlers 네 개를 두고 field-injected service를 호출합니다. list는 List<GuestBook>, detail은 GuestBook entity를 mutable DataVO의 Object data에 직접 넣습니다.",
      "모든 handler는 broad Exception을 catch해 false와 e.getMessage를 message에 넣고 DataVO를 정상 return합니다. ResponseEntity나 exception handler가 없으므로 framework는 body가 실패를 표현해도 일반적으로 HTTP 200으로 직렬화합니다.",
      "빈 목록과 없는 단건 모두 success=true/message로 표현하지만 collection empty와 resource not found의 HTTP 의미가 구분되지 않습니다. idx request parameter에는 type conversion 외 명시적 range/domain validation과 authorization evidence가 없습니다.",
      "DataVO는 Boolean success, String message, Object data의 Lombok mutable container입니다. endpoint마다 runtime data shape가 달라 compiler/schema/consumer가 구체 type과 impossible state를 막지 못합니다.",
    ],
    concepts: [
      c("wire contract", "client가 관찰하는 method, URI, status, headers, media type와 serialized fields의 전체 규약입니다.", ["Java return type보다 넓습니다.", "테스트로 고정합니다."]),
      c("always-200 failure", "업무·서버 실패를 body flag로만 표현해 HTTP status가 성공으로 남는 anti-pattern입니다.", ["proxy/monitoring이 오판합니다.", "typed exception mapping이 필요합니다."]),
      c("heterogeneous envelope", "Object처럼 endpoint마다 다른 runtime payload를 담아 compile/schema 정보가 사라진 response wrapper입니다.", ["consumer 분기가 늘어납니다.", "concrete DTO로 교정합니다."]),
    ],
    diagnostics: [d("DB 오류인데 APM은 200 success로 집계하고 public body에 provider message가 보입니다.", "controller가 모든 Exception을 catch해 mutable DataVO로 정상 반환했습니다.", ["actual HTTP status", "controller return type", "catch blocks", "public message", "content type/schema"], "성공 DTO는 정상 path에서 반환하고 typed exception을 global ProblemDetail handler가 status와 safe code로 변환하게 합니다.", "status/body/media/error-redaction characterization tests를 migration 전후에 둡니다.")],
    expertNotes: ["원본 typo와 mutable pattern은 provenance로 기록하지만 새로운 public contract에 복제하지 않습니다.", "source file 안의 실제 entity/domain values나 runtime exception·database configuration은 사용하지 않습니다."],
  },
  {
    id: "entity-response-dto-allowlist",
    title: "Entity를 serialization 대상이 아니라 persistence 내부 model로 두고 response DTO를 allow-list합니다",
    lead: "현재 필요한 field만 우연히 보인다고 Entity 직접 반환이 안전한 것은 아니며 mapping 변화가 곧 API 변화가 됩니다.",
    explanations: [
      "Entity는 lazy association, provider proxy, lifecycle/version, internal flags와 sensitive fields를 가질 수 있습니다. Jackson이 getter를 따라가면 N+1, LazyInitializationException, 순환 참조 또는 의도하지 않은 property 노출이 생깁니다.",
      "GuestBookSummaryResponse, GuestBookDetailResponse처럼 use case별 immutable record/class를 정의하고 explicit mapper에서 허용 field만 복사합니다. 목록/상세/관리자 DTO를 분리하고 entity annotation/Jackson ignore에 public policy를 맡기지 않습니다.",
      "repository DTO/interface projection으로 select columns를 줄일 수 있지만 authorization과 wire DTO version은 별도 application/controller 경계가 소유합니다. internal cursor/version key가 필요해도 public JSON에 자동 포함하지 않습니다.",
      "response schema는 field name/type/nullability/time format과 additive evolution을 명시합니다. entity rename, relationship과 database migration이 consumer를 즉시 깨뜨리지 않도록 adapter와 contract tests를 둡니다.",
    ],
    concepts: [
      c("response DTO", "특정 endpoint가 공개하기로 승인한 immutable representation type입니다.", ["entity와 분리합니다.", "구체 schema를 가집니다."]),
      c("field allow-list", "직렬화 가능한 모든 field가 아니라 목적·권한에 필요한 fields만 명시적으로 선택하는 정책입니다.", ["민감정보를 줄입니다.", "role/use case별입니다."]),
      c("entity exposure", "persistence entity와 그 graph가 public serializer에 직접 전달되는 경계 위반입니다.", ["lazy/proxy 위험이 있습니다.", "mapping 변화가 API 변화가 됩니다."]),
    ],
    codeExamples: [java("jpa07-dto-allowlist", "내부 entity-like row를 최소 response DTO로 매핑", "Jpa07DtoAllowlist.java", "sensitive fixture가 있는 내부 object에서 public id, author label과 subject만 response record로 복사합니다.", String.raw`public class Jpa07DtoAllowlist {
  record InternalEntity(long idx, String author, String subject,
                        String sensitiveVerifier, String internalFlag) {}
  record GuestBookResponse(long id, String authorLabel, String subject) {}
  static GuestBookResponse toResponse(InternalEntity entity) {
    return new GuestBookResponse(entity.idx(), entity.author(), entity.subject());
  }
  public static void main(String[] args) {
    InternalEntity entity = new InternalEntity(7, "AUTHOR_FIXTURE", "SUBJECT_FIXTURE",
      "SENSITIVE_FIXTURE", "INTERNAL_FIXTURE");
    GuestBookResponse response = toResponse(entity);
    System.out.println("response=" + response);
    System.out.println("fields=[id, authorLabel, subject]");
    System.out.println("sensitive-verifier-exposed=false");
    System.out.println("internal-flag-exposed=false");
    System.out.println("entity-returned=false");
  }
}`, "response=GuestBookResponse[id=7, authorLabel=AUTHOR_FIXTURE, subject=SUBJECT_FIXTURE]\nfields=[id, authorLabel, subject]\nsensitive-verifier-exposed=false\ninternal-flag-exposed=false\nentity-returned=false", ["local-guestbook-controller", "local-data-vo", "spring-data-jpa-projections", "spring-message-converters", "owasp-api3-property", "owasp-mass-assignment"])],
    diagnostics: [d("entity에 field/association을 추가했더니 JSON schema와 query 수가 몰래 바뀝니다.", "controller가 Entity/Object envelope를 serializer에 직접 넘겼습니다.", ["declared return type", "actual JSON fields", "Hibernate proxy/lazy query", "role-based fields", "OpenAPI diff"], "endpoint별 response DTO와 explicit mapper/projection allow-list를 사용합니다.", "exact field-set, zero-sensitive-canary, query-count와 schema compatibility tests를 둡니다.")],
    expertNotes: ["DTO는 단순 복사 비용보다 persistence와 public lifecycle을 분리하는 compatibility/security boundary입니다.", "serializer ignore annotation은 defense in depth일 뿐 endpoint별 authorization·allow-list를 대신하지 않습니다."],
  },
  {
    id: "request-command-binding-validation",
    title: "request DTO·Bean Validation·domain validation을 분리하고 rejected value를 노출하지 않습니다",
    lead: "Entity를 request body에 직접 bind하면 client가 internal state·ownership·version을 mass assignment할 수 있습니다.",
    explanations: [
      "CreateGuestBookRequest와 UpdateGuestBookRequest를 분리해 client가 쓸 수 있는 fields만 선언합니다. identifier, active/internal flags, audit/version과 ownership은 path/authenticated context/server policy에서 가져오고 body 값을 신뢰하지 않습니다.",
      "@RequestBody @Valid는 shape/null/size/pattern 같은 syntactic constraints를 검사하고 service/domain은 authorization, uniqueness, state transition과 cross-resource rules를 검증합니다. validation group 남용보다 command type 분리를 우선합니다.",
      "malformed JSON/media type, binding/type mismatch, MethodArgumentNotValidException과 method parameter validation의 HandlerMethodValidationException을 같은 stable problem taxonomy로 정규화하되 원인은 내부에서 구분합니다.",
      "field error에는 public field와 stable code, 필요한 경우 localized safe message만 넣고 rejected password/content/raw value는 넣지 않습니다. errors order와 duplicate constraint collapse를 결정해 consumer가 안정적으로 처리하게 합니다.",
    ],
    concepts: [
      c("request command DTO", "한 write use case에서 client가 제공할 수 있는 input만 표현한 type입니다.", ["entity와 분리합니다.", "create/update가 다를 수 있습니다."]),
      c("syntactic validation", "null, size, format처럼 domain lookup 없이 request shape를 검사하는 단계입니다.", ["Bean Validation이 돕습니다.", "domain rule과 구분합니다."]),
      c("mass assignment", "client input이 internal object의 의도하지 않은 properties까지 자동 설정하는 취약 경계입니다.", ["allow-listed DTO로 막습니다.", "authorization도 필요합니다."]),
    ],
    codeExamples: [java("jpa07-validation-problem", "검증 오류를 stable field code로 정규화", "Jpa07ValidationProblem.java", "blank subject와 oversized content를 raw rejected value 없이 정렬된 field error problem으로 변환합니다.", String.raw`import java.util.*;

public class Jpa07ValidationProblem {
  record Command(String subject, String content) {}
  record FieldError(String field, String code) {}
  record Problem(int status, String type, String code, List<FieldError> errors) {}
  static Problem validate(Command command) {
    List<FieldError> errors = new ArrayList<>();
    if (command.subject() == null || command.subject().isBlank())
      errors.add(new FieldError("subject", "required"));
    if (command.content() != null && command.content().length() > 20)
      errors.add(new FieldError("content", "size"));
    errors.sort(Comparator.comparing(FieldError::field));
    return new Problem(400, "/problems/validation", "VALIDATION_FAILED", List.copyOf(errors));
  }
  public static void main(String[] args) {
    Problem problem = validate(new Command(" ", "X".repeat(21)));
    System.out.println("status=" + problem.status());
    System.out.println("type=" + problem.type());
    System.out.println("code=" + problem.code());
    System.out.println("errors=" + problem.errors());
    System.out.println("rejected-values-exposed=false");
  }
}`, "status=400\ntype=/problems/validation\ncode=VALIDATION_FAILED\nerrors=[FieldError[field=content, code=size], FieldError[field=subject, code=required]]\nrejected-values-exposed=false", ["spring-requestbody", "spring-mvc-validation", "jakarta-validation-31", "spring-error-responses", "rfc9457"])],
    diagnostics: [d("client가 active/version/internal field를 바꾸거나 validation problem에 전체 request value가 노출됩니다.", "Entity binding과 default error serialization을 public contract로 사용했습니다.", ["request DTO fields", "binding targets", "constraint exceptions", "rejected values", "domain authorization"], "use case별 command DTO와 validation/domain rule layers, safe field error mapper를 둡니다.", "unknown/internal field, malformed/type/null/size/cross-rule와 sensitive rejected-value tests를 둡니다.")],
    expertNotes: ["Bean Validation 통과는 object authorization이나 현재 domain state가 유효하다는 뜻이 아닙니다.", "message localization을 하더라도 machine consumer는 stable code/type을 기준으로 처리하게 합니다."],
  },
  {
    id: "success-status-method-header-contract",
    title: "성공·빈 목록·없는 단건·생성·삭제를 HTTP status와 headers로 정확히 표현합니다",
    lead: "모든 결과를 200+message로 감싸면 cache, retry, monitoring과 generic client가 의미를 알 수 없습니다.",
    explanations: [
      "collection 조회가 성공했고 결과가 없으면 보통 200과 빈 array/content를 반환합니다. 특정 identifier 단건이 없으면 404 problem으로 구분합니다. transport success와 business message flag를 이중 source-of-truth로 만들지 않습니다.",
      "생성 성공은 201 Created와 새 resource의 Location을 제공하고 response body 제공 여부를 contract로 정합니다. 삭제 성공에 body가 없으면 204 No Content를 사용하고 실제 body/content type을 보내지 않습니다.",
      "400은 malformed/validation request, 403은 권한 거부, 404는 존재를 공개해도 되는 missing resource, 409는 현재 state conflict, 412는 client precondition 실패, 5xx는 server/dependency failure로 taxonomy를 정의합니다.",
      "GET/PUT/DELETE의 standardized semantics와 안전성/idempotency를 지키고 write를 convenience 때문에 GET에 두지 않습니다. cache headers, ETag와 Location은 body message가 아니라 protocol metadata로 테스트합니다.",
    ],
    concepts: [
      c("status semantics", "HTTP response status가 request 처리 결과와 실패 종류를 protocol 수준에서 표현하는 규칙입니다.", ["body flag를 대신합니다.", "cache/retry에 영향 줍니다."]),
      c("Location header", "생성된 resource를 식별하는 URI reference를 201 response에 제공하는 header입니다.", ["authorization을 대체하지 않습니다.", "URI를 안전하게 만듭니다."]),
      c("empty collection", "collection resource는 존재하지만 현재 items가 0개인 정상 representation입니다.", ["보통 200+[]입니다.", "단건 404와 다릅니다."]),
    ],
    codeExamples: [java("jpa07-http-outcome", "업무 outcome을 status·Location·body로 매핑", "Jpa07HttpOutcome.java", "created, found, empty list, missing과 deleted를 서로 다른 protocol outcome으로 변환합니다.", String.raw`public class Jpa07HttpOutcome {
  enum Outcome { CREATED, FOUND, EMPTY_LIST, MISSING, DELETED }
  record Response(int status, String location, String body) {}
  static Response map(Outcome outcome) {
    return switch (outcome) {
      case CREATED -> new Response(201, "/guestbook/resource-7", "resource");
      case FOUND -> new Response(200, "none", "resource");
      case EMPTY_LIST -> new Response(200, "none", "[]");
      case MISSING -> new Response(404, "none", "problem");
      case DELETED -> new Response(204, "none", "none");
    };
  }
  public static void main(String[] args) {
    System.out.println("created=" + map(Outcome.CREATED));
    System.out.println("found=" + map(Outcome.FOUND));
    System.out.println("empty=" + map(Outcome.EMPTY_LIST));
    System.out.println("missing=" + map(Outcome.MISSING));
    System.out.println("deleted=" + map(Outcome.DELETED));
  }
}`, "created=Response[status=201, location=/guestbook/resource-7, body=resource]\nfound=Response[status=200, location=none, body=resource]\nempty=Response[status=200, location=none, body=[]]\nmissing=Response[status=404, location=none, body=problem]\ndeleted=Response[status=204, location=none, body=none]", ["spring-responsebody", "spring-responseentity", "rfc9110"])],
    diagnostics: [d("빈 목록이 404가 되거나 create/delete가 모두 200 message로만 구분됩니다.", "resource/collection와 HTTP method/status/header semantics를 mapping table로 정의하지 않았습니다.", ["request method", "resource cardinality", "actual status", "Location/body", "cache/retry behavior"], "use case outcome→status/headers/body 표를 만들고 ResponseEntity 또는 equivalent return으로 구현합니다.", "success/empty/missing/create/delete/conflict/dependency exact wire tests를 둡니다.")],
    expertNotes: ["404를 authorization 정보 은닉에 사용할지는 security policy가 결정하며 endpoint 전체에서 일관돼야 합니다.", "204 response에는 body를 넣지 않고 client contract가 representation을 필요로 하면 200을 선택합니다."],
  },
  {
    id: "problem-detail-error-taxonomy-redaction",
    title: "RFC 9457 ProblemDetail과 stable error taxonomy로 내부 exception을 redaction합니다",
    lead: "e.getMessage는 SQL, field values, provider class와 infrastructure detail을 public API로 고정하고 노출할 수 있습니다.",
    explanations: [
      "ProblemDetail의 type, title, status, detail, instance를 일관되게 사용하고 application/problem+json을 반환합니다. type은 consumer가 의미를 식별하는 stable URI이고 detail은 해당 occurrence를 설명하되 민감 내부 원인을 포함하지 않습니다.",
      "validation, not found, forbidden, conflict/precondition, rate/resource, dependency unavailable와 unexpected failure를 typed application exceptions로 분류합니다. @ControllerAdvice/ResponseEntityExceptionHandler가 한 곳에서 headers, body와 localization을 매핑합니다.",
      "exception class/message, SQL, stack, database URL, entity dump와 request body를 problem extensions에 넣지 않습니다. opaque correlation id를 내부 restricted logs와 public safe extension에 연결하고 raw values 없이 root cause를 추적합니다.",
      "catch-all은 최종 500 safety net에만 두고 programming errors를 success로 바꾸지 않습니다. 로그 실패와 handler 실패에서도 double response·recursive exception이 생기지 않도록 minimal fallback을 검증합니다.",
    ],
    concepts: [
      c("ProblemDetail", "HTTP API 오류를 type/title/status/detail/instance와 extensions로 표현하는 RFC 9457 representation입니다.", ["application/problem+json을 씁니다.", "새 error format 남발을 줄입니다."]),
      c("error taxonomy", "내부 다양한 원인을 consumer가 처리할 stable public categories/status로 매핑한 체계입니다.", ["exception message와 분리합니다.", "호환성을 관리합니다."]),
      c("correlation identifier", "public problem과 restricted internal trace를 raw payload 없이 연결하는 opaque 값입니다.", ["secret이 아닙니다.", "cardinality/retention을 통제합니다."]),
    ],
    codeExamples: [java("jpa07-error-redaction", "내부 실패를 stable public problem으로 변환", "Jpa07ErrorRedaction.java", "validation/not-found/optimistic/dependency 원인을 fixed public type/status/code로 바꾸고 internal message가 노출되지 않음을 확인합니다.", String.raw`public class Jpa07ErrorRedaction {
  enum Kind { VALIDATION, NOT_FOUND, OPTIMISTIC, DEPENDENCY }
  record Problem(int status, String type, String code) {}
  static Problem map(Kind kind) {
    return switch (kind) {
      case VALIDATION -> new Problem(400, "/problems/validation", "VALIDATION_FAILED");
      case NOT_FOUND -> new Problem(404, "/problems/not-found", "RESOURCE_NOT_FOUND");
      case OPTIMISTIC -> new Problem(409, "/problems/conflict", "CONCURRENT_MODIFICATION");
      case DEPENDENCY -> new Problem(503, "/problems/dependency", "DEPENDENCY_UNAVAILABLE");
    };
  }
  public static void main(String[] args) {
    String internalMessage = "INTERNAL_FIXTURE_ONLY";
    System.out.println("validation=" + map(Kind.VALIDATION));
    System.out.println("not-found=" + map(Kind.NOT_FOUND));
    System.out.println("optimistic=" + map(Kind.OPTIMISTIC));
    System.out.println("dependency=" + map(Kind.DEPENDENCY));
    System.out.println("internal-message-exposed=" + map(Kind.DEPENDENCY).toString().contains(internalMessage));
  }
}`, "validation=Problem[status=400, type=/problems/validation, code=VALIDATION_FAILED]\nnot-found=Problem[status=404, type=/problems/not-found, code=RESOURCE_NOT_FOUND]\noptimistic=Problem[status=409, type=/problems/conflict, code=CONCURRENT_MODIFICATION]\ndependency=Problem[status=503, type=/problems/dependency, code=DEPENDENCY_UNAVAILABLE]\ninternal-message-exposed=false", ["local-guestbook-controller", "local-data-vo", "spring-error-responses", "rfc9457", "spring-mockmvc"])],
    diagnostics: [d("problem body에 SQL/exception class가 보이거나 같은 오류가 endpoint마다 다른 shape입니다.", "local try/catch와 exception message를 response schema로 사용했습니다.", ["ControllerAdvice order", "problem type/status", "extensions", "logs/APM", "fallback handler"], "typed exceptions와 centralized RFC 9457 mapper, allow-listed fields/correlation을 적용합니다.", "모든 error class의 exact status/media/schema/redaction과 handler-failure tests를 둡니다.")],
    expertNotes: ["ProblemDetail은 status를 올바르게 고르는 일을 자동화하지 않으므로 taxonomy review가 필요합니다.", "instance URI와 correlation도 tenant/resource 정보를 과도하게 드러내지 않도록 정책을 둡니다."],
  },
  {
    id: "content-negotiation-media-contract",
    title: "Content-Type·Accept·produces·consumes와 406/415를 endpoint 계약으로 검증합니다",
    lead: "JSON을 주고받는다는 말만으로 request representation과 response preference가 구분되지 않습니다.",
    explanations: [
      "Content-Type은 request body의 media type이고 Accept는 client가 받을 수 있는 response types입니다. JSON body endpoint는 supported consumes와 produces를 명시하고 unsupported request는 415, acceptable response가 없으면 406으로 처리합니다.",
      "성공 DTO는 application/json, ProblemDetail은 content negotiation에서 application/problem+json이 선호됩니다. charset, empty body, malformed JSON과 no Accept/default behavior를 characterization하고 문서화합니다.",
      "format을 query parameter나 path extension으로 임의 전환하지 않고 supported negotiation strategy를 고정합니다. versioning이 필요하면 compatible additive schema 또는 explicit vendor media/version path를 migration policy와 함께 선택합니다.",
      "String을 반환했을 때 text/plain 또는 converter selection이 예상과 달라질 수 있으므로 declared return type, configured HttpMessageConverters와 actual Content-Type/bytes를 MockMvc에서 검사합니다.",
    ],
    concepts: [
      c("Content-Type", "현재 request/response content의 media type을 나타내는 header입니다.", ["request body 해석에 사용합니다.", "Accept와 다릅니다."]),
      c("Accept", "client가 response로 처리 가능한 media type 범위를 표현하는 request header입니다.", ["협상에 사용합니다.", "불가능하면 406입니다."]),
      c("HttpMessageConverter", "Java object와 HTTP content를 media type에 따라 읽고 쓰는 Spring MVC component입니다.", ["선택 순서를 검증합니다.", "DTO schema와 연결됩니다."]),
    ],
    codeExamples: [java("jpa07-media-negotiation", "request/response media type 결과 분류", "Jpa07MediaNegotiation.java", "JSON endpoint에서 valid JSON, unsupported Content-Type과 unacceptable Accept를 200/415/406으로 구분합니다.", String.raw`public class Jpa07MediaNegotiation {
  record Request(String contentType, String accept) {}
  static int status(Request request) {
    if (!request.contentType().equals("application/json")) return 415;
    if (request.accept().equals("application/json") || request.accept().equals("*/*")) return 200;
    return 406;
  }
  public static void main(String[] args) {
    System.out.println("json=" + status(new Request("application/json", "application/json")));
    System.out.println("wildcard=" + status(new Request("application/json", "*/*")));
    System.out.println("unsupported-content=" + status(new Request("text/plain", "application/json")));
    System.out.println("unacceptable=" + status(new Request("application/json", "application/xml")));
    System.out.println("problem-media=application/problem+json");
  }
}`, "json=200\nwildcard=200\nunsupported-content=415\nunacceptable=406\nproblem-media=application/problem+json", ["spring-requestmapping", "spring-message-converters", "spring-error-responses", "rfc9110"])],
    diagnostics: [d("client는 JSON을 기대하지만 text/plain/HTML error가 오거나 unsupported body가 controller까지 들어옵니다.", "consumes/produces와 converter/exception contract를 검증하지 않았습니다.", ["request Content-Type", "Accept", "handler mapping", "selected converter", "actual response media"], "supported media types를 명시하고 success/problem response의 406/415 mapping을 centralized test합니다.", "missing/wildcard/vendor/unsupported/malformed media matrix와 byte-level assertions를 둡니다.")],
    expertNotes: ["Accept가 없거나 */*일 때의 default도 API documentation과 test로 고정합니다.", "content negotiation은 authorization보다 먼저/나중 어느 단계에서 실패하는지 정보 노출 정책과 함께 봅니다."],
  },
  {
    id: "collection-pagination-links-metadata",
    title: "목록 DTO에 bounded pagination metadata와 표준 Link 관계를 제공합니다",
    lead: "Entity Page를 그대로 JSON으로 직렬화하면 framework 내부 shape와 count 비용이 public API에 우연히 고정됩니다.",
    explanations: [
      "collection response는 items와 page/size/hasNext 또는 total metadata를 application-owned DTO로 매핑합니다. Page 내부 구현 JSON shape를 그대로 공개하지 않고 JPA06에서 선택한 Page/Slice/Window semantics를 분명히 합니다.",
      "prev, self, next와 first/last가 의미 있을 때 RFC 8288 Link relation 또는 Spring HATEOAS representation을 사용합니다. filter/sort를 안전하게 보존하고 base URL/proxy headers를 trusted configuration으로 생성합니다.",
      "page size와 sort allow-list를 동일하게 적용하고 cursor/token을 logs/referrer에 원문으로 남기지 않습니다. Link에 sensitive query, internal field나 untrusted host를 포함하지 않습니다.",
      "empty collection도 items=[]와 일관된 metadata/self link를 가진 200 response입니다. total이 없는 Slice/Window에 가짜 totalPages를 만들지 않고 hasNext/nextCursor만 제공합니다.",
    ],
    concepts: [
      c("pagination representation", "items와 page/size/total 또는 hasNext/cursor를 application schema로 표현한 DTO입니다.", ["framework Page와 분리합니다.", "mode별 metadata가 다릅니다."]),
      c("Link relation", "target URI가 current resource와 prev/next/self 같은 어떤 관계인지 표현하는 standardized metadata입니다.", ["RFC 8288을 따릅니다.", "URI를 안전하게 만듭니다."]),
      c("trusted base URI", "proxy/host spoofing 없이 server가 public links를 생성할 때 신뢰하는 scheme/host/prefix 설정입니다.", ["forwarded headers를 제한합니다.", "relative links도 선택지입니다."]),
    ],
    codeExamples: [java("jpa07-pagination-links", "page metadata에서 prev/self/next Link 생성", "Jpa07PaginationLinks.java", "relative URI와 bounded page/size만 사용해 page 2의 prev/self/next links를 결정적으로 만듭니다.", String.raw`import java.util.*;

public class Jpa07PaginationLinks {
  static String link(int page, int size, String relation) {
    return "</guestbook?page=" + page + "&size=" + size + ">; rel=\"" + relation + "\"";
  }
  static List<String> links(int page, int size, int totalPages) {
    List<String> result = new ArrayList<>();
    if (page > 0) result.add(link(page - 1, size, "prev"));
    result.add(link(page, size, "self"));
    if (page + 1 < totalPages) result.add(link(page + 1, size, "next"));
    return List.copyOf(result);
  }
  public static void main(String[] args) {
    System.out.println("links=" + links(2, 20, 5));
    System.out.println("page=2");
    System.out.println("size=20");
    System.out.println("items-field=content");
    System.out.println("sensitive-query-in-link=false");
  }
}`, "links=[</guestbook?page=1&size=20>; rel=\"prev\", </guestbook?page=2&size=20>; rel=\"self\", </guestbook?page=3&size=20>; rel=\"next\"]\npage=2\nsize=20\nitems-field=content\nsensitive-query-in-link=false", ["spring-hateoas", "rfc8288", "rfc9110"])],
    diagnostics: [d("next link가 filter를 잃거나 untrusted Host를 반영하고 Page 내부 fields가 version마다 바뀝니다.", "framework Page serialization과 ad-hoc URL 연결을 public contract로 사용했습니다.", ["response schema", "Link values/relations", "proxy/base URI trust", "filter encoding", "Page vs Slice metadata"], "application pagination DTO와 trusted relative/absolute link builder를 사용합니다.", "empty/first/middle/last/filter/cursor/proxy-host schema and link tests를 둡니다.")],
    expertNotes: ["Link header와 body links를 둘 다 제공하면 source-of-truth와 compatibility를 명시합니다.", "cursor가 opaque여도 위치·filter 정보가 포함될 수 있으므로 URL/log/analytics lifecycle을 검토합니다."],
  },
  {
    id: "optimistic-version-etag-precondition",
    title: "@Version 충돌을 ETag·If-Match precondition과 domain conflict로 구분합니다",
    lead: "stale DTO를 마지막 write가 이긴다고 저장하면 다른 사용자의 변경을 조용히 덮어씁니다.",
    explanations: [
      "JPA @Version은 update/merge 시 persistence provider가 version을 비교해 intervening write를 감지하고 OptimisticLockException을 발생시킵니다. 검사는 flush/commit까지 지연될 수 있으므로 transaction boundary 밖 controller catch에 의존하지 않습니다.",
      "response의 approved representation version을 ETag로 표현하고 update/delete client가 If-Match를 보내게 할 수 있습니다. validator가 일치하지 않으면 412 Precondition Failed로 응답하고 최신 representation 재조회/merge UX를 제공합니다.",
      "client precondition 없이 발견된 concurrent domain write를 409 CONCURRENT_MODIFICATION으로 map할지 policy를 정합니다. raw provider exception/entity/version value는 problem detail에 노출하지 않습니다.",
      "strong/weak ETag 의미, representation variants, authorization/cache와 version field를 검토합니다. database @Version 숫자를 단순 노출하는 것이 항상 safe/global representation validator인 것은 아닙니다.",
    ],
    concepts: [
      c("optimistic locking", "read와 write 사이 version이 바뀌었는지 검사해 lost update를 감지하는 concurrency control입니다.", ["@Version이 지원합니다.", "commit 때 실패할 수 있습니다."]),
      c("ETag", "선택된 representation의 validator를 HTTP header로 표현한 값입니다.", ["If-Match와 사용할 수 있습니다.", "variant/strength를 정합니다."]),
      c("precondition failure", "client가 제시한 representation 조건이 현재 state와 맞지 않아 method를 수행하지 않은 결과입니다.", ["If-Match mismatch는 412입니다.", "409와 구분합니다."]),
    ],
    diagnostics: [d("동시 수정이 마지막 write로 덮이거나 optimistic exception이 generic 500/e.getMessage로 노출됩니다.", "@Version/precondition과 transaction exception mapping이 없습니다.", ["entity version mapping", "If-Match/ETag", "flush/commit location", "409/412 policy", "retry UX"], "@Version과 representation validator를 설계하고 typed conflict/precondition problem으로 변환합니다.", "two-writer, stale/fresh/missing If-Match, commit-time exception과 retry tests를 둡니다.")],
    expertNotes: ["optimistic conflict를 server가 무조건 자동 재시도하면 사용자의 의도 충돌을 다시 덮을 수 있습니다.", "ETag는 authorization을 대신하지 않으며 resource 존재와 version 정보 노출을 검토합니다."],
  },
  {
    id: "idempotency-replay-operation-lifecycle",
    title: "write 재시도는 HTTP method semantics와 durable operation deduplication으로 안전하게 만듭니다",
    lead: "timeout 뒤 client가 POST를 다시 보내면 첫 요청이 commit됐는지 몰라 duplicate resource·side effect가 생길 수 있습니다.",
    explanations: [
      "GET, PUT와 DELETE의 HTTP idempotent semantics를 지키고 같은 target state를 표현할 수 있으면 PUT을 고려합니다. POST create/action은 application operation identifier와 canonical request fingerprint를 durable하게 저장해 같은 operation의 replay를 같은 outcome으로 연결할 수 있습니다.",
      "dedupe record는 tenant/actor/scope, operation id digest, request fingerprint, state, resource reference, response status와 expiry를 포함하고 business transaction과 atomic하게 commit합니다. 실제 idempotency token이나 request body를 logs/metrics에 넣지 않습니다.",
      "같은 operation id에 다른 payload가 오면 409 problem, processing이면 bounded retry guidance, completed이면 authorized stored outcome을 반환합니다. failure/rollback/unknown state, record expiry와 replay window를 명시합니다.",
      "optimistic version precondition은 stale update를 막고 operation dedupe는 network retry duplicate를 막는 서로 다른 방어입니다. 둘의 검사 순서와 transaction failure matrix를 테스트합니다.",
    ],
    concepts: [
      c("idempotent method", "동일 요청을 한 번 또는 여러 번 수행해도 intended server effect가 같은 HTTP method 성질입니다.", ["response는 달라질 수 있습니다.", "PUT/DELETE가 대표적입니다."]),
      c("operation deduplication", "같은 logical write 재시도를 durable identifier/fingerprint로 감지해 duplicate effect를 막는 application protocol입니다.", ["POST에 필요할 수 있습니다.", "scope/expiry를 둡니다."]),
      c("request fingerprint", "같은 operation id가 동일 command인지 비교하는 canonicalized digest입니다.", ["raw body를 저장하지 않습니다.", "version/algorithm을 관리합니다."]),
    ],
    codeExamples: [java("jpa07-version-idempotency", "version precondition과 duplicate operation 분리", "Jpa07VersionIdempotency.java", "동일 operation replay는 재적용하지 않고 새로운 stale operation은 precondition 실패로 분류합니다.", String.raw`import java.util.*;

public class Jpa07VersionIdempotency {
  enum Result { APPLIED, REPLAY, PRECONDITION_FAILED }
  static final class Store {
    long version = 3;
    final Set<String> completed = new HashSet<>();
    Result update(long expectedVersion, String operation) {
      if (completed.contains(operation)) return Result.REPLAY;
      if (expectedVersion != version) return Result.PRECONDITION_FAILED;
      completed.add(operation);
      version++;
      return Result.APPLIED;
    }
  }
  public static void main(String[] args) {
    Store store = new Store();
    System.out.println("first=" + store.update(3, "operation-a"));
    System.out.println("replay=" + store.update(3, "operation-a"));
    System.out.println("stale=" + store.update(3, "operation-b"));
    System.out.println("fresh=" + store.update(4, "operation-c"));
    System.out.println("version=" + store.version);
  }
}`, "first=APPLIED\nreplay=REPLAY\nstale=PRECONDITION_FAILED\nfresh=APPLIED\nversion=5", ["jakarta-persistence-32", "spring-responseentity", "rfc9110"])],
    diagnostics: [d("timeout 재시도로 duplicate row가 생기거나 stale update를 idempotency replay로 오판합니다.", "operation identity와 representation version을 하나의 flag로 처리했습니다.", ["HTTP method semantics", "operation scope/fingerprint", "dedupe transaction", "entity version", "timeout/crash timeline"], "durable operation dedupe와 @Version/If-Match를 별도 상태기로 설계하고 atomic commit합니다.", "duplicate/same-key-different-payload/stale/crash-before-after-commit/expiry tests를 둡니다.")],
    expertNotes: ["operation key를 받는 것만으로 안전하지 않고 저장·scope·fingerprint·transaction·expiry가 모두 필요합니다.", "completed response replay도 현재 caller authorization과 data minimization을 다시 적용합니다."],
  },
  {
    id: "authorization-property-privacy-observability",
    title: "object·property authorization과 zero-value observability를 DTO 전후 모든 경계에 적용합니다",
    lead: "DTO가 field를 줄여도 어떤 사용자가 어떤 resource와 property를 볼 수 있는지 검사하지 않으면 정보 노출은 남습니다.",
    explanations: [
      "path/query identifier를 받은 모든 detail/update/delete endpoint는 authenticated actor가 해당 object action을 수행할 권한이 있는지 service/domain query에서 확인합니다. 순차 id를 숨기는 것으로 object authorization을 대신하지 않습니다.",
      "read/write DTO별 property allow-list와 role/use case policy를 둡니다. client가 internal field를 보내면 무시하기보다 schema violation으로 거절하고 serializer output도 exact allow-list test로 검증합니다.",
      "logs/traces/metrics에는 operation, route template, status/problem code, validation field code, page-size bucket, latency와 correlation만 기록합니다. writer/content/email/password-like fields, entity dump, rejected values, operation tokens와 raw URI query는 제외합니다.",
      "404/403 선택, audit record, retention과 support access는 threat model에 맞춥니다. correlation과 audit가 실제 user content를 장기 복제하는 hidden database가 되지 않게 field-level data classification을 적용합니다.",
    ],
    concepts: [
      c("object-level authorization", "요청 actor가 특정 resource instance에 action할 권한이 있는지 매 요청 확인하는 통제입니다.", ["ID 난독화와 다릅니다.", "service query에 포함할 수 있습니다."]),
      c("property-level authorization", "같은 object에서도 읽기·수정 가능한 fields를 actor/use case별로 제한하는 통제입니다.", ["DTO allow-list와 연결합니다.", "mass assignment를 막습니다."]),
      c("zero-value telemetry", "실제 user/entity/request values 없이 bounded operation/outcome만 기록하는 관측 schema입니다.", ["민감정보 복제를 줄입니다.", "correlation은 유지합니다."]),
    ],
    diagnostics: [d("다른 identifier로 detail을 조회하거나 hidden field를 body에 넣어 수정할 수 있고 로그에 entity가 남습니다.", "DTO 변환만 하고 object/property authorization과 telemetry allow-list가 없습니다.", ["repository/service ownership predicate", "request/response fields", "role matrix", "logs/APM", "audit retention"], "actor-scoped access check와 per-command/per-response field allow-list, zero-value telemetry를 적용합니다.", "cross-actor ID, extra/internal property, exact JSON fields와 sensitive canary 0건 tests를 둡니다.")],
    expertNotes: ["authorization 실패 status를 일관되게 하면서도 내부 audit에는 stable reason category를 남깁니다.", "coarse metadata도 희소 actor/time과 결합하면 민감할 수 있어 retention/access를 제한합니다."],
  },
  {
    id: "mockmvc-contract-integration-release",
    title: "MockMvc·service/JPA integration·schema/consumer tests로 wire와 state를 함께 고정합니다",
    lead: "controller method를 직접 호출해 DataVO field만 검사하면 status, headers, converter와 exception handler를 검증할 수 없습니다.",
    explanations: [
      "MockMvc/web slice는 route/method, parameter/body binding, validation, status, Location/ETag/Link, Content-Type, exact JSON fields와 ProblemDetail을 실제 Spring MVC pipeline에서 검사합니다. service는 mock하되 authorization outcome까지 명시합니다.",
      "service/JPA integration은 transaction, not-found, optimistic conflict, projection/query count와 operation dedupe atomicity를 disposable database에서 검증합니다. web mock만으로 commit-time exception과 real provider behavior를 승인하지 않습니다.",
      "schema/OpenAPI/consumer contract test는 Object data 제거, field null/type, problem type/code와 additive evolution을 비교합니다. legacy DataVO client는 adapter/dual media/path와 deprecation telemetry를 거쳐 단계적으로 이관합니다.",
      "failure matrix는 malformed/media/validation/auth/missing/conflict/precondition/duplicate/dependency/serialization/handler failure와 timeout-before/after-commit을 포함합니다. 모든 artifacts를 actual values 없는 synthetic fixtures로 유지합니다.",
    ],
    concepts: [
      c("MockMvc contract test", "서버를 실제 port에 띄우지 않고 Spring MVC request→mapping→converter→response pipeline을 검사하는 test입니다.", ["status/headers/body를 봅니다.", "DB integration은 별도입니다."]),
      c("schema compatibility", "기존 consumer가 새 response/problem schema를 처리할 수 있는지 additive/breaking 변화를 비교하는 규칙입니다.", ["OpenAPI diff를 사용할 수 있습니다.", "runtime samples만 믿지 않습니다."]),
      c("expand-and-contract", "새 contract를 추가·병행·관측한 뒤 legacy contract를 제거하는 호환 migration 방식입니다.", ["rollback window를 둡니다.", "usage telemetry가 필요합니다."]),
    ],
    diagnostics: [d("unit test는 통과하지만 실제 응답은 200/text/html이거나 optimistic conflict가 commit 때 500이 됩니다.", "controller 직접 호출/mock만 있고 MVC converter와 JPA transaction integration이 없습니다.", ["MockMvc assertions", "actual media/headers", "ControllerAdvice", "flush/commit tests", "schema/consumer diff"], "web contract와 service/JPA integration, schema/consumer tests를 계층별로 조합합니다.", "전체 outcome/failure matrix와 legacy migration canary/rollback gates를 둡니다.")],
    expertNotes: ["snapshot JSON 하나만 승인하지 말고 semantic field/status/header assertions와 forbidden fields를 함께 검사합니다.", "production exception text를 fixture로 복사하지 않고 stable synthetic category로 재현합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-controller", repository: "nohssam/2026-spring-jpa-test learning source", path: "2026-spring-jpa-test\\src\\main\\java\\com\\study\\jpatest\\guestbook\\controller\\GeustBookController.java", usedFor: ["four GET handlers", "Entity/List direct data", "broad catch", "exception message exposure", "always-200 boundary"], evidence: "2026-07-14 read-only audit: 103 lines, 3,884 bytes, SHA-256 3C5E5BD6333256AA156EBC61C80E562D6ECC17A18A1261678A85D7FC79C0758E." },
  { id: "local-data-vo", repository: "nohssam/2026-spring-jpa-test learning source", path: "2026-spring-jpa-test\\src\\main\\java\\com\\study\\jpatest\\common\\vo\\DataVO.java", usedFor: ["mutable Boolean/String/Object envelope", "heterogeneous response shape"], evidence: "2026-07-14 read-only audit: 14 lines, 291 bytes, SHA-256 68627BB94EA3B0DE6485C3A747680CF1A1B1C340FDC873C14F1AABAE0040E9E4." },
  { id: "spring-responsebody", repository: "Spring Framework", path: "web/webmvc/mvc-controller/ann-methods/responsebody.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html", usedFor: ["@ResponseBody/@RestController serialization", "return value handling"], evidence: "Spring Framework 공식 response body 문서입니다." },
  { id: "spring-responseentity", repository: "Spring Framework", path: "web/webmvc/mvc-controller/ann-methods/responseentity.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html", usedFor: ["status/header/body response control", "Location/ETag mapping"], evidence: "Spring Framework 공식 ResponseEntity 문서입니다." },
  { id: "spring-requestbody", repository: "Spring Framework", path: "web/webmvc/mvc-controller/ann-methods/requestbody.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html", usedFor: ["request body conversion", "@Valid validation", "binding boundary"], evidence: "Spring Framework 공식 @RequestBody 문서입니다." },
  { id: "spring-mvc-validation", repository: "Spring Framework", path: "web/webmvc/mvc-controller/ann-validation.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["method/argument validation", "validation exception distinction"], evidence: "Spring Framework 공식 MVC validation 문서입니다." },
  { id: "spring-error-responses", repository: "Spring Framework", path: "web/webmvc/mvc-ann-rest-exceptions.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["ProblemDetail", "ErrorResponse", "ResponseEntityExceptionHandler", "problem media types"], evidence: "Spring Framework 공식 REST error response 문서입니다." },
  { id: "spring-requestmapping", repository: "Spring Framework", path: "web/webmvc/mvc-controller/ann-requestmapping.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", usedFor: ["HTTP method", "consumes/produces", "mapping conditions"], evidence: "Spring Framework 공식 annotated request mapping 문서입니다." },
  { id: "spring-message-converters", repository: "Spring Framework", path: "web/webmvc/message-converters.html", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html", usedFor: ["Java-object HTTP conversion", "supported media types"], evidence: "Spring Framework 공식 HTTP message converters 문서입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework", path: "testing/mockmvc.html", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc.html", usedFor: ["MVC request/response tests", "status/header/body assertions"], evidence: "Spring Framework 공식 MockMvc 문서입니다." },
  { id: "spring-data-jpa-projections", repository: "Spring Data JPA", path: "reference/repositories/projections.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html", usedFor: ["DTO/interface projections", "select shape boundary"], evidence: "Spring Data JPA 공식 projections reference입니다." },
  { id: "spring-hateoas", repository: "Spring HATEOAS", path: "docs/current/reference/html/", publicUrl: "https://docs.spring.io/spring-hateoas/docs/current/reference/html/", usedFor: ["links", "representation models", "pagination navigation"], evidence: "Spring HATEOAS current 공식 reference입니다." },
  { id: "rfc9457", repository: "IETF RFC Editor", path: "RFC 9457 Problem Details", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["problem fields", "application/problem+json", "security considerations"], evidence: "RFC 7807을 대체한 IETF Standards Track Problem Details 문서입니다." },
  { id: "rfc9110", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["methods/statuses", "Content-Type/Accept", "Location/ETag/If-Match", "idempotency"], evidence: "IETF Standards Track HTTP semantics 문서입니다." },
  { id: "rfc8288", repository: "IETF RFC Editor", path: "RFC 8288 Web Linking", publicUrl: "https://www.rfc-editor.org/rfc/rfc8288.html", usedFor: ["Link header/context", "relation types", "pagination links"], evidence: "IETF Standards Track Web Linking 문서입니다." },
  { id: "jakarta-validation-31", repository: "Jakarta Validation", path: "specifications/bean-validation/3.1/jakarta-validation-spec-3.1", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/jakarta-validation-spec-3.1", usedFor: ["constraint model", "validation groups", "method validation"], evidence: "Jakarta Validation 3.1 공식 specification입니다." },
  { id: "jakarta-persistence-32", repository: "Jakarta Persistence", path: "specifications/persistence/3.2/jakarta-persistence-spec-3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["entity version", "optimistic locking", "OptimisticLockException timing"], evidence: "Jakarta Persistence 3.2 공식 specification입니다." },
  { id: "owasp-api3-property", repository: "OWASP API Security", path: "API3:2023 Broken Object Property Level Authorization", publicUrl: "https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/", usedFor: ["excessive data exposure", "property authorization", "allow-listed output"], evidence: "OWASP API Security 공식 property-level authorization guidance입니다." },
  { id: "owasp-mass-assignment", repository: "OWASP Cheat Sheet Series", path: "Mass Assignment Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html", usedFor: ["request DTO allow-list", "mass assignment prevention"], evidence: "OWASP 공식 Mass Assignment guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-07-dto-controller-error", slug: "jpa-07-dto-controller-error", courseId: "spring", moduleId: "spring-data-jpa", order: 7,
  title: "엔티티 노출을 피하는 DTO 응답과 오류 처리", subtitle: "원본 Entity/DataVO 반환을 typed DTO·validation·HTTP headers·RFC 9457 problem·concurrency contract로 이관합니다",
  level: "고급", estimatedMinutes: 95,
  coreQuestion: "JPA Entity와 내부 exception을 노출하지 않으면서 request/response DTO, validation, HTTP status·headers·media, pagination·concurrency·idempotency를 consumer가 신뢰할 수 있는 API 계약으로 어떻게 만들까요?",
  summary: "2026-spring-jpa-test의 GeustBookController.java와 DataVO.java 두 파일을 read-only로 감사합니다. 네 GET handler, List/GuestBook entity 직접 반환, mutable Boolean success/String message/Object data, broad catch와 e.getMessage로 인한 always-200/정보 노출 위험을 실제 근거로 사용하되 runtime values는 복사하지 않습니다. Entity와 use-case response DTO/projection/field allow-list, create/update command와 Bean/domain validation, collection-empty/detail-missing/create/delete status·Location, RFC 9457 ProblemDetail/error taxonomy/redaction, Content-Type·Accept·406·415, application-owned pagination DTO/RFC 8288 links, @Version·ETag·If-Match 409/412, durable operation deduplication, object/property authorization·zero-value telemetry, MockMvc+JPA+schema/consumer migration gates까지 controller를 production boundary로 확장합니다. 일곱 JDK 21 examples는 DTO allow-list, validation problem, status/header outcome, media negotiation, pagination links, version/idempotency와 error redaction을 actual data/secret 없이 exact stdout으로 실행합니다.",
  objectives: ["원본 Controller/DataVO의 HTTP·serialization·persistence 경계 문제를 provenance로 감사한다.", "Entity 대신 use case별 immutable response DTO와 field allow-list/projection을 설계한다.", "create/update request DTO, Bean Validation과 domain/authorization validation을 분리한다.", "collection/detail/create/delete 결과를 정확한 status, Location와 body로 매핑한다.", "RFC 9457 ProblemDetail, centralized error taxonomy와 exception redaction을 구현한다.", "Content-Type·Accept·produces/consumes·406/415와 pagination links를 검증한다.", "@Version/ETag/If-Match와 operation deduplication을 서로 다른 concurrency 방어로 운영한다.", "object/property authorization, zero-value telemetry와 MockMvc/JPA/schema release gates를 완성한다."],
  prerequisites: [{ title: "쿼리 메서드·Pageable·Sort 보강", reason: "stable Page/Slice/Window, projection과 query resource cap을 알아야 Repository 결과를 controller의 bounded collection DTO와 link/error 계약으로 안전하게 변환할 수 있습니다.", sessionSlug: "jpa-06-derived-query-pageable" }],
  keywords: ["response DTO", "request DTO", "entity exposure", "field allow-list", "Bean Validation", "ResponseEntity", "ProblemDetail", "RFC 9457", "Content-Type", "Accept", "Location", "ETag", "If-Match", "optimistic locking", "idempotency", "Link", "MockMvc", "property authorization"],
  topics,
  lab: {
    title: "원본 DataVO guestbook API를 typed HTTP·ProblemDetail·concurrency contract로 이관하기",
    scenario: "원본 API는 학습용 성공/메시지 envelope로 동작하지만 Entity graph, Object shape, exception text와 status/header/media/concurrency 의미를 consumer에게 안전하게 제공하지 못합니다.",
    setup: ["Controller/DataVO 원본은 read-only hash provenance로 고정합니다.", "synthetic request/entity/error fixtures와 JDK 21 examples를 준비합니다.", "Spring MVC MockMvc, service/JPA disposable database와 schema/consumer harness를 준비합니다.", "actual user/entity values, credentials, exception messages와 operation tokens를 artifacts에서 금지합니다."],
    steps: ["네 handlers의 method/path/input/service/result/status/media/error behavior를 characterization합니다.", "목록/상세 response DTO와 create/update command DTO field allow-list를 정의합니다.", "projection→application mapper→wire DTO와 object/property authorization 순서를 구현합니다.", "binding/Bean/domain validation을 stable field/problem codes로 정규화합니다.", "empty/detail/create/delete/conflict/dependency outcome→status/headers/body 표를 적용합니다.", "ControllerAdvice/ResponseEntityExceptionHandler에 RFC 9457 taxonomy와 redaction/correlation을 구현합니다.", "consumes/produces, Content-Type/Accept와 406/415/problem media matrix를 검증합니다.", "Page/Slice/Window를 application pagination DTO와 trusted prev/self/next links로 변환합니다.", "@Version conflict와 ETag/If-Match 409/412 mapping을 two-writer test합니다.", "write operation dedupe scope/fingerprint/state/expiry를 business transaction과 fault-test합니다.", "route/outcome/field-code/page-bucket/query-count bounded telemetry와 sensitive canary를 적용합니다.", "MockMvc, JPA integration, exact schema/consumer diff와 legacy DataVO expand-contract canary/rollback을 제출합니다."],
    expectedResult: ["public JSON은 endpoint별 approved DTO fields만 포함하고 Entity/proxy/internal/sensitive fields가 없습니다.", "성공·validation·missing·conflict·dependency가 정확한 status/headers/media/ProblemDetail을 가집니다.", "pagination links와 metadata가 Page/Slice/Window semantics 및 resource caps와 일치합니다.", "stale write와 duplicate retry가 lost/duplicate effect 없이 409/412/replay contract로 처리됩니다.", "logs/traces/test artifacts에 actual values, exception text, credentials와 operation tokens가 없습니다."],
    cleanup: ["disposable database, synthetic records, dedupe/audit fixtures와 test processes를 제거합니다.", "temporary error/SQL/body debug logging과 proxy/header test configuration을 원복합니다.", "schema snapshots/logs/traces에서 sensitive/error/token canary 0건을 확인합니다.", "원본 Controller/DataVO hash와 git status가 변경되지 않았음을 확인합니다."],
    extensions: ["OpenAPI-generated consumer와 DTO additive/deprecation compatibility를 자동화합니다.", "locale/message source와 accessible validation UI contract를 확장합니다.", "async create/202 status resource와 durable outbox idempotency를 설계합니다.", "association DTO/N+1과 field-level authorization query plan을 JPA08로 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java examples를 실행하고 각 output을 실제 MockMvc/JPA evidence와 연결하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "response field allow-list를 나열합니다.", "validation problem에 rejected value가 없음을 확인합니다.", "empty/create/delete status를 구분합니다.", "406/415를 설명합니다.", "pagination Link 관계를 추적합니다.", "version conflict와 duplicate replay를 분리합니다.", "internal error text 비노출을 확인합니다."], hints: ["Java model을 실제 HTTP/Jackson 동작이라고 과장하지 말고 wire test를 붙이세요."], expectedOutcome: "DTO부터 status/problem/concurrency까지 소비자가 관찰하는 계약을 실행 증거로 설명합니다.", solutionOutline: ["shape→validate→status/media→links→version/dedupe→redaction 순서입니다."] },
    { difficulty: "응용", prompt: "원본 네 endpoints를 typed guestbook API로 이관하는 implementation plan을 작성하세요.", requirements: ["legacy behavior characterization을 둡니다.", "list/detail/create/update DTO를 분리합니다.", "object/property authorization을 둡니다.", "validation/status/header/problem mapping 표를 둡니다.", "content negotiation과 pagination links를 둡니다.", "@Version/ETag와 operation dedupe를 둡니다.", "MockMvc/JPA/schema/consumer tests를 둡니다.", "dual-contract telemetry/rollback과 제거 시점을 둡니다."], hints: ["DataVO field 이름만 유지한 generic wrapper가 최종 목적일 필요는 없습니다."], expectedOutcome: "consumer compatibility와 security/concurrency를 보존하는 단계별 migration이 완성됩니다.", solutionOutline: ["characterize→model→map→test→dual serve→observe→contract 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC+JPA REST boundary 표준을 작성하세요.", requirements: ["entity/request/response/projection ownership을 정의합니다.", "field/object authorization과 validation rules를 둡니다.", "method/status/header/media semantics 표를 둡니다.", "RFC 9457 taxonomy/redaction/correlation을 둡니다.", "pagination/link/cursor schema를 둡니다.", "version/precondition/idempotency state를 둡니다.", "MockMvc/integration/schema/security tests를 둡니다.", "version/deprecation/rollback governance를 둡니다."], hints: ["Controller coding style가 아니라 public wire contract와 persistent side effect의 수명주기를 표준화하세요."], expectedOutcome: "API 생성부터 legacy retirement까지 감사 가능한 REST boundary governance가 완성됩니다.", solutionOutline: ["boundary→shape→protocol→errors→concurrency→evidence→evolution 순서입니다."] },
  ],
  nextSessions: ["jpa-08-association-fetch-nplusone"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["GeustBookController.java는 read-only로 103 lines/3,884 bytes와 SHA-256 3C5E5BD6333256AA156EBC61C80E562D6ECC17A18A1261678A85D7FC79C0758E를 확인했습니다.", "DataVO.java는 read-only로 14 lines/291 bytes와 SHA-256 68627BB94EA3B0DE6485C3A747680CF1A1B1C340FDC873C14F1AABAE0040E9E4를 확인했습니다.", "원본의 four GET handlers, List/GuestBook direct Object data, mutable success/message/data, broad catch와 exception message만 provenance로 사용하고 ResponseEntity/ProblemDetail/validation/concurrency가 존재한다고 가정하지 않았습니다.", "실제 entity rows, user fields, request bodies, database URL/credential, exception text와 operation/idempotency values는 examples, output와 source evidence에 복제하지 않았습니다.", "JDK-only examples는 Spring MVC mapping/converters, Jackson schema, Bean Validation, JPA commit-time locking, authorization filters와 deployed proxy/cache behavior를 대체하지 않습니다."] },
});

export default session;
