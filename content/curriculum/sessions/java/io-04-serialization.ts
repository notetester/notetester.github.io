import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["io-04-serialization"],
  slug: "io-04-serialization",
  courseId: "java",
  moduleId: "java-systems",
  order: 33,
  title: "객체 직렬화와 transient·Externalizable",
  subtitle: "객체 그래프·버전 호환성·필터·불변식과 장기 저장 경계를 실제 byte stream과 실패 행렬로 검증합니다.",
  level: "고급",
  estimatedMinutes: 1080,
  coreQuestion: "Java 객체를 bytes로 왕복할 때 어떤 상태가 포함되고 identity와 schema가 어떻게 보존되며, 버전 변화·악성 입력·부분 파일로부터 어떻게 안전하게 복원할까요?",
  summary: "원본 class15의 Ex02~Ex07 여섯 파일을 함께 읽습니다. Ex02/03/04는 Serializable DTO 목록을 object01에 쓰고 읽으며 transient age와 gender가 각각0/false로 복원됩니다. Ex05/06/07은 Externalizable DTO 목록을 object02에 쓰고 읽고, writeExternal에 넣은 name·age만 돌아오므로 non-transient weight도0.0이고 gender는 false입니다. inventory 표에는 Ex02~Ex05만 적혀 있었지만 Externalizable의 실제 writer/reader인 Ex06/07을 같은 원본에서 발견해 누락 없이 포함합니다. package9는 unchecked2·serialVersionUID2·URL deprecation1로 warnings5, inventory6과 relocated6은 warnings4임을 숨기지 않습니다. 원본은 건드리지 않고 path literals4를 owned temp로만 치환해 JDK21 두 launcher modes에서 exact339/393 bytes와 rows를 재현합니다. 그 위에 object graph identity, Serializable field rules, serialVersionUID evolution, custom read/write invariants, Externalizable version framing, ObjectInputFilter, untrusted deserialization, handle semantics, stream framing·atomic publish, serialization proxy와 schema format 선택까지 확장합니다.",
  objectives: [
    "ObjectOutputStream·ObjectInputStream이 객체 그래프와 back-reference identity를 기록하는 방식을 설명한다.",
    "Serializable의 default field selection과 static·transient·기본값 복원 규칙을 검증한다.",
    "serialVersionUID와 compatible/incompatible class evolution을 실패 유형으로 분류한다.",
    "writeObject/readObject·readResolve·serialization proxy에서 불변식과 defensive validation을 적용한다.",
    "Externalizable의 public no-arg constructor와 exact read/write order·version 책임을 구현한다.",
    "ObjectInputFilter로 class·depth·references·array length·bytes 제한을 적용한다.",
    "untrusted native serialization을 코드 실행 경계로 보고 allowlist만으로 해결되지 않는 위험을 설명한다.",
    "stream header·handle table·reset·append·partial file·atomic publish를 운영 계약으로 설계한다.",
  ],
  prerequisites: [
    { title: "Reader·Writer와 인코딩", reason: "serialization도 stream ownership·EOF·buffering·temp publish를 다루지만 binary protocol이므로 text decode를 적용하지 않습니다.", sessionSlug: "io-03-reader-writer" },
    { title: "캡슐화와 불변식", reason: "역직렬화는 constructor/setter 경로를 우회할 수 있어 object invariant를 별도로 재검증해야 합니다.", sessionSlug: "oop-03-encapsulation" },
  ],
  keywords: ["serialization", "ObjectOutputStream", "ObjectInputStream", "Serializable", "Externalizable", "serialVersionUID", "transient", "object graph", "handle", "reset", "writeObject", "readObject", "readResolve", "writeReplace", "serialization proxy", "ObjectInputFilter", "JEP 290", "JEP 415", "InvalidClassException", "NotSerializableException", "StreamCorruptedException", "schema evolution", "untrusted deserialization"],
  chapters: [],
  lab: {
    title: "불신 입력을 거부하는 versioned import·migration·atomic publish pipeline",
    scenario: "과거 Java object stream을 한 번만 읽어 검증된 명시 DTO로 변환하고 JSON 또는 database schema로 이관해야 합니다. 입력은 조작되었거나 오래된 class version일 수 있습니다.",
    setup: ["valid current/old UID, wrong UID, truncated header, unexpected class, deep graph, large array와 corrupted token fixtures를 격리합니다.", "read-only input, same-filesystem owned temp output과 existing final collision을 준비합니다.", "허용 class/limits, migration versions, field invariants와 공개 error schema를 정의합니다."],
    steps: ["input size를 먼저 제한하고 digest/provenance를 기록합니다.", "process/container·filesystem·network 권한을 최소화한 migration runner를 사용합니다.", "ObjectInputFilter를 factory/per-stream policy로 설치합니다.", "root type과 graph classes를 검증하고 native object를 즉시 inert migration DTO로 복사합니다.", "readObject/custom validation에서 length/range/relationship invariants를 검사합니다.", "version별 explicit adapter로 current schema를 만듭니다.", "normalized output을 temp에 쓰고 schema·count·digest를 검증합니다.", "close 뒤 atomic publish하고 input→output audit record를 남깁니다.", "모든 negative fixture에서 final 불변과 temp cleanup을 검사합니다."],
    expectedResult: ["unexpected/deep/large/truncated inputs가 bounded typed failure로 끝납니다.", "valid old versions만 deterministic current records로 이관됩니다.", "native graph object가 application runtime으로 확산되지 않습니다.", "existing final과 raw sensitive values가 보존되고 public error에는 safe context만 남습니다."],
    extensions: ["released v1/v2 writer JAR를 별도 classloader/process로 실행해 compatibility matrix를 자동화합니다.", "filter limit 바로 아래·위와 combined depth/array cases를 property corpus로 생성합니다.", "JSON·CBOR·Protobuf 후보를 같은 domain fixtures와 size/evolution/tooling 표로 비교합니다.", "write·close·verify·move 각 단계 fault injection과 restart orphan reconciliation을 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "Serializable Account에서 password를 transient로 제외하고 id·displayName만 왕복하세요.", requirements: ["explicit serialVersionUID를 둡니다.", "ByteArray object streams와 try-with-resources를 씁니다.", "password null/default와 fields2를 exact 출력합니다.", "negative non-serializable field도 재현합니다."], hints: ["transient는 암호화가 아닙니다.", "reachable field graph를 확인합니다."], expectedOutcome: "포함·제외 field와 NotSerializableException을 설명하는 warning0 예제가 완성됩니다.", solutionOutline: ["default field rule을 표로 만듭니다.", "round-trip 뒤 identity가 아닌 values를 검증합니다."] },
    { difficulty: "응용", prompt: "Externalizable Profile의 version1/2 read/write protocol을 구현하세요.", requirements: ["public no-arg와 leading version int를 둡니다.", "version별 order/type을 문서화합니다.", "unknown version·truncated input을 거부합니다.", "default/required field invariants를 검증합니다.", "golden bytes와 round-trip을 테스트합니다."], hints: ["transient modifier에 기대지 않습니다.", "readExternal이 partially initialized object를 남기지 않게 local variables를 씁니다."], expectedOutcome: "v1을 읽고 v2를 쓰며 unknown/corrupt data를 안전하게 거부하는 protocol이 완성됩니다.", solutionOutline: ["version을 먼저 읽습니다.", "locals 검증 후 fields에 commit합니다."] },
    { difficulty: "설계", prompt: "legacy native serialization archive를 장기 schema format으로 옮기는 보안·호환성 설계를 작성하세요.", requirements: ["trust boundary와 runner privileges를 그립니다.", "filter class/depth/reference/array/byte limits를 명시합니다.", "UID/class/version fixture matrix를 만듭니다.", "serialization proxy/custom hook/gadget 위험을 다룹니다.", "atomic output·resume/idempotency·audit·rollback을 포함합니다.", "JSON/CBOR/Protobuf/database 중 format 선택 근거를 제시합니다."], hints: ["filter는 생성자 우회와 gadget side effect를 모두 제거하지 않습니다.", "장기 저장은 class shape와 schema evolution을 분리합니다."], expectedOutcome: "운영자가 안전하게 재시도·감사·폐기할 수 있는 one-way migration runbook이 완성됩니다.", solutionOutline: ["discover→quarantine→bounded decode→validate→map→publish 흐름을 그립니다.", "acceptance criterion과 evidence owner를 표로 연결합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  sources: [],
  sourceCoverage: {
    filesRead: 6,
    filesUsed: 6,
    uncoveredFiles: [],
    uncoveredNotes: [
      "inventory의 Ex02~Ex05를 읽고 같은 package의 complementary Externalizable runners Ex06/07을 추가로 읽어 실행 가능한 six-file boundary를 복원했습니다.",
      "class15 Ex01 text bridge는 io-03, Ex08/09 network는 net-01로 분리하되 package compile warning count에는 Ex09 deprecation을 투명하게 포함했습니다.",
      "원본 unchecked casts·missing UID·manual close와 raw native serialization 위험을 숨기지 않고 현대 chapters에서 교정합니다.",
    ],
  },
  relatedGlossary: ["serialization", "object graph", "schema evolution", "invariant", "allowlist", "atomic publish"],
  nextSessions: [],
} satisfies DetailedSession;

export default session;

const originalAuditChapter: DetailedSession["chapters"][number] = {
  id: "class15-inventory6-serialization-audit",
  title: "class15 package9·inventory6·relocated6의 warnings와 두 직렬화 결과를 원본 그대로 감사합니다",
  lead: "원본 파일을 실행 경로에서 직접 수정하지 않고 알려진 두 absolute path만 owned temp로 치환해 Serializable과 Externalizable의 실제 차이를 exact bytes·rows로 증명합니다.",
  explanations: [
    "원래 인벤토리는 Ex02 writer·Ex03 reader·Ex04 Serializable DTO·Ex05 Externalizable DTO 네 파일만 가리킵니다. 그러나 Ex05를 실제 실행하는 Ex06 writer와 Ex07 reader가 같은 package에 있으므로 여섯 파일을 하나의 실행 가능한 원본 경계로 사용합니다.",
    "class15 package에는9 files와7 mains가 있습니다. package compile의 warnings5는 Ex03/07 generic unchecked casts2, Ex04/05 missing serialVersionUID2와 net-01 대상 Ex09의 deprecated URL constructor1입니다.",
    "io-04 inventory6에는4 mains가 있고 warnings4입니다. warning을 지우거나 숨기지 않고 category/count를 감사한 뒤 현대 예제에서는 explicit UID·type validation으로 warning0을 달성합니다.",
    "Ex02는8 Ex04_DTO를 ArrayList에 넣어 ObjectOutputStream으로 씁니다. Ex04의 name·weight는 default serialization 대상이지만 transient age·gender는 stream에 없어서 read 뒤0/false입니다.",
    "Ex06은8 Ex05_DTO를 쓰지만 Externalizable이므로 transient 여부보다 writeExternal 구현이 우선합니다. name과 boxed age만 기록해 weight는 non-transient여도0.0, gender는 false입니다.",
    "Ex05에는 public no-arg constructor가 있어 Externalizable 복원 시 instance를 만들 수 있습니다. writeExternal과 readExternal의 type/order가 name→age로 같아야 합니다.",
    "fresh JDK21 fixture에서 Serializable stream은339bytes, Externalizable stream은393bytes입니다. 크기 차이를 일반 성능 결론으로 확대하지 않고 현재 class descriptor·list·field protocol의 exact regression fact로만 사용합니다.",
    "writer/reader는 같은 temp file을 순서대로 사용하고 stdout/stderr를 동시에 drain합니다. 각 child는10초 timeout, process-tree kill과5초 grace를 가지며 stdin을 닫습니다.",
    "baseline과 hostile launcher variables 네 개를 분리하고 child environment에서 제거합니다. 원래 host variables는 존재 여부와 값을 정확히 복원하며 body·restore·cleanup failures를 모두 보존합니다.",
    "원본 D-drive files는 절대 열지 않습니다. replacements4가 모두 audit root의 direct descendants인지 검증하고 생성 ownership을 얻은 temp root만 삭제합니다.",
  ],
  concepts: [
    { term: "default serialization", definition: "Serializable object의 non-static·non-transient fields를 class descriptor와 함께 object stream protocol로 기록하는 기본 메커니즘입니다.", detail: ["constructor를 일반 방식으로 실행하지 않습니다.", "reachable graph를 따라갑니다."] },
    { term: "Externalizable contract", definition: "class가 ObjectOutput/ObjectInput 호출 순서와 표현을 전부 직접 정의하는 직렬화 계약입니다.", detail: ["public no-arg constructor가 필요합니다.", "transient보다 methods가 결정적입니다."] },
    { term: "compiler evidence boundary", definition: "원본 warning을 정확히 기록하고 개선 예제의 warning0과 섞지 않는 출처 보존 규칙입니다.", detail: ["warning category/count를 보존합니다.", "unrelated net warning을 분리합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-io04-audit",
    title: "원본 package/inventory/relocated compile과 Serializable·Externalizable 왕복을 두 modes에서 검증합니다",
    language: "powershell",
    filename: "verify-original-io04.ps1",
    purpose: "원본 경로와 파일을 건드리지 않고 warnings, exact bytes, restored rows와 source shape를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("io04 audit "+[Guid]::NewGuid().ToString('N'))
$ownsRoot=$false;$bodyError=$null;$nl=[string][char]10;$tab=[string][char]9

function Normalize([string]$text){return $text.Replace(([string][char]13+[char]10),[string][char]10)}
function Invoke-Child([string]$file,[string[]]$arguments,[string]$cwd){
  $start=[Diagnostics.ProcessStartInfo]::new()
  $start.FileName=$file;$start.WorkingDirectory=$cwd;$start.UseShellExecute=$false
  $start.RedirectStandardInput=$true;$start.RedirectStandardOutput=$true;$start.RedirectStandardError=$true
  $start.StandardOutputEncoding=[Text.UTF8Encoding]::new($false);$start.StandardErrorEncoding=[Text.UTF8Encoding]::new($false)
  foreach($arg in $arguments){[void]$start.ArgumentList.Add($arg)}
  foreach($name in $optionNames){[void]$start.Environment.Remove($name)}
  $process=[Diagnostics.Process]::new();$process.StartInfo=$start
  try{
    if(-not$process.Start()){throw 'process start failed'}
    $outTask=$process.StandardOutput.ReadToEndAsync();$errTask=$process.StandardError.ReadToEndAsync();$process.StandardInput.Close()
    if(-not$process.WaitForExit(10000)){
      $process.Kill($true);if(-not$process.WaitForExit(5000)){throw 'termination grace exceeded'}
      [void]$outTask.GetAwaiter().GetResult();[void]$errTask.GetAwaiter().GetResult();throw 'child timeout'
    }
    return @{Exit=$process.ExitCode;Out=(Normalize $outTask.GetAwaiter().GetResult());Err=(Normalize $errTask.GetAwaiter().GetResult())}
  }finally{$process.Dispose()}
}
function Compile([IO.FileInfo[]]$files,[string]$classes,[int]$unchecked,[int]$serial,[int]$deprecated,[int]$total){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $args=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
  $result=Invoke-Child 'javac' $args $root
  if($result.Exit-ne0-or$result.Out.Length-ne0){throw 'compile failed'}
  $lines=@($result.Err.TrimEnd([char]10).Split([char]10))
  $u=@($lines|Where-Object{$_-match'compiler\.warn\.prob\.found\.req'}).Count
  $s=@($lines|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count
  $d=@($lines|Where-Object{$_-match'compiler\.warn\.has\.been\.deprecated'}).Count
  if($u-ne$unchecked-or$s-ne$serial-or$d-ne$deprecated-or$lines.Count-ne($total+1)-or$lines[-1]-cne"$total warnings"){throw 'warning evidence drift'}
  return $total
}
function Run([string]$classes,[string]$main){
  $result=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,$main) $root
  if($result.Exit-ne0-or$result.Err.Length-ne0){throw "$main process drift"};return $result.Out
}
function Remove-JavaComments([string]$text){return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
function Java-Literal([string]$path){return $path.Replace('\','\\')}
function Write-Relocated([IO.FileInfo]$file,[string]$destination,[hashtable]$replacements){
  $text=[IO.File]::ReadAllText($file.FullName)
  foreach($entry in @($replacements.GetEnumerator()|Sort-Object{$_.Key.Length}-Descending)){
    if($text.Contains($entry.Key)){
      $replacement=[IO.Path]::GetFullPath($entry.Value);$prefix=[IO.Path]::GetFullPath($root).TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
      if(-not$replacement.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){throw 'replacement outside audit root'}
      $text=$text.Replace($entry.Key,(Java-Literal $entry.Value));if($text.Contains($entry.Key)){throw 'path literal survived'}
    }
  }
  [IO.File]::WriteAllText($destination,$text,[Text.UTF8Encoding]::new($false))
}
function Audit([string]$mode,[string]$class15){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Dio04.audit=javac';$env:JDK_JAVA_OPTIONS='-Dio04.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Dio04.audit=tool';$env:_JAVA_OPTIONS='-Dio04.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package=@(Get-ChildItem -LiteralPath $class15 -Filter '*.java'|Sort-Object Name)
  $names=@('Ex02_ObjectOutputStream.java','Ex03_ObjectInputStream.java','Ex04_DTO.java','Ex05_DTO.java','Ex06_ObjectOutputStream.java','Ex07_ObjectInputStream.java')
  $inventory=@($names|ForEach-Object{Get-Item -LiteralPath (Join-Path $class15 $_)})
  if($package.Count-ne9-or$inventory.Count-ne6){throw 'inventory drift'}
  $packageWarnings=Compile $package (Join-Path $root ("package-"+$mode)) 2 2 1 5
  $inventoryWarnings=Compile $inventory (Join-Path $root ("inventory-"+$mode)) 2 2 0 4
  $mainPattern='public\s+static\s+void\s+main\s*\('
  $packageMains=@($package|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  $inventoryMains=@($inventory|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  if($packageMains-ne7-or$inventoryMains-ne4){throw 'main role drift'}

  $sourceCopy=Join-Path $root ("source-"+$mode);New-Item -ItemType Directory -Path $sourceCopy -ErrorAction Stop|Out-Null
  $object01=Join-Path $root ("object01-"+$mode+".bin");$object02=Join-Path $root ("object02-"+$mode+".bin")
  foreach($file in $inventory){Write-Relocated $file (Join-Path $sourceCopy $file.Name) @{'D:\\util\\object01.txt'=$object01;'D:\\util\\object02.txt'=$object02}}
  $relocated=@(Get-ChildItem -LiteralPath $sourceCopy -Filter '*.java'|Sort-Object Name)
  $classes=Join-Path $root ("relocated-"+$mode);$relocatedWarnings=Compile $relocated $classes 2 2 0 4

  if((Run $classes 'com.java.class15.Ex02_ObjectOutputStream').Length-ne0){throw 'Ex02 stdout drift'}
  $namesOut=@('고길동','이길동','김길동','가길동','나길동','박길동','임길동','배길동')
  $weights=@('79.6','59.6','70.1','39.2','68.4','82.9','54.8','32.6')
  $serialRows=@(for($i=0;$i-lt8;$i++){$namesOut[$i]+$tab+'0'+$tab+$weights[$i]+$tab+'여성'})
  if((Run $classes 'com.java.class15.Ex03_ObjectInputStream')-cne(($serialRows-join$nl)+$nl)){throw 'Serializable rows drift'}
  if((Get-Item -LiteralPath $object01).Length-ne339){throw 'Serializable bytes drift'}

  if((Run $classes 'com.java.class15.Ex06_ObjectOutputStream').Length-ne0){throw 'Ex06 stdout drift'}
  $ages=@(29,19,22,10,35,39,30,13)
  $externalRows=@(for($i=0;$i-lt8;$i++){$namesOut[$i]+$tab+$ages[$i]+$tab+'0.0'+$tab+'여성'})
  if((Run $classes 'com.java.class15.Ex07_ObjectInputStream')-cne(($externalRows-join$nl)+$nl)){throw 'Externalizable rows drift'}
  if((Get-Item -LiteralPath $object02).Length-ne393){throw 'Externalizable bytes drift'}

  $active=@{};foreach($file in $inventory){$active[$file.Name]=Remove-JavaComments([IO.File]::ReadAllText($file.FullName))};$joined=$active.Values-join$nl
  $shape=@{
    serializable=([regex]::Matches($joined,'implements\s+Serializable\b')).Count;externalizable=([regex]::Matches($joined,'implements\s+Externalizable\b')).Count
    transient=([regex]::Matches($joined,'\btransient\b')).Count;oos=([regex]::Matches($joined,'new\s+ObjectOutputStream\s*\(')).Count
    ois=([regex]::Matches($joined,'new\s+ObjectInputStream\s*\(')).Count;write=([regex]::Matches($joined,'\.writeObject\s*\(')).Count
    read=([regex]::Matches($joined,'\.readObject\s*\(')).Count;close=([regex]::Matches($joined,'\.close\s*\(')).Count
    uid=([regex]::Matches($joined,'serialVersionUID')).Count;paths=([regex]::Matches($joined,'[A-Za-z]:\\\\')).Count
  }
  if($shape.serializable-ne1-or$shape.externalizable-ne1-or$shape.transient-ne4-or$shape.oos-ne2-or$shape.ois-ne2-or$shape.write-ne4-or$shape.read-ne4-or$shape.close-ne12-or$shape.uid-ne0-or$shape.paths-ne4){throw 'source shape drift'}
  return "package=9,warnings=$packageWarnings,mains=7|inventory=6,warnings=$inventoryWarnings,mains=4|relocated=6,warnings=$relocatedWarnings;serializable=339bytes,8rows,age0,genderFalse|externalizable=393bytes,8rows,weight0,genderFalse|shapes=Serializable:1|Externalizable:1|transient:4|objectStreams:2,2|objectCalls:4,4|close:12|paths:4->temp"
}

try{
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'};New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  $source=[IO.Path]::GetFullPath($SourceRoot);$class15=Join-Path $source 'src/com/java/class15'
  $baseline=Audit 'baseline' $class15;$hostile=Audit 'hostile' $class15;if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline";'privacy=original-paths:not-run|fixture:owned-temp;launcherOptions=4'
}catch{$bodyError=$_.Exception}finally{
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){try{if($saved[$name].Exists){Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop;$restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}}else{Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}}}catch{$finalErrors.Add($_.Exception)}}
  try{if($ownsRoot){$resolved=[IO.Path]::GetFullPath($root);if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe cleanup'};if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop};if(Test-Path -LiteralPath $resolved){throw 'cleanup failed'}}}catch{$finalErrors.Add($_.Exception)}
  if($null-ne$bodyError){$finalErrors.Insert(0,$bodyError)};if($finalErrors.Count-eq1){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()};if($finalErrors.Count-gt1){throw[AggregateException]::new('audit and cleanup failures',$finalErrors.ToArray())}
}`,
    walkthrough: [
      { lines: "1-11", explanation: "launcher variables와 공백 포함 temp root의 ownership/error state를 준비합니다." },
      { lines: "13-47", explanation: "동시 stdout/stderr drain, timeout/tree kill과 warning category를 검증하는 compile/run helpers를 정의합니다." },
      { lines: "48-60", explanation: "comments 제거와 known path만 audit root로 옮기는 source relocation helper를 정의합니다." },
      { lines: "61-75", explanation: "package9·inventory6, mains7/4와 expected warnings5/4를 두 launcher modes에서 확인합니다." },
      { lines: "77-81", explanation: "path literals4를 mode별 temp files로 치환하고 relocated6 warnings4 compile을 수행합니다." },
      { lines: "83-94", explanation: "Serializable339bytes·transient defaults와 Externalizable393bytes·manual field defaults를 exact rows로 검증합니다." },
      { lines: "96-105", explanation: "원본 source에서 Serializable/Externalizable/object calls/close/path shape와 summary를 검증합니다." },
      { lines: "108-118", explanation: "두 modes 결과를 비교하고 launcher restore와 direct-child cleanup failures를 보존합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "baseline+hostile launcher modes", "owned temp files only"], command: "pwsh -NoProfile -File verify-original-io04.ps1 -SourceRoot <classstudy-root>" },
    output: { value: "spacePath=True,modes=2|same=True,package=9,warnings=5,mains=7|inventory=6,warnings=4,mains=4|relocated=6,warnings=4;serializable=339bytes,8rows,age0,genderFalse|externalizable=393bytes,8rows,weight0,genderFalse|shapes=Serializable:1|Externalizable:1|transient:4|objectStreams:2,2|objectCalls:4,4|close:12|paths:4->temp\nprivacy=original-paths:not-run|fixture:owned-temp;launcherOptions=4", explanation: ["원본 warnings를 category/count로 보존합니다.", "두 DTO 방식의 포함 fields와 defaults가 다릅니다.", "실제 absolute paths와 files는 열지 않습니다."] },
    experiments: [
      { change: "Ex04 age에서 transient를 제거합니다.", prediction: "stream descriptor와 bytes가 바뀌고 새로 쓴 file에서는 age29 등 원래 값이 복원됩니다.", result: "field selection과 version compatibility를 함께 재검토합니다." },
      { change: "Ex05 readExternal에서 age를 name보다 먼저 읽습니다.", prediction: "String token을 int/object contract로 잘못 해석해 type/protocol failure가 납니다.", result: "version tag와 exact symmetric order를 둡니다." },
      { change: "object01 reader만 먼저 실행합니다.", prediction: "file 없음 또는 partial header에서 IOException 계열로 실패합니다.", result: "writer 성공·close·publish 뒤에만 reader가 보게 합니다." },
    ],
    sourceRefs: ["java-class15-ex02", "java-class15-ex03", "java-class15-ex04", "java-class15-ex05", "java-class15-ex06", "java-class15-ex07", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "java-object-output-stream", "java-object-input-stream", "java-serializable", "java-externalizable", "java-array-list"],
  }],
  diagnostics: [
    { symptom: "Serializable DTO의 나이와 true 성별이 모두0/false로 복원된다.", likelyCause: "age와 gender가 transient라 stream에 기록되지 않았습니다.", checks: ["field modifiers를 봅니다.", "ObjectStreamClass fields를 확인합니다.", "fresh file인지 확인합니다."], fix: "업무상 필요한 field면 transient를 제거하거나 versioned custom representation에 명시합니다.", prevention: "round-trip에서 field별 expected included/default table을 검증합니다." },
    { symptom: "Externalizable DTO의 non-transient weight도0.0이다.", likelyCause: "Externalizable은 default field selection이 아니라 writeExternal/readExternal calls만 따릅니다.", checks: ["두 methods의 order/type을 나란히 봅니다.", "public no-arg constructor를 확인합니다.", "stream version을 기록합니다."], fix: "weight를 symmetric하게 쓰고 읽거나 의도적 제외임을 schema에 명시합니다.", prevention: "각 version의 golden bytes와 field coverage test를 둡니다." },
  ],
  expertNotes: ["Native serialization bytes contain class metadata and implementation-specific protocol details; file size comparisons here are regression evidence, not a universal compactness benchmark.", "Closing ObjectOutputStream closes underlying buffered/file streams. Manual repeated close works in many implementations but try-with-resources expresses ownership and preserves suppressed failures more reliably."],
};

(session.chapters as DetailedSession["chapters"]).push(originalAuditChapter);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "Serializable과 Externalizable의 가장 큰 책임 차이는 무엇인가요?", answer: "Serializable은 기본 field protocol을 platform이 제공하고 hook으로 조정하지만 Externalizable은 생성과 read/write representation 전체를 class가 책임집니다." },
  { question: "transient field는 복원 시 어떤 값이 되나요?", answer: "stream에서 제외되어 해당 type의 기본값 null/0/false가 되며 custom readObject가 다시 설정할 수 있습니다." },
  { question: "static field는 object stream에 저장되나요?", answer: "아닙니다. class state이지 individual object state가 아니므로 default serialization 대상이 아닙니다." },
  { question: "Ex05의 weight는 transient가 아닌데 왜0.0인가요?", answer: "Externalizable에서는 writeExternal에 넣지 않았기 때문에 기록되지 않았습니다." },
  { question: "Externalizable에 public no-arg constructor가 왜 필요한가요?", answer: "ObjectInputStream이 public no-arg constructor로 instance를 만든 뒤 readExternal을 호출하기 때문입니다." },
  { question: "원본 warnings4를 warning0으로 숨기지 않은 이유는 무엇인가요?", answer: "unchecked cast와 missing UID가 실제 학습 원본의 compatibility/type-safety 상태이므로 evidence로 보존하고 개선은 별도 예제로 제시하기 때문입니다." },
  { question: "object file을 text editor로 읽으면 안 되는 이유는 무엇인가요?", answer: "Java object serialization은 charset text가 아니라 binary token·descriptor·handle protocol입니다." },
  { question: "writer stream bytes339가 항상 보장되나요?", answer: "현재 JDK21·class shapes·values의 regression fact일 뿐 general API contract나 다른 version의 고정 크기가 아닙니다." },
  { question: "ObjectOutputStream 하나를 닫으면 underlying stream은 어떻게 되나요?", answer: "close가 flush 후 underlying OutputStream도 닫으므로 가장 바깥 wrapper가 resource ownership을 갖습니다." },
  { question: "불신 object stream을 application에서 바로 읽어도 되나요?", answer: "아닙니다. native deserialization은 graph construction과 hooks를 실행할 수 있어 가능한 한 피하고 격리·filter·limits·migration을 사용합니다." },
);

(session.completionChecklist as string[]).push(
  "inventory 표와 실제 complementary files를 대조했다.", "원본 package/inventory warning categories를 보존했다.",
  "원본 absolute files를 실행하지 않았다.", "path replacements가 owned temp 내부인지 확인했다.",
  "baseline/hostile launcher modes를 분리했다.", "stdout/stderr를 동시에 drain했다.",
  "timeout·tree kill·grace·Dispose를 적용했다.", "launcher variables의 존재와 값을 복원했다.",
  "Serializable transient defaults를 exact rows로 확인했다.", "Externalizable manual field coverage를 exact rows로 확인했다.",
  "binary bytes를 text charset으로 해석하지 않았다.", "try-with-resources ownership 개선점을 기록했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class15-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex02_ObjectOutputStream.java", usedFor: ["Serializable list writer", "object01 path", "manual stream stack"], evidence: "Ex04 list8을 object01에 쓰는 원본입니다." },
  { id: "java-class15-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex03_ObjectInputStream.java", usedFor: ["unchecked list reader", "transient restored rows"], evidence: "age0·gender false rows를 출력하는 원본입니다." },
  { id: "java-class15-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex04_DTO.java", usedFor: ["Serializable DTO", "transient age/gender", "missing UID warning"], evidence: "default serialization field selection의 원본입니다." },
  { id: "java-class15-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex05_DTO.java", usedFor: ["Externalizable DTO", "name/age manual protocol", "public no-arg"], evidence: "writeExternal/readExternal 순서와 field coverage 원본입니다." },
  { id: "java-class15-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex06_ObjectOutputStream.java", usedFor: ["Externalizable list writer", "object02 path"], evidence: "인벤토리 표에서 누락됐지만 Ex05를 실제 실행하는 complementary writer입니다." },
  { id: "java-class15-ex07", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex07_ObjectInputStream.java", usedFor: ["Externalizable list reader", "manual fields restored rows"], evidence: "인벤토리 표에서 누락됐지만 Ex05 result를 출력하는 complementary reader입니다." },
  { id: "jdk21-javac", repository: "OpenJDK", path: "javac tool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-Xlint:all", "-XDrawDiagnostics"], evidence: "package/inventory warning counts와 positive warning0 기준입니다." },
  { id: "powershell-environment", repository: "Microsoft Learn", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "per-variable restore"], evidence: "baseline/hostile environment isolation 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["argument list", "redirection", "working directory"], evidence: "safe child launch 근거입니다." },
  { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child launcher option removal"], evidence: "hostile parent와 clean child 환경 분리 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "Kill(entireProcessTree)", "Dispose"], evidence: "bounded process lifecycle 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout/stderr drains"], evidence: "redirect pipe deadlock 방지 근거입니다." },
  { id: "java-object-output-stream", repository: "Java SE 21 API", path: "java.io.ObjectOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectOutputStream.html", usedFor: ["writeObject", "stream protocol", "handle table", "custom hooks"], evidence: "object output graph·replacement·reset API의 중심 근거입니다." },
  { id: "java-object-input-stream", repository: "Java SE 21 API", path: "java.io.ObjectInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputStream.html", usedFor: ["readObject", "filter", "class resolution", "validation hooks"], evidence: "object input construction·filter·hook의 중심 근거입니다." },
  { id: "java-serializable", repository: "Java SE 21 API", path: "java.io.Serializable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html", usedFor: ["marker contract", "serialVersionUID", "custom methods"], evidence: "default serialization eligibility와 class compatibility 근거입니다." },
  { id: "java-externalizable", repository: "Java SE 21 API", path: "java.io.Externalizable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Externalizable.html", usedFor: ["public no-arg", "writeExternal", "readExternal"], evidence: "manual representation·construction contract 근거입니다." },
  { id: "java-array-list", repository: "Java SE 21 API", path: "java.util.ArrayList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html", usedFor: ["original list8 graph", "Serializable collection"], evidence: "원본 root collection type과 unchecked cast 개선 근거입니다." },
);

const graphAndCompatibilityChapters: DetailedSession["chapters"] = [
  {
    id: "object-graph-handles-shared-identity-cycles",
    title: "ObjectOutputStream은 tree가 아니라 shared identity와 cycle을 가진 객체 그래프를 handle로 기록합니다",
    lead: "같은 instance를 두 field가 가리키는 경우와 self-cycle을 duplicate values로 평탄화하지 않고 back-reference로 복원합니다.",
    explanations: [
      "writeObject는 root 하나의 fields만 쓰지 않고 non-transient reachable references를 따라 object graph를 순회합니다. graph 안의 각 새 object에는 stream handle이 할당됩니다.",
      "이미 기록한 동일 instance를 다시 만나면 full object를 다시 쓰지 않고 previous handle reference를 씁니다. 그래서 restored.left==restored.right 같은 alias identity가 유지됩니다.",
      "cycle도 같은 메커니즘으로 끝납니다. Node.next가 자기 자신을 가리켜도 first Node를 등록한 뒤 next에서 back-reference를 기록하므로 무한 recursion하지 않습니다.",
      "equals가 true인 별도 instances는 identity가 다르므로 별도 objects로 기록됩니다. equality와 aliasing은 서로 다른 domain invariant입니다.",
      "reachable graph에 Serializable이 아닌 field object가 하나라도 포함되면 root가 Serializable이어도 NotSerializableException이 발생합니다. transient 또는 explicit proxy로 graph를 제한합니다.",
      "inner class의 hidden outer reference, collection의 elements, exception causes, comparator와 callback fields도 graph를 예상보다 넓힐 수 있습니다. field type 선언만 보지 않고 runtime graph를 inventory합니다.",
      "deserialization은 새 graph를 만들므로 original root와 restored root의 identity는 다릅니다. stream 내부 alias relations만 복원되는 것이지 process across time identity는 유지되지 않습니다.",
      "object identity를 database key나 distributed identity로 쓰지 않습니다. durable id와 version을 explicit schema fields로 둡니다.",
      "예제는 Pair의 두 fields가 같은 Node를 가리키고 별도 self-cycle Node를 두 번째 root로 기록해 alias·cycle·root separation을 exact booleans로 검증합니다.",
    ],
    concepts: [
      { term: "object graph", definition: "root에서 fields를 따라 도달 가능한 objects와 reference edges의 집합입니다.", detail: ["tree보다 일반적입니다.", "cycles와 aliases를 포함합니다."] },
      { term: "stream handle", definition: "이미 기록된 object·class descriptor 등을 후속 reference가 다시 가리키게 하는 protocol identifier입니다.", detail: ["identity를 보존합니다.", "reset이 table을 지웁니다."] },
      { term: "alias invariant", definition: "두 references가 값만 같은 것이 아니라 동일 instance를 가리킨다는 관계입니다.", detail: ["==로 검증합니다.", "schema format은 별도 id가 필요할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-object-graph-identity",
      title: "shared Node와 self-cycle을 serialize한 뒤 identity relations를 복원합니다",
      language: "java",
      filename: "ObjectGraphIdentity.java",
      purpose: "object stream이 duplicate values가 아닌 reference topology를 보존함을 검증합니다.",
      code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class ObjectGraphIdentity {
    static final class Node implements Serializable {
        private static final long serialVersionUID = 1L;
        final String name;
        Node next;
        Node(String name) { this.name = name; }
    }
    static final class Pair implements Serializable {
        private static final long serialVersionUID = 1L;
        final Node left;
        final Node right;
        Pair(Node left, Node right) { this.left = left; this.right = right; }
    }
    public static void main(String[] args) throws Exception {
        Node shared = new Node("S");
        Pair pair = new Pair(shared, shared);
        Node cycle = new Node("C");
        cycle.next = cycle;
        byte[] bytes;
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(pair);
            output.writeObject(cycle);
            bytes = sink.toByteArray();
        }
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            Pair restoredPair = (Pair) input.readObject();
            Node restoredCycle = (Node) input.readObject();
            System.out.println("sharedIdentity=" + (restoredPair.left == restoredPair.right));
            System.out.println("cycleIdentity=" + (restoredCycle == restoredCycle.next));
            System.out.println("newRoot=" + (restoredPair != pair));
            System.out.println("values=" + restoredPair.left.name + "," + restoredCycle.name);
        }
    }
}`,
      walkthrough: [
        { lines: "1-5", explanation: "in-memory binary object streams와 Serializable을 import합니다." },
        { lines: "8-19", explanation: "explicit UID를 가진 Node와 two-reference Pair graph types를 정의합니다." },
        { lines: "21-31", explanation: "shared alias Pair와 self-cycle을 한 stream의 sequential roots로 기록합니다." },
        { lines: "32-40", explanation: "두 roots를 읽고 shared/cycle identity, new root와 values를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "in-memory object stream", "-Xlint:all warning0"], command: isolatedJavaRun("ObjectGraphIdentity.java", "ObjectGraphIdentity") },
      output: { value: "sharedIdentity=true\ncycleIdentity=true\nnewRoot=true\nvalues=S,C", explanation: ["Pair aliases가 같은 restored Node입니다.", "self-cycle도 자기 자신을 가리킵니다.", "restored root는 original과 별도 instance입니다."] },
      experiments: [
        { change: "Pair에 같은 name의 new Node 두 개를 전달합니다.", prediction: "values는 같아도 sharedIdentity=false입니다.", result: "equality와 identity를 분리합니다." },
        { change: "Node에 non-Serializable Object field를 추가합니다.", prediction: "reachable graph에서 NotSerializableException이 납니다.", result: "root marker만 보지 않고 graph를 감사합니다." },
        { change: "cycle.next를 null로 바꿉니다.", prediction: "cycleIdentity=false이고 next가 null입니다.", result: "topology 자체를 golden으로 검증합니다." },
      ],
      sourceRefs: ["java-object-output-stream", "java-object-input-stream", "java-serializable", "java-byte-array-output-stream", "java-byte-array-input-stream", "serialization-output-spec", "serialization-input-spec", "serialization-arch-spec"],
    }],
    diagnostics: [
      { symptom: "직렬화 root는 Serializable인데 NotSerializableException이 난다.", likelyCause: "reachable field graph 안의 runtime object 또는 hidden outer/callback가 Serializable이 아닙니다.", checks: ["exception class name을 봅니다.", "fields와 collection elements를 graph로 추적합니다.", "inner outer reference를 확인합니다."], fix: "durable DTO로 필요한 values만 복사하거나 non-durable relation을 transient로 명시합니다.", prevention: "graph inventory와 negative non-serializable fixture를 둡니다." },
      { symptom: "복원 뒤 두 fields가 같은 값이지만 서로 다른 instance가 됐다.", likelyCause: "writer 전에 graph를 DTO values로 복제했거나 서로 다른 objects를 전달했습니다.", checks: ["write 직전 == relation을 봅니다.", "custom writeReplace/proxy를 확인합니다.", "schema adapter가 ids를 보존하는지 봅니다."], fix: "alias가 domain invariant면 explicit id/reference table로 표현하고 round-trip topology를 검사합니다.", prevention: "value equality와 identity assertions를 별도 작성합니다." },
    ],
    expertNotes: ["Native handles are stream-local implementation protocol, not stable application identifiers. Cross-format migrations need explicit IDs and reference resolution.", "Large cyclic graphs can still exhaust depth, references or memory even though cycles terminate. Apply filters and pre-read byte limits."],
  },
  {
    id: "serializable-field-selection-transient-static-graph",
    title: "Serializable default fields에서 static·transient를 제외하고 reachable runtime type까지 검사합니다",
    lead: "modifier 한 줄이 confidentiality를 보장하지 않으며 포함 field의 object graph와 class evolution까지 함께 관리해야 합니다.",
    explanations: [
      "default serialization은 각 Serializable class의 non-static·non-transient fields를 기록합니다. private fields도 포함되며 getter 존재 여부와 무관합니다.",
      "static은 class loader의 현재 process state라 stream에 기록되지 않습니다. read 전에 static 값을 바꾸면 restored instance도 바뀐 static을 관찰합니다.",
      "transient reference는 null, primitive는0/false 같은 default로 남습니다. custom readObject가 계산하거나 secret provider에서 재주입하지 않으면 자동 복원되지 않습니다.",
      "transient는 암호화·memory wipe·log redaction이 아닙니다. 다른 field, toString, cache, screenshot 또는 previous stream version에 secret이 남을 수 있습니다.",
      "field declared type이 Object/interface여도 runtime value가 Serializable이면 기록되고 아니면 NotSerializableException입니다. compiler generic type만으로 graph eligibility가 확정되지 않습니다.",
      "serialPersistentFields와 PutField/GetField로 persistent representation을 조정할 수 있지만 source fields와 wire fields가 어긋나므로 강한 version tests가 필요합니다.",
      "derived cache·thread·socket·open stream·dependency service는 보통 transient이고 복원 뒤 lazy rebuild하거나 명시 rehydration합니다. null state를 method가 허용하도록 설계합니다.",
      "sensitive durable value가 필요하면 transient로 버리는 대신 application-level encryption, key rotation, authenticated metadata와 access control을 설계합니다.",
      "예제는 id·attachment만 돌아오고 secret은 null, static epoch는 최신9를 보며 raw Object attachment가 non-serializable일 때 typed rejection이 발생함을 검증합니다.",
    ],
    concepts: [
      { term: "persistent field", definition: "default 또는 explicit serialization representation에 포함되는 instance field입니다.", detail: ["private도 포함됩니다.", "static/transient는 기본 제외입니다."] },
      { term: "rehydration", definition: "stream에 넣지 않은 derived/resource/service state를 복원 뒤 안전하게 다시 연결하는 과정입니다.", detail: ["invariant를 재검사합니다.", "secret provider와 분리합니다."] },
      { term: "runtime graph eligibility", definition: "declared type이 아니라 실제 reachable object마다 Serializable 가능 여부가 결정되는 성질입니다.", detail: ["collection elements도 포함합니다.", "negative test가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-serializable-field-boundary",
      title: "persistent·transient·static fields와 non-serializable graph 실패를 구분합니다",
      language: "java",
      filename: "SerializableFieldBoundary.java",
      purpose: "default field selection을 exact values와 typed failure로 확인합니다.",
      code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.NotSerializableException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class SerializableFieldBoundary {
    static final class Account implements Serializable {
        private static final long serialVersionUID = 1L;
        static int epoch = 7;
        final String id;
        transient String secret;
        @SuppressWarnings("serial") // deliberate runtime-graph fixture
        final Object attachment;
        Account(String id, String secret, Object attachment) {
            this.id = id; this.secret = secret; this.attachment = attachment;
        }
    }
    static byte[] encode(Object value) throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(value);
            return sink.toByteArray();
        }
    }
    public static void main(String[] args) throws Exception {
        byte[] bytes = encode(new Account("A-1", "token", "note"));
        Account.epoch = 9;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            Account restored = (Account) input.readObject();
            System.out.println("id=" + restored.id);
            System.out.println("secretIsNull=" + (restored.secret == null));
            System.out.println("staticEpoch=" + Account.epoch);
            System.out.println("attachment=" + restored.attachment);
        }
        boolean rejected = false;
        try {
            encode(new Account("A-2", "hidden", new Object()));
        } catch (NotSerializableException expected) {
            rejected = "java.lang.Object".equals(expected.getMessage());
        }
        System.out.println("graphRejected=" + rejected);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "byte streams, typed graph failure와 Serializable을 import합니다." },
      { lines: "9-19", explanation: "static epoch, persistent id/attachment와 transient secret을 가진 explicit-UID Account를 정의하며 deliberate Object graph fixture만 좁게 suppress합니다." },
      { lines: "20-26", explanation: "임의 root를 in-memory object bytes로 쓰는 helper를 정의합니다." },
      { lines: "28-37", explanation: "Serializable String attachment round-trip 뒤 id, transient null, current static와 attachment를 출력합니다." },
      { lines: "38-45", explanation: "raw Object attachment graph를 쓰고 exact NotSerializableException target을 검증합니다." },
      ],
      run: { environment: ["OpenJDK 21", "in-memory stream", "-Xlint:all warning0"], command: isolatedJavaRun("SerializableFieldBoundary.java", "SerializableFieldBoundary") },
      output: { value: "id=A-1\nsecretIsNull=true\nstaticEpoch=9\nattachment=note\ngraphRejected=true", explanation: ["id/String attachment만 복원됩니다.", "secret은 null이고 static은 stream 값이 아닙니다.", "new Object graph가 거부됩니다."] },
      experiments: [
        { change: "secret에서 transient를 제거합니다.", prediction: "secretIsNull=false가 되지만 credential 저장 위험이 생깁니다.", result: "보안 요구를 modifier가 아닌 data classification으로 결정합니다." },
        { change: "attachment를 transient로 바꿉니다.", prediction: "raw Object도 graph에서 제외되어 write가 성공하고 read 뒤 null입니다.", result: "rehydration contract를 추가합니다." },
        { change: "epoch를 instance final field로 바꿉니다.", prediction: "stream에7이 저장되어 restored object가7을 가집니다.", result: "class state와 object state를 구분합니다." },
      ],
      sourceRefs: ["java-serializable", "java-not-serializable-exception", "java-object-output-stream", "java-object-input-stream", "java-byte-array-output-stream", "java-byte-array-input-stream", "serialization-fields-spec", "serialization-output-spec"],
    }],
    diagnostics: [
      { symptom: "secret field를 transient로 했는데 과거 archive에는 값이 남아 있다.", likelyCause: "transient 추가 전 version의 stream 또는 다른 duplicated field가 값을 기록했습니다.", checks: ["archive 생성 version을 확인합니다.", "class descriptor/field inventory를 봅니다.", "logs/backups를 검색합니다."], fix: "old artifacts를 access-restrict·rotate·migrate·secure delete하고 credentials를 폐기합니다.", prevention: "data classification과 versioned retention policy를 modifier review보다 먼저 둡니다." },
      { symptom: "복원 뒤 transient cache가 null이라 method가 NPE를 낸다.", likelyCause: "constructor/field initializer가 일반 Serializable read에 기대한 방식으로 cache를 재생성하지 않았습니다.", checks: ["readObject/readResolve를 봅니다.", "cache가 derived인지 확인합니다.", "first method call을 재현합니다."], fix: "safe lazy initialization 또는 validated readObject에서 cache를 재구성합니다.", prevention: "fresh와 restored instances에 동일 public invariant tests를 실행합니다." },
    ],
    expertNotes: ["Marking a field transient is an inclusion decision, not a confidentiality control. Secrets require end-to-end lifecycle controls.", "serialPersistentFields can decouple source and stream fields but increases hidden schema surface; prefer a serialization proxy or explicit external schema for durable data."],
  },
  {
    id: "serial-version-uid-compatible-incompatible-evolution",
    title: "serialVersionUID를 명시하고 compatible change와 InvalidClassException을 fixture matrix로 분리합니다",
    lead: "UID는 schema migration engine이 아니라 class compatibility gate이며 같게 유지한다고 모든 변화가 안전해지는 것은 아닙니다.",
    explanations: [
      "Serializable class는 stream descriptor와 local class의 serialVersionUID가 달라지면 InvalidClassException으로 거부됩니다. explicit private static final long UID를 선언해 accidental computed changes를 막습니다.",
      "UID를 선언하지 않으면 class details에서 default UID를 계산합니다. seemingly harmless member·modifier/compiler 변화가 값을 바꿀 수 있어 persistent archives와 distributed peers가 깨질 수 있습니다.",
      "UID가 같아도 field type change, hierarchy change, semantic invariant change는 안전한 migration을 보장하지 않습니다. compatibility check와 domain validity는 별도 gates입니다.",
      "일부 field 추가는 old stream에서 default value로 읽히고 field 제거는 old data를 무시하는 등 compatible rules가 있지만 required 여부와 의미는 application adapter가 처리해야 합니다.",
      "incompatible 변경을 억지로 같은 UID로 숨기기보다 old representation class/reader를 유지하고 explicit current DTO로 변환합니다. version fixtures를 release artifact로 보존합니다.",
      "class/package rename은 descriptor resolution을 깨뜨립니다. resolveClass override는 매우 제한적으로 사용할 수 있지만 arbitrary remapping은 type confusion과 보안 위험을 만듭니다.",
      "UID를 timestamp처럼 매 build 바꾸는 것도, 영원히1L로 고정하며 모든 변화를 허용하는 것도 migration strategy가 아닙니다. compatibility policy와 support window를 문서화합니다.",
      "예제는 explicit UID11을 ObjectStreamClass에서 확인하고 test fixture에서 stream descriptor의 UID bytes를12로 바꿔 typed mismatch rejection을 재현합니다.",
      "실제 호환성 CI는 v1 writer artifact→v2 reader, v2 writer→지원 중인 v1 reader 방향을 요구별로 별도 JVM/classloader에서 실행합니다.",
    ],
    concepts: [
      { term: "serialVersionUID", definition: "stream class descriptor와 local Serializable class의 version compatibility를 비교하는64-bit identifier입니다.", detail: ["explicit 선언을 권장합니다.", "schema version 전체를 대신하지 않습니다."] },
      { term: "compatible evolution", definition: "serialization specification이 old/new class descriptor 사이에서 자동 read를 허용하는 제한된 변경 집합입니다.", detail: ["default values가 생길 수 있습니다.", "domain migration은 별도입니다."] },
      { term: "version fixture matrix", definition: "각 released writer bytes를 여러 reader versions로 실제 읽어 compatibility와 semantic result를 검증하는 표입니다.", detail: ["양방향 요구를 명시합니다.", "golden artifact를 보존합니다."] },
    ],
    codeExamples: [{
      id: "java-serial-version-uid-mismatch",
      title: "UID11 descriptor를 확인하고 stream UID를12로 바꿔 InvalidClassException을 재현합니다",
      language: "java",
      filename: "SerialVersionUidMismatch.java",
      purpose: "UID mismatch gate를 build-time 가정이 아니라 실제 binary fixture로 검증합니다.",
      code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidClassException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.ObjectStreamClass;
import java.io.Serializable;
import java.nio.ByteBuffer;

public class SerialVersionUidMismatch {
    static final class Versioned implements Serializable {
        private static final long serialVersionUID = 11L;
        final String value = "v";
    }
    static int indexOf(byte[] data, byte[] pattern) {
        outer: for (int i = 0; i <= data.length - pattern.length; i++) {
            for (int j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) continue outer;
            }
            return i;
        }
        return -1;
    }
    public static void main(String[] args) throws Exception {
        byte[] bytes;
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(new Versioned());
            bytes = sink.toByteArray();
        }
        byte[] uid11 = ByteBuffer.allocate(Long.BYTES).putLong(11L).array();
        int offset = indexOf(bytes, uid11);
        if (offset < 0) throw new AssertionError("UID not found");
        byte[] uid12 = ByteBuffer.allocate(Long.BYTES).putLong(12L).array();
        System.arraycopy(uid12, 0, bytes, offset, uid12.length);
        boolean rejected = false;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            input.readObject();
        } catch (InvalidClassException expected) {
            rejected = true;
        }
        long localUid = ObjectStreamClass.lookup(Versioned.class).getSerialVersionUID();
        System.out.println("localUid=" + localUid);
        System.out.println("uidOffsetFound=" + (offset >= 0));
        System.out.println("mismatchRejected=" + rejected);
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "object streams, UID descriptor/failure와 ByteBuffer를 import합니다." },
        { lines: "11-22", explanation: "UID11 class와 byte pattern offset finder를 정의합니다." },
        { lines: "24-30", explanation: "Versioned instance를 fresh stream bytes로 기록합니다." },
        { lines: "31-35", explanation: "big-endian UID11 sequence를 찾아 UID12로 교체합니다." },
        { lines: "36-47", explanation: "tampered stream read rejection과 local UID/offset facts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "controlled in-memory tamper fixture", "-Xlint:all warning0"], command: isolatedJavaRun("SerialVersionUidMismatch.java", "SerialVersionUidMismatch") },
      output: { value: "localUid=11\nuidOffsetFound=true\nmismatchRejected=true", explanation: ["local descriptor UID는11입니다.", "controlled stream에서 descriptor sequence를 찾습니다.", "UID12가 InvalidClassException으로 거부됩니다."] },
      experiments: [
        { change: "Versioned UID를12로 바꿔 다시 compile합니다.", prediction: "tampered stream UID12가 compatibility gate를 통과합니다.", result: "통과 후 field/domain validity는 별도 확인합니다." },
        { change: "explicit UID 선언을 지웁니다.", prediction: "computed value가 class shape에 따라 달라집니다.", result: "serialver/ObjectStreamClass로 값 drift를 관찰합니다." },
        { change: "value field type을 incompatible하게 바꾸고 UID만 유지합니다.", prediction: "UID 통과만으로 safe read가 보장되지 않습니다.", result: "released-version JVM matrix를 사용합니다." },
      ],
      sourceRefs: ["java-serializable", "java-object-stream-class", "java-invalid-class-exception", "java-object-output-stream", "java-object-input-stream", "java-byte-array-output-stream", "java-byte-array-input-stream", "java-byte-buffer", "serialization-version-spec"],
    }],
    diagnostics: [
      { symptom: "배포 후 old file에서 local class incompatible 오류가 난다.", likelyCause: "explicit UID가 없거나 intentionally changed UID와 old descriptor가 다릅니다.", checks: ["exception의 stream/local UID를 봅니다.", "old artifact class version을 찾습니다.", "serialver 결과와 release history를 비교합니다."], fix: "지원 old reader/class를 격리해 explicit current schema로 migration하고 overwrite하지 않습니다.", prevention: "explicit UID와 released golden compatibility matrix를 CI에 둡니다." },
      { symptom: "UID를 같게 맞췄는데 복원 object가 invalid하다.", likelyCause: "field default/type/semantic change를 UID gate가 domain migration해 줄 것이라 가정했습니다.", checks: ["added field default를 봅니다.", "readObject validation을 확인합니다.", "version별 meaning을 비교합니다."], fix: "version-aware adapter에서 required/default/range/relationship을 검증하고 current object를 새로 만듭니다.", prevention: "binary compatibility와 semantic compatibility acceptance를 분리합니다." },
    ],
    expertNotes: ["Byte tampering is used only as a deterministic test fixture to exercise the UID gate. Production migrations should use real released writer artifacts.", "A stable UID lowers accidental breakage but can also admit semantically stale data; always pair it with invariant validation and explicit support policy."],
  },
  {
    id: "custom-readobject-getfield-invariant-validation",
    title: "readObject에서 GetField를 local values로 읽고 검증 후 commit해 constructor 우회 불변식을 복원합니다",
    lead: "Serializable read는 public factory와 일반 constructor validation을 거치지 않을 수 있으므로 stream fields를 신뢰하지 않고 새 입력처럼 검사합니다.",
    explanations: [
      "Serializable object를 읽을 때 가장 가까운 non-Serializable superclass constructor는 실행되지만 Serializable class constructor는 일반 new처럼 실행되지 않습니다. constructor 하나에만 invariant를 두면 우회됩니다.",
      "private readObject(ObjectInputStream)는 정확한 signature로 선언해야 serialization hook으로 호출됩니다. 이름이 같아도 parameter/return/access가 다르면 ordinary method일 뿐입니다.",
      "defaultReadObject는 fields에 바로 값을 넣습니다. stronger commit discipline이 필요하면 readFields/GetField로 local primitives/references를 꺼내 검증한 뒤 this fields에 대입합니다.",
      "missing field default와 explicitly stored default를 구분해야 하면 GetField.defaulted(name)을 사용합니다. old version default policy를 명시합니다.",
      "invalid stream은 InvalidObjectException으로 거부하고 partially initialized object reference를 외부에 publish하지 않습니다. static registry/listener에 read 중 this를 등록하지 않습니다.",
      "validation은 null, length, numeric range뿐 아니라 cross-field relation, duplicate identity, collection size, canonical form과 authorization-derived state를 다룹니다.",
      "readObject가 network/database/file side effects를 수행하면 untrusted data가 I/O를 유발하고 retry가 비결정적이 됩니다. inert validation과 post-import enrichment를 분리합니다.",
      "final fields와 immutable design은 custom restoration이 까다롭습니다. serialization proxy가 constructor/factory를 통해 새 valid object를 만드는 방식을 선호합니다.",
      "예제는 public factory가 low≤high를 검증하고 readFields도 같은 invariant를 적용합니다. valid read가 constructor count를 늘리지 않고 invalid fixture는 InvalidObjectException으로 거부됩니다.",
    ],
    concepts: [
      { term: "deserialization invariant", definition: "stream에서 읽은 state가 public construction과 동일하게 만족해야 하는 domain condition입니다.", detail: ["constructor만으로 부족합니다.", "cross-field validation을 포함합니다."] },
      { term: "GetField", definition: "persistent fields를 이름과 default로 읽어 object fields에 직접 commit하기 전 검사할 수 있는 ObjectInputStream view입니다.", detail: ["defaulted 여부를 볼 수 있습니다.", "local validation에 유용합니다."] },
      { term: "partial object escape", definition: "read/validation이 끝나기 전에 this가 static registry·callback·다른 thread에 노출되는 결함입니다.", detail: ["invalid state가 관찰됩니다.", "side effect를 금지합니다."] },
    ],
    codeExamples: [{
      id: "java-validated-readobject-fields",
      title: "Range fields를 local로 읽어 검증하고 invalid stream을 typed failure로 거부합니다",
      language: "java",
      filename: "ValidatedReadObject.java",
      purpose: "constructor가 read 때 실행되지 않는 사실과 readObject invariant gate를 동시에 검증합니다.",
      code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidObjectException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class ValidatedReadObject {
    static final class Range implements Serializable {
        private static final long serialVersionUID = 1L;
        static int constructorCalls;
        private int low;
        private int high;
        private Range(int low, int high, boolean fixture) {
            constructorCalls++;
            this.low = low; this.high = high;
        }
        static Range of(int low, int high) {
            if (low > high) throw new IllegalArgumentException("low > high");
            return new Range(low, high, false);
        }
        static Range invalidFixture() { return new Range(9, 2, true); }
        private void readObject(ObjectInputStream input)
                throws java.io.IOException, ClassNotFoundException {
            ObjectInputStream.GetField fields = input.readFields();
            int restoredLow = fields.get("low", 0);
            int restoredHigh = fields.get("high", 0);
            if (restoredLow > restoredHigh) throw new InvalidObjectException("low > high");
            low = restoredLow; high = restoredHigh;
        }
        String value() { return low + ".." + high; }
    }
    static byte[] encode(Range range) throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(range);
            return sink.toByteArray();
        }
    }
    static Range decode(byte[] bytes) throws Exception {
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            return (Range) input.readObject();
        }
    }
    public static void main(String[] args) throws Exception {
        Range valid = Range.of(2, 9);
        int beforeRead = Range.constructorCalls;
        Range restored = decode(encode(valid));
        System.out.println("value=" + restored.value());
        System.out.println("constructorRanOnRead=" + (Range.constructorCalls != beforeRead));
        boolean rejected = false;
        try {
            decode(encode(Range.invalidFixture()));
        } catch (InvalidObjectException expected) {
            rejected = true;
        }
        System.out.println("invalidRejected=" + rejected);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "object streams, typed invalid-state failure와 Serializable을 import합니다." },
        { lines: "9-22", explanation: "constructor count, public valid factory와 test-only invalid fixture를 가진 Range를 정의합니다." },
        { lines: "23-31", explanation: "GetField locals를 읽고 low≤high 검증 뒤 fields에 commit하는 hook을 정의합니다." },
        { lines: "32-44", explanation: "warning0 encode/decode helpers와 value view를 정의합니다." },
        { lines: "46-59", explanation: "valid restoration의 constructor bypass와 invalid stream rejection을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "controlled invalid fixture", "-Xlint:all warning0"], command: isolatedJavaRun("ValidatedReadObject.java", "ValidatedReadObject") },
      output: { value: "value=2..9\nconstructorRanOnRead=false\ninvalidRejected=true", explanation: ["valid range가 복원됩니다.", "Range constructor는 read 때 호출되지 않습니다.", "9..2 fixture는 typed failure입니다."] },
      experiments: [
        { change: "readObject를 제거합니다.", prediction: "invalid9..2가 그대로 returned object가 됩니다.", result: "constructor validation만으로 부족함을 확인합니다." },
        { change: "defaultReadObject 뒤 static registry에 등록하고 나중에 validate합니다.", prediction: "invalid/partial object가 escape할 수 있습니다.", result: "검증 완료 전 side effect를 금지합니다." },
        { change: "old stream에 high가 missing이라고 가정합니다.", prediction: "default0이 되어 positive low에서 invalid가 될 수 있습니다.", result: "defaulted(name)으로 version policy를 분기합니다." },
      ],
      sourceRefs: ["java-object-input-stream", "java-object-input-get-field", "java-invalid-object-exception", "java-object-output-stream", "java-byte-array-output-stream", "java-byte-array-input-stream", "java-serializable", "serialization-input-spec"],
    }],
    diagnostics: [
      { symptom: "public constructor는 invalid 값을 막는데 restored object는 invariant를 어긴다.", likelyCause: "Serializable class constructor가 ordinary read path에서 실행된다고 가정하고 readObject validation을 생략했습니다.", checks: ["constructor side effect count를 봅니다.", "custom hook signature를 확인합니다.", "invalid golden stream을 읽습니다."], fix: "readFields locals를 검증한 뒤 commit하거나 serialization proxy로 factory를 호출합니다.", prevention: "모든 construction paths에 공통 invariant tests를 실행합니다." },
      { symptom: "readObject를 작성했는데 호출되지 않는다.", likelyCause: "private void readObject(ObjectInputStream) throws IOException,ClassNotFoundException 계열 signature가 정확하지 않습니다.", checks: ["access/return/parameter를 봅니다.", "method에 trace가 아닌 behavior test를 둡니다.", "overload를 검색합니다."], fix: "serialization spec의 exact special method signature를 사용하고 invalid fixture rejection을 확인합니다.", prevention: "hook reflection/behavior regression test를 둡니다." },
    ],
    expertNotes: ["The example uses a test-only invalid factory to create deterministic hostile bytes. Production domain APIs should never expose such a path.", "Deserialization hooks should be pure, bounded and side-effect-minimal. External services belong after an inert DTO has passed validation."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...graphAndCompatibilityChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-byte-array-output-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayOutputStream.html", usedFor: ["deterministic in-memory object bytes", "encode helper"], evidence: "filesystem 없는 exact object-stream fixtures 근거입니다." },
  { id: "java-byte-array-input-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayInputStream.html", usedFor: ["deterministic reads", "negative fixtures"], evidence: "controlled bytes read 근거입니다." },
  { id: "serialization-arch-spec", repository: "Java Object Serialization Specification", path: "1 System Architecture", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/serial-arch.html", usedFor: ["graph", "handles", "Serializable/Externalizable architecture"], evidence: "object graph와 class responsibilities의 normative architecture 근거입니다." },
  { id: "serialization-output-spec", repository: "Java Object Serialization Specification", path: "2 Object Output Classes", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/output.html", usedFor: ["writeObject traversal", "handles", "writeReplace", "reset"], evidence: "output algorithm과 replacement/handle rules 근거입니다." },
  { id: "serialization-input-spec", repository: "Java Object Serialization Specification", path: "3 Object Input Classes", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/input.html", usedFor: ["construction", "readObject", "GetField", "validation"], evidence: "input construction·custom hook·exception rules 근거입니다." },
  { id: "serialization-fields-spec", repository: "Java Object Serialization Specification", path: "1.5 Defining Serializable Fields", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/serial-arch.html#defining-serializable-fields-for-a-class", usedFor: ["non-static non-transient defaults", "serialPersistentFields"], evidence: "persistent field selection 근거입니다." },
  { id: "serialization-version-spec", repository: "Java Object Serialization Specification", path: "5 Versioning of Serializable Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/version.html", usedFor: ["UID", "compatible/incompatible changes", "version matrix"], evidence: "class evolution compatibility rules 근거입니다." },
  { id: "java-not-serializable-exception", repository: "Java SE 21 API", path: "java.io.NotSerializableException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/NotSerializableException.html", usedFor: ["runtime graph rejection", "negative attachment fixture"], evidence: "non-serializable graph typed failure 근거입니다." },
  { id: "java-object-stream-class", repository: "Java SE 21 API", path: "java.io.ObjectStreamClass", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectStreamClass.html", usedFor: ["local UID lookup", "class descriptor"], evidence: "runtime serial descriptor/UID inspection 근거입니다." },
  { id: "java-invalid-class-exception", repository: "Java SE 21 API", path: "java.io.InvalidClassException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InvalidClassException.html", usedFor: ["UID mismatch rejection", "class compatibility diagnostics"], evidence: "stream/local class incompatibility typed failure 근거입니다." },
  { id: "java-byte-buffer", repository: "Java SE 21 API", path: "java.nio.ByteBuffer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/ByteBuffer.html", usedFor: ["controlled long UID bytes", "big-endian fixture"], evidence: "UID mismatch byte fixture 근거입니다." },
  { id: "java-object-input-get-field", repository: "Java SE 21 API", path: "java.io.ObjectInputStream.GetField", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputStream.GetField.html", usedFor: ["readFields locals", "defaulted fields"], evidence: "validate-before-commit field access 근거입니다." },
  { id: "java-invalid-object-exception", repository: "Java SE 21 API", path: "java.io.InvalidObjectException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InvalidObjectException.html", usedFor: ["invariant rejection", "invalid stream fixture"], evidence: "restored object invalidity typed failure 근거입니다." },
);

const externalizableChapter: DetailedSession["chapters"][number] = {
  id: "externalizable-version-tag-order-public-constructor",
  title: "Externalizable은 public no-arg와 version-first symmetric protocol·validate-before-commit을 직접 책임집니다",
  lead: "transient modifier나 default field rules에 기대지 않고 모든 token의 순서·type·optional 여부와 old-version default를 wire contract로 고정합니다.",
  explanations: [
    "Externalizable은 Serializable의 marker eligibility를 가지지만 writeExternal/readExternal이 object state representation을 전부 결정합니다. non-transient field도 method가 쓰지 않으면 사라집니다.",
    "read 때 public no-arg constructor가 먼저 실행됩니다. private/package constructor만 있거나 constructor가 예외를 던지면 정상 복원이 불가능합니다.",
    "첫 token에 magic/version을 두면 reader가 뒤 token layout을 결정할 수 있습니다. name→age를 age→name으로 바꾸면서 version을 유지하면 primitive/object token mismatch나 잘못된 값이 생깁니다.",
    "writeInt/readInt, writeUTF/readUTF처럼 exact pair를 대칭으로 사용합니다. writeObject로 boxed Integer를 쓰고 readInt로 읽는 것도 다른 protocol입니다.",
    "writeUTF/readUTF는 modified UTF-8과 unsigned-short length 제약이 있으므로 일반 파일 UTF-8과 같다고 설명하지 않습니다. 큰 text는 explicit byte length·UTF-8 또는 schema format을 사용합니다.",
    "readExternal은 직접 fields에 하나씩 넣기보다 local variables에 모두 읽고 version·null·length·range를 검증한 뒤 commit합니다. 중간 failure에서 partially valid state가 escape하지 않게 합니다.",
    "unknown future version은 추측해 읽지 말고 InvalidObjectException으로 거부합니다. optional tail을 허용하려면 length/framing과 skip semantics를 protocol에 명시합니다.",
    "Externalizable은 compact하다는 이유만으로 선택하지 않습니다. class evolution·security·interoperability와 test burden이 커 durable storage에는 명시 schema가 더 적합한 경우가 많습니다.",
    "예제는 v1 name/age와 v2 name/age/optional email을 같은 current reader가 복원하고 version3을 거부해 backward read와 unknown rejection을 exact 출력합니다.",
  ],
  concepts: [
    { term: "version-first protocol", definition: "representation의 첫 token에서 layout version을 읽고 이후 fields의 type/order를 선택하는 계약입니다.", detail: ["unknown을 거부합니다.", "version별 golden을 둡니다."] },
    { term: "symmetric token order", definition: "writer가 기록한 primitive/object token sequence를 reader가 동일 type과 순서로 소비하는 규칙입니다.", detail: ["field 이름 정보가 자동 제공되지 않습니다.", "순서 변경은 version change입니다."] },
    { term: "validate-before-commit", definition: "모든 외부 값을 locals에 읽고 검증이 끝난 뒤 object fields에 한 번에 반영하는 패턴입니다.", detail: ["partial state를 줄입니다.", "side effect를 늦춥니다."] },
  ],
  codeExamples: [{
    id: "java-versioned-externalizable",
    title: "v1/v2 Profile을 읽고 unknown v3을 InvalidObjectException으로 거부합니다",
    language: "java",
    filename: "VersionedExternalizable.java",
    purpose: "public constructor, leading version, symmetric tokens와 local validation을 한 예제에서 검증합니다.",
    code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.Externalizable;
import java.io.InvalidObjectException;
import java.io.ObjectInput;
import java.io.ObjectInputStream;
import java.io.ObjectOutput;
import java.io.ObjectOutputStream;

public class VersionedExternalizable {
    public static final class Profile implements Externalizable {
        private static final long serialVersionUID = 1L;
        private String name;
        private int age;
        private String email;
        private transient int wireVersion;
        public Profile() {}
        Profile(int wireVersion, String name, int age, String email) {
            this.wireVersion = wireVersion;
            this.name = name; this.age = age; this.email = email;
        }
        @Override public void writeExternal(ObjectOutput output) throws java.io.IOException {
            output.writeInt(wireVersion);
            output.writeUTF(name);
            output.writeInt(age);
            if (wireVersion >= 2) {
                output.writeBoolean(email != null);
                if (email != null) output.writeUTF(email);
            }
        }
        @Override public void readExternal(ObjectInput input)
                throws java.io.IOException, ClassNotFoundException {
            int version = input.readInt();
            if (version < 1 || version > 2) throw new InvalidObjectException("unknown version");
            String restoredName = input.readUTF();
            int restoredAge = input.readInt();
            String restoredEmail = null;
            if (version >= 2 && input.readBoolean()) restoredEmail = input.readUTF();
            if (restoredName.isBlank() || restoredAge < 0 || restoredAge > 150) {
                throw new InvalidObjectException("invalid profile");
            }
            wireVersion = version; name = restoredName; age = restoredAge; email = restoredEmail;
        }
        String view() { return name + "," + age + "," + (email == null ? "none" : email); }
    }
    static byte[] encode(Profile profile) throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(profile);
            return sink.toByteArray();
        }
    }
    static Profile decode(byte[] bytes) throws Exception {
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            return (Profile) input.readObject();
        }
    }
    public static void main(String[] args) throws Exception {
        System.out.println("v1=" + decode(encode(new Profile(1, "Ada", 37, null))).view());
        System.out.println("v2=" + decode(encode(new Profile(2, "Lin", 29, "lin@example.test"))).view());
        boolean rejected = false;
        try {
            decode(encode(new Profile(3, "Future", 40, null)));
        } catch (InvalidObjectException expected) {
            rejected = true;
        }
        System.out.println("unknownRejected=" + rejected);
    }
}`,
    walkthrough: [
      { lines: "1-8", explanation: "Externalizable/object streams와 typed invalid version failure를 import합니다." },
      { lines: "11-21", explanation: "explicit UID, persistent fields, transient writer fixture version과 required public no-arg를 정의합니다." },
      { lines: "22-30", explanation: "version→name→age→v2 optional email 순서로 tokens를 씁니다." },
      { lines: "31-45", explanation: "version을 먼저 제한하고 locals를 읽어 validation 뒤 fields에 commit합니다." },
      { lines: "47-57", explanation: "in-memory encode/decode와 stable view helpers를 정의합니다." },
      { lines: "58-68", explanation: "v1/v2 results와 v3 typed rejection을 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "Externalizable v1/v2/v3 fixtures", "-Xlint:all warning0"], command: isolatedJavaRun("VersionedExternalizable.java", "VersionedExternalizable") },
    output: { value: "v1=Ada,37,none\nv2=Lin,29,lin@example.test\nunknownRejected=true", explanation: ["v1 missing email은 explicit none입니다.", "v2 optional email이 복원됩니다.", "v3 layout은 추측하지 않고 거부됩니다."] },
    experiments: [
      { change: "public no-arg를 private으로 바꿉니다.", prediction: "Externalizable instance construction 단계에서 복원이 실패합니다.", result: "reflection convenience가 아니라 public contract임을 확인합니다." },
      { change: "reader가 age를 readUTF로 읽습니다.", prediction: "token type mismatch로 stream corruption/optional-data 계열 failure가 납니다.", result: "writer-reader sequence table을 유지합니다." },
      { change: "name을 field에 넣은 뒤 age validation을 합니다.", prediction: "failure 중 partial object state가 생깁니다.", result: "locals 검증 후 commit합니다." },
    ],
    sourceRefs: ["java-externalizable", "java-object-output-api", "java-object-input-api", "java-invalid-object-exception", "java-object-output-stream", "java-object-input-stream", "java-byte-array-output-stream", "java-byte-array-input-stream", "serialization-arch-spec"],
  }],
  diagnostics: [
    { symptom: "Externalizable read가 InvalidClassException/no valid constructor로 실패한다.", likelyCause: "public no-arg constructor가 없거나 accessible contract가 바뀌었습니다.", checks: ["constructor access와 parameters를 봅니다.", "class version을 확인합니다.", "standalone round-trip을 실행합니다."], fix: "public no-arg를 유지하고 invalid empty object가 readExternal 밖으로 escape하지 않게 캡슐화합니다.", prevention: "reflection constructor test와 released golden read를 둡니다." },
    { symptom: "old file 일부는 읽지만 name/age가 깨지거나 EOF가 난다.", likelyCause: "version 없이 token order/type을 변경했거나 writer/reader version branches가 비대칭입니다.", checks: ["version별 token table을 비교합니다.", "exact writer artifact를 찾습니다.", "read position failure를 기록합니다."], fix: "old layout branch를 복구해 current DTO로 migrate하고 new writes에는 leading version을 둡니다.", prevention: "v1/v2/unknown/truncated golden matrix를 유지합니다." },
  ],
  expertNotes: ["Externalizable exposes a low-level binary protocol inside a class. Treat every method change like a wire-schema change.", "writeUTF uses modified UTF-8 with a 65,535-byte encoded limit; it is not a drop-in general UTF-8 text field."],
};

(session.chapters as DetailedSession["chapters"]).push(externalizableChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-object-output-api", repository: "Java SE 21 API", path: "java.io.ObjectOutput", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectOutput.html", usedFor: ["Externalizable primitive/object write order", "flush/close contract"], evidence: "manual protocol writer interface 근거입니다." },
  { id: "java-object-input-api", repository: "Java SE 21 API", path: "java.io.ObjectInput", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInput.html", usedFor: ["Externalizable primitive/object read order", "EOF contract"], evidence: "manual protocol reader interface 근거입니다." },
);

const filteringChapter: DetailedSession["chapters"][number] = {
  id: "object-input-filter-class-depth-reference-array-limits",
  title: "ObjectInputFilter로 class allowlist와 depth·references·array length·stream bytes를 모두 제한합니다",
  lead: "root type cast 전 graph 구성 과정에서 filter가 호출되도록 stream에 설치하고 UNKNOWN/UNDECIDED의 최종 정책까지 명시합니다.",
  explanations: [
    "ObjectInputFilter는 역직렬화 중 serialClass, arrayLength, depth, references와 streamBytes 정보를 보고 ALLOWED·REJECTED·UNDECIDED를 반환합니다. root read 뒤 instanceof만 검사하는 것보다 이른 gate입니다.",
    "class allowlist만 두면 허용 class로 매우 깊은 graph나 거대한 array를 만들 수 있습니다. depth/reference/array/bytes limits를 함께 사용하고 외부 file size도 stream 생성 전에 제한합니다.",
    "serialClass가 null인 callback은 reference/depth/bytes 정보만 제공할 수 있습니다. null이면 무조건 reject하는 단순 filter는 valid back-reference를 깨뜨릴 수 있어 API contract를 이해합니다.",
    "array type은 component allowlist와 별도로 serialClass가 array Class로 보입니다. primitive byte[]도 length를 먼저 제한하고 필요한 type만 허용합니다.",
    "ALLOWED는 object의 업무 validity나 hook 안전성을 증명하지 않습니다. readObject/readResolve side effect와 gadget chains를 피하고 restored DTO fields를 다시 검증합니다.",
    "REJECTED는 InvalidClassException 형태로 reader에 전달될 수 있습니다. public error는 safe category만 내고 internal telemetry에 limit kind·class category·size bucket을 둡니다.",
    "JEP290은 process-wide pattern/system property와 per-stream filter를 제공했고 JEP415는 context-specific filter factory를 보강했습니다. library가 global config를 임의 교체하지 않게 ownership을 정합니다.",
    "filter가 설정되기 전에 readObject를 호출하거나 일부 path만 filter를 빠뜨리지 않도록 ObjectInputStream construction helper를 중앙화합니다.",
    "예제는 Message+small byte[]만 허용하고 Date class와65byte payload를 각각 class/array gate에서 거부해 두 독립 기준을 검증합니다.",
  ],
  concepts: [
    { term: "deserialization filter", definition: "object graph construction 중 class와 resource metrics를 보고 진행·거부·미결정을 반환하는 policy입니다.", detail: ["per-stream으로 둘 수 있습니다.", "domain validation과 다릅니다."] },
    { term: "resource limit tuple", definition: "depth·references·array length·stream bytes처럼 서로 대체할 수 없는 graph 비용 상한들의 집합입니다.", detail: ["class allowlist와 함께 씁니다.", "input file size도 별도입니다."] },
    { term: "filter factory", definition: "JVM/application context와 requested filter를 조합해 stream별 effective policy를 만드는 mechanism입니다.", detail: ["ownership이 중요합니다.", "global drift를 테스트합니다."] },
  ],
  codeExamples: [{
    id: "java-object-input-filter-limits",
    title: "Message만 허용하고 Date와65byte array를 filter에서 거부합니다",
    language: "java",
    filename: "ObjectInputFilterLimits.java",
    purpose: "class allowlist와 array/resource limit이 서로 다른 공격면을 차단함을 검증합니다.",
    code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidClassException;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.Date;

public class ObjectInputFilterLimits {
    record Message(String text, byte[] data) implements Serializable {
        private static final long serialVersionUID = 1L;
    }
    static byte[] encode(Object value) throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(value);
            return sink.toByteArray();
        }
    }
    static Object decode(byte[] bytes) throws Exception {
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            input.setObjectInputFilter(info -> {
                if (info.depth() > 6 || info.references() > 20
                        || info.streamBytes() > 1_024 || info.arrayLength() > 64) {
                    return ObjectInputFilter.Status.REJECTED;
                }
                Class<?> type = info.serialClass();
                if (type == null) return ObjectInputFilter.Status.UNDECIDED;
                if (type == Message.class || type == byte[].class) {
                    return ObjectInputFilter.Status.ALLOWED;
                }
                return ObjectInputFilter.Status.REJECTED;
            });
            return input.readObject();
        }
    }
    static boolean rejected(Object value) throws Exception {
        try {
            decode(encode(value));
            return false;
        } catch (InvalidClassException expected) {
            return true;
        }
    }
    public static void main(String[] args) throws Exception {
        Message message = (Message) decode(encode(new Message("hello", new byte[4])));
        System.out.println("message=" + message.text() + ":" + message.data().length);
        System.out.println("dateRejected=" + rejected(new Date(0)));
        System.out.println("largeArrayRejected=" + rejected(new Message("large", new byte[65])));
    }
}`,
    walkthrough: [
      { lines: "1-8", explanation: "object streams/filter, typed rejection, Serializable과 unexpected Date를 import합니다." },
      { lines: "11-19", explanation: "explicit UID Message record와 generic encode helper를 정의합니다." },
      { lines: "21-37", explanation: "depth/reference/bytes/array limits와 Message/byte[] allowlist를 read 전에 설치합니다." },
      { lines: "39-46", explanation: "InvalidClassException을 stable boolean으로 바꾸는 negative helper를 정의합니다." },
      { lines: "47-52", explanation: "small Message success, Date class와65byte array rejection을 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "per-stream ObjectInputFilter", "-Xlint:all warning0"], command: isolatedJavaRun("ObjectInputFilterLimits.java", "ObjectInputFilterLimits") },
    output: { value: "message=hello:4\ndateRejected=true\nlargeArrayRejected=true", explanation: ["allowlisted small graph가 복원됩니다.", "Serializable Date도 class policy에서 거부됩니다.", "allowed byte[] type도 length65에서 거부됩니다."] },
    experiments: [
      { change: "arrayLength limit을 제거합니다.", prediction: "Message type allowlist만으로 largeArrayRejected=false가 됩니다.", result: "type와 resource gates를 모두 둡니다." },
      { change: "serialClass null을 REJECTED로 바꿉니다.", prediction: "reference callbacks에 따라 valid graph가 불필요하게 실패할 수 있습니다.", result: "UNDECIDED composition policy를 테스트합니다." },
      { change: "input.setObjectInputFilter를 readObject 뒤로 옮깁니다.", prediction: "첫 graph에는 filter가 적용되지 않습니다.", result: "construction helper에서 read 전에 설치합니다." },
    ],
    sourceRefs: ["java-object-input-filter", "java-object-input-stream", "java-object-output-stream", "java-invalid-class-exception", "java-byte-array-output-stream", "java-byte-array-input-stream", "java-date-api", "jep-290", "jep-415", "oracle-serialization-filtering"],
  }],
  diagnostics: [
    { symptom: "allowlist classes만 읽는데도 heap이 고갈된다.", likelyCause: "허용 type의 huge arrays, deep graph 또는 excessive references에 상한이 없습니다.", checks: ["filter metrics limits를 봅니다.", "outer byte size를 확인합니다.", "rejection telemetry bucket을 봅니다."], fix: "byte pre-limit과 depth/reference/array/streamBytes 상한을 함께 적용합니다.", prevention: "각 limit 바로 아래/위와 combinations를 negative fixtures로 둡니다." },
    { symptom: "filter를 설치했지만 unexpected hook이 이미 실행됐다.", likelyCause: "일부 ObjectInputStream path가 helper를 우회했거나 readObject 후 root cast만 검사했습니다.", checks: ["모든 constructors/call sites를 검색합니다.", "setObjectInputFilter 순서를 봅니다.", "global/factory effective policy를 기록합니다."], fix: "central factory에서 stream 생성 즉시 filter를 설치하고 raw construction을 금지합니다.", prevention: "unexpected controlled hook count0 integration test를 둡니다." },
  ],
  expertNotes: ["Filters are defense in depth, not a reason to accept arbitrary native serialization from untrusted parties.", "Choose limits from legitimate graph measurements plus budgets, then test boundary and compound cases; unexplained UNDECIDED must not silently become allow-all."],
};

(session.chapters as DetailedSession["chapters"]).push(filteringChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-object-input-filter", repository: "Java SE 21 API", path: "java.io.ObjectInputFilter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputFilter.html", usedFor: ["class policy", "depth/references/array/bytes limits", "filter status"], evidence: "per-stream deserialization filtering API 근거입니다." },
  { id: "java-date-api", repository: "Java SE 21 API", path: "java.util.Date", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Date.html", usedFor: ["unexpected Serializable class fixture"], evidence: "allowlist가 Serializable 여부와 다른 policy임을 보여 주는 harmless negative fixture 근거입니다." },
  { id: "jep-290", repository: "OpenJDK", path: "JEP 290 Filter Incoming Serialization Data", publicUrl: "https://openjdk.org/jeps/290", usedFor: ["filter metrics", "process/per-stream filters", "resource limits"], evidence: "serialization filtering 도입 설계 근거입니다." },
  { id: "jep-415", repository: "OpenJDK", path: "JEP 415 Context-Specific Deserialization Filters", publicUrl: "https://openjdk.org/jeps/415", usedFor: ["filter factory", "context composition"], evidence: "context-specific filter factory 근거입니다." },
  { id: "oracle-serialization-filtering", repository: "Oracle Java 21 Guide", path: "Serialization Filtering", publicUrl: "https://docs.oracle.com/en/java/javase/21/core/serialization-filtering1.html", usedFor: ["patterns", "limits", "factory guidance"], evidence: "Java21 filtering configuration과 operational guidance 근거입니다." },
);

const hookSecurityChapter: DetailedSession["chapters"][number] = {
  id: "untrusted-deserialization-hooks-gadgets-isolation",
  title: "root cast보다 먼저 실행되는 readObject·readResolve hooks를 위협 모델링하고 native input을 격리합니다",
  lead: "역직렬화는 단순 bytes→data parse가 아니라 class loading·object allocation·special methods 실행 과정이므로 허용 classpath와 process 권한이 공격 표면입니다.",
  explanations: [
    "ObjectInputStream.readObject는 application이 returned root를 cast/validate하기 전에 graph classes를 resolve하고 instances를 만들며 readObject, readResolve, ObjectInputValidation 등의 hooks를 실행할 수 있습니다.",
    "따라서 read 뒤 instanceof Expected만 검사하는 것은 gadget side effect를 막기에는 늦습니다. root type이 맞아도 nested graph의 다른 class hook이 먼저 실행될 수 있습니다.",
    "gadget은 classpath에 이미 있는 Serializable classes의 method chain이 예상하지 않은 file/network/process/reflection action에 도달하는 경로입니다. 악성 class file을 upload해야만 생기는 문제가 아닙니다.",
    "class allowlist와 resource filter는 중요한 방어지만 허용 class 자체의 unsafe hook, logic bomb와 dependency update를 자동 제거하지 않습니다. 가능한 경우 native serialization input을 신뢰 경계 밖에서 받지 않습니다.",
    "legacy migration이 불가피하면 network 없는 isolated process/container, read-only input, empty writable temp, low OS privileges, CPU/memory/time limits와 minimal classpath를 사용합니다.",
    "filter rejection·class resolution·hook failure messages에 raw path, object content와 secret을 노출하지 않습니다. digest, source id, byte-size bucket와 stable reason code를 기록합니다.",
    "global filter property는 startup에서 잠그고 library code가 완화하지 못하게 합니다. context-specific factory는 endpoint/import job별 stricter filter를 조합합니다.",
    "dependency upgrade는 allowlist/classpath와 gadget surface를 바꾸므로 serialization security regression review를 수행합니다. old archives는 immutable quarantine에 둡니다.",
    "예제의 Hooked.readObject는 안전하게 counter만 증가시킵니다. unfiltered read에서는 root validation 전에1회 호출되고 per-stream filter rejection에서는0회임을 보여 줍니다.",
  ],
  concepts: [
    { term: "deserialization gadget", definition: "공격자가 제어한 object graph가 classpath의 existing methods/hooks를 연결해 의도하지 않은 effect를 내는 구성 요소입니다.", detail: ["dependency classes도 대상입니다.", "root type check만으로 부족합니다."] },
    { term: "hook-before-return", definition: "readObject가 application에 root를 반환하기 전에 class-specific restoration hooks가 실행되는 순서입니다.", detail: ["validation보다 앞설 수 있습니다.", "filter가 earlier gate입니다."] },
    { term: "migration isolation", definition: "legacy decode를 minimal classpath·권한·network·resource limit이 있는 별도 process에 가두는 운영 경계입니다.", detail: ["one-way DTO output을 만듭니다.", "raw graph를 밖으로 내보내지 않습니다."] },
  ],
  codeExamples: [{
    id: "java-deserialization-hook-order",
    title: "unfiltered hook1회와 filter rejection hook0회를 비교합니다",
    language: "java",
    filename: "DeserializationHookOrder.java",
    purpose: "root cast 이후 검사로 hook side effect를 막을 수 없다는 execution order를 안전한 counter로 검증합니다.",
    code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidClassException;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class DeserializationHookOrder {
    static final class Hooked implements Serializable {
        private static final long serialVersionUID = 1L;
        static int hookCalls;
        private String value = "data";
        private void readObject(ObjectInputStream input)
                throws java.io.IOException, ClassNotFoundException {
            input.defaultReadObject();
            hookCalls++;
        }
    }
    static byte[] bytes() throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(new Hooked());
            return sink.toByteArray();
        }
    }
    public static void main(String[] args) throws Exception {
        byte[] data = bytes();
        Hooked.hookCalls = 0;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(data))) {
            Object root = input.readObject();
            if (!(root instanceof Hooked)) throw new AssertionError("wrong root");
        }
        System.out.println("unfilteredHooks=" + Hooked.hookCalls);
        Hooked.hookCalls = 0;
        boolean rejected = false;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(data))) {
            input.setObjectInputFilter(info -> ObjectInputFilter.Status.REJECTED);
            input.readObject();
        } catch (InvalidClassException expected) {
            rejected = true;
        }
        System.out.println("filteredRejected=" + rejected);
        System.out.println("filteredHooks=" + Hooked.hookCalls);
    }
}`,
    walkthrough: [
      { lines: "1-7", explanation: "object streams, filter/rejection와 Serializable을 import합니다." },
      { lines: "10-18", explanation: "default fields를 읽은 뒤 safe counter를 올리는 controlled hook class를 정의합니다." },
      { lines: "19-25", explanation: "Hooked instance의 deterministic bytes를 생성합니다." },
      { lines: "27-34", explanation: "unfiltered read와 returned-root check 뒤 이미 hook1임을 출력합니다." },
      { lines: "35-46", explanation: "read 전 reject-all filter를 설치해 typed rejection과 hook0을 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "controlled harmless hook", "per-stream rejection", "-Xlint:all warning0"], command: isolatedJavaRun("DeserializationHookOrder.java", "DeserializationHookOrder") },
    output: { value: "unfilteredHooks=1\nfilteredRejected=true\nfilteredHooks=0", explanation: ["unfiltered root가 반환되기 전에 hook이 실행됩니다.", "filter가 class construction을 거부합니다.", "rejected path에서는 controlled hook이 실행되지 않습니다."] },
    experiments: [
      { change: "root instanceof 검사를 제거합니다.", prediction: "unfiltered hook count는 여전히1입니다.", result: "post-read validation과 hook prevention이 별개임을 확인합니다." },
      { change: "filter에서 Hooked를 ALLOWED로 합니다.", prediction: "filteredHooks가1이 됩니다.", result: "allowlisted hooks도 security review 대상입니다." },
      { change: "Hooked 안에 nested Hooked를 둡니다.", prediction: "graph hooks가 여러 번 실행될 수 있습니다.", result: "root 하나가 execution 하나라는 가정을 버립니다." },
    ],
    sourceRefs: ["java-object-input-stream", "java-object-input-filter", "java-invalid-class-exception", "java-object-output-stream", "java-byte-array-output-stream", "java-byte-array-input-stream", "serialization-security-spec", "oracle-secure-coding-guidelines", "owasp-deserialization-cheat-sheet", "jep-290", "jep-415"],
  }],
  diagnostics: [
    { symptom: "root type 검사는 통과/실패했지만 그 전에 unexpected file/network action이 발생했다.", likelyCause: "nested class readObject/readResolve gadget가 readObject return 전에 실행됐습니다.", checks: ["classpath와 hooks를 inventory합니다.", "filter effective policy를 확인합니다.", "isolated reproduction에서 OS events를 봅니다."], fix: "native untrusted input을 중단하고 quarantined minimal-classpath migration만 허용합니다.", prevention: "external protocols에 schema formats를 사용하고 dependency/hook threat review를 둡니다." },
    { symptom: "global filter가 환경마다 다르거나 library update 뒤 완화됐다.", likelyCause: "process property/factory ownership과 composition precedence가 명시되지 않았습니다.", checks: ["startup effective filter를 safe summary로 기록합니다.", "factory install call을 검색합니다.", "endpoint별 tests를 실행합니다."], fix: "application bootstrap이 immutable baseline factory를 소유하고 endpoint filter와 stricter composition을 검증합니다.", prevention: "startup fail-closed와 policy snapshot regression을 둡니다." },
  ],
  expertNotes: ["The counter hook is intentionally harmless. Do not build exploit gadgets to prove the execution-order point.", "Even an excellent filter cannot make native serialization an interoperable or durable public protocol; prefer inert schema parsers and ordinary constructors."],
};

(session.chapters as DetailedSession["chapters"]).push(hookSecurityChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "serialization-security-spec", repository: "Java Object Serialization Specification", path: "A Security in Object Serialization", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/security.html", usedFor: ["untrusted stream threat", "class/hook security"], evidence: "object serialization security considerations 근거입니다." },
  { id: "oracle-secure-coding-guidelines", repository: "Oracle", path: "Secure Coding Guidelines for Java SE", publicUrl: "https://www.oracle.com/java/technologies/javase/seccodeguide.html", usedFor: ["defensive deserialization", "privilege minimization", "untrusted data"], evidence: "Java secure coding의 trust/privilege 근거입니다." },
  { id: "owasp-deserialization-cheat-sheet", repository: "OWASP Cheat Sheet Series", path: "Deserialization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html", usedFor: ["gadget risk", "native format avoidance", "defense in depth"], evidence: "untrusted deserialization 공격과 완화의 실무 근거입니다." },
);

const handleResetChapter: DetailedSession["chapters"][number] = {
  id: "handle-table-reset-writeunshared-mutable-snapshots",
  title: "long-lived ObjectOutputStream의 handle cache, mutable object snapshot과 reset·writeUnshared semantics를 구분합니다",
  lead: "같은 instance를 다시 writeObject해도 현재 field values가 다시 직렬화되지 않을 수 있으며 handle table이 memory와 snapshot freshness에 영향을 줍니다.",
  explanations: [
    "ObjectOutputStream은 stream 시작 이후 이미 쓴 objects를 handle table에 유지합니다. 같은 instance를 다시 writeObject하면 back-reference만 쓰므로 처음 기록한 state가 재사용됩니다.",
    "mutable object value를1로 쓰고2로 바꾼 뒤 같은 stream에 다시 쓰면 reader의 first/second references는 동일 restored instance이며 value1일 수 있습니다. change log처럼 사용하면 stale snapshot입니다.",
    "reset은 current stream의 handle table을 지우고 TC_RESET token을 기록해 reader도 이전 handles를 버리게 합니다. 이후 같은 source instance는 새 object/value로 기록됩니다.",
    "reset은 stream header를 다시 쓰지 않고 underlying destination을 truncate하지 않습니다. active writeObject traversal 중 호출할 수 없고 boundaries를 protocol에 정합니다.",
    "writeUnshared/readUnshared는 해당 root object의 back-reference sharing을 제어하지만 recursively referenced subobjects 전체를 무조건 unshared로 만드는 단순 deep-copy 기능이 아닙니다.",
    "long-lived stream에 계속 새로운 objects를 쓰면 handle table이 references를 보유해 memory가 증가할 수 있습니다. bounded batch마다 close/new stream 또는 documented reset을 사용합니다.",
    "reader와 writer는 reset boundaries를 같은 stream protocol로 자동 처리하지만 application record framing, count, checksum, recovery는 별도로 필요합니다.",
    "동시 thread에서 같은 ObjectOutputStream을 무계획 공유하지 않습니다. logical record serialization, mutation snapshot point와 failure ownership을 하나의 writer task가 소유합니다.",
    "예제는 reset 전 두 writes가 같은 restored Box/value1이고 reset 뒤 세 번째가 별도 restored Box/value2임을 exact identity와 value로 검증합니다.",
  ],
  concepts: [
    { term: "handle cache", definition: "한 object stream 안에서 previously written instances와 handles를 연결해 back-reference를 만드는 table입니다.", detail: ["identity를 보존합니다.", "long-lived memory와 freshness에 영향이 있습니다."] },
    { term: "reset boundary", definition: "writer/reader handle state를 폐기해 이후 graph를 fresh handles로 시작하는 protocol token 위치입니다.", detail: ["header 재작성과 다릅니다.", "batch policy가 필요합니다."] },
    { term: "snapshot point", definition: "mutable object의 fields가 serialization representation에 관찰되는 논리 시점입니다.", detail: ["동시 mutation을 막습니다.", "back-reference가 stale state를 재사용할 수 있습니다."] },
  ],
  codeExamples: [{
    id: "java-object-stream-reset-semantics",
    title: "mutable Box를 reset 전후로 써 identity와 snapshot freshness를 비교합니다",
    language: "java",
    filename: "ObjectStreamResetSemantics.java",
    purpose: "same-stream repeated write가 automatic re-snapshot이 아니라 handle reference임을 검증합니다.",
    code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class ObjectStreamResetSemantics {
    static final class Box implements Serializable {
        private static final long serialVersionUID = 1L;
        int value;
        Box(int value) { this.value = value; }
    }
    public static void main(String[] args) throws Exception {
        Box box = new Box(1);
        byte[] bytes;
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(box);
            box.value = 2;
            output.writeObject(box);
            output.reset();
            output.writeObject(box);
            bytes = sink.toByteArray();
        }
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            Box first = (Box) input.readObject();
            Box second = (Box) input.readObject();
            Box afterReset = (Box) input.readObject();
            System.out.println("beforeResetSame=" + (first == second));
            System.out.println("beforeResetValues=" + first.value + "," + second.value);
            System.out.println("afterResetSame=" + (second == afterReset));
            System.out.println("afterResetValue=" + afterReset.value);
        }
    }
}`,
    walkthrough: [
      { lines: "1-5", explanation: "object streams와 Serializable을 import합니다." },
      { lines: "8-12", explanation: "mutable value와 explicit UID를 가진 Box를 정의합니다." },
      { lines: "14-24", explanation: "value1 write, mutation, back-reference write, reset과 fresh value2 write를 수행합니다." },
      { lines: "25-34", explanation: "three roots를 읽어 reset 전후 identity와 values를 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "single in-memory stream", "-Xlint:all warning0"], command: isolatedJavaRun("ObjectStreamResetSemantics.java", "ObjectStreamResetSemantics") },
    output: { value: "beforeResetSame=true\nbeforeResetValues=1,1\nafterResetSame=false\nafterResetValue=2", explanation: ["second write는 first handle을 참조합니다.", "mutation2는 reset 뒤 fresh graph에만 기록됩니다.", "reader도 reset 뒤 별도 instance를 만듭니다."] },
    experiments: [
      { change: "output.reset()을 제거합니다.", prediction: "세 references가 모두 같고 value1입니다.", result: "repeated write가 update record가 아님을 확인합니다." },
      { change: "second write에 새 Box(2)를 전달합니다.", prediction: "reset 없이도 distinct object와 value2가 기록됩니다.", result: "source identity가 handle lookup key임을 확인합니다." },
      { change: "writeUnshared/readUnshared를 root에 사용합니다.", prediction: "root sharing은 달라지지만 nested graph rules를 별도 검증해야 합니다.", result: "deep copy로 오해하지 않습니다." },
    ],
    sourceRefs: ["java-object-output-stream", "java-object-input-stream", "java-byte-array-output-stream", "java-byte-array-input-stream", "serialization-output-spec", "serialization-input-spec"],
  }],
  diagnostics: [
    { symptom: "같은 object를 수정해 다시 썼는데 reader가 이전 값만 본다.", likelyCause: "same ObjectOutputStream handle cache가 second write를 back-reference로 기록했습니다.", checks: ["source == identity를 봅니다.", "stream lifetime/reset calls를 확인합니다.", "reader identities를 출력합니다."], fix: "record별 immutable DTO/new instance를 쓰거나 documented batch reset/new stream을 사용합니다.", prevention: "mutable repeated-write exact test와 snapshot ownership을 둡니다." },
    { symptom: "long-running writer memory가 records 수와 함께 증가한다.", likelyCause: "handle table이 previously written object references를 stream lifetime 동안 보유합니다.", checks: ["stream lifetime과 unique object count를 봅니다.", "heap histogram을 확인합니다.", "reset/close boundaries를 찾습니다."], fix: "bounded batches에서 reset하거나 stream을 close/reopen하고 framing을 설계합니다.", prevention: "heap budget·batch size·soak test와 handle policy를 문서화합니다." },
  ],
  expertNotes: ["reset changes aliasing across the boundary, so it is a semantic decision as well as a memory optimization.", "Object streams are not update logs. If state changes are records, define an explicit event schema with IDs, versions and ordering."],
};

(session.chapters as DetailedSession["chapters"]).push(handleResetChapter);

const streamFramingChapter: DetailedSession["chapters"][number] = {
  id: "stream-header-framing-append-truncation-atomic-publish",
  title: "stream header·record framing·append trap·truncation을 구분하고 close·verify 뒤 atomic publish합니다",
  lead: "ObjectOutputStream constructor가 쓰는 header와 application record 경계를 혼동하면 단순 file append가 중간 header로 stream을 깨뜨립니다.",
  explanations: [
    "새 ObjectOutputStream은 stream magic/version header를 즉시 씁니다. 두 독립 stream bytes를 단순 연결하면 첫 root 뒤에 두 번째 AC ED header가 object token 위치에 나타납니다.",
    "한 stream에 여러 roots를 쓰려면 같은 ObjectOutputStream을 유지하고 reader도 같은 order/count/schema로 읽습니다. EOF를 정상 record delimiter로만 쓰면 truncated file과 clean end를 구분하기 어렵습니다.",
    "append mode FileOutputStream 위에 매번 새 ObjectOutputStream을 만들면 중간 header가 생깁니다. header suppress subclass 예제가 널리 보이지만 concurrency·crash·version·handle boundaries까지 해결하지 않습니다.",
    "운영 record format에는 magic, container version, record count 또는 length framing, per-record type/version, optional checksum과 final commit marker를 명시합니다.",
    "partial header, descriptor, block data와 last record truncation은 EOFException, StreamCorruptedException, OptionalDataException 등 위치에 따라 다른 failure가 될 수 있습니다. broad corruption category와 internal cause를 분리합니다.",
    "writer는 same-filesystem owned temp에 새 complete stream을 쓰고 가장 바깥 ObjectOutputStream을 close해 bytes를 확정합니다. 그 뒤 다시 열어 filter·count·root type·digest를 검증합니다.",
    "검증이 끝난 temp만 ATOMIC_MOVE로 final에 publish하고 unsupported filesystem 정책을 정합니다. failure에서 existing final을 보존하고 소유한 temp만 정리합니다.",
    "동시에 여러 writer가 같은 final 또는 append stream을 쓰지 않게 lock/single-writer generation을 둡니다. ObjectOutputStream 자체 공유와 file publish coordination을 별도 검토합니다.",
    "예제는 single stream의 A/B를 정상 복원하고 independent streams 두 개를 이어 붙인 중간 header와 마지막 bytes가 잘린 stream을 각각 typed corruption으로 확인합니다.",
  ],
  concepts: [
    { term: "stream header", definition: "ObjectOutputStream이 stream 시작에 기록하는 magic과 protocol version 정보입니다.", detail: ["record header가 아닙니다.", "중간 append header는 invalid token입니다."] },
    { term: "application framing", definition: "여러 logical records의 경계·길이·개수·version·checksum을 application이 정의하는 container 계약입니다.", detail: ["EOF와 구분합니다.", "recovery 기준이 됩니다."] },
    { term: "atomic publish", definition: "complete temp를 close·검증한 뒤 같은 filesystem에서 final name으로 한 번에 전환하는 commit pattern입니다.", detail: ["existing final을 보존합니다.", "capability fallback을 명시합니다."] },
  ],
  codeExamples: [{
    id: "java-object-stream-framing",
    title: "single stream A/B와 concatenated header·truncated tail을 비교합니다",
    language: "java",
    filename: "ObjectStreamFraming.java",
    purpose: "logical roots와 physical stream header, clean completion과 corruption을 deterministic bytes로 구분합니다.",
    code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.StreamCorruptedException;
import java.util.Arrays;

public class ObjectStreamFraming {
    static byte[] encode(String... values) throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            for (String value : values) output.writeObject(value);
            return sink.toByteArray();
        }
    }
    static byte[] concat(byte[] left, byte[] right) {
        byte[] joined = Arrays.copyOf(left, left.length + right.length);
        System.arraycopy(right, 0, joined, left.length, right.length);
        return joined;
    }
    public static void main(String[] args) throws Exception {
        byte[] good = encode("A", "B");
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(good))) {
            System.out.println("singleStream=" + input.readObject() + "," + input.readObject());
        }
        boolean headerRejected = false;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(
                concat(encode("A"), encode("B"))))) {
            input.readObject();
            input.readObject();
        } catch (StreamCorruptedException expected) {
            headerRejected = true;
        }
        boolean truncatedRejected = false;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(
                Arrays.copyOf(good, good.length - 2)))) {
            input.readObject();
            input.readObject();
        } catch (EOFException | StreamCorruptedException expected) {
            truncatedRejected = true;
        }
        System.out.println("concatenatedHeadersRejected=" + headerRejected);
        System.out.println("truncatedRejected=" + truncatedRejected);
        System.out.printf("magic=%02X%02X%n", good[0] & 0xFF, good[1] & 0xFF);
    }
}`,
    walkthrough: [
      { lines: "1-7", explanation: "object streams, EOF/corruption failures와 Arrays를 import합니다." },
      { lines: "10-21", explanation: "한 header에 여러 roots를 쓰는 encoder와 independent bytes concatenation helper를 정의합니다." },
      { lines: "23-27", explanation: "single stream의 A/B roots를 같은 reader에서 정상 복원합니다." },
      { lines: "28-37", explanation: "두 complete streams를 연결해 middle header rejection을 확인합니다." },
      { lines: "35-42", explanation: "last2 bytes를 잘라 EOF/corruption rejection을 확인합니다." },
      { lines: "43-45", explanation: "두 rejection facts와 ACED magic을 exact 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "in-memory complete/concatenated/truncated fixtures", "-Xlint:all warning0"], command: isolatedJavaRun("ObjectStreamFraming.java", "ObjectStreamFraming") },
    output: { value: "singleStream=A,B\nconcatenatedHeadersRejected=true\ntruncatedRejected=true\nmagic=ACED", explanation: ["한 physical stream의 two roots는 정상입니다.", "middle header와 truncated tail은 거부됩니다.", "Java object stream magic first bytes는 ACED입니다."] },
    experiments: [
      { change: "concat 대신 encode(\"A\",\"B\")를 사용합니다.", prediction: "headerRejected=false이고 두 roots를 읽습니다.", result: "one container writer가 framing을 소유합니다." },
      { change: "good에서 마지막 byte만 자릅니다.", prediction: "last record representation에 따라 EOF/corruption failure가 납니다.", result: "모든 truncation offsets를 property matrix로 검사합니다." },
      { change: "FileOutputStream append마다 새 ObjectOutputStream을 만듭니다.", prediction: "file 중간에 ACED header가 반복됩니다.", result: "append log 대신 temp complete publish/container schema를 사용합니다." },
    ],
    sourceRefs: ["java-object-output-stream", "java-object-input-stream", "java-eof-exception", "java-stream-corrupted-exception", "java-byte-array-output-stream", "java-byte-array-input-stream", "java-arrays-api", "serialization-protocol-spec", "java-files-api", "java-standard-copy-option"],
  }],
  diagnostics: [
    { symptom: "첫 object는 읽지만 두 번째에서 invalid type code AC가 난다.", likelyCause: "append 중 새 ObjectOutputStream header ACED가 logical object token 위치에 들어갔습니다.", checks: ["file hex에서 ACED occurrences를 셉니다.", "writer construction 횟수와 append options를 봅니다.", "container framing을 확인합니다."], fix: "complete stream을 한 writer가 만들거나 explicit framed records/schema format으로 migration합니다.", prevention: "append/reopen/crash fixtures와 magic count invariant를 둡니다." },
    { symptom: "crash 뒤 file이 존재하지만 마지막 object read가 EOF/corruption으로 실패한다.", likelyCause: "partial stream을 final path에 직접 쓰고 completion marker/atomic publish가 없습니다.", checks: ["file length/digest와 temp files를 봅니다.", "close 완료 여부를 확인합니다.", "last valid generation을 찾습니다."], fix: "existing final을 유지하고 temp close·readback verify 후 atomic move합니다.", prevention: "write/flush/close/verify/move fault injection과 restart reconciliation을 둡니다." },
  ],
  expertNotes: ["Suppressing headers for append addresses one token-level symptom but does not create a crash-safe, concurrently writable log format.", "Treat native object streams as whole artifacts or rigorously framed containers; do not infer clean completion from file existence."],
};

(session.chapters as DetailedSession["chapters"]).push(streamFramingChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-eof-exception", repository: "Java SE 21 API", path: "java.io.EOFException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/EOFException.html", usedFor: ["truncated stream failure", "clean-vs-partial discussion"], evidence: "unexpected end typed failure 근거입니다." },
  { id: "java-stream-corrupted-exception", repository: "Java SE 21 API", path: "java.io.StreamCorruptedException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/StreamCorruptedException.html", usedFor: ["middle header", "invalid type code", "corruption"], evidence: "object stream control information corruption 근거입니다." },
  { id: "java-arrays-api", repository: "Java SE 21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["controlled concat/truncate fixtures"], evidence: "deterministic bytes copy fixture 근거입니다." },
  { id: "serialization-protocol-spec", repository: "Java Object Serialization Specification", path: "6 Object Serialization Stream Protocol", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/protocol.html", usedFor: ["ACED header", "TC_RESET", "tokens", "block data"], evidence: "physical stream format과 headers/tokens 근거입니다." },
  { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp write", "readback", "move publish"], evidence: "filesystem-safe whole-artifact publish API 근거입니다." },
  { id: "java-standard-copy-option", repository: "Java SE 21 API", path: "java.nio.file.StandardCopyOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/StandardCopyOption.html", usedFor: ["ATOMIC_MOVE", "REPLACE_EXISTING policy"], evidence: "atomic move capability와 replacement option 근거입니다." },
);

const proxyChapter: DetailedSession["chapters"][number] = {
  id: "serialization-proxy-write-replace-read-resolve",
  title: "serialization proxy로 immutable value의 logical state만 기록하고 public invariant constructor로 복원합니다",
  lead: "class의 private representation과 hidden graph를 직접 저장하지 않고 작은 versioned proxy가 writeReplace/readResolve 경계에서 valid object를 다시 만듭니다.",
  explanations: [
    "serialization proxy pattern은 real class의 writeReplace가 logical fields만 가진 private static proxy를 반환하고 proxy.readResolve가 public constructor/factory로 real object를 재구성합니다.",
    "real class의 readObject는 InvalidObjectException을 던져 직접 crafted representation으로 invariant를 우회하는 path를 막습니다. 정상 stream에는 real fields가 아니라 proxy가 들어갑니다.",
    "proxy는 non-static inner가 아니어야 hidden outer reference가 graph에 포함되지 않습니다. callbacks, caches, locks와 services를 durable representation에서 제외합니다.",
    "readResolve는 returned object로 stream handle mapping을 대체할 수 있어 singleton/canonicalization에도 쓰이지만 attacker-controlled key로 unbounded cache를 채우거나 identity를 뜻밖에 합치지 않게 합니다.",
    "writeReplace/readResolve signature와 access는 serialization special method contract에 맞춰야 합니다. behavior test로 stream root class가 proxy이고 restored public class가 real type임을 확인합니다.",
    "proxy 자체에도 explicit UID와 version policy가 필요합니다. field 추가/default, required validation과 old proxy adapter를 release matrix로 관리합니다.",
    "immutable final fields를 reflection으로 직접 고치는 custom readObject보다 constructor가 defensive copy와 ordering/range validation을 다시 수행하도록 만드는 편이 이해하기 쉽습니다.",
    "serialization proxy도 untrusted native input의 gadget/filter 위험을 없애지 않습니다. 자체 durable archive에 대한 maintainability pattern이지 공개 protocol 허가증이 아닙니다.",
    "예제의 Period는 start≤end를 constructor에서 검증하고 proxy만 deserialize합니다. valid 기간은 real Period로 돌아오며 reversed proxy는 InvalidObjectException으로 거부됩니다.",
  ],
  concepts: [
    { term: "serialization proxy", definition: "real object 대신 최소 logical state를 기록하고 readResolve에서 valid real object를 만드는 private static Serializable representation입니다.", detail: ["representation을 격리합니다.", "constructor validation을 재사용합니다."] },
    { term: "writeReplace", definition: "writeObject graph traversal에서 original 대신 다른 replacement object를 기록하게 하는 special method입니다.", detail: ["proxy를 반환합니다.", "graph shape를 바꿉니다."] },
    { term: "readResolve", definition: "deserialized candidate 대신 canonical 또는 reconstructed object를 반환해 references가 그 replacement를 보게 하는 special method입니다.", detail: ["invariant factory를 호출합니다.", "identity side effect를 검토합니다."] },
  ],
  codeExamples: [{
    id: "java-serialization-proxy-period",
    title: "Period를 proxy로 왕복하고 reversed proxy를 typed failure로 거부합니다",
    language: "java",
    filename: "SerializationProxyPeriod.java",
    purpose: "immutable final state를 direct field restoration 대신 validating constructor로 복원합니다.",
    code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidObjectException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.ObjectStreamException;
import java.io.Serializable;
import java.time.LocalDate;

public class SerializationProxyPeriod {
    static final class Period implements Serializable {
        private static final long serialVersionUID = 1L;
        private final LocalDate start;
        private final LocalDate end;
        Period(LocalDate start, LocalDate end) {
            if (start == null || end == null || start.isAfter(end)) {
                throw new IllegalArgumentException("invalid period");
            }
            this.start = start; this.end = end;
        }
        private Object writeReplace() { return new Proxy(start, end); }
        private void readObject(ObjectInputStream input) throws InvalidObjectException {
            throw new InvalidObjectException("proxy required");
        }
        String view() { return start + ".." + end; }
    }
    static final class Proxy implements Serializable {
        private static final long serialVersionUID = 1L;
        private final LocalDate start;
        private final LocalDate end;
        Proxy(LocalDate start, LocalDate end) { this.start = start; this.end = end; }
        private Object readResolve() throws ObjectStreamException {
            try {
                return new Period(start, end);
            } catch (IllegalArgumentException cause) {
                InvalidObjectException failure = new InvalidObjectException("invalid proxy");
                failure.initCause(cause);
                throw failure;
            }
        }
    }
    static byte[] encode(Object value) throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(value);
            return sink.toByteArray();
        }
    }
    static Object decode(byte[] bytes) throws Exception {
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            return input.readObject();
        }
    }
    public static void main(String[] args) throws Exception {
        Period original = new Period(LocalDate.parse("2026-01-01"), LocalDate.parse("2026-01-03"));
        Object restored = decode(encode(original));
        System.out.println("value=" + ((Period) restored).view());
        System.out.println("restoredClass=" + restored.getClass().getSimpleName());
        boolean rejected = false;
        try {
            decode(encode(new Proxy(LocalDate.parse("2026-02-02"), LocalDate.parse("2026-02-01"))));
        } catch (InvalidObjectException expected) {
            rejected = true;
        }
        System.out.println("invalidProxyRejected=" + rejected);
    }
}`,
    walkthrough: [
      { lines: "1-8", explanation: "object streams, proxy exception types, Serializable과 LocalDate를 import합니다." },
      { lines: "11-26", explanation: "validating immutable Period, writeReplace와 direct-read rejection을 정의합니다." },
      { lines: "27-42", explanation: "logical dates만 가진 proxy가 constructor를 호출하고 invalid state를 typed failure로 바꿉니다." },
      { lines: "43-53", explanation: "arbitrary replacement graph를 encode/decode하는 in-memory helpers를 정의합니다." },
      { lines: "54-66", explanation: "valid Period restoration class/value와 reversed proxy rejection을 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "serialization proxy", "LocalDate", "-Xlint:all warning0"], command: isolatedJavaRun("SerializationProxyPeriod.java", "SerializationProxyPeriod") },
    output: { value: "value=2026-01-01..2026-01-03\nrestoredClass=Period\ninvalidProxyRejected=true", explanation: ["logical dates가 same value로 복원됩니다.", "readResolve result는 Proxy가 아닌 Period입니다.", "reversed dates는 constructor invariant에서 거부됩니다."] },
    experiments: [
      { change: "Period.writeReplace를 제거합니다.", prediction: "normal direct stream이 생성되지만 Period.readObject가 복원을 거부합니다.", result: "proxy-only invariant를 behavior test로 지킵니다." },
      { change: "Proxy를 non-static inner로 바꿉니다.", prediction: "hidden enclosing reference가 graph에 추가될 수 있습니다.", result: "durable proxy를 private static nested로 유지합니다." },
      { change: "readResolve가 validation 없이 fields를 반영합니다.", prediction: "reversed proxy가 valid object처럼 나올 수 있습니다.", result: "public constructor/factory를 유일한 invariant source로 둡니다." },
    ],
    sourceRefs: ["java-serializable", "java-object-output-stream", "java-object-input-stream", "java-object-stream-exception", "java-invalid-object-exception", "java-byte-array-output-stream", "java-byte-array-input-stream", "java-local-date", "serialization-output-spec", "serialization-input-spec"],
  }],
  diagnostics: [
    { symptom: "immutable class에 final fields가 있는데 crafted stream이 constructor invariant를 우회한다.", likelyCause: "default direct serialization을 허용하고 constructor만 validation source로 사용했습니다.", checks: ["writeReplace/readObject hooks를 봅니다.", "invalid proxy/direct bytes를 읽습니다.", "restored public invariants를 실행합니다."], fix: "private static serialization proxy와 direct read rejection을 적용하고 constructor로 복원합니다.", prevention: "valid/invalid proxy와 direct representation negative tests를 둡니다." },
    { symptom: "proxy 도입 뒤 archive graph가 예상보다 크거나 outer class failure가 난다.", likelyCause: "proxy를 non-static inner로 만들어 hidden enclosing instance reference가 포함됐습니다.", checks: ["nested modifier와 synthetic fields를 봅니다.", "NotSerializableException type을 확인합니다.", "graph descriptor를 검사합니다."], fix: "proxy를 private static nested 또는 top-level inert DTO로 바꿉니다.", prevention: "proxy field allowlist와 graph topology test를 둡니다." },
  ],
  expertNotes: ["A proxy stabilizes logical representation but still needs explicit version support and negative fixtures.", "readResolve can alter identity globally within the stream; avoid hidden canonicalization unless identity merging is an explicit invariant."],
};

(session.chapters as DetailedSession["chapters"]).push(proxyChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-object-stream-exception", repository: "Java SE 21 API", path: "java.io.ObjectStreamException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectStreamException.html", usedFor: ["readResolve failure signature", "serialization-specific exceptions"], evidence: "proxy replacement typed failure hierarchy 근거입니다." },
  { id: "java-local-date", repository: "Java SE 21 API", path: "java.time.LocalDate", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html", usedFor: ["immutable period state", "ordering invariant"], evidence: "period proxy logical value와 validation 근거입니다." },
);

const schemaMigrationChapter: DetailedSession["chapters"][number] = {
  id: "native-serialization-vs-explicit-schema-migration",
  title: "native class graph 저장과 JSON·CBOR·Protobuf·명시 binary schema를 요구별로 비교하고 one-way migration합니다",
  lead: "Serializable 편의성을 interoperability·장기 보존과 혼동하지 않고 language-neutral schema, validation, canonicalization과 evolution policy를 선택합니다.",
  explanations: [
    "Java native serialization은 class name, descriptor, UID, object handles와 hooks에 결합됩니다. 같은 Java implementation 내부의 short-lived trusted state에는 편리할 수 있지만 공개 API나 장기 archive의 기본 선택은 아닙니다.",
    "JSON은 사람이 읽기 쉽고 web ecosystem이 넓지만 comments가 없고 number interoperability, duplicate object names, ordering/canonicalization과 binary data policy를 schema에서 정해야 합니다.",
    "CBOR은 JSON-like data model의 compact binary encoding과 tags를 제공하지만 decoder limits, duplicate map keys, canonical/deterministic encoding profile과 schema/application validation이 여전히 필요합니다.",
    "Protocol Buffers 같은 IDL format은 numbered fields와 generated types로 evolution rules를 제공하지만 field number 재사용 금지, unknown fields, required semantics와 migration policy를 운영해야 합니다.",
    "자체 binary format을 만들면 magic·version·length·endianness·charset·range·trailing bytes·checksum을 모두 문서화해야 합니다. DataInput/Output calls를 그냥 나열한 것은 충분한 schema가 아닙니다.",
    "encoding choice 전에 요구를 표로 만듭니다: producer/consumer languages, human editing, forward/backward compatibility, payload size, random/stream access, canonical signature, tooling과 retention period입니다.",
    "native archive migration은 old trusted classpath를 일반 application에 계속 두기보다 isolated one-way reader에서 inert version DTO로 읽고 current schema writer로 출력합니다. output을 다시 native로 되돌리지 않습니다.",
    "각 input에는 digest·size·source generation·reader version·result count·error category를 남기되 raw sensitive fields와 local paths는 public report에서 제외합니다.",
    "예제는 같은 Profile의 native ACED header와 명시 LRN1/version/UTF-8-length/score schema를 비교하고 trailing byte를 거부해 explicit complete-consumption contract를 검증합니다.",
  ],
  concepts: [
    { term: "explicit schema", definition: "field names/numbers·types·required/default·limits·version·unknown handling을 implementation class와 독립적으로 정의한 data contract입니다.", detail: ["language-neutral일 수 있습니다.", "validation과 evolution을 포함합니다."] },
    { term: "complete consumption", definition: "한 framed message를 decode한 뒤 예상하지 않은 trailing bytes가 하나도 남지 않아야 한다는 invariant입니다.", detail: ["smuggling/format drift를 찾습니다.", "container framing과 함께 씁니다."] },
    { term: "one-way migration", definition: "legacy representation을 제한된 reader로 한 번 해석해 current schema로 내보내고 새 writes는 legacy format으로 만들지 않는 전환입니다.", detail: ["classpath 수명을 줄입니다.", "idempotent audit가 필요합니다."] },
  ],
  codeExamples: [{
    id: "java-explicit-versioned-schema",
    title: "native ACED와 LRN1 explicit schema를 비교하고 trailing byte를 거부합니다",
    language: "java",
    filename: "ExplicitVersionedSchema.java",
    purpose: "class graph protocol과 application-owned magic/version/length/range contract의 차이를 exact bytes로 확인합니다.",
    code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class ExplicitVersionedSchema {
    static final int MAGIC = 0x4C524E31;
    record Profile(String id, int score) implements Serializable {
        private static final long serialVersionUID = 1L;
    }
    static byte[] nativeBytes(Profile value) throws Exception {
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(sink)) {
            output.writeObject(value);
            return sink.toByteArray();
        }
    }
    static byte[] encode(Profile value) throws Exception {
        byte[] id = value.id().getBytes(StandardCharsets.UTF_8);
        if (id.length > 32 || value.score() < 0 || value.score() > 100) {
            throw new IllegalArgumentException("invalid profile");
        }
        try (ByteArrayOutputStream sink = new ByteArrayOutputStream();
             DataOutputStream output = new DataOutputStream(sink)) {
            output.writeInt(MAGIC);
            output.writeByte(1);
            output.writeByte(id.length);
            output.write(id);
            output.writeInt(value.score());
            return sink.toByteArray();
        }
    }
    static Profile decode(byte[] bytes) throws Exception {
        try (DataInputStream input = new DataInputStream(new ByteArrayInputStream(bytes))) {
            if (input.readInt() != MAGIC || input.readUnsignedByte() != 1) {
                throw new IOException("header");
            }
            int length = input.readUnsignedByte();
            if (length > 32) throw new IOException("length");
            byte[] id = input.readNBytes(length);
            if (id.length != length) throw new IOException("truncated");
            int score = input.readInt();
            if (score < 0 || score > 100 || input.read() != -1) {
                throw new IOException("value or trailing");
            }
            return new Profile(new String(id, StandardCharsets.UTF_8), score);
        }
    }
    public static void main(String[] args) throws Exception {
        Profile profile = new Profile("P-7", 91);
        byte[] nativeData = nativeBytes(profile);
        byte[] schema = encode(profile);
        Profile restored = decode(schema);
        byte[] trailing = Arrays.copyOf(schema, schema.length + 1);
        trailing[trailing.length - 1] = 1;
        boolean trailingRejected = false;
        try {
            decode(trailing);
        } catch (IOException expected) {
            trailingRejected = true;
        }
        System.out.printf("nativeHeader=%02X%02X%n", nativeData[0] & 0xFF, nativeData[1] & 0xFF);
        System.out.println("schemaHeader=" + new String(schema, 0, 4, StandardCharsets.US_ASCII));
        System.out.println("roundTrip=" + restored.id() + ":" + restored.score());
        System.out.println("trailingRejected=" + trailingRejected);
    }
}`,
    walkthrough: [
      { lines: "1-9", explanation: "native/data streams, IOException, charset와 Arrays를 import합니다." },
      { lines: "12-21", explanation: "LRN1 magic, explicit-UID Profile과 comparison native encoder를 정의합니다." },
      { lines: "23-37", explanation: "UTF-8 id/range를 제한하고 magic·version·length·bytes·score 순서로 씁니다." },
      { lines: "38-53", explanation: "header/version/length/truncation/range/trailing을 모두 확인해 Profile을 만듭니다." },
      { lines: "54-66", explanation: "valid schema와 trailing fixture를 만들고 corruption rejection을 확인합니다." },
      { lines: "67-70", explanation: "native ACED, explicit LRN1, round-trip value와 trailing result를 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "native vs explicit in-memory bytes", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("ExplicitVersionedSchema.java", "ExplicitVersionedSchema") },
    output: { value: "nativeHeader=ACED\nschemaHeader=LRN1\nroundTrip=P-7:91\ntrailingRejected=true", explanation: ["native object stream은 ACED로 시작합니다.", "application schema는 human-defined LRN1 magic입니다.", "valid value만 복원하고 trailing smuggling을 거부합니다."] },
    experiments: [
      { change: "id length32를33bytes로 바꿉니다.", prediction: "writer validation에서 IllegalArgumentException이 납니다.", result: "write/read 양쪽 limit을 같은 schema로 생성·검증합니다." },
      { change: "version byte를2로 바꿉니다.", prediction: "current reader가 header failure로 거부합니다.", result: "future version을 추측하지 않습니다." },
      { change: "score를 JSON number로 옮깁니다.", prediction: "범위는 JSON parser가 아니라 schema/application validation에서 다시 검사해야 합니다.", result: "format parse와 domain validity를 분리합니다." },
    ],
    sourceRefs: ["java-object-output-stream", "java-data-output-stream", "java-data-input-stream", "java-standard-charsets", "java-byte-array-output-stream", "java-byte-array-input-stream", "java-arrays-api", "serialization-protocol-spec", "rfc-8259-json", "rfc-8949-cbor", "protobuf-proto3-guide"],
  }],
  diagnostics: [
    { symptom: "다른 언어 consumer가 Java class name/UID 때문에 archive를 읽지 못한다.", likelyCause: "implementation-native object serialization을 interoperable schema로 사용했습니다.", checks: ["consumer languages와 retention을 확인합니다.", "wire bytes/class descriptors를 봅니다.", "schema 문서 존재를 확인합니다."], fix: "versioned language-neutral schema를 정의하고 isolated one-way migration을 수행합니다.", prevention: "format decision record에 interoperability/evolution/tooling acceptance를 둡니다." },
    { symptom: "custom binary parser가 valid record 뒤 extra bytes를 조용히 무시한다.", likelyCause: "length/container 경계와 complete-consumption invariant가 없습니다.", checks: ["decode 후 remaining bytes를 봅니다.", "message/container lengths를 확인합니다.", "trailing fixtures를 실행합니다."], fix: "framed length 안에서 exact fields를 읽고 trailing nonzero bytes를 reject 또는 documented extensions로 parse합니다.", prevention: "truncated/extra/unknown-version/oversize corpus를 유지합니다." },
  ],
  expertNotes: ["The small LRN1 format is educational, not a recommendation to invent a protocol instead of using a mature schema system.", "Canonicalization, signatures and unknown-field preservation are format-profile decisions beyond simple successful parsing."],
};

(session.chapters as DetailedSession["chapters"]).push(schemaMigrationChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-data-output-stream", repository: "Java SE 21 API", path: "java.io.DataOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/DataOutputStream.html", usedFor: ["explicit big-endian primitives", "length-prefixed writer"], evidence: "LRN1 schema writer API 근거입니다." },
  { id: "java-data-input-stream", repository: "Java SE 21 API", path: "java.io.DataInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/DataInputStream.html", usedFor: ["explicit parser", "readNBytes", "trailing check"], evidence: "LRN1 bounded parser API 근거입니다." },
  { id: "java-standard-charsets", repository: "Java SE 21 API", path: "java.nio.charset.StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["explicit UTF-8 id", "US-ASCII magic display"], evidence: "schema charset boundary 근거입니다." },
  { id: "rfc-8259-json", repository: "IETF", path: "RFC 8259 JSON", publicUrl: "https://www.rfc-editor.org/rfc/rfc8259", usedFor: ["JSON data model", "number/string interoperability", "object member guidance"], evidence: "JSON 선택과 제약 비교의 normative 근거입니다." },
  { id: "rfc-8949-cbor", repository: "IETF", path: "RFC 8949 CBOR", publicUrl: "https://www.rfc-editor.org/rfc/rfc8949", usedFor: ["CBOR data model", "deterministic encoding", "limits"], evidence: "compact binary schema option 비교 근거입니다." },
  { id: "protobuf-proto3-guide", repository: "Protocol Buffers", path: "Programming Guide proto3", publicUrl: "https://protobuf.dev/programming-guides/proto3/", usedFor: ["numbered fields", "unknown fields", "schema evolution"], evidence: "IDL/generated schema option과 evolution 비교 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "object graph identity부터 explicit schema migration까지12 chapters로 원본 learning goals를 production-grade compatibility/security/operation 경계까지 확장했습니다.",
  "positive Java examples11은 OpenJDK21 -proc:none -Xlint:all compiler output0와 exact stable stdout을 요구합니다.",
  "native deserialization은 공개 protocol로 권장하지 않고 trusted legacy migration도 filter·limits·minimal privileges·one-way output으로 제한합니다.",
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "ObjectOutputStream은 왜 cycle에서 무한 재귀하지 않나요?", answer: "새 object를 handle table에 먼저 등록하고 다시 만난 reference는 back-reference token으로 기록하기 때문입니다." },
  { question: "equals가 true면 restored references도 같은 instance인가요?", answer: "아닙니다. writer graph에서 동일 instance였을 때 alias identity가 보존되며 equals만 같은 별도 instances는 따로 기록됩니다." },
  { question: "restored root가 original root와 ==일 수 있나요?", answer: "일반 round-trip은 새 graph를 만들므로 다르고 stream 내부 reference topology만 보존됩니다." },
  { question: "root class만 Serializable이면 충분한가요?", answer: "아닙니다. 모든 non-transient reachable runtime objects가 직렬화 가능하거나 replacement되어야 합니다." },
  { question: "private field도 default serialization에 들어가나요?", answer: "네. non-static·non-transient persistent instance field라면 getter/access와 무관하게 포함됩니다." },
  { question: "transient는 secret encryption을 의미하나요?", answer: "아닙니다. 현재 default stream에서 제외할 뿐 old archives, duplicates, logs와 memory를 보호하지 않습니다." },
  { question: "serialPersistentFields는 언제 조심해야 하나요?", answer: "source fields와 hidden wire fields를 분리해 version burden이 커지므로 strong fixtures가 있을 때 제한적으로 사용합니다." },
  { question: "explicit serialVersionUID를 두는 이유는 무엇인가요?", answer: "computed UID가 incidental class/compiler changes로 drift해 accidental incompatibility가 생기는 것을 막기 위해서입니다." },
  { question: "UID가 같으면 모든 class 변경이 compatible한가요?", answer: "아닙니다. UID는 gate 하나일 뿐 field type·hierarchy·semantic invariant와 migration은 별도입니다." },
  { question: "old stream에 새 field가 없으면 어떤 문제가 있나요?", answer: "compatible read에서는 type default가 될 수 있으므로 required/semantic default를 version adapter가 검증해야 합니다." },
  { question: "Serializable class constructor는 read 때 일반 new처럼 실행되나요?", answer: "보통 Serializable class constructor는 우회되고 첫 non-Serializable superclass constructor가 실행되므로 invariant를 read path에서도 검증합니다." },
  { question: "readFields가 defaultReadObject보다 유리한 경우는 언제인가요?", answer: "stream values를 locals로 읽어 cross-field validation 후 object fields에 commit하고 missing/defaulted를 구분할 때입니다." },
  { question: "invalid restored state에는 어떤 exception이 적합한가요?", answer: "InvalidObjectException으로 typed rejection하고 partially initialized object를 publish하지 않습니다." },
  { question: "readObject special method는 아무 signature나 되나요?", answer: "아닙니다. private void readObject(ObjectInputStream)와 허용 throws 계약을 정확히 따라야 합니다." },
  { question: "Externalizable public no-arg를 protected로 줄여도 되나요?", answer: "아닙니다. Externalizable 복원 contract는 public no-arg constructor를 요구합니다." },
  { question: "writeExternal과 readExternal에서 field 이름이 순서를 알려 주나요?", answer: "아닙니다. writer/reader가 exact token type과 order를 직접 대칭으로 유지해야 합니다." },
  { question: "writeUTF는 일반 UTF-8 string field인가요?", answer: "아닙니다. modified UTF-8과 65,535-byte encoded length 제약을 가진 DataOutput protocol입니다." },
  { question: "ObjectInputFilter에서 class allowlist만 있으면 충분한가요?", answer: "아닙니다. depth·references·array length·stream bytes와 outer input size limits가 함께 필요합니다." },
  { question: "filter callback의 serialClass가 null일 수 있나요?", answer: "네. reference/resource 정보만 있는 callback이 가능해 UNDECIDED composition을 설계해야 합니다." },
  { question: "ALLOWED status가 object를 안전하고 valid하다고 증명하나요?", answer: "아닙니다. class/resource gate일 뿐 hooks와 business invariants를 별도로 검증합니다." },
  { question: "JEP415 filter factory는 무엇을 보강했나요?", answer: "process/application context와 stream 요청 filter를 조합하는 context-specific filter factory를 제공합니다." },
  { question: "readObject 후 instanceof 검사로 gadget을 막을 수 있나요?", answer: "아닙니다. nested hooks는 root가 반환되기 전에 실행될 수 있어 너무 늦습니다." },
  { question: "legacy native archive를 꼭 읽어야 하면 무엇을 하나요?", answer: "minimal classpath·권한·network·resource limits를 가진 격리 process에서 filtered one-way schema migration을 수행합니다." },
  { question: "같은 mutable instance를 두 번 writeObject하면 두 snapshots가 생기나요?", answer: "같은 stream에서는 보통 second write가 handle reference라 first snapshot state와 identity를 재사용합니다." },
  { question: "reset은 새 stream header를 쓰나요?", answer: "아닙니다. handle table을 지우는 TC_RESET boundary이며 stream 자체는 계속됩니다." },
  { question: "writeUnshared는 deep copy API인가요?", answer: "아닙니다. root sharing semantics를 바꾸지만 nested subgraph 전체를 자동으로 독립 복제한다고 가정하면 안 됩니다." },
  { question: "append할 때 새 ObjectOutputStream을 만들면 왜 깨지나요?", answer: "constructor가 ACED stream header를 중간 object-token 위치에 다시 쓰기 때문입니다." },
  { question: "EOF를 정상 end marker로만 사용하면 무엇이 문제인가요?", answer: "clean completion과 crash/truncation을 구분하기 어려워 count/length/checksum/commit framing이 필요합니다." },
  { question: "serialization proxy의 핵심 이점은 무엇인가요?", answer: "private representation 대신 logical fields만 저장하고 public validating constructor로 immutable real object를 재구성합니다." },
  { question: "native archive를 공개 API schema로 유지하지 않는 이유는 무엇인가요?", answer: "Java classpath·UID·hooks·handles에 결합되어 interoperability, security와 장기 evolution에 부적합하기 때문입니다." },
);

(session.completionChecklist as string[]).push(
  "object graph와 simple tree를 구분했다.", "shared identity와 value equality를 별도 검증했다.",
  "self-cycle round-trip을 검증했다.", "reachable runtime graph를 inventory했다.",
  "hidden outer/callback references를 검토했다.", "durable identity를 explicit field로 뒀다.",
  "static fields가 stream 대상이 아님을 확인했다.", "transient defaults와 rehydration을 정의했다.",
  "transient를 보안 통제로 오해하지 않았다.", "non-serializable nested object failure를 테스트했다.",
  "explicit serialVersionUID를 선언했다.", "released UID와 compatibility fixtures를 보존했다.",
  "binary compatibility와 semantic compatibility를 분리했다.", "old missing-field default 정책을 명시했다.",
  "class/package rename migration을 설계했다.", "constructor bypass를 behavior로 검증했다.",
  "readObject special signature를 정확히 사용했다.", "GetField locals를 검증 후 commit했다.",
  "partial object escape와 read side effects를 금지했다.", "InvalidObjectException으로 invalid state를 거부했다.",
  "Externalizable public no-arg를 검증했다.", "leading version과 unknown rejection을 구현했다.",
  "writer/reader token type·order를 표로 맞췄다.", "writeUTF modified-UTF/length 제약을 검토했다.",
  "input byte size를 stream 전 제한했다.", "filter class allowlist를 설치했다.",
  "filter depth·references·array·streamBytes limits를 적용했다.", "serialClass null/UNDECIDED composition을 테스트했다.",
  "root cast 이전 hook execution을 위협 모델에 넣었다.", "allowed classes의 hooks도 review했다.",
  "global/context filter ownership을 고정했다.", "legacy reader를 minimal classpath/privilege로 격리했다.",
  "network·filesystem·CPU·memory·time limits를 적용했다.", "raw graph를 application 밖으로 내보내지 않았다.",
  "handle table의 stale snapshot을 테스트했다.", "reset boundary의 alias semantics를 문서화했다.",
  "long-lived stream memory budget을 정했다.", "writeUnshared를 deep copy로 오해하지 않았다.",
  "stream header와 record header를 구분했다.", "append 중복 ACED header를 검사했다.",
  "truncation offsets와 corruption types를 테스트했다.", "count·length·checksum·commit framing을 정의했다.",
  "temp close·readback verify 뒤 publish했다.", "existing final과 owned-temp cleanup을 검증했다.",
  "serialization proxy를 private static으로 뒀다.", "direct real-class read를 거부했다.",
  "readResolve가 validating constructor를 호출했다.", "native→explicit schema one-way migration을 설계했다.",
);
