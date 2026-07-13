import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

const noCode = [] as DetailedSession["chapters"][number]["codeExamples"];

const session = {
  schemaVersion: 2,
  inventoryIds: ["jsp-03-el-scope-resolution"],
  slug: "jsp-03-el-scope-resolution",
  courseId: "servlet-jsp",
  moduleId: "jsp-el-jstl-view",
  order: 8,
  title: "EL 평가·coercion·scope와 property resolution",
  subtitle: "산술·비교·empty의 편리함 뒤에 숨은 타입 변환과 page→request→session→application 탐색, bean·Map·List 접근, null·XSS 경계를 정확히 모델링합니다.",
  level: "중급",
  estimatedMinutes: 840,
  coreQuestion: "EL이 짧게 값을 찾고 계산해 주는 동안 어떤 scope·resolver·coercion 규칙이 적용되며, 편리한 null 처리 때문에 데이터 오류나 XSS가 숨지 않게 하려면 어떻게 해야 할까요?",
  summary: "원본 ex01_EL.jsp, ex05_error.jsp, ex07_Attribute.jsp direct3을 모두 read-only로 감사합니다. JSP comments를 제거한 활성 source는 page directives3, expressions10, scriptlets5, EL54, empty operators10, request setAttribute2, page7, session1, application1, explicit scope name lookups4, unscoped name1입니다. Java expression 15/7은 정수2지만 EL division은 일반적인 numeric division 결과를 냅니다. ex07은 같은 name을 네 scopes에 저장하고 page를 다시 덮어 unscoped ${name}이 page를 선택합니다. ex01의 page str과 error page의 request str이 각각 raw ${str} sink로 출력되어 provenance가 외부 입력이면 XSS가 됩니다. 로컬 템플릿 사용자3과 sample person 값은 비공개입니다. container-neutral JDK models로 arithmetic/coercion, ordered scopes, JavaBeans/Map/List resolution, null-safe contextual output을 exact 검증합니다.",
  objectives: [
    "EL immediate/deferred syntax와 JSP에서의 value evaluation 경계를 설명한다.",
    "Java 정수 산술과 EL numeric coercion/division의 차이를 예측한다.",
    "비교·논리·ternary 연산에서 null·문자열·숫자 coercion 위험을 식별한다.",
    "empty가 null·빈 문자열·배열·Collection·Map을 어떻게 다루는지 구분한다.",
    "unscoped identifier의 page→request→session→application 탐색 순서를 재현한다.",
    "pageScope·requestScope·sessionScope·applicationScope로 dependency를 명시한다.",
    "bean getter·Map key·List/array index의 property resolver chain을 설명한다.",
    "missing property/null coercion을 업무 오류와 빈 화면으로 조용히 숨기지 않는다.",
    "EL direct output을 HTML-safe라고 가정하지 않고 contextual encoding을 적용한다.",
  ],
  prerequisites: [
    { title: "JSP action과 request model", reason: "EL 값은 controller가 request attributes로 만든 view model에서 주로 오며 forward 수명을 알아야 합니다.", sessionSlug: "jsp-02-actions-context-path" },
    { title: "Java encapsulation과 getter", reason: "EL bean property가 field 직접 접근이 아니라 JavaBeans-style getter resolution을 사용한다는 배경입니다.", sessionSlug: "oop-03-encapsulation" },
  ],
  keywords: ["Jakarta Expression Language", "EL", "${}", "coercion", "division", "comparison", "logical operator", "ternary", "empty", "null", "scope resolution", "pageScope", "requestScope", "sessionScope", "applicationScope", "JavaBeans", "Map", "List", "property resolver", "XSS", "c:out"],
  chapters: [],
  lab: {
    title: "충돌 없는 typed EL view model과 safe renderer",
    scenario: "같은 이름이 여러 scopes에 있고 bean/map/list/null 값이 섞인 화면을 명시적 request model과 안전한 출력으로 재설계합니다.",
    setup: ["page/request/session/application maps와 같은 key 충돌 fixture를 준비합니다.", "bean getter, Map key, List index, missing property, null/empty values와 malicious text fixtures를 준비합니다.", "원본3은 read-only로 두고 사용자/사람 값은 출력하지 않습니다."],
    steps: ["원본 active EL/scriptlet/scope writes와 raw output sinks를 count합니다.", "각 EL expression의 operand type과 예상 coercion을 표로 적습니다.", "Java 15/7과 EL-like decimal division을 exact 비교합니다.", "empty null/string/list/map/array cases를 table-test합니다.", "unscoped same-name이 page→request→session→application에서 처음 발견한 값을 택하는지 검증합니다.", "cross-scope dependency는 explicit scope map 또는 고유 request model key로 바꿉니다.", "bean getter·Map·List resolver를 deterministic chain으로 재현합니다.", "missing/wrong property를 silent blank가 아닌 contract failure 또는 explicit empty state로 바꿉니다.", "모든 user/error/model text를 HTML text output primitive로 렌더합니다.", "실제 Jakarta EL container에서 coercion·resolver·method access와 disabled scripting policy를 integration test합니다."],
    expectedResult: ["모든 expression의 source scope·resolved type·result를 설명할 수 있습니다.", "scope collision이 implicit shadowing이 아니라 explicit model contract로 바뀝니다.", "missing/null이 예기치 않은0/false/blank로 숨지 않고 typed 상태가 됩니다.", "오류 메시지와 bean properties가 markup이 아닌 안전한 text로 출력됩니다."],
    cleanup: ["owned temp와 resolver fixtures만 삭제합니다.", "session/application maps를 비우고 shared mutable 값0을 확인합니다.", "원본 hashes와 privacy assertions를 다시 확인합니다."],
    extensions: ["custom ELResolver ordering과 read-only resolver를 실험합니다.", "method expressions와 lambda/collection operations를 별도 advanced session으로 확장합니다.", "strict view-model contract checker로 JSP가 허용 key만 읽게 합니다.", "EL injection과 dynamic expression construction 금지 정책을 위협 모델에 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 산술·비교·empty expression 결과와 operand type을 표로 예측하고 검증하세요.", requirements: ["Java 15/7=2를 포함합니다.", "EL division의 numeric 결과를 구분합니다.", "null·empty string·empty list·non-empty string을 포함합니다.", "coercion이 일어난 항목을 표시합니다.", "warning0 exact JDK model을 제공합니다."], hints: ["화면 문자열만 보지 말고 evaluation 전/후 type을 적으세요.", "JDK model은 EL 구현 자체가 아니라 mental model임을 표시하세요."], expectedOutcome: "편리한 syntax 뒤의 타입 변화가 명시된 expression matrix가 완성됩니다.", solutionOutline: ["operand→coercion→operator→result→render 순서로 표를 만듭니다."] },
    { difficulty: "응용", prompt: "네 scopes의 같은 key와 bean/map/list properties를 explicit model로 리팩터링하세요.", requirements: ["unscoped lookup order를 test합니다.", "explicit scope 결과를 모두 출력합니다.", "page shadow를 제거합니다.", "bean getter·Map key·List index를 구분합니다.", "missing/out-of-range를 explicit 상태로 만듭니다.", "malicious text를 escape합니다."], hints: ["requestScope.view 같은 고유 root model을 두면 collision이 줄어듭니다.", "scope 수명이 길수록 shared mutable data 비용이 큽니다."], expectedOutcome: "resolver 경로와 수명이 명시된 collision-free view model이 완성됩니다.", solutionOutline: ["scope inventory→root model→property contract→empty/error state→safe output 순서로 이동합니다."] },
    { difficulty: "설계", prompt: "대규모 JSP application의 EL 사용 표준과 strict migration gate를 작성하세요.", requirements: ["허용 scope와 key naming 규칙을 둡니다.", "coercion 허용/금지 표를 둡니다.", "null/empty/error UI 정책을 둡니다.", "bean/map/list resolver contract를 둡니다.", "method/dynamic expression 제한을 둡니다.", "contextual escaping과 real container tests를 정의합니다."], hints: ["짧은 표현식이 항상 단순한 dependency는 아닙니다.", "view가 session/application을 암묵 탐색하지 않게 하세요."], expectedOutcome: "silent coercion·shadowing·raw output을 차단하는 실행 가능한 EL 표준이 완성됩니다.", solutionOutline: ["inventory→risk classification→approved patterns→lint/runtime assertions→migration waves로 작성합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["jsp-04-jstl-control-format"],
  sources: [],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "inventory direct3을 모두 읽고 source 밖 companion 없이 EL expression·scope writes·error output을 설명할 수 있어 closure3입니다.",
      "ex05_error.jsp의 str producer는 jsp-02 semantic closure ThreeCommand에서 감사했으며 이 세션은 direct error sink와 출력 정책에 집중합니다.",
      "템플릿 사용자 값3과 ex07 sample person values는 공개하지 않고 count와 scope shape만 사용합니다.",
      "JDK models는 EL engine 구현을 대체하지 않으며 실제 Jakarta EL coercion/resolver behavior는 integration 범위로 명시합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAudit: DetailedSession["chapters"][number] = {
  id: "original-jsp03-direct3-el-scope-audit",
  title: "원본 direct3의 EL54·scope writes·raw str sinks를 값 노출 없이 감사합니다",
  lead: "JSP/EL container를 실행하지 않고 byte-identical copy에서 active syntax와 scope graph만 검증합니다.",
  explanations: [
    "direct3은 연산/empty page, command error page, 네 scope 충돌 page이며 별도 companion 없이 source 자체로 evaluation 주제를 설명합니다.",
    "JSP comments를 제거한 active source에는 page directives3, Java expressions10, scriptlets5, EL expressions54, empty operator uses10이 있습니다.",
    "scope writes는 pageContext7, request2, session1, application1입니다. ex07은 같은 name을 네 scopes에 쓰고 page에 한 번 더 써 shadowing을 의도적으로 보여 줍니다.",
    "explicit ${pageScope.name}, ${requestScope.name}, ${sessionScope.name}, ${applicationScope.name}는4개이고 unscoped ${name}은1개입니다.",
    "Java expression <%=15/7%>1은 int division2입니다. 같은 page의 EL /와 div는 EL numeric coercion 규칙을 따르므로 단순 Java int 결과와 같다고 외우면 안 됩니다.",
    "active ${str} sinks는 ex01의 non-empty example과 error page에 총2개입니다. error producer가 외부 값을 넣는 경우 raw HTML XSS가 될 수 있습니다.",
    "ex01은 null, empty string, non-empty string, empty ArrayList를 page scope에 두고 empty를 비교합니다. null/empty 표시가 업무 데이터 누락을 자동 해결하지는 않습니다.",
    "템플릿 User comments3과 ex07 scope sample 사람 값은 존재/shape만 검증하고 source match value는 절대 stdout에 쓰지 않습니다.",
    "audit은 EL evaluation0, session creation0, application mutation0, HTTP0이며 owned temp copy만 제거합니다.",
  ],
  concepts: [
    { term: "scope graph", definition: "각 attribute key가 어느 scope에 쓰이고 어떤 EL lookup이 읽는지 연결한 provenance graph입니다.", detail: ["writes와 reads를 셉니다.", "값은 공개하지 않습니다."] },
    { term: "raw EL sink", definition: "EL evaluation 결과가 별도 escaping primitive 없이 template output에 직접 놓인 지점입니다.", detail: ["EL과 encoding은 별개입니다.", "provenance를 추적합니다."] },
    { term: "container-free evidence", definition: "실제 EL evaluation 없이 source shape와 hashes만 검증하는 제한된 evidence입니다.", detail: ["session을 만들지 않습니다.", "runtime claim과 구분합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-jsp03-audit",
    title: "원본3 hash·EL/scope shape·privacy를 검증합니다",
    language: "powershell",
    filename: "verify-original-jsp03.ps1",
    purpose: "사람 값과 JSP output을 공개하지 않고 direct source의 expression·scope·risk evidence를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ('jsp03 audit '+[Guid]::NewGuid().ToString('N'));$owned=$false;$failure=$null
function Count([string]$text,[string]$pattern){([regex]::Matches($text,$pattern)).Count}
try{
  New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$owned=$true
  $rels=@('src/main/webapp/day03/ex01_EL.jsp','src/main/webapp/day02/ex05_error.jsp','src/main/webapp/day02/ex07_Attribute.jsp')
  $raw='';$hashes=0
  for($i=0;$i-lt$rels.Count;$i++){
    $source=Get-Item -LiteralPath (Join-Path $SourceRoot $rels[$i]);$copy=Join-Path $root ($i.ToString()+'.jsp')
    [IO.File]::Copy($source.FullName,$copy)
    if((Get-FileHash $source.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $copy -Algorithm SHA256).Hash){throw 'hash drift'}
    $hashes++;$raw+=[IO.File]::ReadAllText($copy)+[Environment]::NewLine
  }
  $users=Count $raw '(?m)^\s*User\s*:';$active=[regex]::Replace($raw,'(?s)<%--.*?--%>','')
  $shape=[ordered]@{
    page=Count $active '<%@\s*page\b';expression=Count $active '<%=';scriptlet=Count $active '<%(?![@!=\-])'
    el=Count $active '\$\{';empty=Count $active '\bempty\s+';requestWrite=Count $active 'request\.setAttribute\s*\('
    pageWrite=Count $active 'pageContext\.setAttribute\s*\(';sessionWrite=Count $active 'session\.setAttribute\s*\('
    applicationWrite=Count $active 'application\.setAttribute\s*\(';explicitName=Count $active '\$\{(?:page|request|session|application)Scope\.name\}'
    unscopedName=Count $active '\$\{name\}';rawStr=Count $active '\$\{str\}';javaIntDivision=Count $active '<%=\s*15\s*/\s*7\s*%>'
  }
  $expected=@{page=3;expression=10;scriptlet=5;el=54;empty=10;requestWrite=2;pageWrite=7;sessionWrite=1;applicationWrite=1;explicitName=4;unscopedName=1;rawStr=2;javaIntDivision=1}
  foreach($name in $expected.Keys){if($shape[$name]-ne$expected[$name]){throw ('shape drift: '+$name)}}
  if($hashes-ne3-or$users-ne3){throw 'coverage drift'}
  'files=3,hashes=3,direct=3,closure=3|active=page3,expression10,scriptlet5,el54,empty10|writes=page7,request2,session1,application1|lookup=explicitName4,unscopedName1|risk=rawStr2,javaIntDivision1'
  'privacy=templateUser:3,value:not-emitted|samplePeople:value:not-emitted|container:not-started|EL:not-evaluated|original:read-only'
}catch{$failure=$_.Exception}finally{
  if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item -LiteralPath $resolved -Recurse -Force}
  if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}
}`,
    walkthrough: [
      { lines: "1-6", explanation: "value-free count audit와 direct-child temp를 준비합니다." },
      { lines: "7-16", explanation: "direct3을 copy하고 SHA-256 동일성을 검증합니다." },
      { lines: "17-29", explanation: "JSP comments 밖 EL·scope writes·lookup·raw sink shape를 셉니다." },
      { lines: "30-32", explanation: "expected evidence와 privacy markers를 출력하고 owned temp만 정리합니다." },
    ],
    run: { environment: ["PowerShell 7+", "jspstudy project root", "JSP/EL container 불필요"], command: "pwsh -NoProfile -File verify-original-jsp03.ps1 -SourceRoot <jspstudy-project-root>" },
    output: { value: "files=3,hashes=3,direct=3,closure=3|active=page3,expression10,scriptlet5,el54,empty10|writes=page7,request2,session1,application1|lookup=explicitName4,unscopedName1|risk=rawStr2,javaIntDivision1\nprivacy=templateUser:3,value:not-emitted|samplePeople:value:not-emitted|container:not-started|EL:not-evaluated|original:read-only", explanation: ["EL을 실행하지 않고 source facts만 증명합니다.", "템플릿/사람 값은 비공개입니다.", "scope writes와 raw sinks를 숨기지 않습니다."] },
    experiments: [
      { change: "JSP comments를 포함해 empty를 셉니다.", prediction: "설명 text가 섞여 count가 달라질 수 있습니다.", result: "active syntax만 셉니다." },
      { change: "EL 결과를 얻으려고 JSP를 직접 HTTP 호출합니다.", prediction: "session/application mutation과 local environment 노출이 생길 수 있습니다.", result: "audit와 integration을 분리합니다." },
      { change: "scope setAttribute의 두 번째 argument를 출력합니다.", prediction: "sample 사람 값이 노출됩니다.", result: "key/count만 사용합니다." },
    ],
    sourceRefs: ["source-jsp03-el", "source-jsp03-error", "source-jsp03-scope"],
  }],
  diagnostics: [
    { symptom: "EL count가 예상과 다릅니다.", likelyCause: "JSP comments를 포함했거나 source가 drift했습니다.", checks: ["hash를 비교합니다.", "comment stripping 순서를 봅니다.", "direct3 목록을 확인합니다."], fix: "drift를 review하고 source fact를 의도적으로 갱신합니다.", prevention: "hash·shape를 한 evidence로 보존합니다." },
    { symptom: "audit output에 사람 값이 포함됩니다.", likelyCause: "setAttribute arguments 또는 source lines를 출력했습니다.", checks: ["stdout/artifacts를 scan합니다.", "regex match value를 봅니다.", "cache를 확인합니다."], fix: "값 없는 counts로 교체하고 공개 artifact를 정정합니다.", prevention: "privacy assertion과 publish scan을 둡니다." },
  ],
};

(session.chapters as DetailedSession["chapters"]).push(originalAudit);

const maintainedChapters: DetailedSession["chapters"] = [
  {
    id: "el-evaluation-context-resolver-chain",
    title: "EL을 문자열 치환이 아니라 evaluation context와 resolver chain으로 이해합니다",
    lead: "${name}은 source text 검색이 아니라 identifier→scope→property→coercion→operation의 단계적 평가입니다.",
    explanations: [
      "JSP의 ${...}는 page rendering 중 EL engine이 evaluation context에서 값을 계산하는 immediate expression입니다. JavaScript template literal과 이름이 비슷해도 별개 언어입니다.",
      "identifier는 implicit objects, scoped attributes, variables와 resolver chain을 통해 찾습니다. 찾은 base/property type에 따라 다음 resolver가 달라집니다.",
      "property access a.b는 단순 field text 치환이 아니라 bean/Map 등 base type에 맞는 resolver operation입니다. bracket a['b']는 dynamic key나 특수 key에 유용합니다.",
      "operator는 operands를 필요한 type으로 coerce한 뒤 평가합니다. 결과는 JSP writer로 변환되어 output되며 escaping 단계는 별도입니다.",
      "동적 사용자 문자열을 EL source로 만들어 evaluate하면 expression injection 위험이 생깁니다. expression source는 developer-owned template로 고정합니다.",
    ],
    concepts: [
      { term: "evaluation context", definition: "변수·functions·resolvers·locale 등 expression 평가에 필요한 환경입니다.", detail: ["request/page execution에 연결됩니다.", "문자열 검색이 아닙니다."] },
      { term: "ELResolver chain", definition: "base와 property를 어떤 source에서 어떤 type으로 해결할지 순서대로 시도하는 resolver 집합입니다.", detail: ["scope와 bean/map/list를 연결합니다.", "resolved 상태가 순서를 제어합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "${name}이 예상과 다른 값을 냅니다.", likelyCause: "같은 key가 더 앞 scope/resolver에 존재합니다.", checks: ["네 scope를 explicit 조회합니다.", "custom resolver ordering을 봅니다.", "attribute producer를 추적합니다."], fix: "고유 root model과 explicit scope를 사용합니다.", prevention: "unscoped global key 사용을 lint합니다." },
      { symptom: "사용자 입력이 EL로 실행됩니다.", likelyCause: "입력 문자열을 expression source로 동적 evaluate했습니다.", checks: ["ELProcessor/ExpressionFactory 호출을 찾습니다.", "template source owner를 봅니다.", "method/property access 범위를 봅니다."], fix: "입력은 value로만 전달하고 expression source를 고정합니다.", prevention: "dynamic EL evaluation을 금지·allowlist합니다." },
    ],
  },
  {
    id: "el-arithmetic-numeric-coercion",
    title: "Java 산술과 EL numeric coercion을 같은 기호만 보고 동일시하지 않습니다",
    lead: "특히 division·modulo·문자열 숫자·null은 결과 type과 실패 방식이 Java와 달라질 수 있습니다.",
    explanations: [
      "원본 <%=15/7%>는 두 int operands 때문에 Java integer division2입니다. 나머지는1입니다.",
      "EL / 또는 div는 EL specification의 numeric coercion과 division semantics를 따르므로 Java int truncation을 그대로 적용하면 안 됩니다.",
      "숫자처럼 보이는 String은 operator가 numeric type으로 coerce할 수 있지만 malformed/locale-formatted text는 예상과 다른 failure를 냅니다. controller에서 typed number를 넘깁니다.",
      "overflow, floating precision, BigDecimal rounding과 currency 계산은 view expression에 숨기지 말고 domain layer에서 명시합니다.",
      "예제는 실제 EL engine을 흉내 낸다고 주장하지 않고 Java int2와 decimal six-place2.142857의 사고 차이를 deterministic하게 보여 줍니다.",
    ],
    concepts: [
      { term: "numeric coercion", definition: "operator 요구에 맞게 operand를 numeric type으로 변환하는 EL 규칙입니다.", detail: ["source type을 숨길 수 있습니다.", "failure 정책을 알아야 합니다."] },
      { term: "integer truncation", definition: "Java integer division에서 소수 부분을 버리는 동작입니다.", detail: ["15/7은2입니다.", "EL division과 구분합니다."] },
    ],
    codeExamples: [{
      id: "java-el-arithmetic-mental-model",
      title: "Java int division과 decimal/coercion mental model을 exact 비교합니다",
      language: "java",
      filename: "ElArithmeticModel.java",
      purpose: "EL engine과 동일하다고 과장하지 않고 원본의 가장 중요한 결과 차이를 재현합니다.",
      code: String.raw`import java.math.BigDecimal;
import java.math.RoundingMode;

public class ElArithmeticModel {
    static BigDecimal decimalDivide(String left, String right) {
        BigDecimal divisor = new BigDecimal(right);
        if (divisor.signum() == 0) throw new ArithmeticException("division by zero");
        return new BigDecimal(left).divide(divisor, 6, RoundingMode.HALF_UP);
    }

    static boolean empty(Object value) {
        if (value == null) return true;
        if (value instanceof CharSequence text) return text.isEmpty();
        if (value instanceof java.util.Collection<?> values) return values.isEmpty();
        if (value instanceof java.util.Map<?, ?> values) return values.isEmpty();
        return false;
    }

    public static void main(String[] args) {
        System.out.println("javaInt=" + (15 / 7) + "|remainder=" + (15 % 7));
        System.out.println("decimalModel=" + decimalDivide("15", "7"));
        System.out.println("empty=null:" + empty(null) + ",text:" + empty("")
                + ",list:" + empty(java.util.List.of()) + ",value:" + empty("hello"));
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "문자열 숫자를 BigDecimal로 명시 coercion하고 rounding·zero 정책을 고정합니다." },
        { lines: "11-17", explanation: "null·CharSequence·Collection·Map의 empty mental model을 분기합니다." },
        { lines: "19-24", explanation: "Java int, decimal model, empty cases를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "EL mental model; actual EL integration 별도"], command: isolatedJavaRun("ElArithmeticModel.java", "ElArithmeticModel") },
      output: { value: "javaInt=2|remainder=1\ndecimalModel=2.142857\nempty=null:true,text:true,list:true,value:false", explanation: ["Java int division은2입니다.", "decimal model은 six-place 결과를 보존합니다.", "empty categories를 명시합니다."] },
      experiments: [
        { change: "right를0으로 바꿉니다.", prediction: "division by zero failure가 납니다.", result: "view가 아니라 controller/domain에서 오류 정책을 정합니다." },
        { change: "left를 locale text 1,5로 바꿉니다.", prediction: "BigDecimal parse가 실패합니다.", result: "locale parse와 arithmetic model을 분리합니다." },
        { change: "rounding scale을2로 바꿉니다.", prediction: "2.14가 됩니다.", result: "화면에서 임의 반올림하지 말고 domain/format 정책을 명시합니다." },
      ],
      sourceRefs: ["source-jsp03-el", "jakarta-el-spec", "java-big-decimal"],
    }],
    diagnostics: [
      { symptom: "EL 15/7을 Java와 같은2로 예상했습니다.", likelyCause: "기호가 같다는 이유로 언어별 division semantics를 혼동했습니다.", checks: ["operand types를 적습니다.", "EL spec/operator table을 봅니다.", "real container에서 exact result/type을 확인합니다."], fix: "금액/정밀 계산은 controller/domain typed value로 넘깁니다.", prevention: "Java/EL 결과 비교 test를 교육 자료에 둡니다." },
      { symptom: "숫자 문자열 하나 때문에 page evaluation이 실패합니다.", likelyCause: "view에서 implicit numeric coercion에 의존했습니다.", checks: ["original attribute type을 봅니다.", "malformed/blank/null을 test합니다.", "locale separator를 확인합니다."], fix: "controller에서 parse·validate해 Number를 model에 넣습니다.", prevention: "view model schema에 runtime types를 명시합니다." },
    ],
  },
  {
    id: "comparison-logical-ternary-coercion",
    title: "비교·논리·ternary를 display decision으로 제한하고 operand type을 명시합니다",
    lead: "짧은 조건식은 편리하지만 null·문자열 숫자·boolean coercion이 업무 규칙을 조용히 바꿀 수 있습니다.",
    explanations: [
      "==/eq, !=/ne, </lt, >/gt, <=/le, >=/ge는 표기만 다르고 평가 전에 type 관계와 coercion이 중요합니다.",
      "&&/and, ||/or, !/not는 boolean coercion을 요구합니다. 문자열 'false'와 Boolean false를 같은 model로 취급하지 않습니다.",
      "ternary는 간단한 presentation label 선택에 적합하지만 authorization·가격·상태 전이 같은 업무 결정을 넣으면 view와 backend가 diverge합니다.",
      "null 비교가 false/true로 끝나더라도 attribute misspelling이 정상 branch처럼 보일 수 있습니다. required model key는 render 전에 assert합니다.",
      "복잡한 조건은 controller가 enum/display state를 계산하고 EL은 state equality 또는 단순 boolean만 읽게 합니다.",
    ],
    concepts: [
      { term: "boolean coercion", definition: "조건 context에서 값을 Boolean 의미로 변환하는 규칙입니다.", detail: ["null/missing을 숨길 수 있습니다.", "typed Boolean을 선호합니다."] },
      { term: "display decision", definition: "업무 상태를 바꾸지 않고 이미 결정된 model을 어느 label/component로 보여 줄지 선택하는 조건입니다.", detail: ["side effect가 없습니다.", "권한 판단과 분리합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "조건이 항상 false라 component가 조용히 사라집니다.", likelyCause: "attribute key 오타, null 또는 String/Number type mismatch가 coercion으로 숨었습니다.", checks: ["explicit scope와 runtime type을 봅니다.", "required key assertion을 봅니다.", "negative/positive cases를 test합니다."], fix: "controller가 typed boolean/enum을 제공하고 missing은 render contract failure로 처리합니다.", prevention: "view model schema test를 둡니다." },
      { symptom: "JSP와 backend의 권한 결과가 다릅니다.", likelyCause: "authorization 규칙을 EL ternary/if로 다시 구현했습니다.", checks: ["view 조건을 inventory합니다.", "server action endpoint의 authorization을 봅니다.", "state source를 비교합니다."], fix: "backend가 권한을 강제하고 view에는 display capability만 제공합니다.", prevention: "view hiding을 security control로 취급하지 않습니다." },
    ],
  },
  {
    id: "empty-null-missing-state",
    title: "empty의 편리함과 missing·null·empty domain state를 분리합니다",
    lead: "화면에 아무것도 없다는 같은 결과도 데이터 없음, key 오타, 권한 필터, 조회 실패는 전혀 다른 상태입니다.",
    explanations: [
      "empty는 null, empty String, length0 array, empty Collection/Map 등에 true를 제공해 view 분기를 간단하게 합니다.",
      "숫자0, Boolean false, whitespace string, object with empty fields는 자동으로 empty가 아닙니다. domain 정의와 operator 정의를 구분합니다.",
      "missing attribute도 null처럼 보일 수 있어 `${empty model}`이 typo를 정상 empty state로 숨길 수 있습니다. required root model은 controller/test에서 보장합니다.",
      "목록 없음은 immutable empty list로 정규화하면 null branch를 줄일 수 있지만 database 실패까지 empty list로 삼키면 안 됩니다.",
      "UI는 loading/not-loaded, empty, forbidden, failed, ready states를 typed enum/sealed outcome으로 구분하고 EL은 그 결과만 렌더합니다.",
    ],
    concepts: [
      { term: "empty operator", definition: "값이 null이거나 지원하는 container/string이 비었는지 검사하는 EL unary operator입니다.", detail: ["domain empty와 다릅니다.", "missing도 true처럼 보일 수 있습니다."] },
      { term: "empty-state normalization", definition: "성공적으로 조회된 결과 없음은 null 대신 immutable empty collection과 명시 상태로 표현하는 설계입니다.", detail: ["loop가 안전합니다.", "실패와 구분합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "DB 장애인데 '데이터 없음'으로 표시됩니다.", likelyCause: "exception/null을 empty list로 무조건 정규화했습니다.", checks: ["producer outcome을 봅니다.", "error telemetry를 봅니다.", "empty와 failure model을 구분합니다."], fix: "success-empty와 failed를 다른 typed states로 전달합니다.", prevention: "empty/failure/forbidden fixtures를 각각 둡니다." },
      { symptom: "공백만 있는 문자열이 empty false입니다.", likelyCause: "EL empty가 whitespace trim 의미까지 제공한다고 오해했습니다.", checks: ["raw string length를 봅니다.", "validation normalization을 봅니다.", "business blank 정의를 확인합니다."], fix: "controller validation에서 trim/Unicode whitespace 정책을 적용합니다.", prevention: "blank normalization을 view 밖에 둡니다." },
    ],
  },
  {
    id: "scope-search-order-shadowing",
    title: "unscoped identifier의 page→request→session→application shadowing을 deterministic하게 재현합니다",
    lead: "가까운 scope가 같은 이름을 가리면 더 긴 수명의 값은 존재해도 보이지 않으므로 implicit dependency가 생깁니다.",
    explanations: [
      "JSP EL scoped attribute lookup은 page, request, session, application 순으로 처음 발견한 같은 key를 선택합니다.",
      "원본은 name을 네 scopes에 넣고 page 값을 다시 덮으므로 ${name}은 마지막 page value를 선택합니다. 값 자체는 privacy 때문에 공개하지 않습니다.",
      "page attribute를 제거하면 같은 expression이 request 값을, request도 제거하면 session 값을 선택해 page behavior가 먼 shared state에 의존합니다.",
      "scope shadowing은 의도한 override일 수도 있지만 rename/type change가 다른 page에 영향을 줄 수 있습니다. 고유 root key와 explicit scope가 안전합니다.",
      "예제는 개인 값 대신 page/request/session/application labels로 lookup과 removal을 exact 검증합니다.",
    ],
    concepts: [
      { term: "scope shadowing", definition: "앞선 짧은 scope의 같은 key가 뒤 scope의 값을 가려 unscoped lookup 결과를 결정하는 현상입니다.", detail: ["order-dependent입니다.", "type도 달라질 수 있습니다."] },
      { term: "findAttribute", definition: "page→request→session→application 순으로 attribute를 찾는 page context lookup semantics입니다.", detail: ["첫 match를 반환합니다.", "missing이면 null입니다."] },
    ],
    codeExamples: [{
      id: "java-el-scope-resolution",
      title: "네 scope의 같은 key lookup과 explicit access를 exact 검증합니다",
      language: "java",
      filename: "ElScopeResolution.java",
      purpose: "Servlet/JSP container 없이 stable scope search order와 shadow removal을 모델링합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ElScopeResolution {
    record Scope(String name, Map<String, Object> values) {}

    static Object find(List<Scope> scopes, String key) {
        for (Scope scope : scopes) {
            if (scope.values().containsKey(key)) return scope.values().get(key);
        }
        return null;
    }

    public static void main(String[] args) {
        Map<String, Object> page = new LinkedHashMap<>(Map.of("name", "page"));
        Scope request = new Scope("request", Map.of("name", "request"));
        Scope session = new Scope("session", Map.of("name", "session"));
        Scope application = new Scope("application", Map.of("name", "application"));
        List<Scope> scopes = List.of(new Scope("page", page), request, session, application);
        System.out.println("unscoped=" + find(scopes, "name"));
        System.out.println("explicit=" + request.values().get("name") + "," + session.values().get("name") + "," + application.values().get("name"));
        page.remove("name");
        System.out.println("afterPageRemove=" + find(scopes, "name") + "|missing=" + find(scopes, "none"));
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "ordered Scope list와 containsKey 기반 first-match lookup을 정의합니다." },
        { lines: "13-19", explanation: "privacy-neutral labels로 네 scopes의 same key를 만듭니다." },
        { lines: "20-24", explanation: "unscoped/explicit 결과와 page removal 뒤 fallback을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "container-neutral"], command: isolatedJavaRun("ElScopeResolution.java", "ElScopeResolution") },
      output: { value: "unscoped=page\nexplicit=request,session,application\nafterPageRemove=request|missing=null", explanation: ["가장 가까운 page가 먼저 선택됩니다.", "page 제거 뒤 request로 fallback합니다."] },
      experiments: [
        { change: "request name type을 Integer로 바꿉니다.", prediction: "page 제거 순간 expression result type도 바뀝니다.", result: "shadow key의 type contract를 통일하거나 고유 key를 씁니다." },
        { change: "scope 순서를 application-first로 바꿉니다.", prediction: "unscoped=application이 됩니다.", result: "실제 규격 순서를 test로 고정합니다." },
        { change: "containsKey 대신 get!=null을 사용합니다.", prediction: "explicit null attribute와 missing을 구분하지 못합니다.", result: "presence와 value를 구분합니다." },
      ],
      sourceRefs: ["source-jsp03-scope", "jakarta-pages-spec", "jakarta-el-spec"],
    }],
    diagnostics: [
      { symptom: "session 값을 바꿨는데 page가 그대로입니다.", likelyCause: "page/request의 같은 key가 session을 shadow합니다.", checks: ["네 explicit scope 값을 봅니다.", "setAttribute producers를 찾습니다.", "page include/tag scope를 확인합니다."], fix: "고유 request root model을 사용하거나 intended scope를 명시합니다.", prevention: "cross-scope duplicate key lint를 둡니다." },
      { symptom: "한 page에서 key 제거 후 runtime type이 갑자기 바뀝니다.", likelyCause: "뒤 scope의 같은 key가 다른 type입니다.", checks: ["scope별 runtime type을 기록합니다.", "removal/invalidation event를 봅니다.", "unscoped expression을 찾습니다."], fix: "scope-independent key/type contracts로 rename합니다.", prevention: "view model schema와 explicit scopes를 사용합니다." },
    ],
  },
  {
    id: "explicit-scope-lifetime-concurrency",
    title: "explicit scope maps로 dependency를 드러내고 수명·동시성 비용을 계산합니다",
    lead: "값을 찾는 정확성뿐 아니라 page<request<session<application으로 길어지는 수명과 공유도를 함께 봅니다.",
    explanations: [
      "pageScope는 현재 page execution에 한정되고 include/tag boundaries에서 기대 범위를 확인해야 합니다. local rendering scratch에만 씁니다.",
      "requestScope는 controller→forwarded view model에 적합하며 redirect의 새 request에는 이어지지 않습니다.",
      "sessionScope는 같은 session의 여러 requests/tabs에 공유되고 concurrent mutation·stale data·memory·serialization·logout cleanup을 설계해야 합니다.",
      "applicationScope는 전 사용자·요청에 공유되어 immutable config 또는 thread-safe bounded service reference만 적합합니다. request/user data를 두지 않습니다.",
      "explicit scope는 잘못된 긴 수명 선택을 정당화하지 않습니다. 가장 짧은 충분한 scope와 immutable values를 우선합니다.",
    ],
    concepts: [
      { term: "explicit scope map", definition: "pageScope/requestScope/sessionScope/applicationScope로 특정 저장소를 직접 조회하는 EL implicit map입니다.", detail: ["shadowing을 피합니다.", "dependency가 보입니다."] },
      { term: "scope amplification", definition: "값을 더 긴 scope에 둘수록 접근 사용자·동시성·retention·cleanup 비용이 커지는 현상입니다.", detail: ["최소 수명을 택합니다.", "mutable 공유를 피합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "logout 후에도 민감 화면 값이 남습니다.", likelyCause: "session/application에 불필요한 view data를 저장하고 제거하지 않았습니다.", checks: ["scope writes를 inventory합니다.", "invalidate/remove path를 봅니다.", "cache와 browser history도 봅니다."], fix: "request scope로 줄이고 logout에 session invalidation과 cache headers를 적용합니다.", prevention: "scope retention/privacy review를 둡니다." },
      { symptom: "같은 session의 두 tab이 서로 form 값을 덮습니다.", likelyCause: "request별 mutable form model을 session scope에 같은 key로 저장했습니다.", checks: ["concurrent tabs를 재현합니다.", "session key를 봅니다.", "model mutability를 확인합니다."], fix: "request/flow-specific token storage로 이동하고 immutable snapshots를 사용합니다.", prevention: "same-session concurrent request test를 둡니다." },
    ],
  },
  {
    id: "bean-map-list-property-resolution",
    title: "bean getter·Map key·List/array index resolver를 base type별로 추적합니다",
    lead: "점 표기 하나가 private field를 읽는다고 단순화하지 말고 실제 resolver와 property contract를 봅니다.",
    explanations: [
      "bean.title은 JavaBeans property descriptor의 getTitle/isTitle 같은 readable method를 통해 값을 얻습니다. private field 이름만 같고 getter가 없으면 같은 계약이 아닙니다.",
      "Map base에서 .title 또는 ['title']은 key lookup으로 해석됩니다. 특수문자·공백·dynamic key는 bracket가 더 명확합니다.",
      "List/array base에서 numeric property/index는 위치 접근입니다. out-of-range와 nonnumeric key behavior를 실제 EL 구현에서 확인하고 view에서 index를 최소화합니다.",
      "base가 null이면 chained property가 null처럼 흘러 blank를 만들 수 있어 root model 누락을 숨길 수 있습니다. required roots를 render 전에 검증합니다.",
      "예제는 Introspector로 JavaBeans getter, Map key, List index를 분리해 같은 dot-like 표현 뒤의 서로 다른 operation을 보여 줍니다.",
    ],
    concepts: [
      { term: "JavaBeans property", definition: "getter/setter naming convention과 descriptor로 노출되는 logical property입니다.", detail: ["field 직접 접근과 다릅니다.", "readable getter가 필요합니다."] },
      { term: "base/property pair", definition: "a.b 평가에서 a의 runtime base type과 b key가 resolver 선택을 결정하는 입력입니다.", detail: ["Map과 bean이 다릅니다.", "chained null을 추적합니다."] },
    ],
    codeExamples: [{
      id: "java-el-property-resolution",
      title: "JavaBeans getter·Map key·List index를 deterministic resolver로 읽습니다",
      language: "java",
      filename: "ElPropertyResolution.java",
      purpose: "실제 EL engine과 구분된 JDK-only resolver fixture로 property access mental model을 검증합니다.",
      code: String.raw`import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.util.List;
import java.util.Map;

public class ElPropertyResolution {
    public static final class Book {
        private final String title;
        public Book(String title) { this.title = title; }
        public String getTitle() { return title; }
    }

    static Object bean(Object base, String property) throws Exception {
        for (PropertyDescriptor descriptor : Introspector.getBeanInfo(base.getClass()).getPropertyDescriptors()) {
            if (descriptor.getName().equals(property) && descriptor.getReadMethod() != null)
                return descriptor.getReadMethod().invoke(base);
        }
        throw new IllegalArgumentException("missing property: " + property);
    }

    public static void main(String[] args) throws Exception {
        Book book = new Book("JSP");
        Map<String, String> map = Map.of("state", "ready");
        List<String> list = List.of("first", "second");
        System.out.println("bean=" + bean(book, "title"));
        System.out.println("map=" + map.get("state"));
        System.out.println("list=" + list.get(1));
        System.out.println("missingMap=" + map.get("none"));
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "private field와 public JavaBeans getter가 있는 Book을 정의합니다." },
        { lines: "13-19", explanation: "Introspector descriptor에서 readable getter만 찾아 호출합니다." },
        { lines: "21-29", explanation: "bean, Map, List와 missing key를 각각 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "EL mental model; actual resolver integration 별도"], command: isolatedJavaRun("ElPropertyResolution.java", "ElPropertyResolution") },
      output: { value: "bean=JSP\nmap=ready\nlist=second\nmissingMap=null", explanation: ["bean title은 getter 결과입니다.", "Map missing은 null, List index1은 second입니다."] },
      experiments: [
        { change: "getTitle을 제거합니다.", prediction: "missing property failure가 납니다.", result: "private field만으로 bean property가 보장되지 않습니다." },
        { change: "list.get(2)로 바꿉니다.", prediction: "IndexOutOfBoundsException이 납니다.", result: "view에 fragile numeric indexing을 최소화합니다." },
        { change: "Map에 title key를 넣습니다.", prediction: "같은 property text라도 Map key lookup으로 해결됩니다.", result: "runtime base type을 진단에 포함합니다." },
      ],
      sourceRefs: ["jakarta-el-spec", "java-beans-introspector", "java-property-descriptor"],
    }],
    diagnostics: [
      { symptom: "${book.title}이 blank 또는 property-not-found입니다.", likelyCause: "book이 null, getter가 없거나 getter 이름/type이 contract와 다릅니다.", checks: ["request root 존재를 봅니다.", "getTitle visibility를 봅니다.", "runtime class/proxy를 확인합니다."], fix: "readable bean property 또는 명시 DTO를 제공하고 required root를 assert합니다.", prevention: "view DTO contract test를 둡니다." },
      { symptom: "${items[1]}이 환경/데이터에 따라 실패합니다.", likelyCause: "list가 null·짧거나 base가 예상 type이 아닙니다.", checks: ["collection size/type을 봅니다.", "empty state를 확인합니다.", "index source를 추적합니다."], fix: "forEach와 named properties를 사용하고 controller가 최소 cardinality를 검증합니다.", prevention: "empty/one/many fixtures를 둡니다." },
    ],
  },
  {
    id: "model-contract-null-errors",
    title: "EL의 null 관용성을 view-model contract validation으로 보완합니다",
    lead: "blank page를 정상처럼 보이게 하는 대신 required·optional·empty·failed를 producer에서 명시합니다.",
    explanations: [
      "EL은 많은 missing/null access를 null/empty output으로 흘려 page를 계속 렌더할 수 있습니다. 사용자 경험에는 좋을 수 있지만 key typo와 backend regression도 숨깁니다.",
      "required root model은 controller test 또는 rendering adapter에서 존재/type을 assert하고 optional fields는 Optional 자체보다 명시 display state로 변환합니다.",
      "error message attribute 하나만 넘기면 status·field errors·recovery action·correlation id가 섞입니다. safe structured ErrorView를 사용합니다.",
      "internal exception message는 SQL/path/secret/PII를 포함할 수 있어 EL로 직접 보여 주지 않습니다. public code/message와 private cause를 분리합니다.",
      "EL evaluation error도 이미 response가 commit된 뒤 발생할 수 있으므로 model validation을 render 전 수행하고 global error mapping을 둡니다.",
    ],
    concepts: [
      { term: "view-model contract", definition: "JSP가 읽을 root keys, runtime types, required/optional 상태와 output contexts를 정의한 계약입니다.", detail: ["producer와 consumer가 공유합니다.", "render 전 검증합니다."] },
      { term: "safe error view", definition: "공개 가능한 오류 code/message/recovery/correlation만 포함하고 internal cause를 제외한 model입니다.", detail: ["status와 연결됩니다.", "text encoding이 필요합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "attribute key 오타인데 빈 화면만 나옵니다.", likelyCause: "missing null을 정상 optional로 취급했습니다.", checks: ["producer/consumer key를 비교합니다.", "required model assertion을 봅니다.", "EL evaluation trace를 봅니다."], fix: "required root schema를 render 전에 fail-fast 검증합니다.", prevention: "controller-view contract integration test를 둡니다." },
      { symptom: "오류 page에 SQL/path/stack이 보입니다.", likelyCause: "exception.getMessage 또는 raw internal attribute를 EL로 출력했습니다.", checks: ["error producer를 추적합니다.", "public model fields를 봅니다.", "log/body를 비교합니다."], fix: "safe ErrorView와 private correlation log로 분리합니다.", prevention: "error response secret/PII regression scan을 둡니다." },
    ],
  },
  {
    id: "el-output-context-xss",
    title: "EL evaluation과 HTML-safe rendering을 별도 단계로 유지합니다",
    lead: "값을 쉽게 찾는 언어가 그 값을 어느 parser context에 안전하게 넣는지까지 결정해 주지는 않습니다.",
    explanations: [
      "${str}, ${book.title}, ${param.q}를 HTML에 직접 놓으면 결과 String이 markup-significant characters를 포함할 때 구조가 바뀔 수 있습니다.",
      "HTML text는 c:out 또는 framework encoder를 사용하고 attribute는 quoted safe attribute primitive, URL은 c:url+component encoding, JavaScript는 inline 연결을 피합니다.",
      "error message도 attacker-controlled input을 되풀이할 수 있어 trusted system text라고 가정하지 않습니다. source→transform→sink provenance를 추적합니다.",
      "double encoding은 이미 encoded String을 다시 encode할 때 생깁니다. model에는 raw semantic data를 두고 최종 renderer에서 한 번 encode합니다.",
      "예제는 missing value를 explicit fallback으로 바꾸고 malicious title을 HTML text로 encode해 null/XSS를 함께 다룹니다.",
    ],
    concepts: [
      { term: "evaluation vs rendering", definition: "EL이 semantic value를 계산하는 단계와 그 value를 HTML/URL/JS bytes로 안전하게 직렬화하는 단계를 구분하는 원칙입니다.", detail: ["EL 결과는 raw value입니다.", "sink에서 encode합니다."] },
      { term: "double encoding", definition: "이미 presentation-encoded된 문자열을 다시 encode해 entity text가 화면에 노출되는 오류입니다.", detail: ["raw data를 model에 둡니다.", "한 rendering boundary만 둡니다."] },
    ],
    codeExamples: [{
      id: "java-el-output-safety",
      title: "required/fallback value와 HTML text encoding을 exact 적용합니다",
      language: "java",
      filename: "ElOutputSafety.java",
      purpose: "EL result를 raw semantic value로 본 뒤 final HTML text renderer에서 안전하게 변환합니다.",
      code: String.raw`import java.util.Map;

public class ElOutputSafety {
    static String optionalText(Map<String, String> model, String key, String fallback) {
        String value = model.get(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    static String htmlText(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }

    public static void main(String[] args) {
        Map<String, String> model = Map.of("title", "<img src=x onerror=alert(1)>");
        String title = optionalText(model, "title", "untitled");
        String subtitle = optionalText(model, "subtitle", "none");
        System.out.println("title=" + htmlText(title));
        System.out.println("subtitle=" + htmlText(subtitle));
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "optional key의 null/blank policy를 raw semantic 단계에서 정합니다." },
        { lines: "9-12", explanation: "HTML text parser-significant characters를 final renderer에서 encode합니다." },
        { lines: "14-20", explanation: "malicious title과 missing subtitle fallback을 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "HTML text context only"], command: isolatedJavaRun("ElOutputSafety.java", "ElOutputSafety") },
      output: { value: "title=&lt;img src=x onerror=alert(1)&gt;\nsubtitle=none", explanation: ["img text가 markup으로 실행되지 않습니다.", "missing subtitle는 explicit fallback입니다."] },
      experiments: [
        { change: "encoded title을 model에 저장하고 다시 htmlText합니다.", prediction: "&amp;lt;처럼 double encoding됩니다.", result: "model에는 raw data를 둡니다." },
        { change: "title을 unquoted attribute에 넣습니다.", prediction: "HTML text encoder와 다른 위험이 생깁니다.", result: "quoted attribute-safe primitive를 사용합니다." },
        { change: "error query를 message에 연결합니다.", prediction: "escape가 없으면 reflected XSS가 됩니다.", result: "error view도 같은 output policy를 적용합니다." },
      ],
      sourceRefs: ["source-jsp03-error", "source-jsp03-el", "jakarta-tags-out", "owasp-xss", "whatwg-html"],
    }],
    diagnostics: [
      { symptom: "error/title 값의 tag가 실행됩니다.", likelyCause: "EL direct output을 자동 escaping으로 오해했습니다.", checks: ["rendered raw response를 봅니다.", "source provenance를 추적합니다.", "sink context를 식별합니다."], fix: "HTML text c:out/encoder와 context-specific primitives를 사용합니다.", prevention: "malicious model regression과 CSP를 둡니다." },
      { symptom: "화면에 &lt;가 글자 그대로 보입니다.", likelyCause: "controller가 미리 encode한 값을 renderer가 다시 encode했습니다.", checks: ["model stored value를 봅니다.", "encoding call count를 추적합니다.", "trusted markup escapeXml=false 사용을 찾습니다."], fix: "raw semantic data와 single final encoding boundary를 복원합니다.", prevention: "encoded String을 domain/view model에 저장하지 않습니다." },
    ],
    expertNotes: ["EL의 장점은 view syntax를 줄이는 것이지 타입·scope·security 계약을 없애는 것이 아닙니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...maintainedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "source-jsp03-el", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day03/ex01_EL.jsp", usedFor: ["arithmetic", "comparison", "logical", "ternary", "empty", "page attributes"], evidence: "inventory direct EL source를 read-only audit했습니다." },
  { id: "source-jsp03-error", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex05_error.jsp", usedFor: ["raw error EL output", "XSS boundary"], evidence: "error sink를 producer와 분리해 감사했습니다." },
  { id: "source-jsp03-scope", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex07_Attribute.jsp", usedFor: ["scope order", "shadowing", "explicit scope maps", "privacy"], evidence: "같은 key의 네 scope writes를 값 미출력으로 확인했습니다." },
  { id: "jakarta-el-spec", repository: "Jakarta EE", path: "Jakarta Expression Language 6.0 Specification", publicUrl: "https://jakarta.ee/specifications/expression-language/6.0/jakarta-expression-language-spec-6.0.pdf", usedFor: ["evaluation", "operators", "coercion", "resolvers"], evidence: "EL primary specification입니다." },
  { id: "jakarta-el-api", repository: "Jakarta EE", path: "Jakarta Expression Language 6.0 API", publicUrl: "https://jakarta.ee/specifications/expression-language/6.0/apidocs/", usedFor: ["ELContext", "ELResolver", "ValueExpression"], evidence: "EL primary API documentation입니다." },
  { id: "jakarta-pages-spec", repository: "Jakarta EE", path: "Jakarta Server Pages 4.0 Specification", publicUrl: "https://jakarta.ee/specifications/pages/4.0/jakarta-server-pages-spec-4.0.pdf", usedFor: ["scoped attributes", "implicit objects", "EL in JSP"], evidence: "JSP primary specification입니다." },
  { id: "jakarta-pages-page-context", repository: "Jakarta EE", path: "PageContext API", publicUrl: "https://jakarta.ee/specifications/pages/4.0/apidocs/jakarta.servlet.jsp/jakarta/servlet/jsp/pagecontext", usedFor: ["findAttribute", "scope constants"], evidence: "page scope lookup primary API입니다." },
  { id: "jakarta-tags-out", repository: "Jakarta EE", path: "Jakarta Tags 3.0 c:out", publicUrl: "https://jakarta.ee/specifications/tags/3.0/tagdocs/c/out", usedFor: ["escaped view output"], evidence: "standard tag primary documentation입니다." },
  { id: "java-big-decimal", repository: "Java SE 21", path: "BigDecimal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html", usedFor: ["explicit decimal mental model"], evidence: "precision/rounding primary JDK API입니다." },
  { id: "java-beans-introspector", repository: "Java SE 21", path: "Introspector", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/beans/Introspector.html", usedFor: ["JavaBeans property discovery"], evidence: "bean introspection primary API입니다." },
  { id: "java-property-descriptor", repository: "Java SE 21", path: "PropertyDescriptor", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/beans/PropertyDescriptor.html", usedFor: ["getter resolution"], evidence: "bean property descriptor primary API입니다." },
  { id: "owasp-xss", repository: "OWASP", path: "XSS Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["contextual encoding", "dangerous contexts"], evidence: "output security 실무 기준입니다." },
  { id: "whatwg-html", repository: "WHATWG", path: "HTML syntax", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html", usedFor: ["HTML text parsing", "character references"], evidence: "browser parser primary standard입니다." },
);

const reviewPairs: Array<[string, string]> = [
  ["EL은 단순 문자열 치환인가요?", "아닙니다. evaluation context와 resolver chain에서 identifier/property/operator를 평가합니다."],
  ["${}는 JavaScript template literal과 같은가요?", "아닙니다. JSP EL과 JavaScript는 별개 언어·실행 위치입니다."],
  ["a.b는 항상 private field b를 읽나요?", "아닙니다. base type에 따라 JavaBeans getter, Map key 등 resolver가 선택됩니다."],
  ["EL source를 사용자 입력으로 만들어도 되나요?", "안 됩니다. expression injection 위험이 있어 source는 developer-owned로 고정합니다."],
  ["EL 결과는 자동 HTML-safe인가요?", "아닙니다. evaluation과 contextual rendering은 별도 단계입니다."],
  ["Java 15/7 결과는 무엇인가요?", "int operands이므로2입니다."],
  ["EL 15/7도 무조건2인가요?", "아닙니다. EL numeric coercion/division semantics를 따르므로 실제 spec/container로 확인합니다."],
  ["숫자 String을 view에서 계산해도 되나요?", "가능한 coercion에 기대기보다 controller가 parse·validate한 Number를 제공하는 편이 안전합니다."],
  ["금액 반올림을 EL에 두어도 되나요?", "업무 precision/rounding은 domain layer에 두고 view는 formatting만 합니다."],
  ["div와 /는 어떤 관계인가요?", "EL에서 division을 표현하는 동등한 operator 표기입니다."],
  ["eq와 ==는 어떤 관계인가요?", "EL equality의 textual/symbol 표기지만 operand coercion을 함께 봐야 합니다."],
  ["문자열 'false'와 Boolean false는 같은 model인가요?", "아닙니다. typed Boolean을 제공해 coercion ambiguity를 줄입니다."],
  ["ternary에 authorization을 넣어도 되나요?", "안 됩니다. backend가 권한을 강제하고 view는 display capability만 사용합니다."],
  ["missing key의 조건이 false면 정상인가요?", "key 오타가 숨을 수 있으므로 required model은 render 전에 검증합니다."],
  ["empty null 결과는 무엇인가요?", "true입니다."],
  ["empty 공백 문자열 결과도 true인가요?", "일반적으로 length가0이 아니므로 business blank normalization과 구분합니다."],
  ["empty 0은 true인가요?", "숫자0은 empty collection/string 의미가 아닙니다."],
  ["DB 실패를 empty list로 바꿔도 되나요?", "안 됩니다. success-empty와 failed 상태를 구분합니다."],
  ["missing attribute가 empty로 보일 수 있나요?", "네. null처럼 평가되어 typo를 숨길 수 있습니다."],
  ["unscoped name의 검색 순서는?", "page→request→session→application입니다."],
  ["page와 request에 같은 key가 있으면?", "page value가 먼저 선택되어 request를 shadow합니다."],
  ["page key를 제거하면?", "다음으로 가까운 request key가 선택됩니다."],
  ["scope별 같은 key의 type이 달라도 되나요?", "가능하더라도 shadow 제거 시 type이 바뀌므로 피하고 계약을 분리합니다."],
  ["explicit requestScope의 장점은?", "어느 저장소를 읽는지 보여 shadowing과 암묵 dependency를 줄입니다."],
  ["explicit scope면 긴 수명 사용이 안전한가요?", "아닙니다. session/application의 동시성·retention 비용은 그대로입니다."],
  ["request scope는 redirect 후 유지되나요?", "아닙니다. 새 request에는 자동으로 이어지지 않습니다."],
  ["session scope는 같은 tab만 공유하나요?", "같은 session의 여러 tabs/requests가 공유할 수 있습니다."],
  ["application scope에 사용자 model을 둬도 되나요?", "안 됩니다. 전 사용자에게 공유되므로 immutable config/thread-safe service 정도로 제한합니다."],
  ["bean.title은 어떤 method를 기대하나요?", "일반적으로 readable JavaBeans getTitle 같은 getter를 기대합니다."],
  ["Map의 .state는 무엇인가요?", "state key lookup으로 해결될 수 있습니다."],
  ["List property는 어떻게 접근하나요?", "numeric index로 접근할 수 있지만 empty/out-of-range를 피하도록 forEach를 선호합니다."],
  ["base가 null이면 왜 위험한가요?", "chained access가 blank로 흘러 required root 누락을 숨길 수 있습니다."],
  ["view-model contract에는 무엇이 있나요?", "root keys, runtime types, required/optional states와 output contexts가 있습니다."],
  ["exception.getMessage를 error EL로 보여도 되나요?", "안 됩니다. 내부 SQL/path/secret/PII가 포함될 수 있습니다."],
  ["safe error model은 무엇을 담나요?", "공개 code/message/recovery와 correlation id만 담고 internal cause는 제외합니다."],
  ["c:out은 왜 쓰나요?", "HTML/XML text escaping 의도를 드러내지만 모든 context의 만능 해결책은 아닙니다."],
  ["double encoding은 왜 생기나요?", "controller에서 encode한 값을 renderer가 다시 encode했기 때문입니다."],
  ["model에는 encoded HTML을 저장하나요?", "아닙니다. raw semantic data를 두고 final sink에서 한 번 encode합니다."],
  ["HTML text encoder를 JavaScript에도 쓰나요?", "안 됩니다. inline JS 연결을 피하고 context 전용 serializer를 사용합니다."],
  ["JDK resolver model이 실제 EL 구현을 증명하나요?", "아닙니다. mental model이며 실제 coercion/resolver는 Jakarta EL integration test가 필요합니다."],
];
(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(...reviewPairs.map(([question, answer]) => ({ question, answer })));

(session.completionChecklist as string[]).push(
  "direct3을 모두 읽었다.", "원본3 hashes를 확인했다.", "템플릿 사용자 값3을 출력하지 않았다.", "sample 사람 값을 출력하지 않았다.", "JSP/EL container를 audit에서 실행하지 않았다.",
  "page directives3을 확인했다.", "Java expressions10을 확인했다.", "scriptlets5를 확인했다.", "EL54를 확인했다.", "empty10을 확인했다.",
  "page writes7을 확인했다.", "request writes2를 확인했다.", "session write1을 확인했다.", "application write1을 확인했다.", "explicit scope lookups4를 확인했다.",
  "unscoped name1을 확인했다.", "raw str sinks2를 확인했다.", "Java int division1을 확인했다.", "EL evaluation context를 설명한다.", "resolver chain을 설명한다.",
  "dynamic EL source를 금지한다.", "Java int division2를 안다.", "EL division과 Java division을 구분한다.", "String numeric coercion을 view에서 줄인다.", "정밀 계산을 domain에 둔다.",
  "comparison operand types를 확인한다.", "typed Boolean을 model에 둔다.", "authorization을 EL에 구현하지 않는다.", "ternary를 display decision으로 제한한다.", "required key를 render 전에 검증한다.",
  "empty null/string/list/map을 구분한다.", "whitespace와 empty를 구분한다.", "success-empty와 failure를 구분한다.", "empty list로 null을 정규화한다.", "missing key를 empty로 숨기지 않는다.",
  "scope order page→request→session→application을 안다.", "scope shadowing을 재현했다.", "explicit scope maps를 사용한다.", "cross-scope type collision을 제거한다.", "request root model key를 고유하게 둔다.",
  "page scope 수명을 안다.", "request가 redirect에서 사라짐을 안다.", "session concurrent mutation을 test한다.", "application user data를 금지한다.", "가장 짧은 충분한 scope를 선택한다.",
  "bean getter와 field를 구분한다.", "Map key resolver를 설명한다.", "List index 위험을 설명한다.", "base null을 진단한다.", "view DTO property contract를 test한다.",
  "safe ErrorView를 사용한다.", "internal cause를 body에서 제외한다.", "correlation id를 사용한다.", "EL evaluation과 rendering을 분리한다.", "HTML text를 contextual encode한다.",
  "attribute·URL·JS contexts를 구분한다.", "double encoding을 방지한다.", "raw semantic data를 model에 둔다.", "모든 Java examples warning0을 검증한다.", "모든 exact outputs를 검증한다.",
  "walkthrough ranges와 sourceRefs를 검증한다.", "actual Jakarta EL integration 범위를 문서화했다.", "scope concurrency acceptance를 문서화했다.", "malicious output fixture를 통과했다.", "sourceCoverage3/3을 확인했다."
);
