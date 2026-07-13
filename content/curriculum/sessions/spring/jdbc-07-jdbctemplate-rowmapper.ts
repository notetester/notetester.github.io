import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 21 표준 API와 작은 교육용 template harness로 외부 Spring jar·DB·credential 없이 callback/lifecycle contract를 재현합니다." },
      { lines: "19-끝에서 6줄 전", explanation: "query/update/cardinality/batch/exception translation을 실제 Java type과 ResultSet/Statement constants로 실행합니다." },
      { lines: "마지막 6줄", explanation: "mapped values·affected counts·batch status·redacted category 같은 deterministic evidence만 출력합니다. 실제 Spring 구현은 공식 API와 통합 테스트에서 확인합니다." },
    ],
    run: { environment: ["JDK 21 이상", "java.sql·java.sql.rowset 표준 모듈", "외부 Spring jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["JDK source-file mode의 stdout은 문서와 완전히 같아야 합니다.", "Mini template은 제어 흐름 학습용이며 Spring JdbcTemplate의 실제 callback, translation, transaction 동작을 재구현하거나 대체하지 않습니다."] },
    experiments: [
      { change: "0/1/N rows, affected count 0/2, partial batch와 SQLState chain을 추가합니다.", prediction: "mapper보다 repository cardinality·concurrency·error contract가 깨지는 지점이 드러납니다.", result: "Spring 통합 테스트에서 실제 exception/result types와 transaction outcome을 readback합니다." },
      { change: "MySQL·Oracle driver와 Spring version을 바꾸고 같은 fixtures를 실행합니다.", prediction: "generated key, batch counts, SQLState/vendor exception과 mapping type이 다를 수 있습니다.", result: "공통 domain outcome과 approved dialect/driver matrix를 유지합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "template-method-resource-ownership",
    title: "JdbcTemplate을 JDBC 알고리즘의 고정 골격과 application callback 경계로 이해합니다",
    lead: "template은 Connection/PreparedStatement/ResultSet 획득·실행·반복·정리·예외 번역을 표준화하고 application은 SQL·bind·row conversion을 제공합니다.",
    explanations: [
      "원본 ScoreDAOImpl은 @Autowired JdbcTemplate, update 등록/삭제와 query+anonymous RowMapper 목록 흐름을 보여 줍니다. 공개 세션은 이 progression만 사용하고 SQL sample values나 connection credentials는 복사하지 않습니다.",
      "JdbcTemplate은 일반적으로 thread-safe configuration object로 repository에 주입해 재사용하지만 Connection/Statement/ResultSet을 field에 저장하지 않습니다. transaction-bound Connection은 Spring infrastructure가 현재 thread/context에 연결합니다.",
      "template method의 가치가 boilerplate 감소에만 있지 않습니다. close order, SQLException translation, statement settings와 transaction participation을 일관되게 적용해 resource leak/error handling 차이를 줄입니다.",
      "callback은 framework ownership을 존중합니다. RowMapper가 next/close하지 않고 PreparedStatementSetter가 connection을 별도로 열지 않으며 ResultSetExtractor가 반환할 때 fully materialized value 또는 명시적 stream ownership을 제공합니다.",
      "template을 사용해도 query correctness, bind/identifier safety, transaction boundary와 affected-row/cardinality 검증은 application 책임입니다. 편리한 API가 domain contract를 자동으로 결정하지 않습니다.",
    ],
    concepts: [
      c("template method", "공통 algorithm/lifecycle 골격을 framework가 소유하고 변하는 부분을 callback으로 받는 설계입니다.", ["resource/error handling을 중앙화합니다.", "domain semantics는 callback/repository가 정의합니다."]),
      c("callback ownership", "callback이 현재 row/statement를 사용할 수 있지만 cursor 이동·close/connection lifetime은 framework가 관리하는 경계입니다.", ["resource를 escape시키지 않습니다.", "추가 connection을 열지 않습니다."]),
      c("thread-safe template", "설정 완료된 JdbcTemplate instance를 여러 repository calls가 공유할 수 있는 특성입니다.", ["JDBC resources를 instance field에 저장하지 않습니다.", "mutable per-call state를 callback/local에 둡니다."]),
    ],
    codeExamples: [java("jdbc07-template-query", "template이 cursor 반복·close를 소유하는 query", "Jdbc07TemplateQuery.java", "교육용 MiniJdbcTemplate이 CachedRowSet을 try-with-resources로 소유하고 mapper는 current row만 immutable record로 바꾸는 흐름을 실행합니다.", String.raw`import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import javax.sql.rowset.CachedRowSet;
import javax.sql.rowset.RowSetMetaDataImpl;
import javax.sql.rowset.RowSetProvider;

public class Jdbc07TemplateQuery {
  record Score(int id, String name) {}
  interface RowMapper<T> { T map(ResultSet row, int rowNum) throws SQLException; }
  static final class TrackedRows implements AutoCloseable {
    final CachedRowSet delegate;
    boolean closed;
    TrackedRows(CachedRowSet delegate) { this.delegate = delegate; }
    public void close() throws SQLException { delegate.close(); closed = true; }
  }
  static final class MiniJdbcTemplate {
    <T> List<T> query(TrackedRows resource, RowMapper<T> mapper) throws Exception {
      List<T> result = new ArrayList<>();
      try (resource) { int rowNum = 0; while (resource.delegate.next()) result.add(mapper.map(resource.delegate, rowNum++)); }
      return List.copyOf(result);
    }
  }
  static CachedRowSet rows() throws Exception {
    CachedRowSet rows = RowSetProvider.newFactory().createCachedRowSet();
    RowSetMetaDataImpl md = new RowSetMetaDataImpl(); md.setColumnCount(2);
    md.setColumnName(1, "id"); md.setColumnType(1, Types.INTEGER);
    md.setColumnName(2, "name"); md.setColumnType(2, Types.VARCHAR); rows.setMetaData(md);
    for (Object[] value : new Object[][] {{1, "alpha"}, {2, "beta"}}) { rows.afterLast(); rows.moveToInsertRow(); rows.updateInt("id", (Integer) value[0]); rows.updateString("name", (String) value[1]); rows.insertRow(); rows.moveToCurrentRow(); }
    rows.beforeFirst(); return rows;
  }
  public static void main(String[] args) throws Exception {
    TrackedRows rows = new TrackedRows(rows());
    List<Score> scores = new MiniJdbcTemplate().query(rows, (row, number) -> new Score(row.getInt("id"), row.getString("name")));
    System.out.println("scores=" + scores);
    System.out.println("count=" + scores.size());
    System.out.println("immutable-list=" + scores.getClass().getName().contains("Immutable"));
    System.out.println("rowset-closed=" + rows.closed);
    System.out.println("mapper-owned-close=false");
  }
}`, "scores=[Score[id=1, name=alpha], Score[id=2, name=beta]]\ncount=2\nimmutable-list=true\nrowset-closed=true\nmapper-owned-close=false", ["local-score-dao", "spring-jdbctemplate-api", "spring-rowmapper", "java-resultset"]),
    ],
    diagnostics: [
      d("JdbcTemplate을 써도 connection/result leak이 납니다.", "callback이 별도 resource를 열어 닫지 않거나 lazy ResultSet/LOB를 lifetime 밖으로 반환했습니다.", ["callback-created resources", "returned lazy objects", "stream/LOB close", "pool active/leak trace"], "framework-owned resource는 callback 안에서만 쓰고 추가 resource는 명시적 try-with-resources/ownership으로 관리합니다.", "callback exception/partial consume/close와 pool readback integration tests를 둡니다."),
      d("동시 요청에서 repository field의 Statement가 섞입니다.", "thread-safe template과 달리 per-call mutable JDBC resource를 singleton repository field에 저장했습니다.", ["repository fields", "connection/statement/resultset ownership", "concurrent calls", "transaction context"], "JdbcTemplate만 immutable/shared field로 두고 resources/state는 method/callback local로 제한합니다.", "concurrent repository calls와 cross-request identity tests를 둡니다."),
    ],
    expertNotes: ["교육용 MiniJdbcTemplate은 Spring source 재구현이 아니라 ownership sequence를 실행해 보는 model입니다. 실제 behavior는 Spring integration evidence로 확정합니다.", "template configuration에 query/fetch/maxRows를 전역 강제할 때 서로 다른 workload를 망치지 않도록 repository별 budgets를 둡니다."],
  },
  {
    id: "rowmapper-projection-contract",
    title: "명시적 projection과 재사용 가능한 RowMapper로 query↔DTO 계약을 고정합니다",
    lead: "JdbcTemplate.query는 cursor 반복을 줄여도 SELECT *·중복 alias·잘못된 getter와 mutable partial VO를 자동으로 고치지 않습니다.",
    explanations: [
      "SQL은 필요한 columns와 unique stable aliases를 명시하고 RowMapper는 그 labels와 SQL→Java type/nullability를 사용합니다. mapper constants와 projection을 한 repository contract로 테스트합니다.",
      "anonymous mapper는 작은 학습 예제에 명확하지만 여러 query에서 같은 DTO를 만들면 named/static mapper 또는 factory가 drift를 줄입니다. 한 mapper가 모든 join shape를 optional field로 흡수하지 않게 합니다.",
      "mapper는 current row 하나를 immutable record/DTO로 바꾸며 next/close/additional query를 하지 않습니다. relation assembly/dedup과 cardinality는 ResultSetExtractor나 repository/service에서 명시합니다.",
      "원본의 SELECT *와 concrete ArrayList cast는 schema/projection/framework implementation에 결합됩니다. explicit projection과 List.copyOf/interface return으로 public contract를 좁힙니다.",
      "mapping failure에는 query fingerprint, safe label/type/row ordinal을 남기고 raw DTO/name/email/token을 기록하지 않습니다. schema/driver versions와 연결합니다.",
    ],
    concepts: [
      c("projection contract", "SQL aliases/types/nullability와 mapper required fields를 연결한 query result schema입니다.", ["SELECT *를 피합니다.", "schema migration과 함께 version 관리합니다."]),
      c("named RowMapper", "특정 projection/current row를 특정 value로 바꾸는 재사용 가능한 명시적 mapper입니다.", ["순수하고 작게 유지합니다.", "여러 incompatible shapes를 합치지 않습니다."]),
      c("ResultSetExtractor", "전체 ResultSet을 사용해 hierarchy/grouped graph 등 하나의 result를 만드는 callback입니다.", ["cursor/resource close는 template이 소유합니다.", "fan-out/dedup/cardinality를 명시합니다."]),
    ],
    diagnostics: [
      d("같은 DTO mapper를 join query에서 쓰자 id가 뒤바뀝니다.", "projection에 duplicate id labels가 있고 mapper shape를 과도하게 재사용했습니다.", ["actual aliases/metadata", "mapper required labels", "join target grain", "DTO shape"], "query별 unique aliases와 적합한 mapper/extractor를 사용합니다.", "duplicate-label/fan-out fixtures와 expected ids를 둡니다."),
      d("schema column 추가 후 mapping/성능이 예기치 않게 변합니다.", "SELECT *가 projection order/width와 sensitive payload를 확장했습니다.", ["generated SQL", "metadata labels/types", "row bytes", "covering plan"], "explicit projection과 schema contract tests를 적용합니다.", "column add/reorder/rename compatibility와 row-byte budgets를 둡니다."),
    ],
    expertNotes: ["JDBC03의 cursor/type/cardinality 계약을 JdbcTemplate callback에서도 그대로 유지합니다.", "DTO toString/logging은 mapper 검증 증거가 아니며 PII가 포함될 수 있어 production logs에서 제외합니다."],
  },
  {
    id: "update-affected-row-contract",
    title: "update 반환 영향 행 수를 create/update/delete·concurrency 결과로 해석합니다",
    lead: "JdbcTemplate.update의 int는 단순 성공 플래그가 아니라 statement가 영향을 준 rows 수이며 expected cardinality와 비교해야 합니다.",
    explanations: [
      "insert expected 1, update/delete by unique id expected 0 또는 1, bulk operation은 bounded N처럼 repository method별 affected-row contract를 정의합니다. println 성공/실패보다 typed outcome으로 반환합니다.",
      "0 rows는 not-found, already-deleted, filter/tenant mismatch 또는 optimistic concurrency conflict일 수 있습니다. existence 재조회로 race/authorization enumeration을 만들기보다 version/expected predicate와 domain outcome을 설계합니다.",
      "2+ rows가 unique-id mutation에서 나오면 query/schema/tenant boundary 결함입니다. 정상 성공으로 합산하지 않고 transaction을 실패시키고 data/query를 조사합니다.",
      "DB/driver가 changed rows와 matched rows 중 무엇을 count하는지 update-to-same-value에서 다를 수 있습니다. MySQL configuration과 Oracle behavior를 integration matrix로 확인합니다.",
      "delete cascade/trigger가 바꾼 child rows가 반환 count에 포함되는지 엔진에 따라 다를 수 있습니다. side effects는 별도 reconciliation/audit contract로 검증합니다.",
    ],
    concepts: [
      c("affected rows", "DML statement가 보고한 변경/matching row 수입니다.", ["method expected cardinality와 비교합니다.", "driver/engine semantics를 확인합니다."]),
      c("optimistic predicate", "id와 expected version/state를 WHERE에 넣어 stale concurrent mutation을 0 rows로 검출하는 조건입니다.", ["lost update를 막습니다.", "0 outcome taxonomy를 둡니다."]),
      c("mutation outcome", "Created, Updated, NotFound, Conflict, InvariantFailure처럼 row count와 domain을 결합한 결과입니다.", ["raw int를 controller까지 흘리지 않습니다.", "authorization privacy를 고려합니다."]),
    ],
    codeExamples: [java("jdbc07-update-counts", "영향 행 수를 mutation outcome으로 분류", "Jdbc07UpdateCounts.java", "작은 in-memory table에서 insert/update/missing/delete의 affected counts를 domain labels로 변환합니다.", String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class Jdbc07UpdateCounts {
  static final class MiniJdbcTemplate {
    private final Map<Integer, String> table = new LinkedHashMap<>();
    int insert(int id, String value) { if (table.containsKey(id)) return 0; table.put(id, value); return 1; }
    int update(int id, String value) { if (!table.containsKey(id)) return 0; table.put(id, value); return 1; }
    int delete(int id) { return table.remove(id) == null ? 0 : 1; }
    String ids() { return table.keySet().toString(); }
  }
  static String oneOrNotFound(int count) {
    if (count == 1) return "APPLIED";
    if (count == 0) return "NOT_FOUND";
    throw new IllegalStateException("unexpected-count:" + count);
  }
  public static void main(String[] args) {
    MiniJdbcTemplate jdbc = new MiniJdbcTemplate();
    System.out.println("insert=" + oneOrNotFound(jdbc.insert(1, "alpha")));
    System.out.println("update=" + oneOrNotFound(jdbc.update(1, "beta")));
    System.out.println("missing=" + oneOrNotFound(jdbc.update(9, "none")));
    System.out.println("delete=" + oneOrNotFound(jdbc.delete(1)));
    System.out.println("remaining=" + jdbc.ids());
  }
}`, "insert=APPLIED\nupdate=APPLIED\nmissing=NOT_FOUND\ndelete=APPLIED\nremaining=[]", ["local-score-dao", "spring-jdbctemplate-api", "java-statement"]),
    ],
    diagnostics: [
      d("수정 API가 성공을 반환했지만 아무 row도 바뀌지 않았습니다.", "update count 0을 검사하지 않고 exception 없음만 성공으로 봤습니다.", ["returned affected count", "WHERE id/tenant/version", "matched-vs-changed semantics", "domain outcome"], "method expected count를 강제하고 0을 not-found/conflict 정책으로 변환합니다.", "0/1/2+와 same-value/concurrent version fixtures를 둡니다."),
      d("unique-id delete가 여러 rows를 지웁니다.", "tenant/key predicate 또는 DB uniqueness가 없고 2+ count를 허용했습니다.", ["schema key", "effective SQL/binds", "affected count", "cascade/trigger side effects"], "DB constraint와 scoped predicate를 고치고 unexpected count에서 rollback/fail합니다.", "cross-tenant/duplicate/cascade integration tests와 reconciliation을 둡니다."),
    ],
    expertNotes: ["원본의 update result print는 progression으로 보존하되 production repository는 typed outcome과 transaction rollback rules를 제공합니다.", "영향 행 수를 observability에 기록할 때 entity ids/values는 제외하고 operation/count/outcome/fingerprint만 둡니다."],
  },
  {
    id: "query-cardinality-method-selection",
    title: "query·queryForObject·optional/list/extractor를 0/1/N cardinality에 맞게 선택합니다",
    lead: "API 이름이 편리하다는 이유로 queryForObject를 쓰면 empty/multiple exceptions가 발생하고 query(list)에서 first만 고르면 duplicate를 숨깁니다.",
    explanations: [
      "list query는 0..N과 empty list, required single query는 정확히 1, optional lookup은 0..1을 repository return type과 method name으로 표현합니다.",
      "JdbcTemplate queryForObject의 zero/multiple behavior와 DataAccessException subclasses를 현재 Spring version에서 확인하고 domain NotFound/DuplicateInvariant로 변환합니다.",
      "queryForList(Map)는 type safety와 duplicate column labels에 약할 수 있습니다. 안정된 DTO/mapper를 사용하고 ad-hoc admin query도 public API shape를 정의합니다.",
      "ResultSetExtractor는 parent-child flattened rows를 hierarchy로 조립할 수 있지만 ordered parent key, fan-out/dedup, memory와 0/1/N child를 명시합니다. N+1을 피하면서 duplicated parent payload를 관리합니다.",
      "count/list를 별도 query로 실행하면 snapshot/predicate parity를 정의합니다. exact count가 불필요하면 Slice/hasNext와 bounded pageSize+1을 선택합니다.",
    ],
    concepts: [
      c("queryForObject contract", "single mapped value/row를 기대하고 zero/multiple을 exception으로 표현하는 Spring JDBC operation입니다.", ["domain taxonomy로 변환합니다.", "DB uniqueness와 결합합니다."]),
      c("optional lookup", "0 또는 1 row를 허용하고 empty/value를 typed result로 표현하는 repository contract입니다.", ["2+를 fail합니다.", "null value와 row absence를 구분합니다."]),
      c("hierarchy extraction", "flattened join rows를 parent/child graph로 조립하는 전체 ResultSet operation입니다.", ["ordered ids/grain을 정의합니다.", "memory/cardinality를 bound합니다."]),
    ],
    codeExamples: [java("jdbc07-cardinality", "list에서 0·1·N contract를 강제하기", "Jdbc07Cardinality.java", "교육용 collector가 empty/one/multiple을 Optional/exception으로 나누고 first-row 숨김을 막습니다.", String.raw`import java.util.List;
import java.util.Optional;

public class Jdbc07Cardinality {
  static <T> Optional<T> oneOrNone(List<T> rows) {
    if (rows.isEmpty()) return Optional.empty();
    if (rows.size() > 1) throw new IllegalStateException("too-many:" + rows.size());
    return Optional.ofNullable(rows.getFirst());
  }
  public static void main(String[] args) {
    System.out.println("empty=" + oneOrNone(List.<Integer>of()).isEmpty());
    System.out.println("one=" + oneOrNone(List.of(7)).orElseThrow());
    String multiple;
    try { oneOrNone(List.of(7, 8)); multiple = "accepted"; }
    catch (IllegalStateException error) { multiple = error.getMessage(); }
    System.out.println("multiple=" + multiple);
    System.out.println("list-empty-size=" + List.of().size());
    System.out.println("first-row-hidden=false");
  }
}`, "empty=true\none=7\nmultiple=too-many:2\nlist-empty-size=0\nfirst-row-hidden=false", ["spring-jdbctemplate-api", "spring-data-access-exception", "java-list"]),
    ],
    diagnostics: [
      d("queryForObject가 조회 없음에서 500으로 노출됩니다.", "zero-row exception을 domain not-found/optional outcome으로 번역하지 않았습니다.", ["repository cardinality", "Spring exception subtype", "controller error mapping", "authorization existence policy"], "0..1 method는 explicit optional collector를 쓰고 required lookup은 stable NotFound로 변환합니다.", "0/1/2 rows와 public status/body/log redaction tests를 둡니다."),
      d("중복 data가 있어도 first row로 정상 처리됩니다.", "list 결과에서 get(0)만 택해 uniqueness/schema 결함을 숨겼습니다.", ["row count/ids", "unique constraint", "query grain/join fan-out", "ordering"], "2+를 invariant failure로 처리하고 uniqueness/query를 수정합니다.", "concurrent duplicate/NULL/collation/fan-out fixtures를 둡니다."),
    ],
    expertNotes: ["Optional은 row absence를 표현하지만 selected column value 자체 NULL과 혼동하지 않게 DTO/SQL contract를 설계합니다.", "exact cardinality exception messages를 public response에 노출하지 않고 stable domain code/correlation을 사용합니다."],
  },
  {
    id: "parameter-binding-dynamic-sql",
    title: "JdbcTemplate에서도 value binding과 dynamic identifier/query structure를 분리합니다",
    lead: "? placeholder는 values를 안전하게 bind하지만 table/column/sort direction과 variable-length clause를 자동으로 안전하게 만들지 않습니다.",
    explanations: [
      "update/query Object[] 또는 PreparedStatementSetter는 values를 bind합니다. SQL 문자열 concatenation으로 사용자 value를 넣지 않고 type/null/timezone을 명시적으로 설정합니다.",
      "table/column/order keyword는 bind할 수 없으므로 enum→fixed fragment allow-list로 선택합니다. raw request sort/filter field를 SQL에 붙이지 않습니다.",
      "IN 목록은 empty semantics, maximum count, placeholder generation과 bind order를 정의합니다. 매우 큰 목록은 temporary table/array/batch/query redesign을 dialect별로 비교합니다.",
      "NamedParameterJdbcTemplate은 named values와 collection expansion을 도와도 identifiers는 안전하게 만들지 않습니다. generated SQL, parameter count와 database limit을 통합 테스트합니다.",
      "logs/metrics에는 parameter values 대신 query fingerprint, bind count/types/size buckets를 사용합니다. password/token/email/search free text와 connection details를 제외합니다.",
    ],
    concepts: [
      c("value binding", "SQL code와 별도 parameter channel로 typed 값을 전달하는 방식입니다.", ["injection과 quoting 오류를 줄입니다.", "identifier/keyword에는 쓸 수 없습니다."]),
      c("structural allow-list", "dynamic column/table/order/clause를 trusted enum과 고정 SQL fragment로 매핑하는 규칙입니다.", ["raw input concatenation을 금지합니다.", "지원 query shapes를 제한합니다."]),
      c("IN expansion", "collection 크기에 맞춰 placeholders와 bind sequence를 만드는 과정입니다.", ["empty/maximum/dialect limit을 정의합니다.", "large list alternatives를 둡니다."]),
    ],
    diagnostics: [
      d("PreparedStatement를 썼는데 ORDER BY injection이 가능합니다.", "sort column/direction을 value placeholder가 아니라 raw string concatenation으로 넣었습니다.", ["dynamic SQL fragments", "request→enum mapping", "generated SQL", "negative payloads"], "지원 sort modes를 enum/fixed fragment allow-list로 제한합니다.", "unknown/metacharacter/comment/case variants를 거절하는 tests를 둡니다."),
      d("IN 빈 목록에서 SQL syntax 오류 또는 전체 rows가 반환됩니다.", "empty collection semantics를 정의하지 않고 placeholders를 생성했습니다.", ["input validation", "generated SQL/bind count", "expected empty/all meaning", "max parameter limit"], "empty는 명시적으로 empty result/reject하고 maximum을 bound합니다.", "0/1/max/max+1 list와 duplicate/NULL fixtures를 둡니다."),
    ],
    expertNotes: ["JdbcTemplate은 unsafe SQL fragment를 정화하지 않습니다. repository가 query-shape allow-list를 소유합니다.", "parameter type가 plan을 바꿀 수 있으므로 driver integration telemetry에는 raw value 대신 JDBC type/cardinality bucket을 둡니다."],
  },
  {
    id: "generated-key-returning",
    title: "생성 키·RETURNING·sequence를 mutation 결과와 transaction에 안전하게 연결합니다",
    lead: "insert 성공 뒤 SELECT MAX(id)로 키를 찾으면 concurrent inserts에서 다른 row를 가져올 수 있으므로 statement/DB가 반환한 identity를 사용합니다.",
    explanations: [
      "JdbcTemplate update와 KeyHolder/PreparedStatement RETURN_GENERATED_KEYS를 사용해 그 statement의 generated key를 읽습니다. key column names와 driver support를 명시합니다.",
      "MySQL AUTO_INCREMENT, Oracle sequence/identity와 INSERT ... RETURNING 지원·syntax가 다릅니다. application identity 전략과 dialect adapter/integration matrix를 둡니다.",
      "sequence next value를 application이 먼저 받으면 insert 실패로 gap이 생길 수 있으며 gapless business number로 사용하지 않습니다. generated surrogate id와 invoice/reservation number policy를 분리합니다.",
      "generated key는 commit 전 tentative transaction state입니다. rollback/commit unknown에서 외부에 발행하지 않고 transaction completion과 idempotency/reconciliation을 설계합니다.",
      "batch generated keys의 ordering/completeness는 driver별로 다릅니다. 각 input operation key와 returned row를 명시적으로 연결하거나 single/RETURNING bulk strategy를 검증합니다.",
    ],
    concepts: [
      c("KeyHolder", "insert statement가 반환한 generated key values를 Spring callback 밖으로 전달하는 abstraction입니다.", ["key column/type/cardinality를 검증합니다.", "commit 완료와 구분합니다."]),
      c("RETURNING", "DML이 영향을 준 row의 columns를 같은 statement 결과로 반환하는 DB 기능입니다.", ["dialect/driver 지원을 확인합니다.", "authorization/projection을 제한합니다."]),
      c("surrogate identity", "row를 식별하는 DB/application generated key이며 gapless business sequence와 분리되는 값입니다.", ["rollback/gap을 허용할 수 있습니다.", "외부 enumeration/privacy를 고려합니다."]),
    ],
    diagnostics: [
      d("동시 insert에서 잘못된 id를 응답합니다.", "insert 뒤 SELECT MAX(id) 또는 shared mutable key state를 사용했습니다.", ["key retrieval statement", "connection/transaction", "concurrent inserts", "returned key mapping"], "generated-keys/RETURNING/sequence 값을 동일 statement·transaction에서 읽습니다.", "동시 insert와 rollback/commit-unknown fixtures를 둡니다."),
      d("batch input과 generated keys가 어긋납니다.", "driver가 keys의 ordering/completeness를 보장한다고 가정했습니다.", ["driver/version behavior", "input operation key", "returned rows/count", "partial batch failure"], "explicit business operation key/RETURNING mapping 또는 verified single inserts를 사용합니다.", "partial failure/reordered/missing key integration matrix를 둡니다."),
    ],
    expertNotes: ["생성 id를 client-visible resource URL로 반환하기 전에 commit outcome과 authorization을 확정합니다.", "키 값을 logs/metrics에 무조건 남기지 않고 correlation용 opaque operation id와 구분합니다."],
  },
  {
    id: "batch-update-counts-partial-failure",
    title: "batchUpdate의 per-item counts·SUCCESS_NO_INFO·EXECUTE_FAILED와 partial outcome을 처리합니다",
    lead: "batch는 round trip을 줄이지만 전체 성공 boolean이 아니라 item별 update counts와 driver transaction/error semantics를 해석해야 합니다.",
    explanations: [
      "JdbcTemplate.batchUpdate는 statements/items별 int counts를 반환할 수 있습니다. 0/positive뿐 아니라 java.sql.Statement SUCCESS_NO_INFO(-2), EXECUTE_FAILED(-3)를 구분합니다.",
      "BatchUpdateException updateCounts와 continue-on-error/stop behavior, atomicity는 driver/DB/autocommit/transaction에 따라 다릅니다. transaction rollback 여부와 committed items를 readback/reconcile합니다.",
      "batch size는 bind/packet/memory/lock/log/replica와 retry cost를 제한합니다. giant batch 하나보다 bounded chunks+operation keys/checkpoints를 workload로 검증합니다.",
      "partial retry는 이미 성공한 items를 중복 적용할 수 있으므로 item idempotency key/unique constraint/upsert semantics와 retry selection을 설계합니다.",
      "batch error telemetry는 raw items를 남기지 않고 batch/run id, total/succeeded/unknown/failed, first category와 transaction outcome을 기록합니다.",
    ],
    concepts: [
      c("batch update count", "batch item마다 driver가 보고한 affected rows 또는 special status입니다.", ["positive/zero/-2/-3을 구분합니다.", "expected cardinality와 비교합니다."]),
      c("SUCCESS_NO_INFO", "statement 성공은 알지만 affected row 수를 알 수 없음을 나타내는 -2 status입니다.", ["1 row 성공으로 위조하지 않습니다.", "readback이 필요할 수 있습니다."]),
      c("partial batch outcome", "batch 일부가 성공/unknown/failed일 수 있는 transaction/driver 결과입니다.", ["rollback/commit 상태를 확인합니다.", "idempotent retry/reconciliation을 둡니다."]),
    ],
    codeExamples: [java("jdbc07-batch-counts", "batch count special status 분류", "Jdbc07BatchCounts.java", "Statement constants가 섞인 batch result를 applied/no-info/failed/zero로 정확히 분류하고 retry 판단 근거를 출력합니다.", String.raw`import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

public class Jdbc07BatchCounts {
  static String classify(int count) {
    if (count == Statement.SUCCESS_NO_INFO) return "SUCCESS_NO_INFO";
    if (count == Statement.EXECUTE_FAILED) return "EXECUTE_FAILED";
    if (count == 0) return "ZERO";
    if (count > 0) return "APPLIED:" + count;
    return "UNKNOWN:" + count;
  }
  public static void main(String[] args) {
    int[] counts = {1, Statement.SUCCESS_NO_INFO, Statement.EXECUTE_FAILED, 0, 2};
    Map<String, Integer> summary = new LinkedHashMap<>();
    for (int count : counts) summary.merge(classify(count).split(":")[0], 1, Integer::sum);
    for (int index = 0; index < counts.length; index++) System.out.println("item" + (index + 1) + "=" + classify(counts[index]));
    System.out.println("summary=" + summary);
    System.out.println("retry-all-safe=false");
  }
}`, "item1=APPLIED:1\nitem2=SUCCESS_NO_INFO\nitem3=EXECUTE_FAILED\nitem4=ZERO\nitem5=APPLIED:2\nsummary={APPLIED=2, SUCCESS_NO_INFO=1, EXECUTE_FAILED=1, ZERO=1}\nretry-all-safe=false", ["spring-jdbc-batch", "java-statement", "java-batch-update-exception"]),
    ],
    diagnostics: [
      d("batch가 exception 없이 끝났는데 일부 items가 반영되지 않았습니다.", "per-item 0/-3/unknown counts를 검사하지 않았습니다.", ["returned counts length/values", "expected item cardinality", "transaction outcome", "DB readback"], "각 item status를 분류하고 transaction policy에 따라 rollback/reconcile합니다.", "positive/zero/-2/-3와 counts-length mismatch fixtures를 둡니다."),
      d("partial 실패 후 전체 재시도로 중복 rows가 생깁니다.", "성공/unknown items를 구분하지 않고 non-idempotent mutation을 재실행했습니다.", ["operation/item keys", "updateCounts", "commit/rollback", "unique/upsert contract"], "idempotency key와 readback으로 unresolved items만 bounded retry합니다.", "network break/partial commit/reordered batch integration tests를 둡니다."),
    ],
    expertNotes: ["batch는 atomicity primitive가 아니며 explicit Spring transaction과 driver/DB behavior를 함께 검증합니다.", "SUCCESS_NO_INFO를 affected=1로 가정하면 reconciliation/cardinality evidence를 위조합니다."],
  },
  {
    id: "exception-translation-sqlstate",
    title: "SQLException chain을 Spring DataAccessException과 domain retry/outcome taxonomy로 번역합니다",
    lead: "vendor SQLException을 그대로 퍼뜨리거나 모두 RuntimeException으로 합치지 않고 SQLState/vendor/cause와 operation semantics를 보존해 portable한 repository error를 만듭니다.",
    explanations: [
      "Spring SQLExceptionTranslator는 SQLState/error code와 metadata를 사용해 DataIntegrityViolation, DuplicateKey, Deadlock/Transient 등 DataAccessException hierarchy로 번역할 수 있습니다. exact subtype은 driver/version matrix에서 확인합니다.",
      "translation은 public domain outcome의 끝이 아닙니다. unique email conflict, FK not-found, serialization/deadlock retry, syntax/deployment bug와 connection outage를 operation/idempotency에 맞게 변환합니다.",
      "SQLException getNextException와 cause, try-with-resources suppressed close error를 보존합니다. 첫 message만 복사하거나 printStackTrace로 secret/SQL/bind를 노출하지 않습니다.",
      "transient category라도 commit outcome unknown인 write를 blind retry하지 않습니다. transaction manager outcome, idempotency key와 DB readback/reconciliation을 사용합니다.",
      "public response는 stable code/status/correlation만 제공하고 SQL text/schema/host/user/token/driver message를 숨깁니다. internal log도 allow-listed fingerprint/SQLState/vendor category만 둡니다.",
    ],
    concepts: [
      c("SQLException translation", "vendor JDBC error를 Spring의 일관된 data-access exception hierarchy로 변환하는 과정입니다.", ["SQLState/error codes를 사용합니다.", "domain semantics는 추가 변환합니다."]),
      c("DataAccessException", "Spring data-access 기술 전반의 unchecked exception hierarchy root입니다.", ["transaction rollback과 catch policy를 정의합니다.", "public API에 그대로 노출하지 않습니다."]),
      c("retry taxonomy", "실패 category와 transaction outcome/idempotency를 결합해 retry/reject/reconcile을 결정하는 규칙입니다.", ["transient label만 믿지 않습니다.", "backoff/budget을 둡니다."]),
    ],
    codeExamples: [java("jdbc07-exception-category", "SQLState chain을 redacted domain category로 변환", "Jdbc07Exception.java", "synthetic SQLException/nextException을 raw message 없이 integrity/public conflict와 retry decision으로 분류합니다.", String.raw`import java.sql.SQLException;

public class Jdbc07Exception {
  static String category(SQLException error) {
    String state = error.getSQLState();
    if (state != null && state.startsWith("23")) return "INTEGRITY";
    if (state != null && state.startsWith("40")) return "TRANSACTION_RETRY_CANDIDATE";
    if (state != null && state.startsWith("08")) return "CONNECTION";
    return "UNKNOWN";
  }
  public static void main(String[] args) {
    SQLException root = new SQLException("sensitive duplicate detail", "23505", 1062);
    SQLException next = new SQLException("serialization detail", "40001", 0);
    root.setNextException(next);
    String category = category(root);
    System.out.println("category=" + category);
    System.out.println("sqlstate-class=" + root.getSQLState().substring(0, 2));
    System.out.println("vendor-code-present=" + (root.getErrorCode() != 0));
    System.out.println("next-category=" + category(root.getNextException()));
    System.out.println("public-code=DATA_CONFLICT");
    System.out.println("blind-retry=false");
  }
}`, "category=INTEGRITY\nsqlstate-class=23\nvendor-code-present=true\nnext-category=TRANSACTION_RETRY_CANDIDATE\npublic-code=DATA_CONFLICT\nblind-retry=false", ["spring-exception-translation", "spring-data-access-exception", "java-sqlexception"]),
    ],
    diagnostics: [
      d("같은 constraint 오류가 DB마다 다른 HTTP 500이 됩니다.", "vendor SQLException을 직접 controller까지 전달하고 portable/domain translation이 없습니다.", ["SQLState/vendor code", "Spring translated subtype", "constraint/operation identity", "public mapper"], "repository에서 Spring translation을 보존하고 service/API에서 stable domain conflict로 매핑합니다.", "MySQL·Oracle duplicate/FK/check/not-null matrix와 public leak tests를 둡니다."),
      d("deadlock/connection error 자동 재시도로 중복 side effect가 납니다.", "transient category만 보고 commit outcome/idempotency 없이 전체 operation을 재실행했습니다.", ["transaction completion", "operation/idempotency key", "DB readback", "retry count/backoff"], "rollback-known idempotent unit만 bounded retry하고 unknown commit은 reconcile합니다.", "deadlock/timeout/network break/commit-unknown integration tests를 둡니다."),
    ],
    expertNotes: ["exception translation은 진단 정보 보존과 public redaction을 동시에 해야 하며 raw message suppression이 cause chain 삭제를 뜻하지 않습니다.", "constraint name도 내부 schema 정보를 노출할 수 있어 external code와 internal safe mapping을 분리합니다."],
  },
  {
    id: "transaction-template-boundary",
    title: "JdbcTemplate 호출을 service transaction 안에 묶고 callback이 새 Connection을 열지 않게 합니다",
    lead: "여러 template calls가 같은 Spring-managed transaction에 참여하려면 DataSource/transaction manager/proxy boundary와 rollback rules가 일치해야 합니다.",
    explanations: [
      "JdbcTemplate은 transaction을 자동으로 시작하는 business service가 아닙니다. @Transactional service/proxy 또는 TransactionTemplate가 transaction scope를 정하고 template이 같은 DataSource의 bound Connection을 사용합니다.",
      "repository method마다 별도 Connection/autocommit을 열거나 callback에서 DriverManager를 쓰면 outer transaction 원자성을 깨뜨립니다. 모든 writes와 read-for-update가 같은 manager/resource에 참여하는지 integration test합니다.",
      "self-invocation, private/final method, wrong bean/new instance와 multiple transaction managers는 @Transactional이 적용되지 않는 흔한 경계입니다. runtime transaction active/rollback/readback을 검사합니다.",
      "rollback rules는 checked/unchecked classification만 암기하지 않고 domain exception mapping과 explicit rollback-only를 정의합니다. catch-and-swallow가 partial commit을 만들지 않게 합니다.",
      "외부 API/message와 DB를 한 local transaction처럼 취급하지 않습니다. outbox/idempotency/reconciliation으로 commit ordering과 failure recovery를 설계합니다.",
    ],
    concepts: [
      c("transaction-bound Connection", "Spring transaction context에서 같은 DataSource operations가 공유하는 connection입니다.", ["template이 획득/반환을 중개합니다.", "callback에서 별도 connection을 열지 않습니다."]),
      c("service transaction boundary", "하나의 business invariant를 원자적으로 수행하는 public service operation 범위입니다.", ["여러 repository calls를 포함합니다.", "proxy/manager를 검증합니다."]),
      c("rollback rule", "어떤 exception/outcome에서 transaction을 rollback-only로 표시할지 정한 규칙입니다.", ["catch/translation과 일치합니다.", "partial commit을 막습니다."]),
    ],
    diagnostics: [
      d("두 update 중 하나만 commit됩니다.", "service transaction이 적용되지 않거나 repository/callback이 다른 connection/autocommit을 사용했습니다.", ["transaction active/proxy", "DataSource/manager identity", "connection ids/autocommit", "exception catch/rollback"], "public service transaction과 동일 JdbcTemplate/DataSource를 사용하고 failure 후 DB readback 0/0을 검증합니다.", "second-write failure/self-invocation/wrong-manager tests를 둡니다."),
      d("exception을 번역한 뒤 transaction이 commit됩니다.", "catch-and-return 또는 rollback rule이 translated exception을 rollback 대상으로 보지 않았습니다.", ["thrown/caught type", "rollback-only state", "proxy boundary", "final DB rows"], "domain outcome 반환 전 rollback-only 또는 exception propagation rule을 명시합니다.", "checked/unchecked/translated/swallowed failure matrix를 둡니다."),
    ],
    expertNotes: ["JDBC05 수동 transaction과 비교해 Spring-managed boundary가 제거하는 boilerplate와 새 proxy/config risks를 함께 설명합니다.", "transaction id/correlation은 관측하되 raw connection object/string이나 credentials를 로그하지 않습니다."],
  },
  {
    id: "testing-performance-observability-evolution",
    title: "callback 단위→실제 Spring/driver 통합→부하·관측·업그레이드 회귀를 계층화합니다",
    lead: "Mini harness나 mock JdbcTemplate은 domain 분기에는 빠르지만 실제 SQL, resource close, exception translation, transaction·generated key·batch를 증명하지 못합니다.",
    explanations: [
      "unit tests는 mapper, affected count/cardinality classifier, dynamic fragment allow-list와 error taxonomy를 pure Java로 검증합니다. JdbcTemplate 자체 호출을 과도하게 mocking해 SQL/bind/row mapping을 놓치지 않습니다.",
      "repository integration tests는 Spring context, migrations, DataSource/pool, actual MySQL·Oracle driver와 transaction manager를 띄워 query/update/batch/key/translation/resource readback을 실행합니다.",
      "failure tests는 duplicate/FK/timeout/deadlock/network break/mapper failure, partial batch와 rollback/commit unknown을 포함합니다. 운영 data/credentials를 사용하지 않고 isolated synthetic fixtures를 transaction/schema로 정리합니다.",
      "performance에는 request SQL count/N+1, rows/bytes, DB/pool/network/mapping time, fetch/batch sizes, heap/GC와 DML/lock/replica 비용을 둡니다. template microbenchmark만 최적화하지 않습니다.",
      "운영 telemetry에는 repository operation/query fingerprint, bind count/type buckets, rows/affected/batch status, translated category, transaction/pool/driver/schema version과 correlation을 두고 raw SQL values/DTO/PII/secrets를 제외합니다.",
    ],
    concepts: [
      c("repository slice test", "Spring JDBC configuration과 repository를 실제 DB/schema에 연결해 좁게 검증하는 integration test입니다.", ["transaction cleanup을 명시합니다.", "driver/dialect matrix를 둡니다."]),
      c("failure injection", "duplicate, timeout, deadlock, network/commit uncertainty와 mapper errors를 의도적으로 발생시켜 outcome/cleanup을 검증하는 방식입니다.", ["partial success를 readback합니다.", "retry/idempotency를 확인합니다."]),
      c("data-access telemetry", "query/operation의 count·rows·time·error·transaction/driver/schema lineage를 safe fields로 수집하는 관측입니다.", ["raw binds/DTO를 제외합니다.", "SLO와 incident runbook에 연결합니다."]),
    ],
    diagnostics: [
      d("mock tests는 통과하지만 실제 DB에서 mapper/batch/key가 실패합니다.", "JdbcTemplate을 mock해 driver metadata, generated keys, batch counts와 transaction을 실행하지 않았습니다.", ["test layer", "actual SQL/schema/driver", "exception subtype", "resource/transaction readback"], "ephemeral target별 repository integration matrix를 추가합니다.", "DB/driver/Spring/JDK upgrade qualification을 release gate로 둡니다."),
      d("SQL logging을 켜자 token/email이 노출됩니다.", "raw SQL/binds/DTO를 debug/trace/APM에 기록했습니다.", ["logger/proxy/APM config", "bind capture", "error messages", "retention/access"], "fingerprint·types/counts/buckets와 redaction allow-list로 교체합니다.", "credential-like/PII adversarial fixtures로 logs/traces/exports를 검사합니다."),
    ],
    expertNotes: ["운영에서 SQL을 볼 수 있는 능력과 모든 bind를 상시 저장하는 것은 다릅니다. gated short-lived diagnostic와 audit를 설계합니다.", "Spring/driver upgrade는 compile pass가 아니라 query/cardinality/types/errors/transactions/batch/keys/resource corpus로 qualification합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-score-dao", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/dao/ScoreDAOImpl.java", usedFor: ["JdbcTemplate update/query, anonymous RowMapper and affected-count/list-cast progression"], evidence: "원본을 read-only로 확인했고 SQL sample values/credentials는 복사하지 않았습니다." },
  { id: "spring-jdbc-reference", repository: "Spring Framework Reference", path: "JDBC Data Access", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/jdbc.html", usedFor: ["JdbcTemplate architecture, callbacks and exception translation"], evidence: "Spring 공식 JDBC reference입니다." },
  { id: "spring-jdbctemplate-api", repository: "Spring Framework Javadoc", path: "JdbcTemplate", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html", usedFor: ["query/update/batch/resource/thread-safety operation contracts"], evidence: "Spring 공식 JdbcTemplate API입니다." },
  { id: "spring-rowmapper", repository: "Spring Framework Javadoc", path: "RowMapper", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/RowMapper.html", usedFor: ["current-row callback responsibility"], evidence: "Spring 공식 RowMapper API입니다." },
  { id: "spring-resultset-extractor", repository: "Spring Framework Javadoc", path: "ResultSetExtractor", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/ResultSetExtractor.html", usedFor: ["whole-result hierarchy extraction"], evidence: "Spring 공식 ResultSetExtractor API입니다." },
  { id: "spring-keyholder", repository: "Spring Framework Javadoc", path: "KeyHolder", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/support/KeyHolder.html", usedFor: ["generated key retrieval"], evidence: "Spring 공식 KeyHolder API입니다." },
  { id: "spring-jdbc-batch", repository: "Spring Framework Reference", path: "JDBC Batch Operations", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/jdbc/advanced.html#jdbc-batch", usedFor: ["batchUpdate operations and counts"], evidence: "Spring 공식 batch JDBC reference입니다." },
  { id: "spring-exception-translation", repository: "Spring Framework Reference", path: "SQLExceptionTranslator", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/jdbc/core.html#jdbc-SQLExceptionTranslator", usedFor: ["portable SQLException translation"], evidence: "Spring 공식 SQLException translation 문서입니다." },
  { id: "spring-data-access-exception", repository: "Spring Framework Javadoc", path: "DataAccessException", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/dao/DataAccessException.html", usedFor: ["data access exception hierarchy and cardinality outcomes"], evidence: "Spring 공식 DataAccessException API입니다." },
  { id: "spring-transactions", repository: "Spring Framework Reference", path: "Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["JdbcTemplate participation in service transactions"], evidence: "Spring 공식 transaction reference입니다." },
  { id: "java-resultset", repository: "Java SE 21 API", path: "ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["exact template/mapper ResultSet examples"], evidence: "Oracle JDK 공식 ResultSet API입니다." },
  { id: "java-statement", repository: "Java SE 21 API", path: "Statement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html", usedFor: ["affected rows and batch special constants"], evidence: "Oracle JDK 공식 Statement API입니다." },
  { id: "java-batch-update-exception", repository: "Java SE 21 API", path: "BatchUpdateException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/BatchUpdateException.html", usedFor: ["partial batch counts and failure chain"], evidence: "Oracle JDK 공식 BatchUpdateException API입니다." },
  { id: "java-sqlexception", repository: "Java SE 21 API", path: "SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["SQLState, vendor code and next exception exact example"], evidence: "Oracle JDK 공식 SQLException API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["immutable/interface result and cardinality harness"], evidence: "Oracle JDK 공식 List API입니다." },
];

const session = createExpertSession({
  inventoryId: "jdbc-07-jdbctemplate-rowmapper", slug: "jdbc-07-jdbctemplate-rowmapper", courseId: "spring", moduleId: "jdbc-foundations", order: 7,
  title: "JdbcTemplate과 RowMapper로 반복 코드 제거", subtitle: "template callback을 mapping·affected count·cardinality·batch·translation·transaction·운영 계약으로 확장합니다.", level: "고급", estimatedMinutes: 960,
  coreQuestion: "JdbcTemplate이 반복 자원 관리를 맡은 뒤에도 query·mutation·cardinality·batch·transaction 의미를 잃지 않고 portable하게 실패·관측·검증하려면 repository는 무엇을 책임져야 할까요?",
  summary: "SpringBasic ScoreDAOImpl의 JdbcTemplate update/query와 anonymous RowMapper 흐름을 read-only로 감사합니다. template/resource ownership, explicit projection/named mapper, affected-row outcomes, 0/1/N operation selection, safe binding/dynamic structure, generated keys, batch special counts/partial failure, SQLException translation, service transaction participation와 unit→actual driver failure/performance/telemetry까지 확장합니다. 다섯 JDK 21 examples는 교육용 mini template과 표준 ResultSet/Statement/SQLException APIs로 cursor ownership, row counts, cardinality, batch statuses와 redacted translation을 실제 실행합니다.",
  objectives: ["JdbcTemplate template-method/resource/callback ownership을 설명한다.", "명시적 projection과 pure named RowMapper/ResultSetExtractor를 설계한다.", "update affected rows를 domain mutation/cardinality outcomes로 변환한다.", "query/queryForObject/list/extractor를 0/1/N에 맞게 선택한다.", "value binding과 dynamic identifiers/IN structure를 분리한다.", "generated keys와 batch counts/partial retry를 transaction-safe하게 처리한다.", "SQLException translation을 domain/retry/redaction taxonomy로 연결한다.", "Spring service transaction 참여와 repository test/performance/telemetry/upgrade를 운영한다."],
  prerequisites: [{ title: "HikariCP pool과 고갈", reason: "JdbcTemplate이 빌리고 반환하는 Connection resource와 transaction/pool lifetime을 이해해야 합니다.", sessionSlug: "jdbc-06-hikari-pool" }],
  keywords: ["JdbcTemplate", "RowMapper", "ResultSetExtractor", "affected rows", "queryForObject", "cardinality", "KeyHolder", "batchUpdate", "SUCCESS_NO_INFO", "DataAccessException", "SQLExceptionTranslator", "transaction", "query fingerprint"], topics,
  lab: {
    title: "점수 CRUD repository를 JdbcTemplate production contract로 재구성하기",
    scenario: "기존 repository의 select-all, mutable anonymous mapping, raw update count print와 concrete List cast를 개선하고 MySQL·Oracle, batch, generated key, transaction/failure를 지원합니다.",
    setup: ["synthetic opaque ids/names/scores와 0/1/2+, NULL/type/duplicate/FK/deadlock/timeout/partial-batch fixtures만 사용합니다.", "Spring context, migrations, HikariCP와 ephemeral MySQL·Oracle-compatible targets를 준비합니다.", "explicit projection/type/cardinality/affected-count/transaction/error/idempotency contracts와 resource budgets를 작성합니다.", "expected ordered DTOs, mutation rows, batch/key/exception/rollback outcomes를 고정합니다."],
    steps: ["template/callback/resource/transaction ownership sequence를 readback합니다.", "SELECT *를 explicit aliases와 pure immutable named RowMapper로 바꿉니다.", "create/update/delete의 0/1/2+ counts를 typed outcomes로 강제합니다.", "0..1/exact1/list/hierarchy APIs와 duplicate/not-found mapping을 검증합니다.", "values, nullable types, dynamic sort/IN allow-list와 bind logging redaction을 negative-test합니다.", "MySQL/Oracle generated key/sequence/RETURNING을 commit/rollback/unknown outcome과 검증합니다.", "batch positive/0/-2/-3/partial failure와 item idempotency/reconciliation을 실행합니다.", "duplicate/FK/deadlock/timeout/network errors의 Spring translation, public redaction과 retry policy를 검증합니다.", "여러 template calls가 같은 service transaction/Connection에서 rollback되는지 readback합니다.", "query count/rows/bytes/time/pool/heap/locks와 driver/Spring/schema versions를 canary corpus로 승인합니다."],
    expectedResult: ["query rows가 explicit aliases와 immutable DTO/cardinality contract에 정확히 매핑됩니다.", "mutation/batch/key outcomes가 affected counts와 transaction state를 위조하지 않습니다.", "dynamic SQL injection, duplicate/FK/timeout/deadlock/partial/commit-unknown이 stable redacted paths로 처리됩니다.", "MySQL·Oracle driver/Spring matrix에서 resource close, translation, key/batch/rollback evidence가 일치합니다.", "운영 telemetry가 raw SQL/binds/DTO/PII/credentials 없이 SLO·incident·rollback에 충분합니다."],
    cleanup: ["ephemeral schemas·synthetic rows/batches/outbox와 test traces를 run id로 제거합니다.", "temporary DB/pool credentials/containers를 revoke·종료합니다.", "logs/traces/artifacts에 SQL values/name/email/token/URL/password가 없는지 검사합니다.", "원본 ScoreDAOImpl과 production data는 변경하지 않습니다."],
    extensions: ["SimpleJdbcInsert, NamedParameterJdbcTemplate와 type-safe SQL DSL을 비교합니다.", "R2DBC reactive template의 backpressure/transaction/error contract와 비교합니다.", "outbox/change-data-capture와 batch checkpoint/reconciliation을 구현합니다.", "repository query corpus와 schema/driver/Spring upgrade qualification을 CI에 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 template ownership·affected count·cardinality·batch·exception evidence를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "mapper가 next/close하지 않음을 설명합니다.", "0/1 update counts를 outcomes로 구분합니다.", "empty/one/multiple result를 구분합니다.", "batch -2/-3을 1/0으로 위조하지 않습니다.", "SQLState chain을 public redacted code와 구분합니다."], hints: ["Spring convenience method 이름보다 resource/cardinality/transaction contract를 먼저 적으세요."], expectedOutcome: "JdbcTemplate을 boilerplate 삭제 도구가 아니라 일관된 data-access boundary로 설명합니다.", solutionOutline: ["ownership→projection→cardinality→mutation→batch/error→transaction 순서입니다."] },
    { difficulty: "응용", prompt: "원본 ScoreDAOImpl을 production-grade JdbcTemplate repository로 리팩터링하세요.", requirements: ["원본 update/query/mapper progression을 보존합니다.", "select-all/concrete cast/raw print를 제거합니다.", "explicit aliases/types/immutable mapper를 적용합니다.", "affected rows와 0/1/N methods를 강제합니다.", "safe dynamic query/key/batch를 구현합니다.", "Spring transaction/translation/idempotency를 검증합니다.", "MySQL·Oracle failure/driver matrix를 실행합니다.", "query/resource/PII-safe telemetry와 rollback을 포함합니다."], hints: ["JdbcTemplate을 사용해도 query 문자열을 unsafe하게 조립할 수 있습니다."], expectedOutcome: "정확성·보안·resource·transaction·이식성이 검증된 repository가 완성됩니다.", solutionOutline: ["source audit→contracts→callbacks→failures→transactions→integration corpus→canary 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring JDBC repository 표준을 작성하세요.", requirements: ["template/callback/resource/thread ownership을 정의합니다.", "projection/mapper/type/null/cardinality 규칙을 둡니다.", "affected count/key/batch partial outcome을 정의합니다.", "value binding/dynamic identifier/IN limits를 둡니다.", "exception translation/domain/retry/redaction을 정의합니다.", "service transaction/rollback/outbox/idempotency를 둡니다.", "DB/driver/Spring schema failure/performance corpus를 요구합니다.", "query/pool/rows/bytes/error telemetry와 incident/rollback을 포함합니다."], hints: ["update가 exception 없이 반환됐다는 사실만으로 기대한 한 행이 바뀌었다고 결론낼 수 없습니다."], expectedOutcome: "JDBC callback부터 운영 incident까지 일관된 전문가 Spring JDBC governance가 완성됩니다.", solutionOutline: ["bind→execute→map/count→translate→commit→measure→reconcile→recover 순서입니다."] },
  ],
  nextSessions: ["mybatis-01-config-session-factory"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["ScoreDAOImpl.java를 read-only로 확인해 JdbcTemplate update2/query1, anonymous RowMapper/mapRow1, ResultSet getters5, affected-count print1, select-all1과 concrete List→ArrayList cast1을 provenance로 기록했습니다.", "원본 SQL literals/sample values/connection credentials는 복사하지 않고 framework/data-access progression과 structural gaps만 사용했습니다.", "원본은 cardinality/affected outcome, generated keys/batch/translation/transaction/failure/performance/telemetry를 충분히 설명하지 않아 Spring/JDK 공식 문서와 synthetic examples로 보완했습니다.", "Mini template examples는 Spring JdbcTemplate implementation이 아니며 실제 MySQL·Oracle driver, pool, transaction manager와 SQLException translation behavior를 대체하지 않습니다."] },
});

export default session;
