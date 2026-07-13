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
      { lines: `1-${first}`, explanation: "JDK 21 표준 java.sql API와 synthetic 값만으로 SQL template, bind contract 또는 JDBC result contract를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "값과 SQL 구조를 분리하고 type·NULL·identifier·batch·generated-key 경계가 코드에서 어떻게 강제되는지 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "raw 입력이나 credential을 출력하지 않고 template·parameter count·update count·rollback decision 같은 deterministic evidence만 확인합니다." },
    ],
    run: { environment: ["JDK 21 이상", "java.sql·java.base 표준 모듈", "외부 DB·JDBC driver·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["JDK source-file mode의 stdout은 문서와 한 글자씩 같아야 합니다.", "Proxy/pure harness는 API와 application contract를 검증하지만 실제 driver의 server-side prepare, type coercion, collation, execution plan과 권한을 대체하지 않습니다."] },
    experiments: [
      { change: "빈 문자열·Unicode·quote·comment marker·극단 숫자·NULL·최대 IN 길이를 synthetic 입력에 추가합니다.", prediction: "SQL template은 변하지 않고 허용된 bind value/type/count 또는 명시적 validation error만 달라집니다.", result: "SQL shape fingerprint, parameter metadata, affected rows와 safe error category를 비교합니다." },
      { change: "같은 contract를 격리 MySQL/Oracle과 지원 driver versions에서 실행합니다.", prediction: "prepare mode와 type mapping 차이는 승인된 범위에만 있고 injection 경계와 transaction 결과는 동일합니다.", result: "server statement/plan evidence, SQLState chain, generated keys, batch counts와 persisted rows를 readback합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "statement-prepared-code-data-boundary",
    title: "Statement와 PreparedStatement를 SQL code·data 경계로 구분합니다",
    lead: "차이는 문자열을 편하게 만드는 API가 아니라 사용자 값을 SQL grammar가 다시 해석할 수 있는지 여부입니다.",
    explanations: [
      "원본 JDBCBasic.java는 Connection을 얻는 입문 단계까지 보여 주며 Statement/PreparedStatement 실행은 아직 없습니다. 이 세션은 그 다음 경계를 설계하되 원본의 실제 URL·사용자·비밀번호는 복사하지 않고 API 진행 순서만 provenance로 사용합니다.",
      "Statement에 문자열 연결로 값을 넣으면 quote, comment, operator와 subquery 문자가 SQL parser의 code가 될 수 있습니다. PreparedStatement의 `?`는 SQL 구조를 먼저 고정하고 값은 protocol/type channel로 전달하므로 같은 문자열이 문법으로 승격되지 않습니다.",
      "parameter binding은 모든 SQL 조각을 대신하지 않습니다. table/column/order direction 같은 identifier와 keyword 위치에는 일반적으로 `?`를 둘 수 없으므로 허용 목록에서 이미 검토된 상수 SQL fragment를 선택해야 합니다.",
      "PreparedStatement를 썼다는 이름만으로 안전하지 않습니다. `prepareStatement(\"...\" + input)`처럼 준비 전에 연결하거나, 일부 조건을 raw append하고 나머지만 bind하거나, 저장된 값을 나중에 다시 SQL로 조립하면 경계가 깨집니다.",
      "좋은 repository API는 raw SQL을 호출자에게 받지 않고 의미 있는 filter/sort/page command를 받아 내부 template registry와 bind schema로 변환합니다. review는 API 이름보다 최종 SQL shape와 parameter origin을 따라갑니다.",
    ],
    concepts: [
      c("SQL code/data boundary", "SQL grammar로 해석될 고정 template과 값으로만 전달될 parameter 사이의 신뢰 경계입니다.", ["template은 review된 상수입니다.", "외부 값은 typed bind로만 이동합니다."]),
      c("Statement", "완성된 SQL 문자열을 DB에 실행하는 JDBC interface입니다.", ["DDL 또는 완전히 고정된 SQL에는 쓸 수 있습니다.", "외부 값을 문자열 연결하지 않습니다."], "Statement 자체가 취약한 것이 아니라 신뢰되지 않은 값이 SQL text에 섞이는 사용 방식이 취약합니다."),
      c("PreparedStatement", "미리 정한 SQL template의 parameter marker에 값을 bind해 반복 실행하는 Statement 하위 interface입니다.", ["type-specific setter를 제공합니다.", "SQL 구조와 parameter를 분리합니다."]),
    ],
    codeExamples: [java("jdbc02-code-data", "SQL template과 공격 문자열을 data로 유지하기", "Jdbc02CodeData.java", "synthetic quote/comment 입력이 SQL text에 들어가지 않고 parameter list에만 존재하는 것을 실행 가능한 contract로 증명합니다.", String.raw`import java.util.*;

public class Jdbc02CodeData {
  record Query(String sql, List<Object> parameters) {}

  static Query byDisplayName(String value) {
    return new Query(
        "SELECT member_id, display_name FROM member WHERE display_name = ?",
        List.of(value));
  }

  public static void main(String[] args) {
    String syntheticInput = "' OR role = 'admin' --";
    Query query = byDisplayName(syntheticInput);
    System.out.println("sql=" + query.sql());
    System.out.println("parameter-count=" + query.parameters().size());
    System.out.println("input-is-parameter=" + query.parameters().getFirst().equals(syntheticInput));
    System.out.println("input-in-sql=" + query.sql().contains(syntheticInput));
    System.out.println("shape-stable=" + query.sql().endsWith("display_name = ?"));
  }
}`, "sql=SELECT member_id, display_name FROM member WHERE display_name = ?\nparameter-count=1\ninput-is-parameter=true\ninput-in-sql=false\nshape-stable=true", ["java-statement", "java-prepared-statement", "oracle-prepared-tutorial"])],
    diagnostics: [
      d("PreparedStatement를 사용했는데 penetration test에서 injection이 재현됩니다.", "prepareStatement 호출 전에 filter/order fragment를 raw input으로 연결했습니다.", ["최종 SQL text construction", "각 fragment의 origin", "parameter marker/count", "repository API가 raw SQL을 받는지"], "모든 value를 marker로 옮기고 구조적 선택은 enum/allow-list가 승인한 상수 template으로 제한합니다.", "SQL shape snapshot과 hostile corpus에서 입력이 SQL text에 없다는 assertion을 둡니다."),
      d("고정 SQL인데도 Statement 사용 자체를 모두 취약점으로 보고합니다.", "API 이름과 실제 trust boundary를 구분하지 않았습니다.", ["SQL text가 compile-time constant인지", "외부/DB/file 값 연결 여부", "identifier selection", "실행 권한"], "완전 고정 SQL은 별도 정책으로 허용하되 값이 생기는 즉시 PreparedStatement bind로 전환합니다.", "static analysis를 concatenation/data-flow 중심으로 구성하고 예외에는 근거와 owner를 둡니다."),
    ],
    expertNotes: ["SQL injection review의 단위는 한 줄이 아니라 source에서 sink까지 값의 생명주기입니다.", "prepared라는 용어는 보안 보증서가 아니므로 최종 SQL shape·bind schema·권한·transaction evidence를 함께 봅니다."],
  },
  {
    id: "injection-grammar-parameter-binding",
    title: "인젝션을 quote 문제가 아닌 parser grammar 변경으로 이해합니다",
    lead: "따옴표 하나를 escape하는 접근은 문자열 literal 일부만 다루며 숫자·identifier·comment·encoding·다중 해석 경계를 놓칩니다.",
    explanations: [
      "공격 핵심은 입력이 원래 의도한 한 값이 아니라 boolean operator, comment, UNION/subquery, stacked statement 또는 함수 호출 같은 SQL syntax가 되는 것입니다. dialect와 driver 옵션에 따라 가능한 grammar가 달라집니다.",
      "수동 quote replacement는 escaping mode, character set, backslash semantics와 double decoding 차이로 깨집니다. 숫자 field도 raw concatenation하면 `0 OR 1=1`처럼 quote 없이 구조를 바꿀 수 있으므로 parse/validate 후 typed bind합니다.",
      "parameter marker는 하나의 scalar value 위치를 나타냅니다. 값 안의 quote/comment marker는 DB protocol을 통해 literal data로 처리되며 SQL keyword나 identifier로 재해석되지 않아야 합니다.",
      "서버가 실제로 statement를 미리 compile하는지, driver가 client-side emulation을 쓰는지는 성능·metadata에 영향을 줄 수 있지만 정상적인 driver의 bind contract가 지켜지면 code/data 분리는 유지됩니다. 다만 driver/dialect configuration을 지원 matrix로 검증합니다.",
      "오류 기반 방어에 기대지 않습니다. 공격 입력이 syntax error로 실패했다는 것은 경계가 안전하다는 증거가 아닙니다. template stability, bind count/type, stored/readback data와 authorization 결과를 긍정적으로 검증합니다.",
    ],
    concepts: [
      c("SQL grammar injection", "외부 data가 parser token/production으로 해석돼 원래 query 구조나 의미를 바꾸는 현상입니다.", ["quote 기반에 한정되지 않습니다.", "dialect와 context를 고려합니다."]),
      c("parameter marker", "PreparedStatement template에서 한 bind value의 위치를 표시하는 `?`입니다.", ["일반적으로 identifier 전체를 대신하지 못합니다.", "marker 수와 setter 호출을 일치시킵니다."]),
      c("template stability", "입력 값이 달라도 실행 SQL의 승인된 구조/fingerprint가 변하지 않는 성질입니다.", ["optional filter는 승인된 template variant로 관리합니다.", "관측에는 raw value를 넣지 않습니다."]),
    ],
    diagnostics: [
      d("apostrophe를 두 번 바꿨는데 숫자 검색에서 조건 우회가 됩니다.", "문자열 literal escape만 적용하고 숫자 token 위치에 raw input을 붙였습니다.", ["field별 parser/validator", "SQL concatenation", "expected Java/JDBC type", "dialect grammar"], "외부 문자열을 domain type으로 엄격히 parse/range-check하고 setInt/setLong 등으로 bind합니다.", "quote 유무와 무관한 operator/comment/Unicode corpus를 모든 input class에 실행합니다."),
      d("hostile input이 syntax error를 내므로 안전하다고 판정했습니다.", "negative error만 보고 SQL shape/bind/persisted authorization을 검증하지 않았습니다.", ["prepared SQL template", "bound parameter capture", "DB audit/rows affected", "effective DB role"], "stable template과 typed parameter를 assert하고 테스트 transaction에서 허용된 row만 변했는지 readback합니다.", "syntax-error 기반 test를 code/data property test와 권한 test로 대체합니다."),
    ],
    expertNotes: ["escape는 출력 context별 encoding 문제이고 parameterization은 SQL parser에 code와 data를 다른 channel로 전달하는 문제입니다.", "hostile corpus는 exploit 문자열 목록보다 grammar context와 canonicalization 단계를 포괄하도록 설계합니다."],
  },
  {
    id: "typed-bindings-range-temporal-decimal",
    title: "Java domain type을 JDBC setter·SQL type과 명시적으로 맞춥니다",
    lead: "모든 값을 setString으로 보내면 injection은 막을 수 있어도 rounding, timezone, index usage와 암묵적 변환 장애가 남습니다.",
    explanations: [
      "입력은 controller에서 문자열로 도착할 수 있지만 repository 경계에서는 int/long, BigDecimal, boolean, LocalDate, Instant/OffsetDateTime, enum/value object처럼 검증된 domain type이어야 합니다. parse failure와 out-of-range를 SQL 실행 전에 분리합니다.",
      "setInt/setLong/setBigDecimal/setBoolean/setDate/setTimestamp 또는 setObject와 명시적 JDBCType을 schema column과 맞춥니다. driver가 지원하는 Java time mapping과 timezone normalization은 version matrix에서 확인합니다.",
      "금액을 double로 변환하면 binary floating-point rounding이 생깁니다. precision/scale가 있는 BigDecimal을 사용하고 application validation, JDBC bind, DB constraint와 readback scale 정책을 일치시킵니다.",
      "날짜만 필요한 column과 순간을 나타내는 timestamp를 구분합니다. server/session timezone에 암묵적으로 의존하지 않고 저장 표준과 display timezone을 분리하며 DST 경계 test를 둡니다.",
      "ParameterMetaData는 유용하지만 driver마다 지원/정확도가 다를 수 있어 application의 bind schema를 대체하지 않습니다. SQL template id별 parameter position, name, domain/JDBC type, nullable, redaction과 validation 규칙을 code로 유지합니다.",
    ],
    concepts: [
      c("bind schema", "각 parameter 위치의 의미·Java type·JDBC type·nullable·validation·redaction을 정의한 계약입니다.", ["SQL template과 함께 versioning합니다.", "setter 호출을 생성/검증할 수 있습니다."]),
      c("JDBCType", "java.sql.Types의 정수 code를 type-safe enum으로 표현하는 SQLType 구현입니다.", ["setObject/setNull의 target type에 쓸 수 있습니다.", "driver support를 검증합니다."]),
      c("implicit conversion", "DB가 bind type을 column type으로 런타임 변환하는 동작입니다.", ["오류나 index 비사용을 만들 수 있습니다.", "명시적 matching을 선호합니다."]),
    ],
    codeExamples: [java("jdbc02-typed-bind", "PreparedStatement의 type·NULL binding 기록", "Jdbc02TypedBind.java", "Proxy PreparedStatement로 실제 setter 호출의 position, Java value type과 JDBC NULL type을 기록합니다.", String.raw`import java.lang.reflect.*;
import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

public class Jdbc02TypedBind {
  static Object primitiveDefault(Class<?> type) {
    if (type == boolean.class) return false;
    if (type == int.class) return 0;
    if (type == long.class) return 0L;
    return 0;
  }

  public static void main(String[] args) throws Exception {
    SortedMap<Integer, String> bindings = new TreeMap<>();
    InvocationHandler recorder = (proxy, method, values) -> {
      switch (method.getName()) {
        case "setString" -> bindings.put((Integer) values[0], "String:" + values[1]);
        case "setInt" -> bindings.put((Integer) values[0], "Integer:" + values[1]);
        case "setObject" -> bindings.put((Integer) values[0], values[1].getClass().getSimpleName() + ":" + values[1] + ":" + values[2]);
        case "setNull" -> bindings.put((Integer) values[0], "NULL:" + JDBCType.valueOf((Integer) values[1]));
        case "executeUpdate" -> { return 1; }
      }
      return method.getReturnType().isPrimitive() ? primitiveDefault(method.getReturnType()) : null;
    };
    PreparedStatement ps = (PreparedStatement) Proxy.newProxyInstance(
        PreparedStatement.class.getClassLoader(), new Class<?>[]{PreparedStatement.class}, recorder);
    ps.setString(1, "neo");
    ps.setInt(2, 7);
    ps.setObject(3, new BigDecimal("19.90"), JDBCType.DECIMAL);
    ps.setNull(4, JDBCType.VARCHAR.getVendorTypeNumber());
    System.out.println("bindings=" + bindings);
    System.out.println("affected=" + ps.executeUpdate());
    System.out.println("positions=" + bindings.keySet());
  }
}`, "bindings={1=String:neo, 2=Integer:7, 3=BigDecimal:19.90:DECIMAL, 4=NULL:VARCHAR}\naffected=1\npositions=[1, 2, 3, 4]", ["java-prepared-statement", "java-sql-type", "java-jdbc-type", "java-parameter-metadata"])],
    diagnostics: [
      d("index가 있는데도 numeric/date 조건 query가 full scan합니다.", "column과 다른 string bind가 암묵적 conversion을 유발했습니다.", ["setter method/value class", "column type/collation", "actual execution plan", "driver/server version"], "domain/JDBC/column type을 맞추고 plan과 result를 supported matrix에서 다시 검증합니다.", "template별 bind schema와 plan regression fixture를 둡니다."),
      d("금액 또는 timestamp가 저장 후 미세하게 달라집니다.", "double 변환, scale 정책 또는 timezone/session default가 암묵적입니다.", ["original domain value", "setter/JDBCType", "column precision/scale/timezone semantics", "round-trip readback"], "BigDecimal·명시적 rounding과 표준 instant/date mapping을 적용하고 range/scale를 DB 전 검증합니다.", "precision/scale/DST/leap-boundary round-trip property tests를 둡니다."),
    ],
    expertNotes: ["bind type은 보안뿐 아니라 query plan, data fidelity와 cross-driver portability 계약입니다.", "ParameterMetaData는 관측 보조 수단이며 application이 parameter 의미와 sensitivity를 소유해야 합니다."],
  },
  {
    id: "sql-null-three-valued-logic",
    title: "Java null·SQL NULL·3값 논리를 별도 설계합니다",
    lead: "`column = ?`에 NULL을 bind하면 `column IS NULL`과 같은 의미가 되지 않으며 UNKNOWN 때문에 결과에서 제외됩니다.",
    explanations: [
      "SQL NULL은 빈 문자열이나 0이 아니라 알 수 없거나 해당 없음인 표식입니다. 비교 결과는 TRUE/FALSE뿐 아니라 UNKNOWN이 될 수 있고 WHERE는 TRUE인 행만 남깁니다.",
      "검색 조건이 nullable이면 의미를 먼저 정합니다. null이 filter 미지정을 뜻하면 predicate 자체를 빼는 승인된 template variant, NULL 행 검색이면 `IS NULL`, 값 비교면 `= ?`와 non-null bind를 선택합니다.",
      "bind할 값이 null이면 setNull(position, Types/JDBCType code)로 예상 SQL type을 전달하거나 driver가 명확히 지원하는 setObject overload를 사용합니다. untyped null 추론은 driver/DB마다 실패하거나 다른 type을 고를 수 있습니다.",
      "`NOT IN` 목록에 NULL이 들어가면 기대와 다른 UNKNOWN 전파가 일어날 수 있습니다. nullable column/list의 truth table을 작성하고 EXISTS/NOT EXISTS 또는 명시적 NULL branch로 의미를 드러냅니다.",
      "Oracle의 empty-string/NULL 취급처럼 dialect 차이가 있으므로 empty, blank, NULL domain policy를 application validation과 DB constraint에 맞춥니다. API response에서 omitted/null/empty도 구분합니다.",
    ],
    concepts: [
      c("SQL NULL", "값의 부재/unknown을 나타내는 SQL 표식이며 일반 값처럼 `=` 비교하지 않습니다.", ["IS NULL/IS NOT NULL을 사용합니다.", "aggregate와 constraint semantics도 확인합니다."]),
      c("three-valued logic", "predicate 결과가 TRUE, FALSE, UNKNOWN 세 값이 되는 SQL 논리입니다.", ["WHERE는 TRUE만 통과시킵니다.", "NOT UNKNOWN도 UNKNOWN입니다."]),
      c("typed null", "parameter 값은 없지만 DB가 해석할 target SQL type을 함께 전달한 bind입니다.", ["setNull과 type code를 사용합니다.", "schema/bind contract에 nullable을 기록합니다."]),
    ],
    diagnostics: [
      d("NULL을 bind했는데 NULL 행이 검색되지 않습니다.", "`column = NULL`에 해당하는 UNKNOWN semantics를 `IS NULL`로 착각했습니다.", ["generated SQL variant", "bound value/type", "column nullability", "truth-table test"], "NULL 검색은 고정 `IS NULL` template을 선택하고 값 비교 template은 non-null만 허용합니다.", "null/empty/value별 golden rows와 predicate truth table test를 둡니다."),
      d("setObject(index, null)이 한 driver에서만 type inference 오류를 냅니다.", "untyped null의 target SQL type을 driver에게 맡겼습니다.", ["setter overload", "ParameterMetaData support", "column SQL type", "driver/version difference"], "bind schema의 JDBCType으로 setNull 또는 명시적 setObject overload를 호출합니다.", "supported driver matrix에 모든 nullable parameter의 null execution을 포함합니다."),
    ],
    expertNotes: ["optional filter, search for NULL, write NULL은 서로 다른 use case이며 하나의 null branch로 합치지 않습니다.", "NULL 관련 bug는 syntax보다 truth table과 domain meaning을 먼저 써야 빠르게 해결됩니다."],
  },
  {
    id: "dynamic-identifiers-order-allowlist",
    title: "동적 column·table·ORDER BY는 enum과 allow-list로 구조화합니다",
    lead: "identifier 위치에는 parameter marker를 사용할 수 없으므로 raw input을 quote하는 대신 안전한 구조 선택 API가 필요합니다.",
    explanations: [
      "`ORDER BY ?`는 보통 column identifier를 선택하지 않고 하나의 constant value를 정렬 표현식으로 취급합니다. table, column, ASC/DESC, operator와 function은 SQL grammar이므로 value binding과 다른 해결책이 필요합니다.",
      "외부 sort key를 내부 enum으로 parse한 뒤 enum이 가진 고정 SQL fragment를 선택합니다. unknown 값은 default로 조용히 대체하기보다 400 validation error 또는 명시적 product default를 반환합니다.",
      "identifier quoting/backtick/double quote는 reserved word·case를 처리하는 dialect 기능이지 untrusted identifier validation이 아닙니다. quote 내부 escape, qualification과 dialect 차이 때문에 raw input을 안전하게 만드는 일반 해법으로 쓰지 않습니다.",
      "tenant마다 table/schema 이름을 조립하는 설계는 injection뿐 아니라 plan cache, migration, 권한과 noisy-neighbor 운영을 복잡하게 합니다. 가능한 한 row-level tenant key, fixed views 또는 vetted routing metadata를 사용합니다.",
      "template variants가 많아져도 string builder 자유 조립보다 registry로 관리합니다. template id, allowed fragments, parameter schema, required role, max rows와 timeout을 함께 versioning하고 test snapshots를 둡니다.",
    ],
    concepts: [
      c("dynamic identifier", "요청에 따라 선택하려는 table/column/schema 이름처럼 SQL 구조에 속하는 token입니다.", ["일반 bind marker 대상이 아닙니다.", "승인된 상수로 map합니다."]),
      c("allow-list mapping", "외부의 제한된 key를 검토된 내부 SQL fragment와 정확히 대응시키는 변환입니다.", ["enum/map으로 exhaustiveness를 확보합니다.", "unknown을 거부합니다."]),
      c("template registry", "승인된 SQL shapes와 bind/권한/limit 정책을 stable id로 관리하는 목록입니다.", ["관측과 review 기준이 됩니다.", "variant explosion을 제한합니다."]),
    ],
    codeExamples: [java("jdbc02-dynamic-shape", "정렬 allow-list와 가변 IN placeholder", "Jdbc02DynamicShape.java", "외부 sort key를 enum으로 제한하고 IN marker 수만 생성하며 unknown structure와 빈 목록을 거부합니다.", String.raw`import java.util.*;
import java.util.stream.Collectors;

public class Jdbc02DynamicShape {
  enum SortField {
    NAME("display_name"), CREATED("created_at");
    final String sql;
    SortField(String sql) { this.sql = sql; }
    static SortField parse(String value) {
      return switch (value) {
        case "name" -> NAME;
        case "created" -> CREATED;
        default -> throw new IllegalArgumentException("sort-field-not-allowed");
      };
    }
  }
  enum Direction {
    ASC, DESC;
    static Direction parse(String value) {
      return switch (value.toLowerCase(Locale.ROOT)) {
        case "asc" -> ASC;
        case "desc" -> DESC;
        default -> throw new IllegalArgumentException("direction-not-allowed");
      };
    }
  }
  static String markers(int size) {
    if (size < 1 || size > 100) throw new IllegalArgumentException("id-count-out-of-range");
    return java.util.stream.IntStream.range(0, size).mapToObj(i -> "?").collect(Collectors.joining(", "));
  }
  static String query(String sort, String direction, int idCount) {
    SortField field = SortField.parse(sort);
    Direction order = Direction.parse(direction);
    return "SELECT member_id, display_name FROM member WHERE member_id IN (" + markers(idCount) + ") ORDER BY " + field.sql + " " + order;
  }
  public static void main(String[] args) {
    System.out.println("sql=" + query("created", "desc", 3));
    System.out.println("bind-count=3");
    try { query("unknown", "asc", 1); }
    catch (IllegalArgumentException e) { System.out.println("unknown-sort=" + e.getMessage()); }
    try { query("name", "asc", 0); }
    catch (IllegalArgumentException e) { System.out.println("empty-in=" + e.getMessage()); }
  }
}`, "sql=SELECT member_id, display_name FROM member WHERE member_id IN (?, ?, ?) ORDER BY created_at DESC\nbind-count=3\nunknown-sort=sort-field-not-allowed\nempty-in=id-count-out-of-range", ["java-prepared-statement", "mysql-identifier-qualifiers", "sqlite-bind-parameters"])],
    diagnostics: [
      d("ORDER BY parameter를 bind했는데 요청한 column 순서가 적용되지 않습니다.", "value marker를 identifier selector로 오해했습니다.", ["actual SQL/plan", "sort key mapping", "result order with ties", "dialect behavior"], "외부 key를 enum allow-list의 고정 column fragment로 map하고 direction도 별도 enum으로 제한합니다.", "각 허용 sort/direction과 unknown key rejection을 integration test합니다."),
      d("관리자용 table 선택 기능에서 identifier injection이 발견됩니다.", "raw schema/table 이름을 quote만 하거나 문자열로 연결했습니다.", ["identifier origin", "allow-list source mutability", "qualification/quoting", "DB role accessible objects"], "검토된 logical key→고정 fully-qualified identifier mapping을 사용하고 실행 role의 접근 범위를 축소합니다.", "mapping 변경 review, catalog readback과 forbidden-object authorization test를 둡니다."),
    ],
    expertNotes: ["동적 구조가 필요할수록 DSL/AST 또는 제한된 enum이 raw SQL string보다 review 가능성이 높습니다.", "allow-list 저장소 자체가 외부에서 수정 가능하면 또 다른 신뢰 경계이므로 변경 권한·서명·감사를 적용합니다."],
  },
  {
    id: "variable-in-list-shape-limits",
    title: "가변 IN 목록을 marker 수·빈 목록·상한·대안 전략으로 다룹니다",
    lead: "하나의 `?`에 collection을 넣는 것은 일반 JDBC scalar binding이 아니며 빈 목록과 수천 개 목록은 의미·성능·limit 문제를 만듭니다.",
    explanations: [
      "일반적인 portable JDBC에서는 값 개수만큼 `?, ?, ?` marker를 생성하고 각 값을 순서대로 bind합니다. marker text만 application이 만들고 값은 절대 SQL text에 합치지 않습니다.",
      "빈 목록은 `IN ()` syntax에 의존하지 않습니다. product semantics가 match none이면 query를 실행하지 않고 empty result를 반환하거나 `WHERE 1 = 0`인 고정 variant를 선택합니다. filter 미지정과 empty selection을 구분합니다.",
      "목록 길이는 API와 DB limits, packet size, parse/plan cost를 고려해 상한을 둡니다. 큰 목록은 batch/chunk만으로 consistency가 바뀔 수 있으므로 temporary table, staging table, array/table-valued parameter 또는 join 전략을 dialect별로 검토합니다.",
      "중복 ID 제거와 입력 순서 보존 여부를 명시합니다. deduplicate가 parameter count와 semantics를 바꾸고 결과 정렬은 IN 목록 순서를 자동 보장하지 않으므로 별도 ordering contract가 필요합니다.",
      "SQL shape가 marker count마다 달라 plan cache가 분산될 수 있습니다. size bucket, fixed array support, temp-table join과 latency/plan evidence를 비교하되 안전성을 위해 raw comma join으로 퇴행하지 않습니다.",
    ],
    concepts: [
      c("placeholder expansion", "collection 원소 수만큼 안전한 `?` marker만 SQL template에 추가하는 방식입니다.", ["값은 position별 bind합니다.", "size를 제한합니다."]),
      c("empty-list semantics", "빈 selection이 filter 없음인지 match none인지 product 의미를 정한 계약입니다.", ["SQL dialect 우연에 맡기지 않습니다.", "repository API에서 분리합니다."]),
      c("large-set transport", "많은 key를 temp/staging table, array 또는 table-valued mechanism으로 DB에 전달하는 전략입니다.", ["vendor capability에 의존할 수 있습니다.", "transaction/cleanup/권한을 설계합니다."]),
    ],
    diagnostics: [
      d("List를 setObject 한 번으로 bind했더니 type 오류 또는 한 값으로 처리됩니다.", "JDBC scalar parameter marker에 collection expansion을 기대했습니다.", ["SQL marker count", "setter calls", "driver array support", "column type"], "portable path는 bounded marker expansion+position bind를 사용하고 vendor array는 명시적 adapter/integration test로 격리합니다.", "size 1/2/max/max+1과 actual matched rows를 golden test합니다."),
      d("대량 ID 검색이 DB CPU와 plan cache를 고갈시킵니다.", "무제한 marker expansion으로 SQL shapes와 parse/network cost가 폭증했습니다.", ["list size distribution", "distinct SQL fingerprints", "packet/parse/plan latency", "DB parameter limits"], "API 상한과 admission을 적용하고 큰 집합은 temp/staging join 등 승인된 경로로 분리합니다.", "load test와 plan-cache cardinality/error-budget alert를 둡니다."),
    ],
    expertNotes: ["IN 목록의 보안 해법은 marker expansion이고 운영 해법은 size budget과 large-set transport까지 포함합니다.", "chunking은 개별 query를 작게 만들지만 snapshot consistency·pagination·ordering을 자동 보장하지 않습니다."],
  },
  {
    id: "batch-execution-partial-failure-transaction",
    title: "batch update counts와 부분 실패를 transaction 정책으로 해석합니다",
    lead: "executeBatch는 성공/실패 배열만 주는 편의 기능이 아니라 row별 결과, driver 지속 실행 정책과 rollback 범위를 해석해야 하는 프로토콜입니다.",
    explanations: [
      "PreparedStatement batch는 template을 고정한 채 각 row 값을 bind하고 addBatch로 snapshot한 뒤 executeBatch/executeLargeBatch를 호출합니다. mutable object 재사용이나 누락 setter가 이전 row 값을 흘리지 않게 모든 parameter를 매번 설정합니다.",
      "반환 update count는 실제 non-negative count, `SUCCESS_NO_INFO`, `EXECUTE_FAILED`를 포함할 수 있습니다. BatchUpdateException의 counts 길이는 driver가 실패 뒤 중단했는지 계속했는지에 따라 다를 수 있으므로 input row와 index를 안전하게 대응시킵니다.",
      "all-or-nothing 요구이면 autoCommit=false에서 batch를 실행하고 어떤 row라도 실패하거나 count invariant가 깨지면 전체 rollback합니다. partial acceptance 요구이면 savepoint/chunk/idempotency와 row별 결과 API를 명시합니다.",
      "batch size는 round-trip, memory, lock duration, transaction log와 error localization 사이의 trade-off입니다. 고정된 큰 값이 아니라 payload size와 DB evidence로 상한을 정하고 deadline/cancellation 후 transaction state를 확인합니다.",
      "retry는 batch 전체를 무조건 재전송하지 않습니다. commit outcome이 unknown이면 duplicate를 만들 수 있으므로 natural/idempotency key, unique constraint와 reconciliation readback이 필요합니다.",
    ],
    concepts: [
      c("batch snapshot", "현재 parameter set을 실행 대기열의 한 row로 추가한 상태입니다.", ["각 row에서 모든 parameter를 다시 bind합니다.", "addBatch 뒤 mutable source를 신뢰하지 않습니다."]),
      c("update counts", "batch 각 command의 영향 행 수 또는 SUCCESS_NO_INFO/EXECUTE_FAILED sentinel 배열입니다.", ["input index와 연결합니다.", "transaction commit 증거와 다릅니다."]),
      c("unknown commit outcome", "client가 응답을 잃어 server commit 성공 여부를 확정할 수 없는 상태입니다.", ["blind retry가 중복을 만듭니다.", "idempotency/reconciliation이 필요합니다."]),
    ],
    codeExamples: [java("jdbc02-batch-counts", "BatchUpdateException의 부분 결과 해석", "Jdbc02BatchCounts.java", "JDBC 표준 sentinel을 포함한 synthetic update counts를 분류하고 all-or-nothing rollback 결정을 계산합니다.", String.raw`import java.sql.*;
import java.util.*;

public class Jdbc02BatchCounts {
  record Summary(int exactRows, int unknownSuccess, int failed, boolean rollback) {}

  static Summary summarize(int[] counts) {
    int exact = 0;
    int unknown = 0;
    int failed = 0;
    for (int count : counts) {
      if (count >= 0) exact += count;
      else if (count == Statement.SUCCESS_NO_INFO) unknown++;
      else if (count == Statement.EXECUTE_FAILED) failed++;
      else throw new IllegalArgumentException("unknown-update-count");
    }
    return new Summary(exact, unknown, failed, failed > 0);
  }

  public static void main(String[] args) {
    int[] partial = {1, Statement.SUCCESS_NO_INFO, Statement.EXECUTE_FAILED, 2};
    BatchUpdateException failure = new BatchUpdateException(
        "synthetic-batch-failure", "23000", 0, partial);
    Summary summary = summarize(failure.getUpdateCounts());
    System.out.println("sql-state-class=" + failure.getSQLState().substring(0, 2));
    System.out.println("count-entries=" + failure.getUpdateCounts().length);
    System.out.println("exact-rows=" + summary.exactRows());
    System.out.println("unknown-success=" + summary.unknownSuccess());
    System.out.println("failed=" + summary.failed());
    System.out.println("decision=" + (summary.rollback() ? "ROLLBACK_ALL" : "COMMIT"));
  }
}`, "sql-state-class=23\ncount-entries=4\nexact-rows=3\nunknown-success=1\nfailed=1\ndecision=ROLLBACK_ALL", ["java-prepared-statement", "java-statement", "java-batch-update-exception", "java-sql-exception"])],
    diagnostics: [
      d("batch 한 row 실패 뒤 일부 row만 저장됐지만 API는 전체 실패만 반환합니다.", "autoCommit/transaction 정책과 BatchUpdateException counts를 해석하지 않았습니다.", ["autoCommit/commit/rollback trace", "update counts length/values", "driver continue-on-error behavior", "persisted rows readback"], "all-or-nothing이면 명시적 transaction rollback, partial이면 row-index 결과와 idempotency를 계약화합니다.", "중간 index constraint failure와 disconnect를 fault-inject하고 persisted set을 assert합니다."),
      d("batch retry 뒤 duplicate rows가 생깁니다.", "timeout 후 commit outcome을 확인하지 않고 전체 payload를 재실행했습니다.", ["idempotency/natural keys", "unique constraints", "transaction/audit record", "reconciliation query"], "stable operation key와 unique constraint를 두고 unknown outcome은 readback 후 missing rows만 복구합니다.", "response-loss-after-commit test와 repeated-request invariant를 둡니다."),
    ],
    expertNotes: ["update count는 statement 실행 결과이며 transaction durability를 단독으로 증명하지 않습니다.", "batch 성능 최적화 전에 실패 모델과 row-to-count correlation을 먼저 고정합니다."],
  },
  {
    id: "generated-keys-affected-rows-concurrency",
    title: "generated keys와 affected rows를 명시적 write contract로 검증합니다",
    lead: "INSERT 성공 여부와 새 key, UPDATE 대상 존재 여부, optimistic concurrency는 서로 다른 증거이며 API에서 구분해야 합니다.",
    explanations: [
      "generated key가 필요하면 prepareStatement에서 `Statement.RETURN_GENERATED_KEYS` 또는 column names를 요청하고 execute 후 getGeneratedKeys ResultSet을 소유권 안에서 읽습니다. 지원 범위와 multi-row key ordering은 driver matrix에서 확인합니다.",
      "executeUpdate 반환 0은 UPDATE/DELETE에서 대상 없음, predicate mismatch 또는 optimistic version conflict일 수 있습니다. 1 expected invariant를 명시하고 0/2+를 domain outcome 또는 integrity failure로 분류합니다.",
      "MySQL/Oracle의 identity/sequence/RETURNING 지원 차이를 숨기는 adapter를 두되 key를 얻기 위해 `SELECT MAX(id)` 같은 race-prone query를 사용하지 않습니다. client-generated UUID도 collision/format/index trade-off를 검토합니다.",
      "generated key ResultSet과 PreparedStatement는 Connection scope 안에서 닫습니다. key를 읽기 전에 statement를 닫거나 pool connection을 반환하지 않으며 failure에서 resource와 transaction cleanup을 보장합니다.",
      "optimistic locking은 `UPDATE ... WHERE id = ? AND version = ?`와 affected=1을 함께 검증하고 version을 증가시킵니다. blind retry는 사용자의 동시 변경을 덮으므로 conflict를 상위 계층에 명시적으로 전달합니다.",
    ],
    concepts: [
      c("generated keys", "INSERT 등 실행 결과로 DB/driver가 돌려주는 identity 값의 ResultSet입니다.", ["명시적으로 반환을 요청합니다.", "statement/connection scope에서 읽습니다."]),
      c("affected-row invariant", "한 write가 예상대로 몇 행을 변경해야 하는지 정한 계약입니다.", ["0과 2+를 별도 처리합니다.", "driver changed-row/matched-row semantics를 확인합니다."]),
      c("optimistic locking", "version 값을 predicate에 포함하고 affected row count로 동시 변경을 탐지하는 방식입니다.", ["conflict를 retry/merge/UI에 전달합니다.", "last-write-wins와 다릅니다."]),
    ],
    codeExamples: [java("jdbc02-generated-keys", "executeUpdate와 generated-key ResultSet ownership", "Jdbc02GeneratedKeys.java", "Proxy PreparedStatement/ResultSet으로 affected=1과 key 한 건을 읽고 두 resource가 모두 닫히는지 증명합니다.", String.raw`import java.lang.reflect.*;
import java.sql.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class Jdbc02GeneratedKeys {
  static Object primitiveDefault(Class<?> type) {
    if (type == boolean.class) return false;
    if (type == int.class) return 0;
    if (type == long.class) return 0L;
    return 0;
  }

  public static void main(String[] args) throws Exception {
    AtomicBoolean first = new AtomicBoolean(true);
    AtomicBoolean keysClosed = new AtomicBoolean(false);
    AtomicBoolean statementClosed = new AtomicBoolean(false);
    ResultSet keys = (ResultSet) Proxy.newProxyInstance(
        ResultSet.class.getClassLoader(), new Class<?>[]{ResultSet.class}, (proxy, method, values) -> switch (method.getName()) {
          case "next" -> first.getAndSet(false);
          case "getLong" -> 501L;
          case "close" -> { keysClosed.set(true); yield null; }
          default -> method.getReturnType().isPrimitive() ? primitiveDefault(method.getReturnType()) : null;
        });
    PreparedStatement statement = (PreparedStatement) Proxy.newProxyInstance(
        PreparedStatement.class.getClassLoader(), new Class<?>[]{PreparedStatement.class}, (proxy, method, values) -> switch (method.getName()) {
          case "executeUpdate" -> 1;
          case "getGeneratedKeys" -> keys;
          case "close" -> { statementClosed.set(true); yield null; }
          default -> method.getReturnType().isPrimitive() ? primitiveDefault(method.getReturnType()) : null;
        });
    long key;
    try (statement) {
      int affected = statement.executeUpdate();
      try (ResultSet generated = statement.getGeneratedKeys()) {
        if (affected != 1 || !generated.next()) throw new SQLException("write-contract-failed");
        key = generated.getLong(1);
        System.out.println("affected=" + affected);
        System.out.println("generated-key=" + key);
        System.out.println("extra-key=" + generated.next());
      }
    }
    System.out.println("keys-closed=" + keysClosed.get());
    System.out.println("statement-closed=" + statementClosed.get());
  }
}`, "affected=1\ngenerated-key=501\nextra-key=false\nkeys-closed=true\nstatement-closed=true", ["java-statement", "java-prepared-statement", "oracle-retrieving-tutorial", "oracle-jdbc-coding-tips"])],
    diagnostics: [
      d("INSERT 뒤 SELECT MAX(id)로 다른 요청의 key를 반환합니다.", "generated-key API 대신 concurrency-safe하지 않은 전역 aggregate를 사용했습니다.", ["prepare flags", "getGeneratedKeys/RETURNING support", "transaction isolation", "concurrent insert trace"], "driver가 지원하는 generated keys/RETURNING 또는 명시적 sequence/client id를 사용합니다.", "동시 insert test에서 각 request의 persisted row/key 상관관계를 검증합니다."),
      d("optimistic update가 0행인데 성공 response를 보냅니다.", "executeUpdate count를 무시해 missing row와 version conflict를 구분하지 않았습니다.", ["affected count", "id/version predicate", "current version readback", "API outcome mapping"], "expected count=1을 검사하고 0은 not-found/conflict 판별 정책으로, 2+는 integrity incident로 처리합니다.", "0/1/2 counts와 concurrent writers를 포함한 repository contract test를 둡니다."),
    ],
    expertNotes: ["key를 얻는 방법은 database dialect adapter가 소유하고 application에는 typed result로 노출합니다.", "write 성공은 예외 없음이 아니라 affected-row·key·commit·readback 중 use case가 요구하는 증거의 조합입니다."],
  },
  {
    id: "logging-redaction-least-privilege",
    title: "SQL 관측을 template 중심으로 만들고 DB 권한으로 blast radius를 줄입니다",
    lead: "raw SQL과 parameter를 전부 로그에 남기면 디버깅은 쉬워 보여도 secret·PII 유출과 injection blast radius를 동시에 키웁니다.",
    explanations: [
      "관측에는 stable template id/fingerprint, operation, table domain, parameter count와 type category, elapsed, rows, SQLState class, retryability와 transaction outcome을 남깁니다. raw parameter와 완성 SQL은 기본적으로 제외합니다.",
      "email, token, password, free text, search term, generated SQL fragment와 exception message는 민감할 수 있습니다. sensitivity schema로 field를 분류하고 allow-list 방식의 structured logger와 restricted debug escalation을 사용합니다.",
      "PreparedStatement.toString은 driver마다 SQL/parameter를 포함하거나 형식이 다르므로 portable/safe telemetry API가 아닙니다. application이 template id와 safe metadata를 직접 소유합니다.",
      "injection 예방이 실패해도 application DB principal은 필요한 schema의 최소 SELECT/INSERT/UPDATE/DELETE와 approved procedures만 가져야 합니다. DDL, account management, filesystem/network, 다른 tenant/schema 권한을 제거합니다.",
      "read/write 분리와 row/tenant policy는 application routing과 DB enforcement를 함께 검증합니다. 최소 권한은 parameterization 대체재가 아니라 사고의 영향 범위를 제한하는 독립 방어층입니다.",
    ],
    concepts: [
      c("SQL template fingerprint", "parameter 값을 제거한 승인된 SQL shape를 식별하는 안정 id/hash입니다.", ["latency/error/plan 집계에 사용합니다.", "raw literals를 포함하지 않습니다."]),
      c("least-privilege DB role", "application use case에 필요한 object/action만 허용한 database principal입니다.", ["migration/admin role과 분리합니다.", "권한 변경을 audit합니다."]),
      c("safe diagnostic envelope", "template/type/count/outcome 등 진단에 필요한 최소 field만 허용한 구조화 기록입니다.", ["PII/secret을 deny합니다.", "SQLState exception chain은 제한된 내부 trace로 분리합니다."]),
    ],
    diagnostics: [
      d("SQL debug log에 password reset token과 free-text PII가 남습니다.", "PreparedStatement/parameter map을 raw 문자열로 기록했습니다.", ["ORM/JDBC proxy logging", "toString usage", "APM attributes", "log retention/access"], "raw SQL/parameter logging을 끄고 template id+safe type/count/outcome schema로 교체하며 노출 secret을 rotate합니다.", "synthetic canary log scan과 logger schema tests를 CI/production pipeline에 둡니다."),
      d("한 injection flaw로 다른 schema의 관리자 table까지 읽힙니다.", "application runtime role이 migration/admin 광역 권한을 가졌습니다.", ["effective principal/roles", "object grants", "public/synonym/procedure privileges", "network/filesystem extensions"], "runtime/migration/admin identities를 분리하고 object/action/tenant 최소 권한으로 revoke합니다.", "forbidden query authorization suite와 정기 grant diff review를 둡니다."),
    ],
    expertNotes: ["full SQL logging은 incident 때조차 승인·시간·접근·redaction·삭제 계획이 있는 제한 수집으로만 사용합니다.", "parameterization, validation, least privilege, audit는 서로 다른 failure mode를 막는 중첩 방어입니다."],
  },
  {
    id: "second-order-injection-data-lifecycle",
    title: "저장된 값을 다시 사용할 때 발생하는 2차 인젝션을 차단합니다",
    lead: "입력 시 DB에 안전하게 저장됐다는 사실은 그 값을 나중에 SQL·HTML·shell·template code로 조립해도 안전하다는 뜻이 아닙니다.",
    explanations: [
      "second-order SQL injection은 공격성 문자열이 처음에는 parameter로 정상 저장되고, report/admin/batch/migration 같은 후속 경로에서 trusted DB data로 간주돼 SQL text에 연결될 때 발생합니다.",
      "DB column, cache, message queue, CSV와 internal API에서 온 값도 원래 외부 입력일 수 있습니다. trust는 저장 위치가 아니라 현재 sink와 변환에 따라 결정하고 SQL sink에 들어가는 모든 value를 다시 bind합니다.",
      "입력 validation은 domain invariant를 위한 것이며 미래의 모든 output context를 안전하게 만들 수 없습니다. display name에 quote를 허용할 수 있고 SQL에서는 bind, HTML에서는 output encode, shell에서는 shell 호출 자체를 피하는 식으로 sink별 안전 API를 사용합니다.",
      "동적으로 저장된 report definition이나 filter DSL은 raw SQL로 보관하지 않습니다. 제한된 AST/schema로 parse·validate하고 compiler가 approved template/fragments와 bind list를 생성하도록 합니다. 정의 변경 권한과 audit/versioning도 필요합니다.",
      "data lineage test는 create→store→read→reuse의 전체 경로를 실행합니다. 최초 INSERT만 보지 않고 background job, export, search indexing, admin console과 migration scripts를 SQL sink inventory에 포함합니다.",
    ],
    concepts: [
      c("second-order injection", "한 경로에서 data로 저장된 값이 이후 다른 경로에서 code로 재해석되는 취약점입니다.", ["DB 내부 값도 untrusted일 수 있습니다.", "모든 SQL sink에서 bind합니다."]),
      c("sink-specific safety", "같은 값이라도 SQL·HTML·shell·path 등 도착 context에 맞는 안전한 API를 적용하는 원칙입니다.", ["입력 sanitize 하나로 대체하지 않습니다.", "canonical value를 보존합니다."]),
      c("data lineage", "값의 origin, 저장, 변환, 전송과 최종 sink를 추적하는 흐름입니다.", ["async/admin/migration 경로를 포함합니다.", "trust transition을 표시합니다."]),
    ],
    codeExamples: [java("jdbc02-second-order", "저장된 문자열을 후속 SQL에서도 다시 bind하기", "Jdbc02SecondOrder.java", "synthetic stored value가 update SQL text로 승격되지 않고 다시 parameter list에만 들어가는지 증명합니다.", String.raw`import java.util.*;

public class Jdbc02SecondOrder {
  record StoredProfile(long id, String note) {}
  record Command(String templateId, String sql, List<Object> parameters) {}

  static Command renameFromStored(StoredProfile stored) {
    return new Command(
        "member-note-copy-v1",
        "UPDATE member_archive SET note = ? WHERE member_id = ?",
        List.of(stored.note(), stored.id()));
  }

  public static void main(String[] args) {
    StoredProfile fromDatabase = new StoredProfile(42L, "saved quote ' and comment -- marker");
    Command command = renameFromStored(fromDatabase);
    System.out.println("template-id=" + command.templateId());
    System.out.println("sql=" + command.sql());
    System.out.println("parameter-count=" + command.parameters().size());
    System.out.println("stored-value-in-sql=" + command.sql().contains(fromDatabase.note()));
    System.out.println("stored-value-is-parameter=" + command.parameters().getFirst().equals(fromDatabase.note()));
    System.out.println("safe-log=template-id,param-count,outcome");
  }
}`, "template-id=member-note-copy-v1\nsql=UPDATE member_archive SET note = ? WHERE member_id = ?\nparameter-count=2\nstored-value-in-sql=false\nstored-value-is-parameter=true\nsafe-log=template-id,param-count,outcome", ["java-prepared-statement", "oracle-prepared-tutorial", "mysql-prepared-statements"])],
    diagnostics: [
      d("입력 화면은 parameterized인데 야간 report job에서 injection이 발생합니다.", "DB에 저장된 filter/name을 trusted SQL fragment로 연결했습니다.", ["stored value origin", "background/admin SQL builders", "template definition storage", "final SQL shape/binds"], "저장값도 value로 재bind하고 동적 definition은 validated AST→approved compiler로 변환합니다.", "create→store→job/report 전체 lifecycle hostile-corpus integration test를 둡니다."),
      d("특수문자를 모두 제거해 사용자 이름이 손상되지만 취약점은 다른 sink에 남습니다.", "context-independent sanitize로 SQL/HTML/shell 안전을 동시에 해결하려 했습니다.", ["domain allowed characters", "all output sinks", "encoding/binding APIs", "raw/canonical storage"], "domain validation만 입력에 적용하고 각 sink에서 parameter binding/output encoding/safe process API를 적용합니다.", "canonical round-trip과 sink별 security property test를 분리합니다."),
    ],
    expertNotes: ["DB는 신뢰 경계의 종착점이 아니라 지속되는 data-flow의 한 저장 단계입니다.", "legacy batch·admin·migration utility는 온라인 endpoint보다 review가 적어 2차 injection sink가 되기 쉽습니다."],
  },
  {
    id: "prepare-modes-testing-operations",
    title: "driver prepare mode·권한·failure를 실제 DB matrix에서 검증합니다",
    lead: "JDK-only harness가 application invariant를 빠르게 증명해도 server parser, collation, type conversion, plan, transaction과 권한은 실제 driver/server에서만 확인됩니다.",
    explanations: [
      "unit test는 SQL template stability, bind schema, allow-list, empty/max IN, batch count interpreter, affected-row invariant와 no-secret logging을 deterministic하게 검증합니다. mock이 통과했다고 실제 SQL syntax/constraint가 맞다고 결론내리지 않습니다.",
      "integration test는 supported JDK×driver×server/dialect에서 schema migration을 적용하고 ordinary/NULL/boundary/Unicode/hostile values, generated keys, batch partial failure와 optimistic conflict를 transaction readback으로 확인합니다.",
      "Connector/J 같은 driver는 server-side prepared statement 사용 여부와 caching properties가 있을 수 있습니다. mode별 성능과 metadata/plan behavior를 공식 문서 및 runtime evidence로 비교하되 보안 경계가 raw concatenation으로 바뀌지 않게 합니다.",
      "test principal은 production과 같은 최소 권한 shape를 가져야 합니다. superuser test만 통과하면 forbidden object 접근과 required grant 누락을 발견하지 못합니다. migration identity는 별도 fixture로 검증합니다.",
      "운영 runbook은 template별 error/latency/rows 이상 탐지→safe SQLState/vendor chain 확인→recent schema/driver/plan change→transaction/idempotency 판단→canary/rollback→data reconciliation 순서로 구성합니다.",
    ],
    concepts: [
      c("client/server prepare mode", "driver가 parameterized execution을 client protocol 또는 server prepared statement로 구현하는 방식입니다.", ["성능·metadata·cache 동작이 달라질 수 있습니다.", "지원 driver 설정을 검증합니다."]),
      c("SQL conformance matrix", "JDK/driver/server/schema/config 조합별 template, type, NULL, rows, key, error와 plan 기대값입니다.", ["upgrade release gate입니다.", "approved dialect differences를 기록합니다."]),
      c("security property test", "값이 SQL shape를 바꾸지 않고 권한 밖 row/object를 변경하지 않는 불변식을 넓은 입력에 검증하는 test입니다.", ["exploit 문자열 몇 개에 한정하지 않습니다.", "persisted state를 readback합니다."]),
    ],
    diagnostics: [
      d("mock tests는 통과하지만 실제 DB에서 NULL/type/batch semantics가 다릅니다.", "java.sql interface 호출만 흉내 내고 vendor parser/driver/schema/transaction을 실행하지 않았습니다.", ["real driver/server matrix", "column definitions", "setter/type metadata", "persisted rows/counts/keys"], "격리 actual DB integration suite에서 schema와 최소 권한 identity로 round-trip/failure tests를 실행합니다.", "supported version matrix와 containerized/ephemeral fixtures를 release gate로 둡니다."),
      d("driver upgrade 뒤 latency와 plan cache가 악화됐는데 SQL source는 동일합니다.", "prepare/caching/type defaults 변화와 template fingerprint별 plan을 관측하지 않았습니다.", ["driver config/version", "server prepared statement inventory", "distinct fingerprints/plans", "bind type distribution"], "old/new driver canary에서 modes와 plans를 비교하고 safe configuration rollback을 실행합니다.", "version-stratified performance/security conformance와 budget alert를 둡니다."),
    ],
    expertNotes: ["보안 test는 unauthorized data가 반환/변경되지 않았다는 DB state evidence까지 포함합니다.", "driver property 변경도 execution semantics를 바꿀 수 있으므로 source 변경이 없어도 배포/검증 대상입니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-jdbc-basic", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/basic/JDBCBasic.java", usedFor: ["Connection 다음 Statement/PreparedStatement 학습 단계와 hard-coded configuration 개선 provenance"], evidence: "read-only로 24 logical lines를 확인했으며 literal URL/host/service/user/password는 복사하지 않았습니다." },
  { id: "java-statement", repository: "Java SE 21 API", path: "java.sql.Statement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html", usedFor: ["fixed SQL execution, update counts, generated-key flags와 batch sentinel"], evidence: "Oracle JDK 공식 Statement API입니다." },
  { id: "java-prepared-statement", repository: "Java SE 21 API", path: "java.sql.PreparedStatement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html", usedFor: ["parameter setters, execution, batching과 SQL code/data separation"], evidence: "Oracle JDK 공식 PreparedStatement API입니다." },
  { id: "java-parameter-metadata", repository: "Java SE 21 API", path: "java.sql.ParameterMetaData", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ParameterMetaData.html", usedFor: ["parameter count/type/nullability metadata와 driver support caveat"], evidence: "Oracle JDK 공식 ParameterMetaData API입니다." },
  { id: "java-sql-type", repository: "Java SE 21 API", path: "java.sql.SQLType", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLType.html", usedFor: ["target SQL type contract"], evidence: "Oracle JDK 공식 SQLType API입니다." },
  { id: "java-jdbc-type", repository: "Java SE 21 API", path: "java.sql.JDBCType", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/JDBCType.html", usedFor: ["type-safe standard JDBC type and vendor type number"], evidence: "Oracle JDK 공식 JDBCType API입니다." },
  { id: "java-batch-update-exception", repository: "Java SE 21 API", path: "java.sql.BatchUpdateException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/BatchUpdateException.html", usedFor: ["partial batch failure and update-count correlation"], evidence: "Oracle JDK 공식 BatchUpdateException API입니다." },
  { id: "java-sql-exception", repository: "Java SE 21 API", path: "java.sql.SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["SQLState/vendor/next-exception error evidence"], evidence: "Oracle JDK 공식 SQLException API입니다." },
  { id: "java-connection", repository: "Java SE 21 API", path: "java.sql.Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["prepareStatement factories, transaction commit/rollback and resource ownership"], evidence: "Oracle JDK 공식 Connection API입니다." },
  { id: "oracle-prepared-tutorial", repository: "Java Tutorials", path: "Using Prepared Statements", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/prepared.html", usedFor: ["prepared statement learning progression, setter and reuse examples"], evidence: "Oracle 공식 JDBC tutorial입니다." },
  { id: "oracle-retrieving-tutorial", repository: "Java Tutorials", path: "Retrieving and Modifying Values from Result Sets", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/retrieving.html", usedFor: ["result/update workflow and JDBC resource context"], evidence: "Oracle 공식 JDBC tutorial입니다." },
  { id: "mysql-prepared-statements", repository: "MySQL 8.4 Reference Manual", path: "Prepared Statements", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/sql-prepared-statements.html", usedFor: ["server prepared statement lifecycle and supported statement context"], evidence: "MySQL 공식 prepared statement 문서입니다." },
  { id: "mysql-identifier-qualifiers", repository: "MySQL 8.4 Reference Manual", path: "Identifier Qualifiers", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/identifier-qualifiers.html", usedFor: ["qualified identifiers and quoting dialect context"], evidence: "MySQL 공식 identifier qualifier 문서입니다." },
  { id: "oracle-jdbc-coding-tips", repository: "Oracle Database 26ai JDBC Developer's Guide", path: "JDBC Coding Tips", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/JDBC-coding-tips.html", usedFor: ["statement reuse, batching, generated-key and performance considerations"], evidence: "Oracle 공식 JDBC coding guide입니다." },
  { id: "sqlite-bind-parameters", repository: "SQLite Documentation", path: "SQL Language Expressions - Parameters", publicUrl: "https://www.sqlite.org/lang_expr.html#varparam", usedFor: ["bind parameter grammar and dialect comparison"], evidence: "SQLite 프로젝트 공식 expression/parameter 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "jdbc-02-statement-prepared-sql-injection", slug: "jdbc-02-statement-prepared-sql-injection", courseId: "spring", moduleId: "jdbc-foundations", order: 2,
  title: "Statement와 PreparedStatement, SQL injection 차단", subtitle: "SQL code와 data의 경계를 typed bind·NULL·허용 목록·가변 IN·batch·generated keys·최소 권한·2차 인젝션·실제 DB 검증까지 유지합니다.", level: "중급", estimatedMinutes: 960,
  coreQuestion: "어떤 입력 경로와 동적 query 요구에서도 SQL 구조는 승인된 template으로 고정하고 값만 type-safe하게 bind하며, 실행·권한·transaction 결과를 어떻게 증명할까요?",
  summary: "SpringBasic의 JDBCBasic.java를 read-only로 감사해 Connection 다음의 SQL 실행 학습 단계로 확장합니다. Statement와 PreparedStatement의 code/data boundary, SQL grammar injection, domain/JDBC type mapping, SQL NULL과 3값 논리, 동적 identifier/order allow-list, bounded IN marker expansion, batch partial failure/unknown commit, generated keys/affected-row/optimistic locking, template 중심 logging과 least-privilege DB role, 저장값의 second-order injection, driver prepare mode와 actual DB conformance를 초급 원리에서 운영 전문가 수준까지 연결합니다. 여섯 JDK 21 examples는 hostile value의 template 분리, 실제 PreparedStatement typed/NULL setter 기록, identifier/IN shape allow-list, BatchUpdateException count 해석, generated-key ResultSet ownership과 stored-value rebind를 결정적으로 실행합니다.",
  objectives: ["Statement와 PreparedStatement를 SQL code/data trust boundary로 설명한다.", "domain·Java·JDBC·column type과 typed NULL을 일치시킨다.", "identifier/order와 IN 목록을 승인된 shape 및 bounded marker로 구성한다.", "batch partial failure, transaction rollback와 unknown commit/idempotency를 처리한다.", "generated keys와 affected-row/optimistic locking invariant를 검증한다.", "raw SQL/parameter 없이 template telemetry를 남기고 DB 최소 권한을 적용한다.", "2차 injection data lineage와 actual driver/server conformance suite를 운영한다."],
  prerequisites: [{ title: "JDBC 드라이버·URL·Connection 수립 과정", reason: "안전하게 얻고 소유하는 Connection 위에서 SQL code/data 경계와 실행 결과 계약을 구성합니다.", sessionSlug: "jdbc-01-driver-connection" }],
  keywords: ["Statement", "PreparedStatement", "SQL injection", "parameter binding", "JDBCType", "SQL NULL", "three-valued logic", "allow-list", "dynamic identifier", "IN clause", "batch", "BatchUpdateException", "generated keys", "affected rows", "least privilege", "second-order injection"], topics,
  lab: {
    title: "검색·수정 repository를 injection-safe하고 결과 검증 가능한 write/read boundary로 만들기",
    scenario: "legacy repository가 filter/order/ID 목록을 문자열로 연결하고 모든 값을 setString으로 보내며, batch와 generated-key 결과를 무시하고 SQL/parameter 전체를 log에 남깁니다.",
    setup: ["원본 파일은 read-only provenance로만 사용하고 actual URL/host/user/password를 어떤 fixture에도 복사하지 않습니다.", "JDK 21 harness와 격리 MySQL/Oracle supported driver/server, disposable schema와 최소 권한 test identity를 준비합니다.", "SQL sink inventory와 template id별 parameter/identifier/rows/role/timeout schema를 작성합니다.", "ordinary/NULL/empty/Unicode/quote/comment/operator/max-size/constraint/conflict/response-loss synthetic corpus를 고정합니다."],
    steps: ["Statement 문자열 연결을 data-flow로 찾아 완전 고정 SQL과 외부 값 포함 SQL을 분류합니다.", "모든 scalar value를 PreparedStatement marker와 domain/JDBC type setter로 옮깁니다.", "nullable filter를 omitted/IS NULL/non-null value의 승인된 template variants로 분리합니다.", "sort/table/operator 선택을 enum allow-list의 고정 fragments로 제한하고 unknown을 거부합니다.", "IN 목록은 bounded markers로 확장하고 empty/match-none, max+1, large-set transport를 검증합니다.", "batch row마다 모든 parameter를 bind하고 partial counts에서 all-or-nothing rollback과 row correlation을 확인합니다.", "INSERT key와 UPDATE/DELETE affected-row invariant, optimistic conflict와 unknown commit reconciliation을 실행합니다.", "stored hostile value를 report/background update에서 다시 bind해 second-order 경계를 검증합니다.", "template id/type/count/elapsed/rows/safe SQLState만 기록하고 raw parameter canary가 log/APM에 없는지 검사합니다.", "runtime/migration role을 분리하고 forbidden schema/action/tenant 접근이 DB에서 거부되는지 확인합니다.", "JDK/driver/server prepare modes에서 syntax, round-trip, plan, batch/key/error와 persisted state를 비교합니다.", "driver/schema/template 변경을 canary하고 error/latency/rows 이상 시 rollback·reconciliation runbook을 rehearsal합니다."],
    expectedResult: ["외부·저장 값이 어떤 SQL text에도 들어가지 않고 typed parameters로만 전달됩니다.", "nullable/identifier/IN/list/batch/key/update semantics가 입력 경계와 DB readback에서 일치합니다.", "partial failure와 unknown commit이 rollback/idempotency/reconciliation 정책으로 결정됩니다.", "runtime DB role이 필요한 object/action/tenant만 접근하고 금지 작업은 거부됩니다.", "logs/traces에는 template 안전 metadata만 있고 raw SQL literal, parameter, credential과 PII가 없습니다.", "supported driver/server matrix의 승인된 dialect 차이를 제외하고 결과·권한·transaction invariant가 같습니다."],
    cleanup: ["test transactions/schema/tables/temporary large-set objects와 synthetic rows를 제거합니다.", "test identities/grants, driver containers, traces와 generated artifacts를 revoke·삭제합니다.", "logs/APM/export/backups에 synthetic secret/PII canary와 raw SQL parameters가 없는지 재검사합니다.", "원본 JDBCBasic.java와 production data/configuration은 변경하지 않습니다."],
    extensions: ["제한된 filter AST compiler와 template registry code generation을 구현합니다.", "array/table-valued/temp-table large-set adapters를 dialect별 benchmark합니다.", "property-based SQL-shape stability와 mutation-based injection regression suite를 만듭니다.", "OpenTelemetry SQL template telemetry와 plan regression dashboard를 secret-safe하게 설계합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행하고 SQL shape, bind, transaction/result ownership 증거를 표로 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "hostile value가 SQL text에 없는지 설명합니다.", "typed/NULL setter position을 추적합니다.", "sort/IN invalid shapes가 거부되는지 확인합니다.", "batch sentinel과 rollback decision을 계산합니다.", "affected=1, key one-row와 close ownership을 확인합니다.", "stored value가 후속 SQL에서도 다시 bind되는지 확인합니다."], hints: ["SQL text가 같다는 사실과 값이 올바른 type/position으로 전달됐다는 사실을 따로 확인합니다."], expectedOutcome: "value, structure, result와 resource ownership 경계를 실행 결과로 설명합니다.", solutionOutline: ["template→shape selection→typed bind→execute→count/key/readback→close 순서입니다."] },
    { difficulty: "응용", prompt: "문자열 연결 legacy repository를 안전한 PreparedStatement repository로 재설계하세요.", requirements: ["모든 SQL sink/source data-flow를 inventory합니다.", "template id와 bind schema를 정의합니다.", "NULL과 optional filter semantics를 분리합니다.", "identifier/order를 allow-list합니다.", "empty/max/large IN 정책을 둡니다.", "batch rollback/partial/unknown outcome을 계약화합니다.", "generated-key/affected-row/optimistic invariants를 검사합니다.", "second-order async/admin 경로를 포함합니다.", "least-privilege role과 safe telemetry를 검증합니다.", "actual driver/server hostile/fault matrix를 실행합니다."], hints: ["PreparedStatement로 API 이름만 바꾸지 말고 최종 SQL shape와 DB state를 증명합니다."], expectedOutcome: "injection-safe하고 실패·성능·운영까지 검증 가능한 repository가 완성됩니다.", solutionOutline: ["inventory→constrain shapes→bind types→execute transaction→readback→observe→authorize→fault-test 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JDBC SQL execution governance와 release gate를 작성하세요.", requirements: ["raw concatenation 금지와 fixed Statement 예외 기준을 정의합니다.", "template/bind/NULL/identifier/IN schema 표준을 둡니다.", "batch/key/affected/idempotency transaction 정책을 둡니다.", "second-order data lineage와 non-web sinks를 포함합니다.", "runtime/migration/admin 최소 권한 모델을 정의합니다.", "template-safe logging/redaction/retention을 지정합니다.", "JDK/driver/server/schema/prepare conformance matrix를 유지합니다.", "static/data-flow/property/integration/fault/authorization tests를 요구합니다.", "canary/rollback/reconciliation/incident runbook을 둡니다."], hints: ["보안은 parameterization만, 운영은 logging만 담당하는 식으로 분리하지 말고 하나의 실행 contract로 연결합니다."], expectedOutcome: "입력부터 DB state와 운영 evidence까지 이어지는 SQL execution governance가 완성됩니다.", solutionOutline: ["classify→template→type→authorize→transact→verify→observe→upgrade→recover 순서입니다."] },
  ],
  nextSessions: ["jdbc-03-resultset-row-mapping"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["JDBCBasic.java 24 lines, 682 bytes, active 19 lines를 read-only로 확인했습니다. SHA-256은 6BEA81F383C7923141038BCB314C9409840616EB72AF7D662B425961CCDE43E3입니다.", "원본은 Connection 수립까지의 입문 흐름이므로 Statement/PreparedStatement 코드는 직접 복사하지 않고 다음 학습 단계의 provenance로만 사용했습니다.", "원본 literal URL/host/port/service/user/password는 어떤 설명·code·output에도 복사하지 않았습니다.", "JDK-only Proxy/pure examples는 실제 MySQL/Oracle parser, server prepare mode, type coercion, collation, plan, transaction, constraint, generated-key와 최소 권한 동작을 대체하지 않습니다."] },
});

export default session;
