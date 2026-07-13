import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-04-set-generics"],
  slug: "core-04-set-generics",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 24,
  title: "Collection·제네릭·Set과 equals/hashCode",
  subtitle: "원소 type·동등성·hash·정렬·iteration·ownership 계약을 분리해 중복 제거가 정확하고 경고 없이 확장되는 collection API를 설계합니다.",
  level: "고급",
  estimatedMinutes: 900,
  coreQuestion: "Set이 ‘중복을 허용하지 않는다’는 한 문장을 generic type safety, equals/hashCode, hash bucket, comparator, iteration order, mutation·concurrency·API ownership까지 어떻게 실행 가능한 계약으로 확장할까요?",
  summary: "javastudy2 class09 원본8개를 모두 읽고 inventory direct4인 Ex01_Collection·Ex02_Set·Ex04_Set·Ex08_Main을 중심으로 감사했습니다. direct4만 compile하면 Ex08이 Ex07_Set을 찾지 못해 error5·exit1이므로 Ex07_Set을 dependency로 더한 atomic scope5가 필요합니다. package8과 scope5는 OpenJDK21.0.11에서 exit0이며 Ex07_Set constructor가 override 가능한 s_sum을 호출해 possible-this-escape warning1·captured diagnostics2를 냅니다. package에는 main6·compile-only2, scope에는 main3·compile-only2가 있고 adjacent runnable companions는 Ex03_Set·Ex05_Main·Ex06_Set 세 개입니다. 원본 실행은 Ex01·Ex03이0행, Ex02가8행, Ex05가15행, Ex06이6행, Ex08 synthetic duplicate 입력이2행입니다. HashSet raw order와 Ex04/Ex05의 name-like values는 공개하지 않고 element multiset·record pair relation·set size·duplicate count로 normalize했습니다. source의 name-like candidates는 active5+comment1·unique6이고 runtime name slots4는 process memory에서만 비교합니다. Ex04와 Ex07에는 equals/hashCode가 없어 Ex08의 logically equal synthetic objects 둘이 모두 남는다는 사실을 실행으로 고정했습니다. 이 근거 위에서 Collection/Iterable hierarchy와 safe iteration, generic invariance·method·bounds, wildcard PECS·capture, erasure·bridge·heap pollution·raw/varargs diagnostics, equals의 다섯 법칙과 hashCode, HashSet collision/mutable-key failure, LinkedHashSet insertion order, TreeSet comparator consistency/null, Set.of/copyOf immutable factories, record value objects·stable dedup·defensive copies·concurrent sets까지 전문가 수준으로 확장합니다.",
  objectives: [
    "Collection·Iterable·Iterator·Set 계층과 bulk/iteration operations의 mutation·order·ownership 계약을 설명하고 안전하게 순회한다.",
    "generic type parameter·invariance·generic method·upper/lower bound를 적용해 compile-time type safety와 reusable algorithms를 설계한다.",
    "wildcard PECS와 capture helper로 producer/consumer API를 표현하고 읽기·쓰기 가능 범위를 정확히 제한한다.",
    "type erasure·bridge method·non-reifiable type·raw type·heap pollution·varargs warning을 positive/negative compiler evidence로 진단한다.",
    "equals의 reflexive·symmetric·transitive·consistent·non-null 법칙과 equal objects의 same hashCode 의무를 immutable value object에 구현한다.",
    "HashSet·LinkedHashSet·TreeSet·immutable Set을 duplicate·collision·order·comparator·null·mutation 요구에 맞게 선택한다.",
    "mutable key를 금지하고 record 기반 stable dedup, defensive immutable snapshot, concurrent set의 atomic API와 publication boundary를 검증한다.",
  ],
  prerequisites: [{ title: "enum·중첩 클래스·로컬/익명 구현", reason: "generic type/member class, anonymous comparator, value identity와 interface implementation을 먼저 이해해야 collection element type과 equality strategy를 정확히 설계할 수 있습니다.", sessionSlug: "oop-10-enum-inner" }],
  keywords: ["Collection", "Iterable", "Iterator", "Set", "generic type", "invariance", "generic method", "bounded type parameter", "wildcard", "PECS", "capture", "type erasure", "bridge method", "heap pollution", "raw type", "SafeVarargs", "equals contract", "hashCode contract", "HashSet", "collision", "mutable key", "LinkedHashSet", "TreeSet", "Comparator", "Set.of", "Set.copyOf", "record", "stable deduplication", "defensive copy", "ConcurrentHashMap.newKeySet"],
  chapters: [
    {
      id: "class09-package-scope-order-private-audit",
      title: "package8·directOnly4·scope5를 compile하고 six mains를 order-neutral·privacy-safe하게 감사합니다",
      lead: "compile success만 보지 않고 빠진 dependency·known warning·runnable roles를 분리하며 HashSet raw order와 name-like values를 공개하지 않습니다.",
      explanations: [
        "class09에는 Ex01~Ex08 Java files8개가 있습니다. main은 Ex01·Ex02·Ex03·Ex05·Ex06·Ex08 여섯 개이고 data classes Ex04·Ex07 두 개는 compile-only입니다.",
        "inventory direct4는 Ex01_Collection·Ex02_Set·Ex04_Set·Ex08_Main입니다. Ex08이 Ex07_Set을 type argument·constructor·iterator element로 사용하므로 direct4만 compile하면 cant.resolve.location errors5와 summary를 포함한 diagnostics6·exit1입니다.",
        "Ex07_Set을 dependency로 더한 scope5는 compile되며 direct main3·compile-only2입니다. package의 나머지 Ex03·Ex05·Ex06은 adjacent runnable companions3입니다. dependency와 companion은 같은 말이 아니므로 역할을 따로 기록합니다.",
        "package8과 scope5는 모두 exit0이지만 warning clean은 아닙니다. Ex07_Set constructor line17이 public overridable s_sum을 호출해 compiler.warn.possible.this.escape1을 내고 summary와 합쳐 captured diagnostics2입니다. object equality warning이 아니라 constructor dispatch 위험입니다.",
        "Ex01은 Collection methods를 comments로 정리하고 runtime output0, Ex03은 HashSet<Double> additions를 실행하고 output0입니다. output이 없다는 사실도 exit0·stderr0·line0의 golden입니다.",
        "Ex02는 integer members3을 set line, enhanced-for3행, separator, iterator3행으로 총8행 출력합니다. 세 views를 numeric multiset10·100·1000으로 정렬 비교하되 원본 HashSet order는 어떤 exact string으로도 공개하지 않습니다.",
        "Ex05는 array records3, HashSet enhanced records4, iterator records4, age filter1과 separators3으로15행입니다. name-like runtime values는 record key 비교에만 쓰고 ages24·3·17, set pair multiset4, two iteration views equality, filtered-first relation만 공개합니다.",
        "Ex06은 Set 출력4개와 contains/isEmpty booleans2로6행입니다. set sizes6→6→0→1, 첫 두 sets의 symmetric difference2, 마지막 동일 add5회의 결과 size1을 검증하고 raw element/order를 출력하지 않습니다.",
        "Ex08에는 same synthetic ALPHA·scores90/80/70 records를 두 번 입력합니다. Ex07이 equals/hashCode를 override하지 않아 identity-distinct objects 둘이 모두 남고 identical value record가2회 출력됩니다. prompt와 grade 외 실제 name data는 전혀 사용하지 않습니다.",
        "Ex04 field·Ex05 setter/constructor contexts의 Hangul-only name-like literals는 active5·comment1·unique6입니다. 원본 Ex05 stdout에도 그중 runtime slots4가 반복되므로 raw capture는 memory 밖으로 내보내지 않고 category/length/count만 검증합니다.",
        "Ex01 주석의 add false는 막연한 실패가 아니라 이 호출로 collection이 바뀌지 않았다는 반환 계약입니다. optional operation 구현은 UnsupportedOperationException을 던질 수 있고 type/null restriction도 exception이 될 수 있습니다. Arrays.asList는 일반 ArrayList가 아니라 원본 array와 element replacement를 공유하는 fixed-size List라 add/remove가 거부됩니다.",
        "Iterator는 자체적인 정렬을 만들지 않고 구체 collection의 encounter order를 따라갑니다. Set interface 전체가 unordered인 것이 아니라 HashSet은 order를 보장하지 않고 LinkedHashSet은 insertion order, TreeSet은 comparison order를 약속합니다. Set에는 indexed get이 없지만 enhanced for·Iterator 순회는 가능하고 continue로 현재 원소 처리를 건너뛸 수 있습니다.",
        "Ex06의 Set 수정 불가는 positional replacement API가 없다는 뜻으로 한정해야 합니다. mutable element 내부는 바뀔 수 있고 equality/hash field 변경은 lookup을 깨뜨립니다. 원본은 duplicate add의 boolean을 버리므로 학습 예제에서는 add false를 명시적 unchanged evidence로 확장합니다.",
        "Ex07은 constructor this-escape 외에도 score setters가 sum·avg·grade를 재계산하지 않아 derived state가 stale해지고, public derived setters는 invariant를 외부에서 깨뜨릴 수 있습니다. avg 계산은 정수 scaling 뒤 한 자리 truncation이지 rounding이 아니며 range validation·equals/hashCode도 없습니다.",
        "Ex08은 HashSet.add 반환값을 버려 duplicate 여부를 사용자에게 알리지 않고 EOF·InputMismatchException·Scanner ownership 정책도 없습니다. synthetic input으로 정상 경로만 닫되 production 설계에서는 parse validation, retry/abort, caller-owned stream을 닫을지 여부를 별도 계약으로 둡니다.",
        "네 launcher-option environment의 존재·값을 mutation 전에 snapshot하고, 공백 포함 OS temp GUID direct child 생성과 environment 제거를 outer try 안에서 시작합니다. finally에서는 normalized-parent temp cleanup과 네 variables 각각의 복원·상태 검증을 서로 독립적으로 모두 시도하고 run·cleanup·restore errors를 함께 보존합니다. child에는 launcher options 제거, redirected UTF-8 streams,10초 timeout·tree kill·5초 termination grace·finally Dispose를 적용합니다.",
      ],
      concepts: [
        { term: "atomic generic source scope", definition: "inventory direct files에 type resolution에 반드시 필요한 source dependency를 더한 독립 compile 단위입니다.", detail: ["core04는 direct4+Ex07 dependency=scope5입니다.", "인접 runnable companions3은 package behavior evidence이지만 scope dependency는 아닙니다."] },
        { term: "order-neutral golden", definition: "Set iteration raw sequence 대신 element multiset·size·membership·relation을 비교하는 회귀 계약입니다.", detail: ["HashSet은 iteration order를 보장하지 않습니다.", "order가 요구되면 LinkedHashSet/TreeSet으로 type을 바꿉니다."] },
        { term: "privacy-safe record relation", definition: "개인처럼 보이는 원본 value를 출력하지 않고 record count·field type·age multiset·두 iteration equality만 검증하는 방식입니다.", detail: ["raw stdout은 process memory에만 존재합니다.", "실패 message에도 value를 넣지 않습니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core04-audit",
        title: "package/directOnly/scope compile과 six mains를 warning·multiset·privacy 관계로 검증합니다",
        language: "powershell",
        filename: "verify-original-core04.ps1",
        purpose: "class09 원본을 HashSet order와 name-like raw values 없이 재현하고 dependency/warning까지 보존합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core04 audit " + [Guid]::NewGuid().ToString("N"))
$launcherNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$launcherState = @{}
foreach ($name in $launcherNames) {
  $item = Get-Item "Env:$name" -ErrorAction SilentlyContinue
  $launcherState[$name] = if ($null -eq $item) {
    [pscustomobject]@{ Present = $false; Value = "" }
  } else {
    [pscustomobject]@{ Present = $true; Value = $item.Value }
  }
}
$runFailure = $null
$cleanupFailure = $null
$restoreFailures = [Collections.Generic.List[Management.Automation.ErrorRecord]]::new()
$rootCreated = $false
try {
  if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $rootCreated = $true
  foreach ($name in $launcherNames) {
    if (Test-Path "Env:$name") { Remove-Item "Env:$name" -ErrorAction Stop }
  }
  $lf = [string][char]10
  $crlf = [string][char]13 + [char]10
  $source = "src\com\java\class09"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $directNames = @("Ex01_Collection.java", "Ex02_Set.java", "Ex04_Set.java", "Ex08_Main.java")
  $direct = @($directNames | ForEach-Object { Join-Path $source $_ })
  $dependency = Join-Path $source "Ex07_Set.java"
  $scope = @($direct) + @($dependency)
  $packageOut = Join-Path $root "package classes"
  $directOut = Join-Path $root "direct only classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $packageOut, $directOut, $scopeOut -ErrorAction Stop | Out-Null

  $packageLog = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
  $packageExit = $LASTEXITCODE
  $directLog = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $directOut $direct 2>&1)
  $directExit = $LASTEXITCODE
  $scopeLog = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $scopeOut $scope 2>&1)
  $scopeExit = $LASTEXITCODE
  $warningCode = "compiler.warn.possible.this.escape"
  $missingCode = "compiler.err.cant.resolve.location"
  $packageWarnings = @($packageLog | Where-Object { $_.ToString().Contains($warningCode) })
  $scopeWarnings = @($scopeLog | Where-Object { $_.ToString().Contains($warningCode) })
  $directErrors = @($directLog | Where-Object { $_.ToString().Contains($missingCode) })
  if ($all.Count -ne 8 -or $packageExit -ne 0 -or $packageLog.Count -ne 2 -or $packageWarnings.Count -ne 1) { throw "package compile drift" }
  if ($direct.Count -ne 4 -or $directExit -ne 1 -or $directLog.Count -ne 6 -or $directErrors.Count -ne 5) { throw "direct dependency drift" }
  if ($scope.Count -ne 5 -or $scopeExit -ne 0 -or $scopeLog.Count -ne 2 -or $scopeWarnings.Count -ne 1) { throw "scope compile drift" }
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $scopeMains = @($scope | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  if ($packageMains -ne 6 -or $scopeMains -ne 3 -or ($all.Count - $packageMains) -ne 2 -or ($scope.Count - $scopeMains) -ne 2) { throw "source role drift" }

  function Invoke-Java([string]$main, [string]$stdin = "") {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = (Get-Command java -ErrorAction Stop).Source
    foreach ($arg in @("-Dfile.encoding=UTF-8", "-Duser.language=en", "-Duser.country=US", "-Duser.timezone=UTC", "-cp", $packageOut, $main)) { [void]$start.ArgumentList.Add($arg) }
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
        if (-not $process.WaitForExit(5000)) { throw "java did not terminate after kill" }
        [void]$stdoutTask.GetAwaiter().GetResult(); [void]$stderrTask.GetAwaiter().GetResult()
        throw "java timeout"
      }
      $out = $stdoutTask.GetAwaiter().GetResult().Replace($crlf, $lf).TrimEnd([char]10)
      $err = $stderrTask.GetAwaiter().GetResult()
      $lines = if ($out.Length -eq 0) { @() } else { @($out.Split([char]10)) }
      [pscustomobject]@{ Exit = $process.ExitCode; Out = $out; Err = $err; Lines = $lines }
    } finally { $process.Dispose() }
  }
  function Assert-Clean($run) { if ($run.Exit -ne 0 -or -not [string]::IsNullOrEmpty($run.Err)) { throw "main failed" } }
  function Parse-SetLine([string]$line) {
    if ($line -notmatch '^\[(?<inner>.*)\]$') { throw "set line shape drift" }
    $inner = $Matches.inner
    $items = if ($inner.Length -eq 0) { @() } else { @($inner -split ', ') }
    [pscustomobject]@{ Items = $items }
  }
  function Parse-Record([string]$line) {
    if ($line -notmatch '^(?<name>.+),\s*(?<age>\d+)$') { throw "record line shape drift" }
    [pscustomobject]@{ Name = $Matches.name; Age = [int]($Matches.age) }
  }
  function Record-Key($record) { $record.Name + [char]31 + $record.Age }

  $ex01 = Invoke-Java "com.java.class09.Ex01_Collection"
  $ex02 = Invoke-Java "com.java.class09.Ex02_Set"
  $ex03 = Invoke-Java "com.java.class09.Ex03_Set"
  $ex05 = Invoke-Java "com.java.class09.Ex05_Main"
  $ex06 = Invoke-Java "com.java.class09.Ex06_Set"
  $input08 = [string]::Join($lf, @("ALPHA", "90", "80", "70", "y", "ALPHA", "90", "80", "70", "n", ""))
  $ex08 = Invoke-Java "com.java.class09.Ex08_Main" $input08
  foreach ($run in @($ex01, $ex02, $ex03, $ex05, $ex06, $ex08)) { Assert-Clean $run }
  if ($ex01.Lines.Count -ne 0 -or $ex03.Lines.Count -ne 0) { throw "zero-output main drift" }

  if ($ex02.Lines.Count -ne 8 -or $ex02.Lines[4] -notmatch '^=+$' -or $ex02.Lines[4].Length -ne 26) { throw "Ex02 line drift" }
  $ex02Set = @((Parse-SetLine $ex02.Lines[0]).Items | ForEach-Object { [int]$_ } | Sort-Object)
  $ex02Enhanced = @($ex02.Lines[1..3] | ForEach-Object { [int]$_ } | Sort-Object)
  $ex02Iterator = @($ex02.Lines[5..7] | ForEach-Object { [int]$_ } | Sort-Object)
  if (($ex02Set -join '|') -cne '10|100|1000' -or ($ex02Enhanced -join '|') -cne ($ex02Set -join '|') -or ($ex02Iterator -join '|') -cne ($ex02Set -join '|')) { throw "Ex02 multiset drift" }

  if ($ex05.Lines.Count -ne 15 -or $ex05.Lines[3] -notmatch '^=+$' -or $ex05.Lines[8] -notmatch '^=+$' -or $ex05.Lines[13] -notmatch '^=+$') { throw "Ex05 line drift" }
  $arrayRecords = @($ex05.Lines[0..2] | ForEach-Object { Parse-Record $_ })
  $enhancedRecords = @($ex05.Lines[4..7] | ForEach-Object { Parse-Record $_ })
  $iteratorRecords = @($ex05.Lines[9..12] | ForEach-Object { Parse-Record $_ })
  $filteredRecord = Parse-Record $ex05.Lines[14]
  $arrayKeys = @($arrayRecords | ForEach-Object { Record-Key $_ })
  $enhancedKeys = @($enhancedRecords | ForEach-Object { Record-Key $_ } | Sort-Object)
  $iteratorKeys = @($iteratorRecords | ForEach-Object { Record-Key $_ } | Sort-Object)
  if (($arrayRecords.Age -join '|') -cne '24|3|17' -or @($enhancedRecords.Name | Sort-Object -Unique).Count -ne 4 -or ($enhancedRecords.Age | Sort-Object) -join '|' -cne '3|14|17|24') { throw "Ex05 record drift" }
  if (($enhancedKeys -join '|') -cne ($iteratorKeys -join '|') -or @($arrayKeys | Where-Object { $_ -notin $enhancedKeys }).Count -ne 0 -or (Record-Key $filteredRecord) -cne $arrayKeys[0]) { throw "Ex05 relation drift" }

  $ex04Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex04_Set.java")
  $ex05Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex05_Main.java")
  $ex05Active = [regex]::Replace($ex05Source, '(?m)^\s*//.*$', '')
  $privateValues = [Collections.Generic.List[string]]::new()
  foreach ($match in [regex]::Matches($ex04Source, 'name\s*=\s*"(?<value>[^"]+)"')) { $privateValues.Add($match.Groups['value'].Value) }
  foreach ($match in [regex]::Matches($ex05Source, 'setName\s*\(\s*"(?<value>[^"]+)"')) { $privateValues.Add($match.Groups['value'].Value) }
  foreach ($match in [regex]::Matches($ex05Source, 'new\s+Ex04_Set\s*\(\s*"(?<value>[^"]+)"\s*,\s*\d+')) { $privateValues.Add($match.Groups['value'].Value) }
  $activeCount = [regex]::Matches($ex04Source, 'name\s*=\s*"[^"]+"').Count + [regex]::Matches($ex05Active, 'setName\s*\(\s*"[^"]+"').Count + [regex]::Matches($ex05Active, 'new\s+Ex04_Set\s*\(\s*"[^"]+"\s*,\s*\d+').Count
  $commentCount = $privateValues.Count - $activeCount
  $length2 = @($privateValues | Where-Object Length -EQ 2).Count
  $length3 = @($privateValues | Where-Object Length -EQ 3).Count
  $runtimeNames = @($enhancedRecords.Name | Sort-Object -Unique)
  if ($privateValues.Count -ne 6 -or @($privateValues | Sort-Object -Unique).Count -ne 6 -or @($privateValues | Where-Object { $_ -notmatch '^[가-힣]{2,4}$' }).Count -ne 0 -or $activeCount -ne 5 -or $commentCount -ne 1 -or $length2 -ne 1 -or $length3 -ne 5) { throw "privacy source drift" }
  if ($runtimeNames.Count -ne 4 -or @($runtimeNames | Where-Object { $_ -notin $privateValues }).Count -ne 0) { throw "privacy runtime relation drift" }

  if ($ex06.Lines.Count -ne 6 -or -not $ex06.Lines[1].EndsWith('true') -or -not $ex06.Lines[3].EndsWith('true')) { throw "Ex06 line drift" }
  $setBefore = @((Parse-SetLine $ex06.Lines[0]).Items | Sort-Object)
  $setAfter = @((Parse-SetLine $ex06.Lines[2]).Items | Sort-Object)
  $setEmpty = @((Parse-SetLine $ex06.Lines[4]).Items)
  $setDuplicate = @((Parse-SetLine $ex06.Lines[5]).Items)
  $ex06Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex06_Set.java")
  $h2Adds = @([regex]::Matches($ex06Source, 'h2\.add\("(?<value>[^"]+)"\)') | ForEach-Object { $_.Groups['value'].Value })
  $lastFive = @($h2Adds[($h2Adds.Count - 5)..($h2Adds.Count - 1)])
  if ($setBefore.Count -ne 6 -or $setAfter.Count -ne 6 -or (Compare-Object $setBefore $setAfter).Count -ne 2 -or $setEmpty.Count -ne 0 -or $setDuplicate.Count -ne 1) { throw "Ex06 set relation drift" }
  if ($lastFive.Count -ne 5 -or @($lastFive | Sort-Object -Unique).Count -ne 1 -or $setDuplicate[0] -cne $lastFive[0]) { throw "Ex06 duplicate drift" }

  $recordPattern = 'ALPHA\t240\t80\.0\tB학점'
  if ($ex08.Lines.Count -ne 2 -or [regex]::Matches($ex08.Out, $recordPattern).Count -ne 2 -or [regex]::Matches($ex08.Out, '이름').Count -ne 2 -or [regex]::Matches($ex08.Out, '계속').Count -ne 2) { throw "Ex08 synthetic duplicate drift" }
  $ex07Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex07_Set.java")
  $ex08Source = Get-Content -Raw -LiteralPath (Join-Path $source "Ex08_Main.java")
  if ([regex]::Matches($ex04Source + $ex07Source, '\b(?:equals|hashCode)\s*\(').Count -ne 0 -or $ex08Source -notmatch 'HashSet<Ex07_Set>' -or $ex08Source -notmatch 'set\.add\(p\)') { throw "equality source shape drift" }

  "spacePath=$($root.Contains(' ')),package=8|exit:$packageExit|warnings:$($packageWarnings.Count)|mains:$packageMains,directOnly=4|exit:$directExit|errors:$($directErrors.Count),scope=5|exit:$scopeExit|warnings:$($scopeWarnings.Count)|mains:$scopeMains"
  "roles=direct:4|dependency:1|adjacent:3|packageCompileOnly:2|packageRunnable:6"
  "runs=Ex01:0|Ex02:8|Ex03:0|Ex05:15|Ex06:6|Ex08:2|clean:6"
  "normalized=Ex02:members3-loops3-3-orderHidden|Ex05:records12-setPairs4-orderHidden|Ex06:sizes6-6-0-1-diff2|Ex08:syntheticDuplicates2"
  "privacy=nameCandidates:6|active:$activeCount|comment:$commentCount|unique:6|lengths:2x$length2-3x$length3|runtimeSlots:4|rawPublished:false,shape=Ex04Equals:false|Ex07Equals:false|thisEscapeWarning:1"
} catch {
  $runFailure = $_
} finally {
  try {
    $resolved = [IO.Path]::GetFullPath($root)
    if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
    if ($rootCreated -and (Test-Path -LiteralPath $resolved)) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
    if ($rootCreated -and (Test-Path -LiteralPath $resolved)) { throw "cleanup failed" }
  } catch {
    $cleanupFailure = $_
  }
  foreach ($name in $launcherNames) {
    try {
      $state = $launcherState[$name]
      if ($state.Present) {
        Set-Item "Env:$name" $state.Value -ErrorAction Stop
        if ((Get-Item "Env:$name" -ErrorAction Stop).Value -cne $state.Value) { throw "environment value restore failed" }
      } else {
        if (Test-Path "Env:$name") { Remove-Item "Env:$name" -ErrorAction Stop }
        if (Test-Path "Env:$name") { throw "environment absence restore failed" }
      }
    } catch {
      $restoreFailures.Add($_)
    }
  }
}
if ($null -ne $cleanupFailure -or $restoreFailures.Count -ne 0) {
  $lifecycleFailure = [InvalidOperationException]::new("audit lifecycle cleanup or restoration failed")
  if ($null -ne $runFailure) { $lifecycleFailure.Data["run"] = $runFailure }
  if ($null -ne $cleanupFailure) { $lifecycleFailure.Data["cleanup"] = $cleanupFailure }
  if ($restoreFailures.Count -ne 0) { $lifecycleFailure.Data["restore"] = [object[]]$restoreFailures }
  throw $lifecycleFailure
}
if ($null -ne $runFailure) { throw $runFailure }`,
        walkthrough: [
          { lines: "1-35", explanation: "네 launcher options의 존재·값을 mutation 전에 snapshot하고, outer try 안에서 공백 OS temp direct child를 생성했다는 ownership flag와 options 제거, package8·direct4·Ex07 dependency scope5, 세 output directories를 준비합니다." },
          { lines: "37-54", explanation: "package/scope는 warning1·exit0, directOnly는 missing Ex07 errors5·exit1인지 code와 captured line count까지 검증하고 main/compile-only roles를 계산합니다." },
          { lines: "56-98", explanation: "ArgumentList와 UTF-8 redirects, child environment isolation, async dual drain,10초 timeout·tree kill·5초 grace·Dispose를 가진 fresh-JVM helper와 set/record parsers를 만듭니다." },
          { lines: "100-108", explanation: "six mains를 실행하고 Ex08에 같은 synthetic record를 두 번 입력하며 Ex01·Ex03의 output0도 assert합니다." },
          { lines: "110-114", explanation: "Ex02 raw HashSet order를 버리고 set/enhanced/iterator numeric multisets3이 같은지 확인합니다." },
          { lines: "116-125", explanation: "Ex05 array/set/iterator/filter records를 name+age internal keys로 비교하고 ages·pair inclusion·two traversal equality만 공개합니다." },
          { lines: "127-140", explanation: "Ex04/Ex05 name-like source candidates6·active5·comment1·lengths2x1+3x5·runtime slots4를 raw 없이 count하고 runtime names가 source candidates에 속하는지만 확인합니다." },
          { lines: "142-151", explanation: "Ex06 four set views를 sizes6-6-0-1과 symmetric difference2로 normalize하고 같은 literal add5회가 one member인지 source/output 관계로 검증합니다." },
          { lines: "153-157", explanation: "Ex08 synthetic logical duplicate2와 prompt counts를 확인하고 Ex04/Ex07에 equals/hashCode override가 없다는 source shape를 연결합니다." },
          { lines: "159-197", explanation: "order·private raw 없는 다섯 summary lines를 출력하고 work failure를 보존합니다. finally는 자신이 만든 root만 cleanup하고 cleanup error를 포착해도 네 variables 각각의 복원을 계속하며 상태를 재검증합니다. run·cleanup·모든 restore errors는 aggregate lifecycle exception Data에 함께 보존되고 cleanup 이후 보고됩니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root", "four Java launcher option variables isolated/restored", "raw HashSet order and name-like values never published"], command: "pwsh -NoProfile -File verify-original-core04.ps1" },
        output: { value: "spacePath=True,package=8|exit:0|warnings:1|mains:6,directOnly=4|exit:1|errors:5,scope=5|exit:0|warnings:1|mains:3\nroles=direct:4|dependency:1|adjacent:3|packageCompileOnly:2|packageRunnable:6\nruns=Ex01:0|Ex02:8|Ex03:0|Ex05:15|Ex06:6|Ex08:2|clean:6\nnormalized=Ex02:members3-loops3-3-orderHidden|Ex05:records12-setPairs4-orderHidden|Ex06:sizes6-6-0-1-diff2|Ex08:syntheticDuplicates2\nprivacy=nameCandidates:6|active:5|comment:1|unique:6|lengths:2x1-3x5|runtimeSlots:4|rawPublished:false,shape=Ex04Equals:false|Ex07Equals:false|thisEscapeWarning:1", explanation: ["direct4 실패는 exercise 오류가 아니라 Ex08→Ex07 source dependency 증거입니다.", "package/scope warning1은 constructor this escape이고 raw/unchecked warning은0입니다.", "HashSet outputs는 multisets·sizes·relations만 공개하고 order는 숨깁니다.", "name-like source/runtime values는 count·length·membership relation 외 공개되지 않습니다."] },
        experiments: [
          { change: "Ex07_Set을 scope에서 제거합니다.", prediction: "Ex08의 다섯 type use sites가 cant.resolve.location errors가 되어 directOnly baseline과 같아집니다.", result: "inventory direct list와 compilable atomic scope를 dependency evidence로 연결해야 합니다." },
          { change: "Ex02/Ex05/Ex06 raw Set 문자열을 exact golden으로 저장합니다.", prediction: "JDK implementation·capacity·hash/identity 변화가 semantic equality와 무관한 false failure를 만듭니다.", result: "unordered abstraction은 member multiset과 membership으로 검증합니다." },
          { change: "Ex07에 value-based equals/hashCode를 추가하고 Ex08 같은 synthetic record 둘을 넣습니다.", prediction: "record output occurrence가2에서1로 줄어듭니다.", result: "Set duplicate 의미는 element type의 equality/hash contract가 정의합니다." },
        ],
        sourceRefs: ["java-class09-ex01", "java-class09-ex02", "java-class09-ex03", "java-class09-ex04", "java-class09-ex05", "java-class09-ex06", "java-class09-ex07", "java-class09-ex08", "jdk21-javac", "dotnet-process-start-info", "powershell-environment-variables", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async", "java-hash-set-api", "java-object-api"],
      }],
      diagnostics: [
        { symptom: "direct4 compile이 Ex08에서 unknown Ex07_Set errors5로 실패한다.", likelyCause: "inventory direct files만 compile하고 source dependency Ex07_Set을 scope에 포함하지 않았습니다.", checks: ["diagnostic use sites와 missing type을 셉니다.", "Ex08의 generic/constructor/iterator uses를 찾습니다.", "별도 output에서 scope5를 재compile합니다."], fix: "Ex07_Set을 dependency로 포함한 atomic scope5를 사용합니다.", prevention: "session inventory에 direct·dependency·adjacent companion 역할을 별도 fields/evidence로 기록합니다." },
        { symptom: "원본 Set output snapshot이 JDK나 실행마다 달라진다.", likelyCause: "HashSet의 unspecified iteration order와 identity-based element hashes를 exact string으로 고정했습니다.", checks: ["collection concrete type을 확인합니다.", "raw order가 requirement인지 묻습니다.", "sorted multiset equality를 비교합니다."], fix: "order가 필요 없으면 multiset/size/membership으로 normalize하고, 필요하면 LinkedHashSet/TreeSet을 명시합니다.", prevention: "Set tests에서 order assertion을 금지하고 order-bearing type에만 sequence golden을 허용합니다." },
        { symptom: "학습자료 공개 output에 원본 name-like 값이 보인다.", likelyCause: "Ex05 raw stdout 또는 source literal을 golden/error message로 복사했습니다.", checks: ["source/runtime candidate values를 memory-only로 분류합니다.", "public file에서 exact/normalized/token leaks를 scan합니다.", "failure messages에 actual value가 있는지 봅니다."], fix: "count·length·age multiset·pair relation만 출력하고 synthetic Ex08 input을 사용합니다.", prevention: "원본 candidate-derived dynamic zero-leak scan과 rawPublished:false contract를 CI에 둡니다." },
      ],
      expertNotes: ["possible-this-escape warning을 generics warning으로 잘못 분류하지 않습니다. Ex07 constructor가 public overridable method chain을 호출하는 별도 OOP initialization debt입니다.", "HashSet order를 sorting해 보여 주는 것은 test normalization이지 실제 Set이 sorted라는 뜻이 아니므로 UI와 explanation에 normalized라는 말을 유지합니다."],
    },
    {
      id: "collection-iterable-hierarchy-traversal",
      title: "Collection은 원소 연산을, Iterable은 순회를 약속하며 Iterator가 안전한 제거 지점을 가집니다",
      lead: "List와 Set을 외우기 전에 최상위 계약을 읽으면 어떤 메서드가 순서·중복을 보장하는지, 순회 중 구조 변경을 누가 책임지는지 분리할 수 있습니다.",
      explanations: [
        "Iterable<T>는 iterator() 한 가지 핵심 순회 진입점을 제공하고 Collection<E>는 size·contains·add·remove·bulk operations를 더합니다. Collection은 Iterable의 하위 타입이므로 enhanced for와 forEach를 사용할 수 있지만, Iterable 자체가 add나 size를 약속하는 것은 아닙니다.",
        "Collection이라는 변수 타입은 구현 선택을 숨깁니다. 이 예제의 실제 구현은 ArrayList라 encounter order가 보존되지만 Collection 계약만 보는 호출자는 임의 위치 접근이나 정렬 상태를 가정할 수 없습니다.",
        "enhanced for는 내부적으로 Iterator와 같은 순회 규칙을 따릅니다. 그 루프 안에서 collection.remove를 호출하면 iterator의 expected modification count와 실제 구조가 어긋나 ConcurrentModificationException이 날 수 있습니다.",
        "현재 원소를 제거해야 한다면 해당 구현이 지원할 때 Iterator.next 다음 Iterator.remove를 사용합니다. remove는 optional operation이라 unmodifiable/fixed-size/unsupported iterator에서는 UnsupportedOperationException일 수 있고, 지원되는 iterator에서도 next 전 호출이나 한 next 뒤 두 번 호출은 IllegalStateException입니다. 이 장의 ArrayList iterator는 remove를 지원합니다.",
        "forEach는 읽기·외부 효과에 간결하지만 중간 중단, checked exception, 구조 변경에는 적합하지 않습니다. 필터링은 removeIf, 새 결과 구성은 stream/filter/toList처럼 의도를 드러내는 연산이 낫습니다.",
        "toArray(String[]::new)는 런타임 component type이 String인 독립 배열을 만듭니다. 매개변수 없는 toArray는 Object[]이므로 String[]로 cast할 수 없고, collection 이후 변경이 이미 만든 배열에 반영되지 않습니다.",
        "containsAll·addAll·removeAll·retainAll은 집합처럼 보이는 bulk operation이지만 Collection 일반 계약에는 중복·순서 의미가 없습니다. mutation methods 자체도 optional operation이라 unmodifiable/fixed-size 구현은 UnsupportedOperationException을 던질 수 있고, add의 false는 오류가 아니라 이 호출로 collection이 unchanged라는 뜻입니다. 구체 구현의 equality·ordering·mutation 정책을 함께 읽어야 합니다.",
        "fail-fast iterator는 동시성 보장이 아니라 버그 탐지 편의입니다. 경쟁 상태를 확실히 검출한다는 약속이 아니며 멀티스레드 공유에는 동시 컬렉션, locking, immutable snapshot 같은 별도 정책이 필요합니다.",
      ],
      concepts: [
        { term: "Iterable<T>", definition: "원소의 연속 방문을 위한 Iterator<T>를 제공하는 최소 순회 계약입니다.", detail: ["enhanced for가 사용할 수 있습니다.", "원소 추가·크기·중복 정책은 포함하지 않습니다."], caveat: "순회 가능하다는 사실만으로 재순회 가능성이나 encounter order까지 보장되지는 않습니다." },
        { term: "Collection<E>", definition: "원소 그룹의 크기·membership·mutation·bulk operations를 표현하는 List·Set·Queue의 공통 상위 계약입니다.", detail: ["index 접근은 List의 책임입니다.", "중복 금지는 Set의 책임입니다."] },
        { term: "structural modification", definition: "collection 크기 또는 iterator가 보는 구조를 바꾸는 변경입니다.", detail: ["지원되는 Iterator.remove는 현재 iterator와 변경을 조율합니다.", "value replacement처럼 크기를 안 바꿔도 구현별 정의를 확인해야 합니다."], caveat: "Iterator.remove도 optional이며 fail-fast는 best-effort 진단이지 thread-safety mechanism이 아닙니다." },
      ],
      codeExamples: [{
        id: "java-collection-traversal-lab",
        title: "Iterator 제거와 encounter order, typed snapshot, bulk membership을 분리합니다",
        language: "java",
        filename: "CollectionTraversalLab.java",
        purpose: "Collection/Iterable 계층의 실제 사용 지점과 안전한 순회 중 제거를 warning0 실행 계약으로 고정합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

public class CollectionTraversalLab {
    public static void main(String[] args) {
        Collection<String> tasks = new ArrayList<>(
                List.of("read", "skip", "write", "review"));

        for (Iterator<String> it = tasks.iterator(); it.hasNext();) {
            if (it.next().equals("skip")) {
                it.remove();
            }
        }

        StringBuilder encounter = new StringBuilder();
        tasks.forEach(task -> {
            if (encounter.length() > 0) encounter.append('>');
            encounter.append(task);
        });
        String[] snapshot = tasks.toArray(String[]::new);

        System.out.println("iterable=" + (tasks instanceof Iterable<?>));
        System.out.println("collection=" + tasks);
        System.out.println("encounter=" + encounter);
        System.out.println("typedArray=" + snapshot.length + ":"
                + snapshot[0] + ":" + snapshot[2]);
        System.out.println("bulk="
                + tasks.containsAll(List.of("read", "review")));
    }
}`,
        walkthrough: [
          { lines: "1-4", explanation: "공통 Collection 타입과 실제 ArrayList 구현, 명시적 Iterator를 각각 import합니다." },
          { lines: "7-9", explanation: "변수의 정적 타입은 Collection이지만 ArrayList의 encounter order를 가진 네 원소로 시작합니다." },
          { lines: "11-15", explanation: "next가 반환한 skip을 같은 iterator의 remove로 제거해 cursor와 구조 변경 상태를 일치시킵니다." },
          { lines: "17-21", explanation: "forEach는 남은 encounter order를 읽기만 하고 구분자를 결정적으로 조립합니다." },
          { lines: "22-22", explanation: "배열 생성자 reference로 런타임 component type이 String인 독립 snapshot을 얻습니다." },
          { lines: "24-30", explanation: "계층 관계·ordered view·typed array 경계·bulk membership을 값별 계약으로 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0"], command: isolatedJavaRun("CollectionTraversalLab.java", "CollectionTraversalLab") },
        output: { value: "iterable=true\ncollection=[read, write, review]\nencounter=read>write>review\ntypedArray=3:read:review\nbulk=true", explanation: ["ArrayList를 선택했기 때문에 이 예제에서만 encounter order가 exact입니다.", "typed array는 collection의 독립 snapshot이며 이후 양방향 동기화되지 않습니다."] },
        experiments: [
          { change: "enhanced for 안에서 tasks.remove(task)를 호출합니다.", prediction: "다음 iterator advancement에서 ConcurrentModificationException이 발생할 수 있습니다.", result: "현재 원소 제거는 Iterator.remove 또는 removeIf에 맡깁니다." },
          { change: "구현을 HashSet으로 바꾸고 encounter 문자열을 exact assertion합니다.", prediction: "원소 membership은 같아도 순서 계약이 사라집니다.", result: "order requirement가 있으면 order-bearing implementation을 명시합니다." },
          { change: "tasks.toArray() 결과를 String[]로 cast합니다.", prediction: "실제 배열 타입이 Object[]라 ClassCastException이 납니다.", result: "typed generator overload를 사용합니다." },
        ],
        sourceRefs: ["java-iterable-api", "java-collection-api", "java-iterator-api", "java-array-list-api"],
      }],
      diagnostics: [
        { symptom: "enhanced for에서 원소를 지우다가 ConcurrentModificationException이 난다.", likelyCause: "iterator 외부 경로로 구조를 변경해 iterator가 기억한 modification state와 달라졌습니다.", checks: ["변경이 루프 본문에서 일어나는지 봅니다.", "iterator.remove 또는 removeIf로 표현 가능한지 확인합니다.", "다른 thread 변경 여부도 확인합니다."], fix: "단일 순회 제거는 Iterator.remove, 조건 제거는 removeIf, 변환은 새 collection 생성을 사용합니다.", prevention: "읽기 순회와 mutation 단계를 분리하고 collection ownership을 문서화합니다." },
        { symptom: "toArray 결과를 String[]로 cast했는데 런타임 예외가 난다.", likelyCause: "매개변수 없는 toArray의 런타임 타입은 Object[]입니다.", checks: ["선택한 overload를 확인합니다.", "배열의 getClass를 디버깅합니다.", "generic element type과 reified array component를 구분합니다."], fix: "toArray(String[]::new) 또는 toArray(new String[0])를 사용합니다.", prevention: "Object[] overload에 element-type cast를 붙이지 않는 review rule을 둡니다." },
        { symptom: "Collection.remove 또는 Iterator.remove가 UnsupportedOperationException을 던진다.", likelyCause: "Collection/Iterator mutation은 optional operation이고 현재 fixed-size·unmodifiable·unsupported 구현이 이를 제공하지 않습니다.", checks: ["실제 concrete implementation과 생성 경로를 봅니다.", "Arrays.asList·List.of·unmodifiable wrapper인지 확인합니다.", "API가 mutation을 정말 허용해야 하는지 ownership을 검토합니다."], fix: "mutation이 요구되면 new ArrayList<>(source) 같은 mutable owned copy를 만들고, 그렇지 않으면 변환 결과를 새 collection으로 반환합니다.", prevention: "method contract에 mutability/ownership을 적고 add false와 exception을 서로 다른 결과로 처리합니다." },
      ],
      expertNotes: ["Iterator의 fail-fast 동작을 correctness proof로 쓰지 않습니다. 동시 변경이 탐지되지 않아도 데이터 경쟁은 여전히 잘못입니다.", "API parameter는 필요한 최소 계약으로 받되, order·duplicates·random access가 business invariant라면 Collection보다 더 구체적인 abstraction을 선택합니다."],
    },
    {
      id: "generic-type-safety-invariance-bounds",
      title: "제네릭은 compile-time type 관계를 보존하고 invariance와 bound가 허용 연산을 정확히 제한합니다",
      lead: "T를 아무 타입이라는 뜻으로 읽지 말고 호출 지점에서 하나의 일관된 타입으로 대입되는 변수로 읽으면 cast 제거, invariance, bound의 이유가 연결됩니다.",
      explanations: [
        "Box<T>의 T는 인스턴스 생성 시 선택된 element type을 field·constructor·return에 동일하게 적용합니다. Box<Integer>에서 get 결과는 compiler가 Integer임을 알고 별도 cast가 없습니다.",
        "List<Integer>는 List<Number>의 하위 타입이 아닙니다. 만약 허용된다면 List<Number> 별칭을 통해 Double을 추가해 원래 List<Integer>의 약속을 깨뜨릴 수 있으므로 Java generic types는 기본적으로 invariant입니다.",
        "generic method의 type parameter는 반환 타입 앞에 선언합니다. static <T> T first(List<T>)는 호출 argument에서 T를 추론하고 첫 원소의 입력·출력 type 관계를 유지합니다.",
        "<T extends Comparable<? super T>>는 T 자신 또는 T의 상위 타입을 비교할 수 있는 값만 받습니다. 단순 Comparable<T>보다 상속된 비교 구현을 수용하는 실무적인 recursive bound입니다.",
        "upper-bounded wildcard List<? extends Number>는 실제 list가 Integer인지 Double인지 모르는 대신 Number로 안전하게 읽을 수 있습니다. null 외의 값을 add할 수 없는 이유는 숨겨진 실제 element type을 보존해야 하기 때문입니다.",
        "type argument는 primitive가 될 수 없으므로 List<int>가 아니라 List<Integer>를 사용합니다. boxing은 편리하지만 null·identity·allocation·unboxing NPE 경계를 추가합니다.",
        "generic abstraction은 runtime validation을 없애지 않습니다. 빈 list의 first, null element, domain range 같은 값 조건은 여전히 precondition이나 결과 타입으로 설계해야 합니다.",
        "타입 추론이 복잡해졌을 때 raw type이나 무리한 cast로 우회하지 말고 변수·helper method·명시적 type witness로 관계를 작게 분리합니다. compiler가 거부하는 이유가 곧 손실될 계약입니다.",
      ],
      concepts: [
        { term: "invariance", definition: "A가 B의 subtype이어도 G<A>가 G<B>의 subtype이 되지 않는 generic type 관계입니다.", detail: ["write 가능 mutable container의 type safety를 지킵니다.", "읽기/쓰기 variance 요구는 wildcard로 표현합니다."], caveat: "array는 covariant라 compile은 되지만 잘못된 저장을 runtime ArrayStoreException으로 미룹니다." },
        { term: "generic method", definition: "class의 type parameter와 독립적으로 호출마다 추론되는 type parameter를 선언한 method입니다.", detail: ["<T>는 반환 타입 앞에 둡니다.", "argument와 result 사이 type 관계를 보존합니다."] },
        { term: "bounded type parameter", definition: "T가 제공해야 할 상위 class/interface 능력을 extends bound로 제한한 type variable입니다.", detail: ["여러 bound에서는 class를 먼저 씁니다.", "Comparable<? super T>는 상위 타입 비교 구현도 허용합니다."], caveat: "bound는 compile-time capability이며 business value 범위를 자동 검증하지 않습니다." },
      ],
      codeExamples: [{
        id: "java-generic-type-safety-lab",
        title: "Box·generic first·recursive bound·upper wildcard를 cast 없이 사용합니다",
        language: "java",
        filename: "GenericTypeSafetyLab.java",
        purpose: "한 type parameter가 여러 위치의 관계를 보존하는 방법과 읽기 전용 upper wildcard를 실행으로 확인합니다.",
        code: String.raw`import java.util.List;

public class GenericTypeSafetyLab {
    record Box<T>(T value) {}

    static <T> T first(List<T> values) {
        if (values.isEmpty()) throw new IllegalArgumentException("empty");
        return values.get(0);
    }

    static <T extends Comparable<? super T>> T max(List<T> values) {
        T best = first(values);
        for (T value : values) {
            if (value.compareTo(best) > 0) best = value;
        }
        return best;
    }

    static double sum(List<? extends Number> values) {
        double total = 0.0;
        for (Number value : values) total += value.doubleValue();
        return total;
    }

    public static void main(String[] args) {
        Box<Integer> box = new Box<>(7);
        List<String> words = List.of("alpha", "omega", "beta");
        List<Integer> integers = List.of(1, 2, 3);
        List<? extends Number> readable = integers;

        System.out.println("box=" + box.value());
        System.out.println("first=" + first(words));
        System.out.println("max=" + max(List.of(4, 9, 2)));
        System.out.println("sum=" + sum(List.of(1, 2.5, 3)));
        System.out.println("wildcardSize=" + readable.size());
    }
}`,
        walkthrough: [
          { lines: "1-4", explanation: "record Box<T>가 value의 입력·저장·반환 타입을 하나의 T로 연결합니다." },
          { lines: "6-9", explanation: "generic method first는 호출마다 T를 추론하고 빈 값이라는 별도 value precondition을 검사합니다." },
          { lines: "11-17", explanation: "recursive bound 덕분에 compareTo를 안전하게 호출해 동일 T를 반환합니다." },
          { lines: "19-23", explanation: "upper wildcard가 숨긴 구체 element type을 Number로만 읽고 수치 합계를 만듭니다." },
          { lines: "25-37", explanation: "diamond inference, String/Integer별 generic method 추론, heterogeneous Number literals의 합, wildcard view 크기를 exact 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0"], command: isolatedJavaRun("GenericTypeSafetyLab.java", "GenericTypeSafetyLab") },
        output: { value: "box=7\nfirst=alpha\nmax=9\nsum=6.5\nwildcardSize=3", explanation: ["어떤 출력에도 unchecked cast가 필요하지 않습니다.", "readable의 실제 element type은 Integer지만 wildcard API는 Number 읽기만 약속합니다."] },
        experiments: [
          { change: "List<Number> numbers = integers를 추가합니다.", prediction: "incompatible types compile error가 납니다.", result: "mutable generic type은 invariant입니다." },
          { change: "readable.add(4)를 추가합니다.", prediction: "capture of ?에 Integer를 넣을 수 없다는 compile error가 납니다.", result: "upper wildcard는 producer view입니다." },
          { change: "max에 Comparable을 구현하지 않은 객체 list를 전달합니다.", prediction: "bound inference가 실패해 compile되지 않습니다.", result: "필요한 capability가 API boundary에서 검증됩니다." },
        ],
        sourceRefs: ["jls-type-variables", "jls-parameterized-types", "jls-type-inference", "java-list-api", "java-comparable-api"],
      }],
      diagnostics: [
        { symptom: "List<Integer>를 List<Number> parameter에 전달할 수 없다.", likelyCause: "subtype element 관계를 generic container 관계로 잘못 확장했습니다.", checks: ["method가 읽기만 하는지 쓰기도 하는지 확인합니다.", "Number 추가 가능성이 있는 signature인지 봅니다.", "array covariance와 혼동했는지 확인합니다."], fix: "읽기만 하면 List<? extends Number>, Number를 소비하면 List<? super Integer>, 정확한 동일 타입이면 List<T>를 사용합니다.", prevention: "API를 producer·consumer·in/out 역할로 먼저 분류합니다." },
        { symptom: "generic helper 호출에서 inference has incompatible bounds가 발생한다.", likelyCause: "서로 다른 arguments가 같은 T에 양립할 수 없는 equality/lower/upper constraints를 부과합니다.", checks: ["각 argument가 T를 어떻게 제한하는지 적습니다.", "target type이 추가 constraint를 주는지 봅니다.", "raw/cast 전에 helper 역할을 분리합니다."], fix: "중간 변수 또는 더 정확한 bound/wildcard로 관계를 분명히 합니다.", prevention: "하나의 T가 실제로 같은 의미의 타입만 연결하도록 API를 작게 설계합니다." },
      ],
      expertNotes: ["generic type parameter를 문서 없는 Object 대체품처럼 남발하지 않습니다. 입력과 출력 사이 보존할 관계가 없다면 wildcard 또는 구체 상위 타입이 더 정확할 수 있습니다.", "Comparable<T> 대신 Comparable<? super T>를 요구하면 상위 class에서 정의된 natural ordering을 상속한 subtype도 max에 참여할 수 있습니다."],
    },
    {
      id: "wildcards-pecs-capture",
      title: "PECS는 읽기와 쓰기 방향을 표현하고 wildcard capture helper가 같은 숨은 타입의 관계를 복원합니다",
      lead: "extends와 super를 권한으로 읽으면 wildcard가 막는 연산을 억지 cast로 뚫지 않고 producer·consumer boundary를 정확히 설계할 수 있습니다.",
      explanations: [
        "Producer Extends, Consumer Super는 기억법이지 전체 설계 법칙의 끝이 아닙니다. source가 T를 생산하면 ? extends T, destination이 T를 소비하면 ? super T를 사용하며 둘 다 필요하면 invariant List<T>가 보통 정확합니다.",
        "copy(List<? extends T>, List<? super T>)에서 source 원소는 최소 T로 읽을 수 있고 destination에는 T를 넣을 수 있습니다. 그래서 List<Integer>에서 List<Number> 또는 List<Object>로 안전하게 복사됩니다.",
        "List<? super Integer>에서 get 결과는 Object로만 안전합니다. 실제 list가 List<Integer>, List<Number>, List<Object> 중 무엇인지 모르기 때문에 Number라고도 단정할 수 없습니다.",
        "unbounded wildcard List<?>는 List<? extends Object>와 유사한 읽기 권한을 가지며 non-null add는 막힙니다. 그러나 clear·remove·size처럼 element type을 새로 공급하지 않는 연산은 가능합니다.",
        "capture conversion은 compiler가 각 wildcard expression에 임시 고유 타입 CAP#1을 부여하는 과정입니다. helper <T>에 List<?>를 넘기면 그 한 capture를 T로 이름 붙여 get한 값을 같은 list에 set할 수 있습니다.",
        "서로 다른 List<?> 두 개는 각각 다른 capture일 수 있습니다. 두 list 사이 값을 교환하려면 같은 실제 element type이라는 추가 계약을 API에 명시해야 하며, cast로 추정해서는 안 됩니다.",
        "public API에서 지나치게 복잡한 wildcard return type은 호출자에게 capture 부담을 전가합니다. return은 구체 interface type으로 단순하게 하고 input flexibility에 wildcard를 쓰는 경향이 읽기 쉽습니다.",
        "null은 모든 reference type에 들어갈 수 있어 extends wildcard에도 add(null)는 compile될 수 있지만, 숨은 타입 보존과 별개로 null policy를 깨뜨릴 수 있으므로 허용 권한으로 해석하면 안 됩니다.",
      ],
      concepts: [
        { term: "PECS", definition: "T를 제공하는 parameter는 ? extends T, T를 받아들이는 parameter는 ? super T로 표현하는 설계 기억법입니다.", detail: ["producer에서 T로 읽습니다.", "consumer에 T 또는 T subtype을 씁니다."], caveat: "한 container가 동시에 생산·소비하면 invariant type parameter가 더 적합합니다." },
        { term: "wildcard capture", definition: "compiler가 ?의 알려지지 않은 실제 타입을 하나의 임시 type variable로 다루는 변환입니다.", detail: ["private generic helper로 이름 붙일 수 있습니다.", "같은 capture 내부의 get/set 관계가 보존됩니다."] },
        { term: "lower-bounded wildcard", definition: "? super T로 T 또는 T의 상위 element type을 가진 consumer를 수용합니다.", detail: ["T를 안전하게 add할 수 있습니다.", "읽기는 Object까지만 안전합니다."], caveat: "runtime collection이 Number인지 Object인지 signature만으로 알 수 없습니다." },
      ],
      codeExamples: [{
        id: "java-pecs-wildcard-capture-lab",
        title: "extends source를 super destination에 복사하고 capture helper로 endpoints를 바꿉니다",
        language: "java",
        filename: "PecsWildcardCaptureLab.java",
        purpose: "PECS의 양방향 권한과 unbounded wildcard가 helper 안에서 하나의 T로 capture되는 과정을 보여 줍니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.List;

public class PecsWildcardCaptureLab {
    static <T> void copy(List<? extends T> source,
                         List<? super T> destination) {
        for (T value : source) destination.add(value);
    }

    static void swapEndpoints(List<?> values) {
        swapCaptured(values, 0, values.size() - 1);
    }

    private static <T> void swapCaptured(List<T> values, int left, int right) {
        T temporary = values.get(left);
        values.set(left, values.get(right));
        values.set(right, temporary);
    }

    public static void main(String[] args) {
        List<Integer> source = List.of(1, 2, 3);
        List<Number> destination = new ArrayList<>(List.of(0.5));
        copy(source, destination);

        List<String> words = new ArrayList<>(
                List.of("alpha", "beta", "gamma"));
        swapEndpoints(words);

        System.out.println("source=" + source);
        System.out.println("destination=" + destination);
        System.out.println("captured=" + words);
        System.out.println("consumerReadType="
                + destination.get(1).getClass().getSimpleName());
    }
}`,
        walkthrough: [
          { lines: "1-8", explanation: "copy의 source는 T producer, destination은 T consumer이며 loop에는 cast가 없습니다." },
          { lines: "10-12", explanation: "public helper는 List<?>를 받아 호출자가 element type을 알 필요 없게 합니다." },
          { lines: "14-18", explanation: "private <T> helper가 한 wildcard capture를 이름 붙여 같은 list의 get/set 관계를 복원합니다." },
          { lines: "20-23", explanation: "Integer source가 Number destination을 소비자로 사용해 기존 Double 뒤에 세 값을 추가합니다." },
          { lines: "25-27", explanation: "mutable String list도 unbounded public API를 통해 type-safe하게 양 끝이 교환됩니다." },
          { lines: "29-33", explanation: "source 불변, destination 확장, capture 결과와 super consumer에서 읽은 runtime class를 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0"], command: isolatedJavaRun("PecsWildcardCaptureLab.java", "PecsWildcardCaptureLab") },
        output: { value: "source=[1, 2, 3]\ndestination=[0.5, 1, 2, 3]\ncaptured=[gamma, beta, alpha]\nconsumerReadType=Integer", explanation: ["destination 정적 읽기 타입은 Number이지만 lower wildcard를 직접 받는 method 안에서는 Object만 안전합니다.", "capture helper는 runtime cast 없이 같은 숨은 타입 내부에서만 값을 이동합니다."] },
        experiments: [
          { change: "copy의 source를 List<T>, destination도 List<T>로 바꿉니다.", prediction: "Integer source와 Number destination 조합에서 하나의 invariant T를 추론하지 못합니다.", result: "입력 방향에 맞춘 wildcard가 재사용 범위를 넓힙니다." },
          { change: "swapEndpoints 안에서 values.set(0, values.get(1))를 직접 작성합니다.", prediction: "표현식별 capture가 맞지 않는다는 compile error가 날 수 있습니다.", result: "generic helper가 capture에 안정된 이름을 줍니다." },
          { change: "List<? super Integer>에서 읽은 값을 Number 변수에 직접 대입합니다.", prediction: "Object에서 Number로 변환할 수 없다는 compile error가 납니다.", result: "super는 쓰기 권한을 넓히는 대신 읽기 정보가 Object로 약해집니다." },
        ],
        sourceRefs: ["jls-wildcards", "jls-capture-conversion", "java-collections-api", "java-list-api"],
      }],
      diagnostics: [
        { symptom: "required CAP#1, found CAP#2 형태의 이해하기 어려운 compile error가 난다.", likelyCause: "wildcard를 두 번 독립적으로 capture했거나 get 결과를 다른 unknown type 위치에 넣었습니다.", checks: ["각 ?가 같은 expression에서 왔는지 확인합니다.", "get과 set이 같은 list 안인지 봅니다.", "private generic helper로 한 capture를 이름 붙여 봅니다."], fix: "List<?> public wrapper에서 <T> helper로 위임해 한 T 안에서 연산합니다.", prevention: "wildcard 간 값을 이동하는 API에는 실제 동일 타입 관계를 type parameter로 명시합니다." },
        { symptom: "? super T list에서 꺼낸 값을 T로 받을 수 없다.", likelyCause: "consumer가 실제로는 Object 또는 T의 다른 상위 타입 list일 수 있다는 정보를 무시했습니다.", checks: ["읽기가 API에 정말 필요한지 봅니다.", "Object로 가능한 작업인지 확인합니다.", "in/out 모두 필요하면 invariant type으로 바꿀지 검토합니다."], fix: "읽기는 Object로 제한하거나 parameter를 List<T>로 강화합니다.", prevention: "PECS를 단순 문법이 아니라 권한 표로 code review에 사용합니다." },
      ],
      expertNotes: ["wildcard capture helper는 type system이 이미 알고 있는 관계를 표현하는 장치이지 unchecked cast를 감추는 장소가 아닙니다.", "return type의 wildcard는 호출자가 값을 다시 전달하거나 저장할 때 마찰이 크므로, library API에서는 input variance와 output usability를 따로 평가합니다."],
    },
    {
      id: "erasure-bridge-runtime-type-boundary",
      title: "type erasure는 parameterized types를 같은 runtime class로 만들고 bridge method가 overriding 다형성을 보존합니다",
      lead: "제네릭 정보가 전부 사라진다고 뭉뚱그리기보다 어디에 Signature metadata가 남고 어떤 실행 cast와 bridge가 생성되는지 구분해야 reflection·overload·binary compatibility를 설명할 수 있습니다.",
      explanations: [
        "Java generic은 주로 erasure로 구현됩니다. List<String>과 List<Integer> 객체는 모두 runtime에 java.util.ImmutableCollections 계열 같은 같은 raw class를 사용할 수 있고 type argument별 새 class가 생성되지 않습니다.",
        "unbounded T의 erasure는 Object이고 T extends Number의 erasure는 첫 bound인 Number입니다. compiler는 필요한 지점에 cast를 삽입해 source-level type safety를 유지합니다.",
        "class file의 field/method descriptor는 erased types를 쓰지만 Signature attribute에 generic 선언이 남을 수 있습니다. 그래서 reflection의 getGenericReturnType은 일부 generic 구조를 읽지만 새 T 객체를 만들거나 instanceof List<String>을 수행할 수는 없습니다.",
        "Getter<T>.get의 erased return은 Object입니다. TextGetter가 String get을 구현하면 JVM method descriptor가 달라지므로 compiler가 synthetic bridge Object get을 만들고 String get으로 위임해 interface dispatch를 보존합니다.",
        "bridge method도 reflection의 declared methods에 보일 수 있습니다. framework가 method를 scan할 때 isBridge/isSynthetic을 고려하지 않으면 같은 논리 method를 두 번 등록하거나 annotation 해석을 잘못할 수 있습니다.",
        "erasure가 같은 overload는 선언할 수 없습니다. process(List<String>)와 process(List<Integer>)는 둘 다 process(List) descriptor가 되어 name clash가 발생합니다.",
        "generic array를 직접 생성하지 못하는 것도 runtime reification 차이와 연결됩니다. array는 component type을 runtime에 검사하지만 List<T>[]의 T는 runtime에 완전히 검사할 수 없기 때문입니다.",
        "erasure는 제네릭이 runtime에 무의미하다는 뜻이 아닙니다. compiler-inserted casts, bridge methods, Signature metadata, reflection Type 객체가 함께 source 계약을 가능한 범위에서 운반합니다.",
      ],
      concepts: [
        { term: "type erasure", definition: "type variable을 bound로 바꾸고 parameterized type arguments를 runtime descriptor에서 제거하는 Java generic 번역 전략입니다.", detail: ["별도의 List<String> class가 생성되지 않습니다.", "필요한 casts와 bridges를 compiler가 보충합니다."], caveat: "class-file Signature metadata까지 항상 사라지는 것은 아닙니다." },
        { term: "bridge method", definition: "erasure 뒤에도 overriding과 polymorphic dispatch를 보존하도록 compiler가 생성하는 synthetic forwarding method입니다.", detail: ["Method.isBridge로 식별할 수 있습니다.", "framework reflection scan에서 중복 후보가 될 수 있습니다."] },
        { term: "reifiable type", definition: "runtime에 type 정보가 충분히 남아 cast·instanceof·array component 검사를 수행할 수 있는 타입입니다.", detail: ["raw type과 unbounded wildcard parameterization은 일부 reifiable합니다.", "List<String>은 reifiable하지 않습니다."], caveat: "List<?>에는 instanceof를 쓸 수 있지만 element가 어떤 타입인지는 알 수 없습니다." },
      ],
      codeExamples: [{
        id: "java-erasure-bridge-lab",
        title: "같은 runtime List class와 compiler-generated bridge를 reflection으로 확인합니다",
        language: "java",
        filename: "ErasureBridgeLab.java",
        purpose: "erasure가 runtime class identity와 overriding adapter에 미치는 효과를 안정된 count·return type으로 관찰합니다.",
        code: String.raw`import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

public class ErasureBridgeLab {
    interface Getter<T> {
        T get();
    }

    static final class TextGetter implements Getter<String> {
        @Override
        public String get() {
            return "ready";
        }
    }

    public static void main(String[] args) {
        List<String> strings = List.of("a");
        List<Integer> integers = List.of(1);
        Method[] getters = Arrays.stream(TextGetter.class.getDeclaredMethods())
                .filter(method -> method.getName().equals("get"))
                .toArray(Method[]::new);

        long bridges = Arrays.stream(getters).filter(Method::isBridge).count();
        String bridgeReturn = Arrays.stream(getters)
                .filter(Method::isBridge).findFirst().orElseThrow()
                .getReturnType().getSimpleName();
        String typedReturn = Arrays.stream(getters)
                .filter(method -> !method.isBridge()).findFirst().orElseThrow()
                .getReturnType().getSimpleName();

        Getter<String> getter = new TextGetter();
        System.out.println("sameRuntimeClass="
                + (strings.getClass() == integers.getClass()));
        System.out.println("declaredGetCount=" + getters.length);
        System.out.println("bridgeCount=" + bridges);
        System.out.println("returns=" + bridgeReturn + "/" + typedReturn);
        System.out.println("value=" + getter.get());
    }
}`,
        walkthrough: [
          { lines: "1-4", explanation: "reflection Method와 deterministic stream filtering에 필요한 APIs를 가져옵니다." },
          { lines: "6-15", explanation: "generic interface의 T get을 String get으로 specialize해 bridge가 필요한 overriding 모양을 만듭니다." },
          { lines: "17-22", explanation: "서로 다른 type arguments의 immutable lists와 TextGetter의 get이라는 이름을 가진 declared methods만 수집합니다." },
          { lines: "24-31", explanation: "isBridge로 synthetic adapter와 source-declared method를 나누고 erased/typed return simple names를 얻습니다." },
          { lines: "32-38", explanation: "interface reference 호출까지 포함해 runtime class equality·method counts·return descriptors를 exact 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0"], command: isolatedJavaRun("ErasureBridgeLab.java", "ErasureBridgeLab") },
        output: { value: "sameRuntimeClass=true\ndeclaredGetCount=2\nbridgeCount=1\nreturns=Object/String\nvalue=ready", explanation: ["type arguments별 runtime List class는 생기지 않습니다.", "Object get bridge가 String get으로 위임해 Getter<String> dispatch를 유지합니다."] },
        experiments: [
          { change: "TextGetter에서 @Override와 get 구현을 제거합니다.", prediction: "concrete class가 interface abstract method를 구현하지 않았다는 compile error가 납니다.", result: "bridge는 실제 overriding 구현이 있을 때 compiler가 생성합니다." },
          { change: "process(List<String>)와 process(List<Integer>) overload를 선언합니다.", prediction: "두 descriptor가 process(List)로 erase되어 name clash가 납니다.", result: "method name을 역할별로 바꾸거나 element Class/token을 인자로 받습니다." },
          { change: "obj instanceof List<String>을 작성합니다.", prediction: "non-reifiable parameterized type 검사라 compile되지 않습니다.", result: "obj instanceof List<?> 뒤 elements를 별도 검증합니다." },
        ],
        sourceRefs: ["jls-erasure", "jls-method-signature", "jls-bridge-methods", "java-method-reflection-api", "jvms-signature-attribute"],
      }],
      diagnostics: [
        { symptom: "reflection framework가 하나의 get property를 두 번 발견한다.", likelyCause: "source method와 compiler-generated bridge/synthetic method를 모두 후보로 등록했습니다.", checks: ["Method.isBridge와 isSynthetic을 출력합니다.", "return descriptor를 비교합니다.", "override hierarchy에서 canonical method 선택 규칙을 확인합니다."], fix: "framework 목적에 맞게 bridge를 제외하거나 bridged target으로 resolve합니다.", prevention: "reflection scanner test에 generic override fixture를 포함합니다." },
        { symptom: "같은 이름의 generic collection overload 두 개가 name clash로 compile되지 않는다.", likelyCause: "type arguments가 erasure 뒤 method signature를 구별하지 못합니다.", checks: ["각 parameter의 erasure를 적습니다.", "JVM descriptor를 비교합니다.", "overload가 실제로 다른 domain operation인지 평가합니다."], fix: "의미별 method name, wrapper types, strategy/token parameter 중 하나로 API를 재설계합니다.", prevention: "parameterized type argument만으로 overload를 구분하지 않습니다." },
      ],
      expertNotes: ["reflection code가 bridge를 무조건 버리는 것도 위험할 수 있습니다. annotation 위치와 framework contract에 따라 bridged target으로 annotation을 합성해야 합니다.", "erasure를 이해하면 unchecked warning을 단순 compiler 잔소리가 아니라 runtime cast 검증이 불가능해진 지점의 증거로 읽을 수 있습니다."],
    },
    {
      id: "generic-negative-compiler-contracts-heap-pollution",
      title: "compiler 거부와 warning을 executable contract로 고정해 raw type·heap pollution 우회를 차단합니다",
      lead: "제네릭을 제대로 이해하려면 성공 예제뿐 아니라 왜 compile되지 않는지, warning을 무시하면 어느 지점의 runtime type 보장이 사라지는지 진단 코드까지 읽어야 합니다.",
      explanations: [
        "부정 compile test는 주석으로만 적은 잘못된 코드를 실제 JavaCompiler task에 넣습니다. invariance 대입, extends wildcard add, generic array 생성, erasure가 같은 overload, static context의 class T 참조가 각각 실패해야 regression이 아닙니다.",
        "static field는 class의 모든 instances가 공유하지만 class type parameter T는 instance 생성마다 다릅니다. 따라서 static T value는 어떤 T를 의미할지 정할 수 없고, static generic method라면 자신의 <T>를 별도로 선언해야 합니다.",
        "raw List는 generic 이전 code와의 migration compatibility를 위해 존재합니다. raw reference에 잘못된 값을 넣는 호출은 compile될 수 있지만 unchecked warning이 type proof가 끊긴 정확한 지점을 표시합니다.",
        "heap pollution은 parameterized variable이 그 선언 타입과 맞지 않는 객체를 가리키거나 내부에 잘못된 element가 들어간 상태입니다. 보통 raw assignment, unchecked cast, non-reifiable generic varargs array aliasing에서 시작해 나중의 compiler-inserted cast에서 ClassCastException으로 나타납니다.",
        "T...는 호출 시 array로 구현되는데 T가 non-reifiable이면 runtime component type이 정확한 T를 표현하지 못해 declaration-site warning이 생깁니다. method가 array에 잘못 저장하거나 외부로 노출하면 pollution이 가능합니다.",
        "@SafeVarargs는 warning suppression이 아니라 작성자가 body가 type-safe하다고 증명했다는 계약입니다. static·final·private 또는 constructor 같은 override 불가 지점에서만 쓸 수 있고, array에 다른 parameterized 값을 저장하거나 array reference를 노출하면 거짓 annotation입니다.",
        "@SuppressWarnings는 가장 작은 statement/declaration scope에 warning code 이유와 함께 둡니다. API boundary에서 Class<?> token으로 element를 검사한 뒤 copy하는 adapter처럼 실제 runtime validation이 있을 때만 unchecked suppression을 정당화합니다.",
        "진단 text 전체는 vendor·locale에 흔들릴 수 있으므로 이 lab은 OpenJDK21의 stable diagnostic code, kind, line, count와 task success를 고정합니다. compile-success warning case도 warning이 사라지면 test가 실패해야 교육 계약이 유지됩니다.",
        "production build는 보통 -Xlint:all과 선택적 -Werror로 새 warning을 막되, 의도적으로 warning을 가르치는 source는 application source와 분리한 negative harness 안에 문자열로 격리합니다. 바깥 학습 예제 자체는 warning0여야 합니다.",
      ],
      concepts: [
        { term: "heap pollution", definition: "parameterized type으로 선언된 참조나 container의 실제 내용이 그 generic 계약과 일치하지 않는 runtime 상태입니다.", detail: ["pollution 발생 지점과 예외 발생 지점이 멀 수 있습니다.", "raw·unchecked·generic varargs warnings가 주요 신호입니다."], caveat: "warning을 지운다고 오염 가능성이 사라지는 것은 아닙니다." },
        { term: "raw type", definition: "type arguments를 생략한 legacy 호환 형태로 generic 검사를 약화하는 타입입니다.", detail: ["List는 List<?>와 다릅니다.", "raw List에는 Object를 unchecked로 추가할 수 있습니다."], caveat: "새 code에서 편의를 위해 사용하는 escape hatch가 아닙니다." },
        { term: "@SafeVarargs", definition: "non-reifiable varargs parameter를 다루는 method body가 unsafe operation을 하지 않는다는 작성자 보증입니다.", detail: ["override 불가능한 method/constructor에 제한됩니다.", "call-site unchecked warning을 억제합니다."], caveat: "varargs array를 노출하거나 alias를 통해 다른 타입을 저장하면 annotation이 거짓입니다." },
      ],
      codeExamples: [{
        id: "java-generic-negative-compiler-contracts",
        title: "다섯 compile failure와 raw·generic-varargs warning-success를 JDK21 diagnostic code로 검증합니다",
        language: "java",
        filename: "GenericNegativeCompilerContracts.java",
        purpose: "잘못된 generic 관계가 반드시 실패하고 legacy escape hatches가 warning 없이 조용히 통과하지 않음을 자동화합니다.",
        code: String.raw`import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class GenericNegativeCompilerContracts {
    record Result(boolean success, long errors, long warnings,
                  long firstLine, String codes) {}

    static final class Source extends SimpleJavaFileObject {
        private final String code;

        Source(String name, String code) {
            super(URI.create("string:///" + name + ".java"), Kind.SOURCE);
            this.code = code;
        }

        @Override
        public CharSequence getCharContent(boolean ignoreEncodingErrors) {
            return code;
        }
    }

    static Result compile(JavaCompiler compiler, Path output,
                          String name, String code) throws IOException {
        DiagnosticCollector<JavaFileObject> diagnostics =
                new DiagnosticCollector<>();
        try (StandardJavaFileManager files = compiler.getStandardFileManager(
                diagnostics, Locale.ROOT, java.nio.charset.StandardCharsets.UTF_8)) {
            boolean success = compiler.getTask(null, files, diagnostics,
                    List.of("-encoding", "UTF-8", "--release", "21",
                            "-proc:none", "-Xlint:all", "-XDrawDiagnostics",
                            "-d", output.toString()),
                    null, List.of(new Source(name, code))).call();
            List<Diagnostic<? extends JavaFileObject>> all = diagnostics.getDiagnostics();
            long errors = all.stream().filter(d ->
                    d.getKind() == Diagnostic.Kind.ERROR).count();
            long warnings = all.stream().filter(d ->
                    d.getKind() == Diagnostic.Kind.WARNING
                    || d.getKind() == Diagnostic.Kind.MANDATORY_WARNING).count();
            long firstLine = all.stream().mapToLong(Diagnostic::getLineNumber)
                    .filter(line -> line > 0).min().orElse(0);
            String codes = all.stream().map(Diagnostic::getCode).distinct()
                    .sorted().collect(Collectors.joining(","));
            return new Result(success, errors, warnings, firstLine, codes);
        }
    }

    static void print(String label, Result result) {
        System.out.println(label + "=" + (result.success() ? "success" : "fail")
                + "|errors=" + result.errors() + "|warnings=" + result.warnings()
                + "|line=" + result.firstLine() + "|codes=" + result.codes());
    }

    static void deleteTree(Path root) throws IOException {
        try (var paths = Files.walk(root)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                Files.delete(path);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("JDK required");
        Path output = Files.createTempDirectory("generic-contracts-");
        try {
            print("invariance", compile(compiler, output, "Invariance",
                    "import java.util.*; class Invariance { void f() { "
                    + "List<Integer> a=List.of(1); List<Number> b=a; } }"));
            print("wildcardAdd", compile(compiler, output, "WildcardAdd",
                    "import java.util.*; class WildcardAdd { void f() { "
                    + "List<? extends Number> a=List.of(1); a.add(2); } }"));
            print("genericArray", compile(compiler, output, "GenericArray",
                    "class GenericArray<T> { T[] f() { return new T[1]; } }"));
            print("erasureClash", compile(compiler, output, "ErasureClash",
                    "import java.util.*; class ErasureClash { "
                    + "void f(List<String> x){} void f(List<Integer> x){} }"));
            print("staticT", compile(compiler, output, "StaticT",
                    "class StaticT<T> { static T value; }"));
            print("raw", compile(compiler, output, "RawUse",
                    "import java.util.*; class RawUse { void f() { "
                    + "List raw=new ArrayList<String>(); raw.add(1); } }"));
            print("varargs", compile(compiler, output, "VarargsUse",
                    "class VarargsUse { static <T> T[] echo(T... x) { return x; } }"));
        } finally {
            deleteTree(output);
        }
    }
}`,
        walkthrough: [
          { lines: "1-15", explanation: "JDK compiler API, diagnostic 분류, isolated output cleanup에 필요한 표준 APIs만 가져옵니다." },
          { lines: "17-33", explanation: "Result는 success/error/warning/first line/codes만 보존하고 in-memory source가 filesystem fixture 없이 source text를 compiler에 제공합니다." },
          { lines: "35-58", explanation: "각 task를 --release21·-Xlint:all·-XDrawDiagnostics로 실행하고 kind별 count와 distinct sorted diagnostic codes를 수집합니다." },
          { lines: "60-64", explanation: "locale-dependent message 대신 stable fields를 한 줄 contract로 출력합니다." },
          { lines: "66-72", explanation: "Files.walk stream을 닫은 상태에서 deepest-first로 temp output 전체를 삭제합니다." },
          { lines: "74-96", explanation: "invariance·wildcard add·generic array·erasure clash·static T의 다섯 실패와 raw·varargs의 두 warning-success source를 각각 compile합니다." },
          { lines: "97-99", explanation: "성공·실패 어느 경로에서도 finally가 compiler output direct child를 제거합니다." },
        ],
        run: { environment: ["OpenJDK 21.0.11", "jdk.compiler module available", "UTF-8", "isolated outer temp classes", "outer -Xlint:all warning0"], command: isolatedJavaRun("GenericNegativeCompilerContracts.java", "GenericNegativeCompilerContracts") },
        output: { value: "invariance=fail|errors=1|warnings=0|line=1|codes=compiler.err.prob.found.req\nwildcardAdd=fail|errors=1|warnings=0|line=1|codes=compiler.err.cant.apply.symbols\ngenericArray=fail|errors=1|warnings=0|line=1|codes=compiler.err.generic.array.creation\nerasureClash=fail|errors=1|warnings=0|line=1|codes=compiler.err.name.clash.same.erasure\nstaticT=fail|errors=1|warnings=0|line=1|codes=compiler.err.non-static.cant.be.ref\nraw=success|errors=0|warnings=2|line=1|codes=compiler.warn.raw.class.use,compiler.warn.unchecked.call.mbr.of.raw.type\nvarargs=success|errors=0|warnings=1|line=1|codes=compiler.warn.unchecked.varargs.non.reifiable.type", explanation: ["다섯 negative source는 모두 exactly one error로 실패합니다.", "raw와 generic varargs source는 compile success지만 warning이 각각2와1로 유지됩니다.", "전체 diagnostic prose 대신 JDK21 code·kind·line·count를 계약으로 사용합니다."] },
        experiments: [
          { change: "raw source의 List를 List<Object>로 바꿉니다.", prediction: "raw/unchecked warnings가0이 되어 현재 warning-success golden이 실패합니다.", result: "그 변경은 production migration으로는 개선이지만 이 negative fixture에서는 기대값도 명시적으로 갱신합니다." },
          { change: "varargs method에 @SafeVarargs를 붙입니다.", prediction: "declaration warning은 사라지지만 body 안전성을 작성자가 책임집니다.", result: "array를 노출하는 현재 echo에는 안전하다고 쉽게 선언하지 않습니다." },
          { change: "compiler options에서 -Xlint:all을 제거합니다.", prediction: "raw/varargs warning evidence가 축약되거나 사라져 교육 계약이 약해집니다.", result: "negative harness 자체가 lint 정책을 명시해야 합니다." },
        ],
        sourceRefs: ["java-compiler-api", "java-diagnostic-api", "jls-heap-pollution", "jls-non-reifiable-varargs", "jls-raw-types", "jls-static-context", "jls-erasure"],
      }],
      diagnostics: [
        { symptom: "값을 꺼내는 멀리 떨어진 코드에서 ClassCastException이 난다.", likelyCause: "앞선 raw assignment·unchecked cast·generic varargs alias가 heap pollution을 만들고 compiler-inserted cast에서 늦게 드러났습니다.", checks: ["build의 raw/unchecked/varargs warnings를 최초 발생순으로 찾습니다.", "container write sites와 casts를 추적합니다.", "예외 지점의 element runtime classes를 민감정보 없이 분류합니다."], fix: "오염 시작 boundary에서 type token 검증 후 새 typed collection으로 copy하고 raw alias를 제거합니다.", prevention: "-Xlint:all과 warning budget0을 application source에 적용합니다." },
        { symptom: "@SafeVarargs를 붙였는데 runtime type 오류가 계속 난다.", likelyCause: "annotation을 안전성 증명 없이 suppression 용도로 사용했고 varargs array를 노출하거나 오염시켰습니다.", checks: ["parameter array에 저장하는지 봅니다.", "array/reference가 return·field·callback으로 escape하는지 봅니다.", "parameterized arrays를 다른 varargs method에 넘기는지 추적합니다."], fix: "array를 defensive copy해 읽기만 하거나 List 기반 API로 바꾸고 거짓 annotation을 제거합니다.", prevention: "@SafeVarargs method마다 non-pollution 근거를 review checklist에 남깁니다." },
      ],
      expertNotes: ["negative compiler fixture는 application source와 별도로 격리해야 outer project의 warning0 정책과 교육용 warning 존재 계약을 동시에 지킬 수 있습니다.", "unchecked suppression은 cast가 맞기를 바라는 표시가 아니라 runtime validation 또는 closed-world invariant로 안전함을 증명하는 마지막 단계입니다."],
    },
    {
      id: "equals-hashcode-five-laws-value-semantics",
      title: "equals의 다섯 법칙과 equal⇒same hash를 value object의 불변 상태 전체에 함께 구현합니다",
      lead: "Set의 중복은 화면 문자열이나 field 하나가 아니라 element type이 선언한 equality relation이므로, 법칙·상태 선택·상속 정책을 먼저 설계해야 합니다.",
      explanations: [
        "equals는 reflexive(x=x), symmetric(x=y이면 y=x), transitive(x=y·y=z이면 x=z), consistent(관련 상태가 같으면 반복 결과 동일), non-null(x.equals(null)은 false)의 다섯 조건을 만족해야 합니다.",
        "hashCode의 핵심 법칙은 equals가 true인 두 객체의 hash가 반드시 같아야 한다는 것입니다. 반대는 필요하지 않아 다른 객체가 같은 hash를 가질 수 있고 HashSet은 bucket 안에서 equals로 다시 구분합니다.",
        "동등성에 포함할 fields는 domain identity 또는 immutable value 의미로 선택합니다. display label·cache·lastViewedAt처럼 변할 수 있거나 부수적인 상태를 포함하면 collection membership과 equality가 불안정해집니다.",
        "final value class는 subclass가 symmetry를 깨뜨릴 가능성을 줄입니다. equals에서 instanceof를 쓸지 getClass를 쓸지는 subtype 간 equality를 허용할 domain 정책이지만 양쪽 class가 같은 정책을 공유하지 못하면 composition이 안전합니다.",
        "identity fast path this == other는 성능 최적화일 뿐 법칙의 근거가 아닙니다. null/type 검사 후 equality fields를 비교합니다. Java의 필수 hash 계약은 equal⇒same hash뿐이므로 상수나 equality fields 일부만 써도 correctness는 유지될 수 있지만 분포가 나쁩니다. 강한 기본 설계는 같은 immutable equality fields를 모두 hash에 반영해 계약 위반 방향과 불필요한 collision을 함께 피하는 것입니다.",
        "Objects.equals와 Objects.hash는 null handling을 단순화하지만 Objects.hash는 varargs array와 boxing 비용이 있을 수 있습니다. hot key라면 명시적 31-fold hash 또는 cached hash를 검토하되 정확성을 먼저 지킵니다.",
        "record는 components 전체로 final value semantics를 자동 생성하므로 작은 key에 좋은 기본값입니다. 다만 array component는 array identity equals를 사용하고 mutable component의 내부 변경은 여전히 위험합니다.",
        "equals에 database-generated id를 넣는 entity는 저장 전 id null, 저장 후 id 할당, proxy subtype 문제를 함께 설계해야 합니다. entity equality는 일반 value object 예제를 그대로 복사하지 말고 persistence lifecycle 계약을 별도로 정합니다.",
        "hash 값을 외부 저장 format이나 보안 digest로 사용하지 않습니다. Java hashCode는 process/domain 내부 bucket 분산 계약이며 collision-resistant·stable-across-version 식별자가 아닙니다.",
      ],
      concepts: [
        { term: "equivalence relation", definition: "reflexive·symmetric·transitive를 만족해 값들을 모순 없는 동치 classes로 나누는 관계입니다.", detail: ["equals의 consistency와 non-null 조건도 Java 계약에 추가됩니다.", "Set은 한 동치 class당 대표 원소 하나를 보유합니다."] },
        { term: "equal-implies-same-hash", definition: "a.equals(b)가 true이면 a.hashCode()==b.hashCode()여야 한다는 단방향 계약입니다.", detail: ["같은 hash라도 equals false일 수 있습니다.", "hash collision은 correctness가 아니라 성능 문제입니다."] },
        { term: "value object", definition: "object identity보다 immutable attributes의 조합으로 의미가 정해지는 객체입니다.", detail: ["equality fields를 constructor에서 완성합니다.", "collection key로 안정적입니다."], caveat: "mutable field나 mutable component를 포함하면 value semantics가 흔들립니다." },
      ],
      codeExamples: [{
        id: "java-equality-contract-lab",
        title: "immutable key의 equals 다섯 법칙과 hash agreement를 한 실행에서 검증합니다",
        language: "java",
        filename: "EqualityContractLab.java",
        purpose: "Set 중복 판정의 선행조건인 value equality를 법칙별 boolean과 representative count로 고정합니다.",
        code: String.raw`import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class EqualityContractLab {
    static final class MemberKey {
        private final String tenant;
        private final long memberId;

        MemberKey(String tenant, long memberId) {
            this.tenant = Objects.requireNonNull(tenant);
            this.memberId = memberId;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) return true;
            if (!(other instanceof MemberKey that)) return false;
            return memberId == that.memberId && tenant.equals(that.tenant);
        }

        @Override
        public int hashCode() {
            return 31 * tenant.hashCode() + Long.hashCode(memberId);
        }
    }

    public static void main(String[] args) {
        MemberKey a = new MemberKey("academy", 7);
        MemberKey b = new MemberKey("academy", 7);
        MemberKey c = new MemberKey("academy", 7);
        MemberKey different = new MemberKey("academy", 8);

        boolean reflexive = a.equals(a);
        boolean symmetric = a.equals(b) == b.equals(a);
        boolean transitive = a.equals(b) && b.equals(c) && a.equals(c);
        boolean consistent = a.equals(b) && a.equals(b);
        boolean nonNull = !a.equals(null);
        boolean hashAgreement = a.equals(b) && a.hashCode() == b.hashCode();

        Set<MemberKey> keys = new HashSet<>(List.of(a, b, c, different));
        System.out.println("laws=" + reflexive + "," + symmetric + ","
                + transitive + "," + consistent + "," + nonNull);
        System.out.println("hashAgreement=" + hashAgreement);
        System.out.println("representatives=" + keys.size());
    }
}`,
        walkthrough: [
          { lines: "1-5", explanation: "HashSet, immutable initial values, null precondition을 위한 standard APIs를 가져옵니다." },
          { lines: "7-14", explanation: "final class와 final fields가 equality/hash에 참여하는 상태를 constructor 이후 불변으로 고정합니다." },
          { lines: "16-27", explanation: "identity·type·same fields 순서의 equals와 같은 두 immutable equality fields를 사용하는 hash를 구현합니다." },
          { lines: "29-33", explanation: "서로 다른 instances 세 개는 같은 value, 한 개는 다른 memberId를 갖게 구성합니다." },
          { lines: "35-40", explanation: "equals의 다섯 조건과 equal 객체의 hash agreement를 독립 booleans로 계산합니다." },
          { lines: "42-46", explanation: "HashSet이 네 객체를 두 equivalence-class representatives로 축약하는지 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0"], command: isolatedJavaRun("EqualityContractLab.java", "EqualityContractLab") },
        output: { value: "laws=true,true,true,true,true\nhashAgreement=true\nrepresentatives=2", explanation: ["세 academy/7 instances는 한 동치 class입니다.", "academy/8만 다른 대표로 남아 Set size는2입니다."] },
        experiments: [
          { change: "hashCode에서 memberId를 빼고 tenant만 사용합니다.", prediction: "correctness는 유지되지만 같은 tenant의 keys가 과도하게 collision해 성능이 나빠질 수 있습니다.", result: "equals fields를 잘 분산시키는 hash에 모두 반영합니다." },
          { change: "equals가 무시하는 mutable displayLabel을 hashCode에만 추가해 같은 tenant/memberId의 labels를 다르게 만듭니다.", prediction: "equals true인데 hash가 달라지는 금지 방향이라 HashSet contains/remove가 실패할 수 있습니다.", result: "hash는 equality가 무시하는 상태로 equal objects를 갈라서는 안 되며 equals/hashCode를 한 변경 단위·한 test matrix로 유지합니다." },
          { change: "MemberKey를 상속 가능하게 하고 subclass만 새 field를 equals에 추가합니다.", prediction: "base와 subclass 비교 방향에 따라 symmetry 또는 transitivity가 깨질 수 있습니다.", result: "value hierarchy보다 final+composition 또는 명시적인 canEqual 정책을 검토합니다." },
        ],
        sourceRefs: ["java-object-api", "java-objects-api", "java-hash-set-api", "jls-record-classes", "effective-java-equals"],
      }],
      diagnostics: [
        { symptom: "화면상 같은 객체가 HashSet에 두 개 들어간다.", likelyCause: "Object identity equals를 그대로 쓰거나 equality fields가 domain 중복 기준과 다릅니다.", checks: ["element class가 equals/hashCode를 override하는지 봅니다.", "양방향 equals와 hash 값을 함께 확인합니다.", "중복의 domain key를 문서와 비교합니다."], fix: "immutable domain key/value object에 법칙을 만족하는 equals/hashCode를 함께 구현합니다.", prevention: "equality-law tests와 duplicate Set test를 value type마다 둡니다." },
        { symptom: "a.equals(b)는 true인데 set.contains(b)가 false다.", likelyCause: "equal 객체의 hashCode가 다르거나 key가 삽입 후 변경됐습니다.", checks: ["현재/삽입 시 equality fields와 hashes를 비교합니다.", "hashCode가 equals와 같은 fields를 쓰는지 봅니다.", "mutable-key 변경을 추적합니다."], fix: "hash contract를 맞추고 immutable key로 다시 구성해 set을 재생성합니다.", prevention: "mutable entity 자체 대신 immutable key projection을 collection key로 씁니다." },
      ],
      expertNotes: ["equals law test는 몇 pair 예시만으로 모든 입력을 증명하지 못하므로 property-based generator를 더하면 symmetry·transitivity edge case를 넓게 찾을 수 있습니다.", "ORM entity와 proxy equality는 persistence lifecycle 문제입니다. 이 장의 final immutable value-key 규칙을 entity에 무비판적으로 적용하지 않습니다."],
    },
    {
      id: "hashset-collision-mutable-key-failure",
      title: "HashSet은 hash로 후보 bucket을 찾고 equals로 확정하며 mutable key는 lookup 경로를 잃게 만듭니다",
      lead: "충돌이 중복이라는 오해와 hash가 유일 식별자라는 오해를 버리고, insertion 이후 equality/hash 상태를 바꾸지 않는 key lifecycle을 설계합니다.",
      explanations: [
        "HashSet은 개념적으로 hashCode를 spread한 값으로 bucket 후보를 좁히고 그 bucket의 기존 elements와 equals를 비교합니다. implementation detail은 버전별로 달라질 수 있으므로 정확한 bucket index나 treeification threshold에 application correctness를 걸지 않습니다.",
        "서로 다른 객체가 같은 hash를 반환하는 collision은 합법입니다. equals가 false이면 모두 저장되며 correctness는 유지되고, collision이 많을 때 lookup이 더 많은 comparisons를 해 성능이 나빠집니다.",
        "hashCode가 다르면 HashSet은 보통 다른 후보 위치를 보므로 equals까지 호출하지 않을 수 있습니다. 그래서 equals true인데 hash가 다르면 contract 위반이 membership 실패로 드러납니다.",
        "mutable key를 넣은 뒤 hash/equality field를 바꾸면 객체는 옛 hash 위치에 남지만 contains/remove는 새 hash 위치에서 찾습니다. 같은 reference를 넘겨도 contains false가 될 수 있는 이유입니다.",
        "변경한 field를 원래 값으로 되돌리면 lookup path가 다시 옛 bucket과 일치해 찾을 수 있지만, 이것은 복구 전략이 아닙니다. 어느 시점에 어떤 값이었는지 모르면 set을 새로 build해야 합니다.",
        "Set element 전체가 immutable일 필요는 없지만 equals/hashCode에 참여하는 상태는 membership 동안 안정적이어야 합니다. mutable business object는 immutable id/value projection을 key로 사용합니다.",
        "좋은 hash는 equals fields에서 결정적으로 계산하고 가능한 고르게 분산되어야 합니다. hash caching은 객체가 완전히 immutable하고 계산 비용이 실제 병목일 때만 고려합니다.",
        "contains 성능을 검증할 때 adversarial collision도 포함하되 wall-clock 한 번보다 equals invocation count, distribution, JMH benchmark를 사용합니다. JVM warmup과 implementation detail을 unit test golden으로 고정하지 않습니다.",
      ],
      concepts: [
        { term: "hash collision", definition: "equals가 false인 서로 다른 값들이 같은 hashCode를 가지는 합법적인 상황입니다.", detail: ["bucket 안 equals 비교로 구분합니다.", "많으면 성능이 저하될 수 있습니다."], caveat: "collision 자체는 duplicate 판정이 아닙니다." },
        { term: "mutable-key orphan", definition: "삽입 뒤 key의 hash/equality 상태가 바뀌어 물리적으로 set 안에 있지만 현재 lookup hash 경로로 찾지 못하는 상태입니다.", detail: ["contains와 remove가 false가 될 수 있습니다.", "iteration에는 여전히 보일 수 있습니다."] },
        { term: "load and distribution", definition: "hash table 공간 사용과 keys 분산이 lookup 후보 수에 영향을 주는 성능 요소입니다.", detail: ["correctness contract와 구분합니다.", "capacity tuning 전 실제 profile이 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-hashset-collision-mutable-key-lab",
        title: "고정 hash collision은 보존되고 key mutation은 contains/remove를 끊는 것을 비교합니다",
        language: "java",
        filename: "HashSetCollisionMutableKeyLab.java",
        purpose: "hash candidate selection과 equals confirmation의 분업, membership 중 key stability를 exact boolean으로 증명합니다.",
        code: String.raw`import java.util.HashSet;
import java.util.Set;

public class HashSetCollisionMutableKeyLab {
    record Colliding(String id) {
        @Override
        public int hashCode() {
            return 7;
        }
    }

    static final class MutableKey {
        private int id;

        MutableKey(int id) {
            this.id = id;
        }

        void setId(int id) {
            this.id = id;
        }

        @Override
        public boolean equals(Object other) {
            return other instanceof MutableKey that && id == that.id;
        }

        @Override
        public int hashCode() {
            return Integer.hashCode(id);
        }
    }

    public static void main(String[] args) {
        Set<Colliding> collisions = new HashSet<>();
        collisions.add(new Colliding("A"));
        collisions.add(new Colliding("B"));
        collisions.add(new Colliding("C"));

        MutableKey key = new MutableKey(1);
        Set<MutableKey> mutable = new HashSet<>();
        mutable.add(key);
        key.setId(2);
        boolean containsAfterChange = mutable.contains(key);
        boolean removeAfterChange = mutable.remove(key);
        int strandedSize = mutable.size();

        key.setId(1);
        boolean containsAfterRestore = mutable.contains(key);
        boolean removeAfterRestore = mutable.remove(key);

        System.out.println("collisionSize=" + collisions.size());
        System.out.println("collisionMembers="
                + (collisions.contains(new Colliding("A"))
                && collisions.contains(new Colliding("B"))
                && collisions.contains(new Colliding("C"))));
        System.out.println("mutated=" + containsAfterChange + ","
                + removeAfterChange + "," + strandedSize);
        System.out.println("restored=" + containsAfterRestore + ","
                + removeAfterRestore + "," + mutable.size());
    }
}`,
        walkthrough: [
          { lines: "1-10", explanation: "Colliding record는 value equals를 유지하면서 의도적으로 모든 values에 같은 hash7을 반환합니다." },
          { lines: "12-32", explanation: "MutableKey는 id를 equality/hash에 쓰면서 setter로 contract를 깰 수 있는 반례를 만듭니다." },
          { lines: "34-38", explanation: "서로 다른 A·B·C가 같은 hash를 공유해도 equals false라 세 representatives가 저장됩니다." },
          { lines: "40-46", explanation: "id1 bucket에 삽입한 같은 객체를 id2로 바꾼 뒤 contains/remove false와 stranded size1을 기록합니다." },
          { lines: "48-50", explanation: "id를1로 복원하면 lookup path가 다시 맞아 contains/remove가 성공합니다." },
          { lines: "52-60", explanation: "raw HashSet order는 전혀 출력하지 않고 size·membership·mutation lifecycle만 exact 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0", "HashSet order not asserted"], command: isolatedJavaRun("HashSetCollisionMutableKeyLab.java", "HashSetCollisionMutableKeyLab") },
        output: { value: "collisionSize=3\ncollisionMembers=true\nmutated=false,false,1\nrestored=true,true,0", explanation: ["hash7 collision 세 개는 equals로 구분되어 모두 남습니다.", "mutable key는 iteration상 존재해도 새 hash 경로로 찾거나 제거할 수 없습니다."] },
        experiments: [
          { change: "Colliding.equals도 항상 true를 반환하게 만듭니다.", prediction: "두 번째 이후 add가 false가 되고 size1이 됩니다.", result: "same hash가 아니라 equals true가 duplicate를 결정합니다." },
          { change: "MutableKey.hashCode를 상수로 바꿉니다.", prediction: "mutation 뒤에도 같은 bucket에서 equals(this fast/reference path 구현)에 의해 찾힐 수 있지만 collision 성능이 악화됩니다.", result: "상수 hash는 mutable-key 설계의 올바른 해결이 아닙니다." },
          { change: "id 대신 immutable record Key(int id)를 set에 저장합니다.", prediction: "기존 key는 바뀌지 않고 새 id는 새 key로 명시적으로 교체해야 합니다.", result: "membership lifecycle이 mutation과 분리됩니다." },
        ],
        sourceRefs: ["java-hash-set-api", "java-object-api", "java-set-api", "effective-java-mutable-key"],
      }],
      diagnostics: [
        { symptom: "iteration에는 key가 보이는데 contains(key)와 remove(key)가 false다.", likelyCause: "삽입 뒤 equals/hashCode 참여 field를 변경해 lookup bucket이 달라졌습니다.", checks: ["삽입 시와 현재 hash를 비교할 수 있는 lifecycle log를 봅니다.", "equality fields의 setter/collection mutation을 찾습니다.", "새 HashSet copy에서 lookup이 회복되는지 확인합니다."], fix: "immutable key projection으로 새 set을 rebuild하고 mutable 객체의 직접 key 사용을 중단합니다.", prevention: "Set/Map key types를 immutable로 제한하는 architecture test를 둡니다." },
        { symptom: "HashSet lookup이 correctness는 맞지만 특정 입력에서 급격히 느리다.", likelyCause: "hash distribution이 나쁘거나 adversarial collisions가 많습니다.", checks: ["hash frequency와 equals call counts를 측정합니다.", "equals/hash fields가 실제 entropy를 포함하는지 봅니다.", "JMH와 production profile로 확인합니다."], fix: "contract를 유지하는 더 나은 hash composition과 key representation을 사용합니다.", prevention: "representative·skewed·collision datasets를 benchmark suite에 포함합니다." },
      ],
      expertNotes: ["HashMap/HashSet 내부 treeification 같은 구현 세부 수치를 correctness 설명으로 고정하지 않습니다. Java API가 약속하는 것은 membership/equality semantics이지 bucket layout이 아닙니다.", "mutable key 문제를 발견했을 때 손상된 set에서 remove를 반복하기보다 stable projection으로 새 collection을 만드는 편이 검증 가능합니다."],
    },
    {
      id: "hashset-linkedhashset-order-policy",
      title: "HashSet order는 숨기고 LinkedHashSet을 선택할 때만 insertion encounter order를 API 계약으로 노출합니다",
      lead: "현재 실행에서 우연히 보인 순서와 collection이 약속한 순서를 구분하면 flaky test·UI 재정렬·직렬화 drift를 예방할 수 있습니다.",
      explanations: [
        "HashSet은 iteration order를 보장하지 않습니다. 작은 integer가 정렬되어 보이거나 같은 JVM에서 반복 결과가 같아 보여도 capacity·hash·JDK implementation·입력 변화에 따라 달라질 수 있습니다.",
        "order가 의미 없으면 test는 size·containsAll·set equality를 사용합니다. 사람이 읽는 deterministic snapshot이 필요하면 assertion 직전에 별도 sorted copy를 만들어 normalization임을 이름에 표시합니다.",
        "LinkedHashSet은 hash-based membership에 doubly-linked encounter chain을 더해 insertion order를 보존합니다. 최초 add 순서가 iteration 순서이며 duplicate add는 기존 위치를 바꾸지 않습니다.",
        "LinkedHashSet에서 remove 후 같은 값을 다시 add하면 새로운 insertion이므로 encounter order 끝으로 이동합니다. 이것은 단순 duplicate add와 다른 lifecycle event입니다.",
        "TreeSet은 sorted order가 business contract일 때 선택합니다. insertion order 보존과 sorted order는 서로 다른 요구이며 둘 다 필요하면 source of truth와 derived view를 분리합니다.",
        "API가 Set을 반환하면서 실제로 LinkedHashSet이라는 사실만 믿게 하면 호출자가 copy·serialization 과정에서 order를 잃을 수 있습니다. order가 외부 계약이면 문서·return abstraction·tests가 함께 표현해야 합니다.",
        "Stream의 encounter order는 source spliterator 특성에 영향을 받습니다. unordered HashSet source에 sorted 없는 parallel pipeline을 사용하면서 first/limit 결과를 exact로 기대하지 않습니다.",
        "JSON object/property order와 Set semantic order도 구분합니다. 순서가 사용자에게 의미 있는 데이터라면 array/list 형태나 명시적 position field로 wire contract에 보존합니다.",
      ],
      concepts: [
        { term: "iteration order", definition: "iterator가 원소를 방문하는 sequence에 대한 collection의 공개 계약입니다.", detail: ["HashSet은 unspecified입니다.", "LinkedHashSet은 insertion encounter order를 보존합니다."] },
        { term: "test normalization", definition: "본래 unordered 결과를 membership 손실 없이 canonical order로 바꿔 deterministic comparison을 만드는 test 단계입니다.", detail: ["sorted copy는 원본의 order guarantee가 아닙니다.", "raw iteration sequence를 golden으로 저장하지 않습니다."] },
        { term: "encounter order", definition: "collection 또는 stream source가 element 처리에 제공하는 정의된 순서입니다.", detail: ["ordered streams에서 forEachOrdered가 이를 보존합니다.", "unordered source에는 보존할 business sequence가 없습니다."] },
      ],
      codeExamples: [{
        id: "java-ordered-set-selection-lab",
        title: "HashSet은 sorted membership으로 normalize하고 LinkedHashSet만 raw encounter order를 출력합니다",
        language: "java",
        filename: "OrderedSetSelectionLab.java",
        purpose: "unordered membership과 insertion-order contract를 한 입력에서 분리하고 duplicate/reinsert 차이를 검증합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class OrderedSetSelectionLab {
    public static void main(String[] args) {
        List<String> input = List.of(
                "delta", "alpha", "beta", "alpha", "gamma");

        Set<String> unordered = new HashSet<>(input);
        List<String> normalized = new ArrayList<>(unordered);
        Collections.sort(normalized);

        LinkedHashSet<String> insertion = new LinkedHashSet<>(input);
        boolean duplicateChanged = insertion.add("alpha");
        insertion.remove("beta");
        insertion.add("beta");

        System.out.println("hashMembers=" + normalized);
        System.out.println("linkedAfterReinsert=" + insertion);
        System.out.println("duplicateChanged=" + duplicateChanged);
        System.out.println("sameMembers=" + unordered.equals(insertion));
    }
}`,
        walkthrough: [
          { lines: "1-6", explanation: "unordered Set, insertion-ordered implementation, deterministic normalization에 필요한 types를 가져옵니다." },
          { lines: "9-11", explanation: "duplicate alpha를 포함한 원본 list가 order와 dedup behavior를 동시에 관찰하게 합니다." },
          { lines: "13-15", explanation: "HashSet raw iteration은 출력하지 않고 independent ArrayList를 sort해 canonical membership view만 만듭니다." },
          { lines: "17-20", explanation: "LinkedHashSet duplicate add는 false이고 beta remove/re-add는 beta를 encounter tail로 이동시킵니다." },
          { lines: "22-25", explanation: "normalized HashSet view, promised LinkedHashSet order, duplicate add result, order-independent Set equality를 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0", "HashSet raw order never emitted"], command: isolatedJavaRun("OrderedSetSelectionLab.java", "OrderedSetSelectionLab") },
        output: { value: "hashMembers=[alpha, beta, delta, gamma]\nlinkedAfterReinsert=[delta, alpha, gamma, beta]\nduplicateChanged=false\nsameMembers=true", explanation: ["첫 줄은 HashSet 순서가 아니라 sorted membership normalization입니다.", "두 번째 줄은 LinkedHashSet이 약속한 insertion/reinsertion encounter order입니다."] },
        experiments: [
          { change: "normalized 대신 unordered를 직접 출력하고 golden으로 고정합니다.", prediction: "현재 환경에서는 통과해도 implementation/input drift에 취약한 test가 됩니다.", result: "unordered abstraction에는 sequence golden을 두지 않습니다." },
          { change: "beta를 remove하지 않고 다시 add만 합니다.", prediction: "add는 false이고 beta의 기존 위치는 유지됩니다.", result: "duplicate attempt와 reinsert event를 구분합니다." },
          { change: "LinkedHashSet을 TreeSet으로 바꿉니다.", prediction: "출력은 natural sorted order가 되고 insertion chronology는 사라집니다.", result: "business order가 chronology인지 comparison인지 먼저 선택합니다." },
        ],
        sourceRefs: ["java-hash-set-api", "java-linked-hash-set-api", "java-set-api", "java-stream-api"],
      }],
      diagnostics: [
        { symptom: "HashSet output 기반 snapshot test가 간헐적으로 깨진다.", likelyCause: "API가 약속하지 않은 iteration order를 exact golden으로 만들었습니다.", checks: ["concrete collection과 API order contract를 확인합니다.", "failure diff가 membership이 아닌 순서만 다른지 봅니다.", "hash/equality 변경 또는 capacity drift를 확인합니다."], fix: "set equality·containsAll·size 또는 명시적 sorted normalization으로 바꿉니다.", prevention: "unordered collection raw toString golden을 lint/review에서 금지합니다." },
        { symptom: "사용자 선택 순서가 dedup 이후 사라진다.", likelyCause: "order-bearing requirement에 HashSet 또는 Set.copyOf의 unspecified order를 사용했습니다.", checks: ["최초 등장 순서가 domain requirement인지 확인합니다.", "중간 copy type을 추적합니다.", "wire format이 sequence를 보존하는지 봅니다."], fix: "LinkedHashSet으로 stable dedup하고 반환/직렬화에서도 ordered representation을 유지합니다.", prevention: "order semantics를 API 문서와 integration test에 명시합니다." },
      ],
      expertNotes: ["LinkedHashSet은 order를 제공하지만 random-access list가 아닙니다. index 조회가 핵심이면 List와 membership index를 조합하거나 다른 모델을 선택합니다.", "deterministic test를 위해 sort할 때 comparator도 total order여야 합니다. compare0인 서로 다른 values가 normalization 단계에서 손실되지 않게 List sort를 사용하고 TreeSet 변환을 함부로 하지 않습니다."],
    },
    {
      id: "treeset-natural-comparator-consistency-null",
      title: "TreeSet의 duplicate는 comparator의 compare==0이며 total order·equals consistency·null 정책이 correctness를 좌우합니다",
      lead: "정렬된 Set은 hash가 아니라 comparison relation으로 같은 원소를 판단하므로 comparator를 단순 정렬 표현이 아닌 membership 계약으로 검토합니다.",
      explanations: [
        "TreeSet은 natural ordering 또는 생성자에 받은 Comparator로 원소를 정렬하고 compare 결과0인 값을 같은 set element로 취급합니다. equals를 호출해 다시 확인하는 HashSet 모델과 다릅니다.",
        "String natural ordering은 lexicographic total order이므로 서로 다른 문자열을 일관되게 구분합니다. 모든 elements는 서로 비교 가능해야 하고 comparator가 없는데 mixed incomparable types를 넣으면 ClassCastException이 납니다.",
        "길이만 비교하는 comparator에서 cat과 dog는 equals false지만 compare0입니다. 두 번째 add는 false이고 contains(dog)는 true가 될 수 있어 Set의 일반 equals 의미와 관찰이 어긋납니다.",
        "sorted Set이 Set equals 계약과 예측 가능하게 동작하려면 ordering이 equals와 consistent한 것이 강하게 권장됩니다. 주요 sort key가 같을 때 stable unique id 또는 natural order로 tie-break해 total order를 완성합니다.",
        "Comparator contract는 sign symmetry, transitivity, compare(x,y)==0 관계의 consistency가 필요합니다. subtraction comparator a.id-b.id는 overflow로 이 조건을 깰 수 있으므로 Integer.compare·comparingInt를 사용합니다.",
        "comparator가 참조하는 mutable field를 set membership 중 바꾸면 tree 위치와 현재 comparison이 어긋나 hash mutable-key와 유사한 orphan 상태가 됩니다. sort keys도 immutable이어야 합니다.",
        "natural-order TreeSet은 null을 허용하지 않아 add(null)이 NullPointerException입니다. Comparator.nullsFirst로 기술적으로 허용할 수 있어도 domain null을 별도 상태로 모델링하는 편이 비교·serialization 경계를 단순화합니다.",
        "range views subSet·headSet·tailSet은 backing view라 원본과 변경을 공유하고 endpoints는 overload에 따라 inclusive/exclusive입니다. 독립 snapshot이 필요하면 new TreeSet<>(view)처럼 copy합니다.",
        "navigation methods lower·floor·ceiling·higher는 단순 정렬 출력보다 TreeSet의 장점입니다. nearest-key 조회 요구가 없고 insertion order만 필요하다면 LinkedHashSet이 더 직접적입니다.",
      ],
      concepts: [
        { term: "natural ordering", definition: "element class의 Comparable.compareTo가 정의하는 기본 순서입니다.", detail: ["TreeSet 기본 constructor가 사용합니다.", "모든 elements가 상호 비교 가능해야 합니다."], caveat: "Comparable 구현도 equals와 consistency를 검토해야 합니다." },
        { term: "total order comparator", definition: "모든 허용 값 쌍을 일관되고 transitive하게 비교하며 서로 다른 membership values에 tie-break를 제공하는 ordering입니다.", detail: ["comparing(...).thenComparing(...)로 조립할 수 있습니다.", "compare0은 TreeSet duplicate를 뜻합니다."] },
        { term: "consistent with equals", definition: "compare(a,b)==0이 a.equals(b)와 같은 경우에만 성립하는 관계입니다.", detail: ["Set의 일반 equality 기대와 TreeSet membership이 정렬됩니다.", "BigDecimal처럼 표준 타입도 두 관계가 다를 수 있습니다."], caveat: "불일치 comparator가 문법 오류는 아니지만 Set 계약 사용자가 놀랄 동작을 만들 수 있습니다." },
      ],
      codeExamples: [{
        id: "java-treeset-comparator-contract-lab",
        title: "길이 comparator의 원소 소실과 tie-break comparator의 보존, null failure를 비교합니다",
        language: "java",
        filename: "TreeSetComparatorContractLab.java",
        purpose: "TreeSet이 equals가 아닌 compare0으로 uniqueness를 정하는 사실과 total-order 보완 방법을 exact 결과로 확인합니다.",
        code: String.raw`import java.util.Comparator;
import java.util.Set;
import java.util.TreeSet;

public class TreeSetComparatorContractLab {
    public static void main(String[] args) {
        Set<String> natural = new TreeSet<>();
        natural.addAll(Set.of("pear", "apple", "banana"));

        Comparator<String> lengthOnly = Comparator.comparingInt(String::length);
        Set<String> collapsed = new TreeSet<>(lengthOnly);
        collapsed.add("cat");
        boolean dogAdded = collapsed.add("dog");

        Comparator<String> total = Comparator
                .<String>comparingInt(String::length)
                .thenComparing(Comparator.naturalOrder());
        Set<String> preserved = new TreeSet<>(total);
        preserved.add("cat");
        preserved.add("dog");

        String nullFailure;
        try {
            natural.add(null);
            nullFailure = "none";
        } catch (NullPointerException expected) {
            nullFailure = expected.getClass().getSimpleName();
        }

        System.out.println("natural=" + natural);
        System.out.println("collapsed=" + collapsed.size() + ","
                + dogAdded + "," + collapsed.contains("dog"));
        System.out.println("preserved=" + preserved);
        System.out.println("null=" + nullFailure);
    }
}`,
        walkthrough: [
          { lines: "1-4", explanation: "Comparator와 sorted Set 구현만 import해 comparison contract를 중심에 둡니다." },
          { lines: "7-8", explanation: "natural String order를 가진 TreeSet에 unordered factory source를 넣어도 sorted sequence가 됩니다." },
          { lines: "10-13", explanation: "length-only comparator는 cat과 dog를 compare0으로 보아 dog add를 거부합니다." },
          { lines: "15-20", explanation: "length 뒤 natural tie-break를 추가한 total comparator는 같은 길이의 두 문자열을 모두 보존합니다." },
          { lines: "22-28", explanation: "natural TreeSet의 null rejection을 exception simple type으로 결정적으로 포착합니다." },
          { lines: "30-35", explanation: "natural order, compare0 collapse/contains 효과, tie-break 보존, null policy를 exact 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0"], command: isolatedJavaRun("TreeSetComparatorContractLab.java", "TreeSetComparatorContractLab") },
        output: { value: "natural=[apple, banana, pear]\ncollapsed=1,false,true\npreserved=[cat, dog]\nnull=NullPointerException", explanation: ["collapsed에는 실제 cat만 있어도 comparator 관점에서 dog와 같은 원소라 contains(dog)가 true입니다.", "tie-break가 equals-distinct strings를 구분해 두 원소가 모두 남습니다."] },
        experiments: [
          { change: "total comparator의 thenComparing을 제거합니다.", prediction: "같은 길이 values가 한 representative로 축약됩니다.", result: "sorting convenience comparator가 membership identity를 바꿀 수 있습니다." },
          { change: "id 비교를 left-right subtraction으로 구현하고 extreme ints를 넣습니다.", prediction: "overflow가 sign/transitivity를 깨뜨릴 수 있습니다.", result: "Integer.compare 또는 comparingInt를 사용합니다." },
          { change: "Comparator.nullsFirst를 적용합니다.", prediction: "null 하나가 정렬 membership에 들어갈 수 있지만 모든 consumer가 null을 처리해야 합니다.", result: "기술적 허용보다 domain null policy를 먼저 정합니다." },
        ],
        sourceRefs: ["java-tree-set-api", "java-comparator-api", "java-comparable-api", "java-sorted-set-api", "java-navigable-set-api"],
      }],
      diagnostics: [
        { symptom: "equals false인 두 원소 중 하나가 TreeSet에서 사라진다.", likelyCause: "comparator가 주요 sort field만 비교해 서로 다른 values에 compare0을 반환합니다.", checks: ["equals와 comparator 결과를 pair로 확인합니다.", "add 반환값을 검사합니다.", "tie-break field가 stable·unique한지 봅니다."], fix: "membership identity까지 구분하는 stable tie-break를 thenComparing으로 추가합니다.", prevention: "comparator property tests에 antisymmetry·transitivity·compare0↔equals cases를 포함합니다." },
        { symptom: "TreeSet iteration 또는 contains가 field 변경 뒤 이상해진다.", likelyCause: "comparator가 읽는 mutable sort key를 삽입 후 변경해 tree invariant를 깨뜨렸습니다.", checks: ["sort fields의 mutation history를 찾습니다.", "새 TreeSet copy에서 behavior가 달라지는지 봅니다.", "navigation 결과와 full sorted copy를 비교합니다."], fix: "immutable sort key를 저장하고 변경은 remove-old/add-new transaction으로 수행합니다.", prevention: "sorted collection element의 comparison state를 immutable로 설계합니다." },
      ],
      expertNotes: ["TreeSet contains는 equals search가 아니라 comparator search입니다. compare0 equivalence class가 domain equality와 다르면 API 사용자에게 명시해야 합니다.", "BigDecimal은 compareTo가 scale을 무시할 수 있지만 equals는 scale을 봅니다. 표준 타입도 ordering consistency를 자동 보장하지 않으므로 key semantics를 확인합니다."],
    },
    {
      id: "immutable-set-factories-copy-boundaries",
      title: "Set.of·Set.copyOf는 null·duplicate·mutation 정책이 엄격한 immutable boundary이며 order와 deep immutability는 별도입니다",
      lead: "편리한 factory를 단순 축약 문법으로 보지 않고 입력 validation, snapshot ownership, iteration order, element mutability를 포함한 API 경계로 사용합니다.",
      explanations: [
        "Set.of는 제공한 elements로 unmodifiable Set을 만들며 duplicate가 있으면 IllegalArgumentException, null element가 있으면 NullPointerException을 즉시 던집니다. 조용히 중복을 제거하는 constructor와 의도가 다릅니다.",
        "Set.copyOf(Collection)는 source의 unique elements를 가진 unmodifiable Set을 반환합니다. source가 mutable이어도 이후 source 구조 변경은 결과 membership에 반영되지 않는 snapshot boundary입니다.",
        "copyOf 입력에 duplicates가 있으면 한 representative로 축약될 수 있지만 어떤 duplicate instance가 대표가 되는지 의존하지 않습니다. duplicate 자체를 오류로 보려면 입력 크기와 결과 크기를 비교하거나 별도 validation합니다.",
        "unmodifiable은 add/remove/clear 같은 Set 구조 변경을 금지할 뿐 element 내부 상태까지 freeze하지 않습니다. mutable element가 equality/hash를 바꾸면 immutable Set 구현에서도 membership 문제를 만들 수 있습니다.",
        "Set.of와 Set.copyOf의 iteration order는 API상 unspecified이며 JVM 실행마다 randomized될 수도 있습니다. UI·snapshot에는 sorted copy 또는 LinkedHashSet defensive copy처럼 명시적 order policy가 필요합니다.",
        "Set.copyOf가 입력이 이미 적절한 unmodifiable Set이면 같은 instance를 반환할 수 있으므로 identity를 assertion하지 않습니다. 계약은 관찰 가능한 immutability와 membership입니다.",
        "Collections.unmodifiableSet(view)는 기존 backing Set의 read-only view이므로 owner가 backing을 바꾸면 view도 바뀝니다. 독립 snapshot이 필요하면 먼저 new LinkedHashSet<>(source)로 copy한 뒤 wrapper를 씌웁니다.",
        "public API는 caller-owned mutable collection을 그대로 field에 저장하지 않습니다. constructor에서 copy하고 getter에서도 immutable value를 반환해 representation exposure와 time-of-check/time-of-use drift를 줄입니다.",
        "null이 의미 있는 domain state라면 Set 안 null보다 Optional field, sealed state, 별도 bucket 같은 모델을 검토합니다. factory의 fail-fast null rejection은 boundary bug를 가까운 곳에서 드러냅니다.",
      ],
      concepts: [
        { term: "unmodifiable collection", definition: "그 reference를 통한 구조 변경 연산이 UnsupportedOperationException으로 거부되는 collection입니다.", detail: ["element deep immutability와 다릅니다.", "backing view인지 independent value인지 생성 방식을 확인합니다."] },
        { term: "defensive snapshot", definition: "caller-owned mutable collection의 현재 elements를 새 container로 복사해 이후 구조 변경의 aliasing을 끊는 경계입니다.", detail: ["constructor와 getter ownership에 사용합니다.", "element 자체도 immutable인지 별도 검토합니다."] },
        { term: "fail-fast input factory", definition: "duplicate·null처럼 factory contract에 맞지 않는 입력을 construction 지점에서 즉시 거부하는 API입니다.", detail: ["Set.of는 duplicate와 null을 거부합니다.", "silent normalization이 필요한 흐름과 구분합니다."] },
      ],
      codeExamples: [{
        id: "java-immutable-set-factories-lab",
        title: "factory의 duplicate/null/mutation failure와 copy snapshot을 order-neutral하게 검증합니다",
        language: "java",
        filename: "ImmutableSetFactoriesLab.java",
        purpose: "Set.of와 Set.copyOf의 엄격한 입력·immutability·snapshot 계약을 raw iteration order 없이 실행합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class ImmutableSetFactoriesLab {
    static String failure(Runnable action) {
        try {
            action.run();
            return "none";
        } catch (RuntimeException exception) {
            return exception.getClass().getSimpleName();
        }
    }

    static List<String> sorted(Set<String> values) {
        List<String> result = new ArrayList<>(values);
        result.sort(String::compareTo);
        return result;
    }

    public static void main(String[] args) {
        Set<String> factory = Set.of("beta", "alpha");
        LinkedHashSet<String> source = new LinkedHashSet<>(
                List.of("alpha", "beta"));
        Set<String> snapshot = Set.copyOf(source);
        source.add("gamma");

        String duplicate = failure(() -> Set.of("x", "x"));
        String nullElement = failure(() -> Set.of("x", null));
        String mutation = failure(() -> factory.add("gamma"));

        System.out.println("factoryMembers=" + sorted(factory));
        System.out.println("sourceNow=" + source);
        System.out.println("copyMembers=" + sorted(snapshot));
        System.out.println("failures=" + duplicate + ","
                + nullElement + "," + mutation);
    }
}`,
        walkthrough: [
          { lines: "1-5", explanation: "raw factory order를 숨길 sorted copy와 insertion-ordered mutable source에 필요한 types를 가져옵니다." },
          { lines: "7-14", explanation: "failure helper는 예상 RuntimeException의 stable simple class만 반환하고 message/localization에는 의존하지 않습니다." },
          { lines: "16-20", explanation: "Set을 독립 List로 copy한 뒤 natural sort해 factory order가 아니라 membership만 canonicalize합니다." },
          { lines: "23-27", explanation: "immutable factory와 mutable source의 copy snapshot을 만들고 source에 gamma를 추가해 alias가 끊겼는지 준비합니다." },
          { lines: "29-31", explanation: "duplicate·null·structural mutation 세 contract violation을 각각 포착합니다." },
          { lines: "33-37", explanation: "factory/copy는 sorted membership, source는 LinkedHashSet order, failures는 exception type으로 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0", "factory raw order never emitted"], command: isolatedJavaRun("ImmutableSetFactoriesLab.java", "ImmutableSetFactoriesLab") },
        output: { value: "factoryMembers=[alpha, beta]\nsourceNow=[alpha, beta, gamma]\ncopyMembers=[alpha, beta]\nfailures=IllegalArgumentException,NullPointerException,UnsupportedOperationException", explanation: ["source mutation 뒤에도 snapshot membership은 alpha/beta 두 개입니다.", "factory와 copy raw order는 출력하지 않고 sorted membership만 비교합니다."] },
        experiments: [
          { change: "Set.copyOf 대신 Collections.unmodifiableSet(source)를 저장합니다.", prediction: "source.add(gamma)가 view에도 보이므로 independent snapshot 기대가 깨집니다.", result: "view와 value copy를 ownership requirement로 구분합니다." },
          { change: "mutable element의 key field를 factory 생성 뒤 변경합니다.", prediction: "Set 구조는 unmodifiable이어도 contains semantics가 깨질 수 있습니다.", result: "container immutability는 deep element immutability가 아닙니다." },
          { change: "factory.toString raw order를 exact golden으로 사용합니다.", prediction: "membership이 같아도 iteration randomization에 취약합니다.", result: "unordered factory는 sorted copy로 normalize합니다." },
        ],
        sourceRefs: ["java-set-api", "java-collections-api", "java-linked-hash-set-api", "jdk-immutable-collection-order"],
      }],
      diagnostics: [
        { symptom: "Set.copyOf 결과의 출력 순서가 바뀐다.", likelyCause: "unmodifiable이라는 사실을 insertion/sorted order 보장으로 오해했습니다.", checks: ["API order guarantee를 확인합니다.", "raw toString/iteration golden이 있는지 봅니다.", "사용자-visible order requirement를 확인합니다."], fix: "표시 시 명시적으로 sort하거나 ordered defensive snapshot representation을 사용합니다.", prevention: "immutability와 ordering을 별도 architecture decisions로 기록합니다." },
        { symptom: "unmodifiableSet인데 owner 변경이 reader에게 보인다.", likelyCause: "backing collection의 read-only view를 만들었지 독립 copy를 만들지 않았습니다.", checks: ["wrapper 생성 전 new collection copy가 있는지 봅니다.", "backing reference가 외부에 남는지 추적합니다.", "element mutation과 structure mutation을 구분합니다."], fix: "Collections.unmodifiableSet(new LinkedHashSet<>(source)) 또는 order가 불필요하면 Set.copyOf를 사용합니다.", prevention: "constructor boundary에서 defensive-copy test를 둡니다." },
      ],
      expertNotes: ["Set.copyOf identity·concrete class·iteration sequence는 계약이 아닙니다. tests는 membership, mutation rejection, source alias absence만 관찰합니다.", "Set.of duplicate rejection은 configuration typo를 빨리 찾는 데 유리하고, user input stable dedup에는 LinkedHashSet collection처럼 다른 semantics가 필요합니다."],
    },
    {
      id: "stable-dedup-record-defensive-copy-concurrency",
      title: "record value key로 stable dedup하고 defensive snapshot과 concurrent key set으로 ownership·thread safety를 분리합니다",
      lead: "실무의 중복 제거는 한 줄 new HashSet이 아니라 canonicalization, 최초 등장 순서, immutable key, API ownership, atomic concurrent mutation을 함께 결정하는 파이프라인입니다.",
      explanations: [
        "stable dedup은 같은 의미의 입력 중 최초 등장 순서를 보존하는 요구입니다. 입력을 canonical immutable key로 변환한 뒤 LinkedHashSet에 넣으면 equality 중복 제거와 encounter order가 함께 표현됩니다.",
        "canonicalization은 equality 전에 수행해야 합니다. trim/strip, Locale.ROOT case fold, identifier syntax validation을 constructor boundary에 모으면 Java·java·공백 변형이 같은 CourseKey가 됩니다.",
        "record는 components 기반 equals/hashCode를 자동 생성해 value key에 적합합니다. compact canonical constructor에서 normalized value를 component parameter에 재대입하면 저장되는 상태 자체가 canonical form이 됩니다.",
        "Unicode case folding과 normalization은 domain별 정책입니다. Locale.ROOT lower-case만으로 모든 사람 이름·국제화 identifier를 합치지 않으며 필요하면 Normalizer form, confusable, database collation 정책을 일치시킵니다.",
        "Collections.unmodifiableSet(new LinkedHashSet<>(source))는 insertion order를 유지하는 independent structural snapshot입니다. source를 나중에 변경해도 reader view가 변하지 않고 reader의 add는 거부됩니다.",
        "ConcurrentHashMap.newKeySet은 여러 threads의 add/remove를 지원하는 concurrent Set입니다. 각 개별 add는 thread-safe하지만 contains 후 add 같은 복합 check-then-act가 전체 transaction으로 atomic한 것은 아닙니다.",
        "중복을 막으며 최초 생성 side effect를 한 번만 수행하려면 ConcurrentMap.computeIfAbsent 같은 compound atomic API를 검토합니다. newKeySet.add 반환값도 이 thread가 대표를 처음 추가했는지 판단하는 유용한 원자 결과입니다.",
        "Collections.synchronizedSet은 모든 접근에 wrapper lock을 사용하지만 iteration할 때는 문서대로 외부 synchronized block이 필요합니다. concurrent collection의 weakly consistent iterator와 snapshot 요구도 구분합니다.",
        "parallel 결과 test에서 raw concurrent iteration order를 출력하지 않습니다. 이 lab은0~999의 membership size와 arithmetic checksum만 검증해 scheduling과 bucket order를 제거합니다.",
        "thread pool은 작업 Future를 get해 worker 예외를 main으로 전달하고 정상 shutdown·bounded await·fallback shutdownNow를 수행해야 합니다. 테스트가 성공해도 non-daemon threads가 남으면 process lifecycle contract가 실패한 것입니다.",
      ],
      concepts: [
        { term: "stable deduplication", definition: "동등한 values 중 한 representative만 유지하면서 최초 encounter order를 보존하는 변환입니다.", detail: ["canonical key와 LinkedHashSet을 조합합니다.", "대표 선택 정책을 first-wins처럼 문서화합니다."] },
        { term: "canonical value key", definition: "동일 domain 의미를 하나의 검증·정규화된 immutable representation으로 바꾼 equality key입니다.", detail: ["constructor boundary에서 만듭니다.", "record components가 equals/hashCode를 자동 정의합니다."], caveat: "locale·Unicode·database collation과 일치하는 domain policy가 필요합니다." },
        { term: "concurrent key set", definition: "ConcurrentHashMap 기반으로 개별 membership operations의 thread safety와 visibility를 제공하는 Set입니다.", detail: ["newKeySet의 add는 atomic하고 boolean을 반환합니다.", "raw iteration order는 보장하지 않습니다."], caveat: "여러 호출을 묶은 compound invariant는 별도 atomic API가 필요합니다." },
      ],
      codeExamples: [{
        id: "java-stable-dedup-concurrency-lab",
        title: "canonical record·LinkedHashSet snapshot·concurrent key set을 한 lifecycle로 검증합니다",
        language: "java",
        filename: "StableDedupConcurrencyLab.java",
        purpose: "최초 순서 dedup, caller mutation 격리, unmodifiable reader, parallel membership의 order-neutral 결과를 재현합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class StableDedupConcurrencyLab {
    record CourseKey(String value) {
        CourseKey {
            value = Objects.requireNonNull(value).strip()
                    .toLowerCase(Locale.ROOT);
            if (value.isEmpty()) throw new IllegalArgumentException("blank key");
        }

        @Override
        public String toString() {
            return value;
        }
    }

    static Set<CourseKey> stableDedup(List<String> rawValues) {
        LinkedHashSet<CourseKey> unique = new LinkedHashSet<>();
        for (String raw : rawValues) unique.add(new CourseKey(raw));
        return unique;
    }

    public static void main(String[] args) throws Exception {
        Set<CourseKey> owner = stableDedup(
                List.of(" Java ", "java", "SPRING", "spring", "JPA"));
        Set<CourseKey> snapshot = Collections.unmodifiableSet(
                new LinkedHashSet<>(owner));
        owner.add(new CourseKey("python"));

        String mutationFailure;
        try {
            snapshot.add(new CourseKey("docker"));
            mutationFailure = "none";
        } catch (UnsupportedOperationException expected) {
            mutationFailure = expected.getClass().getSimpleName();
        }

        Set<Integer> concurrent = ConcurrentHashMap.newKeySet();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Future<?>> jobs = new ArrayList<>();
        try {
            for (int worker = 0; worker < 4; worker++) {
                int start = worker;
                jobs.add(pool.submit(() -> {
                    for (int value = start; value < 1_000; value += 4) {
                        concurrent.add(value);
                    }
                }));
            }
            for (Future<?> job : jobs) job.get();
        } finally {
            pool.shutdown();
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) {
                pool.shutdownNow();
                if (!pool.awaitTermination(5, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("pool did not terminate");
                }
            }
        }

        int checksum = concurrent.stream().mapToInt(Integer::intValue).sum();
        System.out.println("snapshot=" + snapshot);
        System.out.println("ownerAfter=" + owner);
        System.out.println("mutation=" + mutationFailure);
        System.out.println("concurrent=" + concurrent.size() + ":" + checksum);
    }
}`,
        walkthrough: [
          { lines: "1-12", explanation: "stable order, immutable view, Locale normalization, concurrent set, bounded executor lifecycle의 표준 types를 가져옵니다." },
          { lines: "15-26", explanation: "record compact constructor가 null·whitespace·case를 canonicalize하고 toString도 canonical public value만 보여 줍니다." },
          { lines: "28-32", explanation: "raw input order대로 CourseKey를 LinkedHashSet에 넣어 first-wins stable dedup을 수행합니다." },
          { lines: "35-39", explanation: "owner의 현재 ordered elements를 새 LinkedHashSet으로 copy한 뒤 unmodifiable snapshot으로 감싸고 owner만 변경합니다." },
          { lines: "41-47", explanation: "snapshot mutation이 UnsupportedOperationException으로 거부되는지 stable exception type으로 확인합니다." },
          { lines: "49-61", explanation: "네 workers가 서로 다른 residue classes를 추가하고 모든 Futures를 get해 worker failure를 전파합니다." },
          { lines: "63-71", explanation: "정상 shutdown 후 최대5초 기다리고 timeout이면 interrupt·추가5초·failure로 thread leak을 막습니다." },
          { lines: "72-76", explanation: "concurrent raw order 대신 membership count1000과 order-independent checksum499500을 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "UTF-8", "isolated temp classes", "-Xlint:all warning0", "4 worker threads joined and terminated"], command: isolatedJavaRun("StableDedupConcurrencyLab.java", "StableDedupConcurrencyLab") },
        output: { value: "snapshot=[java, spring, jpa]\nownerAfter=[java, spring, jpa, python]\nmutation=UnsupportedOperationException\nconcurrent=1000:499500", explanation: ["Java/java와 SPRING/spring은 constructor canonicalization 후 각각 한 대표만 최초 위치에 남습니다.", "snapshot은 owner의 python 추가와 분리되고 concurrent output은 scheduling/order에 의존하지 않습니다."] },
        experiments: [
          { change: "Locale.ROOT를 Locale.getDefault로 바꾸고 Turkish locale에서 I가 포함된 key를 넣습니다.", prediction: "machine default에 따라 canonical key가 달라질 수 있습니다.", result: "machine identifier normalization에는 explicit locale policy를 사용합니다." },
          { change: "snapshot을 Collections.unmodifiableSet(owner)로 직접 감쌉니다.", prediction: "owner의 python 추가가 snapshot에도 보여 defensive snapshot 계약이 깨집니다.", result: "wrapper 전에 ownership을 끊는 copy가 필요합니다." },
          { change: "contains 후 add를 두 호출로 수행하며 side effect를 그 사이에 둡니다.", prediction: "여러 threads가 모두 contains false를 보고 side effect를 중복 수행할 수 있습니다.", result: "add 반환값 또는 computeIfAbsent 같은 compound atomic operation을 사용합니다." },
        ],
        sourceRefs: ["jls-record-classes", "java-linked-hash-set-api", "java-collections-api", "java-locale-api", "java-concurrent-hash-map-api", "java-executor-service-api", "java-future-api"],
      }],
      diagnostics: [
        { symptom: "대소문자·공백만 다른 입력이 별도 Set 원소로 남는다.", likelyCause: "raw presentation string을 equality key로 사용하고 canonicalization policy가 없습니다.", checks: ["domain이 어떤 변형을 동일시하는지 확인합니다.", "normalization이 equality 전/후 어디서 수행되는지 봅니다.", "Locale·Unicode·DB collation 정책을 비교합니다."], fix: "validated canonical immutable key를 constructor에서 만들고 그 key로 stable dedup합니다.", prevention: "canonicalization property tests와 cross-layer collation contract를 둡니다." },
        { symptom: "동시 duplicate 처리에서 외부 side effect가 두 번 실행된다.", likelyCause: "thread-safe Set 위에서 contains→effect→add라는 compound sequence를 atomic하다고 오해했습니다.", checks: ["개별 호출 사이 interleaving을 그립니다.", "add boolean을 무시하는지 봅니다.", "Map compute 계열로 value creation을 묶을 수 있는지 확인합니다."], fix: "winning add 반환값에만 side effect를 연결하거나 idempotency key/computeIfAbsent transaction을 사용합니다.", prevention: "concurrency tests에 latch/barrier로 같은 key 경쟁을 강제합니다." },
      ],
      expertNotes: ["canonicalization은 데이터 손실 정책입니다. 사용자 표시 원문이 필요하면 canonical key와 display value를 분리해 원문을 무조건 소문자로 덮어쓰지 않습니다.", "ConcurrentHashMap.newKeySet iterator는 weakly consistent하므로 실시간 progress에는 쓸 수 있지만 거래 마감 snapshot처럼 exact instant가 필요하면 별도 coordination이 필요합니다."],
    },
  ],
  lab: {
    title: "중복·순서·소유권·동시성을 명시한 학습 과정 등록 키 Set을 설계합니다",
    scenario: "여러 업로드 파일과 네 worker가 과정 코드를 동시에 전달합니다. 공백·대소문자 변형은 같은 과정으로 보고 최초 등장 순서를 관리자 미리보기에 유지해야 하며, 공개 API는 caller 변경에 흔들리지 않는 snapshot을 반환해야 합니다. 비교용 legacy key는 mutable하고 일부 test key는 hash collision을 일으키므로 equality·ordering·concurrency 계약을 각각 증명해야 합니다.",
    setup: [
      "OpenJDK21을 사용하고 모든 production/example source를 -encoding UTF-8 --release21 -proc:none -Xlint:all로 warning0 compile합니다.",
      "CourseKey record는 raw display와 canonical identifier를 혼동하지 않도록 canonical component만 equality에 사용하고 null·blank를 constructor에서 거부합니다.",
      "입력 fixture에는 Java/java/공백 변형, 최초 순서가 다른 값, exact duplicate, deliberate same-hash unequal keys, synthetic 값만 사용합니다.",
      "HashSet raw iteration, Set.of/copyOf raw iteration, concurrent key-set raw iteration은 golden output에 포함하지 않습니다.",
      "모든 executor와 temp directory는 success/failure 양 경로에서 bounded termination·safe cleanup이 되게 준비합니다.",
    ],
    steps: [
      "요구사항 표에 element type, duplicate relation, encounter order, null policy, mutation ownership, concurrency granularity를 각각 한 줄로 적습니다.",
      "CourseKey compact constructor에서 Objects.requireNonNull, strip, Locale.ROOT lower-case, blank rejection을 구현합니다.",
      "CourseKey의 record-generated equals/hashCode가 canonical component만 사용하는지 equal pair·different pair로 검증합니다.",
      "raw list를 순서대로 LinkedHashSet<CourseKey>에 추가하고 add boolean으로 first-wins와 duplicate count를 계산합니다.",
      "동일 input을 HashSet에도 넣되 raw sequence를 출력하지 않고 size·containsAll·set equality만 비교합니다.",
      "LinkedHashSet에 duplicate add, remove/re-add를 적용해 기존 위치 유지와 tail 이동을 별도 test로 만듭니다.",
      "constant-hash value keys 세 개를 추가해 같은 hash이면서 equals false인 값이 모두 남는지 확인합니다.",
      "mutable legacy key를 삽입 후 equality field를 바꾸어 contains/remove failure를 재현하고, production model에서는 immutable projection으로 교체합니다.",
      "길이-only TreeSet comparator가 같은 길이 값을 축약하는 negative case를 만들고 stable unique tie-break를 추가합니다.",
      "Set.of의 duplicate/null failures와 Set.copyOf의 source-alias absence를 exception type·membership으로 검증합니다.",
      "ordered public snapshot은 Collections.unmodifiableSet(new LinkedHashSet<>(owner))으로 만들고 owner 변경·reader add를 각각 시험합니다.",
      "ConcurrentHashMap.newKeySet에 네 workers가 겹치는 canonical keys를 넣고 모든 Future.get으로 worker exceptions를 전달합니다.",
      "concurrent 결과는 expected membership set과 equals로 비교하고 표시용으로만 sorted copy를 사용합니다.",
      "side effect가 필요한 중복 등록은 contains→act→add 대신 winning add 결과 또는 computeIfAbsent/idempotency key로 설계합니다.",
      "invariance·wildcard add·generic array·erasure clash·static T negative compiler fixtures가 error1씩인지 확인합니다.",
      "raw와 non-reifiable varargs fixtures는 compile success이면서 lint warning이 존재하고 production sources는 warning0인지 분리합니다.",
      "equality five laws와 equal⇒same hash property를 여러 generated CourseKey triples로 반복합니다.",
      "모든 output에서 unordered raw sequence, 민감 원본 값, absolute local path, credentials가 없는지 scan합니다.",
    ],
    expectedResult: [
      "대소문자·앞뒤 공백 변형은 하나의 canonical CourseKey equivalence class가 되고 최초 등장 위치가 유지됩니다.",
      "HashSet과 LinkedHashSet은 membership이 같지만 order assertion은 LinkedHashSet에만 존재합니다.",
      "hash collision은 원소 손실을 만들지 않고 mutable legacy key failure는 immutable production key로 제거됩니다.",
      "TreeSet comparator는 compare0과 equals 정책이 일치하도록 tie-break를 포함합니다.",
      "public ordered snapshot은 owner 이후 mutation과 reader mutation에서 모두 격리됩니다.",
      "네 workers의 결과는 scheduling과 무관하게 expected size/membership/checksum을 만족하고 executor threads가 남지 않습니다.",
      "application/example compile은 warning0이고 negative harness만 의도된 errors/warnings를 exact diagnostic contract로 가집니다.",
      "test golden 어디에도 HashSet·immutable factory·concurrent Set의 raw iteration order가 없습니다.",
    ],
    cleanup: [
      "executor를 shutdown하고5초 await, timeout이면 shutdownNow와 추가5초 await 후 실패 처리합니다.",
      "temp output은 normalized OS temp direct-child parent를 확인한 뒤 deepest-first 또는 safe recursive delete합니다.",
      "launcher environment를 변경한 감사라면 원래 존재 여부와 값을 finally에서 정확히 복원합니다.",
      "workspace에 .class, audit temp, decoded private fixture, raw stdout snapshot이 남지 않았는지 확인합니다.",
    ],
    extensions: [
      "jqwik 또는 QuickTheories로 equals reflexive/symmetric/transitive/hash properties와 comparator transitivity를 생성 기반으로 검사합니다.",
      "JMH로 uniform hash와 adversarial collision의 contains throughput을 비교하되 숫자를 기능 test golden으로 쓰지 않습니다.",
      "database collation과 CourseKey normalization이 같은 equivalence classes를 만드는지 integration test를 추가합니다.",
      "동시 등록 side effect를 idempotency key와 persistent unique constraint까지 확장해 process crash/retry를 다룹니다.",
      "관리자 정렬 view는 source LinkedHashSet을 변경하지 않는 sorted List projection으로 제공하고 sort key별 tie-break를 문서화합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "Ex02 방식의 숫자 HashSet 순회를 raw order assertion 없이 검증하고 LinkedHashSet 버전과 비교하세요.",
      requirements: ["입력은10,100,1000과 duplicate100을 사용합니다.", "HashSet은 size·containsAll·sorted copy만 assert합니다.", "enhanced for와 Iterator가 같은 multiset을 방문하는지 비교합니다.", "LinkedHashSet만 insertion order exact를 assert합니다.", "-Xlint:all warning0와 exact deterministic summary를 유지합니다."],
      hints: ["각 traversal 결과를 List가 아니라 frequency map 또는 sorted list로 normalize하세요.", "HashSet.toString 결과를 golden으로 저장하지 마세요.", "duplicate add의 boolean도 좋은 계약입니다."],
      expectedOutcome: "두 Set의 membership은 같고 HashSet raw order와 무관하게 test가 안정적이며 LinkedHashSet에서만10→100→1000 encounter order가 보장됩니다.",
      solutionOutline: ["HashSet을 구성하고 add false·size3·containsAll을 확인합니다.", "두 traversal 결과를 sorted integer lists로 바꿔 expected와 비교합니다.", "같은 source를 LinkedHashSet에 넣고 sequence를 exact 비교합니다."],
    },
    {
      difficulty: "응용",
      prompt: "Ex04/Ex07처럼 equals/hashCode가 없는 mutable 자료형을 immutable record key 기반 중복 제거로 리팩터링하세요.",
      requirements: ["원본의 실제 name-like 값은 사용·출력하지 않고 synthetic fixtures만 사용합니다.", "record components는 domain duplicate identity만 포함합니다.", "constructor에서 null·blank·canonicalization을 처리합니다.", "equals 다섯 법칙·hash agreement·HashSet size를 검증합니다.", "mutable display/score state는 key와 분리합니다.", "삽입 후 key mutation 가능성이 구조적으로 없어야 합니다."],
      hints: ["entity 전체를 Set element로 두기보다 immutable Key를 따로 만드세요.", "record component에 mutable array/list를 넣으면 deep immutability가 되지 않습니다.", "동일 key의 display state merge policy도 first-wins/last-wins/error 중 선택하세요."],
      expectedOutcome: "논리적으로 같은 synthetic records는 한 representative로 축약되고 display/score 변경이 membership lookup을 깨뜨리지 않습니다.",
      solutionOutline: ["identity fields를 표로 선택합니다.", "canonical record와 별도 payload class를 만듭니다.", "Set<Key> 또는 Map<Key,Payload>로 중복과 병합 책임을 분리합니다.", "law/property tests와 mutable-key regression test를 추가합니다."],
    },
    {
      difficulty: "설계",
      prompt: "여러 threads가 course tags를 등록하고 최초 등록만 audit event를 발행하는 API를 설계하세요.",
      requirements: ["canonical immutable key와 explicit Locale policy를 사용합니다.", "contains→emit→add race를 허용하지 않습니다.", "ConcurrentHashMap.newKeySet.add boolean 또는 computeIfAbsent의 atomic boundary를 설명합니다.", "event delivery는 retry에서 중복될 수 있으므로 idempotency/outbox 대안을 비교합니다.", "reader snapshot의 order·freshness·mutability 계약을 문서화합니다.", "executor lifecycle과 contention test를 포함합니다.", "raw concurrent iteration order를 외부 계약으로 노출하지 않습니다."],
      hints: ["in-memory one-winner와 durable exactly-once-like delivery는 다른 문제입니다.", "add가 true인 thread만 이벤트 후보를 만들 수 있지만 process crash boundary는 남습니다.", "ordered UI는 concurrent source에서 별도 immutable sorted snapshot으로 만드세요."],
      expectedOutcome: "동시 동일 key 경쟁에서 logical registration은 하나이고 이벤트 pipeline은 명시적 idempotency로 중복을 통제하며 readers는 정의된 snapshot 계약을 받습니다.",
      solutionOutline: ["atomic membership operation을 정합니다.", "winner와 persistent transaction/outbox 경계를 설계합니다.", "snapshot 생성 시점과 sort comparator를 정의합니다.", "barrier를 사용한 concurrency test와 crash/retry integration test를 작성합니다."],
    },
  ],
  reviewQuestions: [
    { question: "Iterable과 Collection의 책임 차이는 무엇인가요?", answer: "Iterable은 Iterator를 통한 순회를, Collection은 size·membership·mutation·bulk operations를 추가로 약속합니다." },
    { question: "Collection 변수에 ArrayList를 넣었다고 호출자가 index 접근을 가정할 수 있나요?", answer: "아닙니다. 정적 Collection 계약에는 get(index)가 없으며 order/random access가 요구되면 List 계약을 노출해야 합니다." },
    { question: "순회 중 현재 원소를 안전하게 제거하는 기본 방법은 무엇인가요?", answer: "구현이 지원할 때 Iterator.next 뒤 같은 Iterator의 remove 또는 지원되는 removeIf를 사용합니다. mutation은 optional operation이라 unsupported iterator/collection은 UnsupportedOperationException이며 이 장의 ArrayList iterator는 remove를 지원합니다." },
    { question: "fail-fast iterator가 thread safety를 보장하나요?", answer: "아닙니다. ConcurrentModificationException은 best-effort bug detector일 뿐 동기화나 atomicity를 제공하지 않습니다." },
    { question: "List<Integer>가 List<Number> subtype이 아닌 이유는 무엇인가요?", answer: "허용하면 List<Number> 별칭으로 Double을 써서 Integer element 계약을 깨뜨릴 수 있어 mutable generic type은 invariant입니다." },
    { question: "generic method의 <T>는 어디에 선언하나요?", answer: "modifier 뒤, 반환 타입 앞에 선언하며 class type parameter와 독립적으로 호출마다 추론될 수 있습니다." },
    { question: "Comparable<? super T> bound가 Comparable<T>보다 유연한 이유는 무엇인가요?", answer: "T의 상위 class가 구현한 natural comparison도 subtype T가 재사용할 수 있기 때문입니다." },
    { question: "List<int>를 사용할 수 없는 이유와 대안은 무엇인가요?", answer: "generic type argument는 reference type이어야 하므로 List<Integer>를 쓰며 boxing null/성능 경계를 인식합니다." },
    { question: "List<? extends Number>에 Integer를 add할 수 없는 이유는 무엇인가요?", answer: "실제 element type이 Double 등 다른 Number subtype일 수 있어 숨은 capture 타입을 보존할 수 없기 때문입니다." },
    { question: "List<? super Integer>에서 안전하게 읽을 수 있는 정적 타입은 무엇인가요?", answer: "실제 list가 Integer·Number·Object 중 무엇인지 모르므로 Object까지만 안전합니다." },
    { question: "PECS는 무엇을 뜻하나요?", answer: "Producer Extends, Consumer Super로, T를 읽어 제공하는 source는 ? extends T, T를 받는 destination은 ? super T를 사용한다는 기억법입니다." },
    { question: "wildcard capture helper는 어떤 문제를 해결하나요?", answer: "한 List<?>의 숨은 실제 element type을 private <T> helper 안에서 이름 붙여 같은 list 내부 get/set 관계를 type-safe하게 유지합니다." },
    { question: "List<String>과 List<Integer>가 별도 runtime classes가 아닌 이유는 무엇인가요?", answer: "Java generic이 erasure 기반이라 type arguments별 class를 생성하지 않기 때문입니다." },
    { question: "bridge method가 필요한 이유는 무엇인가요?", answer: "generic override의 erased JVM descriptor가 달라져도 interface/class polymorphic dispatch를 유지하도록 compiler가 forwarding method를 생성합니다." },
    { question: "process(List<String>)와 process(List<Integer>)를 overload할 수 없는 이유는 무엇인가요?", answer: "둘 다 erasure 뒤 process(List)라는 같은 signature가 되어 name clash가 발생합니다." },
    { question: "List<String>이 reifiable type이 아니라는 말은 무엇인가요?", answer: "runtime에 String type argument를 완전히 검사할 정보가 없어 instanceof List<String>이나 직접 generic array component 검사를 할 수 없다는 뜻입니다." },
    { question: "raw List와 List<?>는 어떻게 다른가요?", answer: "raw List는 generic 검사를 약화해 unchecked write가 가능하지만 List<?>는 unknown element type을 보존해 non-null write를 막습니다." },
    { question: "heap pollution은 무엇이며 언제 예외가 보이나요?", answer: "parameterized 계약과 실제 element가 불일치한 상태이며 오염 지점이 아니라 나중의 compiler-inserted cast에서 ClassCastException으로 드러날 수 있습니다." },
    { question: "@SafeVarargs를 언제 붙여도 되나요?", answer: "override 불가 method/constructor에서 varargs array를 오염·노출하지 않는다는 body-level 증명이 있을 때만 붙입니다." },
    { question: "class Bad<T>에서 static T field가 불가능한 이유는 무엇인가요?", answer: "static 상태는 class 전체가 하나지만 T는 instance별 type argument라 하나의 T를 정할 수 없기 때문입니다." },
    { question: "equals의 다섯 조건은 무엇인가요?", answer: "reflexive, symmetric, transitive, consistent, non-null입니다." },
    { question: "equals와 hashCode의 핵심 단방향 법칙은 무엇인가요?", answer: "equals true인 두 객체는 같은 hashCode여야 하지만 같은 hash가 equals true를 뜻하지는 않습니다." },
    { question: "hash collision이면 한 원소가 사라지나요?", answer: "아닙니다. 같은 hash bucket 후보 안에서 equals false인 값은 모두 별도 원소로 저장됩니다." },
    { question: "mutable key를 HashSet에 넣은 뒤 hash field를 바꾸면 왜 contains가 실패하나요?", answer: "객체는 옛 hash 위치에 남지만 lookup은 새 hash 위치를 검색해 경로가 어긋나기 때문입니다." },
    { question: "HashSet iteration sequence를 golden으로 쓰면 안 되는 이유는 무엇인가요?", answer: "API가 order를 보장하지 않아 JDK·capacity·hash·input 변화에서 membership과 무관하게 달라질 수 있기 때문입니다." },
    { question: "LinkedHashSet에서 duplicate add가 기존 원소를 끝으로 이동시키나요?", answer: "아닙니다. add는 false이고 기존 위치를 유지하며 remove 후 re-add해야 새로운 insertion으로 끝에 갑니다." },
    { question: "Set.equals는 iteration order를 비교하나요?", answer: "아닙니다. 같은 size와 mutual membership을 비교하므로 HashSet과 LinkedHashSet도 같은 원소면 equal할 수 있습니다." },
    { question: "TreeSet의 duplicate 판정은 무엇인가요?", answer: "natural ordering 또는 Comparator의 compare 결과가0인지로 판단합니다." },
    { question: "길이 comparator가 cat과 dog 중 하나를 잃게 하는 이유는 무엇인가요?", answer: "equals는 다르지만 길이 비교가0이라 TreeSet이 같은 equivalence class로 취급하기 때문입니다." },
    { question: "TreeSet comparator에 tie-break가 필요한 때는 언제인가요?", answer: "주요 sort key가 같아도 별도 Set 원소여야 할 때 stable unique/natural key로 total order를 완성해야 합니다." },
    { question: "natural TreeSet의 null 기본 정책은 무엇인가요?", answer: "null을 비교할 수 없어 add(null)을 NullPointerException으로 거부합니다." },
    { question: "Set.of는 duplicate와 null을 어떻게 처리하나요?", answer: "duplicate는 IllegalArgumentException, null은 NullPointerException으로 construction 지점에서 거부합니다." },
    { question: "Set.copyOf 뒤 source를 변경하면 결과도 바뀌나요?", answer: "아닙니다. membership의 structural snapshot이며 source 이후 변경과 alias되지 않습니다." },
    { question: "unmodifiable collection이 deep immutable을 뜻하나요?", answer: "아닙니다. 구조 변경만 막고 mutable element의 내부 상태까지 freeze하지 않습니다." },
    { question: "Collections.unmodifiableSet(source)와 defensive snapshot의 차이는 무엇인가요?", answer: "전자는 backing source 변경이 보이는 view이고 후자는 먼저 새 Set으로 copy해 source alias를 끊습니다." },
    { question: "record가 Set key에 유리한 이유와 주의점은 무엇인가요?", answer: "components 기반 immutable-style value equals/hashCode를 자동 생성하지만 mutable component를 넣으면 deep stability는 보장되지 않습니다." },
    { question: "stable dedup의 의미는 무엇인가요?", answer: "동등한 값 중 하나만 남기면서 최초 encounter order를 보존하는 first-wins 변환입니다." },
    { question: "machine identifier case normalization에 Locale.ROOT를 쓰는 이유는 무엇인가요?", answer: "host default locale에 따른 case mapping drift를 제거하기 위해서이며 실제 domain Unicode policy는 별도로 정의해야 합니다." },
    { question: "ConcurrentHashMap.newKeySet이 제공하는 것은 무엇인가요?", answer: "개별 membership operations의 thread safety/visibility와 atomic add boolean을 제공하지만 raw iteration order는 보장하지 않습니다." },
    { question: "thread-safe Set에서 contains→side effect→add가 왜 안전하지 않나요?", answer: "각 호출은 안전해도 sequence 전체는 atomic하지 않아 두 threads가 동시에 contains false를 관찰할 수 있기 때문입니다." },
    { question: "concurrent Set 결과를 deterministic하게 검증하는 방법은 무엇인가요?", answer: "raw iteration 대신 expected membership·size·order-independent checksum을 비교하고 모든 worker Future와 executor termination을 확인합니다." },
    { question: "원본 direct4만 compile이 실패한 이유는 무엇인가요?", answer: "Ex08_Main이 Ex07_Set을 generic type·constructor·iterator에서 사용하므로 dependency Ex07_Set을 포함한 scope5가 필요하기 때문입니다." },
    { question: "원본 package/scope warning1은 raw generic warning인가요?", answer: "아닙니다. Ex07_Set constructor가 override 가능한 method를 호출해 발생한 possible-this-escape warning이며 raw/unchecked warning은0입니다." },
    { question: "원본 Ex02/Ex05/Ex06 HashSet output을 어떻게 검증해야 하나요?", answer: "raw order를 숨기고 numeric/record multisets, size, inclusion, symmetric difference, duplicate relation으로 normalize합니다." },
  ],
  completionChecklist: [
    "Iterable과 Collection의 책임을 구분해 설명할 수 있다.",
    "Collection·List·Set 중 필요한 최소이면서 충분한 parameter type을 선택했다.",
    "enhanced for 중 collection 직접 구조 변경을 하지 않는다.",
    "현재 원소 제거 전 Iterator.remove/removeIf 지원 여부를 확인했고 optional operation이 unsupported면 mutable owned copy나 새 결과 collection을 사용했다.",
    "fail-fast를 동시성 보장으로 설명하지 않는다.",
    "toArray의 Object[] overload를 element array로 cast하지 않는다.",
    "generic API의 같은 T가 실제 같은 의미의 type 관계만 연결한다.",
    "List<Integer>와 List<Number> invariance를 이해한다.",
    "generic method의 <T> 선언 위치와 추론을 설명할 수 있다.",
    "bounded type이 요구 capability를 정확히 표현한다.",
    "primitive generic argument 대신 wrapper boxing 경계를 인식한다.",
    "producer parameter에 ? extends를 적절히 사용했다.",
    "consumer parameter에 ? super를 적절히 사용했다.",
    "in/out 모두 필요한 container를 무리한 wildcard로 만들지 않았다.",
    "wildcard capture 문제를 unchecked cast가 아닌 helper로 해결했다.",
    "erasure 뒤 descriptor와 Signature metadata를 구분한다.",
    "reflection scanner가 bridge/synthetic methods를 고려한다.",
    "type argument만 다른 overload를 만들지 않는다.",
    "instanceof에는 reifiable type만 사용한다.",
    "raw type을 새 production code의 편의 수단으로 사용하지 않는다.",
    "-Xlint:all의 raw/unchecked/varargs warnings를 검토했다.",
    "unchecked suppression scope와 안전성 근거가 최소화되어 있다.",
    "@SafeVarargs body가 array를 오염·노출하지 않음을 증명했다.",
    "negative compiler fixtures와 warning-success fixtures를 application source와 격리했다.",
    "equals reflexive law를 검증했다.",
    "equals symmetric law를 검증했다.",
    "equals transitive law를 검증했다.",
    "equals consistency와 non-null law를 검증했다.",
    "equal objects의 hashCode agreement를 검증했다.",
    "equals와 hashCode는 equal⇒same hash를 지키며 기본적으로 같은 immutable equality fields 전체를 사용한다.",
    "Set/Map key의 equality state가 membership 동안 변하지 않는다.",
    "collision과 duplicate를 같은 개념으로 설명하지 않는다.",
    "adversarial collision test에서 correctness와 performance를 분리했다.",
    "HashSet raw iteration order를 assertion·output golden에 사용하지 않는다.",
    "unordered result는 membership 또는 sorted copy로 normalize한다.",
    "최초 encounter order 요구에는 LinkedHashSet을 사용했다.",
    "duplicate add와 remove/re-add ordering 차이를 test했다.",
    "Set equality와 iteration sequence equality를 구분한다.",
    "TreeSet의 compare0이 membership duplicate임을 이해한다.",
    "Comparator가 antisymmetry·transitivity·stable compare0 relation을 만족한다.",
    "equals-distinct values가 필요하면 comparator tie-break가 있다.",
    "subtraction comparator 대신 compare/comparing APIs를 사용했다.",
    "TreeSet sort fields가 immutable하다.",
    "null element policy를 collection boundary에서 명시했다.",
    "Set.of duplicate/null fail-fast behavior를 test했다.",
    "Set.copyOf raw iteration order를 가정하지 않는다.",
    "unmodifiable view와 independent defensive snapshot을 구분한다.",
    "container immutability와 element deep immutability를 구분한다.",
    "public constructor/getter boundary에서 caller-owned mutation을 차단했다.",
    "canonicalization을 equality 전에 수행한다.",
    "Locale·Unicode·database collation 정책을 domain에 맞게 정했다.",
    "record components에 mutable equality state가 없는지 확인했다.",
    "stable dedup의 representative 선택 정책을 문서화했다.",
    "concurrent Set의 raw iteration order를 외부 계약으로 만들지 않았다.",
    "compound concurrency invariant에 atomic API 또는 locking을 사용했다.",
    "worker Future의 exceptions를 main/test로 전파한다.",
    "executor를 bounded shutdown하고 thread leak을 검사한다.",
    "원본 package8·direct4·scope5 역할을 구분했다.",
    "원본 direct-only error5를 dependency evidence로 설명했다.",
    "원본 possible-this-escape warning1을 generic warning으로 오분류하지 않았다.",
    "원본 HashSet output은 multiset·size·relation으로만 공개했다.",
    "원본 name-like 값과 raw stdout을 public content에 노출하지 않았다.",
    "Java launcher option variables를 감사 child에서 격리하고 복원했다.",
    "temp root 생성과 launcher environment 제거가 outer try 진입 뒤 수행된다.",
    "cleanup 실패가 environment 복원을 건너뛰지 않고 restore 실패도 나머지 복원과 cleanup을 건너뛰지 않으며 각 lifecycle error를 보존한다.",
    "child process stdout/stderr를 async drain하고 timeout·tree kill·grace를 적용했다.",
    "temp cleanup target의 normalized parent를 확인했다.",
    "모든 public Java examples가 OpenJDK21 -Xlint:all warning0와 exact output을 통과했다.",
    "public target에 absolute local path·credential·private fixture·build residue가 없다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class09-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex01_Collection.java", usedFor: ["Collection method inventory", "empty-output original"], evidence: "Collection 공통 연산의 원본 주석과 output0 behavior를 감사했습니다." },
    { id: "java-class09-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex02_Set.java", usedFor: ["HashSet<Integer>", "enhanced for", "Iterator"], evidence: "원소3·두 traversal3/3을 raw order 없이 numeric multiset으로 확인했습니다." },
    { id: "java-class09-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex03_Set.java", usedFor: ["adjacent Double Set companion", "empty-output run"], evidence: "package runnable companion으로 compile/run exit0·output0을 확인했습니다." },
    { id: "java-class09-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex04_Set.java", usedFor: ["mutable element class", "missing equals/hashCode", "privacy-safe source count"], evidence: "compile-only data class의 equality 부재와 raw values를 공개하지 않는 source shape를 확인했습니다." },
    { id: "java-class09-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex05_Main.java", usedFor: ["array vs HashSet records", "enhanced/iterator/filter", "privacy-safe normalization"], evidence: "15행을 record pair multiset·ages·inclusion relation으로만 검증했습니다." },
    { id: "java-class09-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex06_Set.java", usedFor: ["bulk Set operations", "duplicate add", "clear/isEmpty"], evidence: "네 set views를 sizes6-6-0-1·symmetric difference2·same literal add5 relation으로 normalize했습니다." },
    { id: "java-class09-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex07_Set.java", usedFor: ["Ex08 dependency", "missing equality", "constructor warning"], evidence: "direct scope를 닫는 dependency이며 possible-this-escape warning1과 equality 부재를 분리했습니다." },
    { id: "java-class09-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class09/Ex08_Main.java", usedFor: ["interactive HashSet", "synthetic logical duplicates", "dependency evidence"], evidence: "같은 synthetic record 두 번 입력에서 output occurrence2와 Ex07 uses error5를 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac man page JDK21", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-Xlint:all", "-XDrawDiagnostics", "warning audit"], evidence: "원본·예제 compiler profile과 diagnostic code 감사를 고정했습니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirects", "UseShellExecute false"], evidence: "Java child를 shell injection 없이 시작하는 설정 근거입니다." },
    { id: "powershell-environment-variables", repository: "Microsoft Learn", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher environment save/remove/restore"], evidence: "네 Java launcher option variables의 parent environment 격리 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child environment isolation"], evidence: "각 child에서도 launcher variables를 제거하는 API 근거입니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "Process WaitForExit Kill Dispose", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "termination grace", "Dispose"], evidence: "bounded child lifecycle과 cleanup의 중심 API입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["asynchronous stdout/stderr drain"], evidence: "redirect pipe deadlock을 피하는 dual async drain 근거입니다." },
    { id: "java-iterable-api", repository: "Java SE21 API", path: "java.lang.Iterable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Iterable.html", usedFor: ["iterator entry", "forEach", "enhanced for"], evidence: "최소 순회 계약을 Collection 책임과 분리했습니다." },
    { id: "java-collection-api", repository: "Java SE21 API", path: "java.util.Collection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collection.html", usedFor: ["collection hierarchy", "bulk operations", "toArray"], evidence: "공통 element-group operations와 optional mutation의 근거입니다." },
    { id: "java-iterator-api", repository: "Java SE21 API", path: "java.util.Iterator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html", usedFor: ["next/remove state", "optional remove", "safe traversal mutation"], evidence: "구현이 지원할 때 현재 원소를 제거하는 state와 unsupported remove의 UnsupportedOperationException, 잘못된 호출 순서의 IllegalStateException 경계를 설명했습니다." },
    { id: "java-array-list-api", repository: "Java SE21 API", path: "java.util.ArrayList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html", usedFor: ["ordered Collection implementation", "snapshot list"], evidence: "Collection static type 아래 encounter-order implementation 예제의 근거입니다." },
    { id: "java-list-api", repository: "Java SE21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["generic invariance examples", "ordered source", "wildcard operations"], evidence: "indexed ordered collection과 parameterized element API 근거입니다." },
    { id: "java-set-api", repository: "Java SE21 API", path: "java.util.Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["duplicate semantics", "Set equality", "of/copyOf"], evidence: "중복·factory·equality 공통 계약의 중심 API입니다." },
    { id: "java-hash-set-api", repository: "Java SE21 API", path: "java.util.HashSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html", usedFor: ["hash membership", "unspecified order", "collision"], evidence: "hash/equals 기반 membership과 iteration-order 비보장의 근거입니다." },
    { id: "java-linked-hash-set-api", repository: "Java SE21 API", path: "java.util.LinkedHashSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashSet.html", usedFor: ["insertion order", "stable dedup", "ordered snapshot"], evidence: "최초 encounter order를 보존하는 Set 선택의 근거입니다." },
    { id: "java-tree-set-api", repository: "Java SE21 API", path: "java.util.TreeSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html", usedFor: ["sorted Set", "compare0 membership", "null behavior"], evidence: "natural/comparator ordering과 duplicate 판정의 중심 API입니다." },
    { id: "java-sorted-set-api", repository: "Java SE21 API", path: "java.util.SortedSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SortedSet.html", usedFor: ["ordering contract", "range views"], evidence: "sorted Set comparator와 range-view 계약을 보충했습니다." },
    { id: "java-navigable-set-api", repository: "Java SE21 API", path: "java.util.NavigableSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/NavigableSet.html", usedFor: ["lower/floor/ceiling/higher", "inclusive range overloads"], evidence: "TreeSet navigation을 단순 정렬 출력과 구분했습니다." },
    { id: "java-collections-api", repository: "Java SE21 API", path: "java.util.Collections", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html", usedFor: ["unmodifiableSet", "defensive view", "collection algorithms"], evidence: "backing view와 copy-before-wrap snapshot 차이를 설명했습니다." },
    { id: "java-object-api", repository: "Java SE21 API", path: "java.lang.Object", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["equals laws", "hashCode contract"], evidence: "Set element equality/hash의 primary API 계약입니다." },
    { id: "java-objects-api", repository: "Java SE21 API", path: "java.util.Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["null precondition", "equality/hash helpers"], evidence: "immutable key constructor와 null-safe helpers의 근거입니다." },
    { id: "java-comparable-api", repository: "Java SE21 API", path: "java.lang.Comparable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Comparable.html", usedFor: ["bounded generic max", "natural ordering", "equals consistency"], evidence: "recursive bound와 TreeSet natural ordering의 근거입니다." },
    { id: "java-comparator-api", repository: "Java SE21 API", path: "java.util.Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["total order", "thenComparing", "null policy", "contract laws"], evidence: "compare0 membership과 stable tie-break 설계의 중심 API입니다." },
    { id: "java-stream-api", repository: "Java SE21 API", path: "java.util.stream.Stream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["encounter order", "order-independent reduction"], evidence: "unordered source와 deterministic output, concurrent checksum을 설명했습니다." },
    { id: "java-locale-api", repository: "Java SE21 API", path: "java.util.Locale", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html", usedFor: ["Locale.ROOT canonicalization", "default-locale avoidance"], evidence: "machine identifier normalization의 explicit locale 근거입니다." },
    { id: "java-concurrent-hash-map-api", repository: "Java SE21 API", path: "java.util.concurrent.ConcurrentHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html", usedFor: ["newKeySet", "atomic membership", "weakly consistent iteration"], evidence: "동시 Set과 compound-operation 경계의 중심 API입니다." },
    { id: "java-executor-service-api", repository: "Java SE21 API", path: "java.util.concurrent.ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["worker lifecycle", "shutdown/await/shutdownNow"], evidence: "bounded thread-pool termination과 task submission 근거입니다." },
    { id: "java-future-api", repository: "Java SE21 API", path: "java.util.concurrent.Future", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html", usedFor: ["worker exception propagation", "completion"], evidence: "각 concurrent task failure를 main/test로 전달하는 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["in-memory negative compile tasks", "options"], evidence: "다섯 compile failures와 warning-success fixtures를 실행하는 API 근거입니다." },
    { id: "java-diagnostic-api", repository: "Java SE21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["diagnostic kind", "code", "line"], evidence: "locale text 대신 kind/code/line/count를 고정했습니다." },
    { id: "java-method-reflection-api", repository: "Java SE21 API", path: "java.lang.reflect.Method", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html", usedFor: ["isBridge", "isSynthetic", "return type"], evidence: "compiler-generated bridge와 source method를 구분했습니다." },
    { id: "jls-type-variables", repository: "JLS SE21", path: "4.4 Type Variables", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.4", usedFor: ["generic T", "bounds", "erasure of type variable"], evidence: "generic type parameter와 multiple/recursive bound의 language rule입니다." },
    { id: "jls-parameterized-types", repository: "JLS SE21", path: "4.5 Parameterized Types", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.5", usedFor: ["invariance", "raw/parameterized distinction"], evidence: "List<Integer>/List<Number> 관계의 specification 근거입니다." },
    { id: "jls-type-inference", repository: "JLS SE21", path: "18 Type Inference", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-18.html", usedFor: ["generic method inference", "bounds diagnostics"], evidence: "arguments·target type constraints가 T를 추론하는 규칙 근거입니다." },
    { id: "jls-wildcards", repository: "JLS SE21", path: "4.5.1 Type Arguments of Parameterized Types", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.5.1", usedFor: ["extends/super bounds", "wildcard permissions"], evidence: "PECS의 language-level wildcard 범위 근거입니다." },
    { id: "jls-capture-conversion", repository: "JLS SE21", path: "5.1.10 Capture Conversion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.10", usedFor: ["CAP types", "capture helper"], evidence: "List<?>를 helper T로 안전하게 이름 붙이는 규칙입니다." },
    { id: "jls-erasure", repository: "JLS SE21", path: "4.6 Type Erasure", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.6", usedFor: ["runtime erasure", "first bound", "name clash"], evidence: "parameterized descriptor와 generic translation의 중심 specification입니다." },
    { id: "jls-method-signature", repository: "JLS SE21", path: "8.4.2 Method Signature", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.2", usedFor: ["same-erasure overload clash", "override-equivalent signatures"], evidence: "type arguments만 다른 overload가 충돌하는 근거입니다." },
    { id: "jls-bridge-methods", repository: "JLS SE21", path: "15.12.4.5 Create Frame, Synchronize, Transfer Control", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.5", usedFor: ["bridge adaptation", "generic invocation result"], evidence: "invoked method signature와 compile-time declaration erasure가 다를 때의 bridge·cast invocation behavior를 보충했습니다." },
    { id: "jvms-signature-attribute", repository: "JVMS SE21", path: "4.7.9 Signature Attribute", publicUrl: "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.7.9", usedFor: ["generic metadata", "descriptor contrast", "reflection"], evidence: "erasure된 descriptor와 남는 generic Signature metadata를 구분했습니다." },
    { id: "jls-heap-pollution", repository: "JLS SE21", path: "4.12.2 Variables of Reference Type", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.2", usedFor: ["heap pollution definition", "unchecked boundary"], evidence: "parameterized variable와 runtime object 불일치의 specification 근거입니다." },
    { id: "jls-non-reifiable-varargs", repository: "JLS SE21", path: "9.6.4.7 SafeVarargs", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.6.4.7", usedFor: ["@SafeVarargs", "generic varargs warning", "body safety"], evidence: "non-reifiable varargs와 annotation 적용 조건을 설명했습니다." },
    { id: "jls-raw-types", repository: "JLS SE21", path: "4.8 Raw Types", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.8", usedFor: ["legacy compatibility", "unchecked calls", "List vs List<?>"], evidence: "raw type의 제한된 호환 목적과 warnings 근거입니다." },
    { id: "jls-static-context", repository: "JLS SE21", path: "6.5.5.1 Simple Type Names", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.5.5.1", usedFor: ["static context type variable restriction"], evidence: "generic class type parameter 이름은 static context에서 사용할 수 없다는 compile-time rule과 Box<T> 예제를 연결했습니다." },
    { id: "jls-record-classes", repository: "JLS SE21", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["record value equality", "compact constructor", "components"], evidence: "canonical immutable key와 generated equals/hashCode의 language 근거입니다." },
    { id: "jdk-immutable-collection-order", repository: "Oracle Java Tutorials", path: "Creating Unmodifiable Lists Sets and Maps", publicUrl: "https://docs.oracle.com/en/java/javase/21/core/creating-immutable-lists-sets-and-maps.html", usedFor: ["randomized iteration order", "Set.of/copyOf", "unmodifiable factories"], evidence: "factory order를 snapshot 계약으로 쓰지 않는 실무 근거입니다." },
    { id: "effective-java-equals", repository: "OpenJDK educational companion", path: "Object equals/hashCode contract", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)", usedFor: ["value equality design", "inheritance caution", "law tests"], evidence: "final value type와 composition 중심 equality 설계를 Object 계약에 맞춰 보충했습니다." },
    { id: "effective-java-mutable-key", repository: "OpenJDK educational companion", path: "HashSet element stability", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html", usedFor: ["mutable key lookup failure", "immutable projection"], evidence: "삽입 중 equality/hash state 안정성의 실행 반례를 HashSet 계약에 연결했습니다." },
  ],
  sourceCoverage: {
    filesRead: 8,
    filesUsed: 8,
    uncoveredNotes: [
      "class09 package의 Java source8개를 모두 읽고 direct4·dependency1·adjacent runnable3 역할로 분류했습니다.",
      "inventory direct4는 Ex01_Collection·Ex02_Set·Ex04_Set·Ex08_Main이며 Ex08이 Ex07_Set을 참조해 direct-only compile은 exit1·cant.resolve.location errors5입니다.",
      "Ex07_Set을 더한 atomic scope5는 main3·compile-only2이고 package8은 main6·compile-only2입니다.",
      "OpenJDK21.0.11에서 scope5와 package8은 exit0이며 compiler warning occurrence1·captured lines2입니다.",
      "warning code는 compiler.warn.possible.this.escape이고 Ex07_Set constructor의 public overridable s_sum 호출에서 발생하며 raw/unchecked generic warning은0입니다.",
      "package main6인 Ex01·Ex02·Ex03·Ex05·Ex06·Ex08은 모두 exit0·stderr0이며 output lines는0·8·0·15·6·2입니다.",
      "Ex02의 raw HashSet bracket·enhanced-for·iterator 순서는 공개하지 않고 세 numeric member multisets가 모두10·100·1000인지 확인했습니다.",
      "Ex05의 array3·enhanced4·iterator4·filter1 records는 raw names/order 없이 ages와 internal name+age pair inclusion/equality로 검증했습니다.",
      "Ex04/Ex05 source의 name-like candidates6은 active5+comment1·unique6이고 runtime unique name slots4는 source candidates membership으로만 process memory에서 비교했습니다.",
      "원본 name-like values·hashes·masked derivatives·raw Ex05 stdout은 public code/output/evidence에 싣지 않았습니다.",
      "Ex06은 four views sizes6-6-0-1, first/modified symmetric difference2, repeated same literal add5→member1 relation만 공개했습니다.",
      "Ex08에는 같은 synthetic ALPHA score record를 두 번 입력해 two record occurrences와 prompts2/2를 확인했으며 actual private input을 사용하지 않았습니다.",
      "Ex04_Set과 Ex07_Set에 equals/hashCode override가 없어 logically equal objects가 HashSet에서 identity-distinct representatives로 남습니다.",
      "원본 HashSet outputs는 implementation order가 unspecified라 exact raw sequence가 아닌 multiset·membership·size·relation으로 normalize했습니다.",
      "Ex01의 Collection method 주석은 hierarchy·optional operation·Iterator state·typed toArray·fail-fast caveat로 확장했습니다.",
      "Ex02의 raw HashSet 사용은 generic invariance·method bounds·PECS/capture·erasure/bridge까지 확장했습니다.",
      "invariance·wildcard add·generic array·erasure clash·static T를 OpenJDK21 compiler diagnostic negative contracts로 고정했습니다.",
      "raw List와 non-reifiable varargs는 compile-success warning cases로 격리해 heap pollution과 @SafeVarargs 책임을 설명했습니다.",
      "Ex04/Ex07 equality 부재를 equals 다섯 법칙·equal⇒same hash·collision·mutable-key failure·record value key로 확장했습니다.",
      "HashSet·LinkedHashSet·TreeSet을 membership/order/comparison requirements로 선택하고 TreeSet compare0·tie-break·null 정책을 검증했습니다.",
      "Set.of/copyOf의 duplicate/null/unmodifiable/snapshot과 raw order 비보장을 defensive ownership 경계로 확장했습니다.",
      "stable LinkedHashSet dedup·Locale.ROOT canonical record·copy-before-unmodifiable·ConcurrentHashMap.newKeySet을 실무 pipeline으로 연결했습니다.",
      "모든 public Java examples는 isolated temp classes에서 -encoding UTF-8 --release21 -proc:none -Xlint:all warning0와 exact output을 요구합니다.",
      "원본 PowerShell audit는 launcher state snapshot 뒤 outer try 안에서 OS temp의 공백 포함 GUID direct child를 생성하며 normalized-parent cleanup guard와 post-delete assertion을 사용합니다.",
      "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS는 mutation 전에 존재·값을 snapshot하고 outer try 안에서 제거하며 모든 ProcessStartInfo child에서도 제거합니다.",
      "outer finally는 temp cleanup failure를 포착해도 네 environment states를 각각 끝까지 복원·재검증하고 run·cleanup·all restore errors를 aggregate exception에 보존합니다.",
      "child JVM은 ArgumentList, UTF-8 redirects, Start 직후 dual async drain,10초 timeout·tree kill·5초 termination grace·finally Dispose를 사용합니다.",
      "baseline과 hostile four-launcher environment에서 다섯 summary lines의 byte equality와 environment restoration을 요구합니다.",
      "public target은 original candidate-derived exact·normalized·token leak0, email/phone/credential/absolute path0, .class/audit residue0을 요구합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
