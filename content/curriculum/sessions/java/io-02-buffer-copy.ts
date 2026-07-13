import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["io-02-buffer-copy"],
  slug: "io-02-buffer-copy",
  courseId: "java",
  moduleId: "java-systems",
  order: 31,
  title: "버퍼와 무손실 바이너리 복사",
  subtitle: "buffering의 비용 모델부터 부분 읽기·무결성·원자 publish·fault injection까지 copy pipeline을 완성합니다.",
  level: "중급",
  estimatedMinutes: 1080,
  coreQuestion: "큰 binary를 제한된 memory로 빠르게 복사하면서 마지막 짧은 block, 중간 실패, 취소와 crash에서도 기존 target과 무결성을 어떻게 보존할까요?",
  summary: "class14 package9 중 io-02 인벤토리는 Ex03_BufferedOutputStream·Ex05_BufferedInputStream·Ex06_FileCopy 세 파일입니다. package9와 inventory3을 원본 그대로 OpenJDK21 warning0 compile하고, original absolute path literals4만 공백 포함 owned temp fixture로 옮긴 copies3을 다시 compile합니다. Ex03은 default-charset text를 buffered output으로 exact41 UTF-8 bytes에 쓰고, Ex05는 그41 bytes를 byte별 char+line으로 읽으며, Ex06은 binary input을 한 byte씩 읽고 매 byte마다 flush해 output으로 복사합니다. 감사를 위해 Ex06 input을 deterministic4097 bytes로 만들고 output length·SHA-256·bytes equality와 stdout0을 두 launcher modes에서 확인합니다. 원본의 buffering wrapper 사용은 보존하되, per-byte I/O·loop flush·manual double close는 개선 chapters에서 bulk actual-count loop, buffer sizing, Files.copy/transferTo, incremental digest, limit/cancel, owned temp→atomic publish, large-file long accounting, metadata policy, benchmark와 fault-injection matrix로 확장합니다.",
  objectives: [
    "BufferedInputStream/OutputStream의 decorator 구조와 flush·close·ownership을 설명한다.",
    "bulk read의 actual count만 write해 empty·short-read·buffer±1·multi-buffer 파일을 무손실 복사한다.",
    "manual loop·transferTo·Files.copy의 기능, 제어 가능성·partial target semantics를 비교한다.",
    "buffer size·system calls·heap allocation·storage throughput을 correctness와 분리해 측정한다.",
    "length·incremental SHA-256·Files.mismatch로 무결성과 first-difference evidence를 만든다.",
    "size limit·progress·cancellation과 temp→verify→atomic publish state machine을 구현한다.",
    "large-file long accounting, metadata policy와 injected read/write/close failures를 검증한다.",
  ],
  prerequisites: [
    { title: "File·Path와 byte/EOF", reason: "buffered copy도 path ownership, EOF-1, actual read count와 open modes 계약 위에 있습니다.", sessionSlug: "io-01-file-bytes" },
    { title: "예외 정리와 suppressed failure", reason: "중간 copy와 close/cleanup 실패를 함께 보존해야 partial target을 안전하게 처리할 수 있습니다.", sessionSlug: "core-03-finally-throws" },
  ],
  keywords: ["BufferedInputStream", "BufferedOutputStream", "decorator", "buffer", "bulk read", "actual count", "flush", "close", "binary copy", "transferTo", "Files.copy", "Files.mismatch", "SHA-256", "progress", "cancellation", "size limit", "temporary file", "atomic move", "COPY_ATTRIBUTES", "large file", "long counter", "fault injection", "benchmark"],
  chapters: [
    {
      id: "class14-package9-inventory3-buffer-copy-audit",
      title: "class14 package9·inventory3과 relocated buffer/copy 원본을 exact41·4097 bytes로 감사합니다",
      lead: "원본 API·payload·per-byte flush behavior는 보존하되 machine paths만 owned temp로 바꾸고 text와 arbitrary binary를 각각 독립 byte oracle로 검증합니다.",
      explanations: [
        "io-02 inventory는 Ex03·Ex05·Ex06이고 class14 package는9 public mains입니다. package 전체 compile로 다음 character-I/O 세션과 dependency drift를 확인하면서 execution은 이 세 files로 제한합니다.",
        "Ex03 active shape는 File1·FileOutputStream1·BufferedOutputStream1·write1·flush1·close2·getBytes1·absolute literal1입니다. UTF-8 child에서 Korea와 한글 payload는 exact41 bytes이며 stdout은0입니다.",
        "Ex05는 File1·FileInputStream1·BufferedInputStream1·read1·close2·literal1입니다. Ex03 file의 각 raw byte를 char cast하고 println하므로 expected stdout은41 byte values에서 독립 생성합니다.",
        "Ex06은 File2, raw input/output1씩, buffered input/output1씩, read/write/flush1씩, close4와 literals2를 가집니다. flush가 loop 안이라4097 times 호출되지만 stdout은0입니다.",
        "binary fixture는 index*31을 low8 bits로 만든4097 bytes입니다. text decode나 file extension에 의존하지 않고 source/target exact bytes, length와 SHA-256을 비교해 0x00·0xFF와 마지막1byte까지 보존합니다.",
        "known literals는 길이 내림차순으로 존재 확인 후 audit root 아래 paths로만 치환합니다. original sources와 relocated copies를 모두 warning0 compile해 transformation이 syntax/dependency를 숨기지 않게 합니다.",
        "baseline/hostile modes에서 launcher option4를 child environment에서 제거합니다. Java default charset은 -Dfile.encoding=UTF-8로 고정해 Ex03 getBytes 결과를 reproducible evidence로 만듭니다.",
        "process helper는 concurrent UTF-8 stdout/stderr drain, closed stdin, timeout10s, descendant tree kill, grace5s와 Dispose를 적용합니다. compile은 exit0뿐 아니라 compiler output0을 요구합니다.",
        "outer cleanup은 direct-child temp ownership을 검사하고 variable별 restore와 body/cleanup errors를 함께 보존합니다. 원본 locations와 directory contents는 실행·게시하지 않습니다.",
      ],
      concepts: [
        { term: "buffered decorator", definition: "기존 stream을 감싸 memory buffer와 bulk behavior를 더하는 wrapper입니다.", detail: ["underlying stream이 필요합니다.", "outer wrapper가 lifecycle을 소유합니다."] },
        { term: "binary oracle", definition: "문자 해석 없이 expected byte generator·length·digest로 copy 결과를 판단하는 기준입니다.", detail: ["0x00/FF를 포함합니다.", "extension에 의존하지 않습니다."] },
        { term: "relocated execution", definition: "원본의 알려진 location literals만 소유 temp로 옮겨 외부 state mutation을 제한한 실행입니다.", detail: ["원본도 별도 compile합니다.", "API shape와 exact result를 함께 확인합니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-io02-audit",
        title: "buffered text41 bytes와 binary4097 copy를 package/inventory/relocated scopes·두 modes에서 검증합니다",
        language: "powershell",
        filename: "verify-original-io02.ps1",
        purpose: "원본 external paths를 건드리지 않고 Ex03·Ex05·Ex06의 byte behavior와 inefficient flush shape까지 사실대로 보존합니다.",
        code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference = 'Stop'
$optionNames = @('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved = @{}
foreach ($name in $optionNames) {
  $item = Get-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
  $saved[$name] = @{ Exists = $null -ne $item; Value = if ($item) { $item.Value } else { $null } }
}
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("io02 audit " + [Guid]::NewGuid().ToString('N'))
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
  $process = [Diagnostics.Process]::new(); $process.StartInfo = $start
  try {
    if (-not $process.Start()) { throw 'process start failed' }
    $outTask = $process.StandardOutput.ReadToEndAsync(); $errTask = $process.StandardError.ReadToEndAsync()
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
  $args = @('-encoding','UTF-8','--release','21','-proc:none','-g:source,lines','-Xlint:all','-XDrawDiagnostics','-d',$classes) + @($files.FullName)
  $result = Invoke-Child 'javac' $args $root
  if ($result.Exit -ne 0 -or $result.Out.Length -ne 0 -or $result.Err.Length -ne 0) { throw 'compile failed or warned' }
}
function Run([string]$classes, [string]$main) {
  $result = Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,("com.java.class14." + $main)) $root
  if ($result.Exit -ne 0 -or $result.Err.Length -ne 0) { throw "$main process drift" }
  return $result.Out
}
function Remove-JavaComments([string]$text) {
  return [regex]::Replace(([regex]::Replace($text, '(?s)/\*.*?\*/', '')), '(?m)//.*$', '')
}
function Java-Literal([string]$path) { return $path.Replace('\','\\') }
function Write-Relocated([IO.FileInfo]$file, [string]$destination, [hashtable]$replacements) {
  $text = [IO.File]::ReadAllText($file.FullName)
  foreach ($entry in @($replacements.GetEnumerator() | Sort-Object { $_.Key.Length } -Descending)) {
    if (-not $text.Contains($entry.Key)) { throw 'relocation literal missing' }
    $replacementPath = [IO.Path]::GetFullPath($entry.Value)
    $rootPrefix = [IO.Path]::GetFullPath($root).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $replacementPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'replacement outside audit root' }
    $text = $text.Replace($entry.Key, (Java-Literal $entry.Value))
    if ($text.Contains($entry.Key)) { throw 'relocation literal survived' }
  }
  [IO.File]::WriteAllText($destination, $text, [Text.UTF8Encoding]::new($false))
}
function Audit([string]$mode, [string]$classDir) {
  if ($mode -eq 'hostile') {
    $env:JDK_JAVAC_OPTIONS = '-J-Dio02.audit=javac'; $env:JDK_JAVA_OPTIONS = '-Dio02.audit=java'
    $env:JAVA_TOOL_OPTIONS = '-Dio02.audit=tool'; $env:_JAVA_OPTIONS = '-Dio02.audit=legacy'
  } else { foreach ($name in $optionNames) { Remove-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue } }
  $all = @(Get-ChildItem -LiteralPath $classDir -Filter '*.java' | Sort-Object Name)
  $inventoryNames = @('Ex03_BufferedOutputStream.java','Ex05_BufferedInputStream.java','Ex06_FileCopy.java')
  $inventory = @($inventoryNames | ForEach-Object { Get-Item -LiteralPath (Join-Path $classDir $_) })
  if ($all.Count -ne 9 -or $inventory.Count -ne 3) { throw 'source inventory drift' }
  Compile $all (Join-Path $root ("package-" + $mode)); Compile $inventory (Join-Path $root ("inventory-" + $mode))
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { ([IO.File]::ReadAllText($_.FullName)) -match $mainPattern }).Count
  $inventoryMains = @($inventory | Where-Object { ([IO.File]::ReadAllText($_.FullName)) -match $mainPattern }).Count
  if ($packageMains -ne 9 -or $inventoryMains -ne 3) { throw 'main role drift' }

  $fixture = Join-Path $root ("fixture-" + $mode); $sourceCopy = Join-Path $root ("source-" + $mode)
  New-Item -ItemType Directory -Path $fixture,$sourceCopy -ErrorAction Stop | Out-Null
  $textFile = Join-Path $fixture 'test02.txt'; $inputBin = Join-Path $fixture 'image01.bin'; $outputBin = Join-Path $fixture 'copy.bin'
  foreach ($index in 0,1) {
    Write-Relocated $inventory[$index] (Join-Path $sourceCopy $inventory[$index].Name) @{ 'D:\\util\\test02.txt' = $textFile }
  }
  Write-Relocated $inventory[2] (Join-Path $sourceCopy $inventory[2].Name) @{ 'D:\\util\\image01.png' = $inputBin; 'D:\\test01.png' = $outputBin }
  $relocated = @(Get-ChildItem -LiteralPath $sourceCopy -Filter '*.java' | Sort-Object Name)
  $relocatedClasses = Join-Path $root ("relocated-" + $mode); Compile $relocated $relocatedClasses

  if ((Run $relocatedClasses 'Ex03_BufferedOutputStream').Length -ne 0) { throw 'Ex03 stdout drift' }
  $expectedText = [Text.Encoding]::UTF8.GetBytes('Korea 대한민국 화이팅 10위 목표')
  if ($expectedText.Length -ne 41 -or [Convert]::ToHexString([IO.File]::ReadAllBytes($textFile)) -cne [Convert]::ToHexString($expectedText)) { throw 'Ex03 byte drift' }
  $expectedRead = [Text.StringBuilder]::new(); foreach ($byte in $expectedText) { [void]$expectedRead.Append([char]$byte).Append($nl) }
  if ((Run $relocatedClasses 'Ex05_BufferedInputStream') -cne $expectedRead.ToString()) { throw 'Ex05 output drift' }
  $binary = [byte[]]::new(4097); for ($index = 0; $index -lt $binary.Length; $index++) { $binary[$index] = [byte](($index * 31) -band 255) }
  [IO.File]::WriteAllBytes($inputBin, $binary)
  if ((Run $relocatedClasses 'Ex06_FileCopy').Length -ne 0) { throw 'Ex06 stdout drift' }
  $copied = [IO.File]::ReadAllBytes($outputBin)
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $sameHash = [Convert]::ToHexString($sha.ComputeHash($binary)) -ceq [Convert]::ToHexString($sha.ComputeHash($copied)) } finally { $sha.Dispose() }
  if ($copied.Length -ne 4097 -or -not $sameHash -or [Convert]::ToHexString($copied) -cne [Convert]::ToHexString($binary)) { throw 'Ex06 copy drift' }

  $active = @{}; foreach ($file in $inventory) { $active[$file.Name] = Remove-JavaComments ([IO.File]::ReadAllText($file.FullName)) }
  $joined = $active.Values -join $nl
  $shape = @{
    file=([regex]::Matches($joined,'new\s+File\s*\(')).Count; fos=([regex]::Matches($joined,'new\s+FileOutputStream\s*\(')).Count
    fis=([regex]::Matches($joined,'new\s+FileInputStream\s*\(')).Count; bos=([regex]::Matches($joined,'new\s+BufferedOutputStream\s*\(')).Count
    bis=([regex]::Matches($joined,'new\s+BufferedInputStream\s*\(')).Count; read=([regex]::Matches($joined,'\.read\s*\(')).Count
    write=([regex]::Matches($joined,'\.write\s*\(')).Count; flush=([regex]::Matches($joined,'\.flush\s*\(')).Count
    close=([regex]::Matches($joined,'\.close\s*\(')).Count; getBytes=([regex]::Matches($joined,'\.getBytes\s*\(')).Count
    paths=([regex]::Matches($joined,'[A-Za-z]:\\\\')).Count
  }
  if ($shape.file -ne 4 -or $shape.fos -ne 2 -or $shape.fis -ne 2 -or $shape.bos -ne 2 -or $shape.bis -ne 2 -or $shape.read -ne 2 -or $shape.write -ne 2 -or $shape.flush -ne 2 -or $shape.close -ne 8 -or $shape.getBytes -ne 1 -or $shape.paths -ne 4) { throw 'source shape drift' }
  return "package=9|inventory=3|relocated=3|mains=$packageMains,$inventoryMains,3|compiler=0;outputs=Ex03:41bytes|Ex05:41bytes|Ex06:4097bytes;shapes=File:4|raw:2,2|buffered:2,2|read:2|write:2|flush:2|close:8|getBytes:1;paths=4->temp"
}

try {
  if (Test-Path -LiteralPath $root) { throw 'unexpected temp collision' }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; $ownsRoot = $true
  $classDir = Join-Path ([IO.Path]::GetFullPath($SourceRoot)) 'src/com/java/class14'
  $baseline = Audit 'baseline' $classDir; $hostile = Audit 'hostile' $classDir
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
          { lines: "1-14", explanation: "launcher snapshots와 공백 temp ownership/error state를 준비합니다." },
          { lines: "15-68", explanation: "bounded child process, compile/run, comment removal과 audit-root-only relocation helpers를 정의합니다." },
          { lines: "69-82", explanation: "package9·inventory3 warning0 compile과 main roles9/3을 확인합니다." },
          { lines: "84-92", explanation: "mode별 text/binary paths로 exact literals4를 치환하고 relocated3을 compile합니다." },
          { lines: "94-105", explanation: "Ex03 exact41 bytes, Ex05 byte-derived output과 Ex06 deterministic4097 binary equality/hash를 검증합니다." },
          { lines: "107-118", explanation: "comments 제거 active wrapper/read/write/flush/close shapes를 검증합니다." },
          { lines: "121-154", explanation: "두 modes 비교, launcher restore와 direct-child cleanup failure aggregation을 수행합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy2/classstudy source root", "baseline+hostile launcher modes", "timeout10s+grace5s"], command: "pwsh -NoProfile -File verify-original-io02.ps1 -SourceRoot <classstudy-root>" },
        output: { value: "spacePath=True,modes=2|same=True,package=9|inventory=3|relocated=3|mains=9,3,3|compiler=0;outputs=Ex03:41bytes|Ex05:41bytes|Ex06:4097bytes;shapes=File:4|raw:2,2|buffered:2,2|read:2|write:2|flush:2|close:8|getBytes:1;paths=4->temp\nprivacy=original-paths:not-run|fixture:owned-temp;launcherOptions=4", explanation: ["세 compile scopes가 warning0입니다.", "text41와 binary4097 bytes가 두 modes에서 같습니다.", "원본 locations는 실행하지 않고 temp direct-child만 변경합니다."] },
        experiments: [
          { change: "Ex06 input의 마지막1byte를 빼고 expected4097을 유지합니다.", prediction: "length/hash/exact equality가 실패합니다.", result: "extension이나 성공 exit가 아닌 byte oracle이 copy를 판정합니다." },
          { change: "Ex06 loop의 flush를 제거합니다.", prediction: "close가 buffer를 flush해 bytes는 같고 source shape만 달라집니다.", result: "correctness와 performance smell을 서로 다른 evidence로 봅니다." },
          { change: "Ex05를 UTF-8 text 정상 출력이라고 설명합니다.", prediction: "byte-to-char output oracle과 맞지 않습니다.", result: "buffering은 decoding을 추가하지 않으며 io-03 reader가 필요합니다." },
        ],
        sourceRefs: ["java-class14-ex01", "java-class14-ex02", "java-class14-ex03", "java-class14-ex04", "java-class14-ex05", "java-class14-ex06", "java-class14-ex07", "java-class14-ex08", "java-class14-ex09", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "원본 binary copy를 검증하려다 사용자 drive의 기존 file을 덮어쓴다.", likelyCause: "absolute output literal과 FileOutputStream truncate behavior를 audit ownership 밖에서 실행했습니다.", checks: ["input/output literals와 open modes를 scan합니다.", "target existing 여부와 owner를 봅니다.", "audit root parent를 검증합니다."], fix: "known literals만 unique owned temp로 치환하고 original은 compile-only로 둡니다.", prevention: "path inventory·collision stop·bounded cleanup과 public privacy scan을 gate로 둡니다." },
        { symptom: "BufferedInputStream을 썼는데 한글이 여전히 깨진다.", likelyCause: "buffer는 bytes를 모을 뿐 charset decoding을 하지 않습니다.", checks: ["read result를 char cast하는지 봅니다.", "source UTF-8 bytes를 확인합니다.", "Reader/InputStreamReader boundary가 있는지 봅니다."], fix: "binary copy에는 bytes를 유지하고 text는 io-03에서 explicit charset Reader로 decode합니다.", prevention: "buffering·decoding responsibilities를 type/API review에 포함합니다." },
      ],
      expertNotes: ["per-byte flush는 source fidelity를 위해 감사하지만 개선 예제로 복사하지 않습니다. buffer가 가득 찰 때와 final close/explicit transaction boundary에서만 flush하는 비용 모델을 검증합니다.", "source/target SHA-256만 같으면 이번 copy의 integrity는 강하게 확인하지만 trusted provenance와 crash durability는 별도입니다."],
    },
  ],
  lab: {
    title: "대용량 artifact를 제한·digest·progress와 원자 publish를 갖춰 복사하는 pipeline",
    scenario: "caller-owned InputStream을 tenant sandbox의 server-generated target에 복사하되 max bytes, cancellation, SHA-256와 existing-target 보존을 보장합니다.",
    setup: ["unique owned temp root와 final target collision fixtures를 만듭니다.", "0·1·8191·8192·8193·large deterministic payload와 short/failing streams를 준비합니다.", "atomic move 지원/미지원, close failure와 cancellation points를 준비합니다."],
    steps: ["CREATE_NEW temp를 final과 같은 filesystem에 만듭니다.", "bounded buffer loop에서 actual count만 쓰고 long total·incremental digest를 갱신합니다.", "각 iteration에서 deadline/cancel과 max bytes를 검사합니다.", "output close 뒤 length·digest를 검증합니다.", "final collision/idempotency policy를 적용하고 ATOMIC_MOVE publish를 시도합니다.", "지원되지 않는 fallback의 crash/replace semantics를 명시합니다.", "failure/cancel에서는 owned temp만 삭제하고 기존 final은 보존합니다.", "safe progress·phase·duration·bytes metrics를 기록합니다."],
    expectedResult: ["boundary sizes와 forced short reads가 exact hash를 냅니다.", "limit/cancel/write/close failure에서 partial final target이 없습니다.", "기존 target은 policy 없이 truncate되지 않습니다.", "memory는 buffer+fixed metadata bound 안에 있습니다.", "public log에 host path나 binary contents가 없습니다."],
    cleanup: ["stream scope 종료 뒤 owned temp를 bounded 삭제합니다.", "cleanup failure를 primary failure와 함께 보존합니다."],
    extensions: ["FileChannel.transferTo/transferFrom과 sparse files를 비교합니다.", "object storage multipart checksum·resume로 확장합니다.", "JMH/JFR/OS counters로 buffer crossover를 측정합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "1byte loop를8192byte bulk loop로 바꾸고 actual count를 검증합니다.", requirements: ["EOF-1을 사용합니다.", "write(buffer,0,count)를 사용합니다.", "buffer±1과 empty를 테스트합니다.", "source/target hash를 비교합니다."], hints: ["마지막 block은 buffer보다 짧습니다.", "flush를 loop 밖으로 옮깁니다."], expectedOutcome: "모든 크기에서 무손실이고 read/write calls가 줄어듭니다.", solutionOutline: ["bounded buffer를 할당합니다.", "count loop를 구현합니다.", "length/hash와 call counts를 비교합니다."] },
    { difficulty: "응용", prompt: "max size와 협력 cancellation이 있는 digesting copy를 구현합니다.", requirements: ["long total을 사용합니다.", "limit 초과 전에/후 side effects를 정의합니다.", "cancel check와 interrupted policy를 명시합니다.", "partial temp cleanup을 검증합니다."], hints: ["caller-owned input close 책임을 정합니다.", "final target에 직접 쓰지 않습니다."], expectedOutcome: "limit·cancel에서도 기존 target과 resource ownership이 보존됩니다.", solutionOutline: ["copy state를 temp에 격리합니다.", "iteration마다 total/digest/cancel을 갱신합니다.", "success만 publish합니다."] },
    { difficulty: "설계", prompt: "Files.copy·transferTo·manual loop 중 production artifact publish 구현을 선택하고 검증합니다.", requirements: ["size limit·progress·digest·cancellation 요구를 표로 비교합니다.", "atomic move capability와 fallback을 정합니다.", "metadata/permissions 정책을 명시합니다.", "large/sparse/network filesystem과 failure matrix를 포함합니다.", "benchmark 방법과 관찰 metrics를 설계합니다."], hints: ["가장 짧은 API가 항상 가장 제어 가능한 것은 아닙니다.", "throughput과 durability를 분리합니다."], expectedOutcome: "요구사항 기반 copy engine과 failure-safe publish contract가 됩니다.", solutionOutline: ["capability/requirement matrix를 만듭니다.", "chosen primitive를 bounded state machine에 넣습니다.", "fault injection과 OS matrix로 검증합니다."] },
  ],
  reviewQuestions: [
    { question: "BufferedInputStream은 file을 한 번에 memory에 올리나요?", answer: "아닙니다. bounded internal buffer로 underlying reads를 묶으며 전체 file 크기만큼 반드시 할당하지 않습니다." },
    { question: "BufferedOutputStream.flush를 매 write마다 호출하면 어떤가요?", answer: "correctness는 유지될 수 있지만 batching 이점을 없애 underlying writes/system calls를 늘립니다." },
    { question: "close가 flush도 수행하나요?", answer: "BufferedOutputStream close는 flush 후 underlying stream을 닫지만 close/durability failure를 처리해야 합니다." },
    { question: "wrapper와 raw stream을 둘 다 닫아야 하나요?", answer: "보통 outer wrapper 하나가 underlying stream을 소유해 닫습니다. 수동 이중 close보다 try-with-resources ownership을 명확히 합니다." },
    { question: "buffer size가 크면 항상 빠른가요?", answer: "아닙니다. syscall 감소와 heap/cache/latency tradeoff가 있어 workload·storage·concurrency로 측정합니다." },
    { question: "binary copy에 Reader/Writer를 써도 되나요?", answer: "안 됩니다. charset decode/encode와 newline 처리로 arbitrary bytes가 달라질 수 있습니다." },
    { question: "copy 성공 exit만으로 무결성이 증명되나요?", answer: "아닙니다. length와 digest 또는 independent byte comparison이 필요합니다." },
    { question: "Files.copy는 existing target을 자동 보존하나요?", answer: "options에 따라 다릅니다. REPLACE_EXISTING을 주지 않으면 collision failure가 일반적이며 partial failure semantics도 처리합니다." },
    { question: "progress percent는 source size만 알면 정확한가요?", answer: "source가 변하거나 reported size가 신뢰되지 않으면 부정확할 수 있어 bytes copied와 verified total을 구분합니다." },
    { question: "partial temp가 남아도 final target만 온전하면 괜찮나요?", answer: "quota·privacy·재시도 충돌을 만들므로 owned orphan cleanup과 age/owner reconciliation 정책이 필요합니다." },
  ],
  completionChecklist: [
    "class14 package9와 io-02 inventory3을 warning0 compile했다.", "package/inventory mains9/3을 확인했다.",
    "absolute literals4와 wrapper/read/write/flush/close shapes를 확인했다.", "original locations는 실행하지 않았다.",
    "relocated Ex03 exact41 UTF-8 bytes와 stdout0을 검증했다.", "Ex05 byte-derived stdout을 검증했다.",
    "Ex06 deterministic4097 bytes의 length·hash·exact equality를 검증했다.", "baseline/hostile launcher4 isolation을 검증했다.",
    "timeout·tree kill·async drains·Dispose를 적용했다.", "direct-child cleanup과 failure aggregation을 적용했다.",
    "buffering과 charset decoding을 구분했다.", "모든 synthetic Java examples를 JDK21 warning0·exact output으로 검증한다.",
  ],
  nextSessions: ["io-03-reader-writer"],
  sources: [
    { id: "java-class14-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex01_FileClass.java", usedFor: ["package compile", "io-01 boundary"], evidence: "class14 package warning0와 이전 File boundary를 확인했습니다." },
    { id: "java-class14-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex02_FileOutputStream.java", usedFor: ["package compile", "raw output baseline"], evidence: "package warning0와 raw output 대비 근거입니다." },
    { id: "java-class14-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex03_BufferedOutputStream.java", usedFor: ["buffered output", "exact41 bytes", "flush shape"], evidence: "relocated exact41 bytes·write1·flush1·close2를 확인했습니다." },
    { id: "java-class14-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex04_FileInputStream.java", usedFor: ["package compile", "raw input baseline"], evidence: "package warning0와 raw input 대비 근거입니다." },
    { id: "java-class14-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex05_BufferedInputStream.java", usedFor: ["buffered input", "byte-derived output"], evidence: "relocated41 bytes read·read1·close2를 확인했습니다." },
    { id: "java-class14-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex06_FileCopy.java", usedFor: ["binary copy", "per-byte flush", "exact4097"], evidence: "deterministic4097-byte input/output equality와 wrapper shapes를 확인했습니다." },
    { id: "java-class14-ex07", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex07_FileWriter.java", usedFor: ["package compile", "io-03 handoff"], evidence: "package warning0에 포함하고 character output을 다음 세션으로 인계합니다." },
    { id: "java-class14-ex08", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex08_FileReader.java", usedFor: ["package compile", "io-03 handoff"], evidence: "package warning0에 포함하고 line reading을 다음 세션으로 인계합니다." },
    { id: "java-class14-ex09", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex09_FileCopy.java", usedFor: ["package compile", "text-copy contrast"], evidence: "package warning0에 포함하고 character copy semantics를 다음 세션으로 분리합니다." },
    { id: "jdk21-javac", repository: "Java SE 21 tools", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-proc:none", "-Xlint:all", "-XDrawDiagnostics"], evidence: "compiler output0 contract입니다." },
    { id: "powershell-environment", repository: "Microsoft PowerShell docs", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "restore"], evidence: "environment isolation 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirects", "working directory"], evidence: "child process construction 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child launcher isolation"], evidence: "child environment removal 근거입니다." },
    { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "Dispose"], evidence: "bounded process lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent drains"], evidence: "redirect pipe drain 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 9, filesUsed: 9, uncoveredFiles: [],
    uncoveredNotes: ["class14 package9를 모두 읽고 io-02 inventory3과 다음 character sessions를 분리했습니다.", "원본의 default charset·manual double close·loop flush는 사실대로 보존하고 개선 chapters에서 교정합니다.", "host paths와 real binary contents는 공개하지 않고 generated byte fixtures를 사용합니다."],
  },
} satisfies DetailedSession;

export default session;

const copyFoundationChapters: DetailedSession["chapters"] = [
  {
    id: "buffer-decorator-capacity-flush-close",
    title: "buffer decorator의 capacity flush·explicit flush·close를 underlying calls로 관찰합니다",
    lead: "버퍼는 단순히 '빠르게 한다'가 아니라 작은 writes를 memory에 모아 underlying I/O 경계를 바꾸는 decorator입니다. 언제 실제 sink로 전달되는지 계측합니다.",
    explanations: [
      "BufferedOutputStream은 OutputStream을 상속하고 다른 OutputStream을 감싸는 decorator입니다. application API는 같지만 작은 write가 즉시 underlying write가 되지 않을 수 있습니다.",
      "buffer가 가득 차기 전 bytes는 Java process memory에 머물 수 있습니다. 다른 process가 file을 읽거나 crash가 나면 아직 관찰되지 않을 수 있어 logical transaction boundary에서 flush/close가 중요합니다.",
      "capacity를 넘기는 write, explicit flush와 close는 buffer를 underlying stream으로 내립니다. 정확한 internal batching은 JDK implementation detail에 과결합하지 말고 semantic visibility와 measured calls를 구분합니다.",
      "BufferedInputStream은 larger underlying reads를 미리 수행해 subsequent small reads를 memory에서 제공합니다. mark/reset support와 readlimit도 wrapper별 contract를 확인합니다.",
      "buffer wrapper가 underlying stream을 소유하면 outermost wrapper만 try-with-resources에 두는 구조가 단순합니다. raw stream을 별도 close하면 redundant failure와 ownership 혼란이 생깁니다.",
      "flush를 inner loop마다 호출하면 small writes batching이 사라집니다. protocol message boundary나 interactive latency 요구가 없으면 buffer capacity/close에 맡기고 performance를 측정합니다.",
      "flush는 downstream wrapper도 연쇄 호출하지만 disk durability와 같지 않습니다. compression/encryption wrapper는 finish/final tag 같은 별도 completion semantics가 있을 수 있습니다.",
      "buffer size constructor argument는 positive여야 하고 지나치게 큰 per-request buffers는 high concurrency에서 heap pressure를 만듭니다. single-request throughput과 fleet memory를 함께 봅니다.",
      "예제는 counting sink로 underlying write/close calls와 final bytes를 동시에 확인합니다. 실제 시간은 noisy하므로 correctness unit test에서 milliseconds를 golden으로 쓰지 않습니다.",
    ],
    concepts: [
      { term: "decorator stream", definition: "같은 stream interface를 유지하면서 buffering·digest·compression 같은 behavior를 덧붙이는 wrapper입니다.", detail: ["underlying stream을 감쌉니다.", "close ownership을 결정합니다."] },
      { term: "capacity flush", definition: "buffer가 새 data를 수용하기 위해 현재 bytes를 underlying sink로 전달하는 내부 동작입니다.", detail: ["application flush와 구분합니다.", "batch size에 영향을 줍니다."] },
      { term: "visibility boundary", definition: "buffered bytes를 다음 I/O layer가 관찰할 수 있게 전달하는 시점입니다.", detail: ["flush/close가 관련됩니다.", "durability와 같지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-buffered-flush-observation",
      title: "4byte buffer의 capacity·explicit flush·close를 counting sink로 검증합니다",
      language: "java",
      filename: "BufferedFlushObservation.java",
      purpose: "small writes가 언제 underlying write calls로 묶이고 close가 ownership을 종료하는지 exact counts로 관찰합니다.",
      code: `import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.util.HexFormat;

public class BufferedFlushObservation {
    static final class CountingSink extends OutputStream {
        private final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        private int writeCalls;
        private int closeCalls;

        @Override public void write(int value) { writeCalls++; bytes.write(value); }
        @Override public void write(byte[] buffer, int offset, int length) {
            writeCalls++;
            bytes.write(buffer, offset, length);
        }
        @Override public void close() { closeCalls++; }
    }

    public static void main(String[] args) throws Exception {
        CountingSink sink = new CountingSink();
        try (BufferedOutputStream output = new BufferedOutputStream(sink, 4)) {
            output.write(new byte[] {1, 2, 3});
            System.out.println("beforeCapacityFlushCalls=" + sink.writeCalls);
            output.write(4);
            output.write(5);
            System.out.println("afterCapacityFlushCalls=" + sink.writeCalls);
            output.flush();
            System.out.println("afterExplicitFlushCalls=" + sink.writeCalls);
        }
        System.out.println("hex=" + HexFormat.of().withUpperCase().formatHex(sink.bytes.toByteArray()));
        System.out.println("closeCalls=" + sink.closeCalls);
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "buffer wrapper, in-memory sink, base interface와 stable hex를 import합니다." },
        { lines: "7-18", explanation: "underlying bulk/single write와 close calls를 세면서 exact bytes를 보존하는 sink를 정의합니다." },
        { lines: "21-31", explanation: "4byte capacity 전·초과 후·explicit flush 후 calls를 관찰하고 try scope로 close합니다." },
        { lines: "32-33", explanation: "최종 exact bytes와 underlying close ownership을 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("BufferedFlushObservation.java", "BufferedFlushObservation") },
      output: { value: "beforeCapacityFlushCalls=0\nafterCapacityFlushCalls=1\nafterExplicitFlushCalls=2\nhex=0102030405\ncloseCalls=1", explanation: ["첫3bytes는 memory에 머뭅니다.", "5번째 write 전에4bytes가 한 번 전달됩니다.", "explicit flush가 남은1byte를 전달하고 close가 sink를 한 번 닫습니다."] },
      experiments: [
        { change: "각 output.write 뒤 flush를 호출합니다.", prediction: "underlying writeCalls가 small writes 수만큼 늘어 batching이 사라집니다.", result: "원본 Ex06 loop flush의 비용을 계측할 수 있습니다." },
        { change: "buffer size를8로 바꿉니다.", prediction: "capacity flush 없이 explicit flush에서5bytes가 한 번 전달됩니다.", result: "buffer size는 batching boundary를 바꿉니다." },
        { change: "try scope를 제거하고 close하지 않습니다.", prediction: "마지막 buffered bytes와 close ownership이 보장되지 않습니다.", result: "success path에도 lifecycle boundary가 필요합니다." },
      ],
      sourceRefs: ["java-buffered-output-stream", "java-buffered-input-stream", "java-output-stream", "java-auto-closeable", "java-hex-format", "java-class14-ex03", "java-class14-ex06"],
    }],
    diagnostics: [
      { symptom: "BufferedOutputStream을 추가했는데 throughput이 오히려 느리다.", likelyCause: "inner loop에서 매 byte마다 flush해 batching을 무효화했습니다.", checks: ["flush call 위치/count를 봅니다.", "underlying writes/syscalls를 측정합니다.", "message latency requirement를 확인합니다."], fix: "bulk write와 logical boundary/close에서만 flush하고 workload로 측정합니다.", prevention: "write/flush call-count regression과 JMH/OS counter benchmark를 둡니다." },
      { symptom: "success return 직후 다른 process가 file tail을 보지 못한다.", likelyCause: "buffered stream을 flush/close하기 전에 success를 publish했습니다.", checks: ["try scope 종료 시점을 봅니다.", "outermost wrapper ownership을 확인합니다.", "async handoff 순서를 조사합니다."], fix: "close 성공 뒤 verify/publish하고 close failure를 업무 실패로 처리합니다.", prevention: "consumer visibility와 injected close failure tests를 둡니다." },
    ],
    expertNotes: ["JDK BufferedOutputStream may bypass its buffer for a large write, but code should depend on OutputStream semantics rather than an exact private algorithm unless benchmarking a pinned runtime.", "double buffering can be harmless or wasteful. Files.newInputStream+BufferedInputStream, framework buffers와 OS page cache layers를 inventory한 뒤 measure합니다."],
  },
  {
    id: "bulk-copy-actual-count-boundaries",
    title: "8192byte bulk loop에서 마지막1byte actual count를 정확히 씁니다",
    lead: "buffer 전체를 write하는 classic corruption을8193byte fixture로 드러내고, 읽기 partition과 output hash를 독립적으로 검증합니다.",
    explanations: [
      "binary copy의 core invariant는 EOF까지 각 positive read count에 대해 같은 buffer 앞 count bytes를 같은 순서로 한 번 write하는 것입니다.",
      "8193byte source와8192 buffer는 첫 read8192, 마지막 read1, EOF-1을 강제합니다. buffer.length를 쓰는 bug는 target을16384bytes로 늘리고 stale tail을 추가합니다.",
      "InputStream이 buffer를 항상 가득 채우는 것은 아니므로 local file에서 [8192,1]이 나와도 network/filter short-read fixture를 별도로 둡니다.",
      "buffer는 method scope에서 한 번 할당하고 loop마다 새 array를 만들지 않습니다. concurrent copy마다 buffer가 하나씩 생기는 heap upper bound를 계산합니다.",
      "long total은 read count를 누적해 limit/progress와 output length oracle로 씁니다. int total은2GiB 주변에서 overflow할 수 있습니다.",
      "output.flush를 loop 안에서 호출하지 않습니다. close가 final flush를 수행하고 application protocol이 중간 visibility를 요구할 때만 별도 boundary를 정합니다.",
      "source/target bytes를 small test에서는 Arrays.equals로, large production에서는 streaming digest와 length로 비교합니다. test oracle size assumption을 명시합니다.",
      "read/write failure 뒤 target이 final name이면 partial artifact가 보일 수 있습니다. bulk loop correctness와 publish state machine을 분리해 검증합니다.",
      "예제는 fresh relative paths와 CREATE_NEW target을 사용하고 artifacts를 역순 삭제합니다. host paths와 random timing은 output에 없습니다.",
    ],
    concepts: [
      { term: "bulk copy invariant", definition: "각 read count만큼의 새 bytes를 순서대로 정확히 한 번 output에 쓰는 규칙입니다.", detail: ["EOF는 write하지 않습니다.", "stale buffer tail을 제외합니다."] },
      { term: "boundary fixture", definition: "buffer 크기 바로 전·같음·바로 뒤 data로 off-by-one을 강제하는 입력입니다.", detail: ["8193이 tail1을 만듭니다.", "empty·single도 포함합니다."] },
      { term: "copy total", definition: "성공적으로 읽고 쓴 actual counts의 long 누적값입니다.", detail: ["length/progress 기준입니다.", "overflow policy가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-bulk-file-copy-boundary",
      title: "8193bytes를8192 buffer로 [8192,1] reads에 복사합니다",
      language: "java",
      filename: "BulkFileCopyBoundary.java",
      purpose: "마지막 짧은 block을 actual count로 쓰고 exact length/hash를 확인합니다.",
      code: `import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class BulkFileCopyBoundary {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("bulk-boundary");
        Files.createDirectory(root);
        Path source = root.resolve("source.bin");
        Path target = root.resolve("target.bin");
        byte[] expected = new byte[8_193];
        for (int index = 0; index < expected.length; index++) expected[index] = (byte) (index * 17);
        List<Integer> counts = new ArrayList<>();
        try {
            Files.write(source, expected, StandardOpenOption.CREATE_NEW);
            try (InputStream input = Files.newInputStream(source);
                 OutputStream output = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW)) {
                byte[] buffer = new byte[8_192];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    counts.add(count);
                    output.write(buffer, 0, count);
                }
            }
            byte[] actual = Files.readAllBytes(target);
            byte[] expectedHash = MessageDigest.getInstance("SHA-256").digest(expected);
            byte[] actualHash = MessageDigest.getInstance("SHA-256").digest(actual);
            System.out.println("counts=" + counts);
            System.out.println("length=" + actual.length);
            System.out.println("bytesEqual=" + Arrays.equals(expected, actual));
            System.out.println("hashEqual=" + MessageDigest.isEqual(expectedHash, actualHash));
        } finally {
            Files.deleteIfExists(target); Files.deleteIfExists(source); Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "streams, Path/Files, create option, digest와 observed counts를 import합니다." },
        { lines: "12-19", explanation: "fresh paths와 deterministic8193-byte source, counts를 준비합니다." },
        { lines: "21-29", explanation: "source를 CREATE_NEW로 쓰고8192 buffer의 actual count만 target에 씁니다." },
        { lines: "31-37", explanation: "small oracle bytes와 독립 SHA-256, read partition/length를 검증합니다." },
        { lines: "38-40", explanation: "target→source→root 순서로 owned artifacts를 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh empty working directory", "-Xlint:all warning0"], command: isolatedJavaRun("BulkFileCopyBoundary.java", "BulkFileCopyBoundary") },
      output: { value: "counts=[8192, 1]\nlength=8193\nbytesEqual=true\nhashEqual=true", explanation: ["마지막 tail은1byte입니다.", "target length가 exact합니다.", "bytes와 SHA-256이 같습니다."] },
      experiments: [
        { change: "output.write(buffer)로 바꿉니다.", prediction: "target length16384와 equality/hash false가 됩니다.", result: "actual count를 무시한 corruption을 boundary가 탐지합니다." },
        { change: "source size를8192로 바꿉니다.", prediction: "counts=[8192], length8192가 됩니다.", result: "exact multiple과+1을 둘 다 유지합니다." },
        { change: "loop 안에 output.flush를 넣습니다.", prediction: "bytes는 같지만 flush calls와 latency/throughput이 악화될 수 있습니다.", result: "correctness output만으로 performance를 판정하지 않습니다." },
      ],
      sourceRefs: ["java-input-stream", "java-output-stream", "java-files", "java-standard-open-option", "java-message-digest", "java-arrays", "java-class14-ex06"],
    }],
    diagnostics: [
      { symptom: "target size가 항상 buffer 배수로 커진다.", likelyCause: "write(buffer)로 stale tail까지 기록했습니다.", checks: ["read counts와 write length를 기록합니다.", "buffer±1 target lengths를 봅니다.", "first mismatch offset을 확인합니다."], fix: "write(buffer,0,count)를 사용합니다.", prevention: "empty·1·buffer±1·forced short read matrix를 둡니다." },
      { symptom: "2GiB 이상 copy progress가 음수가 된다.", likelyCause: "누적 bytes를 int로 저장해 overflow했습니다.", checks: ["counter type과 casts를 봅니다.", "content length parsing을 확인합니다.", "percentage multiplication overflow를 봅니다."], fix: "long과 checked/saturating policy를 사용하고 invalid reported totals를 거부합니다.", prevention: "Integer.MAX_VALUE±1 synthetic accounting tests를 둡니다." },
    ],
    expertNotes: ["local FileInputStream often fills large arrays, but tests must not rely on that for generic InputStream. short-read adapter and fault injection remain necessary.", "copy loop가 correct해도 same-file source/target alias는 truncate hazard가 있습니다. open 전에 Files.isSameFile 가능성과 target creation order를 검토합니다."],
  },
  {
    id: "files-copy-transfer-to-mismatch",
    title: "Files.copy·InputStream.transferTo·manual loop를 요구사항별로 선택합니다",
    lead: "짧은 API는 유용하지만 size limit·digest·progress·cancellation을 어디에 끼울지와 partial target semantics를 비교한 뒤 선택합니다.",
    explanations: [
      "Files.copy(Path,Path,options)는 filesystem 경로 사이 복사를 간결하게 표현하고 COPY_ATTRIBUTES·REPLACE_EXISTING 같은 정책을 options로 줍니다. 없는 option의 default를 확인합니다.",
      "Files.copy(InputStream,Path,options)는 caller stream ownership과 target partial failure를 다뤄야 합니다. method가 input을 자동 close하는지 API contract를 확인하고 wrapper ownership을 정합니다.",
      "InputStream.transferTo(OutputStream)는 EOF까지 전송하고 long count를 반환하지만 두 streams를 자동 close하지 않습니다. target open mode와 failure cleanup은 caller 책임입니다.",
      "manual loop는 size limit, incremental digest, progress/cancel, throttling과 observability를 세밀하게 넣을 수 있지만 actual count·EOF·cleanup을 직접 맞춰야 합니다.",
      "Files.mismatch는 두 files가 같은 bytes면-1, 다르면 첫 mismatch position을 long으로 줍니다. large files에 대한 diagnostic에 유용하지만 source가 비교 중 변하면 snapshot 보장이 없습니다.",
      "COPY_ATTRIBUTES는 어떤 attributes가 복사되고 실패가 atomic한지 provider-dependent합니다. owner/ACL/permissions/time을 무조건 보존하면 privilege나 disclosure를 복제할 수도 있습니다.",
      "REPLACE_EXISTING은 convenience가 아니라 destructive policy입니다. verified temp publish에서는 existing final의 idempotency/version contract와 함께 선택합니다.",
      "zero-copy라는 이름으로 transferTo가 항상 kernel zero-copy를 보장한다고 단정하지 않습니다. stream subtype·JDK·OS와 fallback implementation을 profile합니다.",
      "예제는 같은17-byte source를 Files.copy와 transferTo로 두 targets에 만들고 mismatch-1, transfer count와 lengths를 semantic output으로 비교합니다.",
    ],
    concepts: [
      { term: "copy primitive", definition: "Path copy·stream transfer·manual loop처럼 bytes 이동을 수행하는 API 선택지입니다.", detail: ["제어 지점이 다릅니다.", "cleanup 책임을 비교합니다."] },
      { term: "mismatch position", definition: "두 files에서 처음 다른 byte의 zero-based long offset이며 완전히 같으면-1입니다.", detail: ["diagnostic에 유용합니다.", "동시 mutation을 잠그지 않습니다."] },
      { term: "copy attributes", definition: "contents 외 timestamps·permissions 등 metadata를 target으로 옮기는 option/policy입니다.", detail: ["provider 차이가 있습니다.", "보안 검토가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-copy-primitive-comparison",
      title: "Files.copy와 transferTo가 같은17bytes를 만드는지 mismatch로 확인합니다",
      language: "java",
      filename: "CopyPrimitiveComparison.java",
      purpose: "두 copy primitives의 result equality와 transfer count를 실제 files에서 비교합니다.",
      code: `import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class CopyPrimitiveComparison {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("copy-primitives");
        Files.createDirectory(root);
        Path source = root.resolve("source.bin");
        Path filesTarget = root.resolve("files.bin");
        Path transferTarget = root.resolve("transfer.bin");
        byte[] payload = new byte[17];
        for (int index = 0; index < payload.length; index++) payload[index] = (byte) (index * 13);
        try {
            Files.write(source, payload, StandardOpenOption.CREATE_NEW);
            Files.copy(source, filesTarget);
            long transferred;
            try (InputStream input = Files.newInputStream(source);
                 OutputStream output = Files.newOutputStream(transferTarget, StandardOpenOption.CREATE_NEW)) {
                transferred = input.transferTo(output);
            }
            System.out.println("filesCopySize=" + Files.size(filesTarget));
            System.out.println("transferToCount=" + transferred);
            System.out.println("mismatchFilesCopy=" + Files.mismatch(source, filesTarget));
            System.out.println("mismatchTransferTo=" + Files.mismatch(source, transferTarget));
        } finally {
            Files.deleteIfExists(transferTarget); Files.deleteIfExists(filesTarget);
            Files.deleteIfExists(source); Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "stream transfer와 Files/Path/open option APIs를 import합니다." },
        { lines: "8-15", explanation: "fresh paths와 deterministic17-byte payload를 준비합니다." },
        { lines: "17-23", explanation: "Files.copy와 explicit stream ownership의 transferTo를 각각 실행합니다." },
        { lines: "24-27", explanation: "size/count와 source 대비 mismatch offsets를 출력합니다." },
        { lines: "28-32", explanation: "두 targets·source·root 순으로 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh empty working directory", "-Xlint:all warning0"], command: isolatedJavaRun("CopyPrimitiveComparison.java", "CopyPrimitiveComparison") },
      output: { value: "filesCopySize=17\ntransferToCount=17\nmismatchFilesCopy=-1\nmismatchTransferTo=-1", explanation: ["두 targets가17bytes입니다.", "transferTo count가 source length와 같습니다.", "mismatch-1은 exact equality입니다."] },
      experiments: [
        { change: "transferTarget의 byte5를 바꿉니다.", prediction: "mismatchTransferTo=5가 됩니다.", result: "first-difference position을 diagnostics에 사용할 수 있습니다." },
        { change: "Files.copy에 REPLACE_EXISTING을 추가하고 preexisting target을 둡니다.", prediction: "기존 contents가 교체됩니다.", result: "option은 명시적 destructive policy입니다." },
        { change: "transferTo 뒤 streams를 닫지 않습니다.", prediction: "handle과 buffered completion lifecycle이 누락됩니다.", result: "transferTo는 ownership을 대신하지 않습니다." },
      ],
      sourceRefs: ["java-files", "java-input-stream", "java-output-stream", "java-standard-copy-option", "java-standard-open-option"],
    }],
    diagnostics: [
      { symptom: "Files.copy가 기존 target에서 실패한다.", likelyCause: "REPLACE_EXISTING을 지정하지 않았고 collision policy가 불명확합니다.", checks: ["target existence/owner를 봅니다.", "copy options를 확인합니다.", "idempotency/version 정책을 찾습니다."], fix: "conflict·versioned name·verified replace 중 업무 정책을 선택하고 option을 맞춥니다.", prevention: "existing target preservation/replacement tests를 둘 다 둡니다." },
      { symptom: "transferTo가 끝났는데 file handle이 남는다.", likelyCause: "transferTo가 streams를 닫는다고 오해했습니다.", checks: ["try-with-resources scope를 봅니다.", "caller-owned input contract를 확인합니다.", "Windows delete test를 반복합니다."], fix: "owner가 source/output을 try-with-resources로 닫습니다.", prevention: "ownership을 method signature/docs와 leak tests에 명시합니다." },
    ],
    expertNotes: ["Files.mismatch may use optimized comparisons but remains an I/O operation; do not run it redundantly after a streaming digest if latency budget cannot afford a second pass.", "When copying within the same filesystem, reflink/copy-on-write support may radically change cost, allocation and post-copy isolation assumptions. Measure actual file store behavior."],
  },
  {
    id: "buffer-size-system-calls-memory-benchmark",
    title: "buffer size를 correctness가 아니라 calls·heap·throughput의 측정 문제로 다룹니다",
    lead: "한 byte씩 읽는10001 calls와128byte bulk의80 calls가 같은10000 bytes를 내는지 먼저 확인하고, 시간 측정은 별도 benchmark harness로 옮깁니다.",
    explanations: [
      "single-byte read/write는 method calls와 underlying I/O opportunities를 늘립니다. buffering이 이를 줄이지만 OS page cache·device block·network packet과 Java buffer가 반드시 같은 크기일 필요는 없습니다.",
      "128, 4K, 8K, 64K, 1M buffer 후보를 size·storage·concurrency별로 측정합니다. 가장 큰 buffer는 marginal throughput 없이 heap residency와 GC pressure만 늘릴 수 있습니다.",
      "N concurrent copies×buffer per direction×wrappers로 memory upper bound를 계산합니다. pooling은 allocation을 줄일 수 있지만 secret data reuse·oversized retention·thread safety를 검토합니다.",
      "application read call count는 syscall count와 같지 않습니다. BufferedInputStream, native layer와 OS cache가 더 묶을 수 있으므로 JFR/async-profiler/strace·ETW 같은 도구로 계층을 구분합니다.",
      "wall-clock 한 번은 JIT warmup·filesystem cache·antivirus·thermal state·background load에 흔들립니다. JMH fork/warmup과 realistic macrobenchmark를 함께 사용합니다.",
      "benchmark가 output을 소비하지 않으면 최적화로 work가 사라질 수 있습니다. file copy는 side effect가 있지만 temp reuse/cache와 cleanup cost inclusion을 명시합니다.",
      "cold-cache와 warm-cache는 다른 질문입니다. production access pattern에 맞춰 cache eviction/repeated reads를 분리하고 불가능한 완전 cold claims를 피합니다.",
      "throughput MB/s, p50/p95 latency, CPU%, allocations, read/write operations와 queue depth를 함께 봅니다. 평균 하나로 tail latency와 contention을 숨기지 않습니다.",
      "예제는 timing 대신 deterministic application call counts를 비교합니다. 두 outputs exact equality가 먼저이고 performance hypothesis는 그 다음입니다.",
    ],
    concepts: [
      { term: "application call count", definition: "Java code가 read/write method를 호출한 횟수입니다.", detail: ["syscall과 같지 않을 수 있습니다.", "deterministic unit evidence입니다."] },
      { term: "buffer memory envelope", definition: "동시 copy 수와 각 layer buffer 크기로 계산한 최대 resident byte budget입니다.", detail: ["concurrency를 곱합니다.", "pool retention을 포함합니다."] },
      { term: "benchmark confounder", definition: "JIT·cache·background load처럼 측정 대상 외 결과를 바꾸는 요인입니다.", detail: ["fork/warmup로 완화합니다.", "조건을 기록합니다."] },
    ],
    codeExamples: [{
      id: "java-read-call-count-comparison",
      title: "10000bytes single read와128byte bulk read의 call counts·결과를 비교합니다",
      language: "java",
      filename: "ReadCallCountComparison.java",
      purpose: "시간 noise 없이 bulk processing이 application read calls를 줄이면서 bytes를 보존함을 검증합니다.",
      code: `import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Arrays;

public class ReadCallCountComparison {
    record Result(byte[] bytes, int calls) {}

    static Result single(byte[] source) {
        ByteArrayInputStream input = new ByteArrayInputStream(source);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        int calls = 0;
        int value;
        do {
            value = input.read(); calls++;
            if (value != -1) output.write(value);
        } while (value != -1);
        return new Result(output.toByteArray(), calls);
    }

    static Result bulk(byte[] source) {
        ByteArrayInputStream input = new ByteArrayInputStream(source);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[128];
        int calls = 0;
        int count;
        do {
            count = input.read(buffer, 0, buffer.length); calls++;
            if (count != -1) output.write(buffer, 0, count);
        } while (count != -1);
        return new Result(output.toByteArray(), calls);
    }

    public static void main(String[] args) {
        byte[] source = new byte[10_000];
        for (int index = 0; index < source.length; index++) source[index] = (byte) index;
        Result single = single(source);
        Result bulk = bulk(source);
        System.out.println("singleCalls=" + single.calls());
        System.out.println("bulkCalls=" + bulk.calls());
        System.out.println("sameBytes=" + (Arrays.equals(source, single.bytes()) && Arrays.equals(source, bulk.bytes())));
    }
}`,
      walkthrough: [
        { lines: "1-3", explanation: "memory streams와 independent byte equality를 import합니다." },
        { lines: "6", explanation: "output bytes와 application read calls를 함께 반환하는 immutable result를 정의합니다." },
        { lines: "8-18", explanation: "EOF call까지 포함한 single-byte reader를 구현합니다." },
        { lines: "20-31", explanation: "128-byte buffer의 actual count만 쓰는 bulk reader를 구현합니다." },
        { lines: "34-41", explanation: "deterministic10000 bytes에서 call counts와 두 outputs equality를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("ReadCallCountComparison.java", "ReadCallCountComparison") },
      output: { value: "singleCalls=10001\nbulkCalls=80\nsameBytes=true", explanation: ["single은 data10000+EOF call입니다.", "128-byte bulk는79 data reads+EOF입니다.", "두 결과 모두 exact합니다."] },
      experiments: [
        { change: "bulk buffer를1로 바꿉니다.", prediction: "bulkCalls=10001로 single과 같아집니다.", result: "batch size가 application calls를 결정합니다." },
        { change: "buffer를8192로 바꿉니다.", prediction: "bulkCalls=3이지만 실제 throughput 배수는 별도 측정이 필요합니다.", result: "call count는 performance proxy일 뿐 결과 자체가 아닙니다." },
        { change: "System.nanoTime 한 번으로 두 방법을 순서대로 비교합니다.", prediction: "warmup/order/cache noise가 결론을 왜곡합니다.", result: "JMH와 randomized macrobenchmark를 설계합니다." },
      ],
      sourceRefs: ["java-byte-array-input-stream", "java-byte-array-output-stream", "java-arrays", "jmh-project", "java-buffered-input-stream"],
    }],
    diagnostics: [
      { symptom: "benchmark를 실행할 때마다 최적 buffer size가 바뀐다.", likelyCause: "warmup·cache·background I/O·cleanup을 통제하지 않았습니다.", checks: ["fork/warmup/iteration을 봅니다.", "file cache state와 order를 기록합니다.", "allocation/operations counters를 확인합니다."], fix: "JMH micro와 production-like macrobenchmark를 분리하고 conditions/confidence를 보고합니다.", prevention: "benchmark profile·hardware·JDK를 version-controlled artifact로 남깁니다." },
      { symptom: "64MB buffer로 single copy는 빠르지만 server가 OOM 난다.", likelyCause: "동시 requests와 wrapper/pool retention을 memory envelope에 곱하지 않았습니다.", checks: ["concurrency와 per-copy allocations를 봅니다.", "heap histogram/pool size를 확인합니다.", "large buffer lifetime을 측정합니다."], fix: "bounded concurrency와 measured smaller buffer를 사용합니다.", prevention: "load test에서 heap/p95/throughput을 함께 gate합니다." },
    ],
    expertNotes: ["JMH is not ideal for end-to-end filesystem durability because external state dominates; use it for in-memory/wrapper mechanics and a separate harness for real storage.", "Linux perf/strace, Windows ETW/ProcMon and JFR expose different layers. Report exactly which counter supports the syscall or allocation claim."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...copyFoundationChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-buffered-input-stream", repository: "Java SE 21 API", path: "java.io.BufferedInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedInputStream.html", usedFor: ["buffered decorator", "read batching", "mark/reset"], evidence: "buffered input contract 근거입니다." },
  { id: "java-buffered-output-stream", repository: "Java SE 21 API", path: "java.io.BufferedOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedOutputStream.html", usedFor: ["buffered writes", "flush", "close"], evidence: "buffered output contract 근거입니다." },
  { id: "java-input-stream", repository: "Java SE 21 API", path: "java.io.InputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html", usedFor: ["bulk read", "transferTo", "ownership"], evidence: "byte input/copy primitive 근거입니다." },
  { id: "java-output-stream", repository: "Java SE 21 API", path: "java.io.OutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/OutputStream.html", usedFor: ["actual-count write", "flush", "close"], evidence: "byte output lifecycle 근거입니다." },
  { id: "java-auto-closeable", repository: "Java SE 21 API", path: "java.lang.AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["wrapper ownership", "try-with-resources"], evidence: "resource ownership 근거입니다." },
  { id: "java-files", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["copy", "mismatch", "size", "Path streams"], evidence: "modern file copy/compare 근거입니다." },
  { id: "java-standard-open-option", repository: "Java SE 21 API", path: "java.nio.file.StandardOpenOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/StandardOpenOption.html", usedFor: ["CREATE_NEW", "target policy"], evidence: "non-destructive fixture/publish open 근거입니다." },
  { id: "java-standard-copy-option", repository: "Java SE 21 API", path: "java.nio.file.StandardCopyOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/StandardCopyOption.html", usedFor: ["REPLACE_EXISTING", "COPY_ATTRIBUTES", "ATOMIC_MOVE"], evidence: "copy/move option policy 근거입니다." },
  { id: "java-message-digest", repository: "Java SE 21 API", path: "java.security.MessageDigest", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html", usedFor: ["SHA-256", "isEqual"], evidence: "copy integrity 근거입니다." },
  { id: "java-arrays", repository: "Java SE 21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["small byte oracle", "equality"], evidence: "test byte equality 근거입니다." },
  { id: "java-hex-format", repository: "Java SE 21 API", path: "java.util.HexFormat", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HexFormat.html", usedFor: ["stable byte output"], evidence: "binary representation 근거입니다." },
  { id: "java-byte-array-input-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayInputStream.html", usedFor: ["deterministic benchmark source", "call counts"], evidence: "memory input fixture 근거입니다." },
  { id: "java-byte-array-output-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayOutputStream.html", usedFor: ["counting sink", "result snapshot"], evidence: "memory output fixture 근거입니다." },
  { id: "jmh-project", repository: "OpenJDK JMH", path: "JMH", publicUrl: "https://openjdk.org/projects/code-tools/jmh/", usedFor: ["fork", "warmup", "measurement"], evidence: "reliable microbenchmark methodology 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "buffer capacity/flush observation, correct bulk copy, copy primitive comparison과 deterministic call-count model을 추가했습니다.",
  "copy correctness output과 performance measurement를 분리하고 timing을 unit-test golden으로 사용하지 않았습니다.",
);

const reliablePublishChapters: DetailedSession["chapters"] = [
  {
    id: "incremental-digest-length-mismatch",
    title: "copy 한 pass에서 input/output digest를 갱신하고 length·mismatch와 교차 검증합니다",
    lead: "전체 파일을 memory에 올리지 않고 DigestInputStream·DigestOutputStream으로 읽은 bytes와 쓴 bytes의 SHA-256을 각각 계산합니다.",
    explanations: [
      "incremental MessageDigest.update는 chunk boundaries와 무관하게 같은 byte sequence에 같은 digest를 냅니다. buffer size가 바뀌어도 result가 같아야 합니다.",
      "DigestInputStream은 실제 읽힌 bytes를 digest하고 DigestOutputStream은 실제 write된 bytes를 digest합니다. 두 값이 같으면 loop가 본 input과 output이 일치한다는 독립 evidence가 됩니다.",
      "source path의 사전 hash를 믿고 copy 중 source가 바뀌면 다른 snapshot을 읽을 수 있습니다. 가능한 한 같은 open handle에서 digest하고 external mutation/version policy를 둡니다.",
      "transferred long count와 target Files.size를 비교하면 truncation/extra bytes를 빠르게 찾습니다. 같은 length만으로 contents equality를 증명하지는 않습니다.",
      "Files.mismatch=-1은 second-pass exact byte equality evidence입니다. production latency가 second pass를 감당하지 못하면 streaming digests와 trusted expected hash를 사용하고 tradeoff를 기록합니다.",
      "DigestOutputStream close 전에 digest 결과를 final로 간주하지 않습니다. buffered/compression wrappers의 final bytes가 close에서 추가될 수 있어 outermost completion 뒤 target을 다시 검증합니다.",
      "digest mismatch면 final target으로 publish하지 않고 owned temp를 격리·삭제합니다. mismatch source/target hashes를 모두 public log에 남기는 것이 data sensitivity에 맞는지 검토합니다.",
      "MessageDigest instance는 일반적으로 thread-safe로 공유한다고 가정하지 않고 operation별로 만듭니다. algorithm name과 provider/version을 audit metadata로 둘 수 있습니다.",
      "예제는4097 deterministic bytes를 digesting wrappers로 복사하고 count·size·digest·mismatch 네 facts를 host-independent output으로 냅니다.",
    ],
    concepts: [
      { term: "incremental digest", definition: "stream chunks를 순서대로 update해 전체 byte sequence hash를 bounded memory로 계산하는 방식입니다.", detail: ["chunk size 독립입니다.", "final digest 전 모든 bytes가 필요합니다."] },
      { term: "digesting stream", definition: "read/write를 그대로 전달하면서 통과한 bytes를 MessageDigest에 갱신하는 decorator입니다.", detail: ["input/output 양쪽이 있습니다.", "ownership은 underlying과 연결됩니다."] },
      { term: "cross-check", definition: "count·size·digest·mismatch처럼 다른 failure modes를 가진 여러 evidence를 함께 비교하는 검증입니다.", detail: ["하나의 bug blind spot을 줄입니다.", "비용을 측정합니다."] },
    ],
    codeExamples: [{
      id: "java-incremental-copy-digest",
      title: "DigestInputStream·DigestOutputStream으로4097bytes를 한 pass 검증합니다",
      language: "java",
      filename: "IncrementalCopyDigest.java",
      purpose: "bounded copy 중 읽힌 bytes와 쓰인 bytes의 independent SHA-256를 계산하고 file facts와 교차 검증합니다.",
      code: `import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.DigestInputStream;
import java.security.DigestOutputStream;
import java.security.MessageDigest;

public class IncrementalCopyDigest {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("digest-copy");
        Files.createDirectory(root);
        Path source = root.resolve("source.bin");
        Path target = root.resolve("target.bin");
        byte[] payload = new byte[4_097];
        for (int index = 0; index < payload.length; index++) payload[index] = (byte) (index * 29);
        MessageDigest inputDigest = MessageDigest.getInstance("SHA-256");
        MessageDigest outputDigest = MessageDigest.getInstance("SHA-256");
        long copied = 0;
        try {
            Files.write(source, payload, StandardOpenOption.CREATE_NEW);
            try (InputStream input = new DigestInputStream(Files.newInputStream(source), inputDigest);
                 OutputStream output = new DigestOutputStream(
                         Files.newOutputStream(target, StandardOpenOption.CREATE_NEW), outputDigest)) {
                byte[] buffer = new byte[1_024];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    output.write(buffer, 0, count);
                    copied += count;
                }
            }
            System.out.println("copied=" + copied);
            System.out.println("lengthMatch=" + (copied == Files.size(target)));
            System.out.println("digestMatch=" + MessageDigest.isEqual(inputDigest.digest(), outputDigest.digest()));
            System.out.println("mismatch=" + Files.mismatch(source, target));
        } finally {
            Files.deleteIfExists(target); Files.deleteIfExists(source); Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "digesting wrappers, base streams, Files/options와 MessageDigest를 import합니다." },
        { lines: "11-20", explanation: "fresh paths, deterministic4097 payload와 operation-local input/output digests·long count를 준비합니다." },
        { lines: "22-31", explanation: "digesting wrappers를 outer resources로 소유하고1024-byte actual-count copy를 수행합니다." },
        { lines: "33-36", explanation: "count/size, 두 digests와 second-pass mismatch를 교차 출력합니다." },
        { lines: "37-39", explanation: "target·source·root를 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "SHA-256 provider", "fresh working directory", "-Xlint:all warning0"], command: isolatedJavaRun("IncrementalCopyDigest.java", "IncrementalCopyDigest") },
      output: { value: "copied=4097\nlengthMatch=true\ndigestMatch=true\nmismatch=-1", explanation: ["count와 target size가4097입니다.", "input/output digest가 같습니다.", "exact file comparison도 같습니다."] },
      experiments: [
        { change: "output.write 길이를 count-1로 바꿉니다.", prediction: "copied variable는4097이지만 length/digest/mismatch가 실패합니다.", result: "여러 evidence가 accounting bug를 탐지합니다." },
        { change: "buffer size를17로 바꿉니다.", prediction: "chunk partition은 달라도 네 outputs는 같습니다.", result: "digest는 chunk boundary와 독립입니다." },
        { change: "DigestOutputStream 밖에 BufferedOutputStream을 두고 digest를 close 전에 읽습니다.", prediction: "아직 전달되지 않은 buffered bytes를 digest가 놓칠 수 있습니다.", result: "wrapper order와 completion 시점을 명시합니다." },
      ],
      sourceRefs: ["java-digest-input-stream", "java-digest-output-stream", "java-message-digest", "java-files", "java-standard-open-option", "java-input-stream", "java-output-stream"],
    }],
    diagnostics: [
      { symptom: "target length는 맞지만 digest가 다르다.", likelyCause: "same-size byte corruption·wrong offset/order 또는 digest wrapper order가 잘못됐습니다.", checks: ["Files.mismatch offset을 봅니다.", "actual count/offset writes를 확인합니다.", "digest가 어느 wrapper bytes를 보는지 봅니다."], fix: "input/output digests를 operation-local로 두고 exact-count loop와 close 후 verification을 사용합니다.", prevention: "single-byte mutation·reordering mutation tests를 둡니다." },
      { symptom: "동시 copies의 digest가 간헐적으로 섞인다.", likelyCause: "MessageDigest instance를 threads/operations가 공유했습니다.", checks: ["digest field lifetime을 봅니다.", "concurrent access를 찾습니다.", "reset/digest 호출 순서를 확인합니다."], fix: "copy operation마다 새 MessageDigest를 생성합니다.", prevention: "parallel isolation test와 mutable crypto state 공유 금지를 review checklist에 둡니다." },
    ],
    expertNotes: ["DigestInputStream on a mutable source path hashes the bytes actually read, which is useful evidence but not a stable snapshot guarantee. Open handles, locks or immutable object storage versions address a different problem.", "Files.mismatch gives a useful offset but a second full read can double I/O. Enable it for diagnostics/small artifacts or on mismatch triage rather than unconditionally at scale."],
  },
  {
    id: "size-limit-progress-cancellation",
    title: "size limit·progress·cancellation을 chunk write 전후의 명시적 state transition으로 만듭니다",
    lead: "copy loop에 control plane을 추가할 때 bytes를 쓴 뒤 limit을 발견하거나 cancellation을 무시하지 않도록 각 iteration의 순서를 정의합니다.",
    explanations: [
      "untrusted Content-Length만으로 max size를 지키지 않습니다. missing/거짓 header가 가능하므로 실제 read counts의 long total을 authoritative limit으로 검사합니다.",
      "다음 count를 더하면 max를 넘는지 write 전에 검사해 temp에 허용 밖 bytes를 쓰지 않을 수 있습니다. Math.addExact로 long overflow를 별도 failure로 잡습니다.",
      "progress는 copied bytes와 verified expected total을 함께 전달합니다. total을 모르면 determinate percentage 대신 byte count/indeterminate status를 사용합니다.",
      "progress callback이 느리거나 예외를 던지면 copy throughput/semantics를 바꿀 수 있습니다. sampling interval, callback executor와 failure policy를 정합니다.",
      "cancellation은 cooperative입니다. loop iteration마다 token/interrupted state를 확인하고 output을 final로 publish하지 않으며 resource close를 수행합니다.",
      "InterruptedException이나 interrupt flag를 삼키지 않습니다. API가 interruptible인지에 따라 flag 복원·typed cancellation 전파와 executor contract를 유지합니다.",
      "cancel/limit까지 쓴 temp bytes 수를 safe metric으로 남기고 contents는 삭제합니다. attacker가 repeated oversize uploads로 disk I/O를 유발하지 않게 request/rate quota를 추가합니다.",
      "timeout은 wall-clock deadline이며 blocking read가 영원히 깨어나지 않으면 loop check만으로 부족합니다. source-specific read timeout/channel cancellation을 함께 사용합니다.",
      "예제는3-byte chunks로10-byte payload를 처리해 max8과 cancel-at6을 각각6bytes에서 중단하고 published result가 없음을 검증합니다.",
    ],
    concepts: [
      { term: "authoritative byte limit", definition: "실제 successful read counts 누적으로 검사하는 최대 payload 크기입니다.", detail: ["header와 교차 검증합니다.", "write 전에 초과를 판단합니다."] },
      { term: "cooperative cancellation", definition: "worker가 token/interruption을 주기적으로 확인하고 안전한 중단·정리를 수행하는 취소입니다.", detail: ["강제 kill과 다릅니다.", "publish를 금지합니다."] },
      { term: "progress contract", definition: "copied bytes, optional total과 callback 빈도·failure semantics를 정한 관찰 계약입니다.", detail: ["percentage가 항상 있지 않습니다.", "hot loop 비용을 제한합니다."] },
    ],
    codeExamples: [{
      id: "java-bounded-cancellable-copy",
      title: "3byte chunks에서 max8과 cancel-at6이 모두 partial publish 없이 중단됩니다",
      language: "java",
      filename: "BoundedCancellableCopy.java",
      purpose: "actual total의 checked limit과 cooperative cancellation을 write/publish state에서 분리합니다.",
      code: `import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.function.LongPredicate;

public class BoundedCancellableCopy {
    static final class Stopped extends Exception {
        private static final long serialVersionUID = 1L;
        private final String reason;
        private final long copied;
        Stopped(String reason, long copied) { this.reason = reason; this.copied = copied; }
    }

    static long copy(byte[] source, long maxBytes, LongPredicate cancelled) throws Exception {
        try (InputStream input = new ByteArrayInputStream(source);
             ByteArrayOutputStream temporary = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[3];
            long total = 0;
            int count;
            while ((count = input.read(buffer)) != -1) {
                long next = Math.addExact(total, count);
                if (next > maxBytes) throw new Stopped("limit", total);
                if (cancelled.test(total)) throw new Stopped("cancel", total);
                temporary.write(buffer, 0, count);
                total = next;
            }
            return total;
        }
    }

    public static void main(String[] args) throws Exception {
        byte[] payload = new byte[10];
        try { copy(payload, 8, ignored -> false); }
        catch (Stopped stopped) { System.out.println("limit=" + stopped.reason + "@" + stopped.copied); }
        try { copy(payload, 20, copied -> copied >= 6); }
        catch (Stopped stopped) { System.out.println("cancel=" + stopped.reason + "@" + stopped.copied); }
        System.out.println("published=false");
        System.out.println("partialTemporaryDiscarded=true");
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "memory streams, InputStream과 copied-total cancellation predicate를 import합니다." },
        { lines: "7-12", explanation: "serial version과 limit/cancel reason, 중단 전 copied bytes를 보존하는 typed stop을 정의합니다." },
        { lines: "14-29", explanation: "3byte loop에서 addExact, write 전 limit/cancel checks와 temporary-only bytes를 구현합니다." },
        { lines: "32-39", explanation: "max8과 cancel-at6 시나리오의 stop states와 non-publish/temporary disposal을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("BoundedCancellableCopy.java", "BoundedCancellableCopy") },
      output: { value: "limit=limit@6\ncancel=cancel@6\npublished=false\npartialTemporaryDiscarded=true", explanation: ["next chunk9가 max8을 넘기 전 total6에서 중단합니다.", "cancel token도 total6에서 중단합니다.", "완료되지 않은 bytes는 publish되지 않습니다."] },
      experiments: [
        { change: "limit check를 temporary.write 뒤로 옮깁니다.", prediction: "limit stop 전에9bytes가 temp에 써집니다.", result: "side-effect ordering을 contract로 정합니다." },
        { change: "cancel predicate를 loop 밖에서 한 번만 확인합니다.", prediction: "long copy 중 취소 latency가 전체 duration이 됩니다.", result: "bounded check interval이 필요합니다." },
        { change: "Content-Length10만 보고 max8을 즉시 거부합니다.", prediction: "빠른 precheck는 가능하지만 header가 없거나 거짓인 stream에는 실제 count guard가 여전히 필요합니다.", result: "advisory precheck와 authoritative runtime limit을 함께 씁니다." },
      ],
      sourceRefs: ["java-input-stream", "java-byte-array-input-stream", "java-byte-array-output-stream", "java-math", "java-long-predicate"],
    }],
    diagnostics: [
      { symptom: "max10MB 설정인데 disk에 더 큰 partial temp가 생긴다.", likelyCause: "write 후 total을 검사하거나 Content-Length만 신뢰했습니다.", checks: ["next total 계산과 write 순서를 봅니다.", "chunk size만큼 overshoot를 확인합니다.", "header 없는 requests를 테스트합니다."], fix: "Math.addExact(total,count) 후 max를 write 전에 검사합니다.", prevention: "limit-1/limit/limit+1과 large chunk tests를 둡니다." },
      { symptom: "취소 버튼을 눌러도 blocking copy가 계속된다.", likelyCause: "token을 loop에서 확인하지 않거나 blocking read timeout/cancellation이 없습니다.", checks: ["check interval을 봅니다.", "source read timeout을 확인합니다.", "interrupt flag 처리와 executor를 봅니다."], fix: "bounded loop checks와 source-specific interruptible/timeout I/O를 결합합니다.", prevention: "cancel during read/write/close phase fault tests를 둡니다." },
    ],
    expertNotes: ["The example discards an in-memory temporary by scope; production code must prove filesystem temp ownership and delete it even when close itself fails.", "Backpressure is broader than a copy loop. When producers can outpace storage, bound queues/concurrency and propagate demand rather than accumulating unbounded byte arrays."],
  },
  {
    id: "owned-temp-verify-atomic-publish",
    title: "owned temp→close→verify→atomic move로 final name에 partial file이 보이지 않게 합니다",
    lead: "final target에 직접 쓰지 않고 같은 filesystem의 unique temp에 완성한 뒤 검증과 move를 success state transition으로 사용합니다.",
    explanations: [
      "Files.createTempFile(trustedDir,prefix,suffix)는 unique file을 atomic create하고 returned Path ownership을 명확히 합니다. system temp가 아니라 final과 같은 filesystem에 두면 atomic move 가능성이 높습니다.",
      "temp output close가 성공한 뒤 length/digest/schema를 검증합니다. close failure가 있으면 final publish를 수행하지 않습니다.",
      "Files.move(temp,final,ATOMIC_MOVE)는 atomic name switch를 요청하지만 provider/file store가 지원하지 않으면 AtomicMoveNotSupportedException이 납니다. capability를 숨기지 않습니다.",
      "fallback normal move는 crash 중 partial/absent state와 overwrite semantics가 다를 수 있습니다. durability requirement가 강하면 fail closed하거나 platform-specific protocol을 사용합니다.",
      "existing final target에 REPLACE_EXISTING을 무조건 주지 않습니다. create-only, versioned, compare-and-swap, idempotent same-hash 같은 policy를 먼저 정합니다.",
      "move가 성공하면 temp path는 더 이상 존재하지 않고 ownership이 final artifact로 전환됩니다. cleanup finally가 moved final을 temp로 착각해 삭제하지 않도록 state flag를 둡니다.",
      "crash durability는 atomic visibility와 다릅니다. file force, directory metadata persistence, filesystem journal과 storage guarantees를 별도로 검토합니다.",
      "orphan temp는 process crash로 finally가 실행되지 않을 수 있습니다. prefix·owner metadata·age와 lock을 사용한 reconciliation job이 필요합니다.",
      "예제는 same-directory temp에5bytes를 쓰고 digest 확인 후 atomic move를 시도하며 unsupported만 non-atomic fallback으로 처리해 stable success facts를 냅니다.",
    ],
    concepts: [
      { term: "atomic visibility", definition: "관찰자가 final name에서 partial contents가 아니라 old/new state 중 하나만 보도록 name transition을 수행하는 성질입니다.", detail: ["ATOMIC_MOVE가 관련됩니다.", "durability와 다릅니다."] },
      { term: "publish state", definition: "owned temporary artifact가 검증을 통과해 final namespace의 업무 artifact로 전환된 상태입니다.", detail: ["close/verify 후입니다.", "cleanup ownership이 바뀝니다."] },
      { term: "orphan reconciliation", definition: "crash로 남은 owned temp candidates를 owner·age·state 기준으로 안전하게 회수하는 운영 절차입니다.", detail: ["broad delete를 피합니다.", "active upload와 경쟁하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-verified-temp-publish",
      title: "same-directory temp를 SHA-256 검증한 뒤 atomic-or-explicit-fallback move합니다",
      language: "java",
      filename: "VerifiedTempPublish.java",
      purpose: "partial final name을 피하고 temp ownership이 publish 후 전환되는 state를 검증합니다.",
      code: `import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;

public class VerifiedTempPublish {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("verified-publish");
        Files.createDirectory(root);
        Path target = root.resolve("artifact.bin");
        Path temporary = Files.createTempFile(root, ".artifact-", ".tmp");
        byte[] payload = {9, 8, 7, 6, 5};
        boolean published = false;
        try {
            Files.write(temporary, payload, StandardOpenOption.TRUNCATE_EXISTING);
            byte[] expected = MessageDigest.getInstance("SHA-256").digest(payload);
            byte[] actual = MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(temporary));
            if (!MessageDigest.isEqual(expected, actual)) throw new IllegalStateException("digest");
            try {
                Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException unsupported) {
                Files.move(temporary, target);
            }
            published = true;
            System.out.println("published=" + Files.exists(target));
            System.out.println("bytes=" + Files.size(target));
            System.out.println("temporaryRemoved=" + Files.notExists(temporary));
            System.out.println("digestMatch=" + MessageDigest.isEqual(expected,
                    MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(target))));
        } finally {
            Files.deleteIfExists(temporary);
            if (published) Files.deleteIfExists(target);
            Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "atomic-move capability, Files/options와 digest를 import합니다." },
        { lines: "9-15", explanation: "fresh root/final, same-directory owned temp, payload와 publish state를 준비합니다." },
        { lines: "17-20", explanation: "temp를 완성하고 expected/actual SHA-256를 검증합니다." },
        { lines: "21-26", explanation: "ATOMIC_MOVE를 시도하고 unsupported만 explicit normal-move fallback으로 처리합니다." },
        { lines: "27-32", explanation: "final existence/size, temp disappearance와 post-publish digest를 출력합니다." },
        { lines: "33-37", explanation: "남은 temp와 published target을 state-aware cleanup합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "same local filesystem", "fresh working directory", "-Xlint:all warning0"], command: isolatedJavaRun("VerifiedTempPublish.java", "VerifiedTempPublish") },
      output: { value: "published=true\nbytes=5\ntemporaryRemoved=true\ndigestMatch=true", explanation: ["final target이 완성 후 존재합니다.", "temp name은 move로 사라집니다.", "published bytes가 expected digest와 같습니다."] },
      experiments: [
        { change: "digest verification 전에 move합니다.", prediction: "corrupt temp가 final namespace에 publish될 수 있습니다.", result: "close→verify→publish 순서를 지킵니다." },
        { change: "final target을 미리 만들고 REPLACE_EXISTING 없이 실행합니다.", prediction: "move가 collision failure하고 existing target은 보존됩니다.", result: "collision policy를 명시합니다." },
        { change: "cross-filesystem temp directory를 사용합니다.", prediction: "ATOMIC_MOVE가 지원되지 않을 가능성이 높습니다.", result: "same-file-store temp와 capability handling이 필요합니다." },
      ],
      sourceRefs: ["java-files", "java-standard-copy-option", "java-standard-open-option", "java-atomic-move-not-supported", "java-message-digest", "java-path"],
    }],
    diagnostics: [
      { symptom: "copy 실패 후 final filename에 partial file이 보인다.", likelyCause: "final target을 직접 CREATE/TRUNCATE하고 썼습니다.", checks: ["write path와 move state를 봅니다.", "failure phase와 target size/hash를 확인합니다.", "temp/final naming을 조사합니다."], fix: "same-filesystem owned temp에 쓰고 close·verify 후 move합니다.", prevention: "read/write/close/verify phase별 final-absent/existing-preserved assertions를 둡니다." },
      { symptom: "성공 publish 뒤 finally가 final artifact를 지운다.", likelyCause: "move 후 ownership/state transition을 기록하지 않고 temp cleanup path를 재사용했습니다.", checks: ["published flag/update 시점을 봅니다.", "temp와 final aliases를 확인합니다.", "finally delete conditions를 봅니다."], fix: "move success 직후 state를 전환하고 cleanup은 현재 owner/state만 삭제합니다.", prevention: "success, move failure와 cleanup failure tests를 각각 둡니다." },
    ],
    expertNotes: ["ATOMIC_MOVE fallback is a product decision, not a harmless catch. Some systems must fail rather than weaken visibility/crash guarantees.", "For strong crash consistency, research fsync/force of file and containing directory on the target OS/filesystem. Java's portable APIs do not erase platform semantics."],
  },
  {
    id: "large-file-long-sparse-position-accounting",
    title: "2GiB를 넘는 byte counts·positions와 sparse file 비용을 long으로 설계합니다",
    lead: "실제 거대 파일을 unit test에 만들지 않고2,147,483,649bytes synthetic chunks로 int overflow와 long accounting law를 재현합니다.",
    explanations: [
      "InputStream read count 한 번은 int이지만 전체 file size·copy total·position은 long이어야 합니다. 여러 chunks의 합이 Integer.MAX_VALUE를 쉽게 넘습니다.",
      "int overflow는 exception 없이 음수로 wrap합니다. Math.addExact(long,count)로 accounting overflow를 탐지하고 max business limit이 Long.MAX_VALUE보다 훨씬 작더라도 검증합니다.",
      "Files.size와 FileChannel.position/size는 long입니다. array length/int index에 cast하면 large file 일부가 truncate되거나 NegativeArraySize/OOM이 생길 수 있습니다.",
      "percentage의 copied*100도 long overflow할 수 있습니다. division order의 precision loss, BigInteger/BigDecimal 또는 safe ratio method를 선택합니다.",
      "sparse file은 logical size가 크지만 실제 blocks allocation이 작을 수 있습니다. StandardOpenOption.SPARSE는 creation hint이며 provider가 무시할 수 있습니다.",
      "copying a sparse file through byte streams may materialize holes and consume large disk space. filesystem-aware copy/reflink support와 allocation metrics를 검토합니다.",
      "Files.readAllBytes는 array/int/memory 한계 때문에 large file copy primitive가 아닙니다. bounded stream/channel과 long progress를 사용합니다.",
      "FileChannel.transferTo는 long position/count를 받지만 한 호출이 요청한 전체를 전송한다고 가정하지 않고 returned count로 loop/progress를 갱신합니다.",
      "예제는 int가 음수로 wrap되는 같은 chunk sum을 Math.addExact long으로 정확히 계산해 size-aware type 선택을 실행 결과로 고정합니다.",
    ],
    concepts: [
      { term: "logical size", definition: "filesystem namespace에서 file이 차지하는 byte position 범위의 길이입니다.", detail: ["long으로 표현합니다.", "allocated blocks와 다를 수 있습니다."] },
      { term: "sparse file", definition: "기록되지 않은 holes를 logical zeros로 읽되 physical blocks를 모두 할당하지 않을 수 있는 file입니다.", detail: ["copy가 materialize할 수 있습니다.", "provider capability입니다."] },
      { term: "checked accounting", definition: "누적 byte/position 연산이 numeric range를 넘으면 조용히 wrap하지 않고 failure로 만드는 계산입니다.", detail: ["Math.addExact를 사용합니다.", "업무 max도 검사합니다."] },
    ],
    codeExamples: [{
      id: "java-large-file-accounting",
      title: "Integer.MAX_VALUE+2 bytes에서 int wrap과 long checked total을 비교합니다",
      language: "java",
      filename: "LargeFileAccounting.java",
      purpose: "실제 huge allocation 없이 copy counters와 progress types의2GiB boundary를 검증합니다.",
      code: `public class LargeFileAccounting {
    public static void main(String[] args) {
        int[] syntheticChunks = {Integer.MAX_VALUE, 2};
        int wrongTotal = 0;
        long checkedTotal = 0;
        for (int chunk : syntheticChunks) {
            wrongTotal += chunk;
            checkedTotal = Math.addExact(checkedTotal, chunk);
        }
        long expected = 2_147_483_649L;
        long percent = checkedTotal == expected ? 100 : 0;
        System.out.println("intTotal=" + wrongTotal);
        System.out.println("longTotal=" + checkedTotal);
        System.out.println("above2GiB=" + (checkedTotal > Integer.MAX_VALUE));
        System.out.println("percent=" + percent);
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "Integer.MAX_VALUE와2라는 synthetic chunks, int/long totals를 준비합니다." },
        { lines: "6-9", explanation: "같은 chunks를 unchecked int와 Math.addExact long에 누적합니다." },
        { lines: "10-15", explanation: "known expected size와 wrap/accurate total,2GiB boundary와 semantic progress를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "no huge allocation", "-Xlint:all warning0"], command: isolatedJavaRun("LargeFileAccounting.java", "LargeFileAccounting") },
      output: { value: "intTotal=-2147483647\nlongTotal=2147483649\nabove2GiB=true\npercent=100", explanation: ["int는 음수로 wrap합니다.", "long은 exact known total입니다.", "2GiB를 넘는 완료 상태를 올바르게 표현합니다."] },
      experiments: [
        { change: "checkedTotal도 int로 바꿉니다.", prediction: "두 totals가 음수가 되어 limit/progress가 깨집니다.", result: "aggregate type은 per-read count type과 달라야 합니다." },
        { change: "expected를 Long.MAX_VALUE로 두고 copied*100/expected를 계산합니다.", prediction: "곱셈이 overflow할 수 있습니다.", result: "safe ratio formula나 BigInteger/BigDecimal을 사용합니다." },
        { change: "sparse10GiB file을 readAllBytes로 검증하려 합니다.", prediction: "array/heap 한계와 materialization 비용이 발생합니다.", result: "streaming digest와 filesystem allocation metrics를 사용합니다." },
      ],
      sourceRefs: ["java-math", "java-file-channel", "java-files", "java-standard-open-option", "java-integer", "java-long"],
    }],
    diagnostics: [
      { symptom: "large copy가 진행될수록 progress가 음수·100% 초과가 된다.", likelyCause: "int counter나 overflow 가능한 percentage multiplication을 사용했습니다.", checks: ["total/expected types를 봅니다.", "casts와 multiply order를 확인합니다.", "reported source length validity를 봅니다."], fix: "long checked totals와 overflow-safe ratio를 사용합니다.", prevention: "2GiB·large long synthetic accounting tests를 unit suite에 둡니다." },
      { symptom: "sparse source copy 후 target disk 사용량이 급증한다.", likelyCause: "byte stream copy가 holes를 explicit zero blocks로 materialize했습니다.", checks: ["logical vs allocated size를 비교합니다.", "filesystem sparse/reflink capability를 봅니다.", "copy primitive/options를 확인합니다."], fix: "filesystem-aware sparse/reflink copy를 사용하거나 capacity를 미리 검증합니다.", prevention: "sparse fixture와 allocated-block metrics를 integration test에 둡니다." },
    ],
    expertNotes: ["A single FileChannel.transferTo call may transfer fewer bytes than requested; loop on the returned long count and guard zero progress according to channel type/platform.", "Files.size can change while copying. Progress display and integrity policy must state whether mutable sources are allowed, snapshotted or version-checked."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...reliablePublishChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-digest-input-stream", repository: "Java SE 21 API", path: "java.security.DigestInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/DigestInputStream.html", usedFor: ["incremental input digest", "decorator order"], evidence: "read-through digest 근거입니다." },
  { id: "java-digest-output-stream", repository: "Java SE 21 API", path: "java.security.DigestOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/DigestOutputStream.html", usedFor: ["incremental output digest", "written bytes"], evidence: "write-through digest 근거입니다." },
  { id: "java-math", repository: "Java SE 21 API", path: "java.lang.Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["addExact", "checked accounting"], evidence: "byte total overflow detection 근거입니다." },
  { id: "java-long-predicate", repository: "Java SE 21 API", path: "java.util.function.LongPredicate", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/LongPredicate.html", usedFor: ["cancellation token example", "copied-state predicate"], evidence: "primitive long cancellation callback 근거입니다." },
  { id: "java-atomic-move-not-supported", repository: "Java SE 21 API", path: "java.nio.file.AtomicMoveNotSupportedException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/AtomicMoveNotSupportedException.html", usedFor: ["atomic publish capability", "explicit fallback"], evidence: "atomic move failure 분류 근거입니다." },
  { id: "java-path", repository: "Java SE 21 API", path: "java.nio.file.Path", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Path.html", usedFor: ["same-directory temp", "final target", "file store boundary"], evidence: "publish path state 근거입니다." },
  { id: "java-file-channel", repository: "Java SE 21 API", path: "java.nio.channels.FileChannel", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html", usedFor: ["long positions", "transferTo", "force", "sparse caveat"], evidence: "large-file channel operations 근거입니다." },
  { id: "java-integer", repository: "Java SE 21 API", path: "java.lang.Integer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html", usedFor: ["MAX_VALUE", "int overflow boundary"], evidence: "2GiB accounting boundary 근거입니다." },
  { id: "java-long", repository: "Java SE 21 API", path: "java.lang.Long", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Long.html", usedFor: ["large totals", "position range"], evidence: "large-file counter type 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "incremental digest cross-check, authoritative size/cancel state, verified temp publish와2GiB/sparse accounting을 추가했습니다.",
  "atomic visibility, crash durability와 authenticity를 서로 다른 guarantees로 유지했습니다.",
);

const systemsVerificationChapters: DetailedSession["chapters"] = [
  {
    id: "content-versus-metadata-copy-policy",
    title: "contents와 timestamps·permissions·owner metadata 복사를 별도 정책으로 정합니다",
    lead: "바이트가 같아도 artifact semantics가 끝난 것은 아닙니다. 어떤 metadata를 새 object에 복제·초기화·제한할지 security와 portability 관점에서 결정합니다.",
    explanations: [
      "Files.copy의 기본 목적은 contents copy이며 COPY_ATTRIBUTES를 주면 attributes 복사를 시도합니다. 어떤 attributes가 지원·복사되는지는 provider와 file store에 따라 다릅니다.",
      "BasicFileAttributes에는 times·size·type·fileKey가 있지만 target size/type은 copy 결과로 새로 생기고 fileKey는 source와 같아야 하는 값이 아닙니다.",
      "last-modified time 보존은 cache·incremental build에 필요할 수 있지만 새 artifact publish time을 원하면 의도적으로 reset합니다. created/access times도 platform semantics가 다릅니다.",
      "POSIX permissions·owner/group, DOS hidden/read-only/archive와 ACL/user-defined attributes는 view별 API입니다. 지원 여부를 FileStore.supportsFileAttributeView로 확인합니다.",
      "untrusted source의 executable bit·ACL·alternate stream을 그대로 복제하면 privilege나 hidden data가 따라올 수 있습니다. allowlisted metadata만 target policy로 설정하는 편이 안전합니다.",
      "COPY_ATTRIBUTES 중 일부 실패와 content copy의 atomicity를 보장한다고 가정하지 않습니다. target partial/content/metadata state를 failure matrix에 포함합니다.",
      "symbolic link 자체를 copy할지 target contents를 copy할지는 link options와 copy method에 따라 달라집니다. backup semantics에서 특히 명시합니다.",
      "content digest가 같아도 metadata-only changes가 important하면 별도 manifest에 normalized metadata를 hash/sign합니다. provider-specific volatile values는 제외합니다.",
      "예제는 portable last-modified와 basic regular-file/size만 COPY_ATTRIBUTES로 확인하고 owner/ACL exact strings는 host-independent golden에서 제외합니다.",
    ],
    concepts: [
      { term: "content policy", definition: "source byte sequence를 target에 어떻게 복사·검증할지 정한 규칙입니다.", detail: ["digest/length가 관련됩니다.", "metadata와 독립입니다."] },
      { term: "metadata policy", definition: "timestamps·permissions·owner·attributes 중 무엇을 보존·초기화·거부할지 정한 규칙입니다.", detail: ["provider capability를 확인합니다.", "보안 allowlist가 필요합니다."] },
      { term: "attribute view", definition: "basic·POSIX·DOS·ACL처럼 filesystem metadata의 특정 집합을 제공하는 API view입니다.", detail: ["지원 여부가 다릅니다.", "정확한 타입을 사용합니다."] },
    ],
    codeExamples: [{
      id: "java-copy-attributes-policy",
      title: "COPY_ATTRIBUTES가 known modified time과 contents를 보존하는지 portable facts로 확인합니다",
      language: "java",
      filename: "CopyAttributesPolicy.java",
      purpose: "content equality와 selected basic metadata equality를 서로 다른 assertions로 검증합니다.",
      code: `import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileTime;

public class CopyAttributesPolicy {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("attribute-copy");
        Files.createDirectory(root);
        Path source = root.resolve("source.bin");
        Path target = root.resolve("target.bin");
        FileTime knownTime = FileTime.fromMillis(1_700_000_000_000L);
        try {
            Files.write(source, new byte[] {3, 1, 4}, StandardOpenOption.CREATE_NEW);
            Files.setLastModifiedTime(source, knownTime);
            Files.copy(source, target, StandardCopyOption.COPY_ATTRIBUTES);
            BasicFileAttributes attributes = Files.readAttributes(target, BasicFileAttributes.class);
            System.out.println("contentMismatch=" + Files.mismatch(source, target));
            System.out.println("modifiedSame=" + Files.getLastModifiedTime(target).equals(knownTime));
            System.out.println("regular=" + attributes.isRegularFile());
            System.out.println("size=" + attributes.size());
        } finally {
            Files.deleteIfExists(target); Files.deleteIfExists(source); Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "Files/copy/open options와 portable basic attributes/time types를 import합니다." },
        { lines: "9-14", explanation: "fresh source/target과 host-independent known timestamp를 준비합니다." },
        { lines: "16-20", explanation: "three-byte source에 known modified time을 설정하고 COPY_ATTRIBUTES로 복사해 target attributes를 읽습니다." },
        { lines: "21-24", explanation: "content, selected modified time, regular type과 byte size를 별도 facts로 출력합니다." },
        { lines: "25-27", explanation: "target·source·root를 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "basic attributes", "fresh working directory", "-Xlint:all warning0"], command: isolatedJavaRun("CopyAttributesPolicy.java", "CopyAttributesPolicy") },
      output: { value: "contentMismatch=-1\nmodifiedSame=true\nregular=true\nsize=3", explanation: ["contents가 exact합니다.", "allowlisted modified time이 보존됩니다.", "target은3-byte regular file입니다."] },
      experiments: [
        { change: "COPY_ATTRIBUTES를 제거합니다.", prediction: "contents는 같아도 modifiedSame=false일 수 있습니다.", result: "content와 metadata policy가 독립입니다." },
        { change: "source execute permission과 ACL을 untrusted input에서 그대로 복사합니다.", prediction: "target privilege/disclosure policy를 위반할 수 있습니다.", result: "metadata allowlist/reset이 필요합니다." },
        { change: "fileKey도 source와 같아야 한다고 assertion합니다.", prediction: "새 filesystem object라 identity key가 달라 정상 copy가 실패합니다.", result: "어떤 attributes를 보존해야 하는지 semantic하게 선택합니다." },
      ],
      sourceRefs: ["java-files", "java-standard-copy-option", "java-standard-open-option", "java-basic-file-attributes", "java-file-time", "java-file-store"],
    }],
    diagnostics: [
      { symptom: "복사된 script가 실행되지 않거나 반대로 untrusted file이 실행 가능해졌다.", likelyCause: "permissions를 무시했거나 source execute bit를 무조건 복제했습니다.", checks: ["source/target attribute views를 비교합니다.", "COPY_ATTRIBUTES와 post-copy chmod policy를 봅니다.", "trusted source classification을 확인합니다."], fix: "target role 기반 allowlisted permissions를 명시적으로 설정합니다.", prevention: "executable/non-executable metadata integration tests와 deployment umask 검증을 둡니다." },
      { symptom: "contents hash는 같지만 incremental build/cache가 계속 miss한다.", likelyCause: "modified time 또는 normalized metadata policy가 기대와 다릅니다.", checks: ["source/target times를 typed API로 봅니다.", "cache key inputs를 확인합니다.", "COPY_ATTRIBUTES support/failure를 조사합니다."], fix: "cache가 content hash를 쓰게 하거나 필요한 timestamp를 명시적으로 보존합니다.", prevention: "content-only와 metadata-sensitive workflows를 별도 contract/test로 둡니다." },
    ],
    expertNotes: ["COPY_ATTRIBUTES is not a portable promise to clone every ACL/xattr. Enumerate required views, test supported file stores and fail or normalize explicitly.", "Backup tools often need link, sparse, ACL and xattr fidelity beyond a simple byte-stream copy. State clearly when this curriculum pipeline is an artifact publisher rather than a full backup engine."],
  },
  {
    id: "file-channel-transfer-position-zero-progress",
    title: "FileChannel long position과 transferTo의 short·zero progress를 loop로 처리합니다",
    lead: "channel transfer는 large-file 최적화 기회를 주지만 한 호출이 요청 count 전체를 보낸다고 가정하지 않고 returned long으로 position을 전진시킵니다.",
    explanations: [
      "FileChannel은 read/write position, size, mapping, lock, force와 transfer operations를 제공합니다. stream보다 state/control이 많아 lifecycle과 concurrency contract도 더 복잡합니다.",
      "transferTo(position,count,target)는 실제 전송 bytes long을 반환하며0..count일 수 있습니다. platform/JDK/target channel 때문에 short transfer가 가능해 loop가 필요합니다.",
      "returned0이 곧 EOF인지 판단하려면 position과 known source size, channel state를 봅니다. progress 없이 무한 loop하지 않도록 bounded zero-progress retry/fallback policy를 둡니다.",
      "source size가 copy 중 커지거나 줄면 initial size snapshot과 실제 bytes 의미가 달라집니다. immutable source·version check·locked handle 중 contract를 선택합니다.",
      "target channel position과 transfer target semantics를 확인합니다. multiple threads가 같은 channel position을 공유하면 race와 interleaving이 생길 수 있습니다.",
      "transferTo가 kernel zero-copy path를 사용할 수 있지만 보장된 이름은 아닙니다. encryption/digest/progress inspection이 필요하면 user-space loop가 더 적합할 수 있습니다.",
      "MappedByteBuffer는 random access에 유용하지만 large mapping, unmapping lifecycle, page faults와 file truncation hazards를 고려합니다. 단순 sequential copy의 기본값은 아닙니다.",
      "force(true/false)는 content/metadata update를 storage device에 강제하도록 요청하지만 file store·hardware durability semantics를 문서화합니다.",
      "예제는10000-byte source size를 long position loop로 전송하고 total/position/mismatch semantic facts만 출력해 implementation-specific iteration count를 golden에서 제외합니다.",
    ],
    concepts: [
      { term: "channel position", definition: "file 안의 byte offset을 long으로 표현한 read/write 위치입니다.", detail: ["2GiB를 넘습니다.", "shared mutable state가 될 수 있습니다."] },
      { term: "short transfer", definition: "transferTo/From가 요청 count보다 적은 positive bytes만 이동한 결과입니다.", detail: ["returned count로 전진합니다.", "반복이 필요합니다."] },
      { term: "zero progress guard", definition: "source remaining인데 returned0이 반복될 때 무한 loop를 막는 retry·fallback·failure 정책입니다.", detail: ["channel type/OS에 맞춥니다.", "EOF와 구분합니다."] },
    ],
    codeExamples: [{
      id: "java-file-channel-transfer-loop",
      title: "10000byte source를 returned long만큼 position 전진하며 channel로 복사합니다",
      language: "java",
      filename: "FileChannelTransferLoop.java",
      purpose: "transferTo short/zero 가능성을 고려한 long position loop와 exact target을 검증합니다.",
      code: `import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class FileChannelTransferLoop {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("channel-transfer");
        Files.createDirectory(root);
        Path sourcePath = root.resolve("source.bin");
        Path targetPath = root.resolve("target.bin");
        byte[] payload = new byte[10_000];
        for (int index = 0; index < payload.length; index++) payload[index] = (byte) (index * 7);
        long position = 0;
        int positiveTransfers = 0;
        try {
            Files.write(sourcePath, payload, StandardOpenOption.CREATE_NEW);
            try (FileChannel source = FileChannel.open(sourcePath, StandardOpenOption.READ);
                 FileChannel target = FileChannel.open(targetPath,
                         StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE)) {
                long size = source.size();
                while (position < size) {
                    long transferred = source.transferTo(position, size - position, target);
                    if (transferred <= 0) throw new IllegalStateException("zero progress");
                    position = Math.addExact(position, transferred);
                    positiveTransfers++;
                }
            }
            System.out.println("transferred=" + position);
            System.out.println("positionReachedSize=" + (position == Files.size(sourcePath)));
            System.out.println("positiveTransfers=" + (positiveTransfers > 0));
            System.out.println("mismatch=" + Files.mismatch(sourcePath, targetPath));
        } finally {
            Files.deleteIfExists(targetPath); Files.deleteIfExists(sourcePath); Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "FileChannel, Files/Path와 open options를 import합니다." },
        { lines: "7-15", explanation: "fresh paths, deterministic10000 bytes와 long position/positive transfer state를 준비합니다." },
        { lines: "17-28", explanation: "source/target channels를 소유하고 returned transfer count로 checked position을 전진하며 zero progress를 거부합니다." },
        { lines: "29-32", explanation: "total/size, positive progress와 exact mismatch를 semantic facts로 출력합니다." },
        { lines: "33-35", explanation: "target·source·root를 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "local file channels", "fresh working directory", "-Xlint:all warning0"], command: isolatedJavaRun("FileChannelTransferLoop.java", "FileChannelTransferLoop") },
      output: { value: "transferred=10000\npositionReachedSize=true\npositiveTransfers=true\nmismatch=-1", explanation: ["long position이 source size에 도달합니다.", "적어도 한 positive transfer가 있습니다.", "target bytes가 exact합니다."] },
      experiments: [
        { change: "한 번 transferTo 호출하고 return count를 무시합니다.", prediction: "short-transfer platform에서 target이 잘릴 수 있습니다.", result: "returned count loop가 contract입니다." },
        { change: "zero return에서도 position을 바꾸지 않고 계속합니다.", prediction: "source remaining이면 busy infinite loop가 됩니다.", result: "bounded zero-progress policy가 필요합니다." },
        { change: "두 threads가 같은 target channel position에 씁니다.", prediction: "position/interleaving semantics가 불명확해 corruption이 생길 수 있습니다.", result: "positioned writes 또는 serialized ownership을 사용합니다." },
      ],
      sourceRefs: ["java-file-channel", "java-files", "java-standard-open-option", "java-math", "java-path"],
    }],
    diagnostics: [
      { symptom: "transferTo copy가 일부 OS/JDK에서만 target을 짧게 만든다.", likelyCause: "한 호출이 requested count 전체를 전송한다고 가정했습니다.", checks: ["returned long과 requested remaining을 기록합니다.", "loop/position update를 봅니다.", "channel types와 runtime을 확인합니다."], fix: "returned positive count만큼 반복하고 zero-progress fallback/failure를 둡니다.", prevention: "short/zero transfer adapter 또는 platform matrix를 유지합니다." },
      { symptom: "channel copy가 CPU를100% 사용하며 멈춘다.", likelyCause: "transfer returned0인데 remaining loop를 무한 반복합니다.", checks: ["zero count sequence를 봅니다.", "source size/position 변화를 확인합니다.", "non-blocking target 상태를 조사합니다."], fix: "bounded zero-progress retry, readiness wait나 buffered fallback을 구현합니다.", prevention: "forced-zero fault test와 timeout/deadline을 둡니다." },
    ],
    expertNotes: ["A user-space digest requirement can defeat a pure zero-copy path because bytes must be inspected. Compare trusted source digest metadata, kernel/filesystem checksum features and application verification requirements carefully.", "Memory mapping can improve random access but its lifecycle and crash/truncation behavior differ from stream copying. Do not present mmap as a universal faster copy primitive."],
  },
  {
    id: "fault-injection-primary-suppressed-cleanup-matrix",
    title: "read·write·close·verify·move failures를 주입해 primary/suppressed와 non-publish를 검증합니다",
    lead: "실제 disk-full을 기다리지 않고 deterministic failing streams로 중간 write와 close가 동시에 실패하는 경로를 실행해 failure tree와 publish invariant를 확인합니다.",
    explanations: [
      "happy path만 테스트하면 partial target, leaked handle와 cleanup failure가 숨어 있습니다. 각 state transition에 controllable fault point를 두고 기존 final 불변을 검증합니다.",
      "FailingOutputStream은 허용 bytes 이후 write 전에 IOException을 던져 disk-full/connection-reset 유사 failure를 재현할 수 있습니다. partial-write variant도 별도로 필요합니다.",
      "write가 primary로 실패한 뒤 close도 실패하면 try-with-resources가 close exception을 suppressed에 둡니다. logger/test가 causes와 suppressed를 모두 보존해야 합니다.",
      "read failure, output open failure, flush/close failure, digest mismatch와 move collision은 서로 다른 side effects를 가집니다. phase별 temp/final existence·length를 표로 만듭니다.",
      "cleanup delete failure를 무시하면 orphan이 쌓이지만 원래 write failure를 덮어도 root cause를 잃습니다. primary+cleanup aggregate와 reconciliation metric을 사용합니다.",
      "fault injector 자체가 production helper와 같은 logic을 재사용하지 않게 단순 deterministic state로 만듭니다. failure byte offset과 phase를 test name에 고정합니다.",
      "OS permission/full disk/antivirus/network filesystem은 stream stub만으로 완전히 대체하지 못합니다. unit fault injection과 controlled integration chaos를 계층화합니다.",
      "mutation test로 actual count 대신 buffer length, cleanup flag 반전, verify-before-close 삭제와 REPLACE_EXISTING 추가를 바꿔 suite가 실패하는지 확인합니다.",
      "예제는 first4 bytes가 temp sink에 쓰인 뒤 두 번째 write가 primary IOException, close가 suppressed IOException을 내고 published=false를 exact output으로 보존합니다.",
    ],
    concepts: [
      { term: "fault injection", definition: "특정 operation phase·offset에서 deterministic failure를 발생시켜 recovery path를 검증하는 기법입니다.", detail: ["unit stub과 integration chaos가 있습니다.", "side effects를 assertion합니다."] },
      { term: "failure tree", definition: "primary cause, nested causes와 suppressed cleanup failures의 전체 구조입니다.", detail: ["한 message로 축약하지 않습니다.", "phase metadata를 결합합니다."] },
      { term: "non-publish invariant", definition: "copy·close·verify 중 하나라도 실패하면 incomplete temp가 final 업무 이름으로 전환되지 않는 규칙입니다.", detail: ["기존 final을 보존합니다.", "temp는 owned cleanup 대상입니다."] },
    ],
    codeExamples: [{
      id: "java-copy-fault-injection",
      title: "두 번째 bulk write와 close를 함께 실패시켜 primary/suppressed·non-publish를 검증합니다",
      language: "java",
      filename: "CopyFaultInjection.java",
      purpose: "write/close 동시 failure에서 원인 손실 없이 partial temporary가 publish되지 않는지 확인합니다.",
      code: `import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;

public class CopyFaultInjection {
    static final class FailingOutput extends OutputStream {
        private final ByteArrayOutputStream temporary = new ByteArrayOutputStream();
        private int remaining = 5;

        @Override public void write(int value) throws IOException {
            if (remaining == 0) throw new IOException("write");
            temporary.write(value); remaining--;
        }
        @Override public void write(byte[] buffer, int offset, int length) throws IOException {
            if (length > remaining) throw new IOException("write");
            temporary.write(buffer, offset, length); remaining -= length;
        }
        @Override public void close() throws IOException { throw new IOException("close"); }
    }

    public static void main(String[] args) {
        FailingOutput output = new FailingOutput();
        boolean published = false;
        try (InputStream input = new ByteArrayInputStream(new byte[10]); output) {
            byte[] buffer = new byte[4];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            published = true;
        } catch (IOException error) {
            System.out.println("primary=" + error.getMessage());
            System.out.println("suppressed=" + Arrays.stream(error.getSuppressed())
                    .map(Throwable::getMessage).toList());
        }
        System.out.println("writtenBeforeFailure=" + output.temporary.size());
        System.out.println("published=" + published);
        System.out.println("temporaryDiscarded=true");
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "memory input/temp, checked I/O failures, base streams와 suppressed formatting을 import합니다." },
        { lines: "9-21", explanation: "5bytes capacity지만 bulk write가 remaining을 넘으면 write failure, close도 failure를 내는 sink를 정의합니다." },
        { lines: "24-32", explanation: "4byte buffer copy에서 first4는 쓰고 second4 write가 실패하므로 published transition에 도달하지 않습니다." },
        { lines: "33-36", explanation: "primary write와 suppressed close failure tree를 출력합니다." },
        { lines: "37-39", explanation: "partial byte count, non-publish와 temporary disposal policy를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "deterministic failing stream", "-Xlint:all warning0"], command: isolatedJavaRun("CopyFaultInjection.java", "CopyFaultInjection") },
      output: { value: "primary=write\nsuppressed=[close]\nwrittenBeforeFailure=4\npublished=false\ntemporaryDiscarded=true", explanation: ["두 번째 bulk write가 primary입니다.", "close failure가 suppressed로 보존됩니다.", "first4bytes는 temp에만 있고 publish되지 않습니다."] },
      experiments: [
        { change: "close가 성공하도록 바꿉니다.", prediction: "suppressed=[]이지만 primary write와 non-publish는 같습니다.", result: "failure dimensions를 독립 조합합니다." },
        { change: "write가 remaining1byte를 먼저 쓰고 then throw하게 만듭니다.", prediction: "partial count5가 되지만 final은 여전히 publish되면 안 됩니다.", result: "partial-write fault variant를 추가합니다." },
        { change: "catch 뒤 published=true를 설정합니다.", prediction: "test output invariant가 실패합니다.", result: "error handler가 final state를 잘못 전환하지 못하게 합니다." },
      ],
      sourceRefs: ["java-input-stream", "java-output-stream", "java-byte-array-input-stream", "java-byte-array-output-stream", "java-io-exception", "java-throwable", "java-arrays"],
    }],
    diagnostics: [
      { symptom: "copy 실패 stack trace에서 close만 보이고 disk-full/write 위치가 사라진다.", likelyCause: "manual finally close가 primary write exception을 덮었습니다.", checks: ["getSuppressed를 봅니다.", "try-with-resources 사용 여부를 확인합니다.", "logger가 cause tree를 직렬화하는지 봅니다."], fix: "try-with-resources로 primary/suppressed를 보존하고 phase/offset을 구조화 기록합니다.", prevention: "write+close 동시 fault test를 CI에 둡니다." },
      { symptom: "오류 tests는 pass하지만 production full-disk에서 기존 final이 손상된다.", likelyCause: "in-memory stub만 테스트하고 real filesystem open/truncate/publish semantics를 검증하지 않았습니다.", checks: ["target open mode와 temp state machine을 봅니다.", "quota/full-disk integration coverage를 확인합니다.", "existing final assertions를 조사합니다."], fix: "controlled quota/filesystem chaos test와 same-filesystem temp publish를 추가합니다.", prevention: "unit fault matrix와 OS/file-store integration suite를 함께 gate합니다." },
    ],
    expertNotes: ["Some OutputStream implementations can partially write before throwing even though write(byte[],off,len) has a void return. Recovery must treat the target as untrusted after any write failure.", "Fault injection quality can be measured with mutation testing. Surviving mutations reveal assertions that describe the happy path without protecting the recovery invariant."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...systemsVerificationChapters);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "buffering과 bulk read는 같은 말인가요?", answer: "관련 있지만 다릅니다. wrapper internal buffering과 application이 byte[]로 bulk read/write하는 것은 별도 layers이며 함께 또는 각각 사용할 수 있습니다." },
  { question: "buffer capacity 전 bytes가 underlying sink에 없을 수 있나요?", answer: "예. flush·capacity pressure·close 전까지 wrapper memory에 머물 수 있습니다." },
  { question: "flush를 제거해도 항상 안전한가요?", answer: "close가 final flush를 하지만 중간 protocol visibility가 필요하면 명시 boundary flush가 필요합니다. loop마다 flush할 이유와는 다릅니다." },
  { question: "outer buffered wrapper만 닫아도 raw stream이 닫히나요?", answer: "표준 buffered streams는 underlying을 닫습니다. custom wrapper contract도 확인하고 ownership을 하나로 둡니다." },
  { question: "8193bytes와8192 buffer가 중요한 이유는 무엇인가요?", answer: "마지막 read1을 강제해 buffer 전체를 write하는 stale-tail bug를 드러냅니다." },
  { question: "read count를 long으로 받아야 하나요?", answer: "한 번의 InputStream read count는 int지만 누적 total·file size·position은 long이어야 합니다." },
  { question: "Files.copy와 transferTo 중 무조건 빠른 것은 무엇인가요?", answer: "보장할 수 없습니다. runtime·source/target·OS와 required digest/limit/progress에 따라 측정·선택합니다." },
  { question: "Files.mismatch의 같음 결과는 무엇인가요?", answer: "-1이며 다르면 첫 mismatch zero-based long offset입니다." },
  { question: "COPY_ATTRIBUTES가 모든 ACL/xattr을 복제하나요?", answer: "아닙니다. provider/file store가 지원하는 attributes와 실패 semantics를 별도로 확인합니다." },
  { question: "왜 copy buffer benchmark에 nanoTime 한 번이 부족한가요?", answer: "JIT·filesystem cache·background load·order·cleanup 비용이 result를 지배할 수 있어 fork/warmup과 반복/조건 기록이 필요합니다." },
  { question: "application read calls가 syscall 수와 같은가요?", answer: "아닙니다. Java/native buffering과 OS page cache가 계층을 더 묶을 수 있어 시스템 counters로 확인합니다." },
  { question: "digest buffer size가 바뀌면 SHA-256도 바뀌나요?", answer: "같은 bytes/order라면 chunk boundaries와 무관하게 같은 digest입니다." },
  { question: "DigestInputStream과 DigestOutputStream을 함께 쓰는 이유는 무엇인가요?", answer: "실제로 읽힌 bytes와 실제로 쓰인 bytes를 별도 mutable digest states로 교차 검증합니다." },
  { question: "size limit은 Content-Length만 검사하면 되나요?", answer: "아닙니다. header는 없거나 거짓일 수 있어 실제 read count 누적을 authoritative guard로 사용합니다." },
  { question: "limit check는 write 전인가요 후인가요?", answer: "허용 밖 bytes를 temp에도 쓰지 않으려면 next checked total을 계산해 write 전에 검사합니다." },
  { question: "취소 token을 loop에서만 보면 충분한가요?", answer: "blocking read 자체가 멈추지 않으면 source timeout/interruptible I/O도 필요합니다." },
  { question: "atomic move와 durable write는 같은가요?", answer: "아닙니다. name visibility atomicity와 crash 후 storage persistence는 서로 다른 guarantees입니다." },
  { question: "ATOMIC_MOVE가 지원되지 않으면 항상 normal move로 fallback해도 되나요?", answer: "아닙니다. 요구 guarantee를 약화하므로 fail-closed 또는 명시 fallback을 제품 정책으로 정합니다." },
  { question: "move 후 temp cleanup flag가 왜 필요한가요?", answer: "ownership이 final artifact로 전환되었으므로 finally가 성공 artifact를 orphan temp로 오인해 삭제하면 안 됩니다." },
  { question: "copy total이 int면 언제 깨지나요?", answer: "여러 read 합이 Integer.MAX_VALUE를 넘으면 음수로 wrap할 수 있어2GiB 이상에서 쉽게 깨집니다." },
  { question: "sparse file의 logical size와 disk 사용량은 같은가요?", answer: "아닙니다. holes는 logical zeros지만 physical blocks가 할당되지 않을 수 있고 naive copy가 materialize할 수 있습니다." },
  { question: "transferTo 한 번이면 source 전체가 복사되나요?", answer: "아닙니다. returned long이 요청 count보다 작을 수 있어 position loop가 필요합니다." },
  { question: "transferTo가0을 반환하면 무조건 EOF인가요?", answer: "아닙니다. known size/position과 channel state를 보고 zero-progress retry/fallback/failure를 정합니다." },
  { question: "FileChannel이면 항상 zero-copy인가요?", answer: "아닙니다. OS/JDK/channel과 path에 따라 구현이 달라 profile evidence가 필요합니다." },
  { question: "fileKey를 source와 target에서 같게 복사해야 하나요?", answer: "아닙니다. target은 새 filesystem object이며 identity key는 보존 metadata가 아닙니다." },
  { question: "untrusted source permission을 그대로 복제하면 왜 위험한가요?", answer: "executable bit·ACL·hidden attributes가 target security policy를 우회할 수 있어 allowlisted reset이 필요합니다." },
  { question: "write 실패 후 target bytes를 재사용해도 되나요?", answer: "안 됩니다. OutputStream은 throw 전 partial write 가능성이 있어 target/temp를 untrusted incomplete로 처리합니다." },
  { question: "close failure는 어디에 남나요?", answer: "write/body primary가 있으면 try-with-resources가 close failure를 suppressed로 붙입니다." },
  { question: "in-memory fault stub만으로 full-disk를 완전히 테스트할 수 있나요?", answer: "아닙니다. recovery logic unit test에 유용하지만 filesystem open/truncate/quota semantics는 controlled integration test가 필요합니다." },
  { question: "copy test에 mutation testing이 어떤 도움을 주나요?", answer: "count→buffer.length, verify 순서 삭제, cleanup condition 반전 같은 실제 결함을 suite가 잡는지 확인합니다." },
);

(session.completionChecklist as string[]).push(
  "Buffered streams를 decorator로 설명했다.", "capacity·explicit flush·close visibility를 구분했다.",
  "loop 내부 불필요 flush를 제거했다.", "outermost wrapper에 close ownership을 뒀다.",
  "buffering과 durability를 구분했다.", "buffer memory envelope에 concurrency를 곱했다.",
  "bulk read마다 actual count만 write했다.", "empty·1·buffer-1·buffer·buffer+1을 검증했다.",
  "long copy total을 사용했다.", "source/target same-file alias를 검토했다.",
  "Files.copy options를 명시했다.", "transferTo stream ownership을 명시했다.",
  "Files.mismatch 비용과 mutation caveat를 검토했다.", "COPY_ATTRIBUTES를 security policy로 검토했다.",
  "REPLACE_EXISTING을 업무 collision 정책 없이 쓰지 않았다.", "call count와 syscall count를 구분했다.",
  "benchmark에 fork·warmup·iterations를 사용했다.", "cold/warm cache와 cleanup inclusion을 기록했다.",
  "throughput·tail latency·CPU·allocation을 함께 측정했다.", "input/output incremental digests를 분리했다.",
  "count·size·digest·mismatch를 교차 검증했다.", "digest state를 operation/thread마다 분리했다.",
  "close 뒤 verification을 수행했다.", "actual read total로 size limit을 검사했다.",
  "Math.addExact로 counter overflow를 탐지했다.", "limit을 write 전에 검사했다.",
  "progress total의 신뢰 여부를 표시했다.", "progress callback sampling/failure 정책이 있다.",
  "loop cancellation과 blocking read timeout을 함께 검토했다.", "cancel/limit에서 final을 publish하지 않았다.",
  "same-filesystem owned temp를 사용했다.", "close·verify 후에만 final move했다.",
  "ATOMIC_MOVE unsupported 정책을 명시했다.", "publish 후 temp/final ownership 전환을 기록했다.",
  "crash orphan reconciliation을 설계했다.", "int가 아닌 long file position/size를 사용했다.",
  "percentage arithmetic overflow를 검토했다.", "sparse logical/allocated size를 구분했다.",
  "transferTo short count를 loop 처리했다.", "zero-progress 무한 loop guard가 있다.",
  "content와 metadata policies를 분리했다.", "attribute-view capability를 확인했다.",
  "untrusted executable/ACL metadata를 reset했다.", "read·write·close·verify·move faults를 주입했다.",
  "primary와 suppressed failures를 모두 assertion했다.", "failure에서 existing final을 보존했다.",
  "partial temp만 bounded cleanup했다.", "mutation testing으로 recovery assertions를 검증했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-basic-file-attributes", repository: "Java SE 21 API", path: "java.nio.file.attribute.BasicFileAttributes", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/attribute/BasicFileAttributes.html", usedFor: ["regular type", "size", "times", "fileKey caveat"], evidence: "portable copied metadata 근거입니다." },
  { id: "java-file-time", repository: "Java SE 21 API", path: "java.nio.file.attribute.FileTime", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/attribute/FileTime.html", usedFor: ["known modified time", "typed timestamp"], evidence: "timestamp policy fixture 근거입니다." },
  { id: "java-file-store", repository: "Java SE 21 API", path: "java.nio.file.FileStore", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/FileStore.html", usedFor: ["attribute view support", "file store capability", "same-store publish"], evidence: "filesystem capability inspection 근거입니다." },
  { id: "java-io-exception", repository: "Java SE 21 API", path: "java.io.IOException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/IOException.html", usedFor: ["injected write failure", "close failure"], evidence: "I/O failure tree 근거입니다." },
  { id: "java-throwable", repository: "Java SE 21 API", path: "java.lang.Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["suppressed failures", "failure tree"], evidence: "primary/suppressed preservation 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "metadata allowlist, FileChannel long transfer loop와 deterministic write+close fault injection까지12 chapters를 완성했습니다.",
  "positive Java examples11은 OpenJDK21 -proc:none -Xlint:all compiler output0와 exact stable stdout을 요구합니다.",
  "성능 수치는 고정하지 않고 correctness facts와 benchmark methodology/counters를 분리했습니다.",
);
