import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-02-exception"],
  slug: "core-02-exception",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 22,
  title: "예외 계층과 try/catch 복구 경계",
  subtitle: "실패 type·발생 지점·복구 가능성을 분리하고, 좁은 catch·cause 보존·안전한 사용자 메시지·제한된 retry로 오류를 운영 가능한 계약으로 바꿉니다.",
  level: "중급",
  estimatedMinutes: 760,
  coreQuestion: "어떤 실패를 어느 계층이 실제로 복구할 수 있으며, 복구하지 못할 실패의 원인과 stack을 잃지 않고 사용자·운영자·호출자에게 어떻게 다르게 전달해야 할까요?",
  summary: "inventory direct3인 javastudy2 class08 Ex01_Exception·Ex03_Exception·Ex05_Exception을 읽고, package 전체 Ex01~Ex08 여덟 files도 OpenJDK21.0.11에서 감사했습니다. 여덟 files는 모두 독립 public main을 가지며 package8과 direct scope3 모두 exit0·compiler output0·warning0라 별도 companion/dependency는 필요하지 않습니다. Ex01은 배열0~4를 출력한 뒤 index5에서 ArrayIndexOutOfBoundsException으로 try가 abrupt completion되고 catch·후속 문장까지 총8행입니다. Ex03은 fresh JVM 입력5→0에서 정상 quotient 뒤 ArithmeticException catch로4행, 입력x에서 InputMismatchException catch로2행이며 try가 while 전체를 감싸 첫 오류 뒤 program이 끝납니다. Ex05는 broad Exception catch가 zero와 문자 입력을 각각 ArithmeticException/InputMismatchException으로 출력한 뒤 같은 ‘예외처리’로 끝내는3행씩입니다. package 경계도 숨기지 않습니다. empty working directory에서 Ex02는 FileNotFoundException을 RuntimeException cause로 감싸 exit1, Ex04는 정상5·zero·문자 recovery 뒤 EOF NoSuchElementException을 catch하지 못해 exit1, Ex06 zero는 finally marker를 포함3행, Ex07 문자 첫 글자는 NumberFormatException을 caller에서 처리해3행, Ex08 even→n은2행입니다. 이 원본 위에서 Throwable→Error/Exception→RuntimeException 계층, checked/unchecked 기준, try 중단과 first assignable catch, child-before-parent와 unreachable catch, multi-catch 제약, input/range/arithmetic/null failure matrix, catch-ignore·broad catch·normal-flow exception 오용, stack/cause 읽기, 사용자 메시지와 개발자 진단 분리, exception translation과 cause preservation, retry의 transient/idempotent/deadline 경계, negative compiler contracts까지 확장합니다.",
  objectives: [
    "Throwable·Error·Exception·RuntimeException 계층에서 checked와 unchecked를 compiler 의무와 복구 가능성으로 구분한다.",
    "try가 예외 지점에서 abrupt completion되고 source order상 첫 assignable catch만 실행됨을 trace로 설명한다.",
    "구체 catch를 상위 catch보다 먼저 두고, related alternatives가 아닌 경우에만 multi-catch를 사용한다.",
    "Scanner 입력·배열 범위·정수0 나눗셈·null dereference를 서로 다른 예외 type과 token/state 영향으로 진단한다.",
    "catch-and-ignore·과도한 Exception/Throwable catch·예외를 정상 분기로 쓰는 anti-pattern을 명시 outcome과 validation으로 교정한다.",
    "stack trace와 cause chain을 보존하면서 사용자에게는 안전한 메시지, 개발자에게는 correlation/context/type/frame을 분리 제공한다.",
    "계층 경계에서 domain exception으로 translate하고 transient·idempotent 실패만 attempt/deadline 제한 아래 retry한다.",
  ],
  prerequisites: [{ title: "Scanner 입력과 if 분기", reason: "Ex03·Ex05는 Scanner token parsing과 integer division을 try 안에서 수행하므로 입력 cursor와 정상 조건 분기를 먼저 이해해야 catch가 state를 어떻게 바꾸는지 추적할 수 있습니다.", sessionSlug: "java-05-scanner-if" }],
  keywords: ["Throwable", "Error", "Exception", "RuntimeException", "checked exception", "unchecked exception", "try", "catch", "abrupt completion", "handler selection", "catch ordering", "unreachable catch", "multi-catch", "InputMismatchException", "ArrayIndexOutOfBoundsException", "ArithmeticException", "NullPointerException", "stack trace", "cause chain", "exception translation", "safe user message", "retry", "idempotency", "catch-and-ignore"],
  chapters: [
    {
      id: "class08-eight-main-golden-audit",
      title: "class08 전체8과 direct3을 warning0로 compile하고 정상·복구·uncaught paths를 fresh JVM으로 감사합니다",
      lead: "성공 exit만 세지 않고 stdout·stderr·입력 소비·cause chain·EOF 종료까지 case별 독립 process contract로 고정합니다.",
      explanations: [
        "class08에는 Ex01부터 Ex08까지 Java files8개가 있고 모두 public static void main을 가집니다. direct inventory Ex01·Ex03·Ex05도 각자 필요한 imports 외 source dependency가 없어 scope3은 main3·compile-only0입니다.",
        "package8과 scope3은 서로 다른 -d directories에서 -encoding UTF-8 --release21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics로 compile하며 둘 다 exit0·captured compiler output0입니다. warning을 기대값에서 버리지 않고 정말0인지 assert합니다.",
        "Ex01의 for condition i<=5는 length5 array의 합법 index0~4 다음 index5를 시도합니다. assignment가 throw해 그 iteration의 println은 실행되지 않고 catch가 exception toString과 marker를 출력한 뒤 try/catch 밖 감사 문장이 실행됩니다.",
        "Ex03은 while(true)가 try 내부에 있어 5 입력은 quotient5를 출력하고 다음0에서 ArithmeticException catch로 이동한 뒤 loop로 돌아가지 않습니다. x 입력은 Scanner.nextInt의 InputMismatchException을 별도 catch가 처리합니다.",
        "Ex05는 두 실패 모두 Exception catch 하나가 잡습니다. runtime type을 println(e)로 노출하지만 사용자 복구 안내가 구체적이지 않고 invalid token을 소비하거나 retry하지도 않습니다. 원본 behavior와 개선안을 분리합니다.",
        "Ex02는 audit temp working directory에 a.txt가 없음을 확인한 뒤 실행합니다. FileNotFoundException을 catch해 RuntimeException(cause)로 다시 던지므로 exit1이며 stderr에는 outer RuntimeException frame과 Caused by FileNotFoundException source frame이 모두 있어야 합니다.",
        "Ex04는 outer while로 zero·문자 뒤 retry하지만 EOF NoSuchElementException은 두 catch 어느 것에도 속하지 않아 exit1입니다. 입력5→0→x 뒤 stdout7행과 stderr exception type/frame을 검증해 무한 입력 프로그램을 timeout으로만 자르지 않습니다.",
        "Ex06 zero, Ex07 x, Ex08 2→n은 다음 세션 finally·throws 영역의 package smoke입니다. 각각3·3·2행 exact와 exit0을 확인하되 이 세션에서는 구조를 미리 깊게 가르치지 않고 package 실행 가능성 evidence로만 사용합니다.",
        "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS는 audit process에서 저장·제거하고 모든 ProcessStartInfo child environment에서도 제거한 뒤 finally에서 원값을 복원합니다. 공백 포함 OS temp direct child, 10초 runtime timeout, process-tree kill 뒤 5초 termination grace, read-task 회수와 cleanup 경계도 함께 검증합니다.",
      ],
      concepts: [
        { term: "normal exit", definition: "main이 정상 return해 process exit code0이고 uncaught Throwable이 stderr를 통해 launcher까지 빠져나오지 않은 경로입니다.", detail: ["catch가 있었다는 뜻과 같지 않습니다.", "stdout contract와 함께 봅니다."] },
        { term: "uncaught exception exit", definition: "어떤 handler도 처리하지 않은 exception이 main thread 밖으로 전파되어 stack trace와 nonzero process exit를 만드는 경로입니다.", detail: ["Ex02·Ex04 감사가 예입니다.", "stderr cause chain을 보존합니다."] },
        { term: "input process contract", definition: "stdin token sequence, stdout/stderr, exit, timeout을 fresh JVM 단위로 고정한 interactive program 검증입니다.", detail: ["Scanner cursor를 case마다 초기화합니다.", "EOF도 명시 input event입니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core02-audit",
        title: "package8·scope3과 direct/companion ten process cases를 감사합니다",
        language: "powershell",
        filename: "verify-original-core02.ps1",
        purpose: "원본 예외 흐름을 warning·input·stdout·stderr·cause·exit까지 공백 temp에서 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core02 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
$launcherNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedLauncher = @{}
foreach ($name in $launcherNames) {
  if (Test-Path "Env:$name") { $savedLauncher[$name] = (Get-Item "Env:$name").Value; Remove-Item "Env:$name" -ErrorAction Stop }
}
try {
  $lf = [string][char]10
  $crlf = [string][char]13 + [char]10
  $source = "src\com\java\class08"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scopeNames = @("Ex01_Exception.java", "Ex03_Exception.java", "Ex05_Exception.java")
  $scope = @($scopeNames | ForEach-Object { Join-Path $source $_ })
  $packageOut = Join-Path $root "package classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $packageOut, $scopeOut -ErrorAction Stop | Out-Null

  $packageCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
  $packageExit = $LASTEXITCODE
  $scopeCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $scopeOut $scope 2>&1)
  $scopeExit = $LASTEXITCODE
  if ($all.Count -ne 8 -or $packageExit -ne 0 -or $packageCompiler.Count -ne 0) { throw "package compile drift" }
  if ($scope.Count -ne 3 -or $scopeExit -ne 0 -or $scopeCompiler.Count -ne 0) { throw "scope compile drift" }
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $scopeMains = @($scope | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  if ($packageMains -ne 8 -or $scopeMains -ne 3) { throw "main role drift" }

  function Invoke-Java([string]$classes, [string]$main, [string]$stdin = "") {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = (Get-Command java -ErrorAction Stop).Source
    foreach ($arg in @("-Dfile.encoding=UTF-8", "-cp", $classes, $main)) { [void]$start.ArgumentList.Add($arg) }
    $start.WorkingDirectory = $root
    $start.UseShellExecute = $false
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardOutputEncoding = [Text.UTF8Encoding]::new($false)
    $start.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
    foreach ($name in $launcherNames) { [void]$start.Environment.Remove($name) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    try {
      if (-not $process.Start()) { throw "process start failed" }
      $stdoutTask = $process.StandardOutput.ReadToEndAsync()
      $stderrTask = $process.StandardError.ReadToEndAsync()
      $process.StandardInput.Write($stdin)
      $process.StandardInput.Close()
      if (-not $process.WaitForExit(10000)) {
        $process.Kill($true)
        if (-not $process.WaitForExit(5000)) { throw "java process did not stop after kill" }
        [void]$stdoutTask.GetAwaiter().GetResult(); [void]$stderrTask.GetAwaiter().GetResult()
        throw "java process timeout"
      }
      [pscustomobject]@{
        Exit = $process.ExitCode
        Out = $stdoutTask.GetAwaiter().GetResult().Replace($crlf, $lf)
        Err = $stderrTask.GetAwaiter().GetResult().Replace($crlf, $lf)
      }
    } finally { $process.Dispose() }
  }

  $ex01 = Invoke-Java $scopeOut "com.java.class08.Ex01_Exception"
  $ex03Zero = Invoke-Java $scopeOut "com.java.class08.Ex03_Exception" ("5" + $lf + "0" + $lf)
  $ex03Text = Invoke-Java $scopeOut "com.java.class08.Ex03_Exception" ("x" + $lf)
  $ex05Zero = Invoke-Java $scopeOut "com.java.class08.Ex05_Exception" ("0" + $lf)
  $ex05Text = Invoke-Java $scopeOut "com.java.class08.Ex05_Exception" ("x" + $lf)
  if (Test-Path -LiteralPath (Join-Path $root "a.txt")) { throw "unexpected a.txt" }
  $ex02 = Invoke-Java $packageOut "com.java.class08.Ex02_Exception"
  $ex04 = Invoke-Java $packageOut "com.java.class08.Ex04_Exception" ("5" + $lf + "0" + $lf + "x" + $lf)
  $ex06 = Invoke-Java $packageOut "com.java.class08.Ex06_Exception" ("0" + $lf)
  $ex07 = Invoke-Java $packageOut "com.java.class08.Ex07_Exception" ("x" + $lf)
  $ex08 = Invoke-Java $packageOut "com.java.class08.Ex08_Exception" ("2" + $lf + "n" + $lf)

  $ex01Lines = @($ex01.Out.TrimEnd([char]10).Split([char]10))
  if ($ex01.Exit -ne 0 -or $ex01.Err.Length -ne 0 -or $ex01Lines.Count -ne 8 -or
      (Compare-Object @($ex01Lines[0..4]) @("0", "1", "2", "3", "4") -SyncWindow 0).Count -ne 0 -or
      $ex01Lines[5] -notmatch '^java\.lang\.ArrayIndexOutOfBoundsException:' -or
      $ex01Lines[6] -cne "예외처리부분" -or $ex01Lines[7] -cne "수고하셨습니다.") { throw "Ex01 drift" }
  $expected03Zero = "정수 입력 : " + $lf + "정답 : 5" + $lf + "정수 입력 : " + $lf + "0으로는 나눌 수 없습니다." + $lf
  $expected03Text = "정수 입력 : " + $lf + "문자가 입력되었습니다. 숫자를 입력하세요." + $lf
  $expected05Zero = "정수 입력 : " + $lf + "java.lang.ArithmeticException: / by zero" + $lf + "예외처리" + $lf
  $expected05Text = "정수 입력 : " + $lf + "java.util.InputMismatchException" + $lf + "예외처리" + $lf
  if ($ex03Zero.Exit -ne 0 -or $ex03Zero.Err.Length -ne 0 -or $ex03Zero.Out -cne $expected03Zero) { throw "Ex03 zero drift" }
  if ($ex03Text.Exit -ne 0 -or $ex03Text.Err.Length -ne 0 -or $ex03Text.Out -cne $expected03Text) { throw "Ex03 text drift" }
  if ($ex05Zero.Exit -ne 0 -or $ex05Zero.Err.Length -ne 0 -or $ex05Zero.Out -cne $expected05Zero) { throw "Ex05 zero drift" }
  if ($ex05Text.Exit -ne 0 -or $ex05Text.Err.Length -ne 0 -or $ex05Text.Out -cne $expected05Text) { throw "Ex05 text drift" }

  $ex02Cause = $ex02.Err.Contains("java.lang.RuntimeException: java.io.FileNotFoundException") -and $ex02.Err.Contains("Caused by: java.io.FileNotFoundException") -and $ex02.Err.Contains("Ex02_Exception.java:13") -and $ex02.Err.Contains("Ex02_Exception.java:11")
  if ($ex02.Exit -ne 1 -or $ex02.Out.Length -ne 0 -or -not $ex02Cause) { throw "Ex02 failure drift" }
  $expected04 = "정수 입력 : " + $lf + "정답 : 5" + $lf + "정수 입력 : " + $lf + "0으로는 나눌 수 없습니다." + $lf + "정수 입력 : " + $lf + "문자가 입력되었습니다. 숫자를 입력하세요." + $lf + "정수 입력 : " + $lf
  if ($ex04.Exit -ne 1 -or $ex04.Out -cne $expected04 -or -not $ex04.Err.Contains("java.util.NoSuchElementException") -or -not $ex04.Err.Contains("Ex04_Exception.java:25")) { throw "Ex04 EOF drift" }
  $expected06 = "정수 입력 : " + $lf + "0으로는 나눌 수 없습니다." + $lf + "반드시 실행되어야 하는 문장" + $lf
  $expected07 = "정수 입력 : prnData 메서드 안" + $lf + "제대로 입력하세요." + $lf + "수고하셨습니다." + $lf
  $expected08 = "숫자 입력: 2는 짝수입니다." + $lf + "계속할까요?(y/n) >> 수고하셨습니다." + $lf
  if ($ex06.Exit -ne 0 -or $ex06.Out -cne $expected06 -or $ex06.Err.Length -ne 0) { throw "Ex06 drift" }
  if ($ex07.Exit -ne 0 -or $ex07.Out -cne $expected07 -or $ex07.Err.Length -ne 0) { throw "Ex07 drift" }
  if ($ex08.Exit -ne 0 -or $ex08.Out -cne $expected08 -or $ex08.Err.Length -ne 0) { throw "Ex08 drift" }

  $ex01Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex01_Exception.java")
  $ex03Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex03_Exception.java")
  $ex05Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex05_Exception.java")
  $ex01ArrayCatches = [regex]::Matches($ex01Source, 'catch\s*\(\s*ArrayIndexOutOfBoundsException').Count
  $ex03SpecificCatches = [regex]::Matches($ex03Source, 'catch\s*\(\s*(ArithmeticException|InputMismatchException)').Count
  $ex05BroadCatches = [regex]::Matches($ex05Source, 'catch\s*\(\s*Exception').Count
  if ($ex01ArrayCatches -ne 1 -or $ex03SpecificCatches -ne 2 -or $ex05BroadCatches -ne 1) { throw "direct source shape drift" }

  "spacePath=$($root.Contains(' ')),package=8|exit:$packageExit|compilerLines:$($packageCompiler.Count)|mains:$packageMains,scope=3|exit:$scopeExit|compilerLines:$($scopeCompiler.Count)|mains:$scopeMains"
  "direct=Ex01:8|indexType:True|continued:True;Ex03-zero:4|text:2;Ex05-zero:3|text:3"
  "packageCompanions=Ex02:exit1|cause:True;Ex04:exit1|sequence7|eof:True;Ex06-zero:3;Ex07-invalid:3;Ex08-even-stop:2"
  "shapes=Ex01ArrayCatch:$ex01ArrayCatches|Ex03SpecificCatches:$ex03SpecificCatches|Ex05BroadCatch:$ex05BroadCatches|launcherOptions:$($launcherNames.Count)"
} finally {
  foreach ($name in $launcherNames) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
  foreach ($entry in $savedLauncher.GetEnumerator()) { Set-Item "Env:$($entry.Key)" $entry.Value }
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-19", explanation: "공백 temp direct child, 네 launcher options 저장·제거, class08 package8/scope3와 두 output directories를 준비합니다." },
          { lines: "21-30", explanation: "package와 scope warning0 compile 및 all-main role counts8|3을 assert합니다." },
          { lines: "32-64", explanation: "child environment·working directory·UTF-8 async streams·stdin close, 10초 timeout, process-tree kill, 5초 termination grace, task 회수와 finally Dispose를 가진 fresh JVM helper를 정의합니다." },
          { lines: "66-76", explanation: "direct five cases와 package companion five cases를 독립 process로 실행합니다." },
          { lines: "78-90", explanation: "Ex01 normalized8과 Ex03/Ex05 exact outputs를 검사합니다." },
          { lines: "92-101", explanation: "Ex02 cause chain, Ex04 EOF failure, Ex06/07/08 exact output을 검증합니다." },
          { lines: "103-122", explanation: "direct catch shapes와 stable summary를 출력하고 launcher environment 복원·temp boundary cleanup을 수행합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root", "four Java launcher option variables isolated and restored", "10-second runtime timeout plus 5-second termination grace per Java child"], command: "pwsh -NoProfile -File verify-original-core02.ps1" },
        output: { value: "spacePath=True,package=8|exit:0|compilerLines:0|mains:8,scope=3|exit:0|compilerLines:0|mains:3\ndirect=Ex01:8|indexType:True|continued:True;Ex03-zero:4|text:2;Ex05-zero:3|text:3\npackageCompanions=Ex02:exit1|cause:True;Ex04:exit1|sequence7|eof:True;Ex06-zero:3;Ex07-invalid:3;Ex08-even-stop:2\nshapes=Ex01ArrayCatch:1|Ex03SpecificCatches:2|Ex05BroadCatch:1|launcherOptions:4", explanation: ["package와 direct scope 모두 warning0이고 모든 sources가 main입니다.", "direct3은 array·arithmetic·input·broad catch 원본 behavior를 exact/normalized로 보존합니다.", "Ex02 cause와 Ex04 EOF uncaught failure를 exit1로 숨기지 않습니다.", "core03 files는 package smoke exact만 제공해 세션 경계를 지킵니다."] },
        experiments: [
          { change: "Ex03 입력을 5→0→5로 보내려 합니다.", prediction: "0 catch 뒤 main이 끝나 마지막5는 소비되지 않습니다.", result: "while이 try 안에 있어 handler 뒤 loop로 복귀하지 않습니다." },
          { change: "Ex05 catch(Exception)를 빈 body로 바꿉니다.", prediction: "exit0이지만 실패 type·user feedback·diagnostic evidence가 모두 사라집니다.", result: "정상 exit code만으로 catch correctness를 판단할 수 없습니다." },
          { change: "Ex02 working directory에 a.txt를 만듭니다.", prediction: "failure/cause contract가 실행되지 않고 FileInputStream은 close되지 않은 채 main이 끝납니다.", result: "fixture precondition과 resource ownership은 별도 검증이 필요합니다." },
        ],
        sourceRefs: ["java-class08-ex01", "java-class08-ex02", "java-class08-ex03", "java-class08-ex04", "java-class08-ex05", "java-class08-ex06", "java-class08-ex07", "java-class08-ex08", "jdk21-javac", "dotnet-process-start-info", "powershell-environment-variables", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "class08가 compile되니 모든 mains가 정상 종료한다고 보고했다.", likelyCause: "compile exit와 runtime process exit를 같은 단계로 합쳤습니다.", checks: ["각 public main을 fresh JVM으로 실행합니다.", "stdout/stderr/exit를 분리합니다.", "Ex02 empty working-directory와 Ex04 EOF case를 확인합니다."], fix: "compile warning0와 runtime exit0/1 case matrix를 별도 evidence로 기록합니다.", prevention: "runnable source inventory마다 최소 success/failure process contract를 둡니다." },
        { symptom: "interactive 감사가 멈추거나 이전 case token을 읽는다.", likelyCause: "한 JVM/Scanner에 unrelated cases를 이어 넣거나 완결되지 않은 stdin을 보냈습니다.", checks: ["case별 process인지 봅니다.", "stdin close와 EOF policy를 확인합니다.", "timeout/kill 후 streams를 회수하는지 봅니다."], fix: "fresh JVM, 완결 input, closed stdin, timeout을 사용하고 EOF failure도 명시 assert합니다.", prevention: "prompt-token-state 표를 test fixture 옆에 둡니다." },
      ],
      expertNotes: ["process exit0은 복구됐다는 뜻일 수 있지만 broad catch가 실패를 숨긴 것일 수도 있어 domain outcome과 diagnostics를 함께 봅니다.", "stack trace source line을 assert하려면 compile debug info option을 명시하고 toolchain/source version과 함께 pin해야 합니다."],
    },
    {
      id: "throwable-hierarchy-checked-unchecked-error",
      title: "Throwable 계층에서 checked 의무와 실제 복구 정책을 서로 다른 질문으로 구분합니다",
      lead: "compiler가 catch-or-declare를 요구하는지와 현재 layer가 안전하게 복구할 수 있는지는 같은 분류가 아닙니다.",
      explanations: [
        "모든 throw 가능한 object의 root는 Throwable입니다. Java 표준 API 계층의 핵심 직접 두 갈래는 Error와 Exception이고 RuntimeException은 Exception의 subclass입니다. 언어상 DirectChecked처럼 Throwable을 직접 상속한 다른 checked type도 가능하지만 일반 application API는 보통 Exception 계열로 실패를 표현합니다.",
        "checked exception은 RuntimeException 계열과 Error 계열이 아닌 Throwable 계열입니다. compiler가 호출 지점에 catch 또는 throws를 요구합니다. IOException·SQLException이 대표이며 ‘반드시 복구 가능’이라는 뜻은 아닙니다.",
        "RuntimeException과 그 subclasses는 unchecked입니다. NumberFormatException, InputMismatchException, ArithmeticException, IndexOutOfBoundsException, NullPointerException이 원본/보충 examples에 나타납니다. compiler가 강제하지 않아도 public contract와 tests는 필요합니다.",
        "Error와 subclasses도 unchecked지만 일반 business catch 대상이 아닙니다. OutOfMemoryError, StackOverflowError, linkage errors는 runtime/environment/invariant 붕괴를 나타낼 수 있어 catch해 정상 처리인 척 계속하면 더 큰 손상을 만들 수 있습니다.",
        "catch(Exception)는 RuntimeException과 Exception 계열 checked types를 잡지만 Error나 Exception을 거치지 않는 custom Throwable은 잡지 않습니다. catch(Throwable)는 이들까지 모두 잡으므로 top-level logging/cleanup 같은 매우 제한된 boundary 외에는 피합니다.",
        "checked/unchecked 선택은 caller 복구 기대, API boundary, abstraction leakage, versioning 비용을 함께 봅니다. 외부 파일 부재처럼 caller가 대안을 선택할 수 있으면 checked/domain result가 유용할 수 있고 programming invariant 위반은 unchecked가 자연스럽습니다.",
        "unchecked라고 무시해도 되는 것은 아닙니다. null/range/format preconditions를 문서화하고 잘못된 user input은 boundary에서 validation result로 바꾸며 내부 bug는 stack/cause를 보존해 실패시킵니다.",
      ],
      concepts: [
        { term: "checked exception", definition: "RuntimeException 계열과 Error 계열이 아닌 Throwable subclass로 compile-time exception checking 대상인 type입니다.", detail: ["catch 또는 throws가 필요합니다.", "Exception을 직접 상속하지 않은 custom Throwable도 이 분류에 들어갑니다.", "복구 가능성 자체를 보장하지 않습니다."] },
        { term: "unchecked exception", definition: "RuntimeException 또는 Error 계열이라 compiler의 catch-or-declare 강제 대상이 아닌 throwable입니다.", detail: ["public failure contract는 여전히 필요합니다.", "Error를 business 실패로 잡지 않습니다."] },
        { term: "recovery capability", definition: "현재 layer가 실패 뒤 invariant를 지키며 대체·재입력·rollback·retry 같은 의미 있는 다음 행동을 할 수 있는 능력입니다.", detail: ["type 분류와 별도 판단입니다.", "복구 불가하면 context를 보존해 전파합니다."] },
      ],
      codeExamples: [{
        id: "java-throwable-classification",
        title: "Class hierarchy로 checked/unchecked/Error를 분류합니다",
        language: "java",
        filename: "ThrowableClassification.java",
        purpose: "message 문구가 아니라 assignability로 compiler classification의 뼈대를 확인합니다.",
        code: String.raw`import java.io.IOException;

public class ThrowableClassification {
    static final class DirectChecked extends Throwable {
        private static final long serialVersionUID = 1L;
    }

    static boolean isChecked(Class<? extends Throwable> type) {
        return !RuntimeException.class.isAssignableFrom(type)
                && !Error.class.isAssignableFrom(type);
    }

    public static void main(String[] args) {
        System.out.println("IOException.checked=" + isChecked(IOException.class));
        System.out.println("IllegalArgument.checked=" + isChecked(IllegalArgumentException.class));
        System.out.println("DirectThrowable.checked=" + isChecked(DirectChecked.class));
        System.out.println("Error.checked=" + isChecked(AssertionError.class));
        System.out.println("ExceptionCatchesRuntime=" + Exception.class.isAssignableFrom(ArithmeticException.class));
        System.out.println("ExceptionCatchesError=" + Exception.class.isAssignableFrom(AssertionError.class));
        System.out.println("ThrowableRoot=" + Throwable.class.isAssignableFrom(AssertionError.class));
    }
}`,
        walkthrough: [
          { lines: "1-11", explanation: "입력 bound를 Throwable로 제한하고 RuntimeException·Error 두 unchecked branches를 제외합니다. Exception을 거치지 않는 DirectChecked도 serial contract와 함께 경계를 증명합니다." },
          { lines: "13-22", explanation: "checked IOException/direct Throwable, unchecked runtime/error, Exception/Throwable catch surface를 boolean으로 고정합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ThrowableClassification.java", "ThrowableClassification") },
        output: { value: "IOException.checked=true\nIllegalArgument.checked=false\nDirectThrowable.checked=true\nError.checked=false\nExceptionCatchesRuntime=true\nExceptionCatchesError=false\nThrowableRoot=true", explanation: ["IOException과 Exception을 직접 상속하지 않은 DirectChecked가 checked predicate true입니다.", "RuntimeException과 Error branches만 unchecked이며 Exception catch는 ArithmeticException을 잡지만 AssertionError는 잡지 않습니다.", "Throwable catch surface는 Error까지 포함합니다."] },
        experiments: [
          { change: "isChecked에서 Error 제외 조건을 제거하고 !RuntimeException 하나만 남깁니다.", prediction: "AssertionError도 checked=true로 잘못 분류됩니다.", result: "Throwable-bound predicate는 RuntimeException과 Error 두 unchecked branches를 모두 제외해야 합니다." },
          { change: "main 전체를 catch(Throwable)로 감쌉니다.", prediction: "Error까지 잡을 수 있지만 안전한 recovery가 자동 생기지 않습니다.", result: "catch surface와 recovery policy를 분리해야 합니다." },
        ],
        sourceRefs: ["jls-exception-hierarchy", "jls-compile-time-checking", "java-throwable-api", "java-error-api", "java-runtime-exception-api", "java-io-exception-api"],
      }],
      diagnostics: [
        { symptom: "unchecked라서 문서·test가 필요 없다고 판단했다.", likelyCause: "compiler 의무 부재를 failure contract 부재로 오해했습니다.", checks: ["public preconditions를 찾습니다.", "어떤 RuntimeException이 가능한지 봅니다.", "boundary에서 user input과 bug를 구분합니다."], fix: "unchecked failures도 type·condition·state effect를 문서화하고 validation/negative tests를 둡니다.", prevention: "API review 표에 checked 여부와 recovery owner를 별도 columns로 둡니다." },
        { symptom: "catch(Exception)가 OutOfMemoryError까지 처리할 것으로 기대했다.", likelyCause: "Error와 Exception이 Throwable 아래 sibling이라는 계층을 놓쳤습니다.", checks: ["assignability를 확인합니다.", "catch type이 Throwable인지 Exception인지 봅니다.", "Error 뒤 계속 실행이 안전한지 검토합니다."], fix: "Error를 business recovery 대상에서 제외하고 top-level diagnostics/termination policy를 둡니다.", prevention: "Throwable hierarchy diagram과 catch surface tests를 유지합니다." },
      ],
      expertNotes: ["checked exception이 지나치게 낮은 implementation detail을 노출하면 boundary에서 domain exception/result로 번역하되 cause를 보존합니다.", "InterruptedException은 checked이면서 thread cancellation protocol의 일부라 무심코 삼키지 않고 interrupt status 복원/전파 정책이 필요합니다."],
    },
    {
      id: "try-abrupt-completion-and-failure-matrix",
      title: "예외가 발생한 expression부터 try의 나머지는 건너뛰고 control이 matching handler로 이동합니다",
      lead: "‘try 안 모든 줄을 실행한 뒤 catch’가 아니라 evaluation 중 abrupt completion이라는 정확한 control-flow를 trace합니다.",
      explanations: [
        "try block은 위에서 아래로 정상 실행되다가 expression evaluation, method invocation, explicit throw 중 exception이 발생하면 그 statement가 정상 완료되지 않습니다. 그 아래 statements는 실행되지 않고 handler search가 시작됩니다.",
        "Ex01에서 arr[5]=5 assignment가 먼저 array bounds check를 수행하다 실패하므로 같은 loop body의 println(arr[5])도 실행되지 않습니다. catch 뒤 try/catch 밖 문장은 handler가 정상 완료하면 계속 실행됩니다.",
        "handler는 thrown object가 catch parameter type에 assignment-compatible한지 source order로 검사해 첫 match 하나만 실행합니다. catch를 실행한 뒤 다음 sibling catch로 흐르지 않습니다.",
        "InputMismatchException은 Scanner token type mismatch, NumberFormatException은 String conversion failure입니다. 둘 다 input 문제지만 token cursor·API·복구 방법이 달라 type만 합쳐 말하지 않습니다.",
        "배열 index는0<=index<length 조건을 어기면 ArrayIndexOutOfBoundsException, integer division divisor0은 ArithmeticException, null receiver instance access는 NullPointerException입니다. 실패 전에 생긴 side effect는 자동 rollback되지 않습니다.",
        "floating-point division by0.0은 ArithmeticException이 아니라 IEEE754 Infinity 또는 NaN을 만듭니다. integer zero guard를 double 연산에 그대로 적용하려면 domain finite policy를 별도로 정의해야 합니다.",
        "try 범위가 너무 넓으면 같은 exception type이 여러 statements에서 발생해 어느 operation 실패인지 handler가 구분하기 어렵습니다. 복구 단위에 맞게 try를 좁히고 실패할 수 있는 operation 전후 state를 명시합니다.",
      ],
      concepts: [
        { term: "abrupt completion", definition: "statement/expression이 정상 값이나 다음 control point로 완료되지 않고 exception 등으로 흐름을 중단하는 상태입니다.", detail: ["나머지 try statements를 건너뜁니다.", "이미 일어난 side effect는 자동 취소되지 않습니다."] },
        { term: "handler search", definition: "thrown type과 assignment-compatible한 첫 catch parameter를 source order로 찾는 과정입니다.", detail: ["하나의 catch만 실행합니다.", "없으면 enclosing invocation으로 전파됩니다."] },
        { term: "failure point", definition: "실제로 exception object가 생성/throw되어 정상 evaluation이 중단된 expression 또는 invocation입니다.", detail: ["stack trace top application frame과 연결합니다.", "try 전체가 failure point는 아닙니다."] },
      ],
      codeExamples: [
        {
          id: "java-try-abrupt-flow",
          title: "range failure 뒤 try marker가 skip되고 catch 뒤에는 계속됩니다",
          language: "java",
          filename: "TryAbruptFlow.java",
          purpose: "예외 지점 전·후 markers로 abrupt completion과 recovery continuation을 증명합니다.",
          code: String.raw`public class TryAbruptFlow {
    public static void main(String[] args) {
        int[] values = {7};
        System.out.println("before-try");
        try {
            System.out.println("first=" + values[0]);
            System.out.println("second=" + values[1]);
            System.out.println("unreachable-marker");
        } catch (ArrayIndexOutOfBoundsException exception) {
            System.out.println("caught=" + exception.getClass().getSimpleName());
        }
        System.out.println("after-catch");
    }
}`,
          walkthrough: [
            { lines: "1-4", explanation: "length1 array와 try 전 marker를 준비합니다." },
            { lines: "5-8", explanation: "index0 출력 뒤 index1 expression이 throw해 second line 자체와 다음 marker가 완료되지 않습니다." },
            { lines: "9-12", explanation: "구체 catch가 stable type name을 출력하고 outer flow가 계속됩니다." },
          ],
          run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("TryAbruptFlow.java", "TryAbruptFlow") },
          output: { value: "before-try\nfirst=7\ncaught=ArrayIndexOutOfBoundsException\nafter-catch", explanation: ["second와 unreachable-marker는 output에 없습니다.", "handler가 정상 완료해 after-catch는 실행됩니다."] },
          experiments: [
            { change: "catch type을 NullPointerException으로 바꿉니다.", prediction: "handler가 match하지 않아 uncaught stack trace와 nonzero exit가 됩니다.", result: "catch 존재보다 assignment-compatible type이 중요합니다." },
            { change: "values[1] 앞에 counter++ side effect를 둡니다.", prediction: "bounds failure 뒤에도 이미 증가한 counter는 유지됩니다.", result: "catch는 transaction rollback이 아닙니다." },
          ],
          sourceRefs: ["java-class08-ex01", "jls-abrupt-completion", "jls-try-statement", "java-array-index-api"],
        },
        {
          id: "java-runtime-failure-matrix",
          title: "input·range·integer arithmetic·null과 floating zero를 type별로 비교합니다",
          language: "java",
          filename: "RuntimeFailureMatrix.java",
          purpose: "흔한 RuntimeException 네 종류와 exception이 아닌 floating Infinity를 안정된 type output으로 구분합니다.",
          code: String.raw`public class RuntimeFailureMatrix {
    interface Action { void run(); }

    static void classify(String label, Action action) {
        try {
            action.run();
            System.out.println(label + "=ok");
        } catch (RuntimeException exception) {
            System.out.println(label + "=" + exception.getClass().getSimpleName());
        }
    }

    public static void main(String[] args) {
        int zero = 0;
        classify("input", () -> Integer.parseInt("x"));
        classify("range", () -> { int[] values = {1}; System.out.println(values[1]); });
        classify("arithmetic", () -> System.out.println(25 / zero));
        classify("null", () -> { String value = null; System.out.println(value.length()); });
        System.out.println("floating=" + (25.0 / 0.0));
    }
}`,
          walkthrough: [
            { lines: "1-10", explanation: "작은 Action boundary가 runtime type simple name만 정규화하고 success/failure를 출력합니다." },
            { lines: "13-18", explanation: "String parse, array index, integer division, null receiver를 서로 다른 fixtures로 실행합니다." },
            { lines: "19-19", explanation: "double zero division은 throw하지 않고 Infinity 값을 만듭니다." },
          ],
          run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("RuntimeFailureMatrix.java", "RuntimeFailureMatrix") },
          output: { value: "input=NumberFormatException\nrange=ArrayIndexOutOfBoundsException\narithmetic=ArithmeticException\nnull=NullPointerException\nfloating=Infinity", explanation: ["네 runtime failures는 서로 다른 types입니다.", "floating zero는 exception channel이 아니라 non-finite value channel입니다."] },
          experiments: [
            { change: "25/zero를25.0/zero로 바꿉니다.", prediction: "arithmetic case가 ok와 Infinity를 출력해 기존 exception expectation이 깨집니다.", result: "operand numeric type이 zero semantics를 바꿉니다." },
            { change: "classify가 catch(Exception) 대신 catch(Throwable)을 사용합니다.", prediction: "Error까지 failure matrix에 흡수할 수 있습니다.", result: "교육 helper라도 복구 대상 catch surface를 불필요하게 넓히지 않습니다." },
          ],
          sourceRefs: ["java-class08-ex01", "java-class08-ex03", "java-class08-ex05", "java-number-format-api", "java-input-mismatch-api", "java-arithmetic-api", "java-null-pointer-api", "jls-multiplicative-operators"],
        },
      ],
      diagnostics: [
        { symptom: "예외 line 뒤 marker도 출력될 것으로 예상했다.", likelyCause: "exception을 단순 status flag처럼 보고 abrupt completion을 놓쳤습니다.", checks: ["argument/array access evaluation 순서를 봅니다.", "failure 전후 markers를 둡니다.", "catch 뒤 outer marker와 구분합니다."], fix: "exception 발생 statement부터 try 나머지가 skip된다는 control-flow로 다시 그립니다.", prevention: "예외 trace 문제는 before/failure/unreachable/catch/after 다섯 points로 예측합니다." },
        { symptom: "double0 나눗셈 catch가 실행되지 않는다.", likelyCause: "integer division과 IEEE754 floating division을 같은 arithmetic contract로 가정했습니다.", checks: ["operand compile-time types를 확인합니다.", "Double.isFinite/NaN/Infinity를 검사합니다.", "domain이 non-finite를 허용하는지 봅니다."], fix: "floating result를 명시 validation하고 domain failure result/exception으로 변환합니다.", prevention: "numeric policy table에 integer/floating zero·overflow·NaN을 분리합니다." },
      ],
      expertNotes: ["helpful NullPointerException message는 진단에 유용하지만 JDK/표현식에 따라 달라질 수 있어 parser contract로 사용하지 않습니다.", "exception object 생성과 stack trace 채우기는 비용이 있으므로 예상 가능한 정상 분기 hot path에 예외를 쓰지 않습니다."],
    },
    {
      id: "catch-ordering-first-match-and-multicatch",
      title: "catch는 child부터 parent 순서로 두고 동일 복구 정책의 unrelated types만 multi-catch로 묶습니다",
      lead: "source order의 첫 assignable handler라는 규칙이 unreachable catch와 handler precision을 결정합니다.",
      explanations: [
        "하나의 try 뒤 catch clauses는 source order로 검사됩니다. thrown object가 parameter type에 assignment-compatible한 첫 handler 하나가 실행되고 나머지 sibling catches는 건너뜁니다.",
        "ArithmeticException과 InputMismatchException은 모두 RuntimeException→Exception descendants입니다. catch(Exception)를 먼저 두면 모든 하위 exceptions를 이미 잡으므로 뒤의 구체 catch는 도달 불가능하고 compiler가 거부합니다.",
        "구체 catch를 먼저 두고 마지막에 상위 catch를 두는 문법은 가능하지만 ‘혹시 모르니 Exception’ fallback이 정말 복구 가능한지 따져야 합니다. 예상 못 한 programming bug까지 성공 response로 바꾸지 않습니다.",
        "multi-catch catch(A | B e)는 서로 unrelated alternatives가 같은 handler body와 recovery outcome을 가질 때 중복을 줄입니다. NumberFormatException | ArithmeticException처럼 입력을 invalid로 분류하는 작은 boundary가 예입니다.",
        "한 alternative가 다른 alternative의 subtype이면 허용되지 않습니다. FileNotFoundException | IOException은 앞 type을 뒤 type이 이미 포함하므로 redundant하며 compiler가 거부합니다.",
        "multi-catch parameter는 implicitly final이라 다른 exception object를 대입할 수 없습니다. 공통 supertype surface만 바로 사용할 수 있으므로 type별 recovery가 필요하면 separate catches로 유지합니다.",
        "catch를 합칠 기준은 상속 관계가 아니라 동일한 caller-visible policy입니다. logging fields, retryability, user message, state cleanup이 다르면 같은 multi-catch body로 억지로 합치지 않습니다.",
      ],
      concepts: [
        { term: "first assignable catch", definition: "thrown object를 parameter type 변수에 대입할 수 있는 첫 source-order catch clause입니다.", detail: ["한 handler만 실행됩니다.", "parent-first는 child handler를 unreachable하게 합니다."] },
        { term: "unreachable catch", definition: "앞선 catch가 해당 type의 모든 values를 이미 처리해 runtime에 선택될 수 없는 handler입니다.", detail: ["compile-time error입니다.", "child-before-parent로 정렬합니다."] },
        { term: "multi-catch", definition: "서로 대안인 unrelated exception types가 동일 handler body를 공유하도록 vertical bar로 선언하는 catch form입니다.", detail: ["parameter는 implicitly final입니다.", "alternatives 간 subtype 관계는 금지됩니다."] },
      ],
      codeExamples: [{
        id: "java-specific-and-multicatch",
        title: "정상·zero·문자 입력을 하나의 shared invalid policy로 분류합니다",
        language: "java",
        filename: "SpecificAndMultiCatch.java",
        purpose: "서로 unrelated한 parse/arithmetic runtime failures만 multi-catch로 묶습니다.",
        code: String.raw`public class SpecificAndMultiCatch {
    static String divide(String token) {
        try {
            int value = Integer.parseInt(token);
            return "ok=" + (12 / value);
        } catch (NumberFormatException | ArithmeticException exception) {
            return "invalid=" + exception.getClass().getSimpleName();
        }
    }

    public static void main(String[] args) {
        System.out.println(divide("3"));
        System.out.println(divide("0"));
        System.out.println(divide("x"));
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "String conversion과 integer division을 실행하고 동일 invalid outcome인 두 unrelated exceptions만 공유합니다." },
          { lines: "11-15", explanation: "정상, arithmetic zero, format failure를 독립 calls로 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("SpecificAndMultiCatch.java", "SpecificAndMultiCatch") },
        output: { value: "ok=4\ninvalid=ArithmeticException\ninvalid=NumberFormatException", explanation: ["3은 정상 quotient4입니다.", "0과 x는 같은 caller policy지만 runtime type을 진단 evidence로 보존합니다."] },
        experiments: [
          { change: "catch alternatives를 NumberFormatException | RuntimeException으로 바꿉니다.", prediction: "subtype alternatives 관련 compile error가 납니다.", result: "multi-catch union은 상위/하위 중복을 허용하지 않습니다." },
          { change: "multi-catch 안 exception 변수에 새 RuntimeException을 대입합니다.", prediction: "multi-catch parameter may not be assigned compile error가 납니다.", result: "parameter는 implicitly final입니다." },
        ],
        sourceRefs: ["java-class08-ex03", "java-class08-ex05", "jls-catch-clauses", "jls-multicatch", "java-number-format-api", "java-arithmetic-api"],
      }],
      diagnostics: [
        { symptom: "구체 catch가 unreachable compile error다.", likelyCause: "앞에 Exception/RuntimeException 같은 상위 handler를 두었습니다.", checks: ["catch types inheritance를 그립니다.", "source order를 봅니다.", "각 handler의 recovery 차이를 적습니다."], fix: "child-specific catches를 먼저 두고 필요한 경우에만 parent fallback을 마지막에 둡니다.", prevention: "catch order lint와 negative compiler test를 CI에 둡니다." },
        { symptom: "multi-catch에서 type별 method/cast가 계속 필요하다.", likelyCause: "복구 정책이 다른 exceptions를 중복 제거만을 위해 합쳤습니다.", checks: ["user message/retry/state cleanup이 같은지 봅니다.", "instanceof 분기가 생겼는지 봅니다.", "공통 handler surface를 확인합니다."], fix: "type별 catches로 분리하거나 각 failure를 공통 domain error code로 번역하는 boundary를 둡니다.", prevention: "multi-catch는 identical policy일 때만 허용합니다." },
      ],
      expertNotes: ["catch alternatives의 least upper bound와 precise rethrow typing은 compiler analysis에 영향을 주지만 handler design의 첫 기준은 복구 semantics입니다.", "catch order는 most-specific-first지만 unrelated types 사이 순서는 business priority가 아니라 실제 throw type으로 결정됩니다."],
    },
    {
      id: "scanner-token-recovery-and-retry-loop",
      title: "Scanner 실패 뒤 token cursor를 회복하고 retry loop의 종료·시도 횟수를 명시합니다",
      lead: "Ex03의 한 번 catch 종료와 Ex04의 outer loop 재시도를 비교해 ‘catch하면 다시 입력’이라는 자동 효과가 없음을 확인합니다.",
      explanations: [
        "Ex03은 try 안에 while이 있으므로 catch가 try 밖에 있고 handler 뒤 main 끝으로 갑니다. catch가 while beginning으로 자동 되돌리는 것이 아닙니다. retry는 loop와 continue 위치로 명시해야 합니다.",
        "Scanner.nextInt가 문자 token에서 InputMismatchException을 던지면 offending token이 자동 소비되지 않습니다. 같은 nextInt를 바로 다시 호출하면 같은 token으로 다시 실패할 수 있어 next 또는 nextLine으로 입력 정책에 맞게 소비해야 합니다.",
        "Ex04는 catch에서 nextLine을 호출해 현재 line remainder를 버리고 outer while로 돌아갑니다. zero ArithmeticException에서도 nextLine을 호출하지만 nextInt가 numeric token을 이미 소비했다는 차이를 구분해야 합니다.",
        "EOF는 잘못된 token이 아니라 input stream 종료입니다. hasNext/hasNextInt 또는 NoSuchElementException boundary를 통해 종료 outcome을 따로 정의합니다. Ex04는 EOF를 잡지 않아 exit1입니다.",
        "사용자 입력0이 업무상 금지 값이라면 division을 시도해 ArithmeticException으로 분기하기보다 divisor==0 validation으로 안내하는 편이 의도가 명확하고 stack 생성 비용도 피합니다.",
        "재입력 loop에는 max attempts, cancellation/EOF, prompt 횟수, invalid token echo/sanitization, locale/radix가 포함됩니다. 무한 while(true)만으로 recovery contract가 완성되지 않습니다.",
        "Scanner를 닫으면 underlying System.in도 닫힐 수 있습니다. 작은 main은 process 종료와 함께 끝나지만 library가 전달받은 stream의 ownership을 임의로 닫지 않습니다. resource lifecycle은 다음 세션에서 확장합니다.",
      ],
      concepts: [
        { term: "offending token retention", definition: "Scanner type conversion 실패 시 잘못된 token이 input source에 남아 후속 read가 같은 token을 다시 볼 수 있는 상태입니다.", detail: ["명시 consume가 필요합니다.", "next와 nextLine 정책이 다릅니다."] },
        { term: "retry loop", definition: "실패 후 입력/operation을 다시 시도하도록 control flow와 종료 조건을 명시한 loop입니다.", detail: ["catch만으로 retry되지 않습니다.", "attempt/EOF/cancel limits가 필요합니다."] },
        { term: "EOF outcome", definition: "추가 token이 없다는 stream lifecycle event로 invalid value와 다른 종료 상태입니다.", detail: ["NoSuchElementException으로 관찰될 수 있습니다.", "interactive/file input policy가 다릅니다."] },
      ],
      codeExamples: [{
        id: "java-bounded-scanner-retry",
        title: "문자 token 소비·zero 정상 분기·성공까지 세 번만 시도합니다",
        language: "java",
        filename: "BoundedScannerRetry.java",
        purpose: "InputMismatch cursor recovery와 expected zero validation을 bounded loop로 분리합니다.",
        code: String.raw`import java.util.InputMismatchException;
import java.util.Scanner;

public class BoundedScannerRetry {
    public static void main(String[] args) {
        Scanner scanner = new Scanner("x 0 5");
        int attempts = 0;
        while (attempts < 3 && scanner.hasNext()) {
            attempts++;
            int value;
            try {
                value = scanner.nextInt();
            } catch (InputMismatchException exception) {
                System.out.println("reject-token=" + scanner.next());
                continue;
            }
            if (value == 0) {
                System.out.println("reject-zero");
                continue;
            }
            System.out.println("result=" + (25 / value));
            break;
        }
        System.out.println("attempts=" + attempts);
        scanner.close();
    }
}`,
        walkthrough: [
          { lines: "1-8", explanation: "deterministic three-token input과 max3/EOF-aware loop를 준비합니다." },
          { lines: "9-16", explanation: "nextInt mismatch에서 scanner.next가 offending x를 정확히 한 token 소비합니다." },
          { lines: "17-23", explanation: "zero는 정상 validation branch로 reject하고5에서 quotient5를 출력해 종료합니다." },
          { lines: "24-27", explanation: "attempt count를 출력하고 owned Scanner를 닫아 resource lifecycle을 명시합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("BoundedScannerRetry.java", "BoundedScannerRetry") },
        output: { value: "reject-token=x\nreject-zero\nresult=5\nattempts=3", explanation: ["x는 catch에서 소비되어 loop가 진행됩니다.", "zero는 exception이 아닌 expected validation이며 세 번째5가 성공합니다."] },
        experiments: [
          { change: "catch에서 scanner.next()를 제거합니다.", prediction: "세 attempts가 모두 같은 x token에서 실패하고 result가 나오지 않습니다.", result: "handler는 input cursor를 자동 전진시키지 않습니다." },
          { change: "입력을 x 하나로 줄이고 hasNext 조건을 제거합니다.", prediction: "x 소비 뒤 다음 iteration의 nextInt가 EOF NoSuchElementException을 던집니다.", result: "invalid와 EOF 종료를 별도 policy로 다뤄야 합니다." },
        ],
        sourceRefs: ["java-class08-ex03", "java-class08-ex04", "java-scanner-api", "java-input-mismatch-api", "java-no-such-element-api"],
      }],
      diagnostics: [
        { symptom: "문자 입력 뒤 같은 오류가 무한 반복된다.", likelyCause: "InputMismatchException catch가 offending token을 소비하지 않았습니다.", checks: ["catch 뒤 next/nextLine 호출을 봅니다.", "token/line delimiter 정책을 확인합니다.", "attempt counter가 증가하는지 봅니다."], fix: "입력 형식에 맞게 token 또는 line을 한 번 소비하고 bounded retry합니다.", prevention: "x→valid sequence test와 max-attempt assertion을 둡니다." },
        { symptom: "stdin이 끝나자 retry program이 stack trace로 종료한다.", likelyCause: "EOF를 invalid token과 동일하게 보고 hasNext/NoSuchElement 종료 경계를 두지 않았습니다.", checks: ["stdin close 시점을 봅니다.", "hasNext predicate를 확인합니다.", "EOF exit code와 user message를 정의합니다."], fix: "EOF를 cancelled/end-of-input outcome으로 반환하고 loop를 정상 종료합니다.", prevention: "interactive tests에 empty/partial/closed stdin cases를 포함합니다." },
      ],
      expertNotes: ["Scanner는 편리하지만 throughput·locale·tokenization 요구가 큰 입력에는 BufferedReader+explicit parser가 더 예측 가능할 수 있습니다.", "retry prompt는 접근성/UI 환경에서는 blocking console loop가 아니라 state machine/event cycle로 모델링할 수 있습니다."],
    },
    {
      id: "catch-antipatterns-and-explicit-outcomes",
      title: "catch-and-ignore·broad catch·예외 정상분기를 explicit validation과 outcome으로 교정합니다",
      lead: "예외를 ‘프로그램이 안 죽게 하는 문법’으로만 쓰지 않고 호출자가 실패를 구분하고 행동할 수 있게 만듭니다.",
      explanations: [
        "빈 catch 또는 주석만 있는 catch는 failure evidence와 state uncertainty를 모두 숨깁니다. program이 exit0이어도 caller는 operation 성공으로 오해할 수 있고 partial side effect가 남을 수 있습니다.",
        "Ex05의 catch(Exception)는 arithmetic과 input mismatch를 모두 잡지만 같은 raw exception print와 generic marker만 제공합니다. 어느 input을 수정할지, retry 가능한지, output/state가 유효한지 계약이 없습니다.",
        "RuntimeException 전체를 service boundary에서 success/null/0으로 바꾸면 NullPointerException 같은 bug도 업무상 ‘없음’으로 위장합니다. expected domain failures만 구체적으로 변환하고 unexpected failures는 context/cause를 보존해 전파합니다.",
        "존재 여부, range, zero, user 선택처럼 자주 예상되는 정상 조건은 if/Result/Optional 같은 explicit branch가 적합합니다. exception은 정상적으로 드문 실패와 API contract violation에 사용합니다.",
        "null sentinel과 numeric0은 실제 합법 value와 failure를 구분하지 못할 수 있습니다. immutable result에 success/value/errorCode를 두거나 typed domain exception을 사용합니다.",
        "catch에서 log한 뒤 같은 exception을 그대로 throw하고 상위 layer도 log하면 한 failure가 여러 stack traces로 중복됩니다. 관찰 owner를 정하고 각 layer는 context 추가 또는 translation 중 필요한 한 행동만 합니다.",
        "catch body가 recovery를 완료했다면 postcondition을 만족한 value/state를 반환해야 합니다. 그렇지 않으면 실패 outcome/exception을 caller에 전달하고 ‘처리했다’고 부르지 않습니다.",
      ],
      concepts: [
        { term: "catch-and-ignore", definition: "exception을 잡고 state 복구·진단·전파·명시 outcome 없이 버리는 anti-pattern입니다.", detail: ["exit0 false success를 만듭니다.", "empty catch를 금지합니다."] },
        { term: "exception as normal control flow", definition: "자주 기대되는 값 부재·validation·loop 종료를 일부러 exception 발생으로 판정하는 사용입니다.", detail: ["비용과 의도를 악화시킵니다.", "normal predicate/result를 우선합니다."] },
        { term: "explicit outcome", definition: "success 여부, value, error code를 호출 signature에 드러내 caller가 분기하도록 하는 immutable result입니다.", detail: ["sentinel ambiguity를 줄입니다.", "stack이 필요한 unexpected failure와 병행할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-explicit-parse-outcome",
        title: "expected format/range 실패만 typed result로 변환합니다",
        language: "java",
        filename: "ExplicitParseOutcome.java",
        purpose: "broad catch와 sentinel 대신 caller-visible error codes를 반환합니다.",
        code: String.raw`public class ExplicitParseOutcome {
    record ParseResult(boolean success, int value, String errorCode) {
        static ParseResult ok(int value) { return new ParseResult(true, value, "NONE"); }
        static ParseResult fail(String code) { return new ParseResult(false, 0, code); }
    }

    static ParseResult parsePercent(String raw) {
        if (raw == null || raw.isBlank()) return ParseResult.fail("REQUIRED");
        final int value;
        try {
            value = Integer.parseInt(raw);
        } catch (NumberFormatException exception) {
            return ParseResult.fail("NOT_INTEGER");
        }
        if (value < 0 || value > 100) return ParseResult.fail("OUT_OF_RANGE");
        return ParseResult.ok(value);
    }

    static void print(String raw) {
        ParseResult result = parsePercent(raw);
        System.out.println(result.success() ? "ok=" + result.value() : "error=" + result.errorCode());
    }

    public static void main(String[] args) {
        print("70");
        print("x");
        print("101");
        print(" ");
    }
}`,
        walkthrough: [
          { lines: "1-5", explanation: "success/value/errorCode가 분리된 immutable result factories를 정의합니다." },
          { lines: "7-17", explanation: "required/range는 normal validation, 문자열 conversion failure만 구체 NumberFormat catch로 번역합니다." },
          { lines: "19-22", explanation: "caller가 success flag로 value 또는 error code를 출력합니다." },
          { lines: "24-29", explanation: "정상·format·range·blank 네 public outcomes를 exact 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ExplicitParseOutcome.java", "ExplicitParseOutcome") },
        output: { value: "ok=70\nerror=NOT_INTEGER\nerror=OUT_OF_RANGE\nerror=REQUIRED", explanation: ["expected invalid inputs가 stack trace 없이 명시 codes가 됩니다.", "value0 sentinel은 success flag와 분리되어 ambiguity가 없습니다."] },
        experiments: [
          { change: "catch를 RuntimeException으로 넓히고 parsePercent 내부에 null bug를 추가합니다.", prediction: "programming bug가 NOT_INTEGER로 오분류될 수 있습니다.", result: "translation catch는 expected implementation failure type에 좁혀야 합니다." },
          { change: "ParseResult에서 success를 제거하고 value0을 failure로 씁니다.", prediction: "합법0 percent와 실패를 구분할 수 없습니다.", result: "sentinel보다 tagged outcome이 안전합니다." },
        ],
        sourceRefs: ["java-class08-ex05", "java-number-format-api", "effective-java-exceptions", "jls-record-classes"],
      }],
      diagnostics: [
        { symptom: "실패했는데 caller는 success로 처리한다.", likelyCause: "catch가 exception을 삼키고 null/0 또는 아무 표시 없이 정상 return했습니다.", checks: ["catch exit paths를 추적합니다.", "sentinel이 합법 value인지 봅니다.", "success postcondition을 assert합니다."], fix: "typed result 또는 domain exception으로 실패를 caller-visible하게 만듭니다.", prevention: "empty catch lint와 failure-path contract tests를 둡니다." },
        { symptom: "사용자 format 오류와 내부 NPE가 같은 error code다.", likelyCause: "catch(Exception/RuntimeException)로 예상·예상외 failures를 합쳤습니다.", checks: ["caught runtime types를 기록합니다.", "try 범위를 줄입니다.", "translation 대상 type을 좁힙니다."], fix: "NumberFormatException 같은 expected failure만 번역하고 NPE는 diagnostics/cause를 보존해 실패시킵니다.", prevention: "error taxonomy에 user-correctable/domain/transient/bug를 분리합니다." },
      ],
      expertNotes: ["Result와 exception은 경쟁하는 절대 선택이 아니라 expected frequency·composition·stack 필요성에 따라 boundary별로 조합합니다.", "비동기 API에서는 exception이 Future/CompletionStage failure channel로 이동하므로 wrapper CompletionException의 cause를 보존해 해석합니다."],
    },
    {
      id: "stack-trace-and-cause-chain-reading",
      title: "stack trace는 top application frame부터 읽고 cause chain의 가장 깊은 원인을 잃지 않습니다",
      lead: "exception type/message 한 줄만 보는 대신 throw site·call path·translation layers·root cause를 구조적으로 추적합니다.",
      explanations: [
        "uncaught stack trace는 보통 thread와 outer exception type/message, frames, 그리고 cause가 있으면 Caused by section을 보여 줍니다. 첫 application-owned frame은 실패를 던진/번역한 지점의 중요한 출발점입니다.",
        "frame은 declaring class, method, source file, line을 담습니다. 위쪽 frames는 현재 throw 지점에서 caller 방향으로 이어지며 logging framework/reflection frames보다 application package frames를 우선 찾습니다.",
        "exception translation이 새 exception만 만들고 original을 constructor cause로 전달하지 않으면 root type·message·frames가 사라집니다. new DomainException(message, cause)를 사용합니다.",
        "getCause를 반복해 chain을 순회하되 cycle 가능성을 방어할 수 있습니다. 일반 Java Throwable cause 설정은 self-causation을 막지만 외부/특수 implementations를 다루는 diagnostics utility는 identity set을 고려합니다.",
        "message는 사람/환경/JDK에 따라 달라질 수 있고 secret/path/input을 포함할 수도 있습니다. machine policy는 type/error code를 사용하고 raw message를 사용자 response나 metric label에 그대로 복사하지 않습니다.",
        "printStackTrace는 기본적으로 stderr에 전체 evidence를 쓰지만 production structured logging에는 correlation id, operation, sanitized context와 Throwable object를 logger에 전달합니다. 같은 failure를 모든 layer에서 중복 log하지 않습니다.",
        "line number exact test는 source/compiler debug info에 민감합니다. 예제에서는 stable application method name과 cause identity를 검증하고 원본 audit에서 version-pinned source frames만 별도로 확인합니다.",
      ],
      concepts: [
        { term: "stack frame", definition: "exception stack에 기록된 class·method·file·line invocation 위치입니다.", detail: ["top frame은 throw 지점에 가깝습니다.", "application-owned frame을 우선 찾습니다."] },
        { term: "cause chain", definition: "상위 abstraction exception이 getCause로 원래 failure를 연결한 chain입니다.", detail: ["translation context와 root evidence를 함께 보존합니다.", "Caused by section으로 출력됩니다."] },
        { term: "root cause", definition: "cause chain의 가장 안쪽에서 현재 failure를 촉발한 원래 throwable입니다.", detail: ["항상 유일한 business 원인이라는 뜻은 아닙니다.", "context는 outer exceptions에도 있습니다."] },
      ],
      codeExamples: [{
        id: "java-cause-chain-inspection",
        title: "format failure를 domain exception으로 번역하고 양쪽 application frames를 찾습니다",
        language: "java",
        filename: "CauseChainInspection.java",
        purpose: "raw line number 없이 outer context·cause type·application method names를 검증합니다.",
        code: String.raw`public class CauseChainInspection {
    static final class CatalogException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        CatalogException(String message, Throwable cause) { super(message, cause); }
    }

    static int parseId(String raw) {
        return Integer.parseInt(raw);
    }

    static int load(String raw) {
        try {
            return parseId(raw);
        } catch (NumberFormatException cause) {
            throw new CatalogException("catalog-id-invalid", cause);
        }
    }

    static String applicationMethod(Throwable failure) {
        for (StackTraceElement frame : failure.getStackTrace()) {
            if (frame.getClassName().equals(CauseChainInspection.class.getName())) return frame.getMethodName();
        }
        return "missing";
    }

    public static void main(String[] args) {
        try {
            load("bad");
        } catch (CatalogException outer) {
            Throwable cause = outer.getCause();
            System.out.println("outer=" + outer.getClass().getSimpleName() + ":" + outer.getMessage());
            System.out.println("outerFrame=" + applicationMethod(outer));
            System.out.println("cause=" + cause.getClass().getSimpleName());
            System.out.println("causeFrame=" + applicationMethod(cause));
            System.out.println("sameCause=" + (outer.getCause() == cause));
        }
    }
}`,
        walkthrough: [
          { lines: "1-5", explanation: "domain exception이 serial warning 없는 stable id와 context message·original cause를 받습니다." },
          { lines: "7-17", explanation: "parseId failure를 load boundary에서 catalog context로 번역합니다." },
          { lines: "19-24", explanation: "generated/JDK frames를 건너뛰고 첫 application-owned method name을 찾습니다." },
          { lines: "26-37", explanation: "outer/cause type·message·frames와 cause object identity를 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("CauseChainInspection.java", "CauseChainInspection") },
        output: { value: "outer=CatalogException:catalog-id-invalid\nouterFrame=load\ncause=NumberFormatException\ncauseFrame=parseId\nsameCause=true", explanation: ["outer는 domain context, cause는 low-level format type을 보존합니다.", "각 stack의 첫 application method가 translation/원인 지점을 나눕니다."] },
        experiments: [
          { change: "CatalogException 생성에서 cause 인자를 제거합니다.", prediction: "getCause가 null이 되어 original type/frame evidence가 사라집니다.", result: "translation은 cause preservation과 함께 해야 합니다." },
          { change: "applicationMethod 대신 getStackTrace()[0].getLineNumber를 golden으로 저장합니다.", prediction: "source line 이동이나 debug settings로 test가 깨집니다.", result: "구조/behavior contract와 source-layout regression을 분리합니다." },
        ],
        sourceRefs: ["java-class08-ex02", "java-throwable-api", "java-stack-trace-element-api", "jls-throw-statement", "effective-java-exceptions"],
      }],
      diagnostics: [
        { symptom: "운영 log에 domain exception만 있고 원래 parse/file failure가 없다.", likelyCause: "translation constructor에 cause를 전달하지 않았습니다.", checks: ["getCause chain을 순회합니다.", "new exception call sites를 찾습니다.", "Caused by section을 확인합니다."], fix: "domain message와 original Throwable을 함께 받는 constructor로 번역합니다.", prevention: "translation unit test에서 cause type·identity·application frame을 assert합니다." },
        { symptom: "stack trace가 너무 길어 어느 줄부터 볼지 모른다.", likelyCause: "message만 검색하거나 framework bottom부터 읽고 application boundary를 찾지 않았습니다.", checks: ["outer type/message를 분류합니다.", "첫 application-owned frame을 찾습니다.", "Caused by의 deepest application frame을 확인합니다."], fix: "outer context→first app frame→cause chain→root app frame 순서로 읽습니다.", prevention: "incident template에 correlation·outer/root type·first app frame fields를 둡니다." },
      ],
      expertNotes: ["root cause만 남기면 outer operation/user/entity context를 잃을 수 있으므로 chain 전체에서 서로 다른 정보를 사용합니다.", "suppressed exceptions는 resource cleanup 실패를 담을 수 있으며 try-with-resources 세션에서 cause와 별도 channel로 다룹니다."],
    },
    {
      id: "user-message-and-developer-diagnostics",
      title: "사용자 응답과 개발자 진단을 분리해 친절함·보안·운영성을 동시에 지킵니다",
      lead: "raw exception/stack을 화면에 노출하지 않고도 support가 같은 실패를 찾을 수 있는 correlation evidence를 제공합니다.",
      explanations: [
        "사용자는 무엇을 수정하거나 다시 시도할지 알아야 합니다. ‘예외처리’나 java.lang.NumberFormatException 전체 문자열보다 ‘나이는 숫자로 입력해 주세요’ 같은 action-oriented message와 field indication이 유용합니다.",
        "개발자/운영자는 exception type, error code, operation, correlation id, sanitized identifiers, stack/cause가 필요합니다. 이 정보는 server-side structured log/trace에 두고 user response에는 support reference만 노출합니다.",
        "raw exception message에는 file path, SQL, host, token 일부, 사용자 input, internal class name이 들어갈 수 있습니다. 사용자·metric label·public API에 그대로 복사하면 정보 노출과 high-cardinality 문제를 만듭니다.",
        "같은 failure를 controller/service/repository에서 매번 log+rethrow하면 duplicate alerts가 생깁니다. 최종 관찰 boundary가 Throwable을 한 번 기록하고 아래 layers는 context를 exception fields/cause로 추가합니다.",
        "correlation id는 secret이 아니어야 하고 guessable하더라도 authorization을 우회하지 않아야 합니다. log lookup key일 뿐 상세 오류 조회 권한을 부여하는 token으로 쓰지 않습니다.",
        "user message localization과 developer error code를 분리합니다. code AGE_NOT_INTEGER는 안정적이고 locale별 문구는 바뀔 수 있습니다. exception class name을 localization key로 직접 사용하지 않습니다.",
        "stack trace를 완전히 버리는 privacy 대응도 잘못입니다. 민감 context를 구조적으로 allowlist/redact하고 Throwable은 제한된 secure sink에 보존합니다.",
      ],
      concepts: [
        { term: "safe user message", definition: "내부 구현·stack·secret을 노출하지 않고 사용자가 취할 다음 행동을 설명하는 localized message입니다.", detail: ["stable error code와 분리합니다.", "raw exception toString을 쓰지 않습니다."] },
        { term: "developer diagnostic", definition: "운영자가 원인을 재현/추적하도록 type·stack·cause·operation·sanitized context·correlation을 담은 evidence입니다.", detail: ["secure sink에 기록합니다.", "한 관찰 boundary에서 log합니다."] },
        { term: "correlation id", definition: "사용자 report, log, trace를 같은 request/failure instance로 연결하는 비밀이 아닌 reference입니다.", detail: ["authorization token이 아닙니다.", "cardinality와 format을 통제합니다."] },
      ],
      codeExamples: [{
        id: "java-safe-diagnostic-separation",
        title: "같은 parse failure를 user action과 sanitized developer record로 분리합니다",
        language: "java",
        filename: "SafeDiagnosticSeparation.java",
        purpose: "raw input/stack을 public message에 섞지 않고 type·operation·reference를 개발자 evidence로 보존합니다.",
        code: String.raw`public class SafeDiagnosticSeparation {
    static String userMessage(String code) {
        return switch (code) {
            case "AGE_NOT_INTEGER" -> "나이는 숫자로 입력해 주세요.";
            default -> "요청을 처리하지 못했습니다.";
        };
    }

    static String developerRecord(String reference, String operation, Throwable failure) {
        return reference + "|" + operation + "|" + failure.getClass().getSimpleName();
    }

    public static void main(String[] args) {
        String reference = "ref-7";
        try {
            Integer.parseInt("private-input");
        } catch (NumberFormatException failure) {
            String publicMessage = userMessage("AGE_NOT_INTEGER") + " 문의 번호: " + reference;
            String diagnostic = developerRecord(reference, "parse-age", failure);
            System.out.println("user=" + publicMessage);
            System.out.println("developer=" + diagnostic);
            System.out.println("publicHasClass=" + publicMessage.contains("NumberFormatException"));
            System.out.println("diagnosticHasRaw=" + diagnostic.contains("private-input"));
        }
    }
}`,
        walkthrough: [
          { lines: "1-7", explanation: "stable error code를 localized action message로 변환합니다." },
          { lines: "9-11", explanation: "developer record는 allowlisted reference·operation·type만 포함합니다." },
          { lines: "13-25", explanation: "format failure를 두 channels로 분리하고 public class leakage/raw input leakage가 false인지 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("SafeDiagnosticSeparation.java", "SafeDiagnosticSeparation") },
        output: { value: "user=나이는 숫자로 입력해 주세요. 문의 번호: ref-7\ndeveloper=ref-7|parse-age|NumberFormatException\npublicHasClass=false\ndiagnosticHasRaw=false", explanation: ["사용자는 수정 행동과 reference만 봅니다.", "개발자 record는 type을 가지지만 raw input은 포함하지 않습니다."] },
        experiments: [
          { change: "user message에 failure.toString을 붙입니다.", prediction: "publicHasClass가 true가 되고 input 일부가 message에 포함될 수 있습니다.", result: "raw Throwable 문자열을 public channel로 복사하지 않습니다." },
          { change: "developer record에도 reference를 제거합니다.", prediction: "사용자 report와 여러 동일 type logs를 연결하기 어렵습니다.", result: "safe correlation은 privacy와 operability를 함께 만족해야 합니다." },
        ],
        sourceRefs: ["java-class08-ex01", "java-class08-ex05", "owasp-error-handling", "java-number-format-api"],
      }],
      diagnostics: [
        { symptom: "오류 화면에 package/class/path/SQL이 노출된다.", likelyCause: "exception.toString 또는 stack trace를 user response에 직접 렌더링했습니다.", checks: ["response/body/template을 검사합니다.", "raw message에 path/input/secret이 있는지 봅니다.", "developer sink와 public channel을 분리합니다."], fix: "stable error code→safe localized message로 응답하고 Throwable은 secure structured log에 보존합니다.", prevention: "public error snapshot에 forbidden internal patterns/privacy scan을 둡니다." },
        { symptom: "사용자가 문의 번호를 줬지만 log에서 같은 실패를 못 찾는다.", likelyCause: "correlation id를 생성/전파/기록하지 않았거나 layer마다 새 값을 만들었습니다.", checks: ["request 시작과 error boundary id를 비교합니다.", "async propagation을 봅니다.", "log fields가 searchable한지 확인합니다."], fix: "한 request correlation을 context로 전파하고 user reference와 final error log에 동일 값을 기록합니다.", prevention: "integration test가 response reference와 captured log record를 연결합니다." },
      ],
      expertNotes: ["exception message와 stack은 observability data이면서 personal/security data가 될 수 있어 retention·access control·redaction 정책이 필요합니다.", "metric tag에는 bounded error code를 쓰고 raw message/correlation id는 high-cardinality label로 넣지 않습니다."],
    },
    {
      id: "exception-translation-at-abstraction-boundaries",
      title: "low-level exception을 domain language로 번역하되 cause와 실패 의미를 보존합니다",
      lead: "repository의 IOException을 모든 상위 caller에 노출하지 않고 profile load 실패라는 안정 contract로 바꿉니다.",
      explanations: [
        "exception translation은 구현 계층의 type을 caller가 이해하는 abstraction type으로 바꾸는 작업입니다. file/database/network client를 교체해도 service API가 low-level exception names에 묶이지 않게 합니다.",
        "번역 exception에는 operation/entity/error code처럼 상위 layer가 이해할 context를 넣고 original Throwable을 cause로 전달합니다. message만 복사하면 source frames와 root type이 사라집니다.",
        "모든 exception을 하나의 DomainException으로 뭉치면 retryable timeout, not-found, invalid data, authorization을 구분할 수 없습니다. caller action이 다른 failure categories는 typed subclasses 또는 stable codes로 나눕니다.",
        "translation catch 범위는 low-level operation에 좁혀야 합니다. repository 호출과 이후 domain mapping을 큰 try 하나로 감싸 catch(Exception)하면 mapping bug도 storage failure로 오분류됩니다.",
        "같은 exception을 catch해 message만 바꿔 매 layer마다 새 wrapper를 쌓으면 의미 없는 chain과 duplicate logs가 늘어납니다. abstraction이 실제로 바뀌는 경계에서만 번역합니다.",
        "checked low-level exception을 unchecked domain exception으로 바꾸면 caller compiler 의무가 사라지므로 public contract·tests·global boundary가 더 중요해집니다. 단순 편의를 위해 숨기지 않습니다.",
        "not-found가 정상 query outcome인지 exceptional failure인지는 API semantics에 달렸습니다. Optional/empty result가 자연스러운 조회와 invariant상 반드시 존재해야 하는 entity를 구분합니다.",
      ],
      concepts: [
        { term: "exception translation", definition: "lower abstraction의 throwable을 higher abstraction의 failure type/code로 바꾸는 boundary operation입니다.", detail: ["caller vocabulary를 안정화합니다.", "original cause를 보존합니다."] },
        { term: "abstraction leakage", definition: "상위 API가 file/SQL/vendor 등 하위 구현 exception type과 details에 직접 의존하는 결합입니다.", detail: ["implementation 교체를 어렵게 합니다.", "domain boundary translation으로 줄입니다."] },
        { term: "failure taxonomy", definition: "caller의 행동이 달라지는 not-found·invalid·transient·conflict·bug 같은 failure categories입니다.", detail: ["한 generic wrapper보다 의미가 중요합니다.", "user code와 retry policy에 연결합니다."] },
      ],
      codeExamples: [{
        id: "java-exception-translation-boundary",
        title: "IOException을 ProfileLoadException으로 번역하고 cause identity를 유지합니다",
        language: "java",
        filename: "ExceptionTranslationBoundary.java",
        purpose: "상위 context와 하위 diagnostic evidence가 하나의 chain에 공존함을 검증합니다.",
        code: String.raw`import java.io.IOException;

public class ExceptionTranslationBoundary {
    static final class ProfileLoadException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        private final String code;
        ProfileLoadException(String code, Throwable cause) {
            super("profile-load-failed", cause);
            this.code = code;
        }
        String code() { return code; }
    }

    static String readStorage() throws IOException {
        throw new IOException("storage-unavailable");
    }

    static String loadProfile() {
        try {
            return readStorage();
        } catch (IOException cause) {
            throw new ProfileLoadException("PROFILE_STORAGE", cause);
        }
    }

    public static void main(String[] args) {
        try {
            loadProfile();
        } catch (ProfileLoadException failure) {
            System.out.println("code=" + failure.code());
            System.out.println("message=" + failure.getMessage());
            System.out.println("cause=" + failure.getCause().getClass().getSimpleName());
            System.out.println("causeMessage=" + failure.getCause().getMessage());
        }
    }
}`,
        walkthrough: [
          { lines: "1-12", explanation: "domain exception이 stable code·message와 cause constructor를 제공합니다." },
          { lines: "14-16", explanation: "storage boundary가 checked IOException을 발생시킵니다." },
          { lines: "18-24", explanation: "loadProfile만 low-level call을 좁게 감싸 domain type으로 번역합니다." },
          { lines: "26-35", explanation: "caller는 domain code를 사용하면서 cause type/message evidence도 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ExceptionTranslationBoundary.java", "ExceptionTranslationBoundary") },
        output: { value: "code=PROFILE_STORAGE\nmessage=profile-load-failed\ncause=IOException\ncauseMessage=storage-unavailable", explanation: ["caller-visible category는 PROFILE_STORAGE입니다.", "low-level IOException evidence가 cause로 그대로 남습니다."] },
        experiments: [
          { change: "catch(IOException)를 catch(Exception)으로 넓히고 loadProfile에 mapping NPE를 추가합니다.", prediction: "programming bug까지 PROFILE_STORAGE로 오분류될 수 있습니다.", result: "translation try/catch는 low-level boundary와 expected type에 좁힙니다." },
          { change: "ProfileLoadException constructor에서 cause를 super에 전달하지 않습니다.", prediction: "cause와 causeMessage 출력이 불가능해집니다.", result: "context 추가와 evidence 보존을 동시에 해야 합니다." },
        ],
        sourceRefs: ["java-class08-ex02", "java-io-exception-api", "java-throwable-api", "effective-java-exceptions"],
      }],
      diagnostics: [
        { symptom: "service signature가 FileNotFoundException·SQLException·vendor exceptions로 가득하다.", likelyCause: "repository implementation details가 domain boundary를 통과했습니다.", checks: ["caller가 실제로 필요한 categories를 나열합니다.", "implementation 교체 시 throws 변화를 봅니다.", "translation points를 찾습니다."], fix: "domain failure taxonomy로 번역하고 cause에 low-level evidence를 보존합니다.", prevention: "layer API review에서 low-level exception leakage를 검사합니다." },
        { symptom: "모든 실패가 DomainException 하나라 retry/not-found 처리가 불가능하다.", likelyCause: "abstraction을 만들면서 caller action differences까지 지웠습니다.", checks: ["error codes/types를 inventory합니다.", "각 category의 caller action을 표로 만듭니다.", "unknown failure fallback을 분리합니다."], fix: "retryable, not-found, validation, conflict 등 의미 categories를 typed code로 나눕니다.", prevention: "exception hierarchy는 구현 type이 아니라 recovery semantics로 설계합니다." },
      ],
      expertNotes: ["domain exception에 mutable entity 전체를 field로 저장하면 retention/privacy 위험이 있어 stable id와 sanitized context만 둡니다.", "remote boundary에서는 Java class name 대신 versioned protocol error code/status와 safe details로 다시 번역합니다."],
    },
    {
      id: "retry-only-at-transient-idempotent-boundaries",
      title: "retry는 transient·idempotent·bounded 조건이 모두 맞는 소유 boundary에서만 수행합니다",
      lead: "catch하면 무조건 다시 호출하는 loop를 버리고 시도 횟수·deadline·backoff·최종 cause·불확실한 결과를 계약화합니다.",
      explanations: [
        "retry는 recovery 전략이지 exception 일반 처리법이 아닙니다. timeout, temporary unavailable, rate limit 같은 transient failure만 후보이며 validation, authentication, null bug, deterministic format failure는 같은 input으로 반복해도 낫지 않습니다.",
        "operation이 idempotent하거나 idempotency key/transaction으로 중복 effect를 통제해야 합니다. 결제 request가 server에서 성공했지만 response만 끊긴 경우 무조건 retry하면 이중 결제가 될 수 있습니다.",
        "max attempts와 전체 deadline을 함께 둡니다. 각 attempt timeout만 있고 전체 deadline이 없으면 nested retries가 latency budget을 폭발시킬 수 있습니다.",
        "backoff는 exponential delay와 jitter를 사용해 동시 clients의 retry storm을 줄일 수 있습니다. 교육 예제는 sleep 대신 결정적 delay plan을 기록해 test를 빠르고 exact하게 유지합니다.",
        "retry owner는 operation 의미와 idempotency를 아는 상위 boundary여야 합니다. HTTP client, repository, service가 모두 독립 retry하면 multiplicative attempts와 duplicate side effects가 생깁니다.",
        "마지막 실패는 retry exhausted domain exception에 cause로 보존하고 total attempts와 operation을 diagnostics에 남깁니다. 중간 failures를 전부 error log로 쌓아 alert storm을 만들지 않습니다.",
        "cancellation/interrupt를 retryable failure로 삼키지 않습니다. caller deadline/cancel signal을 확인하고 즉시 중단하며 InterruptedException을 다루는 자세한 propagation은 다음 세션에 연결합니다.",
      ],
      concepts: [
        { term: "transient failure", definition: "같은 operation을 잠시 뒤 다시 시도하면 성공할 가능성이 있는 일시적 실패입니다.", detail: ["type만으로 충분하지 않을 수 있습니다.", "server code/context를 함께 봅니다."] },
        { term: "idempotency", definition: "같은 logical request를 여러 번 적용해도 최종 effect가 한 번 적용한 것과 같은 성질 또는 보호 protocol입니다.", detail: ["retry 안전성의 핵심입니다.", "idempotency key/transaction이 필요할 수 있습니다."] },
        { term: "retry budget", definition: "max attempts·deadline·per-attempt timeout·backoff가 공유하는 제한입니다.", detail: ["무한 retry를 막습니다.", "nested layers가 한 budget을 공유해야 합니다."] },
      ],
      codeExamples: [{
        id: "java-bounded-retry-policy",
        title: "두 transient failures 뒤 성공하고 permanent validation은0회 호출합니다",
        language: "java",
        filename: "BoundedRetryPolicy.java",
        purpose: "attempt cap과 deterministic backoff plan, non-retry validation boundary를 실행합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.List;

public class BoundedRetryPolicy {
    static final class TransientStoreException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        TransientStoreException(String message) { super(message); }
    }

    static final class FakeStore {
        int attempts;
        String read() {
            attempts++;
            if (attempts < 3) throw new TransientStoreException("temporary");
            return "ready";
        }
    }

    static String readWithRetry(String key, FakeStore store, List<Integer> delays) {
        if (key == null || key.isBlank()) throw new IllegalArgumentException("KEY_REQUIRED");
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                return store.read();
            } catch (TransientStoreException failure) {
                if (attempt == 3) throw failure;
                delays.add(100 * attempt);
            }
        }
        throw new IllegalStateException("unreachable");
    }

    public static void main(String[] args) {
        FakeStore successStore = new FakeStore();
        List<Integer> delays = new ArrayList<>();
        System.out.println("success=" + readWithRetry("item-1", successStore, delays));
        System.out.println("attempts=" + successStore.attempts);
        System.out.println("delays=" + delays);

        FakeStore invalidStore = new FakeStore();
        try {
            readWithRetry(" ", invalidStore, new ArrayList<>());
        } catch (IllegalArgumentException failure) {
            System.out.println("invalid=" + failure.getMessage());
            System.out.println("invalidAttempts=" + invalidStore.attempts);
        }
    }
}`,
        walkthrough: [
          { lines: "1-17", explanation: "transient type과 세 번째에 성공하는 deterministic fake store를 만듭니다." },
          { lines: "19-30", explanation: "validation을 retry 밖에서 수행하고 max3·delays100/200의 bounded policy를 구현합니다." },
          { lines: "32-46", explanation: "transient success와 blank permanent failure의 store attempt count를 각각 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("BoundedRetryPolicy.java", "BoundedRetryPolicy") },
        output: { value: "success=ready\nattempts=3\ndelays=[100, 200]\ninvalid=KEY_REQUIRED\ninvalidAttempts=0", explanation: ["두 transient failures 후 세 번째가 성공하고 delay plan 두 개가 남습니다.", "blank key는 store를 한 번도 호출하지 않는 permanent validation입니다."] },
        experiments: [
          { change: "FakeStore가 write side effect 후 response exception을 던지게 합니다.", prediction: "idempotency protection 없이는 retry마다 side effect가 중복됩니다.", result: "transient type만 보고 retry하면 안 됩니다." },
          { change: "attempt cap을 while(true)로 바꿉니다.", prediction: "permanent outage에서 영원히 resource를 점유합니다.", result: "attempt/deadline/cancel budget은 필수입니다." },
        ],
        sourceRefs: ["java-runtime-exception-api", "aws-retry-backoff", "http-idempotent-methods", "jls-try-statement"],
      }],
      diagnostics: [
        { symptom: "장애 때 downstream 호출 수가 폭발한다.", likelyCause: "client/repository/service 각 layer가 독립 retry해 attempts가 곱해졌습니다.", checks: ["layer별 retry config를 inventory합니다.", "한 request total attempts를 trace합니다.", "deadline propagation을 확인합니다."], fix: "operation semantics를 아는 한 owner가 shared budget으로 retry하고 아래 layers retry를 끕니다.", prevention: "load/failure injection test에서 total attempts와 concurrency를 assert합니다." },
        { symptom: "timeout retry 후 중복 주문/결제가 생긴다.", likelyCause: "결과 불확실 operation을 idempotency 없이 재호출했습니다.", checks: ["server commit과 response failure 순서를 봅니다.", "idempotency key/unique constraint를 확인합니다.", "조회/조정 API가 있는지 봅니다."], fix: "stable request key, deduplication/transaction, ambiguous outcome reconciliation을 설계합니다.", prevention: "retry 허용 표에 operation idempotency와 uncertain-outcome policy를 필수로 둡니다." },
      ],
      expertNotes: ["circuit breaker와 retry는 목적이 다릅니다. breaker는 failing dependency 호출을 빠르게 차단하고 retry는 제한된 재시도를 합니다.", "jitter random test는 seed/clock를 주입해 range/invariant를 검증하고 exact production delay 값을 고정하지 않습니다."],
    },
    {
      id: "narrow-try-and-state-atomicity",
      title: "try 범위를 실패 operation에 맞추고 validate→compute→commit 순서로 partial state를 막습니다",
      lead: "catch는 이미 수행된 assignment·출력·DB write를 되돌리지 않으므로 mutation 전 candidate를 완성합니다.",
      explanations: [
        "exception은 control flow를 이동하지만 memory/DB/file side effects를 자동 rollback하지 않습니다. try 앞이나 failure 전 수행된 mutation은 그대로 남습니다.",
        "큰 try 안에서 parse, validate, mutate, notify를 모두 수행하고 catch(RuntimeException)하면 어느 단계 실패인지 모호하고 partial state가 caller에게 노출됩니다.",
        "먼저 external input을 local value로 parse하고 range/invariant를 validate한 뒤 candidate state를 계산합니다. 모든 실패 가능 검사를 통과한 마지막 단계에서 field/aggregate를 한 번 commit합니다.",
        "Math.addExact는 int overflow를 ArithmeticException으로 알려 silent wraparound를 막습니다. 이 expected arithmetic failure를 domain InvalidUpdateException으로 번역하면서 cause를 보존할 수 있습니다.",
        "여러 aggregate/DB records가 함께 바뀌면 local ordering만으로 원자성을 보장하지 못합니다. transaction/locking/optimistic version과 compensation을 설계해야 합니다.",
        "catch 후 object invariant가 무엇인지 명시합니다. update failure 뒤 points가 이전 값과 같다는 test처럼 failure postcondition을 success result만큼 중요하게 검증합니다.",
        "retry와 state mutation을 결합할 때 각 attempt가 clean state에서 시작하거나 transaction rollback되어야 합니다. partial mutation 뒤 같은 object를 retry하면 input은 같아도 결과가 달라질 수 있습니다.",
      ],
      concepts: [
        { term: "narrow try scope", definition: "동일한 recovery/translation 대상이 되는 최소 operation만 try로 감싸는 구조입니다.", detail: ["failure source를 명확히 합니다.", "unexpected bugs 오분류를 줄입니다."] },
        { term: "validate-compute-commit", definition: "입력과 candidate를 local에서 완성한 뒤 마지막에 shared/domain state를 한 번 변경하는 순서입니다.", detail: ["partial mutation을 줄입니다.", "multi-resource transaction을 대체하지는 않습니다."] },
        { term: "failure postcondition", definition: "operation이 실패했을 때 object/DB/output가 어떤 상태로 남아야 하는지 정한 계약입니다.", detail: ["unchanged/rolled-back/unknown을 구분합니다.", "negative tests로 검증합니다."] },
      ],
      codeExamples: [{
        id: "java-atomic-account-update",
        title: "parse·overflow·range를 commit 전에 처리해 failure 뒤 points를 유지합니다",
        language: "java",
        filename: "AtomicAccountUpdate.java",
        purpose: "exception translation과 validate-compute-commit의 failure postcondition을 실행합니다.",
        code: String.raw`public class AtomicAccountUpdate {
    static final class InvalidUpdateException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        InvalidUpdateException(String message) { super(message); }
        InvalidUpdateException(String message, Throwable cause) { super(message, cause); }
    }

    static final class Account {
        private int points = 10;

        void add(String rawDelta) {
            final int delta;
            try {
                delta = Integer.parseInt(rawDelta);
            } catch (NumberFormatException cause) {
                throw new InvalidUpdateException("NOT_INTEGER", cause);
            }
            final int candidate;
            try {
                candidate = Math.addExact(points, delta);
            } catch (ArithmeticException cause) {
                throw new InvalidUpdateException("OVERFLOW", cause);
            }
            if (candidate < 0) throw new InvalidUpdateException("NEGATIVE");
            points = candidate;
        }

        int points() { return points; }
    }

    public static void main(String[] args) {
        Account account = new Account();
        account.add("5");
        System.out.println("afterSuccess=" + account.points());
        for (String input : new String[] {"-30", "x"}) {
            try {
                account.add(input);
            } catch (InvalidUpdateException failure) {
                System.out.println("rejected=" + failure.getMessage() + ":state=" + account.points());
            }
        }
    }
}`,
        walkthrough: [
          { lines: "1-6", explanation: "domain failure가 cause 유무를 모두 표현하는 constructors를 갖습니다." },
          { lines: "8-29", explanation: "Account가 parse와 exact arithmetic을 각각 좁게 번역하고 range 검사 뒤 마지막 field assignment만 commit하며 조회 access를 제공합니다." },
          { lines: "31-42", explanation: "정상+5 뒤 negative와 text failures 모두 state15 유지 postcondition을 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("AtomicAccountUpdate.java", "AtomicAccountUpdate") },
        output: { value: "afterSuccess=15\nrejected=NEGATIVE:state=15\nrejected=NOT_INTEGER:state=15", explanation: ["success만 points를10→15로 commit합니다.", "두 failures는 candidate 이전/validation 단계라 state15를 유지합니다."] },
        experiments: [
          { change: "points += delta를 range 검사 전에 실행합니다.", prediction: "negative failure 뒤 object가 이미 invalid negative state가 됩니다.", result: "catch는 field mutation을 되돌리지 않습니다." },
          { change: "두 narrow catches를 전체 method catch(RuntimeException) 하나로 합칩니다.", prediction: "parse·overflow·programming bug가 같은 code로 번역될 수 있습니다.", result: "try 범위와 caught type이 failure taxonomy precision을 결정합니다." },
        ],
        sourceRefs: ["java-number-format-api", "java-math-add-exact", "jls-abrupt-completion", "effective-java-exceptions"],
      }],
      diagnostics: [
        { symptom: "update가 실패했는데 field 일부가 바뀌어 있다.", likelyCause: "validation/throw 가능 operation 전에 shared state를 먼저 mutation했습니다.", checks: ["failure 지점 전 assignments를 찾습니다.", "failure postcondition을 기록합니다.", "transaction boundary를 확인합니다."], fix: "local candidate를 validate/compute한 뒤 마지막에 commit하거나 transaction rollback을 사용합니다.", prevention: "모든 negative case에서 before/after state equality를 assert합니다." },
        { symptom: "catch가 어느 statement의 NPE인지 구분하지 못한다.", likelyCause: "parse부터 notify까지 큰 try를 catch(RuntimeException)으로 감쌌습니다.", checks: ["try 안 failure-capable calls를 나열합니다.", "stack first app frame을 봅니다.", "recovery action이 실제로 같은지 확인합니다."], fix: "operation/recovery 단위로 try를 좁히고 expected types만 번역합니다.", prevention: "try block line count보다 semantic operation count를 review합니다." },
      ],
      expertNotes: ["immutable aggregate/value objects는 실패 전에 새 candidate를 만들고 success 때 reference를 교체해 atomic reasoning을 더 쉽게 합니다.", "external side effect 이후 failure는 local state reset만으로 복구되지 않아 outbox/saga/idempotency가 필요할 수 있습니다."],
    },
    {
      id: "negative-compiler-contracts-for-exceptions",
      title: "checked 의무·catch 도달성·multi-catch 제약을 seven independent compiler contracts로 고정합니다",
      lead: "주석 처리된 잘못된 예제가 아니라 result false·ERROR1·line·OpenJDK21 code가 맞는지 실제 javac task로 검증합니다.",
      explanations: [
        "checked-call은 FileInputStream constructor의 FileNotFoundException을 catch/declare하지 않아 compiler가 거부합니다. checked-throw도 new Exception을 method 밖으로 던지면서 선언하지 않아 같은 unreported code를 냅니다.",
        "parent-first는 catch(Exception) 뒤 catch(RuntimeException)이 이미 잡힌 type이라 unreachable입니다. compiler.err.except.already.caught로 source order contract를 고정합니다.",
        "related-multicatch는 FileNotFoundException이 IOException subtype이라 alternatives가 disjoint하지 않습니다. multicatch-assign은 implicitly-final handler parameter에 재대입해 별도 code로 실패합니다.",
        "checked-never-thrown은 try body가 IOException을 던질 수 없는데 그 checked type을 catch해 실패합니다. RuntimeException/Exception catch의 reachability rules와 다를 수 있으므로 fixture를 섞지 않습니다.",
        "generic Throwable subclasses는 금지됩니다. erased/catch type safety 때문에 Problem<T> extends Exception을 compiler.err.generic.throwable로 거부하며 serial warning이 섞이지 않도록 serialVersionUID도 fixture에 둡니다.",
        "각 task는 in-memory source와 별도 -d directory를 사용해 partial artifacts/classpath가 다음 case를 오염시키지 않게 합니다. diagnostics total1·ERROR1도 함께 확인합니다.",
        "diagnostic code는 JLS portable 이름이 아니라 OpenJDK21.0.11 regression key입니다. vendor/version upgrade에서는 semantic rule, source line, code를 다시 감사합니다.",
      ],
      concepts: [
        { term: "catch-or-declare", definition: "checked exception을 발생시킬 수 있는 code가 handler로 잡거나 method/constructor throws clause로 전달해야 하는 compile-time 의무입니다.", detail: ["unchecked에는 강제되지 않습니다.", "다음 세션에서 propagation을 확장합니다."] },
        { term: "exception reachability analysis", definition: "try가 어떤 checked exceptions를 throw할 수 있고 catch가 앞 handler에 가려지는지 compiler가 판정하는 분석입니다.", detail: ["unreachable/never-thrown catches를 거부합니다.", "unchecked types에는 특별 규칙이 있습니다."] },
        { term: "compiler diagnostic contract", definition: "expected-invalid source가 특정 kind/count/line/code로 실패해야 한다는 version-pinned executable test입니다.", detail: ["compiled=false만으로 부족합니다.", "case별 output directory를 격리합니다."] },
      ],
      codeExamples: [{
        id: "java-exception-compiler-contracts",
        title: "checked·ordering·multi-catch·generic Throwable seven failures를 격리 compile합니다",
        language: "java",
        filename: "ExceptionCompilerContracts.java",
        purpose: "OpenJDK21의 exception compile-time rules를 exactly-one expected diagnostic으로 검증합니다.",
        code: String.raw`import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;

public class ExceptionCompilerContracts {
    record Case(String id, String type, String source, long line, String code) {}

    static final class Unit extends SimpleJavaFileObject {
        private final String source;
        Unit(String type, String source) {
            super(URI.create("string:///" + type + ".java"), Kind.SOURCE);
            this.source = source;
        }
        @Override public CharSequence getCharContent(boolean ignored) { return source; }
    }

    static List<Case> cases() {
        return List.of(
            new Case("checked-call", "T01", "import java.io.*;\npublic class T01 { void f() { new FileInputStream(\"x\"); } }\n", 2, "compiler.err.unreported.exception.need.to.catch.or.throw"),
            new Case("parent-first", "T02", "public class T02 { void f() {\n try { System.out.println(1); } catch (Exception e) {} catch (RuntimeException e) {}\n} }\n", 2, "compiler.err.except.already.caught"),
            new Case("related-multicatch", "T03", "import java.io.*;\npublic class T03 { void f() { try { throw new FileNotFoundException(); }\n catch (IOException | FileNotFoundException e) {} } }\n", 3, "compiler.err.multicatch.types.must.be.disjoint"),
            new Case("multicatch-assign", "T04", "import java.io.*; import java.sql.*;\npublic class T04 { static void g() throws IOException, SQLException {}\n void f() { try { g(); } catch (IOException | SQLException e) { e = new IOException(); } } }\n", 3, "compiler.err.multicatch.parameter.may.not.be.assigned"),
            new Case("checked-never-thrown", "T05", "import java.io.*;\npublic class T05 { void f() {\n try { System.out.println(1); } catch (IOException e) {}\n} }\n", 3, "compiler.err.except.never.thrown.in.try"),
            new Case("checked-throw", "T06", "public class T06 { void f() {\n throw new Exception();\n} }\n", 2, "compiler.err.unreported.exception.need.to.catch.or.throw"),
            new Case("generic-throwable", "T07", "public class T07 {\n static class Problem<T> extends Exception { private static final long serialVersionUID = 1L; }\n}\n", 2, "compiler.err.generic.throwable")
        );
    }

    public static void main(String[] args) throws Exception {
        Path base = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = Files.createTempDirectory(base, "exception-contracts-").toAbsolutePath().normalize();
        if (!root.getParent().equals(base)) throw new IllegalStateException("unsafe temp root");
        try {
            for (Case test : cases()) {
                Path output = Files.createDirectory(root.resolve(test.id()));
                DiagnosticCollector<JavaFileObject> collector = new DiagnosticCollector<>();
                Boolean compiled = ToolProvider.getSystemJavaCompiler().getTask(
                    null, null, collector,
                    List.of("--release", "21", "-proc:none", "-Xlint:all", "-d", output.toString()),
                    null, List.of(new Unit(test.type(), test.source()))
                ).call();
                List<Diagnostic<? extends JavaFileObject>> errors = new ArrayList<>();
                for (Diagnostic<? extends JavaFileObject> item : collector.getDiagnostics()) {
                    if (item.getKind() == Diagnostic.Kind.ERROR) errors.add(item);
                }
                if (compiled || collector.getDiagnostics().size() != 1 || errors.size() != 1) {
                    throw new IllegalStateException(test.id() + " diagnostic count drift");
                }
                Diagnostic<? extends JavaFileObject> error = errors.get(0);
                if (error.getLineNumber() != test.line() || !error.getCode().equals(test.code())) {
                    throw new IllegalStateException(test.id() + " diagnostic identity drift");
                }
                System.out.println(test.id() + "=false|1|" + error.getLineNumber() + "|" + error.getCode());
            }
        } finally {
            if (!root.getParent().equals(base)) throw new IllegalStateException("unsafe cleanup");
            try (var paths = Files.walk(root)) {
                for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.deleteIfExists(path);
            }
            if (Files.exists(root)) throw new IllegalStateException("cleanup failed");
        }
    }
}`,
        walkthrough: [
          { lines: "1-23", explanation: "in-memory source object와 expected diagnostic Case record를 정의합니다." },
          { lines: "25-34", explanation: "seven checked/order/multi-catch/generic Throwable fixtures와 line/code를 고정합니다." },
          { lines: "37-40", explanation: "normalized OS temp direct child와 parent boundary를 만듭니다." },
          { lines: "42-62", explanation: "case별 -d와 JavaCompiler task로 false·diagnostics1·ERROR1·line/code를 assert하고 result를 출력합니다." },
          { lines: "63-71", explanation: "reverse-order cleanup과 root residue absence를 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21.0.11 full JDK"], command: isolatedJavaRun("ExceptionCompilerContracts.java", "ExceptionCompilerContracts") },
        output: { value: "checked-call=false|1|2|compiler.err.unreported.exception.need.to.catch.or.throw\nparent-first=false|1|2|compiler.err.except.already.caught\nrelated-multicatch=false|1|3|compiler.err.multicatch.types.must.be.disjoint\nmulticatch-assign=false|1|3|compiler.err.multicatch.parameter.may.not.be.assigned\nchecked-never-thrown=false|1|3|compiler.err.except.never.thrown.in.try\nchecked-throw=false|1|2|compiler.err.unreported.exception.need.to.catch.or.throw\ngeneric-throwable=false|1|2|compiler.err.generic.throwable", explanation: ["seven tasks는 모두 compile false와 exactly one ERROR입니다.", "checked call/throw는 같은 code지만 서로 다른 source situations입니다.", "ordering·multi-catch·generic Throwable은 각기 다른 compiler rules입니다."] },
        experiments: [
          { change: "parent-first catch 순서를 RuntimeException→Exception으로 바꿉니다.", prediction: "그 fixture는 compile success가 되어 negative harness가 실패합니다.", result: "most-specific-first ordering 교정이 실제 compiler rule을 만족합니다." },
          { change: "checked-call method에 throws FileNotFoundException을 추가합니다.", prediction: "catch-or-declare 의무가 충족되어 compile success가 됩니다.", result: "propagation choice는 다음 세션에서 caller chain과 함께 확장합니다." },
        ],
        sourceRefs: ["java-compiler-api", "java-diagnostic-api", "java-files-api", "jls-exception-checking", "jls-catch-clauses", "jls-multicatch", "jls-generic-throwable"],
      }],
      diagnostics: [
        { symptom: "negative test가 다른 parser 오류로 실패해도 통과한다.", likelyCause: "compiled false만 확인했습니다.", checks: ["diagnostics total/ERROR count를 봅니다.", "public type/filename을 맞춥니다.", "expected line/code를 확인합니다."], fix: "exactly-one ERROR·line·version-pinned code를 모두 assert합니다.", prevention: "source와 expectation을 같은 immutable Case에 둡니다." },
        { symptom: "JDK upgrade 후 code 문자열만 달라 suite가 실패한다.", likelyCause: "OpenJDK diagnostic key를 portable JLS contract로 취급했습니다.", checks: ["vendor/version을 기록합니다.", "semantic compile result와 line을 먼저 확인합니다.", "release notes를 봅니다."], fix: "semantic rule을 재검증한 뒤 implementation code baseline을 의도적으로 갱신합니다.", prevention: "diagnostic tests에 toolchain pin과 upgrade audit 절차를 둡니다." },
      ],
      expertNotes: ["JavaCompiler가 null이면 JRE-only runtime일 수 있으므로 full JDK precondition을 fail-fast로 진단합니다.", "compile-fail fixtures는 production source set에 섞지 않고 in-memory/test-resource source와 isolated outputs를 사용합니다."],
    },
  ],
  lab: {
    title: "실패를 숨기는 점수 업로드 CLI를 typed outcome·cause·bounded retry 구조로 재설계합니다",
    scenario: "LegacyScoreUploader는 Scanner.nextInt를 무한 loop에서 읽고 모든 코드를 catch(Exception) 하나로 감쌉니다. 문자·0·range·null·repository timeout·developer bug를 모두 ‘다시 시도’로 처리하며 catch body는 raw exception을 화면에 출력합니다. repository IOException은 cause 없이 UploadException으로 바뀌고 각 layer가 log 후 rethrow합니다. upload는 idempotency key 없이 재시도되어 중복 저장될 수 있습니다. 목표는 input, domain, transient, unexpected failure를 분류하고 사용자/개발자 channels, translation, atomic state, retry ownership을 executable contracts로 만드는 것입니다.",
    setup: [
      "OpenJDK21.0.11 full JDK와 PowerShell7+를 사용하고 모든 positive compile에 -encoding UTF-8 --release21 -proc:none -Xlint:all -d isolated를 적용합니다.",
      "OS temp 아래 공백 포함 GUID direct child를 만들고 original package/scope, positive examples, negative fixtures output을 분리합니다.",
      "실제 사용자·파일·endpoint·token 대신 user-1, score-7, store.test 같은 synthetic identifiers만 사용합니다.",
      "before matrix에 raw input, thrown type, catch owner, state mutation, stdout/stderr, retry count, final exit를 기록합니다.",
      "ScoreParseResult와 UploadResult는 success/value/errorCode/attempts/reference를 가진 immutable records로 설계합니다.",
    ],
    steps: [
      "class08 package8/scope3 original audit를 실행해 compiler output0, mains8|3, direct outputs, Ex02/Ex04 exit1 baseline을 재현합니다.",
      "Scanner boundary는 hasNext/attempt cap/cancel/EOF를 처리하고 InputMismatch 뒤 offending token을 정확히 한 번 소비합니다.",
      "required·range·zero 같은 expected input conditions를 exception 정상분기 대신 validation codes로 만듭니다.",
      "NumberFormat/InputMismatch 같은 user-correctable failures, domain conflict, transient store, programming RuntimeException을 taxonomy 표로 분리합니다.",
      "repository IOException을 UploadStoreException(code, cause)으로 좁게 번역하고 source stack/cause identity를 test합니다.",
      "parse·validate·candidate compute 뒤에만 aggregate와 repository commit을 수행해 failure postcondition state-unchanged를 보장합니다.",
      "upload request에 idempotency key를 넣고 transient type만 max3·deadline·backoff plan 아래 한 service boundary에서 retry합니다.",
      "validation/authorization/null/cancellation과 ambiguous committed response를 같은 retry policy에서 제외합니다.",
      "사용자 response에는 safe localized action+reference, developer record에는 error code·type·operation·sanitized id·Throwable을 한 번 기록합니다.",
      "specific catches를 child-before-parent로 정렬하고 동일 policy의 unrelated alternatives만 multi-catch로 합칩니다.",
      "success, invalid token, zero/range, EOF, transient success/exhaustion, duplicate key, unexpected bug를 behavior/state/attempt/log tests로 검증합니다.",
      "seven negative compiler tasks와 privacy/residue scan을 실행하고 launcher options를 복원한 뒤 temp direct child만 삭제합니다.",
    ],
    expectedResult: [
      "입력 실패는 REQUIRED·NOT_INTEGER·OUT_OF_RANGE·EOF codes로 caller-visible하며 Scanner cursor가 반복 실패하지 않습니다.",
      "repository failure는 domain code와 IOException cause/stack을 함께 보존하고 raw implementation type은 public API에 새지 않습니다.",
      "실패 paths에서 score state와 저장 count가 unchanged이고 success에서만 한 번 commit됩니다.",
      "transient idempotent upload만 최대3회 재시도하고 validation은 store attempts0, ambiguous outcome은 reconciliation으로 분기합니다.",
      "사용자는 internal class/path/stack 없이 다음 행동과 reference를 받고 운영자는 같은 reference로 한 structured diagnostic을 찾습니다.",
      "positive exact outputs, compiler negatives, state invariants, retry counts, privacy, temp cleanup이 모두 자동 검증됩니다.",
    ],
    cleanup: [
      "모든 child process가 timeout이면 tree를 kill하고 stdout/stderr tasks를 회수한 뒤 실패시킵니다.",
      "saved JDK launcher variables를 finally에서 원값으로 복원하고 child environments에도 남지 않았는지 검증합니다.",
      "resolved root parent가 normalized OS temp base와 정확히 같은지 확인한 뒤 GUID direct child만 reverse-order 삭제합니다.",
      "workspace .class, temp verifier, actual path/name/token, raw stack public snapshot이0인지 검사합니다.",
    ],
    extensions: [
      "CompletionStage 실패에서 CompletionException cause unwrap과 correlation context propagation을 추가합니다.",
      "circuit breaker·bulkhead·retry가 하나의 deadline/attempt budget을 공유하도록 failure injection load test를 만듭니다.",
      "database transaction과 outbox로 upload commit·event publish의 partial failure를 제거합니다.",
      "OpenTelemetry span status와 exception events에 bounded code·sanitized attributes를 연결하고 sampling/retention을 설계합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "Ex01의 배열 예외 흐름을 before/failure/catch/after markers와 specific catch로 재현합니다.",
      requirements: ["length3 array에 index0~2는 exact 출력하고 index3 assignment에서 실패시킵니다.", "failure statement 뒤 marker가 출력되지 않음을 검증합니다.", "catch는 ArrayIndexOutOfBoundsException type만 잡고 raw message 대신 simple type을 출력합니다.", "catch 뒤 outer marker는 출력되어야 합니다.", "wrong catch type fixture는 uncaught exit1·stderr shape로 별도 process 검증합니다."],
      hints: ["array assignment의 bounds check가 println보다 먼저입니다.", "exception line 자체가 정상 완료되지 않는다는 점을 output에 반영합니다.", "JDK message 전체보다 type/flow를 안정 contract로 둡니다."],
      expectedOutcome: "합법 values→specific catch→after 순서가 exact하고 failure 뒤 try marker는 없으며 handler mismatch는 nonzero로 관찰됩니다.",
      solutionOutline: ["marker 위치를 설계합니다.", "specific handler를 구현합니다.", "exact output을 고정합니다.", "uncaught case를 fresh JVM으로 분리합니다."],
    },
    {
      difficulty: "응용",
      prompt: "Ex03·Ex05를 bounded input parser로 통합하고 broad catch와 exception-normal-flow를 제거합니다.",
      requirements: ["문자 token은 InputMismatch catch에서 한 번 소비하고 max3 attempts를 지킵니다.", "zero/range는 division exception을 일으키기 전 normal validation code로 처리합니다.", "EOF를 INVALID와 다른 outcome으로 반환합니다.", "NumberFormat/InputMismatch 이외 RuntimeException은 generic user error로 삼키지 않습니다.", "safe user message와 developer diagnostic record를 분리합니다.", "x→0→5, empty, valid-first, unexpected bug cases를 exact/state tests로 검증합니다."],
      hints: ["Scanner cursor와 attempt counter를 같은 trace에 출력합니다.", "0은 합법 int지만 divisor로 금지된 domain condition입니다.", "error code와 localized message를 분리합니다."],
      expectedOutcome: "invalid input마다 정확한 action/code가 있고 retry가 종료되며 internal bugs는 stack/cause를 잃지 않고 failure boundary로 전파됩니다.",
      solutionOutline: ["failure taxonomy를 작성합니다.", "cursor-aware loop를 구현합니다.", "validation result를 추가합니다.", "diagnostic channels와 process tests를 연결합니다."],
    },
    {
      difficulty: "설계",
      prompt: "외부 결제 승인 API의 exception translation·idempotency·retry·observability 계약을 production 수준으로 설계합니다.",
      requirements: ["validation, authorization, insufficient funds, timeout, rate limit, dependency outage, ambiguous commit, programming bug를 분류합니다.", "vendor exceptions를 domain typed codes로 번역하고 original cause/first application frame을 보존합니다.", "idempotency key·unique constraint·status reconciliation로 duplicate charge를 막습니다.", "max attempts·per-attempt timeout·overall deadline·jitter·cancel을 하나의 retry owner에 둡니다.", "validate-compute-commit과 DB transaction/outbox failure postconditions를 정의합니다.", "public response, support reference, structured secure log, metrics bounded code를 분리합니다.", "behavior/state/failure injection/compiler/privacy/compatibility tests와 rollback plan을 작성합니다."],
      hints: ["timeout은 실패가 아니라 결과 unknown일 수 있습니다.", "HTTP status 하나가 retryability를 완전히 결정하지 않을 수 있습니다.", "모든 layer log+retry를 제거하고 단일 owners를 지정합니다."],
      expectedOutcome: "중복 결제 없이 caller action별 failure가 안정 codes로 전달되고, root evidence와 safe public experience, bounded recovery가 함께 검증됩니다.",
      solutionOutline: ["failure/action matrix를 만듭니다.", "translation boundary를 정의합니다.", "idempotency/reconciliation을 설계합니다.", "retry budget과 telemetry를 연결합니다.", "failure injections와 migration을 완성합니다."],
    },
  ],
  reviewQuestions: [
    { question: "모든 Java 예외의 최상위 type은 무엇인가요?", answer: "Throwable입니다. Java 표준 API의 핵심 직접 두 갈래는 Error와 Exception이고 RuntimeException은 Exception의 subclass입니다. 사용자 type이 Throwable을 직접 상속하는 것도 가능하지만 일반 API 설계에서는 보통 Exception 계열을 사용합니다." },
    { question: "checked exception은 무엇인가요?", answer: "RuntimeException 계열과 Error 계열이 아닌 Throwable 계열로 compiler가 catch 또는 throws를 요구하는 type입니다." },
    { question: "unchecked이면 무시해도 되나요?", answer: "아닙니다. compiler가 강제하지 않을 뿐 public precondition·failure state·tests·diagnostics는 필요합니다." },
    { question: "Error를 catch(Exception)으로 잡을 수 있나요?", answer: "아닙니다. Error와 Exception은 Throwable 아래 sibling입니다. catch(Throwable)는 가능하지만 일반 business recovery에는 부적합합니다." },
    { question: "Ex01에서 index5 assignment 뒤 println이 실행되나요?", answer: "아닙니다. array access/assignment evaluation이 abrupt completion되어 그 statement와 try의 나머지를 건너뜁니다." },
    { question: "catch가 정상 끝나면 try/catch 다음 문장은 실행되나요?", answer: "return/throw 같은 다른 abrupt completion이 없다면 실행됩니다. Ex01의 수고 문장이 예입니다." },
    { question: "여러 catch 중 몇 개가 실행되나요?", answer: "thrown object와 assignment-compatible한 source-order 첫 catch 하나만 실행됩니다." },
    { question: "왜 child catch를 parent보다 먼저 두나요?", answer: "parent가 앞에 있으면 child values를 전부 이미 잡아 뒤 child catch가 unreachable compile error가 되기 때문입니다." },
    { question: "catch(Exception)를 마지막에 항상 둬야 하나요?", answer: "아닙니다. 실제 복구 가능한 예상 failure가 있는 경우만 두며 예상 못 한 bug를 성공으로 숨기지 않습니다." },
    { question: "multi-catch는 언제 적합한가요?", answer: "서로 unrelated한 exception types가 user message·retry·state cleanup 등 완전히 같은 handler policy를 가질 때입니다." },
    { question: "FileNotFoundException | IOException multi-catch가 왜 실패하나요?", answer: "FileNotFoundException이 IOException subtype이라 alternatives가 disjoint하지 않고 redundant하기 때문입니다." },
    { question: "multi-catch parameter에 새 exception을 대입할 수 있나요?", answer: "아닙니다. parameter는 implicitly final입니다." },
    { question: "Scanner.nextInt 문자 실패 뒤 token은 자동 소비되나요?", answer: "보통 남아 있어 같은 read가 다시 실패할 수 있으므로 input policy에 맞게 next 또는 nextLine으로 소비해야 합니다." },
    { question: "catch가 실행되면 loop가 자동 재시도하나요?", answer: "아닙니다. try/catch와 loop/continue 배치가 retry control flow를 명시해야 합니다." },
    { question: "EOF와 invalid token은 같은가요?", answer: "아닙니다. EOF는 stream 종료 outcome이고 invalid token은 값 형식 오류라 recovery와 message가 다릅니다." },
    { question: "integer와 double의0 나눗셈은 같은가요?", answer: "integer divisor0은 ArithmeticException이고 floating0.0은 Infinity 또는 NaN을 만들 수 있습니다." },
    { question: "NullPointerException message를 program logic으로 parse해도 되나요?", answer: "권장하지 않습니다. JDK/표현식에 따라 달라질 수 있어 type, explicit validation, stable code를 사용합니다." },
    { question: "빈 catch의 가장 큰 문제는 무엇인가요?", answer: "실패 evidence와 state uncertainty를 숨겨 exit0 false success를 만든다는 점입니다." },
    { question: "예상 가능한 range/zero를 exception으로 분기해야 하나요?", answer: "자주 기대되는 user/domain condition이면 if 또는 typed result로 명시하는 편이 의도와 성능이 낫습니다." },
    { question: "sentinel0이 왜 위험한가요?", answer: "0이 합법 값일 수 있어 success와 failure를 구분하지 못하므로 tagged result 또는 exception을 사용합니다." },
    { question: "stack trace는 어디부터 읽나요?", answer: "outer type/message를 확인하고 첫 application-owned frame, Caused by chain, deepest application frame 순으로 읽습니다." },
    { question: "exception translation에서 cause가 왜 필요한가요?", answer: "상위 context를 추가하면서 원래 type·message·frames를 잃지 않기 위해서입니다." },
    { question: "root cause만 log하면 충분한가요?", answer: "아닙니다. outer exceptions의 operation/entity context도 중요해 chain 전체 의미를 보존합니다." },
    { question: "사용자에게 exception.toString을 보여 줘도 되나요?", answer: "안 됩니다. internal class/path/input/secret이 노출될 수 있어 safe localized action message와 reference만 제공합니다." },
    { question: "개발자 log에는 무엇을 남기나요?", answer: "bounded error code, operation, correlation, sanitized context, exception type, stack/cause를 secure sink에 한 번 기록합니다." },
    { question: "각 layer에서 log하고 rethrow하면 왜 나쁜가요?", answer: "한 failure가 duplicate stack/alerts가 되고 signal-to-noise가 낮아지므로 final observation owner를 정해야 합니다." },
    { question: "exception translation은 어디서 하나요?", answer: "file/SQL/vendor 같은 implementation vocabulary에서 domain/service vocabulary로 abstraction이 실제 바뀌는 좁은 boundary에서 합니다." },
    { question: "모든 low-level failure를 DomainException 하나로 바꾸면 되나요?", answer: "아닙니다. caller action이 다른 not-found·validation·transient·conflict·bug categories를 유지해야 합니다." },
    { question: "어떤 exception을 retry하나요?", answer: "같은 시도가 나아질 transient failure이며 operation이 idempotent/중복 보호되고 attempt·deadline·cancel 제한이 있을 때만 합니다." },
    { question: "timeout은 항상 안전하게 retry 가능한가요?", answer: "아닙니다. server commit 뒤 response만 끊긴 ambiguous outcome일 수 있어 idempotency/reconciliation이 필요합니다." },
    { question: "retry를 여러 layers에 두면 어떤 문제가 있나요?", answer: "attempts가 곱해져 latency·load·duplicate effect가 폭발할 수 있어 한 owner와 shared budget이 필요합니다." },
    { question: "catch가 field mutation을 rollback하나요?", answer: "아닙니다. validate→compute→commit 또는 transaction으로 failure postcondition을 설계해야 합니다." },
    { question: "try 범위는 왜 좁아야 하나요?", answer: "같은 type의 다른 bug를 잘못 번역하지 않고 정확한 failure operation과 recovery를 연결하기 위해서입니다." },
    { question: "negative compiler test가 false만 보면 왜 부족한가요?", answer: "목표 exception rule이 아니라 parser/classpath error일 수 있어 diagnostics1·ERROR1·line·version-pinned code를 함께 확인해야 합니다." },
  ],
  completionChecklist: [
    "Throwable→Error/Exception→RuntimeException hierarchy를 설명·assignability로 검증했다.",
    "checked exception을 RuntimeException 계열과 Error 계열이 아닌 Throwable로 정확히 분류했다.",
    "checked 여부와 현재 layer recovery capability를 별도 판단했다.",
    "Error를 일반 business catch/recovery 대상으로 삼지 않았다.",
    "catch(Exception)가 RuntimeException은 잡지만 Error는 잡지 않음을 검증했다.",
    "Ex01 index0~4 뒤 index5에서 try가 abrupt completion됨을8행으로 감사했다.",
    "failure statement와 그 뒤 try markers가 실행되지 않음을 synthetic trace로 증명했다.",
    "catch 정상 완료 뒤 try/catch outer flow가 계속됨을 검증했다.",
    "source-order 첫 assignment-compatible catch 하나만 실행됨을 설명했다.",
    "child catch를 parent보다 먼저 두고 parent-first unreachable negative를 실행했다.",
    "multi-catch는 동일 policy의 unrelated alternatives에만 사용했다.",
    "related alternatives와 multi-catch parameter reassignment compile errors를 검증했다.",
    "Ex03 5→0 exact4행과 x exact2행을 fresh JVM에서 실행했다.",
    "Ex03 try가 while 전체를 감싸 첫 오류 뒤 retry하지 않음을 기록했다.",
    "Scanner InputMismatch 뒤 offending token을 명시 소비했다.",
    "EOF를 invalid token과 다른 outcome으로 분류했다.",
    "bounded attempts와 cancellation/EOF 조건 없는 무한 retry를 피했다.",
    "input NumberFormat/InputMismatch를 API/cursor 차이까지 구분했다.",
    "array range·integer zero·null receiver exceptions를 서로 다른 types로 실행했다.",
    "floating zero division이 Infinity를 만들 수 있음을 exception과 구분했다.",
    "Ex05 broad Exception catch의 zero/text exact3행을 보존하고 한계를 설명했다.",
    "catch-and-ignore와 null/0 sentinel false success를 typed outcome으로 교정했다.",
    "expected required/range/zero를 normal validation branch로 처리했다.",
    "unexpected NullPointer/programming RuntimeException을 user format code로 오분류하지 않았다.",
    "stack trace의 first application frame과 cause chain을 구조적으로 읽었다.",
    "translation exception이 original cause type·message·identity를 보존했다.",
    "line number/generated message를 portable golden으로 과도하게 고정하지 않았다.",
    "사용자 safe message와 개발자 diagnostic channel을 분리했다.",
    "public response에 raw class/path/stack/input/secret을 노출하지 않았다.",
    "correlation reference가 user response와 final diagnostic을 연결하게 했다.",
    "bounded error code와 localized message를 분리했다.",
    "모든 layer log+rethrow 대신 한 observation owner를 지정했다.",
    "low-level IOException을 domain failure로 좁게 번역하고 cause를 보존했다.",
    "caller action별 failure taxonomy를 generic wrapper 하나와 구분했다.",
    "transient failure만 retry하고 validation/bug/cancel은 제외했다.",
    "retry 전 operation idempotency 또는 duplicate protection을 확인했다.",
    "max attempts·deadline·timeout·backoff·jitter·cancel budget을 설명했다.",
    "retry owner를 한 layer에 두고 nested retry multiplication을 방지했다.",
    "ambiguous commit outcome을 단순 failure와 구분해 reconciliation을 제시했다.",
    "validate→compute→commit으로 failure 전 partial field mutation을 막았다.",
    "failure 뒤 state unchanged postcondition을 exact output으로 검증했다.",
    "multi-resource 원자성에는 transaction/outbox가 별도 필요함을 설명했다.",
    "checked call/throw·parent-first·related multi-catch·assignment·never-thrown·generic Throwable seven negative tasks를 실행했다.",
    "negative tasks마다 false·diagnostics1·ERROR1·expected line/code를 OpenJDK21.0.11로 고정했다.",
    "class08 package8과 direct scope3을 별도 -d에서 warning0로 compile했다.",
    "package mains8·scope mains3·compile-only0을 source에서 계산했다.",
    "Ex02 empty-working-directory exit1과 RuntimeException→FileNotFoundException cause frames를 검증했다.",
    "Ex04 5→0→x stdout7행 뒤 EOF NoSuchElement exit1을 숨기지 않았다.",
    "Ex06 zero3·Ex07 invalid3·Ex08 even-stop2행을 package smoke로 검증했다.",
    "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS를 저장·제거·child 제거·finally 복원했다.",
    "모든 public Java examples가 OpenJDK21 warning0와 exact output을 통과했다.",
    "ProcessStartInfo redirected UTF-8 streams·closed stdin·timeout/kill/read-task cleanup을 적용했다.",
    "OS temp GUID direct-child parent boundary와 reverse/post-delete cleanup을 적용했다.",
    "원본8·JLS SE21·Java SE21 APIs·OpenJDK21·운영 retry/security guidance provenance를 구분했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class08-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex01_Exception.java", usedFor: ["array range failure", "try abrupt completion", "specific catch", "post-catch continuation", "exact8 output"], evidence: "length5 array에 i<=5 loop를 적용해0~4 뒤 index5 assignment가 실패하고 exception toString·catch marker·outer completion까지8행임을 실행했습니다." },
    { id: "java-class08-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex02_Exception.java", usedFor: ["checked FileNotFound catch", "RuntimeException translation", "cause chain", "uncaught exit1", "resource debt"], evidence: "empty working directory에서 FileInputStream a.txt가 FileNotFoundException을 던지고 catch가 RuntimeException(cause)로 다시 던져 source frames13/11과 exit1을 만드는 흐름을 확인했습니다." },
    { id: "java-class08-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex03_Exception.java", usedFor: ["specific multiple catches", "try enclosing while", "ArithmeticException", "InputMismatchException", "exact input cases"], evidence: "try 내부 while, Arithmetic/InputMismatch catches2, 입력5→0 exact4행과 x exact2행, 첫 failure 뒤 loop 종료를 fresh JVMs에서 확인했습니다." },
    { id: "java-class08-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex04_Exception.java", usedFor: ["outer retry loop", "invalid line consumption", "zero recovery", "EOF uncaught failure"], evidence: "outer while가 zero/text catches 후 nextLine과 재시도를 수행하지만 EOF NoSuchElementException은 잡지 않아 입력5→0→x stdout7행 뒤 exit1이 됨을 확인했습니다." },
    { id: "java-class08-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex05_Exception.java", usedFor: ["broad Exception catch", "raw exception user output", "zero/text same policy", "anti-pattern analysis"], evidence: "catch(Exception) 하나가 zero ArithmeticException과 text InputMismatchException을 각각 raw type 문자열+generic marker3행으로 처리하는 원본을 실행했습니다." },
    { id: "java-class08-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex06_Exception.java", usedFor: ["package compile", "zero catch return", "finally package smoke"], evidence: "입력0에서 prompt·specific message·finally marker exact3행과 exit0을 확인했으며 finally 심화는 core03 경계로 남겼습니다." },
    { id: "java-class08-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex07_Exception.java", usedFor: ["package compile", "NumberFormat propagation", "caller catch", "invalid input smoke"], evidence: "입력x가 prnData marker 뒤 NumberFormatException으로 caller catch에 도달해 safe marker·completion을 포함3행 exit0임을 확인했고 throws 심화는 core03에 남겼습니다." },
    { id: "java-class08-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex08_Exception.java", usedFor: ["package compile", "nested retry input", "even-stop smoke", "finally completion"], evidence: "입력2→n에서 even result와 prompt/final completion exact2행·exit0을 확인했으며 nested lifecycle은 package evidence로만 사용했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["package/scope warning0 compile", "release21", "source/line debug info", "seven diagnostics"], evidence: "OpenJDK21.0.11로 원본8/scope3, 모든 positive examples, expected-fail fixtures를 compile한 version-pinned toolchain입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["fresh JVM cases", "stdin/stdout/stderr redirect", "working directory", "launcher environment removal", "timeout"], evidence: "interactive/uncaught original cases를 shell interpolation 없이 ArgumentList·redirected UTF-8 streams·closed stdin·10초 timeout으로 실행하는 API입니다." },
    { id: "powershell-environment-variables", repository: "Microsoft PowerShell Documentation", path: "about_Environment_Variables / Env provider", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher option presence/value save", "process-scope removal", "finally restoration"], evidence: "audit PowerShell process에서 네 Java launcher option 환경 변수의 존재와 값을 저장·제거하고 finally에서 원래 상태로 복원하는 Env provider 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child environment isolation", "launcher option removal", "per-process environment"], evidence: "각 Java child의 environment dictionary에서도 네 launcher option 변수를 제거해 host options가 exact compile/runtime evidence를 바꾸지 않게 하는 API 근거입니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["Start", "WaitForExit timeout", "Kill process tree", "bounded termination grace", "Dispose"], evidence: "Java child마다 10초 runtime timeout, process-tree kill, 5초 termination grace와 finally Dispose를 적용하는 process lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "System.IO.StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout drain", "concurrent stderr drain", "post-exit task result"], evidence: "child Start 직후 stdout/stderr async reads를 시작해 redirected pipe backpressure deadlock을 피하고 종료·kill 뒤 두 tasks를 회수하는 근거입니다." },
    { id: "jls-exception-hierarchy", repository: "JLS SE 21", path: "11.1.1 The Kinds of Exceptions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.1.1", usedFor: ["Throwable branches", "checked/unchecked kinds", "direct Throwable subclass boundary", "Error/Exception distinction"], evidence: "RuntimeException 계열과 Error 계열이 unchecked이며 그 밖의 Throwable 계열은 checked라는 분류를 정의하는 primary specification입니다. 따라서 Exception을 직접 거치지 않는 custom Throwable도 checked입니다." },
    { id: "jls-compile-time-checking", repository: "JLS SE 21", path: "11.2 Compile-Time Checking of Exceptions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.2", usedFor: ["catch-or-declare", "checked exception compiler duty", "unchecked exclusion"], evidence: "checked exception이 compile-time checking 대상이 되는 기준의 primary specification입니다." },
    { id: "jls-exception-checking", repository: "JLS SE 21", path: "11.2.3 Exception Checking", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.2.3", usedFor: ["unreported checked calls", "throws/catch obligation", "never-thrown handler reasoning"], evidence: "method/constructor bodies와 checked throw points의 catch/declare correctness 규칙 근거입니다." },
    { id: "jls-abrupt-completion", repository: "JLS SE 21", path: "14.1 The Kinds of Statements", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.1", usedFor: ["normal versus abrupt completion", "skip remaining statements", "state effects"], evidence: "statement가 exception 등으로 abrupt completion하는 control-flow 용어와 의미의 근거입니다." },
    { id: "jls-try-statement", repository: "JLS SE 21", path: "14.20 The try statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20", usedFor: ["try/catch execution", "handler selection", "catch ordering", "multi-catch syntax"], evidence: "try block, catch clauses, handler execution과 abrupt completion propagation의 primary specification입니다." },
    { id: "jls-catch-clauses", repository: "JLS SE 21", path: "14.20.1 Execution of try-catch", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.1", usedFor: ["first assignable catch", "source-order handler search", "unreachable order"], evidence: "thrown value와 catch parameter assignment compatibility 및 first matching handler 실행의 근거입니다." },
    { id: "jls-multicatch", repository: "JLS SE 21", path: "14.20 The try statement - catch formal parameter", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20", usedFor: ["multi-catch alternatives", "disjoint types", "implicitly-final parameter"], evidence: "union catch parameter alternatives의 subtype 금지와 parameter assignment 제한 근거입니다." },
    { id: "jls-multiplicative-operators", repository: "JLS SE 21", path: "15.17 Multiplicative Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.17", usedFor: ["integer divide by zero", "floating Infinity/NaN", "remainder semantics"], evidence: "integer와 floating-point division/remainder zero behavior가 다른 primary specification입니다." },
    { id: "jls-record-classes", repository: "JLS SE 21", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["immutable explicit outcome", "ParseResult components", "tagged failure data"], evidence: "success/value/errorCode를 immutable data carrier로 표현한 record example의 language 근거입니다." },
    { id: "jls-throw-statement", repository: "JLS SE 21", path: "14.18 The throw statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.18", usedFor: ["explicit throw", "translation abrupt completion", "checked throw negative"], evidence: "Throwable expression을 throw하고 enclosing handlers/callers로 abrupt completion하는 규칙 근거입니다." },
    { id: "jls-generic-throwable", repository: "JLS SE 21", path: "8.1.2 Generic Classes and Type Parameters", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.2", usedFor: ["generic Throwable subclass prohibition", "negative compiler fixture"], evidence: "generic class가 Throwable의 direct/indirect subclass가 될 수 없다는 compile-time restriction 근거입니다." },
    { id: "java-throwable-api", repository: "Java SE 21 API", path: "java.lang.Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["cause", "stack trace", "message", "suppressed context"], evidence: "getCause/getStackTrace/getMessage와 Throwable chain을 구조적으로 읽고 보존하는 API 근거입니다." },
    { id: "java-error-api", repository: "Java SE 21 API", path: "java.lang.Error", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Error.html", usedFor: ["Error branch", "business catch exclusion", "unchecked classification"], evidence: "serious problem을 나타내며 reasonable application이 일반적으로 catch하지 않아야 하는 Error API 설명 근거입니다." },
    { id: "java-runtime-exception-api", repository: "Java SE 21 API", path: "java.lang.RuntimeException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/RuntimeException.html", usedFor: ["unchecked runtime branch", "broad catch boundary", "custom transient exception"], evidence: "unchecked application/runtime failures의 common superclass API 근거입니다." },
    { id: "java-io-exception-api", repository: "Java SE 21 API", path: "java.io.IOException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/IOException.html", usedFor: ["checked example", "storage translation", "multi-catch subtype relation"], evidence: "I/O failure checked exception family와 FileNotFoundException parent relation의 API 근거입니다." },
    { id: "java-array-index-api", repository: "Java SE 21 API", path: "java.lang.ArrayIndexOutOfBoundsException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ArrayIndexOutOfBoundsException.html", usedFor: ["Ex01 range type", "specific catch", "normalized flow"], evidence: "illegal array index access가 던지는 runtime type의 API 근거입니다." },
    { id: "java-number-format-api", repository: "Java SE 21 API", path: "java.lang.NumberFormatException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/NumberFormatException.html", usedFor: ["String parse failure", "specific translation", "input outcome"], evidence: "String을 numeric type으로 변환할 수 없을 때의 runtime failure API입니다." },
    { id: "java-input-mismatch-api", repository: "Java SE 21 API", path: "java.util.InputMismatchException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/InputMismatchException.html", usedFor: ["Scanner typed-token failure", "Ex03/04/05", "cursor recovery"], evidence: "retrieved token이 expected type/pattern이 아니거나 range 밖일 때 Scanner가 던지는 failure API입니다." },
    { id: "java-arithmetic-api", repository: "Java SE 21 API", path: "java.lang.ArithmeticException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ArithmeticException.html", usedFor: ["integer zero division", "Math.addExact overflow", "multi-catch example"], evidence: "exceptional arithmetic condition을 나타내는 runtime type API입니다." },
    { id: "java-null-pointer-api", repository: "Java SE 21 API", path: "java.lang.NullPointerException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/NullPointerException.html", usedFor: ["null receiver matrix", "helpful-message non-contract", "unexpected bug classification"], evidence: "null object가 필요한 operation에서의 runtime failure type과 modern message caveat 근거입니다." },
    { id: "java-scanner-api", repository: "Java SE 21 API", path: "java.util.Scanner", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html", usedFor: ["token parsing", "hasNext", "nextInt", "token consumption", "close ownership"], evidence: "Ex03~08와 bounded retry example의 token/cursor/locale/close behavior API 근거입니다." },
    { id: "java-no-such-element-api", repository: "Java SE 21 API", path: "java.util.NoSuchElementException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/NoSuchElementException.html", usedFor: ["EOF failure", "Ex04 exit1", "end-of-input policy"], evidence: "요청한 element/token이 더 없을 때의 failure type API 근거입니다." },
    { id: "java-stack-trace-element-api", repository: "Java SE 21 API", path: "java.lang.StackTraceElement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StackTraceElement.html", usedFor: ["application frame method", "class/method/file/line fields", "stable inspection"], evidence: "stack frame의 declaring class·method·file·line을 구조적으로 읽는 API입니다." },
    { id: "java-math-add-exact", repository: "Java SE 21 API", path: "java.lang.Math.addExact", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#addExact(int,int)", usedFor: ["overflow detection", "candidate computation", "ArithmeticException translation"], evidence: "silent int wraparound 대신 overflow를 ArithmeticException으로 알리는 exact arithmetic API입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["seven in-memory tasks", "release/lint options", "compile result"], evidence: "expected-fail sources를 production compile과 분리해 task별 실행하는 compiler API입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["ERROR kind", "diagnostic count", "line", "OpenJDK code"], evidence: "negative contracts의 failure identity를 structured fields로 확인하는 API입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp direct child", "fixture outputs", "walk reverse cleanup"], evidence: "compiler fixtures의 partial artifacts를 isolated directories에 두고 residue 없이 삭제하는 API입니다." },
    { id: "effective-java-exceptions", repository: "Effective Java, Third Edition", path: "Chapter 10 Exceptions, Items 69-77", usedFor: ["exceptional conditions", "checked versus runtime", "failure atomicity", "translation", "diagnostic detail"], evidence: "예외를 exceptional conditions에 쓰고 abstraction-appropriate types·failure atomicity·detail messages를 설계하는 보충 원칙입니다." },
    { id: "owasp-error-handling", repository: "OWASP Cheat Sheet Series", path: "Error Handling Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["safe public errors", "centralized handling", "logging detail", "information leakage"], evidence: "사용자에게 generic/safe response를 제공하고 상세 diagnostics를 server-side에 보존하는 security guidance입니다." },
    { id: "aws-retry-backoff", repository: "AWS Prescriptive Guidance", path: "Retry with backoff pattern", publicUrl: "https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html", usedFor: ["transient retry", "backoff", "idempotency", "attempt limits"], evidence: "transient failures, idempotent operations, backoff와 bounded retry를 설계하는 운영 guidance입니다." },
    { id: "http-idempotent-methods", repository: "IETF RFC 9110", path: "9.2.2 Idempotent Methods", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods", usedFor: ["retry safety", "idempotent request semantics", "ambiguous response"], evidence: "동일 request의 multiple applications와 automatic retry를 판단하는 HTTP idempotency semantics의 primary standard입니다." },
  ],
  sourceCoverage: {
    filesRead: 8,
    filesUsed: 8,
    uncoveredNotes: [
      "inventory direct3 Ex01_Exception·Ex03_Exception·Ex05_Exception을 모두 읽고 source shapes와 fresh-JVM outputs에 직접 사용했습니다.",
      "class08 전체 Ex01~Ex08 여덟 files를 package smoke로 읽고 compile/run해 direct files에 별도 source companion/dependency가 없음을 확인했습니다.",
      "package8과 scope3은 서로 다른 classes directories에서 OpenJDK21.0.11 -g:source,lines -Xlint:all -XDrawDiagnostics exit0·compiler output0입니다.",
      "package와 scope의 모든 files가 public main이라 roles는 package main8/compile-only0, scope main3/compile-only0입니다.",
      "Ex01은 values0~4, normalized ArrayIndexOutOfBoundsException type, catch marker, outer completion의 exact8-line structural contract입니다.",
      "Ex03은 input5→0 exact4 lines and x exact2 lines이며 try 내부 while 때문에 first exception handler 뒤 retry하지 않습니다.",
      "Ex05는 zero ArithmeticException+generic marker와 text InputMismatchException+generic marker가 각각 exact3 lines이고 broad Exception catch1을 source에서 assert합니다.",
      "Ex02는 audit temp에 a.txt absence를 precondition으로 두고 RuntimeException outer frame13·FileNotFoundException cause frame11·exit1·stdout empty를 확인했습니다.",
      "Ex04는 input5→0→x recovery sequence stdout7 lines 뒤 EOF NoSuchElementException frame25·exit1을 확인해 infinite loop를 timeout으로 잘라 success처럼 기록하지 않았습니다.",
      "Ex06 zero exact3, Ex07 x exact3, Ex08 2→n exact2 and exit0은 package health evidence이며 finally/throws 심화는 core03에 남겼습니다.",
      "Throwable hierarchy, checked/unchecked, abrupt flow, first matching handler, multi-catch, failure matrix는 JLS SE21과 Java SE21 APIs로 원본 설명을 확장했습니다.",
      "catch-ignore/broad catch, cause translation, user/developer channel, retry/idempotency, failure atomicity는 official/security/operations guidance와 warning0 synthetic examples로 보충했습니다.",
      "seven negative tasks는 checked call, parent-first, related multi-catch, multi parameter assignment, checked never-thrown, checked explicit throw, generic Throwable입니다.",
      "negative tasks는 각각 compile false·diagnostics total1·ERROR1과 expected 1-based line/OpenJDK21.0.11 code를 확인합니다.",
      "original audit는 JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS를 저장/제거하고 child environment에서도 제거한 뒤 finally 복원합니다.",
      "모든 ProcessStartInfo cases는 UTF-8 redirected async streams, closed stdin, explicit temp working directory, 10-second runtime timeout, process-tree kill, 5-second termination grace, read-task recovery와 finally Dispose를 사용합니다.",
      "모든 positive Java examples는 -encoding UTF-8 --release21 -proc:none -Xlint:all warning0와 exact output을 요구합니다.",
      "OS temp GUID direct-child boundary와 reverse cleanup/post-delete assertion으로 repository에 .class와 audit artifacts가 남지 않게 했습니다.",
      "실제 local absolute path·개인 input·credential·raw public stack은 공개 code/output/evidence에 포함하지 않고 synthetic identifiers와 normalized types만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
