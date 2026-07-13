import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-08-stream"],
  slug: "core-08-stream",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 28,
  title: "Stream 파이프라인·지연 평가",
  subtitle: "컬렉션을 반복하는 문법을 넘어 source·중간·최종 연산의 수요 기반 실행, 단일 소비, 순서·부작용·병렬성 계약을 실행으로 검증합니다.",
  level: "고급",
  estimatedMinutes: 900,
  coreQuestion: "Stream 파이프라인은 언제 어떤 원소를 얼마나 처리하며, 같은 결과를 유지하면서 지연 평가·순서·상태·자원·병렬 실행 위험을 어떻게 통제할까요?",
  summary: "inventory direct4인 javastudy2 class12 Ex07_StreamClass·Ex08_StreamClass·Ex09_StreamClass·Ex10_Stream과 package 전체 Ex01~Ex10을 읽고 OpenJDK21에서 분리 감사합니다. Ex07은 배열5와 List5를 object stream으로 만들어 이름 suffix를 붙인 exact10행, Ex08은 boxed Stream<Integer>의 곱 exact5행과 count5개, 세 개의 독립 IntStream에서 count5·sum15·OptionalDouble[3.0]을 출력합니다. Ex09는 source encounter order, natural ascending, reverse order를 tab-preserving exact3행으로 보여 주고 Ex10은 원본13개·distinct5개·even6개·even-distinct2개·limit3개·skip10개를 trailing-space까지 고정합니다. package10/direct4를 별도 classes에 warning0로 compile하고 runnable companions Ex03·Ex05·Ex06도 회귀 확인하며, baseline과 네 launcher-option 환경변수 hostile mode에서 동일한 fresh-JVM 결과를 요구합니다. 그 실행 근거 위에서 stream이 data structure가 아닌 single-use traversal이라는 모델, lazy fusion·short circuit, object/primitive sources와 boxing, filter/map, distinct/sorted와 encounter order, limit/skip/takeWhile/dropWhile, terminal reduction과 Optional, mutable reduction, non-interference·stateless behavior·peek, parallel associativity·ordering·blocking 위험, Files.lines ownership, compiler/runtime/performance 검증까지 확장합니다.",
  objectives: [
    "원본 class12 package10·direct4를 warning0로 분리 compile하고 일곱 runnable mains의 exact stdout·stderr·exit를 fresh JVM에서 재현한다.",
    "Stream을 저장소가 아닌 single-use traversal pipeline으로 설명하고 intermediate·terminal·lazy·short-circuit 실행 시점을 trace한다.",
    "collection·object array·primitive array·range·builder sources와 Stream<T>·IntStream의 boxing·terminal 차이를 선택한다.",
    "filter·map·distinct·sorted·limit·skip·takeWhile·dropWhile의 encounter-order와 stateful 비용을 데이터 계약에 맞게 조합한다.",
    "count·sum·average·min·max·findFirst·findAny·match·reduce·collect의 empty·identity·Optional 계약을 검증한다.",
    "non-interference·stateless lambda·side-effect 격리·peek 진단 한계를 적용하고 원본 collection 변경과 stream 재사용 오류를 진단한다.",
    "parallel stream의 associativity·ordering·shared-state·blocking·common-pool 위험과 resource-backed stream close 책임을 운영 기준으로 결정한다.",
  ],
  prerequisites: [
    { title: "함수형 인터페이스·lambda·메서드 참조", reason: "Stream 중간 연산은 Predicate·Function·Consumer 등 behavior parameter의 target typing, capture와 side-effect 규칙을 전제로 합니다.", sessionSlug: "core-07-lambda" },
    { title: "List·Stack·Queue", reason: "stream source인 collections의 encounter order, mutability, iterator와 snapshot/view 차이를 알아야 non-interference와 결과 순서를 해석할 수 있습니다.", sessionSlug: "core-05-list-stack-queue" },
  ],
  keywords: ["Stream", "IntStream", "pipeline", "lazy evaluation", "intermediate operation", "terminal operation", "short circuit", "single use", "encounter order", "filter", "map", "distinct", "sorted", "limit", "skip", "takeWhile", "dropWhile", "reduce", "collect", "Optional", "non-interference", "stateless", "peek", "parallel stream", "Files.lines"],
  chapters: [
    {
      id: "class12-stream-original-golden-audit",
      title: "class12 package10·direct4를 분리 compile하고 Stream 원본 일곱 mains를 fresh JVM exact output으로 감사합니다",
      lead: "눈으로 보이는 forEach 결과뿐 아니라 single-use를 위해 stream을 다시 만드는 source shape, primitive terminal과 tab·trailing-space까지 원본 회귀 계약으로 고정합니다.",
      explanations: [
        "class12에는 Java files10개가 있습니다. Ex01·Ex02·Ex04는 lambda 설명·functional interfaces이고 Ex03·Ex05·Ex06·Ex07·Ex08·Ex09·Ex10 일곱 files가 public main을 가집니다. direct stream inventory Ex07~Ex10은 서로 source dependency가 없어 별도 compile 가능합니다.",
        "Ex07은 String array5를 Stream.of로, ArrayList5를 stream으로 바꿔 각 이름 뒤에 ‘님’을 붙입니다. encounter order가 보존되어 배열5 다음 list5의 exact10행입니다.",
        "Ex08은 Integer[] object stream을 forEach로 한 번 소비한 뒤 다시 Arrays.stream을 생성해 count합니다. 같은 s1 variable에 새 stream을 대입하는 것과 이미 소비한 stream instance를 재사용하는 것은 다릅니다. int[]에서는 count·sum·average 각각을 위해 IntStream을 세 개 생성합니다.",
        "Ex09는 Tomas·Edward·Jack insertion order, natural order Edward·Jack·Tomas, Comparator.reverseOrder Tomas·Jack·Edward를 tab separator로 출력합니다. 정렬 결과가 deterministic이어도 trailing tabs를 무시해 source behavior를 바꾸지 않습니다.",
        "Ex10의 IntStream13개는 원본, distinct, even filter, even+distinct, limit3, skip3 결과를 여섯 줄로 출력합니다. distinct는 첫 encounter를 보존하고 filter 뒤 duplicates는 남으며, limit/skip은 encounter prefix 기준입니다.",
        "audit는 package10과 direct4를 서로 다른 output directories에서 -encoding UTF-8 --release 21 -proc:none -Xlint:all로 compile합니다. 네 Java launcher-option variables를 parent에서 baseline/hostile로 바꾸더라도 child ProcessStartInfo.Environment에서 제거합니다.",
        "각 main은 explicit temp working directory, redirected UTF-8 stdout/stderr, closed stdin, 10초 timeout, process-tree kill, 5초 termination grace와 async drain을 가진 fresh JVM입니다. finally에서 process를 Dispose하고 원래 환경의 존재 여부와 값을 복원한 뒤 OS temp direct child만 삭제합니다.",
      ],
      concepts: [
        { term: "golden process contract", definition: "source compile 옵션과 process stdin·stdout·stderr·exit·timeout을 한 case의 관찰 계약으로 고정한 검증입니다.", detail: ["공백 경로에서도 실행합니다.", "line·tab·trailing-space를 의도적으로 구분합니다."] },
        { term: "direct inventory", definition: "이 세션의 중심 근거로 지정된 Ex07~Ex10 네 source files입니다.", detail: ["package companions와 분리 compile합니다.", "각 source의 실제 실행을 사용합니다."] },
        { term: "launcher isolation", definition: "JDK/JAVA option environment가 javac/java 출력·동작을 몰래 바꾸지 못하게 child environment에서 제거하는 절차입니다.", detail: ["baseline과 hostile을 비교합니다.", "parent 값을 finally 복원합니다."] },
      ],
      codeExamples: [{
        id: "ps-class12-stream-original-audit",
        title: "package10·direct4 warning0와 일곱 main exact output을 baseline+hostile4에서 검증합니다",
        language: "powershell",
        filename: "verify-original-core08.ps1",
        purpose: "원본 Stream source·single-use·primitive terminal·ordering·slicing behavior를 source shape와 process contract로 보존합니다.",
        code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference = 'Stop'
$optionNames = @('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved = @{}
foreach ($name in $optionNames) {
  $item = Get-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
  $saved[$name] = @{ Exists = $null -ne $item; Value = if ($item) { $item.Value } else { $null } }
}
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core08 audit " + [Guid]::NewGuid().ToString('N'))
$ownsRoot = $false
$bodyError = $null

function Normalize([string]$text) {
  $crlf = [string]([char]13) + [char]10
  $lf = [string]([char]10)
  return $text.Replace($crlf, $lf)
}
function Invoke-Child([string]$file, [string[]]$arguments, [string]$workingDirectory) {
  $psi = [Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $file
  $psi.WorkingDirectory = $workingDirectory
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [Text.UTF8Encoding]::new($false)
  $psi.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
  foreach ($arg in $arguments) { [void]$psi.ArgumentList.Add($arg) }
  foreach ($name in $optionNames) { [void]$psi.Environment.Remove($name) }
  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $psi
  try {
    if (-not $process.Start()) { throw 'process start failed' }
    $outTask = $process.StandardOutput.ReadToEndAsync()
    $errTask = $process.StandardError.ReadToEndAsync()
    $process.StandardInput.Close()
    if (-not $process.WaitForExit(10000)) {
      $process.Kill($true)
      if (-not $process.WaitForExit(5000)) { throw 'termination grace exceeded' }
      [void]$outTask.GetAwaiter().GetResult(); [void]$errTask.GetAwaiter().GetResult()
      throw 'runtime timeout'
    }
    $stdout = $outTask.GetAwaiter().GetResult()
    $stderr = $errTask.GetAwaiter().GetResult()
    return @{ Exit = $process.ExitCode; Out = (Normalize $stdout); Err = (Normalize $stderr) }
  } finally { $process.Dispose() }
}
function Assert-Exact($actual, [string]$expected, [string]$name) {
  if ($actual.Exit -ne 0 -or $actual.Err.Length -ne 0 -or $actual.Out -cne $expected) {
    throw "$name mismatch exit=$($actual.Exit) stderr=$($actual.Err) stdout=$($actual.Out)"
  }
}
function Compile([IO.FileInfo[]]$files, [string]$classes) {
  New-Item -ItemType Directory -Path $classes | Out-Null
  $args = @('-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-d',$classes)
  $args += @($files.FullName)
  $result = Invoke-Child 'javac' $args $root
  if ($result.Exit -ne 0 -or $result.Out.Length -ne 0 -or $result.Err.Length -ne 0) { throw 'compile failed or warned' }
}
function Run([string]$classes, [string]$simpleName) {
  return Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,("com.java.class12." + $simpleName)) $root
}
function Audit([string]$mode, [string]$classDir) {
  if ($mode -eq 'hostile') {
    $env:JDK_JAVAC_OPTIONS = '-J-Dcore08.audit=javac'
    $env:JDK_JAVA_OPTIONS = '-Dcore08.audit=java'
    $env:JAVA_TOOL_OPTIONS = '-Dcore08.audit=tool'
    $env:_JAVA_OPTIONS = '-Dcore08.audit=legacy'
  } else { foreach ($name in $optionNames) { Remove-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue } }
  $all = @(Get-ChildItem -LiteralPath $classDir -Filter '*.java' | Sort-Object Name)
  $directNames = @('Ex07_StreamClass.java','Ex08_StreamClass.java','Ex09_StreamClass.java','Ex10_Stream.java')
  $direct = @($directNames | ForEach-Object { Get-Item -LiteralPath (Join-Path $classDir $_) })
  if ($all.Count -ne 10 -or $direct.Count -ne 4) { throw 'source inventory drift' }
  $pkg = Join-Path $root ("package-" + $mode)
  $focus = Join-Path $root ("direct-" + $mode)
  Compile $all $pkg; Compile $direct $focus
  $nl = [string][char]10
  $tab = [string][char]9
  $expected = @{
    Ex03_Main = '20' + $nl
    Ex05_Main = (@('world^^','world@@','Lambda님 환영','Lambda2님 Hi') -join $nl) + $nl
    Ex06_Main = (@('result = 200','======================','res = 200','======================') -join $nl) + $nl
    Ex07_StreamClass = (@('홍길동님','고길동님','이길동님','박길동님','나길동님','둘리님','도우너님','마이콜님','희동이님','공실이님') -join $nl) + $nl
    Ex08_StreamClass = (@('10','20','30','40','50','5개','5','15','OptionalDouble[3.0]') -join $nl) + $nl
    Ex09_StreamClass = 'Tomas' + $tab + 'Edward' + $tab + 'Jack' + $tab + $nl + 'Edward' + $tab + 'Jack' + $tab + 'Tomas' + $tab + $nl + 'Tomas' + $tab + 'Jack' + $tab + 'Edward' + $tab + $nl
    Ex10_Stream = (@('1 2 3 4 5 1 2 3 4 5 1 2 3 ','1 2 3 4 5 ','2 4 2 4 2 ','2 4 ','1 2 3 ','4 5 1 2 3 4 5 1 2 3 ') -join $nl) + $nl
  }
  foreach ($name in @('Ex03_Main','Ex05_Main','Ex06_Main')) { Assert-Exact (Run $pkg $name) $expected[$name] $name }
  foreach ($name in @('Ex07_StreamClass','Ex08_StreamClass','Ex09_StreamClass','Ex10_Stream')) { Assert-Exact (Run $focus $name) $expected[$name] $name }
  $active07 = (@(Get-Content -LiteralPath (Join-Path $classDir 'Ex07_StreamClass.java') | Where-Object { $_ -notmatch '^\s*//' }) -join $nl)
  $active08 = (@(Get-Content -LiteralPath (Join-Path $classDir 'Ex08_StreamClass.java') | Where-Object { $_ -notmatch '^\s*//' }) -join $nl)
  $active09 = (@(Get-Content -LiteralPath (Join-Path $classDir 'Ex09_StreamClass.java') | Where-Object { $_ -notmatch '^\s*//' }) -join $nl)
  $active10 = (@(Get-Content -LiteralPath (Join-Path $classDir 'Ex10_Stream.java') | Where-Object { $_ -notmatch '^\s*//' }) -join $nl)
  $shape = @{
    of = ([regex]::Matches($active07, '\bStream\.of\(')).Count
    recreate = ([regex]::Matches($active08, 'Arrays\.stream\(arr\)')).Count
    sorted = ([regex]::Matches($active09, '\.sorted\(')).Count
    distinct = ([regex]::Matches($active10, '\.distinct\(')).Count
  }
  if ($shape.of -lt 1 -or $shape.recreate -ne 2 -or $shape.sorted -ne 2 -or $shape.distinct -ne 2) { throw 'direct source shape drift' }
  return "package=10|direct=4|mains=7|outputs=7|shape=$($shape.of),$($shape.recreate),$($shape.sorted),$($shape.distinct)"
}

try {
  if (Test-Path -LiteralPath $root) { throw 'unexpected temp collision' }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $ownsRoot = $true
  $classDir = Join-Path ([IO.Path]::GetFullPath($SourceRoot)) 'src/com/java/class12'
  $baseline = Audit 'baseline' $classDir
  $hostile = Audit 'hostile' $classDir
  if ($baseline -cne $hostile) { throw 'baseline/hostile drift' }
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline"
  'Ex07=names10;Ex08=boxed5|count5|sum15|avg3;Ex09=source|ascending|reverse;Ex10=13|5|6|2|3|10'
} catch {
  $bodyError = $_.Exception
} finally {
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
          { lines: "1-13", explanation: "입력 source root와 launcher option 네 개의 존재·값을 mutation 전에 저장하고 공백 temp 경로, ownership flag, body error slot을 준비합니다." },
          { lines: "14-53", explanation: "ArgumentList·explicit cwd·UTF-8 redirected streams·closed stdin·async drain·10초 timeout·tree kill·5초 grace·Dispose를 가진 child helper를 정의합니다." },
          { lines: "54-63", explanation: "stdout exact/exit0/stderr0 assertion과 package/direct 각각의 isolated warning0 compile helper를 만듭니다." },
          { lines: "64-88", explanation: "baseline/hostile parent 환경을 구성하고 source10/direct4 count, 일곱 mains의 newline·tab·trailing-space exact outputs를 선언합니다." },
          { lines: "89-98", explanation: "companions3과 direct4를 fresh JVM으로 실행하고 stream recreation·sorted·distinct source shapes를 동적으로 확인합니다." },
          { lines: "101-138", explanation: "New-Item 성공 뒤에만 ownership을 표시하고 두 mode 동일성을 확인한 뒤, 각 환경 변수 복원과 temp cleanup을 독립 시도하며 body·cleanup failures를 보존합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy2/classstudy source root", "launcher options4 baseline+hostile isolation", "10-second timeout plus 5-second termination grace"], command: "pwsh -NoProfile -File verify-original-core08.ps1 -SourceRoot <classstudy-root>" },
        output: { value: "spacePath=True,modes=2|same=True,package=10|direct=4|mains=7|outputs=7|shape=1,2,2,2\nEx07=names10;Ex08=boxed5|count5|sum15|avg3;Ex09=source|ascending|reverse;Ex10=13|5|6|2|3|10", explanation: ["package10/direct4 compile은 두 mode 모두 output0·warning0입니다.", "companions3과 direct4의 stdout·stderr·exit가 fresh JVM마다 exact입니다.", "source shape는 fixed literal count가 아니라 현재 files에서 동적으로 계산합니다."] },
        experiments: [
          { change: "Ex08에서 s1을 다시 생성하지 않고 consumed s1.count()를 호출합니다.", prediction: "IllegalStateException이 발생합니다.", result: "variable 재대입이 아니라 stream instance 단일 소비가 핵심입니다." },
          { change: "child environment에서 JAVA_TOOL_OPTIONS 제거를 생략합니다.", prediction: "hostile mode stderr에 Picked up line이 생겨 exact contract가 실패합니다.", result: "build/run harness도 실행 재현성의 일부입니다." },
        ],
        sourceRefs: ["java-class12-ex01", "java-class12-ex02", "java-class12-ex03", "java-class12-ex04", "java-class12-ex05", "java-class12-ex06", "java-class12-ex07", "java-class12-ex08", "java-class12-ex09", "java-class12-ex10", "jdk21-javac", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "hostile mode에만 compiler/runtime stderr가 생긴다.", likelyCause: "Java launcher option environment를 parent만 지우거나 child에 빈 값으로 남겼습니다.", checks: ["ProcessStartInfo.Environment.Remove 호출을 봅니다.", "stderr를 stdout과 분리합니다.", "baseline/hostile result를 구조적으로 비교합니다."], fix: "javac/java child마다 option names4를 environment dictionary에서 제거하고 parent 존재·값을 finally 복원합니다.", prevention: "모든 original audit에 hostile4 same-output case를 둡니다." },
        { symptom: "Ex09·Ex10이 눈으로는 같지만 golden이 흔들린다.", likelyCause: "tab 또는 trailing-space를 trim하거나 platform newline을 섞었습니다.", checks: ["escaped representation을 출력합니다.", "CRLF만 LF로 normalize했는지 봅니다.", "trim 호출을 찾습니다."], fix: "원본이 의미 있게 출력한 tab·space는 보존하고 line ending만 normalize합니다.", prevention: "whitespace-sensitive case는 exact string과 tokenized semantic assertion을 함께 둡니다." },
      ],
      expertNotes: ["golden output은 regression evidence이지 Stream API의 모든 구현 세부를 고정하는 근거는 아닙니다. order 보장이 없는 source/operation에는 order-insensitive assertion을 선택합니다.", "original examples가 stream variable을 다시 대입하는 방식은 교육적으로 single-use를 보이지만 production에서는 pipeline을 terminal까지 한 expression/operation scope로 제한하는 편이 alias misuse를 줄입니다."],
    },
    {
      id: "parallel-stream-laws-cost-model",
      title: "parallel stream은 연산 법칙과 분할 비용이 맞을 때만 선택하며 순서·pool·blocking을 명시합니다",
      lead: "parallel 한 단어를 성능 옵션으로 보지 않고 source splittability, 작업량, associativity, shared state와 execution context를 함께 검토합니다.",
      explanations: [
        "parallel stream은 source를 partitions로 나누고 stages를 여러 tasks에서 처리한 뒤 results를 합칠 수 있습니다. 데이터가 많다는 사실만으로 빨라지지 않으며 split·task scheduling·merge·coordination 비용보다 element work가 충분히 커야 합니다.",
        "reduction은 identity·accumulator·combiner가 associative하고 compatible해야 partition grouping이 바뀌어도 같은 의미 결과를 냅니다. immutable accumulator는 이해하기 쉽지만 매 element allocation 비용이 있으므로 collect와 primitive reduction도 비교합니다.",
        "source encounter order는 parallel 여부와 별개로 존재할 수 있습니다. ordered pipeline의 toList는 encounter order를 보존하지만 forEach emission은 그렇지 않습니다. forEachOrdered는 order를 보존하는 대신 parallel freedom을 줄일 수 있습니다.",
        "captured ArrayList·HashMap·counter를 tasks가 함께 변경하지 않습니다. synchronized collection을 붙이면 corruption을 줄여도 contention과 compound-action race가 남으므로 collector/reduction으로 partition-local state를 사용합니다.",
        "현재 JDK의 일반 parallel stream 실행은 common ForkJoinPool과 결합되는 경우가 많지만 application API가 전용 executor ownership을 명시해 주는 것은 아닙니다. blocking I/O·긴 sleep·nested parallelism을 넣으면 unrelated work까지 starvation시킬 수 있습니다.",
        "virtual thread는 blocking task별 thread 비용을 줄이는 concurrency 도구이고 parallel stream의 data-parallel reduction 대체 문법이 아닙니다. I/O fan-out에는 bounded concurrency·timeout·cancellation·rate limit을 가진 별도 executor/structured workflow를 설계합니다.",
        "benchmark는 sequential/parallel 두 결과의 동등성을 먼저 검증한 뒤 realistic size/distribution, warmup, forks, GC allocation, CPU saturation, 다른 workload 공존 상태를 측정합니다. 한 번의 wall-clock println 비교를 근거로 삼지 않습니다.",
      ],
      concepts: [
        { term: "splittability", definition: "source traversal을 균형 잡힌 independent partitions로 나눌 수 있는 성질입니다.", detail: ["ArrayList/range는 비교적 좋습니다.", "linked/unknown-size source는 비용이 클 수 있습니다."] },
        { term: "combiner compatibility", definition: "partition accumulators를 합친 결과가 sequential 의미와 같도록 identity·accumulator와 combiner가 일관되는 성질입니다.", detail: ["parallel reduce의 필수 법칙입니다.", "property test로 검증합니다."] },
        { term: "common-pool interference", definition: "shared execution pool의 blocking·과부하가 unrelated parallel work latency에 영향을 주는 운영 위험입니다.", detail: ["global tuning을 피합니다.", "bounded ownership을 설계합니다."] },
      ],
      codeExamples: [{
        id: "java-parallel-reduction-contract",
        title: "immutable Stats reduction이 sequential·parallel에서 같은 count/sum과 ordered result를 만듭니다",
        language: "java",
        filename: "ParallelReductionContract.java",
        purpose: "identity·accumulator·combiner 법칙과 ordered parallel toList를 scheduling-independent aggregate output으로 검증합니다.",
        code: String.raw`import java.util.List;
import java.util.stream.IntStream;

public class ParallelReductionContract {
    record Stats(long count, long sum) {
        Stats add(int value) { return new Stats(count + 1, sum + value); }
        Stats combine(Stats other) { return new Stats(count + other.count, sum + other.sum); }
    }

    static Stats summarize(java.util.stream.Stream<Integer> stream) {
        return stream.reduce(new Stats(0, 0), Stats::add, Stats::combine);
    }

    public static void main(String[] args) {
        List<Integer> values = IntStream.rangeClosed(1, 1000).boxed().toList();
        Stats sequential = summarize(values.stream());
        Stats parallel = summarize(values.parallelStream());
        List<Integer> ordered = values.parallelStream()
                .filter(value -> value <= 5)
                .map(value -> value * 2)
                .toList();

        Stats a = new Stats(2, 3);
        Stats b = new Stats(3, 12);
        Stats c = new Stats(1, 9);
        boolean associative = a.combine(b).combine(c).equals(a.combine(b.combine(c)));

        System.out.println("sequential=" + sequential);
        System.out.println("parallel=" + parallel);
        System.out.println("equal=" + sequential.equals(parallel));
        System.out.println("ordered=" + ordered);
        System.out.println("associative=" + associative);
    }
}`,
        walkthrough: [
          { lines: "1-7", explanation: "count/sum immutable accumulator와 associative field-wise combine을 정의합니다." },
          { lines: "9-11", explanation: "identity Stats(0,0), instance add와 combine으로 sequential/parallel 공용 reduction을 만듭니다." },
          { lines: "14-20", explanation: "1~1000 source를 두 execution mode로 집계하고 ordered parallel pipeline 결과를 materialize합니다." },
          { lines: "22-25", explanation: "세 partition summaries의 좌·우 grouping이 같은지 직접 확인합니다." },
          { lines: "27-31", explanation: "thread name/order 대신 stable aggregate equality와 encounter-order result만 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ParallelReductionContract.java", "ParallelReductionContract") },
        output: { value: "sequential=Stats[count=1000, sum=500500]\nparallel=Stats[count=1000, sum=500500]\nequal=true\nordered=[2, 4, 6, 8, 10]\nassociative=true", explanation: ["두 modes는 scheduling과 무관한 동일 aggregate를 냅니다.", "ordered source의 toList는 encounter order를 유지합니다.", "sample partition combine은 associative합니다."] },
        experiments: [
          { change: "combine에서 count는 더하고 sum은 빼도록 바꿉니다.", prediction: "partition grouping에 따라 parallel result가 sequential과 달라집니다.", result: "combiner는 accumulator가 만든 의미를 그대로 합쳐야 합니다." },
          { change: "map에서 network call과 sleep을 수행합니다.", prediction: "shared workers가 blocking되어 throughput·unrelated latency가 악화될 수 있습니다.", result: "I/O fan-out은 timeout·bounded executor·cancellation이 있는 별도 workflow로 설계합니다." },
        ],
        sourceRefs: ["java-stream-parallel-api", "java-base-stream-api", "java-forkjoinpool-api", "java-intstream-api", "java-stream-tolist-api"],
      }],
      diagnostics: [
        { symptom: "parallel 결과 count/합계가 실행마다 달라진다.", likelyCause: "shared mutable accumulator 또는 non-associative/incompatible combiner를 사용했습니다.", checks: ["captured state를 찾습니다.", "identity·three-way regrouping law를 test합니다.", "sequential/parallel results를 비교합니다."], fix: "primitive reduction·documented collector·immutable associative accumulator로 바꿉니다.", prevention: "random partition property test와 race detector/stress test를 둡니다." },
        { symptom: "parallel을 켠 뒤 전체 서비스 latency가 나빠진다.", likelyCause: "작은 tasks, poor splitting, ordering barrier, blocking I/O 또는 common-pool contention입니다.", checks: ["CPU utilization·task size·pool queue를 측정합니다.", "stateful/ordered stages를 찾습니다.", "동시 workload를 포함해 benchmark합니다."], fix: "sequential로 되돌리거나 source/algorithm을 바꾸고 I/O는 bounded owned executor로 분리합니다.", prevention: "parallel 선택에 benchmark evidence와 rollback threshold를 요구합니다." },
      ],
      expertNotes: ["floating-point 합은 수학적으로 associative해 보여도 rounding 때문에 regrouping 결과 bit가 달라질 수 있습니다. Kahan/pairwise/stable order 같은 numeric reproducibility 정책을 선택합니다.", "custom ForkJoinPool 안에서 parallel stream을 실행해도 구현 의존·nested behavior를 신중히 검증해야 하며 library API가 caller pool을 암묵 점유하지 않게 합니다."],
    },
    {
      id: "resource-backed-stream-close-ownership",
      title: "Files.lines·list·walk 같은 resource-backed stream은 terminal 완료와 close를 분리해 owner scope에서 닫습니다",
      lead: "대부분의 in-memory stream은 close effect가 없다는 경험을 file descriptor를 가진 stream에 일반화하지 않고, 생성한 scope가 try-with-resources로 lifetime을 묶습니다.",
      explanations: [
        "BaseStream은 AutoCloseable이지만 collection/array streams는 보통 명시 close가 필요 없습니다. 반면 Files.lines·list·walk·find 등은 열린 file/directory resource를 가질 수 있어 반환 문서가 close 필요를 명시합니다.",
        "terminal operation이 끝났다고 stream이 자동 close되는 일반 규칙은 없습니다. resource-backed stream을 try-with-resources header에 두고 terminal과 close failure를 같은 exception boundary에서 처리합니다.",
        "onClose는 close handler를 등록하며 close할 때 실행됩니다. handler 자체도 실패할 수 있고 여러 handlers의 suppression 규칙을 API로 확인합니다. onClose를 business commit hook이나 leak 보정 수단으로 사용하지 않습니다.",
        "resource stream을 method 밖으로 반환하면 caller에게 close ownership을 transfer하는 계약이 됩니다. caller가 쉽게 놓칠 수 있으므로 callback (`withLines`)이나 method 내부 materialization처럼 lifetime을 API shape로 제한하는 방식을 우선 검토합니다.",
        "large file 전체를 toList하면 descriptor는 빨리 닫을 수 있어도 heap materialization 비용이 큽니다. streaming processing·bounded batch·backpressure·error recovery 요구와 lifetime을 함께 설계합니다.",
        "Files.lines charset을 명시하면 platform default drift를 피할 수 있습니다. malformed input policy, newline semantics, file change during traversal, symlink/permission errors도 test합니다.",
        "close 후 같은 stream을 재사용하지 않습니다. close handler count나 IllegalStateException message는 implementation detail을 최소화하고 type·resource release·temp cleanup을 검증합니다.",
      ],
      concepts: [
        { term: "resource-backed stream", definition: "traversal 동안 file descriptor·directory handle 같은 외부 resource를 유지할 수 있는 Stream입니다.", detail: ["API close requirement를 읽습니다.", "owner scope에 TWR를 둡니다."] },
        { term: "onClose handler", definition: "BaseStream.close가 호출될 때 실행하도록 등록한 handler입니다.", detail: ["terminal이 자동 호출하지 않습니다.", "handler failure도 고려합니다."] },
        { term: "lifetime-shaped API", definition: "callback/materialized result 등 type·control 구조로 resource 사용 가능 기간을 제한하는 API입니다.", detail: ["close 누락을 줄입니다.", "ownership transfer를 명시합니다."] },
      ],
      codeExamples: [{
        id: "java-files-lines-ownership",
        title: "UTF-8 Files.lines를 TWR로 닫고 onClose1·unique lines·재사용 실패·temp cleanup을 확인합니다",
        language: "java",
        filename: "FilesLinesOwnership.java",
        purpose: "resource-backed stream terminal과 close가 별개임을 close handler와 owner-scoped temp lifecycle로 증명합니다.",
        code: String.raw`import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

public class FilesLinesOwnership {
    public static void main(String[] args) throws Exception {
        Path directory = Files.createTempDirectory("stream-lines-");
        Path file = directory.resolve("data.txt");
        AtomicInteger closeCalls = new AtomicInteger();
        Stream<String> captured = null;
        try {
            Files.writeString(file, "alpha\n\nbeta\nalpha\n", StandardCharsets.UTF_8);
            try (Stream<String> lines = Files.lines(file, StandardCharsets.UTF_8)
                    .onClose(closeCalls::incrementAndGet)) {
                captured = lines;
                List<String> unique = lines
                        .map(String::trim)
                        .filter(value -> !value.isEmpty())
                        .distinct()
                        .sorted()
                        .toList();
                System.out.println("unique=" + unique);
            }
            System.out.println("closeCalls=" + closeCalls.get());
            try {
                captured.count();
            } catch (IllegalStateException error) {
                System.out.println("reuse=" + error.getClass().getSimpleName());
            }
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
        System.out.println("cleaned=" + !Files.exists(directory));
    }
}`,
        walkthrough: [
          { lines: "1-6", explanation: "explicit UTF-8, temp Files, close counter와 Stream APIs를 import합니다." },
          { lines: "9-14", explanation: "출력하지 않을 random temp path와 close observation, captured reference를 준비합니다." },
          { lines: "15-25", explanation: "file을 쓰고 Files.lines+onClose를 TWR에 등록해 nonblank unique sorted values를 materialize합니다." },
          { lines: "26-32", explanation: "TWR 뒤 closeCalls1과 consumed/closed stream reuse의 exception type을 확인합니다." },
          { lines: "33-38", explanation: "outer finally가 file/directory를 삭제하고 경로 literal 없이 cleanup boolean만 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "filesystem temp directory"], command: isolatedJavaRun("FilesLinesOwnership.java", "FilesLinesOwnership") },
        output: { value: "unique=[alpha, beta]\ncloseCalls=1\nreuse=IllegalStateException\ncleaned=true", explanation: ["terminal은 values를 만들고 TWR close가 onClose를 한 번 실행합니다.", "close/consume 뒤 stream은 재사용하지 않습니다.", "temp path를 공개하지 않고 cleanup true만 검증합니다."] },
        experiments: [
          { change: "try-with-resources를 제거하고 terminal만 호출합니다.", prediction: "결과는 보일 수 있지만 descriptor close timing을 보장하지 못합니다.", result: "terminal completion과 resource close는 별도 계약입니다." },
          { change: "method가 Files.lines를 그대로 반환합니다.", prediction: "caller가 close를 잊을 수 있고 lifetime이 호출 경계를 넘어갑니다.", result: "ownership Javadoc 또는 callback/materialized result API로 lifetime을 명시합니다." },
        ],
        sourceRefs: ["java-files-lines-api", "java-files-api", "java-base-stream-api", "java-standard-charsets-api", "java-atomic-integer-api", "java-stream-tolist-api"],
      }],
      diagnostics: [
        { symptom: "반복 파일 조회 뒤 open file handles가 누적된다.", likelyCause: "Files.lines/list/walk stream을 terminal만 실행하고 닫지 않았습니다.", checks: ["resource-returning APIs를 검색합니다.", "TWR scope를 확인합니다.", "handle/proc metrics와 failure paths를 봅니다."], fix: "생성한 scope에 TWR를 두고 close failure까지 처리합니다. 반환한다면 ownership transfer를 명시합니다.", prevention: "resource stream API lint/review rule과 repeated-open leak test를 둡니다." },
        { symptom: "file stream을 닫았는데 temp 삭제가 Windows에서 실패한다.", likelyCause: "다른 alias/wrapper가 descriptor를 보유하거나 parallel task가 아직 traversal 중입니다.", checks: ["모든 stream aliases를 찾습니다.", "terminal/task completion을 기다렸는지 봅니다.", "close exception을 삼켰는지 확인합니다."], fix: "단일 owner와 lexical TWR를 사용하고 child tasks 완료 뒤 삭제합니다.", prevention: "same-process create/read/close/delete integration test를 Windows 포함 CI에 둡니다." },
      ],
      expertNotes: ["Files.walk의 lazy traversal은 directory tree 변화·permission failure를 중간에 만날 수 있습니다. partial result와 retry/skip 정책을 명시합니다.", "stream close가 durability를 보장하지는 않습니다. write/flush/fsync/atomic move/transaction 의미는 underlying storage API에서 별도로 설계합니다."],
    },
    {
      id: "verification-spliterator-benchmark-diagnostics",
      title: "loop-equivalence·empty·reuse·sequential/parallel property와 현실적인 benchmark로 pipeline을 검증합니다",
      lead: "예제 한 번의 출력 대신 fixed-seed input family와 invariant를 사용하고, 성능 수치는 correctness를 통과한 뒤 재현 가능한 harness에서만 비교합니다.",
      explanations: [
        "stream refactor는 기존 loop와 같은 ordered result를 내는지 empty·single·duplicates·negative·large values에서 비교합니다. expected를 stream과 같은 helper로 만들지 않고 독립 imperative oracle을 둡니다.",
        "fixed seed randomized tests는 많은 shapes를 재현하지만 seed 하나가 exhaustive proof는 아닙니다. property-based framework의 shrinking과 boundary examples를 함께 사용합니다.",
        "sequential/parallel equivalence는 operation laws가 허용할 때만 assertion합니다. findAny·unordered representative·floating-point regrouping처럼 결과 집합/오차 범위가 계약인 경우 exact order/value 대신 올바른 invariant를 씁니다.",
        "Spliterator의 ORDERED·DISTINCT·SORTED·SIZED·SUBSIZED·IMMUTABLE·CONCURRENT·NONNULL characteristics는 optimization과 semantics에 영향을 줍니다. custom spliterator가 거짓 characteristic을 보고하지 않게 split coverage·duplicate·size를 test합니다.",
        "JMH benchmark는 warmup, multiple forks, Blackhole/result consumption, parameterized sizes, allocation profiler와 baseline을 사용합니다. IDE debug·첫 실행·println 포함 시간은 JIT/GC/I/O noise가 큽니다.",
        "production 관측은 latency percentiles, allocation/GC, CPU, input cardinality, parallelism, error/timeout rate를 pipeline version과 함께 기록합니다. 성능 regression threshold와 sequential fallback을 둡니다.",
        "test가 implementation class name, IllegalStateException message, HashSet raw order, parallel thread name, peek invocation count를 고정하지 않게 합니다. public semantic result와 resource/effect invariants만 고정합니다.",
      ],
      concepts: [
        { term: "imperative oracle", definition: "stream 구현과 독립된 loop로 같은 요구 결과를 계산해 refactor를 비교하는 기준입니다.", detail: ["같은 helper 재사용을 피합니다.", "boundary cases를 포함합니다."] },
        { term: "spliterator characteristic", definition: "source traversal의 order·size·distinct·concurrency 성질을 선언하는 flags입니다.", detail: ["optimization에 사용됩니다.", "거짓 선언은 correctness를 깹니다."] },
        { term: "benchmark hygiene", definition: "JIT warmup·dead-code elimination·fork·GC·I/O noise를 통제해 의미 있는 성능 비교를 만드는 절차입니다.", detail: ["correctness 뒤 수행합니다.", "realistic data를 사용합니다."] },
      ],
      codeExamples: [{
        id: "java-stream-verification-matrix",
        title: "fixed-seed 100 cases에서 loop/stream 결과와 sequential/parallel long sum을 비교합니다",
        language: "java",
        filename: "StreamVerificationMatrix.java",
        purpose: "다양한 size·duplicates·negative values에서 ordered transformation과 associative sum equivalence를 aggregate assertion으로 검증합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public class StreamVerificationMatrix {
    static List<Integer> loopOracle(List<Integer> source) {
        List<Integer> result = new ArrayList<>();
        for (int value : source) {
            if (value % 2 == 0) result.add(value * value);
        }
        Collections.sort(result);
        return result;
    }

    static List<Integer> streamResult(List<Integer> source) {
        return source.stream()
                .filter(value -> value % 2 == 0)
                .map(value -> value * value)
                .sorted()
                .toList();
    }

    public static void main(String[] args) {
        Random random = new Random(20260713L);
        int checked = 0;
        for (int testCase = 0; testCase < 100; testCase++) {
            int size = random.nextInt(51);
            List<Integer> values = new ArrayList<>();
            for (int i = 0; i < size; i++) values.add(random.nextInt(201) - 100);
            if (!loopOracle(values).equals(streamResult(values))) throw new AssertionError("transform");
            long sequential = values.stream().mapToLong(Integer::longValue).sum();
            long parallel = values.parallelStream().mapToLong(Integer::longValue).sum();
            if (sequential != parallel) throw new AssertionError("sum");
            checked++;
        }
        System.out.println("cases=" + checked);
        System.out.println("transformEquivalent=true");
        System.out.println("parallelSumEquivalent=true");
    }
}`,
        walkthrough: [
          { lines: "1-4", explanation: "독립 loop oracle, sort, fixed-seed input generation에 필요한 APIs를 import합니다." },
          { lines: "7-13", explanation: "even square를 imperative loop로 만들고 별도 sort하는 기준 구현입니다." },
          { lines: "15-21", explanation: "filter·map·sorted·toList로 같은 ordered contract를 구현합니다." },
          { lines: "23-36", explanation: "100 cases의 size0~50·value-100~100에서 결과 equality와 associative long sum의 sequential/parallel equality를 검사합니다." },
          { lines: "37-39", explanation: "random values를 노출하지 않고 검증 case count와 invariants만 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamVerificationMatrix.java", "StreamVerificationMatrix") },
        output: { value: "cases=100\ntransformEquivalent=true\nparallelSumEquivalent=true", explanation: ["fixed seed로 동일한100 input families를 재현합니다.", "imperative/stream ordered results와 long sum execution modes가 모두 일치합니다."] },
        experiments: [
          { change: "stream filter를 odd 조건으로 바꿉니다.", prediction: "첫 counterexample에서 transform AssertionError가 발생합니다.", result: "독립 oracle이 semantic refactor drift를 잡습니다." },
          { change: "sum을 subtraction reduce로 바꿉니다.", prediction: "parallel regrouping equivalence가 깨질 수 있습니다.", result: "property는 operation law가 요구하는 failure를 드러냅니다." },
        ],
        sourceRefs: ["java-random-api", "java-stream-package-summary", "java-stream-parallel-api", "java-spliterator-api", "java-collections-api", "java-list-api"],
      }],
      diagnostics: [
        { symptom: "stream refactor test가 통과하지만 production output이 달라졌다.", likelyCause: "expected도 같은 stream helper로 계산했거나 empty/duplicate/order/null boundaries가 빠졌습니다.", checks: ["oracle independence를 봅니다.", "input partitions를 inventory합니다.", "unspecified order를 exact 고정했는지 확인합니다."], fix: "독립 loop/domain oracle과 boundary/property tests를 추가합니다.", prevention: "mutation testing으로 predicate/order/terminal 변화가 test에 잡히는지 확인합니다." },
        { symptom: "microbenchmark에서 매번 다른 방식이 승리한다.", likelyCause: "warmup/fork/result consumption 없이 wall clock·println·GC noise를 측정했습니다.", checks: ["JMH 설정을 봅니다.", "allocation과 input size를 확인합니다.", "confidence interval을 비교합니다."], fix: "JMH와 realistic parameters/profilers를 사용하고 semantic output equality를 먼저 검증합니다.", prevention: "benchmark source/config/result metadata를 version control하고 threshold를 통계적으로 해석합니다." },
      ],
      expertNotes: ["Random fixed algorithm은 regression 재현에 유용하지만 property framework seed·generator version·shrunk counterexample도 함께 기록합니다.", "custom Spliterator.trySplit의 누락·중복은 parallel에서만 드러날 수 있으므로 every element exactly once와 estimatedSize/characteristics consistency를 검증합니다."],
    },
    ...createAdditionalChapters(),
  ],
  lab: {
    title: "대용량 주문 export Stream pipeline의 정확성·자원·병렬성 검증",
    scenario: "UTF-8 주문 파일을 읽어 validation·normalization·중복 제거·정렬·집계·export command를 만들되, 빈 입력·잘못된 행·중복 키·close failure·large input에서도 결과와 failure tree를 보존하는 pipeline을 설계합니다.",
    setup: [
      "OpenJDK21 warning0 isolated compile/run harness와 OS temp direct-child fixtures를 준비합니다.",
      "OrderLine parse result를 success/failure sealed outcome으로 만들고 원본 path·개인정보는 output에 쓰지 않습니다.",
      "Files.lines를 UTF-8 TWR로 열고 onClose counter와 temp cleanup을 계측합니다.",
      "small/empty/duplicate/malformed/100k rows fixtures를 deterministic generator로 만듭니다.",
      "imperative oracle과 stream implementation을 서로 다른 code path로 작성합니다.",
    ],
    steps: [
      "source encounter order와 schema를 정의하고 blank/comment/header policy를 분리합니다.",
      "parse·validate·normalize stages를 stateless functions로 만들고 field mutation을 금지합니다.",
      "invalid rows는 silent filter하지 않고 line number 없는 stable error code와 safe index를 수집합니다.",
      "business key equality와 first/last/reject duplicate representative policy를 명시합니다.",
      "ordered distinct 뒤 amount·id total comparator로 deterministic export order를 만듭니다.",
      "empty aggregation과 Optional/default/error 정책을 명시합니다.",
      "toMap duplicate merge와 TreeMap/LinkedHashMap order 선택을 test합니다.",
      "effect commands를 materialize하고 file write는 stream lambda 밖 transaction-like boundary에서 수행합니다.",
      "Files.lines closeCalls1과 success/failure 모든 temp cleanup을 assert합니다.",
      "same Stream reuse negative와 Supplier가 새 instance를 주는 positive case를 둡니다.",
      "unbounded generator fixture에는 reachable limit/takeWhile 종료 증명을 둡니다.",
      "sequential/parallel 결과 동등성을 associative aggregate에만 검사합니다.",
      "shared mutable accumulator·peek business effect·parallel blocking 호출이 없는지 정적 검색합니다.",
      "100 fixed-seed cases에서 imperative oracle과 ordered result를 비교합니다.",
      "JMH에서 100·10k·1m rows, duplicates0/50%, sequential/parallel, allocation과 p95를 측정합니다.",
      "공개 output에는 aggregate count/code만, restricted log에는 sanitized failure tree와 version을 남깁니다.",
    ],
    expectedResult: [
      "valid normalized rows와 errors가 silent loss 없이 분리됩니다.",
      "duplicate representative와 final order가 반복 실행에서 동일합니다.",
      "empty·single·many aggregate가 domain policy와 일치합니다.",
      "resource closeCalls는1이고 descriptor/temp residue는0입니다.",
      "loop/stream100 cases와 associative sequential/parallel aggregate가 일치합니다.",
      "effect commands 수가 final recipients 수와 같고 peek 횟수에 의존하지 않습니다.",
      "benchmark는 correctness 통과 뒤 reproducible metadata와 함께 저장됩니다.",
    ],
    cleanup: [
      "resource stream을 먼저 닫고 output/input temp files와 direct-child directory를 parent-bound 검사 뒤 삭제합니다.",
      "executor를 사용했다면 tasks 완료·failure 회수·shutdown을 확인합니다.",
      "launcher environment 존재·값을 복원하고 compiler/runtime residue0를 검사합니다.",
    ],
    extensions: [
      "keyset pagination과 external merge sort로 memory bound를 설계합니다.",
      "custom Collector와 Spliterator에 property/stress tests를 추가합니다.",
      "virtual-thread bounded I/O enrichment와 pure Stream aggregation을 분리합니다.",
      "JFR/async-profiler로 allocation·CPU·blocking을 비교합니다.",
      "failure-aware result를 Spring Batch chunk/retry/skip policy와 연결합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "Ex07~Ex10을 한 파일에서 재현하고 각 terminal마다 새 stream을 생성하는 이유를 trace로 설명하세요.", requirements: ["배열/List source10 names를 보존합니다.", "boxed count와 IntStream count/sum/average를 분리합니다.", "natural/reverse order와 distinct/filter/limit/skip를 exact 검증합니다.", "consumed reuse IllegalStateException type을 포함합니다."], hints: ["terminal마다 source factory를 다시 호출합니다.", "primitive average는 OptionalDouble입니다."], expectedOutcome: "원본 네 mains의 핵심 결과와 single-use 이유가 한 warning0 program에서 재현됩니다.", solutionOutline: ["immutable fixtures를 만듭니다.", "pipeline별 terminal을 실행합니다.", "order-sensitive/insensitive assertions를 구분합니다."] },
    { difficulty: "응용", prompt: "주문 List를 pure pipeline으로 검증·정규화·중복 제거·정렬·집계하고 imperative oracle과 비교하세요.", requirements: ["null/invalid/empty policy를 명시합니다.", "business key duplicate policy를 둡니다.", "total comparator를 사용합니다.", "toMap merge/order를 고정합니다.", "fixed-seed100 cases를 비교합니다."], hints: ["중간 record로 계산을 한 번만 합니다.", "expected를 stream으로 만들지 않습니다."], expectedOutcome: "source를 mutate하지 않고 모든 boundary family에서 oracle과 같은 deterministic result를 냅니다.", solutionOutline: ["domain functions를 단위 test합니다.", "ordered result를 materialize합니다.", "aggregate와 errors를 별도 value로 반환합니다."] },
    { difficulty: "설계", prompt: "resource-backed 대용량 export를 sequential/parallel 선택 근거와 운영 관측까지 포함해 설계하세요.", requirements: ["TWR·close failure·temp cleanup을 포함합니다.", "memory bound와 external sort 대안을 둡니다.", "parallel laws와 blocking 분리를 증명합니다.", "JMH/JFR measurement plan을 작성합니다.", "safe public error와 restricted diagnostics를 분리합니다."], hints: ["Files.lines terminal은 자동 close가 아닙니다.", "parallel은 correctness law 뒤 benchmark합니다."], expectedOutcome: "resource leak·silent loss·unstable order·shared-state race 없이 성능 선택을 되돌릴 수 있는 운영 설계가 됩니다.", solutionOutline: ["ownership table을 작성합니다.", "finite stages와 effects를 분리합니다.", "property/integration/benchmark gates를 정의합니다."] },
  ],
  reviewQuestions: [
    { question: "Stream은 collection인가요?", answer: "아닙니다. source elements를 한 번 전달하는 traversal pipeline이며 elements를 소유·저장하는 data structure가 아닙니다." },
    { question: "intermediate와 terminal의 차이는 무엇인가요?", answer: "intermediate는 새 stream stage를 만들고 terminal은 traversal을 시작해 result/effect를 만들며 pipeline을 소비합니다." },
    { question: "lazy evaluation은 무엇인가요?", answer: "terminal demand 전에는 대부분의 intermediate behavior가 실행되지 않고 필요한 elements만 stage를 통과하는 성질입니다." },
    { question: "stream을 두 번 terminal로 소비할 수 있나요?", answer: "같은 instance는 재사용하지 않습니다. source에서 새 stream을 만들거나 한 terminal에서 필요한 결과를 모읍니다." },
    { question: "findFirst는 왜 전체를 보지 않나요?", answer: "첫 결과가 결정되면 upstream을 더 요청하지 않는 short-circuit terminal이기 때문입니다." },
    { question: "Stream.of(int[]) count가1인 이유는 무엇인가요?", answer: "primitive array 전체가 한 reference element인 Stream<int[]>가 되기 때문입니다." },
    { question: "int elements stream은 어떻게 만드나요?", answer: "Arrays.stream(int[]) 또는 IntStream.of를 사용합니다." },
    { question: "range와 rangeClosed 차이는 무엇인가요?", answer: "range는 end exclusive, rangeClosed는 end inclusive입니다." },
    { question: "empty average는 무엇을 반환하나요?", answer: "OptionalDouble.empty이므로 domain에 맞게 부재를 처리합니다." },
    { question: "filter와 map의 cardinality 차이는 무엇인가요?", answer: "filter는 elements를 제거할 수 있고 map은 각 input을 하나의 output으로 변환합니다." },
    { question: "mapper가 source를 mutate해도 되나요?", answer: "non-interference와 재실행성을 깨므로 새 immutable projection을 반환합니다." },
    { question: "distinct는 무엇으로 중복을 판단하나요?", answer: "object stream에서는 equals/hashCode 의미를 사용합니다." },
    { question: "distinct는 stateless인가요?", answer: "아닙니다. 이전 keys를 기억하는 stateful intermediate operation입니다." },
    { question: "sorted를 무한 stream 앞에 둘 수 있나요?", answer: "전체 upstream 완료가 필요해 결과를 만들 수 없으므로 먼저 의미 있는 finite bound가 필요합니다." },
    { question: "stable sort가 pagination을 자동 안정화하나요?", answer: "아닙니다. source order가 변할 수 있어 immutable unique tie-breaker가 필요합니다." },
    { question: "limit와 skip 음수는 허용되나요?", answer: "아닙니다. IllegalArgumentException이므로 외부 값을 검증합니다." },
    { question: "takeWhile과 filter의 차이는 무엇인가요?", answer: "takeWhile은 첫 false 전 prefix만, filter는 위치와 무관한 모든 matching elements를 선택합니다." },
    { question: "dropWhile은 negate filter인가요?", answer: "아닙니다. 처음 matching prefix만 버리고 첫 false부터 뒤를 모두 보존합니다." },
    { question: "limit가 있는데 infinite pipeline이 멈추지 않을 수 있나요?", answer: "limit 앞 sorted 같은 full-buffer stage가 있으면 limit에 도달하지 못할 수 있습니다." },
    { question: "empty allMatch는 무엇인가요?", answer: "반례가 없어 true이며 데이터 존재 요구는 별도로 검사해야 합니다." },
    { question: "reduce identity 조건은 무엇인가요?", answer: "모든 value의 항등원이고 accumulator/combiner와 compatible해야 합니다." },
    { question: "parallel reduce에 subtraction이 위험한 이유는 무엇인가요?", answer: "associative하지 않아 partition regrouping에 따라 결과가 달라집니다." },
    { question: "findAny 결과를 고정할 수 있나요?", answer: "어떤 element도 허용하는 계약이므로 deterministic selection에는 쓰지 않습니다." },
    { question: "Stream.toList는 mutable인가요?", answer: "unmodifiable result이므로 mutation이 필요하면 toCollection(ArrayList::new)처럼 명시합니다." },
    { question: "Collectors.toMap duplicate key는 어떻게 처리하나요?", answer: "merge 없는 overload는 실패하므로 reject/sum/overwrite 등 domain policy를 명시합니다." },
    { question: "HashMap output order를 golden으로 고정해도 되나요?", answer: "보장되지 않으므로 order가 필요하면 TreeMap/LinkedHashMap supplier를 선택합니다." },
    { question: "peek를 저장 effect에 써도 되나요?", answer: "안 됩니다. invocation이 생략·부분 실행될 수 있어 관찰 보조로만 사용합니다." },
    { question: "forEachOrdered가 exactly-once 외부 전송을 보장하나요?", answer: "순서만 다루며 transaction·retry·exactly-once는 별도 protocol입니다." },
    { question: "AtomicInteger side effect면 안전한가요?", answer: "increment만 atomic이며 omitted invocation·복합 invariant·retry를 해결하지 않습니다." },
    { question: "parallel을 언제 선택하나요?", answer: "associative/stateless correctness와 좋은 splitting을 증명하고 realistic benchmark에서 이득이 있을 때입니다." },
    { question: "parallel toList는 order를 보존하나요?", answer: "ordered pipeline이면 encounter order를 보존하지만 parallel forEach emission은 다릅니다." },
    { question: "parallel stream에 blocking I/O를 넣어도 되나요?", answer: "shared workers starvation 위험이 있어 bounded owned concurrency workflow로 분리합니다." },
    { question: "virtual thread와 parallel stream은 같은가요?", answer: "아닙니다. 전자는 blocking concurrency, 후자는 data-parallel traversal/reduction 도구입니다." },
    { question: "terminal이 resource stream을 자동 close하나요?", answer: "일반적으로 아니므로 Files.lines 등은 TWR로 닫습니다." },
    { question: "Files.lines를 반환하면 누가 닫나요?", answer: "명시 ownership transfer로 caller가 닫아야 하며 callback/materialization API가 더 안전할 수 있습니다." },
    { question: "onClose는 언제 실행되나요?", answer: "BaseStream.close 호출 때이며 terminal 호출 자체와 동일하지 않습니다." },
    { question: "loop oracle은 왜 독립이어야 하나요?", answer: "expected와 actual이 같은 bug/helper를 공유하면 semantic drift를 놓치기 때문입니다." },
    { question: "fixed seed 하나면 충분한가요?", answer: "재현에는 유용하지만 boundary/property/shrinking tests를 함께 사용해야 합니다." },
    { question: "stream benchmark는 어떻게 하나요?", answer: "JMH warmup·fork·result consumption·realistic sizes·allocation profiler를 사용합니다." },
    { question: "무엇을 golden에서 제외하나요?", answer: "implementation class/message, unordered raw order, thread names, peek count와 timing을 제외합니다." },
  ],
  completionChecklist: [
    "package10과 direct4를 별도 output에서 warning0 compile했다.", "일곱 main을 fresh JVM으로 실행했다.", "baseline과 hostile launcher4 stdout이 같다.", "stderr·exit·timeout을 case별 검증했다.", "tab·trailing-space 원본을 의도적으로 보존했다.", "launcher environment를 finally 복원했다.", "temp direct child만 parent-bound cleanup했다.", "Stream을 data structure로 설명하지 않았다.", "intermediate와 terminal을 구분했다.", "lazy execution을 exact trace로 확인했다.", "short-circuit가 처리량을 줄이는 것을 확인했다.", "같은 Stream instance를 재사용하지 않았다.", "supplier가 매번 새 stream을 만든다.", "reference/primitive array sources를 구분했다.", "Stream.of(int[]) container 함정을 검사했다.", "IntStream boxing/unboxing 경계를 정했다.", "range end exclusive를 확인했다.", "empty OptionalDouble policy를 정했다.", "filter predicate는 stateless하다.", "mapper는 source를 mutate하지 않는다.", "null collection/element/result 정책이 있다.", "checked failure를 broad wrapper로 숨기지 않았다.", "distinct equality/hash 의미를 검증했다.", "mutable distinct key를 사용하지 않았다.", "sorted finite requirement를 확인했다.", "comparator laws와 unique tie-breaker를 검증했다.", "unordered source raw order를 golden으로 쓰지 않았다.", "limit/skip 외부 값을 검증했다.", "takeWhile/filter를 구분했다.", "dropWhile/negate filter를 구분했다.", "unbounded pipeline termination proof가 있다.", "stateful stage가 short-circuit를 막지 않는지 봤다.", "empty match vacuous truth를 처리했다.", "reduce identity가 항등원이다.", "accumulator/combiner가 associative·compatible하다.", "floating-point reproducibility 정책이 있다.", "toList mutability를 문서화했다.", "toMap duplicate merge 정책이 있다.", "result Map order supplier를 선택했다.", "custom collector characteristics가 사실이다.", "defensive snapshot과 deep immutability를 구분했다.", "peek는 관찰용으로만 쓴다.", "business effects를 명시 boundary로 분리했다.", "parallel forEach shared mutation이 없다.", "forEachOrdered 한계를 설명했다.", "parallel source splitting 비용을 측정했다.", "blocking I/O를 parallel stream에서 분리했다.", "common-pool interference를 검토했다.", "sequential/parallel semantic equality를 먼저 검증했다.", "Files.lines/list/walk를 TWR로 닫는다.", "terminal과 close를 구분했다.", "onClose failure를 고려했다.", "resource ownership transfer를 문서화했다.", "temp file cleanup을 success/failure 모두 검증했다.", "독립 imperative oracle이 있다.", "empty/single/duplicates/negative cases가 있다.", "fixed-seed100 cases를 재현한다.", "Spliterator characteristics를 거짓 선언하지 않는다.", "JMH warmup/fork/consumption을 사용한다.", "공개 output에 path·credential·개인정보가 없다.",
  ],
  nextSessions: ["core-09-flatmap-reduce-dto"],
  sources: [
    { id: "java-class12-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex01_Lambda.java", usedFor: ["package audit", "lambda companion"], evidence: "compile-only lambda explanation source로 package10 inventory에 포함했습니다." },
    { id: "java-class12-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex02_Lambda.java", usedFor: ["package audit", "functional interface companion"], evidence: "functional interface companion을 package compile에서 검증했습니다." },
    { id: "java-class12-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex03_Main.java", usedFor: ["package main", "exact20"], evidence: "fresh JVM exact20 한 행을 확인했습니다." },
    { id: "java-class12-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex04_Lambda.java", usedFor: ["package audit", "method reference companion"], evidence: "compile-only SAM companion을 포함했습니다." },
    { id: "java-class12-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex05_Main.java", usedFor: ["package main", "lambda outputs"], evidence: "world/Lambda 네 exact lines를 fresh JVM으로 검증했습니다." },
    { id: "java-class12-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex06_Main.java", usedFor: ["package main", "switch companion"], evidence: "result/res와 separators exact4행을 확인했습니다." },
    { id: "java-class12-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex07_StreamClass.java", usedFor: ["direct inventory", "array/list streams", "exact10"], evidence: "배열5+List5 suffix exact10행과 Stream.of source shape를 확인했습니다." },
    { id: "java-class12-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex08_StreamClass.java", usedFor: ["direct inventory", "single use", "primitive terminals"], evidence: "boxed products5, count5, sum15, OptionalDouble3.0과 stream recreation2를 확인했습니다." },
    { id: "java-class12-ex09", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex09_StreamClass.java", usedFor: ["direct inventory", "natural/reverse sort", "tabs"], evidence: "source/natural/reverse exact3 logical lines와 sorted calls2를 확인했습니다." },
    { id: "java-class12-ex10", repository: "javastudy2/classstudy", path: "src/com/java/class12/Ex10_Stream.java", usedFor: ["direct inventory", "distinct/filter/limit/skip"], evidence: "13|5|6|2|3|10 elements 여섯 lines와 distinct calls2를 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["warning0", "release21"], evidence: "모든 원본/synthetic Java compile 옵션 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["fresh JVM", "redirect"], evidence: "argument/environment/stream process 구성 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["launcher isolation"], evidence: "child option variables 제거 근거입니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "Process Kill/WaitForExit/Dispose", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "kill tree", "dispose"], evidence: "bounded child lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["stdout/stderr drain"], evidence: "redirected pipe 동시 drain 근거입니다." },
    { id: "jls-method-invocation", repository: "JLS SE21", path: "15.12 Method Invocation Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12", usedFor: ["terminal invocation", "overload typing"], evidence: "method invocation/target typing 보충 specification입니다." },
    { id: "java-stream-api", repository: "Java SE21 API", path: "java.util.stream.Stream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["pipeline", "single use", "operations"], evidence: "Stream 중심 API 계약입니다." },
    { id: "java-stream-package-summary", repository: "Java SE21 API", path: "java.util.stream package", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html", usedFor: ["laziness", "non-interference", "side effects"], evidence: "stream package semantic requirements입니다." },
    { id: "java-intstream-api", repository: "Java SE21 API", path: "java.util.stream.IntStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/IntStream.html", usedFor: ["primitive stream", "range", "numeric terminals"], evidence: "primitive specialized stream 근거입니다." },
    { id: "java-arrays-api", repository: "Java SE21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["array stream"], evidence: "primitive/reference array stream factory 근거입니다." },
    { id: "java-optional-double-api", repository: "Java SE21 API", path: "java.util.OptionalDouble", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/OptionalDouble.html", usedFor: ["empty average"], evidence: "primitive value absence contract입니다." },
    { id: "java-stream-filter-api", repository: "Java SE21 API", path: "Stream.filter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["predicate selection"], evidence: "filter contract 근거입니다." },
    { id: "java-stream-map-api", repository: "Java SE21 API", path: "Stream.map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["projection"], evidence: "map transformation 근거입니다." },
    { id: "java-list-api", repository: "Java SE21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["encounter order", "result list"], evidence: "ordered source/result contract입니다." },
    { id: "java-stream-distinct-api", repository: "Java SE21 API", path: "Stream.distinct", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["stateful dedup"], evidence: "distinct contract 근거입니다." },
    { id: "java-stream-sorted-api", repository: "Java SE21 API", path: "Stream.sorted", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["stateful sort", "stability"], evidence: "sorted contract 근거입니다." },
    { id: "java-comparator-api", repository: "Java SE21 API", path: "java.util.Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["total order", "laws"], evidence: "comparator ordering contract입니다." },
    { id: "java-object-equals-api", repository: "Java SE21 API", path: "java.lang.Object.equals", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["distinct equality"], evidence: "object equality 근거입니다." },
    { id: "java-stream-limit-api", repository: "Java SE21 API", path: "Stream.limit", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["bounded prefix"], evidence: "limit semantics입니다." },
    { id: "java-stream-skip-api", repository: "Java SE21 API", path: "Stream.skip", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["offset prefix"], evidence: "skip semantics입니다." },
    { id: "java-stream-takewhile-api", repository: "Java SE21 API", path: "Stream.takeWhile", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["take prefix"], evidence: "takeWhile semantics입니다." },
    { id: "java-stream-dropwhile-api", repository: "Java SE21 API", path: "Stream.dropWhile", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["drop prefix"], evidence: "dropWhile semantics입니다." },
    { id: "java-stream-iterate-api", repository: "Java SE21 API", path: "Stream.iterate", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["unbounded source"], evidence: "iterate source 근거입니다." },
    { id: "java-stream-terminal-api", repository: "Java SE21 API", path: "Stream terminal operations", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["find", "match", "reduce"], evidence: "terminal/short-circuit contracts입니다." },
    { id: "java-int-summary-statistics-api", repository: "Java SE21 API", path: "java.util.IntSummaryStatistics", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/IntSummaryStatistics.html", usedFor: ["one-pass stats"], evidence: "count/sum/min/max/average collector입니다." },
    { id: "java-optional-api", repository: "Java SE21 API", path: "java.util.Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["empty reduce", "find"], evidence: "reference value absence contract입니다." },
    { id: "java-stream-collect-api", repository: "Java SE21 API", path: "Stream.collect", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["mutable reduction"], evidence: "collect terminal 근거입니다." },
    { id: "java-stream-tolist-api", repository: "Java SE21 API", path: "Stream.toList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["unmodifiable result", "ordered result"], evidence: "toList contract입니다." },
    { id: "java-collectors-api", repository: "Java SE21 API", path: "java.util.stream.Collectors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html", usedFor: ["toCollection", "toMap"], evidence: "built-in collectors 근거입니다." },
    { id: "java-collector-api", repository: "Java SE21 API", path: "java.util.stream.Collector", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collector.html", usedFor: ["supplier accumulator combiner", "characteristics"], evidence: "collector laws 근거입니다." },
    { id: "java-arraylist-api", repository: "Java SE21 API", path: "java.util.ArrayList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html", usedFor: ["explicit mutable result"], evidence: "mutable list supplier 근거입니다." },
    { id: "java-treemap-api", repository: "Java SE21 API", path: "java.util.TreeMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html", usedFor: ["deterministic key order"], evidence: "sorted map result 근거입니다." },
    { id: "java-stream-peek-api", repository: "Java SE21 API", path: "Stream.peek", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["debug observation", "elision caveat"], evidence: "peek usage/caveat 근거입니다." },
    { id: "java-stream-foreach-api", repository: "Java SE21 API", path: "Stream.forEach/forEachOrdered", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["effect order"], evidence: "forEach ordering contract입니다." },
    { id: "java-atomic-integer-api", repository: "Java SE21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["observation", "close count"], evidence: "atomic counter 근거입니다." },
    { id: "java-stream-parallel-api", repository: "Java SE21 API", path: "parallel streams", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html", usedFor: ["parallel reduction", "ordering"], evidence: "parallel stream semantic guidance입니다." },
    { id: "java-base-stream-api", repository: "Java SE21 API", path: "java.util.stream.BaseStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/BaseStream.html", usedFor: ["parallel flag", "close/onClose"], evidence: "base stream lifecycle/execution mode contract입니다." },
    { id: "java-forkjoinpool-api", repository: "Java SE21 API", path: "java.util.concurrent.ForkJoinPool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html", usedFor: ["worker pool", "blocking caveat"], evidence: "work-stealing pool 운영 근거입니다." },
    { id: "java-files-lines-api", repository: "Java SE21 API", path: "Files.lines", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["resource-backed lines"], evidence: "close-required lazy lines stream 근거입니다." },
    { id: "java-files-api", repository: "Java SE21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp file", "cleanup"], evidence: "file lifecycle APIs 근거입니다." },
    { id: "java-standard-charsets-api", repository: "Java SE21 API", path: "java.nio.charset.StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["explicit UTF-8"], evidence: "portable charset constant 근거입니다." },
    { id: "java-random-api", repository: "Java SE21 API", path: "java.util.Random", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html", usedFor: ["fixed-seed verification"], evidence: "reproducible input generator 근거입니다." },
    { id: "java-spliterator-api", repository: "Java SE21 API", path: "java.util.Spliterator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Spliterator.html", usedFor: ["characteristics", "splitting"], evidence: "source traversal/splitting contracts입니다." },
    { id: "java-collections-api", repository: "Java SE21 API", path: "java.util.Collections", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html", usedFor: ["independent oracle sort"], evidence: "imperative oracle sort 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 10,
    filesUsed: 10,
    uncoveredNotes: [
      "class12 Ex01~Ex10 전체를 읽고 package10 warning0 compile과 public mains7 역할을 확인했습니다.",
      "direct Ex07~Ex10은 별도 classes에서 warning0 compile하고 exact10/9/3/6 logical outputs를 fresh JVM으로 검증했습니다.",
      "companions Ex03·Ex05·Ex06도 exact1/4/4 lines로 package health를 확인했습니다.",
      "baseline과 hostile launcher4 modes는 child environment isolation 뒤 stdout·stderr·exit가 동일합니다.",
      "original audit는 async drain, closed stdin, timeout10s, tree kill, grace5s, Dispose와 parent-bound temp cleanup을 사용합니다.",
      "모든 synthetic Java examples는 --release21 -proc:none -Xlint:all compiler output0와 exact stdout을 요구합니다.",
      "lazy/single-use/source shape/filter/map/stateful/prefix/terminal/collect/effect/parallel/resource/test chapters를 Java SE21 APIs로 확장했습니다.",
      "unordered sequence, thread name, implementation exception message/class와 random temp path를 public golden에서 제외했습니다.",
      "공개 sources/code/output에 absolute local path·credential·개인 name-like source literals를 포함하지 않았습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

function createAdditionalChapters() {
  return [
    {
      id: "terminal-reduction-optional-contracts",
      title: "terminal operations는 empty·short-circuit·identity·associativity 계약을 서로 다르게 가집니다",
      lead: "count 한 번 해 본 뒤 sum을 다시 부르는 식의 재사용을 버리고, 질문마다 새 pipeline과 값 부재 정책을 가진 terminal contract를 선택합니다.",
      explanations: [
        "count는 long, primitive sum은 primitive zero identity, average·min·max·identity 없는 reduce는 값 부재를 Optional 계열로 표현합니다. empty 입력을0으로 볼지 부재로 볼지는 terminal 기본값을 맹목적으로 따르지 말고 domain에서 정합니다.",
        "findFirst는 encounter order가 있는 stream에서 첫 element를 요구하고, findAny는 어떤 element도 허용해 parallel optimization 여지가 있습니다. deterministic business selection에 findAny를 사용하지 않습니다.",
        "anyMatch·allMatch·noneMatch는 short-circuit terminals입니다. empty stream에서 anyMatch는 false, allMatch와 noneMatch는 true인 vacuous truth를 가지므로 ‘검사 통과’와 ‘데이터 존재’를 함께 요구하면 별도 count/presence 조건이 필요합니다.",
        "reduce(identity, accumulator)는 identity가 모든 input에 대한 항등원이어야 합니다. parallel reduction에서는 accumulator/combiner가 associative하고 compatible해야 partition regrouping에도 같은 결과를 냅니다.",
        "subtraction·floating-point addition·StringBuilder 공유처럼 순서·grouping에 민감한 연산은 parallel reduce에서 결과 또는 오차가 달라질 수 있습니다. strict reproducibility가 필요하면 stable order와 numeric algorithm을 명시합니다.",
        "terminal마다 source를 다시 순회하면 expensive I/O/query/computation이 반복됩니다. 필요한 통계를 IntSummaryStatistics·custom collector 한 번으로 묶을지, readability를 위해 작은 in-memory source를 여러 번 순회할지 비용을 측정합니다.",
        "forEach는 side-effect terminal이고 reduction이 아닙니다. 결과 collection/map/value가 필요하면 collect/reduce 전용 contract를 사용하고 외부 mutable accumulator에 add/put하지 않습니다.",
      ],
      concepts: [
        { term: "identity", definition: "reduction에서 어떤 value와 결합해도 그 value를 바꾸지 않는 시작값입니다.", detail: ["sum에는0이 대표적입니다.", "parallel combiner와도 compatible해야 합니다."] },
        { term: "associativity", definition: "(a op b) op c와 a op (b op c)가 같은 의미 결과를 내는 결합 성질입니다.", detail: ["parallel regrouping에 필요합니다.", "floating-point에는 exact equality caveat가 있습니다."] },
        { term: "vacuous truth", definition: "반례가 하나도 없는 empty set에서 allMatch와 noneMatch가 true가 되는 논리 규칙입니다.", detail: ["anyMatch는 false입니다.", "presence 요구를 별도로 표현합니다."] },
      ],
      codeExamples: [{
        id: "java-stream-terminal-contracts",
        title: "count·primitive statistics·find/match·reduce의 empty와 nonempty 결과를 비교합니다",
        language: "java",
        filename: "StreamTerminalContracts.java",
        purpose: "각 질문에 새 stream을 만들고 Optional·empty match·identity 없는 reduce의 값을 deterministic output으로 고정합니다.",
        code: String.raw`import java.util.IntSummaryStatistics;
import java.util.List;
import java.util.stream.Stream;

public class StreamTerminalContracts {
    public static void main(String[] args) {
        List<Integer> values = List.of(5, 2, 9, 2);

        IntSummaryStatistics stats = values.stream()
                .mapToInt(Integer::intValue)
                .summaryStatistics();
        System.out.println("count=" + stats.getCount());
        System.out.println("sum=" + stats.getSum());
        System.out.println("min=" + stats.getMin());
        System.out.println("max=" + stats.getMax());
        System.out.println("average=" + stats.getAverage());
        System.out.println("first=" + values.stream().findFirst().orElseThrow());
        System.out.println("anyGt8=" + values.stream().anyMatch(value -> value > 8));
        System.out.println("allPositive=" + values.stream().allMatch(value -> value > 0));
        System.out.println("noneNegative=" + values.stream().noneMatch(value -> value < 0));
        System.out.println("reduced=" + values.stream().reduce(Integer::sum).orElseThrow());
        System.out.println("emptyReduce=" + Stream.<Integer>empty().reduce(Integer::sum).isEmpty());
        System.out.println("emptyAll=" + Stream.<Integer>empty().allMatch(value -> false));
    }
}`,
        walkthrough: [
          { lines: "1-3", explanation: "한 번의 primitive traversal로 여러 통계를 얻는 summary type과 독립 streams를 import합니다." },
          { lines: "6-11", explanation: "finite immutable values를 IntStream으로 바꿔 summaryStatistics 한 번으로 count/sum/min/max/average를 계산합니다." },
          { lines: "12-16", explanation: "nonempty statistics를 primitive values로 출력합니다." },
          { lines: "17-20", explanation: "findFirst와 세 match terminals를 각각 새 stream에서 실행합니다." },
          { lines: "21-23", explanation: "identity 없는 nonempty/empty reduce와 empty allMatch vacuous truth를 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamTerminalContracts.java", "StreamTerminalContracts") },
        output: { value: "count=4\nsum=18\nmin=2\nmax=9\naverage=4.5\nfirst=5\nanyGt8=true\nallPositive=true\nnoneNegative=true\nreduced=18\nemptyReduce=true\nemptyAll=true", explanation: ["summary statistics는 source를 한 번만 순회합니다.", "match terminals는 질문별로 새 stream을 사용합니다.", "identity 없는 empty reduce는 empty Optional이고 empty allMatch는 true입니다."] },
        experiments: [
          { change: "sum reduction을 subtraction으로 바꾸고 parallel()을 추가합니다.", prediction: "partition grouping에 따라 sequential left fold와 다른 결과가 나올 수 있습니다.", result: "parallel reduce에는 associative operation을 사용합니다." },
          { change: "emptyAll=true만 보고 유효 데이터 검증 성공으로 처리합니다.", prediction: "데이터0건도 통과합니다.", result: "최소 한 건 요구는 `!values.isEmpty() && allMatch(...)`처럼 별도 계약으로 표현합니다." },
        ],
        sourceRefs: ["java-class12-ex08", "java-stream-terminal-api", "java-intstream-api", "java-int-summary-statistics-api", "java-optional-api"],
      }],
      diagnostics: [
        { symptom: "allMatch 검증이 데이터가 하나도 없는데 성공한다.", likelyCause: "empty stream의 vacuous truth와 최소 cardinality 요구를 혼동했습니다.", checks: ["source count를 확인합니다.", "empty domain policy를 읽습니다.", "filter가 전부 제거했는지 봅니다."], fix: "presence 조건과 allMatch 조건을 각각 표현하고 오류 message도 구분합니다.", prevention: "empty·one-valid·one-invalid cases를 match test 기본 세트로 둡니다." },
        { symptom: "parallel reduce 결과가 실행마다 또는 sequential과 다르다.", likelyCause: "operation이 non-associative하거나 identity/combiner가 incompatible하거나 mutable accumulator를 공유했습니다.", checks: ["세 원소 regrouping law를 test합니다.", "identity와 empty result를 봅니다.", "accumulator alias를 추적합니다."], fix: "associative immutable reduction 또는 올바른 collector를 사용하고 strict order가 필요하면 sequential policy를 유지합니다.", prevention: "sequential/parallel/shuffled partition property test를 둡니다." },
      ],
      expertNotes: ["IntSummaryStatistics는 count0에서 min=Integer.MAX_VALUE, max=Integer.MIN_VALUE, average0.0 같은 sentinel/default를 갖습니다. empty policy를 stats getters만으로 추론하지 말고 count를 먼저 봅니다.", "findAny는 sequential에서 우연히 first처럼 보여도 계약이 아닙니다. 특정 selection이면 comparator+min, encounter+findFirst, explicit key lookup을 사용합니다."],
    },
    {
      id: "collect-mutable-reduction-results",
      title: "collect는 supplier·accumulator·combiner로 격리된 mutable containers를 만들고 terminal 뒤 ownership을 결정합니다",
      lead: "forEach에서 외부 List/Map을 변경하는 패턴을 버리고, duplicate key·map order·mutability까지 Collector 결과 계약에 포함합니다.",
      explanations: [
        "collect는 mutable reduction입니다. supplier가 result container를 만들고 accumulator가 한 element를 넣으며 combiner가 partitions를 합칩니다. parallel 실행에서 여러 tasks가 같은 non-concurrent container를 임의 공유하지 않게 framework가 collector contract를 사용합니다.",
        "Stream.toList는 unmodifiable List를 반환합니다. 정확한 implementation class나 identity를 가정하지 않고 mutation이 필요하면 `Collectors.toCollection(ArrayList::new)`처럼 명시합니다. result elements 자체의 deep immutability는 별도입니다.",
        "Collectors.toMap은 duplicate key가 있으면 merge function 없는 overload에서 IllegalStateException을 던집니다. overwrite·sum·reject·first/last 중 어느 policy인지 명시하고, first/last는 encounter order와 parallel semantics를 검토합니다.",
        "Map iteration order가 output contract이면 default HashMap에 기대지 않고 TreeMap supplier 또는 LinkedHashMap supplier를 선택합니다. TreeMap comparator가 equality equivalence를 바꿀 수 있음도 확인합니다.",
        "groupingBy·partitioningBy·mapping·filtering·flatMapping·collectingAndThen 같은 downstream collectors는 복합 집계를 표현하지만 한 줄에 과도하게 중첩하면 intermediate record/named collector로 나눕니다.",
        "CONCURRENT·UNORDERED·IDENTITY_FINISH characteristics는 성능 힌트이자 semantic promise입니다. custom collector가 실제로 thread-safe하지 않은데 CONCURRENT를 선언하면 data race를 만들 수 있습니다.",
        "collector result를 외부에 반환할 때 defensive copy/unmodifiable view/deep snapshot을 구분합니다. source elements가 mutable하면 unmodifiable container도 내부 object mutation을 막지 못합니다.",
      ],
      concepts: [
        { term: "mutable reduction", definition: "하나의 immutable accumulated value를 매번 만들기보다 mutable result container에 elements를 축적하는 reduction입니다.", detail: ["collect가 대표적입니다.", "partition-local container를 합칩니다."] },
        { term: "merge function", definition: "toMap에서 같은 key가 다시 나왔을 때 기존 value와 새 value를 어떤 value로 합칠지 정하는 BinaryOperator입니다.", detail: ["중복 정책을 드러냅니다.", "associativity를 검토합니다."] },
        { term: "collector characteristic", definition: "collector의 concurrency·ordering·finish transformation 성질을 framework에 알리는 flags입니다.", detail: ["거짓 promise를 금지합니다.", "result contract와 함께 test합니다."] },
      ],
      codeExamples: [{
        id: "java-stream-collect-contracts",
        title: "unmodifiable toList·mutable ArrayList·duplicate-key merge·deterministic TreeMap을 비교합니다",
        language: "java",
        filename: "StreamCollectContracts.java",
        purpose: "result mutability와 duplicate aggregation/order policy를 type/message에 의존하지 않는 stable output으로 검증합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class StreamCollectContracts {
    record Sale(String team, int amount) {}

    public static void main(String[] args) {
        List<Sale> sales = List.of(
                new Sale("red", 10),
                new Sale("blue", 10),
                new Sale("red", 7),
                new Sale("red", 3));

        List<String> immutable = sales.stream().map(Sale::team).toList();
        boolean immutableRejected;
        try {
            immutable.add("green");
            immutableRejected = false;
        } catch (UnsupportedOperationException error) {
            immutableRejected = true;
        }

        List<String> mutable = sales.stream()
                .map(Sale::team)
                .collect(Collectors.toCollection(ArrayList::new));
        mutable.add("green");

        Map<String, Integer> totals = sales.stream().collect(Collectors.toMap(
                Sale::team,
                Sale::amount,
                Integer::sum,
                TreeMap::new));

        System.out.println("immutableRejected=" + immutableRejected);
        System.out.println("mutableSize=" + mutable.size());
        System.out.println("totals=" + totals);
    }
}`,
        walkthrough: [
          { lines: "1-5", explanation: "mutable result implementation, deterministic map와 collector APIs를 import합니다." },
          { lines: "7-15", explanation: "duplicate red keys를 가진 immutable source records를 준비합니다." },
          { lines: "17-24", explanation: "Stream.toList result에 add를 시도해 UOE type만 관찰하고 implementation message/class는 고정하지 않습니다." },
          { lines: "26-29", explanation: "mutation 요구를 toCollection(ArrayList::new) supplier로 명시하고 green을 추가합니다." },
          { lines: "31-35", explanation: "duplicate team amounts를 Integer::sum으로 합치고 TreeMap key order를 선택합니다." },
          { lines: "37-39", explanation: "mutability rejection, mutable size5와 stable totals를 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamCollectContracts.java", "StreamCollectContracts") },
        output: { value: "immutableRejected=true\nmutableSize=5\ntotals={blue=10, red=20}", explanation: ["toList result는 add를 거부합니다.", "explicit ArrayList collector는 mutation을 허용합니다.", "duplicate red values는 sum되고 TreeMap order가 output을 고정합니다."] },
        experiments: [
          { change: "toMap에서 Integer::sum merge를 제거합니다.", prediction: "두 번째 red key에서 IllegalStateException이 발생합니다.", result: "duplicate가 data error인지 aggregation인지 명시 정책을 선택합니다." },
          { change: "TreeMap::new supplier를 제거하고 exact map string을 계속 assert합니다.", prediction: "HashMap iteration order를 비계약적으로 고정하게 됩니다.", result: "순서가 output/API 계약이면 ordered map supplier를 사용합니다." },
        ],
        sourceRefs: ["java-stream-collect-api", "java-stream-tolist-api", "java-collectors-api", "java-collector-api", "java-arraylist-api", "java-treemap-api"],
      }],
      diagnostics: [
        { symptom: "toMap이 duplicate key exception으로 실패한다.", likelyCause: "domain에 같은 key가 가능한데 merge 없는 overload를 사용했습니다.", checks: ["duplicate samples를 추출합니다.", "key normalization을 봅니다.", "중복이 오류인지 집계인지 product rule을 확인합니다."], fix: "오류면 명시 validation/message, 집계면 associative merge function과 deterministic map supplier를 제공합니다.", prevention: "unique·duplicate-same·duplicate-conflict cases를 collector test에 둡니다." },
        { symptom: "toList 결과에 add가 실패한다.", likelyCause: "Java16+ Stream.toList의 unmodifiable result를 mutable list로 가정했습니다.", checks: ["terminal이 toList인지 Collectors.toList인지 봅니다.", "caller가 mutation을 정말 요구하는지 확인합니다.", "elements도 mutable인지 봅니다."], fix: "불변 결과를 유지하거나 mutation 요구가 명확하면 toCollection(ArrayList::new)를 사용합니다.", prevention: "public API에 result mutability·ownership을 문서화하고 mutation contract test를 둡니다." },
      ],
      expertNotes: ["Collectors.toList는 특정 mutability/type/thread-safety를 보장하지 않으므로 mutable ArrayList가 필요하면 toCollection을 사용합니다.", "custom concurrent collector는 accumulator뿐 아니라 result container operations·combiner·finisher까지 Java Memory Model과 race 관점으로 검증해야 합니다."],
    },
    {
      id: "side-effects-peek-noninterference",
      title: "peek는 관찰 보조일 뿐 business side effect 경계가 아니며 source와 외부 accumulator를 간섭하지 않습니다",
      lead: "sequential demo에서 우연히 한 번씩 실행된 lambda를 운영 보장으로 승격하지 않고, 먼저 values/commands를 materialize한 뒤 명시 effect boundary를 실행합니다.",
      explanations: [
        "stream behavioral parameters는 non-interfering·대체로 stateless해야 합니다. lambda 안에서 source collection add/remove, shared List add, mutable counter 증가를 business 결과 생성 방법으로 사용하지 않습니다.",
        "peek는 debugging을 주목적으로 하는 intermediate operation입니다. terminal이 없으면 실행되지 않고 short-circuit면 일부만 실행되며, implementation이 결과에 영향을 주지 않는 stages/behavior invocation을 생략할 수 있는 경우도 있습니다.",
        "`stream.peek(repository::save).count()` 같은 코드는 save 횟수를 보장하지 않습니다. business effects가 필요하면 먼저 validated command list를 terminal result로 만들고, 그 뒤 ordinary loop/transactional batch에서 effect·retry·idempotency를 관리합니다.",
        "forEach도 parallel stream에서는 encounter order와 thread가 달라질 수 있습니다. forEachOrdered는 encounter order를 보존하지만 외부 system transaction ordering·exactly-once를 자동 제공하지 않습니다.",
        "AtomicInteger를 썼다고 semantic side effect가 안전해지는 것은 아닙니다. increment 자체만 atomic일 뿐 element processing과 외부 state의 복합 invariant, retries, omitted invocation 문제를 해결하지 않습니다.",
        "logging도 cost와 privacy를 가진 effect입니다. element마다 full object를 로그하지 않고 sampled/aggregate metrics, redaction, trace correlation을 사용합니다. lazy values가 terminal 전에 로그되지 않는 점을 이해합니다.",
        "testing에서는 pipeline result를 assert하고 effect boundary는 fake port/command executor로 별도 test합니다. peek call count는 JDK-pinned demonstration evidence일 수 있어도 portable business invariant로 쓰지 않습니다.",
      ],
      concepts: [
        { term: "interference", definition: "stream source나 외부 shared state를 traversal과 동시에 변경해 pipeline 의미를 흔드는 행위입니다.", detail: ["source structural mutation을 피합니다.", "Concurrent collection도 defined semantics를 확인합니다."] },
        { term: "effect boundary", definition: "pure selection/transformation 결과를 확정한 뒤 I/O·DB·message 전송을 명시적으로 수행하는 경계입니다.", detail: ["retry·transaction을 붙입니다.", "idempotency key를 관리합니다."] },
        { term: "peek non-contract", definition: "peek invocation 횟수·thread·timing을 application correctness에 사용하지 않는 원칙입니다.", detail: ["관찰/진단에 제한합니다.", "short-circuit·optimization을 고려합니다."] },
      ],
      codeExamples: [{
        id: "java-stream-peek-effect-boundary",
        title: "JDK21 peek 관찰과 materialized commands의 명시 effect 실행을 분리합니다",
        language: "java",
        filename: "StreamPeekEffectBoundary.java",
        purpose: "peek count를 demonstration으로만 기록하고 normalized distinct result 뒤 명시 loop가 effects를 수행하는 구조를 보여 줍니다.",
        code: String.raw`import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class StreamPeekEffectBoundary {
    public static void main(String[] args) {
        List<String> source = List.of(" a ", "", "b", " a ");
        AtomicInteger observed = new AtomicInteger();

        List<String> recipients = source.stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .peek(value -> observed.incrementAndGet())
                .distinct()
                .sorted()
                .toList();

        List<String> commands = recipients.stream()
                .map(value -> "send:" + value)
                .toList();

        System.out.println("recipients=" + recipients);
        System.out.println("observedOnJdk21=" + observed.get());
        for (String command : commands) {
            System.out.println(command);
        }
    }
}`,
        walkthrough: [
          { lines: "1-2", explanation: "immutable inputs와 observation-only atomic counter를 import합니다." },
          { lines: "5-7", explanation: "whitespace·empty·duplicate를 가진 source와 JDK21 demo counter를 준비합니다." },
          { lines: "9-15", explanation: "normalize/filter 뒤 peek가 three candidates를 관찰하고 distinct/sorted가 final recipients를 만듭니다." },
          { lines: "17-19", explanation: "pure result에서 effect commands를 data로 materialize합니다." },
          { lines: "21-25", explanation: "result/관찰 evidence를 출력한 뒤 stream 밖 명시 loop에서 commands를 실행합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamPeekEffectBoundary.java", "StreamPeekEffectBoundary") },
        output: { value: "recipients=[a, b]\nobservedOnJdk21=3\nsend:a\nsend:b", explanation: ["현재 JDK21 implementation에서 peek는 distinct 전 nonempty3개를 관찰합니다.", "business effect 대상은 materialized unique recipients2개이며 명시 loop가 정확히 두 commands를 실행합니다.", "observed3은 API correctness contract가 아니라 version-pinned demonstration입니다."] },
        experiments: [
          { change: "terminal toList를 제거합니다.", prediction: "pipeline traversal이 시작되지 않아 peek counter는0입니다.", result: "intermediate 선언은 effect trigger가 아닙니다." },
          { change: "명시 loop를 peek(repository::save)로 옮기고 count terminal을 사용합니다.", prediction: "save invocation을 business contract로 보장할 수 없습니다.", result: "effect는 materialized commands 뒤 명시 boundary에서 실행합니다." },
        ],
        sourceRefs: ["java-stream-peek-api", "java-stream-foreach-api", "java-stream-package-summary", "java-atomic-integer-api", "java-list-api"],
      }],
      diagnostics: [
        { symptom: "stream save/update가 일부 누락되거나 test와 production 횟수가 다르다.", likelyCause: "peek 또는 optimizable stage side effect를 correctness에 사용했습니다.", checks: ["effect가 peek/map/filter에 있는지 찾습니다.", "terminal과 short-circuit를 봅니다.", "parallel/optimization 차이를 확인합니다."], fix: "commands를 terminal result로 만든 뒤 명시 executor/transaction boundary에서 처리합니다.", prevention: "pure pipeline test와 effect-count/idempotency integration test를 분리합니다." },
        { symptom: "parallel forEach에서 List가 손상되거나 order가 바뀐다.", likelyCause: "thread-safe하지 않은 외부 accumulator와 unordered emission에 의존했습니다.", checks: ["captured mutable collections를 찾습니다.", "forEach/forEachOrdered를 구분합니다.", "result가 collect로 표현 가능한지 봅니다."], fix: "collector로 result를 만들고 ordering 필요를 선언합니다. I/O effect는 별도 bounded executor policy로 옮깁니다.", prevention: "parallel 실행에서 shared mutation0를 정적 review하고 race test를 둡니다." },
      ],
      expertNotes: ["peek를 제거했더니 버그가 사라지는 경우 timing-dependent race나 source interference가 숨어 있을 수 있습니다. 로그 자체를 synchronization처럼 사용하지 않습니다.", "reactive streams의 doOnNext도 비슷한 관찰 operator처럼 보이지만 backpressure·subscription·retry semantics가 Java Stream과 다르므로 별도 framework 계약을 읽습니다."],
    },
    {
      id: "filter-map-stateless-transformation",
      title: "filter는 cardinality를 줄이고 map은 원소마다 새 표현을 만들며 두 연산은 stateless behavior를 요구합니다",
      lead: "SQL SELECT/WHERE처럼 보이는 표면 유사성에 기대지 않고 input 한 원소가 predicate·mapper를 통과해 output shape와 type을 바꾸는 계약을 명시합니다.",
      explanations: [
        "filter는 Predicate<T>가 true인 elements만 downstream에 전달합니다. predicate는 같은 input에 일관된 판정을 내고 외부 mutable counter·clock·random·I/O에 의존하지 않는 것이 안전합니다.",
        "map은 Function<T,R>을 각 element에 적용해 output type을 바꿀 수 있는 one-to-one transformation입니다. map 자체는 element 수를 줄이지 않지만 mapper가 null을 반환하면 downstream에 null element가 생길 수 있습니다.",
        "filter와 map의 순서는 의미와 비용을 바꿉니다. 값싼 selective predicate를 먼저 두면 expensive mapping 호출을 줄일 수 있지만, predicate가 mapped field를 필요로 하면 변환을 먼저 하거나 필요한 계산을 한 번만 담은 intermediate value를 만듭니다.",
        "source encounter order가 있고 pipeline이 unordered로 바뀌지 않았다면 filter와 map은 surviving elements의 relative order를 보존합니다. 이것은 forEach의 parallel emission order와는 별도 문제입니다.",
        "mapper에서 source object를 mutate하면 stream 결과와 원본 collection이 동시에 바뀌어 재실행·병렬화·테스트가 어려워집니다. immutable record/DTO projection처럼 새 value를 반환합니다.",
        "null input policy는 pipeline 시작 전에 결정합니다. collection 자체 null, null elements, mapper null result를 각각 reject·filter·Optional/domain value 중 무엇으로 처리할지 API boundary에 씁니다. 단순 `filter(Objects::nonNull)`이 데이터 손실을 숨기지 않게 합니다.",
        "checked exception을 던지는 I/O mapper를 lambda 안에서 broad RuntimeException으로 감싸지 않습니다. I/O source를 별도 boundary에서 읽어 values로 변환하거나, failure를 명시한 result type/collector와 resource lifetime을 설계합니다.",
      ],
      concepts: [
        { term: "stateless behavior", definition: "한 element 처리 결과가 이전 elements 처리나 외부 변경 가능한 누적 상태에 의존하지 않는 lambda behavior입니다.", detail: ["재실행 가능성이 높습니다.", "parallel partition에 적합합니다."] },
        { term: "non-interference", definition: "stream traversal 중 source를 구조적으로 변경하거나 pipeline 결과에 영향을 주는 방식으로 간섭하지 않는 요구입니다.", detail: ["source mutation을 피합니다.", "Concurrent collection은 별도 semantics입니다."] },
        { term: "projection", definition: "domain object에서 화면·전송·집계에 필요한 새 value shape로 변환하는 map 단계입니다.", detail: ["원본을 mutate하지 않습니다.", "필드·null·format 계약을 명시합니다."] },
      ],
      codeExamples: [{
        id: "java-stream-filter-map-projection",
        title: "결제 완료 주문만 immutable summary로 투영하고 원본 불변성을 확인합니다",
        language: "java",
        filename: "StreamFilterMapProjection.java",
        purpose: "filter cardinality, map type transformation, encounter order와 source non-mutation을 exact list로 검증합니다.",
        code: String.raw`import java.util.List;

public class StreamFilterMapProjection {
    record Order(String id, Status status, int amount) {}
    record Summary(String id, int amount) {}
    enum Status { PAID, PENDING }

    public static void main(String[] args) {
        List<Order> orders = List.of(
                new Order("A", Status.PAID, 1200),
                new Order("B", Status.PENDING, 500),
                new Order("C", Status.PAID, 800),
                new Order("D", Status.PAID, 1600));

        List<Summary> paid = orders.stream()
                .filter(order -> order.status() == Status.PAID)
                .map(order -> new Summary(order.id(), order.amount()))
                .toList();

        System.out.println("paid=" + paid);
        System.out.println("sourceSize=" + orders.size());
        System.out.println("pendingStill=" + orders.get(1).status());
    }
}`,
        walkthrough: [
          { lines: "1-6", explanation: "immutable source/projection records와 finite enum status를 정의합니다." },
          { lines: "8-13", explanation: "encounter order A·B·C·D와 한 건의 PENDING을 가진 immutable source를 만듭니다." },
          { lines: "15-18", explanation: "PAID predicate로3건만 통과시키고 새 Summary type으로 one-to-one map한 뒤 unmodifiable result list를 얻습니다." },
          { lines: "20-22", explanation: "projection order와 source size/status가 그대로임을 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamFilterMapProjection.java", "StreamFilterMapProjection") },
        output: { value: "paid=[Summary[id=A, amount=1200], Summary[id=C, amount=800], Summary[id=D, amount=1600]]\nsourceSize=4\npendingStill=PENDING", explanation: ["B만 filter되고 surviving A·C·D order가 유지됩니다.", "map은 Order를 Summary로 바꾸지만 source4와 B status는 변하지 않습니다."] },
        experiments: [
          { change: "filter를 map 뒤로 옮기되 Summary에서 status를 제거한 채 같은 조건을 씁니다.", prediction: "필요 정보가 사라져 compile할 수 없습니다.", result: "pipeline stage마다 downstream이 필요한 information을 보존해야 합니다." },
          { change: "mapper가 source Order의 field를 바꾸게 mutable class로 변경합니다.", prediction: "stream 결과뿐 아니라 원본과 다음 실행 결과도 달라집니다.", result: "projection은 새 immutable value를 반환하고 source mutation을 분리합니다." },
        ],
        sourceRefs: ["java-class12-ex10", "java-stream-filter-api", "java-stream-map-api", "java-stream-package-summary", "java-list-api"],
      }],
      diagnostics: [
        { symptom: "같은 source로 pipeline을 두 번 실행했는데 결과가 다르다.", likelyCause: "predicate/mapper가 외부 counter·random·clock·mutable source state를 읽거나 씁니다.", checks: ["captured variables를 찾습니다.", "source objects가 mutate됐는지 비교합니다.", "lambda를 pure function test로 분리합니다."], fix: "필요한 context를 immutable snapshot으로 주입하고 transformation은 새 value를 반환하게 합니다.", prevention: "same-input repeat test와 source deep-equality assertion을 둡니다." },
        { symptom: "map 뒤 terminal에서 예상하지 못한 NullPointerException이 난다.", likelyCause: "mapper가 null을 반환했거나 source에 null element가 있습니다.", checks: ["null origin을 추적합니다.", "sorted/mapToInt 같은 null-intolerant stage를 봅니다.", "boundary schema를 확인합니다."], fix: "null을 boundary에서 reject하거나 Optional/domain outcome으로 모델링하고 silent filter는 명시 정책일 때만 사용합니다.", prevention: "null collection·null element·null field cases를 API contract test에 둡니다." },
      ],
      expertNotes: ["HotSpot이 lambda allocation이나 stage를 최적화할 수 있어도 semantic non-interference requirement는 사라지지 않습니다.", "filter-map fusion은 readability가 유지되는 선에서 사용합니다. expensive value를 predicate와 mapper가 중복 계산하면 named intermediate record로 한 번 계산하는 편이 낫습니다."],
    },
    {
      id: "distinct-sorted-encounter-order",
      title: "distinct와 sorted는 stateful intermediate operations이며 equality·comparator·encounter order가 결과와 메모리를 결정합니다",
      lead: "중복 제거와 정렬을 단순 체인 두 글자로 보지 않고 전체 이전 원소를 기억하거나 materialize해야 하는 barrier와 pagination 안정성 문제로 읽습니다.",
      explanations: [
        "distinct는 object stream에서 equals/hashCode 의미로 중복을 판단합니다. ordered stream에서는 첫 encounter를 보존하지만 unordered source에서는 어느 representative가 먼저인지 business contract로 가정하지 않습니다.",
        "distinct는 이전에 본 keys를 기억해야 하는 stateful operation입니다. cardinality가 크거나 keys가 무거우면 memory가 커지며 hash collision·mutable key는 Set과 같은 문제를 만듭니다.",
        "sorted()는 elements의 natural order를 요구하고 sorted(comparator)는 명시 comparator를 사용합니다. terminal이 시작되기 전에 finite upstream을 모두 buffer해야 하므로 unbounded stream 앞에서는 완료되지 않습니다.",
        "ordered stream의 sort는 stable이므로 comparator가0으로 보는 elements의 기존 relative order를 보존해야 합니다. 그러나 comparator tie를 pagination key로 남겨 두면 source encounter order가 DB/run마다 달라질 수 있어 unique tie-breaker를 추가합니다.",
        "comparator가 transitive·antisymmetric·consistent sign을 만족하지 않으면 sort가 잘못되거나 contract violation exception을 낼 수 있습니다. mutable fields를 comparator key로 쓰는 동안 동시에 변경하지 않습니다.",
        "distinct 뒤 sorted와 sorted 뒤 distinct는 같은 set처럼 보여도 representative/비용이 다를 수 있습니다. expensive sort 전에 중복을 줄이는 것이 유리할 수 있지만 equality와 comparator가 다른 equivalence를 만들면 요구 결과를 먼저 정의합니다.",
        "Ex09의 natural/reverse 결과는 String natural order와 고정 list source라 deterministic입니다. 일반 HashSet·unordered parallel source에 같은 exact order assertion을 복사하지 않습니다.",
      ],
      concepts: [
        { term: "stateful intermediate", definition: "현재 element 결과를 내기 위해 이전 elements 또는 upstream 전체를 기억해야 하는 중간 연산입니다.", detail: ["distinct·sorted가 대표적입니다.", "memory·parallel barrier 비용이 있습니다."] },
        { term: "encounter order", definition: "source와 연산이 elements를 만나는 논리적 순서입니다.", detail: ["List stream에는 보통 존재합니다.", "unordered source에는 안정 순서를 가정하지 않습니다."] },
        { term: "stable sort", definition: "comparator가 같은 순위로 판단한 elements의 기존 relative order를 유지하는 정렬 성질입니다.", detail: ["ordered streams에서 의미가 있습니다.", "고유 pagination tie-breaker를 대체하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-stream-distinct-sorted-order",
        title: "record equality distinct와 total comparator sort를 분리해 representative·order를 확인합니다",
        language: "java",
        filename: "StreamDistinctSortedOrder.java",
        purpose: "ordered distinct의 first encounter와 priority+id total ordering을 deterministic labels로 증명합니다.",
        code: String.raw`import java.util.Comparator;
import java.util.List;

public class StreamDistinctSortedOrder {
    record Ticket(String id, int priority) {
        String label() { return id + ":" + priority; }
    }

    public static void main(String[] args) {
        List<Ticket> source = List.of(
                new Ticket("A", 2),
                new Ticket("B", 1),
                new Ticket("A", 2),
                new Ticket("C", 1),
                new Ticket("D", 2));

        List<String> unique = source.stream()
                .distinct()
                .map(Ticket::label)
                .toList();

        Comparator<Ticket> byPriorityThenId = Comparator
                .comparingInt(Ticket::priority)
                .thenComparing(Ticket::id);
        List<String> ordered = source.stream()
                .distinct()
                .sorted(byPriorityThenId)
                .map(Ticket::label)
                .toList();

        System.out.println("unique=" + unique);
        System.out.println("ordered=" + ordered);
    }
}`,
        walkthrough: [
          { lines: "1-7", explanation: "record equality가 id+priority 전체를 사용하고 label은 stable public representation만 만듭니다." },
          { lines: "9-15", explanation: "A:2 duplicate와 priority ties를 가진 ordered source를 준비합니다." },
          { lines: "17-20", explanation: "distinct가 첫 A:2를 남기고 source encounter order로 네 labels를 만듭니다." },
          { lines: "22-29", explanation: "priority 뒤 id tie-breaker를 가진 total comparator로 중복 제거 결과를 안정 정렬합니다." },
          { lines: "31-32", explanation: "unique encounter order와 explicit business order를 분리해 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamDistinctSortedOrder.java", "StreamDistinctSortedOrder") },
        output: { value: "unique=[A:2, B:1, C:1, D:2]\nordered=[B:1, C:1, A:2, D:2]", explanation: ["record-equal A:2 두 번째가 제거되고 first encounter가 남습니다.", "priority1/2 각 group은 id tie-breaker로 total order를 가집니다."] },
        experiments: [
          { change: "thenComparing(Ticket::id)를 제거합니다.", prediction: "현재 ordered source에서는 stable sort라 B,C와 A,D 순서가 유지되지만 source order가 바뀌면 tie 결과도 바뀝니다.", result: "pagination/export contract에는 unique tie-breaker를 둡니다." },
          { change: "무한 iterate stream 앞에 sorted를 둡니다.", prediction: "전체 upstream 완료를 기다리므로 terminal 결과에 도달하지 못합니다.", result: "unbounded source는 먼저 의미 있는 bound/short-circuit로 finite하게 만듭니다." },
        ],
        sourceRefs: ["java-class12-ex09", "java-class12-ex10", "java-stream-distinct-api", "java-stream-sorted-api", "java-comparator-api", "java-object-equals-api"],
      }],
      diagnostics: [
        { symptom: "페이지 사이에 같은 항목이 중복되거나 빠진다.", likelyCause: "sorted comparator가 동률을 남기고 source encounter order가 요청마다 달라졌습니다.", checks: ["comparator tie 수를 셉니다.", "unique id tie-breaker가 있는지 봅니다.", "source snapshot이 같은지 확인합니다."], fix: "business sort keys 뒤 immutable unique key를 추가하고 같은 snapshot/cursor policy를 사용합니다.", prevention: "shuffle source 반복 test에서 결과 order가 동일한지 검증합니다." },
        { symptom: "distinct 이후에도 논리적 중복이 남는다.", likelyCause: "domain equality와 record/class equals/hashCode가 다른 fields를 사용하거나 normalize 전 값이 다릅니다.", checks: ["equals/hashCode 계약을 확인합니다.", "case/Unicode/whitespace normalization policy를 봅니다.", "mutable key 변경을 찾습니다."], fix: "명시 key로 collect하거나 domain equality를 바로잡고 normalization boundary를 한 곳에 둡니다.", prevention: "equal/unequal/hash collision tests와 representative policy를 작성합니다." },
      ],
      expertNotes: ["parallel ordered distinct/sorted는 full barrier와 buffering 때문에 sequential보다 느릴 수 있습니다. unordered가 허용되는지와 cardinality를 먼저 측정합니다.", "locale-aware user text 정렬은 String natural order로 해결되지 않습니다. Collator 설정·locale·version과 equality normalization을 별도 계약으로 pin합니다."],
    },
    {
      id: "slice-take-drop-infinite-streams",
      title: "limit·skip·takeWhile·dropWhile은 encounter prefix를 다루며 무한 source의 종료 가능성을 결정합니다",
      lead: "원소 수를 자르는 연산과 predicate를 만족하는 원소을 고르는 filter를 구분해, ordered/unordered와 infinite pipeline에서 종료·비용을 예측합니다.",
      explanations: [
        "limit(n)은 최대 n elements만 downstream에 전달하는 short-circuit stateful operation이고 skip(n)은 앞 n elements를 버립니다. n이 음수면 IllegalArgumentException이므로 외부 pagination 값을 검증합니다.",
        "ordered source에서 limit/skip은 encounter prefix 기준입니다. `skip(offset).limit(size)` offset pagination은 offset이 커질수록 앞 elements를 계속 순회해야 하므로 대규모/변경 데이터에는 source-level keyset pagination을 검토합니다.",
        "takeWhile은 ordered stream의 longest prefix 중 predicate가 true인 부분만 취합니다. 중간에 false가 한 번 나오면 뒤에 다시 true인 element가 있어도 끝납니다. filter는 위치와 무관하게 모든 matching elements를 고릅니다.",
        "dropWhile은 ordered stream의 longest matching prefix만 버리고 첫 false부터 나머지를 모두 전달합니다. filter(predicate.negate())와 같지 않습니다.",
        "iterate·generate는 limit·takeWhile·findFirst·match 같은 종료 조건이 없으면 unbounded일 수 있습니다. sorted·distinct 뒤 limit처럼 stateful barrier가 먼저 있으면 limit가 있어도 결과를 못 만들 수 있습니다.",
        "unordered stream의 takeWhile/dropWhile은 ordered prefix 직관을 그대로 적용할 수 없습니다. specification이 허용하는 subset/동작 범위를 확인하고 order가 business 의미라면 unordered/parallel 최적화를 하지 않습니다.",
        "parallel ordered skip/limit/takeWhile/dropWhile은 정확한 prefix 유지 때문에 조정 비용이 큽니다. source spliterator characteristics와 실제 latency/throughput을 측정한 뒤 결정합니다.",
      ],
      concepts: [
        { term: "prefix operation", definition: "encounter order의 시작 부분을 기준으로 elements를 유지하거나 버리는 연산입니다.", detail: ["limit·skip이 count 기반입니다.", "takeWhile·dropWhile이 predicate 기반입니다."] },
        { term: "unbounded stream", definition: "source 자체가 유한 종료를 제공하지 않아 terminal이 끝나려면 downstream short-circuit가 필요한 stream입니다.", detail: ["iterate·generate가 만들 수 있습니다.", "stateful barrier 순서에 주의합니다."] },
        { term: "offset cost", definition: "skip이 반환하지 않을 앞 elements도 source에서 순회해야 해 offset 증가에 따라 생기는 비용입니다.", detail: ["in-memory와 DB 모두 측정합니다.", "keyset/cursor 대안을 검토합니다."] },
      ],
      codeExamples: [{
        id: "java-stream-prefix-infinite",
        title: "filter와 takeWhile 차이, skip/limit window, bounded iterate를 한 번에 비교합니다",
        language: "java",
        filename: "StreamPrefixInfinite.java",
        purpose: "ordered prefix semantics와 unbounded source의 downstream limit 종료를 exact lists로 검증합니다.",
        code: String.raw`import java.util.List;
import java.util.stream.IntStream;
import java.util.stream.Stream;

public class StreamPrefixInfinite {
    public static void main(String[] args) {
        List<Integer> mixed = List.of(1, 2, 7, 3, 8);

        System.out.println("window=" + IntStream.rangeClosed(1, 10)
                .skip(3).limit(4).boxed().toList());
        System.out.println("filter=" + mixed.stream()
                .filter(value -> value < 5).toList());
        System.out.println("take=" + mixed.stream()
                .takeWhile(value -> value < 5).toList());
        System.out.println("drop=" + mixed.stream()
                .dropWhile(value -> value < 5).toList());
        System.out.println("multiples=" + Stream.iterate(1, value -> value + 1)
                .filter(value -> value % 7 == 0)
                .limit(3)
                .toList());
    }
}`,
        walkthrough: [
          { lines: "1-3", explanation: "finite list/range와 unbounded iterate source types를 import합니다." },
          { lines: "6-7", explanation: "predicate가 true→true→false→true→false로 바뀌는 ordered source를 준비합니다." },
          { lines: "9-10", explanation: "1~10에서 세 개를 skip하고 네 개만 받아4~7 window를 만듭니다." },
          { lines: "11-16", explanation: "filter는 뒤3도 고르지만 takeWhile은 첫7에서 끝나고 dropWhile은7부터 뒤 전부를 보존합니다." },
          { lines: "17-20", explanation: "무한 증가 source가7 배수 세 개를 찾은 뒤 limit로 종료됩니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamPrefixInfinite.java", "StreamPrefixInfinite") },
        output: { value: "window=[4, 5, 6, 7]\nfilter=[1, 2, 3]\ntake=[1, 2]\ndrop=[7, 3, 8]\nmultiples=[7, 14, 21]", explanation: ["skip/limit은 ordered count window입니다.", "take/drop은 prefix이고 filter는 전체 match입니다.", "unbounded iterate는 limit3 때문에 종료합니다."] },
        experiments: [
          { change: "iterate pipeline에서 limit를 제거하고 toList를 호출합니다.", prediction: "unbounded traversal과 materialization이 끝나지 않거나 memory를 소진합니다.", result: "unbounded source에는 reachable short-circuit termination을 설계합니다." },
          { change: "sorted를 limit 앞에 추가합니다.", prediction: "sorted가 infinite upstream 전체를 기다려 limit에 도달하지 못합니다.", result: "연산 존재뿐 아니라 pipeline 순서가 종료 가능성을 결정합니다." },
        ],
        sourceRefs: ["java-class12-ex10", "java-stream-limit-api", "java-stream-skip-api", "java-stream-takewhile-api", "java-stream-dropwhile-api", "java-stream-iterate-api"],
      }],
      diagnostics: [
        { symptom: "takeWhile이 뒤쪽 matching elements를 누락한다.", likelyCause: "takeWhile을 전체 selection filter처럼 사용했습니다.", checks: ["첫 false 위치를 찾습니다.", "source order가 의미 있는지 봅니다.", "filter가 실제 요구인지 확인합니다."], fix: "전체 matching selection이면 filter, sorted prefix cutoff이면 takeWhile을 사용합니다.", prevention: "true-false-true fixture로 두 연산 차이를 test합니다." },
        { symptom: "limit가 있는데도 pipeline이 종료되지 않는다.", likelyCause: "infinite source와 limit 사이에 sorted 같은 full-buffer stateful stage가 있습니다.", checks: ["source finite 여부를 봅니다.", "stateful stages 순서를 나열합니다.", "short-circuit가 실제 upstream demand를 막을 수 있는지 봅니다."], fix: "의미가 허용하면 먼저 finite bound를 적용하거나 source query 자체에 bound/order를 적용합니다.", prevention: "unbounded source pipeline review에 termination proof를 요구합니다." },
      ],
      expertNotes: ["Java9의 three-argument iterate(seed,hasNext,next)는 finite source를 직접 표현할 수 있어 limit보다 종료 조건 의도가 명확한 경우가 있습니다.", "offset pagination은 stream 문법 문제가 아니라 changing dataset consistency 문제도 가집니다. cursor에 sort key·snapshot/version을 포함하는 source-level protocol을 검토합니다."],
    },
    {
      id: "stream-pipeline-lazy-single-use",
      title: "Stream은 원소를 저장하지 않고 terminal 수요가 생길 때 source를 한 번 순회하는 pipeline입니다",
      lead: "intermediate 연산을 적었다는 사실과 실제 원소 처리가 시작됐다는 사실을 분리하고, short-circuit가 필요한 만큼만 upstream을 당기는 순서를 trace합니다.",
      explanations: [
        "Stream은 collection처럼 원소를 소유하는 data structure가 아니라 source에서 elements를 전달받아 연산 stages를 거치는 traversal abstraction입니다. pipeline object를 장기 상태 field나 cache value처럼 보관하지 않습니다.",
        "filter·map·peek 같은 intermediate operation은 새 stream stage를 반환하고 보통 terminal operation이 호출될 때까지 traversal을 시작하지 않습니다. pipeline construction과 execution을 로그에서 구분해야 합니다.",
        "terminal operation은 pipeline을 소비합니다. 같은 Stream instance에 두 번째 terminal을 호출하면 이미 operated upon or closed 상태의 IllegalStateException이 발생할 수 있습니다. 정확한 message는 contract로 고정하지 않고 type과 호출 경계를 검증합니다.",
        "findFirst·anyMatch·limit처럼 short-circuit 가능한 연산은 답을 결정할 만큼만 upstream elements를 요청할 수 있습니다. side effect 횟수를 전체 source 크기와 같다고 가정하면 안 됩니다.",
        "lazy pipeline은 일반적으로 element-by-element로 stages를 fuse합니다. source 전체 map 뒤 전체 filter가 아니라 element1의 map/filter, element2의 map/filter처럼 진행될 수 있습니다. sorted·distinct 같은 stateful stage는 buffering 때문에 다른 실행 형태를 가집니다.",
        "stream reuse가 필요하다는 요구는 source supplier가 필요하다는 뜻일 수 있습니다. `Supplier<Stream<T>>`가 매 호출마다 새 stream을 만들게 하거나, 더 단순하게 source collection에서 pipeline을 다시 시작합니다. supplier가 같은 consumed instance를 돌려주지 않게 test합니다.",
        "terminal result를 변수로 저장하는 것과 Stream을 저장하는 것을 구분합니다. List·summary·domain result는 재사용할 수 있지만 pipeline traversal은 operation lifetime에 묶습니다.",
      ],
      concepts: [
        { term: "intermediate operation", definition: "다른 Stream을 반환해 pipeline stage를 추가하고 terminal 수요 전에는 대개 traversal하지 않는 연산입니다.", detail: ["filter·map·sorted가 예입니다.", "stateless/stateful을 구분합니다."] },
        { term: "terminal operation", definition: "pipeline traversal을 시작하고 non-stream result 또는 side effect를 만든 뒤 stream을 소비하는 연산입니다.", detail: ["count·collect·forEach가 예입니다.", "두 번째 terminal reuse를 금지합니다."] },
        { term: "short-circuit", definition: "전체 source를 보지 않고도 결과가 결정되면 traversal을 일찍 끝낼 수 있는 성질입니다.", detail: ["findFirst·anyMatch·limit에 나타납니다.", "무한 source의 종료 가능성을 결정합니다."] },
      ],
      codeExamples: [{
        id: "java-stream-lazy-single-use",
        title: "pipeline construction·element fusion·findFirst short-circuit·reuse failure를 한 trace에서 봅니다",
        language: "java",
        filename: "StreamLazySingleUse.java",
        purpose: "intermediate 선언 시점과 terminal 수요 시점, 필요한 두 elements만 처리하는 순서와 instance 단일 소비를 증명합니다.",
        code: String.raw`import java.util.List;
import java.util.stream.Stream;

public class StreamLazySingleUse {
    public static void main(String[] args) {
        Stream<Integer> pipeline = List.of(1, 2, 3, 4).stream()
                .peek(value -> System.out.println("source=" + value))
                .map(value -> {
                    System.out.println("map=" + value);
                    return value * 10;
                })
                .filter(value -> {
                    System.out.println("filter=" + value);
                    return value >= 20;
                });

        System.out.println("built");
        int first = pipeline.findFirst().orElseThrow();
        System.out.println("first=" + first);

        try {
            pipeline.count();
        } catch (IllegalStateException error) {
            System.out.println("reused=" + error.getClass().getSimpleName());
        }
    }
}`,
        walkthrough: [
          { lines: "1-2", explanation: "immutable source와 single-use Stream type을 import합니다." },
          { lines: "5-15", explanation: "peek·map·filter stages를 구성하지만 아직 source log는 실행되지 않습니다." },
          { lines: "17-19", explanation: "built 뒤 findFirst가 수요를 만들며1은 탈락하고2가 통과한 즉시 traversal을 끝냅니다." },
          { lines: "21-25", explanation: "같은 pipeline의 두 번째 terminal은 message가 아닌 IllegalStateException type으로 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamLazySingleUse.java", "StreamLazySingleUse") },
        output: { value: "built\nsource=1\nmap=1\nfilter=10\nsource=2\nmap=2\nfilter=20\nfirst=20\nreused=IllegalStateException", explanation: ["built가 모든 element logs보다 먼저라 intermediate 선언이 lazy임을 보입니다.", "element별 stage fusion과 findFirst short-circuit로3·4는 처리하지 않습니다.", "consumed instance 재사용은 type-stable failure로 관찰합니다."] },
        experiments: [
          { change: "findFirst를 count로 바꿉니다.", prediction: "short-circuit가 사라져 source1~4 모두 map/filter를 거칩니다.", result: "terminal demand가 upstream 작업량을 결정합니다." },
          { change: "pipeline supplier가 항상 같은 captured Stream을 반환하게 합니다.", prediction: "첫 호출만 성공하고 두 번째 terminal에서 reuse failure가 납니다.", result: "supplier는 매번 source에서 새 Stream instance를 만들어야 합니다." },
        ],
        sourceRefs: ["java-class12-ex08", "java-stream-api", "java-stream-package-summary", "jls-method-invocation"],
      }],
      diagnostics: [
        { symptom: "intermediate lambda에 둔 breakpoint/log가 pipeline 생성 때 실행되지 않는다.", likelyCause: "terminal operation이 아직 없거나 terminal이 short-circuit해 그 element까지 요청하지 않았습니다.", checks: ["terminal 존재를 확인합니다.", "short-circuit stage를 찾습니다.", "source가 empty인지 확인합니다."], fix: "pipeline result를 terminal로 소비하고, 진단은 실행 순서를 바꾸지 않는 controlled fixture에서 관찰합니다.", prevention: "construction과 traversal을 구분한 trace test를 둡니다." },
        { symptom: "두 번째 집계에서 stream has already been operated upon 오류가 난다.", likelyCause: "같은 Stream instance를 field/local alias로 재사용했습니다.", checks: ["terminal 호출 수를 찾습니다.", "supplier가 새 instance를 만드는지 봅니다.", "source 자체가 재순회 가능한지 확인합니다."], fix: "source에서 새 pipeline을 만들거나 한 terminal에서 필요한 aggregate를 함께 수집합니다.", prevention: "Stream을 반환·저장하는 API lifetime을 짧게 하고 terminal result만 보관합니다." },
      ],
      expertNotes: ["implementation은 최적화에 따라 일부 stateless stage invocation을 생략할 수 있으므로 peek/lambda 호출 횟수를 business contract로 삼지 않습니다.", "short-circuit는 무조건 빠르다는 뜻이 아닙니다. 앞쪽 hit 분포, stateful stages, ordering, parallel splitting 비용을 실제 데이터로 측정합니다."],
    },
    {
      id: "stream-sources-object-primitive-boxing",
      title: "object·primitive sources와 range를 구분해 boxing 비용과 terminal API 차이를 제어합니다",
      lead: "배열을 Stream.of에 넣었다는 같은 표면 문법도 reference array와 primitive array에서 element type이 달라지는 함정을 실행으로 제거합니다.",
      explanations: [
        "Collection.stream은 collection의 encounter order를 가진 object Stream<T>를 만들고, reference array는 Arrays.stream(T[]) 또는 Stream.of(T...)로 elements stream을 만들 수 있습니다. source를 pipeline 실행 중 구조 변경하지 않습니다.",
        "primitive array를 `Stream.of(intArray)`에 넘기면 int가 reference type T가 될 수 없으므로 T는 int[]가 되고 element 하나짜리 Stream<int[]>가 됩니다. int elements가 필요하면 Arrays.stream(int[]) 또는 IntStream.of를 사용합니다.",
        "IntStream·LongStream·DoubleStream은 primitive specialization으로 boxing을 줄이고 sum·average·summaryStatistics 같은 numeric terminals를 제공합니다. `Stream<Integer>`에는 count는 있지만 sum method가 없습니다.",
        "boxed()는 primitive stream을 Stream<Integer> 등으로 바꿉니다. object collector/API와 연결할 때 필요하지만 allocation·null 불가·numeric overflow 의미를 의식합니다. mapToInt·mapToLong·mapToDouble로 반대 방향을 선택합니다.",
        "IntStream.range(start,end)는 end exclusive이고 rangeClosed는 end inclusive입니다. empty/reversed bounds는 empty stream이 되며, 반복 횟수와 overflow 가능한 boundary를 명시합니다.",
        "Stream.empty, Stream.ofNullable, builder, iterate, generate, Files.lines 등 source는 null·finite·ordered·close-required 속성이 다릅니다. source factory 선택표에 이 네 속성을 기록합니다.",
        "primitive average는 OptionalDouble입니다. empty stream에는 값이 없으므로 getAsDouble을 바로 호출하지 않고 orElse·ifPresent·orElseThrow 등 domain policy를 선택합니다.",
      ],
      concepts: [
        { term: "primitive specialization", definition: "boxing 없이 int·long·double elements를 처리하는 IntStream·LongStream·DoubleStream 계열입니다.", detail: ["numeric terminals를 제공합니다.", "boxed로 object stream과 연결합니다."] },
        { term: "boxing", definition: "primitive value를 Integer 같은 wrapper object로 변환하는 과정입니다.", detail: ["generic APIs에 필요합니다.", "allocation·identity·null semantics가 달라집니다."] },
        { term: "range boundary", definition: "range의 시작 포함과 끝 포함/제외 규칙입니다.", detail: ["range는 end exclusive입니다.", "rangeClosed는 end inclusive입니다."] },
      ],
      codeExamples: [{
        id: "java-stream-source-shapes",
        title: "reference array·primitive array·range·boxed·numeric terminal의 shape를 비교합니다",
        language: "java",
        filename: "StreamSourceShapes.java",
        purpose: "Stream.of primitive-array container 함정과 IntStream elements, range boundaries, empty average를 deterministic values로 확인합니다.",
        code: String.raw`import java.util.Arrays;
import java.util.stream.IntStream;
import java.util.stream.Stream;

public class StreamSourceShapes {
    public static void main(String[] args) {
        String[] words = {"alpha", "beta"};
        int[] numbers = {1, 2, 3, 4, 5};

        System.out.println("objects=" + Stream.of(words).count());
        System.out.println("primitiveContainers=" + Stream.of(numbers).count());
        System.out.println("primitiveElements=" + Arrays.stream(numbers).count());
        System.out.println("range=" + IntStream.range(2, 5).boxed().toList());
        System.out.println("rangeClosed=" + IntStream.rangeClosed(2, 5).boxed().toList());
        System.out.println("sum=" + Arrays.stream(numbers).sum());
        System.out.println("average=" + Arrays.stream(numbers).average().orElseThrow());
        System.out.println("emptyAverage=" + IntStream.empty().average().isEmpty());
    }
}`,
        walkthrough: [
          { lines: "1-3", explanation: "object/primitive array sources와 specialized stream을 import합니다." },
          { lines: "6-8", explanation: "같은 logical values를 reference array와 primitive array로 준비합니다." },
          { lines: "10-12", explanation: "reference array는 elements2, Stream.of(int[])는 container1, Arrays.stream(int[])는 elements5임을 구분합니다." },
          { lines: "13-14", explanation: "end-exclusive range와 end-inclusive rangeClosed를 boxed list로 보입니다." },
          { lines: "15-17", explanation: "primitive sum·nonempty average·empty OptionalDouble 정책을 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StreamSourceShapes.java", "StreamSourceShapes") },
        output: { value: "objects=2\nprimitiveContainers=1\nprimitiveElements=5\nrange=[2, 3, 4]\nrangeClosed=[2, 3, 4, 5]\nsum=15\naverage=3.0\nemptyAverage=true", explanation: ["primitive array는 Stream.of에서 단일 reference element입니다.", "Arrays.stream과 IntStream ranges는 primitive elements를 만듭니다.", "empty average는 값 부재를 명시적으로 처리합니다."] },
        experiments: [
          { change: "Arrays.stream(numbers)를 boxed() 뒤 reduce(Integer::sum)으로 바꿉니다.", prediction: "결과15는 같지만 boxing과 Optional<Integer> 경계가 추가됩니다.", result: "primitive numeric pipeline을 유지할 수 있으면 specialization이 더 명확합니다." },
          { change: "rangeClosed(2,5)를 range(2,5)로 바꾸고 같은 count를 기대합니다.", prediction: "5가 제외되어 count가4에서3으로 줄어듭니다.", result: "loop migration 시 inclusive/exclusive boundary test가 필요합니다." },
        ],
        sourceRefs: ["java-class12-ex07", "java-class12-ex08", "java-stream-api", "java-intstream-api", "java-arrays-api", "java-optional-double-api"],
      }],
      diagnostics: [
        { symptom: "primitive 배열 stream count가 element 수가 아니라1이다.", likelyCause: "Stream.of(int[])가 Stream<int[]> 하나를 만들었습니다.", checks: ["inferred element type을 IDE/javac로 봅니다.", "array가 primitive인지 확인합니다.", "flatMapToInt가 필요한 nested shape인지 봅니다."], fix: "단일 int[]라면 Arrays.stream 또는 IntStream.of를 사용합니다.", prevention: "source factory test에 element type과 count를 함께 assert합니다." },
        { symptom: "빈 평균에서 NoSuchElementException이 발생한다.", likelyCause: "OptionalDouble.getAsDouble을 presence 확인 없이 호출했습니다.", checks: ["empty input policy를 찾습니다.", "filter 뒤 empty 가능성을 봅니다.", "default가 domain상 유효한지 확인합니다."], fix: "orElse·orElseThrow·Optional return 중 domain 의미에 맞는 정책을 선택합니다.", prevention: "empty·single·many cases를 모든 numeric aggregation test에 포함합니다." },
      ],
      expertNotes: ["boxing cost는 추측 대신 JMH처럼 dead-code elimination·warmup을 통제한 benchmark로 판단합니다. 작은 pipeline에서는 readability 차이가 더 중요할 수 있습니다.", "int sum은 overflow를 검사하지 않습니다. 합계 범위가 int를 넘을 수 있으면 mapToLong/LongStream 또는 Math.addExact 기반 policy를 선택합니다."],
    },
  ];
}

const chapterOrder: readonly string[] = [
  "class12-stream-original-golden-audit",
  "stream-pipeline-lazy-single-use",
  "stream-sources-object-primitive-boxing",
  "filter-map-stateless-transformation",
  "distinct-sorted-encounter-order",
  "slice-take-drop-infinite-streams",
  "terminal-reduction-optional-contracts",
  "collect-mutable-reduction-results",
  "side-effects-peek-noninterference",
  "parallel-stream-laws-cost-model",
  "resource-backed-stream-close-ownership",
  "verification-spliterator-benchmark-diagnostics",
];

session.chapters.sort(
  (left, right) => chapterOrder.indexOf(left.id) - chapterOrder.indexOf(right.id),
);
