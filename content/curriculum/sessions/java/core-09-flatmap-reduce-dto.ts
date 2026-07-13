import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-09-flatmap-reduce-dto"],
  slug: "core-09-flatmap-reduce-dto",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 29,
  title: "map·flatMap·reduce와 DTO/VO",
  subtitle: "one-to-one·one-to-many 변환과 reduction laws를 DTO/VO 경계, 집계·병렬성·검증까지 연결합니다.",
  level: "고급",
  estimatedMinutes: 1020,
  coreQuestion: "중첩된 domain data를 펼치고 하나의 결과로 집계할 때 shape, identity, mutability와 error policy를 어떻게 정해야 순차·병렬 실행 모두에서 같은 의미를 유지할까요?",
  summary: "원래 curriculum inventory는 class13의 Ex01·Ex02_VO·Ex03_DTO·Ex05·Ex06 다섯 files만 지정하지만 실제 package에는 Ex04, Ex07_DTO, Ex08과 Ex09_FileClass까지9 files가 있습니다. package9, inventory5, Stream/DTO scope8을 각각 warning0 compile하고 public mains6/3/5 역할을 분리했습니다. scope의 Ex01 exact9, Ex04 exact17, Ex05 exact9, Ex06 exact3, Ex08 exact20 lines를 fresh JVM으로 검증했습니다. Ex05는 flatMap2, Ex06은 reduce3, Ex08은 mutable DTO list를 Collections.sort로 바꾼 뒤 stream reduce/filter/sorted를 수행합니다. Ex09는 hard-coded local absolute path를 가진 다음 I/O 세션 원본이므로 package compile만 하고 공개 output에는 실행 경로나 파일 목록을 싣지 않습니다. 이 evidence에서 projection, flattening/mapMulti, VO·DTO·record snapshot, identity/associativity, primitive/numeric aggregation, three-arg reduce와 mutable collect, grouping/partitioning, source mutation/order, parse/error channels, parallel cost와 property verification까지 확장합니다.",
  objectives: [
    "map의 one-to-one projection과 flatMap/mapMulti의 zero-to-many cardinality 변화를 type과 count로 추적한다.",
    "DTO·VO·record·domain entity의 mutability, equality와 layer transfer 목적을 구분해 stream snapshot을 설계한다.",
    "reduce identity·accumulator·combiner의 항등원·결합법칙·compatibility를 순차/병렬 예제로 검증한다.",
    "mapToInt·summaryStatistics·BigDecimal 등 numeric 집계에서 boxing·overflow·rounding policy를 선택한다.",
    "mutable reduction은 collect의 supplier·accumulator·combiner와 collector characteristics로 구현한다.",
    "groupingBy·partitioningBy·downstream collector로 one-to-many domain aggregate를 정보 손실 없이 만든다.",
    "source mutation·null·parse failure·parallel cost를 독립 test matrix와 stable golden으로 검증한다.",
  ],
  prerequisites: [
    { title: "Stream pipeline·지연 평가", reason: "flatMap과 reduce는 source, intermediate, terminal, encounter order와 single-use/non-interference 계약 위에 동작합니다.", sessionSlug: "core-08-stream" },
    { title: "캡슐화와 값 경계", reason: "DTO/VO의 getter·setter, immutable state와 defensive snapshot을 구분하려면 object field ownership을 알아야 합니다.", sessionSlug: "oop-03-encapsulation" },
  ],
  keywords: ["map", "flatMap", "mapMulti", "reduce", "identity", "associativity", "combiner", "DTO", "VO", "record", "projection", "flattening", "IntStream", "summaryStatistics", "BigDecimal", "collect", "Collector", "groupingBy", "partitioningBy", "downstream collector", "non-interference", "parallel reduction", "property test"],
  chapters: [
    {
      id: "class13-package9-inventory5-scope8-audit",
      title: "class13 package9·inventory5·Stream/DTO scope8을 warning0 compile하고 mains5를 exact output으로 감사합니다",
      lead: "인벤토리에 빠진 Ex04·Ex07·Ex08은 내용상 반드시 포함하고, local filesystem을 열거하는 Ex09는 다음 I/O 경계로 분리해 privacy-safe compile evidence만 남깁니다.",
      explanations: [
        "class13 package에는 Stream mains Ex01·Ex04·Ex05·Ex06·Ex08, model types Ex02_VO·Ex03_DTO·Ex07_DTO와 File main Ex09의9 files가 있습니다. curriculum inventory5만 읽으면 DTO list projection과 종합 비교 Ex08을 놓치므로 scope8로 확장합니다.",
        "package9·inventory5·scope8은 서로 다른 -d directories에서 UTF-8, --release21, -proc:none, -g:source,lines, -Xlint:all, -XDrawDiagnostics로 compile하고 exit0·compiler output0을 요구합니다. public main roles는6/3/5입니다.",
        "Ex01은 같은 네 strings를 forEach로 소비한 뒤 새 stream에서 uppercase map해 blank 포함 exact9 lines를 냅니다. map은 object를 바꾸는 mutation이 아니라 새로운 projected elements stream을 만드는 intermediate operation입니다.",
        "Ex04는 mutable Ex03_DTO list를 iterator와 stream으로 각각 이름5, age30 이상 names2를 출력해 separators3 포함17 lines입니다. 두 방식 결과를 exact로 비교해 stream rewrite가 selection/projection 의미를 보존함을 확인합니다.",
        "Ex05는 팩 문자열을 flatMap으로9개 과일 names에 펼치고, sentences를 map하면 arrays3, flatMap+distinct하면 encounter-order unique words5가 되어 exact9 lines입니다. substring position에 의존하는 원본 parsing 한계는 보완 chapter에서 분리합니다.",
        "Ex06의 reduce는 sum15, max5와 leading space가 있는 String concatenation을 exact3 lines로 냅니다. positive-only max의 identity0과 String identity empty가 domain 전체에 항상 올바른지는 원본 보존 뒤 별도로 교정합니다.",
        "Ex08은 collection path에서 list를 name ascending으로 mutate한 뒤 stream path가 이미 정렬된 source를 봅니다. 마지막 label은 오름차순이라고 쓰였지만 code는 reversed comparator라 희동이→공실이 순서입니다. exact20 lines와 source shape를 모두 남겨 설명과 실제 code 차이를 숨기지 않습니다.",
        "Ex09는 package compile과 main role만 확인합니다. source의 machine-specific absolute path와 실제 directory entries는 공개 golden·prose에 복사하지 않고 io-01에서 Path/Files·working directory·privacy-safe temp fixture로 재구성합니다.",
        "baseline/hostile launcher4 modes는 child environment에서 options를 제거하고 같은 outputs/shapes를 내야 합니다. outer finally는 각 variable restore verification, temp cleanup과 body error를 독립 보존합니다.",
      ],
      concepts: [
        { term: "inventory scope", definition: "계획 파일이 직접 지정한 원본 집합입니다.", detail: ["이 세션은5 files입니다.", "실제 dependency/topic coverage와 비교합니다."] },
        { term: "expanded topic scope", definition: "누락된 dependency·동일 주제 원본을 포함해 독립 학습 질문을 완성한 집합입니다.", detail: ["class13 Stream/DTO8 files입니다.", "File example은 다음 경계로 둡니다."] },
        { term: "source shape evidence", definition: "comments를 제거한 active code에서 map·flatMap·reduce·setter 등 핵심 token 수를 세어 output만으로 안 보이는 구조를 검증한 증거입니다.", detail: ["refactor drift를 탐지합니다.", "regex 한계를 좁은 fixture로 통제합니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core09-audit",
        title: "package/inventory/scope compile, mains5 exact outputs와 active operation shapes를 두 launcher modes에서 검증합니다",
        language: "powershell",
        filename: "verify-original-core09.ps1",
        purpose: "원본 DTO/VO/Stream behavior를 재현하면서 File main의 local path output과 private directory contents는 공개 evidence에서 제외합니다.",
        code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference = 'Stop'
$optionNames = @('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved = @{}
foreach ($name in $optionNames) {
  $item = Get-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
  $saved[$name] = @{ Exists = $null -ne $item; Value = if ($item) { $item.Value } else { $null } }
}
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core09 audit " + [Guid]::NewGuid().ToString('N'))
$ownsRoot = $false
$bodyError = $null
$nl = [string][char]10

function Normalize([string]$text) { return $text.Replace(([string][char]13 + [char]10), [string][char]10) }
function Invoke-Child([string]$file, [string[]]$arguments, [string]$cwd) {
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
function Run([string]$classes, [string]$main) {
  $result = Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,("com.java.class13." + $main)) $root
  if ($result.Exit -ne 0 -or $result.Err.Length -ne 0) { throw "$main process drift" }
  return $result.Out
}
function Remove-JavaComments([string]$text) {
  $withoutBlocks = [regex]::Replace($text, '(?s)/\*.*?\*/', '')
  return [regex]::Replace($withoutBlocks, '(?m)//.*$', '')
}
function Assert-Exact([string]$actual, [string[]]$lines, [string]$label) {
  $expected = ($lines -join $nl) + $nl
  if ($actual -cne $expected) { throw "$label output drift" }
}
function Audit([string]$mode, [string]$classDir) {
  if ($mode -eq 'hostile') {
    $env:JDK_JAVAC_OPTIONS = '-J-Dcore09.audit=javac'
    $env:JDK_JAVA_OPTIONS = '-Dcore09.audit=java'
    $env:JAVA_TOOL_OPTIONS = '-Dcore09.audit=tool'
    $env:_JAVA_OPTIONS = '-Dcore09.audit=legacy'
  } else { foreach ($name in $optionNames) { Remove-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue } }
  $all = @(Get-ChildItem -LiteralPath $classDir -Filter '*.java' | Sort-Object Name)
  $inventoryNames = @('Ex01_StreamClass.java','Ex02_VO.java','Ex03_DTO.java','Ex05_StreamClass.java','Ex06_StreamClass.java')
  $scopeNames = @('Ex01_StreamClass.java','Ex02_VO.java','Ex03_DTO.java','Ex04_StreamClass.java','Ex05_StreamClass.java','Ex06_StreamClass.java','Ex07_DTO.java','Ex08_StreamClass.java')
  $inventory = @($inventoryNames | ForEach-Object { Get-Item -LiteralPath (Join-Path $classDir $_) })
  $scope = @($scopeNames | ForEach-Object { Get-Item -LiteralPath (Join-Path $classDir $_) })
  if ($all.Count -ne 9 -or $inventory.Count -ne 5 -or $scope.Count -ne 8) { throw 'source inventory drift' }
  $packageClasses = Join-Path $root ("package-" + $mode)
  $inventoryClasses = Join-Path $root ("inventory-" + $mode)
  $scopeClasses = Join-Path $root ("scope-" + $mode)
  Compile $all $packageClasses; Compile $inventory $inventoryClasses; Compile $scope $scopeClasses
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_.FullName) -match $mainPattern }).Count
  $inventoryMains = @($inventory | Where-Object { (Get-Content -Raw -LiteralPath $_.FullName) -match $mainPattern }).Count
  $scopeMains = @($scope | Where-Object { (Get-Content -Raw -LiteralPath $_.FullName) -match $mainPattern }).Count
  if (($packageMains -join ',') -cne '6' -or $inventoryMains -ne 3 -or $scopeMains -ne 5) { throw 'main role drift' }

  Assert-Exact (Run $scopeClasses 'Ex01_StreamClass') @('Java배우기','jsp배우기','spring배우기','react배우기','','JAVA배우기','JSP배우기','SPRING배우기','REACT배우기') 'Ex01'
  Assert-Exact (Run $scopeClasses 'Ex04_StreamClass') @('park','kyung','lee','test man','test woman','==========================','park','kyung','lee','test man','test woman','==========================','lee','test woman','==========================','lee','test woman') 'Ex04'
  Assert-Exact (Run $scopeClasses 'Ex05_StreamClass') @('[사과, 사과, 사과, 멜론, 멜론, 딸기, 딸기, 딸기, 딸기]','[java, spring]','[jsp, react]','[spring, sql]','java','spring','jsp','react','sql') 'Ex05'
  Assert-Exact (Run $scopeClasses 'Ex06_StreamClass') @('sum : 15','max : 5','result :  Java Spring React') 'Ex06'
  Assert-Exact (Run $scopeClasses 'Ex08_StreamClass') @('======컬렉션 방식으로 처리======','===고객명단 순서대로 출력===','공실이/40/1200','희동이/20/1200','마이콜/13/600','===총 비용은 ~~~ 입니다.===','총 비용은 3000입니다.','===나이가 20이상인 고객의 명단 출력(오름차순)===','공실이/40/1200','희동이/20/1200','======Stream 방식으로 처리======','===고객명단 순서대로 출력===','공실이/40/1200','마이콜/13/600','희동이/20/1200','===총 비용은 ~~~ 입니다.===','총 비용은 3000입니다.','===나이가 20이상인 고객의 명단 출력(오름차순)===','희동이/20/1200','공실이/40/1200') 'Ex08'

  $active = @{}
  foreach ($file in $scope) { $active[$file.Name] = Remove-JavaComments (Get-Content -Raw -LiteralPath $file.FullName) }
  $shape = @{
    map01 = ([regex]::Matches($active['Ex01_StreamClass.java'], '\.map\s*\(')).Count
    map04 = ([regex]::Matches($active['Ex04_StreamClass.java'], '\.map\s*\(')).Count
    flat05 = ([regex]::Matches($active['Ex05_StreamClass.java'], '\.flatMap\s*\(')).Count
    reduce06 = ([regex]::Matches($active['Ex06_StreamClass.java'], '\.reduce\s*\(')).Count
    reduce08 = ([regex]::Matches($active['Ex08_StreamClass.java'], '\.reduce\s*\(')).Count
    setters03 = ([regex]::Matches($active['Ex03_DTO.java'], '\bvoid\s+set\w+\s*\(')).Count
    setters07 = ([regex]::Matches($active['Ex07_DTO.java'], '\bvoid\s+set\w+\s*\(')).Count
    finals02 = ([regex]::Matches($active['Ex02_VO.java'], 'private\s+final\s+')).Count
  }
  if (($shape.Values | Measure-Object -Sum).Sum -ne 16 -or $shape.map01 -ne 1 -or $shape.map04 -ne 2 -or $shape.flat05 -ne 2 -or $shape.reduce06 -ne 3 -or $shape.reduce08 -ne 1 -or $shape.setters03 -ne 2 -or $shape.setters07 -ne 3 -or $shape.finals02 -ne 2) { throw 'source shape drift' }
  return "package=9|inventory=5|scope=8|mains=$packageMains,$inventoryMains,$scopeMains|compiler=0;outputs=Ex01:9|Ex04:17|Ex05:9|Ex06:3|Ex08:20;shapes=map:1,2|flatMap:2|reduce:3,1|setters:2,3|voFinals:2|fileMain:compileOnly"
}

try {
  if (Test-Path -LiteralPath $root) { throw 'unexpected temp collision' }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $ownsRoot = $true
  $classDir = Join-Path ([IO.Path]::GetFullPath($SourceRoot)) 'src/com/java/class13'
  $baseline = Audit 'baseline' $classDir
  $hostile = Audit 'hostile' $classDir
  if ($baseline -cne $hostile) { throw 'baseline hostile drift' }
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline"
  'privacy=fileMain:not-run|absolutePath:not-published;launcherOptions=4'
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
          { lines: "1-14", explanation: "source root, launcher option4 snapshots와 공백 temp direct-child ownership/error state를 mutation 전에 준비합니다." },
          { lines: "15-63", explanation: "ArgumentList·UTF-8 redirected streams·closed stdin·async drain·timeout10s·tree kill·grace5s·Dispose와 comments/exact-output helpers를 정의합니다." },
          { lines: "64-85", explanation: "baseline/hostile modes에서 package9·inventory5·scope8 warning0 compile과 main roles6/3/5를 확인합니다." },
          { lines: "87-91", explanation: "Stream mains5의 blank·separator·order·leading space를 포함한 exact58 logical lines를 검증합니다." },
          { lines: "93-106", explanation: "comments 제거 뒤 map·flatMap·reduce·DTO setters·VO final fields16 tokens를 source별로 확인합니다." },
          { lines: "109-144", explanation: "두 mode summary와 privacy policy를 출력하고 variable별 restore·temp cleanup을 독립 실행해 failure tree를 보존합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy2/classstudy source root", "baseline+hostile launcher modes", "timeout10s+grace5s"], command: "pwsh -NoProfile -File verify-original-core09.ps1 -SourceRoot <classstudy-root>" },
        output: { value: "spacePath=True,modes=2|same=True,package=9|inventory=5|scope=8|mains=6,3,5|compiler=0;outputs=Ex01:9|Ex04:17|Ex05:9|Ex06:3|Ex08:20;shapes=map:1,2|flatMap:2|reduce:3,1|setters:2,3|voFinals:2|fileMain:compileOnly\nprivacy=fileMain:not-run|absolutePath:not-published;launcherOptions=4", explanation: ["세 compile scopes는 모두 warning0입니다.", "five mains의 stdout·stderr·exit와 active shapes가 두 modes에서 같습니다.", "File main은 compile evidence만 남겨 machine path/data를 공개하지 않습니다."] },
        experiments: [
          { change: "scope에서 Ex07_DTO를 빼고 Ex08을 compile합니다.", prediction: "Ex07_DTO symbol을 찾지 못해 compile 실패합니다.", result: "inventory가 누락한 dependency/topic file을 expanded scope에 포함해야 합니다." },
          { change: "Ex08 마지막 reversed를 제거합니다.", prediction: "마지막 two names가 공실이→희동이로 바뀌어 exact output과 source shape가 실패합니다.", result: "label과 code mismatch를 output으로 탐지합니다." },
          { change: "Ex09 main을 실행해 stdout을 공개 golden에 넣습니다.", prediction: "machine path와 directory contents가 노출되고 host마다 달라집니다.", result: "compile-only audit와 privacy-safe temp fixture를 분리합니다." },
        ],
        sourceRefs: ["java-class13-ex01", "java-class13-ex02", "java-class13-ex03", "java-class13-ex04", "java-class13-ex05", "java-class13-ex06", "java-class13-ex07", "java-class13-ex08", "java-class13-ex09", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "java-stream-api"],
      }],
      diagnostics: [
        { symptom: "inventory5만 compile했는데 Ex04/Ex08 설명을 추가하자 source evidence가 없다.", likelyCause: "계획 inventory를 실제 package/dependency/topic scope와 대조하지 않았습니다.", checks: ["class13 files 전체를 나열합니다.", "public mains와 referenced types를 찾습니다.", "같은 학습 질문의 누락 files를 분류합니다."], fix: "inventory5·expanded scope8·package9를 별도 counts로 감사합니다.", prevention: "각 세션 source audit에 inventory vs actual directory diff를 남깁니다." },
        { symptom: "원본 audit output에 사용자 PC 경로와 파일 목록이 나타난다.", likelyCause: "hard-coded File main을 production-like privacy 검토 없이 실행·게시했습니다.", checks: ["absolute paths와 usernames를 scan합니다.", "host-dependent output을 식별합니다.", "다음 I/O 세션으로 분리 가능한지 봅니다."], fix: "이 세션에서는 compile-only로 두고 temp fixture 기반 privacy-safe I/O 예제로 재작성합니다.", prevention: "public output regex와 source-level path inventory를 build gate에 둡니다." },
      ],
      expertNotes: ["원본의 label 오류나 DTO mutability를 조용히 고치면 provenance가 사라집니다. audit chapter는 사실을 보존하고 개선 chapter가 왜 바꾸는지 별도 evidence로 설명합니다.", "exact output58 lines는 deterministic source에만 적용합니다. File listing, parallel order, implementation class name은 semantic normalization 또는 미실행 경계로 둡니다."],
    },
  ],
  lab: {
    title: "주문 DTO rows를 immutable domain values로 변환·평탄화·집계하는 검증 가능한 pipeline",
    scenario: "여러 주문과 중첩 line DTO를 받아 validation error를 보존하면서 SKU별 수량·금액, 고객별 summary와 flat export rows를 만들고 순차/병렬 결과를 비교합니다.",
    setup: ["OpenJDK21 warning0 isolated runner를 준비합니다.", "mutable input DTO, validated Order/Line records와 Money value를 분리합니다.", "empty·invalid·duplicate SKU·large amount·rounding fixtures를 준비합니다."],
    steps: ["DTO를 읽는 순간 immutable snapshot으로 변환하고 field validation errors를 row context와 수집합니다.", "orders.stream().flatMap(order→lines)에서 order id를 line projection에 보존합니다.", "zero/negative quantity와 unknown SKU의 reject/skip policy를 명시합니다.", "quantity는 mapToLong, money는 BigDecimal로 scale/rounding을 고정합니다.", "SKU별 grouping과 customer summary를 downstream collectors로 만듭니다.", "mutable reduction은 collect로 구현하고 combiner가 partition results를 손실 없이 합치게 합니다.", "순차 loop oracle과 stream result를 empty/single/many/parallel fixtures에서 비교합니다.", "output order가 필요하면 explicit comparator와 tie-breaker를 적용합니다."],
    expectedResult: ["input DTO mutation이 published summaries를 바꾸지 않습니다.", "flat row마다 parent order/customer context가 남습니다.", "invalid rows는 조용히 사라지지 않고 error result에 있습니다.", "sequential/parallel aggregates가 같은 amount/count를 냅니다.", "rounding·overflow·duplicate·order policies가 executable tests로 보존됩니다."],
    cleanup: ["parallel executor/resource를 bounded 종료합니다.", "generated temp fixtures를 ownership boundary 안에서 제거합니다."],
    extensions: ["custom Collector와 teeing으로 summary를 한 pass에 만듭니다.", "대용량 source를 database/windowed processing으로 이동할 기준을 정합니다.", "reactive backpressure와 Stream pull model 차이를 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "문장 목록을 단어로 flatMap하고 normalization·distinct·빈 token 처리를 추가합니다.", requirements: ["split 규칙과 Locale을 명시합니다.", "empty token을 제거합니다.", "encounter-order distinct output을 exact로 검증합니다.", "map 결과 Stream<String[]>와 flatMap 결과 Stream<String> type을 설명합니다."], hints: ["Pattern.splitAsStream도 비교합니다.", "구두점/Unicode 정책을 먼저 정합니다."], expectedOutcome: "cardinality와 element type 변화가 보이는 재현 가능한 word pipeline이 됩니다.", solutionOutline: ["sentence→tokens projection을 만듭니다.", "flatMap/normalize/filter/distinct를 순서대로 적용합니다.", "loop oracle과 비교합니다."] },
    { difficulty: "응용", prompt: "정수와 음수가 섞인 목록의 sum/max/product reduce를 identity laws와 empty input으로 검증합니다.", requirements: ["max에는 임의0 identity를 쓰지 않습니다.", "identity/accumulator/combiner laws를 표로 작성합니다.", "sequential/parallel regrouping을 비교합니다.", "overflow policy를 선택합니다."], hints: ["max는 Optional 또는 domain minimum을 고려합니다.", "subtraction은 associative하지 않습니다."], expectedOutcome: "input domain 전체에서 유효한 identity와 empty policy를 가진 reductions가 됩니다.", solutionOutline: ["empty/single/negative/many fixtures를 만듭니다.", "Optional max와 long/exact sum을 사용합니다.", "partition laws를 property test합니다."] },
    { difficulty: "설계", prompt: "mutable API DTO를 immutable domain value와 response DTO로 변환하는 집계 boundary를 설계합니다.", requirements: ["input setters와 domain invariants를 분리합니다.", "defensive snapshot과 null/error channel을 정의합니다.", "nested lines를 flatMap하되 parent context를 보존합니다.", "BigDecimal rounding과 duplicate SKU policy를 명시합니다.", "parallel collect laws·ordering·observability를 검증합니다."], hints: ["DTO라는 이름만으로 mutable/serializable 규칙이 정해지지 않습니다.", "domain record와 transport mapper를 분리합니다."], expectedOutcome: "전송 형식 변화가 domain aggregate를 오염시키지 않는 production-ready mapping pipeline이 됩니다.", solutionOutline: ["validation result mapper를 만듭니다.", "validated records로 변환합니다.", "collectors와 independent loop oracle을 작성합니다."] },
  ],
  reviewQuestions: [
    { question: "map과 flatMap의 핵심 shape 차이는 무엇인가요?", answer: "map은 element마다 결과 하나, flatMap은 element마다 stream을 만들어0..N 결과를 하나의 stream으로 평탄화합니다." },
    { question: "flatMap mapper가 null을 반환해도 되나요?", answer: "Stream flatMap contract를 확인해야 하며 명확하게 Stream.empty를 반환해 zero-results를 표현하는 편이 안전합니다." },
    { question: "reduce identity는 첫 요소의 기본값인가요?", answer: "아닙니다. 모든 가능한 value와 결합해 value를 바꾸지 않고 combiner와 호환되는 항등원이어야 합니다." },
    { question: "max에 identity0을 쓰면 언제 틀리나요?", answer: "모든 input이 음수이거나 empty일 때0이 data에 없는데도 결과가 될 수 있습니다." },
    { question: "mutable ArrayList를 reduce identity로 써도 되나요?", answer: "parallel partition에서 shared mutable identity와 combiner laws를 깨기 쉬워 collect를 사용합니다." },
    { question: "DTO는 반드시 setter가 있어야 하나요?", answer: "아닙니다. DTO는 transfer 목적을 뜻하며 mutability는 framework/contract 선택입니다." },
    { question: "VO는 단지 setter 없는 DTO인가요?", answer: "아닙니다. domain value semantics·invariants·equality가 핵심이고 transfer shape와 책임이 다릅니다." },
    { question: "record면 모든 VO가 자동으로 완성되나요?", answer: "아닙니다. shallow components, validation, normalization과 domain operations를 설계해야 합니다." },
    { question: "parallel reduce가 순차와 같으려면 무엇이 필요한가요?", answer: "associative accumulator/combiner, valid identity, compatibility와 non-interference가 필요합니다." },
    { question: "원본 Ex08의 오름차순 label이 결과와 다른 이유는 무엇인가요?", answer: "마지막 stream code가 comparator.reversed를 사용해 name descending으로 출력하기 때문입니다." },
  ],
  completionChecklist: [
    "class13 package9·inventory5·scope8을 별도 warning0 compile했다.",
    "package/inventory/scope public mains6/3/5 roles를 확인했다.",
    "Ex01·Ex04·Ex05·Ex06·Ex08 exact outputs58 lines를 검증했다.",
    "comments 제거 active map·flatMap·reduce·setter·final shapes16을 확인했다.",
    "Ex09 File main의 local path/output을 공개하지 않았다.",
    "launcher option4 격리와 variable별 restore verification을 적용했다.",
    "async drain·closed stdin·timeout·tree kill·grace·Dispose를 적용했다.",
    "temp root ownership·parent boundary·failure aggregation을 검증했다.",
    "map one-to-one과 flatMap zero-to-many cardinality를 구분한다.",
    "reduce identity를 input domain 전체에서 검증한다.",
    "DTO transfer와 VO value semantics를 이름만으로 단정하지 않는다.",
    "모든 positive Java examples를 JDK21 -Xlint:all warning0와 exact output으로 검증한다.",
  ],
  nextSessions: ["io-01-file-bytes"],
  sources: [
    { id: "java-class13-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex01_StreamClass.java", usedFor: ["map uppercase", "forEach contrast", "exact9"], evidence: "source map1과 blank 포함 exact9 lines를 확인했습니다." },
    { id: "java-class13-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex02_VO.java", usedFor: ["final fields", "getter-only value carrier", "VO commentary"], evidence: "final fields2·setters0과 compile-only model role을 확인했습니다." },
    { id: "java-class13-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex03_DTO.java", usedFor: ["mutable DTO", "Ex04 dependency", "setters2"], evidence: "constructors/getters/setters2와 Ex04 list projection dependency입니다." },
    { id: "java-class13-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex04_StreamClass.java", usedFor: ["iterator vs stream", "DTO projection", "filter map"], evidence: "inventory 누락 원본을 scope에 추가하고 exact17 lines·map2를 확인했습니다." },
    { id: "java-class13-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex05_StreamClass.java", usedFor: ["flatMap packs", "sentence tokens", "distinct"], evidence: "flatMap2와 exact list/array/word outputs9 lines입니다." },
    { id: "java-class13-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex06_StreamClass.java", usedFor: ["sum max string reduce", "identity caveat"], evidence: "reduce3과 leading-space string 포함 exact3 lines입니다." },
    { id: "java-class13-ex07", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex07_DTO.java", usedFor: ["mutable customer DTO", "Ex08 dependency", "setters3"], evidence: "inventory 누락 dependency로 scope에 포함하고 setters3을 확인했습니다." },
    { id: "java-class13-ex08", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex08_StreamClass.java", usedFor: ["collection vs stream", "sum/filter/sorted/reversed", "source mutation"], evidence: "inventory 누락 종합 예제로 exact20 lines와 map1/reduce1/filter1/sorted1을 확인했습니다." },
    { id: "java-class13-ex09", repository: "javastudy2 classstudy", path: "src/com/java/class13/Ex09_FileClass.java", usedFor: ["package compile", "I/O boundary handoff", "privacy exclusion"], evidence: "package warning0와 main role만 확인하고 machine-dependent output은 실행·게시하지 않았습니다." },
    { id: "jdk21-javac", repository: "Java SE 21 tools", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-proc:none", "-Xlint:all", "-XDrawDiagnostics"], evidence: "positive compiler output0 contract입니다." },
    { id: "powershell-environment", repository: "Microsoft PowerShell docs", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "per-variable restore"], evidence: "process environment mutation/restore 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected streams", "working directory"], evidence: "fresh child construction 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["launcher isolation"], evidence: "child-specific option removal 근거입니다." },
    { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "grace", "Dispose"], evidence: "bounded process lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["stdout/stderr drain"], evidence: "redirected pipe concurrent drain 근거입니다." },
    { id: "java-stream-api", repository: "Java SE 21 API", path: "java.util.stream.Stream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html", usedFor: ["map", "flatMap", "mapMulti", "reduce", "collect"], evidence: "Stream shape/reduction API의 primary source입니다." },
  ],
  sourceCoverage: {
    filesRead: 9,
    filesUsed: 9,
    uncoveredNotes: [
      "inventory5를 실제 class13 package9와 비교해 Stream/DTO scope8로 확장했습니다.",
      "five Stream mains exact58 lines와 active source shapes16을 두 launcher modes에서 검증했습니다.",
      "Ex09는 package compile/IO handoff에만 사용하고 local absolute path·directory listing은 공개하지 않았습니다.",
      "원본 Ex08의 source mutation과 reversed/label mismatch를 교정 없이 먼저 evidence로 보존했습니다.",
      "공식 Java SE21 sources로 projection·flattening·reduction·DTO value boundary를 확장할 예정입니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const shapeAndValueChapters: DetailedSession["chapters"] = [
  {
    id: "map-one-to-one-projection-cardinality",
    title: "map은 source element마다 결과 하나를 만드는 one-to-one projection이며 mutation·filter·effect와 역할이 다릅니다",
    lead: "DTO에서 name을 뽑거나 String을 length로 바꿀 때 element type은 달라져도 정상 mapper라면 encounter order와 cardinality는 그대로 유지됩니다.",
    explanations: [
      "`Stream<T>.map(Function<? super T,? extends R>)`은 각 source element를 R 하나로 바꿉니다. Person→String name, String→Integer length처럼 element type과 generic stream type이 바뀝니다.",
      "map은 selection이 아닙니다. 특정 elements를 제외하려면 filter, 하나를 여러 개/0개로 바꾸려면 flatMap/mapMulti를 사용합니다. mapper가 null을 반환해도 null element 하나가 생길 뿐 cardinality가 줄었다고 설명하지 않습니다.",
      "ordered source와 sequential pipeline에서는 map 결과도 encounter order를 유지합니다. unordered/parallel execution에서 function 호출 timing과 thread는 달라질 수 있어 mapper에 order-dependent side effect를 넣지 않습니다.",
      "mapper는 source object를 수정하지 않고 새 immutable projection을 만드는 편이 non-interference와 재사용에 유리합니다. `dto -> { dto.set...; return dto; }`는 map이라는 이름 아래 source mutation을 숨깁니다.",
      "filter를 map 전에 두면 제거될 elements의 expensive projection을 피할 수 있습니다. 그러나 predicate가 projected field에 의존하면 먼저 필요한 projection을 하거나 named intermediate record로 field를 보존합니다.",
      "method reference `Person::name`은 lambda `person -> person.name()`과 같은 target descriptor일 때 간결한 projection입니다. overload/checked error가 있으면 명시 lambda가 context와 error policy를 더 잘 드러낼 수 있습니다.",
      "map 뒤 primitive sum이 필요하면 `mapToInt`/mapToLong을 고려합니다. `map(Person::age)`는 Stream<Integer> boxing을 만들고 sum terminal이 없지만 mapToInt는 IntStream과 numeric terminals를 제공합니다.",
      "원본 Ex01은 source strings를 새 stream에서 uppercase하고 Ex04는 DTO→name을 projection합니다. stream single-use 때문에 같은 logical source를 두 terminal에 쓰려면 collection에서 새 pipeline을 만듭니다.",
    ],
    concepts: [
      { term: "projection", definition: "source object에서 필요한 field/derived value를 새 element로 만드는 변환입니다.", detail: ["type이 바뀔 수 있습니다.", "source mutation과 다릅니다."] },
      { term: "cardinality preservation", definition: "source element 하나당 result element 하나가 생겨 count가 유지되는 성질입니다.", detail: ["map의 정상 shape입니다.", "filter/flatMap은 다를 수 있습니다."] },
      { term: "non-interference", definition: "pipeline 실행 중 source data를 방해하는 방식으로 수정하지 않는 요구입니다.", detail: ["side-effect mapper를 피합니다.", "immutable result를 선호합니다."] },
    ],
    codeExamples: [{
      id: "java-stream-map-projection",
      title: "Person list를 names·adult names·primitive lengths로 투영합니다",
      language: "java",
      filename: "StreamMapProjection.java",
      purpose: "map cardinality/order와 filter-before-map, mapToInt specialized projection을 결정적 lists로 확인합니다.",
      code: String.raw`import java.util.List;

public class StreamMapProjection {
    record Person(String name, int age) { }

    public static void main(String[] args) {
        List<Person> people = List.of(
                new Person("Ada", 37), new Person("Bob", 17), new Person("Cleo", 42));

        List<String> names = people.stream().map(Person::name).toList();
        List<String> adultNames = people.stream()
                .filter(person -> person.age() >= 18)
                .map(Person::name)
                .toList();
        List<Integer> lengths = people.stream()
                .mapToInt(person -> person.name().length())
                .boxed()
                .toList();

        System.out.println("counts=" + people.size() + "," + names.size() + "," + adultNames.size());
        System.out.println("names=" + names);
        System.out.println("adults=" + adultNames);
        System.out.println("lengths=" + lengths);
        System.out.println("sourceAges=" + people.stream().mapToInt(Person::age).boxed().toList());
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "immutable Person record와 insertion-ordered list3을 source로 준비합니다." },
        { lines: "10-10", explanation: "Person::name map은 count3과 encounter order를 유지하며 Stream<String>을 만듭니다." },
        { lines: "11-14", explanation: "성인 predicate가 Bob을 제거한 뒤 name projection해 count2가 됩니다." },
        { lines: "15-18", explanation: "mapToInt로 primitive lengths를 만든 뒤 출력용 boxed list로만 변환합니다." },
        { lines: "20-24", explanation: "source/map/filter counts, projections와 원본 ages가 변하지 않았음을 각각 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("StreamMapProjection.java", "StreamMapProjection") },
      output: { value: "counts=3,3,2\nnames=[Ada, Bob, Cleo]\nadults=[Ada, Cleo]\nlengths=[3, 3, 4]\nsourceAges=[37, 17, 42]", explanation: ["map names는 source3과 같은 count/order입니다.", "filter만 cardinality를2로 줄입니다.", "primitive projection도 source values를 수정하지 않습니다."] },
      experiments: [
        { change: "map mapper가 Bob에 null을 반환합니다.", prediction: "names count는3이며 중간 element가 null이 됩니다.", result: "null return은 filter가 아니고 downstream null failure 위험을 만듭니다." },
        { change: "map과 filter 순서를 바꾸되 uppercase name으로 filter합니다.", prediction: "predicate 기준을 맞추면 result는 같지만 모든 elements projection 비용을 지불합니다.", result: "semantic dependency와 비용을 함께 봅니다." },
        { change: "mapper 안에서 person source list를 수정합니다.", prediction: "non-interference 위반으로 exception 또는 잘못된 traversal이 생길 수 있습니다.", result: "pipeline은 source를 읽고 새 result를 만듭니다." },
      ],
      sourceRefs: ["java-class13-ex01", "java-class13-ex04", "java-stream-api", "java-stream-package-summary", "java-intstream-api", "java-list-api", "jls-records"],
    }],
    diagnostics: [
      { symptom: "map 후 element 수가 줄었다고 생각했는데 nulls가 남는다.", likelyCause: "mapper null을 filter처럼 사용했습니다.", checks: ["result count와 null positions를 봅니다.", "0..N shape가 필요한지 묻습니다.", "filter/flatMap(Optional::stream)을 검토합니다."], fix: "선택은 filter, optional expansion은 flatMap, invalid는 명시 error channel을 사용합니다.", prevention: "mapper non-null contract와 empty/invalid fixtures를 둡니다." },
      { symptom: "stream projection 뒤 원본 DTO fields가 바뀌었다.", likelyCause: "mapper가 source object setter를 호출했습니다.", checks: ["mapper body mutation을 찾습니다.", "alias를 추적합니다.", "before/after source snapshot을 비교합니다."], fix: "immutable projection record를 반환하고 mutation은 owner service boundary로 이동합니다.", prevention: "pure mapper test와 source unchanged assertion을 포함합니다." },
    ],
    expertNotes: ["map fusion과 allocation 제거는 JIT implementation 영역입니다. semantic stages를 먼저 명확히 하고 allocation/profile을 JMH로 측정합니다.", "projection type은 보안 boundary가 될 수 있습니다. entity 전체를 response DTO로 넘기지 말고 allowlisted fields만 새 value로 만듭니다."],
  },
  {
    id: "flatmap-mapmulti-parent-context",
    title: "flatMap은 element별 하위 stream을 연결하고 mapMulti는 push-style zero-to-many emission으로 같은 shape를 표현합니다",
    lead: "orders→lines처럼 중첩 collection을 펼칠 때 parent id를 잃지 않는 flat record를 만들고 empty children은 결과0개로 처리합니다.",
    explanations: [
      "`flatMap` mapper는 T 하나를 `Stream<? extends R>`로 바꾸고 모든 하위 streams를 encounter order대로 이어 하나의 Stream<R>을 만듭니다. child count가0이면 parent는 result에 직접 나타나지 않습니다.",
      "`map(List::stream)`은 Stream<Stream<Line>> 또는 Stream<List<Line>> shape를 남겨 terminal이 nested container를 받습니다. `flatMap(order -> order.lines().stream())`이 Line stream을 만듭니다.",
      "child만 반환하면 parent order id/customer context가 사라집니다. flatten mapper에서 `new Flat(order.id(), line.sku(), line.quantity())`처럼 필요한 parent fields를 함께 projection합니다.",
      "mapper가 만든 substream은 flatMap이 사용 후 닫습니다. Files.lines처럼 resource-backed child stream을 parent마다 열면 exception/close/too-many-open-files policy가 복잡하므로 I/O boundary에서 먼저 읽거나 명시 ownership을 설계합니다.",
      "mapMulti는 결과가 적고 작은 imperative loop로 여러 elements를 emit할 때 intermediate Stream objects를 피할 여지가 있습니다. downstream Consumer에0..N values를 넘기며 generic target type을 명시해야 inference가 명확할 때가 있습니다.",
      "Optional<T>.stream을 flatMap하면 present는1, empty는0이 되어 optional values를 펼칠 수 있습니다. parse failure를 모두 empty로 버리면 diagnostics가 사라지므로 invalid와 absent를 구분합니다.",
      "distinct나 sorted를 flatten 전/후 어디에 두는지에 따라 scope가 달라집니다. 각 order 안 duplicate 제거와 전체 orders duplicate 제거는 다른 domain rule입니다.",
      "무한 parent/child streams 또는 매우 큰 nested data는 flatMap이 materialize하지 않아도 terminal이 계속 pull할 수 있습니다. limit 위치와 bounded source/error backpressure가 필요합니다.",
    ],
    concepts: [
      { term: "flattening", definition: "중첩된 streams/collections의 child elements를 하나의 result stream으로 이어 붙이는 변환입니다.", detail: ["cardinality가0..N입니다.", "encounter order scope를 정합니다."] },
      { term: "parent context projection", definition: "child를 펼칠 때 parent id 등 필요한 상위 정보를 새 flat element에 함께 복사하는 설계입니다.", detail: ["추적성을 보존합니다.", "join key를 잃지 않습니다."] },
      { term: "mapMulti", definition: "mapper가 downstream consumer에 결과를 직접0..N회 전달하는 Stream intermediate operation입니다.", detail: ["push-style emission입니다.", "flatMap 대안이 될 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-flatmap-parent-context",
      title: "orders의 nested lines를 parent id가 있는 flat rows로 펼치고 mapMulti 결과와 비교합니다",
      language: "java",
      filename: "FlatMapParentContext.java",
      purpose: "empty child parent, order-preserving flattening, parent context와 two APIs equivalence를 exact로 확인합니다.",
      code: String.raw`import java.util.List;

public class FlatMapParentContext {
    record Line(String sku, int quantity) { }
    record Order(String id, List<Line> lines) { }
    record Flat(String orderId, String sku, int quantity) {
        @Override public String toString() { return orderId + ":" + sku + "*" + quantity; }
    }

    public static void main(String[] args) {
        List<Order> orders = List.of(
                new Order("O1", List.of(new Line("A", 2), new Line("B", 1))),
                new Order("O2", List.of()),
                new Order("O3", List.of(new Line("C", 3))));

        List<Flat> viaFlatMap = orders.stream()
                .flatMap(order -> order.lines().stream()
                        .map(line -> new Flat(order.id(), line.sku(), line.quantity())))
                .toList();
        List<Flat> viaMapMulti = orders.stream()
                .<Flat>mapMulti((order, downstream) -> {
                    for (Line line : order.lines()) {
                        downstream.accept(new Flat(order.id(), line.sku(), line.quantity()));
                    }
                })
                .toList();

        int quantity = viaFlatMap.stream().mapToInt(Flat::quantity).sum();
        System.out.println("orders=" + orders.size() + ",flat=" + viaFlatMap.size());
        System.out.println("rows=" + viaFlatMap);
        System.out.println("same=" + viaFlatMap.equals(viaMapMulti));
        System.out.println("quantity=" + quantity);
        System.out.println("emptyParentRows=" + viaFlatMap.stream().filter(row -> row.orderId().equals("O2")).count());
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "Line·Order·Flat records를 분리하고 Flat string에도 parent order id를 보존합니다." },
        { lines: "10-14", explanation: "O1 lines2, O2 empty, O3 line1의 nested source를 만듭니다." },
        { lines: "16-19", explanation: "flatMap 안의 child map이 parent id와 line fields를 새 Flat에 결합합니다." },
        { lines: "20-27", explanation: "mapMulti는 같은 children을 downstream에 직접 emit하며 explicit Flat target을 줍니다." },
        { lines: "29-34", explanation: "orders3→rows3, exact rows/order, API equality, quantity6과 O2 rows0을 검증합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("FlatMapParentContext.java", "FlatMapParentContext") },
      output: { value: "orders=3,flat=3\nrows=[O1:A*2, O1:B*1, O3:C*3]\nsame=true\nquantity=6\nemptyParentRows=0", explanation: ["empty O2는 flat rows0개를 만듭니다.", "parent/child encounter order가 rows에 보존됩니다.", "flatMap과 mapMulti results가 value-equal합니다."] },
      experiments: [
        { change: "inner map에서 order id를 제거하고 Line만 반환합니다.", prediction: "rows는 남지만 어느 order에서 왔는지 역추적할 수 없습니다.", result: "downstream join/audit에 필요한 parent context를 projection합니다." },
        { change: "distinct를 child stream 안과 flatten 뒤에 각각 둡니다.", prediction: "전자는 order별 duplicate만, 후자는 전체 Flat equality duplicate를 제거합니다.", result: "dedup scope는 operation 위치로 결정됩니다." },
        { change: "O2를 null lines로 만듭니다.", prediction: "flatMap mapper에서 NullPointerException이 납니다.", result: "empty collection과 null collection을 구분하고 constructor에서 null을 거부/normalize합니다." },
      ],
      sourceRefs: ["java-class13-ex05", "java-stream-api", "java-stream-package-summary", "java-list-api", "jls-records", "java-intstream-api"],
    }],
    diagnostics: [
      { symptom: "flatMap 후 child는 있지만 어느 parent인지 알 수 없다.", likelyCause: "child object만 반환해 parent join key를 버렸습니다.", checks: ["downstream grouping/audit 요구를 봅니다.", "parent context fields를 inventory합니다.", "flat projection type을 확인합니다."], fix: "parent+child fields를 가진 immutable Flat record를 mapper에서 만듭니다.", prevention: "flatten schema review에 provenance/join keys를 포함합니다." },
      { symptom: "flatMap pipeline에서 파일 handle이 많이 열린다.", likelyCause: "각 parent마다 resource-backed stream을 열고 close/terminal lifecycle을 명확히 하지 않았습니다.", checks: ["mapper가 Files.lines 등 close-required stream을 반환하는지 봅니다.", "onClose와 failure path를 추적합니다.", "open file count를 측정합니다."], fix: "I/O ownership을 outer try-with-resources/batched reader로 이동하거나 resource lifecycle을 명시합니다.", prevention: "resource-backed substream stress와 failure cleanup test를 둡니다." },
    ],
    expertNotes: ["mapMulti가 항상 flatMap보다 빠르다는 보장은 없습니다. allocation/branch/cardinality를 JMH로 측정하고 readability와 mapper complexity도 평가합니다.", "flattening은 relational join과 비슷한 cardinality explosion을 만들 수 있습니다. parent×child upper bound, pagination과 output quota를 둡니다."],
  },
  {
    id: "dto-vo-record-immutable-snapshot",
    title: "DTO는 전송 경계, VO는 값 의미이며 record는 immutable snapshot을 돕지만 이름만으로 계약이 완성되지 않습니다",
    lead: "setter가 있는 input DTO를 stream에 오래 흘리지 않고 validation 직후 immutable domain value로 바꿔 alias·동시 변경·계층 누수를 막습니다.",
    explanations: [
      "DTO(Data Transfer Object)는 계층·process·wire 사이 data 전달 목적을 나타냅니다. framework binding 때문에 no-arg constructor/setter가 있을 수 있지만 immutable constructor DTO도 가능하며 DTO라는 이름 자체가 setter를 요구하지 않습니다.",
      "VO(Value Object)는 identity보다 값과 domain invariants로 의미가 결정됩니다. equality/hashCode, normalization, valid operations와 immutability가 중요하며 단순 getter-only bag보다 풍부할 수 있습니다.",
      "record는 final components, accessor, equals/hashCode/toString을 만들어 value carrier에 유용합니다. compact constructor에서 normalize/validate할 수 있지만 component가 mutable List/array면 reference만 final이라 defensive copy가 필요합니다.",
      "input DTO를 validate하지 않고 mapper에서 getters를 반복하면 다른 thread/caller setter가 pipeline 중 값을 바꿀 수 있습니다. boundary에서 local snapshot을 만들고 invalid fields를 structured errors로 반환합니다.",
      "entity는 persistence identity와 lifecycle을 가지며 response DTO/VO와 목적이 다릅니다. entity를 그대로 JSON/stream projection에 노출하면 lazy loading, sensitive fields와 accidental writes가 생길 수 있습니다.",
      "mapping layer는 field rename·default·version·redaction과 error translation을 소유합니다. reflection auto-mapper는 빠른 시작이지만 security allowlist와 semantic conversions를 code/test로 보강합니다.",
      "List.copyOf는 collection structure와 null policy를 snapshot하지만 elements가 mutable면 deep immutability를 주지 않습니다. nested DTO를 nested value records로 재귀 변환합니다.",
      "published value를 다시 response DTO로 projection할 때 domain methods/invariants를 우회하지 않습니다. money/time/id를 String으로 평탄화하는 format과 timezone/rounding을 API version에 명시합니다.",
    ],
    concepts: [
      { term: "DTO", definition: "특정 계층·process·wire boundary에서 data를 전달하기 위한 shape입니다.", detail: ["mutability는 별도 선택입니다.", "version/redaction을 고려합니다."] },
      { term: "value object", definition: "고유 identity보다 값·invariants·동등성으로 정의되는 domain object입니다.", detail: ["immutable을 선호합니다.", "domain operations를 가질 수 있습니다."] },
      { term: "defensive snapshot", definition: "외부 mutable input의 현재 유효 상태를 새 immutable representation으로 복사해 이후 alias mutation을 차단하는 경계입니다.", detail: ["nested objects도 고려합니다.", "safe publication을 돕습니다."] },
    ],
    codeExamples: [{
      id: "java-dto-value-snapshot",
      title: "mutable input DTO와 tag alias를 immutable CustomerValue로 끊습니다",
      language: "java",
      filename: "DtoValueSnapshot.java",
      purpose: "record compact constructor와 List.copyOf가 DTO setter/collection mutation 이후에도 published value를 보존하는지 검증합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class DtoValueSnapshot {
    static final class InputDto {
        private String name;
        private List<String> tags;
        InputDto(String name, List<String> tags) { this.name = name; this.tags = tags; }
        String getName() { return name; }
        List<String> getTags() { return tags; }
        void setName(String name) { this.name = name; }
        void setTags(List<String> tags) { this.tags = tags; }
    }

    record CustomerValue(String name, List<String> tags) {
        CustomerValue {
            name = Objects.requireNonNull(name).trim();
            if (name.isEmpty()) { throw new IllegalArgumentException("empty name"); }
            tags = List.copyOf(tags);
        }
    }

    record Response(String displayName, int tagCount) { }

    static CustomerValue snapshot(InputDto dto) {
        return new CustomerValue(dto.getName(), dto.getTags());
    }

    public static void main(String[] args) {
        List<String> mutableTags = new ArrayList<>(List.of("java"));
        InputDto dto = new InputDto(" Ada ", mutableTags);
        CustomerValue value = snapshot(dto);
        dto.setName("Bob");
        mutableTags.add("sql");
        dto.setTags(List.of("changed"));
        Response response = new Response(value.name(), value.tags().size());

        System.out.println("dto=" + dto.getName() + "," + dto.getTags());
        System.out.println("value=" + value.name() + "," + value.tags());
        System.out.println("response=" + response);
        try { value.tags().add("fail"); }
        catch (UnsupportedOperationException exception) { System.out.println("valueWrite=" + exception.getClass().getSimpleName()); }
    }
}`,
      walkthrough: [
        { lines: "1-14", explanation: "원본 DTO style처럼 mutable fields/getters/setters를 가진 transport input을 정의합니다." },
        { lines: "16-22", explanation: "CustomerValue compact constructor가 name을 normalize/validate하고 tags structure를 snapshot합니다." },
        { lines: "24-28", explanation: "response projection과 한 곳의 DTO→value mapper를 분리합니다." },
        { lines: "30-38", explanation: "snapshot 뒤 DTO name/tags reference와 원래 mutableTags를 모두 변경합니다." },
        { lines: "40-44", explanation: "DTO current state와 보존된 value/response를 비교하고 value tags mutation 차단을 검증합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("DtoValueSnapshot.java", "DtoValueSnapshot") },
      output: { value: "dto=Bob,[changed]\nvalue=Ada,[java]\nresponse=Response[displayName=Ada, tagCount=1]\nvalueWrite=UnsupportedOperationException", explanation: ["DTO는 snapshot 뒤 자유롭게 바뀝니다.", "CustomerValue는 trimmed name과 original tag 하나를 유지합니다.", "response는 immutable value에서 projection됩니다."] },
      experiments: [
        { change: "CustomerValue가 tags reference를 그대로 저장합니다.", prediction: "mutableTags.add(sql) 뒤 value.tags에도 sql이 나타납니다.", result: "final reference만으로 collection contents가 immutable하지 않습니다." },
        { change: "tags에 mutable TagDto objects를 넣고 List.copyOf만 합니다.", prediction: "list 구조는 고정돼도 TagDto setter 변경이 value에서 보입니다.", result: "nested values도 immutable projection해야 합니다." },
        { change: "DTO 전체를 response로 직렬화합니다.", prediction: "원하지 않는 mutable/internal fields가 API에 노출될 수 있습니다.", result: "explicit response projection과 allowlist를 유지합니다." },
      ],
      sourceRefs: ["java-class13-ex02", "java-class13-ex03", "java-class13-ex04", "java-class13-ex07", "java-class13-ex08", "jls-records", "java-list-api", "java-objects-api", "java-uoe-api"],
    }],
    diagnostics: [
      { symptom: "집계 중 DTO 값이 간헐적으로 바뀌거나 테스트가 flaky하다.", likelyCause: "mutable DTO/collection alias가 pipeline 실행 중 다른 owner에 의해 수정됩니다.", checks: ["setter call과 thread ownership을 추적합니다.", "mapper가 defensive snapshot을 만드는지 봅니다.", "nested mutable elements를 확인합니다."], fix: "validation boundary에서 immutable value graph로 재귀 변환합니다.", prevention: "snapshot 이후 input mutation test와 immutable component review를 둡니다." },
      { symptom: "response에 password/internal field가 새로 노출됐다.", likelyCause: "entity/DTO auto-serialization이 field 추가를 자동 포함했습니다.", checks: ["serialization annotations와 generated schema를 봅니다.", "explicit response mapper가 있는지 확인합니다.", "sensitive field allowlist를 검토합니다."], fix: "versioned response DTO와 explicit allowlisted projection을 사용합니다.", prevention: "contract/schema snapshot과 sensitive-field negative tests를 CI에 둡니다." },
    ],
    expertNotes: ["DTO/VO 명칭은 팀마다 다르게 쓰일 수 있으므로 이름 논쟁보다 mutability, equality, validation, ownership, serialization contract를 type/Javadoc/tests로 고정합니다.", "records는 framework binding/persistence proxy와 맞지 않을 수 있습니다. domain value와 external adapter type을 분리해 기술 제약이 core model을 지배하지 않게 합니다."],
  },
  {
    id: "reduce-identity-associativity-empty",
    title: "reduce는 identity·accumulator·combiner laws가 input domain 전체에서 성립할 때만 regrouping 가능한 하나의 값을 만듭니다",
    lead: "합계0처럼 익숙한 시작값을 max·문자열·DTO에 그대로 넣지 않고 empty·negative·partition cases에서 항등원과 결합법칙을 증명합니다.",
    explanations: [
      "identity는 accumulator에서 첫 값 앞에 붙는 임의 default가 아니라 모든 x에 대해 op(identity,x)=x이고 combiner에서도 중립인 항등원입니다. sum에는0, product에는1이 대표적입니다.",
      "identity 없는 `reduce(BinaryOperator)`는 empty stream에서 결과가 없어 Optional<T>를 반환합니다. max/min처럼 domain 전체 항등원을 정하기 어렵다면 Optional과 domain empty policy가 정확합니다.",
      "원본 max reduce identity0은 values1..5에서는5지만 all-negative input에서는 존재하지 않는0을 반환합니다. Integer.MIN_VALUE도 모든 domain에서 가능하므로 empty와 actual minimum을 구분하려면 Optional이 낫습니다.",
      "associativity는 `(a op b) op c`와 `a op (b op c)`가 같은 의미 result를 내는 성질입니다. subtraction, average를 단순 pair average, StringBuilder 공유 mutation은 regrouping에 안전하지 않습니다.",
      "ordered sequential reduce는 left fold처럼 관찰될 수 있어 비결합 연산도 어떤 값은 내지만 parallel partition/combiner에서 다른 결과가 가능합니다. sequential에서 우연히 맞는 것을 reduction law로 착각하지 않습니다.",
      "floating-point addition은 mathematical associativity와 달리 rounding 때문에 grouping에 따라 bits가 달라질 수 있습니다. strict reproducibility에는 stable order, compensated summation 또는 decimal policy를 고려합니다.",
      "String reduce empty identity로 leading delimiter를 만들면 원본처럼 결과 앞에 공백이 생깁니다. joining collector 또는 first-element-aware reduction으로 delimiter formatting과 empty 결과를 명시합니다.",
      "reduce accumulator는 stateless/non-interfering이어야 합니다. 외부 mutable total이나 shared container를 변경하지 않고 inputs에서 새 result value를 반환합니다.",
    ],
    concepts: [
      { term: "identity", definition: "reduction operation과 결합해 상대 value를 바꾸지 않는 중립 element입니다.", detail: ["sum0·product1이 예입니다.", "input domain과 combiner에 유효해야 합니다."] },
      { term: "associativity", definition: "grouping을 바꿔도 같은 의미 결과를 내는 binary operation 성질입니다.", detail: ["parallel partition에 필요합니다.", "순서 교환 commutativity와 다릅니다."] },
      { term: "identity-less reduction", definition: "초기 항등원 없이 elements만 결합해 empty 결과 부재를 Optional로 표현하는 reduce overload입니다.", detail: ["max/min에 적합합니다.", "empty policy를 caller가 정합니다."] },
    ],
    codeExamples: [{
      id: "java-reduce-laws",
      title: "sum/product의 올바른 identity와 negative max의 잘못된0, subtraction 비결합성을 비교합니다",
      language: "java",
      filename: "ReduceLaws.java",
      purpose: "원본 positive max를 input domain 전체로 넓혀 identity와 empty Optional, associativity를 deterministic values로 검증합니다.",
      code: String.raw`import java.util.List;
import java.util.Optional;

public class ReduceLaws {
    public static void main(String[] args) {
        List<Integer> values = List.of(1, 2, 3, 4, 5);
        int sum = values.stream().reduce(0, Integer::sum);
        int product = values.stream().reduce(1, (left, right) -> left * right);

        List<Integer> negatives = List.of(-8, -3, -10);
        int wrongMax = negatives.stream().reduce(0, Integer::max);
        Optional<Integer> correctMax = negatives.stream().reduce(Integer::max);
        Optional<Integer> emptyMax = List.<Integer>of().stream().reduce(Integer::max);

        int leftGrouped = (10 - 5) - 2;
        int rightGrouped = 10 - (5 - 2);
        String joined = List.of("Java", "Spring", "React").stream()
                .reduce((left, right) -> left + " / " + right)
                .orElse("<empty>");

        System.out.println("sum=" + sum + ",product=" + product);
        System.out.println("maxWrong=" + wrongMax + ",max=" + correctMax.orElseThrow());
        System.out.println("emptyMax=" + emptyMax.isEmpty() + ",emptySum=" + List.<Integer>of().stream().reduce(0, Integer::sum));
        System.out.println("subtraction=" + leftGrouped + "," + rightGrouped + ",associative=" + (leftGrouped == rightGrouped));
        System.out.println("joined=" + joined);
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "positive values에 sum identity0과 product identity1을 적용해15/120을 만듭니다." },
        { lines: "10-13", explanation: "negative list에 잘못된 max identity0과 Optional max, empty Optional을 나란히 계산합니다." },
        { lines: "15-19", explanation: "subtraction grouping3/7 차이와 delimiter가 leading separator를 만들지 않는 identity-less String reduce를 준비합니다." },
        { lines: "21-25", explanation: "올바른/잘못된 identity, empty policy, associativity false와 formatted result를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("ReduceLaws.java", "ReduceLaws") },
      output: { value: "sum=15,product=120\nmaxWrong=0,max=-3\nemptyMax=true,emptySum=0\nsubtraction=3,7,associative=false\njoined=Java / Spring / React", explanation: ["0은 negative input max에 유효한 identity가 아닙니다.", "Optional은 empty와 actual -3을 분리합니다.", "subtraction은 regrouping에 따라3/7로 달라집니다."] },
      experiments: [
        { change: "parallel stream에서 subtraction reduce를 반복합니다.", prediction: "partition grouping에 따라 sequential left-fold와 다른 값이 나올 수 있습니다.", result: "non-associative operation을 parallel reduction에 쓰지 않습니다." },
        { change: "product identity를0으로 바꿉니다.", prediction: "nonempty input도 항상0이 됩니다.", result: "identity가 중립이 아니면 모든 결과를 오염시킵니다." },
        { change: "String reduce를 empty identity와 `a+','+b`로 바꿉니다.", prediction: "result 앞 delimiter가 생깁니다.", result: "Collectors.joining이 delimiter/prefix/suffix/empty policy를 더 정확히 표현합니다." },
      ],
      sourceRefs: ["java-class13-ex06", "java-stream-api", "java-optional-api", "java-list-api", "java-stream-package-summary"],
    }],
    diagnostics: [
      { symptom: "모든 값이 음수인데 max가0이다.", likelyCause: "reduce identity0이 max의 항등원이 아니어서 result 후보로 들어갔습니다.", checks: ["input domain minimum/empty를 확인합니다.", "identity law를 arbitrary x로 검증합니다.", "Optional overload를 봅니다."], fix: "identity-less reduce/max terminal과 explicit empty policy를 사용합니다.", prevention: "negative-only·empty·minimum boundary fixtures를 둡니다." },
      { symptom: "parallel reduce가 순차 결과와 다르다.", likelyCause: "operation이 associative하지 않거나 accumulator/combiner가 호환되지 않습니다.", checks: ["three-value regrouping을 계산합니다.", "shared mutation을 찾습니다.", "identity law를 partition별로 확인합니다."], fix: "associative immutable aggregate/collector로 재설계하거나 ordered sequential execution을 유지합니다.", prevention: "random partitions와 sequential/parallel equivalence property tests를 둡니다." },
    ],
    expertNotes: ["commutative가 아니어도 ordered associative operation은 가능하지만 unordered parallel result order 요구를 별도 확인합니다. associativity와 commutativity를 혼동하지 않습니다.", "numeric reduction은 type range와 reproducibility policy까지 계약입니다. 정확한 금액은 BigDecimal scale/rounding을 명시하고 binary floating result와 분리합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...shapeAndValueChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-stream-package-summary", repository: "Java SE 21 API", path: "java.util.stream package", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html", usedFor: ["non-interference", "statelessness", "parallel reduction"], evidence: "stream semantic requirements의 package-level source입니다." },
  { id: "java-intstream-api", repository: "Java SE 21 API", path: "java.util.stream.IntStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/IntStream.html", usedFor: ["primitive projection", "sum", "mapToInt"], evidence: "primitive specialized projection/aggregation 근거입니다." },
  { id: "java-list-api", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered source", "copyOf snapshot", "nested children"], evidence: "ordered immutable/mutable list contracts입니다." },
  { id: "jls-records", repository: "JLS SE 21", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["projection records", "value carriers", "compact constructor"], evidence: "record declaration/value semantics의 language source입니다." },
  { id: "java-objects-api", repository: "Java SE 21 API", path: "java.util.Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["requireNonNull", "value validation"], evidence: "snapshot boundary null validation 근거입니다." },
  { id: "java-uoe-api", repository: "Java SE 21 API", path: "UnsupportedOperationException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/UnsupportedOperationException.html", usedFor: ["unmodifiable snapshot mutation"], evidence: "List.copyOf mutation failure 근거입니다." },
  { id: "java-optional-api", repository: "Java SE 21 API", path: "java.util.Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["identity-less reduce", "empty result"], evidence: "empty/nonempty reduction result contract입니다." },
);

const aggregationChapters: DetailedSession["chapters"] = [
  {
    id: "primitive-numeric-summary-overflow-money",
    title: "numeric aggregation은 primitive specialization·overflow·empty·rounding·money precision 정책을 함께 선택합니다",
    lead: "sum 한 줄이 compile된다고 값 범위와 소수 정확성이 보장되는 것은 아니므로 count/sum/min/max/average와 failure policy를 type에 맞게 설계합니다.",
    explanations: [
      "Stream<Integer>를 `mapToInt(Integer::intValue)` 또는 object→int mapper로 바꾸면 boxing 없이 sum·average·summaryStatistics를 사용할 수 있습니다. count는 long이고 int sum은 overflow를 자동 검사하지 않습니다.",
      "IntSummaryStatistics/LongSummaryStatistics는 count, sum, min, max, average를 한 traversal에 모읍니다. empty에서 min/max sentinel과 average0.0 semantics를 API로 확인하고 domain empty를 별도 presence로 처리합니다.",
      "int/long addition overflow는 wraparound합니다. overflow가 data corruption이면 Math.addExact, long widening, BigInteger 또는 input bounds를 사용하고 exception context를 보존합니다.",
      "binary double은 0.1 같은 decimal fraction을 정확히 표현하지 못해0.1+0.2와0.3 exact equality가 false일 수 있습니다. scientific approximation에는 tolerance, money/decimal rule에는 BigDecimal string construction을 사용합니다.",
      "BigDecimal은 scale과 rounding도 의미입니다. divide가 non-terminating이면 RoundingMode를 요구하며 equals는 value와 scale을 비교하지만 compareTo는 numeric value를 비교해 Map key/equality 정책을 주의합니다.",
      "money 합계는 currency를 섞지 않습니다. Money(currency,amount) value를 먼저 group하고 같은 currency만 reduce하며 exchange rate time/source/rounding을 별도 operation으로 둡니다.",
      "average를 pairwise `(a+b)/2` reduce로 계산하면 associative하지 않고 weights를 잃습니다. sum+count aggregate 또는 averaging collector를 사용합니다.",
      "parallel floating aggregation은 grouping에 따라 last bits가 달라질 수 있습니다. strict financial/audit result는 deterministic decimal/order policy를 우선하고 performance 측정 뒤 parallel을 결정합니다.",
    ],
    concepts: [
      { term: "primitive specialization", definition: "boxing 없이 int·long·double elements와 numeric terminals를 제공하는 specialized stream입니다.", detail: ["mapToInt/Long/Double로 만듭니다.", "object collector와 연결 시 boxed를 씁니다."] },
      { term: "overflow policy", definition: "numeric range를 넘을 때 wrap·exception·widen·arbitrary precision 중 어떤 결과를 허용할지 정한 계약입니다.", detail: ["Java 기본 정수 연산은 wrap합니다.", "Math.addExact는 exception을 냅니다."] },
      { term: "rounding policy", definition: "정확히 표현/나눌 수 없는 decimal을 어떤 scale과 mode로 줄일지 정한 business rule입니다.", detail: ["BigDecimal에도 필요합니다.", "API version에 포함합니다."] },
    ],
    codeExamples: [{
      id: "java-numeric-aggregation-policies",
      title: "long statistics, checked int overflow와 exact decimal money를 한 예제로 비교합니다",
      language: "java",
      filename: "NumericAggregationPolicies.java",
      purpose: "원본 reduce sum을 type/range/precision 요구별 API로 확장해 deterministic totals와 failure를 검증합니다.",
      code: String.raw`import java.math.BigDecimal;
import java.util.List;
import java.util.LongSummaryStatistics;

public class NumericAggregationPolicies {
    record Item(long quantity, long cents) { }

    public static void main(String[] args) {
        List<Item> items = List.of(new Item(2, 199), new Item(1, 250), new Item(3, 211));
        LongSummaryStatistics quantityStats = items.stream()
                .mapToLong(Item::quantity)
                .summaryStatistics();
        long cents = items.stream().mapToLong(Item::cents).sum();

        System.out.println("quantity=" + quantityStats.getCount() + "," + quantityStats.getSum()
                + "," + quantityStats.getMin() + "," + quantityStats.getMax());
        System.out.println("cents=" + cents);
        try { Math.addExact(Integer.MAX_VALUE, 1); }
        catch (ArithmeticException exception) { System.out.println("overflow=" + exception.getClass().getSimpleName()); }

        List<BigDecimal> amounts = List.of(
                new BigDecimal("19.99"), new BigDecimal("0.10"), new BigDecimal("2.05"));
        BigDecimal total = amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        boolean decimalExact = new BigDecimal("0.1").add(new BigDecimal("0.2"))
                .compareTo(new BigDecimal("0.3")) == 0;
        System.out.println("money=" + total);
        System.out.println("doubleExact=" + (0.1d + 0.2d == 0.3d));
        System.out.println("decimalExact=" + decimalExact);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "BigDecimal, ordered inputs, LongSummaryStatistics와 immutable quantity/cents Item을 준비합니다." },
        { lines: "8-13", explanation: "three items의 primitive quantities를 one-pass stats로, cents를 long sum으로 집계합니다." },
        { lines: "15-19", explanation: "count3/sum6/min1/max3과 cents660, checked int overflow exception을 출력합니다." },
        { lines: "21-25", explanation: "decimal amounts는 String constructor와 ZERO/add identity로 exact22.14를 만듭니다." },
        { lines: "26-30", explanation: "binary double exact false와 BigDecimal numeric compare true를 분리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("NumericAggregationPolicies.java", "NumericAggregationPolicies") },
      output: { value: "quantity=3,6,1,3\ncents=660\noverflow=ArithmeticException\nmoney=22.14\ndoubleExact=false\ndecimalExact=true", explanation: ["statistics는 count/sum/min/max를 한 pass에 냅니다.", "checked overflow는 wrap 대신 failure가 됩니다.", "decimal String values는 exact money sum을 유지합니다."] },
      experiments: [
        { change: "cents type을 int로 바꾸고 큰 items를 합칩니다.", prediction: "sum이 silent wrap할 수 있습니다.", result: "range analysis와 long/addExact/BigInteger 정책을 선택합니다." },
        { change: "BigDecimal을 new BigDecimal(0.1)로 만듭니다.", prediction: "binary double approximation이 decimal value에 들어갑니다.", result: "decimal literal은 String/valueOf policy를 사용합니다." },
        { change: "empty LongSummaryStatistics min을 domain 값으로 출력합니다.", prediction: "sentinel Long.MAX_VALUE가 실제 minimum처럼 보일 수 있습니다.", result: "count0을 먼저 검사하고 empty result를 명시합니다." },
      ],
      sourceRefs: ["java-class13-ex06", "java-stream-api", "java-longstream-api", "java-long-summary-api", "java-math-api", "java-bigdecimal-api", "java-list-api"],
    }],
    diagnostics: [
      { symptom: "합계가 갑자기 음수/작은 값이 됐다.", likelyCause: "int/long overflow가 wrap됐습니다.", checks: ["max cardinality×max value를 계산합니다.", "intermediate type을 확인합니다.", "addExact/DB type과 비교합니다."], fix: "충분한 range type·checked arithmetic·BigInteger와 context exception을 사용합니다.", prevention: "boundary near MAX/MIN과 property range tests를 둡니다." },
      { symptom: "금액 합계가 0.30000000000000004처럼 보인다.", likelyCause: "binary floating point를 decimal money exact equality/format에 사용했습니다.", checks: ["double construction/operations를 찾습니다.", "rounding/scale/currency policy를 확인합니다.", "serialization format을 봅니다."], fix: "BigDecimal string construction과 explicit scale/rounding, currency-aware value를 사용합니다.", prevention: "decimal examples·rounding ties·multi-currency negative tests를 둡니다." },
    ],
    expertNotes: ["LongSummaryStatistics itself is mutable collector state이므로 결과를 공유한 뒤 accept로 다시 바꾸지 않습니다. immutable summary record로 publication할 수 있습니다.", "BigDecimal performance가 걱정되면 먼저 정확성 contract를 고정하고 minor-unit long이 domain range/scale을 충분히 표현하는지 검토합니다."],
  },
  {
    id: "three-arg-reduce-vs-mutable-collect",
    title: "immutable value reduction은 reduce, mutable container accumulation은 collect로 supplier·accumulator·combiner를 분리합니다",
    lead: "ArrayList나 mutable summary를 reduce identity로 재사용하지 않고 partition마다 새 container를 만들어 combiner가 ownership을 안전하게 합치게 합니다.",
    explanations: [
      "three-arg reduce(identity, accumulator, combiner)는 input T와 result U type이 다를 때 immutable U를 만들 수 있습니다. accumulator(U,T)와 combiner(U,U)가 identity와 compatible해야 합니다.",
      "mutable ArrayList 하나를 identity로 두고 accumulator가 add하면 parallel partitions가 같은 object를 공유하거나 combiner가 self-add하는 문제가 생길 수 있습니다. reduce는 새 immutable value를 반환하는 방식에 맞습니다.",
      "collect(supplier, accumulator, combiner)는 partition마다 supplier가 새 mutable result container를 만들고 accumulator가 element를 넣으며 combiner가 두 owned containers를 합칩니다.",
      "combiner는 sequential pipeline에서도 API contract 일부이며 parallel에서 반드시 사용될 수 있습니다. left/right 중 어느 container를 반환하는지, source/result order와 alias가 안전한지 테스트합니다.",
      "custom Collector는 supplier/accumulator/combiner/finisher/characteristics를 묶습니다. IDENTITY_FINISH, UNORDERED, CONCURRENT를 실제 behavior보다 넓게 선언하면 framework가 잘못 최적화할 수 있습니다.",
      "mutable accumulator를 terminal 밖에서 재사용하지 않습니다. collect가 반환한 뒤 immutable record/copy로 finish해 publication하면 later accidental mutation을 줄입니다.",
      "parallel mutable collect는 container thread-safety보다 partition ownership과 combiner가 핵심일 수 있습니다. CONCURRENT collector가 아닌 일반 collector는 같은 container를 여러 threads가 동시에 수정하지 않게 framework가 partition합니다.",
      "원본 Ex08의 `map(price).reduce(0,sum)`은 scalar immutable reduction입니다. DTO list/Map을 만들려면 toList/grouping/custom collect를 사용합니다.",
    ],
    concepts: [
      { term: "supplier", definition: "collect partition마다 새 mutable result container를 만드는 factory입니다.", detail: ["shared singleton을 반환하면 안 됩니다.", "empty result도 정의합니다."] },
      { term: "accumulator", definition: "현재 result container와 source element를 결합해 container state를 갱신하는 함수입니다.", detail: ["partition owner 안에서 실행됩니다.", "failure/overflow를 정의합니다."] },
      { term: "combiner", definition: "parallel partitions의 두 partial results를 하나로 합치는 함수입니다.", detail: ["associative해야 합니다.", "alias/order semantics를 보존합니다."] },
    ],
    codeExamples: [{
      id: "java-reduce-collect-contracts",
      title: "immutable Summary three-arg reduce와 mutable Stats collect를 순차·병렬로 비교합니다",
      language: "java",
      filename: "ReduceCollectContracts.java",
      purpose: "같은 count/sum aggregate를 두 reduction styles로 구현해 올바른 ownership과 combiner 결과 equality를 검증합니다.",
      code: String.raw`import java.util.List;

public class ReduceCollectContracts {
    record Sale(int amount) { }
    record Summary(long count, long sum) {
        Summary add(Sale sale) { return new Summary(count + 1, sum + sale.amount()); }
        Summary combine(Summary other) { return new Summary(count + other.count, sum + other.sum); }
    }

    static final class Stats {
        private long count;
        private long sum;
        void add(Sale sale) { count++; sum += sale.amount(); }
        void combine(Stats other) { count += other.count; sum += other.sum; }
        Summary snapshot() { return new Summary(count, sum); }
    }

    static Summary immutable(List<Sale> sales, boolean parallel) {
        var stream = parallel ? sales.parallelStream() : sales.stream();
        return stream.reduce(new Summary(0, 0), Summary::add, Summary::combine);
    }

    static Summary mutable(List<Sale> sales, boolean parallel) {
        var stream = parallel ? sales.parallelStream() : sales.stream();
        return stream.collect(Stats::new, Stats::add, Stats::combine).snapshot();
    }

    public static void main(String[] args) {
        List<Sale> sales = List.of(new Sale(10), new Sale(20), new Sale(30), new Sale(40));
        Summary immutableSequential = immutable(sales, false);
        Summary immutableParallel = immutable(sales, true);
        Summary mutableSequential = mutable(sales, false);
        Summary mutableParallel = mutable(sales, true);
        System.out.println("immutable=" + immutableSequential);
        System.out.println("mutable=" + mutableSequential);
        System.out.println("parallelSame=" + (immutableSequential.equals(immutableParallel)
                && mutableSequential.equals(mutableParallel)));
        System.out.println("stylesSame=" + immutableSequential.equals(mutableSequential));
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "Sale input과 매 add/combine마다 새 value를 만드는 immutable Summary reduction을 정의합니다." },
        { lines: "10-16", explanation: "partition-owned mutable Stats가 add/combine하고 최종 immutable Summary snapshot을 만듭니다." },
        { lines: "18-27", explanation: "같은 sales를 sequential/parallel reduce와 collect 두 방식으로 실행합니다." },
        { lines: "29-39", explanation: "four totals를 준비하고 sequential values, parallel equivalence와 styles equivalence를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "parallel common pool size independent", "-Xlint:all warning0"], command: isolatedJavaRun("ReduceCollectContracts.java", "ReduceCollectContracts") },
      output: { value: "immutable=Summary[count=4, sum=100]\nmutable=Summary[count=4, sum=100]\nparallelSame=true\nstylesSame=true", explanation: ["identity Summary0/0과 both combiners가 count4/sum100을 만듭니다.", "partition 수와 관계없이 immutable snapshot values가 같습니다.", "두 styles가 같은 domain result를 냅니다."] },
      experiments: [
        { change: "Stats supplier가 같은 static singleton을 반환합니다.", prediction: "parallel partitions가 shared state를 수정해 total 중복/race가 생깁니다.", result: "supplier는 매 container 요청에 새 owner를 반환합니다." },
        { change: "Stats.combine이 count만 합치고 sum을 빼먹습니다.", prediction: "sequential은 우연히 통과할 수 있지만 parallelSame이 실패합니다.", result: "combiner-specific partition test가 필요합니다." },
        { change: "Summary.add가 this를 mutate하는 class로 바뀝니다.", prediction: "shared identity/alias로 reduce law가 깨질 수 있습니다.", result: "reduce result는 immutable value를 선호합니다." },
      ],
      sourceRefs: ["java-class13-ex08", "java-stream-api", "java-stream-package-summary", "java-collector-api", "java-list-api", "jls-records"],
    }],
    diagnostics: [
      { symptom: "parallel list reduce가 elements를 중복하거나 ConcurrentModificationException이 난다.", likelyCause: "mutable container를 reduce identity로 공유했습니다.", checks: ["identity가 mutable singleton인지 봅니다.", "accumulator가 same object를 반환/수정하는지 확인합니다.", "combiner self-alias를 검사합니다."], fix: "mutable result에는 collect와 fresh supplier를 사용하고 immutable snapshot으로 finish합니다.", prevention: "parallel partitions1/N·empty·large tests와 supplier identity check를 둡니다." },
      { symptom: "custom collector가 sequential만 통과하고 parallel에서 일부 sum이 사라진다.", likelyCause: "combiner가 field 하나를 누락하거나 partial result를 잘못 반환합니다.", checks: ["two synthetic partial states를 직접 combine합니다.", "associativity를 세 partitions로 확인합니다.", "characteristics를 검토합니다."], fix: "모든 state fields를 lossless combine하고 result owner를 명확히 합니다.", prevention: "collector law harness와 sequential/parallel oracle equality를 둡니다." },
    ],
    expertNotes: ["immutable reduce는 allocation이 많을 수 있고 mutable collect는 더 효율적일 수 있지만 먼저 laws/correctness를 고정한 뒤 JMH와 allocation profiler로 선택합니다.", "CONCURRENT characteristic는 단순히 thread-safe container를 쓴다는 뜻 이상입니다. unordered/concurrent accumulation semantics를 정확히 만족할 때만 선언합니다."],
  },
  {
    id: "grouping-partitioning-downstream-aggregation",
    title: "groupingBy·partitioningBy와 downstream collector로 one-to-many aggregate의 값 shape와 order를 명시합니다",
    lead: "부서→직원 목록, 부서→급여 합계, 활성 여부→count는 같은 classifier를 써도 downstream collector에 따라 전혀 다른 Map value contract를 가집니다.",
    explanations: [
      "groupingBy(classifier)는 기본으로 Map<K,List<T>>를 만들며 key당 여러 source elements를 보존합니다. result Map concrete type/order를 기본 overload에서 가정하지 않습니다.",
      "downstream mapping, counting, summingInt, summarizing, reducing, maxBy로 group values를 필요한 aggregate로 바꿉니다. 먼저 list를 만든 뒤 다시 순회하는 것보다 one-pass intent를 표현할 수 있습니다.",
      "세 인자 groupingBy는 Map supplier로 TreeMap sorted groups나 LinkedHashMap encounter groups를 명시합니다. classifier null과 target Map null policy를 validation 전에 확인합니다.",
      "partitioningBy는 boolean predicate의 true/false 두 partitions를 Map<Boolean,...>로 만들며 empty side도 존재할 수 있습니다. Map iteration order 대신 `get(true/false)`로 접근합니다.",
      "maxBy/minBy downstream은 group이 존재하면 Optional을 반환하지만 collectingAndThen으로 unwrapped value를 만들 때 empty possibility와 failure message를 설계합니다.",
      "toMap merge와 grouping은 다릅니다. 한 value로 합치는 business merge인지 원본 여러 values를 보존하는 one-to-many model인지 먼저 선택합니다.",
      "groupingByConcurrent는 encounter order와 downstream concurrency semantics가 달라집니다. ordered output이 필요하면 단순히 method 이름만 바꾸지 않습니다.",
      "group cardinality와 group size가 untrusted하면 memory가 커집니다. allowed keys/tenant quota, streaming database aggregation이나 bounded top-N을 고려합니다.",
    ],
    concepts: [
      { term: "classifier", definition: "source element에서 group key를 계산하는 function입니다.", detail: ["normalization과 null policy가 필요합니다.", "stable domain key를 반환합니다."] },
      { term: "downstream collector", definition: "각 group에 속한 elements를 list 대신 count/sum/mapping/max 등으로 줄이는 nested collector입니다.", detail: ["value type을 결정합니다.", "one pass aggregate를 표현합니다."] },
      { term: "partition", definition: "boolean predicate 결과 true와 false 두 buckets로 source를 나눈 aggregate입니다.", detail: ["양쪽 key로 직접 접근합니다.", "filter 하나와 정보량이 다릅니다."] },
    ],
    codeExamples: [{
      id: "java-downstream-aggregation",
      title: "부서별 급여·이름·최고급여와 활성 true/false counts를 수집합니다",
      language: "java",
      filename: "DownstreamAggregation.java",
      purpose: "TreeMap group order와 downstream value shapes, partition key access를 deterministic output으로 검증합니다.",
      code: String.raw`import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class DownstreamAggregation {
    record Employee(String department, String name, int salary, boolean active) { }

    public static void main(String[] args) {
        List<Employee> employees = List.of(
                new Employee("ENG", "Ada", 120, true),
                new Employee("SALES", "Bob", 90, false),
                new Employee("ENG", "Cleo", 130, true));

        Map<String, Integer> totals = employees.stream().collect(Collectors.groupingBy(
                Employee::department, TreeMap::new, Collectors.summingInt(Employee::salary)));
        Map<String, String> names = employees.stream().collect(Collectors.groupingBy(
                Employee::department, TreeMap::new,
                Collectors.mapping(Employee::name, Collectors.joining("|"))));
        Map<String, Employee> highest = employees.stream().collect(Collectors.groupingBy(
                Employee::department, TreeMap::new,
                Collectors.collectingAndThen(
                        Collectors.maxBy(Comparator.comparingInt(Employee::salary)),
                        optional -> optional.orElseThrow())));
        Map<Boolean, Long> active = employees.stream().collect(Collectors.partitioningBy(
                Employee::active, Collectors.counting()));

        System.out.println("totals=" + totals);
        System.out.println("names=" + names);
        System.out.println("highest=" + highest.entrySet().stream()
                .map(entry -> entry.getKey() + ":" + entry.getValue().name()).toList());
        System.out.println("active=" + active.get(true) + ",inactive=" + active.get(false));
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "ordered source, TreeMap supplier, downstream APIs와 Employee record를 준비합니다." },
        { lines: "10-14", explanation: "ENG2/SALES1 employees에 salary와 active fixtures를 둡니다." },
        { lines: "16-21", explanation: "같은 department classifier로 totals와 encounter-order joined names라는 다른 value shapes를 만듭니다." },
        { lines: "22-27", explanation: "maxBy Optional을 existing group 안에서 Employee로 finish합니다." },
        { lines: "28-29", explanation: "active predicate를 true/false counts로 partition합니다." },
        { lines: "31-35", explanation: "TreeMap groups와 explicit boolean key access를 stable output으로 만듭니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "sequential ordered stream", "-Xlint:all warning0"], command: isolatedJavaRun("DownstreamAggregation.java", "DownstreamAggregation") },
      output: { value: "totals={ENG=250, SALES=90}\nnames={ENG=Ada|Cleo, SALES=Bob}\nhighest=[ENG:Cleo, SALES:Bob]\nactive=2,inactive=1", explanation: ["ENG totals250/names2/highest Cleo를 같은 classifier의 different downstreams가 만듭니다.", "TreeMap이 group output order를 명시합니다.", "partition은 true2/false1을 모두 보존합니다."] },
      experiments: [
        { change: "TreeMap supplier를 제거하고 exact group order를 유지합니다.", prediction: "default Map order는 collector contract가 아니어서 test가 잘못됩니다.", result: "order requirement에는 explicit supplier/sort를 사용합니다." },
        { change: "maxBy를 reducing with identity salary0 employee로 바꿉니다.", prediction: "negative/empty domain에서 fake identity가 result가 될 수 있습니다.", result: "Optional max와 group existence를 유지합니다." },
        { change: "partitioningBy 대신 filter(active)만 합니다.", prediction: "inactive count 정보가 사라집니다.", result: "양쪽 aggregate가 필요하면 partitioning을 사용합니다." },
      ],
      sourceRefs: ["java-class13-ex04", "java-class13-ex08", "java-collectors-api", "java-stream-api", "java-map-api", "java-treemap-api", "java-comparator-api", "java-optional-api", "jls-records"],
    }],
    diagnostics: [
      { symptom: "grouping 결과 key 순서가 환경마다 달라진다.", likelyCause: "default groupingBy result Map order를 exact output으로 가정했습니다.", checks: ["supplier overload 사용을 봅니다.", "presentation order requirement를 확인합니다.", "classifier normalization을 점검합니다."], fix: "TreeMap/LinkedHashMap supplier 또는 output boundary sort를 사용합니다.", prevention: "ordered/unordered 근거와 comparator tie-breaker를 test metadata에 둡니다." },
      { symptom: "grouping이 memory를 과도하게 사용한다.", likelyCause: "high-cardinality keys와 큰 List<T> downstream을 전부 보존했습니다.", checks: ["distinct group count와 max group size를 측정합니다.", "count/sum만 필요한지 확인합니다.", "input bound/tenant quota를 봅니다."], fix: "downstream aggregate, bounded top-N, database aggregation 또는 spill 전략을 사용합니다.", prevention: "cardinality budget과 load test를 release gate에 둡니다." },
    ],
    expertNotes: ["여러 aggregates를 각각 stream 순회할지 custom/teeing collector 한 번으로 모을지는 source 비용과 readability를 측정해 결정합니다. 작은 in-memory source에는 명확성이 우선일 수 있습니다.", "classifier에 locale/PII가 들어가면 normalization과 data exposure 문제가 있습니다. typed/redacted group key와 allowed cardinality를 설계합니다."],
  },
  {
    id: "pipeline-order-source-mutation-sort-label",
    title: "filter·map·sorted 순서와 source mutation을 분리하고 label·comparator·output이 같은 방향을 말하게 합니다",
    lead: "원본 Ex08처럼 Collections.sort가 list를 먼저 바꾸면 뒤 stream 결과가 이미 변한 source에서 시작하므로 pipeline만 보고 원래 order를 추론할 수 없습니다.",
    explanations: [
      "stream.sorted는 새 sorted stream을 만들고 source List 자체를 수정하지 않습니다. `Collections.sort(list)`/`list.sort`는 mutable list encounter order를 바꿔 이후 모든 iterators/streams에서 보입니다.",
      "원본 Ex08은 collection section에서 name ascending sort로 source를 변경합니다. 따라서 stream ‘고객명단 순서대로’는 최초 insertion order가 아니라 변경된 공실이·마이콜·희동이 order입니다.",
      "마지막 label은 오름차순이라고 하지만 comparator에 reversed가 있어 filtered names는 희동이→공실이 descending입니다. label, comparator direction, expected output을 같은 test에서 검증합니다.",
      "filter-before-map은 rejected elements의 projection을 줄일 수 있지만 map result가 predicate에 필요하면 named projection을 먼저 만듭니다. call count는 최적화/terminal에 따라 달라질 수 있으므로 controlled non-elidable fixture에서만 관찰합니다.",
      "sorted는 stateful intermediate operation으로 upstream을 모아야 하고 comparator는 total order·deterministic tie-breaker를 가져야 합니다. name equal이면 id를 thenComparing해 stable business order를 만듭니다.",
      "parallel forEach는 sorted encounter order를 출력 순서로 보장하지 않습니다. ordered terminal/toList와 forEachOrdered의 비용·요구를 구분합니다.",
      "source DTO가 mutable하고 comparator field가 traversal 중 바뀌면 comparator contract violation과 inconsistent order가 생길 수 있습니다. immutable snapshot 후 sort합니다.",
      "UI/export label은 hard-coded text와 comparator enum을 따로 두지 말고 SortSpec(direction,key)가 comparator와 display label을 함께 생성하게 해 drift를 줄입니다.",
    ],
    concepts: [
      { term: "non-mutating sort pipeline", definition: "source collection order는 유지하고 sorted intermediate result에만 ordering을 적용하는 stream 구성입니다.", detail: ["source 재사용에 안전합니다.", "stateful 비용은 남습니다."] },
      { term: "source order mutation", definition: "list.sort/Collections.sort로 backing list encounter order 자체를 바꾸는 operation입니다.", detail: ["후속 streams에 반영됩니다.", "ownership을 확인합니다."] },
      { term: "sort specification", definition: "key, direction, null/tie/locale 정책과 사용자 label을 하나로 묶은 ordering contract입니다.", detail: ["comparator drift를 줄입니다.", "versioned API에 유용합니다."] },
    ],
    codeExamples: [{
      id: "java-pipeline-order-mutation",
      title: "stream sorted result와 List.sort source mutation, filter/map call count를 비교합니다",
      language: "java",
      filename: "PipelineOrderMutation.java",
      purpose: "non-mutating pipeline result와 explicit source mutation을 exact names로 분리하고 operation order 비용을 controlled counter로 확인합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class PipelineOrderMutation {
    record Customer(String name, int age) { }

    public static void main(String[] args) {
        List<Customer> source = new ArrayList<>(List.of(
                new Customer("Cleo", 40), new Customer("Ada", 20), new Customer("Bob", 13)));
        List<String> initial = source.stream().map(Customer::name).toList();
        List<String> adultsDescending = source.stream()
                .filter(customer -> customer.age() >= 20)
                .sorted(Comparator.comparing(Customer::name).reversed())
                .map(Customer::name)
                .toList();
        List<String> afterPipeline = source.stream().map(Customer::name).toList();

        AtomicInteger filterFirstCalls = new AtomicInteger();
        source.stream().filter(customer -> customer.age() >= 20)
                .map(customer -> { filterFirstCalls.incrementAndGet(); return customer.name(); })
                .toList();
        AtomicInteger mapFirstCalls = new AtomicInteger();
        source.stream().map(customer -> { mapFirstCalls.incrementAndGet(); return customer; })
                .filter(customer -> customer.age() >= 20).toList();

        source.sort(Comparator.comparing(Customer::name));
        List<String> afterMutation = source.stream().map(Customer::name).toList();
        System.out.println("initial=" + initial);
        System.out.println("adultsDescending=" + adultsDescending);
        System.out.println("afterPipeline=" + afterPipeline);
        System.out.println("projectionCalls=" + filterFirstCalls + "," + mapFirstCalls);
        System.out.println("afterListSort=" + afterMutation);
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "mutable list에 deliberate non-sorted C,A,B source를 만들고 initial names를 snapshot합니다." },
        { lines: "12-18", explanation: "adult filter 뒤 name descending sorted result C,A를 만들되 source를 수정하지 않습니다." },
        { lines: "20-27", explanation: "controlled terminal toList에서 filter-before-map2와 map-before-filter3 projection calls를 셉니다." },
        { lines: "29-35", explanation: "명시 List.sort만 source를 A,B,C로 바꾸고 모든 states/calls를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "sequential controlled call-count fixture", "-Xlint:all warning0"], command: isolatedJavaRun("PipelineOrderMutation.java", "PipelineOrderMutation") },
      output: { value: "initial=[Cleo, Ada, Bob]\nadultsDescending=[Cleo, Ada]\nafterPipeline=[Cleo, Ada, Bob]\nprojectionCalls=2,3\nafterListSort=[Ada, Bob, Cleo]", explanation: ["stream sorted result는 source C,A,B를 유지합니다.", "filter-first가 rejected Bob projection을 피합니다.", "List.sort 이후에만 source가 A,B,C가 됩니다."] },
      experiments: [
        { change: "sorted 뒤 forEach를 parallel forEach로 출력합니다.", prediction: "processing order가 sorted여도 side-effect output 순서는 보장되지 않을 수 있습니다.", result: "ordered result에는 toList/forEachOrdered를 사용합니다." },
        { change: "Customer name 두 개를 같게 만들고 id tie-breaker를 생략합니다.", prediction: "stable encounter order는 유지될 수 있지만 business total order가 불완전합니다.", result: "pagination/export에는 deterministic unique tie-breaker를 둡니다." },
        { change: "source.sort를 shared caller-owned list에 적용합니다.", prediction: "다른 consumer의 encounter order도 바뀝니다.", result: "copy ownership 또는 non-mutating stream sort를 사용합니다." },
      ],
      sourceRefs: ["java-class13-ex08", "java-stream-api", "java-stream-package-summary", "java-list-api", "java-comparator-api", "java-atomic-integer-api", "jls-records"],
    }],
    diagnostics: [
      { symptom: "stream section의 source order가 최초 입력과 다르다.", likelyCause: "앞 collection section이 같은 mutable list를 sort했습니다.", checks: ["list.sort/Collections.sort calls를 찾습니다.", "source alias/owner를 추적합니다.", "pipeline 전 snapshot을 비교합니다."], fix: "copy 또는 stream.sorted result를 사용하고 mutation owner를 명시합니다.", prevention: "source unchanged assertion과 before/after order test를 둡니다." },
      { symptom: "화면에는 오름차순이라 쓰였는데 결과는 내림차순이다.", likelyCause: "label과 comparator direction이 별도 hard-coded state로 drift했습니다.", checks: ["reversed/thenComparing을 확인합니다.", "first/last fixture를 비교합니다.", "SortSpec source를 봅니다."], fix: "하나의 SortSpec에서 comparator와 label을 생성하고 exact ordered output을 검증합니다.", prevention: "direction별 boundary/tie E2E와 accessibility label test를 둡니다." },
    ],
    expertNotes: ["call-count example은 terminal이 mapper results를 실제 요구하도록 구성했습니다. 일반 stream implementation은 일부 stages를 elide할 수 있어 arbitrary peek/map invocation count를 business contract로 만들지 않습니다.", "정렬은 O(n log n)과 memory barrier가 될 수 있습니다. top-K만 필요하면 heap/select algorithm이나 DB ORDER BY+LIMIT을 검토합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...aggregationChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-longstream-api", repository: "Java SE 21 API", path: "java.util.stream.LongStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/LongStream.html", usedFor: ["long sum", "primitive quantity"], evidence: "large-range primitive aggregation 근거입니다." },
  { id: "java-long-summary-api", repository: "Java SE 21 API", path: "java.util.LongSummaryStatistics", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LongSummaryStatistics.html", usedFor: ["count sum min max average"], evidence: "one-pass long statistics contract입니다." },
  { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["addExact overflow"], evidence: "checked integer arithmetic 근거입니다." },
  { id: "java-bigdecimal-api", repository: "Java SE 21 API", path: "java.math.BigDecimal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html", usedFor: ["exact decimal", "scale rounding", "money sum"], evidence: "decimal arithmetic contract입니다." },
  { id: "java-collector-api", repository: "Java SE 21 API", path: "java.util.stream.Collector", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collector.html", usedFor: ["supplier accumulator combiner", "characteristics"], evidence: "mutable reduction laws의 primary source입니다." },
  { id: "java-collectors-api", repository: "Java SE 21 API", path: "java.util.stream.Collectors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html", usedFor: ["groupingBy", "partitioningBy", "downstream", "joining"], evidence: "built-in collectors contract입니다." },
  { id: "java-map-api", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["group result", "boolean partition access"], evidence: "aggregate Map contract입니다." },
  { id: "java-treemap-api", repository: "Java SE 21 API", path: "java.util.TreeMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html", usedFor: ["sorted group supplier"], evidence: "deterministic group key order 근거입니다." },
  { id: "java-comparator-api", repository: "Java SE 21 API", path: "java.util.Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["maxBy", "sorted", "reversed", "tie-breaker"], evidence: "ordering contract입니다." },
  { id: "java-atomic-integer-api", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["controlled projection counts"], evidence: "call-count observation 근거입니다." },
);

const reliabilityChapters: DetailedSession["chapters"] = [
  {
    id: "null-parse-validation-error-channel",
    title: "null·blank·parse failure를 empty로 지우지 않고 value와 error를 함께 보존하는 typed mapping 결과를 만듭니다",
    lead: "flatMap으로 successful values만 펼치더라도 원래 rows 수와 error 목록을 따로 유지해 모든 input이 성공·실패 중 정확히 한 상태로 accounting되게 합니다.",
    explanations: [
      "mapper가 NumberFormatException을 catch하고 null/0을 반환하면 invalid row가 valid-looking data로 바뀌거나 downstream NPE로 원인 지점이 멀어집니다. value/error를 가진 Result type을 반환합니다.",
      "absent optional field, blank input, invalid format, range violation과 infrastructure failure는 서로 다른 상태입니다. 모두 Optional.empty 하나로 합치지 않고 error code/context와 retry 가능성을 분리합니다.",
      "`Optional<T>.stream()`을 flatMap하면 success Optional은 element1, empty는0으로 펼칠 수 있습니다. 이것은 success projection에 유용하지만 errors collection을 별도로 보존해야 합니다.",
      "null collection을 empty collection으로 normalize할지는 input schema contract입니다. ‘항목 없음’과 ‘field 누락/invalid’이 다른 의미라면 constructor/parser에서 구분합니다.",
      "parse mapper는 raw secret 전체를 error message에 넣지 않습니다. row index, safe field name/code와 redacted sample을 사용하고 original cause를 internal diagnostics에 연결합니다.",
      "stream 안에서 broad catch(Exception)으로 모든 failure를 invalid data로 바꾸면 OutOfMemoryError 같은 Error는 제외되더라도 programming/infrastructure bugs가 숨습니다. 예상한 narrow exception만 translate합니다.",
      "fail-fast와 collect-all은 product 요구입니다. config/security-critical data는 첫 invalid에서 중단할 수 있고 batch import는 valid results와 errors를 함께 반환하되 partial commit policy를 정합니다.",
      "validation result aggregation도 order/multiplicity를 보존해야 합니다. HashMap 하나로 field errors를 overwrite하지 말고 row→List<Error> 또는 ordered flat errors를 사용합니다.",
    ],
    concepts: [
      { term: "typed result", definition: "성공 value 또는 실패 error를 명시적 type/state로 표현해 null sentinel을 피하는 반환입니다.", detail: ["모든 input을 accounting합니다.", "error context를 보존합니다."] },
      { term: "error channel", definition: "normal data stream과 분리해 validation/parse failures를 전달하는 구조입니다.", detail: ["fail-fast/collect-all을 선택합니다.", "privacy-safe context를 담습니다."] },
      { term: "accounting invariant", definition: "입력 each row가 success 또는 error 중 정확히 하나에 포함돼 누락·중복되지 않는 규칙입니다.", detail: ["counts로 검증합니다.", "partial commit 정책의 기초입니다."] },
    ],
    codeExamples: [{
      id: "java-parse-outcome-pipeline",
      title: "문자열 네 개를 success values와 ordered errors로 분리하고 accounting을 검증합니다",
      language: "java",
      filename: "ParseOutcomePipeline.java",
      purpose: "blank/invalid를 flatMap으로 조용히 버리지 않고 typed Optional value/error와 exact counts를 보존합니다.",
      code: String.raw`import java.util.List;
import java.util.Optional;

public class ParseOutcomePipeline {
    record Outcome(String raw, Optional<Integer> value, Optional<String> error) {
        static Outcome success(String raw, int value) {
            return new Outcome(raw, Optional.of(value), Optional.empty());
        }
        static Outcome failure(String raw, String code) {
            return new Outcome(raw, Optional.empty(), Optional.of(code + ":" + (raw.isEmpty() ? "<empty>" : raw)));
        }
    }

    static Outcome parse(String raw) {
        if (raw.isBlank()) { return Outcome.failure(raw, "blank"); }
        try {
            return Outcome.success(raw, Integer.parseInt(raw));
        } catch (NumberFormatException exception) {
            return Outcome.failure(raw, "invalid");
        }
    }

    public static void main(String[] args) {
        List<String> input = List.of("10", "", "x", "20");
        List<Outcome> outcomes = input.stream().map(ParseOutcomePipeline::parse).toList();
        List<Integer> values = outcomes.stream().flatMap(outcome -> outcome.value().stream()).toList();
        List<String> errors = outcomes.stream().flatMap(outcome -> outcome.error().stream()).toList();
        int sum = values.stream().mapToInt(Integer::intValue).sum();

        System.out.println("values=" + values);
        System.out.println("errors=" + errors);
        System.out.println("sum=" + sum);
        System.out.println("accounted=" + (input.size() == values.size() + errors.size()));
        System.out.println("counts=" + input.size() + "," + values.size() + "," + errors.size());
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "Outcome record factories가 value/error Optional 중 한쪽만 채우고 raw context를 safe code와 보존합니다." },
        { lines: "14-21", explanation: "blank와 NumberFormatException만 구분해 translate하고 예상하지 않은 failures는 숨기지 않습니다." },
        { lines: "23-28", explanation: "input4를 Outcome4로 map한 뒤 success/error Optionals를 각각 flatMap해 values2/errors2로 펼칩니다." },
        { lines: "30-34", explanation: "result lists, sum30, accounting true와4=2+2 counts를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("ParseOutcomePipeline.java", "ParseOutcomePipeline") },
      output: { value: "values=[10, 20]\nerrors=[blank:<empty>, invalid:x]\nsum=30\naccounted=true\ncounts=4,2,2", explanation: ["valid10/20만 numeric stream으로 펼쳐집니다.", "blank와 invalid raw x는 ordered errors로 남습니다.", "모든 input이 한 결과 channel에 정확히 포함됩니다."] },
      experiments: [
        { change: "parse failure에서 Optional.empty만 반환하고 error를 제거합니다.", prediction: "values는 같지만 x와 blank의 원인/count 추적이 사라집니다.", result: "success projection과 error accounting을 함께 보존합니다." },
        { change: "catch Exception으로 넓히고0 success를 반환합니다.", prediction: "invalid rows가 sum에0으로 섞이고 programming failure도 data error로 숨습니다.", result: "예상 exception만 narrow translate합니다." },
        { change: "input에 null을 넣습니다.", prediction: "List.of construction 또는 parse isBlank에서 null failure가 납니다.", result: "null 허용/거부/absent policy를 input boundary에 명시합니다." },
      ],
      sourceRefs: ["java-stream-api", "java-optional-api", "java-list-api", "java-intstream-api", "jls-records"],
    }],
    diagnostics: [
      { symptom: "batch import 합계는 맞아 보이지만 몇 rows가 사라졌는지 모른다.", likelyCause: "parse failure를 empty/null로 flatMap에서 버렸습니다.", checks: ["input/success/error counts를 비교합니다.", "catch에서 null/empty를 반환하는지 봅니다.", "row context를 확인합니다."], fix: "typed Outcome과 accounting invariant를 사용해 errors를 별도 반환합니다.", prevention: "input=success+error property와 duplicate/no-drop tests를 둡니다." },
      { symptom: "error log에 민감한 raw payload가 노출된다.", likelyCause: "parse exception/message에 input 전체를 그대로 포함했습니다.", checks: ["error DTO/log fields를 inventory합니다.", "PII/secret pattern을 scan합니다.", "debug/internal channel을 분리합니다."], fix: "safe row id·field code·redacted preview와 internal cause를 사용합니다.", prevention: "structured logging redaction과 public output privacy tests를 둡니다." },
    ],
    expertNotes: ["Java 표준에는 일반 Either/Result가 없으므로 sealed interface/record pair 또는 library type을 선택할 수 있습니다. 팀 전체 error algebra와 serialization을 일관되게 합니다.", "collect-all은 memory를 사용합니다. errors upper bound, streaming report sink와 first-N+count policy를 정의합니다."],
  },
  {
    id: "parallel-reduction-cost-order-bounds",
    title: "parallel stream은 laws를 만족한 뒤 source splitting·work size·ordering·pool contention을 측정해 선택합니다",
    lead: "CPU core가 많다는 이유만으로 작은 DTO pipeline을 parallel로 바꾸지 않고 independent oracle과 운영 pool 환경에서 의미·비용을 검증합니다.",
    explanations: [
      "parallel stream은 source Spliterator를 partitions로 나누고 accumulator/combiner를 여러 workers에서 실행할 수 있습니다. split quality, per-element cost와 merge 비용이 speedup을 결정합니다.",
      "associative reduction과 non-interference가 correctness prerequisite입니다. thread-safe collection에 넣는 것만으로 non-associative operation이나 shared side effect가 올바르게 되지 않습니다.",
      "ordered stream에서 toList/reduce는 encounter order semantics를 보존할 수 있지만 synchronization/merge 비용이 듭니다. unordered가 domain상 허용될 때만 unordered를 선언합니다.",
      "parallelStream은 보통 common ForkJoinPool과 process의 다른 parallel tasks를 공유합니다. blocking I/O, nested parallelism과 server request마다 parallel stream은 pool starvation/latency tail을 만들 수 있습니다.",
      "custom ForkJoinPool에서 parallel stream을 실행하는 관찰에 implementation 세부를 기대하지 않고 supported executor/task architecture를 선택합니다. blocking tasks에는 bounded executors/virtual threads와 backpressure를 별도 검토합니다.",
      "size threshold는 고정 magic number가 아닙니다. JMH로 sequential/parallel을 source sizes, hit ratios, mapper cost, core quota에서 측정하고 end-to-end latency와 CPU를 봅니다.",
      "container/server에서 availableProcessors가 host quota와 다르거나 다른 workloads와 cores를 경쟁할 수 있습니다. production resource limits와 load test를 기준으로 합니다.",
      "deterministic audit에는 result value와 law oracle만 넣고 worker name, partition count, execution order를 고정하지 않습니다.",
    ],
    concepts: [
      { term: "splitting", definition: "Spliterator가 source range를 partial traversals로 나눠 parallel workers에 공급하는 과정입니다.", detail: ["balance가 중요합니다.", "source 특성에 따라 비용이 다릅니다."] },
      { term: "common pool", definition: "ForkJoin 기반 parallel operations가 공유할 수 있는 process-wide worker pool입니다.", detail: ["다른 tasks와 contention이 있습니다.", "blocking에 주의합니다."] },
      { term: "parallel threshold", definition: "partition/merge overhead보다 element work speedup이 커지기 시작하는 workload-specific 규모입니다.", detail: ["측정값입니다.", "hardware/runtime에 따라 달라집니다."] },
    ],
    codeExamples: [{
      id: "java-parallel-reduction-oracle",
      title: "1..10000 합계를 순차·병렬·수학 oracle로 비교하고 ordered joining을 검증합니다",
      language: "java",
      filename: "ParallelReductionOracle.java",
      purpose: "thread/partition 관찰을 output에서 제외하고 associative long sum과 ordered String reduction의 semantic equality만 확인합니다.",
      code: String.raw`import java.util.List;
import java.util.stream.IntStream;

public class ParallelReductionOracle {
    public static void main(String[] args) {
        List<Integer> values = IntStream.rangeClosed(1, 10_000).boxed().toList();
        long sequential = values.stream().mapToLong(Integer::longValue).sum();
        long parallel = values.parallelStream().mapToLong(Integer::longValue).sum();
        long oracle = 10_000L * 10_001L / 2L;

        List<String> words = List.of("A", "B", "C", "D");
        String sequentialText = words.stream().reduce("", String::concat);
        String parallelText = words.parallelStream().reduce("", String::concat);

        System.out.println("sum=" + sequential);
        System.out.println("parallelSame=" + (sequential == parallel));
        System.out.println("oracle=" + (parallel == oracle));
        System.out.println("orderedText=" + sequentialText + "," + parallelText);
        System.out.println("sourceSize=" + values.size());
        System.out.println("executionShapePublished=false");
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "ordered finite values1..10000를 IntStream으로 만들고 immutable list source를 준비합니다." },
        { lines: "6-8", explanation: "sequential/parallel long sum과 독립 arithmetic-series oracle50005000을 계산합니다." },
        { lines: "10-12", explanation: "ordered words에 associative String concat을 적용해 encounter-order result를 비교합니다." },
        { lines: "14-19", explanation: "result equality와 source size만 출력하고 workers/partitions/thread names는 공개하지 않습니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "common-pool parallelism independent", "-Xlint:all warning0"], command: isolatedJavaRun("ParallelReductionOracle.java", "ParallelReductionOracle") },
      output: { value: "sum=50005000\nparallelSame=true\noracle=true\norderedText=ABCD,ABCD\nsourceSize=10000\nexecutionShapePublished=false", explanation: ["associative long sum은 sequential/parallel/oracle이 같습니다.", "ordered concat도 ABCD를 보존합니다.", "nondeterministic execution shape는 golden에 없습니다."] },
      experiments: [
        { change: "sum을 subtraction reduce로 바꿉니다.", prediction: "parallel grouping 때문에 sequential과 다른 result가 가능합니다.", result: "parallel 전 associativity를 증명합니다." },
        { change: "mapper 안에서 blocking network call을 합니다.", prediction: "common pool workers가 막혀 unrelated parallel tasks latency도 증가할 수 있습니다.", result: "I/O는 별도 bounded concurrency/backpressure architecture로 이동합니다." },
        { change: "words stream에 unordered를 적용하고 order equality를 기대합니다.", prediction: "domain이 order를 포기했으므로 ABCD exact를 요구할 근거가 약해집니다.", result: "unordered는 optimization hint이자 semantic permission입니다." },
      ],
      sourceRefs: ["java-stream-api", "java-stream-package-summary", "java-intstream-api", "java-list-api", "java-forkjoinpool-api", "java-spliterator-api", "java-base-stream-api", "jmh-project"],
    }],
    diagnostics: [
      { symptom: "parallel로 바꿨는데 더 느리고 tail latency가 커졌다.", likelyCause: "작은 work, poor splitting, ordered merge 또는 common-pool contention/blocking이 overhead를 넘었습니다.", checks: ["JMH size/cost crossover를 측정합니다.", "pool saturation/blocking을 봅니다.", "ordering/stateful stages를 확인합니다."], fix: "sequential로 되돌리거나 workload/executor/batch를 재설계합니다.", prevention: "production-like core quota와 concurrent load benchmark, rollback threshold를 둡니다." },
      { symptom: "parallel 결과 값/순서가 간헐적으로 달라진다.", likelyCause: "non-associative reduction, unordered side effect 또는 mutable shared state가 있습니다.", checks: ["three-way grouping laws를 검증합니다.", "external mutation을 찾습니다.", "encounter order/terminal contract를 봅니다."], fix: "immutable associative aggregate와 ordered terminal 또는 explicit sort를 사용합니다.", prevention: "sequential/parallel property equivalence와 repeated stress tests를 둡니다." },
    ],
    expertNotes: ["parallel stream은 data-parallel CPU tool이지 general async API가 아닙니다. cancellation, timeout, tracing, request isolation이 필요하면 structured task/executor design을 검토합니다.", "성능 결과에는 JDK, CPU quota, GC, input distribution과 confidence interval을 기록합니다. 한 desktop 측정을 universal threshold로 배포하지 않습니다."],
  },
  {
    id: "flat-reduce-property-verification",
    title: "flattening과 reduction을 independent loop oracle·empty/boundary·partition laws·mutation testing으로 검증합니다",
    lead: "예제 한 번의 출력보다 nested input generator가 만든 다양한 cardinality에서 no-loss/no-dup, sum/max와 sequential/parallel equivalence를 매번 확인합니다.",
    explanations: [
      "flatMap oracle은 nested lists를 단순 nested loops로 펼쳐 element count/order/multiplicity를 비교합니다. expected도 flatMap helper를 재사용하면 같은 bug가 양쪽에 복제됩니다.",
      "input partitions는 no parents, empty children only, one child, duplicates, negative/large values와 null rejection을 포함합니다. aggregate마다 empty semantics를 따로 검증합니다.",
      "reduce laws는 arbitrary a,b,c에 identity와 associativity를 검사합니다. int addition은 modulo overflow에서도 associative하지만 business overflow policy가 별도이므로 small long domain과 checked boundaries를 나눕니다.",
      "custom collector는 fresh supplier, accumulator one element, combiner two partials, finisher와 characteristics를 단위 검증하고 random partition regrouping 결과를 loop oracle과 비교합니다.",
      "DTO snapshot test는 source setter/list mutation 뒤 value가 unchanged인지 확인합니다. equals/toString만 보지 않고 nested alias와 sensitive field projection을 검사합니다.",
      "ordered vs unordered tests를 분리합니다. Hash-based result는 pair multiset, TreeMap/ordered stream은 comparator order와 tie-breaker를 exact로 검사합니다.",
      "mutation testing으로 flatMap→map, filter 제거, identity0→1, combiner field 누락, reversed 제거, error drop을 주입해 suite가 실패하는지 확인합니다.",
      "benchmark는 correctness suite 통과 뒤 별도 실행하며 property generator의 logging/allocation을 benchmark measurement에 섞지 않습니다.",
    ],
    concepts: [
      { term: "no-loss/no-dup property", definition: "flattened result가 각 source child를 정확히 한 번 포함하고 다른 element를 만들지 않는 invariant입니다.", detail: ["multiplicity와 order를 검증합니다.", "parent context도 포함합니다."] },
      { term: "partition law test", definition: "input을 여러 partial groups로 나눠 accumulator/combiner regrouping이 같은 final result를 내는지 검증하는 test입니다.", detail: ["parallel bugs를 조기에 찾습니다.", "combiner 누락을 탐지합니다."] },
      { term: "semantic mutation", definition: "operation/identity/order/error handling을 작은 방식으로 바꿔 tests의 실제 탐지 능력을 확인하는 변형입니다.", detail: ["coverage보다 강한 oracle 점검입니다.", "survivor를 분석합니다."] },
    ],
    codeExamples: [{
      id: "java-flat-reduce-verification",
      title: "fixed-seed nested lists를 loop/stream으로 펼쳐 value·sum·max·parallel과1000 addition laws를 검증합니다",
      language: "java",
      filename: "FlatReduceVerification.java",
      purpose: "random final values를 golden에 고정하지 않고 independent oracle equality와 law pass booleans만 stable output으로 남깁니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;

public class FlatReduceVerification {
    static void require(boolean condition, String label) {
        if (!condition) { throw new AssertionError(label); }
    }

    public static void main(String[] args) {
        Random random = new Random(20_260_713L);
        List<List<Integer>> nested = new ArrayList<>();
        for (int parent = 0; parent < 100; parent++) {
            List<Integer> children = new ArrayList<>();
            for (int index = 0; index < random.nextInt(5); index++) {
                children.add(random.nextInt(21) - 10);
            }
            nested.add(List.copyOf(children));
        }

        List<Integer> loopFlat = new ArrayList<>();
        long loopSum = 0;
        Integer loopMax = null;
        for (List<Integer> children : nested) {
            for (Integer value : children) {
                loopFlat.add(value);
                loopSum += value;
                loopMax = loopMax == null ? value : Math.max(loopMax, value);
            }
        }
        List<Integer> streamFlat = nested.stream().flatMap(List::stream).toList();
        long streamSum = streamFlat.stream().mapToLong(Integer::longValue).sum();
        Optional<Integer> streamMax = streamFlat.stream().reduce(Integer::max);
        long parallelSum = nested.parallelStream().flatMap(List::stream)
                .mapToLong(Integer::longValue).sum();

        require(loopFlat.equals(streamFlat), "flat values");
        require(loopSum == streamSum, "sum");
        require(Objects.equals(loopMax, streamMax.orElse(null)), "max");
        require(streamSum == parallelSum, "parallel");
        for (int index = 0; index < 1_000; index++) {
            long a = random.nextInt(1_000) - 500;
            long b = random.nextInt(1_000) - 500;
            long c = random.nextInt(1_000) - 500;
            require((a + b) + c == a + (b + c), "addition law");
            require(0 + a == a, "identity law");
        }

        System.out.println("parents=100");
        System.out.println("flatMatches=true");
        System.out.println("sumMaxMatches=true");
        System.out.println("parallelMatches=true");
        System.out.println("additionLawChecks=1000");
        System.out.println("seedRecorded=true");
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "fixed seed와 assertion helper로 reproducible randomized verification을 준비합니다." },
        { lines: "12-21", explanation: "parents100 각각 children0..4와 values-10..10을 만들고 child lists를 snapshot합니다." },
        { lines: "23-32", explanation: "nested loops라는 independent oracle가 flattened values/order, long sum과 nullable max를 계산합니다." },
        { lines: "33-37", explanation: "stream flatMap/sum/Optional max와 parallel sum을 별도로 계산합니다." },
        { lines: "39-42", explanation: "values·sum·max·parallel equality를 즉시 검증합니다." },
        { lines: "43-49", explanation: "small long triples1000개에서 addition associativity와 identity0을 검사합니다." },
        { lines: "51-58", explanation: "random contents가 아닌 invariant pass와 seed 기록만 stable output으로 남깁니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fixed seed 20260713", "-Xlint:all warning0"], command: isolatedJavaRun("FlatReduceVerification.java", "FlatReduceVerification") },
      output: { value: "parents=100\nflatMatches=true\nsumMaxMatches=true\nparallelMatches=true\nadditionLawChecks=1000\nseedRecorded=true", explanation: ["100 nested parents의 values/order가 loop oracle과 같습니다.", "sum/max와 parallel sum이 독립 result와 같습니다.", "1000 law cases와 seed가 재현성을 제공합니다."] },
      experiments: [
        { change: "flatMap을 map(List::stream)으로 바꿉니다.", prediction: "Stream<Stream<Integer>> shape라 toList와 loopFlat equality compile/type 단계에서 깨집니다.", result: "shape regression을 type/test가 탐지합니다." },
        { change: "combiner/parallel sum 대신 subtraction을 사용합니다.", prediction: "parallelMatches가 실패할 수 있습니다.", result: "law test가 parallel eligibility를 결정합니다." },
        { change: "random seed를 출력/저장하지 않고 failure만 보고합니다.", prediction: "flaky counterexample 재현이 어려워집니다.", result: "seed와 shrunk input을 failure artifact로 보존합니다." },
      ],
      sourceRefs: ["java-stream-api", "java-stream-package-summary", "java-list-api", "java-optional-api", "java-random-api", "java-intstream-api", "jmh-project"],
    }],
    diagnostics: [
      { symptom: "property test가 실패했지만 같은 input을 재현할 수 없다.", likelyCause: "random seed/generator version/counterexample를 저장하지 않았습니다.", checks: ["test report seed를 확인합니다.", "global shared Random을 찾습니다.", "parallel generation order를 봅니다."], fix: "per-test fixed/reported seed와 shrunk counterexample를 artifact로 저장합니다.", prevention: "CI failure message에 seed·generator version·input summary를 의무화합니다." },
      { symptom: "stream와 loop test가 함께 같은 잘못된 결과를 낸다.", likelyCause: "expected loop가 production mapper/reducer helper를 재사용해 bug를 복제했습니다.", checks: ["oracle dependencies를 비교합니다.", "representation/algorithm이 독립적인지 봅니다.", "mutation test survivor를 확인합니다."], fix: "작은 nested loops/arrays와 hand-computed boundaries로 independent oracle을 만듭니다.", prevention: "oracle dependency review와 semantic mutation suite를 둡니다." },
    ],
    expertNotes: ["random test count1000은 proof가 아니지만 boundaries+laws+mutation과 결합하면 회귀 탐지력을 높입니다. critical algebra는 code review와 formal reasoning도 병행합니다.", "property generator가 huge nested cardinality를 만들면 test 자체가 DoS가 됩니다. size bounds와 timeout, shrink budget을 명시합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...reliabilityChapters);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "map은 source count를 항상 줄이나요?", answer: "아닙니다. mapper 하나당 result 하나라 cardinality를 유지하며 selection은 filter가 담당합니다." },
  { question: "map mapper가 null을 반환하면 element가 사라지나요?", answer: "아닙니다. null element 하나가 생기므로 null-free policy나 filter/typed result가 필요합니다." },
  { question: "flatMap에서 empty child collection은 몇 result를 만드나요?", answer: "0개를 만듭니다. parent 자체를 보존하려면 별도 projection이 필요합니다." },
  { question: "child를 펼칠 때 parent id를 왜 함께 담나요?", answer: "downstream grouping·audit·join에서 provenance를 잃지 않기 위해서입니다." },
  { question: "mapMulti는 언제 고려하나요?", answer: "mapper가 간단한 loop로0..N results를 emit하고 substream allocation을 줄일 가능성이 있을 때 측정 후 고려합니다." },
  { question: "DTO라는 이름이 mutable setter class를 뜻하나요?", answer: "아닙니다. transfer 목적을 뜻하며 mutability와 construction은 별도 contract입니다." },
  { question: "record의 List component가 자동 deep immutable인가요?", answer: "아닙니다. reference만 final이므로 List.copyOf와 immutable elements가 필요합니다." },
  { question: "entity를 response DTO로 그대로 내보내면 어떤 문제가 있나요?", answer: "sensitive/internal fields, lazy loading과 accidental mutation/persistence coupling이 생길 수 있습니다." },
  { question: "sum reduce identity0이 옳다는 것을 어떻게 확인하나요?", answer: "모든 x에 0+x=x이고 combiner와 호환됨을 확인합니다." },
  { question: "subtraction은 왜 parallel reduce에 부적합한가요?", answer: "grouping에 따라 결과가 달라지는 non-associative operation이기 때문입니다." },
  { question: "empty max를0으로 반환하면 왜 위험한가요?", answer: "0이 input에 없고 음수 domain의 실제 max보다 커서 data와 empty를 왜곡합니다." },
  { question: "int sum은 overflow를 자동으로 알리나요?", answer: "아닙니다. wrap하므로 range type 또는 addExact/BigInteger policy가 필요합니다." },
  { question: "금액에 double 대신 BigDecimal을 쓰면 끝인가요?", answer: "scale·rounding·construction·currency와 equals/compareTo 정책도 정해야 합니다." },
  { question: "mutable container를 reduce identity로 쓰면 어떤 문제가 있나요?", answer: "parallel partitions가 identity를 공유/alias하고 combiner가 중복·race를 만들 수 있어 collect가 적합합니다." },
  { question: "collect supplier는 무엇을 보장해야 하나요?", answer: "각 요청/partition에 새 owned mutable container를 반환해야 합니다." },
  { question: "sequential collect에서 combiner test가 필요한가요?", answer: "예. parallel에서 사용될 contract이므로 partial results를 lossless/associative하게 합쳐야 합니다." },
  { question: "groupingBy와 toMap keep-last는 같은가요?", answer: "아닙니다. grouping은 여러 values를 보존하고 keep-last는 이전 값을 버립니다." },
  { question: "partitioningBy result를 iteration order로 출력해도 되나요?", answer: "order를 가정하지 말고 true/false keys로 직접 접근합니다." },
  { question: "source List.sort와 stream.sorted의 차이는 무엇인가요?", answer: "List.sort는 source order를 mutate하고 stream.sorted는 result pipeline만 정렬합니다." },
  { question: "filter-before-map은 항상 더 빠른가요?", answer: "rejected projection을 줄일 수 있지만 semantic dependency와 implementation 최적화가 있어 workload로 측정합니다." },
  { question: "parse failure를 Optional.empty로만 바꾸면 무엇을 잃나요?", answer: "invalid 원인·row context·accounting과 retry/사용자 feedback을 잃습니다." },
  { question: "batch mapping에서 accounting invariant는 무엇인가요?", answer: "각 input이 success 또는 error 중 정확히 하나에 포함돼 input count=success+error가 되는 규칙입니다." },
  { question: "parallel stream에서 thread name을 golden으로 쓰면 왜 안 되나요?", answer: "worker/partition scheduling은 nondeterministic implementation/runtime state이기 때문입니다." },
  { question: "parallel stream은 async request API인가요?", answer: "아닙니다. data-parallel terminal이 caller 완료를 기다리며 timeout/cancellation/isolation은 별도 설계입니다." },
  { question: "parallel이 빨라지는 threshold는 고정값인가요?", answer: "아닙니다. source splitting, mapper cost, hardware quota와 contention에 따라 측정해야 합니다." },
  { question: "flatMap property oracle로 같은 flatMap helper를 써도 되나요?", answer: "동일 bug 복제를 피하려면 nested loop처럼 독립 algorithm/representation을 사용합니다." },
  { question: "collision이나 random test만 많이 돌리면 correctness가 증명되나요?", answer: "아닙니다. laws·boundaries·independent oracle·review와 함께 사용합니다." },
  { question: "Ex08의 stream 고객명단이 초기 insertion order와 다른 이유는 무엇인가요?", answer: "앞 collection section의 Collections.sort가 같은 list source order를 이미 변경했기 때문입니다." },
  { question: "groupingByConcurrent로 바꾸면 결과가 그대로인가요?", answer: "concurrency·order·downstream characteristics가 달라질 수 있어 contract와 tests를 다시 검토해야 합니다." },
  { question: "JMH는 correctness test를 대체하나요?", answer: "아닙니다. correctness/laws를 먼저 통과한 implementations의 performance를 비교하는 별도 도구입니다." },
);

(session.completionChecklist as string[]).push(
  "map projection이 source count와 encounter order를 유지하는 조건을 설명했다.",
  "selection은 filter, zero-to-many는 flatMap/mapMulti로 분리했다.",
  "mapper null을 filtering 의미로 사용하지 않았다.",
  "primitive numeric projection에 mapToInt/Long을 적용했다.",
  "flat row에 필요한 parent context/join key를 보존했다.",
  "empty child와 null child schema를 구분했다.",
  "flatMap resource-backed substream ownership을 검토했다.",
  "mapMulti와 flatMap을 readability·allocation 측정으로 비교했다.",
  "DTO transfer 목적과 mutability 선택을 분리했다.",
  "VO에 value equality·invariants·normalization을 정의했다.",
  "record components의 shallow immutability caveat를 점검했다.",
  "nested mutable fields를 immutable values로 재귀 snapshot했다.",
  "entity를 response projection에 직접 노출하지 않았다.",
  "reduce identity law를 arbitrary values와 empty input으로 검증했다.",
  "max/min에 fake0 identity를 사용하지 않았다.",
  "associativity와 commutativity를 구분했다.",
  "subtraction·pair average를 parallel reduction에서 제외했다.",
  "String joining의 delimiter/empty policy를 명시했다.",
  "int/long aggregation의 overflow upper bound를 계산했다.",
  "checked arithmetic 또는 wider/arbitrary precision policy를 선택했다.",
  "money에 BigDecimal construction·scale·rounding·currency를 명시했다.",
  "empty summary statistics sentinel을 domain result로 노출하지 않았다.",
  "immutable aggregate에는 reduce, mutable container에는 collect를 사용했다.",
  "collect supplier가 매번 fresh container를 반환한다.",
  "accumulator와 combiner가 모든 state fields를 보존한다.",
  "custom Collector characteristics를 실제 semantics보다 넓게 선언하지 않았다.",
  "sequential/parallel collect 결과를 independent oracle과 비교했다.",
  "grouping classifier의 normalization/null/cardinality policy를 정의했다.",
  "downstream collector가 필요한 value shape를 직접 만든다.",
  "group result order가 필요하면 explicit Map supplier를 사용했다.",
  "partition true/false를 key로 직접 읽었다.",
  "source List mutation과 stream sorted result를 분리했다.",
  "sort label·direction·comparator·tie-breaker를 한 specification으로 묶었다.",
  "ordered terminal과 parallel forEach의 차이를 검증했다.",
  "parse blank·invalid·range·infrastructure failures를 구분했다.",
  "success/error typed result로 input accounting을 보존했다.",
  "error context에 raw secret/PII를 노출하지 않았다.",
  "broad catch로 programming failure를 data error로 숨기지 않았다.",
  "parallel 전 identity·associativity·non-interference를 증명했다.",
  "common pool blocking/contention과 server core quota를 검토했다.",
  "parallel golden에서 thread·partition·timing을 제외했다.",
  "JMH로 size/work cost crossover와 end-to-end latency를 측정한다.",
  "nested loop independent flatten oracle을 작성했다.",
  "empty/single/duplicate/negative/large nested fixtures를 포함했다.",
  "fixed seed·generator version·counterexample를 failure artifact로 남긴다.",
  "semantic mutation으로 flatMap/reduce/combiner/order/error tests를 점검한다.",
  "walkthrough line bounds와 sourceRefs used/known을 자동 검증한다.",
  "public prose·code·output privacy scan과 official URL validation을 수행한다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-forkjoinpool-api", repository: "Java SE 21 API", path: "java.util.concurrent.ForkJoinPool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html", usedFor: ["common pool", "work stealing", "blocking caveat"], evidence: "parallel execution pool cost model 근거입니다." },
  { id: "java-spliterator-api", repository: "Java SE 21 API", path: "java.util.Spliterator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Spliterator.html", usedFor: ["source splitting", "characteristics", "size"], evidence: "parallel source partition semantics 근거입니다." },
  { id: "java-base-stream-api", repository: "Java SE 21 API", path: "java.util.stream.BaseStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/BaseStream.html", usedFor: ["parallel/unordered flags", "close"], evidence: "stream execution mode/lifecycle 근거입니다." },
  { id: "jmh-project", repository: "OpenJDK JMH", path: "JMH", publicUrl: "https://openjdk.org/projects/code-tools/jmh/", usedFor: ["sequential parallel benchmark", "warmup fork profiler"], evidence: "reliable microbenchmark workflow 근거입니다." },
  { id: "java-random-api", repository: "Java SE 21 API", path: "java.util.Random", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html", usedFor: ["fixed-seed nested generator", "law cases"], evidence: "reproducible property input 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "projection·flattening·DTO value snapshot·reduction laws·numeric policy·mutable collect·downstream aggregation·source mutation·error channel·parallel cost·property verification까지12 chapters로 확장했습니다.",
  "synthetic Java examples11은 OpenJDK21 -proc:none -Xlint:all compiler output0와 exact stable stdout을 요구합니다.",
  "parallel examples는 worker/partition/thread/timing을 golden에서 제외하고 associative value와 independent oracle만 검증합니다.",
  "원본의 mutable DTO, leading delimiter, fake max identity0와 label/comparator mismatch는 먼저 보존한 뒤 개선 예제로 분리했습니다.",
);
