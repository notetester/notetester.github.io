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
      { lines: `1-${first}`, explanation: "JDK 21 records·collections·comparators로 Spring Data 조회 계약의 입력과 결과를 외부 의존성 없이 모델링합니다." },
      { lines: `${first + 1}-${second}`, explanation: "파생 문법, page/slice, stable order, keyset, escaping, projection 또는 request budget의 핵심 불변식을 계산합니다." },
      { lines: `${second + 1}-${lines}`, explanation: "결정적 synthetic fixture만 사용해 exact stdout으로 경계 조건을 검증하고 실제 SQL·DB 검증이 필요한 범위를 분리합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/JPA/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 제시된 결과와 완전히 같아야 합니다.", "JDK-only model은 Spring Data parser, provider SQL, count query와 MySQL optimizer 실행을 대신하지 않습니다."] },
    experiments: [
      { change: "method name, page size, duplicate sort value, cursor, wildcard와 projection field를 바꿉니다.", prediction: "query contract와 다음 window, escaped pattern, 공개 shape가 규칙에 따라 달라집니다.", result: "exact output과 repository integration SQL/plan evidence를 함께 비교합니다." },
      { change: "동일 조건을 disposable MySQL과 실제 Spring Data repository에서 실행합니다.", prediction: "provider가 content/count SQL, bind values, limit/offset 또는 keyset predicate를 만듭니다.", result: "SQL shape, rows examined, index/order, latency와 query count를 fixture 기대값과 대조합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "repository-source-audit",
    title: "원본 Repository의 실제 기능과 아직 존재하지 않는 기능을 먼저 분리합니다",
    lead: "JpaRepository를 상속했다는 사실만으로 검색·정렬·페이지 성능과 API 상한이 설계됐다고 볼 수 없습니다.",
    explanations: [
      "원본 GuestBookRepository는 JpaRepository<GuestBook, Long>를 상속하고 List<GuestBook> findByActive(Integer)라는 파생 조회 하나를 선언합니다. 나머지 세 조회는 JPQL @Query이며 active 상수, positional parameter와 named parameter binding을 각각 학습합니다.",
      "원본에는 Pageable, Page, Slice, Sort, Limit, Window, projection, countQuery, timeout 또는 index contract가 없습니다. 따라서 이 세션은 원본에 이미 구현됐다고 꾸미지 않고 작은 List/nullable entity 조회를 production-safe collection contract로 확장합니다.",
      "findByIdx와 findBymIdx는 단건을 nullable entity로 반환하고 JpaRepository의 reserved findById와 의미·Optional 계약이 다릅니다. method spelling과 return multiplicity가 호출자에게 주는 의미를 inventory로 고정합니다.",
      "source hash는 읽은 snapshot을 증명할 뿐 query correctness나 성능 승인이 아닙니다. 실제 schema, entity field mapping, generated SQL과 data distribution을 별도 fixture에서 검증해야 합니다.",
    ],
    concepts: [
      c("repository contract", "method 이름·parameter·return type·정렬·limit·transaction이 호출자에게 보장하는 조회 규약입니다.", ["SQL보다 상위 계약입니다.", "null/multiplicity를 포함합니다."]),
      c("declared query", "@Query, named query처럼 개발자가 JPQL/SQL을 명시하는 조회입니다.", ["method derivation과 구분합니다.", "parameter binding을 사용합니다."]),
      c("source provenance", "어떤 원본 snapshot에서 구조적 사실을 확인했는지 path·hash·coverage로 남긴 근거입니다.", ["실제 data는 포함하지 않습니다.", "설계 승인이 아닙니다."]),
    ],
    diagnostics: [d("Pageable을 추가했다고 설명하지만 generated SQL과 total query 수를 제시하지 못합니다.", "원본의 List/JPQL 범위와 새 설계를 구분하지 않았습니다.", ["원본 method signatures", "return types", "Pageable imports", "SQL/query count", "source hash"], "원본 사실과 보강 계약을 분리한 뒤 각 기능을 repository integration test로 증명합니다.", "source coverage와 capability matrix를 세션·PR에 함께 둡니다.")],
    expertNotes: ["Repository interface가 짧아도 query behavior는 method parser, provider, schema와 database optimizer까지 이어집니다.", "원본의 실제 table/user data나 configuration secret은 설명·fixture·로그에 복사하지 않습니다."],
  },
  {
    id: "derived-query-grammar-property-resolution",
    title: "파생 쿼리를 subject·predicate·property traversal·order 문법으로 읽습니다",
    lead: "findBy 뒤 단어를 자연어처럼 추측하면 reserved method, nested property와 keyword 경계에서 다른 query가 생성될 수 있습니다.",
    explanations: [
      "query method는 find/read/get/query/search/stream 같은 subject와 첫 By 뒤 predicate로 나뉩니다. Distinct, Top/First와 숫자 limit은 subject에, And/Or/Between/LessThan/In/IgnoreCase/OrderBy 같은 조건은 predicate에 포함됩니다.",
      "parser는 Java entity property 이름을 해석하며 DB column 이름을 읽지 않습니다. nested traversal이 모호하면 underscore로 traversal 지점을 표시할 수 있지만 field 이름 자체에 underscore를 남용하지 않는 convention이 중요합니다.",
      "CrudRepository의 findById처럼 reserved signature는 descriptive token을 property로 해석하지 않고 identifier를 대상으로 할 수 있습니다. id가 아닌 필드를 조회하려면 findUserById처럼 descriptive token으로 충돌을 피하고 startup query creation test를 둡니다.",
      "method가 너무 길거나 Or precedence·join·aggregation·dynamic condition이 복잡하면 @Query, Specification, Querydsl 또는 dedicated read repository로 옮깁니다. 이름 길이는 성능이 아니라 검토 가능성의 신호입니다.",
    ],
    concepts: [
      c("query subject", "결과 종류와 distinct/limit 같은 동작을 표현하는 By 앞부분입니다.", ["find/count/exists/delete가 있습니다.", "Top/First를 포함할 수 있습니다."]),
      c("property expression", "entity attribute와 nested path를 method token으로 표현한 조건 대상입니다.", ["column명이 아닙니다.", "startup에 검증합니다."]),
      c("reserved method", "CrudRepository 등의 기반 interface가 식별자 의미로 이미 정의한 method signature입니다.", ["findById가 대표적입니다.", "descriptive token으로 충돌을 피합니다."]),
    ],
    codeExamples: [java("jpa06-derived-contract", "파생 method 이름을 명시적 조회 계약으로 펼치기", "Jpa06DerivedContract.java", "지원하기로 결정한 method 이름을 allow-list contract로 펼쳐 subject, predicate와 order를 정확히 구분합니다.", String.raw`public class Jpa06DerivedContract {
  record Query(String subject, String predicate, String order) {}
  static Query describe(String method) {
    return switch (method) {
      case "findByActiveOrderByIdxDesc" -> new Query("find", "active = ?", "idx DESC");
      case "countByActive" -> new Query("count", "active = ?", "none");
      case "existsByWriter" -> new Query("exists", "writer = ?", "none");
      case "findByAddress_ZipCode" -> new Query("find", "address.zipCode = ?", "none");
      default -> throw new IllegalArgumentException("unsupported method");
    };
  }
  public static void main(String[] args) {
    System.out.println("find=" + describe("findByActiveOrderByIdxDesc"));
    System.out.println("count=" + describe("countByActive"));
    System.out.println("exists=" + describe("existsByWriter"));
    System.out.println("nested=" + describe("findByAddress_ZipCode"));
    System.out.println("uses-entity-properties=true");
  }
}`, "find=Query[subject=find, predicate=active = ?, order=idx DESC]\ncount=Query[subject=count, predicate=active = ?, order=none]\nexists=Query[subject=exists, predicate=writer = ?, order=none]\nnested=Query[subject=find, predicate=address.zipCode = ?, order=none]\nuses-entity-properties=true", ["local-guestbook-repository", "spring-data-jpa-query-methods", "spring-data-jpa-keywords", "spring-data-commons-query-details", "jakarta-persistence-32"])],
    diagnostics: [d("application startup에서 PropertyReferenceException이 나거나 findById가 예상 밖 field를 조회합니다.", "entity property 철자·nested traversal 또는 reserved method 의미를 확인하지 않았습니다.", ["entity Java properties", "method subject/By split", "reserved signatures", "underscore traversal", "startup logs"], "method를 grammar 단위로 해석하고 복잡하거나 모호한 query는 explicit query/read repository로 이동합니다.", "repository context startup와 representative query creation tests를 CI에 둡니다.")],
    expertNotes: ["parser가 method를 받아들였다는 사실은 결과 cardinality, authorization와 index가 올바르다는 뜻이 아닙니다.", "Or/And가 섞인 긴 method는 괄호를 표현하기 어려우므로 이름을 더 늘리기 전에 명시적 query로 전환합니다."],
  },
  {
    id: "null-like-wildcard-escaping",
    title: "null·빈 collection·LIKE wildcard와 escaping을 parameter 계약으로 고정합니다",
    lead: "검색어의 %와 _가 literal인지 wildcard인지 정하지 않으면 결과 범위와 index 사용, 보안 기대가 서로 달라집니다.",
    explanations: [
      "Equals/Is에 null argument가 들어가면 Spring Data JPA derived query는 IS NULL 의미를 만들 수 있지만 API에서 null이 필터 없음인지 null field 검색인지 먼저 결정해야 합니다. optional filter를 method overload 폭증으로 해결하지 않습니다.",
      "In/NotIn의 빈 collection, null element와 매우 큰 collection은 provider/database별 SQL과 semantics가 다를 수 있습니다. controller/service에서 empty policy와 maximum cardinality를 검증하고 repository에 명시된 값만 전달합니다.",
      "StartingWith, EndingWith, Containing 계열 derived predicate는 인자의 SQL 표준 LIKE wildcard를 sanitize하고 configured escape character를 사용합니다. 직접 @Query LIKE를 쓰면 Spring Data의 escape()/escapeCharacter() 또는 동등한 parameter escaping을 명시해야 합니다.",
      "contains 검색은 앞쪽 % 때문에 일반 B-tree range lookup을 쓰기 어렵습니다. 기능이 성장하면 prefix 검색, full-text index 또는 별도 search system을 query plan과 언어/collation 요구로 선택합니다.",
    ],
    concepts: [
      c("null semantics", "null parameter가 조건 미적용, IS NULL 또는 invalid 중 무엇인지 정한 API/repository 규칙입니다.", ["endpoint별로 명시합니다.", "Optional과 혼동하지 않습니다."]),
      c("LIKE escaping", "%와 _ 같은 pattern meta-character를 literal로 검색하도록 escape하는 규칙입니다.", ["escape character도 명시합니다.", "bind parameter와 함께 씁니다."]),
      c("search selectivity", "조건이 전체 row 중 얼마나 좁은 범위를 선택하는지 나타내는 특성입니다.", ["index usefulness에 영향 줍니다.", "실제 통계를 측정합니다."]),
    ],
    codeExamples: [java("jpa06-like-escape", "LIKE literal과 wildcard 정책 분리", "Jpa06LikeEscape.java", "synthetic 검색어의 %, _, escape character를 literal로 변환해 contains와 prefix pattern을 결정적으로 만듭니다.", String.raw`public class Jpa06LikeEscape {
  static String escape(String value, char marker) {
    String m = String.valueOf(marker);
    return value.replace(m, m + m).replace("%", m + "%").replace("_", m + "_");
  }
  public static void main(String[] args) {
    String synthetic = "50%_fixture!";
    String escaped = escape(synthetic, '!');
    System.out.println("escaped=" + escaped);
    System.out.println("contains=%" + escaped + "%");
    System.out.println("prefix=" + escaped + "%");
    System.out.println("escape-marker=!");
    System.out.println("raw-concatenation=false");
  }
}`, "escaped=50!%!_fixture!!\ncontains=%50!%!_fixture!!%\nprefix=50!%!_fixture!!%\nescape-marker=!\nraw-concatenation=false", ["spring-data-jpa-query-methods", "mysql-range-optimization"])],
    diagnostics: [d("literal % 검색이 전체 row를 반환하거나 빈 IN 조건에서 SQL 오류·예상 밖 결과가 납니다.", "null/empty/wildcard semantics와 cardinality cap이 repository boundary에 없습니다.", ["derived keyword", "actual bind value shape", "escape character", "empty collection", "EXPLAIN/selectivity"], "filter DTO에서 null/empty/literal-pattern 정책을 검증하고 documented derived 또는 escaped declared query를 사용합니다.", "null/empty/%/_/escape/large-IN fixture와 plan regression tests를 둡니다.")],
    expertNotes: ["parameter binding은 SQL injection을 막는 기본이지만 wildcard가 넓히는 검색 범위와 resource abuse까지 자동 해결하지 않습니다.", "case-insensitive 검색은 lower(column)만 붙이지 말고 collation, functional index와 언어 규칙을 함께 검증합니다."],
  },
  {
    id: "sort-allowlist-stable-order",
    title: "Sort를 공개 field allow-list와 유일한 tie-breaker로 안정화합니다",
    lead: "정렬 기준이 없거나 동률에서 유일하지 않으면 같은 page 요청이 중복·누락·순서 흔들림을 만듭니다.",
    explanations: [
      "client sort token을 entity property 문자열로 그대로 전달하지 않고 public field→entity path allow-list로 변환합니다. unknown field, nested association, function과 excessive order count를 거절해 query shape와 비용을 통제합니다.",
      "primary business sort 뒤에 immutable unique key를 같은 방향의 tie-breaker로 추가합니다. 예를 들어 registeredAt DESC만 사용하면 같은 timestamp row의 순서가 미정이므로 idx DESC를 뒤에 둡니다.",
      "null precedence는 Sort.NullHandling이 datastore hint일 수 있으므로 target provider/database SQL과 실제 null order를 검증합니다. public contract가 필요하면 explicit expression, normalized non-null column 또는 DB-supported null precedence를 사용합니다.",
      "JpaSort.unsafe 같은 function sort는 일반 user input으로 만들지 않고 reviewed fixed expression만 내부 allow-list에 둡니다. sort가 index와 맞지 않으면 filesort/temp와 큰 scan이 발생할 수 있습니다.",
    ],
    concepts: [
      c("sort allow-list", "외부 sort 이름을 검증된 entity path·direction으로만 변환하는 목록입니다.", ["unknown을 거절합니다.", "association/function을 제한합니다."]),
      c("stable ordering", "같은 dataset과 sort에서 row 순서가 완전히 결정되는 ordering입니다.", ["unique tie-breaker가 필요합니다.", "pagination의 전제입니다."]),
      c("null precedence", "null이 non-null 값보다 앞/뒤 어느 위치에 오는지 정한 ordering 규칙입니다.", ["DB마다 다를 수 있습니다.", "실제 SQL로 검증합니다."]),
    ],
    codeExamples: [java("jpa06-stable-order", "동률을 unique idx로 깨는 안정 정렬", "Jpa06StableOrder.java", "동일 priority를 가진 synthetic rows를 priority DESC, idx DESC로 완전히 정렬합니다.", String.raw`import java.util.*;

public class Jpa06StableOrder {
  record Row(long idx, int priority) {}
  public static void main(String[] args) {
    List<Row> rows = new ArrayList<>(List.of(
      new Row(1, 7), new Row(4, 9), new Row(2, 7), new Row(3, 9)));
    rows.sort(Comparator.comparingInt(Row::priority).reversed()
      .thenComparing(Comparator.comparingLong(Row::idx).reversed()));
    System.out.println("ids=" + rows.stream().map(Row::idx).toList());
    System.out.println("priorities=" + rows.stream().map(Row::priority).toList());
    System.out.println("primary=priority-desc");
    System.out.println("tie-breaker=idx-desc");
    System.out.println("fully-ordered=true");
  }
}`, "ids=[4, 3, 2, 1]\npriorities=[9, 9, 7, 7]\nprimary=priority-desc\ntie-breaker=idx-desc\nfully-ordered=true", ["spring-data-sort-api", "hibernate-user-guide", "mysql-limit-optimization"])],
    diagnostics: [d("페이지를 새로고침할 때 row 순서가 바뀌거나 경계 row가 두 page에 중복됩니다.", "ORDER BY가 없거나 non-unique field 하나로만 정렬했습니다.", ["generated ORDER BY", "duplicate sort values", "unique tie-breaker", "null behavior", "index order"], "public sort allow-list를 적용하고 마지막에 immutable unique key를 추가합니다.", "동률·null·동시 insert/update pagination tests와 plan check를 둡니다.")],
    expertNotes: ["primary key tie-breaker는 순서를 결정하지만 business snapshot isolation을 제공하지는 않습니다.", "random/function sort는 pagination·cache·index 비용이 크므로 별도 bounded use case로 격리합니다."],
  },
  {
    id: "pageable-offset-input-caps",
    title: "Pageable의 0-based offset와 외부 page·size·sort 입력에 상한을 둡니다",
    lead: "Pageable을 controller에 그대로 받으면 unpaged, 과대 size, 깊은 offset과 임의 sort가 public resource API가 될 수 있습니다.",
    explanations: [
      "PageRequest는 0-based page number와 positive size를 사용합니다. UI가 1-based이면 HTTP adapter에서 한 번만 변환하고 negative/overflow를 거절해 service/repository 내부는 0-based로 통일합니다.",
      "default size, maximum size, maximum offset/window, sort field 수와 allowed directions를 endpoint policy로 둡니다. Pageable.unpaged를 외부 요청에서 허용하지 않고 export/batch는 별도 asynchronous capability로 분리합니다.",
      "offset은 page×size이며 깊어질수록 DB가 앞 row를 찾아 건너뛰는 비용이 커질 수 있습니다. integer overflow, extremely deep page와 empty response를 정상 계약으로 처리하되 비용 전에 reject 또는 cursor로 전환합니다.",
      "Spring Data web binding default만 신뢰하지 않고 controller adapter가 normalized PageRequest를 service에 전달합니다. monitoring label에는 raw filter/sort values 대신 bounded page-size/offset buckets와 outcome만 둡니다.",
    ],
    concepts: [
      c("offset pagination", "앞에서 일정 row 수를 건너뛴 뒤 제한된 개수를 읽는 pagination입니다.", ["임의 page 이동이 쉽습니다.", "깊은 offset 비용이 큽니다."]),
      c("page budget", "한 요청이 허용받는 size, offset, sort와 execution time의 상한입니다.", ["endpoint별로 둡니다.", "unpaged를 막습니다."]),
      c("normalization boundary", "외부 page/sort 표현을 검증된 내부 Pageable 계약으로 한 번 변환하는 adapter 경계입니다.", ["0/1-based를 통일합니다.", "unknown sort를 거절합니다."]),
    ],
    codeExamples: [java("jpa06-query-budget", "page size·offset·sort allow-list 정규화", "Jpa06QueryBudget.java", "외부 요청을 maximum size/window와 sort allow-list가 적용된 내부 budget으로 변환합니다.", String.raw`import java.util.*;

public class Jpa06QueryBudget {
  record Request(int page, int size, String sort, String direction) {}
  record Budget(int page, int size, String sort, String direction, int offset) {}
  static final Set<String> SORTS = Set.of("idx", "registeredAt");
  static Budget normalize(Request request) {
    if (request.page() < 0 || request.size() <= 0 || !SORTS.contains(request.sort()))
      throw new IllegalArgumentException("invalid request");
    String direction = request.direction().equalsIgnoreCase("asc") ? "ASC" : "DESC";
    int size = Math.min(request.size(), 100);
    long offset = (long) request.page() * size;
    if (offset > 10_000) throw new IllegalArgumentException("window exceeded");
    return new Budget(request.page(), size, request.sort(), direction, (int) offset);
  }
  static String outcome(Request request) {
    try { return normalize(request).toString(); }
    catch (IllegalArgumentException ex) { return "REJECTED"; }
  }
  public static void main(String[] args) {
    System.out.println("normal=" + outcome(new Request(2, 20, "idx", "desc")));
    System.out.println("clamped=" + outcome(new Request(1, 500, "registeredAt", "asc")));
    System.out.println("unknown-sort=" + outcome(new Request(0, 20, "internalField", "asc")));
    System.out.println("deep-offset=" + outcome(new Request(101, 100, "idx", "desc")));
    System.out.println("unpaged-public=false");
  }
}`, "normal=Budget[page=2, size=20, sort=idx, direction=DESC, offset=40]\nclamped=Budget[page=1, size=100, sort=registeredAt, direction=ASC, offset=100]\nunknown-sort=REJECTED\ndeep-offset=REJECTED\nunpaged-public=false", ["spring-data-pageable-api", "spring-data-limit-api", "spring-data-sort-api", "mysql-limit-optimization", "mysql-explain", "mysql-composite-index"])],
    diagnostics: [d("size가 수십만이거나 깊은 page 요청으로 heap·DB latency가 급증합니다.", "public Pageable에 maximum size/window/sort allow-list가 없습니다.", ["resolved Pageable", "page×size overflow", "unpaged use", "rows examined", "request latency/heap"], "HTTP adapter에서 default/max/window/sort를 정규화하고 deep traversal은 cursor/export로 분리합니다.", "negative/zero/huge/overflow/unpaged/unknown-sort tests와 resource SLO를 둡니다.")],
    expertNotes: ["빈 deep page도 DB가 앞 row를 건너뛰는 비용을 이미 지불했을 수 있습니다.", "global default 하나보다 endpoint cardinality와 use case에 맞는 caps를 둡니다."],
  },
  {
    id: "page-slice-list-count-query",
    title: "Page·Slice·List를 total count 필요 여부와 query 비용으로 선택합니다",
    lead: "Page는 content만 담는 container가 아니라 total을 계산하기 위한 추가 count query 계약을 동반할 수 있습니다.",
    explanations: [
      "Page<T>는 content, total elements/pages를 제공하기 위해 보통 content query와 count query를 실행합니다. 복잡한 join/group/distinct에서는 derived count가 느리거나 잘못된 shape가 될 수 있어 explicit countQuery와 fixture가 필요합니다.",
      "Slice<T>는 요청 size보다 한 row를 더 읽어 hasNext를 판단하고 total을 약속하지 않습니다. 무한 scroll/다음 버튼처럼 total이 불필요한 UX에는 count를 피하는 장점이 있습니다.",
      "List<T>에 Pageable을 받으면 제한·정렬은 적용하되 Page metadata를 만들지 않는 선택이 가능합니다. return type은 controller convenience가 아니라 product가 정말 total/next 여부를 요구하는지로 결정합니다.",
      "count와 content는 별도 statement라 concurrent change와 isolation에 따라 서로 다른 순간을 볼 수 있습니다. exact total snapshot이 필요한지, eventual navigation metadata면 되는지 명시합니다.",
    ],
    concepts: [
      c("Page", "현재 content와 전체 element/page 수 metadata를 제공하는 chunk입니다.", ["count query가 필요할 수 있습니다.", "total snapshot을 과신하지 않습니다."]),
      c("Slice", "현재 content와 next 존재 여부만 제공하는 chunk입니다.", ["size+1을 읽을 수 있습니다.", "total을 계산하지 않습니다."]),
      c("count query", "filter 결과의 전체 개수를 계산해 Page metadata를 만드는 별도 query입니다.", ["content query와 shape가 다릅니다.", "독립 plan을 검증합니다."]),
    ],
    codeExamples: [java("jpa06-page-slice", "Page total과 Slice hasNext 비용 비교", "Jpa06PageSlice.java", "같은 synthetic rows에서 Page는 total을 계산하고 Slice는 size+1로 다음 존재만 판단합니다.", String.raw`import java.util.*;

public class Jpa06PageSlice {
  record PageView(List<String> content, long total, int totalPages) {}
  record SliceView(List<String> content, boolean hasNext) {}
  static PageView page(List<String> rows, int page, int size) {
    int from = Math.min(page * size, rows.size());
    int to = Math.min(from + size, rows.size());
    return new PageView(rows.subList(from, to), rows.size(), Math.ceilDiv(rows.size(), size));
  }
  static SliceView slice(List<String> rows, int page, int size) {
    int from = Math.min(page * size, rows.size());
    int probeTo = Math.min(from + size + 1, rows.size());
    List<String> probe = rows.subList(from, probeTo);
    return new SliceView(probe.subList(0, Math.min(size, probe.size())), probe.size() > size);
  }
  public static void main(String[] args) {
    List<String> rows = List.of("row-a", "row-b", "row-c", "row-d", "row-e");
    System.out.println("page=" + page(rows, 1, 2));
    System.out.println("slice-middle=" + slice(rows, 1, 2));
    System.out.println("slice-last=" + slice(rows, 2, 2));
    System.out.println("page-needs-total=true");
    System.out.println("slice-needs-total=false");
  }
}`, "page=PageView[content=[row-c, row-d], total=5, totalPages=3]\nslice-middle=SliceView[content=[row-c, row-d], hasNext=true]\nslice-last=SliceView[content=[row-e], hasNext=false]\npage-needs-total=true\nslice-needs-total=false", ["spring-data-commons-query-details", "spring-data-pageable-api", "spring-data-page-api", "spring-data-slice-api"])],
    diagnostics: [d("목록 query는 빠른데 total 계산 때문에 응답이 느리거나 total과 content가 어긋납니다.", "Page를 관성적으로 선택하고 count plan/isolation을 검증하지 않았습니다.", ["SQL query count", "content/count SQL", "join/distinct", "Page vs Slice UX", "transaction isolation"], "total이 필요할 때만 Page를 쓰고 countQuery를 단순화·검증하며 나머지는 Slice/List를 선택합니다.", "content/count plan, empty/last/concurrent-change tests와 separate latency metrics를 둡니다.")],
    expertNotes: ["Page total은 영구 사실이 아니라 조회 시점의 metadata입니다.", "count cache를 추가하면 invalidation과 freshness를 API 계약에 포함해야 합니다."],
  },
  {
    id: "offset-drift-snapshot-consistency",
    title: "offset page 사이의 insert·delete·update가 만드는 drift를 설계 대상으로 둡니다",
    lead: "안정 정렬만으로도 요청 사이 dataset 변경 때문에 offset 경계가 이동해 중복과 누락이 생길 수 있습니다.",
    explanations: [
      "page 0을 읽은 뒤 앞쪽에 새 row가 삽입되면 page 1 offset은 한 칸 밀려 이전 row를 다시 포함할 수 있습니다. 반대로 앞 row 삭제나 sort field update는 아직 보지 못한 row를 건너뛸 수 있습니다.",
      "관리 화면의 임의 page 이동처럼 offset UX가 중요하면 drift 가능성을 문서화하고 refresh, snapshot token, bounded date range 또는 database-consistent export를 별도 기능으로 제공합니다.",
      "snapshot isolation을 여러 HTTP 요청에 길게 유지하는 것은 connection/undo/resource 비용이 크므로 일반 API에 숨겨 넣지 않습니다. snapshot identifier나 immutable dataset version이 있는 domain에서만 명시적으로 설계합니다.",
      "다음 항목 연속 탐색이 목적이면 마지막 sort key 이후를 읽는 keyset pagination이 offset drift와 deep scan을 줄입니다. 하지만 뒤로/임의 page 이동과 arbitrary sort 지원은 별도 trade-off입니다.",
    ],
    concepts: [
      c("pagination drift", "서로 다른 page 요청 사이 dataset 변경으로 offset 경계가 이동하는 현상입니다.", ["중복·누락이 생깁니다.", "stable order만으로 끝나지 않습니다."]),
      c("snapshot", "조회 대상과 순서를 특정 논리 시점으로 고정한 view입니다.", ["비용과 수명이 있습니다.", "token/version을 설계합니다."]),
      c("navigation contract", "임의 page, next-only, back, refresh 중 어떤 이동과 consistency를 보장하는지 정한 UX/API 규칙입니다.", ["pagination 방식을 결정합니다.", "변경 중 behavior를 명시합니다."]),
    ],
    diagnostics: [d("스크롤 중 같은 row가 다시 보이거나 일부 row가 영원히 건너뛰어집니다.", "offset 요청 사이 insert/delete/sort update를 고려하지 않았습니다.", ["ORDER BY uniqueness", "request timestamps", "concurrent writes", "offset boundaries", "navigation requirement"], "next-only 흐름은 keyset으로 전환하고 offset UX에는 refresh/snapshot/drift 정책을 명시합니다.", "page 경계 직전 insert/delete/update concurrency fixture를 반복 실행합니다.")],
    expertNotes: ["keyset도 이미 본 row 자체가 수정·삭제되는 것을 막지는 않으므로 product freshness 규칙이 필요합니다.", "export는 웹 page 반복 호출보다 transactionally defined batch/snapshot job이 더 적합할 수 있습니다."],
  },
  {
    id: "keyset-window-scroll-position",
    title: "Window·ScrollPosition keyset을 non-null sort key와 exclusive cursor로 설계합니다",
    lead: "cursor 문자열만 암호처럼 만들면 ordering tuple, 방향, filter와 version을 복원·검증할 수 없습니다.",
    explanations: [
      "keyset query는 마지막 row의 ordered properties를 predicate에 포함해 그 뒤 row를 읽습니다. registeredAt DESC, idx DESC라면 둘의 lexicographic 조건과 같은 ORDER BY를 사용하고 cursor는 exclusive입니다.",
      "Spring Data ScrollPosition/Window는 offset 또는 keyset scrolling을 표현합니다. keyset extraction에는 모든 sort properties가 result entity/projection에 포함돼야 하며 keyset fields는 nullable하지 않도록 설계해야 합니다.",
      "cursor payload에는 version, filter/sort fingerprint, direction과 typed key values를 담고 integrity/authenticity를 보호합니다. raw PII나 secret을 넣지 않고 TTL·query change·invalid cursor를 stable 400 problem으로 처리합니다.",
      "keyset-friendly composite index는 filter equality와 ordered columns의 leftmost prefix를 query/order 방향에 맞춰 검증합니다. fallback offset을 조용히 사용하지 말고 plan과 rows examined를 release gate로 둡니다.",
    ],
    concepts: [
      c("keyset pagination", "마지막 row의 ordered key tuple 이후를 조건으로 다음 window를 읽는 방식입니다.", ["deep offset을 피합니다.", "unique order가 필요합니다."]),
      c("ScrollPosition", "다음 scroll query가 시작할 exclusive 위치를 표현하는 Spring Data 값입니다.", ["offset/keyset 종류가 있습니다.", "initial position을 구분합니다."]),
      c("cursor fingerprint", "cursor가 어떤 filter·sort·version에 속하는지 검증하는 bounded metadata입니다.", ["변조를 막습니다.", "PII를 넣지 않습니다."]),
    ],
    codeExamples: [java("jpa06-keyset-window", "복합 sort key 이후의 exclusive window", "Jpa06KeysetWindow.java", "score DESC, idx DESC ordering에서 cursor 뒤 size+1 row를 읽어 content, hasNext와 다음 cursor를 계산합니다.", String.raw`import java.util.*;

public class Jpa06KeysetWindow {
  record Row(long idx, int score) {}
  record Cursor(int score, long idx) {}
  record Window(List<Long> ids, boolean hasNext, Cursor next) {}
  static Window after(List<Row> ordered, Cursor cursor, int size) {
    List<Row> eligible = ordered.stream().filter(row ->
      row.score() < cursor.score() || row.score() == cursor.score() && row.idx() < cursor.idx()).toList();
    List<Row> content = eligible.subList(0, Math.min(size, eligible.size()));
    Row last = content.getLast();
    return new Window(content.stream().map(Row::idx).toList(), eligible.size() > size,
      new Cursor(last.score(), last.idx()));
  }
  public static void main(String[] args) {
    List<Row> ordered = List.of(new Row(5,10), new Row(4,9), new Row(3,9), new Row(2,8), new Row(1,7));
    Window window = after(ordered, new Cursor(9,4), 2);
    System.out.println("ids=" + window.ids());
    System.out.println("has-next=" + window.hasNext());
    System.out.println("next=" + window.next());
    System.out.println("cursor-exclusive=true");
    System.out.println("sort=score-desc,idx-desc");
  }
}`, "ids=[3, 2]\nhas-next=true\nnext=Cursor[score=8, idx=2]\ncursor-exclusive=true\nsort=score-desc,idx-desc", ["spring-data-commons-scrolling", "spring-data-window-api", "spring-data-scroll-position-api", "spring-data-limit-api", "mysql-composite-index"])],
    diagnostics: [d("cursor 다음 요청이 첫 row를 반복하거나 projection에서 key를 추출하지 못합니다.", "exclusive comparison, unique tie-breaker 또는 sort properties가 result에 없습니다.", ["cursor tuple/direction", "strict vs inclusive operator", "projection fields", "null sort keys", "composite index/plan"], "non-null unique ordered tuple과 versioned filter-bound cursor를 사용하고 모든 sort properties를 projection에 포함합니다.", "tie/null/first/last/tampered/filter-changed cursor와 plan tests를 둡니다.")],
    expertNotes: ["cursor를 base64로 인코딩하는 것만으로 무결성·기밀성이 생기지 않습니다.", "복합 sort direction/null handling을 바꾸면 cursor schema와 index도 함께 versioning해야 합니다."],
  },
  {
    id: "top-first-limit-resource-contract",
    title: "Top·First·Limit을 maximum result와 timeout·cancellation·export 경계로 묶습니다",
    lead: "limit keyword 하나만으로 large filter, slow sort, timeout과 response serialization 비용이 제한되는 것은 아닙니다.",
    explanations: [
      "Top/First와 optional 숫자는 method에 static maximum을 부여하고 Limit parameter는 dynamic result cap을 표현합니다. Pageable과 조합할 때 limiting expression 안에서 pagination이 적용되는 semantics를 공식 문서와 실제 query로 확인합니다.",
      "limit은 반환 row 수를 줄이지만 selective predicate/index가 없으면 DB가 많은 row를 scan/sort할 수 있습니다. max size와 함께 query timeout, connection pool budget, statement cancellation, response byte cap을 운영합니다.",
      "stream/large export는 controller transaction에서 unbounded entity를 직렬화하지 않습니다. chunked batch, snapshot/freshness, cancellation, retry/idempotency, encrypted artifact와 expiry를 별도 job 계약으로 둡니다.",
      "repository method별 expected maximum, cardinality, sort/index, p95/p99 time와 rows examined budget을 기록합니다. limit 없는 List 조회는 작은 bounded table이라는 증거가 없으면 release gate에서 거절합니다.",
    ],
    concepts: [
      c("result limit", "query가 반환할 최대 row 수를 static Top/First 또는 dynamic Limit으로 제한한 값입니다.", ["scan 비용과 다릅니다.", "positive cap을 둡니다."]),
      c("resource cap", "row, bytes, time, memory, connection과 concurrency에 둔 bounded 실행 한도입니다.", ["계층별로 필요합니다.", "cancellation을 검증합니다."]),
      c("export boundary", "interactive page와 대량 추출을 서로 다른 execution/security/lifecycle로 분리한 경계입니다.", ["async job이 적합할 수 있습니다.", "artifact expiry를 둡니다."]),
    ],
    diagnostics: [d("Top100 query인데도 DB CPU가 치솟고 timeout 뒤 statement가 계속 실행됩니다.", "return limit을 scan/sort/time/cancellation cap으로 오해했습니다.", ["rows examined", "sort/temp", "statement timeout", "client cancellation", "response bytes"], "selective index와 limit, timeout/cancellation, concurrency/byte caps를 함께 적용합니다.", "slow-plan, timeout, disconnect, pool saturation과 export cancellation tests를 둡니다.")],
    expertNotes: ["limit이 작아도 leading wildcard나 function sort는 큰 work를 만들 수 있습니다.", "repository timeout annotation/hint는 transaction timeout과 driver/database behavior를 actual stack에서 검증해야 합니다."],
  },
  {
    id: "projection-query-shape-boundary",
    title: "interface·class DTO projection으로 공개 shape와 select list를 의도적으로 줄입니다",
    lead: "Entity 전체를 page로 읽고 controller에서 일부 field만 버리면 hydration, lazy loading과 민감 field 경계가 이미 넓어졌습니다.",
    explanations: [
      "closed interface projection, class/record DTO projection과 dynamic projection은 use case별 필요한 attributes만 표현할 수 있습니다. constructor parameter names/types와 JPQL constructor expression 또는 query rewriting 조건을 검증합니다.",
      "projection은 authorization을 대신하지 않습니다. 먼저 caller가 resource를 볼 수 있는지 결정하고 role/use case별 allow-listed fields만 projection·response DTO에 포함합니다. entity getter/toString/serializer의 우연한 노출을 피합니다.",
      "nested projection은 join과 full associated entity materialization을 유발할 수 있고 computed open projection은 select optimization을 제한할 수 있습니다. generated SQL select list, joins와 query count를 확인합니다.",
      "keyset projection은 모든 sort keys를 포함해야 하지만 public JSON에는 내부 cursor key를 별도 mapper에서 숨길 수 있습니다. persistence read model과 wire DTO를 같은 class로 강제하지 않습니다.",
    ],
    concepts: [
      c("closed projection", "accessor가 aggregate properties와 정확히 대응해 select optimization이 가능한 projection입니다.", ["필요 field만 표현합니다.", "nested join을 검토합니다."]),
      c("DTO projection", "constructor로 필요한 scalar 결과를 직접 만드는 application read model입니다.", ["entity lifecycle과 분리합니다.", "constructor signature를 고정합니다."]),
      c("query shape", "select columns, joins, predicates, order와 returned row 수를 합친 실제 database work 구조입니다.", ["return Java type만으로 알 수 없습니다.", "SQL로 검증합니다."]),
    ],
    codeExamples: [java("jpa06-projection", "내부 row를 최소 read DTO로 투영하기", "Jpa06Projection.java", "sensitive fixture가 포함된 내부 row에서 identifier와 subject만 가진 immutable summary를 생성합니다.", String.raw`public class Jpa06Projection {
  record InternalRow(long idx, String subject, String sensitiveVerifier) {}
  record Summary(long idx, String subject) {}
  static Summary project(InternalRow row) { return new Summary(row.idx(), row.subject()); }
  public static void main(String[] args) {
    InternalRow row = new InternalRow(7, "SUBJECT_FIXTURE", "SENSITIVE_FIXTURE");
    Summary summary = project(row);
    System.out.println("summary=" + summary);
    System.out.println("selected-fields=[idx, subject]");
    System.out.println("sensitive-field-selected=false");
    System.out.println("entity-returned=false");
    System.out.println("immutable=true");
  }
}`, "summary=Summary[idx=7, subject=SUBJECT_FIXTURE]\nselected-fields=[idx, subject]\nsensitive-field-selected=false\nentity-returned=false\nimmutable=true", ["spring-data-jpa-projections", "jakarta-persistence-32", "hibernate-user-guide"])],
    diagnostics: [d("목록 조회가 불필요한 large/sensitive columns와 association을 읽거나 직렬화 중 lazy query를 냅니다.", "Entity 전체 hydration 뒤 controller에서 field를 제거했습니다.", ["generated SELECT list", "joins/query count", "projection type", "serializer fields", "authorization"], "use case별 closed/DTO projection과 explicit response mapper를 두고 SQL·JSON allow-list를 검증합니다.", "select-column/query-count/schema/sensitive-canary tests를 둡니다.")],
    expertNotes: ["projection이 짧다는 이유만으로 query가 싸다고 가정하지 말고 nested path와 provider SQL을 봅니다.", "public DTO와 repository projection을 분리하면 cursor/internal fields와 version evolution을 통제하기 쉽습니다."],
  },
  {
    id: "query-plan-index-observability-tests",
    title: "content·count·keyset query plan과 복합 index를 실제 분포에서 release gate로 검증합니다",
    lead: "method 이름이 읽기 좋아도 rows examined, filesort와 count scan이 크면 운영 조회 계약은 실패입니다.",
    explanations: [
      "generated SQL과 bind shape를 synthetic dataset에서 capture하고 content/count/keyset 각각 EXPLAIN 및 필요한 경우 안전한 EXPLAIN ANALYZE를 실행합니다. actual user values나 credentials를 plan artifact에 넣지 않습니다.",
      "복합 index는 equality filter, range와 ORDER BY의 순서·방향, leftmost prefix를 query workload에 맞춥니다. 모든 filter 조합에 index를 추가하지 않고 write cost, storage와 optimizer choice를 함께 측정합니다.",
      "fixture는 empty, one, duplicate sort values, null policy, skewed active distribution, large history와 concurrent writes를 포함합니다. 작은 H2 결과만으로 MySQL collation, limit/offset와 index plan을 승인하지 않습니다.",
      "관측은 repository operation id, page mode, size/offset bucket, result-count bucket, content/count latency, rows-examined/plan fingerprint와 timeout outcome을 bounded labels로 기록합니다. raw filter, writer, subject 또는 SQL bind를 metric에 넣지 않습니다.",
    ],
    concepts: [
      c("execution plan", "optimizer가 table/index 접근, join, sort와 row estimate를 선택한 실행 전략입니다.", ["EXPLAIN으로 확인합니다.", "데이터 분포에 따라 바뀝니다."]),
      c("composite index", "여러 columns를 정해진 순서로 묶어 filter/order를 지원하는 index입니다.", ["leftmost prefix가 중요합니다.", "write cost가 있습니다."]),
      c("plan fingerprint", "raw SQL 값 없이 query/plan shape 변화를 비교하는 bounded 식별입니다.", ["회귀 감지에 씁니다.", "version을 기록합니다."]),
    ],
    diagnostics: [d("production에서만 page latency가 급증하고 count가 full scan하지만 회귀를 찾을 evidence가 없습니다.", "실제 MySQL 분포·plan·content/count metrics 없이 unit test만 통과했습니다.", ["generated SQL", "content/count EXPLAIN", "index leftmost prefix", "statistics/skew", "plan/latency history"], "production-like synthetic distribution에서 plan budget을 정하고 schema/query change마다 회귀 비교합니다.", "Testcontainers/MySQL integration, query-count, plan-shape와 load/cancellation gates를 둡니다.")],
    expertNotes: ["EXPLAIN ANALYZE는 query를 실제 실행하므로 write statement, large workload와 production 사용을 엄격히 통제합니다.", "index hint로 증상을 고정하기 전에 statistics, query shape와 index design의 근본 원인을 확인합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-repository", repository: "nohssam/2026-spring-jpa-test learning source", path: "2026-spring-jpa-test\\src\\main\\java\\com\\study\\jpatest\\guestbook\\repository\\GuestBookRepository.java", usedFor: ["JpaRepository signature", "derived findByActive", "three JPQL examples", "absence of pagination features"], evidence: "2026-07-14 read-only audit: 30 lines, 1,044 bytes, SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900." },
  { id: "spring-data-jpa-query-methods", repository: "Spring Data JPA", path: "reference/jpa/query-methods.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html", usedFor: ["query derivation", "declared queries", "LIKE sanitizing", "dynamic sort/count"], evidence: "Spring Data JPA 공식 query methods reference입니다." },
  { id: "spring-data-jpa-keywords", repository: "Spring Data JPA", path: "reference/repositories/query-keywords-reference.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/query-keywords-reference.html", usedFor: ["subject/predicate keywords", "return forms"], evidence: "Spring Data JPA 공식 repository query keywords appendix입니다." },
  { id: "spring-data-commons-query-details", repository: "Spring Data Commons", path: "reference/repositories/query-methods-details.html", publicUrl: "https://docs.spring.io/spring-data/commons/reference/repositories/query-methods-details.html", usedFor: ["property traversal", "reserved methods", "Page/Slice/List", "Sort/Pageable/Limit"], evidence: "Spring Data Commons 공식 query method details입니다." },
  { id: "spring-data-commons-scrolling", repository: "Spring Data Commons", path: "reference/repositories/scrolling.html", publicUrl: "https://docs.spring.io/spring-data/commons/reference/repositories/scrolling.html", usedFor: ["offset/keyset scrolling", "Window", "keyset projection requirements"], evidence: "Spring Data Commons 공식 scrolling reference입니다." },
  { id: "spring-data-jpa-projections", repository: "Spring Data JPA", path: "reference/repositories/projections.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html", usedFor: ["interface/class/dynamic projections", "query rewriting", "nested projection caveats"], evidence: "Spring Data JPA 공식 projections reference입니다." },
  { id: "spring-data-pageable-api", repository: "Spring Data Commons API", path: "domain/Pageable.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Pageable.html", usedFor: ["page number/size/offset", "unpaged", "Limit/ScrollPosition conversion"], evidence: "Spring Data current official Pageable API입니다." },
  { id: "spring-data-page-api", repository: "Spring Data Commons API", path: "domain/Page.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Page.html", usedFor: ["total elements/pages", "Page semantics"], evidence: "Spring Data current official Page API입니다." },
  { id: "spring-data-slice-api", repository: "Spring Data Commons API", path: "domain/Slice.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Slice.html", usedFor: ["hasNext", "Slice navigation"], evidence: "Spring Data current official Slice API입니다." },
  { id: "spring-data-sort-api", repository: "Spring Data Commons API", path: "domain/Sort.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Sort.html", usedFor: ["orders/direction/null handling", "typed sorting contract"], evidence: "Spring Data current official Sort API입니다." },
  { id: "spring-data-limit-api", repository: "Spring Data Commons API", path: "domain/Limit.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Limit.html", usedFor: ["dynamic maximum result", "limited/unlimited"], evidence: "Spring Data current official Limit API입니다." },
  { id: "spring-data-window-api", repository: "Spring Data Commons API", path: "domain/Window.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Window.html", usedFor: ["scroll window", "position and hasNext"], evidence: "Spring Data current official Window API입니다." },
  { id: "spring-data-scroll-position-api", repository: "Spring Data Commons API", path: "domain/ScrollPosition.html", publicUrl: "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/ScrollPosition.html", usedFor: ["initial/offset/keyset positions", "exclusive scrolling"], evidence: "Spring Data current official ScrollPosition API입니다." },
  { id: "jakarta-persistence-32", repository: "Jakarta Persistence", path: "specifications/persistence/3.2/jakarta-persistence-spec-3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["JPQL/entity property semantics", "query result and pagination API boundary"], evidence: "Jakarta Persistence 3.2 공식 specification입니다." },
  { id: "hibernate-user-guide", repository: "Hibernate ORM", path: "current/userguide/html_single/Hibernate_User_Guide.html", publicUrl: "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html", usedFor: ["provider query/order/projection behavior", "generated SQL verification"], evidence: "Hibernate ORM current official user guide입니다." },
  { id: "mysql-limit-optimization", repository: "MySQL 8.4", path: "refman/8.4/en/limit-optimization.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html", usedFor: ["LIMIT/ORDER BY behavior", "nondeterministic ties", "offset work"], evidence: "MySQL 8.4 공식 LIMIT optimization 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4", path: "refman/8.4/en/explain.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["execution plans", "EXPLAIN ANALYZE", "rows and access evidence"], evidence: "MySQL 8.4 공식 EXPLAIN 문서입니다." },
  { id: "mysql-composite-index", repository: "MySQL 8.4", path: "refman/8.4/en/multiple-column-indexes.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html", usedFor: ["leftmost prefix", "filter/order composite index"], evidence: "MySQL 8.4 공식 multiple-column indexes 문서입니다." },
  { id: "mysql-range-optimization", repository: "MySQL 8.4", path: "refman/8.4/en/range-optimization.html", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html", usedFor: ["range access", "LIKE leading wildcard boundary"], evidence: "MySQL 8.4 공식 range optimization 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-06-derived-query-pageable", slug: "jpa-06-derived-query-pageable", courseId: "spring", moduleId: "spring-data-jpa", order: 6,
  title: "쿼리 메서드·Pageable·Sort 보강", subtitle: "원본 List/JPQL Repository를 파생 문법·Page/Slice/count·stable/keyset pagination·projection·plan budget으로 확장합니다",
  level: "고급", estimatedMinutes: 95,
  coreQuestion: "파생 query method의 편의성을 유지하면서 null/wildcard·정렬·count·deep pagination·projection과 MySQL plan 비용을 어떻게 명시적이고 bounded한 조회 계약으로 만들까요?",
  summary: "2026-spring-jpa-test의 GuestBookRepository.java를 read-only로 감사해 JpaRepository, findByActive derived query와 constant/positional/named JPQL 세 method를 정확한 provenance로 사용합니다. 원본에 없는 Pageable/Page/Slice/Sort/Limit/Window/projection/index를 이미 구현됐다고 가정하지 않습니다. subject/predicate/property/reserved grammar, null·empty·LIKE escaping, public sort allow-list와 unique tie-breaker, 0-based page/size/offset caps, Page count 대 Slice size+1, concurrent offset drift, exclusive keyset cursor와 non-null sort keys, Top/First/Limit·timeout/export resource boundary, interface/DTO projection, content/count/keyset EXPLAIN·composite index·zero-value observability까지 초보 query name에서 production read path로 연결합니다. 일곱 JDK 21 examples는 grammar, escaping, stable order, request budget, Page/Slice, keyset Window와 projection을 actual DB/user data 없이 exact stdout으로 실행합니다.",
  objectives: ["원본 Repository의 실제 derived/JPQL method와 미구현 pagination 기능을 분리한다.", "query subject/predicate/property traversal/reserved method 문법을 설명한다.", "null/empty/LIKE wildcard와 escape/cardinality 정책을 정의한다.", "public Sort allow-list와 immutable unique tie-breaker로 ordering을 안정화한다.", "Pageable offset, size/window/unpaged caps와 Page/Slice/List count 비용을 선택한다.", "offset drift와 keyset Window/ScrollPosition cursor 계약을 비교한다.", "Top/First/Limit, timeout/cancellation/export resource boundary를 운영한다.", "projection과 content/count/keyset SQL plan·복합 index·관측 tests를 검증한다."],
  prerequisites: [{ title: "@Transactional과 지연 로딩이 살아있는 경계", reason: "repository query의 persistence context, read transaction, lazy loading과 rollback 경계를 알아야 content/count/projection을 service unit-of-work 안에서 안전하게 실행할 수 있습니다.", sessionSlug: "jpa-05-transaction-service-boundary" }],
  keywords: ["derived query", "query method grammar", "Pageable", "Page", "Slice", "Sort", "Limit", "Window", "ScrollPosition", "keyset pagination", "stable ordering", "countQuery", "LIKE escaping", "projection", "EXPLAIN", "composite index", "resource cap"],
  topics,
  lab: {
    title: "GuestBookRepository 조회를 bounded Page/Slice/keyset read path로 qualification하기",
    scenario: "원본 Repository는 작은 List와 nullable entity query 학습에는 충분하지만 public search/pagination의 ordering, total 비용, cursor, projection과 database resource budget을 제공하지 않습니다.",
    setup: ["원본 Repository는 read-only hash provenance로 고정합니다.", "JDK 21 examples와 Spring Data/JPA/MySQL disposable integration fixture를 준비합니다.", "actual user values 대신 empty/tie/null/skew/large synthetic rows만 사용합니다.", "SQL/query-count/EXPLAIN/latency collector는 bind values를 redaction합니다."],
    steps: ["원본 four methods의 subject/parameter/return/null/order 기능표를 만듭니다.", "derived method grammar와 startup property parsing tests를 작성합니다.", "filter DTO의 null/empty/LIKE literal/cardinality 정책을 구현합니다.", "public sort tokens를 entity paths로 allow-list하고 unique idx tie-breaker를 추가합니다.", "0-based default/max size, maximum offset와 unpaged rejection을 adapter에 적용합니다.", "같은 filter에서 Page content/count, Slice size+1과 List query count/plan을 비교합니다.", "page 경계 insert/delete/update로 offset drift를 재현합니다.", "non-null ordered tuple, version/filter-bound exclusive cursor와 Window adapter를 구현합니다.", "Top/First/Limit, timeout/cancellation/concurrency/response byte caps를 fault-test합니다.", "entity page와 closed/DTO projection의 select columns/joins/query count를 비교합니다.", "content/count/keyset EXPLAIN과 equality+order composite index leftmost prefix를 검증합니다.", "operation/page-mode/size/offset/result/query-count/plan/timeout bounded telemetry와 release gate를 제출합니다."],
    expectedResult: ["method grammar와 entity properties가 startup/integration tests에서 정확히 해석됩니다.", "외부 page/sort/filter가 caps와 allow-list를 통과한 경우에만 Repository로 전달됩니다.", "Page/Slice/keyset의 total/hasNext/ordering/drift 계약과 query count가 문서와 일치합니다.", "projection에 필요한 field만 선택되고 actual values·sensitive binds가 logs/artifacts에 없습니다.", "content/count/keyset query가 approved MySQL plan, rows/time budget과 composite index를 만족합니다."],
    cleanup: ["disposable schema, synthetic rows, plan/cache artifacts와 test processes를 제거합니다.", "SQL bind/debug logging과 temporary metrics exposure를 원복합니다.", "cursor signing fixture와 synthetic canary를 폐기하고 logs/artifacts zero-value scan을 실행합니다.", "원본 Repository hash/status가 변경되지 않았음을 확인합니다."],
    extensions: ["Specification/Querydsl로 optional filter explosion을 typed query builder로 이전합니다.", "read replica lag와 cursor freshness/snapshot token을 설계합니다.", "full-text/search service와 prefix/contains workload plan을 비교합니다.", "plan fingerprint와 index migration을 CI performance budget에 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java examples를 실행하고 각 결과를 실제 Spring Data/MySQL evidence와 연결하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "method subject/predicate/property를 설명합니다.", "LIKE literal escaping을 설명합니다.", "unique tie-breaker를 찾습니다.", "Page와 Slice query cost 차이를 적습니다.", "exclusive keyset cursor를 추적합니다.", "projection과 request budget의 non-exposure를 확인합니다."], hints: ["JDK model 결과와 provider/database guarantee를 구분하세요."], expectedOutcome: "query 이름부터 cursor와 plan까지 실행 가능한 조회 불변식으로 설명합니다.", solutionOutline: ["grammar→filter→order→budget→chunk→cursor→projection/plan 순서입니다."] },
    { difficulty: "응용", prompt: "원본 GuestBookRepository에 public search endpoint용 read path를 설계하세요.", requirements: ["원본 behavior characterization을 둡니다.", "filter null/LIKE/cardinality policy를 둡니다.", "sort allow-list와 tie-breaker를 둡니다.", "Page/Slice 선택과 custom countQuery 필요성을 판단합니다.", "offset/keyset cursor를 목적별로 나눕니다.", "projection과 authorization boundary를 둡니다.", "size/offset/time/concurrency caps를 둡니다.", "MySQL plan/index/query-count tests를 포함합니다."], hints: ["한 method가 모든 filter/sort/page 모드를 맡지 않아도 됩니다."], expectedOutcome: "성능·정확성·privacy·운영 상한이 있는 implementation-ready repository contract가 완성됩니다.", solutionOutline: ["characterize→contract→implement→plan→fault/load→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring Data collection query 표준을 작성하세요.", requirements: ["derived/declared/dynamic query 선택 기준을 둡니다.", "null/wildcard/property/reserved rules를 둡니다.", "Page/Slice/List/Window selection matrix를 둡니다.", "stable sort/cursor/version rules를 둡니다.", "projection/field authorization rules를 둡니다.", "resource caps/export boundary를 둡니다.", "content/count/keyset plan/index/telemetry gates를 둡니다.", "schema/query/cursor compatibility와 rollback 절차를 둡니다."], hints: ["repository naming guide보다 database work와 public contract를 함께 표준화하세요."], expectedOutcome: "조회 기능 생성부터 plan regression과 cursor retirement까지 감사 가능한 표준이 완성됩니다.", solutionOutline: ["surface→semantics→ordering→pagination→shape→budget→evidence→lifecycle 순서입니다."] },
  ],
  nextSessions: ["jpa-07-dto-controller-error"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["GuestBookRepository.java는 read-only로 30 lines/1,044 bytes와 SHA-256 C7E06DA8F59BD2997D20610E03DC2426EBCD6D79B0B3829AB5368C1038C79900를 확인했습니다.", "원본의 JpaRepository, derived findByActive와 세 @Query method만 provenance로 사용하고 Pageable/Page/Slice/Sort/Limit/projection/count/index가 존재한다고 가정하지 않았습니다.", "실제 table rows, writer/search values, database URL/credential과 SQL bind values는 examples, source evidence와 execution output에 복제하지 않았습니다.", "JDK-only examples는 Spring Data parser, JPA provider SQL, transaction isolation, MySQL collation/optimizer와 concurrent production workload를 대체하지 않습니다."] },
});

export default session;
