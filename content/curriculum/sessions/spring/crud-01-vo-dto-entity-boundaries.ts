import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "JDK 21 record·collection으로 transport, domain, persistence representation과 명시적 mapping boundary를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "허용 필드, 값 객체 invariant, generated identity와 public response projection을 성공·실패 입력으로 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "raw password/content 대신 field 목록, stable category, identity와 mapping 결과만 출력해 경계 계약을 검증합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/JPA/MyBatis/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 한 글자씩 같아야 합니다.", "JDK-only model은 실제 Spring data binding, Bean Validation, JPA persistence context/proxy와 MyBatis TypeHandler를 대체하지 않습니다."] },
    experiments: [
      { change: "허용되지 않은 id/status/secret field, blank·oversized text와 schema version을 바꿉니다.", prediction: "입력 DTO와 mapper가 경계를 소유하면 거부 또는 명시적 default가 deterministic하게 나타납니다.", result: "accepted/ignored fields, validation code, domain invariant와 public projection을 비교합니다." },
      { change: "같은 contract를 MockMvc, actual JPA provider 또는 MyBatis test container에서 실행합니다.", prediction: "binding/validation, generated id, dirty checking/result mapping 같은 framework behavior가 추가됩니다.", result: "HTTP status/body, SQL bind/result, transaction과 persistence context evidence를 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "representation-boundary-map",
    title: "VO·DTO·Entity를 이름이 아니라 소유 경계와 변경 이유로 구분합니다",
    lead: "같은 게시글을 표현해도 HTTP 입력, 도메인 규칙, DB 행과 공개 응답은 신뢰 수준과 수명이 달라 하나의 만능 객체가 될 수 없습니다.",
    explanations: [
      "Request DTO는 외부가 보낼 수 있는 필드와 형식의 allow-list입니다. Domain model/value object는 업무 invariant와 행위를 표현하고, persistence entity/row model은 식별자·column·ORM lifecycle을 표현하며, response DTO는 공개 가능한 계약만 projection합니다.",
      "VO라는 이름은 팀마다 value object, view object 또는 단순 mutable bean을 뜻할 수 있습니다. 이름을 보고 추측하지 말고 누가 생성하는지, 어느 계층이 수정하는지, equality가 무엇인지, 어떤 field가 외부/DB에 노출되는지 contract 표로 확인합니다.",
      "원본 BoardVO는 식별자·작성자·제목·내용·비밀번호·조회수·계층형 게시판 필드·파일명·날짜·활성 상태와 multipart input을 한 mutable object에 둡니다. 이는 학습 provenance이며 공개 설계에서는 CreateRequest, Board, BoardRow, BoardResponse, UploadCommand로 역할을 나눕니다.",
      "원본 GuestBook entity는 generated identity, column mapping, pre-persist time, soft-delete state를 가진 JPA 모델입니다. entity를 곧바로 web response로 직렬화하면 password와 persistence-only state, lazy/proxy behavior가 HTTP 계약에 새므로 별도 response mapping이 필요합니다.",
      "경계 분리는 class 개수를 늘리는 목적이 아니라 변경 파급을 제한하는 목적입니다. API field rename은 transport mapper, DB column migration은 persistence mapper, 제목 길이 규칙은 value object에서 흡수하고 나머지 계층은 안정된 model을 유지합니다.",
    ],
    concepts: [
      c("representation", "같은 업무 개념을 특정 경계의 책임과 제약에 맞게 표현한 data shape입니다.", ["transport/domain/persistence/view가 있습니다.", "shape와 lifecycle이 다릅니다."]),
      c("mapping boundary", "서로 다른 representation 사이에서 field 선택·변환·default·실패를 명시하는 지점입니다.", ["implicit copy를 피합니다.", "테스트 가능한 pure function이 좋습니다."]),
      c("change axis", "HTTP 계약, 업무 규칙, 저장 schema처럼 서로 독립적으로 바뀌는 이유입니다.", ["class boundary를 정합니다.", "변경 파급을 측정합니다."]),
    ],
    diagnostics: [
      d("DB column 추가만 했는데 API response와 form binding까지 함께 바뀝니다.", "entity/row object 하나를 request·domain·response로 재사용했습니다.", ["controller parameter/return type", "JSON/form fields", "mapper result type", "entity annotations"], "경계별 DTO와 explicit mapper를 만들고 public schema를 allow-list합니다.", "API/schema compatibility tests와 forbidden-field assertions를 둡니다."),
      d("팀원이 VO를 immutable value object로 이해했지만 실제로는 setter 많은 form bean입니다.", "VO 용어의 의미와 equality/lifecycle contract를 문서화하지 않았습니다.", ["constructor/setters", "equals/hashCode", "validation owner", "사용 계층"], "역할 기반 이름 CreateBoardRequest/BoardTitle/BoardRow처럼 바꾸고 glossary를 만듭니다.", "새 model review에서 owner·mutability·identity·sensitivity를 필수 기록합니다."),
    ],
    expertNotes: ["representation 사이의 중복 field는 결함이 아니라 경계를 지키는 비용일 수 있습니다.", "mapping code가 커지면 자동 mapper보다 먼저 경계 자체가 과도하게 넓은지 확인합니다."],
  },
  {
    id: "request-dto-allowlist-validation",
    title: "Request DTO를 binding allow-list와 구문 검증의 첫 방어선으로 만듭니다",
    lead: "클라이언트가 보낸 id·권한·조회수·active 상태를 entity에 자동 복사하면 mass assignment가 업무 규칙을 우회합니다.",
    explanations: [
      "create request에는 작성자가 제공할 writer/title/content처럼 의도된 필드만 둡니다. generated id, active, hit, createdAt, password hash, owner role 같은 server-owned field는 request type 자체에 존재하지 않게 합니다.",
      "Bean Validation과 data binding은 null/blank/length/format 같은 transport-level 제약을 빠르게 보고하지만 DB existence, author permission, duplicate policy 같은 업무 invariant를 대신하지 않습니다. controller validation 뒤 service가 domain rules를 검증합니다.",
      "폼과 JSON은 missing, empty, null, repeated parameter, unexpected field와 character encoding이 다르게 들어올 수 있습니다. Content-Type별 contract와 error field code를 테스트하고 raw rejected value를 error/log에 반사하지 않습니다.",
      "setter가 있는 entity에 web binder를 직접 적용하거나 BeanUtils.copyProperties로 외부 object를 복사하지 않습니다. request constructor 또는 explicit mapping에서 허용 필드만 읽고 unknown field 정책을 API version별로 결정합니다.",
      "검증 실패는 DB mapper를 호출하지 않아야 하며 4xx contract와 field-level stable code를 반환합니다. 화면 MVC라면 same form view와 BindingResult, API라면 bounded problem response를 사용하되 내부 class/constraint message를 노출하지 않습니다.",
    ],
    concepts: [
      c("request DTO", "특정 HTTP operation이 외부에서 받을 수 있는 fields와 transport validation을 표현한 객체입니다.", ["operation별로 나눕니다.", "server-owned fields를 제외합니다."]),
      c("mass assignment", "binder/copy mechanism이 외부 필드를 내부 객체 속성에 과도하게 연결해 보호 상태까지 수정하는 취약점입니다.", ["allow-list DTO로 막습니다.", "authorization은 별도입니다."]),
      c("syntactic validation", "null·길이·형식처럼 DB 조회 없이 입력 표현 자체를 판단하는 검증입니다.", ["경계에서 실행합니다.", "domain validation과 구분합니다."]),
    ],
    codeExamples: [java("crud01-mass-assignment", "허용 필드만 선택하는 request binder", "Crud01MassAssignment.java", "공격성 input map에 server-owned fields가 포함되어도 allow-list만 CreateRequest에 전달되고 나머지는 stable field 이름으로 보고되는 경로를 실행합니다.", String.raw`import java.util.*;

public class Crud01MassAssignment {
  record CreateRequest(String writer, String title, String content) {}
  static CreateRequest bind(Map<String, String> input) {
    return new CreateRequest(input.get("writer"), input.get("title"), input.get("content"));
  }
  public static void main(String[] args) {
    Map<String, String> input = new LinkedHashMap<>();
    input.put("writer", "learner");
    input.put("title", "boundary");
    input.put("content", "safe text");
    input.put("id", "1");
    input.put("active", "ADMIN");
    input.put("hit", "999999");
    input.put("passwordHash", "do-not-copy");
    Set<String> allowed = Set.of("writer", "title", "content");
    SortedSet<String> ignored = new TreeSet<>(input.keySet());
    ignored.removeAll(allowed);
    CreateRequest request = bind(input);
    System.out.println("accepted=" + allowed.stream().sorted().toList());
    System.out.println("ignored=" + ignored);
    System.out.println("request=" + request.writer() + "|" + request.title() + "|" + request.content());
    System.out.println("server-owned-copied=false");
  }
}`, "accepted=[content, title, writer]\nignored=[active, hit, id, passwordHash]\nrequest=learner|boundary|safe text\nserver-owned-copied=false", ["local-board-vo", "spring-handler-methods", "spring-validation", "owasp-mass-assignment", "owasp-input-validation"] )],
    diagnostics: [
      d("POST body의 active=true/id 값이 저장 모델에 반영됩니다.", "외부 payload를 entity/setter bean에 직접 bind하거나 reflection copy했습니다.", ["request parameter type", "binder allowed/disallowed fields", "copy utilities", "SQL bind values"], "operation-specific request DTO와 explicit allow-list mapper를 사용하고 server fields를 service/repository가 생성합니다.", "malicious extra-field fixtures와 persisted forbidden-field assertions를 둡니다."),
      d("검증 실패인데 SQL이 실행되고 audit row가 남습니다.", "validation 순서가 service/mapper 호출 뒤이거나 controller가 BindingResult를 무시했습니다.", ["handler signature/order", "service invocation count", "SQL logs", "transaction outcome"], "binding/validation success 이후에만 use case를 호출하고 실패를 terminal 4xx/form path로 만듭니다.", "invalid request→mapper calls 0 contract test를 둡니다."),
    ],
    expertNotes: ["unknown field 거부는 typo와 공격 탐지에 좋지만 rollout compatibility가 필요하므로 version별 정책을 둡니다.", "DTO allow-list는 object-level authorization을 대신하지 않으며 actor가 해당 게시판에 쓸 수 있는지는 service가 확인합니다."],
  },
  {
    id: "response-dto-public-contract",
    title: "Response DTO는 공개 schema와 민감정보 최소화를 고정합니다",
    lead: "entity를 그대로 직렬화하면 password hash, soft-delete flag, internal filename, lazy association과 이후 column이 예고 없이 API에 노출됩니다.",
    explanations: [
      "response DTO는 client가 필요한 stable id, display writer/title/content, public timestamp와 links만 포함합니다. password/hash, internal storage key, active moderation reason, audit actor와 ORM technical fields는 기본적으로 제외합니다.",
      "HTML/JSP model도 public boundary입니다. `${entity}` 또는 broad bean property 접근에 기대지 않고 view model을 넣으며 text/attribute/URL/JavaScript context에 맞는 output encoding을 final renderer에서 수행합니다.",
      "createdAt은 timezone과 precision이 포함된 wire format을 정하고 null/default를 문서화합니다. 숫자 ID를 JavaScript가 안전하게 표현하지 못할 크기까지 키울 수 있다면 문자열 wire representation 또는 schema constraint를 결정합니다.",
      "response mapping은 persistence context가 닫힌 뒤 lazy load를 우연히 유발하지 않도록 필요한 projection을 transaction 안에서 준비합니다. N+1을 숨기지 말고 query/projection contract와 count를 측정합니다.",
      "새 internal field가 entity에 추가돼도 response snapshot이 바뀌지 않아야 합니다. serialization annotation만 흩뿌리기보다 dedicated response type과 contract/schema test를 release gate로 둡니다.",
    ],
    concepts: [
      c("response DTO", "외부 consumer에게 공개할 fields와 wire representation을 정의한 출력 계약입니다.", ["entity와 분리합니다.", "버전 호환성을 관리합니다."]),
      c("data minimization", "목적에 필요한 정보만 반환·기록·보관하는 원칙입니다.", ["secret/internal state를 제외합니다.", "권한별 projection을 둡니다."]),
      c("output encoding", "신뢰하지 않는 값을 HTML/attribute/URL 등 최종 출력 문맥의 안전한 문자 표현으로 바꾸는 처리입니다.", ["validation과 다릅니다.", "renderer 경계에서 합니다."]),
    ],
    codeExamples: [java("crud01-public-projection", "entity에서 비밀 없는 response projection", "Crud01PublicProjection.java", "password hash와 internal status를 가진 persistence model을 public response record로 명시적으로 projection해 공개 field를 제한합니다.", String.raw`import java.time.*;
import java.util.*;

public class Crud01PublicProjection {
  static final class Entity {
    long id; String writer; String title; String passwordHash; boolean deleted; Instant createdAt;
    Entity(long id, String writer, String title, String passwordHash, boolean deleted, Instant createdAt) {
      this.id=id; this.writer=writer; this.title=title; this.passwordHash=passwordHash; this.deleted=deleted; this.createdAt=createdAt;
    }
  }
  record Response(long id, String writer, String title, String createdAt) {}
  static Response project(Entity entity) {
    if (entity.deleted) throw new NoSuchElementException("not-found");
    return new Response(entity.id, entity.writer, entity.title, entity.createdAt.toString());
  }
  public static void main(String[] args) {
    Entity entity = new Entity(41L, "learner", "DTO boundary", "hash-value", false, Instant.parse("2026-01-02T03:04:05Z"));
    Response response = project(entity);
    System.out.println("response=" + response);
    System.out.println("response-components=" + java.util.Arrays.stream(Response.class.getRecordComponents()).map(java.lang.reflect.RecordComponent::getName).toList());
    System.out.println("password-exposed=false");
    System.out.println("deleted-exposed=false");
  }
}`, "response=Response[id=41, writer=learner, title=DTO boundary, createdAt=2026-01-02T03:04:05Z]\nresponse-components=[id, writer, title, createdAt]\npassword-exposed=false\ndeleted-exposed=false", ["local-guestbook-entity", "spring-handler-methods", "owasp-xss", "java-record"] )],
    diagnostics: [
      d("API JSON/JSP에 password hash나 internal active 값이 보입니다.", "entity/VO를 response/model에 그대로 전달했습니다.", ["handler return/model types", "serializer properties", "view EL expressions", "actual response body"], "public response/view model을 만들고 allowed fields만 mapping하며 노출 secret을 rotate/삭제합니다.", "forbidden field names/value canary를 end-to-end response에서 검사합니다."),
      d("entity field 하나를 추가했더니 client snapshot과 cache key가 깨집니다.", "serialization shape가 persistence class reflection에 암묵적으로 결합했습니다.", ["before/after schema", "serializer annotations", "client failures", "cache representation"], "dedicated versioned response DTO와 explicit projection으로 wire schema를 고정합니다.", "OpenAPI/JSON schema compatibility diff와 consumer contract tests를 둡니다."),
    ],
    expertNotes: ["hash는 평문이 아니지만 인증 비밀의 verifier이므로 공개하지 않습니다.", "soft-deleted resource를 404처럼 숨길지 410/관리자 projection으로 보일지는 authorization과 product contract로 결정합니다."],
  },
  {
    id: "value-object-invariants-equality",
    title: "Value Object에 정규화·불변식·값 동등성을 모읍니다",
    lead: "제목과 작성자 이름을 원시 String으로 전달하면 trim, 길이, Unicode, blank 규칙이 controller/service/SQL마다 달라집니다.",
    explanations: [
      "value object는 데이터 운반 이름이 아니라 생성 순간부터 유효하고 불변이며 값으로 비교되는 domain type입니다. BoardTitle은 trim/blank/길이 정책을, WriterName은 display 규칙을 한 constructor/factory에서 보장합니다.",
      "정규화는 업무 semantics가 명확한 범위에서만 합니다. trim 또는 Unicode normalization이 서로 다른 사용자 입력을 합칠 수 있으므로 원문 보존/검색 key/display value를 분리하고 locale/collation과 함께 결정합니다.",
      "Java record는 immutable carrier와 value-based equals/hashCode를 간결하게 만들지만 모든 record가 domain value object인 것은 아닙니다. compact constructor에서 invariant를 지키고 mutable collection/array를 defensive copy합니다.",
      "validation error는 raw value를 포함하지 않는 stable code와 field/path로 변환합니다. domain constructor exception을 그대로 HTTP에 노출하거나 localized message를 domain core에 넣지 않습니다.",
      "DB column length는 마지막 방어이고 domain 최대 길이와 문자/byte semantics가 일치해야 합니다. emoji/multibyte, normalization, trailing spaces와 DB collation을 actual database integration test로 확인합니다.",
    ],
    concepts: [
      c("value object", "identity가 아니라 구성 값과 invariant로 정의되는 불변 domain 객체입니다.", ["생성 때 검증합니다.", "값 equality를 가집니다."]),
      c("normalization", "여러 입력 표현을 정해진 canonical representation으로 바꾸는 정책입니다.", ["업무 합의가 필요합니다.", "원문 손실을 고려합니다."]),
      c("primitive obsession", "서로 다른 의미의 값을 모두 String/int 같은 primitive로 표현해 규칙과 단위를 잃는 설계입니다.", ["domain type으로 완화합니다.", "경계 mapping은 유지합니다."]),
    ],
    codeExamples: [java("crud01-value-object", "제목 값 객체의 정규화와 실패", "Crud01ValueObject.java", "BoardTitle record가 trim된 유효 값은 값으로 비교하고 blank/초과 입력은 stable error code로 거부하는 경로를 실행합니다.", String.raw`public class Crud01ValueObject {
  record BoardTitle(String value) {
    BoardTitle {
      if (value == null) throw new IllegalArgumentException("TITLE_REQUIRED");
      value = value.strip();
      if (value.isEmpty()) throw new IllegalArgumentException("TITLE_REQUIRED");
      if (value.codePointCount(0, value.length()) > 12) throw new IllegalArgumentException("TITLE_TOO_LONG");
    }
  }
  static void attempt(String raw) {
    try { System.out.println("accepted=" + new BoardTitle(raw).value()); }
    catch (IllegalArgumentException error) { System.out.println("rejected=" + error.getMessage()); }
  }
  public static void main(String[] args) {
    BoardTitle left = new BoardTitle("  경계 설계  ");
    BoardTitle right = new BoardTitle("경계 설계");
    System.out.println("normalized=" + left.value());
    System.out.println("equal-by-value=" + left.equals(right));
    attempt("   ");
    attempt("1234567890123");
  }
}`, "normalized=경계 설계\nequal-by-value=true\nrejected=TITLE_REQUIRED\nrejected=TITLE_TOO_LONG", ["java-record", "owasp-input-validation"] )],
    diagnostics: [
      d("공백 제목이 controller에서는 통과하고 DB constraint에서 실패합니다.", "String 규칙이 계층마다 중복되거나 transport annotation에만 있습니다.", ["DTO constraints", "domain constructor", "service checks", "DB schema/error"], "transport validation 뒤 BoardTitle 생성으로 domain invariant를 한 곳에 고정하고 DB constraint와 맞춥니다.", "모든 entry point와 DB byte/character boundary contract tests를 둡니다."),
      d("같은 제목 value object가 HashSet에서 중복되거나 수정 뒤 lookup이 실패합니다.", "mutable field 또는 잘못된 equals/hashCode를 사용했습니다.", ["mutability", "equals/hashCode", "collection insertion 이후 변경", "record components"], "immutable components와 value equality를 사용하고 mutable members를 defensive copy합니다.", "equals contract/property tests와 mutation attempts를 둡니다."),
    ],
    expertNotes: ["Value object validation은 authorization·uniqueness처럼 외부 상태가 필요한 규칙을 품지 않습니다.", "화면 표시용 text와 검색/중복 판정 key가 같은 normalization을 가져야 한다고 가정하지 않습니다."],
  },
  {
    id: "domain-model-behavior-state",
    title: "Domain model은 persistence setter 묶음이 아니라 허용된 상태 전이를 표현합니다",
    lead: "active=1, hit=999 같은 setter를 어디서나 호출할 수 있으면 서비스 규칙과 권한 검사가 객체 외부에 흩어집니다.",
    explanations: [
      "Board domain model은 publish, hide, rename 같은 의미 있는 method로 상태를 바꾸고 필요한 actor/policy는 service에서 확인합니다. persistence hydration을 위한 무제한 public setter와 use-case behavior를 같은 API로 두지 않습니다.",
      "domain identity와 generated database id를 구분합니다. 저장 전 id가 없을 수 있는 모델에서는 transient instance equality를 DB id 하나로 구현하면 null entities가 같아지거나 hash collection contract가 깨질 수 있습니다.",
      "조회수처럼 높은 동시 갱신 state는 entity에서 read-modify-write 하지 말고 repository atomic update 또는 event/analytics policy를 둡니다. 다음 CRUD04에서 affected rows와 optimistic concurrency로 확장합니다.",
      "soft delete는 boolean setter가 아니라 actor authorization, current state, audit time/reason과 visibility query가 함께 움직이는 use case입니다. deleted row가 detail/list/cache에서 일관되게 숨는지 확인합니다.",
      "anemic model이 항상 나쁜 것은 아니지만 rule owner가 service/domain/policy 중 어디인지 명확해야 합니다. mapper/XML에 업무 조건이 숨어 controller가 추측하지 않도록 executable invariant와 terminology를 유지합니다.",
    ],
    concepts: [
      c("domain model", "업무 개념, invariant와 허용된 상태 전이를 기술하는 모델입니다.", ["storage annotations와 독립적일 수 있습니다.", "행위에 의미 있는 이름을 줍니다."]),
      c("domain identity", "시간이 지나 상태가 바뀌어도 같은 업무 객체임을 구분하는 식별 기준입니다.", ["DB primary key와 같을 수도 있습니다.", "transient lifecycle을 고려합니다."]),
      c("state transition", "현재 상태와 규칙을 검사해 다음 상태로 이동시키는 domain operation입니다.", ["무제한 setter와 다릅니다.", "audit/authorization과 연결합니다."]),
    ],
    diagnostics: [
      d("삭제된 게시글이 목록에서는 숨지만 상세 URL로는 보입니다.", "soft-delete visibility가 일부 SQL/controller if에만 흩어졌습니다.", ["all read queries", "cache keys", "detail authorization", "delete transition"], "repository의 active-only policy와 관리자 전용 projection을 분리하고 상태 전이를 domain/service가 소유합니다.", "list/detail/search/cache visibility matrix를 둡니다."),
      d("저장 전 entity 두 개가 equals=true이거나 HashSet에서 사라집니다.", "nullable generated id와 mutable fields로 equality/hashCode를 구성했습니다.", ["transient ids", "equals/hashCode implementation", "collection lifecycle", "proxy class behavior"], "identity assignment strategy와 entity equality contract를 명시하고 persistence integration tests로 검증합니다.", "transient/managed/detached/proxy equality matrix를 둡니다."),
    ],
    expertNotes: ["domain behavior를 entity에 둘지 별도 aggregate/model에 둘지는 ORM 제약과 팀 역량을 포함해 결정합니다.", "상태를 숨긴다는 것은 관측을 없애는 뜻이 아니며 stable transition event와 audit evidence는 남깁니다."],
  },
  {
    id: "jpa-entity-lifecycle-identity",
    title: "JPA Entity의 identity·persistence context·lifecycle callback을 HTTP DTO와 분리합니다",
    lead: "@Entity는 table row보다 더 많은 persistence runtime semantics를 가지므로 record response나 form bean처럼 다루면 proxy·dirty checking·transaction 문제가 생깁니다.",
    explanations: [
      "JPA entity는 @Entity와 @Id로 persistent identity를 정의하고 persistence context 안에서 managed state와 dirty checking에 참여합니다. @GeneratedValue strategy는 database/provider capability와 batching/insert timing에 영향을 줍니다.",
      "원본 entity의 @PrePersist timestamp는 insert 전 시간을 채우지만 Clock을 직접 주입하기 어렵고 retry/import/database time과 차이가 날 수 있습니다. application listener, auditable service, provider auditing 또는 DB default 중 owner를 하나 정하고 timezone/precision을 검증합니다.",
      "entity는 no-arg constructor, access type, proxy 가능성, lazy associations와 lifecycle callback 제약을 따릅니다. final/record DTO 설계를 entity에 그대로 적용하지 말고 현재 Jakarta Persistence spec/provider behavior를 확인합니다.",
      "@Data처럼 모든 fields 기반 equals/hashCode/toString을 자동 생성하면 lazy load, cyclic graph, secret logging과 mutable hash 문제가 생길 수 있습니다. entity identity와 safe diagnostic string을 의도적으로 설계합니다.",
      "entity를 controller 밖으로 반환하지 않고 transaction/service에서 response로 projection합니다. detach 뒤 lazy load exception을 catch해 null로 바꾸지 말고 query fetch plan과 use-case projection을 명시합니다.",
    ],
    concepts: [
      c("entity", "persistent identity를 가지며 persistence context가 lifecycle과 state synchronization을 관리하는 객체입니다.", ["@Id가 필요합니다.", "DTO와 목적이 다릅니다."]),
      c("persistence context", "entity identity와 managed state를 추적해 database synchronization을 조정하는 JPA context입니다.", ["transaction 경계와 연결됩니다.", "detached 상태를 구분합니다."]),
      c("lifecycle callback", "persist/update/remove/load 같은 persistence event 전후에 provider가 호출하는 callback입니다.", ["side effect를 제한합니다.", "테스트와 owner가 필요합니다."]),
    ],
    codeExamples: [java("crud01-entity-lifecycle", "transient→managed identity와 response mapping", "Crud01EntityLifecycle.java", "JPA를 흉내 낸 최소 entity가 저장 전 null id에서 repository-assigned id로 한 번 이동하고 public snapshot으로 mapping되는 lifecycle을 실행합니다.", String.raw`import java.time.*;

public class Crud01EntityLifecycle {
  static final class Entity {
    private Long id; private final String title; private Instant createdAt; private final String passwordHash;
    Entity(String title, String passwordHash) { this.title=title; this.passwordHash=passwordHash; }
    void markPersisted(long generatedId, Instant now) {
      if (id != null) throw new IllegalStateException("IDENTITY_ALREADY_ASSIGNED");
      id=generatedId; createdAt=now;
    }
  }
  record Response(long id, String title, Instant createdAt) {}
  static Response response(Entity entity) {
    if (entity.id == null) throw new IllegalStateException("NOT_PERSISTED");
    return new Response(entity.id, entity.title, entity.createdAt);
  }
  public static void main(String[] args) {
    Entity entity = new Entity("lifecycle", "hash-value");
    System.out.println("transient-id=" + entity.id);
    entity.markPersisted(73L, Instant.parse("2026-02-03T04:05:06Z"));
    System.out.println("managed-id=" + entity.id);
    System.out.println("response=" + response(entity));
    try { entity.markPersisted(74L, Instant.EPOCH); }
    catch (IllegalStateException error) { System.out.println("reassign=" + error.getMessage()); }
    System.out.println("secret-projected=false");
  }
}`, "transient-id=null\nmanaged-id=73\nresponse=Response[id=73, title=lifecycle, createdAt=2026-02-03T04:05:06Z]\nreassign=IDENTITY_ALREADY_ASSIGNED\nsecret-projected=false", ["local-guestbook-entity", "jakarta-persistence-spec", "jakarta-entity", "jakarta-id", "jakarta-generated-value"] )],
    diagnostics: [
      d("controller JSON 직렬화 중 LazyInitializationException/추가 SQL이 발생합니다.", "managed entity graph를 transaction 밖 response로 반환했습니다.", ["handler return type", "transaction end", "lazy associations", "query count"], "use-case query에서 필요한 projection을 만들고 response DTO를 반환합니다.", "transaction/query-count/serialization integration tests를 둡니다."),
      d("entity logging 한 줄이 password와 연관 graph 전체를 출력합니다.", "자동 toString이 모든 fields와 lazy associations를 포함합니다.", ["generated methods", "logger arguments", "lazy SQL", "log samples"], "safe id/type/state category만 기록하고 secret/association을 toString에서 제외합니다.", "synthetic secret canary와 no-extra-SQL log test를 둡니다."),
    ],
    expertNotes: ["@PrePersist에서 현재 시간을 넣는 것은 편리하지만 time owner와 retry semantics를 숨길 수 있습니다.", "provider가 생성 ID를 언제 채우는지는 strategy와 flush/insert timing에 따라 달라 actual DB test가 필요합니다."],
  },
  {
    id: "mybatis-row-model-result-mapping",
    title: "MyBatis row model과 domain model을 result mapping 경계에서 연결합니다",
    lead: "resultType 자동 매핑은 column과 Java property가 우연히 맞을 때 빠르지만 schema 이름과 domain 의미를 결합하고 누락을 조용히 만들 수 있습니다.",
    explanations: [
      "MyBatis mapper XML의 namespace/id는 mapper method contract와 연결되고 #{value}는 PreparedStatement parameter를 만듭니다. resultType 자동 매핑과 explicit resultMap/column aliases 중 어떤 방식을 쓰든 column→property evidence를 유지합니다.",
      "DB row model은 nullable column, numeric width, raw status code, database timestamp를 표현하고 mapper가 BoardId/BoardTitle/domain enum으로 변환합니다. 잘못된 code/null은 조용한 default가 아니라 persistence contract error로 분류합니다.",
      "원본 BoardVO처럼 모든 numeric/date values를 String으로 두면 parse failure와 ordering/arithmetic가 늦게 드러납니다. id/counter는 적절한 numeric type, timestamp는 Instant/LocalDateTime+zone policy, status는 bounded enum/value object로 옮깁니다.",
      "SELECT *는 column 추가/순서, 이름 충돌과 민감 field over-fetch를 숨깁니다. 필요한 columns를 명시하고 public response와 DB projection을 같다고 가정하지 않습니다.",
      "mapper는 SQL/row conversion을 소유하지만 HTTP status나 localized message를 알지 않습니다. not found는 Optional/null/result count contract로 service에 전달하고 controller가 HTTP representation으로 변환합니다.",
    ],
    concepts: [
      c("row model", "특정 query/result set의 columns, nullability와 database types를 표현한 persistence boundary object입니다.", ["domain과 다를 수 있습니다.", "query별 projection이 가능합니다."]),
      c("result mapping", "ResultSet columns를 Java properties/constructor/domain values로 변환하는 계약입니다.", ["aliases/resultMap을 사용합니다.", "누락과 type을 검증합니다."]),
      c("prepared parameter", "SQL text와 분리해 driver가 type/value로 binding하는 parameter입니다.", ["#{...}가 사용됩니다.", "${...}와 구분합니다."]),
    ],
    codeExamples: [java("crud01-row-domain-mapping", "row→domain→response mapping", "Crud01RowDomainMapping.java", "nullable/문자열 DB row를 typed domain으로 변환하고 soft-deleted row는 public response에서 거부하는 경로를 실행합니다.", String.raw`import java.time.*;
import java.util.*;

public class Crud01RowDomainMapping {
  record Row(long boardId, String titleText, int activeCode, String createdText) {}
  enum Visibility { VISIBLE, DELETED }
  record Board(long id, String title, Visibility visibility, Instant createdAt) {}
  record Response(long id, String title, String createdAt) {}
  static Board toDomain(Row row) {
    Visibility visibility = switch (row.activeCode()) { case 0 -> Visibility.VISIBLE; case 1 -> Visibility.DELETED; default -> throw new IllegalArgumentException("UNKNOWN_ACTIVE_CODE"); };
    return new Board(row.boardId(), row.titleText().strip(), visibility, Instant.parse(row.createdText()));
  }
  static Optional<Response> toResponse(Board board) {
    return board.visibility() == Visibility.VISIBLE ? Optional.of(new Response(board.id(), board.title(), board.createdAt().toString())) : Optional.empty();
  }
  public static void main(String[] args) {
    Board visible = toDomain(new Row(5L, "  mapper boundary ", 0, "2026-03-04T05:06:07Z"));
    Board deleted = toDomain(new Row(6L, "hidden", 1, "2026-03-04T05:06:07Z"));
    System.out.println("domain=" + visible);
    System.out.println("public=" + toResponse(visible).orElseThrow());
    System.out.println("deleted-public=" + toResponse(deleted).isPresent());
    try { toDomain(new Row(7L, "bad", 9, "2026-03-04T05:06:07Z")); }
    catch (IllegalArgumentException error) { System.out.println("invalid-row=" + error.getMessage()); }
  }
}`, "domain=Board[id=5, title=mapper boundary, visibility=VISIBLE, createdAt=2026-03-04T05:06:07Z]\npublic=Response[id=5, title=mapper boundary, createdAt=2026-03-04T05:06:07Z]\ndeleted-public=false\ninvalid-row=UNKNOWN_ACTIVE_CODE", ["local-board-vo", "mybatis-mapper-xml", "java-record", "java-optional"] )],
    diagnostics: [
      d("column rename 뒤 일부 field만 null/default로 들어와 늦게 실패합니다.", "자동 매핑과 SELECT *에 의존하고 unmapped column/property를 검증하지 않았습니다.", ["actual SELECT columns", "resultMap/aliases", "auto-mapping warnings", "row fixture"], "명시 columns/aliases/resultMap 또는 constructor mapper를 사용하고 required field null을 즉시 거부합니다.", "schema/query/result mapping contract tests와 warning-as-error gate를 둡니다."),
      d("id/hit/date String parse가 controller마다 다르게 실패합니다.", "DB representation을 그대로 web/domain 전 계층에 전달했습니다.", ["field Java types", "parse sites", "TypeHandler", "DB metadata"], "row mapper/TypeHandler 한 곳에서 typed domain으로 바꾸고 invalid row를 persistence error로 분류합니다.", "boundary/min/max/null/timezone fixtures를 actual DB에서 실행합니다."),
    ],
    expertNotes: ["row model을 별도 class로 둘지 mapper가 domain constructor를 직접 부를지는 query complexity와 schema drift를 기준으로 결정합니다.", "MyBatis type alias는 편의 이름일 뿐 public domain boundary를 자동으로 만들지 않습니다."],
  },
  {
    id: "explicit-mapper-total-functions",
    title: "명시적 mapper를 total function에 가깝게 만들고 손실·default를 드러냅니다",
    lead: "reflection 기반 자동 복사는 이름이 같은 필드만 옮겨 nested value, enum, time, null과 보안 정책을 조용히 놓칩니다.",
    explanations: [
      "request→command/domain mapper는 validation된 transport value를 domain type으로 만들고, entity/row→domain mapper는 persistence codes와 nullability를 해석하며, domain→response mapper는 공개 projection을 수행합니다. 각 방향은 서로 다른 정책입니다.",
      "mapping은 가능한 한 pure function으로 만들어 fixed input에 fixed output/failure를 줍니다. generated id, current time, actor 같은 ambient 값은 service에서 명시적 parameter/port로 주입합니다.",
      "모든 source field를 복사하는 것이 완전한 mapping은 아닙니다. 의도적으로 drop한 field, default한 field, rename/transform한 field를 checklist/schema mapping table에 기록해야 리뷰가 누락과 보안을 구분합니다.",
      "null은 unknown, absent, not applicable, legacy default 중 의미가 다릅니다. Optional을 field everywhere로 쓰기보다 boundary contract에서 required/optional/default/failure를 명시하고 domain invariant를 지킵니다.",
      "mapping failure에 raw payload/entity toString을 넣지 않습니다. operation, source schema version, field name과 stable category만 기록하고 민감 value는 drop합니다.",
    ],
    concepts: [
      c("explicit mapper", "field 선택과 변환을 코드로 명시해 review/test할 수 있게 한 boundary component입니다.", ["방향별로 둡니다.", "secret drop을 표현합니다."]),
      c("total mapping", "정의된 입력 domain의 모든 경우가 명시적 output 또는 typed failure를 가지는 mapping입니다.", ["silent null/default를 줄입니다.", "enum exhaustiveness가 도움됩니다."]),
      c("mapping manifest", "source→target field의 copy/rename/transform/drop/default와 owner를 기록한 표입니다.", ["schema review에 사용합니다.", "보안 근거가 됩니다."]),
    ],
    codeExamples: [java("crud01-explicit-mapper", "request→domain→response 완전 mapping", "Crud01ExplicitMapper.java", "fixed Clock/id와 typed value를 mapper 입력으로 주입해 동일 request가 deterministic domain/response를 만드는 경로를 실행합니다.", String.raw`import java.time.*;

public class Crud01ExplicitMapper {
  record Request(String writer, String title, String content) {}
  record Board(long id, String writer, String title, String content, Instant createdAt) {}
  record Response(long id, String writer, String title, String createdAt) {}
  static Board toDomain(Request request, long generatedId, Clock clock) {
    if (request.writer() == null || request.writer().isBlank()) throw new IllegalArgumentException("WRITER_REQUIRED");
    if (request.title() == null || request.title().isBlank()) throw new IllegalArgumentException("TITLE_REQUIRED");
    return new Board(generatedId, request.writer().strip(), request.title().strip(), request.content() == null ? "" : request.content(), clock.instant());
  }
  static Response toResponse(Board board) { return new Response(board.id(), board.writer(), board.title(), board.createdAt().toString()); }
  public static void main(String[] args) {
    Clock fixed = Clock.fixed(Instant.parse("2026-04-05T06:07:08Z"), ZoneOffset.UTC);
    Board board = toDomain(new Request(" learner ", " mapper ", null), 91L, fixed);
    System.out.println("domain=" + board);
    System.out.println("response=" + toResponse(board));
    System.out.println("content-public=false");
    try { toDomain(new Request("learner", " ", "x"), 92L, fixed); }
    catch (IllegalArgumentException error) { System.out.println("failure=" + error.getMessage()); }
  }
}`, "domain=Board[id=91, writer=learner, title=mapper, content=, createdAt=2026-04-05T06:07:08Z]\nresponse=Response[id=91, writer=learner, title=mapper, createdAt=2026-04-05T06:07:08Z]\ncontent-public=false\nfailure=TITLE_REQUIRED", ["spring-validation", "java-clock", "java-record", "owasp-mass-assignment"] )],
    diagnostics: [
      d("자동 mapper upgrade 후 password/internalStatus가 response에 추가됩니다.", "same-name reflection mapping에 ignore/allow-list policy가 없었습니다.", ["generated mapping code", "unmapped/implicit properties", "before/after schema", "response body"], "public mapper를 explicit allow-list로 바꾸고 unmapped target/source 정책을 fail-fast합니다.", "forbidden-field schema tests와 generated mapper diff review를 둡니다."),
      d("운영에서만 createdAt/id mapping test가 간헐적으로 달라집니다.", "mapper가 system clock/random/static state를 내부에서 읽습니다.", ["time/id call sites", "test clock", "parallel tests", "retry path"], "Clock/id를 service input으로 주입하고 mapper를 pure transformation으로 유지합니다.", "fixed clock/sequence property tests와 retry determinism을 둡니다."),
    ],
    expertNotes: ["MapStruct 같은 generator도 mapping policy를 명시하고 generated code를 검토하면 유용하지만 boundary 설계를 대신하지 않습니다.", "domain→response mapper가 authorization을 몰래 수행하지 않게 service가 허용된 projection context를 전달합니다."],
  },
  {
    id: "time-id-server-owned-fields",
    title: "식별자·시간·조회수·상태를 server-owned field로 고정합니다",
    lead: "클라이언트 입력과 저장된 결과를 같은 객체로 쓰면 누가 id/time/status를 만들었는지와 retry에서 값이 왜 달라졌는지 알 수 없습니다.",
    explanations: [
      "generated primary key는 repository/DB가 assignment하고 create response가 실제 저장된 id를 받습니다. temporary client correlation/idempotency key와 resource identity를 구분하고 외부 ID를 primary key에 무검증 대입하지 않습니다.",
      "createdAt/updatedAt의 clock owner, timezone, precision과 retry semantics를 정합니다. JVM Clock, database current timestamp, event time 중 하나를 use case별로 선택하고 cross-node clock skew를 운영합니다.",
      "hit/active/group/order/version 같은 state는 server policy와 atomic SQL이 관리합니다. request DTO에 같은 이름이 와도 무시하는 수준보다 binding schema에서 거부해 시도를 관측합니다.",
      "DB-generated/default field를 insert 뒤 response에서 필요하면 generated keys/RETURNING/reselect 전략과 transaction visibility를 명시합니다. 추정한 MAX(id)+1이나 입력 객체의 stale default를 반환하지 않습니다.",
      "server-owned field의 로그에는 raw actor/content 대신 operation, generated id presence, transition old/new category와 request correlation만 둡니다. sequential database id가 resource existence/volume을 노출하는 위험도 API threat model에서 평가합니다.",
    ],
    concepts: [
      c("server-owned field", "클라이언트가 결정하지 않고 domain/service/repository/DB가 규칙에 따라 생성·변경하는 field입니다.", ["id/time/status 등이 있습니다.", "request DTO에서 제외합니다."]),
      c("clock owner", "업무 timestamp의 기준 시각을 제공하고 precision/timezone/retry 의미를 책임지는 component입니다.", ["Clock 또는 DB가 될 수 있습니다.", "테스트 가능해야 합니다."]),
      c("generated identity", "저장 과정에서 database/provider/repository가 새 resource에 부여하는 식별자입니다.", ["실제 값을 readback합니다.", "다음 세션에서 HTTP Location과 연결합니다."]),
    ],
    diagnostics: [
      d("클라이언트가 hit/active를 보내 새 글이 관리자 상태로 생성됩니다.", "server-owned fields가 create object와 SQL parameter에 포함되었습니다.", ["request schema", "mapper parameter", "insert column list", "persisted row"], "create DTO/insert column allow-list에서 제외하고 DB/domain defaults를 사용합니다.", "extra-field attack와 inserted default assertions를 둡니다."),
      d("create response id/time이 DB row와 다릅니다.", "application이 id/time을 추정하거나 DB default를 insert 뒤 readback하지 않았습니다.", ["key generation strategy", "flush/RETURNING/reselect", "clock owner", "response mapping timing"], "실제 generated key/timestamp를 transaction 안에서 회수해 response를 만듭니다.", "DB별 generated-field integration tests와 retry tests를 둡니다."),
    ],
    expertNotes: ["UUID도 uniqueness/entropy/version/storage/index 특성이 있으므로 단순히 auto-increment보다 안전하다고 가정하지 않습니다.", "시간은 표시 format보다 먼저 event time, processing time, database commit time 중 어떤 의미인지 정합니다."],
  },
  {
    id: "sensitive-fields-file-boundary",
    title: "비밀번호·파일·개인정보를 일반 DTO field보다 더 좁은 수명으로 다룹니다",
    lead: "password와 MultipartFile을 게시글 객체에 오래 보관하면 toString, queue, cache, retry와 response mapping을 통해 원치 않는 경계로 전파됩니다.",
    explanations: [
      "평문 password/credential은 dedicated command field로 받아 validation 뒤 즉시 password encoder에 전달하고 entity에는 verifier/hash만 저장합니다. DTO/entity/log/exception의 자동 toString에서 모두 제외합니다.",
      "hash도 공개 response에 포함하지 않으며 verification 결과만 use case에 전달합니다. algorithm/cost upgrade와 legacy hash migration은 authentication policy가 소유하고 controller/mapper가 구현하지 않습니다.",
      "MultipartFile은 HTTP request-lifetime resource입니다. domain Board에 넣지 않고 UploadCommand/temporary handle로 검증·저장한 뒤 stable attachment metadata/key만 transaction/outbox policy에 전달합니다.",
      "DB insert와 file move는 하나의 ACID transaction이 아니므로 부분 실패를 고려합니다. temporary quarantine→validate→DB metadata→promote 또는 cleanup/reconciliation을 설계하고 원본 filename을 storage path로 사용하지 않습니다.",
      "PII/content는 logs와 metrics labels에 기록하지 않습니다. request size, field count, validation category, attachment media category와 stable operation만 관측하고 retention/access를 제한합니다.",
    ],
    concepts: [
      c("secret lifetime", "평문 비밀이 process memory와 object graph에 존재하는 최소 시간·범위입니다.", ["즉시 변환합니다.", "로그/응답에서 제외합니다."]),
      c("upload handle", "HTTP multipart resource를 영구 domain 객체와 분리해 임시 저장·검증·정리를 추적하는 식별자/lease입니다.", ["요청 수명입니다.", "cleanup owner가 필요합니다."]),
      c("compensating cleanup", "DB/file처럼 단일 transaction이 아닌 side effects 중 일부만 성공했을 때 남은 상태를 제거·완료하는 처리입니다.", ["idempotent해야 합니다.", "reconciliation을 둡니다."]),
    ],
    diagnostics: [
      d("validation error log에 평문 password/게시글 본문이 남습니다.", "DTO/entity 전체 toString 또는 raw binding error를 기록했습니다.", ["logger arguments", "generated toString", "error payload", "APM/span attributes"], "safe field-name/category schema로 바꾸고 노출 secret을 rotate하며 로그 접근/삭제를 수행합니다.", "synthetic secret canary가 모든 exporter에 0건인지 검사합니다."),
      d("DB insert 실패 뒤 업로드 파일이 고아로 남습니다.", "controller가 final path에 먼저 저장하고 transaction failure cleanup owner가 없습니다.", ["file/DB event order", "temporary/final paths", "exception branches", "orphan inventory"], "quarantine lease와 finally cleanup 또는 outbox/promote/reconciliation protocol을 적용합니다.", "각 단계 fault injection과 orphan count=0/known reconciliation test를 둡니다."),
    ],
    expertNotes: ["민감 field를 masking한 DTO로 복사하는 것보다 불필요한 계층에 아예 전달하지 않는 것이 우선입니다.", "파일 업로드 세부 검증은 CRUD07에서 확장하되 지금부터 domain model과 request resource를 분리합니다."],
  },
  {
    id: "schema-evolution-version-mapping",
    title: "DTO·domain·entity의 서로 다른 버전을 compatibility mapper로 진화시킵니다",
    lead: "API v2 field와 새 DB column을 한 번에 같은 class에 추가하면 구버전 client, rolling deployment와 historical row가 동시에 깨집니다.",
    explanations: [
      "request v1/v2와 response v1/v2가 필요한 기간을 명시하고 mapper가 version별 default/rename을 담당합니다. domain model은 가능한 한 하나의 의미로 유지하고 transport compatibility를 core에 새기지 않습니다.",
      "nullable DB migration은 expand→backfill→dual-read/compute→constraint→contract 단계로 진행합니다. 새 application이 old rows를 읽고 old application이 new rows를 읽는 rolling window를 테스트합니다.",
      "unknown enum/value는 default로 뭉개지 말고 compatibility policy에 따라 reject, preserve raw, UNKNOWN category 또는 feature gate를 선택합니다. 특히 권한/상태는 fail-open하지 않습니다.",
      "mapping manifest에 deprecated field, replacement, default source와 removal date/telemetry를 둡니다. client가 구 field를 실제 쓰는지 관측하되 payload value는 수집하지 않습니다.",
      "serialization snapshot만으로 domain behavior를 증명하지 못합니다. old/new request→domain invariant→old/new response와 old/new schema row를 교차하는 migration matrix를 실행합니다.",
    ],
    concepts: [
      c("compatibility mapper", "구·신 schema/DTO를 현재 domain 의미로 변환하거나 반대로 projection하는 version-aware 경계입니다.", ["default와 rename을 명시합니다.", "core model 오염을 줄입니다."]),
      c("expand-contract", "구·신 application이 공존할 수 있게 schema를 먼저 확장하고 migration 후 옛 구조를 제거하는 배포 절차입니다.", ["backfill을 포함합니다.", "rollback window를 둡니다."]),
      c("unknown value policy", "새 enum/code를 모르는 consumer가 reject/preserve/fallback 중 어떻게 행동할지 정한 호환 계약입니다.", ["보안 상태는 fail-closed합니다.", "telemetry를 둡니다."]),
    ],
    codeExamples: [java("crud01-schema-evolution", "v1/v2 request compatibility mapping", "Crud01SchemaEvolution.java", "서로 다른 request versions를 하나의 domain command로 명시적으로 mapping하고 v1 default와 v2 visibility를 확인합니다.", String.raw`public class Crud01SchemaEvolution {
  sealed interface Request permits V1, V2 {}
  record V1(String writer, String title) implements Request {}
  record V2(String writer, String title, String visibility) implements Request {}
  enum Visibility { PUBLIC, PRIVATE }
  record Command(String writer, String title, Visibility visibility, int sourceVersion) {}
  static Command map(Request request) {
    return switch (request) {
      case V1 v1 -> new Command(v1.writer(), v1.title(), Visibility.PUBLIC, 1);
      case V2 v2 -> new Command(v2.writer(), v2.title(), Visibility.valueOf(v2.visibility()), 2);
    };
  }
  public static void main(String[] args) {
    System.out.println("v1=" + map(new V1("learner", "legacy")));
    System.out.println("v2=" + map(new V2("learner", "modern", "PRIVATE")));
    try { map(new V2("learner", "bad", "ADMIN")); }
    catch (IllegalArgumentException error) { System.out.println("unknown-visibility=REJECTED"); }
    System.out.println("domain-variants=1");
  }
}`, "v1=Command[writer=learner, title=legacy, visibility=PUBLIC, sourceVersion=1]\nv2=Command[writer=learner, title=modern, visibility=PRIVATE, sourceVersion=2]\nunknown-visibility=REJECTED\ndomain-variants=1", ["spring-handler-methods", "java-record", "owasp-input-validation"] )],
    diagnostics: [
      d("rolling deployment 중 새 column null 때문에 old/new node가 번갈아 실패합니다.", "schema/app change를 lockstep으로 가정하고 compatibility window가 없습니다.", ["deployment versions", "schema null/default", "read/write paths", "rollback behavior"], "expand/backfill/dual-compatible release/constraint/contract 단계로 나누고 old-new matrix를 검증합니다.", "N-1/N/N+1 application-schema compatibility CI를 둡니다."),
      d("새 상태 값을 구버전이 ACTIVE로 처리해 권한이 열립니다.", "unknown enum을 permissive default로 매핑했습니다.", ["enum deserializer/mapper", "default branch", "authorization outcome", "telemetry"], "권한/상태 unknown은 fail-closed typed error로 처리하고 version negotiation을 적용합니다.", "unknown/future code security regression corpus를 둡니다."),
    ],
    expertNotes: ["DTO 버전은 클래스 이름보다 HTTP media/API version 정책과 함께 관리합니다.", "dual write는 두 저장소/column의 atomicity와 reconciliation이 필요하므로 단순 mapper 호출 두 번으로 끝내지 않습니다."],
  },
  {
    id: "boundary-testing-governance",
    title: "mapping·validation·serialization·persistence를 층별 contract로 검증합니다",
    lead: "getter/setter 단위 테스트만으로는 HTTP extra field, generated ID, DB null/type, secret response와 lazy serialization을 발견할 수 없습니다.",
    explanations: [
      "pure mapper/value object unit tests는 빠르게 정상·경계·invalid·unknown enum을 전수합니다. property-based tests로 trim/length/equality/round-trip invariant를 넓히되 security decisions는 명시 examples도 둡니다.",
      "web slice/MockMvc는 form/JSON binding, Bean Validation, unexpected fields, status/error schema와 serialization forbidden fields를 검증합니다. service/mapper 호출 count 0까지 확인해야 validation short-circuit가 증명됩니다.",
      "JPA integration은 actual provider와 database에서 generated identity, lifecycle callback, column null/length/time precision, proxy/equality와 transaction detach를 검증합니다. in-memory fake만으로 dialect behavior를 결론내리지 않습니다.",
      "MyBatis integration은 mapper namespace/id, #{binding}, exact columns/resultMap, type handlers, no row/null과 query count를 actual supported DB로 실행합니다. 원본 파일은 read-only provenance이며 maintained design과 구분합니다.",
      "release gate에는 mapping manifest diff, public schema diff, secret canary, old/new compatibility, query count와 source provenance hash를 포함합니다. 실패 artifact는 values 대신 category/field names와 synthetic data만 보존합니다.",
    ],
    concepts: [
      c("boundary contract test", "두 계층/시스템 사이의 input, output, failure와 side-effect를 실제 adapter 수준에서 검증하는 테스트입니다.", ["HTTP/DB/mapper별로 둡니다.", "unit test를 보완합니다."]),
      c("forbidden-field assertion", "응답·로그·저장 model에 나타나면 안 되는 field name/value pattern을 실패시키는 검사입니다.", ["secret canary를 사용합니다.", "exporter 끝까지 검사합니다."]),
      c("provenance", "학습 결론이 어떤 원본 file/version/hash와 공식 문서에서 왔는지 추적하는 정보입니다.", ["원본을 변경하지 않습니다.", "보완과 사실을 구분합니다."]),
    ],
    diagnostics: [
      d("unit tests는 통과하지만 실제 form/JSON에서 extra field가 entity에 bind됩니다.", "pure mapper만 테스트하고 Spring binder/serializer integration을 생략했습니다.", ["MockMvc payload", "binder config", "handler parameter", "persisted object"], "malicious form/JSON을 실제 handler에 보내 forbidden field와 mapper call/result를 검증합니다.", "Content-Type별 boundary corpus를 CI에 둡니다."),
      d("H2에서는 통과하지만 운영 DB에서 ID/time/length가 달라집니다.", "provider/dialect/schema 차이를 fake/in-memory DB가 숨겼습니다.", ["DB versions/dialects", "DDL metadata", "generated key timing", "timestamp/charset"], "지원 DB container/isolated schema에서 migration+mapping suite를 실행합니다.", "dialect/version matrix와 production-like collation/timezone gate를 둡니다."),
    ],
    expertNotes: ["경계 테스트는 모든 계층을 한 giant E2E로 묶기보다 failure localization이 가능한 adapter별 증거를 남깁니다.", "원본 학습 코드의 결함을 지우지 않고 provenance와 교정된 maintained example을 나란히 설명합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-board-vo", repository: "local learning archive", path: "2026-springmvc01/src/main/java/org/study/myproject01/board/vo/BoardVO.java", usedFor: ["legacy all-in-one mutable board/form/persistence shape audit"], evidence: "Read-only audit: 17 lines, 505 bytes, SHA-256 FE0034CD9BA6EB24118FF9E06F2A617A59C67468DBCE615B0C8090761CAA0A58." },
  { id: "local-guestbook-entity", repository: "local learning archive", path: "2026-spring-jpa-test/src/main/java/com/study/jpatest/guestbook/entity/GuestBook.java", usedFor: ["JPA entity, generated identity, pre-persist time and soft-delete provenance"], evidence: "Read-only audit: 61 lines, 1,495 bytes, SHA-256 BA0B75DD8DEA41B4A0DFD6F86D3F357ED9AADEF9B2EB336C00BD78B795F10ACF." },
  { id: "spring-controller", repository: "Spring Framework Reference", path: "Annotated Controllers", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html", usedFor: ["controller transport boundary"], evidence: "Spring Framework 공식 annotated controller reference입니다." },
  { id: "spring-handler-methods", repository: "Spring Framework Reference", path: "Handler Methods", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods.html", usedFor: ["request arguments, model and response values"], evidence: "Spring Framework 공식 handler method reference입니다." },
  { id: "spring-validation", repository: "Spring Framework Reference", path: "MVC Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["transport validation boundary"], evidence: "Spring Framework 공식 MVC validation reference입니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence Specification", path: "Persistence 3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["entity lifecycle and persistence context semantics"], evidence: "Jakarta Persistence 공식 specification입니다." },
  { id: "jakarta-entity", repository: "Jakarta Persistence API", path: "Entity", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/entity", usedFor: ["entity declaration contract"], evidence: "Jakarta Persistence 공식 Entity API입니다." },
  { id: "jakarta-id", repository: "Jakarta Persistence API", path: "Id", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/id", usedFor: ["persistent identity"], evidence: "Jakarta Persistence 공식 Id API입니다." },
  { id: "jakarta-generated-value", repository: "Jakarta Persistence API", path: "GeneratedValue", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/generatedvalue", usedFor: ["generated identity strategies"], evidence: "Jakarta Persistence 공식 GeneratedValue API입니다." },
  { id: "mybatis-mapper-xml", repository: "MyBatis 3 Reference", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["parameter/result mapping and generated keys"], evidence: "MyBatis 공식 mapper XML reference입니다." },
  { id: "owasp-mass-assignment", repository: "OWASP Cheat Sheet Series", path: "Mass Assignment", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html", usedFor: ["DTO allow-list and entity binding risk"], evidence: "OWASP 공식 Mass Assignment guidance입니다." },
  { id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input Validation", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allow-list validation and error handling"], evidence: "OWASP 공식 input validation guidance입니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["response/view output encoding"], evidence: "OWASP 공식 XSS prevention guidance입니다." },
  { id: "java-record", repository: "Java SE 21 API", path: "Record", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Record.html", usedFor: ["immutable carrier and value equality"], evidence: "Oracle JDK 공식 Record API입니다." },
  { id: "java-optional", repository: "Java SE 21 API", path: "Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["explicit absent read result"], evidence: "Oracle JDK 공식 Optional API입니다." },
  { id: "java-clock", repository: "Java SE 21 API", path: "Clock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html", usedFor: ["deterministic server-owned time"], evidence: "Oracle JDK 공식 Clock API입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-01-vo-dto-entity-boundaries", slug: "crud-01-vo-dto-entity-boundaries", courseId: "spring", moduleId: "spring-layered-crud", order: 1,
  title: "VO·DTO·Entity 역할과 경계 분리", subtitle: "만능 mutable bean을 request DTO·value/domain model·persistence row/entity·public response와 검증 가능한 mapping으로 분리합니다.", level: "중급", estimatedMinutes: 80,
  coreQuestion: "같은 게시글의 입력·업무·저장·출력 표현을 어떻게 분리해 mass assignment, secret 노출, persistence 결합과 schema drift를 막을까요?",
  summary: "두 로컬 원본을 read-only로 감사해 multipart·password·identifier·counter·persistence fields가 한 mutable board object에 모인 구조와 generated id·pre-persist time·soft-delete state를 가진 JPA entity를 provenance로 사용합니다. 이를 그대로 복제하지 않고 representation/change-axis map, request allow-list와 validation, public response/data minimization, immutable value object, domain state transitions, JPA lifecycle/proxy/equality, MyBatis row/result mapping, pure explicit mapping, server-owned identity/time/state, secret/upload lifetime, schema evolution과 HTTP/JPA/MyBatis contract testing으로 확장합니다. 일곱 JDK 21 예제는 mass assignment 차단, public projection, value invariant, entity identity transition, row mapping, explicit mapping과 version compatibility를 실제 실행합니다.",
  objectives: ["VO·DTO·Entity를 이름이 아닌 owner/lifecycle/change axis로 구분한다.", "request DTO allow-list와 transport/domain validation을 분리한다.", "public response에서 secret와 persistence state를 제거한다.", "value object invariant/equality와 domain state transition을 설계한다.", "JPA entity lifecycle과 MyBatis row mapping을 HTTP model에서 분리한다.", "explicit mapper의 transform/drop/default/failure를 검증한다.", "generated id/time/status와 secret/upload owner를 명확히 한다.", "schema evolution과 boundary test matrix를 release gate로 만든다."],
  prerequisites: [{ title: "@ControllerAdvice로 예외를 HTTP 계약으로 변환", reason: "binding/domain/persistence mapping 실패를 public HTTP error와 internal cause로 분리할 수 있어야 계층별 DTO boundary를 설계할 수 있습니다.", sessionSlug: "mvc-09-exception-handling" }],
  keywords: ["VO", "DTO", "Entity", "value object", "request DTO", "response DTO", "mapping boundary", "mass assignment", "JPA", "MyBatis", "generated id", "data minimization", "schema evolution", "secret redaction"], topics,
  lab: {
    title: "legacy 만능 BoardVO를 four-boundary model로 재구성하기",
    scenario: "form, domain, SQL row와 JSP/API response가 한 mutable object를 공유해 extra fields, password/log leak, String parse, soft-delete visibility와 schema migration 문제가 발생합니다.",
    setup: ["두 원본 파일은 read-only provenance로 보존하고 package/class literal을 maintained code에 복사하지 않습니다.", "CreateRequest, BoardTitle/WriterName, Board, BoardRow/Entity, BoardResponse와 UploadCommand의 field/owner/sensitivity 표를 만듭니다.", "synthetic secrets, unknown fields, Unicode boundary, transient/generated identity, active codes와 old/new schema rows를 fixture로 준비합니다.", "JDK exact examples와 별도로 MockMvc, actual JPA provider/MyBatis, supported DB container matrix를 준비합니다."],
    steps: ["원본 field를 input/domain/persistence/output/server-owned/secret/upload로 분류합니다.", "create request allow-list를 만들고 id/hit/active/hash extra fields를 거부합니다.", "transport validation 뒤 value objects/domain command로 mapping합니다.", "JPA entity/row의 id/time/status/null/type를 domain으로 mapping하고 invalid row를 분류합니다.", "domain에서 public response를 projection해 forbidden fields를 제거합니다.", "upload/password의 짧은 lifetime과 cleanup/encoding owner를 분리합니다.", "old/new request·response·schema compatibility mapper를 실행합니다.", "mapper/value property tests와 malicious field fixtures를 실행합니다.", "MockMvc binding/validation/serialization과 mapper call count를 확인합니다.", "JPA generated id/lifecycle/proxy/time과 MyBatis result mapping을 actual DB에서 검증합니다.", "response/log/APM에서 synthetic secret 0건, unexpected query 0건을 검사합니다.", "mapping/schema/provenance manifest와 rollback/migration gate를 제출합니다."],
    expectedResult: ["외부 입력은 허용 fields만 domain에 도달하고 server-owned/secret fields는 복사되지 않습니다.", "domain objects는 생성 순간 invariant를 만족하고 persistence invalid row는 typed failure가 됩니다.", "public response/view에는 hash/internal state/upload path가 없고 schema가 entity change와 독립적입니다.", "generated identity/time, JPA lifecycle, MyBatis result mapping과 old/new compatibility가 actual adapter tests로 증명됩니다.", "원본과 maintained design의 차이, hashes와 보완 범위가 재현 가능한 provenance로 남습니다."],
    cleanup: ["synthetic DB rows, persistence contexts, temporary upload handles와 test files를 제거합니다.", "logs/traces/test artifacts에서 synthetic secret와 raw body가 없는지 재검사합니다.", "test containers/schema와 executors를 종료하고 residual resources를 확인합니다.", "로컬 학습 원본 두 파일은 변경하지 않습니다."],
    extensions: ["MapStruct generated code의 unmapped/drop policy를 같은 manifest에 연결합니다.", "JSON Schema/OpenAPI consumer compatibility 검사를 추가합니다.", "JPA entity equality/proxy/provider matrix를 property test로 확장합니다.", "database expand-contract migration rehearsal과 rollback을 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java 예제를 실행하고 각 field가 어느 boundary에서 생성·검증·변환·drop되는지 표로 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "extra server fields가 ignored인지 확인합니다.", "response forbidden fields를 확인합니다.", "value equality와 invalid cases를 설명합니다.", "transient/generated identity transition을 설명합니다.", "row status mapping과 deleted absence를 설명합니다.", "explicit mapping과 v1/v2 defaults/unknown reject를 설명합니다."], hints: ["field마다 external input, server generated, DB only, public output, secret 중 하나 이상을 표시하세요."], expectedOutcome: "VO/DTO/entity를 class 이름이 아니라 executable boundary contract로 설명합니다.", solutionOutline: ["classify→allow→validate→map→persist→project→verify 순서입니다."] },
    { difficulty: "응용", prompt: "원본 BoardVO/GuestBook 구조를 HTTP·domain·JPA/MyBatis 네 경계로 리팩터링하는 설계와 tests를 만드세요.", requirements: ["원본은 read-only provenance로 사용합니다.", "request/response allow-list를 둡니다.", "value object/domain transitions를 정의합니다.", "entity/row mapping과 generated field owner를 둡니다.", "password/upload lifetime을 분리합니다.", "soft-delete visibility를 통일합니다.", "MockMvc/JPA/MyBatis/DB tests를 실행합니다.", "secret/schema compatibility gates를 포함합니다."], hints: ["모든 field를 그대로 옮기는 대신 각 경계에 정말 필요한 field를 먼저 지우며 설계하세요."], expectedOutcome: "변경·보안·실패가 경계 안에서 멈추는 layered data model이 완성됩니다.", solutionOutline: ["audit→partition→type→map→minimize→migrate→qualify 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 transport-domain-persistence mapping governance를 작성하세요.", requirements: ["model naming/owner/mutability glossary를 둡니다.", "mass assignment/secret/serialization rules를 둡니다.", "generated id/time/status owner를 정합니다.", "JPA/MyBatis adapter constraints를 둡니다.", "mapping manifest와 unknown/null policy를 정의합니다.", "version/schema expand-contract를 둡니다.", "unit/web/provider/DB/compatibility gates와 provenance를 포함합니다."], hints: ["복사된 field보다 의도적으로 drop/default/transform한 field를 더 엄격히 리뷰하세요."], expectedOutcome: "API와 DB가 독립적으로 진화하면서도 domain invariant와 public security가 유지되는 표준이 완성됩니다.", solutionOutline: ["define→classify→constrain→transform→expose→evolve→prove 순서입니다."] },
  ],
  nextSessions: ["crud-02-controller-service-mapper-flow"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["BoardVO.java는 read-only로 17 lines/505 bytes, SHA-256 FE0034CD9BA6EB24118FF9E06F2A617A59C67468DBCE615B0C8090761CAA0A58을 확인했습니다.", "GuestBook.java는 read-only로 61 lines/1,495 bytes, SHA-256 BA0B75DD8DEA41B4A0DFD6F86D3F357ED9AADEF9B2EB336C00BD78B795F10ACF를 확인했습니다.", "원본의 exact package/type/field literals는 maintained examples에 복사하지 않고 all-in-one mutable shape, generated identity, pre-persist timestamp와 soft-delete 구조만 provenance로 사용했습니다.", "원본이 다루지 않는 request/response allow-list, mass assignment, value invariants, public projection, entity equality/proxy, typed row mapping, schema compatibility와 secret/upload lifecycle은 현재 공식 Spring/Jakarta/MyBatis/JDK/OWASP 문서와 synthetic examples로 보강했습니다.", "JDK-only examples는 Spring binder/validation, actual JPA provider/persistence context와 MyBatis/DB integration behavior를 대체하지 않습니다."] },
});

export default session;
