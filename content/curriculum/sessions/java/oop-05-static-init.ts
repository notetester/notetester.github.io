import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-05-static-init"],
  slug: "oop-05-static-init",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 15,
  title: "static과 클래스·인스턴스 초기화",
  subtitle: "공유 상태의 소유권과 JVM 초기화 trigger·textual order를 구분하고 전역 상태·실패·동시성까지 계약으로 통제합니다.",
  level: "중급",
  estimatedMinutes: 680,
  coreQuestion: "class가 언제 준비·초기화되고 static/instance state가 누구에게 속하는지 정확히 추적하면서, 숨은 전역 상태와 초기화 실패를 피하려면 어떻게 설계해야 할까요?",
  summary: "inventory가 직접 지정한 Ex01_Static·Ex03_Static·Example 세 파일과 실행 companion Ex02_StaticMain·Ex04_StaticMain 두 파일을 함께 읽어 OOP05 범위5를 확정했습니다. OpenJDK 21.0.11에서 class04 전체26은 compile exit0이지만 범위 밖 Ex09_Sub가 Random을 상속해 serialVersionUID가 없다는 serial warning1을 내며, 범위5는 별도 output에서 warning0입니다. Ex02는 new마다 su가 11로 독립적이고 shared num은 11→12→13으로 증가합니다. Ex03/04는 preparation의 기본값 이후 textual static initializers가 s2=0·s3=700·s4=1300·s5=70·s6=1000을 만들고 instance s1은 new 뒤에도 0입니다. Example은 main 호출 전에 static block이 `static 1`을 출력해 a를2로 만든 뒤 `main s2`를 출력합니다. 원본의 ‘static은 미리 생성’, ‘static method는 instance가 아직 없어 접근 불가’, ‘static method도 객체마다 복제되지 않는다’ 같은 설명을 preparation·active-use initialization·implicit receiver 부재·class-loader identity로 교정합니다. 이어 constant non-trigger와 active trigger, forward-reference 규칙, per-new 초기화, 주석 경로의 완전 trace, constant inlining과 API 진화, utility와 dependency injection, lazy holder·초기화 실패·class loader·동시성, expected compile failures까지 확장합니다.",
  objectives: [
    "instance field와 static field의 소유권·수명·공유 범위를 object identity와 defining class identity로 설명할 수 있다.",
    "static method에 implicit this가 없는 이유와 explicit object reference로 instance state를 다루는 방법을 구분할 수 있다.",
    "loading·linking preparation·initialization을 구분하고 active-use trigger와 non-trigger를 JLS 규칙으로 예측할 수 있다.",
    "static field initializers와 static blocks의 textual order, default value, forward-reference 제한을 실제 trace로 계산할 수 있다.",
    "static initialization과 객체별 field·instance initializer·constructor 순서를 한 실행에서 분리할 수 있다.",
    "compile-time constant inlining, utility class, lazy holder, initialization failure, class-loader identity와 mutable static concurrency 위험을 API 설계에 반영할 수 있다.",
    "positive runtime·structural·trigger·negative compiler contracts를 isolated GUID temp에서 재현하고 cleanup할 수 있다.",
  ],
  prerequisites: [{ title: "오버로딩·생성자·this와 안전한 객체 구성", reason: "static/instance 초기화는 constructor processing, current receiver, field initializer와 완성 전 객체 노출 규칙 위에 놓이므로 생성 순서를 먼저 이해해야 합니다.", sessionSlug: "oop-04-overload-constructor-this" }],
  keywords: ["static field", "static method", "class variable", "instance variable", "preparation", "class initialization", "active use", "constant variable", "static initializer", "textual order", "forward reference", "class loader", "utility class", "dependency injection", "initialization-on-demand holder", "ExceptionInInitializerError", "NoClassDefFoundError", "AtomicInteger", "constant inlining"],
  chapters: [
    {
      id: "five-source-golden-audit",
      title: "inventory 세 원본과 companion mains 둘을 묶고 package warning과 scope warning을 분리 감사합니다",
      lead: "전체 package의 unrelated warning을 숨기지도, OOP05 다섯 파일의 clean compile에 잘못 귀속하지도 않습니다.",
      explanations: [
        "inventory는 Ex01_Static, Ex03_Static, Example 세 files를 직접 가리키지만 Ex01과 Ex03의 실행 evidence는 각각 Ex02_StaticMain과 Ex04_StaticMain에 있습니다. 선언만 읽고 output을 추측하지 않도록 두 companion mains를 filesRead/filesUsed에 포함해 범위5로 만듭니다.",
        "class04 전체26 package smoke는 exit0이지만 Ex09_Sub가 java.util.Random을 상속해 Serializable class가 serialVersionUID를 선언하지 않았다는 `compiler.warn.missing.SVUID` 하나를 냅니다. 이 file은 OOP05 범위 밖이므로 warning 존재와 책임 경계를 함께 기록합니다.",
        "범위5만 별도 classes directory에 compile하면 exit0·warning0이며 runnable mains는 Ex02, Ex04, Example 세 개이고 Ex01·Ex03은 compile-only declarations입니다.",
        "Ex02의 세 instance fields는 모두11이고 constructor마다 증가한 static num snapshots는 11·12·13입니다. 같은 code 한 벌을 실행한 결과이지 static method code만 ‘한 번 생성되고 instance method code는 객체별 생성’된다는 뜻은 아닙니다.",
        "Ex04는 Ex03의 static values 0·700·1300·70·1000을 먼저 읽고 new 뒤 instance s1 기본값0을 출력합니다. 이 숫자들은 source textual order와 preparation default를 함께 적용해야 설명됩니다.",
        "Example main의 active code는 class initialization 중 `static 1`, 이어 main body에서 `main s2` 두 줄만 출력합니다. 주석 처리된 new/s/m 호출의 더 긴 trace는 원본 golden으로 속이지 않고 별도 reconstruction 장에서 실행합니다.",
      ],
      concepts: [
        { term: "direct inventory source", definition: "inventory session entry가 sourceFiles에 직접 열거한 학습 근거입니다.", detail: ["OOP05에는 세 files입니다.", "실행 companion과 provenance를 구분합니다."] },
        { term: "companion main", definition: "선언 source를 실제 호출해 stdout evidence를 만드는 직접 실행 진입점입니다.", detail: ["Ex02와 Ex04입니다.", "sourceCoverage에 포함합니다."] },
        { term: "warning boundary", definition: "package 전체 smoke의 warning과 session scope 자체의 warning을 서로 다른 compile outputs로 귀속하는 검증 원칙입니다.", detail: ["package26 warning1입니다.", "scope5 warning0입니다."] },
      ],
      codeExamples: [{
        id: "java-original-oop05-audit",
        title: "class04 전체26과 범위5를 별도 GUID outputs에 compile하고 세 main을 exact summary로 실행합니다",
        language: "powershell",
        filename: "verify-original-oop05.ps1",
        purpose: "unrelated serial warning을 보존하면서 OOP05 원본의 static·instance 값과 Example trigger를 결정적으로 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop05 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $source = "src\com\java\class04"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scopeNames = @("Ex01_Static.java", "Ex02_StaticMain.java", "Ex03_Static.java", "Ex04_StaticMain.java", "Example.java")
  $scoped = @($scopeNames | ForEach-Object { Join-Path $source $_ })
  $packageOut = Join-Path $root "package classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $packageOut, $scopeOut -ErrorAction Stop | Out-Null

  $packageCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
  $packageExit = $LASTEXITCODE
  $packageText = $packageCompiler -join [Environment]::NewLine
  $warningCodes = @([regex]::Matches($packageText, 'compiler\.warn\.[A-Za-z0-9_.]+') | ForEach-Object Value)
  if ($packageExit -ne 0 -or $warningCodes.Count -ne 1 -or $warningCodes[0] -ne "compiler.warn.missing.SVUID") { throw "unexpected package diagnostics" }
  if ($packageText -notmatch '(?m)Ex09_Sub\.java:.*compiler\.warn\.missing\.SVUID') { throw "serial warning was not attributed to Ex09_Sub.java" }

  $scopeCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $scopeOut $scoped 2>&1)
  $scopeExit = $LASTEXITCODE
  if ($scopeExit -ne 0 -or $scopeCompiler.Count -ne 0) { throw "scope compile failed or warned" }
  $mainCount = @($scoped | Where-Object { [regex]::IsMatch([IO.File]::ReadAllText($_), 'public\s+static\s+void\s+main\s*\(') }).Count
  $compileOnlyCount = $scoped.Count - $mainCount
  if ($mainCount -ne 3 -or $compileOnlyCount -ne 2) { throw "unexpected runnable/compile-only source shape" }

  $out02 = @(& java "-Dfile.encoding=UTF-8" -cp $scopeOut com.java.class04.Ex02_StaticMain 2>&1); if ($LASTEXITCODE -ne 0) { throw "Ex02 failed" }
  $out04 = @(& java "-Dfile.encoding=UTF-8" -cp $scopeOut com.java.class04.Ex04_StaticMain 2>&1); if ($LASTEXITCODE -ne 0) { throw "Ex04 failed" }
  $outExample = @(& java "-Dfile.encoding=UTF-8" -cp $scopeOut com.java.class04.Example 2>&1); if ($LASTEXITCODE -ne 0) { throw "Example failed" }
  $separator = "--------------------------------"
  $expected02 = @("11", "11", $separator, "11", "12", $separator, "11", "13")
  $expected04 = @("0", "700", "1300", "70", "1000", "0")
  $expectedExample = @("static 1", "main s2")
  if (($out02 -join [Environment]::NewLine) -cne ($expected02 -join [Environment]::NewLine)) { throw "unexpected Ex02 stdout" }
  if (($out04 -join [Environment]::NewLine) -cne ($expected04 -join [Environment]::NewLine)) { throw "unexpected Ex04 stdout" }
  if (($outExample -join [Environment]::NewLine) -cne ($expectedExample -join [Environment]::NewLine)) { throw "unexpected Example stdout" }

  "spacePath=$($root.Contains(' ')),packageCompiled=$($all.Count),packageExit=$packageExit,packageWarnings=$($warningCodes.Count),packageWarningCode=$($warningCodes[0])"
  "scopedCompiled=$($scoped.Count),scopeExit=$scopeExit,scopeWarnings=$($scopeCompiler.Count),mains=$mainCount,compileOnly=$compileOnlyCount"
  "Ex02=lines:$($out02.Count),instance:$($out02[0])|$($out02[3])|$($out02[6]),shared:$($out02[1])|$($out02[4])|$($out02[7]),separators:$(@($out02 | Where-Object { $_ -eq $separator }).Count)"
  "Ex04=lines:$($out04.Count),values:$($out04 -join '|')"
  "Example=lines:$($outExample.Count),values:$($outExample -join '|')"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-12", explanation: "normalized OS temp의 공백 포함 직계 GUID root와 package/scope output을 따로 만듭니다." },
          { lines: "14-26", explanation: "package26의 Ex09_Sub serial warning1과 scope5 warning0을 source·diagnostic code·count로 검사하고 main3·compile-only2를 source에서 계산합니다." },
          { lines: "28-30", explanation: "scope classes에서 세 mains를 실행하고 각각 native exit0인지 확인합니다." },
          { lines: "31-37", explanation: "세 raw stdout arrays를 exact expected arrays와 먼저 비교합니다." },
          { lines: "39-43", explanation: "검증이 끝난 raw 결과를 값·행 수·separator 수와 동적 source count로 summary합니다." },
          { lines: "44-49", explanation: "resolved root의 parent가 temp base인지 재확인한 뒤 생성 root만 삭제합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root"], command: "pwsh -NoProfile -File verify-original-oop05.ps1" },
        output: { value: "spacePath=True,packageCompiled=26,packageExit=0,packageWarnings=1,packageWarningCode=compiler.warn.missing.SVUID\nscopedCompiled=5,scopeExit=0,scopeWarnings=0,mains=3,compileOnly=2\nEx02=lines:8,instance:11|11|11,shared:11|12|13,separators:2\nEx04=lines:6,values:0|700|1300|70|1000|0\nExample=lines:2,values:static 1|main s2", explanation: ["package26의 유일한 warning은 OOP05 밖 Ex09_Sub serial shape이고 compile은 성공합니다.", "범위5는 warning 없이 compile되며 main3·compile-only2입니다.", "Ex02·Ex04·Example outputs가 원본 active code와 정확히 일치합니다."] },
        experiments: [
          { change: "package smoke에서 Ex09_Sub만 제외합니다.", prediction: "package warning count가0이 됩니다.", result: "warning source가 OOP05 범위5가 아님을 확인하지만 공식 package audit에서는 제외 사실을 숨기지 않습니다." },
          { change: "scope에서 Ex02 또는 Ex04 companion을 뺍니다.", prediction: "선언 source는 compile될 수 있어도 해당 실행 evidence를 만들 수 없습니다.", result: "filesUsed에 direct companion mains가 필요한 이유를 확인합니다." },
          { change: "Example의 주석 네 줄을 활성화합니다.", prediction: "두 줄 golden이 열 줄 full trace로 바뀝니다.", result: "active 원본과 reconstruction을 별도 evidence로 유지합니다." },
        ],
        sourceRefs: ["java-class04-ex01", "java-class04-ex02", "java-class04-ex03", "java-class04-ex04", "java-class04-example", "jdk21-javac"],
      }],
      diagnostics: [
        { symptom: "class04 package compile에 warning이 있으니 OOP05 scope도 warning이 있다고 보고했다.", likelyCause: "package smoke와 scoped compile outputs를 합쳤습니다.", checks: ["diagnostic source file을 확인합니다.", "package와 scope의 -d·source lists를 분리합니다.", "exit code와 warning count를 별도 기록합니다."], fix: "package26 warning1과 scope5 warning0을 동시에 정확히 보고합니다.", prevention: "session audit마다 broad smoke와 atomic scope compile을 별도 tasks로 둡니다." },
        { symptom: "Example이 constructor/instance logs까지 출력한다고 golden을 작성했지만 실제 main은 두 줄이다.", likelyCause: "주석 처리된 호출을 active code처럼 읽었습니다.", checks: ["comment 제거 후 active main statements만 추출합니다.", "실제 stdout line count를 캡처합니다.", "reconstruction 여부를 label합니다."], fix: "원본 golden은 두 줄로 유지하고 full path는 별도 synthetic reconstruction으로 실행합니다.", prevention: "source comment assertion과 runtime evidence를 분리합니다." },
      ],
      expertNotes: ["compiler warning은 exit0과 동시에 존재할 수 있으므로 success boolean만으로 clean build를 주장하지 않습니다.", "원본 literals가 개인정보는 아니어도 공개 교육 자료에는 학습에 필요한 값과 구조만 옮기고 로컬 absolute path는 sources에 넣지 않습니다."],
    },
    {
      id: "static-instance-ownership",
      title: "instance state는 object마다, static state는 defining class identity마다 공유됩니다",
      lead: "‘static 영역에 한 번’이라는 말은 어느 class loader가 정의한 class인지까지 포함해야 정확합니다.",
      explanations: [
        "instance field는 new로 만들어진 각 object에 별도 storage가 있고 constructor는 그 receiver의 own 값을 바꿉니다. Ex02에서 s1·s2·s3의 su가 모두10에서11이 되는 이유입니다.",
        "static field는 특정 class가 선언한 class variable이며 일반적으로 해당 defining class identity에 하나가 있습니다. Ex01 constructor 세 번이 같은 num을 증가시켜 11·12·13 snapshots를 만듭니다.",
        "static을 ‘프로세스 전체 단 하나’로 일반화하면 여러 class loaders가 같은 binary name을 각각 정의하는 application server/plugin 환경을 설명하지 못합니다. runtime type identity는 binary name과 defining loader를 함께 봅니다.",
        "instance method code도 object마다 복제되어 만들어지는 것이 아닙니다. method declaration의 code와 호출 receiver/state를 구분해야 static method의 장점을 잘못된 memory 그림으로 설명하지 않습니다.",
        "shared mutable static은 모든 callers가 숨은 alias를 갖는 전역 상태입니다. test 순서 의존, request/user 간 누수, race와 cleanup 비용이 생기므로 constant가 아닌 state는 소유 lifecycle을 명시합니다.",
        "static member는 instance reference로도 문법상 접근 가능한 경우가 있지만 defining class name으로 qualification해야 ownership이 보입니다. `Ex01_Static.num`이 `s1.num`보다 의도를 정확히 드러냅니다.",
      ],
      concepts: [
        { term: "instance variable", definition: "class instance마다 새로 생겨 해당 object identity에 속하는 non-static field입니다.", detail: ["new마다 독립 storage입니다.", "receiver를 통해 접근합니다."] },
        { term: "class variable", definition: "static modifier로 선언되어 defining class identity에 연결되는 field입니다.", detail: ["objects가 공유합니다.", "class-loader 경계를 포함합니다."] },
        { term: "hidden global state", definition: "method signature에 드러나지 않지만 여러 callers가 읽고 바꿀 수 있는 mutable static state입니다.", detail: ["test isolation을 해칩니다.", "동시성 제어가 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-static-instance-ownership",
        title: "세 objects의 own 값과 하나의 shared counter snapshots를 나란히 검증합니다",
        language: "java",
        filename: "StaticOwnershipLab.java",
        purpose: "Ex01/02의 핵심을 synthetic Counter로 재현하고 instance/static ownership을 값의 변화로 구분합니다.",
        code: String.raw`public class StaticOwnershipLab {
    static final class Counter {
        int own = 10;
        static int shared = 10;
        Counter() {
            own++;
            shared++;
        }
    }

    public static void main(String[] args) {
        Counter first = new Counter(); int afterFirst = Counter.shared;
        Counter second = new Counter(); int afterSecond = Counter.shared;
        Counter third = new Counter(); int afterThird = Counter.shared;
        System.out.println("own=" + first.own + "|" + second.own + "|" + third.own);
        System.out.println("shared=" + afterFirst + "|" + afterSecond + "|" + afterThird);
        System.out.println("finalShared=" + Counter.shared);
    }
}`,
        walkthrough: [
          { lines: "2-9", explanation: "own은 instance field, shared는 Counter class variable이며 한 constructor가 receiver와 class state를 각각 증가시킵니다." },
          { lines: "12-14", explanation: "new 직후 shared 값을 local snapshots로 저장해 11→12→13 progression을 잃지 않습니다." },
          { lines: "15-17", explanation: "세 own values의 독립성과 shared snapshots·최종 값을 deterministic output으로 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("StaticOwnershipLab.java", "StaticOwnershipLab") },
        output: { value: "own=11|11|11\nshared=11|12|13\nfinalShared=13", explanation: ["각 object의 own은 자신만 한 번 증가해 모두11입니다.", "shared는 세 constructors가 같은 class variable을 증가시켜 snapshots 11·12·13입니다."] },
        experiments: [
          { change: "shared에서 static을 제거합니다.", prediction: "각 object의 shared도 모두11이고 `Counter.shared` class access는 compile되지 않습니다.", result: "소유권이 class에서 instance로 바뀝니다." },
          { change: "constructor 대신 static reset()이 shared=10을 수행하게 합니다.", prediction: "다른 object/caller가 보던 값도 동시에10으로 바뀝니다.", result: "mutable static reset이 전역 side effect임을 확인합니다." },
          { change: "한 test JVM에서 main을 반사 호출해 상태 reset 없이 두 번 실행합니다.", prediction: "두 번째 snapshots가14부터 시작할 수 있습니다.", result: "static state가 test 순서와 JVM lifecycle에 결합됩니다." },
        ],
        sourceRefs: ["java-class04-ex01", "java-class04-ex02", "jls-static-fields", "jls-class-loader-identity"],
      }],
      diagnostics: [
        { symptom: "각 test를 독립 실행하면 통과하지만 suite에서는 shared counter가 예상보다 크다.", likelyCause: "같은 class-loader/JVM에서 mutable static state가 이전 test로부터 남았습니다.", checks: ["static assignments와 reset hooks를 찾습니다.", "test execution order·fork policy를 확인합니다.", "state owner lifecycle을 적습니다."], fix: "state를 test별 instance dependency로 옮기거나 명시 fixture lifecycle에서 reset합니다.", prevention: "mutable static을 피하고 independent-order test를 실행합니다." },
        { symptom: "s1.shared와 s2.shared가 서로 다른 값일 것이라 예상했다.", likelyCause: "instance qualifier가 static ownership도 object별로 바꾼다고 오해했습니다.", checks: ["field declaration의 static modifier를 봅니다.", "defining class를 확인합니다.", "class-qualified access로 바꿉니다."], fix: "Counter.shared처럼 class owner를 명시하고 per-object 값이 필요하면 non-static field로 모델링합니다.", prevention: "compiler static-access warning/style rule을 활성화합니다." },
      ],
      expertNotes: ["static field는 heap/JVM 구현 내부 배치를 source-level ‘method area 주소’로 단정하지 않고 JLS의 class variable semantics로 설명합니다.", "class-loader별 static 복제는 isolation 도구가 될 수 있지만 loader leak과 type incompatibility라는 다른 비용을 만듭니다."],
    },
    {
      id: "static-method-no-receiver-explicit-object",
      title: "static method에는 implicit receiver가 없지만 parameter로 받은 명시 객체의 instance state는 사용할 수 있습니다",
      lead: "‘instance가 아직 안 만들어져서’가 아니라 어떤 object를 뜻하는 this가 없어서 unqualified access가 거부됩니다.",
      explanations: [
        "instance method invocation에는 특정 receiver가 있고 simple instance field access는 그 receiver의 this.field로 해석될 수 있습니다. static method는 class와 관련해 호출되며 current instance·implicit this가 없습니다.",
        "따라서 Ex01 play02에서 su를 simple name으로 읽는 코드는 compile되지 않습니다. 하지만 `Account account` parameter를 받고 `account.balance`를 읽는 것은 대상 object가 명시됐으므로 정상입니다.",
        "static method가 instance field를 ‘절대 사용할 수 없다’고 외우면 explicit object, collection of instances, factory parameter를 설명하지 못합니다. 금지되는 것은 implicit current-instance access입니다.",
        "static method는 static fields를 simple name으로 읽을 수 있지만 mutable shared state 의존은 signature에 나타나지 않습니다. 가능하면 value를 parameter로 받거나 collaborator instance가 소유하게 해 dependency를 드러냅니다.",
        "this와 super도 static context에서 사용할 수 없습니다. 어느 instance인지 compiler가 추론하는 문제가 아니라 language가 current receiver를 제공하지 않는 context입니다.",
        "stateless calculation은 static utility가 자연스러울 수 있지만 clock, repository, network client처럼 교체·lifecycle·configuration이 필요한 기능을 static method로 고정하면 test와 composition이 어려워집니다.",
      ],
      concepts: [
        { term: "implicit receiver", definition: "instance method body에서 simple instance-member access가 기준으로 삼는 current object입니다.", detail: ["this로 명시할 수 있습니다.", "static context에는 없습니다."] },
        { term: "explicit object reference", definition: "parameter·local·field expression이 어느 instance의 member를 읽을지 직접 지정하는 reference입니다.", detail: ["static method에서도 사용할 수 있습니다.", "null policy가 필요합니다."] },
        { term: "stateless utility", definition: "호출 사이 mutable state를 보관하지 않고 입력만으로 결과를 계산하는 class-level function 모음입니다.", detail: ["static이 적합할 수 있습니다.", "외부 dependency는 instance service를 검토합니다."] },
      ],
      codeExamples: [{
        id: "java-static-explicit-object-access",
        title: "static 계산이 두 명시 Account objects를 받고 instance method와 같은 값을 냅니다",
        language: "java",
        filename: "StaticReceiverLab.java",
        purpose: "implicit this 부재와 explicit receiver access 가능성을 같은 state에서 비교합니다.",
        code: String.raw`public class StaticReceiverLab {
    static final class Account {
        private final int balance;
        private static int fee = 100;
        Account(int balance) { this.balance = balance; }
        static int afterFee(Account account) {
            if (account == null) throw new IllegalArgumentException("account");
            return account.balance - fee;
        }
        int afterFee() { return this.balance - fee; }
    }

    public static void main(String[] args) {
        Account first = new Account(1300);
        Account second = new Account(1800);
        System.out.println("explicit=" + Account.afterFee(first) + "|" + Account.afterFee(second));
        System.out.println("instance=" + first.afterFee() + "|" + second.afterFee());
        System.out.println("sharedFee=" + Account.fee);
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "balance는 object별 final field이고 fee는 Account class가 공유하는 static field입니다." },
          { lines: "6-10", explanation: "static method는 implicit this 대신 account parameter를 qualified receiver로 사용하고 instance method는 this.balance를 사용합니다." },
          { lines: "14-18", explanation: "같은 두 objects로 static/instance results와 shared fee를 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("StaticReceiverLab.java", "StaticReceiverLab") },
        output: { value: "explicit=1200|1700\ninstance=1200|1700\nsharedFee=100", explanation: ["static method도 명시 Account reference를 통해 각 balance를 읽습니다.", "instance method는 implicit receiver의 같은 balance를 사용해 결과가 같습니다."] },
        experiments: [
          { change: "static afterFee에서 `return balance - fee`로 바꿉니다.", prediction: "compiler.err.non-static.cant.be.ref입니다.", result: "static context에는 balance의 implicit receiver가 없습니다." },
          { change: "Account.afterFee(null)을 호출합니다.", prediction: "정의한 IllegalArgumentException(account)입니다.", result: "explicit reference API는 null boundary도 명시해야 합니다." },
          { change: "fee를 constructor parameter의 instance final field로 옮깁니다.", prediction: "accounts마다 다른 fee policy를 가질 수 있고 hidden global dependency가 사라집니다.", result: "configuration ownership이 class에서 object로 이동합니다." },
        ],
        sourceRefs: ["java-class04-ex01", "jls-static-methods", "jls-static-context"],
      }],
      diagnostics: [
        { symptom: "static method에서 instance field를 읽을 수 없으니 아직 object가 생성되지 않은 것으로 설명했다.", likelyCause: "object 존재 여부와 current receiver 부재를 혼동했습니다.", checks: ["method parameter에 object reference가 있는지 봅니다.", "this 사용 가능 context인지 확인합니다.", "qualified access와 simple access를 비교합니다."], fix: "implicit receiver가 없다고 설명하고 필요한 object를 parameter로 명시합니다.", prevention: "static-context compile fixture와 explicit-object positive fixture를 한 쌍으로 둡니다." },
        { symptom: "static helper를 instance reference로 호출해 어느 object state를 쓸지 혼란스럽다.", likelyCause: "Java가 허용하는 instance-qualified static invocation을 ownership 표현으로 사용했습니다.", checks: ["method declaration static 여부를 봅니다.", "body가 receiver state를 쓰는지 확인합니다.", "IDE/compiler warning을 확인합니다."], fix: "DefiningType.method 형태로 호출하고 object state가 필요하면 parameter 또는 instance method를 사용합니다.", prevention: "static member access를 class-qualified로 강제하는 style rule을 둡니다." },
      ],
      expertNotes: ["static synchronized method의 monitor는 Class object이고 instance synchronized method의 monitor는 receiver이므로 static/instance ownership 차이가 locking contract에도 이어집니다.", "explicit object parameter는 dependency를 조금 드러내지만 static global collaborators를 body 안에서 읽는다면 testability 문제는 남습니다."],
    },
    {
      id: "loading-linking-preparation-initialization",
      title: "loading·linking preparation·initialization은 서로 다른 단계이며 static initializer는 preparation이 아니라 initialization에서 실행됩니다",
      lead: "‘JVM 시작 때 static이 미리 만들어진다’는 설명을 class별 lifecycle과 first active use 규칙으로 교정합니다.",
      explanations: [
        "loading은 class/interface binary representation을 찾아 Class object와 연결하는 과정입니다. linking은 verification, preparation, optional resolution을 포함하며 JVM implementation은 resolution timing을 늦출 수 있습니다.",
        "JLS의 실행 모델에서 preparation은 class variables를 만들고 각 type의 default value로 둡니다. constant variable의 선언 initializer도 이때 Java source expression으로 실행되는 것이 아니라 class initialization 절차의 step 6에서 먼저 값이 설정되므로, preparation과 initialization을 합치면 안 됩니다.",
        "initialization은 static field initializers와 static initializers를 textual order로 실행해 class를 application이 의도한 state로 전환합니다. class initialization은 active-use trigger 직전에 수행됩니다.",
        "Class.forName(name,false,loader)는 target을 initialize하지 않고 Class object를 얻는 API입니다. 예제는 afterLoad events0을 보여 단계 분리를 관찰하지만 ordinary Java로 preparation의 중간 default 값을 억지로 읽어 trigger 없이 공개하지 않습니다.",
        "Class.forName(name,true,loader)는 initialization을 요청해 Target initialize method와 static block 역할을 실행합니다. 완료 뒤 events1과 value7을 관찰합니다.",
        "한 class의 initialization은 JVM이 synchronization하고 superclass/default-method superinterfaces 순서를 관리합니다. ‘static은 프로그램 시작 시 전부 실행’이 아니라 각 class identity의 initialization state machine으로 이해합니다.",
      ],
      concepts: [
        { term: "loading", definition: "binary name에 해당하는 class/interface representation을 찾아 JVM의 runtime Class와 연결하는 단계입니다.", detail: ["class loader가 관여합니다.", "initialization과 다릅니다."] },
        { term: "preparation", definition: "verification 뒤 class variables를 생성하고 default values 등 JVM 수준 초기 상태를 정하는 linking 단계입니다.", detail: ["일반 static blocks를 실행하지 않습니다.", "resolution과 구분합니다."] },
        { term: "initialization", definition: "static field initializers와 static blocks를 textual order로 실행하는 class/interface lifecycle 단계입니다.", detail: ["active use 직전에 일어납니다.", "한 class identity에 대해 성공 시 한 번입니다."] },
      ],
      codeExamples: [{
        id: "java-load-without-init-then-initialize",
        title: "Class.forName false와 true 사이에서 Target initializer event가 0→1로 바뀝니다",
        language: "java",
        filename: "PreparationInitializationLab.java",
        purpose: "class를 얻는 것과 static initialization을 실행하는 것이 다른 operations임을 stdout 순서로 검증합니다.",
        code: String.raw`public class PreparationInitializationLab {
    static int events;

    static final class Target {
        static int value = initialize();
        static int initialize() {
            events++;
            System.out.println("<clinit>");
            return 7;
        }
    }

    public static void main(String[] args) throws Exception {
        String name = PreparationInitializationLab.class.getName() + "$Target";
        ClassLoader loader = PreparationInitializationLab.class.getClassLoader();
        Class<?> loaded = Class.forName(name, false, loader);
        System.out.println("loaded=" + (loaded != null) + ",events=" + events);
        Class.forName(name, true, loader);
        System.out.println("initialized=" + events + ",value=" + Target.value);
    }
}`,
        walkthrough: [
          { lines: "2-10", explanation: "outer events는 관찰 counter이고 Target value initializer는 event 증가·marker·값7을 만듭니다." },
          { lines: "13-17", explanation: "binary name과 defining loader로 initialize=false lookup을 수행한 뒤 events0을 확인합니다." },
          { lines: "18-19", explanation: "initialize=true가 <clinit> marker를 낸 뒤 value7과 events1을 관찰합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("PreparationInitializationLab.java", "PreparationInitializationLab") },
        output: { value: "loaded=true,events=0\n<clinit>\ninitialized=1,value=7", explanation: ["initialize=false로 Class를 얻은 뒤에도 Target initializer event는0입니다.", "initialize=true 호출 사이에 <clinit>이 한 번 실행되고 value는7입니다."] },
        experiments: [
          { change: "첫 Class.forName의 initialize를 true로 바꿉니다.", prediction: "<clinit>이 loaded line보다 먼저 출력되고 events는1입니다.", result: "API flag가 initialization 요청을 바꿉니다." },
          { change: "두 번째 Class.forName(true)를 한 번 더 호출합니다.", prediction: "새 <clinit> 없이 initialized state를 재사용합니다.", result: "성공한 class initialization은 같은 class identity에 반복 실행되지 않습니다." },
          { change: "다른 defining class loader로 같은 binary를 정의합니다.", prediction: "별도 class identity와 별도 static initialization state가 생길 수 있습니다.", result: "이 실험은 후반 class-loader 장에서 custom loader contract로 확장합니다." },
        ],
        sourceRefs: ["jls-loading", "jls-linking", "jls-preparation", "jls-init-triggers", "jls-init-procedure", "java-class-forname"],
      }],
      diagnostics: [
        { symptom: "Class object를 얻었으니 static block도 이미 실행됐다고 예상했다.", likelyCause: "loading과 initialization을 같은 단계로 보았습니다.", checks: ["Class.forName initialize flag를 확인합니다.", "active-use operation이 있었는지 봅니다.", "initializer marker와 event count를 기록합니다."], fix: "load/link와 initialize를 별도 lifecycle facts로 기록합니다.", prevention: "initialize=false/true pair test를 유지합니다." },
        { symptom: "preparation에서 static field initializer가 source 값으로 모두 설정된다고 설명했다.", likelyCause: "default-value allocation과 class initialization 절차를 합쳤습니다.", checks: ["field가 constant variable인지 확인합니다.", "initializer expression/static block side effect를 찾습니다.", "JLS 12.3.2와 12.4.2 step 6·9를 분리해 읽습니다."], fix: "preparation은 모든 class variable의 default value, initialization step 6은 constant variables, step 9는 나머지 textual initializers와 static blocks로 교정합니다.", prevention: "단계별 input·side effect 표를 둡니다." },
      ],
      expertNotes: ["Class.forName(false)는 initialization non-trigger의 관찰 도구이지 preparation 중간 상태를 정상 API로 읽게 해 주는 우회로가 아닙니다.", "resolution은 eager/lazy implementation 선택이 있어 loading→linking→initialization을 모든 symbol resolution의 단순 일렬 timestamp로 과장하지 않습니다."],
    },
    {
      id: "active-use-trigger-and-nontrigger",
      title: "class initialization은 first active use가 trigger하며 compile-time constant·class literal·array 생성은 같은 trigger가 아닙니다",
      lead: "source에 type 이름이 등장했다는 이유만으로 initialization됐다고 판단하지 않습니다.",
      explanations: [
        "class T의 instance 생성, T가 선언한 static method invocation, T가 선언한 non-constant static field의 읽기·대입, 일부 reflection calls는 T initialization을 trigger합니다.",
        "static final primitive/String field라도 constant expression으로 초기화되어 constant variable이면 client code에 값이 포함될 수 있고 그 읽기는 declaring class initialization을 trigger하지 않습니다.",
        "Target.CONSTANT=7 출력 전 static block marker가 없는 이유는 compile-time constant read이기 때문입니다. 그 뒤 boxed Integer field를 읽으면 constant variable이 아니므로 Target initialization이 먼저 일어나 `<clinit>`이 출력됩니다.",
        "T.class class literal, T[] array creation, null reference 선언은 그 자체로 T initialization trigger가 아닙니다. loading/linking이 일어날 수 있는지와 initialization trigger인지도 분리합니다.",
        "SubclassName.parentDeclaredStatic을 읽으면 실제 declaring class만 initialize되고 subclass는 initialize되지 않을 수 있습니다. qualifier spelling보다 resolved declaration owner가 중요합니다.",
        "trigger를 의도적으로 이용한 hidden side effect는 code 이해를 어렵게 합니다. static initialization은 작고 deterministic하게 두고 external I/O·환경 의존은 명시 bootstrap lifecycle로 옮깁니다.",
      ],
      concepts: [
        { term: "active use", definition: "JLS가 class/interface initialization을 요구하는 instance 생성·static invocation·non-constant static field 사용 등의 operation입니다.", detail: ["first occurrence 직전에 initialize합니다.", "선언 owner를 봅니다."] },
        { term: "constant variable", definition: "final primitive 또는 String이며 constant expression으로 초기화된 variable입니다.", detail: ["읽기가 initialization non-trigger일 수 있습니다.", "client에 inline될 수 있습니다."] },
        { term: "initialization non-trigger", definition: "type을 언급하지만 그 자체로 해당 class의 static initializers 실행을 요구하지 않는 operation입니다.", detail: ["class literal·array 생성 예가 있습니다.", "loading과 동일 개념이 아닙니다."] },
      ],
      codeExamples: [{
        id: "java-static-active-use-trigger",
        title: "constant read는 marker 없이 지나가고 boxed static field read 직전에만 <clinit>이 실행됩니다",
        language: "java",
        filename: "StaticTriggerLab.java",
        purpose: "compile-time constant non-trigger와 non-constant static field active trigger의 stdout 순서를 고정합니다.",
        code: String.raw`public class StaticTriggerLab {
    static final class Target {
        static final int CONSTANT = 7;
        static final Integer BOXED = 7;
        static { System.out.println("<clinit>"); }
    }

    public static void main(String[] args) {
        System.out.println("before");
        System.out.println("constant:" + Target.CONSTANT);
        System.out.println("middle");
        System.out.println("boxed:" + Target.BOXED);
        System.out.println("after");
    }
}`,
        walkthrough: [
          { lines: "2-6", explanation: "primitive constant variable과 boxed non-constant field를 같은 Target에 두고 static marker를 선언합니다." },
          { lines: "9-11", explanation: "CONSTANT read는 <clinit> 없이 before·constant·middle까지 진행합니다." },
          { lines: "12-13", explanation: "BOXED read가 first active use라 println argument 평가 중 <clinit>이 먼저 실행된 뒤 boxed line이 나옵니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("StaticTriggerLab.java", "StaticTriggerLab") },
        output: { value: "before\nconstant:7\nmiddle\n<clinit>\nboxed:7\nafter", explanation: ["CONSTANT read는 Target initialization을 trigger하지 않습니다.", "BOXED read 직전에 Target static block이 한 번 실행됩니다."] },
        experiments: [
          { change: "BOXED를 int로 바꾸되 initializer를 `Integer.parseInt(\"7\")`로 둡니다.", prediction: "final int여도 constant expression이 아니므로 read가 initialization을 trigger합니다.", result: "final/static 모양보다 constant-variable 조건이 중요합니다." },
          { change: "boxed line 전에 `System.out.println(Target.class.getName())`를 넣습니다.", prediction: "class name은 출력되지만 <clinit>은 여전히 BOXED read 직전에 나옵니다.", result: "class literal은 initialization non-trigger입니다." },
          { change: "boxed line 전에 `new Target()`를 넣습니다.", prediction: "instance creation 직전에 <clinit>이 실행되고 later BOXED read에는 반복되지 않습니다.", result: "instance creation은 active-use trigger입니다." },
        ],
        sourceRefs: ["java-class04-example", "jls-init-triggers", "jls-constant-variable", "jls-constant-expressions"],
      }],
      diagnostics: [
        { symptom: "Target.CONSTANT를 읽었는데 static block logging이 나오지 않는다.", likelyCause: "constant variable read는 class initialization trigger가 아닙니다.", checks: ["field가 final primitive/String인지 봅니다.", "initializer가 constant expression인지 확인합니다.", "client bytecode에 literal이 포함됐는지 javap로 볼 수 있습니다."], fix: "side effect trigger로 constant read를 사용하지 않고 명시 initialize/bootstrap method를 호출합니다.", prevention: "static initialization side effect에 의존한 API를 피합니다." },
        { symptom: "Subclass.CONSTANT/field를 읽어 subclass block도 실행될 것이라 예상했다.", likelyCause: "qualifier 이름과 실제 declaring class를 혼동했습니다.", checks: ["field declaration owner를 찾습니다.", "constant 여부를 확인합니다.", "parent/subclass markers를 분리합니다."], fix: "resolved declaring class의 active-use 규칙으로 계산합니다.", prevention: "inherited static은 defining class로 qualification합니다." },
      ],
      expertNotes: ["constant non-trigger와 binary inlining은 연결되지만 initialization 문제와 library version skew 문제를 별도 assertions로 둡니다.", "reflection API마다 initialization 여부가 다를 수 있으므로 ‘reflection은 모두 trigger’라고 일반화하지 않고 해당 API contract를 확인합니다."],
    },
    {
      id: "textual-order-forward-reference",
      title: "static field initializers와 blocks는 source textual order로 실행되며 forward read와 assignment 규칙이 다릅니다",
      lead: "Ex03의 s5·s6은 declaration 위치와 initializer 유무 때문에 서로 다른 최종값을 갖습니다.",
      explanations: [
        "preparation 뒤 일반 static fields는 이미 default0입니다. initialization은 source에 적힌 static field initializer와 static block을 위에서 아래로 실행합니다.",
        "Ex03 s3는 block에서0→700, s4는 declaration initializer300 뒤 block에서1300이 됩니다. 앞에서 실행된 assignment가 뒤 initializer를 만나면 다시 덮일 수 있습니다.",
        "s5는 declaration보다 앞선 block에서 simple-name assignment70이 허용되고, 뒤 declaration에 initializer가 없으므로 preparation default를 다시 대입하지 않아70이 유지됩니다.",
        "s6는 block에서10을 받지만 뒤의 declaration initializer `=1000`이 실행되어 최종1000입니다. ‘뒤 declaration 줄이 default0으로 reset’되는 것이 아니라 명시 initializer가 덮습니다.",
        "같은 class에서 textually later static field를 simple name으로 읽는 것은 illegal forward reference일 수 있지만 assignment 왼쪽으로 쓰는 것은 허용되는 경우가 있습니다. scope에 있다는 사실과 initializer-time reference restriction을 구분합니다.",
        "qualified name을 이용해 forward-read restriction을 우회하는 arcane code도 가능하지만 default 중간값 관찰과 initialization cycle을 만들기 쉬워 production design으로 권장하지 않습니다.",
      ],
      concepts: [
        { term: "textual order", definition: "static field initializers와 static blocks가 class source에 나타난 순서대로 실행되는 규칙입니다.", detail: ["앞 assignment를 뒤 initializer가 덮을 수 있습니다.", "declaration grouping도 source order를 갖습니다."] },
        { term: "illegal forward reference", definition: "field initializer/static block에서 textually later class variable을 특정 simple-name read 형태로 참조해 발생하는 compile-time 오류입니다.", detail: ["scope와 별도 제한입니다.", "assignment와 read가 다릅니다."] },
        { term: "default retention", definition: "initializer 없는 field declaration은 initialization 중 새 assignment를 실행하지 않아 앞 block이 넣은 값을 그대로 유지하는 현상입니다.", detail: ["s5가70을 유지합니다.", "preparation default를 다시 쓰지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-static-textual-order",
        title: "block 전후 fields가 0·7·70·10을 거쳐 최종 7·7·70·1000이 되는 과정을 표시합니다",
        language: "java",
        filename: "StaticTextualOrderLab.java",
        purpose: "Ex03의 s5/s6 패턴을 synthetic names로 재현하고 declaration-without-initializer와 later initializer 차이를 검증합니다.",
        code: String.raw`public class StaticTextualOrderLab {
    static int mark(String label, int value) {
        System.out.println(label + ":" + value);
        return value;
    }

    static final class Order {
        static int first;
        static int second = mark("field-second", 7);
        static {
            System.out.println("block:first=" + first + ",second=" + second);
            first = second;
            later = 70;
            overwritten = 10;
        }
        static int later;
        static int overwritten = 1000;
    }

    public static void main(String[] args) {
        System.out.println("values=" + Order.first + "|" + Order.second + "|"
                + Order.later + "|" + Order.overwritten);
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "field initializer의 위치를 stdout으로 보이게 하는 marker helper입니다." },
          { lines: "7-18", explanation: "first default0, second initializer7, block assignments, initializer 없는 later, 뒤 initializer1000의 source 순서를 구성합니다." },
          { lines: "21-23", explanation: "Order first active use가 모든 static initialization을 완료한 뒤 네 final values를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("StaticTextualOrderLab.java", "StaticTextualOrderLab") },
        output: { value: "field-second:7\nblock:first=0,second=7\nvalues=7|7|70|1000", explanation: ["second initializer가 block보다 먼저 실행되고 first는 그때 default0입니다.", "later는 block의70을 유지하지만 overwritten은 뒤 initializer1000이 block의10을 덮습니다."] },
        experiments: [
          { change: "block 첫 줄에서 `System.out.println(later)`를 simple name으로 추가합니다.", prediction: "compiler.err.illegal.forward.ref입니다.", result: "assignment 허용과 forward read 금지를 구분합니다." },
          { change: "later declaration을 `static int later = 700`으로 바꿉니다.", prediction: "block의70 뒤 initializer700이 실행되어 final later는700입니다.", result: "declaration initializer가 뒤에서 덮습니다." },
          { change: "overwritten declaration의 `=1000`을 제거합니다.", prediction: "block이 넣은10이 유지됩니다.", result: "initializer 없는 declaration은 preparation default를 다시 쓰지 않습니다." },
        ],
        sourceRefs: ["java-class04-ex03", "java-class04-ex04", "jls-static-initializers", "jls-forward-reference", "jls-init-triggers"],
      }],
      diagnostics: [
        { symptom: "s5는 declaration 뒤에 있으니 block assignment70 뒤 다시0이 될 것이라 계산했다.", likelyCause: "initializer 없는 declaration이 initialization 중 default assignment를 다시 실행한다고 생각했습니다.", checks: ["preparation default와 source initializer를 분리합니다.", "declaration에 `=`가 있는지 봅니다.", "block/declaration textual order를 적습니다."], fix: "s5 declaration은 runtime initializer가 없어70을 유지한다고 교정합니다.", prevention: "각 field에 default→initializer/block transitions 표를 만듭니다." },
        { symptom: "s6가 block의10이어야 한다고 예상했지만1000이다.", likelyCause: "block 뒤에 있는 field initializer를 놓쳤습니다.", checks: ["class body를 위에서 아래로 읽습니다.", "동일 field의 모든 assignments를 찾습니다.", "first active use 이전/이후 output을 구분합니다."], fix: "later `static int s6=1000`이 initialization 순서에서10을 덮는다고 설명합니다.", prevention: "static initialization write가 여러 곳에 흩어지지 않게 canonical initializer를 둡니다." },
      ],
      expertNotes: ["forward-reference restriction을 qualification으로 우회하는 코드는 compile 가능 여부와 유지보수 안전성을 구분해야 합니다.", "static initialization cycle에서 다른 class의 아직 default인 field를 보는 문제는 compile-time forward reference가 아니라 runtime initialization ordering 문제일 수 있습니다."],
    },
    {
      id: "instance-field-block-constructor-order",
      title: "static 초기화는 class당 한 번, instance field·block·constructor는 new마다 textual order로 실행됩니다",
      lead: "같은 중괄호라도 static initializer와 instance initializer는 trigger와 반복 횟수가 완전히 다릅니다.",
      explanations: [
        "첫 active use가 일어나면 class initialization이 먼저 완료됩니다. 그때 static field initializer와 static block은 source textual order로 한 번 실행되고, 같은 defining class identity가 정상 초기화된 뒤에는 두 번째 new가 이를 반복하지 않습니다.",
        "각 new는 새 object storage를 default value로 만든 뒤 superclass constructor processing을 거칩니다. 현재 class 차례가 오면 instance field initializers와 instance initializer blocks가 source에 나타난 순서로 실행되고 마지막에 선택된 constructor body가 실행됩니다.",
        "instance initializer는 모든 constructors 앞에 공통으로 삽입되는 별도 method가 아닙니다. JLS의 instance creation 절차에서 현재 class의 field initializers와 initializer blocks가 실행되는 단계라고 이해해야 this() delegation에서 한 번만 실행되는 이유도 설명됩니다.",
        "static field가 object 안에 있고 new할 때 복사된다는 그림은 틀립니다. static state는 class initialization 경로에, instance state는 object construction 경로에 각각 두어 두 개의 시간축을 분리합니다.",
        "constructor body에서 보이는 instance fields는 이미 current class field/block initialization을 마친 값입니다. 다만 superclass constructor가 overridable method를 호출해 아직 current class initialization 전 receiver를 관찰하는 위험은 이전 세션의 construction escape 문제와 연결됩니다.",
        "초기화 log 자체를 production 기능으로 만들면 호출 순서와 test isolation에 강하게 결합됩니다. 학습 trace에는 유용하지만 실제 설계에서는 explicit lifecycle과 관찰 가능한 상태 계약을 선호합니다.",
      ],
      concepts: [
        { term: "class initialization frequency", definition: "정상 완료된 class initialization이 defining class identity마다 한 번 실행되는 성질입니다.", detail: ["첫 active use 전에 실행됩니다.", "두 번째 new에는 반복되지 않습니다."] },
        { term: "instance initialization frequency", definition: "instance field initializer와 instance initializer block이 성공적인 각 new의 receiver마다 실행되는 성질입니다.", detail: ["새 object마다 반복됩니다.", "constructor body보다 앞섭니다."] },
        { term: "two timelines", definition: "class lifecycle의 static 초기화와 object lifecycle의 instance 초기화를 별도 순서표로 계산하는 정신 모델입니다.", detail: ["class timeline은 한 번입니다.", "object timeline은 new마다 생깁니다."] },
      ],
      codeExamples: [{
        id: "java-static-versus-instance-order",
        title: "첫 new와 두 번째 new의 marker 차이로 class당 한 번과 object당 한 번을 증명합니다",
        language: "java",
        filename: "StaticVsInstanceOrderLab.java",
        purpose: "static fields/blocks와 instance fields/blocks/constructor의 정확한 실행 순서 및 반복 횟수를 한 stdout 계약으로 고정합니다.",
        code: String.raw`public class StaticVsInstanceOrderLab {
    static int mark(String text, int value) {
        System.out.println(text);
        return value;
    }

    static final class Target {
        static int first = mark("staticField1", 1);
        static { System.out.println("staticBlock"); }
        static int second = mark("staticField2", 2);

        int own = mark("instanceField", 3);
        { System.out.println("instanceBlock"); }
        Target() { System.out.println("constructor"); }
    }

    public static void main(String[] args) {
        System.out.println("beforeNew");
        new Target();
        System.out.println("secondNew");
        new Target();
        System.out.println("end");
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "field initializer가 실행되는 위치를 deterministic marker로 노출하면서 값을 그대로 반환합니다." },
          { lines: "8-10", explanation: "두 static fields 사이에 static block을 두어 class initialization의 source order를 보입니다." },
          { lines: "12-14", explanation: "instance field, initializer block, constructor body의 object별 순서를 구성합니다." },
          { lines: "18-23", explanation: "첫 new 뒤 두 번째 new를 실행해 static markers는 한 번, instance markers는 두 번인지 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("StaticVsInstanceOrderLab.java", "StaticVsInstanceOrderLab") },
        output: { value: "beforeNew\nstaticField1\nstaticBlock\nstaticField2\ninstanceField\ninstanceBlock\nconstructor\nsecondNew\ninstanceField\ninstanceBlock\nconstructor\nend", explanation: ["beforeNew 뒤 첫 active use인 new가 static 세 markers를 source order로 실행합니다.", "각 new는 instanceField→instanceBlock→constructor를 실행하지만 두 번째 new에는 static markers가 없습니다."] },
        experiments: [
          { change: "첫 new 앞에 `System.out.println(Target.second)`를 넣습니다.", prediction: "그 field read 직전에 static 세 markers가 나오고 첫 new에는 instance markers만 나옵니다.", result: "active use의 종류가 달라도 class initialization은 정상 완료 뒤 반복되지 않습니다." },
          { change: "instanceBlock을 instanceField 선언 위로 옮깁니다.", prediction: "각 new에서 instanceBlock이 instanceField보다 먼저 나옵니다.", result: "현재 class의 instance initializers도 source textual order를 따릅니다." },
          { change: "두 번째 new를 제거합니다.", prediction: "static markers는 그대로 한 번이고 instance marker 묶음만 한 번으로 줄어듭니다.", result: "class 횟수와 object 횟수를 독립적으로 셉니다." },
        ],
        sourceRefs: ["java-class04-example", "jls-init-triggers", "jls-init-procedure", "jls-instance-creation", "jls-instance-initializers", "jls-field-initialization"],
      }],
      diagnostics: [
        { symptom: "두 번째 new에서도 static block이 실행될 것으로 예상했다.", likelyCause: "object construction과 class initialization을 같은 반복 단위로 보았습니다.", checks: ["marker를 static/instance로 분리합니다.", "첫 active use 위치를 찾습니다.", "defining class loader가 같은지 확인합니다."], fix: "정상 class initialization은 class identity당 한 번, instance initialization은 new마다 한 번으로 다시 계산합니다.", prevention: "class timeline과 각 object timeline을 별도 표로 작성합니다." },
        { symptom: "constructor log가 instance field/block보다 먼저 나올 것으로 예상했다.", likelyCause: "constructor invocation과 constructor body 실행을 구분하지 않았습니다.", checks: ["superclass processing을 먼저 표시합니다.", "current-class field/block source order를 적습니다.", "마지막에 constructor body를 둡니다."], fix: "current class의 instance initializers 뒤에 constructor body를 배치합니다.", prevention: "‘new 호출’ 한 단어 대신 allocation→super→initializers→body 단계를 씁니다." },
      ],
      comparisons: [{ title: "초기화 단위 비교", options: [
        { name: "static field/block", chooseWhen: "class identity당 한 번 필요한 불변 metadata를 구성할 때", avoidWhen: "request별 상태나 실패 재시도가 필요한 외부 자원을 만들 때", tradeoffs: ["한 번 계산", "실패 시 class unusable"] },
        { name: "instance field/block", chooseWhen: "모든 constructors에 공통인 object별 초기값이 필요할 때", avoidWhen: "복잡한 validation 흐름을 숨길 때", tradeoffs: ["new마다 독립", "순서 분산 가능"] },
        { name: "constructor body", chooseWhen: "arguments를 받아 invariant를 완성할 때", avoidWhen: "전역 등록·thread 시작 등 완성 전 this 노출이 생길 때", tradeoffs: ["호출 계약 명확", "overload delegation 설계 필요"] },
      ] }],
      expertNotes: ["class initialization lock과 object monitor는 같은 개념이 아니며 static synchronized와 initialization protocol도 분리해 설명합니다.", "class redefinition·custom loader 환경에서는 ‘JVM 프로세스에서 영원히 한 번’이 아니라 해당 Class object의 lifecycle로 범위를 한정합니다."],
    },
    {
      id: "example-full-trace-reconstruction",
      title: "Example의 주석 네 호출을 활성화한 별도 reconstruction으로 열 줄 trace를 한 단계씩 복원합니다",
      lead: "원본 active golden 두 줄을 보존한 채, 주석 속 학습 의도를 별도 실행 가능한 예제로 확장합니다.",
      explanations: [
        "원본 Example main은 네 호출이 주석 처리되어 실제 출력은 `static 1`, `main s2`뿐입니다. 주석을 읽었다는 이유로 열 줄을 원본 실행 결과라고 기록하면 source audit와 runtime evidence가 섞입니다.",
        "reconstruction에서는 원본의 static a=1, instance x=3, static block, instance block, constructor, static method, normal method의 state transitions를 보존하고 오타 `nomal`만 교육용 label `normal`로 고칩니다.",
        "class initialization에서 static block은 a=1을 출력한 뒤2로 만듭니다. 첫 new의 instance block은 a2와 x3을 출력한 뒤 a3·x4로 바꾸고 constructor는3·4를 출력한 뒤 a4·x5로 바꿉니다.",
        "main이 관찰하는 값은 따라서 static a4와 receiver x5입니다. static method는 a4를 출력하고5로 증가시키며, normal method는 새 a5와 그대로인 x5를 출력한 뒤 둘을 증가시킵니다.",
        "`e.a`와 `e.s()`는 문법상 허용될 수 있어도 static ownership을 흐립니다. reconstruction의 main은 `ExampleTrace.a`와 `ExampleTrace.s()`로 바꾸어 defining class를 명시합니다.",
        "한 줄씩 state를 적으면 static/instance라는 modifier 이름을 외우는 대신 각 write가 어느 storage에 적용되는지 검증할 수 있습니다.",
      ],
      concepts: [
        { term: "active golden", definition: "주석을 제외한 실제 source를 compile/run해 얻은 현재 실행 계약입니다.", detail: ["원본 Example은 두 줄입니다.", "추측 출력과 구분합니다."] },
        { term: "reconstruction", definition: "주석이나 설명에 남은 의도를 별도 이름과 명시된 변경으로 실행 가능하게 재구성한 교육 예제입니다.", detail: ["원본을 수정한 것처럼 말하지 않습니다.", "새 exact output을 따로 둡니다."] },
        { term: "state transition trace", definition: "각 출력 전후에 static a와 receiver x가 어떻게 변하는지 순서대로 기록한 표입니다.", detail: ["a는 class state입니다.", "x는 한 receiver state입니다."] },
      ],
      codeExamples: [{
        id: "java-example-comment-path-reconstruction",
        title: "static1부터 normal method5까지 원본 주석 경로의 열 줄을 재현합니다",
        language: "java",
        filename: "ExampleTraceReconstruction.java",
        purpose: "Example의 active two-line golden과 혼동하지 않으면서 주석 처리된 new·field read·static/instance method 호출의 전체 state trace를 실행합니다.",
        code: String.raw`public class ExampleTraceReconstruction {
    static final class ExampleTrace {
        static int a = 1;
        static {
            System.out.println("static " + a);
            a++;
        }

        int x = 3;
        {
            System.out.println("st " + a);
            System.out.println("instance " + x);
            a++;
            x++;
        }

        ExampleTrace() {
            System.out.println("st " + a);
            System.out.println("con " + x);
            a++;
            x++;
        }

        static void s() {
            System.out.println("static method" + a);
            a++;
        }

        void m() {
            System.out.println("st " + a);
            System.out.println("normal method" + x);
            a++;
            x++;
        }
    }

    public static void main(String[] args) {
        ExampleTrace example = new ExampleTrace();
        System.out.println("main s" + ExampleTrace.a);
        System.out.println("main i" + example.x);
        ExampleTrace.s();
        example.m();
    }
}`,
        walkthrough: [
          { lines: "3-7", explanation: "a=1 field initializer 뒤 static block이1을 출력하고2로 증가시킵니다." },
          { lines: "9-15", explanation: "새 receiver x=3을 만든 뒤 instance block이 a2·x3을 출력하고3·4로 바꿉니다." },
          { lines: "17-22", explanation: "constructor body가 a3·x4를 출력하고 main 진입 전4·5로 만듭니다." },
          { lines: "24-34", explanation: "static s는 class state a만, instance m은 class state a와 receiver state x를 관찰·변경합니다." },
          { lines: "38-43", explanation: "원본 주석 네 호출을 class-qualified static access로 재구성합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ExampleTraceReconstruction.java", "ExampleTraceReconstruction") },
        output: { value: "static 1\nst 2\ninstance 3\nst 3\ncon 4\nmain s4\nmain i5\nstatic method4\nst 5\nnormal method5", explanation: ["첫 다섯 줄은 class initialization과 첫 object construction입니다.", "main 두 field reads 뒤 static s가 a를5로 만들므로 instance m의 첫 줄은 st5입니다.", "normal method는 x를 그 전까지 바꾼 호출이 없어5를 봅니다."] },
        experiments: [
          { change: "ExampleTrace.s()를 new보다 앞으로 옮깁니다.", prediction: "static1→static method2가 먼저 나오고 new의 instance block은 st3부터 시작합니다.", result: "static method invocation도 active-use initialization trigger입니다." },
          { change: "두 번째 `new ExampleTrace()`를 m 호출 앞에 추가합니다.", prediction: "static block은 반복되지 않지만 instance/constructor 네 줄이 다시 나오고 shared a가 추가로 증가합니다.", result: "새 object의 x는3에서 시작해도 static a는 이전 class state를 이어갑니다." },
          { change: "main에서 `example.a`를 사용합니다.", prediction: "값은4로 같지만 static ownership이 receiver에 속한 것처럼 읽힙니다.", result: "동작 가능성과 유지보수상 명확한 qualification을 구분합니다." },
        ],
        sourceRefs: ["java-class04-example", "jls-static-fields", "jls-static-methods", "jls-static-initializers", "jls-instance-initializers", "jls-instance-creation"],
      }],
      diagnostics: [
        { symptom: "원본 Example 실행 결과를 열 줄이라고 기록했다.", likelyCause: "주석 처리된 statements를 active source로 간주했습니다.", checks: ["main의 comment boundary를 확인합니다.", "원본을 그대로 compile/run합니다.", "reconstruction file 이름과 output을 분리합니다."], fix: "원본 golden은 두 줄, 교육용 reconstruction은 열 줄로 각각 label합니다.", prevention: "source comments와 runtime evidence를 provenance 표에서 다른 종류로 관리합니다." },
        { symptom: "normal method 앞 a를4로 예상했지만5가 출력된다.", likelyCause: "직전 static method가 shared a를 증가시킨 write를 놓쳤습니다.", checks: ["각 출력 뒤 ++를 표시합니다.", "static a와 receiver x 열을 분리합니다.", "호출 순서를 그대로 따라갑니다."], fix: "s()의 a4 출력 뒤 a=5 transition을 m() 입력 상태로 넘깁니다.", prevention: "stdout만 읽지 말고 각 line의 before/after state를 기록합니다." },
      ],
      expertNotes: ["교육용 logging이 initialization 순서를 바꿀 수 있는 외부 class/API를 호출하면 새 class initialization이 연쇄될 수 있으므로 trace instrumentation 자체의 영향을 고려합니다.", "원본 오타를 고칠 때도 exact source evidence와 reconstruction 차이를 sourceCoverage에 남깁니다."],
    },
    {
      id: "constant-inlining-api-evolution",
      title: "compile-time constant는 client bytecode에 인라인될 수 있어 producer만 교체하면 오래된 값과 새 값이 함께 보입니다",
      lead: "constant read가 initialization non-trigger라는 규칙은 library binary evolution 위험과도 연결됩니다.",
      explanations: [
        "`static final`이라고 모두 constant variable은 아닙니다. primitive 또는 String type의 final variable이 constant expression으로 초기화될 때 constant variable이 되며 client compiler는 그 값을 client class file에 포함할 수 있습니다.",
        "이미 compile된 client가 `Api.LIMIT` literal7을 담고 있으면 producer class만 LIMIT8로 교체해도 client는7을 계속 사용할 수 있습니다. 반면 `Integer BOXED` 같은 non-constant field read는 runtime getstatic으로 새 producer의12를 봅니다.",
        "이 현상은 JVM cache가 갱신되지 않은 문제가 아니라 서로 다른 binaries의 계약입니다. 실행을 재시작해도 client를 다시 compile하지 않으면 인라인된 값은 바뀌지 않습니다.",
        "public constant 값을 바꾸는 것은 source만 보면 단순 변경이지만 배포 단위가 독립적인 library에서는 version skew를 만듭니다. protocol code, array size, timeout처럼 의미가 바뀌는 값은 getter/configuration/version negotiation을 검토합니다.",
        "constant variable read가 declaring class initialization을 trigger하지 않는다는 사실을 side effect 기반 registration에 의존하면 더 위험합니다. 상수 접근과 bootstrap을 같은 API로 암묵적으로 묶지 않습니다.",
        "실험은 producer+client v1을 compile한 뒤 producer만 v2로 다시 compile하고 새 class loader로 둘을 읽습니다. client 재compile을 일부러 하지 않았다는 조건이 핵심입니다.",
      ],
      concepts: [
        { term: "constant variable", definition: "primitive 또는 String type의 final variable이며 constant expression으로 초기화된 변수입니다.", detail: ["static 여부만으로 결정되지 않습니다.", "client에 값이 포함될 수 있습니다."] },
        { term: "binary version skew", definition: "producer와 client가 서로 다른 시점의 계약으로 compile되어 runtime에 함께 놓인 상태입니다.", detail: ["오래된 literal과 새 field가 공존할 수 있습니다.", "client recompile로 해소합니다."] },
        { term: "runtime field read", definition: "client bytecode가 declaring class의 field storage를 실행 시점에 읽는 접근입니다.", detail: ["non-constant static field에 해당합니다.", "class initialization trigger가 될 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-constant-binary-evolution",
        title: "producer만 7→8·11→12로 교체해 client=7|12와 api=8|12를 동시에 관찰합니다",
        language: "java",
        filename: "ConstantBinaryEvolutionLab.java",
        purpose: "constant inlining을 말로만 설명하지 않고 v1 client class file을 유지한 채 v2 producer만 compile하는 binary experiment로 검증합니다.",
        code: String.raw`import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class ConstantBinaryEvolutionLab {
    static void compile(JavaCompiler compiler, Path classes, Path... sources) throws Exception {
        try (StandardJavaFileManager manager = compiler.getStandardFileManager(null, null, null)) {
            var units = manager.getJavaFileObjectsFromPaths(List.of(sources));
            List<String> options = List.of("--release", "21", "-proc:none", "-Xlint:all", "-d", classes.toString());
            DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
            boolean ok = compiler.getTask(null, manager, diagnostics, options, null, units).call();
            if (!ok || !diagnostics.getDiagnostics().isEmpty()) {
                throw new AssertionError("compile failed or warned: " + diagnostics.getDiagnostics());
            }
        }
    }

    static void deleteTree(Path root) throws Exception {
        if (!Files.exists(root)) return;
        try (var paths = Files.walk(root)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path);
        }
    }

    public static void main(String[] args) throws Exception {
        Path base = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = base.resolve("constant-binary-" + UUID.randomUUID()).normalize();
        if (!root.getParent().equals(base) || Files.exists(root)) throw new IllegalStateException("unsafe root");
        try {
            Path source = Files.createDirectories(root.resolve("source"));
            Path classes = Files.createDirectories(root.resolve("classes"));
            Path api = source.resolve("Api.java");
            Path client = source.resolve("Client.java");
            Files.writeString(api, "public class Api { public static final int LIMIT=7; public static final Integer BOXED=11; }");
            Files.writeString(client, "public class Client { public static String read() { return Api.LIMIT + \"|\" + Api.BOXED; } }");
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            if (compiler == null) throw new IllegalStateException("full JDK required");
            compile(compiler, classes, api, client);

            Files.writeString(api, "public class Api { public static final int LIMIT=8; public static final Integer BOXED=12; }");
            compile(compiler, classes, api);

            try (URLClassLoader loader = new URLClassLoader(new URL[]{classes.toUri().toURL()}, ClassLoader.getPlatformClassLoader())) {
                Class<?> clientType = Class.forName("Client", true, loader);
                Method read = clientType.getDeclaredMethod("read");
                Class<?> apiType = Class.forName("Api", true, loader);
                System.out.println("client=" + read.invoke(null));
                System.out.println("api=" + apiType.getField("LIMIT").get(null) + "|" + apiType.getField("BOXED").get(null));
            }
        } finally {
            if (!root.toAbsolutePath().normalize().getParent().equals(base)) throw new IllegalStateException("unsafe cleanup");
            deleteTree(root);
        }
    }
}`,
        walkthrough: [
          { lines: "15-26", explanation: "JavaCompiler task를 JDK21·processing off·Xlint all·명시 classes output으로 고정하고 DiagnosticCollector가 warning까지 0인지 검사합니다." },
          { lines: "28-33", explanation: "실험 tree를 reverse-order로 제거하는 cleanup helper입니다." },
          { lines: "35-48", explanation: "normalized system temp direct GUID child 안에 v1 Api와 Client를 만들고 둘을 함께 compile합니다." },
          { lines: "50-51", explanation: "Client.class는 그대로 둔 채 Api source만8·12로 바꾸어 Api.class만 교체합니다." },
          { lines: "53-59", explanation: "새 loader에서 old client와 new Api를 함께 load해 client view와 reflection direct view를 비교합니다." },
          { lines: "60-63", explanation: "parent invariant를 재검사한 뒤 실험 source/classes를 모두 제거합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK", "OS temporary directory write permission"], command: isolatedJavaRun("ConstantBinaryEvolutionLab.java", "ConstantBinaryEvolutionLab") },
        output: { value: "client=7|12\napi=8|12", explanation: ["v1 Client.class에는 primitive constant LIMIT7이 포함되어 producer 교체 뒤에도7입니다.", "BOXED는 constant variable이 아니므로 old client도 runtime에 v2 Api.BOXED12를 읽습니다.", "reflection으로 v2 Api 자체를 읽으면 LIMIT8과 BOXED12입니다."] },
        experiments: [
          { change: "v2 Api 뒤 Client도 다시 compile합니다.", prediction: "client=8|12가 됩니다.", result: "재compile된 client가 새 constant literal을 포함합니다." },
          { change: "LIMIT initializer를 `Integer.parseInt(\"7\")`로 바꿉니다.", prediction: "final int이지만 constant expression이 아니어서 old client가 runtime field를 읽는 구조가 됩니다.", result: "final/static 모양보다 initializer의 constant-expression 여부가 중요합니다." },
          { change: "LIMIT를 public static method `limit()` 반환값으로 바꿉니다.", prediction: "client는 runtime invocation으로 새 implementation 값을 봅니다.", result: "호출 비용과 초기화 trigger 대신 독립 배포에서 더 명시적인 evolution contract를 얻습니다." },
        ],
        sourceRefs: ["jls-constant-variable", "jls-constant-expressions", "jls-init-triggers", "jls-binary-constant-fields", "java-compiler-api", "java-classloader-api", "java-files-api", "java-uuid-api"],
      }],
      diagnostics: [
        { symptom: "server library의 public constant를8로 바꿨는데 일부 clients는 계속7을 사용한다.", likelyCause: "기존 client class file에 v1 constant가 인라인되어 있습니다.", checks: ["field가 constant variable 조건인지 확인합니다.", "client compile 시점과 deployed binary를 확인합니다.", "producer-only 교체인지 봅니다."], fix: "clients를 새 producer API와 함께 recompile/redeploy하거나 evolution이 필요한 값은 method/config contract로 이동합니다.", prevention: "public constants의 값 변경을 binary compatibility checklist에 넣습니다." },
        { symptom: "LIMIT read가 static block registration도 실행할 것으로 기대했지만 실행되지 않는다.", likelyCause: "constant variable read는 class initialization active-use trigger가 아닙니다.", checks: ["primitive/String final인지 봅니다.", "initializer가 constant expression인지 봅니다.", "registration이 side effect에 의존하는지 찾습니다."], fix: "registration은 explicit bootstrap API로 분리합니다.", prevention: "constant access를 lifecycle trigger로 사용하지 않습니다." },
      ],
      comparisons: [{ title: "진화 가능한 공개값 표현", options: [
        { name: "public constant variable", chooseWhen: "영구히 의미와 값이 고정된 compile-time symbol일 때", avoidWhen: "독립 배포 중 값을 바꿀 가능성이 있을 때", tradeoffs: ["호출 단순", "client 인라이닝"] },
        { name: "static getter", chooseWhen: "runtime에 producer의 현재 값을 읽어야 할 때", avoidWhen: "environment별 lifecycle/state가 필요할 때", tradeoffs: ["진화 용이", "class initialization·호출 발생"] },
        { name: "injected configuration", chooseWhen: "배포 환경·test별 값과 provenance가 필요할 때", avoidWhen: "진정한 language constant일 때", tradeoffs: ["명시적 lifecycle", "구성 전달 비용"] },
      ] }],
      expertNotes: ["JLS binary compatibility가 모든 semantic compatibility를 보장하지 않습니다. linkage가 성공해도 old constant를 보는 의미상 불일치가 생길 수 있습니다.", "멀티 릴리스 JAR·module layer·application server에서는 producer/client 및 loader 조합까지 deployment matrix로 관리합니다."],
    },
    {
      id: "utility-class-versus-injected-service",
      title: "무상태 계산은 utility class로 닫고 정책·환경·가변 협력은 injected service로 드러냅니다",
      lead: "static method를 쓸 수 있다는 사실과 static이 좋은 dependency 경계라는 판단은 별개입니다.",
      explanations: [
        "순수 계산처럼 입력만으로 결과가 결정되고 숨은 mutable state가 없는 기능은 final utility class의 static method로 표현할 수 있습니다. private constructor는 instance 생성 의도가 없음을 구조적으로 드러냅니다.",
        "utility class는 namespace와 간단한 호출을 제공하지만 caller signature에 dependency가 나타나지 않고 implementation 교체 지점이 제한됩니다. clock, network, database, discount policy처럼 환경·시간·실패가 개입하는 협력을 static으로 감추면 test가 전역 replacement와 순서에 의존합니다.",
        "injected service는 interface와 constructor parameter로 caller가 무엇에 의존하는지 보입니다. production implementation과 deterministic fake를 object lifecycle별로 선택할 수 있고 request/user scope도 명시할 수 있습니다.",
        "반대로 모든 한 줄 수학 함수를 interface로 만들면 indirection과 구성 비용만 늘 수 있습니다. 선택 기준은 ‘static인가’가 아니라 state ownership, policy variation, side effect, lifecycle, failure channel입니다.",
        "원본 Ex01의 shared num처럼 변화하는 값을 utility class 안 static field로 넣으면 무상태 utility라는 전제가 무너집니다. 계산 helper와 mutable registry/cache를 같은 class에 섞지 않습니다.",
        "예제는 positive operands만 받는 subtotal을 Math.multiplyExact로 계산하고 invalid와 overflow를 서로 다른 exception contract로 둡니다. private constructor 수는 reflection으로 검사해 단순 주석이 아니라 구조 계약으로 만듭니다.",
      ],
      concepts: [
        { term: "stateless utility", definition: "호출 사이에 mutable state를 보존하지 않고 arguments만으로 결과를 만드는 static operation 집합입니다.", detail: ["private constructor로 instance화를 막습니다.", "순수 계산에 적합합니다."] },
        { term: "injected dependency", definition: "caller의 constructor나 method parameter로 명시 전달되는 협력 객체입니다.", detail: ["lifecycle이 드러납니다.", "test double 교체가 지역적입니다."] },
        { term: "hidden dependency", definition: "signature에는 보이지 않지만 method가 직접 읽는 global/static 환경 또는 service입니다.", detail: ["test isolation을 어렵게 합니다.", "운영 구성 provenance가 흐려집니다."] },
      ],
      codeExamples: [{
        id: "java-safe-stateless-utility",
        title: "private constructor·입력 검증·overflow를 가진 subtotal utility의 네 계약을 실행합니다",
        language: "java",
        filename: "SafeUtilityContractLab.java",
        purpose: "utility class가 무상태 계산에 적합한 최소 조건과 validation/overflow/instance-shape 계약을 함께 검증합니다.",
        code: String.raw`import java.lang.reflect.Modifier;

public class SafeUtilityContractLab {
    static final class PriceMath {
        private PriceMath() {
            throw new AssertionError("no instances");
        }

        static int subtotal(int unitPrice, int quantity) {
            if (unitPrice <= 0 || quantity <= 0) {
                throw new IllegalArgumentException("positive operands required");
            }
            return Math.multiplyExact(unitPrice, quantity);
        }
    }

    public static void main(String[] args) {
        System.out.println("subtotal=" + PriceMath.subtotal(2000, 3));
        try {
            PriceMath.subtotal(0, 2);
        } catch (IllegalArgumentException error) {
            System.out.println("invalid=" + error.getClass().getSimpleName());
        }
        try {
            PriceMath.subtotal(Integer.MAX_VALUE, 2);
        } catch (ArithmeticException error) {
            System.out.println("overflow=" + error.getClass().getSimpleName());
        }
        var constructors = PriceMath.class.getDeclaredConstructors();
        boolean onlyConstructorPrivate = constructors.length == 1
                && Modifier.isPrivate(constructors[0].getModifiers());
        if (!onlyConstructorPrivate) throw new AssertionError("utility constructor shape changed");
        System.out.println("constructorShape=count:" + constructors.length
                + ",private:" + onlyConstructorPrivate);
    }
}`,
        walkthrough: [
          { lines: "5-8", explanation: "final nested utility와 private throwing constructor로 instance API가 아님을 표현합니다." },
          { lines: "10-15", explanation: "domain validation과 int overflow를 각각 IllegalArgumentException·ArithmeticException 채널로 분리합니다." },
          { lines: "18-28", explanation: "정상6000, invalid, overflow paths를 독립적으로 실행해 실패 원인을 삼키지 않습니다." },
          { lines: "29-34", explanation: "declared constructor가 정확히 하나이고 private인지 assert해 compiler-generated package-private default constructor도 놓치지 않습니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("SafeUtilityContractLab.java", "SafeUtilityContractLab") },
        output: { value: "subtotal=6000\ninvalid=IllegalArgumentException\noverflow=ArithmeticException\nconstructorShape=count:1,private:true", explanation: ["2000×3은 exact6000입니다.", "0 operand는 domain validation이, MAX_VALUE×2는 multiplyExact overflow가 서로 다른 exception으로 거부합니다.", "declared constructor는 정확히 하나이며 private입니다."] },
        experiments: [
          { change: "multiplyExact를 단순 `unitPrice * quantity`로 바꿉니다.", prediction: "overflow가 음수 wraparound가 되어 ArithmeticException line이 나오지 않습니다.", result: "무상태라는 성질이 산술 안전성까지 자동 보장하지 않습니다." },
          { change: "PriceMath에 mutable static discountRate를 추가합니다.", prediction: "같은 arguments도 호출 시점과 test 순서에 따라 결과가 달라집니다.", result: "stateless utility 전제가 깨져 injected policy 후보가 됩니다." },
          { change: "private constructor를 제거합니다.", prediction: "compiler가 package-private default constructor를 제공해 private assertion이 실패합니다.", result: "instance 금지는 public count가 아니라 exact constructor shape로 계약화해야 합니다." },
        ],
        sourceRefs: ["java-class04-ex01", "java-math-api", "java-reflection-constructor", "java-modifier-api", "jls-default-constructor", "jls-static-methods"],
      }],
      diagnostics: [
        { symptom: "static service를 test마다 교체했더니 병렬 tests가 서로의 fake를 본다.", likelyCause: "mutable global collaborator를 process-wide replacement로 관리했습니다.", checks: ["static setter/resetter를 찾습니다.", "parallel execution 여부를 확인합니다.", "caller constructor에 dependency가 보이는지 봅니다."], fix: "협력 객체를 instance dependency로 주입하고 test마다 별도 object graph를 만듭니다.", prevention: "mutable service locator와 static replacement hook을 금지합니다." },
        { symptom: "간단한 utility 호출인데 결과가 request마다 달라진다.", likelyCause: "utility 내부가 clock/config/cache 같은 hidden state를 읽습니다.", checks: ["모든 static fields를 찾습니다.", "system time/environment access를 찾습니다.", "동일 input 반복 결과를 비교합니다."], fix: "변하는 값을 argument 또는 injected provider로 승격합니다.", prevention: "utility review에서 purity와 state ownership을 명시합니다." },
      ],
      comparisons: [{ title: "동작 배치 선택", options: [
        { name: "static utility", chooseWhen: "작고 결정적인 무상태 계산이며 교체 정책이 없을 때", avoidWhen: "외부 I/O·시간·request scope·mutable cache가 있을 때", tradeoffs: ["호출 간결", "dependency 교체 제한"] },
        { name: "injected service", chooseWhen: "정책 변화·환경 협력·failure·lifecycle을 caller에 드러낼 때", avoidWhen: "순수한 한 줄 language-level helper일 때", tradeoffs: ["test 격리", "구성·indirection"] },
        { name: "instance value object behavior", chooseWhen: "동작이 특정 immutable state와 invariant에 자연스럽게 속할 때", avoidWhen: "서로 무관한 operands의 namespace helper일 때", tradeoffs: ["응집도 향상", "객체 생성 필요"] },
      ] }],
      expertNotes: ["dependency injection은 framework annotation과 동의어가 아니며 plain constructor injection만으로도 ownership과 test seam을 얻습니다.", "utility class의 static methods는 override되지 않으므로 polymorphic variation이 필요하면 interface/composition을 사용합니다."],
    },
    {
      id: "lazy-holder-failure-loader-concurrency",
      title: "lazy holder의 안전한 공개부터 initialization failure·class loader·mutable static race까지 운영 경계를 추적합니다",
      lead: "class initialization이 제공하는 한 번 실행·가시성 보장은 성공한 초기화 결과에 한정되며 mutable state의 후속 갱신까지 안전하게 만들지는 않습니다.",
      explanations: [
        "initialization-on-demand holder idiom은 outer class를 사용해도 nested Holder를 active use하기 전에는 singleton을 만들지 않습니다. Holder.INSTANCE를 처음 읽을 때 Holder initialization lock 아래 생성되고 정상 완료된 초기화의 writes는 이후 그 class를 사용하는 threads에 보입니다.",
        "이 보장은 같은 Holder class identity와 정상 완료를 전제로 합니다. custom class loader가 같은 binary name을 별도로 define하면 서로 다른 Class와 서로 다른 static storage가 생기므로 process 전체 singleton이라고 단정할 수 없습니다.",
        "class initialization 중 RuntimeException이 밖으로 나오면 첫 active use caller는 보통 ExceptionInInitializerError를 받고 class는 erroneous state가 됩니다. 같은 loader의 later active use는 초기화를 재시도하지 않고 NoClassDefFoundError를 받을 수 있습니다.",
        "`Class.forName(name, false, loader)`는 load를 요청하되 initialize하지 않는 overload이고 `true`는 initialize를 요청합니다. load·link와 initialize를 분리해 plugin discovery나 diagnostics를 설계할 수 있지만 API별 initialization contract를 직접 확인해야 합니다.",
        "class initialization의 mutual exclusion은 initialization 시점에만 적용됩니다. 초기화 뒤 mutable static int에 `++`를 수행하는 것은 read-modify-write 세 단계이며 두 threads가 같은0을 읽으면 update 하나가 사라질 수 있습니다.",
        "race 예제는 확률에 기대지 않고 두 workers가 모두 plain 값을 읽은 뒤에만 writes를 허용해 lost update를 강제합니다. 같은 두 workers가 AtomicInteger.incrementAndGet을 쓰면 atomic2가 되어 차이를 exact output으로 검증합니다.",
        "초기화에서 network/database/config parsing을 수행하면 transient failure 하나가 class를 해당 loader lifecycle 동안 unusable하게 만들 수 있습니다. retry·timeout·shutdown이 필요한 자원은 explicit lifecycle service와 failure policy로 옮깁니다.",
      ],
      concepts: [
        { term: "initialization-on-demand holder", definition: "nested static holder의 first active use까지 값 생성을 늦추고 class initialization의 mutual exclusion/publication을 이용하는 idiom입니다.", detail: ["outer use만으로 Holder가 초기화되지 않습니다.", "성공한 초기화 뒤 같은 instance를 반환합니다."] },
        { term: "erroneous class", definition: "class initialization이 abrupt completion한 뒤 같은 defining loader에서 정상 사용 불가능한 상태입니다.", detail: ["첫 실패와 later use의 error가 다를 수 있습니다.", "자동 retry가 아닙니다."] },
        { term: "lost update", definition: "여러 threads가 같은 old value를 읽고 각각 계산한 write가 서로 덮여 일부 갱신이 사라지는 race입니다.", detail: ["++는 atomic이 아닙니다.", "AtomicInteger 등 명시 synchronization이 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "java-lazy-holder-once",
          title: "Holder first use 전0, 생성 후1, 두 번의 same service를 exact trace로 확인합니다",
          language: "java",
          filename: "LazyHolderContractLab.java",
          purpose: "lazy creation 시점·정확히 한 번 생성·동일 identity 반환을 값과 == assertion으로 검증합니다.",
          code: String.raw`public class LazyHolderContractLab {
    static final class Audit {
        static int creations;
    }

    static final class Service {
        final String id;
        Service() {
            int number = ++Audit.creations;
            id = "S" + number;
        }
    }

    static final class Services {
        private Services() {}
        private static final class Holder {
            static final Service INSTANCE = new Service();
        }
        static Service instance() { return Holder.INSTANCE; }
    }

    public static void main(String[] args) {
        System.out.println("before:" + Audit.creations);
        Service first = Services.instance();
        System.out.println("create:" + Audit.creations);
        Service second = Services.instance();
        if (first != second) throw new AssertionError("identity changed");
        System.out.println("first:" + first.id + ",count:" + Audit.creations);
        System.out.println("second:" + second.id + ",count:" + Audit.creations);
    }
}`,
          walkthrough: [
            { lines: "2-11", explanation: "외부 Audit counter와 final id로 construction count를 nondeterministic identity string 없이 관찰합니다." },
            { lines: "14-19", explanation: "Services 자체와 nested Holder를 분리해 instance()가 Holder의 first active use가 되게 합니다." },
            { lines: "23-29", explanation: "호출 전0, 첫 호출 뒤1, 두 번째 호출 뒤에도1과 reference identity 동일성을 assertion합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("LazyHolderContractLab.java", "LazyHolderContractLab") },
          output: { value: "before:0\ncreate:1\nfirst:S1,count:1\nsecond:S1,count:1", explanation: ["Services type가 선언돼 있어도 Holder active use 전에는 Service가 생성되지 않습니다.", "Holder initialization이 INSTANCE를 한 번 만들고 두 호출은 같은 reference를 반환합니다."] },
          experiments: [
            { change: "Services에 `static final Service INSTANCE`를 직접 둡니다.", prediction: "Services의 다른 active use도 creation을 앞당길 수 있습니다.", result: "nested holder가 lazy boundary를 별도 class initialization으로 나눕니다." },
            { change: "instance()에서 매번 `new Service()`를 반환합니다.", prediction: "count2와 서로 다른 references가 되어 assertion이 실패합니다.", result: "static method 자체가 singleton을 만드는 것이 아닙니다." },
            { change: "Service constructor에서 exception을 던집니다.", prediction: "Holder initialization failure가 다음 failure 예제와 같은 erroneous-class 경로로 이어집니다.", result: "lazy는 failure retry policy가 아닙니다." },
          ],
          sourceRefs: ["jls-init-triggers", "jls-init-procedure", "jls-happens-before", "jls-class-loader-identity"],
        },
        {
          id: "java-class-forname-initialize-flag",
          title: "Class.forName false는 counter0, true는1, repeated true도1인지 검증합니다",
          language: "java",
          filename: "ClassForNameInitializationLab.java",
          purpose: "loading request와 initialization request를 boolean overload로 분리하고 같은 loader의 정상 initialization이 반복되지 않음을 확인합니다.",
          code: String.raw`public class ClassForNameInitializationLab {
    static final class Audit { static int count; }

    static final class Target {
        static { Audit.count++; }
    }

    public static void main(String[] args) throws Exception {
        String name = Target.class.getName();
        ClassLoader loader = Target.class.getClassLoader();
        Class.forName(name, false, loader);
        System.out.println("loaded:" + Audit.count);
        Class.forName(name, true, loader);
        System.out.println("initialized:" + Audit.count);
        Class.forName(name, true, loader);
        System.out.println("again:" + Audit.count);
    }
}`,
          walkthrough: [
            { lines: "2-6", explanation: "Target static block의 유일한 effect를 outer Audit에 기록합니다." },
            { lines: "9-12", explanation: "class literal로 name/loader를 얻고 initialize=false로 load를 요청한 뒤 count0을 관찰합니다." },
            { lines: "13-16", explanation: "true 호출이 count1을 만들고 같은 loader의 repeated true는1을 유지합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ClassForNameInitializationLab.java", "ClassForNameInitializationLab") },
          output: { value: "loaded:0\ninitialized:1\nagain:1", explanation: ["false overload는 Target initialization을 요청하지 않아0입니다.", "true overload 첫 호출만 static block을 실행하고 정상 완료 뒤 repeated call은 반복하지 않습니다."] },
          experiments: [
            { change: "첫 호출의 false를 true로 바꿉니다.", prediction: "첫 line부터 loaded:1이고 뒤 두 lines도1입니다.", result: "flag가 initialize 요청 시점을 결정합니다." },
            { change: "loader에 null을 넘깁니다.", prediction: "bootstrap loader로 name을 찾으므로 application nested class는 ClassNotFoundException이 납니다.", result: "binary name만 아니라 loader selection도 lookup contract입니다." },
            { change: "Target에 `static final int C=7`을 두고 Class.forName 대신 Target.C만 읽습니다.", prediction: "constant read만으로는 count가 증가하지 않습니다.", result: "API invocation과 language active-use 규칙을 구분합니다." },
          ],
          sourceRefs: ["java-class-forname", "jls-loading", "jls-init-triggers", "jls-init-procedure", "jls-class-loader-identity"],
        },
        {
          id: "java-initialization-failure-lifecycle",
          title: "첫 RuntimeException은 ExceptionInInitializerError, later use는 NoClassDefFoundError가 됨을 고정합니다",
          language: "java",
          filename: "InitializationFailureContractLab.java",
          purpose: "class initialization이 자동 retry가 아니라 erroneous state를 남기는 failure lifecycle임을 같은 loader의 두 active uses로 증명합니다.",
          code: String.raw`public class InitializationFailureContractLab {
    static final class Bomb {
        static final int VALUE = fail();
        static int fail() {
            throw new IllegalStateException("synthetic failure");
        }
    }

    static String firstUse() {
        try {
            return "value=" + Bomb.VALUE;
        } catch (Throwable error) {
            return error.getClass().getSimpleName();
        }
    }

    static String laterUse() {
        try {
            return "value=" + Bomb.VALUE;
        } catch (Throwable error) {
            return error.getClass().getSimpleName();
        }
    }

    public static void main(String[] args) {
        System.out.println("first=" + firstUse());
        System.out.println("later=" + laterUse());
    }
}`,
          walkthrough: [
            { lines: "2-7", explanation: "non-constant VALUE initializer가 RuntimeException을 던져 Bomb initialization을 abrupt completion시킵니다." },
            { lines: "9-22", explanation: "서로 다른 methods에서 같은 loader/class의 first와 later active use errors를 simple name으로 정규화합니다." },
            { lines: "25-28", explanation: "첫 실패 뒤 재시도처럼 보이는 두 번째 read의 실제 error type을 연속 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("InitializationFailureContractLab.java", "InitializationFailureContractLab") },
          output: { value: "first=ExceptionInInitializerError\nlater=NoClassDefFoundError", explanation: ["Bomb initializer의 IllegalStateException은 첫 active use에서 ExceptionInInitializerError로 감싸집니다.", "Bomb는 erroneous state가 되어 같은 loader의 later active use는 초기화를 다시 실행하지 않고 NoClassDefFoundError를 냅니다."] },
          experiments: [
            { change: "fail()이 7을 반환하게 합니다.", prediction: "first=value=7, later=value=7이며 initialization은 정상 완료됩니다.", result: "erroneous state는 abrupt completion에서 생깁니다." },
            { change: "catch를 Exception으로 좁힙니다.", prediction: "Error 계열을 잡지 못해 첫 line 전 process가 비정상 종료합니다.", result: "Error를 일반 복구 가능한 exception처럼 다루지 않는 이유도 드러납니다." },
            { change: "fail() 안에서 재시도 가능한 network 호출을 수행합니다.", prediction: "transient 첫 실패가 class lifecycle 전체 실패로 고착될 수 있습니다.", result: "retryable resource는 explicit service lifecycle이 적합합니다." },
          ],
          sourceRefs: ["jls-init-procedure", "java-exception-in-initializer-error", "java-no-class-def-found-error"],
        },
        {
          id: "java-deterministic-static-race",
          title: "두 threads의 read를 barrier 앞에 고정해 plain lost update1과 atomic update2를 재현합니다",
          language: "java",
          filename: "DeterministicStaticRaceLab.java",
          purpose: "스케줄 운에 의존하지 않고 mutable static ++의 read-modify-write race와 AtomicInteger의 원자적 갱신을 비교합니다.",
          code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class DeterministicStaticRaceLab {
    static int plain;
    static final AtomicInteger atomic = new AtomicInteger();

    static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(error);
        }
    }

    public static void main(String[] args) throws Exception {
        CountDownLatch bothRead = new CountDownLatch(2);
        CountDownLatch writeNow = new CountDownLatch(1);
        Runnable plainIncrement = () -> {
            int snapshot = plain;
            bothRead.countDown();
            await(writeNow);
            plain = snapshot + 1;
        };
        Thread first = new Thread(plainIncrement, "plain-first");
        Thread second = new Thread(plainIncrement, "plain-second");
        first.start(); second.start();
        bothRead.await();
        writeNow.countDown();
        first.join(); second.join();

        Thread atomicFirst = new Thread(atomic::incrementAndGet, "atomic-first");
        Thread atomicSecond = new Thread(atomic::incrementAndGet, "atomic-second");
        atomicFirst.start(); atomicSecond.start();
        atomicFirst.join(); atomicSecond.join();

        System.out.println("plain=" + plain);
        System.out.println("atomic=" + atomic.get());
    }
}`,
          walkthrough: [
            { lines: "5-15", explanation: "plain class state, AtomicInteger state, interrupt-preserving await helper를 정의합니다." },
            { lines: "18-24", explanation: "두 workers가 모두 plain0을 snapshot한 뒤 write gate를 기다리게 해 concurrent read를 강제합니다." },
            { lines: "26-31", explanation: "main이 bothRead를 확인한 뒤 두 writes를 허용하므로 둘 다1을 써 lost update가 결정적으로 발생합니다." },
            { lines: "33-40", explanation: "동일한 두 increments를 AtomicInteger로 실행하고 joins 뒤 exact1·2를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("DeterministicStaticRaceLab.java", "DeterministicStaticRaceLab") },
          output: { value: "plain=1\natomic=2", explanation: ["두 plain snapshots가 모두0이어서 두 writes가 모두1이고 하나가 사라집니다.", "AtomicInteger incrementAndGet 두 operations는 각각 원자적으로 반영되어2입니다."] },
          experiments: [
            { change: "plain을 volatile로 바꾸되 snapshot 구조는 유지합니다.", prediction: "plain=1입니다.", result: "volatile visibility는 compound read-modify-write를 atomic으로 만들지 않습니다." },
            { change: "plain increment 전체를 같은 lock의 synchronized block으로 감쌉니다.", prediction: "강제 read barrier 구조를 함께 제거하면 최종2입니다.", result: "critical section mutual exclusion이 compound update를 보호합니다." },
            { change: "join을 제거하고 즉시 출력합니다.", prediction: "main이 workers completion 전에0·1을 볼 수 있어 exact contract가 깨집니다.", result: "join은 completion과 happens-before observation 경계입니다." },
          ],
          sourceRefs: ["jls-happens-before", "java-atomic-integer", "java-countdown-latch", "java-thread-api"],
        },
      ],
      diagnostics: [
        { symptom: "첫 static initialization 실패 뒤 flag를 고쳤는데 같은 process에서 계속 NoClassDefFoundError가 난다.", likelyCause: "erroneous class가 같은 defining loader에서 자동 재초기화되지 않습니다.", checks: ["first cause chain을 보존했는지 확인합니다.", "class loader identity를 기록합니다.", "static initializer가 외부 transient resource를 호출하는지 봅니다."], fix: "process/loader lifecycle을 재구성하거나, 더 근본적으로 retryable work를 explicit service로 옮깁니다.", prevention: "static initialization에는 빠르고 deterministic하며 실패 가능성이 낮은 작업만 둡니다." },
        { symptom: "mutable static counter가 가끔 예상보다 작다.", likelyCause: "++가 atomic이라고 오해해 lost update race가 발생했습니다.", checks: ["read-modify-write를 분해합니다.", "threads와 synchronization edge를 찾습니다.", "확률 loop 대신 barrier 재현을 만듭니다."], fix: "AtomicInteger 또는 적절한 lock/ownership model로 compound update를 보호합니다.", prevention: "공유 mutable static을 최소화하고 concurrency contract test를 둡니다." },
        { symptom: "singleton인데 plugin마다 instance가 다르다.", likelyCause: "같은 binary name을 서로 다른 defining class loaders가 정의했습니다.", checks: ["instance.getClass().getClassLoader를 비교합니다.", "Class identity를 ==로 비교합니다.", "module/plugin isolation 정책을 확인합니다."], fix: "공유 owner loader나 explicit cross-loader registry/API로 lifecycle을 통합합니다.", prevention: "singleton scope를 JVM이 아니라 loader/module/application lifecycle로 문서화합니다." },
      ],
      comparisons: [{ title: "초기화·동시성 설계 선택", options: [
        { name: "eager static final", chooseWhen: "작고 deterministic하며 항상 필요한 immutable 값일 때", avoidWhen: "비싸거나 실패·shutdown이 있는 외부 자원일 때", tradeoffs: ["단순 publication", "first active-use latency/실패"] },
        { name: "lazy holder", chooseWhen: "같은 loader 안에서 필요할 때 한 번 만드는 immutable service일 때", avoidWhen: "retry·refresh·close·tenant scope가 필요할 때", tradeoffs: ["lock-free-looking caller API", "erroneous class failure"] },
        { name: "injected lifecycle service", chooseWhen: "startup validation·retry·shutdown·scope·test replacement가 필요할 때", avoidWhen: "진정한 language-level constant일 때", tradeoffs: ["운영 통제", "구성 코드"] },
      ] }],
      expertNotes: ["JLS initialization happens-before는 successful initialization과 subsequent active use 사이의 보장입니다. 실패한 partially initialized mutable objects의 안전한 공개 계약으로 확대하지 않습니다.", "AtomicInteger는 단일 counter operation에는 적합하지만 여러 fields의 invariant를 한꺼번에 원자화하지 않으므로 lock·immutable snapshot·single-owner actor 같은 더 큰 경계를 검토합니다."],
    },
    {
      id: "structural-trigger-negative-contract-suite",
      title: "runtime 값만 보지 않고 구조·trigger·실패 lifecycle·compile-time 금지를 한 계약 묶음으로 봉인합니다",
      lead: "컴파일 실패 예제는 주석으로 끝내지 않고 기대 source·line·diagnostic code와 정확히 한 error를 검사합니다.",
      explanations: [
        "static 학습의 회귀는 output 하나로 잡히지 않습니다. public constructor가 생긴 구조 변화, constant read가 trigger가 아닌 순서, first/later initialization error 차이, loader scope, concurrent update처럼 서로 다른 관찰 층을 분리해야 합니다.",
        "compile-time 금지 예제는 production source tree에 invalid .java로 두지 않습니다. JavaCompiler가 memory source를 JDK21 옵션으로 각각 compile하고 dedicated temp classes directory에만 partial outputs를 허용합니다.",
        "`this`와 unqualified instance field를 static method에서 읽는 두 오류는 모두 implicit current receiver가 없다는 원인으로 이어집니다. explicit object를 argument로 받고 `target.own`으로 읽는 것은 앞 장의 positive contract입니다.",
        "textually later static field를 simple name으로 읽는 illegal forward reference와 assignment 왼쪽으로 쓰는 허용 사례를 구분합니다. fixture는 read 한 줄만 두어 다른 parse error가 기대 진단을 가리지 않게 합니다.",
        "private utility constructor를 외부 class가 new하는 오류는 access boundary를, top-level class에 static modifier를 붙이는 오류는 static member class와 top-level declaration을 혼동한 설명을 검증합니다. member class는 static일 수 있으므로 ‘class에는 static 사용 불가’라는 blanket rule을 피합니다.",
        "OpenJDK diagnostic code는 JLS가 모든 compiler vendor에 동일 문자열을 보장하는 portable API가 아닙니다. 그래서 JDK21.0.11 toolchain contract로 pin하고 line·error count·warning count까지 함께 검사합니다.",
        "각 fixture output은 OS temp direct GUID child 아래 별도 -d를 쓰고 finally에서 normalized parent equality를 재확인한 뒤 그 root만 삭제합니다. expected failure 중 생성된 class가 repository에 남아 다음 검증을 오염시키지 않습니다.",
      ],
      concepts: [
        { term: "negative compiler contract", definition: "의도한 invalid source가 특정 toolchain에서 기대 위치·종류의 오류로 거부됨을 자동 검증하는 test입니다.", detail: ["ok=false만 보지 않습니다.", "source line과 diagnostic code를 고정합니다."] },
        { term: "structural contract", definition: "reflection이나 bytecode inspection으로 접근 제한자·constructor 수·field modifier 같은 API shape를 검증하는 계약입니다.", detail: ["runtime happy path를 보완합니다.", "우회 경로를 탐지합니다."] },
        { term: "artifact isolation", definition: "positive/negative compile outputs를 repository 밖의 검증별 temporary directory에 가두는 원칙입니다.", detail: ["모든 tasks에 -d를 줍니다.", "cleanup boundary를 검증합니다."] },
      ],
      codeExamples: [{
        id: "java-static-negative-compiler-suite",
        title: "static this·instance field·forward read·private constructor·top-level static을 exact diagnostics로 거부합니다",
        language: "java",
        filename: "StaticNegativeCompilerSuite.java",
        purpose: "서로 다른 다섯 invalid constructs가 OpenJDK21의 정확히 한 expected error에서 실패하고 temp artifacts가 제거되는지 programmatic assertion합니다.",
        code: String.raw`import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;

public class StaticNegativeCompilerSuite {
    static final class Source extends SimpleJavaFileObject {
        final String code;
        Source(String name, String code) {
            super(URI.create("string:///" + name + ".java"), Kind.SOURCE);
            this.code = code;
        }
        @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) { return code; }
    }

    record Fixture(String name, String source, long line, String code) {}
    record CompileResult(boolean ok, long errors, long warnings, long line, String code) {}

    static CompileResult compile(JavaCompiler compiler, Path classes, Fixture fixture) throws Exception {
        Path output = Files.createDirectory(classes.resolve(fixture.name()));
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        List<String> options = List.of("--release", "21", "-proc:none", "-encoding", "UTF-8",
                "-Xlint:all", "-d", output.toString());
        boolean ok = compiler.getTask(null, null, diagnostics, options, null,
                List.of(new Source(fixture.name(), fixture.source()))).call();
        List<Diagnostic<? extends JavaFileObject>> errors = diagnostics.getDiagnostics().stream()
                .filter(diagnostic -> diagnostic.getKind() == Diagnostic.Kind.ERROR).toList();
        long warnings = diagnostics.getDiagnostics().stream()
                .filter(diagnostic -> diagnostic.getKind() == Diagnostic.Kind.WARNING
                        || diagnostic.getKind() == Diagnostic.Kind.MANDATORY_WARNING).count();
        if (errors.isEmpty()) return new CompileResult(ok, 0, warnings, -1, "none");
        Diagnostic<? extends JavaFileObject> first = errors.getFirst();
        return new CompileResult(ok, errors.size(), warnings, first.getLineNumber(), first.getCode());
    }

    static void deleteTree(Path root) throws Exception {
        if (!Files.exists(root)) return;
        try (var paths = Files.walk(root)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path);
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("full JDK required");
        Path base = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = base.resolve("static-negative-" + UUID.randomUUID()).normalize();
        if (!root.getParent().equals(base) || Files.exists(root)) throw new IllegalStateException("unsafe root");
        Files.createDirectory(root);
        try {
            Path classes = Files.createDirectory(root.resolve("classes"));
            List<Fixture> fixtures = List.of(
                new Fixture("staticThis", String.join("\n",
                    "class StaticThis {",
                    "  int own;",
                    "  static int read() { return this.own; }",
                    "}"), 3, "compiler.err.non-static.cant.be.ref"),
                new Fixture("staticOwn", String.join("\n",
                    "class StaticOwn {",
                    "  int own;",
                    "  static int read() { return own; }",
                    "}"), 3, "compiler.err.non-static.cant.be.ref"),
                new Fixture("forward", String.join("\n",
                    "class Forward {",
                    "  static int first = later;",
                    "  static int later = 1;",
                    "}"), 2, "compiler.err.illegal.forward.ref"),
                new Fixture("privateUtility", String.join("\n",
                    "final class Utility { private Utility() {} }",
                    "class Use { Utility value = new Utility(); }"), 2, "compiler.err.report.access"),
                new Fixture("topLevelStatic", String.join("\n",
                    "static class Top {}"), 1, "compiler.err.mod.not.allowed.here")
            );
            int checks = 0;
            for (Fixture fixture : fixtures) {
                CompileResult result = compile(compiler, classes, fixture);
                if (result.ok() || result.errors() != 1 || result.warnings() != 0
                        || result.line() != fixture.line() || !result.code().equals(fixture.code())) {
                    throw new AssertionError(fixture.name() + " => " + result);
                }
                checks++;
                System.out.println(fixture.name() + "=false,line=" + result.line() + ",code=" + result.code());
            }
            System.out.println("checks=" + checks);
        } finally {
            Path resolved = root.toAbsolutePath().normalize();
            if (!resolved.getParent().equals(base)) throw new IllegalStateException("unsafe cleanup");
            deleteTree(resolved);
            System.out.println("cleanup=" + !Files.exists(resolved));
        }
    }
}`,
        walkthrough: [
          { lines: "14-25", explanation: "repository file 없이 in-memory source를 compiler에 전달하고 fixture의 expected line/code를 record로 보존합니다." },
          { lines: "27-42", explanation: "fixture별 classes child와 JDK21·processing off·UTF-8·Xlint all·-d options를 쓰고 errors/warnings를 구조화합니다." },
          { lines: "44-48", explanation: "GUID root만 reverse-order delete하는 helper입니다." },
          { lines: "51-57", explanation: "normalized system temp direct-child invariant를 생성 전 검사하고 full JDK를 요구합니다." },
          { lines: "59-81", explanation: "다섯 sources를 line이 명시적인 String.join으로 만들어 static-context, forward-reference, access, modifier 오류를 분리합니다." },
          { lines: "82-92", explanation: "각 결과가 exactly one error·zero warnings·expected line/code인지 assertion하고 check count를 출력합니다." },
          { lines: "93-97", explanation: "finally에서 parent boundary를 다시 확인한 뒤 모든 partial classes와 root를 제거하고 cleanup=true를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK", "OS temporary directory write permission"], command: isolatedJavaRun("StaticNegativeCompilerSuite.java", "StaticNegativeCompilerSuite") },
        output: { value: "staticThis=false,line=3,code=compiler.err.non-static.cant.be.ref\nstaticOwn=false,line=3,code=compiler.err.non-static.cant.be.ref\nforward=false,line=2,code=compiler.err.illegal.forward.ref\nprivateUtility=false,line=2,code=compiler.err.report.access\ntopLevelStatic=false,line=1,code=compiler.err.mod.not.allowed.here\nchecks=5\ncleanup=true", explanation: ["static receiver 관련 두 fixtures는 같은 code이지만 source 이름과 line을 독립 고정합니다.", "forward/access/modifier fixtures도 각각 exactly one expected error와 zero warnings입니다.", "모든 task가 explicit temp -d를 사용하고 finally 뒤 cleanup=true입니다."] },
        experiments: [
          { change: "staticOwn의 read에 `new StaticOwn().own`을 사용합니다.", prediction: "해당 fixture가 compile 성공해 expected-failure assertion이 실패합니다.", result: "static method에서도 explicit object reference를 통한 instance access는 가능합니다." },
          { change: "Forward의 later read를 `later = 7` assignment statement로 바꿉니다.", prediction: "illegal forward read가 사라져 fixture가 더 이상 기대 code로 실패하지 않습니다.", result: "simple-name forward read와 assignment를 구분합니다." },
          { change: "Top을 outer class 안 `static class Top` member로 옮깁니다.", prediction: "modifier가 허용되어 compile 성공합니다.", result: "top-level class와 static member class 규칙을 분리합니다." },
        ],
        sourceRefs: ["jdk21-javac", "java-compiler-api", "java-diagnostic-api", "java-files-api", "java-uuid-api", "jls-static-context", "jls-forward-reference", "jls-access-control", "jls-class-modifiers"],
      }],
      diagnostics: [
        { symptom: "negative suite가 실패했지만 기대한 static 오류가 아니라 parse error였다.", likelyCause: "ok=false만 검사하거나 fixture가 여러 독립 오류를 포함했습니다.", checks: ["ERROR count를 확인합니다.", "first source line과 code를 비교합니다.", "fixture를 한 invalid construct로 줄입니다."], fix: "exactly one error·zero warnings·expected line/code assertion으로 원인을 고정합니다.", prevention: "negative fixture마다 한 언어 규칙만 검증합니다." },
        { symptom: "expected-fail 실행 뒤 repository에 Utility.class가 남는다.", likelyCause: "JavaCompiler task의 -d가 빠졌거나 cleanup root boundary를 확인하지 않았습니다.", checks: ["모든 options에 -d를 확인합니다.", "output이 temp direct child 아래인지 봅니다.", "finally와 post-delete existence를 확인합니다."], fix: "각 fixture에 dedicated temp output을 주고 검증된 GUID root만 삭제합니다.", prevention: "검증 전후 repository .class count와 cleanup=true를 CI 계약에 둡니다." },
        { symptom: "다른 JDK vendor/version에서 diagnostic code assertion이 바뀐다.", likelyCause: "OpenJDK 내부 code를 Java language portable text로 취급했습니다.", checks: ["java/javac version과 vendor를 기록합니다.", "JLS상 거부 규칙은 유지되는지 봅니다.", "message가 아니라 structured diagnostic을 수집했는지 봅니다."], fix: "toolchain contract를 pin하거나 vendor별 expectation layer를 둡니다.", prevention: "language semantics와 compiler regression code를 문서에서 분리합니다." },
      ],
      comparisons: [{ title: "static 계약 검증 층", options: [
        { name: "runtime exact output", chooseWhen: "초기화 순서·state transition·failure type을 확인할 때", avoidWhen: "접근 제한·invalid source를 검증할 때", tradeoffs: ["행동 증거", "구조 누락"] },
        { name: "reflection structure", chooseWhen: "constructor/field/method modifier와 우회 API shape를 확인할 때", avoidWhen: "compile-time 거부 source가 필요할 때", tradeoffs: ["public shape 검증", "source diagnostics 없음"] },
        { name: "JavaCompiler negative", chooseWhen: "금지 구문을 line·code로 regression test할 때", avoidWhen: "JRE-only runtime이거나 vendor-neutral code가 필수일 때", tradeoffs: ["정확한 거부 증거", "toolchain 결합"] },
      ] }],
      expertNotes: ["compiler가 error 전에 일부 unrelated classes를 emit할 수 있으므로 failed task도 output isolation이 필요합니다.", "security manager 시대의 전역 초기화 관행을 그대로 복사하기보다 module/access/lifecycle 요구를 현재 JDK와 application architecture에서 다시 평가합니다."],
    },
  ],
  lab: {
    title: "학습 포털의 가격 계산·metrics·lazy catalog를 static lifecycle 계약으로 재설계합니다",
    scenario: "학습 포털에는 주문 subtotal 계산, 생성 요청 수 metrics, 필요할 때만 만드는 immutable catalog가 있습니다. 기존 구현은 mutable static counter와 static initializer의 숨은 I/O에 의존해 test 순서·동시성·재시도 문제가 생겼습니다. 원본 Ex01/02의 own/shared progression, Ex03/04의 textual order, Example의 class/instance trace를 privacy-safe synthetic values로 보존하면서 무상태 utility·injected lifecycle·lazy holder의 경계를 정하고 positive runtime, trigger, failure, race, structure, negative compile 계약으로 봉인합니다.",
    setup: [
      "OpenJDK 21.0.11 full JDK와 PowerShell 7+를 사용하고 production, runtime-contract, compiler-contract를 분리합니다.",
      "원본 범위5와 class04 전체26을 별도 output에 compile해 scope warning0과 unrelated package serial warning1을 각각 기록합니다.",
      "StaticOwnership, PriceMath, CatalogProvider, LazyCatalog, RequestMetrics, PortalBootstrap 역할과 각 state owner/lifecycle을 표로 만듭니다.",
      "모든 positive Java compile은 `--release 21 -proc:none -encoding UTF-8 -Xlint:all -d`를 사용하고 compiler output이 비어 있음을 확인하며, negative fixtures는 exactly one expected error와 zero warnings를 별도 확인합니다.",
      "runtime·negative compiler artifacts는 normalized system temp의 direct GUID child에만 만들고 실제 개인정보·credential·로컬 절대 경로를 output에 넣지 않습니다.",
    ],
    steps: [
      "Ex01/02를 own=11|11|11, shared=11|12|13 synthetic counter로 재구성하고 object별 storage와 class별 storage를 분리합니다.",
      "static method가 implicit this 없이 동작함을 설명하고 explicit Metrics object를 parameter로 받은 positive access와 unqualified own negative fixture를 함께 둡니다.",
      "PortalBootstrap의 class literal, compile-time constant read, non-constant static field read, static method call, new에 marker를 넣어 trigger/non-trigger 표를 실행으로 검증합니다.",
      "Ex03/04의 s2~s6를 default→field initializer→static block→later initializer transitions로 표기하고 s5가70, s6가1000인 이유를 assertion합니다.",
      "static fields/blocks와 instance fields/blocks/constructor marker를 한 class에 두고 첫 new와 두 번째 new의 반복 횟수를 exact output으로 비교합니다.",
      "Example active two-line golden은 그대로 유지하고 주석 네 호출은 별도 reconstruction에서 열 줄 trace로 실행합니다.",
      "PriceMath는 hidden mutable field 없이 positive operands와 multiplyExact만 사용하고 declared constructor가 정확히 하나이며 private인지 검사합니다.",
      "환경별 할인·시간·외부 catalog I/O는 static utility에 넣지 않고 constructor-injected policy/provider로 이동합니다.",
      "LazyCatalog Holder는 first call 전 creations0, first/second call 뒤1과 동일 identity를 확인하되 retry·close가 필요하면 injected lifecycle service로 대체합니다.",
      "Class.forName false/true 실험으로 load와 initialize를 분리하고 report에 loader identity를 포함합니다.",
      "synthetic initializer failure의 first ExceptionInInitializerError와 later NoClassDefFoundError를 분리해 원인 chain과 erroneous-class 정책을 기록합니다.",
      "mutable plain static counter는 두 readers barrier로 lost update1을 강제하고 AtomicInteger two increments2와 비교합니다.",
      "public constant v1 client와 v2 producer-only compile 실험으로 client7|12와 api8|12를 확인하고 독립 배포 정책을 정합니다.",
      "negative compiler suite에 static this, static unqualified instance field, illegal forward read, private utility new, top-level static을 각각 한 오류 source로 둡니다.",
      "마지막에 original audit, all synthetic compile/run, structural reflection, trigger ordering, failure lifecycle, concurrency, negative diagnostics, privacy, temp cleanup을 한 report에서 모두 통과시킵니다.",
    ],
    expectedResult: [
      "원본 범위5는 warning 없이 compile되고 Ex02·Ex04·Example exact summaries가 보존되며 package의 unrelated serial warning1은 숨기지 않습니다.",
      "instance own snapshots는 object마다11이고 shared static snapshots는11→12→13입니다.",
      "constant/class literal은 Target initialization을 trigger하지 않고 non-constant static read·static method·new는 규칙에 맞는 시점에 한 번 trigger합니다.",
      "s2=0, s3=700, s4=1300, s5=70, s6=1000, instance s1=0의 transition 근거가 source order와 일치합니다.",
      "첫 new만 static markers를 포함하고 두 new 모두 instance field→block→constructor markers를 포함합니다.",
      "Example 원본 two-line과 reconstruction ten-line outputs가 provenance label로 분리됩니다.",
      "PriceMath 정상6000·invalid·overflow·constructorShape=count:1,private:true가 exact contract와 일치합니다.",
      "lazy holder creations는0→1에서 멈추고 first==second이며 initialization failure는 first/later error type이 다릅니다.",
      "forced race는 plain1, atomic2이고 test가 확률 loop나 sleep에 의존하지 않습니다.",
      "다섯 negative fixtures는 exactly one expected OpenJDK21 error·zero warnings·기대 line/code로 실패하고 cleanup=true입니다.",
      "공개 code/output/source evidence에는 실제 개인정보·credential·로컬 절대 경로·비결정적 identity hash가 없습니다.",
    ],
    cleanup: [
      "각 resolved root의 parent가 normalized system temp와 같은지 확인한 뒤 해당 GUID root만 reverse-order로 제거합니다.",
      "positive/negative classes, generated sources, compiler reports가 남지 않았는지 확인하고 repository의 새 .class 잔여물이0인지 검사합니다.",
      "원본 javastudy2 sources와 inventory files는 read-only evidence로 유지하고 lab 과정에서 수정하지 않습니다.",
    ],
    extensions: [
      "두 custom URLClassLoader가 같은 binary name을 각각 define하도록 최소 plugin 실험을 만들고 Class identity와 singleton 수를 비교합니다.",
      "public constant producer/client version matrix를 v1/v2 양방향으로 확장하고 clean recompile 여부를 deployment manifest에 기록합니다.",
      "AtomicInteger 하나로 표현할 수 없는 multi-field invariant를 immutable snapshot+AtomicReference 또는 lock 설계로 확장합니다.",
      "retry·timeout·close가 있는 catalog를 explicit start/health/stop lifecycle service로 바꾸고 initializer failure와 운영 복구 시간을 비교합니다.",
      "JFR 또는 application metrics로 first-use initialization latency를 관찰하되 logging이 새 initialization cycle을 만들지 않는지 검토합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "Ex01~04의 static/instance 값과 초기화 순서를 개인정보 없는 marker 예제로 다시 만들고 exact output을 증명하세요.", requirements: ["세 objects의 own은11|11|11, shared snapshots는11|12|13으로 출력합니다.", "s2~s6의 default·initializer·block writes를 순서표로 만들고0|700|1300|70|1000을 assertion합니다.", "첫 new와 두 번째 new에서 static markers가 한 번만 나오는지 검사합니다.", "OpenJDK21 Xlint clean compile과 temp -d cleanup을 남깁니다."], hints: ["class timeline과 object timelines를 나누세요.", "initializer 없는 later declaration은 앞 assignment를0으로 되돌리지 않습니다."], expectedOutcome: "원본 숫자를 암기하지 않고 storage owner와 textual order로 모든 값을 다시 계산합니다.", solutionOutline: ["source audit", "state transition table", "marker implementation", "exact output comparison"] },
    { difficulty: "응용", prompt: "mutable static 가격/할인 helper를 stateless utility와 injected policy로 분리하고 binary constant evolution까지 검증하세요.", requirements: ["PriceMath는 private constructor, positive validation, multiplyExact, mutable static field0개를 갖습니다.", "할인 policy와 clock/config는 constructor-injected interface로 옮기고 test마다 독립 fake를 사용합니다.", "public primitive constant v1 client 뒤 producer-only v2 compile에서 stale/new 값을 함께 확인합니다.", "reflection structure, runtime exceptions, client recompile experiment를 자동화합니다."], hints: ["입력만으로 결과가 결정되는 계산과 환경에 따라 바뀌는 협력을 분리하세요.", "static final이 모두 constant variable은 아닙니다."], expectedOutcome: "간단한 계산은 무상태로 유지하면서 변화·환경·배포 버전은 명시 dependency와 계약으로 드러납니다.", solutionOutline: ["state inventory", "utility extraction", "policy injection", "producer/client matrix", "structural tests"] },
    { difficulty: "설계", prompt: "lazy catalog와 request metrics를 class initialization·failure·loader·concurrency 관점에서 운영 가능한 subsystem으로 설계하세요.", requirements: ["lazy holder를 선택하거나 피하는 기준을 creation cost, retry, close, scope로 설명합니다.", "first initialization failure와 later use error를 각각 관찰하고 root cause를 보존합니다.", "singleton scope를 binary name+defining loader로 명시하고 plugin별/공유 instance 정책을 정합니다.", "plain lost update를 deterministic barrier로 재현하고 선택한 synchronization strategy를 검증합니다.", "positive runtime, trigger, structural, negative compile, privacy, artifact cleanup suites를 분리합니다."], hints: ["class initialization의 한 번 실행 보장과 이후 mutable operations의 atomicity를 같은 것으로 보지 마세요.", "transient failure를 class erroneous state로 고착시키는 설계를 먼저 찾으세요."], expectedOutcome: "lazy creation의 편의뿐 아니라 실패 복구·loader scope·동시성·종료까지 owner가 분명한 운영 설계와 test matrix가 완성됩니다.", solutionOutline: ["lifecycle table", "loader boundary", "failure policy", "synchronization model", "six-layer verification"] },
  ],
  reviewQuestions: [
    { question: "instance field와 static field는 각각 누구에게 속하나요?", answer: "instance field storage는 각 object identity에, static field는 binary name만이 아니라 defining class loader까지 포함한 class identity에 속합니다." },
    { question: "static method code는 한 번이고 instance method code는 object마다 복제되나요?", answer: "그런 식으로 설명하지 않습니다. method code와 호출 receiver/state를 구분하며 instance마다 달라지는 핵심은 instance field storage와 receiver입니다." },
    { question: "static method에서 instance field를 절대 사용할 수 없나요?", answer: "implicit this가 없어 unqualified 접근은 안 되지만 argument나 new로 얻은 explicit object reference의 instance field는 접근할 수 있습니다." },
    { question: "static method 안에서 this를 쓸 수 없는 이유는 무엇인가요?", answer: "static context에는 current receiver가 없으므로 this expression이 가리킬 object가 없고 compiler가 non-static reference 오류로 거부합니다." },
    { question: "static modifier를 class에 사용할 수 없다는 말은 항상 맞나요?", answer: "아닙니다. top-level class에는 허용되지 않지만 member class는 static으로 선언할 수 있습니다. 선언 위치를 포함해 규칙을 말해야 합니다." },
    { question: "loading, preparation, initialization은 어떻게 다른가요?", answer: "loading은 binary로 Class를 만들고 linking의 preparation은 모든 class variables를 default values로 둡니다. initialization에서는 step 6이 constant variables를 먼저 설정하고 step 9가 나머지 static field initializers와 static blocks를 textual order로 실행합니다." },
    { question: "class initialization의 대표 active-use triggers는 무엇인가요?", answer: "new, static method invocation, declaring class의 non-constant static field read, declaring static field assignment, initialize=true reflection 요청 등이 있으며 정확한 목록은 JLS/API contract를 따릅니다." },
    { question: "Target.class와 compile-time constant read는 initialization을 trigger하나요?", answer: "일반적으로 class literal과 constant variable read는 initialization trigger가 아닙니다. load/link 여부와 initialization을 구분합니다." },
    { question: "superclass와 subclass initialization 순서는 어떻게 계산하나요?", answer: "class initialization이 필요하면 먼저 필요한 superclasses와 qualifying superinterfaces 규칙을 처리한 뒤 현재 class initializers를 실행하며, inherited field는 실제 declaring class를 기준으로 trigger를 판단합니다." },
    { question: "s5가 static block에서70을 받은 뒤 declaration에서0으로 돌아가지 않는 이유는 무엇인가요?", answer: "preparation default0은 이미 앞 단계에서 주어졌고 initializer 없는 declaration은 initialization 중 새 assignment를 실행하지 않으므로 block의70이 유지됩니다." },
    { question: "s6가 block의10이 아니라1000인 이유는 무엇인가요?", answer: "block 뒤 source에 `static int s6=1000` initializer가 있어 textual order상 뒤에서10을 덮기 때문입니다." },
    { question: "later static field를 앞 static block에서 assignment하는 것과 읽는 것은 같은가요?", answer: "아닙니다. 특정 simple-name forward assignment는 허용될 수 있지만 read는 illegal forward reference가 될 수 있으므로 expression 역할을 구분합니다." },
    { question: "static block과 instance initializer block은 각각 몇 번 실행되나요?", answer: "정상 static initialization은 class identity당 한 번, instance initializer는 해당 class의 각 new receiver construction마다 한 번 실행됩니다." },
    { question: "현재 class에서 instance field/block/constructor body의 순서는 무엇인가요?", answer: "superclass constructor processing 뒤 현재 class의 instance field initializers와 instance initializer blocks가 source order로 실행되고 선택된 constructor body가 실행됩니다." },
    { question: "원본 Example의 active output과 주석 reconstruction output은 왜 분리하나요?", answer: "실제 active main은 두 줄만 내며 주석 호출의 열 줄은 변경한 별도 실행입니다. source provenance와 runtime evidence를 섞지 않기 위해서입니다." },
    { question: "static final field는 모두 client에 인라인되나요?", answer: "아닙니다. primitive/String final variable이 constant expression으로 초기화되는 constant-variable 조건을 만족해야 하며 Integer BOXED 같은 field는 해당하지 않습니다." },
    { question: "producer constant만 바꿨는데 old client가 이전 값을 보는 이유는 무엇인가요?", answer: "old client class file에 이전 constant literal이 포함됐기 때문이며 producer 재시작 문제가 아니라 client와 producer binary version skew입니다." },
    { question: "static utility와 injected service의 선택 기준은 무엇인가요?", answer: "작고 deterministic한 무상태 계산은 utility 후보이고 정책 변화, I/O, 시간, failure, scope, test replacement가 필요하면 injected service가 적합합니다." },
    { question: "lazy holder가 thread-safe한 핵심 근거는 무엇인가요?", answer: "Holder first active use가 JLS class initialization의 mutual exclusion과 successful initialization visibility를 이용하며 같은 Holder.INSTANCE를 한 번 공개하기 때문입니다." },
    { question: "lazy holder는 failure retry와 resource close도 해결하나요?", answer: "아닙니다. initialization 실패는 erroneous class를 만들 수 있고 close/retry/refresh scope는 명시 lifecycle service가 더 적합합니다." },
    { question: "class initialization 첫 실패와 이후 실패는 어떤 error가 될 수 있나요?", answer: "RuntimeException이 initializer 밖으로 나오면 첫 caller는 ExceptionInInitializerError, 같은 loader의 later active use는 NoClassDefFoundError를 받을 수 있습니다." },
    { question: "같은 binary name의 singleton이 JVM에서 여러 개 생길 수 있나요?", answer: "그렇습니다. 서로 다른 defining class loaders가 각각 class를 정의하면 다른 Class identity와 static storage, singleton을 가질 수 있습니다." },
    { question: "class initialization이 안전하니 mutable static counter++도 thread-safe한가요?", answer: "아닙니다. initialization 보장은 한 번의 초기화와 visibility에 관한 것이며 이후 ++는 compound read-modify-write라 별도 atomicity가 필요합니다." },
    { question: "negative compile test에서 ok=false만 확인하면 왜 부족한가요?", answer: "엉뚱한 parse/access 오류도 실패하므로 exactly one error, zero warnings, 기대 source line과 pinned diagnostic code를 함께 검사해야 합니다." },
  ],
  completionChecklist: [
    "inventory 직접 원본 Ex01_Static·Ex03_Static·Example과 companion Ex02_StaticMain·Ex04_StaticMain 범위5를 모두 읽었다.",
    "class04 전체26 package smoke와 OOP05 범위5 scoped compile을 별도 -d에서 실행했다.",
    "package warning1이 범위 밖 Ex09_Sub serial shape이고 scope5는 warning0임을 분리 기록했다.",
    "Ex02 8행에서 own11|11|11, shared11|12|13, separators2를 exact summary했다.",
    "Ex04 6행 0|700|1300|70|1000|0을 exact summary했다.",
    "Example active output이 static1|main s2 두 줄임을 실제 실행으로 확인했다.",
    "instance storage와 defining class identity의 static storage를 구분했다.",
    "method code와 object별 instance storage를 혼동하지 않았다.",
    "static access를 instance reference가 아닌 defining class로 qualification했다.",
    "static method의 implicit receiver 부재와 explicit object access 가능성을 함께 설명했다.",
    "top-level static class 금지와 static member class 허용을 구분했다.",
    "loading·linking preparation·initialization 단계를 분리했다.",
    "preparation의 default values와 source initializers의 later writes를 구분했다.",
    "class literal·constant read non-trigger와 static method·non-constant field·new trigger를 exact trace로 확인했다.",
    "superclass/declaring class를 고려해 initialization owner를 판단했다.",
    "s5 declaration에 initializer가 없어70을 유지함을 설명했다.",
    "s6 later initializer1000이 block의10을 덮음을 설명했다.",
    "forward simple-name read와 assignment 규칙을 negative/positive contracts로 구분했다.",
    "static field/block은 class당 한 번, instance field/block/constructor는 new마다 실행됨을 확인했다.",
    "current-class instance field→block→constructor body textual order를 exact markers로 재현했다.",
    "Example 원본 two-line과 별도 reconstruction ten-line evidence를 섞지 않았다.",
    "Example reconstruction에서 a와 x의 모든 before/after transitions를 설명했다.",
    "constant variable의 primitive/String final+constant expression 조건을 설명했다.",
    "producer-only 변경에서 old client7|12와 new Api8|12를 재현했다.",
    "public constant 변경의 binary version skew와 client recompile 정책을 기록했다.",
    "PriceMath utility가 mutable static state 없이 validation과 multiplyExact를 사용함을 확인했다.",
    "utility의 declared constructor가 정확히 하나이고 private임을 reflection assertion으로 확인했다.",
    "정책·시간·외부 I/O·scope가 필요한 협력을 injected service로 분리했다.",
    "lazy holder 호출 전 creations0, 호출 뒤1, first==second를 확인했다.",
    "successful class initialization visibility와 이후 mutable operation atomicity를 구분했다.",
    "Class.forName false에서0, true에서1, repeated true에서1을 확인했다.",
    "first initialization failure와 later use가 각각 ExceptionInInitializerError·NoClassDefFoundError임을 확인했다.",
    "singleton scope를 binary name+defining loader로 문서화했다.",
    "두 readers barrier로 plain lost update1을 deterministic하게 재현했다.",
    "AtomicInteger increments2와 volatile만으로 compound update가 안전하지 않음을 설명했다.",
    "static this·unqualified instance field·forward read·private constructor new·top-level static 다섯 negative fixtures를 실행했다.",
    "각 negative task가 exactly one error·zero warnings·기대 1-based line·OpenJDK21 diagnostic code에서 실패했다.",
    "모든 compiler tasks에 explicit temp -d를 전달해 partial class artifacts를 격리했다.",
    "normalized system temp direct GUID child invariant를 생성 전·cleanup 전에 검증했다.",
    "공개 code/output/evidence에 개인정보·credential·원본 민감 문자열·비결정적 identity hash·로컬 절대 경로가 없음을 확인했다.",
  ],
  nextSessions: ["oop-06-inheritance-super"],
  sources: [
    { id: "java-class04-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex01_Static.java", usedFor: ["instance su versus static num", "static method comments", "misconception correction"], evidence: "su=10 instance field와 num=10 static field를 constructor가 각각 증가시키며 play02의 주석이 static method에서 unqualified su를 금지합니다. ‘su가 아직 안 만들어져서’가 아니라 implicit receiver 부재로 교정했습니다." },
    { id: "java-class04-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex02_StaticMain.java", usedFor: ["three object execution", "exact own/shared output", "separator count"], evidence: "세 Ex01 objects의 su는 모두11이고 construction 직후 num snapshots는11·12·13이며 separator 두 줄을 포함한 전체8행을 확인했습니다." },
    { id: "java-class04-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex03_Static.java", usedFor: ["preparation defaults", "static textual order", "s5/s6 later declarations"], evidence: "s2 default0, s3 block700, s4 initializer300 뒤 block1300, s5 block70 뒤 initializer 없는 declaration, s6 block10 뒤 initializer1000의 active source를 읽었습니다." },
    { id: "java-class04-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex04_StaticMain.java", usedFor: ["six-value exact output", "instance s1 after new"], evidence: "static values 0·700·1300·70·1000과 new 뒤 instance s1=0을 순서대로 출력하는6행 main을 확인했습니다." },
    { id: "java-class04-example", repository: "javastudy2/classstudy", path: "src/com/java/class04/Example.java", usedFor: ["active two-line golden", "static/instance/constructor order", "commented full path reconstruction"], evidence: "active main은 `main s` class read만 수행해 static1·main s2 두 줄입니다. 주석 new/field/s/m 경로의 state transitions는 별도 reconstruction으로 분리했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK21 clean compilation", "Xlint diagnostics", "negative compiler contracts", "explicit output isolation"], evidence: "package26·scope5·모든 synthetic examples와 in-memory negative sources의 OpenJDK21.0.11 options 및 warning/error 기준입니다." },
    { id: "jls-static-fields", repository: "JLS SE 21", path: "8.3.1.1 static Fields", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.1.1", usedFor: ["class variable ownership", "instance versus static storage", "class qualification"], evidence: "static field가 class variable이며 instances와 관계없이 존재하는 선언 의미의 primary specification입니다." },
    { id: "jls-static-methods", repository: "JLS SE 21", path: "8.4.3.2 static Methods", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.2", usedFor: ["static method declaration", "no current receiver", "utility methods"], evidence: "static method가 class method이고 instance method와 다른 invocation/override 성질을 갖는 근거입니다." },
    { id: "jls-static-context", repository: "JLS SE 21", path: "8.1.3 Inner Classes and Enclosing Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.3", usedFor: ["static context", "this rejection", "unqualified instance access"], evidence: "static context에서 enclosing instance/current this를 사용할 수 없는 language 근거입니다." },
    { id: "jls-class-loader-identity", repository: "JLS SE 21", path: "4.3.4 When Reference Types Are the Same", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.3.4", usedFor: ["binary name plus defining loader", "singleton scope", "runtime type identity"], evidence: "runtime reference type identity가 binary name뿐 아니라 defining class loader에도 의존하는 근거입니다." },
    { id: "jls-loading", repository: "JLS SE 21", path: "12.2 Loading of Classes and Interfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.2", usedFor: ["loading stage", "loader consistency", "load versus initialize"], evidence: "binary representation으로 Class/interface를 만드는 loading 절차와 error timing의 근거입니다." },
    { id: "jls-linking", repository: "JLS SE 21", path: "12.3 Linking of Classes and Interfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.3", usedFor: ["verification preparation resolution", "linking stage"], evidence: "loading 뒤 initialization 전 linking의 verification·preparation·resolution 구분 근거입니다." },
    { id: "jls-preparation", repository: "JLS SE 21", path: "12.3.2 Preparation of a Class or Interface", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.3.2", usedFor: ["static storage", "default values before initializers", "Ex03 state table"], evidence: "class variables의 storage를 만들고 default values로 초기화하는 preparation 단계 근거입니다." },
    { id: "jls-init-triggers", repository: "JLS SE 21", path: "12.4.1 When Initialization Occurs", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4.1", usedFor: ["active-use triggers", "constant/class literal non-triggers", "declaring class"], evidence: "new·static invocation·non-constant static field use 및 initialization이 일어나는 정확한 조건의 primary specification입니다." },
    { id: "jls-init-procedure", repository: "JLS SE 21", path: "12.4.2 Detailed Initialization Procedure", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4.2", usedFor: ["initialization lock", "superclass order", "successful publication", "erroneous class"], evidence: "동시 initialization, recursive request, abrupt completion과 erroneous state까지 포함한 detailed procedure 근거입니다." },
    { id: "jls-static-initializers", repository: "JLS SE 21", path: "8.7 Static Initializers", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.7", usedFor: ["static block", "textual execution", "abrupt completion"], evidence: "static initializer block의 선언·실행·정상 완료 가능성 제약 근거입니다." },
    { id: "jls-forward-reference", repository: "JLS SE 21", path: "8.3.3 Forward References During Field Initialization", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.3", usedFor: ["illegal simple-name read", "assignment distinction", "textual order"], evidence: "field declaration보다 앞선 reference의 compile-time restriction과 예외 조건 근거입니다." },
    { id: "jls-constant-variable", repository: "JLS SE 21", path: "4.12.4 final Variables", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.4", usedFor: ["constant-variable definition", "primitive/String final", "non-trigger reads"], evidence: "constant variable이 primitive/String final이며 constant expression으로 초기화된다는 정의 근거입니다." },
    { id: "jls-constant-expressions", repository: "JLS SE 21", path: "15.29 Constant Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.29", usedFor: ["allowed constant expression forms", "initializer classification"], evidence: "compile-time constant expression이 될 수 있는 operands와 expressions의 primary specification입니다." },
    { id: "jls-instance-creation", repository: "JLS SE 21", path: "12.5 Creation of New Class Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5", usedFor: ["new trigger", "superclass/current class order", "constructor processing"], evidence: "allocation/default values와 superclass부터 current class initialization/constructor body로 이어지는 instance creation 절차 근거입니다." },
    { id: "jls-instance-initializers", repository: "JLS SE 21", path: "8.6 Instance Initializers", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.6", usedFor: ["instance block", "per-new execution", "textual order"], evidence: "instance initializer block의 실행과 abrupt completion/checked exception 제약 근거입니다." },
    { id: "jls-field-initialization", repository: "JLS SE 21", path: "8.3.2 Field Initialization", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.2", usedFor: ["instance field initializer", "class field initializer", "textual state transitions"], evidence: "field initializer 실행과 receiver/current class initialization 관계의 근거입니다." },
    { id: "jls-binary-constant-fields", repository: "JLS SE 21", path: "13.4.9 final Fields and Constants", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.9", usedFor: ["constant inlining", "old client values", "binary evolution"], evidence: "constant field 값이 client binary에 포함될 수 있어 변경 뒤 clients recompile이 필요하다는 compatibility 근거입니다." },
    { id: "jls-default-constructor", repository: "JLS SE 21", path: "8.8.9 Default Constructor", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.9", usedFor: ["utility constructor absence", "implicit constructor shape"], evidence: "constructor declaration이 없을 때 compiler가 default constructor를 암시 선언하므로 utility class가 private constructor를 명시해야 하는 근거입니다." },
    { id: "jls-happens-before", repository: "JLS SE 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["thread start/join", "synchronization ordering", "race observation"], evidence: "thread start/join과 synchronization actions를 포함한 일반 happens-before 관계의 memory-model 근거이며 class initialization 자체의 lock·visibility 절차는 JLS 12.4.2를 사용합니다." },
    { id: "jls-access-control", repository: "JLS SE 21", path: "6.6 Access Control", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6", usedFor: ["private constructor rejection", "member accessibility"], evidence: "private utility constructor를 다른 top-level class에서 호출할 수 없는 compile-time access 근거입니다." },
    { id: "jls-class-modifiers", repository: "JLS SE 21", path: "8.1.1 Class Modifiers", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1", usedFor: ["top-level static rejection", "static member class distinction"], evidence: "top-level class와 member class에 허용되는 modifiers가 다르다는 선언 규칙 근거입니다." },
    { id: "java-class-forname", repository: "Java SE 21 API", path: "java.lang.Class.forName(String, boolean, ClassLoader)", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#forName(java.lang.String,boolean,java.lang.ClassLoader)", usedFor: ["load without initialize", "explicit initialize flag", "loader selection"], evidence: "initialize boolean과 specified loader를 받는 overload의 official behavior 근거입니다." },
    { id: "java-classloader-api", repository: "Java SE 21 API", path: "java.lang.ClassLoader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html", usedFor: ["defining loader", "URLClassLoader parent", "runtime identity"], evidence: "classes/resources loading과 delegation 및 defining loader 관찰의 official API 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math.multiplyExact", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#multiplyExact(int,int)", usedFor: ["overflow-safe subtotal", "ArithmeticException contract"], evidence: "int multiplication overflow 시 ArithmeticException을 던지는 exact arithmetic API 근거입니다." },
    { id: "java-reflection-constructor", repository: "Java SE 21 API", path: "java.lang.Class.getDeclaredConstructors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#getDeclaredConstructors()", usedFor: ["utility structural contract", "exact declared-constructor count"], evidence: "declared constructor array를 얻어 compiler-generated default constructor까지 포함한 instance creation surface를 구조적으로 검사하는 API 근거입니다." },
    { id: "java-modifier-api", repository: "Java SE 21 API", path: "java.lang.reflect.Modifier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Modifier.html", usedFor: ["private constructor assertion", "modifier assertions"], evidence: "reflection modifier bit를 isPrivate 등으로 판정하는 official API 근거입니다." },
    { id: "java-exception-in-initializer-error", repository: "Java SE 21 API", path: "java.lang.ExceptionInInitializerError", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ExceptionInInitializerError.html", usedFor: ["first initialization failure", "wrapped exception"], evidence: "static initializer 또는 static variable initializer 평가 중 exception이 발생한 first failure error의 API 근거입니다." },
    { id: "java-no-class-def-found-error", repository: "Java SE 21 API", path: "java.lang.NoClassDefFoundError", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/NoClassDefFoundError.html", usedFor: ["later erroneous-class use", "failure lifecycle"], evidence: "필요한 class definition을 사용할 수 없을 때의 Error type이며 initialization failure 뒤 later use contract와 JLS procedure를 함께 설명합니다." },
    { id: "java-atomic-integer", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["atomic increment", "plain counter comparison"], evidence: "atomically updated int와 incrementAndGet operation의 official API contract입니다." },
    { id: "java-countdown-latch", repository: "Java SE 21 API", path: "java.util.concurrent.CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["forced two-read barrier", "deterministic lost update"], evidence: "workers가 모두 snapshot을 읽은 뒤 write gate를 여는 one-shot synchronization aid 근거입니다." },
    { id: "java-thread-api", repository: "Java SE 21 API", path: "java.lang.Thread", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html", usedFor: ["start/join", "interrupt preservation", "concurrency contract"], evidence: "worker lifecycle와 join completion을 이용한 deterministic observation 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["in-memory negative compile", "producer/client binary experiment", "explicit options"], evidence: "실행 중 compilation task를 구성해 invalid fixtures와 binary evolution을 production build 밖에서 검증하는 API 근거입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["error kind", "line number", "diagnostic code"], evidence: "compiler diagnostics를 message 문자열이 아니라 kind·line·code로 구조화하는 API 근거입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp source/classes", "safe cleanup", "artifact absence"], evidence: "temporary experiment trees의 create/write/walk/delete 및 existence 검증 근거입니다." },
    { id: "java-uuid-api", repository: "Java SE 21 API", path: "java.util.UUID", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html", usedFor: ["unique direct temp child", "collision avoidance"], evidence: "검증 실행별 system temp direct-child 이름을 충돌 가능성이 낮게 생성하는 API 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "inventory가 직접 지정한 Ex01_Static·Ex03_Static·Example 세 files와 실행 companion Ex02_StaticMain·Ex04_StaticMain 두 files를 모두 읽어 선언과 runtime evidence를 범위5로 연결했습니다.",
      "class04 package 전체26을 dependency drift smoke로 compile하고 OOP05 범위5를 별도 output에 compile했습니다. package exit0 warning1은 범위 밖 Ex09_Sub의 missing serialVersionUID이고 scope5는 exit0 warning0입니다.",
      "범위5의 runnable mains는 Ex02·Ex04·Example 세 개, compile-only declarations는 Ex01·Ex03 두 개이며 main/compile-only 역할을 바꾸어 세지 않았습니다.",
      "Ex02 raw8행은 instance11·11·11, shared11·12·13, separator2로 exact summary해 shared state progression을 보존했습니다.",
      "Ex04 raw6행은0·700·1300·70·1000·0이며 s5 declaration-without-initializer가70을 유지하고 s6 later initializer가10을1000으로 덮는 active source order로 설명했습니다.",
      "Example active main은 static1·main s2 두 줄뿐입니다. 주석 처리된 new/field/static-method/instance-method 경로는 원본 golden으로 부풀리지 않고 교육용 reconstruction 열 줄로 별도 표시했습니다.",
      "Ex01 주석의 ‘su가 아직 만들어지지 않아 static method에서 접근 불가’는 implicit receiver 부재로, ‘class에 static 사용 불가’는 top-level class와 static member class 구분으로 교정했습니다.",
      "loading·preparation·initialization, active-use triggers, constant non-trigger, superclass/declaring-class order, class-loader identity는 원본 설명만으로 충분하지 않아 JLS SE21로 보충했습니다.",
      "per-new instance field/block/constructor order와 Example full state trace는 원본 코드 구조를 synthetic class names/values로 재구성해 각 stdout을 OpenJDK21 exact contract로 고정했습니다.",
      "constant inlining은 v1 producer+client 뒤 v2 producer-only compile로 client7|12·api8|12를 재현하고 JLS binary compatibility 근거로 보충했습니다.",
      "utility/injection, lazy holder, initialization failure, loader scope, AtomicInteger concurrency는 production 설계·운영 확장이며 원본 학습 숫자와 혼동하지 않게 official APIs/JLS sources를 연결했습니다.",
      "initialization failure는 RuntimeException first use의 ExceptionInInitializerError와 같은 loader later use의 NoClassDefFoundError를 별도 methods로 exact 검증했습니다.",
      "plain race는 sleep·확률 반복 없이 두 CountDownLatch로 workers가 모두0을 읽은 뒤 쓰게 해 plain1을 강제하고 AtomicInteger2와 비교했습니다.",
      "negative JavaCompiler fixtures는 static this·static own·forward read·private constructor access·top-level static을 각각 exactly one error·zero warnings·expected line/code로 OpenJDK21.0.11에 pin했습니다.",
      "모든 positive run command와 inner compiler tasks는 explicit temp classes output을 사용하고 normalized system temp direct-child boundary 뒤 생성 GUID root만 제거합니다.",
      "실제 개인정보·credential·원본 개인 문자열·로컬 절대 경로·비결정적 identity hash를 공개 code/output/evidence에 포함하지 않았고 synthetic P1/S1/정수 markers만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
