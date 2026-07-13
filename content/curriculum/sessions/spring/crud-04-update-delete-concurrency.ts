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
      { lines: "1-" + first, explanation: "JDK 21 records와 작은 in-memory port로 update/delete 입력, 저장 상태와 version 계약을 분리합니다." },
      { lines: (first + 1) + "-" + second, explanation: "정상·없음·권한 거부·stale version·예상 밖 영향 행을 독립 분기로 실행해 mutation 결과를 증명합니다." },
      { lines: (second + 1) + "-" + count, explanation: "실제 제목·본문·사용자 값 대신 outcome, version, affected rows와 retry 여부만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/MyBatis/DB/network/credential 불필요"], command: "java " + filename },
    output: { value: output, explanation: ["stdout은 제시된 결과와 완전히 같아야 합니다.", "in-memory 예제는 실제 DB 격리, Spring transaction proxy, JDBC affected-row와 HTTP precondition 처리를 대신하지 않습니다."] },
    experiments: [
      { change: "expected version, actor, affected rows와 재시도 횟수를 경계값으로 바꿉니다.", prediction: "명시된 mutation 계약은 성공과 not-found, forbidden, conflict, integrity failure를 섞지 않습니다.", result: "outcome, 새 version, 저장 상태와 side-effect call count를 비교합니다." },
      { change: "동일 시나리오를 MockMvc→service transaction proxy→MyBatis mapper→지원 DB로 실행합니다.", prediction: "HTTP status/ETag, bound version predicate, row count, commit/rollback과 final readback 증거가 추가됩니다.", result: "동일 request id로 handler, transaction, statement, rows와 response를 연결합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "mutation-contract-and-state-transition",
    title: "수정·삭제를 단순 SQL이 아니라 전제조건이 있는 상태 전이로 정의합니다",
    lead: "버튼을 눌렀고 예외가 없었다는 사실은 대상·권한·기대 버전·변경 필드·영향 행이 모두 맞았다는 뜻이 아닙니다.",
    explanations: [
      "update use case는 actor, resource key, 허용된 변경 command와 expected version을 받아 현재 상태를 읽거나 조건부 DML을 수행하고 Updated, NotFound, Forbidden, Conflict 같은 닫힌 결과를 반환합니다. delete도 hard/soft 정책, 소유권, 종속 관계와 반복 요청 의미를 먼저 정합니다.",
      "Controller는 HTTP path/header/body를 typed command로 변환하고 Service는 authorization과 상태 전이 불변식 및 transaction을 소유하며 Mapper는 key·version·visibility를 WHERE 조건으로 묶고 affected rows를 반환합니다. 어느 계층도 0 rows를 무조건 성공으로 숨기지 않습니다.",
      "원본 Controller·Service·Mapper XML은 read-only 구조 감사에서 여러 수정형 statement와 상태 변경 호출을 보여 주지만 service transaction annotation과 version predicate는 확인되지 않았습니다. 학습자료는 이 관찰을 현대적 동시성 계약이 이미 있다는 증거로 과장하지 않습니다.",
      "mutation matrix에는 입력 validation, 대상 없음, actor 불일치, 이미 삭제됨, stale version, DB constraint, deadlock/timeout, commit failure와 response write failure를 넣습니다. 각 행마다 DML calls, affected rows, rollback과 공개 error를 기록합니다.",
    ],
    concepts: [
      c("mutation contract", "변경 요청의 입력, 전제조건, 상태 전이, 결과와 부수효과를 함께 정의한 계약입니다.", ["HTTP와 persistence 양쪽에 투영됩니다.", "실패 분류를 포함합니다."]),
      c("state transition", "허용된 현재 상태에서 규칙을 만족할 때만 다음 상태로 이동하는 원자적 변화입니다.", ["불변식을 보존합니다.", "version을 증가시킬 수 있습니다."]),
      c("precondition", "변경 전에 대상·소유권·버전·상태가 기대와 일치해야 한다는 조건입니다.", ["SQL WHERE에 포함할 수 있습니다.", "HTTP 조건부 요청과 연결됩니다."]),
    ],
    codeExamples: [java("crud04-mutation-matrix", "mutation 결과를 닫힌 outcome으로 분류", "Crud04MutationMatrix.java", "검증·존재·권한·버전·영향 행의 평가 순서를 pure function으로 실행합니다.", String.raw`public class Crud04MutationMatrix {
  enum Outcome { INVALID, NOT_FOUND, FORBIDDEN, CONFLICT, UPDATED, INTEGRITY_ERROR }
  record Input(boolean valid, boolean exists, boolean owner, long expected, long actual, int rows) {}
  static Outcome decide(Input in) {
    if (!in.valid()) return Outcome.INVALID;
    if (!in.exists()) return Outcome.NOT_FOUND;
    if (!in.owner()) return Outcome.FORBIDDEN;
    if (in.expected() != in.actual()) return Outcome.CONFLICT;
    if (in.rows() == 1) return Outcome.UPDATED;
    if (in.rows() == 0) return Outcome.CONFLICT;
    return Outcome.INTEGRITY_ERROR;
  }
  public static void main(String[] args) {
    System.out.println("invalid=" + decide(new Input(false,true,true,2,2,1)));
    System.out.println("missing=" + decide(new Input(true,false,true,2,2,0)));
    System.out.println("forbidden=" + decide(new Input(true,true,false,2,2,0)));
    System.out.println("stale=" + decide(new Input(true,true,true,1,2,0)));
    System.out.println("updated=" + decide(new Input(true,true,true,2,2,1)));
    System.out.println("multiple=" + decide(new Input(true,true,true,2,2,2)));
  }
}`, "invalid=INVALID\nmissing=NOT_FOUND\nforbidden=FORBIDDEN\nstale=CONFLICT\nupdated=UPDATED\nmultiple=INTEGRITY_ERROR", ["local-board-controller", "local-board-service", "local-board-mapper", "spring-request-mapping", "rfc-http-semantics"])],
    diagnostics: [d("수정 화면은 성공 메시지를 보였는데 실제 row는 바뀌지 않았습니다.", "service가 mapper 반환값을 무시하거나 mutation 전제조건을 단계별로 기록하지 않았습니다.", ["handler command", "authorization decision", "bound key/version", "affected rows", "commit outcome"], "mutation 결과를 typed outcome으로 만들고 정확히 1 row만 성공 처리합니다.", "정상·없음·권한·stale·0/1/>1 rows 계약 테스트를 둡니다.")],
    expertNotes: ["전제조건 순서는 정보 노출 정책에 영향을 주므로 외부 status와 내부 원인을 분리합니다.", "mutation success는 SQL 호출이 아니라 commit과 최종 상태까지 포함합니다."],
  },
  {
    id: "update-replacement-patch-allowlist",
    title: "전체 교체와 부분 수정을 구분하고 변경 필드를 allow-list로 제한합니다",
    lead: "폼이나 JSON 객체를 entity/VO에 그대로 바인딩하면 actor가 보내면 안 되는 owner, role, status, version까지 덮어쓸 수 있습니다.",
    explanations: [
      "PUT 스타일 교체는 표현 전체의 필수 필드와 누락 의미를, PATCH 스타일 부분 수정은 필드별 absent와 explicit null의 차이를 정의합니다. HTML form POST 수정이라도 application command에서는 UpdateTitleAndBody처럼 의도를 좁힐 수 있습니다.",
      "server-owned key, owner, audit timestamps, privilege, delete state와 version은 request body에서 받지 않고 authenticated actor와 현재 row에서 결정합니다. unknown property를 거부할지 무시할지도 API version 계약으로 고정합니다.",
      "dynamic update는 null인 필드를 생략하는 편의 기능만으로 PATCH가 되지 않습니다. null로 지우기, 미전송, 기본값, 빈 문자열을 구분하는 tri-state command와 validation이 필요하고 MyBatis set/if 조건은 그 결정 뒤에 위치합니다.",
      "수정 가능한 필드가 하나도 없는 command는 400 또는 no-op 정책을 명시합니다. no-op을 success로 처리한다면 version/updatedAt을 증가시키는지, audit event를 남기는지와 retry 의미까지 정합니다.",
    ],
    concepts: [
      c("field allow-list", "해당 use case에서 actor가 변경할 수 있다고 명시한 필드 집합입니다.", ["over-posting을 막습니다.", "역할별로 달라질 수 있습니다."]),
      c("tri-state field", "미전송, 명시적 null, 실제 값을 서로 다른 상태로 표현하는 부분 수정 입력입니다.", ["PATCH 의미를 보존합니다.", "serializer 설정을 검증합니다."]),
      c("server-owned field", "클라이언트 입력이 아니라 인증·정책·DB가 결정하는 key, owner, version, audit 값입니다.", ["body에서 제거합니다.", "로그에서도 보호합니다."]),
    ],
    diagnostics: [d("일반 사용자가 JSON에 상태나 소유자 필드를 추가해 변경했습니다.", "broad command/entity binding과 mass assignment allow-list 부재입니다.", ["request DTO fields", "object mapper unknown policy", "mapping code", "UPDATE SET columns"], "operation-specific request와 explicit mapping으로 허용 필드만 command에 넣습니다.", "forbidden/unknown field security tests와 generated SQL column assertion을 둡니다.")],
    expertNotes: ["DTO가 entity보다 필드가 적다는 사실만으로 안전하지 않으며 mapper 단계의 SET allow-list도 확인합니다.", "부분 수정은 wire format, validation과 persistence 표현을 모두 관통하는 계약입니다."],
  },
  {
    id: "affected-row-cardinality",
    title: "DML 영향 행 0·1·2 이상을 서로 다른 업무 결과로 해석합니다",
    lead: "update/delete 반환값을 boolean이나 void로 축소하면 대상 없음, 경쟁 변경과 잘못된 WHERE가 모두 같은 성공처럼 보입니다.",
    explanations: [
      "단일 resource mutation의 기대 cardinality는 보통 정확히 1입니다. 0은 id가 없거나 visibility/owner/version 전제조건이 실패한 것이며, 2 이상은 key/tenant 조건 누락이나 데이터 무결성 손상을 뜻합니다.",
      "0 rows의 내부 원인을 추가 SELECT로 구분하면 race가 새로 생길 수 있습니다. 외부에는 정책에 맞는 NotFound/Conflict를 반환하고 필요할 때 같은 transaction과 lock/snapshot에서 안전하게 원인을 조사합니다.",
      "JDBC/MyBatis update/delete 반환은 database/driver가 보고한 row count이며 DB 설정에 따라 matched rows와 changed rows 의미 차이가 있을 수 있습니다. 실제 지원 DB와 driver에서 no-op update를 포함한 통합 테스트가 필요합니다.",
      "batch result나 soft delete도 기대 cardinality를 명시합니다. bulk operation은 item별 결과, 전체 atomicity, partial success와 재시도 키를 별도 계약으로 두며 단일 resource API와 섞지 않습니다.",
    ],
    concepts: [
      c("affected rows", "DML 실행 결과로 driver가 보고하는 변경 또는 매칭 행 수입니다.", ["DB 설정을 확인합니다.", "업무 결과와 변환합니다."]),
      c("expected cardinality", "한 operation이 정상일 때 반드시 영향을 줘야 하는 행 수 범위입니다.", ["단건은 보통 1입니다.", "위반은 incident가 됩니다."]),
      c("no-op update", "요청 값이 현재 값과 같아 논리 상태 변화가 없는 수정입니다.", ["row count 의미가 다를 수 있습니다.", "version 정책을 정합니다."]),
    ],
    codeExamples: [java("crud04-affected-rows", "영향 행 cardinality 해석", "Crud04AffectedRows.java", "단건 수정·삭제 결과의 0/1/2 행을 stable application outcome으로 변환합니다.", String.raw`public class Crud04AffectedRows {
  enum Result { NOT_CHANGED, SUCCESS, CARDINALITY_BREACH }
  static Result interpret(int rows) {
    if (rows == 0) return Result.NOT_CHANGED;
    if (rows == 1) return Result.SUCCESS;
    return Result.CARDINALITY_BREACH;
  }
  public static void main(String[] args) {
    System.out.println("rows0=" + interpret(0));
    System.out.println("rows1=" + interpret(1));
    System.out.println("rows2=" + interpret(2));
    System.out.println("single-resource-expects=1");
  }
}`, "rows0=NOT_CHANGED\nrows1=SUCCESS\nrows2=CARDINALITY_BREACH\nsingle-resource-expects=1", ["local-board-mapper", "mybatis-mapper-xml", "mybatis-java-api"])],
    diagnostics: [d("WHERE 조건 실수로 여러 row가 바뀌었지만 정상 응답이 나갔습니다.", "expected cardinality를 선언하지 않고 rows>0을 성공으로 처리했습니다.", ["statement WHERE", "unique/tenant predicates", "returned count", "audit sample"], "단건 mutation은 rows==1만 성공시키고 >1이면 rollback과 integrity incident를 발생시킵니다.", "지원 DB에서 key/tenant 누락 fault injection과 >1 rollback test를 둡니다.")],
    expertNotes: ["affected rows는 중요한 증거지만 commit 완료와 post-state readback을 자동으로 보장하지 않습니다.", "0 rows를 구분하기 위한 read는 TOCTOU와 정보 노출을 함께 평가합니다."],
  },
  {
    id: "optimistic-version-predicate",
    title: "version을 WHERE 전제조건과 원자적 증가로 묶어 lost update를 차단합니다",
    lead: "두 사용자가 같은 화면을 열고 차례로 저장하면 마지막 요청이 먼저 저장된 변경을 조용히 덮어쓰는 lost update가 발생합니다.",
    explanations: [
      "읽기 결과에는 현재 version을 포함하고 수정 command는 expectedVersion을 전달합니다. SQL은 key와 version을 동시에 조건으로 사용하고 성공 시 version을 원자적으로 1 증가시키며 affected rows 1을 요구합니다.",
      "애플리케이션에서 SELECT한 뒤 Java if로 version을 비교하고 version 조건 없는 UPDATE를 하면 비교와 쓰기 사이 race가 남습니다. compare-and-set은 하나의 원자적 DML 또는 DB가 제공하는 locking primitive여야 합니다.",
      "stale 요청의 0 rows는 Conflict/Precondition Failed로 변환하고 최신 표현 또는 재조회 링크를 제공하되 상대 사용자의 값이나 존재 여부를 과도하게 노출하지 않습니다. 자동 merge는 필드 독립성과 business invariant가 증명될 때만 합니다.",
      "version은 monotonic counter, timestamp 또는 강한 validator로 표현할 수 있습니다. timestamp 정밀도와 clock, wraparound, bulk/background update, trigger가 version을 빠뜨리지 않는지 통합 테스트합니다.",
    ],
    concepts: [
      c("optimistic concurrency", "읽는 동안 lock을 유지하지 않고 쓰기 시 expected version 일치를 검사하는 충돌 제어입니다.", ["낮은 충돌에 적합합니다.", "stale write를 거절합니다."]),
      c("compare-and-set", "현재 값이 기대 값과 같을 때만 새 값으로 원자 변경하는 연산입니다.", ["WHERE version을 사용합니다.", "row count로 성공을 압니다."]),
      c("lost update", "나중 쓰기가 자신이 읽은 뒤 발생한 다른 쓰기를 인지하지 못하고 덮는 이상입니다.", ["version으로 탐지합니다.", "격리만으로 항상 방지되지 않습니다."]),
    ],
    codeExamples: [java("crud04-optimistic-version", "version compare-and-set", "Crud04OptimisticVersion.java", "한 사용자의 성공 뒤 같은 과거 version을 가진 요청이 충돌하고 최신 version 요청만 다시 성공하는 흐름을 실행합니다.", String.raw`public class Crud04OptimisticVersion {
  record Row(String value, long version) {}
  static final class Store {
    private Row row = new Row("draft", 3);
    synchronized boolean update(long expected, String value) {
      if (row.version() != expected) return false;
      row = new Row(value, row.version() + 1);
      return true;
    }
    Row read() { return row; }
  }
  public static void main(String[] args) {
    Store store = new Store();
    System.out.println("first=" + store.update(3, "first"));
    System.out.println("stale=" + store.update(3, "second"));
    System.out.println("latest=" + store.update(4, "merged"));
    System.out.println("row=" + store.read());
  }
}`, "first=true\nstale=false\nlatest=true\nrow=Row[value=merged, version=5]", ["spring-transactions", "mybatis-dynamic-sql", "rfc-http-conditional"])],
    diagnostics: [d("동시 편집에서 먼저 저장한 내용이 경고 없이 사라집니다.", "UPDATE WHERE에 expected version이 없거나 version 비교를 application read 뒤에만 수행했습니다.", ["read representation version", "command expectedVersion", "bound SQL WHERE", "affected rows"], "key+version 조건과 version increment를 단일 DML로 만들고 0 rows를 stale conflict로 처리합니다.", "barrier로 두 writers가 같은 version을 읽게 한 뒤 성공 1·conflict 1을 검증합니다.")],
    expertNotes: ["version conflict는 예외적인 서버 장애가 아니라 사용자에게 복구 선택을 제공해야 하는 예상 결과입니다.", "낙관적 잠금도 hot row 충돌이 많으면 retry 폭증을 일으키므로 workload를 측정합니다."],
  },
  {
    id: "http-preconditions-etag-if-match",
    title: "ETag·If-Match를 persistence version과 연결해 HTTP 경계에서 stale write를 표현합니다",
    lead: "body 안 version만 사용하면 intermediary/client contract가 숨고, If-Match만 확인한 뒤 SQL version 조건을 빼면 서버 내부 race를 막지 못합니다.",
    explanations: [
      "GET/detail 응답은 표현을 대표하는 strong ETag를 제공하고 PUT/PATCH/DELETE는 If-Match를 요구할 수 있습니다. header가 없으면 정책상 428, 일치하지 않으면 412를 사용하고 domain conflict와 구분합니다.",
      "ETag는 raw database sequence나 secret hash를 그대로 노출할 필요가 없습니다. stable opaque encoding을 사용하고 strong/weak validator 의미, representation variant와 content coding을 고려합니다.",
      "Controller가 If-Match 문법과 wildcard 정책을 검증해 expected version token으로 바꾸고 Service/Mapper는 동일 token을 원자적 WHERE 조건에 사용합니다. header 검사와 DB write 사이에서 다시 검증해야 합니다.",
      "HTML 폼은 hidden version과 CSRF token을 사용할 수 있지만 API와 같은 stale-write 불변식을 공유합니다. error response에는 최신 representation을 무조건 담지 않고 actor authorization 후 안전한 재조회 방법을 제공합니다.",
    ],
    concepts: [
      c("entity tag", "선택된 표현의 특정 버전을 식별하는 opaque HTTP validator입니다.", ["strong/weak 구분이 있습니다.", "조건부 요청에 사용합니다."]),
      c("If-Match", "현재 validator가 제시한 tag와 강하게 일치할 때만 method를 수행하게 하는 request precondition입니다.", ["lost update 방지에 적합합니다.", "SQL CAS와 연결합니다."]),
      c("precondition failed", "제시한 HTTP 조건이 현재 representation에 대해 거짓일 때의 412 결과입니다.", ["409와 구분합니다.", "mutation은 수행하지 않습니다."]),
    ],
    codeExamples: [java("crud04-etag-if-match", "If-Match 평가와 상태 분기", "Crud04EtagIfMatch.java", "필수 header 없음, stale tag와 일치 tag를 428/412/204로 분류합니다.", String.raw`public class Crud04EtagIfMatch {
  record Result(int status, boolean write) {}
  static Result evaluate(String ifMatch, String current) {
    if (ifMatch == null || ifMatch.isBlank()) return new Result(428, false);
    if (!ifMatch.equals(current)) return new Result(412, false);
    return new Result(204, true);
  }
  public static void main(String[] args) {
    System.out.println("missing=" + evaluate(null, "\"v7\""));
    System.out.println("stale=" + evaluate("\"v6\"", "\"v7\""));
    System.out.println("match=" + evaluate("\"v7\"", "\"v7\""));
    System.out.println("db-cas-still-required=true");
  }
}`, "missing=Result[status=428, write=false]\nstale=Result[status=412, write=false]\nmatch=Result[status=204, write=true]\ndb-cas-still-required=true", ["rfc-http-conditional", "rfc-precondition-required", "spring-response-entity"])],
    diagnostics: [d("If-Match가 맞았는데도 경쟁 요청의 최신 쓰기를 덮었습니다.", "header 비교 후 실제 UPDATE에는 version predicate가 없었습니다.", ["handler header parse", "service expected token", "SQL WHERE version", "concurrent timeline"], "HTTP validator와 DB compare-and-set token을 같은 mutation contract로 전달합니다.", "header match 직후 경쟁 write를 삽입해 DB CAS가 stale 요청을 거절하는 integration test를 둡니다.")],
    expertNotes: ["412, 409와 428은 product/API 정책에 따라 일관된 problem code와 문서가 필요합니다.", "ETag를 authorization 또는 confidentiality 장치로 오해하지 않습니다."],
  },
  {
    id: "delete-hard-soft-cascade",
    title: "hard delete·soft delete·보존·종속 관계를 명시적인 수명주기 정책으로 선택합니다",
    lead: "DELETE SQL 한 줄은 감사 보존, 복구, 외래키, 첨부파일과 검색 visibility를 설명하지 못합니다.",
    explanations: [
      "hard delete는 row를 물리 제거하고 soft delete는 deleted state/time/actor로 visibility를 바꿉니다. 법적 보존, 개인 정보 삭제, 복구 요구와 데이터 분류에 따라 선택하며 soft delete가 자동으로 더 안전한 것은 아닙니다.",
      "soft delete는 list/detail/count/search/update 모든 query에 동일 visibility predicate를 요구하고 unique key 재사용, index selectivity와 purge job을 설계해야 합니다. 관리자/audit 조회는 별도 authorization path를 둡니다.",
      "댓글·첨부·통계 같은 종속 resource는 DB foreign key cascade/restrict/set-null, application orchestration 또는 asynchronous cleanup 중 하나를 명시합니다. file/object store는 DB rollback에 참여하지 않으므로 outbox/cleanup retry가 필요합니다.",
      "DELETE 반복 요청을 204로 idempotent하게 보일지 두 번째에는 404/410을 반환할지 정합니다. 외부 response가 같아도 내부 audit event와 cleanup command는 중복 실행되지 않도록 idempotency key를 둡니다.",
    ],
    concepts: [
      c("soft delete", "row를 제거하지 않고 삭제 상태로 전환해 일반 조회에서 숨기는 정책입니다.", ["모든 query를 오염시킬 수 있습니다.", "purge 수명주기가 필요합니다."]),
      c("referential action", "부모 삭제 때 외래키가 자식 row를 제한·연쇄 삭제·null 처리하는 DB 동작입니다.", ["업무 정책과 일치해야 합니다.", "외부 파일에는 적용되지 않습니다."]),
      c("tombstone", "resource가 제거됐음을 제한된 기간이나 시스템 내부에서 나타내는 삭제 표식입니다.", ["동기화에 유용합니다.", "정보 노출을 통제합니다."]),
    ],
    codeExamples: [java("crud04-delete-policy", "soft delete와 반복 요청 정책", "Crud04DeletePolicy.java", "ACTIVE→DELETED 전이와 같은 delete 재요청에서 side effect를 한 번만 수행하는 정책을 실행합니다.", String.raw`public class Crud04DeletePolicy {
  enum State { ACTIVE, DELETED }
  record Result(int status, State state, int cleanupEvents) {}
  static Result delete(State current, int events) {
    if (current == State.DELETED) return new Result(204, State.DELETED, events);
    return new Result(204, State.DELETED, events + 1);
  }
  public static void main(String[] args) {
    Result first = delete(State.ACTIVE, 0);
    Result retry = delete(first.state(), first.cleanupEvents());
    System.out.println("first=" + first);
    System.out.println("retry=" + retry);
    System.out.println("event-once=" + (retry.cleanupEvents() == 1));
  }
}`, "first=Result[status=204, state=DELETED, cleanupEvents=1]\nretry=Result[status=204, state=DELETED, cleanupEvents=1]\nevent-once=true", ["local-board-mapper", "rfc-http-semantics", "spring-transactions"])],
    diagnostics: [d("삭제 뒤 목록에서는 사라졌지만 상세·검색·count 또는 수정으로 다시 보입니다.", "soft-delete visibility predicate가 query별로 달라졌습니다.", ["list/detail/count/search SQL", "update/delete predicates", "caches", "admin route"], "application-owned visibility 정책을 모든 일반 query/mutation에 적용하고 관리자 query를 분리합니다.", "동일 fixture에 대한 list/detail/count/search/update semantic consistency test를 둡니다.")],
    expertNotes: ["soft delete는 audit log를 대신하지 않으며 누가 왜 바꿨는지 별도 immutable evidence가 필요합니다.", "purge는 retention과 backup 삭제까지 포함한 실제 수명주기입니다."],
  },
  {
    id: "authorization-existence-privacy",
    title: "소유권·역할·tenant 범위를 mutation predicate에 넣고 존재 정보 노출을 통제합니다",
    lead: "화면에서 버튼을 숨기거나 먼저 SELECT한 row owner를 Java에서만 비교하면 직접 요청과 race를 막지 못합니다.",
    explanations: [
      "authenticated actor identity는 body/path의 user id가 아니라 security context에서 가져옵니다. Service authorization policy와 Mapper WHERE에는 resource key, tenant/owner scope, visibility와 version을 포함해 한 row만 변경합니다.",
      "NotFound와 Forbidden을 외부에서 구분하면 resource 존재를 추측할 수 있습니다. 제품 위험 모델에 따라 둘 다 404로 축약하되 내부 safe audit에는 AUTHZ_DENIED와 대상 route template을 기록할 수 있습니다.",
      "관리자 override는 boolean 플래그나 임의 role string을 body에서 받지 않고 별도 use case와 권한으로 구성합니다. owner가 바뀌는 operation은 일반 update allow-list에서 분리하고 추가 감사와 승인 규칙을 둡니다.",
      "IDOR/BOLA 테스트는 다른 actor/tenant의 식별자를 교체하고 path id와 body id 불일치, batch ids, soft-deleted resource와 guessable sequences를 포함합니다. 단순 UI 통합 테스트로는 부족합니다.",
    ],
    concepts: [
      c("object-level authorization", "actor가 특정 resource instance에 요청한 action을 수행할 수 있는지 판단하는 정책입니다.", ["모든 mutation에 적용합니다.", "식별자 교체를 막습니다."]),
      c("tenant predicate", "현재 actor의 tenant 범위를 persistence query와 mutation 조건에 강제하는 필터입니다.", ["누락은 cross-tenant breach입니다.", "관리자 경로를 분리합니다."]),
      c("existence disclosure", "응답 차이로 보호된 resource가 존재하는지 추측 가능해지는 정보 노출입니다.", ["404/403 정책과 연관됩니다.", "timing도 고려합니다."]),
    ],
    diagnostics: [d("다른 사용자의 id를 URL에 넣어 수정하거나 삭제할 수 있습니다.", "UI-only 보호 또는 id만 조건으로 한 DML 때문에 object-level authorization이 빠졌습니다.", ["security actor source", "service policy", "SQL key/owner/tenant predicates", "cross-actor tests"], "server actor와 key/tenant/owner/version을 하나의 authorization+mutation contract로 묶습니다.", "다른 actor/tenant, path-body mismatch와 admin override negative tests를 둡니다.")],
    expertNotes: ["권한 거부 로그에도 제목·본문·raw identity를 넣지 않고 bounded actor/resource references를 사용합니다.", "authorization read와 mutation 사이 race를 SQL predicate 또는 lock으로 닫습니다."],
  },
  {
    id: "transaction-retry-side-effects",
    title: "transaction·deadlock retry·외부 부수효과의 중복과 부분 성공을 설계합니다",
    lead: "DB update가 rollback돼도 이메일·파일 삭제·캐시 invalidation이 이미 실행됐다면 단순 재시도는 더 큰 불일치를 만듭니다.",
    explanations: [
      "Service public use case가 DB mutation과 audit/outbox write를 한 transaction으로 묶습니다. Spring proxy가 실제로 적용되는 external invocation인지, rollback rule과 commit-time failure를 integration test로 검증합니다.",
      "deadlock과 serialization failure 같은 transient error만 bounded backoff로 재시도하고 validation, forbidden, stale version과 constraint failure는 재시도하지 않습니다. 전체 use case가 idempotent하거나 deduplication key가 있을 때만 자동 재실행합니다.",
      "파일 삭제, HTTP 호출, 메시지 발행은 DB transaction과 원자적이지 않습니다. outbox, after-commit 작업, tombstone과 compensating cleanup을 사용하며 consumer는 같은 event를 여러 번 받아도 안전해야 합니다.",
      "retry마다 old expected version을 그대로 쓰면 첫 시도 commit 여부가 불명확할 때 conflict가 날 수 있습니다. operation id와 final readback으로 unknown outcome을 확인하고 무조건 최신 version으로 덮어쓰지 않습니다.",
    ],
    concepts: [
      c("transient failure", "시간이 지나거나 경쟁 transaction이 끝난 뒤 같은 operation이 성공할 수 있는 일시적 실패입니다.", ["분류가 필요합니다.", "bounded retry 대상입니다."]),
      c("outbox", "업무 row 변경과 발행할 event 기록을 한 DB transaction에 저장하고 별도 relay가 전달하는 패턴입니다.", ["부분 발행을 줄입니다.", "중복 소비를 고려합니다."]),
      c("unknown outcome", "timeout/connection 단절로 commit 성공 여부를 caller가 확정할 수 없는 결과입니다.", ["operation id readback이 필요합니다.", "blind retry가 위험합니다."]),
    ],
    diagnostics: [d("deadlock 재시도 뒤 알림이나 파일 삭제가 두 번 실행됩니다.", "DB transaction 안팎의 side effect가 idempotent하지 않은 채 전체 method를 재시도했습니다.", ["retry scope", "transaction boundary", "side-effect timing", "operation/event id"], "DB mutation+outbox만 재시도하고 consumer deduplication과 bounded backoff를 적용합니다.", "첫 시도 각 phase failure와 duplicate delivery를 주입해 final side effect 1회를 검증합니다.")],
    expertNotes: ["retry는 장애를 숨기는 장치가 아니라 경쟁을 흡수하는 제한된 복구 정책입니다.", "commit outcome 불명확 시 최신 값을 다시 써서 성공시키는 방식은 lost update를 재도입합니다."],
  },
  {
    id: "http-status-redirect-error-contract",
    title: "HTML PRG와 JSON API가 같은 mutation 결과를 일관된 HTTP 계약으로 표현하게 합니다",
    lead: "모든 실패를 성공 redirect와 flash 문자열로 바꾸거나 모든 예외를 500으로 반환하면 caller가 복구 방법을 결정할 수 없습니다.",
    explanations: [
      "HTML form 성공은 PRG redirect와 안전한 flash code를, validation은 입력/오류를 보존한 form view를 사용할 수 있습니다. JSON API는 성공 200/204, missing 404, forbidden 정책, stale 409/412, missing precondition 428과 dependency 503을 안정된 problem code로 표현합니다.",
      "delete 성공 뒤 body가 없으면 204를 사용하고 204 response에 JSON을 직렬화하지 않습니다. update가 최신 representation을 반환하면 200과 새 ETag, 별도 조회를 유도하면 204를 선택합니다.",
      "constraint name, SQL, stack trace와 다른 actor의 최신 값을 외부 error에 넣지 않습니다. code, user-safe detail, request id와 retryability를 제공하고 내부 진단은 제한된 error category와 statement id로 연결합니다.",
      "ControllerAdvice/exception resolver는 application failures를 HTTP로 변환하지만 mutation 규칙을 결정하지 않습니다. service result hierarchy와 response mapping 표를 versioned API contract test로 고정합니다.",
    ],
    concepts: [
      c("problem contract", "오류의 HTTP status, stable code, 안전한 설명과 correlation을 정의한 표현 규약입니다.", ["내부 예외를 숨깁니다.", "client 복구를 돕습니다."]),
      c("PRG", "POST/수정 성공 뒤 redirect GET으로 새로고침 재제출을 피하는 흐름입니다.", ["동시성 검사를 대신하지 않습니다.", "flash는 일회성입니다."]),
      c("retryability", "같은 의도의 재시도가 안전하고 성공 가능성이 있는지를 나타내는 오류 속성입니다.", ["status만으로 부족할 수 있습니다.", "idempotency와 연결됩니다."]),
    ],
    diagnostics: [d("stale 수정도 성공 redirect라 사용자가 변경 손실을 뒤늦게 발견합니다.", "typed conflict를 catch해 generic success flash로 바꿨습니다.", ["service outcome", "exception handler", "redirect branches", "ETag/version display"], "Conflict/Precondition 결과를 별도 화면/API problem으로 표현하고 최신 재조회·비교 경로를 제공합니다.", "각 application outcome의 exact status/header/body/view contract snapshot을 둡니다.")],
    expertNotes: ["status 선택보다 중요한 것은 동일한 원인이 endpoint마다 다른 의미로 흔들리지 않는 것입니다.", "error detail은 사용자가 행동할 만큼 구체적이되 보호된 상태를 노출하지 않아야 합니다."],
  },
  {
    id: "mutation-observability-performance",
    title: "값 없는 mutation 관측성과 lock·retry·row-count 예산을 운영합니다",
    lead: "본문과 SQL bind를 통째로 남기면 민감정보가 유출되고, status만 보면 stale conflict와 DB 장애를 구분할 수 없습니다.",
    explanations: [
      "HTTP event에는 route template/method/status/precondition category, service에는 operation/outcome/retry/transaction, mapper에는 statement id/duration bucket/affected rows/error class를 같은 server-generated request id로 연결합니다.",
      "resource id, 제목, 본문, actor email과 ETag 원문을 metric tag로 쓰지 않습니다. bounded operation, outcome, rows bucket, conflict reason과 retry attempt를 사용하고 raw payload는 기본적으로 기록하지 않습니다.",
      "latency budget은 validation/auth, lock wait, DB execution, commit과 response로 나눕니다. p95/p99, conflict ratio, rows>1, deadlock retry, unknown outcome와 transaction residency를 alert 대상으로 둡니다.",
      "hot resource의 optimistic conflict가 높으면 UX merge, queue/serialization, finer-grained fields 또는 pessimistic locking을 평가합니다. retry 횟수만 늘리는 것은 load amplification과 starvation을 키울 수 있습니다.",
    ],
    concepts: [
      c("conflict rate", "전체 조건부 mutation 중 stale version/validator 때문에 거절된 비율입니다.", ["workload contention을 보여줍니다.", "bounded labels를 씁니다."]),
      c("lock wait", "transaction이 필요한 lock을 얻기 위해 대기한 시간입니다.", ["latency와 deadlock 신호입니다.", "query plan과 함께 봅니다."]),
      c("mutation evidence", "operation, precondition outcome, affected rows, transaction과 response를 연결한 안전한 관측 기록입니다.", ["raw values를 배제합니다.", "incident 재구성을 지원합니다."]),
    ],
    diagnostics: [d("운영에서 conflict가 늘었지만 어떤 route/version/DB phase인지 알 수 없습니다.", "status 집계만 있고 precondition, rows, retry와 transaction events가 연결되지 않았습니다.", ["route template metrics", "conflict category", "affected rows", "lock/retry spans"], "bounded mutation event schema와 동일 correlation을 controller→transaction→statement에 적용합니다.", "synthetic stale/deadlock/commit failure가 dashboard와 alert에 정확히 분류되는지 검증합니다.")],
    expertNotes: ["관측 도구 실패가 mutation 결과를 바꾸지 않게 fail-safe와 비용 예산을 둡니다.", "conflict가 비정상인지 협업이 활발하다는 정상 신호인지 product context와 함께 해석합니다."],
  },
  {
    id: "concurrency-failure-matrix-testing",
    title: "barrier 동시성·실제 DB·HTTP 계약 테스트로 lost update와 rollback을 재현합니다",
    lead: "순차 unit test 두 개는 두 writer가 같은 version을 읽는 경쟁 창을 만들지 못하므로 낙관적 잠금이 없어도 통과할 수 있습니다.",
    explanations: [
      "pure unit test는 outcome mapping과 field allow-list를, controller slice는 method/path/body/header validation과 status/ETag를, mapper integration은 actual XML/driver/DB의 version predicate와 affected rows를 검증합니다.",
      "동시성 test는 두 transaction이 같은 version을 읽은 뒤 barrier에서 대기하고 동시에 update하게 해 success 1, conflict 1과 final version +1을 확인합니다. thread timing sleep 대신 latch/barrier와 bounded timeout을 사용합니다.",
      "delete matrix에는 active/already deleted/missing/foreign-key conflict, 다른 owner/tenant, stale version, cleanup failure와 retry를 포함합니다. 각 실패에서 DB, outbox, file/cache side effects와 response를 확인합니다.",
      "commit-time failure, connection loss after execute와 response serialization failure도 주입합니다. SQL이 1 row를 바꿨다는 로그만 보지 않고 transaction outcome과 새 connection readback을 최종 증거로 삼습니다.",
    ],
    concepts: [
      c("barrier test", "여러 작업을 특정 phase에서 만나게 해 경쟁 순서를 결정적으로 만드는 동시성 테스트입니다.", ["sleep보다 안정적입니다.", "timeout이 필요합니다."]),
      c("post-state readback", "operation 완료 뒤 독립 connection/transaction으로 최종 저장 상태와 version을 다시 확인하는 증거입니다.", ["commit을 확인합니다.", "cache를 우회합니다."]),
      c("failure injection", "DB/transaction/side-effect/response의 특정 단계에 의도적으로 오류를 넣어 복구 계약을 검증하는 기법입니다.", ["phase별로 수행합니다.", "cleanup을 포함합니다."]),
    ],
    codeExamples: [java("crud04-concurrent-cas", "동시 두 writer 중 정확히 하나만 성공", "Crud04ConcurrentCas.java", "AtomicReference compareAndSet을 이용해 같은 snapshot을 읽은 두 writer가 성공 1·conflict 1이 되는 불변식을 반복 가능하게 실행합니다.", String.raw`import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Crud04ConcurrentCas {
  record Row(String value, long version) {}
  public static void main(String[] args) throws Exception {
    AtomicReference<Row> store = new AtomicReference<>(new Row("base", 9));
    CyclicBarrier barrier = new CyclicBarrier(2);
    AtomicInteger success = new AtomicInteger();
    AtomicInteger conflict = new AtomicInteger();
    Runnable writer = () -> {
      Row seen = store.get();
      try { barrier.await(2, TimeUnit.SECONDS); } catch (Exception e) { throw new RuntimeException(e); }
      Row next = new Row(Thread.currentThread().getName(), seen.version() + 1);
      if (store.compareAndSet(seen, next)) success.incrementAndGet(); else conflict.incrementAndGet();
    };
    Thread a = Thread.ofPlatform().name("A").start(writer);
    Thread b = Thread.ofPlatform().name("B").start(writer);
    a.join(); b.join();
    System.out.println("success=" + success.get());
    System.out.println("conflict=" + conflict.get());
    System.out.println("version=" + store.get().version());
    System.out.println("value-valid=" + ("A".equals(store.get().value()) || "B".equals(store.get().value())));
  }
}`, "success=1\nconflict=1\nversion=10\nvalue-valid=true", ["jdk-atomic-reference", "spring-test-transactions", "mybatis-spring-transactions", "owasp-idor"])],
    diagnostics: [d("동시성 테스트가 가끔 success 2로 통과하거나 항상 순차 실행됩니다.", "sleep 기반 timing 또는 version 조건 없는 fake가 실제 race를 재현하지 못합니다.", ["read barrier", "writer start", "CAS/SQL predicate", "success/conflict counts", "final version"], "barrier로 같은 snapshot을 강제하고 actual DB integration에서 조건부 DML과 independent readback을 확인합니다.", "여러 반복과 supported DB/isolation matrix에서 success 1·conflict 1 불변식을 gate로 둡니다.")],
    expertNotes: ["in-memory CAS는 원리를 보여줄 뿐 MyBatis SQL, driver row count와 transaction isolation 증거를 대체하지 않습니다.", "동시성 test 실패 시 무작정 retry하지 말고 event timeline과 DB lock/statement evidence를 보존합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-board-controller", repository: "local learning archive", path: "2026-springmvc01/src/main/java/.../board/controller/BoardController.java", usedFor: ["legacy update/delete HTTP and redirect flow audit"], evidence: "Read-only structural audit: 220 lines, 8,293 bytes, SHA-256 FA77CD0DF48BCFBDF7332BF9D222599D2323BEAD5B369E818757128058CB83F9." },
  { id: "local-board-service", repository: "local learning archive", path: "2026-springmvc01/src/main/java/.../board/service/BoardServiceImpl.java", usedFor: ["service mutation delegation and transaction-boundary audit"], evidence: "Read-only structural audit: 61 lines, 1,688 bytes, SHA-256 431770CE49E24D0A546BD4B2850139313AF1CE5444EE82A9159B735944A7DF30." },
  { id: "local-board-mapper", repository: "local learning archive", path: "2026-springmvc01/src/main/resources/mapper/BoardMapper.xml", usedFor: ["DML statement, bound parameter and affected-row provenance"], evidence: "Read-only structural audit: 68 lines, 3,161 bytes, SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6." },
  { id: "spring-request-mapping", repository: "Spring Framework Reference", path: "Mapping Requests", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", usedFor: ["HTTP update/delete method and path contracts"], evidence: "Spring Framework 공식 request mapping 문서입니다." },
  { id: "spring-response-entity", repository: "Spring Framework Reference", path: "ResponseEntity", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responseentity.html", usedFor: ["status, headers and body response contracts"], evidence: "Spring Framework 공식 ResponseEntity 문서입니다." },
  { id: "spring-transactions", repository: "Spring Framework Reference", path: "Declarative Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html", usedFor: ["service transaction and rollback boundaries"], evidence: "Spring Framework 공식 declarative transaction 문서입니다." },
  { id: "spring-test-transactions", repository: "Spring Framework Reference", path: "Transaction Management Testing", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html", usedFor: ["transaction integration test cautions"], evidence: "Spring Framework 공식 transaction testing 문서입니다." },
  { id: "mybatis-mapper-xml", repository: "MyBatis 3 Reference", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["update/delete statements and affected rows"], evidence: "MyBatis 공식 mapper XML 문서입니다." },
  { id: "mybatis-dynamic-sql", repository: "MyBatis 3 Reference", path: "Dynamic SQL", publicUrl: "https://mybatis.org/mybatis-3/dynamic-sql.html", usedFor: ["conditional SET and version predicates"], evidence: "MyBatis 공식 dynamic SQL 문서입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Reference", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["DML return and session semantics"], evidence: "MyBatis 공식 Java API 문서입니다." },
  { id: "mybatis-spring-transactions", repository: "MyBatis-Spring Reference", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["Spring-managed mapper transaction participation"], evidence: "MyBatis-Spring 공식 transaction 문서입니다." },
  { id: "rfc-http-semantics", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["PUT, DELETE, status and idempotency semantics"], evidence: "IETF Standards Track HTTP semantics입니다." },
  { id: "rfc-http-conditional", repository: "IETF RFC Editor", path: "RFC 9110 Conditional Requests", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#section-13", usedFor: ["ETag, If-Match and 412 semantics"], evidence: "RFC 9110의 공식 conditional requests 절입니다." },
  { id: "rfc-precondition-required", repository: "IETF RFC Editor", path: "RFC 6585 428 Precondition Required", publicUrl: "https://www.rfc-editor.org/rfc/rfc6585.html#section-3", usedFor: ["missing precondition response policy"], evidence: "IETF Standards Track additional status code 문서입니다." },
  { id: "owasp-idor", repository: "OWASP Cheat Sheet Series", path: "Insecure Direct Object Reference Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html", usedFor: ["object-level authorization tests"], evidence: "OWASP 공식 IDOR 방어 지침입니다." },
  { id: "jdk-atomic-reference", repository: "Java SE 21 API", path: "AtomicReference", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html", usedFor: ["executable compare-and-set model"], evidence: "Oracle Java SE 21 공식 API 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-04-update-delete-concurrency", slug: "crud-04-update-delete-concurrency", courseId: "spring", moduleId: "spring-layered-crud", order: 4,
  title: "수정·삭제, 영향 행과 동시 변경 처리", subtitle: "field allow-list와 affected rows에서 version compare-and-set, ETag/If-Match, authorization, delete lifecycle과 concurrency testing까지 연결합니다.", level: "고급", estimatedMinutes: 95,
  coreQuestion: "수정·삭제 요청이 정확히 한 대상과 기대한 버전에만 적용되고 경쟁·재시도·부분 실패에서도 정보와 변경을 잃지 않았음을 어떻게 증명할까요?",
  summary: "로컬 게시판 Controller·Service·Mapper XML 세 파일을 read-only로 감사해 기존 mutation route, service delegation과 여러 수정형 statements의 구조를 provenance로 사용합니다. 원본에 transaction annotation이나 optimistic version contract가 있다는 가정은 하지 않습니다. mutation 상태 전이, replacement/patch allow-list, affected rows 0/1/>1, version CAS와 lost update, ETag/If-Match 412/428, hard/soft delete와 종속 cleanup, object authorization와 existence privacy, transaction/retry/outbox, HTML·JSON 오류 계약, secret-zero observability와 barrier/actual-DB failure matrix로 확장합니다. 여섯 JDK 21 실행 경로는 결과 분류, row cardinality, version conflict, HTTP precondition, idempotent delete와 concurrent CAS를 exact output으로 증명합니다.",
  objectives: ["수정·삭제를 전제조건이 있는 상태 전이로 모델링한다.", "교체·부분 수정과 server-owned field를 구분해 over-posting을 막는다.", "affected rows 0·1·2 이상을 정확한 업무 결과로 변환한다.", "version predicate와 ETag/If-Match로 lost update를 탐지한다.", "hard/soft delete와 종속 resource의 수명주기를 설계한다.", "소유권·tenant authorization과 존재 정보 노출을 통제한다.", "transaction, retry와 외부 side-effect의 부분 성공을 방지한다.", "HTTP·관측성·동시성·실제 DB failure matrix로 계약을 검증한다."],
  prerequisites: [{ title: "게시글 등록·상세 조회와 식별자", reason: "생성된 식별자와 상세 조회의 존재·visibility 계약을 알아야 그 resource를 안전하게 수정·삭제하고 stale version을 판정할 수 있습니다.", sessionSlug: "crud-03-board-create-read" }],
  keywords: ["update", "delete", "affected rows", "optimistic concurrency", "lost update", "version", "ETag", "If-Match", "soft delete", "authorization", "transaction", "idempotency"], topics,
  lab: {
    title: "게시판 mutation을 version-aware update/delete 계약으로 재구성하기",
    scenario: "기존 수정·삭제 흐름은 row count와 version/transaction 계약이 명시되지 않아 stale form, 다른 actor, 반복 요청과 cleanup 실패를 구분하기 어렵습니다.",
    setup: ["세 원본 파일을 read-only hash provenance로 고정하고 package, 실제 값과 configuration literal을 복제하지 않습니다.", "UpdateCommand/DeleteCommand, actor, resource key, expected version과 closed outcome 표를 정의합니다.", "지원 DB schema에 version, visibility, tenant/owner와 필요한 foreign key를 synthetic 이름으로 준비합니다.", "MockMvc, actual Spring transaction proxy, MyBatis XML과 두 connection/barrier test harness를 준비합니다."],
    steps: ["현재 route→service→statement mutation 흐름과 책임을 구조 감사합니다.", "request allow-list와 server-owned fields를 분리합니다.", "key+owner/tenant+version 조건부 update와 version increment를 구현합니다.", "affected rows 0/1/>1을 NotFound/Conflict/Success/Incident로 변환합니다.", "GET ETag와 mutation If-Match/hidden version을 persistence token에 연결합니다.", "hard/soft delete, repeated delete와 child/file cleanup policy를 구현합니다.", "authorization와 existence disclosure response를 negative tests로 고정합니다.", "DB mutation과 outbox/audit를 service transaction에 묶고 transient retry를 제한합니다.", "HTML PRG와 JSON problem status/header/body 계약을 비교합니다.", "두 writer barrier에서 success 1·conflict 1·version +1을 검증합니다.", "deadlock, commit/connection/cleanup/response failures를 phase별로 주입합니다.", "safe mutation events, budgets, post-state readback과 runbook을 제출합니다."],
    expectedResult: ["허용되지 않은 필드와 actor는 DML 전에 거절되고 cross-tenant mutation이 0건입니다.", "정상 mutation은 affected rows 1, commit, version +1과 새 ETag가 일치합니다.", "같은 version의 동시 writers는 성공 1·conflict 1이며 lost update가 없습니다.", "삭제 재시도와 외부 cleanup은 중복 부수효과 없이 정책대로 완료됩니다.", "오류·로그·metric에는 실제 제목·본문·credential·SQL bind가 포함되지 않습니다."],
    cleanup: ["synthetic rows, child rows, outbox와 soft-delete/tombstone fixtures를 제거합니다.", "temporary files/messages/caches와 executors/connections를 종료합니다.", "logs/traces/artifacts에서 synthetic secret canary와 raw payload가 0건인지 확인합니다.", "로컬 원본 세 파일은 수정하지 않습니다."],
    extensions: ["field-level merge UI와 conflict diff를 authorization-safe하게 추가합니다.", "hot row에 pessimistic lock/queue를 적용한 throughput·fairness 비교를 수행합니다.", "database trigger/background job도 version을 증가시키는지 검증합니다.", "outbox relay duplicate, delay와 dead-letter 복구 훈련을 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java 예제를 실행하고 mutation 분류·row count·version·HTTP precondition·delete retry·concurrent CAS 불변식을 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "0/1/>1 rows 의미를 적습니다.", "stale write가 저장되지 않음을 확인합니다.", "428/412/204 분기를 설명합니다.", "delete cleanup event가 1회인지 확인합니다.", "concurrent success 1·conflict 1을 확인합니다."], hints: ["각 출력에 대응하는 precondition과 side effect를 표로 만드세요."], expectedOutcome: "SQL 성공이 아니라 mutation 계약의 완료 조건을 증거로 설명합니다.", solutionOutline: ["validate→authorize→compare→mutate→count→commit→respond 순서입니다."] },
    { difficulty: "응용", prompt: "지원 DB와 MockMvc에서 version-aware update/delete를 구현하고 failure matrix를 통과시키세요.", requirements: ["field allow-list를 적용합니다.", "key+actor+version predicate를 사용합니다.", "row cardinality를 확인합니다.", "ETag/If-Match를 연결합니다.", "soft/hard delete와 cleanup을 정의합니다.", "transaction/outbox/retry를 검증합니다.", "barrier와 post-state readback을 사용합니다."], hints: ["먼저 0 rows의 외부 의미를 정하고 내부 원인 구분은 정보 노출 정책 뒤에 배치하세요."], expectedOutcome: "경쟁·권한·재시도에서도 정보 손실과 부분 성공이 없는 mutation 흐름이 완성됩니다.", solutionOutline: ["bound→guard→CAS→commit→translate→observe→prove 순서입니다."] },
    { difficulty: "설계", prompt: "조직용 mutation safety release gate를 작성하세요.", requirements: ["HTTP/field/precondition 계약을 둡니다.", "authorization/existence 정책을 둡니다.", "affected rows와 version 규칙을 둡니다.", "delete retention/dependency 정책을 둡니다.", "transaction/retry/outbox 규칙을 둡니다.", "secret-zero observability budgets를 둡니다.", "unit/slice/DB/concurrency/failure gates를 포함합니다."], hints: ["각 실패가 retryable인지와 이미 실행될 수 있는 side effect를 함께 적으세요."], expectedOutcome: "모든 수정·삭제 endpoint가 동일한 안전 기준으로 검토됩니다.", solutionOutline: ["classify→constrain→condition→mutate→recover→measure→qualify 순서입니다."] },
  ],
  nextSessions: ["crud-05-search-pagination"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["BoardController.java는 read-only로 220 lines/8,293 bytes와 SHA-256 FA77CD0DF48BCFBDF7332BF9D222599D2323BEAD5B369E818757128058CB83F9를 확인했습니다.", "BoardServiceImpl.java는 read-only로 61 lines/1,688 bytes와 SHA-256 431770CE49E24D0A546BD4B2850139313AF1CE5444EE82A9159B735944A7DF30을 확인했습니다.", "BoardMapper.xml은 read-only로 68 lines/3,161 bytes와 SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6을 확인했습니다.", "원본에서는 update형 statements와 상태 변경 흐름을 구조적으로 확인했지만 service @Transactional, version/If-Match와 dedicated DELETE mapping의 존재는 확인하지 않았습니다.", "실제 package, URL, table/column, 사용자 데이터, secret와 configuration 값은 maintained example에 복제하지 않았습니다.", "JDK-only 예제는 Spring proxy, MyBatis/JDBC row-count 차이, 실제 DB lock/isolation/commit과 HTTP message conversion을 대체하지 않습니다."] },
});

export default session;
