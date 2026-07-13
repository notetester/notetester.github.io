import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-08-abstract"],
  slug: "oop-08-abstract",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 18,
  title: "추상 클래스·추상 메서드와 템플릿 메서드",
  subtitle: "공통 상태·완성된 workflow·미완성 hook의 경계를 설계하고, 구체 subclass·익명 class·strategy 대안을 실행 계약으로 비교합니다.",
  level: "중급",
  estimatedMinutes: 700,
  coreQuestion: "직접 만들 수 없는 base type에 무엇을 완성해 두고 무엇을 subclass 의무로 남겨야, invariant와 실패 정책을 잃지 않는 확장 구조가 될까요?",
  summary: "javastudy2 class05 전체 16개와 OOP08 범위 Ex01_Abstract·Ex02_Dog·Ex03_Main·Ex07_Cale·Ex08_Cale·Ex10_Main 여섯 파일을 OpenJDK 21.0.11의 별도 output directories에서 감사했습니다. 전체와 범위는 모두 exit0이며 compiler.warn.auxiliary.class.accessed.from.outside.of.its.source.file 경고가 정확히6개입니다. Ex02_Dog.java 한 파일에 package-private Ex05_Cat·Ex06_Cow까지, Ex08_Cale.java에 Ex09_Cale까지 함께 선언하고 다른 source에서 접근하기 때문에 생기는 구조 경고로 숨기지 않습니다. Ex03은 abstract base constructor와 각 sound가 교대로 나오는 정확히6행입니다. Ex10은 Ex08의 stateful calculator를 사용하는 interactive companion이므로 범위에 포함하며 ProcessStartInfo 네 개로 정상 덧셈12.0, 나눗셈0의 warning+result0.0, invalid menu가 operands를 먼저 읽고 result 없이 재메뉴로 가는 흐름, 즉시0종료를 독립 입력 계약으로 재현합니다. Ex07의 Div는 zero에서 ArithmeticException을 throw하지만 Ex08/09는 message를 print하고 mutable result를0으로 바꾸므로 서로 다른 failure semantics입니다. 원본 주석 중 ‘추상 클래스는 하나 이상의 추상 메서드를 가진다’는 표현은 abstract method가0개여도 abstract class가 가능하다는 같은 파일의 다음 주석과 JLS 기준으로 교정합니다. 직접 new할 수 없다는 것은 constructor가 없다는 뜻이 아니며 concrete subclass construction 중 base constructor·fields·concrete methods가 실제 실행됩니다. 이어 abstract method modifier/body 규칙, obligation propagation, anonymous concrete subclass, operation-per-subclass와 wide mutable abstraction 비교, interface·strategy·composition 선택, final Template Method, reflection·negative compiler contract까지 확장합니다.",
  objectives: [
    "abstract class가 abstract method를0개 이상 가질 수 있고 fields·constructors·concrete methods도 포함할 수 있음을 설명한다.",
    "abstract class의 direct instance creation 금지와 concrete subclass 생성 중 base constructor 실행을 구분한다.",
    "abstract method의 semicolon body form과 private·static·final·native·synchronized 등 incompatible modifiers를 판별한다.",
    "abstract subclass가 obligation을 미룰 수 있지만 concrete subclass는 inherited abstract methods를 모두 구현해야 함을 추적한다.",
    "anonymous concrete subclass를 일회성 구현에 사용하고 이름 있는 class·lambda·strategy와 유지보수 비용을 비교한다.",
    "Ex07의 operation-per-subclass return/throw 계약과 Ex08의 mutable result·wide methods·print-and-zero 계약을 구분하고 개선한다.",
    "final public Template Method와 protected abstract hooks로 workflow 순서·invariant·오류 정책을 base class가 통제하도록 설계·검증한다.",
  ],
  prerequisites: [{ title: "오버라이딩·업캐스팅·다형성", reason: "추상 method obligation은 override 관계이며 caller는 abstract base view로 concrete runtime implementation을 호출하므로 override와 dynamic dispatch를 먼저 이해해야 합니다.", sessionSlug: "oop-07-polymorphism" }],
  keywords: ["abstract class", "abstract method", "direct instantiation", "constructor", "concrete method", "abstract obligation", "concrete subclass", "anonymous class", "operation object", "stateful calculator", "failure contract", "strategy", "composition", "interface", "template method", "final workflow", "protected hook", "invariant", "reflection", "compiler diagnostics"],
  chapters: [
    {
      id: "six-source-interactive-golden-audit",
      title: "class05 전체16·범위6과 Ex03·Ex10 실행을 compile warning과 입력 case까지 분리 고정합니다",
      lead: "auxiliary-class 경고를 clean으로 지우지 않고 source layout debt로 기록하며 interactive main은 case별 새 process로 격리합니다.",
      explanations: [
        "범위의 앞 세 파일은 하나의 abstract sound obligation이 concrete·abstract intermediate subclasses를 거쳐 어떻게 완성되는지 보여 줍니다. Ex01은 fields2·public constructor·concrete play·abstract sound를 함께 갖습니다.",
        "Ex02_Dog.java 한 파일에는 concrete Dog, abstract Cat intermediate, abstract Cow intermediate, concrete Cat, concrete Cow가 함께 있습니다. Ex03_Main이 다른 source file에 있는 package-private auxiliary classes를 사용해 -Xlint:all 경고4개가 발생합니다.",
        "Ex07_Cale는 abstract operate 하나와 Add·Sub·Mul·Div·Rem 다섯 operation classes를 한 파일에 둡니다. Div만 divisor0에서 ArithmeticException을 throw하며 호출자에게 failure를 전달합니다.",
        "Ex08_Cale는 mutable double result와 plus·minus·multiply·division 네 abstract void methods를 갖고 Ex09_Cale이 전부 구현합니다. Ex10_Main이 다른 파일의 auxiliary Ex09_Cale을 사용해 같은 warning2개가 더 생깁니다.",
        "전체 class05 16 files와 범위6은 모두 warning6입니다. warning code는 하나지만 source occurrence는 Ex03_Main4·Ex10_Main2이고 compiler summary line까지 포함한 captured output은7행입니다.",
        "Ex03은 base constructor와 sound가 세 object마다 교대로 나오는6행입니다. abstract base를 직접 new하지 않아도 concrete Dog/Cat/Cow construction의 super 단계에서 base constructor가 세 번 실행됩니다.",
        "Ex10은 Scanner loop라 한 process에 여러 unrelated cases를 넣으면 mutable result와 input cursor가 서로 영향을 줍니다. add·divzero·invalid·exit 네 개를 새 JVM으로 실행해 menu count, operand prompts, result tokens, warning/invalid/end flags를 assert합니다.",
        "invalid menu9도 Ex10 source상 else branch에서 두 operands를 먼저 읽은 뒤 switch default에 도달합니다. 사용자 경험 결함이지만 원본 동작을 ‘메뉴 즉시 거부’로 고쳐 기록하지 않고 synthetic core 개선과 분리합니다.",
      ],
      concepts: [
        { term: "auxiliary class warning", definition: "한 source file에 선언된 package-private top-level class를 다른 source file이 직접 사용해 javac -Xlint:all이 내는 구조 경고입니다.", detail: ["compile success와 별개입니다.", "각 top-level class를 자기 파일로 분리하면 제거할 수 있습니다."] },
        { term: "interactive process contract", definition: "stdin·stdout·stderr·exit code를 case별 새 JVM process로 고정하는 실행 검증입니다.", detail: ["Scanner cursor와 mutable state를 격리합니다.", "hang을 막기 위해 timeout과 kill 경로가 필요합니다."] },
        { term: "failure semantics", definition: "잘못된 input에서 throw, return sentinel, state mutation, message print 중 무엇을 caller에게 약속하는지에 관한 계약입니다.", detail: ["Ex07 Div와 Ex08/09 division은 다릅니다.", "같은 ‘0 나눗셈 처리’로 합치면 안 됩니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-oop08-audit",
        title: "package16·scope6을 compile하고 Ex03 exact6행과 Ex10 네 process cases를 검증합니다",
        language: "powershell",
        filename: "verify-original-oop08.ps1",
        purpose: "원본 추상 hierarchy와 interactive calculator를 warning·output·input·failure 계약까지 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop08 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
$optionNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedOptions = @{}
foreach ($name in $optionNames) {
  $savedOptions[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
  Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
}
try {
  $source = "src\com\java\class05"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scopeNames = @("Ex01_Abstract.java", "Ex02_Dog.java", "Ex03_Main.java",
    "Ex07_Cale.java", "Ex08_Cale.java", "Ex10_Main.java")
  $scoped = @($scopeNames | ForEach-Object { Join-Path $source $_ })
  $allOut = Join-Path $root "all classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $allOut, $scopeOut -ErrorAction Stop | Out-Null

  $allCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $allOut $all 2>&1)
  $allExit = $LASTEXITCODE
  $scopeCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $scopeOut $scoped 2>&1)
  $scopeExit = $LASTEXITCODE
  $warningPattern = "compiler\.warn\.auxiliary\.class\.accessed\.from\.outside\.of\.its\.source\.file"
  $allWarningLines = @($allCompiler | Where-Object { $_.ToString() -match $warningPattern })
  $scopeWarningLines = @($scopeCompiler | Where-Object { $_.ToString() -match $warningPattern })
  $allEx03Warnings = @($allWarningLines | Where-Object { $_.ToString() -match "^Ex03_Main\.java:" }).Count
  $allEx10Warnings = @($allWarningLines | Where-Object { $_.ToString() -match "^Ex10_Main\.java:" }).Count
  $scopeEx03Warnings = @($scopeWarningLines | Where-Object { $_.ToString() -match "^Ex03_Main\.java:" }).Count
  $scopeEx10Warnings = @($scopeWarningLines | Where-Object { $_.ToString() -match "^Ex10_Main\.java:" }).Count
  $allDeclaredInEx02 = @($allWarningLines | Where-Object { $_.ToString() -match "Ex02_Dog\.java" }).Count
  $allDeclaredInEx08 = @($allWarningLines | Where-Object { $_.ToString() -match "Ex08_Cale\.java" }).Count
  $scopeDeclaredInEx02 = @($scopeWarningLines | Where-Object { $_.ToString() -match "Ex02_Dog\.java" }).Count
  $scopeDeclaredInEx08 = @($scopeWarningLines | Where-Object { $_.ToString() -match "Ex08_Cale\.java" }).Count
  $mainCount = @($scoped | Where-Object {
    (Get-Content -Raw -LiteralPath $_) -match "static\s+void\s+main\s*\("
  }).Count
  $compileOnlyCount = $scoped.Count - $mainCount
  if ($all.Count -ne 16 -or $allExit -ne 0 -or $allCompiler.Count -ne 7 -or $allWarningLines.Count -ne 6 -or $allEx03Warnings -ne 4 -or $allEx10Warnings -ne 2 -or $allDeclaredInEx02 -ne 4 -or $allDeclaredInEx08 -ne 2) { throw "package compile contract drift" }
  if ($scoped.Count -ne 6 -or $scopeExit -ne 0 -or $scopeCompiler.Count -ne 7 -or $scopeWarningLines.Count -ne 6 -or $scopeEx03Warnings -ne 4 -or $scopeEx10Warnings -ne 2 -or $scopeDeclaredInEx02 -ne 4 -or $scopeDeclaredInEx08 -ne 2) { throw "scope compile contract drift" }
  if ($mainCount -ne 2 -or $compileOnlyCount -ne 4) { throw "scope role drift" }

  $out03 = @(& java "-Dfile.encoding=UTF-8" -cp $scopeOut com.java.class05.Ex03_Main)
  if ($LASTEXITCODE -ne 0) { throw "Ex03 failed" }
  $expected03 = @("부모 클래스 생성자", "멍멍", "부모 클래스 생성자", "야옹~~", "부모 클래스 생성자", "송아지 음메~~")
  if ($out03.Count -ne $expected03.Count -or (Compare-Object $out03 $expected03 -SyncWindow 0).Count -ne 0) { throw "Ex03 output drift" }

  function Invoke-CalculatorCase([string]$stdin) {
    $psi = [Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = (Get-Command java -ErrorAction Stop).Source
    $psi.ArgumentList.Add("-Dfile.encoding=UTF-8")
    $psi.ArgumentList.Add("-cp")
    $psi.ArgumentList.Add($scopeOut)
    $psi.ArgumentList.Add("com.java.class05.Ex10_Main")
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $psi
    if (-not $process.Start()) { throw "process start failed" }
    $process.StandardInput.Write($stdin)
    $process.StandardInput.Close()
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit(10000)) {
      $process.Kill($true)
      $process.WaitForExit()
      $process.Dispose()
      throw "calculator timeout"
    }
    $stdout = [regex]::Replace($stdoutTask.GetAwaiter().GetResult(), "\r\n", [string][char]10)
    $stderr = $stderrTask.GetAwaiter().GetResult()
    $exitCode = $process.ExitCode
    $process.Dispose()
    [pscustomobject]@{ Exit = $exitCode; Out = $stdout; Err = $stderr }
  }

  function Get-CaseSummary($case) {
    $results = @([regex]::Matches($case.Out, "(?m)^결과 : (.+)$") | ForEach-Object { $_.Groups[1].Value })
    [pscustomobject]@{
      Exit = $case.Exit
      StderrEmpty = [string]::IsNullOrEmpty($case.Err)
      Menus = [regex]::Matches($case.Out, "(?m)^===== 계산기 =====$").Count
      FirstPrompts = [regex]::Matches($case.Out, "(?m)^첫번째 수 : $").Count
      SecondPrompts = [regex]::Matches($case.Out, "(?m)^두번째 수 : $").Count
      Results = $results
      ZeroWarning = $case.Out.Contains("0으로 나눌 수 없습니다.")
      Invalid = $case.Out.Contains("잘못된 메뉴입니다.")
      Ended = $case.Out.Contains("프로그램 종료")
    }
  }

  $add = Get-CaseSummary (Invoke-CalculatorCase (("1", "7", "5", "0", "") -join [Environment]::NewLine))
  $divzero = Get-CaseSummary (Invoke-CalculatorCase (("4", "7", "0", "0", "") -join [Environment]::NewLine))
  $invalid = Get-CaseSummary (Invoke-CalculatorCase (("9", "7", "5", "0", "") -join [Environment]::NewLine))
  $exit = Get-CaseSummary (Invoke-CalculatorCase (("0", "") -join [Environment]::NewLine))
  if ($add.Exit -ne 0 -or -not $add.StderrEmpty -or $add.Menus -ne 2 -or $add.FirstPrompts -ne 1 -or $add.SecondPrompts -ne 1 -or $add.Results.Count -ne 1 -or $add.Results[0] -cne "12.0" -or $add.ZeroWarning -or $add.Invalid -or -not $add.Ended) { throw "add case drift" }
  if ($divzero.Exit -ne 0 -or -not $divzero.StderrEmpty -or $divzero.Menus -ne 2 -or $divzero.FirstPrompts -ne 1 -or $divzero.SecondPrompts -ne 1 -or $divzero.Results.Count -ne 1 -or $divzero.Results[0] -cne "0.0" -or -not $divzero.ZeroWarning -or $divzero.Invalid -or -not $divzero.Ended) { throw "divzero case drift" }
  if ($invalid.Exit -ne 0 -or -not $invalid.StderrEmpty -or $invalid.Menus -ne 2 -or $invalid.FirstPrompts -ne 1 -or $invalid.SecondPrompts -ne 1 -or $invalid.Results.Count -ne 0 -or $invalid.ZeroWarning -or -not $invalid.Invalid -or -not $invalid.Ended) { throw "invalid case drift" }
  if ($exit.Exit -ne 0 -or -not $exit.StderrEmpty -or $exit.Menus -ne 1 -or $exit.FirstPrompts -ne 0 -or $exit.SecondPrompts -ne 0 -or $exit.Results.Count -ne 0 -or $exit.ZeroWarning -or $exit.Invalid -or -not $exit.Ended) { throw "exit case drift" }

  $ex01 = Get-Content -Raw -LiteralPath (Join-Path $source "Ex01_Abstract.java")
  $ex07 = Get-Content -Raw -LiteralPath (Join-Path $source "Ex07_Cale.java")
  $ex08 = Get-Content -Raw -LiteralPath (Join-Path $source "Ex08_Cale.java")
  $ex01AbstractMethods = [regex]::Matches($ex01, "public\s+abstract\s+void\s+sound\s*\(").Count
  $ex07ConcreteOps = [regex]::Matches($ex07, "(?m)^class\s+(Add|Sub|Mul|Div|Rem)\s+extends\s+Ex07_Cale").Count
  $ex08AbstractMethods = [regex]::Matches($ex08, "public\s+abstract\s+void\s+(plus|minus|multiply|division)\s*\(").Count
  $ex08MutableResults = [regex]::Matches($ex08, "(?m)^\s*double\s+result\s*=\s*0\s*;").Count
  $ex08ZeroAssignments = [regex]::Matches($ex08, "(?m)^\s*result\s*=\s*0\s*;").Count
  if ($ex01AbstractMethods -ne 1 -or $ex07ConcreteOps -ne 5 -or -not $ex07.Contains("throw new ArithmeticException") -or $ex08AbstractMethods -ne 4 -or $ex08MutableResults -ne 1 -or $ex08ZeroAssignments -ne 1) { throw "source shape drift" }

  "spacePath=$($root.Contains(' ')),packageCompiled=$($all.Count),packageExit=$allExit,packageWarnings=$($allWarningLines.Count),packageWarningOwners=Ex03:$allEx03Warnings|Ex10:$allEx10Warnings"
  "scopedCompiled=$($scoped.Count),scopeExit=$scopeExit,scopeWarnings=$($scopeWarningLines.Count),mains=$mainCount,compileOnly=$compileOnlyCount"
  "Ex03=lines:$($out03.Count),sequence:parent|dog|parent|cat|parent|cow"
  "Ex10-add=exit:$($add.Exit),menus:$($add.Menus),operands:$($add.FirstPrompts)|$($add.SecondPrompts),results:$($add.Results -join '|'),zeroWarning:$($add.ZeroWarning),invalid:$($add.Invalid),ended:$($add.Ended)"
  "Ex10-divzero=exit:$($divzero.Exit),menus:$($divzero.Menus),operands:$($divzero.FirstPrompts)|$($divzero.SecondPrompts),results:$($divzero.Results -join '|'),zeroWarning:$($divzero.ZeroWarning),invalid:$($divzero.Invalid),ended:$($divzero.Ended)"
  "Ex10-invalid=exit:$($invalid.Exit),menus:$($invalid.Menus),operands:$($invalid.FirstPrompts)|$($invalid.SecondPrompts),results:$($invalid.Results -join '|'),zeroWarning:$($invalid.ZeroWarning),invalid:$($invalid.Invalid),ended:$($invalid.Ended)"
  "Ex10-exit=exit:$($exit.Exit),menus:$($exit.Menus),operands:$($exit.FirstPrompts)|$($exit.SecondPrompts),results:$($exit.Results -join '|'),zeroWarning:$($exit.ZeroWarning),invalid:$($exit.Invalid),ended:$($exit.Ended)"
  "Shapes=Ex01AbstractMethods:$ex01AbstractMethods,Ex07ConcreteOps:$ex07ConcreteOps,Ex07ZeroThrows:True,Ex08AbstractMethods:$ex08AbstractMethods,Ex08MutableResult:True,Ex08ZeroWritesResult0:True"
} finally {
  foreach ($name in $optionNames) {
    if ($null -eq $savedOptions[$name]) {
      Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    } else {
      [Environment]::SetEnvironmentVariable($name, $savedOptions[$name], "Process")
    }
  }
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-19", explanation: "공백 포함 OS temp GUID direct child를 만들고 네 Java launcher option 환경 변수의 process 값을 저장·제거해 host option 주입을 격리한 뒤 범위6 source를 고정합니다." },
          { lines: "21-42", explanation: "전체16·범위6의 exit, captured output7, auxiliary warnings6, use sites Ex03/Ex10 counts4|2, declaring files Ex02/Ex08 counts4|2, main2·compile-only4를 assert합니다." },
          { lines: "44-47", explanation: "Ex03 exact six strings를 순서까지 비교해 base constructor와 three sounds의 교대를 고정합니다." },
          { lines: "49-95", explanation: "ProcessStartInfo가 ArgumentList·redirected streams·10초 timeout을 사용해 Ex10을 case별 새 JVM으로 실행하고 stable summary를 계산합니다." },
          { lines: "97-104", explanation: "add·divzero·invalid·exit case의 menu·operand·result·failure/end flags를 모두 출력 전에 assert합니다." },
          { lines: "106-114", explanation: "Ex01·Ex07·Ex08 source를 동적으로 읽어 abstract method 수, concrete operations5, throw, mutable result declaration과 zero-branch assignment를 각각 확인합니다." },
          { lines: "116-136", explanation: "검증된 요약을 출력하고 네 launcher option 환경 변수의 원래 존재 여부와 값을 복원한 뒤 resolved parent boundary에서 audit root만 삭제합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "isolated Java launcher option environment", "javastudy2/classstudy root"], command: "pwsh -NoProfile -File verify-original-oop08.ps1" },
        output: { value: "spacePath=True,packageCompiled=16,packageExit=0,packageWarnings=6,packageWarningOwners=Ex03:4|Ex10:2\nscopedCompiled=6,scopeExit=0,scopeWarnings=6,mains=2,compileOnly=4\nEx03=lines:6,sequence:parent|dog|parent|cat|parent|cow\nEx10-add=exit:0,menus:2,operands:1|1,results:12.0,zeroWarning:False,invalid:False,ended:True\nEx10-divzero=exit:0,menus:2,operands:1|1,results:0.0,zeroWarning:True,invalid:False,ended:True\nEx10-invalid=exit:0,menus:2,operands:1|1,results:,zeroWarning:False,invalid:True,ended:True\nEx10-exit=exit:0,menus:1,operands:0|0,results:,zeroWarning:False,invalid:False,ended:True\nShapes=Ex01AbstractMethods:1,Ex07ConcreteOps:5,Ex07ZeroThrows:True,Ex08AbstractMethods:4,Ex08MutableResult:True,Ex08ZeroWritesResult0:True", explanation: ["전체와 범위는 동일한 auxiliary warning6을 정확히 보존합니다.", "Ex03은 abstract constructor가 concrete object마다 실행되는6행입니다.", "Ex10 invalid menu도 operands를 먼저 소비한다는 실제 control-flow debt를 숨기지 않습니다.", "Ex07 zero throw와 Ex08 zero print+state0은 source shape와 process output으로 따로 증명됩니다."] },
        experiments: [
          { change: "Ex02의 Ex05_Cat·Ex06_Cow를 각 이름의 source file로, Ex08의 Ex09_Cale도 자기 file로 분리합니다.", prediction: "같은 behavior를 유지하면서 auxiliary warnings6이0이 됩니다.", result: "warning은 abstract semantics가 아니라 top-level source layout debt입니다." },
          { change: "Ex10에서 menu validity를 operands 읽기 전에 검사합니다.", prediction: "invalid case operand prompts가0|0이 되고 잘못된 메뉴 뒤 바로 재메뉴가 나옵니다.", result: "synthetic 개선은 원본 golden과 별도 versioned contract로 기록해야 합니다." },
          { change: "Ex09 division zero branch에서 result=0을 제거하고 직전 case와 같은 process에서 실행합니다.", prediction: "zero warning 뒤 이전 mutable result가 그대로 출력됩니다.", result: "shared result field가 case isolation과 stale-state 위험을 만듭니다." },
        ],
        sourceRefs: ["java-class05-ex01", "java-class05-ex02", "java-class05-ex03", "java-class05-ex07", "java-class05-ex08", "java-class05-ex10", "jdk21-javac", "dotnet-process-start-info", "dotnet-environment-variables"],
      }],
      diagnostics: [
        { symptom: "범위 compile이 성공하니 warning0이라고 문서화했다.", likelyCause: "exit code만 보고 -Xlint:all output7과 auxiliary warning6을 버렸습니다.", checks: ["compiler output과 native exit를 따로 저장합니다.", "diagnostic code occurrence를 셉니다.", "source owner Ex03/Ex10과 declaring files를 확인합니다."], fix: "exit0·warning6을 함께 기록하고 top-level classes file 분리를 개선 과제로 둡니다.", prevention: "clean은 exit0뿐 아니라 expected compiler-output contract로 정의합니다." },
        { symptom: "invalid menu case가 입력을 기다리며 test가 멈춘다.", likelyCause: "원본은 switch default 전에 두 operands를 먼저 scan하지만 menu9만 stdin에 보냈습니다.", checks: ["control flow에서 Scanner.nextInt 호출 순서를 봅니다.", "process stdin을 case별 완결했는지 확인합니다.", "timeout과 kill path가 있는지 봅니다."], fix: "원본 audit에는 menu9·operand2개·menu0을 보내고 개선 version은 menu validation을 앞당깁니다.", prevention: "interactive golden은 prompts/input cursor 표와 process timeout을 함께 둡니다." },
      ],
      expertNotes: ["interactive programs는 in-process System.setIn/out 교체보다 새 JVM process가 static state·Scanner closure·encoding을 더 확실히 격리합니다.", "warning baseline은 기술 부채를 영구 허용하는 면허가 아니라 source split 후 expected6→0으로 갱신할 migration contract입니다."],
    },
    {
      id: "abstract-class-zero-or-more-obligations",
      title: "abstract class는 미완성 method가0개여도 가능하며 직접 new 금지와 constructor 부재는 같은 말이 아닙니다",
      lead: "abstract modifier는 type의 직접 instance creation을 막고 subclassing 전용 contract를 선언하지만 class body의 모든 기능을 미완성으로 만들지는 않습니다.",
      explanations: [
        "abstract class는 abstract method를 하나 이상 가져야 한다는 정의가 아닙니다. abstract method가 하나라도 있으면 그 class도 abstract여야 하지만 역방향, 즉 abstract class이면 abstract method가 반드시 있다는 명제는 거짓입니다.",
        "abstract class instance creation expression은 compile-time error입니다. 그러나 abstract-typed reference는 concrete subclass object를 가리킬 수 있고 method dispatch의 common contract로 사용됩니다.",
        "abstract class는 instance/static fields, constructors, instance/static concrete methods, initializer blocks, nested types를 가질 수 있습니다. Ex01의 fields·constructor·play가 실제 예입니다.",
        "constructor는 concrete subclass의 new chain에서 superclass state를 초기화하기 위해 필요합니다. Ex03의 세 objects마다 Ex01 constructor marker가 먼저 나온다는 사실이 이를 직접 보여 줍니다.",
        "abstract method가0개인 base는 direct creation을 막으면서 공통 invariant와 extension surface를 통제하는 데 쓸 수 있습니다. 다만 subclassing 이유가 없다면 private constructor+factory, final class, composition이 더 명확한지 비교해야 합니다.",
        "abstract라는 말은 thread-safe, immutable, secure, correctly validated를 자동 보장하지 않습니다. 모든 reachable protected/public constructor와 concrete method가 invariant를 지키는지는 별도로 설계·테스트합니다.",
      ],
      concepts: [
        { term: "abstract class", definition: "abstract modifier가 붙어 direct class instance creation이 금지되고 subclass를 통한 구체화를 전제로 하는 class입니다.", detail: ["abstract methods는0개 이상입니다.", "fields·constructors·concrete methods를 가질 수 있습니다."] },
        { term: "abstract-typed reference", definition: "declared type이 abstract base이고 실제 값은 concrete subclass instance인 reference입니다.", detail: ["new Base()는 불가하지만 Base value=new Child()는 가능합니다.", "common API와 dynamic dispatch를 제공합니다."] },
        { term: "direct instantiation", definition: "class instance creation expression이 바로 해당 class constructor를 선택해 그 class의 instance를 만들려는 시도입니다.", detail: ["abstract class에는 금지됩니다.", "subclass construction의 super constructor 실행과 다릅니다."] },
      ],
      codeExamples: [{
        id: "abstract-class-with-zero-abstract-methods",
        title: "abstract methods0인 base constructor·field·concrete final method가 subclass 생성에서 실행됩니다",
        language: "java",
        filename: "AbstractWithoutMethods.java",
        purpose: "abstract class의 직접 new 금지와 rich concrete implementation 가능성을 reflection까지 포함해 확인합니다.",
        code: String.raw`import java.lang.reflect.Modifier;
import java.util.Arrays;

public class AbstractWithoutMethods {
    abstract static class Base {
        private final int value;

        protected Base(int value) {
            this.value = value;
            System.out.println("base-constructor");
        }

        public final int value() { return value; }
    }

    static final class Concrete extends Base {
        Concrete(int value) { super(value); }
    }

    public static void main(String[] args) {
        Base view = new Concrete(7);
        long abstractMethods = Arrays.stream(Base.class.getDeclaredMethods())
                .filter(method -> Modifier.isAbstract(method.getModifiers()))
                .count();
        System.out.println("value=" + view.value());
        System.out.println("baseAbstract="
                + Modifier.isAbstract(Base.class.getModifiers()));
        System.out.println("declaredAbstractMethods=" + abstractMethods);
    }
}`,
        walkthrough: [
          { lines: "5-14", explanation: "Base는 abstract지만 private final field, protected constructor, final concrete query만 있고 abstract method는 없습니다." },
          { lines: "16-18", explanation: "Concrete가 construction entry를 제공하고 super(value)로 Base invariant를 완성합니다." },
          { lines: "21-29", explanation: "Base view로 concrete object를 사용하고 reflection으로 class abstract true·declared abstract methods0을 구분합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("AbstractWithoutMethods.java", "AbstractWithoutMethods") },
        output: { value: "base-constructor\nvalue=7\nbaseAbstract=true\ndeclaredAbstractMethods=0", explanation: ["new 대상은 Concrete지만 Base constructor가 먼저 실행됩니다.", "abstract-typed view가 final concrete method로 state를 읽습니다.", "Base modifier는 abstract이고 abstract method count는0이라 두 사실이 양립합니다."] },
        experiments: [
          { change: "main에 new Base(7)를 추가합니다.", prediction: "Base가 abstract라 compile 실패합니다.", result: "constructor 존재·접근 가능성과 direct instantiation 가능성은 별도입니다." },
          { change: "Base의 abstract modifier를 제거합니다.", prediction: "abstractMethods0 구조에서는 compile되며 protected constructor라 같은 nest의 code는 직접 호출할 수 있습니다.", result: "direct creation을 막을 설계 이유가 사라졌는지 다시 검토해야 합니다." },
          { change: "value()의 final을 제거합니다.", prediction: "output은 같지만 subclass가 invariant query를 override해 다른 값을 반환할 surface가 열립니다.", result: "abstract base도 완성된 핵심 behavior는 final로 봉인할 수 있습니다." },
        ],
        sourceRefs: ["java-class05-ex01", "java-class05-ex02", "java-class05-ex03", "jls-abstract-class", "jls-class-instance-creation-expression", "java-reflection-modifier"],
      }],
      diagnostics: [
        { symptom: "abstract method가 없는 abstract class를 문법 오류라고 판단했다.", likelyCause: "‘abstract method가 있으면 class도 abstract’의 필요조건을 양방향 정의로 뒤집었습니다.", checks: ["class modifier와 declared method modifiers를 따로 셉니다.", "JLS abstract class 정의를 확인합니다.", "zero-method fixture를 compile합니다."], fix: "abstract methods0도 허용되며 direct new 금지와 subclassing intent를 표현한다고 교정합니다.", prevention: "필요조건과 충분조건을 화살표 방향으로 적습니다." },
        { symptom: "abstract class는 constructor를 실행할 수 없다고 설명했다.", likelyCause: "direct new 금지를 constructor declaration/chain 부재로 오해했습니다.", checks: ["concrete subclass new의 super chain을 추적합니다.", "base constructor marker를 둡니다.", "Ex03의 parent markers3을 확인합니다."], fix: "abstract constructor는 concrete subclass construction의 superclass 단계에서 실행된다고 설명합니다.", prevention: "‘누가 new 대상인가’와 ‘어떤 constructors가 chain에서 실행되는가’를 분리합니다." },
      ],
      comparisons: [{ title: "직접 생성을 막는 설계", options: [
        { name: "abstract base", chooseWhen: "subclass common state/behavior와 polymorphic base contract가 실제로 필요할 때", avoidWhen: "subclass extension 없이 factory만 통제할 때", tradeoffs: ["공통 구현을 공유합니다.", "상속 coupling과 protected surface가 생깁니다."] },
        { name: "final class + factory", chooseWhen: "단일 representation의 validation된 생성 경로만 통제할 때", avoidWhen: "runtime subtype variation이 핵심일 때", tradeoffs: ["invariant가 단순합니다.", "구현 상속 확장은 닫힙니다."] },
        { name: "interface + composition", chooseWhen: "공통 state 없이 역할과 교체 가능성만 필요할 때", avoidWhen: "shared construction protocol이 본질일 때", tradeoffs: ["다중 역할 구현이 가능합니다.", "state sharing은 collaborator로 명시해야 합니다."] },
      ] }],
      expertNotes: ["abstract class0-hooks는 의도를 숨길 수 있으므로 왜 subclassing만 허용하는지 API documentation과 protected constructor policy를 함께 둡니다."],
    },
    {
      id: "abstract-method-grammar-and-modifiers",
      title: "abstract method는 semicolon body로 obligation만 선언하며 실행 body·private·static·final 등과 양립하지 않습니다",
      lead: "‘body가 없다’는 표면만 보면 native method와 섞이므로 override 가능성과 modifier 목적을 함께 판단합니다.",
      explanations: [
        "class의 abstract method declaration은 abstract modifier를 쓰고 method body 대신 semicolon을 둡니다. return type, parameters, type parameters, throws clause는 일반 method처럼 contract의 일부가 될 수 있습니다.",
        "abstract method는 subclass가 override해 implementation을 제공해야 하므로 private와 양립하지 않습니다. private method는 subclass override 대상으로 inherited되지 않기 때문입니다.",
        "static method는 receiver별 dynamic dispatch 대상이 아니고 final method는 override를 금지하므로 abstract와 목적이 모순됩니다. abstract static/final 조합은 compile-time error입니다.",
        "native method도 body가 semicolon이지만 implementation을 native linkage에서 제공하므로 abstract obligation과 다릅니다. synchronized·strictfp와 abstract의 조합도 JLS가 금지합니다.",
        "abstract method에 block body를 쓰거나 concrete method에 body도 abstract도 없이 semicolon만 두면 compile 실패합니다. interface method의 implicit abstract와 default/static/private body 규칙은 class 문맥과 분리해 읽습니다.",
        "override implementation은 access를 더 좁힐 수 없고 checked exception을 더 넓게 선언할 수 없습니다. compiler가 obligation 존재뿐 아니라 substitutable signature도 검사합니다.",
      ],
      concepts: [
        { term: "abstract method", definition: "implementation body 없이 subclass implementation 의무와 invocation signature를 선언하는 instance method입니다.", detail: ["class 문맥에서는 containing class가 abstract여야 합니다.", "semicolon이 declaration body입니다."] },
        { term: "incompatible modifier", definition: "abstract override obligation과 동시에 만족할 수 없는 private·static·final·native·synchronized·strictfp 같은 modifier입니다.", detail: ["각 modifier의 dispatch 의미를 보면 이유가 드러납니다.", "compiler negative contract로 고정합니다."] },
        { term: "override-compatible implementation", definition: "abstract signature를 구현하면서 return/access/throws 규칙을 지키는 concrete method입니다.", detail: ["@Override로 의도를 검사합니다.", "더 강한 checked exception이나 더 좁은 access는 거부됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "abstract method에 빈 {} body를 붙였더니 compile 실패했다.", likelyCause: "아무 statement가 없는 concrete body와 body가 없는 abstract declaration을 같은 것으로 봤습니다.", checks: ["abstract modifier가 있는지 봅니다.", "closing parenthesis 뒤가 semicolon인지 block인지 확인합니다.", "subclass obligation을 원한 것인지 no-op concrete implementation을 원한 것인지 결정합니다."], fix: "obligation이면 abstract ...;로, 의도적 no-op이면 abstract를 제거하고 body를 제공하되 문서화합니다.", prevention: "빈 body를 default behavior로 선택할 때 silent failure 위험을 review합니다." },
        { symptom: "private abstract hook을 선언해 subclass 내부 구현만 강제하려 했다.", likelyCause: "private encapsulation과 subclass override extension point를 동시에 요구했습니다.", checks: ["hook이 subclass에서 name lookup 가능한지 봅니다.", "protected/package-private가 필요한 최소 surface인지 검토합니다.", "composition callback으로 바꿀 수 있는지 봅니다."], fix: "같은 package 폐쇄 hierarchy면 package-private, subclass extension이면 protected abstract hook을 사용하고 public final workflow로 감쌉니다.", prevention: "hook visibility는 caller와 implementer를 따로 적어 결정합니다." },
      ],
      expertNotes: ["abstract hook은 public API surface보다 좁게 두되 subclass contract 문서와 pre/postcondition을 구체적으로 제공해야 fragile-base-class 위험을 줄일 수 있습니다."],
    },
    {
      id: "obligation-propagation-through-subclasses",
      title: "abstract intermediate는 의무를 미룰 수도 완성할 수도 있지만 첫 concrete subclass는 남은 의무를 모두 닫아야 합니다",
      lead: "extends 단계마다 inherited abstract signatures에서 concrete implementations를 뺀 obligation set을 계산합니다.",
      explanations: [
        "Ex01의 sound는 abstract obligation 하나입니다. concrete Ex02_Dog는 sound를 구현하므로 직접 instance creation이 가능한 완성 class가 됩니다.",
        "abstract Ex03_Cat은 sound를 구현하지 않고 obligation을 다음 subclass로 미룹니다. abstract class라서 가능한 선택이며 Ex05_Cat이 concrete가 되는 지점에서 sound를 구현해야 합니다.",
        "abstract Ex04_Cow는 abstract 상태를 유지하면서도 sound를 concrete하게 구현합니다. 아래 Ex06_Cow는 inherited implementation만 사용해도 concrete가 될 수 있지만 원본은 다시 override해 child-specific sound를 선택합니다.",
        "한 class가 여러 ancestors/interfaces에서 abstract methods를 받으면 signature override-equivalence와 inherited concrete methods를 함께 계산합니다. ‘직접 parent 파일에 abstract가 보이지 않는다’만으로 obligation0이라고 판단하면 안 됩니다.",
        "concrete subclass가 obligation을 하나라도 남기면 compiler는 class를 abstract로 선언하라는 error를 냅니다. annotation processor나 runtime reflection 전이 아니라 javac가 class declaration 단계에서 막습니다.",
        "@Override는 method 이름 오타, parameter drift, access 축소를 조기에 잡습니다. abstract method를 구현할 때 annotation을 생략해도 dispatch는 가능하지만 유지보수 contract가 약해집니다.",
      ],
      concepts: [
        { term: "abstract obligation set", definition: "현재 class가 상속받거나 선언했지만 아직 concrete implementation으로 충족하지 못한 abstract method signatures의 집합입니다.", detail: ["abstract subclass는 남겨 둘 수 있습니다.", "concrete subclass는 empty여야 합니다."] },
        { term: "abstract intermediate", definition: "hierarchy 중간에서 일부 구현을 공유하면서 남은 abstract obligations를 아래로 전달하는 abstract subclass입니다.", detail: ["obligation을 구현해도 abstract로 남을 수 있습니다.", "새 abstract hook을 추가할 수도 있습니다."] },
        { term: "concrete subclass", definition: "class 자체가 abstract가 아니고 inherited abstract obligations를 모두 구현해 direct instance creation이 가능한 subclass입니다.", detail: ["constructor accessibility는 다시 별도 조건입니다.", "runtime behavior는 override dispatch를 따릅니다."] },
      ],
      codeExamples: [{
        id: "abstract-obligation-chain",
        title: "defer·implement·re-override 세 경로가 같은 base constructor를 거치는지 실행합니다",
        language: "java",
        filename: "AbstractObligationChain.java",
        purpose: "원본 Dog·Cat·Cow progression을 개인 field 없이 재구성해 obligation propagation과 constructor trace를 확인합니다.",
        code: String.raw`public class AbstractObligationChain {
    abstract static class Animal {
        Animal() { System.out.println("base-constructor"); }
        public abstract void sound();
    }

    static final class Dog extends Animal {
        @Override public void sound() { System.out.println("dog"); }
    }

    abstract static class CatStage extends Animal { }

    static final class Cat extends CatStage {
        @Override public void sound() { System.out.println("cat"); }
    }

    abstract static class CowStage extends Animal {
        @Override public void sound() { System.out.println("adult-cow"); }
    }

    static final class Calf extends CowStage {
        @Override public void sound() { System.out.println("calf"); }
    }

    public static void main(String[] args) {
        Animal[] animals = {new Dog(), new Cat(), new Calf()};
        for (Animal animal : animals) animal.sound();
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "Animal은 concrete constructor와 abstract sound obligation을 함께 둡니다." },
          { lines: "7-15", explanation: "Dog는 즉시 구현하고 CatStage는 미룬 뒤 concrete Cat이 obligation을 닫습니다." },
          { lines: "17-23", explanation: "CowStage는 구현하지만 abstract로 남고 Calf가 선택적으로 다시 override합니다." },
          { lines: "26-29", explanation: "세 concrete objects를 abstract base array로 생성한 뒤 runtime sound를 호출합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("AbstractObligationChain.java", "AbstractObligationChain") },
        output: { value: "base-constructor\nbase-constructor\nbase-constructor\ndog\ncat\ncalf", explanation: ["array initializer가 세 objects를 먼저 만들어 base constructor marker3이 연속됩니다.", "loop는 각 runtime class의 concrete sound를 dog·cat·calf 순서로 dispatch합니다.", "CowStage의 adult-cow implementation은 Calf가 re-override했기 때문에 실행되지 않습니다."] },
        experiments: [
          { change: "Cat.sound를 제거하되 Cat의 final concrete 선언을 유지합니다.", prediction: "Cat이 Animal.sound obligation을 남겨 compile 실패합니다.", result: "중간 CatStage가 abstract라 미룬 의무는 첫 concrete descendant에서 반드시 닫힙니다." },
          { change: "Calf.sound를 제거합니다.", prediction: "CowStage의 concrete implementation을 상속하므로 compile되고 마지막 output이 adult-cow가 됩니다.", result: "abstract intermediate도 obligation을 미리 완성할 수 있습니다." },
          { change: "Cat.sound를 package-private로 축소합니다.", prediction: "public Animal.sound보다 접근이 좁아 override contract 위반으로 compile 실패합니다.", result: "implementation은 inherited access보다 좁아질 수 없습니다." },
        ],
        sourceRefs: ["java-class05-ex01", "java-class05-ex02", "java-class05-ex03", "jls-abstract-class", "jls-abstract-method", "jls-overriding"],
      }],
      diagnostics: [
        { symptom: "concrete subclass declaration에서 ‘is not abstract and does not override’ error가 난다.", likelyCause: "ancestor의 abstract obligation 하나 이상이 signature/access까지 맞는 concrete implementation을 찾지 못했습니다.", checks: ["각 superclass/interface의 getDeclaredMethods를 visibility·override-equivalence 규칙과 함께 순회하거나 source hierarchy에서 abstract signatures를 모읍니다.", "parameter/return/throws/access를 비교합니다.", "@Override가 붙은 method의 compiler error를 먼저 해결합니다."], fix: "모든 obligations를 구현하거나 의도적으로 class 자체를 abstract로 선언합니다.", prevention: "hierarchy 단계별 obligation set을 structural test로 출력합니다." },
        { symptom: "abstract intermediate가 method를 구현했으니 더는 abstract일 수 없다고 생각했다.", likelyCause: "abstract class modifier를 미구현 method 존재 여부와 동치로 봤습니다.", checks: ["다른 obligations가 남았는지 봅니다.", "class가 subclass-only 역할을 유지해야 하는지 봅니다.", "direct creation policy를 확인합니다."], fix: "implementation을 제공해도 class는 abstract로 남을 수 있다고 교정합니다.", prevention: "class abstractness와 method abstractness를 서로 다른 modifier assertion으로 검사합니다." },
      ],
      expertNotes: ["large hierarchy에서는 binary-compatible default/concrete method 추가도 subclass의 기존 동명 method와 충돌할 수 있으므로 obligation set과 override graph를 version별로 검증합니다."],
    },
    {
      id: "abstract-base-construction-and-virtual-call-hazard",
      title: "abstract base constructor는 실행되지만 그 안의 overridable hook은 아직 초기화되지 않은 subclass state를 볼 수 있습니다",
      lead: "constructor를 가질 수 있다는 사실과 constructor에서 polymorphism을 사용해도 안전하다는 결론은 전혀 다릅니다.",
      explanations: [
        "concrete Child를 new하면 superclass constructor가 먼저 실행되므로 abstract Base constructor도 실제 code와 side effects를 수행합니다. Ex03의 parent marker3이 그 증거입니다.",
        "Base constructor의 this runtime class는 이미 Child이므로 overridable instance method 호출은 Child override로 dispatch될 수 있습니다. 그러나 Child field initializers와 Child constructor body는 아직 실행 전입니다.",
        "Child override가 reference field를 읽으면 null, numeric field를 읽으면0 같은 default value를 관찰할 수 있습니다. 정상 construction 뒤 같은 method는 explicit initialized value를 반환해 시간에 따라 계약이 달라집니다.",
        "abstract hook은 반드시 Child implementation이 있으므로 Base constructor에서 부르고 싶은 유혹이 크지만 가장 위험한 형태입니다. base constructor는 private/final helper와 base-owned state만 사용해야 합니다.",
        "hook 실행이 필요하면 final factory 또는 public final initialize/workflow가 construction 완료 뒤 호출하도록 단계화합니다. object가 외부에 공개되기 전 성공·실패 상태도 명시합니다.",
        "base constructor에서 listener 등록, thread start, registry add로 this를 노출하면 hook call과 같은 미완성-state 문제가 다른 thread/caller에서도 생깁니다. abstract hierarchy는 this escape 감사를 더 엄격히 해야 합니다.",
      ],
      concepts: [
        { term: "constructor virtual call", definition: "superclass construction 중 overridable instance method를 호출해 subclass implementation으로 dispatch하는 호출입니다.", detail: ["문법상 가능하지만 subclass initialization 전입니다.", "default-value observation과 this escape 위험이 있습니다."] },
        { term: "partially initialized subclass state", definition: "Base constructor가 실행 중이라 Child fields의 explicit initializers와 body가 아직 적용되지 않은 상태입니다.", detail: ["reference null·number0일 수 있습니다.", "정상 postcondition이 아직 성립하지 않습니다."] },
        { term: "post-construction workflow", definition: "constructor chain이 끝난 완성 object에 final method가 hooks를 실행하는 단계입니다.", detail: ["Template Method로 순서를 통제할 수 있습니다.", "실패와 재호출 정책을 명시해야 합니다."] },
      ],
      codeExamples: [{
        id: "constructor-abstract-hook-hazard",
        title: "Base constructor의 abstract hook이 Child field initializer 전 null을 관찰합니다",
        language: "java",
        filename: "ConstructorHookHazard.java",
        purpose: "abstract constructor와 dynamic dispatch가 결합할 때의 초기화 시간차를 exact output으로 드러냅니다.",
        code: String.raw`public class ConstructorHookHazard {
    abstract static class Base {
        Base() {
            System.out.println("base-sees=" + label());
        }

        protected abstract String label();
    }

    static final class Child extends Base {
        private String label = "ready";

        @Override protected String label() { return label; }

        Child() {
            System.out.println("child-sees=" + label());
        }
    }

    public static void main(String[] args) {
        new Child();
    }
}`,
        walkthrough: [
          { lines: "2-8", explanation: "Base constructor가 abstract label hook을 즉시 호출하므로 runtime Child override로 dispatch됩니다." },
          { lines: "10-18", explanation: "Child field initializer ready는 super constructor가 끝난 뒤 실행되므로 첫 hook에서는 null, Child body에서는 ready입니다." },
          { lines: "21-23", explanation: "new Child 한 번의 두 관찰 시점을 정확히 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ConstructorHookHazard.java", "ConstructorHookHazard") },
        output: { value: "base-sees=null\nchild-sees=ready", explanation: ["Base constructor 시점에 Child.label은 JVM default null입니다.", "super가 반환된 뒤 field initializer가 ready를 대입하고 Child body의 hook은 ready를 봅니다.", "같은 override가 construction phase에 따라 다른 state를 관찰합니다."] },
        experiments: [
          { change: "Child.label을 final String label=ready로 바꿉니다.", prediction: "base-sees는 여전히 null입니다.", result: "final field도 그 field initializer가 실행되기 전에는 default value 단계가 있습니다." },
          { change: "Base constructor hook을 제거하고 final run() method에서 label을 호출한 뒤 main이 construction 후 run을 부릅니다.", prediction: "첫 관찰부터 ready가 됩니다.", result: "hook을 post-construction workflow로 옮기면 invariant 이후 실행됩니다." },
          { change: "Base constructor에서 label 결과에 requireNonNull을 적용합니다.", prediction: "Child construction이 NPE로 실패하고 Child body는 실행되지 않습니다.", result: "검사를 추가해도 호출 시점 자체의 설계 오류는 해결되지 않습니다." },
        ],
        sourceRefs: ["java-class05-ex01", "java-class05-ex03", "jls-class-instance-creation", "jls-runtime-method-lookup", "jls-happens-before"],
      }],
      diagnostics: [
        { symptom: "Base constructor 안 hook에서 null/0을 읽지만 construction 뒤에는 정상이다.", likelyCause: "overridable method가 Child field initialization 전에 dispatch됐습니다.", checks: ["superclass constructors/initializers의 virtual calls를 찾습니다.", "override가 Child-owned fields를 읽는지 봅니다.", "field initializer와 constructor markers를 추가합니다."], fix: "constructor hook을 제거하고 construction 완료 뒤 final workflow에서 호출합니다.", prevention: "abstract base review rule로 constructor/initializer의 overridable self-call을 금지합니다." },
        { symptom: "간헐적으로 registry가 미완성 subclass를 관찰한다.", likelyCause: "Base constructor가 this를 listener·collection·thread에 publish했습니다.", checks: ["constructor 인자/콜백으로 this가 빠져나가는 경로를 추적합니다.", "thread start·event publish·registry add를 검색합니다.", "failure 뒤 registry residue를 봅니다."], fix: "완성 후 factory/service가 명시적으로 register하고 safe publication edge를 만듭니다.", prevention: "constructor는 local state 초기화만 하고 external effects는 lifecycle 단계로 분리합니다." },
      ],
      expertNotes: ["abstract hook이 constructor에서 호출되지 않는다는 보장은 public extension contract로 문서화하고 static analysis rule로 강제해야 외부 subclass도 안전합니다."],
    },
    {
      id: "anonymous-concrete-subclass",
      title: "anonymous class는 이름 없이 abstract obligation을 즉시 구현해 한 expression에서 concrete instance를 만듭니다",
      lead: "‘abstract class를 익명 class로 new한다’는 표현보다 anonymous concrete subclass를 선언·생성한다는 모델이 정확합니다.",
      explanations: [
        "new AbstractBase(args) { ... } 문법은 abstract base 자체의 instance를 만드는 예외가 아닙니다. expression 안에서 이름 없는 subclass body를 선언하고 그 subclass가 obligations를 모두 구현한 concrete instance를 만듭니다.",
        "anonymous class constructor를 직접 선언할 수 없지만 instance initializer를 사용할 수 있고 base constructor arguments를 new expression에 전달합니다. 생성 순서는 일반 subclass와 같습니다.",
        "enclosing local variable을 capture하려면 final 또는 effectively final이어야 합니다. mutable state를 우회하려고 array holder를 capture하면 lifetime과 thread-safety가 숨겨질 수 있습니다.",
        "anonymous class는 짧은 일회성 override와 가까운 test double에 유용합니다. 여러 methods, 재사용, documentation, serialization identity가 필요하면 이름 있는 nested/top-level class가 낫습니다.",
        "abstract class는 state/constructor가 있어 functional interface lambda로 대체되지 않을 수 있습니다. 역할이 single abstract method와 shared state가 불필요하다면 interface+lambda가 더 간결합니다.",
        "anonymous runtime class name은 compiler-generated이고 stable API가 아닙니다. golden test는 getName text 대신 Class.isAnonymousClass와 behavior를 검사합니다.",
      ],
      concepts: [
        { term: "anonymous class", definition: "class instance creation expression 안에 body를 두어 이름 없는 subclass 또는 interface implementation을 선언하는 construct입니다.", detail: ["abstract obligations를 모두 구현하면 concrete instance가 됩니다.", "직접 constructor declaration은 할 수 없습니다."] },
        { term: "effectively final capture", definition: "명시 final이 없어도 초기 대입 뒤 변경되지 않아 local/anonymous class가 capture할 수 있는 local variable입니다.", detail: ["변경하면 compile 실패합니다.", "captured object 자체의 mutable state와는 다릅니다."] },
        { term: "anonymous-class identity", definition: "compiler가 만든 이름이 아니라 behavior와 Class.isAnonymousClass 같은 structural property로 관찰해야 하는 runtime type 특성입니다.", detail: ["generated binary name은 안정 계약이 아닙니다.", "재사용 type annotation이 어렵습니다."] },
      ],
      codeExamples: [{
        id: "anonymous-task-implementation",
        title: "abstract Task의 state·constructor·final workflow를 익명 subclass hook으로 완성합니다",
        language: "java",
        filename: "AnonymousTask.java",
        purpose: "anonymous class가 base 자체가 아니라 concrete subclass instance임을 behavior와 reflection으로 검증합니다.",
        code: String.raw`public class AnonymousTask {
    abstract static class Task {
        private final String name;

        Task(String name) { this.name = name; }
        protected abstract int apply(int value);

        final String run(int value) {
            return name + "=" + apply(value);
        }
    }

    public static void main(String[] args) {
        int factor = 4;
        Task scaled = new Task("scale") {
            @Override protected int apply(int value) {
                return value * factor;
            }
        };
        System.out.println(scaled.run(4));
        System.out.println("anonymous=" + scaled.getClass().isAnonymousClass());
        System.out.println("baseView=" + (scaled instanceof Task));
    }
}`,
        walkthrough: [
          { lines: "2-11", explanation: "Task는 name state와 constructor, abstract apply hook, final run workflow를 함께 제공합니다." },
          { lines: "14-20", explanation: "effectively final factor를 capture한 anonymous subclass가 apply obligation을 구현합니다." },
          { lines: "21-23", explanation: "behavior와 anonymous structural property, abstract base view 관계를 stable하게 검사합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("AnonymousTask.java", "AnonymousTask") },
        output: { value: "scale=16\nanonymous=true\nbaseView=true", explanation: ["final run이 base name과 anonymous hook 결과를 조합합니다.", "runtime class는 anonymous이고 동시에 Task subtype입니다.", "AbstractBase direct instance가 아니라 concrete anonymous subclass instance입니다."] },
        experiments: [
          { change: "anonymous body에서 apply 구현을 제거합니다.", prediction: "anonymous class가 concrete obligation을 충족하지 못해 compile 실패합니다.", result: "이름이 없어도 concrete subclass 규칙은 같습니다." },
          { change: "scaled 생성 뒤 factor=5를 대입합니다.", prediction: "factor가 effectively final이 아니게 되어 capture compile 실패합니다.", result: "capture 가능성은 anonymous class creation 전에 정적으로 판단됩니다." },
          { change: "Task를 single-method interface로 바꾸고 name 조합을 caller/helper로 옮깁니다.", prediction: "apply는 lambda로 줄일 수 있지만 base-owned state와 final workflow 위치가 달라집니다.", result: "문법 길이보다 state/workflow ownership으로 대안을 선택합니다." },
        ],
        sourceRefs: ["java-class05-ex01", "java-class05-ex02", "jls-anonymous-class", "jls-capture", "java-class-is-anonymous"],
      }],
      diagnostics: [
        { symptom: "anonymous body가 abstract method 하나를 빠뜨려 compile 실패했다.", likelyCause: "익명이라 obligation 검사에서 예외라고 생각했습니다.", checks: ["base/interface의 full obligation set을 적습니다.", "anonymous body의 @Override methods를 비교합니다.", "signature/access/throws mismatch를 봅니다."], fix: "모든 obligations를 구현하거나 이름 있는 abstract intermediate로 분리하되 그 자체를 직접 만들지 않습니다.", prevention: "두 methods 이상이면 이름 있는 class/strategy를 우선 검토합니다." },
        { symptom: "generated anonymous class name을 golden에 넣어 compiler 변경 뒤 test가 깨졌다.", likelyCause: "implementation-specific binary name을 public identity로 사용했습니다.", checks: ["getClass().getName/getSimpleName assertion을 찾습니다.", "behavior와 isAnonymousClass로 대체 가능한지 봅니다.", "serialization/deserialization 요구를 확인합니다."], fix: "stable behavior/role identifiers를 명시 field로 두고 generated class name 의존을 제거합니다.", prevention: "anonymous type은 외부 protocol·persistent type id로 사용하지 않습니다." },
      ],
      comparisons: [{ title: "작은 variation 구현 방식", options: [
        { name: "anonymous subclass", chooseWhen: "base state/workflow를 쓰는 한 지점의 짧은 override일 때", avoidWhen: "재사용·복수 methods·문서화·persistent identity가 필요할 때", tradeoffs: ["사용 지점에 behavior가 가깝습니다.", "class body가 길어지면 읽기 어렵습니다."] },
        { name: "named subclass", chooseWhen: "behavior가 재사용되고 독립 test/type identity가 필요할 때", avoidWhen: "한 줄짜리 일회 variation만 있을 때", tradeoffs: ["명시적 이름과 constructor를 가집니다.", "type 수가 늘어납니다."] },
        { name: "interface lambda", chooseWhen: "single abstract role이고 shared base state/construction이 필요 없을 때", avoidWhen: "protected hooks와 common instance state가 핵심일 때", tradeoffs: ["가장 간결하고 composition에 적합합니다.", "class implementation inheritance는 없습니다."] },
      ] }],
      expertNotes: ["anonymous class를 framework callback으로 장기간 보관하면 enclosing instance capture가 예상치 못한 retention을 만들 수 있으므로 static/named strategy와 lifetime을 비교합니다."],
    },
    {
      id: "operation-per-subclass-return-throw-contract",
      title: "Ex07은 한 abstract operate와 operation별 subclass로 return 값을 만들고 divisor0은 exception으로 전달합니다",
      lead: "operation을 subtype으로 분리하면 caller 분기는 줄지만 tiny subclasses 수와 failure contract 통일 책임이 생깁니다.",
      explanations: [
        "Ex07_Cale는 double operate(double,double) 하나만 abstract로 선언합니다. Add·Sub·Mul·Div·Rem은 각 operation의 계산을 return하므로 caller가 shared mutable result field를 읽지 않습니다.",
        "한 operation object는 같은 input contract를 공유해 collection/map에 넣거나 base view로 교체할 수 있습니다. 새로운 operation 추가는 새 subclass를 더하는 방향이라 기존 dispatcher 수정 범위를 줄일 수 있습니다.",
        "Div는 b==0이면 ArithmeticException을 throw합니다. double에서 0.0과 -0.0은 ==0이 true라 모두 거부하고, NaN은 false라 계산 결과 NaN을 반환합니다. 도메인 정책에 맞는 finite validation은 별도입니다.",
        "Rem은 double remainder 연산이라 divisor0에서 Java가 exception 대신 NaN을 만들 수 있습니다. Ex07의 ‘0 divisor failure’가 Div에만 있고 operation family 전체에 통일되지 않았다는 점을 테스트해야 합니다.",
        "operation별 class는 각 algorithm이 커지고 dependencies가 다르거나 독립 configuration/state가 있을 때 가치가 큽니다. 단순 a+b 수준에서 class 다섯 개는 interface lambda/enum strategy보다 과할 수 있습니다.",
        "exception type과 message, input validation order, overflow/NaN policy를 base contract로 문서화하지 않으면 subtype마다 failure semantics가 갈라져 caller가 다시 instanceof/switch를 쓰게 됩니다.",
      ],
      concepts: [
        { term: "operation object", definition: "하나의 계산/행동을 공통 abstract type의 concrete object로 표현하는 설계입니다.", detail: ["behavior를 collection/map에 넣을 수 있습니다.", "새 operation을 subtype으로 확장합니다."] },
        { term: "return-value contract", definition: "operation 결과가 shared field side effect가 아니라 method return으로 caller에게 직접 전달되는 계약입니다.", detail: ["호출별 result가 분리됩니다.", "동시 사용 reasoning이 단순해집니다."] },
        { term: "exception failure contract", definition: "invalid input에서 method가 정상 값을 반환하지 않고 지정 exception으로 control을 caller에 전달하는 계약입니다.", detail: ["caller가 catch/propagate를 선택합니다.", "print side effect와 구분합니다."] },
      ],
      codeExamples: [{
        id: "operation-object-calculator",
        title: "Add와 Divide를 abstract Operation으로 교체하고 zero exception type을 고정합니다",
        language: "java",
        filename: "OperationObjects.java",
        purpose: "Ex07의 stateless return/throw 구조를 minimal warning-free example로 검증합니다.",
        code: String.raw`public class OperationObjects {
    abstract static class Operation {
        abstract double apply(double left, double right);
    }

    static final class Add extends Operation {
        @Override double apply(double left, double right) {
            return left + right;
        }
    }

    static final class Divide extends Operation {
        @Override double apply(double left, double right) {
            if (right == 0.0) {
                throw new ArithmeticException("zero divisor");
            }
            return left / right;
        }
    }

    public static void main(String[] args) {
        Operation add = new Add();
        Operation divide = new Divide();
        System.out.println("add=" + add.apply(7, 5));
        System.out.println("divide=" + divide.apply(7, 2));
        try {
            divide.apply(7, -0.0);
            throw new AssertionError("exception expected");
        } catch (ArithmeticException expected) {
            System.out.println("zero=" + expected.getClass().getSimpleName());
        }
    }
}`,
        walkthrough: [
          { lines: "2-4", explanation: "Operation은 state 없이 공통 two-double input과 double return obligation만 선언합니다." },
          { lines: "6-19", explanation: "Add는 pure return, Divide는 zero guard 뒤 return이라는 서로 다른 algorithm을 구현합니다." },
          { lines: "22-31", explanation: "abstract base views로 정상 두 cases와 -0.0 exception type을 검사합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("OperationObjects.java", "OperationObjects") },
        output: { value: "add=12.0\ndivide=3.5\nzero=ArithmeticException", explanation: ["각 invocation이 return을 직접 출력해 stale shared result가 없습니다.", "-0.0==0.0이므로 Divide guard가 ArithmeticException을 던집니다.", "message text가 아니라 stable exception type을 golden으로 둡니다."] },
        experiments: [
          { change: "divide.apply(0, Double.NaN)를 출력합니다.", prediction: "zero guard를 통과하고 결과 NaN을 반환합니다.", result: "zero-only validation과 finite-number domain validation은 다릅니다." },
          { change: "Rem operation을 left%right로 추가하고 right0을 호출합니다.", prediction: "double remainder는 ArithmeticException 대신 NaN을 반환합니다.", result: "operation family가 동일 failure contract를 가져야 한다면 base validation/template이 필요합니다." },
          { change: "Operation을 @FunctionalInterface로 바꾸고 Add를 (a,b)->a+b lambda로 대체합니다.", prediction: "output은 유지되고 tiny named class 하나를 줄일 수 있습니다.", result: "shared state/concrete workflow가 없으면 interface strategy가 더 가벼울 수 있습니다." },
        ],
        sourceRefs: ["java-class05-ex07", "jls-abstract-method", "jls-floating-point-operators", "java-arithmetic-exception"],
      }],
      diagnostics: [
        { symptom: "Div와 Rem에 divisor0을 넣었는데 하나는 exception, 하나는 NaN이다.", likelyCause: "double /와 %의 실제 semantics와 subtype별 explicit guard를 family-wide policy로 착각했습니다.", checks: ["각 concrete apply의 validation을 비교합니다.", "0.0/-0.0/NaN/Infinity cases를 parameterize합니다.", "base contract의 allowed results를 확인합니다."], fix: "공통 validation을 final workflow에 두거나 각 subtype의 failure semantics를 명시적으로 문서화합니다.", prevention: "operation conformance suite를 모든 subclasses에 반복 적용합니다." },
        { symptom: "operation을 추가할 때마다 caller switch도 함께 수정한다.", likelyCause: "subtype polymorphism을 만들었지만 dispatcher가 concrete type을 다시 판별합니다.", checks: ["Map key→Operation registry로 selection을 분리할 수 있는지 봅니다.", "caller가 instanceof를 쓰는지 검색합니다.", "operation object가 스스로 apply하는지 확인합니다."], fix: "selection은 registry/configuration, execution은 Operation.apply로 분리합니다.", prevention: "caller contract test는 concrete class 이름을 몰라도 base view로 실행되게 합니다." },
      ],
      expertNotes: ["stateless operation objects는 singleton으로 재사용할 수 있지만 dependencies/configuration이 생기면 lifecycle과 thread safety를 다시 문서화합니다."],
    },
    {
      id: "wide-stateful-calculator-contract",
      title: "Ex08·09는 네 void hooks와 mutable result를 공유하며 zero division을 print+result0으로 정상 반환합니다",
      lead: "하나의 concrete calculator에 모든 operations를 모은 구조는 class 수를 줄이지만 state·API 폭·실패 신호를 caller와 강하게 결합합니다.",
      explanations: [
        "Ex08_Cale는 plus·minus·multiply·division 네 abstract methods를 한 subclass가 모두 구현하도록 요구합니다. 새 operation 하나를 추가하면 base와 모든 concrete subclasses를 동시에 수정해야 하는 wide abstraction입니다.",
        "각 method는 void이고 계산 결과를 inherited mutable double result field에 저장합니다. caller는 operation 호출과 field read 두 단계의 protocol을 기억해야 하며 다른 invocation이 result를 즉시 덮어씁니다.",
        "Ex09 division의 divisor0 branch는 warning을 stdout에 print하고 result=0으로 대입한 뒤 return합니다. caller 관점에서 method는 정상 반환하므로 failure와 실제 quotient0을 result 값만으로 구분할 수 없습니다.",
        "Ex07 Div의 ArithmeticException과 Ex09의 print+0은 둘 다 zero를 감지하지만 control flow·observability·testability가 다릅니다. 한 문서에서 ‘예외 처리됨’으로 합치면 caller contract를 잃습니다.",
        "Ex10 invalid menu는 operation selection 전 validation이 아니라 operands를 읽은 뒤 switch default에서 print+continue합니다. UI input protocol과 calculator stateful core가 한 main loop에 결합된 결과입니다.",
        "동일 calculator instance를 여러 threads나 reentrant callbacks가 사용하면 result field에 data race가 생깁니다. stateless return, immutable Result success/failure, operation strategy 주입이 호출별 상태를 분리합니다.",
      ],
      concepts: [
        { term: "wide abstraction", definition: "서로 독립적으로 변할 수 있는 여러 operations를 한 base type의 abstract method 집합으로 묶어 모든 subclasses에 구현을 요구하는 구조입니다.", detail: ["method 추가가 모든 implementers를 깨뜨립니다.", "역할 분리 원칙을 검토해야 합니다."] },
        { term: "out-of-band mutable result", definition: "method return이 아니라 object field를 나중에 읽어 invocation 결과를 얻는 protocol입니다.", detail: ["stale/overwrite/race 위험이 있습니다.", "호출과 read를 원자적으로 묶지 못합니다."] },
        { term: "print-and-zero failure", definition: "invalid input에서 message side effect를 내고 result field를0으로 바꾼 뒤 정상 return하는 Ex09의 정책입니다.", detail: ["exception contract가 아닙니다.", "valid zero result와 구분할 별도 status가 없습니다."] },
      ],
      codeExamples: [{
        id: "stateful-wide-calculator",
        title: "plus와 division이 같은 result를 덮어쓰고 zero가 warning+0으로 정상 반환하는지 재현합니다",
        language: "java",
        filename: "StatefulWideCalculator.java",
        purpose: "Ex08/09의 mutable result와 zero failure semantics를 Ex07 return/throw example과 직접 비교합니다.",
        code: String.raw`public class StatefulWideCalculator {
    abstract static class Calculator {
        double result;
        abstract void plus(int left, int right);
        abstract void minus(int left, int right);
        abstract void multiply(int left, int right);
        abstract void division(double left, double right);
    }

    static final class LegacyCalculator extends Calculator {
        @Override void plus(int left, int right) { result = left + right; }
        @Override void minus(int left, int right) { result = left - right; }
        @Override void multiply(int left, int right) { result = left * right; }

        @Override void division(double left, double right) {
            if (right == 0.0) {
                System.out.println("zero-warning");
                result = 0.0;
                return;
            }
            result = left / right;
        }
    }

    public static void main(String[] args) {
        Calculator calculator = new LegacyCalculator();
        calculator.plus(7, 5);
        System.out.println("afterPlus=" + calculator.result);
        calculator.division(7, 0);
        System.out.println("afterZero=" + calculator.result);
        calculator.division(7, 2);
        System.out.println("afterDivide=" + calculator.result);
    }
}`,
        walkthrough: [
          { lines: "2-8", explanation: "Calculator는 result field와 네 independent abstract void operations를 모든 subclasses에 요구합니다." },
          { lines: "10-23", explanation: "LegacyCalculator가 field를 갱신하고 zero에서 print·result0·normal return을 수행합니다." },
          { lines: "26-33", explanation: "같은 object에서 세 calls가 result12→0→3.5로 차례로 덮어쓰는 protocol을 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("StatefulWideCalculator.java", "StatefulWideCalculator") },
        output: { value: "afterPlus=12.0\nzero-warning\nafterZero=0.0\nafterDivide=3.5", explanation: ["int plus가 double field에 저장되어12.0입니다.", "zero division은 exception 없이 warning을 출력하고 result0.0으로 정상 반환합니다.", "다음 success가 같은 field를3.5로 덮어써 이전 invocation result를 보존하지 않습니다."] },
        experiments: [
          { change: "zero branch의 result=0을 제거합니다.", prediction: "afterZero가 직전 plus의12.0으로 남습니다.", result: "void+field protocol은 failure 때 stale result를 쉽게 노출합니다." },
          { change: "division을 double division(...) return으로 바꾸고 result field를 제거합니다.", prediction: "호출별 결과가 local value가 되어 overwrite/read protocol이 사라집니다.", result: "stateless return이 concurrency와 test reasoning을 단순화합니다." },
          { change: "두 threads가 plus와 division을 같은 instance에 반복 호출합니다.", prediction: "동기화가 없어 각 caller의 field read가 자기 call 결과라는 보장이 없습니다.", result: "mutable result를 thread-safe로 감싸기보다 호출별 immutable result가 자연스럽습니다." },
        ],
        sourceRefs: ["java-class05-ex08", "java-class05-ex10", "jls-abstract-method", "jls-memory-model"],
      }],
      diagnostics: [
        { symptom: "division zero가 성공0인지 실패0인지 result만 보고 구분할 수 없다.", likelyCause: "failure status를 stdout side effect로만 보내고 numeric result에 sentinel0을 겹쳤습니다.", checks: ["caller가 stdout을 parse하는지 봅니다.", "valid quotient0 case와 비교합니다.", "exception/Result type 요구를 정합니다."], fix: "exception 또는 immutable Result(success,value,error)를 return하고 UI message는 boundary에서 만듭니다.", prevention: "failure channel과 valid value domain이 겹치지 않는 API를 설계합니다." },
        { symptom: "operation을 하나 추가했더니 모든 calculator subclasses가 compile 실패한다.", likelyCause: "unrelated capabilities를 한 wide abstract base에 묶었습니다.", checks: ["각 subclass가 모든 operations를 실제 지원하는지 봅니다.", "operation-per-strategy 또는 작은 interfaces로 분리합니다.", "default implementation이 의미 있는지 검토합니다."], fix: "변화 축별 interface/strategy로 나누고 calculator는 selected operation을 composition합니다.", prevention: "새 abstract method는 모든 existing implementers의 obligation set을 깨뜨리는 change로 review합니다." },
      ],
      comparisons: [{ title: "원본 두 calculator 추상화", options: [
        { name: "Ex07 operation-per-subclass", chooseWhen: "operations가 독립 dependencies/configuration을 갖고 registry로 교체될 때", avoidWhen: "tiny stateless formulas만 많아 class explosion이 클 때", tradeoffs: ["return value와 failure throw가 호출별입니다.", "operation class 수가 늘어납니다."] },
        { name: "Ex08 wide stateful calculator", chooseWhen: "모든 implementations가 정말 네 operations와 같은 mutable lifecycle을 공유할 때", avoidWhen: "capability가 독립적으로 변하거나 concurrency가 있을 때", tradeoffs: ["concrete object 하나에 API가 모입니다.", "result coupling과 implementer breakage가 큽니다."] },
        { name: "strategy composition", chooseWhen: "operation selection과 execution을 분리하고 lambda/named strategies를 섞을 때", avoidWhen: "shared protected construction protocol이 본질일 때", tradeoffs: ["작은 role과 stateless return이 가능합니다.", "registry/wiring을 명시해야 합니다."] },
      ] }],
      expertNotes: ["stdout은 domain failure channel이 아니므로 library/core는 structured outcome을 제공하고 CLI가 locale-specific message를 책임지게 합니다."],
    },
    {
      id: "interface-strategy-composition-alternatives",
      title: "공통 state·constructor가 없으면 interface strategy, 독립 역할이면 composition이 abstract inheritance보다 작습니다",
      lead: "추상 클래스가 가능하다는 사실보다 variation이 무엇을 공유하고 누가 workflow를 소유하는지가 선택 기준입니다.",
      explanations: [
        "abstract class는 instance state, protected constructor, concrete/final workflow와 hooks를 한 hierarchy에 묶을 때 강점이 있습니다. Java class inheritance가 하나뿐이라 caller의 다른 superclass 선택을 소비합니다.",
        "interface는 역할 contract를 class hierarchy와 분리하고 여러 interfaces를 구현할 수 있습니다. single abstract method면 lambda/method reference가 가능해 Ex07 tiny operations의 class 수를 줄입니다.",
        "strategy composition은 Calculator가 Operation field를 받고 execute를 delegation합니다. Calculator is-a Operation이 아니라 has-a Operation이며 runtime/configuration/test에서 collaborator를 교체할 수 있습니다.",
        "enum strategy는 operation set이 폐쇄적이고 identity/menu mapping이 안정적일 때 간결하지만 새 operation 추가가 enum source 수정으로 모입니다. plugin 확장이 필요하면 registry+interface가 낫습니다.",
        "abstract base의 protected mutable fields를 reuse하려고 inheritance를 선택하면 subtype이 base representation에 결합됩니다. private state와 protected/final operations 또는 collaborator로 경계를 좁힙니다.",
        "Template Method와 Strategy는 경쟁만 하는 패턴이 아닙니다. final workflow가 stable ordering을 소유하고 특정 hook을 strategy collaborator에 delegation하는 혼합도 가능합니다.",
      ],
      concepts: [
        { term: "strategy", definition: "교체 가능한 algorithm을 작은 role object로 표현하고 context가 composition으로 호출하는 설계입니다.", detail: ["interface lambda 또는 named class가 될 수 있습니다.", "context와 algorithm lifecycle을 분리합니다."] },
        { term: "context", definition: "strategy를 보유하고 input/output boundary, selection, 공통 policy를 책임지는 collaborating object입니다.", detail: ["strategy subtype일 필요가 없습니다.", "validation 위치를 명시해야 합니다."] },
        { term: "single inheritance budget", definition: "Java class가 direct superclass 하나만 선택할 수 있어 abstract base 선택이 다른 implementation inheritance를 막는 제약입니다.", detail: ["interfaces는 여러 개 구현할 수 있습니다.", "composition은 hierarchy 밖 협력을 허용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "한 줄 lambda로 가능한 formula마다 abstract subclass 파일이 늘어난다.", likelyCause: "shared base state/workflow 없이 구현 상속부터 선택했습니다.", checks: ["abstract base가 제공하는 concrete value를 목록화합니다.", "role이 single abstract method인지 봅니다.", "strategy가 identity/configuration을 실제로 갖는지 확인합니다."], fix: "stateless tiny algorithm은 functional interface+lambda, 복잡 algorithm은 named strategy로 바꿉니다.", prevention: "abstract class 선택 문서에 shared state/constructor/final workflow 근거를 요구합니다." },
        { symptom: "Calculator subclass가 새로운 저장소/네트워크 superclass도 필요해 구조가 막힌다.", likelyCause: "algorithm reuse가 single class inheritance slot을 소비했습니다.", checks: ["외부 capability가 is-a인지 has-a인지 구분합니다.", "dependencies를 constructor injection할 수 있는지 봅니다.", "multiple roles를 interfaces로 분리합니다."], fix: "operation과 external service를 collaborators로 composition하고 Calculator hierarchy를 축소합니다.", prevention: "class inheritance는 semantic subtype일 때만 사용합니다." },
      ],
      comparisons: [{ title: "variation mechanism 선택", options: [
        { name: "abstract class", chooseWhen: "shared state·protected construction·final workflow와 subclass hooks가 한 lifecycle일 때", avoidWhen: "역할만 공유하거나 multiple inheritance pressure가 있을 때", tradeoffs: ["공통 구현과 invariant centralization이 강합니다.", "hierarchy coupling과 single-superclass 제약이 있습니다."] },
        { name: "interface strategy", chooseWhen: "stateless/small algorithm을 교체하고 lambda 또는 여러 implementations가 필요할 때", avoidWhen: "shared instance state와 constructor protocol이 핵심일 때", tradeoffs: ["결합이 작고 다중 역할이 가능합니다.", "공통 state는 별도 collaborator가 필요합니다."] },
        { name: "composition context", chooseWhen: "workflow owner와 algorithm/dependency lifetime을 독립적으로 바꿀 때", avoidWhen: "caller가 진짜 subtype substitutability를 요구할 때", tradeoffs: ["test injection과 runtime selection이 쉽습니다.", "delegation/wiring code가 생깁니다."] },
      ] }],
      expertNotes: ["public API에서는 abstract class와 interface 중 하나만 고르는 대신 최소 interface contract와 선택적 skeletal abstract implementation을 분리하는 방법도 검토합니다."],
    },
    {
      id: "final-template-method-workflow",
      title: "Template Method는 public final workflow가 공통 검증·hook 순서·오류 변환을 소유하고 protected hooks만 바꿉니다",
      lead: "abstract hooks만 나열하는 것보다 base가 algorithm skeleton과 모든 exit paths의 invariant를 완성해야 합니다.",
      explanations: [
        "Template Method의 핵심은 abstract methods가 있다는 사실이 아니라 공통 workflow 순서를 concrete final method가 소유한다는 점입니다. subclass는 순서를 재배열하거나 validation/error policy를 우회하지 못합니다.",
        "public final execute는 common finite validation, subtype-specific validation hook, compute hook, publish/postcondition을 차례로 실행할 수 있습니다. hooks는 protected로 좁혀 일반 caller가 중간 단계만 호출하지 못하게 합니다.",
        "optional hook은 의미 있는 default concrete implementation을 줄 수 있지만 silent no-op가 invariant를 숨기면 abstract로 강제해야 합니다. required/optional extension point를 문서에서 구분합니다.",
        "base가 모든 RuntimeException을 Outcome error로 변환하면 caller failure channel은 통일되지만 programming bugs까지 삼킬 수 있습니다. catch 범위와 rethrow policy를 domain exception 중심으로 좁히는 것이 보통 안전합니다.",
        "workflow가 mutable trace나 result field를 instance에 보관하면 concurrent calls가 충돌합니다. 호출별 locals와 immutable Outcome을 사용하고 subclass hooks의 thread-safety도 contract에 포함합니다.",
        "subclass hook을 constructor에서 부르지 않고 public final workflow에서 호출하면 construction 완료 후 state를 관찰합니다. 재호출 가능성, idempotency, cancellation, timeout도 운영 contract로 확장합니다.",
      ],
      concepts: [
        { term: "Template Method", definition: "algorithm의 안정된 단계·순서·공통 정책을 base concrete method에 두고 일부 단계만 overridable hooks로 남기는 패턴입니다.", detail: ["workflow는 보통 final입니다.", "hooks는 protected abstract/concrete입니다."] },
        { term: "required hook", definition: "모든 concrete subclasses가 반드시 구현해야 하는 protected abstract variation point입니다.", detail: ["obligation set에 포함됩니다.", "pre/postcondition을 base가 문서화합니다."] },
        { term: "immutable Outcome", definition: "성공 값 또는 실패 종류와 trace를 호출별 불변 value로 돌려주는 결과 모델입니다.", detail: ["shared mutable result를 피합니다.", "failure를 stdout와 분리합니다."] },
      ],
      codeExamples: [{
        id: "validated-template-method",
        title: "final execute가 validation·compute·publish/error 순서를 통일하고 Add/Divide hooks만 바꿉니다",
        language: "java",
        filename: "TemplateMethodCalculator.java",
        purpose: "Ex07의 분리된 operations와 Ex08의 공통 policy 요구를 final workflow와 immutable outcome으로 결합합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.List;

public class TemplateMethodCalculator {
    record Outcome(boolean success, double value, String error, String trace) {
        static Outcome ok(double value, List<String> trace) {
            return new Outcome(true, value, "-", String.join(">", trace));
        }
        static Outcome fail(RuntimeException error, List<String> trace) {
            return new Outcome(false, 0.0,
                    error.getClass().getSimpleName(), String.join(">", trace));
        }
        String render() {
            return success ? "ok:" + value + ",trace:" + trace
                    : "error:" + error + ",trace:" + trace;
        }
    }

    abstract static class BinaryTemplate {
        public final Outcome execute(double left, double right) {
            List<String> trace = new ArrayList<>();
            try {
                trace.add("common");
                if (!Double.isFinite(left) || !Double.isFinite(right)) {
                    throw new IllegalArgumentException("non-finite");
                }
                trace.add("specific");
                validate(left, right);
                trace.add("compute");
                double value = compute(left, right);
                trace.add("publish");
                return Outcome.ok(value, trace);
            } catch (RuntimeException error) {
                trace.add("error");
                return Outcome.fail(error, trace);
            }
        }

        protected void validate(double left, double right) { }
        protected abstract double compute(double left, double right);
    }

    static final class Add extends BinaryTemplate {
        @Override protected double compute(double left, double right) {
            return left + right;
        }
    }

    static final class Divide extends BinaryTemplate {
        @Override protected void validate(double left, double right) {
            if (right == 0.0) throw new ArithmeticException("zero divisor");
        }
        @Override protected double compute(double left, double right) {
            return left / right;
        }
    }

    public static void main(String[] args) {
        System.out.println("add=" + new Add().execute(7, 5).render());
        System.out.println("divideZero=" + new Divide().execute(7, 0).render());
    }
}`,
        walkthrough: [
          { lines: "5-17", explanation: "Outcome은 success/value/error/trace를 한 immutable record로 반환해 stdout·shared result field와 분리합니다." },
          { lines: "20-41", explanation: "final execute가 common→specific→compute→publish 정상 순서와 error exit를 통일합니다." },
          { lines: "43-55", explanation: "Add는 compute만, Divide는 zero validation과 compute hooks를 구현합니다." },
          { lines: "58-61", explanation: "동일 base API로 success와 failure outcome을 exact rendering합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("TemplateMethodCalculator.java", "TemplateMethodCalculator") },
        output: { value: "add=ok:12.0,trace:common>specific>compute>publish\ndivideZero=error:ArithmeticException,trace:common>specific>error", explanation: ["Add는 네 정상 단계와 value12.0을 immutable Outcome으로 반환합니다.", "Divide zero는 specific validation에서 throw해 compute/publish 없이 error 단계로 갑니다.", "caller는 exception message나 stdout parsing 없이 success/error를 구분합니다."] },
        experiments: [
          { change: "execute의 final을 제거하고 Divide가 validation 없는 execute를 override합니다.", prediction: "zero policy와 trace/postcondition을 우회할 수 있습니다.", result: "Template Method의 invariant 소유권이 사라집니다." },
          { change: "catch를 ArithmeticException만 잡도록 좁힙니다.", prediction: "zero는 Outcome failure지만 NullPointerException 같은 programming bug는 caller로 전파됩니다.", result: "오류 변환 범위는 domain policy와 bug visibility 사이 trade-off입니다." },
          { change: "compute가 Double.POSITIVE_INFINITY를 반환할 수 있게 하고 publish 전 finite postcondition을 추가합니다.", prediction: "overflow/invalid result도 unified error path로 보낼 수 있습니다.", result: "Template Method는 input뿐 아니라 output invariant도 중앙화합니다." },
        ],
        sourceRefs: ["java-class05-ex07", "java-class05-ex08", "jls-abstract-method", "jls-final-method", "java-double-is-finite"],
      }],
      diagnostics: [
        { symptom: "subclass가 workflow를 override해 validation이나 cleanup을 건너뛴다.", likelyCause: "public template method가 final이 아니고 hooks와 caller API가 분리되지 않았습니다.", checks: ["workflow modifier를 reflection으로 봅니다.", "protected hooks를 caller가 직접 부를 수 있는지 봅니다.", "모든 exit path의 postcondition을 비교합니다."], fix: "workflow를 public final로 봉인하고 variation만 protected hooks로 남깁니다.", prevention: "reflection structural test와 malicious subclass compile test를 유지합니다." },
        { symptom: "Template Method가 모든 RuntimeException을 success0으로 바꿔 bug가 숨는다.", likelyCause: "failure normalization을 과도하게 넓히고 success/failure status를 분리하지 않았습니다.", checks: ["catch type과 returned status를 봅니다.", "programming error와 domain rejection을 분류합니다.", "logging/cause preservation을 확인합니다."], fix: "domain exceptions만 Outcome으로 변환하고 unexpected exceptions는 cause를 보존해 전파합니다.", prevention: "failure taxonomy별 contract tests를 둡니다." },
      ],
      expertNotes: ["template workflow가 I/O나 transaction을 소유하면 hooks의 exception safety, cancellation, timeout, rollback order를 public contract로 명시해야 합니다."],
    },
    {
      id: "reflection-contract-and-api-evolution",
      title: "reflection으로 abstract class·hook·final workflow·constructor surface를 고정하고 abstract API 진화를 breaking change로 다룹니다",
      lead: "behavior output이 같아도 modifier나 obligation set이 바뀌면 외부 subclasses가 깨지므로 compiled shape를 별도 검사합니다.",
      explanations: [
        "Modifier.isAbstract(Base.class.getModifiers())는 class abstractness를, declared methods의 modifier는 hook obligation을 따로 확인합니다. abstract class와 abstract method count를 동치로 검사하지 않습니다.",
        "Constructor.getModifiers로 protected construction surface를 확인하고 Method.is final/protected/abstract를 조합해 Template Method 경계를 고정할 수 있습니다.",
        "public abstract class에 새 abstract method를 추가하면 모든 source subclasses가 새 obligation을 구현해야 합니다. 기존 binary subclass는 linkage 자체는 될 수 있어도 새 method invocation에서 AbstractMethodError 위험이 생기므로 호환 변경으로 취급할 수 없습니다.",
        "새 concrete method/default behavior는 source break를 줄이지만 subclass의 기존 동명 method, return type, access와 충돌하거나 semantic behavior를 바꿀 수 있습니다. compatibility는 compile 성공만이 아닙니다.",
        "protected constructor signature 삭제·access 축소는 subclass construction을 깨뜨립니다. public/protected hooks를 final로 바꾸는 것도 existing overrides와 충돌할 수 있습니다.",
        "reflection tests는 모든 private implementation detail을 고정하지 않고 공개/protected extension contract만 검사해야 refactoring 자유를 보존합니다.",
      ],
      concepts: [
        { term: "modifier contract", definition: "class/method/constructor가 abstract·final·protected 등 어떤 extension surface를 제공하는지 compiled modifiers로 검증하는 계약입니다.", detail: ["behavior golden과 별도입니다.", "공개/protected shape만 선택적으로 고정합니다."] },
        { term: "abstract API evolution", definition: "새 obligation, hook signature, constructor surface 변화가 existing subclasses의 source/binary/runtime에 미치는 영향입니다.", detail: ["새 abstract method는 breaking입니다.", "concrete default도 semantic conflict review가 필요합니다."] },
        { term: "AbstractMethodError risk", definition: "기존 concrete binary가 새 abstract obligation implementation을 갖지 않은 상태에서 그 method가 runtime invocation될 때 생길 수 있는 linkage error 위험입니다.", detail: ["source rebuild failure와 다른 단계입니다.", "library/client version matrix가 필요합니다."] },
      ],
      codeExamples: [{
        id: "abstract-template-structural-shape",
        title: "Base abstract·protected constructor·abstract hook·final workflow와 Concrete 완성을 reflection으로 검사합니다",
        language: "java",
        filename: "AbstractShape.java",
        purpose: "Template Method의 extension surface가 우연한 output equality 뒤에서 drift하지 않게 합니다.",
        code: String.raw`import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

public class AbstractShape {
    abstract static class Base {
        protected Base() { }
        protected abstract String hook();
        public final String run() { return "run:" + hook(); }
    }

    static final class Concrete extends Base {
        @Override protected String hook() { return "ok"; }
    }

    public static void main(String[] args) throws Exception {
        Constructor<?> constructor = Base.class.getDeclaredConstructor();
        Method hook = Base.class.getDeclaredMethod("hook");
        Method workflow = Base.class.getDeclaredMethod("run");
        System.out.println("baseAbstract="
                + Modifier.isAbstract(Base.class.getModifiers()));
        System.out.println("constructorProtected="
                + Modifier.isProtected(constructor.getModifiers()));
        System.out.println("hook=abstract:" + Modifier.isAbstract(hook.getModifiers())
                + ",protected:" + Modifier.isProtected(hook.getModifiers()));
        System.out.println("workflowFinal="
                + Modifier.isFinal(workflow.getModifiers()));
        System.out.println("concreteAbstract="
                + Modifier.isAbstract(Concrete.class.getModifiers()));
        System.out.println(new Concrete().run());
    }
}`,
        walkthrough: [
          { lines: "6-14", explanation: "의도된 abstract base/protected hook/final workflow와 concrete implementation shape를 선언합니다." },
          { lines: "17-29", explanation: "constructor와 두 methods를 찾아 class/members modifiers를 각각 구조적으로 검사합니다." },
          { lines: "30-32", explanation: "Concrete가 non-abstract이고 final workflow가 runtime hook 결과를 조합하는 behavior도 확인합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("AbstractShape.java", "AbstractShape") },
        output: { value: "baseAbstract=true\nconstructorProtected=true\nhook=abstract:true,protected:true\nworkflowFinal=true\nconcreteAbstract=false\nrun:ok", explanation: ["class abstractness와 hook abstractness가 별도 true입니다.", "constructor는 subclass용 protected surface입니다.", "workflow final과 Concrete non-abstract가 Template Method boundary를 완성합니다.", "behavior run:ok까지 구조와 함께 검증합니다."] },
        experiments: [
          { change: "Base에 protected abstract String secondHook()를 추가합니다.", prediction: "Concrete가 새 obligation을 구현하지 않아 source compile 실패합니다.", result: "새 abstract method는 implementer-breaking change입니다." },
          { change: "run의 final을 제거합니다.", prediction: "behavior output은 당장 같아도 workflowFinalfalse로 structural test가 실패합니다.", result: "invariant surface drift를 output보다 먼저 잡습니다." },
          { change: "Base constructor를 private로 바꿉니다.", prediction: "별도 top-level/nonnest subclass construction이 불가능해집니다.", result: "nested nestmate test만으로 access 경계를 판단하지 말고 실제 public API package 구조를 재현해야 합니다." },
        ],
        sourceRefs: ["jls-abstract-class", "jls-abstract-method", "jls-binary-methods", "java-reflection-modifier", "java-reflection-method", "java-reflection-constructor", "java-abstract-method-error"],
      }],
      diagnostics: [
        { symptom: "library에 abstract hook을 추가한 뒤 외부 subclasses가 모두 깨진다.", likelyCause: "새 obligation을 호환 가능한 API 확장으로 간주했습니다.", checks: ["source implementer corpus를 rebuild합니다.", "old subclass binary와 new library invocation을 test합니다.", "concrete default 또는 separate interface version을 검토합니다."], fix: "major-version migration, default concrete behavior, 새 sibling type 중 의미에 맞는 경로를 선택합니다.", prevention: "public abstract method 추가를 breaking-change checklist에 둡니다." },
        { symptom: "reflection test가 private helper rename에도 실패해 refactoring을 막는다.", likelyCause: "extension contract가 아닌 모든 declared member를 snapshot했습니다.", checks: ["외부 subclass/caller가 의존할 수 있는 visibility만 추립니다.", "behavior contract로 충분한 assertions를 구분합니다.", "generated/synthetic members를 제외합니다."], fix: "public/protected constructor·hook·final workflow modifiers/signatures만 고정합니다.", prevention: "각 structural assertion에 호환성 이유를 기록합니다." },
      ],
      expertNotes: ["library evolution test는 old-client/new-library와 clean-rebuild 두 matrix를 모두 실행해 source error, linkage error, semantic drift를 구분합니다."],
    },
    {
      id: "negative-abstract-compiler-suite",
      title: "direct new·미구현 concrete class·body/modifier 충돌·weaker access·익명 미구현을 exact diagnostics로 고정합니다",
      lead: "잘못된 source는 주석이 아니라 fixture별 compiler task에서 반드시 목표 error 하나로 실패해야 합니다.",
      explanations: [
        "direct-new fixture는 constructor가 존재해도 abstract class instance creation이 compiler.err.abstract.cant.be.instantiated로 거부됨을 확인합니다.",
        "missing-implementation과 anonymous-missing fixtures는 이름 있는 concrete class와 anonymous concrete subclass 모두 obligation set을 비워야 한다는 같은 code를 서로 다른 line에서 검증합니다.",
        "abstract-with-body는 semicolon contract를 어긴 별도 diagnostic입니다. 빈 block도 body이므로 no-op implementation과 abstract declaration을 섞을 수 없습니다.",
        "private-abstract와 static-abstract methods, final-abstract class는 modifier 목적이 모순되어 illegal combination으로 거부됩니다. message text가 아니라 OpenJDK21 code·line·exactly-one-error를 봅니다.",
        "weaker-access는 method body가 있어도 public abstract contract를 package-private implementation으로 좁힐 수 없음을 확인합니다. @Override 유무와 무관한 language rule입니다.",
        "fixture별 explicit -d와 GUID temp direct child를 사용해 failed compile의 partial artifacts가 저장소나 다른 fixture classpath를 오염시키지 않게 합니다.",
      ],
      concepts: [
        { term: "abstract negative contract", definition: "abstract class/method 규칙을 의도적으로 위반한 source가 pinned compiler에서 expected line/code로 실패하는 test입니다.", detail: ["compiled=false만으로 부족합니다.", "diagnostic 전체 count도1이어야 합니다."] },
        { term: "modifier contradiction", definition: "override obligation을 요구하는 abstract와 override를 막거나 receiver dispatch가 없는 modifier를 함께 쓰는 모순입니다.", detail: ["private/static/final 등이 대표입니다.", "compiler illegal-combination code로 확인합니다."] },
        { term: "fixture isolation", definition: "각 compiler task가 독립 source object·diagnostics collector·classes output을 갖는 검증 방식입니다.", detail: ["동명 Base/Child를 안전하게 반복합니다.", "partial output leakage를 막습니다."] },
      ],
      codeExamples: [{
        id: "abstract-negative-compiler-contracts",
        title: "추상 타입 경계 여덟 cases를 JDK21 diagnostic code·line으로 검증합니다",
        language: "java",
        filename: "NegativeAbstractContracts.java",
        purpose: "추상 class/method의 creation·obligation·body·modifier·access 규칙을 실행 가능한 실패 계약으로 만듭니다.",
        code: String.raw`import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class NegativeAbstractContracts {
    record Fixture(String name, String source, long line, String code) { }

    static final class MemorySource extends SimpleJavaFileObject {
        private final String source;
        MemorySource(String name, String source) {
            super(URI.create("string:///" + name + ".java"), Kind.SOURCE);
            this.source = source;
        }
        @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) {
            return source;
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("JDK required");
        Path base = Path.of(System.getProperty("java.io.tmpdir"))
                .toAbsolutePath().normalize();
        Path root = base.resolve("oop08-negative-" + UUID.randomUUID()).normalize();
        if (!root.getParent().equals(base) || Files.exists(root)) {
            throw new IllegalStateException("unsafe temp root");
        }
        Files.createDirectory(root);

        List<Fixture> fixtures = List.of(
                new Fixture("direct-new",
                        "abstract class Base {}\n"
                        + "class Use { Object value = new Base(); }\n",
                        2, "compiler.err.abstract.cant.be.instantiated"),
                new Fixture("missing-implementation",
                        "abstract class Base { abstract void run(); }\n"
                        + "class Child extends Base {}\n",
                        2, "compiler.err.does.not.override.abstract"),
                new Fixture("abstract-with-body",
                        "abstract class Base { abstract void run() {} }\n",
                        1, "compiler.err.abstract.meth.cant.have.body"),
                new Fixture("private-abstract",
                        "abstract class Base { private abstract void run(); }\n",
                        1, "compiler.err.illegal.combination.of.modifiers"),
                new Fixture("static-abstract",
                        "abstract class Base { static abstract void run(); }\n",
                        1, "compiler.err.illegal.combination.of.modifiers"),
                new Fixture("final-abstract-class",
                        "final abstract class Base {}\n",
                        1, "compiler.err.illegal.combination.of.modifiers"),
                new Fixture("weaker-access",
                        "abstract class Base { public abstract void run(); }\n"
                        + "class Child extends Base { void run() {} }\n",
                        2, "compiler.err.override.weaker.access"),
                new Fixture("anonymous-missing",
                        "abstract class Base { abstract void run(); }\n"
                        + "class Use { Base value = new Base() {}; }\n",
                        2, "compiler.err.does.not.override.abstract")
        );

        try {
            for (int index = 0; index < fixtures.size(); index++) {
                Fixture fixture = fixtures.get(index);
                Path classes = root.resolve("classes-" + index);
                Files.createDirectory(classes);
                DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
                String sourceName = fixture.name().replace('-', '_');
                try (StandardJavaFileManager manager = compiler.getStandardFileManager(
                        diagnostics, Locale.ROOT, java.nio.charset.StandardCharsets.UTF_8)) {
                    List<String> options = List.of("--release", "21", "-proc:none",
                            "-Xlint:all", "-XDrawDiagnostics", "-d", classes.toString());
                    boolean compiled = Boolean.TRUE.equals(compiler.getTask(null, manager,
                            diagnostics, options, null,
                            List.of(new MemorySource(sourceName, fixture.source()))).call());
                    List<Diagnostic<? extends JavaFileObject>> errors = diagnostics
                            .getDiagnostics().stream()
                            .filter(item -> item.getKind() == Diagnostic.Kind.ERROR)
                            .toList();
                    if (compiled || diagnostics.getDiagnostics().size() != 1
                            || errors.size() != 1
                            || errors.get(0).getLineNumber() != fixture.line()
                            || !errors.get(0).getCode().equals(fixture.code())) {
                        throw new AssertionError(fixture.name() + " diagnostic drift: "
                                + diagnostics.getDiagnostics());
                    }
                    System.out.println(fixture.name() + "=" + errors.get(0).getCode()
                            + "@" + errors.get(0).getLineNumber());
                }
            }
        } finally {
            deleteDirectChild(base, root);
        }
    }

    static void deleteDirectChild(Path base, Path root) throws IOException {
        Path resolved = root.toAbsolutePath().normalize();
        if (!resolved.getParent().equals(base)) throw new IOException("unsafe cleanup");
        if (Files.exists(resolved)) {
            try (var paths = Files.walk(resolved)) {
                for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                    Files.deleteIfExists(path);
                }
            }
        }
        if (Files.exists(resolved)) throw new IOException("cleanup failed");
    }
}`,
        walkthrough: [
          { lines: "1-29", explanation: "in-memory source와 structured diagnostics를 정의해 localized message parsing을 피합니다." },
          { lines: "31-40", explanation: "full JDK compiler와 normalized OS temp GUID direct-child invariant를 검증합니다." },
          { lines: "42-71", explanation: "여덟 fixture에 source·1-based line·OpenJDK21 diagnostic code를 함께 선언합니다." },
          { lines: "73-104", explanation: "fixture별 classes directory와 explicit release/proc/lint/draw options로 exactly-one-error를 확인합니다." },
          { lines: "107-119", explanation: "finally에서 direct-child boundary를 다시 검사하고 reverse order cleanup·post-delete를 수행합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK"], command: isolatedJavaRun("NegativeAbstractContracts.java", "NegativeAbstractContracts") },
        output: { value: "direct-new=compiler.err.abstract.cant.be.instantiated@2\nmissing-implementation=compiler.err.does.not.override.abstract@2\nabstract-with-body=compiler.err.abstract.meth.cant.have.body@1\nprivate-abstract=compiler.err.illegal.combination.of.modifiers@1\nstatic-abstract=compiler.err.illegal.combination.of.modifiers@1\nfinal-abstract-class=compiler.err.illegal.combination.of.modifiers@1\nweaker-access=compiler.err.override.weaker.access@2\nanonymous-missing=compiler.err.does.not.override.abstract@2", explanation: ["direct new는 constructor 유무가 아니라 abstract class creation 규칙으로 line2에서 실패합니다.", "이름 있는 Child와 anonymous class 모두 미구현 obligation을 같은 code로 거부합니다.", "method/class body·modifier·access 위반은 서로 다른 diagnostic contracts입니다.", "모든 cases는 exactly one error와 isolated output을 요구합니다."] },
        experiments: [
          { change: "missing-implementation Child에 public void run(){}를 추가합니다.", prediction: "fixture가 compile되어 expected-fail assertion이 실패합니다.", result: "concrete obligation이 완성됐음을 compiler가 확인합니다." },
          { change: "private-abstract를 protected abstract로 바꿉니다.", prediction: "Base declaration 자체는 합법이지만 abstract class라 직접 new는 여전히 불가합니다.", result: "hook visibility와 class creation policy는 별도입니다." },
          { change: "fixture compiler options에서 -d를 제거합니다.", prediction: "diagnostic은 같을 수 있지만 partial artifacts 위치를 통제하지 못합니다.", result: "실패 의미와 artifact isolation을 둘 다 계약으로 둡니다." },
        ],
        sourceRefs: ["jdk21-javac", "jls-abstract-class", "jls-abstract-method", "jls-method-modifiers", "jls-overriding", "jls-anonymous-class", "java-compiler-api", "java-diagnostic-api", "java-files-api", "java-uuid-api"],
      }],
      diagnostics: [
        { symptom: "negative suite가 expected와 다른 parser error로 실패해도 통과한다.", likelyCause: "compiled=false만 검사하고 diagnostic kind/count/line/code를 보지 않았습니다.", checks: ["전체 diagnostics count와 ERROR count를 비교합니다.", "fixture source line numbering을 확인합니다.", "expected OpenJDK code를 version pin과 함께 봅니다."], fix: "exactly-one-error·line·code를 모두 assert합니다.", prevention: "fixture record에 expectation을 source와 같은 곳에 둡니다." },
        { symptom: "anonymous-missing이 direct-new error일 것이라 예상했다.", likelyCause: "new Base(){}가 base 직접 instance인지 anonymous subclass declaration인지 구분하지 않았습니다.", checks: ["class body braces가 있는지 봅니다.", "anonymous class obligation set을 계산합니다.", "body에서 run을 구현해 compile 결과를 비교합니다."], fix: "anonymous concrete subclass의 missing implementation error로 분류합니다.", prevention: "direct-new와 anonymous-new fixtures를 항상 쌍으로 유지합니다." },
      ],
      expertNotes: ["javac diagnostic code는 JLS portable contract가 아니라 OpenJDK implementation detail이므로 vendor/version 변경 때 semantic rule과 함께 재감사합니다."],
    },
  ],
  lab: {
    title: "stateful 파일 가져오기 hierarchy를 final Template Method와 strategy collaborators로 재설계합니다",
    scenario: "LegacyImporter는 result field와 parseCsv·parseJson·validate·save 네 abstract methods를 한 base에 두고 constructors에서 subclass hook을 호출합니다. CSV importer는 JSON hook을 unsupported로 막고, 실패하면 stdout에 message를 남긴 뒤 result0을 재사용합니다. CLI는 format menu를 고르기 전에 파일 내용을 먼저 읽습니다. 목표는 공통 lifecycle을 abstract Template Method로, format parsing은 작은 strategies로 분리하고 construction·failure·extension contracts를 실행 가능하게 만드는 것입니다.",
    setup: [
      "OpenJDK 21.0.11과 PowerShell 7+를 사용하고 모든 positive javac에 -encoding UTF-8 --release 21 -proc:none -Xlint:all -d <isolated-classes>를 적용합니다.",
      "OS temp 아래 새 GUID direct child를 만들고 original audit, positive examples, negative fixtures의 classes directories를 분리합니다.",
      "실제 파일·사용자 경로 대신 doc-1, rows3, example.test 같은 synthetic inputs를 사용합니다.",
      "before behavior로 stale result, unsupported hooks, constructor virtual call, invalid menu input order, stdout-only failure를 각각 failing contract로 기록합니다.",
      "ImportOutcome은 success, importedCount, errorCode, trace를 가진 immutable record로 설계합니다.",
    ],
    steps: [
      "LegacyImporter의 abstract methods, mutable fields, public/protected constructors와 모든 subclasses의 obligation set을 표로 만듭니다.",
      "공통 lifecycle을 AbstractImportJob의 public final run(Input)으로 옮기고 common validate→parse→persist→publish 순서를 local trace로 관리합니다.",
      "constructor와 field initializer에서 overridable calls·registry publish·thread start를 제거하고 base-owned final fields만 검증·대입합니다.",
      "format별 parse를 Parser strategy interface로 분리하고 CsvParser·JsonParser를 named implementations 또는 lambda로 주입합니다.",
      "persist처럼 모든 jobs에 필요한 variation만 protected abstract hook으로 남기고 optional logging hook은 side-effect-free default를 줍니다.",
      "zero/invalid/parse failure를 stdout+result0 대신 ImportOutcome failure로 반환하되 unexpected programming exceptions는 cause를 보존해 전파합니다.",
      "CLI는 menu validity를 파일/operand input보다 먼저 확인하고 core Outcome을 locale-specific message로 변환하는 boundary만 담당합니다.",
      "anonymous subclass로 in-memory persist hook을 한 test에 구현하고 isAnonymousClass와 behavior를 검사하되 generated class name은 assertion하지 않습니다.",
      "reflection으로 base abstract, constructor protected, run final, persist protected+abstract, concrete job non-abstract를 고정합니다.",
      "direct new, concrete missing persist, abstract body, private/static abstract, weaker access, anonymous missing fixtures를 exactly-one-error로 실행합니다.",
      "success·domain failure·unexpected failure·concurrent calls를 test해 shared result와 cross-call trace가 없는지 확인합니다.",
      "모든 output을 exact compare하고 cleanup 뒤 workspace .class·temp script·개인 literal·절대 경로가0인지 검사합니다.",
    ],
    expectedResult: [
      "AbstractImportJob은 직접 new할 수 없지만 concrete job construction에서 protected base constructor가 정확히 한 번 실행됩니다.",
      "public final run이 모든 concrete jobs에 동일한 validation·parse·persist·publish ordering과 Outcome failure channel을 적용합니다.",
      "CsvParser와 JsonParser는 ImportJob subclasses가 아니라 injected strategies라 unsupported operations와 wide obligation set이 사라집니다.",
      "호출별 immutable Outcome/trace로 stale mutable result와 concurrent overwrite가 없습니다.",
      "anonymous test implementation도 required hook을 모두 구현하고 generated class name에 의존하지 않습니다.",
      "구조·behavior·negative compiler·failure-injection suites가 abstract extension surface를 서로 다른 증거로 검증합니다.",
    ],
    cleanup: [
      "resolved root의 parent가 normalized OS temp base인지 확인한 뒤 해당 GUID direct child만 reverse-order 삭제합니다.",
      "CLI/process tests가 timeout이면 process tree를 kill하고 stdout/stderr tasks를 회수한 뒤 실패시킵니다.",
      "test registries/counters를 새 JVM 또는 case별 fixture로 격리하고 afterEach에 shared state가0인지 확인합니다.",
    ],
    extensions: [
      "Parser를 ServiceLoader plugin으로 확장할 때 untrusted implementation timeout·resource limits·error isolation을 설계합니다.",
      "old subclass binary/new base library matrix로 abstract hook 추가와 concrete default 추가의 source·binary·semantic 영향을 비교합니다.",
      "Template Method persist hook을 transaction collaborator로 바꾸고 rollback/compensation order를 failure injection으로 검증합니다.",
      "sealed abstract hierarchy와 open interface strategy를 비교해 외부 extension 정책을 문서화합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "abstract methods0인 DocumentBase와 concrete TextDocument를 만들고 direct-new/constructor/reflection 차이를 확인합니다.",
      requirements: ["DocumentBase는 private final id, protected constructor, public final id()만 갖고 abstract method는0개입니다.", "TextDocument는 public constructor에서 super(id)를 호출합니다.", "DocumentBase view로 TextDocument를 사용하고 base constructor marker·id를 exact 출력합니다.", "reflection으로 baseAbstracttrue와 declaredAbstractMethods0을 검사합니다.", "new DocumentBase negative fixture를 별도 compiler task로 검증합니다."],
      hints: ["abstract class와 abstract method count는 별도 reflection queries입니다.", "direct new 실패 fixture를 positive source에 주석으로만 두지 않습니다.", "constructor marker는 concrete subclass new에서 나와야 합니다."],
      expectedOutcome: "base constructor가 실행되고 abstract base view로 id를 읽으며 class abstracttrue·abstract method count0이 동시에 증명됩니다.",
      solutionOutline: ["Base state와 protected constructor를 먼저 작성합니다.", "minimal concrete subclass를 연결합니다.", "behavior/reflection output을 고정합니다.", "direct-new expected diagnostic을 격리합니다."],
    },
    {
      difficulty: "응용",
      prompt: "Ex07 operation objects와 Ex08 stateful calculator를 immutable Result를 반환하는 strategy calculator로 통합합니다.",
      requirements: ["Operation은 double apply 또는 structured Result를 제공하는 작은 interface입니다.", "Add·Divide·Remainder의 zero/NaN/Infinity policy를 한 conformance table로 정의합니다.", "Calculator는 Operation을 has-a로 받고 result field와 stdout domain message를 제거합니다.", "invalid menu를 operands 읽기 전에 거부하는 process contract를 작성합니다.", "정상·zero·invalid·concurrent calls를 parameterized exact tests로 검증합니다."],
      hints: ["Ex07 Div throw와 Ex08 print+0 중 하나를 무심코 유지하지 말고 새 public failure policy를 선택합니다.", "valid numeric0과 failure를 같은 sentinel로 쓰지 않습니다.", "CLI message와 core error code를 분리합니다."],
      expectedOutcome: "각 invocation 결과가 독립 immutable value이고 zero/invalid 정책이 operation family 전체에서 일관되며 process가 추가 input 없이 invalid menu를 거부합니다.",
      solutionOutline: ["원본 failure matrix를 먼저 기록합니다.", "strategy role과 Result type을 정의합니다.", "stateful field를 local return으로 치환합니다.", "CLI selection/input order와 core execution을 분리합니다."],
    },
    {
      difficulty: "설계",
      prompt: "배포 pipeline을 Template Method·strategy·composition으로 분리하고 외부 subclass API 진화 정책까지 설계합니다.",
      requirements: ["public final deploy workflow와 protected required/optional hooks의 pre/postconditions를 정의합니다.", "constructor virtual call·this escape가 없음을 source/trace로 증명합니다.", "환경별 packaging은 strategy collaborator로 분리하고 abstract inheritance가 필요한 shared state만 남깁니다.", "Outcome failure taxonomy, rollback, cancellation, timeout, idempotency를 모든 exit path에 연결합니다.", "reflection shape, anonymous test double, eight negative diagnostics, old/new binary matrix를 제공합니다.", "새 abstract hook 추가를 피하는 versioning/migration plan을 작성합니다."],
      hints: ["Template Method가 workflow order를, strategy가 독립 algorithm을 소유하게 합니다.", "모든 RuntimeException을 success sentinel로 바꾸지 않습니다.", "public/protected structure assertions에는 호환성 이유를 적습니다."],
      expectedOutcome: "workflow invariant와 variation 경계가 분명하고 failure/rollback이 structured outcome으로 관찰되며 외부 implementers를 깨뜨리지 않는 evolution plan이 완성됩니다.",
      solutionOutline: ["단계·소유자·실패·보상 표를 만듭니다.", "final workflow와 hooks를 최소화합니다.", "independent variation을 strategies로 추출합니다.", "behavior/structural/compiler/binary tests를 구현합니다.", "compatibility policy를 문서화합니다."],
    },
  ],
  reviewQuestions: [
    { question: "abstract class는 abstract method를 반드시 하나 이상 가져야 하나요?", answer: "아닙니다. abstract method가 하나라도 있는 class는 abstract여야 하지만 abstract class는 abstract method를0개 가질 수 있습니다." },
    { question: "abstract class에 fields·constructor·concrete method를 둘 수 있나요?", answer: "모두 가능합니다. Ex01은 fields, public constructor, concrete play, abstract sound를 함께 갖습니다." },
    { question: "abstract class를 직접 new할 수 없는데 constructor는 언제 실행되나요?", answer: "concrete subclass를 new할 때 superclass construction 단계에서 실행됩니다. Ex03의 세 concrete objects마다 base constructor marker가 먼저 나옵니다." },
    { question: "Base view = new Child()는 합법인가요?", answer: "합법입니다. new 대상은 concrete Child이고 abstract Base는 declared reference type과 common contract로 사용됩니다." },
    { question: "abstract method의 body는 빈 {}인가요?", answer: "아닙니다. class abstract method는 body 대신 semicolon을 둡니다. 빈 block은 no-op concrete body이며 abstract modifier와 함께 쓰면 compile 실패합니다." },
    { question: "private abstract method가 왜 불가능한가요?", answer: "abstract는 subclass override implementation을 요구하지만 private method는 그 override 대상으로 inherited/access되지 않아 목적이 모순되기 때문입니다." },
    { question: "static abstract 또는 final abstract method가 왜 불가능한가요?", answer: "static은 receiver runtime dispatch 대상이 아니고 final은 override를 금지하므로 subclass override obligation인 abstract와 양립하지 않습니다." },
    { question: "abstract subclass는 inherited abstract method를 구현하지 않아도 되나요?", answer: "그 class 자체가 abstract로 남는다면 obligation을 아래로 미룰 수 있습니다. 첫 concrete descendant는 남은 obligations를 모두 구현해야 합니다." },
    { question: "abstract intermediate가 inherited obligation을 구현한 뒤에도 abstract일 수 있나요?", answer: "가능합니다. 다른 obligations가 있거나 direct creation을 막는 subclass-only 설계 의도가 있어 abstract로 남을 수 있습니다." },
    { question: "concrete subclass가 abstract method 하나를 빠뜨리면 언제 실패하나요?", answer: "javac가 class declaration에서 compile-time error로 거부합니다. runtime까지 미루지 않습니다." },
    { question: "Base constructor에서 abstract hook을 호출하면 어떤 body가 실행되나요?", answer: "runtime object가 Child라 Child override가 dispatch될 수 있지만 Child fields는 아직 explicit initialization 전이라 null/0을 볼 수 있습니다." },
    { question: "Child field를 final로 만들면 constructor hook 문제가 해결되나요?", answer: "아닙니다. final field도 Child initializer 실행 전에는 default value 단계가 있으므로 호출 시점을 construction 이후로 옮겨야 합니다." },
    { question: "anonymous class는 abstract base 자체를 만드는 예외인가요?", answer: "아닙니다. expression 안에서 anonymous concrete subclass를 선언하고 obligations를 구현한 뒤 그 subclass instance를 만듭니다." },
    { question: "anonymous class에서 local variable을 capture할 조건은 무엇인가요?", answer: "local variable이 final 또는 effectively final이어야 합니다. captured object의 내부 mutable state는 별도 문제입니다." },
    { question: "anonymous runtime class name을 test golden으로 써도 되나요?", answer: "권장하지 않습니다. compiler-generated name은 stable API가 아니므로 behavior와 Class.isAnonymousClass를 검사합니다." },
    { question: "Ex07 calculator의 핵심 구조는 무엇인가요?", answer: "abstract operate 하나를 operation별 subclasses가 구현하고 결과를 직접 return합니다. Div zero는 ArithmeticException으로 caller에 전달합니다." },
    { question: "Ex08/09 calculator의 핵심 구조는 무엇인가요?", answer: "네 abstract void operations를 한 subclass가 모두 구현하고 shared mutable result field에 값을 저장합니다." },
    { question: "Ex07 Div와 Ex09 division의 zero contract는 같은가요?", answer: "아닙니다. Ex07은 ArithmeticException을 throw하고 Ex09는 message를 print한 뒤 result0을 쓰고 정상 return합니다." },
    { question: "Ex10 invalid menu는 operands를 읽기 전에 거부하나요?", answer: "아닙니다. menu4가 아닌 모든 nonzero values가 else로 들어가 두 ints를 읽은 뒤 switch default에서 invalid message를 냅니다." },
    { question: "shared result field의 주요 위험은 무엇인가요?", answer: "호출과 read의 protocol 결합, failure 뒤 stale/sentinel value, 다음 호출 overwrite, concurrent/reentrant data race입니다." },
    { question: "operation-per-subclass가 항상 좋은가요?", answer: "아닙니다. algorithm이 크고 독립 변화할 때 유용하지만 tiny stateless formulas에는 functional interface lambda가 더 작을 수 있습니다." },
    { question: "abstract class 대신 interface strategy를 선택할 때는 언제인가요?", answer: "공통 state·constructor·final workflow가 필요 없고 작은 역할과 multiple implementations/composition이 중요할 때입니다." },
    { question: "Template Method의 핵심은 abstract hooks 수인가요?", answer: "아닙니다. public final concrete workflow가 안정된 단계 순서·공통 validation·failure/postcondition을 소유한다는 점입니다." },
    { question: "hooks는 왜 protected이고 workflow는 public final인가요?", answer: "일반 caller는 완성된 workflow만 사용하고 subclass만 제한된 variation points를 구현하며 순서·invariant 우회를 막기 위해서입니다." },
    { question: "Template Method에서 모든 RuntimeException을 Outcome으로 바꾸면 안전한가요?", answer: "항상 그렇지 않습니다. programming bugs를 숨길 수 있으므로 domain failures만 변환하고 unexpected errors는 cause를 보존해 전파하는 정책을 검토합니다." },
    { question: "public abstract class에 새 abstract method를 추가하는 것은 호환 가능한가요?", answer: "대개 breaking change입니다. source subclasses는 새 obligation 때문에 실패하고 old binary는 새 method invocation에서 AbstractMethodError 위험이 있습니다." },
    { question: "abstract 구조를 reflection으로 무엇을 검사하나요?", answer: "class abstract modifier, protected constructor, hook abstract/protected, workflow final/public, concrete subclass non-abstract 같은 실제 extension contract만 검사합니다." },
    { question: "negative compiler suite가 compiled=false만 보면 왜 부족한가요?", answer: "목표 semantic error가 아니라 parser/classpath error일 수 있으므로 exactly-one-error, expected 1-based line, version-pinned diagnostic code를 함께 확인해야 합니다." },
  ],
  completionChecklist: [
    "abstract class가 abstract method를0개 이상 가질 수 있음을 설명·reflection으로 검증했다.",
    "abstract method 존재→class abstract 필요와 class abstract→method 필요의 방향을 구분했다.",
    "abstract class direct new 금지와 abstract-typed reference 사용을 분리했다.",
    "abstract base에 fields·constructors·concrete/final methods가 가능함을 실행했다.",
    "concrete subclass construction 중 abstract base constructor가 먼저 실행됨을 Ex03과 합성 trace로 확인했다.",
    "abstract method semicolon body와 empty concrete block을 구분했다.",
    "private·static·final·native·synchronized·strictfp와 abstract method의 비호환 이유를 설명했다.",
    "override implementation의 access·return·throws contract를 다뤘다.",
    "abstract intermediate의 defer/implement 선택과 concrete descendant obligation completion을 추적했다.",
    "@Override로 signature drift를 compiler가 잡도록 했다.",
    "constructor abstract hook이 Child default state를 관찰하는 위험을 exact null→ready trace로 증명했다.",
    "constructor/initializer this escape를 post-construction final workflow로 이동하는 기준을 제시했다.",
    "anonymous class가 base direct instance가 아니라 concrete anonymous subclass임을 설명했다.",
    "anonymous class obligations·effectively-final capture·generated-name 비의존을 검증했다.",
    "anonymous subclass·named subclass·interface lambda 선택을 비교했다.",
    "Ex07 operation-per-subclass와 direct return contract를 원본/source evidence로 연결했다.",
    "Ex07 Div의 zero ArithmeticException과 floating -0.0/NaN/Rem 차이를 다뤘다.",
    "Ex08의 four void hooks와 mutable double result coupling을 설명했다.",
    "Ex09 zero division이 print+result0+normal return임을 Ex07 throw와 구분했다.",
    "Ex10 invalid menu가 operands를 먼저 읽는 실제 input protocol을 숨기지 않았다.",
    "shared result의 stale/overwrite/reentrant/concurrency 위험을 호출별 immutable outcome과 비교했다.",
    "abstract class·interface strategy·composition·enum/named/lambda 대안의 선택 기준을 비교했다.",
    "Template Method public final workflow와 protected required/optional hooks를 구현했다.",
    "Template Method가 common validation·specific validation·compute·publish/error ordering을 소유하게 했다.",
    "failure status를 stdout/numeric sentinel이 아닌 immutable Outcome으로 분리했다.",
    "reflection으로 abstract class·protected constructor·abstract hook·final workflow·concrete class shape를 고정했다.",
    "새 abstract method와 constructor/hook modifier 변경의 source·binary·semantic 호환성을 구분했다.",
    "direct new·missing implementation·abstract body·method/class modifier·weaker access·anonymous missing eight negative cases를 검증했다.",
    "negative cases마다 exactly-one-error·line·OpenJDK21 diagnostic code를 확인했다.",
    "class05 전체16과 범위6을 서로 다른 -d directories에서 compile했다.",
    "전체·범위 warning6이 auxiliary class source layout에서 발생하며 Ex03:4·Ex10:2임을 assert했다.",
    "범위6의 main2·compile-only4를 source에서 계산했다.",
    "Ex03 exact6행과 abstract base constructor3회·sound3회를 순서대로 검증했다.",
    "Ex10 add·divzero·invalid·exit를 ProcessStartInfo 새 JVM·redirected streams·timeout으로 격리했다.",
    "모든 public Java examples는 warning0, exact output, OS temp GUID direct-child cleanup을 통과했다.",
    "모든 expected-fail compiles는 explicit fixture별 -d로 partial class artifacts를 격리했다.",
    "공개 code·output·evidence에 credential·실제 개인 literal·identity hash·로컬 절대 경로가 없음을 확인했다.",
    "원본6·JLS SE21·Java SE21 APIs·OpenJDK21·ProcessStartInfo 출처와 보충 범위를 구분했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class05-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class05/Ex01_Abstract.java", usedFor: ["abstract base declaration", "fields and constructor", "concrete play", "abstract sound", "zero-method comment correction"], evidence: "abstract class에 fields2·public constructor·concrete play·abstract sound가 함께 있고 주석이 ‘one or more’와 ‘zero also possible’를 모두 담아 앞 표현을 교정할 근거가 됨을 확인했습니다. 개인 field literals는 공개하지 않았습니다." },
    { id: "java-class05-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class05/Ex02_Dog.java", usedFor: ["concrete Dog obligation", "abstract Cat deferral", "abstract Cow implementation", "concrete descendants", "auxiliary warnings"], evidence: "한 source에 Dog, abstract Cat/Cow intermediates, concrete Cat/Cow가 있고 defer·implement·re-override paths와 다른 source 접근 warning의 declaration owners를 확인했습니다." },
    { id: "java-class05-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class05/Ex03_Main.java", usedFor: ["three concrete constructions", "exact six-line trace", "direct-new comments", "warning owner4"], evidence: "Dog·Cat·Cow concrete objects 세 개가 base constructor와 sound를 교대로 총6행 출력하며 auxiliary classes accesses4가 -Xlint:all warnings임을 실행했습니다." },
    { id: "java-class05-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class05/Ex07_Cale.java", usedFor: ["single operate obligation", "five operation classes", "return-value contract", "division zero throw", "remainder contrast"], evidence: "abstract operate 하나와 Add·Sub·Mul·Div·Rem 다섯 concrete operations, Div의 ArithmeticException zero guard, direct return 구조를 확인했습니다." },
    { id: "java-class05-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class05/Ex08_Cale.java", usedFor: ["mutable result", "four abstract void methods", "single wide implementation", "zero print and result0", "auxiliary declaration"], evidence: "double result0, plus/minus/multiply/division four obligations, Ex09_Cale implementation, divisor0 warning·result0·return 흐름을 확인했습니다." },
    { id: "java-class05-ex10", repository: "javastudy2/classstudy", path: "src/com/java/class05/Ex10_Main.java", usedFor: ["interactive Scanner loop", "normal/add result", "zero division output", "invalid menu operand order", "exit", "warning owner2"], evidence: "ProcessStartInfo 네 fresh JVMs에서 add12.0, divzero warning+0.0, invalid menu가 operands2개를 먼저 읽는 흐름, immediate exit와 exit0/stderr empty를 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["package/scope compile", "-Xlint auxiliary warnings", "--release21", "negative diagnostics"], evidence: "class05 전체16·범위6·positive examples·expected-fail fixtures의 OpenJDK21.0.11 기준입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["interactive Java child processes", "ArgumentList", "redirected stdin/stdout/stderr", "timeout execution"], evidence: "Ex10 네 input cases를 shell string interpolation 없이 별도 JVM arguments/streams로 실행하는 process API 근거입니다." },
    { id: "dotnet-environment-variables", repository: ".NET API", path: "System.Environment.GetEnvironmentVariable / SetEnvironmentVariable", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.environment.setenvironmentvariable", usedFor: ["process-scope environment preservation", "Java launcher option isolation", "finally restoration"], evidence: "audit process에서 네 Java launcher option 환경 변수의 원래 값을 저장·제거·복원해 host compiler/JVM options와 pickup diagnostics가 golden을 오염시키지 않게 하는 API 근거입니다." },
    { id: "jls-abstract-class", repository: "JLS SE 21", path: "8.1.1.1 abstract Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1.1", usedFor: ["zero or more abstract methods", "direct creation prohibition", "abstract/final contradiction"], evidence: "abstract class modifier의 정확한 의미와 direct instance creation 금지의 primary specification입니다." },
    { id: "jls-abstract-method", repository: "JLS SE 21", path: "8.4.3.1 abstract Methods", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.1", usedFor: ["semicolon body", "obligation", "modifier restrictions", "concrete subclass requirements"], evidence: "abstract method declaration과 subclass implementation obligation의 primary 근거입니다." },
    { id: "jls-method-modifiers", repository: "JLS SE 21", path: "8.4.3 Method Modifiers", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3", usedFor: ["private/static/final/native/synchronized/strictfp incompatibility", "method modifier combinations"], evidence: "abstract와 함께 허용되지 않는 method modifiers 및 modifier combination compile errors의 근거입니다." },
    { id: "jls-class-instance-creation-expression", repository: "JLS SE 21", path: "15.9 Class Instance Creation Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9", usedFor: ["direct abstract new failure", "anonymous class creation distinction"], evidence: "class instance creation expression과 abstract class/anonymous body의 compile-time 의미 근거입니다." },
    { id: "jls-class-instance-creation", repository: "JLS SE 21", path: "12.5 Creation of New Class Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5", usedFor: ["abstract base constructor execution", "superclass-first initialization", "constructor hook hazard"], evidence: "concrete subclass new에서 superclass state·constructor가 먼저 처리되는 execution-order 근거입니다." },
    { id: "jls-overriding", repository: "JLS SE 21", path: "8.4.8.1 Overriding in Subclasses", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.1", usedFor: ["abstract obligation implementation", "access/return/throws compatibility", "@Override intent"], evidence: "subclass method가 inherited abstract/concrete method를 override하는 signature와 access 관계 근거입니다." },
    { id: "jls-runtime-method-lookup", repository: "JLS SE 21", path: "15.12.4.4 Locate Method to Invoke", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4", usedFor: ["constructor-time Child override dispatch", "abstract base view runtime call"], evidence: "instance method implementation을 runtime receiver class에서 찾는 동적 dispatch 근거입니다." },
    { id: "jls-anonymous-class", repository: "JLS SE 21", path: "15.9.5 Anonymous Class Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9.5", usedFor: ["anonymous concrete subclass", "constructor limitation", "obligation implementation"], evidence: "class instance creation body가 anonymous class declaration을 형성하는 primary specification입니다." },
    { id: "jls-capture", repository: "JLS SE 21", path: "6.5.6.1 Simple Expression Names", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.5.6.1", usedFor: ["final/effectively-final local capture"], evidence: "local/anonymous class body가 참조하는 local variables의 final/effectively-final requirement 근거입니다." },
    { id: "jls-floating-point-operators", repository: "JLS SE 21", path: "15.17 Multiplicative Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.17", usedFor: ["double division/remainder zero", "NaN/Infinity semantics", "Ex07 operation contrast"], evidence: "floating-point /와 %가 integer ArithmeticException semantics와 다른 근거입니다." },
    { id: "jls-memory-model", repository: "JLS SE 21", path: "17.4 Memory Model", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4", usedFor: ["mutable result data race", "concurrent calls", "shared state visibility"], evidence: "동기화 없는 shared mutable field 접근의 data-race reasoning 근거입니다." },
    { id: "jls-happens-before", repository: "JLS SE 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["constructor this escape", "safe publication"], evidence: "construction 중 registry/thread publish가 cross-thread visibility와 ordering을 깨뜨리는 이유의 근거입니다." },
    { id: "jls-final-method", repository: "JLS SE 21", path: "8.4.3.3 final Methods", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.3", usedFor: ["final Template Method", "override prevention", "workflow invariant"], evidence: "final instance method가 subclass override를 금지하는 근거입니다." },
    { id: "jls-binary-methods", repository: "JLS SE 21", path: "13.4.12 Method and Constructor Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.12", usedFor: ["new abstract method", "constructor/hook evolution", "binary compatibility"], evidence: "method/constructor declaration 변화가 existing binaries에 미치는 영향의 근거입니다." },
    { id: "java-reflection-modifier", repository: "Java SE 21 API", path: "java.lang.reflect.Modifier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Modifier.html", usedFor: ["abstract/final/protected structural assertions"], evidence: "compiled class/method/constructor modifiers를 machine-readable predicates로 검사하는 API입니다." },
    { id: "java-reflection-method", repository: "Java SE 21 API", path: "java.lang.reflect.Method", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html", usedFor: ["declared abstract hook", "final workflow", "method shape"], evidence: "hook/workflow signatures와 declaring modifiers를 reflection으로 검사하는 API 근거입니다." },
    { id: "java-reflection-constructor", repository: "Java SE 21 API", path: "java.lang.reflect.Constructor", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Constructor.html", usedFor: ["protected abstract-base constructor surface"], evidence: "base declared constructor와 access modifier를 구조적으로 확인하는 API입니다." },
    { id: "java-class-is-anonymous", repository: "Java SE 21 API", path: "java.lang.Class.isAnonymousClass", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#isAnonymousClass()", usedFor: ["stable anonymous class assertion"], evidence: "compiler-generated binary name 대신 anonymous class 여부를 구조적으로 확인하는 API입니다." },
    { id: "java-arithmetic-exception", repository: "Java SE 21 API", path: "java.lang.ArithmeticException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ArithmeticException.html", usedFor: ["Ex07 division failure type", "template failure outcome"], evidence: "arithmetic exceptional condition을 나타내는 runtime exception type의 API 근거입니다." },
    { id: "java-double-is-finite", repository: "Java SE 21 API", path: "java.lang.Double.isFinite", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Double.html#isFinite(double)", usedFor: ["Template Method common numeric validation"], evidence: "NaN과 infinities를 common input boundary에서 거부하는 finite predicate 근거입니다." },
    { id: "java-abstract-method-error", repository: "Java SE 21 API", path: "java.lang.AbstractMethodError", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AbstractMethodError.html", usedFor: ["old subclass/new abstract API binary risk"], evidence: "runtime에 expected method implementation이 없는 binary incompatibility 상황의 linkage error 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["isolated expected-fail tasks", "explicit options"], evidence: "negative source를 production build와 분리해 in-process compile하는 API입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["diagnostic kind", "line", "OpenJDK code"], evidence: "expected compiler failure를 structured kind·line·code로 검사하는 API입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["GUID root/classes creation", "reverse cleanup", "artifact absence"], evidence: "negative compiler fixture artifacts를 OS temp direct child에 격리하고 삭제하는 API입니다." },
    { id: "java-uuid-api", repository: "Java SE 21 API", path: "java.util.UUID", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html", usedFor: ["collision-resistant temp child"], evidence: "검증 실행별 고유 temp direct-child 이름 생성 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 6,
    filesUsed: 6,
    uncoveredNotes: [
      "inventory direct sources Ex01_Abstract·Ex02_Dog·Ex03_Main·Ex07_Cale·Ex08_Cale 다섯 files와 Ex08/09의 실제 interactive execution companion Ex10_Main을 포함해 범위6으로 확정했습니다.",
      "class05 전체16과 범위6을 서로 다른 classes directories에 OpenJDK21.0.11 -encoding UTF-8 --release21 -proc:none -Xlint:all -XDrawDiagnostics로 compile했습니다.",
      "전체와 범위는 모두 exit0·captured compiler output7·auxiliary warning6이며 owners는 Ex03_Main4와 Ex10_Main2입니다. warning0으로 축약하지 않았습니다.",
      "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS는 audit process에서 저장·제거하고 finally에서 복원해 host launcher options와 pickup diagnostics를 package/scope/output 계약에서 격리했습니다.",
      "범위6의 runnable mains는 Ex03_Main·Ex10_Main 두 개이고 compile-only는 Ex01_Abstract·Ex02_Dog·Ex07_Cale·Ex08_Cale 네 개입니다.",
      "Ex03은 부모 클래스 생성자·dog sound·부모 constructor·cat sound·부모 constructor·cow sound 순서의 exact6행이며 공개에 부적절한 original fields는 복제하지 않았습니다.",
      "Ex10 add case는 menus2·operands1|1·result12.0, divzero는 menus2·result0.0·warning true, invalid는 operands1|1 뒤 result 없이 invalid true, exit는 menus1·operands0|0입니다.",
      "Ex10 네 cases는 ProcessStartInfo ArgumentList, redirected UTF-8 streams, fresh JVM, 10초 timeout/kill로 실행해 Scanner/static/mutable state를 격리했습니다.",
      "Ex01의 첫 주석 ‘하나 이상의 추상 method’는 바로 다음 ‘추상 method 없어도 abstract 가능’ 및 JLS와 충돌하므로 abstract methods0 example·reflection·negative direct-new로 교정했습니다.",
      "Ex02 source 한 파일의 concrete/abstract intermediates와 re-override progression은 obligation chain에 보존하고 auxiliary class file-layout warning의 원인도 연결했습니다.",
      "Ex07은 concrete operations5와 Div zero ArithmeticException throw를 source shape와 stateless return example로 검증했습니다. double remainder zero가 NaN인 별도 policy도 보충했습니다.",
      "Ex08은 abstract void methods4, mutable result, zero warning·result0·normal return을 source/process/example로 검증해 Ex07 throw와 같은 failure로 합치지 않았습니다.",
      "constructor hook hazard·anonymous class·strategy/composition·Template Method·reflection/API evolution은 원본이 충분히 설명하지 않는 범위라 JLS SE21과 Java SE21 APIs로 보충했습니다.",
      "negative compiler diagnostics는 portable JLS text가 아니라 OpenJDK21.0.11 regression contract로 표시하고 eight fixtures의 exactly-one-error·1-based line·code를 고정했습니다.",
      "모든 positive Java examples는 warning0과 exact output을, original audit는 expected warning6과 exact normalized/process outputs를 서로 다른 기준으로 검증합니다.",
      "OS temp GUID direct-child boundary, fixture별 explicit -d, reverse-order cleanup, post-delete assertion으로 저장소에 .class artifacts가 남지 않게 했습니다.",
      "실제 개인 literal·로컬 절대 경로·credential·generated anonymous class name은 공개 code/output/evidence에 포함하지 않고 synthetic values와 structural booleans만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
