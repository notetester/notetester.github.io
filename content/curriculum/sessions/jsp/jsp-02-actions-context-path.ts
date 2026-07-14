import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

const noCode = [] as DetailedSession["chapters"][number]["codeExamples"];

const session = {
  schemaVersion: 2,
  inventoryIds: ["jsp-02-actions-context-path"],
  slug: "jsp-02-actions-context-path",
  courseId: "servlet-jsp",
  moduleId: "jsp-el-jstl-view",
  order: 7,
  title: "JSP 액션·요청 흐름과 context-aware URL",
  subtitle: "request metadata·parameter·attribute부터 context path, forward/include/redirect, response commit과 안전한 MVC 출력까지 하나의 상태 기계로 연결합니다.",
  level: "중급",
  estimatedMinutes: 840,
  coreQuestion: "애플리케이션이 루트가 아닌 경로에 배포되어도 URL이 깨지지 않고, forward/include/redirect마다 요청 데이터·주소·응답 commit이 정확히 이어지게 하려면 어떻게 설계할까요?",
  summary: "원본 JSP4개와 의미 closure인 Ex11·Command·One/Two/Three/FourCommand6개를 모두 읽습니다. 활성 source에는 page directives5, expressions18, scriptlets2, EL8, getContextPath5, forms3, request dispatcher forward1, getParameter/Values7, req.setAttribute10이 있습니다. 원본은 request host/IP/URL 정보를 raw HTML로 출력하고, context path를 scriptlet로5회 연결하며, output JSP가 request attributes·array·List를 cast/loop해 null과 XSS 위험을 만듭니다. controller closure는 unknown cmd를 운세로 default하고 System.out logging1, LocalDate.now1·Math.random1, Integer.parseInt2, division-by-zero error view, null 가능 getParameterValues를 포함합니다. 개인 템플릿 주석4와 sample person values는 절대 공개하지 않습니다. JDK-only fixtures로 parameter/attribute, root/non-root URL, forward/include/redirect request identity와 response commit을 exact 검증합니다.",
  objectives: [
    "request metadata를 신뢰·개인정보·proxy normalization 관점에서 분류한다.",
    "parameter와 attribute의 producer·type·수명 차이를 명확히 한다.",
    "context path·servlet path·request URI와 root/non-root deployment URL을 구분한다.",
    "URL path segment·query value·HTML attribute의 서로 다른 encoding 단계를 적용한다.",
    "forward가 같은 request model을 유지하고 server-side URL을 바꾸는 흐름을 설명한다.",
    "include가 parent response에 fragment 결과를 합치며 metadata 권한이 제한됨을 설명한다.",
    "redirect가 새 client request를 만들며 request attributes가 사라지는 이유와 PRG를 적용한다.",
    "response status·headers·charset·body·commit 순서를 상태 기계로 검증한다.",
    "scriptlet/cast/raw EL view를 typed controller model·JSTL·contextual encoding으로 전환한다.",
  ],
  prerequisites: [
    { title: "JSP 변환과 내장 객체", reason: "request·response·out과 action tag가 generated Servlet에서 어떻게 실행되는지 필요합니다.", sessionSlug: "jsp-01-translation-directives-implicit" },
    { title: "Servlet forward·redirect·PRG", reason: "server dispatch와 client 재요청의 HTTP 차이를 JSP view에 연결합니다.", sessionSlug: "servlet-03-forward-redirect-prg" },
  ],
  keywords: ["JSP action", "jsp:include", "jsp:forward", "request metadata", "parameter", "attribute", "context path", "servlet path", "request URI", "c:url", "URL encoding", "forward", "include", "redirect", "PRG", "request identity", "response commit", "XSS", "MVC view"],
  chapters: [],
  lab: {
    title: "root/non-root 배포에 안전한 command form과 결과 view",
    scenario: "하나의 입력 page가 여러 command를 보내고 controller가 typed model을 만든 뒤 성공·검증 오류·PRG 흐름으로 이동하는 작은 application contract를 설계합니다.",
    setup: ["context path ''와 '/study', GET/POST, missing/multi parameters, malicious text, forward/include/redirect fixtures를 준비합니다.", "request id·parameter map·attribute map과 response state를 기록하는 JDK-only model을 만듭니다.", "원본10은 read-only이며 템플릿 사용자와 sample names는 출력하지 않습니다."],
    steps: ["원본 direct4와 controller closure6의 producer→model→view graph를 그립니다.", "request metadata 중 진단 허용 항목과 PII/high-cardinality 항목을 분류합니다.", "parameter를 읽기 전에 encoding을 정하고 cmd allowlist와 typed validation을 적용합니다.", "context path와 application path를 결합하고 query value를 component별 encode합니다.", "HTML href/action attribute에 넣을 때 &를 다시 HTML encode합니다.", "forward 성공·검증 오류가 같은 request attribute를 유지하는지 검증합니다.", "include가 parent body 순서를 유지하고 status/header를 소유하지 않게 합니다.", "write 성공은303 redirect로 새 GET을 만들고 flash가 필요하면 짧은 별도 수명을 설계합니다.", "response metadata를 body 전에 고정하고 commit 후 mutation을 거부합니다.", "JSP raw expression/scriptlet loops를 request-scoped view model, JSTL, safe output으로 교체합니다."],
    expectedResult: ["루트와 /study 배포에서 form/link/redirect URL이 모두 맞습니다.", "forward/include는 request R1, redirect는 새 request R2라는 exact evidence가 남습니다.", "missing/malformed/multi input이 exception이나 null loop가 아니라 typed outcome이 됩니다.", "사용자 값·request metadata·내부 exception이 raw HTML/log에 노출되지 않습니다."],
    cleanup: ["owned temp와 request fixtures만 삭제합니다.", "response가 terminal state인지 확인합니다.", "원본 hashes와 read-only 상태를 다시 확인합니다."],
    extensions: ["실제 Servlet 6.1 container에서 FORWARD_/INCLUDE_ attributes를 검증합니다.", "reverse proxy forwarded headers의 trusted proxy allowlist를 추가합니다.", "flash message와 CSRF token을 포함한 PRG를 설계합니다.", "c:url과 framework URL helper를 비교하는 migration test를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "root와 /study context에서 같은 form action과 query link를 생성하세요.", requirements: ["context path를 한 번만 붙입니다.", "query values를 component encode합니다.", "HTML attribute에서 ampersand를 encode합니다.", "공백·한글·& fixture를 포함합니다.", "warning0 exact output을 냅니다."], hints: ["URL encoding과 HTML encoding은 순서와 목적이 다릅니다.", "requestURI를 base URL로 재사용하지 마세요."], expectedOutcome: "deployment path와 입력 문자에 독립적인 URL builder가 완성됩니다.", solutionOutline: ["context normalize→path join→query encode→HTML attr encode 순서로 만듭니다."] },
    { difficulty: "응용", prompt: "cmd controller를 typed dispatch와 forward/redirect outcome으로 리팩터링하세요.", requirements: ["unknown cmd는 explicit400/404 outcome입니다.", "숫자 parse와 division zero를 typed validation으로 처리합니다.", "getParameterValues null을 빈/오류 정책으로 바꿉니다.", "시간·난수를 주입합니다.", "forward는 request model을 유지합니다.", "write 성공은 PRG redirect를 사용합니다."], hints: ["default로 다른 command를 실행하면 typo가 성공처럼 보입니다.", "view path와 redirect location을 타입으로 분리할 수 있습니다."], expectedOutcome: "모든 command에 명시적 input/output/dispatch 계약이 생깁니다.", solutionOutline: ["parse→validate→execute→view model→dispatch의 단계로 나눕니다."] },
    { difficulty: "설계", prompt: "proxy 뒤 production web app의 request/URL/dispatch/response 운영 계약을 작성하세요.", requirements: ["trusted forwarded header 정책을 둡니다.", "PII·cardinality log 기준을 둡니다.", "context path와 external base URL owner를 정합니다.", "forward/include/redirect/PRG 선택표를 둡니다.", "commit/error/security header 순서를 정의합니다.", "root/non-root·proxy·malicious input acceptance를 둡니다."], hints: ["request.getRequestURL이 반드시 사용자가 본 public URL과 같지는 않습니다.", "open redirect allowlist를 포함하세요."], expectedOutcome: "배포 topology가 달라져도 안전한 URL과 응답을 만드는 ADR이 완성됩니다.", solutionOutline: ["client→proxy→context→controller→dispatch→renderer→response 흐름으로 작성합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["jsp-03-el-scope-resolution"],
  sources: [],
  sourceCoverage: {
    filesRead: 10,
    filesUsed: 10,
    uncoveredNotes: [
      "inventory direct JSP4와 semantic closure Ex11·Command·One/Two/Three/FourCommand6을 모두 읽고 producer→view flow에 사용했습니다.",
      "ThreeCommand가 선택하는 ex05_error.jsp 본문은 jsp-03 direct source이므로 이 세션에서는 path와 model producer만 감사하고 본문 분석은 다음 세션에 둡니다.",
      "원본 템플릿 사용자 값과 FourCommand의 sample person strings는 공개하지 않고 counts·shape·risk만 기록합니다.",
      "Servlet/JSP container를 실행하지 않아 실제 dispatcher attributes와 proxy behavior는 별도 integration 범위입니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAudit: DetailedSession["chapters"][number] = {
  id: "original-jsp02-direct4-closure10-audit",
  title: "원본 direct4·controller closure10을 no-container hash·shape·privacy로 감사합니다",
  lead: "JSP/Servlet을 실행하지 않고 source graph와 위험을 count하며 템플릿 사용자·sample 사람 값은 출력하지 않습니다.",
  explanations: [
    "direct4는 request 정보 view, command 입력 form, 결과 view, response 설명 view이고 closure6은 /ex11 controller, Command interface, 구현4개입니다.",
    "JSP comments와 Java comments를 제거한 활성 source에는 page directives5, expressions18, scriptlets2, EL8, getContextPath5, forms3이 있습니다.",
    "closure는 getParameter/Values7, req.setAttribute10, RequestDispatcher.forward1, output view returns4, error view return1로 producer→view model을 이룹니다.",
    "Ex11은 request encoding을 설정하지만 GET query decoding은 connector/container 설정과 구분해야 합니다. cmd를 stdout에1회 기록하고 unknown cmd를 TwoCommand로 default합니다.",
    "TwoCommand에는 LocalDate.now1·Math.random1이 있어 response가 비결정적이며 ThreeCommand는 Integer.parseInt2가 missing/malformed input에서 실패할 수 있습니다.",
    "FourCommand의 getParameterValues는 선택이 없으면 null일 수 있고 output JSP의 enhanced-for는 null에서 실패합니다. form JavaScript만으로 server validation을 대신할 수 없습니다.",
    "request view는 remote host/IP/port와 reconstructed URL을 raw 출력합니다. privacy, reverse DNS cost, proxy trust, Host header normalization과 XSS를 검토해야 합니다.",
    "output view는 request attributes를 raw scriptlet/EL로 출력하고 unchecked List cast와 arrays/list loops를 수행합니다. 값 provenance와 null/type contract가 없습니다.",
    "원본 direct4의 template User comments4와 closure sample 사람 값은 값 미출력 assertion으로 보호합니다. audit stdout에는 구조 count만 나옵니다.",
    "original main/container는 실행하지 않으므로 listener0, HTTP0, clock/random execution0, stdout cmd execution0입니다.",
  ],
  concepts: [
    { term: "semantic closure", definition: "JSP만으로는 알 수 없는 request attribute producer·view selection·dispatch를 설명하는 최소 controller sources입니다.", detail: ["closure6입니다.", "direct4와 분리합니다."] },
    { term: "request dataflow", definition: "parameters가 command validation을 거쳐 attributes/view model이 되고 view가 출력하는 producer-to-sink 흐름입니다.", detail: ["type와 lifetime을 추적합니다.", "raw sink를 표시합니다."] },
    { term: "no-container audit", definition: "JSP translation·Servlet lifecycle·HTTP를 실행하지 않고 source/hashes/shape만 검증하는 경계입니다.", detail: ["side effect가 없습니다.", "integration claim과 구분합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-jsp02-audit",
    title: "원본10 hash와 active dataflow shape를 개인정보 값 없이 검증합니다",
    language: "powershell",
    filename: "verify-original-jsp02.ps1",
    purpose: "direct/closure coverage, context-path/dispatch/model 위험을 재현 가능한 count로 보존합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ('jsp02 audit '+[Guid]::NewGuid().ToString('N'));$owned=$false;$failure=$null
function Count([string]$text,[string]$pattern){([regex]::Matches($text,$pattern)).Count}
try{
  New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$owned=$true
  $rels=@(
    'src/main/webapp/day02/ex04_request.jsp','src/main/webapp/day02/ex05_input.jsp',
    'src/main/webapp/day02/ex05_output.jsp','src/main/webapp/day02/ex06_response.jsp',
    'src/main/java/org/study/jspstudy/day02/Ex11.java','src/main/java/org/study/jspstudy/model/Command.java',
    'src/main/java/org/study/jspstudy/model/OneCommand.java','src/main/java/org/study/jspstudy/model/TwoCommand.java',
    'src/main/java/org/study/jspstudy/model/ThreeCommand.java','src/main/java/org/study/jspstudy/model/FourCommand.java'
  )
  $raw='';$hashes=0
  for($i=0;$i-lt$rels.Count;$i++){
    $source=Get-Item -LiteralPath (Join-Path $SourceRoot $rels[$i]);$copy=Join-Path $root ($i.ToString()+$source.Extension)
    [IO.File]::Copy($source.FullName,$copy)
    if((Get-FileHash $source.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $copy -Algorithm SHA256).Hash){throw 'hash drift'}
    $hashes++;$raw+=[IO.File]::ReadAllText($copy)+[Environment]::NewLine
  }
  $users=Count $raw '(?m)^\s*User\s*:'
  $active=[regex]::Replace($raw,'(?s)<%--.*?--%>','')
  $active=[regex]::Replace($active,'(?s)/\*.*?\*/','');$active=[regex]::Replace($active,'(?m)//.*$','')
  $shape=[ordered]@{
    page=Count $active '<%@\s*page\b';expression=Count $active '<%=';scriptlet=Count $active '<%(?![@!=\-])';el=Count $active '\$\{'
    context=Count $active 'getContextPath\s*\(';forms=Count $active '<form\b';parameters=Count $active 'getParameter(?:Values)?\s*\('
    attributes=Count $active 'req\.setAttribute\s*\(';forward=Count $active '\.forward\s*\(';outputs=Count $active 'return\s+"day02/ex05_output\.jsp"'
    errors=Count $active 'return\s+"day02/ex05_error\.jsp"';clockNow=Count $active 'LocalDate\.now\s*\('
    random=Count $active 'Math\.random\s*\(';parseInt=Count $active 'Integer\.parseInt\s*\('
  }
  $expected=@{page=5;expression=18;scriptlet=2;el=8;context=5;forms=3;parameters=7;attributes=10;forward=1;outputs=4;errors=1;clockNow=1;random=1;parseInt=2}
  foreach($name in $expected.Keys){if($shape[$name]-ne$expected[$name]){throw ('shape drift: '+$name)}}
  if($hashes-ne10-or$users-ne4){throw 'coverage drift'}
  'files=10,hashes=10,direct=4,closure=10|jsp=page5,expression18,scriptlet2,el8,contextPath5,forms3|flow=parameters7,attributes10,forward1,output4,error1|risk=clockNow1,random1,parseInt2'
  'privacy=templateUser:4,value:not-emitted|samplePeople:value:not-emitted|container:not-started|network:none|original:read-only'
}catch{$failure=$_.Exception}finally{
  if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item -LiteralPath $resolved -Recurse -Force}
  if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}
}`,
    walkthrough: [
      { lines: "1-6", explanation: "owned temp와 count-only audit를 준비합니다." },
      { lines: "7-23", explanation: "direct4와 semantic closure6을 byte-identical copy로 검증합니다." },
      { lines: "24-36", explanation: "JSP/Java comments를 제거하고 view·controller dataflow shape를 셉니다." },
      { lines: "37-40", explanation: "expected counts와 privacy markers를 출력하고 direct child temp만 정리합니다." },
    ],
    run: { environment: ["PowerShell 7+", "jspstudy project root", "Servlet/JSP container 불필요"], command: "pwsh -NoProfile -File verify-original-jsp02.ps1 -SourceRoot <jspstudy-project-root>" },
    output: { value: "files=10,hashes=10,direct=4,closure=10|jsp=page5,expression18,scriptlet2,el8,contextPath5,forms3|flow=parameters7,attributes10,forward1,output4,error1|risk=clockNow1,random1,parseInt2\nprivacy=templateUser:4,value:not-emitted|samplePeople:value:not-emitted|container:not-started|network:none|original:read-only", explanation: ["모든 direct/closure hashes를 확인합니다.", "사람 관련 값은 내보내지 않습니다.", "container·clock·random을 실행하지 않습니다."] },
    experiments: [
      { change: "Java comments를 제거하지 않고 forward를 셉니다.", prediction: "설명 주석의 forward가 섞일 수 있습니다.", result: "active source count를 사용합니다." },
      { change: "controller closure를 빼고 JSP4만 읽습니다.", prediction: "EL attributes와 view paths의 producer를 설명할 수 없습니다.", result: "semantic closure를 공개합니다." },
      { change: "source match values를 stdout에 씁니다.", prediction: "템플릿 또는 sample 사람 값이 유출될 수 있습니다.", result: "counts만 출력합니다." },
    ],
    sourceRefs: ["source-jsp02-request", "source-jsp02-input", "source-jsp02-output", "source-jsp02-response", "source-jsp02-ex11", "source-jsp02-command", "source-jsp02-one", "source-jsp02-two", "source-jsp02-three", "source-jsp02-four"],
  }],
  diagnostics: [
    { symptom: "audit flow count가 달라집니다.", likelyCause: "comments를 포함했거나 source closure version이 달라졌습니다.", checks: ["hash를 봅니다.", "JSP/Java comment stripping을 확인합니다.", "direct4/closure10 목록을 비교합니다."], fix: "source drift를 review하고 expected evidence를 의도적으로 갱신합니다.", prevention: "hash와 semantic counts를 함께 보존합니다." },
    { symptom: "audit artifact에 사용자/사람 이름이 보입니다.", likelyCause: "source excerpt 또는 match value를 출력했습니다.", checks: ["stdout·cache·artifact를 scan합니다.", "audit code가 raw를 출력하는지 봅니다.", "publish history를 확인합니다."], fix: "노출 artifact를 교체하고 value-free count로 재생성합니다.", prevention: "privacy assertions와 publication scan을 둡니다." },
  ],
};

(session.chapters as DetailedSession["chapters"]).push(originalAudit);

const maintainedChapters: DetailedSession["chapters"] = [
  {
    id: "request-metadata-trust-privacy",
    title: "request metadata를 사실·신뢰·개인정보·비용 네 축으로 읽습니다",
    lead: "request 객체가 값을 제공한다는 사실이 곧 화면 출력·인증·로그에 안전하다는 뜻은 아닙니다.",
    explanations: [
      "remote address는 직접 연결 peer를 나타낼 수 있어 proxy 뒤에서는 end user IP와 다릅니다. Forwarded/X-Forwarded-For는 trusted proxy가 정규화한 경우에만 사용합니다.",
      "getRemoteHost는 reverse DNS lookup을 유발할 수 있고 latency·spoofing 인상을 줍니다. 일반 요청 path에서 이름 조회가 필요한지 먼저 묻습니다.",
      "request URL/server name은 Host·proxy configuration 영향을 받습니다. password reset·absolute redirect 같은 보안 URL의 신뢰 기준을 따로 둡니다.",
      "URI·query·user-agent·IP는 PII 또는 high-cardinality log가 될 수 있습니다. raw 값을 metric label이나 공개 HTML에 넣지 않습니다.",
      "content length -1, content type null, character encoding null은 가능한 상태입니다. 진단 page도 null-safe·escaped·access-controlled여야 합니다.",
    ],
    concepts: [
      { term: "trust boundary", definition: "외부 client/proxy가 제공한 값이 내부 신뢰 값으로 바뀌기 전에 검증·정규화되는 경계입니다.", detail: ["trusted proxy allowlist가 필요합니다.", "Host도 입력입니다."] },
      { term: "metadata minimization", definition: "목적에 필요한 request 정보만 수집·표시·보관하는 원칙입니다.", detail: ["PII를 줄입니다.", "log cardinality를 제한합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "모든 client IP가 proxy 주소로 기록됩니다.", likelyCause: "direct peer와 forwarded client chain을 구분하지 않았습니다.", checks: ["network topology를 봅니다.", "trusted proxy ranges를 확인합니다.", "header overwrite policy를 봅니다."], fix: "edge proxy가 정규화한 client identity를 allowlist 기반으로 읽습니다.", prevention: "spoofed forwarded header integration test를 둡니다." },
      { symptom: "request 진단 page가 XSS 또는 정보 노출을 만듭니다.", likelyCause: "URI/host/headers를 raw HTML로 공개했습니다.", checks: ["모든 metadata sink를 찾습니다.", "access control을 봅니다.", "escaping과 retention을 확인합니다."], fix: "production 공개를 제거하고 필요한 값만 escape/redact합니다.", prevention: "diagnostic endpoint를 인증·환경 제한합니다." },
    ],
  },
  {
    id: "parameter-attribute-contract",
    title: "client parameter와 server attribute를 서로 다른 namespace·type·수명으로 다룹니다",
    lead: "둘 다 이름으로 찾지만 producer와 신뢰도가 완전히 다르므로 implicit String bag로 섞지 않습니다.",
    explanations: [
      "parameter는 query/form/multipart 등 client request에서 오며 getParameter는 첫 String, getParameterValues는0/1/N 값의 배열 계약입니다.",
      "attribute는 server code가 request에 저장하는 Object model입니다. forward/include chain에서 같은 request가 유지될 때 view가 읽습니다.",
      "없는 parameter/attribute는 null일 수 있습니다. enhanced-for·cast·unboxing 전에 explicit missing/type 정책을 적용합니다.",
      "request character encoding은 body parameters를 최초 parse하기 전에 설정해야 합니다. GET query decoding은 container connector 규칙도 확인합니다.",
      "예제는 immutable copies, allowlisted values와 typed age parsing으로 client input과 server model을 분리합니다.",
    ],
    concepts: [
      { term: "request parameter", definition: "client가 전송해 server가 문자열 또는 문자열 배열로 해석한 untrusted input입니다.", detail: ["missing·multi가 가능합니다.", "validation이 필요합니다."] },
      { term: "request attribute", definition: "server component가 같은 request dispatch chain에 전달하는 Object model입니다.", detail: ["forward에서 유지됩니다.", "redirect에서 새 request로 사라집니다."] },
    ],
    codeExamples: [{
      id: "java-request-parameter-attribute-contract",
      title: "multi parameter를 검증해 typed request attribute model을 만듭니다",
      language: "java",
      filename: "RequestContract.java",
      purpose: "Servlet API 없이 parameter와 attribute의 producer/type/lifetime 차이를 exact model로 검증합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class RequestContract {
    record Input(String alias, int age, List<String> topics) {}

    static Input parse(Map<String, List<String>> parameters) {
        String alias = one(parameters, "alias");
        int age = Integer.parseInt(one(parameters, "age"));
        if (age < 0 || age > 130) throw new IllegalArgumentException("age range");
        List<String> topics = List.copyOf(parameters.getOrDefault("topic", List.of()));
        if (topics.isEmpty()) throw new IllegalArgumentException("topic required");
        return new Input(alias, age, topics);
    }

    static String one(Map<String, List<String>> parameters, String name) {
        List<String> values = parameters.get(name);
        if (values == null || values.size() != 1 || values.get(0).isBlank())
            throw new IllegalArgumentException(name + " required once");
        return values.get(0);
    }

    public static void main(String[] args) {
        Map<String, List<String>> parameters = Map.of(
                "alias", List.of("learner"), "age", List.of("17"), "topic", List.of("html", "jsp"));
        Input input = parse(parameters);
        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("model", input);
        System.out.println("input=" + input.alias() + "," + input.age() + "," + input.topics());
        System.out.println("attributeType=" + attributes.get("model").getClass().getSimpleName() + "|missing=" + attributes.get("none"));
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "client 문자열과 검증 후 immutable Input type을 구분합니다." },
        { lines: "8-15", explanation: "single/multi/missing/range 계약을 명시적으로 검사합니다." },
        { lines: "17-22", explanation: "single parameter cardinality와 blank를 fail-fast합니다." },
        { lines: "24-33", explanation: "검증 model만 server attribute map에 저장하고 missing null을 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "container-neutral"], command: isolatedJavaRun("RequestContract.java", "RequestContract") },
      output: { value: "input=learner,17,[html, jsp]\nattributeType=Input|missing=null", explanation: ["client strings는 typed Input으로 바뀝니다.", "attribute는 Object model이고 missing은 null입니다."] },
      experiments: [
        { change: "age를 empty list로 보냅니다.", prediction: "age required once failure가 납니다.", result: "null/IndexOutOfBounds 전에 cardinality를 검증합니다." },
        { change: "topic을 제거합니다.", prediction: "topic required failure가 납니다.", result: "JavaScript 검증 우회를 server에서 차단합니다." },
        { change: "alias를 두 값으로 보냅니다.", prediction: "single-value contract가 거부합니다.", result: "parameter pollution을 조용히 첫 값으로 축소하지 않습니다." },
      ],
      sourceRefs: ["source-jsp02-input", "source-jsp02-output", "source-jsp02-one", "source-jsp02-four", "jakarta-servlet-request"],
    }],
    diagnostics: [
      { symptom: "checkbox를 모두 해제하면 JSP loop가 NPE입니다.", likelyCause: "getParameterValues null을 그대로 attribute에 넣고 enhanced-for했습니다.", checks: ["parameter presence를 봅니다.", "server validation을 봅니다.", "view model type을 봅니다."], fix: "필수 선택은 typed validation error, 선택 사항은 immutable empty list로 정규화합니다.", prevention: "missing/one/many fixtures를 둡니다." },
      { symptom: "한글 POST parameter가 이미 깨져 있습니다.", likelyCause: "parameter parse 뒤 request encoding을 설정했습니다.", checks: ["최초 getParameter 시점을 찾습니다.", "Content-Type charset을 봅니다.", "filter order를 확인합니다."], fix: "parameter access 전 encoding filter/controller 설정을 적용합니다.", prevention: "non-ASCII POST integration test를 둡니다." },
    ],
  },
  {
    id: "context-path-url-components",
    title: "context path를 deployment prefix로 보고 URL components를 순서대로 encode합니다",
    lead: "문자열 앞에 slash를 붙이는 수준을 넘어 path·query·HTML attribute의 parser 경계를 차례로 통과시킵니다.",
    explanations: [
      "root deployment의 context path는 empty string이고 non-root는 /study 같은 leading-slash prefix입니다. application path와 중복 slash 없이 결합합니다.",
      "request URI 전체를 base로 쓰면 현재 route·path parameters·forward state가 섞입니다. stable application route를 기준으로 만듭니다.",
      "query parameter value는 URLEncoder 또는 URL builder로 component encode해야 합니다. 문자열 연결은 &, =, space, non-ASCII에서 구조가 깨집니다.",
      "완성 URL을 HTML href/action attribute에 넣으면 &가 markup delimiter이므로 HTML attribute encoding을 추가합니다. URL encoding과 역할이 다릅니다.",
      "modern JSP에서는 scriptlet getContextPath 연결보다 c:url 또는 framework URL helper를 사용해 context/query 처리를 중앙화합니다.",
    ],
    concepts: [
      { term: "context path", definition: "한 host 안에서 web application을 식별하는 deployment prefix이며 root에서는 empty string입니다.", detail: ["application route와 구분합니다.", "배포 시 바뀔 수 있습니다."] },
      { term: "component encoding", definition: "URL 전체가 아니라 path segment·query name/value 등 각 문법 component에 맞게 문자를 encode하는 원칙입니다.", detail: ["HTML encoding과도 다릅니다.", "중첩 순서를 지킵니다."] },
    ],
    codeExamples: [{
      id: "java-context-path-url-builder",
      title: "non-root context와 query·HTML attribute encoding을 정확히 적용합니다",
      language: "java",
      filename: "ContextPathUrl.java",
      purpose: "root/non-root deployment와 특수문자 query에서 깨지지 않는 URL 생성 순서를 검증합니다.",
      code: String.raw`import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class ContextPathUrl {
    static String url(String contextPath, String applicationPath, String query) {
        if (!(contextPath.isEmpty() || contextPath.matches("/[A-Za-z0-9._-]+")))
            throw new IllegalArgumentException("context path");
        if (!applicationPath.startsWith("/") || applicationPath.contains(".."))
            throw new IllegalArgumentException("application path");
        return contextPath + applicationPath + "?cmd=search&q="
                + URLEncoder.encode(query, StandardCharsets.UTF_8);
    }

    static String htmlAttribute(String value) {
        return value.replace("&", "&amp;").replace("\"", "&quot;")
                .replace("<", "&lt;").replace(">", "&gt;");
    }

    public static void main(String[] args) {
        String root = url("", "/ex11", "jsp & servlet");
        String nested = url("/study", "/ex11", "jsp & servlet");
        System.out.println("root=" + root);
        System.out.println("nested=" + nested);
        System.out.println("href=" + htmlAttribute(nested));
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "context/application path를 검증하고 query value만 UTF-8 form encode합니다." },
        { lines: "13-16", explanation: "완성 URL이 HTML attribute에 들어갈 때 markup delimiters를 encode합니다." },
        { lines: "18-24", explanation: "root/non-root와 공백·ampersand query의 exact 결과를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "UTF-8"], command: isolatedJavaRun("ContextPathUrl.java", "ContextPathUrl") },
      output: { value: "root=/ex11?cmd=search&q=jsp+%26+servlet\nnested=/study/ex11?cmd=search&q=jsp+%26+servlet\nhref=/study/ex11?cmd=search&amp;q=jsp+%26+servlet", explanation: ["root에는 prefix가 없습니다.", "query &는 %26, HTML query separator &는 &amp;가 됩니다."] },
      experiments: [
        { change: "context를 /study/로 전달합니다.", prediction: "strict context contract가 거부합니다.", result: "normalization owner를 하나로 둡니다." },
        { change: "query 전체를 URLEncoder로 encode합니다.", prediction: "?=& 구조까지 data가 되어 URL이 깨집니다.", result: "value component만 encode합니다." },
        { change: "HTML attribute encoding을 생략합니다.", prediction: "브라우저가 단순 URL을 해석할 수 있어도 markup contract와 validator가 깨집니다.", result: "중첩 parser별 encoding을 유지합니다." },
      ],
      sourceRefs: ["source-jsp02-input", "jakarta-servlet-request", "java-url-encoder", "whatwg-url", "whatwg-html"],
    }],
    diagnostics: [
      { symptom: "루트에서는 되지만 /study 배포에서 form이404입니다.", likelyCause: "host-root /ex11을 hard-code해 context path를 빠뜨렸습니다.", checks: ["deployed context를 봅니다.", "rendered action을 봅니다.", "application route를 확인합니다."], fix: "c:url/framework helper로 context-aware URL을 생성합니다.", prevention: "root와 non-root deployment test를 둘 다 둡니다." },
      { symptom: "query에 & 또는 한글이 들어가면 parameter가 잘립니다.", likelyCause: "query value를 raw 문자열로 연결했습니다.", checks: ["raw rendered href를 봅니다.", "server parameter map을 봅니다.", "double encoding을 확인합니다."], fix: "각 query value를 UTF-8 component encode하고 최종 HTML attribute를 encode합니다.", prevention: "공백·&·=·%·non-ASCII fixtures를 둡니다." },
    ],
  },
  {
    id: "relative-root-external-url-resolution",
    title: "relative·host-root·context-relative·external URL의 기준점을 명시합니다",
    lead: "현재 page 위치와 browser base에 우연히 기대는 링크는 route 이동과 proxy 배포에서 쉽게 깨집니다.",
    explanations: [
      "ex11 같은 relative URL은 현재 document URL directory를 기준으로 browser가 resolve합니다. page 위치가 바뀌면 target도 바뀝니다.",
      "/ex11은 origin root 기준이라 context path가 /study이면 application 밖을 가리킵니다. context + /ex11이 application route입니다.",
      "forward는 browser address를 바꾸지 않으므로 forwarded JSP에서 relative URL을 만들면 JSP file path가 아니라 원래 client URL이 기준이 될 수 있습니다.",
      "absolute external URL은 scheme/host/port와 reverse proxy public origin 정책이 필요합니다. request Host를 무조건 신뢰해 만들지 않습니다.",
      "redirect target을 user parameter로 받으면 open redirect가 될 수 있습니다. internal route id 또는 allowlisted origin으로 제한합니다.",
    ],
    concepts: [
      { term: "URL reference base", definition: "relative reference를 absolute target으로 해석할 때 사용하는 document/base URL입니다.", detail: ["forward 후에도 browser URL 기준입니다.", "page filesystem path와 다릅니다."] },
      { term: "open redirect", definition: "공격자가 redirect target을 외부 피싱 origin으로 조작할 수 있는 취약점입니다.", detail: ["allowlist가 필요합니다.", "internal route id를 선호합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "forward된 JSP의 상대 link가 엉뚱한 directory를 가리킵니다.", likelyCause: "browser가 원래 request URL을 base로 resolve하는 사실을 놓쳤습니다.", checks: ["address bar URL을 봅니다.", "rendered href를 봅니다.", "forward target path와 비교합니다."], fix: "context-aware absolute-path reference를 생성합니다.", prevention: "여러 entry routes에서 같은 view link를 test합니다." },
      { symptom: "next parameter로 외부 phishing site로 redirect됩니다.", likelyCause: "user-supplied URL을 검증 없이 sendRedirect에 전달했습니다.", checks: ["scheme-relative //도 test합니다.", "encoded variants를 test합니다.", "allowlist logic을 봅니다."], fix: "server-owned internal destinations 또는 strict origin/path allowlist를 사용합니다.", prevention: "open redirect negative corpus를 CI에 둡니다." },
    ],
  },
  {
    id: "forward-same-request-model",
    title: "forward를 같은 request model을 소비하는 server-side terminal dispatch로 다룹니다",
    lead: "URL이 바뀌지 않는다는 한 문장보다 request identity, attributes, parameters, buffer와 terminal ownership을 함께 봅니다.",
    explanations: [
      "RequestDispatcher.forward는 server 내부에서 target resource로 같은 request/response를 넘기므로 controller가 둔 request attributes를 JSP가 읽습니다.",
      "browser는 새 HTTP 요청을 보내지 않아 address bar는 원래 URL을 유지합니다. target JSP path를 public bookmark URL로 생각하지 않습니다.",
      "forward 전에 response가 commit되면 실패할 수 있습니다. controller는 body를 쓰지 않고 model·view 결정만 한 뒤 dispatch합니다.",
      "forwarded request의 current path methods와 original path attributes는 Servlet 규격의 FORWARD_* 계약을 확인합니다. authorization/logging에서 어느 값을 쓸지 명시합니다.",
      "forward 후 controller가 body를 더 쓰는 흐름을 만들지 않고 terminal outcome으로 취급하면 response ownership이 명확해집니다.",
    ],
    concepts: [
      { term: "same-request dispatch", definition: "client round trip 없이 같은 request/response objects로 다른 server resource가 처리를 이어가는 흐름입니다.", detail: ["attributes가 유지됩니다.", "주소창은 그대로입니다."] },
      { term: "terminal dispatch", definition: "dispatch 뒤 원래 controller가 response를 더 변경하지 않는 단방향 ownership 규칙입니다.", detail: ["double write를 막습니다.", "commit reasoning이 단순해집니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "JSP에서 request attribute가 null입니다.", likelyCause: "attribute 이름/type이 다르거나 redirect/new request를 사용했습니다.", checks: ["producer setAttribute를 봅니다.", "dispatch kind를 확인합니다.", "attribute key/type를 비교합니다."], fix: "typed view model key를 하나로 만들고 forward를 사용합니다.", prevention: "controller→view contract test를 둡니다." },
      { symptom: "forward에서 IllegalStateException이 납니다.", likelyCause: "writer/flush로 response가 이미 commit됐습니다.", checks: ["isCommitted를 기록합니다.", "controller body writes를 찾습니다.", "filter의 flush를 봅니다."], fix: "render/dispatch 결정 전 body 출력을 제거합니다.", prevention: "controller를 model+outcome only로 제한합니다." },
    ],
  },
  {
    id: "include-fragment-response-contract",
    title: "include를 parent body 안의 제한된 fragment dispatch로 다룹니다",
    lead: "포함 대상이 독립 실행되더라도 최종 response status·headers·layout은 parent가 소유합니다.",
    explanations: [
      "jsp:include/RequestDispatcher.include는 대상 resource의 output을 현재 response body 위치에 삽입합니다. parent의 before/after content 순서가 유지됩니다.",
      "same request라 parameters와 attributes를 볼 수 있지만 INCLUDE_* attributes가 target path 정보를 제공합니다. nested include에서 값의 범위를 규격대로 확인합니다.",
      "included resource가 status/header/redirect를 설정하려 해도 response wrapper contract상 효과가 제한됩니다. fragment는 body 생성 책임에 집중합니다.",
      "include target 실패가 partial response 뒤 발생할 수 있어 parent buffer, error placeholder, timeout과 observability를 설계해야 합니다.",
      "user-controlled include path는 local file/resource exposure나 dispatch abuse가 될 수 있으므로 server-owned allowlist로 선택합니다.",
    ],
    concepts: [
      { term: "response fragment", definition: "최종 document 전체가 아니라 parent가 정한 위치에 삽입되는 body 일부입니다.", detail: ["metadata를 소유하지 않습니다.", "markup nesting 계약이 필요합니다."] },
      { term: "include attributes", definition: "included target의 URI·context·servlet path 등을 같은 request에 제공하는 표준 attributes입니다.", detail: ["원래 request methods와 구분합니다.", "nested dispatch를 고려합니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "include fragment가 redirect하려 했지만 화면에 섞인 body만 남습니다.", likelyCause: "fragment가 parent response control을 소유한다고 가정했습니다.", checks: ["dispatch kind를 확인합니다.", "included response methods를 기록합니다.", "parent commit을 봅니다."], fix: "redirect 결정은 parent controller로 올리고 fragment는 body만 렌더합니다.", prevention: "fragment capability contract를 둡니다." },
      { symptom: "include 실패 후 절반짜리 HTML이 전송됩니다.", likelyCause: "부분 body가 이미 buffer를 넘었거나 fallback boundary가 없습니다.", checks: ["commit 시점을 봅니다.", "fragment timeout/error를 봅니다.", "buffer 정책을 봅니다."], fix: "중요 fragment는 render 전 준비하고 optional fragment는 안전한 placeholder를 둡니다.", prevention: "include failure·slow target integration test를 둡니다." },
    ],
  },
  {
    id: "dispatch-forward-include-redirect-state-machine",
    title: "forward·include·redirect를 request identity와 browser round trip 상태 기계로 비교합니다",
    lead: "dispatch 선택을 단순 페이지 이동이 아니라 데이터 수명과 HTTP semantics를 결정하는 architecture choice로 봅니다.",
    explanations: [
      "forward는 R1을 target에 넘기고 attributes를 유지하며 browser URL은 바꾸지 않는 terminal server dispatch입니다.",
      "include는 R1을 fragment에 공유하고 결과만 parent body에 삽입한 뒤 parent 처리가 계속됩니다.",
      "redirect는3xx Location을 client에 보내고 client가 R2를 만들어 이동합니다. R1 attributes는 자동 전달되지 않습니다.",
      "POST 성공 뒤303 redirect→GET은 새로고침 중복 제출을 줄이는 PRG입니다. 검증 오류는 보통 같은 request forward로 입력/오류를 보존합니다.",
      "예제는 request id와 model visibility, parent body, address change를 exact trace로 만들어 말로만 외우는 오류를 막습니다.",
    ],
    concepts: [
      { term: "client round trip", definition: "server 응답을 받은 browser가 Location을 따라 새 HTTP request를 만드는 단계입니다.", detail: ["새 request identity입니다.", "network failure surface가 추가됩니다."] },
      { term: "PRG", definition: "상태 변경 POST 성공 후 redirect하여 조회 GET을 만드는 pattern입니다.", detail: ["중복 제출을 줄입니다.", "오류 forward와 구분합니다."] },
    ],
    codeExamples: [{
      id: "java-dispatch-state-machine",
      title: "세 dispatch의 request identity·model·body·URL 변화를 exact 비교합니다",
      language: "java",
      filename: "DispatchStateMachine.java",
      purpose: "Servlet container 없이 forward/include/redirect의 핵심 data lifetime을 상태로 검증합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class DispatchStateMachine {
    record Request(String id, Map<String, String> attributes) {}

    static String forward(Request request) {
        return "forward=id:" + request.id() + ",model:" + request.attributes().get("model") + ",urlChanged:false";
    }

    static String include(Request request) {
        return "include=id:" + request.id() + ",model:" + request.attributes().get("model")
                + ",body:before|fragment|after";
    }

    static String redirect(Request previous) {
        Request next = new Request("R2", Map.of());
        return "redirect=" + previous.id() + "->" + next.id() + ",model:"
                + next.attributes().get("model") + ",urlChanged:true";
    }

    public static void main(String[] args) {
        Map<String, String> model = new LinkedHashMap<>();
        model.put("model", "ready");
        Request request = new Request("R1", Map.copyOf(model));
        System.out.println(forward(request));
        System.out.println(include(request));
        System.out.println(redirect(request));
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "request identity와 immutable attribute snapshot을 모델링합니다." },
        { lines: "7-19", explanation: "forward/include는 R1 model을 읽고 redirect만 empty R2를 만듭니다." },
        { lines: "21-29", explanation: "동일 R1으로 세 outcome을 submission 순서대로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "container-neutral"], command: isolatedJavaRun("DispatchStateMachine.java", "DispatchStateMachine") },
      output: { value: "forward=id:R1,model:ready,urlChanged:false\ninclude=id:R1,model:ready,body:before|fragment|after\nredirect=R1->R2,model:null,urlChanged:true", explanation: ["forward/include는 R1 model을 봅니다.", "redirect R2에는 request attribute가 없습니다."] },
      experiments: [
        { change: "redirect R2에 flash token lookup을 추가합니다.", prediction: "별도 짧은 저장소가 있을 때 한 번만 model을 복구할 수 있습니다.", result: "request attribute와 flash를 구분합니다." },
        { change: "POST 성공을 forward합니다.", prediction: "주소와 method history가 POST로 남아 refresh 중복 제출 위험이 있습니다.", result: "성공은 PRG를 고려합니다." },
        { change: "검증 오류를 redirect합니다.", prediction: "입력과 field errors를 별도 저장하지 않으면 잃습니다.", result: "오류는 같은 request forward가 단순합니다." },
      ],
      sourceRefs: ["source-jsp02-ex11", "source-jsp02-output", "jakarta-request-dispatcher", "jakarta-http-response", "rfc9110"],
    }],
    diagnostics: [
      { symptom: "redirect 후 request message가 사라집니다.", likelyCause: "새 request R2가 R1 attribute를 자동 상속한다고 생각했습니다.", checks: ["network requests를 봅니다.", "dispatch kind를 확인합니다.", "flash/session 사용을 봅니다."], fix: "필요하면 one-time flash를 설계하거나 같은 request forward를 선택합니다.", prevention: "dispatch별 data lifetime test를 둡니다." },
      { symptom: "POST 새로고침이 상태 변경을 반복합니다.", likelyCause: "성공 결과를 forward로 렌더해 browser history가 POST에 남았습니다.", checks: ["response status/Location을 봅니다.", "browser reload prompt를 확인합니다.", "idempotency를 봅니다."], fix: "commit 후303 redirect로 canonical GET을 만듭니다.", prevention: "PRG와 idempotency key 정책을 둡니다." },
    ],
    comparisons: [{ title: "dispatch 선택", options: [
      { name: "forward", chooseWhen: "같은 request model로 terminal view를 렌더할 때", avoidWhen: "주소 변경·POST 성공 canonical GET이 필요할 때", tradeoffs: ["attributes 유지", "URL 불변", "commit 전만 가능"] },
      { name: "include", chooseWhen: "parent document에 독립 fragment body가 필요할 때", avoidWhen: "target이 status/redirect를 소유해야 할 때", tradeoffs: ["same request", "parent 계속 실행", "부분 실패"] },
      { name: "redirect", chooseWhen: "새 client navigation·PRG·canonical URL이 필요할 때", avoidWhen: "request attributes를 그대로 유지해야 할 때", tradeoffs: ["새 request", "추가 round trip", "open redirect 검토"] },
    ] }],
  },
  {
    id: "response-metadata-commit-error",
    title: "response를 NEW→COMMITTED terminal state로 모델링합니다",
    lead: "status·headers·charset·body의 순서를 명시하면 forward 실패, mojibake,200 오류와 부분 응답을 예방할 수 있습니다.",
    explanations: [
      "status와 Content-Type/charset/security/cache headers는 writer를 얻거나 body를 flush하기 전에 확정합니다.",
      "body write 자체는 buffer에 머물 수 있지만 flush·buffer overflow·sendError·sendRedirect는 commit을 일으킬 수 있습니다.",
      "commit 뒤 status/header를 바꿔도 client에는 이미 전송된 값이 남거나 API가 IllegalStateException을 냅니다.",
      "sendRedirect는 Location과3xx를 만들고 terminal로 취급합니다. included resource에서는 효과가 제한될 수 있습니다.",
      "오류는 commit 전에 safe status/body로 변환하고 내부 exception은 correlation id와 private log에 남깁니다.",
    ],
    concepts: [
      { term: "response metadata", definition: "body를 해석·cache·보호하는 status와 headers의 집합입니다.", detail: ["body 전에 확정합니다.", "charset을 포함합니다."] },
      { term: "terminal response", definition: "commit·redirect·error·forward 뒤 현재 component가 더는 response를 변경하지 않는 상태입니다.", detail: ["double write를 막습니다.", "한 owner만 둡니다."] },
    ],
    codeExamples: [{
      id: "java-response-commit-model",
      title: "metadata 이후 body commit과 late mutation 거부를 검증합니다",
      language: "java",
      filename: "ResponseCommitModel.java",
      purpose: "Servlet API 없이 response ordering과 terminal ownership을 exact state로 재현합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class ResponseCommitModel {
    enum State { NEW, COMMITTED }
    private State state = State.NEW;
    private int status = 200;
    private final Map<String, String> headers = new LinkedHashMap<>();
    private String body = "";

    void header(String name, String value) {
        requireNew();
        headers.put(name, value);
    }

    void write(String value) {
        requireNew();
        body = value;
        state = State.COMMITTED;
    }

    void requireNew() {
        if (state != State.NEW) throw new IllegalStateException("already committed");
    }

    public static void main(String[] args) {
        ResponseCommitModel response = new ResponseCommitModel();
        response.header("Content-Type", "text/html;charset=UTF-8");
        response.write("ok");
        String late = "none";
        try { response.header("Location", "/next"); }
        catch (IllegalStateException failure) { late = failure.getMessage(); }
        System.out.println("state=" + response.state + "|status=" + response.status
                + "|type=" + response.headers.get("Content-Type") + "|body=" + response.body);
        System.out.println("late=" + late);
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "NEW/COMMITTED와 status/header/body state를 선언합니다." },
        { lines: "11-23", explanation: "metadata와 body mutation은 NEW에서만 허용하고 write가 commit합니다." },
        { lines: "25-35", explanation: "Content-Type→body 순서와 late Location 실패를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only", "container-neutral"], command: isolatedJavaRun("ResponseCommitModel.java", "ResponseCommitModel") },
      output: { value: "state=COMMITTED|status=200|type=text/html;charset=UTF-8|body=ok\nlate=already committed", explanation: ["metadata가 body 전에 고정됩니다.", "commit 뒤 Location 변경은 거부됩니다."] },
      experiments: [
        { change: "header 전에 write합니다.", prediction: "Content-Type 설정이 already committed로 실패합니다.", result: "metadata-first rule을 유지합니다." },
        { change: "오류를 catch한 뒤 body에 stack을 씁니다.", prediction: "정보 노출과 부분 응답이 생깁니다.", result: "commit 전 safe error boundary를 둡니다." },
        { change: "write 뒤 redirect를 시도합니다.", prediction: "late Location과 status 변경이 실패합니다.", result: "redirect를 terminal outcome으로 먼저 결정합니다." },
      ],
      sourceRefs: ["source-jsp02-response", "jakarta-http-response", "jakarta-request-dispatcher", "rfc9110", "jakarta-servlet-spec", "jakarta-http-request", "owasp-xss", "owasp-unvalidated-redirects"],
    }],
    diagnostics: [
      { symptom: "오류인데 client는200으로 봅니다.", likelyCause: "body가 먼저 commit된 뒤 status를 바꾸거나 모든 결과를 HTML message로만 표현했습니다.", checks: ["wire status를 봅니다.", "commit 시점을 기록합니다.", "exception mapping order를 봅니다."], fix: "render 전에 typed outcome을 status/header/body로 변환합니다.", prevention: "status/body matrix integration test를 둡니다." },
      { symptom: "한글 response가 깨집니다.", likelyCause: "writer를 얻은 뒤 charset을 설정했거나 content type에 charset이 없습니다.", checks: ["API call order를 봅니다.", "wire Content-Type을 봅니다.", "actual bytes를 확인합니다."], fix: "writer/body 전에 UTF-8 Content-Type을 설정합니다.", prevention: "non-ASCII exact bytes test를 둡니다." },
    ],
  },
  {
    id: "mvc-view-model-output-security",
    title: "command closure를 typed MVC outcome으로 바꾸고 JSP는 안전한 renderer로 제한합니다",
    lead: "원본의 switch·parse·clock/random·cast·raw 출력 위험을 producer 단계에서 정리해 view dependency를 작게 만듭니다.",
    explanations: [
      "cmd는 문자열 switch default로 다른 기능을 실행하지 말고 allowlisted enum/route와 explicit unknown outcome을 사용합니다.",
      "숫자 parse, 연산자 allowlist, division zero, checkbox cardinality는 controller가 field errors로 만들고 JSP는 성공/오류 model만 읽습니다.",
      "시간과 난수는 주입하고 stdout에 raw cmd/PII를 찍지 않습니다. stable route id·outcome·correlation id만 structured log에 남깁니다.",
      "JSP는 Object cast와 scriptlet loop 대신 typed List/record model을 request scope에서 JSTL로 반복하며 empty state를 명시합니다.",
      "${value} 직접 출력도 자동 safe라고 가정하지 않습니다. HTML text는 c:out/encoder, URL은 c:url, 다른 contexts는 전용 serializer를 씁니다.",
    ],
    concepts: [
      { term: "typed dispatch outcome", definition: "forward view, redirect location, validation error, not-found 같은 결과 종류를 문자열 path와 분리한 모델입니다.", detail: ["terminal behavior가 명확합니다.", "허용 route만 표현합니다."] },
      { term: "producer-side normalization", definition: "view에 넘기기 전에 missing·type·range·time/random·empty collection을 명시적 model로 정리하는 과정입니다.", detail: ["JSP null branch가 줄어듭니다.", "테스트가 쉬워집니다."] },
    ],
    codeExamples: noCode,
    diagnostics: [
      { symptom: "unknown cmd가 운세 page를 정상 응답합니다.", likelyCause: "switch default가 TwoCommand를 실행합니다.", checks: ["unknown/blank/null cmd를 보냅니다.", "status와 selected handler를 봅니다.", "allowlist를 확인합니다."], fix: "unknown은 explicit400/404 outcome으로 거부합니다.", prevention: "모든 route 값과 negative cases를 table test합니다." },
      { symptom: "request attribute 값으로 script가 실행되거나 List cast가 실패합니다.", likelyCause: "view가 untyped Object와 raw output을 직접 처리합니다.", checks: ["producer type을 확인합니다.", "sink context를 봅니다.", "missing/wrong type fixture를 실행합니다."], fix: "typed view model과 contextual output primitive를 사용합니다.", prevention: "controller-view contract와 malicious text regression을 둡니다." },
    ],
    expertNotes: ["JSP action을 배우는 목적은 API 암기가 아니라 request identity·deployment URL·response ownership을 명시하는 것입니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...maintainedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "source-jsp02-request", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex04_request.jsp", usedFor: ["request metadata", "context path", "raw output risk"], evidence: "inventory direct JSP를 read-only audit했습니다." },
  { id: "source-jsp02-input", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex05_input.jsp", usedFor: ["forms", "context path links", "multi input", "client validation"], evidence: "세 form과 link dataflow를 확인했습니다." },
  { id: "source-jsp02-output", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex05_output.jsp", usedFor: ["request attributes", "EL", "scriptlet loops", "XSS/null risk"], evidence: "output sinks와 casts를 확인했습니다." },
  { id: "source-jsp02-response", repository: "nohssam/jspstudy", path: "jspstudy/src/main/webapp/day02/ex06_response.jsp", usedFor: ["redirect", "headers", "status", "content type"], evidence: "response 설명 source의 typo와 개념을 교정했습니다." },
  { id: "source-jsp02-ex11", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/day02/Ex11.java", usedFor: ["cmd dispatch", "forward", "encoding", "view selection"], evidence: "semantic controller closure를 감사했습니다." },
  { id: "source-jsp02-command", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/model/Command.java", usedFor: ["command contract"], evidence: "controller-command interface를 closure로 읽었습니다." },
  { id: "source-jsp02-one", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/model/OneCommand.java", usedFor: ["parameter-to-attribute flow"], evidence: "single parameter model producer를 확인했습니다." },
  { id: "source-jsp02-two", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/model/TwoCommand.java", usedFor: ["clock/random nondeterminism"], evidence: "시간·난수 호출을 실행 없이 확인했습니다." },
  { id: "source-jsp02-three", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/model/ThreeCommand.java", usedFor: ["numeric validation", "error view", "division zero"], evidence: "parse와 view outcomes를 확인했습니다." },
  { id: "source-jsp02-four", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/model/FourCommand.java", usedFor: ["multi values", "List model", "privacy"], evidence: "null 가능 배열과 sample 값 미출력 정책을 확인했습니다." },
  { id: "jakarta-servlet-spec", repository: "Jakarta EE", path: "Jakarta Servlet 6.1 Specification", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1.pdf", usedFor: ["request paths", "dispatch", "commit"], evidence: "Servlet primary specification입니다." },
  { id: "jakarta-servlet-request", repository: "Jakarta EE", path: "ServletRequest 6.1 API", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/servletrequest", usedFor: ["parameters", "attributes", "encoding"], evidence: "request contract primary API입니다." },
  { id: "jakarta-http-request", repository: "Jakarta EE", path: "HttpServletRequest 6.1 API", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletrequest", usedFor: ["context path", "URI", "metadata"], evidence: "HTTP request path primary API입니다." },
  { id: "jakarta-request-dispatcher", repository: "Jakarta EE", path: "RequestDispatcher 6.1 API", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/requestdispatcher", usedFor: ["forward", "include", "dispatch attributes"], evidence: "server dispatch primary API입니다." },
  { id: "jakarta-http-response", repository: "Jakarta EE", path: "HttpServletResponse 6.1 API", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletresponse", usedFor: ["sendRedirect", "status", "headers", "commit"], evidence: "HTTP response primary API입니다." },
  { id: "java-url-encoder", repository: "Java SE 21", path: "URLEncoder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLEncoder.html", usedFor: ["query form encoding"], evidence: "JDK URL form encoding API입니다." },
  { id: "whatwg-url", repository: "WHATWG", path: "URL Standard", publicUrl: "https://url.spec.whatwg.org/", usedFor: ["URL parsing", "relative references"], evidence: "browser URL primary standard입니다." },
  { id: "whatwg-html", repository: "WHATWG", path: "HTML syntax", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html", usedFor: ["attribute encoding"], evidence: "HTML parser primary standard입니다." },
  { id: "rfc9110", repository: "IETF", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110", usedFor: ["status", "redirect", "method semantics"], evidence: "HTTP semantics primary standard입니다." },
  { id: "owasp-xss", repository: "OWASP", path: "XSS Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["request metadata/model output"], evidence: "contextual output 보안 기준입니다." },
  { id: "owasp-unvalidated-redirects", repository: "OWASP", path: "Unvalidated Redirects and Forwards Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", usedFor: ["open redirect prevention"], evidence: "redirect target 실무 기준입니다." },
);

const reviewPairs: Array<[string, string]> = [
  ["request parameter와 attribute는 같은가요?", "아닙니다. parameter는 client 문자열 입력이고 attribute는 server component가 같은 request에 저장한 Object model입니다."],
  ["getParameterValues는 언제 null인가요?", "해당 이름의 parameter가 전혀 없을 때 null일 수 있으므로 필수/empty 정책이 필요합니다."],
  ["client required/JavaScript 검증만 믿어도 되나요?", "안 됩니다. client는 우회 가능하므로 server가 cardinality·type·range를 다시 검증합니다."],
  ["request encoding은 언제 설정하나요?", "body parameter가 최초 parse되기 전에 설정합니다."],
  ["GET query encoding도 setCharacterEncoding만으로 끝나나요?", "container connector의 URI/query decoding 설정과 규격을 함께 확인해야 합니다."],
  ["remote address는 항상 최종 사용자 IP인가요?", "아닙니다. proxy 뒤에서는 direct peer일 수 있습니다."],
  ["forwarded headers를 그대로 믿어도 되나요?", "아닙니다. trusted proxy가 정규화하고 source proxy를 allowlist한 경우에만 신뢰합니다."],
  ["getRemoteHost의 운영 비용은 무엇인가요?", "reverse DNS lookup이 latency와 외부 의존을 만들 수 있습니다."],
  ["request URL을 화면에 raw 출력해도 되나요?", "아닙니다. Host/URI는 외부 입력이며 XSS·privacy·proxy trust 검토가 필요합니다."],
  ["raw URI를 metric label로 쓰면 왜 나쁜가요?", "사용자별 path/query로 cardinality가 폭증할 수 있습니다."],
  ["root context path 값은 무엇인가요?", "empty string입니다."],
  ["/ex11은 non-root app에서도 내부 route인가요?", "아닙니다. origin root를 가리키므로 /study 배포에서는 context를 포함해야 합니다."],
  ["relative URL은 무엇을 기준으로 하나요?", "browser의 current document/base URL을 기준으로 resolve합니다."],
  ["forward된 JSP의 relative base는 JSP 파일 경로인가요?", "아닙니다. browser address가 바뀌지 않으므로 원래 client URL이 기준입니다."],
  ["query 전체를 URLEncoder에 넣나요?", "아닙니다. query name/value 같은 component만 encode합니다."],
  ["URL encoding 후 HTML attribute encoding이 왜 필요한가요?", "URL parser와 HTML parser가 서로 다른 문법을 해석하기 때문입니다."],
  ["context path를 scriptlet로 붙이는 대신 무엇을 쓰나요?", "c:url 또는 framework의 context-aware URL helper를 선호합니다."],
  ["requestURI를 redirect base로 쓰면 어떤 문제가 있나요?", "현재 route·forward path·사용자 입력이 섞여 잘못된 target이나 보안 문제가 생길 수 있습니다."],
  ["open redirect는 무엇인가요?", "사용자가 Location을 외부 악성 origin으로 조작할 수 있는 취약점입니다."],
  ["forward는 새 HTTP 요청인가요?", "아닙니다. server 내부에서 같은 request/response로 target 처리를 이어갑니다."],
  ["forward에서 request attributes는 유지되나요?", "네. 같은 request object를 사용하므로 target JSP가 읽을 수 있습니다."],
  ["forward하면 주소창이 바뀌나요?", "아닙니다. browser round trip이 없어 원래 URL이 남습니다."],
  ["forward 전에 body를 쓰면 왜 위험한가요?", "buffer가 commit되어 forward가 실패하거나 부분 응답이 생길 수 있습니다."],
  ["forward 뒤 controller가 계속 body를 써도 되나요?", "terminal dispatch로 취급해 더 쓰지 않는 것이 ownership을 명확하게 합니다."],
  ["include와 forward의 가장 큰 흐름 차이는?", "include는 fragment 결과를 합친 뒤 parent 처리가 계속되고 forward는 target에 terminal ownership을 넘깁니다."],
  ["include target이 status/redirect를 소유하나요?", "보통 included response contract에서 metadata 변경 효과가 제한됩니다."],
  ["INCLUDE_* attributes는 왜 있나요?", "같은 request methods와 별도로 included target의 path 정보를 제공하기 위해서입니다."],
  ["redirect는 request attributes를 유지하나요?", "아닙니다. client가 새 request를 만들어 R1 attributes는 사라집니다."],
  ["PRG는 무엇인가요?", "POST 성공 후3xx redirect로 canonical GET을 만들어 새로고침 중복 제출을 줄이는 pattern입니다."],
  ["검증 오류에도 redirect가 최선인가요?", "입력과 field errors를 보존하려면 같은 request forward가 더 단순한 경우가 많습니다."],
  ["flash message는 request attribute인가요?", "아닙니다. redirect 사이에서 한 번만 읽도록 설계한 별도 짧은 수명 저장 모델입니다."],
  ["response metadata는 언제 설정하나요?", "writer/body/flush 전에 status·Content-Type·charset·headers를 설정합니다."],
  ["commit 후 status를500으로 바꾸면 되나요?", "이미 전송된200을 바꿀 수 없거나 API가 실패합니다."],
  ["sendRedirect를 호출한 뒤 body를 써도 되나요?", "redirect를 terminal outcome으로 취급하고 더 쓰지 않습니다."],
  ["원본 unknown cmd default의 문제는?", "오타나 공격 입력이 다른 정상 기능으로 실행되어 실패가 숨겨집니다."],
  ["Integer.parseInt를 view에서 해야 하나요?", "아닙니다. controller validation에서 typed 오류로 바꾸고 view는 model만 읽습니다."],
  ["EL 직접 출력은 자동 XSS-safe인가요?", "아닙니다. sink context에 맞는 escaping이 필요합니다."],
  ["JSP에서 List를 cast/loop하는 대신 무엇을 하나요?", "controller가 typed immutable list model을 만들고 JSTL로 empty/iteration을 표현합니다."],
  ["cmd를 System.out에 찍는 것이 왜 문제인가요?", "구조화·redaction·correlation이 없고 PII/log forging/high volume 문제를 만들 수 있습니다."],
  ["JDK-only dispatch fixture의 한계는?", "실제 container의 FORWARD_/INCLUDE_ attributes, buffer, proxy integration은 별도 테스트가 필요합니다."],
];
(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(...reviewPairs.map(([question, answer]) => ({ question, answer })));

(session.completionChecklist as string[]).push(
  "direct JSP4를 모두 읽었다.", "controller closure6을 모두 읽었다.", "원본10 hashes를 확인했다.", "템플릿 사용자 값4를 출력하지 않았다.", "sample 사람 값을 출력하지 않았다.",
  "page directives5를 확인했다.", "expressions18을 확인했다.", "scriptlets2를 확인했다.", "EL8을 확인했다.", "getContextPath5를 확인했다.",
  "forms3을 확인했다.", "parameters7을 확인했다.", "attributes10을 확인했다.", "forward1을 확인했다.", "output/error view paths를 확인했다.",
  "LocalDate.now·Math.random을 실행하지 않았다.", "parseInt2 위험을 기록했다.", "request metadata 신뢰 경계를 설명한다.", "remote peer와 client IP를 구분한다.", "trusted proxy allowlist를 둔다.",
  "Host와 reconstructed URL을 untrusted로 다룬다.", "PII log를 최소화한다.", "raw URI metric label을 피한다.", "parameter와 attribute를 구분한다.", "missing single/multi cardinality를 검증한다.",
  "body parameter parse 전 encoding을 설정한다.", "GET query decoding 설정을 확인한다.", "null array를 empty/validation outcome으로 바꾼다.", "context path root empty를 처리한다.", "non-root context를 처리한다.",
  "application route와 requestURI를 구분한다.", "relative URL base를 설명한다.", "path와 query components를 따로 encode한다.", "URL과 HTML attribute encoding을 구분한다.", "c:url/helper를 선호한다.",
  "open redirect allowlist를 둔다.", "forward가 same request임을 안다.", "forward에서 attributes를 유지한다.", "forward 전 body를 쓰지 않는다.", "forward를 terminal outcome으로 다룬다.",
  "include body 순서를 설명한다.", "INCLUDE_* attributes를 안다.", "include metadata 제약을 안다.", "fragment partial failure를 test한다.", "include target을 allowlist한다.",
  "redirect가 새 request를 만듦을 안다.", "PRG에303을 고려한다.", "검증 오류 forward와 성공 redirect를 구분한다.", "flash의 one-time 수명을 설계한다.", "response metadata를 body 전에 설정한다.",
  "UTF-8 charset을 writer 전에 설정한다.", "commit 뒤 mutation을 거부한다.", "redirect/error를 terminal로 다룬다.", "public error와 internal cause를 분리한다.", "unknown cmd를 explicit하게 거부한다.",
  "numeric/operator validation을 controller에서 한다.", "clock/random을 dependency로 주입한다.", "view Object casts를 제거한다.", "HTML output을 contextually encode한다.", "structured redacted log를 사용한다.",
  "모든 Java examples가 warning0임을 검증한다.", "모든 exact outputs를 검증한다.", "root/non-root integration 범위를 문서화했다.", "real Servlet dispatcher integration 범위를 문서화했다.", "source graph와 walkthrough ranges를 검증했다."
);
