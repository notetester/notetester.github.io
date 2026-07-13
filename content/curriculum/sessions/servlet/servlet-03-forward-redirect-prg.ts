import type { DetailedSession, DetailedChapter } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

type Seed = {
  id: string; title: string; lead: string; explanations: string[];
  terms: Array<[string, string, string[]]>; filename: string; code: string; output: string; refs: string[];
  diagnostics: Array<[string, string, string[], string, string]>; notes?: string[];
};

const walkthroughFor = (code: string) => {
  const last = code.split(/\r?\n/).length;
  const first = Math.ceil(last / 3);
  const second = Math.ceil((last * 2) / 3);
  return [
    { lines: `1-${first}`, explanation: "request, response 또는 navigation state를 작은 immutable type으로 선언합니다." },
    { lines: `${first + 1}-${second}`, explanation: "forward/redirect/commit/replay 정책을 side effect 이전에 결정합니다." },
    { lines: `${second + 1}-${last}`, explanation: "경계 사례를 실행해 method·URL·attributes·status·body 결과를 exact하게 검증합니다." },
  ];
};

const chapter = (s: Seed): DetailedChapter => ({
  id: s.id, title: s.title, lead: s.lead, explanations: s.explanations,
  concepts: s.terms.map(([term, definition, detail]) => ({ term, definition, detail })),
  codeExamples: [{
    id: `java-${s.id}`, title: s.title, language: "java", filename: s.filename,
    purpose: `${s.title}의 dispatch·HTTP 불변식을 container 없이 결정적으로 모델링합니다.`, code: s.code,
    walkthrough: walkthroughFor(s.code),
    run: { environment: ["OpenJDK 21", "PowerShell 7+", "container/network 불필요"], command: isolatedJavaRun(s.filename, s.filename.replace(/\.java$/, "")) },
    output: { value: s.output, explanation: ["고정 입력이라 exact output입니다.", "실제 RequestDispatcher/sendRedirect는 container integration에서 같은 계약으로 재검증합니다."] },
    experiments: [
      { change: "dispatch 직전 response를 commit합니다.", prediction: "forward가 거부되어야 합니다.", result: "write와 navigation을 한 handler에서 섞지 않습니다." },
      { change: "context path 또는 query 값을 바꿉니다.", prediction: "URL builder가 path/query component를 각각 encode합니다.", result: "문자열 연결과 open redirect를 피합니다." },
      { change: "같은 POST 또는 redirect를 반복합니다.", prediction: "PRG/idempotency 정책에 따라 중복 effect가 통제됩니다.", result: "browser UX와 server exactly-once 착각을 구분합니다." },
    ],
    sourceRefs: s.refs,
  }],
  diagnostics: s.diagnostics.map(([symptom, likelyCause, checks, fix, prevention]) => ({ symptom, likelyCause, checks, fix, prevention })),
  expertNotes: s.notes,
});

const session: DetailedSession = {
  schemaVersion: 2,
  inventoryIds: ["servlet-03-forward-redirect-prg"],
  slug: "servlet-03-forward-redirect-prg",
  courseId: "servlet-jsp",
  moduleId: "servlet-http-lifecycle",
  order: 3,
  title: "Servlet forward·redirect·PRG와 안전한 이동",
  subtitle: "같은 요청의 server dispatch와 새 HTTP 요청을 만드는 redirect를 commit, URL, method, flash, loop, replay와 보안 경계까지 연결합니다.",
  level: "중급",
  estimatedMinutes: 840,
  coreQuestion: "처리 결과를 다른 view/resource로 넘길 때 forward와 redirect 중 무엇을 선택하고, commit·method·state·중복 제출·외부 URL 위험을 어떻게 통제해야 할까요?",
  summary: "원본 Java Ex08·Ex08_2·Ex09, JSP request/response 자료2와 HelloServlet closure를 모두 읽고 hash합니다. Java3은 Servlet API compile warning3, closure는 warning1입니다. Ex08은 HTML body를 끝까지 쓴 뒤 active forward1을 호출해 buffer가 commit되면 IllegalStateException 또는 부분 응답 위험이 있습니다. source comments에는 redirect 설명이 있지만 active sendRedirect는0이고, Ex09는 calculator/fortune switch라 이동 예제가 아닙니다. ex04_request.jsp는 request metadata expression11, ex06_response.jsp는 response 설명 comments뿐입니다. 현대 JDK-only fixtures는 forward/redirect state, request attributes, flash, commit, PRG, context path URL, 302/303/307/308, open redirect, loop, dispatcher types와 idempotency replay를 warning0 exact output으로 검증합니다.",
  objectives: [
    "forward와 redirect를 request count, address bar, attributes, target 범위로 비교한다.",
    "forward 전에 response body를 쓰지 않고 commit state를 검사한다.",
    "request parameter와 attribute를 구분해 view model을 전달한다.",
    "PRG로 browser refresh 중복 제출 UX를 줄이고 idempotency와 구분한다.",
    "context path·path segment·query를 component별로 안전하게 구성한다.",
    "302·303·307·308의 method preservation 차이를 설명한다.",
    "open redirect와 CRLF/loop를 allowlist·hop budget으로 막는다.",
    "REQUEST/FORWARD/ERROR/ASYNC dispatch와 filter 재진입을 설계한다.",
  ],
  prerequisites: [
    { title: "요청 파라미터·인코딩", reason: "redirect query와 forward request state를 안전하게 다뤄야 합니다.", sessionSlug: "servlet-02-request-parameters-encoding" },
    { title: "Servlet 수명주기와 응답 commit", reason: "forward 가능한 시점은 response commit과 직접 연결됩니다.", sessionSlug: "servlet-01-mapping-lifecycle-response" },
  ],
  keywords: ["RequestDispatcher", "forward", "redirect", "sendRedirect", "PRG", "303 See Other", "307", "308", "request attribute", "flash", "context path", "open redirect", "response commit", "dispatcher type", "idempotency key"],
  chapters: [],
  lab: {
    title: "주문 생성 PRG·flash·idempotency navigation pipeline",
    scenario: "POST /orders가 검증 실패에는 forward, 성공에는303 redirect를 사용하고 refresh/retry에도 중복 주문을 만들지 않게 합니다.",
    setup: ["valid/invalid POST, committed response, non-root context, malicious next URL, duplicate key와 loop fixtures를 준비합니다.", "request attributes, session flash, order store와 replay record를 분리합니다."],
    steps: ["POST를 budget/decode/validate합니다.", "검증 실패는 request-scoped errors/model과 함께 view로 forward합니다.", "성공 mutation은 idempotency key로 한 번만 commit합니다.", "303 Location을 context path 기준 내부 URL로 만듭니다.", "한 번 소비되는 flash id를 session에 저장합니다.", "GET result가 flash를 consume하고 canonical resource를 render합니다.", "redirect target allowlist와 CRLF를 검사합니다.", "hop budget과 dispatcher-type filter policy를 검증합니다."],
    expectedResult: ["invalid input은 URL 변경 없이 같은 request model로 render됩니다.", "valid POST는303→GET이며 refresh는 GET만 반복합니다.", "동일 idempotency key는 같은 결과를 재사용하고 payload conflict는 거부합니다.", "외부 redirect·commit-before-forward·loop가 bounded failure가 됩니다."],
    cleanup: ["owned in-memory store와 temp를 비웁니다.", "session flash가 한 번 소비됐는지 확인합니다."],
    extensions: ["real Servlet container integration으로 status/Location/dispatcher type을 검증합니다.", "transactional outbox와 payment provider key를 결합합니다.", "reverse proxy forwarded headers trust policy를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "검증 실패 forward와 성공303 redirect controller를 설계하세요.", requirements: ["forward 전에 body를 쓰지 않습니다.", "errors를 request attribute에 둡니다.", "Location에 context path를 포함합니다.", "성공 redirect target은 내부 경로입니다."], hints: ["render 또는 navigate 중 하나만 선택하세요."], expectedOutcome: "status/URL/request count/state matrix가 통과합니다.", solutionOutline: ["decision result를 Forward 또는 Redirect 합타입으로 만듭니다."] },
    { difficulty: "응용", prompt: "session flash를 정확히 한 번 소비하게 만드세요.", requirements: ["flash id를 사용합니다.", "session 전체 map race를 막습니다.", "두 GET 동시 소비를 test합니다.", "TTL/size limit를 둡니다.", "민감 payload를 넣지 않습니다."], hints: ["get 후 remove는 atomic하지 않을 수 있습니다."], expectedOutcome: "동시 요청 중 하나만 message를 받고 나머지는 empty입니다.", solutionOutline: ["atomic remove 또는 synchronized session-owned abstraction을 씁니다."] },
    { difficulty: "설계", prompt: "결제 POST의 retry-safe ADR을 작성하세요.", requirements: ["PRG와 idempotency를 구분합니다.", "key scope/entropy/TTL을 정합니다.", "payload hash conflict를 처리합니다.", "DB transaction과 external provider 호출 순서를 다룹니다.", "replay response와 observability를 정의합니다."], hints: ["HTTP redirect만으로 network retry를 막지 못합니다."], expectedOutcome: "browser refresh, timeout retry, concurrent duplicate를 모두 다루는 계약이 완성됩니다.", solutionOutline: ["durable key record와 outcome replay를 mutation transaction에 결합합니다."] },
  ],
  reviewQuestions: [], completionChecklist: [],
  nextSessions: ["servlet-04-attributes-scopes-session"],
  sources: [],
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: [
    "inventory Java3+JSP2와 Ex08/Ex08_2 compile에 필요한 HelloServlet closure1을 직접 읽고 hash했습니다.",
    "JSP는 container/JSP compiler를 실행하지 않고 active expression/directive shape만 감사합니다. Java는 JDK21+ServletAPI compile evidence를 냅니다.",
    "comments의 redirect 오타/설명은 active sendRedirect로 세지 않았고 Ex09의 calculator 성격도 명시했습니다.",
  ] },
};

const audit: DetailedChapter = {
  id: "original-servlet03-java3-jsp2-closure-audit",
  title: "원본 Java3·JSP2와 Hello closure의 실제 dispatch shape를 감사합니다",
  lead: "주석 속 redirect 설명과 active call을 분리하고, Ex08의 write-before-forward를 source evidence로 고정합니다.",
  explanations: [
    "Ex08은 response writer를 얻어 완전한 HTML 문서를 출력한 뒤 req.getRequestDispatcher(\"ex08_2\").forward합니다. buffer가 아직 commit되지 않았더라도 앞선 body를 reset할 책임을 container에 떠넘기는 취약한 구조입니다.",
    "Ex08_2는 같은 uname/uage parameters를 다시 읽습니다. forward는 같은 request object를 사용하므로 parameters와 attributes가 유지되지만 redirect라면 새 request입니다.",
    "Ex09는 cmd 1/2 운세·계산기 switch와 nested operator switch를 가진 source로 forward/redirect가 없습니다. inventory에 포함됐다는 사실과 교육 주제를 억지로 동일시하지 않습니다.",
    "ex04_request.jsp는 remote address/host/port, content length/encoding/type, protocol/method, URI/URL/context path expression11을 active render합니다. reverse proxy 뒤 값의 trust/privacy는 별도 고려가 필요합니다.",
    "ex06_response.jsp의 sendRedirection, Refresh header와 status 설명은 JSP comment 안에만 있으며 active response call은0입니다. typo를 API로 가르치지 않습니다.",
    "audit은 source6 hashes, closure warning1, inventory Java warning3와 mapping3/forward1/dispatcher1/sendRedirect0/JSP expressions11을 검증하되 container/network를 실행하지 않습니다.",
  ],
  concepts: [
    { term: "active-code evidence", definition: "comments와 documentation text를 제거한 실제 executable call shape입니다.", detail: ["오타 설명을 기능으로 세지 않습니다.", "runtime behavior와도 구분합니다."] },
    { term: "forward precondition", definition: "response가 아직 committed되지 않아 target이 response를 소유할 수 있는 상태입니다.", detail: ["controller는 body를 쓰지 않습니다.", "한 request 내부 dispatch입니다."] },
    { term: "request metadata", definition: "client/proxy/connector가 만든 method, URI, addresses와 representation metadata입니다.", detail: ["일부 값은 proxy trust 설정에 좌우됩니다.", "PII logging을 제한합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-servlet03-audit", title: "Java/JSP 원본 hash·compile·active shape를 검증합니다", language: "powershell", filename: "verify-original-servlet03.ps1",
    purpose: "container 없이 원본6의 provenance와 dispatch evidence를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot,[Parameter(Mandatory)][string]$ServletApiJar)
$ErrorActionPreference='Stop';$names=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS');$saved=@{}
foreach($n in $names){$i=Get-Item ("Env:"+$n)-ErrorAction SilentlyContinue;$saved[$n]=@{Exists=$null-ne$i;Value=if($i){$i.Value}else{$null}};Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar);$root=Join-Path $base ("servlet03 audit "+[Guid]::NewGuid().ToString('N'));$owned=$false;$failure=$null
function StripJava([string]$s){return [regex]::Replace(([regex]::Replace($s,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
function StripJsp([string]$s){return [regex]::Replace($s,'(?s)<%--.*?--%>','')}
try{
  if(-not(Test-Path -LiteralPath $ServletApiJar -PathType Leaf)){throw 'servlet api jar missing'};New-Item -ItemType Directory -Path $root|Out-Null;$owned=$true
  $java=@('src/main/java/org/study/jspstudy/day01/Ex08.java','src/main/java/org/study/jspstudy/day01/Ex08_2.java','src/main/java/org/study/jspstudy/day01/Ex09.java');$jsp=@('src/main/webapp/day02/ex04_request.jsp','src/main/webapp/day02/ex06_response.jsp');$closure='src/main/java/org/study/jspstudy/HelloServlet.java';$all=@($closure)+$java+$jsp;$copy=@{}
  foreach($rel in $all){$src=Get-Item -LiteralPath (Join-Path $SourceRoot $rel);$dst=Join-Path $root $rel;New-Item -ItemType Directory ([IO.Path]::GetDirectoryName($dst))-Force|Out-Null;[IO.File]::Copy($src.FullName,$dst);if((Get-FileHash $src.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $dst -Algorithm SHA256).Hash){throw 'hash drift'};$copy[$rel]=$dst}
  $classes=Join-Path $root 'classes';New-Item -ItemType Directory $classes|Out-Null;$common=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics')
  $c1=@(& javac @common -cp $ServletApiJar -d $classes $copy[$closure] 2>&1);if($LASTEXITCODE-ne0-or@($c1|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count-ne1){throw 'closure compile drift'}
  $cp=$ServletApiJar+[IO.Path]::PathSeparator+$classes;$c2=@(& javac @common -cp $cp -d $classes @($java|ForEach-Object{$copy[$_]}) 2>&1);if($LASTEXITCODE-ne0-or@($c2|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count-ne3-or$c2[-1]-notmatch'3 warnings'){throw 'inventory compile drift'}
  $j=(@($java|ForEach-Object{StripJava([IO.File]::ReadAllText($copy[$_]))}))-join[Environment]::NewLine;$p=(@($jsp|ForEach-Object{StripJsp([IO.File]::ReadAllText($copy[$_]))}))-join[Environment]::NewLine
  $shape=@{mapping=([regex]::Matches($j,'@WebServlet\s*\(')).Count;servlet=([regex]::Matches($j,'extends\s+HttpServlet\b')).Count;init=([regex]::Matches($j,'\bvoid\s+init\s*\(')).Count;doGet=([regex]::Matches($j,'\bvoid\s+doGet\s*\(')).Count;doPost=([regex]::Matches($j,'\bvoid\s+doPost\s*\(')).Count;writer=([regex]::Matches($j,'\.getWriter\s*\(')).Count;parameter=([regex]::Matches($j,'\.getParameter\s*\(')).Count;forward=([regex]::Matches($j,'\.forward\s*\(')).Count;dispatcher=([regex]::Matches($j,'\.getRequestDispatcher\s*\(')).Count;redirect=([regex]::Matches($j,'\.sendRedirect\s*\(')).Count;switch=([regex]::Matches($j,'\bswitch\s*\(')).Count;cases=([regex]::Matches($j,'\bcase\s+')).Count;defaults=([regex]::Matches($j,'\bdefault\s*:')).Count;expressions=([regex]::Matches($p,'<%=')).Count;jspRedirect=([regex]::Matches($p,'sendRedirect|sendRedirection')).Count}
  if($shape.mapping-ne3-or$shape.servlet-ne3-or$shape.init-ne3-or$shape.doGet-ne3-or$shape.doPost-ne3-or$shape.writer-ne3-or$shape.parameter-ne8-or$shape.forward-ne1-or$shape.dispatcher-ne1-or$shape.redirect-ne0-or$shape.switch-ne2-or$shape.cases-ne6-or$shape.defaults-ne2-or$shape.expressions-ne11-or$shape.jspRedirect-ne0){throw ('shape drift '+($shape|ConvertTo-Json -Compress))}
  'files=java3+jsp2+closure1,hashes=6|compile=closureWarning1+javaWarnings3|jsp=hash+active-shape-only'
  'shape=mapping3,servlet3,init3,doGet3,doPost3,writer3,parameter8,forward1,dispatcher1,sendRedirect0,switch2,cases6,defaults2,jspExpressions11,jspRedirect0'
  'privacy=container:not-run|network:none|original:read-only|fixture:owned-temp'
}catch{$failure=$_.Exception}finally{foreach($n in $names){if($saved[$n].Exists){Set-Item ("Env:"+$n) $saved[$n].Value}else{Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}};if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item -LiteralPath $resolved -Recurse -Force};if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}}`,
    walkthrough: [
      { lines: "1-8", explanation: "launcher environment와 owned temp를 준비하고 Java/JSP comment stripper를 분리합니다." },
      { lines: "9-13", explanation: "Java3·JSP2·closure1을 package/web path 그대로 복사해 SHA-256을 검증합니다." },
      { lines: "14-16", explanation: "closure warning1과 inventory Java warning3을 ServletAPI compile로 분리합니다." },
      { lines: "17-20", explanation: "active Java dispatch와 JSP expression/call shape를 comments 밖에서 셉니다." },
      { lines: "21-end", explanation: "JSP 미compile/container 미실행 경계와 안전 cleanup을 출력합니다." },
    ],
    run: { environment: ["PowerShell 7+", "OpenJDK 21", "Jakarta Servlet API 6.1 jar", "jspstudy root"], command: "pwsh -NoProfile -File verify-original-servlet03.ps1 -SourceRoot <jspstudy-root> -ServletApiJar <servlet-api.jar>" },
    output: { value: "files=java3+jsp2+closure1,hashes=6|compile=closureWarning1+javaWarnings3|jsp=hash+active-shape-only\nshape=mapping3,servlet3,init3,doGet3,doPost3,writer3,parameter8,forward1,dispatcher1,sendRedirect0,switch2,cases6,defaults2,jspExpressions11,jspRedirect0\nprivacy=container:not-run|network:none|original:read-only|fixture:owned-temp", explanation: ["주석의 redirect를 active 기능으로 세지 않습니다.", "JSP 미compile 사실을 명시합니다.", "원본을 변경하지 않습니다."] },
    experiments: [
      { change: "Ex08 response buffer를 작게 하고 긴 body를 씁니다.", prediction: "forward 전에 commit되어 IllegalStateException 위험이 커집니다.", result: "controller에서 body write를 제거해야 합니다." },
      { change: "forward를 redirect로 바꿉니다.", prediction: "uname/uage parameter는 자동 보존되지 않고 address bar가 바뀝니다.", result: "새 request state 전달 정책이 필요합니다." },
      { change: "ex06_response.jsp comments를 제거합니다.", prediction: "active response navigation behavior는 여전히0입니다.", result: "documentation text와 executable evidence를 분리합니다." },
    ],
    sourceRefs: ["source-ex08", "source-ex08-2", "source-ex09", "source-request-jsp", "source-response-jsp", "source-hello-closure", "jdk-javac", "jakarta-dispatcher", "jakarta-response"],
  }],
  diagnostics: [
    { symptom: "forward에서 IllegalStateException이 난다.", likelyCause: "Ex08이 response body를 써 buffer를 commit한 뒤 forward했습니다.", checks: ["isCommitted를 봅니다.", "writer/body write 순서를 찾습니다.", "buffer size와 flush를 봅니다."], fix: "controller는 model만 만들고 body를 쓰지 않은 채 view로 forward합니다.", prevention: "render 또는 navigation 하나만 반환하는 controller result를 씁니다." },
    { symptom: "문서에는 redirect가 있는데 실제로 동작하지 않는다.", likelyCause: "설명이 comment에만 있고 active sendRedirect call은0입니다.", checks: ["comments 제거 source를 봅니다.", "typo sendRedirection을 찾습니다.", "network status/Location을 봅니다."], fix: "정확한 API와 status/Location contract를 executable test로 작성합니다.", prevention: "documentation example도 compile/integration test합니다." },
  ],
};
session.chapters.push(audit);

const seeds: Seed[] = [
  {
    id: "forward-redirect-state-model", title: "forward와 redirect를 request/response 상태 전이로 비교합니다", lead: "forward는 같은 server request 내부 dispatch이고 redirect는3xx 응답 뒤 client가 새 요청을 만드는 두 단계입니다.",
    explanations: ["forward는 동일 request object와 response를 target resource에 넘기며 browser address bar는 최초 URL을 유지합니다.", "redirect는 Location을 포함한 HTTP response입니다. client가 Location을 해석해 새 request를 보낼 수 있지만 자동 follow는 client 정책입니다.", "forward target은 같은 web application의 dispatcher 경계이고 redirect는 허용한다면 다른 origin도 가리킬 수 있습니다.", "forward에는 request attributes가 유지되지만 redirect에는 자동으로 유지되지 않습니다. query, session flash 또는 durable resource id를 선택합니다.", "decision table에는 request count, method, URL, state lifetime, commit precondition과 target trust를 함께 둡니다."],
    terms: [["server-side dispatch", "같은 request processing 안에서 다른 resource로 제어를 넘기는 동작입니다.", ["address bar가 바뀌지 않습니다.", "request state가 유지됩니다."]], ["client-side navigation", "3xx/Location을 받은 client가 새 HTTP request를 만드는 동작입니다.", ["새 request identity입니다.", "외부 target 위험이 있습니다."]]],
    filename: "DispatchStateModel.java", code: String.raw`public class DispatchStateModel {
    record State(int requests, String browserUrl, boolean attributes, String targetScope) {}
    static State forward(String original) { return new State(1, original, true, "same-app"); }
    static State redirect(String location) { return new State(2, location, false, "client-resolved"); }
    public static void main(String[] args) {
        System.out.println("forward=" + forward("/app/form"));
        System.out.println("redirect=" + redirect("/app/result/42"));
    }
}`,
    output: "forward=State[requests=1, browserUrl=/app/form, attributes=true, targetScope=same-app]\nredirect=State[requests=2, browserUrl=/app/result/42, attributes=false, targetScope=client-resolved]", refs: ["jakarta-dispatcher", "jakarta-response", "rfc9110-redirection"],
    diagnostics: [["redirect 뒤 request attribute가 null이다.", "새 request인데 forward와 같은 lifetime을 기대했습니다.", ["network request count를 봅니다.", "status/Location을 봅니다."], "durable id, query 또는 one-time flash를 사용합니다.", "navigation state matrix를 test합니다."], ["forward했는데 주소창이 target으로 안 바뀐다.", "server-side dispatch의 정상 특성입니다.", ["dispatcher type과 original URI를 봅니다."], "주소 변경이 요구되면 redirect를 선택합니다.", "UX 요구와 dispatch 방식을 ADR에 연결합니다."]],
  },
  {
    id: "forward-parameters-attributes-view-model", title: "forward에는 parameter를 보존하고 attribute로 typed view model을 추가합니다", lead: "parameter는 client input이고 attribute는 server가 같은 request 안에서 계산한 객체라는 provenance가 다릅니다.",
    explanations: ["Ex08_2가 uname/uage를 다시 getParameter하는 것은 same request forward라 가능하지만 raw input을 view가 재해석하게 만듭니다.", "controller가 validated DTO, field errors와 result를 request attribute로 설정하면 view는 business parsing 없이 render에 집중합니다.", "parameter와 attribute에 같은 name을 쓰면 JSP EL lookup과 유지보수가 혼란스러우므로 model namespace를 명시합니다.", "attribute value도 HTML output에서는 escape해야 하며 object가 trusted markup이 되는 것은 아닙니다.", "include/forward target은 controller mutation을 반복하지 않도록 view-only path로 제한합니다."],
    terms: [["request parameter", "client가 전송한 문자열 입력입니다.", ["untrusted입니다.", "decode/validate가 필요합니다."]], ["request attribute", "server code가 현재 request에 연결한 객체입니다.", ["forward에 유지됩니다.", "request 종료와 함께 사라집니다."]]],
    filename: "ForwardViewModel.java", code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class ForwardViewModel {
    record Request(Map<String, String> parameters, Map<String, Object> attributes) {}
    static Request controller(Map<String, String> raw) {
        Map<String, Object> model = new LinkedHashMap<>();
        String name = raw.get("name");
        model.put("view.user", name == null || name.isBlank() ? "guest" : name.strip());
        model.put("view.valid", name != null && !name.isBlank());
        return new Request(Map.copyOf(raw), Map.copyOf(model));
    }
    public static void main(String[] args) {
        Request request = controller(Map.of("name", " 서울 "));
        System.out.println("parameter=" + request.parameters().get("name"));
        System.out.println("attribute=" + request.attributes().get("view.user"));
        System.out.println("sameRequest=true");
    }
}`,
    output: "parameter= 서울 \nattribute=서울\nsameRequest=true", refs: ["jakarta-request", "jakarta-dispatcher", "jakarta-el"],
    diagnostics: [["view가 숫자 parsing 예외를 낸다.", "controller가 raw parameter만 넘기고 typed model을 만들지 않았습니다.", ["view scriptlet/EL logic을 봅니다.", "attribute types를 봅니다."], "controller에서 validate/convert하고 view model을 attribute로 전달합니다.", "view logic 제한 tests를 둡니다."], ["parameter와 attribute 중 어느 값이 보이는지 혼란스럽다.", "같은 name을 두 namespaces에 재사용했습니다.", ["EL resolver order를 봅니다.", "request map을 덤프하지 말고 key만 봅니다."], "view.* 같은 명확한 model keys와 scoped EL을 씁니다.", "key collision test를 둡니다."]],
  },
  {
    id: "redirect-flash-one-time-state", title: "redirect 사이의 일회성 message는 bounded flash로 전달합니다", lead: "session에 임의 object를 계속 쌓지 않고 opaque id, TTL, atomic consume으로 한 번만 보이는 상태를 만듭니다.",
    explanations: ["redirect는 새 request라 request attributes가 사라집니다. 성공 알림처럼 한 번 보여야 하는 값은 session-backed flash 또는 durable event id가 필요합니다.", "flash를 고정 key 하나에 저장하면 여러 tabs와 동시 requests가 서로 덮거나 잘못 소비할 수 있습니다. 랜덤 id와 owner/session binding을 둡니다.", "read 후 remove 두 단계는 race가 있어 atomic remove가 필요합니다.", "TTL, item count, message length를 제한하고 secret·large domain object를 넣지 않습니다.", "stateless deployment에서는 shared store 또는 signed bounded token을 검토하며 replay·tamper 정책을 명시합니다."],
    terms: [["flash", "다음 navigation request에서 한 번 소비하는 짧은 상태입니다.", ["request보다 길고 session보다 짧습니다.", "TTL과 atomic consume이 필요합니다."]], ["atomic consume", "한 operation으로 값을 제거하며 반환해 동시 소비자 하나만 성공시키는 동작입니다.", ["get+remove race를 피합니다.", "store semantics를 test합니다."]]],
    filename: "FlashStore.java", code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class FlashStore {
    private final Map<String, String> values = new LinkedHashMap<>();
    synchronized void put(String id, String message) {
        if (values.size() >= 2 || message.length() > 20) throw new IllegalArgumentException("budget");
        values.put(id, message);
    }
    synchronized String consume(String id) { return values.remove(id); }
    public static void main(String[] args) {
        FlashStore store = new FlashStore();
        store.put("f-1", "saved");
        System.out.println("first=" + store.consume("f-1"));
        System.out.println("second=" + store.consume("f-1"));
    }
}`,
    output: "first=saved\nsecond=null", refs: ["jakarta-session", "java-map"],
    diagnostics: [["다른 tab의 성공 message가 보인다.", "session flash가 고정 key 하나를 공유합니다.", ["flash key와 owner를 봅니다.", "동시 navigation trace를 봅니다."], "opaque flash id를 redirect URL에 두고 session/owner와 bind합니다.", "multi-tab tests를 둡니다."], ["같은 flash가 두 번 보인다.", "consume이 atomic하지 않거나 remove가 누락됐습니다.", ["store get/remove 순서를 봅니다.", "동시 GET을 재현합니다."], "atomic remove-and-return을 사용합니다.", "two-consumer concurrency test를 둡니다."]],
  },
  {
    id: "commit-before-forward-boundary", title: "forward 전에 response ownership을 넘기고 commit을 금지합니다", lead: "controller가 writer를 얻고 body를 출력한 뒤 forward하는 Ex08 패턴을 명시적 response state machine으로 거부합니다.",
    explanations: ["response buffer가 flush되거나 가득 차면 status/headers가 committed됩니다. committed response에는 forward가 IllegalStateException을 낼 수 있습니다.", "forward 전에 아직 commit되지 않았더라도 target이 buffer를 clear하는 구현 detail에 기대면 앞선 작업이 낭비되고 filters와 headers가 예측하기 어렵습니다.", "controller는 status/model/navigation decision만 만들고 renderer 하나가 body를 소유해야 합니다.", "redirect도 body write 전에 status/Location을 결정하며 sendRedirect 뒤 return해 추가 write를 막습니다.", "isCommitted check는 진단에 유용하지만 race를 고치는 설계는 single response owner입니다."],
    terms: [["response ownership", "한 dispatch 흐름에서 status, headers와 body를 최종 확정할 단일 component 책임입니다.", ["double render를 막습니다.", "navigation과 render를 합타입으로 둡니다."]], ["commit", "status/headers가 client 전송 대상으로 확정된 상태입니다.", ["forward precondition을 깨뜨립니다.", "buffer/flush에 좌우됩니다."]]],
    filename: "CommitBeforeForward.java", code: String.raw`public class CommitBeforeForward {
    static final class Response {
        private boolean committed;
        void write(String body) { if (!body.isEmpty()) committed = true; }
        void forward(String path) {
            if (committed) throw new IllegalStateException("committed:" + path);
            System.out.println("forward=" + path);
        }
    }
    public static void main(String[] args) {
        Response clean = new Response();
        clean.forward("/WEB-INF/result.jsp");
        Response dirty = new Response();
        dirty.write("<!doctype html>");
        try { dirty.forward("/result"); } catch (IllegalStateException e) { System.out.println(e.getMessage()); }
    }
}`,
    output: "forward=/WEB-INF/result.jsp\ncommitted:/result", refs: ["jakarta-dispatcher", "jakarta-response", "servlet-spec"],
    diagnostics: [["작은 body에서는 되고 큰 body에서만 forward가 실패한다.", "buffer size에 따라 commit 시점이 달라집니다.", ["response buffer/flush를 봅니다.", "body bytes를 바꿔 재현합니다."], "forwarding controller에서 모든 body write를 제거합니다.", "buffer 크기에 무관한 integration test를 둡니다."], ["redirect 뒤 HTML 조각이 붙는다.", "sendRedirect 뒤 return하지 않고 writer가 계속 실행됐습니다.", ["control flow와 committed status를 봅니다."], "navigation result를 반환해 handler를 즉시 종료합니다.", "single terminal action invariant를 test합니다."]],
  },
  {
    id: "post-redirect-get-pattern", title: "PRG로 성공 POST refresh를 GET으로 바꿉니다", lead: "mutation POST가 성공하면 canonical result URL로303을 보내 browser history의 마지막 page를 safe GET으로 만듭니다.",
    explanations: ["POST response를 직접 render하면 refresh가 POST 재전송 confirmation 또는 중복 mutation을 만들 수 있습니다.", "PRG는 POST가 mutation을 commit한 뒤303 Location을 보내고 client가 GET result를 요청하는 sequence입니다.", "validation failure는 보통 mutation이 없으므로 errors와 submitted model을 같은 request로 forward해도 됩니다.", "PRG는 browser refresh UX를 개선하지만 timeout/network retry, concurrent duplicate와 malicious replay를 막지 못합니다.", "redirect Location은 newly created resource의 stable id를 가리키고 GET은 재실행 가능한 read-only render여야 합니다."],
    terms: [["PRG", "POST 처리 후 redirect하고 결과를 GET으로 조회하는 navigation pattern입니다.", ["refresh가 GET을 반복합니다.", "idempotency 대체물이 아닙니다."]], ["canonical result URL", "생성된 resource를 안정적으로 조회하는 주소입니다.", ["session state에 덜 의존합니다.", "bookmark/share 정책을 정합니다."]]],
    filename: "PostRedirectGet.java", code: String.raw`import java.util.ArrayList;
import java.util.List;

public class PostRedirectGet {
    static final List<String> orders = new ArrayList<>();
    record Response(int status, String location, String body) {}
    static Response post(String item) {
        if (item == null || item.isBlank()) return new Response(200, "-", "forward:errors");
        orders.add(item); int id = orders.size();
        return new Response(303, "/orders/" + id, "");
    }
    static Response get(int id) { return new Response(200, "-", "order=" + orders.get(id - 1)); }
    public static void main(String[] args) {
        Response redirect = post("book");
        System.out.println(redirect);
        System.out.println(get(1));
        System.out.println("refresh=" + get(1).body() + ",count=" + orders.size());
    }
}`,
    output: "Response[status=303, location=/orders/1, body=]\nResponse[status=200, location=-, body=order=book]\nrefresh=order=book,count=1", refs: ["rfc9110-303", "rfc9110-post", "jakarta-response"],
    diagnostics: [["refresh 때 주문이 다시 생성된다.", "성공 POST response를 직접 render했습니다.", ["network history의 마지막 method를 봅니다.", "mutation count를 봅니다."], "성공 뒤303으로 canonical GET에 redirect합니다.", "POST→303→GET sequence test를 둡니다."], ["PRG인데도 timeout retry에서 중복된다.", "PRG를 idempotency로 오해했습니다.", ["동일 POST가 server에 몇 번 도착했는지 봅니다.", "key record를 찾습니다."], "durable idempotency key/outcome replay를 추가합니다.", "concurrent duplicate tests를 둡니다."]],
  },
  {
    id: "context-path-location-builder", title: "Location을 context path와 component별 encoding으로 구성합니다", lead: "root 배포 가정과 문자열 연결을 버리고 application-relative path, segment와 query를 서로 다른 규칙으로 만듭니다.",
    explanations: ["/result 같은 absolute-path reference는 host root를 가리켜 /school context deployment에서 application 밖으로 나갈 수 있습니다.", "request.getContextPath와 application path를 결합하되 proxy가 보낸 Host/Scheme을 무조건 신뢰해 absolute URL을 만들지 않습니다.", "path segment의 slash와 query value의 &,=은 의미가 달라 URLEncoder 하나를 전체 URL에 적용하면 안 됩니다.", "sendRedirect의 relative URL 해석을 암묵적으로 두기보다 normalized internal path builder를 사용합니다.", "response.encodeRedirectURL은 URL rewriting session tracking을 지원할 때 고려하지만 외부 target 검증을 대신하지 않습니다."],
    terms: [["context path", "한 server에서 web application을 식별하는 deployment prefix입니다.", ["root에서는 빈 문자열일 수 있습니다.", "hard-code하지 않습니다."]], ["component encoding", "URL의 path segment/query 같은 각 component 문법에 맞춘 encoding입니다.", ["전체 URL을 한 번에 encode하지 않습니다.", "CRLF와 control을 거부합니다."]]],
    filename: "ContextPathLocation.java", code: String.raw`import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class ContextPathLocation {
    static String location(String contextPath, long id, String flash) {
        if (!contextPath.isEmpty() && (!contextPath.startsWith("/") || contextPath.endsWith("/"))) throw new IllegalArgumentException("context");
        String query = URLEncoder.encode(flash, StandardCharsets.UTF_8);
        return contextPath + "/orders/" + id + "?flash=" + query;
    }
    public static void main(String[] args) {
        System.out.println(location("", 7, "저장 완료"));
        System.out.println(location("/school", 7, "a+b & ok"));
    }
}`,
    output: "/orders/7?flash=%EC%A0%80%EC%9E%A5+%EC%99%84%EB%A3%8C\n/school/orders/7?flash=a%2Bb+%26+ok", refs: ["jakarta-request", "jakarta-response", "rfc3986-reference", "java-url-encoder"],
    diagnostics: [["root에서는 되는데 /school 배포에서404다.", "Location에 context path가 없습니다.", ["deployment context와 Location을 봅니다.", "hard-coded leading path를 찾습니다."], "context-aware internal URL builder를 사용합니다.", "root/non-root deployment tests를 둡니다."], ["query message가 두 parameters로 갈라진다.", "& 또는=를 query value로 encode하지 않았습니다.", ["raw Location과 parsed query를 비교합니다."], "query name/value별로 UTF-8 form encoding합니다.", "reserved character tests를 둡니다."]],
  },
  {
    id: "redirect-status-method-semantics", title: "302·303·307·308의 method 변환/보존을 의도적으로 선택합니다", lead: "redirect라는 한 단어 대신 status별 follow-up method와 permanence/cache 의미를 API 계약에 넣습니다.",
    explanations: ["303 See Other는 POST 처리 결과를 GET/HEAD로 조회하도록 다른 resource를 가리키므로 PRG에 명확합니다.", "307 Temporary Redirect와308 Permanent Redirect는 follow-up에서 method와 content를 보존합니다. mutation POST를 그대로 재전송할 수 있습니다.", "302 Found는 역사적 user-agent behavior 때문에 POST→GET으로 바뀌는 경우가 있지만 API에서 그 모호성에 기대지 않습니다.", "301/308 permanence는 cache와 future request target에 영향을 줄 수 있어 임시 workflow redirect에 쓰지 않습니다.", "Location status와 client 종류(browser/API)를 함께 integration test합니다."],
    terms: [["method preservation", "redirect follow-up이 원래 method와 body를 유지하는 성질입니다.", ["307/308의 핵심입니다.", "mutation replay 위험을 봅니다."]], ["See Other", "처리 결과를 다른 resource의 GET/HEAD로 조회하라는303 semantics입니다.", ["PRG에 적합합니다.", "Location을 포함합니다."]]],
    filename: "RedirectStatusSemantics.java", code: String.raw`public class RedirectStatusSemantics {
    static String follow(int status, String originalMethod) {
        return switch (status) {
            case 303 -> originalMethod.equals("HEAD") ? "HEAD" : "GET";
            case 307, 308 -> originalMethod;
            case 302 -> "client-dependent";
            default -> "not-modeled";
        };
    }
    public static void main(String[] args) {
        for (int status : new int[] {302, 303, 307, 308}) {
            System.out.println(status + ":POST->" + follow(status, "POST"));
        }
    }
}`,
    output: "302:POST->client-dependent\n303:POST->GET\n307:POST->POST\n308:POST->POST", refs: ["rfc9110-302", "rfc9110-303", "rfc9110-307", "rfc9110-308"],
    diagnostics: [["redirect 뒤 POST가 다시 전송된다.", "307/308 method preservation을 선택했습니다.", ["status와 follow-up method를 봅니다.", "body replay를 봅니다."], "PRG 목적이면303을 사용합니다.", "실제 client redirect tests를 둡니다."], ["302가 client마다 다르게 보인다.", "historical method rewrite에 의존했습니다.", ["browser/API client versions를 비교합니다."], "303 또는307처럼 의도를 명확히 표현합니다.", "status별 contract test를 둡니다."]],
  },
  {
    id: "open-redirect-allowlist", title: "redirect target을 server-side route 또는 strict allowlist로 제한합니다", lead: "next/returnUrl parameter를 sendRedirect에 그대로 넣으면 신뢰받는 domain이 phishing·token forwarding 출발점이 됩니다.",
    explanations: ["open redirect는 attacker가 만든 application URL을 통해 사용자를 외부 악성 site로 보냅니다. login/OAuth 흐름에서는 code/token leakage와 결합될 수 있습니다.", "가장 안전한 방식은 raw URL 대신 route id를 받고 server registry에서 내부 path로 변환하는 것입니다.", "URL을 받아야 한다면 parse 후 scheme/host/port/path를 canonicalize하고 exact allowlist를 적용합니다. startsWith나 contains domain check는 우회됩니다.", "protocol-relative //evil, backslash, userinfo, encoded controls와 CRLF를 거부합니다.", "외부 redirect가 정말 필요하면 warning/interstitial과 explicit partner registry, audit log를 둡니다."],
    terms: [["open redirect", "공격자가 target을 통제할 수 있는 신뢰 domain의 redirect 기능입니다.", ["phishing과 OAuth leakage에 쓰입니다.", "route id가 더 안전합니다."]], ["canonical allowlist", "URL parse/normalize 뒤 exact components를 허용 목록과 비교하는 정책입니다.", ["문자열 prefix를 쓰지 않습니다.", "scheme/host/port를 모두 봅니다."]]],
    filename: "SafeRedirectTarget.java", code: String.raw`import java.net.URI;
import java.util.Map;

public class SafeRedirectTarget {
    static final Map<String, String> ROUTES = Map.of("home", "/home", "orders", "/orders");
    static String target(String routeId) {
        String path = ROUTES.get(routeId);
        if (path == null) return "reject:unknown-route";
        URI uri = URI.create(path);
        if (uri.isAbsolute() || uri.getRawAuthority() != null || !uri.getPath().startsWith("/")) return "reject:external";
        return "ok:" + path;
    }
    public static void main(String[] args) {
        System.out.println(target("orders"));
        System.out.println(target("https://evil.example"));
        System.out.println(target("missing"));
    }
}`,
    output: "ok:/orders\nreject:unknown-route\nreject:unknown-route", refs: ["owasp-unvalidated-redirects", "java-uri", "rfc3986-reference"],
    diagnostics: [["우리 domain link가 phishing site로 보낸다.", "returnUrl을 검증 없이 redirect했습니다.", ["Location을 봅니다.", "target source를 추적합니다.", "allowlist 방식을 봅니다."], "server route id registry 또는 exact canonical allowlist를 씁니다.", "protocol-relative/encoded bypass tests를 둡니다."], ["example.com.evil이 allowlist를 통과한다.", "host 문자열 prefix/contains를 사용했습니다.", ["parsed URI host를 봅니다.", "userinfo/port를 봅니다."], "URI component를 parse해 exact scheme/host/port를 비교합니다.", "URL parser differential tests를 둡니다."]],
  },
  {
    id: "redirect-loop-hop-budget", title: "redirect graph에 종료 조건과 hop budget을 둡니다", lead: "auth/login, canonical URL, locale filters가 서로 redirect하면 browser의 too many redirects로만 발견하지 않게 graph invariant를 검증합니다.",
    explanations: ["A→B→A 직접 loop뿐 아니라 auth filter, HTTPS proxy, trailing slash와 locale 조합의 다단 loop가 흔합니다.", "각 redirect rule은 invariant가 한 방향으로 진전해야 합니다. 예를 들어 unauthenticated→login에서 login 자체는 예외여야 합니다.", "hop counter는 진단/안전망이지 cookie/session 상태가 꼬인 root cause를 숨기는 해결책은 아닙니다.", "reverse proxy TLS termination에서는 forwarded headers를 trusted proxies에서만 받아 scheme canonicalization loop를 막습니다.", "integration crawler가 representative URLs의 redirect graph와 final status를 검증합니다."],
    terms: [["redirect graph", "URL states를 nodes, redirects를 directed edges로 본 모델입니다.", ["cycle을 찾습니다.", "canonical terminal을 정의합니다."]], ["hop budget", "연속 redirect 허용 횟수의 상한입니다.", ["무한 loop를 bounded failure로 만듭니다.", "root cause metric을 남깁니다."]]],
    filename: "RedirectLoopGuard.java", code: String.raw`import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class RedirectLoopGuard {
    static String follow(List<String> locations, int maxHops) {
        Set<String> seen = new HashSet<>();
        int hops = 0;
        for (String location : locations) {
            if (++hops > maxHops) return "reject:hop-budget";
            if (!seen.add(location)) return "reject:cycle=" + location;
        }
        return "ok:hops=" + hops + ",final=" + locations.getLast();
    }
    public static void main(String[] args) {
        System.out.println(follow(List.of("/login", "/home"), 4));
        System.out.println(follow(List.of("/login", "/auth", "/login"), 4));
        System.out.println(follow(List.of("/a", "/b", "/c"), 2));
    }
}`,
    output: "ok:hops=2,final=/home\nreject:cycle=/login\nreject:hop-budget", refs: ["rfc9110-redirection", "java-set", "owasp-auth"],
    diagnostics: [["browser가 too many redirects를 보인다.", "redirect rules가 cycle을 이룹니다.", ["각 hop status/Location을 기록합니다.", "auth/canonical/proxy filters를 분리합니다."], "terminal route exceptions와 one-way invariant를 고칩니다.", "redirect graph integration test를 둡니다."], ["HTTP↔HTTPS가 반복된다.", "proxy scheme trust 설정이 origin과 다릅니다.", ["trusted proxy chain과 Forwarded headers를 봅니다."], "trusted proxies에서만 canonical scheme을 받아 한 계층이 redirect를 소유하게 합니다.", "production-like proxy smoke test를 둡니다."]],
  },
  {
    id: "dispatcher-types-filter-reentry", title: "REQUEST·FORWARD·ERROR·ASYNC dispatcher type별 filter 재진입을 설계합니다", lead: "forward는 새 network request가 아니어도 filter chain이 dispatcher mapping에 따라 다시 실행될 수 있어 인증·logging·body wrapper를 중복 적용할 수 있습니다.",
    explanations: ["DispatcherType.REQUEST는 client dispatch, FORWARD는 RequestDispatcher.forward, INCLUDE/ERROR/ASYNC는 각 container dispatch를 나타냅니다.", "filter mapping이 REQUEST와 FORWARD 모두면 audit log나 response wrapper가 두 번 실행될 수 있습니다. 이중 실행이 안전한지 idempotent하게 설계합니다.", "authentication은 forward target에서도 invariant를 유지해야 하지만 CSRF token consume, request-body read 같은 one-shot 작업을 반복하면 안 됩니다.", "forward-specific request attributes로 original/target URI 정보를 얻을 수 있으나 user-supplied name과 충돌하지 않게 specification constants를 씁니다.", "ERROR dispatch에서 original exception details를 public body에 노출하지 않고 correlation id를 유지합니다."],
    terms: [["dispatcher type", "현재 container dispatch가 시작된 이유를 나타내는 enum입니다.", ["filter mapping에 사용합니다.", "network request count와 다릅니다."]], ["filter idempotence", "동일 logical request에서 재실행돼도 중복 side effect가 생기지 않는 성질입니다.", ["logging span과 auth를 설계합니다.", "one-shot 작업을 분리합니다."]]],
    filename: "DispatcherTypePolicy.java", code: String.raw`import java.util.EnumSet;

public class DispatcherTypePolicy {
    enum Type { REQUEST, FORWARD, INCLUDE, ERROR, ASYNC }
    static final EnumSet<Type> SECURITY = EnumSet.of(Type.REQUEST, Type.FORWARD, Type.ERROR);
    static String apply(Type type, boolean alreadyLogged) {
        boolean secure = SECURITY.contains(type);
        boolean logStart = !alreadyLogged && type == Type.REQUEST;
        return type + ":security=" + secure + ",logStart=" + logStart;
    }
    public static void main(String[] args) {
        System.out.println(apply(Type.REQUEST, false));
        System.out.println(apply(Type.FORWARD, true));
        System.out.println(apply(Type.ERROR, true));
        System.out.println(apply(Type.INCLUDE, true));
    }
}`,
    output: "REQUEST:security=true,logStart=true\nFORWARD:security=true,logStart=false\nERROR:security=true,logStart=false\nINCLUDE:security=false,logStart=false", refs: ["jakarta-dispatcher-type", "servlet-spec", "owasp-error-handling"],
    diagnostics: [["한 request access log가 두 번 남는다.", "filter가 REQUEST와 FORWARD에서 새 span/log를 각각 시작했습니다.", ["dispatcher type과 correlation id를 봅니다.", "filter mapping을 봅니다."], "logical request root에서 한 번 시작하고 child dispatch event만 추가합니다.", "forward/error dispatch logging tests를 둡니다."], ["forward target에서 authorization이 우회된다.", "security filter가 REQUEST에만 매핑됐거나 controller에만 검사했습니다.", ["dispatcher mapping과 target direct access를 봅니다."], "모든 protected dispatch에서 authorization invariant를 적용합니다.", "direct/forward/error access matrix를 test합니다."]],
  },
  {
    id: "idempotency-key-replay", title: "PRG와 별도로 idempotency key로 mutation replay를 통제합니다", lead: "동일 key와 동일 payload는 저장된 outcome을 반환하고, 동일 key의 다른 payload는 conflict로 거부합니다.",
    explanations: ["browser refresh 외에도 client timeout, connection reset, mobile retry와 load balancer retry가 같은 POST를 다시 보낼 수 있습니다.", "idempotency key는 authenticated principal/operation scope에 bind하고 충분한 entropy, TTL와 maximum records를 둡니다.", "처음 처리 시 key, canonical payload hash, processing/completed state와 outcome을 durable transaction에 기록합니다.", "동일 key·다른 payload는409 conflict 후보이며 동일 payload completion은 원래 status/resource id를 replay합니다.", "in-progress duplicate의 wait/retry policy와 external side effect provider key까지 연결해야 end-to-end 중복을 줄입니다."],
    terms: [["idempotency key", "client가 논리적 mutation 시도를 식별하기 위해 보내는 opaque key입니다.", ["principal/operation에 scope됩니다.", "outcome을 replay합니다."]], ["payload fingerprint", "동일 key 재사용이 같은 요청인지 확인하는 canonical payload digest입니다.", ["secret raw body를 저장하지 않습니다.", "canonicalization version이 필요합니다."]]],
    filename: "IdempotencyReplay.java", code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class IdempotencyReplay {
    record Entry(String fingerprint, String outcome) {}
    static final Map<String, Entry> STORE = new LinkedHashMap<>();
    static String execute(String principal, String key, String fingerprint) {
        String scoped = principal + ":" + key;
        Entry old = STORE.get(scoped);
        if (old != null) return old.fingerprint().equals(fingerprint) ? "replay:" + old.outcome() : "conflict";
        String outcome = "order-" + (STORE.size() + 1);
        STORE.put(scoped, new Entry(fingerprint, outcome));
        return "created:" + outcome;
    }
    public static void main(String[] args) {
        System.out.println(execute("u1", "k1", "hash-A"));
        System.out.println(execute("u1", "k1", "hash-A"));
        System.out.println(execute("u1", "k1", "hash-B"));
        System.out.println(execute("u2", "k1", "hash-B"));
    }
}`,
    output: "created:order-1\nreplay:order-1\nconflict\ncreated:order-2", refs: ["rfc9110-idempotent", "owasp-transaction", "java-map"],
    diagnostics: [["timeout 뒤 retry가 두 주문을 만든다.", "durable idempotency record가 없습니다.", ["client key와 principal scope를 봅니다.", "DB unique constraint를 봅니다."], "key/fingerprint/outcome을 mutation transaction에 기록합니다.", "timeout/concurrent duplicate tests를 둡니다."], ["같은 key로 다른 주문이 replay된다.", "payload fingerprint conflict를 확인하지 않았습니다.", ["stored/request fingerprint를 비교합니다."], "동일 key·다른 fingerprint를 conflict로 거부합니다.", "key reuse conflict test를 둡니다."]],
  },
];
session.chapters.push(...seeds.map(chapter));

session.sources.push(
  { id: "source-ex08", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex08.java", usedFor: ["write-before-forward", "active forward"], evidence: "inventory Java1입니다." },
  { id: "source-ex08-2", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex08_2.java", usedFor: ["forward parameter preservation"], evidence: "inventory Java2입니다." },
  { id: "source-ex09", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex09.java", usedFor: ["inventory mismatch", "switch shape"], evidence: "inventory Java3이며 navigation code가 아닙니다." },
  { id: "source-request-jsp", repository: "local jspstudy snapshot", path: "jspstudy/src/main/webapp/day02/ex04_request.jsp", usedFor: ["request metadata expressions"], evidence: "inventory JSP1입니다." },
  { id: "source-response-jsp", repository: "local jspstudy snapshot", path: "jspstudy/src/main/webapp/day02/ex06_response.jsp", usedFor: ["comment-only redirect/status notes"], evidence: "inventory JSP2입니다." },
  { id: "source-hello-closure", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/HelloServlet.java", usedFor: ["compile closure"], evidence: "Ex08 sources의 unused import closure입니다." },
  { id: "jdk-javac", repository: "Java SE 21", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["compile evidence"], evidence: "compiler primary documentation입니다." },
  { id: "servlet-spec", repository: "Jakarta Servlet", path: "Servlet 6.1 Specification", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1", usedFor: ["dispatch", "commit", "filters"], evidence: "Servlet container primary specification입니다." },
  { id: "jakarta-dispatcher", repository: "Jakarta Servlet 6.1 API", path: "RequestDispatcher", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/requestdispatcher", usedFor: ["forward contract"], evidence: "forward primary API입니다." },
  { id: "jakarta-request", repository: "Jakarta Servlet 6.1 API", path: "HttpServletRequest", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletrequest", usedFor: ["parameters", "attributes", "context path"], evidence: "request primary API입니다." },
  { id: "jakarta-response", repository: "Jakarta Servlet 6.1 API", path: "HttpServletResponse", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletresponse", usedFor: ["sendRedirect", "status", "encodeRedirectURL"], evidence: "response primary API입니다." },
  { id: "jakarta-session", repository: "Jakarta Servlet 6.1 API", path: "HttpSession", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpsession", usedFor: ["flash state"], evidence: "session primary API입니다." },
  { id: "jakarta-dispatcher-type", repository: "Jakarta Servlet 6.1 API", path: "DispatcherType", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/dispatchertype", usedFor: ["filter dispatch policy"], evidence: "dispatcher type primary API입니다." },
  { id: "jakarta-el", repository: "Jakarta Expression Language", path: "EL Specification", publicUrl: "https://jakarta.ee/specifications/expression-language/6.0/", usedFor: ["view model lookup"], evidence: "JSP EL primary specification입니다." },
  { id: "rfc9110-redirection", repository: "IETF", path: "RFC 9110 Redirection", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-redirection-3xx", usedFor: ["redirect semantics", "loop"], evidence: "HTTP redirect primary standard입니다." },
  { id: "rfc9110-post", repository: "IETF", path: "RFC 9110 POST", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-post", usedFor: ["POST mutation semantics"], evidence: "POST primary semantics입니다." },
  { id: "rfc9110-302", repository: "IETF", path: "RFC 9110 302", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-302-found", usedFor: ["302 behavior"], evidence: "302 primary standard입니다." },
  { id: "rfc9110-303", repository: "IETF", path: "RFC 9110 303", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-303-see-other", usedFor: ["PRG", "method rewrite"], evidence: "303 primary standard입니다." },
  { id: "rfc9110-307", repository: "IETF", path: "RFC 9110 307", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-307-temporary-redirect", usedFor: ["method preservation"], evidence: "307 primary standard입니다." },
  { id: "rfc9110-308", repository: "IETF", path: "RFC 9110 308", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-308-permanent-redirect", usedFor: ["permanent method preservation"], evidence: "308 primary standard입니다." },
  { id: "rfc9110-idempotent", repository: "IETF", path: "RFC 9110 Idempotent Methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods", usedFor: ["idempotency semantics"], evidence: "HTTP idempotency primary standard입니다." },
  { id: "rfc3986-reference", repository: "IETF", path: "RFC 3986 Reference Resolution", publicUrl: "https://www.rfc-editor.org/rfc/rfc3986.html#section-5", usedFor: ["Location resolution", "URL components"], evidence: "URI reference primary standard입니다." },
  { id: "java-url-encoder", repository: "Java SE 21 API", path: "URLEncoder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLEncoder.html", usedFor: ["query value encoding"], evidence: "form encoding API입니다." },
  { id: "java-uri", repository: "Java SE 21 API", path: "URI", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html", usedFor: ["redirect target parsing"], evidence: "URI parser API입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["flash", "idempotency"], evidence: "map API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["loop detection"], evidence: "set API입니다." },
  { id: "owasp-unvalidated-redirects", repository: "OWASP", path: "Unvalidated Redirects and Forwards Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html", usedFor: ["open redirect defense"], evidence: "redirect security practice입니다." },
  { id: "owasp-auth", repository: "OWASP", path: "Authentication Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["login redirect loop"], evidence: "authentication workflow practice입니다." },
  { id: "owasp-error-handling", repository: "OWASP", path: "Error Handling Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["ERROR dispatch"], evidence: "safe error practice입니다." },
  { id: "owasp-transaction", repository: "OWASP", path: "Transaction Authorization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html", usedFor: ["mutation replay security"], evidence: "transaction security practice입니다." },
);

const qa: Array<[string, string]> = [
  ["forward는 몇 개의 network request인가요?", "한 client request 처리 안의 server dispatch이므로 보통 network request는1개입니다."],
  ["redirect는 왜2개 request가 되나요?", "3xx response 뒤 client가 Location으로 새 request를 보내기 때문입니다."],
  ["forward 뒤 주소창은 어떻게 되나요?", "최초 client request URL을 유지합니다."],
  ["redirect 뒤 request attribute가 유지되나요?", "아닙니다. 새 request이므로 자동 유지되지 않습니다."],
  ["forward에서 parameter가 유지되는 이유는 무엇인가요?", "같은 request object를 target에 전달하기 때문입니다."],
  ["parameter와 attribute의 차이는 무엇인가요?", "parameter는 client string input, attribute는 server가 request에 붙인 object입니다."],
  ["Ex08의 핵심 위험은 무엇인가요?", "완전한 HTML body를 쓴 뒤 forward한다는 점입니다."],
  ["commit 뒤 forward하면 무엇이 생기나요?", "IllegalStateException 또는 이미 전송된 부분 응답 문제가 생길 수 있습니다."],
  ["isCommitted check만으로 설계가 고쳐지나요?", "아닙니다. body/render owner를 하나로 만드는 것이 핵심입니다."],
  ["sendRedirect 뒤 왜 return해야 하나요?", "추가 body write나 두 번째 terminal action을 막기 위해서입니다."],
  ["flash는 무엇인가요?", "redirect 다음 request에서 한 번 소비하는 짧은 상태입니다."],
  ["flash fixed key의 문제는 무엇인가요?", "tabs와 동시 requests가 값을 덮거나 잘못 소비할 수 있습니다."],
  ["flash consume은 왜 atomic해야 하나요?", "두 consumer가 같은 값을 모두 읽는 get/remove race를 막기 위해서입니다."],
  ["PRG sequence는 무엇인가요?", "mutation POST→303 Location→result GET입니다."],
  ["validation 실패도 redirect해야 하나요?", "반드시 그렇지 않습니다. mutation이 없으면 request model과 forward가 단순합니다."],
  ["PRG가 중복 POST를 완전히 막나요?", "아닙니다. network retry와 concurrent replay에는 idempotency가 필요합니다."],
  ["303의 follow-up method는 무엇인가요?", "원래 HEAD가 아니면 GET으로 결과를 조회합니다."],
  ["307과308은 무엇을 보존하나요?", "원래 method와 content를 보존합니다."],
  ["302를 PRG에 모호하다고 하는 이유는 무엇인가요?", "역사적으로 client별 POST method rewrite behavior가 달랐기 때문입니다."],
  ["308은 어떤 추가 의미가 있나요?", "permanent redirect라 future requests와 cache에 장기 영향을 줄 수 있습니다."],
  ["context path가 왜 Location에 필요한가요?", "non-root deployment에서 application 내부 경로를 정확히 가리키기 위해서입니다."],
  ["전체 URL을 URLEncoder로 encode해도 되나요?", "안 됩니다. path/query 등 component마다 문법이 다릅니다."],
  ["open redirect란 무엇인가요?", "사용자 입력으로 외부 target을 통제할 수 있는 redirect입니다."],
  ["startsWith host 검증은 안전한가요?", "아닙니다. subdomain/userinfo/encoding 우회가 있어 parsed components exact 비교가 필요합니다."],
  ["가장 안전한 redirect input은 무엇인가요?", "raw URL보다 server-side route id입니다."],
  ["protocol-relative URL은 무엇을 주의하나요?", "//evil.example처럼 scheme 없이 외부 authority를 가리킬 수 있습니다."],
  ["redirect loop는 어떻게 모델링하나요?", "URLs를 nodes, redirects를 edges로 하는 graph cycle로 모델링합니다."],
  ["hop budget이 root cause fix인가요?", "아닙니다. 무한 loop를 bounded하게 만들고 진단하는 안전망입니다."],
  ["proxy 뒤 HTTPS loop 원인은 무엇일 수 있나요?", "trusted scheme/forwarded header 해석이 origin과 불일치할 수 있습니다."],
  ["DispatcherType.FORWARD는 새 network request인가요?", "아닙니다. 같은 logical request의 container dispatch입니다."],
  ["filter가 forward에서 재실행될 수 있나요?", "dispatcher mapping에 FORWARD가 포함되면 가능합니다."],
  ["filter 재실행의 위험은 무엇인가요?", "중복 log/side effect, body 재읽기와 wrapper 중첩입니다."],
  ["ERROR dispatch에서 무엇을 숨겨야 하나요?", "stack, path, secret과 내부 exception detail을 public body에서 숨깁니다."],
  ["idempotency key는 어디에 scope하나요?", "authenticated principal과 operation/resource 범위에 bind합니다."],
  ["같은 key·같은 payload는 어떻게 하나요?", "저장된 원래 outcome을 replay합니다."],
  ["같은 key·다른 payload는 어떻게 하나요?", "fingerprint conflict로 거부합니다."],
  ["원본 active sendRedirect 수는 얼마인가요?", "Java/JSP comments 밖에서는0입니다."],
  ["원본 active forward 수는 얼마인가요?", "Ex08의 getRequestDispatcher(...).forward 한 건입니다."],
  ["JSP ex06_response가 runtime redirect evidence인가요?", "아닙니다. response API 설명이 comment에만 있습니다."],
  ["안전한 navigation controller의 terminal result는 무엇인가요?", "한 번의 Forward, Redirect 또는 Render 중 정확히 하나입니다."],
];
session.reviewQuestions.push(...qa.map(([question, answer]) => ({ question, answer })));
session.completionChecklist.push(
  "원본 Java3을 모두 읽었다.", "원본 JSP2를 모두 읽었다.", "HelloServlet closure를 읽었다.", "source6 hashes를 검증했다.", "closure warning1을 확인했다.", "Java inventory warning3을 확인했다.", "active forward1을 확인했다.", "active sendRedirect0을 확인했다.", "JSP request expressions11을 확인했다.", "JSP response notes가 comment-only임을 확인했다.",
  "forward와 redirect request count를 구분한다.", "forward address-bar behavior를 설명한다.", "redirect 새 request를 설명한다.", "parameter와 attribute provenance를 구분한다.", "typed view model을 request attribute로 전달한다.", "view에서 raw parsing을 하지 않는다.", "forward 전에 body를 쓰지 않는다.", "forward 전에 response가 uncommitted임을 보장한다.", "render owner를 하나로 둔다.", "navigation 뒤 handler를 종료한다.",
  "flash를 one-time state로 사용한다.", "flash id를 tab/request에 구분한다.", "flash consume을 atomic하게 한다.", "flash TTL과 size limit를 둔다.", "flash에 secret을 넣지 않는다.", "PRG POST→303→GET을 구현한다.", "validation failure와 success navigation을 구분한다.", "result GET을 safe read로 만든다.", "PRG와 idempotency를 구분한다.", "created resource canonical URL을 사용한다.",
  "context path를 Location에 반영한다.", "root/non-root deployment를 test한다.", "path와 query를 component별 encode한다.", "CRLF/control을 Location에서 거부한다.", "proxy Host/Scheme trust를 제한한다.", "302의 모호성을 설명한다.", "303 method rewrite를 설명한다.", "307 method preservation을 설명한다.", "308 permanence를 설명한다.", "status별 실제 client test를 둔다.",
  "raw returnUrl을 직접 redirect하지 않는다.", "server route id registry를 사용한다.", "URI를 parse/canonicalize한다.", "scheme/host/port exact allowlist를 둔다.", "protocol-relative target을 거부한다.", "redirect graph cycle을 검사한다.", "hop budget을 둔다.", "login route를 auth redirect 예외로 둔다.", "trusted proxy scheme loop를 test한다.", "final terminal status를 확인한다.",
  "dispatcher type을 기록한다.", "REQUEST/FORWARD/ERROR filter policy를 둔다.", "filter side effect를 idempotent하게 한다.", "forward target authorization을 유지한다.", "ERROR dispatch에서 내부 정보를 숨긴다.", "idempotency key entropy/scope를 정한다.", "payload fingerprint를 저장한다.", "key/outcome을 durable transaction에 묶는다.", "same-key conflict를 거부한다.", "real container에서 dispatch/status/Location을 재검증한다."
);

export default session;
