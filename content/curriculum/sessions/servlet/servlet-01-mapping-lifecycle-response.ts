import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["servlet-01-mapping-lifecycle-response"],
  slug: "servlet-01-mapping-lifecycle-response",
  courseId: "servlet-jsp",
  moduleId: "servlet-http-lifecycle",
  order: 1,
  title: "Servlet 매핑·수명주기와 안전한 응답",
  subtitle: "URL 등록에서 init/service/destroy, method dispatch, UTF-8 body, commit 경계와 다중 요청 동시성까지 container mental model을 세웁니다.",
  level: "기초",
  estimatedMinutes: 720,
  coreQuestion: "하나의 Servlet 인스턴스가 여러 HTTP 요청을 정확히 분기하고, 상태를 섞지 않으며, commit 전에 올바른 status·headers·UTF-8 body를 만드는 계약은 무엇일까요?",
  summary: "원본 HelloServlet·Ex01·Ex02·Ex03 네 파일을 Servlet API 6.1로 직접 compile하면 모두 missing serialVersionUID warning4이며 mapping4·HttpServlet4·init4·doGet definitions4·doPost3·service override1·destroy2가 확인됩니다. HelloServlet은 text/html에 charset을 넣지 않고, Ex01은 HttpServlet.service를 재구현해 GET/POST 외 method 처리를 잃으며, msg/message 인스턴스 필드는 init 후 읽기 전용이지만 request별 값을 두기 시작하면 동시 요청 race가 됩니다. container 실행과 분리한 JDK-only fixtures로 mapping 충돌, lifecycle, method/405/HEAD/OPTIONS, response commit, UTF-8 bytes, shared-field race, immutable config, context-aware escaping과 error boundary를 exact하게 검증합니다.",
  objectives: [
    "@WebServlet mapping registry와 중복·경로 정규화 실패를 설명한다.",
    "container가 instance 생성 뒤 init once, concurrent service many, destroy once를 호출하는 수명주기를 모델링한다.",
    "HttpServlet의 method dispatch를 보존하고 unsupported method에405·Allow를 반환한다.",
    "status·Content-Type·charset·headers를 body commit 전에 확정한다.",
    "문자열 길이와 UTF-8 byte length를 구분한다.",
    "request별 mutable 값을 servlet instance field가 아닌 local/request scope에 둔다.",
    "초기화 config를 immutable하게 publish하고 destroy 중 새 요청을 차단한다.",
    "HTML text context를 escape하고 내부 예외와 공개 오류를 분리한다.",
  ],
  prerequisites: [
    { title: "Java source·compile·main", reason: "Servlet도 Java class이지만 main 대신 container가 lifecycle을 호출합니다.", sessionSlug: "java-01-source-compile-main" },
    { title: "HTML form과 HTTP 요청", reason: "method·URL·headers·body가 Servlet request로 전달되는 출발점입니다.", sessionSlug: "html-07-form-http-request" },
  ],
  keywords: ["Servlet", "HttpServlet", "@WebServlet", "mapping", "init", "service", "doGet", "doPost", "destroy", "405", "Allow", "response commit", "Content-Type", "charset", "UTF-8", "thread safety", "XSS", "error boundary"],
  chapters: [],
  lab: {
    title: "동시 요청에 안전한 작은 HTML endpoint",
    scenario: "GET/HEAD만 허용하는 상태 조회 Servlet을 설계하고 container 없이도 mapping·lifecycle·응답 bytes·동시성 계약을 회귀 검증합니다.",
    setup: ["duplicate mapping, GET/HEAD/POST/OPTIONS, 한글, malicious label, init 실패, concurrent requests와 destroy-race fixtures를 준비합니다.", "status·headers·body·committed·public error를 기록하는 maintained response fixture를 만듭니다."],
    steps: ["mapping path를 정규화하고 startup에 중복을 거부합니다.", "init에서 immutable config를 완성한 뒤 READY로 전이합니다.", "service는 method allowlist와 local request state만 사용합니다.", "Content-Type과 UTF-8을 writer/bytes 전에 설정합니다.", "HEAD는 GET metadata와 같은 headers를 만들되 body를 전송하지 않습니다.", "사용자 text를 HTML text context에 escape합니다.", "예외를 공개 status/message와 내부 correlation id로 나눕니다.", "destroy 전 새 수락을 닫고 in-flight completion을 기다립니다.", "warning0·exact bytes·concurrent isolation을 검증합니다."],
    expectedResult: ["중복 mapping과 invalid lifecycle이 startup 또는 typed failure로 거부됩니다.", "모든 응답 metadata가 commit 전에 고정되고 한글 bytes가 일치합니다.", "동시 요청의 사용자 값이 섞이지 않습니다.", "악성 text와 내부 stack/secret이 응답에 노출되지 않습니다."],
    cleanup: ["fixture threads를 모두 join합니다.", "owned temp만 삭제합니다.", "in-flight와 accepted/finished 합계를 확인합니다."],
    extensions: ["Jakarta Servlet container integration test로 fixture contract를 재검증합니다.", "async dispatch와 timeout/error listener 상태를 추가합니다.", "CSP·security headers와 structured access log를 보강합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "GET과 HEAD를 지원하는 UTF-8 greeting response fixture를 만드세요.", requirements: ["status·Content-Type을 body 전에 설정합니다.", "HEAD body는 비웁니다.", "서울의 UTF-8 bytes6을 검증합니다.", "POST는405와 Allow를 반환합니다."], hints: ["String.length는 byte 수가 아닙니다."], expectedOutcome: "warning0 exact response matrix가 완성됩니다.", solutionOutline: ["method dispatch와 response commit을 분리합니다."] },
    { difficulty: "응용", prompt: "동시 요청100개에서 request id가 섞이지 않는 Servlet design을 작성하세요.", requirements: ["request 값은 local에 둡니다.", "init config는 immutable입니다.", "CountDownLatch로 overlap을 만듭니다.", "field-based broken fixture와 비교합니다.", "destroy-race를 bounded test합니다."], hints: ["Servlet instance 하나를 여러 threads가 공유합니다."], expectedOutcome: "race를 재현하고 local-state 설계로 수정한 evidence가 남습니다.", solutionOutline: ["instance field에는 immutable/shared service만 둡니다."] },
    { difficulty: "설계", prompt: "mapping부터 error response까지 production endpoint contract를 작성하세요.", requirements: ["method/status/header/body matrix를 둡니다.", "commit·encoding·escaping 경계를 표시합니다.", "startup/destroy/in-flight 상태를 그립니다.", "로그 redaction·correlation id를 포함합니다.", "container integration acceptance를 정의합니다."], hints: ["public message와 internal cause를 분리합니다."], expectedOutcome: "운영 가능한 endpoint ADR과 test matrix가 완성됩니다.", solutionOutline: ["registry→lifecycle→dispatch→render→commit 흐름으로 구성합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["servlet-02-request-parameters-encoding"],
  sources: [],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: [
    "inventory4를 모두 읽고 hash·compile했습니다. container는 실행하지 않아 network/listener side effect가 없습니다.",
    "원본 warning4, charset 누락, service override와 instance-field concurrency 위험을 현대 chapters에서 숨김없이 교정합니다.",
  ] },
} satisfies DetailedSession;

export default session;

const originalAudit: DetailedSession["chapters"][number] = {
  id: "original-servlet01-inventory4-audit",
  title: "원본 inventory4의 mapping·lifecycle·response shape와 warning4를 감사합니다",
  lead: "원본을 byte-for-byte temp에 복사해 Servlet API jar로 compile하고 container 실행 없이 source 계약과 위험을 보존합니다.",
  explanations: [
    "HelloServlet, Ex01, Ex02, Ex03은 모두 @WebServlet과 HttpServlet 상속을 사용합니다. mapping은 /hello-servlet, /ex01, /ex02, /today 네 개입니다.",
    "JDK21 -Xlint:all compile warning4는 HttpServlet이 Serializable 계층인데 네 class 모두 serialVersionUID가 없기 때문입니다. 원본 warning을 현대 warning0 fixtures와 분리합니다.",
    "Ex01은 init(ServletConfig), service, doGet, doPost, destroy를 직접 보여 주지만 service를 재구현해 GET/POST 외 표준 dispatch·405·HEAD 동작을 잃을 수 있습니다.",
    "HelloServlet은 text/html만 설정해 charset이 명시되지 않습니다. Ex02/03은 request·response UTF-8과 text/html;charset=UTF-8을 body 전에 설정합니다.",
    "HelloServlet message와 Ex02/03 msg는 init 이후 읽기 전용입니다. 그 자체는 request 값이 아니지만 같은 pattern으로 request별 값을 field에 두면 concurrent service race가 됩니다.",
    "Ex03의 LocalDate.now와 Math.random 출력은 시간·난수 의존이라 exact page evidence로 쓰지 않습니다. 현대 fixture는 고정 입력 mental model을 사용합니다.",
    "audit은 source4 hashes, warning category와 active-code token shape만 검증하고 servlet instance를 직접 new해 lifecycle을 흉내 내지 않습니다.",
  ],
  concepts: [
    { term: "container boundary", definition: "Servlet instance 생성·mapping·lifecycle·request/response 구현을 application이 아니라 web container가 소유하는 경계입니다.", detail: ["main을 직접 호출하지 않습니다.", "container contract를 integration test합니다."] },
    { term: "inventory compile evidence", definition: "원본 source가 지정 API에서 내는 warning category/count를 변경 없이 기록한 evidence입니다.", detail: ["warning을 숨기지 않습니다.", "fixture warning0과 분리합니다."] },
    { term: "active source shape", definition: "comments를 제거한 실제 code에서 mapping·lifecycle·response calls를 세는 provenance입니다.", detail: ["주석의 오타를 실행 기능으로 세지 않습니다.", "behavior claim과 구분합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-servlet01-audit",
    title: "원본4 hash·warning·shape를 검증합니다",
    language: "powershell",
    filename: "verify-original-servlet01.ps1",
    purpose: "container를 실행하지 않고 원본 source와 compile evidence를 재현합니다.",
    code: String.raw`param(
  [Parameter(Mandatory)][string]$SourceRoot,
  [Parameter(Mandatory)][string]$ServletApiJar
)
$ErrorActionPreference='Stop'
$options=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{};foreach($n in $options){$i=Get-Item ("Env:"+$n)-ErrorAction SilentlyContinue;$saved[$n]=@{Exists=$null-ne$i;Value=if($i){$i.Value}else{$null}};Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("servlet01 audit "+[Guid]::NewGuid().ToString('N'));$owned=$false;$failure=$null
function Strip([string]$s){return [regex]::Replace(([regex]::Replace($s,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
try{
  if(-not(Test-Path -LiteralPath $ServletApiJar -PathType Leaf)){throw 'servlet api jar missing'}
  New-Item -ItemType Directory -Path $root|Out-Null;$owned=$true
  $rels=@(
    'src/main/java/org/study/jspstudy/HelloServlet.java',
    'src/main/java/org/study/jspstudy/day01/Ex01.java',
    'src/main/java/org/study/jspstudy/day01/Ex02.java',
    'src/main/java/org/study/jspstudy/day01/Ex03.java'
  )
  $files=[Collections.Generic.List[IO.FileInfo]]::new()
  foreach($rel in $rels){
    $src=Get-Item -LiteralPath (Join-Path $SourceRoot $rel);$dst=Join-Path $root ("source/"+$rel.Substring(14))
    New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($dst))-Force|Out-Null;[IO.File]::Copy($src.FullName,$dst)
    if((Get-FileHash $src.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $dst -Algorithm SHA256).Hash){throw 'hash drift'}
    $files.Add((Get-Item $dst))
  }
  $classes=Join-Path $root 'classes';New-Item -ItemType Directory $classes|Out-Null
  $args=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-cp',$ServletApiJar,'-d',$classes)+@($files.FullName)
  $compiler=@(& javac @args 2>&1);if($LASTEXITCODE-ne0){throw 'compile failed'}
  $missing=@($compiler|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count
  if($missing-ne4-or$compiler.Count-ne5-or$compiler[-1]-notmatch'4 warnings'){throw 'warning drift'}
  $joined=(@($files|ForEach-Object{Strip([IO.File]::ReadAllText($_.FullName))}))-join[Environment]::NewLine
  $shape=@{
    mapping=([regex]::Matches($joined,'@WebServlet\s*\(')).Count;servlet=([regex]::Matches($joined,'extends\s+HttpServlet\b')).Count
    init=([regex]::Matches($joined,'\bvoid\s+init\s*\(')).Count;service=([regex]::Matches($joined,'\bvoid\s+service\s*\(')).Count
    doGet=([regex]::Matches($joined,'\bvoid\s+doGet\s*\(')).Count;doPost=([regex]::Matches($joined,'\bvoid\s+doPost\s*\(')).Count
    destroy=([regex]::Matches($joined,'\bvoid\s+destroy\s*\(')).Count;writer=([regex]::Matches($joined,'\.getWriter\s*\(')).Count
    contentType=([regex]::Matches($joined,'\.setContentType\s*\(')).Count;charEncoding=([regex]::Matches($joined,'\.setCharacterEncoding\s*\(')).Count
    stringFields=([regex]::Matches($joined,'\bprivate\s+String\s+\w+\s*;')).Count;uid=([regex]::Matches($joined,'serialVersionUID')).Count
  }
  if($shape.mapping-ne4-or$shape.servlet-ne4-or$shape.init-ne4-or$shape.service-ne1-or$shape.doGet-ne4-or$shape.doPost-ne3-or$shape.destroy-ne2-or$shape.writer-ne3-or$shape.contentType-ne3-or$shape.charEncoding-ne4-or$shape.stringFields-ne3-or$shape.uid-ne0){throw 'shape drift'}
  'files=4,hashes=4|compile=JDK21+ServletAPI,warnings=4,missingSVUID=4|shape=mapping4,servlet4,init4,service1,doGet4,doPost3,destroy2,writer3,contentType3,charEncoding4,stringFields3,uid0'
  'privacy=container:not-run|network:none|original:read-only|fixture:owned-temp'
}catch{$failure=$_.Exception}finally{
  foreach($n in $options){if($saved[$n].Exists){Set-Item ("Env:"+$n) $saved[$n].Value}else{Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}}
  if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item $resolved -Recurse -Force}
  if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}
}`,
    walkthrough: [
      { lines: "1-10", explanation: "API jar, launcher option snapshot과 owned temp를 준비합니다." },
      { lines: "12-27", explanation: "원본4를 package path에 복사하고 SHA-256 동일성을 검증합니다." },
      { lines: "28-34", explanation: "JDK21·Servlet API로 compile해 missing SVUID4를 정확히 보존합니다." },
      { lines: "35-48", explanation: "comments 밖 mapping·lifecycle·response·field shape를 검증합니다." },
      { lines: "49-57", explanation: "container 미실행 privacy와 환경 복원·direct-child cleanup을 보존합니다." },
    ],
    run: { environment: ["PowerShell 7+", "OpenJDK 21", "Jakarta Servlet API 6.1 jar", "jspstudy project root"], command: "pwsh -NoProfile -File verify-original-servlet01.ps1 -SourceRoot <jspstudy-root> -ServletApiJar <jakarta.servlet-api.jar>" },
    output: { value: "files=4,hashes=4|compile=JDK21+ServletAPI,warnings=4,missingSVUID=4|shape=mapping4,servlet4,init4,service1,doGet4,doPost3,destroy2,writer3,contentType3,charEncoding4,stringFields3,uid0\nprivacy=container:not-run|network:none|original:read-only|fixture:owned-temp", explanation: ["원본4와 hashes가 일치합니다.", "warning4를 숨기지 않습니다.", "container/network를 시작하지 않습니다."] },
    experiments: [
      { change: "serialVersionUID를 명시한 maintained copy를 compile합니다.", prediction: "missing SVUID warning4가 사라집니다.", result: "원본 evidence와 개선 결과를 분리합니다." },
      { change: "Ex01 service override를 제거합니다.", prediction: "HttpServlet의 표준 method dispatch를 다시 사용합니다.", result: "필요한 doX만 override합니다." },
      { change: "HelloServlet Content-Type에 charset=UTF-8을 추가합니다.", prediction: "한글 응답 decoding 계약이 명시됩니다.", result: "writer 전에 metadata를 확정합니다." },
    ],
    sourceRefs: ["source-hello-servlet", "source-ex01", "source-ex02", "source-ex03", "jakarta-http-servlet", "jakarta-web-servlet", "jdk-javac"],
  }],
  diagnostics: [
    { symptom: "compile은 성공하지만 warning4가 나온다.", likelyCause: "HttpServlet subclasses에 serialVersionUID가 없습니다.", checks: ["-Xlint:all output을 봅니다.", "warning category를 셉니다.", "원본과 maintained fixture를 구분합니다."], fix: "배포 class에 explicit UID를 두거나 warning policy를 문서화합니다.", prevention: "CI에서 warning category drift를 검증합니다." },
    { symptom: "GET/POST 외 method가 응답 없이 끝난다.", likelyCause: "Ex01이 service를 수동 분기하고 다른 methods와 표준405 처리를 누락했습니다.", checks: ["service override를 봅니다.", "PUT/HEAD/OPTIONS fixture를 실행합니다.", "status·Allow를 확인합니다."], fix: "service override를 제거하고 필요한 doGet/doPost만 구현합니다.", prevention: "method matrix integration test를 둡니다." },
  ],
  expertNotes: ["A source audit establishes provenance and compiler facts; it is not a substitute for a real container integration test."],
};

(session.chapters as DetailedSession["chapters"]).push(originalAudit);

const maintainedChapters: DetailedSession["chapters"] = [
  {
    id: "mapping-registry-normalization-conflict",
    title: "URL mapping을 startup registry로 보고 중복과 모호성을 먼저 거부합니다",
    lead: "mapping은 요청 때마다 문자열을 비교하는 기능이 아니라 deployment startup에 확정되는 routing 계약입니다.",
    explanations: [
      "annotation value는 context path 뒤의 application path에 연결됩니다. leading slash, exact/path/extension/default mapping 종류를 구분해야 합니다.",
      "동일 path를 두 Servlets가 소유하면 어느 handler가 실행될지 application이 추정하면 안 됩니다. registry 구성 단계에서 fail-fast합니다.",
      "path normalization에서 percent-decoding, slash collapse와 traversal을 임의로 수행하면 proxy/container 해석과 달라질 수 있습니다. container가 제공한 canonical request fields를 사용합니다.",
      "servlet name과 URL pattern은 별도 identifiers입니다. 운영 metric에는 stable route id를 두고 raw user URI를 그대로 cardinality label로 쓰지 않습니다.",
      "예제 registry는 absolute application path만 받고 putIfAbsent로 duplicate owner를 정확히 보고합니다.",
    ],
    concepts: [
      { term: "mapping registry", definition: "URL pattern에서 handler metadata로 가는 startup-time table입니다.", detail: ["중복을 fail-fast합니다.", "request hot path 전에 완성합니다."] },
      { term: "context path", definition: "한 host에서 web application을 식별하는 deployment prefix입니다.", detail: ["mapping pattern 자체와 다릅니다.", "redirect URL 구성에 포함합니다."] },
      { term: "route identity", definition: "metric·authorization·logging에서 쓰는 안정된 endpoint identifier입니다.", detail: ["raw URL과 분리합니다.", "cardinality를 제한합니다."] },
    ],
    codeExamples: [{
      id: "java-servlet-mapping-registry",
      title: "중복 mapping owner를 startup에 거부합니다",
      language: "java",
      filename: "MappingRegistry.java",
      purpose: "container mapping의 fail-fast 핵심을 JDK-only registry로 모델링합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class MappingRegistry {
    private final Map<String, String> routes = new LinkedHashMap<>();

    void register(String path, String owner) {
        if (!path.startsWith("/") || path.contains("..")) {
            throw new IllegalArgumentException("invalid path");
        }
        String previous = routes.putIfAbsent(path, owner);
        if (previous != null) {
            throw new IllegalStateException(path + ":" + previous + "!=" + owner);
        }
    }

    public static void main(String[] args) {
        MappingRegistry registry = new MappingRegistry();
        registry.register("/hello", "HelloServlet");
        registry.register("/today", "TodayServlet");
        String duplicate;
        try {
            registry.register("/hello", "OtherServlet");
            duplicate = "none";
        } catch (IllegalStateException failure) {
            duplicate = failure.getMessage();
        }
        System.out.println("routes=" + registry.routes.keySet());
        System.out.println("duplicate=" + duplicate);
    }
}`,
      walkthrough: [
        { lines: "1-14", explanation: "ordered registry가 invalid path와 duplicate owner를 등록 전에 검증합니다." },
        { lines: "16-29", explanation: "두 routes를 등록하고 충돌을 typed startup failure로 capture합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only maintained fixture"], command: isolatedJavaRun("MappingRegistry.java", "MappingRegistry") },
      output: { value: "routes=[/hello, /today]\nduplicate=/hello:HelloServlet!=OtherServlet", explanation: ["두 stable routes만 남습니다.", "중복 owner 둘을 정확히 보여 줍니다."] },
      experiments: [
        { change: "putIfAbsent를 put으로 바꿉니다.", prediction: "후등록 handler가 조용히 앞 mapping을 덮습니다.", result: "startup conflict를 숨기지 않습니다." },
        { change: "../admin을 등록합니다.", prediction: "invalid path로 거부됩니다.", result: "routing input을 configuration validation에서 제한합니다." },
        { change: "raw URI를 metric route label로 씁니다.", prediction: "사용자별 값으로 cardinality가 폭증할 수 있습니다.", result: "registry route id를 사용합니다." },
      ],
      sourceRefs: ["jakarta-web-servlet", "jakarta-servlet-spec", "java-map"],
    }],
    diagnostics: [
      { symptom: "배포 시 mapping conflict가 난다.", likelyCause: "annotation 또는 descriptor에서 같은 pattern을 여러 Servlets가 소유합니다.", checks: ["모든 @WebServlet values를 수집합니다.", "web.xml과 annotations를 함께 봅니다.", "context path와 pattern을 구분합니다."], fix: "owner를 하나로 정하고 startup registry test를 통과시킵니다.", prevention: "route manifest와 duplicate test를 CI에 둡니다." },
      { symptom: "root 배포에서는 되지만 /app 배포에서 링크가 깨진다.", likelyCause: "mapping과 context path를 혼동해 host-root absolute URL을 만들었습니다.", checks: ["request context path를 봅니다.", "redirect/link 생성기를 봅니다.", "reverse proxy prefix를 확인합니다."], fix: "context-aware URL builder를 사용합니다.", prevention: "root와 non-root deployment integration test를 둡니다." },
    ],
  },
  {
    id: "container-lifecycle-state-machine",
    title: "init once·service many·destroy once를 상태 기계로 이해합니다",
    lead: "Servlet lifecycle은 method 호출 암기가 아니라 수락 가능 상태와 resource ownership을 표현하는 protocol입니다.",
    explanations: [
      "container는 class를 load·instantiate한 뒤 init을 성공시키고서야 service를 호출합니다. init 실패 instance는 요청을 처리할 준비가 되지 않았습니다.",
      "READY 동안 여러 request threads가 같은 instance의 service/doX를 동시에 실행할 수 있습니다. service count와 request state를 섞지 않습니다.",
      "destroy는 새 요청 수락을 닫은 뒤 호출될 수 있지만 in-flight 종료 의미는 container contract와 deployment policy를 확인해야 합니다.",
      "destroy 후 service를 application이 직접 호출하는 test는 invalid lifecycle을 숨길 수 있습니다. fixture도 상태 전이를 강제합니다.",
      "예제는 NEW→READY→DESTROYED만 허용하고 init twice와 post-destroy service를 거부합니다.",
    ],
    concepts: [
      { term: "lifecycle state", definition: "instance가 요청을 받을 수 있는지와 resource ownership을 나타내는 NEW·READY·DESTROYED 상태입니다.", detail: ["전이를 제한합니다.", "실패 상태를 확장할 수 있습니다."] },
      { term: "init once", definition: "요청 처리 전 configuration과 shared services를 한 번 완성하는 단계입니다.", detail: ["request data를 두지 않습니다.", "실패를 startup에 드러냅니다."] },
      { term: "in-flight request", definition: "수락되어 아직 response completion 전인 요청입니다.", detail: ["destroy 정책에 포함합니다.", "count와 deadline을 관리합니다."] },
    ],
    codeExamples: [{
      id: "java-servlet-lifecycle-machine",
      title: "허용된 lifecycle transition만 실행합니다",
      language: "java",
      filename: "LifecycleMachine.java",
      purpose: "container callback 순서를 explicit state로 검증합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;

public class LifecycleMachine {
    enum State { NEW, READY, DESTROYED }
    private State state = State.NEW;
    private final List<String> trace = new ArrayList<>();

    void init() {
        require(State.NEW);
        state = State.READY;
        trace.add("init");
    }

    void service(String requestId) {
        require(State.READY);
        trace.add("service:" + requestId);
    }

    void destroy() {
        require(State.READY);
        state = State.DESTROYED;
        trace.add("destroy");
    }

    private void require(State expected) {
        if (state != expected) {
            throw new IllegalStateException(state + "!=" + expected);
        }
    }

    public static void main(String[] args) {
        LifecycleMachine machine = new LifecycleMachine();
        machine.init();
        machine.service("r1");
        machine.service("r2");
        machine.destroy();
        String rejected;
        try {
            machine.service("late");
            rejected = "none";
        } catch (IllegalStateException failure) {
            rejected = failure.getMessage();
        }
        System.out.println("trace=" + machine.trace);
        System.out.println("state=" + machine.state);
        System.out.println("late=" + rejected);
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "state와 deterministic trace를 instance에 둡니다." },
        { lines: "9-29", explanation: "세 callbacks가 expected predecessor를 검사하고 상태를 전이합니다." },
        { lines: "31-48", explanation: "정상 흐름과 destroy 후 요청 거부를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only lifecycle fixture"], command: isolatedJavaRun("LifecycleMachine.java", "LifecycleMachine") },
      output: { value: "trace=[init, service:r1, service:r2, destroy]\nstate=DESTROYED\nlate=DESTROYED!=READY", explanation: ["init이 service보다 앞섭니다.", "destroy 후 late request가 거부됩니다."] },
      experiments: [
        { change: "init 전에 service합니다.", prediction: "NEW!=READY로 거부됩니다.", result: "startup readiness를 명시합니다." },
        { change: "destroy를 두 번 호출합니다.", prediction: "DESTROYED!=READY로 거부됩니다.", result: "resource close ownership을 한 번으로 제한합니다." },
        { change: "FAILED state를 추가합니다.", prediction: "init 실패와 runtime failure를 구분할 수 있습니다.", result: "public readiness와 operator cause를 분리합니다." },
      ],
      sourceRefs: ["jakarta-servlet", "jakarta-http-servlet", "jakarta-servlet-spec"],
    }],
    diagnostics: [
      { symptom: "첫 요청에서 shared service가 null이다.", likelyCause: "init completion 전에 사용하거나 init failure를 무시했습니다.", checks: ["init log와 exception을 봅니다.", "field publish 위치를 봅니다.", "manual new Servlet test를 찾습니다."], fix: "init에서 immutable dependency를 완성하고 실패 시 deployment를 중단합니다.", prevention: "lifecycle fixture와 container startup test를 둡니다." },
      { symptom: "redeploy 뒤 old worker가 resource를 사용한다.", likelyCause: "destroy와 in-flight ownership 계약이 없습니다.", checks: ["수락 차단 시점과 active count를 봅니다.", "resource close owner를 봅니다.", "deadline을 확인합니다."], fix: "accepting→draining→destroyed state와 bounded drain을 구현합니다.", prevention: "redeploy concurrency test를 둡니다." },
    ],
  },
  {
    id: "http-method-dispatch-head-options-405",
    title: "HTTP method semantics와 HEAD·OPTIONS·405를 보존합니다",
    lead: "doGet/doPost는 같은 business method의 별칭이 아니라 안전성·멱등성·cache·body semantics가 다른 HTTP 계약입니다.",
    explanations: [
      "HttpServlet.service는 request method에 맞는 doGet/doPost/doPut/doDelete 등을 선택합니다. 이를 수동 override하면 표준 fallback을 빠뜨리기 쉽습니다.",
      "지원하지 않는 method는 성공 빈 body가 아니라405 Method Not Allowed와 Allow header로 client가 계약을 이해하게 해야 합니다.",
      "HEAD는 GET과 같은 selected representation metadata를 반환하되 response body를 보내지 않습니다. 별도 business logic을 복제하지 않습니다.",
      "OPTIONS는 허용 methods를 발견하는 데 쓰이며 CORS preflight와도 관련 있지만 CORS authorization 전체를 대신하지 않습니다.",
      "POST를 doGet에 무조건 위임하면 상태 변경과 query semantics가 섞입니다. 공통 private method를 추출하되 method별 policy를 남깁니다.",
    ],
    concepts: [
      { term: "method semantics", definition: "HTTP method가 안전성·멱등성·request body와 cache에 주는 의미입니다.", detail: ["handler 이름 이상입니다.", "RFC 계약을 따릅니다."] },
      { term: "405", definition: "resource는 존재하지만 해당 method를 허용하지 않는 응답 status입니다.", detail: ["Allow header를 제공합니다.", "404와 다릅니다."] },
      { term: "HEAD", definition: "GET과 동일한 headers를 얻되 response content를 전송하지 않는 method입니다.", detail: ["metadata parity를 검증합니다.", "body bytes는0입니다."] },
    ],
    codeExamples: [{
      id: "java-http-method-dispatch",
      title: "GET·HEAD·OPTIONS·POST response matrix를 만듭니다",
      language: "java",
      filename: "MethodDispatch.java",
      purpose: "HttpServlet 표준 dispatch의 핵심 결과를 deterministic record로 모델링합니다.",
      code: String.raw`public class MethodDispatch {
    record Response(int status, String allow, String body) {}

    static Response dispatch(String method) {
        return switch (method) {
            case "GET" -> new Response(200, "GET, HEAD, OPTIONS", "data");
            case "HEAD" -> new Response(200, "GET, HEAD, OPTIONS", "");
            case "OPTIONS" -> new Response(204, "GET, HEAD, OPTIONS", "");
            default -> new Response(405, "GET, HEAD, OPTIONS", "");
        };
    }

    public static void main(String[] args) {
        for (String method : new String[]{"GET", "HEAD", "OPTIONS", "POST"}) {
            Response response = dispatch(method);
            System.out.println(method + "=" + response.status()
                    + ",allow=" + response.allow()
                    + ",bytes=" + response.body().getBytes(
                            java.nio.charset.StandardCharsets.UTF_8).length);
        }
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "method별 status·Allow·body를 exhaustive switch로 정의합니다." },
        { lines: "13-21", explanation: "네 methods의 UTF-8 response byte count를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only HTTP state fixture"], command: isolatedJavaRun("MethodDispatch.java", "MethodDispatch") },
      output: { value: "GET=200,allow=GET, HEAD, OPTIONS,bytes=4\nHEAD=200,allow=GET, HEAD, OPTIONS,bytes=0\nOPTIONS=204,allow=GET, HEAD, OPTIONS,bytes=0\nPOST=405,allow=GET, HEAD, OPTIONS,bytes=0", explanation: ["GET만 representation body가 있습니다.", "HEAD metadata는 유지하고 body0입니다.", "POST는405입니다."] },
      experiments: [
        { change: "POST를200 빈 body로 바꿉니다.", prediction: "client가 unsupported contract를 성공으로 오해합니다.", result: "405와 Allow를 유지합니다." },
        { change: "HEAD에 data body를 둡니다.", prediction: "HEAD semantics를 어깁니다.", result: "GET representation metadata만 재사용합니다." },
        { change: "PATCH를 허용합니다.", prediction: "Allow와 authorization/CSRF matrix도 함께 갱신해야 합니다.", result: "route contract를 한 registry에서 관리합니다." },
      ],
      sourceRefs: ["jakarta-http-servlet", "rfc9110-methods", "rfc9110-status"],
    }],
    diagnostics: [
      { symptom: "PUT 요청이200이지만 아무 일도 없다.", likelyCause: "수동 service가 GET/POST 외 branch를 그냥 통과합니다.", checks: ["response status를 봅니다.", "service override를 봅니다.", "Allow header를 확인합니다."], fix: "표준 HttpServlet dispatch를 사용하고 unsupported method에405를 반환합니다.", prevention: "method matrix test를 둡니다." },
      { symptom: "HEAD가 GET만큼 body bytes를 보낸다.", likelyCause: "HEAD를 별도 처리하지 않고 raw GET body를 썼습니다.", checks: ["body length를 봅니다.", "container HEAD handling을 확인합니다.", "metadata parity를 비교합니다."], fix: "GET metadata를 공유하고 body emission을 억제합니다.", prevention: "GET/HEAD headers와 byte count를 회귀 검증합니다." },
    ],
  },
  {
    id: "response-metadata-commit-boundary",
    title: "status·headers·charset을 response commit 전에 확정합니다",
    lead: "response는 자유롭게 수정 가능한 Map이 아니라 headers를 구성하다 body write/flush에서 commit되는 단방향 상태 기계입니다.",
    explanations: [
      "setStatus, setHeader, setContentType과 charset은 response가 commit되기 전에 호출해야 합니다. commit 뒤 변경은 무시되거나 exception/부분 응답이 됩니다.",
      "getWriter가 즉시 commit한다고 일반화할 수는 없지만 charset 선택은 writer 획득 전 확정해야 합니다. buffer flush·overflow·sendError·forward가 commit에 영향을 줍니다.",
      "Content-Type은 representation media type이고 charset은 text bytes decoding 계약입니다. HTML meta charset만으로 HTTP header 오류를 항상 복구할 수 없습니다.",
      "forward 전에 body를 쓰면 buffer가 commit되어 forward가 실패할 수 있습니다. controller는 model·view를 정하고 view만 body를 쓰게 합니다.",
      "예제 fixture는 첫 write를 commit point로 정의해 metadata-after-body bug를 즉시 드러냅니다.",
    ],
    concepts: [
      { term: "response commit", definition: "status와 headers가 client 전송 대상으로 확정되어 더는 안전하게 변경할 수 없는 전이입니다.", detail: ["body flush/overflow가 원인일 수 있습니다.", "isCommitted로 관찰합니다."] },
      { term: "response buffer", definition: "commit 전 body bytes를 잠시 보관해 forward·error 선택 여지를 주는 container buffer입니다.", detail: ["크기는 구현/config 의존입니다.", "무제한 rollback이 아닙니다."] },
      { term: "representation metadata", definition: "status와 Content-Type·charset·cache headers처럼 body 해석을 정하는 정보입니다.", detail: ["body 전에 확정합니다.", "HEAD에도 중요합니다."] },
    ],
    codeExamples: [{
      id: "java-response-commit-machine",
      title: "body 뒤 metadata 변경을 거부합니다",
      language: "java",
      filename: "ResponseCommit.java",
      purpose: "response metadata와 commit 순서를 작은 maintained fixture로 고정합니다.",
      code: String.raw`public class ResponseCommit {
    static final class Response {
        private int status = 200;
        private String contentType;
        private boolean committed;
        private final StringBuilder body = new StringBuilder();

        void status(int value) { requireOpen(); status = value; }
        void contentType(String value) { requireOpen(); contentType = value; }
        void write(String value) { body.append(value); committed = true; }
        private void requireOpen() {
            if (committed) throw new IllegalStateException("committed");
        }
    }

    public static void main(String[] args) {
        Response response = new Response();
        response.status(201);
        response.contentType("text/html;charset=UTF-8");
        response.write("서울");
        String late;
        try {
            response.status(500);
            late = "accepted";
        } catch (IllegalStateException failure) {
            late = failure.getMessage();
        }
        System.out.println("status=" + response.status);
        System.out.println("type=" + response.contentType);
        System.out.println("committed=" + response.committed);
        System.out.println("late=" + late);
    }
}`,
      walkthrough: [
        { lines: "1-14", explanation: "metadata와 body를 분리하고 첫 write를 commit으로 모델링합니다." },
        { lines: "16-33", explanation: "metadata-before-body 정상 경로와 late status 거부를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "maintained response fixture"], command: isolatedJavaRun("ResponseCommit.java", "ResponseCommit") },
      output: { value: "status=201\ntype=text/html;charset=UTF-8\ncommitted=true\nlate=committed", explanation: ["201과 content type이 body 전에 고정됩니다.", "commit 뒤500 변경은 거부됩니다."] },
      experiments: [
        { change: "contentType을 write 뒤로 옮깁니다.", prediction: "committed failure가 납니다.", result: "writer/body 전에 metadata를 설정합니다." },
        { change: "forward 전에 write합니다.", prediction: "실제 container buffer 상태에 따라 forward가 실패할 수 있습니다.", result: "controller는 body를 쓰지 않습니다." },
        { change: "buffer reset을 추가합니다.", prediction: "commit 전만 reset이 가능해야 합니다.", result: "rollback 가능 상태를 명시합니다." },
      ],
      sourceRefs: ["jakarta-servlet-response", "jakarta-http-response", "rfc9110-representation"],
    }],
    diagnostics: [
      { symptom: "status를500으로 설정했는데 client는200을 받는다.", likelyCause: "body가 이미 commit된 뒤 status를 바꿨습니다.", checks: ["isCommitted 시점을 기록합니다.", "flush/println 양을 봅니다.", "error handler 순서를 봅니다."], fix: "validation과 status/header 선택을 body write 전에 끝냅니다.", prevention: "late mutation fixture를 둡니다." },
      { symptom: "forward에서 IllegalStateException이 난다.", likelyCause: "controller가 response body를 써 buffer가 commit됐습니다.", checks: ["forward 전 getWriter/flush를 찾습니다.", "buffer size를 봅니다.", "filter writes를 확인합니다."], fix: "controller write를 제거하고 view에 rendering을 맡깁니다.", prevention: "forward path에서 body-before-dispatch를 금지합니다." },
    ],
  },
  {
    id: "utf8-character-byte-contract",
    title: "Java chars와 UTF-8 response bytes를 구분합니다",
    lead: "HTTP는 bytes를 전송하므로 Java String length가 Content-Length나 network cost와 같지 않습니다.",
    explanations: [
      "Java String은 UTF-16 code units 관점의 length를 제공하고 UTF-8 encoder는 code point에 따라1~4 bytes를 만듭니다. 서울은 chars2지만 UTF-8 bytes6입니다.",
      "response writer는 설정 charset으로 characters를 bytes로 바꿉니다. charset을 생략하면 container/default/client 추정이 달라 한글이 깨질 수 있습니다.",
      "Content-Length를 직접 계산한다면 최종 encoded bytes를 기준으로 해야 하지만 compression·streaming에서는 container에 맡기는 편이 안전합니다.",
      "Unicode normalization과 grapheme count는 또 다른 층입니다. 사용자 표시 길이 제한을 String.length 하나로만 정의하지 않습니다.",
      "예제는 StandardCharsets.UTF_8로 exact bytes와 round-trip을 검증합니다.",
    ],
    concepts: [
      { term: "code unit", definition: "Java String length가 세는 UTF-16 단위입니다.", detail: ["사용자 글자 수와 다를 수 있습니다.", "UTF-8 byte와 다릅니다."] },
      { term: "charset contract", definition: "characters와 response bytes 사이 encoding을 sender와 receiver가 합의하는 metadata입니다.", detail: ["Content-Type에 명시합니다.", "writer 전에 설정합니다."] },
      { term: "round-trip", definition: "정해진 charset으로 encode 후 같은 charset으로 decode했을 때 원문이 복원되는 검증입니다.", detail: ["bytes도 함께 검증합니다.", "default charset을 피합니다."] },
    ],
    codeExamples: [{
      id: "java-utf8-response-bytes",
      title: "서울의 chars2·UTF-8 bytes6을 검증합니다",
      language: "java",
      filename: "Utf8Response.java",
      purpose: "response text와 wire bytes 차이를 exact하게 보여 줍니다.",
      code: String.raw`import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

public class Utf8Response {
    public static void main(String[] args) {
        String text = "서울";
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        String restored = new String(bytes, StandardCharsets.UTF_8);
        System.out.println("chars=" + text.length());
        System.out.println("bytes=" + bytes.length);
        System.out.println("hex=" + HexFormat.of().formatHex(bytes));
        System.out.println("roundTrip=" + text.equals(restored));
        System.out.println("type=text/plain;charset=UTF-8");
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "명시 UTF-8로 text를 bytes로 만들고 round-trip합니다." },
        { lines: "9-13", explanation: "char count·byte count·hex·metadata를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8 explicit"], command: isolatedJavaRun("Utf8Response.java", "Utf8Response") },
      output: { value: "chars=2\nbytes=6\nhex=ec849cec9ab8\nroundTrip=true\ntype=text/plain;charset=UTF-8", explanation: ["두 UTF-16 units가 여섯 wire bytes입니다.", "UTF-8 round-trip이 성공합니다."] },
      experiments: [
        { change: "default charset을 사용합니다.", prediction: "host 설정에 따라 bytes가 달라질 수 있습니다.", result: "항상 explicit charset을 사용합니다." },
        { change: "emoji를 추가합니다.", prediction: "String length와 사용자-perceived characters 차이가 더 커집니다.", result: "length 정책을 요구사항별로 정의합니다." },
        { change: "bytes6 대신 chars2를 Content-Length로 씁니다.", prediction: "body가 잘리거나 protocol이 깨질 수 있습니다.", result: "encoded bytes 기준 또는 container 계산을 사용합니다." },
      ],
      sourceRefs: ["java-standard-charsets", "unicode-utf8", "rfc9110-content"],
    }],
    diagnostics: [
      { symptom: "한글이 깨진다.", likelyCause: "response writer 전에 charset을 명시하지 않았거나 client와 다르게 decode합니다.", checks: ["Content-Type header를 봅니다.", "writer 획득 순서를 봅니다.", "actual bytes를 hex로 봅니다."], fix: "UTF-8을 body 전에 설정하고 round-trip fixture를 둡니다.", prevention: "non-ASCII integration test를 필수화합니다." },
      { symptom: "Content-Length가 body보다 작다.", likelyCause: "String.length를 UTF-8 byte length로 사용했습니다.", checks: ["encoded bytes length를 계산합니다.", "compression 여부를 봅니다.", "multibyte text를 재현합니다."], fix: "container가 계산하게 하거나 최종 bytes 기준으로 설정합니다.", prevention: "서울·emoji fixtures를 둡니다." },
    ],
  },
  {
    id: "shared-servlet-instance-concurrency",
    title: "request data를 instance field에 두면 동시 요청이 섞임을 재현합니다",
    lead: "container는 보통 Servlet instance 하나에 여러 request threads를 동시에 보내므로 mutable fields는 사실상 application-wide shared state입니다.",
    explanations: [
      "init에서 한 번 설정한 immutable message와 request마다 바꾸는 username field는 전혀 다른 위험입니다. 후자는 다른 request가 덮어쓸 수 있습니다.",
      "synchronized service로 막으면 correctness 일부는 얻어도 모든 요청을 직렬화해 throughput과 tail latency를 악화시키며 async reentry까지 복잡해집니다.",
      "request parameter, validation result, model과 writer는 method local 또는 request attribute에 둡니다. shared services는 thread-safe·immutable이어야 합니다.",
      "예제는 latch로 alice field write 뒤 bob write를 강제해 alice handler가 bob을 읽는 deterministic race를 만듭니다. local copy는 각각 보존됩니다.",
      "static fields, session/application attributes의 mutable objects도 같은 reasoning이 필요합니다. scope가 길수록 concurrency owner가 많아집니다.",
    ],
    concepts: [
      { term: "servlet instance sharing", definition: "여러 request threads가 같은 Servlet object의 fields와 methods를 동시에 사용하는 실행 모델입니다.", detail: ["request마다 새 instance가 아닙니다.", "fields는 shared입니다."] },
      { term: "request confinement", definition: "요청별 mutable data를 해당 call stack/request object에만 두어 다른 threads가 접근하지 못하게 하는 원칙입니다.", detail: ["locals를 선호합니다.", "shared collection에 누출하지 않습니다."] },
      { term: "deterministic race fixture", definition: "latch로 interleaving을 고정해 shared-field corruption을 매번 재현하는 test입니다.", detail: ["sleep을 사용하지 않습니다.", "broken behavior를 exact하게 보여 줍니다."] },
    ],
    codeExamples: [{
      id: "java-servlet-shared-field-race",
      title: "alice 요청이 bob field를 읽는 race를 고정합니다",
      language: "java",
      filename: "SharedFieldRace.java",
      purpose: "request field와 local state의 차이를 deterministic concurrency로 증명합니다.",
      code: String.raw`import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;

public class SharedFieldRace {
    private String currentUser;

    public static void main(String[] args) throws InterruptedException {
        SharedFieldRace servlet = new SharedFieldRace();
        CountDownLatch aliceStored = new CountDownLatch(1);
        CountDownLatch bobStored = new CountDownLatch(1);
        Map<String, String> observed = new ConcurrentHashMap<>();

        Thread alice = new Thread(() -> {
            String local = "alice";
            servlet.currentUser = local;
            aliceStored.countDown();
            await(bobStored);
            observed.put("aliceField", servlet.currentUser);
            observed.put("aliceLocal", local);
        });
        Thread bob = new Thread(() -> {
            await(aliceStored);
            String local = "bob";
            servlet.currentUser = local;
            bobStored.countDown();
            observed.put("bobLocal", local);
        });
        alice.start();
        bob.start();
        alice.join();
        bob.join();
        System.out.println("aliceField=" + observed.get("aliceField"));
        System.out.println("aliceLocal=" + observed.get("aliceLocal"));
        System.out.println("bobLocal=" + observed.get("bobLocal"));
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted", failure);
        }
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "shared field, two gates와 thread-safe result map을 준비합니다." },
        { lines: "14-27", explanation: "alice field write 뒤 bob overwrite를 강제하고 locals를 별도 보존합니다." },
        { lines: "28-45", explanation: "join 뒤 corrupted field와 correct locals를 출력하고 interruption helper를 둡니다." },
      ],
      run: { environment: ["OpenJDK 21", "two request threads", "latch-controlled"], command: isolatedJavaRun("SharedFieldRace.java", "SharedFieldRace") },
      output: { value: "aliceField=bob\naliceLocal=alice\nbobLocal=bob", explanation: ["shared request field가 덮였습니다.", "두 method locals는 각 요청 값을 보존합니다."] },
      experiments: [
        { change: "currentUser를 volatile로 만듭니다.", prediction: "가시성은 생겨도 alice가 bob을 읽는 logical race는 그대로입니다.", result: "request confinement가 필요합니다." },
        { change: "service 전체를 synchronized로 만듭니다.", prediction: "race는 줄지만 요청이 직렬화됩니다.", result: "shared mutable request state를 제거합니다." },
        { change: "field에 immutable config만 둡니다.", prediction: "init 뒤 변경하지 않으면 concurrent reads가 안전해집니다.", result: "field 역할을 lifecycle-shared config로 제한합니다." },
      ],
      sourceRefs: ["jakarta-servlet", "jls-happens-before", "java-countdown-latch", "java-concurrent-map"],
    }],
    diagnostics: [
      { symptom: "사용자 A 응답에 B의 값이 나온다.", likelyCause: "request parameter/model을 Servlet instance field에 저장했습니다.", checks: ["mutable fields를 찾습니다.", "동시 request trace를 봅니다.", "latch fixture로 overwrite를 재현합니다."], fix: "request-specific data를 locals/request attributes로 이동합니다.", prevention: "Servlet fields allowlist와 concurrency test를 둡니다." },
      { symptom: "volatile을 붙였는데 값 섞임이 계속된다.", likelyCause: "volatile은 최신 write 가시성만 주고 request ownership을 보존하지 않습니다.", checks: ["read-modify ownership을 봅니다.", "어느 request가 마지막 write인지 봅니다.", "local alternative를 비교합니다."], fix: "shared slot을 제거하고 request confinement를 적용합니다.", prevention: "visibility와 atomic business isolation을 구분합니다." },
    ],
  },
  {
    id: "immutable-init-configuration-publication",
    title: "init config는 검증된 immutable snapshot으로 publish합니다",
    lead: "Servlet field가 모두 금지되는 것은 아니며, startup에 완성해 이후 변경하지 않는 configuration과 thread-safe services는 올바른 shared state가 될 수 있습니다.",
    explanations: [
      "init parameter와 environment를 읽어 validation을 끝낸 immutable object를 field에 한 번 할당합니다. 부분 초기화 object를 먼저 노출하지 않습니다.",
      "request handler는 config snapshot을 읽기만 하고 request override와 섞지 않습니다. secret은 toString·public error에 넣지 않습니다.",
      "runtime reload가 필요하면 AtomicReference로 whole immutable snapshot을 교체하고 version을 metric에 남깁니다. 여러 fields를 따로 바꾸지 않습니다.",
      "destroy는 owned client/pool을 닫지만 external singleton이나 container-managed resource ownership을 임의로 가져오지 않습니다.",
      "예제 config record는 nonblank site와 positive limit을 constructor에서 검증하고 init once 뒤 모든 calls가 같은 version을 봅니다.",
    ],
    concepts: [
      { term: "immutable configuration snapshot", definition: "서로 관련된 설정을 constructor validation 뒤 변경 불가능한 한 object로 묶은 값입니다.", detail: ["부분 update가 없습니다.", "version을 둘 수 있습니다."] },
      { term: "safe publication", definition: "다른 request threads가 완전히 초기화된 object state를 보도록 synchronization/lifecycle 경계를 사용하는 것입니다.", detail: ["init completion을 이용합니다.", "mutable internals를 누출하지 않습니다."] },
      { term: "resource ownership", definition: "누가 client/pool/file을 생성·close하는지 정한 lifecycle 책임입니다.", detail: ["double close를 피합니다.", "container-managed 자원을 구분합니다."] },
    ],
    codeExamples: [{
      id: "java-immutable-servlet-config",
      title: "검증된 config를 init once로 publish합니다",
      language: "java",
      filename: "ImmutableConfig.java",
      purpose: "request-shared field의 안전한 형태를 immutable record로 보여 줍니다.",
      code: String.raw`public class ImmutableConfig {
    record Config(String site, int limit, int version) {
        Config {
            if (site == null || site.isBlank()) {
                throw new IllegalArgumentException("site");
            }
            if (limit <= 0) {
                throw new IllegalArgumentException("limit");
            }
        }
    }

    private Config config;

    void init(Config value) {
        if (config != null) throw new IllegalStateException("already initialized");
        config = value;
    }

    String service(String requestId) {
        if (config == null) throw new IllegalStateException("not initialized");
        return requestId + ":" + config.site() + ":" + config.limit()
                + ":v" + config.version();
    }

    public static void main(String[] args) {
        ImmutableConfig servlet = new ImmutableConfig();
        servlet.init(new Config("learn", 50, 3));
        System.out.println(servlet.service("r1"));
        System.out.println(servlet.service("r2"));
        String twice;
        try {
            servlet.init(new Config("other", 10, 4));
            twice = "accepted";
        } catch (IllegalStateException failure) {
            twice = failure.getMessage();
        }
        System.out.println("secondInit=" + twice);
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "record compact constructor가 config invariant를 완성합니다." },
        { lines: "13-24", explanation: "instance는 init once와 ready check 뒤 immutable values만 읽습니다." },
        { lines: "26-39", explanation: "두 requests가 같은 v3을 보고 second init이 거부됩니다." },
      ],
      run: { environment: ["OpenJDK 21", "single maintained instance"], command: isolatedJavaRun("ImmutableConfig.java", "ImmutableConfig") },
      output: { value: "r1:learn:50:v3\nr2:learn:50:v3\nsecondInit=already initialized", explanation: ["두 requests가 같은 immutable snapshot을 봅니다.", "부분 reinit이 거부됩니다."] },
      experiments: [
        { change: "limit0으로 init합니다.", prediction: "constructor validation에서 거부됩니다.", result: "invalid config로 READY가 되지 않습니다." },
        { change: "site를 mutable StringBuilder로 둡니다.", prediction: "외부 mutation이 concurrent reads에 보일 수 있습니다.", result: "deep immutable values를 사용합니다." },
        { change: "AtomicReference<Config> reload를 추가합니다.", prediction: "requests는 old 또는 new whole snapshot만 봅니다.", result: "versioned atomic swap을 사용합니다." },
      ],
      sourceRefs: ["jakarta-servlet-config", "jls-final-fields", "java-record"],
    }],
    diagnostics: [
      { symptom: "일부 requests가 새 limit과 옛 site 조합을 본다.", likelyCause: "관련 config fields를 따로 mutable update했습니다.", checks: ["reload write 순서를 봅니다.", "snapshot object 사용 여부를 봅니다.", "version을 출력합니다."], fix: "immutable config object를 atomic하게 교체합니다.", prevention: "old/new 조합 외 hybrid가 없음을 concurrency test합니다." },
      { symptom: "destroy에서 다른 component가 쓰는 client가 닫힌다.", likelyCause: "resource ownership이 명시되지 않았습니다.", checks: ["생성 owner를 찾습니다.", "container-managed 여부를 봅니다.", "close callers를 셉니다."], fix: "생성한 lifecycle owner만 close하고 shared resource는 container에 맡깁니다.", prevention: "ownership table을 문서화합니다." },
    ],
  },
  {
    id: "html-text-output-escaping",
    title: "사용자 text를 HTML source에 연결하지 않고 context에 맞게 encode합니다",
    lead: "PrintWriter에 문자열을 쓸 수 있다는 사실은 그 값이 HTML로 안전하다는 뜻이 아니며, 원본 Ex02/03의 fixed text와 사용자 input을 구분해야 합니다.",
    explanations: [
      "HTML text node context에서는 &, <, >를 escape해야 markup injection을 막습니다. attribute와 JavaScript·URL·CSS context는 추가로 다른 encoding 규칙이 필요합니다.",
      "escape는 validation 대체가 아닙니다. 업무 허용값을 validation하고, 출력 시 최종 context에 맞춰 encode하는 두 경계를 모두 둡니다.",
      "trusted template markup과 untrusted data를 타입/renderer API로 분리합니다. 전체 HTML string을 replace하는 사후 sanitizer는 context를 잃기 쉽습니다.",
      "error message에 exception.getMessage를 그대로 출력하면 SQL/path/secret뿐 아니라 공격자 input이 HTML로 실행될 수 있습니다.",
      "예제 escaper는 HTML text context의 다섯 characters를 named/numeric references로 바꾸고 script tag가 text가 됨을 보여 줍니다.",
    ],
    concepts: [
      { term: "output encoding", definition: "untrusted data를 선택된 parser context에서 data로만 해석되게 변환하는 작업입니다.", detail: ["최종 출력 지점에서 합니다.", "context별 규칙이 다릅니다."] },
      { term: "HTML text context", definition: "element start/end tags 사이의 character data 위치입니다.", detail: ["<와 &가 특별합니다.", "script context와 다릅니다."] },
      { term: "trusted template boundary", definition: "application-authored markup과 사용자 data를 구조적으로 분리하는 renderer 경계입니다.", detail: ["concatenation을 줄입니다.", "auto-escaping view를 선호합니다."] },
    ],
    codeExamples: [{
      id: "java-html-text-escape",
      title: "script-looking input을 HTML text로 encode합니다",
      language: "java",
      filename: "HtmlTextEscape.java",
      purpose: "fixed markup과 untrusted text를 분리하는 최소 renderer를 검증합니다.",
      code: String.raw`public class HtmlTextEscape {
    static String escape(String value) {
        StringBuilder out = new StringBuilder();
        for (int index = 0; index < value.length(); index++) {
            char ch = value.charAt(index);
            switch (ch) {
                case '&' -> out.append("&amp;");
                case '<' -> out.append("&lt;");
                case '>' -> out.append("&gt;");
                case '"' -> out.append("&quot;");
                case '\'' -> out.append("&#39;");
                default -> out.append(ch);
            }
        }
        return out.toString();
    }

    public static void main(String[] args) {
        String input = "<script>alert(\"x\")</script>";
        String safe = escape(input);
        System.out.println(safe);
        System.out.println("<p>" + safe + "</p>");
        System.out.println("containsRawTag=" + safe.contains("<script>"));
    }
}`,
      walkthrough: [
        { lines: "1-16", explanation: "HTML text에서 특별한 다섯 characters를 data references로 바꿉니다." },
        { lines: "18-24", explanation: "악성-looking input을 safe text로 template에 넣고 raw tag 부재를 검증합니다." },
      ],
      run: { environment: ["OpenJDK 21", "HTML text context only"], command: isolatedJavaRun("HtmlTextEscape.java", "HtmlTextEscape") },
      output: { value: "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;\n<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>\ncontainsRawTag=false", explanation: ["script markup이 text references가 됩니다.", "raw start tag가 없습니다."] },
      experiments: [
        { change: "safe 값을 script element 안에 넣습니다.", prediction: "HTML text escaper만으로 JavaScript context 안전을 보장하지 못합니다.", result: "JSON serializer·CSP와 context-specific API를 사용합니다." },
        { change: "& escape를 제거합니다.", prediction: "기존 character references가 해석될 수 있습니다.", result: "&를 먼저 data로 encode합니다." },
        { change: "auto-escaping template을 사용합니다.", prediction: "manual concatenation 실수가 줄어듭니다.", result: "escape 기본값과 raw opt-out을 검증합니다." },
      ],
      sourceRefs: ["html-spec-text", "html-spec-charrefs", "owasp-xss"],
    }],
    diagnostics: [
      { symptom: "사용자 이름에 넣은 tag가 실행된다.", likelyCause: "request value를 HTML source에 직접 concatenation했습니다.", checks: ["sink context를 확인합니다.", "raw output API를 찾습니다.", "response CSP도 봅니다."], fix: "validation 후 HTML text output encoding 또는 auto-escaping view를 사용합니다.", prevention: "context별 XSS fixtures를 둡니다." },
      { symptom: "HTML escape했는데 JavaScript 문자열에서 탈출된다.", likelyCause: "HTML text encoder를 JavaScript context에 재사용했습니다.", checks: ["값이 들어간 parser context를 봅니다.", "inline script를 찾습니다.", "JSON serialization을 확인합니다."], fix: "inline script를 피하고 data attribute/JSON serializer와 CSP를 사용합니다.", prevention: "context를 renderer type/API에 반영합니다." },
    ],
  },
  {
    id: "status-error-public-private-boundary",
    title: "예외를 HTTP status·공개 message·내부 evidence로 분리합니다",
    lead: "모든 failure를200 HTML이나 stack trace로 보내지 않고 client가 복구 가능한 contract와 operator evidence를 따로 설계합니다.",
    explanations: [
      "입력 validation은400, 인증 부재401, 권한 부족403, resource 없음404, method 오류405처럼 의미에 맞는 status를 선택합니다.",
      "예상 domain failure와 unexpected runtime failure를 구분합니다. 후자는500과 opaque correlation id만 공개하고 stack·SQL·path는 server logs에 둡니다.",
      "response가 commit되기 전에 error mapping을 끝내야 status를 바꿀 수 있습니다. rendering 중 failure는 buffer reset 가능 여부와 fallback을 다룹니다.",
      "error body도 Content-Type·charset·escaping 계약을 따릅니다. HTML인지 JSON인지 route negotiation policy를 명시합니다.",
      "예제 boundary는 typed exceptions를400/404로, unexpected를500과 고정 id로 변환하며 cause text를 공개하지 않습니다.",
    ],
    concepts: [
      { term: "public error contract", definition: "client에게 공개해도 안전한 status, stable code, message와 recovery information입니다.", detail: ["stack을 포함하지 않습니다.", "media type을 명시합니다."] },
      { term: "internal evidence", definition: "operator가 원인을 찾는 correlation id, exception chain와 safe structured context입니다.", detail: ["access control합니다.", "secret을 redact합니다."] },
      { term: "error mapping", definition: "domain/infrastructure failure type을 HTTP semantics와 공개 body로 변환하는 boundary입니다.", detail: ["body 전에 실행합니다.", "default500 fallback이 있습니다."] },
    ],
    codeExamples: [{
      id: "java-servlet-error-boundary",
      title: "validation·not found·unexpected failure를 다른 공개 응답으로 변환합니다",
      language: "java",
      filename: "ErrorBoundary.java",
      purpose: "status와 public/internal information separation을 exact records로 검증합니다.",
      code: String.raw`public class ErrorBoundary {
    static final class Validation extends RuntimeException {
        private static final long serialVersionUID = 1L;
    }
    static final class Missing extends RuntimeException {
        private static final long serialVersionUID = 1L;
    }
    record ErrorResponse(int status, String code, String message) {}

    static ErrorResponse map(Throwable failure) {
        if (failure instanceof Validation) {
            return new ErrorResponse(400, "INVALID_INPUT", "입력을 확인하세요.");
        }
        if (failure instanceof Missing) {
            return new ErrorResponse(404, "NOT_FOUND", "대상을 찾을 수 없습니다.");
        }
        return new ErrorResponse(500, "INTERNAL", "요청을 처리하지 못했습니다. ref=E-42");
    }

    public static void main(String[] args) {
        for (Throwable failure : new Throwable[]{
                new Validation(), new Missing(), new IllegalStateException("db-password")}) {
            ErrorResponse response = map(failure);
            System.out.println(response.status() + ":" + response.code()
                    + ":" + response.message());
        }
        System.out.println("secretExposed="
                + map(new IllegalStateException("db-password")).message().contains("password"));
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "typed expected failures는 explicit UID를 가져 warning0을 유지합니다." },
        { lines: "10-20", explanation: "failure taxonomy를 stable status·code·safe message로 매핑합니다." },
        { lines: "22-31", explanation: "세 classes의 response와 unexpected secret 비노출을 검증합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only error fixture"], command: isolatedJavaRun("ErrorBoundary.java", "ErrorBoundary") },
      output: { value: "400:INVALID_INPUT:입력을 확인하세요.\n404:NOT_FOUND:대상을 찾을 수 없습니다.\n500:INTERNAL:요청을 처리하지 못했습니다. ref=E-42\nsecretExposed=false", explanation: ["client-actionable failures가 구분됩니다.", "unexpected cause secret은 공개되지 않습니다."] },
      experiments: [
        { change: "모든 failure를200으로 바꿉니다.", prediction: "client·monitor가 성공과 실패를 구분하지 못합니다.", result: "HTTP semantics를 유지합니다." },
        { change: "exception message를 그대로 body에 넣습니다.", prediction: "secret/path/SQL과 공격 input이 노출될 수 있습니다.", result: "safe stable message만 공개합니다." },
        { change: "JSON error variant를 추가합니다.", prediction: "status/code는 유지하고 Content-Type과 serializer contract가 추가됩니다.", result: "representation별 renderer를 분리합니다." },
      ],
      sourceRefs: ["rfc9110-status", "jakarta-http-response", "jakarta-servlet-response", "owasp-error-handling"],
    }],
    diagnostics: [
      { symptom: "오류 page인데 status가200이다.", likelyCause: "body만 오류처럼 렌더하고 status를 설정하지 않았거나 commit 뒤 변경했습니다.", checks: ["wire status를 봅니다.", "commit 시점을 봅니다.", "error mapper를 확인합니다."], fix: "body 전에 의미 있는4xx/5xx를 설정합니다.", prevention: "status·body pair contract test를 둡니다." },
      { symptom: "500 응답에 DB URL·password가 보인다.", likelyCause: "exception message/stack을 client body에 직접 출력했습니다.", checks: ["error renderer를 봅니다.", "nested cause를 검사합니다.", "logs redaction을 확인합니다."], fix: "opaque public message와 internal correlation log를 분리합니다.", prevention: "secret canary negative test를 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...maintainedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "source-hello-servlet", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/HelloServlet.java", usedFor: ["hello mapping", "init message", "charset omission"], evidence: "inventory 원본1입니다." },
  { id: "source-ex01", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex01.java", usedFor: ["lifecycle callbacks", "manual service dispatch"], evidence: "inventory 원본2입니다." },
  { id: "source-ex02", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex02.java", usedFor: ["UTF-8 HTML response", "instance msg"], evidence: "inventory 원본3입니다." },
  { id: "source-ex03", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex03.java", usedFor: ["time/random response", "UTF-8 metadata"], evidence: "inventory 원본4입니다." },
  { id: "jdk-javac", repository: "Java SE 21", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["warning audit", "release21 compile"], evidence: "compiler evidence 근거입니다." },
  { id: "jakarta-servlet-spec", repository: "Jakarta Servlet", path: "Servlet 6.1 Specification", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1", usedFor: ["mapping", "lifecycle", "concurrency", "response"], evidence: "container contract의 primary specification입니다." },
  { id: "jakarta-servlet", repository: "Jakarta Servlet 6.1 API", path: "jakarta.servlet.Servlet", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/servlet", usedFor: ["init service destroy lifecycle"], evidence: "Servlet callback API 근거입니다." },
  { id: "jakarta-http-servlet", repository: "Jakarta Servlet 6.1 API", path: "jakarta.servlet.http.HttpServlet", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservlet", usedFor: ["HTTP method dispatch", "original inheritance"], evidence: "HttpServlet dispatch 근거입니다." },
  { id: "jakarta-web-servlet", repository: "Jakarta Servlet 6.1 API", path: "jakarta.servlet.annotation.WebServlet", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/annotation/webservlet", usedFor: ["annotation mapping metadata"], evidence: "mapping annotation 근거입니다." },
  { id: "jakarta-servlet-config", repository: "Jakarta Servlet 6.1 API", path: "jakarta.servlet.ServletConfig", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/servletconfig", usedFor: ["init configuration"], evidence: "container config boundary 근거입니다." },
  { id: "jakarta-servlet-response", repository: "Jakarta Servlet 6.1 API", path: "jakarta.servlet.ServletResponse", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/servletresponse", usedFor: ["charset", "writer", "buffer", "commit"], evidence: "generic response contract 근거입니다." },
  { id: "jakarta-http-response", repository: "Jakarta Servlet 6.1 API", path: "jakarta.servlet.http.HttpServletResponse", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletresponse", usedFor: ["status", "headers", "sendError"], evidence: "HTTP response API 근거입니다." },
  { id: "rfc9110-methods", repository: "IETF", path: "RFC 9110 Methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-methods", usedFor: ["GET HEAD OPTIONS method semantics"], evidence: "HTTP method primary standard입니다." },
  { id: "rfc9110-status", repository: "IETF", path: "RFC 9110 Status Codes", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes", usedFor: ["405", "4xx/5xx error mapping"], evidence: "HTTP status primary standard입니다." },
  { id: "rfc9110-representation", repository: "IETF", path: "RFC 9110 Representation Data and Metadata", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-representation-data-and-met", usedFor: ["Content-Type and metadata"], evidence: "representation metadata 근거입니다." },
  { id: "rfc9110-content", repository: "IETF", path: "RFC 9110 Content", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-content", usedFor: ["content bytes and length"], evidence: "HTTP content framing 의미 근거입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["mapping registry"], evidence: "registry data structure 근거입니다." },
  { id: "java-standard-charsets", repository: "Java SE 21 API", path: "java.nio.charset.StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["explicit UTF-8"], evidence: "portable charset constant 근거입니다." },
  { id: "unicode-utf8", repository: "Unicode Consortium", path: "Unicode Standard Annex and UTF-8", publicUrl: "https://www.unicode.org/versions/Unicode15.1.0/ch03.pdf", usedFor: ["Unicode encoding model"], evidence: "Unicode encoding primary standard입니다." },
  { id: "jls-happens-before", repository: "Java SE 21 JLS", path: "17.4.5 Happens-before", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["concurrent request visibility"], evidence: "Java memory model 근거입니다." },
  { id: "jls-final-fields", repository: "Java SE 21 JLS", path: "17.5 final Field Semantics", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5", usedFor: ["immutable config publication"], evidence: "final field semantics 근거입니다." },
  { id: "java-countdown-latch", repository: "Java SE 21 API", path: "java.util.concurrent.CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["deterministic concurrent overlap"], evidence: "race fixture gate 근거입니다." },
  { id: "java-concurrent-map", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html", usedFor: ["thread-safe observation results"], evidence: "concurrent evidence collection 근거입니다." },
  { id: "java-record", repository: "Java SE 21 JLS", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["immutable configuration value"], evidence: "record value model 근거입니다." },
  { id: "html-spec-text", repository: "WHATWG HTML", path: "Text-level semantics and syntax", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html#syntax-text", usedFor: ["HTML text context"], evidence: "HTML parser context primary standard입니다." },
  { id: "html-spec-charrefs", repository: "WHATWG HTML", path: "Character references", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html#character-references", usedFor: ["HTML output encoding"], evidence: "character reference syntax 근거입니다." },
  { id: "owasp-xss", repository: "OWASP", path: "Cross Site Scripting Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["context-aware output encoding"], evidence: "보안 실무 기준입니다." },
  { id: "owasp-error-handling", repository: "OWASP", path: "Error Handling Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["public/private error separation"], evidence: "오류 정보 노출 방지 기준입니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "Servlet은 main으로 실행하나요?", answer: "아닙니다. container가 instance·mapping·lifecycle과 request/response를 관리합니다." },
  { question: "@WebServlet value는 무엇인가요?", answer: "application context 안에서 요청을 handler에 연결하는 URL pattern metadata입니다." },
  { question: "같은 pattern이 두 Servlets에 있으면 어떻게 해야 하나요?", answer: "startup에 conflict로 거부하고 owner를 하나로 정해야 합니다." },
  { question: "context path와 servlet mapping은 같은가요?", answer: "아닙니다. context path는 deployment prefix이고 mapping은 application 내부 route입니다." },
  { question: "init은 언제 호출되나요?", answer: "container가 instance를 만든 뒤 요청 service 전에 보통 한 번 호출합니다." },
  { question: "service는 한 번만 호출되나요?", answer: "아닙니다. READY 동안 여러 requests와 threads에서 반복·동시 호출될 수 있습니다." },
  { question: "destroy 후 service해도 되나요?", answer: "아닙니다. lifecycle상 더는 요청을 수락하지 않는 terminal state입니다." },
  { question: "HttpServlet.service를 보통 직접 override해야 하나요?", answer: "필요한 특별 이유가 없다면 표준 method dispatch를 보존하고 doGet/doPost 등을 override합니다." },
  { question: "unsupported method의 올바른 응답은 무엇인가요?", answer: "resource가 존재하면405와 Allow header로 허용 methods를 알려야 합니다." },
  { question: "HEAD와 GET의 차이는 무엇인가요?", answer: "selected representation metadata는 같지만 HEAD는 response content를 보내지 않습니다." },
  { question: "OPTIONS는 무엇을 알려 주나요?", answer: "resource가 지원하는 communication options와 methods를 발견하는 데 사용합니다." },
  { question: "POST를 doGet에 무조건 위임해도 되나요?", answer: "method semantics와 보안 정책이 같다는 근거가 있을 때만 공통 logic을 추출해야 합니다." },
  { question: "response commit이란 무엇인가요?", answer: "status와 headers가 전송 대상으로 확정되어 더는 안전하게 바꿀 수 없는 상태입니다." },
  { question: "charset은 언제 설정해야 하나요?", answer: "response writer를 얻거나 body를 쓰기 전에 Content-Type과 함께 확정합니다." },
  { question: "forward 전에 body를 쓰면 왜 위험한가요?", answer: "buffer가 commit되어 dispatch가 실패하거나 부분 body가 섞일 수 있습니다." },
  { question: "String.length가 Content-Length인가요?", answer: "아닙니다. UTF-16 code units 수이며 wire byte count는 encoding 뒤 계산합니다." },
  { question: "서울은 Java length와 UTF-8 bytes가 각각 얼마인가요?", answer: "length2, UTF-8 bytes6입니다." },
  { question: "default charset을 피하는 이유는 무엇인가요?", answer: "host 환경에 따라 달라져 response bytes와 test가 비결정적이기 때문입니다." },
  { question: "Servlet instance field에 request parameter를 두어도 되나요?", answer: "안 됩니다. 동시 요청이 같은 instance를 공유해 서로 덮을 수 있습니다." },
  { question: "volatile을 붙이면 request 값 섞임이 해결되나요?", answer: "아닙니다. 가시성만 보장하고 요청별 ownership을 보존하지 않습니다." },
  { question: "request별 값은 어디에 두나요?", answer: "method local, request attribute 또는 요청에 한정된 immutable object에 둡니다." },
  { question: "Servlet field에 둘 수 있는 안전한 값은 무엇인가요?", answer: "init에서 완성해 변경하지 않는 immutable config와 thread-safe shared service입니다." },
  { question: "config reload는 어떻게 안전하게 하나요?", answer: "관련 fields를 따로 바꾸지 말고 immutable snapshot을 atomic하게 교체합니다." },
  { question: "destroy에서 무엇을 close하나요?", answer: "해당 lifecycle owner가 직접 생성·소유한 resource만 close합니다." },
  { question: "HTML text에 사용자 input을 넣을 때 무엇이 필요한가요?", answer: "업무 validation과 최종 HTML text context output encoding이 필요합니다." },
  { question: "HTML escaper를 JavaScript 문자열에 재사용해도 되나요?", answer: "안 됩니다. parser context별 encoding/serialization 규칙이 다릅니다." },
  { question: "fixed application message도 항상 위험한가요?", answer: "고정 trusted text는 user input과 다르지만 renderer boundary를 유지하는 편이 안전합니다." },
  { question: "validation이 escaping을 대신하나요?", answer: "아닙니다. validation은 허용 업무 값, encoding은 출력 parser context를 다룹니다." },
  { question: "입력 오류에는 보통 어떤 status를 쓰나요?", answer: "요청 형식·값이 잘못되면400 계열의 의미 있는 status를 사용합니다." },
  { question: "없는 resource와 unsupported method는 어떻게 다른가요?", answer: "resource 없음은404, 존재하지만 method 불허는405입니다." },
  { question: "unexpected exception message를 client에 보여도 되나요?", answer: "아닙니다. safe public message와 correlation id만 공개합니다." },
  { question: "모든 오류를200으로 보내면 어떤 문제가 있나요?", answer: "client와 monitor가 성공·실패를 구분하지 못합니다." },
  { question: "원본 warning4의 category는 무엇인가요?", answer: "네 HttpServlet subclasses의 missing serialVersionUID 경고입니다." },
  { question: "원본 compile 성공이 container behavior를 증명하나요?", answer: "아닙니다. mapping·lifecycle·dispatch는 real container integration test가 필요합니다." },
  { question: "Ex03 output을 exact golden page로 쓰기 어려운 이유는 무엇인가요?", answer: "LocalDate.now와 Math.random 때문에 시간·난수에 따라 바뀝니다." },
  { question: "동시성 test에 sleep 대신 무엇을 쓰나요?", answer: "CountDownLatch 같은 gate로 원하는 interleaving을 고정합니다." },
  { question: "raw URI를 metric label로 쓰면 왜 위험한가요?", answer: "사용자 값마다 새 label이 되어 cardinality가 폭증할 수 있습니다." },
  { question: "response error renderer도 charset이 필요한가요?", answer: "네. 정상 body와 같은 media type·charset·escaping 계약을 따릅니다." },
  { question: "commit 뒤500을 설정하면 어떻게 되나요?", answer: "client가 이미200 headers를 받았을 수 있어 변경이 반영되지 않습니다." },
  { question: "이 세션의 JDK-only fixture 한계는 무엇인가요?", answer: "Servlet API/container 구현을 실행하지 않으므로 실제 deployment integration을 별도로 검증해야 합니다." },
);

(session.completionChecklist as string[]).push(
  "원본4 source를 모두 읽었다.",
  "원본4 SHA-256 relocation을 확인했다.",
  "warning4 missing SVUID를 보존했다.",
  "mapping4 경로를 식별했다.",
  "init4·service1·doGet4·doPost3·destroy2 shape를 확인했다.",
  "container를 원본 감사에서 실행하지 않았다.",
  "mapping과 context path를 구분한다.",
  "duplicate mapping을 startup에 거부한다.",
  "route id와 raw URI를 구분한다.",
  "NEW·READY·DESTROYED 상태를 설명한다.",
  "init 실패를 readiness 실패로 처리한다.",
  "destroy 후 새 요청을 거부한다.",
  "in-flight ownership과 deadline을 둔다.",
  "표준 HttpServlet.service dispatch를 보존한다.",
  "필요한 doX만 override한다.",
  "GET·HEAD semantics를 구분한다.",
  "OPTIONS와 Allow를 제공한다.",
  "unsupported method에405를 반환한다.",
  "POST와 GET 정책을 무조건 합치지 않는다.",
  "status를 body 전에 설정한다.",
  "Content-Type을 body 전에 설정한다.",
  "charset을 writer 전에 설정한다.",
  "response commit 시점을 추적한다.",
  "forward 전에 body를 쓰지 않는다.",
  "error mapping을 commit 전에 끝낸다.",
  "Java chars와 wire bytes를 구분한다.",
  "UTF-8을 explicit하게 사용한다.",
  "서울 chars2·bytes6을 검증했다.",
  "Content-Length는 encoded bytes 기준임을 안다.",
  "default charset 의존을 제거했다.",
  "request parameter를 instance field에 두지 않는다.",
  "request model을 local/request scope에 둔다.",
  "volatile이 request ownership 해결책이 아님을 안다.",
  "latch로 field race를 재현했다.",
  "shared service의 thread safety를 확인한다.",
  "init config를 immutable snapshot으로 만든다.",
  "invalid config를 startup에 거부한다.",
  "config version을 기록한다.",
  "reload는 whole snapshot으로 수행한다.",
  "resource 생성·close owner를 문서화한다.",
  "HTML text와 다른 contexts를 구분한다.",
  "사용자 text를 output encode한다.",
  "&·<·>·quote를 올바르게 처리한다.",
  "validation과 escaping을 둘 다 적용한다.",
  "trusted markup과 untrusted data를 분리한다.",
  "inline JavaScript data 연결을 피한다.",
  "400·404·405·500을 구분한다.",
  "오류도 올바른 Content-Type을 가진다.",
  "public message와 internal cause를 분리한다.",
  "correlation id를 안전하게 공개한다.",
  "stack·SQL·path·secret을 body에 넣지 않는다.",
  "error body에서 사용자 input을 escape한다.",
  "warning0 maintained examples를 검증한다.",
  "각 Java example exact output을 검증한다.",
  "GET/HEAD/OPTIONS/POST matrix를 테스트한다.",
  "non-root context deployment를 테스트한다.",
  "concurrent requests를 overlap시킨다.",
  "destroy-race를 bounded test한다.",
  "JDK-only fixture와 container integration을 구분한다.",
  "real container에서 mapping·lifecycle·commit을 재검증한다.",
);
