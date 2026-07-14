import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

const noCode = [] as DetailedSession["chapters"][number]["codeExamples"];

const session = {
  schemaVersion: 2,
  inventoryIds: ["jsp-04-jstl-control-format"],
  slug: "jsp-04-jstl-control-format",
  courseId: "servlet-jsp",
  moduleId: "jsp-el-jstl-view",
  order: 9,
  title: "Jakarta Tags 조건·반복·URL·국제화 포맷",
  subtitle: "과거 JSTL URI를 현대 Jakarta Tags URI와 구분하고, c:out/choose/forEach/url 및 locale·zone 고정 fmt 계약으로 scriptlet view를 완성합니다.",
  level: "중급",
  estimatedMinutes: 900,
  coreQuestion: "JSTL/Jakarta Tags로 Java 코드를 없애면서도 빈 상태·반복 status·URL·escaping·숫자와 날짜 국제화가 환경에 따라 흔들리지 않게 하려면 어떤 계약이 필요할까요?",
  summary: "원본 JSTL JSP4와 BookVO1 closure를 모두 읽습니다. 활성 source에는 page directives10, taglib directives6, expressions2, scriptlets2, EL86, c:out8, c:if5, c:choose3/c:when5/c:otherwise3, c:forEach6, c:forTokens3, fmt number/parse24, fmt date12, raw table-cell EL10, getContextPath scriptlet2가 있습니다. core old URI4와 fmt old URI2는 source-era 사실이며 Jakarta Tags 3.0의 현대 URI는 `jakarta.tags.core`, `jakarta.tags.fmt`입니다. ex02는 scriptlet로 BookVO list를 만들고 sample 사람/출판 값이 있어 공개하지 않습니다. ex03은 LocalDateTime.now와 ZoneId.systemDefault로 시간·zone·locale 의존 결과를 만들고 parseNumber의 부분 parse를 시연합니다. DB views는 empty choose가 좋지만 table cells10을 raw EL로 출력하고 URL을 scriptlet로 만듭니다. JDK-only exact models로 set/out/choose, forEach status, c:url component encoding, explicit Locale·ZoneId·fixed Instant formatting을 검증합니다.",
  objectives: [
    "JSTL source-era URI와 Jakarta Tags 3.0 URI·container/dependency compatibility를 구분한다.",
    "c:set·c:remove의 scope와 c:out의 value/default/escaping 경계를 적용한다.",
    "c:if와 c:choose/when/otherwise의 독립 조건·mutually-exclusive 분기를 구분한다.",
    "c:forEach items/range/begin/end/step/varStatus semantics와 empty input을 설명한다.",
    "c:forTokens가 delimiter 문자 집합 기반 tokenization이며 structured data parser가 아님을 설명한다.",
    "list/single view의 empty·ready·failed states와 valid table markup을 설계한다.",
    "c:url·c:param으로 context path와 query value encoding을 중앙화한다.",
    "fmt:formatNumber/parseNumber의 locale·pattern·rounding·partial parse 위험을 다룬다.",
    "fmt:formatDate의 locale·time zone·current-time nondeterminism을 제거한다.",
    "BookVO/domain data를 typed view DTO로 바꾸고 raw EL table output을 contextual encoding한다.",
  ],
  prerequisites: [
    { title: "EL scope와 property resolution", reason: "Tags의 value/items/test는 EL evaluation과 bean/List/Map model에 의존합니다.", sessionSlug: "jsp-03-el-scope-resolution" },
    { title: "JSP action과 context path", reason: "c:url이 해결하는 deployment URL과 request model/forward 흐름을 알아야 합니다.", sessionSlug: "jsp-02-actions-context-path" },
  ],
  keywords: ["JSTL", "Jakarta Tags", "taglib", "jakarta.tags.core", "jakarta.tags.fmt", "c:set", "c:out", "c:if", "c:choose", "c:forEach", "varStatus", "c:forTokens", "empty state", "c:url", "c:param", "fmt:formatNumber", "fmt:parseNumber", "fmt:formatDate", "Locale", "ZoneId", "Clock", "BookVO", "XSS"],
  chapters: [],
  lab: {
    title: "국제화 가능한 안전한 책 목록·단건 view",
    scenario: "controller가 typed BookView list/single outcome을 만들고 JSP는 Jakarta Tags만으로 empty/error/ready table, safe links와 locale·zone formatting을 렌더합니다.",
    setup: ["empty/one/many/failure book states와 malicious title/publisher를 준비합니다.", "root 및 /study context, query 특수문자, ko-KR/en-US locale, Asia/Seoul/UTC zone, fixed Instant fixtures를 준비합니다.", "원본5는 read-only로 두고 사용자·sample 사람/출판 값은 출력하지 않습니다."],
    steps: ["direct4와 BookVO closure1의 active tags·EL·scriptlets·raw sinks를 count합니다.", "runtime stack이 legacy JSTL인지 Jakarta Tags 3.0인지 확인하고 URI/dependencies를 한 세대로 맞춥니다.", "controller에서 BookVO를 numeric price/stock과 safe display fields가 있는 immutable BookView로 변환합니다.", "JSP scriptlet list construction과 context-path 연결을 제거합니다.", "c:choose로 failed/empty/ready를 mutually exclusive하게 렌더합니다.", "c:forEach varStatus로 row number/first/last를 표현하고 empty body에 의존하지 않습니다.", "모든 cell text는 c:out/approved encoder를 사용합니다.", "c:url+c:param으로 context/query를 만들고 HTML attribute에 안전하게 출력합니다.", "fmt locale/timeZone을 request/user policy에서 explicit하게 설정하고 fixed server model time을 format합니다.", "root/non-root, malicious text, empty/one/many, locale/zone, invalid number와 taglib mismatch를 real container에서 검증합니다."],
    expectedResult: ["scriptlet/declaration0인 JSP가 valid empty/ready/error table을 렌더합니다.", "legacy/modern tag URI 혼합 없이 target container가 startup/translation에 성공합니다.", "URL은 root/non-root와 특수 query에서 정확하고 cell text는 XSS-safe입니다.", "같은 instant가 지정 locale/zone에서 예측 가능한 형식으로 보입니다."],
    cleanup: ["owned temp와 formatting fixtures만 삭제합니다.", "request/session tag variables를 제거합니다.", "원본 hashes와 privacy assertions를 확인합니다."],
    extensions: ["ResourceBundle과 fmt:message로 label/message 국제화를 추가합니다.", "pagination/sorting links를 c:url contract에 확장합니다.", "currency amount를 minor-unit/BigDecimal domain type으로 전환합니다.", "JSP tag file/component로 table row 중복을 제거합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "scriptlet Book list를 request-scoped immutable list와 c:forEach/c:out으로 바꾸세요.", requirements: ["empty/one/many states를 test합니다.", "varStatus index/count/first/last를 사용합니다.", "모든 cells를 escape합니다.", "scriptlet0을 확인합니다.", "valid table 구조를 유지합니다."], hints: ["c:forEach body가0회 실행되는 것과 사용자에게 empty state를 보여 주는 것은 다릅니다.", "BookVO String price는 view/domain type 문제로 기록하세요."], expectedOutcome: "안전하고 접근 가능한 목록 view가 완성됩니다.", solutionOutline: ["controller model→choose state→forEach rows→c:out cells 순서로 구성합니다."] },
    { difficulty: "응용", prompt: "c:url과 fmt tags로 root/non-root·locale·zone에 독립적인 view를 만드세요.", requirements: ["legacy/modern URI를 target stack에 맞춥니다.", "c:param으로 query를 추가합니다.", "ko-KR/en-US number를 비교합니다.", "Asia/Seoul/UTC date를 비교합니다.", "current time을 controller Clock에서 주입합니다.", "invalid/partial number parse를 거부합니다."], hints: ["format과 parse는 반대 방향이지만 strictness가 자동 대칭은 아닙니다.", "URL encoding과 HTML output을 둘 다 확인하세요."], expectedOutcome: "배포·언어·시간대가 바뀌어도 명시 정책대로 동작하는 view가 완성됩니다.", solutionOutline: ["stack compatibility→URL builder→locale/zone context→format-only view→integration matrix로 진행합니다."] },
    { difficulty: "설계", prompt: "조직의 Jakarta Tags view 표준과 migration matrix를 작성하세요.", requirements: ["JSP/EL/Tags/Servlet version matrix를 둡니다.", "approved taglib URI와 dependencies를 둡니다.", "tag별 허용 scope·complexity를 둡니다.", "empty/error/ready view state 표준을 둡니다.", "escaping·URL·locale·zone 정책을 둡니다.", "translation/runtime/security regression gate를 정의합니다."], hints: ["prefix는 관례이고 URI가 library identity입니다.", "태그가 많아졌다는 사실이 MVC separation을 보장하지 않습니다."], expectedOutcome: "legacy JSTL pages를 현대 Jakarta view로 안전하게 전환하는 실행 가능한 ADR이 완성됩니다.", solutionOutline: ["inventory→compatibility→semantic migration→security/i18n tests→rollout/rollback으로 구성합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["mvc-01-mybatis-config-mapper"],
  sources: [],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "inventory direct JSP4와 ex02 import/EL property의 semantic closure BookVO1을 모두 읽고 사용했습니다.",
      "Book list/single producer Commands와 database mapper는 다음 MVC sessions 소유이므로 이 세션은 provided model의 tag rendering contract에 집중합니다.",
      "템플릿 사용자 값4와 ex02 scriptlet의 sample 사람/출판 strings는 공개하지 않고 tag/shape/count만 사용합니다.",
      "JDK formatting examples는 정책을 deterministic하게 가르치며 실제 fmt tag와 target container의 locale data/URI compatibility는 integration 범위입니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAudit: DetailedSession["chapters"][number] = {
  id: "original-jsp04-direct4-closure5-audit",
  title: "원본 direct4·BookVO closure5의 tags·raw sinks·시간/URI 위험을 감사합니다",
  lead: "JSP/Jakarta Tags container와 DB를 실행하지 않고 source hashes와 active tag shape를 privacy-preserving counts로 보존합니다.",
  explanations: [
    "direct4는 core control demo, formatting demo, DB list view, DB single view이고 BookVO는 ex02 import·constructor·EL getter property를 설명하는 closure1입니다.",
    "JSP comments와 Java comments를 제거한 active source에는 page directives10, taglib directives6, expressions2, scriptlets2, EL86이 있습니다.",
    "core tags는 c:out8, c:if5, c:choose3, c:when5, c:otherwise3, c:forEach6, c:forTokens3입니다. comments 속 syntax examples는 count에서 제외합니다.",
    "formatting tags는 formatNumber/parseNumber24, formatDate12입니다. current time은 LocalDateTime.now1과 ZoneId.systemDefault1을 사용해 exact output이 host에 의존합니다.",
    "source-era taglib URIs는 old core4와 old fmt2입니다. 현대 Jakarta Tags 3.0 URIs와 섞지 않고 target runtime stack에 맞춰 migration합니다.",
    "DB views는 empty choose를 명시하지만 table cells의 raw EL direct sinks10과 getContextPath scriptlet expressions2가 있습니다.",
    "ex02는 scriptlet에서 BookVO4개와 List를 만들고 request attribute를 설정합니다. sample 사람/출판 값은 source 밖으로 내보내지 않습니다.",
    "BookVO는 String fields5와 public getters5/setters5를 가진 mutable bean입니다. EL properties는 getters로 읽지만 price/stock String은 numeric formatting·validation을 어렵게 합니다.",
    "parseNumber examples에는 numeric prefix 뒤 text가 있는 입력이 있어 부분 parse behavior를 보여 줍니다. user input validation으로 그대로 사용하면 trailing garbage가 허용될 수 있습니다.",
    "audit은 JSP translation0, tag handler0, DB0, clock0, network0이며 original5를 read-only로 유지합니다.",
  ],
  concepts: [
    { term: "tag shape audit", definition: "JSP comments를 제거한 active custom-action/tag occurrences와 raw output/context calls를 세는 source evidence입니다.", detail: ["runtime 결과가 아닙니다.", "migration inventory입니다."] },
    { term: "stack generation", definition: "Servlet/JSP/EL/Tags package namespace·URI·container version이 함께 맞아야 하는 호환성 세대입니다.", detail: ["legacy와 Jakarta를 구분합니다.", "혼합을 피합니다."] },
    { term: "format nondeterminism", definition: "현재 시각·default locale·default zone·locale data가 명시되지 않아 같은 source 출력이 환경별로 달라지는 현상입니다.", detail: ["fixed input을 씁니다.", "locale/zone을 명시합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-jsp04-audit",
    title: "원본5 hash·active tags·URI/time/raw sinks를 값 노출 없이 검증합니다",
    language: "powershell",
    filename: "verify-original-jsp04.ps1",
    purpose: "tag migration과 security/i18n 개선의 정확한 source baseline을 만듭니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ('jsp04 audit '+[Guid]::NewGuid().ToString('N'));$owned=$false;$failure=$null
function Count([string]$text,[string]$pattern){([regex]::Matches($text,$pattern)).Count}
try{
  New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$owned=$true
  $rels=@(
    'src/main/webapp/day03/ex02_JSTL.jsp','src/main/webapp/day03/ex03_JSTL.jsp',
    'src/main/webapp/day03/ex05_db_output.jsp','src/main/webapp/day03/ex06_db_output.jsp',
    'src/main/java/org/study/jspstudy/vo/BookVO.java'
  )
  $raw='';$hashes=0
  for($i=0;$i-lt$rels.Count;$i++){
    $source=Get-Item -LiteralPath (Join-Path $SourceRoot $rels[$i]);$copy=Join-Path $root ($i.ToString()+$source.Extension)
    [IO.File]::Copy($source.FullName,$copy)
    if((Get-FileHash $source.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $copy -Algorithm SHA256).Hash){throw 'hash drift'}
    $hashes++;$raw+=[IO.File]::ReadAllText($copy)+[Environment]::NewLine
  }
  $users=Count $raw '(?m)^\s*User\s*:';$active=[regex]::Replace($raw,'(?s)<%--.*?--%>','')
  $active=[regex]::Replace($active,'(?s)/\*.*?\*/','')
  $shape=[ordered]@{
    page=Count $active '<%@\s*page\b';taglib=Count $active '<%@\s*taglib\b';expression=Count $active '<%=';scriptlet=Count $active '<%(?![@!=\-])';el=Count $active '\$\{'
    out=Count $active '<c:out\b';ifTag=Count $active '<c:if\b';choose=Count $active '<c:choose\b';when=Count $active '<c:when\b';otherwise=Count $active '<c:otherwise\b'
    forEach=Count $active '<c:forEach\b';forTokens=Count $active '<c:forTokens\b';fmtNumber=Count $active '<fmt:(?:formatNumber|parseNumber)\b';fmtDate=Count $active '<fmt:formatDate\b'
    oldCore=Count $active 'uri="http://java\.sun\.com/jsp/jstl/core"';oldFmt=Count $active 'uri="http://java\.sun\.com/jsp/jstl/fmt"'
    context=Count $active 'getContextPath\s*\(';clockNow=Count $active 'LocalDateTime\.now\s*\(';defaultZone=Count $active 'ZoneId\.systemDefault\s*\('
    rawCells=Count $active '(?s)<td>\s*\$\{';getters=Count $active '\bString\s+get(?:BookId|BookName|Publisher|Price|Stock)\s*\('
  }
  $expected=@{page=10;taglib=6;expression=2;scriptlet=2;el=86;out=8;ifTag=5;choose=3;when=5;otherwise=3;forEach=6;forTokens=3;fmtNumber=24;fmtDate=12;oldCore=4;oldFmt=2;context=2;clockNow=1;defaultZone=1;rawCells=10;getters=5}
  foreach($name in $expected.Keys){if($shape[$name]-ne$expected[$name]){throw ('shape drift: '+$name)}}
  if($hashes-ne5-or$users-ne4){throw 'coverage drift'}
  'files=5,hashes=5,direct=4,closure=5|active=page10,taglib6,expression2,scriptlet2,el86|core=out8,if5,choose3,when5,otherwise3,forEach6,forTokens3|fmt=number24,date12|uri=oldCore4,oldFmt2|risk=context2,clockNow1,defaultZone1,rawCells10|getters=5'
  'privacy=templateUser:4,value:not-emitted|samplePeoplePublisher:value:not-emitted|container:not-started|DB:none|original:read-only'
}catch{$failure=$_.Exception}finally{
  if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item -LiteralPath $resolved -Recurse -Force}
  if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}
}`,
    walkthrough: [
      { lines: "1-6", explanation: "count-only audit와 direct-child temp를 준비합니다." },
      { lines: "7-21", explanation: "direct4와 BookVO closure1을 copy/hash 검증합니다." },
      { lines: "22-38", explanation: "comments 밖 tags·legacy URI·time/context/raw cell/getter shape를 셉니다." },
      { lines: "35-38", explanation: "expected evidence와 privacy marker를 출력하고 owned temp만 정리합니다." },
    ],
    run: { environment: ["PowerShell 7+", "jspstudy project root", "JSP/Tags container와 DB 불필요"], command: "pwsh -NoProfile -File verify-original-jsp04.ps1 -SourceRoot <jspstudy-project-root>" },
    output: { value: "files=5,hashes=5,direct=4,closure=5|active=page10,taglib6,expression2,scriptlet2,el86|core=out8,if5,choose3,when5,otherwise3,forEach6,forTokens3|fmt=number24,date12|uri=oldCore4,oldFmt2|risk=context2,clockNow1,defaultZone1,rawCells10|getters=5\nprivacy=templateUser:4,value:not-emitted|samplePeoplePublisher:value:not-emitted|container:not-started|DB:none|original:read-only", explanation: ["원본 active tag baseline을 고정합니다.", "sample values를 출력하지 않습니다.", "container/DB/time을 실행하지 않습니다."] },
    experiments: [
      { change: "JSP comments를 제거하지 않고 c:out을 셉니다.", prediction: "주석 속 syntax가 섞여8보다 증가합니다.", result: "active tags만 migration baseline으로 사용합니다." },
      { change: "BookVO를 closure에서 뺍니다.", prediction: "ex02 constructor와 EL getter properties의 type 근거가 사라집니다.", result: "semantic closure5를 공개합니다." },
      { change: "scriptlet Book values를 출력합니다.", prediction: "sample 사람/출판 정보가 공개됩니다.", result: "shape/count만 보존합니다." },
    ],
    sourceRefs: ["source-jsp04-core", "source-jsp04-format", "source-jsp04-list", "source-jsp04-one", "source-jsp04-bookvo"],
  }],
  diagnostics: [
    { symptom: "tag count가 baseline과 다릅니다.", likelyCause: "JSP comments를 포함했거나 source가 drift했습니다.", checks: ["hash를 봅니다.", "comment stripping을 확인합니다.", "direct/closure 목록을 비교합니다."], fix: "source change를 review하고 intentional evidence만 갱신합니다.", prevention: "hash와 active counts를 함께 둡니다." },
    { symptom: "audit artifact에 sample 사람/출판 값이 보입니다.", likelyCause: "scriptlet constructor arguments나 source excerpts를 출력했습니다.", checks: ["stdout/artifacts를 scan합니다.", "raw match output을 봅니다.", "publish cache를 확인합니다."], fix: "value-free evidence로 교체하고 노출 artifact를 정정합니다.", prevention: "privacy assertion과 publication scan을 둡니다." },
  ],
};

(session.chapters as DetailedSession["chapters"]).push(originalAudit);

const maintainedChapters: DetailedSession["chapters"] = [
  {
    id: "taglib-uri-runtime-compatibility",
    title: "taglib prefix·URI·dependency·container를 하나의 compatibility matrix로 맞춥니다",
    lead: "c와 fmt라는 prefix가 같아도 library identity와 package generation이 다르면 translation이 실패합니다.",
    explanations: [
      "taglib directive의 prefix는 page-local 별칭이고 URI가 tag library identity입니다. prefix는 c/fmt 관례를 따르되 다른 이름도 가능합니다.",
      "원본은 legacy URI http://java.sun.com/jsp/jstl/core와 /fmt를 사용합니다. source-era 사실로 보존하되 현대 Jakarta stack에 무조건 복사하지 않습니다.",
      "Jakarta Tags 3.0 tagdocs는 core URI `jakarta.tags.core`, formatting URI `jakarta.tags.fmt`를 정의합니다.",
      "Servlet/JSP/EL/Tags API와 implementation, javax↔jakarta namespace, container version이 맞아야 합니다. API jar만 넣고 implementation이 없으면 runtime/translation 실패가 납니다.",
      "migration은 URI 한 줄 치환보다 dependency tree·container capabilities·TLD discovery·integration page translation을 함께 검증합니다.",
    ],
    concepts: [
      { term: "tag library URI", definition: "TLD가 선언하고 taglib directive가 참조하는 library identifier이며 실제 network fetch URL일 필요는 없습니다.", detail: ["prefix와 다릅니다.", "stack version에 맞춥니다."] },
      { term: "compatibility matrix", definition: "Servlet·Pages·EL·Tags spec/API/implementation/container 세대가 함께 동작하는 조합 표입니다.", detail: ["javax/jakarta 혼합을 막습니다.", "deployment test로 확인합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "The absolute uri cannot be resolved 오류가 납니다.", likelyCause: "URI와 설치된 tag library/TLD/container generation이 맞지 않습니다.", checks: ["taglib URI를 봅니다.", "dependency tree를 봅니다.", "container JSP/Tags 지원 버전을 확인합니다."], fix: "한 세대의 API·implementation·URI로 정렬합니다.", prevention: "compatibility matrix와 minimal JSP translation smoke test를 둡니다." },
      { symptom: "compile은 되지만 tag handler class가 runtime에 없습니다.", likelyCause: "API만 compile classpath에 있고 implementation/deployment packaging이 빠졌습니다.", checks: ["runtime artifacts를 봅니다.", "provided/runtime scopes를 확인합니다.", "container bundled implementation을 봅니다."], fix: "target container 지침에 맞는 implementation과 scope를 추가합니다.", prevention: "clean container image에서 deployment test합니다." },
    ],
  },
  {
    id: "set-out-remove-scope-escaping",
    title: "c:set·c:out·c:remove를 scoped value lifecycle과 safe text output으로 사용합니다",
    lead: "태그로 변수를 만들 수 있다는 사실보다 값을 어디서 계산하고 언제 제거하며 어떤 context로 출력하는지가 중요합니다.",
    explanations: [
      "c:set var/value는 기본 page scope에 값을 저장할 수 있고 scope를 지정하면 request/session/application까지 확장합니다. view scratch 외 긴 scope mutation은 피합니다.",
      "업무/조회 값을 c:set chains로 계산하기보다 controller가 typed model을 제공합니다. c:set은 짧은 presentation alias나 tag result에 제한합니다.",
      "c:out value는 expression 결과를 출력하고 escapeXml 기본 동작으로 XML/HTML-significant 문자를 escape합니다. literal `value=\"msg\"`는 변수 lookup이 아니라 문자 msg입니다.",
      "default는 missing/null 표시를 명시하지만 backend failure를 fallback label로 숨기지 않습니다. required model과 optional display를 구분합니다.",
      "c:remove는 특정 scope를 명시해 제거합니다. unscoped remove가 여러 scopes를 건드리는 방식에 기대지 말고 owner scope를 분명히 합니다.",
    ],
    concepts: [
      { term: "scoped variable", definition: "var 이름으로 page/request/session/application 저장소에 놓이는 tag result입니다.", detail: ["default page scope입니다.", "수명과 공유를 고려합니다."] },
      { term: "c:out", definition: "EL value를 출력하고 기본 XML escaping과 optional default를 제공하는 core tag입니다.", detail: ["literal과 expression을 구분합니다.", "모든 context 만능은 아닙니다."] },
    ],
    codeExamples: [{
      id: "java-core-tag-control-model",
      title: "set·if·choose·out의 핵심을 immutable exact trace로 모델링합니다",
      language: "java",
      filename: "CoreTagModel.java",
      purpose: "실제 tag implementation을 흉내 내지 않고 variable/control/output 의도를 JDK-only로 검증합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class CoreTagModel {
    static String htmlText(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }

    static String grade(int score) {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        return "F";
    }

    public static void main(String[] args) {
        Map<String, Object> page = new LinkedHashMap<>();
        page.put("message", "<b>ready & safe</b>");
        boolean visible = ((String) page.get("message")).length() > 10;
        System.out.println("set=message|if=" + visible + "|choose=" + grade(90));
        System.out.println("literal=message|out=" + htmlText((String) page.get("message")));
        page.remove("message");
        System.out.println("removed=" + !page.containsKey("message"));
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "page variable map과 HTML text renderer를 정의합니다." },
        { lines: "10-15", explanation: "c:choose first-match와 같은 ordered grade decision을 만듭니다." },
        { lines: "17-25", explanation: "set/if/literal-vs-value/out/remove 결과를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "tag mental model"], command: isolatedJavaRun("CoreTagModel.java", "CoreTagModel") },
      output: { value: "set=message|if=true|choose=A\nliteral=message|out=&lt;b&gt;ready &amp; safe&lt;/b&gt;\nremoved=true", explanation: ["literal message와 variable value가 구분됩니다.", "value는 markup이 아니라 text입니다.", "scope variable을 제거합니다."] },
      experiments: [
        { change: "out에서 htmlText를 제거합니다.", prediction: "b tag가 markup으로 해석될 수 있습니다.", result: "default escaping을 유지합니다." },
        { change: "message를 session map에 둡니다.", prediction: "같은 session requests에 값이 남습니다.", result: "presentation scratch는 page/request로 제한합니다." },
        { change: "score를80으로 바꿉니다.", prediction: "choose=B입니다.", result: "first-match ordering을 확인합니다." },
      ],
      sourceRefs: ["source-jsp04-core", "jakarta-tags-core", "jakarta-tags-out", "owasp-xss"],
    }],
    diagnostics: [
      { symptom: "c:out이 msg 값 대신 'msg'를 출력합니다.", likelyCause: "value=\"msg\" literal을 쓰고 value=\"${msg}\" expression을 쓰지 않았습니다.", checks: ["tag attribute를 봅니다.", "EL delimiters를 확인합니다.", "scope variable 존재를 봅니다."], fix: "의도한 expression을 value에 사용합니다.", prevention: "literal/expression examples를 review checklist에 둡니다." },
      { symptom: "한 page가 session variable을 덮어 다른 tab에 영향을 줍니다.", likelyCause: "c:set scope=session으로 request별 presentation 값을 저장했습니다.", checks: ["scope attribute를 봅니다.", "same-session concurrent tabs를 test합니다.", "remove owner를 확인합니다."], fix: "request/page scope 또는 controller model로 이동합니다.", prevention: "view tag의 session/application writes를 lint합니다." },
    ],
  },
  {
    id: "if-choose-mutual-exclusion",
    title: "독립 c:if와 first-match c:choose를 의도에 맞게 선택합니다",
    lead: "여러 조건이 동시에 참이어도 모두 보여야 하는지, 정확히 한 branch만 보여야 하는지를 먼저 결정합니다.",
    explanations: [
      "c:if는 else가 없는 독립 conditional body입니다. 여러 c:if를 나열하면 조건이 겹칠 때 여러 bodies가 모두 실행될 수 있습니다.",
      "c:choose는 c:when을 source 순서로 평가해 첫 true branch만 실행하고 모두 false면 c:otherwise를 실행합니다.",
      "threshold grade처럼 mutually exclusive classification은 높은 기준부터 ordered choose로 씁니다. 순서를 낮은 기준부터 두면90도70 branch에서 멈춥니다.",
      "조건 expression에 DB call·시간·난수·mutation을 넣지 않습니다. controller가 stable boolean/enum을 제공합니다.",
      "else가 필요 없고 여러 badges가 동시에 가능하면 independent c:if가 맞습니다. semantic intent를 code structure로 드러냅니다.",
    ],
    concepts: [
      { term: "independent condition", definition: "다른 조건 결과와 무관하게 true인 모든 body가 실행될 수 있는 분기입니다.", detail: ["c:if에 적합합니다.", "overlap을 허용합니다."] },
      { term: "first-match branch", definition: "ordered alternatives 중 처음 true인 하나만 선택하는 분기입니다.", detail: ["c:choose에 적합합니다.", "순서가 계약입니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "합격/불합격 둘 다 보입니다.", likelyCause: "서로 배타적이어야 할 조건을 겹치는 독립 c:if로 작성했습니다.", checks: ["각 test truth table을 만듭니다.", "boundary values를 test합니다.", "choose 사용 여부를 봅니다."], fix: "mutually exclusive state는 c:choose 또는 controller enum으로 바꿉니다.", prevention: "branch truth-table test를 둡니다." },
      { symptom: "90점이 C로 표시됩니다.", likelyCause: "c:when thresholds를 낮은 값부터 두어 first match가 너무 일찍 선택됐습니다.", checks: ["source order를 봅니다.", "70/80/90 boundaries를 test합니다.", "overlapping predicates를 봅니다."], fix: "높은 threshold부터 정렬하거나 controller가 grade를 계산합니다.", prevention: "boundary table tests를 둡니다." },
    ],
  },
  {
    id: "foreach-items-range-varstatus",
    title: "c:forEach items·range와 varStatus의 index/count/first/last를 정확히 구분합니다",
    lead: "반복 값, 원본 위치, 반복 횟수와 마지막 여부는 pagination·step·subrange에서 서로 달라질 수 있습니다.",
    explanations: [
      "items는 array, Collection, Map entries 등 supported iterable data를 순회합니다. null/empty면 body가0회 실행되므로 empty UI는 별도 choose가 필요합니다.",
      "begin/end/step range는 일반적으로 end inclusive이며 step은 양의 진행 간격으로 사용합니다. exact target tag documentation과 invalid values를 확인합니다.",
      "var는 현재 item 또는 range value이고 varStatus.count는1-based iteration count, index는 현재 source/range index, first/last는 경계 flags입니다.",
      "begin/step을 사용하면 count와 index가 같지 않을 수 있습니다. 원본 설명처럼 index=begin+(count-1)*step 관계를 이해합니다.",
      "view에서 sort/filter/group를 복잡하게 하지 말고 controller가 원하는 ordered immutable list를 제공합니다. 반복은 pure rendering으로 제한합니다.",
    ],
    concepts: [
      { term: "varStatus", definition: "현재 반복의 index·count·first·last 등 상태를 제공하는 loop status object입니다.", detail: ["count는1-based입니다.", "index와 구분합니다."] },
      { term: "inclusive range", definition: "begin에서 시작해 step으로 증가하며 end 이하의 값을 포함하는 range iteration model입니다.", detail: ["end가 포함될 수 있습니다.", "boundary test가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-foreach-status-model",
      title: "begin10·end14·step2의 value/index/count/first/last를 exact 출력합니다",
      language: "java",
      filename: "ForEachStatusModel.java",
      purpose: "실제 tag handler 없이 range varStatus mental model과 boundary를 결정적으로 검증합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;

public class ForEachStatusModel {
    record Status(int value, int index, int count, boolean first, boolean last) {}

    static List<Status> range(int begin, int end, int step) {
        if (step <= 0) throw new IllegalArgumentException("step must be positive");
        List<Integer> values = new ArrayList<>();
        for (int value = begin; value <= end; value += step) values.add(value);
        List<Status> result = new ArrayList<>();
        for (int i = 0; i < values.size(); i++) {
            int value = values.get(i);
            result.add(new Status(value, value, i + 1, i == 0, i == values.size() - 1));
        }
        return List.copyOf(result);
    }

    public static void main(String[] args) {
        for (Status status : range(10, 14, 2)) {
            System.out.println("value=" + status.value() + ",index=" + status.index()
                    + ",count=" + status.count() + ",first=" + status.first() + ",last=" + status.last());
        }
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "range value와 status fields를 immutable record로 만듭니다." },
        { lines: "7-17", explanation: "positive step, inclusive end와1-based count/first/last를 계산합니다." },
        { lines: "19-24", explanation: "세 iterations의 status를 source 순서대로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "tag mental model"], command: isolatedJavaRun("ForEachStatusModel.java", "ForEachStatusModel") },
      output: { value: "value=10,index=10,count=1,first=true,last=false\nvalue=12,index=12,count=2,first=false,last=false\nvalue=14,index=14,count=3,first=false,last=true", explanation: ["count는1,2,3입니다.", "index/value는10,12,14입니다.", "last는 end item에서만 true입니다."] },
      experiments: [
        { change: "end를13으로 바꿉니다.", prediction: "values10,12만 실행되고12가 last입니다.", result: "step으로 end를 정확히 밟지 않아도 end를 넘기기 전 멈춥니다." },
        { change: "step을0으로 바꿉니다.", prediction: "typed failure가 납니다.", result: "무한 loop를 막습니다." },
        { change: "empty items로 바꿉니다.", prediction: "body output0입니다.", result: "empty state는 choose로 별도 렌더합니다." },
      ],
      sourceRefs: ["source-jsp04-core", "jakarta-tags-foreach"],
    }],
    diagnostics: [
      { symptom: "row 번호가 begin/step 사용 시 건너뜁니다.", likelyCause: "varStatus.index를1-based 연속 count로 오해했습니다.", checks: ["index와 count를 함께 출력합니다.", "begin/step을 봅니다.", "pagination offset을 확인합니다."], fix: "연속 표시 번호에는 count 또는 offset+count를 사용합니다.", prevention: "begin0/10과 step1/2 matrix를 test합니다." },
      { symptom: "empty list에서 table body가 완전히 비어 접근성이 나쁩니다.", likelyCause: "forEach0회 실행을 empty UI로 충분하다고 생각했습니다.", checks: ["empty choose를 봅니다.", "tbody valid row를 확인합니다.", "screen reader text를 봅니다."], fix: "choose로 colspan empty row와 recovery action을 렌더합니다.", prevention: "empty/one/many visual·DOM tests를 둡니다." },
    ],
  },
  {
    id: "fortokens-delimiter-limits",
    title: "c:forTokens를 단순 delimiter tokenization에만 사용합니다",
    lead: "CSV·경로·검색 문법처럼 quoting·escaping·empty field 의미가 있는 데이터는 전문 parser가 필요합니다.",
    explanations: [
      "forTokens는 items String을 delims에 지정한 delimiter characters로 나누어 순회합니다. delimiter 문자열 전체를 하나의 multi-character separator로 오해하지 않습니다.",
      "여러 delimiter 문자, 연속 delimiter, leading/trailing delimiter, empty token 처리 의미를 target tag documentation과 fixtures로 확인합니다.",
      "CSV에는 quoted comma, escaped quote, newline record가 있어 forTokens로 안전하게 parse할 수 없습니다. controller에서 CSV parser를 사용합니다.",
      "slash/space/comma로 user text를 나누면 의미가 손실되고 Unicode whitespace와 normalization 문제가 생깁니다. 입력 계약을 먼저 정의합니다.",
      "view는 이미 `List<String>`으로 정규화된 tokens를 forEach로 렌더하는 것이 type-safe하고 test하기 쉽습니다.",
    ],
    concepts: [
      { term: "delimiter character set", definition: "delims 문자열에 포함된 각 문자가 token separator로 작동하는 단순 tokenization 규칙입니다.", detail: ["정규식이 아닙니다.", "CSV parser가 아닙니다."] },
      { term: "structured parser", definition: "quoting·escaping·nesting·invalid syntax를 문법에 따라 처리하는 parser입니다.", detail: ["controller boundary에 둡니다.", "typed list를 view에 넘깁니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "comma가 포함된 quoted CSV field가 둘로 쪼개집니다.", likelyCause: "forTokens를 CSV parser로 사용했습니다.", checks: ["input grammar를 봅니다.", "quotes/escapes/newlines fixtures를 test합니다.", "delimiter contract를 확인합니다."], fix: "검증된 CSV parser로 controller에서 List를 만듭니다.", prevention: "view tokenization을 display-only 단순 값으로 제한합니다." },
      { symptom: "연속 delimiter의 empty field가 사라집니다.", likelyCause: "tokenizer semantics와 업무에서 empty column이 갖는 의미가 다릅니다.", checks: ["leading/trailing/repeated delimiters를 test합니다.", "target tagdocs를 봅니다.", "data schema를 확인합니다."], fix: "schema-aware parser를 사용하고 explicit empty values를 model에 보존합니다.", prevention: "delimiter edge corpus를 producer test에 둡니다." },
    ],
  },
  {
    id: "empty-list-single-table-view",
    title: "목록·단건의 missing/empty/ready/failed를 valid table 구조로 렌더합니다",
    lead: "${empty model} 하나로 모든 실패를 묶지 않고 producer outcome과 사용자 복구 흐름을 보존합니다.",
    explanations: [
      "목록 success-empty는 empty list, success-ready는 immutable list, failure는 별도 ErrorView로 전달합니다. null은 producer contract 위반에 가깝게 다룹니다.",
      "단건은 found/not-found/forbidden/failed를 구분합니다. `${empty bookVO}`가 null 원인을 모두 '정보 없음'으로 축소하지 않게 합니다.",
      "table empty state는 tbody 안의 tr/td와 정확한 colspan으로 렌더해 valid markup과 accessible message를 유지합니다.",
      "원본 cells10의 `${book.*}` 직접 출력은 escaping을 보장하지 않습니다. 각 cell을 c:out로 출력하고 numeric fields는 typed format tag를 사용합니다.",
      "목록 링크는 c:url로 canonical route를 만들고 button/link 목적과 focus text를 명확히 합니다. CSS는 data state와 분리합니다.",
    ],
    concepts: [
      { term: "view state", definition: "loading/empty/ready/not-found/forbidden/failed처럼 renderer가 명시적으로 선택하는 화면 상태입니다.", detail: ["producer outcome에서 옵니다.", "mutually exclusive합니다."] },
      { term: "valid empty row", definition: "tbody 안에 column count와 맞는 colspan cell로 empty message를 제공하는 table representation입니다.", detail: ["markup 구조를 유지합니다.", "접근 가능한 text를 둡니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "DB 오류와 실제0건이 같은 메시지입니다.", likelyCause: "null/error를 empty operator 하나로 처리했습니다.", checks: ["controller outcome을 봅니다.", "status/log를 확인합니다.", "view branches를 봅니다."], fix: "empty와 failed를 typed states로 분리합니다.", prevention: "empty/failure integration fixtures를 각각 둡니다." },
      { symptom: "책 제목에 넣은 HTML이 table에서 실행됩니다.", likelyCause: "raw `${book.bookName}`를 cell에 직접 출력했습니다.", checks: ["cell sinks를 inventory합니다.", "DB/input provenance를 추적합니다.", "c:out 사용을 봅니다."], fix: "모든 text cells에 c:out/approved encoder를 적용합니다.", prevention: "stored XSS fixture와 CSP를 둡니다." },
    ],
  },
  {
    id: "curl-context-query-encoding",
    title: "c:url·c:param으로 context와 query component encoding을 중앙화합니다",
    lead: "스크립틀릿 문자열 연결을 없애고 root/non-root deployment와 특수문자 parameter를 tag contract로 처리합니다.",
    explanations: [
      "c:url의 context-relative value는 current web application context path를 포함한 URL을 만들 수 있어 `/study` 배포에서도 route가 유지됩니다.",
      "c:param은 query parameter name/value를 URL에 추가하고 필요한 encoding을 수행합니다. raw `?cmd=` 문자열 연결과 double encoding을 피합니다.",
      "value가 절대 URL인지 context-relative인지, context attribute를 별도로 쓰는지 target tagdocs를 확인합니다. external URL에는 allowlist와 open redirect/SSRF 경계가 필요합니다.",
      "생성된 URL을 href attribute에 출력할 때 tag output/HTML escaping 계약도 확인합니다. URL encoding과 HTML encoding은 별개입니다.",
      "예제는 c:url 정신 모델을 context normalize→route→UTF-8 query encode→HTML attribute encode 순서로 exact 보여 줍니다.",
    ],
    concepts: [
      { term: "c:url", definition: "context-aware URL을 생성하고 optional c:param children으로 query parameters를 추가하는 core tag입니다.", detail: ["문자열 연결을 줄입니다.", "redirect tag와도 결합됩니다."] },
      { term: "query parameter encoding", definition: "parameter value가 &, =, space, non-ASCII를 URL 구조가 아닌 data로 유지하도록 component encode하는 과정입니다.", detail: ["UTF-8을 사용합니다.", "HTML encoding과 다릅니다."] },
    ],
    codeExamples: [{
      id: "java-curl-mental-model",
      title: "c:url+c:param의 context/query/HTML 출력 단계를 exact 모델링합니다",
      language: "java",
      filename: "CoreUrlModel.java",
      purpose: "실제 tag handler와 구분된 JDK-only model로 root/non-root URL contract를 검증합니다.",
      code: String.raw`import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public class CoreUrlModel {
    static String build(String context, String path, Map<String, String> parameters) {
        if (!(context.isEmpty() || context.matches("/[A-Za-z0-9._-]+"))) throw new IllegalArgumentException("context");
        if (!path.startsWith("/") || path.contains("..")) throw new IllegalArgumentException("path");
        StringBuilder url = new StringBuilder(context).append(path);
        String separator = "?";
        for (Map.Entry<String, String> entry : parameters.entrySet()) {
            url.append(separator).append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8))
                    .append('=').append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            separator = "&";
        }
        return url.toString();
    }

    static String htmlAttribute(String value) { return value.replace("&", "&amp;").replace("\"", "&quot;"); }

    public static void main(String[] args) {
        Map<String, String> query = new LinkedHashMap<>();
        query.put("cmd", "list");
        query.put("q", "JSP & Tags");
        String url = build("/study", "/books", query);
        System.out.println("url=" + url);
        System.out.println("href=" + htmlAttribute(url));
    }
}`,
      walkthrough: [
        { lines: "1-17", explanation: "context/path를 검증하고 ordered query entries를 UTF-8 component encode합니다." },
        { lines: "19-19", explanation: "완성 URL의 HTML attribute ampersand를 encode합니다." },
        { lines: "21-28", explanation: "non-root route와 special query의 URL/href를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "c:url mental model"], command: isolatedJavaRun("CoreUrlModel.java", "CoreUrlModel") },
      output: { value: "url=/study/books?cmd=list&q=JSP+%26+Tags\nhref=/study/books?cmd=list&amp;q=JSP+%26+Tags", explanation: ["context path가 한 번 포함됩니다.", "query data &는 %26이고 HTML separator &는 &amp;입니다."] },
      experiments: [
        { change: "context를 empty로 바꿉니다.", prediction: "url이 /books로 시작합니다.", result: "root deployment를 지원합니다." },
        { change: "이미 %26인 value를 다시 encode합니다.", prediction: "%2526 double encoding이 생깁니다.", result: "model에는 raw query value를 둡니다." },
        { change: "path에 ../admin을 넣습니다.", prediction: "path failure가 납니다.", result: "server-owned route allowlist를 유지합니다." },
      ],
      sourceRefs: ["source-jsp04-list", "source-jsp04-one", "jakarta-tags-url", "whatwg-url", "whatwg-html"],
    }],
    diagnostics: [
      { symptom: "non-root 배포에서 목록 링크가404입니다.", likelyCause: "request.getContextPath scriptlet을 빠뜨렸거나 host-root URL을 hard-code했습니다.", checks: ["rendered href를 봅니다.", "context path를 확인합니다.", "c:url value를 봅니다."], fix: "c:url/framework helper로 application route를 생성합니다.", prevention: "root/non-root integration test를 둡니다." },
      { symptom: "query가 %2526처럼 double encoded됩니다.", likelyCause: "controller에서 이미 encode한 값을 c:param이 다시 encode했습니다.", checks: ["model raw value를 봅니다.", "encoding stages를 추적합니다.", "decoded server parameter를 확인합니다."], fix: "raw semantic value를 c:param에 넘기고 한 URL builder만 사용합니다.", prevention: "special-character round-trip tests를 둡니다." },
    ],
  },
  {
    id: "number-format-parse-locale-rounding",
    title: "숫자 format과 parse를 locale·type·rounding·strictness 계약으로 다룹니다",
    lead: "보이는 comma와 currency symbol만 맞추는 것이 아니라 입력과 domain numeric meaning을 보존합니다.",
    explanations: [
      "fmt:formatNumber는 Number를 number/currency/percent 또는 pattern으로 text화합니다. 입력 model은 String보다 BigDecimal/long 등 typed Number여야 합니다.",
      "locale가 바뀌면 decimal/group separator, currency symbol, percent spacing과 digits가 바뀔 수 있습니다. user/request policy로 locale를 명시합니다.",
      "pattern의 #은 optional digit, 0은 required digit 의미가 있고 rounding이 발생합니다. 금액 업무 rounding과 display rounding을 구분합니다.",
      "fmt:parseNumber는 locale text를 Number로 바꾸지만 parser가 numeric prefix만 읽고 trailing garbage를 남길 수 있습니다. validation에서는 전체 문자열 consumed 여부가 필요합니다.",
      "percent format은0.12→12%처럼 scale 의미를 바꿉니다. source value가12인지0.12인지 domain contract를 명확히 합니다.",
    ],
    concepts: [
      { term: "locale-sensitive format", definition: "locale의 숫자 기호·currency·grouping 규칙으로 Number를 text representation으로 바꾸는 과정입니다.", detail: ["locale를 명시합니다.", "domain value는 유지합니다."] },
      { term: "partial parse", definition: "입력 앞부분 숫자만 성공적으로 읽고 뒤의 invalid text를 소비하지 않은 parse 결과입니다.", detail: ["validation 실패로 처리합니다.", "ParsePosition을 확인할 수 있습니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "서버마다 currency symbol/decimal이 다릅니다.", likelyCause: "default Locale에 의존했습니다.", checks: ["Locale.getDefault를 기록합니다.", "fmt locale config를 봅니다.", "user locale policy를 확인합니다."], fix: "request/user locale를 explicit하게 설정합니다.", prevention: "ko-KR/en-US formatting golden tests를 둡니다." },
      { symptom: "123abc 입력이123으로 통과합니다.", likelyCause: "partial parse 뒤 consumed length를 확인하지 않았습니다.", checks: ["ParsePosition index/errorIndex를 봅니다.", "trim policy를 확인합니다.", "fmt parse behavior를 real container에서 test합니다."], fix: "controller에서 strict full-input parse·range validation을 수행합니다.", prevention: "trailing garbage·locale separator negative tests를 둡니다." },
    ],
  },
  {
    id: "date-time-locale-zone-determinism",
    title: "날짜/시간 formatting 입력을 fixed instant·explicit locale·zone으로 고정합니다",
    lead: "현재 시각과 default zone을 JSP에서 만들지 않고 controller가 의미 있는 instant와 display policy를 제공합니다.",
    explanations: [
      "원본 LocalDateTime.now는 zone 없는 local wall time이고 ZoneId.systemDefault로 Instant를 만들면 host zone에 따라 절대 시각 의미가 달라집니다.",
      "controller는 Clock/Instant를 소유하고 업무 ZoneId를 명시해 view에 Date/temporal model을 제공합니다. JSP는 now를 직접 호출하지 않습니다.",
      "fmt:formatDate의 dateStyle/timeStyle/type/pattern은 locale text를 만들고 timeZone config가 같은 Instant의 wall time을 바꿉니다.",
      "same instant를 Asia/Seoul과 UTC에서 표시하면 시간이 다르지만 사건 자체는 같습니다. storage instant와 display zone을 분리합니다.",
      "예제는 fixed Instant, Locale.KOREA symbols, explicit KRW code, Asia/Seoul zone과 literal pattern으로 exact output을 보장합니다.",
    ],
    concepts: [
      { term: "instant vs local time", definition: "Instant는 UTC timeline의 한 점이고 LocalDateTime은 zone/offset 없는 달력 시각입니다.", detail: ["변환에 ZoneId가 필요합니다.", "storage와 display를 구분합니다."] },
      { term: "format context", definition: "locale·time zone·pattern·rounding을 묶어 동일 value의 표시 방법을 결정하는 정책입니다.", detail: ["default를 피합니다.", "request/user preference에 연결합니다."] },
    ],
    codeExamples: [{
      id: "java-format-tags-deterministic-model",
      title: "명시 Locale·ZoneId·fixed Instant로 number/date output을 고정합니다",
      language: "java",
      filename: "FormatTagsModel.java",
      purpose: "default locale/zone/current-time 없이 fmt tag에 전달할 policy와 exact representation을 학습합니다.",
      code: String.raw`import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Currency;
import java.util.Locale;

public class FormatTagsModel {
    public static void main(String[] args) {
        Locale locale = Locale.KOREA;
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(locale);
        DecimalFormat number = new DecimalFormat("#,##0.00", symbols);
        DecimalFormat percent = new DecimalFormat("0.0%", symbols);
        String currency = Currency.getInstance("KRW").getCurrencyCode();
        Instant instant = Instant.parse("2026-03-05T03:34:00Z");
        ZoneId zone = ZoneId.of("Asia/Seoul");
        DateTimeFormatter date = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm", locale).withZone(zone);
        System.out.println("number=" + number.format(12345.678));
        System.out.println("currency=" + currency + " " + number.format(12345.678));
        System.out.println("percent=" + percent.format(0.125));
        System.out.println("date=" + date.format(instant) + "|zone=" + zone.getId());
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "Locale·number/date/time APIs를 explicit imports로 준비합니다." },
        { lines: "10-18", explanation: "Korean symbols, fixed patterns, KRW code, fixed Instant와 Seoul zone을 구성합니다." },
        { lines: "19-22", explanation: "rounded number/currency/percent/date를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "explicit Locale.KOREA and Asia/Seoul"], command: isolatedJavaRun("FormatTagsModel.java", "FormatTagsModel") },
      output: { value: "number=12,345.68\ncurrency=KRW 12,345.68\npercent=12.5%\ndate=2026-03-05 12:34|zone=Asia/Seoul", explanation: ["rounding과 separators가 explicit pattern/symbols로 고정됩니다.", "fixed UTC instant가 Seoul12:34로 표시됩니다."] },
      experiments: [
        { change: "zone을 UTC로 바꿉니다.", prediction: "date=2026-03-05 03:34가 됩니다.", result: "same instant의 display zone 차이입니다." },
        { change: "percent input을12로 바꿉니다.", prediction: "1200.0%가 됩니다.", result: "domain ratio scale을 명시합니다." },
        { change: "Locale.getDefault와 ZoneId.systemDefault를 사용합니다.", prediction: "host별 separators/date가 달라질 수 있습니다.", result: "format context를 request policy로 고정합니다." },
      ],
      sourceRefs: ["source-jsp04-format", "jakarta-tags-format-number", "jakarta-tags-format-date", "java-decimal-format", "java-date-time-formatter", "java-instant", "java-zone-id", "jakarta-tags-spec", "jakarta-tags-fmt"],
    }],
    diagnostics: [
      { symptom: "같은 record 시간이 서버마다 다릅니다.", likelyCause: "LocalDateTime.now와 systemDefault zone에 의존했습니다.", checks: ["stored type을 봅니다.", "default zone을 기록합니다.", "fmt timeZone config를 확인합니다."], fix: "Instant/offset을 저장하고 explicit display ZoneId로 format합니다.", prevention: "UTC/Asia-Seoul matrix와 fixed Clock tests를 둡니다." },
      { symptom: "날짜 golden test가 언어/OS update 뒤 실패합니다.", likelyCause: "localized full/long style와 locale data version에 의존했습니다.", checks: ["Locale/provider/JDK version을 봅니다.", "pattern vs style을 확인합니다.", "product requirement를 봅니다."], fix: "API contract용 형식은 explicit pattern, user-facing은 locale-aware assertion으로 분리합니다.", prevention: "semantic date fields와 snapshot text test를 구분합니다." },
    ],
    expertNotes: ["formatting은 view 책임이지만 value의 type·scale·instant와 locale/zone 선택 owner는 controller/domain 정책입니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...maintainedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "source-jsp04-core", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex02_JSTL.jsp", usedFor: ["core tags", "Book list scriptlet", "legacy URIs", "forTokens", "privacy"], evidence: "inventory direct core demo를 read-only audit했습니다." },
  { id: "source-jsp04-format", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex03_JSTL.jsp", usedFor: ["number/date tags", "partial parse", "time/zone nondeterminism", "legacy URIs"], evidence: "format demo의 active tags와 nondeterminism을 확인했습니다." },
  { id: "source-jsp04-list", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex05_db_output.jsp", usedFor: ["list empty state", "forEach", "raw cells", "context URL"], evidence: "DB list view를 database 실행 없이 감사했습니다." },
  { id: "source-jsp04-one", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex06_db_output.jsp", usedFor: ["single empty state", "raw cells", "context URL"], evidence: "DB single view를 database 실행 없이 감사했습니다." },
  { id: "source-jsp04-bookvo", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/vo/BookVO.java", usedFor: ["bean getters", "mutable String fields", "constructor closure"], evidence: "ex02 import/property semantic closure를 읽었습니다." },
  { id: "jakarta-tags-spec", repository: "Jakarta EE", path: "Jakarta Standard Tag Library 3.0 Specification", publicUrl: "https://jakarta.ee/specifications/tags/3.0/jakarta-tags-spec-3.0", usedFor: ["tag libraries", "scoped variables", "core", "formatting"], evidence: "Jakarta Tags primary specification입니다." },
  { id: "jakarta-tags-core", repository: "Jakarta EE", path: "Jakarta Tags 3.0 core TLD", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/c/tld-summary", usedFor: ["modern core URI", "core tag inventory"], evidence: "`jakarta.tags.core` primary tagdocs입니다." },
  { id: "jakarta-tags-fmt", repository: "Jakarta EE", path: "Jakarta Tags 3.0 fmt TLD", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/fmt/tld-summary", usedFor: ["modern fmt URI", "format tag inventory"], evidence: "`jakarta.tags.fmt` primary tagdocs입니다." },
  { id: "jakarta-tags-out", repository: "Jakarta EE", path: "c:out tag", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/c/out", usedFor: ["escaped text output", "default"], evidence: "c:out primary tagdocs입니다." },
  { id: "jakarta-tags-foreach", repository: "Jakarta EE", path: "c:forEach tag", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/c/foreach", usedFor: ["items", "range", "varStatus"], evidence: "c:forEach primary tagdocs입니다." },
  { id: "jakarta-tags-url", repository: "Jakarta EE", path: "c:url tag", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/c/url", usedFor: ["context-aware URL"], evidence: "c:url primary tagdocs입니다." },
  { id: "jakarta-tags-format-number", repository: "Jakarta EE", path: "fmt:formatNumber tag", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/fmt/formatnumber", usedFor: ["number/currency/percent formatting"], evidence: "number format primary tagdocs입니다." },
  { id: "jakarta-tags-format-date", repository: "Jakarta EE", path: "fmt:formatDate tag", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/fmt/formatdate", usedFor: ["date/time format", "time zone"], evidence: "date format primary tagdocs입니다." },
  { id: "java-decimal-format", repository: "Java SE 21", path: "DecimalFormat", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/text/DecimalFormat.html", usedFor: ["deterministic number format", "pattern semantics"], evidence: "JDK number format primary API입니다." },
  { id: "java-date-time-formatter", repository: "Java SE 21", path: "DateTimeFormatter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/format/DateTimeFormatter.html", usedFor: ["deterministic temporal format"], evidence: "JDK date format primary API입니다." },
  { id: "java-instant", repository: "Java SE 21", path: "Instant", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html", usedFor: ["absolute timestamp"], evidence: "timeline point primary API입니다." },
  { id: "java-zone-id", repository: "Java SE 21", path: "ZoneId", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZoneId.html", usedFor: ["display time zone"], evidence: "time-zone rules primary API입니다." },
  { id: "whatwg-url", repository: "WHATWG", path: "URL Standard", publicUrl: "https://url.spec.whatwg.org/", usedFor: ["URL component parsing"], evidence: "URL primary standard입니다." },
  { id: "whatwg-html", repository: "WHATWG", path: "HTML syntax", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html", usedFor: ["table/attribute/text contexts"], evidence: "HTML parser primary standard입니다." },
  { id: "owasp-xss", repository: "OWASP", path: "XSS Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["raw table cell migration", "contextual encoding"], evidence: "output security 실무 기준입니다." },
);

const reviewPairs: Array<[string, string]> = [
  ["JSTL과 Jakarta Tags는 어떤 관계인가요?", "표준 tag library가 Jakarta namespace 세대로 발전했으며 target stack의 spec/URI/dependencies를 맞춰야 합니다."],
  ["prefix c가 library identity인가요?", "아닙니다. prefix는 page-local alias이고 URI가 library를 식별합니다."],
  ["legacy core URI는 무엇을 의미하나요?", "원본 source-era JSTL library identifier이며 현대 Jakarta stack에는 target compatibility를 확인해 migration합니다."],
  ["Jakarta Tags 3.0 core URI는?", "jakarta.tags.core입니다."],
  ["Jakarta Tags 3.0 fmt URI는?", "jakarta.tags.fmt입니다."],
  ["API dependency만 있으면 tag가 실행되나요?", "항상 그렇지 않습니다. implementation/TLD/container 지원과 packaging scope가 함께 맞아야 합니다."],
  ["c:set default scope는?", "page scope입니다."],
  ["c:set으로 업무 계산을 길게 해도 되나요?", "아닙니다. controller가 typed model을 만들고 c:set은 짧은 presentation alias에 제한합니다."],
  ["c:out value=\"msg\"는 무엇을 출력하나요?", "literal 문자열 msg입니다."],
  ["c:out value=\"${msg}\"는 무엇을 출력하나요?", "EL로 resolved된 msg value를 출력합니다."],
  ["c:out escaping은 모든 context에 충분한가요?", "아닙니다. HTML/XML text에 유용하지만 URL/JS/CSS 등은 전용 처리와 위험 context 회피가 필요합니다."],
  ["c:remove에서 scope를 왜 명시하나요?", "같은 key의 다른 scope를 의도치 않게 남기거나 제거하지 않도록 owner를 분명히 합니다."],
  ["c:if에는 else가 있나요?", "없습니다. else/else-if처럼 하나만 선택하려면 c:choose를 사용합니다."],
  ["여러 c:if 조건이 모두 true면?", "각 body가 독립적으로 모두 실행될 수 있습니다."],
  ["c:choose는 여러 when을 모두 실행하나요?", "아닙니다. source 순서에서 첫 true branch만 실행합니다."],
  ["threshold choose 순서가 왜 중요한가요?", "낮은 기준이 먼저면 높은 점수도 그 branch에서 멈추기 때문입니다."],
  ["c:forEach empty items에서는?", "body가0회 실행되므로 별도 empty state가 필요합니다."],
  ["varStatus.count는 몇부터인가요?", "1부터 시작하는 반복 횟수입니다."],
  ["varStatus.index와 count는 항상 같은가요?", "아닙니다. index는 source/range 위치이고 count는1-based 횟수입니다."],
  ["range end는 어떻게 다루나요?", "target tag semantics에서 inclusive end를 확인하고 boundary/step tests를 둡니다."],
  ["forEach에서 sort/filter 업무를 해도 되나요?", "controller가 ordered list를 만들고 view는 pure iteration만 하는 편이 좋습니다."],
  ["forTokens delims=\"/,\"는 문자열 '/,' 하나인가요?", "아닙니다. 일반적으로 slash와 comma 각 delimiter character로 동작합니다."],
  ["forTokens로 CSV를 parse해도 되나요?", "안 됩니다. quoting/escaping/newline을 이해하는 CSV parser가 필요합니다."],
  ["목록 empty와 DB failure는 같은가요?", "아닙니다. success-empty와 failed view state로 구분합니다."],
  ["단건 null은 모두 not-found인가요?", "아닙니다. forbidden/failure/contract bug를 producer outcome에서 구분합니다."],
  ["empty table markup은 어떻게 만드나요?", "tbody 안에 정확한 colspan을 가진 tr/td와 설명 text를 둡니다."],
  ["raw ${book.title}은 XSS-safe인가요?", "아닙니다. DB/user provenance면 c:out/approved encoder가 필요합니다."],
  ["BookVO getter가 EL property와 어떤 관계인가요?", "bookName 같은 property는 getBookName readable getter를 통해 해결됩니다."],
  ["BookVO price/stock String의 문제는?", "numeric validation·sorting·formatting 의미가 약해 typed BigDecimal/int view/domain field가 낫습니다."],
  ["c:url은 무엇을 해결하나요?", "context-aware route와 c:param query encoding을 중앙화합니다."],
  ["c:param에 이미 encoded value를 넘겨도 되나요?", "double encoding이 생길 수 있으므로 raw semantic value를 넘깁니다."],
  ["URL encoding과 HTML escaping은 같은가요?", "아닙니다. URL component와 HTML parser context를 각각 처리합니다."],
  ["fmt:formatNumber input은 String이어야 하나요?", "typed Number가 더 안전하며 String coercion에 기대지 않습니다."],
  ["locale가 number output에 어떤 영향을 주나요?", "decimal/group separators, currency symbol, percent 표시 등이 달라집니다."],
  ["percent value0.12는 어떻게 보이나요?", "percent formatter에서12% 의미가 되므로 domain scale을 명시합니다."],
  ["parseNumber가 trailing text를 모두 거부하나요?", "부분 parse 가능성을 확인하고 validation에서는 전체 소비를 검증합니다."],
  ["LocalDateTime.now가 exact test에 왜 나쁜가요?", "실행 순간과 zone 없는 wall time에 의존합니다."],
  ["같은 Instant를 Seoul/UTC로 표시하면?", "서로 다른 wall time이지만 같은 사건입니다."],
  ["fmt time zone은 누가 정하나요?", "사용자/request/product policy가 explicit하게 정하고 default host zone에 맡기지 않습니다."],
  ["JDK formatting fixture가 실제 tag runtime을 증명하나요?", "아닙니다. 정책 mental model이며 실제 Jakarta Tags container integration이 별도로 필요합니다."],
];
(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(...reviewPairs.map(([question, answer]) => ({ question, answer })));

(session.completionChecklist as string[]).push(
  "direct JSP4를 모두 읽었다.", "BookVO closure1을 읽었다.", "원본5 hashes를 확인했다.", "템플릿 사용자 값4를 출력하지 않았다.", "sample 사람/출판 값을 출력하지 않았다.",
  "container와 DB를 audit에서 실행하지 않았다.", "page directives10을 확인했다.", "taglib directives6을 확인했다.", "expressions2를 확인했다.", "scriptlets2를 확인했다.",
  "EL86을 확인했다.", "c:out8을 확인했다.", "c:if5를 확인했다.", "choose3/when5/otherwise3을 확인했다.", "forEach6을 확인했다.",
  "forTokens3을 확인했다.", "fmt number24를 확인했다.", "fmt date12를 확인했다.", "old core URI4를 확인했다.", "old fmt URI2를 확인했다.",
  "context scriptlet2를 확인했다.", "clockNow/defaultZone을 확인했다.", "raw table cells10을 확인했다.", "BookVO getters5를 확인했다.", "target stack compatibility matrix를 만들었다.",
  "jakarta.tags.core URI를 안다.", "jakarta.tags.fmt URI를 안다.", "API와 implementation을 구분한다.", "minimal tag translation smoke test를 둔다.", "c:set default page scope를 안다.",
  "view session/application writes를 제한한다.", "literal과 EL value를 구분한다.", "c:out default escaping을 사용한다.", "escapeXml=false를 제한한다.", "c:remove owner scope를 명시한다.",
  "c:if 독립 조건을 안다.", "c:choose first-match를 안다.", "threshold order를 test한다.", "업무 결정을 controller에 둔다.", "forEach empty0회를 안다.",
  "varStatus count/index를 구분한다.", "first/last를 test한다.", "begin/end/step boundaries를 test한다.", "forTokens를 CSV parser로 쓰지 않는다.", "structured parse를 controller에서 한다.",
  "empty/ready/failed states를 구분한다.", "단건 found/not-found/forbidden/failed를 구분한다.", "valid colspan empty row를 만든다.", "모든 table cells를 escape한다.", "Book numeric fields를 typed model로 바꾼다.",
  "c:url로 context route를 만든다.", "c:param에 raw value를 넘긴다.", "URL과 HTML encoding을 구분한다.", "root/non-root URL을 test한다.", "number locale를 명시한다.",
  "format rounding을 명시한다.", "strict full-input number parse를 한다.", "percent scale을 명시한다.", "Instant와 LocalDateTime을 구분한다.", "display ZoneId를 명시한다.",
  "current time을 Clock에서 주입한다.", "locale/zone matrix를 test한다.", "모든 Java examples warning0을 검증한다.", "모든 exact outputs를 검증한다.", "actual Jakarta Tags integration 범위를 문서화했다."
);
