import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-10-enum-inner"],
  slug: "oop-10-enum-inner",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 20,
  title: "enum·중첩 클래스·로컬/익명 구현과 수명 경계",
  subtitle: "값의 닫힌 집합과 lexical enclosing context를 type으로 모델링하고, 생성·이름 해석·capture·수명·직렬화 위험을 실행 계약으로 검증합니다.",
  level: "고급",
  estimatedMinutes: 760,
  coreQuestion: "관련 type을 가까이 두는 편의가 언제 안전한 캡슐화가 되고, 언제 숨은 outer reference·capture·수명 결합이 되어 누수와 유지보수 위험을 만들까요?",
  summary: "javastudy2 원본에서 inventory direct6인 class06 Ex18_Enum·Ex19_MemberType·Ex21_MemberInnerClass와 class07 Ex01_LocalInnerClass·Ex03_StaticInnerClass·Ex09_Main을 확인하고 실제 실행 companion/dependency Ex20_MemberTypeMain·Ex22_Main·Ex02_Main·Ex04_Main·Ex08까지 포함해 범위11을 확정했습니다. OpenJDK21.0.11에서 class06 전체22는 exit0·auxiliary warning2, class07 전체9는 exit0·warning14이며, 범위11은 exit0·warning6입니다. 범위 경고6은 모두 Ex09_Main이 Ex08.java 안 package-private Ex08_Land·Car·Baseball을 다른 source file에서 사용하는 구조 경고입니다. runnable main6과 compile-only5를 구분하고 Ex18 exact2행, Ex20 VVIP 입력 exact12행, Ex09 exact7행을 고정했습니다. Ex22·Ex02는 identity hash와 실제 이름·주소 문자열을 공개하지 않고 line count·반복 관계·shadowing numeric ladder를 검증하며, Ex04도 주소 literal 대신 위치와 non-empty contract를 확인합니다. 이 원본 위에서 enum constant가 singleton object라는 의미, fields·methods·constant-specific behavior·switch·valueOf 경계, member inner의 qualified new와 outer linkage, local class의 lexical scope와 effectively-final capture, static nested의 enclosing-instance 부재, anonymous class와 lambda의 this 차이, hidden reference가 만드는 lifetime leak와 serialization 위험, reflection과 negative compiler contracts까지 확장합니다. 특히 원본의 ‘method가 끝나면 local inner object도 사라진다’는 설명을 scope와 lifetime의 혼동으로 교정하고, ‘static member가 있으면 inner class를 static으로 해야 한다’는 설명도 Java16 이후 inner class가 static members를 선언할 수 있다는 Java21 규칙으로 교정합니다.",
  objectives: [
    "enum constant를 public static final singleton instances로 해석하고 fields·constructor·methods·constant-specific behavior를 설계한다.",
    "values·valueOf·name·ordinal·switch의 정확한 계약과 persistence/input 경계의 실패 정책을 구분한다.",
    "non-static member inner object의 enclosing instance linkage와 qualified outer.new Inner 생성, private outer access를 설명한다.",
    "local class의 lexical declaration scope와 object lifetime을 분리하고 final/effectively-final capture를 안전하게 사용한다.",
    "static nested class가 implicit outer instance를 갖지 않음을 보이고 Java21의 inner-class static-member 규칙을 과거 규칙과 구분한다.",
    "anonymous class와 lambda를 SAM·상태·this·identity·capture 기준으로 선택하고 generated class name에 의존하지 않는다.",
    "중첩 type의 숨은 outer/captured references가 retention·serialization·API evolution에 미치는 영향을 reflection과 compiler contracts로 검증한다.",
  ],
  prerequisites: [{ title: "인터페이스·default 메서드와 다중 역할", reason: "anonymous class와 lambda가 구현할 SAM 역할, interface implementation obligation, runtime dispatch를 먼저 이해해야 중첩 구현의 차이를 정확히 볼 수 있습니다.", sessionSlug: "oop-09-interface" }],
  keywords: ["enum", "enum constant", "values", "valueOf", "ordinal", "switch expression", "member inner class", "enclosing instance", "qualified new", "Outer.this", "shadowing", "local class", "lexical scope", "effectively final", "static nested class", "anonymous class", "lambda", "lexical this", "capture", "lifetime", "retention leak", "serialization", "reflection", "compiler diagnostics"],
  chapters: [
    {
      id: "eleven-source-six-main-golden-audit",
      title: "direct6·companion5를 묶어 package와 scope warning, 여섯 main의 exact·normalized 출력을 함께 감사합니다",
      lead: "선언 file만 읽고 끝내지 않고 실제 생성 caller와 interface dependency까지 닫되, 개인 literal과 identity hash는 관계 검증으로 안전하게 치환합니다.",
      explanations: [
        "class06 범위는 Ex18의 package-private Lesson enum과 main, Ex19 enum과 Scanner caller Ex20, member inner 선언 Ex21과 qualified-new caller Ex22의 다섯 files입니다. class07 범위는 local class Ex01과 caller Ex02, static nested Ex03과 caller Ex04, interface·named implementations·dispatcher Ex08과 anonymous caller Ex09의 여섯 files입니다.",
        "package smoke와 session scope는 다른 질문에 답합니다. class06 전체22의 warning2는 OOP09 영역 Ex07_InterfaceDemo의 auxiliary class 접근이고, class07 전체9의 warning14 중8은 Ex06_Main,6은 Ex09_Main입니다. OOP10 범위11에는 Ex06이 없으므로 Ex09의 warning6만 남습니다.",
        "compile success와 warning clean은 같은 말이 아닙니다. 세 compile 모두 exit0이지만 captured diagnostics는 class06 3행, class07 15행, scope 7행이며 warning occurrences는 각각2·14·6입니다. scope warning owner와 declaration owner를 Ex09_Main·Ex08.java로 동시에 assert합니다.",
        "범위11의 static main은 Ex18·Ex20·Ex22·Ex02·Ex04·Ex09 여섯 개이고 선언/dependency 전용은 Ex19·Ex21·Ex01·Ex03·Ex08 다섯 개입니다. main count를 수동 숫자로만 적지 않고 source의 static void main 형태에서 계산합니다.",
        "Ex18은 90과 JAVA의2행입니다. Ex20은 새 child JVM에 VVIP와 newline을 넣어 VIP/BASIC/VVIP의 name·label·level과 prompt를 exact12행으로 고정합니다. valueOf는 대소문자까지 정확히 일치해야 하므로 입력 정규화는 원본 golden 뒤의 개선 과제로 분리합니다.",
        "Ex22와 Ex02의 constructor가 Object.toString을 출력해 identity hash가 매 실행 달라집니다. 원본 문자열을 snapshot으로 복제하지 않고 class-name@hex 구조, line count, 같은 shadow level의 반복, 서로 다른 name/address slots, 숫자와 separator 위치를 assert합니다.",
        "Ex04의 nested static room5·outer static cnt14·inner room5는 exact 위치를 고정하지만 실제 address 문자열은 non-empty 한 행으로만 검증합니다. Ex09는 inactive else anonymous body도 compile되지만 runtime output은 carousel·baseball·car·separator·car·separator·anonymous car의 exact7행입니다.",
        "감사 script는 공백이 있는 OS temp GUID direct child에 세 output directories를 만들고, 네 JDK launcher option 환경변수를 process scope에서 저장·제거한 뒤 ProcessStartInfo child에서도 제거합니다. redirected UTF-8 streams로 six mains를 각각 실행하고 finally에서 환경을 복원한 다음 resolved parent가 normalized temp base인지 확인해 그 child만 삭제합니다.",
      ],
      concepts: [
        { term: "atomic source scope", definition: "inventory direct files에 실제 compile dependencies와 실행 companions를 더해 독립적으로 compile/run 가능한 최소 source 집합입니다.", detail: ["OOP10은 direct6+companions5입니다.", "package smoke와 scope compile을 별도 output directory로 격리합니다."] },
        { term: "normalized golden", definition: "비결정적·비공개 token 자체가 아니라 안정된 구조·순서·반복 관계를 assert하는 실행 계약입니다.", detail: ["identity hash는 class@hex 형태만 확인합니다.", "shadowed names는 같은 slot 반복과 distinct slot 수로 확인합니다."] },
        { term: "auxiliary class warning", definition: "한 source file의 package-private top-level type을 다른 source file에서 직접 사용할 때 javac -Xlint:all이 알리는 file-layout 경고입니다.", detail: ["OOP10 scope에서는 Ex08 declarations와 Ex09 uses가 원인입니다.", "nested type 자체에 대한 경고가 아닙니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-oop10-audit",
        title: "package22·package9·scope11을 compile하고 six mains와 source shape를 검증합니다",
        language: "powershell",
        filename: "verify-original-oop10.ps1",
        purpose: "enum·member/local/static nested·anonymous 원본을 warning과 exact/normalized output까지 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop10 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
$launcherOptionNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedLauncherOptions = @{}
foreach ($name in $launcherOptionNames) {
  if (Test-Path "Env:$name") {
    $savedLauncherOptions[$name] = (Get-Item "Env:$name").Value
    Remove-Item "Env:$name" -ErrorAction Stop
  }
}
try {
  $class06 = "src\com\java\class06"
  $class07 = "src\com\java\class07"
  $all06 = @(Get-ChildItem -LiteralPath $class06 -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $all07 = @(Get-ChildItem -LiteralPath $class07 -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scope06Names = @("Ex18_Enum.java", "Ex19_MemberType.java", "Ex20_MemberTypeMain.java", "Ex21_MemberInnerClass.java", "Ex22_Main.java")
  $scope07Names = @("Ex01_LocalInnerClass.java", "Ex02_Main.java", "Ex03_StaticInnerClass.java", "Ex04_Main.java", "Ex08.java", "Ex09_Main.java")
  $scope = @($scope06Names | ForEach-Object { Join-Path $class06 $_ }) + @($scope07Names | ForEach-Object { Join-Path $class07 $_ })
  $out06 = Join-Path $root "all 06"
  $out07 = Join-Path $root "all 07"
  $outScope = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $out06, $out07, $outScope -ErrorAction Stop | Out-Null

  $log06 = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $out06 $all06 2>&1)
  $exit06 = $LASTEXITCODE
  $log07 = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $out07 $all07 2>&1)
  $exit07 = $LASTEXITCODE
  $logScope = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $outScope $scope 2>&1)
  $exitScope = $LASTEXITCODE
  $warn = "compiler\.warn\.auxiliary\.class\.accessed\.from\.outside\.of\.its\.source\.file"
  $warnings06 = @($log06 | Where-Object { $_.ToString() -match $warn })
  $warnings07 = @($log07 | Where-Object { $_.ToString() -match $warn })
  $warningsScope = @($logScope | Where-Object { $_.ToString() -match $warn })
  $scopeUses = @($warningsScope | Where-Object { $_.ToString() -match "^Ex09_Main\.java:" }).Count
  $scopeDecls = @($warningsScope | Where-Object { $_.ToString() -match ", Ex08\.java$" }).Count
  if ($all06.Count -ne 22 -or $exit06 -ne 0 -or $log06.Count -ne 3 -or $warnings06.Count -ne 2) { throw "class06 package drift" }
  if ($all07.Count -ne 9 -or $exit07 -ne 0 -or $log07.Count -ne 15 -or $warnings07.Count -ne 14) { throw "class07 package drift" }
  if ($scope.Count -ne 11 -or $exitScope -ne 0 -or $logScope.Count -ne 7 -or $warningsScope.Count -ne 6 -or $scopeUses -ne 6 -or $scopeDecls -ne 6) { throw "scope compile drift" }
  $mainCount = @($scope | Where-Object { (Get-Content -Raw -LiteralPath $_) -match "static\s+void\s+main\s*\(" }).Count
  if ($mainCount -ne 6 -or ($scope.Count - $mainCount) -ne 5) { throw "source role drift" }

  function Invoke-Java([string]$main, [string]$stdin = "") {
    $psi = [Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = (Get-Command java -ErrorAction Stop).Source
    foreach ($arg in @("-Dfile.encoding=UTF-8", "-cp", $outScope, $main)) { $psi.ArgumentList.Add($arg) }
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
    foreach ($name in $launcherOptionNames) { [void]$psi.Environment.Remove($name) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $psi
    try {
      if (-not $process.Start()) { throw "process start failed" }
      $stdoutTask = $process.StandardOutput.ReadToEndAsync()
      $stderrTask = $process.StandardError.ReadToEndAsync()
      $process.StandardInput.Write($stdin)
      $process.StandardInput.Close()
      if (-not $process.WaitForExit(10000)) {
        $process.Kill($true)
        if (-not $process.WaitForExit(5000)) { throw "java process did not stop after kill" }
        [void]$stdoutTask.GetAwaiter().GetResult()
        [void]$stderrTask.GetAwaiter().GetResult()
        throw "java process timeout"
      }
      $stdout = [regex]::Replace($stdoutTask.GetAwaiter().GetResult(), "\r\n", [string][char]10).TrimEnd([char]10)
      $stderr = $stderrTask.GetAwaiter().GetResult()
      $lines = if ($stdout.Length -eq 0) { @() } else { @($stdout.Split([char]10)) }
      $result = [pscustomobject]@{ Exit = $process.ExitCode; Err = $stderr; Lines = $lines }
    } finally {
      $process.Dispose()
    }
    $result
  }
  function Assert-Clean($run) { if ($run.Exit -ne 0 -or -not [string]::IsNullOrEmpty($run.Err)) { throw "main failed" } }
  function Assert-Exact($actual, [string[]]$expected) {
    if ($actual.Count -ne $expected.Count -or (Compare-Object $actual $expected -SyncWindow 0).Count -ne 0) { throw "output drift" }
  }

  $ex18 = Invoke-Java "com.java.class06.Ex18_Enum"
  $ex20 = Invoke-Java "com.java.class06.Ex20_MemberTypeMain" ("VVIP" + [Environment]::NewLine)
  $ex22 = Invoke-Java "com.java.class06.Ex22_Main"
  $ex02 = Invoke-Java "com.java.class07.Ex02_Main"
  $ex04 = Invoke-Java "com.java.class07.Ex04_Main"
  $ex09 = Invoke-Java "com.java.class07.Ex09_Main"
  foreach ($run in @($ex18, $ex20, $ex22, $ex02, $ex04, $ex09)) { Assert-Clean $run }
  Assert-Exact $ex18.Lines @("90", "JAVA")
  Assert-Exact $ex20.Lines @("VIP", "우수회원", "2", "=============", "BASIC", "일반회원", "1", "=============", "회원 등급 입력(BASIC, VIP, VVIP)", "VVIP", "최우수회원", "3")
  Assert-Exact $ex09.Lines @("회전목마", "야구하기", "운전하기", "===========", "운전하기", "===========", "승용차 운전")

  if ($ex22.Lines.Count -ne 10 -or $ex22.Lines[0] -notmatch '^외부클래스 : com\.java\.class06\.Ex21_MemberInnerClass@[0-9a-f]+$' -or $ex22.Lines[1] -notmatch '^내부클래스 : com\.java\.class06\.Ex21_MemberInnerClass\$Inner01@[0-9a-f]+$') { throw "Ex22 identity drift" }
  if ($ex22.Lines[2] -cne $ex22.Lines[7] -or $ex22.Lines[3] -cne $ex22.Lines[6] -or @(@($ex22.Lines[2], $ex22.Lines[3], $ex22.Lines[5]) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique).Count -ne 3 -or $ex22.Lines[4] -cne "" -or $ex22.Lines[8] -cne "24" -or $ex22.Lines[9] -cne "5") { throw "Ex22 shadow drift" }
  if ($ex02.Lines.Count -ne 21 -or $ex02.Lines[0] -notmatch '^외부: com\.java\.class07\.Ex01_LocalInnerClass@[0-9a-f]+$' -or $ex02.Lines[2] -notmatch '^내부 : com\.java\.class07\.Ex01_LocalInnerClass\$1Inner02@[0-9a-f]+$') { throw "Ex02 identity drift" }
  if ($ex02.Lines[1] -cne $ex02.Lines[17] -or $ex02.Lines[1] -cne $ex02.Lines[20] -or @(@($ex02.Lines[3], $ex02.Lines[5], $ex02.Lines[6], $ex02.Lines[7]) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique).Count -ne 4) { throw "Ex02 name/sound drift" }
  Assert-Exact @($ex02.Lines[4], $ex02.Lines[8], $ex02.Lines[9], $ex02.Lines[10], $ex02.Lines[11], $ex02.Lines[12], $ex02.Lines[13], $ex02.Lines[18], $ex02.Lines[19]) @("3", "777", "1004", "3", "999", "100", "11", "================", "3")
  if (@(@($ex02.Lines[14], $ex02.Lines[15], $ex02.Lines[16]) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique).Count -ne 3) { throw "Ex02 address slots drift" }
  if ($ex04.Lines.Count -ne 5 -or $ex04.Lines[0] -cne "5" -or $ex04.Lines[1] -cne "===========" -or $ex04.Lines[2] -cne "14" -or [string]::IsNullOrWhiteSpace($ex04.Lines[3]) -or $ex04.Lines[4] -cne "5") { throw "Ex04 output drift" }

  $ex18Source = Get-Content -Raw -LiteralPath (Join-Path $class06 "Ex18_Enum.java")
  $ex19Source = Get-Content -Raw -LiteralPath (Join-Path $class06 "Ex19_MemberType.java")
  $ex21Source = Get-Content -Raw -LiteralPath (Join-Path $class06 "Ex21_MemberInnerClass.java")
  $ex22Source = Get-Content -Raw -LiteralPath (Join-Path $class06 "Ex22_Main.java")
  $ex01Source = Get-Content -Raw -LiteralPath (Join-Path $class07 "Ex01_LocalInnerClass.java")
  $ex03Source = Get-Content -Raw -LiteralPath (Join-Path $class07 "Ex03_StaticInnerClass.java")
  $ex09Source = Get-Content -Raw -LiteralPath (Join-Path $class07 "Ex09_Main.java")
  if ($ex18Source -notmatch 'JAVA\s*,\s*JSP\s*,\s*SPRING\s*,\s*REACT' -or [regex]::Matches($ex19Source, '(?m)^\s*(BASIC|VIP|VVIP)\(').Count -ne 3) { throw "enum shape drift" }
  if ([regex]::Matches($ex19Source, 'private\s+final').Count -ne 2 -or $ex21Source -notmatch 'class\s+Inner01' -or $ex22Source -notmatch 'demo\.new\s+Inner01') { throw "member inner shape drift" }
  if ($ex21Source -notmatch 'Ex21_MemberInnerClass\.this\.name' -or $ex01Source -notmatch 'class\s+Inner02' -or [regex]::Matches($ex01Source, 'Ex01_LocalInnerClass\.this\.').Count -lt 4) { throw "qualified this shape drift" }
  if ($ex03Source -notmatch 'public\s+static\s+class\s+Inner03' -or $ex03Source -notmatch 'static\s+int\s+room\s*=\s*5' -or [regex]::Matches($ex09Source, 'new\s+Ex08\s*\(\s*\)\s*\{').Count -ne 3) { throw "static/anonymous shape drift" }

  "spacePath=$($root.Contains(' ')),package06=$($all06.Count)|exit:$exit06|warnings:$($warnings06.Count),package07=$($all07.Count)|exit:$exit07|warnings:$($warnings07.Count)"
  "scope=$($scope.Count)|exit:$exitScope|warnings:$($warningsScope.Count)|owners:Ex09:$scopeUses>Ex08:$scopeDecls|mains:$mainCount|compileOnly:$($scope.Count-$mainCount)"
  "exact=Ex18:$($ex18.Lines.Count)|Ex20:$($ex20.Lines.Count)|Ex09:$($ex09.Lines.Count),normalized=Ex22:$($ex22.Lines.Count)|Ex02:$($ex02.Lines.Count)|Ex04:$($ex04.Lines.Count)"
  "shapes=enumConstants:4|memberTypes:3|memberInner:true|qualifiedNew:true|localInner:true|staticNested:true|anonymousExpressions:3"
} finally {
  foreach ($name in $launcherOptionNames) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
  foreach ($entry in $savedLauncherOptions.GetEnumerator()) { Set-Item "Env:$($entry.Key)" $entry.Value }
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-24", explanation: "공백 포함 OS temp GUID direct child, 네 launcher option 환경 저장·제거, class06/class07 package lists, scope11과 세 output directories를 만듭니다." },
          { lines: "26-42", explanation: "오염되지 않은 OpenJDK21 -XDrawDiagnostics로 package22 warning2·package9 warning14·scope11 warning6과 owner Ex09/declaring Ex08를 assert합니다." },
          { lines: "44-83", explanation: "ProcessStartInfo ArgumentList와 child environment를 구성하고 Start 직후 stdout/stderr를 비동기 drain합니다. stdin을 닫은 뒤 10초 runtime timeout, process-tree kill, 5초 termination grace, task 회수와 finally Dispose를 적용합니다." },
          { lines: "84-102", explanation: "여섯 mains를 fresh JVM으로 실행하고 Ex18·Ex20·Ex09 exact arrays, Ex22·Ex02·Ex04의 position·반복·identity·non-empty slots를 검증합니다." },
          { lines: "103-113", explanation: "enum constants·final fields·qualified new·Outer.this·local/static nested·anonymous expressions3의 source shape를 동적으로 확인합니다." },
          { lines: "115-126", explanation: "검증된 요약만 출력하고 launcher options를 원값으로 복원한 뒤 resolved parent boundary를 확인해 audit root만 삭제합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root", "four Java launcher option variables isolated and restored", "10-second runtime timeout plus 5-second termination grace per Java child"], command: "pwsh -NoProfile -File verify-original-oop10.ps1" },
        output: { value: "spacePath=True,package06=22|exit:0|warnings:2,package07=9|exit:0|warnings:14\nscope=11|exit:0|warnings:6|owners:Ex09:6>Ex08:6|mains:6|compileOnly:5\nexact=Ex18:2|Ex20:12|Ex09:7,normalized=Ex22:10|Ex02:21|Ex04:5\nshapes=enumConstants:4|memberTypes:3|memberInner:true|qualifiedNew:true|localInner:true|staticNested:true|anonymousExpressions:3", explanation: ["package warning과 OOP10 scope warning을 섞지 않습니다.", "Ex20은 prompt 포함12행이며 VVIP의 name·label·level까지 exact입니다.", "identity hash와 개인 literal을 공개하지 않고 shadowing 관계는 더 강하게 검증합니다.", "Ex09의 anonymous expressions3 중 runtime branch에서 실행되는 것은2개입니다."] },
        experiments: [
          { change: "Ex08의 네 top-level types를 각 자기 source file로 분리합니다.", prediction: "OOP10 scope warning6이0이 되고 Ex09 exact7행은 유지됩니다.", result: "warning 원인은 anonymous class가 아니라 auxiliary top-level source layout입니다." },
          { change: "Ex20 입력을 소문자 vvip로 보냅니다.", prediction: "valueOf가 IllegalArgumentException을 던지고 normal12행 계약이 깨집니다.", result: "외부 입력은 parse/validation boundary에서 case normalization 또는 명시 오류로 처리해야 합니다." },
          { change: "Ex22 raw identity lines를 golden에 그대로 저장합니다.", prediction: "다음 JVM의 hexadecimal suffix가 달라 false failure가 납니다.", result: "Object identity string은 shape만, domain output은 exact value로 나눠 검증해야 합니다." },
        ],
        sourceRefs: ["java-class06-ex18", "java-class06-ex19", "java-class06-ex20", "java-class06-ex21", "java-class06-ex22", "java-class07-ex01", "java-class07-ex02", "java-class07-ex03", "java-class07-ex04", "java-class07-ex08", "java-class07-ex09", "jdk21-javac", "dotnet-process-start-info", "powershell-environment-variables", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "class07 package warning14를 OOP10 범위 warning이라고 적었다.", likelyCause: "package smoke의 Ex06 warnings8과 scope의 Ex09 warnings6을 분리하지 않았습니다.", checks: ["compile source list를 출력합니다.", "diagnostic use-site filename을 셉니다.", "서로 다른 -d directories인지 확인합니다."], fix: "package9 warning14와 scope11 warning6을 별도 baseline으로 기록합니다.", prevention: "package health와 session atomicity를 별도 표와 명령으로 유지합니다." },
        { symptom: "Ex22·Ex02 output snapshot이 실행마다 바뀐다.", likelyCause: "Object.toString의 identity hash와 local/anonymous generated binary name을 exact golden에 넣었습니다.", checks: ["class@hex token을 찾습니다.", "Class.getName 또는 toString 의존을 찾습니다.", "안정된 line relation을 식별합니다."], fix: "identity는 pattern, 이름 shadowing은 equality/distinctness, 숫자·separator는 exact로 검증합니다.", prevention: "golden review에서 generated identity와 개인 literal을 금지합니다." },
      ],
      expertNotes: ["컴파일 warning baseline은 영구 허용이 아니라 source split migration 뒤 6→0으로 갱신할 debt contract입니다.", "normalized golden은 검증을 약화하는 삭제가 아니라 의미 있는 invariants만 남기는 모델링입니다."],
    },
    {
      id: "enum-is-a-closed-object-set",
      title: "enum constant는 정수 별칭이 아니라 type이 보장하는 닫힌 object 집합입니다",
      lead: "Ex18의 KOR90 data와 Lesson.JAVA object를 구분하고, 문자열·정수 magic constants가 잃는 type safety와 behavior locality를 복원합니다.",
      explanations: [
        "Java enum declaration은 특수한 class declaration입니다. 각 constant는 해당 enum type의 public static final field이자 class initialization 중 만들어지는 유일한 instance입니다. 변수에는 허용된 constants 또는 null만 들어가므로 임의의90·91 같은 값이 의미 집합에 침입하지 못합니다.",
        "Ex18의 static final int KOR=90은 단일 data constant이고 Lesson.JAVA는 Lesson object입니다. int constants 여러 개를 흩어 두면 어느 숫자가 합법인지, 어떤 label과 behavior가 연결되는지를 compiler가 보장할 수 없습니다.",
        "enum은 java.lang.Enum을 암시적으로 extends하므로 다른 class를 extends할 수 없지만 interfaces는 implements할 수 있습니다. 모든 constants가 공통 instance fields와 methods를 가지며 identity 비교는 equals 대신 ==도 정확합니다.",
        "enum constructor는 각 constant 선언에서 전달한 arguments로 호출되고 외부에서 new할 수 없습니다. public/protected constructor는 허용되지 않으며 private를 생략해도 외부 생성이 막힙니다. constructor에서 외부 mutable service나 아직 초기화 중인 static state에 기대지 않습니다.",
        "values()는 선언 순서의 새 array를 반환하고 valueOf는 constant의 정확한 name을 찾습니다. label과 name은 다른 계약입니다. 사용자에게 보이는 한국어 label을 바꾸어도 name은 persistence/API key로 별도 관리할 수 있습니다.",
        "name()은 source constant identifier이고 toString()은 override할 수 있습니다. parsing에 toString을 역으로 기대면 표시 문구 변경이 input contract를 깨뜨리므로 stable external code field와 parse method를 따로 둡니다.",
        "ordinal()은 현재 선언 위치일 뿐 영속 식별자가 아닙니다. 중간 constant 추가·재정렬로 값이 바뀌므로 DB, JSON, network protocol에 저장하지 않습니다. explicit immutable code를 사용하고 unknown code 정책을 정의합니다.",
      ],
      concepts: [
        { term: "enum constant", definition: "enum class가 미리 선언한 public static final singleton instance입니다.", detail: ["identity는 ==로 비교할 수 있습니다.", "fields와 polymorphic methods를 가질 수 있습니다."] },
        { term: "closed set", definition: "application code가 enum instances를 임의로 추가할 수 없어 가능한 값 목록이 declaration에 닫힌 성질입니다.", detail: ["exhaustive switch 분석이 가능합니다.", "외부 plugin 확장에는 interface/sealed hierarchy가 더 맞을 수 있습니다."] },
        { term: "external code", definition: "enum name/ordinal과 분리해 DB·JSON·URL에 쓰는 명시적 안정 식별자입니다.", detail: ["rename/reorder에 견딥니다.", "duplicate code를 constructor-time registry로 검증할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-enum-domain-model",
        title: "명시 code·label·level과 safe parse를 가진 membership enum",
        language: "java",
        filename: "EnumDomain.java",
        purpose: "name·label·external code·ordinal을 분리하고 exact parsing failure를 Optional로 경계 처리합니다.",
        code: String.raw`import java.util.Arrays;
import java.util.Optional;

public class EnumDomain {
    enum Membership {
        BASIC("B", "일반", 1),
        VIP("V", "우수", 2),
        VVIP("X", "최우수", 3);

        private final String code;
        private final String label;
        private final int level;

        Membership(String code, String label, int level) {
            this.code = code;
            this.label = label;
            this.level = level;
        }

        String code() { return code; }
        String label() { return label; }
        int level() { return level; }

        static Optional<Membership> fromCode(String code) {
            return Arrays.stream(values())
                    .filter(value -> value.code.equals(code))
                    .findFirst();
        }
    }

    public static void main(String[] args) {
        Membership chosen = Membership.VIP;
        System.out.println(chosen.name() + ":" + chosen.code() + ":" + chosen.label() + ":" + chosen.level());
        System.out.println(Membership.fromCode("X").orElseThrow().name());
        System.out.println(Membership.fromCode("?").isEmpty());
        System.out.println(Membership.values().length);
        System.out.println(Membership.BASIC == Membership.valueOf("BASIC"));
    }
}`,
        walkthrough: [
          { lines: "1-4", explanation: "Arrays stream과 Optional을 input parse result에 사용합니다." },
          { lines: "5-22", explanation: "세 constants가 stable code·display label·business level을 immutable fields로 보유하고 명시 accessors로 공개합니다." },
          { lines: "24-28", explanation: "known external code를 constant로 복원하고 unknown code는 null/exception 대신 Optional empty로 명시합니다." },
          { lines: "31-38", explanation: "name/code/label/level, known/unknown parse, values count, singleton identity를 다섯 행으로 exact 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("EnumDomain.java", "EnumDomain") },
        output: { value: "VIP:V:우수:2\nVVIP\ntrue\n3\ntrue", explanation: ["name VIP와 external code V, label 우수는 서로 다른 계약입니다.", "unknown code는 empty이고 valueOf BASIC은 동일 singleton을 반환합니다."] },
        experiments: [
          { change: "VIP와 VVIP 선언 순서를 바꿉니다.", prediction: "ordinal과 values 순서는 바뀌지만 code V/X와 fromCode 결과는 유지됩니다.", result: "ordinal을 외부 식별자로 저장하면 안 되는 이유입니다." },
          { change: "label 우수를 프리미엄으로 바꿉니다.", prediction: "표시 output만 바뀌고 valueOf/name/code 계약은 유지됩니다.", result: "표시와 식별을 분리하면 UI copy 변경이 persistence를 깨뜨리지 않습니다." },
        ],
        sourceRefs: ["java-class06-ex18", "java-class06-ex19", "java-class06-ex20", "jls-enum-classes", "java-enum-api", "java-optional-api"],
      }],
      diagnostics: [
        { symptom: "DB에 저장한 ordinal2가 enum 재정렬 뒤 다른 등급이 됐다.", likelyCause: "declaration position을 durable identifier로 사용했습니다.", checks: ["schema에 integer ordinal이 있는지 봅니다.", "과거 release enum 순서를 비교합니다.", "명시 code uniqueness를 확인합니다."], fix: "stable code column으로 migration하고 unknown/duplicate 정책을 검증합니다.", prevention: "ordinal은 UI/debug 순서 외 external contract에서 금지합니다." },
        { symptom: "valueOf에 화면 label을 넣자 IllegalArgumentException이 난다.", likelyCause: "valueOf가 label/toString이 아니라 정확한 constant name만 받는다는 계약을 놓쳤습니다.", checks: ["공백·case를 포함한 raw input을 기록합니다.", "name과 label을 출력해 비교합니다.", "parse boundary 위치를 확인합니다."], fix: "명시 fromCode/fromInput parser와 structured unknown result를 둡니다.", prevention: "UI label, source name, external code를 세 열로 문서화합니다." },
      ],
      expertNotes: ["enum의 닫힌 집합은 compiler exhaustiveness에 유리하지만 runtime plugin이 새 값을 추가해야 하는 축에는 부적합합니다.", "EnumSet과 EnumMap은 ordinal 내부 최적화를 안전하게 캡슐화하므로 직접 ordinal-indexed array보다 우선 검토합니다."],
    },
    {
      id: "enum-behavior-and-switch-contracts",
      title: "constant별 behavior와 exhaustive switch를 사용하되 business 변화 축을 enum에 과적재하지 않습니다",
      lead: "if/else와 외부 switch를 흩뜨리지 않고 behavior를 constant 가까이 두며, 닫힌 축과 열린 전략 축을 구분합니다.",
      explanations: [
        "enum은 abstract instance method를 선언하고 각 constant-specific class body가 구현할 수 있습니다. constant마다 계산식이 다르고 집합이 정말 닫혀 있을 때 conditional을 한곳에 모으는 강력한 방법입니다.",
        "공통 behavior는 enum method 하나로 구현하고 fields로 parameterize하는 편이 중복이 적습니다. constant-specific body는 algorithm 구조 자체가 다를 때 쓰며, 작은 숫자 차이만 있다면 rate field가 더 읽기 쉽습니다.",
        "Java21 switch expression은 enum 모든 constants를 나열하면 default 없이 값을 반환할 수 있습니다. compiler가 source 시점의 exhaustiveness를 검사하고 누락 case를 알려 줍니다.",
        "별도 compilation에서 enum에 새 constant가 추가되고 오래된 switch binary가 그것을 받는 evolution 상황은 source exhaustiveness만으로 끝나지 않습니다. library/application을 함께 rebuild하고 compatibility test를 둡니다.",
        "default를 무조건 추가하면 새 constant가 기존 fallback으로 조용히 처리되어 business 누락을 숨길 수 있습니다. forward compatibility가 필요한 external unknown과 내부 enum constant 누락은 다른 문제입니다.",
        "enum이 repository·network client·mutable cache까지 직접 보유하면 global singleton state와 test order coupling이 생깁니다. 값별 pure policy는 enum에, 외부 I/O와 환경 의존은 injected strategy/service에 둡니다.",
        "constant-specific anonymous subclasses의 runtime class 이름이나 getClass equality에 기대지 않습니다. public contract는 enum type, constant identity, method result이며 구현 class shape는 compiler detail입니다.",
      ],
      concepts: [
        { term: "constant-specific class body", definition: "특정 enum constant 뒤 중괄호에서 그 constant만의 method implementation을 제공하는 body입니다.", detail: ["enum abstract method를 구현할 수 있습니다.", "generated runtime subclass name은 API가 아닙니다."] },
        { term: "exhaustive switch", definition: "가능한 enum constants를 모두 다뤄 compiler가 결과 누락을 검증하는 switch expression입니다.", detail: ["default가 불필요할 수 있습니다.", "새 constant 추가 시 caller rebuild가 중요합니다."] },
        { term: "closed policy axis", definition: "알고리즘 variants가 enum constants 목록과 함께 배포되고 외부 확장이 필요 없는 변화 축입니다.", detail: ["enum behavior에 적합합니다.", "열린 plugin 축은 interface strategy가 더 적합합니다."] },
      ],
      codeExamples: [{
        id: "java-enum-constant-behavior",
        title: "constant-specific 계산과 exhaustive category switch",
        language: "java",
        filename: "EnumConstantBehavior.java",
        purpose: "닫힌 policy axis를 enum polymorphism과 switch expression 두 방식으로 검증합니다.",
        code: String.raw`public class EnumConstantBehavior {
    enum PricePolicy {
        REGULAR { @Override int price(int base) { return base; } },
        MEMBER { @Override int price(int base) { return base * 9 / 10; } },
        EVENT { @Override int price(int base) { return Math.max(0, base - 3_000); } };

        abstract int price(int base);

        String category() {
            return switch (this) {
                case REGULAR -> "standard";
                case MEMBER -> "loyalty";
                case EVENT -> "campaign";
            };
        }
    }

    public static void main(String[] args) {
        for (PricePolicy policy : PricePolicy.values()) {
            System.out.println(policy.name() + ":" + policy.price(10_000) + ":" + policy.category());
        }
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "세 constants가 같은 price contract를 서로 다른 pure calculation으로 구현합니다." },
          { lines: "7-15", explanation: "abstract obligation과 default 없는 exhaustive switch expression을 함께 둡니다." },
          { lines: "18-22", explanation: "values declaration order로 name·price·category를 exact 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("EnumConstantBehavior.java", "EnumConstantBehavior") },
        output: { value: "REGULAR:10000:standard\nMEMBER:9000:loyalty\nEVENT:7000:campaign", explanation: ["각 constant가 singleton receiver로 자기 price method를 dispatch합니다.", "switch는 세 constants를 전부 다뤄 값 category를 반환합니다."] },
        experiments: [
          { change: "PricePolicy에 PARTNER를 추가하고 category case는 추가하지 않습니다.", prediction: "같이 compile하는 source는 switch expression non-exhaustive error로 실패합니다.", result: "default 없는 내부 switch가 새 variant 처리 누락을 빠르게 드러냅니다." },
          { change: "EVENT의 외부 API 호출을 price 안에 직접 넣습니다.", prediction: "enum singleton이 환경·timeout·test order와 결합합니다.", result: "pure value policy와 I/O collaborator를 분리해야 합니다." },
        ],
        sourceRefs: ["jls-enum-classes", "jls-switch-expressions", "jls-enum-constant-body"],
      }],
      diagnostics: [
        { symptom: "새 enum constant가 추가됐는데 일부 화면만 옛 정책으로 처리한다.", likelyCause: "여러 caller의 switch에 permissive default가 흩어져 누락을 숨겼습니다.", checks: ["enum switch usages를 전역 검색합니다.", "default가 새 값을 삼키는지 봅니다.", "모든 consumers가 rebuild됐는지 확인합니다."], fix: "pure behavior를 enum 또는 단일 strategy registry로 모으고 exhaustive tests를 추가합니다.", prevention: "constant 추가 PR checklist에 switch consumers와 mixed-version test를 둡니다." },
        { symptom: "enum test가 순서에 따라 실패한다.", likelyCause: "constant singleton field에 mutable counter/cache/service를 저장했습니다.", checks: ["non-final/mutable fields를 찾습니다.", "test 전후 enum state를 비교합니다.", "parallel test를 실행합니다."], fix: "request state를 method-local immutable value로, services를 caller injection으로 이동합니다.", prevention: "enum에는 stable immutable metadata와 pure behavior만 두는 기준을 사용합니다." },
      ],
      expertNotes: ["constant-specific body는 class inheritance를 숨겨 쓰는 기능이므로 각 constant logic이 커지면 named strategy classes가 탐색성과 unit isolation에서 낫습니다.", "switch exhaustiveness는 compile unit의 enum view 기준입니다. independently deployed binaries의 semantic compatibility까지 자동 보장하지 않습니다."],
    },
    {
      id: "member-inner-enclosing-instance",
      title: "member inner instance는 반드시 한 outer instance에 연결되며 qualified new가 그 소유자를 선택합니다",
      lead: "Ex21·Ex22의 demo.new Inner01을 문법 암기가 아니라 hidden enclosing-instance relation과 object graph로 읽습니다.",
      explanations: [
        "class body의 non-static member class는 inner class입니다. 그 object는 독립 object identity를 갖지만 생성 시 특정 enclosing outer instance와 연결됩니다. Ex22의 demo.new Inner01에서 demo가 바로 그 enclosing instance입니다.",
        "enclosing class 밖에서는 Outer.Inner 변수 type을 쓸 수 있어도 new Outer.Inner()로 만들 수 없습니다. 먼저 outer를 만들고 outer.new Inner(arguments)를 사용합니다. outer instance method 안에서는 compiler가 현재 Outer.this를 알고 있어 new Inner()로 줄일 수 있습니다.",
        "inner method의 unqualified member lookup은 먼저 local/inner members를 찾고, 없으면 lexical enclosing instances 쪽으로 갑니다. 따라서 Ex21 Inner01은 상속받지 않았어도 outer의 private age와 sound에 접근합니다. 이것은 inheritance의 protected/private 규칙과 다른 lexical nesting access입니다.",
        "inner object가 outer private field를 읽는 기능은 source-level access control이고, modern JVM class files에서는 nestmate metadata를 통해 구현될 수 있습니다. compiler가 synthetic accessor를 만들지 여부를 public contract로 test하지 않습니다.",
        "한 outer에 여러 inner objects를 만들면 outer state는 공유하지만 각 inner fields는 독립입니다. 서로 다른 outer에서 만든 inner objects는 같은 Inner class type이어도 다른 enclosing state를 읽습니다. equality와 hashCode가 outer identity를 포함해야 하는지 domain별로 결정합니다.",
        "inner를 public API로 반환하면 caller가 outer lifetime과 construction protocol을 알아야 하고 generic signatures도 복잡해집니다. outer 구현 helper라면 private inner로 숨기고 interface view만 반환하는 편이 결합이 작습니다.",
        "inner class가 outer state를 전혀 읽지 않는다면 static nested class가 더 정확합니다. implicit reference 하나가 사라져 생성·테스트·직렬화·수명 모델이 단순해집니다.",
      ],
      concepts: [
        { term: "enclosing instance", definition: "inner object가 lexical outer members를 해석하기 위해 연결해 두는 특정 outer object입니다.", detail: ["inner object마다 하나가 선택됩니다.", "outer object retention의 원인이 될 수 있습니다."] },
        { term: "qualified class instance creation", definition: "outerExpression.new Inner() 형태로 새 inner가 연결될 enclosing object를 명시하는 생성식입니다.", detail: ["Outer.Inner는 type qualification입니다.", "outer.new는 instance qualification입니다."] },
        { term: "nestmate access", definition: "같은 top-level nest의 classes가 서로 private members에 접근하도록 JVM이 표현하는 관계입니다.", detail: ["상속이 아닙니다.", "synthetic implementation detail에 의존하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-member-inner-link",
        title: "서로 다른 outer와 inner의 소유 관계·독립 state를 확인합니다",
        language: "java",
        filename: "MemberInnerLink.java",
        purpose: "qualified new가 선택한 outer state와 inner별 state를 exact output으로 분리합니다.",
        code: String.raw`public class MemberInnerLink {
    static final class Account {
        private final String id;
        private int balance;

        Account(String id, int balance) {
            this.id = id;
            this.balance = balance;
        }

        final class Ledger {
            private final String tag;

            Ledger(String tag) { this.tag = tag; }

            String debit(int amount) {
                balance -= amount;
                return Account.this.id + ":" + balance + ":" + this.tag;
            }
        }
    }

    public static void main(String[] args) {
        Account first = new Account("A", 100);
        Account second = new Account("B", 200);
        Account.Ledger firstLedger = first.new Ledger("one");
        Account.Ledger secondLedger = second.new Ledger("two");
        Account.Ledger anotherFirstLedger = first.new Ledger("three");
        System.out.println(firstLedger.debit(10));
        System.out.println(secondLedger.debit(5));
        System.out.println(anotherFirstLedger.debit(20));
    }
}`,
        walkthrough: [
          { lines: "2-9", explanation: "Account가 private id와 mutable balance를 소유합니다." },
          { lines: "11-20", explanation: "Ledger는 자기 tag와 implicit Account relation을 가지며 qualified Account.this로 shadowing 없이 id를 읽고 enclosing balance를 변경합니다." },
          { lines: "23-28", explanation: "두 outer instances를 만들고 first에 두 ledgers, second에 한 ledger를 qualified new로 연결합니다." },
          { lines: "29-32", explanation: "세 debit 호출에서 first balance는 두 inner가 공유해100→90→70, second는 독립적으로200→195가 됩니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("MemberInnerLink.java", "MemberInnerLink") },
        output: { value: "A:90:one\nB:195:two\nA:70:three", explanation: ["같은 first outer에 연결된 두 ledgers가 balance를 공유합니다.", "secondLedger는 다른 enclosing Account의 state만 변경합니다."] },
        experiments: [
          { change: "first.new Ledger 대신 second.new Ledger로 anotherFirstLedger를 만듭니다.", prediction: "마지막 id가 B이고 second balance가175가 됩니다.", result: "inner variable 이름이 아니라 qualified new receiver가 enclosing identity를 결정합니다." },
          { change: "Ledger가 Account fields를 전혀 읽지 않게 리팩터링합니다.", prediction: "static nested로 바꾸고 new Account.Ledger만으로 생성할 수 있습니다.", result: "outer linkage가 필요 없는 nested helper는 static이 의도를 더 잘 표현합니다." },
        ],
        sourceRefs: ["java-class06-ex21", "java-class06-ex22", "jls-inner-classes", "jls-qualified-class-creation", "jvms-nestmates"],
      }],
      diagnostics: [
        { symptom: "non-static inner를 new Outer.Inner()로 만들자 enclosing instance 오류가 난다.", likelyCause: "type qualifier와 required outer object를 혼동했습니다.", checks: ["Inner declaration에 static이 있는지 봅니다.", "생성과 호출이 outer instance context 안인지 봅니다.", "어느 outer state를 읽어야 하는지 정합니다."], fix: "밖에서는 outer.new Inner(), 안에서는 new Inner()를 사용하거나 linkage가 불필요하면 static nested로 바꿉니다.", prevention: "object graph에 Inner→Outer edge를 그린 뒤 생성 API를 정합니다." },
        { symptom: "inner가 읽는 balance가 예상한 account와 다르다.", likelyCause: "다른 outer expression으로 만든 inner를 재사용했습니다.", checks: ["qualified new receiver를 추적합니다.", "inner factory가 this를 암묵 사용했는지 봅니다.", "outer id를 domain trace에 포함합니다."], fix: "outer factory method로 inner 생성 지점을 캡슐화하고 interface view에 owner id를 검증합니다.", prevention: "서로 다른 two-outers/two-inners test를 기본 conformance case로 둡니다." },
      ],
      expertNotes: ["Inner→Outer hidden edge는 domain aggregate ownership에 맞으면 강점이고 장기 cache/listener가 inner만 저장하면 retention 위험입니다.", "private access 가능 여부와 thread safety는 별개입니다. shared outer mutable state에는 여전히 synchronization 또는 confinement가 필요합니다."],
    },
    {
      id: "shadowing-and-qualified-this",
      title: "local·inner this·Outer.this의 세 이름 공간을 눈으로 풀어 shadowing 실수를 제거합니다",
      lead: "Ex21과 Ex01의 반복 이름을 nearest declaration 규칙과 명시적 receiver ladder로 해석합니다.",
      explanations: [
        "inner method 안에서 simple name을 쓰면 lexical scope의 가장 가까운 선언이 선택됩니다. method local이 inner field를 가리고, inner field가 outer field를 가립니다. 같은 철자라도 세 storage locations는 서로 다른 값입니다.",
        "this.name의 this는 현재 inner object입니다. inner method에서 outer object를 가리키려면 OuterClass.this.name을 씁니다. Ex21 play01의 name, this.name, Ex21_MemberInnerClass.this.name이 local→inner→outer 순서를 보여 줍니다.",
        "Ex01 local class의 like도 name·age·cnt·addr를 각 level에 반복해 같은 ladder를 연습합니다. unqualified name/age/cnt/addr는 like method locals이고, this.*는 Inner02 fields, qualified outer this는 Ex01 object fields입니다.",
        "outer method local과 local-class method local은 또 다른 scopes입니다. Ex01 play의 age147은 local class like 안에서 이름이 가려져 직접 쓰이지 않습니다. capture가 필요한 값은 서로 구별되는 의도 이름으로 바꾸는 편이 교육 예제 밖에서는 더 안전합니다.",
        "qualified this는 inheritance의 super와 다릅니다. Inner.this도 명시할 수 있고 Outer.this는 lexical enclosing object를 선택하며, Base.super는 inherited implementation을 선택합니다.",
        "shadowing은 합법이지만 code review 비용이 큽니다. domain code에서는 outer userId, draft userId, local userId를 모두 id로 두기보다 accountId·draftId처럼 역할을 드러냅니다.",
        "정적 분석에서 hidden-field 경고를 켜고, output test는 단순 문자열 나열보다 level 이름을 붙여 어떤 receiver가 읽혔는지 고정합니다.",
      ],
      concepts: [
        { term: "shadowing", definition: "안쪽 scope의 같은 이름 선언이 바깥 declaration의 simple-name 접근을 가리는 현상입니다.", detail: ["바깥 값이 삭제되는 것은 아닙니다.", "qualified receiver로 여전히 접근할 수 있습니다."] },
        { term: "Inner.this", definition: "현재 inner instance를 명시하는 qualified this입니다.", detail: ["보통 plain this와 같습니다.", "nested anonymous/local contexts에서 receiver를 명확히 할 수 있습니다."] },
        { term: "Outer.this", definition: "현재 inner/local/anonymous object를 둘러싼 특정 lexical outer instance를 가리키는 표현입니다.", detail: ["outer private members에도 접근할 수 있습니다.", "static nested context에는 enclosing instance가 없어 사용할 수 없습니다."] },
      ],
      codeExamples: [{
        id: "java-shadow-ladder",
        title: "simple name·this·qualified Outer.this를 한 줄씩 표시합니다",
        language: "java",
        filename: "ShadowLadder.java",
        purpose: "세 storage levels의 name resolution을 label이 있는 exact output으로 검증합니다.",
        code: String.raw`public class ShadowLadder {
    private final String name = "outer";

    final class Inner {
        private final String name = "inner";

        void print() {
            String name = "local";
            System.out.println("simple=" + name);
            System.out.println("this=" + this.name);
            System.out.println("innerThis=" + Inner.this.name);
            System.out.println("outerThis=" + ShadowLadder.this.name);
        }
    }

    public static void main(String[] args) {
        ShadowLadder outer = new ShadowLadder();
        outer.new Inner().print();
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "outer와 inner가 의도적으로 같은 field name을 가집니다." },
          { lines: "7-13", explanation: "method local이 simple name을, plain/qualified inner this가 inner field를, outer-qualified this가 outer field를 선택합니다." },
          { lines: "16-19", explanation: "qualified new로 Inner를 outer에 연결한 뒤 ladder를 실행합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ShadowLadder.java", "ShadowLadder") },
        output: { value: "simple=local\nthis=inner\ninnerThis=inner\nouterThis=outer", explanation: ["simple name은 nearest local입니다.", "plain this와 Inner.this는 같은 inner, ShadowLadder.this만 outer입니다."] },
        experiments: [
          { change: "method local name 선언을 제거합니다.", prediction: "simple=name은 inner field를 찾아 inner를 출력합니다.", result: "simple-name lookup은 nearest available declaration로 한 단계 바깥 이동합니다." },
          { change: "Inner를 static nested class로 바꿉니다.", prediction: "ShadowLadder.this가 no enclosing instance compiler error가 됩니다.", result: "qualified outer this는 implicit enclosing relation이 있을 때만 존재합니다." },
        ],
        sourceRefs: ["java-class06-ex21", "java-class06-ex22", "java-class07-ex01", "java-class07-ex02", "jls-shadowing", "jls-qualified-this"],
      }],
      diagnostics: [
        { symptom: "this.name이 outer field라고 생각했지만 inner value가 나온다.", likelyCause: "inner method receiver인 this와 enclosing outer를 같은 object로 보았습니다.", checks: ["runtime receiver class를 확인합니다.", "같은 이름의 fields를 level별로 나열합니다.", "Outer.this를 명시해 비교합니다."], fix: "outer value에는 Outer.this.name을 쓰고 production names는 역할별로 분리합니다.", prevention: "shadow ladder unit test에 receiver label을 포함합니다." },
        { symptom: "unqualified age가 outer private age가 아니라 local 값을 읽는다.", likelyCause: "private 접근 가능성만 보고 lexical nearest-name 규칙을 놓쳤습니다.", checks: ["method parameters/locals부터 바깥순으로 찾습니다.", "this.age와 Outer.this.age를 각각 출력합니다.", "IDE shadow warning을 확인합니다."], fix: "명시적 receiver를 붙이고 불필요한 same-name declarations를 rename합니다.", prevention: "세 level 이상 같은 이름을 금지하는 review convention을 둡니다." },
      ],
      expertNotes: ["qualified this는 가독성을 위한 장식이 아니라 lexical object graph의 특정 node를 선택하는 표현입니다.", "reflection Field lookup은 Java source simple-name lookup과 규칙이 다르므로 shadowing behavior test를 reflection으로 대체하지 않습니다."],
    },
    {
      id: "local-class-scope-capture-and-escape",
      title: "local class declaration의 scope는 method에 갇히지만 만들어진 object의 lifetime은 method return 뒤에도 이어질 수 있습니다",
      lead: "원본의 ‘method 종료 시 local inner class도 사라진다’를 type-name scope와 heap object reachability로 정확히 교정합니다.",
      explanations: [
        "local class는 block 안에 선언된 named class입니다. 그 simple type name은 선언이 보이는 lexical block 밖에서 사용할 수 없습니다. Ex02가 Ex01의 Inner02 type을 직접 선언하거나 qualified new하지 못하고 play를 호출해야 하는 이유입니다.",
        "type name이 scope 밖이라는 사실은 object가 즉시 파괴된다는 뜻이 아닙니다. local object를 interface/supertype reference로 return하거나 collection/callback에 저장하면 caller가 참조하는 동안 method return 뒤에도 살아 있습니다.",
        "local class body가 enclosing method의 local variable 또는 parameter를 읽으려면 그것이 final 또는 effectively final이어야 합니다. 한 번 초기화 뒤 다시 대입하지 않았다는 compile-time property이며 object 내부 state가 immutable이라는 뜻은 아닙니다.",
        "capture implementation은 필요한 값을 generated fields/constructor arguments로 보존할 수 있습니다. field 이름과 synthetic 여부는 compiler detail이므로 behavior와 final/effectively-final compile contract를 test합니다.",
        "captured reference가 큰 graph, request context, UI window를 가리키고 local object가 long-lived registry에 저장되면 예상보다 오래 유지됩니다. 필요한 scalar/id만 복사하거나 lifecycle-aware unregister를 둡니다.",
        "local class는 여러 methods·fields·constructor를 가진 block-local helper에 적합합니다. 단일 abstract method 한 동작만 필요하면 lambda가 더 작고, 재사용·독립 test가 필요하면 private static nested/named top-level class가 낫습니다.",
        "local class의 binary name에는 번호가 포함될 수 있고 source edit로 바뀔 수 있습니다. logging/debug 외 persistence, authorization, protocol discriminator로 쓰지 않습니다.",
      ],
      concepts: [
        { term: "lexical scope", definition: "source에서 선언 이름을 직접 사용할 수 있는 text 영역입니다.", detail: ["local class name은 block 내부에 제한됩니다.", "object reachability와 별개입니다."] },
        { term: "effectively final", definition: "final keyword가 없어도 초기화 뒤 다시 대입되지 않아 capture가 허용되는 local variable/parameter입니다.", detail: ["reference 재대입 금지입니다.", "referenced mutable object의 내부 변경까지 막지 않습니다."] },
        { term: "escaping local object", definition: "local class instance가 supertype/interface reference 등을 통해 declaring invocation 밖으로 전달되는 object입니다.", detail: ["method 종료 뒤에도 사용할 수 있습니다.", "captures와 enclosing objects를 함께 retain할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-escaping-local-class",
        title: "method가 반환된 뒤에도 captured values를 읽는 local object",
        language: "java",
        filename: "EscapingLocalClass.java",
        purpose: "declaration scope 종료와 object lifetime 지속을 interface view로 직접 증명합니다.",
        code: String.raw`public class EscapingLocalClass {
    interface Reader { String read(); }

    static Reader create(String prefix) {
        int version = 7;
        class SnapshotReader implements Reader {
            @Override
            public String read() {
                return prefix + ":v" + version;
            }
        }
        return new SnapshotReader();
    }

    public static void main(String[] args) {
        Reader escaped = create("guide");
        System.out.println(escaped.read());
        System.out.println(escaped.getClass().isLocalClass());
        System.out.println(escaped instanceof Reader);
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "caller가 볼 stable Reader interface와 effectively-final parameter/local을 선언합니다." },
          { lines: "6-12", explanation: "block-local named class가 두 values를 capture하고 interface view로 escape합니다." },
          { lines: "15-19", explanation: "create invocation이 끝난 뒤 read가 성공하며 reflection으로 local class shape를 stable boolean으로 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("EscapingLocalClass.java", "EscapingLocalClass") },
        output: { value: "guide:v7\ntrue\ntrue", explanation: ["declaring method return 뒤에도 object와 captures가 reachable합니다.", "generated name 대신 isLocalClass와 interface behavior를 검사합니다."] },
        experiments: [
          { change: "return 전에 version++를 추가합니다.", prediction: "captured local이 effectively final이 아니어서 compile 실패합니다.", result: "capture 조건은 runtime lifetime이 아니라 compile-time reassignment 규칙입니다." },
          { change: "prefix를 담은 StringBuilder 내부를 return 뒤 변경합니다.", prediction: "reference는 effectively final이어도 reader가 변경된 contents를 볼 수 있습니다.", result: "effectively final은 deep immutability를 뜻하지 않습니다." },
        ],
        sourceRefs: ["java-class07-ex01", "java-class07-ex02", "jls-local-class", "jls-capture", "java-class-is-local"],
      }],
      diagnostics: [
        { symptom: "local object를 return할 수 없다고 설명했다.", likelyCause: "local class type name의 scope와 instance reference lifetime을 합쳤습니다.", checks: ["return type이 interface/supertype인지 봅니다.", "object가 caller에서 reachable한지 봅니다.", "isLocalClass와 behavior를 확인합니다."], fix: "type name은 block-local이지만 object는 supertype view로 escape할 수 있다고 교정합니다.", prevention: "scope, lifetime, visibility를 서로 다른 세 항목으로 문서화합니다." },
        { symptom: "captured variable 관련 compile error가 난다.", likelyCause: "선언 후 증가·재대입해 effectively-final 조건을 깨뜨렸습니다.", checks: ["모든 assignments를 검색합니다.", "loop variable/parameter reassignment를 봅니다.", "mutable holder 우회가 올바른 shared state인지 검토합니다."], fix: "필요한 final snapshot을 만들거나 state ownership을 명시한 object로 옮깁니다.", prevention: "capture는 immutable snapshot 우선, mutation은 explicit collaborator 우선으로 설계합니다." },
      ],
      expertNotes: ["escape analysis 최적화 여부와 Java language lifetime 의미를 혼동하지 않습니다. JIT가 allocation을 제거해도 observable behavior는 유지됩니다.", "local class가 serializable interface를 우연히 구현해도 captured fields와 generated binary name 때문에 durable serialized form으로 취급하지 않습니다."],
    },
    {
      id: "static-nested-no-implicit-outer",
      title: "static nested class는 namespace에 중첩되지만 implicit outer object를 갖지 않습니다",
      lead: "Ex03·Ex04의 Outer.Inner03 생성과 Java21에서 교정해야 할 과거 static-member 규칙을 함께 정리합니다.",
      explanations: [
        "static member class를 보통 static inner class라고 부르지만 JLS 용어로는 static nested class이며 inner class가 아닙니다. Inner는 explicitly/implicitly static이 아닌 nested class를 뜻합니다.",
        "static nested object는 new Outer.Nested()로 outer instance 없이 생성합니다. outer static members에는 type qualification으로 접근할 수 있지만 outer instance fields에는 implicit receiver가 없어 직접 접근할 수 없습니다.",
        "Ex03 Inner03.prn은 outer static cnt14와 자기 instance addr, 자기 static room5를 읽습니다. Ex04는 Outer.Inner03.room으로 static field를 읽고 new Outer.Inner03()로 instance method를 실행합니다.",
        "원본 주석의 ‘inner class에 static member가 하나라도 있으면 inner class를 static으로 해야 한다’는 과거 규칙을 Java21에 그대로 적용하면 틀립니다. Java16부터 inner classes도 static members와 static initializers를 선언할 수 있습니다.",
        "member inner에 static field가 있다는 사실이 implicit outer relation을 없애지 않습니다. class declaration 자체에 static이 있는지로 static nested와 inner를 구분합니다. Java reflection에서는 member class modifiers의 static bit를 검사합니다.",
        "outer instance가 필요 없는 DTO, builder, comparator, factory helper는 static nested가 기본 선택입니다. outer private static members에는 lexical access하면서 lifetime coupling은 만들지 않습니다.",
        "static nested라고 global singleton인 것은 아닙니다. 매 new마다 독립 instance가 생기며 nested static fields만 class-wide shared state입니다. thread safety는 static/nested modifier가 자동 제공하지 않습니다.",
      ],
      concepts: [
        { term: "static nested class", definition: "static modifier가 붙은 member class로 enclosing instance 없이 생성되는 nested type입니다.", detail: ["Outer.Nested로 type을 찾습니다.", "outer instance members에는 implicit access가 없습니다."] },
        { term: "inner class", definition: "explicitly 또는 implicitly static이 아닌 nested class입니다.", detail: ["member inner, local, anonymous cases가 있습니다.", "Java21에는 static members도 선언할 수 있습니다."] },
        { term: "static member after Java16", definition: "modern Java inner class도 static fields/methods/initializers를 선언할 수 있도록 완화된 language rule입니다.", detail: ["그 class가 static nested로 변하는 것은 아닙니다.", "target release가 오래되면 compile 가능성이 달라집니다."] },
      ],
      codeExamples: [{
        id: "java-static-nested-boundary",
        title: "static nested 생성과 Java21 inner static member를 나란히 실행합니다",
        language: "java",
        filename: "StaticNestedBoundary.java",
        purpose: "declaration static 여부와 contained static member 존재를 구분합니다.",
        code: String.raw`import java.lang.reflect.Modifier;

public class StaticNestedBoundary {
    private int instanceValue = 7;
    private static int sharedValue = 11;

    static final class Nested {
        int plus(int value) { return sharedValue + value; }
    }

    final class Inner {
        static int counter = 5;
        int read() { return instanceValue + counter; }
    }

    public static void main(String[] args) {
        Nested nested = new Nested();
        System.out.println(nested.plus(3));
        System.out.println(Inner.counter);
        System.out.println(new StaticNestedBoundary().new Inner().read());
        System.out.println(Modifier.isStatic(Nested.class.getModifiers()));
        System.out.println(Modifier.isStatic(Inner.class.getModifiers()));
    }
}`,
        walkthrough: [
          { lines: "4-9", explanation: "Nested는 implicit outer 없이 outer static sharedValue만 읽습니다." },
          { lines: "11-14", explanation: "Inner는 non-static member class지만 Java21에서 static counter를 합법적으로 선언하고 outer instanceValue를 읽습니다." },
          { lines: "17-23", explanation: "생성 syntax와 reflection static bit를 behavior output과 함께 비교합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StaticNestedBoundary.java", "StaticNestedBoundary") },
        output: { value: "14\n5\n12\ntrue\nfalse", explanation: ["Nested는 outer 없이11+3을 계산합니다.", "Inner.counter는 합법이지만 Inner class modifiers의 static bit는 false이고 instance 생성에는 outer가 필요합니다."] },
        experiments: [
          { change: "Nested.plus에서 instanceValue를 unqualified로 읽습니다.", prediction: "non-static variable cannot be referenced from a static context 계열 compile error가 납니다.", result: "lexical nesting이 implicit instance receiver를 자동 만들지 않습니다." },
          { change: "--release 15로 같은 source를 compile합니다.", prediction: "Inner의 non-constant static field가 old release rule과 충돌할 수 있습니다.", result: "언어 설명과 build target release를 함께 명시해야 합니다." },
        ],
        sourceRefs: ["java-class07-ex03", "java-class07-ex04", "jls-inner-classes", "jls-static-members-inner-change", "java-reflection-modifier"],
      }],
      diagnostics: [
        { symptom: "static nested method에서 outer instance field를 직접 읽을 수 없다.", likelyCause: "namespace nesting을 enclosing object relation으로 오해했습니다.", checks: ["nested declaration의 static bit를 확인합니다.", "어떤 object의 field인지 receiver를 정합니다.", "instance를 argument로 받아야 하는지 봅니다."], fix: "필요한 outer를 constructor/parameter로 명시 전달하거나 실제 member inner가 맞으면 non-static으로 바꿉니다.", prevention: "implicit dependencies보다 constructor-visible dependencies를 우선합니다." },
        { symptom: "Java21에서 inner static field가 compile되는데 문서에는 불가능하다고 적혀 있다.", likelyCause: "Java16 이전 규칙을 현재 target에 적용했습니다.", checks: ["javac --release 값을 확인합니다.", "class declaration static과 member static을 분리합니다.", "JLS version을 확인합니다."], fix: "Java21 규칙과 legacy target 차이를 명시하고 reflection으로 class static bit를 검증합니다.", prevention: "버전에 민감한 language rule은 target release와 primary spec을 함께 기록합니다." },
      ],
      expertNotes: ["static nested는 outer namespace의 encapsulation을 얻되 hidden object reference는 갖지 않는 조합입니다.", "Kotlin/C#/Java 등 언어마다 nested/inner default가 다르므로 다른 언어 직관을 Java에 그대로 옮기지 않습니다."],
    },
    {
      id: "anonymous-class-expression-and-contract",
      title: "anonymous class는 expression 자리에서 이름 없는 subtype을 선언하고 즉시 그 instance를 만듭니다",
      lead: "Ex09의 세 anonymous expressions와 named Car/Baseball을 비교해 일회성 구현의 장점과 구조적 한계를 정합니다.",
      explanations: [
        "new Ex08() { ... }는 interface 자체를 new하는 예외가 아닙니다. expression 안에서 이름 없는 implementing class를 선언하고 required play를 구현한 뒤 그 object를 생성합니다.",
        "Ex09 source에는 anonymous expressions가 세 개 있습니다. 첫 carousel은 항상 실행되고, su==1 branch의 anonymous car가 실행되며, su==2 else의 anonymous baseball도 compile되지만 이번 run에는 생성되지 않습니다.",
        "anonymous class는 explicit constructor를 선언할 이름이 없습니다. instance initializer와 superclass constructor arguments는 가능하지만 initialization이 복잡하면 named local/member/top-level class가 더 읽기 쉽습니다.",
        "anonymous object는 fields와 추가 methods를 가질 수 있지만 reference가 interface Ex08이면 caller는 interface surface만 봅니다. cast로 숨은 methods를 꺼내 쓰는 설계는 static type contract를 우회합니다.",
        "한 곳에서 짧게 쓰는 test double, adapter, callback에는 적합합니다. 같은 behavior가 두 번 나오거나 상태·오류 처리·문서화가 커지면 named class 또는 lambda/factory로 승격합니다.",
        "getClass().getName 출력은 generated numbering을 노출해 source edit·compiler에 따라 바뀝니다. behavior, interface assignability, Class.isAnonymousClass 같은 stable predicates를 test합니다.",
        "anonymous class body도 lexical outer this와 local captures를 가질 수 있지만 anonymous body 안 plain this는 anonymous object입니다. lambda와 가장 자주 혼동되는 차이는 다음 장에서 실행합니다.",
      ],
      concepts: [
        { term: "anonymous class declaration", definition: "class instance creation expression의 body에서 이름 없는 class를 선언하는 문법입니다.", detail: ["interface를 implement하거나 class를 extend합니다.", "expression이 동시에 instance를 만듭니다."] },
        { term: "static type surface", definition: "reference declared type을 통해 compile-time에 호출 가능한 members 집합입니다.", detail: ["anonymous 추가 methods는 interface view에서 보이지 않습니다.", "필요한 behavior는 역할 interface에 선언합니다."] },
        { term: "structural predicate", definition: "generated name 문자열 대신 isAnonymousClass·isLocalClass·isMemberClass 등 의미를 직접 묻는 reflection test입니다.", detail: ["compiler numbering에 독립적입니다.", "behavior contract와 함께 사용합니다."] },
      ],
      codeExamples: [{
        id: "java-anonymous-dispatch",
        title: "named·anonymous 구현을 같은 dispatcher에 전달합니다",
        language: "java",
        filename: "AnonymousDispatch.java",
        purpose: "anonymous expression이 interface implementation object임을 behavior와 reflection으로 검증합니다.",
        code: String.raw`public class AnonymousDispatch {
    interface Action { String run(); }

    static final class NamedAction implements Action {
        @Override public String run() { return "named"; }
    }

    static String dispatch(Action action) { return action.run(); }

    public static void main(String[] args) {
        Action anonymous = new Action() {
            @Override public String run() { return "anonymous"; }
        };
        System.out.println(dispatch(new NamedAction()));
        System.out.println(dispatch(anonymous));
        System.out.println(anonymous.getClass().isAnonymousClass());
        System.out.println(anonymous instanceof Action);
    }
}`,
        walkthrough: [
          { lines: "2-8", explanation: "같은 Action contract의 named implementation과 polymorphic dispatcher를 선언합니다." },
          { lines: "11-13", explanation: "anonymous class body가 run obligation을 완성하고 instance를 Action view에 저장합니다." },
          { lines: "14-18", explanation: "named/anonymous behavior, structural anonymous predicate, assignability를 네 행으로 exact 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("AnonymousDispatch.java", "AnonymousDispatch") },
        output: { value: "named\nanonymous\ntrue\ntrue", explanation: ["dispatcher는 implementation shape와 무관하게 Action만 호출합니다.", "generated class name 없이 anonymous subtype과 interface 관계를 확인합니다."] },
        experiments: [
          { change: "anonymous body에서 run override를 제거합니다.", prediction: "anonymous class가 abstract obligation을 구현하지 않아 compile 실패합니다.", result: "interface 자체를 만드는 것이 아니라 concrete anonymous implementer를 만드는 증거입니다." },
          { change: "동일 anonymous body를 두 군데 복사합니다.", prediction: "서로 다른 anonymous classes/objects가 생기고 수정 지점이 중복됩니다.", result: "재사용 신호가 생기면 named class 또는 factory로 추출합니다." },
        ],
        sourceRefs: ["java-class07-ex08", "java-class07-ex09", "jls-anonymous-class", "java-class-is-anonymous"],
      }],
      diagnostics: [
        { symptom: "anonymous object의 추가 method를 Action 변수에서 호출할 수 없다.", likelyCause: "runtime class body와 declared interface surface를 혼동했습니다.", checks: ["reference declared type을 봅니다.", "추가 method가 caller contract여야 하는지 검토합니다.", "불필요한 downcast를 찾습니다."], fix: "필요한 operation을 role interface에 선언하거나 named concrete type을 사용합니다.", prevention: "anonymous body는 override와 private helper 중심으로 제한합니다." },
        { symptom: "anonymous class snapshot이 source 한 줄 추가 뒤 실패한다.", likelyCause: "generated binary name/number를 stable contract로 저장했습니다.", checks: ["$1 같은 names를 golden/DB에서 찾습니다.", "isAnonymousClass로 대체 가능한지 봅니다.", "behavior output을 분리합니다."], fix: "generated name assertion을 제거하고 behavior·assignability·structural predicates를 사용합니다.", prevention: "local/anonymous generated names를 protocol/persistence에 쓰지 않는 규칙을 둡니다." },
      ],
      expertNotes: ["anonymous classes are not lambdas: identity, this, fields, superclass choice, reflection shape가 모두 다릅니다.", "framework가 class annotation/name/constructor를 요구하면 anonymous implementation보다 named static nested class가 호환성과 진단성에서 낫습니다."],
    },
    {
      id: "lambda-alternative-and-lexical-this",
      title: "lambda는 anonymous class 축약형이 아니며 this를 새로 만들지 않는 lexical function object입니다",
      lead: "같은 SAM을 구현해도 plain this·fields·identity·serialization·reflection semantics가 다르므로 짧다는 이유만으로 치환하지 않습니다.",
      explanations: [
        "lambda expression은 target functional interface의 single abstract method implementation을 제공합니다. anonymous class처럼 class body syntax를 쓰지 않고 compiler가 target type context에서 parameter와 return types를 결정합니다.",
        "anonymous class body의 this는 새 anonymous object입니다. 반면 lambda body의 this와 super는 enclosing lexical context의 this와 super를 뜻합니다. lambda는 별도 this binding을 도입하지 않습니다.",
        "두 방식 모두 local variables를 capture할 때 final/effectively-final 조건을 따릅니다. 그러나 anonymous class는 instance fields와 extra helper methods를 가질 수 있고 class를 extend할 수도 있으며 lambda는 functional interface target만 필요합니다.",
        "lambda object identity, object reuse, generated class, serialization form을 application contract로 가정하지 않습니다. 같은 lambda expression 평가가 같은 object를 돌려준다는 보장이 없으므로 ==, identityHashCode, class name에 의존하지 않습니다.",
        "stateless 작은 strategy, comparator, event callback에는 lambda가 의도를 가장 작게 보입니다. stateful lifecycle, multiple methods, explicit constructor, annotation/framework discovery가 필요하면 named class를 선택합니다.",
        "anonymous class가 SAM interface를 구현한다는 이유만으로 자동 변환하지 않습니다. body의 this가 outer를 의도했는지 anonymous self를 의도했는지 먼저 확인합니다. 이 차이는 UI listener 리팩터링에서 특히 subtle한 behavior change를 만듭니다.",
        "checked exception, overload resolution, generic target inference도 target type에 영향을 받습니다. ambiguous overload에서는 variable에 명시적 functional interface type을 주거나 cast/factory로 API를 명확히 합니다.",
      ],
      concepts: [
        { term: "functional interface target", definition: "lambda가 구현할 single abstract method signature를 제공하는 compile-time target type입니다.", detail: ["@FunctionalInterface로 의도를 검증할 수 있습니다.", "Object/default/static methods는 SAM count 방식이 다릅니다."] },
        { term: "lexical this", definition: "lambda가 새 receiver를 만들지 않고 선언을 둘러싼 instance의 this를 그대로 사용하는 규칙입니다.", detail: ["anonymous class this와 다릅니다.", "static context에는 this가 없습니다."] },
        { term: "lambda identity non-contract", definition: "lambda object의 class·allocation·reference identity를 language-level stable API로 가정할 수 없다는 원칙입니다.", detail: ["behavior로 test합니다.", "durable serialization token으로 쓰지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-anonymous-vs-lambda-this",
        title: "anonymous this와 lambda lexical this를 같은 SAM에서 비교합니다",
        language: "java",
        filename: "AnonymousVsLambdaThis.java",
        purpose: "capture는 같지만 this binding은 다르다는 사실을 boolean exact output으로 고정합니다.",
        code: String.raw`public class AnonymousVsLambdaThis {
    @FunctionalInterface
    interface Task { String run(); }

    private final String owner = "outer";

    void demonstrate() {
        String captured = "snapshot";
        Task anonymous = new Task() {
            @Override
            public String run() {
                boolean same = (Object) this == AnonymousVsLambdaThis.this;
                return "anonymous=" + same + ":" + captured;
            }
        };
        Task lambda = () -> "lambda=" + (this == AnonymousVsLambdaThis.this) + ":" + captured;
        System.out.println(anonymous.run());
        System.out.println(lambda.run());
        System.out.println("owner=" + owner);
    }

    public static void main(String[] args) {
        new AnonymousVsLambdaThis().demonstrate();
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "SAM Task와 enclosing object state를 선언합니다." },
          { lines: "7-15", explanation: "anonymous body plain this를 outer-qualified this와 Object view로 비교하면 false입니다." },
          { lines: "16-19", explanation: "lambda plain this는 lexical outer와 같아 true이며 둘 다 captured snapshot을 읽습니다." },
          { lines: "22-24", explanation: "한 enclosing instance에서 두 implementations를 실행합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("AnonymousVsLambdaThis.java", "AnonymousVsLambdaThis") },
        output: { value: "anonymous=false:snapshot\nlambda=true:snapshot\nowner=outer", explanation: ["anonymous class는 새 receiver라 same=false입니다.", "lambda는 lexical this라 same=true이고 두 구현 모두 effectively-final local을 capture합니다."] },
        experiments: [
          { change: "captured에 다시 값을 대입합니다.", prediction: "anonymous와 lambda 양쪽 capture가 compile 실패합니다.", result: "effectively-final 조건은 두 constructs에 공통입니다." },
          { change: "anonymous body의 this 사용을 lambda로 기계 치환합니다.", prediction: "this가 outer를 가리키도록 의미가 바뀝니다.", result: "SAM 호환만으로 refactoring semantic equivalence가 보장되지 않습니다." },
        ],
        sourceRefs: ["java-class07-ex08", "java-class07-ex09", "jls-lambda", "jls-lambda-this", "jls-capture"],
      }],
      diagnostics: [
        { symptom: "anonymous→lambda 리팩터링 뒤 this 기반 equality/logging 대상이 바뀐다.", likelyCause: "anonymous self와 lambda lexical outer를 같은 receiver로 가정했습니다.", checks: ["body의 this/super/unqualified members를 검색합니다.", "Outer.this와 비교하는 test를 만듭니다.", "listener removal이 같은 object reference를 쓰는지 봅니다."], fix: "명시 receiver를 capture하거나 named class를 유지하고 behavior를 재검증합니다.", prevention: "anonymous-to-lambda refactor checklist에 this·fields·identity를 포함합니다." },
        { symptom: "overloaded method에 lambda를 넘기자 호출이 ambiguous하다.", likelyCause: "형태가 같은 여러 functional interface가 target candidates가 됐습니다.", checks: ["overload SAM signatures와 throws를 비교합니다.", "lambda parameter types가 생략됐는지 봅니다.", "명시 target variable로 분리합니다."], fix: "의도한 functional interface variable/factory 또는 명시 cast로 target을 하나로 정합니다.", prevention: "서로 비슷한 SAM overload보다 의미 이름이 있는 methods를 설계합니다." },
      ],
      expertNotes: ["lambda가 stateless처럼 보여도 captured mutable collaborator를 통해 side effect와 race를 가질 수 있습니다.", "익명 class와 lambda 어느 쪽도 장기 저장 callback이면 unregister/ownership protocol이 필요합니다."],
    },
    {
      id: "choose-and-encapsulate-nested-types",
      title: "enum·inner·static nested·local·anonymous·lambda를 변화 축과 ownership 기준으로 선택합니다",
      lead: "문법별 예제를 따로 외운 뒤 끝내지 않고 extension policy, outer dependency, reuse scope, public surface를 한 decision으로 묶습니다.",
      explanations: [
        "가능한 값이 닫혀 있고 각 값이 immutable metadata/pure behavior를 가지면 enum을 선택합니다. 외부 module이 새 implementation을 추가해야 하면 interface+registry/plugin이 더 적합합니다.",
        "helper가 특정 outer instance state와 생명주기를 본질적으로 공유하면 private member inner를 선택할 수 있습니다. outer state를 읽지 않으면 static nested가 기본이며 dependency를 constructor arguments로 보이게 합니다.",
        "한 method block 안에서 여러 methods/state를 가진 named helper가 필요하면 local class, SAM 한 동작이면 lambda, 일회성 subclass body나 multiple overrides가 필요하면 anonymous class를 검토합니다.",
        "public nested type은 단지 파일을 줄이는 구현 detail이 아니라 API binary name Outer$Nested와 accessibility contract가 됩니다. public으로 노출하기 전 독립 top-level type이 더 discoverable한지 비교합니다.",
        "private static nested implementation을 factory가 interface view로 반환하면 callers는 implementation class와 생성 protocol을 모릅니다. enum switch는 closed selection을 한 곳에 모으고, parser implementations는 각각 독립 test할 수 있습니다.",
        "중첩은 source proximity를 주지만 file이 지나치게 커지면 탐색이 어려워집니다. public responsibilities, change ownership, test fixtures가 독립되면 top-level package-private/public file로 분리합니다.",
        "선택 표는 절대 규칙이 아닙니다. 가장 중요한 질문은 누가 state를 소유하고, 누가 variant를 추가하며, object가 얼마나 오래 살고, 어떤 surface를 compatibility contract로 약속하는가입니다.",
      ],
      concepts: [
        { term: "implementation hiding", definition: "caller에게 interface/factory만 공개하고 concrete nested classes와 constructors를 private로 유지하는 설계입니다.", detail: ["교체 비용을 줄입니다.", "reflection/framework 요구가 있으면 제약을 확인합니다."] },
        { term: "variation axis", definition: "서로 독립적으로 추가·변경될 가능성이 있는 behavior 또는 data dimension입니다.", detail: ["closed axis는 enum에 적합할 수 있습니다.", "open axis는 strategy/plugin에 적합합니다."] },
        { term: "ownership-visible construction", definition: "object가 필요한 owner/state dependencies를 constructor/factory signature에서 명시하는 원칙입니다.", detail: ["hidden outer linkage를 의도적으로 제한합니다.", "tests와 lifecycle review가 쉬워집니다."] },
      ],
      codeExamples: [{
        id: "java-nested-factory-design",
        title: "enum selection과 private static nested implementations를 factory 뒤에 숨깁니다",
        language: "java",
        filename: "NestedFactoryDesign.java",
        purpose: "closed format 선택과 implementation hiding을 outer linkage 없이 조합합니다.",
        code: String.raw`public class NestedFactoryDesign {
    enum Format { CSV, JSON }
    interface Parser { String parse(String input); }

    private static final class CsvParser implements Parser {
        @Override public String parse(String input) { return "csv:" + input.split(",").length; }
    }

    private static final class JsonParser implements Parser {
        @Override public String parse(String input) { return "json:" + input.trim().startsWith("{"); }
    }

    static Parser parserFor(Format format) {
        return switch (format) {
            case CSV -> new CsvParser();
            case JSON -> new JsonParser();
        };
    }

    public static void main(String[] args) {
        System.out.println(parserFor(Format.CSV).parse("a,b,c"));
        System.out.println(parserFor(Format.JSON).parse(" { } "));
        System.out.println(CsvParser.class.isMemberClass());
        System.out.println(java.lang.reflect.Modifier.isStatic(CsvParser.class.getModifiers()));
    }
}`,
        walkthrough: [
          { lines: "2-3", explanation: "closed selection key와 caller-facing open behavior contract를 분리합니다." },
          { lines: "5-11", explanation: "implementations는 private static nested라 outer instance와 public constructor를 노출하지 않습니다." },
          { lines: "13-18", explanation: "exhaustive enum switch factory가 selection을 한 곳에 모읍니다." },
          { lines: "21-26", explanation: "behavior와 private implementation의 member/static shape를 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("NestedFactoryDesign.java", "NestedFactoryDesign") },
        output: { value: "csv:3\njson:true\ntrue\ntrue", explanation: ["caller는 Parser contract만 사용합니다.", "CsvParser는 member type이면서 static이라 implicit outer reference가 없습니다."] },
        experiments: [
          { change: "YAML을 외부 plugin이 runtime에 추가해야 한다고 요구합니다.", prediction: "enum+exhaustive switch를 매번 수정해야 해 open extension과 충돌합니다.", result: "Format enum 대신 registration key와 ParserProvider interface를 검토합니다." },
          { change: "CsvParser를 non-static inner로 바꿉니다.", prediction: "parserFor static method가 outer 없이 생성할 수 없고 불필요한 linkage가 생깁니다.", result: "outer state를 쓰지 않는 implementation은 static nested가 적합합니다." },
        ],
        sourceRefs: ["jls-enum-classes", "jls-member-classes", "jls-inner-classes", "jls-switch-expressions"],
      }],
      diagnostics: [
        { symptom: "새 parser를 외부 team이 추가할 때 core enum과 factory를 항상 수정해야 한다.", likelyCause: "열린 extension 축을 닫힌 enum 축으로 모델링했습니다.", checks: ["variant owner와 deployment unit을 확인합니다.", "runtime discovery가 필요한지 봅니다.", "unknown provider policy를 정합니다."], fix: "interface provider registry/ServiceLoader로 열고 built-in keys만 enum으로 둘지 재설계합니다.", prevention: "closed/open extension 결정을 ADR에 기록합니다." },
        { symptom: "public Outer.Inner type 이동이 client binary를 깨뜨린다.", likelyCause: "nested placement를 구현 detail로 보고 public binary name contract를 놓쳤습니다.", checks: ["public/protected nested types를 inventory합니다.", "client signatures에 Outer.Inner가 노출되는지 봅니다.", "old binary test를 실행합니다."], fix: "migration adapter/deprecated alias를 제공하거나 major version에서 이동합니다.", prevention: "public nested type도 top-level public API와 같은 compatibility review를 받습니다." },
      ],
      expertNotes: ["private static nested class는 Java에서 implementation hiding의 가장 실용적인 기본값 중 하나입니다.", "source proximity와 runtime coupling은 독립 축입니다. static nested는 가까이 배치하면서 object linkage는 끊습니다."],
    },
    {
      id: "lifetime-retention-and-serialization",
      title: "hidden outer·captured references는 object graph를 늘리므로 listener·cache·직렬화 경계에서 명시적으로 끊습니다",
      lead: "코드에 field가 보이지 않아도 inner/local/anonymous object가 owner와 captures를 붙잡을 수 있다는 점을 수명 설계에 포함합니다.",
      explanations: [
        "non-static member inner는 enclosing outer를 사용할 수 있어 구현이 그 relation을 보존합니다. long-lived static cache가 inner callback만 저장해도 callback을 통해 outer UI/controller/request graph가 reachable해질 수 있습니다.",
        "local/anonymous class와 lambda도 captured references를 보존할 수 있습니다. 큰 request를 통째로 capture하기보다 필요한 immutable id/value만 snapshot하고, event bus에는 registration token/close/unsubscribe protocol을 둡니다.",
        "GC는 scope가 끝났다는 이유로 object를 수거하지 않고 root로부터 reachability가 끊겼을 때 수거할 수 있습니다. local variable scope, JIT liveness, actual collection timing을 deterministic functional contract로 test하지 않습니다.",
        "non-static inner를 Serializable로 선언하면 implicit outer reference도 object graph serialization 대상이 될 수 있습니다. outer가 Serializable이 아니면 NotSerializableException이 나고, 가능하더라도 의도하지 않은 fields와 graph가 저장될 위험이 있습니다.",
        "local/anonymous classes의 generated binary name과 captured-field shape는 source edit/compiler에 민감하므로 durable serialized forms에 부적합합니다. 명시 top-level/static nested DTO와 stable serialVersionUID/schema를 사용합니다.",
        "enum serialization은 special handling을 받아 constant identity가 name 기반으로 복원되고 ordinary readObject/readResolve customization이 적용되지 않는 특성이 있습니다. enum name rename/removal도 stored stream compatibility에 영향을 주므로 stable external DTO/code가 더 나을 수 있습니다.",
        "WeakReference를 넣는 것만으로 lifecycle이 해결되지 않습니다. callback이 실행될 때 owner 부재 정책, thread safety, cleanup timing이 필요합니다. 명시 unsubscribe와 owner-scoped registry가 우선이고 weak listener는 보조 전략입니다.",
      ],
      concepts: [
        { term: "retention path", definition: "GC root에서 references를 따라 object가 reachable하게 유지되는 경로입니다.", detail: ["registry→inner callback→outer owner가 예입니다.", "source-visible fields만으로 판단하지 않습니다."] },
        { term: "serialization graph", definition: "root object를 직렬화할 때 reachable Serializable fields를 따라 포함되는 object 집합입니다.", detail: ["inner의 enclosing reference가 graph를 확장할 수 있습니다.", "durable DTO는 graph를 명시적으로 제한합니다."] },
        { term: "lifecycle protocol", definition: "register한 callback/resource를 누가 언제 unregister/close하는지 정한 ownership 계약입니다.", detail: ["AutoCloseable token을 쓸 수 있습니다.", "exception/cancellation paths도 포함합니다."] },
      ],
      codeExamples: [{
        id: "java-nested-serialization-boundary",
        title: "enum identity 복원과 non-serializable outer를 가진 inner 실패를 비교합니다",
        language: "java",
        filename: "NestedSerializationBoundary.java",
        purpose: "serialization이 hidden enclosing relation까지 따라가는 위험을 exact booleans로 확인합니다.",
        code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.NotSerializableException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class NestedSerializationBoundary {
    enum State { READY }

    static final class Owner {
        final class Inner implements Serializable {
            private static final long serialVersionUID = 1L;
        }
    }

    static byte[] serialize(Object value) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ObjectOutputStream output = new ObjectOutputStream(bytes)) {
            output.writeObject(value);
        }
        return bytes.toByteArray();
    }

    public static void main(String[] args) throws Exception {
        byte[] stateBytes = serialize(State.READY);
        Object restored;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(stateBytes))) {
            restored = input.readObject();
        }
        System.out.println(restored == State.READY);

        boolean outerRejected = false;
        try {
            serialize(new Owner().new Inner());
        } catch (NotSerializableException expected) {
            outerRejected = expected.getMessage().equals(Owner.class.getName());
        }
        System.out.println(outerRejected);
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "in-memory stream APIs와 singleton enum을 준비합니다." },
          { lines: "11-15", explanation: "Inner만 Serializable이고 enclosing Owner는 Serializable이 아닌 의도적 경계 fixture입니다." },
          { lines: "17-23", explanation: "모든 object를 동일 helper로 byte array에 직렬화합니다." },
          { lines: "26-32", explanation: "enum을 round-trip하고 reference identity가 유지됨을 검사합니다." },
          { lines: "34-41", explanation: "inner serialization이 enclosing Owner까지 따라가 실패한 정확한 type을 boolean으로 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("NestedSerializationBoundary.java", "NestedSerializationBoundary") },
        output: { value: "true\ntrue", explanation: ["enum constant는 special serialization identity가 유지됩니다.", "Serializable inner가 non-serializable enclosing Owner reference 때문에 거부됩니다."] },
        experiments: [
          { change: "Inner를 static nested class로 바꿉니다.", prediction: "implicit Owner reference가 없어 별도 non-serializable fields가 없다면 serialization이 성공합니다.", result: "outer state 불필요한 durable value는 static nested DTO가 안전합니다." },
          { change: "Owner도 Serializable로 만듭니다.", prediction: "성공할 수 있지만 Owner graph 전체가 stream에 포함될 수 있습니다.", result: "오류 제거가 곧 올바른 schema 경계는 아닙니다." },
        ],
        sourceRefs: ["jls-inner-classes", "jls-reachability", "java-serialization-enum", "java-serializable", "java-not-serializable"],
      }],
      diagnostics: [
        { symptom: "화면을 닫아도 memory profiler에서 controller가 계속 살아 있다.", likelyCause: "global listener registry가 member inner/anonymous callback을 통해 outer를 retain합니다.", checks: ["GC root path를 확인합니다.", "register와 unregister 수를 비교합니다.", "callback captures/inner owner를 봅니다."], fix: "owner close에서 idempotent unregister하고 static nested callback+minimal explicit state로 바꿉니다.", prevention: "registration은 AutoCloseable token과 owner lifecycle test를 요구합니다." },
        { symptom: "Serializable inner를 저장하자 Owner NotSerializableException이 난다.", likelyCause: "source에 보이지 않는 enclosing reference가 serialization graph에 포함됐습니다.", checks: ["class가 non-static member인지 봅니다.", "outer가 정말 저장 대상인지 묻습니다.", "object graph inspection을 수행합니다."], fix: "static nested/top-level DTO로 필요한 fields만 복사하고 schema를 명시합니다.", prevention: "inner/local/anonymous를 durable serialized DTO로 사용하지 않습니다." },
      ],
      expertNotes: ["serialization success는 security/scheme correctness 증명이 아닙니다. untrusted native serialization input은 피하고 allowlist·size limits·data format을 설계합니다.", "heap retention test는 GC timing assertion보다 registry size, close token, weak/strong ownership graph를 deterministic하게 검증하는 편이 낫습니다."],
    },
    {
      id: "reflection-and-negative-compiler-contracts",
      title: "reflection shape와 eight expected-fail compiles로 nested 규칙을 runtime 추측이 아닌 계약으로 고정합니다",
      lead: "enum new·switch exhaustiveness·outer requirement·capture·anonymous obligation 오류를 각각 독립 task로 compile합니다.",
      explanations: [
        "positive examples만으로는 compiler가 막아야 할 경계를 증명할 수 없습니다. 실패해야 하는 source를 주석으로 남기지 말고 JavaCompiler task로 실제 compile해 result false, ERROR count1, 1-based line, diagnostic code를 고정합니다.",
        "enum-new는 enum explicit construction 금지, enum-switch는 non-exhaustive expression, inner-new는 static context의 inner 생성, nested-instance는 static nested의 outer instance field 접근을 각각 분리합니다.",
        "local-scope는 block 밖 local type name 사용, capture-mutate는 effectively-final 위반, anonymous-missing은 SAM obligation 미구현, outer-this-static은 static nested context의 Outer.this 부재를 검증합니다.",
        "inner-new·nested-instance·outer-this-static은 같은 OpenJDK diagnostic code를 낼 수 있지만 source rule은 다릅니다. code 문자열만으로 semantic case를 합치지 않고 fixture name·source·expected line을 함께 보존합니다.",
        "diagnostic code는 OpenJDK implementation regression key이지 JLS portable message가 아닙니다. OpenJDK21.0.11로 version-pin하고 다른 vendor/version에서는 semantic expectation과 line을 우선 재감사합니다.",
        "reflection은 MemberClass, LocalClass, AnonymousClass, Enum, static modifier 같은 compiled shape를 확인합니다. generated class name, synthetic enclosing-field name, ordinal-based artifact layout은 stable contract가 아니므로 피합니다.",
        "expected-fail task마다 별도 -d directory를 사용해야 partial class artifact가 다른 case를 오염시키지 않습니다. 마지막에는 OS temp direct-child boundary를 검증하고 reverse-order delete 후 residue absence를 확인합니다.",
      ],
      concepts: [
        { term: "negative compiler contract", definition: "특정 잘못된 source가 목표 semantic 이유로 compile 실패해야 한다는 executable specification입니다.", detail: ["result false만으로 부족합니다.", "kind/count/line/code를 함께 검사합니다."] },
        { term: "reflection shape", definition: "Class/Modifier API로 enum/member/local/anonymous/static 같은 compiled type category를 묻는 구조 evidence입니다.", detail: ["behavior test를 보완합니다.", "generated names를 대체합니다."] },
        { term: "diagnostic version pin", definition: "compiler-specific diagnostic code expectation을 JDK vendor/version과 함께 고정하는 방식입니다.", detail: ["portable JLS rule과 분리합니다.", "toolchain upgrade 때 재감사합니다."] },
      ],
      codeExamples: [{
        id: "java-nested-compiler-contracts",
        title: "enum·inner·local·anonymous eight negative fixtures를 독립 compile합니다",
        language: "java",
        filename: "NestedCompilerContracts.java",
        purpose: "각 금지 규칙이 exactly-one expected OpenJDK21 error로 실패함을 검증합니다.",
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

public class NestedCompilerContracts {
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
            new Case("enum-new", "T01", "enum E { A }\npublic class T01 { Object x = new E(); }\n", 2, "compiler.err.enum.cant.be.instantiated"),
            new Case("enum-switch", "T02", "enum E { A, B }\npublic class T02 { int f(E e) { return switch(e) { case A -> 1; }; } }\n", 2, "compiler.err.not.exhaustive"),
            new Case("inner-new", "T03", "public class T03 { class I {}\n  static Object f() { return new I(); }\n}\n", 2, "compiler.err.non-static.cant.be.ref"),
            new Case("nested-instance", "T04", "public class T04 { int x; static class N {\n  int f() { return x; }\n} }\n", 2, "compiler.err.non-static.cant.be.ref"),
            new Case("local-scope", "T05", "public class T05 { void a() { class L {} }\n  Object b() { return new L(); }\n}\n", 2, "compiler.err.cant.resolve.location"),
            new Case("capture-mutate", "T06", "public class T06 { Runnable f() { int x = 1;\n  Runnable r = () -> System.out.println(x);\n  x++; return r; } }\n", 2, "compiler.err.cant.ref.non.effectively.final.var"),
            new Case("anonymous-missing", "T07", "interface A { void run(); }\npublic class T07 { Object x = new A() {}; }\n", 2, "compiler.err.does.not.override.abstract"),
            new Case("outer-this-static", "T08", "public class T08 { static class N {\n  Object f() { return T08.this; }\n} }\n", 2, "compiler.err.non-static.cant.be.ref")
        );
    }

    public static void main(String[] args) throws Exception {
        Path base = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = Files.createTempDirectory(base, "nested-contracts-").toAbsolutePath().normalize();
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
          { lines: "1-23", explanation: "in-memory source object와 expected case record를 정의합니다." },
          { lines: "25-35", explanation: "eight fixtures가 서로 다른 enum/inner/local/anonymous semantic boundary와 expected OpenJDK code를 담습니다." },
          { lines: "38-41", explanation: "normalized OS temp direct child와 parent boundary를 먼저 고정합니다." },
          { lines: "43-62", explanation: "case별 output directory와 JavaCompiler task를 만들고 compile false·diagnostics total1·ERROR1·line/code를 assert한 뒤 stable result를 출력합니다." },
          { lines: "64-72", explanation: "finally에서 root parent boundary를 재검사하고 reverse-order cleanup과 residue absence를 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21.0.11 full JDK"], command: isolatedJavaRun("NestedCompilerContracts.java", "NestedCompilerContracts") },
        output: { value: "enum-new=false|1|2|compiler.err.enum.cant.be.instantiated\nenum-switch=false|1|2|compiler.err.not.exhaustive\ninner-new=false|1|2|compiler.err.non-static.cant.be.ref\nnested-instance=false|1|2|compiler.err.non-static.cant.be.ref\nlocal-scope=false|1|2|compiler.err.cant.resolve.location\ncapture-mutate=false|1|2|compiler.err.cant.ref.non.effectively.final.var\nanonymous-missing=false|1|2|compiler.err.does.not.override.abstract\nouter-this-static=false|1|2|compiler.err.non-static.cant.be.ref", explanation: ["eight tasks는 모두 compile false와 ERROR exactly1입니다.", "세 cases가 같은 code라도 fixture source rule과 id가 달라 별도 계약으로 유지됩니다.", "모든 expected lines는1-based line2이고 cleanup 뒤 fixture classes가 남지 않습니다."] },
        experiments: [
          { change: "anonymous-missing body에 public void run(){}를 추가합니다.", prediction: "compile success로 바뀌어 negative harness가 의도대로 실패합니다.", result: "fixture가 anonymous concrete obligation을 실제로 겨냥했음을 확인합니다." },
          { change: "JDK vendor/version을 바꾸고 code 문자열만 그대로 요구합니다.", prediction: "같은 semantic error라도 diagnostic code/line이 달라질 수 있습니다.", result: "JLS semantic expectation과 compiler regression key를 두 층으로 관리합니다." },
        ],
        sourceRefs: ["java-compiler-api", "java-diagnostic-api", "java-files-api", "jls-enum-classes", "jls-inner-classes", "jls-local-class", "jls-anonymous-class", "jls-capture"],
      }],
      diagnostics: [
        { symptom: "negative fixture가 parser/classpath 오류로 실패해도 test가 통과한다.", likelyCause: "Boolean false만 확인하고 error identity를 보지 않았습니다.", checks: ["diagnostics total과 ERROR count를 봅니다.", "1-based line과 code를 확인합니다.", "fixture filename/public type을 맞춥니다."], fix: "exactly-one error·expected line·version-pinned code를 모두 assert합니다.", prevention: "source와 expectation을 같은 immutable Case record에 둡니다." },
        { symptom: "reflection test가 compiler update마다 generated field/name 차이로 깨진다.", likelyCause: "semantic category 대신 synthetic implementation layout을 계약으로 고정했습니다.", checks: ["$1/this$0 같은 문자열을 찾습니다.", "Class category predicates로 대체 가능한지 봅니다.", "behavior assertion을 분리합니다."], fix: "isEnum/isMemberClass/isLocalClass/isAnonymousClass와 Modifier.isStatic만 안정 surface에 사용합니다.", prevention: "synthetic layout assertion은 bytecode 연구 test로 격리하고 product contract에서 제외합니다." },
      ],
      expertNotes: ["negative fixtures는 production source tree에 compile-fail file로 섞지 않고 in-memory 또는 별도 test resources로 격리합니다.", "JavaCompiler가 null이면 JRE-only runtime일 수 있으므로 full JDK21 environment precondition을 명시합니다."],
    },
  ],
  lab: {
    title: "수명 안전한 학습 알림 router를 enum·static nested strategies·명시 subscription으로 설계합니다",
    scenario: "LegacyStudyNotifier는 화면 Controller의 non-static inner listener를 global static list에 등록하고 해제하지 않습니다. 알림 종류는 int0·1·2와 switch default로 흩어져 있고, local class가 전체 UserSession을 capture합니다. 익명 callback의 generated class name을 DB discriminator로 저장하며 callback 자체를 native serialization하려 합니다. 목표는 닫힌 알림 종류를 enum code로, 전달 구현을 private static nested strategies로, 사용자별 binding을 명시 immutable context로, registration lifetime을 AutoCloseable subscription으로 바꾸는 것입니다.",
    setup: [
      "OpenJDK21.0.11 full JDK와 PowerShell7+를 사용하고 javac options를 -encoding UTF-8 --release 21 -proc:none -Xlint:all -d isolated로 고정합니다.",
      "OS temp 아래 공백 포함 GUID direct child를 만들고 original package, scope, positive examples, negative fixtures의 output directories를 분리합니다.",
      "실제 사용자 이름·주소·token 대신 user-1, lesson-7, mail.test 같은 synthetic values만 사용합니다.",
      "before graph를 StaticRegistry→inner listener→Controller→View/Session으로 그리고 register/unregister count와 close paths를 기록합니다.",
      "NotificationKind enum은 stable code, display label, default priority만 immutable fields로 갖고 ordinal을 외부 저장에 쓰지 않습니다.",
    ],
    steps: [
      "원본 direct6+companions5 scope audit를 먼저 실행해 package22 warning2, package9 warning14, scope11 warning6, main6/compile-only5 기준을 재현합니다.",
      "int kind와 문자열 switch를 NotificationKind enum으로 치환하고 fromCode가 unknown을 structured ParseResult로 반환하게 합니다.",
      "Delivery interface를 한 method SAM으로 정의하고 EmailDelivery·PushDelivery를 private static nested implementations로 만듭니다.",
      "factory의 exhaustive enum switch가 built-in delivery를 선택하게 하되 외부 plugin 요구가 있는지 별도 ADR로 판단합니다.",
      "UserSession 전체 capture 대신 immutable DeliveryContext(userId, destination, locale) record를 만들고 필요한 fields만 전달합니다.",
      "Registry.register가 AutoCloseable Subscription token을 반환하고 close가 idempotent하게 정확히 한 listener를 제거하도록 합니다.",
      "Controller inner listener를 제거하거나 정말 outer UI state가 필요하면 private member inner로 제한하고 Controller.close에서 subscription을 반드시 닫습니다.",
      "짧은 stateless transform은 lambda, stateful retry/metrics는 named static nested class로 구현하고 this/identity assumptions가 없는지 검사합니다.",
      "저장 DTO에는 enum stable code와 payload만 넣고 callback, local/anonymous class, outer graph, ordinal, generated class name을 제외합니다.",
      "behavior tests로 routing exact output, unknown code, listener count0→1→0, double-close, delivery failure, concurrent register/close를 검증합니다.",
      "reflection tests로 enum/member/local/anonymous/static shape를 검사하고 eight negative compiler contracts를 OpenJDK21 code/line까지 실행합니다.",
      "cleanup에서 process timeout을 kill하고 resolved OS temp direct child만 reverse-order 삭제한 뒤 workspace .class와 private literals가0인지 확인합니다.",
    ],
    expectedResult: [
      "NotificationKind의 name·label·stable code·priority가 분리되고 reorder 뒤에도 external code mapping이 유지됩니다.",
      "Delivery implementations는 static nested라 implicit Controller reference가 없고 factory caller는 Delivery interface만 봅니다.",
      "Registry listener count가 subscription close 뒤0이며 Controller/View graph가 global root에서 끊깁니다.",
      "local/anonymous/lambda callback은 generated class name이나 identity로 저장되지 않고 필요한 immutable context만 capture합니다.",
      "durable DTO는 enum ordinal과 native nested-object serialization 없이 explicit schema fields만 갖습니다.",
      "positive behavior·reflection shape·negative compiler·lifecycle/concurrency tests가 서로 다른 계약 층을 모두 통과합니다.",
    ],
    cleanup: [
      "모든 Subscription을 finally/try-with-resources에서 close하고 registry size가0인지 assert합니다.",
      "child JVM이 timeout이면 process tree를 kill한 뒤 stdout/stderr asynchronous reads를 회수합니다.",
      "normalized root parent가 OS temp base와 정확히 같은지 검사한 뒤 GUID direct child만 reverse-order 삭제합니다.",
      "repository 전체에서 .class, audit temp script, identity hash golden, 실제 이름·주소·credential pattern이0인지 검사합니다.",
    ],
    extensions: [
      "built-in enum routing과 ServiceLoader 외부 providers를 함께 지원할 때 duplicate key·priority·untrusted provider failure isolation을 설계합니다.",
      "virtual threads에서 notification deliveries를 병렬 실행하고 scoped ownership·cancellation·timeout·structured outcome을 연결합니다.",
      "JFR/heap dump로 before retention path와 after registry cleanup을 관찰하되 GC timing을 pass/fail 조건으로 쓰지 않습니다.",
      "JSON schema version과 unknown enum code forward compatibility를 old-writer/new-reader, new-writer/old-reader matrix로 검증합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "Ex19 형식의 membership enum을 stable code parser와 exhaustive switch로 확장합니다.",
      requirements: ["BASIC·VIP·VVIP는 immutable code·label·level을 갖습니다.", "fromCode는 unknown을 Optional.empty 또는 explicit Result로 반환하고 valueOf와 차이를 test합니다.", "ordinal을 출력하되 external persistence에는 쓰지 않는 이유를 README에 적습니다.", "discount category switch expression은 default 없이 세 constants를 모두 다룹니다.", "OpenJDK21 warning0와 known/unknown/name/identity exact output을 검증합니다."],
      hints: ["display label과 source name, external code를 세 columns로 나눕니다.", "values() array를 caller가 바꿔도 enum universe가 바뀌지 않는지 관찰합니다.", "case-insensitive input이 필요하면 boundary parser에서 Locale.ROOT 정책을 정합니다."],
      expectedOutcome: "reorder와 label 변경은 stable code parse를 깨뜨리지 않고 unknown input이 uncontrolled IllegalArgumentException 대신 명시 result로 처리됩니다.",
      solutionOutline: ["enum fields/constructor/accessors를 작성합니다.", "unique code parse를 구현합니다.", "exhaustive switch를 추가합니다.", "reorder·unknown·valueOf case를 exact test합니다."],
    },
    {
      difficulty: "응용",
      prompt: "member inner·local·static nested·anonymous·lambda를 하나씩 사용한 뒤 hidden dependency와 lifetime을 최소화하도록 리팩터링합니다.",
      requirements: ["두 outer objects와 각 inner를 만들어 qualified-new ownership을 증명합니다.", "local class를 interface view로 return해 method 종료 뒤 동작함을 보입니다.", "Java21 inner static member와 static nested no-outer 생성을 reflection으로 구분합니다.", "anonymous와 lambda this가 false/true로 갈리는 exact test를 작성합니다.", "long-lived registry에는 static nested callback+immutable context만 남기고 close 뒤 size0을 assert합니다.", "generated class names·identity hashes·GC timing을 golden에서 제외합니다."],
      hints: ["object graph에 explicit/implicit reference edges를 그립니다.", "Outer.this 사용 지점을 static nested로 바꿀 수 있는지 확인합니다.", "capture reference가 가리키는 graph 크기를 살핍니다."],
      expectedOutcome: "각 construct의 lexical scope·outer linkage·capture·this 차이가 실행으로 증명되고 registry가 owner graph를 retain하지 않습니다.",
      solutionOutline: ["construct별 최소 before fixture를 만듭니다.", "behavior/shape/lifetime evidence를 분리합니다.", "불필요한 implicit linkage를 static+arguments로 바꿉니다.", "subscription cleanup과 residue scan을 자동화합니다."],
    },
    {
      difficulty: "설계",
      prompt: "versioned import engine을 enum built-ins와 open plugin providers가 공존하도록 설계하고 compatibility·serialization·failure contracts를 완성합니다.",
      requirements: ["built-in Format enum은 stable code와 pure metadata만 갖고 ordinal persistence를 금지합니다.", "ParserProvider interface와 registry가 external providers를 받으며 duplicate/unknown keys를 명시 처리합니다.", "built-in parsers는 private static nested, provider test double은 local/anonymous/lambda 중 이유를 적어 선택합니다.", "durable Job DTO는 callback/inner object/native serialization 대신 explicit versioned fields를 사용합니다.", "old/new enum/provider/DTO matrix와 exhaustive switch rebuild policy를 작성합니다.", "listener/task lifetime은 close/cancel/timeout을 모든 success/failure paths에 연결합니다.", "eight negative compiler cases와 reflection/behavior/concurrency tests를 CI에 넣습니다."],
      hints: ["closed built-in catalog와 open provider set을 같은 enum에 억지로 넣지 않습니다.", "factory는 construction policy를, registry는 extension ownership을 담당하게 합니다.", "serialization 가능한 것과 durable schema로 저장해야 하는 것을 구분합니다."],
      expectedOutcome: "built-in type safety와 external extensibility가 충돌하지 않고 implicit outer/capture가 durable or long-lived graph로 새지 않으며 mixed-version 실패가 관찰 가능한 결과로 분류됩니다.",
      solutionOutline: ["variation axes와 deployment owners를 표로 만듭니다.", "enum metadata·provider SPI·factory/registry를 분리합니다.", "lifecycle와 DTO schema를 명시합니다.", "behavior/shape/compiler/compatibility matrices를 구현합니다.", "rollback과 migration 문서를 완성합니다."],
    },
  ],
  reviewQuestions: [
    { question: "enum constant는 int 상수와 무엇이 다른가요?", answer: "해당 enum type의 public static final singleton object라 fields·methods·interface behavior와 compiler type safety를 가집니다." },
    { question: "enum을 new할 수 있나요?", answer: "아닙니다. constants만 enum instances를 만들며 explicit new는 compiler.err.enum.cant.be.instantiated로 거부됩니다." },
    { question: "enum은 다른 class를 extends할 수 있나요?", answer: "java.lang.Enum을 암시적으로 extends하므로 다른 class는 못하지만 interfaces는 implements할 수 있습니다." },
    { question: "valueOf는 label이나 toString을 찾나요?", answer: "아니요. 정확한 constant name을 찾고 없으면 IllegalArgumentException을 던집니다." },
    { question: "ordinal을 DB key로 쓰면 왜 위험한가요?", answer: "declaration reorder·중간 constant 추가로 ordinal이 바뀌므로 명시 stable code를 저장해야 합니다." },
    { question: "values()는 무엇을 반환하나요?", answer: "현재 선언 순서의 enum constants가 담긴 새 array를 반환합니다. 배열 변경이 constants 집합을 바꾸지는 않습니다." },
    { question: "constant-specific class body는 언제 쓰나요?", answer: "닫힌 constants마다 algorithm 구조가 다를 때 enum abstract method를 각 constant가 구현하도록 쓸 수 있습니다. 단순 parameter 차이는 fields가 낫습니다." },
    { question: "enum switch expression에 default를 항상 넣어야 하나요?", answer: "모든 constants를 다루는 내부 switch라면 default 없이 exhaustiveness를 compiler에 맡기는 편이 새 constant 누락을 잘 드러냅니다." },
    { question: "member inner object는 outer 없이 생성할 수 있나요?", answer: "밖에서는 특정 outer.new Inner가 필요하고 outer instance context 안에서는 implicit current outer로 new Inner를 쓸 수 있습니다." },
    { question: "Outer.Inner와 outer.new Inner에서 두 qualifier 역할은 무엇인가요?", answer: "앞은 nested type을 찾는 type qualification이고 뒤는 새 inner의 enclosing instance를 선택하는 instance qualification입니다." },
    { question: "inner가 outer private field에 접근하는 것은 상속인가요?", answer: "아닙니다. lexical nesting/nestmate access이며 inner가 outer subclass라는 뜻이 아닙니다." },
    { question: "inner method의 this는 outer인가요?", answer: "plain this는 inner object이고 outer는 Outer.this로 명시합니다." },
    { question: "local·inner field·outer field 이름이 같으면 simple name은 무엇을 고르나요?", answer: "가장 가까운 local declaration을 고르고 this.field는 inner, Outer.this.field는 outer를 고릅니다." },
    { question: "local class type은 method 밖에서 직접 쓸 수 있나요?", answer: "type name scope는 block 안이지만 instance는 interface/supertype view로 method 밖에 return할 수 있습니다." },
    { question: "method가 끝나면 local class object가 즉시 사라지나요?", answer: "아닙니다. reachable reference가 있으면 계속 살아 있고 GC timing은 lexical scope만으로 결정되지 않습니다." },
    { question: "effectively final은 object가 immutable하다는 뜻인가요?", answer: "아닙니다. local reference variable을 재대입하지 않았다는 뜻이며 참조 대상 내부 state는 mutable할 수 있습니다." },
    { question: "static inner class라는 표현은 정확한가요?", answer: "일상적으로 쓰지만 JLS는 static nested class라 부르며 inner class는 non-static nested class를 뜻합니다." },
    { question: "static nested class는 outer instance field를 직접 읽을 수 있나요?", answer: "implicit outer가 없어 불가능합니다. 필요한 outer를 명시 receiver/argument로 받아야 합니다." },
    { question: "Java21 inner class에 static field를 둘 수 있나요?", answer: "가능합니다. Java16부터 inner classes도 static members와 initializers를 선언할 수 있지만 class 자체가 static nested가 되는 것은 아닙니다." },
    { question: "static nested class object는 singleton인가요?", answer: "아닙니다. new마다 object가 생기며 static fields만 class-wide shared state입니다." },
    { question: "anonymous class는 interface 자체를 new하나요?", answer: "아닙니다. expression에서 이름 없는 implementing class를 선언하고 required methods를 구현한 그 class instance를 만듭니다." },
    { question: "anonymous class에 constructor를 선언할 수 있나요?", answer: "class 이름이 없어 일반 constructor declaration은 못합니다. superclass arguments와 instance initializer는 가능하지만 복잡하면 named class가 낫습니다." },
    { question: "anonymous 추가 method를 interface 변수로 호출할 수 있나요?", answer: "declared interface surface에 없으므로 호출할 수 없습니다. 필요한 operation이면 interface나 named type에 올려야 합니다." },
    { question: "anonymous class generated name을 저장해도 되나요?", answer: "아닙니다. numbering/binary name은 source edit/compiler에 따라 달라지므로 behavior와 isAnonymousClass를 사용합니다." },
    { question: "lambda와 anonymous class의 this는 같은가요?", answer: "아닙니다. anonymous this는 anonymous object, lambda this는 enclosing lexical instance입니다." },
    { question: "lambda object identity를 cache key로 써도 되나요?", answer: "권장되지 않습니다. allocation/reuse/class identity는 stable language contract가 아니므로 명시 key를 사용합니다." },
    { question: "outer state를 읽지 않는 member inner는 무엇으로 바꾸나요?", answer: "대개 static nested class로 바꾸고 필요한 dependencies를 constructor/parameters로 명시합니다." },
    { question: "member inner callback이 memory leak을 만들 수 있는 이유는 무엇인가요?", answer: "long-lived registry가 inner를 잡으면 hidden enclosing reference를 통해 outer graph까지 reachable하게 유지할 수 있기 때문입니다." },
    { question: "Serializable inner가 outer 때문에 실패할 수 있나요?", answer: "네. implicit enclosing reference가 serialization graph에 포함되어 non-serializable outer에서 NotSerializableException이 날 수 있습니다." },
    { question: "enum serialization identity는 유지되나요?", answer: "Java native serialization은 enum을 특별 처리해 같은 named constant identity로 복원하지만 name rename/removal과 native serialization 자체의 위험은 별도 고려합니다." },
    { question: "negative compile test가 false만 보면 왜 부족한가요?", answer: "목표 규칙이 아니라 parser/classpath 오류일 수 있으므로 ERROR exactly1, expected line, version-pinned code를 함께 확인해야 합니다." },
    { question: "inner-new와 static nested outer-field 오류가 같은 diagnostic code면 같은 문제인가요?", answer: "아닙니다. OpenJDK code가 같아도 fixture source와 semantic rule이 다르므로 case id와 line/JLS 근거를 함께 유지합니다." },
  ],
  completionChecklist: [
    "enum constant가 public static final singleton object임을 설명·identity test로 검증했다.",
    "int/string magic constants와 enum type safety·behavior locality를 비교했다.",
    "enum constructor·immutable fields·common method·constant-specific body를 실행했다.",
    "name·toString/label·external code·ordinal을 서로 다른 계약으로 분리했다.",
    "valueOf exact-name·case-sensitive·exception 계약과 safe parser를 구분했다.",
    "values declaration order와 새 array 반환 의미를 설명했다.",
    "ordinal persistence를 금지하고 stable explicit code migration을 제시했다.",
    "default 없는 exhaustive enum switch와 새 constant evolution 위험을 검증했다.",
    "닫힌 enum policy axis와 열린 interface/plugin axis를 비교했다.",
    "member inner가 특정 enclosing outer instance를 가진다는 object graph를 그렸다.",
    "outer.new Inner와 outer context 내부 new Inner 생성 syntax를 실행했다.",
    "inner의 outer private access가 inheritance가 아니라 lexical nest access임을 설명했다.",
    "local→this/Inner.this→Outer.this shadow ladder를 exact output으로 확인했다.",
    "같은 outer의 여러 inners가 outer state를 공유하고 inner state는 독립임을 검증했다.",
    "서로 다른 outer에 연결된 inners가 다른 state를 읽음을 검증했다.",
    "local class type-name scope와 object lifetime/reachability를 분리했다.",
    "local object가 interface view로 method return 뒤 escape해 동작함을 실행했다.",
    "final/effectively-final capture와 deep immutability 차이를 설명했다.",
    "captured mutable/large graph와 long-lived registry retention 위험을 다뤘다.",
    "static nested class가 implicit outer 없이 new Outer.Nested로 생성됨을 실행했다.",
    "static nested의 outer static 접근과 outer instance 접근 금지를 구분했다.",
    "Java21에서 inner class static members가 가능하다는 Java16 이후 규칙으로 원본 설명을 교정했다.",
    "class declaration static bit와 contained static member 존재를 reflection으로 구분했다.",
    "anonymous class가 이름 없는 concrete subtype+instance expression임을 설명했다.",
    "Ex09 source anonymous expressions3과 runtime 실행 branches2를 구분했다.",
    "anonymous obligation·interface surface·constructor limitation을 검증했다.",
    "generated anonymous/local binary name을 golden·DB·protocol에서 제외했다.",
    "lambda와 anonymous class의 SAM capture 공통점과 this 차이를 exact false/true로 실행했다.",
    "lambda identity/allocation/class shape를 stable contract로 사용하지 않았다.",
    "enum·member inner·static nested·local·anonymous·lambda 선택 표를 ownership/variation/lifetime 기준으로 적용했다.",
    "private static nested implementations와 interface factory로 implementation을 숨겼다.",
    "public nested type의 binary/API compatibility를 구현 detail로 취급하지 않았다.",
    "inner/listener retention path와 idempotent unsubscribe lifecycle을 설계했다.",
    "Serializable inner가 hidden outer 때문에 실패하는 exact case를 실행했다.",
    "enum serialization identity와 name/schema evolution 위험을 구분했다.",
    "eight negative fixtures가 compile false·ERROR1·line2·OpenJDK21 code를 각각 검증했다.",
    "reflection은 isEnum/isMemberClass/isLocalClass/isAnonymousClass/Modifier.isStatic처럼 stable predicates만 사용했다.",
    "class06 package22 warning2·class07 package9 warning14·scope11 warning6을 별도 -d에서 재현했다.",
    "scope warning6의 use owner Ex09_Main·declaration owner Ex08.java를 모두 assert했다.",
    "scope11의 main6·compile-only5를 source에서 계산했다.",
    "Ex18 exact2·Ex20 VVIP exact12·Ex09 exact7행을 fresh JVM에서 검증했다.",
    "Ex22 exact10·Ex02 exact21·Ex04 exact5행을 identity pattern·slot relation·numeric positions로 정규화 검증했다.",
    "원본 개인 name/address literal과 identity hash를 공개 output/evidence에서 제거했다.",
    "모든 synthetic Java examples가 OpenJDK21 -Xlint:all warning0와 exact output을 통과했다.",
    "ProcessStartInfo input/output/error redirect와 timeout으로 interactive Ex20을 격리했다.",
    "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS를 저장·제거·child 제거·finally 복원하고 hostile 네 변수 아래에서도 exact 감사를 통과했다.",
    "OS temp GUID direct-child parent boundary와 reverse cleanup·post-delete assertion을 적용했다.",
    "원본11·JLS SE21·JVM/Java SE21 APIs·OpenJDK21 provenance와 보충 범위를 구분했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class06-ex18", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex18_Enum.java", usedFor: ["Lesson constants4", "int constant versus enum object", "Ex18 exact2 output"], evidence: "package-private Lesson의 JAVA·JSP·SPRING·REACT 네 constants, static final int data와 Lesson.JAVA object 비교, main의90/JAVA exact2행을 확인했습니다." },
    { id: "java-class06-ex19", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex19_MemberType.java", usedFor: ["BASIC/VIP/VVIP enum", "immutable label and level", "enum constructor and accessors"], evidence: "세 membership constants와 private final label·level, accessors, constant arguments를 받는 enum constructor를 확인했습니다." },
    { id: "java-class06-ex20", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex20_MemberTypeMain.java", usedFor: ["values", "valueOf input", "VVIP interactive exact12 output"], evidence: "VIP direct selection, values()[0] BASIC, Scanner prompt와 valueOf(input), VVIP 입력의 name·label·level을 fresh JVM exact12행으로 확인했습니다." },
    { id: "java-class06-ex21", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex21_MemberInnerClass.java", usedFor: ["member inner declaration", "outer private access", "Outer.this shadowing", "outer method call"], evidence: "non-static Inner01이 inner fields와 method locals를 가지며 enclosing outer private age·sound와 qualified outer name에 접근함을 확인했습니다. 실제 개인 name literal은 공개하지 않았습니다." },
    { id: "java-class06-ex22", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex22_Main.java", usedFor: ["qualified outer.new Inner", "member inner companion", "normalized exact10 output"], evidence: "outer object 생성 뒤 demo.new Inner01로 특정 enclosing instance를 선택하고 name shadow output을 내는10행을 identity pattern·slot equality로 검증했습니다." },
    { id: "java-class07-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class07/Ex01_LocalInnerClass.java", usedFor: ["local class", "three-level shadowing", "outer private access", "scope/lifetime comment correction"], evidence: "play block의 Inner02, local·inner·outer name/age/cnt/address ladder, outer method calls을 확인하고 ‘method 종료 시 class/object가 사라진다’는 주석을 lexical scope와 reachability 구분으로 교정했습니다." },
    { id: "java-class07-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class07/Ex02_Main.java", usedFor: ["local class execution companion", "outer method entry", "normalized exact21 output"], evidence: "caller가 local type을 직접 생성하지 않고 outer sound/play를 호출하는 구조와 identity·shadow numeric slots를 포함한21행을 normalized contract로 실행했습니다." },
    { id: "java-class07-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class07/Ex03_StaticInnerClass.java", usedFor: ["static nested class", "outer static access", "inner instance/static members", "legacy rule correction"], evidence: "public static Inner03, outer static cnt, inner instance addr와 static room, instance/static methods의 access 차이를 확인하고 static-member 관련 과거 주석을 Java21 규칙으로 교정했습니다." },
    { id: "java-class07-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class07/Ex04_Main.java", usedFor: ["static nested direct construction", "nested static field access", "normalized exact5 output"], evidence: "Outer.Inner03.room 접근과 outer instance 없는 new Outer.Inner03(), cnt14·non-empty address·room5의5행 위치 계약을 확인했습니다." },
    { id: "java-class07-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class07/Ex08.java", usedFor: ["anonymous interface dependency", "named Car/Baseball implementations", "Land dispatcher", "scope warnings declaration owner"], evidence: "Ex08 SAM, named implementations, Ex08_Land.autoPlay parameter dispatch를 확인했고 Ex09가 다른 source의 package-private auxiliary types에 접근해 warning6을 내는 declaration owner임을 감사했습니다." },
    { id: "java-class07-ex09", repository: "javastudy2/classstudy", path: "src/com/java/class07/Ex09_Main.java", usedFor: ["anonymous expressions3", "runtime branches2", "exact7 output", "scope warnings use owner"], evidence: "source anonymous Ex08 bodies3, su1에서 실행되는 anonymous bodies2와 named implementations, exact7행, auxiliary access warnings6의 use site를 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["package/scope compile", "-Xlint all", "release21", "negative diagnostic codes"], evidence: "OpenJDK21.0.11에서 class06 package22, class07 package9, scope11, synthetic positive and negative sources를 compile한 toolchain 기준입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["six fresh Java processes", "ArgumentList", "VVIP stdin", "redirected UTF-8 stdout/stderr"], evidence: "interactive Ex20 포함 여섯 mains에 shell interpolation 없는 arguments, closed stdin과 redirected UTF-8 streams를 구성하는 API 근거입니다." },
    { id: "powershell-environment-variables", repository: "Microsoft PowerShell Documentation", path: "about_Environment_Variables / Env provider", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher option presence/value save", "process-scope removal", "finally restoration"], evidence: "audit PowerShell process에서 네 Java launcher option 환경 변수의 존재와 값을 저장·제거하고 finally에서 원래 상태로 복원하는 Env provider 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child environment isolation", "launcher option removal", "per-process environment"], evidence: "각 Java child의 environment dictionary에서도 네 launcher option 변수를 제거해 host options가 exact runtime evidence를 바꾸지 않게 하는 API 근거입니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["Start", "WaitForExit timeout", "Kill process tree", "bounded termination grace", "Dispose"], evidence: "Java child마다 10초 runtime timeout, tree kill, 5초 termination grace와 finally Dispose를 적용하는 process lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "System.IO.StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout drain", "concurrent stderr drain", "post-exit task result"], evidence: "child Start 직후 stdout/stderr async reads를 시작해 redirected pipe backpressure deadlock을 피하고 종료·kill 뒤 두 tasks를 회수하는 근거입니다." },
    { id: "jls-enum-classes", repository: "JLS SE 21", path: "8.9 Enum Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.9", usedFor: ["enum class semantics", "implicit fields", "constructor restrictions", "no explicit instantiation"], evidence: "enum declaration, constants, implicit superclass, constructors와 compile-time restrictions의 primary specification입니다." },
    { id: "jls-enum-constant-body", repository: "JLS SE 21", path: "8.9.1 Enum Constants", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.9.1", usedFor: ["constant-specific class body", "anonymous subclass detail", "constant arguments"], evidence: "각 enum constant declaration과 optional class body가 instance behavior를 제공하는 규칙의 근거입니다." },
    { id: "java-enum-api", repository: "Java SE 21 API", path: "java.lang.Enum", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Enum.html", usedFor: ["name", "ordinal", "valueOf", "identity semantics"], evidence: "name/ordinal, Comparable/Serializable 기반 enum API와 ordinal의 intended use를 확인하는 API 근거입니다." },
    { id: "java-optional-api", repository: "Java SE 21 API", path: "java.util.Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["unknown enum code parse", "explicit absence"], evidence: "fromCode unknown 결과를 null이나 uncontrolled valueOf exception 대신 명시 absence로 반환하는 example API입니다." },
    { id: "jls-switch-expressions", repository: "JLS SE 21", path: "15.28 switch Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.28", usedFor: ["enum exhaustive switch", "result expressions", "non-exhaustive negative fixture"], evidence: "switch expression의 exhaustiveness와 result production rules의 primary specification입니다." },
    { id: "jls-inner-classes", repository: "JLS SE 21", path: "8.1.3 Inner Classes and Enclosing Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.3", usedFor: ["inner definition", "enclosing instance", "static member modern rule", "serialization/lifetime relation"], evidence: "inner class 정의, enclosing instance relation, modern static member allowance의 중심 specification입니다." },
    { id: "jls-qualified-class-creation", repository: "JLS SE 21", path: "15.9 Class Instance Creation Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9", usedFor: ["outer.new Inner", "anonymous creation", "enclosing instance selection"], evidence: "qualified/unqualified class instance creation과 anonymous class body의 compile-time/runtime 규칙 근거입니다." },
    { id: "jvms-nestmates", repository: "OpenJDK JEP", path: "JEP 181 Nest-Based Access Control", publicUrl: "https://openjdk.org/jeps/181", usedFor: ["private access implementation", "nestmate terminology", "synthetic accessor non-contract"], evidence: "nested classes 간 private access를 JVM nest 단위로 표현하고 legacy synthetic bridge dependence를 줄인 배경 근거입니다." },
    { id: "jls-shadowing", repository: "JLS SE 21", path: "6.4.1 Shadowing", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.4.1", usedFor: ["local versus field names", "lexical nearest declaration", "nested type shadowing"], evidence: "declaration이 같은 이름의 다른 declaration을 가리는 source-level scope 규칙의 primary specification입니다." },
    { id: "jls-qualified-this", repository: "JLS SE 21", path: "15.8.4 Qualified this", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.8.4", usedFor: ["Outer.this", "Inner.this", "static context rejection"], evidence: "lexically enclosing instance를 type-name-qualified this로 선택하는 표현 규칙의 근거입니다." },
    { id: "jls-local-class", repository: "JLS SE 21", path: "14.3 Local Class and Interface Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.3", usedFor: ["block local type scope", "local class declaration", "static context property"], evidence: "local class declaration이 block statement로 갖는 scope와 restrictions의 primary specification입니다." },
    { id: "jls-capture", repository: "JLS SE 21", path: "6.5.6.1 Simple Expression Names", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.5.6.1", usedFor: ["final/effectively-final local capture", "local/anonymous/lambda capture", "capture-mutate diagnostic"], evidence: "inner/local/anonymous/lambda body가 enclosing local variables를 참조할 때의 effectively-final requirement 근거입니다." },
    { id: "java-class-is-local", repository: "Java SE 21 API", path: "Class.isLocalClass", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#isLocalClass()", usedFor: ["escaping local structural predicate", "generated name avoidance"], evidence: "local class 여부를 binary name numbering 없이 확인하는 reflection predicate입니다." },
    { id: "jls-static-members-inner-change", repository: "OpenJDK JEP", path: "JEP 395 Records - relax static member restriction", publicUrl: "https://openjdk.org/jeps/395", usedFor: ["Java16 inner static member change", "legacy comment correction", "release-sensitive experiment"], evidence: "Java16에서 inner classes의 explicit/implicit static members 제한을 완화한 language change 설명을 Java21 원본 주석 교정에 사용했습니다." },
    { id: "java-reflection-modifier", repository: "Java SE 21 API", path: "java.lang.reflect.Modifier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Modifier.html", usedFor: ["static nested versus inner", "compiled modifier predicate"], evidence: "member class modifiers의 static bit를 stable boolean으로 확인하는 API입니다." },
    { id: "jls-anonymous-class", repository: "JLS SE 21", path: "15.9.5 Anonymous Class Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9.5", usedFor: ["anonymous subtype declaration", "implementation obligation", "constructor limitation"], evidence: "class instance creation body가 anonymous class declaration을 형성하고 superclass/interface members를 구현하는 규칙 근거입니다." },
    { id: "java-class-is-anonymous", repository: "Java SE 21 API", path: "Class.isAnonymousClass", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#isAnonymousClass()", usedFor: ["anonymous structural predicate", "generated name avoidance"], evidence: "compiler-generated binary name 대신 anonymous class category를 확인하는 reflection API입니다." },
    { id: "jls-lambda", repository: "JLS SE 21", path: "15.27 Lambda Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27", usedFor: ["functional interface target", "lambda body", "capture and evaluation"], evidence: "lambda syntax, target typing, body와 evaluation의 primary specification입니다." },
    { id: "jls-lambda-this", repository: "JLS SE 21", path: "15.27.2 Lambda Body", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27.2", usedFor: ["lambda lexical this", "anonymous contrast", "same meaning of names"], evidence: "lambda body의 this/super와 enclosing name 의미가 anonymous class body와 다른 근거입니다." },
    { id: "jls-member-classes", repository: "JLS SE 21", path: "8.5 Member Class and Interface Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.5", usedFor: ["member class placement", "accessibility", "public nested API"], evidence: "class body에 선언된 member classes/interfaces와 modifiers/accessibility의 primary specification입니다." },
    { id: "jls-reachability", repository: "JLS SE 21", path: "12.6.1 Implementing Finalization", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.6.1", usedFor: ["reachability", "scope versus GC lifetime", "retention reasoning"], evidence: "reachable/reachable-like object lifecycle reasoning의 language-level 배경이며 lexical block 종료와 immediate collection이 같지 않음을 보충합니다." },
    { id: "java-serialization-enum", repository: "Java Object Serialization Specification", path: "1.12 Serialization of Enum Constants", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/serial-arch.html#serialization-of-enum-constants", usedFor: ["enum special serialization", "name-based identity restoration", "customization limits"], evidence: "enum constants가 ordinary object serialization과 다르게 처리되고 canonical constant로 복원되는 규칙 근거입니다." },
    { id: "java-serializable", repository: "Java SE 21 API", path: "java.io.Serializable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html", usedFor: ["inner serialization fixture", "serialVersionUID", "object graph contract"], evidence: "marker interface와 non-transient/non-static field graph serialization 기본 계약의 API 근거입니다." },
    { id: "java-not-serializable", repository: "Java SE 21 API", path: "java.io.NotSerializableException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/NotSerializableException.html", usedFor: ["non-serializable outer failure", "exact exception boundary"], evidence: "Serializable inner가 enclosing non-serializable Owner를 따라갈 때 관찰되는 failure type의 API 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["eight isolated compile tasks", "release and lint options", "boolean compile result"], evidence: "negative source fixtures를 production compile과 분리해 in-process task로 실행하는 API입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["ERROR kind", "1-based line", "OpenJDK diagnostic code"], evidence: "negative contracts가 failure kind/count/position/code를 구조적으로 검사하는 API입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp direct child", "case output directories", "reverse cleanup"], evidence: "expected-fail artifacts를 OS temp direct child에 격리하고 walk/reverse delete하는 API입니다." },
  ],
  sourceCoverage: {
    filesRead: 11,
    filesUsed: 11,
    uncoveredNotes: [
      "inventory direct6인 class06 Ex18_Enum·Ex19_MemberType·Ex21_MemberInnerClass와 class07 Ex01_LocalInnerClass·Ex03_StaticInnerClass·Ex09_Main을 모두 읽고 사용했습니다.",
      "실제 compile/run을 위해 Ex20_MemberTypeMain·Ex22_Main·Ex02_Main·Ex04_Main·Ex08 다섯 companion/dependency를 추가해 atomic scope11을 확정했습니다.",
      "class06 전체22는 exit0·captured diagnostics3·auxiliary warning2, class07 전체9는 exit0·captured diagnostics15·warning14입니다.",
      "scope11은 exit0·captured diagnostics7·warning6이며 여섯 occurrences 모두 Ex09_Main use sites와 Ex08.java auxiliary declarations의 조합입니다.",
      "scope source에서 runnable mains6과 compile-only5를 동적으로 계산했고 static main presence를 comments가 아닌 regex shape로 확인했습니다.",
      "Ex18은90/JAVA exact2행, Ex20은 VVIP redirected input의 prompt 포함 exact12행, Ex09는 runtime selected branches의 exact7행입니다.",
      "Ex22는10행, Ex02는21행, Ex04는5행을 유지하되 identity hash·실제 name/address strings는 공개하지 않고 pattern·equality/distinct slots·numeric/separator positions로 검증했습니다.",
      "Ex21 member inner의 outer private access·qualified Outer.this·demo.new Inner01 관계를 source shape와 two-outers synthetic example으로 확장했습니다.",
      "Ex01의 ‘method 종료 시 local class도 사라진다’는 주석은 declaration-name scope와 escaped object reachability를 혼동하므로 interface-return example으로 교정했습니다.",
      "Ex03의 ‘static member가 있으면 inner class를 static으로 해야 한다’는 주석은 Java16 이후 규칙과 달라 Java21 inner static field example·reflection static bit로 교정했습니다.",
      "Ex09 source anonymous expressions3과 su1 runtime에서 실제 생성/실행되는 anonymous expressions2를 구분하고 exact output과 compiler source shape를 함께 검증했습니다.",
      "enum fields/methods/constant-specific body/exhaustive switch, stable code, ordinal 금지는 원본이 충분히 설명하지 않아 JLS SE21·Enum API로 보충했습니다.",
      "local escape/effectively-final capture, anonymous-vs-lambda this, hidden outer retention, serialization failure는 JLS·Java SE21 APIs와 warning0 synthetic examples로 보충했습니다.",
      "negative suite는 enum new/switch, inner new, static nested instance access, local scope, capture mutation, anonymous missing, Outer.this static의 eight independent tasks입니다.",
      "eight tasks는 모두 compile false·diagnostics total1·ERROR1·line2이며 OpenJDK21.0.11 diagnostic codes를 version-pinned regression keys로 기록했습니다.",
      "모든 public Java examples는 -encoding UTF-8 --release21 -proc:none -Xlint:all warning0와 exact output을 요구하고 fixture별 classes를 격리합니다.",
      "원본 audit는 expected warnings를 숨기지 않고 synthetic examples는 warning0를 요구하는 서로 다른 compiler contracts로 분리했습니다.",
      "JDK_JAVAC_OPTIONS=-Werror, JDK_JAVA_OPTIONS=-XshowSettings:properties, JAVA_TOOL_OPTIONS=US-ASCII, _JAVA_OPTIONS=alternate language의 hostile four-option environment에서도 audit output이 byte-for-byte exact임을 재검증했습니다.",
      "audit는 네 launcher variables의 존재/값을 process scope에서 저장한 뒤 javac 전에 제거하고, ProcessStartInfo child environment에서도 제거하며, finally에서 원값을 복원합니다.",
      "OS temp GUID direct-child parent boundary, ProcessStartInfo timeout/redirect, reverse cleanup, post-delete assertion으로 repository artifact residue를 방지합니다.",
      "실제 개인 literal·local absolute path·credential·identity hash·generated local/anonymous class name은 공개 code/output/evidence에 포함하지 않았습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
