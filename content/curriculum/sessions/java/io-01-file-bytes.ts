import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["io-01-file-bytes"],
  slug: "io-01-file-bytes",
  courseId: "java",
  moduleId: "java-systems",
  order: 30,
  title: "File·Path와 바이트 스트림",
  subtitle: "경로의 의미부터 EOF·open mode·자원 소유권·무결성까지 안전한 파일 I/O 경계를 세웁니다.",
  level: "중급",
  estimatedMinutes: 1080,
  coreQuestion: "파일 이름이라는 외부 입력을 실제 filesystem object와 byte sequence로 바꿀 때 어느 기준 경로, 생성·덮어쓰기 정책, EOF·부분 읽기 규칙과 정리 책임을 명시해야 데이터 손실과 경로 이탈을 막을 수 있을까요?",
  summary: "원래 인벤토리는 class14의 Ex01_FileClass·Ex02_FileOutputStream·Ex04_FileInputStream 세 파일이지만 실제 package에는 buffered byte I/O, binary copy, writer/reader와 character copy까지9 files가 있습니다. package9와 inventory3을 원본 그대로 OpenJDK21 warning0 compile하고 main roles9/3을 확인합니다. 세 인벤토리 원본에는 machine-specific absolute path literals8개가 있으므로 공개 과정에서는 원본 위치를 실행하지 않습니다. exact literals만 소유한 공백 포함 temp fixture로 치환한 source copies3을 다시 warning0 compile해 Ex01의 생성·삭제 결과5줄, Ex02의 UTF-8 exact34 bytes와 stdout0, Ex04의 byte별 출력·EOF를 baseline/hostile launcher modes에서 검증합니다. 이후 legacy File을 modern Path/Files로 연결하고 path identity·metadata/link policy, unsigned byte와 EOF, create/truncate/append, try-with-resources와 suppressed failure, charset boundary, 실패 분류, traversal containment, partial read, hash integrity와 portable test matrix까지 확장합니다.",
  objectives: [
    "relative·absolute·normalized·real path의 차이와 working directory 기준을 실행 결과로 구분한다.",
    "File과 Path/Files의 metadata·link-following·TOCTOU 한계를 알고 필요한 contract를 선택한다.",
    "InputStream.read의0..255·-1 계약과 부분 읽기를 손실 없는 byte copy loop로 구현한다.",
    "CREATE_NEW·TRUNCATE_EXISTING·APPEND 등 open options를 데이터 수명 정책과 연결한다.",
    "try-with-resources의 역순 close·primary/suppressed exception을 관찰해 ownership을 설계한다.",
    "byte/text 경계에서 charset을 명시하고 경로 traversal·symlink escape를 별도 검증한다.",
    "empty·missing·boundary-size·partial-read·integrity fixtures로 deterministic I/O 검증표를 만든다.",
  ],
  prerequisites: [
    { title: "finally·throws와 자원 정리", reason: "I/O failure와 close failure를 함께 보존하려면 exception propagation과 finally의 한계를 알아야 합니다.", sessionSlug: "core-03-finally-throws" },
    { title: "Stream과 외부 자원", reason: "Files.lines 같은 resource-backed Stream과 byte stream은 같은 ownership 질문을 공유하지만 element stream과 I/O stream은 다른 abstraction입니다.", sessionSlug: "core-08-stream" },
  ],
  keywords: ["File", "Path", "Files", "filesystem", "working directory", "normalize", "toRealPath", "InputStream", "OutputStream", "FileInputStream", "FileOutputStream", "EOF", "unsigned byte", "partial read", "StandardOpenOption", "CREATE_NEW", "APPEND", "try-with-resources", "suppressed exception", "charset", "path traversal", "symlink", "SHA-256", "TOCTOU"],
  chapters: [
    {
      id: "class14-package9-inventory3-relocated-audit",
      title: "class14 package9·inventory3과 temp-relocated 원본3을 warning0·exact bytes로 감사합니다",
      lead: "원본의 절대 경로8개를 실제 사용자 filesystem에서 실행하지 않고, exact source literal만 감사 소유 temp fixture로 치환해 API 호출·분기·byte payload는 그대로 보존합니다.",
      explanations: [
        "class14에는 Ex01부터 Ex09까지 모두 public main이 있는9 files가 있습니다. io-01 inventory는 File 생성/삭제 Ex01, raw FileOutputStream Ex02, raw FileInputStream Ex04의3 files이며 Ex03·05·06은 io-02, Ex07·08·09는 io-03으로 인계합니다.",
        "package9와 inventory3은 원본 source paths를 직접 javac에 넘겨 UTF-8, --release21, -proc:none, -g:source,lines, -Xlint:all, -XDrawDiagnostics로 compile합니다. exit0뿐 아니라 stdout·stderr 모두0이어야 warning0 evidence입니다.",
        "원본 Ex01에는 new File6, createNewFile1, mkdirs1, delete4와 절대 경로 literals6이 있습니다. 깨끗한 fixture에서 생성 성공, 중간 parent 삭제 실패, file 삭제 성공, leaf와 parent 삭제 성공을 합쳐 exact5 lines가 나옵니다.",
        "원본 Ex02는 FileOutputStream constructor1, write12, default-charset getBytes1과 path literal1을 가집니다. child JVM을 UTF-8로 고정하면 java·CR·Hello·CR·Hi·한글·숫자·Bye payload는 exact34 bytes이고 stdout은 없습니다.",
        "원본 Ex04는 FileInputStream constructor1, active read1과 path literal1을 가집니다. read()가 반환한 byte value마다 char cast 후 println하므로 한글 UTF-8 bytes는 올바른 글자 단위가 아니라 byte별 code point로 보입니다. 감사는 이 결함을 고치지 않고 exact byte-derived stdout을 비교합니다.",
        "relocation은 arbitrary source rewrite가 아닙니다. 알려진 Java string literal4종의 존재를 먼저 확인하고 감사 root 아래 temp absolute paths로 치환하며, 원본 literals가0개 남았는지 검사합니다. 원본 API calls와 payload는 바꾸지 않습니다.",
        "baseline과 hostile modes는 JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS를 다르게 설정하지만 모든 child process에서 네 변수를 제거합니다. 환경 주입으로 compiler/runtime behavior가 바뀌지 않아야 합니다.",
        "process helper는 ArgumentList, UTF-8 async stdout/stderr drain, closed stdin, timeout10s, descendant tree kill, grace5s와 Dispose를 사용합니다. redirected streams를 순차로 다 읽으면 pipe가 차서 deadlock될 수 있어 두 drain을 먼저 시작합니다.",
        "outer finally는 launcher variable별 원상복구 검증, temp direct-child boundary 검사와 body error를 독립적으로 보존합니다. cleanup 실패가 원래 compile/output failure를 덮지 않도록 AggregateException을 만듭니다.",
      ],
      concepts: [
        { term: "controlled relocation", definition: "외부 상태를 건드리는 원본의 알려진 location literals만 소유 temp fixture로 바꿔 behavior를 재현하는 감사 방식입니다.", detail: ["원본과 치환본을 모두 compile합니다.", "치환 전후 literal count와 API shape를 검증합니다."] },
        { term: "byte oracle", definition: "문자 모양이 아니라 예상 byte sequence를 독립적으로 계산해 파일 contents와 reader output을 비교하는 기준입니다.", detail: ["UTF-8 bytes34를 비교합니다.", "EOF 뒤 추가 byte가 없음을 확인합니다."] },
        { term: "ownership boundary", definition: "감사가 만들고 삭제할 수 있다고 증명한 direct-child temp tree 경계입니다.", detail: ["충돌 시 기존 경로를 삭제하지 않습니다.", "parent directory equality를 cleanup 전에 확인합니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-io01-audit",
        title: "원본 package/inventory compile과 temp-relocated create·write·read를 두 launcher modes에서 검증합니다",
        language: "powershell",
        filename: "verify-original-io01.ps1",
        purpose: "machine-specific paths나 사용자 파일을 공개·변경하지 않으면서 class14 원본 API shape, exact output과 bytes를 보존합니다.",
        code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference = 'Stop'
$optionNames = @('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved = @{}
foreach ($name in $optionNames) {
  $item = Get-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
  $saved[$name] = @{ Exists = $null -ne $item; Value = if ($item) { $item.Value } else { $null } }
}
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("io01 audit " + [Guid]::NewGuid().ToString('N'))
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
  $result = Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,("com.java.class14." + $main)) $root
  if ($result.Exit -ne 0 -or $result.Err.Length -ne 0) { throw "$main process drift" }
  return $result.Out
}
function Remove-JavaComments([string]$text) {
  $withoutBlocks = [regex]::Replace($text, '(?s)/\*.*?\*/', '')
  return [regex]::Replace($withoutBlocks, '(?m)//.*$', '')
}
function Java-Literal([string]$path) { return $path.Replace('\','\\') }
function Write-Relocated([IO.FileInfo]$file, [string]$destination, [hashtable]$replacements) {
  $text = [IO.File]::ReadAllText($file.FullName)
  foreach ($entry in @($replacements.GetEnumerator() | Sort-Object { $_.Key.Length } -Descending)) {
    if (-not $text.Contains($entry.Key)) { throw "relocation literal missing: $($entry.Key)" }
    $replacementPath = [IO.Path]::GetFullPath($entry.Value)
    $rootPrefix = [IO.Path]::GetFullPath($root).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $replacementPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'replacement outside audit root' }
    $text = $text.Replace($entry.Key, (Java-Literal $entry.Value))
    if ($text.Contains($entry.Key)) { throw "relocation literal survived: $($entry.Key)" }
  }
  [IO.File]::WriteAllText($destination, $text, [Text.UTF8Encoding]::new($false))
}
function Audit([string]$mode, [string]$classDir) {
  if ($mode -eq 'hostile') {
    $env:JDK_JAVAC_OPTIONS = '-J-Dio01.audit=javac'
    $env:JDK_JAVA_OPTIONS = '-Dio01.audit=java'
    $env:JAVA_TOOL_OPTIONS = '-Dio01.audit=tool'
    $env:_JAVA_OPTIONS = '-Dio01.audit=legacy'
  } else { foreach ($name in $optionNames) { Remove-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue } }
  $all = @(Get-ChildItem -LiteralPath $classDir -Filter '*.java' | Sort-Object Name)
  $inventoryNames = @('Ex01_FileClass.java','Ex02_FileOutputStream.java','Ex04_FileInputStream.java')
  $inventory = @($inventoryNames | ForEach-Object { Get-Item -LiteralPath (Join-Path $classDir $_) })
  if ($all.Count -ne 9 -or $inventory.Count -ne 3) { throw 'source inventory drift' }
  $packageClasses = Join-Path $root ("package-" + $mode)
  $inventoryClasses = Join-Path $root ("inventory-" + $mode)
  Compile $all $packageClasses; Compile $inventory $inventoryClasses
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { ([IO.File]::ReadAllText($_.FullName)) -match $mainPattern }).Count
  $inventoryMains = @($inventory | Where-Object { ([IO.File]::ReadAllText($_.FullName)) -match $mainPattern }).Count
  if ($packageMains -ne 9 -or $inventoryMains -ne 3) { throw 'main role drift' }

  $fixture = Join-Path $root ("fixture-" + $mode)
  $sourceCopy = Join-Path $root ("source-" + $mode)
  New-Item -ItemType Directory -Path $fixture,$sourceCopy -ErrorAction Stop | Out-Null
  $exam = Join-Path $fixture 'exam01.txt'
  $leaf = Join-Path $fixture 'kkk/yyy'
  $parent = Join-Path $fixture 'kkk'
  $bytesFile = Join-Path $fixture 'test01.txt'
  Write-Relocated $inventory[0] (Join-Path $sourceCopy $inventory[0].Name) @{
    'D:\\util\\exam01.txt' = $exam; 'D:\\util\\kkk\\yyy' = $leaf; 'D:\\util\\kkk' = $parent
  }
  foreach ($index in 1,2) {
    Write-Relocated $inventory[$index] (Join-Path $sourceCopy $inventory[$index].Name) @{ 'D:\\util\\test01.txt' = $bytesFile }
  }
  $relocated = @(Get-ChildItem -LiteralPath $sourceCopy -Filter '*.java' | Sort-Object Name)
  $relocatedClasses = Join-Path $root ("relocated-" + $mode)
  Compile $relocated $relocatedClasses

  $ex01 = Run $relocatedClasses 'Ex01_FileClass'
  $expected01 = (@('파일 생성 성공','디렉토리 생성 성공','디렉토리 삭제 실패','파일 삭제 성공','디렉토리 삭제 성공') -join $nl) + $nl
  if ($ex01 -cne $expected01) { throw 'Ex01 output drift' }
  $ex02 = Run $relocatedClasses 'Ex02_FileOutputStream'
  if ($ex02.Length -ne 0) { throw 'Ex02 stdout drift' }
  $expectedBytes = [Text.Encoding]::UTF8.GetBytes(("java" + [char]13 + "Hello" + [char]13 + "Hi~~~" + [char]10 + "안녕" + [char]10 + "123" + [char]10 + "Bye~~~"))
  $actualBytes = [IO.File]::ReadAllBytes($bytesFile)
  if ([Convert]::ToHexString($actualBytes) -cne [Convert]::ToHexString($expectedBytes) -or $actualBytes.Length -ne 34) { throw 'Ex02 byte drift' }
  $expectedRead = [Text.StringBuilder]::new()
  foreach ($byte in $expectedBytes) { [void]$expectedRead.Append([char]$byte).Append($nl) }
  if ((Run $relocatedClasses 'Ex04_FileInputStream') -cne $expectedRead.ToString()) { throw 'Ex04 byte output or EOF drift' }

  $active = @{}
  foreach ($file in $inventory) { $active[$file.Name] = Remove-JavaComments ([IO.File]::ReadAllText($file.FullName)) }
  $shape = @{
    file = ([regex]::Matches(($active.Values -join $nl), 'new\s+File\s*\(')).Count
    create = ([regex]::Matches($active['Ex01_FileClass.java'], '\.createNewFile\s*\(')).Count
    mkdirs = ([regex]::Matches($active['Ex01_FileClass.java'], '\.mkdirs\s*\(')).Count
    delete = ([regex]::Matches($active['Ex01_FileClass.java'], '\.delete\s*\(')).Count
    fos = ([regex]::Matches($active['Ex02_FileOutputStream.java'], 'new\s+FileOutputStream\s*\(')).Count
    write = ([regex]::Matches($active['Ex02_FileOutputStream.java'], '\.write\s*\(')).Count
    getBytes = ([regex]::Matches($active['Ex02_FileOutputStream.java'], '\.getBytes\s*\(')).Count
    fis = ([regex]::Matches($active['Ex04_FileInputStream.java'], 'new\s+FileInputStream\s*\(')).Count
    read = ([regex]::Matches($active['Ex04_FileInputStream.java'], '\.read\s*\(')).Count
    paths = ([regex]::Matches(($active.Values -join $nl), '[A-Za-z]:\\\\')).Count
  }
  if ($shape.file -ne 8 -or $shape.create -ne 1 -or $shape.mkdirs -ne 1 -or $shape.delete -ne 4 -or $shape.fos -ne 1 -or $shape.write -ne 12 -or $shape.getBytes -ne 1 -or $shape.fis -ne 1 -or $shape.read -ne 1 -or $shape.paths -ne 8) { throw 'source shape drift' }
  return "package=9|inventory=3|relocated=3|mains=$packageMains,$inventoryMains,3|compiler=0;outputs=Ex01:5|Ex02:0|Ex04:34bytes;shapes=File:8|create:1|mkdirs:1|delete:4|fos:1|write:12|getBytes:1|fis:1|read:1;paths=8->temp"
}

try {
  if (Test-Path -LiteralPath $root) { throw 'unexpected temp collision' }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $ownsRoot = $true
  $classDir = Join-Path ([IO.Path]::GetFullPath($SourceRoot)) 'src/com/java/class14'
  $baseline = Audit 'baseline' $classDir
  $hostile = Audit 'hostile' $classDir
  if ($baseline -cne $hostile) { throw 'baseline hostile drift' }
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline"
  'privacy=original-paths:not-run|fixture:owned-temp;launcherOptions=4'
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
          { lines: "1-14", explanation: "source root, launcher variables와 공백 temp direct-child ownership/error state를 mutation 전에 준비합니다." },
          { lines: "15-72", explanation: "UTF-8 concurrent drain·closed stdin·timeout·tree kill·grace·Dispose를 가진 compile/run과 bounded relocation helpers를 정의합니다." },
          { lines: "73-90", explanation: "package9·inventory3을 원본 그대로 warning0 compile하고 public mains9/3을 확인합니다." },
          { lines: "92-107", explanation: "mode별 owned fixture/source copies를 만들고 known path strings만 temp paths로 바꿔 relocated3을 compile합니다." },
          { lines: "109-119", explanation: "Ex01 exact5 lines, Ex02 stdout0·UTF-8 bytes34와 Ex04 byte-derived output/EOF를 검증합니다." },
          { lines: "121-136", explanation: "comments 제거 active API shapes와 original absolute literals8을 검사해 relocation이 behavior를 숨기지 않게 합니다." },
          { lines: "139-174", explanation: "두 modes 결과를 비교하고 variable별 restore·bounded temp cleanup·failure aggregation을 수행합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy2/classstudy source root", "baseline+hostile launcher modes", "timeout10s+grace5s"], command: "pwsh -NoProfile -File verify-original-io01.ps1 -SourceRoot <classstudy-root>" },
        output: { value: "spacePath=True,modes=2|same=True,package=9|inventory=3|relocated=3|mains=9,3,3|compiler=0;outputs=Ex01:5|Ex02:0|Ex04:34bytes;shapes=File:8|create:1|mkdirs:1|delete:4|fos:1|write:12|getBytes:1|fis:1|read:1;paths=8->temp\nprivacy=original-paths:not-run|fixture:owned-temp;launcherOptions=4", explanation: ["원본 package/inventory와 relocated copies가 모두 warning0입니다.", "create/write/read 결과가 두 modes에서 exact하게 같습니다.", "원래 absolute locations는 실행·출력하지 않고 owned temp만 변경합니다."] },
        experiments: [
          { change: "fixture를 mode 사이에 공유하고 Ex01의 마지막 parent 삭제를 제거합니다.", prediction: "hostile mode mkdirs가 false가 되어 exact output이 달라집니다.", result: "case마다 clean fixture가 필요한 stateful I/O 특성이 드러납니다." },
          { change: "Ex02 getBytes에 UTF-8 JVM 고정을 제거합니다.", prediction: "default charset이 다른 runtime에서 byte count/hash가 달라질 수 있습니다.", result: "byte protocol 경계에서 charset을 명시해야 합니다." },
          { change: "Ex04 loop의 -1 check 뒤가 아니라 char cast 후 EOF를 출력합니다.", prediction: "U+FFFF 또는 잘못된 추가 line이 생겨 byte-derived oracle이 실패합니다.", result: "EOF는 data byte가 아닌 sentinel입니다." },
        ],
        sourceRefs: ["java-class14-ex01", "java-class14-ex02", "java-class14-ex03", "java-class14-ex04", "java-class14-ex05", "java-class14-ex06", "java-class14-ex07", "java-class14-ex08", "java-class14-ex09", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "원본 실행이 사용자 drive에 파일이나 directory를 만들고 지운다.", likelyCause: "machine-specific absolute path를 검토 없이 실행했습니다.", checks: ["active string literals를 scan합니다.", "create/delete/write calls를 inventory합니다.", "path가 감사 ownership boundary인지 확인합니다."], fix: "원본은 compile하고 exact known literals만 fresh owned temp로 치환한 copy를 실행합니다.", prevention: "source path inventory·public privacy scan·temp parent verification을 gate로 둡니다." },
        { symptom: "Ex04 출력에서 한글이 여러 이상한 문자로 갈라진다.", likelyCause: "UTF-8 multi-byte sequence를 FileInputStream.read 한 byte씩 char로 cast했습니다.", checks: ["원본 file bytes를 hex로 봅니다.", "read return0..255와 EOF를 기록합니다.", "byte count와 printed line count를 비교합니다."], fix: "io-01에서는 byte behavior를 보존하고, text decoding은 io-03에서 InputStreamReader와 explicit charset으로 수행합니다.", prevention: "binary/text data classification과 charset boundary를 설계 문서에 둡니다." },
      ],
      expertNotes: ["controlled relocation도 변환입니다. 따라서 원본 compile, active shape/literal counts, transformed compile과 exact runtime evidence를 함께 남겨야 provenance가 유지됩니다.", "File.createNewFile 뒤 delete 같은 check-then-act demo는 교육용 state transition입니다. 실제 security boundary는 atomic Files.createFile/CREATE_NEW와 directory permissions를 결합합니다."],
    },
  ],
  lab: {
    title: "업로드 byte artifact를 sandbox에 원자적으로 저장하고 hash로 검증하는 파일 경계",
    scenario: "신뢰할 수 없는 상대 파일명과 byte stream을 받아 허용 root 안의 임시 파일에 저장하고, 제한 크기·SHA-256·충돌 정책을 확인한 뒤 최종 이름으로 전환합니다.",
    setup: ["테스트마다 fresh temporary root를 만들고 ownership을 기록합니다.", "empty·1byte·buffer-1·buffer·buffer+1·large deterministic payload를 준비합니다.", "normal·traversal·existing target·missing parent·partial-read fixtures를 준비합니다."],
    steps: ["사용자 이름을 단일 filename/허용 extension으로 parse하고 root.resolve(...).normalize containment를 확인합니다.", "CREATE_NEW 임시 target을 열어 덮어쓰기를 방지합니다.", "InputStream을 bounded byte[] chunks로 읽고 actual count만 쓰며 total limit를 검사합니다.", "write와 동시에 SHA-256을 갱신하고 expected digest가 있으면 constant-time 비교합니다.", "close가 완료된 뒤 파일 길이와 digest를 다시 검증합니다.", "같은 filesystem 안에서 atomic move를 시도하고 지원되지 않으면 명시된 fallback을 적용합니다.", "성공 전 failure에서는 owned temp만 삭제하고 기존 target은 보존합니다.", "모든 error는 사용자 메시지와 internal path/cause log를 분리합니다."],
    expectedResult: ["root 밖 traversal이 write 전에 거부됩니다.", "existing target은 조용히 truncate되지 않습니다.", "partial read에서도 payload length와 hash가 같습니다.", "body/close/cleanup failures가 원인 손실 없이 기록됩니다.", "공개 output에는 실제 host path·사용자명·파일 contents가 없습니다."],
    cleanup: ["검증된 direct-child temp artifacts만 역순 삭제합니다.", "cleanup failure를 원래 failure와 함께 보존합니다."],
    extensions: ["quota와 per-tenant directory isolation을 추가합니다.", "FileChannel.force와 durability requirement를 측정합니다.", "object storage multipart upload·checksum·idempotency로 같은 contract를 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "relative Path를 working directory 기준 absolute normalized Path로 바꾸고 각 단계 값을 설명합니다.", requirements: ["상대 path literal을 사용합니다.", "isAbsolute·normalize·toAbsolutePath를 각각 관찰합니다.", "파일 생성 전 toRealPath failure를 분류합니다.", "host absolute path는 golden에 넣지 않습니다."], hints: ["absolute 문자열 대신 startsWith(cwd) boolean을 출력합니다.", "normalize는 filesystem 접근이 아닙니다."], expectedOutcome: "lexical path 변환과 existing-object canonicalization을 구분합니다.", solutionOutline: ["raw/normalized/absolute를 별도 변수로 둡니다.", "existence 전후 toRealPath를 비교합니다.", "semantic booleans만 검증합니다."] },
    { difficulty: "응용", prompt: "InputStream이 요청 buffer보다 적게 반환해도 모든 bytes를 복사하는 loop를 작성합니다.", requirements: ["read==-1만 EOF로 처리합니다.", "write(buffer,0,count)를 사용합니다.", "empty·1·2·buffer±1 sizes를 검증합니다.", "source와 target hash를 비교합니다."], hints: ["한 번의 read가 buffer를 채운다고 가정하지 않습니다.", "0 반환 contract도 source type에 따라 검토합니다."], expectedOutcome: "부분 읽기와 마지막 짧은 block에서 data 손실·잔여 byte 오염이 없습니다.", solutionOutline: ["adversarial short-read InputStream을 만듭니다.", "count만큼 write합니다.", "length/hash oracle과 비교합니다."] },
    { difficulty: "설계", prompt: "untrusted filename과 stream을 안전한 저장소에 넣는 production-grade API contract를 설계합니다.", requirements: ["containment와 symlink policy를 분리합니다.", "CREATE_NEW·size limit·hash·cleanup·atomic publish를 명시합니다.", "existing target과 retry/idempotency 정책을 정합니다.", "path/PII-safe logging과 metrics를 설계합니다.", "Windows/Linux permission·case·separator matrix를 포함합니다."], hints: ["normalize+startsWith만으로 symlink race가 해결되지는 않습니다.", "validate와 use 사이 filesystem mutation을 위협 모델에 넣습니다."], expectedOutcome: "경로 이탈·덮어쓰기·부분 파일·정보 노출을 명시적으로 차단하는 저장 경계가 됩니다.", solutionOutline: ["trusted root handle과 parsed filename을 분리합니다.", "owned temp→verify→publish state machine을 만듭니다.", "failure/cleanup test matrix를 작성합니다."] },
  ],
  reviewQuestions: [
    { question: "File과 Path의 가장 중요한 차이는 무엇인가요?", answer: "둘 다 경로를 표현하지만 Path/Files는 modern filesystem operations, options·attributes·links·exceptions를 더 명시적으로 다룹니다. File object가 존재를 보장하지는 않습니다." },
    { question: "상대 경로는 source file 위치 기준인가요?", answer: "아닙니다. 보통 JVM process working directory 기준이며 IDE·test·service launcher에 따라 달라질 수 있습니다." },
    { question: "normalize가 symlink와 실제 파일을 확인하나요?", answer: "아닙니다. dot segments를 lexical하게 정리할 뿐 filesystem을 읽지 않습니다." },
    { question: "InputStream.read()가 byte를 반환하면서 왜 int인가요?", answer: "data0..255와 EOF sentinel -1을 동시에 표현해야 하기 때문입니다." },
    { question: "read()==0이면 EOF인가요?", answer: "아닙니다. EOF는 -1입니다. blocking file input의 positive-length read는 보통 positive count나-1이지만 일반 InputStream contract/source 특성을 확인합니다." },
    { question: "FileOutputStream 기본 생성자는 기존 파일에 append하나요?", answer: "아닙니다. append flag가 false인 생성자는 보통 기존 내용을 truncate하고 새로 씁니다." },
    { question: "flush와 close는 같은가요?", answer: "close는 resource를 닫으며 output을 flush하지만, flush는 stream을 계속 쓸 수 있게 둡니다. 둘 다 storage durability를 자동 보장하지는 않습니다." },
    { question: "try-with-resources에서 여러 resource는 어떤 순서로 닫히나요?", answer: "선언의 역순으로 닫히며 body/initialization의 primary exception에 close exceptions가 suppressed로 붙을 수 있습니다." },
    { question: "getBytes() 인자 생략은 왜 위험한가요?", answer: "runtime default charset에 따라 같은 text가 다른 bytes가 되어 protocol·hash·round-trip이 달라질 수 있습니다." },
    { question: "root.resolve(user).normalize().startsWith(root)면 traversal이 완전히 해결되나요?", answer: "lexical .. 이탈은 막지만 symlink·junction·case/alias·validate-use race는 별도 trusted-root policy와 filesystem-aware 검증이 필요합니다." },
  ],
  completionChecklist: [
    "class14 package9와 inventory3을 원본 그대로 warning0 compile했다.",
    "package/inventory public mains9/3을 확인했다.",
    "absolute path literals8과 active File/I/O API shapes를 확인했다.",
    "원본 locations는 실행하지 않고 exact literals만 owned temp로 치환했다.",
    "relocated3을 warning0 compile하고 Ex01 exact5 lines를 검증했다.",
    "Ex02 stdout0과 UTF-8 exact34 bytes를 검증했다.",
    "Ex04 stdout을 expected bytes와 EOF에서 독립 계산했다.",
    "baseline/hostile launcher4 child isolation과 restore를 검증했다.",
    "async drain·closed stdin·timeout·tree kill·grace·Dispose를 적용했다.",
    "temp direct-child ownership과 cleanup failure aggregation을 적용했다.",
    "relative path 기준을 working directory와 함께 문서화했다.",
    "모든 synthetic Java examples를 JDK21 warning0·exact output으로 검증한다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class14-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex01_FileClass.java", usedFor: ["File create/delete", "mkdirs", "exact5"], evidence: "new File6·create1·mkdirs1·delete4·path literals6과 relocated exact5 lines입니다." },
    { id: "java-class14-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex02_FileOutputStream.java", usedFor: ["byte writes", "default charset caveat", "exact34 bytes"], evidence: "FileOutputStream1·write12·getBytes1과 relocated UTF-8 payload34 bytes입니다." },
    { id: "java-class14-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex03_BufferedOutputStream.java", usedFor: ["package compile", "io-02 handoff"], evidence: "package warning0에 포함하고 buffered output은 다음 세션으로 분리했습니다." },
    { id: "java-class14-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex04_FileInputStream.java", usedFor: ["read EOF", "byte char cast", "exact byte output"], evidence: "FileInputStream1·active read1·path literal1과 byte-derived stdout을 확인했습니다." },
    { id: "java-class14-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex05_BufferedInputStream.java", usedFor: ["package compile", "io-02 handoff"], evidence: "package warning0에 포함하고 buffered input은 다음 세션으로 분리했습니다." },
    { id: "java-class14-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex06_FileCopy.java", usedFor: ["package compile", "binary copy handoff"], evidence: "package warning0에 포함하고 one-byte buffered copy는 io-02에서 감사합니다." },
    { id: "java-class14-ex07", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex07_FileWriter.java", usedFor: ["package compile", "io-03 handoff"], evidence: "package warning0에 포함하고 character writer는 io-03으로 분리했습니다." },
    { id: "java-class14-ex08", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex08_FileReader.java", usedFor: ["package compile", "io-03 handoff"], evidence: "package warning0에 포함하고 line reader는 io-03으로 분리했습니다." },
    { id: "java-class14-ex09", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex09_FileCopy.java", usedFor: ["package compile", "text copy handoff"], evidence: "package warning0에 포함하고 newline-changing character copy는 io-03으로 분리했습니다." },
    { id: "jdk21-javac", repository: "Java SE 21 tools", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-proc:none", "-Xlint:all", "-XDrawDiagnostics"], evidence: "positive compiler output0 contract입니다." },
    { id: "powershell-environment", repository: "Microsoft PowerShell docs", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "per-variable restore"], evidence: "process environment mutation/restore 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected streams", "working directory"], evidence: "fresh child construction 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["launcher isolation"], evidence: "child-specific option removal 근거입니다." },
    { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "grace", "Dispose"], evidence: "bounded process lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["stdout/stderr drain"], evidence: "redirected pipe concurrent drain 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 9,
    filesUsed: 9,
    uncoveredFiles: [],
    uncoveredNotes: [
      "inventory3뿐 아니라 class14 package9를 모두 읽고 compile해 다음 I/O sessions와 경계를 확인했습니다.",
      "machine-specific absolute values와 host directory contents는 공개 source/evidence에 복사하지 않았습니다.",
      "원본의 default charset·null-unsafe close·byte-to-char cast는 숨기지 않고 보완 chapters에서 modern alternatives로 분리합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const pathByteChapters: DetailedSession["chapters"] = [
  {
    id: "relative-absolute-normalized-real-path",
    title: "relative·absolute·normalized·real path를 서로 다른 연산으로 추적합니다",
    lead: "Path 문자열은 아직 파일이 아닙니다. 어떤 process working directory에서 해석했는지와 lexical normalization, existing filesystem object의 real identity를 단계별로 분리합니다.",
    explanations: [
      "Path.of(\"a/b\")는 platform filesystem의 상대 Path value를 만들 뿐 open·existence check를 하지 않습니다. 같은 source code라도 service launcher·IDE·test runner의 working directory가 다르면 다른 object를 가리킵니다.",
      "Path.of(\"\")의 absolute normalized form을 실행 기준 cwd로 캡처할 수 있습니다. 하지만 cwd의 host-specific 문자열을 golden output이나 공개 log에 넣지 말고 candidate가 cwd 아래인지 같은 semantic relation을 검증합니다.",
      "resolve는 base와 child를 결합합니다. child가 absolute면 provider contract상 base가 무시될 수 있으므로 untrusted input을 resolve하기 전에 absolute·root·name count와 허용 grammar를 검사해야 합니다.",
      "normalize는 .과 가능한 .. segments를 lexical하게 제거합니다. 파일 존재·case alias·symbolic link·junction을 확인하지 않으므로 canonicalization이나 sandbox security proof와 같지 않습니다.",
      "toAbsolutePath는 relative path를 default directory에 결합하지만 object를 만들지 않습니다. process property가 신뢰 경계 중간에 바뀌지 않는다는 가정과 provider-specific behavior도 고려합니다.",
      "toRealPath는 path가 존재해야 하고 symbolic links를 기본적으로 따라 실제 path를 구합니다. NOFOLLOW_LINKS를 주면 마지막/구성 요소 link 처리 의미가 달라지므로 link policy를 API contract에 적습니다.",
      "getFileName·getParent·getRoot·iterator는 path structure를 다룹니다. 문자열 split('\\') 같은 OS 고정 parsing은 separator·UNC·drive·provider 차이를 깨뜨립니다.",
      "public error에는 사용자가 수정할 수 있는 logical name과 error category를 주고 absolute host path는 internal restricted log에서만 필요 최소한으로 남깁니다. exception.getMessage를 그대로 client에 내보내지 않습니다.",
      "테스트는 host path exact string 대신 isAbsolute, filename, containment boolean, expected exception type을 검증합니다. 이 방식은 서로 다른 temp root와 CI machine에서도 같은 학습 결과를 냅니다.",
    ],
    concepts: [
      { term: "lexical path", definition: "filesystem lookup 없이 이름 segments를 표현·결합·정리한 값입니다.", detail: ["normalize가 다룹니다.", "존재와 identity를 보장하지 않습니다."] },
      { term: "real path", definition: "existing filesystem object를 provider가 canonical하게 해석한 path입니다.", detail: ["I/O failure가 가능합니다.", "link-following option이 의미를 바꿉니다."] },
      { term: "working directory", definition: "상대 path를 absolute로 해석할 때 JVM process가 사용하는 기준 directory입니다.", detail: ["source 위치가 아닙니다.", "launcher/test마다 달라질 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-path-resolution-stages",
      title: "host path를 노출하지 않고 Path resolution 단계의 semantic facts를 검증합니다",
      language: "java",
      filename: "PathResolutionStages.java",
      purpose: "relative path가 lexical normalize와 absolute 변환을 거쳐도 존재하는 real path가 되지는 않는다는 점을 고정합니다.",
      code: `import java.nio.file.NoSuchFileException;
import java.nio.file.Path;

public class PathResolutionStages {
    public static void main(String[] args) {
        Path cwd = Path.of("").toAbsolutePath().normalize();
        Path raw = Path.of("workspace", "..", "workspace", "note.bin");
        Path normalized = raw.normalize();
        Path absolute = normalized.toAbsolutePath().normalize();

        boolean realPathRequiresExistence;
        try {
            absolute.toRealPath();
            realPathRequiresExistence = false;
        } catch (NoSuchFileException expected) {
            realPathRequiresExistence = true;
        } catch (java.io.IOException unexpected) {
            throw new IllegalStateException(unexpected);
        }

        System.out.println("rawAbsolute=" + raw.isAbsolute());
        System.out.println("normalizedSegments=" + normalized.getName(0) + "/" + normalized.getName(1));
        System.out.println("underWorkingDirectory=" + absolute.startsWith(cwd));
        System.out.println("filename=" + absolute.getFileName());
        System.out.println("realPathRequiresExistence=" + realPathRequiresExistence);
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "Path와 존재하지 않는 real path의 typed failure를 import합니다." },
        { lines: "5-8", explanation: "cwd·raw·lexically normalized·absolute stages를 별도 values로 둡니다." },
        { lines: "10-19", explanation: "존재 전 toRealPath가 NoSuchFileException이라는 것을 category로 검증합니다." },
        { lines: "21-25", explanation: "host-specific absolute 문자열 대신 semantic booleans와 filename만 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh empty working directory", "-Xlint:all warning0"], command: isolatedJavaRun("PathResolutionStages.java", "PathResolutionStages") },
      output: { value: "rawAbsolute=false\nnormalizedSegments=workspace/note.bin\nunderWorkingDirectory=true\nfilename=note.bin\nrealPathRequiresExistence=true", explanation: ["normalized name segments는 portable slash로 조립했습니다.", "absolute path 자체는 공개하지 않습니다.", "toRealPath는 object existence를 요구합니다."] },
      experiments: [
        { change: "raw를 Path.of(\"note.bin\")으로 단순화합니다.", prediction: "normalized display만 note.bin으로 바뀌고 나머지 facts는 같습니다.", result: "lexical segments와 object existence가 독립임을 확인합니다." },
        { change: "note.bin을 만든 뒤 toRealPath를 호출합니다.", prediction: "realPathRequiresExistence가 false가 됩니다.", result: "real path는 filesystem lookup 결과입니다." },
        { change: "absolute host path 전체를 output으로 바꿉니다.", prediction: "machine마다 golden이 달라지고 사용자 directory가 노출됩니다.", result: "semantic normalization을 유지합니다." },
      ],
      sourceRefs: ["java-path-api", "java-files-api", "java-no-such-file-exception"],
    }],
    diagnostics: [
      { symptom: "IDE에서는 file을 찾지만 CLI·service에서는 NoSuchFileException이 난다.", likelyCause: "상대 path의 working directory가 launcher마다 다릅니다.", checks: ["Path.of(\"\").toAbsolutePath semantic location을 restricted log로 확인합니다.", "launcher WorkingDirectory를 봅니다.", "config path가 relative인지 확인합니다."], fix: "trusted base directory를 configuration으로 주고 base.resolve(relative)를 사용합니다.", prevention: "working directory 독립 integration test와 absolute path 비노출 diagnostics를 둡니다." },
      { symptom: "normalize 후 sandbox 안이라고 생각했지만 link를 통해 밖의 file을 연다.", likelyCause: "lexical normalization을 filesystem-aware identity 검증으로 오해했습니다.", checks: ["path components의 links/junctions를 조사합니다.", "toRealPath options를 확인합니다.", "validate-use 사이 변경 가능성을 봅니다."], fix: "trusted root real path·link policy·secure handle/open strategy를 함께 설계합니다.", prevention: "lexical traversal test와 symlink race test를 별도 suite로 둡니다." },
    ],
    expertNotes: ["Path startsWith는 같은 provider의 path elements 비교입니다. 문자열 prefix는 root2가 root20을 허용하는 오류와 case/normalization 혼란을 만들 수 있습니다.", "default filesystem 외 zipfs·Jimfs 같은 provider에서는 display·attributes·atomic move capabilities가 다릅니다. Path contract와 provider capability를 분리합니다."],
  },
  {
    id: "file-path-metadata-links-identity",
    title: "File의 boolean API를 Path/Files typed metadata와 link policy로 확장합니다",
    lead: "exists 하나로 object를 단정하지 않고 type·size·timestamps·permissions와 symbolic-link following 여부를 같은 observation 시점의 attributes로 읽습니다.",
    explanations: [
      "legacy File은 path abstraction이며 new File이 file을 만들지 않습니다. exists·isFile·length 같은 methods도 observation 사이 filesystem이 바뀔 수 있어 transaction snapshot이 아닙니다.",
      "File.toPath로 점진적으로 modern API에 연결할 수 있습니다. 새 코드는 Path value와 Files operations를 사용하면 open options와 구체적인 IOException subtype을 더 명확히 다룹니다.",
      "Files.readAttributes(path, BasicFileAttributes.class, options)는 regular file·directory·symbolic link·other, size와 times를 한 번의 attribute read로 묶습니다. 그래도 이후 open까지 atomic 보장은 아닙니다.",
      "Files.isRegularFile 등 convenience predicate는 접근 실패와 false를 구분하지 못할 수 있습니다. 반드시 알아야 하는 실패 이유가 있으면 readAttributes나 실제 open의 exception을 처리합니다.",
      "NOFOLLOW_LINKS는 link 자체 metadata를 관찰할 때 사용합니다. link target을 허용할지, 마지막 link만 금지할지, path 구성 요소 전체를 금지할지는 별도 정책입니다.",
      "Files.isSameFile은 두 path가 같은 existing object인지 provider에 질문합니다. normalized string equality보다 alias·link를 잘 다루지만 I/O와 권한 failure가 가능합니다.",
      "size는 byte 수이지 characters·records 수가 아닙니다. sparse file의 allocated blocks나 compressed storage 비용과도 같지 않으므로 metric 이름을 정확히 붙입니다.",
      "lastModifiedTime은 동시성 version으로 안전하지 않습니다. timestamp granularity와 external changes가 있어 optimistic update에는 content hash·file key·application version을 함께 고려합니다.",
      "예제는 regular file fixture만 사용해 모든 OS에서 stable합니다. symlink 생성은 권한·platform support가 달라 별도 capability-gated integration test에서 수행합니다.",
    ],
    concepts: [
      { term: "file attributes", definition: "filesystem object type·size·timestamps·key 등을 한 observation으로 읽은 metadata입니다.", detail: ["BasicFileAttributes가 portable subset입니다.", "후속 open과 atomic하지 않습니다."] },
      { term: "link option", definition: "operation이 symbolic link를 따라 target을 볼지 link 자체를 볼지 정하는 option입니다.", detail: ["NOFOLLOW_LINKS가 있습니다.", "security policy 전체와 같지는 않습니다."] },
      { term: "same file", definition: "서로 다른 Path 표현이 같은 existing filesystem object를 가리키는지 provider가 판단한 관계입니다.", detail: ["I/O가 가능합니다.", "string equality보다 강합니다."] },
    ],
    codeExamples: [{
      id: "java-path-metadata-snapshot",
      title: "regular file의 attributes와 identity를 host-independent facts로 관찰합니다",
      language: "java",
      filename: "PathMetadataSnapshot.java",
      purpose: "File object 생성과 실제 filesystem object creation, metadata observation을 분리합니다.",
      code: `import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;

public class PathMetadataSnapshot {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("metadata-fixture");
        Files.createDirectory(root);
        Path file = root.resolve("sample.bin");
        try {
            Files.write(file, new byte[] {1, 2, 3}, StandardOpenOption.CREATE_NEW);
            BasicFileAttributes attributes = Files.readAttributes(
                    file, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);

            System.out.println("regular=" + attributes.isRegularFile());
            System.out.println("directory=" + attributes.isDirectory());
            System.out.println("symbolicLink=" + attributes.isSymbolicLink());
            System.out.println("size=" + attributes.size());
            System.out.println("sameFile=" + Files.isSameFile(file, file.toAbsolutePath()));
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "Path operations, link option과 portable basic attributes를 import합니다." },
        { lines: "8-13", explanation: "fresh directory와 CREATE_NEW byte fixture를 만든 뒤 NOFOLLOW metadata를 읽습니다." },
        { lines: "14-20", explanation: "type·byte size와 relative/absolute alias identity를 semantic facts로 출력합니다." },
        { lines: "21-24", explanation: "file을 먼저, directory를 나중에 삭제해 non-empty directory failure를 피합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh empty working directory", "-Xlint:all warning0"], command: isolatedJavaRun("PathMetadataSnapshot.java", "PathMetadataSnapshot") },
      output: { value: "regular=true\ndirectory=false\nsymbolicLink=false\nsize=3\nsameFile=true", explanation: ["fixture는 regular file3 bytes입니다.", "NOFOLLOW에서 link가 아닙니다.", "relative와 absolute Path가 같은 object입니다."] },
      experiments: [
        { change: "readAttributes 전에 file을 삭제합니다.", prediction: "NoSuchFileException이 나고 false로 조용히 축약되지 않습니다.", result: "typed observation failure를 처리합니다." },
        { change: "size를 character count라고 표시합니다.", prediction: "multi-byte text에서 설명이 틀립니다.", result: "metadata size는 bytes입니다." },
        { change: "capability가 있는 test에서 symbolic link를 만들고 options를 바꿉니다.", prediction: "NOFOLLOW와 follow의 object type/size가 달라질 수 있습니다.", result: "link policy가 observation semantics를 바꿉니다." },
      ],
      sourceRefs: ["java-file-api", "java-path-api", "java-files-api", "java-basic-file-attributes", "java-link-option", "java-standard-open-option"],
    }],
    diagnostics: [
      { symptom: "Files.exists가 false인데 missing인지 permission failure인지 알 수 없다.", likelyCause: "boolean convenience predicate가 일부 I/O failure를 false로 축약합니다.", checks: ["실제 readAttributes/open을 시도합니다.", "exception subtype과 file store permissions를 봅니다.", "link option을 확인합니다."], fix: "업무상 구분해야 하면 typed operation의 IOException을 분류합니다.", prevention: "exists-then-open 대신 open-and-handle-failure 흐름을 사용합니다." },
      { symptom: "두 다른 path strings가 같은 file을 수정해 충돌한다.", likelyCause: "relative/absolute·link·case alias를 string identity로 비교했습니다.", checks: ["normalize/absolute 값을 비교합니다.", "existing paths에 Files.isSameFile을 호출합니다.", "provider case sensitivity를 확인합니다."], fix: "filesystem identity 또는 application-owned canonical key를 사용합니다.", prevention: "alias/link fixtures를 integration matrix에 넣습니다." },
    ],
    expertNotes: ["fileKey는 filesystem/provider에 따라 null이거나 process 간 안정적이지 않을 수 있습니다. 영구 business ID로 바로 쓰지 않습니다.", "metadata check 뒤 open은 TOCTOU window를 남깁니다. security-sensitive 작업은 directory handle 기반 relative open이나 OS-specific stronger primitive도 검토합니다."],
  },
  {
    id: "input-output-byte-eof-domain",
    title: "InputStream의 unsigned byte0..255와 EOF-1을 손실 없이 분리합니다",
    lead: "Java byte는 signed -128..127이지만 InputStream.read()는 모든 eight-bit patterns와 EOF를 표현하기 위해 int0..255 또는-1을 반환합니다.",
    explanations: [
      "InputStream과 OutputStream은 byte sequence abstraction입니다. 이름의 Stream은 collection Stream pipeline이 아니며 lazy intermediate/terminal operations가 없습니다.",
      "read()의 int return을 즉시 byte나 char로 cast하면 0xFF data255와 EOF-1을 혼동할 수 있습니다. 먼저 value==-1을 검사하고 그 뒤 byte/value conversion을 합니다.",
      "Java byte를 unsigned integer로 볼 때 b & 0xFF 또는 Byte.toUnsignedInt를 사용합니다. binary protocols·hex dumps에서는 sign extension을 피해야 합니다.",
      "OutputStream.write(int)는 argument의 low-order eight bits만 씁니다. 256을 쓰면0이 기록되므로 range validation이 필요한 protocol field는 write 전에 합니다.",
      "empty input의 첫 read는-1입니다. one-byte input은 data 한 번 뒤-1이며 EOF를 두 번 읽는 behavior는 stream subtype contract와 state를 확인해야 합니다.",
      "ByteArrayInputStream/OutputStream은 memory fixture라 filesystem variation 없이 byte laws를 가르치기 좋습니다. production file behavior는 FileInputStream/Files.newInputStream integration test가 보완합니다.",
      "read(byte[])는 actual count를 반환하며 buffer 전체가 새 data라는 뜻이 아닙니다. 이 장은 single-byte contract를 고정하고 partial bulk read는 별도 장에서 adversarial stream으로 검증합니다.",
      "binary output을 String으로 직접 decode하지 않습니다. hex/base64와 length/hash 같은 representation을 사용하면 arbitrary bytes와 privacy를 안전하게 관찰할 수 있습니다.",
      "close ownership은 stream을 만든 쪽에 기본적으로 있습니다. caller-owned InputStream을 받는 API가 닫을지 남길지는 method contract로 명시합니다.",
    ],
    concepts: [
      { term: "EOF sentinel", definition: "더 읽을 byte가 없음을 뜻하는 int -1이며 파일 data가 아닙니다.", detail: ["cast 전에 검사합니다.", "0은 valid data입니다."] },
      { term: "unsigned byte view", definition: "eight-bit pattern을0..255 정수로 해석한 값입니다.", detail: ["read()가 직접 제공합니다.", "signed byte는 변환이 필요합니다."] },
      { term: "byte stream", definition: "text interpretation 없이 octets의 순서와 I/O lifecycle을 다루는 abstraction입니다.", detail: ["binary payload에 적합합니다.", "charset은 별도 boundary입니다."] },
    ],
    codeExamples: [{
      id: "java-byte-eof-domain",
      title: "0x00·0x7F·0x80·0xFF와 EOF를 exact integers/hex로 관찰합니다",
      language: "java",
      filename: "ByteEofDomain.java",
      purpose: "signed Java byte와 read int domain을 구분하고 모든 byte patterns가 EOF와 공존함을 증명합니다.",
      code: `import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

public class ByteEofDomain {
    public static void main(String[] args) throws Exception {
        byte[] payload = {0, 127, (byte) 128, (byte) 255};
        List<Integer> values = new ArrayList<>();
        int eof;
        try (InputStream input = new ByteArrayInputStream(payload);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            int value;
            while ((value = input.read()) != -1) {
                values.add(value);
                output.write(value);
            }
            eof = input.read();
            System.out.println("readValues=" + values);
            System.out.println("copiedHex=" + HexFormat.of().withUpperCase().formatHex(output.toByteArray()));
        }
        System.out.println("eof=" + eof);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "memory byte streams, value collection과 stable uppercase hex formatter를 import합니다." },
        { lines: "9-11", explanation: "signed literals로 four boundary patterns를 만들고 read int values를 받을 List를 준비합니다." },
        { lines: "12-20", explanation: "try-with-resources 안에서 -1을 먼저 검사하고 original int의 low byte를 복사합니다." },
        { lines: "21-24", explanation: "0..255 values·exact hex와 terminal EOF를 서로 다른 facts로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("ByteEofDomain.java", "ByteEofDomain") },
      output: { value: "readValues=[0, 127, 128, 255]\ncopiedHex=007F80FF\neof=-1", explanation: ["0x80/FF도 positive data integers입니다.", "copied bytes가 exact합니다.", "EOF만-1입니다."] },
      experiments: [
        { change: "while condition에서 (byte) input.read()!=-1을 사용합니다.", prediction: "0xFF가 byte-1이 되어 data를 EOF로 오해합니다.", result: "int 상태에서 sentinel을 먼저 검사해야 합니다." },
        { change: "output.write(256)을 추가합니다.", prediction: "hex 끝에00이 붙습니다.", result: "write(int)는 low8 bits만 기록합니다." },
        { change: "payload를 empty array로 바꿉니다.", prediction: "readValues=[], copiedHex empty, eof=-1입니다.", result: "empty는 정상 boundary case입니다." },
      ],
      sourceRefs: ["java-input-stream-api", "java-output-stream-api", "java-byte-array-input-stream", "java-byte-array-output-stream", "java-hex-format", "java-file-input-stream", "java-file-output-stream"],
    }],
    diagnostics: [
      { symptom: "binary file에서 0xFF 이후 copy가 조기에 끝난다.", likelyCause: "read result를 byte로 cast한 뒤-1과 비교했습니다.", checks: ["loop variable type을 봅니다.", "0x80·0xFF fixture를 넣습니다.", "EOF check 위치를 확인합니다."], fix: "int로 받고 value==-1을 먼저 검사한 뒤 write/unsigned conversion합니다.", prevention: "all-byte boundary fixture와 hash comparison을 둡니다." },
      { symptom: "byte dump에 음수 값이 나타나 protocol field와 맞지 않는다.", likelyCause: "signed byte를 그대로 int로 promotion했습니다.", checks: ["Byte.toUnsignedInt 사용 여부를 봅니다.", "format에 b & 0xFF가 있는지 봅니다.", "wire type range를 확인합니다."], fix: "unsigned conversion 후 range/name을 명확히 출력합니다.", prevention: "wire integer와 Java storage type을 schema 문서에 분리합니다." },
    ],
    expertNotes: ["InputStream.readNBytes와 readAllBytes는 편리하지만 untrusted/huge source에서 memory bound를 먼저 정해야 합니다. 편의 API가 resource limit을 대신하지 않습니다.", "byte value observability에 raw payload를 log하면 secret·PII를 노출할 수 있습니다. 길이·허용된 prefix·digest와 access-controlled trace를 구분합니다."],
  },
  {
    id: "output-open-create-truncate-append",
    title: "create·truncate·append를 암묵적 constructor가 아닌 데이터 수명 정책으로 선택합니다",
    lead: "파일을 연다는 말에는 없으면 만들기, 있으면 실패·덮어쓰기·이어쓰기라는 서로 다른 업무 의미가 숨어 있으므로 StandardOpenOption으로 드러냅니다.",
    explanations: [
      "FileOutputStream(File)는 existing file을 truncate하는 behavior라 백업·artifact publish에서 위험할 수 있습니다. append boolean도 collision policy를 두 값으로만 축약합니다.",
      "Files.newOutputStream/Files.write의 options는 CREATE, CREATE_NEW, TRUNCATE_EXISTING, APPEND, WRITE 등을 조합합니다. default options도 API마다 확인하고 production code에는 의도를 명시합니다.",
      "CREATE_NEW는 target 존재 확인과 creation을 atomic하게 수행하도록 정의되어 check-then-create race를 줄입니다. Files.exists 후 create 순서는 다른 process가 사이에 만들 수 있습니다.",
      "TRUNCATE_EXISTING은 open 성공 순간 기존 contents를0 length로 만들 수 있습니다. validation·quota·backup을 open 뒤에 하면 이미 data loss가 발생했을 수 있습니다.",
      "APPEND는 각 write가 file end로 이동하는 의미지만 여러 writers의 record atomicity·ordering을 자동 보장하지 않습니다. log format과 synchronization/file locking policy를 별도 설계합니다.",
      "CREATE와 TRUNCATE_EXISTING을 함께 쓰면 없으면 생성, 있으면 덮어쓰기입니다. 이것이 정말 idempotent replacement인지 accidental loss인지 API 이름과 tests가 드러내야 합니다.",
      "temporary file에 쓰고 검증 후 move하는 replace strategy는 partial final file을 줄입니다. 같은 filesystem, ATOMIC_MOVE support, existing target와 crash durability 정책을 확인합니다.",
      "flush는 Java buffers를 다음 layer로 넘기지만 disk controller까지 durable commit을 뜻하지 않습니다. durability가 requirement면 FileChannel.force와 filesystem/hardware semantics를 측정합니다.",
      "collision·missing parent·read-only target·full disk를 다른 error categories로 검증합니다. success path만 보면 open option의 핵심 계약이 빠집니다.",
    ],
    concepts: [
      { term: "CREATE_NEW", definition: "target이 없을 때만 atomic creation하고 이미 있으면 실패하는 option입니다.", detail: ["collision을 보존합니다.", "exists-then-create race를 줄입니다."] },
      { term: "truncate", definition: "기존 file을 열면서 length를0으로 만드는 destructive open behavior입니다.", detail: ["open 시점에 발생할 수 있습니다.", "validation 순서가 중요합니다."] },
      { term: "append", definition: "각 write를 현재 file end에 추가하는 mode입니다.", detail: ["record transaction은 아닙니다.", "concurrent ordering은 별도입니다."] },
    ],
    codeExamples: [{
      id: "java-file-open-modes",
      title: "CREATE_NEW·TRUNCATE_EXISTING·APPEND와 collision을 한 state transition으로 검증합니다",
      language: "java",
      filename: "FileOpenModes.java",
      purpose: "open option 조합이 existing contents와 target collision에 미치는 결과를 exact bytes로 확인합니다.",
      code: `import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.HexFormat;

public class FileOpenModes {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("open-modes");
        Files.createDirectory(root);
        Path target = root.resolve("artifact.bin");
        boolean collisionRejected = false;
        try {
            Files.write(target, new byte[] {1, 2}, StandardOpenOption.CREATE_NEW);
            Files.write(target, new byte[] {9}, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
            Files.write(target, new byte[] {2, 3}, StandardOpenOption.WRITE, StandardOpenOption.APPEND);
            try {
                Files.write(target, new byte[] {7}, StandardOpenOption.CREATE_NEW);
            } catch (FileAlreadyExistsException expected) {
                collisionRejected = true;
            }
            byte[] result = Files.readAllBytes(target);
            System.out.println("hex=" + HexFormat.of().withUpperCase().formatHex(result));
            System.out.println("size=" + result.length);
            System.out.println("collisionRejected=" + collisionRejected);
        } finally {
            Files.deleteIfExists(target);
            Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "typed collision, Path/Files options와 stable hex representation을 import합니다." },
        { lines: "8-12", explanation: "fresh root/target과 collision result state를 준비합니다." },
        { lines: "13-20", explanation: "CREATE_NEW→truncate write→append를 수행하고 두 번째 CREATE_NEW를 typed failure로 확인합니다." },
        { lines: "21-25", explanation: "final exact bytes·length·collision policy를 출력합니다." },
        { lines: "26-29", explanation: "owned target 뒤 root 순서로 cleanup합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh empty working directory", "-Xlint:all warning0"], command: isolatedJavaRun("FileOpenModes.java", "FileOpenModes") },
      output: { value: "hex=090203\nsize=3\ncollisionRejected=true", explanation: ["truncate가01 02를09로 교체합니다.", "append가02 03을 추가합니다.", "CREATE_NEW collision은 기존 bytes를 보존합니다."] },
      experiments: [
        { change: "TRUNCATE_EXISTING을 빼고 position write를 기대합니다.", prediction: "provider/default position semantics를 잘못 가정할 수 있으며 tail bytes가 남을 수 있습니다.", result: "replace 의도를 explicit option과 exact content로 검증합니다." },
        { change: "두 번째 CREATE_NEW를 CREATE로 바꿉니다.", prediction: "collision이 실패하지 않고 existing file open semantics가 달라집니다.", result: "CREATE와 CREATE_NEW는 다른 business contract입니다." },
        { change: "target write 뒤 예외를 던지고 final publish를 흉내냅니다.", prediction: "직접 final target에 쓰면 partial/changed file이 남습니다.", result: "temp-write→verify→move state machine이 필요합니다." },
      ],
      sourceRefs: ["java-files-api", "java-standard-open-option", "java-file-already-exists-exception", "java-hex-format", "java-file-output-stream"],
    }],
    diagnostics: [
      { symptom: "검증 실패했는데도 기존 file이0 bytes가 됐다.", likelyCause: "TRUNCATE open을 validation보다 먼저 수행했습니다.", checks: ["stream open 시점을 찾습니다.", "open options/constructor를 확인합니다.", "validation과 target selection 순서를 봅니다."], fix: "입력을 먼저 검증하고 owned temp에 CREATE_NEW로 쓴 뒤 검증·publish합니다.", prevention: "existing target preservation failure-injection test를 둡니다." },
      { symptom: "여러 process가 같은 이름을 확인한 뒤 모두 create하려 한다.", likelyCause: "Files.exists와 create를 분리한 TOCTOU race입니다.", checks: ["check-then-act code를 찾습니다.", "collision exception handling을 봅니다.", "name/idempotency key policy를 확인합니다."], fix: "CREATE_NEW atomic create를 시도하고 FileAlreadyExistsException을 업무 정책으로 처리합니다.", prevention: "concurrent collision integration test와 random server-side name을 사용합니다." },
    ],
    expertNotes: ["ATOMIC_MOVE는 option 요청이지 모든 pair에서 보장되는 capability가 아닙니다. AtomicMoveNotSupportedException과 cross-filesystem fallback semantics를 명시합니다.", "append-only라는 API 이름만으로 tamper evidence가 생기지 않습니다. audit log에는 access control, chained hashes/signatures, rotation과 secure collection이 추가로 필요합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...pathByteChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-file-api", repository: "Java SE 21 API", path: "java.io.File", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/File.html", usedFor: ["legacy path abstraction", "toPath", "boolean metadata caveat"], evidence: "원본 File API와 Path migration 근거입니다." },
  { id: "java-path-api", repository: "Java SE 21 API", path: "java.nio.file.Path", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Path.html", usedFor: ["resolve", "normalize", "absolute", "real path", "startsWith"], evidence: "path value/identity 단계 근거입니다." },
  { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["create/write/read", "attributes", "same file", "delete"], evidence: "modern filesystem operations 근거입니다." },
  { id: "java-no-such-file-exception", repository: "Java SE 21 API", path: "java.nio.file.NoSuchFileException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/NoSuchFileException.html", usedFor: ["missing real path", "typed failure"], evidence: "존재하지 않는 path 분류 근거입니다." },
  { id: "java-basic-file-attributes", repository: "Java SE 21 API", path: "java.nio.file.attribute.BasicFileAttributes", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/attribute/BasicFileAttributes.html", usedFor: ["file type", "size", "timestamps", "file key"], evidence: "portable metadata snapshot 근거입니다." },
  { id: "java-link-option", repository: "Java SE 21 API", path: "java.nio.file.LinkOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/LinkOption.html", usedFor: ["NOFOLLOW_LINKS", "metadata policy"], evidence: "link-following option 근거입니다." },
  { id: "java-input-stream-api", repository: "Java SE 21 API", path: "java.io.InputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html", usedFor: ["read int domain", "EOF", "bulk read", "ownership"], evidence: "byte input contract의 primary source입니다." },
  { id: "java-output-stream-api", repository: "Java SE 21 API", path: "java.io.OutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/OutputStream.html", usedFor: ["write low8 bits", "flush", "close"], evidence: "byte output lifecycle 근거입니다." },
  { id: "java-byte-array-input-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayInputStream.html", usedFor: ["all-byte fixture", "memory input"], evidence: "filesystem-independent byte fixture 근거입니다." },
  { id: "java-byte-array-output-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayOutputStream.html", usedFor: ["memory copy target", "exact bytes"], evidence: "in-memory byte output oracle 근거입니다." },
  { id: "java-hex-format", repository: "Java SE 21 API", path: "java.util.HexFormat", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HexFormat.html", usedFor: ["stable binary representation", "uppercase hex"], evidence: "binary output를 text decoding 없이 표현하는 근거입니다." },
  { id: "java-file-input-stream", repository: "Java SE 21 API", path: "java.io.FileInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FileInputStream.html", usedFor: ["original Ex04", "file byte input", "migration"], evidence: "원본 file input API 근거입니다." },
  { id: "java-file-output-stream", repository: "Java SE 21 API", path: "java.io.FileOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FileOutputStream.html", usedFor: ["original Ex02", "truncate/append constructors", "migration"], evidence: "원본 file output behavior 근거입니다." },
  { id: "java-standard-open-option", repository: "Java SE 21 API", path: "java.nio.file.StandardOpenOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/StandardOpenOption.html", usedFor: ["CREATE_NEW", "TRUNCATE_EXISTING", "APPEND", "WRITE"], evidence: "explicit file lifecycle options 근거입니다." },
  { id: "java-file-already-exists-exception", repository: "Java SE 21 API", path: "java.nio.file.FileAlreadyExistsException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/FileAlreadyExistsException.html", usedFor: ["atomic create collision", "typed policy"], evidence: "CREATE_NEW collision 분류 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "relative/absolute/normalized/real path, metadata/link observation, unsigned byte/EOF와 open modes까지 modern Path/Files로 확장했습니다.",
  "synthetic examples는 host absolute path 대신 semantic booleans·relative names·hex를 stable output으로 사용합니다.",
);

const lifecycleSecurityChapters: DetailedSession["chapters"] = [
  {
    id: "resource-ownership-close-suppressed",
    title: "try-with-resources의 소유권·역순 close와 suppressed failure를 보존합니다",
    lead: "I/O 본문이 실패한 뒤 close도 실패할 수 있습니다. 하나를 버리지 않고 primary cause와 정리 실패를 함께 전달하는 언어 규칙을 실행해 봅니다.",
    explanations: [
      "resource leak은 file descriptor·handle·buffered bytes·lock을 오래 붙잡아 다음 open/delete를 실패하게 합니다. garbage collection timing을 close 전략으로 사용하지 않습니다.",
      "try-with-resources는 AutoCloseable resources를 declaration의 역순으로 닫습니다. output wrapper→underlying stream처럼 dependency가 있으면 outermost wrapper만 소유하고 닫는 구조가 일반적입니다.",
      "try body가 먼저 예외를 던지고 close도 예외를 던지면 body exception이 primary이고 close failures는 getSuppressed에 붙습니다. manual finally가 close exception을 그대로 throw하면 원래 원인을 잃을 수 있습니다.",
      "resource initialization 중 두 번째 생성이 실패해도 이미 생성된 첫 번째 resource는 닫힙니다. 생성 전 변수 null과 partial ownership을 수동 finally로 관리하는 것보다 안전합니다.",
      "caller가 제공한 InputStream을 method가 닫는지, method가 직접 연 stream만 닫는지 ownership contract를 문서화합니다. 라이브러리가 caller-owned stream을 몰래 닫으면 후속 소비가 깨집니다.",
      "close가 성공 반환했다고 storage durability가 보장되지는 않습니다. Java object lifecycle, OS page cache flush, filesystem journal, device persistence를 requirement에 맞게 구분합니다.",
      "close exception을 무시하지 않되 success response 뒤 cleanup warning을 무조건 업무 실패로 바꾸는 것도 정책입니다. output close failure는 bytes가 완성되지 않았을 수 있어 보통 publish를 중단합니다.",
      "suppressed list 순서는 close 순서를 반영하지만 business assertion이 implementation detail에 과도하게 결합되지 않게 resource dependency를 명시적으로 검증합니다.",
      "observability에는 operation id·logical artifact·phase(open/read/write/close/cleanup)·exception category를 남깁니다. absolute path와 raw payload는 access-controlled field로 분리합니다.",
    ],
    concepts: [
      { term: "resource ownership", definition: "누가 resource를 닫고 close failure를 처리할 책임이 있는지 정한 계약입니다.", detail: ["생성자가 보통 owner입니다.", "ownership transfer는 명시합니다."] },
      { term: "primary exception", definition: "try body나 initialization에서 먼저 발생해 밖으로 전파되는 주된 failure입니다.", detail: ["close failure가 덮지 않습니다.", "suppressed failures를 가질 수 있습니다."] },
      { term: "suppressed exception", definition: "primary exception을 보존하면서 자동 close 중 발생한 추가 failure입니다.", detail: ["getSuppressed로 읽습니다.", "역순 close evidence가 됩니다."] },
    ],
    codeExamples: [{
      id: "java-resource-suppressed-order",
      title: "body failure와 두 close failures의 primary/suppressed 구조를 검증합니다",
      language: "java",
      filename: "ResourceSuppressedOrder.java",
      purpose: "manual finally가 잃기 쉬운 failure tree와 reverse close order를 exact output으로 관찰합니다.",
      code: `import java.util.Arrays;

public class ResourceSuppressedOrder {
    static final class Probe implements AutoCloseable {
        private final String name;

        Probe(String name) { this.name = name; }
        void use() { /* marks the resource as intentionally used */ }

        @Override
        public void close() {
            throw new IllegalStateException("close-" + name);
        }
    }

    public static void main(String[] args) {
        try (Probe first = new Probe("first");
             Probe second = new Probe("second")) {
            first.use();
            second.use();
            throw new IllegalArgumentException("body");
        } catch (RuntimeException error) {
            System.out.println("primary=" + error.getMessage());
            System.out.println("suppressed=" + Arrays.stream(error.getSuppressed())
                    .map(Throwable::getMessage).toList());
        }
    }
}`,
      walkthrough: [
        { lines: "1-13", explanation: "close할 때 name이 있는 failure를 내는 AutoCloseable probe를 정의합니다." },
        { lines: "16-21", explanation: "first→second로 선언하고 둘을 사용한 뒤 body primary failure를 만듭니다." },
        { lines: "22-25", explanation: "primary message와 reverse-close order의 suppressed messages를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("ResourceSuppressedOrder.java", "ResourceSuppressedOrder") },
      output: { value: "primary=body\nsuppressed=[close-second, close-first]", explanation: ["body가 primary입니다.", "second가 먼저 닫힙니다.", "두 close failures가 손실 없이 남습니다."] },
      experiments: [
        { change: "manual finally에서 first.close만 호출합니다.", prediction: "second leak 또는 body failure 덮어쓰기가 생깁니다.", result: "언어가 제공하는 failure preservation을 사용합니다." },
        { change: "second constructor가 throw하도록 바꿉니다.", prediction: "first만 생성됐으므로 first close failure가 initialization failure에 suppressed됩니다.", result: "partial initialization cleanup도 자동 규칙에 포함됩니다." },
        { change: "catch에서 getSuppressed를 log하지 않습니다.", prediction: "primary는 보이지만 cleanup/system failure evidence가 사라집니다.", result: "failure tree 전체를 관찰합니다." },
      ],
      sourceRefs: ["java-auto-closeable", "java-throwable-api", "jls-try-statement", "java-input-stream-api", "java-output-stream-api"],
    }],
    diagnostics: [
      { symptom: "원래 write exception 대신 close exception만 보고된다.", likelyCause: "finally에서 close를 throw해 primary를 덮었습니다.", checks: ["stack trace의 최초 phase를 봅니다.", "manual close catch를 검사합니다.", "suppressed list가 비어 있는지 봅니다."], fix: "try-with-resources로 바꾸고 primary와 getSuppressed를 함께 기록합니다.", prevention: "body+close 동시 failure injection test를 둡니다." },
      { symptom: "Windows에서 test 뒤 파일 삭제가 간헐적으로 AccessDenied가 난다.", likelyCause: "stream/channel handle이 닫히지 않았거나 test가 delete를 close 전에 수행했습니다.", checks: ["resource scope를 봅니다.", "wrapper/underlying ownership을 확인합니다.", "parallel test의 공유 path를 찾습니다."], fix: "try scope 종료 뒤 cleanup하고 각 test에 fresh path를 줍니다.", prevention: "handle leak detector와 repeated Windows test를 CI에 둡니다." },
    ],
    expertNotes: ["AutoCloseable.close는 Exception을 선언하고 Closeable.close는 IOException을 선언합니다. API boundary가 허용하는 failure type과 idempotency를 별도 확인합니다.", "suppressed failure는 finally cleanup뿐 아니라 structured task/resource compositions에도 중요한 진단 정보입니다. log serializer가 suppressed/causes를 모두 보존하는지 검증합니다."],
  },
  {
    id: "byte-text-charset-boundary",
    title: "String↔byte 변환에서 charset을 protocol의 일부로 고정합니다",
    lead: "byte stream은 문자를 알지 못합니다. text를 bytes로 만드는 순간 charset이 wire/storage schema가 되므로 default 값에 맡기지 않습니다.",
    explanations: [
      "String은 Unicode text abstraction이고 byte[]는 octets입니다. getBytes()와 new String(bytes)는 charset을 생략하면 runtime default에 의존해 같은 source가 다른 artifact를 만들 수 있습니다.",
      "StandardCharsets.UTF_8처럼 필수 지원 charset constant를 사용하면 lookup failure와 이름 typo를 피하고 protocol intent를 드러냅니다.",
      "UTF-8에서 ASCII는1byte, 한글 syllable은 보통3bytes입니다. String.length는 UTF-16 code units이고 user-perceived grapheme count와 file byte length 모두와 다를 수 있습니다.",
      "wrong charset decode는 exception 없이 mojibake String을 만들 수 있습니다. decode 성공 여부만 아니라 known fixture round-trip·replacement character·strict decoder policy를 검증합니다.",
      "CharsetDecoder는 malformed/unmappable input에 REPORT·REPLACE·IGNORE 정책을 가질 수 있습니다. 손상 탐지가 중요하면 silent replacement를 허용하지 않습니다.",
      "BOM은 일부 encodings/tools가 signature로 쓰지만 Java UTF-8 encoding이 자동 BOM을 붙인다고 가정하지 않습니다. input BOM 보존/제거 정책을 명시합니다.",
      "line separator는 charset과 별도입니다. CR, LF, CRLF bytes를 text line model로 바꿀지 byte-for-byte 보존할지 copy 목적에 따라 선택합니다.",
      "binary image·compressed·encrypted data에 charset decode를 적용하면 information loss가 생깁니다. media type/schema가 text라고 확정된 boundary에서만 decode합니다.",
      "public diagnostics는 raw decoded user contents 대신 byte length·charset name·malformed offset/category를 사용합니다. secret payload의 hex 전체도 공개하지 않습니다.",
    ],
    concepts: [
      { term: "charset boundary", definition: "Unicode text와 bytes 사이 mapping을 명시적으로 적용하는 지점입니다.", detail: ["storage/wire schema의 일부입니다.", "양방향이 같은 정책이어야 합니다."] },
      { term: "mojibake", definition: "bytes를 쓰인 charset과 다른 charset으로 해석해 생긴 깨진 text입니다.", detail: ["decode가 예외 없이 성공할 수 있습니다.", "round-trip test가 필요합니다."] },
      { term: "replacement policy", definition: "잘못된 byte sequence를 error로 보고할지 대체 문자로 바꿀지 정한 decoder 규칙입니다.", detail: ["REPORT가 손상을 드러냅니다.", "IGNORE는 정보 손실을 숨길 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-explicit-charset-boundary",
      title: "UTF-8 bytes·hex·round-trip과 wrong-charset 손실을 비교합니다",
      language: "java",
      filename: "ExplicitCharsetBoundary.java",
      purpose: "default charset 없이 같은 text가 exact bytes로 저장·복원됨을 검증합니다.",
      code: `import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HexFormat;

public class ExplicitCharsetBoundary {
    public static void main(String[] args) {
        String text = "안녕A";
        byte[] utf8 = text.getBytes(StandardCharsets.UTF_8);
        String restored = new String(utf8, StandardCharsets.UTF_8);
        String wrong = new String(utf8, StandardCharsets.ISO_8859_1);
        byte[] wrongReencoded = wrong.getBytes(StandardCharsets.UTF_8);

        System.out.println("utf8Length=" + utf8.length);
        System.out.println("utf8Hex=" + HexFormat.of().withUpperCase().formatHex(utf8));
        System.out.println("roundTrip=" + text.equals(restored));
        System.out.println("wrongRoundTrip=" + Arrays.equals(utf8, wrongReencoded));
    }
}`,
      walkthrough: [
        { lines: "1-3", explanation: "required charsets, byte equality와 stable hex formatter를 import합니다." },
        { lines: "6-11", explanation: "한글2+ASCII1 text를 UTF-8로 encode/restore하고 wrong Latin-1 decode/re-encode를 만듭니다." },
        { lines: "13-16", explanation: "byte length·exact hex와 correct/wrong round-trip facts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8 source", "-Xlint:all warning0"], command: isolatedJavaRun("ExplicitCharsetBoundary.java", "ExplicitCharsetBoundary") },
      output: { value: "utf8Length=7\nutf8Hex=EC9588EB859541\nroundTrip=true\nwrongRoundTrip=false", explanation: ["한글 각3bytes와 A1byte입니다.", "UTF-8 왕복은 같습니다.", "wrong charset path는 original bytes를 보존하지 않습니다."] },
      experiments: [
        { change: "getBytes/new String에서 charset arguments를 제거합니다.", prediction: "현재 machine에서는 같을 수 있지만 다른 default charset에서 artifact가 달라집니다.", result: "local pass가 portable contract 증거는 아닙니다." },
        { change: "invalid UTF-8 bytes와 decoder REPORT를 사용합니다.", prediction: "MalformedInputException으로 손상이 드러납니다.", result: "replacement와 reject 정책을 선택합니다." },
        { change: "text.length를 file byte count라고 출력합니다.", prediction: "3과7이 달라 설명이 실패합니다.", result: "code units와 encoded bytes를 분리합니다." },
      ],
      sourceRefs: ["java-standard-charsets", "java-charset-api", "java-hex-format", "java-arrays-api", "java-class14-ex02"],
    }],
    diagnostics: [
      { symptom: "개발 PC에서는 한글이 정상인데 배포 artifact hash와 text가 다르다.", likelyCause: "default charset으로 encode/decode했습니다.", checks: ["getBytes()/String constructor arguments를 찾습니다.", "runtime file.encoding과 JDK version을 확인합니다.", "known UTF-8 fixture hex를 비교합니다."], fix: "protocol charset constant를 양쪽 boundary에 명시하고 기존 data migration을 계획합니다.", prevention: "non-ASCII golden bytes와 hostile default-charset test를 둡니다." },
      { symptom: "decode는 성공했지만 일부 문자가 U+FFFD로 바뀐다.", likelyCause: "decoder replacement policy가 malformed bytes를 조용히 대체했습니다.", checks: ["replacement character count를 봅니다.", "CharsetDecoder CodingErrorAction을 확인합니다.", "source bytes와 declared charset을 대조합니다."], fix: "integrity가 중요하면 REPORT로 바꾸고 bad record를 error channel로 분리합니다.", prevention: "malformed/truncated multi-byte boundary fixtures를 포함합니다." },
    ],
    expertNotes: ["Unicode normalization NFC/NFD는 charset encoding과 다른 층입니다. visually same filename/text의 byte/hash equality가 필요하면 normalization policy도 별도로 정합니다.", "filesystem filename encoding/case rules과 file content charset을 혼동하지 않습니다. Path는 names를 provider에 전달하고 contents decode는 application schema입니다."],
  },
  {
    id: "filesystem-failure-taxonomy-atomic-create",
    title: "missing·collision·wrong-type·permission failures를 typed filesystem errors로 분류합니다",
    lead: "IOException 하나로 묶으면 사용자가 고칠 입력 오류, retry 가능한 환경 오류, programming bug와 보안 거부가 섞입니다. operation과 subtype을 함께 봅니다.",
    explanations: [
      "NoSuchFileException은 source나 parent가 없음을 나타낼 수 있습니다. 어느 operation에서 file/other/reason fields가 채워졌는지 restricted diagnostics로 확인합니다.",
      "FileAlreadyExistsException은 CREATE_NEW·createFile collision을 표현합니다. idempotent retry인지 사용자 rename 요청인지 business key로 판단하지 무조건 overwrite하지 않습니다.",
      "AccessDeniedException은 permissions·ACL·open handle·security product 등 여러 원인이 될 수 있습니다. 사용자에게 내부 path를 노출하지 않고 operator 진단에는 OS context가 필요합니다.",
      "DirectoryNotEmptyException, NotDirectoryException, FileSystemLoopException, AtomicMoveNotSupportedException처럼 operation-specific types가 recovery 선택을 돕습니다.",
      "FileSystemException은 file·otherFile·reason을 가질 수 있지만 reason text는 provider/locale에 의존합니다. program branch는 subtype/error code를 우선하고 message exact string에 의존하지 않습니다.",
      "exists check 뒤 open하지 말고 intended option으로 open을 시도한 후 typed failure를 처리하면 TOCTOU window와 boolean 정보 손실을 줄입니다.",
      "permission test는 CI account·OS마다 결과가 달라 pure unit golden으로 고정하기 어렵습니다. missing/collision/wrong-type은 portable test, ACL/full-disk는 controlled integration environment로 나눕니다.",
      "retry는 transient classification, idempotency와 deadline/backoff가 있어야 합니다. access denied나 invalid path를 빠르게 반복하면 load와 noise만 늘어납니다.",
      "error response에는 logical operation과 safe remediation을 주고 stack trace·absolute path·ACL principal·raw filename은 내부 관찰 경계에서 redaction합니다.",
    ],
    concepts: [
      { term: "failure taxonomy", definition: "filesystem 실패를 operation·typed cause·retry/recovery 정책으로 분류한 표입니다.", detail: ["message 문자열보다 subtype을 우선합니다.", "portable/integration cases를 나눕니다."] },
      { term: "atomic create", definition: "존재 확인과 새 file 생성이 하나의 filesystem operation으로 수행되는 계약입니다.", detail: ["CREATE_NEW가 표현합니다.", "collision을 exception으로 처리합니다."] },
      { term: "wrong-type failure", definition: "file을 기대한 곳이 directory이거나 parent가 directory가 아닌 것처럼 object type이 operation과 맞지 않는 실패입니다.", detail: ["provider subtype이 다를 수 있습니다.", "precheck보다 operation failure가 authoritative합니다."] },
    ],
    codeExamples: [{
      id: "java-filesystem-failure-taxonomy",
      title: "collision·missing parent·directory write를 message 없이 categories로 검증합니다",
      language: "java",
      filename: "FilesystemFailureTaxonomy.java",
      purpose: "portable failures는 concrete subtype, provider-dependent wrong type은 FileSystemException family로 분류합니다.",
      code: `import java.nio.file.FileAlreadyExistsException;
import java.nio.file.FileSystemException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class FilesystemFailureTaxonomy {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("failure-fixture");
        Files.createDirectory(root);
        Path existing = root.resolve("existing.bin");
        Files.createFile(existing);
        boolean collision = false;
        boolean missingParent = false;
        boolean wrongType = false;
        try {
            try {
                Files.createFile(existing);
            } catch (FileAlreadyExistsException expected) {
                collision = true;
            }
            try {
                Files.newOutputStream(root.resolve("missing/child.bin"), StandardOpenOption.CREATE_NEW).close();
            } catch (NoSuchFileException expected) {
                missingParent = true;
            }
            try {
                Files.newOutputStream(root, StandardOpenOption.WRITE).close();
            } catch (FileSystemException expected) {
                wrongType = true;
            }
            System.out.println("collision=" + collision);
            System.out.println("missingParent=" + missingParent);
            System.out.println("wrongType=" + wrongType);
        } finally {
            Files.deleteIfExists(existing);
            Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "collision·filesystem family·missing과 open option types를 import합니다." },
        { lines: "9-16", explanation: "fresh root/existing file과 세 failure-category flags를 준비합니다." },
        { lines: "17-31", explanation: "atomic collision, missing parent와 directory-as-file open을 각각 typed catch로 분류합니다." },
        { lines: "32-34", explanation: "locale/provider message 대신 semantic categories만 출력합니다." },
        { lines: "35-38", explanation: "fixture file 뒤 directory를 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh empty working directory", "-Xlint:all warning0"], command: isolatedJavaRun("FilesystemFailureTaxonomy.java", "FilesystemFailureTaxonomy") },
      output: { value: "collision=true\nmissingParent=true\nwrongType=true", explanation: ["existing collision이 구분됩니다.", "missing parent가 구분됩니다.", "directory write가 filesystem failure family로 구분됩니다."] },
      experiments: [
        { change: "catch IOException 하나로 flags를 모두 true로 만듭니다.", prediction: "세 recovery 정책을 구분할 수 없습니다.", result: "narrow typed causes를 먼저 처리합니다." },
        { change: "Files.exists 후 createFile만 사용합니다.", prediction: "concurrent creator가 사이에 들어오면 여전히 collision이 납니다.", result: "exception이 정상 control outcome일 수 있습니다." },
        { change: "exception.getMessage exact string을 golden으로 둡니다.", prediction: "OS·locale·provider가 바뀌면 test가 깨집니다.", result: "type와 semantic fields를 검증합니다." },
      ],
      sourceRefs: ["java-files-api", "java-file-system-exception", "java-file-already-exists-exception", "java-no-such-file-exception", "java-standard-open-option"],
    }],
    diagnostics: [
      { symptom: "파일 저장 실패를 모두 '파일 없음'으로 보여 retry해도 해결되지 않는다.", likelyCause: "IOException message 일부만 보고 taxonomy를 만들었습니다.", checks: ["exception class/cause chain을 봅니다.", "operation phase와 target role을 기록합니다.", "retry 횟수·결과를 확인합니다."], fix: "missing·collision·denied·wrong type·capacity·transient를 typed policy로 분리합니다.", prevention: "failure matrix와 category metrics를 운영 dashboard에 둡니다." },
      { symptom: "collision 발생 시 기존 file을 자동 삭제해 다른 요청 data가 사라진다.", likelyCause: "FileAlreadyExistsException을 오류 제거 대상으로 보고 ownership을 확인하지 않았습니다.", checks: ["target naming/idempotency key를 봅니다.", "기존 file owner를 확인합니다.", "delete 권한과 audit log를 조사합니다."], fix: "collision을 rename/idempotent-return/conflict 중 명시 정책으로 처리합니다.", prevention: "기존 target 불변 assertion과 concurrent creators test를 둡니다." },
    ],
    expertNotes: ["Windows sharing violation이 AccessDeniedException 또는 provider reason으로 나타나는 등 subtype만으로 root cause가 완전히 결정되지는 않습니다. operation context와 OS telemetry를 결합합니다.", "full disk·quota·network filesystem timeout은 local unit test로 안전하게 재현하기 어렵습니다. fault-injection filesystem/container quota를 별도 환경에서 사용합니다."],
  },
  {
    id: "path-containment-traversal-symlink-race",
    title: "untrusted path를 lexical containment에서 symlink·junction race까지 위협 모델링합니다",
    lead: "../만 제거하면 끝이 아닙니다. 절대 경로·alternate separators·encoded names·links와 validate-use race를 trusted root 기준으로 계층적으로 차단합니다.",
    explanations: [
      "사용자 입력을 server path로 직접 쓰지 말고 business identifier·server-generated storage name으로 변환하는 것이 가장 단순한 방어입니다. original filename은 표시 metadata로만 보존합니다.",
      "상대 input만 허용하고 root.resolve(input).normalize 결과가 normalized absolute root로 startsWith인지 확인하면 lexical .. escape를 탐지할 수 있습니다.",
      "문자열 prefix 비교는 root와 root-evil, separator·case를 잘못 처리합니다. Path startsWith로 같은 provider의 name elements를 비교합니다.",
      "absolute path, drive-relative name, UNC/device path, alternate data stream 같은 platform syntax는 허용 grammar에서 거부합니다. 한 OS에서 만든 regex를 다른 OS security proof로 재사용하지 않습니다.",
      "normalize containment 뒤에도 root 내부 symbolic link/junction이 외부 target을 가리킬 수 있습니다. links를 금지하거나 trusted provisioning만 허용하고 toRealPath/NOFOLLOW·directory-handle strategy를 정합니다.",
      "validation 뒤 attacker가 component를 link로 교체하는 TOCTOU race가 있습니다. 같은 trusted directory handle에 상대 open을 결합하는 SecureDirectoryStream은 provider support 여부를 확인합니다.",
      "upload에서 directory components 자체를 허용하지 않고 getFileName-equivalent leaf만 받으면 attack surface가 줄지만 Unicode normalization·reserved names·trailing dot/space·case collision 정책이 남습니다.",
      "archive extraction은 각 entry path에 containment를 반복하고 symbolic/hard links·entry count·expanded size를 제한해야 합니다. zip slip은 일반 upload name보다 더 넓은 threat입니다.",
      "거부 log에는 raw path 전체 대신 request id, safe reason과 length/hash를 남깁니다. malicious payload가 log injection·PII 노출을 만들지 않게 구조화합니다.",
    ],
    concepts: [
      { term: "lexical containment", definition: "resolve·normalize한 Path elements가 trusted root로 시작하는지 확인하는 이름 수준의 경계입니다.", detail: [".. escape를 막습니다.", "links를 해결하지 않습니다."] },
      { term: "symlink escape", definition: "root 안의 path component가 root 밖 object를 가리켜 lexical containment를 우회하는 상황입니다.", detail: ["junction/mount도 검토합니다.", "filesystem-aware policy가 필요합니다."] },
      { term: "validate-use race", definition: "검증과 실제 open 사이 filesystem namespace가 바뀌어 다른 object를 사용하는 경쟁입니다.", detail: ["TOCTOU의 한 형태입니다.", "handle-relative operations가 완화합니다."] },
    ],
    codeExamples: [{
      id: "java-lexical-path-containment",
      title: "trusted root 아래 정상 child와 ../ escape를 Path elements로 구분합니다",
      language: "java",
      filename: "LexicalPathContainment.java",
      purpose: "문자열 prefix가 아닌 normalized Path relation으로 첫 번째 traversal 방어선을 구현합니다.",
      code: `import java.io.File;
import java.nio.file.Path;

public class LexicalPathContainment {
    static Path resolveInside(Path root, String input) {
        Path relative = Path.of(input);
        if (relative.isAbsolute()) {
            throw new IllegalArgumentException("absolute path");
        }
        Path candidate = root.resolve(relative).normalize();
        if (!candidate.startsWith(root)) {
            throw new IllegalArgumentException("outside root");
        }
        return candidate;
    }

    public static void main(String[] args) {
        Path root = Path.of("sandbox").toAbsolutePath().normalize();
        Path accepted = resolveInside(root, "docs/a.bin");
        boolean traversalRejected = false;
        try {
            resolveInside(root, "../escape.bin");
        } catch (IllegalArgumentException expected) {
            traversalRejected = true;
        }
        String portable = root.relativize(accepted).toString()
                .replace(File.separatorChar, '/');
        System.out.println("accepted=" + portable);
        System.out.println("traversalRejected=" + traversalRejected);
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "platform separator normalization과 Path operations를 import합니다." },
        { lines: "5-15", explanation: "absolute input을 거부하고 resolve+normalize candidate의 Path startsWith root를 검사합니다." },
        { lines: "18-25", explanation: "정상 child와 parent escape를 같은 trusted root에서 실행합니다." },
        { lines: "26-29", explanation: "host root를 숨기고 relative result separator만 portable slash로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("LexicalPathContainment.java", "LexicalPathContainment") },
      output: { value: "accepted=docs/a.bin\ntraversalRejected=true", explanation: ["normal child가 root 아래로 해석됩니다.", "../ candidate는 root 밖이라 거부됩니다.", "absolute host path는 출력하지 않습니다."] },
      experiments: [
        { change: "candidate.toString().startsWith(root.toString())로 바꿉니다.", prediction: "root 이름 prefix collision과 separator/case 문제가 생깁니다.", result: "Path element relation을 사용합니다." },
        { change: "root/docs를 외부를 향한 link로 만든 capability test를 추가합니다.", prediction: "lexical check는 통과할 수 있습니다.", result: "link-aware second defense가 필요합니다." },
        { change: "raw input을 exception message와 public log에 그대로 남깁니다.", prediction: "log forging과 private filename 노출 위험이 생깁니다.", result: "structured safe reason과 bounded fingerprint를 사용합니다." },
      ],
      sourceRefs: ["java-path-api", "java-files-api", "java-secure-directory-stream", "java-link-option", "java-file-api"],
    }],
    diagnostics: [
      { symptom: "../ 검사는 통과했는데 저장 file이 root 밖에 생긴다.", likelyCause: "root 내부 symbolic link/junction 또는 validate-use race가 있습니다.", checks: ["각 component attributes를 NOFOLLOW로 봅니다.", "root/target real paths를 비교합니다.", "검증과 open 사이 mutation 권한을 조사합니다."], fix: "links를 금지·trusted provision하고 가능하면 handle-relative secure open을 사용합니다.", prevention: "attacker-writable parent를 없애고 symlink swap integration test를 둡니다." },
      { symptom: "정상 filename이 OS마다 다르게 허용·거부된다.", likelyCause: "Windows drive/reserved syntax와 POSIX rules를 하나의 문자열 regex로 처리했습니다.", checks: ["runtime filesystem provider를 봅니다.", "absolute/root/name count를 Path API로 검사합니다.", "business filename grammar를 분리합니다."], fix: "server-generated storage key를 쓰고 original name은 sanitized metadata로 둡니다.", prevention: "Windows/Linux path corpus와 normalization/case collision tests를 유지합니다." },
    ],
    expertNotes: ["SecureDirectoryStream은 모든 default provider에서 보장되지 않습니다. 지원 여부를 runtime capability로 확인하고 unsupported fallback의 threat assumptions를 문서화합니다.", "hard link는 symbolic link 검사만으로 탐지되지 않을 수 있습니다. attacker에게 root namespace mutation 권한을 주지 않는 permission architecture가 application path checks보다 중요합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...lifecycleSecurityChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-auto-closeable", repository: "Java SE 21 API", path: "java.lang.AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["resource ownership", "automatic close", "close contract"], evidence: "try-with-resources 대상 contract 근거입니다." },
  { id: "java-throwable-api", repository: "Java SE 21 API", path: "java.lang.Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["primary cause", "suppressed exceptions", "message"], evidence: "failure tree preservation 근거입니다." },
  { id: "jls-try-statement", repository: "Java Language Specification 21", path: "14.20 try statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3", usedFor: ["try-with-resources translation", "reverse close", "suppression"], evidence: "언어 수준 resource close 순서 근거입니다." },
  { id: "java-standard-charsets", repository: "Java SE 21 API", path: "java.nio.charset.StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["UTF-8", "ISO-8859-1", "required charsets"], evidence: "명시 charset constants 근거입니다." },
  { id: "java-charset-api", repository: "Java SE 21 API", path: "java.nio.charset.Charset", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/Charset.html", usedFor: ["encode/decode mapping", "default charset caveat", "decoder policy"], evidence: "text-byte mapping contract 근거입니다." },
  { id: "java-arrays-api", repository: "Java SE 21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["byte equality", "suppressed stream formatting"], evidence: "array equality와 example formatting 근거입니다." },
  { id: "java-file-system-exception", repository: "Java SE 21 API", path: "java.nio.file.FileSystemException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/FileSystemException.html", usedFor: ["wrong-type family", "file/other/reason", "provider failures"], evidence: "filesystem failure taxonomy base 근거입니다." },
  { id: "java-secure-directory-stream", repository: "Java SE 21 API", path: "java.nio.file.SecureDirectoryStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/SecureDirectoryStream.html", usedFor: ["handle-relative operations", "race resistance", "provider capability"], evidence: "symlink race를 완화하는 directory-stream contract 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "resource suppression, charset schema, typed failures와 traversal/symlink threat model을 추가해 success-only File demo를 production boundary로 확장했습니다.",
  "permission·symlink·full-disk처럼 host capability에 의존하는 경우는 portable golden과 controlled integration tests를 의도적으로 분리했습니다.",
);

const verificationChapters: DetailedSession["chapters"] = [
  {
    id: "partial-read-actual-count-copy-loop",
    title: "read buffer가 덜 차도 actual count만 써서 byte 손실과 stale tail을 막습니다",
    lead: "read(byte[]) 한 번이 배열을 꽉 채운다는 보장은 없습니다. 짧은 read를 의도적으로 내는 InputStream으로 올바른 loop를 공격적으로 검증합니다.",
    explanations: [
      "InputStream.read(byte[], off, len)은 최대 len bytes를 시도하고 actual count 또는 EOF-1을 반환합니다. network·compression·filter streams뿐 아니라 일반 I/O에서도 short read를 정상 결과로 받아들입니다.",
      "output.write(buffer)를 매번 호출하면 마지막/short block 뒤 buffer에 남은 과거 bytes까지 다시 써서 target이 길어지고 corrupt됩니다. write(buffer,0,count)가 핵심 invariant입니다.",
      "read return0은 len==0이면 정상입니다. positive len에서 blocking InputStream의 일반 contract와 subtype behavior를 확인하고, non-blocking channel과 같은 다른 abstraction의0은 별도 처리합니다.",
      "loop progress를 보장하지 않는 custom/broken source가0을 계속 반환하면 busy loop가 될 수 있습니다. API contract를 신뢰할 범위와 defensive zero-read limit을 boundary마다 결정합니다.",
      "buffer size는 correctness가 아니라 performance/memory tradeoff입니다. 1, 2, 1024, 8192 어느 크기에서도 length·hash가 같아야 하며 optimum은 storage와 workload로 측정합니다.",
      "large file을 readAllBytes로 통째로 올리지 않고 bounded buffer로 streaming하면 memory upper bound를 정할 수 있습니다. 하지만 total byte limit과 timeout/cancellation도 별도 필요합니다.",
      "copy 도중 output failure가 나면 partial target이 남을 수 있습니다. final target에 직접 쓰지 않고 owned temp를 사용해 success close·hash 뒤 publish합니다.",
      "progress는 누적 actual counts로 계산하고 expected total이 없으면 percentage를 만들지 않습니다. long counter overflow와 user-supplied length trust도 검토합니다.",
      "adversarial ShortReadInput은 요청 len과 무관하게 최대2 bytes만 반환합니다. production loop와 다른 representation의 expected payload/hex를 비교해 같은 helper bug 복제를 피합니다.",
    ],
    concepts: [
      { term: "short read", definition: "EOF 전에도 요청한 buffer 길이보다 적은 positive byte count가 반환되는 정상 입력 결과입니다.", detail: ["재시도/loop가 필요합니다.", "오류와 같지 않습니다."] },
      { term: "actual count", definition: "이번 read에서 buffer 앞부분에 새로 채워진 유효 byte 수입니다.", detail: ["write length로 사용합니다.", "나머지 buffer는 stale일 수 있습니다."] },
      { term: "bounded streaming", definition: "전체 payload 크기와 무관하게 고정 크기 buffer로 조금씩 처리하는 방식입니다.", detail: ["memory upper bound를 낮춥니다.", "total limit은 별도입니다."] },
    ],
    codeExamples: [{
      id: "java-partial-read-copy-loop",
      title: "최대2bytes만 주는 adversarial source를4byte buffer로 완전 복사합니다",
      language: "java",
      filename: "PartialReadCopyLoop.java",
      purpose: "buffer 전체가 아니라 count만 write하는 loop가 short reads와 마지막 block을 정확히 처리함을 증명합니다.",
      code: `import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;

public class PartialReadCopyLoop {
    static final class ShortReadInput extends InputStream {
        private final byte[] data;
        private int position;

        ShortReadInput(byte[] data) { this.data = data.clone(); }

        @Override
        public int read() {
            return position == data.length ? -1 : Byte.toUnsignedInt(data[position++]);
        }

        @Override
        public int read(byte[] buffer, int offset, int length) {
            if (length == 0) { return 0; }
            if (position == data.length) { return -1; }
            int count = Math.min(Math.min(length, 2), data.length - position);
            System.arraycopy(data, position, buffer, offset, count);
            position += count;
            return count;
        }
    }

    public static void main(String[] args) throws Exception {
        byte[] expected = {0, 1, 2, 3, 4, 5, 6};
        List<Integer> counts = new ArrayList<>();
        byte[] copied;
        try (InputStream input = new ShortReadInput(expected);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4];
            int count;
            while ((count = input.read(buffer)) != -1) {
                counts.add(count);
                output.write(buffer, 0, count);
            }
            copied = output.toByteArray();
        }
        System.out.println("counts=" + counts);
        System.out.println("copiedHex=" + HexFormat.of().withUpperCase().formatHex(copied));
        System.out.println("equal=" + Arrays.equals(expected, copied));
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "memory output, byte equality, hex와 observed read counts를 위한 types를 import합니다." },
        { lines: "9-29", explanation: "single read와 bulk read 모두 EOF를 지키되 bulk는 최대2bytes만 반환하는 adversarial source를 정의합니다." },
        { lines: "32-43", explanation: "4byte buffer에서 각 actual count만 기록·write하고 output snapshot을 얻습니다." },
        { lines: "44-46", explanation: "read partition, exact bytes와 independent expected equality를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("PartialReadCopyLoop.java", "PartialReadCopyLoop") },
      output: { value: "counts=[2, 2, 2, 1]\ncopiedHex=00010203040506\nequal=true", explanation: ["요청4보다 짧은2,2,2,1 reads입니다.", "마지막1byte만 write됩니다.", "target이 exact payload와 같습니다."] },
      experiments: [
        { change: "output.write(buffer)로 바꿉니다.", prediction: "각 read마다4bytes를 써 target이16bytes이고 stale values가 섞입니다.", result: "actual count invariant가 실패를 막습니다." },
        { change: "buffer를1byte로 줄입니다.", prediction: "counts는1이 일곱 번이지만 copiedHex/equality는 같습니다.", result: "buffer size는 correctness를 바꾸지 않습니다." },
        { change: "ShortReadInput이 세 번째 call에서 IOException을 내게 합니다.", prediction: "partial output이 남으므로 final publish 전에 cleanup policy가 필요합니다.", result: "copy와 atomic publish를 분리합니다." },
      ],
      sourceRefs: ["java-input-stream-api", "java-output-stream-api", "java-byte-array-output-stream", "java-arrays-api", "java-hex-format", "java-byte-api"],
    }],
    diagnostics: [
      { symptom: "복사된 file 끝에 이전 buffer 내용이 반복된다.", likelyCause: "actual count가 아닌 buffer 전체를 write했습니다.", checks: ["write overload를 봅니다.", "마지막/short read counts를 log합니다.", "source/target length·hash를 비교합니다."], fix: "write(buffer,0,count)만 호출합니다.", prevention: "buffer-1·buffer+1과 forced short-read fixtures를 둡니다." },
      { symptom: "large upload에서 heap이 급증하고 OutOfMemoryError가 난다.", likelyCause: "readAllBytes/toByteArray로 전체 payload를 메모리에 모았습니다.", checks: ["allocation profile을 봅니다.", "content length 신뢰 여부를 확인합니다.", "streaming total limit을 찾습니다."], fix: "bounded buffer로 streaming하고 누적 long limit을 초과하면 temp를 폐기합니다.", prevention: "large/unknown length stress test와 heap budget metric을 둡니다." },
    ],
    expertNotes: ["InputStream.transferTo도 내부적으로 streaming하지만 size limit·digest·progress·cancellation을 끼우려면 explicit loop나 bounded wrapper가 필요할 수 있습니다.", "FileChannel은 read가0을 반환할 수 있고 position/scatter-gather semantics가 있으므로 InputStream loop를 그대로 일반화하지 않습니다."],
  },
  {
    id: "length-hash-integrity-authenticity",
    title: "length와 SHA-256으로 copy 무결성을 확인하되 authenticity와 구분합니다",
    lead: "복사가 끝났다는 사실만으로 bytes가 같다고 단정하지 않습니다. 독립 digest와 count를 비교하고, unkeyed hash가 공격자 인증을 제공하지 않는 한계를 명시합니다.",
    explanations: [
      "source/target byte length가 같아도 contents가 다를 수 있고 hash만 비교해도 algorithm·expected digest provenance가 불명확하면 의미가 약합니다. count와 strong digest를 함께 기록합니다.",
      "MessageDigest SHA-256은 arbitrary bytes를 deterministic fixed-size digest로 만듭니다. cryptographic collision resistance가 단순 checksum보다 강하지만 zero probability 보장은 아닙니다.",
      "digest는 payload confidentiality를 제공하지 않습니다. low-entropy secret의 hash를 공개하면 dictionary guessing이 가능하므로 public logs에는 필요성과 threat model을 검토합니다.",
      "attacker가 payload와 expected unkeyed digest를 모두 바꿀 수 있으면 integrity check를 함께 우회합니다. authenticity에는 trusted manifest signature, HMAC 또는 TLS/authorization chain이 필요합니다.",
      "MessageDigest.isEqual은 digest comparison의 timing 차이를 줄이는 helper입니다. business identity compare와 cryptographic verification context를 분리합니다.",
      "streaming copy 중 digest를 update하면 한 pass로 계산할 수 있지만 source가 동시에 변하면 읽은 snapshot의 digest일 뿐 path의 현재 object를 보장하지 않습니다. stable handle/locking/version policy를 검토합니다.",
      "InputStream.transferTo는 모든 bytes를 OutputStream으로 전달하고 long count를 반환합니다. 실패 후 partial target과 close behavior는 여전히 caller가 처리합니다.",
      "hash text output은 uppercase/lowercase보다 bytes가 본질입니다. golden representation은 HexFormat으로 고정하고 비교는 decoded digest bytes로 합니다.",
      "observability에는 algorithm version, expected source provenance, bytes copied, digest-match boolean과 duration을 남깁니다. raw content와 absolute path는 제외합니다.",
    ],
    concepts: [
      { term: "integrity", definition: "data가 기대한 bytes에서 우발적·비인가 변경되지 않았음을 확인하는 성질입니다.", detail: ["length+digest가 evidence입니다.", "expected value provenance가 중요합니다."] },
      { term: "authenticity", definition: "data가 주장한 신뢰 주체가 만든 것임을 검증하는 성질입니다.", detail: ["unkeyed hash만으로 부족합니다.", "signature/HMAC trust가 필요합니다."] },
      { term: "digest", definition: "입력 bytes를 고정 길이 fingerprint로 변환한 결과입니다.", detail: ["SHA-256을 사용합니다.", "원문 복원/암호화가 아닙니다."] },
    ],
    codeExamples: [{
      id: "java-copy-digest-integrity",
      title: "memory stream copy count와 source/target SHA-256을 독립 계산합니다",
      language: "java",
      filename: "CopyDigestIntegrity.java",
      purpose: "copy completion을 count와 exact known digest, digest byte equality라는 세 evidence로 확인합니다.",
      code: `import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.util.HexFormat;

public class CopyDigestIntegrity {
    static byte[] sha256(byte[] value) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(value);
    }

    public static void main(String[] args) throws Exception {
        byte[] source = {0, 1, 2, 3, 4};
        byte[] target;
        long transferred;
        try (ByteArrayInputStream input = new ByteArrayInputStream(source);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            transferred = input.transferTo(output);
            target = output.toByteArray();
        }
        byte[] sourceDigest = sha256(source);
        byte[] targetDigest = sha256(target);
        System.out.println("transferred=" + transferred);
        System.out.println("sha256=" + HexFormat.of().withUpperCase().formatHex(sourceDigest));
        System.out.println("digestMatch=" + MessageDigest.isEqual(sourceDigest, targetDigest));
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "memory streams, SHA-256와 stable digest hex를 import합니다." },
        { lines: "7-9", explanation: "algorithm을 이름으로 얻어 byte[] digest를 반환하는 작은 oracle helper를 정의합니다." },
        { lines: "12-19", explanation: "known five-byte source를 transferTo로 복사하고 count/target snapshot을 얻습니다." },
        { lines: "20-24", explanation: "source/target digest를 독립 계산해 count·known hex·constant-time helper equality를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "SHA-256 provider", "-Xlint:all warning0"], command: isolatedJavaRun("CopyDigestIntegrity.java", "CopyDigestIntegrity") },
      output: { value: "transferred=5\nsha256=08BB5E5D6EAAC1049EDE0893D30ED022B1A4D9B5B48DB414871F51C9CB35283D\ndigestMatch=true", explanation: ["five bytes가 전달됩니다.", "known SHA-256이 exact합니다.", "target digest가 같습니다."] },
      experiments: [
        { change: "target[4]를5로 바꾼 뒤 digest합니다.", prediction: "length는 같지만 digestMatch=false입니다.", result: "length만으로 contents를 검증할 수 없습니다." },
        { change: "attacker가 payload와 expected digest를 함께 바꿀 수 있게 둡니다.", prediction: "digestMatch=true여도 authenticity가 없습니다.", result: "trusted signed manifest/HMAC가 필요합니다." },
        { change: "SHA-256 대신 String.hashCode를 씁니다.", prediction: "32-bit non-cryptographic collision과 representation 문제가 큽니다.", result: "integrity requirement에 맞는 algorithm을 선택합니다." },
      ],
      sourceRefs: ["java-message-digest", "java-input-stream-api", "java-byte-array-input-stream", "java-byte-array-output-stream", "java-hex-format", "java-file-channel"],
    }],
    diagnostics: [
      { symptom: "source/target size는 같은데 binary가 열리지 않는다.", likelyCause: "length만 비교해 same-size corruption을 놓쳤습니다.", checks: ["strong digest를 비교합니다.", "copy actual counts를 봅니다.", "source mutation/partial overwrite를 조사합니다."], fix: "stable source snapshot에서 target close 후 SHA-256을 비교합니다.", prevention: "known digest fixtures와 corruption injection test를 둡니다." },
      { symptom: "hash가 맞으니 trusted vendor artifact라고 판단했다.", likelyCause: "integrity fingerprint를 authenticity proof로 오해했고 expected hash 출처가 공격자와 같습니다.", checks: ["manifest transport/signature를 봅니다.", "key trust/rotation을 확인합니다.", "hash publication channel을 조사합니다."], fix: "trusted signature/HMAC verification과 authorization을 추가합니다.", prevention: "threat model에 payload와 metadata 변조 권한을 함께 적습니다." },
    ],
    expertNotes: ["SHA-256 isEqual이 timing을 줄여도 surrounding parsing·length checks·error messages가 side channel을 만들 수 있습니다. secret MAC 검증은 전체 flow를 봅니다.", "FileChannel.force(true)는 metadata까지 요청하지만 crash consistency는 rename/directory fsync/filesystem semantics와 연결됩니다. hash match와 durability를 별도 SLO로 둡니다."],
  },
  {
    id: "portable-io-boundary-verification-matrix",
    title: "0·1·buffer±1·missing·collision·failure phases를 독립 fixture matrix로 고정합니다",
    lead: "happy-path 한 파일이 아니라 cardinality·boundary·state·platform capability 축을 표로 만들고 각 case의 length·digest·cleanup invariant를 자동 검증합니다.",
    explanations: [
      "size matrix는 empty0, one1, buffer-1, buffer, buffer+1, multi-buffer와 configured limit±1을 포함합니다. 4097은 1024-byte buffer 네 번과 마지막1byte를 강제합니다.",
      "contents는 all-zero만 쓰지 않고 deterministic pattern을 사용해 stale-tail·offset·reordering bug를 hash가 탐지하게 합니다. fixed generator와 algorithm version을 test 이름에 남깁니다.",
      "source state는 existing regular, missing, directory, unreadable, changing을 나눕니다. target은 absent, existing, directory, missing parent, unwritable, same-file alias를 나눕니다.",
      "failure phase는 validate, source open, target create, read, write, flush/close, verify, publish, cleanup으로 분리합니다. 각 phase에서 기존 target 보존과 owned temp 제거를 확인합니다.",
      "portable unit matrix는 memory streams와 fresh temp regular files로 exact output을 냅니다. symlink/junction, ACL, full disk, atomic move, network filesystem은 capability-tagged integration suite로 분리합니다.",
      "test temp root는 collision이면 새 이름을 쓰지 기존 것을 지우지 않습니다. root direct-child ownership을 증명하고 reverse-order cleanup하며 failure도 assertion에 포함합니다.",
      "parallel tests는 같은 filenames/working directory를 공유하지 않습니다. unique root와 per-test logical ids를 사용해 order dependence와 accidental cross-delete를 막습니다.",
      "oracle은 production copy helper를 재사용하지 않고 original payload array/independent digest·length를 사용합니다. 같은 bug가 expected와 actual에 복제되는 self-fulfilling test를 피합니다.",
      "CI report에는 case id, safe size, phase, exception category, seed와 digest-match를 남깁니다. random host path와 binary contents는 golden에서 제외합니다.",
    ],
    concepts: [
      { term: "boundary matrix", definition: "buffer·limit·empty 주변 크기와 filesystem states를 교차해 off-by-one/partial failures를 찾는 테스트 집합입니다.", detail: ["buffer±1이 중요합니다.", "success/failure phases를 포함합니다."] },
      { term: "independent oracle", definition: "production algorithm과 다른 representation·계산으로 expected bytes/length/hash를 만드는 기준입니다.", detail: ["bug 복제를 줄입니다.", "small hand-known cases도 포함합니다."] },
      { term: "capability-gated test", definition: "symlink·ACL·atomic move처럼 환경 지원이 필요한 case를 capability를 확인한 뒤 실행·명시 skip하는 integration test입니다.", detail: ["silent pass가 아닙니다.", "지원 환경에서는 반드시 검증합니다."] },
    ],
    codeExamples: [{
      id: "java-io-boundary-matrix",
      title: "0·1·4097byte files를1024 buffer로 복사하고 missing source를 분류합니다",
      language: "java",
      filename: "IoBoundaryMatrix.java",
      purpose: "empty와 multi-buffer+tail cases의 exact byte/hash, cleanup과 typed missing failure를 한 portable matrix로 검증합니다.",
      code: `import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class IoBoundaryMatrix {
    static void copy(Path source, Path target) throws Exception {
        try (InputStream input = Files.newInputStream(source);
             OutputStream output = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW)) {
            byte[] buffer = new byte[1_024];
            int count;
            while ((count = input.read(buffer)) != -1) {
                output.write(buffer, 0, count);
            }
        }
    }

    static byte[] hash(Path path) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(path));
    }

    public static void main(String[] args) throws Exception {
        Path root = Path.of("io-matrix");
        Files.createDirectory(root);
        List<Integer> verifiedSizes = new ArrayList<>();
        boolean hashesMatch = true;
        boolean missingSourceClassified = false;
        try {
            for (int size : new int[] {0, 1, 4_097}) {
                byte[] payload = new byte[size];
                for (int index = 0; index < size; index++) {
                    payload[index] = (byte) (index * 31);
                }
                Path source = root.resolve("source-" + size);
                Path target = root.resolve("target-" + size);
                Files.write(source, payload, StandardOpenOption.CREATE_NEW);
                copy(source, target);
                hashesMatch &= Arrays.equals(payload, Files.readAllBytes(target));
                hashesMatch &= MessageDigest.isEqual(hash(source), hash(target));
                verifiedSizes.add(size);
                Files.delete(target);
                Files.delete(source);
            }
            try {
                copy(root.resolve("missing"), root.resolve("unused-target"));
            } catch (NoSuchFileException expected) {
                missingSourceClassified = true;
            }
            System.out.println("sizes=" + verifiedSizes);
            System.out.println("hashesMatch=" + hashesMatch);
            System.out.println("missingSourceClassified=" + missingSourceClassified);
        } finally {
            Files.deleteIfExists(root.resolve("unused-target"));
            Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "byte streams, Files, typed missing, digest와 result collections를 import합니다." },
        { lines: "13-21", explanation: "1024-byte buffer에서 actual count만 쓰고 try-with-resources로 닫는 copy helper를 정의합니다." },
        { lines: "23-25", explanation: "small fixtures용 독립 SHA-256 file hash helper를 정의합니다." },
        { lines: "28-34", explanation: "fresh root, observed sizes와 integrity/missing flags를 준비합니다." },
        { lines: "35-48", explanation: "0·1·4097 deterministic payload를 CREATE_NEW copy하고 bytes+hash를 비교한 뒤 case artifacts를 삭제합니다." },
        { lines: "49-58", explanation: "missing source가 target 생성 전에 typed failure인지 확인하고 semantic results를 출력합니다." },
        { lines: "59-62", explanation: "failure 중 생길 수 있는 owned target과 root를 bounded cleanup합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh empty working directory", "-Xlint:all warning0"], command: isolatedJavaRun("IoBoundaryMatrix.java", "IoBoundaryMatrix") },
      output: { value: "sizes=[0, 1, 4097]\nhashesMatch=true\nmissingSourceClassified=true", explanation: ["empty·single·four buffers+tail cases가 통과합니다.", "bytes와 independent hashes가 같습니다.", "missing source는 target을 publish하지 않고 분류됩니다."] },
      experiments: [
        { change: "write(buffer,0,count)를 write(buffer)로 바꿉니다.", prediction: "size1·4097 target이 buffer 배수로 늘어 hashesMatch=false입니다.", result: "matrix가 stale-tail bug를 잡습니다." },
        { change: "missing source보다 target을 먼저 엽니다.", prediction: "source open 실패에도 empty target이 생길 수 있습니다.", result: "resource initialization/open 순서가 failure side effect를 바꿉니다." },
        { change: "two tests가 같은 root를 parallel 사용합니다.", prediction: "CREATE_NEW collision이나 cross-delete로 nondeterministic failure가 납니다.", result: "per-test unique ownership root가 필요합니다." },
      ],
      sourceRefs: ["java-files-api", "java-input-stream-api", "java-output-stream-api", "java-standard-open-option", "java-no-such-file-exception", "java-message-digest", "java-arrays-api", "java-standard-copy-option", "java-atomic-move-not-supported"],
    }],
    diagnostics: [
      { symptom: "normal sample은 통과하지만 특정 file 크기에서만 hash가 다르다.", likelyCause: "buffer boundary나 마지막 short block의 off-by-one/write-length 오류입니다.", checks: ["buffer-1/buffer/buffer+1 counts를 기록합니다.", "source/target length와 first mismatch offset을 봅니다.", "write overload를 확인합니다."], fix: "actual count loop를 사용하고 deterministic boundary matrix를 추가합니다.", prevention: "모든 configured buffer/limit 주변 sizes를 regression suite에 둡니다." },
      { symptom: "test cleanup이 다른 test artifact를 지운다.", likelyCause: "공유 fixed directory와 broad recursive delete를 사용했습니다.", checks: ["temp root 생성/ownership record를 봅니다.", "resolved cleanup parent를 확인합니다.", "parallel case IDs를 봅니다."], fix: "unique direct-child root만 만들고 collision 시 중단하며 path boundary를 검증해 삭제합니다.", prevention: "cleanup guard 자체의 wrong-parent/collision tests를 둡니다." },
    ],
    expertNotes: ["Files.readAllBytes는 이 예제의4097byte oracle에는 적절하지만 large production verification에는 streaming digest를 사용합니다. test helper의 size assumption을 이름에 남깁니다.", "mutation testing으로 count 대신 buffer.length, EOF를0, CREATE_NEW를TRUNCATE로 바꿔 matrix가 모두 죽이는지 확인하면 test sensitivity를 정량화할 수 있습니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...verificationChapters);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "Path.normalize와 toRealPath는 어떻게 다른가요?", answer: "normalize는 lexical dot segments만 정리하고, toRealPath는 existing filesystem을 조회해 link policy에 따른 real path를 구합니다." },
  { question: "new File(path)가 file을 생성하나요?", answer: "아닙니다. path abstraction만 만들며 createNewFile·Files.createFile·stream open 같은 operation이 실제 상태를 바꿉니다." },
  { question: "Files.exists를 먼저 호출하는 것이 항상 안전한가요?", answer: "아닙니다. false가 failure를 축약할 수 있고 이후 open까지 race가 있어 intended operation을 시도하고 typed exception을 처리하는 편이 낫습니다." },
  { question: "서로 다른 Path strings가 같은 object인지 어떻게 보나요?", answer: "existing objects에는 Files.isSameFile을 사용할 수 있지만 I/O·permission failure와 provider semantics를 처리해야 합니다." },
  { question: "BasicFileAttributes.size는 문자 수인가요?", answer: "아닙니다. file bytes 수이며 allocated storage나 logical record count와도 다를 수 있습니다." },
  { question: "NOFOLLOW_LINKS만 쓰면 모든 symlink traversal이 막히나요?", answer: "아닙니다. operation별 link 처리, intermediate components, junctions와 validate-use race를 포함한 전체 policy가 필요합니다." },
  { question: "read(byte[])는 배열을 항상 가득 채우나요?", answer: "아닙니다. EOF 전에도1..length 범위의 short read가 가능하며 반환 count만 유효합니다." },
  { question: "Java signed byte를0..255로 보는 방법은 무엇인가요?", answer: "Byte.toUnsignedInt(value) 또는 value & 0xFF를 사용합니다." },
  { question: "OutputStream.write(511)는 무엇을 쓰나요?", answer: "low-order8 bits인255, 즉0xFF 한 byte를 씁니다." },
  { question: "empty InputStream의 첫 read 결과는 무엇인가요?", answer: "EOF sentinel -1입니다. 0은 valid byte data입니다." },
  { question: "CREATE와 CREATE_NEW는 같은가요?", answer: "아닙니다. CREATE는 existing target을 열 수 있지만 CREATE_NEW는 이미 있으면 atomic collision failure입니다." },
  { question: "TRUNCATE_EXISTING의 위험 시점은 언제인가요?", answer: "open 성공 때 기존 contents가0 length가 될 수 있어 이후 validation failure 전에도 data loss가 발생할 수 있습니다." },
  { question: "APPEND면 concurrent log records가 항상 온전히 정렬되나요?", answer: "아닙니다. write atomicity와 record ordering은 filesystem·stream·writer coordination 정책을 별도 검증해야 합니다." },
  { question: "flush하면 전원 장애에도 bytes가 보존되나요?", answer: "아닙니다. Java/OS buffer 전달과 durable device commit은 다르며 FileChannel.force·filesystem semantics까지 requirement로 정해야 합니다." },
  { question: "method가 caller가 준 stream을 닫아도 되나요?", answer: "ownership contract가 그렇게 명시된 경우만 그렇습니다. 보통 생성한 쪽이 닫고 transfer는 명확히 문서화합니다." },
  { question: "close exception은 body exception을 대체하나요?", answer: "try-with-resources에서는 body/initialization primary가 유지되고 close exceptions는 suppressed로 붙습니다." },
  { question: "JDK18+ 기본 charset이 UTF-8이면 charset을 생략해도 되나요?", answer: "protocol/storage contract는 runtime default와 독립적이어야 하므로 explicit StandardCharsets를 계속 사용합니다." },
  { question: "wrong charset decode가 항상 exception을 내나요?", answer: "아닙니다. valid mapping으로 mojibake나 replacement가 생길 수 있어 strict policy와 round-trip fixtures가 필요합니다." },
  { question: "BOM과 line ending은 charset 하나로 결정되나요?", answer: "아닙니다. BOM emission/handling과 CR·LF·CRLF normalization은 별도 format policy입니다." },
  { question: "IOException message 문자열로 recovery를 분기해도 되나요?", answer: "provider·OS·locale에 따라 달라질 수 있어 subtype과 semantic fields/operation context를 우선합니다." },
  { question: "모든 filesystem IOException을 retry하면 되나요?", answer: "아닙니다. collision·invalid·denied는 정책/입력 문제일 수 있고 transient만 deadline·backoff·idempotency와 retry합니다." },
  { question: "Path.startsWith containment은 문자열 startsWith보다 무엇이 낫나요?", answer: "같은 provider의 path name elements를 비교해 root/root-evil prefix와 separator 혼란을 줄입니다." },
  { question: "lexical containment 뒤 남는 핵심 위협은 무엇인가요?", answer: "symlink/junction/hard-link·platform aliases와 검증 뒤 namespace가 바뀌는 TOCTOU race입니다." },
  { question: "SecureDirectoryStream을 항상 쓸 수 있나요?", answer: "아닙니다. provider가 지원할 때 handle-relative operations를 제공하므로 capability check와 fallback assumptions가 필요합니다." },
  { question: "partial read가 오류인가요?", answer: "아닙니다. positive actual count가 요청 길이보다 작아도 정상이며 loop가 계속 읽습니다." },
  { question: "copy loop에서 왜 write(buffer,0,count)를 쓰나요?", answer: "이번 read가 채운 앞 count bytes만 유효하고 나머지는 이전 read의 stale data일 수 있기 때문입니다." },
  { question: "transferTo가 size limit과 hash를 자동 적용하나요?", answer: "아닙니다. bytes를 전송하지만 업무 limit·digest·progress·cancellation·partial target policy는 별도입니다." },
  { question: "SHA-256 match가 authenticity도 증명하나요?", answer: "expected digest가 trusted signature/HMAC channel에서 오지 않으면 공격자가 payload와 hash를 함께 바꿀 수 있어 authenticity는 아닙니다." },
  { question: "I/O correctness에 가장 중요한 크기 fixtures는 무엇인가요?", answer: "0·1·buffer-1·buffer·buffer+1·multi-buffer, limit±1과 forced short reads입니다." },
  { question: "recursive cleanup 전에 무엇을 증명해야 하나요?", answer: "그 root를 이번 작업이 새로 소유했고 resolved path의 parent가 허용 temp base이며 기존 collision path가 아님을 증명해야 합니다." },
);

(session.completionChecklist as string[]).push(
  "Path object 생성과 filesystem object 생성을 구분했다.",
  "relative path의 working directory를 명시했다.",
  "resolve 전에 absolute/untrusted grammar를 검사했다.",
  "normalize를 lexical operation으로 설명했다.",
  "toRealPath existence와 link options를 설명했다.",
  "host absolute path를 public golden/log에서 제외했다.",
  "File.toPath migration 경계를 설명했다.",
  "readAttributes로 type·size를 한 observation으로 읽었다.",
  "NOFOLLOW_LINKS와 전체 link security policy를 구분했다.",
  "Files.isSameFile의 I/O 가능성을 처리했다.",
  "metadata check와 후속 open의 TOCTOU를 인식했다.",
  "InputStream.read int0..255와 EOF-1을 구분했다.",
  "EOF를 cast 전에 검사했다.",
  "signed byte를 unsigned view로 변환했다.",
  "OutputStream.write(int)의 low8-bit 규칙을 검증했다.",
  "binary data를 text로 임의 decode하지 않았다.",
  "CREATE·CREATE_NEW 차이를 업무 정책으로 정했다.",
  "TRUNCATE_EXISTING 전에 validation을 완료했다.",
  "APPEND의 concurrent record 한계를 검토했다.",
  "temp-write·verify·publish state machine을 설계했다.",
  "flush와 durability를 구분했다.",
  "stream ownership과 close 책임을 문서화했다.",
  "try-with-resources reverse close를 검증했다.",
  "primary와 suppressed failures를 함께 보존했다.",
  "partial initialization cleanup을 고려했다.",
  "String↔bytes에 explicit charset을 사용했다.",
  "UTF-8 non-ASCII exact bytes를 검증했다.",
  "malformed input replacement/reject 정책을 정했다.",
  "charset·BOM·line ending 정책을 분리했다.",
  "NoSuchFile·AlreadyExists·wrong type을 분류했다.",
  "exception message exact string으로 분기하지 않았다.",
  "retry에 transient·deadline·backoff·idempotency가 있다.",
  "root.resolve(...).normalize Path containment를 검사했다.",
  "문자열 prefix 대신 Path.startsWith를 사용했다.",
  "symlink·junction·hard-link threat를 검토했다.",
  "validate-use race와 handle-relative option을 검토했다.",
  "raw malicious path를 public log에 남기지 않았다.",
  "bulk read의 actual count만 write했다.",
  "forced short-read source로 copy loop를 검증했다.",
  "bounded buffer와 total byte limit을 분리했다.",
  "partial target cleanup과 existing target 보존을 검증했다.",
  "length와 strong digest를 함께 비교했다.",
  "integrity와 authenticity를 구분했다.",
  "expected digest provenance를 검증했다.",
  "0·1·buffer±1·multi-buffer fixtures를 포함했다.",
  "portable unit과 capability integration tests를 분리했다.",
  "independent oracle와 semantic mutation을 사용했다.",
  "unique owned temp root와 bounded cleanup을 검증했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-byte-api", repository: "Java SE 21 API", path: "java.lang.Byte", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Byte.html", usedFor: ["toUnsignedInt", "signed storage", "boundary values"], evidence: "signed byte의 unsigned view 근거입니다." },
  { id: "java-message-digest", repository: "Java SE 21 API", path: "java.security.MessageDigest", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html", usedFor: ["SHA-256", "digest", "isEqual"], evidence: "copy integrity fingerprint 근거입니다." },
  { id: "java-file-channel", repository: "Java SE 21 API", path: "java.nio.channels.FileChannel", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html", usedFor: ["force", "positioned I/O", "durability caveat"], evidence: "stream copy 이후 durability/channel 확장 근거입니다." },
  { id: "java-standard-copy-option", repository: "Java SE 21 API", path: "java.nio.file.StandardCopyOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/StandardCopyOption.html", usedFor: ["ATOMIC_MOVE", "REPLACE_EXISTING", "publish policy"], evidence: "verified temp artifact publish options 근거입니다." },
  { id: "java-atomic-move-not-supported", repository: "Java SE 21 API", path: "java.nio.file.AtomicMoveNotSupportedException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/AtomicMoveNotSupportedException.html", usedFor: ["capability failure", "cross-filesystem fallback"], evidence: "atomic publish 지원 여부 분류 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "short-read adversarial stream, length+SHA-256와 portable boundary matrix로 correctness oracle을 완성했습니다.",
  "Java positive examples11은 OpenJDK21 -proc:none -Xlint:all compiler output0와 exact stable stdout을 요구합니다.",
  "공개 실행 결과는 relative names·counts·hex/digest·booleans만 포함하고 host path와 raw user payload를 제외합니다.",
);
