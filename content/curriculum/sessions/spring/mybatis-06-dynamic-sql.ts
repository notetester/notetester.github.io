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
      { lines: `1-${first}`, explanation: "JDK 21 record·enum·collection만으로 MyBatis parameter object와 동적 node가 만들 SQL fragment/parameter model을 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "if·choose·where/trim·set·foreach·bind의 핵심 규칙을 값 연결 없이 deterministic builder로 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "최종 SQL shape, marker/count, rejected empty/unknown branch와 shape cardinality만 출력해 실제 BoundSql 통합 검증 기준을 만듭니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 MyBatis jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "교육용 builder는 MyBatis OGNL/SqlNode/XMLLanguageDriver 구현이 아니므로 actual BoundSql, parameter mappings와 target DB plan/result를 별도로 검증합니다."] },
    experiments: [
      { change: "null/blank/empty/max+1/unknown sort와 모든 optional condition 조합을 입력합니다.", prediction: "승인된 SQL shapes와 bind markers만 생성되고 빈/위험 구조는 stable validation error로 실패합니다.", result: "canonical SQL fingerprint, parameter mapping count/order와 no-unbounded-write invariant를 비교합니다." },
      { change: "동일 mapper를 실제 MyBatis와 supported MySQL/Oracle schemas에서 실행합니다.", prediction: "OGNL truthiness와 dialect 차이를 승인한 범위 외에는 rows/counts와 BoundSql shape가 같습니다.", result: "MappedStatement/BoundSql inventory, prepared parameters, plans, persisted state와 resource cleanup을 readback합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "dynamic-sql-render-pipeline",
    title: "동적 SQL을 parameter object→SqlNode→BoundSql→PreparedStatement pipeline으로 봅니다",
    lead: "동적 태그는 DB가 실행 중 이해하는 문법이 아니라 MyBatis가 실행 전에 하나의 SQL text와 ordered parameter mappings로 렌더링하는 과정입니다.",
    explanations: [
      "선행 `mybatis-05-crud-generated-key`에서는 고정 CRUD statement의 count, key와 transaction outcome을 다뤘습니다. 이번 세션은 같은 write/read 계약을 유지하면서 parameter state에 따라 SQL 구조가 달라질 때 최종 구조를 통제합니다.",
      "XMLLanguageDriver가 mapper script를 SqlSource/SqlNode tree로 만들고 execution 시 DynamicContext와 OGNL expression을 평가해 BoundSql을 생성합니다. BoundSql에는 최종 SQL, parameter mappings, parameter object와 additional parameters가 있습니다.",
      "원본 BoardMapper.xml은 게시판 목록의 bounded pagination binds, optional file column value를 choose로 선택하고 reply level predicate에 CDATA를 사용합니다. 실제 namespace/SQL/property를 복사하지 않고 choose·bind·branch 구조와 개선점만 provenance로 사용합니다.",
      "dynamic SQL의 correctness는 XML이 parse된다는 사실이 아니라 모든 입력 class가 syntactically valid, authorized, bounded SQL shape와 정확한 parameter count/order를 만든다는 뜻입니다.",
      "render와 execute를 분리해 진단합니다. expression/property 오류는 render 단계, SQL syntax/dialect는 prepare/execute 단계, wrong rows/count는 semantic/transaction 단계입니다. 각 stage에 stable error와 no-secret evidence를 둡니다.",
    ],
    concepts: [
      c("dynamic SQL", "parameter state에 따라 SQL fragments와 parameter mappings를 조합해 최종 statement를 만드는 기능입니다.", ["DB 실행 전에 렌더링됩니다.", "허용 shape를 제한합니다."]),
      c("SqlNode", "if/choose/foreach/trim/text 등 dynamic script의 실행 tree node를 나타내는 MyBatis 내부 contract입니다.", ["DynamicContext에 SQL/bindings를 추가합니다.", "공식 API version을 확인합니다."]),
      c("BoundSql", "렌더링된 SQL text와 ordered ParameterMapping/additional parameter를 담는 실행 직전 객체입니다.", ["값과 shape 검증의 evidence입니다.", "raw parameter는 log하지 않습니다."]),
    ],
    diagnostics: [
      d("mapper XML은 startup에 parse되지만 특정 요청에서만 syntax error가 납니다.", "실행 시 선택되는 dynamic branch 조합을 boot test가 포함하지 않았습니다.", ["parameter class", "evaluated branch ids", "BoundSql normalized shape", "parameter mapping count/order"], "허용 parameter equivalence classes를 열거해 BoundSql snapshot과 target DB prepare tests를 실행합니다.", "branch/pairwise/property-based shape coverage를 release gate로 둡니다."),
      d("오류 log에 전체 parameter object와 SQL literals가 노출됩니다.", "render diagnostics가 DynamicContext/BoundSql/DTO를 raw stringify했습니다.", ["MyBatis logging/interceptors", "exception rendering", "APM attributes", "retention/access"], "statement id, shape fingerprint, branch ids, marker/type/count와 stage만 allow-list로 기록합니다.", "synthetic PII/secret canary와 telemetry schema test를 둡니다."),
    ],
    expertNotes: ["동적 mapper review의 최종 산출물은 XML tag 목록이 아니라 허용된 canonical BoundSql shape 집합입니다.", "OGNL expression evaluation과 SQL parameter binding은 서로 다른 신뢰 경계이므로 expression에서 method/structure 접근을 최소화합니다."],
  },
  {
    id: "if-optional-predicates-truthiness",
    title: "if로 optional predicate를 추가할 때 null·blank·0의 의미를 분리합니다",
    lead: "`test`가 false이면 fragment가 사라지므로 Java/OGNL truthiness를 product의 filter presence와 같다고 가정하면 잘못된 전체 조회가 생깁니다.",
    explanations: [
      "`<if test=\"...\">`는 OGNL expression이 true일 때 child SQL을 추가합니다. parameter property 이름, getter, Map key와 null-safe expression을 startup/fixture에서 검증합니다.",
      "문자열 검색은 null, empty, blank를 API normalization 단계에서 명확히 합니다. mapper expression에 trim/복잡한 domain validation을 숨기기보다 typed SearchCriteria가 presence를 나타내게 합니다.",
      "숫자 0과 boolean false는 유효한 filter 값일 수 있습니다. 단순 truthiness에 맡기지 않고 null 여부 또는 explicit presence flag로 조건을 선택합니다.",
      "여러 독립 if는 모두 true가 될 수 있습니다. AND predicates라면 의도일 수 있지만 mutually exclusive search modes는 choose가 더 정확합니다. 각 조합의 expected rows/cardinality를 표로 만듭니다.",
      "optional predicate가 모두 빠진 경우 read는 bounded default/page만 허용하고 update/delete는 fail-closed합니다. mapper `<where>`가 빈 문자열을 만들 수 있다는 사실을 service authorization/guard가 보완해야 합니다.",
    ],
    concepts: [
      c("optional predicate", "filter 값이 제공된 경우에만 WHERE에 추가되는 조건입니다.", ["presence semantics를 정의합니다.", "값은 #{}로 bind합니다."]),
      c("OGNL test", "parameter object/property를 평가해 dynamic node 포함 여부를 결정하는 expression입니다.", ["null/property 오류를 검증합니다.", "복잡한 business logic을 피합니다."]),
      c("fail-closed write", "허용 scope/predicate가 없거나 불명확하면 UPDATE/DELETE를 생성·실행하지 않는 정책입니다.", ["전체 table mutation을 차단합니다.", "service와 mapper 양쪽 guard를 둡니다."]),
    ],
    codeExamples: [java("mybatis06-if-where", "optional if predicates와 bounded WHERE", "MyBatis06IfWhere.java", "typed criteria에서 제공된 조건만 AND로 조립하고 값은 marker/count로 분리합니다.", String.raw`import java.util.*;

public class MyBatis06IfWhere {
  record Criteria(String title, String author, Boolean active, int limit) {}
  record Rendered(String sql, int parameterCount) {}

  static Rendered render(Criteria criteria) {
    if (criteria.limit() < 1 || criteria.limit() > 100) throw new IllegalArgumentException("limit-out-of-range");
    List<String> predicates = new ArrayList<>();
    int binds = 0;
    if (criteria.title() != null && !criteria.title().isBlank()) { predicates.add("title = ?"); binds++; }
    if (criteria.author() != null && !criteria.author().isBlank()) { predicates.add("author = ?"); binds++; }
    if (criteria.active() != null) { predicates.add("active = ?"); binds++; }
    String where = predicates.isEmpty() ? "" : " WHERE " + String.join(" AND ", predicates);
    return new Rendered("SELECT post_id, title FROM post" + where + " ORDER BY post_id DESC LIMIT ?", binds + 1);
  }

  public static void main(String[] args) {
    Rendered filtered = render(new Criteria("guide", null, false, 20));
    Rendered bounded = render(new Criteria(" ", null, null, 20));
    System.out.println("filtered-sql=" + filtered.sql());
    System.out.println("filtered-binds=" + filtered.parameterCount());
    System.out.println("bounded-sql=" + bounded.sql());
    System.out.println("bounded-binds=" + bounded.parameterCount());
    try { render(new Criteria(null, null, null, 0)); }
    catch (IllegalArgumentException e) { System.out.println("invalid=" + e.getMessage()); }
  }
}`, "filtered-sql=SELECT post_id, title FROM post WHERE title = ? AND active = ? ORDER BY post_id DESC LIMIT ?\nfiltered-binds=3\nbounded-sql=SELECT post_id, title FROM post ORDER BY post_id DESC LIMIT ?\nbounded-binds=1\ninvalid=limit-out-of-range", ["mybatis-dynamic-sql", "mybatis-if-node", "mybatis-bound-sql"] )],
    diagnostics: [
      d("active=false 또는 numeric=0 filter가 사라집니다.", "boolean/numeric 값을 presence가 아닌 truthiness로 평가했습니다.", ["OGNL test expression", "parameter Java type", "request normalization", "BoundSql predicates"], "nullable wrapper/explicit presence를 사용해 `!= null`로 분기하고 false/0을 bind합니다.", "null/false/true와 null/0/nonzero truth-table fixtures를 둡니다."),
      d("검색어가 blank일 때 수백만 행 전체 조회가 실행됩니다.", "빈 optional filters에 bounded default/cardinality guard가 없습니다.", ["normalized criteria", "WHERE presence", "limit/page predicate", "estimated/actual rows"], "blank를 absent로 normalize하고 항상 limit/tenant/active scope를 유지하며 maximum rows를 둡니다.", "empty/null/blank criteria load test와 unbounded-shape rejection을 둡니다."),
    ],
    expertNotes: ["if expression이 간단할수록 parameter DTO가 domain 의미를 잘 표현해야 합니다.", "read의 empty condition과 write의 empty condition은 위험도가 달라 서로 다른 render/guard contract를 사용합니다."],
  },
  {
    id: "choose-when-otherwise-exclusive",
    title: "choose·when·otherwise로 정확히 한 search/write branch를 선택합니다",
    lead: "여러 조건 중 하나만 허용해야 할 때 독립 if를 나열하면 둘 이상이 동시에 붙거나 아무 조건도 없이 실행될 수 있습니다.",
    explanations: [
      "`<choose>`는 위에서부터 참인 첫 `<when>` 하나만 적용하고 없으면 `<otherwise>`를 적용합니다. Java switch/if-else chain과 비슷한 exclusive selection입니다.",
      "searchType 같은 외부 문자열은 controller/service에서 enum으로 parse하고 mapper에는 제한된 value만 전달합니다. otherwise가 전체 조회를 의미하는지 rejection/default scope인지 product contract로 정합니다.",
      "원본 mapper의 optional file-name 값 choose는 column/value shape를 항상 완성하는 학습 사례입니다. 그러나 null과 blank, 허용 extension/storage lifecycle은 mapper 밖 validation에서 처리해야 합니다.",
      "when order가 겹치면 앞 branch가 뒤를 가립니다. expression을 mutually exclusive하게 만들거나 route enum을 사용하고 shadowed/unreachable branches를 test coverage로 탐지합니다.",
      "otherwise에 `1=1`을 넣는 습관은 write에서 특히 위험합니다. 안전한 default predicate 또는 stable validation error를 선택하고 모든 branch에 tenant/authorization 조건을 공통 적용합니다.",
    ],
    concepts: [
      c("choose", "여러 when 중 첫 true branch 하나 또는 otherwise를 적용하는 dynamic node입니다.", ["exclusive selection입니다.", "branch order가 의미 있습니다."]),
      c("otherwise", "어떤 when도 true가 아닐 때 선택되는 fallback fragment입니다.", ["전체 조회/수정을 자동 허용하지 않습니다.", "safe default 또는 rejection을 둡니다."]),
      c("branch shadowing", "넓은 earlier condition이 더 구체적인 later condition을 항상 가려 실행 불가능하게 만드는 문제입니다.", ["truth table로 탐지합니다.", "enum routing을 선호합니다."]),
    ],
    codeExamples: [java("mybatis06-choose", "exclusive search branch 선택", "MyBatis06Choose.java", "enum mode를 하나의 고정 predicate와 parameter count로 map하고 unknown external key를 mapper 전에 거부합니다.", String.raw`import java.util.*;

public class MyBatis06Choose {
  enum Mode { TITLE, AUTHOR, TITLE_OR_BODY;
    static Mode parse(String value) {
      return switch (value) {
        case "title" -> TITLE;
        case "author" -> AUTHOR;
        case "text" -> TITLE_OR_BODY;
        default -> throw new IllegalArgumentException("search-mode-not-allowed");
      };
    }
  }
  record Branch(String predicate, int binds) {}
  static Branch choose(Mode mode) {
    return switch (mode) {
      case TITLE -> new Branch("title LIKE ? ESCAPE '\\'", 1);
      case AUTHOR -> new Branch("author = ?", 1);
      case TITLE_OR_BODY -> new Branch("(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')", 2);
    };
  }

  public static void main(String[] args) {
    for (String key : List.of("title", "author", "text")) {
      Branch branch = choose(Mode.parse(key));
      System.out.println(key + "=" + branch.predicate() + "|binds=" + branch.binds());
    }
    try { Mode.parse("unknown"); }
    catch (IllegalArgumentException e) { System.out.println("invalid=" + e.getMessage()); }
  }
}`, "title=title LIKE ? ESCAPE '\\'|binds=1\nauthor=author = ?|binds=1\ntext=(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')|binds=2\ninvalid=search-mode-not-allowed", ["mybatis-dynamic-sql", "mybatis-choose-node", "mybatis-bound-sql"] )],
    diagnostics: [
      d("title+body mode에서 title 조건만 실행됩니다.", "넓은 earlier when이 combined mode 조건도 true로 만들어 뒤 branch를 shadow했습니다.", ["when order/truth table", "actual branch id", "normalized mode", "BoundSql predicate"], "enum equality처럼 mutually exclusive 조건을 사용하고 각 mode가 정확히 한 branch를 선택하는지 assert합니다.", "branch reachability/coverage와 mutation tests를 둡니다."),
      d("unknown searchType이 전체 목록으로 fallback합니다.", "otherwise를 permissive 1=1로 사용해 invalid input을 filter 없음으로 해석했습니다.", ["external key validation", "otherwise fragment", "tenant/limit scope", "result cardinality"], "unknown은 400/stable validation error로 거부하고 intentional no-filter는 별도 typed mode로 표현합니다.", "unknown/case/whitespace/Unicode keys와 max-cardinality tests를 둡니다."),
    ],
    expertNotes: ["choose의 otherwise는 예외를 직접 throw하지 않으므로 mapper 호출 전 typed validation이 중요한 방어층입니다.", "exclusive branch가 많아지면 enum→statement/template registry가 긴 OGNL choose보다 review하기 쉽습니다."],
  },
  {
    id: "where-trim-prefix-suffix",
    title: "where·trim으로 AND/OR prefix와 빈 조건을 정규화합니다",
    lead: "조건 조각을 단순 연결하면 `WHERE AND`, dangling WHERE 또는 OR precedence 오류가 생기며 trim은 문법 정리만 하고 의미 안전성은 보장하지 않습니다.",
    explanations: [
      "`<where>`는 child content가 있을 때만 WHERE를 붙이고 시작의 AND/OR를 제거합니다. 공식 dynamic SQL 문서가 제시하는 trim의 특정 prefix/prefixOverrides 구성과 같은 목적을 가집니다.",
      "`<trim prefix=... prefixOverrides=... suffixOverrides=...>`는 whitespace-sensitive token override를 적용합니다. formatting 변화와 comments 때문에 제거가 실패하지 않는지 BoundSql snapshot으로 확인합니다.",
      "OR 그룹은 괄호를 명시합니다. `tenant_id = ? AND title LIKE ? OR body LIKE ?`는 precedence 때문에 다른 tenant body rows를 포함할 수 있으므로 common authorization scope 밖에 OR가 빠져나오지 않게 합니다.",
      "where가 child 없음에서 아무것도 만들지 않는 것은 정상 기능이지만 UPDATE/DELETE에서는 전체 table mutation이 됩니다. service criteria validation, tenant predicate와 mapper guard statement를 별도로 둡니다.",
      "CDATA는 XML parser가 `<`, `>` 등을 markup으로 오해하지 않게 할 뿐 parameterization이나 SQL injection 방어가 아닙니다. 필요한 작은 operator fragment만 감싸고 SQL readability를 유지합니다.",
    ],
    concepts: [
      c("where node", "내용이 있을 때 WHERE를 추가하고 leading AND/OR를 정리하는 specialized trim node입니다.", ["빈 내용이면 WHERE를 만들지 않습니다.", "semantic scope는 별도 검증합니다."]),
      c("trim node", "동적 child text의 prefix/suffix와 override tokens를 정규화하는 node입니다.", ["whitespace가 중요합니다.", "SET/custom lists에도 씁니다."]),
      c("predicate precedence", "AND/OR/NOT과 parentheses가 조건 평가 순서를 결정하는 SQL grammar 규칙입니다.", ["authorization predicate를 보호합니다.", "truth-table fixture를 둡니다."]),
    ],
    diagnostics: [
      d("특정 조합에서 WHERE AND syntax error가 납니다.", "manual prefix 조립 또는 trim override와 실제 whitespace/token이 맞지 않습니다.", ["normalized BoundSql", "selected child fragments", "prefixOverrides", "comments/whitespace"], "where/trim node를 사용하고 모든 first-fragment 조합의 canonical SQL을 snapshot합니다.", "branch pairwise와 whitespace mutation prepare tests를 둡니다."),
      d("OR 검색이 다른 tenant rows를 반환합니다.", "OR group 괄호가 없어 tenant AND보다 넓은 precedence로 평가됐습니다.", ["final WHERE text", "bind order", "query plan/predicate", "cross-tenant fixture"], "검색 OR를 괄호로 묶고 tenant/authorization predicate를 공통 outer AND로 고정합니다.", "cross-tenant title/body truth-table와 forbidden-row assertion을 둡니다."),
    ],
    expertNotes: ["where/trim은 SQL punctuation을 정리할 뿐 빈 조건의 product semantics와 authorization을 결정하지 않습니다.", "canonical whitespace formatting을 두면 SQL fingerprint cardinality와 snapshot noise를 줄일 수 있습니다."],
  },
  {
    id: "set-partial-update-tristate",
    title: "set으로 partial UPDATE의 comma를 정리하고 absent·NULL·value를 구분합니다",
    lead: "동적 SET은 제공된 field만 바꾸는 patch를 만들지만 아무 field도 없거나 null 의미가 모호하면 invalid SQL 또는 data loss가 됩니다.",
    explanations: [
      "`<set>`은 child가 있을 때 SET을 붙이고 trailing comma를 제거합니다. 각 field if는 parameter presence를 판단하며 value는 `#{}`로 bind합니다.",
      "patch command는 absent(유지), explicit null(지움), value(변경)의 세 상태를 표현합니다. JSON deserializer부터 service DTO, mapper OGNL까지 presence metadata가 보존되어야 합니다.",
      "모든 field가 absent이면 `UPDATE table WHERE ...` 같은 invalid SQL 또는 empty set이 됩니다. mapper 호출 전 no-op/rejection을 정하고 필수 audit/version update만 남는 경우도 product 의미를 검토합니다.",
      "writable field allow-list를 DTO/XML에 고정합니다. client가 column name/value map을 보내게 하면 authorization, type과 구조 injection review가 어려워집니다.",
      "version/updated_at은 성공한 patch에서 원자적으로 증가하고 affected=1을 검사합니다. no-op patch가 version을 올리는지, 동일 값 update count semantics를 DB별로 정합니다.",
    ],
    concepts: [
      c("set node", "동적 update assignments를 SET 절로 감싸고 trailing comma를 제거하는 specialized trim node입니다.", ["빈 child를 별도 처리합니다.", "값은 bind합니다."]),
      c("tri-state patch", "field가 absent, explicit null 또는 concrete value인지 구분하는 update command입니다.", ["deserialization부터 보존합니다.", "column nullability를 검증합니다."]),
      c("writable-field allow-list", "use case가 변경하도록 승인한 properties와 validation/type rules의 고정 목록입니다.", ["mass assignment를 막습니다.", "role별로 다를 수 있습니다."]),
    ],
    codeExamples: [java("mybatis06-set", "tri-state patch SET 렌더링", "MyBatis06Set.java", "absent/null/value field를 구분해 approved assignments와 binds를 만들고 빈 patch를 거부합니다.", String.raw`import java.util.*;

public class MyBatis06Set {
  record Field(boolean present, String value) {
    static Field absent() { return new Field(false, null); }
    static Field nullValue() { return new Field(true, null); }
    static Field value(String value) { return new Field(true, value); }
  }
  record Patch(Field title, Field body, Field author) {}
  record Rendered(String sql, int binds) {}

  static Rendered render(Patch patch) {
    List<String> assignments = new ArrayList<>();
    int binds = 0;
    if (patch.title().present()) { assignments.add(patch.title().value() == null ? "title = NULL" : "title = ?"); if (patch.title().value() != null) binds++; }
    if (patch.body().present()) { assignments.add(patch.body().value() == null ? "body = NULL" : "body = ?"); if (patch.body().value() != null) binds++; }
    if (patch.author().present()) { assignments.add(patch.author().value() == null ? "author = NULL" : "author = ?"); if (patch.author().value() != null) binds++; }
    if (assignments.isEmpty()) throw new IllegalArgumentException("empty-patch");
    return new Rendered("UPDATE post SET " + String.join(", ", assignments) + " WHERE post_id = ? AND version = ?", binds + 2);
  }

  public static void main(String[] args) {
    Rendered result = render(new Patch(Field.value("new title"), Field.nullValue(), Field.absent()));
    System.out.println("sql=" + result.sql());
    System.out.println("binds=" + result.binds());
    System.out.println("author-preserved=true");
    try { render(new Patch(Field.absent(), Field.absent(), Field.absent())); }
    catch (IllegalArgumentException e) { System.out.println("invalid=" + e.getMessage()); }
  }
}`, "sql=UPDATE post SET title = ?, body = NULL WHERE post_id = ? AND version = ?\nbinds=3\nauthor-preserved=true\ninvalid=empty-patch", ["mybatis-dynamic-sql", "mybatis-set-node", "mybatis-trim-node"] )],
    diagnostics: [
      d("빈 patch 요청이 SQL syntax error로 500을 냅니다.", "set child가 하나도 없는데 mapper를 실행했습니다.", ["presence-aware command", "selected assignments", "BoundSql SET", "service validation"], "mapper 전에 empty patch를 400/no-op 정책으로 처리하고 rendered assignment count를 assert합니다.", "all-absent와 role-filtered-empty fixtures를 둡니다."),
      d("일반 사용자가 관리자 전용 field를 수정합니다.", "generic Map/reflective patch가 모든 property를 dynamic SET에 허용했습니다.", ["request DTO fields", "role-specific mapper/service", "writable allow-list", "affected audit"], "use case/role별 typed patch DTO와 고정 XML assignments를 사용하고 DB 권한/trigger를 보조층으로 둡니다.", "mass-assignment hostile keys와 authorization matrix tests를 둡니다."),
    ],
    expertNotes: ["dynamic SET을 사용해도 column identifier는 XML의 fixed text여야 하며 client key를 `${}`로 넣지 않습니다.", "explicit NULL이 필요한 API라면 serializer가 absent와 null을 구분하는지 mapper보다 먼저 검증합니다."],
  },
  {
    id: "foreach-collections-in-bulk",
    title: "foreach로 IN·bulk values를 만들고 empty·size·item scope를 제한합니다",
    lead: "collection 하나를 `#{}` marker 한 개에 넣는 대신 원소마다 marker를 만들되 빈 목록과 너무 큰 목록의 의미·비용을 통제해야 합니다.",
    explanations: [
      "`<foreach>`는 collection/array/Map을 순회하며 item/index, open/close/separator를 사용해 marker list나 multi-values tuples를 만듭니다. 각 item value는 `#{item...}`로 bind합니다.",
      "nullable 속성은 collection null 처리에 도움을 줄 수 있지만 null/empty가 filter 없음인지 match none인지 product 의미를 결정하지 않습니다. empty IN은 query skip/fixed false predicate/rejection 중 명시적 정책을 둡니다.",
      "목록 최대 크기는 DB parameter/SQL length/packet/parse/plan/lock limits를 고려합니다. 큰 집합은 temp/staging table, array/table-valued parameter 또는 chunked transaction을 dialect adapter로 분리합니다.",
      "bulk insert의 generated key correlation, 한 row constraint failure와 transaction policy는 앞 세션의 batch/multi-row contract를 그대로 적용합니다. foreach가 원자성이나 retry 안전성을 자동 제공하지 않습니다.",
      "Map iteration order에 SQL/result 의미를 의존하지 않습니다. deterministic List/order와 typed element를 사용하고 duplicate ids를 preserve/deduplicate할지 API에 명시합니다.",
    ],
    concepts: [
      c("foreach", "collection elements를 반복해 SQL fragments와 additional parameter mappings를 생성하는 dynamic node입니다.", ["item/index scope를 가집니다.", "open/close/separator를 설정합니다."]),
      c("empty collection semantics", "빈 목록을 match none, filter absent 또는 invalid 중 무엇으로 해석할지 정한 계약입니다.", ["dialect syntax에 맡기지 않습니다.", "read/write별로 다를 수 있습니다."]),
      c("collection size budget", "한 dynamic statement가 허용할 elements/markers/bytes와 execution cost 상한입니다.", ["API validation을 둡니다.", "large-set path를 분리합니다."]),
    ],
    codeExamples: [java("mybatis06-foreach", "bounded IN marker expansion", "MyBatis06ForEach.java", "ID collection 수만큼 marker를 만들고 empty/max+1을 stable error로 거부합니다.", String.raw`import java.util.*;
import java.util.stream.*;

public class MyBatis06ForEach {
  record Rendered(String sql, List<Long> parameters) {}
  static Rendered render(List<Long> ids) {
    if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("empty-id-list");
    if (ids.size() > 5) throw new IllegalArgumentException("id-list-too-large");
    if (ids.stream().anyMatch(Objects::isNull)) throw new IllegalArgumentException("null-id");
    String markers = IntStream.range(0, ids.size()).mapToObj(i -> "?").collect(Collectors.joining(", "));
    return new Rendered("SELECT post_id, title FROM post WHERE post_id IN (" + markers + ")", List.copyOf(ids));
  }

  public static void main(String[] args) {
    Rendered result = render(List.of(3L, 5L, 8L));
    System.out.println("sql=" + result.sql());
    System.out.println("bind-count=" + result.parameters().size());
    System.out.println("bind-order=" + result.parameters());
    try { render(List.of()); }
    catch (IllegalArgumentException e) { System.out.println("empty=" + e.getMessage()); }
    try { render(List.of(1L, 2L, 3L, 4L, 5L, 6L)); }
    catch (IllegalArgumentException e) { System.out.println("large=" + e.getMessage()); }
  }
}`, "sql=SELECT post_id, title FROM post WHERE post_id IN (?, ?, ?)\nbind-count=3\nbind-order=[3, 5, 8]\nempty=empty-id-list\nlarge=id-list-too-large", ["mybatis-dynamic-sql", "mybatis-foreach-node", "mybatis-bound-sql", "java-prepared-statement"] )],
    diagnostics: [
      d("빈 ids에서 `IN ()` syntax error 또는 전체 delete가 납니다.", "empty collection semantics와 write guard를 dialect/trim 우연에 맡겼습니다.", ["collection null/size", "rendered predicate", "read/write operation", "affected-row cap"], "read match-none은 query skip/fixed false, write empty는 rejection으로 명시하고 mapper 호출 전 검증합니다.", "null/empty/one/max/max+1 fixtures와 no-unbounded-write assertion을 둡니다."),
      d("수천 markers로 DB CPU/plan cache/packet 오류가 발생합니다.", "collection size budget과 large-set transport가 없습니다.", ["size distribution", "SQL length/parameter limits", "distinct shapes/plans", "parse/network/lock latency"], "API 상한/admission과 dialect-specific temp/array/staging path를 도입합니다.", "max cardinality load, plan fingerprint budget와 cleanup tests를 둡니다."),
    ],
    expertNotes: ["foreach의 안전성은 marker generation+item binding이며 values를 comma join해 `${}`로 넣는 것은 완전히 다른 위험한 구현입니다.", "chunking은 SQL size를 줄여도 여러 transaction/query의 snapshot, ordering과 partial failure를 자동 해결하지 않습니다."],
  },
  {
    id: "bind-like-pattern-escaping",
    title: "bind와 service normalization으로 LIKE pattern·escape를 명시합니다",
    lead: "`#{}`는 SQL injection을 막지만 `%`와 `_`가 wildcard로 동작하는 product 의미까지 자동으로 literal 검색으로 바꾸지는 않습니다.",
    explanations: [
      "`<bind>`는 OGNL expression 결과를 DynamicContext variable로 만들고 이후 `#{pattern}`로 bind할 수 있습니다. SQL text substitution이 아니라 named value 준비 용도로 사용합니다.",
      "contains 검색은 `%`+value+`%`를 만들 수 있지만 사용자 `%`, `_`와 escape character를 literal로 찾을지 wildcard로 허용할지 정합니다. literal policy면 escape하고 SQL에 `ESCAPE` 절을 명시합니다.",
      "복잡한 Unicode normalization, case folding와 wildcard escaping은 service의 tested function/value object에서 수행하는 편이 mapper OGNL보다 재사용·진단하기 쉽습니다. DB collation과 index strategy를 실제 plan으로 검증합니다.",
      "leading wildcard contains는 일반 B-tree index를 사용하지 못할 수 있습니다. prefix search, full-text/search engine, minimum length와 rate/cardinality limits를 product 요구와 비교합니다.",
      "pattern 값은 search PII가 될 수 있으므로 raw logging을 금지합니다. mode, normalized length bucket, wildcard policy, statement fingerprint와 rows/latency만 관측합니다.",
    ],
    concepts: [
      c("bind node", "OGNL expression을 평가해 DynamicContext에 이름 있는 additional parameter를 추가하는 node입니다.", ["이후 #{}로 bind합니다.", "SQL text 치환과 다릅니다."]),
      c("LIKE wildcard", "LIKE pattern에서 여러 문자 `%`, 한 문자 `_`를 의미하는 meta-character입니다.", ["injection과 별도 semantics입니다.", "ESCAPE policy를 둡니다."]),
      c("search normalization", "trim/case/Unicode/escape와 mode를 canonical search value로 만드는 경계입니다.", ["service에서 test합니다.", "DB collation과 맞춥니다."]),
    ],
    codeExamples: [java("mybatis06-like-bind", "LIKE literal pattern escaping", "MyBatis06LikeBind.java", "synthetic search text의 escape character, percent와 underscore를 escape해 하나의 bound pattern으로 만듭니다.", String.raw`public class MyBatis06LikeBind {
  static String escapeLike(String value) {
    return value
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_");
  }

  public static void main(String[] args) {
    String synthetic = "50%_done";
    String escaped = escapeLike(synthetic);
    String pattern = "%" + escaped + "%";
    System.out.println("escaped=" + escaped);
    System.out.println("pattern=" + pattern);
    System.out.println("sql=title LIKE ? ESCAPE '\\'");
    System.out.println("bind-count=1");
    System.out.println("raw-value-in-sql=false");
  }
}`, "escaped=50\\%\\_done\npattern=%50\\%\\_done%\nsql=title LIKE ? ESCAPE '\\'\nbind-count=1\nraw-value-in-sql=false", ["mybatis-dynamic-sql", "mybatis-dynamic-context", "mybatis-bound-sql"] )],
    diagnostics: [
      d("사용자가 `%`를 입력하면 거의 모든 행이 검색됩니다.", "parameterization은 했지만 wildcard를 literal로 escape하는 product policy가 없습니다.", ["raw/normalized pattern length", "escape function/order", "SQL ESCAPE clause", "rows/plan"], "literal search면 escape char 자체→%→_ 순서로 escape하고 matching ESCAPE 절을 사용합니다.", "%, _, escape, Unicode와 prefix/contains mode truth-table tests를 둡니다."),
      d("contains search가 table scan으로 DB를 포화시킵니다.", "leading wildcard와 unbounded result에 index/cardinality/admission 전략이 없습니다.", ["actual plan", "pattern modes/length", "rows examined/returned", "rate/tenant limits"], "prefix/full-text/search index 또는 minimum length/rate/row limits로 경로를 분리합니다.", "production-like cardinality plan/load tests와 query budget alert를 둡니다."),
    ],
    expertNotes: ["bind는 parameter 값을 계산하는 기능이며 `${}`로 pattern을 만들 이유가 없습니다.", "LIKE escape semantics와 case/accent collation은 DB dialect/version별로 actual fixture가 필요합니다."],
  },
  {
    id: "sql-include-static-fragments",
    title: "sql·include는 검토된 static fragment만 재사용합니다",
    lead: "중복 projection/predicate를 줄이는 include가 runtime identifier 조립 도구가 되면 dependency와 injection 위험이 커집니다.",
    explanations: [
      "`<sql id>`는 reusable fragment를 정의하고 `<include refid>`가 load/render 과정에서 포함합니다. 공통 projection, tenant/active predicate와 deterministic order fragment에 유용합니다.",
      "include property substitution은 load-time 성격의 `${}` 사용 사례가 있지만 값의 origin이 configuration-controlled constant인지 검증합니다. request/runtime value를 refid/table/column으로 전달하지 않습니다.",
      "fragment에는 leading WHERE/AND/comma ownership을 명시합니다. 호출자와 fragment가 모두 punctuation을 소유하면 invalid combinations가 생기므로 where/trim contract와 naming convention을 둡니다.",
      "공통 projection fragment 변경은 여러 statements/resultMaps를 동시에 바꿉니다. dependency graph와 affected BoundSql/result mapping tests를 생성하고 semantic version/change owner를 둡니다.",
      "너무 큰 include chain은 최종 SQL을 읽기 어렵게 합니다. resolved canonical SQL/fragment graph를 developer tooling에 보여 주고 security review는 resolved result를 기준으로 합니다.",
    ],
    concepts: [
      c("sql fragment", "mapper namespace에 id로 등록해 include할 수 있는 reusable SQL text/dynamic node 집합입니다.", ["projection/predicate를 중앙화합니다.", "ownership boundary를 문서화합니다."]),
      c("include", "refid로 SQL fragment를 현재 statement에 결합하는 mapper element입니다.", ["dependency graph를 만듭니다.", "static/config-controlled property만 사용합니다."]),
      c("resolved SQL", "모든 include와 dynamic branch를 적용해 실행될 canonical SQL shape입니다.", ["review/snapshot 대상입니다.", "parameter values는 제외합니다."]),
    ],
    diagnostics: [
      d("공통 fragment 수정 뒤 여러 mapper가 syntax/mapping 오류를 냅니다.", "include dependency와 prefix/projection contract를 모르고 fragment를 변경했습니다.", ["fragment consumers", "resolved SQL before/after", "resultMap labels", "where/comma ownership"], "fragment dependency inventory와 consumer BoundSql/mapping snapshots를 release gate로 실행합니다.", "fragment change impact analysis와 backward-compatible projection tests를 둡니다."),
      d("include refid/table property에 request 값이 들어갑니다.", "configuration substitution과 runtime untrusted structure를 구분하지 않았습니다.", ["property origin", "refid resolution time", "allowed fragment ids", "final MappedStatement inventory"], "외부 값은 typed enum→fixed mapped statement/fragment allow-list로 route하고 runtime substitution을 제거합니다.", "unknown/malicious structure keys와 startup resolved-id whitelist tests를 둡니다."),
    ],
    expertNotes: ["fragment reuse보다 resolved SQL의 local readability와 change blast radius가 더 중요할 수 있습니다.", "tenant/authorization predicate를 include로 중앙화해도 누락 consumer를 static inventory로 검증해야 합니다."],
  },
  {
    id: "structural-substitution-injection-allowlist",
    title: "#{} 값 바인딩과 ${} 구조 치환을 분리하고 allow-list합니다",
    lead: "동적 SQL이 필요하다는 이유로 table·column·ORDER BY를 raw `${}`로 받으면 parameter binding으로 확보한 code/data 경계가 사라집니다.",
    explanations: [
      "`#{}`는 PreparedStatement marker와 parameter mapping을 만들지만 `${}`는 문자열을 SQL text에 그대로 삽입합니다. 앞 `mybatis-03-parameter-binding`의 핵심 경계를 dynamic fragments에서도 유지합니다.",
      "value 위치는 항상 `#{}`를 사용합니다. identifier/order direction/operator처럼 marker가 될 수 없는 구조는 외부 key를 Java enum/allow-list에서 검증된 fixed SQL fragment 또는 별도 mapped statement로 route합니다.",
      "identifier quoting은 validation이 아닙니다. dialect별 quote/qualification/case와 escape가 다르고 허용하지 않은 table/object 접근을 막지 못하므로 raw input을 quote해 해결하지 않습니다.",
      "OGNL test/property navigation도 공격 surface/복잡성을 줄입니다. mapper parameter를 단순 typed DTO/enum으로 제한하고 arbitrary Map/class/method 접근과 user-authored expression을 허용하지 않습니다.",
      "최소 권한 DB role, row/tenant policy, statement timeout/row cap과 audit는 dynamic-shape bug의 blast radius를 줄이는 독립 방어층입니다. parameterization 대체재가 아닙니다.",
    ],
    concepts: [
      c("string substitution", "`${}` expression 결과를 escaping/binding 없이 SQL text에 직접 넣는 MyBatis 기능입니다.", ["신뢰된 static structure에만 제한합니다.", "외부 value에 금지합니다."]),
      c("structural allow-list", "외부의 제한된 logical key를 review된 fixed table/column/order/operator fragment와 연결하는 mapping입니다.", ["unknown을 거부합니다.", "DB dialect adapter에 격리합니다."]),
      c("shape authorization", "요청 actor/use case가 어떤 statement/filter/order/mutation shape를 실행할 수 있는지 제한하는 정책입니다.", ["값 authorization과 함께 적용합니다.", "statement registry로 감사합니다."]),
    ],
    diagnostics: [
      d("PreparedStatement인데 ORDER BY/table 입력으로 injection이 됩니다.", "value binds는 안전하지만 identifier를 `${}`로 raw substitution했습니다.", ["final BoundSql text", "all `${}` origins", "sort/table key validation", "effective DB role"], "external key를 enum→fixed fragment/statement allow-list로 map하고 raw substitution을 제거합니다.", "structure-key hostile corpus와 SQL shape whitelist assertions를 둡니다."),
      d("generic Map parameter로 예상치 못한 OGNL property/method가 평가됩니다.", "parameter surface가 너무 넓고 expression이 business logic/structure를 직접 탐색합니다.", ["parameter runtime class", "OGNL expressions", "allowed getters/methods", "MyBatis/OGNL version security notes"], "minimal immutable criteria DTO/enum과 단순 null/equality tests만 사용하고 user-authored expressions를 금지합니다.", "unexpected property/class/method negative tests와 dependency security review를 둡니다."),
    ],
    expertNotes: ["동적 구조가 많아지면 XML string composition보다 typed query specification/DSL이 더 감사 가능할 수 있습니다.", "`${}` 사용은 zero가 이상적이며 unavoidable static configuration use는 source, allowed values와 resolved SQL을 release evidence로 남깁니다."],
  },
  {
    id: "shape-explosion-plan-cache-performance",
    title: "조건 조합의 SQL shape 폭증과 plan/cache 비용을 측정합니다",
    lead: "optional condition N개는 최대 2^N SQL shapes를 만들 수 있어 statement/plan cache와 성능 회귀를 숨깁니다.",
    explanations: [
      "각 if 조합은 다른 SQL text/fingerprint가 될 수 있습니다. 값은 bind해도 predicate presence/order가 달라 DB plan cache와 MyBatis/JDBC statement reuse cardinality가 증가합니다.",
      "실제 요청 분포에서 shape frequency, parameter type/selectivity, prepare/parse/plan latency, chosen indexes와 rows examined를 측정합니다. 모든 조합을 같은 query 하나로 억지 통합하면 optimizer에 불리할 수 있습니다.",
      "조건이 많다면 named search modes/template variants, required anchor predicate, query specification compiler와 index-aligned shapes로 제한합니다. arbitrary combination을 product feature로 자동 허용하지 않습니다.",
      "predicate order/whitespace를 canonicalize해 의미가 같은 shapes를 하나의 fingerprint로 만듭니다. 하지만 DB optimizer가 의미를 동일하게 처리한다는 근거 없이 OR-NULL pattern으로 단일 SQL화하지 않습니다.",
      "MyBatis local/second-level cache key는 statement, parameters, bounds와 SQL에 영향을 받습니다. dynamic query cache hit/staleness와 write flush를 실제 workload에서 검증하고 cache로 bad query를 숨기지 않습니다.",
    ],
    concepts: [
      c("SQL shape", "parameter values를 제외한 선택된 tables/projection/predicates/order/marker 구조입니다.", ["fingerprint로 집계합니다.", "dynamic branches가 shape를 만듭니다."]),
      c("shape explosion", "독립 optional branches가 조합되어 가능한 SQL fingerprints가 지수적으로 늘어나는 현상입니다.", ["plan/statement cache를 분산합니다.", "허용 modes로 제한합니다."]),
      c("canonicalization", "의미가 같은 SQL의 whitespace/order/naming을 안정 형식으로 만들어 fingerprint noise를 줄이는 과정입니다.", ["semantics를 바꾸지 않습니다.", "values는 포함하지 않습니다."]),
    ],
    codeExamples: [java("mybatis06-shape-count", "optional predicate SQL shape 열거", "MyBatis06ShapeCount.java", "세 독립 optional predicate의 8개 shapes를 생성해 explosion을 수치화하고 fixed order로 canonicalize합니다.", String.raw`import java.util.*;

public class MyBatis06ShapeCount {
  static String shape(boolean title, boolean author, boolean active) {
    List<String> predicates = new ArrayList<>();
    if (title) predicates.add("title = ?");
    if (author) predicates.add("author = ?");
    if (active) predicates.add("active = ?");
    return "SELECT post_id FROM post" + (predicates.isEmpty() ? "" : " WHERE " + String.join(" AND ", predicates));
  }

  public static void main(String[] args) {
    Set<String> shapes = new LinkedHashSet<>();
    for (int mask = 0; mask < 8; mask++) {
      shapes.add(shape((mask & 1) != 0, (mask & 2) != 0, (mask & 4) != 0));
    }
    System.out.println("optional-predicates=3");
    System.out.println("possible-combinations=8");
    System.out.println("distinct-shapes=" + shapes.size());
    System.out.println("empty-shape=" + shapes.iterator().next());
    System.out.println("full-shape=" + shape(true, true, true));
    System.out.println("canonical-order=title,author,active");
  }
}`, "optional-predicates=3\npossible-combinations=8\ndistinct-shapes=8\nempty-shape=SELECT post_id FROM post\nfull-shape=SELECT post_id FROM post WHERE title = ? AND author = ? AND active = ?\ncanonical-order=title,author,active", ["mybatis-dynamic-sql", "mybatis-bound-sql", "mybatis-mapped-statement"] )],
    diagnostics: [
      d("dynamic search 배포 후 prepare/plan CPU와 p99가 급증합니다.", "optional combinations가 많은 rare SQL fingerprints와 plans를 만들었습니다.", ["distinct fingerprints/frequency", "parse/plan latency", "predicate selectivity/types", "statement/plan cache hit"], "product modes와 index-aligned templates로 shapes를 제한하고 canonical ordering/whitespace를 적용합니다.", "shape cardinality budget과 top/rare plan regression gate를 둡니다."),
      d("모든 조건을 OR-NULL 하나로 합친 뒤 index가 사용되지 않습니다.", "shape 감소만 보고 optimizer selectivity/index trade-off를 무시했습니다.", ["actual plan per parameter class", "rows examined", "generic/custom plan behavior", "latency distribution"], "bounded explicit templates와 OR-NULL을 target DB workload에서 비교해 evidence로 선택합니다.", "representative selectivity buckets의 plan/latency golden tests를 둡니다."),
    ],
    expertNotes: ["shape 수 자체보다 요청 분포, plan quality와 operational cache capacity가 함께 중요합니다.", "statement fingerprint에는 raw literals/PII를 넣지 않고 normalized structure와 stable statement id만 사용합니다."],
  },
  {
    id: "dynamic-testing-observability-governance",
    title: "branch matrix·BoundSql audit·target DB readback으로 동적 SQL을 운영합니다",
    lead: "한두 happy path mapper test는 조합·빈 조건·구조 injection·dialect·transaction 실패를 발견하지 못합니다.",
    explanations: [
      "startup inventory에는 dynamic MappedStatement, referenced fragments, node types, raw `${}` count/origins, allowed branch ids와 required guards를 값 없이 기록합니다. unexpected substitution이나 broken include를 fail-fast합니다.",
      "render-level tests는 parameter equivalence classes에서 normalized BoundSql, marker/ParameterMapping count/order, allowed keywords/identifiers와 forbidden full-write shapes를 검증합니다.",
      "target DB integration은 migration과 최소 권한 identity를 사용해 result rows/affected counts, NULL/empty/Unicode/wildcards, plan/index, transaction rollback과 driver/dialect syntax를 readback합니다.",
      "pairwise/property-based/mutation tests로 if 조건 제거, choose order 변경, trim prefix, foreach empty와 `${}` 치환 같은 regression을 주입합니다. branch coverage 숫자만 보지 않고 security/correctness invariant를 assert합니다.",
      "telemetry에는 statement id, branch bitset/shape fingerprint, marker/type/count, result/affected row class, elapsed, plan/schema/MyBatis/driver version과 stable error stage를 둡니다. raw values/SQL literals는 제외합니다.",
    ],
    concepts: [
      c("branch matrix", "동적 조건의 equivalence classes와 기대 fragments/shape/result를 나열한 test 표입니다.", ["pairwise와 boundary를 포함합니다.", "unreachable branch를 찾습니다."]),
      c("BoundSql audit", "최종 SQL structure와 parameter mappings/additional parameters를 값 없이 검사하는 release 단계입니다.", ["marker count/order를 확인합니다.", "allow/deny shape를 적용합니다."]),
      c("dynamic SQL governance", "허용 tags/substitution/shapes/budgets/tests/telemetry와 change review를 정의한 조직 표준입니다.", ["mapper별 owner를 둡니다.", "upgrade마다 인증합니다."]),
    ],
    diagnostics: [
      d("조건 하나를 추가한 뒤 특정 조합에서만 잘못된 rows가 반환됩니다.", "branch interaction과 truth-table/result fixture가 test되지 않았습니다.", ["branch bitset", "BoundSql before/after", "bind order/types", "expected vs actual row ids without PII"], "parameter equivalence/pairwise matrix와 synthetic golden DB rows를 추가해 shape와 semantic result를 함께 assert합니다.", "mutation testing으로 branch removal/order/parentheses 결함을 검출합니다."),
      d("MyBatis/driver upgrade 뒤 dynamic query error가 늘지만 비교 증거가 없습니다.", "shape, OGNL, parameter mapping과 version을 telemetry/release matrix에 연결하지 않았습니다.", ["MyBatis/OGNL/driver/schema versions", "shape fingerprints", "error stage/SQLState", "canary cohort"], "old/new versions에서 render+prepare+execute conformance를 비교하고 failing shapes를 canary rollback합니다.", "version-stratified shape/error budgets와 upgrade corpus를 둡니다."),
    ],
    expertNotes: ["동적 SQL의 test oracle은 문자열 snapshot 하나가 아니라 allowed structure, bind contract, authorized result와 transaction state입니다.", "운영 branch telemetry는 low-cardinality bitset/template id로 제한해 사용자 search data가 label이 되지 않게 합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-board-mapper", repository: "springmvc/myproject01", path: "src/main/resources/mapper/BoardMapper.xml", usedFor: ["choose-based optional value, foreach-ready bound parameters, CDATA predicates and dynamic board mapper progression"], evidence: "read-only로 68 lines/3,161 bytes를 확인했으며 namespace·SQL/property/data literals는 예제에 복사하지 않았습니다." },
  { id: "mybatis-dynamic-sql", repository: "MyBatis 3 Documentation", path: "Dynamic SQL", publicUrl: "https://mybatis.org/mybatis-3/dynamic-sql.html", usedFor: ["if, choose/when/otherwise, trim/where/set, foreach, script and bind semantics"], evidence: "MyBatis 공식 Dynamic SQL reference 3.5.19입니다." },
  { id: "mybatis-sqlmap", repository: "MyBatis 3 Documentation", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["mapped statements, sql/include fragments, #{} parameters and ${} substitution warnings"], evidence: "MyBatis 공식 Mapper XML reference 3.5.19입니다." },
  { id: "mybatis-configuration", repository: "MyBatis 3 Documentation", path: "Configuration", publicUrl: "https://mybatis.org/mybatis-3/configuration.html", usedFor: ["default scripting language, nullable foreach and runtime settings"], evidence: "MyBatis 공식 configuration reference입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Documentation", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["mapped statement execution, select/update outcomes and session transaction scope"], evidence: "MyBatis 공식 Java API reference입니다." },
  { id: "mybatis-bound-sql", repository: "MyBatis 3 API", path: "BoundSql", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/BoundSql.html", usedFor: ["final SQL, parameter mappings/object and additional parameters"], evidence: "MyBatis 공식 BoundSql API 3.5.19입니다." },
  { id: "mybatis-mapped-statement", repository: "MyBatis 3 API", path: "MappedStatement", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/MappedStatement.html", usedFor: ["SqlSource, command type, cache/timeout and statement inventory"], evidence: "MyBatis 공식 MappedStatement API 3.5.19입니다." },
  { id: "mybatis-if-node", repository: "MyBatis 3 API", path: "IfSqlNode", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/IfSqlNode.html", usedFor: ["conditional dynamic node application"], evidence: "MyBatis 공식 IfSqlNode API 3.5.19입니다." },
  { id: "mybatis-choose-node", repository: "MyBatis 3 API", path: "ChooseSqlNode", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/ChooseSqlNode.html", usedFor: ["exclusive when/default node selection"], evidence: "MyBatis 공식 ChooseSqlNode API 3.5.19입니다." },
  { id: "mybatis-foreach-node", repository: "MyBatis 3 API", path: "ForEachSqlNode", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/ForEachSqlNode.html", usedFor: ["collection iteration, item/index/open/close/separator/nullable"], evidence: "MyBatis 공식 ForEachSqlNode API 3.5.19입니다." },
  { id: "mybatis-trim-node", repository: "MyBatis 3 API", path: "TrimSqlNode", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/TrimSqlNode.html", usedFor: ["prefix/suffix override normalization"], evidence: "MyBatis 공식 TrimSqlNode API 3.5.19입니다." },
  { id: "mybatis-where-node", repository: "MyBatis 3 API", path: "WhereSqlNode", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/WhereSqlNode.html", usedFor: ["conditional WHERE construction"], evidence: "MyBatis 공식 WhereSqlNode API 3.5.19입니다." },
  { id: "mybatis-set-node", repository: "MyBatis 3 API", path: "SetSqlNode", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/SetSqlNode.html", usedFor: ["dynamic UPDATE SET normalization"], evidence: "MyBatis 공식 SetSqlNode API 3.5.19입니다." },
  { id: "mybatis-dynamic-context", repository: "MyBatis 3 API", path: "DynamicContext", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/DynamicContext.html", usedFor: ["SQL append, bindings and unique numbering context"], evidence: "MyBatis 공식 DynamicContext API 3.5.19입니다." },
  { id: "mybatis-xml-language-driver", repository: "MyBatis 3 API", path: "XMLLanguageDriver", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/scripting/xmltags/XMLLanguageDriver.html", usedFor: ["XML script SqlSource and ParameterHandler creation"], evidence: "MyBatis 공식 XMLLanguageDriver API 3.5.19입니다." },
  { id: "java-prepared-statement", repository: "Java SE 21 API", path: "java.sql.PreparedStatement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html", usedFor: ["typed marker binding and execution boundary"], evidence: "Oracle JDK 공식 PreparedStatement API입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-06-dynamic-sql", slug: "mybatis-06-dynamic-sql", courseId: "spring", moduleId: "mybatis-mapping", order: 6,
  title: "if·choose·foreach 동적 SQL과 빈 조건", subtitle: "SqlNode→BoundSql 렌더링을 if·choose·where/trim·set·foreach·bind에서 구조 injection·shape budget·branch testing까지 검증합니다.", level: "고급", estimatedMinutes: 980,
  coreQuestion: "입력 조합이 많아져도 동적 mapper가 승인된 bounded SQL shape와 정확한 bind contract만 만들고, 빈 조건·구조 injection·plan 폭증을 일으키지 않음을 어떻게 증명할까요?",
  summary: "springmvc/myproject01의 BoardMapper.xml을 read-only로 감사해 optional value choose, bound pagination, CDATA predicate와 게시판 dynamic mapper progression을 구조 provenance로 사용합니다. 선행 CRUD의 count/key/transaction contract를 이어 parameter→SqlNode/OGNL→DynamicContext→BoundSql→PreparedStatement pipeline, if truthiness, choose exclusivity, where/trim prefix, set tri-state patch, foreach IN/bulk와 empty/size, bind LIKE escaping, sql/include dependency, #{}와 ${} 구조 신뢰 경계, SQL shape explosion/plan cache와 branch/BoundSql/target DB governance까지 독립적으로 설명합니다. 여섯 JDK 21 examples는 optional WHERE, exclusive choose, tri-state SET, bounded foreach, LIKE bind와 2^N shape 수를 실제 실행합니다.",
  objectives: ["dynamic SqlNode/OGNL/BoundSql render pipeline과 failure stage를 설명한다.", "if의 null/blank/0/false presence와 bounded empty read/write를 설계한다.", "choose exclusivity와 where/trim precedence/prefix를 검증한다.", "set에서 absent/null/value patch와 writable allow-list를 유지한다.", "foreach collection의 marker/order/empty/size/bulk transaction을 통제한다.", "bind LIKE normalization과 #{} value/${} structure 경계를 지킨다.", "SQL shape/cardinality/plan budget과 branch/BoundSql/target DB release gate를 운영한다."],
  prerequisites: [{ title: "INSERT·UPDATE·DELETE와 생성 키 처리", reason: "고정 CRUD의 affected rows, key와 transaction 계약을 유지한 채 조건에 따라 SQL 구조가 달라지는 경우로 확장합니다.", sessionSlug: "mybatis-05-crud-generated-key" }],
  keywords: ["dynamic SQL", "SqlNode", "OGNL", "BoundSql", "if", "choose", "when", "otherwise", "where", "trim", "set", "foreach", "bind", "empty condition", "SQL shape", "structural injection"], topics,
  lab: {
    title: "게시판 search·patch·bulk mapper를 bounded dynamic SQL compiler로 재설계하기",
    scenario: "legacy mapper는 여러 if/choose와 CDATA를 사용하지만 blank/false/empty, OR precedence, patch null, large IN, raw sort와 shape explosion에 대한 계약·test가 없습니다.",
    setup: ["원본 mapper는 read-only provenance로 보존하고 namespace/SQL/property/data literals를 공개 code에 복사하지 않습니다.", "JDK 21 harness와 별도로 supported MyBatis/OGNL/JDK/driver/MySQL·Oracle ephemeral schemas와 최소 권한 identities를 준비합니다.", "parameter equivalence classes, branch ids, allowed SQL shapes/identifiers, bind schema, maximum rows/list/shapes 표를 작성합니다.", "null/blank/0/false/empty/max+1/Unicode/wildcard/unknown structure/cross-tenant/constraint fixtures를 고정합니다."],
    steps: ["MappedStatement의 SqlNode/include/raw substitution inventory와 startup resolved references를 생성합니다.", "criteria를 typed DTO/enum으로 normalize하고 if에서 presence와 truthiness를 분리합니다.", "exclusive search modes를 choose로 만들고 unknown/otherwise를 fail-closed합니다.", "where/trim의 prefix와 OR parentheses/tenant scope를 모든 branch 조합에서 확인합니다.", "tri-state patch와 set을 적용해 writable fields만 만들고 empty patch를 거부합니다.", "foreach IN/bulk의 item binds, deterministic order, empty/match-none과 max/large-set path를 검증합니다.", "LIKE value를 service에서 normalize/escape하고 bind additional parameter로 전달합니다.", "sql/include fragments의 consumers와 resolved projection/predicate diff를 검사합니다.", "모든 `${}` origin을 제거하거나 static configuration allow-list로 증명하고 hostile structure keys를 거부합니다.", "shape frequency/cardinality, plan/parse/p99와 rows를 측정해 product modes/index-aligned templates로 제한합니다.", "render-level BoundSql marker/order/deny-shape와 actual DB result/count/transaction/privilege tests를 실행합니다.", "statement/branch/fingerprint/type/count/rows/error/version만 기록하는 safe telemetry와 upgrade canary rollback을 rehearsal합니다."],
    expectedResult: ["모든 parameter class가 syntactically valid하고 승인된 canonical SQL shape와 정확한 marker/type/order만 생성합니다.", "blank/false/0/empty/unknown 입력이 명시적 bounded semantics 또는 stable rejection을 따릅니다.", "patch/bulk writes가 writable scope, tenant/version predicate와 affected-row/transaction invariant를 유지합니다.", "raw substitution, cross-tenant OR, unbounded write와 oversized list가 release/runtime guard에서 차단됩니다.", "shape/plan/cardinality budgets와 logs가 raw values/PII 없이 dynamic query behavior를 설명합니다."],
    cleanup: ["ephemeral rows/tables/temp large-set objects, mapper test sessions/transactions와 identities를 제거합니다.", "pending batch/cursor/connection을 close/rollback하고 pool baseline을 확인합니다.", "BoundSql snapshots/logs/traces에서 raw parameter/search text/synthetic canary가 없는지 검사 후 삭제합니다.", "원본 mapper와 production schema/data는 변경하지 않습니다."],
    extensions: ["typed query specification→MyBatis criteria compiler를 구현합니다.", "branch/property/mutation testing으로 mapper shape coverage를 자동화합니다.", "MySQL/Oracle large-set and LIKE/full-text dialect adapters를 benchmark합니다.", "MappedStatement/SqlNode/include graph와 plan fingerprint dashboard를 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행해 branch, SQL shape와 bind 계약을 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "false filter와 blank/no-filter 차이를 설명합니다.", "choose가 정확히 한 branch와 unknown rejection을 만드는지 확인합니다.", "tri-state set의 absent/null/value를 추적합니다.", "foreach empty/max+1과 bind order를 검증합니다.", "LIKE wildcard escape와 raw-value-in-sql=false를 설명합니다.", "세 optional predicates가 8 shapes를 만드는 이유를 계산합니다."], hints: ["값이 아니라 최종 SQL 구조와 marker의 수·순서부터 비교하세요."], expectedOutcome: "각 dynamic tag를 하나의 BoundSql compiler contract로 설명합니다.", solutionOutline: ["normalize→select nodes→trim→bind→audit shape→execute→verify 순서입니다."] },
    { difficulty: "응용", prompt: "원본 게시판 mapper를 안전한 search·patch·bulk dynamic mapper로 확장하세요.", requirements: ["원본은 structural provenance로만 사용합니다.", "typed criteria와 exclusive search enum을 둡니다.", "where/OR tenant scope와 bounded empty read를 검증합니다.", "tri-state patch/set과 optimistic count를 적용합니다.", "foreach empty/size/large-set 정책을 둡니다.", "LIKE escape와 structural allow-list를 적용합니다.", "shape/plan/cardinality budget을 측정합니다.", "BoundSql/actual DB/privilege/failure matrix와 safe telemetry를 실행합니다."], hints: ["동적 태그를 늘리기 전에 허용 shapes와 forbidden empty write를 표로 고정하세요."], expectedOutcome: "입력 조합과 schema/driver 변화에도 bounded하고 injection-safe한 mapper가 완성됩니다.", solutionOutline: ["inventory→normalize→branch→trim→bind→bound→execute→readback→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 MyBatis dynamic SQL governance와 release gate를 작성하세요.", requirements: ["허용 tags/OGNL/substitution policy를 정의합니다.", "criteria presence/exclusive/empty semantics를 둡니다.", "where/set/foreach/bind safety 규칙을 지정합니다.", "identifier/fragment allow-list와 최소 권한을 둡니다.", "shape/list/rows/plan/timeout budgets를 정합니다.", "branch/pairwise/property/mutation/BoundSql tests를 요구합니다.", "actual DB result/count/transaction/authorization matrix를 요구합니다.", "safe telemetry, version canary/rollback과 incident runbook을 포함합니다."], hints: ["XML parse 성공이 아니라 허용 SQL shape 집합과 DB state invariant를 governance 대상으로 삼으세요."], expectedOutcome: "동적 mapper 작성부터 운영/upgrade까지 일관된 구조 안전 표준이 완성됩니다.", solutionOutline: ["constrain inputs→compile shapes→bind values→authorize→budget→test→observe→evolve 순서입니다."] },
  ],
  nextSessions: ["mybatis-07-pagination-dialect"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["BoardMapper.xml은 read-only로 68 lines/3,161 bytes를 확인했고 SHA-256은 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6입니다.", "원본은 choose optional value, bound pagination, CDATA predicate와 여러 CRUD statements를 포함하며 본 세션은 dynamic structure만 provenance로 사용했습니다.", "원본 namespace/SQL/property/data literal은 복사하지 않았고 원본의 MAX+1 계열 key 전략은 concurrency-safe identity로 가르치지 않으며 앞 세션의 sequence/identity 원칙으로 교정했습니다.", "JDK-only examples는 실제 MyBatis OGNL/SqlNode/XMLLanguageDriver/BoundSql, target DB dialect/plan, transaction과 privilege behavior를 대체하지 않습니다."] },
});

export default session;
