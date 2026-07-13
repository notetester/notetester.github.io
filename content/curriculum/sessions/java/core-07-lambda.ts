import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-07-lambda"],
  slug: "core-07-lambda",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 27,
  title: "함수형 인터페이스와 람다식",
  subtitle: "SAM·target typing·capture·this·method reference를 문법 축약이 아닌 타입과 수명 계약으로 이해하고, 예외·identity·부수 효과까지 설계합니다.",
  level: "고급",
  estimatedMinutes: 900,
  coreQuestion: "람다를 짧은 익명 함수처럼 쓰는 데서 멈추지 않고, 어떤 functional interface가 target인지·무엇을 capture하는지·예외와 상태의 소유권을 어떻게 드러내야 안전한 API가 될까요?",
  summary: "javastudy2 class12 원본10개를 모두 읽고 inventory direct4인 Ex01_Lambda·Ex02_Lambda·Ex03_Main·Ex05_Main을 중심으로 OpenJDK21.0.11에서 감사했습니다. package10은 warning0·compiler output0으로 compile되고 public main7·compile-only3입니다. direct4만 compile하면 Ex05가 Ex04_Lambda를 찾지 못해 compiler errors15·exit1이며, Ex04 dependency를 더한 scope5는 warning0·main2·compile-only3입니다. Ex01은 설명 전용 class, Ex02는 abstract1+default1+static1인 @FunctionalInterface, Ex03은 anonymous1과 동등한 lambda syntax3을 거쳐20을 출력합니다. Ex05는 method reference1·anonymous3·lambda4와 functional interface parameter/return을 사용해 exact4행을 출력합니다. package companions Ex06~Ex10은 switch와 Stream 경계의 package health로만 exact/normalized 실행하며 다음 Stream 세션 내용을 선점하지 않습니다. 이 원본 위에서 SAM counting과 Object/default/static 규칙, target typing·poly expression·overload ambiguity, effectively-final capture와 lifetime, lambda lexical this와 anonymous receiver, static/bound/unbound/constructor method references, java.util.function과 primitive specialization·composition, checked exception adapter와 cause, lambda identity/serialization 비계약, 순수 변환·부수 효과·병렬 race, higher-order API·callback lifecycle·테스트 가능성까지 확장합니다.",
  objectives: [
    "functional interface의 single abstract method를 정확히 세고 @FunctionalInterface가 의도 검증 장치인 이유를 설명한다.",
    "lambda가 standalone type이 없는 poly expression이며 assignment·argument·cast가 제공하는 target type으로 signature가 정해짐을 적용한다.",
    "local capture의 final/effectively-final 규칙과 object reference의 가변 상태, lifetime·retention 차이를 구분한다.",
    "anonymous class의 this와 lambda의 lexical this를 구분하고 기계적 변환 전 receiver·identity 가정을 점검한다.",
    "static·bound·unbound instance·constructor method reference의 receiver와 parameter mapping을 판별한다.",
    "Function·Predicate·Consumer·Supplier·Operator와 primitive specializations를 입력·출력·부수 효과 계약에 맞게 선택한다.",
    "checked exception·lambda identity·serialization·공유 가변 상태를 API 경계에서 숨기지 않고 명시적으로 설계한다.",
  ],
  prerequisites: [{ title: "제네릭 collection과 함수 객체의 저장 경계", reason: "functional interface는 generic input/output variance와 collection iteration에 자주 결합되므로 type parameter·wildcard·alias 기본을 먼저 알아야 합니다.", sessionSlug: "core-04-set-generics" }],
  keywords: ["functional interface", "SAM", "@FunctionalInterface", "lambda expression", "target typing", "poly expression", "overload resolution", "effectively final", "capture", "lexical this", "method reference", "Function", "Predicate", "Consumer", "Supplier", "UnaryOperator", "BinaryOperator", "primitive specialization", "checked exception", "UncheckedIOException", "identity", "serialization", "side effect", "referential transparency", "higher-order function", "callback lifecycle"],
  chapters: [
    {
      id: "class12-package10-direct4-scope5-audit",
      title: "class12 package10·inventory4·scope5를 compile하고 lambda 원본과 companion mains를 fresh JVM으로 감사합니다",
      lead: "원본 목록과 실제로 독립 compile 가능한 dependency closure를 분리하고, deterministic output·source shape·known missing dependency를 함께 고정합니다.",
      explanations: [
        "class12에는 Ex01_Lambda부터 Ex10_Stream까지 Java files10개가 있습니다. public main은 Ex03·Ex05·Ex06·Ex07·Ex08·Ex09·Ex10 일곱 개이고 Ex01 class와 Ex02·Ex04 interfaces는 compile-only입니다.",
        "inventory direct4는 Ex01·Ex02·Ex03·Ex05입니다. Ex03은 Ex02를 사용해 direct 안에서 닫히지만 Ex05는 Ex04_Lambda를 사용합니다. 따라서 direct4 compile은 Ex04 missing compiler errors12와 파생 override errors3, 합계15로 exit1입니다.",
        "Ex04를 dependency로 더한 scope5와 package10은 각각 -encoding UTF-8 --release21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics에서 exit0·captured compiler output0입니다. scope는 main2·compile-only3, package는 main7·compile-only3입니다.",
        "Ex01은 runtime behavior가 없는 설명용 public class입니다. active source에는 lambda arrow가0개입니다. Ex02는 @FunctionalInterface1, abstract getMax1, default getSum1, static getAvg1이라 default/static methods가 SAM count를 늘리지 않는 원본 근거입니다.",
        "Ex03은 anonymous implementation1과 arrow3을 선언하며 demo2.getMax(10,20)의 exact output은 `20` 한 행입니다. 생략 문법이 달라도 target interface와 method body 의미는 같습니다.",
        "Ex05는 `System.out::println` method reference1, anonymous implementations3, lambda arrows4를 갖고 functional interface를 variable·argument·return에 사용합니다. 실제 호출은 world^^, world@@, Lambda님 환영, Lambda2님 Hi의 exact4행입니다.",
        "Ex06은 switch companion exact4행, Ex07은 suffix `님`인 ten lines, Ex08은 numeric/OptionalDouble exact9행입니다. Ex09는 insertion/sorted/reverse의 tab-terminated3행, Ex10은 distinct/filter/limit/skip의 space-terminated6행을 exact로 확인하되 Stream semantic teaching은 후속 세션으로 넘깁니다.",
        "audit는 launcher variables4를 현재 process에서 저장·제거하고 child ProcessStartInfo.Environment에서도 제거합니다. UTF-8 async stdout/stderr drain, stdin close, 10초 timeout, descendant tree kill, 5초 termination grace, task recovery, finally Dispose와 OS temp direct-child cleanup을 사용합니다.",
      ],
      concepts: [
        { term: "inventory", definition: "학습 범위로 지정된 원본 files의 목록이며 compile dependency closure와 같다고 가정하지 않습니다.", detail: ["direct4는 Ex04가 빠져 실패합니다.", "누락 자체를 재현 가능한 evidence로 남깁니다."] },
        { term: "dependency closure", definition: "선택한 sources가 type-check·compile되기 위해 함께 제공해야 하는 최소 source 집합입니다.", detail: ["scope5는 direct4+Ex04입니다.", "adjacent companion과 구분합니다."] },
        { term: "source shape", definition: "comments를 제거한 active source에서 annotation·arrow·method reference·anonymous construction 횟수를 세는 구조 evidence입니다.", detail: ["실행 output이 닿지 않는 선언도 확인합니다.", "formatter 차이에 견디는 token regex를 사용합니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core07-audit",
        title: "direct missing dependency와 scope/package warning0, main outputs와 lambda shapes를 함께 재현합니다",
        language: "powershell",
        filename: "verify-original-core07.ps1",
        purpose: "inventory와 closure를 혼동하지 않고 원본 class12의 compile/run/source 구조를 hostile launcher environment에서도 결정적으로 검증합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core07 audit " + [Guid]::NewGuid().ToString("N"))
$launcherNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedLauncher = @{}
$rootCreated = $false
$environmentMutationStarted = $false
$failure = $null
try {
  if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $rootCreated = $true
  foreach ($name in $launcherNames) {
    if (Test-Path "Env:$name") { $savedLauncher[$name] = (Get-Item "Env:$name").Value }
  }
  $environmentMutationStarted = $true
  foreach ($name in $launcherNames) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
  $lf = [string][char]10
  $tab = [string][char]9
  $crlf = [string][char]13 + [char]10
  $source = "src\com\java\class12"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $inventoryNames = @("Ex01_Lambda.java", "Ex02_Lambda.java", "Ex03_Main.java", "Ex05_Main.java")
  $inventory = @($inventoryNames | ForEach-Object { Join-Path $source $_ })
  $scope = @($inventory + (Join-Path $source "Ex04_Lambda.java"))
  $packageOut = Join-Path $root "package classes"
  $inventoryOut = Join-Path $root "inventory classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $packageOut, $inventoryOut, $scopeOut -ErrorAction Stop | Out-Null

  $packageCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1 | ForEach-Object ToString)
  $packageExit = $LASTEXITCODE
  $inventoryCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $inventoryOut $inventory 2>&1 | ForEach-Object ToString)
  $inventoryExit = $LASTEXITCODE
  $scopeCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $scopeOut $scope 2>&1 | ForEach-Object ToString)
  $scopeExit = $LASTEXITCODE
  $inventoryErrors = @($inventoryCompiler | Where-Object { $_ -match 'compiler\.err' })
  $missingEx04 = @($inventoryCompiler | Where-Object { $_ -match 'Ex04_Lambda' })
  $overrideErrors = @($inventoryCompiler | Where-Object { $_ -match 'method\.does\.not\.override' })
  if ($all.Count -ne 10 -or $packageExit -ne 0 -or $packageCompiler.Count -ne 0) { throw "package compile drift" }
  if ($inventory.Count -ne 4 -or $inventoryExit -ne 1 -or $inventoryErrors.Count -ne 15 -or $missingEx04.Count -ne 12 -or $overrideErrors.Count -ne 3) { throw "inventory diagnostic drift" }
  if ($scope.Count -ne 5 -or $scopeExit -ne 0 -or $scopeCompiler.Count -ne 0) { throw "scope compile drift" }
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $scopeMains = @($scope | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  if ($packageMains -ne 7 -or $scopeMains -ne 2) { throw "main role drift" }

  function Invoke-Java([string]$classes, [string]$main) {
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
  function Assert-Run($run, [string]$expected, [string]$label) {
    if ($run.Exit -ne 0 -or $run.Err.Length -ne 0 -or $run.Out -cne $expected) { throw "$label output drift" }
  }

  $ex03 = Invoke-Java $scopeOut "com.java.class12.Ex03_Main"
  $ex05 = Invoke-Java $scopeOut "com.java.class12.Ex05_Main"
  $ex06 = Invoke-Java $packageOut "com.java.class12.Ex06_Main"
  $ex07 = Invoke-Java $packageOut "com.java.class12.Ex07_StreamClass"
  $ex08 = Invoke-Java $packageOut "com.java.class12.Ex08_StreamClass"
  $ex09 = Invoke-Java $packageOut "com.java.class12.Ex09_StreamClass"
  $ex10 = Invoke-Java $packageOut "com.java.class12.Ex10_Stream"
  Assert-Run $ex03 ("20" + $lf) "Ex03"
  Assert-Run $ex05 ((@("world^^", "world@@", "Lambda님 환영", "Lambda2님 Hi") -join $lf) + $lf) "Ex05"
  Assert-Run $ex06 ((@("result = 200", "======================", "res = 200", "======================") -join $lf) + $lf) "Ex06"
  Assert-Run $ex07 ((@("홍길동님", "고길동님", "이길동님", "박길동님", "나길동님", "둘리님", "도우너님", "마이콜님", "희동이님", "공실이님") -join $lf) + $lf) "Ex07"
  Assert-Run $ex08 ((@("10", "20", "30", "40", "50", "5개", "5", "15", "OptionalDouble[3.0]") -join $lf) + $lf) "Ex08"
  Assert-Run $ex09 ("Tomas" + $tab + "Edward" + $tab + "Jack" + $tab + $lf + "Edward" + $tab + "Jack" + $tab + "Tomas" + $tab + $lf + "Tomas" + $tab + "Jack" + $tab + "Edward" + $tab + $lf) "Ex09"
  Assert-Run $ex10 ("1 2 3 4 5 1 2 3 4 5 1 2 3 " + $lf + "1 2 3 4 5 " + $lf + "2 4 2 4 2 " + $lf + "2 4 " + $lf + "1 2 3 " + $lf + "4 5 1 2 3 4 5 1 2 3 " + $lf) "Ex10"

  function Remove-JavaComments([string]$text) {
    $withoutBlocks = [regex]::Replace($text, '(?s)/\*.*?\*/', '')
    [regex]::Replace($withoutBlocks, '(?m)//.*$', '')
  }
  $source01 = Remove-JavaComments (Get-Content -Raw -LiteralPath (Join-Path $source "Ex01_Lambda.java"))
  $source02 = Remove-JavaComments (Get-Content -Raw -LiteralPath (Join-Path $source "Ex02_Lambda.java"))
  $source03 = Remove-JavaComments (Get-Content -Raw -LiteralPath (Join-Path $source "Ex03_Main.java"))
  $source05 = Remove-JavaComments (Get-Content -Raw -LiteralPath (Join-Path $source "Ex05_Main.java"))
  $functional = [regex]::Matches($source02, '@FunctionalInterface').Count
  $abstractSam = [regex]::Matches($source02, 'int\s+getMax\s*\(').Count
  $defaultMethod = [regex]::Matches($source02, 'default\s+void\s+getSum\s*\(').Count
  $staticMethod = [regex]::Matches($source02, 'static\s+void\s+getAvg\s*\(').Count
  $anonymous03 = [regex]::Matches($source03, 'new\s+Ex02_Lambda\s*\(').Count
  $arrows03 = [regex]::Matches($source03, '->').Count
  $methodRefs05 = [regex]::Matches($source05, 'System\.out::println').Count
  $anonymous05 = [regex]::Matches($source05, 'new\s+Ex04_Lambda\s*\(').Count
  $arrows05 = [regex]::Matches($source05, '->').Count
  if ([regex]::Matches($source01, '->').Count -ne 0 -or $functional -ne 1 -or $abstractSam -ne 1 -or $defaultMethod -ne 1 -or $staticMethod -ne 1 -or
      $anonymous03 -ne 1 -or $arrows03 -ne 3 -or $methodRefs05 -ne 1 -or $anonymous05 -ne 3 -or $arrows05 -ne 4) { throw "source shape drift" }

  "spacePath=$($root.Contains(' ')),package=10|exit:$packageExit|compilerLines:$($packageCompiler.Count)|mains:$packageMains"
  "inventory=4|exit:$inventoryExit|errors:$($inventoryErrors.Count)|missingEx04:$($missingEx04.Count)|override:$($overrideErrors.Count);scope=5|exit:$scopeExit|compilerLines:$($scopeCompiler.Count)|mains:$scopeMains"
  "direct=Ex03:1|value20;Ex05:4|methodRef1|anonymous3|lambda4"
  "companions=Ex06:4;Ex07:10;Ex08:9;Ex09:3;Ex10:6|shapes=Ex01:arrow0;Ex02:SAM1|default1|static1;Ex03:anonymous1|lambda3|launcherOptions:$($launcherNames.Count)"
} catch {
  $failure = $_.Exception
} finally {
  $finalErrors = [Collections.Generic.List[Exception]]::new()
  if ($environmentMutationStarted) {
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
  }
  try {
    if ($rootCreated) {
      $resolved = [IO.Path]::GetFullPath($root)
      if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
      if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
      if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
    }
  } catch { $finalErrors.Add($_.Exception) }
  if ($null -ne $failure) { $finalErrors.Insert(0, $failure) }
  if ($finalErrors.Count -eq 1) { [Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw() }
  if ($finalErrors.Count -gt 1) { throw [AggregateException]::new("audit and cleanup failures", $finalErrors.ToArray()) }
}`,
        walkthrough: [
          { lines: "1-20", explanation: "OS temp direct child와 launcher variables4 격리, package/inventory/scope paths를 준비합니다." },
          { lines: "22-45", explanation: "package10·inventory4·scope5 compile과 known errors15, main roles7|2를 검증합니다." },
          { lines: "47-80", explanation: "fresh JVM child를 UTF-8 async drain·closed stdin·10초 timeout·tree kill·5초 grace·Dispose로 실행합니다." },
          { lines: "82-105", explanation: "direct outputs1/4와 companions4/10/9/3/6을 LF-normalized exact contracts로 비교합니다." },
          { lines: "107-121", explanation: "comments 제거 뒤 SAM/default/static, anonymous/lambda/method-reference source shapes를 세고 privacy-safe stable summary를 출력합니다." },
          { lines: "122-150", explanation: "body failure를 보존하면서 launcher variables를 각각 복원·검증하고 temp child cleanup도 독립 실행한 뒤 단일 원인 또는 aggregate를 다시 던집니다." },
        ],
        run: {
          environment: ["PowerShell 7+", "OpenJDK 21", "class12 source tree", "UTF-8", "fresh JVM per main", "hostile launcher-variable regression supported"],
          command: "pwsh -NoProfile -File verify-original-core07.ps1",
        },
        output: {
          value: "spacePath=True,package=10|exit:0|compilerLines:0|mains:7\ninventory=4|exit:1|errors:15|missingEx04:12|override:3;scope=5|exit:0|compilerLines:0|mains:2\ndirect=Ex03:1|value20;Ex05:4|methodRef1|anonymous3|lambda4\ncompanions=Ex06:4;Ex07:10;Ex08:9;Ex09:3;Ex10:6|shapes=Ex01:arrow0;Ex02:SAM1|default1|static1;Ex03:anonymous1|lambda3|launcherOptions:4",
          explanation: ["inventory4 실패는 교육 원본 누락이 아니라 Ex04 dependency가 목록 밖에 있다는 재현 evidence입니다.", "package/scope positive compile은 warning0이며 seven mains를 fresh JVM으로 실행했습니다.", "요약에는 temp path나 원본 전체 stdout을 노출하지 않고 stable counts와 semantic shapes만 남깁니다."],
        },
        experiments: [
          { change: "scope에서 Ex04_Lambda를 다시 제외합니다.", prediction: "Ex05 symbols12와 override3, 총 compiler errors15로 exit1입니다.", result: "inventory와 dependency closure가 다른 이유를 compiler key로 재현합니다." },
          { change: "launcher variables4에 존재하지 않는 JVM options를 주입한 부모에서 실행합니다.", prediction: "audit/child environments가 제거하므로 output은 같습니다.", result: "사용자 shell state가 golden 결과를 오염시키지 않습니다." },
          { change: "Ex02에 두 번째 abstract method를 활성화합니다.", prediction: "@FunctionalInterface validation과 Ex03 lambda conversion이 compile 실패합니다.", result: "SAM 의도는 annotation과 target conversion 양쪽에서 보호됩니다." },
        ],
        sourceRefs: ["java-class12-ex01", "java-class12-ex02", "java-class12-ex03", "java-class12-ex04", "java-class12-ex05", "java-class12-ex06", "java-class12-ex07", "java-class12-ex08", "java-class12-ex09", "java-class12-ex10", "jdk21-javac", "dotnet-process-start-info", "powershell-environment", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "inventory 네 파일만 javac에 주면 Ex05 관련15 errors가 난다.", likelyCause: "Ex05가 inventory 밖 Ex04_Lambda를 variable·argument·return type으로 사용합니다.", checks: ["첫 cant.resolve symbol을 보고 파생 errors와 구분합니다.", "package declaration과 source root를 확인합니다.", "dependency와 runnable companion 목록을 따로 만듭니다."], fix: "Ex04를 atomic compile scope에 포함하고 scope5를 함께 versioning합니다.", prevention: "source inventory마다 direct-only compile과 dependency closure compile을 CI에서 모두 기록합니다." },
        { symptom: "로컬에서는 되는데 audit server에서 javac/java가 임의 option 때문에 실패한다.", likelyCause: "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS가 process에 상속됐습니다.", checks: ["네 launcher variables의 process 값을 존재 여부만 확인합니다.", "javac stderr 첫 줄의 picked-up option을 봅니다.", "child ProcessStartInfo.Environment 격리를 확인합니다."], fix: "audit current/child process에서 네 변수를 제거하고 종료 후 원값을 복원합니다.", prevention: "golden harness에 hostile launcher-variable regression을 넣습니다." },
      ],
      expertNotes: ["원본 코드가 짧아도 compile role·dependency·warning·fresh-JVM output·active token shape를 함께 남겨야 이후 설명이 추측이 되지 않습니다.", "Stream companions는 package health evidence일 뿐 이 세션의 학습 범위를 람다에서 Stream pipeline으로 확장하는 근거가 아닙니다."],
    },
  ],
  lab: {
    title: "명시적 계약을 가진 validation·transformation·delivery 함수 pipeline",
    scenario: "문자 입력을 normalize하고 검증한 뒤 domain command를 만들고 effectful delivery callback에 넘기는 작은 처리기를 설계합니다. target type, checked error, side effect와 callback lifecycle을 코드와 test에서 분리합니다.",
    setup: ["OpenJDK21과 UTF-8 source를 사용합니다.", "Normalizer(UnaryOperator), Validator(Predicate), Parser(checked custom SAM), Delivery(Consumer) 경계를 정의합니다.", "실제 filesystem/network 대신 deterministic fake collaborators를 준비합니다."],
    steps: ["각 SAM의 input/output/throws/side effect/lifetime을 한 줄 contract로 씁니다.", "normalizer와 predicates를 compose하고 order·short-circuit test를 만듭니다.", "checked parser adapter가 original cause를 보존하게 합니다.", "delivery registration은 explicit token/AutoCloseable로 해제합니다.", "같은 lambda identity나 generated class name을 assertion에 사용하지 않습니다.", "pure stage는 같은 입력 두 번에 같은 출력을 assert하고 effect stage call log를 따로 검증합니다.", "success·invalid·checked failure·callback throw·close-after-use cases를 warning0로 실행합니다."],
    expectedResult: ["pure transformation과 effect boundary가 다른 interfaces/variables로 보입니다.", "overload cast 없이 target type이 명확합니다.", "checked failure는 cause chain을 잃지 않습니다.", "close 뒤 callback registry size가0이고 추가 delivery가 관찰되지 않습니다.", "모든 golden output은 deterministic value/order만 사용합니다."],
    cleanup: ["registration token을 close합니다.", "test-owned executors/resources가 있다면 finally에서 종료합니다.", "OS temp direct child만 검증 후 제거합니다."],
    extensions: ["primitive specialization으로 boxing profile을 JMH에서 비교합니다.", "async delivery의 exception/timeout/cancellation policy를 CompletionStage boundary로 확장합니다.", "named strategy와 lambda strategy의 observability·configuration 차이를 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "custom SAM을 annotation·default combinator·static factory와 함께 구현합니다.", requirements: ["abstract method는 정확히 하나입니다.", "Object.equals 재선언이 count에서 제외됨을 compile합니다.", "AND short-circuit call count를 exact로 검증합니다.", "warning0와 deterministic output을 유지합니다."], hints: ["JLS9.8의 Object public method 제외 규칙을 확인합니다.", "counter는 single-thread test local로만 씁니다."], expectedOutcome: "annotation이 구조를 검증하고 default/static이 SAM count를 늘리지 않는 예제가 완성됩니다.", solutionOutline: ["Rule.test를 선언합니다.", "and와 factory를 implementation-bearing methods로 둡니다.", "second abstract method negative compile case를 별도로 둡니다."] },
    { difficulty: "응용", prompt: "checked I/O parser를 Function pipeline에 연결하되 cause와 operation context를 보존합니다.", requirements: ["ThrowingFunction descriptor에 throws를 둡니다.", "IOException만 UncheckedIOException으로 translate합니다.", "catch-all Exception이나 null fallback을 금지합니다.", "success/failure exact tests를 작성합니다."], hints: ["adapter boundary가 semantic translation을 소유합니다.", "cause type과 message를 둘 다 assert합니다."], expectedOutcome: "호출자는 Function composition을 쓰면서도 원래 checked cause를 진단할 수 있습니다.", solutionOutline: ["checked SAM을 정의합니다.", "narrow adapter를 작성합니다.", "success와 missing fixture를 실행합니다."] },
    { difficulty: "설계", prompt: "long-lived event processor를 lambda-friendly API로 설계하고 capture·identity·lifecycle·concurrency 정책을 명시합니다.", requirements: ["registration은 callback reference equality 대신 stable token을 반환합니다.", "close/unsubscribe가 idempotent합니다.", "필요한 immutable context만 capture합니다.", "callback failure isolation/fail-fast 정책을 문서화합니다.", "thread ownership 또는 synchronization을 명시합니다.", "lambda serialization을 durable job format으로 사용하지 않습니다."], hints: ["Map<Id,Consumer<Event>>와 explicit JobSpec DTO를 분리합니다.", "publish 중 registration mutation 정책을 결정합니다."], expectedOutcome: "행동 주입의 간결함을 유지하면서 memory leak·remove failure·race·재시작 호환성을 통제하는 API가 됩니다.", solutionOutline: ["Subscription handle을 AutoCloseable로 만듭니다.", "event snapshot과 callback error policy를 정의합니다.", "explicit action code+data를 persistence schema로 둡니다."] },
  ],
  reviewQuestions: [
    { question: "@FunctionalInterface가 없으면 lambda를 사용할 수 없나요?", answer: "아닙니다. 구조가 SAM이면 사용할 수 있고 annotation은 compiler 검증과 의도 문서화 역할을 합니다." },
    { question: "default/static method도 SAM count에 들어가나요?", answer: "아닙니다. 구현 의무가 있는 abstract instance method만 descriptor 계산에 관여합니다." },
    { question: "lambda expression의 자체 class type을 source에서 쓸 수 있나요?", answer: "아닙니다. lambda는 target functional interface로 변환되는 poly expression입니다." },
    { question: "왜 `var x = () -> 1`은 안 되나요?", answer: "var가 initializer type을 요구하지만 lambda는 target context 없이는 standalone type이 없기 때문입니다." },
    { question: "effectively-final reference를 capture하면 object도 immutable인가요?", answer: "아닙니다. binding 재대입만 제한되고 referent mutation·thread safety는 별도입니다." },
    { question: "lambda와 anonymous class의 this가 같나요?", answer: "아닙니다. lambda는 lexical outer this, anonymous body는 새 anonymous receiver입니다." },
    { question: "동일한 lambda body 두 개를 equals/==로 식별해도 되나요?", answer: "안 됩니다. allocation·reuse·identity는 stable contract가 아니므로 explicit key/token을 사용합니다." },
    { question: "method reference가 lambda보다 항상 빠른가요?", answer: "그런 보장은 없습니다. 의미와 readability로 선택하고 성능은 workload·JIT warmup을 포함해 측정합니다." },
    { question: "Consumer는 pure function인가요?", answer: "return이 void인 effect-oriented descriptor이므로 mutation/I/O 가능성을 계약과 이름에 명시해야 합니다." },
    { question: "checked exception을 lambda 안에서 무조건 RuntimeException으로 감싸면 되나요?", answer: "아닙니다. boundary가 translation을 소유할 때만 구체 unchecked type과 original cause를 보존합니다." },
  ],
  completionChecklist: [
    "package10·inventory4·scope5의 compile roles와 direct missing Ex04 errors15를 재현했다.",
    "package main7과 scope main2를 fresh JVM exact output으로 검증했다.",
    "launcher variables4 격리·async drain·timeout/tree kill/grace·Dispose·safe cleanup을 적용했다.",
    "SAM count에서 default/static/private/Object override-equivalent methods를 구분했다.",
    "@FunctionalInterface를 enable switch가 아닌 evolution guard로 설명했다.",
    "lambda가 target type을 요구하는 poly expression임을 assignment·argument·cast로 증명했다.",
    "same-shaped SAM overload ambiguity와 named API 대안을 설명했다.",
    "effectively-final binding과 mutable referent를 분리했다.",
    "escape한 callback의 retention graph와 unsubscribe ownership을 점검했다.",
    "anonymous receiver와 lambda lexical this를 exact false/true로 비교했다.",
    "generated class name·identity hash·serialization form을 business contract로 사용하지 않았다.",
    "모든 positive Java example을 OpenJDK21 -Xlint:all warning0와 exact output으로 검증했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class12-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex01_Lambda.java", usedFor: ["lambda explanation-only original", "arrow0 source shape", "compile-only role"], evidence: "runtime main 없이 lambda/SAM 문법을 설명하는 public class이며 comments 제거 active arrow0임을 확인했습니다." },
    { id: "java-class12-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex02_Lambda.java", usedFor: ["custom functional interface", "abstract/default/static count", "Ex03 dependency"], evidence: "@FunctionalInterface1, abstract getMax1, default getSum1, static getAvg1인 active source입니다." },
    { id: "java-class12-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex03_Main.java", usedFor: ["anonymous to lambda syntax", "target typing", "exact20 output"], evidence: "anonymous1과 lambda arrows3을 선언하며 getMax exact output20을 확인했습니다." },
    { id: "java-class12-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex04_Lambda.java", usedFor: ["Ex05 missing dependency", "void SAM", "scope5 closure"], evidence: "showString(String) 하나를 선언한 interface이며 direct4 밖 dependency로 필요합니다." },
    { id: "java-class12-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex05_Main.java", usedFor: ["method reference", "functional parameter/return", "anonymous/lambda comparison"], evidence: "method reference1·anonymous3·lambda4와 exact4행을 확인했습니다." },
    { id: "java-class12-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex06_Main.java", usedFor: ["package companion health", "switch exact4"], evidence: "package 전체 compile/run health에서 exact4행 exit0·stderr0을 확인했습니다." },
    { id: "java-class12-ex07", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex07_StreamClass.java", usedFor: ["package companion health", "stream consumer lambda"], evidence: "array/list stream consumer가 suffix 님 ten lines를 출력함을 확인했습니다." },
    { id: "java-class12-ex08", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex08_StreamClass.java", usedFor: ["package companion health", "primitive stream output"], evidence: "numeric transforms/count/sum/average exact9행을 확인했습니다." },
    { id: "java-class12-ex09", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex09_StreamClass.java", usedFor: ["package companion health", "ordered consumer outputs"], evidence: "insertion/sorted/reverse tab-terminated3행을 exact로 확인했습니다." },
    { id: "java-class12-ex10", repository: "javastudy2 classstudy", path: "src/com/java/class12/Ex10_Stream.java", usedFor: ["package companion health", "predicate lambda outputs"], evidence: "distinct/filter/limit/skip space-terminated6행을 exact로 확인했습니다." },
    { id: "jdk21-javac", repository: "Java SE 21 tools", path: "javac command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-proc:none", "-Xlint:all", "-XDrawDiagnostics"], evidence: "positive warning0 compile와 direct negative compiler-key audit의 tool contract입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected streams", "working directory"], evidence: "fresh Java child를 shell quoting 없이 구성하는 API 근거입니다." },
    { id: "powershell-environment", repository: "Microsoft PowerShell docs", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher variable audit", "process environment restore"], evidence: "네 launcher variables를 process scope에서 저장·제거·복원하는 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child environment isolation", "launcher removal"], evidence: "child-specific environment에서 launcher variables를 제거하는 근거입니다." },
    { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "wait", "Dispose"], evidence: "10초 wait, descendant kill, 5초 grace와 finally Dispose 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["async stdout drain", "async stderr drain", "deadlock avoidance"], evidence: "redirected stdout/stderr를 process wait와 병행 drain하는 근거입니다." },
    { id: "jls-functional-interface", repository: "JLS SE 21", path: "9.8 Functional Interfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.8", usedFor: ["SAM counting", "Object method exclusion", "function descriptor"], evidence: "functional interface 정의와 descriptor 계산의 primary specification입니다." },
    { id: "java-functional-interface-annotation", repository: "Java SE 21 API", path: "java.lang.FunctionalInterface", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/FunctionalInterface.html", usedFor: ["annotation validation", "intent documentation", "API evolution"], evidence: "annotation의 compiler contract와 informational purpose 근거입니다." },
    { id: "java-object-api", repository: "Java SE 21 API", path: "java.lang.Object", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["equals/hashCode/toString methods", "Object redeclaration exclusion"], evidence: "functional interface count에서 special handling되는 public Object methods 확인 근거입니다." },
    { id: "java-objects-api", repository: "Java SE 21 API", path: "java.util.Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["requireNonNull", "combinator input validation"], evidence: "default Rule combinator가 null collaborator를 즉시 거부하는 API 근거입니다." },
    { id: "jls-lambda", repository: "JLS SE 21", path: "15.27 Lambda Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27", usedFor: ["lambda syntax", "target compatibility", "parameter/return typing"], evidence: "lambda grammar·typing·body compatibility의 primary specification입니다." },
    { id: "jls-poly-expression", repository: "JLS SE 21", path: "15.2 Classification of Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.2", usedFor: ["poly expression", "standalone contrast", "target context"], evidence: "lambda를 poly expression으로 분류하는 근거입니다." },
    { id: "jls-overload-resolution", repository: "JLS SE 21", path: "15.12.2 Compile-Time Step 2", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2", usedFor: ["potential applicability", "SAM overload ambiguity", "most-specific selection"], evidence: "lambda/method-reference arguments가 포함된 overload resolution 근거입니다." },
    { id: "java-predicate-api", repository: "Java SE 21 API", path: "java.util.function.Predicate", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Predicate.html", usedFor: ["boolean-valued target", "and/or/negate", "target overload"], evidence: "test(T)와 short-circuit combinator 계약 근거입니다." },
    { id: "java-function-api", repository: "Java SE 21 API", path: "java.util.function.Function", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Function.html", usedFor: ["T to R transform", "compose", "andThen"], evidence: "generic transformation과 composition order의 API 근거입니다." },
    { id: "jls-capture", repository: "JLS SE 21", path: "6.5.6.1 Simple Expression Names", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.5.6.1", usedFor: ["final/effectively-final local capture", "capture compile diagnostic", "local lifetime"], evidence: "lambda가 enclosing local/parameter를 참조할 때 effectively-final이어야 하는 근거입니다." },
    { id: "java-supplier-api", repository: "Java SE 21 API", path: "java.util.function.Supplier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Supplier.html", usedFor: ["zero-argument value production", "escaping lambda", "stateful supplier contrast"], evidence: "get() descriptor와 result 공급 semantics 근거입니다." },
    { id: "java-int-supplier-api", repository: "Java SE 21 API", path: "java.util.function.IntSupplier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/IntSupplier.html", usedFor: ["primitive supplier", "mutable holder demonstration", "boxing avoidance"], evidence: "getAsInt primitive descriptor 근거입니다." },
    { id: "java-list-api", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["captured mutable referent", "copyOf snapshot", "ordered test data"], evidence: "List mutation과 immutable copy boundary 설명 근거입니다." },
    { id: "jls-lambda-this", repository: "JLS SE 21", path: "15.27.2 Lambda Body", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27.2", usedFor: ["lexical this", "super/name meaning", "anonymous contrast"], evidence: "lambda body가 새 this binding을 만들지 않는 primary specification입니다." },
    { id: "jls-anonymous-class", repository: "JLS SE 21", path: "15.9.5 Anonymous Class Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9.5", usedFor: ["anonymous receiver", "anonymous body members", "lambda refactor contrast"], evidence: "anonymous class body와 새 instance semantics 근거입니다." },
    { id: "jls-method-reference", repository: "JLS SE 21", path: "15.13 Method Reference Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.13", usedFor: ["static/bound/unbound/constructor forms", "target typing", "receiver mapping"], evidence: "method reference grammar와 compile-time declaration selection 근거입니다." },
    { id: "java-util-function-package", repository: "Java SE 21 API", path: "java.util.function package", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/package-summary.html", usedFor: ["built-in SAM families", "primitive specializations", "operator naming"], evidence: "general-purpose functional interfaces와 specialization family의 package-level 근거입니다." },
    { id: "java-consumer-api", repository: "Java SE 21 API", path: "java.util.function.Consumer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Consumer.html", usedFor: ["effect-oriented void target", "andThen", "callback delivery"], evidence: "accept(T)와 sequential composition semantics 근거입니다." },
    { id: "java-unchecked-ioexception-api", repository: "Java SE 21 API", path: "java.io.UncheckedIOException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/UncheckedIOException.html", usedFor: ["checked I/O translation", "cause preservation", "narrow adapter"], evidence: "IOException을 구체 unchecked wrapper로 전달하는 API 근거입니다." },
    { id: "jls-lambda-evaluation", repository: "JLS SE 21", path: "15.27.4 Run-Time Evaluation", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27.4", usedFor: ["lambda object identity non-contract", "allocation/reuse caveat", "runtime class caveat"], evidence: "lambda evaluation 시 새/existing instance와 identity-sensitive operation의 unpredictable result 근거입니다." },
    { id: "java-atomic-integer-api", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["atomic captured state", "stateful supplier", "concurrency contrast"], evidence: "atomic increment와 memory effects의 API 근거입니다." },
    { id: "java-map-api", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["explicit callback key", "registry replacement", "lifecycle lookup"], evidence: "lambda identity 대신 stable key로 behavior를 관리하는 registry 근거입니다." },
    { id: "java-auto-closeable-api", repository: "Java SE 21 API", path: "java.lang.AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["subscription lifecycle", "close ownership", "try-with-resources"], evidence: "callback registration lifetime을 lexical cleanup과 연결하는 contract 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 10,
    filesUsed: 10,
    uncoveredNotes: [
      "class12 package10 전체를 읽고 compile/run했으며 inventory direct4와 dependency closure scope5를 분리했습니다.",
      "package10은 warning0·main7, scope5는 warning0·main2이고 direct4는 Ex04 missing 파생 포함 compiler errors15입니다.",
      "Ex01 설명-only, Ex02 SAM/default/static, Ex03 anonymous/lambda, Ex05 method reference·parameter·return source shapes를 comments 제거 뒤 검증했습니다.",
      "Ex03 exact1행과 Ex05 exact4행을 direct lambda evidence로 사용했습니다.",
      "Ex06~Ex10 companions는 package health로 exact4/10/9/3/6행만 사용하고 Stream 상세는 후속 경계로 남겼습니다.",
      "launcher options4 격리, UTF-8 async drain, closed stdin, timeout/tree kill/grace, task recovery, Dispose와 safe temp cleanup을 audit에 적용했습니다.",
      "SAM·target typing·capture·lexical this는 JLS SE21과 Java SE21 APIs로 확장했습니다.",
      "공개 evidence에는 local absolute path·credential·generated identity·nondeterministic class name을 포함하지 않습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
const additionalChapters: DetailedSession["chapters"] = [
    {
      id: "sam-counting-functional-interface-contract",
      title: "SAM은 보이는 method 수가 아니라 상속·Object override를 정리한 하나의 abstract function descriptor입니다",
      lead: "@FunctionalInterface는 lambda 기능을 켜는 표지가 아니라 interface 진화가 단일 역할을 깨뜨리지 못하게 하는 compile-time 의도 검사입니다.",
      explanations: [
        "functional interface는 정확히 하나의 abstract method를 갖는 interface입니다. 그 method의 parameter types, return type와 throws가 function descriptor가 되어 lambda parameter·return compatibility를 결정합니다.",
        "default와 static methods는 구현을 요구하지 않으므로 SAM count에 포함되지 않습니다. private interface methods도 helper implementation일 뿐 abstract contract를 늘리지 않습니다. Ex02의 abstract1+default1+static1이 원본 예입니다.",
        "public Object methods와 override-equivalent인 equals·hashCode·toString 재선언은 functional method count에서 제외됩니다. 하지만 interface가 임의의 second abstract business method를 더하면 더 이상 functional interface가 아닙니다.",
        "상속한 여러 abstract declarations가 override-equivalent하고 하나의 signature로 합쳐질 수 있으면 SAM일 수 있습니다. parameter가 달라 하나의 descriptor로 합쳐지지 않거나 return types가 substitutable하지 않으면 lambda target이 될 수 없습니다.",
        "@FunctionalInterface가 없어도 구조가 SAM이면 lambda target입니다. annotation을 붙이면 compiler가 구조를 검증하고 API reader에게 lambda intended contract임을 알려 주므로 public callback/strategy interface에 권장됩니다.",
        "lambda는 interface의 default/static methods도 정상 호출할 수 있습니다. default method가 다른 Rule과 조합해 새 Rule을 반환하면 작은 algebra가 되고, static factory는 검증·normalization을 한 위치에 둘 수 있습니다.",
        "SAM을 너무 넓은 역할로 만들지 않습니다. validation, mutation, I/O, logging을 한 descriptor에 섞으면 lambda 한 줄이 숨기는 효과가 커집니다. 입력·출력·오류·부수 효과를 이름과 Javadoc으로 드러냅니다.",
        "function descriptor는 generic substitution 뒤의 타입으로 판단합니다. raw functional interface를 사용하면 parameter가 Object로 흐려지고 unchecked conversion이 생길 수 있으므로 parameterized target을 유지합니다.",
      ],
      concepts: [
        { term: "single abstract method", definition: "상속·override-equivalence·Object method 제외를 적용한 뒤 남는 하나의 구현 의무입니다.", detail: ["단순 선언 행 수와 다릅니다.", "lambda body가 구현할 descriptor를 제공합니다."] },
        { term: "function descriptor", definition: "functional interface의 parameter·return·throws를 하나의 function type처럼 표현한 compile-time signature입니다.", detail: ["lambda parameter inference의 기준입니다.", "checked exception compatibility도 포함합니다."] },
        { term: "@FunctionalInterface", definition: "interface가 functional interface requirements를 계속 만족하는지 compiler가 검증하게 하는 선언 annotation입니다.", detail: ["없어도 SAM이면 lambda를 쓸 수 있습니다.", "API evolution guard로 가치가 있습니다."] },
      ],
      codeExamples: [{
        id: "java-sam-contract",
        title: "abstract1+default+static과 Object method 재선언이 functional target임을 실행합니다",
        language: "java",
        filename: "SamContract.java",
        purpose: "SAM count 규칙과 default composition을 warning0 exact output으로 확인합니다.",
        code: String.raw`import java.util.Objects;

public class SamContract {
    @FunctionalInterface
    interface Rule {
        boolean test(String value);

        default Rule and(Rule other) {
            Objects.requireNonNull(other);
            return value -> test(value) && other.test(value);
        }

        static Rule lengthAtLeast(int minimum) {
            return value -> value.length() >= minimum;
        }
    }

    @FunctionalInterface
    interface ObjectAware {
        boolean test(String value);
        boolean equals(Object other);
    }

    public static void main(String[] args) {
        Rule nonBlank = value -> !value.isBlank();
        Rule valid = nonBlank.and(Rule.lengthAtLeast(3));
        ObjectAware startsWithA = value -> value.startsWith("A");

        System.out.println("blank=" + valid.test(" "));
        System.out.println("ab=" + valid.test("ab"));
        System.out.println("abc=" + valid.test("abc"));
        System.out.println("objectMethodIgnored=" + startsWithA.test("Alpha"));
    }
}`,
        walkthrough: [
          { lines: "1-16", explanation: "Rule은 abstract test 하나와 default combinator·static factory를 가지며 둘은 SAM count를 늘리지 않습니다." },
          { lines: "18-22", explanation: "Object.equals와 override-equivalent인 재선언은 count에서 제외되어 ObjectAware도 functional interface입니다." },
          { lines: "24-32", explanation: "두 Rule을 short-circuit AND로 조합하고 ObjectAware lambda까지 네 exact booleans로 실행합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("SamContract.java", "SamContract") },
        output: { value: "blank=false\nab=false\nabc=true\nobjectMethodIgnored=true", explanation: ["blank와 short input은 서로 다른 predicate에서 탈락하고 abc만 두 조건을 통과합니다.", "equals 재선언이 있어도 ObjectAware의 functional method는 test 하나입니다."] },
        experiments: [
          { change: "Rule에 `int weight();`를 추가합니다.", prediction: "@FunctionalInterface annotation과 모든 Rule lambda가 compile 실패합니다.", result: "second independent abstract contract가 descriptor를 하나로 만들 수 없게 합니다." },
          { change: "annotation만 제거하고 구조는 유지합니다.", prediction: "compile과 output은 같습니다.", result: "annotation은 lambda enable switch가 아니라 검증·문서화 장치입니다." },
          { change: "and의 두 번째 test가 실행되는지 counter로 관찰합니다.", prediction: "첫 Rule이 false이면 호출되지 않습니다.", result: "combinator가 Java의 && short-circuit 의미를 보존합니다." },
        ],
        sourceRefs: ["java-class12-ex02", "jls-functional-interface", "java-functional-interface-annotation", "java-object-api", "java-objects-api"],
      }],
      diagnostics: [
        { symptom: "`Unexpected @FunctionalInterface annotation` compiler error가 난다.", likelyCause: "상속 포함 independent abstract methods가 둘 이상이거나 return types가 하나로 합쳐지지 않습니다.", checks: ["직접 선언뿐 아니라 parent interfaces를 펼칩니다.", "Object public method override인지 business method인지 구분합니다.", "generic substitution 뒤 signatures를 비교합니다."], fix: "역할을 여러 SAM으로 분리하거나 하나의 request/result type으로 descriptor를 명시합니다.", prevention: "public SAM에는 annotation을 유지하고 source compatibility compile test를 둡니다." },
        { symptom: "lambda가 너무 많은 일을 해서 test와 재사용이 어렵다.", likelyCause: "하나의 abstract method라는 구조만 보고 semantic responsibility를 여러 개 섞었습니다.", checks: ["I/O·mutation·logging·retry가 한 body에 있는지 봅니다.", "parameter와 return이 효과를 충분히 표현하는지 봅니다.", "error policy가 interface 이름/Javadoc에 있는지 확인합니다."], fix: "작은 pure function과 effectful boundary를 별도 interfaces/combinators로 분리합니다.", prevention: "SAM review에 입력·출력·throws·side-effect·lifetime 다섯 항목을 기록합니다." },
      ],
      expertNotes: ["SAM은 nominal target type입니다. 같은 descriptor를 가진 서로 다른 interfaces도 서로 대입 가능하지 않으며 의미 이름·annotation·generic variance가 API 계약을 만듭니다.", "default combinator는 편리하지만 exception ordering·short circuit·null handling도 public behavior이므로 정확히 문서화합니다."],
    },
];

(session.chapters as DetailedSession["chapters"]).push(...additionalChapters);
const targetTypingChapter: DetailedSession["chapters"][number] = {
      id: "target-typing-poly-expression-overload",
      title: "lambda는 자체 타입이 없는 poly expression이라 assignment·invocation·cast context가 target을 결정합니다",
      lead: "parameter를 생략할 수 있는 이유는 동적 typing이 아니라 compiler가 먼저 선택한 functional interface descriptor에서 정적 타입을 추론하기 때문입니다.",
      explanations: [
        "lambda expression 자체에는 `Lambda`라는 standalone nominal type이 없습니다. assignment target, method argument, return context, cast와 conditional expression이 functional interface target을 제공해야 합니다.",
        "`Predicate<String> p = value -> value.length() > 2`에서 value는 String이고 return은 boolean이어야 합니다. 같은 token body라도 다른 compatible target을 만나면 별도 conversion입니다.",
        "`var predicate = value -> true`가 불가능한 이유는 var가 initializer의 standalone type을 요구하지만 lambda가 target 없이 type을 제공하지 못하기 때문입니다. 먼저 `Predicate<String>`을 써야 합니다.",
        "implicit lambda parameter에서는 모든 parameter types를 생략하고, explicit form에서는 모두 적습니다. `(String a, b) -> ...`처럼 일부만 적을 수 없습니다. annotation이나 `var`를 parameter에 쓰는 경우도 전체 form을 일관되게 맞춥니다.",
        "같은 descriptor shape를 가진 TextCheck와 Predicate<String> overload가 있으면 bare lambda는 어느 nominal target인지 정하지 못해 ambiguous일 수 있습니다. target variable로 분리하거나 명시 cast, 더 좋은 방법은 의미가 다른 method names로 설계합니다.",
        "overload resolution은 lambda body를 임의로 실행해 결정하지 않습니다. arity, explicitly typed parameters, exact/inexact method reference, return compatibility 등 compile-time 규칙으로 potentially applicable candidates를 좁힙니다.",
        "conditional expression의 두 lambda도 바깥 target을 공유할 수 있습니다. 반대로 서로 incompatible descriptors나 target 없는 조건식이면 compile되지 않습니다.",
        "cast는 ambiguity를 풀지만 의미를 숨길 수 있습니다. public call site가 반복해서 cast해야 한다면 API overload set이 lambda 친화적이지 않다는 신호로 보고 named factory나 adapter를 제공합니다.",
      ],
      concepts: [
        { term: "poly expression", definition: "자체 type 하나로 고정되지 않고 surrounding target context에 따라 type과 compatibility가 결정되는 expression입니다.", detail: ["lambda와 일부 method references가 해당합니다.", "assignment/invocation context가 필요합니다."] },
        { term: "target typing", definition: "기대되는 functional interface descriptor가 lambda parameter·return의 정적 타입을 제공하는 과정입니다.", detail: ["dynamic typing이 아닙니다.", "모든 invocation은 정적 interface method call입니다."] },
        { term: "overload ambiguity", definition: "lambda가 shape-compatible한 여러 unrelated SAM candidates 중 하나의 most-specific target을 정할 수 없는 compile-time 상태입니다.", detail: ["명시 target으로 해결할 수 있습니다.", "API naming 개선이 더 지속적일 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-target-typing",
        title: "assignment·overload cast·conditional target이 같은 lambda syntax에 type을 공급합니다",
        language: "java",
        filename: "TargetTyping.java",
        purpose: "target context가 없으면 lambda가 완성되지 않는다는 규칙과 nominal overload 선택을 실행합니다.",
        code: String.raw`import java.util.function.Function;
import java.util.function.Predicate;

@SuppressWarnings("overloads") // 의도적으로 same-shaped SAM overload를 재현하는 교육용 경계입니다.
public class TargetTyping {
    @FunctionalInterface
    interface TextCheck { boolean test(String value); }

    static String choose(TextCheck check) {
        return check.test("Alpha") ? "text" : "rejected";
    }

    static String choose(Predicate<String> check) {
        return check.test("Alpha") ? "predicate" : "rejected";
    }

    public static void main(String[] args) {
        Predicate<String> longerThanTwo = value -> value.length() > 2;
        Function<String, Integer> length = value -> value.length();
        Predicate<String> selected = args.length == 0
                ? value -> value.startsWith("A")
                : value -> value.endsWith("Z");

        System.out.println("predicate=" + longerThanTwo.test("abc"));
        System.out.println("function=" + length.apply("java"));
        System.out.println("textOverload=" + choose((TextCheck) value -> !value.isEmpty()));
        System.out.println("jdkOverload=" + choose((Predicate<String>) value -> !value.isEmpty()));
        System.out.println("conditional=" + selected.test("Alpha"));
    }
}`,
        walkthrough: [
          { lines: "1-15", explanation: "descriptor가 같은 custom TextCheck와 JDK Predicate overload를 의도적으로 만들고, 교육용 anti-pattern 한정으로 overload lint를 국소 억제해 다른 compiler warning이 섞이지 않게 합니다." },
          { lines: "17-22", explanation: "assignment와 conditional context가 parameter/return type을 공급합니다." },
          { lines: "24-28", explanation: "명시 cast로 두 unrelated targets를 각각 선택하고 same-shaped lambda가 다른 overload에 도달함을 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "no command-line arguments", "-Xlint:all warning0"], command: isolatedJavaRun("TargetTyping.java", "TargetTyping") },
        output: { value: "predicate=true\nfunction=4\ntextOverload=text\njdkOverload=predicate\nconditional=true", explanation: ["String target이 있으므로 parameter types를 생략해도 length/startsWith를 정적으로 확인합니다.", "두 casts는 같은 body를 서로 다른 nominal SAM overload로 보냅니다."] },
        experiments: [
          { change: "`var invalid = value -> true;`를 추가합니다.", prediction: "lambda expression needs an explicit target-type 진단으로 compile 실패합니다.", result: "var는 lambda target을 새로 만들어 주지 않습니다." },
          { change: "두 choose calls의 casts를 제거합니다.", prediction: "TextCheck와 Predicate<String> 사이 호출이 ambiguous합니다.", result: "descriptor shape 동일성은 unrelated nominal interfaces의 우선순위를 만들지 않습니다." },
          { change: "Function return을 boolean으로 바꿉니다.", prediction: "Function<String,Integer> descriptor와 return compatibility가 맞지 않아 compile 실패합니다.", result: "target은 parameter뿐 아니라 result expression도 검사합니다." },
        ],
        sourceRefs: ["java-class12-ex03", "jls-lambda", "jls-poly-expression", "jls-overload-resolution", "java-predicate-api", "java-function-api"],
      }],
      diagnostics: [
        { symptom: "`cannot infer type for local variable`와 lambda target-type 오류가 난다.", likelyCause: "var 또는 독립 expression 위치라 functional interface target이 없습니다.", checks: ["assignment LHS의 declared type을 확인합니다.", "return/method argument context가 실제 SAM인지 봅니다.", "intersection cast가 필요한 marker contracts인지 확인합니다."], fix: "의미 있는 parameterized functional interface type을 명시하거나 typed factory method로 감쌉니다.", prevention: "lambda 변수에는 descriptor 의미가 드러나는 target type/name을 사용합니다." },
        { symptom: "새 SAM overload를 추가한 뒤 기존 lambda 호출이 ambiguous해진다.", likelyCause: "arity와 return shape가 같은 unrelated functional interfaces가 후보가 됐습니다.", checks: ["추가 전후 overload set을 비교합니다.", "기존 corpus의 lambda·method reference·null calls를 재compile합니다.", "명시 cast가 얼마나 필요한지 셉니다."], fix: "의미가 다른 overload를 별도 이름/factory로 분리하고 migration path를 둡니다.", prevention: "public overload 추가 시 source-compatibility lambda matrix를 CI에 포함합니다." },
      ],
      expertNotes: ["lambda typing은 bidirectional합니다. context가 parameter types를 안으로 보내고 body result가 target return compatibility를 밖으로 확인하지만 runtime value로 overload를 고르지는 않습니다.", "explicit cast는 local workaround이며 API 설계상 같은-shaped SAM overload를 피하는 것이 사용자 오류 메시지와 refactoring 안정성에 유리합니다."],
};
(session.chapters as DetailedSession["chapters"]).push(targetTypingChapter);

const captureChapter: DetailedSession["chapters"][number] = {
      id: "capture-effectively-final-lifetime",
      title: "capture는 local variable 재대입을 막지만 captured object를 immutable snapshot으로 만들지는 않습니다",
      lead: "stack frame이 끝난 뒤에도 lambda가 동작할 수 있게 값 또는 reference를 보존한다는 사실과, reference가 가리키는 상태의 mutation·thread safety는 별도 문제입니다.",
      explanations: [
        "lambda가 enclosing local variable이나 parameter를 읽으면 그 변수는 final 또는 effectively final이어야 합니다. 명시 final이 없어도 초기화 뒤 다시 대입하지 않으면 effectively final입니다.",
        "제약 대상은 variable binding입니다. captured `List` reference를 다른 List로 재대입할 수 없지만 같은 List에 add하는 것은 language상 허용됩니다. 따라서 lambda observation은 later mutation을 볼 수 있습니다.",
        "primitive/local value는 lambda evaluation에 필요한 값을 보존하고, object local은 reference value를 보존합니다. ‘모든 값을 선언 시점 deep copy한다’고 설명하면 alias와 lifetime을 틀리게 이해하게 됩니다.",
        "return된 lambda는 factory method의 stack frame이 끝난 뒤에도 captured prefix/id를 사용할 수 있습니다. implementation은 필요한 state가 안전하게 살아 있도록 만들지만 generated field/class 모양은 contract가 아닙니다.",
        "effectively-final 규칙은 loop variable에도 적용됩니다. enhanced-for의 iteration variable은 iteration마다 새 변수처럼 capture할 수 있지만, 하나의 외부 index를 mutate하며 capture하려 하면 compile되지 않거나 mutable holder race를 만들게 됩니다.",
        "one-element array·mutable list·AtomicInteger를 capture하면 binding 재대입 없이 state를 바꿀 수 있습니다. 이것은 compile 우회가 아니라 의도한 state ownership이 있는지 검토해야 하는 설계 선택입니다.",
        "long-lived callback이 request/session/large graph reference를 capture하면 registration이 그 graph의 lifetime을 늘립니다. 필요한 immutable id/value만 snapshot하고 unsubscribe/close를 lifecycle에 연결합니다.",
        "concurrent execution에서는 effectively-final이 thread safety를 보장하지 않습니다. captured object의 publication, visibility, atomicity를 별도 synchronization·immutable value·concurrent primitive로 해결합니다.",
      ],
      concepts: [
        { term: "effectively final", definition: "명시 final은 아니지만 초기화 뒤 다시 대입되지 않아 final처럼 capture 가능한 local variable/parameter입니다.", detail: ["binding 규칙입니다.", "referent immutability 규칙이 아닙니다."] },
        { term: "captured reference", definition: "lambda body가 enclosing object local을 계속 접근할 수 있도록 보존하는 reference value입니다.", detail: ["referent의 later mutation을 볼 수 있습니다.", "큰 graph lifetime을 연장할 수 있습니다."] },
        { term: "escape", definition: "lambda가 method return·field·registry·thread로 전달되어 선언 scope보다 오래 살아가는 상태입니다.", detail: ["scope 종료와 object lifetime은 다릅니다.", "ownership/cleanup protocol이 필요할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-capture-lifetime",
        title: "effectively-final scalar, mutable referent와 method 밖으로 escape한 lambda를 구분합니다",
        language: "java",
        filename: "CaptureLifetime.java",
        purpose: "capture가 deep immutable snapshot이 아니라는 사실을 before/after와 escaping supplier로 실행합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.function.IntSupplier;
import java.util.function.Supplier;

public class CaptureLifetime {
    static Supplier<String> ticket(String id) {
        String prefix = "job-";
        return () -> prefix + id;
    }

    public static void main(String[] args) {
        int threshold = 3;
        List<String> state = new ArrayList<>(List.of("A"));
        Supplier<String> observation = () -> threshold + ":" + state;

        System.out.println("before=" + observation.get());
        state.add("B");
        System.out.println("after=" + observation.get());

        int[] holder = {0};
        IntSupplier next = () -> ++holder[0];
        System.out.println("counter=" + next.getAsInt() + "," + next.getAsInt());
        System.out.println("escaped=" + ticket("42").get());
    }
}`,
        walkthrough: [
          { lines: "1-10", explanation: "ticket은 effectively-final prefix/id를 capture한 Supplier를 반환해 method frame 밖에서도 동작하게 합니다." },
          { lines: "12-19", explanation: "threshold binding과 state reference를 capture하며 state referent의 add는 after observation에 보입니다." },
          { lines: "21-24", explanation: "mutable holder state는 변경 가능하지만 single-thread demo일 뿐 thread safety 근거가 아니며 escaping supplier도 실행합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "single thread", "-Xlint:all warning0"], command: isolatedJavaRun("CaptureLifetime.java", "CaptureLifetime") },
        output: { value: "before=3:[A]\nafter=3:[A, B]\ncounter=1,2\nescaped=job-42", explanation: ["threshold value는 같지만 captured List reference가 가리키는 contents는 B 추가를 반영합니다.", "returned Supplier는 ticket method 종료 뒤에도 prefix/id를 사용할 수 있습니다."] },
        experiments: [
          { change: "observation 선언 뒤 `threshold = 4;`를 추가합니다.", prediction: "captured local이 effectively final이 아니어서 compile 실패합니다.", result: "lambda 생성 전/후 위치와 무관하게 variable 전체 사용을 분석합니다." },
          { change: "state를 `List.copyOf(state)` snapshot local로 바꿔 capture합니다.", prediction: "원본 state에 B를 더해도 snapshot output은 [A]입니다.", result: "immutable snapshot이 필요하면 capture 전에 명시적으로 만들어야 합니다." },
          { change: "holder counter를 여러 threads에서 반복 증가합니다.", prediction: "plain int array는 lost update 가능성이 있어 total이 비결정적입니다.", result: "effectively-final reference와 atomic mutation은 다른 보장입니다." },
        ],
        sourceRefs: ["jls-capture", "jls-lambda", "java-supplier-api", "java-int-supplier-api", "java-list-api"],
      }],
      diagnostics: [
        { symptom: "`local variables referenced from a lambda expression must be final or effectively final`이 난다.", likelyCause: "captured binding을 어느 경로에서 다시 대입하거나 증감했습니다.", checks: ["모든 assignments와 ++/--를 검색합니다.", "loop index capture인지 봅니다.", "실제로 shared mutable state가 필요한지 질문합니다."], fix: "값 snapshot을 별도 final local로 만들거나 state owner object/atomic abstraction에 명시적으로 옮깁니다.", prevention: "lambda capture 목록과 mutation owner를 code review에서 확인합니다." },
        { symptom: "callback 제거 후에도 큰 request/session object가 회수되지 않는다.", likelyCause: "long-lived registry의 lambda가 enclosing object나 큰 graph를 capture했습니다.", checks: ["lambda body의 unqualified field 접근과 `this`를 봅니다.", "registration→callback→captured graph retention path를 추적합니다.", "unsubscribe/close가 모든 paths에서 실행되는지 확인합니다."], fix: "필요한 immutable id만 capture하고 registration token을 finally/AutoCloseable lifecycle에 묶습니다.", prevention: "long-lived callbacks에 capture budget과 ownership 문서를 요구합니다." },
      ],
      expertNotes: ["capture lowering은 JVM implementation detail입니다. synthetic field names나 generated class에 의존하지 말고 observable behavior와 retention graph로 추론합니다.", "mutable holder는 effectively-final restriction을 피하는 문법 트릭이 아니라 별도의 stateful object이므로 synchronization·reset·lifetime 책임을 함께 가져옵니다."],
};
(session.chapters as DetailedSession["chapters"]).push(captureChapter);

const lexicalThisChapter: DetailedSession["chapters"][number] = {
      id: "lambda-lexical-this-anonymous-receiver",
      title: "lambda는 새 this를 만들지 않고 anonymous class는 새 receiver를 만듭니다",
      lead: "둘 다 SAM을 구현할 수 있어도 this·super·unqualified fields·identity가 달라 anonymous→lambda 기계 변환은 의미를 바꿀 수 있습니다.",
      explanations: [
        "anonymous class expression은 새로운 unnamed class instance를 만들며 body의 plain `this`는 그 anonymous object입니다. fields/helper methods를 선언하고 superclass 또는 interface body를 가질 수 있습니다.",
        "lambda body는 새로운 this binding을 도입하지 않습니다. plain this와 super, unqualified member names는 enclosing lexical context에서와 같은 의미를 갖습니다. instance method 안 lambda의 this는 enclosing instance입니다.",
        "static context에는 enclosing this가 없으므로 lambda body에서도 this를 쓸 수 없습니다. lambda가 마치 숨은 callback object receiver를 준다고 생각하면 compile error와 ownership 혼동이 생깁니다.",
        "anonymous class와 lambda 모두 effectively-final locals를 capture할 수 있습니다. 공통 capture 능력이 receiver semantics까지 같다는 뜻은 아닙니다.",
        "anonymous body가 `this.listenerId`, `this == registered`, synchronized(this), getClass, equals/hashCode를 사용한다면 lambda 변환 전 각각의 대상이 enclosing instance로 바뀌는지 검사합니다.",
        "lambda에서는 enclosing object field를 명시적으로 `this.owner` 또는 captured local `ownerSnapshot`으로 표현할 수 있습니다. 명시 receiver는 refactor 의도를 읽기 쉽게 하지만 outer retention도 의식해야 합니다.",
        "상태·여러 methods·독립 receiver identity가 필요한 구현은 named class가 더 명확할 수 있습니다. stateless behavior와 lexical context를 작게 조합할 때 lambda가 적합합니다.",
        "logging에서 generated lambda class name이나 identity hash를 business evidence로 쓰지 않습니다. 의미 있는 operation id와 enclosing owner id를 별도 fields/context로 전달합니다.",
      ],
      concepts: [
        { term: "lexical this", definition: "lambda가 선언된 surrounding context에서 this가 가리키던 같은 enclosing instance입니다.", detail: ["lambda 전용 receiver가 없습니다.", "static context에는 없습니다."] },
        { term: "anonymous receiver", definition: "anonymous class body 안 plain this가 가리키는 새 anonymous object입니다.", detail: ["fields/helper methods를 가질 수 있습니다.", "outer는 QualifiedOuter.this로 접근합니다."] },
        { term: "receiver-sensitive refactor", definition: "this·super·unqualified member·lock·identity의 대상을 확인해야 하는 anonymous↔lambda 변경입니다.", detail: ["SAM compatibility만으로 충분하지 않습니다.", "behavioral regression test가 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-lambda-lexical-this",
        title: "같은 Task에서 anonymous false와 lambda true receiver를 exact로 비교합니다",
        language: "java",
        filename: "LambdaLexicalThis.java",
        purpose: "capture는 같지만 receiver와 field shadowing 의미가 다름을 deterministic output으로 증명합니다.",
        code: String.raw`public class LambdaLexicalThis {
    @FunctionalInterface
    interface Task { String run(); }

    private final String owner = "outer";

    void demonstrate() {
        String captured = "snapshot";
        Task anonymous = new Task() {
            private final String owner = "anonymous";

            @Override
            public String run() {
                boolean same = (Object) this == LambdaLexicalThis.this;
                return "anonymous=" + same + ":" + owner + ":" + captured;
            }
        };
        Task lambda = () -> "lambda=" + (this == LambdaLexicalThis.this)
                + ":" + owner + ":" + captured;

        System.out.println(anonymous.run());
        System.out.println(lambda.run());
    }

    public static void main(String[] args) {
        new LambdaLexicalThis().demonstrate();
    }
}`,
        walkthrough: [
          { lines: "1-8", explanation: "SAM과 outer owner, 두 implementations가 공유할 captured local을 선언합니다." },
          { lines: "9-17", explanation: "anonymous body는 자체 owner와 receiver를 가져 outer와 Object reference equality가 false입니다." },
          { lines: "18-23", explanation: "lambda this/owner는 lexical outer를 가리키며 두 implementations를 같은 enclosing instance에서 실행합니다." },
          { lines: "25-27", explanation: "main이 하나의 outer instance를 만들고 receiver 차이를 결정적으로 고정합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("LambdaLexicalThis.java", "LambdaLexicalThis") },
        output: { value: "anonymous=false:anonymous:snapshot\nlambda=true:outer:snapshot", explanation: ["anonymous `this`는 새 Task object이고 its owner field가 shadowing됩니다.", "lambda `this`와 unqualified owner는 enclosing LambdaLexicalThis instance입니다."] },
        experiments: [
          { change: "anonymous 구현을 lambda로 기계 치환하고 body의 `this`를 유지합니다.", prediction: "receiver와 owner가 outer로 바뀝니다.", result: "output equivalence가 깨져 refactor가 semantic change임을 드러냅니다." },
          { change: "lambda를 static main 안에 직접 옮기고 this를 유지합니다.", prediction: "non-static variable this cannot be referenced from a static context입니다.", result: "lambda가 숨은 this를 제공하지 않습니다." },
          { change: "captured에 재대입을 추가합니다.", prediction: "anonymous와 lambda 모두 compile 실패합니다.", result: "capture rule은 공통이지만 receiver rule은 다릅니다." },
        ],
        sourceRefs: ["java-class12-ex03", "java-class12-ex05", "jls-lambda-this", "jls-anonymous-class", "jls-capture"],
      }],
      diagnostics: [
        { symptom: "anonymous→lambda 변경 뒤 field·lock·logger owner가 달라졌다.", likelyCause: "anonymous self와 lambda lexical outer의 this를 같은 대상으로 가정했습니다.", checks: ["body의 this/super/getClass/synchronized(this)를 검색합니다.", "shadowed field와 unqualified method calls를 확인합니다.", "listener unregister가 same token/reference를 요구하는지 봅니다."], fix: "의도한 receiver를 explicit local로 capture하거나 named class를 유지합니다.", prevention: "anonymous-to-lambda checklist에 receiver·fields·identity·serialization을 포함합니다." },
        { symptom: "lambda를 static helper로 옮기자 this 참조가 compile되지 않는다.", likelyCause: "원래 instance lexical context가 제공하던 receiver가 사라졌습니다.", checks: ["lambda body가 outer fields를 읽는지 봅니다.", "helper parameter로 필요한 context를 나열합니다.", "static conversion이 lifetime을 줄이려는 목적인지 확인합니다."], fix: "필요한 immutable values/collaborator를 explicit parameters로 전달합니다.", prevention: "callback factory signature에 dependencies를 명시하고 implicit outer capture를 최소화합니다." },
      ],
      expertNotes: ["lambda가 runtime에 object로 materialize될 수 있어도 language-level this semantics는 anonymous object와 같아지지 않습니다.", "receiver가 필요한 stateful protocol은 한 줄 lambda보다 named implementation이 ownership·debugging·lifecycle을 더 잘 표현할 수 있습니다."],
};
(session.chapters as DetailedSession["chapters"]).push(lexicalThisChapter);

const methodReferenceChapter: DetailedSession["chapters"][number] = {
  id: "method-reference-receiver-parameter-mapping",
  title: "method reference는 새 기능이 아니라 target descriptor의 parameters를 기존 method receiver·arguments에 매핑합니다",
  lead: "짧다는 이유만으로 바꾸지 않고 static·bound·unbound instance·constructor 네 형태에서 어느 값이 receiver이고 언제 평가되는지 추적합니다.",
  explanations: [
    "`TypeName::staticMethod`는 target parameters를 static method arguments에 전달합니다. overload가 있으면 target descriptor가 arity/parameter/return compatibility를 제공해 compile-time declaration을 고릅니다.",
    "`expression::instanceMethod`는 bound reference입니다. expression receiver는 method reference를 평가할 때 한 번 평가되고 이후 functional invocation에는 나머지 method arguments만 들어갑니다. null bound receiver는 invocation까지 미뤄지지 않고 creation 평가에서 실패할 수 있습니다.",
    "`TypeName::instanceMethod`는 unbound reference입니다. target의 첫 parameter가 invocation receiver가 되고 나머지가 method arguments가 됩니다. `String::startsWith`를 BiPredicate<String,String>으로 보면 첫 String이 receiver, 둘째가 prefix입니다.",
    "`TypeName::new`는 constructor reference이며 target result가 새 object type과 호환되어야 합니다. zero-argument Supplier, one-argument Function, two-argument BiFunction처럼 constructor arity에 맞는 target을 선택합니다.",
    "method reference도 target type이 필요한 poly expression입니다. overloaded generic method나 inexact reference는 target/overload context가 부족하면 ambiguous할 수 있으므로 typed local로 분리해 compiler와 reader에게 descriptor를 보여 줍니다.",
    "lambda `value -> normalize(value)`와 `MethodReferenceForms::normalize`는 target-compatible하면 같은 호출 의도를 표현할 수 있지만 parameter 재배열·상수 추가·null check·logging이 필요하면 lambda가 더 명확합니다.",
    "bound reference가 mutable receiver를 붙잡으면 later receiver state를 관찰하고 lifetime을 연장합니다. 메서드 참조라고 capture/retention이 사라지는 것이 아닙니다.",
    "method reference와 lambda 사이 성능 우열은 language contract가 아닙니다. JIT·capture·escape analysis에 따라 달라질 수 있어 readability와 behavior로 선택하고 실제 hotspot만 benchmark합니다.",
  ],
  concepts: [
    { term: "bound method reference", definition: "이미 평가된 특정 receiver object에 instance method를 결합한 reference입니다.", detail: ["target parameters에는 receiver가 없습니다.", "receiver expression은 creation 때 평가됩니다."] },
    { term: "unbound method reference", definition: "instance method receiver를 target의 첫 parameter로 받는 TypeName::method 형태입니다.", detail: ["첫 argument가 receiver입니다.", "나머지는 method arguments입니다."] },
    { term: "constructor reference", definition: "functional invocation을 compatible constructor call과 새 object result로 연결하는 TypeName::new 형태입니다.", detail: ["arity가 target과 맞아야 합니다.", "array constructor reference도 별도 형태가 있습니다."] },
  ],
  codeExamples: [{
    id: "java-method-reference-forms",
    title: "static·bound·unbound·zero/one-argument constructor references를 한 target 표로 실행합니다",
    language: "java",
    filename: "MethodReferenceForms.java",
    purpose: "method reference의 receiver/argument mapping을 generated class나 identity 없이 exact values로 검증합니다.",
    code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.function.BiPredicate;
import java.util.function.Function;
import java.util.function.Supplier;

public class MethodReferenceForms {
    record Ticket(String code) { }

    static String normalize(String value) {
        return value.trim().toUpperCase();
    }

    public static void main(String[] args) {
        Function<String, String> staticReference = MethodReferenceForms::normalize;
        String prefix = "ID-";
        Function<String, String> boundReference = prefix::concat;
        BiPredicate<String, String> unboundReference = String::startsWith;
        Supplier<List<String>> listConstructor = ArrayList<String>::new;
        Function<String, Ticket> ticketConstructor = Ticket::new;

        System.out.println("static=" + staticReference.apply(" alpha "));
        System.out.println("bound=" + boundReference.apply("42"));
        System.out.println("unbound=" + unboundReference.test("lambda", "lam"));
        System.out.println("list=" + listConstructor.get());
        System.out.println("ticket=" + ticketConstructor.apply("X").code());
    }
}`,
    walkthrough: [
      { lines: "1-12", explanation: "imports, one-argument record constructor와 static normalize method를 선언합니다." },
      { lines: "14-20", explanation: "target types가 static, fixed receiver, receiver-first, zero/one-argument constructor mappings를 제공합니다." },
      { lines: "22-26", explanation: "각 mapping을 deterministic value로 호출해 receiver/argument 위치를 검증합니다." },
    ],
    run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("MethodReferenceForms.java", "MethodReferenceForms") },
    output: { value: "static=ALPHA\nbound=ID-42\nunbound=true\nlist=[]\nticket=X", explanation: ["bound prefix는 target argument42 앞에 receiver content를 붙입니다.", "unbound String::startsWith는 first target argument lambda를 receiver로 사용합니다.", "constructor targets는 빈 ArrayList와 code X Ticket을 만듭니다."] },
    experiments: [
      { change: "boundReference를 `String::concat`으로 바꾸고 Function target은 유지합니다.", prediction: "receiver+argument 두 inputs가 필요해 Function 한 parameter와 맞지 않습니다.", result: "BiFunction<String,String,String>으로 바꾸면 unbound mapping이 성립합니다." },
      { change: "null String local에서 `local::concat`을 만듭니다.", prediction: "bound receiver evaluation 중 NullPointerException입니다.", result: "null failure를 invocation 시점까지 지연하는 nullable function이 아닙니다." },
      { change: "normalize 전에 metrics와 validation을 넣습니다.", prediction: "method reference 하나로는 추가 statements를 표현할 수 없습니다.", result: "의도가 복합이면 block lambda 또는 named method를 사용합니다." },
    ],
    sourceRefs: ["java-class12-ex05", "jls-method-reference", "jls-overload-resolution", "java-function-api", "java-supplier-api", "java-list-api"],
  }],
  diagnostics: [
    { symptom: "`invalid method reference` 또는 argument lists differ 진단이 난다.", likelyCause: "bound/unbound receiver를 target parameter 수에 잘못 포함하거나 constructor arity가 맞지 않습니다.", checks: ["reference 왼쪽이 type인지 expression인지 구분합니다.", "target descriptor parameters를 receiver/arguments 열로 써 봅니다.", "selected overload return compatibility를 확인합니다."], fix: "typed local에 정확한 Function/BiFunction/Supplier target을 적고 필요하면 lambda로 parameter mapping을 명시합니다.", prevention: "method-reference review에서 target descriptor와 receiver mapping을 나란히 기록합니다." },
    { symptom: "method reference를 만들 때 예상보다 일찍 NPE나 expensive lookup이 실행된다.", likelyCause: "bound expression::method receiver expression이 creation 시점에 평가됩니다.", checks: ["왼쪽 expression의 null/side effect/cost를 봅니다.", "reference creation 횟수와 저장 lifetime을 확인합니다.", "unbound TypeName::method 대안과 비교합니다."], fix: "receiver를 사전에 validate하거나 invocation-time lambda/named factory로 timing을 명시합니다.", prevention: "bound reference에는 receiver evaluation timing과 ownership test를 둡니다." },
  ],
  expertNotes: ["exact/inexact method reference 여부는 overload applicability에 영향을 줍니다. 복잡한 overload set에서는 intermediate typed variable이 compiler diagnostics와 source stability를 개선합니다.", "method reference는 method invocation의 exception·synchronization·side-effect 계약을 그대로 가져오며 이름이 짧아진다고 효과가 pure해지지 않습니다."],
};
(session.chapters as DetailedSession["chapters"]).push(methodReferenceChapter);

const builtInFunctionsChapter: DetailedSession["chapters"][number] = {
  id: "built-in-functional-interfaces-composition-specialization",
  title: "java.util.function은 입력·출력 모양과 부수 효과를 이름으로 드러내고 combinator로 작은 함수를 조립합니다",
  lead: "custom SAM을 무조건 만들기보다 표준 Function·Predicate·Consumer·Supplier·Operator family를 사용하되 domain semantics와 checked error가 필요하면 이름 있는 interface를 선택합니다.",
  explanations: [
    "Function<T,R>은 T를 받아 R을 반환하고, Predicate<T>는 boolean test, Consumer<T>는 void accept, Supplier<T>는 인자 없이 T를 공급합니다. type shape가 같아도 의미가 다르면 변수·method 이름으로 domain role을 보충합니다.",
    "UnaryOperator<T>는 Function<T,T>, BinaryOperator<T>는 BiFunction<T,T,T> specialization이라 입력과 결과 type이 같습니다. reduce/normalization처럼 closed operation을 표현할 때 generic type repetition을 줄입니다.",
    "BiFunction·BiPredicate·BiConsumer는 두 inputs를 받습니다. 세 개 이상 parameter를 억지 custom TriFunction으로 늘리기 전에 의미 있는 immutable request record가 API evolution과 validation에 더 나은지 검토합니다.",
    "Predicate.and/or는 short-circuit이며 negate는 결과를 반전합니다. Function.compose는 before→this, andThen은 this→after 순서라 이름만 보고 뒤집지 말고 sample value로 order test를 둡니다.",
    "Consumer.andThen은 첫 accept가 정상 완료된 뒤 두 번째를 실행합니다. 첫 effect가 일부 수행 후 예외를 던지면 rollback되지 않으므로 transaction처럼 오해하지 않습니다.",
    "IntPredicate·IntFunction·ToIntFunction·IntUnaryOperator 등 primitive specializations는 boxing을 줄일 수 있습니다. API 가독성과 interoperability를 희생하며 미리 최적화하지 말고 allocation/hot path를 측정합니다.",
    "standard functional interfaces는 일반적으로 checked exception을 descriptor에 선언하지 않습니다. checked I/O/domain error가 본질이면 custom throwing SAM이나 explicit boundary adapter가 낫습니다.",
    "Function.identity나 lambdas를 business identity로 사용하지 않습니다. composition은 behavior graph를 만들 뿐 stable name, version, serialization schema를 자동 제공하지 않습니다.",
  ],
  concepts: [
    { term: "function family", definition: "argument count·return shape·same-type relation에 따라 Function/Predicate/Consumer/Supplier/Operator로 나뉜 standard SAM 집합입니다.", detail: ["shape를 빠르게 전달합니다.", "domain name이 필요하면 custom SAM도 가능합니다."] },
    { term: "composition order", definition: "작은 functions를 어느 순서로 호출하고 어느 result를 다음 input으로 넘기는지 정한 계약입니다.", detail: ["compose와 andThen 방향이 다릅니다.", "effects와 exceptions 순서도 포함합니다."] },
    { term: "primitive specialization", definition: "int/long/double input 또는 output을 primitive descriptor로 유지해 boxing을 줄이는 functional interface입니다.", detail: ["hot path에서 측정합니다.", "generic interoperability와 trade-off가 있습니다."] },
  ],
  codeExamples: [{
    id: "java-built-in-functional-interfaces",
    title: "Predicate short circuit·Function pipeline·Consumer effects·operators·primitive specialization을 실행합니다",
    language: "java",
    filename: "BuiltInFunctionalInterfaces.java",
    purpose: "표준 interface 선택과 combinator order를 하나의 deterministic behavior table로 확인합니다.",
    code: String.raw`import java.util.function.BiFunction;
import java.util.function.BinaryOperator;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.IntUnaryOperator;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.function.UnaryOperator;

public class BuiltInFunctionalInterfaces {
    public static void main(String[] args) {
        Predicate<Integer> positive = value -> value > 0;
        Predicate<Integer> even = value -> value % 2 == 0;
        Predicate<Integer> eligible = positive.and(even);

        Function<String, Integer> length = String::length;
        Function<Integer, String> label = value -> "len=" + value;
        Function<String, String> describe = length.andThen(label);

        Supplier<String> seed = () -> "seed";
        StringBuilder effects = new StringBuilder();
        Consumer<String> collect = effects::append;
        collect.andThen(value -> effects.append("|").append(value.toUpperCase())).accept("ab");

        UnaryOperator<Integer> square = value -> value * value;
        BinaryOperator<Integer> maximum = Integer::max;
        IntUnaryOperator twice = value -> value * 2;
        BiFunction<String, Integer, String> repeat = String::repeat;

        System.out.println("eligible6=" + eligible.test(6));
        System.out.println("eligible3=" + eligible.test(3));
        System.out.println("describe=" + describe.apply("java"));
        System.out.println("supplier=" + seed.get());
        System.out.println("consumer=" + effects);
        System.out.println("unary=" + square.apply(5));
        System.out.println("binary=" + maximum.apply(4, 9));
        System.out.println("primitive=" + twice.applyAsInt(6));
        System.out.println("bi=" + repeat.apply("x", 3));
    }
}`,
    walkthrough: [
      { lines: "1-9", explanation: "generic·operator·primitive standard interfaces를 명시적으로 import합니다." },
      { lines: "11-18", explanation: "positive AND even predicate와 length→label Function.andThen pipeline을 만듭니다." },
      { lines: "20-29", explanation: "Supplier, ordered Consumer effects, same-type operators, primitive specialization와 two-argument Function을 선언합니다." },
      { lines: "31-39", explanation: "각 descriptor와 composition result를 exact outputs로 비교합니다." },
    ],
    run: { environment: ["OpenJDK 21", "UTF-8", "single thread", "-Xlint:all warning0"], command: isolatedJavaRun("BuiltInFunctionalInterfaces.java", "BuiltInFunctionalInterfaces") },
    output: { value: "eligible6=true\neligible3=false\ndescribe=len=4\nsupplier=seed\nconsumer=ab|AB\nunary=25\nbinary=9\nprimitive=12\nbi=xxx", explanation: ["6만 positive/even을 모두 만족하고 Function은 length 뒤 label 순서입니다.", "Consumer.andThen은 ab append 뒤 uppercase effect를 실행합니다.", "IntUnaryOperator는 primitive12를 반환하고 unbound String::repeat가 receiver x와 count3을 매핑합니다."] },
    experiments: [
      { change: "describe를 `label.compose(length)`로 바꿉니다.", prediction: "output은 len=4로 같습니다.", result: "compose(before)는 before length를 먼저 호출하므로 같은 pipeline을 반대 표기로 만듭니다." },
      { change: "positive가 false일 때 even call counter를 확인합니다.", prediction: "Predicate.and short-circuit로 even은 호출되지 않습니다.", result: "boolean combinator가 && evaluation order를 보존합니다." },
      { change: "IntUnaryOperator를 Function<Integer,Integer>로 바꿉니다.", prediction: "semantic output은 같지만 boxing 가능성이 생깁니다.", result: "성능 차이는 JMH allocation/profile로 판단합니다." },
    ],
    sourceRefs: ["java-class12-ex02", "java-class12-ex05", "java-util-function-package", "java-predicate-api", "java-function-api", "java-consumer-api", "java-supplier-api", "jls-method-reference"],
  }],
  diagnostics: [
    { symptom: "Function composition 결과가 예상과 반대 순서이거나 type mismatch다.", likelyCause: "compose와 andThen 방향을 뒤집었거나 intermediate type이 맞지 않습니다.", checks: ["sample input의 before/after values를 손으로 씁니다.", "각 Function<T,R>의 T/R을 표로 만듭니다.", "effect/exception 실행 순서를 확인합니다."], fix: "typed intermediate functions와 order-focused unit test로 pipeline을 분해합니다.", prevention: "composition 이름만 검토하지 말고 representative value trace를 문서화합니다." },
    { symptom: "hot loop의 lambda pipeline에서 allocation/GC가 늘었다.", likelyCause: "generic Function<Integer,...> boxing이나 captured objects가 escape합니다.", checks: ["allocation profiler로 wrapper counts를 봅니다.", "primitive stream/SAM specialization을 비교합니다.", "JIT warmup과 benchmark dead-code elimination을 통제합니다."], fix: "측정된 hotspot만 primitive specialization 또는 loop로 바꾸고 behavior tests를 유지합니다.", prevention: "성능 주장은 JMH forks/warmup/allocation metrics와 함께 기록합니다." },
  ],
  expertNotes: ["standard SAM은 vocabulary를 공유하지만 도메인 invariant와 checked error가 사라질 정도로 일반화하지 않습니다. PaymentRule 같은 이름이 더 안전한 경계도 있습니다.", "combinator가 만드는 nested behavior graph의 stack trace와 observability가 부족하면 named stages 또는 explicit pipeline metadata를 사용합니다."],
};
(session.chapters as DetailedSession["chapters"]).push(builtInFunctionsChapter);

const checkedExceptionChapter: DetailedSession["chapters"][number] = {
  id: "checked-exceptions-adapters-cause-contract",
  title: "checked exception은 target descriptor의 throws와 호환되어야 하며 translation boundary가 cause와 context를 보존합니다",
  lead: "Function에 억지 try/catch를 반복하거나 null fallback으로 숨기지 않고, checked I/O가 본질인 SAM과 좁은 adapter를 설계합니다.",
  explanations: [
    "lambda body가 던질 수 있는 checked exception은 target function descriptor의 throws와 호환되어야 합니다. java.util.function.Function.apply는 checked throws를 선언하지 않으므로 IOException을 그대로 밖으로 던지는 body는 compile되지 않습니다.",
    "선택지는 checked exception을 선언하는 custom SAM, checked task 의미의 Callable, 호출 지점의 explicit try/catch, 또는 특정 boundary에서 unchecked translation하는 adapter입니다. 한 가지가 항상 정답은 아닙니다.",
    "adapter는 `Exception` 전체를 잡지 말고 의미 있는 checked type만 잡습니다. IOException은 UncheckedIOException, async stage는 CompletionException처럼 caller ecosystem이 이해하는 wrapper를 선택합니다.",
    "wrapper에는 original exception을 cause로 반드시 보존하고 operation/key 같은 안전한 context를 추가합니다. message만 복사해 새 RuntimeException을 만들면 stack/cause type과 retry 판단 근거를 잃습니다.",
    "null·empty·default value로 failure를 성공처럼 바꾸려면 domain policy가 명시되어야 합니다. 단순히 lambda signature에 맞추려고 삼키면 downstream data corruption과 진단 지연을 만듭니다.",
    "rethrow adapter의 generic sneaky-throw로 compiler checked system을 우회하지 않습니다. public contract에서 IOException 가능성이 사라져 caller와 tooling이 복구 경계를 알 수 없습니다.",
    "resource lifetime은 exception translation과 별개입니다. lambda 내부에서 file/socket을 열면 try-with-resources로 그 invocation 안에서 닫거나 resource owner를 별도 abstraction으로 전달합니다.",
    "retry는 adapter 한 줄에 숨기지 않습니다. idempotency, attempts, backoff, timeout, cancellation과 final cause를 갖는 policy component로 분리합니다.",
  ],
  concepts: [
    { term: "throws compatibility", definition: "lambda body의 checked exceptions가 target function descriptor가 허용한 throws types 안에 있어야 하는 compile-time 규칙입니다.", detail: ["unchecked exceptions는 별도입니다.", "standard Function은 checked throws가 없습니다."] },
    { term: "exception translation", definition: "한 abstraction의 failure type을 caller boundary가 이해하는 다른 type으로 바꾸되 cause와 semantic context를 보존하는 작업입니다.", detail: ["좁은 boundary가 소유합니다.", "catch-all wrapping을 피합니다."] },
    { term: "cause preservation", definition: "wrapper throwable의 cause chain에 original throwable을 연결해 type·stack·diagnostic evidence를 유지하는 원칙입니다.", detail: ["message copy만으로 부족합니다.", "retry/observability에 필요합니다."] },
  ],
  codeExamples: [{
    id: "java-checked-exception-adapter",
    title: "IOException 전용 throwing SAM을 Function으로 변환하면서 UncheckedIOException cause를 보존합니다",
    language: "java",
    filename: "CheckedExceptionAdapter.java",
    purpose: "success와 failure translation을 같은 deterministic in-memory fixture로 실행해 catch scope·wrapper·cause·context를 검증합니다.",
    code: String.raw`import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Objects;
import java.util.function.Function;

public class CheckedExceptionAdapter {
    @FunctionalInterface
    interface IoFunction<T, R> {
        R apply(T value) throws IOException;
    }

    static <T, R> Function<T, R> uncheckedIo(IoFunction<T, R> operation) {
        Objects.requireNonNull(operation);
        return value -> {
            try {
                return operation.apply(value);
            } catch (IOException exception) {
                throw new UncheckedIOException("read failed: " + value, exception);
            }
        };
    }

    static String load(String key) throws IOException {
        if (key.equals("missing")) throw new IOException("missing fixture");
        return key.toUpperCase();
    }

    public static void main(String[] args) {
        Function<String, String> loadUnchecked = uncheckedIo(CheckedExceptionAdapter::load);
        System.out.println("success=" + loadUnchecked.apply("ok"));
        try {
            loadUnchecked.apply("missing");
        } catch (UncheckedIOException exception) {
            System.out.println("wrapper=" + exception.getClass().getSimpleName());
            System.out.println("cause=" + exception.getCause().getClass().getSimpleName());
            System.out.println("message=" + exception.getMessage());
        }
    }
}`,
    walkthrough: [
      { lines: "1-10", explanation: "IOException을 descriptor에 선언한 custom IoFunction을 정의합니다." },
      { lines: "12-21", explanation: "null operation을 거부하고 IOException만 context-bearing UncheckedIOException으로 변환하며 cause를 연결합니다." },
      { lines: "23-26", explanation: "filesystem 없이 success/missing을 만드는 deterministic checked fixture입니다." },
      { lines: "28-38", explanation: "method reference를 adapter target으로 쓰고 success value와 wrapper/cause/message를 분리해 검증합니다." },
    ],
    run: { environment: ["OpenJDK 21", "UTF-8", "no filesystem access", "-Xlint:all warning0"], command: isolatedJavaRun("CheckedExceptionAdapter.java", "CheckedExceptionAdapter") },
    output: { value: "success=OK\nwrapper=UncheckedIOException\ncause=IOException\nmessage=read failed: missing", explanation: ["success path는 Function result OK를 보존합니다.", "failure path는 boundary-specific wrapper, original IOException cause와 safe operation context를 모두 유지합니다."] },
    experiments: [
      { change: "adapter 없이 `Function<String,String> bad = CheckedExceptionAdapter::load`를 선언합니다.", prediction: "load의 IOException이 Function descriptor와 호환되지 않아 compile 실패합니다.", result: "method reference도 target throws compatibility를 따릅니다." },
      { change: "catch를 Exception으로 넓히고 RuntimeException(message)만 던집니다.", prediction: "output을 흉내 낼 수 있어도 original cause/type이 사라집니다.", result: "복구·retry·root-cause 진단성이 악화됩니다." },
      { change: "missing에서 null을 반환합니다.", prediction: "downstream failure가 원래 I/O 지점에서 멀어집니다.", result: "fallback이 domain contract가 아니면 failure를 성공 값으로 바꾸지 않습니다." },
    ],
    sourceRefs: ["jls-functional-interface", "jls-lambda", "java-function-api", "java-unchecked-ioexception-api", "java-objects-api", "jls-method-reference"],
  }],
  diagnostics: [
    { symptom: "method reference/lambda에서 `incompatible thrown types IOException`이 난다.", likelyCause: "target descriptor가 checked exception을 선언하지 않습니다.", checks: ["target SAM의 abstract method throws를 확인합니다.", "callee의 declared checked types를 나열합니다.", "translation·propagation·recovery 중 누가 책임질지 정합니다."], fix: "checked custom SAM/Callable/explicit catch 또는 좁은 adapter 중 boundary semantics에 맞는 방법을 선택합니다.", prevention: "functional API 설계 표에 error channel과 checked/unchecked policy를 포함합니다." },
    { symptom: "production log에는 RuntimeException 한 줄뿐이고 root cause가 없다.", likelyCause: "lambda catch가 original exception을 cause 없이 새 wrapper/message로 바꿨습니다.", checks: ["constructor에 cause를 전달했는지 봅니다.", "catch(Exception) 범위를 찾습니다.", "operation context가 secret 없이 충분한지 확인합니다."], fix: "구체 wrapper와 original cause를 연결하고 safe identifiers를 추가합니다.", prevention: "failure tests에서 wrapper type·cause type·context·stack을 함께 assert합니다." },
  ],
  expertNotes: ["generic sneaky throw는 구현 편의로 checked contract를 지우므로 framework 내부 특수 목적이 아니라면 피합니다. 호출자의 복구 가능성을 source type에 남기는 편이 낫습니다.", "async/stream adapters는 terminal boundary가 failure를 어떻게 surface하는지까지 설계해야 하며 wrapping depth와 cancellation을 별도로 test합니다."],
};
(session.chapters as DetailedSession["chapters"]).push(checkedExceptionChapter);

const productionLambdaChapters: DetailedSession["chapters"] = [
  {
    id: "runtime-evaluation-identity-serialization",
    title: "람다의 runtime instance identity와 직렬화 형태를 계약으로 삼지 않고 행동과 명시적 식별자를 저장합니다",
    lead: "같은 source body가 같은 object인지, 어떤 synthetic class 이름을 갖는지, 다음 배포에서도 deserialize되는지는 Java 언어가 보장하는 비즈니스 계약이 아닙니다.",
    explanations: [
      "lambda expression을 평가하면 target functional interface의 instance가 만들어지지만 매번 새 instance여야 한다는 보장도, 같은 capture-free expression을 언제나 재사용해야 한다는 보장도 없습니다. 따라서 `==`, identityHashCode, runtime class name을 golden output이나 cache key로 사용하지 않습니다.",
      "두 lambda가 같은 입력에 같은 결과를 내더라도 Object.equals가 semantic equivalence를 제공하지 않습니다. 함수 동등성은 일반적으로 유한한 몇 개 입력으로 완전히 판정할 수 없으므로 domain examples·properties·명시적 strategy id를 사용합니다.",
      "callback 제거를 `listeners.remove(theSameLambdaText)`에 맡기면 새로 평가한 lambda가 등록 때 instance와 다를 수 있습니다. registration이 stable token 또는 AutoCloseable handle을 반환하게 설계합니다.",
      "lambda를 intersection cast로 Serializable target에 맞출 수 있는 경우가 있어도 captured graph, compiler implementation, synthetic method name과 배포 version에 결합됩니다. durable queue·DB·HTTP payload에는 action code와 versioned data DTO를 저장합니다.",
      "capture-free lambda도 allocation-free라는 API 약속이 아닙니다. hot path 성능은 JIT·escape analysis·target shape·call-site polymorphism을 포함한 benchmark로 판단하고 identity reuse를 전제로 최적화하지 않습니다.",
      "관찰 가능성이 필요하면 lambda 내부 class 이름 대신 `Map<ActionId, Function<...>>`처럼 사람이 읽을 수 있는 id와 metric label을 wrapper에 둡니다. id 중복과 unknown id policy도 registry contract에 포함합니다.",
      "테스트는 result, effect log, thrown cause와 lifecycle state를 검증합니다. 구현체 class name이나 `toString()`은 JVM·compiler update에 따라 달라질 수 있으므로 diagnostic 참고값으로도 공개 snapshot에 고정하지 않습니다.",
    ],
    concepts: [
      { term: "identity-sensitive operation", definition: "reference equality·identity hash·monitor처럼 object가 동일 instance인지에 의존하는 연산입니다.", detail: ["lambda에는 예측 가능한 결과가 보장되지 않습니다.", "stable domain id로 대체합니다."] },
      { term: "behavioral contract", definition: "함수의 입력·출력·예외·부수효과·호출 순서처럼 사용자가 의존할 수 있게 명시한 의미입니다.", detail: ["instance 모양과 분리합니다.", "examples와 properties로 검증합니다."] },
      { term: "durable action spec", definition: "실행 코드를 직렬화하지 않고 action type·schema version·data를 명시적으로 저장하는 재생 가능한 표현입니다.", detail: ["registry가 runtime behavior로 해석합니다.", "migration과 unknown action을 처리합니다."] },
    ],
    codeExamples: [{
      id: "java-lambda-identity-contract",
      title: "instance identity 대신 behavior assertion과 stable action key를 사용합니다",
      language: "java",
      filename: "LambdaIdentityContract.java",
      purpose: "두 supplier의 object identity를 출력하지 않고 결과를 검증하며, 실행할 행동은 insertion-ordered registry의 명시적 문자열 key로 선택합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.IntUnaryOperator;
import java.util.function.Supplier;

public class LambdaIdentityContract {
    static Supplier<Integer> seven() {
        return () -> 7;
    }

    static int run(Map<String, IntUnaryOperator> actions, String id, int value) {
        IntUnaryOperator action = actions.get(id);
        if (action == null) {
            throw new IllegalArgumentException("unknown action: " + id);
        }
        return action.applyAsInt(value);
    }

    public static void main(String[] args) {
        Supplier<Integer> first = seven();
        Supplier<Integer> second = seven();
        Map<String, IntUnaryOperator> actions = new LinkedHashMap<>();
        actions.put("increment", value -> value + 1);
        actions.put("double", value -> value * 2);

        System.out.println("behaviorEqual=" + first.get().equals(second.get()));
        System.out.println("keys=" + actions.keySet());
        System.out.println("increment=" + run(actions, "increment", 5));
        System.out.println("double=" + run(actions, "double", 5));
        System.out.println("identityUsed=false");
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "factory가 supplier를 반환하지만 동일 instance인지에 관한 가정을 코드에 넣지 않습니다." },
        { lines: "11-17", explanation: "stable action id를 lookup하고 unknown id를 즉시 의미 있는 오류로 거부합니다." },
        { lines: "19-24", explanation: "행동은 LinkedHashMap에 명시적 id와 함께 등록해 관찰·설정·테스트 경계를 만듭니다." },
        { lines: "26-30", explanation: "동일 결과와 registry behavior만 출력하고 reference equality·class name·identity hash를 고정하지 않습니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("LambdaIdentityContract.java", "LambdaIdentityContract") },
      output: { value: "behaviorEqual=true\nkeys=[increment, double]\nincrement=6\ndouble=10\nidentityUsed=false", explanation: ["두 supplier는 결과 계약만 비교합니다.", "action 선택과 출력 순서는 explicit registry contract입니다.", "identity-dependent value는 공개 output에 없습니다."] },
      experiments: [
        { change: "`first == second` 결과를 golden에 추가합니다.", prediction: "현재 JVM에서는 한 값이 보일 수 있지만 language contract가 아니어서 다른 compiler/JVM에서 달라질 수 있습니다.", result: "identity 관찰을 삭제하고 behavior/property를 검증합니다." },
        { change: "unknown id `triple`을 실행합니다.", prediction: "IllegalArgumentException에 safe id가 포함됩니다.", result: "deserialize된 durable spec의 미지원 action을 조용히 다른 행동으로 처리하지 않습니다." },
        { change: "lambda 자체를 파일에 serialize하는 대신 `{type:'double',version:1}`을 저장합니다.", prediction: "재시작 뒤 registry가 versioned spec을 다시 행동으로 해석할 수 있습니다.", result: "runtime instance 형태와 durable schema가 분리됩니다." },
      ],
      sourceRefs: ["jls-lambda-evaluation", "jls-lambda", "java-map-api", "java-supplier-api", "java-util-function-package"],
    }],
    diagnostics: [
      { symptom: "등록할 때와 같은 모양의 lambda를 remove했는데 listener가 남는다.", likelyCause: "새 lambda evaluation의 object identity를 registration key로 간주했습니다.", checks: ["등록 API가 token을 반환하는지 봅니다.", "Map key가 callback 자체인지 확인합니다.", "registry size와 retention path를 측정합니다."], fix: "등록 시 stable id/Subscription handle을 반환하고 그 handle로 idempotent 해제합니다.", prevention: "identity가 아닌 lifecycle handle contract와 close-after-use test를 둡니다." },
      { symptom: "배포 후 저장된 lambda deserialize가 실패하거나 다른 class name을 찾는다.", likelyCause: "compiler-generated serialization form을 durable data format으로 사용했습니다.", checks: ["payload에 SerializedLambda/synthetic method 정보가 있는지 봅니다.", "captured object version을 확인합니다.", "producer/consumer build가 같은지 확인합니다."], fix: "versioned action DTO와 explicit runtime registry로 migration합니다.", prevention: "장기 저장 payload schema review에서 executable object serialization을 금지합니다." },
    ],
    expertNotes: ["동일 call site에서 capture-free instance를 재사용하는 optimization이 관찰되더라도 이를 public promise로 승격하지 않습니다. JLS는 identity-sensitive 결과의 예측 가능성을 보장하지 않습니다.", "function registry는 code execution allowlist이기도 합니다. 외부 action id를 reflection class name으로 직접 실행하지 말고 명시적으로 허용된 mapping과 authorization을 둡니다."],
  },
  {
    id: "purity-effects-order-concurrency",
    title: "pure transformation과 effectful callback을 분리하고 호출 횟수·순서·동시성 정책을 계약으로 만듭니다",
    lead: "람다 문법이 짧다는 사실은 body가 순수하거나 thread-safe하다는 뜻이 아니므로, 반환값 pipeline과 외부 상태 변경 경계를 이름·타입·테스트에서 분리합니다.",
    explanations: [
      "Function·UnaryOperator는 값을 반환할 수 있지만 자동으로 pure하지 않습니다. body가 clock, random, database, mutable field를 읽거나 쓰면 같은 입력의 결과와 effect가 달라질 수 있습니다.",
      "Consumer는 void descriptor라 delivery·logging·mutation 같은 effect에 자주 쓰입니다. `andThen`은 앞 Consumer가 정상 완료한 뒤에만 뒤 Consumer를 호출하며 앞에서 예외가 나면 뒤 effect는 실행되지 않습니다.",
      "Predicate.and/or는 short-circuit합니다. 뒤 predicate가 validation message 기록이나 counter 증가를 맡으면 앞 결과에 따라 effect가 생략되므로 validation 전체 수집 요구와 boolean short-circuit 요구를 혼동하지 않습니다.",
      "captured ArrayList나 int[]를 mutable holder로 쓰는 것은 effectively-final 검사를 통과하지만 concurrent safety를 주지 않습니다. shared counter 하나라면 AtomicInteger가 atomic update를 제공하지만 여러 field invariant에는 lock·immutable aggregate·transaction이 필요합니다.",
      "parallel stream/executor가 callback을 동시에 부르면 encounter order, thread name과 timing은 달라질 수 있습니다. exact golden에는 final associative result만 넣고 ordered delivery가 필요하면 serial executor나 sequence protocol을 선택합니다.",
      "retry가 effectful lambda를 다시 호출할 수 있으면 email·결제·DB insert가 중복될 수 있습니다. idempotency key와 at-least-once/at-most-once semantics를 callback boundary에 기록합니다.",
      "관찰을 위해 lambda 내부에 무제한 println을 넣으면 실행 순서·성능·테스트가 바뀝니다. wrapper/decorator가 stable operation id, duration, result/failure를 구조화해 기록하고 secret input은 redaction합니다.",
    ],
    concepts: [
      { term: "referential transparency", definition: "expression을 그 결과값으로 바꿔도 program 의미가 변하지 않는 성질입니다.", detail: ["pure function reasoning의 핵심입니다.", "외부 effect와 nondeterminism이 깨뜨릴 수 있습니다."] },
      { term: "short-circuit effect", definition: "앞 조건 결과 때문에 뒤 lambda가 호출되지 않아 그 안의 부수효과도 발생하지 않는 현상입니다.", detail: ["Predicate composition에서 중요합니다.", "전체 오류 수집과 다릅니다."] },
      { term: "idempotency", definition: "같은 operation을 여러 번 시도해도 추가적인 의미 효과가 생기지 않게 하는 계약입니다.", detail: ["retry 가능한 callback에 필요합니다.", "stable request key와 저장소가 필요할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-lambda-effect-boundary",
      title: "pure result, ordered sequential effect와 atomic parallel aggregate를 서로 다른 관찰값으로 검증합니다",
      language: "java",
      filename: "LambdaEffectBoundary.java",
      purpose: "같은 lambda syntax 안에서도 pure normalization, Consumer effect log와 concurrent atomic update의 계약이 다름을 실행합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.IntStream;

public class LambdaEffectBoundary {
    public static void main(String[] args) {
        Function<String, String> normalize = value -> value.trim().toUpperCase();
        Predicate<String> valid = value -> value.length() >= 3;
        String first = normalize.apply("  alpha ");
        String second = normalize.apply("  alpha ");

        List<String> effects = new ArrayList<>();
        Consumer<String> send = value -> effects.add("send:" + value);
        Consumer<String> audit = value -> effects.add("audit:" + value);
        send.andThen(audit).accept(first);

        AtomicInteger counter = new AtomicInteger();
        IntStream.range(0, 1_000).parallel().forEach(value -> counter.incrementAndGet());

        System.out.println("pureRepeat=" + first.equals(second));
        System.out.println("valid=" + valid.test(first));
        System.out.println("effects=" + effects);
        System.out.println("atomicTotal=" + counter.get());
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "값 함수·boolean 함수·effect 함수와 concurrent counter에 필요한 types를 분리해 import합니다." },
        { lines: "10-14", explanation: "normalization은 동일 입력 두 번의 동일 결과로 최소 pure property를 관찰합니다." },
        { lines: "16-19", explanation: "두 Consumers의 sequential andThen order를 deterministic list에 기록합니다." },
        { lines: "21-22", explanation: "parallel callback은 ordering을 출력하지 않고 atomic final total만 계약으로 둡니다." },
        { lines: "24-27", explanation: "result·validation·effect order·concurrent aggregate를 서로 다른 assertions로 노출합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "common pool size independent", "-Xlint:all warning0"], command: isolatedJavaRun("LambdaEffectBoundary.java", "LambdaEffectBoundary") },
      output: { value: "pureRepeat=true\nvalid=true\neffects=[send:ALPHA, audit:ALPHA]\natomicTotal=1000", explanation: ["pure stage는 같은 result를 냅니다.", "sequential Consumer order는 명시적으로 보존됩니다.", "parallel worker 순서 대신 atomic aggregate만 고정합니다."] },
      experiments: [
        { change: "AtomicInteger를 `int[] counter={0}`와 `counter[0]++`로 바꿉니다.", prediction: "effectively-final compile은 되지만 parallel lost update로 total이1000보다 작을 수 있습니다.", result: "capture 가능성과 atomicity는 별도 계약입니다." },
        { change: "send가 예외를 던지게 합니다.", prediction: "andThen의 audit는 실행되지 않습니다.", result: "effect chain의 failure ordering을 문서화하고 필요한 보상은 별도 workflow로 설계합니다." },
        { change: "parallel forEach에서 각 value를 output에 추가합니다.", prediction: "순서가 실행마다 달라지거나 비동기 안전하지 않은 collection이 손상될 수 있습니다.", result: "ordered requirement와 concurrent collector를 먼저 선택합니다." },
      ],
      sourceRefs: ["java-function-api", "java-predicate-api", "java-consumer-api", "java-atomic-integer-api", "jls-capture", "java-list-api"],
    }],
    diagnostics: [
      { symptom: "parallel callback 횟수가 input보다 작거나 shared list가 손상된다.", likelyCause: "captured mutable state에 non-atomic update를 수행했습니다.", checks: ["callback 동시 실행 가능성을 확인합니다.", "read-modify-write sequence를 찾습니다.", "collection의 thread-safety와 ordering 요구를 구분합니다."], fix: "pure reduction/concurrent collector/atomic primitive/lock 중 invariant에 맞는 방식을 선택합니다.", prevention: "parallelism1·다중 worker·반복 stress와 race-aware review를 둡니다." },
      { symptom: "validation message가 어떤 입력에서는 기록되지 않는다.", likelyCause: "Predicate.and/or short-circuit 뒤쪽에 message effect를 넣었습니다.", checks: ["첫 predicate 결과를 확인합니다.", "모든 검사를 실행해야 하는지 묻습니다.", "boolean 판정과 diagnostics 수집을 분리합니다."], fix: "validation result list를 수집하는 별도 구조를 쓰거나 short-circuit 의미를 명시합니다.", prevention: "first-failure와 collect-all 정책을 API 이름과 tests로 구분합니다." },
    ],
    expertNotes: ["AtomicInteger 하나는 해당 숫자의 atomicity만 제공합니다. counter와 lastUpdated처럼 두 값의 invariant는 immutable record를 AtomicReference로 교체하거나 lock/transaction으로 묶습니다.", "함수형 style의 가치는 lambda 수가 아니라 state transition과 effect boundary를 국소화해 reasoning 가능한 데 있습니다. 무리한 one-liner보다 named stages와 error channel이 낫습니다."],
  },
  {
    id: "callback-registration-lifecycle-retention",
    title: "장수 callback은 stable subscription handle과 idempotent close로 등록·해제·retention을 소유합니다",
    lead: "lambda가 registry에 들어가는 순간 단순 expression이 아니라 capture graph의 lifetime과 재진입·실패·동시 수정 정책을 가진 resource가 됩니다.",
    explanations: [
      "event bus·GUI listener·scheduler에 등록된 callback은 registry가 참조하는 동안 살아 있습니다. callback이 outer service/request/large cache를 capture하면 그 전체 object graph가 예상보다 오래 retained될 수 있습니다.",
      "subscribe는 void보다 Subscription/AutoCloseable handle을 반환하는 편이 ownership을 명확히 합니다. 등록한 scope가 try-with-resources 또는 lifecycle hook에서 close하고 close는 여러 번 호출해도 같은 상태가 되게 만듭니다.",
      "unsubscribe는 callback equals에 기대지 않고 내부 stable numeric/UUID key를 사용합니다. key 생성·중복·wraparound·권한 정책은 registry 내부 책임입니다.",
      "publish 중 listener가 자신이나 다른 listener를 해제할 수 있습니다. live Map을 바로 순회하면 ConcurrentModificationException이나 누락이 생길 수 있으므로 snapshot semantics, copy-on-write 또는 lock 정책을 선택합니다.",
      "callback 하나의 예외가 다음 listener를 막을지, 격리해 aggregate할지, retry할지는 명시해야 합니다. 이 예제는 정상 callback과 snapshot 순서만 다루며 production API는 failure report를 별도 결과로 반환해야 합니다.",
      "동시 subscribe/publish/close가 가능하면 plain LinkedHashMap은 충분하지 않습니다. 단일 event-loop ownership, synchronized critical section, concurrent structure+snapshot 중 하나를 정하고 memory visibility까지 검증합니다.",
      "retention test는 registry size0만 보지 않고 weak-reference/heap path 또는 component close 뒤 callback 미호출을 확인합니다. 테스트 자체의 local strong reference가 GC 검증을 방해하지 않게 scope를 분리합니다.",
    ],
    concepts: [
      { term: "subscription handle", definition: "특정 callback 등록을 가리키며 명시적으로 해제할 수 있는 stable resource token입니다.", detail: ["callback identity를 숨깁니다.", "AutoCloseable로 lexical ownership을 표현할 수 있습니다."] },
      { term: "snapshot publication", definition: "publish 시작 시점의 listener 목록 복사본을 대상으로 한 번씩 호출하는 의미입니다.", detail: ["순회 중 mutation을 격리합니다.", "다음 publish부터 변경이 보입니다."] },
      { term: "retention graph", definition: "registry→lambda→captured reference로 이어져 garbage collection을 막는 object reference 경로입니다.", detail: ["작은 lambda도 큰 graph를 붙잡을 수 있습니다.", "close가 lifecycle을 끊습니다."] },
    ],
    codeExamples: [{
      id: "java-callback-lifecycle",
      title: "snapshot publish와 idempotent AutoCloseable subscription을 구현합니다",
      language: "java",
      filename: "CallbackLifecycle.java",
      purpose: "callback instance 대신 numeric registration id로 해제하고 try-with-resources가 registry size와 후속 delivery를 정확히 줄이는지 검증합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;

public class CallbackLifecycle {
    static final class Registry {
        private final Map<Long, Consumer<String>> listeners = new LinkedHashMap<>();
        private long nextId;

        Subscription subscribe(Consumer<String> listener) {
            long id = ++nextId;
            listeners.put(id, Objects.requireNonNull(listener));
            return new Subscription(this, id);
        }

        void publish(String event) {
            List.copyOf(listeners.values()).forEach(listener -> listener.accept(event));
        }

        void remove(long id) { listeners.remove(id); }
        int size() { return listeners.size(); }
    }

    static final class Subscription implements AutoCloseable {
        private final Registry owner;
        private final long id;
        private boolean closed;

        Subscription(Registry owner, long id) {
            this.owner = owner;
            this.id = id;
        }

        @Override
        public void close() {
            if (!closed) {
                owner.remove(id);
                closed = true;
            }
        }
    }

    public static void main(String[] args) {
        Registry registry = new Registry();
        List<String> log = new ArrayList<>();
        Subscription first = registry.subscribe(event -> log.add("A:" + event));
        try (Subscription second = registry.subscribe(event -> log.add("B:" + event))) {
            if (second.closed) { throw new AssertionError("new subscription closed"); }
            registry.publish("one");
            first.close();
            first.close();
            registry.publish("two");
            System.out.println("insideSize=" + registry.size());
        }
        registry.publish("three");
        System.out.println("log=" + log);
        System.out.println("finalSize=" + registry.size());
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "ordered registry, snapshot list, null validation과 callback type을 준비합니다." },
        { lines: "9-25", explanation: "subscribe가 stable id handle을 반환하고 publish는 시작 시점 values snapshot을 순회합니다." },
        { lines: "27-44", explanation: "Subscription은 owner/id를 보존하고 close guard로 제거를 idempotent하게 만듭니다." },
        { lines: "46-55", explanation: "A/B 등록 후 A를 두 번 close해도 B만 남으며 try 종료가 B도 해제합니다." },
        { lines: "57-59", explanation: "close 뒤 publish가 log를 바꾸지 않고 final registry size0임을 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "single-thread ownership", "-Xlint:all warning0"], command: isolatedJavaRun("CallbackLifecycle.java", "CallbackLifecycle") },
      output: { value: "insideSize=1\nlog=[A:one, B:one, B:two]\nfinalSize=0", explanation: ["첫 publish snapshot에는 A와 B가 insertion order로 있습니다.", "A의 두 번째 close는 무효 operation입니다.", "try 종료 뒤 listener가 없어 three event는 기록되지 않습니다."] },
      experiments: [
        { change: "publish가 live `listeners.values()`를 순회하고 A callback이 A를 close하게 합니다.", prediction: "plain map에서는 ConcurrentModificationException 또는 불명확한 traversal이 생길 수 있습니다.", result: "snapshot/mutation 정책을 API contract로 둡니다." },
        { change: "Subscription을 반환하지 않고 remove가 Consumer를 받게 합니다.", prediction: "동일 lambda source를 다시 평가해 넘겨도 등록 instance를 찾지 못할 수 있습니다.", result: "stable handle이 identity 문제와 내부 key를 캡슐화합니다." },
        { change: "B callback이 예외를 던지게 하고 C를 추가합니다.", prediction: "현재 forEach는 C 호출 전에 중단됩니다.", result: "production registry는 fail-fast와 isolate/aggregate 중 하나를 명시하고 test해야 합니다." },
      ],
      sourceRefs: ["java-map-api", "java-auto-closeable-api", "java-consumer-api", "java-list-api", "java-objects-api", "jls-lambda-evaluation"],
    }],
    diagnostics: [
      { symptom: "화면/요청 종료 뒤에도 callback이 실행되고 memory가 줄지 않는다.", likelyCause: "장수 registry가 outer object를 capture한 lambda를 계속 보유합니다.", checks: ["subscription close 호출을 추적합니다.", "heap retention path를 registry부터 봅니다.", "callback capture 목록을 작은 immutable ids와 비교합니다."], fix: "owner lifecycle에서 handle을 idempotent close하고 필요한 값만 capture합니다.", prevention: "component close test에 registry size0·post-close no-delivery·retention probe를 포함합니다." },
      { symptom: "publish 도중 등록/해제에서 ConcurrentModificationException이 난다.", likelyCause: "live non-concurrent Map view를 callback reentrancy 중 수정했습니다.", checks: ["listener가 subscribe/close하는지 봅니다.", "snapshot 여부를 확인합니다.", "multi-thread와 reentrant same-thread를 구분합니다."], fix: "snapshot publication, event-loop serialization 또는 명시적 synchronization을 적용합니다.", prevention: "self-unsubscribe·other-unsubscribe·subscribe-during-publish cases를 계약별로 테스트합니다." },
    ],
    expertNotes: ["snapshot copy는 O(n) allocation을 치르지만 의미가 단순합니다. listener 수·mutation/read 비율이 큰 시스템은 copy-on-write나 immutable persistent structure를 측정해 선택합니다.", "AutoCloseable.close의 일반 interface는 idempotency를 강제하지 않지만 이 Subscription contract에서는 명시적으로 idempotent하게 구현하고 concurrent close가 필요하면 atomic state로 확장합니다."],
  },
  {
    id: "lambda-contract-verification-matrix",
    title: "positive execution·negative compilation·property·failure·lifecycle 검증을 분리해 lambda refactor의 의미를 증명합니다",
    lead: "출력 한 번이 같다는 확인을 넘어 target typing과 capture처럼 compile-time인 규칙, short-circuit·cause·effect처럼 runtime인 규칙을 각자 맞는 oracle로 검증합니다.",
    explanations: [
      "positive fixture는 warning0 compile, fresh JVM exit0·stderr0·exact stable stdout을 요구합니다. target type, composition order, method reference와 checked adapter의 정상 행동을 작은 독립 assertions로 나눕니다.",
      "negative compile fixture는 second abstract method, target 없는 `var` lambda, mutated local capture, same-shaped overload ambiguity를 각각 한 파일/한 원인으로 둡니다. compiler의 locale-dependent 전체 문장 대신 `-XDrawDiagnostics` key·source line·nonzero exit를 확인합니다.",
      "short-circuit는 최종 boolean뿐 아니라 뒤 predicate call count0을 검증해야 합니다. 잘못된 eager implementation도 결과 false만 보면 통과할 수 있기 때문입니다.",
      "composition은 non-commutative functions로 order를 드러냅니다. trim 뒤 length처럼 우연히 같은 값보다 add1 뒤 double과 double 뒤 add1처럼 결과가 달라지는 fixture가 강한 oracle입니다.",
      "checked adapter failure test는 wrapper type, original cause type, safe context를 함께 검사합니다. message 전체가 플랫폼 path를 포함하면 stable semantic fragment와 cause tree로 분리합니다.",
      "capture/lifecycle/concurrency는 boundary matrix가 필요합니다. immutable scalar, mutable referent, escape after factory return, close twice, post-close no call, single/multi worker를 따로 검증합니다.",
      "property-based test는 predicate laws나 composition identity를 많은 generated inputs로 넓힐 수 있지만 function에 side effect가 있으면 generator shrinking 중 호출 횟수도 달라집니다. pure core를 먼저 분리합니다.",
      "mutation testing으로 negate 누락, and/or 교환, adapter cause 제거, close guard 제거를 주입해 test가 실패하는지 봅니다. coverage line 수보다 semantic fault detection을 확인합니다.",
    ],
    concepts: [
      { term: "negative compile fixture", definition: "의도적으로 잘못된 source가 특정 language rule 때문에 compile되지 않음을 검증하는 독립 test입니다.", detail: ["runtime test로 대체할 수 없습니다.", "diagnostic key와 위치를 사용합니다."] },
      { term: "independent oracle", definition: "검증 대상과 같은 helper 구현을 재사용하지 않고 별도 규칙으로 expected를 계산하는 기준입니다.", detail: ["동일 버그 동시 복제를 막습니다.", "작은 loop/table이 유용합니다."] },
      { term: "mutation adequacy", definition: "의미를 바꾸는 작은 코드 변형을 test suite가 실제로 탐지하는 정도입니다.", detail: ["short-circuit·order·cause·close guard에 적합합니다.", "surviving mutant가 누락 oracle을 드러냅니다."] },
    ],
    codeExamples: [{
      id: "java-lambda-verification-matrix",
      title: "target·short-circuit·composition·capture·method reference·primitive·checked cause를 여덟 assertions로 검증합니다",
      language: "java",
      filename: "LambdaVerificationMatrix.java",
      purpose: "서로 다른 lambda 계약을 하나의 값 비교로 뭉개지 않고 독립 checks로 실행하며 negative fixtures 수를 별도 표식으로 남깁니다.",
      code: String.raw`import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.function.IntUnaryOperator;
import java.util.function.Predicate;

public class LambdaVerificationMatrix {
    @FunctionalInterface
    interface CheckedParser { int parse(String value) throws IOException; }

    static Function<String, Integer> unchecked(CheckedParser parser) {
        return value -> {
            try {
                return parser.parse(value);
            } catch (IOException exception) {
                throw new UncheckedIOException("parse failed", exception);
            }
        };
    }

    static int check(boolean condition, String label) {
        if (!condition) { throw new AssertionError(label); }
        return 1;
    }

    public static void main(String[] args) {
        int checks = 0;
        Predicate<String> target = value -> value.startsWith("A");
        checks += check(target.test("Alpha"), "target typing");

        AtomicInteger secondCalls = new AtomicInteger();
        Predicate<String> shortCircuit = ((Predicate<String>) value -> false)
                .and(value -> { secondCalls.incrementAndGet(); return true; });
        checks += check(!shortCircuit.test("x"), "and result");
        checks += check(secondCalls.get() == 0, "short circuit count");

        Function<Integer, Integer> addOne = value -> value + 1;
        Function<Integer, Integer> doubleValue = value -> value * 2;
        checks += check(addOne.andThen(doubleValue).apply(3) == 8, "composition order");
        int base = 4;
        IntUnaryOperator plusBase = value -> value + base;
        checks += check(plusBase.applyAsInt(3) == 7, "capture");
        Function<String, String> trim = String::trim;
        checks += check(trim.apply(" ok ").equals("ok"), "method reference");
        checks += check(((IntUnaryOperator) value -> value * value).applyAsInt(5) == 25, "primitive target");

        Function<String, Integer> parser = unchecked(value -> {
            if (value.equals("bad")) { throw new IOException("fixture"); }
            return Integer.parseInt(value);
        });
        checks += check(parser.apply("21") == 21, "checked success");
        try {
            parser.apply("bad");
            throw new AssertionError("missing failure");
        } catch (UncheckedIOException exception) {
            checks += check(exception.getCause() instanceof IOException, "cause");
        }

        System.out.println("checks=" + checks);
        System.out.println("negativeFixtures=4");
        System.out.println("golden=stable");
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "checked SAM과 target/composition/concurrency 관련 standard types를 선언합니다." },
        { lines: "12-20", explanation: "IOException만 UncheckedIOException으로 변환해 original cause를 보존합니다." },
        { lines: "22-25", explanation: "각 semantic assertion이 실패 label을 가진 독립 oracle이 되게 합니다." },
        { lines: "27-36", explanation: "target typing과 Predicate.and의 result·두 번째 호출 수를 따로 검증합니다." },
        { lines: "38-46", explanation: "비가환 composition, effectively-final capture, method reference와 primitive specialization을 확인합니다." },
        { lines: "48-61", explanation: "checked success와 failure cause를 분리해 adapter가 원인 정보를 보존하는지 검사합니다." },
        { lines: "60-64", explanation: "positive checks 수와 별도로 관리할 negative compile fixtures 수, stable golden 정책을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0", "separate negative compile fixtures documented"], command: isolatedJavaRun("LambdaVerificationMatrix.java", "LambdaVerificationMatrix") },
      output: { value: "checks=9\nnegativeFixtures=4\ngolden=stable", explanation: ["result와 call count를 분리해 총9개 positive assertions가 통과합니다.", "compile-time failures 네 종류는 positive source에 섞지 않습니다.", "nondeterministic identity/class/thread 값은 golden에서 제외합니다."] },
      experiments: [
        { change: "Predicate.and를 두 predicates를 항상 호출하는 custom helper로 바꿉니다.", prediction: "boolean result는 false여도 short circuit count assertion이 실패합니다.", result: "결과만 보던 약한 test가 놓칠 semantic regression을 잡습니다." },
        { change: "adapter가 cause 없이 `new RuntimeException()`을 던지게 합니다.", prediction: "cause assertion이 실패합니다.", result: "failure tree 보존이 executable contract가 됩니다." },
        { change: "negative fixtures 네 개를 한 source에 합칩니다.", prediction: "cascade diagnostics 때문에 root rule과 count가 흔들립니다.", result: "한 fixture 한 compile rule로 isolation합니다." },
      ],
      sourceRefs: ["jdk21-javac", "jls-functional-interface", "jls-lambda", "jls-overload-resolution", "jls-capture", "jls-method-reference", "java-predicate-api", "java-function-api", "java-int-supplier-api", "java-unchecked-ioexception-api", "java-atomic-integer-api"],
    }],
    diagnostics: [
      { symptom: "lambda refactor tests가 통과했는데 production에서 호출 순서가 달라졌다.", likelyCause: "최종 값만 assert하고 short-circuit·composition·effect log를 검증하지 않았습니다.", checks: ["비가환 fixture인지 봅니다.", "각 collaborator call count/order를 확인합니다.", "oracle이 production helper를 재사용하는지 봅니다."], fix: "semantic boundary별 independent oracle과 call log를 추가합니다.", prevention: "mutation test로 and/or·compose order·effect invocation 변형을 주입합니다." },
      { symptom: "negative compile test가 JDK locale/update마다 깨진다.", likelyCause: "사람용 전체 compiler message와 전체 error count를 golden으로 고정했습니다.", checks: ["-XDrawDiagnostics 사용을 확인합니다.", "fixture에 원인이 하나인지 봅니다.", "diagnostic key와 source span을 비교합니다."], fix: "한 원인 fixture와 stable key/location/nonzero exit assertion으로 좁힙니다.", prevention: "지원 JDK matrix에서 diagnostic contract를 정기 검증합니다." },
    ],
    expertNotes: ["compile-testing library를 쓰더라도 결국 javac option, file manager, locale, processor isolation을 명시해야 합니다. annotation processor가 끼지 않게 `-proc:none`을 기본으로 둡니다.", "property와 mutation tests는 deterministic unit examples를 대체하지 않습니다. 작은 golden이 설명 가능한 기준을 주고 generated cases가 input space를 넓힙니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...productionLambdaChapters);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "같은 capture-free lambda를 두 번 평가하면 반드시 같은 instance인가요?", answer: "아닙니다. 새 instance 또는 기존 instance 재사용 모두 가능하므로 identity를 계약으로 삼지 않습니다." },
  { question: "lambda의 runtime class name을 로그 correlation id로 써도 되나요?", answer: "안 됩니다. synthetic class 이름과 모양은 compiler/JVM 구현 세부이며 stable domain id를 별도로 둡니다." },
  { question: "두 lambda의 출력이 몇 개 입력에서 같으면 equals하다고 볼 수 있나요?", answer: "일반적인 함수 동등성을 유한 표본으로 증명할 수 없으므로 domain properties와 명시적 strategy identity를 씁니다." },
  { question: "lambda를 Serializable target으로 만들 수 있으면 DB에 장기 저장해도 되나요?", answer: "권장하지 않습니다. compiler와 capture graph에 결합되므로 versioned action DTO를 저장합니다." },
  { question: "callback 제거에 callback object 자체를 key로 쓰면 어떤 문제가 있나요?", answer: "다시 평가한 lambda가 다른 instance일 수 있어 제거가 실패하므로 stable subscription token을 사용합니다." },
  { question: "Function을 사용하면 함수가 자동으로 pure해지나요?", answer: "아닙니다. body가 외부 상태를 읽고 쓰면 effectful이며 타입만으로 순수성이 보장되지 않습니다." },
  { question: "Consumer.andThen에서 첫 Consumer가 예외를 던지면 뒤 Consumer는 실행되나요?", answer: "아닙니다. 첫 accept가 정상 완료한 뒤에만 뒤 accept가 호출됩니다." },
  { question: "Predicate.and 뒤 predicate에 validation message 기록을 넣어도 항상 실행되나요?", answer: "아닙니다. 앞 predicate가 false이면 short-circuit되어 뒤 effect가 생략됩니다." },
  { question: "effectively-final ArrayList capture는 thread-safe한가요?", answer: "아닙니다. binding 규칙일 뿐 referent의 동시성 안전성을 제공하지 않습니다." },
  { question: "AtomicInteger를 쓰면 여러 field의 invariant도 atomic해지나요?", answer: "아닙니다. 해당 원자 연산만 보장하므로 복합 상태는 lock·immutable aggregate·transaction이 필요합니다." },
  { question: "parallel callback의 thread name과 순서를 golden에 넣어도 되나요?", answer: "보장된 order가 없다면 넣지 않고 associative final result나 명시적 ordered protocol을 검증합니다." },
  { question: "retry 가능한 effect lambda에는 무엇이 필요한가요?", answer: "delivery semantics와 stable idempotency key, 중복을 감지할 저장 경계가 필요합니다." },
  { question: "등록된 lambda가 memory leak을 만드는 경로는 무엇인가요?", answer: "장수 registry가 lambda를, lambda가 captured outer graph를 참조해 lifecycle 이후에도 보존할 수 있습니다." },
  { question: "subscribe가 AutoCloseable을 반환하면 어떤 장점이 있나요?", answer: "등록 ownership을 lexical scope와 연결하고 idempotent close test를 만들 수 있습니다." },
  { question: "publish 중 listener 해제를 허용할 때 먼저 정할 것은 무엇인가요?", answer: "현재 snapshot에 영향을 주는지 다음 publish부터 반영되는지 mutation semantics를 정합니다." },
  { question: "snapshot publication의 비용은 무엇인가요?", answer: "publish마다 O(n) 복사와 allocation이 생기지만 reentrant mutation 의미가 단순해집니다." },
  { question: "callback 하나의 실패를 잡고 계속할지는 누가 정하나요?", answer: "registry의 명시적 fail-fast 또는 isolate/aggregate error policy가 정합니다." },
  { question: "close를 두 번 호출할 수 있는 API라면 무엇을 검증해야 하나요?", answer: "두 번째 close가 상태를 더 바꾸지 않고 후속 delivery가 없음을 검증합니다." },
  { question: "target 없는 lambda 오류는 runtime test로 잡을 수 있나요?", answer: "아닙니다. compile-time rule이므로 negative compile fixture가 필요합니다." },
  { question: "왜 negative compile 원인을 한 파일에 하나만 두나요?", answer: "cascade errors를 피하고 stable diagnostic key와 source span을 정확히 대응시키기 위해서입니다." },
  { question: "short-circuit test에서 최종 false만 보면 왜 부족한가요?", answer: "eager하게 둘 다 호출해도 false일 수 있으므로 뒤 predicate call count0도 확인해야 합니다." },
  { question: "composition order fixture는 어떤 함수가 좋은가요?", answer: "add1과 double처럼 순서를 바꾸면 결과가 달라지는 비가환 함수를 사용합니다." },
  { question: "checked adapter failure에서 무엇을 assert하나요?", answer: "wrapper type, original cause type과 secret 없는 operation context를 분리해 검증합니다." },
  { question: "lambda identity를 테스트하지 않으면 무엇을 테스트하나요?", answer: "입력·출력·예외·부수효과·call order·lifecycle state를 테스트합니다." },
  { question: "property-based test 전에 pure core를 분리하는 이유는 무엇인가요?", answer: "generation과 shrinking이 함수를 여러 번 호출하므로 effect가 있으면 결과와 환경이 오염될 수 있습니다." },
  { question: "mutation testing이 lambda code에 특히 유용한 예는 무엇인가요?", answer: "and/or 교환, negate 누락, cause 제거, close guard 제거가 tests에 잡히는지 확인할 수 있습니다." },
  { question: "method reference와 lambda 중 성능만으로 고를 수 있나요?", answer: "언어상 일률적 우위가 없으므로 의미·readability를 우선하고 실제 workload를 측정합니다." },
  { question: "외부 action id를 reflection class name으로 바로 실행해도 되나요?", answer: "안 됩니다. allowlist registry와 authorization, unknown/version policy를 둡니다." },
  { question: "registry size0이면 retention 문제가 완전히 증명되나요?", answer: "아닙니다. 다른 strong reference가 있을 수 있어 heap path·post-close invocation·scoped weak probe도 봅니다." },
  { question: "compiler 전체 오류 문장을 golden으로 쓰지 않는 이유는 무엇인가요?", answer: "locale과 JDK 문구가 바뀔 수 있어 diagnostic key·source span·exit status가 더 안정적입니다." },
);

(session.completionChecklist as string[]).push(
  "lambda runtime instance의 새 생성·재사용 어느 쪽도 가정하지 않았다.",
  "reference equality·identityHashCode·synthetic class name을 golden에서 제외했다.",
  "동일 behavior와 object identity를 다른 개념으로 설명했다.",
  "callback lookup/remove에 stable domain 또는 subscription id를 사용했다.",
  "unknown action id를 명시적으로 거부하는 정책을 두었다.",
  "durable payload에 executable lambda serialization을 사용하지 않았다.",
  "action type·schema version·data DTO와 runtime registry를 분리했다.",
  "function registry를 reflection이 아닌 allowlist mapping으로 구성했다.",
  "Function·UnaryOperator 사용이 purity를 자동 보장하지 않음을 점검했다.",
  "pure result와 effect log를 별도 assertions로 검증했다.",
  "Predicate short-circuit와 전체 validation 수집을 구분했다.",
  "Consumer.andThen의 앞 failure가 뒤 호출을 막는 의미를 기록했다.",
  "captured mutable referent의 thread safety를 별도로 분석했다.",
  "AtomicInteger가 단일 값 이상 invariant를 보장하지 않음을 기록했다.",
  "parallel exact output에서 worker name·encounter order를 제외했다.",
  "ordered effect 요구에는 serial execution 또는 sequence protocol을 선택했다.",
  "retry 가능한 effect에 idempotency key와 delivery semantics를 정의했다.",
  "observability wrapper에 stable operation id와 redaction을 적용했다.",
  "장수 registry에서 lambda capture retention graph를 점검했다.",
  "subscribe가 stable Subscription 또는 AutoCloseable을 반환한다.",
  "Subscription close가 idempotent함을 실행으로 검증했다.",
  "owner lifecycle에서 모든 subscription을 close한다.",
  "post-close publish가 callback을 호출하지 않음을 확인했다.",
  "publish 중 mutation의 snapshot/live semantics를 문서화했다.",
  "self-unsubscribe와 other-unsubscribe 재진입 case를 고려했다.",
  "single-thread ownership과 concurrent registry 중 하나를 명시했다.",
  "callback failure의 fail-fast 또는 isolate/aggregate 정책을 정했다.",
  "registry size와 heap retention path를 서로 다른 증거로 취급했다.",
  "positive fixture를 warning0·exit0·stderr0·exact stdout으로 실행했다.",
  "second abstract method를 독립 negative compile fixture로 둔다.",
  "target 없는 var lambda를 독립 negative compile fixture로 둔다.",
  "mutated local capture를 독립 negative compile fixture로 둔다.",
  "same-shaped SAM overload ambiguity를 독립 negative compile fixture로 둔다.",
  "negative compiler 검증에 -XDrawDiagnostics key와 source span을 사용한다.",
  "negative fixture마다 root cause를 하나만 남겼다.",
  "short-circuit result와 뒤 callback call count를 함께 assert했다.",
  "composition order에 비가환 함수 fixture를 사용했다.",
  "method reference refactor 전후의 target descriptor를 확인했다.",
  "checked adapter의 wrapper·cause·safe context를 각각 검증했다.",
  "capture matrix에 scalar·mutable referent·escaping callback을 포함했다.",
  "lifecycle matrix에 close twice와 post-close no-call을 포함했다.",
  "concurrency matrix에서 single/multiple worker 의미를 분리했다.",
  "property test generator가 effectful state를 오염시키지 않게 pure core를 분리했다.",
  "mutation test로 short-circuit·order·cause·close guard의 oracle을 점검했다.",
  "walkthrough line bounds를 실제 code line 수와 대조했다.",
  "모든 sourceRefs가 존재하며 선언된 source가 실제 example에서 사용된다.",
  "공개 prose·code·output에서 local absolute path와 개인 정보를 제거했다.",
  "후속 Stream 세션으로 이동할 prerequisite와 link를 연결했다.",
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "runtime lambda identity·serialization 비계약을 JLS15.27.4와 stable action registry example로 보강했습니다.",
  "pure/effect/concurrency boundary를 sequential effect log와 parallel atomic aggregate로 분리 검증했습니다.",
  "callback lifecycle은 stable numeric key, snapshot publish, idempotent AutoCloseable close와 post-close no-delivery로 검증했습니다.",
  "positive9 assertions와 negative compile fixtures4의 verification matrix를 분리해 compiler/runtime contracts를 혼동하지 않았습니다.",
);

(session.nextSessions as string[]).push("core-08-stream");
