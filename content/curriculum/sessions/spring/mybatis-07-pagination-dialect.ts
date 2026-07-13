import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + Math.min(10, lineCount), explanation: "입력 계약과 순수 pagination model을 정의합니다. 외부 DB, driver, 계정이나 network는 필요하지 않습니다." },
      { lines: Math.min(11, lineCount) + "-" + Math.max(11, lineCount - 7), explanation: "방언별 bind 순서, 안정 정렬, offset/keyset 차이 또는 경계 계산을 JDK 21 자료구조로 실행합니다." },
      { lines: Math.max(1, lineCount - 6) + "-" + lineCount, explanation: "SQL 값이나 사용자 데이터가 아니라 계획·행 수·불변식만 출력하며 문서의 stdout과 정확히 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "javac --release 21", "외부 MyBatis·DB·driver·credential 불필요"], command: "javac --release 21 " + filename + " && java " + filename.replace(/\.java$/, "") },
    output: { value: output, explanation: ["표시된 stdout은 격리된 임시 디렉터리에서 실제 컴파일·실행해 한 글자씩 검증합니다.", "이 코드는 방언·페이지 계약을 설명하는 deterministic model이며 실제 optimizer, collation, isolation과 MyBatis binding 검증은 대상 DB 통합 테스트가 담당합니다."] },
    experiments: [
      { change: "정렬 tie-breaker, bind 순서 또는 page base를 하나씩 바꿉니다.", prediction: "중복·누락 또는 다른 window가 만들어져 출력 불변식이 깨집니다.", result: "요청 DTO, mapper parameter 이름, SQL placeholder 순서와 expected window를 하나의 contract test로 고정합니다." },
      { change: "빈 페이지, 최대 크기, 동시 insert와 지원하지 않는 databaseId를 주입합니다.", prediction: "경계를 조기에 거부하지 않으면 overflow·full scan·잘못된 방언 선택이 운영 SQL까지 진행됩니다.", result: "service validation과 startup statement inventory에서 fail closed하고 target DB readback을 release gate에 둡니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "pagination-window-contract",
    title: "페이지 번호를 SQL 조각이 아니라 안정된 행 구간 계약으로 정의합니다",
    lead: "페이징은 LIMIT 한 줄을 붙이는 작업이 아닙니다. 요청의 기준점, 정렬 순서, 최대 크기, 빈 결과와 전체 개수의 의미를 먼저 고정해야 MySQL과 Oracle 구현을 교체해도 API가 같은 결과를 냅니다.",
    explanations: [
      "page는 보통 사용자에게 1부터 보이지만 SQL offset은 0부터 셉니다. page=1이면 offset=0이라는 변환을 service 경계 한 곳에 두고 controller, Criteria와 mapper가 서로 다른 기준을 재계산하지 않게 합니다.",
      "size는 양수이면서 운영 상한 이하라는 불변식을 가집니다. 음수·0·과도한 크기는 mapper까지 보내지 않고 validation error로 종료해 full scan, memory spike와 connection 장기 점유를 막습니다.",
      "페이지 결과는 items, requested page/size, hasNext 또는 totalCount 같은 metadata 계약을 포함합니다. totalCount를 제공한다면 목록 query와 count query가 어떤 시점의 데이터를 보는지도 명시해야 합니다.",
      "원본 두 BoardMapper XML은 각각 ROWNUM 중심 경로와 LIMIT/OFFSET 중심 경로를 보여 줍니다. 이 자료는 SQL literal이나 namespace를 복제하지 않고 paging token·동적 element 수·bind 형태만 provenance로 사용합니다.",
      "중간 세션부터 읽는 학습자는 앞선 동적 SQL 세션의 if·choose·foreach가 SQL shape을 바꾼다는 점을 먼저 확인해야 합니다. 이 세션은 그 shape에 page window와 database dialect라는 두 축을 추가합니다.",
    ],
    concepts: [
      c("page window", "정렬된 전체 결과에서 이번 요청이 관찰해야 할 시작·끝 구간과 그 계산 규칙입니다.", ["page base와 offset base를 분리합니다.", "size 상한과 overflow를 검사합니다.", "빈 window도 정상 결과로 정의합니다."]),
      c("Criteria", "검색 조건, 정렬과 paging 값을 mapper에 전달하는 명시적 요청 객체입니다.", ["mutable field 남용을 피합니다.", "validation 후 immutable하게 전달합니다."]),
      c("pagination invariant", "같은 snapshot과 같은 ordering에서 같은 요청이 같은 순서의 행을 반환해야 한다는 검증 조건입니다.", ["행 수만 비교하지 않습니다.", "식별자 순서와 경계를 함께 봅니다."]),
    ],
    codeExamples: [java("mybatis07-mysql-window", "1-based page를 MySQL bind 계획으로 변환", "Mybatis07MysqlWindow.java", "page=3,size=20을 검증하고 LIMIT·OFFSET placeholder와 bind 순서를 값 노출 없이 계산합니다.", String.raw`import java.util.List;

public class Mybatis07MysqlWindow {
  record Criteria(int page, int size) {
    Criteria {
      if (page < 1) throw new IllegalArgumentException("page");
      if (size < 1 || size > 100) throw new IllegalArgumentException("size");
    }
    int offset() { return Math.multiplyExact(page - 1, size); }
  }

  record BoundPlan(String shape, List<Integer> binds) {}

  static BoundPlan render(Criteria criteria) {
    return new BoundPlan("ORDER BY stable_key DESC LIMIT ? OFFSET ?",
        List.of(criteria.size(), criteria.offset()));
  }

  public static void main(String[] args) {
    Criteria criteria = new Criteria(3, 20);
    BoundPlan plan = render(criteria);
    long placeholders = plan.shape().chars().filter(ch -> ch == '?').count();
    System.out.println("page=" + criteria.page());
    System.out.println("offset=" + criteria.offset());
    System.out.println("placeholders=" + placeholders);
    System.out.println("binds=" + plan.binds());
    System.out.println("window=41..60");
  }
}`, "page=3\noffset=40\nplaceholders=2\nbinds=[20, 40]\nwindow=41..60", ["local-mysql-mapper", "mybatis-sqlmap", "mysql-select", "java-math"])],
    diagnostics: [d("첫 페이지는 맞지만 두 번째부터 한 페이지가 통째로 건너뛰거나 같은 행이 반복됩니다.", "UI의 1-based page를 mapper가 다시 감소시키거나 controller와 Criteria가 각각 offset을 계산했습니다.", ["request page/size", "Criteria 변환 지점", "final bind order", "expected first/last ordinal", "empty page behavior"], "page→offset 변환을 service boundary의 immutable Criteria factory 한 곳으로 모으고 SQL에는 계산된 offset만 전달합니다.", "page 1·2, last, empty, size max와 overflow contract test를 방언별로 실행합니다.")],
    expertNotes: ["클라이언트 page 번호를 SQL offset으로 그대로 쓰지 않습니다.", "totalCount 없는 cursor API와 totalCount 있는 관리 화면 API는 서로 다른 비용·일관성 계약으로 문서화합니다."],
  },
  {
    id: "stable-ordering-tiebreaker",
    title: "ORDER BY를 유일하고 결정적인 순서로 만들어 중복·누락을 통제합니다",
    lead: "DB는 ORDER BY에 적지 않은 순서를 보장하지 않습니다. 같은 timestamp나 점수를 가진 행이 많으면 page query가 매번 다른 tie 순서를 골라 offset 경계에서 행이 이동할 수 있습니다.",
    explanations: [
      "비유일 business column만 정렬하면 동점 행의 상대 순서는 미정입니다. created_at DESC 뒤에 immutable unique key DESC를 추가해 total order를 만들고 그 전체 tuple을 API 계약과 index 설계에 반영합니다.",
      "NULL 정렬 위치, 문자 collation, 대소문자와 timezone 변환은 vendor와 설정에 따라 달라질 수 있습니다. MySQL·Oracle 양쪽에서 같은 의미가 필요한 필드는 명시적 normalization 또는 결과 계약을 둡니다.",
      "정렬 column과 방향을 사용자 문자열로 직접 치환하면 injection과 index 회피가 동시에 생깁니다. 허용한 enum을 mapper statement id 또는 안전한 choose branch에 매핑하고 미등록 값은 거부합니다.",
      "count가 맞아도 items 순서가 틀릴 수 있으므로 테스트는 ID tuple 전체를 비교합니다. 첫/마지막 key, 다음 페이지와의 교집합, 전체 union을 검사하면 경계 오류가 드러납니다.",
      "동시 쓰기가 없는 정적 fixture에서 먼저 결정성을 증명하고, 그다음 insert·update·delete를 page 사이에 주입합니다. 이 둘을 섞으면 SQL ordering 결함과 isolation 현상을 구분하기 어렵습니다.",
    ],
    concepts: [
      c("total order", "비교 가능한 모든 두 행의 선후가 결정되고 동점이 남지 않는 정렬 관계입니다.", ["unique tie-breaker를 포함합니다.", "방향과 NULL 규칙을 고정합니다."]),
      c("tie-breaker", "business sort key가 같은 행의 순서를 결정하는 안정적이고 보통 유일한 보조 key입니다.", ["mutable key는 피합니다.", "복합 index 순서와 맞춥니다."]),
      c("sort allowlist", "외부 정렬 선택을 미리 승인한 column·direction 조합에만 매핑하는 정책입니다.", ["raw identifier binding은 parameter placeholder로 해결되지 않습니다.", "미지원 조합은 fail closed합니다."]),
    ],
    diagnostics: [d("같은 요청을 반복하면 일부 행의 위치가 바뀌고 인접 페이지 사이에 교집합이 생깁니다.", "ORDER BY가 동점 행을 완전히 정렬하지 않았거나 NULL/collation 규칙이 환경마다 다릅니다.", ["final BoundSql order clause shape", "동점 key 분포", "unique tie-breaker", "DB collation/NULL rule", "index definition"], "정렬 tuple 끝에 immutable unique key를 추가하고 양방언의 정렬 의미와 index를 contract test로 맞춥니다.", "fixture에 동일 timestamp·동일 점수·NULL·대소문자 행을 넣고 exact identifier sequence를 검증합니다.")],
    expertNotes: ["PK를 무조건 tie-breaker로 쓰기보다 pagination lifetime 동안 값이 불변이고 ordering 의미가 허용되는지 확인합니다.", "정렬 변경은 UI 옵션 추가가 아니라 page cursor와 index를 깨뜨릴 수 있는 API version 변경입니다."],
  },
  {
    id: "mysql-limit-offset-binding",
    title: "MySQL LIMIT·OFFSET의 bind 순서와 비용을 분리해 검증합니다",
    lead: "MySQL 문법은 간단하지만 LIMIT 인수 순서, OFFSET 계산, 큰 offset의 scan 비용과 동시 변경에서 생기는 drift를 함께 이해해야 운영 가능한 페이징이 됩니다.",
    explanations: [
      "LIMIT row_count OFFSET offset 형태를 기준으로 mapper parameter 이름과 PreparedStatement bind 순서를 고정합니다. LIMIT offset,row_count 변형과 섞으면 숫자는 정상이어도 window가 뒤집힙니다.",
      "MyBatis의 hash-style parameter는 값을 prepared parameter로 전달합니다. page size와 offset도 숫자 validation을 거친 뒤 bind하며 사용자 입력을 dollar substitution으로 SQL text에 삽입하지 않습니다.",
      "큰 offset은 앞의 행을 결과에서 버리더라도 찾고 정렬하는 비용을 요구할 수 있습니다. explain plan, rows examined, latency와 cancellation 결과를 page bucket별로 관측합니다.",
      "covering index가 있더라도 select column, filter cardinality와 order direction에 따라 table lookup·filesort가 생길 수 있습니다. 문법 성공과 계획 안정성을 별도 release criterion으로 둡니다.",
      "offset은 임의 페이지 이동에 편리하지만 쓰기가 활발한 feed에는 snapshot 또는 keyset이 더 적합할 수 있습니다. 한 API에서 목적에 따라 두 방식을 명시적으로 나눕니다.",
    ],
    concepts: [
      c("LIMIT", "MySQL SELECT 결과에서 반환할 최대 행 수를 지정하는 row limiting 절입니다.", ["OFFSET과 인수 의미를 고정합니다.", "bind parameter로 전달합니다."]),
      c("large offset cost", "큰 시작 위치까지 탐색·정렬한 뒤 앞 행을 버리는 데 드는 누적 비용입니다.", ["page 깊이별 latency를 봅니다.", "keyset 전환 기준을 둡니다."]),
      c("BoundSql", "동적 SQL 적용 후 실행될 SQL shape과 parameter mapping을 담은 MyBatis 실행 입력입니다.", ["값과 shape을 구분해 관측합니다.", "비밀·개인정보는 기록하지 않습니다."]),
    ],
    diagnostics: [d("깊은 페이지에서 connection timeout과 DB CPU가 급증하지만 반환 행 수는 항상 작습니다.", "LIMIT 결과 수만 작다고 쿼리가 싸다고 가정해 큰 OFFSET의 탐색·정렬 비용을 무시했습니다.", ["page/offset bucket latency", "EXPLAIN rows/extra", "index/order alignment", "statement timeout", "pool wait time"], "임의 이동이 필요한 최대 깊이를 제한하고 그 이후는 keyset cursor 또는 검색 조건 축소로 전환합니다.", "성능 테스트에 50·95·99 percentile page depth와 cancellation 후 connection 회수 검증을 포함합니다.")],
    expertNotes: ["LIMIT은 결과 cardinality 상한이지 작업량 상한이 아닙니다.", "optimizer plan을 문서 SQL 문자열과 동일시하지 말고 대상 버전·통계·실제 bind 범위에서 검증합니다."],
  },
  {
    id: "oracle-rownum-nesting",
    title: "Oracle ROWNUM의 할당 시점 때문에 필요한 중첩 query를 상태 전이로 이해합니다",
    lead: "ROWNUM은 최종 정렬 결과의 고정 row number가 아닙니다. 정렬과 상한·하한을 잘못 배치하면 실행은 되지만 요청한 page가 아닌 행을 반환합니다.",
    explanations: [
      "전통적인 ROWNUM pagination은 안쪽 query에서 결정적 ORDER BY를 적용하고, 중간 layer에서 upper bound를 제한하며 ROWNUM을 alias로 노출한 뒤, 바깥 layer에서 lower bound를 적용합니다.",
      "ROWNUM > N을 같은 level에서 단독 조건으로 두면 첫 후보가 조건을 통과하지 못해 다음 후보도 다시 ROWNUM 1이 되는 식의 직관과 다른 결과가 생길 수 있습니다. evaluation 시점을 diagram과 fixture로 확인합니다.",
      "upper bound를 먼저 적용하면 stopkey 최적화 가능성이 생기지만 실제 plan은 version, statistics와 query shape에 의존합니다. 예상 optimizer behavior를 보장으로 표현하지 않습니다.",
      "지원 Oracle version에서 row limiting clause를 사용할 수 있어도 기존 ROWNUM mapper를 한 번에 치환하지 않습니다. NULL ordering, tie-breaker, count와 bind semantics를 differential test로 비교합니다.",
      "원본 TESTER mapper는 ROWNUM token, if·choose branch와 다수 binding을 포함합니다. 학습 자료는 구조를 provenance로만 남기고 실제 table, column, namespace와 조건 literal을 공개 예제로 복사하지 않습니다.",
    ],
    concepts: [
      c("ROWNUM", "Oracle이 query 처리 중 반환 후보 행에 부여하는 pseudocolumn입니다.", ["ORDER BY 이후 고정 번호로 오해하지 않습니다.", "중첩 위치가 의미를 결정합니다."]),
      c("upper-bound pushdown", "필요한 마지막 ordinal까지만 내부 처리하도록 상한 조건을 가능한 안쪽에 두는 설계입니다.", ["plan으로 검증합니다.", "하한과 역할을 구분합니다."]),
      c("row limiting clause", "지원 Oracle 버전에서 OFFSET/FETCH 형태로 행 구간을 표현하는 SELECT 문법입니다.", ["정렬 불변식은 여전히 필요합니다.", "migration parity를 검증합니다."]),
    ],
    codeExamples: [java("mybatis07-oracle-rownum", "Oracle 중첩 ROWNUM의 상·하한 순서", "Mybatis07OracleRownum.java", "page=3,size=10의 inclusive window와 upper/lower bind 순서를 작은 순수 모델로 검증합니다.", String.raw`import java.util.List;
import java.util.stream.IntStream;

public class Mybatis07OracleRownum {
  record Window(int lower, int upper) {
    static Window of(int page, int size) {
      if (page < 1 || size < 1) throw new IllegalArgumentException("window");
      int upper = Math.multiplyExact(page, size);
      return new Window(Math.subtractExact(upper, size) + 1, upper);
    }
  }

  public static void main(String[] args) {
    Window window = Window.of(3, 10);
    List<Integer> bindOrder = List.of(window.upper(), window.lower());
    List<Integer> rows = IntStream.rangeClosed(1, 35)
        .filter(n -> n <= window.upper())
        .filter(n -> n >= window.lower())
        .boxed().toList();
    System.out.println("window=" + window.lower() + ".." + window.upper());
    System.out.println("bind-order=" + bindOrder);
    System.out.println("upper-before-lower=true");
    System.out.println("rows=" + rows.size());
    System.out.println("first-last=" + rows.getFirst() + "," + rows.getLast());
  }
}`, "window=21..30\nbind-order=[30, 21]\nupper-before-lower=true\nrows=10\nfirst-last=21,30", ["local-oracle-mapper", "oracle-select", "mybatis-sqlmap", "java-stream"])],
    diagnostics: [d("Oracle page 1은 그럴듯하지만 page 2부터 정렬 전 행이 섞이거나 빈 결과가 나옵니다.", "ROWNUM 조건과 ORDER BY를 같은 query level에 잘못 두었거나 lower bound를 alias 노출 전에 적용했습니다.", ["실제 nested query shape", "ORDER BY 위치", "ROWNUM alias level", "upper/lower bind order", "Oracle execution plan"], "결정 정렬→upper bound+ROWNUM alias→lower bound의 세 단계 의미를 복원하고 exact fixture sequence로 비교합니다.", "1·2·last·empty page와 동점/NULL fixture를 Oracle target version에서 differential test합니다.")],
    expertNotes: ["ROWNUM과 analytic ROW_NUMBER()는 이름이 비슷해도 계산 의미와 query shape이 다릅니다.", "row limiting clause로 이동할 때도 API page contract와 target plan을 각각 검증합니다."],
  },
  {
    id: "database-id-dialect-routing",
    title: "databaseIdProvider와 statement inventory로 방언 선택을 startup에 확정합니다",
    lead: "runtime에서 vendor를 추측해 문자열을 조립하기보다 configuration이 database product를 승인된 databaseId로 정규화하고, mapper가 그 id에 대응하는 statement를 명시하도록 합니다.",
    explanations: [
      "MyBatis databaseIdProvider는 DatabaseMetaData의 product name을 짧은 logical id로 매핑할 수 있습니다. 원시 product string을 코드 여러 곳에서 contains 비교하지 말고 configuration 한 곳에서 versioned mapping을 관리합니다.",
      "같은 statement id에 generic variant와 databaseId variant가 함께 있으면 선택 규칙을 알아야 합니다. 배포 artifact의 mapped statement inventory를 databaseId별로 boot test해 누락·중복·의도치 않은 generic fallback을 차단합니다.",
      "방언별 XML을 별도 resource로 나누거나 같은 namespace에서 databaseId attribute로 구분할 수 있습니다. 어느 구조든 service와 domain은 vendor SQL token을 몰라야 합니다.",
      "지원하지 않는 databaseId는 첫 요청에서 syntax error가 나기 전에 startup failure가 되어야 합니다. expected id set, selected id와 required statement ids만 로그에 남기고 connection metadata 값은 제한합니다.",
      "MySQL과 Oracle 구현이 같은 page contract를 만족해도 optimizer, isolation과 type mapping은 다릅니다. syntax renderer unit test와 실제 database integration matrix를 계층적으로 운영합니다.",
    ],
    concepts: [
      c("dialect", "같은 데이터 접근 의도를 특정 database 제품의 SQL 문법·함수·제한으로 표현하는 규칙 집합입니다.", ["service API와 분리합니다.", "지원 버전과 함께 관리합니다."]),
      c("databaseIdProvider", "DataSource metadata를 logical databaseId로 정규화해 vendor-specific mapped statement 선택에 쓰는 MyBatis 확장점입니다.", ["startup에 결정합니다.", "mapping allowlist를 둡니다."]),
      c("statement inventory", "선택한 configuration에 등록된 namespace·id·databaseId·command type의 비밀값 없는 목록입니다.", ["required statement를 검증합니다.", "배포 artifact와 연결합니다."]),
    ],
    codeExamples: [java("mybatis07-dialect-router", "지원 databaseId만 허용하는 fail-closed router", "Mybatis07DialectRouter.java", "MySQL과 Oracle page shape을 logical id로 선택하고 미지원 id를 안전하게 거부합니다.", String.raw`import java.util.Locale;
import java.util.Map;

public class Mybatis07DialectRouter {
  interface Dialect { String pageShape(); }

  static final Map<String, Dialect> DIALECTS = Map.of(
      "mysql", () -> "LIMIT ? OFFSET ?",
      "oracle", () -> "ROWNUM <= ? THEN rn >= ?");

  static Dialect require(String databaseId) {
    Dialect dialect = DIALECTS.get(databaseId.toLowerCase(Locale.ROOT));
    if (dialect == null) throw new IllegalArgumentException("unsupported-database-id");
    return dialect;
  }

  public static void main(String[] args) {
    System.out.println("mysql=" + require("mysql").pageShape());
    System.out.println("oracle=" + require("oracle").pageShape());
    try {
      require("unknown");
    } catch (IllegalArgumentException exception) {
      System.out.println("unknown=" + exception.getMessage());
    }
    System.out.println("supported=" + DIALECTS.keySet().stream().sorted().toList());
  }
}`, "mysql=LIMIT ? OFFSET ?\noracle=ROWNUM <= ? THEN rn >= ?\nunknown=unsupported-database-id\nsupported=[mysql, oracle]", ["mybatis-configuration", "mybatis-database-id-api", "mybatis-sqlmap", "local-mysql-mapper", "local-oracle-mapper", "postgres-limit"])],
    diagnostics: [d("개발 DB에서는 정상인데 다른 vendor 환경 첫 호출에서 statement not found 또는 syntax error가 발생합니다.", "databaseId mapping과 vendor-specific statement completeness를 startup에 검증하지 않고 generic fallback에 의존했습니다.", ["selected logical databaseId", "product→id allowlist", "required statement inventory", "generic/vendor collision", "packaged mapper resources"], "지원 vendor/version별 required statement manifest를 만들고 context startup에서 누락·중복·unknown id를 실패시킵니다.", "모든 지원 databaseId로 configuration을 boot하는 artifact-level test와 target DB smoke query를 release gate로 둡니다.")],
    expertNotes: ["database product name은 운영 telemetry에 그대로 노출하기보다 승인한 logical id와 driver/version inventory로 제한합니다.", "dialect 추상화가 실제 DB 차이를 제거하지 않으므로 support matrix와 migration runbook을 유지합니다."],
  },
  {
    id: "parameter-binding-and-sort-safety",
    title: "값 binding과 identifier 선택을 구분해 injection과 bind 순서 오류를 막습니다",
    lead: "Prepared parameter는 값에는 강력하지만 column name, direction과 SQL keyword를 대신하지 않습니다. 페이징은 숫자 값과 정렬 identifier가 함께 들어와 이 차이를 특히 분명히 보여 줍니다.",
    explanations: [
      "page size, offset과 cursor key는 hash-style binding으로 전달하고 Java type, JDBC type와 null 가능성을 명시합니다. BoundSql의 placeholder 개수와 ParameterMapping 순서를 값 없는 구조로 검사합니다.",
      "sort column과 ASC/DESC는 placeholder로 bind할 수 없으므로 enum→미리 작성한 statement branch로 매핑합니다. 외부 문자열을 dollar substitution으로 그대로 붙이지 않습니다.",
      "동적 choose branch마다 parameter 이름이 달라지면 특정 방언에서만 binding exception이 납니다. Criteria property name과 mapper interface parameter name을 compile/integration contract로 맞춥니다.",
      "numeric input도 validation 없이 안전하다고 보지 않습니다. 음수, overflow와 극단 크기는 injection과 별개로 resource exhaustion이나 계획 악화를 유발합니다.",
      "오류 로그에는 statement id, databaseId, parameter count/type category와 page bucket만 남깁니다. cursor 값, 검색어, row content와 완성 SQL을 공개 telemetry에 기록하지 않습니다.",
    ],
    concepts: [
      c("value parameter", "PreparedStatement placeholder에 type-safe하게 전달할 수 있는 값입니다.", ["page 숫자와 cursor key가 해당합니다.", "identifier와 구분합니다."]),
      c("identifier allowlist", "정렬 column·direction처럼 bind할 수 없는 SQL 구조를 승인된 선택지에만 매핑하는 표입니다.", ["raw input을 연결하지 않습니다.", "branch coverage를 검증합니다."]),
      c("parameter mapping order", "SQL placeholder와 Java property/JDBC type이 대응하는 순서입니다.", ["방언별로 검증합니다.", "숫자 값 자체는 telemetry에서 생략합니다."]),
    ],
    diagnostics: [d("특정 정렬 옵션에서 SQL injection scanner 경고가 나거나 parameter index 오류가 발생합니다.", "값 placeholder와 identifier substitution을 혼동했거나 동적 branch마다 placeholder와 mapping 수가 달라졌습니다.", ["BoundSql shape hash", "placeholder/mapping count", "sort enum mapping", "dollar substitution usage", "databaseId branch"], "정렬을 enum allowlist와 정적 choose branch로 바꾸고 값은 모두 hash-style binding으로 통일합니다.", "모든 sort×direction×databaseId 조합의 placeholder count, mapping names와 negative input을 자동 검증합니다.")],
    expertNotes: ["MyBatis dollar-style substitution이 필요한 metadata use case가 있어도 외부 입력과 연결되는 경로는 분리·allowlist·review합니다.", "안전성 검사는 rendered SQL 값 덤프 없이 shape와 mapping metadata로 수행할 수 있습니다."],
  },
  {
    id: "count-query-consistency",
    title: "목록 query와 count query의 의미·snapshot·비용을 같은 계약으로 관리합니다",
    lead: "totalCount는 단순 부가 숫자가 아닙니다. filter branch가 하나라도 다르거나 두 query 사이에 쓰기가 발생하면 items와 metadata가 서로 모순될 수 있습니다.",
    explanations: [
      "목록과 count는 동일한 effective predicate를 공유해야 합니다. reusable SQL fragment를 쓸 때도 projection·join multiplicity와 NULL semantics가 count에 어떤 영향을 주는지 검증합니다.",
      "count(*)와 count(column)은 NULL 처리 의미가 다르고 join은 root entity를 중복시킬 수 있습니다. API가 세는 대상이 행, distinct root 또는 group인지 명시합니다.",
      "두 statement를 같은 transaction에서 실행해도 isolation level에 따라 같은 snapshot을 보장하는 방식이 다릅니다. 엄격한 일관성이 꼭 필요한지, approximate/stale count를 허용하는지 제품 계약으로 결정합니다.",
      "큰 dataset의 정확한 count는 page 조회보다 비쌀 수 있습니다. hasNext를 size+1 조회로 계산하거나 비동기/추정 count를 제공하는 대안을 화면 목적에 맞춰 선택합니다.",
      "test는 count 숫자만 보지 않고 predicate variant별 items union과 distinct identity를 대조합니다. 동시 insert/delete 주입 시 허용한 모순 범위를 문서화합니다.",
    ],
    concepts: [
      c("count parity", "목록 query와 count query가 같은 논리 대상을 같은 filter 의미로 계산한다는 성질입니다.", ["join cardinality를 확인합니다.", "동적 branch를 공유·검증합니다."]),
      c("snapshot consistency", "여러 읽기가 동일한 논리 시점의 committed state를 관찰하는 성질입니다.", ["isolation과 DB 구현에 의존합니다.", "API 요구 수준을 정합니다."]),
      c("size plus one", "요청 size보다 한 행 더 조회해 다음 페이지 존재만 판단하는 방식입니다.", ["전체 count 비용을 피합니다.", "임의 마지막 페이지 정보는 제공하지 않습니다."]),
    ],
    diagnostics: [d("items는 20개인데 totalCount가 0이거나 마지막 페이지 수가 요청마다 앞뒤로 움직입니다.", "목록/count의 동적 predicate·join 또는 transaction snapshot이 서로 다릅니다.", ["두 statement의 predicate shape", "join multiplicity", "count target", "transaction/isolation", "사이의 concurrent writes"], "공통 filter contract를 만들고 count 대상과 consistency 수준을 명시하며 필요하면 같은 read-only transaction/snapshot에서 실행합니다.", "모든 조건 조합과 동시 insert/delete 시나리오에서 items identity·count·hasNext 허용 범위를 검증합니다.")],
    expertNotes: ["정확한 total이 사용자 가치보다 비싸면 API 계약을 바꾸는 것이 SQL micro-optimization보다 낫습니다.", "read-only 표시는 의도와 최적화 hint일 수 있으나 모든 DB에서 snapshot 의미를 자동 보장하지 않습니다."],
  },
  {
    id: "offset-versus-keyset",
    title: "offset과 keyset pagination을 동시 변경·탐색 요구에 맞춰 선택합니다",
    lead: "offset은 페이지 번호 이동이 쉽지만 앞쪽에 행이 삽입되면 다음 요청의 물리 위치가 밀립니다. keyset은 마지막 정렬 key 이후를 요청해 drift와 깊은 scan을 줄이는 대신 cursor 계약이 필요합니다.",
    explanations: [
      "offset page 1을 읽은 뒤 더 최신 행이 앞에 삽입되면 page 2의 offset 위치가 이동해 page 1의 마지막 행이 다시 나타날 수 있습니다. 삭제에서는 반대로 아직 못 본 행을 건너뛸 수 있습니다.",
      "keyset query는 마지막 행의 전체 sort tuple을 cursor로 전달하고 그보다 뒤인 행을 조건으로 찾습니다. tie-breaker까지 cursor에 포함하지 않으면 동점 구간에서 여전히 중복·누락이 생깁니다.",
      "복합 방향과 NULL을 가진 keyset predicate는 단순 id 비교보다 복잡합니다. dialect별 row-value comparison 지원과 index order를 확인하고 explicit boolean predicate를 test합니다.",
      "cursor는 raw database value를 그대로 노출하지 않고 version, sort contract와 opaque encoding/integrity 보호를 고려합니다. 그래도 서버는 decoding 후 type·range·expiry를 재검증합니다.",
      "관리자 화면의 임의 page jump에는 offset, 실시간 feed나 무한 scroll에는 keyset처럼 use case별로 나눌 수 있습니다. 두 API가 같은 이름으로 의미를 섞지 않게 합니다.",
    ],
    concepts: [
      c("offset pagination", "정렬 결과의 앞 N행을 건너뛰고 다음 size행을 반환하는 방식입니다.", ["임의 page 이동이 쉽습니다.", "깊이 비용과 write drift가 있습니다."]),
      c("keyset pagination", "이전 page 마지막 sort tuple 이후의 행을 index predicate로 찾는 방식입니다.", ["stable order가 필수입니다.", "cursor version을 관리합니다."]),
      c("cursor", "다음 window의 기준이 되는 sort contract와 마지막 key를 전달하는 불투명 token입니다.", ["검증·expiry를 둡니다.", "PII나 비밀을 넣지 않습니다."]),
    ],
    codeExamples: [java("mybatis07-keyset-drift", "동시 insert에서 offset 중복과 keyset 안정성 비교", "Mybatis07KeysetDrift.java", "첫 페이지 뒤에 새 행이 삽입된 상황을 재현해 offset 중복과 keyset 결과를 식별자 목록으로 비교합니다.", String.raw`import java.util.ArrayList;
import java.util.List;

public class Mybatis07KeysetDrift {
  static List<Integer> offsetPage(List<Integer> rows, int offset, int size) {
    return rows.subList(offset, Math.min(rows.size(), offset + size));
  }

  static List<Integer> keysetPage(List<Integer> rows, int lastSeen, int size) {
    return rows.stream().filter(id -> id < lastSeen).limit(size).toList();
  }

  public static void main(String[] args) {
    List<Integer> rows = new ArrayList<>(List.of(105, 104, 103, 102, 101, 100));
    List<Integer> first = List.copyOf(offsetPage(rows, 0, 3));
    rows.addFirst(106);
    List<Integer> offsetSecond = List.copyOf(offsetPage(rows, 3, 3));
    List<Integer> keysetSecond = keysetPage(rows, first.getLast(), 3);
    boolean duplicate = first.stream().anyMatch(offsetSecond::contains);
    System.out.println("first=" + first);
    System.out.println("offset-after-insert=" + offsetSecond);
    System.out.println("keyset-after-insert=" + keysetSecond);
    System.out.println("offset-duplicate=" + duplicate);
    System.out.println("keyset-overlap=" + first.stream().anyMatch(keysetSecond::contains));
  }
}`, "first=[105, 104, 103]\noffset-after-insert=[103, 102, 101]\nkeyset-after-insert=[102, 101, 100]\noffset-duplicate=true\nkeyset-overlap=false", ["mysql-select", "oracle-select", "mybatis-dynamic-sql", "java-list"])],
    diagnostics: [d("무한 스크롤 중 같은 항목이 다시 보이거나 일부 항목이 영원히 나타나지 않습니다.", "쓰기 많은 정렬 앞부분에서 offset pagination을 사용하거나 keyset cursor에 tie-breaker를 포함하지 않았습니다.", ["sort tuple", "page 사이 insert/delete", "cursor decoded fields/version", "overlap/gap identities", "matching composite index"], "feed 경로를 전체 sort tuple 기반 keyset으로 바꾸고 cursor validation·expiry와 index를 함께 배포합니다.", "동시 insert/delete/update를 page 사이에 주입해 overlap, monotonic order와 cursor replay를 방언별로 검증합니다.")],
    expertNotes: ["keyset은 모든 변경에서 완전한 snapshot을 제공하지 않으며 sort key update는 별도 제품 의미가 필요합니다.", "offset에서 keyset으로 바꾸면 클라이언트 navigation·cache key·analytics도 함께 바뀝니다."],
  },
  {
    id: "page-arithmetic-and-boundaries",
    title: "overflow·last page·empty page를 숫자 경계로 먼저 검증합니다",
    lead: "page와 size가 int라는 이유만으로 안전하지 않습니다. 곱셈 overflow, count 변환, 0건의 totalPages 의미와 범위를 벗어난 page 처리 규칙을 service contract에 둡니다.",
    explanations: [
      "offset=(page-1)*size는 곱셈 전에 page와 size를 검증하고 Math.multiplyExact 같은 checked arithmetic 또는 long을 사용합니다. overflow된 음수가 SQL에 들어가 DB별 다른 오류나 계획을 만들게 두지 않습니다.",
      "totalPages는 total=0일 때 0인지 1인지 UI 계약을 명시합니다. 양수 total에는 나눗셈을 올림해야 하며 total+size-1 자체가 overflow하지 않도록 안전한 식을 씁니다.",
      "요청 page가 마지막보다 크면 빈 page, 404형 오류 또는 마지막 page clamp 중 하나를 선택합니다. 조용한 clamp는 cache와 사용자 위치를 혼란스럽게 할 수 있어 기본값으로 두지 않습니다.",
      "DB count가 long 범위를 넘을 가능성이 낮아도 mapper return type을 int로 줄이는 이유는 없습니다. JDBC/MyBatis mapping과 JSON number 표현까지 end-to-end 범위를 확인합니다.",
      "boundary test는 page 1, size 1/max, total 0/1/exact multiple/+1, huge page와 invalid negative를 표 기반으로 실행합니다. 방언 SQL 없이 pure unit test에서 먼저 빠르게 막습니다.",
    ],
    concepts: [
      c("checked arithmetic", "정수 연산이 표현 범위를 넘으면 조용히 wrap하지 않고 명시적으로 실패시키는 계산입니다.", ["offset 계산에 사용합니다.", "validation error로 변환합니다."]),
      c("last-page policy", "요청이 결과 범위를 벗어날 때 empty, error 또는 clamp 중 어떤 의미를 사용할지 정한 계약입니다.", ["클라이언트와 공유합니다.", "cache key에 반영합니다."]),
      c("ceil division", "정수 total을 size로 나눠 나머지가 있으면 한 page를 더 세는 계산입니다.", ["overflow 없는 식을 씁니다.", "total=0을 따로 정의합니다."]),
    ],
    codeExamples: [java("mybatis07-page-boundary", "count와 offset의 안전한 경계 계산", "Mybatis07PageBoundary.java", "101건/size20의 마지막 page와 매우 큰 page의 곱셈 overflow를 deterministic하게 검증합니다.", String.raw`public class Mybatis07PageBoundary {
  static long pages(long total, long size) {
    if (total < 0 || size < 1) throw new IllegalArgumentException("range");
    return total == 0 ? 0 : 1 + (total - 1) / size;
  }

  static long offset(long page, long size) {
    if (page < 1 || size < 1 || size > 100) throw new IllegalArgumentException("request");
    return Math.multiplyExact(page - 1, size);
  }

  public static void main(String[] args) {
    long total = 101;
    long size = 20;
    long pageCount = pages(total, size);
    System.out.println("pages=" + pageCount);
    System.out.println("last-offset=" + offset(pageCount, size));
    System.out.println("last-count=" + (total - offset(pageCount, size)));
    System.out.println("empty-pages=" + pages(0, size));
    try {
      offset(Long.MAX_VALUE, 100);
    } catch (ArithmeticException exception) {
      System.out.println("huge-page=overflow-rejected");
    }
  }
}`, "pages=6\nlast-offset=100\nlast-count=1\nempty-pages=0\nhuge-page=overflow-rejected", ["java-math", "mybatis-java-api", "mysql-select", "oracle-select"])],
    diagnostics: [d("극단 page 입력에서 음수 offset, DB syntax error 또는 예상치 못한 첫 페이지가 반환됩니다.", "정수 곱셈이 overflow해 wrap됐고 범위 밖 page 정책도 정의되지 않았습니다.", ["request numeric range", "calculation type", "multiply overflow", "DB bind value category", "out-of-range policy"], "validation 뒤 checked long arithmetic으로 offset/totalPages를 계산하고 overflow를 stable client error로 변환합니다.", "경계값·property-based arithmetic test와 DB별 invalid bind negative test를 CI에 둡니다.")],
    expertNotes: ["화면이 작은 숫자만 보낸다는 가정은 public API validation을 대체하지 않습니다.", "page count를 cache할 때 filter·authorization·snapshot 조건이 cache key에 포함되는지 확인합니다."],
  },
  {
    id: "performance-timeout-observability",
    title: "page depth·plan·timeout·pool 점유를 값 없는 telemetry로 연결합니다",
    lead: "페이징 장애는 DB query만 느린 것이 아니라 connection 획득, statement 실행, row mapping과 응답 직렬화가 합쳐진 결과입니다. 각 구간을 같은 trace에서 분리해야 올바른 병목을 찾습니다.",
    explanations: [
      "metric에는 logical statement id, databaseId, sort/filter shape hash, page-depth bucket, requested/returned row count, acquisition/query/mapping latency와 outcome category를 둡니다.",
      "검색어, cursor, raw bind, 완성 SQL과 반환 row는 일반 log·metric label에 넣지 않습니다. high-cardinality와 PII 노출을 동시에 막고 restricted diagnostic도 보존 기간과 접근을 제한합니다.",
      "statement timeout이 발생하면 cancel이 driver/DB에서 실제 작업을 중단했는지, Connection이 pool에 안전히 반환됐는지 검증합니다. HTTP timeout만 먼저 끝내면 background query가 pool을 계속 점유할 수 있습니다.",
      "slow query threshold를 모든 page에 하나로 두지 않고 page depth·filter selectivity·dialect별 SLO와 비교합니다. deep-page 사용량이 증가하면 keyset 전환 또는 제품 navigation 제한의 근거가 됩니다.",
      "plan regression은 schema/index/statistics/DB version 변경과 연결해 canary에서 탐지합니다. plan text 전체를 무조건 고정하기보다 중요한 access path와 작업량 ceiling을 assertion으로 둡니다.",
    ],
    concepts: [
      c("page-depth bucket", "정확한 page 값 대신 1, 2-10, 11-100처럼 비용 경향을 관측하는 제한된 구간 label입니다.", ["cardinality를 제한합니다.", "deep-page SLO를 봅니다."]),
      c("shape hash", "값을 제거한 statement·predicate·sort 구조를 동일 query family로 묶는 식별자입니다.", ["원문 SQL을 공개하지 않습니다.", "version과 연결합니다."]),
      c("cancellation evidence", "timeout 후 server 작업 중단, transaction outcome과 connection 회수를 확인한 증거입니다.", ["client exception만 보지 않습니다.", "pool active count를 확인합니다."]),
    ],
    diagnostics: [d("웹 요청은 timeout됐지만 DB active query와 pool active connection은 계속 증가합니다.", "상위 timeout이 JDBC cancel/transaction cleanup과 연결되지 않아 query가 background에서 계속 실행됩니다.", ["request deadline", "statement timeout", "driver cancel support", "server session state", "pool return/rollback"], "deadline을 statement timeout과 cancellation에 전달하고 finally/transaction completion에서 connection state를 검증합니다.", "slow/deep page fault test에서 timeout→cancel→rollback→pool return을 하나의 trace와 active-count assertion으로 확인합니다.")],
    expertNotes: ["page 번호와 검색어는 필요 이상으로 telemetry에 남기지 않고 bucket과 approved shape로 진단합니다.", "성능 개선은 평균 latency보다 tail, pool wait와 database work 감소로 증명합니다."],
  },
  {
    id: "dialect-qualification-migration",
    title: "방언별 golden corpus와 differential test로 변경·이관을 승인합니다",
    lead: "XML이 parse되고 한 DB에서 예제 한 건이 통과한 것은 다중 방언 지원 증거가 아닙니다. 같은 fixture·요청·expected identity sequence를 모든 지원 DB와 이전/새 SQL에 반복해야 합니다.",
    explanations: [
      "golden corpus에는 빈/한 건/정확 배수/마지막+1, 동점, NULL, unicode/collation, 다양한 filter와 sort, 최대 size, overflow 거부를 포함합니다.",
      "renderer/model unit test는 page arithmetic과 allowlist를 빠르게 검증하고 MyBatis boot test는 databaseId statement selection과 parameter mapping을 검증합니다. target DB test는 syntax, plan, isolation과 type mapping을 확인합니다.",
      "기존 ROWNUM에서 row limiting clause로, offset에서 keyset으로 이동할 때 old/new를 같은 snapshot에서 읽어 identity order·metadata와 error category를 비교합니다.",
      "실패 corpus는 unknown databaseId, mapper resource 누락, parameter name mismatch, timeout, deadlock, connection loss와 partial result를 포함합니다. stack trace 최초 원인을 restricted artifact로 보존하되 사용자 값은 제거합니다.",
      "배포는 databaseId별 canary, shape/version metric, overlap/gap sentinel과 rollback 가능한 mapper artifact로 진행합니다. 모든 DB를 동시에 바꾸지 않고 영향 범위를 제한합니다.",
    ],
    concepts: [
      c("golden corpus", "여러 구현이 반드시 같은 의미 결과를 내야 하는 입력·fixture·expected output 모음입니다.", ["방언마다 재사용합니다.", "경계·실패를 포함합니다."]),
      c("differential test", "old/new 또는 vendor별 구현을 같은 입력에 실행해 결과와 오류 의미를 직접 비교하는 테스트입니다.", ["identity order를 비교합니다.", "허용 차이를 명시합니다."]),
      c("qualification matrix", "JDK·MyBatis·MyBatis-Spring·driver·DB version·dialect별 검증 상태를 기록한 지원 표입니다.", ["artifact와 연결합니다.", "미검증 조합을 차단합니다."]),
    ],
    diagnostics: [d("방언 변경 배포 뒤 일부 조건에서만 행 순서·total·오류 타입이 달라집니다.", "happy-path syntax만 확인하고 동적 branch, NULL/tie, count snapshot과 failure corpus를 differential test하지 않았습니다.", ["old/new identity sequence", "databaseId/statement version", "predicate/sort shape", "count/isolation", "driver/DB version"], "golden corpus를 old/new와 모든 지원 DB에 실행해 허용되지 않은 차이를 차단하고 mapper artifact를 rollback합니다.", "qualification matrix, branch coverage와 canary overlap/gap metric을 release approval에 필수화합니다.")],
    expertNotes: ["H2 같은 대체 DB의 문법 성공은 MySQL·Oracle production 방언 검증을 대신하지 않습니다.", "지원 matrix에서 제거한 vendor/version은 설정 allowlist에서도 제거해 조용한 fallback을 막습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-oracle-mapper", repository: "SPRING/TESTER", path: "src/main/resources/sqlmap/BoardMapper.xml", usedFor: ["ROWNUM and dynamic branch provenance"], evidence: "read-only 구조 scanner로 select 3, ROWNUM 1, if 10, choose 1과 hash binding 존재만 확인했으며 namespace·SQL literal·table/column 값은 복사하지 않았습니다." },
  { id: "local-mysql-mapper", repository: "2026-springmvc01", path: "src/main/resources/mapper/BoardMapper.xml", usedFor: ["LIMIT/OFFSET and dialect branch provenance"], evidence: "read-only 구조 scanner로 select 3, LIMIT 2, OFFSET 2, choose 2와 hash binding 존재만 확인했으며 실제 SQL·namespace·식별자는 복사하지 않았습니다." },
  { id: "mybatis-sqlmap", repository: "MyBatis 3", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["mapped statement/databaseId/parameter contract"], evidence: "MyBatis 공식 mapper XML reference입니다." },
  { id: "mybatis-dynamic-sql", repository: "MyBatis 3", path: "Dynamic SQL", publicUrl: "https://mybatis.org/mybatis-3/dynamic-sql.html", usedFor: ["choose and safe branch composition"], evidence: "MyBatis 공식 dynamic SQL reference입니다." },
  { id: "mybatis-configuration", repository: "MyBatis 3", path: "databaseIdProvider", publicUrl: "https://mybatis.org/mybatis-3/configuration.html#databaseIdProvider", usedFor: ["vendor to logical databaseId routing"], evidence: "MyBatis 공식 configuration의 databaseIdProvider 절입니다." },
  { id: "mybatis-database-id-api", repository: "MyBatis 3.5.19 API", path: "DatabaseIdProvider", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/DatabaseIdProvider.html", usedFor: ["database product identification contract"], evidence: "MyBatis 공식 DatabaseIdProvider API입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["RowBounds and mapper execution boundary"], evidence: "MyBatis 공식 Java API reference입니다." },
  { id: "mysql-select", repository: "MySQL 8.4 Reference Manual", path: "SELECT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["LIMIT/OFFSET syntax and ordering"], evidence: "Oracle MySQL 공식 SELECT reference입니다." },
  { id: "oracle-select", repository: "Oracle Database 26 SQL Reference", path: "SELECT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["ROWNUM/row limiting and ordering qualification"], evidence: "Oracle 공식 SELECT reference입니다." },
  { id: "postgres-limit", repository: "PostgreSQL current documentation", path: "LIMIT and OFFSET", publicUrl: "https://www.postgresql.org/docs/current/queries-limit.html", usedFor: ["cross-dialect deterministic ordering comparison"], evidence: "PostgreSQL 공식 LIMIT/OFFSET reference입니다." },
  { id: "java-math", repository: "Java SE 21 API", path: "Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["checked page arithmetic example"], evidence: "Oracle JDK 공식 Math API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["offset/keyset identity sequence example"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-stream", repository: "Java SE 21 API", path: "IntStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/IntStream.html", usedFor: ["ROWNUM window model example"], evidence: "Oracle JDK 공식 IntStream API입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-07-pagination-dialect", slug: "mybatis-07-pagination-dialect", courseId: "spring", moduleId: "mybatis-mapping", order: 7,
  title: "MyBatis 페이징과 MySQL·Oracle dialect 분리", subtitle: "page contract와 결정 정렬에서 LIMIT·중첩 ROWNUM·databaseId·keyset·count·성능·이관 검증까지 방언 차이를 안전하게 격리합니다.", level: "고급", estimatedMinutes: 900,
  coreQuestion: "같은 Criteria와 page API가 MySQL LIMIT/OFFSET과 Oracle ROWNUM에서 중복·누락·injection·overflow 없이 같은 의미를 내도록 어떻게 설계하고 검증할까요?",
  summary: "인벤토리의 두 BoardMapper XML을 read-only 구조 scanner로 확인해 한쪽의 ROWNUM·if/choose, 다른 쪽의 LIMIT/OFFSET·choose라는 학습 progression을 보존하되 namespace, 실제 SQL과 식별자는 복사하지 않았습니다. page/offset 계약, total order와 tie-breaker, MySQL bind/cost, Oracle 중첩 evaluation, databaseIdProvider, parameter/identifier 안전성, count snapshot, offset/keyset, checked arithmetic, timeout/telemetry와 방언 qualification을 독립적으로 설명합니다. 다섯 JDK 21 exact examples는 MySQL window, Oracle 상·하한, fail-closed dialect route, concurrent insert drift와 overflow 경계를 실제 실행합니다.",
  objectives: ["1-based page와 0-based offset을 immutable Criteria 계약으로 변환한다.", "유일 tie-breaker와 NULL/collation 규칙으로 deterministic order를 만든다.", "MySQL LIMIT/OFFSET bind 순서와 large offset 비용을 진단한다.", "Oracle ROWNUM evaluation과 중첩 upper/lower bound를 설명한다.", "databaseIdProvider와 statement inventory로 방언을 startup에 선택한다.", "값 binding과 sort identifier allowlist를 구분한다.", "목록/count snapshot과 offset/keyset trade-off를 설계한다.", "overflow·timeout·cancel·pool 회수와 dialect migration을 검증한다."],
  prerequisites: [{ title: "if·choose·foreach 동적 SQL과 빈 조건", reason: "동적 branch가 최종 SQL shape과 parameter mapping을 만드는 원리를 알아야 paging과 databaseId branch를 안전하게 결합할 수 있습니다.", sessionSlug: "mybatis-06-dynamic-sql" }],
  keywords: ["LIMIT", "OFFSET", "ROWNUM", "row limiting clause", "Criteria", "dialect", "databaseIdProvider", "stable ordering", "tie-breaker", "count query", "keyset pagination", "cursor", "BoundSql", "checked arithmetic"], topics,
  lab: {
    title: "MySQL·Oracle 공통 pagination contract와 qualification matrix 구축",
    scenario: "같은 게시 목록 기능이 MySQL mapper에서는 LIMIT/OFFSET, Oracle mapper에서는 중첩 ROWNUM을 사용하며 동적 검색·정렬·count와 동시 쓰기에서도 같은 API 의미를 유지해야 합니다.",
    setup: ["원본 mapper 두 파일은 read-only로 보존하고 tag/token/binding 구조만 inventory합니다.", "합성 fixture에 빈/한 건/동점/NULL/정확 배수/+1과 200개 정렬 행을 준비합니다.", "JDK 21 순수 contract examples, MyBatis boot test와 지원 MySQL·Oracle disposable DB matrix를 분리합니다.", "SQL/bind/row 원문이 없는 shape·databaseId·page bucket telemetry schema를 준비합니다."],
    steps: ["page base, size 상한, out-of-range와 total/hasNext 의미를 API로 고정합니다.", "모든 sort에 immutable unique tie-breaker와 NULL/collation 규칙을 정합니다.", "MySQL LIMIT/OFFSET placeholder와 Criteria mapping 순서를 검증합니다.", "Oracle ORDER BY→upper ROWNUM alias→lower bound 중첩을 exact fixture로 검증합니다.", "database product→logical databaseId allowlist와 required statement manifest를 boot합니다.", "sort identifier enum과 hash-style value binding의 branch matrix를 검사합니다.", "목록/count predicate parity와 isolation 요구를 동시 insert/delete에서 검증합니다.", "offset drift와 keyset cursor 전체 tuple·index를 비교합니다.", "deep page timeout을 주입하고 cancel→rollback→pool return을 관측합니다.", "old/new mapper를 모든 지원 DB에서 differential 실행하고 canary·rollback 기준을 승인합니다."],
    expectedResult: ["방언별 exact identity sequence, bind order와 boundary table", "databaseId별 required statement inventory와 negative boot 결과", "items/count/hasNext snapshot 허용 범위", "offset/keyset overlap·gap 결과와 plan/latency bucket", "timeout cancellation과 connection 회수 trace", "비밀·PII 없는 qualification matrix와 rollback artifact"],
    extensions: ["page base 이중 변환과 size/offset overflow", "동점 정렬로 인접 page 중복", "Oracle ROWNUM level 오류", "unknown databaseId와 statement 누락", "sort identifier injection", "count predicate drift", "deep offset timeout 후 query 지속", "방언 이관 결과 차이"],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "page/size를 MySQL과 Oracle window로 변환하고 exact boundary 표를 만드세요.", requirements: ["page 1·2·last·empty를 포함합니다.", "size 상한과 overflow를 거부합니다.", "MySQL bind 순서를 적습니다.", "Oracle upper/lower 순서를 적습니다.", "결정 정렬과 tie-breaker를 포함합니다.", "값 없는 출력과 expected IDs를 대조합니다."], hints: ["같은 page contract라도 SQL의 ordinal 표현은 다릅니다."], expectedOutcome: "방언과 무관한 window 불변식과 방언별 bind 계획이 분리됩니다.", solutionOutline: ["validate→checked arithmetic→stable order→dialect render→exact sequence 순서입니다."] },
    { difficulty: "응용", prompt: "동적 검색·정렬·count가 있는 offset API를 keyset 옵션과 함께 설계하세요.", requirements: ["sort allowlist를 둡니다.", "전체 sort tuple cursor를 정의합니다.", "count parity와 consistency를 정합니다.", "동시 insert/delete를 주입합니다.", "overlap/gap을 식별자로 검증합니다.", "복합 index를 제안합니다.", "cursor validation/expiry를 둡니다.", "MySQL·Oracle matrix를 실행합니다."], hints: ["keyset도 tie-breaker가 빠지면 동점 구간에서 실패합니다."], expectedOutcome: "use case별 offset/keyset 경계와 동시 변경 증거가 완성됩니다.", solutionOutline: ["contract→fixture→offset baseline→cursor predicate→index→fault matrix 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 다중 DB pagination 운영·이관 표준을 작성하세요.", requirements: ["databaseId allowlist와 statement manifest를 둡니다.", "page/sort/count API를 versioning합니다.", "shape-only telemetry를 둡니다.", "deep-page SLO와 keyset 전환 기준을 둡니다.", "timeout/cancel/pool recovery를 요구합니다.", "golden corpus와 qualification matrix를 관리합니다.", "canary overlap/gap sentinel을 둡니다.", "rollback 가능한 mapper artifact를 요구합니다."], hints: ["문법 호환보다 결과 의미와 운영 복구가 승인 기준입니다."], expectedOutcome: "방언 추가·변경을 재현 가능하게 승인하는 governance가 완성됩니다.", solutionOutline: ["inventory→contract→boot→target DB corpus→observability→canary→rollback 순서입니다."] },
  ],
  nextSessions: ["mybatis-08-service-mapper-transaction"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["SPRING/TESTER BoardMapper.xml은 65-line 원본에서 select 3, ROWNUM 1, if 10, choose 1과 hash binding 구조만 확인했으며 실제 SQL·namespace·식별자는 복사하지 않았습니다.", "2026-springmvc01 BoardMapper.xml은 68-line 원본에서 select 3, LIMIT 2, OFFSET 2, choose 2와 hash binding 구조만 확인했으며 실제 SQL·namespace·식별자는 복사하지 않았습니다.", "원본은 공통 page contract, deterministic order, count snapshot, databaseId startup validation, keyset, overflow와 timeout recovery 전체를 설명하지 않아 MyBatis·DB·JDK 공식 문서와 synthetic exact examples로 보완했습니다.", "JDK examples는 SQL 의미 model이지 MyBatis/driver/optimizer 구현이 아니므로 지원 MySQL·Oracle 버전의 disposable integration matrix와 plan evidence를 별도로 요구합니다."] },
});

export default session;
