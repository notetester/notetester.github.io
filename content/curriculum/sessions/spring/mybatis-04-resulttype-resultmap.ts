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
      { lines: `1-${first}`, explanation: "JDK 21 record·Map·collection만으로 synthetic ResultSet row와 명시적 mapping metadata를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "column label→property, constructor, NULL/type conversion 또는 parent-child identity 조립 규칙을 실제 Java 함수로 적용합니다." },
      { lines: `${second + 1}-${count}`, explanation: "객체 값·누락/중복 진단·deduplication·resource 상태를 deterministic stdout으로 확인하며 실제 MyBatis/driver 통합 범위를 분리합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 MyBatis jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "교육용 mapper는 MyBatis ResultSetHandler/TypeHandler/ObjectFactory 구현이 아니므로 실제 mapper XML·driver·DB conformance를 별도로 검증합니다."] },
    experiments: [
      { change: "column 순서·alias·NULL·unknown/duplicate label과 left-join 빈 child를 바꿉니다.", prediction: "position이 아니라 label/id/nullability 계약에 따라 같은 객체 또는 stable mapping error가 나옵니다.", result: "projection fingerprint, constructed objects, child counts와 diagnostics를 비교합니다." },
      { change: "동일 mapping을 실제 MyBatis와 지원 MySQL/Oracle driver에서 실행합니다.", prediction: "승인된 dialect/type 차이를 제외하면 required properties, identity와 round-trip 결과가 같습니다.", result: "MappedStatement/ResultMap inventory, column metadata, mapped graph와 resource close를 readback합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "result-mapping-pipeline-vocabulary",
    title: "ResultSet 한 행이 Java 객체가 되는 pipeline과 용어를 먼저 고정합니다",
    lead: "앞 세션의 안전한 parameter binding이 입력 경계라면 이번 세션은 DB column 값을 객체 property와 관계 graph로 되돌리는 출력 경계입니다.",
    explanations: [
      "선행 세션 `mybatis-03-parameter-binding`에서는 `#{}`가 PreparedStatement parameter를 만드는 이유를 다뤘습니다. 여기서는 실행된 select의 ResultSet metadata와 row values가 MappedStatement→ResultMap/자동 매핑→TypeHandler→ObjectFactory/constructor→property assignment→collection graph 순서로 변환되는 과정을 추적합니다.",
      "resultType은 한 Java type을 지정하고 MyBatis의 자동 매핑 규칙에 맡기는 간결한 경로입니다. resultMap은 column, property, id, constructor, association, collection, discriminator와 type handler를 명시하는 이름 있는 mapping contract입니다.",
      "원본 FreeBoardMapper.xml은 게시판 목록·상세 select에 resultType alias를 사용하고 VO는 번호·제목·작성자·본문·등록/수정 시각 field를 갖습니다. 이 교재는 실제 namespace/SQL/package를 복사하지 않고 resultType과 projection/VO shape의 구조만 provenance로 사용합니다.",
      "매핑 성공은 예외가 없다는 뜻이 아닙니다. 필요한 property가 기본값 0/null로 조용히 남거나, 중복 label이 덮이거나, join이 child를 중복 생성해도 객체는 반환될 수 있으므로 mapping postcondition과 fixture readback이 필요합니다.",
      "학습할 때는 SQL projection→column labels→mapping metadata→constructor/setter→객체 invariant를 표로 그립니다. 장애 시에는 DB 값부터 보지 말고 어떤 label과 Java/JDBC type이 실제 전달됐는지 단계별로 확인합니다.",
    ],
    concepts: [
      c("resultType", "select 결과 한 행을 담을 Java type 또는 alias를 지정하고 자동 매핑을 사용하는 속성입니다.", ["collection이면 collection 자체가 아니라 원소 type입니다.", "resultMap과 동시에 사용하지 않습니다."]),
      c("resultMap", "column과 객체 생성/property/관계 규칙을 이름 붙여 선언한 mapping metadata입니다.", ["명시적 id/result/association/collection을 가집니다.", "다른 statement에서 재사용할 수 있습니다."]),
      c("mapping postcondition", "매핑 후 반드시 성립해야 하는 required property, identity, cardinality와 nullability 불변식입니다.", ["fixture로 검증합니다.", "silent default를 탐지합니다."]),
    ],
    diagnostics: [
      d("query는 행을 반환하지만 객체 field가 0/null입니다.", "projection label과 property 이름/type이 자동 매핑 규칙에 맞지 않거나 setter/constructor가 없습니다.", ["actual column labels", "resultType/resultMap selection", "autoMappingBehavior/mapUnderscoreToCamelCase", "constructor/setter/type handler"], "명시적 alias/resultMap을 사용하고 required property postcondition을 integration test에서 검증합니다.", "select *를 제거하고 projection/resultMap/schema fixture를 함께 versioning합니다."),
      d("문제를 SQL 오류로만 추적해 mapping 단계 원인을 찾지 못합니다.", "execute와 object materialization의 실패 경계를 구분하지 않았습니다.", ["SQLException vs reflection/type exception", "MappedStatement id", "ResultMap id", "row/column index without values"], "execute→metadata→convert→construct→assign→aggregate stage taxonomy로 예외를 분류합니다.", "stage별 synthetic failure와 secret-free diagnostic envelope를 둡니다."),
    ],
    expertNotes: ["ResultMap은 DTO 편의 설정이 아니라 database projection과 domain object 사이의 실행 가능한 anti-corruption contract입니다.", "row 값 자체를 log하지 않아도 statement/resultMap id, labels/types/count와 failure stage로 대부분의 문제를 진단할 수 있습니다."],
  },
  {
    id: "resulttype-auto-mapping-aliases",
    title: "resultType 자동 매핑을 column label·alias·camel-case 규칙으로 통제합니다",
    lead: "자동 매핑은 이름이 우연히 맞을 때 편리하지만 naming policy와 projection이 흔들리면 조용한 data loss가 됩니다.",
    explanations: [
      "JDBC getter는 select expression의 column label을 중심으로 값을 제공합니다. SQL에서 `column AS property_name`을 명시하면 physical column name과 Java property를 분리하고 projection contract를 review하기 쉬워집니다.",
      "`mapUnderscoreToCamelCase`를 켜면 snake_case label을 camelCase property로 변환할 수 있지만 acronym, 숫자, 이미 alias된 label과 nested prefix까지 원하는 대로 처리되는지 fixture로 검증합니다. 전역 setting 변경은 모든 mapper에 영향을 줍니다.",
      "자동 매핑 수준 NONE/PARTIAL/FULL은 nested result map에서 예상치 못한 property를 채울 수 있습니다. FULL은 join column 이름 충돌 위험이 있으므로 explicit projection prefix와 resultMap을 선호합니다.",
      "`select *`는 column 추가/순서/중복 label과 큰 payload를 application release 없이 바꿉니다. 필요한 column을 안정된 순서와 alias로 열거하고 schema migration에서 projection compatibility를 검사합니다.",
      "primitive field는 SQL NULL이 들어와도 null을 표현하지 못해 기본값과 실제 0을 구분하기 어렵습니다. nullable column은 wrapper/Optional boundary 또는 별도 domain policy를 사용하고 required column은 DB constraint와 mapper validation을 맞춥니다.",
    ],
    concepts: [
      c("column label", "ResultSet에서 select expression을 식별하는 이름이며 alias가 있으면 보통 alias가 사용됩니다.", ["property mapping의 입력입니다.", "duplicate label을 피합니다."]),
      c("mapUnderscoreToCamelCase", "underscore 기반 column label을 camel-case property로 자동 연결하는 MyBatis setting입니다.", ["전역 영향이 있습니다.", "명시적 alias/resultMap이 우선될 수 있습니다."]),
      c("automatic mapping", "명시적 result mapping이 없는 column을 이름과 type handler 규칙으로 property에 연결하는 기능입니다.", ["NONE/PARTIAL/FULL policy가 있습니다.", "unknown column behavior를 설정합니다."]),
    ],
    codeExamples: [java("mybatis04-auto-mapping", "column alias와 snake-case 자동 매핑", "MyBatis04AutoMapping.java", "synthetic row의 column labels를 camelCase property로 정규화해 record를 만들고 unknown column을 별도 보고합니다.", String.raw`import java.time.Instant;
import java.util.*;

public class MyBatis04AutoMapping {
  record Article(long articleId, String title, Instant registeredAt) {}

  static String camel(String label) {
    StringBuilder out = new StringBuilder();
    boolean upper = false;
    for (char ch : label.toCharArray()) {
      if (ch == '_') upper = true;
      else {
        out.append(upper ? Character.toUpperCase(ch) : Character.toLowerCase(ch));
        upper = false;
      }
    }
    return out.toString();
  }

  public static void main(String[] args) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("article_id", 17L);
    row.put("title", "mapping contract");
    row.put("registered_at", "2026-01-02T03:04:05Z");
    row.put("diagnostic_only", "ignored");
    Map<String, Object> properties = new LinkedHashMap<>();
    row.forEach((label, value) -> properties.put(camel(label), value));
    Article article = new Article(
        (Long) properties.get("articleId"),
        (String) properties.get("title"),
        Instant.parse((String) properties.get("registeredAt")));
    System.out.println("labels=" + row.keySet());
    System.out.println("properties=" + properties.keySet());
    System.out.println("article=" + article.articleId() + "|" + article.title() + "|" + article.registeredAt());
    System.out.println("unknown=" + (properties.containsKey("diagnosticOnly") ? 1 : 0));
  }
}`, "labels=[article_id, title, registered_at, diagnostic_only]\nproperties=[articleId, title, registeredAt, diagnosticOnly]\narticle=17|mapping contract|2026-01-02T03:04:05Z\nunknown=1", ["mybatis-sqlmap", "mybatis-configuration", "mybatis-auto-mapping"] )],
    diagnostics: [
      d("snake_case column이 camelCase field에 들어가지 않습니다.", "mapUnderscoreToCamelCase가 꺼졌거나 label/alias가 예상 규칙과 다릅니다.", ["effective setting", "actual label case", "explicit result mappings", "setter/property names"], "명시적 alias/resultMap을 우선 적용하고 전역 setting을 startup manifest에서 readback합니다.", "지원 DB의 label case와 naming edge corpus를 mapper fixture에 둡니다."),
      d("join 후 부모와 자식의 id/name이 서로 덮입니다.", "두 table의 동일한 unqualified label을 FULL auto-mapping에 맡겼습니다.", ["projection duplicate labels", "autoMappingBehavior", "columnPrefix", "nested resultMap ids"], "각 projection에 parent_/child_ prefix를 주고 명시적 nested resultMap과 columnPrefix를 사용합니다.", "duplicate-label scanner와 join graph golden test를 둡니다."),
    ],
    expertNotes: ["자동 매핑을 사용할수록 projection naming convention과 unknown-column policy가 사실상 schema입니다.", "alias는 DB column rename을 application property와 분리하는 compatibility layer로 활용할 수 있습니다."],
  },
  {
    id: "explicit-resultmap-id-result",
    title: "resultMap의 id·result를 projection contract로 명시합니다",
    lead: "명시적 mapping은 장황함을 늘리는 것이 아니라 identity, required field와 schema evolution을 code review 가능한 형태로 만듭니다.",
    explanations: [
      "`<id>`와 `<result>`는 모두 column→property를 연결하지만 id mapping은 object identity와 nested result deduplication 최적화에 사용됩니다. database primary key 또는 graph에서 안정된 composite identity를 빠짐없이 지정합니다.",
      "resultMap은 type, id와 mappings를 가지며 statement의 resultMap 속성으로 참조합니다. resultType과 resultMap을 동시에 지정하지 않고 startup에서 모든 referenced map이 존재하는지 검증합니다.",
      "javaType/jdbcType/typeHandler를 필요한 경계에서만 명시합니다. 실제 Java property type을 잘못 선언하면 conversion error 또는 다른 handler 선택이 생기므로 schema와 record/VO contract에서 생성하는 방식을 고려합니다.",
      "column 속성은 label과 일치해야 합니다. physical name에 의존하지 말고 projection alias를 안정적으로 정의하며 case folding과 quoted identifier 차이를 supported DB matrix에서 확인합니다.",
      "resultMap 상속은 공통 mapping 재사용에 유용하지만 멀리 떨어진 extends chain은 최종 mapping을 파악하기 어렵게 합니다. resolved ResultMap의 property/column/id inventory를 startup artifact로 생성합니다.",
    ],
    concepts: [
      c("id mapping", "결과 객체의 identity를 나타내는 column/property mapping입니다.", ["nested graph dedup에 중요합니다.", "composite key면 모든 구성 요소를 지정합니다."]),
      c("result mapping", "일반 scalar column을 객체 property와 type handler에 연결하는 규칙입니다.", ["column label을 사용합니다.", "nullable/type policy를 포함합니다."]),
      c("resolved ResultMap", "extends와 nested references를 모두 적용한 최종 mapping metadata입니다.", ["startup evidence로 기록합니다.", "statement와 함께 versioning합니다."]),
    ],
    codeExamples: [java("mybatis04-explicit-map", "명시적 column-property mapping 검증", "MyBatis04ExplicitMap.java", "mapping spec를 통해 row를 불변 record로 만들고 required column이 빠졌을 때 stable 오류를 반환합니다.", String.raw`import java.util.*;

public class MyBatis04ExplicitMap {
  record Mapping(String column, String property, boolean required) {}
  record Member(long id, String displayName, String biography) {}

  static Member map(Map<String, Object> row, List<Mapping> mappings) {
    for (Mapping mapping : mappings) {
      if (mapping.required() && !row.containsKey(mapping.column())) {
        throw new IllegalArgumentException("missing-column:" + mapping.column());
      }
    }
    return new Member((Long) row.get("member_no"), (String) row.get("display_label"), (String) row.get("bio_text"));
  }

  public static void main(String[] args) {
    List<Mapping> mappings = List.of(
        new Mapping("member_no", "id", true),
        new Mapping("display_label", "displayName", true),
        new Mapping("bio_text", "biography", false));
    Member member = map(new LinkedHashMap<>(Map.of("member_no", 9L, "display_label", "Ada")), mappings);
    System.out.println("mapping-count=" + mappings.size());
    System.out.println("id-mapping=" + mappings.getFirst().column() + "->" + mappings.getFirst().property());
    System.out.println("member=" + member.id() + "|" + member.displayName() + "|" + member.biography());
    try { map(Map.of("member_no", 10L), mappings); }
    catch (IllegalArgumentException e) { System.out.println("invalid=" + e.getMessage()); }
  }
}`, "mapping-count=3\nid-mapping=member_no->id\nmember=9|Ada|null\ninvalid=missing-column:display_label", ["mybatis-sqlmap", "mybatis-result-map", "mybatis-result-mapping"] )],
    diagnostics: [
      d("resultMap reference가 startup 또는 첫 호출에 없다고 실패합니다.", "namespace-qualified id, resource packaging 또는 definition order/reference가 틀렸습니다.", ["MappedStatement resultMap ids", "mapper namespace", "packaged XML", "Configuration.hasResultMap"], "fully-qualified resolved id를 확인하고 production artifact startup에서 모든 reference를 fail-fast 검증합니다.", "mapped statement/result map bipartite inventory와 broken-reference negative test를 둡니다."),
      d("nested collection에 같은 child가 여러 번 생성됩니다.", "resultMap에 올바른 id mapping이 없거나 composite identity 일부가 빠졌습니다.", ["parent/child id mappings", "join row identity", "NULL child key", "resultOrdered/order by"], "stable primary/composite key를 id mappings로 지정하고 null child row를 생성하지 않게 합니다.", "duplicate join rows와 composite-key collision fixture를 둡니다."),
    ],
    expertNotes: ["id mapping은 객체 equals/hashCode와 별개로 MyBatis result graph 조립이 행 identity를 판단하는 근거입니다.", "resolved mapping inventory를 schema migration diff와 연결하면 silent default/rename 문제를 release 전에 발견할 수 있습니다."],
  },
  {
    id: "constructor-record-immutable-mapping",
    title: "constructor·record mapping으로 불변 객체 invariant를 생성 시점에 지킵니다",
    lead: "setter 기반 빈 객체 채우기는 단순하지만 객체가 잠시 불완전하고 nullable/default 오류가 늦게 드러날 수 있습니다.",
    explanations: [
      "constructor mapping은 `<constructor>` 안의 `<idArg>`와 `<arg>`로 column을 생성자 parameter에 연결합니다. Java record/불변 DTO는 모든 required 값을 한 번에 받아 생성되므로 이후 mutation과 누락 setter를 줄입니다.",
      "parameter name 기반 mapping은 compiler `-parameters`, record metadata와 MyBatis version/setting의 영향을 받습니다. name에만 기대지 않고 arg name/type과 column alias를 명시하거나 supported build artifact에서 constructor metadata를 검증합니다.",
      "여러 overloaded constructors가 있으면 선택이 모호할 수 있습니다. persistence DTO에는 하나의 canonical constructor/factory를 두고 domain entity 변환은 별도 adapter에서 invariant validation과 함께 수행합니다.",
      "SQL NULL이 non-null constructor parameter에 들어오면 즉시 mapping failure로 만드는 것이 silent invalid object보다 낫습니다. nullable field는 wrapper/Optional을 무분별하게 mapper property로 쓰기보다 DB DTO와 domain conversion policy를 명확히 합니다.",
      "Kotlin data class, Lombok-generated constructors와 module reflection 접근은 별도 compatibility 대상입니다. source annotation만 보지 말고 실제 bytecode constructor와 runtime module access를 test합니다.",
    ],
    concepts: [
      c("constructor mapping", "ResultSet 값을 setter 대신 특정 constructor arguments에 공급하는 resultMap 규칙입니다.", ["idArg/arg를 사용합니다.", "불변 객체에 적합합니다."]),
      c("canonical constructor", "record의 모든 component 또는 불변 type의 완전한 상태를 받는 대표 생성자입니다.", ["required invariant를 검사합니다.", "overload ambiguity를 줄입니다."]),
      c("persistence DTO", "DB projection shape를 명확히 표현하고 domain object로 변환되는 경계 객체입니다.", ["schema coupling을 격리합니다.", "API DTO와 자동 공유하지 않습니다."]),
    ],
    codeExamples: [java("mybatis04-constructor", "불변 record constructor mapping과 NULL invariant", "MyBatis04Constructor.java", "column label을 constructor arguments에 명시적으로 공급하고 required title이 null이면 객체 생성을 거부합니다.", String.raw`import java.time.Instant;
import java.util.*;

public class MyBatis04Constructor {
  record Post(long id, String title, Instant updatedAt) {
    Post {
      if (id < 1) throw new IllegalArgumentException("id-out-of-range");
      if (title == null || title.isBlank()) throw new IllegalArgumentException("title-required");
      Objects.requireNonNull(updatedAt, "updatedAt");
    }
  }

  static Post construct(Map<String, Object> row) {
    return new Post(
        ((Number) row.get("post_id")).longValue(),
        (String) row.get("post_title"),
        Instant.parse((String) row.get("updated_at")));
  }

  public static void main(String[] args) {
    Post post = construct(Map.of(
        "post_id", 21L,
        "post_title", "immutable mapping",
        "updated_at", "2026-02-03T04:05:06Z"));
    System.out.println("post=" + post.id() + "|" + post.title() + "|" + post.updatedAt());
    try {
      Map<String, Object> invalid = new HashMap<>();
      invalid.put("post_id", 22L);
      invalid.put("post_title", null);
      invalid.put("updated_at", "2026-02-03T04:05:06Z");
      construct(invalid);
    } catch (IllegalArgumentException e) {
      System.out.println("invalid=" + e.getMessage());
    }
  }
}`, "post=21|immutable mapping|2026-02-03T04:05:06Z\ninvalid=title-required", ["mybatis-sqlmap", "mybatis-object-factory", "mybatis-result-mapping"] )],
    diagnostics: [
      d("배포에서만 no suitable constructor 또는 argument mismatch가 납니다.", "compiler parameter metadata, overload 또는 runtime module/reflection 접근이 개발과 다릅니다.", ["packaged bytecode constructors", "-parameters/record metadata", "arg names/types", "JDK/MyBatis version/module flags"], "canonical constructor와 explicit arg mappings를 사용하고 동일 production artifact boot/mapping test를 실행합니다.", "build artifact 기반 constructor inventory와 upgrade matrix를 둡니다."),
      d("nullable column 때문에 primitive constructor argument가 0으로 보입니다.", "SQL NULL과 primitive default를 구분할 수 없는 model을 사용했습니다.", ["column nullability/data", "constructor parameter type", "type handler/getter", "domain invariant"], "nullable DB DTO에는 wrapper를 사용하고 required이면 DB constraint+constructor validation으로 즉시 실패시킵니다.", "NULL/0/boundary round-trip fixture를 모든 constructor argument에 둡니다."),
    ],
    expertNotes: ["불변 mapping은 reflection 기법보다 projection과 constructor invariant가 일치한다는 contract가 핵심입니다.", "domain entity를 DB table shape에 직접 묶기보다 persistence DTO→domain factory를 두면 schema와 domain 진화를 분리할 수 있습니다."],
  },
  {
    id: "null-types-typehandlers",
    title: "SQL NULL·JDBC type·TypeHandler의 round-trip을 검증합니다",
    lead: "column 이름이 맞아도 driver 값과 Java type 사이 변환이 모호하면 timezone, enum, 숫자 precision과 NULL 의미가 손실됩니다.",
    explanations: [
      "TypeHandler는 PreparedStatement parameter 설정뿐 아니라 ResultSet/CallableStatement 값을 Java type으로 읽는 양방향 경계입니다. built-in handler가 어떤 Java/JDBC type 조합에 선택되는지 configuration registry에서 확인합니다.",
      "Timestamp를 LocalDateTime/Instant/OffsetDateTime 중 무엇으로 읽을지는 column semantics와 driver timezone behavior에 달렸습니다. 저장 표준, session timezone와 display timezone을 분리하고 DST 경계에서 round-trip합니다.",
      "enum을 name, code 또는 ordinal로 저장하는 정책을 명시합니다. ordinal은 enum 순서 변경에 취약하고 unknown DB code는 null/default로 삼키지 말고 stable mapping error 또는 Unknown value policy를 적용합니다.",
      "BigDecimal precision/scale과 numeric narrowing을 검증합니다. `Number.longValue()` 같은 교육용 변환은 범위 확인을 생략하므로 production TypeHandler는 overflow와 scale loss를 탐지해야 합니다.",
      "wasNull semantics와 nullable primitive를 고려합니다. custom handler가 SQL NULL을 domain sentinel로 바꾸면 query/filter/serialization 전 영역에 의미가 퍼지므로 handler contract와 migration을 함께 검토합니다.",
    ],
    concepts: [
      c("TypeHandler", "JDBC parameter/result 값과 특정 Java type 사이 변환을 담당하는 MyBatis extension입니다.", ["Java/JDBC type registry로 선택됩니다.", "NULL·round-trip을 검증합니다."]),
      c("round-trip invariant", "Java→DB→Java 변환 후 의미 있는 값·precision·timezone·code가 보존되는 조건입니다.", ["supported driver마다 실행합니다.", "NULL과 unknown code를 포함합니다."]),
      c("unknown enum code", "DB에 존재하지만 현재 application enum이 알지 못하는 값입니다.", ["배포 순서 문제일 수 있습니다.", "명시적 forward-compatibility 정책이 필요합니다."]),
    ],
    codeExamples: [java("mybatis04-type-handler", "enum·timestamp TypeHandler contract", "MyBatis04TypeHandler.java", "synthetic DB code와 UTC timestamp를 domain enum/Instant로 변환하고 unknown code를 stable error로 분류합니다.", String.raw`import java.time.Instant;
import java.util.*;

public class MyBatis04TypeHandler {
  enum Visibility { PUBLIC("P"), PRIVATE("R");
    final String code;
    Visibility(String code) { this.code = code; }
    static Visibility fromCode(String code) {
      return Arrays.stream(values())
          .filter(value -> value.code.equals(code))
          .findFirst()
          .orElseThrow(() -> new IllegalArgumentException("unknown-visibility-code"));
    }
  }
  record Projection(Visibility visibility, Instant publishedAt) {}

  public static void main(String[] args) {
    Projection projection = new Projection(
        Visibility.fromCode("P"),
        Instant.parse("2026-03-04T05:06:07Z"));
    System.out.println("visibility=" + projection.visibility());
    System.out.println("database-code=" + projection.visibility().code);
    System.out.println("published-at=" + projection.publishedAt());
    try { Visibility.fromCode("X"); }
    catch (IllegalArgumentException e) { System.out.println("invalid=" + e.getMessage()); }
  }
}`, "visibility=PUBLIC\ndatabase-code=P\npublished-at=2026-03-04T05:06:07Z\ninvalid=unknown-visibility-code", ["mybatis-type-handler", "mybatis-configuration", "java-result-set"] )],
    diagnostics: [
      d("같은 timestamp가 환경마다 다른 시각으로 매핑됩니다.", "column/session/driver/application timezone semantics를 암묵적 default에 맡겼습니다.", ["column type", "session/driver timezone", "selected handler", "raw metadata and UTC round-trip"], "instant/date/time 의미를 분리하고 explicit handler/configuration과 UTC readback을 적용합니다.", "DST gap/overlap과 driver/JDK version matrix를 둡니다."),
      d("새 enum code 배포 뒤 이전 application이 null로 처리합니다.", "unknown code를 silent null/default로 변환하는 handler입니다.", ["DB code distribution", "handler fallback", "deployment order", "consumer versions"], "forward-compatible Unknown variant 또는 stable failure+rollout ordering을 product contract에 맞춰 적용합니다.", "old/new producer-consumer compatibility fixture와 unknown-code alert를 둡니다."),
    ],
    expertNotes: ["custom handler는 편의 converter가 아니라 persisted data format의 versioned codec입니다.", "handler 등록 범위가 너무 넓으면 의도하지 않은 statement까지 바뀌므로 property-level 명시와 registry scope를 검토합니다."],
  },
  {
    id: "nested-association-collection-identity",
    title: "association·collection을 join row의 identity graph로 조립합니다",
    lead: "한 부모와 여러 자식을 join하면 ResultSet 행 수와 반환 부모 객체 수가 다르므로 id mapping과 NULL child 판정이 필수입니다.",
    explanations: [
      "association은 하나의 nested object, collection은 여러 child objects를 property에 매핑합니다. nested result mapping은 한 join ResultSet에서 graph를 조립하고 nested select는 key마다 별도 query를 호출할 수 있습니다.",
      "join row마다 부모 column이 반복되므로 parent `<id>`를 기준으로 같은 객체를 재사용하고 child `<id>`로 collection 중복을 제거합니다. id가 없으면 모든 mapped property 비교 비용과 잘못된 중복이 생길 수 있습니다.",
      "LEFT JOIN에서 child key 전체가 NULL이면 빈 child를 만들지 않습니다. child의 nullable business field만 보고 존재 여부를 판단하지 않고 non-null primary identity를 사용합니다.",
      "columnPrefix는 parent/child/grandchild의 동일 label을 안전하게 분리합니다. reusable child resultMap에 prefix를 공급하면 projection alias와 mapping을 명확히 유지할 수 있습니다.",
      "resultOrdered=true는 rows가 parent id로 그룹화되었다는 강한 계약입니다. memory 최적화에 도움이 될 수 있지만 SQL ORDER BY가 실제로 이를 보장하고 pagination이 parent graph를 자르지 않는지 검증합니다.",
    ],
    concepts: [
      c("association", "한 결과 객체 안의 단일 nested object를 매핑하는 resultMap 요소입니다.", ["nested result 또는 select를 사용할 수 있습니다.", "columnPrefix를 적용할 수 있습니다."]),
      c("collection", "한 부모에 여러 child 결과를 누적하는 resultMap 요소입니다.", ["ofType/javaType을 구분합니다.", "child id로 중복을 제거합니다."]),
      c("row-to-graph aggregation", "반복 join rows를 identity 기준으로 하나의 부모/자식 object graph로 접는 과정입니다.", ["NULL child를 제외합니다.", "ordering/memory를 고려합니다."]),
    ],
    codeExamples: [java("mybatis04-nested-graph", "join rows의 부모·자식 deduplication", "MyBatis04NestedGraph.java", "반복/NULL child synthetic rows를 parent/child id로 접어 안정된 게시글-댓글 graph를 만듭니다.", String.raw`import java.util.*;

public class MyBatis04NestedGraph {
  record Row(long postId, String title, Long commentId, String commentText) {}
  record Comment(long id, String text) {}
  static final class MutablePost {
    final long id;
    final String title;
    final Map<Long, Comment> comments = new LinkedHashMap<>();
    MutablePost(long id, String title) { this.id = id; this.title = title; }
  }

  public static void main(String[] args) {
    List<Row> rows = List.of(
        new Row(1, "first", 10L, "hello"),
        new Row(1, "first", 10L, "hello"),
        new Row(1, "first", 11L, "world"),
        new Row(2, "second", null, null));
    Map<Long, MutablePost> posts = new LinkedHashMap<>();
    for (Row row : rows) {
      MutablePost post = posts.computeIfAbsent(row.postId(), id -> new MutablePost(id, row.title()));
      if (row.commentId() != null) post.comments.putIfAbsent(row.commentId(), new Comment(row.commentId(), row.commentText()));
    }
    MutablePost first = posts.get(1L);
    System.out.println("input-rows=" + rows.size());
    System.out.println("posts=" + posts.size());
    System.out.println("first-comments=" + first.comments.size());
    System.out.println("first-comment-ids=" + first.comments.keySet());
    System.out.println("second-comments=" + posts.get(2L).comments.size());
  }
}`, "input-rows=4\nposts=2\nfirst-comments=2\nfirst-comment-ids=[10, 11]\nsecond-comments=0", ["mybatis-sqlmap", "mybatis-result-map", "mybatis-result-mapping"] )],
    diagnostics: [
      d("LEFT JOIN 결과에 내용이 모두 null인 가짜 child 객체가 생깁니다.", "child existence를 primary id가 아니라 nullable field/객체 생성 여부로 판단했습니다.", ["child id mapping", "notNullColumn", "join projection", "all-null child rows"], "child의 non-null identity를 id mapping/notNullColumn 계약으로 사용하고 all-null row는 collection에 넣지 않습니다.", "부모만 존재하는 fixture와 nullable child fields fixture를 분리합니다."),
      d("큰 join에서 heap이 급증하고 부모가 중복됩니다.", "identity mappings/ordering이 없고 cartesian join row를 전부 독립 객체로 만들었습니다.", ["row count vs graph cardinality", "id mappings", "join multiplicity", "resultOrdered/order by"], "정확한 parent/child ids와 query shape를 고치고 필요한 경우 단계적 fetch 또는 bounded cursor 전략을 선택합니다.", "cardinality budget과 duplicate-id/load tests를 둡니다."),
    ],
    expertNotes: ["nested resultMap의 정확성은 SQL join cardinality와 identity mapping의 공동 책임입니다.", "두 개 이상의 to-many collection을 한 query로 join하면 cartesian amplification이 커지므로 query 분할을 성능/consistency와 함께 비교합니다."],
  },
  {
    id: "nested-select-n-plus-one-lazy-loading",
    title: "nested select의 N+1·lazy loading·session 수명을 구분합니다",
    lead: "association/collection의 select 속성은 mapping을 단순하게 보이게 하지만 부모 행마다 query가 추가될 수 있습니다.",
    explanations: [
      "nested select는 부모 column 값을 다른 mapped statement parameter로 전달해 child를 조회합니다. 부모 N개에 child query N개가 발생하는 N+1은 작은 개발 fixture에서는 보이지 않고 latency/connection load를 증폭합니다.",
      "lazy loading을 켜면 query 시점을 늦출 수 있지만 총 query 수를 줄이지 않으며 어떤 getter/toString/serialization이 load를 촉발하는지 proxy semantics를 알아야 합니다. session이 닫힌 뒤 접근 가능 여부도 configuration에 따라 검증합니다.",
      "join+nested result, batched IN query, 별도 repository 호출 중 선택은 cardinality, pagination, consistency snapshot, cache hit와 payload를 기준으로 합니다. 하나의 mapping feature를 모든 관계에 적용하지 않습니다.",
      "local cache는 같은 session/statement/parameter 재호출을 줄일 수 있지만 N개 서로 다른 key를 해결하지 않습니다. cache scope와 update flush behavior를 관측하고 stale data를 숨은 해결책으로 삼지 않습니다.",
      "query budget에는 root/child statement id별 count, total rows/bytes, elapsed와 max fan-out을 둡니다. raw parameter는 기록하지 않고 relation과 bounded cardinality만 추적합니다.",
    ],
    concepts: [
      c("nested select", "한 mapping 중 다른 mapped statement를 호출해 association/collection을 가져오는 방식입니다.", ["column 값을 parameter로 전달합니다.", "N+1 위험이 있습니다."]),
      c("N+1 query", "root query 한 번 뒤 각 결과마다 추가 query가 실행되어 총 1+N이 되는 패턴입니다.", ["query count/latency로 탐지합니다.", "batch/join 전략과 비교합니다."]),
      c("lazy loading", "nested property가 실제 접근될 때 query를 실행하도록 지연하는 proxy 기반 기능입니다.", ["총 비용을 자동 감소시키지 않습니다.", "session/serialization boundary를 주의합니다."]),
    ],
    diagnostics: [
      d("목록 API가 데이터가 늘수록 선형으로 느려지고 query가 폭증합니다.", "collection nested select가 각 부모마다 실행되는 N+1입니다.", ["statement count by id", "parent cardinality", "lazy trigger stack", "cache hit/scope"], "bounded IN batch 또는 join+nested result로 변경하고 pagination/cardinality를 함께 제한합니다.", "API별 query budget assertion과 production statement-count alert를 둡니다."),
      d("JSON 직렬화 중 DB query가 실행되거나 session closed 오류가 납니다.", "lazy proxy가 mapper/service 경계를 넘어 serializer getter에서 초기화됩니다.", ["lazy settings", "trigger methods", "session close timing", "serialized properties"], "service transaction 안에서 필요한 projection을 명시적으로 완성하고 persistence proxy를 API DTO로 노출하지 않습니다.", "session 종료 후 serialization test와 no-query serializer assertion을 둡니다."),
    ],
    expertNotes: ["lazy loading은 API 계약이 아니라 실행 시점 변경이므로 transaction과 observability 없이 켜면 장애 위치만 옮깁니다.", "N+1 해법은 항상 join이 아니며 fan-out과 pagination이 큰 경우 two-step batch가 더 예측 가능할 수 있습니다."],
  },
  {
    id: "discriminator-polymorphic-mapping",
    title: "discriminator와 상속 mapping을 제한된 다형성 계약으로 사용합니다",
    lead: "한 projection이 type code에 따라 다른 subtype을 만들 때 unknown code와 공통 mapping의 진화 정책이 필요합니다.",
    explanations: [
      "discriminator는 한 column 값을 읽어 case별 resultMap을 선택합니다. type code는 persisted schema의 일부이므로 enum TypeHandler와 마찬가지로 versioning, unknown handling과 producer/consumer 배포 순서를 설계합니다.",
      "공통 id/result를 base map에 두고 subtype map이 extends할 수 있지만 같은 property를 override할 때 최종 resolved mapping을 검토해야 합니다. 상속 깊이를 제한하고 subtype별 required projection을 test합니다.",
      "unknown discriminator를 base object로 조용히 만들면 subtype invariant와 authorization이 손실될 수 있습니다. stable error, Unknown subtype 또는 quarantine 중 product가 선택한 정책을 명시합니다.",
      "다형성 table 설계가 sparse nullable columns를 많이 만들면 mapping보다 schema 전략 문제가 큽니다. single-table, joined-table, separate-table과 explicit union projection을 migration/성능 관점에서 비교합니다.",
      "외부 입력이 subtype SQL/map id를 직접 선택하지 않게 합니다. DB의 검증된 code와 configuration의 fixed cases만 resultMap route가 되도록 유지합니다.",
    ],
    concepts: [
      c("discriminator", "한 result column 값에 따라 다른 resultMap/subtype mapping을 선택하는 요소입니다.", ["javaType/jdbcType/typeHandler를 가질 수 있습니다.", "case values를 명시합니다."]),
      c("polymorphic projection", "공통 columns와 subtype별 columns를 함께 반환해 여러 Java subtype으로 materialize하는 shape입니다.", ["unknown code를 처리합니다.", "subtype invariant를 검증합니다."]),
      c("mapping inheritance", "resultMap extends를 통해 공통 mappings를 재사용하는 기능입니다.", ["resolved override를 확인합니다.", "깊은 chain을 피합니다."]),
    ],
    diagnostics: [
      d("새 type code가 들어오자 base type으로 반환돼 subtype field가 사라집니다.", "discriminator unknown case의 명시적 정책 없이 fallback했습니다.", ["code distribution", "case mappings", "producer/consumer versions", "resolved subtype map"], "Unknown/error policy와 배포 순서를 정의하고 새 case/resultMap을 consumer-first로 배포합니다.", "old/new code compatibility와 unknown-code negative fixture를 둡니다."),
      d("extends한 resultMap에서 같은 property가 다른 column으로 채워집니다.", "base/subtype override를 resolved view 없이 수정했습니다.", ["extends chain", "duplicate properties", "resolved ResultMap", "subtype projection aliases"], "상속을 평탄화하거나 intentional override를 명시하고 startup resolved mapping diff를 review합니다.", "모든 subtype의 required property golden object test를 둡니다."),
    ],
    expertNotes: ["discriminator는 object-oriented 편의가 아니라 persisted type protocol이므로 schema governance가 필요합니다.", "복잡한 다형성은 mapper XML보다 database view나 explicit repository union으로 단순화할 수 있습니다."],
  },
  {
    id: "projection-schema-evolution",
    title: "projection·column alias·resultMap을 schema evolution 경계로 운영합니다",
    lead: "DB column rename/add/type change가 mapper를 조용히 깨뜨리지 않도록 schema와 application을 expand-contract 순서로 배포합니다.",
    explanations: [
      "explicit projection은 application이 요구하는 logical labels를 고정합니다. physical column rename 동안 old/new expressions를 view 또는 alias로 제공해 resultMap을 유지하고 양쪽 version이 공존하는 배포 창을 지원합니다.",
      "column 추가는 select * 자동 매핑과 unknown-column warning을 바꿀 수 있습니다. 제거/type change는 더 위험하므로 usage inventory, dual-read/dual-write와 backfill/readback을 포함한 expand-migrate-contract를 사용합니다.",
      "nullable→required 전환은 data backfill, DB constraint, mapper wrapper→non-null constructor 전환의 순서를 맞춥니다. application을 먼저 strict하게 만들면 old rows가 실패하고 DB를 먼저 strict하게 만들면 old writers가 실패할 수 있습니다.",
      "view와 stored query도 mapping dependency입니다. mapper XML만 search하지 말고 MappedStatement projection fingerprint와 database catalog/view lineage를 release manifest에 연결합니다.",
      "rollback은 old application이 new schema를 읽을 수 있어야 합니다. irreversible column drop/meaning change 전 backward compatibility window와 restore/reconciliation 계획을 둡니다.",
    ],
    concepts: [
      c("projection contract", "select가 반환할 logical column labels, JDBC types, nullability와 identity의 버전된 약속입니다.", ["resultMap과 함께 검증합니다.", "select *를 피합니다."]),
      c("expand-contract", "새/기존 application이 공존하도록 schema를 먼저 확장·이관한 뒤 구형 요소를 제거하는 배포법입니다.", ["rollback window를 둡니다.", "data readback이 필요합니다."]),
      c("projection fingerprint", "값을 제외한 statement의 labels/types/resultMap identity를 나타내는 안정 증거입니다.", ["schema drift를 탐지합니다.", "PII를 포함하지 않습니다."]),
    ],
    diagnostics: [
      d("무중단 column rename 뒤 일부 pod만 field가 null입니다.", "old/new application과 schema compatibility window 없이 한 번에 rename했습니다.", ["pod versions", "actual projection labels", "resultMap versions", "view/alias availability"], "expand alias/view 또는 dual projection을 제공하고 consumers 전환 후 old column을 contract합니다.", "old/new binary×schema compatibility matrix와 rollback test를 둡니다."),
      d("column 추가만 했는데 unknown-column warning/error가 발생합니다.", "select *와 strict auto-mapping이 schema addition을 application contract에 자동 유입했습니다.", ["projection text", "autoMappingUnknownColumnBehavior", "new label", "resultMap explicit mappings"], "필요 columns만 명시하고 unknown policy를 의도적으로 설정하며 projection fingerprint를 갱신합니다.", "migration CI에서 affected mapped statements와 label diff를 계산합니다."),
    ],
    expertNotes: ["resultMap은 schema version adapter로 사용할 수 있지만 양방향 writer compatibility와 data migration까지 대신하지 않습니다.", "migration review에 mapper/resultMap owner를 포함하면 DB와 application 팀 사이의 silent gap을 줄일 수 있습니다."],
  },
  {
    id: "cursor-resulthandler-memory-ownership",
    title: "List·Cursor·ResultHandler의 memory와 resource ownership을 설계합니다",
    lead: "매핑이 정확해도 수백만 행을 List로 materialize하면 heap과 transaction/connection lifetime이 운영 한계를 넘습니다.",
    explanations: [
      "selectList는 결과를 collection으로 materialize하기 편하지만 row count가 unbounded이면 heap과 GC를 압박합니다. DB predicate, pagination/limit와 application maximum을 먼저 둡니다.",
      "Cursor는 lazy Iterator이면서 Closeable/AutoCloseable resource입니다. SqlSession/transaction/Connection이 cursor 소비가 끝날 때까지 살아 있어야 하므로 service 밖으로 무제한 escape시키지 않고 try-with-resources와 cancellation을 적용합니다.",
      "ResultHandler는 row마다 처리할 수 있지만 공식 문서가 설명하듯 advanced resultMap에서 완전히 조립되지 않은 object를 받을 가능성과 cache limitations를 고려합니다. aggregation이 필요한 graph에는 함부로 사용하지 않습니다.",
      "fetchSize는 driver hint이며 streaming 동작은 DB/driver/autocommit/resultSetType에 따라 다릅니다. heap이 줄었다는 JDK model만으로 결론내리지 않고 actual driver에서 network buffers, fetch calls와 transaction impact를 측정합니다.",
      "export/background job은 checkpoint, bounded queue/backpressure, deadline/cancel, partial artifact cleanup과 retry idempotency를 포함합니다. row values를 progress log에 남기지 않고 processed count와 cursor state만 기록합니다.",
    ],
    concepts: [
      c("Cursor", "MyBatis가 lazy fetch를 제공하는 Closeable Iterable 결과입니다.", ["session/connection lifetime에 묶입니다.", "완전 소비 여부를 확인할 수 있습니다."]),
      c("ResultHandler", "각 result object를 callback으로 전달받아 처리하는 Java API입니다.", ["대량 처리에 쓸 수 있습니다.", "advanced graph completeness를 주의합니다."]),
      c("materialization budget", "한 query가 memory에 만들 수 있는 rows/objects/bytes와 유지 시간을 제한한 운영 계약입니다.", ["cardinality guard가 필요합니다.", "load test로 산정합니다."]),
    ],
    diagnostics: [
      d("대량 export 중 heap OOM 또는 connection 장기 점유가 발생합니다.", "unbounded selectList 또는 느린 cursor consumer에 cardinality/deadline/backpressure가 없습니다.", ["rows/heap/object count", "cursor/connection duration", "consumer throughput", "fetchSize/driver mode"], "DB-side bounds와 cursor lexical ownership, bounded buffering/deadline/checkpoint를 적용합니다.", "최대 cardinality load/cancel/leak test와 connection hold SLO를 둡니다."),
      d("Cursor를 controller에 반환한 뒤 이미 닫혔다고 실패합니다.", "SqlSession/transaction이 service method 종료 때 닫혔지만 lazy result를 밖으로 넘겼습니다.", ["cursor creation/consumption scope", "transaction proxy boundary", "session close trace", "serialization timing"], "transaction 안에서 소비해 DTO/streamed response contract로 변환하거나 명시적 resource owner를 end-to-end로 유지합니다.", "scope 종료 후 access negative test와 early client disconnect cleanup test를 둡니다."),
    ],
    expertNotes: ["streaming은 메모리 문제를 connection/transaction 시간 문제로 바꾸므로 두 budget을 동시에 관리합니다.", "ResultHandler의 callback object completeness와 nested mapping 제한은 실제 statement graph에서 검증해야 합니다."],
  },
  {
    id: "mapping-validation-testing-observability",
    title: "startup inventory·schema fixture·safe telemetry로 mapping을 지속 검증합니다",
    lead: "mapper XML parse 성공만으로 실제 column labels, type conversions, graph cardinality와 resource cleanup은 증명되지 않습니다.",
    explanations: [
      "startup에는 MappedStatement→ResultMap ids, result type, mapped columns/properties, id mappings, nested references와 handler classes를 값 없이 inventory합니다. broken reference, duplicate statement와 unexpected auto-mapping policy를 첫 요청 전에 실패시킵니다.",
      "unit test는 naming/constructor/type handler/graph folding을 빠르게 검증하고, integration test는 실제 migration을 적용한 target DB에서 projection metadata와 golden objects를 확인합니다. mock ResultSet만으로 driver label/type behavior를 증명하지 않습니다.",
      "fixture는 NULL/empty/Unicode/precision/timezone/unknown enum, parent-only, duplicate join, multiple children, schema rename와 large cardinality를 포함합니다. expected JSON snapshot에는 secret/PII가 아닌 synthetic values만 둡니다.",
      "telemetry에는 statement/resultMap id, rows, graph cardinality, mapping stage/error category, elapsed와 JDK/MyBatis/driver/schema version을 남깁니다. raw SQL/row value와 object toString은 기본적으로 기록하지 않습니다.",
      "upgrade는 MyBatis/JDK/driver/DB version matrix에서 auto-mapping, constructor selection, handler registry, nested graph, cursor close와 errors를 canary합니다. mismatch 시 application/mapper generation을 함께 rollback합니다.",
    ],
    concepts: [
      c("mapping inventory", "등록 statement와 resultMap/property/id/handler/nested reference의 secret-free startup 목록입니다.", ["broken wiring을 fail-fast합니다.", "release diff로 비교합니다."]),
      c("golden object fixture", "synthetic DB rows가 기대 객체/graph로 변환되는지를 고정한 integration evidence입니다.", ["schema migration을 적용합니다.", "edge values를 포함합니다."]),
      c("safe mapping telemetry", "row 값을 제외하고 mapping identity·cardinality·stage·version·outcome을 기록한 관측 정보입니다.", ["diagnostics를 지원합니다.", "PII를 노출하지 않습니다."]),
    ],
    codeExamples: [java("mybatis04-contract-audit", "projection-resultMap 계약 감사", "MyBatis04ContractAudit.java", "projection labels와 mapping specs에서 duplicate label, missing required mapping과 unknown column을 stable category로 검출합니다.", String.raw`import java.util.*;

public class MyBatis04ContractAudit {
  record Mapping(String column, String property, boolean required) {}

  static List<String> audit(List<String> labels, List<Mapping> mappings) {
    List<String> issues = new ArrayList<>();
    Set<String> seen = new HashSet<>();
    for (String label : labels) if (!seen.add(label)) issues.add("duplicate-label:" + label);
    Set<String> labelSet = new HashSet<>(labels);
    for (Mapping mapping : mappings) if (mapping.required() && !labelSet.contains(mapping.column())) issues.add("missing-required:" + mapping.column());
    Set<String> mapped = new HashSet<>();
    mappings.forEach(mapping -> mapped.add(mapping.column()));
    for (String label : seen) if (!mapped.contains(label)) issues.add("unknown-column:" + label);
    return issues.stream().sorted().toList();
  }

  public static void main(String[] args) {
    List<Mapping> mappings = List.of(
        new Mapping("post_id", "id", true),
        new Mapping("post_title", "title", true));
    System.out.println("valid=" + audit(List.of("post_id", "post_title"), mappings));
    List<String> issues = audit(List.of("post_id", "post_id", "extra_label"), mappings);
    System.out.println("issue-count=" + issues.size());
    System.out.println("issues=" + issues);
    System.out.println("safe-evidence=labels,mapping-ids,issue-categories");
  }
}`, "valid=[]\nissue-count=3\nissues=[duplicate-label:post_id, missing-required:post_title, unknown-column:extra_label]\nsafe-evidence=labels,mapping-ids,issue-categories", ["mybatis-mapped-statement", "mybatis-result-map", "java-result-set"] )],
    diagnostics: [
      d("mapper XML은 parse되지만 첫 production row에서 mapping failure가 납니다.", "startup은 metadata reference만 확인하고 실제 schema/type/NULL fixture를 실행하지 않았습니다.", ["startup inventory", "migration/schema version", "actual column metadata", "edge-row integration coverage"], "target DB에 migration을 적용한 smoke query와 synthetic golden rows를 release gate로 실행합니다.", "statement별 minimal/edge fixture coverage와 schema fingerprint diff를 관리합니다."),
      d("mapping 오류 log에 전체 row/VO와 민감 본문이 노출됩니다.", "exception context로 ResultSet/object toString을 raw 기록했습니다.", ["mapper interceptor/APM", "exception rendering", "row/object logs", "retention/access"], "statement/resultMap id, labels/types/count, stage와 safe code만 allow-list로 남기고 노출 data를 삭제/통제합니다.", "synthetic PII canary와 telemetry schema validation을 둡니다."),
    ],
    expertNotes: ["mapping contract test는 SQL query가 성공하는지만 보지 말고 객체 invariant와 graph cardinality를 assert합니다.", "운영에서 statement id와 resultMap generation/version을 연결하면 mapper hotfix와 schema drift 상관관계를 빠르게 찾을 수 있습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-freeboard-mapper", repository: "SPRING/MyWeb", path: "src/main/resources/sqlmap/FreeBoardMapper.xml", usedFor: ["resultType alias, board list/detail projection, dynamic filters and CRUD structural provenance"], evidence: "read-only로 85 lines/2,977 bytes를 확인했으며 namespace·SQL body·literal data는 예제에 복사하지 않았습니다." },
  { id: "local-freeboard-vo", repository: "SPRING/MyWeb", path: "src/main/java/com/team404/command/FreeBoardVO.java", usedFor: ["scalar property and timestamp VO shape provenance"], evidence: "read-only로 15 lines/308 bytes를 확인했으며 package/source body는 복사하지 않았습니다." },
  { id: "mybatis-sqlmap", repository: "MyBatis 3 Documentation", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["resultType/resultMap, auto-mapping, constructor, association, collection and discriminator semantics"], evidence: "MyBatis 공식 Mapper XML reference 3.5.19입니다." },
  { id: "mybatis-configuration", repository: "MyBatis 3 Documentation", path: "Configuration", publicUrl: "https://mybatis.org/mybatis-3/configuration.html", usedFor: ["mapUnderscoreToCamelCase, auto mapping, type handler and object factory settings"], evidence: "MyBatis 공식 configuration reference입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Documentation", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["selectOne/list/map/cursor/result handler and session resource contracts"], evidence: "MyBatis 공식 Java API reference입니다." },
  { id: "mybatis-result-map", repository: "MyBatis 3 API", path: "ResultMap", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/ResultMap.html", usedFor: ["resolved result map identity, mappings and nested flags"], evidence: "MyBatis 공식 ResultMap API 3.5.19입니다." },
  { id: "mybatis-result-mapping", repository: "MyBatis 3 API", path: "ResultMapping", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/ResultMapping.html", usedFor: ["column/property/type handler/flags/notNull/columnPrefix metadata"], evidence: "MyBatis 공식 ResultMapping API 3.5.19입니다." },
  { id: "mybatis-mapped-statement", repository: "MyBatis 3 API", path: "MappedStatement", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/MappedStatement.html", usedFor: ["statement-resultMap inventory and result ordering/sets metadata"], evidence: "MyBatis 공식 MappedStatement API 3.5.19입니다." },
  { id: "mybatis-type-handler", repository: "MyBatis 3 API", path: "TypeHandler", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/type/TypeHandler.html", usedFor: ["JDBC parameter/result conversion contract"], evidence: "MyBatis 공식 TypeHandler API 3.5.19입니다." },
  { id: "mybatis-object-factory", repository: "MyBatis 3 API", path: "ObjectFactory", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/reflection/factory/ObjectFactory.html", usedFor: ["object and collection construction boundary"], evidence: "MyBatis 공식 ObjectFactory API 3.5.19입니다." },
  { id: "mybatis-auto-mapping", repository: "MyBatis 3 API", path: "AutoMappingBehavior", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/session/AutoMappingBehavior.html", usedFor: ["NONE/PARTIAL/FULL automatic mapping policy"], evidence: "MyBatis 공식 AutoMappingBehavior API 3.5.19입니다." },
  { id: "mybatis-result-handler", repository: "MyBatis 3 API", path: "ResultHandler", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/session/ResultHandler.html", usedFor: ["per-result callback processing and limitations"], evidence: "MyBatis 공식 ResultHandler API 3.5.19입니다." },
  { id: "mybatis-cursor", repository: "MyBatis 3 API", path: "Cursor", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/cursor/Cursor.html", usedFor: ["lazy iterator, close and resultOrdered collection contract"], evidence: "MyBatis 공식 Cursor API 3.5.19입니다." },
  { id: "java-result-set", repository: "Java SE 21 API", path: "java.sql.ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["column labels, JDBC getters, NULL and resource contract"], evidence: "Oracle JDK 공식 ResultSet API입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-04-resulttype-resultmap", slug: "mybatis-04-resulttype-resultmap", courseId: "spring", moduleId: "mybatis-mapping", order: 4,
  title: "resultType·resultMap과 컬럼-객체 매핑", subtitle: "ResultSet column label을 불변 객체·TypeHandler·nested identity graph로 안전하게 변환하고 schema drift·N+1·cursor ownership까지 검증합니다.", level: "중급", estimatedMinutes: 940,
  coreQuestion: "select projection의 column labels/types/nullability/cardinality가 의도한 Java 객체와 관계 graph로 정확히 매핑됐음을 어떻게 설명하고 지속 검증할까요?",
  summary: "MyWeb의 FreeBoard mapper와 VO를 read-only로 감사해 resultType alias, scalar board/timestamp shape와 목록·상세 projection을 구조 provenance로 사용합니다. 선행 `mybatis-03-parameter-binding`의 안전한 입력 실행에서 이어져 mapping pipeline, resultType 자동 매핑/alias/camel-case, explicit resultMap id/result, immutable constructor/record, SQL NULL·TypeHandler round-trip, association/collection identity graph, nested select N+1/lazy scope, discriminator, schema expand-contract, Cursor/ResultHandler memory ownership과 startup/integration/telemetry governance까지 독립적으로 이해하도록 구성합니다. 여섯 JDK 21 examples는 자동·명시·constructor·type handler·nested graph와 projection audit를 실제 실행하고, 실제 MyBatis/driver 증명 범위를 분리합니다.",
  objectives: ["ResultSet→ResultMap/TypeHandler/ObjectFactory→객체 pipeline을 설명한다.", "resultType 자동 매핑과 alias/camel-case/unknown-column 정책을 통제한다.", "id/result/constructor mappings로 identity와 required invariant를 명시한다.", "NULL·enum·time·numeric TypeHandler round-trip을 검증한다.", "association/collection join rows를 parent/child identity로 deduplicate한다.", "nested select N+1, lazy loading과 Cursor/session ownership을 진단한다.", "projection/resultMap을 schema evolution과 safe observability release gate로 운영한다."],
  prerequisites: [{ title: "#{} 파라미터 바인딩과 ${} 치환의 위험", reason: "입력 값을 안전한 PreparedStatement parameter로 전달한 뒤 반환 ResultSet을 객체로 변환하는 출력 경계를 이어서 학습합니다.", sessionSlug: "mybatis-03-parameter-binding" }],
  keywords: ["resultType", "resultMap", "column alias", "auto mapping", "mapUnderscoreToCamelCase", "constructor", "TypeHandler", "association", "collection", "nested select", "N+1", "discriminator", "Cursor", "ResultHandler", "schema evolution"], topics,
  lab: {
    title: "게시판 projection을 explicit·immutable·nested graph mapping contract로 재설계하기",
    scenario: "legacy mapper는 select *와 resultType 자동 매핑에 의존하며 nullable timestamps, join comment graph, schema rename와 대량 export 요구가 추가되었습니다.",
    setup: ["두 원본은 read-only provenance로 보존하고 namespace/SQL/body data를 공개 예제에 복사하지 않습니다.", "JDK 21 deterministic harness와 별도로 supported MyBatis/JDK/driver/MySQL·Oracle ephemeral schemas를 준비합니다.", "statement별 projection labels/JDBC types/nullability, resultMap property/id/constructor/handler/nested cardinality 표를 작성합니다.", "synthetic ordinary/NULL/Unicode/time/unknown enum/parent-only/duplicate join/large cardinality fixture를 고정합니다."],
    steps: ["모든 select *를 필요한 logical projection labels로 바꾸고 duplicate labels를 제거합니다.", "단순 scalar query의 resultType 자동 mapping과 effective naming/unknown policy를 readback합니다.", "required/identity fields를 explicit id/result mappings로 옮기고 resolved ResultMap inventory를 만듭니다.", "불변 persistence record의 canonical constructor와 NULL invariant를 mapping합니다.", "enum/time/decimal custom handler의 Java→DB→Java round-trip과 unknown/overflow를 검증합니다.", "parent-child join에 prefix/id/not-null 계약을 적용하고 duplicate/NULL child graph를 확인합니다.", "nested select statement count를 측정해 N+1을 bounded join/IN batch와 비교합니다.", "schema column rename/nullability 변경을 old/new binary와 expand-contract matrix에서 실행합니다.", "List/Cursor/ResultHandler의 heap, rows, connection duration, cancel/close를 부하·failure test합니다.", "statement/resultMap id, labels/types/count/cardinality/stage만 남기는 safe telemetry와 canary rollback을 rehearsal합니다."],
    expectedResult: ["projection label과 resultMap property/id/constructor/type contract가 startup inventory와 실제 metadata에서 일치합니다.", "NULL·time·enum·numeric values가 의미 손실 없이 round-trip하거나 stable mapping error로 실패합니다.", "nested graph의 parent/child cardinality와 deduplication이 golden fixture와 같습니다.", "N+1과 large materialization이 query/memory/connection budgets 안에서 통제됩니다.", "schema/driver/MyBatis upgrade matrix와 logs에 silent mapping loss나 raw row/PII가 없습니다."],
    cleanup: ["ephemeral schemas, views, rows, cursor/export artifacts와 test identities를 제거합니다.", "test sessions/connections/cursors를 닫고 pool active baseline을 확인합니다.", "traces/logs/snapshots에서 raw row/body와 synthetic canary data가 없는지 검사 후 삭제합니다.", "원본 mapper/VO와 production schema/data는 변경하지 않습니다."],
    extensions: ["mapping metadata에서 projection/resultMap compatibility report를 생성합니다.", "two-collection cartesian amplification을 two-step batch와 benchmark합니다.", "record/Kotlin/Lombok constructor mapping artifact matrix를 추가합니다.", "schema registry와 MappedStatement projection fingerprint를 migration CI에 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행해 row→property→object/graph mapping 증거를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "label→camel property 변환과 unknown을 찾습니다.", "required explicit mapping 누락을 재현합니다.", "constructor invariant와 unknown enum을 구분합니다.", "join duplicate/NULL child가 graph에 미치는 영향을 설명합니다.", "projection audit 세 issue category를 추적합니다."], hints: ["SQL 값보다 labels, ids, types, nullability와 object cardinality를 먼저 표로 만드세요."], expectedOutcome: "단순 scalar부터 nested graph까지 mapping pipeline을 독립적으로 진단합니다.", solutionOutline: ["project→label→resolve map→convert→construct→aggregate→validate→close 순서입니다."] },
    { difficulty: "응용", prompt: "원본 resultType 게시판 mapper를 production resultMap으로 재설계하세요.", requirements: ["원본은 structural provenance로만 기록합니다.", "explicit projection/alias와 id/result mappings를 둡니다.", "immutable DTO와 nullable/time handler를 설계합니다.", "association/collection identity와 columnPrefix를 적용합니다.", "N+1/query budget을 측정합니다.", "schema rename expand-contract를 검증합니다.", "Cursor/list cardinality/resource budget을 둡니다.", "safe mapping telemetry와 actual DB matrix를 실행합니다."], hints: ["resultMap XML만 쓰지 말고 SQL join cardinality와 object invariant를 함께 고정하세요."], expectedOutcome: "schema drift와 관계 cardinality에도 예측 가능한 게시판 mapping layer가 완성됩니다.", solutionOutline: ["audit→projection→explicit map→types→graph→budget→migration→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 MyBatis result mapping governance와 release gate를 작성하세요.", requirements: ["resultType 허용 기준과 explicit resultMap 기준을 둡니다.", "naming/unknown/duplicate label policy를 지정합니다.", "constructor/NULL/TypeHandler round-trip을 요구합니다.", "nested id/prefix/cardinality/N+1 budgets를 둡니다.", "discriminator unknown/version policy를 둡니다.", "projection expand-contract와 rollback matrix를 정의합니다.", "List/Cursor/ResultHandler ownership을 지정합니다.", "startup inventory, target DB fixture와 safe telemetry를 요구합니다."], hints: ["매핑 성공 여부가 아니라 객체 invariant와 graph cardinality를 운영 SLO로 표현하세요."], expectedOutcome: "DB projection부터 domain object와 upgrade까지 일관된 mapping 표준이 완성됩니다.", solutionOutline: ["inventory→name→identify→convert→construct→aggregate→bound→evolve→observe 순서입니다."] },
  ],
  nextSessions: ["mybatis-05-crud-generated-key"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["FreeBoardMapper.xml은 read-only로 85 lines/2,977 bytes를 확인했고 SHA-256은 8AD759E27411EBEE8BC12BDE155CFE719D7C6A60979F629D78DCF9C06535B2DA입니다.", "FreeBoardVO.java는 read-only로 15 lines/308 bytes를 확인했고 SHA-256은 D941D10BF1B87832ED7F3093EB592FE8740A85905D4A8F126161E8C25B3B10C8입니다.", "원본 namespace/package/SQL body와 application data는 복사하지 않고 resultType·scalar/timestamp property structure만 provenance로 사용했습니다.", "JDK-only examples는 실제 MyBatis auto-mapping, reflection, handler registry, driver label/type, nested graph, cache와 cursor behavior를 대체하지 않습니다."] },
});

export default session;
