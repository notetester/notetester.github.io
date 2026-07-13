import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-03-finally-throws"],
  slug: "core-03-finally-throws",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 23,
  title: "finally·throws·try-with-resources",
  subtitle: "모든 완료 경로를 추적하고 예외 전파 계약과 자원 소유권을 분리해, 원인 손실 없이 결정적으로 닫히는 Java 경계를 설계합니다.",
  level: "고급",
  estimatedMinutes: 880,
  coreQuestion: "정상 완료·return·throw·break·continue가 섞인 호출 경계에서 원래 결과와 예외를 보존하면서, 누가 어떤 자원을 언제 어떤 순서로 닫아야 할까요?",
  summary: "inventory direct3인 javastudy2 class08 Ex06_Exception·Ex07_Exception·Ex08_Exception과 package 전체 Ex01~Ex08 여덟 files를 읽고 OpenJDK21.0.11에서 다시 감사했습니다. package8과 direct3은 분리된 output directories에서 모두 exit0·compiler output0·warning0이고 여덟 files 모두 public main이라 별도 source dependency는 없습니다. Ex06은 입력5에서 정상 답·finally·후속 문장까지4행, 0과 문자에서 catch return을 실행해도 finally marker까지3행이며 후속 문장은 건너뜁니다. EOF는 두 catch 밖 NoSuchElementException이지만 finally marker를 출력한 뒤 source frame28·exit1입니다. Ex07은 2abc의 첫 글자2가 prnData로 전파되어 구구단과 완료까지12행, x는 prnData의 NumberFormatException이 setData를 지나 main catch까지 올라와3행이고, EOF는 main의 Scanner.next에서 frame39·exit1이지만 finally는 Scanner를 닫습니다. Ex08은 even→n exact2행, 잘못된 숫자·홀수·잘못된 계속 응답·label continue·짝수·label break를 거치는 recovery exact5행이며, EOF recovery 중 nextLine이 다시 실패해도 outer finally의 완료 marker 뒤 frame17·exit1입니다. 이 실행 근거 위에서 finally의 normal/return/throw/break/continue 경로, System.exit·강제종료 한계, finally return/throw masking, checked throws와 precise rethrow, abstraction-level translation, AutoCloseable ownership, try-with-resources acquisition/reverse close, primary·suppressed·close-only failures, partial acquisition, Java9 effectively-final resources, wrapper/System.in ownership, idempotent close와 concurrency, compiler-negative contracts를 하나의 운영 가능한 모델로 확장합니다.",
  objectives: [
    "normal·return·throw·break·continue 완료 이유마다 finally 실행 시점과 이후 control destination을 추적한다.",
    "finally의 return/throw가 보류 중인 결과·예외를 덮는 이유를 설명하고 그런 control transfer를 금지한다.",
    "checked exception의 catch-or-declare, caller propagation, precise rethrow와 abstraction-level translation을 API 계약으로 설계한다.",
    "resource owner와 borrower를 구분하고 AutoCloseable·Closeable 및 wrapper의 transitive close 책임을 문서화한다.",
    "try-with-resources의 left-to-right acquisition, reverse close, partial acquisition cleanup을 deterministic trace로 증명한다.",
    "body·close-only·복수 close failure에서 primary와 suppressed exception을 모두 읽고 원인 정보를 보존한다.",
    "effectively-final resource reuse, System.in close 주의, idempotent close와 concurrent close caveat를 실제 boundary policy에 적용한다.",
  ],
  prerequisites: [{ title: "예외 계층과 try/catch 복구 경계", reason: "finally와 throws는 먼저 Throwable 계층, abrupt completion, catch matching, cause chain을 알아야 기존 결과·예외를 무엇이 덮는지 정확히 추적할 수 있습니다.", sessionSlug: "core-02-exception" }],
  keywords: ["finally", "throws", "throw", "catch-or-declare", "precise rethrow", "exception propagation", "exception translation", "resource ownership", "AutoCloseable", "Closeable", "try-with-resources", "reverse close", "suppressed exception", "partial acquisition", "effectively final", "wrapper ownership", "System.in", "idempotent close", "completion reason", "exception masking"],
  chapters: [
    {
      id: "class08-finally-throws-golden-audit",
      title: "class08 package8·direct3을 분리 compile하고 finally·propagation·EOF 경로 15개를 fresh JVM으로 감사합니다",
      lead: "원본의 ‘finally는 반드시 실행’이라는 표현을 정상·return·uncaught exception·label control 뒤 정상 try 완료·EOF의 관찰 가능한 process contract로 구체화합니다.",
      explanations: [
        "class08에는 Ex01~Ex08 Java files8개가 있고 모두 public static void main을 가집니다. direct inventory Ex06·Ex07·Ex08도 imports 외 source dependency가 없어 package8과 direct3을 각각 독립 compile할 수 있습니다.",
        "두 compile은 -encoding UTF-8 --release21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics와 서로 다른 -d directories를 사용합니다. compiler output이 비어 있다는 사실까지 assert해 warning을 성공으로 숨기지 않습니다.",
        "Ex06의 5 경로는 try가 정상 완료되어 finally 뒤 후속 ‘수고하셨습니다.’까지 갑니다. 0·문자 경로는 catch에서 return을 예약하지만 method를 떠나기 전에 finally가 Scanner를 닫고 marker를 출력하며, finally 뒤 문장은 실행하지 않습니다.",
        "Ex06 EOF는 ArithmeticException/InputMismatchException 어느 catch에도 맞지 않는 NoSuchElementException입니다. handler 없이 전파되기 전 finally가 실행되므로 stdout2행과 stderr frame28·exit1을 함께 확인해야 합니다.",
        "Ex07의 NumberFormatException은 prnData→setData→main으로 전파됩니다. 2abc는 substring(0,1) 때문에2단을 출력하고, x는 main catch가 처리합니다. EOF는 parse 이전 Scanner.next frame39에서 발생해 NumberFormatException catch가 잡지 못하지만 finally는 실행됩니다.",
        "Ex08은 숫자 입력 catch의 continue와 계속 여부의 continue esc를 outer try 안 loop에서 수행하므로 그때마다 outer finally를 실행하지 않습니다. break esc도 try 밖이 아니라 try 안의 labelled while을 끝냅니다. 그 break를 labelled statement가 처리해 정상 완료하고 try body에 후속 statement가 없어 try도 정상 완료한 뒤 finally marker가 한 번 실행됩니다. x→3→q→y→4→n은 이 label control과 prompt의 print/println 결합까지 exact5행입니다.",
        "Ex08 EOF는 broad catch가 첫 NoSuchElementException을 잡은 뒤 recovery nextLine이 다시 NoSuchElementException을 던지는 이중 실패입니다. outer finally marker 뒤 exit1이므로 catch 존재만으로 복구 성공을 판단할 수 없습니다.",
        "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS는 audit process에서 존재와 값을 저장·제거하고 child ProcessStartInfo.Environment에서도 제거합니다. child마다 async stdout/stderr drain, closed stdin, 10초 runtime timeout, process-tree kill, 5초 termination grace, task 회수와 finally Dispose를 적용합니다.",
      ],
      concepts: [
        { term: "completion reason", definition: "현재 statement가 normal, return, throw, break, continue 중 어떤 이유로 다음 control point를 선택했는지 나타내는 상태입니다.", detail: ["finally는 보류된 completion 전에 실행됩니다.", "finally가 새 abrupt completion을 만들면 기존 이유를 대체할 수 있습니다."] },
        { term: "propagation path", definition: "throw point에서 현재 method의 matching handler를 거쳐 caller 방향으로 exception object가 이동하는 호출 경로입니다.", detail: ["throws declaration은 경로를 문서화·검사합니다.", "finally는 각 frame을 떠나기 전에 실행됩니다."] },
        { term: "process contract", definition: "stdin, stdout, stderr, exit, timeout, working directory를 fresh JVM 단위로 고정한 검증 계약입니다.", detail: ["EOF도 입력 사건입니다.", "compile success와 runtime success를 분리합니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core03-audit",
        title: "direct10·companion5 경로와 source shape를 hostile environment에서도 재현합니다",
        language: "powershell",
        filename: "verify-original-core03.ps1",
        purpose: "원본 finally·return·propagation·label control·EOF behavior를 warning0 compile과 fresh-process exact/normalized assertions로 보존합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core03 audit " + [Guid]::NewGuid().ToString("N"))
$launcherNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedLauncher = @{}
foreach ($name in $launcherNames) {
  if (Test-Path "Env:$name") { $savedLauncher[$name] = (Get-Item "Env:$name").Value }
}
$ownsRoot = $false
$bodyError = $null
try {
  if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $ownsRoot = $true
  foreach ($name in $launcherNames) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
  $lf = [string][char]10
  $crlf = [string][char]13 + [char]10
  $source = "src\com\java\class08"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $directNames = @("Ex06_Exception.java", "Ex07_Exception.java", "Ex08_Exception.java")
  $direct = @($directNames | ForEach-Object { Join-Path $source $_ })
  $packageOut = Join-Path $root "package classes"
  $directOut = Join-Path $root "direct classes"
  New-Item -ItemType Directory -Path $packageOut, $directOut -ErrorAction Stop | Out-Null

  $packageCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
  $packageExit = $LASTEXITCODE
  $directCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $directOut $direct 2>&1)
  $directExit = $LASTEXITCODE
  if ($all.Count -ne 8 -or $packageExit -ne 0 -or $packageCompiler.Count -ne 0) { throw "package compile drift" }
  if ($direct.Count -ne 3 -or $directExit -ne 0 -or $directCompiler.Count -ne 0) { throw "direct compile drift" }
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $directMains = @($direct | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  if ($packageMains -ne 8 -or $directMains -ne 3) { throw "main role drift" }

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

  $ex06Five = Invoke-Java $directOut "com.java.class08.Ex06_Exception" ("5" + $lf)
  $ex06Zero = Invoke-Java $directOut "com.java.class08.Ex06_Exception" ("0" + $lf)
  $ex06Text = Invoke-Java $directOut "com.java.class08.Ex06_Exception" ("x" + $lf)
  $ex06Eof = Invoke-Java $directOut "com.java.class08.Ex06_Exception"
  $ex07Valid = Invoke-Java $directOut "com.java.class08.Ex07_Exception" ("2abc" + $lf)
  $ex07Text = Invoke-Java $directOut "com.java.class08.Ex07_Exception" ("x" + $lf)
  $ex07Eof = Invoke-Java $directOut "com.java.class08.Ex07_Exception"
  $ex08Even = Invoke-Java $directOut "com.java.class08.Ex08_Exception" ("2" + $lf + "n" + $lf)
  $ex08Recovery = Invoke-Java $directOut "com.java.class08.Ex08_Exception" ("x" + $lf + "3" + $lf + "q" + $lf + "y" + $lf + "4" + $lf + "n" + $lf)
  $ex08Eof = Invoke-Java $directOut "com.java.class08.Ex08_Exception"

  $expected06Five = "정수 입력 : " + $lf + "정답 : 5" + $lf + "반드시 실행되어야 하는 문장" + $lf + "수고하셨습니다." + $lf
  $expected06Zero = "정수 입력 : " + $lf + "0으로는 나눌 수 없습니다." + $lf + "반드시 실행되어야 하는 문장" + $lf
  $expected06Text = "정수 입력 : " + $lf + "문자가 입력되었습니다. 숫자를 입력하세요." + $lf + "반드시 실행되어야 하는 문장" + $lf
  $expected06Eof = "정수 입력 : " + $lf + "반드시 실행되어야 하는 문장" + $lf
  if ($ex06Five.Exit -ne 0 -or $ex06Five.Err.Length -ne 0 -or $ex06Five.Out -cne $expected06Five) { throw "Ex06 success drift" }
  if ($ex06Zero.Exit -ne 0 -or $ex06Zero.Err.Length -ne 0 -or $ex06Zero.Out -cne $expected06Zero) { throw "Ex06 zero drift" }
  if ($ex06Text.Exit -ne 0 -or $ex06Text.Err.Length -ne 0 -or $ex06Text.Out -cne $expected06Text) { throw "Ex06 text drift" }
  if ($ex06Eof.Exit -ne 1 -or $ex06Eof.Out -cne $expected06Eof -or -not $ex06Eof.Err.Contains("java.util.NoSuchElementException") -or -not $ex06Eof.Err.Contains("Ex06_Exception.java:28")) { throw "Ex06 EOF drift" }

  $expected07Valid = "정수 입력 : prnData 메서드 안" + $lf + "2단" + $lf + "2*1=2" + $lf + "2*2=4" + $lf + "2*3=6" + $lf + "2*4=8" + $lf + "2*5=10" + $lf + "2*6=12" + $lf + "2*7=14" + $lf + "2*8=16" + $lf + "2*9=18" + $lf + "수고하셨습니다." + $lf
  $expected07Text = "정수 입력 : prnData 메서드 안" + $lf + "제대로 입력하세요." + $lf + "수고하셨습니다." + $lf
  if ($ex07Valid.Exit -ne 0 -or $ex07Valid.Err.Length -ne 0 -or $ex07Valid.Out -cne $expected07Valid) { throw "Ex07 valid drift" }
  if ($ex07Text.Exit -ne 0 -or $ex07Text.Err.Length -ne 0 -or $ex07Text.Out -cne $expected07Text) { throw "Ex07 text drift" }
  if ($ex07Eof.Exit -ne 1 -or $ex07Eof.Out -cne "정수 입력 : " -or -not $ex07Eof.Err.Contains("java.util.NoSuchElementException") -or -not $ex07Eof.Err.Contains("Ex07_Exception.java:39")) { throw "Ex07 EOF drift" }

  $expected08Even = "숫자 입력: 2는 짝수입니다." + $lf + "계속할까요?(y/n) >> 수고하셨습니다." + $lf
  $expected08Recovery = "숫자 입력: 숫자를 입력해주세요." + $lf + "숫자 입력: 3는 홀수입니다." + $lf + "계속할까요?(y/n) >> 제대로 입력하세요.(y 또는 n)" + $lf + "계속할까요?(y/n) >> 숫자 입력: 4는 짝수입니다." + $lf + "계속할까요?(y/n) >> 수고하셨습니다." + $lf
  $expected08Eof = "숫자 입력: 숫자를 입력해주세요." + $lf + "수고하셨습니다." + $lf
  if ($ex08Even.Exit -ne 0 -or $ex08Even.Err.Length -ne 0 -or $ex08Even.Out -cne $expected08Even) { throw "Ex08 even drift" }
  if ($ex08Recovery.Exit -ne 0 -or $ex08Recovery.Err.Length -ne 0 -or $ex08Recovery.Out -cne $expected08Recovery) { throw "Ex08 recovery drift" }
  if ($ex08Eof.Exit -ne 1 -or $ex08Eof.Out -cne $expected08Eof -or -not $ex08Eof.Err.Contains("java.util.NoSuchElementException: No line found") -or -not $ex08Eof.Err.Contains("Ex08_Exception.java:17")) { throw "Ex08 EOF drift" }

  $ex01 = Invoke-Java $packageOut "com.java.class08.Ex01_Exception"
  if (Test-Path -LiteralPath (Join-Path $root "a.txt")) { throw "unexpected a.txt" }
  $ex02 = Invoke-Java $packageOut "com.java.class08.Ex02_Exception"
  $ex03 = Invoke-Java $packageOut "com.java.class08.Ex03_Exception" ("5" + $lf + "0" + $lf)
  $ex04 = Invoke-Java $packageOut "com.java.class08.Ex04_Exception" ("5" + $lf + "0" + $lf + "x" + $lf)
  $ex05 = Invoke-Java $packageOut "com.java.class08.Ex05_Exception" ("0" + $lf)
  $ex01Lines = @($ex01.Out.TrimEnd([char]10).Split([char]10))
  if ($ex01.Exit -ne 0 -or $ex01.Err.Length -ne 0 -or $ex01Lines.Count -ne 8 -or $ex01Lines[5] -notmatch '^java\.lang\.ArrayIndexOutOfBoundsException:' -or $ex01Lines[7] -cne "수고하셨습니다.") { throw "Ex01 drift" }
  $ex02Cause = $ex02.Err.Contains("java.lang.RuntimeException: java.io.FileNotFoundException") -and $ex02.Err.Contains("Caused by: java.io.FileNotFoundException") -and $ex02.Err.Contains("Ex02_Exception.java:13") -and $ex02.Err.Contains("Ex02_Exception.java:11")
  if ($ex02.Exit -ne 1 -or $ex02.Out.Length -ne 0 -or -not $ex02Cause) { throw "Ex02 drift" }
  $expected03 = "정수 입력 : " + $lf + "정답 : 5" + $lf + "정수 입력 : " + $lf + "0으로는 나눌 수 없습니다." + $lf
  if ($ex03.Exit -ne 0 -or $ex03.Err.Length -ne 0 -or $ex03.Out -cne $expected03) { throw "Ex03 drift" }
  $expected04 = "정수 입력 : " + $lf + "정답 : 5" + $lf + "정수 입력 : " + $lf + "0으로는 나눌 수 없습니다." + $lf + "정수 입력 : " + $lf + "문자가 입력되었습니다. 숫자를 입력하세요." + $lf + "정수 입력 : " + $lf
  if ($ex04.Exit -ne 1 -or $ex04.Out -cne $expected04 -or -not $ex04.Err.Contains("java.util.NoSuchElementException") -or -not $ex04.Err.Contains("Ex04_Exception.java:25")) { throw "Ex04 drift" }
  $expected05 = "정수 입력 : " + $lf + "java.lang.ArithmeticException: / by zero" + $lf + "예외처리" + $lf
  if ($ex05.Exit -ne 0 -or $ex05.Err.Length -ne 0 -or $ex05.Out -cne $expected05) { throw "Ex05 drift" }

  $ex06Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex06_Exception.java")
  $ex07Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex07_Exception.java")
  $ex08Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex08_Exception.java")
  $ex06Finally = [regex]::Matches($ex06Source, '(?m)^\s*}finally\s*\{').Count
  $ex06Returns = [regex]::Matches($ex06Source, '\breturn\s*;').Count
  $ex07Throws = [regex]::Matches($ex07Source, 'throws\s+NumberFormatException').Count
  $ex07Finally = [regex]::Matches($ex07Source, '(?m)^\s*}finally\s*\{').Count
  $ex08Finally = [regex]::Matches($ex08Source, '(?m)^\s*}finally\s*\{').Count
  $ex08Continues = [regex]::Matches($ex08Source, '\bcontinue(?:\s+esc)?\s*;').Count
  $ex08Breaks = [regex]::Matches($ex08Source, '\bbreak\s+esc\s*;').Count
  if ($ex06Finally -ne 1 -or $ex06Returns -ne 2 -or $ex07Throws -ne 2 -or $ex07Finally -ne 1 -or $ex08Finally -ne 1 -or $ex08Continues -ne 2 -or $ex08Breaks -ne 1) { throw "direct source shape drift" }

  "spacePath=$($root.Contains(' ')),package=8|exit:$packageExit|compilerLines:$($packageCompiler.Count)|mains:$packageMains,direct=3|exit:$directExit|compilerLines:$($directCompiler.Count)|mains:$directMains"
  "Ex06=success:4|zeroReturn:3|textReturn:3|eof:exit1|finally:True"
  "Ex07=valid:12|propagatedText:3|eof:exit1|finally:True"
  "Ex08=evenStop:2|recovery:5|eof:exit1|finally:True"
  "companions=Ex01:8;Ex02:exit1|cause:True;Ex03-zero:4;Ex04-eof:exit1|sequence7;Ex05-zero:3"
  "shapes=Ex06Finally:$ex06Finally|Returns:$ex06Returns;Ex07Throws:$ex07Throws|Finally:$ex07Finally;Ex08Finally:$ex08Finally|Continues:$ex08Continues|Breaks:$ex08Breaks|launcherOptions:$($launcherNames.Count)"
} catch {
  $bodyError = $_.Exception
} finally {
  $finalErrors = [Collections.Generic.List[Exception]]::new()
  foreach ($name in $launcherNames) {
    try {
      if ($savedLauncher.ContainsKey($name)) {
        Set-Item "Env:$name" $savedLauncher[$name] -ErrorAction Stop
        if (-not (Test-Path "Env:$name") -or (Get-Item "Env:$name").Value -cne $savedLauncher[$name]) { throw "launcher restore verification failed: $name" }
      } else {
        Remove-Item "Env:$name" -ErrorAction SilentlyContinue
        if (Test-Path "Env:$name") { throw "launcher absence restore failed: $name" }
      }
    } catch { $finalErrors.Add($_.Exception) }
  }
  try {
    if ($ownsRoot) {
      $resolved = [IO.Path]::GetFullPath($root)
      if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
      if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
      if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
    }
  } catch { $finalErrors.Add($_.Exception) }
  if ($null -ne $bodyError) { $finalErrors.Insert(0, $bodyError) }
  if ($finalErrors.Count -eq 1) {
    [Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()
  }
  if ($finalErrors.Count -gt 1) {
    throw [AggregateException]::new("audit and cleanup failures", $finalErrors.ToArray())
  }
}`,
        walkthrough: [
          { lines: "1-34", explanation: "launcher options4의 원래 존재·값을 mutation 전에 저장하고, outer try 안에서 New-Item 성공 뒤에만 ownership을 표시한 공백 temp root를 만든 뒤 환경 제거와 package8/direct3 warning0 compile·main role 검사를 수행합니다." },
          { lines: "36-67", explanation: "ArgumentList, child environment isolation, UTF-8 async drain, closed stdin, 10초 timeout, tree kill, 5초 termination grace, task 회수와 Dispose를 구현합니다." },
          { lines: "70-101", explanation: "Ex06 네 경로, Ex07 세 경로, Ex08 세 경로를 fresh JVM으로 실행하고 normal/return/propagation/label/EOF stdout·stderr·exit를 검증합니다." },
          { lines: "103-130", explanation: "companion Ex01~Ex05 package health와 direct finally/return/throws/label source shapes를 확인합니다." },
          { lines: "132-168", explanation: "stable summaries 뒤 body error를 보존하고, launcher variable마다 restore·검증을 끝까지 시도한 뒤 owned temp cleanup도 독립 수행해 단일 오류는 원 stack으로, 복수 오류는 AggregateException으로 함께 전파합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root", "four Java launcher option variables isolated and restored", "10-second runtime timeout plus 5-second termination grace per Java child"], command: "pwsh -NoProfile -File verify-original-core03.ps1" },
        output: { value: "spacePath=True,package=8|exit:0|compilerLines:0|mains:8,direct=3|exit:0|compilerLines:0|mains:3\nEx06=success:4|zeroReturn:3|textReturn:3|eof:exit1|finally:True\nEx07=valid:12|propagatedText:3|eof:exit1|finally:True\nEx08=evenStop:2|recovery:5|eof:exit1|finally:True\ncompanions=Ex01:8;Ex02:exit1|cause:True;Ex03-zero:4;Ex04-eof:exit1|sequence7;Ex05-zero:3\nshapes=Ex06Finally:1|Returns:2;Ex07Throws:2|Finally:1;Ex08Finally:1|Continues:2|Breaks:1|launcherOptions:4", explanation: ["package8/direct3은 warning0이며 모든 source가 독립 main입니다.", "Ex06은 normal·catch return·uncaught EOF 모두 finally를 거치지만 후속 문장 도달 여부는 다릅니다.", "Ex07은 parse exception propagation과 pre-parse EOF를 구분하고 Ex08은 label control과 recovery 재실패를 구분합니다.", "companion5는 direct focus 밖 package regression을 exit·cause·line-count로 감시합니다."] },
        experiments: [
          { change: "Ex06 finally의 scan.close를 catch마다 복사합니다.", prediction: "현재 세 catch 밖 EOF 경로에서 close가 누락되고 중복 code가 늘어납니다.", result: "manual finally보다 ownership을 표현하는 try-with-resources가 더 안전한 경계입니다." },
          { change: "Ex07 throws NumberFormatException 두 선언을 제거합니다.", prediction: "unchecked라 compile과 실행은 같지만 propagation documentation signal이 사라집니다.", result: "unchecked throws는 compiler 의무가 아니라 API communication 선택입니다." },
          { change: "Ex08 숫자 catch에서 nextLine을 제거합니다.", prediction: "invalid token이 cursor에 남아 continue가 같은 token을 반복 처리합니다.", result: "finally correctness와 input-state recovery correctness는 별도 문제입니다." },
          { change: "temp 생성 직후 또는 launcher environment 일부 제거 뒤 synthetic exception을 주입합니다.", prediction: "outer catch가 body error를 보존하고 finally가 environment restore와 owned-root cleanup을 둘 다 시도합니다.", result: "setup도 try 안에 두고 cleanup errors를 original과 함께 전파해야 failure path에서 상태를 잃지 않습니다." },
        ],
        sourceRefs: ["java-class08-ex01", "java-class08-ex02", "java-class08-ex03", "java-class08-ex04", "java-class08-ex05", "java-class08-ex06", "java-class08-ex07", "java-class08-ex08", "jdk21-javac", "dotnet-process-start-info", "powershell-environment-variables", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "finally marker가 보였으니 process가 성공했다고 기록했다.", likelyCause: "finally 실행과 이후 completion reason을 같은 사실로 보았습니다.", checks: ["exit code와 stderr를 분리합니다.", "finally 뒤 문장 도달 여부를 봅니다.", "Ex06/08 EOF source frame을 확인합니다."], fix: "stdout marker·stderr type/frame·exit를 한 case contract에 함께 assert합니다.", prevention: "normal/return/throw/break/continue별 expected destination 표를 유지합니다." },
        { symptom: "interactive 감사가 멈추거나 환경에 따라 compiler output이 달라진다.", likelyCause: "stdin EOF·timeout·Java launcher environment를 통제하지 않았습니다.", checks: ["stdin close를 확인합니다.", "launcher options4가 child까지 제거되는지 봅니다.", "async drain과 bounded kill을 확인합니다."], fix: "fresh process, closed stdin, hostile4 isolation, 10초+5초 lifecycle과 deterministic cleanup을 적용합니다.", prevention: "process harness 자체를 provenance와 함께 공용 검증 대상으로 둡니다." },
      ],
      expertNotes: ["‘finally는 반드시’는 JVM process가 해당 try statement를 정상적으로 빠져나가는 language-level 경로에 대한 설명이지, process halt·OS kill·전원 상실까지 보장하는 durability 문장이 아닙니다.", "Scanner(System.in)을 닫았다는 원본 사실과 shared System.in을 닫는 것이 좋은 소유권 설계인지는 분리해 평가합니다."],
    },
    {
      id: "finally-completion-reasons",
      title: "연결된 try statement가 완료될 때 finally가 그 boundary 밖 목적지보다 먼저 실행됩니다",
      lead: "‘try 뒤에 붙는 마지막 문장’이 아니라 try/catch의 normal completion 또는 그 try boundary를 실제로 떠나는 return·throw·break·continue와 바깥 목적지 사이에 삽입되는 제어 흐름으로 읽습니다. 같은 try 안 target으로 이동하는 제어에는 아직 outer finally가 개입하지 않습니다.",
      explanations: [
        "try가 normal completion하면 finally를 실행한 뒤 try statement 다음 문장으로 갑니다. catch가 정상 완료한 경우도 마찬가지로 finally 뒤 다음 문장으로 이어집니다.",
        "try/catch가 return을 평가하면 반환 값과 return destination은 잠시 보류됩니다. finally가 정상 완료해야 그 값으로 caller에게 돌아갑니다. Ex06의 catch return 전에 marker가 출력되는 이유입니다.",
        "exception이 handler 없이 전파되거나 catch가 다시 throw하면 exception object와 target caller가 보류됩니다. 현재 frame의 finally가 정상 완료한 뒤 같은 exception propagation이 재개됩니다.",
        "break와 continue도 label 또는 loop target을 가진 abrupt completion이지만, finally는 그 제어 이동이 실제로 빠져나가는 try boundary에서만 실행됩니다. Ex08의 continue와 continue esc는 outer try 안 labelled while을 계속하므로 outer finally를 실행하지 않습니다. break esc 역시 try 밖이 아니라 labelled while의 끝을 target으로 하며, matching break를 labelled statement가 처리해 정상 완료합니다. 이어질 statement가 없어 try block도 정상 완료한 다음 outer finally가 실행됩니다.",
        "finally block이 normal completion해야 원래 completion reason이 유지됩니다. finally 안 return·throw·break·continue가 발생하면 원래 reason과 값/exception이 폐기되므로 cleanup에는 control transfer를 두지 않습니다.",
        "System.exit는 정상적인 statement completion이나 stack unwinding이 아니라 shutdown sequence를 시작하므로 일반 finally 보장이 적용되지 않습니다. Runtime.halt, task kill, JVM crash, OS 종료, 전원 상실은 더 강한 반례입니다.",
        "shutdown hook도 best-effort process lifecycle 도구이지 transaction commit이나 durable cleanup 보장이 아닙니다. 중요한 데이터는 finally marker가 아니라 fsync·transaction·idempotent recovery 같은 subsystem 계약으로 보호합니다.",
      ],
      concepts: [
        { term: "pending completion", definition: "return value, thrown object, break/continue target처럼 finally 실행 동안 잠시 보류되는 기존 제어 이동입니다.", detail: ["finally normal completion 뒤 재개됩니다.", "finally abrupt completion이 대체할 수 있습니다."] },
        { term: "stack unwinding", definition: "exception이 caller로 전파되며 각 invocation frame의 catch/finally 처리를 거쳐 frame을 제거하는 과정입니다.", detail: ["각 finally의 side effect가 순서대로 발생합니다.", "process halt는 이 경로가 아닙니다."] },
        { term: "labelled control", definition: "break label 또는 continue label이 명시 target statement/loop로 이동시키는 abrupt completion입니다.", detail: ["현재 try를 실제로 떠나는지 먼저 봅니다.", "같은 try 안 반복이면 outer finally는 아직 실행되지 않을 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-finally-completion-matrix",
        title: "다섯 completion reason의 finally 순서를 출력합니다",
        language: "java",
        filename: "FinallyCompletionMatrix.java",
        purpose: "normal·return·throw·continue·break의 destination보다 finally가 먼저임을 deterministic trace로 증명합니다.",
        code: String.raw`public class FinallyCompletionMatrix {
    static int returnPath() {
        try {
            System.out.println("return.try");
            return 7;
        } finally {
            System.out.println("return.finally");
        }
    }

    static void throwPath() {
        try {
            System.out.println("throw.try");
            throw new IllegalStateException("boom");
        } finally {
            System.out.println("throw.finally");
        }
    }

    static void loopPaths() {
        outer:
        for (int i = 0; i < 3; i++) {
            try {
                if (i == 0) {
                    System.out.println("loop.continue=" + i);
                    continue;
                }
                System.out.println("loop.break=" + i);
                break outer;
            } finally {
                System.out.println("loop.finally=" + i);
            }
        }
        System.out.println("loop.after");
    }

    public static void main(String[] args) {
        try {
            System.out.println("normal.try");
        } finally {
            System.out.println("normal.finally");
        }
        System.out.println("return.value=" + returnPath());
        try {
            throwPath();
        } catch (IllegalStateException e) {
            System.out.println("throw.caught=" + e.getMessage());
        }
        loopPaths();
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "return value7을 계산해 보류한 뒤 finally를 출력하고 caller println이 값을 받습니다." },
          { lines: "11-18", explanation: "IllegalStateException propagation 전에 finally가 실행되고 같은 exception이 caller catch에 도달합니다." },
          { lines: "20-35", explanation: "continue와 labelled break가 각 iteration의 finally 뒤 해당 target으로 이동하며 loop 밖 문장은 break 후 실행됩니다." },
          { lines: "37-51", explanation: "normal finally, return, throw/catch, loop paths를 호출해 관찰 순서를 하나의 exact trace로 만듭니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("FinallyCompletionMatrix.java", "FinallyCompletionMatrix") },
        output: { value: "normal.try\nnormal.finally\nreturn.try\nreturn.finally\nreturn.value=7\nthrow.try\nthrow.finally\nthrow.caught=boom\nloop.continue=0\nloop.finally=0\nloop.break=1\nloop.finally=1\nloop.after", explanation: ["normal과 return은 finally 뒤 원래 destination으로 갑니다.", "throw는 finally 뒤 동일 message로 catch됩니다.", "continue0과 break1 모두 해당 iteration finally 뒤 이동합니다."] },
        experiments: [
          { change: "loop의 break outer를 일반 break로 바꿉니다.", prediction: "현재 loop가 하나뿐이라 exact output은 같습니다.", result: "label 의미는 nested target이 생길 때 달라지므로 target structure와 함께 읽습니다." },
          { change: "throwPath의 finally에서 새 exception을 던집니다.", prediction: "boom은 caller에서 직접 보이지 않고 새 exception이 전파됩니다.", result: "다음 장의 masking 문제이며 cleanup failure는 suppressed로 보존해야 합니다." },
        ],
        sourceRefs: ["java-class08-ex06", "java-class08-ex08", "jls-abrupt-completion", "jls-finally-execution", "java-system-exit", "java-runtime-halt", "java-shutdown-hook"],
      }],
      diagnostics: [
        { symptom: "Ex08의 continue마다 outer finally가 실행된다고 설명했다.", likelyCause: "continue target이 outer try 밖인지 확인하지 않았습니다.", checks: ["label target을 찾습니다.", "control이 try statement 자체를 떠나는지 봅니다.", "marker 횟수를 exact output으로 셉니다."], fix: "각 abrupt completion의 source와 target 사이에 어떤 try statements를 빠져나오는지 그립니다.", prevention: "nested loop에서는 label·try boundary를 함께 표시합니다." },
        { symptom: "System.exit 뒤에도 finally가 항상 실행된다고 의존했다.", likelyCause: "language-level completion과 process termination을 혼동했습니다.", checks: ["exit/halt 호출을 검색합니다.", "external kill/crash 가능성을 봅니다.", "cleanup이 durability를 요구하는지 확인합니다."], fix: "process termination에 중요한 상태는 transaction·journal·recovery protocol로 보호합니다.", prevention: "‘always’ 대신 적용되는 completion boundary와 제외 조건을 문서화합니다." },
      ],
      expertNotes: ["return expression은 finally 전에 평가되므로 primitive/value snapshot과 mutable object reference의 차이도 생깁니다. finally가 반환 객체를 mutate하면 caller가 보는 객체 state는 달라질 수 있습니다.", "virtual thread cancellation도 결국 interrupt/exception/cooperative protocol로 다뤄야 하며 강제 process kill과 같은 보장을 주지 않습니다."],
    },
    {
      id: "finally-masking-and-information-loss",
      title: "finally의 return·throw는 원래 값과 예외를 덮으므로 cleanup failure도 정보 보존 규칙이 필요합니다",
      lead: "‘finally가 마지막이니 우선’이라는 실행 규칙이 디버깅 가능한 원인을 사라지게 하는 방식과 안전한 보존 방식을 대조합니다.",
      explanations: [
        "try에서 return 값을 계산해도 finally가 return하면 finally 값이 최종 반환값이 됩니다. javac -Xlint:finally가 명백히 normal completion 불가능한 finally를 경고하는 이유도 이 정보 손실 위험입니다.",
        "try의 primary exception이 전파 중이어도 finally가 새 exception을 던지면 새 exception이 최종 전파되고 primary는 자동 cause나 suppressed가 되지 않습니다. 수동 finally cleanup은 원인을 직접 보존하지 않으면 잃습니다.",
        "cleanup이 실패했다고 무시하는 것도 안전하지 않습니다. flush/commit/close failure는 데이터가 완전히 기록되지 않았다는 중요한 신호일 수 있으므로 primary와 함께 보존하거나 close-only failure로 전파해야 합니다.",
        "try-with-resources는 body의 primary exception을 유지하고 close failures를 addSuppressed로 붙입니다. body가 성공했는데 close만 실패하면 첫 close failure가 primary가 되고 이후 close failures가 suppressed가 됩니다.",
        "catch에서 exception variable을 바꾸거나 message만 복사한 새 exception을 던지면 stack/cause가 끊깁니다. abstraction translation이 필요하면 constructor cause에 원본을 전달합니다.",
        "finally에는 release attempt와 관찰 가능한 최소 cleanup만 두고 return·business branching·새 성공 결과 계산을 두지 않습니다. cleanup API 자체가 던질 수 있으면 TWR 또는 명시 suppression protocol을 사용합니다.",
        "suppressed는 cause와 다릅니다. cause는 ‘이 예외가 발생한 근본 operation 실패’, suppressed는 ‘primary를 보존하느라 함께 전파하지 못한 추가 실패’를 나타냅니다.",
      ],
      concepts: [
        { term: "exception masking", definition: "나중 finally/cleanup failure가 먼저 발생한 primary exception을 대체해 원래 실패가 caller에게 보이지 않게 되는 현상입니다.", detail: ["자동 cause 연결은 없습니다.", "TWR suppression이 대표 해법입니다."] },
        { term: "primary exception", definition: "현재 실패 경로의 대표로 실제 전파되는 exception입니다.", detail: ["body failure가 있으면 보통 body exception입니다.", "close-only에서는 첫 close failure일 수 있습니다."] },
        { term: "suppressed exception", definition: "primary를 유지하면서 함께 기록된 추가 exception으로 Throwable.getSuppressed에서 읽습니다.", detail: ["cause chain과 별도 배열입니다.", "모든 logger가 자동 표시하는지 확인해야 합니다."] },
      ],
      codeExamples: [{
        id: "java-finally-masking",
        title: "return/throw masking과 명시 suppression을 한 실행에서 비교합니다",
        language: "java",
        filename: "FinallyMasking.java",
        purpose: "finally의 새 control transfer가 primary를 잃는 것을 재현하고, 보존된 추가 cleanup failure와 구조적으로 대조합니다.",
        code: String.raw`public class FinallyMasking {
    static boolean override = true;

    static int maskedReturn() {
        try {
            throw new IllegalStateException("primary-return");
        } finally {
            if (override) return 9;
        }
    }

    static void maskedThrow() {
        try {
            throw new IllegalStateException("primary-throw");
        } finally {
            if (override) throw new IllegalArgumentException("finally-throw");
        }
    }

    static void preserved() {
        IllegalStateException primary = new IllegalStateException("primary-safe");
        try {
            throw primary;
        } finally {
            try {
                throw new IllegalArgumentException("cleanup-safe");
            } catch (IllegalArgumentException cleanup) {
                primary.addSuppressed(cleanup);
            }
        }
    }

    public static void main(String[] args) {
        System.out.println("maskedReturn=" + maskedReturn());
        try {
            maskedThrow();
        } catch (RuntimeException e) {
            System.out.println("maskedThrow=" + e.getClass().getSimpleName() + ":" + e.getMessage()
                    + ":cause=" + e.getCause());
        }
        try {
            preserved();
        } catch (IllegalStateException e) {
            System.out.println("safePrimary=" + e.getClass().getSimpleName() + ":" + e.getMessage());
            System.out.println("safeSuppressed=" + e.getSuppressed().length + ":"
                    + e.getSuppressed()[0].getMessage());
        }
    }
}`,
        walkthrough: [
          { lines: "1-10", explanation: "runtime true인 non-final guard 아래 finally return9가 pending primary exception을 폐기하고 성공값처럼 보이게 합니다." },
          { lines: "12-18", explanation: "finally의 IllegalArgumentException이 primary-throw를 cause 없이 대체합니다." },
          { lines: "20-31", explanation: "원래 primary object에 cleanup failure를 suppressed로 붙이고 finally를 normal completion시켜 primary propagation을 유지합니다." },
          { lines: "33-48", explanation: "masked paths의 정보 손실과 preserved path의 primary/suppressed 구조를 field로 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("FinallyMasking.java", "FinallyMasking") },
        output: { value: "maskedReturn=9\nmaskedThrow=IllegalArgumentException:finally-throw:cause=null\nsafePrimary=IllegalStateException:primary-safe\nsafeSuppressed=1:cleanup-safe", explanation: ["return9는 primary-return이 있었다는 사실을 숨깁니다.", "finally-throw의 cause=null은 primary가 자동 보존되지 않음을 보입니다.", "preserved는 primary type/message와 suppressed cleanup을 모두 유지합니다."] },
        experiments: [
          { change: "override를 compile-time constant true로 만듭니다.", prediction: "-Xlint:all에서 finally clause cannot complete normally warning이 발생합니다.", result: "lint는 명백한 일부 사례를 잡지만 conditional/runtime masking까지 정책 review가 필요합니다." },
          { change: "cleanup exception을 primary.initCause로 연결합니다.", prediction: "원인 방향이 뒤집혀 primary가 cleanup의 결과처럼 표현됩니다.", result: "동시 추가 실패는 cause가 아니라 suppressed 관계입니다." },
        ],
        sourceRefs: ["jls-finally-execution", "java-throwable-api", "effective-java-exceptions"],
      }],
      diagnostics: [
        { symptom: "실패해야 할 method가 값9를 정상 반환했다.", likelyCause: "finally 안 return이 try의 exception/return을 덮었습니다.", checks: ["finally의 return/break/continue를 검색합니다.", "-Xlint:finally를 켭니다.", "원래 throw point를 trace합니다."], fix: "finally control transfer를 제거하고 cleanup만 수행합니다.", prevention: "lint warning0와 code review rule로 finally abrupt completion을 금지합니다." },
        { symptom: "stack trace에는 close failure만 있고 business failure가 사라졌다.", likelyCause: "manual finally close가 새 exception을 그대로 던졌습니다.", checks: ["cause와 getSuppressed를 모두 봅니다.", "body failure가 먼저였는지 확인합니다.", "manual close pattern을 찾습니다."], fix: "try-with-resources를 사용하거나 primary에 cleanup failure를 suppressed로 보존합니다.", prevention: "resource cleanup template를 표준화하고 dual-failure test를 둡니다." },
      ],
      expertNotes: ["위 preserved 코드는 suppression 의미를 가르치기 위한 최소 재현입니다. production에서는 primary tracking을 수동 재구현하지 말고 TWR compiler translation에 맡깁니다.", "InterruptedException을 finally에서 다른 exception으로 덮으면 cancellation 신호까지 잃을 수 있으므로 interrupt policy도 primary preservation의 일부입니다."],
    },
    {
      id: "throws-catch-or-declare",
      title: "throws는 실패를 처리하지 않고 caller 계약으로 선언하며 checked exception은 catch-or-declare를 강제합니다",
      lead: "Ex07의 unchecked throws 표기와 IOException 같은 checked declaration을 구분해 compiler 의무·문서 신호·복구 owner를 나눕니다.",
      explanations: [
        "throw는 exception object를 실제로 발생시키는 statement이고 throws는 method/constructor header가 밖으로 나갈 수 있는 checked types를 선언하는 계약입니다. 철자가 비슷하지만 실행과 선언 역할이 다릅니다.",
        "checked exception을 던질 수 있는 invocation은 현재 method가 catch하거나 자신의 throws에 포함해야 합니다. 이를 catch-or-declare라 하며 caller chain에서 복구 가능한 boundary까지 반복됩니다.",
        "RuntimeException과 Error 계열은 compiler가 catch-or-declare를 강제하지 않습니다. Ex07의 throws NumberFormatException은 compile 필수는 아니고 첫 글자 parse 실패 가능성을 caller에게 알리는 documentation 선택입니다.",
        "throws를 썼다고 resource cleanup이나 logging이 이루어지는 것은 아닙니다. method가 frame을 떠날 때 finally/TWR가 있으면 먼저 실행되고 그 뒤 exception이 caller로 전파됩니다.",
        "낮은 계층의 IOException을 모든 상위 public API에 그대로 노출하면 구현 detail이 새어 나갑니다. caller가 I/O 수준 복구를 해야 할 때만 유지하고, domain boundary에서는 의미 있는 type/result로 translate합니다.",
        "checked 여부와 복구 가능성은 동일하지 않습니다. checked도 현재 caller가 복구할 수 없을 수 있고 unchecked user input도 boundary에서 즉시 복구 안내가 가능할 수 있습니다.",
        "throws 목록은 API compatibility에 영향을 줍니다. overriding method는 parent method보다 넓은 새 checked exception을 선언할 수 없고, narrow subtype 또는 제거는 가능합니다.",
      ],
      concepts: [
        { term: "catch-or-declare", definition: "checked exception이 발생 가능한 지점을 enclosing catch로 처리하거나 현재 callable의 throws clause로 선언해야 하는 compile-time 규칙입니다.", detail: ["unchecked에는 강제되지 않습니다.", "복구 품질을 자동 보장하지 않습니다."] },
        { term: "throws clause", definition: "callable 밖으로 전파될 수 있는 exception types를 header에 선언한 API surface입니다.", detail: ["checked types는 compiler contract입니다.", "unchecked 표기는 선택적 documentation입니다."] },
        { term: "recovery owner", definition: "실패 context와 대체 행동 권한을 모두 가져 의미 있게 catch할 수 있는 계층입니다.", detail: ["없으면 context를 보존해 전파합니다.", "catch 위치를 type만으로 결정하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-throws-boundary",
        title: "repository→service→main의 checked propagation과 unchecked parse를 구분합니다",
        language: "java",
        filename: "ThrowsBoundary.java",
        purpose: "checked IOException은 두 method header를 지나 main에서 처리하고 unchecked parse는 선언 없이도 catch됨을 보여 줍니다.",
        code: String.raw`import java.io.IOException;

public class ThrowsBoundary {
    static String repository(boolean available) throws IOException {
        if (!available) throw new IOException("catalog-offline");
        return "catalog-v1";
    }

    static String service(boolean available) throws IOException {
        return repository(available);
    }

    static int parsePort(String text) {
        return Integer.parseInt(text);
    }

    public static void main(String[] args) {
        try {
            System.out.println("success=" + service(true));
            service(false);
        } catch (IOException e) {
            System.out.println("checked=" + e.getClass().getSimpleName() + ":" + e.getMessage());
        }
        try {
            parsePort("bad");
        } catch (NumberFormatException e) {
            System.out.println("unchecked=" + e.getClass().getSimpleName());
        }
    }
}`,
        walkthrough: [
          { lines: "1-11", explanation: "repository와 service가 IOException을 처리하지 않고 동일 checked contract로 caller에 선언합니다." },
          { lines: "13-15", explanation: "parsePort는 unchecked NumberFormatException을 header에 쓰지 않아도 compile됩니다." },
          { lines: "17-30", explanation: "main이 service failure의 복구 owner가 되어 checked type/message를 처리하고 parse failure도 별도 policy로 분리합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ThrowsBoundary.java", "ThrowsBoundary") },
        output: { value: "success=catalog-v1\nchecked=IOException:catalog-offline\nunchecked=NumberFormatException", explanation: ["첫 service call은 값을 반환합니다.", "두 번째 IOException은 repository와 service를 지나 main catch에 도달합니다.", "unchecked parse도 runtime catch가 가능하지만 선언 의무는 없습니다."] },
        experiments: [
          { change: "service의 throws IOException을 제거합니다.", prediction: "repository call이 unreported exception compile error가 됩니다.", result: "service가 catch하지 않으면 checked contract를 선언해야 합니다." },
          { change: "parsePort에 throws NumberFormatException을 추가합니다.", prediction: "compile/runtime은 같고 API 문서 surface만 명시적이 됩니다.", result: "unchecked throws 선언의 가치와 noise를 public contract 관점에서 판단합니다." },
        ],
        sourceRefs: ["java-class08-ex07", "jls-throwing-exceptions", "jls-exception-checking", "java-io-exception-api", "java-number-format-api"],
      }],
      diagnostics: [
        { symptom: "throws를 추가했는데 exception이 처리됐다고 생각했다.", likelyCause: "declaration과 handling을 혼동했습니다.", checks: ["method body에 catch가 있는지 봅니다.", "caller chain의 첫 handler를 찾습니다.", "uncaught main exit를 실행합니다."], fix: "복구 owner가 catch하고 나머지 계층은 필요한 context와 checked contract를 보존해 전파합니다.", prevention: "sequence diagram에 throw point·declaration·handler를 서로 다른 표식으로 둡니다." },
        { symptom: "override에서 Exception을 선언하자 compile되지 않는다.", likelyCause: "parent contract보다 넓은 checked exception을 추가했습니다.", checks: ["overridden declaration을 봅니다.", "checked subtype relation을 확인합니다.", "unchecked인지 구분합니다."], fix: "parent가 허용한 checked type의 subtype으로 좁히거나 내부에서 translate/handle합니다.", prevention: "public interface의 failure contract를 구현체 작성 전에 설계합니다." },
      ],
      expertNotes: ["throws Exception은 caller가 실패별 복구 policy를 정하기 어렵게 하므로 boundary가 정말 모든 checked families를 동일 취급하는 경우가 아니면 피합니다.", "generic type parameter 기반 `throws T`와 sneaky throw는 compiler surface를 우회할 수 있어 framework internals 외 public application code에서는 진단 가능성을 크게 떨어뜨립니다."],
    },
    {
      id: "caller-propagation-and-precise-rethrow",
      title: "caller propagation은 frame별 finally를 지나고 precise rethrow는 실제 throw set만 유지합니다",
      lead: "넓은 catch parameter를 사용해 공통 관찰을 하더라도 compiler가 try에서 가능한 checked types를 정밀하게 추론하는 조건을 확인합니다.",
      explanations: [
        "exception이 현재 method에 matching catch가 없으면 caller invocation 지점으로 전파됩니다. 각 frame을 떠나기 전에 활성 finally가 실행되므로 stack trace와 side-effect trace를 함께 읽습니다.",
        "Java의 precise rethrow 분석은 catch parameter가 final 또는 effectively final이고 try가 던질 수 있는 checked types가 제한되어 있으면 `catch (Exception e) { throw e; }`도 그 실제 union만 다시 선언하게 합니다.",
        "예제 boundary는 IOException과 SQLException만 가능한 lowLevel을 호출하므로 header가 throws IOException, SQLException이면 충분합니다. catch parameter type 자체가 Exception이라고 throws Exception으로 넓힐 필요는 없습니다.",
        "catch parameter에 새 값을 대입하면 precise rethrow 정보가 깨집니다. 어떤 object가 다시 던져지는지 compiler가 보장할 수 없어 선언을 넓혀야 하거나 assignment가 금지된 multi-catch를 사용해야 합니다.",
        "공통 catch에서 log만 한 뒤 rethrow하는 것은 동일 failure를 여러 계층에서 중복 log할 위험이 있습니다. correlation context를 추가할 유일한 boundary 또는 최종 handler에서 한 번 기록합니다.",
        "stack trace는 보통 Throwable 생성자가 fillInStackTrace를 호출할 때 캡처되고 아래 frames는 그 지점의 caller 방향입니다. 같은 object를 `throw e`로 다시 던져도 기존 trace를 유지하며 rethrow line을 새 frame으로 추가하지 않습니다. Java에는 bare rethrow 문법이 없으므로 context를 더하지 않는 불필요한 catch는 제거하고, abstraction context가 필요하면 original을 cause로 보존한 새 예외로 번역합니다.",
        "catch해 의미 있는 state repair를 하지 못하면 finally/TWR로 local ownership만 정리하고 exception을 그대로 전파하거나 abstraction boundary에서 cause를 가진 domain type으로 번역합니다.",
      ],
      concepts: [
        { term: "precise rethrow", definition: "넓은 catch parameter를 다시 던져도 compiler가 try에서 실제 가능한 checked exception types만 추론해 throws contract를 좁게 유지하는 분석입니다.", detail: ["catch parameter가 effectively final이어야 합니다.", "try의 throw set에 의존합니다."] },
        { term: "throw set", definition: "특정 statement/block이 정상 규칙상 밖으로 던질 수 있다고 compiler가 계산한 exception types 집합입니다.", detail: ["checked analysis의 입력입니다.", "dead code와 catch 구조의 영향을 받습니다."] },
        { term: "frame-local cleanup", definition: "현재 invocation이 소유한 자원만 frame을 떠나기 전에 정리하고 failure policy는 caller에 유지하는 방식입니다.", detail: ["finally/TWR가 담당합니다.", "global recovery와 구분합니다."] },
      ],
      codeExamples: [{
        id: "java-precise-rethrow",
        title: "catch(Exception) 공통 관찰 뒤 IOException·SQLException만 precise rethrow합니다",
        language: "java",
        filename: "PreciseRethrow.java",
        purpose: "catch parameter type과 method throws surface가 반드시 같지 않으며 finally가 각 propagation 전에 실행됨을 보여 줍니다.",
        code: String.raw`import java.io.IOException;
import java.sql.SQLException;

public class PreciseRethrow {
    static void lowLevel(String mode) throws IOException, SQLException {
        if (mode.equals("io")) throw new IOException("disk");
        if (mode.equals("sql")) throw new SQLException("database");
        System.out.println("low=" + mode);
    }

    static void boundary(String mode) throws IOException, SQLException {
        try {
            lowLevel(mode);
        } catch (Exception e) {
            System.out.println("boundary=" + e.getClass().getSimpleName());
            throw e;
        } finally {
            System.out.println("finally=" + mode);
        }
    }

    public static void main(String[] args) {
        for (String mode : new String[] {"io", "sql", "ok"}) {
            try {
                boundary(mode);
            } catch (IOException e) {
                System.out.println("caller=IOException:" + e.getMessage());
            } catch (SQLException e) {
                System.out.println("caller=SQLException:" + e.getMessage());
            }
        }
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "lowLevel의 checked throw set은 IOException·SQLException이고 ok만 정상 출력합니다." },
          { lines: "11-20", explanation: "넓은 Exception catch parameter를 재할당하지 않아 precise rethrow가 두 실제 checked types만 유지하며 finally는 세 mode 모두 실행됩니다." },
          { lines: "22-32", explanation: "caller가 두 checked types를 구체 catch하고 ok는 catch 없이 loop 다음 iteration으로 정상 완료합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("PreciseRethrow.java", "PreciseRethrow") },
        output: { value: "boundary=IOException\nfinally=io\ncaller=IOException:disk\nboundary=SQLException\nfinally=sql\ncaller=SQLException:database\nlow=ok\nfinally=ok", explanation: ["io/sql은 boundary 관찰→finally→caller handler 순서입니다.", "ok는 low 출력 뒤 finally를 거쳐 정상 복귀합니다.", "method header는 Exception으로 넓어지지 않습니다."] },
        experiments: [
          { change: "catch에서 `e = new Exception()`을 대입하려 합니다.", prediction: "현재 parameter는 일반 catch라 대입 자체는 가능하지만 throw e의 static type이 넓어져 현재 throws contract로 compile되지 않습니다.", result: "precise rethrow는 catch parameter identity 보존에 의존합니다." },
          { change: "catch를 IOException | SQLException multi-catch로 바꿉니다.", prediction: "동일 output과 throws surface를 유지하고 parameter assignment는 compile-time 금지됩니다.", result: "공통 처리 alternatives가 disjoint할 때 multi-catch가 의도를 더 직접 표현합니다." },
        ],
        sourceRefs: ["java-class08-ex07", "jls-precise-rethrow", "jls-finally-execution", "java-io-exception-api", "java-sql-exception-api"],
      }],
      diagnostics: [
        { symptom: "catch(Exception) 때문에 method가 반드시 throws Exception이어야 한다고 생각했다.", likelyCause: "parameter static type과 precise rethrow throw set을 동일시했습니다.", checks: ["try에서 실제 가능한 checked types를 셉니다.", "catch parameter 재할당 여부를 봅니다.", "compiler-declared contract를 확인합니다."], fix: "parameter를 effectively final로 유지하고 실제 checked union만 선언합니다.", prevention: "broad catch가 필요한 공통 처리는 precise rethrow test와 함께 둡니다." },
        { symptom: "같은 failure가 repository·service·controller에서 세 번 log된다.", likelyCause: "각 propagation frame이 catch-log-rethrow를 반복했습니다.", checks: ["correlation id로 중복 event를 묶습니다.", "각 log가 새 context를 추가하는지 봅니다.", "최종 handler 위치를 찾습니다."], fix: "local frame은 cleanup/translation만 하고 최종 관찰 boundary에서 한 번 상세 log합니다.", prevention: "logging ownership과 exception ownership을 architecture 문서에 분리합니다." },
      ],
      expertNotes: ["precise rethrow는 public API를 쓸데없이 `throws Exception`으로 오염시키지 않지만, catch(Exception) 자체의 policy surface가 넓다는 runtime 사실은 그대로입니다.", "SQLException의 chained exceptions와 Throwable cause/suppressed는 서로 다른 구조일 수 있으므로 database diagnostics에서는 vendor chain도 별도로 확인합니다."],
    },
    {
      id: "exception-translation-boundary",
      title: "구현 예외는 abstraction boundary에서 domain 예외로 번역하되 cause와 실패 context를 보존합니다",
      lead: "낮은 수준 type을 숨기는 것과 원인을 지우는 것을 구분해 caller에게 안정적인 계약과 개발자에게 진단 가능한 chain을 동시에 제공합니다.",
      explanations: [
        "repository가 IOException을 그대로 service/controller까지 노출하면 storage가 file에서 database로 바뀔 때 public failure surface도 흔들립니다. domain boundary는 ‘카탈로그 접근 실패’처럼 caller 행동에 맞는 type을 제공할 수 있습니다.",
        "translation constructor에 original exception을 cause로 전달해야 root type, message, stack과 operation chain이 유지됩니다. 새 message만 던지면 원본 frame과 vendor details가 사라집니다.",
        "domain message에는 실패 operation과 안전한 identifier를 담되 credential, absolute path, query parameter, 개인정보를 넣지 않습니다. 민감 context는 접근 통제된 structured diagnostics로 분리합니다.",
        "같은 abstraction 안에서 의미가 바뀌지 않으면 무조건 wrapping하지 않습니다. 불필요한 wrapper layer는 cause depth와 boilerplate만 늘리고 catch policy를 더 어렵게 만듭니다.",
        "checked domain exception과 unchecked domain exception 선택은 caller 복구 계약, compatibility, framework transaction behavior를 함께 봅니다. type 이름보다 recovery owner와 rollback semantics가 먼저입니다.",
        "TWR close failure가 primary의 suppressed에 붙어 있다면 translation할 때 original을 cause로 보존해야 그 suppressed 배열도 cause subtree 안에 남습니다. message 복사만으로는 보존되지 않습니다.",
        "최종 사용자 응답은 stable error code와 다음 행동을 제공하고 developer channel은 domain wrapper, cause, suppressed, correlation id를 모두 기록합니다.",
      ],
      concepts: [
        { term: "exception translation", definition: "낮은 abstraction의 failure를 caller가 이해하는 상위 domain type으로 바꾸면서 original을 cause로 보존하는 경계 작업입니다.", detail: ["type 안정성을 제공합니다.", "root diagnostics를 버리지 않습니다."] },
        { term: "abstraction leakage", definition: "public API가 caller가 알 필요 없는 storage/network/library exception details에 결합되는 현상입니다.", detail: ["implementation 교체 비용을 높입니다.", "무조건 wrapping과는 다른 문제입니다."] },
        { term: "stable error code", definition: "표시 문구나 low-level message와 독립적으로 caller/user 행동을 연결하는 versioned identifier입니다.", detail: ["민감 정보를 포함하지 않습니다.", "correlation id와 역할이 다릅니다."] },
      ],
      codeExamples: [{
        id: "java-exception-translation-cause",
        title: "IOException을 CatalogAccessException으로 번역하고 cause를 구조적으로 확인합니다",
        language: "java",
        filename: "ExceptionTranslationCause.java",
        purpose: "domain contract, safe context, cause preservation을 message 문자열 parsing 없이 검증합니다.",
        code: String.raw`import java.io.IOException;

public class ExceptionTranslationCause {
    static final class CatalogAccessException extends Exception {
        private static final long serialVersionUID = 1L;
        private final String code;

        CatalogAccessException(String code, String message, Throwable cause) {
            super(message, cause);
            this.code = code;
        }

        String code() {
            return code;
        }
    }

    static String repository(String catalogId) throws IOException {
        throw new IOException("storage-unavailable:" + catalogId);
    }

    static String service(String catalogId) throws CatalogAccessException {
        try {
            return repository(catalogId);
        } catch (IOException cause) {
            throw new CatalogAccessException("CATALOG_UNAVAILABLE",
                    "catalog access failed", cause);
        }
    }

    public static void main(String[] args) {
        try {
            service("demo-42");
        } catch (CatalogAccessException e) {
            System.out.println("public=" + e.code() + ":" + e.getMessage());
            System.out.println("cause=" + e.getCause().getClass().getSimpleName()
                    + ":" + e.getCause().getMessage());
            System.out.println("suppressed=" + e.getCause().getSuppressed().length);
        }
    }
}`,
        walkthrough: [
          { lines: "1-16", explanation: "serial contract, stable code, public message와 cause를 가진 checked domain exception을 정의합니다." },
          { lines: "18-29", explanation: "repository IOException을 service boundary에서 CatalogAccessException으로 번역하고 original object를 cause로 전달합니다." },
          { lines: "31-41", explanation: "caller는 stable public fields와 developer cause fields를 분리해 읽고 cause의 suppressed subtree도 접근 가능합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ExceptionTranslationCause.java", "ExceptionTranslationCause") },
        output: { value: "public=CATALOG_UNAVAILABLE:catalog access failed\ncause=IOException:storage-unavailable:demo-42\nsuppressed=0", explanation: ["public surface는 storage type을 노출하지 않습니다.", "developer cause에는 original IOException과 safe synthetic id가 남습니다.", "현재 cleanup 추가 실패가 없어 suppressed0입니다."] },
        experiments: [
          { change: "constructor에서 super(message)만 호출합니다.", prediction: "getCause가 null이 되어 root type·stack·suppressed subtree를 잃습니다.", result: "translation의 핵심은 abstraction type과 cause preservation을 동시에 만족하는 것입니다." },
          { change: "public message에 absolute storage path를 넣습니다.", prediction: "사용자 응답/log forwarding을 통해 내부 구조가 노출될 수 있습니다.", result: "safe code/message와 restricted diagnostics를 분리합니다." },
        ],
        sourceRefs: ["java-class08-ex02", "java-throwable-api", "effective-java-exceptions", "owasp-error-handling", "java-io-exception-api"],
      }],
      diagnostics: [
        { symptom: "domain exception만 보이고 실제 I/O 원인을 찾을 수 없다.", likelyCause: "translation에서 cause를 버렸습니다.", checks: ["constructor super(message,cause)를 확인합니다.", "getCause chain을 순회합니다.", "suppressed가 cause subtree에 있는지 봅니다."], fix: "원본 Throwable object를 cause로 보존하고 regression test로 type/message/frame을 확인합니다.", prevention: "custom exception constructor template에 cause overload를 필수로 둡니다." },
        { symptom: "사용자 오류 화면에 파일 경로와 stack trace가 표시된다.", likelyCause: "developer diagnostics를 public response와 공유했습니다.", checks: ["exception mapper를 봅니다.", "message에 민감 context가 있는지 검사합니다.", "log 접근 권한을 확인합니다."], fix: "public stable code/안내와 restricted structured diagnostics를 분리합니다.", prevention: "error response schema와 redaction tests를 CI에 둡니다." },
      ],
      expertNotes: ["Spring transaction rollback은 checked/unchecked 기본 정책이 다를 수 있으므로 domain exception 선택 시 framework rollback rule을 명시적으로 검토해야 합니다.", "serialization을 실제로 사용하지 않더라도 Throwable subclass의 serialVersionUID는 -Xlint:all warning0 계약을 유지하는 데 필요합니다."],
    },
    {
      id: "resource-ownership-autocloseable-closeable",
      title: "자원을 만든 owner가 닫고 borrower는 사용만 하며 AutoCloseable과 Closeable 계약을 구분합니다",
      lead: "close 호출 위치를 문법보다 소유권으로 결정해 double close, premature close, leak을 같은 모델에서 예방합니다.",
      explanations: [
        "resource owner는 생성/acquisition 성공을 결정하고 lifetime 끝을 아는 code입니다. owner가 TWR로 닫는 것이 기본이며 parameter로 잠시 받은 borrower는 API 계약이 ownership transfer를 명시하지 않는 한 닫지 않습니다.",
        "AutoCloseable.close는 Exception을 던질 수 있고 idempotence를 요구하지 않습니다. implementer는 가능하면 idempotent하게 만드는 것이 권장되지만 caller가 무조건 안전한 double close를 가정하면 안 됩니다.",
        "Closeable은 AutoCloseable의 subtype이고 close가 IOException을 던지며 이미 닫힌 stream에 다시 close하면 효과가 없어야 한다고 더 구체적으로 계약합니다. 모든 AutoCloseable이 stream semantics를 갖는 것은 아닙니다.",
        "owner가 resource를 반환하면 ownership transfer가 발생합니다. caller가 닫아야 한다는 사실, close failure, thread-safety를 method name/Javadoc/type wrapper로 명시해야 합니다.",
        "borrower가 wrapper를 만들어 닫으면 wrapper close가 underlying borrowed resource까지 전파될 수 있습니다. 단순히 ‘내가 만든 wrapper’라고 underlying ownership까지 자동 획득하는 것은 아닙니다.",
        "shared singleton, connection pool handle, container-managed stream은 physical resource owner와 logical handle owner가 다를 수 있습니다. close가 반환/flush/no-op 중 무엇인지 해당 API 계약을 읽습니다.",
        "System.in/out/err는 process-wide shared resources입니다. library method가 Scanner(System.in)을 닫으면 이후 unrelated code 입력도 막히므로 top-level application owner만 lifecycle을 결정하거나 non-closing wrapper를 사용합니다.",
      ],
      concepts: [
        { term: "resource owner", definition: "resource acquisition과 lifetime 종료 책임을 가진 code/component입니다.", detail: ["보통 생성한 scope입니다.", "transfer 시 계약을 명시합니다."] },
        { term: "borrower", definition: "제한된 기간 resource를 사용하지만 close ownership을 받지 않은 caller/callee입니다.", detail: ["임의로 닫지 않습니다.", "사용 기간을 넘겨 보관하지 않습니다."] },
        { term: "ownership transfer", definition: "resource를 반환·전달하면서 close 책임도 다른 주체로 이동하는 API 계약입니다.", detail: ["type만으로 항상 명확하지 않습니다.", "문서와 naming이 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-resource-ownership",
        title: "borrower와 owner의 close 책임을 trace로 분리합니다",
        language: "java",
        filename: "ResourceOwnership.java",
        purpose: "parameter borrower는 닫지 않고 생성 owner가 TWR/manual close로 정확히 한 번 닫는 경계를 보여 줍니다.",
        code: String.raw`public class ResourceOwnership {
    static final class Probe implements AutoCloseable {
        private final String id;
        private boolean closed;

        Probe(String id) {
            this.id = id;
            System.out.println("open=" + id);
        }

        void use() {
            if (closed) throw new IllegalStateException("closed:" + id);
            System.out.println("use=" + id);
        }

        boolean isClosed() {
            return closed;
        }

        @Override
        public void close() {
            if (closed) throw new IllegalStateException("double-close:" + id);
            closed = true;
            System.out.println("close=" + id);
        }
    }

    static void borrow(Probe probe) {
        probe.use();
    }

    static void own(String id) {
        try (Probe probe = new Probe(id)) {
            probe.use();
        }
    }

    public static void main(String[] args) {
        Probe borrowed = new Probe("B");
        borrow(borrowed);
        System.out.println("borrowed.after=" + borrowed.isClosed());
        borrowed.close();
        System.out.println("borrowed.ownerClosed=" + borrowed.isClosed());
        own("O");
        System.out.println("owned.done");
    }
}`,
        walkthrough: [
          { lines: "1-26", explanation: "AutoCloseable probe는 lifecycle을 관찰하고 double close를 허용하지 않아 idempotence를 가정하지 못하게 합니다." },
          { lines: "28-36", explanation: "borrow는 use만 하고 own은 자신이 생성한 probe를 TWR로 닫습니다." },
          { lines: "38-47", explanation: "B의 creator가 manual close responsibility를 수행하고 O는 own scope 종료에서 자동 close됩니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ResourceOwnership.java", "ResourceOwnership") },
        output: { value: "open=B\nuse=B\nborrowed.after=false\nclose=B\nborrowed.ownerClosed=true\nopen=O\nuse=O\nclose=O\nowned.done", explanation: ["borrow 뒤 B는 열려 있습니다.", "B creator가 닫고 O creator scope는 TWR가 닫습니다.", "각 resource close는 정확히 한 번입니다."] },
        experiments: [
          { change: "borrow method에서 probe.close를 호출합니다.", prediction: "caller의 이후 use가 closed failure가 되고 caller close는 double-close failure가 됩니다.", result: "borrower의 premature close가 두 계층 계약을 동시에 깨뜨립니다." },
          { change: "Probe.close를 `if (closed) return`으로 바꿉니다.", prediction: "double close exception은 사라지지만 ownership ambiguity는 남습니다.", result: "idempotence는 방어 수단이지 책임 문서를 대체하지 않습니다." },
        ],
        sourceRefs: ["java-class08-ex06", "java-class08-ex07", "java-class08-ex08", "java-autocloseable-api", "java-closeable-api", "effective-java-try-resources"],
      }],
      diagnostics: [
        { symptom: "callee 호출 뒤 caller resource가 이미 닫혀 있다.", likelyCause: "borrower가 parameter ownership을 임의로 가져갔습니다.", checks: ["resource 생성 지점을 찾습니다.", "API가 transfer를 문서화했는지 봅니다.", "wrapper close chain을 확인합니다."], fix: "borrower close를 제거하고 owner scope에 TWR를 둡니다.", prevention: "owned/borrowed parameter naming과 ownership Javadoc을 사용합니다." },
        { symptom: "두 번 close해도 항상 괜찮다고 가정했는데 custom resource가 실패한다.", likelyCause: "Closeable의 세부 계약을 모든 AutoCloseable에 일반화했습니다.", checks: ["구현 interface와 close Javadoc을 봅니다.", "idempotence test를 확인합니다.", "concurrent close 가능성을 봅니다."], fix: "close-once ownership을 보장하고 필요하면 구현에 explicit idempotence를 설계합니다.", prevention: "resource type별 close semantics 표를 유지합니다." },
      ],
      expertNotes: ["pool proxy의 close는 physical socket 종료가 아니라 pool 반환일 수 있으며, double close나 use-after-return은 구현별로 다릅니다.", "Cleaner/finalization 계열은 명시 ownership의 fallback이지 timely release 수단이 아니며, finalization은 deprecated for removal입니다."],
    },
    {
      id: "try-with-resources-acquisition-reverse-close",
      title: "try-with-resources는 왼쪽부터 획득하고 성공한 자원을 오른쪽부터 역순으로 닫습니다",
      lead: "문법 sugar라는 한 줄을 넘어 dependency가 있는 resource stack의 acquisition·body·close 순서를 exact trace로 고정합니다.",
      explanations: [
        "TWR header의 resource initializers는 왼쪽에서 오른쪽으로 평가됩니다. 앞 resource를 사용해 뒤 wrapper/statement를 만들 수 있는 이유이며, 뒤 initializer는 앞 acquisition 성공 뒤에만 실행됩니다.",
        "try body가 normal 또는 abrupt completion하면 성공적으로 초기화된 resources를 선언 역순으로 close합니다. 서로 별개이거나 close가 전파되지 않는 A→B→C를 등록했다면 자동 close 호출 순서는 C→B→A입니다. 단, wrapper close가 underlying close까지 전파되는 조합은 호출 순서와 ownership을 별도로 분석해야 합니다.",
        "각 resource variable은 암시적으로 final이며 TWR scope 안에서 재할당할 수 없습니다. Java9부터 기존 final/effectively-final variable을 `try (resource)`로 참조할 수도 있습니다.",
        "TWR가 lexical lifetime을 표현하므로 manual finally보다 누락과 masking 위험이 줄어듭니다. 하지만 resource를 너무 일찍 TWR에 넣으면 caller가 필요한 lifetime 전에 닫히는 ownership bug는 여전히 생깁니다.",
        "resource dependency는 선언 순서만이 아니라 close 전파 계약까지 함께 봅니다. BufferedInputStream close는 flush가 아니라 buffer를 release하고 contained input을 닫습니다. 따라서 FileInputStream과 그 BufferedInputStream을 둘 다 같은 header에 등록하면 wrapper close가 underlying을 닫은 뒤 TWR가 underlying close를 다시 호출합니다. Closeable의 재-close no-effect 계약에 기대기보다 ownership을 넘겨받은 outermost wrapper 하나만 등록하는 편이 명확합니다. 반대로 close가 전파되지 않고 둘 다 독립 정리가 필요한 resources라면 underlying→dependent 선언으로 dependent→underlying close 순서를 만듭니다.",
        "close가 여러 번 호출될 수 있는 alias를 만들지 않습니다. 같은 object를 header에 중복 등록하면 compiler가 막지 않을 수 있고 implementation idempotence에 기대는 double close가 됩니다.",
        "TWR는 heap memory 회수를 위한 도구가 아니라 file descriptor, socket, database handle, lock-like scope 등 명시 release 계약을 위한 도구입니다. GC reachability와 close completion은 다른 lifecycle입니다.",
      ],
      concepts: [
        { term: "resource specification", definition: "try 괄호 안에서 선언하거나 Java9 방식으로 참조한 AutoCloseable resources 목록입니다.", detail: ["왼쪽부터 초기화합니다.", "성공한 것만 관리합니다."] },
        { term: "reverse close order", definition: "resource specification의 오른쪽 resource부터 왼쪽 방향으로 close를 호출하는 규칙입니다.", detail: ["non-cascading dependency 해체에 적합합니다.", "wrapper의 transitive close가 있으면 underlying 중복 호출 가능성을 별도 확인합니다.", "suppressed order에도 영향을 줍니다."] },
        { term: "lexical lifetime", definition: "source code block 경계가 resource 사용 가능 기간과 close 시점을 표현하는 lifetime입니다.", detail: ["scope를 벗어나면 닫힙니다.", "ownership transfer에는 별도 API가 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-twr-reverse-close",
        title: "A→B→C acquisition과 C→B→A close를 exact trace로 확인합니다",
        language: "java",
        filename: "TwrReverseClose.java",
        purpose: "initializer order와 reverse cleanup order가 body 양쪽에서 어떻게 배치되는지 관찰합니다.",
        code: String.raw`public class TwrReverseClose {
    static final class TraceResource implements AutoCloseable {
        private final String id;

        TraceResource(String id) {
            this.id = id;
            System.out.println("acquire=" + id);
        }

        void use() {
            System.out.println("use=" + id);
        }

        @Override
        public void close() {
            System.out.println("close=" + id);
        }
    }

    public static void main(String[] args) {
        try (TraceResource a = new TraceResource("A");
             TraceResource b = new TraceResource("B");
             TraceResource c = new TraceResource("C")) {
            a.use();
            b.use();
            c.use();
            System.out.println("body=done");
        }
        System.out.println("after=done");
    }
}`,
        walkthrough: [
          { lines: "1-18", explanation: "constructor·use·close가 id를 출력하는 최소 AutoCloseable을 정의합니다." },
          { lines: "20-23", explanation: "resource initializers A·B·C가 source order로 평가됩니다." },
          { lines: "24-31", explanation: "body가 정상 완료하면 C·B·A 순서로 닫힌 뒤 after 문장에 도달합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("TwrReverseClose.java", "TwrReverseClose") },
        output: { value: "acquire=A\nacquire=B\nacquire=C\nuse=A\nuse=B\nuse=C\nbody=done\nclose=C\nclose=B\nclose=A\nafter=done", explanation: ["세 initializer는 왼쪽부터 실행됩니다.", "body use 순서는 code가 정하지만 자동 close는 반드시 역순입니다.", "모든 close가 정상 완료한 뒤 after가 실행됩니다."] },
        experiments: [
          { change: "B가 A를 constructor parameter로 받고 B.close가 A.close까지 전파되는 wrapper라고 바꿉니다.", prediction: "TWR가 B.close를 호출할 때 A가 한 번 닫히고 이어 explicit A.close가 다시 호출되어 underlying close invocation은 두 번입니다.", result: "close cascade를 문서와 계측으로 확인하고, wrapper가 ownership을 받았다면 outermost wrapper 하나만 TWR에 등록합니다." },
          { change: "같은 TraceResource a를 header에 두 번 참조합니다.", prediction: "같은 object에 close가 두 번 호출될 수 있습니다.", result: "TWR도 alias ownership 오류를 자동 해결하지 않습니다." },
        ],
        sourceRefs: ["jls-try-with-resources", "java-autocloseable-api", "java-closeable-api", "java-filter-input-stream-api", "java-buffered-input-stream-api", "effective-java-try-resources"],
      }],
      diagnostics: [
        { symptom: "custom underlying resource의 close가 두 번 호출되거나 두 번째 close에서 실패한다.", likelyCause: "underlying과 close를 underlying에 전파하는 wrapper를 모두 TWR header에 등록했습니다.", checks: ["wrapper close가 contained resource에 전파되는지 API를 읽습니다.", "각 object의 close call count를 계측합니다.", "실제 ownership owner가 하나인지 확인합니다."], fix: "wrapper가 underlying ownership을 받는 계약이면 outermost wrapper만 TWR에 등록합니다. 전파하지 않는 두 resources라면 둘 다 등록하고 dependency의 역순 close가 되게 선언합니다.", prevention: "resource graph마다 close cascade와 단일 owner를 설계 문서·exact-count test로 고정합니다." },
        { symptom: "TWR를 썼는데 caller가 반환받은 resource가 이미 닫혀 있다.", likelyCause: "resource를 반환하면서 생성 method의 lexical TWR scope에서 닫았습니다.", checks: ["return이 TWR body 안인지 봅니다.", "ownership transfer 계약을 확인합니다.", "use-after-close test를 실행합니다."], fix: "caller ownership으로 transfer한다면 creator가 닫지 않거나 higher-level operation 자체를 반환합니다.", prevention: "resource 자체 반환보다 callback/operation API를 우선 검토합니다." },
      ],
      expertNotes: ["lock은 AutoCloseable이 아닌 경우가 많아 adapter를 만들 수 있지만, exception suppression과 unlock failure semantics가 적합한지 먼저 검토합니다.", "reactive/non-blocking resource lifetime은 lexical block보다 subscription lifecycle에 묶일 수 있어 framework의 usingWhen 같은 전용 primitive가 필요합니다."],
    },
    {
      id: "primary-suppressed-close-only",
      title: "body failure는 primary이고 close failures는 suppressed이며 body 성공 시 첫 close failure가 primary가 됩니다",
      lead: "복수 실패를 단일 message로 뭉개지 않고 Throwable의 primary·suppressed 구조와 reverse close 순서를 함께 읽습니다.",
      explanations: [
        "body가 exception P로 abrupt completion한 뒤 B.close와 A.close가 각각 실패하면 P가 primary로 유지되고 close-B, close-A가 그 순서로 P.getSuppressed에 추가됩니다.",
        "suppressed 배열 순서는 close 시도 순서와 연결됩니다. resource A,B 선언에서 reverse close는 B,A이므로 suppressed도 일반적으로 B failure 다음 A failure입니다.",
        "body가 정상 완료했는데 B.close가 실패하면 B failure가 새로운 primary입니다. 그래도 A.close는 계속 시도되고 A failure는 B primary의 suppressed가 됩니다.",
        "resource 하나의 close가 실패해도 나머지 resources의 close 시도를 생략하지 않는 것이 TWR의 중요한 안전성입니다. manual finally의 첫 close throw가 뒤 resource cleanup을 건너뛰는 문제를 피합니다.",
        "getCause와 getSuppressed를 모두 읽어야 전체 failure tree를 복원할 수 있습니다. cause만 순회하면 close failures를 잃고 suppressed만 보면 low-level cause chain을 잃습니다.",
        "suppression은 Throwable constructor에서 비활성화할 수 있는 고급 기능이지만 일반 application exception에서는 임의로 끄지 않습니다. 비활성화된 primary에는 addSuppressed가 효과를 기록하지 않습니다.",
        "close failure를 사용자에게 모두 노출하지 말고 stable outcome을 주되, 운영 진단에는 primary type/message/frame과 각 suppressed type/message/frame을 structured fields로 남깁니다.",
      ],
      concepts: [
        { term: "body failure", definition: "TWR try body가 resource close 시작 전에 던진 exception으로 dual-failure 상황의 primary가 됩니다.", detail: ["close failures가 suppressed로 붙습니다.", "body stack을 대표로 유지합니다."] },
        { term: "close-only failure", definition: "body는 정상 완료했지만 automatic close 단계에서 처음 발생한 failure입니다.", detail: ["첫 close failure가 primary입니다.", "뒤 close failures는 suppressed입니다."] },
        { term: "failure tree", definition: "한 primary를 중심으로 cause chains와 suppressed arrays를 재귀적으로 연결한 전체 진단 구조입니다.", detail: ["단순 linked list가 아닙니다.", "cycle-safe traversal이 필요할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-suppressed-failure-matrix",
        title: "body+close와 close-only 복수 실패의 primary/suppressed를 비교합니다",
        language: "java",
        filename: "SuppressedFailureMatrix.java",
        purpose: "TWR reverse close와 suppression ordering을 deterministic type/message output으로 검증합니다.",
        code: String.raw`import java.util.Arrays;
import java.util.stream.Collectors;

public class SuppressedFailureMatrix {
    static final class CloseFailure extends Exception {
        private static final long serialVersionUID = 1L;

        CloseFailure(String message) {
            super(message);
        }
    }

    static final class FailingResource implements AutoCloseable {
        private final String id;

        FailingResource(String id) {
            this.id = id;
        }

        void touch() {}

        @Override
        public void close() throws CloseFailure {
            System.out.println("close=" + id);
            throw new CloseFailure("close-" + id);
        }
    }

    static String suppressedMessages(Throwable error) {
        return Arrays.stream(error.getSuppressed())
                .map(Throwable::getMessage)
                .collect(Collectors.joining(","));
    }

    static void bodyFailure() {
        try (FailingResource a = new FailingResource("A");
             FailingResource b = new FailingResource("B")) {
            a.touch();
            b.touch();
            System.out.println("body=fail");
            throw new Exception("body");
        } catch (Exception e) {
            System.out.println("primary=" + e.getMessage());
            System.out.println("suppressed=" + suppressedMessages(e));
        }
    }

    static void closeOnlyFailure() {
        try (FailingResource a = new FailingResource("A");
             FailingResource b = new FailingResource("B")) {
            a.touch();
            b.touch();
            System.out.println("body=ok");
        } catch (Exception e) {
            System.out.println("primary=" + e.getMessage());
            System.out.println("suppressed=" + suppressedMessages(e));
        }
    }

    public static void main(String[] args) {
        bodyFailure();
        closeOnlyFailure();
    }
}`,
        walkthrough: [
          { lines: "1-27", explanation: "checked CloseFailure와 각 close가 id를 출력한 뒤 실패하는 resource를 정의해 warning0 복수 cleanup failure를 만듭니다." },
          { lines: "29-33", explanation: "getSuppressed 배열을 insertion/close order 그대로 comma-separated messages로 읽습니다." },
          { lines: "35-46", explanation: "body exception이 primary이고 reverse close B·A failures가 suppressed B,A가 됩니다." },
          { lines: "48-64", explanation: "body success에서는 close-B가 primary, 이후 close-A만 suppressed이며 main이 두 matrix를 순서대로 실행합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("SuppressedFailureMatrix.java", "SuppressedFailureMatrix") },
        output: { value: "body=fail\nclose=B\nclose=A\nprimary=body\nsuppressed=close-B,close-A\nbody=ok\nclose=B\nclose=A\nprimary=close-B\nsuppressed=close-A", explanation: ["body failure가 있으면 body가 primary입니다.", "두 경우 모두 B→A close 시도는 끝까지 수행됩니다.", "close-only에서는 첫 close-B가 primary로 승격됩니다."] },
        experiments: [
          { change: "B.close만 정상 완료하게 합니다.", prediction: "body-fail에서는 suppressed=close-A, close-only에서는 primary=close-A와 suppressed empty가 됩니다.", result: "primary 선택은 body 존재와 실제 첫 close failure에 따라 달라집니다." },
          { change: "manual finally에서 B.close(); A.close();를 그대로 호출합니다.", prediction: "B.close throw 뒤 A.close가 실행되지 않고 body failure도 덮일 수 있습니다.", result: "TWR compiler translation의 suppression protocol을 수동 code보다 우선합니다." },
        ],
        sourceRefs: ["jls-try-with-resources", "java-throwable-api", "java-autocloseable-api", "effective-java-try-resources"],
      }],
      diagnostics: [
        { symptom: "로그에 primary만 있고 close failure가 보이지 않는다.", likelyCause: "logger/formatter가 suppressed를 출력하지 않거나 code가 cause만 순회합니다.", checks: ["getSuppressed length를 확인합니다.", "logger stack rendering을 test합니다.", "translation이 original을 cause로 보존했는지 봅니다."], fix: "failure tree traversal에 cause와 suppressed를 모두 포함합니다.", prevention: "dual-failure fixture를 observability regression test로 유지합니다." },
        { symptom: "첫 close 실패 뒤 다른 resource가 leak된다.", likelyCause: "manual cleanup이 sequential call에서 첫 throw를 처리하지 못했습니다.", checks: ["TWR 사용 여부를 봅니다.", "close attempts count를 측정합니다.", "resource declaration order를 확인합니다."], fix: "모든 owned resources를 하나의 TWR header에 넣어 reverse close를 compiler에 맡깁니다.", prevention: "multi-resource body+close failure test를 필수화합니다." },
      ],
      expertNotes: ["Throwable graph를 직렬화/로그할 때 cause·suppressed cycle 가능성을 고려해 identity-based visited set을 둘 수 있습니다.", "close failure를 단순 warning으로 낮추면 transaction commit/flush failure를 성공으로 오판할 수 있으므로 resource 의미별 severity policy가 필요합니다."],
    },
    {
      id: "partial-acquisition-and-effectively-final",
      title: "중간 acquisition이 실패하면 이미 성공한 자원만 닫히고 Java9 effectively-final 자원도 TWR가 관리합니다",
      lead: "body가 시작되지 않은 실패와 기존 variable을 header에서 재사용하는 문법을 서로 다른 lifetime 사건으로 검증합니다.",
      explanations: [
        "resource initializers A,B,C 중 B constructor가 실패하면 B variable은 초기화 완료되지 않았고 C initializer/body는 실행되지 않습니다. A만 성공적으로 acquired되었으므로 A.close가 실행됩니다.",
        "B constructor 내부에서 부분적으로 획득한 sub-resource는 B object가 TWR에 등록되기 전이므로 B constructor/factory 자체가 정리해야 합니다. TWR가 완성되지 않은 object 내부를 자동으로 알 수 없습니다.",
        "factory가 여러 low-level handles를 묶을 때는 각 handle을 획득한 즉시 실패-cleanup 책임에 등록해야 합니다. construction 중 모두 소비·복사하고 live handle을 반환하지 않는다면 nested TWR가 단순합니다. 반대로 완성 object가 열린 handles를 caller에게 ownership transfer해야 한다면 성공 때 cleanup guard를 release하고 실패 때만 역순 close하는 명시적 protocol이 필요합니다. plain TWR 안에서 aggregate를 return해도 return 완료 전에 close가 먼저 시도되며, close가 성공하면 닫힌 handles를 반환하게 되고 close가 실패하면 return 자체가 exception으로 대체됩니다.",
        "Java9의 `try (resource)`는 이미 선언된 final/effectively-final local variable 또는 parameter를 resource로 사용할 수 있습니다. block 뒤에도 variable scope는 남을 수 있지만, 정상 close 경로에서는 object가 닫혔으므로 live resource처럼 재사용하면 안 됩니다. close가 실패했다면 뒤 문장에 도달하지 않을 수 있고 object 상태도 구현에 따라 unknown/partial이므로, 예외 처리 뒤에도 재사용하지 말고 실패 계약에 따라 폐기·복구해야 합니다.",
        "effectively-final은 선언 뒤 값이 한 번도 재할당되지 않은 compile-time 성질입니다. object 내부 state mutation과 variable reassignment는 다르며, 전자는 문법 사용을 막지 않습니다.",
        "TWR 전에 resource variable을 다른 object로 재할당하면 effectively-final이 아니므로 compile error입니다. alias가 어느 object를 닫는지 모호해지는 것을 compiler가 차단합니다.",
        "기존 variable TWR를 사용해도 close ownership transfer가 자동 문서화되지는 않습니다. caller가 빌려준 parameter를 `try (parameter)`로 닫으면 문법상 가능하더라도 borrower contract 위반일 수 있습니다.",
      ],
      concepts: [
        { term: "partial acquisition", definition: "resource specification 또는 factory가 일부 resources만 성공적으로 얻은 상태에서 뒤 acquisition이 실패한 상황입니다.", detail: ["성공한 것만 역순 close합니다.", "constructor 내부 ownership은 constructor가 정리합니다."] },
        { term: "effectively final", definition: "명시 final은 아니지만 초기화 뒤 다시 대입되지 않아 compiler가 final처럼 취급하는 variable입니다.", detail: ["Java9 TWR reference에 사용할 수 있습니다.", "object state mutation과 별개입니다."] },
        { term: "construction safety", definition: "constructor/factory가 실패해도 그 안에서 이미 획득한 sub-resources를 누출하지 않는 성질입니다.", detail: ["완성 object close에만 의존할 수 없습니다.", "construction 중 자원을 소비한다면 nested TWR를, 열린 handles를 성공 object로 넘긴다면 failure-only cleanup guard와 success release를 사용합니다."] },
      ],
      codeExamples: [
        {
          id: "java-partial-acquisition",
          title: "B constructor 실패에서 A만 close되고 body/C가 실행되지 않음을 확인합니다",
          language: "java",
          filename: "PartialAcquisition.java",
          purpose: "resource registration 시점을 open/close event list로 증명합니다.",
          code: String.raw`import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class PartialAcquisition {
    static final List<String> events = new ArrayList<>();

    static final class Resource implements AutoCloseable {
        private final String id;

        Resource(String id, boolean fail) throws IOException {
            this.id = id;
            events.add("open=" + id);
            if (fail) throw new IOException("open-" + id);
        }

        void touch() {}

        @Override
        public void close() {
            events.add("close=" + id);
        }
    }

    public static void main(String[] args) {
        try (Resource a = new Resource("A", false);
             Resource b = new Resource("B", true);
             Resource c = new Resource("C", false)) {
            a.touch();
            b.touch();
            c.touch();
            events.add("body");
        } catch (IOException e) {
            System.out.println("caught=" + e.getMessage());
        }
        System.out.println("events=" + String.join(",", events));
    }
}`,
          walkthrough: [
            { lines: "1-23", explanation: "constructor는 open event 뒤 선택적으로 실패하고 성공적으로 등록된 object의 close만 event를 남깁니다. no-op touch는 lint상 사용을 명시합니다." },
            { lines: "25-38", explanation: "A 성공 뒤 B 실패로 C/body를 건너뛰고 A만 close한 다음 IOException을 catch합니다." },
          ],
          run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("PartialAcquisition.java", "PartialAcquisition") },
          output: { value: "caught=open-B\nevents=open=A,open=B,close=A", explanation: ["B의 open attempt는 기록되지만 initialization은 완료되지 않습니다.", "C와 body event는 없습니다.", "TWR에 등록된 A만 close됩니다."] },
          experiments: [
            { change: "B constructor가 내부 socket을 연 뒤 실패한다고 가정합니다.", prediction: "B.close는 호출되지 않으므로 constructor/factory가 socket을 직접 닫아야 합니다.", result: "aggregate construction도 nested ownership boundary입니다." },
            { change: "B fail을 false로 바꾸고 C fail을 true로 합니다.", prediction: "events는 open=A,open=B,open=C,close=B,close=A입니다.", result: "완료된 A/B만 reverse close되고 실패한 C는 등록되지 않습니다." },
          ],
          sourceRefs: ["jls-try-with-resources", "java-autocloseable-api", "effective-java-try-resources"],
        },
        {
          id: "java-effectively-final-resource",
          title: "Java9 resource reference는 기존 effectively-final variable의 close를 시도하며 variable scope는 남습니다",
          language: "java",
          filename: "EffectivelyFinalResource.java",
          purpose: "variable visibility와 resource open state를 구분하고 재할당 없는 기존 variable TWR 문법을 확인합니다.",
          code: String.raw`public class EffectivelyFinalResource {
    static final class Probe implements AutoCloseable {
        private boolean closed;

        void use() {
            if (closed) throw new IllegalStateException("closed");
            System.out.println("use=open");
        }

        @Override
        public void close() {
            closed = true;
            System.out.println("close=done");
        }

        boolean isClosed() {
            return closed;
        }
    }

    public static void main(String[] args) {
        Probe resource = new Probe();
        try (resource) {
            resource.use();
        }
        System.out.println("visibleAfter=" + resource.isClosed());
    }
}`,
          walkthrough: [
            { lines: "1-19", explanation: "Probe는 use-before-close invariant와 관찰 가능한 close state를 제공합니다." },
            { lines: "21-28", explanation: "기존 effectively-final variable을 header에서 참조하고, 이 Probe의 정상 close 경로에서 block 뒤 같은 variable로 closed state를 읽습니다." },
          ],
          run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("EffectivelyFinalResource.java", "EffectivelyFinalResource") },
          output: { value: "use=open\nclose=done\nvisibleAfter=true", explanation: ["resource는 block 안에서 열려 있습니다.", "scope 종료에서 close됩니다.", "variable은 보이지만 가리키는 object는 closed입니다."] },
          experiments: [
            { change: "try 전에 `resource = new Probe()`를 한 번 더 대입합니다.", prediction: "resource가 effectively final이 아니어서 TWR resource reference compile error가 됩니다.", result: "compiler가 alias target ambiguity를 차단합니다." },
            { change: "method parameter를 try(parameter)에 넣습니다.", prediction: "parameter가 effectively final이면 compile되지만 caller-owned resource를 닫을 수 있습니다.", result: "문법 가능성과 ownership 권한은 별도 검토합니다." },
          ],
          sourceRefs: ["jls-try-with-resources", "java9-try-resources", "java-autocloseable-api"],
        },
      ],
      diagnostics: [
        { symptom: "두 번째 resource constructor가 실패한 뒤 첫 resource가 leak된다.", likelyCause: "manual acquisition을 모두 끝낸 뒤 하나의 finally에서 닫도록 작성했습니다.", checks: ["각 acquisition 직후 ownership 등록 여부를 봅니다.", "partial failure fixture를 실행합니다.", "constructor 내부 handles를 확인합니다."], fix: "construction 중 소비하는 자원은 resource specification/nested TWR로 등록합니다. 성공 object가 열린 handles를 넘겨받아야 하면 acquisition 직후 failure-only cleanup guard에 등록하고 ownership transfer가 확정될 때 guard를 release합니다.", prevention: "각 acquisition position failure injection test를 둡니다." },
        { symptom: "기존 variable을 try(resource)에 넣었더니 effectively-final compile error가 난다.", likelyCause: "선언 후 재할당했습니다.", checks: ["모든 assignment를 찾습니다.", "loop에서 variable을 재사용하는지 봅니다.", "새 lexical variable로 분리 가능한지 봅니다."], fix: "close할 object마다 단일 assignment local을 만들거나 header에서 새 resource를 선언합니다.", prevention: "resource alias를 mutable holder에 넣지 않고 scope별 final reference를 사용합니다." },
      ],
      expertNotes: ["constructor가 `this`를 외부에 publish한 뒤 실패하면 resource leak뿐 아니라 partially initialized object escape가 생기므로 construction safety는 concurrency safety와도 연결됩니다.", "Kotlin use, Python with, C# using 등도 유사한 lifetime primitive가 있지만 suppression/close ordering 세부 계약은 언어별로 다시 확인해야 합니다."],
    },
    {
      id: "wrapper-and-shared-stream-ownership",
      title: "wrapper close는 underlying으로 전파되므로 System.in 같은 shared stream은 top-level owner만 닫습니다",
      lead: "wrapper를 만든 주체와 underlying resource owner가 다를 때 transitive close를 명시적으로 계약합니다.",
      explanations: [
        "FilterInputStream 계열 wrapper의 close는 일반적으로 underlying input stream의 close를 호출합니다. wrapper만 닫는다고 생각해 borrowed underlying을 조기에 닫을 수 있습니다.",
        "BufferedInputStream은 buffering을 추가하지만 close ownership을 분리하지 않습니다. owner가 underlying을 wrapper에 transfer했다면 wrapper 하나를 TWR로 닫아 전체 chain을 역순 해제하는 것이 자연스럽습니다.",
        "borrower가 한두 operation만 수행한다면 underlying을 직접 읽고 닫지 않습니다. buffering wrapper가 필요하지만 ownership을 transfer받지 않았다면 API가 제공하는 non-closing wrapper나 명시 adapter를 검토합니다. 임의 no-op close는 output wrapper의 flush/finalization이나 input wrapper의 자체 state release·오류 계약을 건너뛸 수 있으므로 wrapper 종류별 close semantics를 보존해야 합니다.",
        "System.in은 process-wide shared InputStream입니다. Ex06~08의 Scanner.close는 underlying System.in도 닫으므로 그 main이 끝나는 독립 demo에서는 관찰 문제가 작지만, library/test suite/REPL에서는 다음 입력 consumer를 깨뜨립니다.",
        "System.out/err도 shared streams라 임의 close하지 않습니다. flush가 필요한지와 close ownership을 분리하고 application 종료 정책은 top-level composition root가 결정합니다.",
        "close cascade는 exception structure에도 영향을 줍니다. output wrapper는 자체 flush/finalization과 underlying.close에서, input wrapper는 자체 state cleanup과 underlying.close에서 각각 실패할 수 있습니다. API가 어느 failure를 primary/suppressed/cause로 보존하는지 구현 계약을 확인합니다.",
        "resource ownership을 method signature만으로 표현하기 어려우면 `consumeAndClose`, `withResource`, `borrow`처럼 이름을 구분하고 Javadoc에 close-after-return, transfer, thread confinement를 명시합니다.",
      ],
      concepts: [
        { term: "transitive close", definition: "wrapper의 close가 자신뿐 아니라 delegate/underlying resource의 close까지 호출하는 lifecycle 전파입니다.", detail: ["wrapper API 문서를 확인합니다.", "borrowed resource를 조기 종료할 수 있습니다."] },
        { term: "shared stream", definition: "여러 unrelated components가 process lifetime 동안 함께 사용하는 input/output resource입니다.", detail: ["library가 임의로 닫지 않습니다.", "top-level owner가 lifecycle을 정합니다."] },
        { term: "non-closing view", definition: "underlying resource 사용을 위임하지만 close 호출은 ownership owner에게 남기는 명시 wrapper/adapter입니다.", detail: ["API가 의도적으로 제공할 때 사용합니다.", "flush와 error semantics를 문서화합니다."] },
      ],
      codeExamples: [{
        id: "java-wrapper-ownership",
        title: "borrow read와 wrapper ownership transfer의 underlying close 횟수를 비교합니다",
        language: "java",
        filename: "WrapperOwnership.java",
        purpose: "BufferedInputStream close cascade를 관찰해 borrower와 transferred owner를 구분합니다.",
        code: String.raw`import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class WrapperOwnership {
    static final class TrackingInputStream extends ByteArrayInputStream {
        private final String id;
        private int closeCalls;

        TrackingInputStream(String id, String value) {
            super(value.getBytes(StandardCharsets.UTF_8));
            this.id = id;
        }

        @Override
        public void close() throws IOException {
            closeCalls++;
            super.close();
            System.out.println("underlying.close=" + id + ":" + closeCalls);
        }

        int closeCalls() {
            return closeCalls;
        }
    }

    static int borrowOne(InputStream source) throws IOException {
        return source.read();
    }

    static void consumeOwned(TrackingInputStream source) throws IOException {
        try (BufferedInputStream wrapper = new BufferedInputStream(source)) {
            System.out.println("transfer.read=" + wrapper.read());
        }
    }

    public static void main(String[] args) throws IOException {
        TrackingInputStream borrowed = new TrackingInputStream("B", "A");
        System.out.println("borrow.read=" + borrowOne(borrowed));
        System.out.println("borrow.closeCalls=" + borrowed.closeCalls());
        borrowed.close();
        System.out.println("borrow.ownerCloseCalls=" + borrowed.closeCalls());

        TrackingInputStream transferred = new TrackingInputStream("T", "B");
        consumeOwned(transferred);
        System.out.println("transfer.closeCalls=" + transferred.closeCalls());
    }
}`,
        walkthrough: [
          { lines: "1-27", explanation: "ByteArrayInputStream을 확장해 underlying close id/count를 관찰하되 read semantics는 유지합니다." },
          { lines: "29-31", explanation: "borrowOne은 한 byte만 읽고 parameter를 닫지 않습니다." },
          { lines: "33-37", explanation: "consumeOwned는 naming/contract상 ownership을 transfer받아 BufferedInputStream close가 underlying까지 전파됩니다." },
          { lines: "39-50", explanation: "borrowed creator가 직접 close하고 transferred는 wrapper TWR가 close해 각각 count1임을 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("WrapperOwnership.java", "WrapperOwnership") },
        output: { value: "borrow.read=65\nborrow.closeCalls=0\nunderlying.close=B:1\nborrow.ownerCloseCalls=1\ntransfer.read=66\nunderlying.close=T:1\ntransfer.closeCalls=1", explanation: ["borrowOne 뒤 close count는0입니다.", "B owner가 close를 수행합니다.", "BufferedInputStream close는 transferred T underlying까지 정확히 한 번 닫습니다."] },
        experiments: [
          { change: "borrowOne이 새 BufferedInputStream(source)를 TWR로 감쌉니다.", prediction: "method return 전에 source가 닫혀 caller ownership을 침해합니다.", result: "wrapper 생성이 underlying close 권한을 자동 부여하지 않습니다." },
          { change: "TrackingInputStream을 System.in으로 바꿉니다.", prediction: "wrapper/Scanner close 뒤 같은 process의 다음 input consumer가 실패합니다.", result: "shared standard streams는 top-level owner 외에서 닫지 않습니다." },
        ],
        sourceRefs: ["java-class08-ex06", "java-class08-ex07", "java-class08-ex08", "java-input-stream-api", "java-filter-input-stream-api", "java-buffered-input-stream-api", "java-scanner-api", "java-system-api"],
      }],
      diagnostics: [
        { symptom: "helper가 반환한 뒤 caller의 stream read가 closed 오류를 낸다.", likelyCause: "helper의 temporary wrapper close가 borrowed underlying까지 전파됐습니다.", checks: ["wrapper close implementation을 봅니다.", "ownership transfer 문서를 찾습니다.", "close call count를 instrument합니다."], fix: "borrower close를 제거하거나 explicit non-closing view/ownership transfer API를 사용합니다.", prevention: "wrapper integration test에 underlying close count를 포함합니다." },
        { symptom: "첫 console test 뒤 다음 test가 입력을 읽지 못한다.", likelyCause: "Scanner.close가 shared System.in을 닫았습니다.", checks: ["Scanner construction/close 위치를 찾습니다.", "같은 JVM인지 확인합니다.", "standard stream replacement 여부를 봅니다."], fix: "top-level runner만 System.in lifecycle을 관리하고 lower-level parser는 Reader/Scanner를 빌려 사용합니다.", prevention: "library API는 System.in을 직접 만들거나 닫지 않고 input dependency를 주입받습니다." },
      ],
      expertNotes: ["servlet response stream, framework-managed transaction/session처럼 container-owned handles도 같은 원칙을 적용하되 close/commit 호출 권한은 framework contract를 우선합니다.", "non-closing wrapper는 underlying close만 막고 wrapper 고유 cleanup은 보존해야 합니다. output 계열의 flush/finalization과 input 계열의 buffer state release를 구분하지 않으면 data loss나 lifecycle leak을 만들 수 있습니다."],
    },
    {
      id: "idempotent-close-concurrency-and-compiler-contracts",
      title: "close-once state를 원자적으로 설계하고 compiler-negative contracts로 경계 위반을 고정합니다",
      lead: "여러 thread/alias가 close할 수 있는 현실에서 idempotence와 use/close 동기화를 구분하고, 문법·checked 계약 위반은 실제 javac diagnostics로 잠급니다.",
      explanations: [
        "AutoCloseable 구현을 idempotent하게 만들려면 ‘이미 닫힘’ 확인과 cleanup 실행을 하나의 원자적 state transition으로 묶어야 합니다. 단순 boolean check-then-set은 두 thread가 동시에 cleanup할 수 있습니다.",
        "AtomicBoolean.compareAndSet(false,true)는 close winner를 하나로 제한할 수 있습니다. loser close는 no-op이지만 cleanup 중 실패했을 때 state를 CLOSED로 둘지 FAILED로 둘지는 resource별 state machine이 필요합니다.",
        "idempotent close는 concurrent use와 close를 자동으로 안전하게 만들지 않습니다. use가 resource handle을 읽는 순간 close가 진행될 수 있으므로 lock, reference count, thread confinement, explicit lifecycle states가 필요할 수 있습니다.",
        "close가 interruptible/blocking이면 timeout과 interrupt policy를 문서화합니다. TWR는 close 완료를 무기한 기다릴 수 있으므로 외부 process harness의 bounded timeout과 application-level cancellation은 다른 계층에서 설계합니다.",
        "compiler는 checked call 미처리, override checked contract 확대, non-effectively-final resource reference, non-AutoCloseable resource, close의 checked failure 미처리, never-thrown checked catch, 깨진 precise rethrow를 거부합니다.",
        "finally return처럼 legal하지만 위험한 code는 compile success와 lint warning을 동시에 냅니다. build가 warning0를 요구해야 warning이 단순 console noise로 사라지지 않습니다.",
        "negative fixtures는 production sources와 별도 temporary directories에서 task별 compile하고 ERROR/WARNING kind·count·OpenJDK diagnostic code·line을 고정합니다. 실패 fixture의 partial class files도 repository 밖에서 삭제합니다.",
        "compiler 통과 뒤에도 ownership transfer, suppression, close ordering, concurrent state 같은 semantic contracts는 runtime tests가 필요합니다. static/compile/runtime verification을 서로 대체하지 않습니다.",
      ],
      concepts: [
        { term: "idempotent close", definition: "close를 여러 번 호출해도 cleanup effect가 최대 한 번만 적용되고 이후 호출이 이미 닫힌 상태를 안전하게 유지하는 성질입니다.", detail: ["AutoCloseable의 필수 보장은 아닙니다.", "atomicity와 failure state를 설계합니다."] },
        { term: "linearization point", definition: "concurrent operation이 논리적으로 한 시점에 발생했다고 볼 수 있는 원자적 state transition 지점입니다.", detail: ["CAS success가 close winner 지점이 될 수 있습니다.", "cleanup 완료와 동일 시점은 아닐 수 있습니다."] },
        { term: "compiler contract fixture", definition: "의도적으로 compile success/warning/error를 유발하고 diagnostic kind·code·line을 검증하는 isolated source입니다.", detail: ["production compile과 분리합니다.", "toolchain version을 pin합니다."] },
      ],
      codeExamples: [
        {
          id: "java-idempotent-concurrent-close",
          title: "여덟 concurrent close가 cleanup을 한 번만 실행하도록 CAS로 제한합니다",
          language: "java",
          filename: "IdempotentConcurrentClose.java",
          purpose: "close idempotence의 원자적 winner와 use-after-close policy를 scheduling-independent aggregate output으로 검증합니다.",
          code: String.raw`import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class IdempotentConcurrentClose {
    static final class StateResource implements AutoCloseable {
        private final AtomicBoolean closed = new AtomicBoolean();
        private final AtomicInteger cleanupCount = new AtomicInteger();

        void use() {
            if (closed.get()) throw new IllegalStateException("closed");
            System.out.println("use=ok");
        }

        @Override
        public void close() {
            if (closed.compareAndSet(false, true)) {
                cleanupCount.incrementAndGet();
            }
        }

        boolean isClosed() {
            return closed.get();
        }

        int cleanupCount() {
            return cleanupCount.get();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        StateResource resource = new StateResource();
        resource.use();
        Thread[] workers = new Thread[8];
        for (int i = 0; i < workers.length; i++) {
            workers[i] = new Thread(resource::close);
            workers[i].start();
        }
        for (Thread worker : workers) worker.join();
        System.out.println("closed=" + resource.isClosed());
        System.out.println("cleanupCount=" + resource.cleanupCount());
        resource.close();
        System.out.println("afterRepeat=" + resource.cleanupCount());
        try {
            resource.use();
        } catch (IllegalStateException e) {
            System.out.println("useAfterClose=" + e.getMessage());
        }
    }
}`,
          walkthrough: [
            { lines: "1-28", explanation: "AtomicBoolean CAS winner만 cleanupCount를 증가시키고 use-after-close는 명시 exception으로 거부합니다." },
            { lines: "30-38", explanation: "여덟 threads가 같은 close를 호출하고 모두 join해 출력 전에 happens-before를 확보합니다." },
            { lines: "39-48", explanation: "aggregate closed/count를 출력하고 반복 close no-op과 닫힌 뒤 use policy를 검증합니다." },
          ],
          run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("IdempotentConcurrentClose.java", "IdempotentConcurrentClose") },
          output: { value: "use=ok\nclosed=true\ncleanupCount=1\nafterRepeat=1\nuseAfterClose=closed", explanation: ["thread 출력 순서에 의존하지 않고 join 뒤 aggregate만 봅니다.", "cleanupCount는 정확히1입니다.", "반복 close는 count를 바꾸지 않고 use-after-close는 거부됩니다."] },
          experiments: [
            { change: "AtomicBoolean을 plain boolean `if (!closed) { closed=true; cleanup++; }`로 바꿉니다.", prediction: "race에 따라 cleanupCount가1보다 커질 수 있습니다.", result: "idempotence check와 state transition은 원자적이어야 합니다." },
            { change: "cleanup work가 CAS 뒤 실패합니다.", prediction: "closed=true지만 cleanup이 불완전한 상태가 됩니다.", result: "실패 가능한 cleanup은 OPEN/CLOSING/CLOSED/FAILED state와 retry 권한을 별도로 설계합니다." },
          ],
          sourceRefs: ["java-autocloseable-api", "java-atomic-boolean-api", "java-thread-join-api", "jmm-happens-before"],
        },
        {
          id: "java-resource-compiler-contracts",
          title: "checked·override·resource·finally 위반 8개를 JavaCompiler diagnostics로 고정합니다",
          language: "java",
          filename: "ResourceCompilerContracts.java",
          purpose: "일곱 compile errors와 한 lint warning을 task별 isolated output에서 kind·code·line으로 검증합니다.",
          code: String.raw`import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class ResourceCompilerContracts {
    record Fixture(String name, String className, String source,
                   boolean success, Diagnostic.Kind kind) {}

    static final List<String> OPTIONS = List.of(
            "--release", "21", "-proc:none", "-Xlint:all", "-XDrawDiagnostics");

    static List<Fixture> fixtures() {
        return List.of(
                new Fixture("checked-call", "CheckedCall",
                        "import java.io.*;\nclass CheckedCall { static void f() { new FileInputStream(\"x\"); } }\n",
                        false, Diagnostic.Kind.ERROR),
                new Fixture("broad-override", "BroadOverride",
                        "import java.io.*;\nclass BroadOverride { static class A { void f() throws IOException {} }\n"
                                + "static class B extends A { @Override void f() throws Exception {} } }\n",
                        false, Diagnostic.Kind.ERROR),
                new Fixture("reassigned-resource", "ReassignedResource",
                        "class ReassignedResource {\n"
                                + "static final class R implements AutoCloseable { public void close() {} }\n"
                                + "static void f() { R r = new R(); r = new R(); try (r) {} }\n}\n",
                        false, Diagnostic.Kind.ERROR),
                new Fixture("not-autocloseable", "NotAutoCloseable",
                        "class NotAutoCloseable {\n"
                                + "static void f() { Object value = new Object(); try (value) {} }\n}\n",
                        false, Diagnostic.Kind.ERROR),
                new Fixture("close-checked", "CloseChecked",
                        "import java.io.*;\nclass CloseChecked {\n"
                                + "static final class R implements AutoCloseable { void touch() {} public void close() throws IOException {} }\n"
                                + "static void f() { try (R r = new R()) { r.touch(); } }\n}\n",
                        false, Diagnostic.Kind.ERROR),
                new Fixture("never-thrown", "NeverThrown",
                        "import java.io.*;\nclass NeverThrown {\n"
                                + "static void f() { try { int value = 1; } catch (IOException e) {} }\n}\n",
                        false, Diagnostic.Kind.ERROR),
                new Fixture("broken-precise", "BrokenPrecise",
                        "import java.io.*; import java.sql.*;\nclass BrokenPrecise {\n"
                                + "static void low() throws IOException, SQLException {}\n"
                                + "static void f() throws IOException { try { low(); } catch (Exception e) { e = new Exception(); throw e; } }\n}\n",
                        false, Diagnostic.Kind.ERROR),
                new Fixture("finally-return", "FinallyReturn",
                        "class FinallyReturn {\n"
                                + "static int f() { try { return 1; } finally { return 2; } }\n}\n",
                        true, Diagnostic.Kind.WARNING));
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("JDK compiler required");
        Path base = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = Files.createTempDirectory(base, "core03-contracts-");
        try {
            for (Fixture fixture : fixtures()) {
                Path source = root.resolve(fixture.className() + ".java");
                Path output = Files.createDirectory(root.resolve(fixture.className() + "-classes"));
                Files.writeString(source, fixture.source(), StandardCharsets.UTF_8);
                DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
                boolean result;
                try (StandardJavaFileManager manager = compiler.getStandardFileManager(
                        diagnostics, null, StandardCharsets.UTF_8)) {
                    Iterable<? extends JavaFileObject> units = manager.getJavaFileObjects(source);
                    List<String> options = new java.util.ArrayList<>(OPTIONS);
                    options.addAll(List.of("-d", output.toString()));
                    result = compiler.getTask(null, manager, diagnostics,
                            options, null, units).call();
                }
                List<Diagnostic<? extends JavaFileObject>> selected = diagnostics.getDiagnostics().stream()
                        .filter(diagnostic -> diagnostic.getKind() == fixture.kind())
                        .toList();
                if (result != fixture.success() || diagnostics.getDiagnostics().size() != 1
                        || selected.size() != 1) {
                    throw new IllegalStateException("diagnostic drift:" + fixture.name()
                            + ":result=" + result + ":all=" + diagnostics.getDiagnostics());
                }
                Diagnostic<? extends JavaFileObject> diagnostic = selected.get(0);
                System.out.println(fixture.name() + "=" + diagnostic.getCode()
                        + "@" + diagnostic.getLineNumber());
            }
            System.out.println("contracts=" + fixtures().size());
        } finally {
            Path resolved = root.toAbsolutePath().normalize();
            if (!resolved.getParent().equals(base)) throw new IllegalStateException("unsafe cleanup");
            try (var paths = Files.walk(resolved)) {
                for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                    Files.deleteIfExists(path);
                }
            }
            if (Files.exists(resolved)) throw new IllegalStateException("cleanup failed");
        }
    }
}`,
          walkthrough: [
            { lines: "1-18", explanation: "JavaCompiler structured diagnostics와 fixture metadata, release21/lint/draw options를 정의합니다." },
            { lines: "20-56", explanation: "checked call, broad override, reassigned/non-closeable resource, checked close, never-thrown catch, precise rethrow 손실, finally return warning fixtures를 독립 source로 구성합니다." },
            { lines: "58-90", explanation: "JDK compiler와 OS temp를 준비하고 fixture별 classes directory에서 compile result·diagnostics total1·expected kind1을 검증해 code@line을 출력합니다." },
            { lines: "91-102", explanation: "OS temp direct-child boundary를 확인하고 partial class files까지 reverse delete한 뒤 residue가 없음을 assert합니다." },
          ],
          run: { environment: ["OpenJDK 21.0.11"], command: isolatedJavaRun("ResourceCompilerContracts.java", "ResourceCompilerContracts") },
          output: { value: "checked-call=compiler.err.unreported.exception.need.to.catch.or.throw@2\nbroad-override=compiler.err.override.meth.doesnt.throw@3\nreassigned-resource=compiler.err.try.with.resources.expr.effectively.final.var@3\nnot-autocloseable=compiler.err.prob.found.req@2\nclose-checked=compiler.err.unreported.exception.implicit.close@4\nnever-thrown=compiler.err.except.never.thrown.in.try@3\nbroken-precise=compiler.err.unreported.exception.need.to.catch.or.throw@4\nfinally-return=compiler.warn.finally.cannot.complete@2\ncontracts=8", explanation: ["첫 일곱 tasks는 compile false·ERROR1입니다.", "non-AutoCloseable type mismatch와 automatic close의 implicit checked failure도 별도 codes로 드러납니다.", "finally-return은 compile true지만 WARNING1이라 warning0 build에서 차단할 수 있습니다.", "각 diagnostic은 OpenJDK21.0.11 code와 1-based line을 고정합니다."] },
          experiments: [
            { change: "reassigned-resource의 두 번째 assignment를 제거합니다.", prediction: "resource가 effectively final이 되어 compile success·diagnostic0입니다.", result: "Java9 resource reference는 alias target이 고정되어야 합니다." },
            { change: "close-checked method에 throws IOException을 추가합니다.", prediction: "automatic close의 checked IOException contract가 선언되어 compile success입니다.", result: "implicit close invocation도 catch-or-declare 분석 대상입니다." },
            { change: "finally-return compile options에서 -Xlint:all을 제거합니다.", prediction: "warning이 사라져 dangerous legal code가 성공처럼 보입니다.", result: "warning0 toolchain policy가 semantic guardrail입니다." },
          ],
          sourceRefs: ["java-compiler-api", "java-diagnostic-api", "java-files-api", "jls-exception-checking", "jls-overriding-throws", "jls-try-with-resources", "jls-effectively-final", "jls-finally-execution"],
        },
      ],
      diagnostics: [
        { symptom: "concurrent close에서 cleanup이 두 번 실행된다.", likelyCause: "plain boolean check-then-set race 또는 여러 wrappers의 independent ownership입니다.", checks: ["close state transition이 atomic인지 봅니다.", "alias/wrapper graph를 그립니다.", "cleanup count stress test를 실행합니다."], fix: "단일 owner와 atomic close-once state machine을 사용합니다.", prevention: "concurrency contract에 use/close/failed-close transitions와 linearization point를 명시합니다." },
        { symptom: "negative compiler fixture가 repository에 class files를 남기거나 다른 fixture 결과를 오염시킨다.", likelyCause: "공용 output directory와 불완전 cleanup을 사용했습니다.", checks: ["fixture별 -d를 확인합니다.", "temp parent boundary를 검사합니다.", "실패 뒤 Files.walk 결과를 봅니다."], fix: "OS temp direct child·fixture별 output·finally reverse cleanup을 적용합니다.", prevention: "검증 후 repository-wide .class residue0를 CI에서 확인합니다." },
      ],
      expertNotes: ["close CAS를 cleanup 전에 CLOSED로 바꾸면 다른 thread는 cleanup 완료 전 closed를 관찰할 수 있습니다. CLOSING과 completion signal이 필요한지 resource invariants로 결정합니다.", "diagnostic code는 OpenJDK implementation contract이므로 JLS rule 근거와 toolchain-pinned regression identity를 함께 기록합니다."],
    },
  ],
  lab: {
    title: "실패 주입 가능한 카탈로그 export pipeline의 ownership·propagation·suppression 계약",
    scenario: "Source→Decoder→Writer 의존 순서를 가진 세 개의 non-cascading 실습 자원을 순서대로 획득해 카탈로그를 export합니다. 각 fixture의 close는 자기 event/failure만 기록하고 다른 fixture를 닫지 않습니다. 각 acquisition, body, close 위치에 실패를 주입하고도 이미 획득한 자원이 TWR에 의해 역순으로 정확히 한 번 닫히며, primary·cause·suppressed와 public error code가 손실되지 않는 JDK21 프로그램을 설계합니다.",
    setup: [
      "OpenJDK 21에서 UTF-8, --release 21, -proc:none, -Xlint:all, isolated -d를 사용하는 실행 harness를 준비합니다.",
      "프로젝트 밖 OS temp direct-child 작업 directory를 만들고 종료 시 resolved parent boundary를 확인해 삭제합니다.",
      "Source, Decoder, Writer가 AutoCloseable을 구현하고 open/use/close events를 외부 Trace에 기록하게 합니다. 이 failure-matrix fixtures는 실제 stream wrapper와 달리 close를 서로 전파하지 않는다고 명시합니다.",
      "FailurePoint enum에 NONE, OPEN_SOURCE, OPEN_DECODER, OPEN_WRITER, BODY, CLOSE_WRITER, CLOSE_DECODER, CLOSE_SOURCE를 둡니다.",
      "CatalogExportException은 stable code와 cause constructor, serialVersionUID를 갖게 합니다.",
      "사용자 output에는 stable code만, developer trace에는 primary/cause/suppressed type·message·order만 포함하고 실제 경로·credential은 사용하지 않습니다.",
      "모든 case는 새 Trace/resources로 실행해 이전 case state가 섞이지 않게 합니다.",
      "System.in/out은 닫지 않고 synthetic in-memory resources만 owner scope에서 관리합니다.",
    ],
    steps: [
      "정상 case에서 open Source→Decoder→Writer, body, close Writer→Decoder→Source, success 순서를 exact list로 assert합니다.",
      "OPEN_SOURCE에서는 어떤 resource도 등록/close되지 않고 body가 실행되지 않음을 확인합니다.",
      "OPEN_DECODER에서는 Source만 close되고 Decoder/Writer/body event가 없음을 확인합니다.",
      "OPEN_WRITER에서는 Decoder→Source 순서로 close되고 Writer/body가 실행되지 않음을 확인합니다.",
      "BODY failure에서 Writer→Decoder→Source가 모두 close되고 body exception이 primary임을 확인합니다.",
      "BODY+CLOSE_WRITER+CLOSE_DECODER+CLOSE_SOURCE 조합에서 body가 primary, suppressed가 Writer·Decoder·Source close order임을 assert합니다.",
      "body success+CLOSE_WRITER+CLOSE_DECODER에서 Writer close가 primary, Decoder close가 suppressed이고 Source close는 정상 시도됨을 확인합니다.",
      "low-level IOException을 service boundary에서 CatalogExportException으로 translate하고 original을 cause로 보존합니다.",
      "translation 뒤 cause.getSuppressed가 그대로 남아 failure tree를 잃지 않는지 검사합니다.",
      "export method header에는 caller가 처리할 domain checked type만 선언하고 IOException·Exception leakage를 제거합니다.",
      "borrowed Trace sink를 export method가 닫지 않고, export method가 생성한 Source/Decoder/Writer만 닫는 ownership table을 작성합니다.",
      "Writer가 Decoder 결과에, Decoder가 Source 결과에 의존하지만 fixture close는 non-cascading이라고 고정합니다. 세 fixture를 모두 Source→Decoder→Writer 순으로 등록해 자동 호출이 Writer→Decoder→Source가 되는지 검증합니다.",
      "close method를 concurrent 호출할 수 있는 resource 하나에는 CAS close-once를 적용하고 cleanupCount1을 stress/assert합니다.",
      "finally 안 return/throw, catch-and-ignore, `throws Exception`, shared standard stream close가 없는지 정적 검색합니다.",
      "정상 Java sources는 compiler output0/warning0, negative fixtures는 expected diagnostic kind/code/line만 갖는지 분리 검증합니다.",
      "모든 실행 뒤 temp가 삭제되고 repository-wide .class residue가0인지 확인합니다.",
    ],
    expectedResult: [
      "정상 acquisition/body/close trace가 left-to-right, body, reverse close 순서를 정확히 보입니다.",
      "각 partial acquisition failure에서 성공적으로 등록된 resources만 역순으로 close됩니다.",
      "body+복수 close failure의 primary는 body이고 suppressed order는 Writer→Decoder→Source입니다.",
      "close-only 복수 실패에서는 첫 reverse-close failure가 primary이고 뒤 failures가 suppressed입니다.",
      "CatalogExportException cause subtree 안에 original cause와 suppressed가 모두 남습니다.",
      "public output은 stable code와 재시도/문의 행동만 제공하고 developer trace와 분리됩니다.",
      "non-cascading owner-created fixtures는 각각 정확히 한 번 닫히고 borrowed/shared resources는 닫히지 않습니다.",
      "concurrent close aggregate cleanupCount가 scheduling과 무관하게1입니다.",
      "positive compile은 warning0이고 compiler contract fixtures만 의도한 ERROR/WARNING을 냅니다.",
      "temp·class·fixture artifacts가 repository에 남지 않습니다.",
    ],
    cleanup: [
      "OS temp root가 system temp의 direct child인지 resolved path로 검증한 뒤 reverse delete합니다.",
      "실패 fixture별 classes directories와 partial class files도 finally에서 삭제합니다.",
      "launcher environment를 변경했다면 존재 여부와 원값을 finally에서 복원합니다.",
      "repository에서 .class, temporary source, absolute local path가 남지 않았는지 다시 검색합니다.",
    ],
    extensions: [
      "close failure가 재시도 가능한 resource를 OPEN/CLOSING/CLOSED/FAILED state machine으로 확장하고 retry owner를 명시합니다.",
      "structured JSON failure tree serializer를 identity-cycle-safe하게 구현합니다.",
      "virtual thread 여러 개가 borrow/use/close하는 잘못된 API와 thread-confined 올바른 API를 비교합니다.",
      "실제 InputStream→BufferedInputStream→Reader chain은 outermost owner만 TWR에 등록한 경우와 세 aliases를 모두 등록한 경우의 transitive close count를 비교하고, outermost-only ownership으로 중복 close를 제거합니다.",
      "Spring repository exception translation과 transaction rollback policy에 같은 cause/suppressed 검사를 적용합니다.",
      "database connection pool proxy에서 logical close와 physical close를 구분한 ownership 표를 만듭니다.",
      "process kill을 주입해 finally가 durability 보장이 아님을 보여 주고 journal-based recovery와 비교합니다.",
      "Error Prone/SpotBugs/Checkstyle rule로 finally return과 swallowed exception을 추가 차단합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "Ex06의 success·zero·text·EOF 네 경로를 completion reason 표와 exact process test로 다시 작성하세요.",
      requirements: ["각 경로의 try/catch/finally/after 도달 여부를 표로 작성합니다.", "fresh JVM별 stdin/stdout/stderr/exit를 분리합니다.", "EOF는 NoSuchElementException frame과 finally marker를 함께 assert합니다.", "warning0 compile과 temp cleanup을 유지합니다."],
      hints: ["return은 finally 뒤 method를 떠납니다.", "EOF type은 두 explicit catches에 포함되지 않습니다.", "println prompt 때문에 stdout line count를 직접 세세요."],
      expectedOutcome: "success4, zero3, text3, EOF stdout2+exit1을 설명과 자동 검증이 동일하게 재현합니다.",
      solutionOutline: ["case별 fresh process helper를 만듭니다.", "LF normalization 뒤 exact strings를 비교합니다.", "stderr는 type과 source frame만 구조적으로 검사합니다.", "finally marker와 after marker를 서로 다른 assertions로 둡니다."],
    },
    {
      difficulty: "응용",
      prompt: "세 resources의 acquisition/body/close 실패 조합을 TWR로 실행해 primary·suppressed matrix를 구현하세요.",
      requirements: ["A/B/C open failure를 각각 주입합니다.", "body+close3과 close-only2 조합을 포함합니다.", "acquire와 close 순서를 exact list로 검증합니다.", "cause와 suppressed를 혼동하지 않습니다.", "manual finally version의 정보 손실도 negative comparison으로 남깁니다."],
      hints: ["B open 실패면 A만 close됩니다.", "body가 있으면 그것이 primary입니다.", "close-only는 가장 오른쪽 resource의 첫 failure가 primary입니다."],
      expectedOutcome: "partial acquisition과 dual-failure 모든 case에서 leak 없이 reverse close되고 failure tree가 예상 order와 일치합니다.",
      solutionOutline: ["외부 Trace list와 fail-point set을 주입합니다.", "resource header를 dependency 순서로 선언합니다.", "catch에서 primary message와 getSuppressed messages를 구조적으로 비교합니다.", "각 case 뒤 close count를 확인합니다."],
    },
    {
      difficulty: "설계",
      prompt: "공유 InputStream과 pool handle을 사용하는 export API의 ownership·translation·concurrency 계약을 설계하고 검증하세요.",
      requirements: ["owner/borrower/transfer 표를 public API별로 작성합니다.", "wrapper close cascade와 shared System.in 금지 policy를 포함합니다.", "low-level failures를 stable domain code로 translate하고 cause/suppressed를 보존합니다.", "concurrent close 가능 resource는 lifecycle state/linearization point를 정의합니다.", "checked throws, override, effectively-final, close failure negative compiler tests를 포함합니다.", "사용자/개발자 diagnostics와 민감정보 경계를 분리합니다."],
      hints: ["close idempotence와 use/close thread-safety는 다릅니다.", "pool close는 physical close가 아닐 수 있습니다.", "resource 자체 반환 대신 callback boundary도 비교하세요."],
      expectedOutcome: "다른 개발자가 구현해도 close 주체·순서·failure surface·동시성·관찰 방식이 달라지지 않는 implementation-ready contract와 test matrix가 완성됩니다.",
      solutionOutline: ["API별 ownership state diagram을 먼저 작성합니다.", "TWR scope와 transfer 지점을 sequence로 그립니다.", "failure tree schema와 stable public codes를 정합니다.", "runtime/compile/concurrency tests를 별도 suites로 구성합니다.", "lint warning0와 artifact cleanup을 CI gate로 둡니다."],
    },
  ],
  reviewQuestions: [
    { question: "finally는 언제 실행되나요?", answer: "try/catch statement가 normal 또는 return·throw·break·continue로 완료되어 목적지로 이동하기 전에 실행됩니다. 단, process halt·강제 종료 같은 정상 stack unwinding 밖 사건은 보장하지 않습니다." },
    { question: "return expression은 finally 전후 언제 평가되나요?", answer: "return expression을 먼저 평가해 값과 destination을 보류한 뒤 finally를 실행합니다. finally가 정상 완료하면 보류한 값으로 반환합니다." },
    { question: "finally가 return하면 무엇이 되나요?", answer: "보류 중이던 try/catch return 값이나 exception이 폐기되고 finally의 return이 최종 completion reason이 됩니다." },
    { question: "finally가 새 exception을 던지면 original은 자동 cause가 되나요?", answer: "아닙니다. 새 exception이 original을 대체하며 수동으로 cause/suppressed를 보존하지 않으면 original을 잃습니다." },
    { question: "Ex06의 catch return 뒤 finally marker가 보이는 이유는 무엇인가요?", answer: "return destination이 보류되고 method frame을 떠나기 전에 finally가 실행되기 때문입니다." },
    { question: "Ex06 EOF에서 finally 뒤 exit1인 이유는 무엇인가요?", answer: "NoSuchElementException이 두 catch에 맞지 않아 전파되지만 frame을 떠나기 전 finally가 실행되고 uncaught 상태로 main을 빠져나오기 때문입니다." },
    { question: "Ex08 continue마다 outer finally가 실행되나요?", answer: "아닙니다. continue와 continue esc의 target은 같은 outer try 안 loop입니다. break esc도 outer try가 아니라 labelled while을 끝내며, labelled statement가 matching break를 처리해 정상 완료합니다. 그 뒤 try body에 후속 statement가 없어 try가 정상 완료할 때 finally가 실행됩니다." },
    { question: "System.exit에서도 finally를 믿을 수 있나요?", answer: "일반 statement completion/stack unwinding 보장이 적용되지 않으므로 의존하면 안 됩니다. halt·kill·crash·전원 상실은 더 명확한 제외입니다." },
    { question: "throw와 throws의 차이는 무엇인가요?", answer: "throw는 exception object를 실제 발생시키는 statement이고 throws는 callable 밖으로 전파 가능한 types를 header에 선언하는 계약입니다." },
    { question: "catch-or-declare는 무엇인가요?", answer: "checked exception 가능 지점을 catch로 처리하거나 현재 method/constructor throws에 선언해야 하는 compile-time 규칙입니다." },
    { question: "unchecked exception도 throws에 쓸 수 있나요?", answer: "쓸 수 있지만 compiler 의무는 아니며 API documentation signal로서 가치와 noise를 판단합니다." },
    { question: "throws를 선언하면 exception이 처리된 것인가요?", answer: "아닙니다. 현재 frame이 처리하지 않고 caller 계약으로 넘긴 것이며 실제 matching catch 또는 top-level policy가 따로 필요합니다." },
    { question: "override가 parent보다 넓은 checked exception을 선언할 수 있나요?", answer: "없습니다. parent contract가 허용한 type의 subtype으로 좁히거나 제거할 수 있지만 새롭고 넓은 checked type을 추가할 수 없습니다." },
    { question: "precise rethrow는 무엇인가요?", answer: "effectively-final catch parameter를 다시 던질 때 compiler가 try의 실제 checked throw set만 추론해 넓은 parameter type보다 좁은 throws contract를 유지하는 기능입니다." },
    { question: "catch parameter를 재할당하면 precise rethrow가 왜 깨지나요?", answer: "다시 던지는 object가 original throw set에 속한다는 identity 정보를 compiler가 유지할 수 없기 때문입니다." },
    { question: "exception translation은 언제 하나요?", answer: "low-level type이 public abstraction을 누출하고 caller가 domain-level 행동을 해야 하는 경계에서 합니다. 같은 abstraction 안에서는 불필요한 wrapping을 피합니다." },
    { question: "translation에서 cause가 필요한 이유는 무엇인가요?", answer: "original type·message·stack과 그 suppressed subtree를 보존해 root failure를 진단하기 위해서입니다." },
    { question: "cause와 suppressed의 의미 차이는 무엇인가요?", answer: "cause는 현재 exception이 생긴 원인 chain이고 suppressed는 primary를 유지하느라 함께 대표하지 못한 추가 failures 배열입니다." },
    { question: "resource owner는 누구인가요?", answer: "resource acquisition과 lifetime 종료 시점을 결정하고 close 책임을 가진 code/component입니다. 일반적으로 생성한 scope입니다." },
    { question: "borrower가 parameter resource를 닫아도 되나요?", answer: "ownership transfer가 명시되지 않았다면 닫지 않습니다. use만 하고 creator/owner가 lifetime을 종료합니다." },
    { question: "AutoCloseable.close는 idempotent한가요?", answer: "interface가 필수로 보장하지 않습니다. 구현자는 가능하면 idempotent하게 설계할 수 있지만 caller는 문서 없이 double close safety를 가정하면 안 됩니다." },
    { question: "Closeable은 AutoCloseable과 무엇이 다른가요?", answer: "Closeable은 subtype이며 close가 IOException을 던지고 이미 닫힌 stream에 다시 close해도 효과가 없어야 하는 더 구체적 I/O 계약을 가집니다." },
    { question: "TWR resource acquisition 순서는 무엇인가요?", answer: "resource specification을 왼쪽에서 오른쪽으로 평가합니다." },
    { question: "TWR close 순서는 무엇인가요?", answer: "성공적으로 초기화된 resources를 선언의 역순, 즉 오른쪽에서 왼쪽으로 닫습니다." },
    { question: "B acquisition이 실패하면 A와 B 중 무엇을 닫나요?", answer: "A만 성공적으로 초기화되어 등록됐으므로 A를 닫습니다. 실패한 B object 내부 partial resources는 B constructor/factory가 정리해야 합니다." },
    { question: "body와 두 close가 모두 실패하면 primary는 무엇인가요?", answer: "body exception이 primary이고 reverse close 순서의 두 failures가 suppressed로 추가됩니다." },
    { question: "body가 성공하고 두 close가 실패하면 primary는 무엇인가요?", answer: "reverse close 중 처음 발생한 failure가 primary이고 이후 close failures가 suppressed입니다." },
    { question: "한 close가 실패하면 나머지 close도 시도하나요?", answer: "TWR는 계속 시도하며 추가 failures를 suppressed로 보존합니다." },
    { question: "Java9 try(resource)의 조건은 무엇인가요?", answer: "resource가 final 또는 effectively-final local variable/parameter이고 AutoCloseable type이어야 합니다." },
    { question: "try(resource) 뒤 variable을 사용할 수 있나요?", answer: "lexical scope에 남아 있으면 참조 자체는 가능합니다. 정상 close 경로에서는 닫힌 object이고, close failure를 처리해 뒤로 진행했다면 상태가 구현별 unknown/partial일 수 있으므로 어느 경우든 live resource처럼 재사용하지 않습니다." },
    { question: "wrapper를 닫으면 underlying도 닫히나요?", answer: "많은 FilterInputStream/BufferedInputStream 계열은 close를 underlying에 전파합니다. 정확한 API 계약을 확인해야 합니다." },
    { question: "Scanner(System.in)을 library가 닫으면 안 되는 이유는 무엇인가요?", answer: "Scanner.close가 process-wide shared System.in까지 닫아 이후 unrelated input consumers를 깨뜨릴 수 있기 때문입니다." },
    { question: "non-closing wrapper는 항상 안전한가요?", answer: "아닙니다. underlying close 전파만 막되 output wrapper의 flush/finalization과 input wrapper의 자체 cleanup 등 wrapper 고유 semantics와 leak 책임을 보존해야 합니다." },
    { question: "idempotent close와 thread-safe use/close는 같은가요?", answer: "아닙니다. close effect가 한 번이라는 성질과 use가 close와 race하지 않는 lifecycle synchronization은 별도 계약입니다." },
    { question: "plain boolean으로 close-once를 구현하면 왜 위험한가요?", answer: "check와 set 사이 race로 여러 threads가 cleanup winner가 될 수 있습니다. CAS/lock 등 원자적 transition이 필요합니다." },
    { question: "CAS 직후 cleanup이 실패하면 어떤 문제가 있나요?", answer: "closed=true지만 cleanup 불완전 상태가 될 수 있어 CLOSING/CLOSED/FAILED와 retry owner를 포함한 state machine이 필요할 수 있습니다." },
    { question: "finally return은 compile error인가요?", answer: "legal code일 수 있지만 javac -Xlint:finally가 명백히 finally가 정상 완료할 수 없는 경우 warning을 냅니다. warning0 policy로 차단해야 합니다." },
    { question: "automatic close의 checked exception도 catch-or-declare 대상인가요?", answer: "그렇습니다. source에 close 호출이 직접 보이지 않아도 compiler가 implicit close failure를 분석합니다." },
    { question: "compiler tests만으로 ownership이 증명되나요?", answer: "아닙니다. compiler는 type/checked/language rules를 검증하고 close order·suppression·ownership·concurrency는 runtime/architecture tests가 필요합니다." },
    { question: "finally와 TWR 중 무엇을 선택하나요?", answer: "AutoCloseable resource ownership에는 TWR를 우선하고, resource가 아닌 반드시 필요한 frame-local action에는 finally를 사용하되 control transfer를 넣지 않습니다." },
  ],
  completionChecklist: [
    "normal completion에서 finally 뒤 다음 문장으로 가는 흐름을 설명했다.",
    "return value 평가와 finally 실행 순서를 구분했다.",
    "throw propagation 전 frame별 finally 실행을 추적했다.",
    "break·continue label target이 try를 실제로 떠나는지 확인했다.",
    "System.exit·halt·kill·crash가 finally 보장 밖임을 명시했다.",
    "finally 안 return·throw·break·continue를 제거했다.",
    "finally cleanup failure가 original exception을 덮지 않는지 검사했다.",
    "primary·cause·suppressed를 서로 다른 관계로 읽었다.",
    "Ex06 success4·zero3·text3·EOF2+exit1을 재현했다.",
    "Ex07 valid12·propagated text3·EOF exit1을 재현했다.",
    "Ex08 even2·recovery5·EOF2+exit1을 재현했다.",
    "package8과 direct3을 독립 warning0 output에 compile했다.",
    "각 interactive case를 fresh JVM·closed stdin으로 실행했다.",
    "stdout·stderr·exit·timeout을 분리했다.",
    "hostile launcher variables4를 parent/child에서 격리·복원했다.",
    "async stdout/stderr drain과 10초+kill+5초 lifecycle을 적용했다.",
    "throw statement와 throws declaration을 구분했다.",
    "checked call마다 catch-or-declare를 만족했다.",
    "unchecked throws 선언의 문서 가치를 검토했다.",
    "throws Exception으로 failure surface를 불필요하게 넓히지 않았다.",
    "override의 checked exception subtype 규칙을 검증했다.",
    "precise rethrow catch parameter를 effectively final로 유지했다.",
    "중복 catch-log-rethrow를 제거하거나 logging owner를 정했다.",
    "translation boundary가 abstraction과 caller 행동에 맞는다.",
    "custom domain exception이 original cause를 보존한다.",
    "translation 뒤 cause subtree의 suppressed가 남는다.",
    "public error code/message와 developer diagnostics를 분리했다.",
    "exception message에 credential·절대 경로·개인정보를 넣지 않았다.",
    "각 resource의 owner·borrower·transfer를 표로 작성했다.",
    "borrower가 parameter resource를 닫지 않는다.",
    "owner가 생성 resource를 정확히 한 번 닫는다.",
    "AutoCloseable과 Closeable close/idempotence 계약을 구분했다.",
    "TWR resource acquisition이 왼쪽→오른쪽임을 검증했다.",
    "TWR close가 오른쪽→왼쪽임을 검증했다.",
    "wrapper dependency와 declaration order가 맞는다.",
    "partial acquisition 각 position failure를 주입했다.",
    "실패한 constructor 내부 partial resources를 자체 정리한다.",
    "body+복수 close failure의 primary/suppressed order를 검증했다.",
    "close-only 복수 failure의 primary/suppressed order를 검증했다.",
    "한 close failure 뒤에도 나머지 close가 시도된다.",
    "Java9 try(resource)가 final/effectively-final variable만 사용한다.",
    "TWR 뒤 visible variable을 재사용하지 않고 정상 close와 close-failure 상태를 구분했다.",
    "동일 resource alias를 TWR에 중복 등록하지 않았다.",
    "wrapper close의 underlying cascade를 API와 test로 확인했다.",
    "System.in/out/err shared ownership을 top-level에 남겼다.",
    "library가 Scanner(System.in)을 생성·close하지 않게 input을 주입했다.",
    "non-closing wrapper의 output flush/finalization과 input cleanup tradeoff를 구분해 문서화했다.",
    "idempotent close가 AutoCloseable 필수 보장이 아님을 명시했다.",
    "concurrent close transition을 CAS/lock으로 원자화했다.",
    "idempotent close와 concurrent use safety를 별도 설계했다.",
    "cleanup failure state와 retry owner를 정의했다.",
    "close blocking/interrupt/timeout policy를 검토했다.",
    "positive Java examples를 JDK21 -Xlint:all warning0로 compile했다.",
    "checked·override·resource·finally compiler contracts8을 검증했다.",
    "negative fixtures를 task별 temp output에 격리했다.",
    "diagnostic kind·count·code·line을 toolchain version과 함께 고정했다.",
    "walkthrough line ranges가 실제 code와 의미상 일치한다.",
    "모든 sourceRefs가 공개/원본 provenance source에 연결된다.",
    "OS temp direct-child cleanup parent boundary를 확인했다.",
    "repository에 .class·fixture·local absolute path residue가0이다.",
  ],
  nextSessions: ["core-04-set-generics"],
  sources: [
    { id: "java-class08-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex01_Exception.java", usedFor: ["package8 companion", "exact8 smoke", "post-catch completion"], evidence: "array0~4 뒤 index5 failure, normalized exception line, catch marker, outer completion까지 exact8행·exit0을 package companion process에서 확인했습니다." },
    { id: "java-class08-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex02_Exception.java", usedFor: ["package8 companion", "checked source failure", "translation cause", "uncaught exit1"], evidence: "empty audit working directory에서 FileNotFoundException을 RuntimeException cause로 감싸 frames13/11·stdout empty·exit1을 확인하고 translation 설명의 원본 대비로 사용했습니다." },
    { id: "java-class08-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex03_Exception.java", usedFor: ["package8 companion", "specific catch smoke", "input5-zero exact4"], evidence: "입력5→0에서 quotient와 ArithmeticException handler까지 exact4행·exit0인 package regression contract를 확인했습니다." },
    { id: "java-class08-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex04_Exception.java", usedFor: ["package8 companion", "retry then EOF", "sequence7 exit1"], evidence: "입력5→0→x recovery stdout7행 뒤 EOF NoSuchElementException frame25·exit1을 확인해 catch 뒤에도 failure가 남는 companion 근거로 사용했습니다." },
    { id: "java-class08-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex05_Exception.java", usedFor: ["package8 companion", "broad catch smoke", "zero exact3"], evidence: "입력0에서 raw ArithmeticException과 generic marker를 포함 exact3행·exit0인 broad catch 원본을 확인했습니다." },
    { id: "java-class08-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex06_Exception.java", usedFor: ["direct inventory", "finally normal/return/EOF", "Scanner close ownership", "exact4/3/3/2"], evidence: "5는 exact4와 after 도달, 0/text는 catch return이어도 finally exact3, EOF는 finally marker 포함 stdout2 뒤 NoSuchElementException frame28·exit1이며 finally1/return2 source shape를 확인했습니다." },
    { id: "java-class08-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex07_Exception.java", usedFor: ["direct inventory", "throws propagation", "caller catch", "valid12/text3/EOF"], evidence: "throws NumberFormatException declarations2, 2abc 첫 글자2 valid12, x의 prnData→setData→main propagation exact3, pre-parse EOF prompt 뒤 frame39·exit1과 finally1을 확인했습니다." },
    { id: "java-class08-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class08/Ex08_Exception.java", usedFor: ["direct inventory", "label break/continue", "outer finally", "recovery5/EOF"], evidence: "finally1·continue2·break esc1 source shape, even→n exact2, x→3→q→y→4→n exact5, EOF recovery nextLine frame17·finally marker·exit1을 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["package/direct warning0", "release21", "lint finally", "diagnostic codes"], evidence: "OpenJDK21.0.11 -encoding UTF-8 --release21 -proc:none -Xlint:all과 isolated -d로 original/positive/negative contracts를 실행하는 version-pinned toolchain입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["fresh JVM15", "ArgumentList", "working directory", "redirected UTF-8 streams"], evidence: "shell interpolation 없이 direct10·companion5 Java processes의 arguments, stdin/out/err, encoding과 audit temp working directory를 구성하는 API 근거입니다." },
    { id: "powershell-environment-variables", repository: "Microsoft PowerShell Documentation", path: "about_Environment_Variables / Env provider", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher presence/value save", "process-scope removal", "finally restoration"], evidence: "audit process에서 Java launcher option4의 존재·값을 저장하고 제거한 뒤 finally에서 원래 상태로 복원하는 Env provider 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child environment isolation", "launcher options removal", "per-process variables"], evidence: "각 javac/java child environment에서도 launcher option4를 제거해 hostile host options가 exact evidence를 바꾸지 않게 하는 API 근거입니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["Start", "WaitForExit10s", "Kill tree", "termination grace5s", "Dispose"], evidence: "Java child마다 10초 runtime timeout, process-tree kill, 5초 bounded termination과 finally Dispose를 적용하는 lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "System.IO.StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["stdout async drain", "stderr async drain", "post-exit task recovery"], evidence: "child Start 직후 stdout/stderr를 병렬 drain해 redirected pipe backpressure deadlock을 피하고 normal/kill 뒤 tasks를 회수하는 근거입니다." },
    { id: "jls-abrupt-completion", repository: "JLS SE 21", path: "14.1 The Kinds of Statements", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.1", usedFor: ["normal/abrupt completion", "return/throw/break/continue", "pending destination"], evidence: "statement의 normal completion과 return·throw·break·continue abrupt completion terminology의 primary specification입니다." },
    { id: "jls-finally-execution", repository: "JLS SE 21", path: "14.20.2 Execution of try-finally and try-catch-finally", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.2", usedFor: ["finally ordering", "pending completion", "masking", "compiler warning reasoning"], evidence: "try/catch completion reason R, finally completion reason S와 S가 R을 폐기하는 exact control-flow rules의 primary specification입니다." },
    { id: "jls-try-with-resources", repository: "JLS SE 21", path: "14.20.3 try-with-resources", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3", usedFor: ["resource specification", "left-to-right acquisition", "reverse close", "suppression", "partial acquisition"], evidence: "TWR grammar, translation, initialization, reverse close와 suppressed exception behavior를 정의하는 중심 specification입니다." },
    { id: "java9-try-resources", repository: "JLS SE 21", path: "14.20.3 Resource references", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3", usedFor: ["existing variable resource", "final/effectively-final requirement", "scope after TWR"], evidence: "Java9 이후 resource declaration 외 variable access를 resource로 쓰는 grammar와 final/effectively-final restriction 근거입니다." },
    { id: "jls-exception-checking", repository: "JLS SE 21", path: "11.2 Compile-Time Checking of Exceptions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.2", usedFor: ["catch-or-declare", "implicit close checked failure", "negative fixtures"], evidence: "checked exception compile-time obligations와 statements/expressions의 exception analysis 근거입니다." },
    { id: "jls-throwing-exceptions", repository: "JLS SE 21", path: "11.3 Run-Time Handling of an Exception", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.3", usedFor: ["caller propagation", "handler search", "frame unwinding"], evidence: "exception이 throw point에서 dynamically enclosing handlers를 찾고 caller 방향으로 전파되는 runtime 규칙 근거입니다." },
    { id: "jls-precise-rethrow", repository: "JLS SE 21", path: "11.2.2 Exception Analysis of Statements", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.2.2", usedFor: ["precise rethrow", "effectively-final catch parameter", "actual throw set"], evidence: "catch parameter를 다시 던질 때 final/effectively-final 조건과 try에서 가능한 alternatives로 thrown types를 정밀 계산하는 규칙 근거입니다." },
    { id: "jls-overriding-throws", repository: "JLS SE 21", path: "8.4.8.3 Requirements in Overriding and Hiding", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3", usedFor: ["override checked restriction", "broad-override fixture", "API substitutability"], evidence: "overriding method의 checked throws가 overridden method contract와 호환되어야 하는 compile-time rule 근거입니다." },
    { id: "jls-effectively-final", repository: "JLS SE 21", path: "4.12.4 final Variables", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.4", usedFor: ["effectively-final definition", "resource reassignment negative", "catch parameter identity"], evidence: "effectively-final local/parameter의 assignment-based 정의와 final variable semantics 근거입니다." },
    { id: "jmm-happens-before", repository: "JLS SE 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["thread join visibility", "concurrent close aggregate", "lifecycle synchronization"], evidence: "thread termination/join visibility를 포함해 actions 사이 happens-before ordering을 설명하는 Java Memory Model 근거입니다." },
    { id: "java-autocloseable-api", repository: "Java SE 21 API", path: "java.lang.AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["TWR eligibility", "close throws Exception", "idempotence non-guarantee", "resource contract"], evidence: "TWR-managed resource base contract와 close의 Exception surface, Closeable과 다른 idempotence guidance 근거입니다." },
    { id: "java-closeable-api", repository: "Java SE 21 API", path: "java.io.Closeable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Closeable.html", usedFor: ["I/O close contract", "IOException", "already-closed no effect"], evidence: "AutoCloseable subtype인 I/O source/destination close의 narrower IOException과 idempotent already-closed semantics 근거입니다." },
    { id: "java-throwable-api", repository: "Java SE 21 API", path: "java.lang.Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["cause", "getSuppressed", "addSuppressed", "failure tree"], evidence: "cause chain, suppressed array, stack과 constructors를 통해 primary/translation/cleanup failures를 구조적으로 보존하고 읽는 API 근거입니다." },
    { id: "java-io-exception-api", repository: "Java SE 21 API", path: "java.io.IOException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/IOException.html", usedFor: ["checked repository failure", "Closeable failure", "catch-or-declare"], evidence: "I/O operation failure를 나타내는 checked family와 examples의 propagation/translation contract 근거입니다." },
    { id: "java-sql-exception-api", repository: "Java SE 21 API", path: "java.sql.SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["precise rethrow alternative", "database checked failure", "caller-specific catch"], evidence: "IOException과 disjoint한 checked alternative로 precise rethrow union과 caller handler를 검증하는 API 근거입니다." },
    { id: "java-number-format-api", repository: "Java SE 21 API", path: "java.lang.NumberFormatException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/NumberFormatException.html", usedFor: ["Ex07 propagation", "unchecked throws documentation", "parse failure"], evidence: "String numeric conversion failure인 unchecked type으로 Ex07의 throws 선언과 caller catch를 설명하는 API 근거입니다." },
    { id: "java-scanner-api", repository: "Java SE 21 API", path: "java.util.Scanner", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html", usedFor: ["Ex06-08 input", "close underlying Readable", "System.in ownership caution"], evidence: "token parsing, EOF exceptions와 Scanner.close가 Closeable input source를 닫는 lifecycle 근거입니다." },
    { id: "java-input-stream-api", repository: "Java SE 21 API", path: "java.io.InputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html", usedFor: ["borrowed input", "read contract", "shared stream base"], evidence: "borrowOne parameter와 wrapper underlying resource의 read/close surface 근거입니다." },
    { id: "java-filter-input-stream-api", repository: "Java SE 21 API", path: "java.io.FilterInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FilterInputStream.html", usedFor: ["delegate wrapper", "transitive close", "underlying ownership"], evidence: "filter wrapper가 contained input stream에 operations와 close를 위임하는 transitive lifecycle 근거입니다." },
    { id: "java-buffered-input-stream-api", repository: "Java SE 21 API", path: "java.io.BufferedInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedInputStream.html", usedFor: ["wrapper TWR", "buffered read", "underlying close cascade"], evidence: "TrackingInputStream ownership transfer example에서 wrapper가 buffer를 관리하고 close하는 API 근거입니다." },
    { id: "java-system-api", repository: "Java SE 21 API", path: "java.lang.System in/out/err", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html", usedFor: ["shared standard streams", "top-level ownership", "System.in caution"], evidence: "process-wide standard input/output/error streams가 global system facilities임을 확인하는 API 근거입니다." },
    { id: "java-system-exit", repository: "Java SE 21 API", path: "java.lang.System.exit", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#exit(int)", usedFor: ["finally caveat", "shutdown initiation", "process termination"], evidence: "current Java virtual machine termination을 시작하는 API로 ordinary try statement completion과 다른 process boundary 근거입니다." },
    { id: "java-runtime-halt", repository: "Java SE 21 API", path: "java.lang.Runtime.halt", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runtime.html#halt(int)", usedFor: ["forced halt caveat", "no shutdown sequence reliance", "durability boundary"], evidence: "shutdown hooks/finalizers를 시작하지 않고 VM을 강제 종료하는 caveat의 official API 근거입니다." },
    { id: "java-shutdown-hook", repository: "Java SE 21 API", path: "java.lang.Runtime.addShutdownHook", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runtime.html#addShutdownHook(java.lang.Thread)", usedFor: ["best-effort shutdown action", "termination caveat", "not durability"], evidence: "VM shutdown hook registration과 이미 종료 중이거나 강제 종료 상황의 한계를 판단하는 API 근거입니다." },
    { id: "java-atomic-boolean-api", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicBoolean", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicBoolean.html", usedFor: ["CAS close-once", "atomic state", "cleanup winner"], evidence: "compareAndSet(false,true)로 하나의 concurrent close winner를 정하는 atomic API 근거입니다." },
    { id: "java-thread-join-api", repository: "Java SE 21 API", path: "java.lang.Thread.join", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html#join()", usedFor: ["worker completion", "deterministic aggregate output", "visibility"], evidence: "close workers가 종료할 때까지 main이 기다린 뒤 aggregate state를 출력하는 lifecycle API 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["eight isolated tasks", "release/lint options", "compile success/error"], evidence: "negative/warning fixtures를 production compile과 분리해 task별 실행하는 compiler service API입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["ERROR/WARNING kind", "diagnostic code", "line", "count"], evidence: "compiler contract를 localized message가 아닌 structured kind·code·line으로 검증하는 API 근거입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp direct child", "fixture source/classes", "reverse cleanup", "residue0"], evidence: "compiler fixtures와 partial outputs를 OS temp에 격리하고 walk/reverse delete하는 file API 근거입니다." },
    { id: "effective-java-exceptions", repository: "Effective Java, Third Edition", path: "Chapter 10 Exceptions, Items 69-77", usedFor: ["exception translation", "cause preservation", "failure contract", "finally masking avoidance"], evidence: "exception을 exceptional conditions에 사용하고 abstraction-appropriate types, cause, detail와 failure atomicity를 설계하는 보충 원칙입니다." },
    { id: "effective-java-try-resources", repository: "Effective Java, Third Edition", path: "Item 9 Prefer try-with-resources to try-finally", usedFor: ["TWR preference", "suppressed failures", "multi-resource cleanup", "readability"], evidence: "manual try-finally보다 TWR가 resource cleanup과 primary/suppressed information을 더 정확히 보존한다는 보충 원칙입니다." },
    { id: "owasp-error-handling", repository: "OWASP Cheat Sheet Series", path: "Error Handling Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["safe public errors", "detailed restricted logs", "information leakage", "central handling"], evidence: "사용자에게 generic/stable response를 제공하고 detailed exception diagnostics를 server-side에 제한하는 security guidance입니다." },
  ],
  sourceCoverage: {
    filesRead: 8,
    filesUsed: 8,
    uncoveredNotes: [
      "inventory direct3 Ex06_Exception·Ex07_Exception·Ex08_Exception을 모두 읽고 source shapes와 fresh-JVM normal/return/propagation/EOF outputs에 직접 사용했습니다.",
      "class08 Ex01~Ex08 여덟 files 전체를 package compile/run해 direct3에 별도 source companion/dependency가 없고 public main roles가 package8/direct3임을 확인했습니다.",
      "package8과 direct3은 별도 classes directories에서 OpenJDK21.0.11 -g:source,lines -Xlint:all -XDrawDiagnostics exit0·compiler output0입니다.",
      "Ex06 input5는 exact4와 after 도달, zero/text는 catch return exact3과 after 미도달, EOF는 stdout2·finally marker·NoSuchElementException frame28·exit1입니다.",
      "Ex07 input2abc는 first-character2 구구단 exact12, x는 prnData→setData→main propagation exact3, EOF는 prompt만 출력한 뒤 frame39·exit1이며 finally close를 source에서 확인했습니다.",
      "Ex08 even→n exact2, x→3→q→y→4→n label/recovery exact5, EOF는 invalid marker와 outer finally marker 뒤 recovery nextLine frame17·exit1입니다.",
      "Ex06 finally1/return2, Ex07 throws NumberFormatException2/finally1, Ex08 finally1/continue2/break esc1 source shapes를 dynamic regex assertions로 확인했습니다.",
      "companion Ex01 exact8, Ex02 cause frames13/11 exit1, Ex03 5→0 exact4, Ex04 sequence7+EOF frame25 exit1, Ex05 zero exact3을 package health evidence로 보존했습니다.",
      "original audit는 setup mutation 전 outer try를 열고 launcher options4를 audit/child environment에서 제거합니다. body error를 보존하면서 environment restore와 owned temp cleanup을 독립 시도해 단일 오류는 original stack, 복수 오류는 AggregateException으로 전파하며 async drain, closed stdin, 10-second timeout, tree kill, 5-second termination grace와 Dispose를 사용합니다.",
      "normal/return/throw/break/continue와 finally masking은 JLS14.1/14.20.2 규칙을 deterministic Java traces로 확장했습니다.",
      "throws/catch-or-declare, override restriction, precise rethrow는 JLS11/8 rules와 IOException/SQLException examples 및 compiler negatives로 검증했습니다.",
      "AutoCloseable/Closeable ownership, left-to-right acquisition, reverse close, partial acquisition은 JLS/API와 warning0 examples로 검증했습니다.",
      "body+close와 close-only matrices는 reverse close 시도와 primary/suppressed order를 exact output으로 검증했습니다.",
      "Java9 existing resource reference는 effectively-final success example과 reassignment compiler error를 함께 사용했습니다.",
      "wrapper ownership은 borrowed direct read와 BufferedInputStream transfer close cascade를 underlying close count0→1로 검증했습니다.",
      "System.in Scanner close는 원본 behavior로 확인하되 shared process에서는 top-level owner만 닫는 개선 policy를 별도로 명시했습니다.",
      "concurrent close example은 threads8 join 뒤 AtomicBoolean CAS cleanupCount1, repeat close1, use-after-close error를 scheduling-independent output으로 검증합니다.",
      "compiler suite는 checked call, broad override, reassigned/non-closeable resource, checked close, never-thrown catch, broken precise rethrow ERROR7과 finally-return WARNING1입니다.",
      "모든 positive Java examples는 -encoding UTF-8 --release21 -proc:none -Xlint:all warning0와 exact output을 요구합니다.",
      "compiler fixtures는 OS temp direct-child task별 classes에 격리하고 reverse cleanup/post-delete assertion으로 repository class residue를 남기지 않습니다.",
      "공개 code/output/evidence에는 실제 local absolute path·credential·개인 입력을 포함하지 않고 synthetic identifiers와 normalized exception fields만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
