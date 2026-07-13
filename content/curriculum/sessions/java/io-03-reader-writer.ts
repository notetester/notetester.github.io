import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["io-03-reader-writer"],
  slug: "io-03-reader-writer",
  courseId: "java",
  moduleId: "java-systems",
  order: 32,
  title: "Reader·Writer와 명시적 인코딩",
  subtitle: "byte↔character bridge, strict decoding과 Unicode·줄바꿈·BOM 정책을 검증 가능한 text pipeline으로 만듭니다.",
  level: "중급",
  estimatedMinutes: 1080,
  coreQuestion: "외부 bytes를 text로 읽고 다시 쓸 때 charset·malformed input·Unicode 단위·line ending과 append 정책을 어떻게 명시해야 글자 깨짐과 조용한 정보 손실을 막을 수 있을까요?",
  summary: "io-03 인벤토리는 class14의 Ex07_FileWriter·Ex08_FileReader·Ex09_FileCopy와 class15의 Ex01_InputStreamReader 네 파일입니다. class14 package9와 inventory4를 원본 그대로 OpenJDK21 warning0 compile하고, class14 absolute path literals4만 owned temp로 치환한 copies와 path-free class15 bridge copy를 합쳐 relocated4로 다시 compile합니다. UTF-8 child에서 Ex07 append writer는 Windows line separator를 포함해 final newline 없는 exact67 bytes를 만들고, Ex08은 세 logical lines를 stdout에 냅니다. Ex09는 readLine/newLine copy라 같은 three lines에 final separator를 추가한 exact69 bytes를 만들며, Ex01은 UTF-8 stdin '안녕 Reader'를 InputStreamReader로 받아 prompt+echo를 newline 없이 출력합니다. 이 evidence에서 Reader/Writer char contract, explicit InputStreamReader/OutputStreamWriter, strict CharsetDecoder/Encoder, line terminators, writer open modes, code unit/code point, normalization, BOM, streaming transform, record error channels와 one-byte chunk verification까지 확장합니다.",
  objectives: [
    "byte stream과 Reader/Writer의 char/code-unit abstraction을 구분한다.",
    "InputStreamReader·OutputStreamWriter에 charset을 명시해 UTF-8 bytes와 text를 왕복한다.",
    "CharsetDecoder/Encoder의 malformed·unmappable REPORT/REPLACE 정책을 선택한다.",
    "readLine이 제거하는 terminator와 newLine이 생성하는 platform separator를 copy 목적에 맞게 다룬다.",
    "append·truncate·CREATE_NEW writer options와 close/flush ownership을 명시한다.",
    "UTF-16 code unit·Unicode code point·grapheme·normalization·BOM을 서로 구분한다.",
    "chunk-split multibyte·malformed·mixed newline·record failure를 독립 matrix로 검증한다.",
  ],
  prerequisites: [
    { title: "버퍼와 binary copy", reason: "text I/O도 bounded buffering·actual count·resource ownership 위에서 bytes를 decode/encode합니다.", sessionSlug: "io-02-buffer-copy" },
    { title: "File·Path와 charset boundary", reason: "path/open modes와 explicit String↔byte charset의 기본 계약을 사용합니다.", sessionSlug: "io-01-file-bytes" },
  ],
  keywords: ["Reader", "Writer", "FileReader", "FileWriter", "BufferedReader", "BufferedWriter", "InputStreamReader", "OutputStreamWriter", "Charset", "CharsetDecoder", "CharsetEncoder", "CodingErrorAction", "UTF-8", "readLine", "newLine", "line terminator", "append", "code unit", "code point", "surrogate", "grapheme", "Normalizer", "BOM", "malformed input", "streaming transform"],
  chapters: [
    {
      id: "class14-class15-inventory4-text-bridge-audit",
      title: "class14 package9·inventory4·relocated4를 exact text bytes·lines·stdin echo로 감사합니다",
      lead: "FileWriter/Reader의 default charset과 platform newline behavior를 UTF-8 child·controlled temp로 고정하고, byte-char bridge는 fresh stdin/stdout child에서 재현합니다.",
      explanations: [
        "class14 package에는9 public mains가 있고 io-03은 Ex07·08·09를 사용합니다. class15 package는 serialization·network까지 섞여 warningful sources가 있으므로 이 세션은 inventory가 지정한 Ex01 bridge만 함께 warning0 compile합니다.",
        "Ex07 active shape는 File1·FileWriter1·BufferedWriter1·write4·newLine2·flush1·close2·path1입니다. append=true지만 fresh fixture라 기존 contents가 없고 three logical lines를 만듭니다.",
        "Ex07의 first two lines 뒤 newLine은 process line.separator를 쓰고 마지막 line에는 terminator가 없습니다. Windows UTF-8 child에서 exact67 bytes이며 same fixture에서 두 번 실행하면 append로134 bytes가 됩니다.",
        "Ex08은 FileReader1·BufferedReader1·readLine1·close2·path1이고 readLine이 CR/LF terminators를 제거한 three Strings를 println으로 출력합니다. stdout normalization 뒤 exact3 lines+final LF입니다.",
        "Ex09는 input/output File2, FileReader/Writer1씩, BufferedReader/Writer1씩, readLine/write/newLine/flush1과 close4·paths2입니다. every line에 newLine을 써 source에 없던 final CRLF를 추가해69 bytes가 됩니다.",
        "class15 Ex01은 OutputStreamWriter1·InputStreamReader1·buffered writer/reader1씩, write2·readLine1·flush2·close4입니다. UTF-8 stdin 한 줄을 읽고 prompt와 msg를 newline 없이 같은 stdout에 씁니다.",
        "process helper는 optional UTF-8 stdin을 쓰고 즉시 close하며 stdout/stderr를 동시에 drain합니다. interactive prompt 때문에 stdout을 기다린 뒤 input을 보내는 protocol이 필요하면 별도 expect-style harness를 씁니다.",
        "known class14 literals만 audit-root temp paths로 바꾸고 class15 Ex01은 byte-for-byte copy합니다. original scopes와 relocated scope 모두 warning0 compile하고 active shapes4 files를 검증합니다.",
        "baseline/hostile launcher options4 child isolation, timeout/tree kill/grace/Dispose, variable restore와 direct-child cleanup failure aggregation을 적용합니다. host paths와 real user input은 공개하지 않습니다.",
      ],
      concepts: [
        { term: "character stream", definition: "bytes가 아니라 Java char/code units를 읽고 쓰며 charset bridge와 결합되는 Reader/Writer abstraction입니다.", detail: ["binary copy용이 아닙니다.", "encoding은 bridge에서 결정됩니다."] },
        { term: "line model", definition: "terminator를 제거한 logical String sequence와 다시 쓸 separator policy입니다.", detail: ["readLine/newLine이 관련됩니다.", "byte-for-byte 보존과 다릅니다."] },
        { term: "bridge stream", definition: "InputStream/OutputStream bytes와 Reader/Writer characters 사이에서 charset decode/encode를 수행하는 adapter입니다.", detail: ["charset을 명시합니다.", "buffer wrapper와 책임이 다릅니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-io03-audit",
        title: "Writer/Reader/copy와 stdin bridge를 package/inventory/relocated scopes·두 modes에서 검증합니다",
        language: "powershell",
        filename: "verify-original-io03.ps1",
        purpose: "원본 locations를 건드리지 않고 exact UTF-8 bytes, line normalization, append/newLine와 interactive bridge behavior를 보존합니다.",
        code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference = 'Stop'
$optionNames = @('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved = @{}
foreach ($name in $optionNames) {
  $item = Get-Item -LiteralPath ("Env:" + $name) -ErrorAction SilentlyContinue
  $saved[$name] = @{ Exists = $null -ne $item; Value = if ($item) { $item.Value } else { $null } }
}
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("io03 audit " + [Guid]::NewGuid().ToString('N'))
$ownsRoot = $false; $bodyError = $null; $nl = [string][char]10

function Normalize([string]$text) { return $text.Replace(([string][char]13 + [char]10), [string][char]10) }
function Invoke-Child([string]$file, [string[]]$arguments, [string]$cwd, [AllowNull()][string]$inputText) {
  $start = [Diagnostics.ProcessStartInfo]::new()
  $start.FileName = $file; $start.WorkingDirectory = $cwd; $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true; $start.RedirectStandardOutput = $true; $start.RedirectStandardError = $true
  $start.StandardInputEncoding = [Text.UTF8Encoding]::new($false)
  $start.StandardOutputEncoding = [Text.UTF8Encoding]::new($false); $start.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
  foreach ($arg in $arguments) { [void]$start.ArgumentList.Add($arg) }
  foreach ($name in $optionNames) { [void]$start.Environment.Remove($name) }
  $process = [Diagnostics.Process]::new(); $process.StartInfo = $start
  try {
    if (-not $process.Start()) { throw 'process start failed' }
    $outTask = $process.StandardOutput.ReadToEndAsync(); $errTask = $process.StandardError.ReadToEndAsync()
    if ($null -ne $inputText) { $process.StandardInput.Write($inputText) }
    $process.StandardInput.Close()
    if (-not $process.WaitForExit(10000)) {
      $process.Kill($true)
      if (-not $process.WaitForExit(5000)) { throw 'termination grace exceeded' }
      [void]$outTask.GetAwaiter().GetResult(); [void]$errTask.GetAwaiter().GetResult(); throw 'child timeout'
    }
    return @{ Exit=$process.ExitCode; Out=(Normalize $outTask.GetAwaiter().GetResult()); Err=(Normalize $errTask.GetAwaiter().GetResult()) }
  } finally { $process.Dispose() }
}
function Compile([IO.FileInfo[]]$files, [string]$classes) {
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null
  $args = @('-encoding','UTF-8','--release','21','-proc:none','-g:source,lines','-Xlint:all','-XDrawDiagnostics','-d',$classes) + @($files.FullName)
  $result = Invoke-Child 'javac' $args $root $null
  if ($result.Exit -ne 0 -or $result.Out.Length -ne 0 -or $result.Err.Length -ne 0) { throw 'compile failed or warned' }
}
function Run([string]$classes, [string]$main, [AllowNull()][string]$inputText) {
  $result = Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,$main) $root $inputText
  if ($result.Exit -ne 0 -or $result.Err.Length -ne 0) { throw "$main process drift" }
  return $result.Out
}
function Remove-JavaComments([string]$text) { return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','') }
function Java-Literal([string]$path) { return $path.Replace('\','\\') }
function Write-Relocated([IO.FileInfo]$file, [string]$destination, [hashtable]$replacements) {
  $text = [IO.File]::ReadAllText($file.FullName)
  foreach ($entry in @($replacements.GetEnumerator() | Sort-Object { $_.Key.Length } -Descending)) {
    if (-not $text.Contains($entry.Key)) { throw 'relocation literal missing' }
    $replacement = [IO.Path]::GetFullPath($entry.Value); $prefix = [IO.Path]::GetFullPath($root).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $replacement.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'replacement outside audit root' }
    $text = $text.Replace($entry.Key,(Java-Literal $entry.Value))
    if ($text.Contains($entry.Key)) { throw 'relocation literal survived' }
  }
  [IO.File]::WriteAllText($destination,$text,[Text.UTF8Encoding]::new($false))
}
function Audit([string]$mode, [string]$class14, [string]$class15) {
  if ($mode -eq 'hostile') {
    $env:JDK_JAVAC_OPTIONS='-J-Dio03.audit=javac'; $env:JDK_JAVA_OPTIONS='-Dio03.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Dio03.audit=tool'; $env:_JAVA_OPTIONS='-Dio03.audit=legacy'
  } else { foreach ($name in $optionNames) { Remove-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue } }
  $package14 = @(Get-ChildItem -LiteralPath $class14 -Filter '*.java' | Sort-Object Name)
  $names14 = @('Ex07_FileWriter.java','Ex08_FileReader.java','Ex09_FileCopy.java')
  $inventory = @($names14 | ForEach-Object { Get-Item -LiteralPath (Join-Path $class14 $_) })
  $inventory += Get-Item -LiteralPath (Join-Path $class15 'Ex01_InputStreamReader.java')
  if ($package14.Count -ne 9 -or $inventory.Count -ne 4) { throw 'source inventory drift' }
  Compile $package14 (Join-Path $root ("package14-"+$mode)); Compile $inventory (Join-Path $root ("inventory-"+$mode))
  $mainPattern='public\s+static\s+void\s+main\s*\('
  $packageMains=@($package14|Where-Object{([IO.File]::ReadAllText($_.FullName))-match $mainPattern}).Count
  $inventoryMains=@($inventory|Where-Object{([IO.File]::ReadAllText($_.FullName))-match $mainPattern}).Count
  if ($packageMains -ne 9 -or $inventoryMains -ne 4) { throw 'main role drift' }

  $fixture=Join-Path $root ("fixture-"+$mode); $sourceCopy=Join-Path $root ("source-"+$mode)
  New-Item -ItemType Directory -Path $fixture,$sourceCopy -ErrorAction Stop|Out-Null
  $textFile=Join-Path $fixture 'test03.txt'; $copyFile=Join-Path $fixture 'copy.txt'
  foreach($index in 0,1){ Write-Relocated $inventory[$index] (Join-Path $sourceCopy $inventory[$index].Name) @{ 'D:\\util\\test03.txt'=$textFile } }
  Write-Relocated $inventory[2] (Join-Path $sourceCopy $inventory[2].Name) @{ 'D:\\util\\test03.txt'=$textFile; 'D:\\test01.txt'=$copyFile }
  [IO.File]::WriteAllText((Join-Path $sourceCopy $inventory[3].Name),[IO.File]::ReadAllText($inventory[3].FullName),[Text.UTF8Encoding]::new($false))
  $relocated=@(Get-ChildItem -LiteralPath $sourceCopy -Filter '*.java'|Sort-Object Name); $classes=Join-Path $root ("relocated-"+$mode); Compile $relocated $classes

  if ((Run $classes 'com.java.class14.Ex07_FileWriter' $null).Length -ne 0) { throw 'Ex07 stdout drift' }
  $lines=@('Hello, World!','환영합니다.대한민국','마포구 백범로 23')
  $expectedSource=[Text.Encoding]::UTF8.GetBytes(($lines -join [Environment]::NewLine))
  if ($expectedSource.Length -ne 67 -or [Convert]::ToHexString([IO.File]::ReadAllBytes($textFile)) -cne [Convert]::ToHexString($expectedSource)) { throw 'Ex07 bytes drift' }
  $expectedLines=($lines -join $nl)+$nl
  if ((Run $classes 'com.java.class14.Ex08_FileReader' $null) -cne $expectedLines) { throw 'Ex08 lines drift' }
  if ((Run $classes 'com.java.class14.Ex09_FileCopy' $null).Length -ne 0) { throw 'Ex09 stdout drift' }
  $expectedCopy=[Text.Encoding]::UTF8.GetBytes(($lines -join [Environment]::NewLine)+[Environment]::NewLine)
  if ($expectedCopy.Length -ne 69 -or [Convert]::ToHexString([IO.File]::ReadAllBytes($copyFile)) -cne [Convert]::ToHexString($expectedCopy)) { throw 'Ex09 bytes drift' }
  $bridge=Run $classes 'com.java.class15.Ex01_InputStreamReader' ("안녕 Reader"+[char]10)
  if ($bridge -cne '원하는 문자 : msg : 안녕 Reader') { throw 'Ex01 bridge drift' }

  $active=@{};foreach($file in $inventory){$active[$file.Name]=Remove-JavaComments([IO.File]::ReadAllText($file.FullName))};$joined=$active.Values -join $nl
  $shape=@{
    file=([regex]::Matches($joined,'new\s+File\s*\(')).Count; fw=([regex]::Matches($joined,'new\s+FileWriter\s*\(')).Count
    fr=([regex]::Matches($joined,'new\s+FileReader\s*\(')).Count; bw=([regex]::Matches($joined,'new\s+BufferedWriter\s*\(')).Count
    br=([regex]::Matches($joined,'new\s+BufferedReader\s*\(')).Count; isr=([regex]::Matches($joined,'new\s+InputStreamReader\s*\(')).Count
    osw=([regex]::Matches($joined,'new\s+OutputStreamWriter\s*\(')).Count; read=([regex]::Matches($joined,'\.readLine\s*\(')).Count
    write=([regex]::Matches($joined,'\.write\s*\(')).Count; newline=([regex]::Matches($joined,'\.newLine\s*\(')).Count
    flush=([regex]::Matches($joined,'\.flush\s*\(')).Count; close=([regex]::Matches($joined,'\.close\s*\(')).Count
    paths=([regex]::Matches($joined,'[A-Za-z]:\\\\')).Count
  }
  if($shape.file-ne4-or $shape.fw-ne2-or $shape.fr-ne2-or $shape.bw-ne3-or $shape.br-ne3-or $shape.isr-ne1-or $shape.osw-ne1-or $shape.read-ne3-or $shape.write-ne7-or $shape.newline-ne3-or $shape.flush-ne4-or $shape.close-ne12-or $shape.paths-ne4){throw 'source shape drift'}
  return "package14=9|inventory=4|relocated=4|mains=$packageMains,$inventoryMains,4|compiler=0;outputs=Ex07:67bytes|Ex08:3lines|Ex09:69bytes|Ex01:prompt+echo;shapes=File:4|reader:2+3|writer:2+3|bridge:1,1|readLine:3|write:7|newLine:3|flush:4|close:12;paths=4->temp"
}

try {
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'};New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  $source=[IO.Path]::GetFullPath($SourceRoot);$class14=Join-Path $source 'src/com/java/class14';$class15=Join-Path $source 'src/com/java/class15'
  $baseline=Audit 'baseline' $class14 $class15;$hostile=Audit 'hostile' $class14 $class15;if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline";'privacy=original-paths:not-run|fixture:owned-temp;launcherOptions=4'
} catch {$bodyError=$_.Exception} finally {
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){try{if($saved[$name].Exists){Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop;$restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}}else{Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}}}catch{$finalErrors.Add($_.Exception)}}
  try{if($ownsRoot){$resolved=[IO.Path]::GetFullPath($root);if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe cleanup'};if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop};if(Test-Path -LiteralPath $resolved){throw 'cleanup failed'}}}catch{$finalErrors.Add($_.Exception)}
  if($null-ne$bodyError){$finalErrors.Insert(0,$bodyError)};if($finalErrors.Count-eq1){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()};if($finalErrors.Count-gt1){throw[AggregateException]::new('audit and cleanup failures',$finalErrors.ToArray())}
}`,
        walkthrough: [
          { lines: "1-11", explanation: "launcher snapshots와 공백 temp ownership/error state를 준비합니다." },
          { lines: "13-59", explanation: "UTF-8 optional stdin, concurrent drains, timeout/tree kill과 compile/run/relocation helpers를 정의합니다." },
          { lines: "60-74", explanation: "class14 package9·cross-package inventory4 warning0 compile과 mains9/4를 확인합니다." },
          { lines: "76-82", explanation: "class14 path literals4를 mode별 temp로 치환하고 path-free class15 source를 함께 compile합니다." },
          { lines: "84-94", explanation: "Ex07 exact67 bytes, Ex08 three lines, Ex09 final-newline69 bytes와 Ex01 stdin prompt+echo를 검증합니다." },
          { lines: "96-107", explanation: "active reader/writer/bridge/readLine/newLine/close shapes를 검증합니다." },
          { lines: "110-120", explanation: "두 modes 결과 비교, variable restore·direct-child cleanup과 failure aggregation을 수행합니다." },
        ],
        run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "UTF-8 stdin/stdout", "baseline+hostile launcher modes"], command: "pwsh -NoProfile -File verify-original-io03.ps1 -SourceRoot <classstudy-root>" },
        output: { value: "spacePath=True,modes=2|same=True,package14=9|inventory=4|relocated=4|mains=9,4,4|compiler=0;outputs=Ex07:67bytes|Ex08:3lines|Ex09:69bytes|Ex01:prompt+echo;shapes=File:4|reader:2+3|writer:2+3|bridge:1,1|readLine:3|write:7|newLine:3|flush:4|close:12;paths=4->temp\nprivacy=original-paths:not-run|fixture:owned-temp;launcherOptions=4", explanation: ["original/relocated scopes가 warning0입니다.", "line model과 exact bytes 차이가 두 modes에서 같습니다.", "stdin bridge가 UTF-8 prompt+echo를 재현합니다."] },
        experiments: [
          { change: "Ex07을 같은 fixture에서 두 번 실행합니다.", prediction: "append=true라 source bytes가67에서134로 늘고 lines가6개가 됩니다.", result: "append는 open-mode state이며 clean fixture가 필요합니다." },
          { change: "Ex09가 마지막 line 뒤 newLine을 쓰지 않게 합니다.", prediction: "copy가69에서67bytes로 source와 같아집니다.", result: "readLine/newLine copy는 terminator policy를 바꿉니다." },
          { change: "Ex01 stdin을 닫고 data를 보내지 않습니다.", prediction: "readLine이 null이고 output에 msg : null이 나타납니다.", result: "EOF/null은 empty line과 다른 input state입니다." },
        ],
        sourceRefs: ["java-class14-ex01", "java-class14-ex02", "java-class14-ex03", "java-class14-ex04", "java-class14-ex05", "java-class14-ex06", "java-class14-ex07", "java-class14-ex08", "java-class14-ex09", "java-class15-ex01", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "text copy 결과가 source보다2bytes 길다.", likelyCause: "source final line에 terminator가 없지만 readLine/newLine loop가 모든 lines 뒤 platform separator를 추가했습니다.", checks: ["source 마지막 bytes를 hex로 봅니다.", "readLine/newLine 사용을 확인합니다.", "line separator와 final-newline policy를 기록합니다."], fix: "byte preservation이면 binary copy, logical line transform이면 explicit output newline/final policy를 사용합니다.", prevention: "LF/CRLF/mixed/no-final-newline fixtures를 둡니다." },
        { symptom: "BufferedReader를 사용했는데 배포 환경에서 한글이 깨진다.", likelyCause: "FileReader/InputStreamReader constructor가 default charset에 의존합니다.", checks: ["constructor charset argument를 봅니다.", "input declared/actual bytes를 확인합니다.", "decoder replacement characters를 조사합니다."], fix: "Files.newBufferedReader(path, UTF_8) 또는 InputStreamReader(stream, UTF_8)를 사용합니다.", prevention: "non-ASCII exact bytes와 hostile charset/malformed tests를 둡니다." },
      ],
      expertNotes: ["Ex01 closes wrappers around System.in/System.out in its fresh process. Long-lived applications should not let one component close process-global streams without explicit ownership.", "class15 package-wide warnings belong to serialization/network sessions. This audit keeps the io-03 inventory warning0 rather than hiding unrelated unchecked/deprecation warnings."],
    },
  ],
  lab: {
    title: "UTF-8 line ingestion·validation·normalization·atomic publish pipeline",
    scenario: "외부 text file을 strict UTF-8로 읽어 mixed line endings과 malformed data를 분류하고, record errors를 보존하면서 normalized LF output을 temp에 쓴 뒤 검증·publish합니다.",
    setup: ["UTF-8 valid, split multibyte, malformed/truncated, BOM, LF/CRLF/CR/mixed와 no-final-newline fixtures를 준비합니다.", "fresh same-filesystem temp root와 existing final collision을 준비합니다.", "record line number·max chars/bytes·normalization policy를 정의합니다."],
    steps: ["InputStreamReader에 UTF-8 CharsetDecoder REPORT를 연결합니다.", "bounded BufferedReader에서 logical lines와 original terminator 필요 여부를 policy로 분리합니다.", "line·record limits와 cancellation을 검사합니다.", "Unicode normalization과 schema parsing을 I/O decode 뒤 별도 단계로 적용합니다.", "valid records와 typed errors를 input count invariant로 보존합니다.", "OutputStreamWriter UTF-8 encoder REPORT와 explicit LF를 사용해 temp에 씁니다.", "close 뒤 exact bytes/digest·final newline policy를 검증합니다.", "atomic publish하고 failure에서는 owned temp만 정리합니다."],
    expectedResult: ["valid multibyte chars가 chunk boundaries와 무관하게 복원됩니다.", "malformed bytes가 replacement 없이 line/byte context error가 됩니다.", "mixed source endings가 명시한 LF/final policy로만 변환됩니다.", "record failures가 조용히 사라지지 않습니다.", "기존 final과 host/privacy 정보가 보존됩니다."],
    cleanup: ["reader/writer close 후 temp를 bounded 정리합니다.", "close/cleanup failures를 primary와 함께 보존합니다."],
    extensions: ["CSV quoted multiline parser와 JSON streaming parser를 적용합니다.", "gzip byte wrapper와 charset reader 순서를 비교합니다.", "Unicode spoofing/confusable validation을 security layer에 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "UTF-8 FileReader/Writer 코드를 Files.newBufferedReader/newBufferedWriter로 바꿉니다.", requirements: ["UTF_8을 명시합니다.", "CREATE_NEW/append policy를 명시합니다.", "try-with-resources를 사용합니다.", "한글 exact bytes를 검증합니다."], hints: ["default charset constructor를 남기지 않습니다.", "final newline을 선택합니다."], expectedOutcome: "runtime default와 무관한 portable text artifact가 됩니다.", solutionOutline: ["Path와 charset을 boundary에 둡니다.", "line/append options를 선택합니다.", "bytes/lines를 독립 검증합니다."] },
    { difficulty: "응용", prompt: "malformed UTF-8를 REPORT하고 valid/error records를 분리합니다.", requirements: ["CharsetDecoder CodingErrorAction.REPORT를 사용합니다.", "byte/line context를 safe error에 보존합니다.", "replacement/ignore를 금지합니다.", "valid+errors=input accounting을 검증합니다."], hints: ["InputStreamReader constructor에 configured decoder를 넘깁니다.", "raw secret line 전체는 log하지 않습니다."], expectedOutcome: "손상 data가 조용히 U+FFFD로 바뀌지 않는 ingestion이 됩니다.", solutionOutline: ["decoder를 구성합니다.", "malformed exception을 typed outcome으로 바꿉니다.", "independent fixtures와 accounting을 검증합니다."] },
    { difficulty: "설계", prompt: "대용량 text normalize/publish 서비스의 Unicode·line·record contract를 설계합니다.", requirements: ["bytes/chars/code points/graphemes limits를 구분합니다.", "BOM·normalization·line ending·final newline를 명시합니다.", "streaming memory·cancel·temp publish를 포함합니다.", "CSV/JSON parser boundary와 injection을 검토합니다.", "Windows/Linux charset/newline matrix를 포함합니다."], hints: ["readLine alone cannot preserve original terminators.", "normalization can change byte hashes/lengths."], expectedOutcome: "재현 가능하고 손실·spoofing·partial publish를 통제하는 text pipeline이 됩니다.", solutionOutline: ["decode→normalize→parse→encode states를 분리합니다.", "각 state의 limit/error/provenance를 정합니다.", "fault/Unicode matrix로 검증합니다."] },
  ],
  reviewQuestions: [
    { question: "Reader.read가 반환하는 단위는 무엇인가요?", answer: "int에 담긴 UTF-16 char code unit 또는 EOF-1이며 Unicode code point/grapheme 전체를 항상 한 번에 주는 것은 아닙니다." },
    { question: "FileReader constructor에 charset을 생략해도 되나요?", answer: "portable storage contract에는 생략하지 않고 explicit charset overload나 Files.newBufferedReader를 사용합니다." },
    { question: "BufferedReader가 charset을 결정하나요?", answer: "아닙니다. underlying Reader/InputStreamReader가 decode하고 BufferedReader는 character buffering/line API를 제공합니다." },
    { question: "readLine 결과에 newline이 포함되나요?", answer: "아닙니다. recognized line terminator를 제거한 String 또는 EOF null을 반환합니다." },
    { question: "empty line과 EOF는 어떻게 다른가요?", answer: "empty line은 empty String이고 EOF는 null입니다." },
    { question: "BufferedWriter.newLine은 항상 LF인가요?", answer: "아닙니다. system line separator를 쓰므로 platform에 따라 CRLF/LF가 될 수 있습니다." },
    { question: "Writer.flush와 close는 어떻게 다른가요?", answer: "flush는 계속 쓸 수 있게 두고 chars를 downstream에 전달하며 close는 final flush와 resource 종료를 수행합니다." },
    { question: "InputStreamReader는 buffering도 하나요?", answer: "decoding 과정의 internal buffering은 있을 수 있지만 high-level character buffering/readLine은 BufferedReader 책임입니다." },
    { question: "한글 한 글자는 Java char 하나인가요?", answer: "BMP 한글 syllable은 보통 char 하나지만 supplementary code point는 surrogate pair이고 grapheme은 여러 code points일 수 있습니다." },
    { question: "text copy가 byte-for-byte여야 하면 Reader/Writer가 적합한가요?", answer: "아닙니다. decoding/encoding·newline policy가 bytes를 바꿀 수 있어 binary copy를 사용합니다." },
  ],
  completionChecklist: [
    "class14 package9와 cross-package inventory4를 warning0 compile했다.", "path literals4와 text/bridge API shapes를 확인했다.",
    "original locations를 실행하지 않았다.", "relocated4를 warning0 compile했다.",
    "Ex07 append writer exact67 UTF-8 bytes를 검증했다.", "Ex08 logical three-line stdout을 검증했다.",
    "Ex09 final-newline exact69 bytes를 검증했다.", "Ex01 UTF-8 stdin prompt+echo를 검증했다.",
    "baseline/hostile launcher4·stdin/stdout isolation을 검증했다.", "temp ownership·timeout·cleanup failure aggregation을 적용했다.",
    "binary copy와 text line transform을 구분했다.", "모든 synthetic Java examples를 JDK21 warning0·exact output으로 검증한다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class14-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex01_FileClass.java", usedFor: ["package compile", "File boundary"], evidence: "class14 package warning0에 포함했습니다." },
    { id: "java-class14-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex02_FileOutputStream.java", usedFor: ["package compile", "byte/text contrast"], evidence: "raw byte output와 text writer 대비입니다." },
    { id: "java-class14-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex03_BufferedOutputStream.java", usedFor: ["package compile", "buffer contrast"], evidence: "byte buffer와 character buffer 책임을 구분했습니다." },
    { id: "java-class14-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex04_FileInputStream.java", usedFor: ["package compile", "byte read contrast"], evidence: "byte-to-char cast 문제와 Reader를 연결했습니다." },
    { id: "java-class14-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex05_BufferedInputStream.java", usedFor: ["package compile", "buffer/decode contrast"], evidence: "buffering이 decoding이 아님을 확인했습니다." },
    { id: "java-class14-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex06_FileCopy.java", usedFor: ["package compile", "binary copy contrast"], evidence: "byte-preserving copy와 text transform을 구분했습니다." },
    { id: "java-class14-ex07", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex07_FileWriter.java", usedFor: ["append writer", "three lines", "exact67 bytes"], evidence: "write4·newLine2·flush1·close2와 exact source bytes입니다." },
    { id: "java-class14-ex08", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex08_FileReader.java", usedFor: ["readLine", "three lines", "EOF null"], evidence: "readLine1과 exact three-line stdout입니다." },
    { id: "java-class14-ex09", repository: "javastudy2 classstudy", path: "src/com/java/class14/Ex09_FileCopy.java", usedFor: ["line copy", "final newline", "exact69 bytes"], evidence: "readLine/write/newLine과 source 대비 final separator 추가를 확인했습니다." },
    { id: "java-class15-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex01_InputStreamReader.java", usedFor: ["byte-char bridge", "stdin/stdout", "prompt echo"], evidence: "Input/OutputStream bridge1씩과 exact UTF-8 prompt+echo입니다." },
    { id: "jdk21-javac", repository: "Java SE 21 tools", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["warning0 compile", "--release21", "-proc:none"], evidence: "compiler output0 contract입니다." },
    { id: "powershell-environment", repository: "Microsoft PowerShell docs", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "restore"], evidence: "environment isolation 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["UTF-8 stdin/out", "ArgumentList", "redirects"], evidence: "child process I/O construction 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["launcher isolation"], evidence: "child environment removal 근거입니다." },
    { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "Dispose"], evidence: "bounded child lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout/stderr drains"], evidence: "redirect pipe drain 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 10, filesUsed: 10, uncoveredFiles: [],
    uncoveredNotes: ["class14 package9와 class15 Ex01을 읽어 inventory4 경계를 검증했습니다.", "class15 serialization/network files의 warnings와 runtime는 후속 sessions로 분리했습니다.", "default charset·append·manual double close·line ending transform은 숨기지 않고 modern chapters에서 교정합니다."],
  },
} satisfies DetailedSession;

export default session;

const decodingFoundationChapters: DetailedSession["chapters"] = [
  {
    id: "reader-writer-char-code-unit-contract",
    title: "Reader·Writer가 Unicode code point가 아니라 UTF-16 char code units를 이동함을 확인합니다",
    lead: "Reader.read()는 int를 반환하지만 byte0..255가 아니라 char0..65535 또는 EOF-1입니다. supplementary 문자는 surrogate pair 두 번에 걸쳐 읽힐 수 있습니다.",
    explanations: [
      "Reader/Writer는 Java char sequence abstraction입니다. InputStream/OutputStream의 byte semantics와 달라 binary file에 적용하면 decoding/encoding으로 bytes가 변합니다.",
      "Reader.read()가 int인 이유는 char0..65535와 EOF-1을 함께 표현하기 위해서입니다. EOF 확인 전에 char cast하면 U+FFFF처럼 잘못 처리할 수 있습니다.",
      "Java char는 UTF-16 code unit입니다. BMP의 많은 문자는1 char이지만 U+1F600 같은 supplementary code point는 high/low surrogate2 chars입니다.",
      "String.length와 Writer에 쓴 char count는 user-perceived characters 수가 아닙니다. codePointCount와 BreakIterator/Unicode grapheme library의 질문을 구분합니다.",
      "unpaired surrogate가 String에 존재할 수 있고 encoder policy에 따라 malformed/unmappable failure나 replacement가 됩니다. internal String도 항상 well-formed Unicode라고 가정하지 않습니다.",
      "StringReader/StringWriter는 filesystem/charset 없이 char-stream mechanics를 검증하는 memory fixtures입니다. byte bridge correctness는 별도 InputStreamReader example로 확인합니다.",
      "Reader.read(char[])도 short read와 actual count를 반환합니다. Writer.write(buffer,0,count) 규칙은 byte bulk copy와 동일한 모양이지만 단위가 char code units입니다.",
      "Writer append(CharSequence)와 write(String)는 API convenience이며 output encoding은 underlying OutputStreamWriter에서 결정됩니다.",
      "예제는 A, supplementary emoji, BMP 한글을 읽어 four UTF-16 units와 three code points를 exact hex/count로 출력합니다.",
    ],
    concepts: [
      { term: "UTF-16 code unit", definition: "Java char 하나가 저장하는16-bit 단위입니다.", detail: ["BMP code point는 보통 하나입니다.", "supplementary는 surrogate pair입니다."] },
      { term: "surrogate pair", definition: "U+10000 이상 code point를 high/low UTF-16 code units 두 개로 표현한 쌍입니다.", detail: ["Reader에서 두 chars입니다.", "쌍 검증이 필요합니다."] },
      { term: "character EOF", definition: "Reader에서 더 읽을 char code unit이 없음을 뜻하는 int -1입니다.", detail: ["char cast 전에 검사합니다.", "U+FFFF와 구분합니다."] },
    ],
    codeExamples: [{
      id: "java-reader-code-unit-domain",
      title: "A·emoji·한글을 Reader로 읽어 char units4와 code points3을 비교합니다",
      language: "java",
      filename: "ReaderCodeUnitDomain.java",
      purpose: "Reader.read int domain과 surrogate pair를 exact UTF-16 hex로 검증합니다.",
      code: `import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

public class ReaderCodeUnitDomain {
    public static void main(String[] args) throws Exception {
        String source = "A😀한";
        List<String> units = new ArrayList<>();
        StringWriter writer = new StringWriter();
        try (StringReader reader = new StringReader(source)) {
            int value;
            while ((value = reader.read()) != -1) {
                units.add(String.format("%04X", value));
                writer.write(value);
            }
        }
        String restored = writer.toString();
        System.out.println("units=" + units);
        System.out.println("charCount=" + restored.length());
        System.out.println("codePointCount=" + restored.codePointCount(0, restored.length()));
        System.out.println("roundTrip=" + source.equals(restored));
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "memory character streams와 observed unit list를 import합니다." },
        { lines: "7-10", explanation: "BMP/non-BMP/BMP source, unit hex와 target writer를 준비합니다." },
        { lines: "11-17", explanation: "EOF를 int에서 먼저 검사하고 each UTF-16 unit을 hex와 writer에 보존합니다." },
        { lines: "18-22", explanation: "units, char/code-point counts와 exact text round-trip을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8 source", "-Xlint:all warning0"], command: isolatedJavaRun("ReaderCodeUnitDomain.java", "ReaderCodeUnitDomain") },
      output: { value: "units=[0041, D83D, DE00, D55C]\ncharCount=4\ncodePointCount=3\nroundTrip=true", explanation: ["emoji가D83D DE00 두 units입니다.", "char4와 code points3이 다릅니다.", "Writer는 units를 손실 없이 보존합니다."] },
      experiments: [
        { change: "read result를 EOF 검사 전에 char로 cast합니다.", prediction: "-1이 U+FFFF로 바뀌어 extra char가 생길 수 있습니다.", result: "int sentinel을 먼저 처리합니다." },
        { change: "source를 emoji 하나로 바꿉니다.", prediction: "charCount2, codePointCount1입니다.", result: "char length를 사용자 문자 수로 부르지 않습니다." },
        { change: "high surrogate만 Writer에 씁니다.", prediction: "String은 만들 수 있지만 UTF-8 encoder REPORT가 malformed로 거부할 수 있습니다.", result: "internal code-unit validity와 encoding을 검증합니다." },
      ],
      sourceRefs: ["java-reader-api", "java-writer-api", "java-string-reader", "java-string-writer", "java-character-api", "java-string-api"],
    }],
    diagnostics: [
      { symptom: "emoji가 두 글자로 세어져 length limit이 잘못 적용된다.", likelyCause: "String.length/char count를 Unicode code-point나 grapheme count로 사용했습니다.", checks: ["surrogate pairs를 scan합니다.", "codePointCount와 UI grapheme count를 비교합니다.", "limit 단위를 확인합니다."], fix: "업무 limit에 code units/points/graphemes/encoded bytes 중 정확한 단위를 선택합니다.", prevention: "emoji·combining marks·ZWJ fixtures를 validation tests에 둡니다." },
      { symptom: "Writer output에 마지막 U+FFFF 비슷한 문자가 추가된다.", likelyCause: "Reader.read -1을 char로 cast한 뒤 write했습니다.", checks: ["loop variable type과 EOF check를 봅니다.", "empty/single input을 테스트합니다.", "output code units hex를 봅니다."], fix: "int value==-1을 먼저 검사한 뒤 write합니다.", prevention: "empty/EOF boundary exact-unit tests를 둡니다." },
    ],
    expertNotes: ["Reader is a UTF-16 code-unit API. Code-point-aware processing can use codePoints after materialization or a streaming surrogate-aware state machine; grapheme segmentation is yet another layer.", "StringWriter.close is effectively harmless, but using try-with-resources in the example keeps ownership shape comparable without claiming all Writer implementations behave the same."],
  },
  {
    id: "explicit-byte-character-bridge",
    title: "InputStreamReader·OutputStreamWriter에 UTF-8을 명시해 bytes↔chars 경계를 고정합니다",
    lead: "buffer wrapper가 아니라 bridge constructor에서 charset을 선택하고, 같은 text를 exact UTF-8 bytes로 되돌리는지 확인합니다.",
    explanations: [
      "InputStreamReader는 InputStream bytes를 CharsetDecoder로 characters에 바꿉니다. OutputStreamWriter는 characters를 CharsetEncoder로 bytes에 바꿉니다.",
      "charset을 생략한 constructor는 default charset에 의존합니다. JDK/runtime launch configuration이 바뀌어도 storage/protocol bytes가 같아야 하므로 StandardCharsets.UTF_8을 명시합니다.",
      "bridge는 multi-byte sequence가 input chunk 경계에서 끊겨도 decoder state로 다음 bytes와 결합합니다. byte를 개별 char cast하는 방식과 근본적으로 다릅니다.",
      "BufferedReader/Writer는 bridge 바깥에 둡니다: InputStream→InputStreamReader(UTF-8)→BufferedReader, BufferedWriter→OutputStreamWriter(UTF-8)→OutputStream 순입니다.",
      "outer wrapper를 닫으면 bridge와 underlying stream을 연쇄 close합니다. caller-owned System streams를 닫지 말아야 하는 long-lived component는 non-closing wrapper나 ownership contract를 사용합니다.",
      "OutputStreamWriter flush는 encoder의 현재 output을 downstream에 전달하지만 incomplete surrogate state와 close finalization behavior를 encoder contract로 확인합니다.",
      "Reader.ready는 EOF/전체 message availability를 의미하지 않습니다. interactive/non-blocking protocol framing은 별도 설계합니다.",
      "bridge가 실제 사용한 charset은 getEncoding으로 canonical/historical name을 반환할 수 있으므로 protocol equality를 문자열 formatting보다 Charset object/config로 관리합니다.",
      "예제는 UTF-8 two lines를 one bridge로 decode해 separator를 pipe로 바꾼 뒤 다시 UTF-8 encode하고 text·byte equality를 검증합니다.",
    ],
    concepts: [
      { term: "decoder bridge", definition: "byte input을 charset state machine으로 char stream에 연결하는 InputStreamReader입니다.", detail: ["chunk-split multibytes를 처리합니다.", "error policy를 구성할 수 있습니다."] },
      { term: "encoder bridge", definition: "char output을 charset bytes로 바꿔 OutputStream에 연결하는 OutputStreamWriter입니다.", detail: ["flush/close lifecycle이 있습니다.", "unmappable policy를 가집니다."] },
      { term: "wrapper order", definition: "bytes→decode→character buffer 또는 character buffer→encode→bytes로 responsibility를 쌓는 순서입니다.", detail: ["잘못된 layer를 피합니다.", "outer resource가 소유합니다."] },
    ],
    codeExamples: [{
      id: "java-explicit-utf8-bridge",
      title: "UTF-8 bytes를 두 lines로 decode하고 pipe text를 다시 exact UTF-8로 encode합니다",
      language: "java",
      filename: "ExplicitUtf8Bridge.java",
      purpose: "default charset 없이 byte/character bridge의 decode·transform·encode 결과를 검증합니다.",
      code: `import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class ExplicitUtf8Bridge {
    public static void main(String[] args) throws Exception {
        byte[] source = "안녕\\nReader".getBytes(StandardCharsets.UTF_8);
        String transformed;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ByteArrayInputStream(source), StandardCharsets.UTF_8))) {
            transformed = reader.readLine() + "|" + reader.readLine();
        }
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (OutputStreamWriter writer = new OutputStreamWriter(bytes, StandardCharsets.UTF_8)) {
            writer.write(transformed);
        }
        byte[] expected = "안녕|Reader".getBytes(StandardCharsets.UTF_8);
        System.out.println("text=" + transformed);
        System.out.println("utf8Length=" + bytes.size());
        System.out.println("bytesEqual=" + Arrays.equals(expected, bytes.toByteArray()));
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "buffered reader, byte streams, UTF-8 bridges와 equality를 import합니다." },
        { lines: "10-16", explanation: "UTF-8 source를 explicit decoder bridge로 two lines에 읽어 pipe-delimited text로 만듭니다." },
        { lines: "17-20", explanation: "explicit UTF-8 encoder bridge를 close해 target bytes를 완성합니다." },
        { lines: "21-24", explanation: "independent expected bytes와 text/length/equality를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("ExplicitUtf8Bridge.java", "ExplicitUtf8Bridge") },
      output: { value: "text=안녕|Reader\nutf8Length=13\nbytesEqual=true", explanation: ["두 lines가 pipe text로 변환됩니다.", "한글6bytes+pipe1+Reader6=13bytes입니다.", "explicit UTF-8 bytes가 exact합니다."] },
      experiments: [
        { change: "bridge charset arguments를 제거합니다.", prediction: "현재 UTF-8 default에서는 pass할 수 있지만 다른 runtime에서 length/equality가 달라집니다.", result: "local default를 protocol contract로 쓰지 않습니다." },
        { change: "Reader 없이 source bytes를 char cast합니다.", prediction: "한글이 six byte-derived chars로 깨집니다.", result: "stateful charset decoder가 필요합니다." },
        { change: "OutputStreamWriter를 close하지 않고 bytes를 먼저 읽습니다.", prediction: "buffer/encoder에 남은 bytes를 놓칠 수 있습니다.", result: "completion 뒤 결과를 관찰합니다." },
      ],
      sourceRefs: ["java-input-stream-reader", "java-output-stream-writer", "java-buffered-reader", "java-standard-charsets", "java-byte-array-input-stream", "java-byte-array-output-stream", "java-class15-ex01"],
    }],
    diagnostics: [
      { symptom: "stdin은 정상인데 같은 text file만 깨진다.", likelyCause: "한 boundary는 UTF-8 bridge, 다른 boundary는 default FileReader를 사용합니다.", checks: ["모든 Reader/Writer construction sites를 inventory합니다.", "actual file bytes/BOM을 봅니다.", "declared charset provenance를 확인합니다."], fix: "storage/protocol별 charset을 configuration/schema로 명시해 모든 bridges에 전달합니다.", prevention: "boundary별 non-ASCII exact-byte contract tests를 둡니다." },
      { symptom: "chunk가 작을 때만 multi-byte 문자가 깨진다.", likelyCause: "각 byte chunk를 독립 new String으로 decode해 incomplete sequence state를 잃었습니다.", checks: ["decode 호출 단위와 decoder reuse를 봅니다.", "one-byte source adapter를 테스트합니다.", "replacement chars를 확인합니다."], fix: "InputStreamReader 또는 stateful CharsetDecoder를 stream 전체에 유지합니다.", prevention: "모든 byte split positions를 순회하는 multibyte property test를 둡니다." },
    ],
    expertNotes: ["Repeated new String(chunk, UTF_8) is not a streaming decoder; a multibyte sequence can span chunks. Maintain CharsetDecoder state or use InputStreamReader.", "Closing a writer around process-global System.out closes the underlying stream for later components. Fresh CLI examples tolerate this, servers should define non-owning boundaries."],
  },
  {
    id: "strict-decoder-malformed-unmappable-policy",
    title: "CharsetDecoder REPORT로 malformed bytes를 replacement 없이 typed failure로 만듭니다",
    lead: "decode가 String을 반환했다는 사실만 보지 않고 손상 bytes를 reject·replace·ignore 중 어떤 정책으로 처리할지 ingestion schema에 명시합니다.",
    explanations: [
      "malformed input은 선택한 charset 자체의 byte sequence 규칙을 위반합니다. unmappable character는 encoding 방향에서 valid Unicode가 target charset에 표현되지 않는 경우처럼 방향별 의미가 다릅니다.",
      "CharsetDecoder.newDecoder의 default error actions를 확인하고 onMalformedInput/onUnmappableCharacter(CodingErrorAction.REPORT)로 손상을 exception으로 드러냅니다.",
      "REPLACE는 U+FFFD 등 replacement를 넣어 pipeline을 계속하지만 original data 위치와 값이 사라집니다. UI preview에는 가능해도 database key·signature·financial record ingestion에는 부적절할 수 있습니다.",
      "IGNORE는 bytes/characters를 조용히 버려 accounting을 깨뜨립니다. 명시적 lossy cleanup 제품 기능이 아니면 사용하지 않습니다.",
      "InputStreamReader에 configured CharsetDecoder를 넘기면 streaming boundaries에서도 REPORT state가 유지됩니다. ByteBuffer decode 예제는 small isolated failure를 보여 줍니다.",
      "MalformedInputException length는 malformed input length 정보를 줄 수 있지만 raw surrounding bytes를 public error에 복사하면 secrets를 노출할 수 있습니다. safe record/offset context를 사용합니다.",
      "encoder도 unpaired surrogate나 target charset에 없는 code point를 REPORT할 수 있습니다. decode만 strict하고 output이 replacement면 round-trip integrity가 깨집니다.",
      "BOM이나 wrong charset bytes를 malformed라고 단정하지 않습니다. input provenance/declared charset detection 정책을 먼저 적용하고 해당 decoder로 검증합니다.",
      "예제는 valid C3 A9를 é로 decode하고 invalid C3 28을 REPORT해 CharacterCodingException category로 확인합니다.",
    ],
    concepts: [
      { term: "malformed input", definition: "선택한 charset 문법상 올바른 character sequence가 될 수 없는 byte/code-unit sequence입니다.", detail: ["REPORT로 드러냅니다.", "chunk boundary와 구분합니다."] },
      { term: "unmappable", definition: "valid source character가 target charset 표현에 대응되지 않는 encoding failure입니다.", detail: ["encoder에서 흔합니다.", "replacement policy를 정합니다."] },
      { term: "CodingErrorAction", definition: "malformed/unmappable data를 REPORT·REPLACE·IGNORE 중 어떻게 처리할지 정하는 policy입니다.", detail: ["각 방향에 설정합니다.", "silent loss를 피합니다."] },
    ],
    codeExamples: [{
      id: "java-strict-utf8-decoder",
      title: "valid é와 malformed C3 28을 UTF-8 REPORT decoder로 구분합니다",
      language: "java",
      filename: "StrictUtf8Decoder.java",
      purpose: "손상 bytes가 U+FFFD로 조용히 바뀌지 않고 typed failure가 되는지 검증합니다.",
      code: `import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

public class StrictUtf8Decoder {
    static String decode(byte[] bytes) throws CharacterCodingException {
        CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        return decoder.decode(ByteBuffer.wrap(bytes)).toString();
    }

    public static void main(String[] args) throws Exception {
        String valid = decode(new byte[] {(byte) 0xC3, (byte) 0xA9});
        boolean malformedRejected = false;
        try {
            decode(new byte[] {(byte) 0xC3, 0x28});
        } catch (CharacterCodingException expected) {
            malformedRejected = true;
        }
        System.out.println("valid=" + valid);
        System.out.println("malformedRejected=" + malformedRejected);
        System.out.println("replacementPresent=" + valid.contains("�"));
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "ByteBuffer와 strict decoder/error policy types를 import합니다." },
        { lines: "8-13", explanation: "operation-local UTF-8 decoder의 malformed/unmappable actions를 REPORT로 두고 bytes를 decode합니다." },
        { lines: "16-23", explanation: "valid two-byte é와 invalid continuation case를 typed failure로 분류합니다." },
        { lines: "24-26", explanation: "valid result, rejection과 replacement absence를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("StrictUtf8Decoder.java", "StrictUtf8Decoder") },
      output: { value: "valid=é\nmalformedRejected=true\nreplacementPresent=false", explanation: ["C3 A9는 é입니다.", "C3 28은 strict failure입니다.", "valid result에 replacement가 없습니다."] },
      experiments: [
        { change: "REPORT를 REPLACE로 바꿉니다.", prediction: "malformedRejected=false가 되고 replacement character가 결과에 들어갑니다.", result: "lossy policy를 의도적으로 선택해야 합니다." },
        { change: "C3와 A9를 각각 별도 decoder로 decode합니다.", prediction: "각 chunk가 malformed가 됩니다.", result: "streaming decoder state를 chunk 사이 유지합니다." },
        { change: "US_ASCII encoder로 한글을 REPORT합니다.", prediction: "unmappable encoding failure가 납니다.", result: "decode/encode 양쪽 error actions를 구성합니다." },
      ],
      sourceRefs: ["java-charset-decoder", "java-charset-encoder", "java-coding-error-action", "java-character-coding-exception", "java-standard-charsets", "java-byte-buffer"],
    }],
    diagnostics: [
      { symptom: "입력 손상이 있었는데 pipeline은 성공하고 글자 일부가�로 바뀐다.", likelyCause: "decoder default/replacement policy로 malformed bytes를 대체했습니다.", checks: ["U+FFFD count를 봅니다.", "CodingErrorAction 설정을 확인합니다.", "raw bytes와 declared charset을 검증합니다."], fix: "integrity가 필요한 ingestion은 REPORT하고 typed error channel로 분리합니다.", prevention: "malformed·truncated·overlong·invalid-continuation corpus를 둡니다." },
      { symptom: "정상 multi-byte input이 chunk 경계에서 malformed로 거부된다.", likelyCause: "decoder를 chunk마다 새로 만들어 incomplete bytes를 end-of-input으로 처리했습니다.", checks: ["decoder lifetime을 봅니다.", "one-byte chunks로 재현합니다.", "decode endOfInput/flush protocol을 확인합니다."], fix: "하나의 InputStreamReader/CharsetDecoder state를 전체 stream에 유지합니다.", prevention: "모든 split positions를 systematic test합니다." },
    ],
    expertNotes: ["Strict decoding is a data-quality decision. A user-facing editor may deliberately replace while preserving an error marker; an identity or signature pipeline usually must reject.", "Unicode security validation happens after successful decoding. Well-formed UTF-8 can still contain bidi controls, confusables or forbidden normalization forms."],
  },
  {
    id: "readline-terminator-final-newline-policy",
    title: "readLine이 CRLF·LF·CR을 제거한다는 사실과 output final-newline 정책을 분리합니다",
    lead: "logical line processing은 원본 terminator bytes를 잃습니다. normalize가 목적이면 explicit LF를 쓰고 byte-preserving copy가 목적이면 Reader를 사용하지 않습니다.",
    explanations: [
      "BufferedReader.readLine은 LF, CR 또는 CRLF로 끝나는 line의 terminator를 반환 String에 포함하지 않습니다. EOF 전에 data가 있으면 terminator 없는 마지막 line도 반환합니다.",
      "empty line은 empty String이고 EOF는 null입니다. while((line=readLine())!=null) pattern이 empty records를 건너뛰지 않게 합니다.",
      "원본이 CRLF/LF/CR 중 무엇이었는지 readLine result만으로 복원할 수 없습니다. forensic/byte-exact copy에는 binary parser나 terminator-aware reader가 필요합니다.",
      "BufferedWriter.newLine은 platform separator를 쓰므로 Windows에서 CRLF, 일반 Unix에서 LF가 됩니다. cross-platform artifact가 LF를 요구하면 writer.write('\\n') 또는 format-specific API를 씁니다.",
      "모든 logical line 뒤 newLine을 쓰면 source에 없던 final newline이 추가됩니다. POSIX text convention을 따를지 exact logical source final state를 보존할지 명시합니다.",
      "String.lines도 다양한 line terminators를 처리하지만 trailing empty semantics를 확인합니다. split regex와 readLine은 edge cases가 다를 수 있습니다.",
      "line length가 unbounded면 readLine이 huge String을 할당할 수 있습니다. untrusted input에는 bounded line reader/parser와 byte/char total limits가 필요합니다.",
      "line number는 physical terminators가 아니라 logical read successes를 기준으로 올릴 수 있습니다. multi-line CSV/JSON record number와 다르므로 parser layer가 별도 context를 관리합니다.",
      "예제는 a CRLF, b LF, c CR, final d no terminator를 four logical lines로 읽고 explicit pipe normalization으로 terminator loss와 final policy를 보여 줍니다.",
    ],
    concepts: [
      { term: "logical line", definition: "line terminator를 제거한 character sequence이며 empty일 수 있습니다.", detail: ["EOF null과 다릅니다.", "original terminator를 잃습니다."] },
      { term: "line-ending normalization", definition: "CRLF·CR·LF를 chosen separator로 통일하는 deliberate text transformation입니다.", detail: ["byte copy가 아닙니다.", "format policy를 기록합니다."] },
      { term: "final newline policy", definition: "마지막 logical line 뒤 separator를 반드시 둘지 source state를 보존할지 정한 규칙입니다.", detail: ["hash/bytes를 바꿉니다.", "tool compatibility에 영향이 있습니다."] },
    ],
    codeExamples: [{
      id: "java-line-terminator-normalization",
      title: "CRLF·LF·CR·no-final-terminator를 four lines로 읽고 explicit representation을 만듭니다",
      language: "java",
      filename: "LineTerminatorNormalization.java",
      purpose: "readLine terminator removal과 chosen normalized separator/final state를 stable output으로 검증합니다.",
      code: `import java.io.BufferedReader;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

public class LineTerminatorNormalization {
    public static void main(String[] args) throws Exception {
        String source = "a\\r\\nb\\nc\\rd";
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new StringReader(source))) {
            String line;
            while ((line = reader.readLine()) != null) lines.add(line);
        }
        String normalizedWithoutFinal = String.join("|", lines);
        System.out.println("lines=" + lines);
        System.out.println("lineCount=" + lines.size());
        System.out.println("normalized=" + normalizedWithoutFinal);
        System.out.println("finalNewline=false");
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "BufferedReader/StringReader와 logical lines collection을 import합니다." },
        { lines: "7-13", explanation: "three different terminators와 no-final d를 readLine EOF까지 수집합니다." },
        { lines: "14-18", explanation: "explicit pipe representation, count와 chosen no-final-newline policy를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8 source", "-Xlint:all warning0"], command: isolatedJavaRun("LineTerminatorNormalization.java", "LineTerminatorNormalization") },
      output: { value: "lines=[a, b, c, d]\nlineCount=4\nnormalized=a|b|c|d\nfinalNewline=false", explanation: ["세 terminator forms가 제거됩니다.", "final d도 line으로 반환됩니다.", "output final policy가 명시됩니다."] },
      experiments: [
        { change: "source 끝에 LF를 추가합니다.", prediction: "readLine loop의 four returned lines는 같아 source final terminator를 구분하지 못합니다.", result: "readLine은 terminator-preserving API가 아닙니다." },
        { change: "source를 a\\n\\nb로 바꿉니다.", prediction: "lines=[a, , b]이고 empty line이 보존됩니다.", result: "empty String을 EOF null과 구분합니다." },
        { change: "normalized를 BufferedWriter.newLine으로 씁니다.", prediction: "output separator bytes가 platform마다 달라질 수 있습니다.", result: "artifact format separator를 explicit하게 정합니다." },
      ],
      sourceRefs: ["java-buffered-reader", "java-buffered-writer", "java-string-reader", "java-system-line-separator", "java-class14-ex08", "java-class14-ex09"],
    }],
    diagnostics: [
      { symptom: "Git diff에서 모든 lines가 바뀌고 CRLF/LF가 달라졌다.", likelyCause: "readLine/newLine copy가 platform separator로 전체 file을 normalize했습니다.", checks: ["source/target hex와 line endings를 봅니다.", "newLine/System.lineSeparator를 찾습니다.", "format policy를 확인합니다."], fix: "byte-preserving copy 또는 explicit chosen LF/CRLF transform을 사용합니다.", prevention: "mixed endings와 final-newline fixtures, .gitattributes policy를 둡니다." },
      { symptom: "빈 record가 사라지거나 EOF에서 null record가 추가된다.", likelyCause: "empty String과 null EOF를 같은 falsy 상태로 처리했습니다.", checks: ["readLine loop condition을 봅니다.", "consecutive terminators fixture를 넣습니다.", "record filtering 위치를 확인합니다."], fix: "line!=null로 EOF만 중단하고 empty policy는 parser/business layer에서 결정합니다.", prevention: "empty first/middle/final lines와 empty file tests를 둡니다." },
    ],
    expertNotes: ["BufferedReader.readLine has no configurable maximum. Security-sensitive ingestion may need a bounded parser that counts chars/bytes before constructing an unbounded String.", "Text normalization changes hashes and signatures. Preserve original bytes/provenance when normalized output must be auditable."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...decodingFoundationChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-reader-api", repository: "Java SE 21 API", path: "java.io.Reader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Reader.html", usedFor: ["char read", "EOF", "bulk actual count"], evidence: "character input contract 근거입니다." },
  { id: "java-writer-api", repository: "Java SE 21 API", path: "java.io.Writer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Writer.html", usedFor: ["char write", "flush", "append"], evidence: "character output contract 근거입니다." },
  { id: "java-string-reader", repository: "Java SE 21 API", path: "java.io.StringReader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/StringReader.html", usedFor: ["memory char fixture", "mixed lines"], evidence: "filesystem-independent Reader fixture 근거입니다." },
  { id: "java-string-writer", repository: "Java SE 21 API", path: "java.io.StringWriter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/StringWriter.html", usedFor: ["char round-trip", "unit observation"], evidence: "memory Writer fixture 근거입니다." },
  { id: "java-character-api", repository: "Java SE 21 API", path: "java.lang.Character", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Character.html", usedFor: ["surrogates", "code points", "UTF-16"], evidence: "char/code-point distinction 근거입니다." },
  { id: "java-string-api", repository: "Java SE 21 API", path: "java.lang.String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["length", "codePointCount", "lines"], evidence: "String Unicode operations 근거입니다." },
  { id: "java-input-stream-reader", repository: "Java SE 21 API", path: "java.io.InputStreamReader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStreamReader.html", usedFor: ["decode bridge", "explicit charset", "chunk state"], evidence: "byte-to-char bridge 근거입니다." },
  { id: "java-output-stream-writer", repository: "Java SE 21 API", path: "java.io.OutputStreamWriter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/OutputStreamWriter.html", usedFor: ["encode bridge", "explicit charset", "flush"], evidence: "char-to-byte bridge 근거입니다." },
  { id: "java-buffered-reader", repository: "Java SE 21 API", path: "java.io.BufferedReader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedReader.html", usedFor: ["readLine", "buffering", "EOF null"], evidence: "logical line input 근거입니다." },
  { id: "java-buffered-writer", repository: "Java SE 21 API", path: "java.io.BufferedWriter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedWriter.html", usedFor: ["newLine", "character buffering", "flush"], evidence: "logical line output 근거입니다." },
  { id: "java-standard-charsets", repository: "Java SE 21 API", path: "java.nio.charset.StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["UTF-8", "explicit bridges"], evidence: "portable required charset 근거입니다." },
  { id: "java-byte-array-input-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayInputStream.html", usedFor: ["UTF-8 byte fixture"], evidence: "memory byte input 근거입니다." },
  { id: "java-byte-array-output-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayOutputStream.html", usedFor: ["encoded byte target"], evidence: "memory byte output 근거입니다." },
  { id: "java-charset-decoder", repository: "Java SE 21 API", path: "java.nio.charset.CharsetDecoder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/CharsetDecoder.html", usedFor: ["strict decode", "stream state", "error action"], evidence: "configurable decoding 근거입니다." },
  { id: "java-charset-encoder", repository: "Java SE 21 API", path: "java.nio.charset.CharsetEncoder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/CharsetEncoder.html", usedFor: ["strict encode", "unmappable"], evidence: "configurable encoding 근거입니다." },
  { id: "java-coding-error-action", repository: "Java SE 21 API", path: "java.nio.charset.CodingErrorAction", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/CodingErrorAction.html", usedFor: ["REPORT", "REPLACE", "IGNORE"], evidence: "malformed/unmappable policy 근거입니다." },
  { id: "java-character-coding-exception", repository: "Java SE 21 API", path: "java.nio.charset.CharacterCodingException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/CharacterCodingException.html", usedFor: ["typed malformed failure"], evidence: "strict coding failure 분류 근거입니다." },
  { id: "java-byte-buffer", repository: "Java SE 21 API", path: "java.nio.ByteBuffer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/ByteBuffer.html", usedFor: ["decoder input", "invalid byte fixture"], evidence: "small strict decode input 근거입니다." },
  { id: "java-system-line-separator", repository: "Java SE 21 API", path: "java.lang.System#lineSeparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#lineSeparator()", usedFor: ["platform newline", "newLine contrast"], evidence: "platform separator 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "Reader UTF-16 units, explicit UTF-8 bridges, strict decoder와 line terminator/final-newline semantics를 추가했습니다.",
  "binary byte preservation과 deliberate text normalization을 서로 다른 operations로 유지했습니다.",
);

const unicodePolicyChapters: DetailedSession["chapters"] = [
  {
    id: "writer-create-truncate-append-policy",
    title: "Writer의 CREATE_NEW·TRUNCATE·APPEND를 text artifact 수명 정책으로 명시합니다",
    lead: "FileWriter append boolean 대신 Files.newBufferedWriter와 open options로 collision·replace·append 의미를 드러내고 exact encoded bytes를 검증합니다.",
    explanations: [
      "FileWriter(path,true)는 append, false/default는 truncate semantics를 가집니다. charset overload가 있어도 collision/create policy를 두 booleans로만 표현하면 intent가 약합니다.",
      "Files.newBufferedWriter(path,charset,options)는 character buffering·encoding과 StandardOpenOption을 한 boundary에 둡니다. CREATE_NEW로 기존 target collision을 보존할 수 있습니다.",
      "APPEND는 각 write를 file end에 두지만 여러 writers의 logical records가 atomic하게 유지된다고 보장하지 않습니다. delimiter/newline과 locking/serialization policy가 필요합니다.",
      "TRUNCATE_EXISTING은 writer open 시점에 기존 text를 잃게 할 수 있습니다. validation/normalization/schema checks를 temp에서 마친 뒤 replace/publish합니다.",
      "CREATE without TRUNCATE의 position/contents semantics를 추측하지 말고 intended options와 exact result를 테스트합니다. option combinations의 illegal/ignored cases도 API contract를 확인합니다.",
      "append text가 기존 file의 charset/BOM/normalization과 같은지 검증해야 합니다. UTF-8 text에 다른 charset bytes를 append하면 한 file 안에 혼합 encoding이 됩니다.",
      "record append 전에 기존 final newline 여부를 확인하지 않으면 두 records가 붙거나 빈 line이 생깁니다. append protocol에 delimiter ownership을 정합니다.",
      "writer close failure 후 append 일부가 기록됐을 수 있어 transaction rollback이 아닙니다. transactional record가 필요하면 new artifact/temp publish나 database/log system을 사용합니다.",
      "예제는 CREATE_NEW A→APPEND B→TRUNCATE C→APPEND D state와 second CREATE_NEW collision을 UTF-8 final CD로 검증합니다.",
    ],
    concepts: [
      { term: "text open policy", definition: "target 존재 상태에 따라 create·fail·truncate·append 중 어떤 전이를 허용할지 정한 규칙입니다.", detail: ["charset과 함께 명시합니다.", "data loss semantics를 드러냅니다."] },
      { term: "append delimiter ownership", definition: "기존 last record와 새 record 사이 newline/delimiter를 누가 보장할지 정한 계약입니다.", detail: ["final newline을 검사합니다.", "concurrent writers를 고려합니다."] },
      { term: "mixed encoding", definition: "한 byte file 안의 구간들이 서로 다른 charset으로 encode되어 단일 decoder로 올바르게 읽을 수 없는 상태입니다.", detail: ["append에서 발생할 수 있습니다.", "format schema 위반입니다."] },
    ],
    codeExamples: [{
      id: "java-writer-open-policies",
      title: "UTF-8 CREATE_NEW·APPEND·TRUNCATE transitions와 collision을 검증합니다",
      language: "java",
      filename: "WriterOpenPolicies.java",
      purpose: "writer open option이 existing text와 collision에 미치는 결과를 exact final text로 확인합니다.",
      code: `import java.io.BufferedWriter;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.charset.StandardCharsets;

public class WriterOpenPolicies {
    static void write(Path path, String text, StandardOpenOption... options) throws Exception {
        try (BufferedWriter writer = Files.newBufferedWriter(path, StandardCharsets.UTF_8, options)) {
            writer.write(text);
        }
    }

    public static void main(String[] args) throws Exception {
        Path root = Path.of("writer-options");
        Files.createDirectory(root);
        Path target = root.resolve("notes.txt");
        boolean collisionRejected = false;
        try {
            write(target, "A", StandardOpenOption.CREATE_NEW);
            write(target, "B", StandardOpenOption.APPEND);
            write(target, "C", StandardOpenOption.TRUNCATE_EXISTING);
            write(target, "D", StandardOpenOption.APPEND);
            try {
                write(target, "X", StandardOpenOption.CREATE_NEW);
            } catch (FileAlreadyExistsException expected) {
                collisionRejected = true;
            }
            String result = Files.readString(target, StandardCharsets.UTF_8);
            System.out.println("text=" + result);
            System.out.println("utf8Bytes=" + Files.size(target));
            System.out.println("collisionRejected=" + collisionRejected);
        } finally {
            Files.deleteIfExists(target); Files.deleteIfExists(root);
        }
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "buffered writer, typed collision, Files/Path/options와 UTF-8을 import합니다." },
        { lines: "9-13", explanation: "options를 그대로 받는 explicit UTF-8 writer helper가 close까지 소유합니다." },
        { lines: "16-20", explanation: "fresh root/target과 collision result를 준비합니다." },
        { lines: "21-29", explanation: "create→append→truncate→append를 수행하고 second CREATE_NEW를 typed failure로 분류합니다." },
        { lines: "30-35", explanation: "final UTF-8 text/byte size/collision policy를 출력합니다." },
        { lines: "36-38", explanation: "target과 root를 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "fresh working directory", "-Xlint:all warning0"], command: isolatedJavaRun("WriterOpenPolicies.java", "WriterOpenPolicies") },
      output: { value: "text=CD\nutf8Bytes=2\ncollisionRejected=true", explanation: ["AB가 truncate되어C가 되고D가 append됩니다.", "ASCII CD는2 UTF-8 bytes입니다.", "CREATE_NEW collision은 final을 보존합니다."] },
      experiments: [
        { change: "TRUNCATE_EXISTING을 validation 전에 엽니다.", prediction: "후속 failure에도 기존 AB가 사라집니다.", result: "temp validation/publish가 필요합니다." },
        { change: "append writer charset을 UTF_16로 바꿉니다.", prediction: "file에 UTF-8 A와 UTF-16 bytes가 섞여 단일 decode가 깨집니다.", result: "append format schema를 검증합니다." },
        { change: "concurrent writers가 delimiter 없이 records를 append합니다.", prediction: "logical record interleaving/concatenation이 가능합니다.", result: "serialization 또는 record-safe log를 사용합니다." },
      ],
      sourceRefs: ["java-files-api", "java-standard-open-option", "java-file-already-exists", "java-standard-charsets", "java-buffered-writer", "java-class14-ex07"],
    }],
    diagnostics: [
      { symptom: "설정 저장 실패 뒤 기존 text file이 비어 있다.", likelyCause: "TRUNCATE writer를 validation보다 먼저 열었습니다.", checks: ["writer open 시점을 봅니다.", "temp/publish state를 확인합니다.", "failure phase target bytes를 조사합니다."], fix: "새 content를 owned temp에 UTF-8로 완성·검증하고 final move합니다.", prevention: "validation/write/close failure에서 existing target 불변 test를 둡니다." },
      { symptom: "append된 뒤부터 file 후반만 mojibake가 난다.", likelyCause: "기존 file과 append writer charset/BOM이 다릅니다.", checks: ["boundary 전후 hex를 봅니다.", "writer charset config를 비교합니다.", "BOM·declared metadata를 확인합니다."], fix: "single file format charset을 강제하고 불일치면 새 version으로 rewrite합니다.", prevention: "append 전 format/version/charset validation과 non-ASCII test를 둡니다." },
    ],
    expertNotes: ["APPEND is not a database transaction. A void Writer.write may partially change the file before failure, so application-level atomic record requirements need a stronger primitive.", "Files.newBufferedWriter defaults are concise but explicit options make collision/truncation review easier in destructive code paths."],
  },
  {
    id: "code-point-grapheme-length-limits",
    title: "char length·code points·combining marks와 사용자 grapheme limits를 분리합니다",
    lead: "A😀é는 화면상 세 덩어리처럼 보이지만 UTF-16 chars5, code points4입니다. 저장 bytes와 UI 글자 수도 다시 다릅니다.",
    explanations: [
      "String.length는 UTF-16 code units count입니다. supplementary emoji가2 units이므로 database VARCHAR character semantics나 UI max length와 바로 같지 않습니다.",
      "codePointCount와 String.codePoints는 surrogate pairs를 하나의 Unicode scalar/code point로 순회합니다. unpaired surrogate input validity는 별도 검사합니다.",
      "e+combining acute는 two code points지만 user가 한 grapheme cluster로 인식할 수 있습니다. emoji ZWJ sequence·flags·skin tone modifiers는 더 많은 code points를 하나로 묶습니다.",
      "Java BreakIterator character instance는 locale/Unicode version에 따른 segmentation을 제공하지만 최신 extended grapheme cluster 요구와 library behavior를 검증합니다.",
      "UTF-8 byte limit은 encode 후 bytes count입니다. code-point limit과 함께 적용할 때 어느 것을 먼저 검사하고 error message를 어떻게 줄지 정합니다.",
      "substring index는 UTF-16 units라 surrogate pair 중간을 자를 수 있습니다. offsetByCodePoints 또는 grapheme-aware iterator를 사용합니다.",
      "database·HTTP·filesystem limits가 bytes/units를 다르게 정의합니다. validation DTO가 단위와 normalization form을 이름으로 드러내야 합니다.",
      "logging/metrics에서 raw user text 대신 code-unit/point/byte counts와 safe classification을 남깁니다. Unicode control characters가 log/UI를 속일 수 있습니다.",
      "예제는 A+emoji+e+combining acute의 char/code-point/combining counts와 ordered code-point labels를 exact하게 출력합니다.",
    ],
    concepts: [
      { term: "code point", definition: "Unicode codespace의 값 하나이며 UTF-16에서1 또는2 code units로 표현됩니다.", detail: ["String.codePoints로 순회합니다.", "grapheme와 다릅니다."] },
      { term: "combining mark", definition: "앞 문자와 시각적으로 결합할 수 있는 Unicode mark category code point입니다.", detail: ["독립 code point입니다.", "normalization에 영향이 있습니다."] },
      { term: "grapheme cluster", definition: "사용자가 한 문자처럼 인식하는 code-point sequence 단위입니다.", detail: ["emoji/combining sequence를 포함합니다.", "Unicode segmentation이 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-unicode-length-units",
      title: "A😀e+combining acute의 char5·code points4·mark1을 비교합니다",
      language: "java",
      filename: "UnicodeLengthUnits.java",
      purpose: "서로 다른 length units가 같은 String에서 다른 값을 냄을 검증합니다.",
      code: `import java.util.List;

public class UnicodeLengthUnits {
    public static void main(String[] args) {
        String text = "A😀e\u0301";
        List<String> codePoints = text.codePoints()
                .mapToObj(value -> String.format("U+%04X", value))
                .toList();
        long combiningMarks = text.codePoints()
                .filter(value -> Character.getType(value) == Character.NON_SPACING_MARK)
                .count();
        System.out.println("charCount=" + text.length());
        System.out.println("codePointCount=" + text.codePointCount(0, text.length()));
        System.out.println("combiningMarks=" + combiningMarks);
        System.out.println("codePoints=" + codePoints);
    }
}`,
      walkthrough: [
        { lines: "1", explanation: "ordered code-point labels를 담을 immutable List type을 import합니다." },
        { lines: "4-7", explanation: "emoji surrogate pair와 decomposed e+acute String을 code-point labels로 변환합니다." },
        { lines: "8-10", explanation: "Unicode general category가 NON_SPACING_MARK인 points를 셉니다." },
        { lines: "11-14", explanation: "char/code-point/mark counts와 ordered labels를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8 source", "-Xlint:all warning0"], command: isolatedJavaRun("UnicodeLengthUnits.java", "UnicodeLengthUnits") },
      output: { value: "charCount=5\ncodePointCount=4\ncombiningMarks=1\ncodePoints=[U+0041, U+1F600, U+0065, U+0301]", explanation: ["emoji가2 chars/1 point입니다.", "e와 acute는2 points입니다.", "length unit이 명시됩니다."] },
      experiments: [
        { change: "text.substring(0,2)로 앞 두 chars를 자릅니다.", prediction: "A와 high surrogate만 남아 malformed UTF-16이 됩니다.", result: "code-point/grapheme-aware slicing이 필요합니다." },
        { change: "decomposed e+acute를 composed é로 바꿉니다.", prediction: "char/codePoint counts가 각각1 줄지만 화면은 비슷할 수 있습니다.", result: "normalization 정책이 equality/limits에 영향 줍니다." },
        { change: "UTF-8 bytes length를 max UI characters로 사용합니다.", prediction: "언어/emoji에 따라 불공정한 사용자 limit이 됩니다.", result: "storage bytes와 UX grapheme limits를 분리합니다." },
      ],
      sourceRefs: ["java-character-api", "java-string-api", "java-int-stream", "unicode-grapheme-annex"],
    }],
    diagnostics: [
      { symptom: "글자 제한에서 emoji가2개로 계산되거나 잘려 깨진다.", likelyCause: "UTF-16 length/index를 user-perceived characters로 사용했습니다.", checks: ["surrogate boundaries를 봅니다.", "codePointCount/grapheme segmentation을 비교합니다.", "substring offsets를 확인합니다."], fix: "업무 단위에 맞는 code-point/grapheme iterator와 safe offsets를 사용합니다.", prevention: "emoji·flags·ZWJ·combining corpus를 UI/backend 공통 test로 둡니다." },
      { symptom: "DB에는 들어가지만 API byte limit을 넘는다.", likelyCause: "code-point/char limit만 검사하고 encoded UTF-8 bytes를 계산하지 않았습니다.", checks: ["각 layer limit unit을 inventory합니다.", "normalization 전후 bytes를 비교합니다.", "encoder policy를 확인합니다."], fix: "UX grapheme와 transport/storage byte limits를 각각 검증합니다.", prevention: "multi-language max-boundary property tests를 둡니다." },
    ],
    expertNotes: ["Extended grapheme segmentation evolves with Unicode versions. Pin/test the runtime or library version when user-visible cursor/limit behavior must be stable.", "Code point validity is not application safety. Bidi controls, confusables and identifier profiles require a separate security policy."],
  },
  {
    id: "unicode-normalization-equality-hash",
    title: "NFC·NFD normalization이 text equality·byte length·hash를 바꾼다는 점을 검증합니다",
    lead: "시각적으로 같은 é가 U+00E9 하나 또는 e+U+0301 둘일 수 있습니다. 비교·검색·filename·signature 전에 normalization 책임을 정합니다.",
    explanations: [
      "Unicode canonical equivalence는 서로 다른 code-point sequences가 같은 abstract text로 간주될 수 있음을 뜻합니다. Java String.equals는 code units exact equality라 자동 canonical compare를 하지 않습니다.",
      "Normalizer.Form.NFC는 canonical decomposition 뒤 composition을 선호하고 NFD는 decomposed form을 만듭니다. NFKC/NFKD는 compatibility transformations라 의미·표현을 더 바꿀 수 있습니다.",
      "normalization 전후 UTF-8 byte length와 digest가 달라집니다. signature/hash verification 전에 임의 normalize하면 signed original bytes와 맞지 않습니다.",
      "identifier/search key를 normalize할 수 있지만 display original을 별도로 보존하고 provenance를 기록합니다. security identifier에는 case-folding·confusable policy도 필요합니다.",
      "filesystem이 names를 특정 form으로 저장/노출할 수 있어 cross-platform archive에서 visually identical filenames collision이 생길 수 있습니다.",
      "database collation이 canonical equivalence를 어떻게 처리하는지 Java equality와 다를 수 있습니다. uniqueness rule을 한 layer에 명시합니다.",
      "이미 normalized인지 Normalizer.isNormalized로 빠르게 검사할 수 있지만 correctness보다 먼저 profiling 없이 최적화하지 않습니다.",
      "normalization은 grapheme segmentation과 다르고 malformed surrogate를 고쳐 주는 validation도 아닙니다. decode/Unicode validity 뒤 적용합니다.",
      "예제는 composed/decomposed raw inequality, UTF-8 lengths2/3와 NFC equality/length2를 exact output으로 보입니다.",
    ],
    concepts: [
      { term: "canonical equivalence", definition: "서로 다른 Unicode sequences가 같은 abstract characters를 표현하는 관계입니다.", detail: ["String.equals는 자동 적용하지 않습니다.", "NFC/NFD가 관련됩니다."] },
      { term: "NFC", definition: "canonical decomposition 후 가능한 characters를 composed form으로 재결합하는 normalization form입니다.", detail: ["비교 key에 자주 사용합니다.", "bytes를 바꿀 수 있습니다."] },
      { term: "compatibility normalization", definition: "canonical equivalence보다 넓게 compatibility variants를 접는 NFKC/NFKD입니다.", detail: ["의미/display 손실 가능성이 있습니다.", "security/profile별 선택입니다."] },
    ],
    codeExamples: [{
      id: "java-unicode-normalization",
      title: "composed é와 decomposed e+acute를 NFC로 비교합니다",
      language: "java",
      filename: "UnicodeNormalization.java",
      purpose: "raw equality와 normalized equality, UTF-8 byte lengths 차이를 검증합니다.",
      code: `import java.nio.charset.StandardCharsets;
import java.text.Normalizer;

public class UnicodeNormalization {
    public static void main(String[] args) {
        String composed = "é";
        String decomposed = "e\u0301";
        String normalized = Normalizer.normalize(decomposed, Normalizer.Form.NFC);
        System.out.println("rawEqual=" + composed.equals(decomposed));
        System.out.println("composedUtf8=" + composed.getBytes(StandardCharsets.UTF_8).length);
        System.out.println("decomposedUtf8=" + decomposed.getBytes(StandardCharsets.UTF_8).length);
        System.out.println("nfcEqual=" + composed.equals(normalized));
        System.out.println("normalizedUtf8=" + normalized.getBytes(StandardCharsets.UTF_8).length);
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "UTF-8 byte length와 Unicode Normalizer를 import합니다." },
        { lines: "5-7", explanation: "composed, canonical decomposed와 NFC-normalized Strings를 준비합니다." },
        { lines: "8-12", explanation: "raw equality, two byte lengths와 NFC equality/length를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8 source", "-Xlint:all warning0"], command: isolatedJavaRun("UnicodeNormalization.java", "UnicodeNormalization") },
      output: { value: "rawEqual=false\ncomposedUtf8=2\ndecomposedUtf8=3\nnfcEqual=true\nnormalizedUtf8=2", explanation: ["raw sequences는 다릅니다.", "UTF-8 byte lengths2/3도 다릅니다.", "NFC 후 composed와 같습니다."] },
      experiments: [
        { change: "signed source bytes를 verify 전에 NFC로 바꿉니다.", prediction: "내용은 비슷해 보여도 digest/signature가 실패합니다.", result: "byte authenticity와 normalized text equality를 분리합니다." },
        { change: "NFKC를 identifier에 적용합니다.", prediction: "compatibility characters가 접혀 collision이 생길 수 있습니다.", result: "profile이 허용하는 transformations를 위협 모델링합니다." },
        { change: "display original을 버리고 normalized만 저장합니다.", prediction: "사용자 입력 form/provenance를 복원할 수 없습니다.", result: "original과 normalized key를 분리할 수 있습니다." },
      ],
      sourceRefs: ["java-normalizer", "java-standard-charsets", "unicode-normalization-annex"],
    }],
    diagnostics: [
      { symptom: "화면상 같은 이름이 uniqueness check를 둘 다 통과한다.", likelyCause: "raw String equality만 사용해 canonical variants를 구분했습니다.", checks: ["code points/normalization forms를 비교합니다.", "DB collation을 확인합니다.", "identifier profile을 봅니다."], fix: "정의된 normalization/case/security profile로 uniqueness key를 만듭니다.", prevention: "composed/decomposed/confusable collision corpus를 둡니다." },
      { symptom: "파일을 normalize한 뒤 checksum이 바뀌었다.", likelyCause: "text normalization은 code points와 encoded bytes를 바꾸는 deliberate transform입니다.", checks: ["before/after code points/bytes를 기록합니다.", "hash가 original/normalized 어느 것인지 봅니다.", "signature boundary를 확인합니다."], fix: "original bytes와 normalized artifact를 서로 다른 versions/provenance로 취급합니다.", prevention: "transformation manifest와 before/after digests를 유지합니다." },
    ],
    expertNotes: ["Normalization policy is contextual. Source code, identifiers, human prose, passwords and signed payloads have different requirements; never normalize everything globally.", "NFC does not remove confusables or bidi controls. Unicode security profiles are additional layers."],
  },
  {
    id: "bom-detection-preserve-strip-policy",
    title: "UTF-8 BOM을 content U+FEFF와 transport signature 중 어떤 것으로 볼지 명시합니다",
    lead: "InputStreamReader UTF-8이 BOM bytes를 자동으로 항상 제거한다고 가정하지 않고, leading EF BB BF를 detect·strip·preserve할 format policy를 둡니다.",
    explanations: [
      "UTF-8 BOM bytes EF BB BF는 Unicode U+FEFF encoding입니다. UTF-8에 필수하지 않고 일부 tools는 signature로 쓰며 일부 parsers는 첫 content character로 봅니다.",
      "new String/standard UTF-8 decoder가 leading BOM을 자동 제거한다고 portability contract로 단정하지 않습니다. 예제처럼 raw decoded String이 U+FEFF로 시작하는지 관찰합니다.",
      "format이 UTF-8 BOM을 허용하고 signature로 정의하면 byte layer에서 exact leading sequence 한 번만 strip합니다. 중간 U+FEFF는 content일 수 있어 전부 제거하지 않습니다.",
      "UTF-16 BOM은 byte order와 charset detection에 다른 의미가 있습니다. charset auto-detection은 제한된 allowlist·provenance와 ambiguity/error 정책이 필요합니다.",
      "BOM 없는 UTF-8을 default로 생성할지 consumer compatibility 때문에 넣을지 output schema에 명시합니다. append에서 BOM을 중간에 다시 쓰지 않습니다.",
      "text trim/strip는 U+FEFF를 반드시 제거하지 않으며 whitespace cleanup으로 BOM policy를 대체하지 않습니다.",
      "CSV header가 \uFEFFname으로 들어가 column lookup이 실패하는 흔한 증상을 raw first code point/bytes로 진단합니다.",
      "BOM strip 뒤 byte offsets가3만큼 이동합니다. parser error context가 original byte offset인지 normalized text offset인지 명시합니다.",
      "예제는 BOM+ABC bytes를 UTF-8 decode하면 raw length4/startsBOM true, explicit leading strip 후 ABC·3 bytes가 됨을 검증합니다.",
    ],
    concepts: [
      { term: "BOM", definition: "byte order mark 또는 encoding signature로 쓰일 수 있는 leading byte sequence/U+FEFF입니다.", detail: ["UTF-8에서는 선택적입니다.", "format policy가 해석합니다."] },
      { term: "leading-only strip", definition: "format이 허용한 file 시작 BOM 한 개만 제거하고 content의 U+FEFF는 보존하는 변환입니다.", detail: ["byte offset을 바꿉니다.", "provenance를 기록합니다."] },
      { term: "charset detection", definition: "BOM·metadata·protocol을 이용해 decoder charset을 선택하는 과정입니다.", detail: ["무제한 추측을 피합니다.", "ambiguous/unsupported policy가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-utf8-bom-policy",
      title: "EF BB BF+ABC를 raw decode하고 leading-only BOM을 strip합니다",
      language: "java",
      filename: "Utf8BomPolicy.java",
      purpose: "BOM 자동 제거를 가정하지 않고 byte signature와 decoded U+FEFF를 명시적으로 처리합니다.",
      code: `import java.nio.charset.StandardCharsets;

public class Utf8BomPolicy {
    public static void main(String[] args) {
        byte[] bytes = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF, 'A', 'B', 'C'};
        String raw = new String(bytes, StandardCharsets.UTF_8);
        boolean startsWithBom = !raw.isEmpty() && raw.codePointAt(0) == 0xFEFF;
        String stripped = startsWithBom ? raw.substring(1) : raw;
        System.out.println("rawStartsWithBom=" + startsWithBom);
        System.out.println("rawCharCount=" + raw.length());
        System.out.println("stripped=" + stripped);
        System.out.println("strippedUtf8Bytes=" + stripped.getBytes(StandardCharsets.UTF_8).length);
    }
}`,
      walkthrough: [
        { lines: "1", explanation: "explicit UTF-8 decode/encode를 위한 required charset을 import합니다." },
        { lines: "4-7", explanation: "UTF-8 BOM+ABC bytes를 decode하고 first code point가 U+FEFF인지 확인해 leading one만 strip합니다." },
        { lines: "8-11", explanation: "raw BOM observation/count와 stripped text/bytes를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("Utf8BomPolicy.java", "Utf8BomPolicy") },
      output: { value: "rawStartsWithBom=true\nrawCharCount=4\nstripped=ABC\nstrippedUtf8Bytes=3", explanation: ["raw decoded String에 U+FEFF가 남습니다.", "BOM 포함 char count4입니다.", "leading strip 뒤 ASCII3bytes입니다."] },
      experiments: [
        { change: "text 전체 replace(\"\\uFEFF\",\"\")를 사용합니다.", prediction: "content 중간의 legitimate U+FEFF도 사라집니다.", result: "leading signature만 format policy로 처리합니다." },
        { change: "BOM 없는 ABC를 입력합니다.", prediction: "startsWithBom=false이고 stripped는 그대로ABC입니다.", result: "optional signature 양쪽 case를 지원합니다." },
        { change: "append할 때 BOM을 다시 씁니다.", prediction: "file 중간에 U+FEFF가 생겨 parser content가 달라집니다.", result: "BOM emission은 file creation boundary에만 둡니다." },
      ],
      sourceRefs: ["java-standard-charsets", "java-string-api", "unicode-byte-order-mark"],
    }],
    diagnostics: [
      { symptom: "CSV 첫 column 이름만 매칭되지 않는다.", likelyCause: "UTF-8 BOM이 decoded header의 leading U+FEFF로 남았습니다.", checks: ["첫 bytes EFBBBF를 봅니다.", "header first code point를 출력합니다.", "parser BOM option을 확인합니다."], fix: "format policy에 따라 byte-layer/leading-only BOM을 처리합니다.", prevention: "BOM/no-BOM header fixtures를 parser contract tests에 둡니다." },
      { symptom: "text cleanup 후 원문 중간의 invisible character가 사라졌다.", likelyCause: "모든 U+FEFF를 BOM으로 간주해 global replace했습니다.", checks: ["original byte offsets를 봅니다.", "leading vs internal positions를 구분합니다.", "format에서 U+FEFF content 허용을 확인합니다."], fix: "file start signature만 제거하고 content characters는 validation policy로 별도 처리합니다.", prevention: "leading/internal U+FEFF cases와 transformation manifest를 둡니다." },
    ],
    expertNotes: ["BOM-based detection should be a small explicit allowlist, not heuristic universal charset guessing. Protocol metadata usually has higher authority.", "Removing a BOM changes byte offsets and hashes. Keep original-byte provenance when downstream errors or signatures refer to the original artifact."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...unicodePolicyChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["newBufferedWriter", "readString", "file state"], evidence: "explicit text file operations 근거입니다." },
  { id: "java-standard-open-option", repository: "Java SE 21 API", path: "java.nio.file.StandardOpenOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/StandardOpenOption.html", usedFor: ["CREATE_NEW", "APPEND", "TRUNCATE_EXISTING"], evidence: "writer lifecycle options 근거입니다." },
  { id: "java-file-already-exists", repository: "Java SE 21 API", path: "java.nio.file.FileAlreadyExistsException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/FileAlreadyExistsException.html", usedFor: ["writer collision"], evidence: "CREATE_NEW collision 근거입니다." },
  { id: "java-int-stream", repository: "Java SE 21 API", path: "java.util.stream.IntStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/IntStream.html", usedFor: ["String codePoints", "Unicode filtering"], evidence: "primitive code-point pipeline 근거입니다." },
  { id: "unicode-grapheme-annex", repository: "Unicode Standard Annex #29", path: "Unicode Text Segmentation", publicUrl: "https://www.unicode.org/reports/tr29/", usedFor: ["extended grapheme clusters", "segmentation versions"], evidence: "user-perceived character segmentation primary specification입니다." },
  { id: "java-normalizer", repository: "Java SE 21 API", path: "java.text.Normalizer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/text/Normalizer.html", usedFor: ["NFC", "NFD", "isNormalized"], evidence: "Java Unicode normalization 근거입니다." },
  { id: "unicode-normalization-annex", repository: "Unicode Standard Annex #15", path: "Unicode Normalization Forms", publicUrl: "https://www.unicode.org/reports/tr15/", usedFor: ["canonical equivalence", "NFC/NFD/NFKC/NFKD"], evidence: "normalization semantics primary specification입니다." },
  { id: "unicode-byte-order-mark", repository: "Unicode FAQ", path: "UTF BOM", publicUrl: "https://www.unicode.org/faq/utf_bom.html", usedFor: ["UTF-8 BOM", "U+FEFF", "byte-order signature"], evidence: "BOM behavior background입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "writer open modes, code-point/grapheme length, normalization equality와 BOM policy를 추가했습니다.",
  "Unicode transformations가 byte hash·signature·filename/database uniqueness를 바꾼다는 provenance를 보존했습니다.",
);

const ingestionVerificationChapters: DetailedSession["chapters"] = [
  {
    id: "streaming-text-transform-explicit-lf",
    title: "decode→line transform→explicit LF encode를 bounded streaming state로 구현합니다",
    lead: "text normalization을 byte copy로 부르지 않고 charset·trim/case·line separator·final newline를 모두 변환 specification으로 기록합니다.",
    explanations: [
      "streaming text transform은 input bytes decode, char/line transformation, output encode라는 세 상태를 가집니다. 각 단계의 charset·limits·error policy를 분리합니다.",
      "BufferedReader.readLine은 logical line을 제공하지만 unbounded line allocation 위험이 있습니다. trusted small input이 아니면 bounded line parser를 사용합니다.",
      "trim/strip은 whitespace code points와 업무 의미를 바꿉니다. fixed-width·signature·source code에서는 적용하면 안 되고 schema field별 transform으로 둡니다.",
      "toUpperCase/toLowerCase는 Locale을 명시해야 합니다. identifier canonicalization에는 Locale.ROOT, 사용자 표시에는 user locale이 필요할 수 있습니다.",
      "output format이 LF를 요구하면 System.lineSeparator/newLine 대신 literal '\\n'을 씁니다. Windows에서도 exact LF bytes를 만들어 reproducible artifacts를 얻습니다.",
      "final newline true/false는 separate policy입니다. every record 뒤 LF를 쓰는 streaming loop는 true를 만들며 empty input output behavior도 정합니다.",
      "Writer는 chars를 받아 UTF-8 encoder로 bytes를 냅니다. malformed internal surrogates를 REPORT하도록 configured CharsetEncoder를 사용할 수 있습니다.",
      "input/output record count, bytes, digest와 errors를 관찰하고 raw lines를 공개 log에 남기지 않습니다. transformation version을 artifact metadata에 둡니다.",
      "예제는 mixed CRLF/LF input의 whitespace를 strip·ROOT uppercase하고 explicit LF two records/final newline를 exact UTF-8 output으로 검증합니다.",
    ],
    concepts: [
      { term: "text transformation specification", definition: "charset, Unicode/whitespace/case, line separator와 final newline를 포함한 명시적 변환 규칙입니다.", detail: ["byte copy와 구분합니다.", "version을 기록합니다."] },
      { term: "explicit LF", definition: "platform line separator와 무관하게 U+000A 하나를 output record separator로 쓰는 정책입니다.", detail: ["reproducible bytes를 만듭니다.", "format 요구와 맞춰야 합니다."] },
      { term: "streaming state", definition: "전체 text를 한 번에 담지 않고 decoder·current record·encoder state만 유지하는 처리입니다.", detail: ["memory를 제한합니다.", "line limit은 별도입니다."] },
    ],
    codeExamples: [{
      id: "java-streaming-text-transform",
      title: "mixed endings를 strip·ROOT uppercase해 explicit LF final-newline UTF-8로 씁니다",
      language: "java",
      filename: "StreamingTextTransform.java",
      purpose: "platform-independent normalized text bytes와 record accounting을 검증합니다.",
      code: `import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class StreamingTextTransform {
    public static void main(String[] args) throws Exception {
        byte[] inputBytes = "  a \\r\\nb\\t\\n".getBytes(StandardCharsets.UTF_8);
        ByteArrayOutputStream outputBytes = new ByteArrayOutputStream();
        int records = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                     new ByteArrayInputStream(inputBytes), StandardCharsets.UTF_8));
             OutputStreamWriter writer = new OutputStreamWriter(outputBytes, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                writer.write(line.strip().toUpperCase(Locale.ROOT));
                writer.write('\\n');
                records++;
            }
        }
        String result = outputBytes.toString(StandardCharsets.UTF_8);
        System.out.println("records=" + records);
        System.out.println("visible=" + result.replace('\\n', '|'));
        System.out.println("utf8Bytes=" + outputBytes.size());
        System.out.println("finalLf=" + result.endsWith("\\n"));
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "byte/character bridges, UTF-8과 locale-stable case transform을 import합니다." },
        { lines: "10-13", explanation: "mixed-ending input bytes, output sink와 record count를 준비합니다." },
        { lines: "14-23", explanation: "UTF-8 reader/writer를 소유하고 each logical line을 strip·ROOT uppercase 후 explicit LF로 씁니다." },
        { lines: "24-28", explanation: "decoded normalized result의 count·visible separators·byte length·final LF를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "any platform line separator", "-Xlint:all warning0"], command: isolatedJavaRun("StreamingTextTransform.java", "StreamingTextTransform") },
      output: { value: "records=2\nvisible=A|B|\nutf8Bytes=4\nfinalLf=true", explanation: ["두 records가 A/B로 변환됩니다.", "각 record 뒤 LF가 있습니다.", "ASCII A LF B LF는4bytes입니다."] },
      experiments: [
        { change: "writer.write('\\n')를 BufferedWriter.newLine로 바꿉니다.", prediction: "Windows에서 utf8Bytes가6이 되어 platform-dependent합니다.", result: "artifact format separator를 explicit하게 둡니다." },
        { change: "Locale.ROOT 대신 default locale을 사용합니다.", prediction: "특정 locale에서 identifier case result가 달라질 수 있습니다.", result: "case semantics에 locale을 명시합니다." },
        { change: "empty input을 처리합니다.", prediction: "records0, bytes0, finalLf=false 정책이 됩니다.", result: "empty artifact behavior를 specification에 추가합니다." },
      ],
      sourceRefs: ["java-input-stream-reader", "java-output-stream-writer", "java-buffered-reader", "java-standard-charsets", "java-locale-api", "java-byte-array-input-stream", "java-byte-array-output-stream"],
    }],
    diagnostics: [
      { symptom: "같은 transform이 Windows와 Linux에서 다른 hash를 낸다.", likelyCause: "newLine/System.lineSeparator를 output format에 사용했습니다.", checks: ["target hex에서0D0A/0A를 봅니다.", "writer separator call을 찾습니다.", "format specification을 확인합니다."], fix: "format이 LF면 literal LF를 encode하고 final policy를 테스트합니다.", prevention: "cross-platform exact-byte golden과 .gitattributes를 둡니다." },
      { symptom: "터키어 환경에서 identifier uppercase가 달라진다.", likelyCause: "default locale case conversion을 protocol key에 사용했습니다.", checks: ["toUpperCase argument를 봅니다.", "runtime locale을 확인합니다.", "identifier vs display semantics를 구분합니다."], fix: "locale-neutral identifier에는 Locale.ROOT, user-facing text에는 explicit user locale을 사용합니다.", prevention: "hostile locale test를 CI에 둡니다." },
    ],
    expertNotes: ["strip and case conversion can expand, contract or change code points; apply byte/character limits at the documented stage and revalidate output size.", "A BufferedReader still can allocate an arbitrarily large line. True bounded ingestion needs a parser that limits before materializing the full line."],
  },
  {
    id: "io-record-parser-error-channel-accounting",
    title: "I/O decode와 CSV/record parsing 실패를 분리하고 line context·accounting을 보존합니다",
    lead: "Reader가 line을 성공적으로 읽었다고 record schema가 valid한 것은 아닙니다. parse result를 success/error typed channel로 나눠 모든 input의 운명을 추적합니다.",
    explanations: [
      "I/O layer는 bytes→text와 EOF/malformed failures를 책임지고 parser는 delimiter·quotes·types·required fields를 책임집니다. broad catch로 두 failure categories를 섞지 않습니다.",
      "String.split(',') 예제는 단순 unquoted format에만 적합합니다. 실제 CSV는 quoted commas, escaped quotes와 multiline records가 있어 RFC-aware library/parser를 사용합니다.",
      "line number와 record number는 multiline format에서 다를 수 있습니다. parser가 physical span과 logical record id를 error context에 보존합니다.",
      "invalid record를 skip하더라도 errors collection·metric·dead-letter/retry policy로 accounting합니다. input count=success+error invariant가 핵심입니다.",
      "NumberFormatException 하나로 모든 schema failure를 표현하지 않고 column name, safe raw summary와 reason code를 줍니다. raw PII line 전체는 public log에서 제외합니다.",
      "partial valid records를 final output에 publish할지 all-or-nothing으로 거부할지는 업무 transaction policy입니다. error ratio threshold도 명시합니다.",
      "parser가 unbounded fields/columns/nesting을 허용하면 memory/CPU DoS가 됩니다. byte/char/field/record/count/depth limits를 layer별로 둡니다.",
      "encoding replacement character가 parser invalid token처럼 보일 수 있어 strict decoder error를 먼저 보존하면 root cause가 선명합니다.",
      "예제는 four simple lines 중 two successes와 malformed/id errors two를 line numbers2/4로 보존해 accounting invariant를 exact 출력합니다.",
    ],
    concepts: [
      { term: "record error channel", definition: "valid domain values와 parse/validation failures를 별도 typed collections로 보존하는 흐름입니다.", detail: ["silent skip을 막습니다.", "line/record context를 가집니다."] },
      { term: "accounting invariant", definition: "각 input record가 success 또는 error 정확히 하나가 되어 input=success+error가 되는 규칙입니다.", detail: ["duplicates/loss를 탐지합니다.", "metrics와 tests에 사용합니다."] },
      { term: "parser boundary", definition: "decoded text를 format grammar와 typed fields로 바꾸는 layer이며 Reader 자체와 분리됩니다.", detail: ["CSV/JSON library가 담당합니다.", "resource limits가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-record-error-accounting",
      title: "four lines를 two names와 errors at2/4로 분류합니다",
      language: "java",
      filename: "RecordErrorAccounting.java",
      purpose: "decode 성공 후 schema parse errors가 조용히 사라지지 않고 input accounting을 만족하는지 검증합니다.",
      code: `import java.io.BufferedReader;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

public class RecordErrorAccounting {
    record Person(int id, String name) {}
    record ParseError(int line, String reason) {}

    public static void main(String[] args) throws Exception {
        String input = "1,Alice\\nbad\\n2,Bob\\nx,Eve";
        List<Person> people = new ArrayList<>();
        List<ParseError> errors = new ArrayList<>();
        int inputCount = 0;
        try (BufferedReader reader = new BufferedReader(new StringReader(input))) {
            String line;
            while ((line = reader.readLine()) != null) {
                inputCount++;
                String[] fields = line.split(",", -1);
                if (fields.length != 2) {
                    errors.add(new ParseError(inputCount, "field-count"));
                    continue;
                }
                try {
                    people.add(new Person(Integer.parseInt(fields[0]), fields[1]));
                } catch (NumberFormatException invalidId) {
                    errors.add(new ParseError(inputCount, "invalid-id"));
                }
            }
        }
        System.out.println("input=" + inputCount);
        System.out.println("names=" + people.stream().map(Person::name).toList());
        System.out.println("errorLines=" + errors.stream().map(ParseError::line).toList());
        System.out.println("accounted=" + (inputCount == people.size() + errors.size()));
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "logical line reader와 success/error collections를 import합니다." },
        { lines: "7-8", explanation: "valid Person과 safe line/reason ParseError records를 정의합니다." },
        { lines: "11-15", explanation: "four-line input, two result channels와 authoritative input count를 준비합니다." },
        { lines: "16-30", explanation: "각 line을 count하고 field-count/invalid-id를 typed errors로 보존하며 valid persons를 만듭니다." },
        { lines: "31-34", explanation: "input, names, error line contexts와 accounting equality를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8 source", "simple unquoted comma format", "-Xlint:all warning0"], command: isolatedJavaRun("RecordErrorAccounting.java", "RecordErrorAccounting") },
      output: { value: "input=4\nnames=[Alice, Bob]\nerrorLines=[2, 4]\naccounted=true", explanation: ["four records를 읽습니다.", "valid two와 errors two가 분리됩니다.", "모든 input이 exactly once accounting됩니다."] },
      experiments: [
        { change: "invalid lines를 continue만 하고 errors에 넣지 않습니다.", prediction: "accounted=false입니다.", result: "silent skip을 invariant가 탐지합니다." },
        { change: "3,\"A,B\"를 단순 split parser에 넣습니다.", prediction: "field-count error가 되지만 valid CSV일 수 있습니다.", result: "format-aware CSV parser를 사용합니다." },
        { change: "raw line 전체를 ParseError/public log에 넣습니다.", prediction: "PII/secret이 노출될 수 있습니다.", result: "safe field/reason/fingerprint만 보존합니다." },
      ],
      sourceRefs: ["java-buffered-reader", "java-string-reader", "java-string-api", "java-integer-api", "java-list-api"],
    }],
    diagnostics: [
      { symptom: "입력100건인데 결과와 오류를 합쳐98건이다.", likelyCause: "parse exception/invalid record를 silent skip했거나 한 record가 두 channel에 중복됐습니다.", checks: ["input/success/error counters를 비교합니다.", "continue/catch paths를 추적합니다.", "record id/line span을 확인합니다."], fix: "typed outcome을 exactly once 생성하고 accounting invariant를 assertion합니다.", prevention: "valid/invalid/interleaved property tests와 metrics alert를 둡니다." },
      { symptom: "quoted comma가 있는 정상 CSV가 field-count 오류가 된다.", likelyCause: "String.split을 CSV parser로 사용했습니다.", checks: ["quotes/escapes/multiline fixtures를 넣습니다.", "format specification을 확인합니다.", "library limits/config를 봅니다."], fix: "RFC/schema-aware CSV parser를 사용하고 Reader는 decoding만 담당하게 합니다.", prevention: "format conformance corpus와 parser version/config를 고정합니다." },
    ],
    expertNotes: ["For JSON, XML or CSV, a real streaming parser can consume a Reader while maintaining its own nesting/quote state. Do not reimplement mature grammars with line splitting.", "Error thresholds and partial publication are business transaction decisions. Preserve enough provenance to replay without exposing raw sensitive records."],
  },
  {
    id: "one-byte-chunk-unicode-verification-matrix",
    title: "UTF-8 multi-byte sequences가 one-byte chunks로 갈라져도 strict Reader state가 복원함을 검증합니다",
    lead: "underlying InputStream이 한 번에1byte만 반환하게 만들어 가·emoji·끝의3/4/3byte sequences 모든 경계를 강제로 쪼갭니다.",
    explanations: [
      "filesystem reads가 우연히 큰 chunks를 주면 decoder boundary bug를 놓칠 수 있습니다. adversarial InputStream은 requested length와 무관하게 최대1byte만 반환합니다.",
      "InputStreamReader는 CharsetDecoder state를 유지해 incomplete prefix bytes를 다음 read와 결합합니다. chunk별 new String과 달리 valid sequence를 복원합니다.",
      "strict decoder REPORT를 bridge에 넘겨 malformed/truncated bytes는 failure로 만들고 valid split sequence는 성공하게 합니다. 둘을 혼동하지 않습니다.",
      "char buffer size도1로 읽어 emoji surrogate pair가 두 Reader reads에 나뉘게 할 수 있습니다. StringWriter에 code units를 순서대로 모은 뒤 code points를 검증합니다.",
      "matrix는 각 multi-byte sequence의 every split position, EOF after each prefix, invalid continuation, overlong/surrogate encodings와 replacement policy를 포함합니다.",
      "input read가0을 반복하는 broken/non-blocking-adapted stream에는 busy-loop guard가 필요할 수 있습니다. standard blocking InputStream contract와 source subtype을 확인합니다.",
      "decoder state는 operation/thread마다 분리하고 reset protocol 없이 공유하지 않습니다. Charset itself는 reusable하지만 decoder는 mutable state입니다.",
      "large test에서 raw decoded text를 log하지 않고 round-trip, char/code-point counts, max chunk와 error category를 출력합니다.",
      "예제는 UTF-8 가😀끝10bytes를 max1 underlying chunks와 char-at-a-time Reader로 exact text4 chars/3 points에 복원합니다.",
    ],
    concepts: [
      { term: "split-sequence fixture", definition: "multi-byte character bytes를 모든 가능한 chunk boundaries에서 나눠 decoder state를 검증하는 입력입니다.", detail: ["valid split은 성공합니다.", "truncated EOF는 실패합니다."] },
      { term: "stateful decoder", definition: "incomplete byte sequence를 다음 input과 결합하고 end-of-input/flush를 관리하는 mutable decoder입니다.", detail: ["operation마다 분리합니다.", "chunk별 재생성하지 않습니다."] },
      { term: "adversarial source", definition: "법적으로 가능한 짧은 reads·failures를 의도적으로 반환해 consumer assumptions를 공격하는 test double입니다.", detail: ["max1 byte를 반환합니다.", "production oracle과 독립입니다."] },
    ],
    codeExamples: [{
      id: "java-one-byte-utf8-reader",
      title: "one-byte InputStream과 one-char Reader로 가😀끝을 strict UTF-8 복원합니다",
      language: "java",
      filename: "OneByteUtf8Reader.java",
      purpose: "multi-byte와 surrogate boundaries가 모두 갈라도 stateful decoder가 exact text를 보존함을 검증합니다.",
      code: `import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

public class OneByteUtf8Reader {
    static final class OneByteInput extends InputStream {
        private final ByteArrayInputStream delegate;
        private int maxReturned;
        OneByteInput(byte[] bytes) { delegate = new ByteArrayInputStream(bytes); }
        @Override public int read() { return delegate.read(); }
        @Override public int read(byte[] buffer, int offset, int length) {
            int count = delegate.read(buffer, offset, Math.min(length, 1));
            if (count > maxReturned) maxReturned = count;
            return count;
        }
    }

    public static void main(String[] args) throws Exception {
        String expected = "가😀끝";
        OneByteInput bytes = new OneByteInput(expected.getBytes(StandardCharsets.UTF_8));
        var decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        StringWriter restored = new StringWriter();
        try (InputStreamReader reader = new InputStreamReader(bytes, decoder)) {
            int value;
            while ((value = reader.read()) != -1) restored.write(value);
        }
        String result = restored.toString();
        System.out.println("roundTrip=" + expected.equals(result));
        System.out.println("utf16Chars=" + result.length());
        System.out.println("codePoints=" + result.codePointCount(0, result.length()));
        System.out.println("maxUnderlyingChunk=" + bytes.maxReturned);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "byte source, bridge, char target와 strict UTF-8 policy types를 import합니다." },
        { lines: "9-19", explanation: "bulk read가 최대1byte만 반환하고 max observed를 기록하는 adversarial InputStream을 정의합니다." },
        { lines: "22-27", explanation: "가😀끝 UTF-8 bytes와 operation-local REPORT decoder를 준비합니다." },
        { lines: "28-32", explanation: "InputStreamReader를 char-at-a-time 읽어 StringWriter에 ordered units를 보존합니다." },
        { lines: "33-37", explanation: "round-trip, UTF-16/code-point counts와 one-byte source fact를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "UTF-8", "one-byte underlying reads", "strict decoder", "-Xlint:all warning0"], command: isolatedJavaRun("OneByteUtf8Reader.java", "OneByteUtf8Reader") },
      output: { value: "roundTrip=true\nutf16Chars=4\ncodePoints=3\nmaxUnderlyingChunk=1", explanation: ["3/4/3byte characters가 복원됩니다.", "emoji 때문에 UTF-16 chars4/points3입니다.", "underlying bulk read는 최대1byte입니다."] },
      experiments: [
        { change: "각 one-byte chunk를 new String(chunk,UTF_8)로 decode합니다.", prediction: "multi-byte prefixes가 replacement/malformed가 되어 roundTrip=false입니다.", result: "stateful decoder를 유지합니다." },
        { change: "final UTF-8 byte를 제거합니다.", prediction: "strict reader close/EOF에서 malformed failure가 납니다.", result: "truncated EOF를 matrix에 포함합니다." },
        { change: "decoder를 threads가 공유합니다.", prediction: "mutable state/race로 결과가 섞이거나 illegal state가 됩니다.", result: "operation-local decoder를 사용합니다." },
      ],
      sourceRefs: ["java-input-stream-reader", "java-charset-decoder", "java-coding-error-action", "java-byte-array-input-stream", "java-string-writer", "java-standard-charsets", "java-input-stream-api"],
    }],
    diagnostics: [
      { symptom: "정상 UTF-8이 작은 network chunks에서만�로 바뀐다.", likelyCause: "chunk별로 independent String decode해 decoder carry state를 잃었습니다.", checks: ["decoder lifetime을 추적합니다.", "max1-byte adapter로 재현합니다.", "incomplete prefix at chunk end를 봅니다."], fix: "InputStreamReader 또는 persistent CharsetDecoder를 전체 message framing에 유지합니다.", prevention: "every split-position property tests와 truncated variants를 둡니다." },
      { symptom: "decoder를 재사용한 concurrent requests가 서로 영향을 준다.", likelyCause: "mutable CharsetDecoder를 shared singleton으로 사용했습니다.", checks: ["field/scope와 reset calls를 봅니다.", "concurrent trace를 확인합니다.", "Charset vs decoder objects를 구분합니다."], fix: "Charset은 공유 가능하지만 decoder/encoder는 operation-local로 생성합니다.", prevention: "concurrency isolation test와 mutable codec state review rule을 둡니다." },
    ],
    expertNotes: ["A byte-at-a-time source is intentionally inefficient but excellent for correctness. Performance tests should use realistic chunk distributions after the state-machine tests pass.", "For network protocols, message framing and decoder end-of-input boundaries matter. Do not carry an incomplete sequence from one independent message into the next."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...ingestionVerificationChapters);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "Reader.read()가 int인 이유는 무엇인가요?", answer: "char0..65535와 EOF-1을 함께 표현하기 위해서이며 EOF 검사 뒤 char로 사용합니다." },
  { question: "Java char 하나가 항상 Unicode 문자 하나인가요?", answer: "아닙니다. supplementary code point는 surrogate pair2 chars이고 grapheme은 여러 code points일 수 있습니다." },
  { question: "Reader bulk copy에서도 actual count가 필요한가요?", answer: "예. read(char[])가 반환한 앞 count units만 Writer.write(buffer,0,count)로 씁니다." },
  { question: "InputStreamReader charset은 어디에서 지정하나요?", answer: "constructor에 Charset 또는 configured CharsetDecoder를 전달해 byte→char boundary에 명시합니다." },
  { question: "OutputStreamWriter를 BufferedWriter 안쪽에 두는 이유는 무엇인가요?", answer: "characters를 buffer한 뒤 bridge가 UTF-8 bytes로 encode하도록 responsibility order를 유지합니다." },
  { question: "CharsetDecoder를 singleton으로 공유해도 되나요?", answer: "아닙니다. mutable state라 operation/thread마다 생성하고 Charset object만 안전하게 재사용합니다." },
  { question: "REPORT와 REPLACE의 핵심 차이는 무엇인가요?", answer: "REPORT는 손상을 typed failure로 드러내고 REPLACE는 data를 대체 문자로 바꿔 계속합니다." },
  { question: "IGNORE는 왜 위험한가요?", answer: "invalid bytes/characters를 조용히 버려 input accounting과 identity를 깨뜨립니다." },
  { question: "readLine은 원본 CRLF/LF를 보존하나요?", answer: "아닙니다. terminator를 제거해 logical line만 반환합니다." },
  { question: "마지막 newline 없는 file을 readLine/newLine으로 복사하면 어떻게 되나요?", answer: "모든 lines 뒤 newLine을 쓰면 source에 없던 final separator가 추가됩니다." },
  { question: "Files.newBufferedWriter의 CREATE_NEW 이점은 무엇인가요?", answer: "existing target을 atomic collision failure로 처리해 accidental truncate를 막습니다." },
  { question: "append할 때 charset만 같으면 충분한가요?", answer: "BOM·normalization·delimiter/final newline·concurrent record 정책도 같아야 합니다." },
  { question: "String.length와 codePointCount 중 UI 글자 수는 무엇인가요?", answer: "둘 다 grapheme cluster와 다를 수 있어 user-perceived limit은 Unicode segmentation을 사용합니다." },
  { question: "substring이 surrogate pair를 자를 수 있나요?", answer: "예. UTF-16 index가 pair 중간이면 malformed String이 되므로 code-point/grapheme-aware offset을 씁니다." },
  { question: "NFC normalization은 String.equals에 자동 적용되나요?", answer: "아닙니다. Normalizer로 명시적으로 적용해야 합니다." },
  { question: "normalize하면 checksum이 유지되나요?", answer: "아닙니다. code points와 encoded bytes가 바뀔 수 있어 hash/signature도 달라집니다." },
  { question: "NFKC를 모든 text에 적용해도 되나요?", answer: "아닙니다. compatibility 변환은 의미/display를 접을 수 있어 identifier profile 등 제한된 context에서 씁니다." },
  { question: "UTF-8 BOM은 필수인가요?", answer: "아닙니다. 선택적 signature이며 format/consumer policy에 따라 detect·strip·emit을 정합니다." },
  { question: "UTF-8 decoder가 BOM을 항상 제거하나요?", answer: "그렇게 가정하지 않고 leading U+FEFF/bytes를 명시적으로 처리합니다." },
  { question: "BOM을 global replace하면 왜 안 되나요?", answer: "중간 U+FEFF content까지 삭제하므로 file 시작 signature 한 번만 정책적으로 처리합니다." },
  { question: "normalized text output에 System.lineSeparator를 써야 하나요?", answer: "artifact format이 LF를 요구하면 platform과 무관하게 explicit LF를 씁니다." },
  { question: "case normalization에서 Locale.ROOT는 언제 쓰나요?", answer: "language-neutral identifiers/protocol keys에 쓰고 사용자 display는 explicit user locale을 고려합니다." },
  { question: "BufferedReader.readLine이 huge-line DoS를 막아주나요?", answer: "아닙니다. line length가 unbounded라 bounded parser가 필요합니다." },
  { question: "I/O error와 record parse error를 왜 분리하나요?", answer: "retry/recovery·사용자 feedback·accounting과 observability가 다르기 때문입니다." },
  { question: "invalid records를 skip해도 괜찮나요?", answer: "업무 정책이면 가능하지만 typed error channel에 보존해 input=success+error invariant를 유지합니다." },
  { question: "String.split로 CSV를 처리해도 되나요?", answer: "quoted comma·escaped quote·multiline records를 처리하지 못하므로 실제 CSV parser를 씁니다." },
  { question: "one-byte chunks가 valid UTF-8를 깨뜨리나요?", answer: "stateful InputStreamReader/decoder라면 chunk boundaries와 무관하게 복원합니다." },
  { question: "chunk마다 new String(bytes,UTF_8)을 쓰면 왜 안 되나요?", answer: "multi-byte sequence가 chunks 사이에 걸리면 incomplete state를 잃어 replacement/failure가 됩니다." },
  { question: "truncated multi-byte EOF는 어떻게 처리하나요?", answer: "strict decoder REPORT에서 malformed failure로 처리하고 replacement/ignore 여부를 명시합니다." },
  { question: "공개 오류에 raw line과 absolute path를 넣어도 되나요?", answer: "아닙니다. safe record/line/offset/reason과 restricted internal diagnostics를 분리합니다." },
);

(session.completionChecklist as string[]).push(
  "Reader/Writer를 byte streams와 구분했다.", "Reader EOF-1을 char cast 전에 검사했다.",
  "UTF-16 units와 code points를 구분했다.", "surrogate pair를 중간에서 자르지 않았다.",
  "grapheme와 code-point limits를 구분했다.", "char bulk read의 actual count만 write했다.",
  "InputStreamReader charset을 명시했다.", "OutputStreamWriter charset을 명시했다.",
  "buffer wrapper와 charset bridge order를 검증했다.", "process-global streams의 ownership을 검토했다.",
  "decoder/encoder를 operation-local로 뒀다.", "malformed/unmappable REPORT 정책을 정했다.",
  "replacement/ignore의 정보 손실을 문서화했다.", "multi-byte split decoder state를 유지했다.",
  "empty line과 EOF null을 구분했다.", "readLine terminator loss를 설명했다.",
  "newLine의 platform dependency를 검토했다.", "output separator를 format에 맞게 명시했다.",
  "final newline 정책을 명시했다.", "unbounded line length를 제한했다.",
  "writer CREATE_NEW·APPEND·TRUNCATE를 명시했다.", "validation 전에 target을 truncate하지 않았다.",
  "append charset/BOM/normalization을 검증했다.", "append delimiter와 concurrency policy를 정했다.",
  "UTF-8 byte limit과 grapheme limit을 별도 검증했다.", "code-point-aware slicing을 사용했다.",
  "normalization form과 적용 stage를 명시했다.", "original bytes와 normalized artifact provenance를 분리했다.",
  "signature/hash 전에 임의 normalize하지 않았다.", "identifier normalization과 display original을 분리했다.",
  "UTF-8 BOM/no-BOM을 모두 테스트했다.", "leading BOM만 format policy로 처리했다.",
  "BOM strip 뒤 original byte offset을 보존했다.", "case conversion locale을 명시했다.",
  "explicit LF로 cross-platform bytes를 고정했다.", "transform version과 before/after digest를 기록했다.",
  "decode와 record parser responsibilities를 분리했다.", "실제 CSV/JSON format parser를 사용했다.",
  "input=success+error accounting을 검증했다.", "raw sensitive records를 public log에서 제외했다.",
  "field/record/nesting resource limits를 정했다.", "partial publication 정책을 명시했다.",
  "one-byte chunks로 multibyte boundaries를 검증했다.", "모든 split positions와 truncated EOF를 테스트했다.",
  "decoder 공유 race를 금지했다.", "malformed·BOM·normalization·newline corpus를 유지했다.",
  "positive examples를 JDK21 warning0·exact output으로 검증했다.", "official source URLs와 public privacy scan을 검증했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-locale-api", repository: "Java SE 21 API", path: "java.util.Locale", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html", usedFor: ["Locale.ROOT", "case transformation"], evidence: "locale-stable identifier transform 근거입니다." },
  { id: "java-integer-api", repository: "Java SE 21 API", path: "java.lang.Integer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html", usedFor: ["parseInt", "invalid-id"], evidence: "record integer parsing 근거입니다." },
  { id: "java-list-api", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["success/error collections", "ordered output"], evidence: "record result collection 근거입니다." },
  { id: "java-input-stream-api", repository: "Java SE 21 API", path: "java.io.InputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html", usedFor: ["adversarial one-byte reads", "chunk boundary"], evidence: "one-byte source contract 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "explicit-LF streaming transform, typed record error accounting과 one-byte strict decoder matrix까지12 chapters를 완성했습니다.",
  "positive Java examples11은 OpenJDK21 -proc:none -Xlint:all compiler output0와 exact stable stdout을 요구합니다.",
  "공개 output은 semantic counts/booleans/normalized sample만 포함하고 original host paths·private records를 제외합니다.",
);
