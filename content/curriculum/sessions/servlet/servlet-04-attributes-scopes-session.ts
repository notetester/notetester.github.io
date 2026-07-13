import type { DetailedSession, DetailedChapter } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

type Seed = { id: string; title: string; lead: string; explanations: string[]; terms: Array<[string,string,string[]]>; filename: string; code: string; output: string; refs: string[]; diagnostics: Array<[string,string,string[],string,string]>; notes?: string[] };
const walkthroughFor=(code:string)=>{const last=code.split(/\r?\n/).length;const first=Math.ceil(last/3);const second=Math.ceil(last*2/3);return [{lines:`1-${first}`,explanation:"scope owner와 immutable value/atomic operation을 선언합니다."},{lines:`${first+1}-${second}`,explanation:"lookup, invalidation, rotation 또는 concurrent update 정책을 적용합니다."},{lines:`${second+1}-${last}`,explanation:"경계 사례를 실행해 lifetime·race·visibility 결과를 exact output으로 확인합니다."}];};
const makeChapter = (s: Seed): DetailedChapter => ({
  id: s.id, title: s.title, lead: s.lead, explanations: s.explanations,
  concepts: s.terms.map(([term,definition,detail]) => ({term,definition,detail})),
  codeExamples: [{
    id: `java-${s.id}`, title: s.title, language: "java", filename: s.filename,
    purpose: `${s.title}의 lifetime·ownership·concurrency 계약을 JDK-only fixture로 검증합니다.`, code: s.code,
    walkthrough: walkthroughFor(s.code),
    run: { environment: ["OpenJDK 21","PowerShell 7+","container/network 불필요"], command: isolatedJavaRun(s.filename,s.filename.replace(/\.java$/, "")) },
    output: { value:s.output, explanation:["고정된 state와 synchronization으로 exact합니다.","실제 HttpSession/JSP container behavior는 integration에서 재검증합니다."] },
    experiments: [{change:"같은 key를 더 짧은 scope에도 둡니다.",prediction:"implicit lookup은 가까운 scope 값을 선택합니다.",result:"보안·업무 state는 explicit scope를 씁니다."},{change:"두 threads가 같은 session/application 값을 갱신합니다.",prediction:"compound read-modify-write는 lost update가 날 수 있습니다.",result:"scope map thread safety와 business operation atomicity를 구분합니다."},{change:"invalidate/TTL/serialization 경계를 통과시킵니다.",prediction:"오래 사는 state의 참조와 복원 가능성이 드러납니다.",result:"최소 state와 explicit lifecycle을 적용합니다."}],
    sourceRefs:s.refs,
  }],
  diagnostics:s.diagnostics.map(([symptom,likelyCause,checks,fix,prevention])=>({symptom,likelyCause,checks,fix,prevention})),
  expertNotes:s.notes,
});

const session: DetailedSession = {
  schemaVersion:2,
  inventoryIds:["servlet-04-attributes-scopes-session"],
  slug:"servlet-04-attributes-scopes-session",
  courseId:"servlet-jsp", moduleId:"servlet-http-lifecycle", order:4,
  title:"Servlet/JSP attributes·scope·session 동시성",
  subtitle:"page→request→session→application lookup을 lifetime과 ownership으로 해석하고 fixation, cookie, race, retention, passivation과 authorization 경계까지 완성합니다.",
  level:"중급", estimatedMinutes:900,
  coreQuestion:"값을 어느 scope에 둘지 어떻게 결정하고, session/application처럼 여러 요청과 threads가 공유하는 상태를 정보 노출·race·고착 없이 관리할까요?",
  summary:"원본 ex03_InnerObject.jsp, ex07_Attribute.jsp와 Ex09.java를 모두 hash하고 Java warning1·active shape를 감사합니다. ex07은 name을 page/request/session/application에 두고 page를 다시 덮어 setAttribute5/getAttribute4와 unscoped ${name} shadowing을 보여 줍니다. ex03 JSP declaration의 result field는 생성된 Servlet instance field가 되어 동시 requests가 공유하므로 scriptlet local과 다릅니다. Ex09는 scope attribute를 사용하지 않는 calculator/fortune Servlet이라는 inventory mismatch도 기록합니다. 현대 fixtures는 explicit lookup, request lifetime, session invalidation/rotation/cookie, deterministic lost update, atomic application counter, immutable snapshot, serialization budget, minimal principal과 atomic flash를 warning0 exact output으로 검증합니다.",
  objectives:["page/request/session/application의 owner·lifetime·visibility를 비교한다.","EL implicit lookup shadowing과 explicit scoped access를 구분한다.","request attribute가 forward에는 유지되고 redirect에는 사라지는 이유를 설명한다.","session id와 authenticated principal을 구분하고 login/logout rotation/invalidation을 설계한다.","Secure·HttpOnly·SameSite·Path cookie 속성의 역할과 한계를 설명한다.","session compound update와 JSP declaration field race를 결정적으로 재현한다.","application state에 atomic operation 또는 immutable snapshot을 사용한다.","session retention·serialization·cluster/passivation과 authorization 최소 state를 설계한다."],
  prerequisites:[{title:"forward·redirect·PRG",reason:"request와 flash/session lifetime은 navigation 방식에 따라 달라집니다.",sessionSlug:"servlet-03-forward-redirect-prg"},{title:"Servlet lifecycle/concurrency",reason:"JSP도 Servlet로 변환되어 instance와 concurrent service model을 따릅니다.",sessionSlug:"servlet-01-mapping-lifecycle-response"}],
  keywords:["pageScope","requestScope","sessionScope","applicationScope","EL","shadowing","HttpSession","session fixation","changeSessionId","Secure","HttpOnly","SameSite","lost update","ServletContext","immutable snapshot","passivation","flash"],
  chapters:[],
  lab:{title:"로그인 session·장바구니·application config scope audit",scenario:"view model은 request, principal/cart는 session, immutable feature config는 application에 두고 동시성·보안·retention을 검증합니다.",setup:["anonymous/authenticated session, two-tab, concurrent cart updates, config reload, timeout/logout와 serialization fixtures를 준비합니다.","raw password/token/DB connection을 scope에 저장하지 않는 검사 목록을 둡니다."],steps:["각 value의 owner·readers·writers·lifetime·size·sensitivity를 표로 만듭니다.","view model을 request attribute로 만들고 explicit EL scope를 씁니다.","login success에 session id를 rotate하고 minimal principal을 저장합니다.","cookie attributes와 context Path를 설정합니다.","cart compound update를 session-owned atomic abstraction으로 만듭니다.","application config는 immutable snapshot whole-swap을 사용합니다.","logout/timeout에 invalidate하고 references/resources를 정리합니다.","serialization size, two-tab race와 two-node behavior를 검증합니다."],expectedResult:["scope shadowing이 explicit access로 통제됩니다.","login 전 session id가 인증 후 바뀌고 logout 뒤 old state를 쓸 수 없습니다.","동시 cart/config updates가 lost update나 torn state를 만들지 않습니다.","session에는 최소 serializable identifiers만 남고 secret/resource가 없습니다."],cleanup:["sessions와 flash store를 invalidate합니다.","threads를 join하고 owned temp만 삭제합니다."],extensions:["Spring Session/Redis에서 atomic operation과 TTL을 재검증합니다.","CSRF token·concurrent session control을 추가합니다.","JFR/heap histogram으로 session retention budget을 관찰합니다."]},
  exercises:[
    {difficulty:"따라하기",prompt:"같은 name이 네 scopes에 있을 때 implicit/explicit lookup 표를 만드세요.",requirements:["page→request→session→application 순서를 검증합니다.","각 scope 값을 출력합니다.","없는 key를 구분합니다.","보안 값에는 implicit lookup을 쓰지 않습니다."],hints:["shadowing은 값 소실이 아니라 lookup 결과 선택입니다."],expectedOutcome:"원본 ex07과 같은 shadowing을 결정적 fixture로 설명합니다.",solutionOutline:["scope maps와 explicit resolver를 분리합니다."]},
    {difficulty:"응용",prompt:"동시 장바구니 quantity update를 lost update 없이 구현하세요.",requirements:["두 threads를 latch로 overlap시킵니다.","broken read-modify-write를 재현합니다.","atomic compute 또는 session lock으로 고칩니다.","다른 sessions는 병렬성을 유지합니다.","timeout/invalidate race를 처리합니다."],hints:["ConcurrentHashMap의 get과 put 두 calls가 하나의 atomic transaction은 아닙니다."],expectedOutcome:"expected2와 actual2가 항상 일치하는 bounded test가 통과합니다.",solutionOutline:["owner별 lock 또는 atomic operation을 사용합니다."]},
    {difficulty:"설계",prompt:"cluster-ready session data policy ADR을 작성하세요.",requirements:["저장 가능 type·size·TTL을 정합니다.","serialization/version migration을 다룹니다.","PII/secret 금지와 encryption scope를 정합니다.","login rotation/logout invalidation을 포함합니다.","node failure와 concurrent requests를 test합니다."],hints:["in-memory Java object identity는 cluster 경계를 넘지 않습니다."],expectedOutcome:"운영·보안·동시성 acceptance가 있는 session 정책이 완성됩니다.",solutionOutline:["session은 minimal identifiers와 bounded value만 저장합니다."]},
  ],
  reviewQuestions:[],completionChecklist:[],nextSessions:["servlet-05-command-dispatch"],sources:[],
  sourceCoverage:{filesRead:3,filesUsed:3,uncoveredNotes:["inventory JSP2와 Java Ex09를 직접 읽고 hash했습니다. Ex09는 scope API를 사용하지 않는다는 mismatch도 source evidence입니다.","JSP는 container compile하지 않고 comments 밖 declaration/scriptlet/EL/attribute shape를 감사합니다. Java Ex09만 Servlet API로 compile했습니다.","JSP declaration result field의 concurrency 위험을 generated-servlet mental model과 deterministic fixture로 보강했습니다."]},
};

const audit: DetailedChapter={
  id:"original-servlet04-jsp2-java1-audit",title:"원본 JSP2·Java1의 scope shape와 declaration field를 감사합니다",lead:"JSP comment 설명과 active set/get/EL, declaration field를 분리하고 inventory mismatch를 숨기지 않습니다.",
  explanations:["ex07_Attribute.jsp는 pageContext에 name을 홍길동 뒤 둘리로 두 번 설정하고 request 장길산, session 임꺽정, application 일지매를 설정합니다. active setAttribute5/getAttribute4입니다.","${name}은 page→request→session→application 순서로 찾아 page의 둘리를 선택합니다. scoped EL expressions는 각각 값을 직접 가리켜 shadowing을 피합니다.","ex03_InnerObject.jsp의 scriptlet locals str/luck/sum/i는 service method local이지만 <%! ... %> declaration 안 result=0과 methods는 generated Servlet members가 됩니다.","sub(7,5)가 shared result field를 쓰고 뒤 expression이 읽는 사이 다른 request가 끼면 결과가 섞일 수 있습니다. JSP page directive threadSafe 같은 legacy 우회보다 declaration mutable state를 제거해야 합니다.","Ex09 Java는 request parameters와 calculator/fortune switch를 사용하지만 setAttribute/getSession/ServletContext attribute는 없습니다. inventory 포함과 주제 일치를 구분합니다.","audit은 hashes3, Ex09 missing SVUID warning1, Java mapping/switch shape와 JSP set5/get4/EL5/expressions13/declaration1을 확인하며 JSP/container를 실행하지 않습니다."],
  concepts:[{term:"JSP declaration",definition:"generated Servlet class의 field 또는 method가 되는 <%! ... %> 영역입니다.",detail:["mutable field는 requests가 공유합니다.","scriptlet local과 lifetime이 다릅니다."]},{term:"scope shadowing",definition:"같은 name이 여러 scopes에 있을 때 가까운 scope가 implicit lookup 결과를 가리는 현상입니다.",detail:["값 자체는 각 scope에 남아 있습니다.","explicit scope로 ambiguity를 제거합니다."]},{term:"inventory mismatch",definition:"source가 session 분류에 포함됐지만 핵심 API/topic을 실제로 사용하지 않는 provenance 사실입니다.",detail:["억지 claim을 만들지 않습니다.","보조 맥락으로만 사용합니다."]}],
  codeExamples:[{id:"powershell-original-servlet04-audit",title:"JSP2·Java1 hash, warning과 active scope shape를 검증합니다",language:"powershell",filename:"verify-original-servlet04.ps1",purpose:"container 없이 원본 scope evidence와 JSP declaration concurrency 단서를 고정합니다.",
    code:String.raw`param([Parameter(Mandatory)][string]$SourceRoot,[Parameter(Mandatory)][string]$ServletApiJar)
$ErrorActionPreference='Stop';$names=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS');$saved=@{}
foreach($n in $names){$i=Get-Item ("Env:"+$n)-ErrorAction SilentlyContinue;$saved[$n]=@{Exists=$null-ne$i;Value=if($i){$i.Value}else{$null}};Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar);$root=Join-Path $base ("servlet04 audit "+[Guid]::NewGuid().ToString('N'));$owned=$false;$failure=$null
function StripJava([string]$s){return [regex]::Replace(([regex]::Replace($s,'(?s)/\*.*?\*/','')),'(?m)//.*$','')};function StripJsp([string]$s){return [regex]::Replace($s,'(?s)<%--.*?--%>','')}
try{if(-not(Test-Path -LiteralPath $ServletApiJar -PathType Leaf)){throw 'servlet api missing'};New-Item -ItemType Directory $root|Out-Null;$owned=$true
  $java='src/main/java/org/study/jspstudy/day01/Ex09.java';$jsp=@('src/main/webapp/day02/ex03_InnerObject.jsp','src/main/webapp/day02/ex07_Attribute.jsp');$all=@($java)+$jsp;$copy=@{}
  foreach($rel in $all){$src=Get-Item -LiteralPath (Join-Path $SourceRoot $rel);$dst=Join-Path $root $rel;New-Item -ItemType Directory ([IO.Path]::GetDirectoryName($dst))-Force|Out-Null;[IO.File]::Copy($src.FullName,$dst);if((Get-FileHash $src.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $dst -Algorithm SHA256).Hash){throw 'hash drift'};$copy[$rel]=$dst}
  $classes=Join-Path $root 'classes';New-Item -ItemType Directory $classes|Out-Null;$common=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics');$c=@(& javac @common -cp $ServletApiJar -d $classes $copy[$java] 2>&1)
  if($LASTEXITCODE-ne0-or@($c|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count-ne1-or$c[-1]-notmatch'1 warning'){throw 'compile drift'}
  $j=StripJava([IO.File]::ReadAllText($copy[$java]));$p=(@($jsp|ForEach-Object{StripJsp([IO.File]::ReadAllText($copy[$_]))}))-join[Environment]::NewLine
  $shape=@{mapping=([regex]::Matches($j,'@WebServlet\s*\(')).Count;servlet=([regex]::Matches($j,'extends\s+HttpServlet\b')).Count;init=([regex]::Matches($j,'\bvoid\s+init\s*\(')).Count;doGet=([regex]::Matches($j,'\bvoid\s+doGet\s*\(')).Count;doPost=([regex]::Matches($j,'\bvoid\s+doPost\s*\(')).Count;writer=([regex]::Matches($j,'\.getWriter\s*\(')).Count;encoding=([regex]::Matches($j,'\.setCharacterEncoding\s*\(')).Count;parameter=([regex]::Matches($j,'\.getParameter\s*\(')).Count;switch=([regex]::Matches($j,'\bswitch\s*\(')).Count;cases=([regex]::Matches($j,'\bcase\s+')).Count;defaults=([regex]::Matches($j,'\bdefault\s*:')).Count;setAttribute=([regex]::Matches($p,'\.setAttribute\s*\(')).Count;getAttribute=([regex]::Matches($p,'\.getAttribute\s*\(')).Count;el=([regex]::Matches($p,'\$\{')).Count;expressions=([regex]::Matches($p,'<%=')).Count;declarations=([regex]::Matches($p,'<%!')).Count}
  if($shape.mapping-ne1-or$shape.servlet-ne1-or$shape.init-ne1-or$shape.doGet-ne1-or$shape.doPost-ne1-or$shape.writer-ne1-or$shape.encoding-ne2-or$shape.parameter-ne4-or$shape.switch-ne2-or$shape.cases-ne6-or$shape.defaults-ne2-or$shape.setAttribute-ne5-or$shape.getAttribute-ne4-or$shape.el-ne5-or$shape.expressions-ne13-or$shape.declarations-ne1){throw ('shape drift '+($shape|ConvertTo-Json -Compress))}
  'files=jsp2+java1,hashes=3|compile=javaWarning1,missingSVUID1|jsp=hash+active-shape-only'
  'shape=java:mapping1,servlet1,init1,doGet1,doPost1,writer1,encoding2,parameter4,switch2,cases6,defaults2|jsp:setAttribute5,getAttribute4,el5,expressions13,declarationBlocks1'
  'privacy=container:not-run|network:none|original:read-only|fixture:owned-temp'
}catch{$failure=$_.Exception}finally{foreach($n in $names){if($saved[$n].Exists){Set-Item ("Env:"+$n) $saved[$n].Value}else{Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}};if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item -LiteralPath $resolved -Recurse -Force};if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}}`,
    walkthrough:[{lines:"1-8",explanation:"launcher state와 owned temp, Java/JSP comment stripping을 준비합니다."},{lines:"9-11",explanation:"JSP2와 Java1을 복사해 SHA-256을 비교합니다."},{lines:"12-14",explanation:"Ex09만 JDK21+ServletAPI compile해 warning1을 보존합니다."},{lines:"15-18",explanation:"Java switch/parameter와 JSP scope/EL/declaration shape를 comments 밖에서 셉니다."},{lines:"19-end",explanation:"JSP 미compile/container 미실행 경계와 안전 cleanup을 보존합니다."}],
    run:{environment:["PowerShell 7+","OpenJDK 21","Jakarta Servlet API 6.1 jar","jspstudy root"],command:"pwsh -NoProfile -File verify-original-servlet04.ps1 -SourceRoot <jspstudy-root> -ServletApiJar <servlet-api.jar>"},
    output:{value:"files=jsp2+java1,hashes=3|compile=javaWarning1,missingSVUID1|jsp=hash+active-shape-only\nshape=java:mapping1,servlet1,init1,doGet1,doPost1,writer1,encoding2,parameter4,switch2,cases6,defaults2|jsp:setAttribute5,getAttribute4,el5,expressions13,declarationBlocks1\nprivacy=container:not-run|network:none|original:read-only|fixture:owned-temp",explanation:["scope source shape가 재현됩니다.","JSP compile을 주장하지 않습니다.","container/network를 시작하지 않습니다."]},
    experiments:[{change:"pageContext name 설정을 제거합니다.",prediction:"implicit ${name}은 request의 장길산을 선택합니다.",result:"lookup shadowing을 확인합니다."},{change:"sub 호출 두 개를 동시 overlap시킵니다.",prediction:"shared result field read가 다른 요청 값으로 섞일 수 있습니다.",result:"local result 반환으로 고칩니다."},{change:"Ex09에서 scope call을 찾습니다.",prediction:"active setAttribute/getSession call은 없습니다.",result:"inventory mismatch를 그대로 기록합니다."}],
    sourceRefs:["source-inner-jsp","source-attribute-jsp","source-ex09","jdk-javac","jsp-spec","jakarta-session","jakarta-context"]}],
  diagnostics:[{symptom:"같은 name인데 예상과 다른 값이 EL에 보인다.",likelyCause:"더 가까운 scope가 implicit lookup을 shadow합니다.",checks:["page/request/session/application에 같은 key가 있는지 봅니다.","explicit scoped EL로 각각 출력합니다."],fix:"security/business state는 explicit scope와 unique model key를 사용합니다.",prevention:"scope collision tests를 둡니다."},{symptom:"JSP 뺄셈 결과가 간헐적으로 다른 사용자 값이다.",likelyCause:"declaration result field가 generated Servlet instance에서 공유됩니다.",checks:["<%! mutable field를 찾습니다.","동시 requests를 latch로 겹칩니다."],fix:"계산 결과를 method local/return value로 만듭니다.",prevention:"JSP scriptlet/declaration mutable state를 금지합니다."}],
};
session.chapters.push(audit);

const seeds:Seed[]=[
  {id:"scope-lookup-shadowing-explicit",title:"scope lookup order와 explicit access를 구분합니다",lead:"page→request→session→application 순서는 편의 규칙이며 중요한 state의 소유권을 추론하게 두지 않습니다.",
   explanations:["page scope는 현재 JSP evaluation에만, request는 하나의 logical request와 forward/include, session은 client conversation, application은 web application 전체가 공유합니다.","unscoped EL name은 가까운 scope에서 처음 발견한 값을 반환합니다. ex07의 ${name}은 마지막 page value 둘리입니다.","shadowing은 request/session/application 값을 삭제하지 않습니다. ${requestScope.name}처럼 explicit access하면 모두 볼 수 있습니다.","authorization principal, CSRF token, tenant 같은 값은 implicit name lookup 대신 typed accessor와 explicit owner를 씁니다.","scope 선택은 가장 오래 사는 곳이 아니라 필요한 readers와 최소 lifetime/visibility가 일치하는 가장 짧은 곳입니다."],
   terms:[["implicit scope lookup","name을 여러 scopes에서 순서대로 찾는 EL resolution입니다.",["page가 가장 먼저입니다.","collision을 숨길 수 있습니다."]],["least lifetime","기능에 필요한 최소 시간만 state를 보존하는 원칙입니다.",["retention과 leakage를 줄입니다.","reader/writer ownership을 명시합니다."]]],filename:"ScopeResolution.java",
   code:String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ScopeResolution {
    record Scope(String name, Map<String,String> values) {}
    static String implicit(List<Scope> scopes,String key){
        for(Scope scope:scopes) if(scope.values().containsKey(key)) return scope.name()+":"+scope.values().get(key);
        return "missing";
    }
    public static void main(String[] args){
        Map<String,String> page=new LinkedHashMap<>();page.put("name","홍길동");page.put("name","둘리");
        List<Scope> scopes=List.of(new Scope("page",page),new Scope("request",Map.of("name","장길산")),new Scope("session",Map.of("name","임꺽정")),new Scope("application",Map.of("name","일지매")));
        System.out.println("implicit="+implicit(scopes,"name"));
        for(Scope scope:scopes) System.out.println(scope.name()+"="+scope.values().get("name"));
    }
}`,
   output:"implicit=page:둘리\npage=둘리\nrequest=장길산\nsession=임꺽정\napplication=일지매",refs:["source-attribute-jsp","jakarta-el","jsp-spec","java-map"],
   diagnostics:[["session name을 넣었는데 page name이 보인다.","implicit lookup shadowing입니다.",["각 scope key를 explicit 출력합니다.","page model key를 봅니다."],"explicit scope 또는 unique view key를 씁니다.","collision matrix를 test합니다."],["scope에 값이 너무 오래 남는다.","필요 이상으로 session/application을 선택했습니다.",["owner/readers/lifetime 표를 만듭니다.","heap/session size를 봅니다."],"가장 짧은 충분한 scope로 옮깁니다.","scope decision checklist를 둡니다."]]},
  {id:"request-scope-forward-redirect-lifetime",title:"request scope를 logical dispatch chain에 한정합니다",lead:"request attribute는 forward/include에 보존되지만 response completion과 redirect 새 request에서는 사라집니다.",
   explanations:["controller의 validated view model과 errors는 request attribute에 적합합니다. 한 rendering chain만 필요하기 때문입니다.","forward는 같은 request를 사용하므로 attribute가 유지되고 redirect는 client가 새 request를 보내므로 유지되지 않습니다.","async dispatch는 request lifetime을 연장할 수 있어 timeout/completion listener와 thread-local cleanup을 고려합니다.","request scope라고 해도 large object, input stream 또는 resource를 무제한 붙이면 request fan-out과 logging에서 비용이 커집니다.","request attribute name은 framework/spec keys와 충돌하지 않도록 application namespace를 사용합니다."],
   terms:[["logical request","client request와 그 안의 forward/error/async dispatch를 포함하는 처리 lifetime입니다.",["response complete에 종료합니다.","redirect는 새 logical request입니다."]],["view model","renderer가 필요한 validated·formatted data 묶음입니다.",["request scope에 적합합니다.","raw domain object를 과다 노출하지 않습니다."]]],filename:"RequestScopeLifetime.java",
   code:String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class RequestScopeLifetime {
    record Request(int id,Map<String,Object> attributes){}
    static Request forward(Request request){return request;}
    static Request redirect(Request old){return new Request(old.id()+1,new LinkedHashMap<>());}
    public static void main(String[] args){
        Request first=new Request(1,new LinkedHashMap<>());first.attributes().put("app.message","saved");
        Request forwarded=forward(first);Request redirected=redirect(first);
        System.out.println("forwardSame="+(first==forwarded)+",message="+forwarded.attributes().get("app.message"));
        System.out.println("redirectSame="+(first==redirected)+",message="+redirected.attributes().get("app.message"));
    }
}`,
   output:"forwardSame=true,message=saved\nredirectSame=false,message=null",refs:["jakarta-request","jakarta-dispatcher","servlet-spec"],
   diagnostics:[["redirect result에서 errors가 null이다.","request attribute를 새 request까지 유지될 것으로 기대했습니다.",["request identity와 status/Location을 봅니다."],"forward하거나 bounded flash/durable id를 사용합니다.","navigation lifetime tests를 둡니다."],["async 완료 뒤 ThreadLocal user가 남는다.","request scope와 thread lifetime을 동일시했습니다.",["async dispatch/thread switch를 추적합니다.","cleanup listener를 봅니다."],"context를 explicit 전달하고 completion에서 cleanup합니다.","async timeout/error tests를 둡니다."]]},
  {id:"session-identity-invalidate-timeout",title:"session id, principal과 lifecycle을 분리합니다",lead:"session은 anonymous 상태에서도 존재할 수 있고 인증은 그 session에 연결된 별도 security state입니다.",
   explanations:["HttpSession id는 conversation state locator이지 사용자 identity나 authorization proof 자체가 아닙니다.","getSession(false)는 기존 session만 조회해 public request마다 불필요한 session을 생성하지 않습니다.","inactive timeout은 마지막 접근 기준이며 browser close를 server가 즉시 알 수 있다는 보장이 없습니다.","logout은 authentication state 제거뿐 아니라 session invalidate, security cookies 정리와 server-side token revocation 정책을 포함합니다.","invalidate 뒤 기존 reference/access는 사용할 수 없으며 concurrent in-flight request policy를 명시해야 합니다."],
   terms:[["session id","server-side session state를 찾는 opaque locator입니다.",["secret처럼 보호합니다.","principal과 다릅니다."]],["invalidation","session과 bound attributes를 더는 사용하지 못하게 종료하는 lifecycle action입니다.",["logout에 사용합니다.","concurrent requests를 고려합니다."]]],filename:"SessionLifecycle.java",
   code:String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class SessionLifecycle {
    static final class Session{private boolean valid=true;private final Map<String,String> data=new LinkedHashMap<>();
        void set(String k,String v){check();data.put(k,v);}String get(String k){check();return data.get(k);}void invalidate(){check();valid=false;data.clear();}void check(){if(!valid)throw new IllegalStateException("invalidated");}}
    public static void main(String[] args){Session s=new Session();s.set("principal","user-7");System.out.println("before="+s.get("principal"));s.invalidate();try{s.get("principal");}catch(IllegalStateException e){System.out.println(e.getMessage());}}
}`,
   output:"before=user-7\ninvalidated",refs:["jakarta-session","servlet-spec","owasp-session"],
   diagnostics:[["브라우저를 닫았는데 server session이 남는다.","browser close와 server invalidation을 동일시했습니다.",["cookie type과 inactive timeout을 봅니다.","server session metrics를 봅니다."],"bounded timeout과 explicit logout/invalidation을 둡니다.","expiry tests를 둡니다."],["logout 뒤 old session으로 접근된다.","principal만 지우고 session/token을 무효화하지 않았습니다.",["old cookie replay와 token store를 봅니다."],"session invalidate와 관련 token revocation을 수행합니다.","logout replay tests를 둡니다."]]},
  {id:"session-fixation-id-rotation",title:"인증 privilege가 바뀔 때 session id를 rotate합니다",lead:"attacker가 미리 아는 anonymous id가 login 뒤에도 유지되면 같은 id로 authenticated session을 탈취할 수 있습니다.",
   explanations:["session fixation은 attacker가 victim에게 known session id를 쓰게 한 뒤 victim login으로 그 id에 privilege가 붙기를 기다립니다.","login 성공 직후 container changeSessionId 또는 새 session migration으로 id를 바꾸고 필요한 bounded attributes만 보존합니다.","rotation은 authentication 완료와 같은 security transition에 묶고 old id를 즉시 사용할 수 없게 합니다.","redirect URL/session rewriting으로 id가 URL에 노출되지 않게 cookie tracking을 우선합니다.","logout, privilege elevation, account switch에서도 rotation/invalidation 정책을 검토합니다."],
   terms:[["session fixation","인증 전 알려진 session id에 victim privilege가 붙도록 유도하는 공격입니다.",["login rotation으로 방어합니다.","old id를 폐기합니다."]],["privilege transition","anonymous→authenticated 또는 role elevation처럼 security 권한이 바뀌는 순간입니다.",["session boundary를 갱신합니다.","audit event를 남깁니다."]]],filename:"SessionRotation.java",
   code:String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class SessionRotation {
    record Session(String id,Map<String,String> data){}
    static Session login(Session old,String principal){Map<String,String> kept=new LinkedHashMap<>();String locale=old.data().get("locale");if(locale!=null)kept.put("locale",locale);kept.put("principal",principal);return new Session("S2",Map.copyOf(kept));}
    public static void main(String[] args){Session anonymous=new Session("S1",Map.of("locale","ko","untrusted","drop"));Session authenticated=login(anonymous,"user-7");System.out.println("oldId="+anonymous.id()+",locale="+anonymous.data().get("locale")+",untrusted="+anonymous.data().get("untrusted"));System.out.println("newId="+authenticated.id()+",locale="+authenticated.data().get("locale")+",principal="+authenticated.data().get("principal")+",untrusted="+authenticated.data().get("untrusted"));System.out.println("rotated="+!anonymous.id().equals(authenticated.id()));}
}`,
   output:"oldId=S1,locale=ko,untrusted=drop\nnewId=S2,locale=ko,principal=user-7,untrusted=null\nrotated=true",refs:["jakarta-request","owasp-session","servlet-spec"],
   diagnostics:[["login 전후 JSESSIONID가 같다.","authentication transition에서 rotation을 호출하지 않았습니다.",["Set-Cookie와 session id를 비교합니다.","login success path를 봅니다."],"login 성공 즉시 id를 rotate합니다.","pre/post login id integration test를 둡니다."],["새 session에 untrusted pre-login data가 모두 복사된다.","migration allowlist가 없습니다.",["copied attributes를 inventory합니다."],"locale 등 필요한 값만 allowlist migration합니다.","attribute migration test를 둡니다."]]},
  {id:"session-cookie-security-attributes",title:"session cookie의 Secure·HttpOnly·SameSite·Path를 조합합니다",lead:"cookie는 session id 운반 수단이므로 전송 경로, script access, cross-site context와 적용 범위를 최소화합니다.",
   explanations:["Secure는 HTTPS 연결에서만 cookie를 전송하게 하고 HttpOnly는 JavaScript document.cookie 접근을 막아 일부 XSS 탈취를 줄입니다.","SameSite는 cross-site request에서 cookie 전송을 제한해 CSRF 방어를 보강하지만 token/origin validation을 항상 대체하지 않습니다.","Path는 application context로 최소화하고 Domain을 넓게 설정해 sibling subdomains가 공유하지 않게 합니다.","SameSite=None은 Secure가 필요하며 OAuth/SSO callback 같은 cross-site 흐름을 test해야 합니다.","Max-Age/Expires가 없는 session cookie라도 server-side timeout과 invalidation이 최종 권위입니다."],
   terms:[["HttpOnly","browser script API가 cookie를 읽지 못하게 하는 attribute입니다.",["XSS 자체를 막지는 않습니다.","HTTP requests에는 자동 전송됩니다."]],["SameSite","site context에 따라 cookie 전송을 제한하는 attribute입니다.",["CSRF defense-in-depth입니다.","SSO flow와 tradeoff가 있습니다."]]],filename:"SessionCookiePolicy.java",
   code:String.raw`import java.util.ArrayList;
import java.util.List;

public class SessionCookiePolicy {
    record Cookie(boolean secure,boolean httpOnly,String sameSite,String path,boolean domainSet){}
    static List<String> validate(Cookie c){List<String> e=new ArrayList<>();if(!c.secure())e.add("Secure");if(!c.httpOnly())e.add("HttpOnly");if(!List.of("Lax","Strict","None").contains(c.sameSite()))e.add("SameSite");if(c.sameSite().equals("None")&&!c.secure())e.add("NoneRequiresSecure");if(!c.path().startsWith("/")||c.domainSet())e.add("Scope");return List.copyOf(e);}
    public static void main(String[] args){System.out.println(validate(new Cookie(true,true,"Lax","/school",false)));System.out.println(validate(new Cookie(false,false,"None","/",true)));}
}`,
   output:"[]\n[Secure, HttpOnly, NoneRequiresSecure, Scope]",refs:["rfc6265bis","owasp-session","owasp-csrf"],
   diagnostics:[["HTTP에서도 session cookie가 전송된다.","Secure attribute가 없습니다.",["Set-Cookie를 봅니다.","TLS termination policy를 봅니다."],"Secure를 설정하고 HTTPS-only/HSTS를 운영합니다.","production header test를 둡니다."],["SSO callback에서 session이 사라진다.","SameSite 정책이 cross-site callback과 맞지 않습니다.",["top-level navigation/method를 봅니다.","browser cookie diagnostics를 봅니다."],"flow에 맞는 최소 SameSite와 state/PKCE/CSRF 방어를 조합합니다.","실제 browser SSO tests를 둡니다."]]},
  {id:"session-compound-update-lost-race",title:"session attribute map의 thread safety와 compound operation atomicity를 구분합니다",lead:"같은 사용자의 parallel tabs/AJAX requests는 같은 session을 동시에 처리하므로 get→calculate→set이 lost update를 만들 수 있습니다.",
   explanations:["container가 session attribute map access를 보호해도 두 calls 사이의 business read-modify-write 전체가 atomic하다는 보장은 없습니다.","두 requests가 count0을 읽고 각각1을 저장하면 최종1이 되어 update 하나가 사라집니다.","session 전체 synchronized는 간단하지만 long I/O를 lock 안에서 하면 같은 user 요청이 줄줄이 막힙니다. 작은 atomic state abstraction을 씁니다.","cluster/distributed session에서는 JVM synchronized가 node 간 atomicity를 보장하지 않으므로 store-side CAS/transaction이 필요합니다.","deterministic latch fixture로 두 reads를 먼저 완료한 뒤 writes를 실행해 race를 재현합니다."],
   terms:[["lost update","동시 writers가 같은 old value를 바탕으로 써 한 update가 덮이는 race입니다.",["compound operation 문제입니다.","atomic increment/CAS로 고칩니다."]],["session serialization","한 session의 requests를 순차 처리하는 정책입니다.",["throughput tradeoff가 있습니다.","container마다 가정하지 않습니다."]]],filename:"SessionLostUpdate.java",
   code:String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class SessionLostUpdate {
    static int broken;
    public static void main(String[] args)throws Exception{
        CountDownLatch read=new CountDownLatch(2),write=new CountDownLatch(1);Thread[] threads=new Thread[2];
        for(int i=0;i<2;i++)threads[i]=new Thread(()->{int seen=broken;read.countDown();try{write.await();}catch(InterruptedException e){Thread.currentThread().interrupt();return;}broken=seen+1;});
        for(Thread t:threads)t.start();read.await();write.countDown();for(Thread t:threads)t.join();
        AtomicInteger fixed=new AtomicInteger();Thread a=new Thread(fixed::incrementAndGet),b=new Thread(fixed::incrementAndGet);a.start();b.start();a.join();b.join();
        System.out.println("broken="+broken);System.out.println("fixed="+fixed.get());
    }
}`,
   output:"broken=1\nfixed=2",refs:["jakarta-session","jls-happens-before","java-latch","java-atomic"],
   diagnostics:[["장바구니 수량 update 하나가 사라진다.","session get/put compound operation이 atomic하지 않습니다.",["같은 session concurrent requests를 trace합니다.","read/write interleaving을 재현합니다."],"owner lock, AtomicInteger/compute 또는 store CAS를 씁니다.","deterministic concurrency test를 둡니다."],["한 사용자 요청이 모두 느리다.","session lock 안에서 DB/network I/O를 수행합니다.",["lock hold time과 thread dump를 봅니다."],"작은 state transition만 lock하고 I/O를 밖으로 이동합니다.","lock latency metric을 둡니다."]]},
  {id:"application-scope-atomic-counter",title:"application scope shared state에는 atomic operation을 사용합니다",lead:"ServletContext attribute는 모든 users/requests가 공유하므로 mutable value와 check-then-act를 thread-safe abstraction으로 캡슐화합니다.",
   explanations:["application scope는 web application lifetime과 classloader에 연결되며 global cache/config/metrics 같은 shared state만 적합합니다.","Integer를 get해+1하고 set하는 pattern은 session보다 더 많은 threads에서 lost update가 납니다.","AtomicLong/LongAdder, ConcurrentHashMap.compute 또는 immutable snapshot swap처럼 operation 단위 atomicity를 선택합니다.","DB connection, request/user data, unbounded cache를 application attribute에 직접 저장하면 lifecycle·leak·tenant isolation 문제가 생깁니다.","multi-node deployment에서는 node-local application state가 전체 system global이 아니므로 source of truth와 aggregation 의미를 명시합니다."],
   terms:[["application scope","한 web application의 ServletContext와 같은 lifetime/visibility를 가진 shared scope입니다.",["모든 sessions가 봅니다.","node-local일 수 있습니다."]],["atomic operation","중간 state가 다른 threads에 분리되어 보이지 않는 하나의 update입니다.",["compound invariant를 보호합니다.","memory visibility도 고려합니다."]]],filename:"ApplicationCounter.java",
   code:String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicLong;

public class ApplicationCounter {
    public static void main(String[] args)throws Exception{AtomicLong visits=new AtomicLong();int workers=4,each=1000;CountDownLatch start=new CountDownLatch(1);Thread[] ts=new Thread[workers];for(int i=0;i<workers;i++)ts[i]=new Thread(()->{try{start.await();}catch(InterruptedException e){Thread.currentThread().interrupt();return;}for(int n=0;n<each;n++)visits.incrementAndGet();});for(Thread t:ts)t.start();start.countDown();for(Thread t:ts)t.join();System.out.println("expected="+(workers*each));System.out.println("actual="+visits.get());}
}`,
   output:"expected=4000\nactual=4000",refs:["jakarta-context","java-atomic","jls-happens-before"],
   diagnostics:[["방문자 수가 실제보다 작다.","Integer read-modify-set lost update입니다.",["concurrent requests와 update code를 봅니다."],"AtomicLong/LongAdder 또는 durable atomic counter를 씁니다.","parallel exact-count test를 둡니다."],["node를 늘리니 각 node count가 다르다.","application scope를 cluster-global로 오해했습니다.",["instance별 metrics를 비교합니다."],"global source/store 또는 aggregation을 사용합니다.","multi-node acceptance를 둡니다."]]},
  {id:"immutable-application-snapshot",title:"여러 config fields는 immutable snapshot 전체를 교체합니다",lead:"관련 값들을 각각 setAttribute하면 readers가 서로 다른 version의 torn configuration을 볼 수 있습니다.",
   explanations:["feature flag, endpoint, timeout처럼 함께 검증돼야 하는 값은 immutable record 하나에 묶습니다.","초기 snapshot은 startup에 validation한 뒤 publish하고 reload는 새 snapshot을 완성한 다음 AtomicReference 하나를 교체합니다.","reader는 request 시작에 snapshot reference를 한 번 읽어 같은 version을 끝까지 사용합니다.","mutable Map을 snapshot 안에 넣으면 final reference만 immutable일 뿐 contents는 바뀔 수 있으므로 defensive copy를 사용합니다.","reload 실패는 old known-good snapshot을 유지하고 version/last-error metric을 남깁니다."],
   terms:[["immutable snapshot","한 시점의 일관된 shared configuration value입니다.",["defensive immutable contents를 가집니다.","whole-swap합니다."]],["torn configuration","관련 fields를 서로 다른 version에서 읽은 일관성 없는 조합입니다.",["separate writes에서 생깁니다.","single snapshot으로 방지합니다."]]],filename:"ImmutableApplicationSnapshot.java",
   code:String.raw`import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

public class ImmutableApplicationSnapshot {
    record Config(int version,String endpoint,int timeoutMs,Map<String,Boolean> flags){Config{flags=Map.copyOf(flags);}}
    public static void main(String[] args){AtomicReference<Config> ref=new AtomicReference<>(new Config(1,"https://api-v1.example",1000,Map.of("search",false)));Config during=ref.get();ref.set(new Config(2,"https://api-v2.example",500,Map.of("search",true)));System.out.println("during="+during.version()+","+during.endpoint()+","+during.timeoutMs()+","+during.flags());Config next=ref.get();System.out.println("next="+next.version()+","+next.endpoint()+","+next.timeoutMs()+","+next.flags());}
}`,
   output:"during=1,https://api-v1.example,1000,{search=false}\nnext=2,https://api-v2.example,500,{search=true}",refs:["java-atomic-reference","java-record","java-map","jls-final-fields"],
   diagnostics:[["v2 endpoint에 v1 timeout이 적용된다.","config fields를 따로 갱신해 torn read가 났습니다.",["각 field version을 봅니다.","reload sequence를 봅니다."],"immutable snapshot을 single atomic reference로 교체합니다.","concurrent reload consistency test를 둡니다."],["snapshot Map이 몰래 바뀐다.","mutable input map을 그대로 보관했습니다.",["constructor defensive copy를 봅니다."],"Map.copyOf 등 deep-enough immutable copy를 합니다.","mutation rejection test를 둡니다."]]},
  {id:"session-retention-serialization-budget",title:"session state는 bounded·serializable·versionable data만 저장합니다",lead:"긴 lifetime과 replication/passivation은 한 object의 size, graph, class version과 secret retention 비용을 증폭합니다.",
   explanations:["session에 large entity graph를 저장하면 users×tabs×TTL만큼 heap/Redis/network 비용이 늘고 stale domain data가 됩니다.","cluster replication/passivation은 values가 serializable해야 할 수 있지만 Serializable 구현만으로 schema/version compatibility가 자동 해결되지는 않습니다.","DB connection, stream, executor, request/response, framework proxy 같은 live resource는 session에 저장하지 않습니다.","minimal principal id, locale, cart item ids처럼 작은 value를 저장하고 authoritative data는 service/DB에서 다시 조회합니다.","per-session serialized bytes, attribute count와 largest type을 metric/limit으로 관찰하고 PII retention 정책을 적용합니다."],
   terms:[["passivation","session state를 memory 밖 저장소로 옮겼다가 복원하는 과정입니다.",["serialization 가능성이 필요합니다.","lifecycle callbacks/compatibility를 고려합니다."]],["retention budget","session 하나와 전체에서 허용하는 size·count·TTL 상한입니다.",["heap/replication 비용을 제한합니다.","PII 최소화와 연결됩니다."]]],filename:"SessionSerializationBudget.java",
   code:String.raw`import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.List;

public class SessionSerializationBudget {
    record Principal(String userId,List<String> roles) implements Serializable {private static final long serialVersionUID=1L;Principal{roles=List.copyOf(roles);}}
    static int bytes(Serializable value)throws Exception{ByteArrayOutputStream out=new ByteArrayOutputStream();try(ObjectOutputStream objects=new ObjectOutputStream(out)){objects.writeObject(value);}return out.size();}
    public static void main(String[] args)throws Exception{Principal p=new Principal("user-7",List.of("LEARNER"));int size=bytes(p);System.out.println("serializable=true");System.out.println("under1024="+(size<1024));System.out.println("fields=userId,roles");}
}`,
   output:"serializable=true\nunder1024=true\nfields=userId,roles",refs:["jakarta-session","java-serialization","java-list","owasp-privacy"],
   diagnostics:[["failover 뒤 session restore가 실패한다.","non-serializable/proxy object 또는 incompatible class version이 있습니다.",["attribute type inventory와 serialization exception을 봅니다."],"small versioned value types만 저장합니다.","serialize/deserialize upgrade tests를 둡니다."],["session store memory가 계속 증가한다.","large object graph, long TTL 또는 unbounded attributes입니다.",["per-session bytes/count/TTL을 측정합니다."],"retention budget과 cleanup/invalidation을 적용합니다.","size limit/expiry metrics를 둡니다."]]},
  {id:"minimal-principal-authorization-freshness",title:"session에는 minimal principal을 두고 authorization은 server policy로 확인합니다",lead:"role 목록 전체나 canDelete boolean을 오래 cache하면 관리자 변경·계정 정지가 session TTL 동안 반영되지 않을 수 있습니다.",
   explanations:["authenticated principal은 stable user id, auth time, assurance/version 같은 최소 claims로 표현하고 password/token/민감 profile을 저장하지 않습니다.","authorization은 매 request resource/action/tenant context에서 server policy로 검사합니다. UI 숨김이나 session boolean만 믿지 않습니다.","roles/permissions를 session에 cache한다면 policy version, short TTL와 forced revocation strategy가 필요합니다.","account disable, password reset, role revoke 같은 security event가 active sessions에 언제 반영되는지 SLA를 정합니다.","principal logging은 opaque id/correlation만 사용하고 session id나 full PII를 출력하지 않습니다."],
   terms:[["authentication principal","누가 인증됐는지를 나타내는 최소 identity context입니다.",["authorization 결정 자체가 아닙니다.","secret을 담지 않습니다."]],["authorization freshness","policy 변경이 active session의 access 결정에 반영되는 최대 지연입니다.",["TTL/version/revocation으로 관리합니다.","민감 action은 더 엄격합니다."]]],filename:"MinimalPrincipal.java",
   code:String.raw`import java.util.Map;

public class MinimalPrincipal {
    record Principal(String userId,long policyVersion){}
    static boolean allowed(Principal p,String action,Map<String,Long> current){Long v=current.get(p.userId()+":"+action);return v!=null&&p.policyVersion()>=v;}
    public static void main(String[] args){Map<String,Long> policy=Map.of("u7:read",1L,"u7:delete",2L);Principal old=new Principal("u7",1);Principal fresh=new Principal("u7",2);System.out.println("old-read="+allowed(old,"read",policy));System.out.println("old-delete="+allowed(old,"delete",policy));System.out.println("fresh-delete="+allowed(fresh,"delete",policy));}
}`,
   output:"old-read=true\nold-delete=false\nfresh-delete=true",refs:["owasp-authz","owasp-session","java-record"],
   diagnostics:[["role revoke 뒤에도 삭제가 된다.","오래된 session permission cache를 신뢰합니다.",["policy version/TTL/revocation event를 봅니다."],"server-side current policy를 확인하거나 version mismatch에 refresh합니다.","mid-session revoke test를 둡니다."],["session/log에 password나 token이 남는다.","principal을 credential/profile dump로 사용했습니다.",["attribute inventory와 logs를 검색합니다."],"opaque user id와 최소 metadata만 저장합니다.","secret leakage scanner/test를 둡니다."]]},
  {id:"atomic-flash-session-consumption",title:"session flash를 scope race 없이 정확히 한 번 소비합니다",lead:"redirect 사이에서 request보다 오래, 일반 session state보다 짧게 사는 값은 id별 atomic remove와 TTL을 사용합니다.",
   explanations:["flash는 성공/실패 message와 form restore 같은 일회성 UX state이며 permanent session attribute가 아닙니다.","session map에서 get 후 remove하면 같은 session의 parallel GET 두 개가 모두 값을 볼 수 있습니다.","ConcurrentHashMap.remove(key)는 한 operation으로 값을 반환해 JVM 내 atomic consume을 만들지만 distributed store에서는 store command semantics를 확인합니다.","flash id는 unpredictable하고 session/principal에 bind하며 URL에는 message/secret 대신 opaque id만 둡니다.","TTL·maximum entries·value length와 no-cache/referrer 정책을 결합해 retention과 leakage를 제한합니다."],
   terms:[["one-time scope","정확히 다음 소비 operation까지 유지되는 custom lifetime입니다.",["표준 네 scopes의 조합으로 구현합니다.","atomic consume이 필요합니다."]],["opaque handle","내용을 드러내지 않고 server-side state를 가리키는 추측 어려운 id입니다.",["owner에 bind합니다.","TTL을 둡니다."]]],filename:"AtomicSessionFlash.java",
   code:String.raw`import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicSessionFlash {
    public static void main(String[] args)throws Exception{ConcurrentHashMap<String,String> flash=new ConcurrentHashMap<>();flash.put("f1","saved");CountDownLatch start=new CountDownLatch(1);AtomicInteger winners=new AtomicInteger();Thread[] ts={new Thread(()->consume(flash,start,winners)),new Thread(()->consume(flash,start,winners))};for(Thread t:ts)t.start();start.countDown();for(Thread t:ts)t.join();System.out.println("winners="+winners.get());System.out.println("remaining="+flash.size());}
    static void consume(ConcurrentHashMap<String,String> flash,CountDownLatch start,AtomicInteger winners){try{start.await();}catch(InterruptedException e){Thread.currentThread().interrupt();return;}if(flash.remove("f1")!=null)winners.incrementAndGet();}
}`,
   output:"winners=1\nremaining=0",refs:["java-concurrent-map","java-latch","java-atomic","jakarta-session"],
   diagnostics:[["성공 message가 두 tabs에 모두 보인다.","flash get/remove가 분리되어 race가 났습니다.",["동시 consume interleaving을 봅니다."],"atomic remove-and-return을 사용합니다.","two-consumer test를 둡니다."],["flash가 session에 계속 쌓인다.","consume/TTL/maximum cleanup이 없습니다.",["entry age/count/size를 봅니다."],"bounded store와 TTL cleanup을 적용합니다.","expiry/limit metrics를 둡니다."]]},
];
session.chapters.push(...seeds.map(makeChapter));

session.sources.push(
 {id:"source-inner-jsp",repository:"local jspstudy snapshot",path:"jspstudy/src/main/webapp/day02/ex03_InnerObject.jsp",usedFor:["JSP declaration field","scriptlet locals"],evidence:"inventory JSP1입니다."},
 {id:"source-attribute-jsp",repository:"local jspstudy snapshot",path:"jspstudy/src/main/webapp/day02/ex07_Attribute.jsp",usedFor:["scope set/get","EL lookup"],evidence:"inventory JSP2입니다."},
 {id:"source-ex09",repository:"local jspstudy snapshot",path:"jspstudy/src/main/java/org/study/jspstudy/day01/Ex09.java",usedFor:["compile evidence","inventory mismatch"],evidence:"inventory Java1입니다."},
 {id:"jdk-javac",repository:"Java SE 21",path:"javac",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html",usedFor:["compile audit"],evidence:"compiler primary documentation입니다."},
 {id:"servlet-spec",repository:"Jakarta Servlet",path:"Servlet 6.1 Specification",publicUrl:"https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1",usedFor:["request/session/application lifecycle","concurrency"],evidence:"Servlet primary specification입니다."},
 {id:"jsp-spec",repository:"Jakarta Pages",path:"Jakarta Server Pages 4.0 Specification",publicUrl:"https://jakarta.ee/specifications/pages/4.0/jakarta-server-pages-spec-4.0",usedFor:["JSP translation","scopes","EL"],evidence:"JSP primary specification입니다."},
 {id:"jakarta-el",repository:"Jakarta Expression Language",path:"EL 6.0 Specification",publicUrl:"https://jakarta.ee/specifications/expression-language/6.0/",usedFor:["implicit/scoped lookup"],evidence:"EL primary specification입니다."},
 {id:"jakarta-request",repository:"Jakarta Servlet 6.1 API",path:"HttpServletRequest",publicUrl:"https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletrequest",usedFor:["request attributes","session id rotation"],evidence:"request primary API입니다."},
 {id:"jakarta-dispatcher",repository:"Jakarta Servlet 6.1 API",path:"RequestDispatcher",publicUrl:"https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/requestdispatcher",usedFor:["forward request lifetime"],evidence:"dispatch primary API입니다."},
 {id:"jakarta-session",repository:"Jakarta Servlet 6.1 API",path:"HttpSession",publicUrl:"https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpsession",usedFor:["session lifecycle","attributes","flash"],evidence:"session primary API입니다."},
 {id:"jakarta-context",repository:"Jakarta Servlet 6.1 API",path:"ServletContext",publicUrl:"https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/servletcontext",usedFor:["application attributes"],evidence:"application context primary API입니다."},
 {id:"rfc6265bis",repository:"IETF",path:"Cookies draft RFC6265bis",publicUrl:"https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis",usedFor:["Secure HttpOnly SameSite Path"],evidence:"cookie standards source입니다."},
 {id:"jls-happens-before",repository:"Java SE 21 JLS",path:"17.4.5 Happens-before",publicUrl:"https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5",usedFor:["concurrent visibility"],evidence:"Java memory model primary specification입니다."},
 {id:"jls-final-fields",repository:"Java SE 21 JLS",path:"17.5 final Field Semantics",publicUrl:"https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5",usedFor:["immutable snapshot"],evidence:"final field semantics입니다."},
 {id:"java-map",repository:"Java SE 21 API",path:"Map",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html",usedFor:["scope/snapshot"],evidence:"collection API입니다."},
 {id:"java-list",repository:"Java SE 21 API",path:"List",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html",usedFor:["serializable roles"],evidence:"list API입니다."},
 {id:"java-record",repository:"Java SE 21 JLS",path:"8.10 Record Classes",publicUrl:"https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10",usedFor:["immutable values","principal"],evidence:"record specification입니다."},
 {id:"java-atomic",repository:"Java SE 21 API",path:"AtomicInteger and AtomicLong",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/package-summary.html",usedFor:["atomic counters"],evidence:"atomic API입니다."},
 {id:"java-atomic-reference",repository:"Java SE 21 API",path:"AtomicReference",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html",usedFor:["snapshot swap"],evidence:"atomic reference API입니다."},
 {id:"java-latch",repository:"Java SE 21 API",path:"CountDownLatch",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html",usedFor:["deterministic races"],evidence:"latch API입니다."},
 {id:"java-concurrent-map",repository:"Java SE 21 API",path:"ConcurrentHashMap",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html",usedFor:["atomic flash remove"],evidence:"concurrent map API입니다."},
 {id:"java-serialization",repository:"Java SE 21 Specification",path:"Object Serialization",publicUrl:"https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/",usedFor:["session passivation fixture"],evidence:"serialization primary specification입니다."},
 {id:"owasp-session",repository:"OWASP",path:"Session Management Cheat Sheet",publicUrl:"https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",usedFor:["fixation","cookies","logout"],evidence:"session security practice입니다."},
 {id:"owasp-csrf",repository:"OWASP",path:"CSRF Prevention Cheat Sheet",publicUrl:"https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",usedFor:["SameSite limits"],evidence:"CSRF practice입니다."},
 {id:"owasp-authz",repository:"OWASP",path:"Authorization Cheat Sheet",publicUrl:"https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",usedFor:["server-side authorization","freshness"],evidence:"authorization practice입니다."},
 {id:"owasp-privacy",repository:"OWASP",path:"User Privacy Protection Cheat Sheet",publicUrl:"https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html",usedFor:["PII retention"],evidence:"privacy practice입니다."},
);

const qa:Array<[string,string]>=[
 ["네 기본 scopes의 짧은 순서는 무엇인가요?","page, request, session, application입니다."],["implicit ${name}은 어떻게 찾나요?","page→request→session→application에서 처음 발견한 값을 선택합니다."],["shadowing이 다른 scope 값을 삭제하나요?","아닙니다. lookup 결과만 가리고 explicit scope로 각각 접근할 수 있습니다."],["중요한 security state에 implicit lookup을 피하는 이유는?","동일 name collision이 잘못된 owner의 값을 선택할 수 있기 때문입니다."],["scope 선택 원칙은 무엇인가요?","필요한 readers와 lifetime을 만족하는 가장 짧고 좁은 scope입니다."],
 ["request attribute는 forward에 유지되나요?","네. 같은 request dispatch chain이므로 유지됩니다."],["redirect에는 왜 사라지나요?","client가 새 request를 만들기 때문입니다."],["async에서 request lifetime은 어떻게 되나요?","async completion/error/timeout까지 연장될 수 있습니다."],["JSP declaration variable은 local인가요?","아닙니다. generated Servlet field가 될 수 있습니다."],["원본 result field가 위험한 이유는?","동시 requests가 같은 mutable instance field를 공유하기 때문입니다."],
 ["HttpSession id가 user identity인가요?","아닙니다. session state locator이며 principal과 구분합니다."],["getSession(false)는 언제 쓰나요?","새 session을 만들지 않고 기존 session만 필요할 때 씁니다."],["browser close가 server session을 즉시 지우나요?","보장되지 않습니다. timeout/invalidation이 필요합니다."],["logout의 핵심 session 동작은?","session invalidate와 관련 token/cookie cleanup입니다."],["invalidate 뒤 old reference를 써도 되나요?","안 됩니다. invalidated session access는 유효하지 않습니다."],
 ["session fixation이란?","공격자가 아는 인증 전 id가 victim login 뒤에도 유지되게 하는 공격입니다."],["login 성공 뒤 무엇을 rotate하나요?","session id를 rotate하고 old id를 폐기합니다."],["pre-login attributes를 모두 복사해도 되나요?","아닙니다. 필요한 값만 allowlist migration합니다."],["Secure cookie 역할은?","HTTPS에서만 cookie를 전송하게 합니다."],["HttpOnly가 XSS를 막나요?","XSS 자체는 막지 않고 script의 cookie read를 제한합니다."],
 ["SameSite가 CSRF token을 완전히 대체하나요?","아닙니다. flow와 browser 조건을 고려한 defense-in-depth입니다."],["Cookie Path를 왜 좁히나요?","cookie가 불필요한 application paths로 전송되는 범위를 줄이기 위해서입니다."],["session map thread-safe면 compound update도 안전한가요?","아닙니다. get→계산→set 전체는 별도 atomicity가 필요합니다."],["lost update란?","동시 writers가 같은 old value를 읽어 한 update가 덮이는 race입니다."],["JVM synchronized가 cluster에서도 충분한가요?","아닙니다. node 간 store-side CAS/transaction이 필요합니다."],
 ["application scope는 누가 공유하나요?","같은 web application의 모든 sessions/requests가 공유합니다."],["application scope가 cluster-global인가요?","보통 node/classloader local일 수 있어 명시해야 합니다."],["global counter에는 무엇을 쓰나요?","AtomicLong/LongAdder 또는 durable store atomic operation을 씁니다."],["torn config란?","관련 fields를 서로 다른 version에서 읽은 일관성 없는 조합입니다."],["config reload를 어떻게 publish하나요?","검증된 immutable snapshot 전체를 atomic swap합니다."],
 ["final Map field면 contents도 immutable인가요?","아닙니다. defensive immutable copy가 필요합니다."],["session에 DB connection을 저장해도 되나요?","안 됩니다. live resource·lifecycle·serialization 문제가 있습니다."],["session에는 어떤 principal data가 적합한가요?","opaque user id와 최소 bounded/versioned metadata입니다."],["Serializable이면 version migration이 자동인가요?","아닙니다. schema/serialVersionUID/upgrade compatibility를 test해야 합니다."],["authorization boolean을 session에 오래 저장하면?","role revoke/account disable 반영이 TTL 동안 지연될 수 있습니다."],
 ["authorization freshness란?","policy 변경이 active session decision에 반영되는 최대 지연입니다."],["flash가 일반 session state와 다른 점은?","다음 request에서 한 번 소비하는 짧은 custom lifetime입니다."],["flash get 후 remove의 문제는?","동시 consumers가 모두 같은 값을 읽을 수 있습니다."],["원본 Ex09가 scope example인가요?","아닙니다. active scope attribute API가 없는 inventory mismatch입니다."],["실제 container에서 무엇을 재검증하나요?","EL lookup, session id/cookies, invalidation, concurrent requests와 serialization behavior입니다."]];
session.reviewQuestions.push(...qa.map(([question,answer])=>({question,answer})));
session.completionChecklist.push(
 "원본 JSP2를 읽었다.","원본 Ex09를 읽었다.","hashes3을 검증했다.","Ex09 warning1을 확인했다.","setAttribute5를 확인했다.","getAttribute4를 확인했다.","EL expressions5를 확인했다.","JSP expressions13을 확인했다.","declaration block1을 확인했다.","Ex09 scope mismatch를 기록했다.",
 "page/request/session/application lifetime을 비교한다.","implicit lookup order를 설명한다.","explicit scoped EL을 사용한다.","scope key collision을 피한다.","least lifetime 원칙을 적용한다.","view model을 request에 둔다.","forward request attribute 보존을 안다.","redirect 새 request를 안다.","async completion cleanup을 둔다.","JSP declaration mutable field를 제거한다.",
 "scriptlet local과 Servlet field를 구분한다.","session id와 principal을 구분한다.","getSession(false)를 적절히 쓴다.","inactive timeout을 설정한다.","logout에 invalidate한다.","old session replay를 test한다.","login에 session id를 rotate한다.","old id를 폐기한다.","pre-login state를 allowlist migration한다.","URL session id 노출을 피한다.",
 "Secure cookie를 설정한다.","HttpOnly cookie를 설정한다.","SameSite flow를 test한다.","Cookie Path를 최소화한다.","Domain을 불필요하게 넓히지 않는다.","CSRF token/origin 방어를 유지한다.","same-session concurrent requests를 test한다.","compound update를 atomic하게 한다.","session lock 안 long I/O를 피한다.","cluster store atomicity를 확인한다.",
 "application counter를 atomic하게 한다.","node-local/global 의미를 구분한다.","immutable config snapshot을 쓴다.","snapshot contents를 defensive copy한다.","reload 실패 시 old config를 유지한다.","session attribute count/size/TTL을 제한한다.","live resource를 session에 넣지 않는다.","serialization round-trip을 test한다.","class version migration을 test한다.","PII retention을 최소화한다.",
 "minimal principal만 저장한다.","password/token을 scope에 저장하지 않는다.","authorization을 server에서 재검증한다.","policy version/TTL/revocation을 둔다.","flash id를 opaque하게 만든다.","flash consume을 atomic하게 한다.","flash TTL/size를 제한한다.","two-tab race를 test한다.","multi-node session behavior를 test한다.","real JSP/Servlet container에서 scopes를 재검증한다."
);

export default session;
