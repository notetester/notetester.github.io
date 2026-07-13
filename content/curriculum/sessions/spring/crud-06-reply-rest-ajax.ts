import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + first, explanation: "JDK 21 records와 pure adapters로 nested identity, REST operation, JSON DTO, mutation result와 browser fetch state를 모델링합니다." },
      { lines: (first + 1) + "-" + second, explanation: "정상·validation·not-found·forbidden·conflict·HTTP error·out-of-order response 경로를 독립적으로 실행합니다." },
      { lines: (second + 1) + "-" + count, explanation: "실제 댓글·사용자·token·URL 값을 사용하지 않고 route template, status, code, generation과 row counts만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/MyBatis/DB/browser/network/credential 불필요"], command: "java " + filename },
    output: { value: output, explanation: ["stdout은 제시된 결과와 완전히 같아야 합니다.", "JDK-only 상태기는 실제 DispatcherServlet, JSON converter, browser Fetch/CORS/CSRF, MyBatis/JDBC transaction과 DOM을 대체하지 않습니다."] },
    experiments: [
      { change: "parent/child/actor, method/status/content type, version, request generation과 network failure를 바꿉니다.", prediction: "계약이 분리돼 있으면 각 실패는 stable server outcome과 client UI state로 한 번만 변환됩니다.", result: "status/code/write flag/render flag, affected rows와 accepted generation을 비교합니다." },
      { change: "동일 시나리오를 MockMvc와 실제 browser→Spring Security→controller→service→MyBatis→DB로 실행합니다.", prediction: "preflight/CSRF cookie/header, converter/validation, transaction, response body와 DOM event 증거가 추가됩니다.", result: "route template, request id, operation, statement, status와 client generation을 연결합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "nested-resource-identity",
    title: "댓글을 게시글 아래의 중첩 resource로 식별하고 parent-child 관계를 검증합니다",
    lead: "reply id만 맞거나 URL의 board id와 JSON body의 board id가 다를 때 어느 값을 믿는지 정하지 않으면 다른 게시글 댓글을 수정할 수 있습니다.",
    explanations: [
      "collection은 /boards/{boardId}/replies, item은 /boards/{boardId}/replies/{replyId}처럼 표현할 수 있습니다. path는 resource identity를, body는 변경 가능한 representation을 담으며 body의 parent/owner id를 신뢰하지 않습니다.",
      "Service command는 authenticated actor, parent key, reply key, allowed fields와 expected version을 받고 Mapper WHERE는 reply key와 parent scope, visibility/owner/version을 함께 적용합니다. child가 parent에 속하지 않으면 외부 NotFound 정책으로 축약할 수 있습니다.",
      "create 전에 parent 존재와 comment permission을 검사하고 foreign key로 invariant를 보강합니다. SELECT 후 INSERT 사이 삭제 race는 FK/transaction 결과로 다시 처리하며 raw constraint 정보를 외부에 노출하지 않습니다.",
      "원본 ReplyController와 ReplyMapper XML은 read-only 구조 감사에서 REST controller, 중첩 path 변수, JSON body와 select/insert/update/delete statements를 보여 줍니다. 전용 PUT/DELETE annotation과 ResponseEntity 계약이 확인됐다고 과장하지 않습니다.",
    ],
    concepts: [
      c("nested resource", "부모 resource의 맥락과 수명주기에 속한 collection/item을 계층 URI로 표현한 resource입니다.", ["parent key를 path에 둡니다.", "무한 중첩은 피합니다."]),
      c("identity consistency", "path, authenticated context와 persistence row의 parent/child identity가 서로 일치해야 한다는 불변식입니다.", ["body id를 신뢰하지 않습니다.", "IDOR를 막습니다."]),
      c("foreign-key backstop", "application 검사를 통과한 뒤에도 DB가 parent 존재와 참조 무결성을 강제하는 최종 제약입니다.", ["authorization을 대신하지 않습니다.", "race를 닫습니다."]),
    ],
    codeExamples: [java("crud06-nested-identity", "parent-child-actor identity 판정", "Crud06NestedIdentity.java", "parent 존재, reply-parent 일치와 owner를 순서대로 검사해 stable outcome을 반환합니다.", String.raw`public class Crud06NestedIdentity {
  enum Outcome { PARENT_NOT_FOUND, REPLY_NOT_FOUND, FORBIDDEN, OK }
  record Context(boolean parentExists, boolean replyExists, boolean sameParent, boolean owner) {}
  static Outcome check(Context c) {
    if (!c.parentExists()) return Outcome.PARENT_NOT_FOUND;
    if (!c.replyExists() || !c.sameParent()) return Outcome.REPLY_NOT_FOUND;
    if (!c.owner()) return Outcome.FORBIDDEN;
    return Outcome.OK;
  }
  public static void main(String[] args) {
    System.out.println("missing-parent=" + check(new Context(false,false,false,false)));
    System.out.println("wrong-parent=" + check(new Context(true,true,false,true)));
    System.out.println("other-owner=" + check(new Context(true,true,true,false)));
    System.out.println("ok=" + check(new Context(true,true,true,true)));
  }
}`, "missing-parent=PARENT_NOT_FOUND\nwrong-parent=REPLY_NOT_FOUND\nother-owner=FORBIDDEN\nok=OK", ["local-reply-controller", "local-reply-mapper", "spring-request-mapping", "mybatis-mapper-xml", "owasp-idor"])],
    diagnostics: [d("다른 게시글 path에 reply id만 바꿔 수정·삭제할 수 있습니다.", "DML이 reply id만 조건으로 사용하고 parent/actor identity를 body나 UI에 의존했습니다.", ["path/body ids", "security actor source", "service command", "SQL parent/owner predicates", "cross-parent tests"], "path parent+reply와 server actor를 typed command/WHERE에 강제하고 body identity fields를 제거합니다.", "wrong parent/owner/tenant, path-body mismatch와 guessable ids negative tests를 둡니다.")],
    expertNotes: ["외부에서 parent missing, child missing과 forbidden을 어떻게 축약할지는 존재 정보 노출 위험으로 결정합니다.", "nested URI는 persistence foreign key와 같을 필요는 없지만 application identity contract와 일치해야 합니다."],
  },
  {
    id: "rest-method-status-matrix",
    title: "댓글 CRUD의 method·URI·status·body·idempotency 행렬을 먼저 고정합니다",
    lead: "모든 action을 POST와 숫자 1/0 body로 처리하면 cache, retry, client 복구와 API 문서가 실제 의미를 알 수 없습니다.",
    explanations: [
      "collection GET은 목록 200, POST는 생성 201과 Location/representation을, item GET은 200/404, PUT/PATCH는 200 또는 204, DELETE는 204와 정책상 404를 사용합니다. 허용 method가 아니면 405와 Allow를 기대합니다.",
      "POST는 일반적으로 같은 요청 반복이 새 resource를 만들 수 있으므로 network retry에 operation/idempotency key 정책이 필요합니다. PUT/DELETE의 idempotent 의미도 외부 효과와 audit/event 중복을 자동으로 해결하지 않습니다.",
      "204에는 response body를 쓰지 않고 JSON body가 필요하면 200/201과 application/json을 사용합니다. 생성 Location은 server-side URI builder와 trusted origin/relative path로 만들며 client input을 raw 연결하지 않습니다.",
      "HTML/JSP 화면이 AJAX를 사용해도 API 계약은 독립적으로 검증합니다. JavaScript success callback이 호출됐다는 사실 대신 exact status, headers, media type와 schema를 테스트합니다.",
    ],
    concepts: [
      c("REST operation matrix", "resource별 HTTP method, success/error status, headers, body와 반복 의미를 표로 정의한 계약입니다.", ["client/server가 공유합니다.", "405를 포함합니다."]),
      c("idempotent method", "같은 의도를 여러 번 요청해도 의도된 server state 효과가 한 번과 같은 method 성질입니다.", ["응답은 달라질 수 있습니다.", "부수효과 중복을 따로 막습니다."]),
      c("Location", "생성되거나 다른 representation으로 안내할 target URI를 담는 response header입니다.", ["201/3xx에 사용합니다.", "안전하게 구성합니다."]),
    ],
    codeExamples: [java("crud06-rest-matrix", "댓글 REST method와 성공 응답 표", "Crud06RestMatrix.java", "LIST/CREATE/READ/UPDATE/DELETE operation을 method·success status·body 유무로 변환합니다.", String.raw`public class Crud06RestMatrix {
  enum Operation { LIST, CREATE, READ, UPDATE, DELETE }
  record Contract(String method, int status, boolean body) {}
  static Contract contract(Operation op) {
    return switch (op) {
      case LIST -> new Contract("GET", 200, true);
      case CREATE -> new Contract("POST", 201, true);
      case READ -> new Contract("GET", 200, true);
      case UPDATE -> new Contract("PATCH", 200, true);
      case DELETE -> new Contract("DELETE", 204, false);
    };
  }
  public static void main(String[] args) {
    for (Operation op : Operation.values()) System.out.println(op + "=" + contract(op));
    System.out.println("delete-body=false");
  }
}`, "LIST=Contract[method=GET, status=200, body=true]\nCREATE=Contract[method=POST, status=201, body=true]\nREAD=Contract[method=GET, status=200, body=true]\nUPDATE=Contract[method=PATCH, status=200, body=true]\nDELETE=Contract[method=DELETE, status=204, body=false]\ndelete-body=false", ["spring-response-body", "spring-response-entity", "rfc-http-semantics"])],
    diagnostics: [d("삭제가 200과 숫자 1 body, 204와 JSON body 등 endpoint마다 다르게 응답합니다.", "operation matrix 없이 mapper 반환값을 그대로 직렬화했습니다.", ["route inventory", "methods/statuses", "Content-Type/body", "retry behavior"], "resource별 exact method/status/header/schema를 정하고 application outcome을 controller가 변환합니다.", "success·not-found·invalid·conflict·405의 contract snapshots를 둡니다.")],
    expertNotes: ["REST는 URL 모양보다 resource와 HTTP semantics를 일관되게 지키는 계약입니다.", "status만으로 충분하지 않으면 stable problem code와 retryability를 함께 제공합니다."],
  },
  {
    id: "json-dto-message-conversion-validation",
    title: "JSON을 operation-specific DTO로 변환하고 validation·unknown field·media type을 통제합니다",
    lead: "RequestBody를 persistence VO에 바로 역직렬화하면 owner, id, role, version과 audit fields까지 mass assignment 대상이 됩니다.",
    explanations: [
      "CreateReplyRequest와 UpdateReplyRequest는 클라이언트가 보낼 수 있는 content 등 최소 필드만 가집니다. parent/reply key는 path, actor는 security context, timestamps/version은 server/DB에서 가져옵니다.",
      "Content-Type application/json을 요구하고 Accept/produces를 명시해 unsupported media 415와 not acceptable 406을 구분합니다. malformed JSON/message conversion 실패와 Bean Validation 실패를 같은 generic 500으로 숨기지 않습니다.",
      "필수/길이/Unicode/control character와 domain policy를 검증하고 unknown property를 거부할지 API 호환성 정책으로 정합니다. JSON number precision, duplicate object names와 depth/size limits를 parser 설정과 tests에서 확인합니다.",
      "validation error response는 stable field/code를 제공하되 rejected raw content, stack trace와 serializer internals를 포함하지 않습니다. BindingResult/exception handler와 service call 0을 함께 검증합니다.",
    ],
    concepts: [
      c("message conversion", "HTTP body bytes와 Java request/response objects를 media type에 맞게 변환하는 Spring MVC 과정입니다.", ["HttpMessageConverter가 담당합니다.", "실패가 validation보다 먼저일 수 있습니다."]),
      c("operation DTO", "특정 create/update operation이 허용한 wire fields만 표현하는 입력·출력 type입니다.", ["entity와 다릅니다.", "over-posting을 줄입니다."]),
      c("JSON limit", "body bytes, nesting, collection, string length와 number 범위에 둔 parser/resource 상한입니다.", ["DoS를 줄입니다.", "RFC grammar보다 좁을 수 있습니다."]),
    ],
    codeExamples: [java("crud06-json-validation", "JSON DTO allow-list와 validation 결과", "Crud06JsonValidation.java", "역직렬화 이후 operation DTO의 content와 unknown field 여부를 검증해 service call 가능성을 분류합니다.", String.raw`import java.util.*;

public class Crud06JsonValidation {
  record Request(String content, Set<String> unknownFields) {}
  record Result(int status, String code, boolean serviceCall) {}
  static Result validate(Request request) {
    if (!request.unknownFields().isEmpty()) return new Result(400, "UNKNOWN_FIELD", false);
    if (request.content() == null || request.content().isBlank()) return new Result(400, "CONTENT_REQUIRED", false);
    if (request.content().length() > 200) return new Result(400, "CONTENT_TOO_LONG", false);
    return new Result(200, "VALID", true);
  }
  public static void main(String[] args) {
    System.out.println("unknown=" + validate(new Request("ok", Set.of("owner"))));
    System.out.println("blank=" + validate(new Request(" ", Set.of())));
    System.out.println("valid=" + validate(new Request("synthetic", Set.of())));
  }
}`, "unknown=Result[status=400, code=UNKNOWN_FIELD, serviceCall=false]\nblank=Result[status=400, code=CONTENT_REQUIRED, serviceCall=false]\nvalid=Result[status=200, code=VALID, serviceCall=true]", ["spring-request-body", "spring-message-converters", "spring-validation", "rfc-json"])],
    diagnostics: [d("JSON에 owner/version 같은 필드를 추가하자 저장 row가 바뀌거나 invalid body가 service까지 도달합니다.", "entity/VO direct binding, unknown field 정책과 validation short-circuit 부재입니다.", ["request DTO fields", "object mapper policy", "validation exception", "service/mapper calls"], "operation DTO와 explicit command mapping을 사용하고 invalid/malformed/media failures에서 downstream call을 0으로 만듭니다.", "unknown/duplicate/oversize/deep/malformed/415/406 corpus와 call-count tests를 둡니다.")],
    expertNotes: ["JSON RFC가 허용하는 모든 크기와 숫자 범위를 애플리케이션이 받아야 하는 것은 아닙니다.", "server response DTO도 내부 owner credential, moderation note와 persistence fields를 accidental serialization하지 않게 분리합니다."],
  },
  {
    id: "reply-mutation-row-version",
    title: "댓글 생성·수정·삭제에서 row count·version·중복 요청을 application outcome으로 변환합니다",
    lead: "Mapper가 반환한 숫자를 그대로 client에 보내면 0 rows가 missing, forbidden, stale 중 무엇인지 알 수 없고 2 rows도 성공처럼 처리될 수 있습니다.",
    explanations: [
      "create는 generated reply id와 committed representation을 반환하고 같은 operation key 중복을 탐지합니다. update/delete 단건은 key+parent+owner+version 조건과 affected rows 정확히 1을 요구합니다.",
      "0 rows는 외부 정보 노출 정책에 따라 NotFound 또는 Conflict로 변환하고 >1은 rollback과 integrity incident입니다. mapper statement success와 transaction commit, final readback을 구분합니다.",
      "update response는 새 version/ETag를 제공하고 stale request는 최신 내용을 자동 덮어쓰지 않습니다. delete 반복 요청의 외부 204 정책과 내부 audit/outbox deduplication을 함께 설계합니다.",
      "transaction은 reply row, counter와 outbox 같은 DB 변경을 service use case에 묶습니다. WebSocket/notification/cache invalidation 같은 외부 side effect는 after-commit/outbox와 idempotent consumer로 분리합니다.",
    ],
    concepts: [
      c("mutation outcome", "DML row count와 precondition을 Created/Updated/NotFound/Forbidden/Conflict/Integrity로 변환한 application 결과입니다.", ["숫자를 외부에 노출하지 않습니다.", "HTTP mapping의 입력입니다."]),
      c("reply version", "한 댓글 representation의 변경 순서를 나타내며 조건부 update/delete에 사용하는 server-owned token입니다.", ["stale write를 거절합니다.", "응답 ETag와 연결할 수 있습니다."]),
      c("operation key", "network retry로 같은 create 의도가 중복 실행되는 것을 식별하는 제한된 idempotency token입니다.", ["actor/scope에 묶습니다.", "만료·response replay가 필요합니다."]),
    ],
    codeExamples: [java("crud06-mutation-outcome", "row count와 version mutation 분류", "Crud06MutationOutcome.java", "expected/current version과 affected rows를 conflict/success/integrity 결과로 변환합니다.", String.raw`public class Crud06MutationOutcome {
  enum Outcome { STALE, NOT_CHANGED, UPDATED, INTEGRITY_ERROR }
  static Outcome update(long expected, long current, int rows) {
    if (expected != current) return Outcome.STALE;
    if (rows == 0) return Outcome.NOT_CHANGED;
    if (rows == 1) return Outcome.UPDATED;
    return Outcome.INTEGRITY_ERROR;
  }
  public static void main(String[] args) {
    System.out.println("stale=" + update(3, 4, 0));
    System.out.println("missing=" + update(4, 4, 0));
    System.out.println("updated=" + update(4, 4, 1));
    System.out.println("multiple=" + update(4, 4, 2));
  }
}`, "stale=STALE\nmissing=NOT_CHANGED\nupdated=UPDATED\nmultiple=INTEGRITY_ERROR", ["local-reply-mapper", "mybatis-mapper-xml", "mybatis-spring-transactions", "rfc-http-semantics"])],
    diagnostics: [d("update/delete 0 rows가 성공 UI가 되거나 create retry가 댓글을 두 개 만듭니다.", "affected rows와 operation/version precondition을 application outcome으로 변환하지 않았습니다.", ["operation key", "bound parent/owner/version", "affected/generated result", "commit/outbox"], "단건 rows==1과 version CAS를 강제하고 create deduplication 결과를 저장합니다.", "0/1/>1, stale, timeout-after-commit와 duplicate POST tests를 둡니다.")],
    expertNotes: ["숫자 1을 JSON success로 반환하는 것보다 resource representation/status/header 계약을 제공하는 편이 확장에 안전합니다.", "카운터 증가는 같은 transaction 또는 재계산 가능한 derived data로 일관성 정책을 둡니다."],
  },
  {
    id: "fetch-response-state-machine",
    title: "AJAX Fetch를 network·HTTP·media·schema·application 단계의 상태기로 처리합니다",
    lead: "fetch Promise는 404·500에서도 보통 resolve되므로 then이 실행됐다는 사실만으로 성공 UI를 표시하면 안 됩니다.",
    explanations: [
      "client는 request 생성/abort 뒤 network rejection과 resolved Response를 구분하고 status/ok, Content-Type, body parse와 application schema 순서로 확인합니다. 204에서 json을 무조건 파싱하지 않습니다.",
      "400 validation은 field feedback, 401/403은 인증/권한 UX, 404는 stale/missing item, 409/412는 refresh/merge, 429/503은 Retry-After와 bounded retry처럼 stable problem code를 UI state로 변환합니다.",
      "JSON parse 실패를 server business error와 섞지 않고 예상 media type이 아닌 HTML login/error page를 탐지합니다. raw response body와 token을 console/log에 출력하지 않습니다.",
      "button disable/spinner는 finally에서 복구하되 newer request 상태를 older request가 덮지 않게 generation을 확인합니다. retry는 method idempotency와 operation key를 알고 있을 때만 수행합니다.",
    ],
    concepts: [
      c("fetch state machine", "idle→pending→HTTP/media/schema→success/error/aborted 전이를 명시한 client request 모델입니다.", ["network와 HTTP error를 구분합니다.", "UI race를 막습니다."]),
      c("response classification", "status, headers, media type와 schema를 확인해 UI가 처리할 안정된 결과로 바꾸는 과정입니다.", ["ok만으로 부족할 수 있습니다.", "204를 구분합니다."]),
      c("problem code", "status보다 세부적인 application failure를 client가 안정적으로 분기하도록 제공하는 machine-readable code입니다.", ["문구와 분리합니다.", "versioning이 필요합니다."]),
    ],
    codeExamples: [java("crud06-fetch-classification", "Fetch 응답 단계 분류", "Crud06FetchClassification.java", "network 실패, 204, JSON 400, HTML 500과 JSON 200을 browser-independent state로 분류합니다.", String.raw`public class Crud06FetchClassification {
  enum State { NETWORK_ERROR, NO_CONTENT, API_ERROR, MEDIA_ERROR, SUCCESS }
  record Input(boolean network, int status, String media) {}
  static State classify(Input in) {
    if (!in.network()) return State.NETWORK_ERROR;
    if (in.status() == 204) return State.NO_CONTENT;
    if (!"application/json".equals(in.media())) return State.MEDIA_ERROR;
    if (in.status() < 200 || in.status() >= 300) return State.API_ERROR;
    return State.SUCCESS;
  }
  public static void main(String[] args) {
    System.out.println("offline=" + classify(new Input(false,0,"")));
    System.out.println("deleted=" + classify(new Input(true,204,"")));
    System.out.println("invalid=" + classify(new Input(true,400,"application/json")));
    System.out.println("html-error=" + classify(new Input(true,500,"text/html")));
    System.out.println("ok=" + classify(new Input(true,200,"application/json")));
  }
}`, "offline=NETWORK_ERROR\ndeleted=NO_CONTENT\ninvalid=API_ERROR\nhtml-error=MEDIA_ERROR\nok=SUCCESS", ["fetch-standard", "spring-error-responses", "spring-response-entity"])],
    diagnostics: [d("404/500인데 성공 토스트가 뜨거나 204에서 JSON parse exception이 납니다.", "Promise resolve를 성공으로 간주하고 status/media/body 분기를 생략했습니다.", ["network rejection", "response status/ok", "Content-Type", "204 branch", "problem schema"], "fetch state machine에서 network→status→media→schema 순서로 분류하고 UI outcome을 한 곳에서 변환합니다.", "204, 400 JSON, 401 HTML, 404, 409, 429, 500와 offline exact client tests를 둡니다.")],
    expertNotes: ["HTTP error body parsing도 실패할 수 있으므로 fallback은 안전한 generic message와 request id만 사용합니다.", "client retry는 Retry-After만 보고 자동 수행하지 않고 mutation 중복 안전성을 먼저 확인합니다."],
  },
  {
    id: "client-race-abort-optimistic-ui",
    title: "요청 generation·AbortController·rollback으로 늦은 응답과 optimistic UI race를 통제합니다",
    lead: "빠르게 page를 바꾸거나 댓글을 연속 수정하면 먼저 보낸 요청이 늦게 도착해 최신 화면을 과거 데이터로 되돌릴 수 있습니다.",
    explanations: [
      "각 list/load operation에 monotonically increasing generation을 부여하고 response 적용 전에 current generation과 비교합니다. 새 요청 시작 시 이전 fetch를 abort하되 server mutation은 이미 실행됐을 수 있음을 인지합니다.",
      "optimistic create/update/delete는 temporary key, pending state와 이전 snapshot을 보존하고 성공 representation으로 치환하거나 실패 시 rollback합니다. 409/412는 단순 rollback보다 최신 재조회와 사용자 비교가 필요합니다.",
      "같은 button을 disable해도 여러 tab, retry와 background refresh가 존재합니다. server idempotency/version/authorization이 최종 안전 경계이며 client lock은 UX 보조입니다.",
      "DOM node가 제거된 뒤 response callback이 접근하거나 component가 unmount된 뒤 state를 바꾸지 않도록 lifecycle cleanup을 둡니다. abort와 genuine network error를 사용자 메시지에서 구분합니다.",
    ],
    concepts: [
      c("request generation", "동일 UI query의 요청 순서를 나타내며 최신 generation 응답만 state에 적용하는 client token입니다.", ["서버 version과 다릅니다.", "out-of-order를 막습니다."]),
      c("optimistic UI", "server commit 전에 예상 성공 상태를 먼저 화면에 적용하고 결과에 따라 확정·rollback하는 상호작용입니다.", ["이전 snapshot이 필요합니다.", "conflict UX가 필요합니다."]),
      c("abort", "client가 더 이상 response를 필요로 하지 않음을 fetch에 알리는 취소 신호입니다.", ["server rollback을 보장하지 않습니다.", "resource 정리에 유용합니다."]),
    ],
    codeExamples: [java("crud06-latest-response", "최신 generation만 UI에 적용", "Crud06LatestResponse.java", "요청 1 뒤 요청 2가 시작된 상황에서 1의 늦은 response를 버리고 2만 적용합니다.", String.raw`public class Crud06LatestResponse {
  static final class ViewState {
    int currentGeneration;
    String value = "initial";
    int begin() { return ++currentGeneration; }
    boolean apply(int generation, String next) {
      if (generation != currentGeneration) return false;
      value = next;
      return true;
    }
  }
  public static void main(String[] args) {
    ViewState state = new ViewState();
    int first = state.begin();
    int second = state.begin();
    System.out.println("late-first=" + state.apply(first, "old"));
    System.out.println("second=" + state.apply(second, "new"));
    System.out.println("value=" + state.value);
    System.out.println("current-generation=" + state.currentGeneration);
  }
}`, "late-first=false\nsecond=true\nvalue=new\ncurrent-generation=2", ["fetch-standard", "spring-mockmvc", "spring-cors", "spring-security-csrf", "owasp-xss", "owasp-csrf"])],
    diagnostics: [d("검색/댓글 목록이 잠시 최신이었다가 과거 응답으로 되돌아갑니다.", "out-of-order responses를 request identity 없이 도착 순서대로 적용했습니다.", ["request start/finish generations", "abort lifecycle", "state apply guard", "component lifetime"], "operation별 generation과 latest-only apply를 사용하고 이전 요청을 abort/cleanup합니다.", "response 순서를 역전한 deterministic client test와 unmount/abort tests를 둡니다.")],
    expertNotes: ["AbortController는 이미 DB에 도달한 mutation을 취소/rollback하는 protocol이 아닙니다.", "optimistic UI가 서버 authorization/error를 숨기지 않게 pending·failed·conflict 상태를 명확히 표시합니다."],
  },
  {
    id: "dom-rendering-xss-accessibility",
    title: "댓글 text를 text node로 렌더링하고 event·접근성·CSP 경계를 지킵니다",
    lead: "서버에서 받은 JSON이 신뢰된다는 가정으로 innerHTML에 넣으면 저장형 XSS가 모든 열람자 세션에서 실행될 수 있습니다.",
    explanations: [
      "댓글 본문은 textContent/createTextNode 또는 framework의 기본 escaping을 사용합니다. HTML을 정말 허용한다면 검증된 sanitizer와 좁은 policy, URL protocol allow-list를 server/client 양쪽에서 사용합니다.",
      "HTML escaping, JavaScript string escaping, URL encoding과 JSON serialization은 context가 다릅니다. 한 번 escape한 문자열을 여러 context에 재사용하거나 double encoding으로 원문을 손상시키지 않습니다.",
      "동적 reply items의 수정·삭제 button은 data attributes를 trusted identity로 보지 않고 server가 재검증합니다. event delegation을 쓰면 target.closest와 container containment를 확인하고 keyboard/focus/aria-live feedback을 제공합니다.",
      "CSP는 XSS 완화의 추가 계층이며 inline handler/unsafe-eval 의존을 제거합니다. server response에 secret/token을 DOM dataset이나 error message로 넣지 않습니다.",
    ],
    concepts: [
      c("output encoding", "값이 들어갈 HTML/attribute/URL/JavaScript context에 맞게 제어 문자를 안전한 표현으로 바꾸는 방어입니다.", ["context별로 다릅니다.", "validation을 대신하지 않습니다."]),
      c("text node rendering", "사용자 문자열을 markup으로 해석하지 않고 DOM text로 삽입하는 방식입니다.", ["댓글 기본값입니다.", "stored XSS를 줄입니다."]),
      c("event delegation", "상위 container 한 곳에서 bubbling event를 받아 동적 child action을 처리하는 패턴입니다.", ["target 검증이 필요합니다.", "접근성을 별도 보장합니다."]),
    ],
    diagnostics: [d("특수한 댓글을 조회하면 script가 실행되거나 DOM 구조가 깨집니다.", "JSON content를 innerHTML/template 문자열로 삽입하고 context-safe rendering이 없습니다.", ["render sink", "sanitizer policy", "attribute/URL contexts", "CSP report"], "plain content는 textContent로 렌더링하고 허용 HTML은 검증된 sanitizer+좁은 policy를 사용합니다.", "stored/reflected DOM XSS corpus와 CSP violation, keyboard/focus regression tests를 둡니다.")],
    expertNotes: ["서버가 JSON으로 올바르게 escape해도 browser DOM sink 선택이 위험하면 XSS가 발생할 수 있습니다.", "댓글 markdown도 HTML renderer와 URL/image policy, sanitizer version을 가진 별도 feature입니다."],
  },
  {
    id: "authentication-csrf-cors",
    title: "cookie 인증 AJAX에서 CSRF token·SameSite·CORS origin·credentials를 하나의 정책으로 검증합니다",
    lead: "CORS를 허용하면 CSRF가 해결되거나 JSON 요청이면 자동 안전하다는 오해는 credentialed mutation을 공격에 노출합니다.",
    explanations: [
      "browser가 session cookie를 자동 전송하는 mutation은 Spring Security CSRF token을 header/body에 포함하고 server가 검증하게 합니다. token을 localStorage/log/URL에 노출하지 않고 framework가 제공하는 repository와 page/bootstrap 방식을 사용합니다.",
      "CORS는 다른 origin의 JavaScript가 response를 읽거나 특정 request를 보내도록 허용하는 browser 정책입니다. finite trusted origins/methods/headers를 사용하고 credentials와 wildcard를 결합하지 않습니다.",
      "preflight OPTIONS는 인증/CSRF chain 순서 때문에 막히지 않게 Spring MVC/Security 통합 설정을 검증합니다. curl 성공만으로 browser CORS 성공을 증명하지 않고 actual origin과 credentials mode에서 테스트합니다.",
      "SameSite cookie, Origin/Referer 검증과 custom headers는 defense in depth이며 XSS가 있으면 same-origin request를 수행할 수 있습니다. authorization과 object ownership은 모든 request에서 별도 강제합니다.",
    ],
    concepts: [
      c("CSRF token", "사용자의 인증 context와 연결된 예측 불가능 값을 mutation request에 요구해 cross-site 위조를 거절하는 방어입니다.", ["cookie와 별도 전달합니다.", "XSS를 막지는 못합니다."]),
      c("CORS preflight", "browser가 cross-origin non-simple request 전에 OPTIONS로 origin/method/headers 허용 여부를 확인하는 절차입니다.", ["server 설정이 필요합니다.", "인증과 순서를 검증합니다."]),
      c("credentialed request", "cookie나 HTTP authentication 같은 credentials를 포함하는 cross-origin request입니다.", ["wildcard origin과 주의합니다.", "CSRF 위험이 있습니다."]),
    ],
    diagnostics: [d("same-origin에서는 되지만 배포 UI의 AJAX만 CORS/403이고, wildcard 설정 뒤 보안 범위가 넓어졌습니다.", "preflight/security chain과 credentials/origin/CSRF 정책을 따로 조정했습니다.", ["Origin/preflight request", "allowed origins/methods/headers", "credentials mode", "CSRF token/cookie", "security order"], "finite origin과 explicit credential/CSRF policy를 통합하고 browser에서 preflight+actual request를 검증합니다.", "trusted/untrusted origin, missing/invalid token, wildcard+credentials와 OPTIONS security tests를 둡니다.")],
    expertNotes: ["CORS는 인증이나 authorization mechanism이 아니며 non-browser clients를 제한하지 않습니다.", "CSRF token value와 session id는 관측 event·error response·DOM dataset에 남기지 않습니다."],
  },
  {
    id: "reply-list-pagination-cache",
    title: "댓글 목록의 pagination·N+1·cache invalidation과 응답 순서를 관리합니다",
    lead: "게시글 상세마다 모든 댓글과 작성자 정보를 한 번에 읽거나 댓글별 추가 query를 수행하면 payload와 DB round trips가 선형 증가합니다.",
    explanations: [
      "댓글 collection에도 bounded size, deterministic order와 cursor/offset 정책을 적용합니다. parent key와 visibility를 항상 predicate에 포함하고 cursor는 order tuple과 parent/actor scope에 묶습니다.",
      "작성자 표시 등 연관 정보는 projection/join/batch로 필요한 필드만 가져오고 query budget을 둡니다. entity 전체와 private profile을 JSON에 직렬화하지 않습니다.",
      "create/update/delete 뒤 cache는 parent collection, item과 count/version을 일관되게 invalidate/update해야 합니다. cache key에 authorization scope와 normalized pagination을 포함해 cross-user leak을 막습니다.",
      "client infinite scroll은 request generation과 deduplication set을 사용하되 server cursor가 누락 방지의 주 수단입니다. 새 댓글 삽입 위치, refresh button과 optimistic temporary item reconciliation을 정의합니다.",
    ],
    concepts: [
      c("reply projection", "댓글 목록에 필요한 공개 필드만 선택한 query/response shape입니다.", ["N+1과 과다 노출을 줄입니다.", "detail model과 다릅니다."]),
      c("query budget", "한 collection request의 허용 statement count, rows/bytes와 duration 범위입니다.", ["N+1을 탐지합니다.", "load gate가 됩니다."]),
      c("cache invalidation scope", "mutation 후 무효화해야 하는 parent collection, item, count와 variant key의 집합입니다.", ["authorization partition을 포함합니다.", "event/version과 연결합니다."]),
    ],
    diagnostics: [d("댓글 수가 늘자 query가 N+1로 증가하거나 삭제 댓글이 cache에서 계속 보입니다.", "list projection/query budget과 mutation별 cache invalidation scope가 없습니다.", ["statement count", "response fields/bytes", "cache keys", "create/update/delete events"], "bounded projection/batch query와 parent/item/count cache version/invalidation protocol을 적용합니다.", "0/1/large replies의 statement budget과 mutation 후 all variants visibility tests를 둡니다.")],
    expertNotes: ["댓글 total이 필요 없으면 size+1/cursor로 count query를 생략할 수 있습니다.", "cache가 source of truth처럼 보이지 않게 stale tolerance와 fallback/read repair를 정의합니다."],
  },
  {
    id: "error-observability-contract-tests",
    title: "server problem→client state를 추적하는 secret-zero 관측성과 계약 테스트를 완성합니다",
    lead: "브라우저 console, server log와 SQL log가 서로 다른 값과 문구만 남기면 한 실패를 연결하기 어렵고 content/token 유출 위험이 커집니다.",
    explanations: [
      "server-generated request id를 response problem과 safe logs에 넣고 controller route/method/status, service operation/outcome/version conflict, mapper statement/duration/rows/error category를 연결합니다. raw reply content, cookies, CSRF/JWT와 SQL binds는 제외합니다.",
      "client event는 operation, request generation, status/problem code, retry/rollback과 render outcome만 기록합니다. full URL/query, response body와 DOM text를 analytics에 보내지 않고 cardinality budget을 둡니다.",
      "MockMvc는 mapping, converters, validation, CSRF와 exact status/header/JSON schema를, service tests는 authorization/version/outbox를, mapper DB tests는 parent predicates/rows/order를, browser tests는 CORS/fetch/DOM/focus/race를 검증합니다.",
      "failure matrix에는 malformed JSON, 415/406, invalid/unauthenticated/forbidden/missing/stale, duplicate create, DB timeout/commit failure, wrong media/login HTML, offline/abort/out-of-order와 XSS payload를 포함합니다.",
    ],
    concepts: [
      c("cross-tier correlation", "browser operation, HTTP request, service transaction과 SQL statement evidence를 같은 bounded request context로 연결하는 관측 관계입니다.", ["credential이 아닙니다.", "raw content를 배제합니다."]),
      c("contract test", "method/status/header/media/schema와 server-client error mapping을 exact assertions로 고정하는 테스트입니다.", ["문구보다 stable code를 봅니다.", "consumer drift를 막습니다."]),
      c("secret-zero telemetry", "관측 pipeline에 credential, token, raw content와 직접 식별자를 기본적으로 넣지 않는 설계 원칙입니다.", ["allow-list schema를 씁니다.", "canary로 검증합니다."]),
    ],
    diagnostics: [d("AJAX 오류 원인을 찾으려다 console/APM에 댓글 원문과 CSRF/session token이 남았습니다.", "request/response/DTO 전체 직렬화와 계층별 correlation schema 부재입니다.", ["browser console/analytics", "controller logs", "SQL logger/APM", "export/retention"], "bounded route/operation/status/problem/statement/rows/request-generation fields만 허용하고 노출 token을 폐기합니다.", "synthetic secret/content canary 0건과 모든 failure matrix의 cross-tier correlation test를 둡니다.")],
    expertNotes: ["request id는 외부에서 공급된 값을 무조건 신뢰하거나 authorization key로 사용하지 않습니다.", "contract test는 JSON field 순서가 아니라 의미 schema, status/header와 forbidden field absence를 검증합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-reply-controller", repository: "local learning archive", path: "SPRING/MyWeb/src/main/java/.../controller/ReplyController.java", usedFor: ["legacy REST controller, nested path and request-body structure provenance"], evidence: "Read-only structural audit: 111 lines, 3,028 bytes, SHA-256 D728635E7D1BF2BB759A60A232E60EBDFF71BFC6A0877B334050BE8377690CD4." },
  { id: "local-reply-mapper", repository: "local learning archive", path: "SPRING/MyWeb/src/main/resources/sqlmap/ReplyMapper.xml", usedFor: ["legacy reply select/insert/update/delete mapped statement provenance"], evidence: "Read-only structural audit: 65 lines, 1,492 bytes, SHA-256 E21D5EB77A26CCC2C1231F9511659F9342984C2966D6C50F8BE43B598B37962A." },
  { id: "spring-request-mapping", repository: "Spring Framework Reference", path: "Mapping Requests", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", usedFor: ["nested paths and HTTP method mapping"], evidence: "Spring Framework 공식 request mapping 문서입니다." },
  { id: "spring-request-body", repository: "Spring Framework Reference", path: "RequestBody", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html", usedFor: ["JSON request conversion and validation"], evidence: "Spring Framework 공식 RequestBody 문서입니다." },
  { id: "spring-response-body", repository: "Spring Framework Reference", path: "ResponseBody and RestController", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html", usedFor: ["REST response serialization"], evidence: "Spring Framework 공식 ResponseBody 문서입니다." },
  { id: "spring-response-entity", repository: "Spring Framework Reference", path: "ResponseEntity", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html", usedFor: ["status, headers and body responses"], evidence: "Spring Framework 공식 ResponseEntity 문서입니다." },
  { id: "spring-message-converters", repository: "Spring Framework Reference", path: "HTTP Message Conversion", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html", usedFor: ["JSON media type conversion"], evidence: "Spring Framework 공식 HTTP message conversion 문서입니다." },
  { id: "spring-validation", repository: "Spring Framework Reference", path: "MVC Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["request validation failures"], evidence: "Spring Framework 공식 MVC validation 문서입니다." },
  { id: "spring-error-responses", repository: "Spring Framework Reference", path: "Error Responses", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["REST problem response mapping"], evidence: "Spring Framework 공식 REST error response 문서입니다." },
  { id: "spring-cors", repository: "Spring Framework Reference", path: "CORS", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html", usedFor: ["preflight, origins and credentialed requests"], evidence: "Spring Framework 공식 CORS 문서입니다." },
  { id: "spring-security-csrf", repository: "Spring Security Reference", path: "CSRF Protection", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html", usedFor: ["cookie-authenticated AJAX CSRF protection"], evidence: "Spring Security 공식 CSRF 문서입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework Reference", path: "MockMvc Overview", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc/overview.html", usedFor: ["controller contract testing"], evidence: "Spring Framework 공식 MockMvc 문서입니다." },
  { id: "mybatis-mapper-xml", repository: "MyBatis 3 Reference", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["reply mapped statements and row results"], evidence: "MyBatis 공식 mapper XML 문서입니다." },
  { id: "mybatis-spring-transactions", repository: "MyBatis-Spring Reference", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["reply mutation transaction participation"], evidence: "MyBatis-Spring 공식 transaction 문서입니다." },
  { id: "rfc-json", repository: "IETF RFC Editor", path: "RFC 8259 JSON", publicUrl: "https://www.rfc-editor.org/rfc/rfc8259.html", usedFor: ["JSON grammar and interoperability limits"], evidence: "IETF Internet Standard JSON 문서입니다." },
  { id: "rfc-http-semantics", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["methods, statuses, conditional and idempotent semantics"], evidence: "IETF Standards Track HTTP semantics입니다." },
  { id: "fetch-standard", repository: "WHATWG", path: "Fetch Standard", publicUrl: "https://fetch.spec.whatwg.org/", usedFor: ["browser fetch, CORS and response handling semantics"], evidence: "WHATWG 공식 Fetch Living Standard입니다." },
  { id: "owasp-idor", repository: "OWASP Cheat Sheet Series", path: "Insecure Direct Object Reference Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html", usedFor: ["parent/child object-level authorization"], evidence: "OWASP 공식 IDOR 방어 지침입니다." },
  { id: "owasp-xss", repository: "OWASP Cheat Sheet Series", path: "Cross Site Scripting Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["context-safe DOM output"], evidence: "OWASP 공식 XSS 방어 지침입니다." },
  { id: "owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site Request Forgery Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["AJAX CSRF defense in depth"], evidence: "OWASP 공식 CSRF 방어 지침입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-06-reply-rest-ajax", slug: "crud-06-reply-rest-ajax", courseId: "spring", moduleId: "spring-layered-crud", order: 6,
  title: "댓글 REST API와 AJAX CRUD", subtitle: "중첩 resource·JSON·HTTP 계약에서 Fetch 상태기, race/XSS, CSRF/CORS와 실제 계층 테스트까지 연결합니다.", level: "고급", estimatedMinutes: 100,
  coreQuestion: "댓글 CRUD를 안전한 nested REST/JSON 계약으로 만들고 browser의 비동기·보안·DOM 실패까지 서버 transaction과 어떻게 끝까지 연결할까요?",
  summary: "로컬 ReplyController.java와 ReplyMapper.xml을 read-only로 감사해 REST controller, request-body, nested path와 reply CRUD mapped statements의 구조를 provenance로 사용합니다. 원본에 전용 PUT/DELETE annotations, ResponseEntity, version/CSRF/CORS 계약이 이미 있다고 가정하지 않습니다. parent-child identity, method/status/body/idempotency matrix, operation JSON DTO·converter·validation limits, affected rows/version/deduplication, Fetch network/HTTP/media/schema 상태기, request generation/abort/optimistic rollback, text-node XSS 방어, cookie CSRF+CORS preflight, bounded reply list/cache, secret-zero cross-tier observability와 MockMvc/DB/browser failure matrix로 확장합니다. 여섯 JDK 21 예제는 identity, REST matrix, DTO validation, mutation outcome, fetch classification과 latest-response-only state를 exact output으로 증명합니다.",
  objectives: ["댓글 parent-child-resource identity와 object authorization을 강제한다.", "REST method·status·header·body·idempotency 계약을 표로 고정한다.", "operation-specific JSON DTO와 media/validation/parser limits를 적용한다.", "affected rows·version·operation key를 transaction-safe outcome으로 변환한다.", "Fetch의 network·HTTP·media·schema 결과를 안정된 client state로 분류한다.", "out-of-order/abort/optimistic UI와 DOM lifecycle을 통제한다.", "XSS·CSRF·CORS·credentials와 server authorization을 함께 검증한다.", "pagination/cache/관측성과 MockMvc·DB·browser failure matrix를 운영한다."],
  prerequisites: [{ title: "검색 조건·페이지 계산·목록 쿼리 계약", reason: "댓글 collection도 검색 목록과 같은 정렬·cursor·count/hasNext·concurrent drift 계약이 필요하고 AJAX client가 그 metadata를 소비합니다.", sessionSlug: "crud-05-search-pagination" }],
  keywords: ["nested resource", "REST CRUD", "JSON", "AJAX", "Fetch API", "RequestBody", "ResponseEntity", "optimistic UI", "XSS", "CSRF", "CORS", "request generation"], topics,
  lab: {
    title: "댓글 기능을 nested REST API와 race-safe AJAX client로 재구성하기",
    scenario: "기존 댓글 Controller/Mapper 흐름은 동작하지만 method/status/schema, version/row-count, browser error/race와 CSRF/CORS/DOM 경계가 하나의 검증 가능한 계약으로 정리되지 않았습니다.",
    setup: ["두 원본 파일은 read-only hash provenance로 고정하고 package, 실제 path/table/content/identity/configuration 값을 복제하지 않습니다.", "nested route와 Create/Update request, Reply response, Problem schema 및 application outcomes를 정의합니다.", "parent/reply/actor/version/visibility와 operation key를 가진 synthetic DB fixtures를 준비합니다.", "MockMvc+Spring Security CSRF, actual MyBatis/DB와 test browser origin/client harness를 준비합니다."],
    steps: ["parent collection/item identity와 path-body mismatch 정책을 고정합니다.", "GET/POST/PATCH/DELETE status/header/body/idempotency matrix를 작성합니다.", "operation DTO, JSON media, unknown/depth/size와 validation call-0을 구현합니다.", "service authorization, version/affected rows와 transaction/outbox를 연결합니다.", "create retry operation key와 delete repeated side-effect deduplication을 검증합니다.", "Fetch network→status→media→schema 상태기와 safe problem mapping을 구현합니다.", "generation/abort/optimistic pending/rollback/conflict UI를 역순 response로 검증합니다.", "content를 text node로 렌더링하고 event/focus/aria-live와 XSS corpus를 검사합니다.", "trusted/untrusted origin, preflight, credentials와 CSRF token matrix를 실행합니다.", "댓글 cursor/list projection, statement/row/payload와 cache invalidation budget을 적용합니다.", "server-client safe correlation과 secret/content canary 0건을 확인합니다.", "MockMvc·service·mapper/DB·browser/failure evidence와 runbook을 제출합니다."],
    expectedResult: ["wrong parent/actor와 body identity fields는 mutation을 수행하지 않고 정보 노출 정책대로 응답합니다.", "각 operation은 exact method/status/header/media/schema를 지키며 invalid JSON은 downstream call 0입니다.", "mutation은 rows/version/commit과 response가 일치하고 duplicate retry가 추가 row/event를 만들지 않습니다.", "late/aborted/error responses가 최신 UI를 덮지 않고 content가 markup으로 실행되지 않습니다.", "trusted browser flow만 CORS/CSRF/authorization을 통과하며 telemetry에 content/token/credential이 없습니다."],
    cleanup: ["synthetic parent/replies, versions, operation keys, outbox와 cache entries를 제거합니다.", "browser storage/DOM fixtures, cookies/tokens와 service workers/test origins를 정리합니다.", "logs/traces/analytics/artifacts에서 synthetic secret/content canary가 0건인지 확인합니다.", "connections, transactions, executors와 로컬 원본 두 파일을 원상 보존합니다."],
    extensions: ["WebSocket/SSE 실시간 댓글 events에 version/cursor/deduplication을 연결합니다.", "moderation/삭제 tombstone과 관리자 projection을 별도 authorization use case로 추가합니다.", "offline queue와 background sync의 operation-key conflict UX를 설계합니다.", "CSP Trusted Types와 sanitizer policy/version regression을 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java 예제를 실행해 nested identity, REST matrix, JSON validation, mutation rows, Fetch state와 latest-generation 결과를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "wrong-parent와 forbidden을 구분합니다.", "DELETE 204/body false를 확인합니다.", "invalid service call false를 확인합니다.", "0/1/>1 rows를 설명합니다.", "204/400/HTML/offline 분기를 확인합니다.", "late-first false와 latest value를 확인합니다."], hints: ["각 출력 앞에 server/controller/client/DOM owner를 표시하세요."], expectedOutcome: "AJAX 성공 callback이 아니라 end-to-end 계약으로 댓글 기능을 설명합니다.", solutionOutline: ["identify→map→convert→mutate→classify→apply 순서입니다."] },
    { difficulty: "응용", prompt: "MockMvc·지원 DB·browser에서 nested 댓글 CRUD와 failure matrix를 구현하세요.", requirements: ["path parent/child/actor를 검증합니다.", "exact REST/JSON/problem schema를 사용합니다.", "version/rows/operation key와 transaction을 검증합니다.", "Fetch state/generation/rollback을 구현합니다.", "text-node rendering과 XSS tests를 둡니다.", "CSRF/CORS/preflight matrix를 실행합니다.", "pagination/cache/observability budgets를 통과합니다."], hints: ["curl과 browser의 차이를 preflight, cookies, CSRF와 DOM 단계로 분리하세요."], expectedOutcome: "비동기·경쟁·보안·DB 실패에도 일관된 댓글 UX/API가 완성됩니다.", solutionOutline: ["scope→validate→authorize→commit→respond→render→prove 순서입니다."] },
    { difficulty: "설계", prompt: "조직용 REST+AJAX mutation release standard를 작성하세요.", requirements: ["resource/method/status/schema rules를 둡니다.", "DTO/JSON/validation limits를 둡니다.", "authorization/version/idempotency/transaction rules를 둡니다.", "Fetch/race/abort/optimistic UI rules를 둡니다.", "DOM/XSS/CSRF/CORS rules를 둡니다.", "pagination/cache/telemetry budgets를 둡니다.", "slice/DB/security/browser/failure gates를 포함합니다."], hints: ["server와 client 각각에서 동일 failure가 어떤 상태로 보이는지 쌍으로 적으세요."], expectedOutcome: "모든 JSON mutation과 browser consumer가 하나의 검증 가능한 표준으로 관리됩니다.", solutionOutline: ["contract→constrain→protect→synchronize→observe→qualify 순서입니다."] },
  ],
  nextSessions: ["crud-07-file-upload"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["ReplyController.java는 read-only로 111 lines/3,028 bytes와 SHA-256 D728635E7D1BF2BB759A60A232E60EBDFF71BFC6A0877B334050BE8377690CD4를 확인했습니다.", "ReplyMapper.xml은 read-only로 65 lines/1,492 bytes와 SHA-256 E21D5EB77A26CCC2C1231F9511659F9342984C2966D6C50F8BE43B598B37962A를 확인했습니다.", "원본에서 RestController, nested PathVariable, RequestBody와 reply CRUD statement 구조를 확인했지만 dedicated Put/Delete annotations, ResponseEntity, version, CSRF/CORS와 modern client state machine이 있다는 가정은 하지 않았습니다.", "실제 package, route, table/column, 댓글·사용자 값, token/secret와 configuration literal은 maintained examples에 복제하지 않았습니다.", "JDK-only examples는 actual Spring message conversion/security filter chain, browser Fetch/CORS/DOM, MyBatis/JDBC transaction과 DB constraints를 대체하지 않습니다."] },
});

export default session;
