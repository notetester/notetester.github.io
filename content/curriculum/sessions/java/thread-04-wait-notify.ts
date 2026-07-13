import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["thread-04-wait-notify"],
  slug: "thread-04-wait-notify",
  courseId: "java",
  moduleId: "java-systems",
  order: 38,
  title: "wait·notifyAll 조건 대기와 종료 프로토콜",
  subtitle: "monitor wait set, 조건 predicate, lost notification·spurious wakeup, interruption과 고수준 대안을 결정적 실험으로 익힙니다.",
  level: "전문가",
  estimatedMinutes: 1080,
  coreQuestion: "공유 상태가 원하는 조건이 될 때까지 CPU를 낭비하지 않고 기다리되, 잘못된 깨움·신호 유실·취소·종료에서도 hang과 데이터 손실을 막으려면 어떤 계약이 필요할까요?",
  summary: "원본 class11의 Ex15/16과 Ex19/20 네 파일을 직접 감사합니다. package24·inventory4·relocated4는 JDK21 warning0이고 byte-for-byte SHA-256이 같습니다. 원본 pair는 각각200줄을 끝내지만 wait를 equality if로 한 번만 검사하고 notify 한 대상을 임의 선택하며 종료 state가 없습니다. 같은 원본 Runnable을 participant1명으로 실행하면 Ex15는11줄, Ex19는50줄 뒤 notifier가 없어 user thread가 영구 WAITING이 되므로2초 제한 뒤 process tree를 종료합니다. 이 bounded evidence를 숨기지 않고 보존한 뒤, monitor ownership과 wait의 lock release, while predicate와 spurious wakeup, notifyAll, state-before-signal과 lost notification, bounded buffer·closed state, interruption, 다중 waiter 종료, ReentrantLock Condition, BlockingQueue, ThreadMXBean 진단과 Java21 virtual thread까지 초보~전문가 수준으로 연결합니다.",
  objectives: [
    "wait·notify·notifyAll을 같은 monitor를 소유한 synchronized 영역에서만 호출하는 이유를 설명한다.",
    "wait가 monitor를 release하고 깨어난 뒤 재획득해야 반환한다는 상태 전이를 검증한다.",
    "조건 대기를 if가 아닌 while(predicate false)로 작성해 spurious·wrong wakeup을 안전하게 처리한다.",
    "notify 한 대상의 비결정성과 notifyAll 뒤 predicate 경쟁을 이해한다.",
    "condition state를 먼저 변경한 뒤 signal해 lost notification을 피한다.",
    "bounded buffer에서 not-empty·not-full·closed predicates와 종료 불변식을 구현한다.",
    "wait 중 InterruptedException의 monitor reacquisition·status clearing·전파/복원을 처리한다.",
    "모든 waiters가 terminal state를 관찰하도록 notifyAll과 explicit close를 설계한다.",
    "ReentrantLock Condition의 분리 wait sets와 signalAll, lock ownership을 구현한다.",
    "BlockingQueue로 직접 wait/notify protocol을 대체할 시점과 poison pill 한계를 판단한다.",
    "ThreadMXBean·Thread.State로 WAITING hang을 bounded하게 진단한다.",
    "virtual thread에서도 같은 predicate·interrupt·termination 계약이 필요함을 확인한다.",
  ],
  prerequisites: [
    { title: "경쟁 상태와 synchronized", reason: "wait set은 monitor mutual exclusion과 happens-before 위에 세우는 조건 대기 메커니즘입니다.", sessionSlug: "thread-03-synchronized" },
    { title: "daemon·join·interrupt 협력 취소", reason: "wait 중 interruption과 bounded join·종료 회계를 이해해야 waiter를 안전하게 회수할 수 있습니다.", sessionSlug: "thread-02-daemon-join-interrupt" },
  ],
  keywords: ["Object.wait", "notify", "notifyAll", "wait set", "monitor ownership", "guarded block", "condition predicate", "spurious wakeup", "lost notification", "wrong waiter", "Mesa monitor", "closed state", "bounded buffer", "InterruptedException", "Condition", "ReentrantLock", "BlockingQueue", "poison pill", "ThreadMXBean", "virtual thread"],
  chapters: [],
  lab: {
    title: "종료 가능한 다중 producer·consumer ingestion queue",
    scenario: "여러 producer가 파일 metadata를 넣고 여러 consumer가 변환하지만 overload·배포·사용자 취소·worker 실패 때도 queue와 waiters가 정해진 시간 안에 일관되게 종료되어야 합니다.",
    setup: ["capacity0/1/N, empty/full, producer/consumer0명, spurious signal, wrong waiter, interrupt, close, double-close와 failure fixtures를 준비합니다.", "OPEN·CLOSING·CLOSED·FAILED state와 accepted·completed·requeued 합계 불변식을 정의합니다.", "모든 thread name, task id, monotonic deadline과 safe diagnostic fields를 정합니다."],
    steps: ["모든 wait 조건을 while(!predicate && !terminal) 형태로 작성합니다.", "state와 predicate를 monitor 또는 lock 하나 아래에서 읽고 변경합니다.", "put 뒤 not-empty, take 뒤 not-full, terminal transition 뒤 all waiters를 signal합니다.", "InterruptedException을 받은 계층은 cleanup 뒤 전파하거나 flag를 복원합니다.", "close 뒤 새 put을 거부하고 남은 queue를 drain할지 cancel할지 명시합니다.", "absolute deadline의 remaining budget으로 worker와 coordinator를 기다립니다.", "ThreadMXBean으로 timeout 시 state·lock owner·stack top을 수집합니다.", "미시작·미완료 tasks를 durable queue로 재등록하고 합계를 검증합니다.", "intrinsic monitor, Condition, BlockingQueue 구현을 같은 acceptance matrix로 비교합니다."],
    expectedResult: ["empty/full wait에서 busy spin 없이 진행하고 잘못된 깨움에도 predicate를 재검사합니다.", "participant가 없거나 failure가 나도 terminal signal과 deadline으로 무한 WAITING을 막습니다.", "close 이후 accepted task의 terminal 합계가 보존됩니다.", "interrupt·timeout·lock ownership 진단이 민감 payload 없이 재현됩니다."],
    cleanup: ["모든 workers가 TERMINATED인지 확인합니다.", "owned temp queue·fixtures만 제거합니다.", "회수하지 못한 task와 lock owner evidence를 quarantine report에 남깁니다."],
    extensions: ["Condition의 notEmpty/notFull wait sets로 불필요한 wakeups를 측정합니다.", "ArrayBlockingQueue fairness 옵션의 latency 분포를 비교합니다.", "virtual-thread-per-task consumer에서 downstream semaphore를 추가합니다.", "JFR·ThreadMXBean으로 waiting duration과 wakeup storm을 관찰합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "한 칸 mailbox를 while predicate와 notifyAll로 구현하세요.", requirements: ["put은 full 동안 wait합니다.", "take는 empty 동안 wait합니다.", "state 변경 뒤 notifyAll합니다.", "InterruptedException을 전파합니다.", "producer·consumer를 join하고 exact order를 검증합니다."], hints: ["wait는 synchronized 안에서 호출합니다.", "if 대신 while을 씁니다."], expectedOutcome: "warning0이며 lost notification과 spurious wakeup에 안전한 한 칸 handoff가 완성됩니다.", solutionOutline: ["empty/full을 하나의 nullable state 또는 explicit boolean으로 표현합니다."] },
    { difficulty: "응용", prompt: "bounded queue에 close·drain·interrupt protocol을 추가하세요.", requirements: ["close는 idempotent입니다.", "close 뒤 put을 거부합니다.", "queue가 비면 take가 terminal 결과를 반환합니다.", "close에서 notifyAll합니다.", "accepted=drained+cancelled 불변식을 검증합니다.", "timeout diagnostic을 남깁니다."], hints: ["poison pill만으로 producer failure를 표현하기 어렵습니다.", "terminal state도 predicate 일부입니다."], expectedOutcome: "consumer 수와 무관하게 hang 없이 종료되는 queue가 완성됩니다.", solutionOutline: ["OPEN/CLOSED와 queue state를 같은 lock 아래에서 전이합니다."] },
    { difficulty: "설계", prompt: "직접 monitor, Condition, BlockingQueue 중 운영 queue 구현을 선택하는 ADR을 작성하세요.", requirements: ["correctness proof와 ownership을 비교합니다.", "다중 condition·fairness·backpressure를 다룹니다.", "interrupt·close·failure·restart를 포함합니다.", "virtual thread와 downstream capacity를 구분합니다.", "metrics·thread dump·alert acceptance를 포함합니다."], hints: ["고수준 primitive가 이미 보장하는 protocol을 다시 구현할 비용을 계산합니다.", "notifyAll wakeup 비용보다 correctness가 먼저입니다."], expectedOutcome: "선택 근거, 위험, migration·rollback과 검증 행렬이 있는 운영 ADR이 완성됩니다.", solutionOutline: ["상태전이 표와 negative fixture부터 작성합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["jdbc-01-connection-resultset"],
  sources: [],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "inventory가 지정한 Ex15/16/19/20 네 파일을 모두 compile·hash·실행했으며 complementary runner 누락은 없습니다.",
      "Ex15/19의 if equality wait와 notify를 의도된 교육 결과로 미화하지 않고, 원본 pair 완료와 participant1 hang을 각각 bounded evidence로 보존합니다.",
      "인접 Ex13/14/17/18은 thread-03의 synchronized 범위이므로 package compile24에만 포함하고 thread-04 source coverage에는 섞지 않습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAuditChapter: DetailedSession["chapters"][number] = {
  id: "class11-inventory4-wait-notify-bounded-audit",
  title: "원본 pair 완료와 participant1 영구 WAITING을 같은 bounded 감사에서 보존합니다",
  lead: "원본 네 파일을 바꾸지 않고 relocated copy에서 정상 two/four-participant 실행과 notifier 부재 hang을 모두 제한 시간 안에 검증합니다.",
  explanations: [
    "Ex15와 Ex19의 run은 synchronized method이므로 this monitor를 소유합니다. wait와 notify는 같은 this monitor를 사용하고, wait 중에는 monitor를 release합니다.",
    "Ex16은 같은 Ex15 instance를 dog·cat·tiger·lion 네 thread가 공유합니다. 각50 iterations로 x1~200을 출력하고 thread별50줄을 남깁니다.",
    "Ex15에서 x==11인 첫 worker는 wait합니다. 다음 worker가 x12에서 notify해 깨우며, notify 대상과 monitor 재획득 순서는 명세상 고정되지 않지만 이 exact participant 구성은 완료합니다.",
    "Ex20은 같은 Ex19 instance를 tiger·lion 두 thread가 공유합니다. 첫 thread1~50, 둘째51~100, 첫째101~150, 둘째151~200의 four blocks를 만듭니다.",
    "두 원본 모두 if로 equality만 한 번 검사합니다. spurious wakeup이나 protocol 확장으로 predicate가 여전히 false여도 진행할 수 있으므로 guarded while contract가 아닙니다.",
    "notify는 wait set에서 임의의 한 thread를 선택합니다. 여러 condition이 같은 monitor wait set을 공유하면 조건이 맞지 않는 waiter를 깨워 progress를 잃을 수 있습니다.",
    "원본에는 participant count, close·cancel·failed terminal state가 없습니다. Ex15 또는 Ex19 Runnable을 한 thread만 실행하면 각각 x11·x50에서 notifier 없이 영구 WAITING입니다.",
    "감사 fixture는 원본 class를 그대로 사용한 SingleEx15Harness·SingleEx19Harness만 추가합니다. 각 child를2초 뒤 process-tree kill하고 stdout11/50줄과 stderr0을 검증합니다.",
    "package24·inventory4·relocated4는 JDK21 -Xlint:all warning0입니다. relocated source는 SHA-256이 원본과 같고 controlled harnesses2를 더한 compile6도 warning0입니다.",
    "baseline과 hostile launcher modes를 비교하며 child에서 네 JAVA launcher option variables를 제거합니다. 원래 parent 값과 부재는 finally에서 정확히 복원합니다.",
    "stdout/stderr는 동시에 drain하고 normal child10초·expected hang2초·kill grace5초를 둡니다. timeout은 실패가 아니라 이 fixture의 bounded expected evidence입니다.",
    "network·사용자 파일·원본 외부 경로를 열지 않으며 GUID temp root가 OS temp direct child일 때 생성 ownership을 얻은 경로만 삭제합니다.",
  ],
  concepts: [
    { term: "wait set", definition: "특정 monitor에서 wait를 호출해 WAITING이 된 threads의 집합입니다.", detail: ["entry set과 다릅니다.", "notify가 한 대상을 임의 선택합니다."] },
    { term: "guarded block defect", definition: "predicate를 while로 재검사하지 않고 if·equality 한 번으로만 wait 여부를 결정하는 결함입니다.", detail: ["spurious wakeup에 취약합니다.", "protocol 변화에 깨집니다."] },
    { term: "bounded hang evidence", definition: "무한 대기를 방치하지 않고 timeout·process-tree termination·partial stdout으로 재현하는 안전한 failure evidence입니다.", detail: ["hang 자체를 숨기지 않습니다.", "test runner를 살려 둡니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-thread04-audit",
    title: "원본4의 warning0·hash·pair outputs와 single-participant hangs를 두 modes에서 검증합니다",
    language: "powershell",
    filename: "verify-original-thread04.ps1",
    purpose: "원본 정상 시나리오와 결함 시나리오를 source 변경 없이 bounded하게 함께 보존합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("thread04 audit "+[Guid]::NewGuid().ToString('N'))
$ownsRoot=$false;$bodyError=$null;$nl=[string][char]10

function Normalize([string]$text){return $text.Replace(([string][char]13+[char]10),[string][char]10)}
function Invoke-Child([string]$file,[string[]]$arguments,[string]$cwd,[int]$timeoutMs){
  $start=[Diagnostics.ProcessStartInfo]::new()
  $start.FileName=$file;$start.WorkingDirectory=$cwd;$start.UseShellExecute=$false
  $start.RedirectStandardInput=$true;$start.RedirectStandardOutput=$true;$start.RedirectStandardError=$true
  $start.StandardOutputEncoding=[Text.UTF8Encoding]::new($false);$start.StandardErrorEncoding=[Text.UTF8Encoding]::new($false)
  foreach($arg in $arguments){[void]$start.ArgumentList.Add($arg)}
  foreach($name in $optionNames){[void]$start.Environment.Remove($name)}
  $process=[Diagnostics.Process]::new();$process.StartInfo=$start;$timedOut=$false
  try{
    if(-not$process.Start()){throw 'process start failed'}
    $outTask=$process.StandardOutput.ReadToEndAsync();$errTask=$process.StandardError.ReadToEndAsync();$process.StandardInput.Close()
    if(-not$process.WaitForExit($timeoutMs)){
      $timedOut=$true;$process.Kill($true)
      if(-not$process.WaitForExit(5000)){throw 'termination grace exceeded'}
    }
    return @{Exit=$process.ExitCode;TimedOut=$timedOut;Out=(Normalize $outTask.GetAwaiter().GetResult());Err=(Normalize $errTask.GetAwaiter().GetResult())}
  }finally{$process.Dispose()}
}
function Compile([IO.FileInfo[]]$files,[string]$classes){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $args=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
  $result=Invoke-Child 'javac' $args $root 10000
  if($result.TimedOut-or$result.Exit-ne0-or$result.Out.Length-ne0-or$result.Err.Length-ne0){throw 'compile failed or warned'}
}
function Run([string]$classes,[string]$main){
  $result=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,$main) $root 10000
  if($result.TimedOut-or$result.Exit-ne0-or$result.Err.Length-ne0){throw "$main process drift"};return $result.Out
}
function Remove-JavaComments([string]$text){
  return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')
}
function Main-Count([IO.FileInfo[]]$files){
  return @($files|Where-Object{(Remove-JavaComments ([IO.File]::ReadAllText($_.FullName)))-match'public\s+static\s+void\s+main\s*\('}).Count
}
function Assert-Ex16([string]$output){
  $lines=@($output.TrimEnd([char]10).Split([char]10))
  if($lines.Count-ne200){throw 'Ex16 line count drift'}
  $counts=@{dog=0;cat=0;tiger=0;lion=0}
  for($i=0;$i-lt200;$i++){
    if($lines[$i]-notmatch'^(\d+):(dog|cat|tiger|lion)$'-or[int]$Matches[1]-ne($i+1)){throw 'Ex16 sequence drift'}
    $counts[$Matches[2]]++
  }
  if(@($counts.Values|Where-Object{$_-ne50}).Count-ne0){throw 'Ex16 thread count drift'}
}
function Assert-Ex20([string]$output){
  $lines=@($output.TrimEnd([char]10).Split([char]10))
  if($lines.Count-ne200){throw 'Ex20 line count drift'};$names=[Collections.Generic.List[string]]::new()
  for($i=0;$i-lt200;$i++){
    if($lines[$i]-notmatch'^(tiger|lion):(\d+)$'-or[int]$Matches[2]-ne($i+1)){throw 'Ex20 sequence drift'}
    $names.Add($Matches[1])
  }
  $first=$names[0];$other=if($first-ceq'tiger'){'lion'}else{'tiger'}
  for($i=0;$i-lt200;$i++){
    $expected=if(($i-lt50)-or($i-ge100-and$i-lt150)){$first}else{$other}
    if($names[$i]-cne$expected){throw 'Ex20 block alternation drift'}
  }
}
function Assert-Hang([hashtable]$result,[int]$count,[string]$pattern){
  if(-not$result.TimedOut-or$result.Err.Length-ne0){throw 'expected bounded hang drift'}
  $lines=@($result.Out.TrimEnd([char]10).Split([char]10))
  if($lines.Count-ne$count){throw 'hang partial line count drift'}
  for($i=0;$i-lt$count;$i++){if($lines[$i]-cne($pattern.Replace('{n}',[string]($i+1)))){throw 'hang partial output drift'}}
}
function Audit([string]$mode,[string]$class11){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Dthread04.audit=javac';$env:JDK_JAVA_OPTIONS='-Dthread04.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Dthread04.audit=tool';$env:_JAVA_OPTIONS='-Dthread04.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package=@(Get-ChildItem -LiteralPath $class11 -Filter '*.java'|Sort-Object Name)
  $names=@('Ex15_Synchronized.java','Ex16_Main.java','Ex19_synchronized.java','Ex20_Main.java')
  $inventory=@($names|ForEach-Object{Get-Item -LiteralPath (Join-Path $class11 $_)})
  if($package.Count-ne24-or$inventory.Count-ne4-or(Main-Count $package)-ne11-or(Main-Count $inventory)-ne2){throw 'inventory role drift'}
  Compile $package (Join-Path $root ("package-"+$mode));Compile $inventory (Join-Path $root ("inventory-"+$mode))

  $copyDir=Join-Path $root ("source-"+$mode+"\com\java\class11")
  New-Item -ItemType Directory -Path $copyDir -ErrorAction Stop|Out-Null
  foreach($file in $inventory){
    $copy=Join-Path $copyDir $file.Name;[IO.File]::Copy($file.FullName,$copy,$false)
    if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash-cne(Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash){throw 'relocation hash drift'}
  }
  $relocated=@(Get-ChildItem -LiteralPath $copyDir -Filter '*.java'|Sort-Object Name)
  $classes=Join-Path $root ("relocated-"+$mode);Compile $relocated $classes
  Assert-Ex16 (Run $classes 'com.java.class11.Ex16_Main')
  Assert-Ex20 (Run $classes 'com.java.class11.Ex20_Main')

  $h15=@'
package com.java.class11;
public class SingleEx15Harness {
    public static void main(String[] args) {
        new Thread(new Ex15_Synchronized(), "solo").start();
    }
}
'@
  $h19=@'
package com.java.class11;
public class SingleEx19Harness {
    public static void main(String[] args) {
        new Thread(new Ex19_synchronized(), "solo").start();
    }
}
'@
  [IO.File]::WriteAllText((Join-Path $copyDir 'SingleEx15Harness.java'),$h15,[Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText((Join-Path $copyDir 'SingleEx19Harness.java'),$h19,[Text.UTF8Encoding]::new($false))
  $controlled=@(Get-ChildItem -LiteralPath $copyDir -Filter '*.java'|Sort-Object Name)
  $controlledClasses=Join-Path $root ("controlled-"+$mode);Compile $controlled $controlledClasses
  $single15=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$controlledClasses,'com.java.class11.SingleEx15Harness') $root 2000
  $single19=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$controlledClasses,'com.java.class11.SingleEx19Harness') $root 2000
  Assert-Hang $single15 11 '{n}:solo';Assert-Hang $single19 50 'solo:{n}'

  $joined=@($inventory|ForEach-Object{Remove-JavaComments ([IO.File]::ReadAllText($_.FullName))})-join$nl
  $shape=@{
    runnable=([regex]::Matches($joined,'implements\s+Runnable\b')).Count;syncRun=([regex]::Matches($joined,'public\s+synchronized\s+void\s+run')).Count
    wait=([regex]::Matches($joined,'\bwait\s*\(')).Count;notify=([regex]::Matches($joined,'\bnotify\s*\(')).Count
    notifyAll=([regex]::Matches($joined,'\bnotifyAll\s*\(')).Count;start=([regex]::Matches($joined,'\.start\s*\(')).Count
    ifs=([regex]::Matches($joined,'\bif\s*\(')).Count;elses=([regex]::Matches($joined,'\belse\b')).Count
    loops=([regex]::Matches($joined,'\bfor\s*\(')).Count;printStack=([regex]::Matches($joined,'\.printStackTrace\s*\(')).Count
    runtime=([regex]::Matches($joined,'new\s+RuntimeException\s*\(')).Count
  }
  if($shape.runnable-ne2-or$shape.syncRun-ne2-or$shape.wait-ne2-or$shape.notify-ne2-or$shape.notifyAll-ne0-or$shape.start-ne6-or$shape.ifs-ne2-or$shape.elses-ne2-or$shape.loops-ne2-or$shape.printStack-ne1-or$shape.runtime-ne1){throw 'source shape drift'}
  return 'package=24,warnings=0,mains=11|inventory=4,warnings=0,mains=2|relocated=4,warnings=0,hashes=4|controlled=6,warnings=0|pairs=Ex16:200,threads4x50;Ex20:200,blocks4x50|single15=timeout,11lines|single19=timeout,50lines|shapes=Runnable:2|syncRun:2|wait:2|notify:2|notifyAll:0|start:6|ifElse:2,2|for:2|printStack:1|RuntimeWrap:1'
}

try{
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'}
  New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  $source=[IO.Path]::GetFullPath($SourceRoot);$class11=Join-Path $source 'src/com/java/class11'
  $baseline=Audit 'baseline' $class11;$hostile=Audit 'hostile' $class11
  if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline"
  'privacy=network:none|original:read-only|fixture:owned-temp;launcherOptions=4'
}catch{$bodyError=$_.Exception}finally{
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){
    try{
      if($saved[$name].Exists){
        Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop
        $restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue
        if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}
      }else{
        Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue
        if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}
      }
    }catch{$finalErrors.Add($_.Exception)}
  }
  try{
    if($ownsRoot){
      $resolved=[IO.Path]::GetFullPath($root)
      if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe cleanup'}
      if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop}
      if(Test-Path -LiteralPath $resolved){throw 'cleanup failed'}
    }
  }catch{$finalErrors.Add($_.Exception)}
  if($null-ne$bodyError){$finalErrors.Insert(0,$bodyError)}
  if($finalErrors.Count-eq1){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()}
  if($finalErrors.Count-gt1){throw[AggregateException]::new('audit and cleanup failures',$finalErrors.ToArray())}
}`,
    walkthrough: [
      { lines: "1-11", explanation: "launcher variables와 owned temp/error state를 준비합니다." },
      { lines: "13-45", explanation: "동시 stream drain, normal/expected timeout, process-tree kill과 warning0 compile helpers를 정의합니다." },
      { lines: "47-78", explanation: "comments 밖 main roles와 Ex16/Ex20의 숫자·thread counts·50줄 block pattern을 검증합니다." },
      { lines: "80-89", explanation: "expected hang의 timeout·stderr0·partial exact lines를 검증합니다." },
      { lines: "91-112", explanation: "package24·inventory4를 compile하고 source4를 hash-equal relocation해 normal pairs를 실행합니다." },
      { lines: "114-139", explanation: "single-participant harnesses2를 추가해 controlled6 warning0과2초 hangs11/50줄을 재현합니다." },
      { lines: "141-152", explanation: "if+wait/notify·notifyAll0과 exception handling source shape를 고정합니다." },
      { lines: "155-169", explanation: "두 launcher modes를 비교하고 환경 복원·direct-child cleanup failures를 보존합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "약 10초: expected hangs4회 포함", "network 없음", "owned temp only"], command: "pwsh -NoProfile -File verify-original-thread04.ps1 -SourceRoot <classstudy-root>" },
    output: {
      value: "spacePath=True,modes=2|same=True,package=24,warnings=0,mains=11|inventory=4,warnings=0,mains=2|relocated=4,warnings=0,hashes=4|controlled=6,warnings=0|pairs=Ex16:200,threads4x50;Ex20:200,blocks4x50|single15=timeout,11lines|single19=timeout,50lines|shapes=Runnable:2|syncRun:2|wait:2|notify:2|notifyAll:0|start:6|ifElse:2,2|for:2|printStack:1|RuntimeWrap:1\nprivacy=network:none|original:read-only|fixture:owned-temp;launcherOptions=4",
      explanation: ["원본 pair는 현재 participant 구성에서 완료합니다.", "동일 Runnable 한 명은 notifier가 없어 영구 WAITING이므로 bounded kill합니다.", "원본은 while predicate·notifyAll·terminal state가 없습니다.", "원본 source와 외부 자원은 변경하지 않습니다."],
    },
    experiments: [
      { change: "Ex19의 participant를1명으로 줄입니다.", prediction: "x50에서 notify할 peer가 없어 영구 WAITING입니다.", result: "participant assumption을 protocol에 숨기지 말고 close·predicate를 둡니다." },
      { change: "wait의 if를 while(predicate false)로 바꿉니다.", prediction: "spurious·wrong wakeup 뒤에도 조건을 재검사해 안전합니다.", result: "guarded block 기본형을 사용합니다." },
      { change: "여러 condition에서 notify 하나를 사용합니다.", prediction: "조건이 맞지 않는 waiter가 선택돼 progress가 멈출 수 있습니다.", result: "notifyAll 또는 분리 Condition wait sets를 사용합니다." },
    ],
    sourceRefs: ["java-class11-ex15", "java-class11-ex16", "java-class11-ex19", "java-class11-ex20", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "java-object-wait", "jls-17-2", "jls-17-4-5"],
  }],
  diagnostics: [
    { symptom: "Ex15를 한 worker로 실행하면11줄 뒤 process가 끝나지 않는다.", likelyCause: "x==11에서 wait한 user thread를 깨울 participant·terminal signal이 없습니다.", checks: ["thread dump에서 WAITING과 lock object를 봅니다.", "active participants를 셉니다.", "close/cancel state를 찾습니다."], fix: "participant 수에 숨은 progress를 제거하고 explicit terminal predicate와 notifyAll을 둡니다.", prevention: "producer0·consumer0·participant1 fixture를 bounded timeout으로 테스트합니다." },
    { symptom: "원본 pair가 현재는 끝나므로 if+notify가 안전하다고 결론 낸다.", likelyCause: "exact scheduler-independent input 한 개를 일반 condition protocol correctness로 확대했습니다.", checks: ["spurious wakeup 재검사 while이 있는지 봅니다.", "다중 condition waiters를 봅니다.", "terminal state와 lost signal fixture를 봅니다."], fix: "state predicate를 monitor 아래 while로 검사하고 state 변경 뒤 notifyAll합니다.", prevention: "정상 출력뿐 아니라 wrong wakeup·signal-before-wait·missing participant를 검증합니다." },
  ],
  expertNotes: [
    "The original programs can terminate under their exact participant assumptions and still be structurally unsafe as reusable condition protocols.",
    "A bounded timeout plus partial deterministic output is stronger evidence for a hang than allowing the curriculum verifier itself to block forever.",
  ],
};

(session.chapters as DetailedSession["chapters"]).push(originalAuditChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class11-ex15", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex15_Synchronized.java", usedFor: ["if wait at x11", "notify else", "participant1 hang"], evidence: "inventory 원본1이며 공개 URL이 확인되지 않아 local provenance만 표시합니다." },
  { id: "java-class11-ex16", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex16_Main.java", usedFor: ["four shared workers", "200-line completion"], evidence: "inventory 원본 runner1입니다." },
  { id: "java-class11-ex19", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex19_synchronized.java", usedFor: ["if wait at50 and100", "notify else", "four-block intent"], evidence: "inventory 원본2이며 공개 URL이 확인되지 않아 local provenance만 표시합니다." },
  { id: "java-class11-ex20", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex20_Main.java", usedFor: ["two shared workers", "200-line block alternation"], evidence: "inventory 원본 runner2입니다." },
  { id: "jdk21-javac", repository: "OpenJDK 21", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["release21", "Xlint all", "compiler evidence"], evidence: "warning0 감사 기준입니다." },
  { id: "powershell-environment", repository: "Microsoft PowerShell", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher option snapshot", "exact restore"], evidence: "hostile parent 환경 격리 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["argument list", "redirected streams", "working directory"], evidence: "safe child launch 근거입니다." },
  { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child launcher option removal"], evidence: "clean child environment 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "process-tree kill", "dispose"], evidence: "bounded hang evidence 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["simultaneous stdout stderr drain"], evidence: "pipe deadlock 방지 근거입니다." },
  { id: "java-object-wait", repository: "Java SE 21 API", path: "java.lang.Object wait/notify/notifyAll", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#wait()", usedFor: ["monitor ownership", "wait set", "spurious wakeup", "notify selection"], evidence: "intrinsic condition API의 공식 계약입니다." },
  { id: "jls-17-2", repository: "Java SE 21 JLS", path: "17.2 Wait Sets and Notification", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.2", usedFor: ["wait actions", "notification", "interruption", "internal actions"], evidence: "wait set state transition 명세입니다." },
  { id: "jls-17-4-5", repository: "Java SE 21 JLS", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["monitor unlock-lock visibility", "state-before-signal"], evidence: "공유 predicate 가시성 근거입니다." },
);

const intrinsicConditionChapters: DetailedSession["chapters"] = [
  {
    id: "monitor-ownership-wait-releases-reacquires",
    title: "monitor를 소유하고 wait하며, release·reacquire 순서를 추적합니다",
    lead: "wait·notify는 thread가 아니라 특정 monitor의 wait set을 조작하므로 같은 object의 monitor를 소유해야 하며, wait는 sleep과 달리 그 monitor를 놓습니다.",
    explanations: [
      "synchronized(lock)에 진입한 thread는 lock monitor를 소유합니다. 그 영역 밖에서 lock.wait(), notify(), notifyAll()을 호출하면 IllegalMonitorStateException입니다.",
      "wait는 현재 thread를 lock의 wait set에 넣고 monitor ownership을 완전히 release합니다. notifier가 synchronized(lock)에 들어갈 수 있는 이유가 바로 이 release입니다.",
      "notifyAll을 호출한 notifier가 monitor를 즉시 양도하는 것은 아닙니다. notifier가 synchronized block을 나가 unlock한 뒤 awakened waiter가 다른 contenders와 경쟁해 monitor를 재획득해야 wait가 반환합니다.",
      "waiter는 재획득 뒤 predicate를 다시 읽습니다. state write와 notify를 같은 monitor 아래에서 수행하면 unlock→lock happens-before로 최신 state가 보입니다.",
      "Thread.sleep은 시간을 기다리지만 보유 monitor를 release하지 않습니다. synchronized 안에서 sleep하며 다른 thread progress를 기대하면 lock convoy 또는 apparent deadlock을 만들 수 있습니다.",
      "예제 trace는 waiter가 await를 기록하고 wait로 lock을 놓은 뒤 notifier가 획득하며, notifier가 state를 바꾸고 나간 후 waiter가 resume하는 partial order를 정확히 증명합니다.",
    ],
    concepts: [
      { term: "monitor ownership", definition: "thread가 synchronized method/block에 진입해 특정 object의 intrinsic lock을 보유한 상태입니다.", detail: ["wait·notify 호출 전제입니다.", "Thread.holdsLock으로 진단할 수 있습니다."] },
      { term: "wait release", definition: "wait 호출이 현재 monitor의 recursion ownership을 놓고 thread를 wait set에 넣는 전이입니다.", detail: ["다른 monitor는 놓지 않습니다.", "sleep과 핵심 차이입니다."] },
      { term: "monitor reacquisition", definition: "notification·interrupt·timeout 뒤 waiter가 wait에서 반환하기 전에 같은 monitor를 다시 얻는 단계입니다.", detail: ["즉시 반환이 아닙니다.", "predicate를 다시 검사합니다."] },
    ],
    codeExamples: [{
      id: "java-monitor-ownership-release",
      title: "소유권 위반과 wait의 monitor release를 한 trace로 확인합니다",
      language: "java",
      filename: "MonitorOwnership.java",
      purpose: "IllegalMonitorStateException과 waiter→notifier→waiter 순서를 deterministic gate로 검증합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;

public class MonitorOwnership {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();
        String outsideWait;
        try {
            lock.wait();
            outsideWait = "unexpected";
        } catch (IllegalMonitorStateException expected) {
            outsideWait = expected.getClass().getSimpleName();
        }

        CountDownLatch entered = new CountDownLatch(1);
        StringBuilder trace = new StringBuilder();
        boolean[] open = {false};
        Thread waiter = new Thread(() -> {
            synchronized (lock) {
                trace.append("waiter-await");
                entered.countDown();
                try {
                    while (!open[0]) {
                        lock.wait();
                    }
                    trace.append(",waiter-resumed");
                } catch (InterruptedException failure) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "waiter");
        Thread notifier = new Thread(() -> {
            try {
                entered.await();
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
                return;
            }
            synchronized (lock) {
                trace.append(",notifier-acquired");
                open[0] = true;
                lock.notifyAll();
            }
        }, "notifier");

        waiter.start();
        notifier.start();
        waiter.join();
        notifier.join();
        System.out.println("outsideWait=" + outsideWait);
        System.out.println("trace=" + trace);
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "monitor 밖 wait가 IllegalMonitorStateException임을 capture합니다." },
        { lines: "14-29", explanation: "waiter가 lock 안에서 predicate false 동안 wait하고 resume trace를 기록합니다." },
        { lines: "30-43", explanation: "notifier는 waiter 진입 뒤 같은 monitor를 획득해 state-before-notifyAll을 수행합니다." },
        { lines: "45-51", explanation: "두 threads를 join해 정확한 monitor partial order를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "network/file 없음"], command: isolatedJavaRun("MonitorOwnership.java", "MonitorOwnership") },
      output: { value: "outsideWait=IllegalMonitorStateException\ntrace=waiter-await,notifier-acquired,waiter-resumed", explanation: ["monitor 밖 wait는 거부됩니다.", "wait가 lock을 놓아 notifier가 진입합니다.", "notifier unlock 뒤 waiter가 재획득해 반환합니다."] },
      experiments: [
        { change: "wait를 Thread.sleep으로 바꿉니다.", prediction: "waiter가 lock을 보유한 채 자므로 notifier가 state를 바꾸지 못합니다.", result: "조건 대기에는 monitor release가 필요합니다." },
        { change: "notifyAll을 synchronized 밖으로 옮깁니다.", prediction: "IllegalMonitorStateException이 납니다.", result: "state와 signal을 같은 ownership 경계에 둡니다." },
        { change: "open write를 notifier block 밖으로 옮깁니다.", prediction: "predicate와 notification의 원자적 protocol이 깨집니다.", result: "state-before-signal을 lock 아래 수행합니다." },
      ],
      sourceRefs: ["java-object-wait", "java-thread-holds-lock", "java-illegal-monitor-state", "java-countdown-latch", "jls-17-2", "jls-17-4-5"],
    }],
    diagnostics: [
      { symptom: "wait 또는 notify에서 IllegalMonitorStateException이 난다.", likelyCause: "호출 대상 object의 monitor를 현재 thread가 소유하지 않습니다.", checks: ["synchronized 대상과 wait 대상이 같은 instance인지 봅니다.", "Thread.holdsLock을 확인합니다.", "wrapper가 lock object를 바꾸는지 봅니다."], fix: "predicate read/write와 wait/signal을 동일 monitor의 synchronized 영역에 둡니다.", prevention: "lock object를 private final로 고정하고 condition protocol을 한 class에 캡슐화합니다." },
      { symptom: "notifier가 synchronized block에 들어가지 못한다.", likelyCause: "waiter가 wait 대신 sleep·blocking I/O를 하며 monitor를 계속 보유합니다.", checks: ["thread dump에서 owner stack을 봅니다.", "synchronized 안 sleep/I/O를 찾습니다.", "critical section 시간을 측정합니다."], fix: "조건 대기는 wait/Condition을 사용하고 느린 작업은 lock 밖으로 이동합니다.", prevention: "lock-held blocking call을 code review·JFR로 감시합니다." },
    ],
    expertNotes: ["Notification moves a waiter out of the wait set, but monitor reacquisition still follows normal lock competition; notification is not a direct handoff."],
  },
  {
    id: "guarded-while-predicate-spurious-wakeup",
    title: "모든 wakeup 뒤 while predicate를 재검사합니다",
    lead: "wait는 조건이 참이라는 메시지를 받는 API가 아니라 다시 조건을 검사할 기회를 받는 API이므로, notification·interrupt·timeout·spurious wakeup 뒤에도 while guard가 필요합니다.",
    explanations: [
      "Object.wait 문서는 spurious wakeup을 허용합니다. notify가 왔어도 그 signal이 현재 waiter의 조건을 위한 것인지, 다른 thread가 먼저 state를 소비했는지 알 수 없습니다.",
      "guarded block의 표준형은 synchronized(lock) 안에서 while(!predicate) lock.wait()입니다. if는 깨운 뒤 predicate를 다시 검사하지 않아 empty queue remove 같은 invariant violation을 만듭니다.",
      "예제는 item을 바꾸지 않은 notifyAll을 의도적으로 한 번 보냅니다. waiter는 깨어나도 item==0을 보고 두 번째 wait에 들어가며, main이 item=7로 state를 바꾼 뒤 보낸 signal에서만 완료합니다.",
      "predicate는 volatile 한 field 하나가 아니라 여러 fields의 관계일 수 있습니다. 그 모든 fields를 같은 monitor 아래 읽고 변경해야 snapshot invariant가 유지됩니다.",
      "while loop는 busy spin이 아닙니다. predicate false이면 다시 wait해 monitor를 놓고 WAITING이 되므로 CPU를 계속 소비하지 않습니다.",
      "wakeups count는 성능 지표일 수 있지만 correctness 기준은 predicate입니다. notifyAll로 여러 waiter가 깨도 조건이 맞는 하나만 진행하고 나머지는 재대기합니다.",
    ],
    concepts: [
      { term: "condition predicate", definition: "thread가 안전하게 진행할 수 있는 공유 상태의 boolean 식입니다.", detail: ["lock 아래 평가합니다.", "terminal state도 포함합니다."] },
      { term: "spurious wakeup", definition: "명시 notification과 일대일 대응하지 않아도 wait가 반환할 수 있는 허용된 현상입니다.", detail: ["while 재검사로 무해하게 만듭니다.", "발생 여부를 추정하지 않습니다."] },
      { term: "guarded block", definition: "lock 획득 후 predicate가 false인 동안 wait하고, 참일 때만 state transition을 수행하는 pattern입니다.", detail: ["if가 아니라 while입니다.", "predicate와 action이 같은 lock 아래 있습니다."] },
    ],
    codeExamples: [{
      id: "java-guarded-while-recheck",
      title: "state 없는 signal을 무시하고 두 번째 signal에서만 진행합니다",
      language: "java",
      filename: "GuardedWhile.java",
      purpose: "while guard가 wrong/spurious-style wakeup을 조건 재검사로 흡수함을 증명합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class GuardedWhile {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();
        int[] item = {0};
        AtomicInteger waits = new AtomicInteger();
        CountDownLatch firstWaiting = new CountDownLatch(1);
        CountDownLatch secondWaiting = new CountDownLatch(1);

        Thread waiter = new Thread(() -> {
            synchronized (lock) {
                try {
                    while (item[0] == 0) {
                        int attempt = waits.incrementAndGet();
                        if (attempt == 1) {
                            firstWaiting.countDown();
                        } else if (attempt == 2) {
                            secondWaiting.countDown();
                        }
                        lock.wait();
                    }
                } catch (InterruptedException failure) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "guarded-waiter");

        waiter.start();
        firstWaiting.await();
        synchronized (lock) {
            lock.notifyAll();
        }
        secondWaiting.await();
        synchronized (lock) {
            item[0] = 7;
            lock.notifyAll();
        }
        waiter.join();
        System.out.println("waitAttempts=" + waits.get());
        System.out.println("item=" + item[0]);
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "predicate state, wait attempt counter와 두 deterministic gates를 준비합니다." },
        { lines: "12-28", explanation: "waiter는 item0 동안 매 wakeup마다 while을 재검사하고 다시 wait합니다." },
        { lines: "30-38", explanation: "첫 signal은 state를 바꾸지 않고, 두 번째 signal만 item7을 먼저 publish합니다." },
        { lines: "39-41", explanation: "정확히 두 wait attempts와 최종 item을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "controlled notifications"], command: isolatedJavaRun("GuardedWhile.java", "GuardedWhile") },
      output: { value: "waitAttempts=2\nitem=7", explanation: ["state 없는 첫 signal 뒤 waiter가 재대기합니다.", "item write 뒤 signal에서 predicate가 참이 되어 완료합니다."] },
      experiments: [
        { change: "while을 if로 바꿉니다.", prediction: "첫 state 없는 notifyAll 뒤 item0인데도 wait를 빠져나옵니다.", result: "모든 wakeup 뒤 predicate 재검사가 필요합니다." },
        { change: "item write를 synchronized 밖으로 옮깁니다.", prediction: "predicate state와 notification의 atomic ordering이 깨집니다.", result: "state와 signal을 같은 lock 아래 둡니다." },
        { change: "while 안에서 wait 대신 빈 loop를 돕니다.", prediction: "CPU를 소비하고 notifier의 monitor 획득도 막습니다.", result: "false predicate에서는 wait로 lock을 놓습니다." },
      ],
      sourceRefs: ["java-object-wait", "java-countdown-latch", "java-atomic-integer", "jls-17-2", "jcip-guarded-blocks"],
    }],
    diagnostics: [
      { symptom: "가끔 empty queue에서 remove가 실패한다.", likelyCause: "if wait 뒤 predicate 재검사 없이 진행해 spurious/wrong wakeup 또는 다른 consumer의 선점에 취약합니다.", checks: ["wait가 while 안인지 봅니다.", "predicate와 remove가 같은 lock 아래인지 봅니다.", "consumer 수를 늘려 재현합니다."], fix: "while(queue.isEmpty() && !closed) wait 형태로 바꿉니다.", prevention: "state 없는 notifyAll과 multi-consumer fixtures를 둡니다." },
      { symptom: "while wait를 busy loop라 생각해 if로 최적화했다.", likelyCause: "wait가 monitor를 놓고 thread를 대기 상태로 바꾼다는 점을 혼동했습니다.", checks: ["CPU profile을 봅니다.", "while body가 wait인지 확인합니다.", "thread state가 WAITING인지 봅니다."], fix: "guarded while을 복원하고 성능은 실제 wakeup count로 측정합니다.", prevention: "pattern과 rationale를 code comment·lint checklist에 남깁니다." },
    ],
    expertNotes: ["The predicate, not the notification, grants permission to proceed. Notification only prompts another predicate evaluation."],
  },
  {
    id: "notifyall-multiple-predicates-wrong-waiter",
    title: "notify 한 대상의 비결정성과 notifyAll 뒤 조건 경쟁을 이해합니다",
    lead: "하나의 monitor wait set에 서로 다른 predicates의 waiters가 섞이면 notify는 조건이 맞지 않는 thread를 고를 수 있으므로, notifyAll+while 또는 분리 Condition이 안전합니다.",
    explanations: [
      "notify는 wait set에서 임의의 thread 하나를 선택합니다. 가장 오래 기다린 thread, 특정 이름, 조건이 참인 thread를 고른다는 FIFO·predicate-aware 보장은 없습니다.",
      "redReady와 blueReady가 같은 monitor를 쓰는 예제에서 red만 true로 만들고 notifyAll합니다. red waiter는 완료하지만 blue waiter는 false를 보고 다시 wait합니다.",
      "notify 하나가 blue를 고르면 red는 condition이 참인데도 계속 기다리고 blue는 다시 wait해 progress가 멈출 수 있습니다. 이를 wrong waiter 또는 missed progress 문제로 볼 수 있습니다.",
      "notifyAll은 모든 waiters를 runnable contender로 만들지만 monitor를 한 번에 하나만 획득합니다. 각 waiter의 while predicate가 correctness를 지키고, 불필요한 wakeups는 그 다음 성능 문제입니다.",
      "waiter 수가 매우 많고 conditions가 명확히 분리된다면 ReentrantLock의 여러 Condition으로 notEmpty·notFull wait sets를 나눠 targeted signalAll을 사용할 수 있습니다.",
      "notification storm을 피하려고 notify로 바꾸기 전에 safety proof가 있어야 합니다. 모든 waiters가 같은 predicate이고 한 state transition이 정확히 한 waiter만 만족시키는지 검증합니다.",
    ],
    concepts: [
      { term: "wrong waiter", definition: "notify가 현재 state로 진행할 수 없는 predicate의 waiter를 선택한 상황입니다.", detail: ["선택은 임의입니다.", "다시 wait하면 다른 eligible waiter가 잠들 수 있습니다."] },
      { term: "notifyAll discipline", definition: "관련 state transition 뒤 모든 waiters를 깨우고 각자 while predicate로 eligibility를 결정하게 하는 안전 우선 pattern입니다.", detail: ["correctness가 단순합니다.", "wakeups 비용을 측정합니다."] },
      { term: "condition partitioning", definition: "서로 다른 predicates를 별도 wait sets로 나눠 필요한 집합만 signal하는 설계입니다.", detail: ["Condition objects를 씁니다.", "lock ownership은 공유할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-notifyall-predicate-selection",
      title: "red signal에서 blue가 재대기하고 각 조건이 순서대로 완료됩니다",
      language: "java",
      filename: "NotifyAllPredicates.java",
      purpose: "모든 waiter를 깨워도 while predicate가 eligible thread만 진행시킴을 검증합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class NotifyAllPredicates {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();
        boolean[] ready = {false, false};
        CountDownLatch waiting = new CountDownLatch(2);
        CountDownLatch blueRewaiting = new CountDownLatch(1);
        AtomicInteger blueWaits = new AtomicInteger();
        List<String> order = new ArrayList<>();

        Thread red = new Thread(() -> awaitColor(
                lock, ready, 0, waiting, null, null, order, "red"), "red-waiter");
        Thread blue = new Thread(() -> awaitColor(
                lock, ready, 1, waiting, blueWaits, blueRewaiting,
                order, "blue"), "blue-waiter");
        red.start();
        blue.start();
        waiting.await();

        synchronized (lock) {
            ready[0] = true;
            lock.notifyAll();
        }
        blueRewaiting.await();
        red.join();
        boolean blueDoneBeforeSignal = !blue.isAlive();
        synchronized (lock) {
            ready[1] = true;
            lock.notifyAll();
        }
        blue.join();

        System.out.println("redDone=" + !red.isAlive());
        System.out.println("blueDoneBeforeSignal=" + blueDoneBeforeSignal);
        System.out.println("order=" + String.join(",", order));
        System.out.println("blueWaits=" + blueWaits.get());
    }

    private static void awaitColor(Object lock, boolean[] ready, int index,
            CountDownLatch waiting, AtomicInteger attempts,
            CountDownLatch rewaiting,
            List<String> order, String color) {
        synchronized (lock) {
            try {
                boolean first = true;
                while (!ready[index]) {
                    if (attempts != null) {
                        int count = attempts.incrementAndGet();
                        if (count == 2 && rewaiting != null) {
                            rewaiting.countDown();
                        }
                    }
                    if (first) {
                        waiting.countDown();
                        first = false;
                    }
                    lock.wait();
                }
                order.add(color);
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        }
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "두 predicates, wait-entry gate, blue attempts와 completion order를 준비합니다." },
        { lines: "14-20", explanation: "red·blue waiters가 같은 monitor의 서로 다른 condition을 기다립니다." },
        { lines: "22-33", explanation: "red state+notifyAll 뒤 red만 join하고, blue state를 나중에 signal합니다." },
        { lines: "35-38", explanation: "eligible completion order와 blue의 두 wait attempts를 출력합니다." },
        { lines: "41-61", explanation: "공통 guarded helper가 predicate false마다 wait하고 notification 뒤 재검사합니다." },
      ],
      run: { environment: ["OpenJDK 21", "two condition waiters", "warning0"], command: isolatedJavaRun("NotifyAllPredicates.java", "NotifyAllPredicates") },
      output: { value: "redDone=true\nblueDoneBeforeSignal=false\norder=red,blue\nblueWaits=2", explanation: ["red signal에서 red만 완료합니다.", "blue는 false predicate라 재대기합니다.", "blue signal 뒤 두 번째로 완료합니다."] },
      experiments: [
        { change: "첫 notifyAll을 notify로 바꿉니다.", prediction: "blue가 선택되면 red가 eligible인데도 둘 다 기다릴 수 있습니다.", result: "다중 predicates에서 임의 단일 선택을 피합니다." },
        { change: "blue의 while을 if로 바꿉니다.", prediction: "red signal에 blue가 잘못 완료될 수 있습니다.", result: "notifyAll과 predicate loop를 한 세트로 씁니다." },
        { change: "red·blue를 별도 Condition으로 나눕니다.", prediction: "각 signal이 관련 wait set만 깨워 불필요 wakeup을 줄입니다.", result: "correctness 검증 뒤 condition partition을 적용합니다." },
      ],
      sourceRefs: ["java-object-wait", "java-countdown-latch", "java-atomic-integer", "java-list", "jls-17-2"],
    }],
    diagnostics: [
      { symptom: "조건이 참인 waiter가 있는데 notify 뒤에도 아무도 진행하지 않는다.", likelyCause: "notify가 다른 predicate waiter를 깨웠고 그 waiter가 다시 wait했습니다.", checks: ["한 monitor에 predicates가 몇 개인지 셉니다.", "notify 사용 위치를 봅니다.", "waiters states와 condition values를 함께 기록합니다."], fix: "notifyAll+while로 바꾸거나 Condition wait sets를 분리합니다.", prevention: "wrong-waiter scheduling fixture와 multi-waiter test를 둡니다." },
      { symptom: "notifyAll 뒤 CPU spike가 보인다.", likelyCause: "많은 waiters가 동시에 깨어 monitor를 경쟁하는 thundering herd입니다.", checks: ["wakeup count와 eligible count를 비교합니다.", "predicate 종류를 분류합니다.", "lock hold time을 측정합니다."], fix: "correctness를 유지한 채 Condition partition·BlockingQueue 같은 고수준 primitive를 검토합니다.", prevention: "안전 proof 없이 notify로 되돌리지 말고 latency·wakeups를 함께 측정합니다." },
    ],
    expertNotes: ["notify is safe only under a proven single-condition protocol where any selected waiter can make progress; thread count alone is not that proof."],
  },
  {
    id: "lost-notification-state-before-signal",
    title: "notification을 event로 저장하지 말고 state-before-signal을 지킵니다",
    lead: "notify는 wait set에 현재 존재하는 waiter에게만 영향을 주고 미래 waiter를 위해 기억되지 않으므로, durable condition state를 먼저 기록해야 합니다.",
    explanations: [
      "waiter가 wait하기 전에 notifier가 notifyAll하면 그 notification은 저장되지 않습니다. 이후 waiter가 state 없이 무조건 wait하면 영원히 잠들 수 있는 lost notification입니다.",
      "올바른 protocol에서 signal은 state change의 보조입니다. notifier는 synchronized 아래 ready=true를 먼저 쓰고 notifyAll하며, 늦게 온 waiter는 while(!ready)를 평가해 wait를 호출하지 않고 바로 진행합니다.",
      "예제 event-only monitor는 waiter 시작 전에 notifyAll하고, waiter는 bounded wait 후에도 진행을 허용할 state가 없음을 확인합니다. 반면 state predicate 쪽은 ready=true가 기억되어 waitCalls0입니다.",
      "notification 횟수를 업무 event count로 쓰지 않습니다. 여러 events를 보존하려면 counter, queue, version 또는 explicit state machine을 monitor 아래 갱신합니다.",
      "state write와 signal을 서로 다른 locks에서 수행하면 waiter의 predicate와 notification이 원자적 관계를 잃습니다. 같은 lock 아래 predicate check→wait와 state update→signal이 맞물려야 합니다.",
      "timeout은 lost notification의 근본 해결이 아닙니다. hang을 bounded failure로 바꾸는 운영 안전망일 뿐이며 state protocol을 바로잡아야 합니다.",
    ],
    concepts: [
      { term: "lost notification", definition: "wait set에 대상이 없을 때 발생한 notify가 미래 waiter에 저장되지 않아 progress signal이 사라지는 현상입니다.", detail: ["notify는 event queue가 아닙니다.", "state predicate로 해결합니다."] },
      { term: "state-before-signal", definition: "같은 lock 아래 durable condition state를 먼저 바꾸고 그 다음 waiters를 알리는 ordering입니다.", detail: ["늦은 waiter도 state를 봅니다.", "signal 자체에 데이터를 싣지 않습니다."] },
      { term: "versioned condition", definition: "일회 boolean 대신 generation·counter로 여러 변화와 missed observations를 표현하는 predicate입니다.", detail: ["event count를 보존합니다.", "overflow·ownership을 정의합니다."] },
    ],
    codeExamples: [{
      id: "java-lost-notification-state",
      title: "먼저 보낸 event-only signal과 먼저 저장한 ready state를 비교합니다",
      language: "java",
      filename: "LostNotificationState.java",
      purpose: "notification은 기억되지 않지만 predicate state는 늦은 waiter에게도 보임을 검증합니다.",
      code: String.raw`import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class LostNotificationState {
    public static void main(String[] args) throws InterruptedException {
        Object eventOnly = new Object();
        synchronized (eventOnly) {
            eventOnly.notifyAll();
        }
        AtomicBoolean eventOnlyState = new AtomicBoolean();
        Thread lateEventWaiter = new Thread(() -> {
            synchronized (eventOnly) {
                try {
                    eventOnly.wait(30);
                    eventOnlyState.set(false);
                } catch (InterruptedException failure) {
                    Thread.currentThread().interrupt();
                }
            }
        });
        lateEventWaiter.start();
        lateEventWaiter.join();

        Object stateLock = new Object();
        boolean[] ready = {false};
        AtomicBoolean progressed = new AtomicBoolean();
        AtomicInteger waitCalls = new AtomicInteger();
        synchronized (stateLock) {
            ready[0] = true;
            stateLock.notifyAll();
        }
        Thread lateStateWaiter = new Thread(() -> {
            synchronized (stateLock) {
                try {
                    while (!ready[0]) {
                        waitCalls.incrementAndGet();
                        stateLock.wait();
                    }
                    progressed.set(true);
                } catch (InterruptedException failure) {
                    Thread.currentThread().interrupt();
                }
            }
        });
        lateStateWaiter.start();
        lateStateWaiter.join();

        System.out.println("eventOnlyState=" + eventOnlyState.get());
        System.out.println("statePredicateProgress=" + progressed.get());
        System.out.println("stateWaitCalls=" + waitCalls.get());
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "waiter가 없을 때 event-only notifyAll을 먼저 보내 저장되지 않게 합니다." },
        { lines: "10-22", explanation: "늦은 waiter는30ms bounded wait 뒤에도 progress state가 없음을 기록합니다." },
        { lines: "24-31", explanation: "두 번째 protocol은 ready state를 같은 monitor 아래 먼저 저장하고 signal합니다." },
        { lines: "32-46", explanation: "늦은 waiter는 while predicate가 이미 true라 wait하지 않고 진행합니다." },
        { lines: "48-50", explanation: "event state 부재와 durable predicate progress·waitCalls0을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "30ms bounded broken case"], command: isolatedJavaRun("LostNotificationState.java", "LostNotificationState") },
      output: { value: "eventOnlyState=false\nstatePredicateProgress=true\nstateWaitCalls=0", explanation: ["event-only notify는 미래 waiter에 저장되지 않습니다.", "ready state는 늦은 waiter도 관찰합니다.", "올바른 waiter는 wait를 호출할 필요가 없습니다."] },
      experiments: [
        { change: "ready write를 notifyAll 뒤로 옮깁니다.", prediction: "waiter timing에 따라 false를 보고 wait해 signal을 놓칠 수 있습니다.", result: "state-before-signal 순서를 고정합니다." },
        { change: "boolean 대신 monotonically increasing generation을 둡니다.", prediction: "여러 changes 중 놓친 횟수를 비교할 수 있습니다.", result: "event semantics가 필요하면 explicit state로 모델링합니다." },
        { change: "broken wait timeout을 무기한으로 바꿉니다.", prediction: "late waiter가 영구 WAITING이 됩니다.", result: "timeout 안전망과 올바른 predicate를 함께 둡니다." },
      ],
      sourceRefs: ["java-object-wait", "java-atomic-boolean", "java-atomic-integer", "jls-17-2", "jls-17-4-5"],
    }],
    diagnostics: [
      { symptom: "가끔 signal을 보냈는데 waiter가 영원히 잔다.", likelyCause: "waiter가 wait set에 들어가기 전에 event-only notify가 발생했고 condition state가 없습니다.", checks: ["signal과 wait timeline을 봅니다.", "durable predicate field/counter가 있는지 봅니다.", "같은 lock을 쓰는지 확인합니다."], fix: "state를 먼저 변경한 뒤 signal하고 waiter는 while predicate를 검사합니다.", prevention: "signal-before-wait fixture를 필수로 둡니다." },
      { symptom: "timeout을 추가했더니 lost notification bug가 해결됐다고 판단한다.", likelyCause: "무한 hang만 bounded false result로 바뀌었고 progress protocol은 여전히 없습니다.", checks: ["timeout 후 업무 state를 봅니다.", "재시도 중복을 확인합니다.", "predicate ownership을 확인합니다."], fix: "명시 state/counter/queue로 event를 보존하고 timeout은 진단·escalation에만 씁니다.", prevention: "정상·late waiter 모두 같은 state transition을 통과하게 테스트합니다." },
    ],
    expertNotes: ["Notifications are ephemeral scheduling hints; application events require durable state under the same synchronization discipline."],
  },
  {
    id: "intrinsic-bounded-buffer-close-drain",
    title: "not-empty·not-full·closed predicates로 종료 가능한 bounded buffer를 만듭니다",
    lead: "실용적인 wait/notify protocol은 단일 flag가 아니라 capacity, queue contents와 terminal state의 관계를 같은 monitor 아래 보존해야 합니다.",
    explanations: [
      "producer의 진행 조건은 queue.size<capacity이고 consumer는 !queue.isEmpty입니다. put 뒤 consumers, take 뒤 producers가 진행할 수 있으므로 state transition 뒤 notifyAll합니다.",
      "capacity는 backpressure입니다. producer가 downstream보다 빠를 때 memory를 무한히 늘리는 대신 full predicate에서 wait해 수락 속도를 제한합니다.",
      "closed는 terminal predicate의 일부입니다. consumer는 empty이면서 open일 때만 wait하고, closed+empty면 null 같은 명시 terminal result를 반환합니다.",
      "close는 same monitor에서 closed=true 후 notifyAll해야 empty waiters와 full waiters 모두 깨어납니다. close 뒤 put은 IllegalStateException으로 거부해 accepted boundary를 명확히 합니다.",
      "예제 capacity1은 producer가 두 번째 put에서 consumer progress를 필요로 하게 합니다. scheduler 순서와 무관하게 FIFO [1,2]를 drain하고 close를 관찰해 둘 다 종료합니다.",
      "직접 구현은 교육적으로 상태 proof를 보여 주지만 실무에서는 BlockingQueue가 이 protocol을 이미 검증해 제공합니다. custom close semantics가 필요할 때도 wrapper로 최소화합니다.",
    ],
    concepts: [
      { term: "backpressure", definition: "bounded capacity가 upstream producer를 기다리게 해 downstream 처리 능력과 수락 속도를 맞추는 제어입니다.", detail: ["OOM을 막습니다.", "timeout·거부 policy를 정합니다."] },
      { term: "terminal predicate", definition: "정상 item 조건뿐 아니라 close·cancel·failed 상태를 포함해 wait를 끝낼 boolean 식입니다.", detail: ["모든 wait loops에 포함합니다.", "terminal transition에서 notifyAll합니다."] },
      { term: "drain on close", definition: "close 뒤 새 put은 막되 이미 queue에 있는 items는 consumer가 모두 처리한 후 terminal을 받는 정책입니다.", detail: ["cancel-immediate와 다릅니다.", "회계 규칙을 명시합니다."] },
    ],
    codeExamples: [{
      id: "java-intrinsic-bounded-buffer",
      title: "capacity1 buffer를 put2·drain·close까지 실행합니다",
      language: "java",
      filename: "IntrinsicBoundedBuffer.java",
      purpose: "not-full/not-empty/closed predicates와 notifyAll 위치를 warning0 exact example로 검증합니다.",
      code: String.raw`import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.atomic.AtomicBoolean;

public class IntrinsicBoundedBuffer {
    private static final class Buffer {
        private final Queue<Integer> queue = new ArrayDeque<>();
        private final int capacity;
        private boolean closed;

        Buffer(int capacity) {
            this.capacity = capacity;
        }

        synchronized void put(int value) throws InterruptedException {
            while (queue.size() == capacity && !closed) {
                wait();
            }
            if (closed) {
                throw new IllegalStateException("closed");
            }
            queue.add(value);
            notifyAll();
        }

        synchronized Integer take() throws InterruptedException {
            while (queue.isEmpty() && !closed) {
                wait();
            }
            if (queue.isEmpty()) {
                return null;
            }
            int value = queue.remove();
            notifyAll();
            return value;
        }

        synchronized void close() {
            closed = true;
            notifyAll();
        }

        synchronized boolean isClosed() {
            return closed;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Buffer buffer = new Buffer(1);
        List<Integer> consumed = new ArrayList<>();
        AtomicBoolean producerDone = new AtomicBoolean();
        Thread producer = new Thread(() -> {
            try {
                buffer.put(1);
                buffer.put(2);
                buffer.close();
                producerDone.set(true);
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        });
        Thread consumer = new Thread(() -> {
            try {
                Integer value;
                while ((value = buffer.take()) != null) {
                    consumed.add(value);
                }
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
        System.out.println("items=" + consumed);
        System.out.println("closed=" + buffer.isClosed());
        System.out.println("producerDone=" + producerDone.get());
    }
}`,
      walkthrough: [
        { lines: "1-15", explanation: "capacity, FIFO queue와 closed state를 private monitor object 안에 캡슐화합니다." },
        { lines: "17-26", explanation: "put은 full+open 동안 wait하고 close를 거부한 뒤 item state를 signal합니다." },
        { lines: "28-39", explanation: "take는 empty+open 동안 wait하고 closed+empty를 terminal null로 반환합니다." },
        { lines: "41-48", explanation: "close는 state를 먼저 바꾸고 모든 waiters를 깨우며 observable state를 제공합니다." },
        { lines: "51-77", explanation: "producer put2/close와 consumer drain을 각각 interruption-safe Runnable로 실행합니다." },
        { lines: "79-83", explanation: "join 뒤 FIFO items, terminal state와 producer 완료를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "capacity1 in-memory buffer", "two workers"], command: isolatedJavaRun("IntrinsicBoundedBuffer.java", "IntrinsicBoundedBuffer") },
      output: { value: "items=[1, 2]\nclosed=true\nproducerDone=true", explanation: ["capacity1 backpressure에도 FIFO 두 items가 drain됩니다.", "close가 empty waiter를 종료시킵니다.", "두 workers가 join됩니다."] },
      experiments: [
        { change: "close의 notifyAll을 제거합니다.", prediction: "empty 상태에서 기다리던 consumer가 closed를 다시 검사하지 못해 hang할 수 있습니다.", result: "terminal transition도 signal합니다." },
        { change: "put의 while을 if로 바꿉니다.", prediction: "여러 producers가 깬 뒤 capacity를 초과할 수 있습니다.", result: "not-full predicate를 매번 재검사합니다." },
        { change: "capacity를 무제한 queue로 바꿉니다.", prediction: "빠른 producer가 memory pressure를 만들 수 있습니다.", result: "resource budget에 맞는 bounded backpressure를 유지합니다." },
      ],
      sourceRefs: ["java-object-wait", "java-array-deque", "java-queue", "java-list", "java-atomic-boolean", "jls-17-4-5"],
    }],
    diagnostics: [
      { symptom: "close를 호출했는데 empty consumer가 종료되지 않는다.", likelyCause: "closed state만 바꾸고 wait set을 notifyAll하지 않았습니다.", checks: ["close lock과 waiter lock이 같은지 봅니다.", "terminal predicate를 확인합니다.", "close signal을 확인합니다."], fix: "same monitor 아래 closed=true 후 notifyAll합니다.", prevention: "empty-waiter-before-close fixture를 둡니다." },
      { symptom: "여러 producer에서 capacity를 초과한다.", likelyCause: "not-full을 if로 한 번만 검사해 notifyAll 뒤 여러 threads가 stale permission으로 진행했습니다.", checks: ["queue.size check가 while인지 봅니다.", "add와 check가 같은 lock인지 봅니다.", "multi-producer stress를 실행합니다."], fix: "while(size==capacity && !closed) wait로 바꿉니다.", prevention: "capacity1·producerN acceptance test를 둡니다." },
    ],
    expertNotes: ["A correct condition protocol is a small state machine: every transition must preserve invariants and identify which predicates may have changed."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...intrinsicConditionChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-thread-holds-lock", repository: "Java SE 21 API", path: "java.lang.Thread.holdsLock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html#holdsLock(java.lang.Object)", usedFor: ["monitor ownership diagnostics"], evidence: "현재 thread의 intrinsic lock ownership 확인 근거입니다." },
  { id: "java-illegal-monitor-state", repository: "Java SE 21 API", path: "java.lang.IllegalMonitorStateException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/IllegalMonitorStateException.html", usedFor: ["wait/notify ownership failure"], evidence: "소유권 위반 typed failure 근거입니다." },
  { id: "java-countdown-latch", repository: "Java SE 21 API", path: "java.util.concurrent.CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["deterministic wait-entry gates"], evidence: "sleep 기반 race 없는 예제 제어 근거입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["wake attempt counters"], evidence: "cross-thread observation counter 근거입니다." },
  { id: "java-atomic-boolean", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicBoolean", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicBoolean.html", usedFor: ["completion and cancellation evidence"], evidence: "cross-thread boolean evidence 근거입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["completion order", "drained items"], evidence: "결과 collection 근거입니다." },
  { id: "java-array-deque", repository: "Java SE 21 API", path: "java.util.ArrayDeque", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html", usedFor: ["intrinsic bounded FIFO storage"], evidence: "null 없는 in-memory deque 근거입니다." },
  { id: "java-queue", repository: "Java SE 21 API", path: "java.util.Queue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Queue.html", usedFor: ["FIFO add/remove contract"], evidence: "buffer collection abstraction 근거입니다." },
  { id: "jcip-guarded-blocks", repository: "Oracle Java Tutorials", path: "Guarded Blocks", publicUrl: "https://docs.oracle.com/javase/tutorial/essential/concurrency/guardmeth.html", usedFor: ["while wait guarded pattern"], evidence: "공식 guarded block 학습 근거입니다." },
);

const cancellationAndAlternativesChapters: DetailedSession["chapters"] = [
  {
    id: "wait-interruption-reacquire-clear-restore",
    title: "wait interruption의 monitor 재획득·flag clear·복원을 처리합니다",
    lead: "wait 중 interrupt를 받으면 즉시 임의 지점에서 탈출하는 것이 아니라 같은 monitor를 다시 획득한 뒤 InterruptedException을 던지며 status는 clear됩니다.",
    explanations: [
      "waiter에 interrupt가 오면 wait set에서 제거되고 monitor 재획득을 경쟁합니다. 재획득 전에는 catch block이 실행되지 않으므로 catch 안에서는 monitor-protected invariant를 정리할 수 있습니다.",
      "InterruptedException을 던질 때 interrupt status는 false로 clear됩니다. 예외 자체가 signal evidence이므로 false를 보고 정상 wakeup이라고 오해하면 안 됩니다.",
      "현재 계층이 취소를 완전히 처리하지 않으면 InterruptedException을 throws로 전파하는 것이 가장 단순합니다. Runnable처럼 불가능한 경계에서는 currentThread().interrupt()로 복원하고 종료합니다.",
      "catch에서 printStackTrace만 하고 while로 돌아가면 cancellation을 삼키고 다시 WAITING이 될 수 있습니다. 원본 Ex15의 pattern을 재사용 가능한 protocol로 확대하면 안 되는 이유입니다.",
      "예제는 waiter가 실제 wait 진입을 준비한 뒤 main이 interrupt합니다. catch에서 caught, Thread.holdsLock(lock), cleared status를 기록하고 복원한 뒤 종료합니다.",
      "interrupt와 notify가 경쟁할 때 어떤 결과가 먼저 보일지 application이 추정하지 말고, predicate·terminal state·exception channel을 모두 처리해야 합니다.",
    ],
    concepts: [
      { term: "interrupted wait", definition: "wait set에 있는 thread가 interrupt request를 받아 monitor를 재획득한 뒤 InterruptedException으로 반환하는 경로입니다.", detail: ["catch에서 monitor를 소유합니다.", "status는 clear됩니다."] },
      { term: "cancellation preservation", definition: "현재 계층이 interruption을 끝까지 처리하지 않을 때 exception 전파 또는 flag 복원으로 상위 owner에게 신호를 유지하는 규칙입니다.", detail: ["log-only catch를 피합니다.", "cause와 state를 보존합니다."] },
      { term: "interrupt-notify race", definition: "같은 waiter에 interruption과 notification이 가까이 발생해 어떤 wake path를 먼저 관찰할지 경쟁하는 상황입니다.", detail: ["명세 계약만 의존합니다.", "predicate를 항상 재검사합니다."] },
    ],
    codeExamples: [{
      id: "java-wait-interruption-contract",
      title: "wait catch가 monitor를 다시 소유하고 clear된 flag를 복원함을 검증합니다",
      language: "java",
      filename: "WaitInterruption.java",
      purpose: "wait interruption의 네 핵심 facts를 deterministic gate로 확인합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

public class WaitInterruption {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();
        CountDownLatch waiting = new CountDownLatch(1);
        AtomicBoolean caught = new AtomicBoolean();
        AtomicBoolean holdsMonitor = new AtomicBoolean();
        AtomicBoolean cleared = new AtomicBoolean();
        AtomicBoolean restored = new AtomicBoolean();

        Thread waiter = new Thread(() -> {
            synchronized (lock) {
                waiting.countDown();
                try {
                    lock.wait();
                } catch (InterruptedException failure) {
                    caught.set(true);
                    holdsMonitor.set(Thread.holdsLock(lock));
                    cleared.set(!Thread.currentThread().isInterrupted());
                    Thread.currentThread().interrupt();
                    restored.set(Thread.currentThread().isInterrupted());
                }
            }
        }, "interruptible-waiter");

        waiter.start();
        waiting.await();
        waiter.interrupt();
        waiter.join();
        System.out.println("caught=" + caught.get());
        System.out.println("holdsMonitor=" + holdsMonitor.get());
        System.out.println("clearedInCatch=" + cleared.get());
        System.out.println("restored=" + restored.get());
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "wait 진입 gate와 catch에서 관찰할 네 thread-safe facts를 준비합니다." },
        { lines: "13-26", explanation: "waiter는 monitor 안에서 wait하고 catch에서 ownership·clear를 본 뒤 status를 복원합니다." },
        { lines: "28-36", explanation: "main이 wait 준비 뒤 interrupt·join하고 네 계약을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single waiter", "controlled interrupt"], command: isolatedJavaRun("WaitInterruption.java", "WaitInterruption") },
      output: { value: "caught=true\nholdsMonitor=true\nclearedInCatch=true\nrestored=true", explanation: ["wait가 InterruptedException을 전달합니다.", "catch 전 monitor를 재획득합니다.", "status는 clear되며 명시적으로 복원됩니다."] },
      experiments: [
        { change: "catch에서 복원을 제거합니다.", prediction: "restored=false이고 상위 status polling이 cancellation을 놓칩니다.", result: "전파할 수 없는 경계는 signal을 복원합니다." },
        { change: "waiter가 monitor를 다시 얻기 전에 notifier가 오래 작업합니다.", prediction: "interrupt가 와도 catch 실행은 notifier unlock 뒤까지 지연됩니다.", result: "lock hold time이 cancellation latency에 포함됩니다." },
        { change: "catch 뒤 while wait로 바로 돌아갑니다.", prediction: "복원 flag 때문에 wait가 다시 즉시 InterruptedException을 던질 수 있습니다.", result: "취소 path는 cleanup 후 종료합니다." },
      ],
      sourceRefs: ["java-object-wait", "java-thread-holds-lock", "java-countdown-latch", "java-atomic-boolean", "jls-17-2", "oracle-interrupts"],
    }],
    diagnostics: [
      { symptom: "wait catch에서 isInterrupted가 false라 취소가 아니라고 처리한다.", likelyCause: "InterruptedException throw가 status를 clear하는 계약을 몰랐습니다.", checks: ["exception type을 봅니다.", "interrupt requester를 추적합니다.", "restore/propagate 여부를 확인합니다."], fix: "예외 자체를 cancellation으로 처리하고 전파 또는 restore 후 종료합니다.", prevention: "caught·holdsLock·cleared·restored 네 facts를 회귀 테스트합니다." },
      { symptom: "interrupt를 보냈지만 waiter catch가 늦게 실행된다.", likelyCause: "waiter가 exception을 던지기 전에 monitor를 재획득해야 하는데 다른 thread가 오래 보유합니다.", checks: ["lock owner stack을 봅니다.", "critical section duration을 측정합니다.", "blocking I/O를 찾습니다."], fix: "lock 안 작업을 최소화하고 느린 작업을 밖으로 옮깁니다.", prevention: "cancellation latency와 max lock hold metric을 둡니다." },
    ],
    expertNotes: ["Interrupting a waiter is still a monitor protocol action: exception delivery is ordered after monitor reacquisition, not an asynchronous escape from synchronization."],
  },
  {
    id: "terminal-state-notifyall-all-waiters",
    title: "explicit terminal state와 notifyAll로 모든 waiters를 종료합니다",
    lead: "정상 업무 predicate가 영원히 참이 되지 않아도 close·cancel·failed terminal state는 모든 wait loops를 끝내야 하며, 한 번의 transition이 모든 waiters에게 알려져야 합니다.",
    explanations: [
      "여러 workers가 empty queue를 기다릴 때 item 하나는 한 worker만 진행시킬 수 있지만 close는 모든 workers의 wait predicate를 바꿉니다. 따라서 terminal transition에서는 notifyAll이 필요합니다.",
      "close는 idempotent해야 shutdown retry나 여러 owners의 경쟁에서 state를 되돌리지 않습니다. 첫 close만 true를 반환하고 이후 호출은 false로 같은 terminal state를 유지합니다.",
      "wait loop는 while(!closed) wait처럼 terminal predicate를 직접 포함합니다. 별도 volatile flag를 lock 밖에서 읽고 wait를 호출하면 check-then-wait 사이 lost signal race가 생깁니다.",
      "예제 세 waiters는 같은 Gate monitor에서 entry를 countDown하고 wait합니다. main은 모두 wait protocol에 들어간 뒤 close를 두 번 호출하며 첫 transition의 notifyAll로 셋 모두 완료합니다.",
      "completed set은 concurrent sorted collection을 사용해 scheduler completion order와 무관한 exact output을 만듭니다. correctness가 thread 이름 순서를 요구하지 않기 때문입니다.",
      "FAILED terminal은 cause도 함께 보존해야 합니다. waiter가 단순 closed와 failed를 구분하도록 sealed result·exception 또는 state enum을 사용합니다.",
    ],
    concepts: [
      { term: "terminal broadcast", definition: "더 이상 정상 predicate를 기다리지 않도록 terminal state를 기록하고 모든 waiters를 깨우는 transition입니다.", detail: ["notifyAll을 사용합니다.", "state가 먼저입니다."] },
      { term: "idempotent close", definition: "여러 번 호출해도 첫 OPEN→CLOSED 전이 이후 state와 side effects가 반복되지 않는 종료 API입니다.", detail: ["retry-safe합니다.", "첫 호출 여부를 반환할 수 있습니다."] },
      { term: "terminal outcome", definition: "normal close, cancellation, failure를 waiter가 구분해 상위 회계에 전달하는 결과입니다.", detail: ["cause를 보존합니다.", "success로 위장하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-terminal-notifyall",
      title: "세 waiters를 idempotent close 한 번으로 모두 깨웁니다",
      language: "java",
      filename: "TerminalBroadcast.java",
      purpose: "terminal state-before-notifyAll과 participant-count 독립 종료를 검증합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListSet;
import java.util.concurrent.CountDownLatch;

public class TerminalBroadcast {
    private static final class Gate {
        private boolean closed;

        synchronized void awaitClose(CountDownLatch entered)
                throws InterruptedException {
            entered.countDown();
            while (!closed) {
                wait();
            }
        }

        synchronized boolean close() {
            if (closed) {
                return false;
            }
            closed = true;
            notifyAll();
            return true;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Gate gate = new Gate();
        CountDownLatch entered = new CountDownLatch(3);
        Set<String> completed = new ConcurrentSkipListSet<>();
        List<Thread> waiters = new ArrayList<>();
        for (int index = 1; index <= 3; index++) {
            String name = "w" + index;
            Thread waiter = new Thread(() -> {
                try {
                    gate.awaitClose(entered);
                    completed.add(name);
                } catch (InterruptedException failure) {
                    Thread.currentThread().interrupt();
                }
            }, name);
            waiters.add(waiter);
            waiter.start();
        }
        entered.await();
        boolean firstClose = gate.close();
        boolean secondClose = gate.close();
        for (Thread waiter : waiters) {
            waiter.join();
        }
        long alive = waiters.stream().filter(Thread::isAlive).count();

        System.out.println("firstClose=" + firstClose);
        System.out.println("secondClose=" + secondClose);
        System.out.println("completed=" + completed);
        System.out.println("alive=" + alive);
    }
}`,
      walkthrough: [
        { lines: "1-16", explanation: "Gate는 closed terminal predicate false 동안 모든 callers를 wait시킵니다." },
        { lines: "18-26", explanation: "close는 첫 전이만 state-before-notifyAll하고 retry에는 false를 반환합니다." },
        { lines: "28-47", explanation: "세 waiters를 만들고 같은 terminal gate에 진입시킵니다." },
        { lines: "48-57", explanation: "close를 두 번 호출한 뒤 모두 join하고 sorted completion·alive0을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "three waiters", "in-memory state"], command: isolatedJavaRun("TerminalBroadcast.java", "TerminalBroadcast") },
      output: { value: "firstClose=true\nsecondClose=false\ncompleted=[w1, w2, w3]\nalive=0", explanation: ["첫 close만 terminal transition을 수행합니다.", "notifyAll로 세 waiters가 모두 종료합니다.", "completion order는 요구하지 않고 membership을 검증합니다."] },
      experiments: [
        { change: "close의 notifyAll을 notify로 바꿉니다.", prediction: "한 waiter만 종료하고 나머지는 closed가 true여도 잠들어 있을 수 있습니다.", result: "global terminal transition은 모든 waiters를 깨웁니다." },
        { change: "closed write를 synchronized 밖에서 합니다.", prediction: "check-then-wait 사이 signal 유실 race가 생깁니다.", result: "predicate와 wait/signal을 같은 lock 아래 둡니다." },
        { change: "FAILED state와 cause를 추가합니다.", prediction: "waiters가 정상 close와 failure를 구분해 terminal 회계할 수 있습니다.", result: "state enum과 immutable cause를 같은 monitor 아래 publish합니다." },
      ],
      sourceRefs: ["java-object-wait", "java-countdown-latch", "java-concurrent-skip-list-set", "java-list", "java-thread", "jls-17-4-5"],
    }],
    diagnostics: [
      { symptom: "close 뒤 일부 workers만 종료하고 나머지가 WAITING이다.", likelyCause: "global terminal transition에서 notify 하나만 호출했습니다.", checks: ["waiter 수와 wait set을 봅니다.", "close가 notifyAll인지 확인합니다.", "각 loop에 terminal predicate가 있는지 봅니다."], fix: "closed를 같은 lock 아래 저장하고 notifyAll합니다.", prevention: "waiter1/N과 double-close fixtures를 둡니다." },
      { symptom: "close와 wait가 경쟁할 때 드물게 hang한다.", likelyCause: "closed check와 wait가 같은 monitor의 원자적 guarded block이 아닙니다.", checks: ["flag가 volatile만인지 봅니다.", "check 후 wait 전 lock gap을 찾습니다.", "signal lock identity를 확인합니다."], fix: "while(!closed) wait를 close state update와 동일 monitor에 둡니다.", prevention: "close-before-wait와 close-during-wait를 반복 검증합니다." },
    ],
    expertNotes: ["Terminal transitions often change every waiter's predicate; targeted single notification is therefore semantically wrong even if normal item delivery uses one-at-a-time progress."],
  },
  {
    id: "reentrantlock-condition-partitioned-waitsets",
    title: "ReentrantLock Condition으로 notEmpty·notFull wait sets를 분리합니다",
    lead: "Condition은 intrinsic wait/notify와 같은 guarded predicate 원칙을 유지하면서 한 Lock에 여러 wait sets, interruptible acquisition과 명시 signal targets를 제공합니다.",
    explanations: [
      "ReentrantLock.newCondition으로 notEmpty와 notFull을 나누면 put은 notFull에서만 await하고 take는 notEmpty에서만 await합니다. unrelated waiters를 모두 깨우는 비용을 줄일 수 있습니다.",
      "await·signal·signalAll도 해당 Condition을 만든 Lock을 소유해야 합니다. lock 없이 호출하면 IllegalMonitorStateException이며 try/finally unlock이 필수입니다.",
      "Condition.await도 spurious wakeup과 interruption을 허용하므로 반드시 while predicate로 감쌉니다. API만 바뀌었을 뿐 correctness proof는 동일합니다.",
      "lockInterruptibly는 lock entry를 기다리는 단계도 cancellation point로 만듭니다. lock을 얻었는지 여부에 따라 finally unlock을 호출해야 하므로 예제는 성공 획득 뒤 try/finally 구조를 사용합니다.",
      "one-slot 예제는 put A/B, take drain, close를 notEmpty/notFull signalAll로 연결합니다. close는 두 wait sets 모두 terminal predicate가 바뀌므로 둘 다 signalAll합니다.",
      "fair ReentrantLock은 대기 시간이 긴 thread 선호 정책을 제공하지만 throughput 비용과 완전한 scheduler fairness가 아닙니다. 측정 후 선택합니다.",
    ],
    concepts: [
      { term: "Condition", definition: "명시 Lock에 연결된 await/signal wait set abstraction입니다.", detail: ["한 lock에 여러 개를 만들 수 있습니다.", "while predicate가 여전히 필요합니다."] },
      { term: "condition partition", definition: "notEmpty·notFull처럼 서로 다른 progress predicates를 별도 Condition으로 나누는 설계입니다.", detail: ["wrong waiter를 줄입니다.", "terminal은 관련 sets 모두 signal합니다."] },
      { term: "lockInterruptibly", definition: "ReentrantLock 획득을 기다리는 중 interrupt에 응답하는 lock acquisition method입니다.", detail: ["InterruptedException을 전파합니다.", "획득 후에만 unlock합니다."] },
    ],
    codeExamples: [{
      id: "java-condition-one-slot",
      title: "두 Condition으로 one-slot put·take·close를 실행합니다",
      language: "java",
      filename: "ConditionOneSlot.java",
      purpose: "분리 wait sets, while predicate와 terminal signalAll을 exact output으로 검증합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class ConditionOneSlot {
    private static final class Slot {
        private final ReentrantLock lock = new ReentrantLock();
        private final Condition notEmpty = lock.newCondition();
        private final Condition notFull = lock.newCondition();
        private String value;
        private boolean closed;

        void put(String next) throws InterruptedException {
            lock.lockInterruptibly();
            try {
                while (value != null && !closed) {
                    notFull.await();
                }
                if (closed) {
                    throw new IllegalStateException("closed");
                }
                value = next;
                notEmpty.signalAll();
            } finally {
                lock.unlock();
            }
        }

        String take() throws InterruptedException {
            lock.lockInterruptibly();
            try {
                while (value == null && !closed) {
                    notEmpty.await();
                }
                if (value == null) {
                    return null;
                }
                String result = value;
                value = null;
                notFull.signalAll();
                return result;
            } finally {
                lock.unlock();
            }
        }

        void close() {
            lock.lock();
            try {
                closed = true;
                notEmpty.signalAll();
                notFull.signalAll();
            } finally {
                lock.unlock();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Slot slot = new Slot();
        List<String> consumed = new ArrayList<>();
        Thread producer = new Thread(() -> {
            try {
                slot.put("A");
                slot.put("B");
                slot.close();
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        });
        Thread consumer = new Thread(() -> {
            try {
                String value;
                while ((value = slot.take()) != null) {
                    consumed.add(value);
                }
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        });
        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
        System.out.println("items=" + consumed);
        System.out.println("producerTerminated=" + !producer.isAlive());
        System.out.println("consumerTerminated=" + !consumer.isAlive());
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "하나의 ReentrantLock에 notEmpty/notFull Conditions와 slot·closed state를 둡니다." },
        { lines: "14-27", explanation: "put은 interruptibly lock하고 notFull predicate를 while로 기다린 뒤 notEmpty를 signal합니다." },
        { lines: "29-46", explanation: "take는 notEmpty를 기다리고 value 소비 뒤 notFull을 signal합니다." },
        { lines: "48-59", explanation: "close는 두 predicates가 바뀌므로 두 Conditions를 모두 signalAll합니다." },
        { lines: "62-88", explanation: "producer/consumer가 A/B를 handoff하고 terminal null까지 drain합니다." },
        { lines: "84-90", explanation: "join 뒤 FIFO 결과와 두 termination facts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "one ReentrantLock", "two Conditions"], command: isolatedJavaRun("ConditionOneSlot.java", "ConditionOneSlot") },
      output: { value: "items=[A, B]\nproducerTerminated=true\nconsumerTerminated=true", explanation: ["notFull/notEmpty wait sets가 분리됩니다.", "A/B가 FIFO handoff됩니다.", "close가 consumer를 종료시킵니다."] },
      experiments: [
        { change: "finally unlock을 제거합니다.", prediction: "exception·return path에서 lock이 남아 future callers가 block됩니다.", result: "모든 획득 뒤 try/finally unlock합니다." },
        { change: "close에서 notFull signalAll을 제거합니다.", prediction: "full slot을 기다리는 producer가 close를 관찰하지 못할 수 있습니다.", result: "terminal transition이 바꾸는 모든 predicates를 signal합니다." },
        { change: "두 Conditions를 하나로 합칩니다.", prediction: "correctness는 while+signalAll로 유지할 수 있지만 unrelated wakeups가 늘어납니다.", result: "복잡도와 wakeup 비용을 측정해 partition합니다." },
      ],
      sourceRefs: ["java-reentrant-lock", "java-condition", "java-lock", "java-list", "oracle-lock-objects"],
    }],
    diagnostics: [
      { symptom: "Condition.await에서 IllegalMonitorStateException이 난다.", likelyCause: "Condition을 만든 Lock을 현재 thread가 소유하지 않습니다.", checks: ["await 전 lock 호출을 봅니다.", "다른 lock instance를 쓰는지 봅니다.", "finally unlock 범위를 확인합니다."], fix: "같은 lock을 획득한 try/finally 안에서 await/signal합니다.", prevention: "lock·conditions를 private final로 한 class에 캡슐화합니다." },
      { symptom: "close 뒤 producer는 여전히 notFull에서 기다린다.", likelyCause: "terminal transition에서 notEmpty만 signal하고 notFull wait set을 깨우지 않았습니다.", checks: ["close가 어떤 predicates를 바꾸는지 표로 만듭니다.", "각 Condition signal을 봅니다.", "producer thread state를 봅니다."], fix: "close에서 관련 Conditions 모두 signalAll합니다.", prevention: "각 wait set에 terminal transition fixture를 둡니다." },
    ],
    expertNotes: ["Multiple Condition objects improve signaling precision, but they increase protocol surface: every state transition must identify every predicate it may enable or terminate."],
  },
  {
    id: "blockingqueue-high-level-handoff-poison",
    title: "BlockingQueue로 검증된 backpressure·interruption을 재사용합니다",
    lead: "단순 producer-consumer는 직접 wait/notify를 구현하기보다 BlockingQueue의 put·take memory-consistency와 bounded capacity를 사용해 protocol 오류 표면을 줄입니다.",
    explanations: [
      "ArrayBlockingQueue는 fixed capacity FIFO buffer이며 put은 full에서, take는 empty에서 interruptibly 대기합니다. monitor predicate를 application code가 직접 관리하지 않습니다.",
      "BlockingQueue의 memory-consistency effect로 producer가 element를 넣기 전 수행한 actions는 consumer가 그 element를 제거한 뒤의 actions보다 happens-before입니다.",
      "예제는 capacity1 queue에 A, B, STOP sentinel을 put하고 consumer가 STOP 전까지 take합니다. capacity1이 자연스러운 backpressure를 만들며 결과 [A,B]와 remaining0이 scheduler와 무관합니다.",
      "poison pill은 consumer count만큼 넣어야 하고 queue가 full일 때 shutdown producer도 block할 수 있습니다. producer crash로 pill을 못 넣거나 payload와 sentinel이 충돌하는 위험도 있습니다.",
      "실무 종료에는 queue 자체와 별도 close/cancel state, executor shutdown, deadline을 조합하는 편이 낫습니다. poison은 작고 폐쇄된 topology에서만 명시 선택합니다.",
      "BlockingQueue가 task failure·transaction·durable restart를 해결하지는 않습니다. accepted item id와 terminal 회계는 application 책임입니다.",
    ],
    concepts: [
      { term: "BlockingQueue", definition: "producer-consumer용 thread-safe queue로 insertion/removal의 blocking·timed·non-blocking variants를 제공하는 interface입니다.", detail: ["put/take는 interruption에 응답합니다.", "capacity policy를 구현체가 정합니다."] },
      { term: "poison pill", definition: "consumer가 정상 종료를 해석하도록 queue에 넣는 특별 sentinel item입니다.", detail: ["consumer 수와 topology를 알아야 합니다.", "일반 payload와 충돌하지 않아야 합니다."] },
      { term: "library-level protocol reuse", definition: "검증된 concurrent collection의 synchronization을 재사용해 custom wait-set 오류 표면을 줄이는 설계입니다.", detail: ["requirements가 맞을 때 우선합니다.", "종료·durability는 별도입니다."] },
    ],
    codeExamples: [{
      id: "java-array-blocking-queue-poison",
      title: "capacity1 BlockingQueue로 A/B와 terminal sentinel을 전달합니다",
      language: "java",
      filename: "BlockingQueueHandoff.java",
      purpose: "custom wait/notify 없이 bounded backpressure와 interruptible handoff를 구현합니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class BlockingQueueHandoff {
    private static final String STOP = "<STOP>";

    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(1);
        List<String> consumed = new ArrayList<>();
        Thread producer = new Thread(() -> {
            try {
                queue.put("A");
                queue.put("B");
                queue.put(STOP);
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        });
        Thread consumer = new Thread(() -> {
            try {
                while (true) {
                    String value = queue.take();
                    if (STOP.equals(value)) {
                        return;
                    }
                    consumed.add(value);
                }
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
        System.out.println("items=" + consumed);
        System.out.println("remaining=" + queue.size());
        System.out.println("terminated=" + (!producer.isAlive() && !consumer.isAlive()));
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "capacity1 ArrayBlockingQueue, typed STOP과 결과 list를 준비합니다." },
        { lines: "12-21", explanation: "producer는 put으로 backpressure와 interruption contract를 재사용합니다." },
        { lines: "22-35", explanation: "consumer는 take하고 STOP을 payload에 추가하지 않은 채 종료합니다." },
        { lines: "37-43", explanation: "두 threads를 join하고 FIFO results·empty queue·termination을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "ArrayBlockingQueue capacity1", "two workers"], command: isolatedJavaRun("BlockingQueueHandoff.java", "BlockingQueueHandoff") },
      output: { value: "items=[A, B]\nremaining=0\nterminated=true", explanation: ["capacity1에서도 put/take가 progress합니다.", "STOP은 결과에서 제외됩니다.", "queue가 비고 두 workers가 종료됩니다."] },
      experiments: [
        { change: "consumers를3명으로 늘리고 STOP은1개만 둡니다.", prediction: "한 consumer만 종료하고 둘은 take에서 기다릴 수 있습니다.", result: "topology-aware pills 또는 broadcast terminal state를 사용합니다." },
        { change: "offer(timeout)로 바꿉니다.", prediction: "overload를 bounded rejection으로 표현할 수 있습니다.", result: "drop·retry·backpressure 정책을 explicit result로 처리합니다." },
        { change: "unbounded LinkedBlockingQueue를 사용합니다.", prediction: "producer가 빠르면 memory 사용이 늘 수 있습니다.", result: "capacity를 resource budget과 연결합니다." },
      ],
      sourceRefs: ["java-blocking-queue", "java-array-blocking-queue", "java-list", "java-thread", "java-concurrent-package"],
    }],
    diagnostics: [
      { symptom: "poison pill 뒤 일부 consumers가 끝나지 않는다.", likelyCause: "consumer 수보다 terminal sentinels가 적거나 특정 consumer가 여러 pills를 소비했습니다.", checks: ["consumer topology를 셉니다.", "pill count·routing을 봅니다.", "queue full 시 shutdown path를 봅니다."], fix: "consumer별 pill 또는 별도 shared terminal state와 executor shutdown을 사용합니다.", prevention: "consumer1/N·full-at-shutdown fixtures를 둡니다." },
      { symptom: "BlockingQueue로 바꿨는데 restart 때 accepted tasks가 사라진다.", likelyCause: "in-memory synchronization을 durability queue로 오해했습니다.", checks: ["ack/persist 시점을 봅니다.", "process crash fixture를 실행합니다.", "task id 회계를 봅니다."], fix: "durable broker/database lease와 idempotency key를 추가합니다.", prevention: "concurrency와 durability requirements를 별도 ADR 항목으로 둡니다." },
    ],
    expertNotes: ["Prefer a high-level concurrent collection when its semantics match; custom monitor code should pay for itself with a requirement the library cannot express."],
  },
  {
    id: "threadmxbean-waiting-lock-diagnostics",
    title: "ThreadMXBean으로 WAITING state·lock owner를 bounded하게 진단합니다",
    lead: "조건 대기 failure는 로그만으로 notifier 부재·wrong lock·dead owner를 구분하기 어려우므로 timeout 시 thread state, lock info와 stack evidence를 수집합니다.",
    explanations: [
      "Object.wait의 무기한 대기는 Thread.State.WAITING, timed wait는 TIMED_WAITING으로 보일 수 있습니다. BLOCKED는 monitor entry를 기다리는 상태라 wait set과 다릅니다.",
      "ThreadMXBean.getThreadInfo는 thread id의 state, lock info, lock owner id와 stack trace를 제공합니다. thread가 이미 종료하면 null일 수 있으므로 결과를 방어적으로 처리합니다.",
      "waiter는 wait 중 monitor를 release하므로 특별한 notifier가 lock을 잡고 있지 않다면 lockOwnerId는 -1입니다. WAITING인데 owner가 없다는 사실은 notifier 부재 가능성을 시사합니다.",
      "예제는 latch 뒤 실제 WAITING을 bounded polling하고 ThreadInfo에서 state·LockInfo·owner absent를 boolean facts로 출력한 후 interrupt·join해 fixture를 정리합니다.",
      "운영 diagnostic은 전체 object toString이나 payload를 노출하지 않고 thread name/id, state, safe lock class/hash, owner, bounded stack top과 wait duration만 남깁니다.",
      "deadlock detection은 findDeadlockedThreads를 사용할 수 있지만 condition wait로 notifier가 없는 logical hang은 monitor cycle이 아니어서 검출되지 않을 수 있습니다. domain progress metric이 함께 필요합니다.",
    ],
    concepts: [
      { term: "WAITING", definition: "timeout 없이 다른 thread의 특정 action을 기다리는 Thread.State입니다.", detail: ["Object.wait·join 등이 원인일 수 있습니다.", "monitor owner가 없을 수 있습니다."] },
      { term: "BLOCKED", definition: "synchronized monitor entry를 기다리는 Thread.State입니다.", detail: ["wait set이 아닙니다.", "lock owner를 확인합니다."] },
      { term: "logical hang", definition: "deadlock cycle 없이 필요한 signal·participant·state transition이 없어 progress가 멈춘 상태입니다.", detail: ["deadlock detector가 놓칠 수 있습니다.", "deadline·domain metrics가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-threadmxbean-wait-diagnostic",
      title: "WAITING waiter의 LockInfo와 owner absence를 확인하고 안전하게 종료합니다",
      language: "java",
      filename: "WaitDiagnostic.java",
      purpose: "hang fixture를 무한 방치하지 않고 management API evidence와 cleanup까지 검증합니다.",
      code: String.raw`import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;
import java.util.concurrent.CountDownLatch;

public class WaitDiagnostic {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();
        CountDownLatch entered = new CountDownLatch(1);
        Thread waiter = new Thread(() -> {
            synchronized (lock) {
                entered.countDown();
                try {
                    lock.wait();
                } catch (InterruptedException failure) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "diagnostic-waiter");
        waiter.start();
        entered.await();

        long deadline = System.nanoTime() + 1_000_000_000L;
        while (waiter.getState() != Thread.State.WAITING
                && System.nanoTime() < deadline) {
            Thread.onSpinWait();
        }
        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        ThreadInfo info = bean.getThreadInfo(waiter.threadId());
        boolean waiting = info != null
                && info.getThreadState() == Thread.State.WAITING;
        boolean lockInfoPresent = info != null && info.getLockInfo() != null;
        boolean ownerAbsent = info != null && info.getLockOwnerId() == -1L;

        waiter.interrupt();
        waiter.join();
        System.out.println("waiting=" + waiting);
        System.out.println("lockInfoPresent=" + lockInfoPresent);
        System.out.println("ownerAbsent=" + ownerAbsent);
        System.out.println("terminated=" + !waiter.isAlive());
    }
}`,
      walkthrough: [
        { lines: "1-19", explanation: "waiter를 monitor wait set에 넣고 interrupt cleanup path를 준비합니다." },
        { lines: "20-26", explanation: "1초 monotonic deadline 안에서 WAITING state를 bounded polling합니다." },
        { lines: "27-33", explanation: "ThreadMXBean과 ThreadInfo에서 state·LockInfo·owner absence를 추출합니다." },
        { lines: "35-41", explanation: "fixture를 interrupt·join하고 diagnostic facts와 termination을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "java.management module", "1-second diagnostic bound"], command: isolatedJavaRun("WaitDiagnostic.java", "WaitDiagnostic") },
      output: { value: "waiting=true\nlockInfoPresent=true\nownerAbsent=true\nterminated=true", explanation: ["waiter가 WAITING입니다.", "기다리는 monitor LockInfo가 있습니다.", "wait가 lock을 놓아 현재 owner는 없습니다.", "interrupt로 fixture를 회수합니다."] },
      experiments: [
        { change: "wait 대신 synchronized 진입 경쟁을 만듭니다.", prediction: "state가 BLOCKED이고 owner id가 존재할 수 있습니다.", result: "wait set과 entry set을 구분합니다." },
        { change: "wait(1000)을 사용합니다.", prediction: "TIMED_WAITING으로 관찰될 수 있습니다.", result: "API와 timeout 형태를 state 해석에 포함합니다." },
        { change: "findDeadlockedThreads만 사용합니다.", prediction: "notifier 부재 logical hang은 cycle이 없어 null일 수 있습니다.", result: "progress deadline과 condition evidence를 함께 수집합니다." },
      ],
      sourceRefs: ["java-thread-mxbean", "java-thread-info", "java-management-factory", "java-thread-state", "java-system-nanotime", "java-countdown-latch"],
    }],
    diagnostics: [
      { symptom: "thread dump의 WAITING을 deadlock이라고 단정한다.", likelyCause: "WAITING, BLOCKED와 deadlock cycle을 구분하지 않았습니다.", checks: ["lock owner와 cycle을 봅니다.", "predicate state·notifier liveness를 봅니다.", "progress deadline을 확인합니다."], fix: "ThreadInfo와 domain state를 함께 분석해 notifier 부재·정상 idle·deadlock을 분류합니다.", prevention: "상태별 runbook과 safe evidence schema를 둡니다." },
      { symptom: "findDeadlockedThreads가 null인데 서비스는 진행하지 않는다.", likelyCause: "monitor cycle이 아니라 missing signal·participant 같은 logical hang입니다.", checks: ["WAITING waiters와 owners를 봅니다.", "queue/terminal predicate를 봅니다.", "last progress metric을 봅니다."], fix: "bounded timeout으로 terminal transition 또는 cancellation을 실행하고 protocol defect를 수정합니다.", prevention: "deadlock detector와 progress watchdog을 별도로 운영합니다." },
    ],
    expertNotes: ["Management APIs describe thread mechanics; only application predicates and progress invariants can explain whether a WAITING thread is healthy idle or a logical hang."],
  },
  {
    id: "java21-virtual-thread-monitor-wait",
    title: "Java21 virtual thread에서도 predicate·interrupt·termination을 그대로 지킵니다",
    lead: "virtual thread는 blocking code를 가볍게 표현하지만 wait/notify의 monitor semantics와 signal correctness를 바꾸지 않으며, daemon lifetime 때문에 명시 join·scope가 필요합니다.",
    explanations: [
      "Thread.ofVirtual은 Java21 final API입니다. virtual thread도 java.lang.Thread이므로 intrinsic monitor, Object.wait, interrupt status와 Thread.State 계약을 따릅니다.",
      "virtual thread가 많아도 if wait, notify wrong waiter, lost notification은 그대로 bug입니다. thread 생성 비용 감소는 condition state machine의 correctness proof를 대신하지 않습니다.",
      "virtual thread는 daemon입니다. main이 반환하면 waiter가 언젠가 signal될 것이라 기대할 수 없으므로 task scope, Future 또는 join으로 lifetime을 관리합니다.",
      "예제 virtual waiter는 while(!open) wait하고 main이 WAITING을 관찰한 뒤 interrupt합니다. catch에서 monitor reacquisition을 확인하고 flag를 복원해 종료합니다.",
      "Java21에서는 synchronized 구간과 native/foreign blocking의 carrier pinning 가능성을 JFR로 관찰해야 합니다. 다만 lock을 무조건 다른 primitive로 바꾸기 전에 실제 contention·pin duration을 측정합니다.",
      "virtual threads를 수십만 개 기다리게 해도 downstream DB connection·queue capacity·memory budget은 늘지 않습니다. BlockingQueue·Semaphore·rate limit으로 resource concurrency를 제한합니다.",
    ],
    concepts: [
      { term: "virtual waiter", definition: "Object.wait 또는 고수준 blocking API에서 조건을 기다리는 virtual thread입니다.", detail: ["Thread semantics를 따릅니다.", "daemon lifetime입니다."] },
      { term: "pinning observation", definition: "virtual thread가 carrier에서 unmount되지 못하는 구간을 JFR·diagnostics로 찾아 latency 영향을 측정하는 작업입니다.", detail: ["추측 대신 측정합니다.", "Java runtime version도 기록합니다."] },
      { term: "cheap thread versus scarce resource", definition: "virtual thread 생성 비용과 DB/API/file 같은 외부 자원 capacity를 서로 다른 budget으로 보는 원칙입니다.", detail: ["동시성을 별도 제한합니다.", "backpressure가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-virtual-thread-wait-cancel",
      title: "virtual waiter의 WAITING·monitor reacquisition·interrupt 종료를 확인합니다",
      language: "java",
      filename: "VirtualWaiter.java",
      purpose: "Java21 virtual thread에서도 guarded wait와 cooperative cancellation이 동일함을 검증합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

public class VirtualWaiter {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();
        boolean[] open = {false};
        CountDownLatch entered = new CountDownLatch(1);
        AtomicBoolean reacquired = new AtomicBoolean();
        AtomicBoolean restored = new AtomicBoolean();

        Thread waiter = Thread.ofVirtual().name("virtual-waiter").unstarted(() -> {
            synchronized (lock) {
                entered.countDown();
                try {
                    while (!open[0]) {
                        lock.wait();
                    }
                } catch (InterruptedException failure) {
                    reacquired.set(Thread.holdsLock(lock));
                    Thread.currentThread().interrupt();
                    restored.set(Thread.currentThread().isInterrupted());
                }
            }
        });
        waiter.start();
        entered.await();
        long deadline = System.nanoTime() + 1_000_000_000L;
        while (waiter.getState() != Thread.State.WAITING
                && System.nanoTime() < deadline) {
            Thread.onSpinWait();
        }
        boolean waitingObserved = waiter.getState() == Thread.State.WAITING;
        waiter.interrupt();
        waiter.join();

        System.out.println("virtual=" + waiter.isVirtual());
        System.out.println("daemon=" + waiter.isDaemon());
        System.out.println("waitingObserved=" + waitingObserved);
        System.out.println("reacquired=" + reacquired.get());
        System.out.println("restored=" + restored.get());
        System.out.println("terminated=" + !waiter.isAlive());
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "monitor predicate, wait entry와 interruption evidence를 준비합니다." },
        { lines: "12-25", explanation: "virtual thread가 guarded wait하고 catch에서 monitor reacquisition·flag restore를 기록합니다." },
        { lines: "26-34", explanation: "start 뒤1초 안에 WAITING을 확인하고 interrupt·join합니다." },
        { lines: "36-41", explanation: "virtual·daemon properties와 wait/cancel/termination facts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21 exactly or later", "no --enable-preview", "single virtual thread"], command: isolatedJavaRun("VirtualWaiter.java", "VirtualWaiter") },
      output: { value: "virtual=true\ndaemon=true\nwaitingObserved=true\nreacquired=true\nrestored=true\nterminated=true", explanation: ["virtual thread가 intrinsic WAITING에 들어갑니다.", "interrupt catch 전 monitor를 재획득합니다.", "flag 복원과 join 종료를 확인합니다."] },
      experiments: [
        { change: "join을 제거하고 main을 반환합니다.", prediction: "virtual thread가 daemon이라 completion을 JVM이 기다린다는 보장이 없습니다.", result: "scope/Future/join으로 lifetime을 소유합니다." },
        { change: "while을 if로 바꿉니다.", prediction: "virtual thread여도 spurious/wrong wakeup defect는 같습니다.", result: "execution model과 condition correctness를 분리합니다." },
        { change: "많은 virtual waiters가 한 monitor를 경쟁하게 합니다.", prediction: "monitor contention과 notification storm이 생길 수 있습니다.", result: "JFR로 측정하고 partitioned Condition·queue를 검토합니다." },
      ],
      sourceRefs: ["java-thread", "java-thread-builder-virtual", "jep-444", "java-object-wait", "java-thread-holds-lock", "java-countdown-latch", "java-atomic-boolean", "java-system-nanotime"],
    }],
    diagnostics: [
      { symptom: "virtual thread로 바꿨는데 lost notification이 그대로 발생한다.", likelyCause: "thread implementation만 바꾸고 if wait·state-before-signal defect를 수정하지 않았습니다.", checks: ["while predicate를 봅니다.", "same-lock state transition을 봅니다.", "terminal notifyAll을 봅니다."], fix: "platform thread와 동일한 guarded condition protocol을 적용합니다.", prevention: "같은 acceptance matrix를 두 execution models에 실행합니다." },
      { symptom: "virtual waiters가 늘자 downstream timeout이 증가한다.", likelyCause: "값싼 threads를 외부 resource capacity 증가로 오해했습니다.", checks: ["in-flight DB/API 수를 봅니다.", "queue capacity와 rate limit을 봅니다.", "JFR pin/contention events를 봅니다."], fix: "resource별 bounded queue·semaphore·rate limit을 둡니다.", prevention: "thread count와 scarce-resource concurrency budgets를 분리합니다." },
    ],
    expertNotes: ["Virtual threads change the cost model of blocking, not the semantic model of condition synchronization or the capacity of downstream systems."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...cancellationAndAlternativesChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "oracle-interrupts", repository: "Oracle Java Tutorials", path: "Concurrency/Interrupts", publicUrl: "https://docs.oracle.com/javase/tutorial/essential/concurrency/interrupt.html", usedFor: ["InterruptedException handling", "status restoration"], evidence: "cooperative interruption 공식 학습 근거입니다." },
  { id: "java-concurrent-skip-list-set", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentSkipListSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentSkipListSet.html", usedFor: ["scheduler-independent sorted completion set"], evidence: "thread-safe sorted membership evidence 근거입니다." },
  { id: "java-thread", repository: "Java SE 21 API", path: "java.lang.Thread", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html", usedFor: ["state", "join", "interrupt", "virtual property"], evidence: "worker lifecycle 핵심 API 근거입니다." },
  { id: "java-reentrant-lock", repository: "Java SE 21 API", path: "java.util.concurrent.locks.ReentrantLock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html", usedFor: ["explicit lock", "interruptible acquisition", "Condition creation"], evidence: "Condition owner lock 근거입니다." },
  { id: "java-condition", repository: "Java SE 21 API", path: "java.util.concurrent.locks.Condition", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Condition.html", usedFor: ["partitioned wait sets", "await", "signalAll"], evidence: "명시 condition contract 근거입니다." },
  { id: "java-lock", repository: "Java SE 21 API", path: "java.util.concurrent.locks.Lock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Lock.html", usedFor: ["lock/unlock memory semantics", "try-finally ownership"], evidence: "명시 lock interface 근거입니다." },
  { id: "oracle-lock-objects", repository: "Oracle Java Tutorials", path: "Lock Objects", publicUrl: "https://docs.oracle.com/javase/tutorial/essential/concurrency/newlocks.html", usedFor: ["Lock and try-finally pattern"], evidence: "명시 Lock 공식 학습 근거입니다." },
  { id: "java-blocking-queue", repository: "Java SE 21 API", path: "java.util.concurrent.BlockingQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html", usedFor: ["put/take variants", "memory consistency"], evidence: "고수준 producer-consumer contract 근거입니다." },
  { id: "java-array-blocking-queue", repository: "Java SE 21 API", path: "java.util.concurrent.ArrayBlockingQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ArrayBlockingQueue.html", usedFor: ["bounded FIFO implementation", "capacity1 backpressure"], evidence: "bounded queue 구현 근거입니다." },
  { id: "java-concurrent-package", repository: "Java SE 21 API", path: "java.util.concurrent package summary", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html", usedFor: ["high-level concurrency utilities", "memory consistency effects"], evidence: "고수준 utilities와 가시성 근거입니다." },
  { id: "java-thread-mxbean", repository: "Java SE 21 API", path: "java.lang.management.ThreadMXBean", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html", usedFor: ["thread info lookup", "deadlock detection limits"], evidence: "runtime thread diagnostic API 근거입니다." },
  { id: "java-thread-info", repository: "Java SE 21 API", path: "java.lang.management.ThreadInfo", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadInfo.html", usedFor: ["state", "lock info", "owner id"], evidence: "thread snapshot evidence schema 근거입니다." },
  { id: "java-management-factory", repository: "Java SE 21 API", path: "java.lang.management.ManagementFactory", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ManagementFactory.html", usedFor: ["platform ThreadMXBean access"], evidence: "management bean access 근거입니다." },
  { id: "java-thread-state", repository: "Java SE 21 API", path: "java.lang.Thread.State", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.State.html", usedFor: ["WAITING vs TIMED_WAITING vs BLOCKED"], evidence: "runtime state 분류 근거입니다." },
  { id: "java-system-nanotime", repository: "Java SE 21 API", path: "java.lang.System.nanoTime", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#nanoTime()", usedFor: ["monotonic diagnostic deadline"], evidence: "bounded state observation 근거입니다." },
  { id: "java-thread-builder-virtual", repository: "Java SE 21 API", path: "java.lang.Thread.Builder.OfVirtual", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.Builder.OfVirtual.html", usedFor: ["Java21 virtual thread creation"], evidence: "virtual builder API 근거입니다." },
  { id: "jep-444", repository: "OpenJDK JEP", path: "JEP 444 Virtual Threads", publicUrl: "https://openjdk.org/jeps/444", usedFor: ["Java21 final virtual threads", "daemon and scheduling intent"], evidence: "virtual thread feature 근거입니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "wait·notify·notifyAll은 어느 object에서 호출해야 하나요?", answer: "현재 thread가 synchronized로 monitor를 소유한 바로 그 object에서 호출해야 합니다." },
  { question: "monitor를 소유하지 않고 wait하면 무엇이 발생하나요?", answer: "IllegalMonitorStateException이 발생합니다." },
  { question: "wait와 sleep의 lock 관점 핵심 차이는 무엇인가요?", answer: "wait는 호출한 object의 monitor를 release하지만 sleep은 보유 monitor를 놓지 않습니다." },
  { question: "notifyAll 직후 waiter가 바로 실행되나요?", answer: "아닙니다. notifier가 monitor를 unlock한 뒤 waiter가 재획득 경쟁에서 이겨야 wait가 반환합니다." },
  { question: "wait에서 반환한 thread는 monitor를 다시 소유하나요?", answer: "네. 정상 notification·timeout·interruption 경로 모두 반환 또는 exception 전달 전에 monitor를 재획득합니다." },
  { question: "조건 대기를 if가 아니라 while로 써야 하는 이유는 무엇인가요?", answer: "spurious wakeup, wrong notification과 다른 thread의 선점 뒤 predicate를 다시 검사해야 하기 때문입니다." },
  { question: "spurious wakeup은 JVM bug인가요?", answer: "아닙니다. Object.wait 계약이 허용하므로 application은 while predicate로 무해하게 처리해야 합니다." },
  { question: "while wait는 busy spin인가요?", answer: "아닙니다. predicate false일 때 wait가 monitor를 놓고 thread를 WAITING으로 전환합니다." },
  { question: "진행 허가를 주는 것은 notification인가요?", answer: "아닙니다. lock 아래에서 참으로 확인한 condition predicate가 진행 허가이며 notification은 재검사 기회입니다." },
  { question: "notify가 어떤 waiter를 고르나요?", answer: "wait set에서 임의의 하나를 고르며 FIFO나 predicate-aware 선택 보장은 없습니다." },
  { question: "여러 predicates가 한 wait set을 공유할 때 notify가 위험한 이유는 무엇인가요?", answer: "현재 조건이 false인 wrong waiter를 깨우면 eligible waiter가 계속 잠들어 progress가 멈출 수 있습니다." },
  { question: "notifyAll은 모든 waiter를 동시에 critical section에 넣나요?", answer: "아닙니다. 모두 경쟁 가능해지지만 monitor는 한 번에 한 thread만 획득합니다." },
  { question: "notifyAll 뒤 correctness를 지키는 장치는 무엇인가요?", answer: "각 waiter의 while predicate 재검사입니다." },
  { question: "notification이 미래 waiter를 위해 저장되나요?", answer: "아닙니다. 현재 wait set에 대상이 없으면 signal은 기억되지 않습니다." },
  { question: "lost notification을 어떻게 막나요?", answer: "같은 lock 아래 durable condition state를 먼저 변경하고 signal하며 waiter는 그 state를 while로 검사합니다." },
  { question: "timeout을 넣으면 lost notification이 해결되나요?", answer: "아닙니다. 무한 hang을 bounded failure로 바꿀 뿐 state protocol을 고쳐야 합니다." },
  { question: "여러 업무 events를 notification 횟수로 보존해도 되나요?", answer: "안 됩니다. counter, queue, generation 같은 explicit state로 보존해야 합니다." },
  { question: "bounded buffer producer의 predicate는 무엇인가요?", answer: "queue size가 capacity보다 작거나 terminal state가 되어 더 기다릴 필요가 없는 조건입니다." },
  { question: "consumer의 predicate는 무엇인가요?", answer: "queue가 비지 않았거나 closed/cancelled/failed 같은 terminal state인 조건입니다." },
  { question: "close에서 notifyAll이 필요한 이유는 무엇인가요?", answer: "normal item 조건과 무관하게 모든 waiters의 terminal predicate가 바뀌기 때문입니다." },
  { question: "close 뒤 queue를 비우는 정책은 무엇이라고 하나요?", answer: "새 put은 막고 기존 items를 모두 처리하는 drain-on-close 정책입니다." },
  { question: "wait 중 interrupt되면 catch 전에 monitor를 소유하나요?", answer: "네. waiter는 monitor를 재획득한 뒤 InterruptedException을 받습니다." },
  { question: "InterruptedException catch에서 status가 false인 이유는 무엇인가요?", answer: "wait가 exception을 던질 때 interrupt status를 clear하기 때문입니다." },
  { question: "InterruptedException을 처리하지 않을 계층은 어떻게 해야 하나요?", answer: "그대로 전파하거나 currentThread().interrupt()로 flag를 복원하고 종료해야 합니다." },
  { question: "printStackTrace만 하고 다시 wait하면 어떤 문제가 있나요?", answer: "취소 신호를 삼켜 worker가 다시 영구 WAITING이 될 수 있습니다." },
  { question: "terminal close는 왜 idempotent해야 하나요?", answer: "shutdown retry와 여러 caller 경쟁에서도 상태 전이와 side effect가 한 번만 일어나야 하기 때문입니다." },
  { question: "global close에서 notify 하나만 쓰면 어떻게 되나요?", answer: "한 waiter만 깨고 나머지는 closed가 참이어도 잠든 채 남을 수 있습니다." },
  { question: "ReentrantLock Condition의 장점은 무엇인가요?", answer: "한 Lock에 notEmpty·notFull 같은 여러 wait sets를 분리하고 interruptible lock acquisition을 사용할 수 있습니다." },
  { question: "Condition.await도 while이 필요한가요?", answer: "네. spurious wakeup과 경쟁은 intrinsic wait와 같으므로 predicate loop가 필요합니다." },
  { question: "Condition.signal을 lock 밖에서 호출할 수 있나요?", answer: "아닙니다. 해당 Condition을 만든 Lock을 소유해야 합니다." },
  { question: "close가 두 Conditions 중 하나만 깨워도 되나요?", answer: "close가 둘의 terminal predicate를 모두 바꾸므로 notEmpty와 notFull 모두 signalAll해야 합니다." },
  { question: "단순 producer-consumer에서 직접 wait/notify보다 먼저 검토할 것은 무엇인가요?", answer: "BlockingQueue 같은 검증된 고수준 concurrent collection입니다." },
  { question: "ArrayBlockingQueue의 capacity는 무엇을 제공하나요?", answer: "producer 속도를 downstream 처리 능력과 맞추는 bounded backpressure를 제공합니다." },
  { question: "poison pill은 consumer가 여러 명일 때 무엇을 주의해야 하나요?", answer: "모든 consumers가 terminal을 관찰할 수 있도록 topology와 pill 수를 맞추거나 별도 broadcast state를 써야 합니다." },
  { question: "BlockingQueue가 process crash durability도 제공하나요?", answer: "아닙니다. in-memory synchronization이며 durable broker·database lease와 idempotency는 별도입니다." },
  { question: "WAITING과 BLOCKED의 차이는 무엇인가요?", answer: "WAITING은 특정 action을 기다리는 상태이고 BLOCKED는 monitor entry 획득을 기다리는 상태입니다." },
  { question: "findDeadlockedThreads가 null이면 logical hang이 아닌가요?", answer: "아닙니다. notifier 부재나 lost signal은 lock cycle이 없어 deadlock detector가 놓칠 수 있습니다." },
  { question: "timeout 시 어떤 thread evidence를 남기나요?", answer: "safe thread name/id, state, LockInfo, owner, bounded stack top, wait duration과 domain predicate를 남깁니다." },
  { question: "virtual thread가 wait/notify 결함을 자동으로 고치나요?", answer: "아닙니다. 같은 monitor·predicate·interrupt·termination 계약을 따릅니다." },
  { question: "virtual waiter가 많으면 downstream capacity도 늘어나나요?", answer: "아닙니다. DB/API/file capacity는 bounded queue·semaphore·rate limit으로 별도 제한해야 합니다." },
);

(session.completionChecklist as string[]).push(
  "원본 inventory4 파일과 역할을 확인했다.",
  "package24·inventory4·relocated4 warning0을 검증했다.",
  "relocated4 SHA-256이 원본과 같음을 확인했다.",
  "Ex16의 x1~200·thread4x50 결과를 확인했다.",
  "Ex20의 four50-line blocks를 확인했다.",
  "Ex15 single participant가11줄 뒤 hang함을 bounded 검증했다.",
  "Ex19 single participant가50줄 뒤 hang함을 bounded 검증했다.",
  "원본의 if2·wait2·notify2·notifyAll0 shape를 설명할 수 있다.",
  "expected hang child를 timeout·process-tree kill로 안전하게 회수했다.",
  "원본 pair 성공을 일반 protocol 안전성으로 확대하지 않는다.",
  "wait 대상 monitor를 현재 thread가 소유한다.",
  "synchronized 대상과 wait/notify 대상 identity가 같다.",
  "IllegalMonitorStateException 원인을 진단할 수 있다.",
  "wait가 해당 monitor를 release함을 설명할 수 있다.",
  "wait 반환 전 monitor를 재획득함을 설명할 수 있다.",
  "sleep이 monitor를 release하지 않음을 안다.",
  "느린 I/O와 sleep을 lock 밖으로 옮긴다.",
  "predicate fields를 같은 monitor 아래 읽고 쓴다.",
  "모든 condition wait를 while로 감싼다.",
  "spurious wakeup 뒤 predicate를 재검사한다.",
  "다른 consumer 선점 뒤 predicate를 재검사한다.",
  "notification이 아니라 predicate가 진행 허가임을 안다.",
  "notify 대상에 FIFO 보장이 없음을 안다.",
  "다중 predicates에서 wrong waiter 위험을 설명할 수 있다.",
  "notifyAll과 while predicate를 함께 사용한다.",
  "notification storm은 correctness 뒤 측정한다.",
  "signal-before-wait fixture를 검증했다.",
  "notification이 미래 waiter에 저장되지 않음을 안다.",
  "state-before-signal 순서를 같은 lock 아래 지킨다.",
  "여러 events는 counter·queue·generation으로 모델링한다.",
  "timeout을 protocol fix로 오해하지 않는다.",
  "bounded buffer의 notFull predicate를 정의했다.",
  "bounded buffer의 notEmpty predicate를 정의했다.",
  "capacity1로 multi-step backpressure를 검증했다.",
  "put/take state transition 뒤 관련 waiters를 signal한다.",
  "close를 terminal predicate에 포함한다.",
  "close 뒤 새 put을 명시적으로 거부한다.",
  "drain-on-close와 cancel-immediate를 구분한다.",
  "terminal transition에서 notifyAll한다.",
  "accepted task terminal 합계를 검증한다.",
  "wait interruption이 monitor 재획득 뒤 전달됨을 검증했다.",
  "InterruptedException catch에서 status clear를 이해한다.",
  "consume·propagate·restore 중 처리 방식을 명시한다.",
  "log-only interrupt catch를 두지 않는다.",
  "interrupt 뒤 worker를 join해 종료를 확인한다.",
  "close API를 idempotent하게 만든다.",
  "waiter1/N 모두 terminal broadcast로 종료한다.",
  "normal close와 failure cause를 구분한다.",
  "ReentrantLock을 try/finally로 unlock한다.",
  "Condition.await도 while predicate로 사용한다.",
  "notEmpty·notFull Conditions를 분리할 수 있다.",
  "terminal에서 관련 Conditions 모두 signalAll한다.",
  "lockInterruptibly의 취소 경계를 이해한다.",
  "단순 queue에는 BlockingQueue를 우선 검토한다.",
  "BlockingQueue capacity를 resource budget과 연결한다.",
  "poison pill의 consumer-count·full-queue 한계를 안다.",
  "in-memory queue와 durable queue를 구분한다.",
  "ThreadMXBean으로 WAITING과 lock info를 수집할 수 있다.",
  "deadlock cycle과 notifier 부재 logical hang을 구분한다.",
  "virtual thread에도 같은 condition acceptance matrix를 적용한다.",
);
