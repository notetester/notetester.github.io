import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["thread-03-synchronized"],
  slug: "thread-03-synchronized",
  courseId: "java",
  moduleId: "java-systems",
  order: 37,
  title: "경쟁 상태와 synchronized",
  subtitle: "복합 연산·monitor identity·happens-before·lock 범위·deadlock과 현대 대안을 재현 가능한 증거로 연결합니다.",
  level: "고급",
  estimatedMinutes: 1080,
  coreQuestion: "여러 스레드가 같은 가변 상태를 다룰 때 어떤 연산 묶음을 어느 monitor로 보호해야 값의 무결성과 가시성을 함께 보장하고, 교착·지연·확장성 비용을 어떻게 통제할까요?",
  summary: "원본 class11의 Ex13/14, Ex17, Study01_Thread 네 파일과 누락된 실행 짝 Ex18_Main·Study01을 함께 읽습니다. package24·inventory4·expanded6은 JDK21 -Xlint:all warning0입니다. 원본을 수정하거나 임의 순서를 정답으로 꾸미지 않고 owned temp 복사본에서 두 launcher modes를 실행합니다. Ex14는 준비/완료를 lock 밖에 두고 4개 스레드가 동일 Ex13 인스턴스의 synchronized(this)에서 각 50회씩 총 1..200을 출력하며, Ex17과 Study01_Thread는 두 스레드가 각 100회씩 같은 monitor를 차지합니다. 이 실제 증거에서 ++의 read-modify-write, critical section, intrinsic monitor identity, mutual exclusion과 unlock→subsequent lock happens-before를 출발점으로 삼아 재진입, 예외 시 lock 해제, 최소 lock 범위, compound action, lock ordering, Atomic/LongAdder, ReentrantLock, Java21 virtual thread까지 확장합니다. 모든 현대 Java 예제는 warning0과 exact stdout을 요구하며 scheduling 우연을 정답으로 사용하지 않습니다.",
  objectives: [
    "x++가 read·add·write로 분해되는 복합 연산이며 lost update가 생기는 interleaving을 설명한다.",
    "synchronized method와 block이 어느 객체 또는 Class monitor를 잠그는지 코드에서 식별한다.",
    "mutual exclusion과 Java Memory Model의 monitor unlock→subsequent lock happens-before를 구분한다.",
    "공유 불변식을 한 critical section으로 보호하고 모든 접근이 같은 lock discipline을 따르게 한다.",
    "재진입·예외·interrupt와 intrinsic lock의 동작을 검증한다.",
    "느린 I/O·sleep·callback을 lock 밖으로 옮기되 snapshot과 commit 경계를 보존한다.",
    "여러 lock의 전역 순서를 정해 deadlock을 예방하고 진단 evidence를 수집한다.",
    "synchronized·AtomicInteger·LongAdder·ReentrantLock·concurrent collection을 semantics 기준으로 선택한다.",
    "platform/virtual thread 수가 늘어도 critical section의 blocking·pinning·contention budget을 운영한다.",
  ],
  prerequisites: [
    { title: "daemon·join·interrupt 협력 취소", reason: "lock을 기다리거나 작업을 종료할 때 thread lifecycle·join·interrupt 계약을 알고 있어야 합니다.", sessionSlug: "thread-02-daemon-join-interrupt" },
    { title: "캡슐화와 불변식", reason: "동기화 대상은 개별 필드가 아니라 객체가 항상 만족해야 하는 cross-field invariant입니다.", sessionSlug: "oop-03-encapsulation" },
  ],
  keywords: ["race condition", "data race", "lost update", "critical section", "monitor", "intrinsic lock", "synchronized", "mutual exclusion", "happens-before", "visibility", "atomicity", "lock identity", "reentrancy", "contention", "deadlock", "lock ordering", "compound action", "AtomicInteger", "LongAdder", "ReentrantLock", "virtual thread", "pinning"],
  chapters: [],
  lab: {
    title: "결제 잔액 서비스를 race evidence에서 bounded concurrency 운영까지 강화하기",
    scenario: "동시에 들어오는 충전·결제·환불 요청에서 잔액 음수, 중복 처리와 간헐적 멈춤이 보고되었습니다. 단일 JVM의 mutable account store를 분석하고 명확한 consistency boundary와 관측 가능한 lock 정책으로 교정합니다.",
    setup: ["같은 account에 집중되는 hot-key workload와 서로 다른 account workload를 분리합니다.", "lost update·check-then-act·opposite transfer·slow callback·interrupt fixtures를 만듭니다.", "요청 id, account id hash, wait/hold duration, outcome만 남기고 민감한 금액 원문은 공개 log에서 제외합니다."],
    steps: ["공유 mutable state와 모든 read/write entry point를 inventory합니다.", "balance·ledger·idempotency key가 함께 만족해야 하는 invariant를 문장과 assertion으로 정의합니다.", "barrier/latch로 실패 interleaving을 재현해 race를 scheduling 운에 맡기지 않습니다.", "각 critical section의 monitor identity와 lock acquisition graph를 표시합니다.", "check와 update를 한 atomic operation으로 합치고 같은 lock discipline 밖의 접근을 제거합니다.", "두 account transfer에는 immutable unique id 기반 total ordering을 적용합니다.", "I/O·logging·remote callback은 immutable snapshot을 만든 뒤 lock 밖에서 수행합니다.", "synchronized, atomic, striped lock 또는 database transaction 후보를 consistency 요구로 비교합니다.", "wait/hold p50·p95·p99와 queue depth를 측정하되 measurement overhead를 분리합니다.", "race/deadlock/interrupt/fault fixtures와 thread dump runbook을 CI·운영 문서에 연결합니다."],
    expectedResult: ["동일한 controlled interleaving에서 unsafe 구현만 lost update를 재현하고 수정본은 exact invariant를 유지합니다.", "opposite transfer가 timeout 없이 종료되고 총 잔액·idempotency 불변식이 보존됩니다.", "lock 안에서 network/file/sleep/user callback을 실행하지 않습니다.", "contention threshold와 scale-out 시 database/distributed consistency 전환 조건이 문서화됩니다."],
    cleanup: ["executor와 virtual threads를 모두 join/close하고 남은 non-daemon thread를 검사합니다.", "diagnostic dump와 원시 식별자는 제한 저장소로 이동하고 공개 보고에는 aggregate만 남깁니다.", "fault injection으로 만든 임시 계정과 idempotency keys를 owned namespace에서만 삭제합니다."],
    extensions: ["JFR Java Monitor Blocked/Park와 async-profiler lock profile을 같은 부하에서 비교합니다.", "단일 lock, per-account lock, striping, actor/queue, database row lock을 invariant·throughput·복구 표로 평가합니다.", "virtual-thread workload에서 synchronized 안의 blocking I/O를 제거한 전후를 측정합니다.", "multi-process로 확장할 때 JVM monitor가 보호하지 못하는 경계를 optimistic version 또는 database transaction으로 옮깁니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "두 스레드의 read를 barrier로 맞춰 ++ lost update를 항상 재현하고 synchronized 수정본과 비교하세요.", requirements: ["우연한 sleep 대신 CountDownLatch 또는 Phaser를 씁니다.", "unsafe=1과 safe=2를 exact 출력합니다.", "read·modify·write 각 단계를 timeline으로 그립니다.", "모든 thread를 join합니다."], hints: ["두 스레드가 같은0을 읽은 뒤 쓰게 만듭니다.", "println 자체를 lock으로 착각하지 마세요."], expectedOutcome: "data race를 매번 재현하고 같은 monitor의 critical section이 왜 수정하는지 설명합니다.", solutionOutline: ["snapshot 직후 barrier를 둡니다.", "수정본은 전체 increment를 하나의 synchronized method로 감쌉니다."] },
    { difficulty: "응용", prompt: "서로 반대 방향 account transfer를 deadlock 없이 구현하세요.", requirements: ["두 account에 stable unique order를 둡니다.", "same-account와 insufficient funds policy를 명시합니다.", "두 방향 동시 transfer를 반복하고 total·개별 balance를 검증합니다.", "lock 안에서 logging/callback을 금지합니다.", "timeout이 아니라 완료·불변식으로 성공을 판정합니다."], hints: ["호출 순서가 아니라 id 순서로 locks를 잡습니다.", "identityHashCode collision은 별도 tie lock이 필요할 수 있습니다."], expectedOutcome: "global lock order로 circular wait를 제거하고 exact ledger invariant를 보존합니다.", solutionOutline: ["first/second를 id로 정렬합니다.", "두 lock 안에서 validate와 commit만 합니다."] },
    { difficulty: "설계", prompt: "hot-key 결제 계정의 동시성 전략과 운영 runbook을 작성하세요.", requirements: ["linearizability가 필요한 operations를 표시합니다.", "synchronized/atomic/LongAdder/striping/DB transaction 대안을 비교합니다.", "wait·hold·queue·throughput·error metrics와 개인정보 정책을 정의합니다.", "deadlock thread dump와 rollback 절차를 포함합니다.", "virtual thread pinning과 multi-JVM 경계를 다룹니다.", "acceptance SLO와 부하 fixture를 수치화합니다."], hints: ["가장 빠른 primitive보다 필요한 semantic을 먼저 고릅니다.", "JVM lock은 다른 process의 write를 보지 못합니다."], expectedOutcome: "정합성·성능·관측·복구·확장 경계를 함께 설명하는 production concurrency decision record가 완성됩니다.", solutionOutline: ["invariant→contention shape→primitive→evidence→fallback 순으로 작성합니다.", "각 failure mode에 owner와 증거를 연결합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["thread-04-wait-notify"],
  sources: [],
  sourceCoverage: {
    filesRead: 6,
    filesUsed: 6,
    uncoveredNotes: [
      "inventory의 Ex13/14·Ex17·Study01_Thread를 읽고 Ex17과 Study01_Thread를 실제 실행하는 complementary mains Ex18_Main·Study01을 같은 package에서 추가했습니다.",
      "class11의 wait/notify examples Ex15/16·Ex19/20은 thread-04에서 predicate loop와 notifyAll까지 별도로 다룹니다.",
      "원본의 RuntimeException interrupt 변환과 broad synchronized 범위는 증거로 보존하고 현대 chapters에서 interrupt ownership·최소 critical section으로 교정합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAuditChapter: DetailedSession["chapters"][number] = {
  id: "class11-synchronized-original-audit",
  title: "class11 package24·inventory4·expanded6을 원본 무변경으로 컴파일하고 1..200 critical sections를 감사합니다",
  lead: "스레드 출력의 이름 순서는 고정하지 않되 원본이 실제로 보장하는 line count·연속 증가·스레드별 lock ownership 구간을 두 launcher modes에서 정확히 검증합니다.",
  explanations: [
    "원래 inventory에는 Ex13_Synchronized, Ex14_Main, Ex17_Synchronized, Study01_Thread 네 파일이 있습니다. Ex17과 Study01_Thread에는 main이 없으므로 같은 package의 Ex18_Main과 Study01을 complementary runners로 포함해 여섯 파일을 실행 가능한 경계로 만듭니다.",
    "class11 package는 Java files24·main methods11, inventory4는 main1, expanded6은 main3입니다. 세 집합 모두 OpenJDK21 --release21 -proc:none -Xlint:all에서 compiler stdout/stderr가 모두 비어 warning0입니다.",
    "Ex14는 하나의 Ex13 instance를 dog·cat·tiger·lion 네 Thread에 공유합니다. synchronized(this) 안에서 각 run이 50회 전체 loop를 수행하므로 numbered output은 반드시1..200이고 각 thread가 하나의 연속 50개 block을 가집니다.",
    "Ex13의 준비·완료·separator는 synchronized block 밖입니다. 따라서 준비/완료 line은 numbered block 사이에 끼어들 수 있으며 thread 이름의 실행 순서를 exact answer로 고정하면 원본 semantics를 왜곡합니다.",
    "Ex17은 같은 Runnable instance에서 synchronized(this)로 각 thread의 100회 loop 전체를 잠급니다. Ex18은 dog/cat 두 thread이므로 numbered lines200, 값1..200, thread별100, ownership blocks2입니다.",
    "Study01_Thread의 run 자체가 synchronized instance method입니다. Study01은 shared instance를 first/second에 전달하므로 Ex17과 같은 two blocks를 보이지만 syntax가 method lock입니다.",
    "세 원본 모두 ++x를 사용합니다. increment와 println이 같은 monitor 안에 있어 값 중복·누락은 없지만 lock 범위가 loop 전체라 각 thread가 긴 batch를 독점합니다. 동기화가 곧 공정한 교대 실행을 뜻하지 않습니다.",
    "Ex13은 lock 밖에서 Thread.sleep(300)을 호출합니다. sleep은 monitor를 자동 해제하는 API가 아니며, 여기서는 block 밖이기 때문에 다른 thread의 critical section 진행을 막지 않습니다.",
    "audit는 source6의 SHA-256을 실행 전후 비교하고 owned temp에 byte-for-byte copy한 파일만 실행합니다. 원본 source를 rewrite하지 않으며 stdout에는 private absolute path를 출력하지 않습니다.",
    "child stdout/stderr는 비동기로 동시에 drain하고15초 timeout에서 process tree를 종료합니다. JVM launcher option 네 개는 child에서 제거하고 parent에 exact restore합니다.",
    "두 modes는 thread order가 달라도 같은 semantic summary를 만들어야 합니다. 이 방식은 nondeterminism을 숨기지 않으면서 원본 contract만 deterministic evidence로 남깁니다.",
  ],
  concepts: [
    { term: "critical section", definition: "하나의 공유 불변식을 관찰·검증·변경하는 동안 다른 경쟁 실행이 끼어들면 안 되는 코드 구간입니다.", detail: ["문법 블록보다 invariant 경계로 찾습니다.", "너무 넓으면 contention이 커집니다."], analogy: "장부 한 줄을 읽고 계산해 다시 쓰는 동안 계산대 열쇠를 한 사람이 갖는 것과 같습니다." },
    { term: "intrinsic monitor", definition: "모든 Java object에 연관된 mutual-exclusion monitor로 synchronized가 lock/unlock하는 대상입니다.", detail: ["instance method는 this를 잠급니다.", "static synchronized는 Class object를 잠급니다."], caveat: "서로 다른 객체를 잠그면 같은 static state를 보호하지 못합니다." },
    { term: "semantic output audit", definition: "scheduler가 결정하는 순서를 고정하지 않고 program contract가 보장하는 값·개수·grouping·invariant만 exact 비교하는 검증입니다.", detail: ["허용 가능한 순서 집합을 검증합니다.", "race를 정상 변동으로 오인하지 않습니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-thread03-audit",
    title: "원본 6파일을 copy·warning0 compile·세 main 실행하고 critical-section invariants를 두 modes에서 검증합니다",
    language: "powershell",
    filename: "verify-original-thread03.ps1",
    purpose: "원본 파일과 nondeterministic thread order를 조작하지 않고 compile/runtime/source-shape evidence를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("thread03 audit "+[Guid]::NewGuid().ToString('N'))
$ownsRoot=$false;$bodyError=$null;$nl=[string][char]10

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
    if(-not$process.WaitForExit(15000)){
      $process.Kill($true);if(-not$process.WaitForExit(5000)){throw 'termination grace exceeded'}
      [void]$outTask.GetAwaiter().GetResult();[void]$errTask.GetAwaiter().GetResult();throw 'child timeout'
    }
    return @{Exit=$process.ExitCode;Out=(Normalize $outTask.GetAwaiter().GetResult());Err=(Normalize $errTask.GetAwaiter().GetResult())}
  }finally{$process.Dispose()}
}
function Compile([IO.FileInfo[]]$files,[string]$classes){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $args=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
  $result=Invoke-Child 'javac' $args $root
  if($result.Exit-ne0-or$result.Out.Length-ne0-or$result.Err.Length-ne0){throw 'compile output drift'}
  return 0
}
function Run([string]$classes,[string]$main){
  $result=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,$main) $root
  if($result.Exit-ne0-or$result.Err.Length-ne0){throw "$main process drift"};return $result.Out
}
function Remove-JavaComments([string]$text){return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
function Groups([object[]]$records){
  $groups=0;$previous=$null
  foreach($record in $records){if($record.Thread-cne$previous){$groups++;$previous=$record.Thread}}
  return $groups
}
function Validate-Ex14([string]$text){
  $lines=@($text.TrimEnd([char]10).Split([char]10));if($lines.Count-ne212){throw 'Ex14 line drift'}
  $records=[Collections.Generic.List[object]]::new()
  foreach($line in $lines){if($line-match'^(\d+):(dog|cat|tiger|lion)$'){$records.Add([pscustomobject]@{Value=[int]$Matches[1];Thread=$Matches[2]})}}
  if($records.Count-ne200){throw 'Ex14 value count drift'}
  for($i=0;$i-lt200;$i++){if($records[$i].Value-ne($i+1)){throw 'Ex14 sequence drift'}}
  foreach($thread in @('dog','cat','tiger','lion')){if(@($records|Where-Object Thread -ceq $thread).Count-ne50){throw 'Ex14 ownership drift'}}
  if((Groups $records)-ne4-or@($lines|Where-Object{$_-match'^준비중\.\.\.(dog|cat|tiger|lion)$'}).Count-ne4-or@($lines|Where-Object{$_-match'^작업 완료 : (dog|cat|tiger|lion)$'}).Count-ne4-or@($lines|Where-Object{$_-ceq'=========================='}).Count-ne4){throw 'Ex14 structure drift'}
  return 'ex14=212lines,200values,1..200,threads4x50,blocks4'
}
function Validate-Ex18([string]$text){
  $lines=@($text.TrimEnd([char]10).Split([char]10));$records=[Collections.Generic.List[object]]::new()
  foreach($line in $lines){if($line-match'^(dog|cat) : (\d+)$'){$records.Add([pscustomobject]@{Thread=$Matches[1];Value=[int]$Matches[2]})}}
  if($lines.Count-ne200-or$records.Count-ne200){throw 'Ex18 count drift'}
  for($i=0;$i-lt200;$i++){if($records[$i].Value-ne($i+1)){throw 'Ex18 sequence drift'}}
  foreach($thread in @('dog','cat')){if(@($records|Where-Object Thread -ceq $thread).Count-ne100){throw 'Ex18 ownership drift'}}
  if((Groups $records)-ne2){throw 'Ex18 block drift'}
  return 'ex18=200lines,1..200,threads2x100,blocks2'
}
function Validate-Study([string]$text){
  $lines=@($text.TrimEnd([char]10).Split([char]10));$records=[Collections.Generic.List[object]]::new()
  foreach($line in $lines){if($line-match'^(\d+) : (first|second)$'){$records.Add([pscustomobject]@{Value=[int]$Matches[1];Thread=$Matches[2]})}}
  if($lines.Count-ne200-or$records.Count-ne200){throw 'Study01 count drift'}
  for($i=0;$i-lt200;$i++){if($records[$i].Value-ne($i+1)){throw 'Study01 sequence drift'}}
  foreach($thread in @('first','second')){if(@($records|Where-Object Thread -ceq $thread).Count-ne100){throw 'Study01 ownership drift'}}
  if((Groups $records)-ne2){throw 'Study01 block drift'}
  return 'study01=200lines,1..200,threads2x100,blocks2'
}
function Audit([string]$mode,[string]$class11){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Dthread03.audit=javac';$env:JDK_JAVA_OPTIONS='-Dthread03.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Dthread03.audit=tool';$env:_JAVA_OPTIONS='-Dthread03.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package=@(Get-ChildItem -LiteralPath $class11 -Filter '*.java'|Sort-Object Name)
  $inventoryNames=@('Ex13_Synchronized.java','Ex14_Main.java','Ex17_Synchronized.java','Study01_Thread.java')
  $expandedNames=$inventoryNames+@('Ex18_Main.java','Study01.java')
  $inventory=@($inventoryNames|ForEach-Object{Get-Item -LiteralPath (Join-Path $class11 $_)})
  $expanded=@($expandedNames|ForEach-Object{Get-Item -LiteralPath (Join-Path $class11 $_)})
  if($package.Count-ne24-or$inventory.Count-ne4-or$expanded.Count-ne6){throw 'inventory drift'}
  $before=@{};foreach($file in $expanded){$before[$file.Name]=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash}
  $packageWarnings=Compile $package (Join-Path $root ("package-"+$mode))
  $inventoryWarnings=Compile $inventory (Join-Path $root ("inventory-"+$mode))
  $copy=Join-Path $root ("source-"+$mode);New-Item -ItemType Directory -Path $copy -ErrorAction Stop|Out-Null
  foreach($file in $expanded){[IO.File]::Copy($file.FullName,(Join-Path $copy $file.Name),$false)}
  $copies=@(Get-ChildItem -LiteralPath $copy -Filter '*.java'|Sort-Object Name)
  $classes=Join-Path $root ("expanded-"+$mode);$expandedWarnings=Compile $copies $classes
  $mainPattern='public\s+static\s+void\s+main\s*\('
  $packageMains=@($package|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  $inventoryMains=@($inventory|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  $expandedMains=@($expanded|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  if($packageMains-ne11-or$inventoryMains-ne1-or$expandedMains-ne3){throw 'main role drift'}
  $ex14=Validate-Ex14 (Run $classes 'com.java.class11.Ex14_Main')
  $ex18=Validate-Ex18 (Run $classes 'com.java.class11.Ex18_Main')
  $study=Validate-Study (Run $classes 'com.java.class11.Study01')
  foreach($file in $expanded){if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash-cne$before[$file.Name]){throw 'original hash drift'}}
  $active=@{};foreach($file in $expanded){$active[$file.Name]=Remove-JavaComments([IO.File]::ReadAllText($file.FullName))};$joined=$active.Values-join$nl
  $shape=@{runnable=([regex]::Matches($joined,'implements\s+Runnable\b')).Count;sync=([regex]::Matches($joined,'\bsynchronized\b')).Count;loops=([regex]::Matches($joined,'\bfor\s*\(')).Count;increment=([regex]::Matches($joined,'\+\+x\b')).Count;threads=([regex]::Matches($joined,'new\s+Thread\s*\(')).Count;sleep=([regex]::Matches($joined,'Thread\.sleep\s*\(')).Count}
  if($shape.runnable-ne3-or$shape.sync-ne3-or$shape.loops-ne3-or$shape.increment-ne3-or$shape.threads-ne8-or$shape.sleep-ne1){throw 'source shape drift'}
  return "package=24,warnings=$packageWarnings,mains=11|inventory=4,warnings=$inventoryWarnings,mains=1|expanded=6,warnings=$expandedWarnings,mains=3;$ex14|$ex18|$study|shapes=Runnable:3|synchronized:3|loops:3|increment:3|newThread:8|sleep:1|hashes:6/6"
}

try{
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'};New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  $source=[IO.Path]::GetFullPath($SourceRoot);$class11=Join-Path $source 'src/com/java/class11'
  $baseline=Audit 'baseline' $class11;$hostile=Audit 'hostile' $class11;if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline";'privacy=stdout-only|fixture=owned-temp;launcherOptions=4'
}catch{$bodyError=$_.Exception}finally{
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){try{if($saved[$name].Exists){Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop;$restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}}else{Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}}}catch{$finalErrors.Add($_.Exception)}}
  try{if($ownsRoot){$resolved=[IO.Path]::GetFullPath($root);if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe cleanup'};if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop};if(Test-Path -LiteralPath $resolved){throw 'cleanup failed'}}}catch{$finalErrors.Add($_.Exception)}
  if($null-ne$bodyError){$finalErrors.Insert(0,$bodyError)};if($finalErrors.Count-eq1){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()};if($finalErrors.Count-gt1){throw[AggregateException]::new('audit and cleanup failures',$finalErrors.ToArray())}
}`,
    walkthrough: [
      { lines: "1-11", explanation: "launcher options와 공백 포함 owned temp root, restore/error state를 준비합니다." },
      { lines: "13-41", explanation: "argument list, 동시 pipe drain, timeout/tree kill과 warning0 compile/run helpers를 정의합니다." },
      { lines: "42-47", explanation: "comments 제거와 thread ownership transition 수를 세는 helpers를 정의합니다." },
      { lines: "48-58", explanation: "Ex14의212 lines, 1..200, four threads×50, four lock blocks와 외부 lines를 검증합니다." },
      { lines: "59-76", explanation: "Ex18과 Study01의 서로 다른 출력 형식에서 two threads×100과 two lock blocks를 검증합니다." },
      { lines: "77-103", explanation: "package/inventory/expanded compile roles, temp source copy, 세 mains와 원본 hash를 감사합니다." },
      { lines: "104-107", explanation: "active source의 Runnable·synchronized·loop·increment·Thread·sleep shape를 exact count합니다." },
      { lines: "110-120", explanation: "baseline/hostile semantic summaries를 비교하고 launcher restore와 direct-child cleanup failures를 보존합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "baseline+hostile launcher modes", "owned temp source/classes only"], command: "pwsh -NoProfile -File verify-original-thread03.ps1 -SourceRoot <classstudy-root>" },
    output: { value: "spacePath=True,modes=2|same=True,package=24,warnings=0,mains=11|inventory=4,warnings=0,mains=1|expanded=6,warnings=0,mains=3;ex14=212lines,200values,1..200,threads4x50,blocks4|ex18=200lines,1..200,threads2x100,blocks2|study01=200lines,1..200,threads2x100,blocks2|shapes=Runnable:3|synchronized:3|loops:3|increment:3|newThread:8|sleep:1|hashes:6/6\nprivacy=stdout-only|fixture=owned-temp;launcherOptions=4", explanation: ["원본 compile은 warning0이고 source hashes6가 유지됩니다.", "스레드 이름 순서가 달라도 숫자·ownership block invariant는 같습니다.", "원본 경로와 원시 source text는 stdout에 노출하지 않습니다."] },
    experiments: [
      { change: "Ex14에서 각 thread마다 새 Ex13 instance를 전달합니다.", prediction: "각 instance의 x와 monitor가 분리되어 전체1..200 대신 각1..50이 반복됩니다.", result: "공유 상태와 lock identity가 같은 보호 단위인지 먼저 확인합니다." },
      { change: "Ex13 synchronized block을 loop body의 println만 감싸고 ++x를 밖으로 옮깁니다.", prediction: "출력 자체는 직렬화되어 보여도 increment lost update로 값 중복·누락이 가능합니다.", result: "관찰 코드가 아니라 read-modify-write 전체를 보호합니다." },
      { change: "Thread.sleep을 synchronized block 안으로 옮깁니다.", prediction: "sleep 중에도 this monitor를 보유해 다른 세 thread의 진행을 불필요하게 막습니다.", result: "blocking은 invariant에 꼭 필요한 경우가 아니면 lock 밖으로 옮깁니다." },
    ],
    sourceRefs: ["java-class11-ex13", "java-class11-ex14", "java-class11-ex17", "java-class11-study01-thread", "java-class11-ex18", "java-class11-study01", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "java-thread-api", "jls-synchronized", "jls-happens-before"],
  }],
  diagnostics: [
    { symptom: "동기화했는데 각 thread가1부터 다시 시작한다.", likelyCause: "각 thread에 서로 다른 Runnable instance를 주어 x와 this monitor가 모두 분리되었습니다.", checks: ["identityHashCode가 아니라 실제 reference sharing을 확인합니다.", "Thread constructors에 전달한 target을 봅니다.", "보호하려는 state owner와 lock owner를 표시합니다."], fix: "공유해야 하는 state를 한 owner로 모으고 모든 접근이 같은 monitor 또는 명시 lock을 사용하게 합니다.", prevention: "multi-thread fixture에서 total range와 lock identity를 함께 assertion합니다." },
    { symptom: "출력은1..200이지만 thread가 한 번씩 50/100개를 독점해 응답성이 나쁘다.", likelyCause: "loop 전체를 synchronized로 감싸 mutual exclusion 범위가 업무 transaction보다 넓습니다.", checks: ["monitor hold duration을 측정합니다.", "loop iteration 간 invariant가 필요한지 봅니다.", "I/O·sleep·formatting이 lock 안인지 확인합니다."], fix: "필요한 state transition만 atomic하게 하고 immutable snapshot 이후 작업은 lock 밖으로 옮깁니다.", prevention: "lock scope review와 wait/hold percentiles를 운영 기준에 둡니다." },
  ],
  expertNotes: ["A deterministic concurrency test controls the interleaving or verifies invariants; repeating a flaky race until it appears is evidence of probability, not a complete correctness proof.", "The original synchronized loops are correct for unique counter output but do not promise fairness or alternating thread names."],
};

(session.chapters as DetailedSession["chapters"]).push(originalAuditChapter);

const raceAndMonitorChapters: DetailedSession["chapters"] = [
  {
    id: "lost-update-read-modify-write-controlled-interleaving",
    title: "++를 read·modify·write로 펼치고 barrier로 lost update를 매번 재현합니다",
    lead: "실행 횟수를 늘려 운 좋게 race를 보는 대신 두 스레드가 같은 old value를 읽은 뒤 쓰도록 interleaving을 제어해 원인과 수정 경계를 증명합니다.",
    explanations: [
      "source의 ++x 한 줄은 논리적으로 current value read, one add, result write의 복합 연산입니다. 두 thread가 같은 old value를 읽으면 둘 다 같은 new value를 써 증가 하나가 사라집니다.",
      "race condition은 결과가 상대 실행 timing에 의존하는 더 넓은 개념이고 data race는 happens-before로 ordered되지 않은 conflicting memory access입니다. lost update는 이 둘이 값 무결성에 드러난 대표 결과입니다.",
      "println이 내부적으로 동기화될 수 있어도 counter read/write를 같은 critical section에 넣어 주지 않습니다. 출력 line이 깨끗하다는 사실은 business state가 atomic하다는 증거가 아닙니다.",
      "sleep으로 timing을 맞추면 느린 machine이나 JIT warmup에서 재현률만 달라집니다. 예제는 CountDownLatch로 두 read가 끝난 뒤 두 write를 허용해 unsafe 결과1을 deterministic하게 만듭니다.",
      "Thread.join은 main이 두 workers의 완료와 writes를 관찰하게 합니다. join 없이 즉시 출력하면 race 자체와 main의 premature observation이 섞여 진단이 흐려집니다.",
      "수정본의 synchronized increment는 같은 SafeCounter this monitor에서 read-modify-write 전체를 mutual exclusion합니다. 결과2는 개별 read/write visibility뿐 아니라 compound operation atomicity가 필요함을 보여 줍니다.",
      "volatile int로 바꾸어도 각 read/write visibility는 좋아지지만 value++ 전체가 하나의 atomic action이 되지는 않습니다. 단순 counter라면 AtomicInteger.incrementAndGet도 후보입니다.",
      "production test는 expected unsafe failure와 safe invariant를 분리합니다. unsafe code가 항상 실패하는 것을 제품 acceptance로 삼는 것이 아니라 interleaving model을 고정해 교육·회귀 evidence로 사용합니다.",
    ],
    concepts: [
      { term: "lost update", definition: "둘 이상의 실행이 같은 이전 값을 바탕으로 계산해 나중 write가 앞선 update 효과를 덮어쓰는 anomaly입니다.", detail: ["read-modify-write가 분리됩니다.", "최종 값이 실행 횟수보다 작아집니다."], analogy: "두 사람이 같은 장부 잔액을 읽고 각각 1원을 더한 뒤 둘 다 같은 숫자를 쓰는 상황입니다." },
      { term: "data race", definition: "동일 memory location에 대한 conflicting accesses 중 적어도 하나가 write이고 두 access가 happens-before로 ordered되지 않은 상태입니다.", detail: ["결과가 우연히 맞아도 race는 존재합니다.", "JMM이 허용하는 관찰을 고려해야 합니다."] },
      { term: "controlled interleaving", definition: "latch·barrier 같은 coordination으로 관심 있는 실행 순서를 의도적으로 만든 concurrency test 방식입니다.", detail: ["sleep 확률에 기대지 않습니다.", "실패 원인을 한 interleaving으로 격리합니다."] },
    ],
    codeExamples: [{
      id: "java-deterministic-lost-update",
      title: "두 read를 barrier에 모아 unsafe1과 synchronized2를 exact 비교합니다",
      language: "java",
      filename: "LostUpdateChoreography.java",
      purpose: "++ race를 반복 횟수·scheduler 운이 아닌 재현 가능한 interleaving으로 증명합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;

public class LostUpdateChoreography {
    static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted", failure);
        }
    }
    static final class UnsafeCounter {
        int value;
        void increment(CountDownLatch bothRead) {
            int snapshot = value;
            bothRead.countDown();
            await(bothRead);
            value = snapshot + 1;
        }
    }
    static final class SafeCounter {
        int value;
        synchronized void increment() {
            value++;
        }
    }
    public static void main(String[] args) throws InterruptedException {
        UnsafeCounter unsafe = new UnsafeCounter();
        CountDownLatch bothRead = new CountDownLatch(2);
        Thread first = new Thread(() -> unsafe.increment(bothRead));
        Thread second = new Thread(() -> unsafe.increment(bothRead));
        first.start(); second.start();
        first.join(); second.join();

        SafeCounter safe = new SafeCounter();
        Thread third = new Thread(safe::increment);
        Thread fourth = new Thread(safe::increment);
        third.start(); fourth.start();
        third.join(); fourth.join();
        System.out.println("unsafe=" + unsafe.value);
        System.out.println("safe=" + safe.value);
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "CountDownLatch와 interrupt status를 복원하는 bounded coordination helper를 준비합니다." },
        { lines: "12-20", explanation: "unsafe increment가 snapshot을 읽고 두 read가 완료될 때까지 기다린 뒤 같은1을 씁니다." },
        { lines: "21-26", explanation: "SafeCounter는 read-modify-write 전체를 this monitor로 보호합니다." },
        { lines: "27-34", explanation: "두 unsafe workers를 시작하고 join해 deterministic lost update를 확정합니다." },
        { lines: "35-43", explanation: "두 safe workers를 같은 방식으로 완료한 뒤1과2를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "CountDownLatch controlled interleaving", "two joined workers", "-Xlint:all warning0"], command: isolatedJavaRun("LostUpdateChoreography.java", "LostUpdateChoreography") },
      output: { value: "unsafe=1\nsafe=2", explanation: ["두 unsafe reads가0을 얻어 같은1을 씁니다.", "safe increment 둘은 같은 monitor에서 직렬화되어2가 됩니다.", "workers를 join해 main observation까지 확정합니다."] },
      experiments: [
        { change: "bothRead latch를 제거합니다.", prediction: "unsafe가1 또는2가 되어 test가 scheduler 확률에 의존합니다.", result: "race 교육 fixture에는 controlled interleaving을 유지합니다." },
        { change: "value에 volatile만 붙입니다.", prediction: "unsafe는 여전히 둘 다0을 읽어1을 쓸 수 있습니다.", result: "visibility와 compound atomicity를 분리합니다." },
        { change: "join 전에 값을 출력합니다.", prediction: "0·1·2 관찰이 worker completion 문제와 섞입니다.", result: "test observer의 happens-before도 명시합니다." },
      ],
      sourceRefs: ["java-count-down-latch", "java-thread-api", "jls-synchronized", "jls-happens-before", "jls-actions-order"],
    }],
    diagnostics: [
      { symptom: "counter가 대개 정상이라 race가 없다고 판단했다.", likelyCause: "low contention과 scheduler 우연이 conflicting accesses를 가렸습니다.", checks: ["read/write를 단계로 펼칩니다.", "같은 old value read를 barrier로 만듭니다.", "happens-before edge를 그립니다."], fix: "controlled interleaving에서 실패를 재현하고 compound action 전체를 같은 synchronization으로 보호합니다.", prevention: "race regression에 latch/barrier와 exact invariant를 사용합니다." },
      { symptom: "volatile을 붙였지만 count가 가끔 작다.", likelyCause: "volatile read/write는 visibility를 주지만 ++의 read-modify-write를 atomic하게 합치지 않습니다.", checks: ["operation이 단일 read/write인지 봅니다.", "lost-update timeline을 만듭니다.", "AtomicInteger 또는 lock semantics를 비교합니다."], fix: "synchronized/AtomicInteger updateAndGet 등 필요한 atomic primitive를 사용합니다.", prevention: "field modifier가 아니라 operation contract를 review합니다." },
    ],
    expertNotes: ["A data-race-free execution receives the Java Memory Model's sequential consistency guarantee for correctly synchronized programs; that does not mean every high-level operation is atomic unless its whole invariant is guarded.", "CountDownLatch itself contributes synchronization edges, so this fixture uses it deliberately to force the pre-write snapshots, not to claim the unsafe field became correctly guarded."],
  },
  {
    id: "monitor-mutual-exclusion-and-object-invariants",
    title: "같은 monitor에서 balance invariant와 max concurrent entry를 함께 검증합니다",
    lead: "단순히 결과 숫자 하나를 맞추는 데서 끝내지 않고 critical section 안에 동시에 둘 이상 들어오지 않았다는 구조적 증거와 업무 불변식을 함께 확인합니다.",
    explanations: [
      "synchronized instance method를 호출하려면 thread가 대상 객체의 monitor를 획득해야 합니다. 다른 thread가 같은 monitor를 보유하면 entry set에서 기다립니다.",
      "mutual exclusion은 critical section 실행을 한 번에 하나로 제한합니다. 예제의 activeInside와 maxInside도 같은 monitor 아래에서 갱신해 최대 진입 수가1임을 측정합니다.",
      "balance만0인지 보면 +1000과 -1000이 우연히 상쇄됐는지, 실제로 serialization됐는지 구분하기 어렵습니다. operations4000과 maxInside1을 함께 검증해 evidence를 보강합니다.",
      "불변식은 흔히 여러 fields에 걸칩니다. available+reserved=total 같은 관계라면 각 field에 다른 lock을 붙이지 말고 관계를 읽고 바꾸는 transition 전체를 같은 경계로 묶습니다.",
      "getter도 synchronization discipline에 포함됩니다. writer만 잠그고 reader가 raw field를 읽으면 stale 또는 중간 state를 관찰할 수 있습니다.",
      "monitor를 캡슐화하면 caller가 장시간 lock을 잡거나 lock order를 뒤집기 어렵습니다. public lock object 대신 private final lock 또는 synchronized methods를 고려합니다.",
      "synchronized는 JVM process 내부 coordination입니다. 여러 JVM·container·service가 같은 database row를 수정하면 database transaction, version column 또는 distributed protocol이 필요합니다.",
      "lock correctness와 throughput은 다른 acceptance axis입니다. 먼저 invariant를 보장하고 contention profile에서 lock 분할이나 immutable design을 평가합니다.",
    ],
    concepts: [
      { term: "mutual exclusion", definition: "같은 lock으로 보호된 구간에 동시에 최대 한 실행만 들어가게 하는 성질입니다.", detail: ["동일 lock identity가 전제입니다.", "가시성 규칙과 함께 쓰입니다."] },
      { term: "guarded invariant", definition: "특정 lock을 보유할 때만 읽고 변경하도록 규칙화한 객체 상태 관계입니다.", detail: ["모든 access path가 따라야 합니다.", "문서와 assertions로 남깁니다."], analogy: "금고 속 여러 장부를 하나의 열쇠 아래에서 함께 맞추는 것과 같습니다." },
      { term: "contention", definition: "여러 threads가 같은 lock을 동시에 원해 대기하거나 scheduling되는 경쟁 상태입니다.", detail: ["wait time과 hold time을 분리합니다.", "hot key에서 집중됩니다."] },
    ],
    codeExamples: [{
      id: "java-monitor-invariant",
      title: "네 workers의 4000 transitions에서 balance0과 maxInside1을 검증합니다",
      language: "java",
      filename: "MonitorInvariant.java",
      purpose: "동일 monitor의 mutual exclusion과 business invariant를 exact aggregate로 확인합니다.",
      code: String.raw`public class MonitorInvariant {
    record Snapshot(int balance, int operations, int maxInside) {}
    static final class Wallet {
        private int balance;
        private int operations;
        private int activeInside;
        private int maxInside;
        synchronized void change(int delta) {
            activeInside++;
            maxInside = Math.max(maxInside, activeInside);
            balance += delta;
            operations++;
            activeInside--;
        }
        synchronized Snapshot snapshot() {
            return new Snapshot(balance, operations, maxInside);
        }
    }
    static Thread worker(Wallet wallet, int delta) {
        return new Thread(() -> {
            for (int i = 0; i < 1_000; i++) {
                wallet.change(delta);
            }
        });
    }
    public static void main(String[] args) throws InterruptedException {
        Wallet wallet = new Wallet();
        Thread[] workers = {
            worker(wallet, 1), worker(wallet, 1),
            worker(wallet, -1), worker(wallet, -1)
        };
        for (Thread worker : workers) worker.start();
        for (Thread worker : workers) worker.join();
        Snapshot result = wallet.snapshot();
        System.out.println("balance=" + result.balance());
        System.out.println("operations=" + result.operations());
        System.out.println("maxInside=" + result.maxInside());
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "관찰 결과를 immutable Snapshot record로 정의합니다." },
        { lines: "3-18", explanation: "Wallet의 모든 mutable fields와 transition/snapshot을 같은 this monitor로 보호합니다." },
        { lines: "19-25", explanation: "한 worker가 동일 delta를1000번 적용하도록 만들고 출력은 하지 않습니다." },
        { lines: "26-33", explanation: "+ workers2와 - workers2를 시작한 뒤 모두 join합니다." },
        { lines: "34-38", explanation: "최종 balance, transition count와 critical-section 최대 동시 진입을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "four platform threads", "shared Wallet monitor", "-Xlint:all warning0"], command: isolatedJavaRun("MonitorInvariant.java", "MonitorInvariant") },
      output: { value: "balance=0\noperations=4000\nmaxInside=1", explanation: ["+2000과 -2000이 모두 반영되어 balance0입니다.", "누락 없이 transitions4000입니다.", "같은 monitor 안의 active count는 절대1을 넘지 않습니다."] },
      experiments: [
        { change: "change에서 synchronized를 제거합니다.", prediction: "balance/operations/maxInside 중 하나 이상이 drift할 수 있지만 매 run 실패가 보장되지는 않습니다.", result: "controlled race fixture와 stress invariant를 함께 둡니다." },
        { change: "snapshot만 non-synchronized로 바꿉니다.", prediction: "workers 완료 전 관찰에서는 stale 또는 cross-field inconsistent snapshot 위험이 생깁니다.", result: "read path도 같은 guard policy에 포함합니다." },
        { change: "println을 change 안에 추가합니다.", prediction: "값은 맞아도 lock hold time과 contention이 크게 늘어납니다.", result: "관찰 data만 capture하고 formatting/output은 lock 밖에서 합니다." },
      ],
      sourceRefs: ["java-thread-api", "jls-synchronized", "jls-happens-before", "java-object-api", "java-math-api"],
    }],
    diagnostics: [
      { symptom: "writer는 synchronized인데 dashboard가 음수 중간 값을 읽는다.", likelyCause: "reader가 guard 없이 여러 fields를 따로 읽어 coherent snapshot을 얻지 못했습니다.", checks: ["모든 getters와 serialization paths를 찾습니다.", "같은 lock을 쓰는지 확인합니다.", "snapshot 시 workers lifecycle을 봅니다."], fix: "같은 monitor 안에서 immutable snapshot을 한 번에 만들고 밖에서 표시합니다.", prevention: "guarded-by policy에 reads와 writes 모두를 포함합니다." },
      { symptom: "정확성은 맞지만 hot account에서 latency가 급증한다.", likelyCause: "한 global monitor에 unrelated accounts와 느린 work가 모였습니다.", checks: ["wait/hold time을 분리합니다.", "account별 contention distribution을 봅니다.", "lock 안 I/O/callback을 찾습니다."], fix: "invariant가 독립인 state를 partition하고 slow work를 snapshot 이후 밖으로 이동합니다.", prevention: "correctness test와 별도 contention SLO를 운영합니다." },
    ],
    expertNotes: ["Thread safety is a property of the complete abstraction and its access paths, not of an isolated synchronized method.", "The activeInside probe is itself guarded; an unsynchronized diagnostic counter could introduce the very race it claims to measure."],
  },
  {
    id: "lock-identity-instance-class-private-monitor",
    title: "this·Class·private lock의 identity를 구분하고 다른 instance lock의 실패를 재현합니다",
    lead: "synchronized라는 단어가 있다는 사실보다 공유 state를 접근하는 모든 code path가 정확히 같은 lock identity를 사용하는지가 중요합니다.",
    explanations: [
      "instance synchronized method는 receiver인 this를 잠급니다. 같은 instance에서 호출해야 경쟁하고, 서로 다른 instances라면 동시에 들어갈 수 있습니다.",
      "static synchronized method는 declaring class의 Class object를 잠급니다. static mutable state를 모든 instances가 공유한다면 class lock이 한 가지 가능한 guard입니다.",
      "synchronized(SomeClass.class)도 같은 class monitor를 사용합니다. instance lock과 class lock은 서로 다른 monitors이므로 섞으면 같은 field를 보호하지 못합니다.",
      "publicly reachable lock은 외부 code가 알 수 없는 시간 동안 획득해 liveness를 깨뜨릴 수 있습니다. composition이 필요하지 않다면 private final Object lock으로 캡슐화합니다.",
      "String literal, boxed small Integer, ClassLoader-wide singleton처럼 intern/cache되는 객체를 우연한 lock으로 사용하면 unrelated code와 interference가 생길 수 있습니다.",
      "예제의 두 Worker instances는 각자 this monitor를 획득하므로 둘 다 static shared0을 읽을 수 있습니다. barrier 뒤 같은1을 써 lost update가 exact 재현됩니다.",
      "fixed method는 static synchronized이므로 두 calls가 LockIdentity.class에서 직렬화되고 shared는2가 됩니다.",
      "lock identity 변경은 단순 refactor가 아닙니다. 보호하는 state set, acquisition order와 외부 callers가 달라지므로 concurrency contract change로 review합니다.",
    ],
    concepts: [
      { term: "lock identity", definition: "동기화 경쟁과 happens-before 관계를 실제로 연결하는 동일 monitor object reference입니다.", detail: ["syntax가 같아도 object가 다르면 보호되지 않습니다.", "state ownership과 함께 설계합니다."] },
      { term: "class monitor", definition: "static synchronized method 또는 synchronized(Type.class)가 획득하는 해당 Class object monitor입니다.", detail: ["instance monitors와 별개입니다.", "ClassLoader 경계도 고려합니다."] },
      { term: "private lock", definition: "외부 code가 획득하지 못하도록 owner 내부에 숨긴 final lock object입니다.", detail: ["uncontrolled interference를 줄입니다.", "여러 methods가 같은 invariant를 공유할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-lock-identity",
      title: "서로 다른 this locks의 lost update와 하나의 Class lock 결과를 비교합니다",
      language: "java",
      filename: "LockIdentity.java",
      purpose: "synchronized keyword가 아니라 monitor object의 동일성이 shared static state 보호를 결정함을 증명합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;

public class LockIdentity {
    private static int shared;
    static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted", failure);
        }
    }
    static final class Worker {
        synchronized void brokenIncrement(CountDownLatch bothRead) {
            int snapshot = shared;
            bothRead.countDown();
            await(bothRead);
            shared = snapshot + 1;
        }
    }
    static synchronized void fixedIncrement() {
        shared++;
    }
    public static void main(String[] args) throws InterruptedException {
        Worker left = new Worker();
        Worker right = new Worker();
        CountDownLatch bothRead = new CountDownLatch(2);
        Thread first = new Thread(() -> left.brokenIncrement(bothRead));
        Thread second = new Thread(() -> right.brokenIncrement(bothRead));
        first.start(); second.start();
        first.join(); second.join();
        int broken = shared;

        shared = 0;
        Thread third = new Thread(LockIdentity::fixedIncrement);
        Thread fourth = new Thread(LockIdentity::fixedIncrement);
        third.start(); fourth.start();
        third.join(); fourth.join();
        System.out.println("instanceLocks=" + broken);
        System.out.println("classLock=" + shared);
        System.out.println("sameObject=" + (left == right));
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "static shared field와 interrupt-preserving latch helper를 준비합니다." },
        { lines: "13-20", explanation: "각 Worker의 this lock 안에서 같은 static snapshot을 읽고 barrier 뒤1을 씁니다." },
        { lines: "21-23", explanation: "fixed increment는 LockIdentity.class monitor를 사용합니다." },
        { lines: "24-33", explanation: "서로 다른 Worker objects에서 broken path를 실행해 shared1을 보존합니다." },
        { lines: "34-43", explanation: "class-lock path를 두 번 실행해2와 object identity false를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "two distinct instance monitors", "one Class monitor", "-Xlint:all warning0"], command: isolatedJavaRun("LockIdentity.java", "LockIdentity") },
      output: { value: "instanceLocks=1\nclassLock=2\nsameObject=false", explanation: ["다른 this locks는 static shared update를 직렬화하지 못합니다.", "하나의 Class monitor에서는 두 increments가 모두 반영됩니다.", "left와 right가 다른 objects임을 함께 확인합니다."] },
      experiments: [
        { change: "두 threads 모두 left를 사용합니다.", prediction: "brokenIncrement도 같은 this monitor에서 직렬화되어2가 되지만 barrier를 lock 안에 두었으므로 서로 기다리며 deadlock합니다.", result: "coordination barrier를 critical section 안에 넣는 test 설계 위험도 검토합니다." },
        { change: "fixedIncrement를 instance synchronized로 바꿉니다.", prediction: "서로 다른 receivers를 쓰면 다시 static field lost update가 가능합니다.", result: "static state와 chosen guard를 문서화합니다." },
        { change: "private lock 대신 문자열 literal을 잠급니다.", prediction: "다른 code가 같은 interned literal을 잠가 예기치 않은 contention을 만들 수 있습니다.", result: "전용 private final lock을 사용합니다." },
      ],
      sourceRefs: ["java-count-down-latch", "java-thread-api", "java-class-api", "jls-synchronized", "jls-happens-before"],
    }],
    diagnostics: [
      { symptom: "모든 methods에 synchronized가 있는데 static count가 누락된다.", likelyCause: "각 instance method가 서로 다른 this monitor를 잠그고 static field는 공유합니다.", checks: ["receiver identities를 추적합니다.", "field가 static인지 확인합니다.", "instance/class/private locks를 표로 만듭니다."], fix: "공유 state owner와 일치하는 하나의 guard를 선택하고 모든 access paths를 통일합니다.", prevention: "concurrency review에 state→lock mapping을 필수화합니다." },
      { symptom: "관련 없는 component가 가끔 오래 block된다.", likelyCause: "public object, String literal 또는 Class monitor를 외부 code와 공유해 accidental lock coupling이 생겼습니다.", checks: ["thread dump lock object를 봅니다.", "synchronized targets를 search합니다.", "외부 callback이 lock을 잡는지 확인합니다."], fix: "가능하면 private final lock 또는 encapsulated concurrent abstraction으로 분리합니다.", prevention: "lock objects를 API로 노출하지 않고 ownership을 문서화합니다." },
    ],
    expertNotes: ["Class objects are scoped by class loader; code that assumes one global Class monitor across isolated loaders can still be wrong.", "Changing a lock object can break happens-before relationships even when mutual exclusion appears preserved in a local test."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...raceAndMonitorChapters);

const visibilityAndScopeChapters: DetailedSession["chapters"] = [
  {
    id: "monitor-happens-before-visibility-publication",
    title: "같은 monitor의 unlock→subsequent lock happens-before로 coherent snapshot을 공개합니다",
    lead: "synchronized를 한 번에 한 thread만 들어가는 문으로만 보지 않고 앞선 write를 뒤의 reader가 관찰하게 하는 Java Memory Model ordering으로 이해합니다.",
    explanations: [
      "Java Memory Model에서 한 monitor의 unlock은 그 monitor를 뒤이어 lock하는 action보다 happens-before입니다. 따라서 writer가 lock 안에서 만든 state는 같은 lock을 획득한 reader에 visible합니다.",
      "happens-before는 wall-clock 시간이 먼저였다는 뜻이 아니라 memory effects가 관찰되도록 보장하는 partial order입니다. source line 순서, synchronization order와 transitive closure를 함께 봅니다.",
      "mutual exclusion과 visibility는 관련되지만 다른 질문입니다. balance update가 겹치지 않는가와 reader가 완성된 balance/version pair를 보는가는 모두 같은 discipline이 필요합니다.",
      "writer만 synchronized이고 reader가 raw fields를 읽으면 monitor edge가 연결되지 않습니다. reader도 같은 monitor를 lock하거나 volatile/immutable safe publication 같은 다른 올바른 edge를 써야 합니다.",
      "예제는 message와 version을 한 monitor에서 publish하고 같은 monitor에서 immutable Snapshot으로 읽습니다. `Thread.holdsLock(this)`가 snapshot construction 시 실제 lock ownership을 확인합니다.",
      "main의 producer.join도 producer actions와 join return 사이 happens-before를 제공합니다. 이 예제는 monitor snapshot API의 구조를 보여 주며 runtime 한 번만으로 monitor edge를 독립 측정했다고 과장하지 않습니다.",
      "final fields는 올바르게 constructed된 object의 안전한 초기화에 특별 규칙이 있지만 constructor 중 this escape가 있으면 전제가 깨집니다. mutable 후속 version은 별도 synchronization이 필요합니다.",
      "잘 동기화된 program은 data-race-free discipline을 유지해야 reasoning이 단순해집니다. 필드마다 임시 volatile을 붙이는 방식보다 state owner의 publication protocol을 문서화합니다.",
    ],
    concepts: [
      { term: "happens-before", definition: "한 action의 memory effects가 다른 action에 visible하도록 JMM이 보장하는 ordering 관계입니다.", detail: ["program order·monitor·volatile·start/join edges가 있습니다.", "transitive하게 연결됩니다."], caveat: "실제 CPU 시간의 완전한 전후 순서와 동일하지 않습니다." },
      { term: "safe publication", definition: "다른 thread가 object reference와 그 object의 초기화된 state를 올바르게 관찰하도록 정해진 synchronization edge로 공개하는 행위입니다.", detail: ["lock, volatile, static initialization 등이 가능합니다.", "constructor this escape를 피합니다."] },
      { term: "coherent snapshot", definition: "서로 관계있는 여러 fields를 하나의 유효한 state version으로 함께 관찰한 immutable 값입니다.", detail: ["같은 guard 아래 복사합니다.", "소비는 lock 밖에서 할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-monitor-visibility-snapshot",
      title: "message·version을 같은 monitor에서 publish/read하고 lock ownership을 확인합니다",
      language: "java",
      filename: "MonitorVisibilitySnapshot.java",
      purpose: "monitor visibility contract와 coherent immutable snapshot API를 exact output으로 연결합니다.",
      code: String.raw`public class MonitorVisibilitySnapshot {
    record Snapshot(String message, int version, boolean lockHeld) {}
    static final class Mailbox {
        private String message = "empty";
        private int version;
        synchronized void publish(String next) {
            message = next;
            version++;
        }
        synchronized Snapshot read() {
            return new Snapshot(message, version, Thread.holdsLock(this));
        }
    }
    public static void main(String[] args) throws InterruptedException {
        Mailbox mailbox = new Mailbox();
        Thread producer = new Thread(() -> mailbox.publish("ready"));
        producer.start();
        producer.join();
        Snapshot snapshot = mailbox.read();
        System.out.println("message=" + snapshot.message());
        System.out.println("version=" + snapshot.version());
        System.out.println("lockHeld=" + snapshot.lockHeld());
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "서로 관계있는 message/version과 관측 증거를 immutable record로 정의합니다." },
        { lines: "3-13", explanation: "publish와 read가 모두 같은 Mailbox this monitor를 사용합니다." },
        { lines: "14-19", explanation: "producer를 시작·join하고 monitor-protected snapshot을 얻습니다." },
        { lines: "20-22", explanation: "coherent values와 snapshot construction 시 lock ownership을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "one producer and main reader", "same Mailbox monitor", "-Xlint:all warning0"], command: isolatedJavaRun("MonitorVisibilitySnapshot.java", "MonitorVisibilitySnapshot") },
      output: { value: "message=ready\nversion=1\nlockHeld=true", explanation: ["message와 version이 같은 published state입니다.", "read method 진입 시 this monitor를 보유합니다.", "join으로 producer completion도 명시합니다."] },
      experiments: [
        { change: "read에서 synchronized를 제거합니다.", prediction: "이 main은 join edge 덕분에 값이 보일 수 있지만 일반 concurrent reader API에는 monitor contract가 없어집니다.", result: "한 test의 다른 edge에 기대지 말고 abstraction의 read/write discipline을 유지합니다." },
        { change: "version++를 synchronized block 밖으로 옮깁니다.", prediction: "message/version pair가 서로 다른 logical states로 관찰될 수 있습니다.", result: "cross-field invariant transition을 한 critical section에 둡니다." },
        { change: "constructor에서 this를 thread에 넘깁니다.", prediction: "초기화가 끝나기 전 state가 관찰되는 unsafe publication이 될 수 있습니다.", result: "construction 완료 뒤 reference를 안전하게 공개합니다." },
      ],
      sourceRefs: ["java-thread-api", "java-thread-holds-lock", "jls-happens-before", "jls-synchronized", "jls-final-field-semantics"],
    }],
    diagnostics: [
      { symptom: "writer가 lock을 쓰는데 reader가 가끔 old version을 본다.", likelyCause: "reader가 같은 monitor를 획득하지 않아 unlock→lock happens-before edge가 연결되지 않습니다.", checks: ["writer/read lock identities를 비교합니다.", "raw field reads를 search합니다.", "start/join/volatile 등 실제 edges를 그립니다."], fix: "같은 guarded snapshot API 또는 적합한 volatile/immutable publication protocol을 사용합니다.", prevention: "state owner별 read/write happens-before 표를 유지합니다." },
      { symptom: "message는 새 값인데 version은 이전 값이다.", likelyCause: "관련 fields를 서로 다른 synchronization 경계에서 읽거나 썼습니다.", checks: ["pair의 invariant를 정의합니다.", "각 field access guard를 찾습니다.", "object escape와 callbacks를 확인합니다."], fix: "한 lock 안에서 두 fields를 commit하고 immutable snapshot으로 함께 반환합니다.", prevention: "torn logical snapshot negative fixture를 둡니다." },
    ],
    expertNotes: ["A test containing join can demonstrate a correct snapshot API but cannot empirically isolate the monitor edge because join also establishes visibility; the specification supplies the proof obligation.", "Happens-before is transitive, which is powerful but can hide accidental dependencies on unrelated synchronization in tests."],
  },
  {
    id: "intrinsic-lock-reentrancy-and-exception-release",
    title: "synchronized 재진입과 예외 시 monitor 자동 해제를 검증합니다",
    lead: "같은 thread가 같은 monitor를 다시 획득할 수 있고 abrupt completion에서도 monitor가 풀린다는 규칙을 nested call과 recovery thread로 확인합니다.",
    explanations: [
      "Java intrinsic locks는 reentrant입니다. 한 thread가 이미 this monitor를 보유한 채 다른 synchronized instance method를 호출해도 자기 자신과 deadlock하지 않습니다.",
      "JVM은 monitor ownership에 재진입 횟수를 추적하고 정상 또는 abrupt method/block exit마다 대응하는 monitor exit를 수행합니다. 바깥 획득까지 모두 나가야 다른 thread가 들어옵니다.",
      "예외가 synchronized method를 빠져나가면 monitor는 자동 해제됩니다. 그러나 business state rollback까지 자동인 것은 아니므로 partial mutation은 finally 또는 transactional design으로 복구해야 합니다.",
      "예제는 outer가 inner를 호출해 depth2를 만들고 첫 호출에서 exception을 던집니다. finally로 diagnostic depth를0으로 복원한 뒤 recovery thread가 같은 monitor를 획득합니다.",
      "calls2와 recovered=true는 첫 예외 뒤 lock이 영구적으로 남지 않았음을 보여 줍니다. maxDepth2는 nested synchronized calls가 재진입했다는 evidence입니다.",
      "catch 안에서 exception을 삼키면 caller는 state가 commit됐는지 모릅니다. concurrency boundary의 exception type, rollback point와 retry safety를 명시합니다.",
      "InterruptedException을 RuntimeException으로 바꿀 때 interrupt status와 ownership을 잃으면 cancellation protocol이 깨집니다. lock 자체의 entry는 interruptible하지 않으므로 필요하면 lockInterruptibly를 평가합니다.",
      "deprecated Thread.stop처럼 arbitrary point에 asynchronous exception을 주입하는 방식은 protected invariant를 손상시킬 수 있으므로 cooperative cancellation을 사용합니다.",
    ],
    concepts: [
      { term: "reentrancy", definition: "현재 lock owner thread가 같은 lock을 다시 획득해 nested protected call을 수행할 수 있는 성질입니다.", detail: ["횟수만큼 release해야 합니다.", "다른 thread에는 여전히 배타적입니다."] },
      { term: "abrupt completion", definition: "exception·return 등으로 statement나 method가 정상 끝까지 진행하지 않고 종료되는 JLS 개념입니다.", detail: ["monitor exit는 보장됩니다.", "application rollback은 별도입니다."] },
      { term: "exception safety", definition: "operation이 실패해도 object invariant와 자원·lock 상태가 정의된 수준으로 유지되는 성질입니다.", detail: ["partial mutation을 고려합니다.", "retry/idempotency와 연결됩니다."] },
    ],
    codeExamples: [{
      id: "java-reentrant-exception-release",
      title: "nested synchronized depth2와 exception 뒤 recovery acquisition을 확인합니다",
      language: "java",
      filename: "ReentrantExceptionRelease.java",
      purpose: "intrinsic lock의 재진입과 abrupt exit release를 deterministic하게 증명합니다.",
      code: String.raw`public class ReentrantExceptionRelease {
    static final class Gate {
        private int calls;
        private int depth;
        private int maxDepth;
        synchronized void outer(boolean fail) {
            depth++;
            maxDepth = Math.max(maxDepth, depth);
            try {
                inner();
                if (fail) throw new IllegalStateException("planned");
            } finally {
                depth--;
            }
        }
        synchronized void inner() {
            depth++;
            maxDepth = Math.max(maxDepth, depth);
            calls++;
            depth--;
        }
        synchronized int calls() { return calls; }
        synchronized int maxDepth() { return maxDepth; }
        synchronized int depth() { return depth; }
    }
    public static void main(String[] args) throws InterruptedException {
        Gate gate = new Gate();
        boolean failed = false;
        try {
            gate.outer(true);
        } catch (IllegalStateException expected) {
            failed = true;
        }
        boolean[] recovered = {false};
        Thread recovery = new Thread(() -> {
            gate.outer(false);
            recovered[0] = true;
        });
        recovery.start();
        recovery.join();
        System.out.println("failed=" + failed);
        System.out.println("calls=" + gate.calls());
        System.out.println("maxDepth=" + gate.maxDepth());
        System.out.println("depth=" + gate.depth());
        System.out.println("recovered=" + recovered[0]);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "Gate의 guarded diagnostic state와 synchronized outer entry를 정의합니다." },
        { lines: "7-15", explanation: "outer depth를 기록하고 inner 호출 뒤 계획된 exception에서도 finally로 depth를 되돌립니다." },
        { lines: "16-25", explanation: "같은 this monitor에 재진입하는 inner와 guarded accessors를 정의합니다." },
        { lines: "26-34", explanation: "첫 호출의 planned failure를 포착합니다." },
        { lines: "35-41", explanation: "다른 recovery thread가 예외 뒤 같은 monitor를 획득하고 완료합니다." },
        { lines: "42-46", explanation: "failure, nested calls/depth와 recovery 결과를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "reentrant intrinsic monitor", "planned exception and joined recovery", "-Xlint:all warning0"], command: isolatedJavaRun("ReentrantExceptionRelease.java", "ReentrantExceptionRelease") },
      output: { value: "failed=true\ncalls=2\nmaxDepth=2\ndepth=0\nrecovered=true", explanation: ["outer→inner가 같은 monitor에 depth2로 재진입합니다.", "두 calls가 모두 실행되고 diagnostic depth는0입니다.", "exception 뒤 다른 thread가 monitor를 획득합니다."] },
      experiments: [
        { change: "outer의 finally를 제거합니다.", prediction: "JVM monitor는 풀리지만 application diagnostic depth가1로 남아 business state rollback과 lock release가 다름을 보입니다.", result: "JVM 보장과 domain cleanup을 분리합니다." },
        { change: "inner를 다른 Gate instance에서 호출합니다.", prediction: "reentrancy가 아니라 두 번째 monitor 획득이 되며 order에 따라 deadlock graph가 생길 수 있습니다.", result: "nested calls의 lock identities를 기록합니다." },
        { change: "recovery.join을 제거합니다.", prediction: "main output이 recovery 완료 전 실행되어 recovered=false 또는 calls1을 볼 수 있습니다.", result: "test completion edge를 명시합니다." },
      ],
      sourceRefs: ["jls-synchronized", "jls-abrupt-completion", "java-thread-api", "java-math-api", "java-reentrant-lock"],
    }],
    diagnostics: [
      { symptom: "exception 뒤 다른 thread가 block돼 monitor leak을 의심한다.", likelyCause: "intrinsic monitor leak보다 다른 lock order, long blocking call 또는 worker가 exception을 잡고 계속 lock 안에 있을 가능성이 큽니다.", checks: ["thread dump의 owner/waiters를 봅니다.", "synchronized scope와 nested locks를 확인합니다.", "exception handler가 lock 안인지 봅니다."], fix: "blocking/callback을 밖으로 옮기고 global order를 적용하며 bounded diagnostics를 추가합니다.", prevention: "exception·timeout fault injection과 thread dump runbook을 둡니다." },
      { symptom: "monitor는 풀렸지만 account state가 반쯤 변경됐다.", likelyCause: "자동 monitor exit를 transaction rollback으로 오해했습니다.", checks: ["exception 전 mutation 순서를 봅니다.", "invariant assertion을 실행합니다.", "retry idempotency를 확인합니다."], fix: "locals에서 validate한 뒤 commit하거나 compensating/transactional update를 사용합니다.", prevention: "각 mutation point fault fixture와 strong exception-safety 목표를 정의합니다." },
    ],
    expertNotes: ["Intrinsic-lock reentrancy prevents self-deadlock on the same monitor; it does not prevent cycles across multiple monitors.", "Automatic monitor release is a language guarantee, while restoration of application state remains the programmer's responsibility."],
  },
  {
    id: "minimal-critical-section-snapshot-outside-lock",
    title: "공유 list는 짧게 mutate·snapshot하고 sort·render는 lock 밖에서 수행합니다",
    lead: "정확성을 유지하는 최소 임계구역을 찾고 CPU·formatting·I/O를 immutable snapshot 이후로 이동해 hold time과 tail latency를 줄입니다.",
    explanations: [
      "lock 범위는 짧을수록 무조건 좋은 것이 아니라 invariant를 완전하게 지키는 최소 구간이어야 합니다. validate와 commit 사이에 다른 update가 끼면 안 된다면 둘을 분리하면 안 됩니다.",
      "예제의 add는 한 item mutation만 lock 안에서 수행하고 snapshot은 같은 monitor 아래 List.copyOf로 coherent immutable copy를 만듭니다.",
      "sorting과 first/last 계산은 snapshot에서 수행하므로 owner monitor를 잡지 않습니다. 느린 formatting·network·file·user callback도 같은 pattern으로 밖으로 옮깁니다.",
      "snapshot copy 자체는 O(n)이고 lock hold cost가 있습니다. 큰 state에서는 versioned immutable structure, copy-on-write, paging 또는 database snapshot을 비교합니다.",
      "call argument 평가는 method 진입 전에 일어납니다. worker의 문자열 formatting은 synchronized add에 들어가기 전에 끝나므로 lock hold에 포함되지 않습니다.",
      "Thread.holdsLock(catalog)가 false인 상태에서 sort/render하는 것을 출력해 경계가 코드 의도대로인지 확인합니다.",
      "lock 밖에서 mutable 내부 list reference를 반환하면 caller가 guard 없이 바꾸고 iteration 중 ConcurrentModificationException이나 silent corruption을 만들 수 있습니다. defensive immutable copy가 핵심입니다.",
      "monitor wait time과 hold time을 따로 측정합니다. scope 축소는 hold를 줄이지만 acquisition 횟수를 과도하게 늘리거나 cache locality를 해칠 수 있어 실제 workload로 검증합니다.",
    ],
    concepts: [
      { term: "lock hold time", definition: "thread가 lock을 획득한 순간부터 release할 때까지의 시간입니다.", detail: ["critical work와 blocking을 포함합니다.", "tail latency에 영향을 줍니다."] },
      { term: "defensive snapshot", definition: "guarded mutable state를 한 시점의 독립된 immutable 값으로 복사해 lock 밖 소비에 사용하는 방식입니다.", detail: ["alias mutation을 막습니다.", "copy cost를 예산화합니다."] },
      { term: "open call", definition: "내부 lock을 보유하지 않은 상태에서 외부 또는 override 가능한 code를 호출하는 설계 원칙입니다.", detail: ["deadlock/reentrancy 위험을 줄입니다.", "state snapshot이 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-snapshot-outside-lock",
      title: "200 items를 짧게 추가하고 immutable snapshot을 lock 밖에서 정렬합니다",
      language: "java",
      filename: "SnapshotOutsideLock.java",
      purpose: "guarded mutation·snapshot과 expensive derivation의 경계를 exact evidence로 보여 줍니다.",
      code: String.raw`import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class SnapshotOutsideLock {
    static final class Catalog {
        private final List<String> items = new ArrayList<>();
        synchronized void add(String item) {
            items.add(item);
        }
        synchronized List<String> snapshot() {
            return List.copyOf(items);
        }
    }
    static Thread producer(Catalog catalog, String prefix) {
        return new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                String item = "%s%03d".formatted(prefix, i);
                catalog.add(item);
            }
        });
    }
    public static void main(String[] args) throws InterruptedException {
        Catalog catalog = new Catalog();
        Thread first = producer(catalog, "A");
        Thread second = producer(catalog, "B");
        first.start(); second.start();
        first.join(); second.join();

        List<String> sorted = new ArrayList<>(catalog.snapshot());
        boolean renderInsideLock = Thread.holdsLock(catalog);
        Collections.sort(sorted);
        System.out.println("size=" + sorted.size());
        System.out.println("first=" + sorted.getFirst());
        System.out.println("last=" + sorted.getLast());
        System.out.println("renderInsideLock=" + renderInsideLock);
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "mutable copy, sorting과 immutable List API를 import합니다." },
        { lines: "6-14", explanation: "Catalog 내부 list mutation과 snapshot만 this monitor에서 수행합니다." },
        { lines: "15-22", explanation: "item formatting은 add 진입 전에 하고 각 producer가100 items를 추가합니다." },
        { lines: "23-29", explanation: "두 producers를 join해 complete catalog를 확정합니다." },
        { lines: "31-38", explanation: "snapshot을 mutable local copy로 만들고 monitor 밖에서 sort·derive·print합니다." },
      ],
      run: { environment: ["OpenJDK 21", "two producers", "immutable snapshot plus local sort", "-Xlint:all warning0"], command: isolatedJavaRun("SnapshotOutsideLock.java", "SnapshotOutsideLock") },
      output: { value: "size=200\nfirst=A000\nlast=B099\nrenderInsideLock=false", explanation: ["두 producers의 items200이 누락 없이 snapshot됩니다.", "nondeterministic insertion order는 local sort로 canonicalize합니다.", "sort/render 시 catalog monitor를 보유하지 않습니다."] },
      experiments: [
        { change: "snapshot이 내부 items를 그대로 반환하게 합니다.", prediction: "caller mutation과 concurrent iteration이 guard discipline을 우회합니다.", result: "immutable defensive copy를 반환합니다." },
        { change: "Collections.sort를 synchronized snapshot method 안으로 옮깁니다.", prediction: "값은 같지만 list 크기에 비례해 hold time이 늘어납니다.", result: "coherent copy 이후 pure derivation은 밖에서 합니다." },
        { change: "join 전에 snapshot을 얻습니다.", prediction: "유효한 중간 snapshot이지만 size200 completion contract는 만족하지 않을 수 있습니다.", result: "snapshot consistency와 workflow completion을 구분합니다." },
      ],
      sourceRefs: ["java-array-list-api", "java-list-api", "java-collections-api", "java-thread-api", "java-thread-holds-lock", "jls-synchronized"],
    }],
    diagnostics: [
      { symptom: "lock 안에서 API 호출 후 전체 service가 오래 멈춘다.", likelyCause: "network/file/formatting/user callback을 monitor 보유 상태에서 실행해 hold time이 외부 latency에 결합됐습니다.", checks: ["thread dump stack과 monitor owner를 봅니다.", "critical section call graph를 펼칩니다.", "wait/hold percentiles를 비교합니다."], fix: "필요 state를 immutable snapshot으로 capture하고 external call을 lock 밖에서 실행합니다.", prevention: "no blocking I/O/callback under lock rule과 static review를 둡니다." },
      { symptom: "lock 밖으로 옮긴 뒤 ConcurrentModificationException이 난다.", likelyCause: "defensive snapshot이 아니라 내부 mutable collection alias를 밖으로 노출했습니다.", checks: ["return value identity를 봅니다.", "copy timing과 mutability를 확인합니다.", "writers가 같은 guard를 쓰는지 봅니다."], fix: "guard 안에서 immutable copy를 만들고 그 copy만 밖에서 처리합니다.", prevention: "API return types와 alias mutation tests를 추가합니다." },
    ],
    expertNotes: ["Shrinking a critical section is a semantic transformation: prove that validation and commit remain indivisible before moving code out.", "Snapshotting trades lock hold time for allocation and copy cost; large-state systems may need immutable versions or database MVCC instead."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...visibilityAndScopeChapters);

const compoundAndDeadlockChapters: DetailedSession["chapters"] = [
  {
    id: "compound-actions-check-then-act-synchronized-wrapper",
    title: "개별 thread-safe 호출과 compound action의 atomicity를 구분합니다",
    lead: "containsKey와 put이 각각 동기화되어도 두 호출 사이에 다른 thread가 들어올 수 있음을 재현하고 check→create→put 전체를 같은 lock으로 묶습니다.",
    explanations: [
      "thread-safe collection의 한 method가 atomic하다는 사실은 여러 methods를 조합한 업무 operation까지 atomic하게 만들지 않습니다. check-then-act와 read-modify-write가 대표 compound actions입니다.",
      "Collections.synchronizedMap은 개별 호출을 wrapper monitor로 직렬화합니다. 그러나 containsKey가 false를 반환한 뒤 put 전에는 lock이 풀리므로 두 threads가 모두 missing을 볼 수 있습니다.",
      "예제는 bothMissing latch로 두 checks를 같은 state에서 끝내고 creation side effect를 각각 실행시킵니다. map size는1이지만 expensive creation은2회라 결과 collection만 보면 중복 비용을 놓칩니다.",
      "수정본은 returned synchronized map 객체를 synchronized하여 check·create·put 전체를 하나의 compound operation으로 만듭니다. 해당 wrapper의 모든 관련 access가 같은 discipline을 따라야 합니다.",
      "Map.computeIfAbsent는 의도를 더 직접 표현하지만 implementation별 atomicity와 mapping function 제약을 확인해야 합니다. ConcurrentHashMap은 per-key atomic application을 제공하지만 mapping function은 짧고 side-effect free에 가깝게 유지합니다.",
      "외부 API 호출을 compute/mapping function 안에서 수행하면 lock/bin reservation이나 retry semantics에 결합될 수 있습니다. 먼저 immutable value를 계산할 수 있는지, duplicate computation을 허용할지 결정합니다.",
      "size1은 idempotency가 아닙니다. email 발송·결제 승인처럼 overwrite로 되돌릴 수 없는 side effect는 unique constraint, transaction/outbox와 idempotency key가 필요합니다.",
      "compound boundary는 collection method 이름이 아니라 business invariant로 정합니다. '없으면 정확히 한 번 생성해 등록'과 '최종 값만 하나'는 서로 다른 contracts입니다.",
    ],
    concepts: [
      { term: "compound action", definition: "여러 개의 개별 operations가 하나의 불가분 업무 의미를 이루는 동작입니다.", detail: ["check-then-act가 대표적입니다.", "전체를 atomic하게 만들어야 할 수 있습니다."] },
      { term: "check-then-act", definition: "현재 조건을 검사한 뒤 그 결과에 따라 state를 바꾸는 두 단계 pattern입니다.", detail: ["두 단계 사이 state가 바뀔 수 있습니다.", "atomic API 또는 common lock이 필요합니다."] },
      { term: "linearization point", definition: "concurrent operation이 논리적으로 한 순간에 완료된 것으로 볼 수 있는 지점입니다.", detail: ["API contract reasoning에 씁니다.", "side effects까지 포함할지 정합니다."] },
    ],
    codeExamples: [{
      id: "java-compound-map-action",
      title: "synchronizedMap의 두 missing checks와 외부 compound lock을 비교합니다",
      language: "java",
      filename: "CompoundMapAction.java",
      purpose: "개별 method safety가 중복 creation을 막지 못한다는 사실을 exact counts로 보여 줍니다.",
      code: String.raw`import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class CompoundMapAction {
    static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted", failure);
        }
    }
    static void unsafeCreate(Map<String, String> map, AtomicInteger created,
                             CountDownLatch bothMissing) {
        if (!map.containsKey("course")) {
            bothMissing.countDown();
            await(bothMissing);
            created.incrementAndGet();
            map.put("course", "ready");
        }
    }
    static void fixedCreate(Map<String, String> map, AtomicInteger created) {
        synchronized (map) {
            if (!map.containsKey("course")) {
                created.incrementAndGet();
                map.put("course", "ready");
            }
        }
    }
    static void join(Thread first, Thread second) throws InterruptedException {
        first.start(); second.start();
        first.join(); second.join();
    }
    public static void main(String[] args) throws InterruptedException {
        Map<String, String> unsafe = Collections.synchronizedMap(new HashMap<>());
        AtomicInteger unsafeCreated = new AtomicInteger();
        CountDownLatch bothMissing = new CountDownLatch(2);
        join(new Thread(() -> unsafeCreate(unsafe, unsafeCreated, bothMissing)),
             new Thread(() -> unsafeCreate(unsafe, unsafeCreated, bothMissing)));

        Map<String, String> fixed = Collections.synchronizedMap(new HashMap<>());
        AtomicInteger fixedCreated = new AtomicInteger();
        join(new Thread(() -> fixedCreate(fixed, fixedCreated)),
             new Thread(() -> fixedCreate(fixed, fixedCreated)));
        System.out.println("unsafeCreated=" + unsafeCreated.get());
        System.out.println("unsafeSize=" + unsafe.size());
        System.out.println("fixedCreated=" + fixedCreated.get());
        System.out.println("fixedSize=" + fixed.size());
    }
}`,
      walkthrough: [
        { lines: "1-15", explanation: "synchronized wrapper, latch와 exact side-effect counter를 준비합니다." },
        { lines: "16-24", explanation: "개별 containsKey/put 사이 barrier로 두 creation side effects를 강제합니다." },
        { lines: "25-32", explanation: "fixed path는 wrapper monitor에서 check·create·put 전체를 보호합니다." },
        { lines: "33-36", explanation: "두 threads의 start/join을 한 helper로 묶어 observer completion을 보장합니다." },
        { lines: "37-43", explanation: "unsafe wrapper에서 missing checks 둘을 같은 시점에 만듭니다." },
        { lines: "45-53", explanation: "fixed wrapper를 실행하고 creation counts와 final sizes를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "Collections.synchronizedMap", "CountDownLatch controlled check race", "-Xlint:all warning0"], command: isolatedJavaRun("CompoundMapAction.java", "CompoundMapAction") },
      output: { value: "unsafeCreated=2\nunsafeSize=1\nfixedCreated=1\nfixedSize=1", explanation: ["unsafe map은 최종 key 하나지만 creation을 두 번 실행합니다.", "fixed compound lock은 creation을 한 번만 실행합니다.", "size와 side-effect count를 별도로 검증합니다."] },
      experiments: [
        { change: "unsafeCreated를 일반 int++로 바꿉니다.", prediction: "진단 counter 자체에 race가 생겨 duplicate evidence가1로 가려질 수 있습니다.", result: "관측 도구도 thread-safe하게 설계합니다." },
        { change: "fixed에서 synchronized(new Object())를 매번 사용합니다.", prediction: "호출마다 다른 lock이라 mutual exclusion이 전혀 생기지 않습니다.", result: "stable common lock identity를 사용합니다." },
        { change: "ConcurrentHashMap.computeIfAbsent로 바꿉니다.", prediction: "per-key registration은 atomic해지지만 mapping function의 blocking/recursion/side effects 제약을 review해야 합니다.", result: "collection contract와 business exactly-once를 구분합니다." },
      ],
      sourceRefs: ["java-collections-synchronized-map", "java-map-api", "java-hash-map-api", "java-concurrent-hash-map", "java-count-down-latch", "java-atomic-integer", "jls-synchronized"],
    }],
    diagnostics: [
      { symptom: "map에는 한 entry뿐인데 외부 생성 API가 두 번 호출된다.", likelyCause: "containsKey와 put은 개별 동기화됐지만 check-then-act 전체는 atomic하지 않습니다.", checks: ["side-effect count와 map size를 분리합니다.", "두 calls 사이 interleaving을 만듭니다.", "wrapper monitor/atomic API contract를 확인합니다."], fix: "compound action을 common lock 또는 적합한 atomic map operation으로 표현하고 외부 exactly-once는 transaction/idempotency로 보강합니다.", prevention: "최종 state뿐 아니라 side-effect multiplicity를 회귀 검증합니다." },
      { symptom: "computeIfAbsent 도입 뒤 latency와 recursive update exception이 발생한다.", likelyCause: "mapping function에서 느린 I/O 또는 같은 map의 recursive mutation을 수행했습니다.", checks: ["mapping function call graph를 봅니다.", "per-key contention과 duration을 측정합니다.", "implementation contract를 읽습니다."], fix: "mapping function을 짧고 side-effect bounded하게 만들거나 reservation/future pattern으로 외부 work를 분리합니다.", prevention: "atomic collection callback에 blocking/cross-map mutation 금지 기준을 둡니다." },
    ],
    expertNotes: ["Collections.synchronizedMap requires manual synchronization on the returned map for compound traversal or multi-call operations; synchronizing on the backing map is the wrong identity.", "Atomic registration in memory does not make an external side effect exactly once across retries or process crashes."],
  },
  {
    id: "deadlock-four-conditions-global-lock-order-transfer",
    title: "두 account transfer의 circular wait를 stable global lock order로 제거합니다",
    lead: "각 객체가 thread-safe해도 두 locks를 호출 방향대로 잡으면 교착될 수 있으므로 모든 code path가 공유하는 total order를 계약으로 둡니다.",
    explanations: [
      "deadlock은 서로가 가진 resource를 기다려 영원히 진행하지 못하는 liveness failure입니다. mutual exclusion, hold-and-wait, no preemption, circular wait 네 조건이 함께 성립할 때 가능합니다.",
      "A→B transfer가 A then B를 잠그고 동시에 B→A가 B then A를 잠그면 circular wait가 생깁니다. 각 Account method가 개별적으로 synchronized라는 사실은 이 cycle을 막지 못합니다.",
      "예제는 business account id를 immutable unique total order로 사용합니다. 호출 방향과 무관하게 작은 id monitor를 먼저, 큰 id를 다음에 획득합니다.",
      "identityHashCode는 편리해 보여도 collision 가능성이 있어 완전한 total order가 아닙니다. collision tie lock을 두거나 domain unique id/private lock rank를 사용합니다.",
      "두 monitors 안에서는 funds validation과 양쪽 balance commit만 수행합니다. logging, event publish와 remote fraud check는 transaction snapshot/outbox 경계 뒤 lock 밖으로 옮깁니다.",
      "opposite transfers500회씩은 시작 latch 뒤 경쟁하지만 같은 order로 locks를 잡아 종료합니다. 각 방향 총500이 상쇄되어 balances1000/1000과 total2000이 exact입니다.",
      "timeout이 성공 증거는 아닙니다. test는 threads를 bounded join하고 미완료면 thread dump를 수집해 실패하며, 완료 뒤 conservation invariant와 operation count를 검증합니다.",
      "production deadlock 진단에는 ThreadMXBean.findDeadlockedThreads, jcmd Thread.print 또는 JFR evidence가 유용합니다. dump에는 lock owner, waiting monitor와 stack acquisition path를 보존합니다.",
      "여러 JVM으로 확장하면 account objects의 JVM monitors는 서로를 보지 못합니다. database row lock order, optimistic version 또는 serializable transaction으로 같은 invariant를 옮겨야 합니다.",
    ],
    concepts: [
      { term: "deadlock", definition: "실행 집합이 서로가 보유한 resource를 순환 대기해 외부 개입 없이는 진행하지 못하는 상태입니다.", detail: ["correctness가 아닌 liveness failure입니다.", "thread dump로 cycle을 찾습니다."] },
      { term: "global lock order", definition: "모든 code path가 여러 locks를 획득할 때 따르는 안정적인 strict total order입니다.", detail: ["circular wait를 제거합니다.", "동적 resource에도 rank가 필요합니다."] },
      { term: "conservation invariant", definition: "transfer 전후 전체 자산 합처럼 operation이 보존해야 하는 cross-object 관계입니다.", detail: ["두 objects를 함께 보호합니다.", "완료 뒤 exact 검증합니다."] },
    ],
    codeExamples: [{
      id: "java-ordered-account-transfer",
      title: "반대 방향 1000 transfers를 id order로 완료하고 total2000을 보존합니다",
      language: "java",
      filename: "OrderedAccountTransfer.java",
      purpose: "global order가 opposite lock acquisition cycle을 제거하고 cross-account invariant를 보존함을 검증합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;

public class OrderedAccountTransfer {
    static final class Account {
        final long id;
        int balance;
        Account(long id, int balance) {
            this.id = id;
            this.balance = balance;
        }
        synchronized int balance() { return balance; }
    }
    static void transfer(Account from, Account to, int amount) {
        if (from.id == to.id) throw new IllegalArgumentException("duplicate id");
        Account first = from.id < to.id ? from : to;
        Account second = from.id < to.id ? to : from;
        synchronized (first) {
            synchronized (second) {
                if (amount <= 0 || from.balance < amount) {
                    throw new IllegalArgumentException("invalid transfer");
                }
                from.balance -= amount;
                to.balance += amount;
            }
        }
    }
    static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted", failure);
        }
    }
    static Thread worker(Account from, Account to, CountDownLatch start) {
        return new Thread(() -> {
            await(start);
            for (int i = 0; i < 500; i++) transfer(from, to, 1);
        });
    }
    public static void main(String[] args) throws InterruptedException {
        Account left = new Account(10, 1_000);
        Account right = new Account(20, 1_000);
        CountDownLatch start = new CountDownLatch(1);
        Thread forward = worker(left, right, start);
        Thread reverse = worker(right, left, start);
        forward.start(); reverse.start();
        start.countDown();
        forward.join(); reverse.join();
        int leftBalance = left.balance();
        int rightBalance = right.balance();
        System.out.println("left=" + leftBalance);
        System.out.println("right=" + rightBalance);
        System.out.println("total=" + (leftBalance + rightBalance));
        System.out.println("operations=1000");
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "immutable unique id와 guarded balance를 가진 Account를 정의합니다." },
        { lines: "13-27", explanation: "호출 방향과 무관한 id order로 두 monitors를 잡고 validate/commit합니다." },
        { lines: "28-36", explanation: "interrupt status를 보존하는 start coordination helper를 정의합니다." },
        { lines: "37-42", explanation: "각 worker가 같은 start 이후 한 방향 transfer500회를 수행합니다." },
        { lines: "43-51", explanation: "반대 방향 workers를 시작하고 모두 join해 liveness와 completion을 확인합니다." },
        { lines: "52-57", explanation: "각 balance, conservation total과 exact operation 수를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "two accounts and opposite transfer threads", "stable unique id lock order", "-Xlint:all warning0"], command: isolatedJavaRun("OrderedAccountTransfer.java", "OrderedAccountTransfer") },
      output: { value: "left=1000\nright=1000\ntotal=2000\noperations=1000", explanation: ["두 방향500회가 모두 완료됩니다.", "개별 balances는 원래 값으로 돌아옵니다.", "cross-account total2000이 보존됩니다."] },
      experiments: [
        { change: "항상 from을 먼저 잠그게 합니다.", prediction: "opposite transfers가 서로 첫 lock을 잡은 뒤 두 번째를 기다리는 circular wait가 가능합니다.", result: "모든 paths에 global order를 강제합니다." },
        { change: "account id를 runtime에 변경 가능하게 만듭니다.", prediction: "lock acquisition 사이 order가 바뀌어 total-order proof가 무너집니다.", result: "lock rank/id를 immutable unique로 둡니다." },
        { change: "두 locks 안에서 remote audit API를 호출합니다.", prediction: "network latency가 두 accounts를 묶고 callback lock inversion까지 만들 수 있습니다.", result: "commit snapshot/outbox 뒤 open call로 이동합니다." },
      ],
      sourceRefs: ["java-count-down-latch", "java-thread-api", "java-thread-mx-bean", "java-management-factory", "jls-synchronized", "jls-happens-before"],
    }],
    diagnostics: [
      { symptom: "CPU는 낮지만 두 transfer threads가 영원히 BLOCKED다.", likelyCause: "A→B와 B→A가 호출 방향대로 locks를 잡아 circular wait를 만들었습니다.", checks: ["ThreadMXBean 또는 thread dump로 cycle을 찾습니다.", "각 stack의 owned/waiting monitors를 표시합니다.", "모든 acquisition paths의 order를 비교합니다."], fix: "immutable unique rank 기반 global order를 모든 multi-lock operation에 적용합니다.", prevention: "opposite-direction stress와 bounded deadlock detection을 CI에 둡니다." },
      { symptom: "단일 JVM test는 통과하지만 두 service instances에서 총액이 깨진다.", likelyCause: "JVM-local monitors를 cross-process transaction으로 오해했습니다.", checks: ["state write owners/JVM 수를 확인합니다.", "database isolation/version을 봅니다.", "retry와 duplicate delivery를 재현합니다."], fix: "database transaction/optimistic version/serialized owner로 invariant 경계를 이동합니다.", prevention: "deployment topology를 concurrency threat model에 포함합니다." },
    ],
    expertNotes: ["Lock ordering prevents cycles only if every acquisition path follows the same immutable total order, including error and callback paths.", "A passing stress test is not a proof of deadlock freedom; the order argument supplies the proof, while the test guards implementation drift."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...compoundAndDeadlockChapters);

const alternativesAndScaleChapters: DetailedSession["chapters"] = [
  {
    id: "synchronized-atomicinteger-longadder-semantic-choice",
    title: "synchronized·AtomicInteger·LongAdder를 같은 count가 아닌 semantic으로 선택합니다",
    lead: "세 도구가 완료 후10000을 만들 수 있어도 linearizable update, multi-field invariant와 concurrent sum의 의미가 다르므로 요구 계약으로 구분합니다.",
    explanations: [
      "synchronized는 임의의 code block과 여러 fields의 invariant를 mutual exclusion·visibility로 보호할 수 있습니다. 대신 blocking과 monitor contention cost가 있습니다.",
      "AtomicInteger.incrementAndGet는 하나의 int에 대한 atomic read-modify-write와 volatile memory effects를 제공하며 반환 값이 linearizable해야 하는 sequence/counter에 적합합니다.",
      "여러 atomics를 각각 갱신한다고 cross-field transaction이 되지는 않습니다. balance와 version을 함께 commit해야 하면 immutable CAS state 또는 lock/transaction이 필요합니다.",
      "LongAdder는 contention을 여러 internal cells에 분산해 높은 update throughput을 목표로 합니다. concurrent sum은 원자적 snapshot이 아니므로 quota gate, unique sequence나 정확한 진행 조건에는 부적합할 수 있습니다.",
      "예제는 네 workers가 세 counters를 각각2500회 증가시키고 모두 join한 뒤 값을 읽습니다. quiescent state이므로 세 결과가 모두10000으로 exact합니다.",
      "이 예제는 성능 benchmark가 아닙니다. 한 loop에서 세 implementations를 연속 호출하므로 비용이 섞이며 JIT warmup, CPU topology, false sharing과 workload distribution을 통제하지 않습니다.",
      "선택 표에는 operation shape, contention, exact concurrent reads, compound invariants, fairness, cancellation과 observability를 넣습니다. 단순 microbenchmark 우승만으로 production primitive를 고르지 않습니다.",
      "counter overflow policy도 contract입니다. AtomicInteger는 int wraparound를 막아 주지 않으므로 range check가 필요하면 CAS loop 또는 wider/domain type을 설계합니다.",
    ],
    concepts: [
      { term: "compare-and-set", definition: "현재 값이 expected와 같을 때만 update로 바꾸는 atomic conditional write입니다.", detail: ["retry loop의 기반입니다.", "ABA와 side-effect 재실행을 고려합니다."] },
      { term: "linearizability", definition: "각 concurrent operation이 호출과 반환 사이 어느 한 순간에 원자적으로 적용된 것처럼 보이는 실시간 일관성 모델입니다.", detail: ["per-operation contract입니다.", "LongAdder sum과 차이가 납니다."] },
      { term: "striped accumulation", definition: "경쟁 updates를 여러 cells로 분산하고 읽을 때 합산해 contention을 낮추는 기법입니다.", detail: ["update throughput에 유리합니다.", "concurrent exact snapshot은 약해질 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-counter-strategy-results",
      title: "네 threads가 synchronized·AtomicInteger·LongAdder를 각각10000으로 만듭니다",
      language: "java",
      filename: "CounterStrategyResults.java",
      purpose: "완료 후 값은 같아도 각 primitive의 concurrent semantics가 다름을 비교할 기반을 만듭니다.",
      code: String.raw`import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

public class CounterStrategyResults {
    interface Counter {
        void increment();
        long value();
    }
    static final class MonitorCounter implements Counter {
        private long value;
        public synchronized void increment() { value++; }
        public synchronized long value() { return value; }
    }
    static final class AtomicCounter implements Counter {
        private final AtomicInteger value = new AtomicInteger();
        public void increment() { value.incrementAndGet(); }
        public long value() { return value.get(); }
    }
    static final class AdderCounter implements Counter {
        private final LongAdder value = new LongAdder();
        public void increment() { value.increment(); }
        public long value() { return value.sum(); }
    }
    static Thread worker(Counter[] counters) {
        return new Thread(() -> {
            for (int i = 0; i < 2_500; i++) {
                for (Counter counter : counters) counter.increment();
            }
        });
    }
    public static void main(String[] args) throws InterruptedException {
        Counter monitor = new MonitorCounter();
        Counter atomic = new AtomicCounter();
        Counter adder = new AdderCounter();
        Counter[] counters = {monitor, atomic, adder};
        Thread[] workers = {
            worker(counters), worker(counters), worker(counters), worker(counters)
        };
        for (Thread worker : workers) worker.start();
        for (Thread worker : workers) worker.join();
        System.out.println("monitor=" + monitor.value());
        System.out.println("atomic=" + atomic.value());
        System.out.println("adder=" + adder.value());
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "AtomicInteger/LongAdder와 공통 Counter contract를 정의합니다." },
        { lines: "8-13", explanation: "MonitorCounter는 read와 update를 같은 intrinsic lock으로 보호합니다." },
        { lines: "14-23", explanation: "AtomicInteger의 linearizable increment와 LongAdder의 striped accumulation을 구현합니다." },
        { lines: "24-30", explanation: "각 worker가 세 counters를 각각2500회 증가시킵니다." },
        { lines: "31-40", explanation: "네 workers를 start/join해 quiescent state의 exact results를 만듭니다." },
        { lines: "41-43", explanation: "세 strategy의 완료 후 값을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "four joined platform threads", "three counter semantics", "-Xlint:all warning0"], command: isolatedJavaRun("CounterStrategyResults.java", "CounterStrategyResults") },
      output: { value: "monitor=10000\natomic=10000\nadder=10000", explanation: ["네 workers×2500 updates가 모두 반영됩니다.", "join 이후 quiescent read라 LongAdder sum도 exact입니다.", "동일 결과가 동일 concurrent contract를 뜻하지는 않습니다."] },
      experiments: [
        { change: "worker 실행 중 LongAdder.sum으로 quota 초과를 차단합니다.", prediction: "concurrent updates와 atomic snapshot이 아니어서 strict gate contract에 부적합합니다.", result: "quota에는 linearizable state transition을 사용합니다." },
        { change: "balance와 version을 서로 다른 AtomicInteger로 바꿉니다.", prediction: "reader가 서로 다른 logical update의 pair를 볼 수 있습니다.", result: "immutable pair CAS 또는 common lock을 사용합니다." },
        { change: "System.nanoTime 한 번으로 세 구현의 속도를 결론냅니다.", prediction: "warmup·workload coupling·measurement noise로 잘못된 비교가 됩니다.", result: "JMH와 production contention profile을 사용합니다." },
      ],
      sourceRefs: ["java-atomic-integer", "java-long-adder", "java-thread-api", "java-package-summary-concurrent", "jls-happens-before"],
    }],
    diagnostics: [
      { symptom: "LongAdder sum으로 발급한 번호가 중복되거나 건너뛴다.", likelyCause: "high-throughput statistical counter를 linearizable sequence generator로 사용했습니다.", checks: ["unique/strict order 요구를 확인합니다.", "concurrent sum reads를 재현합니다.", "AtomicLong/database sequence와 비교합니다."], fix: "unique sequence에는 linearizable atomic/database allocator를 사용합니다.", prevention: "counter별 semantic purpose를 이름과 ADR에 명시합니다." },
      { symptom: "두 AtomicInteger fields가 각각 정상 범위인데 조합 불변식이 깨진다.", likelyCause: "per-field atomicity를 multi-field transaction으로 오해했습니다.", checks: ["cross-field invariant를 씁니다.", "reader snapshots를 interleaving합니다.", "CAS state/lock boundary를 검토합니다."], fix: "immutable aggregate 하나를 CAS하거나 common lock/transaction에서 함께 commit합니다.", prevention: "불변식 단위로 synchronization primitive를 선택합니다." },
    ],
    expertNotes: ["LongAdder is designed for statistics under contention; sum after quiescence is exact, while concurrent sum is not an atomic snapshot.", "CAS loops may retry user calculations, so side effects must not be embedded in retryable update functions."],
  },
  {
    id: "reentrantlock-trylock-interruptible-fairness-contract",
    title: "ReentrantLock의 tryLock·interruptible wait·fairness를 명시적 lifecycle로 다룹니다",
    lead: "intrinsic lock보다 풍부한 acquisition policy가 필요할 때만 ReentrantLock을 선택하고 모든 성공 경로에서 finally unlock을 강제합니다.",
    explanations: [
      "ReentrantLock은 synchronized와 같은 기본 mutual exclusion·memory semantics에 더해 tryLock, timed acquisition, lockInterruptibly, fairness option과 multiple Conditions를 제공합니다.",
      "명시 lock은 lexical 자동 해제가 없습니다. lock/tryLock 성공 직후 try를 시작하고 finally에서 unlock해야 exception·return 모든 경로가 안전합니다.",
      "예제의 owner는 lock을 획득한 뒤 held latch를 내리고 release latch를 기다립니다. main의 첫 tryLock은 owner 보유가 확정된 상태라 false가 deterministic합니다.",
      "main이 release를 허용하고 owner를 join한 뒤 두 번째 tryLock은 true입니다. 성공한 경우에만 unlock하여 IllegalMonitorStateException을 피합니다.",
      "lockInterruptibly는 lock 대기를 cooperative cancellation point로 만들지만 interrupt를 누가 처리하고 status를 복원/전파할지 API 계약을 정해야 합니다.",
      "fair=true는 오래 기다린 thread 선호 정책을 제공하지만 scheduler fairness나 strict FIFO 완료를 보장하지 않으며 throughput cost가 있을 수 있습니다. tryLock의 barging semantics도 API 문서를 확인합니다.",
      "Condition은 monitor wait set보다 여러 condition queues를 표현할 수 있지만 predicate while loop, signal ownership과 interruption discipline은 여전히 필요합니다. 자세한 조건 대기는 thread-04에서 다룹니다.",
      "liveness failure를 숨기기 위해 무조건 timeout을 붙이지 않습니다. timeout 시 operation semantics, rollback, retry storm, metrics와 caller-visible error를 함께 정의합니다.",
    ],
    concepts: [
      { term: "explicit lock", definition: "lock/unlock method로 acquisition lifecycle을 직접 제어하는 java.util.concurrent.locks abstraction입니다.", detail: ["finally unlock이 필수입니다.", "조건·timeout·interrupt policy를 제공합니다."] },
      { term: "tryLock", definition: "현재 lock을 즉시 또는 제한 시간 안에 얻을 수 있을 때만 획득하고 성공 여부를 반환하는 operation입니다.", detail: ["실패 시 unlock하지 않습니다.", "fallback semantics가 필요합니다."] },
      { term: "fair lock", definition: "경쟁 상황에서 오래 기다린 thread를 선호하도록 구성한 ReentrantLock policy입니다.", detail: ["strict scheduler fairness는 아닙니다.", "throughput tradeoff가 있습니다."] },
    ],
    codeExamples: [{
      id: "java-trylock-owned-release",
      title: "owner-held 구간의 tryLock false와 release 이후 true를 exact 검증합니다",
      language: "java",
      filename: "TryLockOwnedRelease.java",
      purpose: "tryLock 결과, conditional unlock과 explicit lock lifecycle을 timing guess 없이 확인합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.locks.ReentrantLock;

public class TryLockOwnedRelease {
    static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted", failure);
        }
    }
    public static void main(String[] args) throws InterruptedException {
        ReentrantLock lock = new ReentrantLock();
        CountDownLatch held = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        Thread owner = new Thread(() -> {
            lock.lock();
            try {
                held.countDown();
                await(release);
            } finally {
                lock.unlock();
            }
        });
        owner.start();
        held.await();

        boolean whileHeld = lock.tryLock();
        if (whileHeld) lock.unlock();
        release.countDown();
        owner.join();

        boolean afterRelease = lock.tryLock();
        try {
            System.out.println("whileHeld=" + whileHeld);
            System.out.println("afterRelease=" + afterRelease);
            System.out.println("fair=" + lock.isFair());
            System.out.println("queued=" + lock.hasQueuedThreads());
        } finally {
            if (afterRelease) lock.unlock();
        }
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "latches, ReentrantLock과 interrupt-preserving coordination helper를 준비합니다." },
        { lines: "13-26", explanation: "owner가 explicit lock을 획득하고 held/release protocol을 finally unlock으로 감쌉니다." },
        { lines: "27-34", explanation: "ownership 확정 뒤 immediate tryLock false를 얻고 owner를 release/join합니다." },
        { lines: "35-44", explanation: "release 후 tryLock true, default fairness와 empty queue를 출력하고 성공한 acquisition만 풉니다." },
      ],
      run: { environment: ["OpenJDK 21", "ReentrantLock default nonfair", "latch-controlled ownership", "-Xlint:all warning0"], command: isolatedJavaRun("TryLockOwnedRelease.java", "TryLockOwnedRelease") },
      output: { value: "whileHeld=false\nafterRelease=true\nfair=false\nqueued=false", explanation: ["owner가 lock을 가진 동안 immediate acquisition은 실패합니다.", "owner join 뒤 acquisition은 성공합니다.", "default lock은 nonfair이고 종료 시 queued thread가 없습니다."] },
      experiments: [
        { change: "finally unlock을 정상 경로 끝의 한 줄로 옮깁니다.", prediction: "중간 exception/return에서 lock이 남아 후속 callers가 block됩니다.", result: "성공 직후 try/finally template를 사용합니다." },
        { change: "whileHeld가 false여도 unlock을 호출합니다.", prediction: "현재 thread가 owner가 아니어서 IllegalMonitorStateException이 납니다.", result: "acquisition boolean과 ownership을 함께 관리합니다." },
        { change: "new ReentrantLock(true)로 바꿉니다.", prediction: "fair=true가 출력되지만 두-thread fixture로 throughput/fair scheduling을 결론낼 수 없습니다.", result: "실제 contention distribution과 SLO로 평가합니다." },
      ],
      sourceRefs: ["java-reentrant-lock", "java-lock-interface", "java-count-down-latch", "java-thread-api", "java-condition-api", "jls-happens-before"],
    }],
    diagnostics: [
      { symptom: "한 exception 이후 모든 callers가 ReentrantLock에서 대기한다.", likelyCause: "lock 성공 뒤 finally unlock이 없는 경로가 있습니다.", checks: ["모든 return/throw paths를 펼칩니다.", "thread dump owner stack을 봅니다.", "isHeldByCurrentThread를 진단에 사용합니다."], fix: "acquisition 직후 try/finally를 두고 성공한 thread만 정확히 한 번 unlock합니다.", prevention: "standard lock template와 exception fault injection을 적용합니다." },
      { symptom: "fair lock으로 바꿨는데 latency가 더 나빠졌다.", likelyCause: "fairness가 barging을 줄이는 대신 handoff/scheduling cost를 늘렸고 workload 요구와 맞지 않습니다.", checks: ["p50/p99와 throughput을 같이 봅니다.", "hot-key queue를 분석합니다.", "tryLock 사용과 API semantics를 확인합니다."], fix: "starvation requirement와 measured tradeoff에 따라 policy를 선택하고 state partition을 우선 검토합니다.", prevention: "fairness option 변경을 benchmark+SLO ADR로 관리합니다." },
    ],
    expertNotes: ["ReentrantLock is not automatically faster than synchronized; choose it for required semantics such as interruptible/timed acquisition or multiple conditions.", "tryLock converts waiting into a branch, but the branch needs a defined fallback, cancellation and observability contract."],
  },
  {
    id: "java21-virtual-threads-synchronized-contention-pinning",
    title: "Java21 virtual threads에서도 monitor correctness와 blocking budget을 분리합니다",
    lead: "thread 생성 비용이 낮아져도 한 monitor의 critical section은 동시에 하나뿐이며 JDK21에서는 synchronized 안의 blocking이 carrier pinning을 만들 수 있음을 운영 경계로 둡니다.",
    explanations: [
      "virtual thread는 thread-per-task style의 blocking code를 높은 규모로 실행하도록 Java21에서 final된 lightweight Thread입니다. CPU core나 shared mutable state를 무한히 병렬화하지는 않습니다.",
      "예제는1000 virtual threads가 같은 synchronized counter를 한 번씩 증가시킵니다. 모두 virtual=true지만 monitor는 updates를 직렬화해 exact count1000을 만듭니다.",
      "Thread.startVirtualThread는 시작된 virtual thread를 반환하고 join으로 완료를 기다릴 수 있습니다. 완료 뒤 모든 state가 TERMINATED임을 검증합니다.",
      "Java21 구현에서 virtual thread가 synchronized block/method 안에서 blocking operation을 수행하면 carrier OS thread에 pinned될 수 있습니다. 짧은 CPU-only increment는 이 문제를 만들지 않습니다.",
      "pinning이 correctness bug는 아니지만 scalability와 latency 문제를 만들 수 있습니다. JFR jdk.VirtualThreadPinned event와 `-Djdk.tracePinnedThreads`를 controlled environment에서 사용합니다.",
      "JDK 버전에 따라 pinning 구현은 진화할 수 있으므로 현재 runtime release notes와 measurement를 확인합니다. 이 session의 실행·주장은 명시적으로 OpenJDK21 기준입니다.",
      "virtual thread마다 pool을 또 만들거나 rate limit 없이 downstream database에10000 connections를 열면 병목을 옮길 뿐입니다. semaphore, connection pool과 service capacity로 concurrency를 제한합니다.",
      "ThreadLocal cache를 virtual-thread 수만큼 크게 두면 memory footprint가 늘 수 있습니다. task context는 작게 유지하고 scoped context/explicit parameters를 검토합니다.",
      "shared counter가 관측 통계뿐이면 LongAdder, per-task results reduction 또는 message passing으로 central monitor를 제거할 수 있습니다. 먼저 필요한 ordering semantics를 확인합니다.",
    ],
    concepts: [
      { term: "virtual thread", definition: "JVM이 scheduling하는 lightweight Thread로 blocking task를 많은 thread-per-task 형태로 표현하도록 설계됐습니다.", detail: ["Java21에서 final feature입니다.", "platform Thread API와 대부분 호환됩니다."] },
      { term: "carrier thread", definition: "virtual thread의 continuation을 실제로 실행하는 JVM 내부 platform thread입니다.", detail: ["virtual threads가 mount/unmount됩니다.", "pinning 시 carrier를 점유합니다."] },
      { term: "pinning", definition: "virtual thread가 blocking해도 carrier에서 unmount되지 못하고 carrier를 계속 점유하는 상태입니다.", detail: ["JDK/version과 operation에 의존합니다.", "관측 후 critical section을 교정합니다."] },
    ],
    codeExamples: [{
      id: "java-virtual-thread-monitor-counter",
      title: "1000 virtual threads가 같은 monitor에서 exact1000을 만들고 종료합니다",
      language: "java",
      filename: "VirtualThreadMonitorCounter.java",
      purpose: "virtual-thread 규모와 monitor mutual exclusion이 서로 다른 축임을 deterministic result로 보여 줍니다.",
      code: String.raw`public class VirtualThreadMonitorCounter {
    static final class Counter {
        private int value;
        synchronized void increment() {
            value++;
        }
        synchronized int value() {
            return value;
        }
    }
    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        Thread[] workers = new Thread[1_000];
        for (int i = 0; i < workers.length; i++) {
            workers[i] = Thread.startVirtualThread(counter::increment);
        }
        int virtual = 0;
        for (Thread worker : workers) {
            if (worker.isVirtual()) virtual++;
            worker.join();
        }
        int terminated = 0;
        for (Thread worker : workers) {
            if (worker.getState() == Thread.State.TERMINATED) terminated++;
        }
        System.out.println("virtual=" + virtual);
        System.out.println("count=" + counter.value());
        System.out.println("terminated=" + terminated);
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "한 int update/read를 같은 intrinsic monitor로 보호하는 Counter를 정의합니다." },
        { lines: "11-16", explanation: "1000 slots를 만들고 각 task를 startVirtualThread로 즉시 시작합니다." },
        { lines: "17-21", explanation: "각 worker의 virtual identity를 세고 join해 completion edge를 만듭니다." },
        { lines: "22-25", explanation: "join 뒤 TERMINATED state인 workers를 별도로 셉니다." },
        { lines: "26-28", explanation: "virtual count, protected update count와 termination count를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "1000 Java virtual threads", "one short CPU-only synchronized section", "-Xlint:all warning0"], command: isolatedJavaRun("VirtualThreadMonitorCounter.java", "VirtualThreadMonitorCounter") },
      output: { value: "virtual=1000\ncount=1000\nterminated=1000", explanation: ["workers1000 모두 virtual threads입니다.", "같은 monitor가 increments1000을 누락 없이 보호합니다.", "join 뒤 workers1000이 모두 종료됐습니다."] },
      experiments: [
        { change: "increment lock 안에 blocking network call을 넣습니다.", prediction: "Java21에서 carrier pinning과 long monitor hold가 동시에 생겨 scale이 급격히 나빠질 수 있습니다.", result: "snapshot/commit만 lock에 남기고 blocking을 밖으로 옮깁니다." },
        { change: "virtual threads를100000으로 늘리고 downstream 제한을 제거합니다.", prediction: "counter 외 database/socket capacity에서 overload와 queueing이 생깁니다.", result: "task 수와 외부 resource concurrency를 별도로 제한합니다." },
        { change: "counter를 일반 int++로 바꿉니다.", prediction: "virtual thread도 data race를 자동 수정하지 않아 count가1000보다 작을 수 있습니다.", result: "thread 종류와 memory-safety primitive를 분리합니다." },
      ],
      sourceRefs: ["java-thread-api", "java-thread-builder", "jep-444", "java21-virtual-thread-guide", "jfr-virtual-thread-pinned", "jls-synchronized", "jls-happens-before"],
    }],
    diagnostics: [
      { symptom: "virtual threads를 도입했는데 throughput이 늘지 않고 carrier가 막힌다.", likelyCause: "긴 synchronized section 안에서 blocking I/O를 수행해 Java21 carrier pinning과 monitor contention이 겹쳤습니다.", checks: ["JFR VirtualThreadPinned events를 봅니다.", "pinned stack과 monitor hold를 연결합니다.", "runtime JDK version을 확인합니다."], fix: "blocking call을 lock 밖으로 옮기고 필요한 경우 JDK21에서 ReentrantLock 등 대안을 측정합니다.", prevention: "virtual-thread load test에 pinning/hold/resource-cap metrics를 포함합니다." },
      { symptom: "virtual thread 수를 늘리자 database가 먼저 과부하된다.", likelyCause: "cheap threads를 downstream capacity와 같은 것으로 오해하고 unbounded concurrency를 허용했습니다.", checks: ["connection pool wait와 DB saturation을 봅니다.", "in-flight requests를 셉니다.", "retry storm을 확인합니다."], fix: "semaphore/pool/admission control로 외부 resource concurrency를 제한합니다.", prevention: "각 dependency별 concurrency budget과 overload policy를 문서화합니다." },
    ],
    expertNotes: ["Virtual threads improve the scalability of blocking task representation; they do not make contended critical sections parallel or remove the need for backpressure.", "Pinning behavior is JDK-version-sensitive. The example and operational warning are explicitly scoped to Java 21, and production guidance must be revalidated after runtime upgrades."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...alternativesAndScaleChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class11-ex13", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex13_Synchronized.java", usedFor: ["shared x", "synchronized(this) loop50", "outside-lock ready/complete/sleep"], evidence: "네 threads가 한 Runnable의 x를 공유하고 block 단위로50회 출력하는 원본입니다." },
  { id: "java-class11-ex14", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex14_Main.java", usedFor: ["shared Ex13 instance", "dog/cat/tiger/lion launch"], evidence: "하나의 Runnable을 네 Thread에 전달하는 원본 runner입니다." },
  { id: "java-class11-ex17", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex17_Synchronized.java", usedFor: ["synchronized(this) loop100", "shared increment"], evidence: "두-thread 1..200 학습 목표의 Runnable 원본입니다." },
  { id: "java-class11-study01-thread", repository: "javastudy2 classstudy", path: "src/com/java/class11/Study01_Thread.java", usedFor: ["synchronized run method", "method monitor syntax"], evidence: "instance synchronized method로 loop100을 보호하는 원본입니다." },
  { id: "java-class11-ex18", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex18_Main.java", usedFor: ["Ex17 complementary runner", "dog/cat threads"], evidence: "inventory에서 누락됐지만 Ex17을 실제로 두 threads에서 실행하는 짝 파일입니다." },
  { id: "java-class11-study01", repository: "javastudy2 classstudy", path: "src/com/java/class11/Study01.java", usedFor: ["Study01_Thread complementary runner", "first/second threads"], evidence: "inventory에서 누락됐지만 Study01_Thread를 공유 실행하는 짝 파일입니다." },
  { id: "jdk21-javac", repository: "OpenJDK", path: "javac tool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-proc:none", "-Xlint:all warning0", "-XDrawDiagnostics"], evidence: "원본과 현대 examples의 compiler evidence 기준입니다." },
  { id: "powershell-environment", repository: "Microsoft Learn", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "hostile mode", "exact restore"], evidence: "audit parent/child environment isolation의 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirection", "working directory"], evidence: "safe child process launch 구성 근거입니다." },
  { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["remove launcher variables from child"], evidence: "hostile parent options를 child compile/run에서 차단하는 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "Kill process tree", "Dispose"], evidence: "원본 실행의 bounded lifecycle 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout/stderr drain"], evidence: "redirect pipe deadlock을 피하는 audit 구현 근거입니다." },
  { id: "java-thread-api", repository: "Java SE 21 API", path: "java.lang.Thread", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html", usedFor: ["start", "join", "interrupt status", "state", "virtual identity"], evidence: "worker lifecycle와 observation edge의 중심 API 근거입니다." },
  { id: "java-thread-builder", repository: "Java SE 21 API", path: "java.lang.Thread.Builder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.Builder.html", usedFor: ["platform/virtual thread builders", "thread construction policy"], evidence: "Java21 thread builder와 virtual-thread construction 근거입니다." },
  { id: "java-thread-holds-lock", repository: "Java SE 21 API", path: "Thread.holdsLock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html#holdsLock(java.lang.Object)", usedFor: ["runtime monitor ownership probe", "snapshot/render boundary"], evidence: "현재 thread의 object monitor ownership 확인 근거입니다." },
  { id: "java-object-api", repository: "Java SE 21 API", path: "java.lang.Object", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["intrinsic monitor ownership", "object identity"], evidence: "모든 객체와 monitor/wait set의 기본 API 근거입니다." },
  { id: "java-class-api", repository: "Java SE 21 API", path: "java.lang.Class", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html", usedFor: ["static synchronized Class monitor", "class-loader-scoped identity"], evidence: "Class object가 static guard가 되는 근거입니다." },
  { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["max critical-section depth", "max concurrent entry"], evidence: "example diagnostic maxima 계산 근거입니다." },
  { id: "java-count-down-latch", repository: "Java SE 21 API", path: "java.util.concurrent.CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["controlled interleaving", "start gate", "owner/release protocol", "memory consistency"], evidence: "sleep 없는 deterministic concurrency fixtures의 근거입니다." },
  { id: "java-array-list-api", repository: "Java SE 21 API", path: "java.util.ArrayList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html", usedFor: ["guarded mutable catalog", "local snapshot copy"], evidence: "mutable list ownership과 local sort example 근거입니다." },
  { id: "java-list-api", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["List.copyOf immutable snapshot", "first/last access"], evidence: "defensive unmodifiable snapshot API 근거입니다." },
  { id: "java-collections-api", repository: "Java SE 21 API", path: "java.util.Collections", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html", usedFor: ["canonical sort", "synchronized wrapper family"], evidence: "snapshot sorting과 synchronized collection utilities 근거입니다." },
  { id: "java-collections-synchronized-map", repository: "Java SE 21 API", path: "Collections.synchronizedMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html#synchronizedMap(java.util.Map)", usedFor: ["per-call synchronization", "manual wrapper synchronization for compound operation"], evidence: "returned map을 잠그는 wrapper contract 근거입니다." },
  { id: "java-map-api", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["containsKey/put compound action", "computeIfAbsent comparison"], evidence: "map operation contracts와 default atomicity 주의 근거입니다." },
  { id: "java-hash-map-api", repository: "Java SE 21 API", path: "java.util.HashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html", usedFor: ["synchronizedMap backing store", "non-thread-safe baseline"], evidence: "wrapper가 보호하는 backing map 특성 근거입니다." },
  { id: "java-concurrent-hash-map", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentHashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html", usedFor: ["per-key atomic compute", "mapping function constraints", "contention alternative"], evidence: "compound map operation 대안의 contract 근거입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["linearizable counter", "side-effect probe", "CAS update"], evidence: "단일 int atomic update와 memory effects 근거입니다." },
  { id: "java-long-adder", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.LongAdder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html", usedFor: ["striped statistics", "non-atomic concurrent sum", "high-contention comparison"], evidence: "통계 counter의 throughput/semantic tradeoff 근거입니다." },
  { id: "java-package-summary-concurrent", repository: "Java SE 21 API", path: "java.util.concurrent package", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html", usedFor: ["memory consistency effects", "high-level concurrency abstractions"], evidence: "concurrent utilities의 memory consistency와 선택 맥락 근거입니다." },
  { id: "java-reentrant-lock", repository: "Java SE 21 API", path: "java.util.concurrent.locks.ReentrantLock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html", usedFor: ["tryLock", "lockInterruptibly", "fairness", "reentrancy alternative"], evidence: "explicit acquisition policy와 finally unlock 근거입니다." },
  { id: "java-lock-interface", repository: "Java SE 21 API", path: "java.util.concurrent.locks.Lock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Lock.html", usedFor: ["explicit lock lifecycle", "memory synchronization", "interruptible/timed acquisition"], evidence: "Lock 구현 공통 contract 근거입니다." },
  { id: "java-condition-api", repository: "Java SE 21 API", path: "java.util.concurrent.locks.Condition", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Condition.html", usedFor: ["multiple condition queues comparison", "predicate wait boundary"], evidence: "ReentrantLock과 condition waiting의 연결 근거입니다." },
  { id: "java-thread-mx-bean", repository: "Java SE 21 API", path: "java.lang.management.ThreadMXBean", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html", usedFor: ["findDeadlockedThreads", "thread contention diagnostics"], evidence: "programmatic deadlock detection과 thread metrics 근거입니다." },
  { id: "java-management-factory", repository: "Java SE 21 API", path: "java.lang.management.ManagementFactory", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ManagementFactory.html", usedFor: ["ThreadMXBean acquisition", "platform management access"], evidence: "runtime management bean 접근 근거입니다." },
  { id: "jls-synchronized", repository: "Java Language Specification SE 21", path: "14.19 The synchronized Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.19", usedFor: ["monitor evaluation", "lock/unlock", "abrupt exit"], evidence: "synchronized statement 실행과 monitor 해제의 normative 근거입니다." },
  { id: "jls-happens-before", repository: "Java Language Specification SE 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["unlock-lock edge", "start/join edge", "data-race-free reasoning"], evidence: "visibility·ordering 관계의 normative 근거입니다." },
  { id: "jls-actions-order", repository: "Java Language Specification SE 21", path: "17.4.2 Actions and Action Orders", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.2", usedFor: ["read/write actions", "synchronization order", "execution model"], evidence: "lost update와 inter-thread actions 분석 근거입니다." },
  { id: "jls-final-field-semantics", repository: "Java Language Specification SE 21", path: "17.5 final Field Semantics", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5", usedFor: ["construction publication", "final field visibility", "this escape caveat"], evidence: "immutable safe initialization 설명의 normative 근거입니다." },
  { id: "jls-abrupt-completion", repository: "Java Language Specification SE 21", path: "14.1 Normal and Abrupt Completion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.1", usedFor: ["exceptional synchronized exit", "control-flow terminology"], evidence: "예외를 포함한 abrupt completion과 monitor exit 설명 근거입니다." },
  { id: "jep-444", repository: "OpenJDK", path: "JEP 444 Virtual Threads", publicUrl: "https://openjdk.org/jeps/444", usedFor: ["Java21 final virtual threads", "scheduler model", "pinning diagnostics"], evidence: "Java21 virtual thread 목적·API·pinning/JFR 설명의 설계 근거입니다." },
  { id: "java21-virtual-thread-guide", repository: "Oracle Java 21 Documentation", path: "Virtual Threads", publicUrl: "https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html", usedFor: ["thread-per-task guidance", "pinning and tracing", "scaling boundaries"], evidence: "Java21 운영 관점의 virtual-thread 사용 지침입니다." },
  { id: "jfr-virtual-thread-pinned", repository: "Oracle Java 21 Documentation", path: "Virtual thread pinning diagnostics", publicUrl: "https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html#GUID-2BCFC2DD-7D84-4B0C-9222-AD6740949E0E", usedFor: ["jdk.VirtualThreadPinned event", "jdk.tracePinnedThreads", "JDK21 scope"], evidence: "carrier pinning을 JFR/trace로 찾는 운영 근거입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "원본1장과 warning0 Java examples11을 포함한12 chapters로 race 재현부터 Java21 virtual-thread 운영 경계까지 단계적으로 확장했습니다.",
  "모든 positive Java example은 OpenJDK21 -encoding UTF-8 --release21 -proc:none -Xlint:all compiler output0와 exact stable stdout을 요구합니다.",
  "스레드 scheduling 순서는 canonical answer로 만들지 않고 latch-controlled interleaving 또는 join 이후 aggregate invariant로만 판정합니다.",
  "multi-JVM·database state는 synchronized의 보호 범위 밖임을 각 설계·진단 경로에서 명시했습니다.",
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "x++는 왜 atomic하지 않나요?", answer: "현재 값 read, 1 add, 결과 write의 복합 연산이어서 두 thread가 같은 old value를 읽고 update 하나를 덮어쓸 수 있기 때문입니다." },
  { question: "race condition과 data race는 같은 말인가요?", answer: "race condition은 timing에 따라 결과가 달라지는 넓은 개념이고 data race는 happens-before로 ordered되지 않은 conflicting memory accesses라는 JMM 조건입니다." },
  { question: "println이 line을 깨끗하게 출력하면 counter도 안전한가요?", answer: "아닙니다. println 내부 lock은 counter read-modify-write 전체를 같은 monitor로 보호하지 않습니다." },
  { question: "race test에서 sleep 대신 latch를 쓰는 이유는 무엇인가요?", answer: "관심 interleaving을 직접 만들고 machine 속도나 scheduler 우연에 따른 flaky 재현을 피하기 위해서입니다." },
  { question: "volatile int에 ++를 하면 lost update가 사라지나요?", answer: "아닙니다. volatile은 개별 read/write visibility를 제공하지만 복합 increment를 하나의 atomic action으로 만들지 않습니다." },
  { question: "instance synchronized method가 잠그는 대상은 무엇인가요?", answer: "호출 receiver인 this 객체의 intrinsic monitor입니다." },
  { question: "static synchronized method가 잠그는 대상은 무엇인가요?", answer: "declaring type의 Class object monitor입니다." },
  { question: "서로 다른 objects의 synchronized methods가 같은 static field를 보호하나요?", answer: "아닙니다. 서로 다른 this monitors이므로 static shared field에 동시에 접근할 수 있습니다." },
  { question: "private final lock을 쓰는 이유는 무엇인가요?", answer: "외부 code가 같은 lock을 장시간 획득하거나 순서를 뒤집는 accidental interference를 막고 ownership을 캡슐화하기 위해서입니다." },
  { question: "String literal을 lock으로 쓰면 무엇이 위험한가요?", answer: "interning으로 unrelated code와 같은 object를 공유해 예상하지 못한 contention이나 deadlock coupling이 생길 수 있습니다." },
  { question: "mutual exclusion과 visibility는 어떻게 다른가요?", answer: "mutual exclusion은 동시 진입을 제한하고 visibility는 앞선 writes를 뒤의 reader가 관찰하게 하는 memory-ordering 성질입니다." },
  { question: "monitor의 happens-before edge는 언제 생기나요?", answer: "한 monitor의 unlock action과 그 monitor를 뒤이어 lock하는 action 사이에 생깁니다." },
  { question: "writer만 synchronized면 충분한가요?", answer: "아닙니다. reader도 같은 lock 또는 다른 올바른 publication edge를 사용해야 writer effects를 계약대로 관찰합니다." },
  { question: "Thread.join은 visibility와 어떤 관계가 있나요?", answer: "thread의 모든 actions는 다른 thread가 그 thread의 join에서 성공적으로 반환하기 전에 happens-before합니다." },
  { question: "여러 fields를 coherent하게 읽으려면 어떻게 하나요?", answer: "같은 guard 아래에서 관계있는 fields를 한 번에 immutable snapshot으로 복사합니다." },
  { question: "synchronized는 reentrant인가요?", answer: "네. 현재 owner thread는 같은 monitor를 다시 획득해 nested synchronized call을 수행할 수 있습니다." },
  { question: "synchronized method에서 exception이 나면 monitor가 남나요?", answer: "아닙니다. abrupt exit에서도 monitor는 해제되지만 이미 변경된 business state는 자동 rollback되지 않습니다." },
  { question: "monitor 자동 해제와 exception safety가 다른 이유는 무엇인가요?", answer: "JVM은 lock lifecycle만 보장하고 partial mutation, 외부 side effect와 retry 의미는 application이 복구해야 하기 때문입니다." },
  { question: "intrinsic lock 진입을 interrupt로 취소할 수 있나요?", answer: "일반 synchronized monitor entry는 interruptible acquisition API가 아니므로 그 요구가 있으면 ReentrantLock.lockInterruptibly 등을 평가합니다." },
  { question: "critical section은 짧을수록 항상 옳나요?", answer: "아닙니다. invariant의 validate와 commit을 완전히 포함하는 최소 경계여야 하며 너무 줄여 atomicity를 깨면 안 됩니다." },
  { question: "느린 I/O를 lock 밖으로 옮기는 안전한 pattern은 무엇인가요?", answer: "guard 안에서 필요한 state를 immutable snapshot으로 만들고 lock을 푼 뒤 I/O·formatting·callback을 수행합니다." },
  { question: "내부 mutable list를 그대로 반환하면 왜 안 되나요?", answer: "caller가 guard 없이 변경하거나 concurrent iteration해 alias race와 invariant 손상을 만들 수 있기 때문입니다." },
  { question: "synchronizedMap의 containsKey와 put을 연달아 쓰면 atomic한가요?", answer: "각 호출은 thread-safe여도 두 호출 사이에는 다른 thread가 들어올 수 있으므로 compound action은 atomic하지 않습니다." },
  { question: "Collections.synchronizedMap의 compound operation은 무엇을 잠가야 하나요?", answer: "backing map이 아니라 Collections가 반환한 wrapper map 객체를 잠가야 합니다." },
  { question: "map size가1이면 생성 side effect도 한 번이라고 말할 수 있나요?", answer: "아닙니다. 두 threads가 각각 생성한 뒤 같은 key를 overwrite해 size1이면서 side effect2일 수 있습니다." },
  { question: "computeIfAbsent면 외부 결제가 exactly once가 되나요?", answer: "아닙니다. in-memory registration atomicity와 process crash/retry를 넘는 외부 exactly-once는 transaction·idempotency가 별도 필요합니다." },
  { question: "deadlock의 네 필요 조건은 무엇인가요?", answer: "mutual exclusion, hold-and-wait, no preemption, circular wait입니다." },
  { question: "global lock order는 deadlock을 어떻게 막나요?", answer: "모든 acquisition path가 같은 strict total order를 따르면 circular wait cycle이 형성될 수 없습니다." },
  { question: "identityHashCode만으로 total lock order를 만들면 충분한가요?", answer: "collision 가능성이 있으므로 tie lock 또는 immutable unique rank 같은 추가 규칙이 필요합니다." },
  { question: "deadlock test가 여러 번 통과하면 자유가 증명되나요?", answer: "아닙니다. global-order 같은 구조적 proof가 필요하고 stress test는 구현 drift를 찾는 보조 evidence입니다." },
  { question: "JVM synchronized로 여러 service instances의 DB row를 보호할 수 있나요?", answer: "아닙니다. JVM 밖 writers에는 database transaction, versioning 또는 single serialized owner가 필요합니다." },
  { question: "AtomicInteger가 synchronized보다 항상 좋은가요?", answer: "아닙니다. 단일 scalar atomic update에는 적합하지만 multi-field invariant와 arbitrary critical section은 lock/transaction이 필요합니다." },
  { question: "LongAdder는 언제 적합한가요?", answer: "높은 contention의 통계성 update에서 concurrent sum의 non-atomic snapshot을 허용할 때 적합합니다." },
  { question: "LongAdder로 unique sequence를 발급해도 되나요?", answer: "아닙니다. concurrent sum이 linearizable sequence contract를 제공하지 않습니다." },
  { question: "ReentrantLock을 선택할 이유는 무엇인가요?", answer: "timed/interruptible acquisition, tryLock, fairness option, multiple Conditions 같은 명시 기능이 실제로 필요할 때입니다." },
  { question: "ReentrantLock의 가장 중요한 lifecycle 규칙은 무엇인가요?", answer: "acquisition 성공 직후 try를 시작하고 finally에서 현재 thread가 획득한 lock을 정확히 한 번 unlock하는 것입니다." },
  { question: "fair ReentrantLock은 strict FIFO completion을 보장하나요?", answer: "아닙니다. 오래 기다린 thread를 선호하지만 scheduler와 tryLock 동작까지 strict FIFO 완료를 보장하지는 않습니다." },
  { question: "virtual thread는 data race를 자동으로 없애나요?", answer: "아닙니다. Thread가 lightweight해져도 shared mutable state에는 동일한 JMM synchronization이 필요합니다." },
  { question: "Java21에서 synchronized 안의 blocking이 virtual thread에 왜 문제인가요?", answer: "virtual thread가 carrier에서 unmount되지 못하고 pinned되어 carrier capacity와 monitor hold가 함께 병목될 수 있기 때문입니다." },
  { question: "virtual threads를 많이 만들면 downstream capacity도 늘어나나요?", answer: "아닙니다. database connections, sockets와 remote rate limits는 semaphore/pool/admission control로 별도 제한해야 합니다." },
);

(session.completionChecklist as string[]).push(
  "공유 mutable state owner를 식별했다.", "모든 conflicting access path를 inventory했다.",
  "++를 read·modify·write로 펼쳤다.", "lost update interleaving을 barrier로 재현했다.",
  "sleep 기반 flaky race 판정을 제거했다.", "workers completion을 join으로 보장했다.",
  "race condition과 data race를 구분했다.", "volatile visibility와 compound atomicity를 구분했다.",
  "각 synchronized의 실제 monitor identity를 표시했다.", "instance와 Class monitor를 구분했다.",
  "static state와 guard mapping을 검증했다.", "공개·interned object를 lock으로 쓰지 않았다.",
  "private lock ownership을 문서화했다.", "critical section이 전체 invariant를 포함한다.",
  "writer와 reader가 같은 synchronization discipline을 따른다.", "unlock→subsequent lock edge를 설명할 수 있다.",
  "start/join과 monitor edges를 구분했다.", "cross-field coherent snapshot을 만들었다.",
  "constructor this escape를 검사했다.", "diagnostic probes 자체도 thread-safe하다.",
  "synchronized 재진입을 검증했다.", "예외 뒤 monitor release를 검증했다.",
  "partial mutation rollback 정책을 정의했다.", "interrupt status와 ownership을 보존했다.",
  "lock 안 sleep을 제거했다.", "lock 안 network/file I/O를 제거했다.",
  "lock 안 external callback을 제거했다.", "formatting과 logging을 snapshot 뒤로 옮겼다.",
  "immutable defensive copy를 반환한다.", "snapshot copy 비용을 예산화했다.",
  "monitor wait와 hold 시간을 분리 측정한다.", "p50·p95·p99 contention 기준을 정의했다.",
  "개별 atomic method와 compound action을 구분했다.", "check→act 전체 linearization point를 정했다.",
  "collection wrapper의 정확한 lock identity를 사용했다.", "side-effect count와 final size를 따로 검증했다.",
  "compute callback의 blocking·recursion을 review했다.", "외부 exactly-once에 idempotency/transaction을 적용했다.",
  "multi-lock acquisition graph를 그렸다.", "immutable unique global lock order를 적용했다.",
  "identityHashCode collision policy를 검토했다.", "opposite-direction transfer fixture를 실행했다.",
  "cross-object conservation invariant를 검증했다.", "deadlock thread dump 수집 절차가 있다.",
  "ThreadMXBean deadlock 진단을 연결했다.", "JVM-local lock의 process 경계를 명시했다.",
  "AtomicInteger의 linearizable 요구를 확인했다.", "LongAdder concurrent sum 제약을 확인했다.",
  "multi-field atomics를 transaction으로 오해하지 않았다.", "counter overflow 정책을 정의했다.",
  "microbenchmark는 JMH로 분리한다.", "ReentrantLock 선택 이유가 명시적이다.",
  "lock 성공 직후 try/finally를 사용한다.", "tryLock 실패 fallback을 정의했다.",
  "interruptible/timed acquisition 계약을 정의했다.", "fairness와 throughput을 함께 측정했다.",
  "virtual-thread tasks를 모두 join했다.", "Java21 pinning evidence를 수집한다.",
  "virtual-thread 수와 downstream concurrency를 분리 제한한다.", "runtime upgrade 뒤 pinning guidance를 재검증한다.",
);
