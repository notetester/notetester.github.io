import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-06-map"],
  slug: "core-06-map",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 26,
  title: "Map·HashMap·정렬 Map·동시성",
  subtitle: "key→value association을 equality·null·iteration·ownership·atomic update 계약으로 읽고, domain index와 cache까지 안전하게 설계합니다.",
  level: "고급",
  estimatedMinutes: 960,
  coreQuestion: "key로 value를 찾는다는 단순한 표면 아래에서 equality, 부재, 순서, mutation, 동시성 요구가 달라질 때 어떤 Map 구현과 API를 선택해야 할까요?",
  summary: "javastudy2 class10의 package7 전체와 Map direct3(Ex04_Map·Ex05_Map·Ex06_Map)을 OpenJDK21에서 별도 compile했습니다. package7/direct3 모두 warning0이고 public main은7/3입니다. Ex04는 put overwrite, duplicate values, sparse integer key의 null lookup, keySet·values·entrySet을25 logical lines로 보여 주며 HashMap 순서는 계약이 아니므로 map/pair/value 부분을 multiset으로 검증했습니다. Ex05는 문자열 key profile을6 lines로, Ex06은 한국→서울→n과 unknown→invalid q→일본→도쿄→n interactive paths를 exact prompt/output으로 재현했습니다. 이 원본에서 Map의 unique-key association, put return·null ambiguity·containsKey, hashCode/equals와 mutable key, backed views와 safe iteration, HashMap·LinkedHashMap·TreeMap·EnumMap 선택, immutable factory와 defensive copy, compute/merge semantics, collector duplicate policy, bounded cache, ConcurrentHashMap atomic compound operations, record key/domain index, property·performance·abuse testing까지 확장합니다.",
  objectives: [
    "Map의 unique key·duplicate value·put/get/remove return과 null/absence 계약을 예측한다.",
    "HashMap lookup이 equals/hashCode 계약에 의존함을 설명하고 mutable key 손상을 재현·예방한다.",
    "keySet·values·entrySet이 backed views임을 이해하고 entrySet iteration과 iterator mutation을 안전하게 사용한다.",
    "HashMap·LinkedHashMap·TreeMap·EnumMap을 encounter order, comparator, key domain과 비용으로 선택한다.",
    "Map.of/copyOf·unmodifiable view·defensive mutable copy의 alias와 mutation ownership을 구분한다.",
    "compute·merge·collector duplicate resolution과 cache loader의 null/failure/reentrancy 정책을 설계한다.",
    "ConcurrentHashMap의 per-key atomic operations와 compound invariant 한계를 적용하고 domain index를 검증한다.",
  ],
  prerequisites: [
    { title: "Set·제네릭·동등성", reason: "Map key uniqueness는 Set과 같은 equality/hashCode 기반이고 generic key/value invariance를 알아야 type-safe API를 읽을 수 있습니다.", sessionSlug: "core-04-set-generics" },
    { title: "List·Queue·Iterator", reason: "Map views의 iteration·fail-fast·snapshot 선택과 collection ownership을 이해하려면 Iterator와 mutable/unmodifiable 경계를 먼저 알아야 합니다.", sessionSlug: "core-05-list-stack-queue" },
  ],
  keywords: ["Map", "HashMap", "Map.Entry", "keySet", "values", "entrySet", "equals", "hashCode", "mutable key", "containsKey", "LinkedHashMap", "TreeMap", "NavigableMap", "EnumMap", "Map.of", "Map.copyOf", "computeIfAbsent", "merge", "Collectors.toMap", "duplicate key", "cache", "ConcurrentMap", "ConcurrentHashMap", "atomic compound operation", "domain index", "record key", "property test", "JMH"],
  chapters: [
    {
      id: "class10-package7-direct3-map-audit",
      title: "class10 package7·Map direct3을 warning0 compile하고 unordered 부분은 multiset, interactive 부분은 exact로 감사합니다",
      lead: "현재 HashMap 출력 순서가 우연히 숫자·문자 순으로 보여도 specification이 보장하지 않으므로 pair/value 내용과 multiplicity만 고정합니다.",
      explanations: [
        "class10 package에는 Ex01_Stack·Ex02_ArrayList·Ex03_LinkedList·Ex04_Map·Ex05_Map·Ex06_Map·Test의7 files가 있고 모두 public main입니다. Map direct3은 다른 source type에 의존하지 않아 별도 output directory에서 독립 compile할 수 있습니다.",
        "두 compile은 UTF-8, --release21, -proc:none, -g:source,lines, -Xlint:all, -XDrawDiagnostics를 적용하고 exit0과 compiler captured output0을 동시에 요구합니다. warning을 stderr text 일부로만 검색하지 않습니다.",
        "Ex04의 첫 map은0~3 네 pair이고 key2 put이 일본을 태국으로 덮어씁니다. value 한국은 key0·4·10에 중복될 수 있습니다. sparse integer key를 size 기반0~5 loop로 조회해 마지막에 null이 나오는 것은 Map을 배열처럼 순회하면 안 된다는 원본 증거입니다.",
        "Ex04 raw25 lines 중 map toString2, keySet pairs6, values6, entrySet pairs6은 encounter order를 버리고 multisets로 비교합니다. blank lines와 get loop, separator는 위치·값이 결정적이므로 exact로 검사해 normalization이 누락을 숨기지 않게 합니다.",
        "Ex05는 이름/나이 direct lookup2를 exact로 확인하고 profile pairs4는 unordered multiset으로 확인합니다. key/value 전체 내용과 multiplicity를 보존하면서 HashMap 내부 순서만 golden에서 제거합니다.",
        "Ex06은 한국→n path의 prompt/result와 unknown 프랑스→잘못된 q→y→일본→n path를 trailing prompt까지 exact로 비교합니다. 입력 종료를 닫힌 stdin으로 주고 timeout10초·tree kill·grace5초를 두어 interactive hang을 bounded failure로 바꿉니다.",
        "Ex01~Ex03·Test companions도 fresh JVM exit0·stderr0와 output line counts35/22/14/1로 package health를 확인하지만 이 세션에서 List/Deque 내용을 다시 Map 근거로 사용하지 않습니다.",
        "baseline과 hostile launcher option4 modes는 child ProcessStartInfo.Environment에서 옵션을 제거한 뒤 같은 summary를 내야 합니다. parent 환경은 변수마다 독립 복원·검증하고 temp root도 별도 cleanup하며 body/cleanup errors를 보존합니다.",
      ],
      concepts: [
        { term: "normalized golden", definition: "API가 보장하지 않는 순서는 제거하되 pair·multiplicity·결정적 위치와 failure를 보존한 기대 결과입니다.", detail: ["HashMap iteration에는 multiset을 씁니다.", "interactive prompts는 exact로 둡니다."] },
        { term: "direct scope", definition: "세션의 핵심 원본만 독립 compile/run해 package companion과 분리한 검증 범위입니다.", detail: ["Ex04~Ex06 세 files입니다.", "package7 health와 따로 보고합니다."] },
        { term: "launcher isolation", definition: "JDK_JAVAC_OPTIONS 등 parent 옵션이 compiler/runtime stderr와 behavior를 바꾸지 못하게 child environment에서 제거하는 절차입니다.", detail: ["네 변수를 다룹니다.", "parent 존재·값을 복원합니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core06-audit",
        title: "Map contents·interactive prompts·package health를 baseline/hostile 두 mode에서 재현합니다",
        language: "powershell",
        filename: "verify-original-core06.ps1",
        purpose: "원본 HashMap order를 과잉 고정하지 않으면서 direct3의 모든 출력 의미와 process/resource cleanup을 검증합니다.",
        code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference = 'Stop'
$optionNames = @('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved = @{}
foreach ($name in $optionNames) {
  $item = Get-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
  $saved[$name] = @{ Exists = $null -ne $item; Value = if ($item) { $item.Value } else { $null } }
}
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core06 audit " + [Guid]::NewGuid().ToString('N'))
$ownsRoot = $false
$bodyError = $null
$nl = [string][char]10

function Normalize([string]$text) { return $text.Replace(([string][char]13 + [char]10), [string][char]10) }
function Invoke-Child([string]$file, [string[]]$arguments, [string]$cwd, [string]$stdin = '') {
  $start = [Diagnostics.ProcessStartInfo]::new()
  $start.FileName = $file
  $start.WorkingDirectory = $cwd
  $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.StandardOutputEncoding = [Text.UTF8Encoding]::new($false)
  $start.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
  foreach ($arg in $arguments) { [void]$start.ArgumentList.Add($arg) }
  foreach ($name in $optionNames) { [void]$start.Environment.Remove($name) }
  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $start
  try {
    if (-not $process.Start()) { throw 'process start failed' }
    $outTask = $process.StandardOutput.ReadToEndAsync()
    $errTask = $process.StandardError.ReadToEndAsync()
    if ($stdin.Length -gt 0) { $process.StandardInput.Write($stdin) }
    $process.StandardInput.Close()
    if (-not $process.WaitForExit(10000)) {
      $process.Kill($true)
      if (-not $process.WaitForExit(5000)) { throw 'termination grace exceeded' }
      [void]$outTask.GetAwaiter().GetResult(); [void]$errTask.GetAwaiter().GetResult()
      throw 'child timeout'
    }
    return @{ Exit = $process.ExitCode; Out = (Normalize $outTask.GetAwaiter().GetResult()); Err = (Normalize $errTask.GetAwaiter().GetResult()) }
  } finally { $process.Dispose() }
}
function Compile([IO.FileInfo[]]$files, [string]$classes) {
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null
  $args = @('-encoding','UTF-8','--release','21','-proc:none','-g:source,lines','-Xlint:all','-XDrawDiagnostics','-d',$classes)
  $args += @($files.FullName)
  $result = Invoke-Child 'javac' $args $root
  if ($result.Exit -ne 0 -or $result.Out.Length -ne 0 -or $result.Err.Length -ne 0) { throw 'compile failed or warned' }
}
function Run([string]$classes, [string]$main, [string]$stdin = '') {
  return Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,("com.java.class10." + $main)) $root $stdin
}
function Canon([string[]]$values) { return (@($values | Sort-Object -CaseSensitive) -join '|') }
function Assert-Multiset([string[]]$actual, [string[]]$expected, [string]$label) {
  if ((Canon $actual) -cne (Canon $expected)) { throw "$label multiset drift: $(Canon $actual)" }
}
function Equals-Pairs([string]$line) {
  return @([regex]::Matches($line, '(?<key>\d+)=(?<value>[^,}]+)') | ForEach-Object { $_.Groups['key'].Value + '=' + $_.Groups['value'].Value.Trim() })
}
function Colon-Pairs([string[]]$lines) {
  return @($lines | ForEach-Object { if ($_ -match '^\s*(?<key>[^:]+?)\s*:\s*(?<value>.+?)\s*$') { $Matches['key'].Trim() + '=' + $Matches['value'].Trim() } else { throw "invalid pair line: $_" } })
}
function Assert-Process($result, [string]$label) {
  if ($result.Exit -ne 0 -or $result.Err.Length -ne 0) { throw "$label process drift" }
}
function Audit([string]$mode, [string]$classDir) {
  if ($mode -eq 'hostile') {
    $env:JDK_JAVAC_OPTIONS = '-J-Dcore06.audit=javac'
    $env:JDK_JAVA_OPTIONS = '-Dcore06.audit=java'
    $env:JAVA_TOOL_OPTIONS = '-Dcore06.audit=tool'
    $env:_JAVA_OPTIONS = '-Dcore06.audit=legacy'
  } else { foreach ($name in $optionNames) { Remove-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue } }
  $all = @(Get-ChildItem -LiteralPath $classDir -Filter '*.java' | Sort-Object Name)
  $direct = @('Ex04_Map.java','Ex05_Map.java','Ex06_Map.java') | ForEach-Object { Get-Item -LiteralPath (Join-Path $classDir $_) }
  if ($all.Count -ne 7 -or @($direct).Count -ne 3) { throw 'source inventory drift' }
  $packageClasses = Join-Path $root ("package-" + $mode)
  $directClasses = Join-Path $root ("direct-" + $mode)
  Compile $all $packageClasses; Compile @($direct) $directClasses
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_.FullName) -match $mainPattern }).Count
  $directMains = @($direct | Where-Object { (Get-Content -Raw -LiteralPath $_.FullName) -match $mainPattern }).Count
  if ($packageMains -ne 7 -or $directMains -ne 3) { throw 'main role drift' }

  $ex04 = Run $directClasses 'Ex04_Map'; $ex05 = Run $directClasses 'Ex05_Map'
  $known = Run $directClasses 'Ex06_Map' ("한국" + $nl + "n" + $nl)
  $unknown = Run $directClasses 'Ex06_Map' ("프랑스" + $nl + "q" + $nl + "y" + $nl + "일본" + $nl + "n" + $nl)
  foreach ($item in @(@($ex04,'Ex04'),@($ex05,'Ex05'),@($known,'Ex06-known'),@($unknown,'Ex06-unknown'))) { Assert-Process $item[0] $item[1] }
  $lines04 = @($ex04.Out.TrimEnd([char]10).Split([char]10))
  if ($lines04.Count -ne 25 -or $lines04[2] -cne '태국' -or $lines04[3].Length -ne 0 -or $lines04[10].Length -ne 0 -or $lines04[18] -cne '===============') { throw 'Ex04 fixed lines drift' }
  Assert-Multiset (Equals-Pairs $lines04[0]) @('0=한국','1=중국','2=일본','3=미국') 'Ex04 first map'
  Assert-Multiset (Equals-Pairs $lines04[1]) @('0=한국','1=중국','2=태국','3=미국','4=한국') 'Ex04 second map'
  if (($lines04[4..9] -join '|') -cne '한국|중국|태국|미국|한국|null') { throw 'Ex04 sparse lookup drift' }
  $expectedPairs = @('0=한국','1=중국','2=태국','3=미국','4=한국','10=한국')
  Assert-Multiset (Colon-Pairs $lines04[11..16]) $expectedPairs 'Ex04 keySet'
  $values = @($lines04[17].Trim('[',']').Split(',') | ForEach-Object Trim)
  Assert-Multiset $values @('한국','한국','한국','중국','태국','미국') 'Ex04 values'
  Assert-Multiset (Colon-Pairs $lines04[19..24]) $expectedPairs 'Ex04 entrySet'

  $lines05 = @($ex05.Out.TrimEnd([char]10).Split([char]10))
  if ($lines05.Count -ne 6 -or $lines05[0] -cne '고길동' -or $lines05[1] -cne '24') { throw 'Ex05 direct lookup drift' }
  Assert-Multiset (Colon-Pairs $lines05[2..5]) @('이름=고길동','나이=24','주소=서울시 방학동','취미=운동') 'Ex05 profile'
  $knownExpected = '나라를 입력하세요. >> 서울' + $nl + '계속하시겠습니까?(y/n) >> '
  $unknownExpected = '나라를 입력하세요. >> 데이터에 없는 나라입니다.' + $nl + '계속하시겠습니까?(y/n) >> y 혹은 n으로만 입력하세요.' + $nl + '계속하시겠습니까?(y/n) >> 나라를 입력하세요. >> 도쿄' + $nl + '계속하시겠습니까?(y/n) >> '
  if ($known.Out -cne $knownExpected -or $unknown.Out -cne $unknownExpected) { throw 'Ex06 interactive drift' }

  $counts = [Collections.Generic.List[int]]::new()
  foreach ($main in @('Ex01_Stack','Ex02_ArrayList','Ex03_LinkedList','Test')) {
    $result = Run $packageClasses $main; Assert-Process $result $main
    $counts.Add([regex]::Matches($result.Out, [regex]::Escape($nl)).Count)
  }
  if (($counts -join '|') -cne '35|22|14|1') { throw 'companion line-count drift' }
  return "package=7|direct=3|mains=$packageMains,$directMains|compiler=0;Ex04=lines25|maps4,5|pairs6|values6|sparseNull=True;Ex05=lines6|pairs4;Ex06=known2|unknown4|continuePrompts1,3;companions=$($counts -join '|')"
}

try {
  if (Test-Path -LiteralPath $root) { throw 'unexpected temp collision' }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $ownsRoot = $true
  $classDir = Join-Path ([IO.Path]::GetFullPath($SourceRoot)) 'src/com/java/class10'
  $baseline = Audit 'baseline' $classDir
  $hostile = Audit 'hostile' $classDir
  if ($baseline -cne $hostile) { throw 'baseline hostile drift' }
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline"
  'orderPolicy=map/pairs/values:multiset;lookup/prompts:exact|launcherOptions=4'
} catch { $bodyError = $_.Exception } finally {
  $finalErrors = [Collections.Generic.List[Exception]]::new()
  foreach ($name in $optionNames) {
    try {
      if ($saved[$name].Exists) {
        Set-Item -LiteralPath ("Env:" + $name) -Value $saved[$name].Value -ErrorAction Stop
        $restored = Get-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
        if ($null -eq $restored -or $restored.Value -cne $saved[$name].Value) { throw "launcher restore verification failed: $name" }
      } else {
        Remove-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
        if (Test-Path -LiteralPath ("Env:" + $name)) { throw "launcher absence restore failed: $name" }
      }
    } catch { $finalErrors.Add($_.Exception) }
  }
  try {
    if ($ownsRoot) {
      $resolved = [IO.Path]::GetFullPath($root)
      if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw 'unsafe cleanup' }
      if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
      if (Test-Path -LiteralPath $resolved) { throw 'cleanup failed' }
    }
  } catch { $finalErrors.Add($_.Exception) }
  if ($null -ne $bodyError) { $finalErrors.Insert(0, $bodyError) }
  if ($finalErrors.Count -eq 1) { [Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw() }
  if ($finalErrors.Count -gt 1) { throw [AggregateException]::new('audit and cleanup failures', $finalErrors.ToArray()) }
}`,
        walkthrough: [
          { lines: "1-15", explanation: "source root, launcher option4의 존재·값, 공백 temp direct-child와 ownership/body error 상태를 mutation 전에 준비합니다." },
          { lines: "16-58", explanation: "ArgumentList·UTF-8 redirected streams·closed stdin·async drain·10초 timeout·tree kill·5초 grace·Dispose를 가진 child compile/run helper를 정의합니다." },
          { lines: "59-77", explanation: "locale/order에 독립적인 multiset canonicalizer와 equals/colon pair parser, process assertion을 정의합니다." },
          { lines: "78-99", explanation: "baseline/hostile options, package7/direct3 warning0 compile과 main7/3 역할을 검증합니다." },
          { lines: "101-124", explanation: "Ex04의 fixed positions와 unordered maps/pairs/values 전체를 분리 검증하고 Ex05 direct lookup/pairs를 확인합니다." },
          { lines: "125-141", explanation: "Ex06 두 interactive paths를 trailing prompt까지 exact로 비교하고 companions line counts와 stable summary를 만듭니다." },
          { lines: "117-152", explanation: "두 mode 동일성을 출력한 뒤 환경 변수별 복원·검증과 temp cleanup을 독립 실행하고 body·cleanup failures를 보존합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy2/classstudy source root", "baseline+hostile launcher modes", "timeout10s+grace5s"], command: "pwsh -NoProfile -File verify-original-core06.ps1 -SourceRoot <classstudy-root>" },
        output: { value: "spacePath=True,modes=2|same=True,package=7|direct=3|mains=7,3|compiler=0;Ex04=lines25|maps4,5|pairs6|values6|sparseNull=True;Ex05=lines6|pairs4;Ex06=known2|unknown4|continuePrompts1,3;companions=35|22|14|1\norderPolicy=map/pairs/values:multiset;lookup/prompts:exact|launcherOptions=4", explanation: ["package/direct compile은 두 mode 모두 warning0입니다.", "Ex04/05의 모든 association은 보존하되 HashMap order만 제거합니다.", "Ex06 prompts와 deterministic lookup은 exact입니다."] },
        experiments: [
          { change: "Ex04 normalized pair를 line sort만 하고 key/value parsing을 제거합니다.", prediction: "Map.toString order나 whitespace 변화가 false failure를 만들 수 있습니다.", result: "association parser가 key/value 의미를 직접 검증합니다." },
          { change: "child environment에서 JAVA_TOOL_OPTIONS 제거를 생략합니다.", prediction: "hostile stderr에 launcher banner가 생겨 process assertion이 실패합니다.", result: "harness environment도 reproducibility contract입니다." },
          { change: "Ex06 stdin 마지막 n을 제거합니다.", prediction: "closed stdin에서 Scanner NoSuchElementException으로 exit가 nonzero가 됩니다.", result: "interactive fixture는 종료 경로까지 제공해야 합니다." },
        ],
        sourceRefs: ["java-class10-ex01", "java-class10-ex02", "java-class10-ex03", "java-class10-ex04", "java-class10-ex05", "java-class10-ex06", "java-class10-test", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "java-hashmap-api", "java-map-api"],
      }],
      diagnostics: [
        { symptom: "JDK를 바꾸자 Ex04/05 golden이 association은 같은데 실패한다.", likelyCause: "HashMap toString/keySet/entrySet iteration order를 exact string으로 고정했습니다.", checks: ["API가 order를 보장하는지 확인합니다.", "pair와 multiplicity가 같은지 비교합니다.", "LinkedHashMap 요구가 실제 domain에 있는지 묻습니다."], fix: "HashMap이면 pair/value multiset oracle을 쓰고 order가 요구되면 구현체 계약을 LinkedHashMap/TreeMap으로 바꿉니다.", prevention: "각 collection golden에 ordered/unordered 근거를 sourceRefs와 함께 기록합니다." },
        { symptom: "interactive 원본 감사가 끝나지 않는다.", likelyCause: "y/n 종료 입력이 없거나 stdin을 닫지 않았고 child timeout도 없습니다.", checks: ["전체 prompt state machine 입력을 나열합니다.", "StandardInput.Close 호출을 봅니다.", "timeout/kill/grace를 확인합니다."], fix: "종료 token까지 쓰고 stdin을 닫으며 bounded process lifecycle을 적용합니다.", prevention: "known·unknown·invalid·EOF paths를 독립 fixtures로 둡니다." },
      ],
      expertNotes: ["unordered normalization은 assert를 약하게 만드는 작업이 아닙니다. key/value pair와 multiplicity, 결정적 blank/prompt/lookup을 모두 보존하고 오직 specification에 없는 encounter order만 제거합니다.", "source audit는 원본을 현대화하는 단계가 아닙니다. 오타인 어타와와 sparse integer lookup도 먼저 사실대로 보존한 뒤 개선안은 별도 chapter에서 구분합니다."],
    },
  ],
  lab: {
    title: "중복 정책·원자 갱신·소유권이 명시된 상품 catalog와 bounded 조회 cache",
    scenario: "CSV-like 상품 rows를 typed key로 검증해 catalog를 만들고, duplicate SKU·alias·정렬 export·조회 횟수·cache eviction을 결정적 결과와 concurrent test로 검증합니다.",
    setup: ["OpenJDK21 warning0 isolated runner를 준비합니다.", "ProductKey record, Product immutable record, Catalog interface와 fake loader를 만듭니다.", "입력 rows에는 정상·중복·빈 값·대소문자·unknown lookup fixtures를 포함합니다."],
    steps: ["key normalization과 validation을 constructor boundary에 둡니다.", "duplicate key는 keep-first/keep-last/reject/merge 중 reject를 기본 선택하고 row context를 보존합니다.", "mutable build map에서 immutable snapshot을 publication합니다.", "insertion-order UI와 sorted export를 다른 views/maps로 만듭니다.", "lookup cache는 max entries와 eviction metric을 명시합니다.", "load failure/null은 cache하지 않는 정책을 test합니다.", "ConcurrentHashMap merge로 per-SKU 조회 횟수를 원자적으로 누적합니다.", "success·duplicate·unknown·eviction·parallel total·post-publication mutation cases를 검증합니다."],
    expectedResult: ["duplicate SKU가 조용히 덮어써지지 않습니다.", "published catalog는 builder alias mutation에 영향받지 않습니다.", "UI order와 export key order가 각각 명시된 계약을 따릅니다.", "parallel 조회 count가 exact이고 cache size가 bound를 넘지 않습니다.", "failure에는 safe SKU/row 정보와 cause가 남습니다."],
    cleanup: ["test executor를 finally에서 종료합니다.", "temporary fixtures는 OS temp direct-child ownership을 확인한 뒤 제거합니다."],
    extensions: ["TTL/refresh-ahead와 clock injection을 추가합니다.", "multi-process cache consistency와 stampede control을 설계합니다.", "inventory decrement처럼 여러 keys invariant가 필요한 transaction boundary를 분리합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "put/get/remove/containsKey와 null value를 구분하는 Map 상태 추적기를 만듭니다.", requirements: ["각 operation의 이전 return을 출력합니다.", "absent와 present-null을 containsKey로 구분합니다.", "entrySet으로 deterministic normalized output을 만듭니다.", "warning0 exact test를 작성합니다."], hints: ["get만으로 두 상태를 구분할 수 없습니다.", "HashMap order를 golden에 고정하지 않습니다."], expectedOutcome: "key association의 before/after와 null ambiguity를 설명하는 재현 가능한 예제가 됩니다.", solutionOutline: ["HashMap에 null value를 넣습니다.", "lookup tuple을 value+containsKey로 만듭니다.", "pairs를 key 기준 별도 sort해 출력합니다."] },
    { difficulty: "응용", prompt: "중복 email rows를 정책별로 수집하는 importer를 구현합니다.", requirements: ["reject·keep-first·keep-last·merge 네 정책을 enum으로 표현합니다.", "Collectors.toMap merge function을 정책에 연결합니다.", "duplicate count와 conflicting rows를 보존합니다.", "empty·single·duplicate-equal·duplicate-conflict를 테스트합니다."], hints: ["조용한 overwrite를 기본으로 두지 않습니다.", "TreeMap supplier는 output order 요구가 있을 때만 선택합니다."], expectedOutcome: "중복 처리가 incidental behavior가 아니라 명시적 domain contract가 됩니다.", solutionOutline: ["row를 normalize합니다.", "merge function에서 두 values와 context를 비교합니다.", "policy별 expected map/error를 검증합니다."] },
    { difficulty: "설계", prompt: "동시 사용자 session registry와 bounded cache를 설계합니다.", requirements: ["stable typed key와 immutable value를 사용합니다.", "computeIfAbsent loader failure/null/reentrancy 정책을 정의합니다.", "per-key atomic update와 multi-key invariant를 구분합니다.", "size/TTL/eviction·stampede·shutdown metrics를 문서화합니다.", "abuse cardinality와 secret-containing key logging을 방지합니다."], hints: ["ConcurrentHashMap은 eviction cache 전체 해답이 아닙니다.", "검증된 cache library 선택 기준도 제시합니다."], expectedOutcome: "동시성·메모리 bound·failure·observability가 함께 있는 운영 가능한 Map 기반 component가 됩니다.", solutionOutline: ["registry와 cache responsibilities를 분리합니다.", "atomic map APIs를 per-key transition에 사용합니다.", "bounded policy와 failure tests를 추가합니다."] },
  ],
  reviewQuestions: [
    { question: "Map에서 key는 중복될 수 있나요?", answer: "동일성 계약상 같은 key association은 하나이며 put하면 이전 value를 교체합니다." },
    { question: "value는 중복될 수 있나요?", answer: "예. 서로 다른 keys가 같은 value를 가질 수 있습니다." },
    { question: "get이 null이면 key가 없다는 뜻인가요?", answer: "null value를 허용하는 Map에서는 absent와 present-null이 모두 null이므로 containsKey가 필요합니다." },
    { question: "HashMap iteration order를 저장 형식으로 써도 되나요?", answer: "안 됩니다. order 계약이 필요하면 LinkedHashMap·TreeMap 또는 명시적 sort를 선택합니다." },
    { question: "왜 entrySet iteration이 keySet+get보다 일반적으로 낫나요?", answer: "key와 value를 함께 제공해 추가 lookup을 피하고 association 의도를 직접 표현합니다." },
    { question: "mutable object를 HashMap key로 써도 되나요?", answer: "map에 있는 동안 equals/hashCode에 쓰는 상태가 바뀌면 lookup/remove가 실패할 수 있어 피합니다." },
    { question: "TreeMap key uniqueness는 무엇으로 정해지나요?", answer: "ordering comparator가0을 반환하는 관계로 정해져 equals와 불일치하면 예상치 못한 교체가 생길 수 있습니다." },
    { question: "Map.copyOf는 mutable copy인가요?", answer: "아닙니다. unmodifiable snapshot이며 null key/value도 허용하지 않습니다." },
    { question: "computeIfAbsent mapping function이 null을 반환하면 무엇이 저장되나요?", answer: "mapping이 기록되지 않습니다. null을 failure sentinel로 조용히 쓰지 않도록 정책을 명시합니다." },
    { question: "ConcurrentHashMap이면 모든 multi-step logic이 atomic한가요?", answer: "아닙니다. 제공하는 per-key atomic APIs 범위만 보장하며 여러 keys invariant는 별도 synchronization/transaction이 필요합니다." },
  ],
  completionChecklist: [
    "class10 package7·direct3을 별도 warning0 compile했다.",
    "Ex04 maps·pairs·values는 multisets로, fixed positions는 exact로 검증했다.",
    "Ex05 direct lookup과 unordered profile pairs를 모두 검증했다.",
    "Ex06 known·unknown·invalid·stop prompt paths를 exact로 재현했다.",
    "companions4의 exit0·stderr0·line counts를 확인했다.",
    "launcher option4 격리와 parent 존재·값 복원을 검증했다.",
    "async drain·closed stdin·timeout·tree kill·grace·Dispose를 적용했다.",
    "temp root ownership과 parent boundary를 확인한 뒤 cleanup했다.",
    "HashMap order를 API contract로 설명하지 않았다.",
    "get null과 key absence를 containsKey로 구분했다.",
    "모든 positive Java examples를 JDK21 -Xlint:all warning0로 검증한다.",
    "모든 code output을 exact stable stdout과 대조한다.",
  ],
  nextSessions: ["core-07-lambda"],
  sources: [
    { id: "java-class10-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class10/Ex01_Stack.java", usedFor: ["package companion health", "35 output lines"], evidence: "package7 compile과 fresh JVM line-count health에 사용했습니다." },
    { id: "java-class10-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class10/Ex02_ArrayList.java", usedFor: ["package companion health", "22 output lines"], evidence: "package7 compile과 fresh JVM line-count health에 사용했습니다." },
    { id: "java-class10-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class10/Ex03_LinkedList.java", usedFor: ["package companion health", "14 output lines"], evidence: "package7 compile과 fresh JVM line-count health에 사용했습니다." },
    { id: "java-class10-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class10/Ex04_Map.java", usedFor: ["put overwrite", "sparse lookup", "keySet values entrySet"], evidence: "raw25 logical lines를 fixed positions와 unordered associations로 전부 검증했습니다." },
    { id: "java-class10-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class10/Ex05_Map.java", usedFor: ["string-key profile", "direct lookup", "unordered pairs"], evidence: "exact lookup2와 pair multiset4를 확인했습니다." },
    { id: "java-class10-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class10/Ex06_Map.java", usedFor: ["getOrDefault", "interactive lookup", "loop labels"], evidence: "known과 unknown-invalid-recovery paths를 trailing prompt까지 확인했습니다." },
    { id: "java-class10-test", repository: "javastudy2 classstudy", path: "src/com/java/class10/Test.java", usedFor: ["package companion health", "generic method compile"], evidence: "blank1 output line과 package compile health에 사용했습니다." },
    { id: "jdk21-javac", repository: "Java SE 21 tools", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-proc:none", "-Xlint:all", "-XDrawDiagnostics"], evidence: "모든 positive compile의 warning0 contract입니다." },
    { id: "powershell-environment", repository: "Microsoft PowerShell docs", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "per-variable restore"], evidence: "process environment 격리와 복원 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected streams", "working directory"], evidence: "shell quoting 없는 child 구성 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child launcher isolation"], evidence: "child-specific environment removal 근거입니다." },
    { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "grace", "Dispose"], evidence: "bounded child lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["stdout drain", "stderr drain"], evidence: "redirected pipe deadlock 방지 근거입니다." },
    { id: "java-map-api", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["association contract", "default methods", "factory methods", "views"], evidence: "Map 전체 public contract의 primary API입니다." },
    { id: "java-hashmap-api", repository: "Java SE 21 API", path: "java.util.HashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html", usedFor: ["hash map", "null support", "iteration non-order"], evidence: "HashMap 선택과 caveat 근거입니다." },
    { id: "java-object-api", repository: "Java SE 21 API", path: "java.lang.Object", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["equals", "hashCode contract"], evidence: "key equality/hash consistency의 근거입니다." },
    { id: "java-objects-api", repository: "Java SE 21 API", path: "java.util.Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["requireNonNull", "record validation"], evidence: "boundary null validation 근거입니다." },
    { id: "java-map-entry-api", repository: "Java SE 21 API", path: "java.util.Map.Entry", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.Entry.html", usedFor: ["entry iteration", "entry mutation", "comparator helpers"], evidence: "key/value association view contract입니다." },
    { id: "java-collection-api", repository: "Java SE 21 API", path: "java.util.Collection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collection.html", usedFor: ["values view", "bulk removal"], evidence: "Map values backed Collection 근거입니다." },
    { id: "java-iterator-api", repository: "Java SE 21 API", path: "java.util.Iterator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html", usedFor: ["safe remove", "iteration"], evidence: "iterator mutation protocol 근거입니다." },
    { id: "java-linkedhashmap-api", repository: "Java SE 21 API", path: "java.util.LinkedHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html", usedFor: ["insertion order", "access order", "cache building block"], evidence: "encounter-order Map 선택 근거입니다." },
    { id: "java-treemap-api", repository: "Java SE 21 API", path: "java.util.TreeMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html", usedFor: ["sorted keys", "logarithmic operations"], evidence: "ordered tree map 근거입니다." },
    { id: "java-navigablemap-api", repository: "Java SE 21 API", path: "java.util.NavigableMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/NavigableMap.html", usedFor: ["floor ceiling", "range views"], evidence: "navigation/range query contract입니다." },
    { id: "java-comparator-api", repository: "Java SE 21 API", path: "java.util.Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["TreeMap equality", "total order"], evidence: "comparator consistency and ordering 근거입니다." },
    { id: "java-enummap-api", repository: "Java SE 21 API", path: "java.util.EnumMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/EnumMap.html", usedFor: ["enum key domain", "natural enum order"], evidence: "closed enum key space Map 근거입니다." },
    { id: "java-collections-api", repository: "Java SE 21 API", path: "java.util.Collections", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html", usedFor: ["unmodifiableMap", "synchronized wrapper"], evidence: "view/wrapper ownership 근거입니다." },
    { id: "java-uoe-api", repository: "Java SE 21 API", path: "UnsupportedOperationException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/UnsupportedOperationException.html", usedFor: ["optional mutation", "immutable factory failure"], evidence: "unmodifiable mutation failure contract입니다." },
    { id: "java-collectors-api", repository: "Java SE 21 API", path: "java.util.stream.Collectors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html", usedFor: ["toMap duplicate merge", "groupingBy", "map supplier"], evidence: "stream-to-map reduction contract입니다." },
    { id: "java-stream-api", repository: "Java SE 21 API", path: "java.util.stream.Stream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["collector source", "non-interference"], evidence: "stream source/reduction boundary 근거입니다." },
    { id: "java-concurrentmap-api", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentMap.html", usedFor: ["atomic methods", "replace/remove condition"], evidence: "concurrent per-key operation contract입니다." },
    { id: "java-concurrenthashmap-api", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html", usedFor: ["concurrent registry", "null prohibition", "weakly consistent views"], evidence: "concurrent hash implementation 근거입니다." },
    { id: "jls-records", repository: "JLS SE 21", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["typed immutable key", "value semantics"], evidence: "record key declaration contract입니다." },
    { id: "jmh-project", repository: "OpenJDK JMH", path: "JMH", publicUrl: "https://openjdk.org/projects/code-tools/jmh/", usedFor: ["map benchmark", "warmup/fork/result consumption"], evidence: "reliable microbenchmark harness 근거입니다." },
    { id: "openjdk-hashmap-source", repository: "OpenJDK 21", path: "java.util.HashMap source", publicUrl: "https://github.com/openjdk/jdk21u/blob/master/src/java.base/share/classes/java/util/HashMap.java", usedFor: ["implementation study", "capacity/bin caveat"], evidence: "implementation observations를 public API와 분리하는 보조 source입니다." },
  ],
  sourceCoverage: {
    filesRead: 7,
    filesUsed: 7,
    uncoveredNotes: [
      "class10 package7 전체를 읽고 package/direct Map scopes를 분리했습니다.",
      "Ex04 raw25와 Ex05 raw6의 unordered associations를 pair/value multisets로 전부 보존했습니다.",
      "Ex06 known과 unknown-invalid-recovery paths를 trailing prompts까지 exact 검증했습니다.",
      "Ex01~Ex03·Test는 package health line counts로만 사용해 Map 범위를 침범하지 않았습니다.",
      "baseline/hostile option4, async drain, closed stdin, timeout/tree kill/grace, Dispose, independent restore/cleanup을 적용했습니다.",
      "공개 source/code/output에는 local absolute path·credential·개인 연락처를 포함하지 않았습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const mapFoundationChapters: DetailedSession["chapters"] = [
  {
    id: "map-association-put-get-remove-null",
    title: "Map은 index 배열이 아니라 unique key에서 value로 가는 association이며 return value가 상태 전이를 설명합니다",
    lead: "put·get·remove의 반환값과 containsKey를 함께 읽으면 overwrite, 부재, present-null을 추측 없이 구분할 수 있습니다.",
    explanations: [
      "Map<K,V>는 각 key를 최대 하나의 value에 연결합니다. 같은 value는 여러 key에 연결될 수 있지만 같은 key를 다시 put하면 association 수가 늘지 않고 이전 value가 교체됩니다.",
      "put은 이전 value 또는 이전 association이 없으면 null을 반환합니다. null value를 허용하는 구현에서는 이전 값이 null인 association과 이전 key 부재가 같은 return이므로 put 전에 containsKey를 보거나 null을 금지한 domain wrapper를 사용합니다.",
      "get도 absent와 present-null 모두 null일 수 있습니다. getOrDefault는 key가 없을 때만 default를 반환하고 present-null에는 null을 반환하므로 default가 null ambiguity를 완전히 없애는 API는 아닙니다.",
      "remove(key)는 제거한 이전 value를 반환하고 remove(key,value)는 현재 association이 둘과 일치할 때만 boolean true로 제거합니다. optimistic conditional transition에는 후자가 의도를 더 정확히 표현합니다.",
      "size는 association 수이지 integer key의 최대값+1이 아닙니다. 원본처럼 keys0~4와10이 있을 때 size6을 이용해0~5 get을 반복하면 key10은 누락되고 key5 null이 생깁니다. 배열식 loop 대신 entrySet/keySet을 순회합니다.",
      "containsValue는 value equality를 전체 associations에서 찾는 operation이라 일반적으로 key lookup과 같은 비용 모델을 기대하지 않습니다. value→key 조회가 핵심이면 별도 역색인을 만들되 두 indexes의 consistency를 관리합니다.",
      "null 허용 여부는 구현마다 다릅니다. HashMap은 null key 하나와 null values를 허용하지만 Map.of/copyOf와 ConcurrentHashMap은 null을 거부하므로 public API에서 null 의미를 명시하고 구현 교체 가능성을 고려합니다.",
      "bulk putAll은 source의 associations를 순차 적용하는 의미지만 duplicate key conflict policy와 partial failure를 domain importer에 그대로 맡기지 않습니다. 입력을 먼저 validate하고 새 Map을 만들어 atomic publication합니다.",
    ],
    concepts: [
      { term: "association", definition: "하나의 key와 현재 value가 연결된 Map의 기본 단위입니다.", detail: ["key는 equality상 unique합니다.", "value는 중복될 수 있습니다."] },
      { term: "present-null", definition: "key가 실제로 존재하지만 연결된 value가 null인 상태입니다.", detail: ["get은 absent와 구분하지 못합니다.", "containsKey로 존재를 확인합니다."] },
      { term: "conditional remove", definition: "현재 key가 기대한 value에 연결돼 있을 때만 제거하는 remove(key,value) 전이입니다.", detail: ["stale observation 보호에 유용합니다.", "동시 Map에서는 원자 계약을 확인합니다."] },
    ],
    codeExamples: [{
      id: "java-map-core-contracts",
      title: "put 이전값·null ambiguity·conditional remove를 한 상태 흐름으로 확인합니다",
      language: "java",
      filename: "MapCoreContracts.java",
      purpose: "key presence와 value를 별도로 관찰하고 size를 key range로 오해하지 않는 기본 Map contract를 실행합니다.",
      code: String.raw`import java.util.HashMap;
import java.util.Map;

public class MapCoreContracts {
    static String lookup(Map<String, Integer> map, String key) {
        return "value=" + map.get(key) + ",present=" + map.containsKey(key);
    }

    public static void main(String[] args) {
        Map<String, Integer> scores = new HashMap<>();
        Integer first = scores.put("math", 10);
        Integer replaced = scores.put("math", 20);
        scores.put("pending", null);

        System.out.println("firstPrevious=" + first);
        System.out.println("replacedPrevious=" + replaced);
        System.out.println("absent=" + lookup(scores, "science"));
        System.out.println("presentNull=" + lookup(scores, "pending"));
        System.out.println("removeWrong=" + scores.remove("math", 10));
        System.out.println("removeRight=" + scores.remove("math", 20));
        System.out.println("size=" + scores.size());
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "lookup helper가 get value와 containsKey presence를 같은 observation에 담아 absent/present-null을 구분합니다." },
        { lines: "9-13", explanation: "첫 put, overwrite와 명시적 null association을 차례로 만듭니다." },
        { lines: "15-18", explanation: "put의 이전 value와 두 null lookup 상태가 서로 다른 presence를 가짐을 출력합니다." },
        { lines: "19-21", explanation: "stale value10 제거는 실패하고 current20 제거만 성공해 pending association 하나가 남습니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("MapCoreContracts.java", "MapCoreContracts") },
      output: { value: "firstPrevious=null\nreplacedPrevious=10\nabsent=value=null,present=false\npresentNull=value=null,present=true\nremoveWrong=false\nremoveRight=true\nsize=1", explanation: ["첫 put과 present-null은 null return만으로 구별되지 않습니다.", "containsKey가 association 존재를 분리합니다.", "conditional remove는 current value와 일치할 때만 상태를 바꿉니다."] },
      experiments: [
        { change: "lookup을 `getOrDefault(key,-1)`만 출력하게 합니다.", prediction: "absent는-1이지만 present-null은 null이라 여전히 null policy를 알아야 합니다.", result: "default가 presence model을 대신하지 않습니다." },
        { change: "pending null 대신 Map.of로 같은 association을 만듭니다.", prediction: "construction 시 NullPointerException이 발생합니다.", result: "null capability를 Map interface 전체의 공통 보장으로 가정하지 않습니다." },
        { change: "removeWrong 뒤 plain remove(math)를 호출합니다.", prediction: "20을 반환하며 key가 제거됩니다.", result: "plain remove는 expected current value guard가 없습니다." },
      ],
      sourceRefs: ["java-class10-ex04", "java-class10-ex05", "java-class10-ex06", "java-map-api", "java-hashmap-api"],
    }],
    diagnostics: [
      { symptom: "DB/cache lookup이 null이라 missing 처리했는데 실제 key는 존재한다.", likelyCause: "present-null과 absent를 get만으로 구분했습니다.", checks: ["구현체가 null values를 허용하는지 봅니다.", "containsKey 결과를 확인합니다.", "null이 domain value인지 sentinel인지 정합니다."], fix: "null value를 금지하거나 presence+value result type/containsKey를 사용합니다.", prevention: "absent·present-null·present-value 세 cases를 API contract test에 넣습니다." },
      { symptom: "integer key10이 있는데 size 기반 loop에서 출력되지 않는다.", likelyCause: "Map keys를0..size-1 contiguous indices로 오해했습니다.", checks: ["keySet을 출력합니다.", "max key와 size를 비교합니다.", "array/List가 더 맞는 model인지 봅니다."], fix: "entrySet/keySet을 순회하거나 contiguous index 요구면 List를 선택합니다.", prevention: "Map iteration code review에서 numeric for-loop와 get(i)를 탐지합니다." },
    ],
    expertNotes: ["public API가 `Map<K,V>`를 반환하면서 null policy를 말하지 않으면 구현 교체와 caller reasoning이 어려워집니다. null-free contract를 문서화하고 boundary에서 검증하는 편이 대개 낫습니다.", "containsValue 기반 reverse lookup은 correctness는 가능해도 비용·uniqueness가 불명확합니다. 역색인은 one-to-one인지 one-to-many인지 먼저 모델링합니다."],
  },
  {
    id: "hashmap-equals-hashcode-mutable-key",
    title: "HashMap key는 equals와 hashCode가 안정적으로 같은 equivalence class를 표현해야 합니다",
    lead: "key를 넣은 뒤 equality/hash에 참여하는 field를 바꾸면 entry가 눈앞에 있어도 새 hash lookup 경로에서 찾거나 제거하지 못할 수 있습니다.",
    explanations: [
      "Object.equals는 reflexive·symmetric·transitive·consistent하고 null에는 false여야 하며, equals가 true인 두 objects는 같은 hashCode를 반환해야 합니다. 반대인 같은 hashCode→equals true는 요구되지 않아 collisions가 가능합니다.",
      "HashMap은 key hash를 이용해 후보 영역을 좁힌 뒤 equals로 정확한 key를 구분합니다. hashCode만 override하거나 equals만 override하면 논리상 같은 key가 중복 저장되거나 lookup이 실패할 수 있습니다.",
      "key가 Map에 있는 동안 hashCode/equals에 쓰이는 state는 변하지 않아야 합니다. mutable field가 바뀌면 iterator로 entry를 볼 수 있어도 새 hash를 이용한 get/remove가 원래 저장 위치를 찾지 못하는 관찰이 생길 수 있습니다.",
      "record는 components 기반 equals/hashCode를 자동 제공해 immutable-looking typed key에 유용하지만 component가 mutable array/list라면 deep immutability를 자동으로 주지 않습니다. constructor에서 defensive copy 또는 scalar value를 선택합니다.",
      "business key에는 stable identifier를 쓰고 display name, status, timestamp처럼 바뀌는 attribute를 제외합니다. database entity가 영속화 전후 id를 얻는다면 hash collection membership 중 equality가 바뀌지 않게 전략을 별도로 설계합니다.",
      "collision은 정상 상황이며 Map correctness가 유지돼야 합니다. hash distribution은 performance에 영향을 주지만 OpenJDK 내부 bin/tree threshold는 implementation detail이므로 public behavior로 고정하지 않습니다.",
      "String 같은 well-tested immutable keys를 기본으로 하고 custom key에는 equals/hash contract tests를 둡니다. equal pairs의 hash equality, unequal/collision cases, null, mutation attempt와 serialization normalization을 포함합니다.",
      "identity-based semantics가 정말 필요하면 IdentityHashMap이라는 별도 구현이 있지만 일반 domain key의 equals 오류를 피하려고 선택하면 안 됩니다. 그 구현은 reference equality라는 다른 문제를 풉니다.",
    ],
    concepts: [
      { term: "hash consistency", definition: "equals가 true인 두 key가 반드시 같은 hashCode를 반환하는 계약입니다.", detail: ["HashMap correctness에 필요합니다.", "같은 hash가 equality를 뜻하지는 않습니다."] },
      { term: "mutable key corruption", definition: "Map membership 중 key의 hash/equality state가 바뀌어 lookup 경로와 저장 위치가 불일치하는 상태입니다.", detail: ["entry가 순회에는 보일 수 있습니다.", "immutable key로 예방합니다."] },
      { term: "business key", definition: "domain에서 객체를 장기간 안정적으로 식별하는 속성 조합입니다.", detail: ["mutable display attributes를 제외합니다.", "normalization 규칙을 포함합니다."] },
    ],
    codeExamples: [{
      id: "java-hashmap-mutable-key",
      title: "mutable key lookup 손상과 immutable record key의 안정성을 나란히 관찰합니다",
      language: "java",
      filename: "HashMapMutableKey.java",
      purpose: "equals/hashCode field mutation이 HashMap membership을 손상시키는 OpenJDK21 관찰과 예방용 record key를 비교합니다.",
      code: String.raw`import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class HashMapMutableKey {
    static final class MutableKey {
        private int code;
        MutableKey(int code) { this.code = code; }
        void changeTo(int next) { code = next; }
        @Override public boolean equals(Object other) {
            return other instanceof MutableKey key && code == key.code;
        }
        @Override public int hashCode() { return Integer.hashCode(code); }
        @Override public String toString() { return "MutableKey[code=" + code + "]"; }
    }

    record StableKey(String value) {
        StableKey { Objects.requireNonNull(value); }
    }

    public static void main(String[] args) {
        MutableKey mutable = new MutableKey(1);
        Map<MutableKey, String> broken = new HashMap<>();
        broken.put(mutable, "saved");
        mutable.changeTo(2);
        System.out.println("mutatedLookup=" + broken.get(mutable));
        System.out.println("entryStillPresent=" + broken.entrySet().iterator().next());
        System.out.println("mutatedRemove=" + (broken.remove(mutable) != null));

        Map<StableKey, String> stable = new HashMap<>();
        stable.put(new StableKey("SKU-1"), "saved");
        System.out.println("stableLookup=" + stable.get(new StableKey("SKU-1")));
        System.out.println("stableSize=" + stable.size());
    }
}`,
      walkthrough: [
        { lines: "1-15", explanation: "code field가 equals/hashCode를 함께 결정하는 의도적으로 위험한 mutable key를 정의합니다." },
        { lines: "17-19", explanation: "record key는 String component value semantics와 null validation을 갖습니다." },
        { lines: "21-28", explanation: "저장 뒤 code를1→2로 바꾸고 new hash lookup/remove는 실패하지만 physical entry iteration에는 변경된 key가 보임을 관찰합니다." },
        { lines: "30-33", explanation: "같은 component의 새 StableKey가 equals/hashCode 계약으로 기존 association을 찾습니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "HashMap implementation observation", "-Xlint:all warning0"], command: isolatedJavaRun("HashMapMutableKey.java", "HashMapMutableKey") },
      output: { value: "mutatedLookup=null\nentryStillPresent=MutableKey[code=2]=saved\nmutatedRemove=false\nstableLookup=saved\nstableSize=1", explanation: ["broken key의 현재 hash로는 원래 위치를 찾지 못합니다.", "entry iteration은 physical association이 남아 있음을 보입니다.", "record value semantics는 equivalent 새 key lookup을 성공시킵니다."] },
      experiments: [
        { change: "MutableKey의 hashCode를 항상1로 반환합니다.", prediction: "이 작은 예에서는 mutation 뒤 equals가 자기 자신에는 true라 lookup이 성공할 수 있지만 collisions가 늘어납니다.", result: "constant hash는 mutable key 문제의 올바른 해결이 아닙니다." },
        { change: "equals만 override하고 hashCode를 제거합니다.", prediction: "같은 code의 서로 다른 instances가 다른 identity hash를 가져 lookup/size contract가 깨질 수 있습니다.", result: "equals와 hashCode는 함께 설계합니다." },
        { change: "StableKey component를 mutable byte[]로 바꿉니다.", prediction: "record가 array contents deep equality를 자동 제공하지 않고 referent mutation도 막지 않습니다.", result: "record도 component 선택과 defensive copy가 필요합니다." },
      ],
      sourceRefs: ["java-hashmap-api", "java-object-api", "java-objects-api", "jls-records", "openjdk-hashmap-source"],
    }],
    diagnostics: [
      { symptom: "entrySet에는 key가 보이는데 get/remove가 null이다.", likelyCause: "membership 중 key의 hash/equality field가 변경됐습니다.", checks: ["key의 before/after fields와 hashCode를 기록합니다.", "equals/hashCode 구현을 함께 봅니다.", "Map에 넣은 뒤 setter 호출을 찾습니다."], fix: "immutable stable key로 재구성하고 손상 Map은 새 Map에 정상화된 entries를 rebuild합니다.", prevention: "key types를 records/final scalars로 제한하고 mutation contract tests를 둡니다." },
      { symptom: "논리상 같은 key가 Map에 두 개 들어간다.", likelyCause: "equals/hashCode가 불일치하거나 normalization이 key construction마다 다릅니다.", checks: ["equal pair의 hashes를 비교합니다.", "case/whitespace/Unicode normalization을 확인합니다.", "database id assignment 시점을 봅니다."], fix: "canonical immutable key factory와 일관된 equals/hashCode를 적용합니다.", prevention: "equals verifier/property tests와 duplicate import fixtures를 CI에 둡니다." },
    ],
    expertNotes: ["예제의 broken output은 계약을 위반한 key에 대한 OpenJDK21 관찰이지 모든 Map implementation이 보장하는 결과가 아닙니다. 보장되는 결론은 membership 중 equality state를 바꾸면 Map 사용 계약을 위반한다는 점입니다.", "hash collision 방어를 내부 treeification 숫자에 기대지 말고 untrusted cardinality bound, request quota와 key normalization을 운영 경계에 둡니다."],
  },
  {
    id: "map-backed-views-entry-iteration-mutation",
    title: "keySet·values·entrySet은 복사본이 아니라 Map을 반영하는 backed views이며 mutation 경로마다 의미가 다릅니다",
    lead: "key와 value가 모두 필요하면 entrySet을 쓰고, 순회 중 구조 변경은 iterator.remove 또는 명시된 bulk operation으로 수행합니다.",
    explanations: [
      "keySet, values, entrySet은 보통 backing Map과 연결된 views입니다. Map 변경은 view에 보이고 view의 지원되는 remove/clear는 Map association을 제거합니다. add처럼 key/value 한쪽만으로 association을 만들 수 없는 operation은 일반적으로 지원되지 않습니다.",
      "entrySet iteration은 Entry가 key와 value를 함께 제공하므로 `for (K key : map.keySet()) map.get(key)`보다 의도가 직접적이고 별도 lookup을 피합니다. 성능 차이는 구현에 따라 측정하지만 association 처리를 표현하는 기본 선택입니다.",
      "Map.Entry.setValue는 해당 entry가 backing Map과 연결되고 구현이 지원하면 value를 교체합니다. immutable factory entry나 snapshot entry에서는 UnsupportedOperationException 또는 비연결 semantics가 있을 수 있어 source API를 확인합니다.",
      "enhanced-for 중 `map.remove`로 structural modification하면 fail-fast iterator가 best-effort ConcurrentModificationException을 던질 수 있습니다. 같은 iterator의 remove, removeIf, collect-then-remove 중 필요한 atomicity와 readability에 맞는 경로를 씁니다.",
      "values view에는 duplicate values가 그대로 나타납니다. values.remove(value)는 일치하는 association 하나를 제거할 수 있고 removeAll은 모두 제거할 수 있어 multiplicity 요구를 테스트합니다.",
      "view를 public field/return으로 노출하면 caller가 owner Map을 변경할 수 있습니다. read-only view가 필요하면 unmodifiableSet/Collection 또는 immutable snapshot을 만들고 live update 필요 여부를 문서화합니다.",
      "ConcurrentHashMap views는 fail-fast HashMap view와 다른 weakly consistent iteration을 제공합니다. 한 Map에서 본 동작을 모든 Map interface implementation의 공통 동시성 계약으로 일반화하지 않습니다.",
      "entry object를 iteration 밖에 오래 저장하면 backing changes 후 의미가 불명확할 수 있습니다. 장기 snapshot에는 `Map.entry(key,value)` 또는 domain record로 복사합니다.",
    ],
    concepts: [
      { term: "backed view", definition: "원본 Map과 상태를 공유해 한쪽 변경이 다른 쪽 관찰에 반영되는 collection view입니다.", detail: ["복사본이 아닙니다.", "지원 mutation이 Map을 바꿉니다."] },
      { term: "structural modification", definition: "association 수나 iteration 구조를 바꾸는 add/remove/clear 계열 변경입니다.", detail: ["iterator protocol과 충돌할 수 있습니다.", "setValue는 value replacement입니다."] },
      { term: "snapshot entry", definition: "특정 시점의 key/value를 backing Map과 분리해 보존한 immutable association입니다.", detail: ["장기 전달에 적합합니다.", "live update는 반영하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-map-backed-views",
      title: "entry setValue·iterator remove·values/keySet remove가 같은 Map에 반영되는 순서를 확인합니다",
      language: "java",
      filename: "MapBackedViews.java",
      purpose: "backed view mutation 네 경로를 insertion-ordered fixture로 실행해 association 변화를 결정적으로 설명합니다.",
      code: String.raw`import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

public class MapBackedViews {
    public static void main(String[] args) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("A", 1);
        map.put("B", 2);
        map.put("C", 3);
        System.out.println("initial=" + map);

        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            if (entry.getKey().equals("C")) { entry.setValue(30); }
        }
        System.out.println("afterEntry=" + map);

        Iterator<Map.Entry<String, Integer>> iterator = map.entrySet().iterator();
        while (iterator.hasNext()) {
            if (iterator.next().getKey().equals("B")) { iterator.remove(); }
        }
        System.out.println("afterIterator=" + map);

        boolean valueRemoved = map.values().remove(1);
        System.out.println("valuesRemoved=" + valueRemoved + ",map=" + map);
        boolean keyRemoved = map.keySet().remove("C");
        System.out.println("keysRemoved=" + keyRemoved + ",map=" + map);
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "LinkedHashMap으로 설명용 encounter order A,B,C를 명시하고 initial associations를 출력합니다." },
        { lines: "13-16", explanation: "entrySet의 C Entry.setValue가 backing map value를3→30으로 바꿉니다." },
        { lines: "18-22", explanation: "같은 iterator의 remove로 B association을 안전하게 제거합니다." },
        { lines: "24-27", explanation: "values view의 value1 제거는 A association을, keySet의 C 제거는 마지막 association을 제거합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("MapBackedViews.java", "MapBackedViews") },
      output: { value: "initial={A=1, B=2, C=3}\nafterEntry={A=1, B=2, C=30}\nafterIterator={A=1, C=30}\nvaluesRemoved=true,map={C=30}\nkeysRemoved=true,map={}", explanation: ["entrySet value 교체는 size/order를 바꾸지 않습니다.", "iterator remove는 B를 구조적으로 제거합니다.", "두 views의 remove도 backing associations를 제거합니다."] },
      experiments: [
        { change: "while 내부 iterator.remove 대신 map.remove(B)를 호출합니다.", prediction: "HashMap/LinkedHashMap iterator의 best-effort fail-fast로 ConcurrentModificationException이 날 수 있습니다.", result: "순회 mutation은 iterator protocol을 사용합니다." },
        { change: "values에 duplicate1을 하나 더 넣고 values.remove(1)를 호출합니다.", prediction: "일치 association 하나만 제거되고 다른1은 남을 수 있습니다.", result: "values는 Set이 아니며 multiplicity를 보존합니다." },
        { change: "entrySet.add(Map.entry(D,4))를 호출합니다.", prediction: "이 view는 add를 지원하지 않아 UnsupportedOperationException이 발생합니다.", result: "view가 모든 Collection mutation을 지원한다고 가정하지 않습니다." },
      ],
      sourceRefs: ["java-class10-ex04", "java-class10-ex05", "java-map-api", "java-map-entry-api", "java-collection-api", "java-iterator-api", "java-linkedhashmap-api", "java-uoe-api"],
    }],
    diagnostics: [
      { symptom: "keySet을 수정했더니 원본 Map data가 사라졌다.", likelyCause: "keySet을 independent copy로 오해했습니다.", checks: ["view를 어디서 얻었는지 봅니다.", "remove/clear 호출을 추적합니다.", "snapshot 요구였는지 확인합니다."], fix: "독립 데이터가 필요하면 new HashSet(map.keySet()) 또는 immutable copy를 사용합니다.", prevention: "API 이름/Javadoc에 liveView 또는 snapshot 의미를 명시합니다." },
      { symptom: "Map 순회 중 ConcurrentModificationException이 간헐적으로 난다.", likelyCause: "iterator 밖 경로로 structural modification했거나 여러 threads가 non-concurrent Map을 공유합니다.", checks: ["모든 mutation call sites를 찾습니다.", "iterator.remove 사용 여부를 봅니다.", "thread ownership을 확인합니다."], fix: "single-thread iterator protocol, collect-then-remove 또는 concurrent design으로 바꿉니다.", prevention: "fail-fast를 동시성 안전 장치로 의존하지 말고 ownership을 명시합니다." },
    ],
    expertNotes: ["fail-fast는 bug detection을 돕는 best-effort behavior이지 data race synchronization이 아닙니다. 예외가 안 났다고 안전한 것도 아닙니다.", "view exposure는 캡슐화 문제입니다. unmodifiable live view와 immutable snapshot은 둘 다 write method를 막지만 upstream mutation 반영 여부가 다릅니다."],
  },
  {
    id: "map-ordering-linked-tree-enum",
    title: "order 요구를 HashMap 우연에 맡기지 않고 insertion/access, sorted navigation, enum domain으로 구체화합니다",
    lead: "UI 표시 순서, range query, closed enum key space는 서로 다른 문제이므로 LinkedHashMap·TreeMap·EnumMap을 이름만이 아니라 계약으로 선택합니다.",
    explanations: [
      "HashMap은 key/value association lookup을 제공하지만 iteration order를 보장하지 않습니다. 현재 출력이 입력 순서나 숫자 순서처럼 보여도 resize·hash·JDK 변화에 의존할 수 있습니다.",
      "LinkedHashMap 기본 mode는 insertion order를 유지하고 existing key value 교체는 보통 위치를 바꾸지 않습니다. access-order constructor는 get/put 접근에 따라 순서를 바꿔 LRU building block이 되지만 동시성·eviction·loader 문제까지 해결하지는 않습니다.",
      "TreeMap은 natural order 또는 Comparator에 따라 keys를 정렬하고 floor/ceiling/lower/higher와 range views를 제공합니다. hash lookup과 다른 log-time tree 비용, comparator 호출과 key comparability를 고려합니다.",
      "TreeMap에서 comparator.compare(a,b)==0이면 같은 key로 취급합니다. comparator가 equals와 inconsistent하면 equals상 다른 keys가 association 하나를 공유할 수 있어 size·put overwrite가 놀랍게 보입니다.",
      "EnumMap은 한 enum type의 keys에 특화되고 enum declaration order로 순회합니다. null key는 허용하지 않고 key domain이 닫혀 있어 state→handler/config table에 의도가 명확합니다.",
      "sorted export만 필요하면 storage를 HashMap으로 유지하고 export 시 entries를 sort할 수 있습니다. 모든 write에 tree 비용을 지불할지 read boundary에 sort할지는 update/read 비율과 range query 요구로 정합니다.",
      "order가 wire/storage contract라면 comparator·locale·case·null·tie-breaker를 versioned specification으로 둡니다. locale-sensitive Collator나 case-insensitive comparator는 equality와 migration에 영향을 줍니다.",
      "NavigableMap range views도 backing view일 수 있어 bounds 밖 put이 실패하고 parent changes가 반영됩니다. snapshot이 필요하면 새 map/copy로 ownership을 끊습니다.",
    ],
    concepts: [
      { term: "encounter order", definition: "iteration이 entries를 만나는 정의된 순서입니다.", detail: ["LinkedHashMap은 insertion/access order를 제공할 수 있습니다.", "HashMap은 보장하지 않습니다."] },
      { term: "ordering equality", definition: "sorted Map에서 comparator 결과0으로 같은 key position을 판단하는 관계입니다.", detail: ["equals와 다를 수 있습니다.", "중복 overwrite에 영향을 줍니다."] },
      { term: "navigation query", definition: "특정 key보다 작거나 큰 가장 가까운 key와 범위를 찾는 floor/ceiling/lower/higher 연산입니다.", detail: ["NavigableMap이 제공합니다.", "range scheduling/index에 유용합니다."] },
    ],
    codeExamples: [{
      id: "java-map-ordering-choices",
      title: "insertion order, comparator equality, navigation과 enum order를 한 번에 비교합니다",
      language: "java",
      filename: "MapOrderingChoices.java",
      purpose: "구현체마다 보장되는 order/equality/navigation이 다름을 deterministic outputs로 확인합니다.",
      code: String.raw`import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;

public class MapOrderingChoices {
    enum Stage { NEW, RUNNING, DONE }

    public static void main(String[] args) {
        Map<String, Integer> insertion = new LinkedHashMap<>();
        insertion.put("second", 2);
        insertion.put("first", 1);
        insertion.put("third", 3);
        System.out.println("insertion=" + insertion.keySet());

        Map<String, Integer> caseInsensitive = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        caseInsensitive.put("alpha", 1);
        Integer previous = caseInsensitive.put("ALPHA", 2);
        System.out.println("caseSize=" + caseInsensitive.size() + ",previous=" + previous);

        NavigableMap<Integer, String> timeline = new TreeMap<>();
        timeline.put(2, "two"); timeline.put(5, "five"); timeline.put(9, "nine");
        System.out.println("around6=" + timeline.floorKey(6) + "," + timeline.ceilingKey(6));

        Map<Stage, String> labels = new EnumMap<>(Stage.class);
        labels.put(Stage.DONE, "done"); labels.put(Stage.NEW, "new");
        System.out.println("enumOrder=" + labels.keySet());
        System.out.println("hashOrderSpecified=false");
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "세 order-specific implementations와 closed Stage key domain을 준비합니다." },
        { lines: "10-15", explanation: "입력 순서를 deliberately sorted와 다르게 넣고 LinkedHashMap insertion order를 출력합니다." },
        { lines: "17-20", explanation: "case-insensitive comparator가 alpha/ALPHA를 같은 key로 판단해 이전1을 반환하고 size1을 유지합니다." },
        { lines: "22-24", explanation: "TreeMap navigation이6 주변 floor5·ceiling9를 찾습니다." },
        { lines: "26-30", explanation: "put 순서와 무관한 enum declaration order를 보이고 HashMap order는 고정하지 않는 정책을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("MapOrderingChoices.java", "MapOrderingChoices") },
      output: { value: "insertion=[second, first, third]\ncaseSize=1,previous=1\naround6=5,9\nenumOrder=[NEW, DONE]\nhashOrderSpecified=false", explanation: ["LinkedHashMap은 명시된 insertion order를 냅니다.", "TreeMap uniqueness는 comparator0 관계입니다.", "EnumMap은 enum declaration order를 따릅니다."] },
      experiments: [
        { change: "LinkedHashMap을 HashMap으로 바꾸고 같은 keySet exact를 기대합니다.", prediction: "우연히 같을 수 있어도 계약이 아니므로 test가 잘못됩니다.", result: "order requirement에는 order-providing 구현 또는 explicit sort를 사용합니다." },
        { change: "case-insensitive comparator에 natural-order tie-breaker를 추가합니다.", prediction: "alpha와 ALPHA가 compare0이 아니어서 size2가 됩니다.", result: "comparator tie policy가 key uniqueness를 결정합니다." },
        { change: "timeline.subMap(2,true,9,false)에 key10을 put합니다.", prediction: "range 밖이라 IllegalArgumentException이 발생합니다.", result: "range view bounds도 mutation contract입니다." },
      ],
      sourceRefs: ["java-map-api", "java-linkedhashmap-api", "java-treemap-api", "java-navigablemap-api", "java-comparator-api", "java-enummap-api"],
    }],
    diagnostics: [
      { symptom: "배포 후 JSON/UI key 순서가 바뀌었다.", likelyCause: "HashMap iteration을 presentation order로 사용했습니다.", checks: ["Map concrete type을 봅니다.", "serializer ordering option을 확인합니다.", "domain이 insertion/sorted/custom 중 무엇을 요구하는지 정합니다."], fix: "LinkedHashMap, TreeMap 또는 boundary sort로 contract를 명시합니다.", prevention: "order-sensitive output test에는 order 제공 근거와 comparator version을 기록합니다." },
      { symptom: "TreeMap에 서로 다른 두 문자열을 넣었는데 size가 늘지 않는다.", likelyCause: "Comparator가 두 keys를0으로 비교해 같은 sorted key로 취급합니다.", checks: ["compare(a,b)와 equals를 함께 출력합니다.", "case/locale normalization을 봅니다.", "tie-breaker를 확인합니다."], fix: "equals와 일관된 comparator 또는 intentional canonical key를 사용합니다.", prevention: "comparator laws와 compare0↔key identity policy를 property tests로 검증합니다." },
    ],
    expertNotes: ["access-order LinkedHashMap의 get은 iteration order를 바꾸는 structural observation일 수 있어 read-only처럼 보이는 호출도 synchronization과 reproducibility에 영향을 줍니다.", "국제화 정렬은 human display와 persistent key identity를 분리합니다. Collator 결과를 durable uniqueness로 쓰면 locale/version 변화에 migration 문제가 생깁니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...mapFoundationChapters);

const mapTransformationChapters: DetailedSession["chapters"] = [
  {
    id: "map-ownership-copy-unmodifiable-factory",
    title: "mutable copy·unmodifiable live view·immutable snapshot을 alias와 publication 요구로 구분합니다",
    lead: "put이 막힌다는 한 문장만으로는 upstream 변경이 보이는지, null을 허용하는지, iteration order가 무엇인지 알 수 없으므로 ownership을 상태 흐름으로 검증합니다.",
    explanations: [
      "`new HashMap<>(source)`는 현재 associations를 shallow copy해 구조 mutation ownership을 분리합니다. values가 mutable objects라면 referents는 여전히 공유하므로 deep snapshot이 필요하면 value도 immutable/defensive copy해야 합니다.",
      "Collections.unmodifiableMap(source)는 write methods를 막는 wrapper이지만 source가 바뀌면 view에서 새 상태가 보입니다. caller mutation 방지에는 유용해도 시점 snapshot이나 thread-safe publication을 자동 제공하지 않습니다.",
      "Map.copyOf(source)는 현재 associations를 unmodifiable Map으로 복사하고 null key/value를 거부합니다. source가 이미 suitable unmodifiable instance이면 같은 instance를 반환할 수도 있으므로 identity나 concrete class/order에 의존하지 않습니다.",
      "Map.of/ofEntries는 작은 fixed associations를 간결하게 만들고 duplicate keys·nulls를 construction 시 거부합니다. iteration order는 argument order로 약속되지 않으므로 UI/wire order가 필요하면 별도 ordered representation을 사용합니다.",
      "unmodifiable method의 mutation은 UnsupportedOperationException을 던질 수 있지만 optional operation은 no-op처럼 보여도 예외 가능성이 있습니다. 호출 전에 ownership contract를 알고 catch로 정상 control flow를 만들지 않습니다.",
      "shallow copy 뒤 value List를 caller가 수정하면 snapshot Map의 observed contents도 바뀔 수 있습니다. immutable value records, `List.copyOf`, deep mapper 중 domain graph에 맞는 boundary를 적용합니다.",
      "safe publication은 immutability뿐 아니라 reference visibility가 필요합니다. final field construction, volatile swap, synchronized handoff 또는 framework lifecycle로 완성된 snapshot을 공유합니다.",
      "API parameter를 보관할 때 caller Map을 그대로 field에 넣지 않습니다. live collaboration이 의도면 명시하고, config/catalog라면 validate→copy→publish 순서와 duplicate/null policy를 둡니다.",
    ],
    concepts: [
      { term: "shallow structural copy", definition: "Map association 구조는 새로 만들지만 key/value object references는 공유하는 복사입니다.", detail: ["put/remove ownership은 분리됩니다.", "mutable values는 alias될 수 있습니다."] },
      { term: "unmodifiable live view", definition: "view를 통한 write는 막지만 backing source mutation은 계속 관찰되는 wrapper입니다.", detail: ["snapshot이 아닙니다.", "upstream owner가 남습니다."] },
      { term: "immutable publication snapshot", definition: "검증된 특정 시점 association과 immutable values를 변경 불가능하게 공유하는 상태입니다.", detail: ["alias를 끊습니다.", "safe publication 경로도 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-map-ownership-boundaries",
      title: "source mutation이 live view·copyOf snapshot·mutable copy에 어떻게 다르게 보이는지 확인합니다",
      language: "java",
      filename: "MapOwnershipBoundaries.java",
      purpose: "세 ownership 형태의 size, mutation failure와 null rejection을 identity/order 없이 결정적으로 검증합니다.",
      code: String.raw`import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class MapOwnershipBoundaries {
    public static void main(String[] args) {
        Map<String, Integer> source = new LinkedHashMap<>();
        source.put("A", 1);
        source.put("B", 2);
        Map<String, Integer> liveView = Collections.unmodifiableMap(source);
        Map<String, Integer> snapshot = Map.copyOf(source);
        Map<String, Integer> mutableCopy = new LinkedHashMap<>(source);

        source.put("C", 3);
        mutableCopy.put("D", 4);
        System.out.println("sizes=" + liveView.size() + "," + snapshot.size() + "," + mutableCopy.size());
        System.out.println("snapshotA=" + snapshot.get("A") + ",hasC=" + snapshot.containsKey("C"));
        try { liveView.put("X", 9); }
        catch (UnsupportedOperationException exception) { System.out.println("liveWrite=" + exception.getClass().getSimpleName()); }
        try { snapshot.clear(); }
        catch (UnsupportedOperationException exception) { System.out.println("snapshotWrite=" + exception.getClass().getSimpleName()); }

        Map<String, Integer> withNull = new LinkedHashMap<>();
        withNull.put("N", null);
        try { Map.copyOf(withNull); }
        catch (NullPointerException exception) { System.out.println("copyNull=" + exception.getClass().getSimpleName()); }
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "같은 source에서 live unmodifiable wrapper, copyOf snapshot과 mutable structural copy를 만듭니다." },
        { lines: "14-17", explanation: "source C는 live view에만 반영되고 mutable copy D는 source/snapshot에 반영되지 않아 sizes3,2,3이 됩니다." },
        { lines: "18-21", explanation: "두 unmodifiable boundaries의 서로 다른 mutation methods가 같은 exception type으로 차단됩니다." },
        { lines: "23-27", explanation: "HashMap류 source가 허용한 null value도 Map.copyOf boundary에서는 즉시 거부됩니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("MapOwnershipBoundaries.java", "MapOwnershipBoundaries") },
      output: { value: "sizes=3,2,3\nsnapshotA=1,hasC=false\nliveWrite=UnsupportedOperationException\nsnapshotWrite=UnsupportedOperationException\ncopyNull=NullPointerException", explanation: ["live view만 source의 C를 봅니다.", "snapshot과 mutable copy는 source 구조 alias를 끊습니다.", "unmodifiable과 null-free contracts가 각각 예외로 드러납니다."] },
      experiments: [
        { change: "value를 mutable List로 바꾸고 copyOf 뒤 원본 List에 add합니다.", prediction: "Map 구조는 snapshot이어도 공유 List contents 변화가 보입니다.", result: "Map.copyOf는 deep copy가 아닙니다." },
        { change: "snapshot key iteration을 exact A,B로 고정합니다.", prediction: "Map.copyOf는 그 encounter order를 보장하지 않아 잘못된 test입니다.", result: "order가 필요하면 별도 ordered snapshot contract를 구성합니다." },
        { change: "source를 다른 thread에서 수정하며 liveView를 순회합니다.", prediction: "unmodifiable wrapper가 thread safety를 추가하지 않아 race/fail-fast 문제가 남습니다.", result: "write 차단과 concurrency safety를 구분합니다." },
      ],
      sourceRefs: ["java-map-api", "java-linkedhashmap-api", "java-collections-api", "java-uoe-api", "java-objects-api"],
    }],
    diagnostics: [
      { symptom: "읽기 전용 Map이 어느 순간 새 entry를 포함한다.", likelyCause: "unmodifiable live view를 immutable snapshot으로 오해했고 backing owner가 변경했습니다.", checks: ["construction API를 확인합니다.", "source reference와 mutation owner를 추적합니다.", "value aliases도 점검합니다."], fix: "snapshot 요구면 validate 후 Map.copyOf/new Map과 immutable values로 복사합니다.", prevention: "API type/name/Javadoc에 live vs snapshot과 value mutability를 명시합니다." },
      { symptom: "Map.copyOf 전환 후 NullPointerException이 난다.", likelyCause: "기존 HashMap에 null key/value가 있었고 copy boundary가 이를 거부합니다.", checks: ["null associations를 inventory합니다.", "null 의미가 absent/unknown인지 정합니다.", "value validation 순서를 봅니다."], fix: "null을 domain value/result type으로 변환하거나 construction 전에 명확히 거부합니다.", prevention: "null-free invariant를 write boundary와 migration test에 둡니다." },
    ],
    expertNotes: ["immutable collection publication은 snapshot consistency를 단순하게 하지만 rebuild cost가 있습니다. update 빈도와 read fan-out을 측정해 copy-on-write, lock 또는 persistent structure를 선택합니다.", "Map.copyOf의 instance reuse 가능성 때문에 방어 복사를 identity 분리로 검증하지 않습니다. 외부 mutation이 관찰되지 않는 behavior를 검증합니다."],
  },
  {
    id: "map-default-methods-compute-merge",
    title: "compute·merge·replace 계열을 read-then-write 단축 문법이 아니라 null·removal·atomicity가 있는 상태 전이로 읽습니다",
    lead: "mapping/remapping function이 언제 호출되고 null·예외를 반환하면 association이 어떻게 되는지 알아야 counter, index와 cache가 조용히 손상되지 않습니다.",
    explanations: [
      "putIfAbsent는 key가 value에 연결되지 않았거나 null에 연결된 경우 새 value를 넣는 semantics를 가집니다. null-supporting Map에서는 present-null도 absent-like하게 취급되는 default method별 규칙을 확인합니다.",
      "computeIfAbsent는 key에 non-null value가 없을 때 mapping function을 호출하고 non-null 결과만 기록합니다. function이 null이면 mapping은 남지 않고 예외면 예외가 전달되며 association도 기록되지 않는 것이 기본 계약입니다.",
      "computeIfPresent는 현재 non-null value가 있을 때만 remapping하고 null 결과는 association을 제거합니다. compute는 presence와 관계없이 current value(null 가능)를 전달하며 null 결과가 removal/absence를 뜻합니다.",
      "merge는 absent/present-null이면 supplied value를 넣고, non-null current가 있으면 remapping(old,new)을 적용합니다. remapping null은 key를 제거하므로 frequency decrement와 conflict resolution에 사용할 때 zero/removal 정책을 명시합니다.",
      "replaceAll은 각 entry의 value를 함수 결과로 바꾸며 null 허용과 failure partial progress는 구현/operation을 고려해야 합니다. 대규모 mutation 전에 새 Map을 만들어 validate 후 swap하는 방식이 더 transactional할 수 있습니다.",
      "HashMap의 default method는 동시 read-modify-write 안전을 자동으로 주지 않습니다. ConcurrentMap 구현은 일부 methods에 atomic contract를 강화하므로 interface/implementation Javadoc을 함께 읽습니다.",
      "mapping function 안에서 같은 Map을 구조적으로 수정하거나 재귀적으로 같은 key를 compute하면 reentrancy·exception·중복 계산 문제가 생길 수 있습니다. function을 짧고 side-effect-free하게 하고 외부 I/O는 failure/idempotency/stampede policy를 둡니다.",
      "`map.merge(key,1,Integer::sum)`은 single-thread frequency에 명확하지만 int overflow는 검사하지 않습니다. count 범위가 크면 Long, Math.addExact 또는 LongAdder 등의 semantics를 선택합니다.",
    ],
    concepts: [
      { term: "remapping function", definition: "현재 value와 새 input을 받아 replacement value 또는 removal null을 결정하는 함수입니다.", detail: ["merge/compute가 사용합니다.", "예외와 side effect 정책이 필요합니다."] },
      { term: "null-as-removal", definition: "compute/merge 계열에서 remapping 결과 null이 association 삭제 또는 미기록을 뜻하는 규칙입니다.", detail: ["domain null과 혼동하기 쉽습니다.", "테스트로 고정합니다."] },
      { term: "atomic per-key transition", definition: "한 key의 current value 관찰과 새 value 기록이 다른 update와 분리되지 않는 연산 계약입니다.", detail: ["ConcurrentMap 구현을 확인합니다.", "여러 keys invariant는 포함하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-map-compute-merge",
      title: "merge insert/update, compute removal·null 미기록과 replaceAll을 순서대로 실행합니다",
      language: "java",
      filename: "MapComputeMerge.java",
      purpose: "각 default method의 null/removal semantics와 최종 association을 deterministic LinkedHashMap으로 확인합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;

public class MapComputeMerge {
    public static void main(String[] args) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        Integer first = counts.merge("apple", 1, Integer::sum);
        Integer second = counts.merge("apple", 2, Integer::sum);
        Integer banana = counts.computeIfAbsent("banana", String::length);
        Integer apple = counts.computeIfPresent("apple", (key, value) -> value * 10);
        Integer ghost = counts.computeIfAbsent("ghost", key -> null);
        Integer removed = counts.compute("banana", (key, value) -> null);
        counts.replaceAll((key, value) -> value + 1);

        System.out.println("merge=" + first + "," + second);
        System.out.println("computed=" + banana + "," + apple);
        System.out.println("nullResults=" + ghost + "," + removed);
        System.out.println("present=" + counts.containsKey("ghost") + "," + counts.containsKey("banana"));
        System.out.println("final=" + counts);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "insertion-order map을 만들어 상태 변화 출력도 명시된 order를 갖게 합니다." },
        { lines: "7-10", explanation: "merge는 apple1 삽입 후 old1+new2=3으로 갱신하고 banana length6, apple30을 만듭니다." },
        { lines: "11-13", explanation: "computeIfAbsent null은 ghost를 기록하지 않고 compute null은 banana를 제거한 뒤 apple만31로 바꿉니다." },
        { lines: "15-19", explanation: "method return, null 결과, key presence와 최종 map을 서로 다른 관찰로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("MapComputeMerge.java", "MapComputeMerge") },
      output: { value: "merge=1,3\ncomputed=6,30\nnullResults=null,null\npresent=false,false\nfinal={apple=31}", explanation: ["merge return은 새 current values1/3입니다.", "두 null results는 ghost 미기록과 banana 제거를 각각 뜻합니다.", "replaceAll이 남은 apple30을31로 바꿉니다."] },
      experiments: [
        { change: "merge remapper가 null을 반환하게 합니다.", prediction: "existing apple association이 제거됩니다.", result: "null을 계산 실패 값으로 반환하면 data deletion이 될 수 있습니다." },
        { change: "computeIfAbsent loader가 IllegalStateException을 던집니다.", prediction: "예외가 전달되고 key는 기록되지 않습니다.", result: "retry/negative cache는 caller 정책으로 별도 설계합니다." },
        { change: "mapping function 안에서 같은 key computeIfAbsent를 다시 호출합니다.", prediction: "구현이 recursive update를 거부하거나 예측하기 어려운 동작이 생길 수 있습니다.", result: "mapping function의 reentrancy를 피합니다." },
      ],
      sourceRefs: ["java-map-api", "java-linkedhashmap-api", "java-map-entry-api", "java-object-api"],
    }],
    diagnostics: [
      { symptom: "compute 뒤 key가 사라졌다.", likelyCause: "remapping function이 null을 반환했고 null-as-removal rule이 적용됐습니다.", checks: ["function의 모든 return paths를 봅니다.", "exception 대신 null fallback이 있는지 확인합니다.", "Map이 null values를 허용하는지와 별개임을 확인합니다."], fix: "removal을 의도하지 않으면 non-null result/error channel을 사용하고 null을 금지합니다.", prevention: "absent·present-null·present-value와 mapper null/throw matrix를 테스트합니다." },
      { symptom: "computeIfAbsent loader가 여러 번 호출되거나 deadlock/latency가 생긴다.", likelyCause: "non-concurrent Map race 또는 long blocking/reentrant loader를 atomic map operation 안에 넣었습니다.", checks: ["Map 구현과 thread ownership을 봅니다.", "loader duration/I/O/reentrancy를 측정합니다.", "failure 후 mapping 존재를 확인합니다."], fix: "동시 Map/library cache와 짧은 idempotent loader, timeout/stampede policy를 사용합니다.", prevention: "same-key concurrent miss·loader throw/null·recursive cases를 stress test합니다." },
    ],
    expertNotes: ["default interface implementation의 동시성 semantics와 ConcurrentHashMap override를 혼동하지 않습니다. 선언 type보다 runtime implementation의 documented atomicity가 중요합니다.", "compute family는 concise하지만 복잡한 business transition의 audit trail을 숨길 수 있습니다. validation·authorization·event emission이 많으면 명시적 service transaction이 더 낫습니다."],
  },
  {
    id: "stream-collectors-map-duplicate-policy",
    title: "Stream을 Map으로 수집할 때 duplicate key를 data error가 아니라 명시적 reject·keep·merge·group 정책으로 다룹니다",
    lead: "Collectors.toMap의 merge function을 생략하면 duplicate key에서 실패하고, 아무 생각 없이 last-wins를 넣으면 유효한 이전 data가 조용히 사라질 수 있습니다.",
    explanations: [
      "Collectors.toMap(keyMapper,valueMapper)는 duplicate key가 나오면 IllegalStateException을 던집니다. unique invariant가 맞다면 이 fail-fast를 유지하고 source row context를 별도 validation 단계에서 보강합니다.",
      "세 인자 overload의 merge function은 같은 key에 대한 existing/new values를 받아 하나를 선택하거나 합칩니다. keep-first `(left,right)->left`, keep-last→right는 짧지만 어느 row가 우선인지 input encounter order contract를 문서화해야 합니다.",
      "네 인자 overload는 Map supplier를 받아 LinkedHashMap insertion order나 TreeMap sorted keys를 결과 contract로 정할 수 있습니다. supplier를 생략한 결과 Map type/order에 의존하지 않습니다.",
      "두 values를 모두 보존해야 하면 groupingBy로 Map<K,List<V>>를 만들거나 merge가 immutable aggregate를 만듭니다. duplicate를 overwrite한 뒤 별도 count를 추측하지 않습니다.",
      "parallel collection에서 merge function은 associative하고 grouping 순서 요구와 호환돼야 합니다. side effect로 외부 list/log를 수정하지 말고 collector result에 conflict evidence를 담습니다.",
      "keyMapper/valueMapper가 null을 만들면 collector와 target Map의 null policy에 따라 failure가 생깁니다. normalize·validate를 수집 전에 수행하고 null을 ‘skip’ 의미로 몰래 사용하지 않습니다.",
      "toMap은 같은 stream을 두 번 소비할 수 없으므로 duplicate report와 result를 모두 원하면 한 custom aggregate/collector 또는 먼저 validated rows snapshot을 만듭니다.",
      "DB unique constraint가 최종 source of truth라면 in-memory Map validation은 빠른 feedback일 뿐 race를 제거하지 않습니다. transaction/constraint failure도 같은 duplicate policy로 translate합니다.",
    ],
    concepts: [
      { term: "merge policy", definition: "duplicate key의 기존/new values를 reject·선택·결합·그룹 중 어떻게 처리할지 정한 규칙입니다.", detail: ["domain semantics여야 합니다.", "encounter order 영향을 기록합니다."] },
      { term: "map supplier", definition: "collector가 결과로 만들 concrete Map의 factory입니다.", detail: ["order/implementation을 명시합니다.", "동시 collector와는 별도입니다."] },
      { term: "grouping", definition: "같은 key의 여러 values를 하나를 버리지 않고 collection/aggregate로 보존하는 reduction입니다.", detail: ["one-to-many model입니다.", "downstream collector를 선택합니다."] },
    ],
    codeExamples: [{
      id: "java-collector-duplicate-policy",
      title: "같은 rows를 reject·keep-first·keep-last·group 네 policies로 수집합니다",
      language: "java",
      filename: "CollectorDuplicatePolicy.java",
      purpose: "duplicate email data가 정책에 따라 exception, association 또는 multiplicity로 어떻게 달라지는지 결정적으로 비교합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class CollectorDuplicatePolicy {
    record User(String email, String name) { }

    public static void main(String[] args) {
        List<User> rows = List.of(
                new User("a", "Ada"), new User("b", "Bob"), new User("a", "Ann"));
        try {
            rows.stream().collect(Collectors.toMap(User::email, User::name));
        } catch (IllegalStateException exception) {
            System.out.println("reject=" + exception.getClass().getSimpleName());
        }
        Map<String, String> first = rows.stream().collect(Collectors.toMap(
                User::email, User::name, (left, right) -> left, LinkedHashMap::new));
        Map<String, String> last = rows.stream().collect(Collectors.toMap(
                User::email, User::name, (left, right) -> right, LinkedHashMap::new));
        Map<String, Long> groups = rows.stream().collect(Collectors.groupingBy(
                User::email, TreeMap::new, Collectors.counting()));

        System.out.println("keepFirst=" + first);
        System.out.println("keepLast=" + last);
        System.out.println("groups=" + groups);
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "ordered/sorted Map suppliers와 immutable User rows를 준비합니다." },
        { lines: "10-16", explanation: "a,b,a input에서 merge 없는 toMap이 duplicate a를 fail-fast합니다." },
        { lines: "18-23", explanation: "동일 encounter order에 keep-first와 keep-last merge functions를 적용해 LinkedHashMap으로 수집합니다." },
        { lines: "24-25", explanation: "groupingBy는 TreeMap key order와 counting downstream으로 duplicate multiplicity를 보존합니다." },
        { lines: "27-29", explanation: "세 successful policies의 association/count 차이를 exact output으로 비교합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "sequential ordered stream", "-Xlint:all warning0"], command: isolatedJavaRun("CollectorDuplicatePolicy.java", "CollectorDuplicatePolicy") },
      output: { value: "reject=IllegalStateException\nkeepFirst={a=Ada, b=Bob}\nkeepLast={a=Ann, b=Bob}\ngroups={a=2, b=1}", explanation: ["기본 collector는 duplicate를 거부합니다.", "두 merge functions는 a의 다른 row를 선택합니다.", "grouping은 정보 손실 없이 count2를 남깁니다."] },
      experiments: [
        { change: "LinkedHashMap supplier를 제거하고 같은 toString order를 기대합니다.", prediction: "result Map encounter order가 API상 고정되지 않아 golden이 잘못됩니다.", result: "order requirement를 supplier에 명시합니다." },
        { change: "keep-last stream을 unordered parallel로 바꿉니다.", prediction: "encounter/merge grouping을 가정한 우선순위 의미가 불분명해집니다.", result: "first/last 정책에는 ordered source와 deterministic merge contract가 필요합니다." },
        { change: "groupingBy downstream을 mapping(User::name,toList())으로 바꿉니다.", prediction: "a에 [Ada,Ann] 두 names가 보존됩니다.", result: "conflict review가 필요하면 count보다 원본 values를 보존합니다." },
      ],
      sourceRefs: ["java-map-api", "java-collectors-api", "java-stream-api", "java-linkedhashmap-api", "java-treemap-api", "jls-records"],
    }],
    diagnostics: [
      { symptom: "toMap에서 Duplicate key 예외가 난다.", likelyCause: "keyMapper가 같은 normalized key를 여러 rows에서 만들었고 merge policy가 없습니다.", checks: ["duplicate rows와 normalization을 출력합니다.", "unique invariant가 진짜인지 확인합니다.", "keep/group이 허용되는지 domain owner에게 묻습니다."], fix: "unique면 context-rich reject, 아니면 explicit merge/group policy를 사용합니다.", prevention: "empty·unique·duplicate-equal·duplicate-conflict fixtures를 둡니다." },
      { symptom: "parallel import에서 어떤 duplicate row가 남는지 달라진다.", likelyCause: "non-associative 또는 encounter-order-dependent merge를 unordered/parallel source에 사용했습니다.", checks: ["stream ordered flag와 collector characteristics를 봅니다.", "merge laws를 test합니다.", "first/last 의미를 source sequence와 연결합니다."], fix: "sequential ordered processing 또는 associative deterministic aggregate를 선택합니다.", prevention: "partition regrouping property test와 repeated parallel stress를 둡니다." },
    ],
    expertNotes: ["duplicate resolution은 data governance 정책입니다. keep-last 한 줄이 audit history를 제거할 수 있으므로 conflicting rows, source priority와 timestamp tie-break를 기록합니다.", "large grouping은 values 전체를 memory에 보존합니다. spill/database aggregation이나 streaming conflict report가 필요한 cardinality를 측정합니다."],
  },
  {
    id: "bounded-cache-loader-eviction-failure",
    title: "Map 기반 cache는 lookup보다 size·eviction·loader failure·stampede·lifecycle 계약이 핵심입니다",
    lead: "computeIfAbsent 한 줄은 무제한 성장, blocking loader, duplicate load와 stale data를 해결하지 않으므로 cache를 별도 component로 설계합니다.",
    explanations: [
      "cache key는 normalized immutable identity여야 하고 value는 stale 허용 범위와 version을 가져야 합니다. request 전체나 credential을 key에 넣으면 cardinality·retention·log 노출 문제가 생깁니다.",
      "반드시 maximum size/weight 또는 TTL 같은 bound가 있어야 합니다. 무제한 ConcurrentHashMap은 cache가 아니라 process lifetime 동안 증가하는 registry가 될 수 있습니다.",
      "LinkedHashMap access-order와 removeEldestEntry로 single-thread LRU 학습 예제를 만들 수 있지만 production concurrency, expiration, statistics, asynchronous loading과 admission policy는 검증된 cache library를 평가합니다.",
      "loader가 null을 반환하거나 예외를 던졌을 때 cache할지, negative cache TTL을 둘지, 즉시 retry할지 정합니다. 실패를 null success로 저장하면 root cause와 recovery가 사라집니다.",
      "같은 key miss가 동시에 오면 여러 loader가 실행되는 cache stampede가 발생할 수 있습니다. per-key single-flight, future placeholder, library atomic loader와 timeout/cancellation을 선택합니다.",
      "access-order get은 order mutation이므로 plain LinkedHashMap에서는 concurrent read도 안전한 read-only operation이 아닙니다. thread confinement 또는 synchronization이 필요합니다.",
      "eviction listener가 I/O나 예외를 수행하면 cache critical path를 막을 수 있습니다. callback failure isolation과 value close ownership을 정하고 metrics queue를 bounded하게 유지합니다.",
      "hit ratio만으로 cache 성공을 판단하지 않습니다. load latency/error, eviction, size/weight, stale age, stampede coalescing과 downstream protection을 함께 관찰합니다.",
    ],
    concepts: [
      { term: "eviction", definition: "capacity/admission/expiry 정책에 따라 cache association을 제거하는 과정입니다.", detail: ["business delete와 다릅니다.", "resource cleanup listener가 필요할 수 있습니다."] },
      { term: "cache stampede", definition: "같은 missing key를 여러 callers가 동시에 load해 downstream에 중복 부하를 만드는 현상입니다.", detail: ["single-flight로 완화합니다.", "failure/cancellation 공유 정책이 필요합니다."] },
      { term: "negative caching", definition: "not-found나 실패 결과를 짧은 기간 저장해 반복 load를 줄이는 정책입니다.", detail: ["failure 종류별 TTL이 필요합니다.", "복구 지연 trade-off가 있습니다."] },
    ],
    codeExamples: [{
      id: "java-bounded-lru-cache",
      title: "single-thread access-order cache의 bound, hit order, eviction과 loader failure 미저장을 검증합니다",
      language: "java",
      filename: "BoundedLruCache.java",
      purpose: "Map 기반 cache의 최소 계약을 작은 구현으로 드러내되 production concurrent cache로 오해하지 않게 scope를 제한합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

public class BoundedLruCache {
    static final class Cache<K, V> extends LinkedHashMap<K, V> {
        private static final long serialVersionUID = 1L;
        private final int maximumSize;

        Cache(int maximumSize) {
            super(16, 0.75f, true);
            if (maximumSize < 1) { throw new IllegalArgumentException("maximumSize"); }
            this.maximumSize = maximumSize;
        }

        V getOrLoad(K key, Function<? super K, ? extends V> loader) {
            V cached = get(key);
            if (cached != null) { return cached; }
            V loaded = Objects.requireNonNull(loader.apply(key), "loader result");
            put(key, loaded);
            return loaded;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maximumSize;
        }
    }

    public static void main(String[] args) {
        AtomicInteger loads = new AtomicInteger();
        Cache<String, String> cache = new Cache<>(2);
        Function<String, String> loader = key -> {
            loads.incrementAndGet();
            if (key.equals("bad")) { throw new IllegalStateException("fixture"); }
            return key.toUpperCase();
        };

        cache.getOrLoad("a", loader);
        cache.getOrLoad("b", loader);
        cache.getOrLoad("a", loader);
        cache.getOrLoad("c", loader);
        try { cache.getOrLoad("bad", loader); }
        catch (IllegalStateException exception) { System.out.println("failure=" + exception.getClass().getSimpleName()); }

        System.out.println("keys=" + cache.keySet());
        System.out.println("loads=" + loads.get());
        System.out.println("badCached=" + cache.containsKey("bad"));
        System.out.println("bounded=" + (cache.size() <= 2));
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "serializable superclass lint를 명시하고 positive maximum size를 가진 access-order LinkedHashMap을 정의합니다." },
        { lines: "12-23", explanation: "get hit는 access order를 갱신하고 loader non-null result만 put합니다." },
        { lines: "25-28", explanation: "insertion 뒤 size가 maximum을 넘으면 eldest association 하나를 제거합니다." },
        { lines: "31-39", explanation: "deterministic loader는 calls를 세고 bad key에서 명시적 failure를 냅니다." },
        { lines: "41-50", explanation: "a,b,a,c 순서로 b를 evict하고 bad failure는 저장하지 않은 채 keys/load/bound를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "single-thread only", "-Xlint:all warning0"], command: isolatedJavaRun("BoundedLruCache.java", "BoundedLruCache") },
      output: { value: "failure=IllegalStateException\nkeys=[a, c]\nloads=4\nbadCached=false\nbounded=true", explanation: ["a 재조회가 access order를 갱신해 c 삽입 때 b가 제거됩니다.", "bad loader failure는 association을 만들지 않습니다.", "성공3+실패1로 loader calls4이고 size는2 이하입니다."] },
      experiments: [
        { change: "access-order를 false로 바꿉니다.", prediction: "a hit가 순서를 갱신하지 않아 c 삽입 때 insertion eldest a가 제거됩니다.", result: "FIFO와 LRU는 다른 eviction contract입니다." },
        { change: "maximum size check를 제거합니다.", prediction: "모든 distinct keys가 process lifetime 동안 남습니다.", result: "cache에는 반드시 memory bound가 필요합니다." },
        { change: "여러 threads가 이 Cache를 동시에 호출합니다.", prediction: "access-order mutations와 loader races로 안전하지 않습니다.", result: "교육용 single-thread scope를 production concurrency로 확대하지 않습니다." },
      ],
      sourceRefs: ["java-linkedhashmap-api", "java-map-api", "java-map-entry-api", "java-objects-api", "java-atomic-integer-api"],
    }],
    diagnostics: [
      { symptom: "cache hit가 많은데 heap이 계속 증가한다.", likelyCause: "maximum size/weight/TTL이 없거나 keys cardinality가 unbounded입니다.", checks: ["cache size와 distinct key rate를 측정합니다.", "retained value graph를 봅니다.", "eviction metrics가 실제 발생하는지 확인합니다."], fix: "업무 비용에 맞는 bound/admission/expiry를 적용하고 oversized values를 제한합니다.", prevention: "load test에서 size upper bound와 eviction을 assert하고 cardinality quota를 둡니다." },
      { symptom: "하나의 hot missing key 때문에 downstream load가 폭증한다.", likelyCause: "동시 misses가 loader를 각각 실행하는 stampede입니다.", checks: ["same-key concurrent loader call count를 셉니다.", "failure/timeout 시 placeholder 제거를 봅니다.", "cache library atomic loader contract를 확인합니다."], fix: "per-key single-flight/atomic loading cache와 bounded timeout·failure sharing을 사용합니다.", prevention: "barrier를 사용한 concurrent miss stress와 loader failure/cancellation tests를 둡니다." },
    ],
    expertNotes: ["removeEldestEntry 예제는 policy를 보이는 최소 code입니다. production에서는 Caffeine 같은 검증된 library의 eviction/expiry/concurrency semantics를 요구사항과 비교하고 자체 LRU를 쉽게 만들지 않습니다.", "cache key에 tenant/auth context가 빠지면 data leakage가 생기고 지나치게 포함되면 cardinality가 폭증합니다. 보안 격리와 reuse의 균형을 schema로 검토합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...mapTransformationChapters);

const mapProductionChapters: DetailedSession["chapters"] = [
  {
    id: "concurrentmap-atomic-per-key-operations",
    title: "ConcurrentHashMap은 thread-safe access와 per-key atomic methods를 제공하지만 여러 keys transaction을 대신하지 않습니다",
    lead: "plain HashMap을 synchronized 없이 공유하는 문제를 없앤 뒤에도 check-then-act, size 기반 coordination, loader blocking과 multi-key invariant를 따로 설계해야 합니다.",
    explanations: [
      "ConcurrentHashMap은 concurrent get/update와 happens-before 관계를 문서화하고 null key/value를 허용하지 않아 null result를 absence와 명확히 연결합니다. 그러나 compound business operation 전체가 자동으로 atomic해지는 것은 아닙니다.",
      "`get` 후 계산 후 `put` 세 호출은 각각 thread-safe여도 사이에 다른 update가 끼어 lost update가 날 수 있습니다. putIfAbsent, remove(key,value), replace(old,new), compute, merge 같은 per-key atomic operations를 사용합니다.",
      "`merge(key,1,Integer::sum)`은 한 key count 증가를 원자적으로 표현하지만 mapping function이 여러 번/동시에 실행될 수 있는 세부는 implementation contract를 읽고 side-effect-free하게 만듭니다. remote I/O나 결제 같은 effect를 넣지 않습니다.",
      "두 accounts transfer, byId와 byEmail 두 indexes, global total+detail처럼 여러 keys invariant는 single per-key operation으로 묶이지 않습니다. lock ordering, immutable aggregate 한 key, database transaction 또는 actor ownership을 선택합니다.",
      "iterators와 spliterators는 weakly consistent해 construction 이후 변경 일부를 볼 수 있고 ConcurrentModificationException을 기대하지 않습니다. iteration snapshot/consistent report가 필요하면 copy/lock/versioned snapshot을 만듭니다.",
      "size, isEmpty, containsValue 같은 aggregate observation은 concurrent updates 사이의 transient state일 수 있어 coordination gate로 쓰지 않습니다. capacity metric에는 유용하지만 correctness는 atomic protocol로 만듭니다.",
      "computeIfAbsent는 concurrent cache/registry에 유용하지만 mapping function이 느리거나 recursive하면 contention과 failure가 커집니다. bounded executor, timeout, single-flight cache library와 function purity를 검토합니다.",
      "bulk parallel operations의 parallelism threshold와 common pool 사용은 운영 환경에 영향을 줍니다. blocking lambda를 넣지 않고 작은 map에서 parallel이 항상 빠르다고 가정하지 않습니다.",
    ],
    concepts: [
      { term: "thread-safe method", definition: "여러 threads가 해당 method를 호출해도 documented data structure invariants가 유지되는 operation입니다.", detail: ["여러 calls 조합의 atomicity와 다릅니다.", "visibility contract를 포함합니다."] },
      { term: "check-then-act race", definition: "상태를 확인한 뒤 행동하기 전에 다른 thread가 상태를 바꿔 판단이 stale해지는 경쟁입니다.", detail: ["containsKey+put이 대표적입니다.", "atomic map API로 줄입니다."] },
      { term: "weakly consistent iteration", definition: "동시 update와 함께 진행되며 일부 변경을 반영할 수 있지만 한 시점 snapshot을 보장하지 않는 iteration입니다.", detail: ["fail-fast가 아닙니다.", "중복 없이 진행하는 세부 contract를 API에서 확인합니다."] },
    ],
    codeExamples: [{
      id: "java-concurrent-map-atomic",
      title: "네 workers의 merge count와 conditional replace/remove, null rejection을 검증합니다",
      language: "java",
      filename: "ConcurrentMapAtomic.java",
      purpose: "per-key merge가 lost update 없이4000을 만들고 conditional methods가 stale value를 거부하는지 fresh process에서 확인합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class ConcurrentMapAtomic {
    public static void main(String[] args) throws Exception {
        ConcurrentMap<String, Integer> counts = new ConcurrentHashMap<>();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        try {
            List<Future<?>> tasks = new ArrayList<>();
            for (int worker = 0; worker < 4; worker++) {
                tasks.add(pool.submit(() -> {
                    for (int index = 0; index < 1_000; index++) {
                        counts.merge("A", 1, Integer::sum);
                    }
                }));
            }
            for (Future<?> task : tasks) { task.get(); }
        } finally {
            pool.shutdown();
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) { pool.shutdownNow(); }
        }

        Integer previous = counts.putIfAbsent("state", 1);
        boolean replaced = counts.replace("state", 1, 2);
        boolean staleRemove = counts.remove("state", 1);
        System.out.println("count=" + counts.get("A"));
        System.out.println("transition=" + previous + "," + replaced + "," + staleRemove + "," + counts.get("state"));
        try { counts.put("null", null); }
        catch (NullPointerException exception) { System.out.println("nullValue=" + exception.getClass().getSimpleName()); }
        Map<String, Integer> sorted = new TreeMap<>(counts);
        System.out.println("snapshot=" + sorted);
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "concurrent map, bounded worker pool, Future join과 deterministic snapshot types를 준비합니다." },
        { lines: "13-28", explanation: "네 workers가 같은 key에 각1000 merge를 수행하고 모든 Futures를 join한 뒤 executor를 bounded 종료합니다." },
        { lines: "30-34", explanation: "putIfAbsent는 state1을 넣고 conditional replace만2로 바꾸며 stale value1 remove는 실패합니다." },
        { lines: "35-38", explanation: "ConcurrentHashMap의 null rejection을 type으로 검증합니다." },
        { lines: "39-40", explanation: "concurrent iteration order 대신 updates 완료 후 TreeMap snapshot을 exact output에 사용합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "4 worker threads", "5-second executor termination bound", "-Xlint:all warning0"], command: isolatedJavaRun("ConcurrentMapAtomic.java", "ConcurrentMapAtomic") },
      output: { value: "count=4000\ntransition=null,true,false,2\nnullValue=NullPointerException\nsnapshot={A=4000, state=2}", explanation: ["per-key merge가 네 workers의4000 increments를 보존합니다.", "conditional transition은 stale remove를 거부합니다.", "sorted copy만 output order를 결정합니다."] },
      experiments: [
        { change: "merge를 `getOrDefault(A,0)+1` 뒤 put으로 바꿉니다.", prediction: "각 calls는 thread-safe여도 lost update로4000보다 작을 수 있습니다.", result: "compound transition에는 atomic method가 필요합니다." },
        { change: "Future.get loop를 제거하고 즉시 count를 출력합니다.", prediction: "workers 완료 전 transient total이 보일 수 있습니다.", result: "executor shutdown과 task completion join을 구분합니다." },
        { change: "A와 state를 함께 갱신해 합계 invariant를 기대합니다.", prediction: "두 per-key operations 사이를 다른 thread가 관찰할 수 있습니다.", result: "multi-key invariant에는 별도 transaction/lock/aggregate가 필요합니다." },
      ],
      sourceRefs: ["java-concurrentmap-api", "java-concurrenthashmap-api", "java-map-api", "java-treemap-api", "java-executor-service-api"],
    }],
    diagnostics: [
      { symptom: "ConcurrentHashMap counter가 예상보다 작다.", likelyCause: "get+increment+put을 분리해 lost update가 발생했습니다.", checks: ["read-modify-write 호출 sequence를 찾습니다.", "merge/compute 사용 여부를 봅니다.", "tasks completion을 join했는지 확인합니다."], fix: "per-key merge/compute 또는 LongAdder mapping을 documented contract에 맞게 사용합니다.", prevention: "barrier로 동시 시작하는 repeated exact-total stress test를 둡니다." },
      { symptom: "concurrent report가 실행마다 다른 조합을 보인다.", likelyCause: "weakly consistent iteration을 point-in-time snapshot으로 해석했습니다.", checks: ["updates와 iteration이 겹치는지 봅니다.", "report consistency 요구를 정의합니다.", "version/lock/copy boundary를 확인합니다."], fix: "updates 완료 join 후 snapshot하거나 versioned immutable state/lock을 사용합니다.", prevention: "live approximate metrics와 consistent audit report APIs를 분리합니다." },
    ],
    expertNotes: ["ConcurrentHashMap은 높은 동시성의 훌륭한 primitive지만 cache eviction, transaction, durable consistency는 제공하지 않습니다. component 이름에서 Map과 더 큰 책임을 구분합니다.", "contention hot key는 atomic correctness가 있어도 throughput 병목이 됩니다. sharding/LongAdder/aggregation interval을 workload와 정확성 요구로 측정합니다."],
  },
  {
    id: "typed-domain-key-multiple-index-consistency",
    title: "primitive obsession을 typed immutable key로 줄이고 여러 indexes는 하나의 transaction boundary에서 함께 갱신합니다",
    lead: "Map<String,Object>가 편해 보여도 key namespace·normalization·value type이 흩어지므로 record key와 domain service가 invariants를 중앙화합니다.",
    explanations: [
      "UserId, OrderId, ProductId를 모두 String으로 쓰면 argument를 바꿔 넘겨도 compile됩니다. 작은 record wrapper는 nominal type, value equals/hashCode와 constructor validation을 제공해 잘못된 key space 혼합을 줄입니다.",
      "normalization은 key construction 한 곳에서 수행합니다. trim, case folding, Unicode, leading zero와 locale 규칙을 caller마다 다르게 적용하면 논리 duplicate와 lookup miss가 생깁니다.",
      "record는 shallow value semantics입니다. String/UUID 같은 immutable scalar component가 key에 적합하며 mutable collections/arrays를 components로 쓰면 defensive copy와 custom equality가 필요합니다.",
      "byId와 byEmail 같은 secondary index를 둘 때 add/remove/update가 두 Maps를 모두 성공시키거나 모두 바꾸지 않아야 합니다. 먼저 모든 conflicts를 검사하고 single-thread/lock 안에서 갱신하거나 DB transaction을 사용합니다.",
      "email→UserId가 one-to-one인지, tag→Set<UserId>가 one-to-many인지 model을 type에 드러냅니다. `Map<String,String>` 하나로 둘을 표현하면 duplicate policy가 숨습니다.",
      "Map을 직접 반환하면 caller가 invariant를 우회할 수 있습니다. 조회 methods와 immutable snapshots를 제공하고 mutations는 service methods를 통해 validation/event/audit와 함께 수행합니다.",
      "remove는 primary value를 얻은 뒤 secondary key를 정확히 제거해야 합니다. partial failure가 가능한 external stores라면 outbox/reconciliation 또는 transactional index를 선택합니다.",
      "typed key의 toString에 raw PII/secret을 넣으면 logs와 exception에 노출됩니다. safe opaque id와 redacted display를 분리합니다.",
    ],
    concepts: [
      { term: "typed key", definition: "특정 domain namespace만 나타내는 nominal wrapper type의 Map key입니다.", detail: ["argument 혼합을 compile-time에 줄입니다.", "normalization/validation을 중앙화합니다."] },
      { term: "secondary index", definition: "primary key 외의 attribute로 entity id를 찾기 위해 유지하는 추가 Map입니다.", detail: ["one-to-one/one-to-many를 명시합니다.", "primary와 consistency가 필요합니다."] },
      { term: "primitive obsession", definition: "서로 다른 domain 의미를 모두 String/int 같은 primitive type으로 표현해 invariants가 분산되는 설계 냄새입니다.", detail: ["record wrappers로 줄일 수 있습니다.", "serialization boundary adapter가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-domain-map-index",
      title: "UserId record와 byId/byEmail indexes의 reject-before-write·paired remove를 구현합니다",
      language: "java",
      filename: "DomainMapIndex.java",
      purpose: "typed key normalization과 두 Map invariant가 public mutation methods 안에서 함께 유지되는지 실행합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

public class DomainMapIndex {
    record UserId(String value) {
        UserId {
            value = Objects.requireNonNull(value).trim();
            if (value.isEmpty()) { throw new IllegalArgumentException("empty id"); }
        }
    }

    record User(UserId id, String email, String name) {
        User {
            Objects.requireNonNull(id);
            email = Objects.requireNonNull(email).trim().toLowerCase(Locale.ROOT);
            name = Objects.requireNonNull(name).trim();
        }
    }

    static final class Directory {
        private final Map<UserId, User> byId = new LinkedHashMap<>();
        private final Map<String, UserId> byEmail = new LinkedHashMap<>();

        void add(User user) {
            if (byId.containsKey(user.id()) || byEmail.containsKey(user.email())) {
                throw new IllegalArgumentException("duplicate user");
            }
            byId.put(user.id(), user);
            byEmail.put(user.email(), user.id());
        }

        User find(UserId id) { return byId.get(id); }
        void remove(UserId id) {
            User removed = byId.remove(id);
            if (removed != null) { byEmail.remove(removed.email(), id); }
        }
        int idSize() { return byId.size(); }
        int emailSize() { return byEmail.size(); }
        List<String> ids() { return byId.keySet().stream().map(UserId::value).toList(); }
    }

    public static void main(String[] args) {
        Directory directory = new Directory();
        directory.add(new User(new UserId(" U1 "), "ADA@EXAMPLE.COM", "Ada"));
        directory.add(new User(new UserId("U2"), "bob@example.com", "Bob"));
        try { directory.add(new User(new UserId("U3"), "ada@example.com", "Other")); }
        catch (IllegalArgumentException exception) { System.out.println("duplicate=" + exception.getClass().getSimpleName()); }

        System.out.println("lookup=" + directory.find(new UserId("U1")).name());
        directory.remove(new UserId("U1"));
        System.out.println("sizes=" + directory.idSize() + "," + directory.emailSize());
        System.out.println("ids=" + directory.ids());
    }
}`,
      walkthrough: [
        { lines: "1-13", explanation: "UserId record가 null/whitespace를 중앙 validation하고 normalized immutable String component를 저장합니다." },
        { lines: "15-21", explanation: "User record는 id, Locale.ROOT email normalization과 non-null name을 construction boundary에 둡니다." },
        { lines: "23-34", explanation: "Directory add는 두 indexes conflicts를 모두 확인한 뒤 둘을 갱신해 duplicate email이 partial primary write를 만들지 않게 합니다." },
        { lines: "36-44", explanation: "remove는 primary entity에서 email을 얻어 conditional secondary remove를 하고 sizes/safe ids projection을 제공합니다." },
        { lines: "45-57", explanation: "normalized duplicate를 거부한 뒤 equivalent typed key lookup, paired remove와 remaining U2를 검증합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "single-thread directory ownership", "-Xlint:all warning0"], command: isolatedJavaRun("DomainMapIndex.java", "DomainMapIndex") },
      output: { value: "duplicate=IllegalArgumentException\nlookup=Ada\nsizes=1,1\nids=[U2]", explanation: ["case-normalized duplicate email U3는 두 indexes 변경 전에 거부됩니다.", "trim된 새 UserId U1은 기존 user를 찾습니다.", "paired remove 뒤 primary/secondary sizes가 모두1입니다."] },
      experiments: [
        { change: "add가 byId.put 뒤 duplicate email을 검사하게 합니다.", prediction: "exception 후 byId에 U3만 남는 partial index corruption이 생깁니다.", result: "모든 preconditions를 write 전에 확인하거나 transaction rollback을 사용합니다." },
        { change: "email lower-case에서 Locale.ROOT를 제거하고 default locale을 씁니다.", prediction: "host locale에 따라 canonical key가 달라질 수 있습니다.", result: "machine-independent identifier normalization에는 explicit locale/rules가 필요합니다." },
        { change: "Directory maps를 직접 반환합니다.", prediction: "caller가 secondary index 없이 primary만 수정해 invariant를 우회할 수 있습니다.", result: "encapsulation과 immutable projection을 유지합니다." },
      ],
      sourceRefs: ["java-map-api", "java-linkedhashmap-api", "java-objects-api", "jls-records", "java-locale-api", "java-stream-api"],
    }],
    diagnostics: [
      { symptom: "byId에는 user가 있는데 email lookup은 없거나 다른 id를 가리킨다.", likelyCause: "두 indexes를 서로 다른 code paths/transactions에서 갱신해 partial failure가 생겼습니다.", checks: ["add/update/remove sequence를 audit합니다.", "duplicate 검사 시점과 rollback을 봅니다.", "reconciliation count를 비교합니다."], fix: "하나의 transaction/lock/service method에서 prevalidate 후 paired update하고 손상 index를 primary source에서 rebuild합니다.", prevention: "모든 entity에 대해 forward/reverse consistency property를 검증합니다." },
      { symptom: "같은 email인데 case/space에 따라 duplicate로 잡히지 않는다.", likelyCause: "key normalization이 caller별로 다르거나 locale-dependent합니다.", checks: ["raw/canonical key를 안전하게 비교합니다.", "Locale.ROOT/Unicode policy를 확인합니다.", "migration 전 data를 inventory합니다."], fix: "typed canonical key factory를 단일 경계로 만들고 existing data를 migrate합니다.", prevention: "case·space·Unicode variants property fixtures와 DB canonical unique index를 둡니다." },
    ],
    expertNotes: ["in-memory two-map precheck는 single-thread 예제에서만 atomic합니다. concurrent mutation에는 lock/immutable snapshot, durable multi-process에는 database transaction/constraint가 필요합니다.", "secondary index rebuildability를 설계하면 장애 복구가 쉬워집니다. primary source, version, rebuild 중 read policy와 validation checksum을 정합니다."],
  },
  {
    id: "map-verification-performance-abuse",
    title: "Map은 state-machine oracle·collision·null·order·concurrency·benchmark·cardinality abuse를 층별로 검증합니다",
    lead: "몇 개 example key가 맞는다는 확인에서 멈추지 않고 operation sequence와 invariants를 독립 model로 비교하며, 성능과 보안은 realistic cardinality에서 측정합니다.",
    explanations: [
      "stateful property test는 put/remove/get sequence마다 이전 return, size, containsKey와 values를 independent oracle과 비교합니다. production Map helper와 같은 implementation을 expected 계산에 재사용하지 않습니다.",
      "null-supporting Map은 absent, present-null, present-value 세 partitions를 모두 테스트합니다. null-free wrapper/ConcurrentHashMap/Map.of는 construction/write rejection을 별도 negative path로 둡니다.",
      "custom key tests는 equal pair hash equality, unequal pair, intentional collision, mutable input copy와 comparator0 consistency를 포함합니다. collisions가 있어도 associations가 모두 retrieval돼야 합니다.",
      "order-sensitive tests는 implementation contract가 있는 LinkedHashMap/TreeMap/EnumMap에만 exact sequence를 적용하고 HashMap은 normalized pairs로 비교합니다.",
      "concurrency test는 barrier로 simultaneous operations를 시작하고 Future를 모두 join하며 exact per-key total, stale conditional transition과 no-hang을 반복 검증합니다. stress 통과가 formal proof는 아니지만 race detection을 강화합니다.",
      "microbenchmark는 JMH warmup·fork·Blackhole/result consumption과 parameterized sizes/hit ratio/hash quality를 사용합니다. 한 번의 nanoTime이나 println 포함 loop로 HashMap/TreeMap을 결론내리지 않습니다.",
      "OpenJDK HashMap capacity/bin/tree behavior는 implementation study와 profiling에 유용하지만 public API guarantee로 문서화하지 않습니다. 지원 JDK별 measurements와 regression threshold를 남깁니다.",
      "untrusted keys의 distinct cardinality, value size, nesting과 retention time을 제한하지 않으면 memory/CPU denial이 가능합니다. tenant quota, request bound, eviction과 safe metrics를 적용하고 secrets/PII를 key/message에 노출하지 않습니다.",
      "serialization/wire order와 Java Map order를 분리합니다. duplicate JSON keys의 parser policy도 reject/keep-first/last가 다를 수 있어 boundary에서 explicit schema validation을 수행합니다.",
    ],
    concepts: [
      { term: "reference model", definition: "검증 대상과 독립적인 단순 state representation으로 operations expected를 계산하는 oracle입니다.", detail: ["작은 key domain arrays가 유용합니다.", "같은 helper 재사용을 피합니다."] },
      { term: "collision fixture", definition: "서로 다른 keys가 의도적으로 같은 hashCode를 갖게 해 equals fallback과 association 보존을 검증하는 input입니다.", detail: ["correctness와 performance를 분리합니다.", "constant hash를 production에 쓰지 않습니다."] },
      { term: "cardinality abuse", definition: "공격자/오류가 매우 많은 distinct keys를 만들어 Map memory와 processing을 고갈시키는 위험입니다.", detail: ["quota와 bound가 필요합니다.", "cache/registry 모두 해당합니다."] },
    ],
    codeExamples: [{
      id: "java-map-verification-matrix",
      title: "500 deterministic operations를 array oracle과 비교하고50 collision keys·null partitions를 검증합니다",
      language: "java",
      filename: "MapVerificationMatrix.java",
      purpose: "Map implementation을 다른 Map으로 검증하지 않고 fixed small-domain arrays로 이전 return·presence·value·size를 매 step 비교합니다.",
      code: String.raw`import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Random;

public class MapVerificationMatrix {
    static final class CollisionKey {
        private final int id;
        CollisionKey(int id) { this.id = id; }
        @Override public int hashCode() { return 1; }
        @Override public boolean equals(Object other) {
            return other instanceof CollisionKey key && id == key.id;
        }
    }

    static void require(boolean condition, String label) {
        if (!condition) { throw new AssertionError(label); }
    }

    public static void main(String[] args) {
        Map<Integer, Integer> actual = new HashMap<>();
        Integer[] values = new Integer[10];
        boolean[] present = new boolean[10];
        Random random = new Random(20_260_713L);
        for (int step = 0; step < 500; step++) {
            int key = random.nextInt(10);
            if (random.nextBoolean()) {
                int value = random.nextInt(100);
                Integer previous = actual.put(key, value);
                require(Objects.equals(previous, present[key] ? values[key] : null), "put previous");
                values[key] = value; present[key] = true;
            } else {
                Integer removed = actual.remove(key);
                require(Objects.equals(removed, present[key] ? values[key] : null), "remove previous");
                values[key] = null; present[key] = false;
            }
            int size = 0;
            for (int candidate = 0; candidate < 10; candidate++) {
                require(actual.containsKey(candidate) == present[candidate], "presence");
                require(Objects.equals(actual.get(candidate), values[candidate]), "value");
                if (present[candidate]) { size++; }
            }
            require(actual.size() == size, "size");
        }

        Map<CollisionKey, Integer> collisions = new HashMap<>();
        for (int id = 0; id < 50; id++) { collisions.put(new CollisionKey(id), id); }
        for (int id = 0; id < 50; id++) { require(collisions.get(new CollisionKey(id)) == id, "collision"); }
        Map<String, Integer> nullable = new HashMap<>();
        nullable.put("present", null);
        require(nullable.containsKey("present") && !nullable.containsKey("absent"), "null partitions");

        System.out.println("operations=500,stateMatches=true");
        System.out.println("collisionLookups=" + collisions.size());
        System.out.println("nullPartitions=true");
        System.out.println("hashOrderCompared=false");
    }
}`,
      walkthrough: [
        { lines: "1-14", explanation: "constant hash지만 id equality가 다른 CollisionKey로 collision correctness fixture를 만듭니다." },
        { lines: "16-18", explanation: "모든 invariant failure가 semantic label을 가진 즉시 assertion이 되게 합니다." },
        { lines: "20-42", explanation: "10-key independent arrays와 fixed-seed operation sequence로 put/remove 이전값, presence, value, size를500 steps마다 비교합니다." },
        { lines: "44-46", explanation: "같은 hash를 가진50 keys를 새 equivalent instances로 모두 조회해 collision에서도 association을 보존함을 확인합니다." },
        { lines: "47-50", explanation: "HashMap present-null과 absent partitions를 containsKey로 분리합니다." },
        { lines: "52-55", explanation: "random final contents/order가 아닌 수행량과 invariant booleans만 stable output으로 남깁니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fixed seed", "-Xlint:all warning0"], command: isolatedJavaRun("MapVerificationMatrix.java", "MapVerificationMatrix") },
      output: { value: "operations=500,stateMatches=true\ncollisionLookups=50\nnullPartitions=true\nhashOrderCompared=false", explanation: ["500 operations의 every-step state가 independent arrays와 같습니다.", "constant-hash50 keys도 equals로 모두 구분됩니다.", "null presence와 HashMap order policy를 별도로 확인합니다."] },
      experiments: [
        { change: "oracle를 두 번째 HashMap과 같은 helper로 계산합니다.", prediction: "helper bug가 actual과 expected에 함께 들어가 test가 거짓 통과할 수 있습니다.", result: "다른 representation인 arrays/booleans를 유지합니다." },
        { change: "CollisionKey.equals가 항상 true를 반환하게 합니다.", prediction: "size가1이 되고 retrieval invariant가 실패합니다.", result: "collision과 equality를 구분하는 fixture가 contract bug를 잡습니다." },
        { change: "nanoTime 한 번으로 collision/non-collision 성능을 비교합니다.", prediction: "warmup·JIT·GC noise로 결론이 흔들립니다.", result: "JMH parameterized benchmark를 별도 artifact로 만듭니다." },
      ],
      sourceRefs: ["java-map-api", "java-hashmap-api", "java-object-api", "java-objects-api", "java-random-api", "jmh-project", "openjdk-hashmap-source"],
    }],
    diagnostics: [
      { symptom: "Map tests coverage는 높은데 duplicate/null/order regression을 놓친다.", likelyCause: "example input 몇 개와 같은 implementation oracle만 사용했습니다.", checks: ["absent/present-null/present-value partitions를 봅니다.", "operation sequence와 previous return을 검증하는지 확인합니다.", "unordered output을 어떻게 비교하는지 봅니다."], fix: "independent state model, boundary partitions와 collision/order-specific properties를 추가합니다.", prevention: "mutation testing으로 containsKey 제거·merge 교체·order assumption을 주입합니다." },
      { symptom: "Map benchmark 결과가 실행마다 뒤집힌다.", likelyCause: "warmup/forks/result consumption 없이 작은 nanoTime loop나 logging을 측정했습니다.", checks: ["JMH 사용을 확인합니다.", "size/hit ratio/hash distribution을 parameterize했는지 봅니다.", "allocation/GC profiler를 확인합니다."], fix: "JMH와 realistic workload/forks/profilers를 사용하고 semantic equality를 먼저 검증합니다.", prevention: "benchmark source/config/JDK/hardware metadata와 confidence interval을 보존합니다." },
    ],
    expertNotes: ["fixed Random seed는 reproducibility를 주지만 generator quality를 완전히 증명하지 않습니다. property framework의 shrunk counterexample와 seed/version도 저장합니다.", "adversarial cardinality는 hash collision뿐 아니라 정상적으로 분산된 millions of keys로도 memory를 고갈시킵니다. capacity bound와 admission control이 핵심입니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...mapProductionChapters);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "put이 null을 반환하면 항상 새 key였나요?", answer: "null value를 허용하면 기존 present-null 교체도 null이므로 containsKey 또는 null-free invariant가 필요합니다." },
  { question: "getOrDefault는 present-null에 default를 반환하나요?", answer: "아닙니다. key가 존재하고 value가 null이면 null을 반환합니다." },
  { question: "size를 numeric key loop 상한으로 쓰면 왜 안 되나요?", answer: "Map keys는 contiguous index가 아니어서 sparse/negative/string keys를 누락하거나 없는 key를 조회합니다." },
  { question: "equals가 true면 hashCode는 어떤 관계여야 하나요?", answer: "반드시 같아야 합니다. 같은 hash가 equals true를 뜻하는 반대 명제는 아닙니다." },
  { question: "record key면 deep immutable한가요?", answer: "아닙니다. components가 mutable reference면 referent는 바뀔 수 있어 scalar/defensive copy가 필요합니다." },
  { question: "keySet은 원본 Map과 독립인가요?", answer: "보통 backed view라 지원되는 remove/clear가 Map associations를 바꿉니다." },
  { question: "entrySet을 keySet+get보다 먼저 고려하는 이유는 무엇인가요?", answer: "key와 value association을 직접 제공해 의도를 표현하고 추가 lookup을 피합니다." },
  { question: "values.remove는 duplicate values를 모두 제거하나요?", answer: "일반 remove는 일치 association 하나를 제거할 수 있으며 모두 제거하려면 별도 bulk policy가 필요합니다." },
  { question: "LinkedHashMap에서 access-order는 get에도 영향을 받나요?", answer: "예. access-order mode에서는 get 같은 접근이 encounter order를 바꿀 수 있습니다." },
  { question: "TreeMap에서 comparator0은 무엇을 뜻하나요?", answer: "Map key 관점에서 같은 sorted key라 put이 이전 association을 교체합니다." },
  { question: "EnumMap은 언제 적합한가요?", answer: "한 enum type의 닫힌 key domain과 enum declaration order가 의미 있을 때 적합합니다." },
  { question: "unmodifiableMap과 Map.copyOf의 가장 큰 차이는 무엇인가요?", answer: "전자는 backing mutation을 보는 live wrapper이고 후자는 current associations의 unmodifiable snapshot입니다." },
  { question: "Map.copyOf는 values까지 deep copy하나요?", answer: "아닙니다. key/value references의 shallow structural snapshot입니다." },
  { question: "Map.of argument order를 iteration order로 믿어도 되나요?", answer: "안 됩니다. order contract가 필요하면 ordered representation을 사용합니다." },
  { question: "computeIfAbsent mapper가 null을 반환하면 key가 생기나요?", answer: "아닙니다. non-null 결과만 mapping됩니다." },
  { question: "compute remapper null은 어떤 의미인가요?", answer: "association removal 또는 absence 유지 의미이므로 domain failure null과 혼동하면 안 됩니다." },
  { question: "mapping function 안에서 remote I/O를 바로 해도 되나요?", answer: "contention·duplicate call·reentrancy·timeout을 고려해야 하며 cache/library와 idempotent bounded loader가 더 적합할 수 있습니다." },
  { question: "Collectors.toMap은 duplicate key를 기본으로 덮어쓰나요?", answer: "아닙니다. merge 없는 overload는 IllegalStateException으로 거부합니다." },
  { question: "keep-first merge가 deterministic하려면 무엇이 필요한가요?", answer: "의미 있는 ordered source와 그 encounter order가 우선순위라는 contract가 필요합니다." },
  { question: "duplicate values를 모두 보존하려면 무엇을 쓰나요?", answer: "groupingBy 또는 aggregate merge로 Map<K,List/Set/aggregate>를 만듭니다." },
  { question: "Map 기반 cache에 최소한 어떤 bound가 필요한가요?", answer: "maximum size/weight 또는 TTL 등 process memory와 retention을 제한하는 정책이 필요합니다." },
  { question: "access-order LinkedHashMap은 concurrent read-safe한가요?", answer: "아닙니다. get도 order mutation이 될 수 있어 thread confinement/synchronization이 필요합니다." },
  { question: "cache stampede란 무엇인가요?", answer: "같은 missing key의 concurrent callers가 loader를 각각 실행해 downstream 부하를 증폭하는 현상입니다." },
  { question: "ConcurrentHashMap에서 get+put 조합은 atomic한가요?", answer: "각 call은 thread-safe지만 조합은 atomic하지 않아 merge/compute/conditional methods를 사용합니다." },
  { question: "ConcurrentHashMap iterator는 point-in-time snapshot인가요?", answer: "아닙니다. weakly consistent해 동시 변경 일부를 볼 수 있습니다." },
  { question: "ConcurrentHashMap size를 lock-free 작업 gate로 써도 되나요?", answer: "concurrent update 중 transient observation일 수 있어 correctness gate에는 원자 protocol이 필요합니다." },
  { question: "두 Map indexes를 일관되게 유지하려면 무엇이 필요한가요?", answer: "single ownership/lock 또는 durable transaction 안에서 prevalidate 후 함께 갱신해야 합니다." },
  { question: "typed record key의 장점은 무엇인가요?", answer: "다른 String key spaces 혼합을 줄이고 normalization·validation·value equality를 한 곳에 둡니다." },
  { question: "Map property test의 oracle로 같은 Map helper를 써도 되나요?", answer: "동일 버그가 복제될 수 있어 arrays/records 같은 독립 representation이 낫습니다." },
  { question: "HashMap 성능을 nanoTime 한 번으로 비교해도 되나요?", answer: "안 됩니다. JMH warmup·fork·result consumption과 realistic parameters가 필요합니다." },
);

(session.completionChecklist as string[]).push(
  "put의 previous return과 overwrite 후 size를 함께 검증했다.",
  "absent·present-null·present-value 세 lookup states를 분리했다.",
  "getOrDefault가 present-null을 숨기지 않음을 설명했다.",
  "remove(key,value)의 stale guard 의미를 실행했다.",
  "containsValue를 reverse index 대용으로 무분별하게 쓰지 않았다.",
  "equals true이면 hashCode가 같다는 방향을 정확히 설명했다.",
  "같은 hash가 equals true를 뜻하지 않음을 collision fixture로 보였다.",
  "membership 중 key equality/hash state를 변경하지 않았다.",
  "record component의 shallow immutability caveat를 점검했다.",
  "business key에서 mutable display attributes를 제외했다.",
  "keySet·values·entrySet이 backed views임을 설명했다.",
  "key/value 동시 처리에는 entrySet을 기본으로 사용했다.",
  "순회 구조 변경에 iterator.remove 또는 명시적 bulk method를 사용했다.",
  "values duplicate multiplicity와 remove-one semantics를 검증했다.",
  "view 노출 시 live/immutable snapshot 계약을 명시했다.",
  "HashMap encounter order를 wire/UI/storage contract로 사용하지 않았다.",
  "LinkedHashMap insertion order와 access order를 구분했다.",
  "TreeMap comparator0이 key uniqueness를 결정함을 검증했다.",
  "NavigableMap floor/ceiling과 range view bounds를 설명했다.",
  "EnumMap key domain과 enum order 선택 근거를 제시했다.",
  "mutable structural copy가 values deep copy가 아님을 설명했다.",
  "unmodifiable live view와 copyOf snapshot을 source mutation으로 비교했다.",
  "Map.copyOf/of의 null·duplicate·order contracts를 확인했다.",
  "safe publication과 unmodifiable collection을 같은 개념으로 취급하지 않았다.",
  "computeIfAbsent mapper null/throw paths를 정의했다.",
  "compute·merge의 null-as-removal semantics를 검증했다.",
  "mapping function에서 recursive Map mutation과 blocking effect를 피했다.",
  "ConcurrentMap override의 atomicity를 Map default와 구분했다.",
  "Collectors.toMap duplicate reject를 실행했다.",
  "keep-first·keep-last의 encounter-order dependency를 기록했다.",
  "grouping policy가 duplicate multiplicity를 보존함을 보였다.",
  "collector result order가 필요할 때 map supplier를 명시했다.",
  "cache maximum size/weight/TTL 중 적어도 하나를 정의했다.",
  "cache loader null·failure·retry·negative caching 정책을 명시했다.",
  "same-key concurrent miss의 stampede policy를 검토했다.",
  "cache key에 tenant/auth context와 cardinality bound를 검토했다.",
  "ConcurrentHashMap merge로 exact per-key total을 검증했다.",
  "get+put check-then-act race를 atomic method로 교체했다.",
  "Future completion join과 executor shutdown을 모두 수행했다.",
  "weakly consistent iteration을 snapshot으로 설명하지 않았다.",
  "multi-key invariant에 lock/transaction/aggregate를 사용했다.",
  "typed key constructor에 canonical normalization과 validation을 뒀다.",
  "primary·secondary indexes를 reject-before-write로 함께 갱신했다.",
  "secondary index remove와 rebuild consistency를 검증했다.",
  "500-step independent state-machine oracle를 통과했다.",
  "collision50 keys와 null partitions를 별도로 검증했다.",
  "JMH 없이 microbenchmark 결론을 내리지 않았다.",
  "untrusted key cardinality·value size·retention에 bounds를 뒀다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-atomic-integer-api", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["deterministic loader count", "atomic observations"], evidence: "cache loader calls와 concurrency fixture 관찰 근거입니다." },
  { id: "java-executor-service-api", repository: "Java SE 21 API", path: "java.util.concurrent.ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["worker submission", "Future join", "bounded shutdown"], evidence: "concurrent map exact-total 실행 lifecycle 근거입니다." },
  { id: "java-locale-api", repository: "Java SE 21 API", path: "java.util.Locale", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html", usedFor: ["Locale.ROOT canonical key"], evidence: "machine-independent email case normalization 근거입니다." },
  { id: "java-random-api", repository: "Java SE 21 API", path: "java.util.Random", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html", usedFor: ["fixed-seed operation sequence"], evidence: "reproducible state-machine input generator 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "Map association/null, key equality, views, ordering, ownership, default methods, collectors, cache, concurrency, typed index와 verification을 Java SE21 contracts로 확장했습니다.",
  "모든 synthetic Java examples는 --release21 -proc:none -Xlint:all compiler output0와 exact stable stdout을 요구합니다.",
  "HashMap implementation 관찰은 OpenJDK source로 보조하되 public encounter order/bin internals로 승격하지 않았습니다.",
  "concurrent exact total은 workers4×1000 Future join과 sorted snapshot으로 검증하고 thread names/order를 golden에서 제외했습니다.",
);
