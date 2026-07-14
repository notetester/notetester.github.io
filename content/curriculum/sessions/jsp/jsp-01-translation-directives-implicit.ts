import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

const noCode = [] as DetailedSession["chapters"][number]["codeExamples"];

const session = {
  schemaVersion: 2,
  inventoryIds: ["jsp-01-translation-directives-implicit"],
  slug: "jsp-01-translation-directives-implicit",
  courseId: "servlet-jsp",
  moduleId: "jsp-el-jstl-view",
  order: 6,
  title: "JSP 변환·지시어·내장 객체와 스크립팅 경계",
  subtitle: "JSP가 Servlet로 번역되는 위치를 추적하고, include 시점·공유 필드 race·시간과 난수·출력 escaping을 재현 가능한 예제로 교정합니다.",
  level: "기초",
  estimatedMinutes: 780,
  coreQuestion: "HTML처럼 보이는 JSP가 언제 어떤 Servlet 코드로 바뀌며, 요청별 데이터와 공유 상태를 섞지 않고 안전한 응답을 만들려면 무엇을 뷰에서 제거해야 할까요?",
  summary: "원본 JSP3개와 정적 include 대상 HTML1개를 read-only로 감사합니다. 활성 코드에는 page 지시어4, 정적 include1, 동적 jsp:include1, 선언부1, 표현식9, 스크립틀릿13이 있습니다. 템플릿 도구가 남긴 로컬 사용자 정보 주석3개는 값 없이 존재만 보고합니다. ex03은 LocalDate.now1·Math.random1 때문에 결과가 달라지고, 선언부의 mutable result 필드는 변환된 Servlet 인스턴스의 공유 필드가 되어 동시 요청 race를 만듭니다. out.println과 표현식은 신뢰하지 않는 값에 사용하면 XSS가 됩니다. 이 세션은 container를 실행하지 않고 번역 위치, include phase, deterministic race, fixed Clock·주입 난수·HTML text escaping을 JDK21 warning0·exact output으로 검증합니다.",
  objectives: [
    "JSP translation unit과 생성 Servlet의 instance member·service body·writer output 위치를 연결한다.",
    "page 지시어의 contentType·pageEncoding·session·buffer·errorPage 계약을 구분한다.",
    "include directive의 translation-time text merge와 jsp:include의 request-time dispatch를 구분한다.",
    "request·response·out·pageContext·session·application·config·page·exception 내장 객체의 수명과 소유자를 설명한다.",
    "선언부 mutable field가 동시 요청에서 공유된다는 사실을 deterministic race로 재현한다.",
    "스크립틀릿 지역 변수와 선언부 필드, 표현식 writer 호출의 번역 위치를 예측한다.",
    "현재 시간과 난수를 Clock·입력 supplier로 주입해 exact test를 만든다.",
    "JSP 주석과 HTML 주석, raw HTML 출력과 context-aware encoding을 구분한다.",
  ],
  prerequisites: [
    { title: "Servlet 수명주기와 응답", reason: "JSP는 결국 container가 관리하는 Servlet로 번역되므로 instance 공유와 response commit을 먼저 알아야 합니다.", sessionSlug: "servlet-01-mapping-lifecycle-response" },
    { title: "HTML 문서와 text context", reason: "JSP가 생성하는 최종 산출물은 HTML bytes이며 escaping은 browser parser context에 맞춰야 합니다.", sessionSlug: "html-01-document-anatomy-dom-tree" },
  ],
  keywords: ["JSP", "translation", "generated servlet", "page directive", "include directive", "jsp:include", "declaration", "scriptlet", "expression", "implicit objects", "pageContext", "JspWriter", "buffer", "shared field", "race condition", "Clock", "nondeterminism", "XSS", "output encoding"],
  chapters: [],
  lab: {
    title: "스크립틀릿 JSP를 deterministic MVC view로 해체하기",
    scenario: "시간·운세·산술·공통 fragment가 한 JSP에 섞인 원본을 분석하고, controller model과 안전한 view 계약으로 단계적으로 분리합니다.",
    setup: ["원본4는 read-only로 두고 별도 maintained fixture를 만듭니다.", "동일 Servlet instance에 두 요청이 겹치는 latch fixture와 fixed Clock·fixed luck 입력을 준비합니다.", "HTML text·attribute·URL·JavaScript context를 구분한 출력 표를 준비합니다."],
    steps: ["JSP token을 template text·directive·declaration·scriptlet·expression·action으로 분류합니다.", "각 token이 translation unit member, service body, writer call, request-time dispatch 중 어디로 가는지 표시합니다.", "정적 include와 동적 include의 build/request event trace를 비교합니다.", "declaration result field를 두 요청이 동시에 갱신해 lost update가 나는 것을 latch로 재현합니다.", "request별 계산을 local immutable model로 옮겨 합계가 보존되는지 확인합니다.", "LocalDate.now와 Math.random을 fixed Clock과 IntSupplier 입력으로 바꿉니다.", "raw out.println/표현식을 HTML text encoder 또는 c:out 경계로 교체합니다.", "pageEncoding·Content-Type·charset을 UTF-8로 일치시킵니다.", "root와 non-root context, include 실패, buffer commit, malicious text를 회귀 테스트합니다.", "원본 audit와 maintained warning0 outputs를 분리해 문서화합니다."],
    expectedResult: ["JSP의 모든 scripting element가 생성 Servlet의 정확한 위치와 연결됩니다.", "두 동시 요청이 공유 field 없이 각각 독립 결과를 냅니다.", "날짜·난수 예제가 어느 환경에서도 같은 exact output을 냅니다.", "악성 문자열이 markup으로 실행되지 않고 text로 표시됩니다."],
    cleanup: ["worker threads를 join하고 executor를 종료합니다.", "직접 소유한 temp만 삭제합니다.", "원본 hashes와 read-only 상태가 유지되는지 확인합니다."],
    extensions: ["실제 Jakarta Server Pages 4.0 container에서 generated Java를 찾아 이 mental model과 대조합니다.", "JSP property group으로 scripting-invalid를 켜 scriptlet 회귀를 차단합니다.", "tag file과 JSP fragment의 translation boundary를 추가합니다.", "CSP와 template auto-escaping을 포함한 출력 정책 ADR을 작성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "작은 JSP의 template·declaration·scriptlet·expression을 색으로 구분하고 생성 Servlet 의사 코드로 옮기세요.", requirements: ["declaration은 instance member에 둡니다.", "scriptlet은 service body에 둡니다.", "expression은 writer 호출로 바꿉니다.", "implicit objects의 parameter 위치를 표시합니다.", "warning0 JDK model과 exact output을 제공합니다."], hints: ["실제 container 생성 파일 경로는 구현마다 다릅니다.", "문자열 연결보다 token 순서를 먼저 보세요."], expectedOutcome: "JSP 한 줄이 Servlet의 어느 위치가 되는지 설명 가능한 translation map이 완성됩니다.", solutionOutline: ["tokenize→classify→emit 의사 코드 순서로 작성합니다.", "translation fact와 container 구현 세부를 구분합니다."] },
    { difficulty: "응용", prompt: "선언부 counter race와 시간·난수 비결정성을 제거하세요.", requirements: ["CountDownLatch로 lost update를 재현합니다.", "request state는 local immutable value로 이동합니다.", "Clock을 고정합니다.", "난수 결과를 supplier로 주입합니다.", "악성 label을 HTML text로 escape합니다.", "broken/fixed exact output을 함께 남깁니다."], hints: ["volatile은 compound update와 request ownership을 해결하지 않습니다.", "테스트에서는 seed보다 의도한 값을 직접 주입하는 편이 명확할 수 있습니다."], expectedOutcome: "동시성과 시간에 독립적인 view-model fixture가 완성됩니다.", solutionOutline: ["shared field read를 barrier 앞에 고정합니다.", "controller가 model을 완성하고 JSP는 읽기만 하게 만듭니다."] },
    { difficulty: "설계", prompt: "조직의 JSP view coding standard와 migration runbook을 작성하세요.", requirements: ["scriptlet/declaration 금지 정책을 둡니다.", "pageEncoding·Content-Type 기준을 둡니다.", "정적/동적 include 선택표를 둡니다.", "scope별 mutable data 제한을 둡니다.", "출력 context별 encoder 표를 둡니다.", "generated source·container integration acceptance를 정의합니다."], hints: ["JSP는 배포 기술 선택과 별개로 view boundary 원칙을 가르칠 수 있습니다.", "자동 검사는 금지 token과 escaping sink를 함께 봐야 합니다."], expectedOutcome: "레거시 학습 코드를 안전한 MVC view로 진화시키는 실행 가능한 표준이 완성됩니다.", solutionOutline: ["inventory→risk→target rule→automated gate→migration order로 구성합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["jsp-02-actions-context-path"],
  sources: [],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "inventory direct3와 정적 include 대상 result.html1을 transparent closure로 모두 읽고 사용했습니다.",
      "원본의 템플릿 사용자 주석 값과 지역 문자열은 공개하지 않고 templateUser count와 구조적 위험만 기록합니다.",
      "JSP compiler/container는 실행하지 않았으므로 실제 generated source 경로·container별 buffering은 integration 범위로 명시합니다.",
      "원본 LocalDate.now·Math.random·선언부 mutable result·raw output을 숨기지 않고 deterministic maintained examples로 교정합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAudit: DetailedSession["chapters"][number] = {
  id: "original-jsp01-direct3-closure4-audit",
  title: "원본 direct3·closure4를 실행 없이 hash·active syntax·privacy로 감사합니다",
  lead: "JSP container를 시작하지 않고 byte-identical owned copy만 만들며, 로컬 사용자 주석은 값이 아니라 개수만 검증합니다.",
  explanations: [
    "inventory direct는 ex01_jsp.jsp, ex02_directive.jsp, ex03_InnerObject.jsp 세 파일이고 ex02의 translation-time 대상 result.html 한 파일을 closure에 포함합니다.",
    "JSP 주석을 제거한 활성 syntax에는 page directives4, include directive1, jsp:include action1, declaration1, expressions9, scriptlets13이 있습니다.",
    "템플릿 생성 주석의 User 필드는 direct3에 각각 하나씩 있지만 값은 stdout·세션 설명·source excerpt 어디에도 내보내지 않습니다.",
    "ex03은 LocalDate.now1과 Math.random1을 호출해 날짜·운세가 요청 시점마다 달라집니다. exact golden page에는 사용할 수 없습니다.",
    "선언부의 mutable result field1은 generated Servlet instance member가 되고 sub 호출이 이를 갱신합니다. 동시에 처리되는 요청 사이에 값이 섞일 수 있습니다.",
    "활성 out.println calls10과 expressions9는 값을 그대로 writer에 보냅니다. 현재 고정 문자열도 sink의 성격을 가리면 나중에 request/DB 값으로 바뀔 때 XSS가 생깁니다.",
    "정적 include는 result.html text를 translation unit에 합치고 동적 include는 request 시 대상 결과를 포함합니다. 같은 파일을 가리켜도 lifecycle과 failure surface가 다릅니다.",
    "audit은 original을 read-only로 열고 직접 소유한 temp child에 복사한 뒤 SHA-256만 비교합니다. JSP translation, class loading, HTTP listener, network는 모두0입니다.",
  ],
  concepts: [
    { term: "direct/closure provenance", definition: "인벤토리가 직접 지정한 파일과 그 의미를 이해하는 데 필요한 include 대상을 구분해 공개하는 범위입니다.", detail: ["direct3입니다.", "closure4입니다."] },
    { term: "active syntax", definition: "교육용 JSP 주석을 제거한 뒤 실제 translation에 참여하는 요소의 shape입니다.", detail: ["주석 예시를 기능으로 세지 않습니다.", "행동 주장과 정적 count를 구분합니다."] },
    { term: "privacy-preserving audit", definition: "민감할 수 있는 값은 출력하지 않고 존재 여부·count·digest만 검증하는 감사입니다.", detail: ["User 값은 비공개입니다.", "원본은 수정하지 않습니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-jsp01-audit",
    title: "원본4의 hash·활성 JSP shape·비결정성과 공유 필드를 값 노출 없이 검증합니다",
    language: "powershell",
    filename: "verify-original-jsp01.ps1",
    purpose: "원본 실행이나 사용자 값 출력 없이 source provenance와 위험 count를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ('jsp01 audit '+[Guid]::NewGuid().ToString('N'))
$owned=$false;$failure=$null
function Count([string]$text,[string]$pattern){([regex]::Matches($text,$pattern)).Count}
try{
  New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$owned=$true
  $rels=@(
    'src/main/webapp/day02/ex01_jsp.jsp',
    'src/main/webapp/day02/ex02_directive.jsp',
    'src/main/webapp/day02/ex03_InnerObject.jsp',
    'src/main/webapp/day01/result.html'
  )
  $raw='';$hashes=0
  for($i=0;$i-lt$rels.Count;$i++){
    $source=Get-Item -LiteralPath (Join-Path $SourceRoot $rels[$i])
    $copy=Join-Path $root ($i.ToString()+$source.Extension)
    [IO.File]::Copy($source.FullName,$copy)
    if((Get-FileHash $source.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $copy -Algorithm SHA256).Hash){throw 'hash drift'}
    $hashes++;$raw+=[IO.File]::ReadAllText($copy)+[Environment]::NewLine
  }
  $users=Count $raw '(?m)^\s*User\s*:'
  $active=[regex]::Replace($raw,'(?s)<%--.*?--%>','')
  $shape=[ordered]@{
    page=Count $active '<%@\s*page\b';staticInclude=Count $active '<%@\s*include\b'
    dynamicInclude=Count $active '<jsp:include\b';declaration=Count $active '<%!'
    expression=Count $active '<%=';scriptlet=Count $active '<%(?![@!=\-])'
    outPrintln=Count $active 'out\.println\s*\(';clockNow=Count $active 'LocalDate\.now\s*\('
    random=Count $active 'Math\.random\s*\(';sharedResult=Count $active '\bint\s+result\s*=\s*0\s*;'
  }
  $expected=@{page=4;staticInclude=1;dynamicInclude=1;declaration=1;expression=9;scriptlet=13;outPrintln=10;clockNow=1;random=1;sharedResult=1}
  foreach($name in $expected.Keys){if($shape[$name]-ne$expected[$name]){throw ('shape drift: '+$name)}}
  if($hashes-ne4-or$users-ne3){throw 'coverage drift'}
  'files=4,hashes=4,direct=3,closure=4|active=page4,staticInclude1,dynamicInclude1,declaration1,expression9,scriptlet13,outPrintln10|risk=clockNow1,random1,sharedResult1'
  'privacy=templateUser:3,value:not-emitted|container:not-started|network:none|original:read-only|fixture:owned-temp'
}catch{$failure=$_.Exception}finally{
  if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item -LiteralPath $resolved -Recurse -Force}
  if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}
}`,
    walkthrough: [
      { lines: "1-6", explanation: "source root와 direct-child owned temp, count helper를 준비합니다." },
      { lines: "7-23", explanation: "direct3와 include closure1을 복사하고 원본/copy SHA-256을 비교합니다." },
      { lines: "24-34", explanation: "사용자 값은 읽어 출력하지 않고 JSP 주석 밖 active syntax와 위험 token만 셉니다." },
      { lines: "35-40", explanation: "expected shape·privacy marker를 검증하고 direct-child temp만 정리합니다." },
    ],
    run: { environment: ["PowerShell 7+", "jspstudy project root", "JSP container 불필요"], command: "pwsh -NoProfile -File verify-original-jsp01.ps1 -SourceRoot <jspstudy-project-root>" },
    output: { value: "files=4,hashes=4,direct=3,closure=4|active=page4,staticInclude1,dynamicInclude1,declaration1,expression9,scriptlet13,outPrintln10|risk=clockNow1,random1,sharedResult1\nprivacy=templateUser:3,value:not-emitted|container:not-started|network:none|original:read-only|fixture:owned-temp", explanation: ["템플릿 사용자 값은 공개하지 않습니다.", "container·network를 시작하지 않습니다.", "원본 비결정성과 공유 field를 count로 보존합니다."] },
    experiments: [
      { change: "교육용 JSP 주석을 제거하지 않고 include marker를 셉니다.", prediction: "주석 속 syntax 예시까지 섞여 count가 증가합니다.", result: "active syntax 감사에는 JSP 주석 제거가 필요합니다." },
      { change: "result.html을 closure에서 뺍니다.", prediction: "정적 include provenance가 불완전해집니다.", result: "direct와 closure count를 따로 유지합니다." },
      { change: "User 정규식 match 전체를 출력합니다.", prediction: "로컬 사용자 값이 공개 evidence에 노출될 수 있습니다.", result: "count만 출력합니다." },
    ],
    sourceRefs: ["source-jsp01-ex01", "source-jsp01-ex02", "source-jsp01-ex03", "source-jsp01-result"],
  }],
  diagnostics: [
    { symptom: "audit count가 문서와 다릅니다.", likelyCause: "JSP 주석 속 예제 syntax를 활성 코드로 셌거나 source version이 달라졌습니다.", checks: ["hash를 확인합니다.", "JSP comments를 먼저 제거합니다.", "direct와 closure를 구분합니다."], fix: "active syntax pipeline을 고정하고 source drift를 별도 review합니다.", prevention: "hash·count를 함께 CI evidence로 남깁니다." },
    { symptom: "공개 로그에 로컬 계정명이 보입니다.", likelyCause: "템플릿 주석 전체나 regex match value를 출력했습니다.", checks: ["stdout을 검색합니다.", "source excerpt를 확인합니다.", "artifact cache를 확인합니다."], fix: "값을 폐기하고 count/digest만 재생성하며 노출 artifact를 교체합니다.", prevention: "privacy assertion과 secret scan을 publication gate에 둡니다." },
  ],
  expertNotes: ["정적 source audit는 provenance와 위험 shape를 증명하지만 JSP container의 실제 translation·buffer 동작을 대신하지 않습니다."],
};

(session.chapters as DetailedSession["chapters"]).push(originalAudit);

const maintainedChapters: DetailedSession["chapters"] = [
  {
    id: "jsp-translation-unit-servlet-map",
    title: "JSP를 translation unit과 generated Servlet의 두 관점으로 읽습니다",
    lead: "HTML 문서처럼 보이는 source를 template data, class member, request method, writer 호출로 정확히 분해합니다.",
    explanations: [
      "JSP container는 page와 translation-time includes를 하나의 translation unit으로 만들고 Java Servlet source로 변환한 뒤 compile합니다.",
      "template text는 service 계열 method의 JspWriter write 호출이 되고 expression은 계산 결과를 writer에 전달합니다.",
      "declaration은 generated class의 member 선언으로 이동하므로 모든 동시 요청이 같은 instance field를 볼 수 있습니다.",
      "scriptlet은 요청 처리 method 안에 삽입되어 local 변수는 요청 호출별 stack에 놓이지만 외부 shared object를 바꾸면 여전히 race가 납니다.",
      "generated class 이름·저장 경로는 container 구현 세부입니다. 학습의 안정된 계약은 위치·수명·호출 관계입니다.",
    ],
    concepts: [
      { term: "translation unit", definition: "한 JSP와 translation-time include content를 합쳐 변환하는 논리 source 단위입니다.", detail: ["directive include가 참여합니다.", "request-time include는 별도입니다."] },
      { term: "generated Servlet", definition: "container가 JSP에서 생성·compile하고 Servlet lifecycle로 실행하는 Java class입니다.", detail: ["instance가 공유될 수 있습니다.", "service 계열 method가 요청마다 호출됩니다."] },
    ],
    codeExamples: [{
      id: "java-jsp-translation-model",
      title: "JSP 요소를 member·service·writer 위치로 변환합니다",
      language: "java",
      filename: "JspTranslationModel.java",
      purpose: "container 구현 없이 scripting element의 안정된 translation 위치를 exact trace로 학습합니다.",
      code: String.raw`import java.util.List;

public class JspTranslationModel {
    record Token(String kind, String text) {}

    static String target(Token token) {
        return switch (token.kind()) {
            case "declaration" -> "class-member:" + token.text();
            case "scriptlet" -> "service-body:" + token.text();
            case "expression" -> "writer.print:" + token.text();
            case "template" -> "writer.write:" + token.text();
            default -> throw new IllegalArgumentException(token.kind());
        };
    }

    public static void main(String[] args) {
        List<Token> page = List.of(
                new Token("declaration", "add"),
                new Token("scriptlet", "local-sum"),
                new Token("template", "result="),
                new Token("expression", "sum"));
        page.stream().map(JspTranslationModel::target).forEach(System.out::println);
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "JSP 요소를 kind와 민감 값 없는 label로 표현합니다." },
        { lines: "6-14", explanation: "각 요소를 generated class의 안정된 위치에 매핑합니다." },
        { lines: "16-23", explanation: "source 순서대로 변환 trace를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "container-neutral"], command: isolatedJavaRun("JspTranslationModel.java", "JspTranslationModel") },
      output: { value: "class-member:add\nservice-body:local-sum\nwriter.write:result=\nwriter.print:sum", explanation: ["declaration만 class member입니다.", "template과 expression은 서로 다른 writer 의도를 가집니다."] },
      experiments: [
        { change: "local-sum을 declaration으로 바꿉니다.", prediction: "class-member로 이동해 요청 사이에 공유됩니다.", result: "요청 상태는 service local/model에 둡니다." },
        { change: "unknown kind를 추가합니다.", prediction: "typed failure가 납니다.", result: "새 syntax를 조용히 무시하지 않습니다." },
        { change: "template과 expression 순서를 뒤집습니다.", prediction: "응답 text 순서도 바뀝니다.", result: "translation은 source ordering을 보존합니다." },
      ],
      sourceRefs: ["jakarta-pages-spec", "source-jsp01-ex03"],
    }],
    diagnostics: [
      { symptom: "JSP local 변수가 요청 사이에 섞인다고 생각합니다.", likelyCause: "scriptlet local과 declaration field의 번역 위치를 구분하지 않았습니다.", checks: ["delimiter가 <%!인지 <%인지 봅니다.", "generated member/service 위치를 찾습니다.", "referenced object의 공유 여부도 봅니다."], fix: "요청 값은 controller가 만든 immutable model 또는 method local에 둡니다.", prevention: "translation map review를 migration 첫 단계로 둡니다." },
      { symptom: "generated Java 파일을 찾지 못해 원리를 설명하지 못합니다.", likelyCause: "container 임시 경로를 규격 계약으로 오해했습니다.", checks: ["container 문서를 봅니다.", "translation log option을 확인합니다.", "stable semantics와 구현 경로를 나눕니다."], fix: "member/service/writer 관계를 먼저 모델링하고 경로는 integration appendix로 둡니다.", prevention: "container-neutral fixture와 실제 container evidence를 분리합니다." },
    ],
  },
  {
    id: "page-directive-encoding-buffer-error",
    title: "page 지시어를 response metadata와 translation configuration으로 분리합니다",
    lead: "한 줄의 page directive가 문자 해석, 응답 media type, session 사용, buffer와 오류 경계를 어떻게 바꾸는지 따로 봅니다.",
    explanations: [
      "pageEncoding은 JSP source bytes를 translation할 때 읽는 encoding이고 contentType charset은 client가 response bytes를 해석하는 계약입니다. 둘 다 UTF-8로 일치시킵니다.",
      "language=java는 scripting language를 지정하지만 modern view에서 Java scripting을 권장한다는 뜻은 아닙니다.",
      "session=false는 session implicit object를 쓰지 않는 page의 불필요한 session 결합을 줄입니다. true이면 session 수명·cookie 보안까지 고려합니다.",
      "buffer와 autoFlush는 output commit 시점에 영향을 줍니다. 이미 commit된 response에서는 forward·error status·headers 변경이 제한됩니다.",
      "errorPage와 isErrorPage는 내부 예외를 안전한 public view로 매핑해야 하며 stack·path·secret을 HTML body에 직접 출력하면 안 됩니다.",
    ],
    concepts: [
      { term: "pageEncoding", definition: "container가 JSP source를 문자로 decode할 때 사용하는 translation-time encoding입니다.", detail: ["response charset과 역할이 다릅니다.", "source 저장 encoding과 맞아야 합니다."] },
      { term: "response commit", definition: "status와 headers가 전송 대상으로 확정되어 더는 안전하게 바꿀 수 없는 상태입니다.", detail: ["buffer flush가 일으킬 수 있습니다.", "forward/error 전에 관리합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "JSP source의 한글 또는 응답 한글이 깨집니다.", likelyCause: "source encoding, pageEncoding, contentType charset 중 하나가 다릅니다.", checks: ["파일 bytes를 확인합니다.", "page directive를 봅니다.", "response Content-Type을 확인합니다."], fix: "저장·translation·response를 UTF-8로 명시적으로 맞춥니다.", prevention: "non-ASCII integration test와 repository encoding policy를 둡니다." },
      { symptom: "오류 page로 forward할 때 이미 commit됐다는 예외가 납니다.", likelyCause: "큰 body 또는 explicit flush로 buffer가 먼저 commit됐습니다.", checks: ["isCommitted를 기록합니다.", "flush 호출을 찾습니다.", "buffer size와 body 순서를 봅니다."], fix: "validation/dispatch 결정을 body 전에 끝내고 streaming page는 별도 오류 전략을 둡니다.", prevention: "render 전 controller outcome을 확정합니다." },
    ],
  },
  {
    id: "include-translation-request-phases",
    title: "include directive와 jsp:include를 translation/request 두 시간축으로 비교합니다",
    lead: "보이는 결과가 같아도 source merge와 dispatch는 rebuild, 변수 공유, parameters, 실패와 cache 경계가 다릅니다.",
    explanations: [
      "<%@ include file=... %>는 대상 text를 translation unit에 포함하므로 declarations와 directives가 한 compile 단위에 영향을 줍니다.",
      "<jsp:include page=.../>는 현재 request에서 다른 resource를 실행하고 그 response content를 포함합니다. 대상은 독립 translation/lifecycle을 가집니다.",
      "정적 fragment 수정은 포함 page 재번역 탐지가 필요하고 동적 target 수정은 대상 자체 재번역으로 반영됩니다. container dependency tracking을 확인합니다.",
      "동적 include는 jsp:param을 전달할 수 있지만 parent response의 status/header 변경 권한에는 include contract 제약이 있습니다.",
      "정적 header/footer도 중복 declarations·directives를 만들 수 있으므로 component/tag file/template layout이 더 명확한 경우가 많습니다.",
    ],
    concepts: [
      { term: "translation-time include", definition: "대상 source text가 현재 translation unit 일부가 되는 include directive입니다.", detail: ["compile scope를 공유합니다.", "정적 fragment에 적합합니다."] },
      { term: "request-time include", definition: "요청 처리 중 다른 resource의 실행 결과를 현재 response에 합치는 action입니다.", detail: ["parameter 전달이 가능합니다.", "독립 resource lifecycle입니다."] },
    ],
    codeExamples: [{
      id: "java-jsp-include-phase-model",
      title: "정적 text merge와 동적 request dispatch event를 분리합니다",
      language: "java",
      filename: "IncludePhaseModel.java",
      purpose: "container 없이 두 include의 시간축과 변수 공유 차이를 exact trace로 모델링합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;

public class IncludePhaseModel {
    static List<String> translateStatic(String fragmentVersion) {
        return List.of("translate:page", "merge:fragment-" + fragmentVersion, "compile:one-unit");
    }

    static List<String> requestDynamic(String fragmentVersion) {
        List<String> events = new ArrayList<>();
        events.add("request:page");
        events.add("dispatch:fragment-" + fragmentVersion);
        events.add("append:result-only");
        return List.copyOf(events);
    }

    public static void main(String[] args) {
        System.out.println(String.join(" > ", translateStatic("v1")));
        System.out.println(String.join(" > ", requestDynamic("v2")));
        System.out.println("javaScope=static:shared,dynamic:isolated");
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "정적 include가 fragment text를 한 unit에 합치는 events를 만듭니다." },
        { lines: "9-15", explanation: "동적 include가 request-time dispatch와 result append를 만듭니다." },
        { lines: "17-21", explanation: "version과 Java scope 차이를 고정 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "container-neutral"], command: isolatedJavaRun("IncludePhaseModel.java", "IncludePhaseModel") },
      output: { value: "translate:page > merge:fragment-v1 > compile:one-unit\nrequest:page > dispatch:fragment-v2 > append:result-only\njavaScope=static:shared,dynamic:isolated", explanation: ["정적은 translation event입니다.", "동적은 request dispatch event입니다."] },
      experiments: [
        { change: "정적 fragment를 v2로 바꿉니다.", prediction: "translation unit 재compile evidence가 필요합니다.", result: "source dependency tracking을 test합니다." },
        { change: "동적 target이 status를 바꾸려 합니다.", prediction: "include response contract 때문에 효과가 제한됩니다.", result: "body fragment로만 책임을 제한합니다." },
        { change: "동적 include에 request parameter를 추가합니다.", prediction: "대상은 parameter를 읽지만 Java locals는 공유하지 않습니다.", result: "data contract를 explicit하게 둡니다." },
      ],
      sourceRefs: ["jakarta-pages-spec", "source-jsp01-ex02", "source-jsp01-result", "jakarta-request-dispatcher"],
    }],
    diagnostics: [
      { symptom: "fragment 수정이 parent page에 반영되지 않습니다.", likelyCause: "translation-time include dependency를 container가 아직 재번역하지 않았습니다.", checks: ["generated timestamp를 봅니다.", "work cache를 확인합니다.", "clean deployment와 비교합니다."], fix: "정상 deployment/rebuild로 translation unit을 갱신합니다.", prevention: "fragment change integration test와 reproducible deployment를 둡니다." },
      { symptom: "동적 include 대상의 header/status가 사라집니다.", likelyCause: "included response는 parent response를 완전히 소유하지 않습니다.", checks: ["include인지 forward인지 확인합니다.", "body와 metadata 책임을 분리합니다.", "commit state를 봅니다."], fix: "fragment는 body만 생성하고 최종 status/header는 parent controller가 정합니다.", prevention: "dispatch별 response capability matrix를 문서화합니다." },
    ],
    comparisons: [{ title: "두 include 선택", options: [
      { name: "include directive", chooseWhen: "같은 translation unit이어야 하는 고정 source fragment", avoidWhen: "독립 실행·parameter·격리가 필요할 때", tradeoffs: ["compile scope 공유", "변경 감지 의존", "빠른 단순 fragment"] },
      { name: "jsp:include", chooseWhen: "request마다 독립 resource 결과가 필요할 때", avoidWhen: "declaration/directive를 공유해야 할 때", tradeoffs: ["request dispatch 비용", "parameter 가능", "response metadata 제약"] },
    ] }],
  },
  {
    id: "implicit-objects-lifetime-ownership",
    title: "내장 객체를 편의 변수 목록이 아니라 owner·scope·thread 경계로 분류합니다",
    lead: "이름을 외우는 대신 누가 만들고 언제까지 유효하며 concurrent access가 가능한지를 묻습니다.",
    explanations: [
      "request와 response는 현재 요청/응답 경계이고 out은 response buffer에 연결된 JspWriter입니다. 비동기나 다른 thread로 임의 전달하지 않습니다.",
      "page와 pageContext는 현재 generated page instance와 page execution context를 가리키며 pageContext가 scope lookup·dispatch helper를 제공합니다.",
      "session은 같은 client session의 여러 요청에 걸쳐 살아 mutable object를 넣으면 동시 tabs/requests와 fixation·memory 문제가 생깁니다.",
      "application은 web application 전체에서 공유되므로 값은 thread-safe·bounded·lifecycle-owned여야 합니다. request별 값을 두면 전 사용자에게 섞입니다.",
      "config는 ServletConfig, exception은 error page에서만 제공되는 implicit object입니다. 사용 가능 조건을 확인하지 않으면 translation/runtime 오류가 납니다.",
    ],
    concepts: [
      { term: "implicit object", definition: "container가 JSP execution context에 미리 제공하는 표준 object reference입니다.", detail: ["선언 없이 사용할 수 있습니다.", "각각 수명과 capability가 다릅니다."] },
      { term: "scope ownership", definition: "값을 저장한 범위가 수명·공유·cleanup·동시성 책임을 결정한다는 원칙입니다.", detail: ["짧은 범위를 우선합니다.", "mutable 공유를 최소화합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "한 사용자의 값이 다른 사용자에게 보입니다.", likelyCause: "request 값을 application/page instance field에 저장했습니다.", checks: ["setAttribute 대상 scope를 봅니다.", "instance fields를 찾습니다.", "동시 요청으로 재현합니다."], fix: "request/local scope로 이동하고 공유 cache는 key·thread safety를 설계합니다.", prevention: "scope decision table과 concurrency test를 둡니다." },
      { symptom: "exception implicit object를 찾을 수 없습니다.", likelyCause: "page가 error page로 선언되지 않았습니다.", checks: ["isErrorPage directive를 봅니다.", "error mapping을 봅니다.", "public/private error data를 구분합니다."], fix: "표준 error mapping과 안전한 model을 사용합니다.", prevention: "exception object 직접 출력 대신 중앙 error renderer를 둡니다." },
    ],
  },
  {
    id: "scripting-elements-placement-control-flow",
    title: "declaration·scriptlet·expression의 delimiter와 Java control flow 결합을 해체합니다",
    lead: "JSP의 괄호가 HTML 사이로 쪼개질수록 compile 오류와 유지보수 비용이 급격히 커집니다.",
    explanations: [
      "<%! ... %>는 member 선언, <% ... %>는 service body statement, <%= ... %>는 expression value 출력입니다. expression 안에는 semicolon statement를 넣지 않습니다.",
      "원본처럼 for 시작 scriptlet, HTML body, 종료 scriptlet을 나누면 Java block balance와 markup nesting을 동시에 추적해야 합니다.",
      "scriptlet local은 그 삽입 지점 이후 Java scope에서만 보입니다. branch 안에서 선언한 값을 밖의 expression이 읽으면 compile 오류가 납니다.",
      "표현식은 escaping을 자동 보장하지 않습니다. toString 결과가 HTML text인지 markup인지 별도 정책 없이 섞입니다.",
      "현대 JSP view는 controller가 typed model을 만들고 EL/JSTL이 조건·반복·출력만 담당하게 하며 scripting-invalid 정책을 고려합니다.",
    ],
    concepts: [
      { term: "split control flow", definition: "Java block 시작과 종료가 template markup을 사이에 두고 다른 scriptlet에 놓인 구조입니다.", detail: ["두 문법 tree가 얽힙니다.", "JSTL 반복으로 대체합니다."] },
      { term: "scripting-invalid", definition: "JSP configuration에서 scripting elements 사용을 translation error로 금지하는 정책입니다.", detail: ["레거시 회귀를 막습니다.", "EL/JSTL migration 뒤 적용합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "generated Java에서 brace 또는 변수 scope compile 오류가 납니다.", likelyCause: "분리된 scriptlet control flow가 HTML과 어긋났습니다.", checks: ["모든 <% blocks를 순서대로 이어 봅니다.", "generated source line mapping을 봅니다.", "branch별 선언 scope를 봅니다."], fix: "control flow를 controller/JSTL로 옮기고 model을 미리 완성합니다.", prevention: "scriptlet 금지와 template lint를 둡니다." },
      { symptom: "표현식 결과의 HTML이 실행됩니다.", likelyCause: "expression이 raw writer sink인데 trusted markup으로 오해했습니다.", checks: ["값의 provenance를 추적합니다.", "browser context를 확인합니다.", "escaping tag 사용을 봅니다."], fix: "HTML text context encoder/c:out을 사용하고 markup은 audited component로 제한합니다.", prevention: "untrusted data와 markup type을 분리합니다." },
    ],
  },
  {
    id: "declaration-shared-field-race",
    title: "JSP 선언부 mutable field의 lost update를 sleep 없이 재현합니다",
    lead: "Servlet instance 하나가 두 요청을 동시에 처리할 때 declaration field가 request-local처럼 보인다는 착각을 깨뜨립니다.",
    explanations: [
      "declaration result는 generated Servlet의 instance field라 동일 instance의 모든 service calls가 공유합니다.",
      "sub가 field에 쓰고 뒤 expression이 읽는 두 단계 사이에 다른 요청이 끼면 계산 입력과 출력이 서로 다른 요청에 속할 수 있습니다.",
      "volatile은 visibility를 개선하지만 read-modify-write 원자성과 request ownership을 보존하지 않습니다. synchronized도 값의 수명을 불필요하게 공유합니다.",
      "예제는 두 workers가 shared0을 모두 읽은 뒤 동시에1을 쓰도록 latches로 interleaving을 고정해 lost update를 매번 재현합니다.",
      "수정은 계산 결과를 method local/immutable request model로 반환하는 것입니다. 공유 total이 정말 필요하면 별도 thread-safe service와 의미 있는 atomic operation을 둡니다.",
    ],
    concepts: [
      { term: "lost update", definition: "두 작업이 같은 이전 값을 읽고 각자 갱신해 한 변경이 사라지는 race입니다.", detail: ["compound operation입니다.", "volatile만으로 해결되지 않습니다."] },
      { term: "request ownership", definition: "한 요청의 중간 값과 결과가 그 요청 execution context에만 속해야 한다는 규칙입니다.", detail: ["local immutable model을 사용합니다.", "Servlet field를 피합니다."] },
    ],
    codeExamples: [{
      id: "java-jsp-declaration-race",
      title: "두 요청의 shared field lost update와 local 계산을 exact 비교합니다",
      language: "java",
      filename: "SharedDeclarationRace.java",
      purpose: "sleep과 scheduler 운에 의존하지 않고 declaration field race를 deterministic하게 재현합니다.",
      code: String.raw`import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class SharedDeclarationRace {
    static final class BrokenPage {
        int result;
        final CountDownLatch read = new CountDownLatch(2);
        final CountDownLatch write = new CountDownLatch(1);

        int request() throws InterruptedException {
            int before = result;
            read.countDown();
            write.await();
            result = before + 1;
            return result;
        }
    }

    public static void main(String[] args) throws Exception {
        BrokenPage page = new BrokenPage();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> first = pool.submit(page::request);
            Future<Integer> second = pool.submit(page::request);
            page.read.await();
            page.write.countDown();
            List<Integer> broken = List.of(first.get(), second.get());
            List<Integer> local = List.of(1, 1);
            System.out.println("broken=" + broken + ",shared=" + page.result);
            System.out.println("local=" + local + ",sum=" + local.stream().mapToInt(Integer::intValue).sum());
        } finally {
            pool.shutdown();
            if (!pool.awaitTermination(1, TimeUnit.SECONDS)) throw new IllegalStateException("pool timeout");
        }
    }
}`,
      walkthrough: [
        { lines: "1-19", explanation: "두 requests가 field read를 끝낸 뒤 write gate에서 함께 진행하도록 고정합니다." },
        { lines: "21-31", explanation: "두 Future를 제출하고 lost update 결과를 submission 순서로 수집합니다." },
        { lines: "32-38", explanation: "local model 합계와 비교하고 executor termination을 검증합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "two deterministic workers"], command: isolatedJavaRun("SharedDeclarationRace.java", "SharedDeclarationRace") },
      output: { value: "broken=[1, 1],shared=1\nlocal=[1, 1],sum=2", explanation: ["두 변경 중 하나가 shared field에서 사라집니다.", "request-local results는 둘 다 보존됩니다."] },
      experiments: [
        { change: "result에 volatile을 붙입니다.", prediction: "두 workers가 이미0을 읽어 shared1은 그대로입니다.", result: "visibility와 atomic ownership은 다릅니다." },
        { change: "request가 계산 결과를 field 대신 return만 합니다.", prediction: "두 결과와 합계2가 보존됩니다.", result: "view model을 request-local로 유지합니다." },
        { change: "latch 대신 sleep을 씁니다.", prediction: "환경에 따라 race가 재현되지 않을 수 있습니다.", result: "동시성 test는 event gate로 interleaving을 고정합니다." },
      ],
      sourceRefs: ["source-jsp01-ex03", "jakarta-pages-spec", "java-countdown-latch", "java-executor"],
    }],
    diagnostics: [
      { symptom: "간헐적으로 다른 요청의 계산 결과가 보입니다.", likelyCause: "declaration 또는 Servlet field에 request 중간 값을 저장했습니다.", checks: ["<%! blocks를 찾습니다.", "generated fields를 봅니다.", "latch로 concurrent overlap을 만듭니다."], fix: "계산 결과를 local immutable model로 반환합니다.", prevention: "instance-field review와 concurrency regression을 둡니다." },
      { symptom: "volatile을 붙였는데 값이 여전히 덮입니다.", likelyCause: "read-modify-write가 여러 operations이고 요청 ownership도 공유 상태로 남았습니다.", checks: ["compound steps를 나눠 봅니다.", "atomicity 요구를 확인합니다.", "field가 필요한지 먼저 묻습니다."], fix: "request state는 제거하고 진짜 shared aggregate만 atomic service로 분리합니다.", prevention: "volatile을 만능 race 수정으로 쓰지 않는 기준을 둡니다." },
    ],
  },
  {
    id: "deterministic-time-random-input",
    title: "현재 시간과 난수를 controller 입력으로 바꿔 exact output을 만듭니다",
    lead: "뷰가 시스템 clock과 global randomness를 직접 읽으면 테스트, cache, 재현, 시차와 설명이 모두 흔들립니다.",
    explanations: [
      "LocalDate.now()는 system default zone과 실행 순간에 의존합니다. 자정 경계와 host zone 변경에서 같은 test가 다른 날짜를 냅니다.",
      "Math.random()은 global generator에서 값을 가져와 의도한 edge case를 직접 선택하기 어렵습니다. 운세 같은 값도 range와 seed/입력 정책을 controller가 소유해야 합니다.",
      "Clock.fixed와 명시 ZoneId는 날짜 fixture를 고정합니다. production은 Clock.system(zone)을 dependency로 주입할 수 있습니다.",
      "예제는 IntSupplier로42를 주입하고0..100 범위를 검증합니다. 출력 전에 model이 완성되어 JSP는 pure read만 합니다.",
      "determinism은 보안 난수와 다릅니다. token/password에는 SecureRandom과 보안 설계를 사용하고 예측 가능한 fixture를 production에 넣지 않습니다.",
    ],
    concepts: [
      { term: "Clock injection", definition: "현재 시간을 직접 읽지 않고 명시적 Clock dependency에서 얻는 설계입니다.", detail: ["test는 fixed clock입니다.", "zone을 명시합니다."] },
      { term: "deterministic fixture", definition: "동일 입력이 항상 동일 event와 output을 만드는 검증용 실행 환경입니다.", detail: ["edge case를 직접 선택합니다.", "production randomness와 분리합니다."] },
    ],
    codeExamples: [{
      id: "java-jsp-deterministic-model",
      title: "고정 날짜·운세와 HTML text escaping model을 만듭니다",
      language: "java",
      filename: "DeterministicJspModel.java",
      purpose: "원본 시간·난수·raw output 문제를 controller-neutral JDK value model로 교정합니다.",
      code: String.raw`import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.function.IntSupplier;

public class DeterministicJspModel {
    record ViewModel(LocalDate date, int luck, String label) {}

    static ViewModel create(Clock clock, IntSupplier luck, String label) {
        int value = luck.getAsInt();
        if (value < 0 || value > 100) throw new IllegalArgumentException("luck range");
        return new ViewModel(LocalDate.now(clock), value, label);
    }

    static String htmlText(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }

    public static void main(String[] args) {
        Clock clock = Clock.fixed(Instant.parse("2026-03-04T00:00:00Z"), ZoneId.of("Asia/Seoul"));
        ViewModel model = create(clock, () -> 42, "<b>&\"'</b>");
        System.out.println("date=" + model.date() + "|luck=" + model.luck());
        System.out.println("label=" + htmlText(model.label()));
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "Clock·supplier 입력과 immutable view record를 선언합니다." },
        { lines: "10-14", explanation: "luck domain을 controller boundary에서 검증하고 날짜를 injected Clock에서 얻습니다." },
        { lines: "16-19", explanation: "HTML text context의 parser-significant 문자를 entity로 바꿉니다." },
        { lines: "21-26", explanation: "fixed instant·zone·luck·malicious label로 exact output을 만듭니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "timezone-independent fixed Clock"], command: isolatedJavaRun("DeterministicJspModel.java", "DeterministicJspModel") },
      output: { value: "date=2026-03-04|luck=42\nlabel=&lt;b&gt;&amp;&quot;&#39;&lt;/b&gt;", explanation: ["host clock/zone과 무관한 날짜입니다.", "label은 HTML markup이 아니라 text로 남습니다."] },
      experiments: [
        { change: "luck supplier가101을 반환합니다.", prediction: "luck range failure가 납니다.", result: "view에 invalid model을 넘기지 않습니다." },
        { change: "Clock.systemDefaultZone을 사용합니다.", prediction: "host와 자정 경계에 따라 날짜가 달라질 수 있습니다.", result: "업무 zone을 명시합니다." },
        { change: "label을 JavaScript string literal 안에 넣습니다.", prediction: "HTML text encoder만으로는 충분하지 않습니다.", result: "각 parser context에 맞는 serializer를 사용합니다." },
      ],
      sourceRefs: ["source-jsp01-ex03", "java-clock", "java-int-supplier", "owasp-xss", "jakarta-pages-api", "whatwg-html"],
    }],
    diagnostics: [
      { symptom: "날짜 test가 특정 시간대에서 하루 차이로 실패합니다.", likelyCause: "system default zone과 현재 시간을 직접 읽었습니다.", checks: ["ZoneId.systemDefault를 기록합니다.", "자정 경계를 재현합니다.", "Clock dependency를 확인합니다."], fix: "업무 ZoneId와 injected Clock을 사용합니다.", prevention: "CI를 여러 zone에서 실행하고 fixed fixture를 둡니다." },
      { symptom: "난수 test가 간헐적으로만 edge case를 만납니다.", likelyCause: "global random 호출에 의존했습니다.", checks: ["Math.random 호출을 찾습니다.", "range endpoints를 봅니다.", "seed/입력 소유자를 확인합니다."], fix: "supplier/generator를 주입해0·100·invalid를 직접 test합니다.", prevention: "비결정 input을 dependency inventory에 포함합니다." },
    ],
  },
  {
    id: "jsp-html-comments-output-buffer",
    title: "JSP 주석·HTML 주석·응답 bytes의 공개 범위를 구분합니다",
    lead: "source에서 보이지 않는다는 말은 server artifact와 로그에서도 사라진다는 뜻이 아닙니다.",
    explanations: [
      "JSP comment <%-- --%>는 translation 전에 제거되어 response HTML에 나타나지 않습니다. 그러나 repository와 deployed source artifact에는 남을 수 있습니다.",
      "HTML comment <!-- -->는 response bytes에 포함되어 browser source·proxy·cache·client가 읽을 수 있습니다. secret/debug data를 넣지 않습니다.",
      "Java comment가 scriptlet 안에 있으면 generated Java에는 영향을 줄 수 있지만 response에는 직접 출력되지 않습니다. 그래도 source disclosure 위협은 별개입니다.",
      "JspWriter buffer는 content를 commit 전 임시 보관합니다. comment도 HTML output이면 byte budget과 cache representation 일부입니다.",
      "민감 정보 제거는 comment 종류 선택이 아니라 source 자체에 secret·PII를 넣지 않고 public artifact를 scan하는 문제입니다.",
    ],
    concepts: [
      { term: "server-side comment", definition: "translation 단계에서 제거되어 response representation에 포함되지 않는 JSP comment입니다.", detail: ["repository에는 남습니다.", "secret 저장소가 아닙니다."] },
      { term: "client-visible comment", definition: "HTML representation의 일부로 전송되어 client가 볼 수 있는 comment입니다.", detail: ["source view에 보입니다.", "cache에도 남습니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "브라우저 source에서 내부 메모가 보입니다.", likelyCause: "JSP comment가 아니라 HTML comment로 응답에 보냈습니다.", checks: ["raw response를 봅니다.", "comment delimiter를 확인합니다.", "CDN cache도 확인합니다."], fix: "내부 메모를 제거하고 필요한 문서는 비공개 개발 문서로 옮깁니다.", prevention: "client bundle/HTML secret scan을 둡니다." },
      { symptom: "JSP comment로 숨긴 값이 source leak에 노출됩니다.", likelyCause: "server-side 제거를 source confidentiality로 오해했습니다.", checks: ["repository history를 봅니다.", "deploy artifact를 봅니다.", "backup/public mirror를 확인합니다."], fix: "민감 값을 rotate·purge하고 configuration provider로 이동합니다.", prevention: "comments 포함 전체 source에 secret detection을 적용합니다." },
    ],
  },
  {
    id: "scriptlet-xss-contextual-output",
    title: "out·expression을 raw sink로 보고 parser context별 encoding을 적용합니다",
    lead: "Java 문자열이 안전한지보다 그 bytes를 다음에 해석할 parser가 무엇인지가 encoding 방식을 결정합니다.",
    explanations: [
      "out.println(value)와 <%= value %>는 일반적으로 value를 HTML-safe하게 자동 변환하지 않습니다. request·DB·session 값이면 stored/reflected XSS sink가 됩니다.",
      "HTML text에서는 &, <, >와 필요에 따라 quotes를 encode하지만 attribute, URL, JavaScript, CSS context는 서로 다른 규칙을 요구합니다.",
      "c:out escapeXml은 HTML/XML text 출력 의도를 드러내는 기본 도구지만 모든 context의 만능 encoder가 아닙니다. inline script/style data 연결을 피합니다.",
      "validation은 업무 허용값을 검사하고 encoding은 parser 구조를 지킵니다. 둘 중 하나가 다른 하나를 대신하지 않습니다.",
      "trusted HTML을 허용해야 하면 plain String이 아니라 sanitizer policy와 provenance가 있는 별도 type/component로 좁힙니다.",
    ],
    concepts: [
      { term: "output sink", definition: "외부 또는 변형된 값이 parser가 해석할 representation에 들어가는 지점입니다.", detail: ["JspWriter와 expression이 해당합니다.", "provenance를 추적합니다."] },
      { term: "contextual encoding", definition: "HTML text·attribute·URL·JavaScript 등 다음 parser context에 맞춘 변환입니다.", detail: ["context마다 규칙이 다릅니다.", "최종 sink 가까이 적용합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "사용자 이름에 넣은 tag/event가 실행됩니다.", likelyCause: "raw expression/out으로 HTML에 연결했습니다.", checks: ["value source를 추적합니다.", "sink context를 확인합니다.", "escaping 후 raw 재결합이 없는지 봅니다."], fix: "HTML text encoder/c:out을 사용하고 다른 contexts는 전용 API를 씁니다.", prevention: "malicious fixtures와 CSP를 defense-in-depth로 둡니다." },
      { symptom: "HTML escape했는데 JavaScript 문자열이 깨집니다.", likelyCause: "HTML text encoder를 script parser context에 재사용했습니다.", checks: ["script/style/attribute 위치를 봅니다.", "중첩 parser 순서를 적습니다.", "JSON serializer 사용 여부를 봅니다."], fix: "inline script 연결을 제거하거나 안전한 JSON serialization·nonce 정책을 사용합니다.", prevention: "context별 approved rendering primitive를 표준화합니다." },
    ],
  },
  {
    id: "mvc-view-boundary-migration",
    title: "JSP를 계산 장소가 아니라 이미 완성된 view model의 renderer로 제한합니다",
    lead: "Java를 태그로 기계적으로 바꾸는 것이 아니라 업무 결정, 데이터 수명, 출력 책임을 올바른 층으로 이동합니다.",
    explanations: [
      "controller는 parameter validation, clock/random/database 호출, authorization과 view selection을 끝내고 request scope에 immutable model을 둡니다.",
      "JSP는 model의 단순 property, 빈 상태, 조건, 반복, locale formatting과 안전한 URL/output만 수행합니다.",
      "session/application에서 암묵적으로 값을 찾기보다 필요한 model을 request scope에 명시하면 dependency와 테스트가 작아집니다.",
      "복잡한 계산을 custom tag로 숨기는 것도 view logic 비대화일 수 있습니다. 업무 규칙은 service/controller에 남깁니다.",
      "migration은 원본 behavior capture, 위험 sink 차단, state 이동, EL/JSTL 치환, scripting-invalid gate, real container test 순으로 진행합니다.",
    ],
    concepts: [
      { term: "view model", definition: "renderer가 추가 업무 조회·계산 없이 화면을 만들 수 있도록 완성된 immutable data 계약입니다.", detail: ["request scope에 둡니다.", "표시 상태를 명시합니다."] },
      { term: "logicless boundary", definition: "뷰가 업무 결정과 side effect를 하지 않고 제한된 표현만 수행하는 경계입니다.", detail: ["테스트가 단순해집니다.", "출력 정책을 집중시킵니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "JSP가 DB를 조회하고 난수를 만들며 redirect까지 합니다.", likelyCause: "Model1 방식으로 요청 제어와 view rendering이 한 파일에 결합됐습니다.", checks: ["side-effect calls를 inventory합니다.", "scope writes를 봅니다.", "response control calls를 봅니다."], fix: "controller/service/view model로 책임을 단계적으로 이동합니다.", prevention: "view dependency allowlist와 architecture test를 둡니다." },
      { symptom: "scriptlet 제거 뒤에도 JSP 조건이 수백 줄입니다.", likelyCause: "Java syntax만 JSTL로 번역하고 업무 규칙은 그대로 뷰에 남겼습니다.", checks: ["조건의 업무 의미를 이름 붙입니다.", "같은 분기가 여러 pages에 있는지 봅니다.", "model enum/state가 있는지 봅니다."], fix: "controller가 display state를 계산하고 JSP는 단순 choose만 수행합니다.", prevention: "view complexity budget과 component contract를 둡니다." },
    ],
    expertNotes: ["JSP를 사용하지 않는 현대 stack에서도 translation, shared renderer state, deterministic model, contextual escaping 원칙은 그대로 적용됩니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...maintainedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "source-jsp01-ex01", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex01_jsp.jsp", usedFor: ["JSP comments", "directives", "implicit object inventory"], evidence: "inventory direct source를 read-only audit했습니다." },
  { id: "source-jsp01-ex02", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex02_directive.jsp", usedFor: ["page directive", "static include", "dynamic include"], evidence: "두 include의 활성 syntax를 확인했습니다." },
  { id: "source-jsp01-ex03", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex03_InnerObject.jsp", usedFor: ["declaration", "scriptlet", "expression", "shared field race", "time/random nondeterminism", "raw output"], evidence: "활성 scripting elements와 위험을 값 노출 없이 감사했습니다." },
  { id: "source-jsp01-result", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day01/result.html", usedFor: ["include closure"], evidence: "정적·동적 include 대상 HTML을 closure로 읽었습니다." },
  { id: "jakarta-pages-spec", repository: "Jakarta EE", path: "Jakarta Server Pages 4.0 Specification", publicUrl: "https://jakarta.ee/specifications/pages/4.0/jakarta-server-pages-spec-4.0.pdf", usedFor: ["translation", "directives", "scripting", "implicit objects", "include semantics"], evidence: "JSP 4.0 primary specification입니다." },
  { id: "jakarta-pages-api", repository: "Jakarta EE", path: "Jakarta Server Pages 4.0 API", publicUrl: "https://jakarta.ee/specifications/pages/4.0/apidocs/", usedFor: ["JspWriter", "PageContext"], evidence: "JSP API primary documentation입니다." },
  { id: "jakarta-request-dispatcher", repository: "Jakarta EE", path: "Servlet 6.1 RequestDispatcher", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/requestdispatcher", usedFor: ["request-time include", "forward/include response rules"], evidence: "dispatch contract primary API입니다." },
  { id: "java-countdown-latch", repository: "Java SE 21", path: "CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["deterministic race"], evidence: "gate happens-before contract입니다." },
  { id: "java-executor", repository: "Java SE 21", path: "ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["bounded worker lifecycle"], evidence: "worker submission·shutdown contract입니다." },
  { id: "java-clock", repository: "Java SE 21", path: "Clock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html", usedFor: ["time injection", "fixed fixture"], evidence: "time source abstraction primary API입니다." },
  { id: "java-int-supplier", repository: "Java SE 21", path: "IntSupplier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/IntSupplier.html", usedFor: ["random result injection"], evidence: "primitive input supplier primary API입니다." },
  { id: "owasp-xss", repository: "OWASP", path: "Cross Site Scripting Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["contextual output encoding", "dangerous contexts"], evidence: "실무 출력 보안 기준입니다." },
  { id: "whatwg-html", repository: "WHATWG", path: "HTML Living Standard syntax", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html", usedFor: ["HTML comments", "text parsing", "character references"], evidence: "browser parser primary standard입니다." },
);

const reviewPairs: Array<[string, string]> = [
  ["JSP는 브라우저에서 Java로 실행되나요?", "아닙니다. server container가 JSP를 Servlet로 번역·compile·실행하고 브라우저는 결과 bytes만 받습니다."],
  ["translation unit은 무엇을 포함하나요?", "현재 JSP와 include directive로 translation-time에 합쳐진 resources를 포함합니다."],
  ["template text는 generated Servlet에서 무엇이 되나요?", "요청 처리 method 안의 JspWriter.write 계열 출력이 됩니다."],
  ["declaration은 어디로 가나요?", "generated Servlet class의 member field 또는 method로 갑니다."],
  ["scriptlet local은 어디에 있나요?", "요청마다 호출되는 service 계열 method의 local scope에 있습니다."],
  ["expression은 escaping을 자동으로 하나요?", "아닙니다. 계산 결과를 writer에 출력하므로 sink context에 맞는 encoding이 필요합니다."],
  ["pageEncoding과 response charset은 같은 역할인가요?", "아닙니다. 전자는 source translation decode, 후자는 client response decode 계약입니다."],
  ["language=java가 scriptlet 사용을 권장하나요?", "아닙니다. scripting language 정의이며 현대 view에서는 Java scripting을 제거합니다."],
  ["session=false의 장점은 무엇인가요?", "session이 필요 없는 page의 implicit session 생성·결합을 줄입니다."],
  ["buffer가 가득 차면 무엇이 문제인가요?", "autoFlush에 따라 response가 commit되어 status/header/forward 변경이 제한될 수 있습니다."],
  ["errorPage에 exception stack을 보여도 되나요?", "안 됩니다. safe public message와 내부 진단을 분리합니다."],
  ["include directive는 언제 실행되나요?", "translation-time에 대상 source text를 합칩니다."],
  ["jsp:include는 언제 실행되나요?", "request-time에 대상을 dispatch하고 처리 결과를 현재 response에 포함합니다."],
  ["두 include가 Java local을 공유하나요?", "정적 include는 같은 translation unit이지만 동적 include 대상은 독립 execution이라 Java locals를 공유하지 않습니다."],
  ["동적 include가 final status를 소유하나요?", "보통 parent response가 최종 metadata를 소유하고 included response에는 제약이 있습니다."],
  ["request implicit object의 수명은 무엇인가요?", "현재 요청 dispatch chain에 한정되며 redirect의 새 요청에는 그대로 이어지지 않습니다."],
  ["session에 mutable List를 두면 왜 위험한가요?", "동일 session의 동시 요청이 같은 object를 수정할 수 있고 수명·memory도 길어집니다."],
  ["application scope는 누구에게 공유되나요?", "web application 전체 사용자와 요청에 공유됩니다."],
  ["exception implicit object는 항상 있나요?", "아닙니다. error page로 구성된 JSP에서 사용할 수 있습니다."],
  ["page와 pageContext는 같은가요?", "page는 generated page instance이고 pageContext는 scope/dispatch 등을 제공하는 execution context입니다."],
  ["split control flow가 무엇인가요?", "Java block의 시작과 끝을 여러 scriptlets로 나누고 그 사이에 markup을 둔 구조입니다."],
  ["scripting-invalid는 무엇을 하나요?", "구성된 JSP 범위에서 scripting elements를 translation error로 금지합니다."],
  ["선언부 result가 request-local이 아닌 이유는?", "generated Servlet instance field로 번역되어 concurrent service calls가 공유하기 때문입니다."],
  ["volatile이면 lost update가 해결되나요?", "아닙니다. visibility만 제공하며 compound update와 request ownership을 해결하지 않습니다."],
  ["race test에 sleep을 피하는 이유는?", "scheduler와 host 속도에 따라 interleaving이 달라져 재현성이 낮기 때문입니다."],
  ["request 계산 결과는 어디에 두나요?", "method local 또는 request scope의 immutable view model에 둡니다."],
  ["LocalDate.now가 test를 흔드는 이유는?", "실행 순간과 system default zone에 의존하기 때문입니다."],
  ["fixed Clock의 목적은 무엇인가요?", "의도한 instant와 zone에서 항상 같은 날짜를 얻기 위함입니다."],
  ["Math.random edge를 어떻게 test하나요?", "generator/supplier를 주입해0·100·invalid 값을 직접 선택합니다."],
  ["보안 token에도 fixed random을 쓰나요?", "아닙니다. production 보안 난수는 SecureRandom과 별도 위협 모델이 필요합니다."],
  ["JSP comment는 browser source에 보이나요?", "response에는 포함되지 않지만 repository/deploy source에는 남을 수 있습니다."],
  ["HTML comment는 안전한 비밀 저장소인가요?", "아닙니다. response bytes로 client와 cache에 전달됩니다."],
  ["out.println에 고정 문자열만 있으면 영원히 안전한가요?", "현재 provenance는 trusted여도 sink가 외부 값으로 바뀌는 순간 위험하므로 rendering boundary를 유지해야 합니다."],
  ["validation이 escaping을 대신하나요?", "아닙니다. 업무 값 허용과 parser 구조 보호는 다른 책임입니다."],
  ["HTML text encoder를 attribute/JS에도 쓰나요?", "안 됩니다. 각 parser context에 맞는 API와 serialization이 필요합니다."],
  ["c:out은 모든 XSS context를 해결하나요?", "아닙니다. XML/HTML text escaping 의도를 주로 제공하며 위험한 inline contexts를 피해야 합니다."],
  ["view model은 언제 완성되나요?", "JSP에 forward하기 전에 controller/service가 validation·조회·계산을 마쳐 완성합니다."],
  ["JSP가 DB를 직접 조회하면 무엇이 나쁜가요?", "rendering에 side effect·connection·오류·업무 logic이 결합되어 테스트와 보안 경계가 무너집니다."],
  ["scriptlet을 JSTL로 치환하면 migration이 끝나나요?", "아닙니다. 업무 분기와 side effect를 controller로 옮기고 output/scope 정책도 고쳐야 합니다."],
  ["JDK-only fixture의 한계는 무엇인가요?", "실제 JSP compiler·container의 generated source, dispatch, buffer를 실행하지 않으므로 integration test가 별도로 필요합니다."],
];
(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(...reviewPairs.map(([question, answer]) => ({ question, answer })));

(session.completionChecklist as string[]).push(
  "inventory direct3를 모두 읽었다.", "result.html closure1을 읽었다.", "원본4 hashes를 확인했다.", "템플릿 사용자 주석3의 값을 출력하지 않았다.", "container와 network를 원본 audit에서 시작하지 않았다.",
  "page directive4를 active code에서 확인했다.", "static include1을 확인했다.", "dynamic include1을 확인했다.", "declaration1을 확인했다.", "expressions9를 확인했다.",
  "scriptlets13을 확인했다.", "out.println10을 raw sink로 분류했다.", "LocalDate.now1을 확인했다.", "Math.random1을 확인했다.", "shared result field1을 확인했다.",
  "JSP→Servlet translation 단계를 설명한다.", "translation unit과 runtime dispatch를 구분한다.", "template text의 writer 위치를 안다.", "declaration의 member 위치를 안다.", "scriptlet의 service 위치를 안다.",
  "expression의 raw output 성격을 안다.", "generated 경로와 규격 의미를 구분한다.", "pageEncoding을 명시한다.", "Content-Type charset을 명시한다.", "source·response encoding을 UTF-8로 맞춘다.",
  "session 불필요 page를 식별한다.", "buffer commit 전에 dispatch를 결정한다.", "error public/private 정보를 분리한다.", "정적 include의 compile scope를 안다.", "동적 include의 request scope를 안다.",
  "include 대상 parameter 계약을 명시한다.", "include response metadata 제약을 안다.", "request와 response 수명을 설명한다.", "out과 buffer 관계를 설명한다.", "page와 pageContext를 구분한다.",
  "session mutable data를 최소화한다.", "application shared data를 thread-safe하게 둔다.", "exception object 사용 조건을 안다.", "split control flow를 제거한다.", "scripting-invalid 적용 시점을 정한다.",
  "declaration field race를 latch로 재현했다.", "volatile이 ownership 해결책이 아님을 안다.", "request result를 local model로 옮겼다.", "executor를 bounded shutdown한다.", "Clock을 dependency로 주입한다.",
  "업무 ZoneId를 명시한다.", "난수 결과를 supplier로 주입한다.", "range endpoints를 test한다.", "보안 난수와 학습 fixture를 구분한다.", "JSP comment가 source secret을 숨기지 못함을 안다.",
  "HTML comment가 client-visible임을 안다.", "HTML text context를 식별한다.", "attribute·URL·JS contexts를 구분한다.", "validation과 encoding을 함께 적용한다.", "raw trusted markup을 별도 policy로 제한한다.",
  "controller가 view model을 완성한다.", "JSP에서 DB·clock·random side effect를 제거한다.", "EL/JSTL migration 뒤 scriptlet gate를 둔다.", "모든 Java examples가 warning0임을 검증한다.", "모든 maintained outputs가 exact임을 검증한다.",
  "실제 Jakarta JSP container integration 범위를 문서화했다."
);
