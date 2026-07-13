import type { DetailedCodeExample, DiagnosticCase, SessionSource } from "../../types";
import { buildMvcSession, type MvcTopicSpec } from "./mvc-01-mybatis-config-mapper.ts";

const diagnostic = (
  subject: string,
  symptom: string,
  cause: string,
  fix: string,
  secondSymptom = "단위 예제와 실제 화면 결과가 다르다.",
): DiagnosticCase[] => [
  { symptom, likelyCause: cause, checks: [`${subject}의 입력·분기·model key·view path를 순서대로 기록합니다.`, "null·empty·many fixtures를 각각 재현합니다.", "응답에 PII·SQL·stack trace가 섞이지 않았는지 확인합니다."], fix, prevention: `${subject}의 정상·빈 결과·잘못된 입력·내부 실패 contract test를 고정합니다.` },
  { symptom: secondSymptom, likelyCause: "JDK decision table은 순수 경계만 검증하며 Servlet/JSTL/MyBatis container와 실제 schema·encoding을 실행하지 않았습니다.", checks: ["unit과 integration evidence를 구분합니다.", "실제 request attribute와 JSP tag 결과를 확인합니다.", "ephemeral DB의 schema/migration version을 기록합니다."], fix: "격리된 container·test DB integration test로 mapping, dispatch, rendering과 escaping을 재검증합니다.", prevention: "정적·unit·container·real-engine 검증 범위를 release checklist에 따로 둡니다." },
];

const audit: DetailedCodeExample = {
  id: "powershell-mvc02-original-static-audit",
  title: "조회 command2·JSP3의 request model·JSTL·출력 shape를 정적으로 감사합니다",
  language: "powershell",
  filename: "verify-original-mvc02.ps1",
  purpose: "Servlet container와 DB 없이 list/one query-view 원본5의 정확한 경계와 stored-XSS 위험을 보존합니다.",
  code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$rels=@(
 'jspstudy/src/main/java/org/study/jspstudy/model/BookListCommand.java',
 'jspstudy/src/main/java/org/study/jspstudy/model/BookIdCommand.java',
 'jspstudy/src/main/webapp/day03/ex04_db_input.jsp',
 'jspstudy/src/main/webapp/day03/ex05_db_output.jsp',
 'jspstudy/src/main/webapp/day03/ex06_db_output.jsp'
)
$files=@($rels|ForEach-Object{Get-Item -LiteralPath (Join-Path $SourceRoot $_)})
if($files.Count-ne5){throw 'inventory drift'}
$before=@{};foreach($file in $files){$before[$file.FullName]=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash}
$java=($files[0..1]|ForEach-Object{[IO.File]::ReadAllText($_.FullName)})-join[Environment]::NewLine
$java=[regex]::Replace(([regex]::Replace($java,'(?s)/\*.*?\*/','')),'(?m)//.*$','')
$jsp=($files[2..4]|ForEach-Object{[IO.File]::ReadAllText($_.FullName)})-join[Environment]::NewLine
$jsp=[regex]::Replace($jsp,'(?s)<%--.*?--%>','')
function Count([string]$text,[string]$pattern){([regex]::Matches($text,$pattern,[Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count}
$sessions=Count $java 'try\s*\(\s*SqlSession';$attrs=Count $java '\.setAttribute\s*\('
$forms=Count $jsp '<form[^>]+method="post"';$cmds=Count $jsp 'name="cmd"'
$empty=Count $jsp '<c:when\s+test="\$\{empty';$loops=Count $jsp '<c:forEach\b'
$cOut=Count $jsp '<c:out\b';$el=Count $jsp '\$\{'
if($sessions-ne2-or$attrs-ne2-or$forms-ne5-or$cmds-ne5-or$empty-ne2-or$loops-ne1-or$cOut-ne0-or$el-ne13){throw 'source shape drift'}
foreach($file in $files){if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash-cne$before[$file.FullName]){throw 'source hash drift'}}
"files=5|sessions=2|requestAttributes=2|postForms=5|cmdFields=5|emptyBranches=2|forEach=1|directEL=13|cOut=0|hashes=5/5"
"execution=static-only|db=not-contacted|servlet=not-started|pii=not-read"`,
  walkthrough: [
    { lines: "1-10", explanation: "inventory 상대 경로5와 file 존재를 고정합니다." },
    { lines: "11-16", explanation: "source hash를 보존하고 Java/JSP comments를 제거해 active shape만 셉니다." },
    { lines: "17-23", explanation: "session·request model·forms·JSTL·EL/c:out counts를 exact하게 비교합니다." },
    { lines: "24-26", explanation: "원본 불변성을 확인하고 DB·container·PII 미사용을 명시합니다." },
  ],
  run: { environment: ["PowerShell 7+", "D:/dev/jspstudy source root", "정적 파일 읽기만", "DB·Servlet container 불필요"], command: "pwsh -NoProfile -File verify-original-mvc02.ps1 -SourceRoot D:/dev/jspstudy" },
  output: { value: "files=5|sessions=2|requestAttributes=2|postForms=5|cmdFields=5|emptyBranches=2|forEach=1|directEL=13|cOut=0|hashes=5/5\nexecution=static-only|db=not-contacted|servlet=not-started|pii=not-read", explanation: ["두 command가 각각 session과 request attribute를 사용합니다.", "조회 input은 POST form5이고 list/one JSP는 empty branch2를 갖습니다.", "EL13이 직접 출력되고 c:out은0이므로 untrusted stored values의 context encoding을 보강해야 합니다."] },
  experiments: [
    { change: "JSP에 c:out 하나를 추가합니다.", prediction: "cOut0 exact audit가 실패합니다.", result: "원본은 보존하고 개선본 integration test에서 context별 encoding을 검증합니다." },
    { change: "BookIdCommand의 commented setAttribute를 active로 바꿉니다.", prediction: "requestAttributes가3이 되어 contract drift가 드러납니다.", result: "comments를 제외한 active code만 감사합니다." },
    { change: "audit에서 command.exec를 실행합니다.", prediction: "DBUtil 초기화와 실제 credential/DB 접속이 발생할 수 있습니다.", result: "파일/hash/shape 읽기만 허용합니다." },
  ],
  sourceRefs: ["mvc02-list-command", "mvc02-id-command", "mvc02-input-jsp", "mvc02-list-jsp", "mvc02-one-jsp"],
};

const topics: MvcTopicSpec[] = [
  {
    id: "mvc02-original-query-view-audit", title: "원본 조회 command2·JSP3의 실제 request-to-view 계약을 감사합니다", lead: "DB를 실행하지 않고 list/one mapper 호출, model key, JSP empty/loop/output shape를 exact하게 고정합니다.",
    explanations: [
      "BookListCommand와 BookIdCommand는 try-with-resources SqlSession을 각각 열고 mapper proxy로 목록과 한 건을 조회합니다.",
      "목록은 request key `booklist`, 한 건은 `bookVO`에 저장되어 각각 ex05와 ex06 JSP로 forward될 경로를 반환합니다.",
      "BookIdCommand는 기본 BookVO를 만들었다가 select 결과로 덮어쓰므로 mapper가 null을 반환하면 결국 request attribute도 null입니다.",
      "입력 JSP는 list·one·delete·insert-form·update-form을 모두 POST form으로 만들고 hidden cmd로 front controller 분기를 지시합니다.",
      "목록/한 건 JSP는 `empty`로 결과 부재를 처리하고 목록은 forEach 한 번으로 rows를 순회합니다.",
      "두 출력 JSP에는 직접 EL13개가 있고 c:out은0개입니다. DB에 저장된 title/publisher가 markup으로 해석되면 stored XSS가 됩니다.",
      "조회 query에 명시적 ORDER BY·pagination contract가 보이지 않으면 row 순서는 보장되지 않고 데이터가 커질수록 전체 materialization 비용이 증가합니다.",
      "audit는 source hashes와 active token만 확인하며 DB rows, credential, PII, Servlet/JSP engine을 사용하지 않습니다.",
    ],
    concepts: [
      { term: "request model", definition: "controller/command가 view rendering에 필요한 값만 request attribute로 전달하는 단기 데이터 계약입니다.", detail: ["key와 type이 계약입니다.", "forward 동안만 유지됩니다."] },
      { term: "cardinality", definition: "목록0..N과 한 건0..1처럼 query가 반환하도록 허용한 row 수 범위입니다.", detail: ["empty를 정상 상태로 둡니다.", "constraint와 함께 검증합니다."] },
      { term: "stored XSS", definition: "DB에 저장된 공격 문자열이 이후 HTML에 인코딩 없이 렌더링되어 다른 사용자의 브라우저에서 실행되는 취약점입니다.", detail: ["쓰기와 읽기 경계를 모두 봅니다.", "출력 context encoding이 핵심입니다."] },
    ],
    diagnostics: diagnostic("원본 query-view", "목록은 보이지만 한 건 화면이 빈다.", "bookId 누락/공백, mapper null 또는 request key/view key 불일치 가능성이 있습니다.", "입력을 typed validation하고 NotFound 결과를 명시하며 model key contract test를 추가합니다."),
    expertNotes: ["A null single-row result is usually a domain absence, not an infrastructure exception; model it separately.", "Static EL counts reveal exposure surface but only rendered-response tests prove context-correct encoding."], customExample: audit,
  },
  {
    id: "mvc02-list-query-order-pagination", title: "목록 조회를 cardinality·ORDER BY·pagination·snapshot 계약으로 설계합니다", lead: "`selectAll`을 작은 demo 편의가 아니라 데이터 증가와 동시 변경을 견디는 읽기 use case로 다룹니다.",
    explanations: [
      "목록 반환 type은 List<BookVO>이며0 rows는 예외가 아니라 empty list가 자연스럽습니다.",
      "SQL의 row 순서는 ORDER BY 없이는 보장되지 않습니다. 화면 번호와 pagination cursor가 의존할 안정된 tie-breaker까지 명시합니다.",
      "OFFSET pagination은 뒤 페이지에서 scan 비용과 concurrent insert에 따른 중복/누락이 커질 수 있습니다.",
      "keyset pagination은 `(created_at, book_id)` 같은 stable cursor와 정렬 방향을 query contract로 만듭니다.",
      "전체 row를 materialize해 request에 넣기 전에 page size 상한과 total count의 필요성을 구분합니다.",
      "검색/정렬 input은 value binding과 identifier allowlist를 분리하고 unknown sort는 DB 호출 전에 거부합니다.",
      "empty·first·middle·last page와 concurrent insertion fixture를 실제 engine에서 검증합니다.",
      "view에는 mutable persistence VO 전체보다 표시용 row DTO와 nextCursor만 전달하면 노출 면적이 줄어듭니다.",
    ],
    concepts: [
      { term: "stable ordering", definition: "동률을 깨는 unique key까지 포함해 같은 snapshot에서 row 순서가 결정적인 정렬입니다.", detail: ["ORDER BY가 필요합니다.", "cursor와 일치해야 합니다."] },
      { term: "keyset pagination", definition: "마지막 row의 정렬 key 뒤부터 다음 page를 읽는 cursor 기반 방식입니다.", detail: ["큰 offset을 피합니다.", "임의 page jump는 어렵습니다."] },
      { term: "page DTO", definition: "items와 cursor/size/hasNext 같은 pagination metadata를 묶는 view/service 계약입니다.", detail: ["무제한 list를 막습니다.", "total은 선택 사항입니다."] },
    ],
    diagnostics: diagnostic("목록 query", "새 책을 등록하면 같은 페이지에서 row가 중복되거나 빠진다.", "안정된 ORDER BY 없이 OFFSET을 사용하거나 cursor와 sort key가 일치하지 않습니다.", "unique tie-breaker를 포함한 keyset cursor와 page-size 상한을 적용합니다."),
    expertNotes: ["Total count can be more expensive than the page query; expose it only when the UX truly requires it.", "Cursor values must be integrity-protected or revalidated, not treated as trusted SQL fragments."],
    trace: { className: "BookListQueryDecision", title: "목록 요청의 정렬·page 전략을 판정합니다", purpose: "small demo, stable cursor와 unsafe sort를 서로 다른 분기로 만듭니다.", cases: [
      { input: "FIRST_20", decision: "KEYSET", evidence: "bookId-tiebreaker" }, { input: "SORT_PRICE", decision: "ALLOWLIST", evidence: "enum-column" }, { input: "SIZE_10000", decision: "REJECT", evidence: "page-limit" },
    ], defaultDecision: "REJECT", defaultEvidence: "unknown-list-request", sourceRefs: ["mvc02-list-command", "mybatis-sqlmap", "owasp-sql-injection"] },
  },
  {
    id: "mvc02-one-query-validation-not-found", title: "한 건 조회를 input parsing·0/1 cardinality·NotFound로 분리합니다", lead: "raw bookId 문자열과 database absence, duplicate-data corruption, infrastructure error를 같은 null로 뭉개지 않습니다.",
    explanations: [
      "request parameter는 null·blank·too long·invalid characters를 먼저 검사해 validated BookId로 변환합니다.",
      "invalid input은 DB를 호출하지 않고400 계열 validation result로 종료합니다.",
      "정상 id에 row0은 NotFound이며 view에 null object를 던지는 대신 typed result와404 정책을 사용합니다.",
      "row1만 BookDetail DTO로 mapping합니다. unique constraint가 깨져 row2+라면500/data-integrity alert가 맞습니다.",
      "DB exception은 absence로 가장하면 장애가 빈 화면으로 숨습니다. timeout/connection/mapping failure를 별도 category로 보존합니다.",
      "id를 query string으로 사용할 때 URL encoding과 reflected output context도 함께 검증합니다.",
      "NotFound response는 존재 여부 노출이 민감한 domain인지에 따라 authorization 뒤404/403 정책을 선택합니다.",
      "valid/blank/malformed/absent/duplicate/timeout fixtures를 unit과 real-engine test로 나눕니다.",
    ],
    concepts: [
      { term: "validated identifier", definition: "외부 문자열을 길이·문자·형식 규칙으로 검증한 뒤 생성되는 domain id입니다.", detail: ["DB 호출 전에 만듭니다.", "raw string과 구분합니다."] },
      { term: "NotFound result", definition: "정상적인 식별자에 해당 resource가 없음을 infrastructure exception과 분리한 업무 결과입니다.", detail: ["null dereference를 막습니다.", "HTTP policy와 연결합니다."] },
      { term: "data integrity breach", definition: "0..1이어야 할 query가 여러 rows를 반환하는 등 schema/업무 불변식이 깨진 상태입니다.", detail: ["사용자 오류가 아닙니다.", "alert와 조사 대상입니다."] },
    ],
    diagnostics: diagnostic("한 건 query", "없는 bookId가500 또는 빈 속성 오류로 보인다.", "mapper null을 NotFound로 변환하지 않고 JSP가 property를 읽거나 generic exception으로 감쌌습니다.", "validation→query→0/1 result→status/view 순서를 typed outcome으로 구현합니다."),
    expertNotes: ["Null-object DTOs can hide absence by rendering plausible empty fields; explicit result types preserve semantics.", "Authorization should precede detailed existence disclosure when identifiers refer to protected resources."],
    trace: { className: "BookOneQueryDecision", title: "bookId와 query cardinality를 HTTP 결과로 변환합니다", purpose: "invalid, absent, found와 integrity breach를 명확히 구분합니다.", cases: [
      { input: "INVALID_ID", decision: "400", evidence: "skip-database" }, { input: "ROWS_0", decision: "404", evidence: "not-found" }, { input: "ROWS_1", decision: "200", evidence: "detail-dto" },
    ], defaultDecision: "500", defaultEvidence: "cardinality-or-db-failure", sourceRefs: ["mvc02-id-command", "mybatis-java-api", "jakarta-servlet"] },
  },
  {
    id: "mvc02-request-model-view-contract", title: "Command가 request model을 만들고 JSP는 표현만 담당하게 합니다", lead: "attribute key·type·nullability·lifetime을 명시하고 persistence/session 객체가 view 경계를 넘지 않게 합니다.",
    explanations: [
      "forward는 같은 request/response를 유지하므로 request attribute가 JSP에 전달됩니다. redirect는 새 request라 같은 attribute가 사라집니다.",
      "`booklist`와 `bookVO` key는 문자열 API이므로 오타가 compile에 잡히지 않습니다. constants 또는 typed model adapter와 rendering test가 필요합니다.",
      "Command는 조회 결과를 display DTO로 변환하고 JSP는 조건·반복·escaping·layout만 수행해야 합니다.",
      "SqlSession, mapper proxy, lazy cursor를 request에 넣으면 view rendering 시 이미 close됐거나 transaction을 길게 잡을 수 있습니다.",
      "model에는 view가 필요한 field만 allowlist하고 password/internal flags 같은 민감 column은 포함하지 않습니다.",
      "request attribute null과 attribute 없음은 EL에서 비슷하게 보일 수 있으므로 status enum 또는 explicit empty model을 둡니다.",
      "forward path는 `/WEB-INF/views` 아래로 숨겨 direct JSP 접근과 controller bypass를 막는 구조가 좋습니다.",
      "model contract test는 key set, type, field allowlist, nullability와 selected view path를 함께 검증합니다.",
    ],
    concepts: [
      { term: "forward", definition: "server 내부에서 같은 request/response로 다른 resource가 응답을 완성하게 위임하는 dispatch입니다.", detail: ["request attributes가 유지됩니다.", "URL은 바뀌지 않습니다."] },
      { term: "view model", definition: "특정 화면이 안전하게 표시할 field와 상태만 담은 rendering 전용 데이터입니다.", detail: ["persistence VO와 분리할 수 있습니다.", "민감 field를 제외합니다."] },
      { term: "model contract", definition: "view path별 required/optional attribute key·type·nullability·encoding 책임의 합의입니다.", detail: ["문자열 오타를 test합니다.", "empty/error states를 포함합니다."] },
    ],
    diagnostics: diagnostic("request model", "JSP에서 propertyNotFound 또는 빈 값이 간헐적으로 보인다.", "attribute key/type이 view contract와 다르거나 lazy/session-bound object를 close 뒤 읽습니다.", "detached view DTO와 key/type contract test를 적용합니다."),
    expertNotes: ["Keeping JSPs under WEB-INF is defense-in-depth against bypassing controller-set authorization and model preparation.", "A view model is also a data-minimization boundary, not merely a formatting convenience."],
    trace: { className: "RequestModelDecision", title: "query outcome별 model key와 view를 선택합니다", purpose: "forward에 필요한 model을 상태별로 완성한 뒤 렌더링하게 합니다.", cases: [
      { input: "LIST_OK", decision: "booklist->list.jsp", evidence: "detached-page" }, { input: "ONE_OK", decision: "bookVO->detail.jsp", evidence: "display-dto" }, { input: "NOT_FOUND", decision: "error->404.jsp", evidence: "typed-absence" },
    ], defaultDecision: "error->500.jsp", defaultEvidence: "correlation-only", sourceRefs: ["mvc02-list-command", "mvc02-id-command", "jakarta-servlet"] },
  },
  {
    id: "mvc02-book-view-model-null-format", title: "BookVO를 화면별 DTO와 안전한 null·숫자·날짜 formatting으로 바꿉니다", lead: "DB representation을 JSP에 그대로 노출하지 않고 list row와 detail model의 표시 규칙을 서버에서 준비합니다.",
    explanations: [
      "목록에는 id·title·publisher·formatted price 정도만 필요하고 detail에는 stock 등 추가 정보가 필요할 수 있습니다.",
      "같은 BookVO 전체를 모든 view에 전달하면 schema 변화와 민감 field 추가가 자동 노출로 이어집니다.",
      "price/stock String은 JSP에서 locale formatting과 범위 검증을 수행하기 어렵습니다. server에서 typed value와 display string을 준비합니다.",
      "null publisher를 빈 문자열로 조용히 바꿀지 '미상'으로 표시할지 제품 정책으로 정하고 accessibility text도 포함합니다.",
      "locale·currency·time zone은 request/user preference에서 안전한 allowlist로 선택하고 display와 machine-readable 값 역할을 분리합니다.",
      "view model mapper는 persistence DTO를 입력받아 pure function으로 만들면 JDK unit test가 쉽습니다.",
      "record/immutable DTO는 rendering 중 state 변경을 막고 model contract를 분명하게 합니다.",
      "large content는 목록에 자르고 detail에서 표시하되 substring이 Unicode grapheme을 깨지 않도록 정책을 검증합니다.",
    ],
    concepts: [
      { term: "display DTO", definition: "화면에 필요한 값과 이미 결정된 표시 상태를 담는 immutable 전송 객체입니다.", detail: ["field allowlist입니다.", "formatting policy를 고정합니다."] },
      { term: "data minimization", definition: "목적에 필요한 최소 field만 처리·전달·기록하는 원칙입니다.", detail: ["민감 노출을 줄입니다.", "schema coupling을 낮춥니다."] },
      { term: "locale-aware formatting", definition: "숫자·통화·날짜를 locale과 정책에 따라 표시하되 원래 typed value와 구분하는 과정입니다.", detail: ["parse와 display를 분리합니다.", "locale allowlist를 둡니다."] },
    ],
    diagnostics: diagnostic("view model", "가격이 문자열 순서로 정렬되거나 locale마다 잘못 표시된다.", "DB/VO의 String price를 view가 직접 비교·format해 numeric semantics가 사라졌습니다.", "BigDecimal domain value와 locale-aware display DTO를 분리합니다."),
    expertNotes: ["Formatting in a display DTO does not justify duplicating raw sensitive values; expose only what the view needs.", "Unicode truncation should operate on grapheme clusters when user-visible text fidelity matters."],
    trace: { className: "BookViewModelDecision", title: "화면 종류별 field·format policy를 선택합니다", purpose: "list/detail/error에 같은 persistence object를 노출하지 않게 합니다.", cases: [
      { input: "LIST", decision: "ROW_DTO", evidence: "id+title+price" }, { input: "DETAIL", decision: "DETAIL_DTO", evidence: "validated-stock" }, { input: "NULL_PRICE", decision: "REJECT", evidence: "required-money" },
    ], defaultDecision: "REJECT", defaultEvidence: "unknown-view", sourceRefs: ["mvc02-list-jsp", "mvc02-one-jsp", "mvc02-id-command"] },
  },
  {
    id: "mvc02-jstl-empty-choose-foreach", title: "JSTL empty·choose·forEach의 평가 규칙과 표시 상태를 정확히 사용합니다", lead: "null/empty collection/빈 문자열을 구분할 곳과 합칠 곳을 결정하고 loop metadata를 업무 identity와 혼동하지 않습니다.",
    explanations: [
      "EL `empty`는 null, empty String, empty array/collection/map을 true로 볼 수 있어 화면의 '데이터 없음' 표현에 편리합니다.",
      "하지만 loading, authorization filtered, query failed와 genuine empty를 같은 empty로 만들면 장애나 권한 상태가 숨습니다.",
      "c:choose는 첫 true branch 하나만 렌더링하므로 status enum에 따라 success/empty/error states를 명시할 수 있습니다.",
      "c:forEach items가 null이면 반복하지 않지만 model contract 위반을 조용히 숨길 수 있습니다. controller test로 required key를 검증합니다.",
      "varStatus.count는 현재 화면의1-based 순번이지 book identity가 아닙니다. 링크와 mutation에는 bookId를 사용합니다.",
      "JSTL tag URI/version은 container dependency와 맞아야 하며 Jakarta Tags 전환 시 namespace/package/version compatibility를 통합 검증합니다.",
      "반복 안에서 heavy property calculation이나 database lazy load가 일어나지 않도록 detached DTO를 전달합니다.",
      "empty/list render snapshot은0·1·many와 special characters를 포함해 HTML DOM 수준으로 검증합니다.",
    ],
    concepts: [
      { term: "EL empty", definition: "null 및 비어 있는 문자열·배열·collection/map을 간결하게 검사하는 Expression Language 연산자입니다.", detail: ["여러 상태를 합칩니다.", "업무 상태는 별도 enum이 필요할 수 있습니다."] },
      { term: "c:choose", definition: "when 조건 중 첫 true branch 하나 또는 otherwise를 렌더링하는 JSTL 조건 tag입니다.", detail: ["상태 순서가 중요합니다.", "모든 상태를 명시합니다."] },
      { term: "varStatus", definition: "forEach의 index·count·first·last 같은 반복 metadata입니다.", detail: ["identity가 아닙니다.", "pagination offset과 조합할 수 있습니다."] },
    ],
    diagnostics: diagnostic("JSTL rendering", "DB 장애인데 '원하는 정보가 없습니다'로 표시된다.", "command가 exception을 empty model로 축약하거나 JSP가 empty만 보고 상태를 구분하지 않습니다.", "success-empty와 failure를 typed view status로 분리하고 error status를 설정합니다."),
    expertNotes: ["A convenient empty check should not collapse observability-critical states such as authorization denial or infrastructure failure.", "Loop status is presentation metadata; durable identifiers must come from validated domain data."],
    trace: { className: "JstlViewStateDecision", title: "model 상태를 choose branch로 변환합니다", purpose: "empty와 error를 같은 화면으로 축약하지 않는 rendering state machine을 만듭니다.", cases: [
      { input: "SUCCESS_0", decision: "EMPTY_BRANCH", evidence: "query-succeeded" }, { input: "SUCCESS_N", decision: "FOREACH", evidence: "display-rows" }, { input: "QUERY_FAILED", decision: "ERROR_BRANCH", evidence: "correlation-id" },
    ], defaultDecision: "CONTRACT_ERROR", defaultEvidence: "missing-view-state", sourceRefs: ["mvc02-list-jsp", "mvc02-one-jsp", "jakarta-tags"] },
  },
  {
    id: "mvc02-contextual-output-encoding", title: "JSP EL 출력을 HTML text·attribute·URL context별로 인코딩합니다", lead: "c:out 하나로 모든 곳을 해결한다고 가정하지 않고 stored value가 들어가는 문맥마다 안전한 encoder를 선택합니다.",
    explanations: [
      "`${book.bookName}`를 HTML text에 직접 출력하면 `<script>`나 event markup이 browser parser에 전달될 수 있습니다.",
      "c:out의 XML escaping은 HTML text context의 기본 출발점이지만 JavaScript, CSS, URL, unquoted attribute context를 대신하지 않습니다.",
      "attribute value는 반드시 quote하고 attribute encoder를 적용하며 event handler attribute에는 untrusted data를 넣지 않습니다.",
      "link의 bookId는 URL component encoding과 server-side validation/authorization을 모두 거쳐야 합니다.",
      "본문에 rich HTML을 허용하려면 단순 escaping 대신 검증된 sanitizer allowlist와 CSP defense-in-depth가 필요합니다.",
      "입력 validation은 XSS 방어를 대체하지 않습니다. 정상적인 이름에도 `<`, `&`, quotes가 있을 수 있으므로 출력 시 context encoding합니다.",
      "CSP는 inline script 제한과 nonce/hash 정책을 제공하지만 취약한 output encoding을 고치지 않는 대체재가 아닙니다.",
      "rendered response test는 payload가 text node로 남고 executable element/attribute/URL scheme이 생기지 않는지 DOM으로 검사합니다.",
    ],
    concepts: [
      { term: "contextual output encoding", definition: "값이 들어가는 HTML text·attribute·URL·JavaScript 등 parser context에 맞는 escaping을 적용하는 방어입니다.", detail: ["context마다 규칙이 다릅니다.", "출력 직전에 적용합니다."] },
      { term: "c:out", definition: "JSTL에서 expression 값을 출력하며 기본 XML escaping을 제공하는 tag입니다.", detail: ["HTML text에 유용합니다.", "모든 context를 해결하지 않습니다."] },
      { term: "content security policy", definition: "browser가 허용할 script/style/resource 출처와 실행 방식을 제한하는 HTTP 정책입니다.", detail: ["defense-in-depth입니다.", "inline handler 제거와 연결됩니다."] },
    ],
    diagnostics: diagnostic("JSP output", "책 제목을 본 사용자의 브라우저에서 임의 script가 실행된다.", "저장된 사용자 입력이 직접 EL로 HTML에 삽입되어 browser markup으로 해석됐습니다.", "display DTO field를 context별 encoder/c:out으로 출력하고 CSP·sanitizer 정책을 추가합니다."),
    expertNotes: ["Encoding must occur at the final rendering context; storing pre-escaped data causes double encoding and unsafe reuse in other contexts.", "CSP reports are telemetry, not proof that stored-XSS payloads are harmless."],
    trace: { className: "OutputContextDecision", title: "출력 위치별 encoder 또는 금지 결정을 내립니다", purpose: "HTML text와 URL/JS context를 한 escape 함수로 처리하지 않게 합니다.", cases: [
      { input: "HTML_TEXT", decision: "HTML_ENCODE", evidence: "text-node" }, { input: "URL_PARAM", decision: "URL_ENCODE", evidence: "validated-id" }, { input: "INLINE_JS", decision: "REJECT", evidence: "use-data-channel" },
    ], defaultDecision: "REJECT", defaultEvidence: "unknown-output-context", sourceRefs: ["mvc02-list-jsp", "mvc02-one-jsp", "owasp-xss", "owasp-output-encoding"] },
  },
  {
    id: "mvc02-query-http-form-semantics", title: "조회 form을 safe/idempotent HTTP 의미와 method routing에 맞춥니다", lead: "hidden cmd만 보고 모두 POST로 보내지 않고 조회·변경의 method, URL, cache, bookmark와 CSRF 경계를 설계합니다.",
    explanations: [
      "목록과 한 건 조회는 일반적으로 safe/idempotent GET이므로 URL query에 검색·id·cursor를 표현하면 bookmark와 history가 자연스럽습니다.",
      "insert/update/delete form은 state를 변경하므로 POST/PATCH/DELETE semantics와 CSRF protection이 필요합니다.",
      "HTML form은 GET/POST만 직접 지원하므로 method override를 쓴다면 server가 allowlisted endpoint에서만 해석해야 합니다.",
      "GET URL에는 password·secret·민감 PII를 넣지 않습니다. access logs, history와 referrer에 남을 수 있습니다.",
      "hidden cmd는 사용자도 바꿀 수 있는 입력입니다. controller routing/authorization의 신뢰 근거가 될 수 없습니다.",
      "읽기 POST는 cache/bookmark를 잃고 refresh warning을 만들 수 있지만 민감한 복잡 검색에서 의도적으로 선택할 수도 있습니다. tradeoff를 기록합니다.",
      "unsupported cmd/method는 default route에서400/404/405와 Allow를 명시하고 null command dereference를 막습니다.",
      "HTTP contract test는 method+path+parameter별 status, headers, selected command와 side-effect0을 검증합니다.",
    ],
    concepts: [
      { term: "safe method", definition: "서버 상태 변경을 요청 의미로 의도하지 않는 HTTP method 특성입니다.", detail: ["GET·HEAD가 대표적입니다.", "side effect를 최소화합니다."] },
      { term: "idempotent", definition: "같은 요청을 여러 번 적용해도 의도한 서버 상태가 한 번 적용한 것과 같은 특성입니다.", detail: ["GET은 safe이면서 idempotent입니다.", "retry 정책과 연결됩니다."] },
      { term: "untrusted hidden field", definition: "UI에 보이지 않아도 client가 임의 변경할 수 있으므로 검증·인가가 필요한 request 값입니다.", detail: ["cmd도 입력입니다.", "권한 증명이 아닙니다."] },
    ],
    diagnostics: diagnostic("HTTP query form", "조회 새로고침에서 form resubmission 경고가 뜬다.", "safe 조회를 POST로 보내 browser history/cache 의미와 맞지 않습니다.", "목록/한 건 조회를 GET URL contract로 바꾸고 변경만 POST+CSRF로 둡니다."),
    expertNotes: ["HTTP semantics guide caching and retry behavior; they are not merely aesthetic URL choices.", "A hidden routing parameter is attacker-controlled input even when the UI never exposes an editor."],
    trace: { className: "BookHttpMethodDecision", title: "book action을 HTTP method와 보안 정책에 배치합니다", purpose: "조회와 변경을 같은 POST hidden-cmd 패턴으로 축약하지 않습니다.", cases: [
      { input: "LIST", decision: "GET", evidence: "safe-bookmarkable" }, { input: "DETAIL", decision: "GET", evidence: "validated-id" }, { input: "DELETE", decision: "POST+CSRF", evidence: "state-change" },
    ], defaultDecision: "405", defaultEvidence: "unsupported-action", sourceRefs: ["mvc02-input-jsp", "jakarta-servlet", "rfc9110", "owasp-csrf"] },
  },
  {
    id: "mvc02-query-error-cache-observability", title: "조회 오류·cache·timeout·로그를 사용자 상태와 분리합니다", lead: "empty response와 장애를 구분하고 bounded cache·timeout·correlation evidence로 읽기 경로를 운영합니다.",
    explanations: [
      "BookListCommand는 모든 Exception을 RuntimeException으로 감싸고 BookIdCommand도 같은 패턴이라 원인 분류와 public policy가 상위에 필요합니다.",
      "connection timeout, query timeout, mapper error와 absent result는 retry/status/alert가 서로 다릅니다.",
      "조회 cache는 key에 filter/sort/page/locale/authorization scope를 포함하고 mutation 뒤 invalidation 또는 version policy를 가져야 합니다.",
      "사용자별 권한 결과를 shared cache에 섞으면 data leak이 됩니다. public/private/Vary와 application cache tenant key를 검증합니다.",
      "timeout 뒤 background query가 계속 connection을 점유하는지 driver cancel behavior와 pool metrics를 확인합니다.",
      "log는 statement id, latency bucket, result category, row/page count와 correlation id만 남기고 raw query input·book contents를 제한합니다.",
      "metrics label에 bookId/error message를 넣으면 cardinality 폭발과 PII 노출이 생깁니다.",
      "SLO는 success뿐 아니라 empty, not-found, validation, timeout, dependency failure 비율과 p95/p99를 분리합니다.",
    ],
    concepts: [
      { term: "cache key", definition: "결과를 재사용할 수 있는 모든 입력과 권한 scope를 포함한 안정된 식별자입니다.", detail: ["누락은 잘못된 공유를 만듭니다.", "bounded cardinality가 필요합니다."] },
      { term: "negative caching", definition: "not-found/empty 결과를 짧게 cache해 반복 부하를 줄이는 전략입니다.", detail: ["TTL을 짧게 둡니다.", "권한·생성 race를 고려합니다."] },
      { term: "query SLO", definition: "조회 성공률과 latency·failure category에 대한 사용자 중심 운영 목표입니다.", detail: ["p95/p99를 봅니다.", "empty와 failure를 구분합니다."] },
    ],
    diagnostics: diagnostic("query operations", "한 사용자의 책 목록이 다른 사용자에게 보인다.", "authorization scope가 cache key에 없거나 shared response cache에 private 결과를 저장했습니다.", "tenant/user scope와 Cache-Control/Vary 정책을 명시하고 leak regression test를 추가합니다."),
    expertNotes: ["Caching authorization-filtered query results requires the authorization context to be part of the cache contract.", "Timeout budgets should be hierarchical so database work ends before the HTTP deadline is exhausted."],
    trace: { className: "QueryOperationalDecision", title: "조회 결과 category별 cache·status·alert 정책을 선택합니다", purpose: "empty, not-found와 dependency failure를 운영상 분리합니다.", cases: [
      { input: "EMPTY_SUCCESS", decision: "200_SHORT_CACHE", evidence: "known-empty" }, { input: "NOT_FOUND", decision: "404_NEGATIVE_TTL", evidence: "validated-id" }, { input: "DB_TIMEOUT", decision: "503_NO_CACHE", evidence: "dependency-alert" },
    ], defaultDecision: "500_NO_CACHE", defaultEvidence: "correlation-only", sourceRefs: ["mvc02-list-command", "mvc02-id-command", "jakarta-servlet", "owasp-logging"] },
  },
  {
    id: "mvc02-query-view-test-accessibility-readiness", title: "query-view를 unit·container·real DB·접근성 test로 완성합니다", lead: "데이터가 보인다는 수준을 넘어 empty/error/XSS/keyboard/table semantics와 운영 회귀를 release evidence로 만듭니다.",
    explanations: [
      "pure tests는 id validation, query request normalization, page cursor와 outcome-to-view decision을 exact output으로 검증합니다.",
      "mapper integration은0/1/many, ordering, pagination, null/type와 transaction snapshot을 production과 같은 engine에서 검증합니다.",
      "Servlet/JSP integration은 request attribute key/type, forward path, JSTL branches, output encoding과 status/header를 렌더링해 확인합니다.",
      "security tests는 stored XSS payload, malicious URL id, oversized page, unknown cmd와 cache scope leak를 포함합니다.",
      "table은 caption/thead/th scope와 의미 있는 link text를 제공하고 empty/error message를 screen reader가 인지할 수 있게 합니다.",
      "keyboard focus, zoom, narrow viewport와 long Unicode title에서 link/table이 사용 가능한지 확인합니다.",
      "performance test는 page sizes와 dataset growth에서 query plan, rows scanned, pool wait, p95/p99를 기록합니다.",
      "release packet에는 source5 audit, unit exact outputs, rendered DOM assertions, real-engine migration version, a11y/security/performance 결과와 rollback을 묶습니다.",
    ],
    concepts: [
      { term: "rendered-response test", definition: "JSP/templating engine을 실제로 거쳐 status·headers·HTML DOM과 escaping을 검증하는 integration test입니다.", detail: ["문자열 source scan보다 강합니다.", "container가 필요합니다."] },
      { term: "accessibility tree", definition: "browser가 의미·이름·상태·관계를 assistive technology에 제공하는 구조입니다.", detail: ["table semantics가 중요합니다.", "시각적 모양과 다를 수 있습니다."] },
      { term: "release evidence", definition: "변경이 기능·보안·성능·접근성·복구 요구를 충족했다는 재현 가능한 결과 묶음입니다.", detail: ["환경/version을 기록합니다.", "민감 값은 제거합니다."] },
    ],
    diagnostics: diagnostic("query-view readiness", "소스 scan은 통과했는데 rendered HTML에서 XSS가 실행된다.", "실제 JSP context, browser parser와 tag behavior를 실행하지 않고 token count만 신뢰했습니다.", "container-rendered DOM/security integration test를 release gate에 추가합니다."),
    expertNotes: ["Snapshot tests should assert semantic DOM and encoded values, not freeze irrelevant whitespace and generated markup.", "Production-like data volume is necessary for query-plan evidence, but production PII must never be copied into fixtures."],
    trace: { className: "Mvc02EvidenceDecision", title: "query-view 변경에 필요한 test 계층을 선택합니다", purpose: "정책·mapper·rendering·접근성 증거의 역할을 구분합니다.", cases: [
      { input: "CURSOR_RULE", decision: "JDK_UNIT", evidence: "pure-policy" }, { input: "MAPPER_SQL", decision: "REAL_DB", evidence: "ordering-cardinality" }, { input: "JSP_ESCAPE", decision: "CONTAINER_DOM", evidence: "parser-context" },
    ], defaultDecision: "FULL_MATRIX", defaultEvidence: "unclassified-risk", sourceRefs: ["mybatis-java-api", "jakarta-servlet", "jakarta-tags", "owasp-xss"] },
  },
];

const sources: SessionSource[] = [
  { id: "mvc02-list-command", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/model/BookListCommand.java", usedFor: ["list query", "request booklist", "view path"], evidence: "selectAllBook와 request attribute/view path를 직접 확인했습니다." },
  { id: "mvc02-id-command", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/model/BookIdCommand.java", usedFor: ["bookId", "one query", "null result"], evidence: "raw parameter, selectBookById와 bookVO attribute를 직접 확인했습니다." },
  { id: "mvc02-input-jsp", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex04_db_input.jsp", usedFor: ["POST forms", "hidden cmd", "HTTP semantics"], evidence: "동작별 POST form5와 hidden cmd5를 확인했습니다." },
  { id: "mvc02-list-jsp", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex05_db_output.jsp", usedFor: ["empty", "forEach", "direct EL"], evidence: "empty branch, loop와 직접 EL 출력을 확인했습니다." },
  { id: "mvc02-one-jsp", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex06_db_output.jsp", usedFor: ["empty one", "BookVO fields", "direct EL"], evidence: "bookVO absence와 다섯 field 직접 출력을 확인했습니다." },
  { id: "mybatis-java-api", repository: "MyBatis", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["SqlSession", "select list/one", "mapper"], evidence: "공식 MyBatis Java API reference입니다." },
  { id: "mybatis-sqlmap", repository: "MyBatis", path: "Mapper XML", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["select", "parameter", "result mapping"], evidence: "공식 mapper XML reference입니다." },
  { id: "jakarta-servlet", repository: "Jakarta EE", path: "Servlet 6.1 specification", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1", usedFor: ["request attributes", "forward", "HTTP response"], evidence: "공식 Jakarta Servlet specification입니다." },
  { id: "jakarta-tags", repository: "Jakarta EE", path: "Tags 3.0 specification", publicUrl: "https://jakarta.ee/specifications/tags/3.0/", usedFor: ["JSTL choose/forEach", "EL rendering"], evidence: "공식 Jakarta Tags specification입니다." },
  { id: "rfc9110", repository: "IETF", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110", usedFor: ["safe/idempotent methods", "status", "method semantics"], evidence: "HTTP semantics의 IETF 표준입니다." },
  { id: "owasp-sql-injection", repository: "OWASP", path: "SQL Injection Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", usedFor: ["value binding", "sort allowlist"], evidence: "OWASP parameterization/allowlist 지침입니다." },
  { id: "owasp-xss", repository: "OWASP", path: "Cross Site Scripting Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["stored XSS", "contexts", "CSP boundary"], evidence: "OWASP context-sensitive XSS 방어 지침입니다." },
  { id: "owasp-output-encoding", repository: "OWASP", path: "Java Encoder", publicUrl: "https://owasp.org/www-project-java-encoder/", usedFor: ["context encoders", "Java/JSP output"], evidence: "OWASP Java Encoder 공식 project입니다." },
  { id: "owasp-csrf", repository: "OWASP", path: "CSRF Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["mutation forms", "method split"], evidence: "OWASP CSRF 방어 지침입니다." },
  { id: "owasp-logging", repository: "OWASP", path: "Logging Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["query observability", "PII redaction"], evidence: "OWASP application logging 지침입니다." },
];

const session = buildMvcSession({
  inventoryId: "mvc-02-book-query-view", order: 2, title: "책 조회와 JSP 뷰", subtitle: "목록·한 건 cardinality와 request model에서 JSTL empty/forEach, view DTO·context encoding·HTTP·cache·접근성까지 완성합니다.", level: "중급", estimatedMinutes: 900,
  coreQuestion: "MyBatis 조회 결과를 null·순서·pagination·오류 의미를 잃지 않고 request model로 전달해, JSP가 안전하고 접근 가능하게 렌더링하도록 어떤 계약을 세워야 할까요?",
  summary: "원본5는 SqlSession query command2, POST hidden-cmd forms5, request attributes2, JSTL empty branches2·forEach1과 직접 EL13/c:out0으로 구성됩니다. 실제 DB·Servlet/JSP engine·PII는 실행하거나 읽지 않았습니다. 목록/한 건 cardinality, stable ordering/keyset pagination, validated id/NotFound, detached view model, JSTL 상태, context encoding/stored XSS, HTTP method semantics, cache/timeout/observability와 container·real-engine·접근성 evidence를 10장으로 연결합니다.",
  objectives: ["목록0..N과 한 건0..1 cardinality를 구분한다.", "stable ORDER BY와 keyset pagination을 설계한다.", "raw bookId를 검증하고 invalid/NotFound/integrity failure를 분리한다.", "request attribute key/type/view path 계약을 정의한다.", "persistence VO와 최소 display DTO를 분리한다.", "JSTL empty/choose/forEach를 상태 의미와 함께 사용한다.", "HTML text·attribute·URL context별 output encoding으로 stored XSS를 막는다.", "조회 GET과 변경 POST+CSRF의 HTTP 의미를 구분한다.", "cache scope·timeout·redacted observability를 운영한다.", "unit·container DOM·real DB·접근성 검증을 계층화한다."],
  prerequisites: [{ title: "MyBatis 설정·Mapper 결합", reason: "SqlSession, mapper method, parameter/result mapping을 바탕으로 조회 use case를 구성합니다.", sessionSlug: "mvc-01-mybatis-config-mapper" }, { title: "Servlet 요청 수명주기", reason: "request attribute, forward와 HTTP method/status 경계를 이해해야 합니다.", sessionSlug: "servlet-01-mapping-lifecycle-response" }],
  keywords: ["query", "cardinality", "List", "NotFound", "request attribute", "forward", "view model", "JSTL", "EL empty", "c:choose", "c:forEach", "c:out", "stored XSS", "contextual encoding", "pagination", "cache", "accessibility"], topics,
  lab: { title: "안전하고 확장 가능한 Book catalog query-view", scenario: "전체 목록과 한 건 JSP를 stable pagination, typed outcome, 최소 view DTO와 context-safe rendering으로 재설계합니다.", setup: ["empty·1·many·duplicate·invalid id·XSS strings·long Unicode·DB timeout fixtures를 준비합니다.", "운영 데이터 없이 migration으로 ephemeral DB를 만듭니다.", "list/detail model key·field·status·view contract를 표로 만듭니다."], steps: ["BookQueryRequest를 검증하고 sort enum/page size/cursor를 정규화합니다.", "explicit ORDER BY+unique tie-breaker keyset SQL을 만듭니다.", "한 건0/1/many를 NotFound/Detail/IntegrityFailure로 변환합니다.", "persistence row를 immutable list/detail DTO로 매핑합니다.", "status enum으로 JSP choose branches를 구성합니다.", "모든 사용자 값을 context별 encoder/c:out으로 렌더링합니다.", "GET query URLs와 mutation POST+CSRF를 분리합니다.", "cache key에 filter/sort/cursor/authorization scope를 포함합니다.", "JDK unit·MyBatis real DB·Servlet/JSP DOM·XSS/a11y tests를 실행합니다.", "latency/pool/cache metrics와 rollback evidence를 문서화합니다."], expectedResult: ["순서·page가 데이터 증가와 동시 insert에도 contract대로 동작합니다.", "invalid/absent/error가 같은 empty 화면으로 축약되지 않습니다.", "stored payload가 실행 가능한 DOM으로 변하지 않습니다.", "view model에는 필요한 field만 있고 session/mapper/PII가 새지 않습니다.", "keyboard/screen reader/table semantics와 운영 SLO evidence가 남습니다."], cleanup: ["ephemeral schema/container와 owned files만 제거합니다.", "cache namespace를 비우고 pool/session leak0을 확인합니다.", "rendered fixtures/logs에서 PII·secret을 제거합니다."], extensions: ["검색어 highlighting을 safe text-node composition으로 추가합니다.", "ETag/conditional GET과 authorization-aware cache를 비교합니다.", "streaming HTML 대신 bounded page rendering을 부하 비교합니다.", "Spring MVC model/view로 migration하며 contract를 유지합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "BookId 조회를 validation·NotFound·Detail outcome으로 나누세요.", requirements: ["blank/invalid는 DB 호출0입니다.", "row0은 NotFound입니다.", "row1만 DTO를 만듭니다.", "row2+는 integrity failure입니다.", "exact decision output을 검증합니다."], hints: ["null object로 absence를 숨기지 마세요."], expectedOutcome: "입력과 cardinality별 status/view가 결정적으로 구분됩니다.", solutionOutline: ["parse→query→cardinality→model/view 순서로 구현합니다."] },
    { difficulty: "응용", prompt: "Book list에 keyset pagination과 안전한 정렬을 추가하세요.", requirements: ["unique tie-breaker ORDER BY를 둡니다.", "sort enum allowlist를 사용합니다.", "page size 상한을 둡니다.", "cursor를 검증합니다.", "concurrent insert 회귀를 실제 DB에서 검증합니다."], hints: ["OFFSET과 cursor의 중복/누락 차이를 관찰하세요."], expectedOutcome: "큰 dataset에서도 안정된 다음 page와 bounded query cost를 얻습니다.", solutionOutline: ["sort keys와 cursor tuple을 같은 순서로 맞춥니다."] },
    { difficulty: "설계", prompt: "Book query-view의 보안·접근성·운영 test matrix를 작성하세요.", requirements: ["JSTL empty/error states를 분리합니다.", "HTML/attribute/URL XSS payload를 포함합니다.", "cache tenant leak를 검증합니다.", "table/keyboard/screen-reader acceptance를 포함합니다.", "p95/p99·pool wait·rows scanned SLO를 둡니다.", "민감 정보 없는 evidence format을 정의합니다."], hints: ["source scan만으로 browser parser 결과를 증명할 수 없습니다."], expectedOutcome: "기능·보안·접근성·성능 회귀를 release 전에 발견하는 검증 계획이 완성됩니다.", solutionOutline: ["pure policy→mapper→container DOM→browser/a11y→load 순서로 구성합니다."] },
  ],
  nextSessions: ["mvc-03-book-write-transaction"], sources,
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["inventory의 BookListCommand·BookIdCommand·입력/list/detail JSP를 모두 읽고 사용했습니다.", "직접 EL13과 c:out0은 exposure surface의 정적 근거이며 실제 exploit 여부는 rendered DOM test로 분리했습니다.", "DBUtil/BookMapper/BookVO의 선행 계약은 mvc-01에서 폐쇄했고 이 세션에서는 실제 DB·credential·rows를 사용하지 않았습니다."] },
});

export default session;
