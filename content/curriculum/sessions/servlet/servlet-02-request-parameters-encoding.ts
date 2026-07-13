import type { DetailedSession, DetailedChapter } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory $classes|Out-Null;$c=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$c.Count-ne0){throw(\"javac failed or warned: \"+($c-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}'";

type ChapterSeed = {
  id: string; title: string; lead: string; explanations: string[];
  terms: Array<[string, string, string[]]>; filename: string; purpose: string;
  code: string; output: string; refs: string[];
  diagnostics: Array<[string, string, string[], string, string]>;
  notes?: string[];
};

const walkthroughFor = (code: string) => {
  const last = code.split(/\r?\n/).length;
  const first = Math.ceil(last / 3);
  const second = Math.ceil((last * 2) / 3);
  return [
    { lines: `1-${first}`, explanation: "입력 표현과 불변식을 선언하고, null·중복·encoding 같은 경계값을 명시적으로 모델링합니다." },
    { lines: `${first + 1}-${second}`, explanation: "parse·normalize·validate를 순서대로 적용하며 실패를 값 또는 제한된 예외로 분류합니다." },
    { lines: `${second + 1}-${last}`, explanation: "결정적 사례를 실행해 status가 아닌 domain 결과와 exact output을 검증합니다." },
  ];
};

const makeChapter = (seed: ChapterSeed): DetailedChapter => ({
  id: seed.id,
  title: seed.title,
  lead: seed.lead,
  explanations: seed.explanations,
  concepts: seed.terms.map(([term, definition, detail]) => ({ term, definition, detail })),
  codeExamples: [{
    id: `java-${seed.id}`,
    title: seed.title,
    language: "java",
    filename: seed.filename,
    purpose: seed.purpose,
    code: seed.code,
    walkthrough: walkthroughFor(seed.code),
    run: { environment: ["OpenJDK 21", "PowerShell 7+", "container/network 불필요"], command: isolatedJavaRun(seed.filename, seed.filename.replace(/\.java$/, "")) },
    output: { value: seed.output, explanation: ["출력은 고정 입력에서 exact합니다.", "Servlet container가 필요한 원본 behavior와 분리된 maintained JDK-only fixture입니다."] },
    experiments: [
      { change: "입력 순서와 중복 개수를 바꿉니다.", prediction: "정의한 multimap·limit 정책에 따라 결과가 달라집니다.", result: "first-value 암묵 규칙 대신 정책을 test로 고정합니다." },
      { change: "한글·공백·빈 문자열을 넣습니다.", prediction: "decode와 presence 분류가 서로 다른 단계에서 관찰됩니다.", result: "문자열 하나로 모든 상태를 뭉개지 않습니다." },
      { change: "허용 범위를 벗어난 값을 넣습니다.", prediction: "exception stack 대신 field별 validation failure가 생깁니다.", result: "client가 수정 가능한 오류와 서버 오류를 구분합니다." },
    ],
    sourceRefs: seed.refs,
  }],
  diagnostics: seed.diagnostics.map(([symptom, likelyCause, checks, fix, prevention]) => ({ symptom, likelyCause, checks, fix, prevention })),
  expertNotes: seed.notes,
});

const session: DetailedSession = {
  schemaVersion: 2,
  inventoryIds: ["servlet-02-request-parameters-encoding"],
  slug: "servlet-02-request-parameters-encoding",
  courseId: "servlet-jsp",
  moduleId: "servlet-http-lifecycle",
  order: 2,
  title: "Servlet 요청 파라미터·인코딩·검증",
  subtitle: "String/String[] 수집에서 form decoding, absent/blank, numeric·allowlist 검증, Unicode 정규화, 출력 encoding과 input budget까지 하나의 경계로 완성합니다.",
  level: "기초",
  estimatedMinutes: 780,
  coreQuestion: "신뢰할 수 없는 HTTP 파라미터를 손실 없이 수집한 뒤 어떤 순서로 decode·canonicalize·validate·escape해야 안전한 typed input이 될까요?",
  summary: "원본 Ex04~Ex07 네 Servlet과 compile에 필요한 HelloServlet closure를 직접 hash·JDK21/Servlet API compile합니다. inventory4는 missing serialVersionUID warning4이고, getParameter7·getParameterValues2·request/response setCharacterEncoding8을 확인합니다. Ex04/05는 null과 raw HTML 삽입, Ex06은 finite/range/default-op 검증 누락, Ex07은 선택이 없을 때 null 배열을 순회해 NPE가 나는 위험이 있습니다. 이후 10개의 JDK-only fixture가 multimap, form percent decoding, query/body source, absent/blank, checkbox allowlist, 계산기 typed validation, Unicode normalization, HTML text encoding, structured errors와 resource budget을 warning0·exact output으로 검증합니다.",
  objectives: [
    "HTTP parameter를 이름에서 여러 값으로 가는 ordered multimap으로 모델링한다.",
    "application/x-www-form-urlencoded의 plus와 percent bytes를 UTF-8로 decode한다.",
    "query와 POST body의 전송 위치가 보안·logging·cache 의미를 바꾸는 이유를 설명한다.",
    "absent, present-empty, blank, malformed와 valid를 구분한다.",
    "checkbox와 enum-like 값에 null-safe allowlist·중복 정책을 적용한다.",
    "숫자를 finite·range·operator 정책까지 검증하고 field 오류를 축적한다.",
    "Unicode normalization과 control/length 정책을 업무 identifier에 제한해 적용한다.",
    "validation과 context-aware output encoding을 분리하고 input budget을 둔다.",
  ],
  prerequisites: [
    { title: "Servlet 수명주기와 응답", reason: "request별 local state와 charset/commit 경계를 먼저 알아야 합니다.", sessionSlug: "servlet-01-mapping-lifecycle-response" },
    { title: "HTML form과 HTTP 요청", reason: "successful controls가 name/value pairs를 만드는 출발점입니다.", sessionSlug: "html-07-form-http-request" },
  ],
  keywords: ["getParameter", "getParameterValues", "parameter map", "form-urlencoded", "percent decoding", "UTF-8", "absent", "blank", "validation", "allowlist", "NaN", "Infinity", "Unicode normalization", "HTML escaping", "parameter pollution", "input budget"],
  chapters: [],
  lab: {
    title: "안전한 profile·calculator 요청 binder",
    scenario: "이름·나이·취미·웹 기술·두 피연산자·연산자를 받는 endpoint의 입력 경계를 작성합니다.",
    setup: ["ordered parameter multimap과 UTF-8 encoded form fixtures를 준비합니다.", "missing, empty, blank, duplicate, malformed percent, huge count/value와 malicious HTML 사례를 둡니다."],
    steps: ["raw query/body와 media type을 분리합니다.", "body charset을 parameter access 전에 확정합니다.", "이름별 모든 값을 보존합니다.", "presence를 분류하고 Unicode·length policy를 적용합니다.", "choice/operator allowlist와 numeric finite/range를 검사합니다.", "field 오류를 모두 축적해400 model을 만듭니다.", "HTML text renderer에서만 escape합니다.", "parameter count·values per name·decoded bytes budget을 검증합니다."],
    expectedResult: ["valid UTF-8 한글이 손상되지 않습니다.", "선택 없음은 NPE가 아니라 empty collection 또는 명시적 missing 오류입니다.", "NaN·Infinity·unknown operator와 duplicate singleton이 거부됩니다.", "악성 HTML은 data로 보이고 budget 초과는 body render 전에 종료됩니다."],
    cleanup: ["owned temp만 삭제합니다.", "raw secrets가 log fixture에 남지 않았는지 확인합니다."],
    extensions: ["Bean Validation DTO와 같은 정책으로 재구현합니다.", "multipart와 JSON media type binder를 별도 경계로 추가합니다.", "container integration에서 query/body decoding 설정을 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "checkbox 값을 null-safe allowlist로 bind하세요.", requirements: ["missing을 empty list로 정의합니다.", "unknown 값을 거부합니다.", "duplicate 정책을 정합니다.", "입력 순서를 보존합니다."], hints: ["getParameterValues는 값이 없으면 null일 수 있습니다."], expectedOutcome: "선택 없음·정상·변조 사례 exact test가 통과합니다.", solutionOutline: ["nullable array를 즉시 immutable list로 바꾼 뒤 validate합니다."] },
    { difficulty: "응용", prompt: "Ex06 계산기를 typed validator로 재설계하세요.", requirements: ["missing/blank/malformed를 구분합니다.", "Double.isFinite를 확인합니다.", "range와 divide-by-zero를 검사합니다.", "operator allowlist와 default rejection을 둡니다.", "field errors를 축적합니다."], hints: ["parse 성공은 domain-valid와 다릅니다."], expectedOutcome: "잘못된 입력이 result0이나500으로 위장되지 않습니다.", solutionOutline: ["decode→presence→parse→domain validate→compute 순서를 둡니다."] },
    { difficulty: "설계", prompt: "public form endpoint input-budget ADR을 작성하세요.", requirements: ["raw request bytes, parameter names, values per name, decoded length limits를 정합니다.", "proxy/container/application limit 관계를 설명합니다.", "Unicode normalization 대상과 비대상을 구분합니다.", "PII/credential log redaction을 포함합니다.", "413/400/422 정책을 선택합니다."], hints: ["여러 계층에서 가장 작은 limit가 실제 경계가 됩니다."], expectedOutcome: "운영·보안·client error 계약이 포함된 입력 경계 문서가 완성됩니다.", solutionOutline: ["transport budget과 domain validation을 분리합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["servlet-03-forward-redirect-prg"],
  sources: [],
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: [
    "inventory4와 unused import 해석에 필요한 HelloServlet closure1을 직접 읽고 hash·compile했습니다.",
    "container decoding은 실행하지 않았습니다. JDK-only fixtures는 유지보수 가능한 정책 모델이며 실제 connector/form configuration은 integration test 대상입니다.",
    "원본 raw HTML 출력·null 배열·calculator default/finite 문제를 숨기지 않고 현대 chapters에서 교정합니다.",
  ] },
};

const audit: DetailedChapter = {
  id: "original-servlet02-inventory4-closure-audit",
  title: "원본 Ex04~Ex07과 HelloServlet compile closure를 손실 없이 감사합니다",
  lead: "unused import도 compiler symbol resolution에는 필요하므로 inventory4와 closure1을 구분해 hash·warning·active-code shape를 검증합니다.",
  explanations: [
    "Ex04와 Ex05는 username/userage를 getParameter로 읽고 그대로 HTML에 연결합니다. missing은 Java null 문자열로 보일 수 있고 사용자 text가 markup으로 해석될 수 있습니다.",
    "Ex06은 s1/s2/op를 읽어 Double.parseDouble하고 네 연산을 switch합니다. parse 성공 뒤 NaN·Infinity·range를 검사하지 않으며 unknown op에는 default가 없어 result0을 정상처럼 출력합니다.",
    "Ex07은 hobby/web을 getParameterValues로 받은 뒤 null check 없이 enhanced-for합니다. 해당 name이 없으면 API가 null을 반환하므로 NPE가 납니다.",
    "네 파일은 요청과 응답 모두 UTF-8을 설정하지만 parameter access 전에 request encoding을 호출해야 body decoding에 의미가 있습니다. query decoding은 connector 설정도 확인해야 합니다.",
    "HelloServlet import는 source에서 사용되지 않지만 unresolved import는 compile error이므로 closure로 복사·compile합니다. inventory warning4와 closure warning1을 섞지 않습니다.",
    "audit은 comments를 제거한 active source에서 mapping4, getParameter7, getParameterValues2, setCharacterEncoding8, switch1/case4를 검증하고 container/listener/network를 시작하지 않습니다.",
  ],
  concepts: [
    { term: "compile closure", definition: "선택한 source를 compiler가 해석하는 데 필요한 직접 symbol 집합입니다.", detail: ["inventory와 별도 계수합니다.", "unused import도 resolution이 필요합니다."] },
    { term: "parameter multimap", definition: "한 name이 0개 이상의 ordered String values에 연결되는 요청 모델입니다.", detail: ["single getter는 정보를 잃을 수 있습니다.", "missing과 empty value는 다릅니다."] },
    { term: "decode-before-read", definition: "body parameter를 처음 materialize하기 전에 character encoding을 확정하는 순서 계약입니다.", detail: ["늦은 설정은 이미 parse된 값을 복구하지 못합니다.", "query와 body 정책을 구분합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-servlet02-audit",
    title: "inventory4·closure1 hash, warning과 shape를 검증합니다",
    language: "powershell",
    filename: "verify-original-servlet02.ps1",
    purpose: "원본을 수정하거나 container를 실행하지 않고 compiler/source evidence를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot,[Parameter(Mandatory)][string]$ServletApiJar)
$ErrorActionPreference='Stop';$names=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS');$saved=@{}
foreach($n in $names){$i=Get-Item ("Env:"+$n)-ErrorAction SilentlyContinue;$saved[$n]=@{Exists=$null-ne$i;Value=if($i){$i.Value}else{$null}};Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("servlet02 audit "+[Guid]::NewGuid().ToString('N'));$owned=$false;$failure=$null
function Strip([string]$s){return [regex]::Replace(([regex]::Replace($s,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
try{
  if(-not(Test-Path -LiteralPath $ServletApiJar -PathType Leaf)){throw 'servlet api jar missing'}
  New-Item -ItemType Directory -Path $root|Out-Null;$owned=$true
  $inventory=@('src/main/java/org/study/jspstudy/day01/Ex04.java','src/main/java/org/study/jspstudy/day01/Ex05.java','src/main/java/org/study/jspstudy/day01/Ex06.java','src/main/java/org/study/jspstudy/day01/Ex07.java')
  $closure='src/main/java/org/study/jspstudy/HelloServlet.java';$all=@($closure)+$inventory;$copied=@{}
  foreach($rel in $all){$src=Get-Item -LiteralPath (Join-Path $SourceRoot $rel);$dst=Join-Path $root $rel;New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($dst))-Force|Out-Null;[IO.File]::Copy($src.FullName,$dst);if((Get-FileHash $src.FullName -Algorithm SHA256).Hash-cne(Get-FileHash $dst -Algorithm SHA256).Hash){throw 'hash drift'};$copied[$rel]=$dst}
  $classes=Join-Path $root 'classes';New-Item -ItemType Directory $classes|Out-Null;$cp=$ServletApiJar+[IO.Path]::PathSeparator+$classes
  $common=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics')
  $c1=@(& javac @common -cp $ServletApiJar -d $classes $copied[$closure] 2>&1);if($LASTEXITCODE-ne0){throw 'closure compile failed'}
  if(@($c1|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count-ne1-or$c1[-1]-notmatch'1 warning'){throw 'closure warning drift'}
  $c2=@(& javac @common -cp $cp -d $classes @($inventory|ForEach-Object{$copied[$_]}) 2>&1);if($LASTEXITCODE-ne0){throw 'inventory compile failed'}
  if(@($c2|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count-ne4-or$c2[-1]-notmatch'4 warnings'){throw 'inventory warning drift'}
  $joined=(@($inventory|ForEach-Object{Strip([IO.File]::ReadAllText($copied[$_]))}))-join[Environment]::NewLine
  $shape=@{mapping=([regex]::Matches($joined,'@WebServlet\s*\(')).Count;servlet=([regex]::Matches($joined,'extends\s+HttpServlet\b')).Count;init=([regex]::Matches($joined,'\bvoid\s+init\s*\(')).Count;doGet=([regex]::Matches($joined,'\bvoid\s+doGet\s*\(')).Count;doPost=([regex]::Matches($joined,'\bvoid\s+doPost\s*\(')).Count;writer=([regex]::Matches($joined,'\.getWriter\s*\(')).Count;contentType=([regex]::Matches($joined,'\.setContentType\s*\(')).Count;encoding=([regex]::Matches($joined,'\.setCharacterEncoding\s*\(')).Count;parameter=([regex]::Matches($joined,'\.getParameter\s*\(')).Count;values=([regex]::Matches($joined,'\.getParameterValues\s*\(')).Count;switch=([regex]::Matches($joined,'\bswitch\s*\(')).Count;cases=([regex]::Matches($joined,'\bcase\s+')).Count;fields=([regex]::Matches($joined,'\bprivate\s+String\s+\w+\s*;')).Count;parseDouble=([regex]::Matches($joined,'Double\.parseDouble\s*\(')).Count;loops=([regex]::Matches($joined,'\bfor\s*\(')).Count}
  if($shape.mapping-ne4-or$shape.servlet-ne4-or$shape.init-ne4-or$shape.doGet-ne4-or$shape.doPost-ne4-or$shape.writer-ne4-or$shape.contentType-ne4-or$shape.encoding-ne8-or$shape.parameter-ne7-or$shape.values-ne2-or$shape.switch-ne1-or$shape.cases-ne4-or$shape.fields-ne4-or$shape.parseDouble-ne2-or$shape.loops-ne2){throw ('shape drift '+($shape|ConvertTo-Json -Compress))}
  'files=inventory4+closure1,hashes=5|compile=closureWarning1+inventoryWarnings4,missingSVUID=5'
  'shape=mapping4,servlet4,init4,doGet4,doPost4,writer4,contentType4,encoding8,parameter7,values2,switch1,cases4,fields4,parseDouble2,loops2'
  'privacy=container:not-run|network:none|original:read-only|fixture:owned-temp'
}catch{$failure=$_.Exception}finally{foreach($n in $names){if($saved[$n].Exists){Set-Item ("Env:"+$n) $saved[$n].Value}else{Remove-Item ("Env:"+$n)-ErrorAction SilentlyContinue}};if($owned){$resolved=[IO.Path]::GetFullPath($root);if([IO.Path]::GetDirectoryName($resolved)-cne$base){throw 'unsafe cleanup'};Remove-Item -LiteralPath $resolved -Recurse -Force};if($failure){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($failure).Throw()}}`,
    walkthrough: [
      { lines: "1-8", explanation: "launcher option을 snapshot/제거하고 space-safe owned temp를 만듭니다." },
      { lines: "9-14", explanation: "inventory4와 closure1을 package path로 복사해 SHA-256 동일성을 검증합니다." },
      { lines: "15-20", explanation: "closure warning1과 inventory warning4를 JDK21·ServletAPI에서 별도로 검증합니다." },
      { lines: "21-24", explanation: "comments 밖 parameter·encoding·switch·loop shape를 정확히 셉니다." },
      { lines: "25-end", explanation: "container 미실행 경계를 출력하고 environment와 direct-child temp만 복원합니다." },
    ],
    run: { environment: ["PowerShell 7+", "OpenJDK 21", "Jakarta Servlet API 6.1 jar", "jspstudy project root"], command: "pwsh -NoProfile -File verify-original-servlet02.ps1 -SourceRoot <jspstudy-root> -ServletApiJar <servlet-api.jar>" },
    output: { value: "files=inventory4+closure1,hashes=5|compile=closureWarning1+inventoryWarnings4,missingSVUID=5\nshape=mapping4,servlet4,init4,doGet4,doPost4,writer4,contentType4,encoding8,parameter7,values2,switch1,cases4,fields4,parseDouble2,loops2\nprivacy=container:not-run|network:none|original:read-only|fixture:owned-temp", explanation: ["inventory와 closure evidence가 분리됩니다.", "warning을 숨기지 않습니다.", "실제 HTTP listener는 열지 않습니다."] },
    experiments: [
      { change: "Ex07을 checkbox name 없이 호출합니다.", prediction: "원본 container 실행에서는 null enhanced-for로 NPE가 납니다.", result: "modern binder는 empty list 정책을 씁니다." },
      { change: "Ex06 op에 %를 보냅니다.", prediction: "원본은 default가 없어 result0을 정상 출력합니다.", result: "unknown operator를400 validation error로 거부해야 합니다." },
      { change: "username에 <img>를 보냅니다.", prediction: "원본 문자열 연결은 HTML markup을 만듭니다.", result: "renderer에서 context-aware encoding을 적용해야 합니다." },
    ],
    sourceRefs: ["source-ex04", "source-ex05", "source-ex06", "source-ex07", "source-hello-closure", "jakarta-request", "jdk-javac"],
  }],
  diagnostics: [
    { symptom: "Ex07에서 선택을 하나도 하지 않으면500이 난다.", likelyCause: "getParameterValues가 null인데 enhanced-for가 즉시 순회합니다.", checks: ["raw request에 hobby/web name이 있는지 봅니다.", "null 반환 API 계약을 확인합니다.", "stack의 foreach desugaring 위치를 봅니다."], fix: "nullable array를 empty immutable list로 변환하고 required 여부를 별도 검증합니다.", prevention: "missing·empty·one·many contract tests를 둡니다." },
    { symptom: "계산기에 모르는 연산자를 보내도0이 나온다.", likelyCause: "switch에 default rejection이 없고 result 초기값0이 성공 경로로 흐릅니다.", checks: ["op raw 값을 기록하되 redaction 정책을 지킵니다.", "case allowlist와 default를 봅니다.", "isError 설정 경로를 추적합니다."], fix: "unknown op를 typed validation error로 만들고 계산을 시작하지 않습니다.", prevention: "허용 연산자별 test와 unknown/null tests를 둡니다." },
  ],
  expertNotes: ["Compiler closure is evidence about source resolution, not a claim that the unused import is architecturally necessary."],
};

session.chapters.push(audit);

const seeds: ChapterSeed[] = [
  {
    id: "parameter-multimap-contract", title: "파라미터를 ordered multimap으로 보존합니다", lead: "single getter로 너무 일찍 축약하지 않고 이름별 모든 값을 보존한 뒤 field schema가 cardinality를 결정합니다.",
    explanations: ["HTTP form과 query에는 같은 name이 반복될 수 있습니다. username처럼 singleton인 field와 hobby처럼 multi-valued field를 schema가 구분해야 합니다.", "getParameter는 container가 선택한 한 값만 보여 주므로 duplicate singleton 공격이나 accidental duplication을 숨길 수 있습니다.", "값이 없는 name, name=, name=%20은 각각 absent, empty, decoded blank가 될 수 있습니다.", "LinkedHashMap/List fixture는 name과 value 순서를 보존해 재현 가능한 validation message를 만듭니다.", "애플리케이션에서는 request parameter map을 defensive immutable copy로 바꿔 이후 계층이 transport object에 의존하지 않게 합니다."],
    terms: [["cardinality", "field가 허용하는 값 개수 계약입니다.", ["singleton은 정확히0/1 정책을 둡니다.", "multi field도 최대 개수를 둡니다."]], ["parameter pollution", "같은 singleton name을 반복해 parser 또는 계층별 해석 차이를 노리는 입력입니다.", ["모든 값을 먼저 봅니다.", "first/last 암묵 의존을 피합니다."]]],
    filename: "ParameterMultiMap.java", purpose: "singleton duplicate와 multi-value preservation을 모델링합니다.",
    code: String.raw`import java.util.List;
import java.util.Map;

public class ParameterMultiMap {
    static String one(Map<String, List<String>> input, String name) {
        List<String> values = input.getOrDefault(name, List.of());
        if (values.size() != 1) return "error:" + name + ":count=" + values.size();
        return "ok:" + values.getFirst();
    }
    public static void main(String[] args) {
        Map<String, List<String>> input = Map.of(
            "username", List.of("kim", "admin"),
            "hobby", List.of("music", "code"));
        System.out.println(one(input, "username"));
        System.out.println("hobby=" + input.get("hobby"));
        System.out.println(one(input, "age"));
    }
}`,
    output: "error:username:count=2\nhobby=[music, code]\nerror:age:count=0", refs: ["jakarta-request", "html-form-data", "rfc3986-query", "java-map", "java-list"],
    diagnostics: [["admin과 user 값 중 하나가 임의로 선택된다.", "singleton duplicate를 getParameter 하나로 축약했습니다.", ["getParameterValues count를 봅니다.", "proxy와 application parser 결과를 비교합니다."], "singleton은 count1만 허용합니다.", "duplicate singleton test를 둡니다."], ["checkbox 입력 순서가 매번 다르다.", "unordered collection로 너무 일찍 변환했습니다.", ["request value order를 봅니다.", "HashSet 변환 지점을 찾습니다."], "검증 전 List 순서를 보존하고 필요할 때 명시적으로 정렬합니다.", "order 의미를 field schema에 문서화합니다."]],
  },
  {
    id: "form-urlencoded-utf8-decoding", title: "form-urlencoded를 bytes→UTF-8 text 순서로 decode합니다", lead: "plus와 percent triplet을 구분하고 percent-decoded bytes를 지정 charset으로 한 번만 문자열화합니다.",
    explanations: ["application/x-www-form-urlencoded에서 space는 +로 표현되고 literal plus는 %2B여야 합니다.", "%EC%84%9C%EC%9A%B8은 먼저 bytes EC 84 9C EC 9A B8로 복원한 뒤 UTF-8로 서울이 됩니다.", "percent를 문자 단위로 임의 치환하거나 platform default charset을 쓰면 mojibake와 security filter 우회가 생길 수 있습니다.", "malformed %, %G0, truncated multibyte sequence는 조용히 대체하지 말고400 후보로 분류합니다.", "Servlet body parameter는 첫 parameter access 전에 encoding을 설정해야 하며 JSON/multipart는 별도 parser를 써야 합니다."],
    terms: [["percent-encoding", "octet을 %HH로 표현하는 URI/form 표기입니다.", ["decode 결과는 bytes입니다.", "문자 charset 단계가 뒤따릅니다."]], ["mojibake", "bytes와 charset 계약 불일치로 글자가 깨져 보이는 현상입니다.", ["재인코딩으로 임시 봉합하지 않습니다.", "transport 경계에서 계약을 고칩니다."]]],
    filename: "FormUrlDecoding.java", purpose: "plus, percent bytes와 UTF-8 변환을 결정적으로 보입니다.",
    code: String.raw`import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

public class FormUrlDecoding {
    static String decode(String value) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        for (int i = 0; i < value.length();) {
            char ch = value.charAt(i);
            if (ch == '+') { bytes.write(' '); i++; }
            else if (ch == '%') {
                if (i + 2 >= value.length()) throw new IllegalArgumentException("bad-percent");
                int hi = Character.digit(value.charAt(i + 1), 16);
                int lo = Character.digit(value.charAt(i + 2), 16);
                if (hi < 0 || lo < 0) throw new IllegalArgumentException("bad-percent");
                bytes.write((hi << 4) | lo); i += 3;
            } else { bytes.writeBytes(String.valueOf(ch).getBytes(StandardCharsets.UTF_8)); i++; }
        }
        return bytes.toString(StandardCharsets.UTF_8);
    }
    public static void main(String[] args) {
        System.out.println(decode("city=%EC%84%9C%EC%9A%B8+ICT").substring(5));
        System.out.println(decode("math=1%2B2").substring(5));
        try { decode("bad=%G0"); } catch (IllegalArgumentException e) { System.out.println(e.getMessage()); }
    }
}`,
    output: "서울 ICT\n1+2\nbad-percent", refs: ["html-form-urlencoded", "rfc3986-percent", "java-standard-charsets"],
    diagnostics: [["서울이 깨진 문자열로 보인다.", "percent bytes를 잘못된/default charset으로 문자열화했습니다.", ["raw bytes를 hex로 봅니다.", "Content-Type charset과 connector 설정을 봅니다.", "parameter access 시점을 봅니다."], "parameter materialization 전에 UTF-8 계약을 설정합니다.", "한글 exact-byte integration test를 둡니다."], ["+가 공백으로 변한다.", "form encoding에서 plus는 space 문법입니다.", ["media type을 확인합니다.", "literal plus가 %2B인지 봅니다."], "form encoder를 사용해 literal plus를 percent-encode합니다.", "수동 query 문자열 연결을 금지합니다."]],
  },
  {
    id: "query-body-method-source", title: "query와 body parameter source를 method·media type과 함께 봅니다", lead: "둘 다 name/value가 될 수 있지만 URL 노출, cache, retry와 parser 선택은 같지 않습니다.",
    explanations: ["GET의 query는 target URI 일부라 browser history, access log, referrer 정책과 intermediary 관찰 범위에 들어갈 수 있습니다.", "POST body가 주소창에 안 보인다는 사실은 암호화나 비밀 저장을 뜻하지 않습니다. TLS, server logging, retention과 authorization이 별도입니다.", "Servlet parameter APIs는 query와 form body를 병합해 source provenance를 잃을 수 있어 security-sensitive singleton에는 중복·source policy가 필요합니다.", "application/json body는 getParameter 대상이 아니며 media type별 parser와 size limit를 사용해야 합니다.", "GET은 safe semantics가 기대되므로 상태 변경과 credential 전달에 쓰지 않습니다."],
    terms: [["request target", "method와 함께 server resource를 선택하는 URI 정보입니다.", ["query가 포함될 수 있습니다.", "로그·cache 경계를 고려합니다."]], ["media type", "body representation을 해석하는 형식 계약입니다.", ["form, JSON, multipart parser가 다릅니다.", "Content-Type을 검증합니다."]]],
    filename: "ParameterSource.java", purpose: "query/body 병합 전 source와 policy를 보존합니다.",
    code: String.raw`import java.util.List;

public class ParameterSource {
    record Pair(String source, String name, String value) {}
    static String bindSingleton(List<Pair> pairs, String name) {
        List<Pair> hits = pairs.stream().filter(p -> p.name().equals(name)).toList();
        if (hits.size() != 1) return "reject:count=" + hits.size();
        Pair hit = hits.getFirst();
        if (!hit.source().equals("body")) return "reject:source=" + hit.source();
        return "accept:" + hit.value();
    }
    public static void main(String[] args) {
        System.out.println(bindSingleton(List.of(new Pair("body", "token", "A")), "token"));
        System.out.println(bindSingleton(List.of(new Pair("query", "token", "A")), "token"));
        System.out.println(bindSingleton(List.of(new Pair("query", "token", "A"), new Pair("body", "token", "B")), "token"));
    }
}`,
    output: "accept:A\nreject:source=query\nreject:count=2", refs: ["rfc9110-methods", "rfc9110-target", "jakarta-request", "owasp-info-exposure"],
    diagnostics: [["POST인데 token이 URL log에 남는다.", "query와 body가 parameter API에서 병합됐고 source 정책이 없습니다.", ["raw request target을 봅니다.", "form action/JavaScript client를 봅니다.", "access log를 점검합니다."], "sensitive field는 body/header 전용 계약과 redaction을 둡니다.", "source-conflict integration test를 둡니다."], ["JSON body 값이 getParameter에서 null이다.", "parameter API를 JSON parser로 오해했습니다.", ["Content-Type을 확인합니다.", "body parser middleware를 봅니다."], "media type을 검증하고 bounded JSON parser로 DTO를 만듭니다.", "unsupported media type에는415 정책을 둡니다."]],
  },
  {
    id: "presence-empty-blank-malformed", title: "absent·empty·blank·malformed를 서로 다른 상태로 분류합니다", lead: "null을 곧바로 빈 문자열로 바꾸면 required 오류와 사용자가 명시적으로 지운 값을 구분할 수 없습니다.",
    explanations: ["absent는 name 자체가 없고 present-empty는 name=, blank는 decode 뒤 공백만 있는 상태입니다.", "required text에는 absent/empty/blank를 같은 message로 합칠 수 있지만 update PATCH 의미에서는 absent=변경 없음, empty=삭제일 수 있습니다.", "trim은 ASCII/Unicode whitespace 정책을 먼저 정해야 하며 password처럼 공백이 의미 있는 field에 무조건 적용하면 안 됩니다.", "malformed encoding과 invalid domain value는 transport/parser 오류와 field validation 오류로 구분합니다.", "sealed result 또는 enum state를 쓰면 null/empty coercion이 숨어들지 않습니다."],
    terms: [["presence state", "name 존재와 decoded content를 조합한 입력 상태입니다.", ["API별 update semantics에 중요합니다.", "message와 status policy를 분리합니다."]], ["coercion", "서로 다른 입력을 편의를 위해 같은 값으로 강제 변환하는 과정입니다.", ["정보 손실을 낳을 수 있습니다.", "boundary에서 명시합니다."]]],
    filename: "PresenceStates.java", purpose: "nullable input을 네 상태로 분류합니다.",
    code: String.raw`public class PresenceStates {
    enum State { ABSENT, EMPTY, BLANK, VALUE }
    static State classify(String value) {
        if (value == null) return State.ABSENT;
        if (value.isEmpty()) return State.EMPTY;
        if (value.isBlank()) return State.BLANK;
        return State.VALUE;
    }
    public static void main(String[] args) {
        for (String value : new String[] { null, "", "  ", "서울" }) {
            System.out.println(classify(value));
        }
    }
}`,
    output: "ABSENT\nEMPTY\nBLANK\nVALUE", refs: ["java-string", "jakarta-request"],
    diagnostics: [["필드를 보내지 않았는데 기존 값이 지워진다.", "absent를 empty로 coercion했습니다.", ["raw parameter map에 key가 있는지 봅니다.", "update binder의 default를 봅니다."], "presence-aware update command를 사용합니다.", "absent/empty PATCH tests를 둡니다."], ["공백이 의미 있는 값까지 trim된다.", "field별 normalization policy 없이 global trim을 했습니다.", ["password/identifier/display text 정책을 비교합니다.", "trim 호출 지점을 찾습니다."], "field schema가 허용한 곳에만 trim/normalization을 적용합니다.", "boundary property tests를 둡니다."]],
  },
  {
    id: "multi-choice-allowlist", title: "checkbox·multi-select를 null-safe allowlist와 최대 개수로 검증합니다", lead: "HTML option은 UX 힌트일 뿐 공격자는 임의 값을 직접 보낼 수 있으므로 server allowlist가 최종 권위입니다.",
    explanations: ["선택이 없으면 getParameterValues는 null일 수 있으므로 Optional 배열보다 즉시 empty immutable list로 변환하는 편이 downstream에 단순합니다.", "hobby/web 값은 browser가 제공한 option에 제한되지 않습니다. server가 canonical code allowlist를 소유합니다.", "중복을 허용할지 제거할지, 입력 순서를 의미 있게 보존할지 field마다 정합니다.", "최대 선택 개수와 각 값 길이를 먼저 제한해 validation CPU와 error size를 제한합니다.", "unknown 값을 조용히 버리면 사용자에게 저장된 결과가 다르게 보이므로 명시적 오류가 안전합니다."],
    terms: [["allowlist", "서버가 허용한다고 열거한 값만 통과시키는 정책입니다.", ["client option과 별개입니다.", "unknown을 명시적으로 거부합니다."]], ["canonical code", "표시 label과 분리된 안정적인 저장·비교 값입니다.", ["localization에 흔들리지 않습니다.", "case policy를 정합니다."]]],
    filename: "ChoiceValidation.java", purpose: "missing, duplicate, unknown과 maximum을 검증합니다.",
    code: String.raw`import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class ChoiceValidation {
    static String validate(List<String> raw) {
        Set<String> allowed = Set.of("music", "code", "walk");
        if (raw.size() > 3) return "error:too-many";
        LinkedHashSet<String> unique = new LinkedHashSet<>(raw);
        if (unique.size() != raw.size()) return "error:duplicate";
        for (String value : unique) if (!allowed.contains(value)) return "error:unknown=" + value;
        return "ok:" + unique;
    }
    public static void main(String[] args) {
        System.out.println(validate(List.of()));
        System.out.println(validate(List.of("music", "code")));
        System.out.println(validate(List.of("music", "root")));
        System.out.println(validate(List.of("code", "code")));
    }
}`,
    output: "ok:[]\nok:[music, code]\nerror:unknown=root\nerror:duplicate", refs: ["html-form-controls", "owasp-input-validation", "java-set"],
    diagnostics: [["화면에 없는 root 값이 저장된다.", "client option을 신뢰하고 server allowlist가 없습니다.", ["raw value와 stored code를 비교합니다.", "server enum/registry를 봅니다."], "server canonical allowlist로 거부합니다.", "tampered request tests를 둡니다."], ["중복 checkbox로 quota가 우회된다.", "dedup 전/후 count 정책이 없습니다.", ["raw count와 unique count를 모두 봅니다.", "limit 순서를 확인합니다."], "raw maximum과 duplicate rejection을 먼저 적용합니다.", "count boundary tests를 둡니다."]],
  },
  {
    id: "numeric-domain-validation", title: "숫자는 parse 성공 뒤 finite·range·연산 규칙까지 검증합니다", lead: "Double.parseDouble은 NaN과 Infinity도 성공하므로 syntax parser가 domain validator를 대신하지 못합니다.",
    explanations: ["missing/blank는 parse exception에 맡기지 않고 field presence 단계에서 더 정확한 message를 만듭니다.", "Double.parseDouble은 과학 표기와 NaN/Infinity를 받을 수 있습니다. 계산기 요구사항이 유한한 범위만 허용하면 isFinite와 range가 필요합니다.", "operator는 +,-,*,/ allowlist이며 default rejection이 있어야 초기값0이 정상 결과가 되지 않습니다.", "0으로 나누기 정책은 integer/decimal과 IEEE 754 의미를 구분해 명시합니다.", "통화·정확 소수에는 binary floating point 대신 BigDecimal과 scale/rounding 계약을 사용합니다."],
    terms: [["syntax-valid", "문자열이 숫자 parser 문법에 맞는 상태입니다.", ["domain-valid를 뜻하지 않습니다.", "finite/range를 더 봅니다."]], ["domain invariant", "업무가 허용하는 값·연산의 불변 조건입니다.", ["transport와 독립적입니다.", "service에서도 방어합니다."]]],
    filename: "CalculatorValidation.java", purpose: "unknown op, non-finite, zero division과 정상 결과를 구분합니다.",
    code: String.raw`import java.util.Set;

public class CalculatorValidation {
    static String calculate(String left, String op, String right) {
        if (left == null || right == null || op == null) return "error:missing";
        if (!Set.of("+", "-", "*", "/").contains(op)) return "error:operator";
        final double a, b;
        try { a = Double.parseDouble(left); b = Double.parseDouble(right); }
        catch (NumberFormatException e) { return "error:number"; }
        if (!Double.isFinite(a) || !Double.isFinite(b)) return "error:finite";
        if (Math.abs(a) > 1_000_000 || Math.abs(b) > 1_000_000) return "error:range";
        if (op.equals("/") && b == 0.0) return "error:zero";
        double value = switch (op) { case "+" -> a + b; case "-" -> a - b; case "*" -> a * b; case "/" -> a / b; default -> throw new AssertionError(); };
        return "ok:" + value;
    }
    public static void main(String[] args) {
        System.out.println(calculate("6", "/", "3"));
        System.out.println(calculate("NaN", "+", "1"));
        System.out.println(calculate("1", "%", "2"));
        System.out.println(calculate("1", "/", "0"));
    }
}`,
    output: "ok:2.0\nerror:finite\nerror:operator\nerror:zero", refs: ["java-double", "java-set", "owasp-input-validation"],
    diagnostics: [["NaN이 정상 결과로 저장된다.", "parse 성공만 보고 Double.isFinite를 확인하지 않았습니다.", ["raw input과 parsed value를 봅니다.", "finite/range checks를 찾습니다."], "isFinite와 업무 range를 적용합니다.", "NaN·Infinity·경계값 tests를 둡니다."], ["모르는 연산자가0을 반환한다.", "switch default rejection과 result success flag가 없습니다.", ["initial value와 case coverage를 봅니다.", "unknown op test를 실행합니다."], "allowlist 검증 후 exhaustive switch를 사용합니다.", "default path를 failure로 고정합니다."]],
  },
  {
    id: "unicode-canonicalization-policy", title: "Unicode normalization은 field identity 정책으로 제한합니다", lead: "눈에 비슷한 문자열과 code-point sequence를 어디서 같게 볼지 정하지 않으면 login·중복 검사와 표시가 충돌합니다.",
    explanations: ["é는 precomposed U+00E9 또는 e+combining acute로 표현될 수 있습니다. NFC는 canonical equivalent sequence를 하나의 비교 형태로 맞춥니다.", "NFKC는 compatibility characters까지 접어 의미를 바꿀 수 있어 자유로운 표시명보다 identifier 정책에서 신중히 사용합니다.", "case folding, whitespace collapse, control 제거는 각각 별도 정책이며 순서를 고정해야 합니다.", "length는 UTF-16 units, code points, grapheme clusters와 UTF-8 bytes 중 무엇을 제한하는지 명시합니다.", "정규화 전 raw 값을 security log에 그대로 남기지 말고 canonical과 display value의 저장 목적을 구분합니다."],
    terms: [["NFC", "canonical decomposition 뒤 composition을 적용하는 Unicode normalization form입니다.", ["canonical equivalents를 맞춥니다.", "모든 visually-similar 문자를 같게 만들지 않습니다."]], ["code point", "Unicode abstract character value 단위입니다.", ["Java char와 다를 수 있습니다.", "grapheme cluster와도 다릅니다."]]],
    filename: "UnicodeCanonicalText.java", purpose: "NFC 동등성과 control/point limit을 검증합니다.",
    code: String.raw`import java.text.Normalizer;

public class UnicodeCanonicalText {
    static String identifier(String raw) {
        String value = Normalizer.normalize(raw.strip(), Normalizer.Form.NFC);
        if (value.codePoints().anyMatch(Character::isISOControl)) return "error:control";
        if (value.codePointCount(0, value.length()) > 8) return "error:length";
        return "ok:" + value;
    }
    public static void main(String[] args) {
        String composed = "é";
        String decomposed = "e\u0301";
        System.out.println(identifier(composed));
        System.out.println(identifier(decomposed));
        System.out.println("same=" + Normalizer.normalize(composed, Normalizer.Form.NFC).equals(Normalizer.normalize(decomposed, Normalizer.Form.NFC)));
        System.out.println(identifier("a\u0000b"));
    }
}`,
    output: "ok:é\nok:é\nsame=true\nerror:control", refs: ["unicode-normalization", "java-normalizer", "java-character"],
    diagnostics: [["화면상 같은 id가 중복 등록된다.", "canonical equivalent sequences를 비교 전 normalize하지 않았습니다.", ["code points를 hex로 비교합니다.", "DB collation과 app normalization을 봅니다."], "identifier 경계에서 versioned NFC policy를 적용합니다.", "composed/decomposed tests를 둡니다."], ["emoji 길이 제한이 이상하다.", "String.length를 사용자 인식 문자 수로 오해했습니다.", ["UTF-16 units와 code points를 셉니다.", "grapheme 요구사항을 확인합니다."], "요구사항에 맞는 단위를 명시하고 UI/server가 공유합니다.", "supplementary/combining sequence tests를 둡니다."]],
  },
  {
    id: "html-context-output-encoding", title: "검증된 값도 HTML text context에서 다시 encode합니다", lead: "입력 validation은 업무 허용값을 결정하고 output encoding은 browser parser가 데이터를 markup으로 해석하지 못하게 합니다.",
    explanations: ["Ex04/05의 username 문자열 연결은 <, &, quotes를 markup 경계에 넣습니다. allowlist가 없는 display text라면 XSS가 됩니다.", "HTML text, attribute, URL, JavaScript, CSS는 parser context가 달라 하나의 replace 함수로 모두 처리할 수 없습니다.", "template engine auto-escaping을 기본으로 쓰고 trusted HTML type은 좁은 review boundary에서만 만듭니다.", "escape는 최종 sink 가까이에서 한 번 적용하고 DB에는 대개 canonical raw data를 저장해 double encoding을 피합니다.", "CSP는 defense-in-depth이며 올바른 context encoding을 대체하지 않습니다."],
    terms: [["output encoding", "데이터를 target parser context에서 syntax가 아닌 text로 표현하는 변환입니다.", ["sink context별 규칙이 다릅니다.", "validation과 독립입니다."]], ["double encoding", "이미 escaped된 데이터를 다시 escape해 &amp;lt;처럼 표시가 깨지는 문제입니다.", ["storage와 presentation을 분리합니다.", "escape ownership을 하나로 둡니다."]]],
    filename: "HtmlParameterEscape.java", purpose: "HTML text node용 최소 encoding을 exact output으로 확인합니다.",
    code: String.raw`public class HtmlParameterEscape {
    static String text(String value) {
        StringBuilder out = new StringBuilder();
        value.codePoints().forEach(cp -> {
            switch (cp) {
                case '&' -> out.append("&amp;");
                case '<' -> out.append("&lt;");
                case '>' -> out.append("&gt;");
                default -> out.appendCodePoint(cp);
            }
        });
        return out.toString();
    }
    public static void main(String[] args) {
        String username = "<img src=x onerror=alert(1)>&서울";
        System.out.println("<li>이름: " + text(username) + "</li>");
    }
}`,
    output: "<li>이름: &lt;img src=x onerror=alert(1)&gt;&amp;서울</li>", refs: ["html-syntax-text", "owasp-xss", "unicode-utf8"],
    diagnostics: [["username이 태그로 실행된다.", "raw parameter를 HTML 문자열에 연결했습니다.", ["response source를 봅니다.", "template escape 설정을 봅니다.", "sink context를 분류합니다."], "HTML text context encoder 또는 auto-escaping template을 씁니다.", "malicious payload rendering tests를 둡니다."], ["화면에 &lt;가 문자 그대로 보인다.", "storage 때 escape하고 render 때 다시 escape했습니다.", ["DB stored value를 봅니다.", "escape 호출 횟수를 추적합니다."], "canonical raw storage와 single render encoding으로 분리합니다.", "round-trip/double-encoding tests를 둡니다."]],
  },
  {
    id: "typed-validation-error-model", title: "field errors를 축적해 transport status와 분리합니다", lead: "첫 예외에서 멈추기보다 수정 가능한 여러 field 오류를 안정된 code/path/message로 제공하되 내부 stack은 노출하지 않습니다.",
    explanations: ["validation result는 성공 typed value 또는 field error list입니다. null과 exception message를 API 계약으로 쓰지 않습니다.", "error code는 localization과 client branch에 안정적이고 human message는 변경 가능하다고 문서화합니다.", "malformed request는400, semantic domain violation은422를 선택할 수 있지만 한 API 안에서 일관성을 유지합니다.", "오류 list도 count/size limit가 필요하며 rejected raw value, password, token을 그대로 echo/log하지 않습니다.", "service invariant 오류와 client field 오류를 구분해 unexpected exception은 correlation id와 generic500으로 갑니다."],
    terms: [["typed validation result", "성공 값 또는 구조화된 오류를 나타내는 합타입입니다.", ["exception control flow를 줄입니다.", "field path와 stable code를 담습니다."]], ["error taxonomy", "client-fixable, authorization, conflict, server failure를 의미별로 분류하는 체계입니다.", ["status와 monitoring에 연결합니다.", "secret을 포함하지 않습니다."]]],
    filename: "ValidationResultDemo.java", purpose: "여러 field 오류를 stable order로 축적합니다.",
    code: String.raw`import java.util.ArrayList;
import java.util.List;

public class ValidationResultDemo {
    record Error(String field, String code) {}
    static List<Error> validate(String name, String age) {
        List<Error> errors = new ArrayList<>();
        if (name == null || name.isBlank()) errors.add(new Error("name", "required"));
        if (age == null || age.isBlank()) errors.add(new Error("age", "required"));
        else try { if (Integer.parseInt(age) < 0) errors.add(new Error("age", "range")); }
        catch (NumberFormatException e) { errors.add(new Error("age", "number")); }
        return List.copyOf(errors);
    }
    public static void main(String[] args) {
        System.out.println(validate("", "x"));
        System.out.println(validate("kim", "-1"));
        System.out.println(validate("kim", "27"));
    }
}`,
    output: "[Error[field=name, code=required], Error[field=age, code=number]]\n[Error[field=age, code=range]]\n[]", refs: ["rfc9457", "owasp-error-handling", "java-record", "java-list"],
    diagnostics: [["client가 exception message 문자열을 parsing한다.", "stable error schema/code가 없습니다.", ["response body contract를 봅니다.", "localization 변경 이력을 봅니다."], "stable code/field와 human message를 분리합니다.", "schema contract tests를 둡니다."], ["validation 응답에 password가 보인다.", "rejected raw value를 오류에 자동 echo했습니다.", ["error serializer를 봅니다.", "logs/traces를 검색합니다."], "민감 field는 value를 포함하지 않고 field/code만 반환합니다.", "secret leakage tests와 log redaction을 둡니다."]],
  },
  {
    id: "parameter-resource-budget", title: "parameter count·value count·decoded size에 예산을 둡니다", lead: "정확한 validation도 무제한 입력 뒤에 실행되면 memory·CPU·error amplification을 막지 못합니다.",
    explanations: ["raw request body bytes, parameter name count, values per name, name/value decoded length와 total decoded units는 서로 다른 resource dimensions입니다.", "proxy, connector, framework, application limits가 다르면 어느 계층이 거부했는지 status/body가 달라질 수 있어 운영 문서와 tests가 필요합니다.", "percent encoding은 wire bytes와 decoded representation 크기를 다르게 만들 수 있으므로 두 budget을 모두 고려합니다.", "limit 초과 시 전체 오류 list를 만들지 말고 bounded failure로 일찍 종료합니다.", "공개 endpoint는 rate limiting과 timeouts도 필요하지만 authentication만으로 oversized input 위험이 사라지지 않습니다."],
    terms: [["input budget", "한 요청이 소비할 수 있는 bytes·items·time의 상한입니다.", ["validation 전에 적용합니다.", "계층별 정렬이 필요합니다."]], ["amplification", "작은 공격 비용이 큰 server CPU/memory/response 비용으로 확대되는 현상입니다.", ["error count도 제한합니다.", "early rejection을 사용합니다."]]],
    filename: "ParameterBudget.java", purpose: "name/value count와 decoded length budget을 결정적으로 적용합니다.",
    code: String.raw`import java.util.List;
import java.util.Map;

public class ParameterBudget {
    static String inspect(Map<String, List<String>> input) {
        if (input.size() > 3) return "reject:names";
        int units = 0;
        for (var entry : input.entrySet()) {
            if (entry.getValue().size() > 2) return "reject:values:" + entry.getKey();
            units += entry.getKey().length();
            for (String value : entry.getValue()) units += value.length();
            if (units > 20) return "reject:units";
        }
        return "accept:units=" + units;
    }
    public static void main(String[] args) {
        System.out.println(inspect(Map.of("name", List.of("kim"), "age", List.of("27"))));
        System.out.println(inspect(Map.of("hobby", List.of("a", "b", "c"))));
        System.out.println(inspect(Map.of("message", List.of("01234567890123456789"))));
    }
}`,
    output: "accept:units=12\nreject:values:hobby\nreject:units", refs: ["owasp-input-validation", "jakarta-request", "rfc9110-content"],
    diagnostics: [["작은 요청 수에도 heap/CPU가 급증한다.", "한 요청의 parameter count/value length가 무제한입니다.", ["raw/decoded sizes를 metric으로 봅니다.", "connector/application limits를 비교합니다."], "각 dimension에 bounded budget과 early rejection을 둡니다.", "limit-1/limit/limit+1 load tests를 둡니다."], ["proxy는413인데 app은400을 반환한다.", "계층별 limit와 error contract가 정렬되지 않았습니다.", ["proxy/connector/application 설정을 수집합니다.", "거부 계층을 correlation id로 찾습니다."], "가장 바깥 계층부터 일관된 limit/status 정책을 문서화합니다.", "deployment smoke test로 실제 거부 지점을 확인합니다."]],
  },
];

session.chapters.push(...seeds.map(makeChapter));

session.sources.push(
  { id: "source-ex04", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex04.java", usedFor: ["username/userage", "raw HTML", "UTF-8 calls"], evidence: "inventory 원본1입니다." },
  { id: "source-ex05", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex05.java", usedFor: ["duplicated parameter example"], evidence: "inventory 원본2입니다." },
  { id: "source-ex06", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex06.java", usedFor: ["calculator", "parseDouble", "switch"], evidence: "inventory 원본3입니다." },
  { id: "source-ex07", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/day01/Ex07.java", usedFor: ["getParameterValues", "null foreach"], evidence: "inventory 원본4입니다." },
  { id: "source-hello-closure", repository: "local jspstudy snapshot", path: "jspstudy/src/main/java/org/study/jspstudy/HelloServlet.java", usedFor: ["compile closure"], evidence: "inventory files의 unused import resolution closure입니다." },
  { id: "jdk-javac", repository: "Java SE 21", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["compile warning audit"], evidence: "JDK21 compiler primary documentation입니다." },
  { id: "jakarta-request", repository: "Jakarta Servlet 6.1 API", path: "HttpServletRequest", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/http/httpservletrequest", usedFor: ["parameter APIs", "encoding", "request target"], evidence: "Servlet request primary API입니다." },
  { id: "html-form-data", repository: "WHATWG HTML", path: "constructing the entry list", publicUrl: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set", usedFor: ["ordered form entries"], evidence: "HTML form primary standard입니다." },
  { id: "html-form-urlencoded", repository: "WHATWG URL", path: "application/x-www-form-urlencoded", publicUrl: "https://url.spec.whatwg.org/#application/x-www-form-urlencoded", usedFor: ["plus and percent decoding"], evidence: "form-urlencoded primary algorithm입니다." },
  { id: "html-form-controls", repository: "WHATWG HTML", path: "form controls", publicUrl: "https://html.spec.whatwg.org/multipage/form-elements.html", usedFor: ["checkbox/multi-select"], evidence: "form controls primary standard입니다." },
  { id: "rfc3986-query", repository: "IETF", path: "RFC 3986 Query", publicUrl: "https://www.rfc-editor.org/rfc/rfc3986.html#section-3.4", usedFor: ["query component"], evidence: "URI query primary standard입니다." },
  { id: "rfc3986-percent", repository: "IETF", path: "RFC 3986 Percent-Encoding", publicUrl: "https://www.rfc-editor.org/rfc/rfc3986.html#section-2.1", usedFor: ["percent octets"], evidence: "percent encoding primary standard입니다." },
  { id: "rfc9110-methods", repository: "IETF", path: "RFC 9110 Methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-methods", usedFor: ["GET/POST semantics"], evidence: "HTTP methods primary standard입니다." },
  { id: "rfc9110-target", repository: "IETF", path: "RFC 9110 Determining the Target Resource", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-determining-the-target-reso", usedFor: ["query exposure"], evidence: "request target primary standard입니다." },
  { id: "rfc9110-content", repository: "IETF", path: "RFC 9110 Content", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-content", usedFor: ["body and limits"], evidence: "HTTP content semantics입니다." },
  { id: "rfc9457", repository: "IETF", path: "RFC 9457 Problem Details", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["structured error model"], evidence: "HTTP problem detail primary standard입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["multimap fixture"], evidence: "Java collection API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered values", "errors"], evidence: "Java list API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "java.util.Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["allowlist"], evidence: "Java set API입니다." },
  { id: "java-standard-charsets", repository: "Java SE 21 API", path: "StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["UTF-8 bytes"], evidence: "portable charset API입니다." },
  { id: "java-string", repository: "Java SE 21 API", path: "String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["blank/presence"], evidence: "String classification API입니다." },
  { id: "java-double", repository: "Java SE 21 API", path: "Double", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Double.html", usedFor: ["parse and finite"], evidence: "floating point API입니다." },
  { id: "java-normalizer", repository: "Java SE 21 API", path: "Normalizer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/text/Normalizer.html", usedFor: ["NFC"], evidence: "Java normalization API입니다." },
  { id: "java-character", repository: "Java SE 21 API", path: "Character", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Character.html", usedFor: ["code points/control"], evidence: "Unicode character API입니다." },
  { id: "java-record", repository: "Java SE 21 JLS", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["typed error"], evidence: "record language specification입니다." },
  { id: "unicode-normalization", repository: "Unicode Consortium", path: "UAX 15", publicUrl: "https://www.unicode.org/reports/tr15/", usedFor: ["normalization policy"], evidence: "Unicode normalization primary standard입니다." },
  { id: "unicode-utf8", repository: "Unicode Consortium", path: "Unicode Standard Chapter 3", publicUrl: "https://www.unicode.org/versions/Unicode15.1.0/ch03.pdf", usedFor: ["UTF-8 and code points"], evidence: "Unicode encoding primary standard입니다." },
  { id: "html-syntax-text", repository: "WHATWG HTML", path: "syntax text", publicUrl: "https://html.spec.whatwg.org/multipage/syntax.html#syntax-text", usedFor: ["HTML text context"], evidence: "HTML parser primary standard입니다." },
  { id: "owasp-input-validation", repository: "OWASP", path: "Input Validation Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allowlist", "range", "budget"], evidence: "보안 실무 기준입니다." },
  { id: "owasp-xss", repository: "OWASP", path: "XSS Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", usedFor: ["context output encoding"], evidence: "XSS 방어 기준입니다." },
  { id: "owasp-error-handling", repository: "OWASP", path: "Error Handling Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["safe errors"], evidence: "오류 정보 노출 방지 기준입니다." },
  { id: "owasp-info-exposure", repository: "OWASP", path: "Information Exposure Through Query Strings", publicUrl: "https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url", usedFor: ["query sensitive data"], evidence: "URL 정보 노출 설명입니다." },
);

const reviews: Array<[string, string]> = [
  ["Servlet parameter의 기본 자료형은 무엇인가요?", "한 값은 String, 반복 name은 String[]/collection 관점이며 원래 모델은 multimap입니다."],
  ["getParameter만 쓰면 무엇을 잃나요?", "같은 name의 추가 값과 duplicate singleton 공격 evidence를 잃을 수 있습니다."],
  ["getParameterValues는 언제 null인가요?", "해당 name의 parameter가 요청에 없을 때 null일 수 있습니다."],
  ["missing과 name=은 같은가요?", "아닙니다. 전자는 key 부재, 후자는 present-empty입니다."],
  ["blank는 무엇인가요?", "decode된 값이 비어 있지는 않지만 whitespace만 가진 상태입니다."],
  ["Ex07 NPE의 직접 원인은 무엇인가요?", "nullable String[]을 null check 없이 enhanced-for한 것입니다."],
  ["application/x-www-form-urlencoded에서 +는 무엇인가요?", "space를 나타내며 literal plus는 %2B로 encode합니다."],
  ["%EC%84%9C는 바로 문자인가요?", "아닙니다. percent triplets로 표현된 bytes이며 charset decode가 뒤따릅니다."],
  ["request encoding은 언제 설정하나요?", "form body parameter가 처음 읽혀 materialize되기 전에 설정합니다."],
  ["늦게 setCharacterEncoding하면 복구되나요?", "이미 parse된 parameter에는 대개 소급 적용되지 않습니다."],
  ["query decoding과 body decoding은 항상 같은가요?", "아닙니다. connector/container 설정과 media type 계약을 따로 확인합니다."],
  ["POST body는 자동으로 비밀인가요?", "아닙니다. TLS, authorization, logs와 retention이 별도입니다."],
  ["GET query에 credential을 넣으면 왜 위험한가요?", "history, URL logs와 referrer 등 더 넓은 관찰 표면에 남을 수 있습니다."],
  ["JSON body도 getParameter로 읽나요?", "보통 아닙니다. Content-Type을 검증하고 JSON parser로 bounded DTO를 만듭니다."],
  ["client select option이 allowlist인가요?", "아닙니다. 공격자는 임의 요청을 만들 수 있어 server allowlist가 필요합니다."],
  ["unknown checkbox 값은 조용히 버려도 되나요?", "저장 결과가 요청과 달라지므로 보통 명시적 validation error가 낫습니다."],
  ["duplicate multi-value 정책에는 무엇이 필요한가요?", "raw maximum, duplicate 허용/거부, order와 canonicalization 정책이 필요합니다."],
  ["Double.parseDouble 성공이면 안전한가요?", "아닙니다. NaN, Infinity, range와 domain rule을 더 검증합니다."],
  ["unknown operator가 result0이 되는 이유는 무엇인가요?", "default rejection 없이 초기값이 성공 경로로 흐르기 때문입니다."],
  ["0 나누기 정책은 왜 명시해야 하나요?", "integer/decimal/IEEE floating semantics와 업무 기대가 다를 수 있습니다."],
  ["돈 계산에 double을 피하는 이유는 무엇인가요?", "binary floating point가 decimal 값을 정확히 표현하지 못할 수 있기 때문입니다."],
  ["NFC는 무엇을 같게 하나요?", "canonical equivalent Unicode sequences를 같은 normalized form으로 만듭니다."],
  ["NFKC를 모든 표시명에 적용해도 되나요?", "compatibility folding이 의미를 바꿀 수 있어 field identity 정책으로 제한합니다."],
  ["String.length는 code point 수인가요?", "아닙니다. UTF-16 code units 수입니다."],
  ["trim을 모든 field에 적용해도 되나요?", "아닙니다. password 등 공백이 의미 있는 field가 있어 schema별 정책이 필요합니다."],
  ["validation이 HTML escaping을 대신하나요?", "아닙니다. 업무 값 검증과 parser context encoding은 별도 방어입니다."],
  ["HTML text encoder를 JavaScript에 써도 되나요?", "안 됩니다. parser context마다 encoding/serialization 규칙이 다릅니다."],
  ["escape된 값을 DB에 저장하면 어떤 문제가 있나요?", "presentation이 storage에 섞여 double encoding과 다른 sink 재사용 오류가 생깁니다."],
  ["error code와 message를 왜 분리하나요?", "code는 client 계약에 안정적이고 message는 localization/문구 변경이 가능하기 때문입니다."],
  ["validation 오류에 raw password를 넣어도 되나요?", "안 됩니다. field/code만 반환하고 secret을 echo/log하지 않습니다."],
  ["400과422 선택의 핵심은 무엇인가요?", "팀 API semantics를 정하고 malformed와 domain-invalid를 일관되게 분류하는 것입니다."],
  ["input budget은 validation 뒤에 적용하나요?", "아닙니다. 큰 입력을 materialize/검증하기 전에 가능한 한 일찍 적용합니다."],
  ["parameter count 하나만 제한하면 충분한가요?", "아닙니다. bytes, names, values/name, decoded lengths, errors와 time이 각각 필요합니다."],
  ["percent encoding이 budget에 영향을 주나요?", "wire bytes와 decoded representation 크기가 달라 두 계층 budget을 봐야 합니다."],
  ["proxy와 app limit가 다르면 무엇을 확인하나요?", "실제 거부 계층, status/body, logs와 가장 작은 effective limit를 확인합니다."],
  ["원본 inventory warning 수는 얼마인가요?", "Ex04~Ex07 각 missing SVUID로4입니다."],
  ["HelloServlet warning을 왜 따로 세나요?", "inventory가 아니라 unused import resolution에 필요한 compile closure이기 때문입니다."],
  ["원본 Ex04/05의 XSS 위험은 어디인가요?", "username/userage를 escape 없이 HTML 문자열에 연결하는 지점입니다."],
  ["JDK-only fixture가 container decoding을 증명하나요?", "아닙니다. 정책 모델이며 실제 connector/Servlet behavior는 integration test가 필요합니다."],
  ["안전한 입력 pipeline 순서는 무엇인가요?", "budget·media/source 확인→decode→preserve all→presence/canonicalize→domain validate→typed model→sink encoding입니다."],
];
session.reviewQuestions.push(...reviews.map(([question, answer]) => ({ question, answer })));

session.completionChecklist.push(
  "inventory Ex04~Ex07을 모두 읽었다.", "HelloServlet compile closure를 읽었다.", "source5 SHA-256 relocation을 검증했다.", "inventory warning4와 closure warning1을 분리했다.", "active getParameter7을 확인했다.", "getParameterValues2를 확인했다.", "request/response encoding8을 확인했다.", "Ex07 null foreach 위험을 설명한다.", "Ex06 unknown-op result0 위험을 설명한다.", "Ex04/05 raw HTML 위험을 설명한다.",
  "parameter를 ordered multimap으로 본다.", "singleton cardinality를 schema에 둔다.", "duplicate singleton을 거부한다.", "multi-value order 정책을 정한다.", "missing과 empty를 구분한다.", "blank와 value를 구분한다.", "null 배열을 empty immutable list로 바꾼다.", "raw value count를 제한한다.", "form plus와 literal plus를 구분한다.", "percent triplet을 bytes로 decode한다.",
  "UTF-8을 명시적으로 사용한다.", "malformed percent를400 후보로 둔다.", "parameter access 전에 request encoding을 설정한다.", "query와 body decoding 설정을 구분한다.", "query/body source conflict를 검증한다.", "GET query에 secret을 넣지 않는다.", "POST가 자동 보안이 아님을 안다.", "media type별 parser를 사용한다.", "unsupported media type 정책을 둔다.", "checkbox server allowlist를 둔다.",
  "unknown choice를 명시적으로 거부한다.", "choice duplicate 정책을 둔다.", "선택 최대 개수를 제한한다.", "숫자 missing/blank를 먼저 검사한다.", "NumberFormatException을 client error로 분류한다.", "Double.isFinite를 검사한다.", "numeric range를 검사한다.", "operator allowlist를 둔다.", "zero division 정책을 둔다.", "decimal money에는 BigDecimal을 검토한다.",
  "Unicode normalization 대상을 문서화한다.", "NFC와 NFKC를 구분한다.", "control character 정책을 둔다.", "length 단위를 명시한다.", "code unit과 code point를 구분한다.", "field별 trim 정책을 둔다.", "validation과 output encoding을 분리한다.", "HTML text context에 escape한다.", "다른 parser context에 같은 escaper를 재사용하지 않는다.", "raw canonical storage와 render encoding을 분리한다.",
  "stable field/error code를 둔다.", "human message와 code를 분리한다.", "validation errors를 bounded하게 축적한다.", "secret을 error/log에 echo하지 않는다.", "raw request bytes limit를 둔다.", "parameter names limit를 둔다.", "values-per-name limit를 둔다.", "decoded length limit를 둔다.", "proxy/container/app limits를 정렬한다.", "real container integration으로 decoding 계약을 재검증한다."
);

export default session;
