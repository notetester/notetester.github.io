import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-18", explanation: "JDK 표준 CachedRowSet와 metadata로 외부 DB·driver·credential 없이 ResultSet cursor/type/label contract를 재현합니다." },
      { lines: "19-끝에서 6줄 전", explanation: "next(), typed getter, wasNull(), column label, mapper와 cardinality guard를 실제 ResultSet API로 실행합니다." },
      { lines: "마지막 6줄", explanation: "row identity·NULL·labels·immutable DTO·cardinality 같은 deterministic evidence만 출력합니다. production driver behavior는 통합 테스트에서 재검증합니다." },
    ],
    run: { environment: ["JDK 21 이상", "java.sql·java.sql.rowset 표준 모듈", "외부 DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["JDK source-file mode의 stdout은 문서와 한 글자씩 같아야 합니다.", "CachedRowSet는 disconnected test double이며 실제 driver의 streaming, timezone, decimal과 metadata quirks를 대체하지 않습니다."] },
    experiments: [
      { change: "NULL, duplicate alias, column reorder, extra/missing row와 큰 result를 추가합니다.", prediction: "wasNull/type/label/cardinality/streaming 가정이 깨지는 지점이 드러납니다.", result: "row identity와 public mapping error를 유지하며 경계별 assertion을 추가합니다." },
      { change: "같은 contract를 실제 MySQL·Oracle driver 통합 테스트로 실행합니다.", prediction: "numeric/time/boolean/metadata/fetch behavior가 in-memory double과 다를 수 있습니다.", result: "driver/version별 approved mapping matrix와 readback evidence를 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "resultset-cursor-lifecycle",
    title: "ResultSet을 current row가 있는 cursor state machine으로 이해합니다",
    lead: "query 실행 직후 cursor는 첫 행 앞에 있으며 next()가 true일 때만 current row getter를 호출할 수 있습니다.",
    explanations: [
      "ResultSet은 rows collection이 아니라 cursor와 current-row access를 결합한 JDBC resource입니다. before-first→on-row→after-last 상태를 구분하고 while(rs.next())가 empty와 multiple rows를 안전하게 처리하는 이유를 추적합니다.",
      "next()는 cursor를 이동하고 boolean으로 row 존재를 알립니다. getter를 next() 전이나 false 뒤에 호출하는 것은 유효한 current row가 없으므로 SQLException 대상입니다.",
      "TYPE_FORWARD_ONLY가 일반적인 streaming 경로이며 scrollable/updatable result set 지원·비용은 driver와 statement 옵션에 따라 다릅니다. 학습 예제의 beforeFirst/absolute 호출을 production 기본으로 가정하지 않습니다.",
      "ResultSet은 생성한 Statement와 Connection의 lifetime에 묶입니다. statement/connection close, commit과 holdability가 cursor를 닫을 수 있으므로 mapper가 resource를 저장·반환하지 않고 row 안에서 필요한 값을 읽습니다.",
      "원본 ScoreDAOImpl은 JdbcTemplate RowMapper의 mapRow(ResultSet,rowNum) 안에서 ScoreVO를 구성합니다. framework가 cursor 이동/resource lifecycle을 소유하므로 mapper는 next()/close하지 않는 책임 경계를 명시해야 합니다.",
    ],
    concepts: [
      c("cursor state", "before-first, valid current row, after-last/closed 중 ResultSet의 현재 위치 상태입니다.", ["getter는 current row에서만 유효합니다.", "next() 반환값으로 전이합니다."]),
      c("current row", "cursor가 가리키며 column getter가 읽는 한 query row입니다.", ["rowNum과 DB key를 구분합니다.", "mapper 호출 동안만 사용합니다."]),
      c("resource ownership", "ResultSet·Statement·Connection을 누가 이동/close하고 얼마나 오래 보유하는지 정한 계약입니다.", ["JdbcTemplate과 manual JDBC가 다릅니다.", "mapper가 ResultSet을 escape시키지 않습니다."]),
    ],
    codeExamples: [java("jdbc03-cursor-lifecycle", "before-first부터 after-last까지 cursor 이동", "Jdbc03Cursor.java", "JDK CachedRowSet 두 행에서 next()가 current row를 만들고 마지막 false 뒤 after-last가 됨을 실행합니다.", String.raw`import java.sql.Types;
import javax.sql.rowset.CachedRowSet;
import javax.sql.rowset.RowSetMetaDataImpl;
import javax.sql.rowset.RowSetProvider;

public class Jdbc03Cursor {
  static CachedRowSet rows() throws Exception {
    CachedRowSet rows = RowSetProvider.newFactory().createCachedRowSet();
    RowSetMetaDataImpl md = new RowSetMetaDataImpl();
    md.setColumnCount(2);
    md.setColumnName(1, "id"); md.setColumnType(1, Types.INTEGER);
    md.setColumnName(2, "name"); md.setColumnType(2, Types.VARCHAR);
    rows.setMetaData(md);
    for (Object[] value : new Object[][] {{1, "alpha"}, {2, "beta"}}) {
      rows.afterLast(); rows.moveToInsertRow();
      rows.updateInt("id", (Integer) value[0]); rows.updateString("name", (String) value[1]);
      rows.insertRow(); rows.moveToCurrentRow();
    }
    rows.beforeFirst(); return rows;
  }
  public static void main(String[] args) throws Exception {
    try (CachedRowSet rows = rows()) {
      System.out.println("before-first=" + rows.isBeforeFirst());
      int mapped = 0;
      boolean hasRow;
      while (hasRow = rows.next()) {
        mapped++;
        System.out.println("row=" + rows.getInt("id") + ":" + rows.getString("name"));
      }
      System.out.println("mapped=" + mapped);
      System.out.println("after-last=" + rows.isAfterLast());
      System.out.println("terminal-next=" + hasRow);
    }
  }
}`, "before-first=true\nrow=1:alpha\nrow=2:beta\nmapped=2\nafter-last=true\nterminal-next=false", ["java-resultset", "java-cachedrowset", "java-rowset-provider"]),
    ],
    diagnostics: [
      d("첫 행을 건너뛰거나 empty query에서 getter SQLException이 납니다.", "mapper/manual loop가 next()를 두 번 호출하거나 current-row 여부를 확인하지 않았습니다.", ["executeQuery 직후 state", "next 호출 위치/횟수", "framework가 cursor를 이동하는지", "empty fixture"], "manual JDBC는 while(rs.next()), RowMapper는 framework가 전달한 current row만 읽도록 경계를 분리합니다.", "0/1/N rows와 first/last identity tests를 둡니다."),
      d("mapper가 반환한 객체에서 나중에 ResultSet 접근이 실패합니다.", "ResultSet 또는 lazy supplier를 resource lifetime 밖으로 escape시켰습니다.", ["returned object fields", "statement/connection close 시점", "lazy stream", "transaction boundary"], "mapRow 안에서 immutable application value로 완전히 복사합니다.", "resource close 뒤 DTO 접근이 DB resource에 의존하지 않음을 검증합니다."),
    ],
    expertNotes: ["rowNum은 호출 순서이지 domain primary key가 아닙니다. logging/error identity에는 safe domain key/correlation을 별도로 사용합니다.", "streaming API를 반환할 때는 close ownership과 transaction/pool occupancy를 public contract로 노출합니다."],
  },
  {
    id: "column-label-index-metadata",
    title: "column label·name·ordinal과 ResultSetMetaData를 명시적 projection 계약으로 관리합니다",
    lead: "getString(\"name\")은 Java field를 찾는 것이 아니라 SQL result column label/name을 찾으므로 alias와 중복 label이 mapping을 결정합니다.",
    explanations: [
      "ordinal getter는 1-based이고 SELECT projection reorder에 취약합니다. label getter는 읽기 쉽지만 join에서 동일한 id/name label이 중복되면 driver가 어느 column을 반환하는지 portable하지 않습니다.",
      "SQL에서 post_id, author_id처럼 unique stable aliases를 명시하고 mapper는 그 label을 사용합니다. table column name과 API/DTO field를 우연히 같게 두는 대신 query↔mapper contract를 테스트합니다.",
      "ResultSetMetaData의 columnCount, getColumnLabel, getColumnName, JDBC type, precision/scale와 nullable을 diagnosis/schema contract test에 사용할 수 있습니다. 매 row reflection mapper의 hot path로 무제한 사용하지 않습니다.",
      "SELECT *는 column 추가/reorder, duplicate join columns, large/sensitive payload와 covering index를 깨뜨립니다. 필요한 columns와 aliases를 명시하고 schema evolution 시 mapper change를 함께 review합니다.",
      "원본은 select-all과 name/kor/eng/math labels를 직접 사용합니다. 공개 권장안은 projection을 명시하고 점수 columns의 SQL/Java numeric type을 contract로 검증합니다.",
    ],
    concepts: [
      c("column label", "SELECT expression의 AS alias이며 없을 때 driver가 column name을 label로 제공할 수 있는 result identifier입니다.", ["mapper가 사용하는 public query contract입니다.", "join labels를 고유하게 만듭니다."]),
      c("column ordinal", "SELECT 결과에서 1부터 시작하는 column 위치입니다.", ["projection 순서와 결합됩니다.", "hot loop 성능 외에는 label을 선호할 수 있습니다."]),
      c("ResultSetMetaData", "result columns의 label/name/type/precision/nullability 등을 설명하는 JDBC metadata입니다.", ["driver actual metadata를 검사합니다.", "domain validation을 대체하지 않습니다."]),
    ],
    codeExamples: [java("jdbc03-column-labels", "stable alias label과 metadata 계약", "Jdbc03Labels.java", "disconnected RowSet metadata에 query가 보장할 stable aliases를 설정하고 label 기반 immutable row를 읽습니다.", String.raw`import java.sql.Types;
import javax.sql.rowset.CachedRowSet;
import javax.sql.rowset.RowSetMetaDataImpl;
import javax.sql.rowset.RowSetProvider;

public class Jdbc03Labels {
  record Score(int id, String name, int total) {}
  public static void main(String[] args) throws Exception {
    CachedRowSet rows = RowSetProvider.newFactory().createCachedRowSet();
    RowSetMetaDataImpl md = new RowSetMetaDataImpl();
    md.setColumnCount(3);
    md.setColumnName(1, "id"); md.setColumnLabel(1, "id"); md.setColumnType(1, Types.INTEGER);
    md.setColumnName(2, "name"); md.setColumnLabel(2, "name"); md.setColumnType(2, Types.VARCHAR);
    md.setColumnName(3, "total"); md.setColumnLabel(3, "total"); md.setColumnType(3, Types.INTEGER);
    rows.setMetaData(md);
    rows.moveToInsertRow(); rows.updateInt(1, 7); rows.updateString(2, "alpha"); rows.updateInt(3, 270); rows.insertRow(); rows.moveToCurrentRow();
    rows.beforeFirst(); rows.next();
    var meta = rows.getMetaData();
    Score score = new Score(rows.getInt("id"), rows.getString("name"), rows.getInt("total"));
    System.out.println("columns=" + meta.getColumnCount());
    System.out.println("labels=" + meta.getColumnLabel(1) + "," + meta.getColumnLabel(2) + "," + meta.getColumnLabel(3));
    System.out.println("names=" + meta.getColumnName(1) + "," + meta.getColumnName(2) + "," + meta.getColumnName(3));
    System.out.println("score=" + score.id() + ":" + score.name() + ":" + score.total());
    System.out.println("label-contract=true");
    rows.close();
  }
}`, "columns=3\nlabels=id,name,total\nnames=id,name,total\nscore=7:alpha:270\nlabel-contract=true", ["java-resultset", "java-resultset-metadata", "spring-rowmapper"]),
    ],
    diagnostics: [
      d("join 후 getLong(\"id\")가 다른 table id를 읽습니다.", "projection에 중복 label이 있고 driver/mapper가 첫 matching label을 선택했습니다.", ["actual SQL aliases", "ResultSetMetaData labels", "join projection", "mapper constants"], "각 entity key에 고유 alias를 부여하고 metadata contract test를 둡니다.", "duplicate-name join fixture와 expected ids를 검증합니다."),
      d("column 추가 뒤 mapper가 조용히 다른 값을 읽습니다.", "ordinal getter와 SELECT *가 projection order에 결합됐습니다.", ["getter ordinal", "DDL/view projection diff", "metadata labels/types", "generated query"], "명시적 projection+stable aliases+label getters로 전환합니다.", "column reorder/add/remove schema-compatibility tests를 둡니다."),
    ],
    expertNotes: ["metadata를 error response에 그대로 노출하지 않고 internal fingerprint와 safe missing/duplicate label code로 변환합니다.", "query alias와 mapper constant를 함께 유지하는 repository-level contract test가 compile-time DTO 이름 일치보다 직접적인 evidence입니다."],
  },
  {
    id: "sql-java-types-null-wasnull",
    title: "SQL NULL과 primitive default를 wasNull·getObject(Class)로 구분합니다",
    lead: "getInt/getLong 같은 primitive getter는 SQL NULL에서 0을 반환할 수 있어 직후 wasNull을 확인하지 않으면 실제 0과 missing이 합쳐집니다.",
    explanations: [
      "primitive getter의 SQL NULL sentinel은 Java primitive default와 동일합니다. getter 직후 wasNull()을 호출하거나 nullable wrapper/temporal class를 getObject(label,Class)로 요청해 null을 보존합니다.",
      "wasNull은 마지막으로 읽은 column 값에 대한 상태이므로 다른 getter를 사이에 호출하면 잘못된 column을 검사할 수 있습니다. 한 field mapping expression 안에서 즉시 처리합니다.",
      "JDBCType/Types와 driver conversion table을 확인해 DECIMAL→BigDecimal, DATE→LocalDate, TIMESTAMP→LocalDateTime/OffsetDateTime/Instant 선택을 schema/timezone contract에 맞춥니다.",
      "getString으로 숫자를 읽고 application에서 parse하면 locale/format/overflow/NULL과 validation 책임을 섞습니다. 원본 ScoreDAOImpl이 점수 columns를 String으로 읽는 흐름은 ScoreVO 실제 type과 schema를 확인해 typed getter로 정렬해야 합니다.",
      "boolean, unsigned/large numeric, Oracle NUMBER, MySQL BIT/TINYINT와 JSON/LOB vendor types는 driver/version matrix를 실제 container DB로 readback합니다. CachedRowSet 결과만 portable proof로 쓰지 않습니다.",
    ],
    concepts: [
      c("wasNull", "마지막 ResultSet getter가 SQL NULL을 읽었는지 알려 주는 method입니다.", ["primitive getter 직후 호출합니다.", "다른 getter 전에 확인합니다."]),
      c("typed getObject", "getObject(label, TargetClass)로 JDBC 값을 nullable modern Java type으로 요청하는 API입니다.", ["driver 지원 matrix를 검증합니다.", "conversion failure를 분류합니다."]),
      c("mapping type contract", "SQL type/precision/scale/timezone/nullability와 Java target type/range를 연결한 규칙입니다.", ["schema migration과 함께 version 관리합니다.", "silent narrowing을 금지합니다."]),
    ],
    codeExamples: [java("jdbc03-null-types", "SQL NULL과 실제 0을 분리하는 getter", "Jdbc03Nulls.java", "nullable INTEGER 두 행을 primitive+wasNull과 typed getObject로 읽어 missing과 zero가 다름을 출력합니다.", String.raw`import java.sql.Types;
import javax.sql.rowset.CachedRowSet;
import javax.sql.rowset.RowSetMetaDataImpl;
import javax.sql.rowset.RowSetProvider;

public class Jdbc03Nulls {
  public static void main(String[] args) throws Exception {
    CachedRowSet rows = RowSetProvider.newFactory().createCachedRowSet();
    RowSetMetaDataImpl md = new RowSetMetaDataImpl();
    md.setColumnCount(2);
    md.setColumnName(1, "id"); md.setColumnType(1, Types.INTEGER);
    md.setColumnName(2, "score"); md.setColumnType(2, Types.INTEGER); md.setNullable(2, 1);
    rows.setMetaData(md);
    rows.afterLast(); rows.moveToInsertRow(); rows.updateInt("id", 1); rows.updateNull("score"); rows.insertRow(); rows.moveToCurrentRow();
    rows.afterLast(); rows.moveToInsertRow(); rows.updateInt("id", 2); rows.updateInt("score", 0); rows.insertRow(); rows.moveToCurrentRow();
    rows.beforeFirst();
    while (rows.next()) {
      int primitive = rows.getInt("score");
      boolean sqlNull = rows.wasNull();
      Object raw = rows.getObject("score");
      Integer boxed = raw == null ? null : ((Number) raw).intValue();
      System.out.println("id=" + rows.getInt("id") + ":primitive=" + primitive + ":was-null=" + sqlNull + ":boxed=" + boxed);
    }
    System.out.println("missing-is-zero=false");
    System.out.println("rows=2");
    rows.close();
  }
}`, "id=1:primitive=0:was-null=true:boxed=null\nid=2:primitive=0:was-null=false:boxed=0\nmissing-is-zero=false\nrows=2", ["java-resultset", "java-jdbctype", "java-types"]),
    ],
    diagnostics: [
      d("NULL 점수가 0점으로 저장·표시됩니다.", "primitive getter default를 실제 value로 받아 wasNull을 확인하지 않았습니다.", ["column nullability", "getter target type", "wasNull call order", "DTO primitive/wrapper"], "nullable domain은 wrapper/Optional-like domain state 또는 typed result로 보존합니다.", "NULL/0/min/max/overflow fixtures를 둡니다."),
      d("날짜가 환경 timezone에 따라 하루/시간 차이 납니다.", "TIMESTAMP/DATE 의미와 driver/JVM/session timezone conversion을 정의하지 않았습니다.", ["SQL type", "DB/session/JVM timezone", "getter Java time type", "DST/fractional precision"], "instant/local/calendar semantics를 schema contract에 명시하고 matching java.time type으로 readback합니다.", "MySQL·Oracle timezone/DST/precision integration matrix를 둡니다."),
    ],
    expertNotes: ["Optional을 DTO field에 무조건 쓰기보다 domain missing state와 serialization/framework conventions를 선택하되 SQL NULL을 0/empty로 위조하지 않습니다.", "numeric mapping에는 range/precision/rounding/overflow failure policy와 column label을 safe error context로 남깁니다."],
  },
  {
    id: "rowmapper-single-row-responsibility",
    title: "RowMapper를 current row→immutable value의 순수하고 작은 변환으로 설계합니다",
    lead: "mapper는 cursor를 이동·close하거나 추가 SQL/원격 호출을 하지 않고 전달된 한 current row를 완전히 materialize해야 합니다.",
    explanations: [
      "RowMapper<T>.mapRow(rs,rowNum)는 현재 row를 T로 변환합니다. JdbcTemplate이 next 반복과 resource close를 소유하므로 mapper 안에서 rs.next(), close, commit 또는 statement 생성은 금지합니다.",
      "immutable record/constructor DTO는 필수 fields가 모두 매핑되었음을 한 지점에서 확인하고 partially initialized bean을 줄입니다. entity/DTO/VO 의미와 validation owner를 명시합니다.",
      "mapper에서 N+1 query, clock/random/global mutable cache를 호출하면 row count만큼 side effect와 nondeterminism이 생깁니다. related data는 query join/batch 또는 higher layer에서 명시적으로 가져옵니다.",
      "mapping exception에는 query fingerprint, safe column label/type와 row ordinal을 넣되 raw name/email/token/payload를 노출하지 않습니다. SQLException chain과 cause를 보존해 repository boundary에서 taxonomy로 변환합니다.",
      "원본 anonymous RowMapper는 학습 흐름에 유용하지만 별도 named mapper/constant projection/record factory로 재사용·단위/통합 테스트를 쉽게 만들 수 있습니다.",
    ],
    concepts: [
      c("RowMapper", "framework가 위치시킨 current ResultSet row를 하나의 domain/DTO value로 변환하는 callback입니다.", ["cursor/resource를 소유하지 않습니다.", "한 row만 읽습니다."]),
      c("immutable mapping", "constructor/record로 required fields를 한 번에 만들어 이후 partial mutation을 막는 방식입니다.", ["NULL/type validation을 생성 경계에 둡니다.", "resource를 보관하지 않습니다."]),
      c("mapping purity", "같은 current row와 contract가 같은 value를 만들고 추가 I/O/side effect가 없는 성질입니다.", ["N+1을 막습니다.", "테스트와 reasoning을 단순화합니다."]),
    ],
    codeExamples: [java("jdbc03-immutable-mapper", "current row를 record로 매핑하기", "Jdbc03Mapper.java", "작은 RowMapper interface와 CachedRowSet으로 두 rows를 immutable record list로 만들고 cursor/resource ownership을 분리합니다.", String.raw`import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import javax.sql.rowset.CachedRowSet;
import javax.sql.rowset.RowSetMetaDataImpl;
import javax.sql.rowset.RowSetProvider;

public class Jdbc03Mapper {
  record Score(int id, String name) {}
  interface RowMapper<T> { T map(ResultSet row) throws SQLException; }
  static final RowMapper<Score> SCORE_MAPPER = row -> new Score(row.getInt("id"), row.getString("name"));
  static CachedRowSet rows() throws Exception {
    CachedRowSet rows = RowSetProvider.newFactory().createCachedRowSet();
    RowSetMetaDataImpl md = new RowSetMetaDataImpl(); md.setColumnCount(2);
    md.setColumnName(1, "id"); md.setColumnType(1, Types.INTEGER);
    md.setColumnName(2, "name"); md.setColumnType(2, Types.VARCHAR); rows.setMetaData(md);
    for (Object[] value : new Object[][] {{1, "alpha"}, {2, "beta"}}) {
      rows.afterLast(); rows.moveToInsertRow(); rows.updateInt("id", (Integer) value[0]); rows.updateString("name", (String) value[1]); rows.insertRow(); rows.moveToCurrentRow();
    }
    rows.beforeFirst(); return rows;
  }
  public static void main(String[] args) throws Exception {
    List<Score> scores = new ArrayList<>();
    try (CachedRowSet rows = rows()) {
      while (rows.next()) scores.add(SCORE_MAPPER.map(rows));
    }
    System.out.println("scores=" + scores);
    System.out.println("count=" + scores.size());
    System.out.println("first=" + scores.getFirst().id() + ":" + scores.getFirst().name());
    System.out.println("last=" + scores.getLast().id() + ":" + scores.getLast().name());
    System.out.println("immutable=true");
  }
}`, "scores=[Score[id=1, name=alpha], Score[id=2, name=beta]]\ncount=2\nfirst=1:alpha\nlast=2:beta\nimmutable=true", ["local-score-dao", "spring-rowmapper", "spring-jdbctemplate", "java-resultset"]),
    ],
    diagnostics: [
      d("목록 100개를 읽을 때 mapper가 100개 추가 query를 실행합니다.", "mapper가 related data repository를 호출해 N+1을 만들었습니다.", ["request SQL count", "mapper dependencies", "row cardinality", "join/batch alternatives"], "mapper를 row-local pure conversion으로 만들고 relation fetch는 query/bounded batch로 설계합니다.", "row count별 query-count formula와 0/1/N child fixtures를 둡니다."),
      d("일부 field만 설정된 VO가 service까지 전달됩니다.", "mutable no-arg bean과 누락된 setter가 required mapping을 compile/runtime에서 강제하지 않습니다.", ["projection required labels", "constructor/record", "NULL/type validation", "schema diff"], "required fields를 immutable constructor/record factory에서 검증합니다.", "missing/renamed/NULL/type mismatch contract tests를 둡니다."),
    ],
    expertNotes: ["mapper constant는 projection SQL/aliases와 같은 repository에 두되 SQL 문자열과 DTO를 거대 전역 mapper로 합치지 않습니다.", "record toString에도 PII가 포함될 수 있으므로 mapping success/error logs에 DTO 전체를 출력하지 않습니다."],
  },
  {
    id: "query-cardinality-api",
    title: "queryOne·optional·list·stream의 cardinality를 메서드와 mapper 밖에서 강제합니다",
    lead: "같은 row mapping이라도 0/1/N을 허용하는 query contract가 다르며 first row만 조용히 택하면 duplicate data를 숨깁니다.",
    explanations: [
      "findById는 0 또는 1, getRequiredById는 정확히 1, listByStatus는 0..N처럼 public repository cardinality를 명시합니다. mapper는 한 row만 변환하고 result collector가 cardinality를 검증합니다.",
      "0 rows를 null, Optional.empty, not-found domain result 중 무엇으로 표현할지 layer/HTTP contract와 맞춥니다. 빈 list는 정상 0..N 결과이며 null list와 구분합니다.",
      "2+ rows를 first/max/min으로 임의 해결하지 않고 unique constraint/query grain을 고칩니다. duplicate exception에는 raw values 없이 query/constraint identity와 count threshold를 남깁니다.",
      "JdbcTemplate queryForObject의 empty/multiple exception과 query(list) behavior를 정확히 알고 repository taxonomy로 변환합니다. framework exception class가 domain/UI까지 누출되지 않게 합니다.",
      "stream/iterator는 resource lifetime을 caller로 확장하므로 close ownership, transaction/pool timeout, partial iteration와 cancellation을 별도 API로 설계합니다. 작은 list query와 동일 취급하지 않습니다.",
    ],
    concepts: [
      c("cardinality contract", "query가 허용하는 결과 row 수 0,1,N과 위반 처리 규칙입니다.", ["method name/type에 드러냅니다.", "DB uniqueness와 연결합니다."]),
      c("duplicate cardinality failure", "0..1 contract에서 둘 이상 rows가 반환된 data/query/schema 결함입니다.", ["first row로 숨기지 않습니다.", "constraint와 grain을 조사합니다."]),
      c("stream ownership", "lazy row iteration 동안 Connection/Statement/ResultSet close 책임과 transaction lifetime을 caller에게 전달하는 계약입니다.", ["try-with-resources가 필요합니다.", "pool occupancy budget을 둡니다."]),
    ],
    codeExamples: [java("jdbc03-cardinality", "0·1·2행 queryOne 계약", "Jdbc03Cardinality.java", "CachedRowSet factory와 oneOrNone collector로 empty/one/multiple을 서로 다른 outcome으로 실행합니다.", String.raw`import java.sql.Types;
import java.util.OptionalInt;
import javax.sql.rowset.CachedRowSet;
import javax.sql.rowset.RowSetMetaDataImpl;
import javax.sql.rowset.RowSetProvider;

public class Jdbc03Cardinality {
  static CachedRowSet rows(int... ids) throws Exception {
    CachedRowSet rows = RowSetProvider.newFactory().createCachedRowSet();
    RowSetMetaDataImpl md = new RowSetMetaDataImpl(); md.setColumnCount(1);
    md.setColumnName(1, "id"); md.setColumnType(1, Types.INTEGER); rows.setMetaData(md);
    for (int id : ids) { rows.afterLast(); rows.moveToInsertRow(); rows.updateInt("id", id); rows.insertRow(); rows.moveToCurrentRow(); }
    rows.beforeFirst(); return rows;
  }
  static OptionalInt oneOrNone(CachedRowSet rows) throws Exception {
    if (!rows.next()) return OptionalInt.empty();
    int id = rows.getInt("id");
    if (rows.next()) throw new IllegalStateException("too-many");
    return OptionalInt.of(id);
  }
  public static void main(String[] args) throws Exception {
    try (var emptyRows = rows(); var oneRow = rows(7); var manyRows = rows(7, 8)) {
      System.out.println("empty=" + oneOrNone(emptyRows).isEmpty());
      System.out.println("one=" + oneOrNone(oneRow).orElseThrow());
      String multiple;
      try { oneOrNone(manyRows); multiple = "accepted"; }
      catch (IllegalStateException error) { multiple = error.getMessage(); }
      System.out.println("multiple=" + multiple);
      System.out.println("first-row-hidden=false");
      System.out.println("cardinality-enforced=" + multiple.equals("too-many"));
    }
  }
}`, "empty=true\none=7\nmultiple=too-many\nfirst-row-hidden=false\ncardinality-enforced=true", ["spring-jdbctemplate", "java-resultset", "java-optional-int"]),
    ],
    diagnostics: [
      d("findByEmail이 간헐적으로 다른 계정을 반환합니다.", "duplicate rows를 first()로 숨기고 unique/canonical identity contract가 없습니다.", ["result row count/ids", "UNIQUE/collation/normalization", "query filters", "concurrent inserts"], "DB unique contract와 0..1 collector를 적용하고 duplicate를 fail/repair합니다.", "concurrent duplicate/case/Unicode/NULL fixtures를 둡니다."),
      d("stream 반환 뒤 pool connection이 오래 점유됩니다.", "caller가 lazy ResultSet stream을 close하지 않거나 긴 처리/네트워크 전송과 결합했습니다.", ["stream close ownership", "transaction/connection age", "pool active/pending", "fetch/backpressure"], "bounded page/batch를 선호하고 stream API는 AutoCloseable과 timeout/cancel을 강제합니다.", "partial consume/cancel/exception/close integration tests와 pool readback을 둡니다."),
    ],
    expertNotes: ["원본의 List를 ArrayList로 강제 cast하면 framework 구현 타입에 결합됩니다. public return은 List.copyOf 등 명시적 immutable/interface contract로 둡니다.", "Optional은 0..1 cardinality를 표현하지만 DB query가 2+ rows를 반환할 수 없다는 검증을 자동 제공하지 않습니다."],
  },
  {
    id: "projection-schema-evolution",
    title: "projection·mapper·DTO·schema migration을 하나의 versioned contract로 변경합니다",
    lead: "column rename/type/nullability 변화는 SQL이 실행되는지뿐 아니라 driver conversion과 application invariant, rolling deployment 호환성에 영향을 줍니다.",
    explanations: [
      "projection에는 required/optional labels, JDBC types/precision/scale/nullability와 semantic unit/timezone을 문서화합니다. SELECT *나 implicit conversion으로 schema drift를 숨기지 않습니다.",
      "expand-contract migration은 새 nullable/default column/dual-read-write→backfill/reconciliation→consumer 전환→old 제거 순서로 producer/consumer versions를 겹치게 합니다.",
      "column rename은 alias로 old mapper contract를 잠시 유지할 수 있지만 데이터 source of truth와 deprecation deadline을 정합니다. silent COALESCE로 missing/corruption을 default 값처럼 숨기지 않습니다.",
      "numeric widening/narrowing, VARCHAR length/collation, DATE/TIMESTAMP timezone와 Oracle/MySQL type 차이를 actual driver matrix에서 검증합니다. mapper unit test만으로 DDL compatibility를 증명하지 않습니다.",
      "schema fingerprint/metadata contract failure를 startup/canary에서 탐지하고 migration version, query fingerprint와 safe label/type diff를 관측합니다. raw row values를 logs에 남기지 않습니다.",
    ],
    concepts: [
      c("projection contract", "query result의 label/order-independent identity, type/nullability와 semantic meaning을 mapper와 공유하는 규칙입니다.", ["명시적 aliases를 사용합니다.", "schema version과 연결합니다."]),
      c("expand-contract", "구/신 application versions가 공존하도록 schema를 추가→이관→제거하는 호환 migration pattern입니다.", ["backfill/reconciliation을 포함합니다.", "rollback window를 둡니다."]),
      c("driver conformance matrix", "DB/driver/version별 SQL type→Java type, NULL/timezone/precision mapping을 fixtures로 비교한 표입니다.", ["in-memory double을 보완합니다.", "upgrade gate로 사용합니다."]),
    ],
    diagnostics: [
      d("rolling 배포 중 구버전 mapper가 새 schema에서 깨집니다.", "rename/drop/type tightening을 expand-contract 없이 한 번에 적용했습니다.", ["application versions", "projection aliases", "migration order", "backfill/rollback"], "additive 호환 phase와 dual-read/alias를 두고 consumer 전환 readback 뒤 제거합니다.", "old/new binary×old/new schema compatibility matrix를 둡니다."),
      d("type 변경 뒤 일부 큰 값만 mapping overflow가 납니다.", "small test data만 사용해 target Java range/precision을 검증하지 않았습니다.", ["source SQL precision/scale/range", "getter/DTO type", "driver conversion", "min/max/fraction fixtures"], "wider lossless type을 사용하고 boundary backfill scan과 explicit rejection/rounding policy를 둡니다.", "min/max/overflow/fraction/NULL integration fixtures를 둡니다."),
    ],
    expertNotes: ["schema contract failure는 값이 잘못 매핑된 뒤보다 canary/startup metadata check에서 빠르게 실패하는 편이 안전합니다.", "metadata fingerprint가 같아도 semantic unit/timezone/normalization 변경은 별도 versioned contract change입니다."],
  },
  {
    id: "large-result-fetch-backpressure",
    title: "큰 ResultSet의 fetch size·streaming·memory·backpressure와 pool lifetime을 운영합니다",
    lead: "모든 rows를 ArrayList에 materialize하면 단순하지만 result cardinality와 row width가 커질 때 heap·GC·connection lifetime과 응답 지연이 폭발합니다.",
    explanations: [
      "statement fetchSize는 driver에게 batch hint이며 MySQL·Oracle streaming/cursor prerequisites와 autocommit/transaction behavior가 다릅니다. 실제 wire fetch와 memory를 driver 문서/measurement로 확인합니다.",
      "bounded pagination/keyset, batch job chunk와 streaming 중 consumer 요구를 선택합니다. web response에 unbounded ResultSet stream을 직접 연결하면 slow client가 DB connection을 오래 점유합니다.",
      "row width는 columns/LOB/JSON과 object expansion을 포함합니다. 필요한 projection만 읽고 LOB stream은 lifetime/close/size/authorization을 별도 설계합니다.",
      "backpressure/cancellation은 consumer 중단을 statement cancel→ResultSet/Statement close→transaction rollback/reset→connection return까지 전달해야 합니다. partial output의 retry/idempotency를 정의합니다.",
      "관측에는 rows/bytes fetched, batches, mapping/DB/network time, heap/GC, connection age, cancel/timeout와 query fingerprint를 두되 raw row values는 제외합니다.",
    ],
    concepts: [
      c("fetch size", "driver가 server/network에서 rows를 가져오는 batch 크기에 대한 JDBC hint입니다.", ["결과 limit이 아닙니다.", "driver-specific prerequisites를 확인합니다."]),
      c("materialization", "모든 mapped rows를 memory collection에 완전히 적재하는 방식입니다.", ["resource를 빨리 닫을 수 있습니다.", "large result heap 비용이 있습니다."]),
      c("backpressure", "consumer 처리 속도/수요에 맞춰 producer fetch를 제한·중단하는 제어입니다.", ["DB connection lifetime과 연결됩니다.", "cancel/cleanup을 포함합니다."]),
    ],
    diagnostics: [
      d("대형 export에서 OOM 또는 긴 GC가 납니다.", "unbounded SELECT *를 mutable list로 전부 materialize했습니다.", ["result rows/row bytes", "projection/LOB", "heap/GC", "page/chunk/stream options"], "bounded chunk/keyset 또는 controlled streaming과 narrow projection을 사용합니다.", "largest expected volume에서 heap/connection/time budgets를 검증합니다."),
      d("client가 끊겼는데 DB query와 connection이 계속 살아 있습니다.", "HTTP cancellation이 statement cancel/close까지 전파되지 않았습니다.", ["request cancellation signal", "statement/query timeout", "resource close", "pool active/connection state"], "cancel hook에서 statement를 중단하고 try-with-resources/rollback/reset으로 connection을 반환합니다.", "mid-stream disconnect/timeout/mapper exception integration tests를 둡니다."),
    ],
    expertNotes: ["fetchSize를 크게 하는 것과 result size를 제한하는 것은 다릅니다. API/query에 maximum cardinality를 별도로 둡니다.", "streaming 중 transaction snapshot이 오래 유지되어 MVCC/undo·pool에 미치는 영향을 database SLO와 함께 봅니다."],
  },
  {
    id: "mapping-errors-sql-exception-context",
    title: "mapping failure를 SQLState·cause·safe column context와 domain taxonomy로 변환합니다",
    lead: "SQLException을 printStackTrace하거나 모든 오류를 empty list로 바꾸면 type/schema/data/resource 결함과 보안 정보를 동시에 잃습니다.",
    explanations: [
      "SQLException에는 message, SQLState, vendor code, cause와 nextException chain이 있을 수 있습니다. close failure는 try-with-resources의 suppressed exception으로 붙을 수 있어 root/secondary evidence를 보존합니다.",
      "mapping failures는 missing/duplicate label, conversion/range, unexpected NULL, invalid enum/domain invariant와 resource/driver errors로 분류합니다. query execution과 mapping failure를 동일 'DB 오류'로만 만들지 않습니다.",
      "public error에는 stable code와 correlation만 보내고 SQL text, schema, stack, connection URL, credentials와 row values를 노출하지 않습니다. internal log도 parameter/PII/secret allow-list/redaction을 적용합니다.",
      "partial list를 성공으로 반환하지 않습니다. list materialization 중 row N에서 실패하면 전체 operation을 failure로 처리하고 response/cache/export publish를 원자화합니다.",
      "bad row quarantine가 허용되는 batch import/export는 명시적 policy, source identity, reason, counts와 reconciliation을 둡니다. online domain query에서 조용히 row를 skip하지 않습니다.",
    ],
    concepts: [
      c("SQLState", "SQLException의 portable category를 표현하려는 표준 code string입니다.", ["vendor code/exception subtype과 함께 봅니다.", "public response에 raw 노출하지 않습니다."]),
      c("exception chain", "root cause, nextException과 suppressed cleanup failures를 보존한 오류 graph입니다.", ["첫 message만 버리지 않습니다.", "redacted structured logging을 사용합니다."]),
      c("mapping error taxonomy", "label/type/NULL/range/domain/resource failures를 stable internal categories로 분류한 규칙입니다.", ["retry 가능성을 구분합니다.", "schema incident alert와 연결합니다."]),
    ],
    diagnostics: [
      d("mapper 오류가 empty list로 보이고 데이터 누락을 늦게 발견합니다.", "catch-all이 mapping exception을 정상 empty 결과로 바꿨습니다.", ["exception catch/return path", "partial rows", "cache/response status", "SQLState/cause"], "전체 query를 failure로 처리하고 stable taxonomy/correlation으로 전파합니다.", "row N mapping failure에서 partial success/cache 0을 검증합니다."),
      d("오류 응답/log에 SQL과 사용자 값이 노출됩니다.", "SQLException message/DTO/ResultSet을 그대로 serialize/log했습니다.", ["public error mapper", "logger arguments", "driver message contents", "PII/secret scanner"], "allow-listed structured fields와 redaction을 사용하고 raw SQL/binds/row를 제외합니다.", "adversarial value/credential-like fixture로 response/log leak tests를 둡니다."),
    ],
    expertNotes: ["retry는 SQLState 하나만으로 자동 결정하지 않고 transaction outcome, idempotency와 operation semantics를 함께 봅니다.", "mapping schema drift alert에는 safe label/type fingerprint와 deployment/migration version을 연결합니다."],
  },
  {
    id: "thread-safety-snapshot-consistency",
    title: "ResultSet의 thread confinement와 transaction snapshot·lazy processing 경계를 지킵니다",
    lead: "ResultSet/Statement/Connection은 일반적으로 여러 threads가 동시에 cursor를 이동하도록 설계하지 않으며 row stream은 transaction snapshot과 pool resource를 붙잡습니다.",
    explanations: [
      "한 query의 cursor와 mapper loop를 한 thread/structured scope에 가두고 mapped immutable values만 다른 thread로 전달합니다. parallel stream이 ResultSet.next/getter를 동시에 호출하지 않게 합니다.",
      "count/list 또는 여러 result sets가 같은 snapshot을 필요로 하면 transaction/isolation boundary를 정의합니다. mapping 시간이 길어지면 long snapshot과 locks/MVCC retention이 커질 수 있습니다.",
      "JdbcTemplate callback 밖에서 ResultSet을 보관하거나 async task로 넘기면 resource가 이미 close될 수 있습니다. async processing은 먼저 bounded DTO batch로 materialize하거나 메시지/job boundary를 둡니다.",
      "connection pool은 thread 간 connection instance를 재사용하지만 동시에 공유하라는 뜻이 아닙니다. borrow→use→transaction cleanup→return lifecycle와 session state reset을 지킵니다.",
      "virtual threads를 사용해도 DB connections/cursors가 무한해지지 않습니다. pool/query/concurrency budgets, cancellation과 backpressure를 유지합니다.",
    ],
    concepts: [
      c("thread confinement", "mutable JDBC cursor/resource를 한 execution thread/scope만 사용하는 규칙입니다.", ["mapped immutable values만 전달합니다.", "parallel cursor access를 금지합니다."]),
      c("snapshot consistency", "query rows가 transaction isolation에서 보는 committed/versioned data 시점의 일관성입니다.", ["count/list와 lazy stream에 중요합니다.", "long snapshot 비용이 있습니다."]),
      c("async handoff", "JDBC resource 대신 fully mapped bounded values 또는 durable message로 비동기 처리 경계를 넘기는 방식입니다.", ["close lifetime을 분리합니다.", "backpressure/idempotency를 둡니다."]),
    ],
    diagnostics: [
      d("parallel mapping에서 rows가 중복·누락되거나 cursor 오류가 납니다.", "여러 threads가 하나의 ResultSet state를 동시에 이동/읽습니다.", ["thread ownership", "parallel stream/callback", "resource scope", "row identity sequence"], "cursor loop를 single-thread confined로 유지하고 mapped batches 이후 CPU 작업만 병렬화합니다.", "thread sanitizer 대신 deterministic ids/count와 concurrent misuse negative test를 둡니다."),
      d("async task에서 ResultSet closed 오류가 납니다.", "framework callback이 끝난 뒤 cursor를 다른 executor가 읽습니다.", ["handoff object", "callback return/close timing", "transaction/pool state", "batch size"], "callback 안에서 immutable DTO로 materialize하고 bounded queue/durable job으로 넘깁니다.", "delayed async consumer와 resource-close integration test를 둡니다."),
    ],
    expertNotes: ["virtual thread 수가 늘어도 DB connection/query capacity는 그대로이므로 semaphore/pool/admission을 별도 설계합니다.", "snapshot metadata를 DTO에 무조건 넣기보다 API/report의 asOf/watermark와 reconciliation contract로 노출합니다."],
  },
  {
    id: "mapping-test-matrix-observability",
    title: "RowSet 단위 테스트와 실제 driver 통합·schema·성능 관측을 계층화합니다",
    lead: "mock ResultSet만으로는 cursor/getter 호출을 시험할 수 있지만 실제 SQL aliases, driver conversions, timezone, streaming과 schema migration을 증명하지 못합니다.",
    explanations: [
      "pure mapper unit test는 0/1/N, NULL/0, min/max/precision, missing/duplicate labels와 domain validation을 빠르게 검증합니다. CachedRowSet 같은 standard disconnected double로 실제 ResultSet API를 사용합니다.",
      "repository integration test는 ephemeral MySQL/Oracle-compatible target에 schema migration을 적용하고 PreparedStatement→ResultSet→mapper 전체를 실행합니다. production과 다른 in-memory SQL dialect만으로 portability를 결론내리지 않습니다.",
      "contract matrix에는 DB/driver/JDK versions, SQL type/nullability/precision/timezone/collation, returned Java class/value와 metadata labels를 기록합니다. upgrade 때 golden boundaries를 재실행합니다.",
      "성능 테스트는 rows/row width, fetch size, mapping allocations/CPU, DB/network time, heap/GC와 connection age를 측정합니다. mapper microbenchmark가 query/network보다 중요한지 먼저 확인합니다.",
      "운영 관측에는 query fingerprint, rows/bytes/mapping time, cardinality/mapping error category, driver/schema version과 correlation을 두고 SQL literals/binds/DTO/PII는 제외합니다.",
    ],
    concepts: [
      c("mapper unit test", "synthetic ResultSet current rows로 label/type/NULL/domain mapping을 검증하는 빠른 test입니다.", ["cursor/resource ownership도 negative-test합니다.", "driver quirks는 증명하지 않습니다."]),
      c("repository integration test", "실제 schema·driver와 SQL execution부터 mapping/cardinality/resource까지 검증하는 test입니다.", ["transaction 격리를 둡니다.", "dialect matrix가 필요합니다."]),
      c("mapping telemetry", "rows/bytes/time/error category와 schema/driver lineage를 PII 없이 수집하는 관측입니다.", ["slow query와 mapping CPU를 분리합니다.", "raw values를 남기지 않습니다."]),
    ],
    diagnostics: [
      d("mock mapper tests는 통과하지만 운영에서 conversion 오류가 납니다.", "mock이 실제 driver return type/metadata/timezone/precision을 재현하지 않았습니다.", ["DB/driver version", "actual ResultSetMetaData", "SQL type/value boundary", "integration test coverage"], "ephemeral target별 driver conformance tests를 추가합니다.", "DB/driver/JDK upgrade matrix와 boundary fixtures를 release gate로 둡니다."),
      d("mapping latency alert에 원인을 찾을 정보가 없거나 PII가 과다합니다.", "전체 DTO/raw SQL을 로그하거나 row count/time/version조차 기록하지 않았습니다.", ["telemetry field allow-list", "fingerprint/correlation", "rows/bytes/timing", "PII scanner"], "safe fingerprint·counts·timings·error category·versions만 structured metric/trace로 수집합니다.", "adversarial PII/secret fixture와 diagnostic sufficiency tests를 둡니다."),
    ],
    expertNotes: ["unit/integration/performance/production telemetry는 서로 대체하지 않고 빠른 의미 검증부터 실제 engine evidence까지 층을 이룹니다.", "학습 사이트 예제는 JDK 21만으로 exact 실행되지만 실제 프로젝트 acceptance에는 source repository의 DB dialect와 driver를 추가합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-score-dao", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/dao/ScoreDAOImpl.java", usedFor: ["anonymous RowMapper, ResultSet label mapping, select-all and List implementation coupling provenance"], evidence: "원본을 read-only로 확인했고 sample values/credentials는 사용하지 않았습니다." },
  { id: "java-resultset", repository: "Java SE 21 API", path: "java.sql.ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["cursor, getters, wasNull, types, concurrency and close semantics"], evidence: "Oracle JDK 공식 ResultSet API입니다." },
  { id: "java-resultset-metadata", repository: "Java SE 21 API", path: "java.sql.ResultSetMetaData", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSetMetaData.html", usedFor: ["labels, names, types, precision and nullability"], evidence: "Oracle JDK 공식 ResultSetMetaData API입니다." },
  { id: "java-jdbctype", repository: "Java SE 21 API", path: "java.sql.JDBCType", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/JDBCType.html", usedFor: ["portable JDBC type vocabulary"], evidence: "Oracle JDK 공식 JDBCType API입니다." },
  { id: "java-types", repository: "Java SE 21 API", path: "java.sql.Types", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Types.html", usedFor: ["CachedRowSet metadata and SQL type constants"], evidence: "Oracle JDK 공식 Types API입니다." },
  { id: "java-sqlexception", repository: "Java SE 21 API", path: "java.sql.SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["SQLState, vendor code and exception chain"], evidence: "Oracle JDK 공식 SQLException API입니다." },
  { id: "java-cachedrowset", repository: "Java SE 21 API", path: "javax.sql.rowset.CachedRowSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql.rowset/javax/sql/rowset/CachedRowSet.html", usedFor: ["disconnected exact ResultSet examples and limitations"], evidence: "Oracle JDK 공식 CachedRowSet API입니다." },
  { id: "java-rowset-provider", repository: "Java SE 21 API", path: "javax.sql.rowset.RowSetProvider", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql.rowset/javax/sql/rowset/RowSetProvider.html", usedFor: ["standard CachedRowSet factory"], evidence: "Oracle JDK 공식 RowSetProvider API입니다." },
  { id: "java-optional-int", repository: "Java SE 21 API", path: "java.util.OptionalInt", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/OptionalInt.html", usedFor: ["0..1 primitive cardinality example"], evidence: "Oracle JDK 공식 OptionalInt API입니다." },
  { id: "java-jdbc-tutorial", repository: "Java Tutorials", path: "Retrieving and Modifying Values from Result Sets", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/retrieving.html", usedFor: ["cursor loop and getter learning progression"], evidence: "Oracle 공식 JDBC tutorial입니다." },
  { id: "spring-rowmapper", repository: "Spring Framework Javadoc", path: "RowMapper", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/RowMapper.html", usedFor: ["mapRow cursor/resource responsibility"], evidence: "Spring 공식 RowMapper API입니다." },
  { id: "spring-jdbctemplate", repository: "Spring Framework Reference", path: "Using JdbcTemplate", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/jdbc/core.html", usedFor: ["query, cardinality, resource and exception boundary"], evidence: "Spring 공식 JDBC reference입니다." },
];

const session = createExpertSession({
  inventoryId: "jdbc-03-resultset-row-mapping", slug: "jdbc-03-resultset-row-mapping", courseId: "spring", moduleId: "jdbc-foundations", order: 3,
  title: "ResultSet cursor와 행을 VO로 매핑하기", subtitle: "cursor·label·SQL NULL·typed getter·immutable DTO·cardinality·resource·schema를 하나의 mapping 계약으로 연결합니다.", level: "중급", estimatedMinutes: 900,
  coreQuestion: "SQL result의 각 row를 cursor/resource/type/NULL/cardinality 의미를 잃지 않고 안전한 Java value로 옮기며 schema·driver 변화에도 즉시 실패·진단 가능하게 하려면 무엇을 검증할까요?",
  summary: "SpringBasic ScoreDAOImpl의 anonymous RowMapper/ResultSet label mapping을 read-only로 감사하고 select-all, numeric-as-string와 List→ArrayList implementation coupling을 학습 개선 지점으로 사용합니다. cursor lifecycle/ownership, labels/metadata, SQL NULL/typed getters, pure immutable RowMapper, 0/1/N cardinality, projection schema evolution, fetch/stream/backpressure, SQLException mapping errors, thread/snapshot boundaries와 unit→real-driver test/telemetry까지 확장합니다. 다섯 JDK 21 CachedRowSet examples는 외부 DB 없이 cursor, aliases, NULL/zero, immutable mapping과 cardinality를 실제 Java로 실행합니다.",
  objectives: ["ResultSet before-first/current/after-last와 resource ownership을 설명한다.", "stable column aliases와 metadata로 explicit projection contract를 만든다.", "SQL NULL·numeric/time/boolean을 typed Java values로 loss 없이 매핑한다.", "RowMapper를 current row→immutable value의 pure conversion으로 구현한다.", "0/1/N cardinality와 duplicate/empty outcomes를 repository API에 강제한다.", "schema evolution과 DB/driver mapping matrix를 운영한다.", "large result fetch/stream/backpressure와 thread/snapshot boundaries를 관리한다.", "mapping errors를 redacted taxonomy로 관측하고 unit/integration/performance tests를 계층화한다."],
  prerequisites: [{ title: "PreparedStatement와 SQL injection 차단", reason: "안전하게 bind·실행된 query가 어떤 ResultSet projection을 반환하는지 이어서 매핑합니다.", sessionSlug: "jdbc-02-statement-prepared-sql-injection" }],
  keywords: ["ResultSet", "cursor", "next", "wasNull", "getObject", "JDBCType", "column label", "ResultSetMetaData", "RowMapper", "immutable DTO", "cardinality", "fetchSize", "streaming", "schema evolution"], topics,
  lab: {
    title: "점수 목록 repository를 typed·immutable·schema-safe mapping으로 재구성하기",
    scenario: "기존 score query는 select-all, mutable VO, mixed numeric/string getter와 concrete List cast를 사용합니다. nullable 점수, schema rename, 큰 export와 MySQL·Oracle driver를 안전하게 지원해야 합니다.",
    setup: ["synthetic opaque ids/names, NULL/0/min/max/overflow/duplicate labels/cardinality fixtures만 사용합니다.", "JDK 21 CachedRowSet unit tests와 ephemeral MySQL·Oracle-compatible integration environments를 준비합니다.", "explicit projection labels, SQL→Java type/nullability/unit/timezone와 0/1/N repository contracts를 작성합니다.", "expected ordered immutable DTO values와 metadata fingerprints를 고정합니다."],
    steps: ["manual/JdbcTemplate cursor ownership과 close boundary를 sequence로 그립니다.", "SELECT *를 explicit projection+unique aliases로 바꾸고 metadata를 readback합니다.", "nullable numeric을 primitive+wasNull 및 typed getObject로 비교합니다.", "anonymous mutable mapper를 named pure record mapper로 바꿉니다.", "empty/one/multiple cardinality collectors와 DB uniqueness를 negative-test합니다.", "column add/rename/type/nullability expand-contract migration matrix를 실행합니다.", "small list, bounded page와 streaming/fetchSize의 heap/connection/cancel behavior를 측정합니다.", "mapping label/type/NULL/range/SQLState errors가 partial success/PII leak 없이 taxonomy로 변환되는지 검증합니다.", "thread confinement, snapshot/count-list와 async handoff를 테스트합니다.", "DB/driver/JDK matrix의 values/metadata, rows/bytes/time/heap/pool telemetry를 canary/readback합니다."],
    expectedResult: ["모든 0/1/N rows가 explicit aliases와 typed/null-preserving immutable values로 정확히 매핑됩니다.", "duplicate/missing label, unexpected NULL, range/type/cardinality failures가 stable redacted errors로 실패합니다.", "schema rolling migration과 MySQL·Oracle driver matrix에서 approved mapping contract를 만족합니다.", "large result도 heap/GC/connection/fetch/cancel budgets 안에서 bounded 처리됩니다.", "운영 telemetry가 raw SQL/binds/DTO/PII 없이 query/row/mapping/version evidence를 제공합니다."],
    cleanup: ["ephemeral schemas·synthetic rows/metadata fixtures와 test traces를 run id로 제거합니다.", "temporary credentials/containers를 revoke·종료합니다.", "logs/artifacts에 raw name/email/token/SQL binds/connection URL이 없는지 검사합니다.", "원본 ScoreDAOImpl과 production data는 변경하지 않습니다."],
    extensions: ["record/class/constructor mapper generation과 compile-time projection validation을 비교합니다.", "JSON/ARRAY/LOB/vendor types의 codec와 streaming lifecycle을 확장합니다.", "reactive R2DBC row mapping의 backpressure/resource contract와 JDBC를 비교합니다.", "schema registry/contract tests와 migration canary 자동화를 구현합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java 예제를 JDK 21 source-file mode로 실행하고 cursor·label·NULL·DTO·cardinality evidence를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "before/current/after cursor states를 설명합니다.", "label과 physical name을 구분합니다.", "NULL과 0을 wasNull/getObject로 구분합니다.", "mapper가 cursor를 이동/close하지 않음을 보입니다.", "0/1/2 rows의 outcomes를 구분합니다."], hints: ["getter를 보기 전에 current row가 누가 만들었는지 먼저 확인하세요."], expectedOutcome: "ResultSet mapping을 setter 반복이 아니라 resource·type·cardinality contract로 설명합니다.", solutionOutline: ["cursor→projection→type/null→immutable mapper→cardinality→cleanup 순서입니다."] },
    { difficulty: "응용", prompt: "원본 ScoreDAOImpl 목록 흐름을 production-grade repository로 리팩터링하세요.", requirements: ["원본 RowMapper provenance를 보존합니다.", "select-all과 concrete List cast를 제거합니다.", "numeric schema/Java types와 NULL policy를 맞춥니다.", "immutable mapper와 explicit aliases를 사용합니다.", "0/1/N methods와 duplicate handling을 정의합니다.", "schema expand-contract와 driver matrix를 실행합니다.", "large-result page/stream/cancel budgets를 검증합니다.", "redacted error/metrics와 rollback을 포함합니다."], hints: ["JdbcTemplate이 반환하는 List의 concrete 구현을 public contract로 가정하지 마세요."], expectedOutcome: "정확성·호환성·resource·진단성이 검증된 JDBC mapping layer가 완성됩니다.", solutionOutline: ["source audit→projection contract→mapper→cardinality→integration matrix→operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JDBC ResultSet mapping 표준을 작성하세요.", requirements: ["cursor/resource ownership과 thread confinement을 정의합니다.", "projection aliases/metadata/type/nullability contract를 둡니다.", "SQL→Java numeric/time/boolean/LOB mappings를 정의합니다.", "immutable mapper purity와 N+1 금지를 둡니다.", "0/1/N/cardinality/stream API 규칙을 둡니다.", "schema migration/driver upgrade matrix를 요구합니다.", "fetch/heap/pool/cancel/query-count budgets를 정의합니다.", "error taxonomy/redaction/telemetry/test layers/runbook을 포함합니다."], hints: ["getInt가 0을 반환했다는 사실만으로 SQL 값이 0이라고 결론내릴 수 없습니다."], expectedOutcome: "초급 cursor loop부터 운영 schema/driver 변화까지 일관된 전문가 mapping governance가 완성됩니다.", solutionOutline: ["define→map→validate→bound→integrate→observe→migrate→recover 순서입니다."] },
  ],
  nextSessions: ["jdbc-04-exception-resource-trywithresources"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["ScoreDAOImpl.java를 read-only로 확인해 JdbcTemplate query1, anonymous RowMapper1/mapRow1, ResultSet label getter5, select-all1, concrete List→ArrayList cast1과 score numeric-looking getString3 흐름을 provenance로 기록했습니다.", "원본 SQL sample values/connection credentials는 복사하지 않고 mapping API와 structural improvement points만 사용했습니다.", "원본은 cursor state/resource ownership, NULL/typed mapping, projection/cardinality/schema evolution, streaming/thread/error/test/telemetry operations를 충분히 설명하지 않아 JDK/Spring 공식 문서와 synthetic examples로 보완했습니다.", "CachedRowSet exact examples는 실제 MySQL·Oracle driver의 type/timezone/metadata/fetch/stream/transaction behavior를 대체하지 않습니다."] },
});

export default session;
