import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "합성 SQL template, parameter metadata와 JDK PreparedStatement/reflection proxy만 준비하며 실제 DB·계정·사용자 값은 사용하지 않습니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "#{}→? compilation, typed/null binding, parameter-name resolution, identifier allow-list와 bounded LIKE/IN 구조를 실행합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "SQL shape, property/type/count와 rejection boolean만 출력합니다. bind value와 민감 데이터는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 MyBatis jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "교육용 compiler/proxy model은 MyBatis LanguageDriver, ParameterHandler, TypeHandler와 target driver 동작을 재구현하거나 대체하지 않습니다."] },
    experiments: [
      { change: "null, Unicode, wildcard, empty/oversized collection과 unknown sort key를 추가합니다.", prediction: "bind 가능한 값과 SQL 구조를 분리하지 않으면 syntax, type, authorization 또는 injection 문제가 나타납니다.", result: "ParameterMapping/type handler와 allow-listed structure builder가 stable reject category 또는 동일 SQL shape를 만듭니다." },
      { change: "MyBatis·driver·DB version과 parameter object/annotation/compiler 옵션을 바꿉니다.", prediction: "parameter name, null JDBC type, temporal/enum conversion과 plan reuse가 달라질 수 있습니다.", result: "actual BoundSql/ParameterMapping, prepared call trace와 target result/plan을 matrix로 승인합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "sql-code-data-separation",
    title: "SQL 코드와 외부 값을 분리하는 것을 parameter binding의 출발점으로 삼습니다",
    lead: "파라미터 바인딩의 핵심은 따옴표를 잘 붙이는 요령이 아니라 SQL 구조를 먼저 고정하고 값은 별도 typed channel로 driver에 전달해 입력이 문법을 바꾸지 못하게 하는 것입니다.",
    explanations: [
      "MyBatis의 hash-style parameter expression은 최종 SQL에서 JDBC `?` placeholder와 ParameterMapping metadata로 바뀌고 실제 값은 PreparedStatement setter/TypeHandler를 통해 전달됩니다. 값이 SQL source text에 직접 합쳐지지 않습니다.",
      "반대로 dollar-style substitution은 text를 SQL source에 그대로 포함시키는 구조 치환입니다. table/column/order fragment처럼 placeholder를 쓸 수 없는 제한된 경우가 있지만 외부 값을 그대로 넣는 일반 parameter mechanism이 아닙니다.",
      "원본 mapper XML에는 hash-style binding 네 곳과 dollar-style substitution 0곳이 구조적으로 확인됩니다. 이 세션은 실제 SQL과 bind literal을 복사하지 않고 안전한 binding progression만 학습 근거로 사용합니다.",
      "prepared statement도 SQL structure를 문자열 concatenation으로 먼저 오염한 뒤 나머지 값만 bind하면 injection을 막지 못합니다. query의 모든 외부 입력을 data value, approved identifier/keyword 또는 forbidden structure로 분류합니다.",
      "binding contract에는 property name, Java type, JDBC type/null rule, TypeHandler, validation, maximum size와 sensitivity/logging class를 둡니다. 단순히 parameterType 한 줄로 전체 입력 의미를 대신하지 않습니다.",
    ],
    concepts: [
      c("parameter binding", "SQL structure와 값을 분리하고 placeholder에 typed value를 전달하는 과정입니다.", ["PreparedStatement를 사용합니다.", "값이 SQL 문법이 되지 않습니다."]),
      c("SQL structure", "keyword, identifier, operator, placeholder 수와 clause 순서처럼 parser가 코드로 해석하는 부분입니다.", ["일반 bind value와 다릅니다.", "allow-list로 생성합니다."]),
      c("injection", "신뢰하지 않은 데이터가 interpreter의 코드/구조로 해석되어 원래 명령의 의미를 바꾸는 취약점입니다.", ["escaping만 의존하지 않습니다.", "parameterization과 최소 권한을 사용합니다."]),
    ],
    codeExamples: [java("mybatis03-hash-binding-compiler", "hash-style expression을 placeholder와 property metadata로 분리", "Mybatis03HashBindingCompiler.java", "합성 template의 두 hash-style expression을 `?`와 property 목록으로 compile하고 raw value가 SQL에 없음을 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Mybatis03HashBindingCompiler {
  record BoundShape(String sql, List<String> properties) {}

  static BoundShape compile(String template) {
    Pattern token = Pattern.compile("#\\{([A-Za-z][A-Za-z0-9_]*)\\}");
    Matcher matcher = token.matcher(template);
    StringBuffer sql = new StringBuffer();
    List<String> properties = new ArrayList<>();
    while (matcher.find()) {
      properties.add(matcher.group(1));
      matcher.appendReplacement(sql, "?");
    }
    matcher.appendTail(sql);
    return new BoundShape(sql.toString(), List.copyOf(properties));
  }

  public static void main(String[] args) {
    String template = "SELECT item_id FROM training_item WHERE owner_id = #{owner} AND state = #{state}";
    BoundShape shape = compile(template);
    System.out.println("sql=" + shape.sql());
    System.out.println("properties=" + String.join(",", shape.properties()));
    System.out.println("placeholders=" + shape.sql().chars().filter(ch -> ch == '?').count());
    System.out.println("mappings=" + shape.properties().size());
    System.out.println("raw-values-in-sql=false");
  }
}`, "sql=SELECT item_id FROM training_item WHERE owner_id = ? AND state = ?\nproperties=owner,state\nplaceholders=2\nmappings=2\nraw-values-in-sql=false", ["local-config", "local-mapper-xml", "local-mapper-interface", "mybatis-sqlmap-xml", "mybatis-java-api", "mybatis-bound-sql", "mybatis-parameter-mapping"])],
    diagnostics: [d("특수 문자가 포함된 정상 값에서 query가 깨지거나 입력이 predicate/order 구조를 바꿉니다.", "외부 값을 SQL 문자열에 concatenate/substitute하고 prepared binding은 일부 값에만 적용했습니다.", ["final SQL shape/fingerprint", "ParameterMapping count", "external input data-flow", "DB account privileges"], "모든 data value를 hash-style/PreparedStatement binding으로 옮기고 불가피한 structure는 enum allow-list에서 생성합니다.", "adversarial value corpus와 SQL shape invariance test를 mapper CI에 둡니다.")],
    expertNotes: ["parameterization은 authorization predicate 누락과 과도한 DB privilege를 고치지 않으므로 defense in depth가 필요합니다.", "BoundSql를 diagnostic할 때도 parameterObject/additionalParameters 값은 출력하지 않고 SQL fingerprint와 mapping metadata만 사용합니다."],
  },
  {
    id: "bound-sql-and-parameter-mapping",
    title: "#{}를 BoundSql·ParameterMapping·ParameterHandler pipeline으로 추적합니다",
    lead: "hash-style syntax를 안전 주문처럼 외우지 말고 XML parsing과 dynamic SQL 이후 어떤 SQL text와 ordered parameter metadata가 만들어지는지 이해해야 property/type/null 오류를 진단할 수 있습니다.",
    explanations: [
      "LanguageDriver/SqlSource는 parameter object와 dynamic 조건을 사용해 BoundSql를 만듭니다. BoundSql에는 최종 SQL, ordered ParameterMapping list, parameter object와 foreach/bind가 만든 additional parameters가 연결됩니다.",
      "ParameterMapping은 property, Java type, JDBC type, mode, numeric scale와 TypeHandler를 담습니다. placeholder 순서와 mapping 순서가 정확히 일치해야 같은 이름이 여러 번 등장해도 올바른 index에 bind됩니다.",
      "nested property는 MetaObject/property accessor를 통해 읽히며 중간 객체 null, typo와 getter side effect를 피합니다. immutable parameter record와 validation으로 binding 전에 invalid state를 거부합니다.",
      "dynamic SQL branch가 달라지면 placeholder와 mapping list도 함께 달라져야 합니다. text fragment만 제거하고 stale mapping을 남기지 않는 것은 MyBatis scripting engine의 책임이지만 custom LanguageDriver에서는 invariant를 직접 검증합니다.",
      "diagnostic에는 statement operation id, normalized SQL fingerprint, placeholder/mapping count, property logical names와 Java/JDBC type만 둡니다. actual object/value, additional parameter contents와 SQL literal은 최소 권한으로 제한합니다.",
    ],
    concepts: [
      c("BoundSql", "dynamic rendering 후 JDBC에 전달할 SQL text와 ordered parameter mappings를 묶은 MyBatis 객체입니다.", ["parameter object와 additional values를 참조합니다.", "값 출력에 주의합니다."]),
      c("ParameterMapping", "한 placeholder의 property·Java/JDBC type·mode·TypeHandler metadata입니다.", ["순서가 중요합니다.", "null binding을 결정합니다."]),
      c("ParameterHandler", "parameter object와 mappings를 읽어 PreparedStatement index에 실제 값을 설정하는 실행 component입니다.", ["TypeHandler를 호출합니다.", "SQL structure를 만들지 않습니다."]),
    ],
    diagnostics: [d("placeholder 수와 bind index가 다르거나 nested property getter 오류가 SQL 실행 직전에 발생합니다.", "dynamic branch의 BoundSql와 ParameterMapping inventory를 확인하지 않고 template text만 검토했습니다.", ["BoundSql placeholder count", "mapping order/properties", "parameter object shape", "additional parameter names"], "actual MyBatis BoundSql를 safe metadata로 inspect하고 placeholder=mapping invariant와 property validation을 startup/integration test에 추가합니다.", "custom scripting/type handler 변경마다 mapping-order golden test를 실행합니다.")],
    expertNotes: ["SQL whitespace normalization은 literal까지 바꿀 수 있는 설정이 있으므로 fingerprint용 normalization과 execution SQL 변환을 구분합니다.", "foreach additional parameter의 generated name에 application contract를 직접 의존하지 말고 public criteria/collection을 검증합니다."],
  },
  {
    id: "prepared-statement-type-binding",
    title: "PreparedStatement setter와 Java/JDBC type contract를 명시적으로 맞춥니다",
    lead: "값을 `?`에 넣었다고 끝이 아니라 숫자·문자·decimal·binary·temporal·enum을 올바른 setter/JDBC type으로 전달하고 driver round-trip을 검증해야 합니다.",
    explanations: [
      "PreparedStatement의 setString, setInt, setBigDecimal, setTimestamp와 setObject overload는 target column/driver가 기대하는 SQL type과 호환되어야 합니다. 무조건 setObject 하나로 보내 driver implicit conversion에 의존하지 않습니다.",
      "숫자는 range/precision/scale, 문자열은 character/byte length와 Unicode, temporal은 instant/local/zone/precision, binary/LOB는 streaming과 lifetime을 contract로 둡니다. schema type과 Java type을 함께 검토합니다.",
      "TypeHandler는 Java value와 PreparedStatement/ResultSet 변환을 중앙화합니다. handler는 stateless/thread-safe하게 두고 mutable formatter, Connection과 secret을 instance field에 보관하지 않습니다.",
      "driver/server implicit cast는 index usage와 오류 timing을 바꿀 수 있습니다. 같은 logical value를 지원 DB·driver matrix에서 insert/select predicate/round-trip/EXPLAIN으로 검증합니다.",
      "bind tracing은 setter name/index/type까지만 기본 수집하고 실제 value는 기록하지 않습니다. 길이·count·bounded bucket이 필요해도 PII/secret 재식별 가능성을 별도 검토합니다.",
    ],
    concepts: [
      c("JDBC type", "PreparedStatement/ResultSet과 database SQL type 사이의 표준 type category입니다.", ["Java class와 다릅니다.", "driver mapping을 검증합니다."]),
      c("typed binding", "column semantics에 맞는 setter/TypeHandler와 JDBC type으로 parameter를 전달하는 방식입니다.", ["implicit cast를 줄입니다.", "round-trip을 확인합니다."]),
      c("type round-trip", "Java→JDBC→DB 저장/비교→JDBC→Java가 값 의미를 손실 없이 보존하는 검증입니다.", ["boundary/null을 포함합니다.", "target driver별 실행합니다."]),
    ],
    codeExamples: [java("mybatis03-typed-prepared-binding", "값을 출력하지 않는 PreparedStatement setter trace", "Mybatis03TypedPreparedBinding.java", "JDK dynamic proxy로 PreparedStatement의 setString/setInt/setNull index와 type만 기록합니다.", String.raw`import java.lang.reflect.Proxy;
import java.sql.PreparedStatement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class Mybatis03TypedPreparedBinding {
  public static void main(String[] args) throws Exception {
    List<String> methods = new ArrayList<>();
    List<String> indices = new ArrayList<>();
    List<String> types = new ArrayList<>();
    PreparedStatement statement = (PreparedStatement) Proxy.newProxyInstance(
      Mybatis03TypedPreparedBinding.class.getClassLoader(),
      new Class<?>[]{PreparedStatement.class},
      (proxy, method, values) -> {
        if (method.getName().startsWith("set")) {
          methods.add(method.getName());
          indices.add(String.valueOf(values[0]));
          if (method.getName().equals("setString")) types.add("VARCHAR");
          else if (method.getName().equals("setInt")) types.add("INTEGER");
          else if (method.getName().equals("setNull")) types.add("NULL:" + (values[1].equals(Types.INTEGER) ? "INTEGER" : "OTHER"));
        }
        return null;
      }
    );
    statement.setString(1, "synthetic");
    statement.setInt(2, 3);
    statement.setNull(3, Types.INTEGER);
    System.out.println("calls=" + String.join(",", methods));
    System.out.println("indices=" + String.join(",", indices));
    System.out.println("types=" + String.join(",", types));
    System.out.println("values-printed=false");
    System.out.println("prepared=" + Proxy.isProxyClass(statement.getClass()));
  }
}`, "calls=setString,setInt,setNull\nindices=1,2,3\ntypes=VARCHAR,INTEGER,NULL:INTEGER\nvalues-printed=false\nprepared=true", ["mybatis-parameter-mapping", "mybatis-type-handler", "mybatis-jdbc-type", "java-prepared-statement", "java-connection", "java-sql-types", "java-proxy"])],
    diagnostics: [d("같은 mapper가 DB/driver에 따라 implicit cast 오류 또는 index 미사용을 보입니다.", "Java/JDBC/column type을 명시하지 않고 generic setObject와 server conversion에 의존했습니다.", ["ParameterMapping Java/JDBC type", "TypeHandler selection", "column metadata", "driver bind trace/EXPLAIN"], "semantic type mapping과 explicit handler/setter를 적용하고 target driver별 round-trip·predicate plan을 승인합니다.", "schema/driver upgrade matrix에 min/max/precision/Unicode/time/null corpus를 둡니다.")],
    expertNotes: ["bind type이 column type과 다르면 결과가 맞아도 index/plan cache와 selectivity estimation이 달라질 수 있습니다.", "TypeHandler가 암호화나 JSON parsing을 담당하면 key/schema version과 migration/error redaction을 별도 contract로 둡니다."],
  },
  {
    id: "parameter-name-resolution",
    title: "단일 객체·여러 인자·명시 이름·collection의 parameter name resolution을 구분합니다",
    lead: "XML에서 보이는 property 이름은 Java local variable 이름과 자동으로 항상 같지 않으며 argument 수, annotation, compiler metadata와 collection wrapping 규칙에 따라 달라집니다.",
    explanations: [
      "단일 non-special parameter는 객체 자체가 전달될 수 있어 bean/record property를 직접 참조합니다. 단순 값에서는 property name을 붙이는 방식보다 `_parameter`/value contract와 실제 MyBatis behavior를 test합니다.",
      "여러 parameter에는 명시 annotation 이름을 사용하는 것이 가장 안정적입니다. generic `param1`, `param2`도 제공될 수 있지만 parameter 순서 변경에 취약해 public mapper contract에는 의미 이름을 우선합니다.",
      "actual Java parameter name 사용은 compilation의 `-parameters` metadata와 setting에 의존합니다. 개발 IDE와 production build 옵션이 달라지지 않도록 artifact reflection test를 실행합니다.",
      "collection/array single parameter는 foreach를 위해 collection/list/array와 actual name mapping이 생길 수 있습니다. 호출 contract에 key 이름과 empty/null/size semantics를 명시하고 internal generated names에 의존하지 않습니다.",
      "RowBounds, ResultHandler 같은 special parameter는 SQL bind parameter와 다르게 resolution에서 제외될 수 있습니다. mapper signature를 단순하게 유지하고 pagination/streaming contract를 명시합니다.",
    ],
    concepts: [
      c("ParamNameResolver", "mapper Method와 configuration을 바탕으로 argument의 SQL-visible 이름을 결정하는 MyBatis component입니다.", ["single/multiple을 구분합니다.", "generic 이름을 만들 수 있습니다."]),
      c("explicit parameter name", "annotation 등으로 mapper argument에 안정된 SQL property 이름을 부여한 contract입니다.", ["refactor에 유리합니다.", "중복을 금지합니다."]),
      c("compiler parameter metadata", "Java class file에 source parameter 이름을 보존하는 선택적 metadata입니다.", ["build option에 의존합니다.", "artifact에서 확인합니다."]),
    ],
    codeExamples: [java("mybatis03-parameter-name-resolution", "record property·명시 이름·generic 이름 비교", "Mybatis03ParameterNames.java", "runtime annotation과 reflection으로 단일 criteria property와 두 explicit/generic parameter 이름을 재현합니다.", String.raw`import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.Method;
import java.lang.reflect.RecordComponent;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Mybatis03ParameterNames {
  @Retention(RetentionPolicy.RUNTIME)
  @Target(ElementType.PARAMETER)
  @interface Named { String value(); }

  record Criteria(long ownerId, String state) {}
  interface Mapper {
    void search(@Named("owner") long ownerId, @Named("limit") int limit);
    void generic(long ownerId, int limit);
  }

  public static void main(String[] args) throws Exception {
    Method search = Mapper.class.getDeclaredMethod("search", long.class, int.class);
    List<String> named = new ArrayList<>();
    Arrays.stream(search.getParameters()).forEach(parameter -> named.add(parameter.getAnnotation(Named.class).value()));
    List<String> generic = List.of("param1", "param2");
    RecordComponent[] components = Criteria.class.getRecordComponents();
    System.out.println("single-properties=" + components.length);
    System.out.println("property-names=" + String.join(",", Arrays.stream(components).map(RecordComponent::getName).toList()));
    System.out.println("named=" + String.join(",", named));
    System.out.println("generic=" + String.join(",", generic));
    System.out.println("multi-parameters=" + search.getParameterCount());
  }
}`, "single-properties=2\nproperty-names=ownerId,state\nnamed=owner,limit\ngeneric=param1,param2\nmulti-parameters=2", ["mybatis-configuration", "mybatis-param-name-resolver", "mybatis-java-api", "java-parameter"])],
    diagnostics: [d("개발 환경에서는 여러 parameter가 bind되지만 production에서 Parameter not found가 납니다.", "actual name metadata/build option에 암묵적으로 의존하거나 annotation/XML names가 다릅니다.", ["class-file parameter isNamePresent", "MyBatis useActualParamName", "explicit annotation names", "BoundSql mapping properties"], "여러 인자에는 명시 이름 또는 immutable criteria object를 사용하고 production artifact reflection/mapper test를 추가합니다.", "compiler 옵션과 parameter resolution golden matrix를 build pipeline에서 고정합니다.")],
    expertNotes: ["generic param1 이름은 안정적으로 보일 수 있어도 argument reordering에서 의미가 바뀌므로 domain 이름을 우선합니다.", "parameter annotation 이름 변경은 XML과 provider/dynamic fragment를 포함한 binding migration입니다."],
  },
  {
    id: "null-jdbc-type-and-handler",
    title: "NULL을 값 부재 하나로 취급하지 않고 jdbcType·domain intent·TypeHandler로 설계합니다",
    lead: "Java null은 SQL NULL, filter 생략, field clear와 unchanged를 모두 표현할 수 있어 mutation/query 의미를 먼저 구분하지 않으면 잘못된 predicate나 driver binding 오류가 납니다.",
    explanations: [
      "PreparedStatement.setNull은 target SQL type을 요구합니다. MyBatis에서 nullable parameter의 jdbcType 또는 jdbcTypeForNull/default handler behavior를 target driver와 검증합니다.",
      "search criteria의 null은 보통 predicate 생략을 뜻할 수 있지만 update command의 null은 field clear 또는 unchanged 중 하나입니다. patch state를 별도 enum/optional wrapper로 표현해 ambiguity를 제거합니다.",
      "primitive Java type은 null을 표현할 수 없고 wrapper는 표현할 수 있습니다. schema NOT NULL/default, Java nullability, validation과 result mapping을 하나의 truth table로 맞춥니다.",
      "custom TypeHandler는 null callback 여부와 setNull/getNullableResult behavior를 명확히 합니다. driver별 OTHER/VARCHAR/DATE 등 null type 차이를 actual target에서 실행합니다.",
      "null diagnostic에는 property logical name, declared Java/JDBC type와 intent category만 남기고 주변 object/value를 serialize하지 않습니다. unexpected null은 count와 statement operation으로 관측합니다.",
    ],
    concepts: [
      c("typed NULL", "SQL NULL을 bind할 때 target column과 호환되는 JDBC type을 함께 제공하는 방식입니다.", ["setNull을 사용합니다.", "driver matrix를 검증합니다."]),
      c("null intent", "null이 omitted filter, unchanged, clear 또는 actual missing 중 무엇을 뜻하는지 정한 domain contract입니다.", ["query/mutation이 다릅니다.", "별도 state type을 고려합니다."]),
      c("jdbcTypeForNull", "명시 JDBC type이 없는 null parameter에 사용할 MyBatis configuration fallback입니다.", ["target driver별 확인합니다.", "명시 contract를 대체하지 않습니다."]),
    ],
    diagnostics: [d("null parameter에서 invalid column type 오류가 나거나 update가 field를 의도치 않게 clear/skip합니다.", "JDBC null type과 domain null intent를 정의하지 않고 generic Map/patch object를 사용했습니다.", ["ParameterMapping jdbcType", "TypeHandler/setNull trace", "schema null/default", "query/update null truth table"], "query criteria와 patch command를 분리하고 nullable field마다 omit/clear/set state와 JDBC type을 명시합니다.", "target driver null matrix와 no-full-table/no-unintended-clear tests를 둡니다.")],
    expertNotes: ["COALESCE로 null을 무조건 default화하면 index와 'filter 없음' 의미가 바뀔 수 있어 dynamic predicate와 비교합니다.", "result mapping의 all-null row와 nested object creation은 parameter null binding과 별도 setting/resultMap 문제입니다."],
  },
  {
    id: "dollar-substitution-structural-boundary",
    title: "${} 치환은 값 바인딩이 아니라 SQL 구조 생성이라는 위험 경계로 다룹니다",
    lead: "dollar-style syntax는 escaping과 PreparedStatement 분리를 제공하지 않고 text를 SQL에 포함하므로 사용자 입력·DB 저장 값·HTTP parameter를 직접 전달해서는 안 됩니다.",
    explanations: [
      "column, table, ORDER BY direction처럼 JDBC placeholder가 문법상 identifier/keyword 위치를 대신할 수 없는 경우가 있습니다. 이때 외부 문자열을 치환하지 않고 application enum에서 고정 fragment를 선택합니다.",
      "deny-list와 정규식으로 위험 문자를 제거하는 방식은 dialect quoting, Unicode, comments와 encoding 변형을 모두 막기 어렵습니다. 승인 가능한 구조의 유한 집합을 allow-list로 정의합니다.",
      "database에 저장된 값, configuration property, message queue와 admin input도 신뢰 경계 밖일 수 있습니다. 한 번 저장된 문자열을 나중에 structure substitution에 넣는 second-order injection 경로를 threat model에 포함합니다.",
      "identifier quoting은 allow-list 이후 dialect adapter가 담당할 수 있지만 quoting 자체가 authorization이나 올바른 table/column 선택을 보장하지 않습니다. tenant별 table 이름 같은 설계보다 schema/row security model을 우선 검토합니다.",
      "code review와 static scan은 dollar-style token의 모든 위치, data source, allowed enum와 fallback을 요구합니다. 불명확하면 build를 실패시키고 예외 승인에는 owner·scope·expiry와 security test를 둡니다.",
    ],
    concepts: [
      c("text substitution", "token 위치에 문자열을 SQL source의 일부로 직접 포함하는 방식입니다.", ["PreparedStatement binding이 아닙니다.", "구조 allow-list만 허용합니다."]),
      c("structural allow-list", "승인된 column/order/table fragment를 application enum/key에서 선택하는 mapping입니다.", ["외부 문자열을 그대로 반환하지 않습니다.", "default reject를 사용합니다."]),
      c("second-order injection", "저장·전달된 untrusted 값이 이후 다른 시점의 SQL 구조에 포함되어 발생하는 injection입니다.", ["DB 값도 검증합니다.", "data lineage를 추적합니다."]),
    ],
    diagnostics: [d("ORDER BY나 table 선택 기능에서 dollar-style input이 query structure를 바꿀 수 있습니다.", "사용자/저장 값을 정규식만 거쳐 text substitution에 넣고 bind parameter와 같다고 오해했습니다.", ["all substitution tokens", "input/data lineage", "allow-list enum mapping", "DB account/table privileges"], "외부 key를 closed enum으로 parse하고 server-owned SQL fragment만 선택하며 unknown은 execution 전에 거부합니다.", "static token inventory와 unknown/Unicode/second-order negative tests를 security gate에 둡니다.")],
    expertNotes: ["값을 quote한 뒤 dollar-style로 넣는 것은 parameterization이 아니며 type/encoding/dialect 위험을 남깁니다.", "identifier가 완전히 dynamic해야 하는 architecture는 mapper 한 줄보다 tenancy/sharding/authorization 설계를 먼저 재검토합니다."],
  },
  {
    id: "identifier-order-allowlist",
    title: "정렬·컬럼·방향을 외부 문자열이 아닌 enum→SQL fragment mapping으로 생성합니다",
    lead: "정렬 API는 흔한 structure parameter이므로 UI key와 database identifier를 분리하고 지원 조합·tie-breaker·NULL ordering·index를 product contract로 관리해야 합니다.",
    explanations: [
      "client는 `recent`, `title` 같은 안정된 public key만 보내고 server enum이 `created_at`, `title` 같은 고정 SQL fragment로 변환합니다. client에게 actual column 이름이나 expression을 API로 노출할 필요가 없습니다.",
      "direction도 ASC/DESC 두 값으로 parse하고 unknown/mixed text는 reject합니다. string upper-case 후 append하는 방식보다 enum parser와 exhaustive switch를 사용합니다.",
      "ORDER BY에는 unique stable tie-breaker를 포함해 pagination total order를 보장합니다. allow-list가 injection을 막아도 동점에서 page 중복/누락을 자동 해결하지 않습니다.",
      "NULLS FIRST/LAST, case/accent collation, computed expression과 index compatibility는 dialect adapter에서 명시합니다. MySQL·Oracle variant가 같은 golden ids를 내는지 검증합니다.",
      "structural selection telemetry에는 public sort key와 direction enum만 기록하고 raw input을 log하지 않습니다. invalid key count/rate를 관측해 probing과 client version drift를 탐지합니다.",
    ],
    concepts: [
      c("public sort key", "client가 사용하는 안정된 정렬 선택 이름이며 실제 DB identifier와 분리됩니다.", ["enum으로 parse합니다.", "versioning이 가능합니다."]),
      c("fragment registry", "승인된 public key를 server-owned SQL identifier/expression에 매핑한 목록입니다.", ["raw input을 반환하지 않습니다.", "dialect별 구현할 수 있습니다."]),
      c("total order", "모든 row 순서를 유일하게 결정하는 sort tuple입니다.", ["tie-breaker를 포함합니다.", "pagination에 필요합니다."]),
    ],
    codeExamples: [java("mybatis03-identifier-allowlist", "public sort key를 고정 SQL fragment로 변환", "Mybatis03IdentifierAllowlist.java", "두 정렬 key와 두 direction만 허용하고 unknown key를 SQL 생성 전에 거부합니다.", String.raw`import java.util.Locale;

public class Mybatis03IdentifierAllowlist {
  enum SortKey {
    RECENT("created_at"), TITLE("title");
    final String sql;
    SortKey(String sql) { this.sql = sql; }
    static SortKey parse(String external) {
      return switch (external) {
        case "recent" -> RECENT;
        case "title" -> TITLE;
        default -> throw new IllegalArgumentException("unknown-sort");
      };
    }
  }
  enum Direction { ASC, DESC }

  static String render(String key, String direction) {
    SortKey sort = SortKey.parse(key);
    Direction dir = Direction.valueOf(direction.toUpperCase(Locale.ROOT));
    return "SELECT item_id FROM training_item ORDER BY " + sort.sql + " " + dir;
  }

  public static void main(String[] args) {
    String sql = render("recent", "desc");
    boolean rejected;
    try { render("unknown-field", "asc"); rejected = false; }
    catch (IllegalArgumentException expected) { rejected = true; }
    System.out.println("sql=" + sql);
    System.out.println("keys=" + SortKey.values().length);
    System.out.println("directions=" + Direction.values().length);
    System.out.println("invalid-rejected=" + rejected);
    System.out.println("external-key-appended=" + sql.contains("recent"));
  }
}`, "sql=SELECT item_id FROM training_item ORDER BY created_at DESC\nkeys=2\ndirections=2\ninvalid-rejected=true\nexternal-key-appended=false", ["mybatis-dynamic-sql", "mybatis-language-driver", "owasp-sql-injection", "owasp-input-validation"])],
    diagnostics: [d("정렬 key는 제한했지만 페이지 순서가 흔들리거나 target DB에서 syntax/index가 달라집니다.", "allow-list만 적용하고 unique tie-breaker, NULL/collation/dialect fragment와 index contract를 정의하지 않았습니다.", ["sort enum→fragment mapping", "ORDER BY total uniqueness", "NULL/collation semantics", "target EXPLAIN/golden ids"], "dialect별 고정 fragment에 stable id tie-breaker를 추가하고 지원 key×direction의 result/plan을 검증합니다.", "정렬 registry change마다 pagination golden matrix와 invalid-key security tests를 실행합니다.")],
    expertNotes: ["enum SQL fragment도 code review 대상이며 user authorization으로 허용하지 않은 민감 column 정렬/추론을 제공하지 않습니다.", "테이블·schema 동적 선택은 정렬보다 위험과 topology 영향이 커 별도 architecture approval을 요구합니다."],
  },
  {
    id: "bounded-like-in-foreach",
    title: "LIKE·IN·foreach의 값은 bind하고 동적 placeholder 수만 bounded하게 생성합니다",
    lead: "검색과 목록 조건에는 가변 구조가 필요하지만 wildcard 의미, empty collection, parameter limit와 query plan을 정의하면 값을 문자열로 합치지 않고도 안전하게 만들 수 있습니다.",
    explanations: [
      "IN clause는 collection element마다 `?`를 생성하고 각 값을 별도 bind합니다. comma-separated 문자열 하나를 넣거나 values를 join해 SQL에 append하지 않습니다.",
      "empty collection의 의미를 no rows, no filter 또는 invalid request 중 하나로 명시합니다. `IN ()` syntax를 DB별로 기대하지 않고 dynamic SQL branch에서 fail-closed predicate 또는 request rejection을 선택합니다.",
      "collection size에 application cap과 DB/driver parameter limit를 둡니다. 큰 list는 chunking, temporary table, bulk load 또는 joinable staging strategy와 transaction/reconciliation을 검토합니다.",
      "LIKE 검색은 `%`와 `_`가 wildcard라는 점을 product contract에 반영합니다. literal search는 escape character와 ESCAPE clause를 dialect별로 고정하고 pattern mode(prefix/contains/exact)를 enum으로 선택합니다.",
      "foreach/bind로 생성한 additional parameters도 actual value를 log하지 않습니다. collection size, placeholder count, mode와 plan bucket만 기록하고 sensitive search text는 제외합니다.",
    ],
    concepts: [
      c("bounded placeholder expansion", "제한된 collection 크기만큼 placeholder를 만들고 element를 각각 bind하는 방식입니다.", ["값을 append하지 않습니다.", "parameter cap을 둡니다."]),
      c("LIKE escape", "검색 text의 wildcard 문자를 literal로 취급하도록 정한 escape 규칙입니다.", ["dialect clause와 맞춥니다.", "검색 mode와 분리합니다."]),
      c("empty collection policy", "IN 입력이 비었을 때 no rows, no filter 또는 invalid 중 무엇을 반환할지 정한 contract입니다.", ["암묵적 full scan을 피합니다.", "authorization predicate는 유지합니다."]),
    ],
    codeExamples: [java("mybatis03-bounded-like-in", "bounded IN placeholders와 literal LIKE escape", "Mybatis03BoundedLikeIn.java", "세 element IN shape, wildcard escape와 size cap rejection을 값 출력 없이 실행합니다.", String.raw`import java.util.Collections;

public class Mybatis03BoundedLikeIn {
  static String placeholders(int size, int cap) {
    if (size < 1 || size > cap) throw new IllegalArgumentException("invalid-size");
    return "(" + String.join(",", Collections.nCopies(size, "?")) + ")";
  }
  static String escapeLike(String value) {
    return value.replace("\\", "\\\\").replace("_", "\\_").replace("%", "\\%");
  }
  public static void main(String[] args) {
    String in = placeholders(3, 5);
    String escaped = escapeLike("A_%");
    boolean rejected;
    try { placeholders(6, 5); rejected = false; }
    catch (IllegalArgumentException expected) { rejected = true; }
    System.out.println("in=" + in);
    System.out.println("placeholders=" + in.chars().filter(ch -> ch == '?').count());
    System.out.println("bound-values=3");
    System.out.println("escaped-length=" + escaped.length());
    System.out.println("wildcards-escaped=" + (escaped.contains("\\_") && escaped.contains("\\%")));
    System.out.println("over-limit-rejected=" + rejected);
    System.out.println("values-printed=false");
  }
}`, "in=(?,?,?)\nplaceholders=3\nbound-values=3\nescaped-length=5\nwildcards-escaped=true\nover-limit-rejected=true\nvalues-printed=false", ["mybatis-dynamic-sql", "mybatis-bound-sql", "mybatis-language-driver", "owasp-sql-injection", "owasp-input-validation"])],
    diagnostics: [d("빈 IN 목록이 전체 조회가 되거나 큰 list가 parameter limit/timeout을 일으키고 LIKE literal 검색이 wildcard로 확장됩니다.", "empty/size/search-mode policy 없이 collection/value를 직접 join하거나 wildcard를 암묵적으로 허용했습니다.", ["rendered placeholder count", "collection null/empty/size", "LIKE mode/escape clause", "rows examined/plan/timeout"], "element binding, explicit empty policy, size cap와 dialect-specific literal escape를 적용하고 큰 list strategy를 분리합니다.", "0/1/cap/cap+1, wildcard/Unicode와 authorization predicate preservation tests를 둡니다.")],
    expertNotes: ["chunked IN query 결과를 합칠 때 ordering, duplicate, snapshot consistency와 transaction boundary가 달라질 수 있습니다.", "contains search는 안전하게 bind해도 leading wildcard 때문에 index를 사용하지 못할 수 있어 full-text/search architecture를 검토합니다."],
  },
  {
    id: "injection-authorization-least-privilege",
    title: "parameterization을 authorization·최소 권한·query invariant와 결합합니다",
    lead: "완전히 bind된 SQL도 tenant predicate가 없거나 DB account가 과도한 권한을 가지면 다른 사용자의 row를 읽고 수정할 수 있으므로 injection 방어만으로 data access 보안이 완성되지 않습니다.",
    explanations: [
      "모든 mapper operation에 subject/tenant/resource authorization이 어느 layer에서 강제되는지 표시합니다. client가 보낸 owner id를 그대로 신뢰하지 않고 authenticated context와 server-side policy를 사용합니다.",
      "mandatory predicate는 optional dynamic fragment와 분리합니다. criteria null, empty list와 feature flag로 tenant/security filter가 제거되는 path를 negative test합니다.",
      "DB account에는 필요한 schema/table/operation만 허용하고 DDL/admin/file/network privilege를 주지 않습니다. read/write path를 분리할 때 transaction consistency와 credential lifecycle을 함께 설계합니다.",
      "injection 성공 여부만 보는 공격 test를 넘어 unauthorized cross-tenant ids, mass update/delete affected rows, second-order stored sort/fragment와 timing/error leakage를 검증합니다.",
      "mutation은 business key, optimistic version와 affected-row count를 확인합니다. safe binding이 accidental full-table update/delete를 막지 않으므로 key predicate가 없으면 execution을 거부합니다.",
    ],
    concepts: [
      c("mandatory predicate", "tenant/resource/version처럼 operation마다 반드시 존재해야 하는 authorization·safety 조건입니다.", ["optional criteria와 분리합니다.", "rendered shape를 검증합니다."]),
      c("least privilege", "application DB identity에 필요한 최소 object/action 권한만 부여하는 원칙입니다.", ["injection impact를 줄입니다.", "route별 권한을 검토합니다."]),
      c("mass-mutation guard", "key/version predicate와 affected-row limit가 없으면 update/delete를 거부하는 방어입니다.", ["binding과 별도입니다.", "transaction에서 검증합니다."]),
    ],
    diagnostics: [d("SQL injection은 막혔지만 다른 tenant id를 bind해 row를 읽거나 criteria 누락으로 대량 update됩니다.", "parameter safety를 authorization으로 오해하고 mandatory predicate, service context와 affected-row guard를 두지 않았습니다.", ["auth context→parameter data flow", "rendered mandatory predicates", "DB role grants", "affected rows/transaction outcome"], "server-derived tenant/resource predicate와 version/key guard를 필수화하고 DB privilege를 줄이며 unexpected rows면 rollback합니다.", "cross-tenant, empty criteria와 mass-mutation negative tests를 release gate에 둡니다.")],
    expertNotes: ["row-level security를 사용해도 application predicate와 connection/session tenant context 설정을 defense in depth로 검증합니다.", "SQL error 차이와 row count/latency가 unauthorized resource 존재를 노출하지 않도록 public error contract를 설계합니다."],
  },
  {
    id: "safe-logging-and-parameter-test-matrix",
    title: "bind 값을 보지 않고도 진단 가능한 logging·test·performance matrix를 만듭니다",
    lead: "문제 해결을 위해 모든 SQL과 parameter를 출력하는 습관은 PII·credential 유출을 만들며, 반대로 아무 evidence도 없으면 type/shape/route/plan 문제를 설명할 수 없습니다.",
    explanations: [
      "safe event에는 mapper operation id, normalized query fingerprint, placeholder/mapping count, Java/JDBC type categories, collection size bucket, duration, rows/affected, error class, transaction outcome와 schema/driver version을 둡니다.",
      "raw SQL이 필요 없는 dashboard와 제한된 short-lived diagnostic을 분리합니다. diagnostic 권한, 승인, sampling, redaction, retention과 deletion을 두고 bind/parameter object는 기본 수집하지 않습니다.",
      "test matrix는 quotes/Unicode/wildcards/control chars처럼 문법을 바꿔 보이는 합성 values에서 SQL shape가 같은지, unknown identifiers가 거부되는지, null/empty/size cap과 mandatory predicates가 유지되는지 확인합니다.",
      "actual MyBatis integration은 BoundSql mapping metadata, PreparedStatement bind trace와 target result/affected rows를 검사합니다. MySQL·Oracle 등 dialect/driver별 null type, date/enum/decimal과 plan/cache behavior를 비교합니다.",
      "upgrade gate는 MyBatis LanguageDriver/ParamNameResolver/TypeHandler, compiler flags, JDBC driver와 DB version을 기록합니다. dependency update 뒤 SQL snapshot만 보지 말고 type/cardinality/authorization/transaction/performance corpus를 재실행합니다.",
    ],
    concepts: [
      c("query fingerprint", "literal/bind 값을 제외하고 같은 SQL structure를 bounded identifier로 묶는 값입니다.", ["operation과 함께 사용합니다.", "원문 복구 가능성을 검토합니다."]),
      c("binding matrix", "parameter shape·null/type·collection·structure key·dialect/driver 조합의 expected SQL/result/outcome 표입니다.", ["합성 values를 씁니다.", "failure path를 포함합니다."]),
      c("shape invariance", "data value가 달라져도 승인된 query의 SQL structure와 placeholder mapping이 변하지 않는 성질입니다.", ["structure enum은 예외입니다.", "fingerprint로 검증합니다."]),
    ],
    diagnostics: [d("parameter 문제를 조사하려고 debug SQL log를 켰더니 PII/credential이 log/APM에 남습니다.", "운영 evidence schema 없이 raw SQL, bind와 parameter object serialization을 기본 diagnostic으로 사용했습니다.", ["logger/proxy/APM settings", "bind capture/redaction", "artifact retention/access", "safe operation/fingerprint availability"], "raw bind 수집을 중단하고 operation/fingerprint/type/count/outcome allow-list event로 교체하며 이미 노출된 secret은 incident 절차로 회전합니다.", "canary sensitive values로 log/trace/artifact zero-leak test와 short-lived diagnostic approval을 운영합니다.")],
    expertNotes: ["fingerprint normalization 자체가 SQL literal을 수집해야 한다면 생성 위치와 memory/log retention을 threat model링합니다.", "성능 문제에서 value distribution이 필요해도 actual identifiers 대신 synthetic skew와 승인된 coarse histogram을 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-config", repository: "SPRING/SpringBasic", path: "src/main/resources/mybatis-config/mybatis-config.xml", usedFor: ["type-alias/parameter object configuration context"], evidence: "read-only scanner로 configuration/typeAliases structure만 확인했으며 attribute value는 복사하지 않았습니다." },
  { id: "local-mapper-xml", repository: "SPRING/SpringBasic", path: "src/main/resources/sqlmap/BoardMapper.xml", usedFor: ["four hash-style bindings and zero dollar-style substitutions provenance"], evidence: "read-only scanner로 binding token count만 확인했고 SQL·namespace·parameter literal은 출력하거나 복사하지 않았습니다." },
  { id: "local-mapper-interface", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/mapper/BoardMapper.java", usedFor: ["three mapper parameter/return method surfaces provenance"], evidence: "read-only scanner로 method count/name만 확인했고 package/source body와 sample values는 복사하지 않았습니다." },
  { id: "mybatis-sqlmap-xml", repository: "MyBatis 3 Documentation", path: "Mapper XML Parameters and String Substitution", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["hash binding, JDBC placeholders, null JDBC type and text substitution"], evidence: "MyBatis 공식 mapper XML 문서입니다." },
  { id: "mybatis-dynamic-sql", repository: "MyBatis 3 Documentation", path: "Dynamic SQL", publicUrl: "https://mybatis.org/mybatis-3/dynamic-sql.html", usedFor: ["if/choose/where/set/foreach/bind structure"], evidence: "MyBatis 공식 dynamic SQL 문서입니다." },
  { id: "mybatis-configuration", repository: "MyBatis 3 Documentation", path: "Configuration settings and typeHandlers", publicUrl: "https://mybatis.org/mybatis-3/configuration.html", usedFor: ["actual parameter names, jdbcTypeForNull and TypeHandler registry"], evidence: "MyBatis 공식 configuration 문서입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Documentation", path: "Java API statement parameters", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["parameter object and mapped statement execution"], evidence: "MyBatis 공식 Java API 문서입니다." },
  { id: "mybatis-param-name-resolver", repository: "MyBatis 3 API", path: "ParamNameResolver", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/reflection/ParamNameResolver.html", usedFor: ["single, multiple, generic and collection parameter names"], evidence: "MyBatis 공식 ParamNameResolver API입니다." },
  { id: "mybatis-parameter-mapping", repository: "MyBatis 3 API", path: "ParameterMapping", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/ParameterMapping.html", usedFor: ["property, Java/JDBC type and TypeHandler metadata"], evidence: "MyBatis 공식 ParameterMapping API입니다." },
  { id: "mybatis-bound-sql", repository: "MyBatis 3 API", path: "BoundSql", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/BoundSql.html", usedFor: ["final SQL and ordered parameter mappings"], evidence: "MyBatis 공식 BoundSql API입니다." },
  { id: "mybatis-type-handler", repository: "MyBatis 3 API", path: "TypeHandler", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/type/TypeHandler.html", usedFor: ["PreparedStatement/ResultSet typed conversion"], evidence: "MyBatis 공식 TypeHandler API입니다." },
  { id: "mybatis-jdbc-type", repository: "MyBatis 3 API", path: "JdbcType", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/type/JdbcType.html", usedFor: ["JDBC type categories and typed null"], evidence: "MyBatis 공식 JdbcType API입니다." },
  { id: "mybatis-language-driver", repository: "MyBatis 3 API", path: "LanguageDriver", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/LanguageDriver.html", usedFor: ["dynamic SQL and parameter handler boundary"], evidence: "MyBatis 공식 LanguageDriver API입니다." },
  { id: "java-prepared-statement", repository: "Java SE 21 API", path: "PreparedStatement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html", usedFor: ["typed value and setNull exact example"], evidence: "Oracle JDK 공식 PreparedStatement API입니다." },
  { id: "java-connection", repository: "Java SE 21 API", path: "Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["prepareStatement and transaction boundary"], evidence: "Oracle JDK 공식 Connection API입니다." },
  { id: "java-sql-types", repository: "Java SE 21 API", path: "Types", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Types.html", usedFor: ["typed NULL constants"], evidence: "Oracle JDK 공식 Types API입니다." },
  { id: "java-proxy", repository: "Java SE 21 API", path: "Proxy", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html", usedFor: ["exact PreparedStatement call recorder"], evidence: "Oracle JDK 공식 Proxy API입니다." },
  { id: "java-parameter", repository: "Java SE 21 API", path: "Parameter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Parameter.html", usedFor: ["exact parameter annotation/name example"], evidence: "Oracle JDK 공식 Parameter API입니다." },
  { id: "owasp-sql-injection", repository: "OWASP Cheat Sheet Series", path: "SQL Injection Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", usedFor: ["prepared statements, allow-list structure and least privilege"], evidence: "OWASP 공식 community project guidance입니다." },
  { id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input Validation Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allow-list and semantic validation boundaries"], evidence: "OWASP 공식 community project guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-03-parameter-binding", slug: "mybatis-03-parameter-binding", courseId: "spring", moduleId: "mybatis-mapping", order: 3,
  title: "#{} 파라미터 바인딩과 ${} 치환의 위험", subtitle: "SQL 코드와 값을 분리하고 BoundSql·type/null/name resolution·구조 allow-list·LIKE/IN·authorization까지 안전하게 검증합니다.", level: "전문가", estimatedMinutes: 1000,
  coreQuestion: "MyBatis mapper 입력이 SQL 문법을 바꾸지 않으면서 정확한 property·Java/JDBC type·NULL·collection으로 bind되고, 불가피한 식별자 구조가 유한한 allow-list에서만 생성됨을 어떻게 증명할까요?",
  summary: "SpringBasic mapper XML의 hash-style binding 네 곳과 dollar-style substitution 0곳, 세 mapper method를 read-only scanner로 구조 감사했습니다. SQL·namespace·parameter literal은 복사하지 않았습니다. SQL code/data separation, #{}→BoundSql/ParameterMapping/PreparedStatement pipeline, typed binding, ParamNameResolver, null intent/jdbcType/TypeHandler, ${} structure substitution risk, identifier/order enum allow-list, bounded LIKE/IN/foreach, authorization·least privilege·mass-mutation guard와 secret-free logging/target test matrix를 초보부터 전문가까지 설명합니다. 다섯 JDK 21 examples는 hash binding compile, typed/null PreparedStatement trace, parameter name resolution, identifier allow-list와 bounded LIKE/IN shape를 실제 실행합니다.",
  objectives: ["SQL structure와 external data value를 분류하고 parameterization boundary를 설명한다.", "#{}가 BoundSql·ParameterMapping·TypeHandler·PreparedStatement로 이어지는 순서를 추적한다.", "Java/JDBC/column type과 null intent를 target driver에서 검증한다.", "단일·복수·명시 이름·collection parameter resolution을 고정한다.", "${}를 일반 값 바인딩으로 사용하지 않고 구조 allow-list로 제한한다.", "정렬/identifier, LIKE/IN/foreach를 bounded safe builder로 생성한다.", "parameterization을 authorization, mandatory predicate와 최소 권한으로 보완한다.", "raw bind 없이 binding failure·performance·upgrade를 관측하고 테스트한다."],
  prerequisites: [{ title: "Mapper 인터페이스와 XML namespace·id 연결", reason: "parameter expression이 어떤 mapper Method와 MappedStatement/SqlSession 실행에 연결되는지 알아야 binding metadata를 이해할 수 있습니다.", sessionSlug: "mybatis-02-interface-xml-binding" }],
  keywords: ["#{}", "${}", "PreparedStatement", "BoundSql", "ParameterMapping", "ParamNameResolver", "TypeHandler", "jdbcType", "SQL injection", "allow-list", "foreach IN", "LIKE escape", "least privilege"], topics,
  lab: {
    title: "MyBatis parameter binding과 structure-injection certification",
    scenario: "검색·정렬·목록·mutation mapper가 여러 parameter, null, wildcard와 동적 ordering을 받아야 하지만 SQL injection, full-table mutation, wrong type와 bind logging 노출을 막아야 합니다.",
    setup: ["로컬 세 source는 read-only로 보존하고 hash/dollar token, method와 statement count만 기록합니다.", "JDK executable models와 별도로 actual MyBatis, supported DB/driver와 synthetic boundary schema를 준비합니다.", "각 input을 data value, approved structure key, mandatory context 또는 forbidden으로 분류합니다.", "property/Java/JDBC type/null/size/sensitivity와 expected SQL fingerprint/result/outcome matrix를 만듭니다."],
    steps: ["모든 hash/dollar expression과 input data-flow를 inventory합니다.", "actual BoundSql의 placeholder/mapping order와 property metadata를 값 없이 확인합니다.", "PreparedStatement setter/type handler를 numeric/string/time/enum/null boundary에서 trace합니다.", "single/multiple/explicit/actual/generic/collection parameter names를 production artifact로 검증합니다.", "dollar-style 위치를 제거하거나 public key→server fragment enum mapping으로 제한합니다.", "ORDER BY total order와 dialect fragments를 golden ids/EXPLAIN으로 승인합니다.", "LIKE literal/pattern mode와 IN empty/size cap/large-list strategy를 실행합니다.", "tenant/resource/version mandatory predicates와 affected-row mass-mutation guard를 negative-test합니다.", "raw SQL/bind/parameter object가 logs/traces/errors/artifacts에 없는지 canary로 검사합니다.", "MyBatis/compiler/driver/DB upgrade matrix에서 shape/result/transaction/performance를 재검증합니다."],
    expectedResult: ["모든 data value가 placeholder와 typed ParameterMapping으로 전달되고 SQL shape를 바꾸지 않습니다.", "다섯 Java examples의 stdout이 완전히 일치합니다.", "unknown structure key, invalid collection/null state와 missing mandatory predicate가 execution 전에 거부됩니다.", "지원 dialect에서 type/null/result/plan과 transaction outcome이 contract와 일치합니다.", "운영 evidence가 bind 값을 노출하지 않고 operation/type/count/failure를 설명합니다."],
    cleanup: ["ephemeral schemas, synthetic values, BoundSql/bind traces와 test artifacts를 run id로 삭제합니다.", "temporary DB credential, pool과 diagnostic logging access를 revoke합니다.", "logs/traces/artifacts에 SQL values·PII·credential이 없는지 재검사합니다.", "로컬 원본 세 파일은 변경하지 않고 token/method/statement count evidence만 보존합니다."],
    extensions: ["custom enum/time/JSON TypeHandler의 round-trip/null/version migration을 구현합니다.", "MySQL·Oracle pagination/order/LIKE escape dialect registry를 추가합니다.", "large IN을 temporary table 또는 bulk staging으로 바꾸고 transaction/reconciliation을 검증합니다.", "static dollar-token inventory와 SQL shape invariance fuzz test를 CI에 자동화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 값 binding과 구조 선택을 구분하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "#{}가 ?와 ordered properties로 바뀜을 설명합니다.", "typed/null setter와 값 비출력을 확인합니다.", "single/explicit/generic parameter names를 구분합니다.", "unknown sort key가 거부됨을 확인합니다.", "IN size cap과 LIKE wildcard escape를 설명합니다."], hints: ["SQL에서 바뀔 수 있는 것이 값인지 identifier/keyword/placeholder 수인지 먼저 색으로 구분하세요."], expectedOutcome: "hash binding과 dollar substitution의 차이를 실행 결과와 security boundary로 설명합니다.", solutionOutline: ["classify→compile→bind→resolve→allow-list→bound dynamic shape 순서입니다."] },
    { difficulty: "응용", prompt: "원본 mapper의 parameter binding을 production security contract로 확장하세요.", requirements: ["원본 literal 없이 token provenance를 보존합니다.", "BoundSql mapping/order/type를 검증합니다.", "parameter names/null/type handlers를 명시합니다.", "dollar-style를 금지 또는 closed enum으로 제한합니다.", "LIKE/IN empty/size/wildcard를 처리합니다.", "mandatory tenant/key/version predicates를 둡니다.", "target DB result/plan/failure matrix를 실행합니다.", "secret-free logging과 upgrade rollback을 포함합니다."], hints: ["PreparedStatement를 사용한다는 사실만으로 ORDER BY identifier concatenation은 안전해지지 않습니다."], expectedOutcome: "injection·type·null·full-scan/mutation과 logging leak를 함께 차단하는 mapper가 완성됩니다.", solutionOutline: ["inventory→data/structure split→metadata→target tests→authorization→telemetry 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 MyBatis parameter·dynamic SQL 보안 표준을 작성하세요.", requirements: ["hash/dollar 사용 규칙을 정의합니다.", "parameter object/name/type/null/handler 정책을 둡니다.", "identifier/order fragment registry를 운영합니다.", "LIKE/IN/foreach limits와 empty policy를 둡니다.", "authorization/mandatory predicate/least privilege를 포함합니다.", "BoundSql/shape/target driver test를 요구합니다.", "raw bind logging을 금지하고 safe telemetry를 정의합니다.", "exception approval, static scan과 upgrade matrix를 운영합니다."], hints: ["바인딩 안전성, business authorization과 DB 권한을 서로 다른 방어층으로 적으세요."], expectedOutcome: "SQL 입력부터 운영 incident까지 일관된 parameter security governance가 완성됩니다.", solutionOutline: ["separate→bind→constrain→authorize→measure→qualify 순서입니다."] },
  ],
  nextSessions: ["mybatis-04-resulttype-resultmap"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["mybatis-config.xml은 parameter object에 쓰이는 type alias context만 확인했으며 실제 alias/package attribute는 복사하지 않았습니다.", "BoardMapper.xml은 hash-style binding 네 곳과 dollar-style substitution 0곳이 확인됐지만 SQL·namespace·parameter literal은 출력하거나 복사하지 않았습니다.", "BoardMapper.java는 세 mapper method surface가 확인됐지만 package/source body와 sample values는 복사하지 않았습니다.", "JDK examples는 binding/security invariant의 executable model이며 실제 MyBatis BoundSql/ParameterHandler/TypeHandler, supported JDBC driver와 DB optimizer/transaction behavior를 대체하지 않습니다."] },
});

export default session;
