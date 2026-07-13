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
      { lines: "1-" + first, explanation: "JDK 21 records와 pure functions로 raw query parameters를 normalized criteria, bounded page와 deterministic order로 변환합니다." },
      { lines: (first + 1) + "-" + second, explanation: "빈 검색, 경계 page, 동점 정렬, count/list 일치, URL encoding과 concurrent insert drift를 실행합니다." },
      { lines: (second + 1) + "-" + count, explanation: "실제 검색어·사용자·테이블 값 대신 synthetic labels, ids와 page metadata만 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/MyBatis/DB/browser/network/credential 불필요"], command: "java " + filename },
    output: { value: output, explanation: ["stdout은 제시된 결과와 완전히 같아야 합니다.", "JDK-only 모델은 실제 URL parser, Spring binding, MyBatis dynamic SQL, DB collation/index/transaction snapshot을 대체하지 않습니다."] },
    experiments: [
      { change: "page/size, keyword 공백, sort key, total, 동점 row와 중간 insert/delete를 바꿉니다.", prediction: "명시적 검색·정렬·페이지 계약은 overflow, 중복, 누락과 predicate drift를 결과로 드러냅니다.", result: "normalized criteria, offset/window, ids, total, links와 duplicate count를 비교합니다." },
      { change: "같은 계약을 MockMvc→service→MyBatis XML→지원 DB와 실제 collation/index에서 실행합니다.", prediction: "bound SQL, query plan, rows examined, count/list snapshot과 HTTP links가 추가 증거가 됩니다.", result: "route/criteria fingerprint/statement id/page size/duration bucket을 같은 request id로 연결합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "search-criteria-normalization",
    title: "raw query parameter를 immutable SearchCriteria로 정규화합니다",
    lead: "Controller·Service·Mapper가 각자 trim, 빈 문자열과 기본 검색 필드를 해석하면 같은 URL이 계층마다 다른 query가 됩니다.",
    explanations: [
      "Controller boundary에서 page, size, field, keyword, sort와 direction을 typed request로 받고 application factory가 공백 정리, Unicode/길이 정책, enum allow-list와 기본값을 적용한 immutable SearchCriteria를 만듭니다.",
      "parameter 부재와 빈 값, whitespace-only, 반복 parameter와 literal 문자열 null을 구분합니다. 검색 없음은 전체 공개 범위 조회라는 명시적 상태이며 SQL fragment가 우연히 빠진 결과가 아닙니다.",
      "정규화된 criteria는 count와 list, page links, cache key와 observability fingerprint가 공유합니다. controller의 raw Map이나 mutable VO를 singleton service field에 저장하지 않습니다.",
      "원본 Paging과 BoardMapper XML은 read-only 감사에서 page 관련 값과 LIMIT/OFFSET 구조를 보여 주지만 검색 동적 조건과 현대적인 typed criteria가 이미 있다는 근거는 아닙니다. maintained contract를 별도로 설명합니다.",
    ],
    concepts: [
      c("search criteria", "허용된 검색 필드·정규화 keyword·정렬·페이지와 visibility를 하나로 표현한 immutable query input입니다.", ["count/list가 공유합니다.", "raw Map을 대체합니다."]),
      c("normalization", "동등한 사용자 입력을 안정된 내부 표현으로 바꾸는 과정입니다.", ["validation 전에 범위를 정합니다.", "locale/Unicode 정책이 필요합니다."]),
      c("query fingerprint", "민감한 검색어 원문 없이 criteria shape와 bounded options를 식별하는 관측·cache 표현입니다.", ["값을 노출하지 않습니다.", "cardinality를 제한합니다."]),
    ],
    codeExamples: [java("crud05-normalize-criteria", "검색 조건 정규화와 allow-list", "Crud05NormalizeCriteria.java", "공백이 많은 keyword와 잘못된 field/page size를 안정된 criteria로 변환합니다.", String.raw`public class Crud05NormalizeCriteria {
  enum Field { TITLE, WRITER }
  record Criteria(Field field, String keyword, int page, int size) {}
  static Criteria normalize(String field, String keyword, int page, int size) {
    Field safeField = "writer".equalsIgnoreCase(field) ? Field.WRITER : Field.TITLE;
    String safeKeyword = keyword == null ? "" : keyword.strip().replaceAll("\\s+", " ");
    int safePage = Math.max(1, page);
    int safeSize = Math.max(1, Math.min(size, 100));
    return new Criteria(safeField, safeKeyword, safePage, safeSize);
  }
  public static void main(String[] args) {
    System.out.println("normal=" + normalize("title", "  Spring   MVC  ", 2, 20));
    System.out.println("bounded=" + normalize("unknown", null, -3, 1000));
    System.out.println("raw-map-shared=false");
  }
}`, "normal=Criteria[field=TITLE, keyword=Spring MVC, page=2, size=20]\nbounded=Criteria[field=TITLE, keyword=, page=1, size=100]\nraw-map-shared=false", ["local-paging", "spring-request-param", "mybatis-dynamic-sql", "owasp-sql-injection"])],
    diagnostics: [d("같은 검색 URL에서 count와 list의 keyword 공백·field 기본값이 다릅니다.", "계층마다 raw parameters를 독립 정규화하거나 mutable Map keys가 drift했습니다.", ["bound request", "criteria factory", "count/list parameters", "generated links"], "boundary에서 한 번 typed criteria로 정규화하고 모든 query와 link가 같은 instance/value를 사용하게 합니다.", "부재·빈 값·공백·반복·잘못된 enum의 count/list/link parity test를 둡니다.")],
    expertNotes: ["검색어 case folding과 Unicode normalization은 언어·DB collation과 맞춰야 하며 무조건 lowercase가 정답은 아닙니다.", "raw keyword를 metric label이나 cache diagnostics에 기록하지 않습니다."],
  },
  {
    id: "page-size-validation-overflow",
    title: "page·size·total을 범위 제한하고 overflow 없는 산술로 계산합니다",
    lead: "음수·0·거대한 size 또는 int 곱셈 overflow는 잘못된 OFFSET, full scan과 메모리 고갈로 이어집니다.",
    explanations: [
      "외부 page는 1-based인지 0-based인지 계약에 명시하고 내부 offset은 (page-1)×size로 계산합니다. 곱셈 전에 long으로 승격하고 page/size 상한을 검증하며 SQL parameter type 범위를 확인합니다.",
      "size는 서버 최대값을 적용하고 누락 기본값과 invalid 처리 정책을 정합니다. 음수를 1로 자동 보정할지 400으로 거절할지는 UX/API에 따라 다르지만 문서와 links에서 일관돼야 합니다.",
      "totalPages는 total=0일 때 0 또는 UI page 1 중 무엇을 표현할지 분리합니다. 산술식은 total / size의 ceiling이며 floating-point 변환을 피하고 total+size-1 overflow를 피하는 식을 씁니다.",
      "요청 page가 totalPages를 넘으면 빈 200, 마지막 page redirect 또는 404 정책을 정합니다. concurrent delete로 total이 줄 수 있으므로 무조건 오류로 간주하지 않고 snapshot 정책과 함께 처리합니다.",
    ],
    concepts: [
      c("offset", "정렬된 전체 결과에서 건너뛸 row 수입니다.", ["보통 (page-1)×size입니다.", "큰 값은 비용이 큽니다."]),
      c("page size cap", "한 요청이 반환할 수 있는 최대 row 수를 서버가 제한하는 예산입니다.", ["DoS를 줄입니다.", "payload/DB budget과 연결됩니다."]),
      c("ceiling division", "정수 total을 size 단위로 올림해 필요한 page 수를 구하는 연산입니다.", ["overflow-safe 식을 씁니다.", "total 0 정책이 필요합니다."]),
    ],
    codeExamples: [java("crud05-page-math", "overflow-safe page 산술", "Crud05PageMath.java", "page·size·total에서 offset, totalPages와 hasNext를 long 산술로 계산합니다.", String.raw`public class Crud05PageMath {
  record Page(long page, long size, long offset, long totalPages, boolean hasNext) {}
  static Page of(long page, long size, long total) {
    if (page < 1 || size < 1 || size > 100 || total < 0) throw new IllegalArgumentException("invalid-page");
    long offset = Math.multiplyExact(page - 1, size);
    long totalPages = total == 0 ? 0 : 1 + ((total - 1) / size);
    return new Page(page, size, offset, totalPages, page < totalPages);
  }
  public static void main(String[] args) {
    System.out.println("page3=" + of(3, 20, 95));
    System.out.println("empty=" + of(1, 20, 0));
    try { of(Long.MAX_VALUE, 100, 1); }
    catch (ArithmeticException e) { System.out.println("overflow=rejected"); }
  }
}`, "page3=Page[page=3, size=20, offset=40, totalPages=5, hasNext=true]\nempty=Page[page=1, size=20, offset=0, totalPages=0, hasNext=false]\noverflow=rejected", ["local-paging", "jdk-math", "mysql-select"])],
    diagnostics: [d("거대한 page가 음수 OFFSET 또는 장시간 full scan으로 변합니다.", "int multiplication overflow와 상한 없는 page/size를 그대로 SQL에 전달했습니다.", ["binding target types", "validation caps", "offset calculation type", "bound SQL/plan"], "long exact arithmetic과 page/size/offset budgets를 적용하고 초과 입력을 안정된 4xx로 거절합니다.", "0·음수·max·overflow·oversize property tests와 DB timeout gate를 둡니다.")],
    expertNotes: ["입력 cap은 UX 제한이 아니라 DB connection·rows·payload 자원 경계입니다.", "큰 page를 허용해야 한다면 offset을 키우기보다 cursor contract를 고려합니다."],
  },
  {
    id: "deterministic-total-order",
    title: "모든 page query에 고유 tie-breaker를 포함한 결정적 전체 순서를 둡니다",
    lead: "ORDER BY 생성 시각 하나처럼 동점이 가능한 정렬은 동일 데이터에서도 page 사이 중복·누락과 flaky test를 만듭니다.",
    explanations: [
      "page 결과는 명시적 ORDER BY가 필요하고 business sort 뒤에 unique immutable key를 같은 방향의 tie-breaker로 둡니다. 최신순이면 createdAt DESC, id DESC처럼 전체 순서를 만듭니다.",
      "사용자 sort는 enum allow-list를 실제 SQL fragment로 변환합니다. column name과 ASC/DESC는 bind parameter로 값처럼 처리할 수 없으므로 raw substitution에 user string을 전달하지 않습니다.",
      "null ordering, case/collation, timezone과 locale을 DB dialect별로 정의합니다. Java comparator unit test만 통과해도 DB collation과 NULLS FIRST/LAST가 다를 수 있으므로 지원 DB 통합 결과를 확인합니다.",
      "정렬 key가 update로 바뀔 수 있으면 offset page drift뿐 아니라 cursor 안정성도 깨집니다. immutable created id 또는 snapshot token을 보조 key로 사용하고 수정 후 위치 변화 UX를 설명합니다.",
    ],
    concepts: [
      c("total order", "서로 다른 모든 row의 상대 순서를 결정할 수 있는 정렬 관계입니다.", ["동점 tie-breaker가 필요합니다.", "pagination 안정성의 전제입니다."]),
      c("tie-breaker", "주 정렬 값이 같은 row의 순서를 고유하게 결정하는 추가 key입니다.", ["보통 immutable id입니다.", "방향을 명시합니다."]),
      c("sort allow-list", "외부 sort token을 미리 정한 column/direction 조합으로만 변환하는 정책입니다.", ["SQL injection을 막습니다.", "index 설계와 연결됩니다."]),
    ],
    codeExamples: [java("crud05-stable-order", "동점에도 결정적인 정렬", "Crud05StableOrder.java", "score 동점 row를 id 내림차순 tie-breaker로 정렬해 안정된 page order를 실행합니다.", String.raw`import java.util.*;

public class Crud05StableOrder {
  record Item(long id, int score) {}
  public static void main(String[] args) {
    List<Item> items = new ArrayList<>(List.of(
      new Item(1, 10), new Item(3, 11), new Item(2, 10)));
    Comparator<Item> order = Comparator.comparingInt(Item::score).reversed()
      .thenComparing(Comparator.comparingLong(Item::id).reversed());
    items.sort(order);
    System.out.println("order=" + items.stream().map(Item::id).toList());
    System.out.println("page1=" + items.stream().limit(2).map(Item::id).toList());
    System.out.println("tie-breaker=id-desc");
  }
}`, "order=[3, 2, 1]\npage1=[3, 2]\ntie-breaker=id-desc", ["mysql-order-by", "postgres-limit-offset", "owasp-sql-injection"])],
    diagnostics: [d("새로고침하거나 다른 실행 계획에서 같은 row가 다른 page로 이동합니다.", "ORDER BY가 없거나 동점 가능한 key만 사용해 DB가 임의 순서를 선택했습니다.", ["SQL ORDER BY", "tie frequency", "unique key direction", "execution plans"], "business sort 뒤 unique immutable tie-breaker를 넣고 count/list/cursor 계약에 같은 order를 사용합니다.", "동점 fixtures와 여러 plan/index에서 page concatenation의 중복·누락 0을 검증합니다.")],
    expertNotes: ["정렬 안정성은 단순 UI 미관이 아니라 페이지 경계의 데이터 정확성입니다.", "사용자에게 제공하는 sort 옵션마다 지원 가능한 composite index와 비용을 평가합니다."],
  },
  {
    id: "count-list-predicate-parity",
    title: "count와 list가 동일한 검색·visibility·authorization predicate를 공유하게 합니다",
    lead: "total은 검색 결과 37개인데 rows가 비거나 삭제·다른 tenant row가 섞이는 문제는 대개 두 statement의 조건 drift입니다.",
    explanations: [
      "count와 list는 keyword field, tenant/owner scope, active/deleted, permission, date range와 join semantics를 동일하게 적용해야 합니다. projection과 ORDER/LIMIT만 달라야 한다는 semantic contract를 테스트합니다.",
      "XML include로 fragment를 재사용해도 optional join과 DISTINCT, NULL, one-to-many 때문에 count cardinality가 달라질 수 있습니다. representative fixtures에서 반환 ids와 total을 의미적으로 비교합니다.",
      "count 뒤 list 사이 concurrent insert/delete가 있으면 READ COMMITTED에서 같은 predicate라도 snapshot이 달라질 수 있습니다. exact snapshot, 허용된 약한 일관성, cursor/no-total 중 제품 요구를 선택합니다.",
      "empty page를 보면 total을 다시 계산하거나 page를 조정하는 UX가 필요할 수 있지만 무한 retry를 만들지 않습니다. response에 observed total/snapshot/cursor 계약을 명시하고 cache key도 같은 criteria를 사용합니다.",
    ],
    concepts: [
      c("predicate parity", "count와 list가 동일한 row 집합을 정의하는 검색·visibility 조건을 공유하는 성질입니다.", ["SQL text 동일성과 다릅니다.", "fixture semantics로 검증합니다."]),
      c("snapshot consistency", "여러 query가 같은 논리 시점의 database 상태를 관찰하는 정도입니다.", ["isolation과 transaction에 좌우됩니다.", "비용을 가집니다."]),
      c("count cardinality", "join과 DISTINCT를 적용한 뒤 total이 어떤 단위를 세는지 정의한 계약입니다.", ["root resource인지 명시합니다.", "one-to-many를 주의합니다."]),
    ],
    codeExamples: [java("crud05-count-list-parity", "count와 list의 공통 predicate", "Crud05CountListParity.java", "visible 상태와 keyword 조건을 같은 predicate로 사용해 total과 ids가 일치하는지 실행합니다.", String.raw`import java.util.*;
import java.util.function.*;

public class Crud05CountListParity {
  record Row(long id, String text, boolean visible) {}
  public static void main(String[] args) {
    List<Row> rows = List.of(
      new Row(1, "spring mvc", true),
      new Row(2, "spring hidden", false),
      new Row(3, "java jdbc", true),
      new Row(4, "spring data", true));
    Predicate<Row> criteria = row -> row.visible() && row.text().contains("spring");
    long total = rows.stream().filter(criteria).count();
    List<Long> ids = rows.stream().filter(criteria).map(Row::id).toList();
    System.out.println("total=" + total);
    System.out.println("ids=" + ids);
    System.out.println("parity=" + (total == ids.size()));
  }
}`, "total=2\nids=[1, 4]\nparity=true", ["local-board-mapper", "mybatis-mapper-xml", "spring-transactions"])],
    diagnostics: [d("total과 현재 criteria의 실제 rows 수가 일치하지 않습니다.", "count/list의 optional filters, visibility, join 또는 DISTINCT 단위가 drift했습니다.", ["bound criteria object", "both SQL predicates", "join cardinality", "transaction snapshot"], "application query spec와 shared fragments를 사용하고 semantic fixture parity를 검증합니다.", "검색 조합·삭제/tenant·one-to-many·concurrent change matrix를 둡니다.")],
    expertNotes: ["exact total은 별도 대형 query 비용을 가지므로 제품 가치가 낮으면 hasNext나 approximate total을 선택할 수 있습니다.", "공통 fragment는 도움이 되지만 authorization 누락을 자동으로 막지는 않습니다."],
  },
  {
    id: "dynamic-sql-binding-injection",
    title: "검색 값은 binding하고 SQL 식별자·정렬은 enum allow-list로 선택합니다",
    lead: "keyword를 문자열 연결하거나 사용자 sort 이름을 raw substitution하면 검색 기능이 SQL injection 통로가 됩니다.",
    explanations: [
      "keyword, date, status, offset과 limit 같은 값은 MyBatis parameter binding을 사용합니다. LIKE wildcard 자체를 검색 문자로 다룰지 패턴으로 허용할지 정하고 escape character와 DB dialect를 통합 테스트합니다.",
      "column/table/direction은 일반 bind placeholder로 SQL grammar 위치에 넣을 수 없습니다. external token을 enum으로 파싱하고 server-owned fragment switch/choose에서 선택하며 임의 문자열을 raw SQL에 넣지 않습니다.",
      "dynamic SQL의 if/where/choose는 optional criteria를 표현하지만 모든 조건이 빠진 경우의 전체 조회 비용과 authorization predicate를 따로 보호합니다. empty criteria가 tenant/visibility 조건까지 제거해서는 안 됩니다.",
      "검색어 길이, wildcard 비율, leading wildcard, Unicode/collation과 expensive regex/full-text query에 resource budget을 둡니다. validation은 injection 방어를 보완하지만 parameter binding을 대신하지 않습니다.",
    ],
    concepts: [
      c("parameter binding", "SQL 구조와 값을 분리해 driver prepared parameter로 전달하는 방식입니다.", ["값 injection을 막습니다.", "식별자에는 쓸 수 없습니다."]),
      c("dynamic SQL", "typed criteria에 따라 미리 허용된 SQL fragments를 조건부 조합하는 mapper 기능입니다.", ["문자열 연결과 다릅니다.", "empty path를 검증합니다."]),
      c("LIKE escape", "검색어의 percent/underscore를 literal로 취급할 때 escape 규칙을 명시하는 계약입니다.", ["dialect를 확인합니다.", "wildcard 정책과 연결됩니다."]),
    ],
    diagnostics: [d("sort parameter나 keyword에 따옴표/SQL 조각을 넣자 query 구조가 바뀝니다.", "raw substitution 또는 문자열 연결로 user input이 SQL code가 됐습니다.", ["mapper placeholders", "sort mapping", "bound SQL", "malicious fixtures"], "값은 binding하고 식별자/direction은 enum→constant fragment로만 선택합니다.", "SQL injection corpus, unknown sort와 wildcard escape tests를 release gate로 둡니다.")],
    expertNotes: ["prepared statement도 권한이 넓고 query budget이 없으면 데이터 과다 조회·DoS를 막지 못합니다.", "full-text search를 도입할 때도 query syntax와 authorization filter를 별도 allow-list로 제한합니다."],
  },
  {
    id: "page-navigation-link-contract",
    title: "페이지 블록·prev/next·query 보존과 URI encoding을 하나의 navigation 계약으로 만듭니다",
    lead: "페이지 번호만 바꾼 링크가 검색어·정렬을 잃거나 raw 문자열 연결로 깨지면 사용자는 다른 결과 집합으로 이동합니다.",
    explanations: [
      "response/view model은 page, size, total 또는 hasNext, start/end window, first/last, prev/next와 normalized criteria를 제공합니다. JSP가 산술을 다시 구현하지 않고 표시와 접근성에 집중하게 합니다.",
      "window는 현재 page를 block size로 묶고 totalPages로 end를 제한합니다. total=0, 첫/마지막 block, page 초과와 block size 변경을 integer property tests로 검증합니다.",
      "link는 UriComponentsBuilder처럼 component-aware builder로 query values를 encoding합니다. keyword를 URL 전체에 문자열 연결하지 않고 기존 criteria를 유지한 채 page만 교체합니다.",
      "API는 body links 또는 RFC 8288 Link header의 next/prev 관계를 사용할 수 있습니다. 외부 host/scheme을 forwarded headers에서 무조건 신뢰하지 않고 relative links나 trusted proxy 설정을 사용합니다.",
    ],
    concepts: [
      c("page window", "UI에 한 번에 보여 줄 연속 page 번호의 start/end 범위입니다.", ["현재 block과 totalPages로 계산합니다.", "0 total을 처리합니다."]),
      c("criteria preservation", "페이지 이동 링크가 검색·정렬·size 등 동일 결과 집합 조건을 유지하는 성질입니다.", ["page만 변경합니다.", "canonicalization과 연결됩니다."]),
      c("link relation", "현재 representation과 next/prev 같은 target의 의미 관계를 표현하는 표준화된 링크 속성입니다.", ["body나 Link header에 씁니다.", "URI encoding이 필요합니다."]),
    ],
    codeExamples: [java("crud05-navigation-links", "검색 조건을 보존한 encoded links", "Crud05NavigationLinks.java", "keyword를 query component로 encoding하고 page만 바꾼 prev/next relative links를 생성합니다.", String.raw`import java.net.*;
import java.nio.charset.*;

public class Crud05NavigationLinks {
  static String link(int page, int size, String keyword) {
    String encoded = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
    return "/boards?page=" + page + "&size=" + size + "&keyword=" + encoded;
  }
  public static void main(String[] args) {
    System.out.println("prev=" + link(2, 20, "spring mvc"));
    System.out.println("next=" + link(4, 20, "spring mvc"));
    System.out.println("relative=true");
    System.out.println("criteria-preserved=true");
  }
}`, "prev=/boards?page=2&size=20&keyword=spring+mvc\nnext=/boards?page=4&size=20&keyword=spring+mvc\nrelative=true\ncriteria-preserved=true", ["spring-uri-building", "rfc-uri-syntax", "rfc-web-linking"])],
    diagnostics: [d("next를 누르면 검색·정렬이 풀리거나 특수문자 keyword 링크가 깨집니다.", "view에서 raw query 문자열을 연결하고 page 외 criteria를 복사하지 않았습니다.", ["generated href/Link", "component encoding", "normalized criteria", "proxy host handling"], "typed criteria로 component-aware relative URI를 만들고 page만 교체합니다.", "공백·한글·reserved characters·첫/마지막 page의 exact link tests를 둡니다.")],
    expertNotes: ["URL encoding은 HTML escaping과 다른 계층이므로 href 출력 시 둘 다 올바른 context에서 적용합니다.", "canonical URL 정책은 duplicate cache/search indexing과 browser history UX까지 고려합니다."],
  },
  {
    id: "offset-concurrent-drift",
    title: "offset pagination의 concurrent insert/delete drift를 제품 계약으로 드러냅니다",
    lead: "page 1을 본 뒤 새 row가 앞에 삽입되면 page 2의 offset이 이동해 이미 본 row가 반복되거나 row가 건너뛰어집니다.",
    explanations: [
      "offset은 매 요청마다 현재 정렬 결과의 N rows를 건너뜁니다. 앞쪽 insert/delete나 정렬 key update가 일어나면 logical position이 이동하므로 같은 사용자의 연속 navigation도 snapshot이 아닙니다.",
      "admin table처럼 약한 일관성을 허용할 수 있지만 중복/누락이 치명적인 export·결제·처리 queue에는 snapshot id, cursor/keyset 또는 materialized job을 사용합니다. UX에 새 결과 알림과 refresh 의미를 설명합니다.",
      "count와 list를 한 read-only transaction으로 묶어도 다음 HTTP page 요청까지 같은 DB snapshot을 유지하지는 않습니다. 긴 transaction을 session에 보관하지 않고 explicit snapshot token/storage가 필요한지 판단합니다.",
      "deletion으로 empty page가 생기면 last page 재계산을 bounded하게 수행하고, 같은 요청에서 무한 redirect/retry하지 않습니다. client도 page response 순서를 request generation으로 관리합니다.",
    ],
    concepts: [
      c("page drift", "페이지 요청 사이 데이터 변화로 offset 경계가 이동해 row가 중복·누락되는 현상입니다.", ["정렬이 안정돼도 발생합니다.", "consistency 선택이 필요합니다."]),
      c("weak consistency", "각 page가 그 시점에는 유효하지만 전체 navigation이 하나의 snapshot을 보장하지 않는 계약입니다.", ["문서화할 수 있습니다.", "critical workflow에는 부적합할 수 있습니다."]),
      c("snapshot token", "동일 결과 집합 시점을 후속 page 요청이 참조하도록 하는 opaque 식별자입니다.", ["저장 비용이 있습니다.", "만료 정책이 필요합니다."]),
    ],
    diagnostics: [d("page 이동 중 같은 게시물이 반복되거나 하나가 영원히 보이지 않습니다.", "offset 경계 앞에서 concurrent insert/delete가 발생했지만 snapshot/cursor 계약이 없었습니다.", ["sort order", "request timestamps", "mutation timeline", "duplicate/missing ids"], "허용 가능한 drift를 문서화하거나 cursor/snapshot 방식으로 전환합니다.", "page 사이 insert/delete/update를 주입해 duplicate/missing budget과 UX를 검증합니다.")],
    expertNotes: ["결정적 ORDER BY는 비결정 순서를 해결하지만 concurrent drift 자체는 해결하지 않습니다.", "무한 스크롤은 중복 제거만으로 누락을 복구하지 못하므로 cursor와 refresh 정책이 필요합니다."],
  },
  {
    id: "cursor-keyset-pagination",
    title: "큰 offset과 drift가 문제면 마지막 정렬 key 기반 cursor pagination을 설계합니다",
    lead: "깊은 page에서 OFFSET이 수많은 row를 읽고 버리며, 앞쪽 insert 때문에 경계가 이동할 때 keyset은 이미 본 마지막 key 뒤를 직접 찾습니다.",
    explanations: [
      "cursor는 마지막 row의 모든 정렬 key와 direction, criteria/version을 opaque signed token에 담거나 server-side state로 참조합니다. 다음 query는 동일 order에 맞는 lexicographic seek predicate와 LIMIT을 사용합니다.",
      "createdAt DESC, id DESC라면 다음 page는 createdAt이 작거나 같은 timestamp에서 id가 작은 row를 찾습니다. 단일 id 비교로 축약하면 주 정렬 동점과 방향 혼합에서 누락됩니다.",
      "cursor는 임의 page 점프와 exact total에 불리하지만 깊은 navigation 비용이 일정하고 앞쪽 insert의 중복을 줄입니다. previous 방향, 만료, filter/sort 변경, deleted boundary와 tamper 처리를 정의합니다.",
      "cursor payload에 raw keyword, user/tenant id와 내부 schema를 평문으로 노출하지 않습니다. server authorization을 매 요청 다시 적용하며 서명은 권한 검사를 대신하지 않습니다.",
    ],
    concepts: [
      c("keyset pagination", "마지막 정렬 key보다 뒤인 row를 seek predicate로 조회하는 pagination 방식입니다.", ["큰 offset을 피합니다.", "전체 정렬 key가 필요합니다."]),
      c("opaque cursor", "client가 내부 값을 수정·해석하지 않고 다음 위치를 전달하는 제한된 token입니다.", ["서명/만료를 고려합니다.", "authorization을 포함하지 않습니다."]),
      c("lexicographic seek", "복합 정렬 key의 우선순위와 방향을 따라 다음 row 조건을 비교하는 방식입니다.", ["동점 key를 모두 포함합니다.", "index와 맞춥니다."]),
    ],
    codeExamples: [java("crud05-offset-vs-cursor", "삽입 후 offset 중복과 cursor seek 비교", "Crud05OffsetVsCursor.java", "첫 page 뒤 앞쪽 insert가 발생했을 때 offset page가 중복되고 id cursor는 다음 ids를 유지하는 과정을 실행합니다.", String.raw`import java.util.*;

public class Crud05OffsetVsCursor {
  static List<Long> page(List<Long> ids, int offset, int size) {
    return ids.stream().skip(offset).limit(size).toList();
  }
  static List<Long> after(List<Long> ids, long cursor, int size) {
    return ids.stream().filter(id -> id < cursor).limit(size).toList();
  }
  public static void main(String[] args) {
    List<Long> before = List.of(105L,104L,103L,102L,101L);
    List<Long> first = page(before, 0, 2);
    List<Long> changed = List.of(106L,105L,104L,103L,102L,101L);
    List<Long> offsetSecond = page(changed, 2, 2);
    List<Long> cursorSecond = after(changed, first.getLast(), 2);
    System.out.println("first=" + first);
    System.out.println("offset-second=" + offsetSecond);
    System.out.println("cursor-second=" + cursorSecond);
    System.out.println("offset-duplicate=" + offsetSecond.stream().filter(first::contains).count());
  }
}`, "first=[105, 104]\noffset-second=[104, 103]\ncursor-second=[103, 102]\noffset-duplicate=1", ["mysql-limit-optimization", "mysql-explain", "postgres-limit-offset", "rfc-http-semantics"])],
    diagnostics: [d("cursor 적용 뒤 동점 timestamp row가 누락되거나 다시 나타납니다.", "cursor가 복합 ORDER BY의 일부 key만 저장하거나 seek 방향이 정렬과 다릅니다.", ["ORDER BY tuple", "cursor payload", "seek predicate", "tie fixtures", "index"], "모든 sort keys와 direction을 lexicographic predicate에 포함하고 token을 criteria/order에 묶습니다.", "동점·삭제 boundary·tamper·sort 변경·next/previous round-trip tests를 둡니다.")],
    expertNotes: ["cursor를 base64 encoding한 것은 무결성 보호가 아니며 민감 payload를 넣지 않습니다.", "keyset도 정렬 key 자체가 변경되면 위치 변화가 있으므로 immutable key/snapshot 요구를 평가합니다."],
  },
  {
    id: "query-plan-index-total-cost",
    title: "검색·정렬·pagination을 EXPLAIN, index와 count 비용 예산으로 검증합니다",
    lead: "개발 데이터에서 20 rows가 빨리 보인다는 사실은 운영에서 leading wildcard, filesort, deep offset와 exact count가 안전하다는 뜻이 아닙니다.",
    explanations: [
      "criteria별 representative SQL을 actual parameter 분포와 synthetic safe values로 EXPLAIN/ANALYZE하고 access type, chosen index, rows examined, sort/temp, actual rows와 duration을 기록합니다. plan text를 외부 response에 노출하지 않습니다.",
      "composite index는 equality filters, range/search와 ORDER BY tie-breaker 순서를 workload에 맞춥니다. 모든 sort 조합에 index를 무작정 추가하지 않고 write amplification, storage와 optimizer 선택을 측정합니다.",
      "leading wildcard LIKE는 일반 B-tree를 활용하기 어렵고 collation/full-text/token search 요구가 다릅니다. 전용 search engine 도입 전에도 authorization filter, pagination 안정성과 total semantics를 유지합니다.",
      "exact count는 결과 반환보다 비쌀 수 있습니다. hasNext를 위해 size+1만 읽기, capped/approximate total, background count 또는 cursor를 선택하고 API가 exact인지 추정인지 명시합니다.",
    ],
    concepts: [
      c("query plan", "DB optimizer가 row를 찾고 join·sort·limit하는 실행 전략과 비용 추정입니다.", ["실제 data 분포에 의존합니다.", "버전별로 바뀔 수 있습니다."]),
      c("rows examined budget", "한 page 요청이 읽어도 되는 row 수 또는 amplification의 상한입니다.", ["returned rows와 구분합니다.", "deep offset을 드러냅니다."]),
      c("covering order index", "filter와 ORDER BY 및 projection을 index에서 효율적으로 지원하도록 설계한 composite index입니다.", ["write 비용이 있습니다.", "실제 plan으로 확인합니다."]),
    ],
    diagnostics: [d("page size는 20인데 깊은 page가 수십만 row를 읽고 connection timeout을 냅니다.", "OFFSET이 앞 row를 스캔/버리고 지원 index 또는 cursor 전환 기준이 없습니다.", ["EXPLAIN actual rows", "offset depth", "ORDER BY/index", "count duration", "pool wait"], "depth cap과 keyset pagination을 적용하고 workload별 composite index·count 정책을 선택합니다.", "large synthetic dataset의 rows-examined/latency/query timeout release budget을 둡니다.")],
    expertNotes: ["optimizer hint보다 schema, statistics, query shape와 product sort 옵션을 먼저 조정합니다.", "plan regression gate는 DB version/statistics 변화를 허용하되 위험 지표의 범위를 검증합니다."],
  },
  {
    id: "http-cache-observability-testing",
    title: "검색 HTTP 계약·cache key·safe observability와 다층 테스트를 함께 운영합니다",
    lead: "검색 결과 cache가 criteria 일부를 빠뜨리거나 raw keyword를 metric label로 쓰면 다른 사용자의 결과 노출과 cardinality 폭증이 생깁니다.",
    explanations: [
      "GET search는 safe/idempotent 의미를 유지하고 canonical query syntax, 200 empty list, invalid 400, media type과 next/prev links를 문서화합니다. 사용자별/tenant별 결과는 shared cache 가능 여부와 Vary/Cache-Control을 신중히 정합니다.",
      "cache key에는 normalized criteria, authorization scope의 safe opaque partition, sort/page/cursor와 data/version policy가 포함돼야 합니다. raw credentials나 PII를 key/log에 넣지 않고 scope 누락으로 cross-user hit가 나지 않게 합니다.",
      "metrics는 route template, search-present boolean, field/sort enum, pagination mode, size bucket, outcome, DB statement/plan class와 duration을 사용합니다. keyword, cursor, raw URL과 user id는 tags에서 제외합니다.",
      "unit property tests는 page/window/cursor 산술을, MockMvc는 binding/link/status를, mapper integration은 dynamic SQL/count parity/order를, supported DB load tests는 plan/index/drift를 검증합니다. source provenance와 failure evidence를 함께 보존합니다.",
    ],
    concepts: [
      c("canonical query", "동일 criteria를 하나의 안정된 URL/parameter 표현으로 만드는 규칙입니다.", ["cache/history를 단순화합니다.", "redirect 여부를 정합니다."]),
      c("cache partition", "authorization과 data scope가 다른 결과가 같은 cache entry를 공유하지 않도록 나누는 key 영역입니다.", ["tenant/user policy가 필요합니다.", "PII를 노출하지 않습니다."]),
      c("pagination test pyramid", "산술 unit, HTTP slice, mapper/DB integration과 load/concurrency를 위험별로 나눈 검증 체계입니다.", ["한 E2E에 의존하지 않습니다.", "dialect를 포함합니다."]),
    ],
    diagnostics: [d("다른 검색/tenant의 rows가 cache hit로 반환되거나 metric series가 폭증합니다.", "cache key에서 criteria/scope를 빼거나 raw keyword/cursor/user를 label로 사용했습니다.", ["cache key components", "authorization partition", "metric top labels", "raw URL logs"], "normalized safe fingerprint와 opaque scope partition을 key에 포함하고 bounded enum/bucket만 labels로 사용합니다.", "cross-scope cache isolation, secret canary와 cardinality budget tests를 둡니다.")],
    expertNotes: ["검색 결과 cache invalidation은 create/update/delete와 visibility 변화를 모두 반영해야 합니다.", "관측 목적 때문에 검색어 원문을 수집해야 한다면 별도 동의·보존·접근 정책을 거친 aggregate pipeline을 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-paging", repository: "local learning archive", path: "2026-springmvc01/src/main/java/.../common/Paging.java", usedFor: ["legacy page metadata and offset calculation provenance"], evidence: "Read-only structural audit: 32 lines, 959 bytes, SHA-256 F9AEA184CD41397B889135C16A28FC0ADA4445779E451DF02D38F3CE4C74C191." },
  { id: "local-board-mapper", repository: "local learning archive", path: "2026-springmvc01/src/main/resources/mapper/BoardMapper.xml", usedFor: ["legacy count/list, ORDER BY, LIMIT and OFFSET structure provenance"], evidence: "Read-only structural audit: 68 lines, 3,161 bytes, SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6." },
  { id: "spring-request-param", repository: "Spring Framework Reference", path: "RequestParam", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestparam.html", usedFor: ["query parameter binding and optional/multi-value semantics"], evidence: "Spring Framework 공식 RequestParam 문서입니다." },
  { id: "spring-uri-building", repository: "Spring Framework Reference", path: "URI Links", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-uri-building.html", usedFor: ["component-aware pagination link construction"], evidence: "Spring Framework 공식 URI building 문서입니다." },
  { id: "spring-transactions", repository: "Spring Framework Reference", path: "Transaction Strategies", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/strategies.html", usedFor: ["count/list transaction and isolation choices"], evidence: "Spring Framework 공식 transaction abstraction 문서입니다." },
  { id: "mybatis-mapper-xml", repository: "MyBatis 3 Reference", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["parameter binding and mapped select contracts"], evidence: "MyBatis 공식 mapper XML 문서입니다." },
  { id: "mybatis-dynamic-sql", repository: "MyBatis 3 Reference", path: "Dynamic SQL", publicUrl: "https://mybatis.org/mybatis-3/dynamic-sql.html", usedFor: ["conditional search predicates and safe fragments"], evidence: "MyBatis 공식 dynamic SQL 문서입니다." },
  { id: "mysql-select", repository: "MySQL 8.4 Reference Manual", path: "SELECT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["LIMIT and OFFSET SQL syntax"], evidence: "Oracle MySQL 공식 SELECT 문서입니다." },
  { id: "mysql-order-by", repository: "MySQL 8.4 Reference Manual", path: "ORDER BY Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html", usedFor: ["deterministic ordering and index-supported sort"], evidence: "Oracle MySQL 공식 ORDER BY optimization 문서입니다." },
  { id: "mysql-limit-optimization", repository: "MySQL 8.0 Reference Manual", path: "LIMIT Query Optimization", publicUrl: "https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html", usedFor: ["deep offset and LIMIT behavior"], evidence: "Oracle MySQL 공식 LIMIT optimization 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "Optimizing Queries with EXPLAIN", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/using-explain.html", usedFor: ["query-plan evidence and rows budget"], evidence: "Oracle MySQL 공식 EXPLAIN 문서입니다." },
  { id: "postgres-limit-offset", repository: "PostgreSQL Documentation", path: "LIMIT and OFFSET", publicUrl: "https://www.postgresql.org/docs/current/queries-limit.html", usedFor: ["cross-dialect deterministic order warning"], evidence: "PostgreSQL Global Development Group 공식 문서입니다." },
  { id: "owasp-sql-injection", repository: "OWASP Cheat Sheet Series", path: "SQL Injection Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", usedFor: ["parameter binding and sort allow-list"], evidence: "OWASP 공식 SQL injection 방어 지침입니다." },
  { id: "rfc-uri-syntax", repository: "IETF RFC Editor", path: "RFC 3986 URI Generic Syntax", publicUrl: "https://www.rfc-editor.org/rfc/rfc3986.html", usedFor: ["URI query component and encoding semantics"], evidence: "IETF Standards Track URI 문서입니다." },
  { id: "rfc-web-linking", repository: "IETF RFC Editor", path: "RFC 8288 Web Linking", publicUrl: "https://www.rfc-editor.org/rfc/rfc8288.html", usedFor: ["next and previous link relations"], evidence: "IETF Standards Track Web Linking 문서입니다." },
  { id: "rfc-http-semantics", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["safe GET and response semantics"], evidence: "IETF Standards Track HTTP semantics입니다." },
  { id: "jdk-math", repository: "Java SE 21 API", path: "Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["exact overflow-checking pagination arithmetic"], evidence: "Oracle Java SE 21 공식 Math API입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-05-search-pagination", slug: "crud-05-search-pagination", courseId: "spring", moduleId: "spring-layered-crud", order: 5,
  title: "검색 조건·페이지 계산·목록 쿼리 계약", subtitle: "정규화 criteria와 overflow-safe 산술에서 count/list 일치, 안정 정렬, safe dynamic SQL, cursor와 실행 계획까지 연결합니다.", level: "고급", estimatedMinutes: 100,
  coreQuestion: "검색·정렬·페이지 이동 중에도 같은 결과 집합의 의미를 유지하면서 중복·누락·주입·overflow와 깊은 offset 비용을 어떻게 통제할까요?",
  summary: "로컬 Paging.java와 BoardMapper.xml을 read-only로 감사해 page metadata와 count/list, ORDER BY, LIMIT/OFFSET 구조를 provenance로 사용하되 실제 domain/configuration 값을 복제하지 않습니다. raw parameters→immutable SearchCriteria, page/size cap과 exact long 산술, unique tie-breaker 전체 정렬, count/list predicate와 snapshot 일치, MyBatis binding과 sort allow-list, encoded navigation links, offset concurrent drift, opaque composite cursor/keyset, EXPLAIN/index/exact-count 비용과 authorization-aware cache·safe observability·test pyramid로 확장합니다. 여섯 JDK 21 예제는 criteria 정규화, page overflow, 동점 정렬, count/list parity, encoded links와 insert 이후 offset/cursor 차이를 exact output으로 증명합니다.",
  objectives: ["raw query parameters를 typed immutable SearchCriteria로 정규화한다.", "page·size·offset·totalPages를 overflow 없이 계산하고 자원 상한을 둔다.", "고유 tie-breaker가 있는 결정적 전체 정렬을 설계한다.", "count와 list의 검색·visibility·snapshot semantics를 일치시킨다.", "검색 값 binding과 sort identifier allow-list로 SQL injection을 막는다.", "검색 조건을 보존한 URI와 page navigation metadata를 만든다.", "offset drift와 keyset cursor의 정확성·UX·비용을 비교한다.", "실행 계획, cache, 관측성과 다층 테스트로 운영 계약을 검증한다."],
  prerequisites: [{ title: "수정·삭제, 영향 행과 동시 변경 처리", reason: "동시 insert/update/delete가 page 경계와 count/list snapshot에 미치는 영향을 이해해야 검색 결과의 일관성 수준과 cursor 전략을 선택할 수 있습니다.", sessionSlug: "crud-04-update-delete-concurrency" }],
  keywords: ["search criteria", "pagination", "offset", "total count", "page navigation", "deterministic order", "dynamic SQL", "keyset pagination", "cursor", "EXPLAIN", "SQL injection", "cache partition"], topics,
  lab: {
    title: "검색 목록을 typed criteria와 offset/cursor 이중 계약으로 재구성하기",
    scenario: "raw request Map, 분산된 page 산술과 count/list SQL drift 때문에 검색 조건 유실, total 불일치, 깊은 page 지연과 동시 변경 중복이 발생합니다.",
    setup: ["두 원본 파일은 read-only hash provenance로 고정하고 실제 table/column/search values를 복제하지 않습니다.", "field/sort/direction enums, normalized SearchCriteria, OffsetPageRequest와 CursorRequest를 정의합니다.", "active/deleted, tenant, keyword, 동점 sort key와 큰 synthetic dataset을 지원 DB에 준비합니다.", "MockMvc, MyBatis mapper integration, EXPLAIN capture와 concurrent insert/delete test harness를 준비합니다."],
    steps: ["raw parameter 부재·빈 값·반복·invalid를 criteria로 정규화합니다.", "page/size cap과 long exact offset/totalPages/window property tests를 작성합니다.", "모든 sort에 unique tie-breaker와 null/collation 정책을 둡니다.", "count/list가 같은 search·visibility·authorization predicate를 쓰게 합니다.", "값 binding과 sort enum→constant fragments로 dynamic SQL을 제한합니다.", "criteria를 보존하고 encoding한 page/next/prev links를 생성합니다.", "page 사이 insert/delete를 주입해 offset drift를 측정합니다.", "복합 order tuple cursor와 lexicographic seek query를 구현합니다.", "대표 criteria/sort/depth에서 EXPLAIN, rows examined, sort와 count 비용을 기록합니다.", "exact total·hasNext·size+1·cursor의 API/UX를 비교합니다.", "scope-safe cache key와 bounded observability schema를 적용합니다.", "unit·MockMvc·mapper/DB·load/concurrency matrix와 source evidence를 제출합니다."],
    expectedResult: ["모든 입력은 bounded criteria로 변환되며 invalid/overflow가 SQL에 도달하지 않습니다.", "count와 list는 같은 semantic row 집합을 사용하고 동점에도 page order가 결정적입니다.", "검색 값과 URL은 올바르게 binding/encoding되며 raw sort/keyword가 SQL code나 metric label이 되지 않습니다.", "offset drift가 재현되고 cursor mode는 정의된 복합 order에서 중복 없이 다음 rows를 찾습니다.", "대표 query는 rows/latency/count budgets와 authorization/cache isolation을 만족합니다."],
    cleanup: ["synthetic search rows, indexes, snapshots/cursors와 cache entries를 제거합니다.", "EXPLAIN/log artifacts에서 raw keyword와 synthetic secret canary가 0건인지 확인합니다.", "transactions, connections, executors와 temporary schemas를 종료합니다.", "로컬 Paging.java와 BoardMapper.xml은 수정하지 않습니다."],
    extensions: ["full-text/search engine adapter에도 같은 authorization·cursor contract를 적용합니다.", "approximate total과 confidence/freshness 표시를 설계합니다.", "locale별 collation/Unicode normalization matrix를 확장합니다.", "cursor signing/key rotation과 expired/tampered token recovery를 훈련합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java 예제를 실행해 criteria, page 산술, stable order, count parity, encoded links와 offset/cursor 결과를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "size cap과 overflow 거절을 설명합니다.", "tie-breaker 순서를 확인합니다.", "total과 ids 일치를 확인합니다.", "URL query encoding을 확인합니다.", "offset duplicate 1과 cursor 결과를 비교합니다."], hints: ["각 출력이 HTTP, application, SQL 중 어느 계약인지 표시하세요."], expectedOutcome: "페이지 번호 UI가 아니라 결과 집합 정확성을 실행 증거로 설명합니다.", solutionOutline: ["normalize→bound→order→filter→page→link→seek 순서입니다."] },
    { difficulty: "응용", prompt: "지원 DB에서 offset와 cursor 검색 API를 구현하고 drift·plan matrix를 통과시키세요.", requirements: ["typed criteria와 sort allow-list를 사용합니다.", "count/list predicate parity를 검증합니다.", "unique total order를 둡니다.", "encoded links/cursors를 만듭니다.", "concurrent insert/delete를 주입합니다.", "EXPLAIN과 rows budget을 기록합니다.", "cache/authorization isolation을 검증합니다."], hints: ["cursor predicate는 ORDER BY의 모든 key와 방향을 그대로 반영하세요."], expectedOutcome: "동시 변경과 큰 dataset에서도 명시된 일관성·비용을 지키는 목록 API가 완성됩니다.", solutionOutline: ["bind→normalize→authorize→query→measure→navigate→verify 순서입니다."] },
    { difficulty: "설계", prompt: "조직용 검색·pagination release standard를 작성하세요.", requirements: ["input/cap/overflow 규칙을 둡니다.", "sort/collation/tie-breaker 규칙을 둡니다.", "count/list/snapshot 계약을 둡니다.", "binding/injection/authorization 규칙을 둡니다.", "offset/cursor 선택 기준을 둡니다.", "plan/index/count/cache/observability budgets를 둡니다.", "property/slice/DB/load/concurrency gates를 포함합니다."], hints: ["정확성, UX, 비용을 서로 독립 축으로 평가하세요."], expectedOutcome: "모든 목록 endpoint가 동일한 검색 정확성·성능·보안 기준으로 검토됩니다.", solutionOutline: ["constrain→order→align→encode→seek→budget→prove 순서입니다."] },
  ],
  nextSessions: ["crud-06-reply-rest-ajax"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["Paging.java는 read-only로 32 lines/959 bytes와 SHA-256 F9AEA184CD41397B889135C16A28FC0ADA4445779E451DF02D38F3CE4C74C191를 확인했습니다.", "BoardMapper.xml은 read-only로 68 lines/3,161 bytes와 SHA-256 6079144E1E517A4956F7257689CA978E1D12A6303FF7F7C0272D81F8DD3FD9A6을 확인했습니다.", "원본에서 page/offset 관련 필드와 count/list, ORDER BY, LIMIT/OFFSET의 구조를 확인했지만 동적 검색 fragments, total-order tie-breaker, cursor와 snapshot 계약이 있다는 가정은 하지 않았습니다.", "실제 package, URL, table/column, keyword, 사용자 데이터, secret와 configuration 값은 maintained examples에 복제하지 않았습니다.", "offset/cursor, SQL binding, collation/index와 isolation은 지원 DB·driver·MyBatis integration으로 별도 검증해야 합니다."] },
});

export default session;
